/**
 * Audio codec property patterns and rules — port of guessit/rules/properties/audio_codec.py
 */
import { Rebulk, Rule, RemoveMatch, AppendMatch } from 'rebulk-js';
import { Match } from 'rebulk-js';
import type { Matches } from 'rebulk-js';
import type { Context } from 'rebulk-js';
import { dash } from '../common/index.js';
import { isDisabled } from '../common/pattern.js';
import { sepsBefore, sepsAfter, sepsSurround } from '../common/validators.js';
import { loadConfigPatterns } from '../../config/index.js';

export function audioCodec(config: Record<string, unknown>): Rebulk {
  const rebulk = new Rebulk();

  rebulk.regexDefaults({
    flags: 'i',
    abbreviations: [dash],
  });
  rebulk.stringDefaults({ ignoreCase: true });

  // Load audio_codec patterns from config
  rebulk.defaults({
    name: 'audio_codec',
    tags: ['source-suffix', 'streaming_service.suffix'],
    disabled: (context: Context) => isDisabled(context, 'audio_codec'),
  });
  loadConfigPatterns(rebulk, config['audio_codec'] as Record<string, unknown>);

  // Load audio_profile patterns from config
  rebulk.defaults({
    clear: true,
    name: 'audio_profile',
    validator: sepsSurround,
    disabled: (context: Context) => isDisabled(context, 'audio_profile'),
  });
  loadConfigPatterns(rebulk, config['audio_profile'] as Record<string, unknown>);

  // Load audio_channels patterns from config
  rebulk.defaults({
    clear: true,
    name: 'audio_channels',
    disabled: (context: Context) => isDisabled(context, 'audio_channels'),
  });
  loadConfigPatterns(rebulk, config['audio_channels'] as Record<string, unknown>);

  // Compound codec+profile functional patterns (e.g. DTSES, HE-AAC)
  function findCompoundAudio(input: string): Array<[number, number, Record<string, unknown>]> {
    const results: Array<[number, number, Record<string, unknown>]> = [];
    const patterns: Array<{ regex: RegExp; codec: string; profile: string }> = [
      { regex: /DTS-?ES/gi, codec: 'DTS', profile: 'Extended Surround' },
      { regex: /DTS-?MA/gi, codec: 'DTS-HD', profile: 'Master Audio' },
      { regex: /HE-?AAC/gi, codec: 'AAC', profile: 'High Efficiency' },
      { regex: /DD-?EX/gi, codec: 'Dolby Digital', profile: 'EX' },
    ];
    for (const p of patterns) {
      let m: RegExpExecArray | null;
      while ((m = p.regex.exec(input)) !== null) {
        results.push([m.index, m.index + m[0].length, { value: p.codec, tags: ['compound-audio'] }]);
      }
    }
    return results;
  }

  rebulk.functional(findCompoundAudio, {
    name: 'audio_codec',
    disabled: (context: Context) => isDisabled(context, 'audio_codec'),
  });

  rebulk.rules(
    CompoundAudioProfileRule,
    DtsHDRule,
    DtsRule,
    AacRule,
    DolbyDigitalRule,
    HqConflictRule,
    AudioValidatorRule,
    AudioChannelsValidatorRule,
  );

  return rebulk;
}

const COMPOUND_PROFILES: Record<string, string> = {
  'DTS': 'Extended Surround',
  'DTS-HD': 'Master Audio',
  'AAC': 'High Efficiency',
  'Dolby Digital': 'EX',
};

class CompoundAudioProfileRule extends Rule {
  static consequence = AppendMatch;

  enabled(context: Context): boolean {
    return !isDisabled(context, 'audio_profile');
  }

  when(matches: Matches): Match | undefined {
    const codecs = matches.named('audio_codec') as Match[];
    for (const codec of codecs) {
      // Check compound-audio tagged matches first
      if (codec.tags?.includes('compound-audio')) {
        const profileValue = COMPOUND_PROFILES[String(codec.value)];
        if (profileValue) {
          const profile = new Match(codec.start, codec.end, {
            name: 'audio_profile',
            value: profileValue,
            inputString: codec.inputString,
          });
          return profile;
        }
      }
      // Also check DTS-HD matches whose raw text contains "MA" (e.g. "DTSMA", "DTS-MA")
      // or if "MA" immediately follows the DTS-HD match (e.g. "DTS-HD.MA5.1")
      if (String(codec.value) === 'DTS-HD') {
        const raw = (codec.raw ?? codec.inputString?.slice(codec.start, codec.end) ?? '').toUpperCase();
        if (/MA/.test(raw)) {
          const profile = new Match(codec.start, codec.end, {
            name: 'audio_profile',
            value: 'Master Audio',
            inputString: codec.inputString,
          });
          return profile;
        }
        // Check if "MA" follows right after (with optional separator)
        const inputStr = codec.inputString ?? '';
        const afterCodec = inputStr.slice(codec.end, codec.end + 4).toUpperCase();
        if (/^[.\-_\s]?MA(?!\w*[b-ln-z])/i.test(afterCodec)) {
          const maStart = codec.end + (afterCodec.match(/^[.\-_\s]/) ? 1 : 0);
          const profile = new Match(maStart, maStart + 2, {
            name: 'audio_profile',
            value: 'Master Audio',
            inputString: codec.inputString,
          });
          return profile;
        }
      }
    }
  }
}

