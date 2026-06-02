import { describe, it, expect } from 'vitest';
import { guessit } from '../src/index.js';

// #272 (archive containers) and #273 (metadata/image files): the extension must
// be recognised as a container and must NOT leak into release_group/title/etc.
describe('#272 archive containers', () => {
  it('recognises archive extensions and stops the leak', () => {
    expect(guessit('Show.Name.S01E01.720p.HDTV.x264-GRP.rar')).toMatchObject({
      release_group: 'GRP', container: 'rar',
    });
    expect(guessit('Movie.2020.1080p.x264.r00').container).toBe('r00'); // split volume
    expect(guessit('Movie.2020.1080p.x264.r00').release_group).toBeUndefined();
    expect(guessit('Show.S01E01.7z').container).toBe('7z');
    expect(guessit('Show.S01E01.7z').episode_title).toBeUndefined();
    expect(guessit('Movie.2020.1080p-GRP.zip')).toMatchObject({ release_group: 'GRP', container: 'zip' });
  });
});

describe('#273 image / metadata files', () => {
  it('recognises image extensions and stops the leak', () => {
    expect(guessit('Show.S01E01.720p-GRP.jpg')).toMatchObject({ release_group: 'GRP', container: 'jpg' });
  });

  it('classifies artwork files via `other`', () => {
    expect(guessit('poster.jpg')).toMatchObject({ other: 'Poster', container: 'jpg' });
    expect(guessit('Movie.2020-fanart.jpg')).toMatchObject({ title: 'Movie', other: 'Fanart' });
    expect(guessit('banner.jpg').other).toBe('Banner');
    expect(guessit('Show.S01-thumb.tbn').other).toBe('Thumbnail');
  });

  it('does NOT clobber a real video title containing an artwork word', () => {
    const r = guessit('The.Poster.2020.1080p.BluRay.x264-GRP.mkv');
    expect(r.title).toBe('The Poster');
    expect(r.other).toBeUndefined();
  });
});