abstract class AudioProfileRule extends Rule {
  static consequence = RemoveMatch;
  abstract codecName: string;

  enabled(context: Context): boolean {
    return !isDisabled(context, 'audio_profile');
  }

  when(matches: Matches, _context: Context): Match[] | false {
    const ret: Match[] = [];
    const profiles = matches.named('audio_profile') as Match[];
    const hasResult = (v: any) => v && (!Array.isArray(v) || v.length > 0);

    for (const profile of profiles) {
      // Only check profiles that belong to this codec (via tags)
      if (!profile.tags.includes(this.codecName)) continue;

      let codec: any = matches.atSpan(profile.span, (m: Match) => m.name === `audio_codec` && m.value === this.codecName);
      if (!hasResult(codec)) {
        // Check IMMEDIATELY previous and next matches only (not scanning far away).
        // In Python rebulk, previous/next return the nearest match; the JS version
        // should do the same but currently scans further. So we check the immediate
        // neighbor and verify it's the right codec.
        const prevMatch = matches.previous(profile, (m: Match) => !m.private, 0) as Match | undefined;
        if (prevMatch && prevMatch.name === 'audio_codec' && prevMatch.value === this.codecName) {
          codec = prevMatch;
        }
      }
      if (!hasResult(codec)) {
        const nextMatch = matches.next(profile, (m: Match) => !m.private, 0) as Match | undefined;
        if (nextMatch && nextMatch.name === 'audio_codec' && nextMatch.value === this.codecName) {
          codec = nextMatch;
        }
      }
      if (!hasResult(codec)) {
        ret.push(profile);
      }
    }

    return ret.length > 0 ? ret : false;
  }
}

class DtsHDRule extends AudioProfileRule {
  codecName = 'DTS-HD';
}

class DtsRule extends AudioProfileRule {
  codecName = 'DTS';
}

class AacRule extends AudioProfileRule {
  codecName = 'AAC';
}

class DolbyDigitalRule extends AudioProfileRule {
  codecName = 'Dolby Digital';
}

class HqConflictRule extends Rule {
  static consequence = RemoveMatch;

  enabled(context: Context): boolean {
    return !isDisabled(context, 'audio_profile');
  }

  when(matches: Matches, _context: Context): Match[] {
    const ret: Match[] = [];
    const others = matches.named('other');
    const hqProfiles = (matches.named('audio_profile', (m) => m.value === 'High Quality') as Match[]) ?? [];

    for (const hq of hqProfiles) {
      for (const other of others) {
        if (other.span[0] === hq.span[0] && other.span[1] === hq.span[1]) {
          ret.push(other);
        }
      }
    }

    return ret;
  }
}

class AudioValidatorRule extends Rule {
  static priority = 64;
  static consequence = RemoveMatch;

  enabled(context: Context): boolean {
    return !isDisabled(context, 'audio_codec') && !isDisabled(context, 'audio_profile');
  }

  when(matches: Matches, _context: Context): Match[] {
    const ret: Match[] = [];
    const audioProps = [...matches.named('audio_codec'), ...matches.named('audio_profile')];

    for (const prop of audioProps) {
      if (!sepsBefore(prop)) {
        const prevMatch = matches.atIndex(prop.start - 1, null, 0) as Match | undefined;
        if (!prevMatch || (prevMatch.name !== 'audio_codec' && prevMatch.name !== 'audio_profile')) {
          ret.push(prop);
        }
      } else if (!sepsAfter(prop)) {
        const nextMatch = matches.atIndex(prop.end + 1, null, 0) as Match | undefined;
        if (!nextMatch || (nextMatch.name !== 'audio_codec' && nextMatch.name !== 'audio_profile' && nextMatch.name !== 'audio_channels')) {
          ret.push(prop);
        }
      }
    }

    return ret;
  }
}

class AudioChannelsValidatorRule extends Rule {
  static priority = 128;
  static consequence = RemoveMatch;

  enabled(context: Context): boolean {
    return !isDisabled(context, 'audio_channels');
  }

  when(matches: Matches, _context: Context): Match[] {
    const ret: Match[] = [];
    const weakChannels = (matches.named('audio_channels', (m) => m.tags.includes('weak-audio_channels')) as Match[]) ?? [];

    for (const channels of weakChannels) {
      const prevCodec = matches.previous(channels, (m) => m.name === `audio_codec`);
      if (!prevCodec) {
        ret.push(channels);
      }
    }

    return ret;
  }
}
