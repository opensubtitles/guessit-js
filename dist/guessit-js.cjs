"use strict";
var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
function defaultFormatter(value) {
  return value;
}
function formatters(...fns) {
  return (value) => {
    let result = value;
    for (const fn of fns) {
      result = fn(result);
    }
    return result;
  };
}
function ensureList(param) {
  if (!param) return [];
  if (Array.isArray(param)) return param;
  return [param];
}
function ensureDict(param, defaultValue, defaultKey = null) {
  if (!param) {
    param = defaultValue;
  }
  if (typeof param !== "object" || param === null || Array.isArray(param)) {
    if (param) {
      defaultValue = param;
    }
    const key = defaultKey ?? void 0;
    return [{ [key]: param }, defaultValue];
  }
  const asObj = param;
  return [asObj, defaultValue];
}
function filterIndex(collection, predicate, index) {
  if (typeof predicate === "number") {
    index = predicate;
    predicate = null;
  }
  let result = predicate ? collection.filter(predicate) : [...collection];
  if (index !== null && index !== void 0) {
    if (index < 0) return result[result.length + index];
    return result[index];
  }
  return result;
}
function setDefaults(defaults, kwargs, override = false) {
  if ("clear" in defaults && defaults["clear"]) {
    for (const key of Object.keys(kwargs)) delete kwargs[key];
    delete defaults["clear"];
  }
  for (const [key, value] of Object.entries(defaults)) {
    if (key in kwargs) {
      if (Array.isArray(value) && Array.isArray(kwargs[key])) {
        kwargs[key] = [...value, ...kwargs[key]];
        continue;
      }
      if (value && typeof value === "object" && !Array.isArray(value) && kwargs[key] && typeof kwargs[key] === "object" && !Array.isArray(kwargs[key])) {
        setDefaults(value, kwargs[key]);
        continue;
      }
    }
    if (!(key in kwargs) || override) {
      kwargs[key] = value;
    }
  }
}
function isIterable(obj) {
  if (obj === null || obj === void 0) return false;
  if (typeof obj === "string") return false;
  return typeof obj[Symbol.iterator] === "function";
}
function* findAll(string, sub, start = 0, end, ignoreCase = false) {
  let haystack = string;
  let needle = sub;
  if (ignoreCase) {
    haystack = haystack.toLowerCase();
    needle = needle.toLowerCase();
  }
  const limit = end !== void 0 ? end : haystack.length;
  let idx = start;
  while (true) {
    const found = haystack.indexOf(needle, idx);
    if (found === -1 || found >= limit) return;
    yield found;
    idx = found + needle.length;
  }
}
function getFirstDefined(data, keys, defaultValue = void 0) {
  for (const key of keys) {
    if (key !== null && key !== void 0 && key in data) {
      return data[key];
    }
  }
  return defaultValue;
}
function extendSafe(target, source2) {
  for (const elt of source2) {
    if (!target.includes(elt)) {
      target.push(elt);
    }
  }
}
class IdentitySet {
  constructor(items) {
    __publicField(this, "_map", /* @__PURE__ */ new Map());
    if (items) {
      for (const item of items) this.add(item);
    }
  }
  add(value) {
    this._map.set(value, true);
    return this;
  }
  delete(value) {
    return this._map.delete(value);
  }
  has(value) {
    return this._map.has(value);
  }
  get size() {
    return this._map.size;
  }
  [Symbol.iterator]() {
    return this._map.keys();
  }
}
function alwaysTrue(_match) {
  return true;
}
function charsBefore(chars, match) {
  if (!match.inputString) return true;
  const idx = match.start - 1;
  if (idx < 0) return true;
  return chars.includes(match.inputString[idx]);
}
function charsAfter(chars, match) {
  if (!match.inputString) return true;
  const idx = match.end;
  if (idx >= match.inputString.length) return true;
  return chars.includes(match.inputString[idx]);
}
function charsSurround(chars, match) {
  return charsBefore(chars, match) && charsAfter(chars, match);
}
function definedAt() {
  return void 0;
}
class Match {
  constructor(start, end, opts = {}) {
    __publicField(this, "start");
    __publicField(this, "end");
    __publicField(this, "name");
    __publicField(this, "tags");
    __publicField(this, "marker");
    __publicField(this, "private");
    __publicField(this, "inputString");
    __publicField(this, "formatter");
    __publicField(this, "pattern");
    __publicField(this, "parent");
    __publicField(this, "conflictSolver");
    __publicField(this, "defined_at");
    /** Index within the sequence of matches produced by the same pattern. */
    __publicField(this, "matchIndex", 0);
    __publicField(this, "_value");
    __publicField(this, "_children");
    __publicField(this, "_rawStart");
    __publicField(this, "_rawEnd");
    this.start = start;
    this.end = end;
    this.name = opts.name;
    this.tags = ensureList(opts.tags);
    this.marker = opts.marker ?? false;
    this.private = opts.private ?? false;
    this.inputString = opts.inputString;
    this.formatter = opts.formatter;
    this._value = opts.value;
    this.conflictSolver = opts.conflictSolver;
    this.pattern = opts.pattern;
    this.parent = opts.parent;
    this.defined_at = opts.pattern ? opts.pattern.defined_at : definedAt();
  }
  get span() {
    return [this.start, this.end];
  }
  get rawStart() {
    return this._rawStart !== void 0 ? this._rawStart : this.start;
  }
  set rawStart(v) {
    this._rawStart = v;
  }
  get rawEnd() {
    return this._rawEnd !== void 0 ? this._rawEnd : this.end;
  }
  set rawEnd(v) {
    this._rawEnd = v;
  }
  get raw() {
    if (this.inputString !== void 0) {
      return this.inputString.slice(this.rawStart, this.rawEnd);
    }
    return void 0;
  }
  get value() {
    if (this._value) return this._value;
    if (this.formatter && typeof this.formatter === "function") return this.formatter(this.raw ?? "");
    return this.raw;
  }
  set value(v) {
    this._value = v;
  }
  get children() {
    if (!this._children) {
      this._children = new Matches(void 0, this.inputString);
    }
    return this._children;
  }
  set children(v) {
    this._children = v;
  }
  /** All property names in this match (recursing into children). */
  get names() {
    if (!this._children || this._children.length === 0) {
      return this.name ? /* @__PURE__ */ new Set([this.name]) : /* @__PURE__ */ new Set();
    }
    const ret = /* @__PURE__ */ new Set();
    for (const child of this._children) {
      for (const n of child.names) ret.add(n);
    }
    return ret;
  }
  /** Walk up to the root (top-most parent). */
  get initiator() {
    let m = this;
    while (m.parent) m = m.parent;
    return m;
  }
  get length() {
    return this.end - this.start;
  }
  /** Check if this match has at least one of the given tags. */
  tagged(...tags) {
    return tags.some((t) => this.tags.includes(t));
  }
  /** Check if any child (recursive) has one of the given names. */
  named(...names) {
    return names.some((n) => this.names.has(n));
  }
  /**
   * Crop this match with the given spans/matches.
   * Returns a list of Match fragments after subtracting the crop regions.
   */
  crop(crops, predicate, index) {
    const cropsArr = Array.isArray(crops) && crops.length === 2 && typeof crops[0] === "number" ? [crops] : Array.isArray(crops) ? crops : [crops];
    const initial = this._clone();
    let ret = [initial];
    for (const crop of cropsArr) {
      const [cStart, cEnd] = "span" in crop ? crop.span : crop;
      for (const current of [...ret]) {
        if (cStart <= current.start && cEnd >= current.end) {
          ret.splice(ret.indexOf(current), 1);
        } else if (cStart >= current.start && cEnd <= current.end) {
          const right = current._clone();
          current.end = cStart;
          if (current.length === 0) ret.splice(ret.indexOf(current), 1);
          right.start = cEnd;
          if (right.length > 0) ret.push(right);
        } else if (current.end >= cEnd && cEnd > current.start) {
          current.start = cEnd;
        } else if (current.start <= cStart && cStart < current.end) {
          current.end = cStart;
        }
      }
    }
    return filterIndex(ret, predicate ?? null, index ?? null);
  }
  /**
   * Split this match into multiple matches at each separator character.
   */
  split(seps2, predicate, index) {
    const ret = [];
    let currentStart = null;
    for (let i = 0; i < (this.raw?.length ?? 0); i++) {
      const char = this.raw[i];
      if (seps2.includes(char)) {
        if (currentStart !== null) {
          const m = this._clone();
          m.start = this.start + currentStart;
          m.end = this.start + i;
          ret.push(m);
          currentStart = null;
        }
      } else {
        if (currentStart === null) currentStart = i;
      }
    }
    if (currentStart !== null) {
      const m = this._clone();
      m.start = this.start + currentStart;
      ret.push(m);
    }
    return filterIndex(ret, predicate ?? null, index ?? null);
  }
  clone() {
    return this._clone();
  }
  _clone() {
    const m = new Match(this.start, this.end, {
      name: this.name,
      tags: [...this.tags],
      marker: this.marker,
      private: this.private,
      inputString: this.inputString,
      formatter: this.formatter,
      value: this._value,
      conflictSolver: this.conflictSolver,
      pattern: this.pattern,
      parent: this.parent
    });
    m.matchIndex = this.matchIndex;
    m._rawStart = this._rawStart;
    m._rawEnd = this._rawEnd;
    return m;
  }
  /** Equality by span, value, name, parent identity. */
  equals(other2) {
    return this.start === other2.start && this.end === other2.end && this.value === other2.value && this.name === other2.name && this.parent === other2.parent;
  }
  toString() {
    let flags = "";
    const initiatorVal = this.initiator.value;
    if (initiatorVal !== this.value) flags += `+initiator=${String(initiatorVal)}`;
    if (this.private) flags += "+private";
    const name = this.name ? `+name=${this.name}` : "";
    const tags = this.tags.length ? `+tags=${JSON.stringify(this.tags)}` : "";
    const defined = this.defined_at ? `@${this.defined_at.filename.split("/").pop()}#L${this.defined_at.lineno}` : "";
    return `<${String(this.value)}:(${this.start}, ${this.end})${flags}${name}${tags}${defined}>`;
  }
}
class MatchesDict extends Map {
  constructor() {
    super(...arguments);
    /** Keyed by property name → all Match objects for that name. */
    __publicField(this, "matches", /* @__PURE__ */ new Map());
    /** Keyed by property name → unique values (de-duped). */
    __publicField(this, "valuesList", /* @__PURE__ */ new Map());
  }
}
class _BaseMatches {
  constructor(matches, inputString) {
    __publicField(this, "inputString");
    __publicField(this, "_delegate", []);
    __publicField(this, "_maxEnd", 0);
    // Lazy lookup caches (null = not yet built)
    __publicField(this, "_nameDict", null);
    __publicField(this, "_tagDict", null);
    __publicField(this, "_startDict", null);
    __publicField(this, "_endDict", null);
    __publicField(this, "_indexDict", null);
    this.inputString = inputString;
    if (matches) this.extend(matches);
  }
  get length() {
    return this._delegate.length;
  }
  [Symbol.iterator]() {
    return this._delegate[Symbol.iterator]();
  }
  toArray() {
    return [...this._delegate];
  }
  // ── Cache accessors ──────────────────────────────────────────────────────
  get nameDict() {
    if (!this._nameDict) {
      this._nameDict = /* @__PURE__ */ new Map();
      for (const m of this._delegate) {
        if (m.name) {
          const arr = this._nameDict.get(m.name) ?? [];
          arr.push(m);
          this._nameDict.set(m.name, arr);
        }
      }
    }
    return this._nameDict;
  }
  get startDict() {
    if (!this._startDict) {
      this._startDict = /* @__PURE__ */ new Map();
      for (const m of this._delegate) {
        const arr = this._startDict.get(m.start) ?? [];
        arr.push(m);
        this._startDict.set(m.start, arr);
      }
    }
    return this._startDict;
  }
  get endDict() {
    if (!this._endDict) {
      this._endDict = /* @__PURE__ */ new Map();
      for (const m of this._delegate) {
        const arr = this._endDict.get(m.end) ?? [];
        arr.push(m);
        this._endDict.set(m.end, arr);
      }
    }
    return this._endDict;
  }
  get tagDict() {
    if (!this._tagDict) {
      this._tagDict = /* @__PURE__ */ new Map();
      for (const m of this._delegate) {
        for (const tag of m.tags) {
          const arr = this._tagDict.get(tag) ?? [];
          arr.push(m);
          this._tagDict.set(tag, arr);
        }
      }
    }
    return this._tagDict;
  }
  get indexDict() {
    if (!this._indexDict) {
      this._indexDict = /* @__PURE__ */ new Map();
      for (const m of this._delegate) {
        for (let i = m.start; i < m.end; i++) {
          const arr = this._indexDict.get(i) ?? [];
          arr.push(m);
          this._indexDict.set(i, arr);
        }
      }
    }
    return this._indexDict;
  }
  get maxEnd() {
    return this.inputString ? Math.max(this.inputString.length, this._maxEnd) : this._maxEnd;
  }
  // ── Mutations ─────────────────────────────────────────────────────────────
  _addMatch(match) {
    if (this._nameDict && match.name) {
      const arr = this._nameDict.get(match.name) ?? [];
      arr.push(match);
      this._nameDict.set(match.name, arr);
    }
    if (this._tagDict) {
      for (const tag of match.tags) {
        const arr = this._tagDict.get(tag) ?? [];
        arr.push(match);
        this._tagDict.set(tag, arr);
      }
    }
    if (this._startDict) {
      const arr = this._startDict.get(match.start) ?? [];
      arr.push(match);
      this._startDict.set(match.start, arr);
    }
    if (this._endDict) {
      const arr = this._endDict.get(match.end) ?? [];
      arr.push(match);
      this._endDict.set(match.end, arr);
    }
    if (this._indexDict) {
      for (let i = match.start; i < match.end; i++) {
        const arr = this._indexDict.get(i) ?? [];
        arr.push(match);
        this._indexDict.set(i, arr);
      }
    }
    if (match.end > this._maxEnd) this._maxEnd = match.end;
  }
  _removeMatch(match) {
    if (this._nameDict && match.name) {
      const arr = this._nameDict.get(match.name);
      if (arr) {
        const idx = arr.findIndex((m) => m === match);
        if (idx !== -1) arr.splice(idx, 1);
      }
    }
    if (this._tagDict) {
      for (const tag of match.tags) {
        const arr = this._tagDict.get(tag);
        if (arr) {
          const idx = arr.findIndex((m) => m === match);
          if (idx !== -1) arr.splice(idx, 1);
        }
      }
    }
    if (this._startDict) {
      const arr = this._startDict.get(match.start);
      if (arr) {
        const idx = arr.findIndex((m) => m === match);
        if (idx !== -1) arr.splice(idx, 1);
      }
    }
    if (this._endDict) {
      const arr = this._endDict.get(match.end);
      if (arr) {
        const idx = arr.findIndex((m) => m === match);
        if (idx !== -1) arr.splice(idx, 1);
      }
    }
    if (this._indexDict) {
      for (let i = match.start; i < match.end; i++) {
        const arr = this._indexDict.get(i);
        if (arr) {
          const idx = arr.findIndex((m) => m === match);
          if (idx !== -1) arr.splice(idx, 1);
        }
      }
    }
    if (match.end >= this._maxEnd) {
      this._maxEnd = 0;
      for (const m of this._delegate) {
        if (m.end > this._maxEnd) this._maxEnd = m.end;
      }
    }
  }
  append(match) {
    this._delegate.push(match);
    this._addMatch(match);
  }
  extend(matches) {
    for (const m of matches) this.append(m);
  }
  remove(match) {
    const idx = this._delegate.findIndex((m) => m === match);
    if (idx !== -1) {
      this._delegate.splice(idx, 1);
      this._removeMatch(match);
    }
  }
  includes(match) {
    return this._delegate.some((m) => m === match || m.equals(match));
  }
  at(index) {
    return this._delegate[index];
  }
  get(index) {
    return this._delegate[index];
  }
  clear() {
    this._delegate.length = 0;
    this._nameDict = null;
    this._tagDict = null;
    this._startDict = null;
    this._endDict = null;
    this._indexDict = null;
    this._maxEnd = 0;
  }
  slice(start, end) {
    return new Matches(this._delegate.slice(start, end), this.inputString);
  }
  deleteSlice(start, end) {
    const removed = this._delegate.splice(start, end - start);
    for (const m of removed) this._removeMatch(m);
  }
  setSlice(start, end, ...items) {
    const removed = this._delegate.splice(start, end - start, ...items);
    for (const m of removed) this._removeMatch(m);
    for (const m of items) this._addMatch(m);
  }
  setAt(index, match) {
    const old = this._delegate[index];
    if (old) this._removeMatch(old);
    this._delegate[index] = match;
    this._addMatch(match);
  }
  insert(index, match) {
    this._delegate.splice(index, 0, match);
    this._addMatch(match);
  }
  sort() {
    return [...this._delegate].sort((a, b) => {
      if (a.start !== b.start) return a.start - b.start;
      return a.end - b.end;
    });
  }
  named(name, predicate, index) {
    const arr = this.nameDict.get(name) ?? [];
    return filterIndex(arr, predicate, index);
  }
  tagged(tag, predicate, index) {
    const arr = this.tagDict.get(tag) ?? [];
    return filterIndex(arr, predicate, index);
  }
  starting(start, predicate, index) {
    const arr = this.startDict.get(start) ?? [];
    return filterIndex(arr, predicate, index);
  }
  ending(end, predicate, index) {
    const arr = this.endDict.get(end) ?? [];
    return filterIndex(arr, predicate, index);
  }
  atIndex(pos, predicate, index) {
    const arr = this.indexDict.get(pos) ?? [];
    return filterIndex(arr, predicate, index);
  }
  atSpan(span, predicate, index) {
    const starting = this.indexDict.get(span[0]) ?? [];
    const ending = this.indexDict.get(span[1] - 1) ?? [];
    const merged = [...starting];
    for (const m of ending) {
      if (!merged.includes(m)) merged.push(m);
    }
    return filterIndex(merged, predicate, index);
  }
  atMatch(match, predicate, index) {
    return this.atSpan(match.span, predicate, index);
  }
  range(start = 0, end, predicate, index) {
    const limit = end !== void 0 ? Math.min(this.maxEnd, end) : this.maxEnd;
    const ret = [];
    for (const m of this.sort()) {
      if (m.start < limit && m.end > start) {
        if (!predicate || predicate(m)) ret.push(m);
      }
    }
    return filterIndex(ret, null, index);
  }
  /** Nearest match ending just before (or at) `match.start`. */
  previous(match, predicate, index) {
    let current = match.start;
    while (current > -1) {
      const prev = this.ending(current);
      if (prev.length > 0) return filterIndex(prev, predicate, index);
      current--;
    }
    return filterIndex([], predicate, index);
  }
  /** Nearest match starting after `match.start`. */
  next(match, predicate, index) {
    let current = match.start + 1;
    while (current <= this.maxEnd) {
      const nxt = this.starting(current);
      if (nxt.length > 0) return filterIndex(nxt, predicate, index);
      current++;
    }
    return filterIndex([], predicate, index);
  }
  /** All matches that overlap with `match`. */
  conflicting(match, predicate, index) {
    const ret = [];
    const seen = /* @__PURE__ */ new Set();
    for (let i = match.start; i < match.end; i++) {
      for (const m of this.indexDict.get(i) ?? []) {
        if (m !== match && !seen.has(m)) {
          seen.add(m);
          ret.push(m);
        }
      }
    }
    return filterIndex(ret, predicate, index);
  }
  /** Matches chained before `position` separated only by chars in `seps`. */
  chainBefore(position, seps2, start = 0, predicate, index) {
    const pos = typeof position === "number" ? position : position.start;
    const chain = [];
    for (let i = Math.min(this.maxEnd, pos) - 1; i >= start; i--) {
      const atI = this.indexDict.get(i) ?? [];
      const filtered = predicate ? atI.filter(predicate) : [...atI];
      if (filtered.length > 0) {
        for (const m of filtered) {
          if (!chain.includes(m)) chain.push(m);
        }
      } else if (!this.inputString || !seps2.includes(this.inputString[i])) {
        break;
      }
    }
    return filterIndex(chain, null, index);
  }
  /** Matches chained after `position` separated only by chars in `seps`. */
  chainAfter(position, seps2, end, predicate, index) {
    const pos = typeof position === "number" ? position : position.end;
    const limit = end !== void 0 ? Math.min(this.maxEnd, end) : this.maxEnd;
    const chain = [];
    for (let i = pos; i < limit; i++) {
      const atI = this.indexDict.get(i) ?? [];
      const filtered = predicate ? atI.filter(predicate) : [...atI];
      if (filtered.length > 0) {
        for (const m of filtered) {
          if (!chain.includes(m)) chain.push(m);
        }
      } else if (!this.inputString || !seps2.includes(this.inputString[i])) {
        break;
      }
    }
    return filterIndex(chain, null, index);
  }
  /** All "hole" matches (gaps not covered by any existing match). */
  holes(start = 0, end, opts = {}) {
    const { formatter, ignore, seps: seps2, predicate, index } = opts;
    const limit = end !== void 0 ? Math.min(this.maxEnd, end) : this.maxEnd;
    const ret = [];
    let hole = false;
    let loopStart = 0;
    for (let i = start - 1; i >= 0; i--) {
      const startingMatches = this.starting(i);
      let found = false;
      for (const m of startingMatches) {
        if (!ignore || !ignore(m)) {
          loopStart = i;
          found = true;
          break;
        }
      }
      if (found) break;
    }
    for (let rindex = loopStart; rindex < limit; rindex++) {
      const atI = this.indexDict.get(rindex) ?? [];
      const current = ignore ? atI.filter((m) => !ignore(m)) : [...atI];
      if (seps2 && hole && this.inputString && seps2.includes(this.inputString[rindex])) {
        hole = false;
        ret[ret.length - 1].end = rindex;
      } else {
        if (current.length === 0 && !hole) {
          hole = true;
          ret.push(new Match(Math.max(rindex, start), 0, { inputString: this.inputString, formatter }));
        } else if (current.length > 0 && hole) {
          hole = false;
          ret[ret.length - 1].end = rindex;
        }
      }
    }
    if (ret.length > 0 && hole) {
      let holeEnd = this.maxEnd;
      const lastRindex = limit > loopStart ? limit - 1 : loopStart;
      for (let ri = lastRindex; ri < this.maxEnd; ri++) {
        const startingMatches = this.starting(ri);
        let found = false;
        for (const m of startingMatches) {
          if (!ignore || !ignore(m)) {
            holeEnd = ri;
            found = true;
            break;
          }
        }
        if (found) break;
      }
      ret[ret.length - 1].end = Math.min(holeEnd, limit);
    }
    const validHoles = ret.filter((h) => h.end > h.start);
    return filterIndex(validHoles, predicate ?? null, index ?? null);
  }
  /** All property names present. */
  get names() {
    return new Set(this.nameDict.keys());
  }
  /** All tags present. */
  get allTags() {
    return new Set(this.tagDict.keys());
  }
  /**
   * Convert to a plain dict (like Python Matches.to_dict).
   */
  toDict(details = false, firstValue = false, enforceList = false) {
    const ret = new MatchesDict();
    for (const match of this.sort()) {
      const val = details ? match : match.value;
      const matchArr = ret.matches.get(match.name ?? "") ?? [];
      matchArr.push(match);
      ret.matches.set(match.name ?? "", matchArr);
      const valEquals = (a, b) => details && a instanceof Match && b instanceof Match ? a.equals(b) : a === b;
      if (!enforceList) {
        const valArr = ret.valuesList.get(match.name ?? "") ?? [];
        if (!valArr.some((v) => valEquals(v, val))) valArr.push(val);
        ret.valuesList.set(match.name ?? "", valArr);
      }
      const existing = ret.get(match.name ?? "");
      if (existing !== void 0) {
        if (!firstValue) {
          if (Array.isArray(existing)) {
            if (!existing.some((v) => valEquals(v, val))) existing.push(val);
          } else {
            if (!valEquals(existing, val)) ret.set(match.name, [existing, val]);
          }
        }
      } else {
        ret.set(match.name, enforceList && !Array.isArray(val) ? [val] : val);
      }
    }
    return ret;
  }
  toString() {
    return `[${this._delegate.map(String).join(", ")}]`;
  }
}
class Matches extends _BaseMatches {
  constructor(matches, inputString) {
    super(void 0, inputString);
    __publicField(this, "markers");
    this.markers = new Markers(void 0, inputString);
    if (matches) this.extend(matches);
  }
  _addMatch(match) {
    if (match.marker) throw new Error("A marker match should not be added to Matches");
    super._addMatch(match);
  }
}
class Markers extends _BaseMatches {
  constructor(matches, inputString) {
    super(void 0, inputString);
    if (matches) this.extend(matches);
  }
  _addMatch(match) {
    if (!match.marker) throw new Error("A non-marker match should not be added to Markers");
    super._addMatch(match);
  }
}
function filterMatchKwargs(opts, children = false) {
  const result = { ...opts };
  delete result["pattern"];
  delete result["start"];
  delete result["end"];
  delete result["parent"];
  delete result["formatter"];
  delete result["value"];
  if (children) {
    delete result["name"];
  }
  return result;
}
function convertPythonNamedGroups(pattern) {
  return pattern.replace(/\(\?P</g, "(?<");
}
function applyAbbreviations(pattern, abbreviations) {
  let result = pattern;
  for (const [key, replacement] of abbreviations) {
    result = result.split(key).join(replacement);
  }
  return result;
}
function compileRegex(source2, opts) {
  let src = convertPythonNamedGroups(source2);
  if (opts.abbreviations) {
    src = applyAbbreviations(src, opts.abbreviations);
  }
  let flagStr = opts.flags ?? "";
  if (opts.ignoreCase && !flagStr.includes("i")) flagStr += "i";
  if (!flagStr.includes("g")) flagStr += "g";
  if (!flagStr.includes("d")) flagStr += "d";
  return new RegExp(src, flagStr);
}
function buildGroupNames(source2) {
  const names = [];
  let i = 0;
  while (i < source2.length) {
    if (source2[i] === "\\") {
      i += 2;
      continue;
    }
    if (source2[i] === "[") {
      i++;
      while (i < source2.length && source2[i] !== "]") {
        if (source2[i] === "\\") i++;
        i++;
      }
      i++;
      continue;
    }
    if (source2[i] === "(") {
      const next = source2[i + 1];
      if (next !== "?") {
        names.push(void 0);
      } else {
        const next2 = source2[i + 2];
        if (next2 === "<") {
          const next3 = source2[i + 3];
          if (next3 !== "=" && next3 !== "!") {
            const nameEnd = source2.indexOf(">", i + 3);
            names.push(nameEnd !== -1 ? source2.slice(i + 3, nameEnd) : void 0);
          }
        }
      }
    }
    i++;
  }
  return names;
}
class BasePattern {
}
class Pattern extends BasePattern {
  constructor(opts = {}) {
    super();
    __publicField(this, "name");
    __publicField(this, "tags");
    __publicField(this, "formatters");
    __publicField(this, "defaultFormatterFn");
    __publicField(this, "values");
    __publicField(this, "defaultValue");
    __publicField(this, "validators");
    __publicField(this, "defaultValidator");
    __publicField(this, "children");
    __publicField(this, "every");
    __publicField(this, "private_");
    __publicField(this, "privateNames");
    __publicField(this, "ignoreNames");
    __publicField(this, "privateParent");
    __publicField(this, "privateChildren");
    __publicField(this, "marker");
    __publicField(this, "formatAll");
    __publicField(this, "validateAll");
    __publicField(this, "disabled");
    __publicField(this, "logLevel");
    __publicField(this, "properties_");
    __publicField(this, "postProcessor");
    __publicField(this, "preMatchProcessor");
    __publicField(this, "postMatchProcessor");
    __publicField(this, "defined_at");
    __publicField(this, "_opts");
    this._opts = opts;
    this.name = opts.name;
    this.tags = ensureList(opts.tags);
    const [formattersMap, defaultFmt] = ensureDict(opts.formatter, defaultFormatter);
    this.formatters = formattersMap;
    this.defaultFormatterFn = defaultFmt ?? defaultFormatter;
    const [valuesMap, defaultVal] = ensureDict(opts.value, void 0);
    this.values = valuesMap;
    this.defaultValue = defaultVal;
    const [validatorsMap, defaultValid] = ensureDict(opts.validator, alwaysTrue);
    this.validators = validatorsMap;
    this.defaultValidator = defaultValid ?? alwaysTrue;
    this.every = opts.every ?? false;
    this.children = opts.children ?? false;
    this.private_ = opts.private ?? false;
    this.privateNames = opts.privateNames ?? [];
    this.ignoreNames = opts.ignoreNames ?? [];
    this.privateParent = opts.privateParent ?? false;
    this.privateChildren = opts.privateChildren ?? false;
    this.marker = opts.marker ?? false;
    this.formatAll = opts.formatAll ?? false;
    this.validateAll = opts.validateAll ?? false;
    const d = opts.disabled;
    if (typeof d === "function") {
      this.disabled = d;
    } else if (typeof d === "boolean") {
      this.disabled = () => d;
    } else {
      this.disabled = () => false;
    }
    this.logLevel = opts.logLevel ?? 0;
    this.properties_ = opts.properties;
    this.postProcessor = typeof opts.postProcessor === "function" ? opts.postProcessor : void 0;
    this.preMatchProcessor = typeof opts.preMatchProcessor === "function" ? opts.preMatchProcessor : void 0;
    this.postMatchProcessor = typeof opts.postMatchProcessor === "function" ? opts.postMatchProcessor : void 0;
    this.defined_at = definedAt();
  }
  get shouldIncludeChildren() {
    return this.children || this.every;
  }
  get shouldIncludeParent() {
    return !this.children || this.every;
  }
  _matchConfigPropertyKeys(match, child = false) {
    const keys = [];
    if (match.name) keys.push(match.name);
    keys.push(child ? "__children__" : "__parent__");
    keys.push(null);
    return keys;
  }
  _processMatchPrivate(match, child = false) {
    if (match.name && this.privateNames.includes(match.name) || !child && this.privateParent || child && this.privateChildren) {
      match.private = true;
    }
  }
  _processMatchValue(match, child = false) {
    const keys = this._matchConfigPropertyKeys(match, child);
    const patternValue = getFirstDefined(this.values, keys, this.defaultValue);
    if (patternValue !== void 0 && patternValue !== null) {
      match.value = patternValue;
    }
  }
  _processMatchFormatter(match, child = false) {
    const included = child ? this.shouldIncludeChildren : this.shouldIncludeParent;
    if (included || this.formatAll) {
      const keys = this._matchConfigPropertyKeys(match, child);
      match.formatter = getFirstDefined(this.formatters, keys, this.defaultFormatterFn);
    }
  }
  _processMatchValidator(match, child = false) {
    const included = child ? this.shouldIncludeChildren : this.shouldIncludeParent;
    if (included || this.validateAll) {
      const keys = this._matchConfigPropertyKeys(match, child);
      const validator = getFirstDefined(this.validators, keys, this.defaultValidator);
      if (validator && !validator(match)) return false;
    }
    return true;
  }
  _processMatch(match, matchIndex, child = false) {
    match.matchIndex = matchIndex;
    this._processMatchPrivate(match, child);
    this._processMatchValue(match, child);
    this._processMatchFormatter(match, child);
    return this._processMatchValidator(match, child);
  }
  static _applyProcessor(match, processor) {
    if (!processor) return match;
    if (!match) return match;
    const ret = processor(match);
    return ret !== void 0 ? ret : match;
  }
  *_processMatches(match, matchIndex) {
    const processed = Pattern._applyProcessor(match, this.preMatchProcessor);
    if (!processed) return;
    if (!this._processMatch(processed, matchIndex)) return;
    for (const child of processed.children) {
      if (!this._processMatch(child, matchIndex, true)) return;
    }
    const postProcessed = Pattern._applyProcessor(processed, this.postMatchProcessor);
    if (!postProcessed) return;
    if ((this.shouldIncludeParent || this.privateParent) && !this.ignoreNames.includes(postProcessed.name ?? "")) {
      yield postProcessed;
    }
    if (this.shouldIncludeChildren || this.privateChildren) {
      for (const child of postProcessed.children) {
        if (!this.ignoreNames.includes(child.name ?? "")) yield child;
      }
    }
  }
  _postProcessMatches(matches) {
    if (this.postProcessor) return this.postProcessor(matches, this);
    return matches;
  }
  matches(inputString, context, withRawMatches = false) {
    const allMatches = [];
    const rawMatches = [];
    for (const pattern of this.patterns) {
      let matchIndex = 0;
      for (const rawMatch of this._match(pattern, inputString, context)) {
        rawMatches.push(rawMatch);
        for (const m of this._processMatches(rawMatch, matchIndex)) {
          allMatches.push(m);
        }
        matchIndex++;
      }
    }
    const finalMatches = this._postProcessMatches(allMatches);
    if (withRawMatches) return [finalMatches, rawMatches];
    return finalMatches;
  }
  get properties() {
    return this.properties_ ?? {};
  }
}
class StringPattern extends Pattern {
  constructor(firstArg, ...rest) {
    var __super = (...args) => {
      super(...args);
      __publicField(this, "_patterns");
      __publicField(this, "_matchKwargs");
      return this;
    };
    if (typeof firstArg === "string") {
      __super({});
      this._patterns = [firstArg, ...rest];
      this._matchKwargs = filterMatchKwargs({});
    } else {
      __super(firstArg);
      this._patterns = rest;
      this._matchKwargs = filterMatchKwargs(firstArg);
    }
  }
  get patterns() {
    return this._patterns;
  }
  get matchOptions() {
    return this._matchKwargs;
  }
  *_match(pattern, inputString, _context) {
    const ignoreCase = (this._opts.ignoreCase ?? false) || (this._opts.flags?.includes("i") ?? false);
    const searchStart = this._opts.start ?? 0;
    const searchEnd = this._opts.end ?? void 0;
    for (const idx of findAll(inputString, pattern, searchStart, searchEnd, ignoreCase)) {
      const match = new Match(idx, idx + pattern.length, {
        ...this._matchKwargs,
        pattern: this,
        inputString
      });
      if (match.length > 0) yield match;
    }
  }
  toString() {
    return `<StringPattern:(${this._patterns.map((p) => `'${p}'`).join(", ")})>`;
  }
}
class RePattern extends Pattern {
  constructor(opts, ...patterns) {
    super(opts);
    __publicField(this, "_regexes");
    __publicField(this, "_matchKwargs");
    __publicField(this, "_childrenMatchKwargs");
    __publicField(this, "_groupNamesList");
    this._matchKwargs = filterMatchKwargs(opts);
    this._childrenMatchKwargs = filterMatchKwargs(opts, true);
    this._regexes = [];
    this._groupNamesList = [];
    for (const p of patterns) {
      if (p instanceof RegExp) {
        this._regexes.push(p);
        this._groupNamesList.push(buildGroupNames(p.source));
      } else {
        const compiled = compileRegex(p, {
          flags: opts.flags,
          ignoreCase: opts.ignoreCase,
          abbreviations: opts.abbreviations
        });
        this._regexes.push(compiled);
        this._groupNamesList.push(buildGroupNames(compiled.source));
      }
    }
  }
  get patterns() {
    return this._regexes;
  }
  get matchOptions() {
    return this._matchKwargs;
  }
  *_match(pattern, inputString, _context) {
    const groupNames = this._groupNamesList[this._regexes.indexOf(pattern)] ?? [];
    pattern.lastIndex = 0;
    let m;
    while ((m = pattern.exec(inputString)) !== null) {
      const start = m.index;
      const end = m.index + m[0].length;
      const mainMatch = new Match(start, end, {
        ...this._matchKwargs,
        pattern: this,
        inputString
      });
      if (groupNames.length > 0) {
        const indices = m.indices;
        for (let i = 0; i < groupNames.length; i++) {
          const groupIdx = i + 1;
          const name = groupNames[i] ?? this.name;
          const groupIndices = indices?.[groupIdx];
          if (groupIndices && groupIndices[0] !== -1) {
            const [gs, ge] = groupIndices;
            const childMatch = new Match(gs, ge, {
              ...this._childrenMatchKwargs,
              name,
              parent: mainMatch,
              pattern: this,
              inputString
            });
            if (childMatch.length > 0) mainMatch.children.append(childMatch);
          }
        }
      }
      if (mainMatch.length > 0 || m[0].length === 0) {
        if (mainMatch.length > 0) yield mainMatch;
      }
      if (m[0].length === 0) pattern.lastIndex++;
    }
  }
  toString() {
    return `<RePattern:(${this._regexes.map((r) => r.source).join(", ")})>`;
  }
}
class FunctionalPattern extends Pattern {
  constructor(opts, ...fns) {
    super(opts);
    __publicField(this, "_fns");
    __publicField(this, "_matchKwargs");
    this._fns = fns;
    this._matchKwargs = filterMatchKwargs(opts);
  }
  get patterns() {
    return this._fns;
  }
  get matchOptions() {
    return this._matchKwargs;
  }
  *_match(fn, inputString, context) {
    const ret = fn(inputString, context);
    if (!ret) return;
    const isSingleResult = (v) => {
      if (!Array.isArray(v)) return true;
      if (v.length >= 2 && typeof v[0] === "number" && typeof v[1] === "number") return true;
      return false;
    };
    const args_iterable = isSingleResult(ret) ? [ret] : ret;
    for (const args of args_iterable) {
      if (!args) continue;
      if (typeof args === "object" && !Array.isArray(args)) {
        const { start: s, end: e, ...rest } = args;
        const opts = { ...this._matchKwargs, ...rest };
        const m = new Match(s ?? 0, e ?? 0, {
          ...opts,
          pattern: this,
          inputString
        });
        if (m.length > 0) yield m;
      } else if (Array.isArray(args)) {
        let matchOpts = this._matchKwargs;
        let start, end;
        if (args.length >= 3 && typeof args[2] === "object" && !Array.isArray(args[2])) {
          matchOpts = { ...this._matchKwargs, ...args[2] };
          [start, end] = args;
        } else {
          [start, end] = args;
        }
        const m = new Match(start, end, { ...matchOpts, pattern: this, inputString });
        if (m.length > 0) yield m;
      }
    }
  }
  toString() {
    return `<FunctionalPattern:(${this._fns.map((f) => f.name || "anonymous").join(", ")})>`;
  }
}
let _ChainCtor = null;
function registerChain(ctor) {
  _ChainCtor = ctor;
}
function getChainClass() {
  return _ChainCtor;
}
function splitPatternsOpts(args) {
  if (args.length === 0) return [[], {}];
  const first = args[0];
  const last = args[args.length - 1];
  if (typeof first === "object" && first !== null) {
    return [args.slice(1), first];
  }
  if (args.length > 1 && typeof last === "object" && last !== null) {
    return [args.slice(0, -1), last];
  }
  return [args, {}];
}
class Builder {
  constructor() {
    __publicField(this, "_defaults", {});
    __publicField(this, "_regexDefaults", {});
    __publicField(this, "_stringDefaults", {});
    __publicField(this, "_functionalDefaults", {});
    __publicField(this, "_chainDefaults", {});
  }
  reset() {
    this._defaults = {};
    this._regexDefaults = {};
    this._stringDefaults = {};
    this._functionalDefaults = {};
    this._chainDefaults = {};
    return this;
  }
  defaults(kwargs) {
    setDefaults(kwargs, this._defaults, true);
    return this;
  }
  regexDefaults(kwargs) {
    setDefaults(kwargs, this._regexDefaults, true);
    return this;
  }
  stringDefaults(kwargs) {
    setDefaults(kwargs, this._stringDefaults, true);
    return this;
  }
  functionalDefaults(kwargs) {
    setDefaults(kwargs, this._functionalDefaults, true);
    return this;
  }
  chainDefaults(kwargs) {
    setDefaults(kwargs, this._chainDefaults, true);
    return this;
  }
  _applyOverrides(kwargs) {
    const overrideKeys = kwargs["overrides"] ?? [];
    delete kwargs["overrides"];
    const backup = {};
    for (const k of overrideKeys) backup[k] = kwargs[k];
    return [kwargs, backup];
  }
  buildRe(opts, ...patterns) {
    const kwargs = { ...opts };
    const [, backup] = this._applyOverrides(kwargs);
    setDefaults(this._regexDefaults, kwargs);
    setDefaults(this._defaults, kwargs);
    Object.assign(kwargs, backup);
    return new RePattern(kwargs, ...patterns);
  }
  buildString(opts, ...patterns) {
    const kwargs = { ...opts };
    const [, backup] = this._applyOverrides(kwargs);
    setDefaults(this._stringDefaults, kwargs);
    setDefaults(this._defaults, kwargs);
    Object.assign(kwargs, backup);
    return new StringPattern(kwargs, ...patterns);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  buildFunctional(opts, ...fns) {
    const kwargs = { ...opts };
    const [, backup] = this._applyOverrides(kwargs);
    setDefaults(this._functionalDefaults, kwargs);
    setDefaults(this._defaults, kwargs);
    Object.assign(kwargs, backup);
    return new FunctionalPattern(kwargs, ...fns);
  }
  /**
   * Fluent API: add a regex pattern and return `this`.
   * Supports both:
   *   regex(opts, 'pat1', 'pat2')  — options-first
   *   regex('pat1', 'pat2', opts)  — patterns-first, opts last
   *   regex('pat1', 'pat2')        — patterns only
   */
  regex(...args) {
    const [patterns, opts] = splitPatternsOpts(args);
    const p = this.buildRe(opts, ...patterns);
    return this.pattern(p);
  }
  /**
   * Fluent API: add a string pattern and return `this`.
   */
  string(...args) {
    const [patterns, opts] = splitPatternsOpts(args);
    const p = this.buildString(opts, ...patterns);
    return this.pattern(p);
  }
  /**
   * Fluent API: add a functional pattern and return `this`.
   * Supports:
   *   functional(fn)                — function only
   *   functional(fn, opts)          — fn-first, opts-last (Python style)
   *   functional(opts, fn)          — opts-first, fn-last
   *   functional(opts, fn1, fn2, …) — opts-first, multiple fns
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  functional(opts, ...fns) {
    let p;
    if (typeof opts === "function") {
      const lastArg = fns[fns.length - 1];
      if (fns.length > 0 && typeof lastArg === "object" && lastArg !== null && !Array.isArray(lastArg)) {
        const o = lastArg;
        const actualFns = fns.slice(0, -1);
        p = this.buildFunctional(o, opts, ...actualFns);
      } else {
        p = this.buildFunctional({}, opts, ...fns);
      }
    } else {
      p = this.buildFunctional(opts, ...fns);
    }
    return this.pattern(p);
  }
  /**
   * Fluent API: start a chain and return it.
   * The chain is also registered via pattern().
   */
  chain(opts = {}) {
    const ChainCtor = getChainClass();
    if (!ChainCtor) throw new Error("Chain class not registered. Import chain.ts before calling chain().");
    const kwargs = { ...opts };
    setDefaults(this._chainDefaults, kwargs);
    setDefaults(this._defaults, kwargs);
    const c = new ChainCtor(this, kwargs);
    c._defaults = { ...this._defaults };
    c._regexDefaults = { ...this._regexDefaults };
    c._stringDefaults = { ...this._stringDefaults };
    c._functionalDefaults = { ...this._functionalDefaults };
    c._chainDefaults = { ...this._chainDefaults };
    this.pattern(c);
    return c;
  }
}
class CyclicDependency extends Error {
  constructor(cyclic) {
    const parts = [...cyclic.entries()].map(([k, v]) => `${String(k)} -> ${[...v].map(String).join(", ")}`);
    super(`Cyclic dependencies exist among these items: ${parts.join("; ")}`);
    __publicField(this, "cyclic");
    this.cyclic = cyclic;
    this.name = "CyclicDependency";
  }
}
function* toposort(data) {
  if (data.size === 0) return;
  const workData = /* @__PURE__ */ new Map();
  for (const [k, v] of data) {
    const deps = new Set(v);
    deps.delete(k);
    workData.set(k, deps);
  }
  const allDeps = /* @__PURE__ */ new Set();
  for (const deps of workData.values()) {
    for (const d of deps) allDeps.add(d);
  }
  for (const dep of allDeps) {
    if (!workData.has(dep)) workData.set(dep, /* @__PURE__ */ new Set());
  }
  while (workData.size > 0) {
    const ordered = /* @__PURE__ */ new Set();
    for (const [item, deps] of workData) {
      if (deps.size === 0) ordered.add(item);
    }
    if (ordered.size === 0) {
      throw new CyclicDependency(workData);
    }
    yield ordered;
    for (const item of ordered) workData.delete(item);
    for (const deps of workData.values()) {
      for (const item of ordered) deps.delete(item);
    }
  }
}
class Consequence {
}
class Condition {
}
class CustomRule extends Condition {
  constructor() {
    super();
    __publicField(this, "priority", this.constructor.priority);
    __publicField(this, "name_", this.constructor.name);
    __publicField(this, "dependency_", this.constructor.dependency);
    __publicField(this, "logLevel", 0);
    __publicField(this, "defined_at");
    this.defined_at = definedAt();
  }
  enabled(_context) {
    return true;
  }
  toString() {
    const defined = this.defined_at ? `@${this.defined_at.filename.split("/").pop()}#L${this.defined_at.lineno}` : "";
    return `<${this.name_ ?? this.constructor.name}${defined}>`;
  }
  /** Equality: same class = same rule (for deduplication). */
  equals(other2) {
    return this.constructor === other2.constructor;
  }
}
__publicField(CustomRule, "priority", 0);
__publicField(CustomRule, "ruleName");
// eslint-disable-next-line @typescript-eslint/no-explicit-any
__publicField(CustomRule, "dependency", null);
__publicField(CustomRule, "properties", {});
class Rule extends CustomRule {
  constructor() {
    super(...arguments);
    __publicField(this, "consequence", null);
  }
  then(matches, whenResponse, context) {
    const cons = this.consequence ?? this.constructor.consequence;
    if (Array.isArray(cons)) {
      const responses = Array.isArray(whenResponse) ? whenResponse : [whenResponse];
      const iter = responses[Symbol.iterator]();
      for (const c of cons) {
        const instance = typeof c === "function" ? new c() : c;
        instance.then(matches, iter.next().value, context);
      }
    } else {
      const instance = typeof cons === "function" ? new cons() : cons;
      if (instance) instance.then(matches, whenResponse, context);
    }
  }
}
class RemoveMatch extends Consequence {
  then(matches, whenResponse, _context) {
    if (!whenResponse) return void 0;
    if (isIterable(whenResponse) && !(whenResponse instanceof String)) {
      const ret = [];
      for (const m2 of whenResponse) {
        if (matches.includes(m2)) {
          matches.remove(m2);
          ret.push(m2);
        }
      }
      return ret;
    }
    const m = whenResponse;
    if (matches.includes(m)) {
      matches.remove(m);
      return m;
    }
    return void 0;
  }
}
class AppendMatch extends Consequence {
  constructor(matchName) {
    super();
    __publicField(this, "matchName");
    this.matchName = matchName;
  }
  then(matches, whenResponse, _context) {
    if (!whenResponse) return void 0;
    if (isIterable(whenResponse) && !(whenResponse instanceof String)) {
      const ret = [];
      for (const m2 of whenResponse) {
        if (!matches.includes(m2)) {
          if (this.matchName) m2.name = this.matchName;
          matches.append(m2);
          ret.push(m2);
        }
      }
      return ret;
    }
    const m = whenResponse;
    if (this.matchName) m.name = this.matchName;
    if (!matches.includes(m)) {
      matches.append(m);
      return m;
    }
    return void 0;
  }
}
class RenameMatch extends Consequence {
  constructor(matchName) {
    super();
    __publicField(this, "matchName");
    __publicField(this, "_remove", new RemoveMatch());
    __publicField(this, "_append", new AppendMatch());
    this.matchName = matchName;
  }
  then(matches, whenResponse, context) {
    const removed = this._remove.then(matches, whenResponse, context);
    if (!removed) return;
    if (Array.isArray(removed)) {
      for (const m of removed) m.name = this.matchName;
      this._append.then(matches, removed, context);
    } else {
      removed.name = this.matchName;
      this._append.then(matches, removed, context);
    }
  }
}
class AppendTags extends Consequence {
  constructor(tags) {
    super();
    __publicField(this, "tags");
    __publicField(this, "_remove", new RemoveMatch());
    __publicField(this, "_append", new AppendMatch());
    this.tags = tags;
  }
  then(matches, whenResponse, context) {
    const removed = this._remove.then(matches, whenResponse, context);
    if (!removed) return;
    if (Array.isArray(removed)) {
      for (const m of removed) m.tags.push(...this.tags);
    } else {
      removed.tags.push(...this.tags);
    }
    this._append.then(matches, removed, context);
  }
}
class Rules {
  constructor(...rules) {
    __publicField(this, "_list", []);
    this.load(...rules);
  }
  load(...rules) {
    for (const rule of rules) {
      if (typeof rule === "function" && rule.prototype instanceof CustomRule) {
        this._list.push(new rule());
      } else if (typeof rule === "object" && rule !== null && !(rule instanceof CustomRule)) {
        this.loadModule(rule);
      } else if (rule instanceof CustomRule) {
        this._list.push(rule);
      } else if (typeof rule === "function") {
        this._list.push(new rule());
      }
    }
  }
  /**
   * Load rules from a module-like object by scanning its exported members.
   * Port of Python Rules.load_module() which uses inspect.getmembers().
   */
  loadModule(module2) {
    for (const value of Object.values(module2)) {
      if (typeof value === "function" && value.prototype instanceof CustomRule) {
        this._list.push(new value());
      }
    }
  }
  extend(other2) {
    for (const r of other2._list) {
      if (!this._list.some((existing) => existing.equals(r))) {
        this._list.push(r);
      }
    }
  }
  indexOf(rule) {
    return this._list.indexOf(rule);
  }
  [Symbol.iterator]() {
    return this._list[Symbol.iterator]();
  }
  get length() {
    return this._list.length;
  }
  executeAllRules(matches, context) {
    const ret = [];
    const byPriority = /* @__PURE__ */ new Map();
    for (const rule of this._list) {
      const p = rule.priority;
      const arr = byPriority.get(p) ?? [];
      arr.push(rule);
      byPriority.set(p, arr);
    }
    const sortedPriorities = [...byPriority.keys()].sort((a, b) => b - a);
    for (const _priority of sortedPriorities) {
      const priorityRules = byPriority.get(_priority);
      const sorted = toposortRules(priorityRules);
      for (const ruleGroup of sorted) {
        const groupArr = [...ruleGroup].sort((a, b) => this.indexOf(a) - this.indexOf(b));
        for (const rule of groupArr) {
          const whenResponse = executeRule(rule, matches, context);
          if (whenResponse !== null && whenResponse !== void 0 && whenResponse !== false) {
            ret.push([rule, whenResponse]);
          }
        }
      }
    }
    return ret;
  }
}
function executeRule(rule, matches, context) {
  if (!rule.enabled(context)) return null;
  const whenResponse = rule.when(matches, context);
  if (whenResponse !== null && whenResponse !== void 0 && whenResponse !== false) {
    rule.then(matches, whenResponse, context);
    return whenResponse;
  }
  return null;
}
function toposortRules(rules) {
  const graph = /* @__PURE__ */ new Map();
  const classToDep = /* @__PURE__ */ new Map();
  for (const rule of rules) {
    if (classToDep.has(rule.constructor)) {
      throw new Error(`Duplicate class rules are not allowed: ${rule.constructor.name}`);
    }
    classToDep.set(rule.constructor, rule);
  }
  for (const rule of rules) {
    const deps = /* @__PURE__ */ new Set();
    const rawDeps = rule.dependency_;
    if (rawDeps) {
      const depArr = Array.isArray(rawDeps) ? rawDeps : [rawDeps];
      for (const dep of depArr) {
        let resolved;
        if (typeof dep === "string") {
          for (const [cls, inst] of classToDep) {
            if (cls.name === dep) {
              resolved = inst;
              break;
            }
          }
        } else {
          resolved = classToDep.get(dep);
        }
        if (resolved) deps.add(resolved);
      }
    }
    graph.set(rule, deps);
  }
  return [...toposort(graph)];
}
const DEFAULT_SYMBOL = "__default__";
const PRE_PROCESS = 2048;
const POST_PROCESS = -2048;
function defaultConflictSolver(match, conflicting) {
  if (conflicting.initiator.length < match.initiator.length) return conflicting;
  if (match.initiator.length < conflicting.initiator.length) return match;
  return null;
}
class ConflictSolver extends Rule {
  constructor() {
    super(...arguments);
    __publicField(this, "priority", PRE_PROCESS);
    __publicField(this, "consequence", RemoveMatch);
  }
  get defaultConflictSolverFn() {
    return defaultConflictSolver;
  }
  when(matches, _context) {
    const toRemove = new IdentitySet();
    const publicMatches = matches.toArray().filter((m) => !m.private).sort((a, b) => a.length - b.length);
    for (const match of publicMatches) {
      const conflicting = matches.conflicting(match) ?? [];
      if (!conflicting.length) continue;
      const publicConflicting = conflicting.filter((c) => !c.private).sort((a, b) => a.length - b.length);
      for (const conflictingMatch of publicConflicting) {
        const solvers = [
          [this.defaultConflictSolverFn, false]
        ];
        if (match.conflictSolver) solvers.push([match.conflictSolver, false]);
        if (conflictingMatch.conflictSolver) solvers.push([conflictingMatch.conflictSolver, true]);
        for (let si = solvers.length - 1; si >= 0; si--) {
          const [solver, reverse] = solvers[si];
          const toRem = reverse ? solver(conflictingMatch, match) : solver(match, conflictingMatch);
          if (toRem === DEFAULT_SYMBOL) continue;
          if (toRem && !toRemove.has(toRem)) {
            const toKeep = toRem === match ? conflictingMatch : match;
            if (!toRemove.has(toKeep)) {
              toRemove.add(toRem);
            }
          }
          break;
        }
      }
    }
    return toRemove;
  }
}
__publicField(ConflictSolver, "priority", PRE_PROCESS);
class PrivateRemover extends Rule {
  constructor() {
    super(...arguments);
    __publicField(this, "priority", POST_PROCESS);
    __publicField(this, "consequence", RemoveMatch);
  }
  when(matches, _context) {
    return matches.toArray().filter((m) => m.private);
  }
}
__publicField(PrivateRemover, "priority", POST_PROCESS);
class InvalidChainException extends Error {
  constructor() {
    super("Invalid chain");
  }
}
class ChainPart extends BasePattern {
  constructor(chain, pattern) {
    super();
    __publicField(this, "_chain");
    __publicField(this, "pattern");
    __publicField(this, "repeaterStart", 1);
    __publicField(this, "repeaterEnd", 1);
    __publicField(this, "_hidden", false);
    this._chain = chain;
    this.pattern = pattern;
  }
  get isChainStart() {
    return this._chain.parts[0] === this;
  }
  get isHidden() {
    return this._hidden;
  }
  hidden(hidden = true) {
    this._hidden = hidden;
    return this;
  }
  matches(inputString, context, withRawMatches = false) {
    const result = this.pattern.matches(inputString, context, true);
    let [allMatches, rawMatches] = result;
    allMatches = this._truncateRepeater(allMatches, inputString);
    rawMatches = this._truncateRepeater(rawMatches, inputString);
    this._validateRepeater(rawMatches);
    if (withRawMatches) return [allMatches, rawMatches];
    return allMatches;
  }
  _truncateRepeater(matches, inputString) {
    if (!matches.length) return matches;
    if (!this.isChainStart) {
      const separator = inputString.slice(0, matches[0].initiator.rawStart);
      if (separator) return [];
    }
    let j = 1;
    for (let i = 0; i < matches.length - 1; i++) {
      const sep = inputString.slice(matches[i].initiator.rawEnd, matches[i + 1].initiator.rawStart);
      if (sep) break;
      j++;
    }
    let truncated = matches.slice(0, j);
    if (this.repeaterEnd !== null) {
      truncated = truncated.filter((m) => m.matchIndex < this.repeaterEnd);
    }
    return truncated;
  }
  _validateRepeater(matches) {
    const maxMatchIndex = matches.length > 0 ? Math.max(...matches.map((m) => m.matchIndex)) : -1;
    if (maxMatchIndex + 1 < this.repeaterStart) {
      throw new InvalidChainException();
    }
  }
  repeater(value) {
    if (typeof value === "number") {
      this.repeaterStart = value;
      this.repeaterEnd = value;
      return this;
    }
    const v = String(value);
    if (v === "+") {
      this.repeaterStart = 1;
      this.repeaterEnd = null;
    } else if (v === "*") {
      this.repeaterStart = 0;
      this.repeaterEnd = null;
    } else if (v === "?") {
      this.repeaterStart = 0;
      this.repeaterEnd = 1;
    } else {
      const m = /\{\s*(\d*)\s*,?\s*(\d*)\s*\}/.exec(v);
      if (m) {
        this.repeaterStart = m[1] ? parseInt(m[1]) : 0;
        this.repeaterEnd = m[2] ? parseInt(m[2]) : null;
      }
    }
    return this;
  }
  // Proxy chain methods for fluent API
  regex(opts, ...rest) {
    return this._chain.regex(opts, ...rest);
  }
  string(opts, ...rest) {
    return this._chain.string(opts, ...rest);
  }
  functional(opts, ...fns) {
    return this._chain.functional(opts, ...fns);
  }
  chain(opts) {
    return this._chain.chain(opts);
  }
  close() {
    return this._chain.close();
  }
  toString() {
    return `${this.pattern}({${this.repeaterStart},${this.repeaterEnd}})`;
  }
}
class Chain extends Pattern {
  constructor(parent, opts = {}) {
    super(opts);
    __publicField(this, "parts", []);
    // Builder-compatible defaults (populated by Builder.chain())
    __publicField(this, "_defaults", {});
    __publicField(this, "_regexDefaults", {});
    __publicField(this, "_stringDefaults", {});
    __publicField(this, "_functionalDefaults", {});
    __publicField(this, "_chainDefaults", {});
    __publicField(this, "_parent");
    __publicField(this, "_chainBreaker");
    __publicField(this, "_matchKwargs");
    this._parent = parent;
    this._matchKwargs = filterMatchKwargs(opts);
    this._chainBreaker = opts.chainBreaker ?? null;
  }
  // Builder-like methods so chain().regex() etc. work
  defaults(kwargs) {
    setDefaults(kwargs, this._defaults, true);
    if ("children" in kwargs) this.children = kwargs.children;
    if ("privateParent" in kwargs) this.privateParent = kwargs.privateParent;
    if ("privateChildren" in kwargs) this.privateChildren = kwargs.privateChildren;
    if ("conflictSolver" in kwargs) this._matchKwargs.conflictSolver = kwargs.conflictSolver;
    if ("privateNames" in kwargs) this.privateNames = kwargs.privateNames;
    return this;
  }
  regexDefaults(kwargs) {
    setDefaults(kwargs, this._regexDefaults, true);
    return this;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  regex(...args) {
    const lastArg = args[args.length - 1];
    const opts = typeof lastArg === "object" && lastArg !== null && !Array.isArray(lastArg) ? lastArg : {};
    const patterns = typeof lastArg === "object" && lastArg !== null && !Array.isArray(lastArg) ? args.slice(0, -1) : args;
    const kwargs = { ...this._regexDefaults, ...this._defaults, ...opts };
    const pat = new RePattern(kwargs, ...patterns);
    return this.pattern(pat);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  string(...args) {
    const lastArg = args[args.length - 1];
    const opts = typeof lastArg === "object" && lastArg !== null && !Array.isArray(lastArg) ? lastArg : {};
    const patterns = typeof lastArg === "object" && lastArg !== null && !Array.isArray(lastArg) ? args.slice(0, -1) : args;
    const kwargs = { ...this._stringDefaults, ...this._defaults, ...opts };
    const pat = new StringPattern(kwargs, ...patterns);
    return this.pattern(pat);
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  functional(...args) {
    const fn = args[0];
    const opts = args.length > 1 && typeof args[1] === "object" ? args[1] : {};
    const kwargs = { ...this._functionalDefaults, ...this._defaults, ...opts };
    const pat = new FunctionalPattern(kwargs, fn);
    return this.pattern(pat);
  }
  chain(opts = {}) {
    const kwargs = { ...this._chainDefaults, ...this._defaults, ...opts };
    const c = new Chain(this, kwargs);
    c._defaults = { ...this._defaults };
    c._regexDefaults = { ...this._regexDefaults };
    c._stringDefaults = { ...this._stringDefaults };
    c._functionalDefaults = { ...this._functionalDefaults };
    c._chainDefaults = { ...this._chainDefaults };
    this.pattern(c);
    return c;
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  pattern(...patterns) {
    if (!patterns.length) throw new Error("One pattern should be given to the chain");
    if (patterns.length > 1) throw new Error("Only one pattern can be given to the chain");
    const part2 = new ChainPart(this, patterns[0]);
    this.parts.push(part2);
    return part2;
  }
  close() {
    let p = this._parent;
    while (p instanceof Chain) p = p._parent;
    return p;
  }
  get patterns() {
    return [this];
  }
  get matchOptions() {
    return {};
  }
  /**
   * Override from Pattern — when the main chain match fails validation,
   * try removing trailing groups from the last pattern and re-validate.
   * Port of Python Chain._process_match fallback logic.
   */
  _processMatch(match, matchIndex, child = false) {
    const ret = super._processMatch(match, matchIndex, child);
    if (ret) return true;
    if (match.children.length > 0) {
      const lastPattern = match.children.get(match.children.length - 1).pattern;
      const lastPatternChildren = match.children.toArray().filter((c) => c.pattern === lastPattern);
      const lastPatternGroups = Chain._groupByMatchIndex(lastPatternChildren);
      if (lastPatternGroups.size > 0) {
        const originalChildren = new Matches(match.children.toArray());
        const originalEnd = match.end;
        const indices = [...lastPatternGroups.keys()].sort((a, b) => b - a);
        for (const idx of indices) {
          const lastMatches = lastPatternGroups.get(idx);
          for (const lm of lastMatches) {
            match.children.remove(lm);
          }
          match.end = match.children.length > 0 ? match.children.get(match.children.length - 1).end : match.start;
          const retried = super._processMatch(match, matchIndex, child);
          if (retried) return true;
        }
        match.children = originalChildren;
        match.end = originalEnd;
      }
    }
    return false;
  }
  *_match(_pattern, inputString, context) {
    let offset = 0;
    while (offset < inputString.length) {
      let chainFound = false;
      const currentChainMatches = [];
      let valid = true;
      let chainInputString = inputString.slice(offset);
      for (const chainPart of this.parts) {
        try {
          const result = chainPart.matches(chainInputString, context, true);
          const [partMatches, rawPartMatches] = result;
          Chain._fixMatchesOffset(partMatches, inputString, offset);
          Chain._fixMatchesOffset(rawPartMatches, inputString, offset);
          if (rawPartMatches.length > 0) {
            const groupedRaw = Chain._groupByMatchIndex(rawPartMatches);
            const groupedAll = Chain._groupByMatchIndex(partMatches);
            for (const [matchIndex, grouped] of groupedRaw) {
              chainFound = true;
              offset = grouped[grouped.length - 1].rawEnd;
              chainInputString = inputString.slice(offset);
              if (!chainPart.isHidden) {
                const groupedMatches = groupedAll.get(matchIndex) ?? [];
                if (this._chainBreakerEval([...currentChainMatches, ...groupedMatches])) {
                  currentChainMatches.push(...groupedMatches);
                }
              }
            }
          }
        } catch (e) {
          if (e instanceof InvalidChainException) {
            valid = false;
            if (currentChainMatches.length > 0) {
              offset = currentChainMatches[0].rawEnd;
            } else {
              offset++;
            }
            break;
          }
          throw e;
        }
      }
      if (!chainFound) break;
      if (currentChainMatches.length > 0 && valid) {
        yield this._buildChainMatch(currentChainMatches, inputString);
      }
    }
  }
  _chainBreakerEval(matches) {
    if (!this._chainBreaker) return true;
    return !this._chainBreaker(new Matches(matches));
  }
  _buildChainMatch(currentChainMatches, inputString) {
    let start = Infinity;
    let end = -Infinity;
    for (const m of currentChainMatches) {
      if (m.start < start) start = m.start;
      if (m.end > end) end = m.end;
    }
    const match = new Match(start, end, {
      ...this._matchKwargs,
      pattern: this,
      inputString
    });
    for (const chainMatch of currentChainMatches) {
      if (chainMatch.children.length > 0) {
        for (const child of chainMatch.children) {
          match.children.append(child);
        }
      }
      if (!match.children.includes(chainMatch)) {
        match.children.append(chainMatch);
        chainMatch.parent = match;
      }
    }
    return match;
  }
  static _fixMatchesOffset(matches, inputString, offset) {
    for (const m of matches) {
      if (m.inputString !== inputString) {
        m.inputString = inputString;
        const oldRawStart = m.rawStart;
        const oldRawEnd = m.rawEnd;
        m.start += offset;
        m.end += offset;
        m.rawStart = oldRawStart + offset;
        m.rawEnd = oldRawEnd + offset;
      }
      if (m.children.length > 0) {
        Chain._fixMatchesOffset(m.children.toArray(), inputString, offset);
      }
    }
  }
  static _groupByMatchIndex(matches) {
    const map = /* @__PURE__ */ new Map();
    for (const m of matches) {
      const arr = map.get(m.matchIndex) ?? [];
      arr.push(m);
      map.set(m.matchIndex, arr);
    }
    return map;
  }
}
registerChain(Chain);
class Rebulk extends Builder {
  constructor(opts = {}) {
    super();
    __publicField(this, "_patterns", []);
    __publicField(this, "_rules");
    __publicField(this, "_rebulks", []);
    __publicField(this, "_disabled");
    /** Optional property customizer (guessit-specific). */
    __publicField(this, "customizeProperties");
    const d = opts.disabled;
    if (typeof d === "function") {
      this._disabled = d;
    } else if (typeof d === "boolean") {
      this._disabled = () => d;
    } else {
      this._disabled = () => false;
    }
    this._rules = new Rules();
    if (opts.defaultRules !== false) {
      this._rules.load(ConflictSolver, PrivateRemover);
    }
  }
  pattern(...patterns) {
    this._patterns.push(...patterns);
    return this;
  }
  rules(...rules) {
    this._rules.load(...rules);
    return this;
  }
  rebulk(...rebulks) {
    this._rebulks.push(...rebulks);
    return this;
  }
  /** Run all patterns and rules against `string`. */
  matches(string, context = {}) {
    const matches = new Matches(void 0, string);
    this._matchesPatterns(matches, context);
    this._executeRules(matches, context);
    return matches;
  }
  effectiveRules(context) {
    const rules = new Rules();
    rules.extend(this._rules);
    for (const child of this._rebulks) {
      if (!child._disabled(context ?? {})) {
        rules.extend(child._rules);
      }
    }
    return rules;
  }
  effectivePatterns(context) {
    const patterns = [...this._patterns];
    for (const child of this._rebulks) {
      if (!child._disabled(context ?? {})) {
        extendSafe(patterns, child._patterns);
      }
    }
    return patterns;
  }
  _executeRules(matches, context) {
    if (!this._disabled(context)) {
      const rules = this.effectiveRules(context);
      rules.executeAllRules(matches, context);
    }
  }
  _matchesPatterns(matches, context) {
    if (this._disabled(context)) return;
    const patterns = this.effectivePatterns(context);
    for (const pat of patterns) {
      if (pat.disabled && pat.disabled(context)) continue;
      const patternMatches = pat.matches(matches.inputString, context);
      for (const m of patternMatches) {
        if (m.marker) {
          matches.markers.append(m);
        } else {
          matches.append(m);
        }
      }
    }
  }
}
function path(config) {
  const rebulk = new Rebulk();
  rebulk.defaults({ name: "path", marker: true });
  function markPath(inputString, context) {
    if (context?.["name_only"]) {
      return [[0, inputString.length]];
    }
    const indices = [
      ...findAll(inputString, "/"),
      ...findAll(inputString, "\\"),
      -1,
      inputString.length
    ];
    indices.sort((a, b) => a - b);
    const ret = [];
    for (let i = 0; i < indices.length - 1; i++) {
      ret.push([indices[i] + 1, indices[i + 1]]);
    }
    return ret;
  }
  rebulk.functional(markPath);
  return rebulk;
}
class ConfigurationException extends Error {
  constructor(message) {
    super(message);
    this.name = "ConfigurationException";
  }
}
function groups(config) {
  const rebulk = new Rebulk();
  rebulk.defaults({ name: "group", marker: true });
  const { starting, ending } = config;
  if (starting.length !== ending.length) {
    throw new ConfigurationException("Starting and ending groups must have the same length");
  }
  function markGroups(inputString) {
    const openings = Array.from({ length: starting.length }, () => []);
    const ret = [];
    for (let i = 0; i < inputString.length; i++) {
      const ch = inputString[i];
      const startType = starting.indexOf(ch);
      if (startType > -1) {
        openings[startType].push(i);
      }
      const endType = ending.indexOf(ch);
      if (endType > -1) {
        const stack = openings[endType];
        if (stack.length > 0) {
          const startIndex = stack.pop();
          ret.push([startIndex, i + 1]);
        }
      }
    }
    return ret;
  }
  rebulk.functional(markGroups);
  return rebulk;
}
function buildOrPattern(patterns, name, escape = false) {
  if (!patterns || patterns.length === 0) return "(?:)";
  const parts = [];
  for (const pattern of patterns) {
    if (parts.length === 0) {
      parts.push("(?");
      if (name) {
        parts.push(`<${name}>`);
      } else {
        parts.push(":");
      }
    } else {
      parts.push("|");
    }
    parts.push(escape ? `(?:${pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})` : `(?:${pattern})`);
  }
  parts.push(")");
  return parts.join("");
}
const ROMAN_VALUES = [
  ["M", 1e3],
  ["CM", 900],
  ["D", 500],
  ["CD", 400],
  ["C", 100],
  ["XC", 90],
  ["L", 50],
  ["XL", 40],
  ["X", 10],
  ["IX", 9],
  ["V", 5],
  ["IV", 4],
  ["I", 1]
];
const WORD_NUMERALS = {
  // English
  "zero": 0,
  "one": 1,
  "two": 2,
  "three": 3,
  "four": 4,
  "five": 5,
  "six": 6,
  "seven": 7,
  "eight": 8,
  "nine": 9,
  "ten": 10,
  "eleven": 11,
  "twelve": 12,
  "thirteen": 13,
  "fourteen": 14,
  "fifteen": 15,
  "sixteen": 16,
  "seventeen": 17,
  "eighteen": 18,
  "nineteen": 19,
  "twenty": 20,
  // French
  "zéro": 0,
  "un": 1,
  "deux": 2,
  "trois": 3,
  "quatre": 4,
  "cinq": 5,
  "six": 6,
  "sept": 7,
  "huit": 8,
  "neuf": 9,
  "dix": 10,
  "onze": 11,
  "douze": 12,
  "treize": 13,
  "quatorze": 14,
  "quinze": 15,
  "seize": 16,
  "dix-sept": 17,
  "dix-huit": 18,
  "dix-neuf": 19,
  "vingt": 20
};
function parseRoman(s) {
  const upper = s.toUpperCase();
  let result = 0;
  let i = 0;
  for (const [sym, val] of ROMAN_VALUES) {
    while (upper.startsWith(sym, i)) {
      result += val;
      i += sym.length;
    }
  }
  return i === upper.length && result > 0 ? result : void 0;
}
function parseWord(s) {
  return WORD_NUMERALS[s.toLowerCase()];
}
function parseNumber(s) {
  const n = parseInt(s, 10);
  if (!isNaN(n)) return n;
  const roman = parseRoman(s);
  if (roman !== void 0) return roman;
  return parseWord(s);
}
const seps = " [](){}+*|=-_~#/\\.,;:";
const sepsNoGroups = seps.replace(/[\[\](){}]/g, "");
const sepsNoFs = seps.replace(/[/\\]/g, "");
const titleSeps = "-+/\\|";
function reEscape(s) {
  return s.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
}
const sepsPattern = reEscape(seps);
reEscape(sepsNoGroups);
const dash = ["-", "[" + reEscape(sepsNoFs) + "]"];
const altDash = ["@", "[" + reEscape(sepsNoFs) + "]"];
function optional(pattern) {
  return "(?:" + pattern + ")?";
}
const sepsBefore = (match) => charsBefore(seps, match);
const sepsAfter = (match) => charsAfter(seps, match);
const sepsSurround = (match) => charsSurround(seps, match);
function intCoercable(string) {
  const n = Number(string.trim());
  return Number.isInteger(n);
}
function and_(...validators) {
  return (m) => validators.every((v) => v(m));
}
function or_(...validators) {
  return (m) => validators.some((v) => v(m));
}
const EXCLUDED_CLEAN_CHARS = /* @__PURE__ */ new Set([",", ":", ";", "-", "/", "\\"]);
const cleanChars = seps.split("").filter((c) => !EXCLUDED_CLEAN_CHARS.has(c)).join("");
function potentialBefore(i, inputString) {
  return i - 1 >= 0 && seps.includes(inputString[i]) && (i - 2 < 0 || seps.includes(inputString[i - 2])) && !seps.includes(inputString[i - 1]);
}
function potentialAfter(i, inputString) {
  return i + 2 >= inputString.length || inputString[i + 2] === inputString[i] && !seps.includes(inputString[i + 1]);
}
function cleanup(inputString) {
  if (!inputString) return inputString;
  let cleanString = inputString;
  for (const char of cleanChars) {
    cleanString = cleanString.split(char).join(" ");
  }
  const indices = [];
  for (let i = 0; i < cleanString.length; i++) {
    if (seps.includes(cleanString[i])) indices.push(i);
  }
  const dots = /* @__PURE__ */ new Set();
  if (indices.length > 0) {
    const cleanList = cleanString.split("");
    const potentialIndices = [];
    for (const i of indices) {
      if (potentialBefore(i, inputString) && potentialAfter(i, inputString)) {
        potentialIndices.push(i);
      }
    }
    const replaceIndices = [];
    for (const pi of potentialIndices) {
      if (potentialIndices.includes(pi - 2) || potentialIndices.includes(pi + 2)) {
        replaceIndices.push(pi);
      }
    }
    if (replaceIndices.length > 0) {
      for (const ri of replaceIndices) {
        dots.add(inputString[ri]);
        cleanList[ri] = inputString[ri];
      }
      cleanString = cleanList.join("");
    }
  }
  const stripChars = seps.split("").filter((c) => !dots.has(c)).join("");
  cleanString = strip(cleanString, stripChars);
  cleanString = cleanString.replace(/ +/g, " ");
  return cleanString;
}
function strip(inputString, chars = seps) {
  let start = 0;
  let end = inputString.length;
  while (start < end && chars.includes(inputString[start])) start++;
  while (end > start && chars.includes(inputString[end - 1])) end--;
  return inputString.slice(start, end);
}
function rawCleanup(raw) {
  return formatters(cleanup, strip)(raw.toLowerCase());
}
function reorderTitle(title2, articles = ["the"], separators = [", ", ","]) {
  const ltitle = title2.toLowerCase();
  for (const article of articles) {
    for (const separator of separators) {
      const suffix = separator + article;
      if (ltitle.endsWith(suffix)) {
        return title2.slice(title2.length - suffix.length + separator.length) + " " + title2.slice(0, title2.length - suffix.length);
      }
    }
  }
  return title2;
}
function isDisabled(context, name) {
  if (!context) return false;
  const excludes = context["excludes"];
  const includes = context["includes"];
  if (excludes && excludes.includes(name)) return true;
  if (includes && includes.length > 0 && !includes.includes(name)) return true;
  return false;
}
function episodesSeasonChainBreaker(matches, config) {
  const episodes2 = matches.named("episode") || [];
  if (episodes2.length > 1 && Math.abs(episodes2[episodes2.length - 1].value - episodes2[episodes2.length - 2].value) > config.episode_max_range) {
    return true;
  }
  const seasons = matches.named("season") || [];
  if (seasons.length > 1) {
    const last = seasons[seasons.length - 1].value;
    const prev = seasons[seasons.length - 2].value;
    if (Math.abs(last - prev) > config.season_max_range) {
      return true;
    }
    if (last < prev) {
      return true;
    }
  }
  return false;
}
function seasonEpisodeConflictSolver(match, other2) {
  if (match.name !== other2.name) {
    if (match.name === "episode" && other2.name === "year") {
      return match;
    }
    if (["season", "episode"].includes(match.name)) {
      if ([
        "video_codec",
        "audio_codec",
        "container",
        "date"
      ].includes(other2.name)) {
        return match;
      }
      if (other2.name === "audio_channels" && !other2.tags?.includes("weak-audio_channels") && !match.initiator?.children?.named(match.name + "Marker")?.length || other2.name === "screen_size" && !intCoercable(other2.raw)) {
        return match;
      }
    }
  }
  if (["season", "episode"].includes(match.name) && ["season", "episode"].includes(other2.name) && match.initiator !== other2.initiator) {
    const matchIsWeak = !!(match.tags?.includes("weak-episode") || ["weak_episode", "weak_duplicate"].includes(match.initiator?.name));
    const otherIsWeak = !!(other2.tags?.includes("weak-episode") || ["weak_episode", "weak_duplicate"].includes(other2.initiator?.name));
    if (matchIsWeak && otherIsWeak) {
      return "__default__";
    }
    if (matchIsWeak) return match;
    if (otherIsWeak) return other2;
    const matchIsSxxExx = !!match.tags?.includes("SxxExx");
    const otherIsSxxExx = !!other2.tags?.includes("SxxExx");
    if (matchIsSxxExx && !otherIsSxxExx) return other2;
    if (otherIsSxxExx && !matchIsSxxExx) return match;
    const matchHasX = match.initiator?.raw?.toLowerCase().includes("x") && !matchIsSxxExx;
    const otherHasX = other2.initiator?.raw?.toLowerCase().includes("x") && !otherIsSxxExx;
    if (matchHasX && !otherHasX) return match;
    if (otherHasX && !matchHasX) return other2;
  }
  return "__default__";
}
function orderingValidator(match) {
  const values = match.children?.to_dict?.() || {};
  if (values.season && Array.isArray(values.season)) {
    const sorted = [...values.season].sort((a, b) => a - b);
    if (JSON.stringify(sorted) !== JSON.stringify(values.season)) {
      return false;
    }
  }
  if (values.episode && Array.isArray(values.episode)) {
    const sorted = [...values.episode].sort((a, b) => a - b);
    if (JSON.stringify(sorted) !== JSON.stringify(values.episode)) {
      return false;
    }
  }
  return true;
}
function validateRoman(match) {
  if (intCoercable(match.raw)) {
    return true;
  }
  return sepsSurround(match);
}
function episodes(config) {
  config.range_separators;
  const discreteSeparators = config.discrete_separators;
  seps.split("").filter((s) => !config.range_separators.includes(s));
  const allSeparators = [
    ...config.range_separators,
    ...discreteSeparators
  ];
  const wordNumerals = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
    "twenty",
    "un",
    "deux",
    "trois",
    "quatre",
    "cinq",
    "sept",
    "huit",
    "neuf",
    "dix",
    "onze",
    "douze",
    "treize",
    "quatorze",
    "quinze",
    "seize",
    "vingt"
  ];
  const wordNumeralsPat = wordNumerals.join("|");
  const numeralWithWords = `(?:\\d+|[ivxlcdm]+|${wordNumeralsPat})`;
  const numeral = `(?:\\d+|[ivxlcdm]+)`;
  function isSeasonEpisodeDisabled(context) {
    return isDisabled(context, "episode") || isDisabled(context, "season");
  }
  const rebulk = new Rebulk().regexDefaults({ flags: "i" }).stringDefaults({ ignoreCase: true }).defaults({
    privateNames: ["episodeSeparator", "seasonSeparator", "episodeMarker", "seasonMarker"],
    formatter: { season: (v) => parseInt(v, 10), episode: (v) => parseInt(v, 10), version: (v) => parseInt(v, 10) },
    children: true,
    privateParent: true,
    conflictSolver: seasonEpisodeConflictSolver,
    abbreviations: [altDash]
  });
  const seasonMarkerPattern = buildOrPattern(config.season_markers, "seasonMarker");
  const episodeMarkerPattern = buildOrPattern(
    [...config.episode_markers, ...config.disc_markers],
    "episodeMarker"
  );
  const allSeparatorsPattern = buildOrPattern(
    [...config.episode_markers, ...config.disc_markers, ...allSeparators],
    "episodeSeparator",
    true
  );
  rebulk.chain({
    tags: ["SxxExx"],
    validateAll: true,
    validator: {
      __parent__: and_(sepsSurround, orderingValidator)
    },
    chainBreaker: (matches) => episodesSeasonChainBreaker(matches, config),
    disabled: isSeasonEpisodeDisabled
  }).defaults({ tags: ["SxxExx"] }).regex(
    seasonMarkerPattern + `(?<season>\\d+)@?` + episodeMarkerPattern + `@?(?<episode>\\d+)`
  ).repeater("+").regex(
    allSeparatorsPattern + `@?(?<episode>\\d+)`
  ).repeater("*");
  const seasonEpMarkerPattern = buildOrPattern(config.season_ep_markers, "episodeMarker");
  rebulk.chain({
    tags: ["SxxExx"],
    validateAll: true,
    validator: {
      __parent__: and_(sepsSurround, orderingValidator)
    },
    disabled: isSeasonEpisodeDisabled
  }).defaults({ tags: ["SxxExx"] }).regex(
    `(?<season>\\d+)@?` + seasonEpMarkerPattern + `@?(?<episode>\\d+)`
  ).repeater("+");
  rebulk.chain({
    tags: ["SxxExx"],
    validateAll: true,
    validator: {
      __parent__: and_(sepsSurround, orderingValidator)
    },
    disabled: isSeasonEpisodeDisabled
  }).defaults({ tags: ["SxxExx"] }).regex(`(?<season>\\d+)@?` + seasonEpMarkerPattern + `@?(?<episode>\\d+)`).regex(
    buildOrPattern(
      [...config.season_ep_markers, ...discreteSeparators, ...config.range_separators],
      "episodeSeparator",
      true
    ) + `(?<episode>\\d+)`
  ).repeater("*");
  const seasonOnlySepPattern = buildOrPattern(
    [...config.season_markers, ...discreteSeparators, ...config.range_separators],
    "seasonSeparator",
    true
  );
  rebulk.chain({
    tags: ["SxxExx"],
    validateAll: true,
    validator: {
      __parent__: and_(sepsSurround, orderingValidator)
    },
    disabled: isSeasonEpisodeDisabled
  }).defaults({ tags: ["SxxExx"] }).regex(seasonMarkerPattern + `(?<season>\\d+)`).regex(`(?<other>Extras)`, { name: "other", value: "Extras", tags: ["no-release-group-prefix"] }).repeater("?").regex(seasonOnlySepPattern + `(?<season>\\d+)`).repeater("*");
  for (const detail of ["Special", "Pilot", "Unaired", "Final"]) {
    rebulk.string(detail, {
      name: "episode_details",
      value: detail,
      children: false,
      privateParent: false,
      disabled: (context) => isDisabled(context, "episode_details")
    });
  }
  const seasonWordPattern = buildOrPattern(config.season_words, "seasonMarker");
  const ofWordPattern = buildOrPattern(config.of_words);
  rebulk.chain({
    validateAll: true,
    conflictSolver: seasonEpisodeConflictSolver,
    formatter: { season: parseNumber, season_count: parseNumber },
    validator: {
      __parent__: and_(sepsSurround, orderingValidator),
      season: validateRoman,
      season_count: validateRoman
    },
    chainBreaker: (matches) => episodesSeasonChainBreaker(matches, config),
    disabled: (context) => context?.type === "movie" || isDisabled(context, "season")
  }).defaults({
    formatter: { season: parseNumber, season_count: parseNumber },
    validator: { season: validateRoman, season_count: validateRoman },
    conflictSolver: seasonEpisodeConflictSolver
  }).regex(seasonWordPattern + `@?(?P<season>${numeralWithWords})`).regex(ofWordPattern + `@?(?P<season_count>${numeral})`).repeater("?").regex(
    `@?` + buildOrPattern(
      [...config.range_separators, ...discreteSeparators, "@"],
      "seasonSeparator",
      true
    ) + `@?(?P<season>\\d+)`
  ).repeater("*");
  const episodeWordPattern = buildOrPattern(config.episode_words, "episodeMarker");
  rebulk.regex(
    `(?<![a-zA-Z])` + episodeWordPattern + `@?(?<episode>\\d+)(?:v(?<version>\\d+))?(?:@?` + ofWordPattern + `@?(?<count>\\d+))?`,
    {
      disabled: (context) => context?.type === "episode" || isDisabled(context, "episode")
    }
  );
  rebulk.regex(
    `(?<![a-zA-Z])` + episodeWordPattern + `@?(?<episode>${numeral})(?:v(?<version>\\d+))?(?:@?` + ofWordPattern + `@?(?<count>\\d+))?`,
    {
      validator: { episode: validateRoman },
      formatter: { episode: parseNumber },
      disabled: (context) => context?.type !== "episode" || isDisabled(context, "episode")
    }
  );
  rebulk.regex(
    `S?(?<season>\\d+)-?(?:xE|Ex|E|x)-?(?<other>` + buildOrPattern(config.all_words) + ")",
    {
      tags: ["SxxExx"],
      formatter: { other: () => "Complete" },
      disabled: (context) => isDisabled(context, "season")
    }
  );
  rebulk.chain({
    tags: ["weak-episode"],
    disabled: (context) => context?.type === "movie" || isDisabled(context, "episode")
  }).defaults({ validator: null, tags: ["weak-episode"] }).regex(`(?<episode>\\d{2})(?!(?:st|nd|rd|th)\\b)`).regex(`v(?<version>\\d+)`).repeater("?").regex(`(?<episodeSeparator>[x-])(?<episode>\\d{2})`, {
    abbreviations: null
  }).repeater("*");
  rebulk.chain({
    tags: ["weak-episode"],
    disabled: (context) => context?.type === "movie" || isDisabled(context, "episode")
  }).defaults({ validator: null, tags: ["weak-episode"] }).regex(`0(?<episode>\\d{1,2})`).regex(`v(?<version>\\d+)`).repeater("?").regex(`(?<episodeSeparator>[x-])0(?<episode>\\d{1,2})`, {
    abbreviations: null
  }).repeater("*");
  rebulk.chain({
    tags: ["weak-episode"],
    name: "weak_episode",
    disabled: (context) => context?.type === "movie" || isDisabled(context, "episode")
  }).defaults({
    validator: null,
    tags: ["weak-episode"],
    name: "weak_episode"
  }).regex(`(?<episode>\\d{3,4})`).regex(`v(?<version>\\d+)`).repeater("?").regex(`(?<episodeSeparator>[x-])(?<episode>\\d{3,4})`, {
    abbreviations: null
  }).repeater("*");
  rebulk.chain({
    tags: ["weak-episode"],
    disabled: (context) => context?.type !== "episode" || isDisabled(context, "episode")
  }).defaults({ validator: null, tags: ["weak-episode"] }).regex(`(?<episode>\\d)`).regex(`v(?<version>\\d+)`).repeater("?").regex(`(?<episodeSeparator>[x-])(?<episode>\\d{1,2})`, {
    abbreviations: null
  }).repeater("*");
  rebulk.chain({
    validateAll: true,
    validator: { __parent__: sepsSurround },
    disabled: (context) => isDisabled(context, "episode")
  }).defaults({ validator: null }).regex(`(?<season>\\d{1,2})?(?<episodeMarker>e)(?<episode>\\d{1,4})`).regex(`v(?<version>\\d+)`).repeater("?").regex(`(?<episodeSeparator>e|x|-)(?<episode>\\d{1,4})`, {
    abbreviations: null
  }).repeater("*");
  rebulk.chain({
    disabled: (context) => isDisabled(context, "episode")
  }).defaults({ validator: null }).regex(`(?<![a-zA-Z])ep-?(?<episode>\\d{1,4})`).regex(`v(?<version>\\d+)`).repeater("?").regex(`(?<episodeSeparator>ep|e|x|-)(?<episode>\\d{1,4})`, {
    abbreviations: null
  }).repeater("*");
  rebulk.chain({
    tags: ["see-pattern"],
    disabled: isSeasonEpisodeDisabled
  }).defaults({ validator: null, tags: ["see-pattern"] }).regex(`(?<seasonMarker>cap)@?(?<season>\\d{1,2})(?<episode>\\d{2})(?!\\d)`).regex(`(?<episodeSeparator>[_-])(?<season>\\d{1,2})(?<episode>\\d{2})(?!\\d)`).repeater("?");
  rebulk.chain({
    tags: ["weak-episode", "weak-duplicate"],
    name: "weak_duplicate",
    conflictSolver: seasonEpisodeConflictSolver,
    disabled: (context) => context?.episode_prefer_number === true || context?.type === "movie" || isSeasonEpisodeDisabled(context)
  }).defaults({
    tags: ["weak-episode", "weak-duplicate"],
    name: "weak_duplicate",
    validator: null,
    conflictSolver: seasonEpisodeConflictSolver
  }).regex(`(?<season>\\d{1,2})(?<episode>\\d{2})`).regex(`v(?<version>\\d+)`).repeater("?").regex(`(?<episodeSeparator>x|-)(?<episode>\\d{2})`, {
    abbreviations: null
  }).repeater("*");
  rebulk.regex(`v(?<version>\\d+)`, {
    formatter: { version: (v) => parseInt(v, 10) },
    disabled: (context) => isDisabled(context, "version")
  });
  rebulk.regex(
    `(?<episode>\\d+)@?` + ofWordPattern + `@?(?<episode_count>\\d+)@?` + episodeWordPattern + "?",
    {
      formatter: { episode: (v) => parseInt(v, 10), episode_count: (v) => parseInt(v, 10) },
      preMatchProcessor: (match) => {
        match.value = cleanup(match.value);
        return match;
      },
      disabled: (context) => isDisabled(context, "episode")
    }
  );
  rebulk.regex(`Minisodes?`, {
    children: false,
    privateParent: false,
    name: "episode_format",
    value: "Minisode",
    disabled: (context) => isDisabled(context, "episode_format")
  });
  rebulk.rules(
    new DiscMarkerRule(config),
    FixCorruptedGroupBoundaryValues,
    new RangeExpansionRule(config),
    WeakConflictSolverRule,
    RemoveWeakIfSxxExxRule,
    AbsoluteEpisodeInGroupRule,
    RemoveInvalidSeasonRule,
    RemoveInvalidEpisodeRule,
    RemoveUndeterminedLanguagesRule$1
  );
  return rebulk;
}
class DiscMarkerRule extends Rule {
  constructor(config) {
    super();
    this.priority = 128;
    this.config = config;
  }
  when(matches, _context) {
    const discMarkers = new Set((this.config.disc_markers || []).map((s) => s.toLowerCase()));
    if (discMarkers.size === 0) return false;
    const toRename = [];
    const episodes2 = matches.named("episode", (m) => !m.private) || [];
    for (const ep of episodes2) {
      const initiator = ep.initiator;
      if (!initiator) continue;
      const children = initiator.children;
      if (!children) continue;
      const markers = (typeof children.named === "function" ? children.named("episodeMarker") : []) || [];
      for (const marker of markers) {
        const markerText = (marker.rawString || marker.raw || marker.value || "").toString().toLowerCase();
        if (discMarkers.has(markerText)) {
          toRename.push(ep);
          break;
        }
      }
    }
    return toRename.length > 0 ? toRename : false;
  }
  then(matches, toRename, _context) {
    for (const ep of toRename) {
      matches.remove(ep);
      ep.name = "disc";
      matches.append(ep);
    }
  }
}
class FixCorruptedGroupBoundaryValues extends Rule {
  when(matches, _context) {
    const toFix = [];
    const groups2 = matches.markers?.named("group") || [];
    const groupArr = Array.isArray(groups2) ? groups2 : groups2 ? [groups2] : [];
    for (const match of matches) {
      if (match.name !== "episode" && match.name !== "season") continue;
      if (typeof match.value !== "number") continue;
      const atGroupEnd = groupArr.some((g) => match.end === g.end);
      if (!atGroupEnd) continue;
      const inputStr = matches.inputString || "";
      let digitEnd = match.end - 1;
      let digitStart = digitEnd;
      while (digitStart > match.start && /\d/.test(inputStr[digitStart - 1])) {
        digitStart--;
      }
      if (digitStart >= digitEnd) continue;
      const correctStr = inputStr.slice(digitStart, digitEnd);
      const correctValue = parseInt(correctStr, 10);
      if (isNaN(correctValue) || correctValue === match.value) continue;
      toFix.push({ match, correctValue });
    }
    return toFix.length > 0 ? toFix : false;
  }
  then(matches, whenResponse, _context) {
    for (const { match, correctValue } of whenResponse) {
      match.value = correctValue;
      matches.inputString || "";
      let digitEnd = match.end - 1;
      if (match.rawEnd < digitEnd) {
        match.rawEnd = digitEnd;
      }
    }
  }
}
class RangeExpansionRule extends Rule {
  constructor(config) {
    super();
    this.consequence = AppendMatch;
    this.config = config;
  }
  when(matches, _context) {
    const toAppend = [];
    const rangeSeps = new Set(this.config.range_separators || ["-", "~", "to", "a"]);
    const fileparts = matches.markers?.named("path") || [];
    const filepartArr = Array.isArray(fileparts) ? fileparts : fileparts ? [fileparts] : [];
    const getFilepart = (m) => {
      for (const fp of filepartArr) {
        if (m.start >= fp.start && m.end <= fp.end) return fp;
      }
      return null;
    };
    for (const name of ["season", "episode", "absolute_episode", "disc"]) {
      const maxRange = name === "season" ? this.config.season_max_range : this.config.episode_max_range;
      const all = matches.named(name, (m) => !m.private) || [];
      if (all.length < 2) continue;
      const sorted = [...all].sort((a, b) => a.start - b.start);
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = sorted[i];
        const next = sorted[i + 1];
        const currentFp = getFilepart(current);
        const nextFp = getFilepart(next);
        if (currentFp !== nextFp || !currentFp) continue;
        const curVal = typeof current.value === "number" ? current.value : parseInt(current.value, 10);
        const nextVal = typeof next.value === "number" ? next.value : parseInt(next.value, 10);
        if (isNaN(curVal) || isNaN(nextVal)) continue;
        if (nextVal <= curVal) continue;
        const gap = nextVal - curVal;
        if (gap <= 1 || gap > maxRange) continue;
        const between = matches.inputString?.slice(current.end, next.start) || "";
        const betweenClean = between.replace(/[\s._]/g, "").toLowerCase();
        const betweenStripMarkers = betweenClean.replace(/[sex]/gi, "");
        const isRange = rangeSeps.has(betweenClean) || rangeSeps.has(betweenStripMarkers);
        const sameChain = current.initiator && current.initiator === next.initiator;
        const discreteSeps = new Set((this.config.discrete_separators || ["+", "&", "and", "et"]).map((s) => s.toLowerCase()));
        const isDiscrete = discreteSeps.has(betweenClean);
        if (isRange || sameChain && !isDiscrete) {
          for (let v = curVal + 1; v < nextVal; v++) {
            const m = new Match(current.start, next.end, {
              name,
              value: v,
              inputString: matches.inputString,
              tags: current.tags ? [...current.tags] : []
            });
            toAppend.push(m);
          }
        }
      }
    }
    return toAppend.length > 0 ? toAppend : false;
  }
}
class RemoveInvalidSeasonRule extends Rule {
  constructor() {
    super(...arguments);
    this.consequence = RemoveMatch;
    this.priority = 64;
  }
  when(matches, context) {
    const toRemove = [];
    for (const filepart of matches.markers?.named("path") || []) {
      const strongSeason = matches.range?.(
        filepart.start,
        filepart.end,
        (m) => m.name === "season" && !m.private && m.tags?.includes("SxxExx")
      )?.[0];
      if (strongSeason?.initiator?.children?.named("episode")) {
        for (const season of matches.range?.(
          strongSeason.end,
          filepart.end,
          (m) => m.name === "season" && !m.private
        ) || []) {
          if (!season.tags?.includes("SxxExx") || !season.initiator?.children?.named("episode")) {
            if (season.initiator) {
              toRemove.push(season.initiator);
              toRemove.push(...season.initiator.children || []);
            } else {
              toRemove.push(season);
            }
          }
        }
      }
    }
    return toRemove.length > 0 ? toRemove : false;
  }
}
class RemoveInvalidEpisodeRule extends Rule {
  constructor() {
    super(...arguments);
    this.consequence = RemoveMatch;
    this.priority = 64;
  }
  when(matches, context) {
    const toRemove = [];
    for (const filepart of matches.markers?.named("path") || []) {
      const strongEpisode = matches.range?.(
        filepart.start,
        filepart.end,
        (m) => m.name === "episode" && !m.private && m.tags?.includes("SxxExx")
      )?.[0];
      if (strongEpisode) {
        const strongMarker = this.getEpisodePrefix(matches, strongEpisode);
        for (const episode of matches.range?.(
          strongEpisode.end,
          filepart.end,
          (m) => m.name === "episode" && !m.private
        ) || []) {
          if (episode.tags?.includes("SxxExx")) continue;
          const marker = this.getEpisodePrefix(matches, episode);
          const epMarkers = episode.initiator?.children?.named?.("episodeMarker") || [];
          const epMarkerArr = Array.isArray(epMarkers) ? epMarkers : [epMarkers];
          const hasShortEMarker = epMarkerArr.some((m) => {
            const raw = (m.rawString || m.raw || m.value || "").toString().toLowerCase();
            return raw === "e" || raw === "ep";
          });
          const shouldRemove = strongMarker && marker ? strongMarker.value?.toLowerCase?.() !== marker.value?.toLowerCase?.() : !episode.tags?.includes("SxxExx") && !hasShortEMarker;
          if (shouldRemove) {
            if (episode.initiator) {
              toRemove.push(episode.initiator);
              toRemove.push(...episode.initiator.children || []);
            } else {
              if (marker) toRemove.push(marker);
              toRemove.push(episode);
            }
          }
        }
      }
    }
    return toRemove.length > 0 ? toRemove : false;
  }
  getEpisodePrefix(matches, episode) {
    return matches.previous?.(
      episode,
      (m) => !m.private && ["episodeMarker", "episodeSeparator"].includes(m.name)
    )?.[0];
  }
}
let RemoveUndeterminedLanguagesRule$1 = class RemoveUndeterminedLanguagesRule extends Rule {
  constructor() {
    super(...arguments);
    this.consequence = RemoveMatch;
    this.priority = 32;
  }
  when(matches, context) {
    return false;
  }
};
class WeakConflictSolverRule extends Rule {
  constructor() {
    super(...arguments);
    this.consequence = RemoveMatch;
    this.priority = 128;
  }
  enabled(context) {
    return context?.type !== "movie";
  }
  isAnime(matches) {
    if (matches.named("version")?.length > 0) return true;
    if (matches.named("crc32")?.length > 0) return true;
    const groups2 = matches.markers?.named("group") || [];
    const groupArr = Array.isArray(groups2) ? groups2 : groups2 ? [groups2] : [];
    for (const group of groupArr) {
      const screenSizeInGroup = matches.range?.(
        group.start,
        group.end,
        (m) => m.name === "screen_size"
      );
      const hasScreenSize = Array.isArray(screenSizeInGroup) ? screenSizeInGroup.length > 0 : !!screenSizeInGroup;
      if (hasScreenSize) return true;
      const innerMatches = matches.range?.(
        group.start,
        group.end,
        (m) => !m.private && !m.tags?.includes("weak-language")
      ) || [];
      const innerArr = Array.isArray(innerMatches) ? innerMatches : innerMatches ? [innerMatches] : [];
      const nonRG = innerArr.filter((m) => m.name !== "release_group");
      if (nonRG.length === 0) {
        const groupText = (matches.inputString ?? "").slice(group.start + 1, group.end - 1).trim();
        if (groupText && !/^\d+$/.test(groupText)) return true;
      }
    }
    return false;
  }
  when(matches, _context) {
    const toRemove = [];
    const animeDetected = this.isAnime(matches);
    const fileparts = matches.markers?.named("path") || [];
    const filepartArr = Array.isArray(fileparts) ? fileparts : fileparts ? [fileparts] : [];
    for (const filepart of filepartArr) {
      const weakMatches = matches.range?.(
        filepart.start,
        filepart.end,
        (m) => m.initiator?.name === "weak_episode"
      ) || [];
      const weakDupMatches = matches.range?.(
        filepart.start,
        filepart.end,
        (m) => m.initiator?.name === "weak_duplicate"
      ) || [];
      if (animeDetected) {
        if (weakMatches.length > 0) {
          toRemove.push(...weakDupMatches);
        }
      } else if (weakDupMatches.length > 0) {
        const episodesInRange = matches.range?.(filepart.start, filepart.end, (m) => {
          if (m.name !== "episode" || m.initiator?.name !== "weak_episode") return false;
          const children = m.initiator?.children;
          if (!children) return false;
          if (Array.isArray(children)) return children.some((c) => c.name === "episodeSeparator");
          if (typeof children.named === "function") return (children.named("episodeSeparator") || []).length > 0;
          return false;
        }) || [];
        const hasSxxExx = (matches.range?.(
          filepart.start,
          filepart.end,
          (m) => m.tags?.includes("SxxExx") && !m.private
        ) || []).length > 0;
        if (episodesInRange.length === 0 && !hasSxxExx) {
          toRemove.push(...weakMatches);
        } else if (episodesInRange.length > 0) {
          toRemove.push(...weakDupMatches);
        }
      }
    }
    return toRemove.length > 0 ? toRemove : false;
  }
}
class AbsoluteEpisodeInGroupRule extends Rule {
  constructor() {
    super(...arguments);
    this.priority = -1;
  }
  when(matches, _context) {
    const toRename = [];
    const fileparts = matches.markers?.named("path") || [];
    const filepartArr = Array.isArray(fileparts) ? fileparts : [fileparts];
    for (const filepart of filepartArr) {
      const episodes2 = matches.range?.(
        filepart.start,
        filepart.end,
        (m) => m.name === "episode" && !m.private
      ) || [];
      if (episodes2.length < 2) continue;
      const groups2 = matches.markers?.named?.("group") || [];
      const groupArr = Array.isArray(groups2) ? groups2 : groups2 ? [groups2] : [];
      const relevantGroups = groupArr.filter((g) => g.start >= filepart.start && g.end <= filepart.end);
      const isInGroup = (m) => relevantGroups.some((g) => m.start >= g.start && m.end <= g.end);
      const insideGroup = episodes2.filter(isInGroup);
      const outsideGroup = episodes2.filter((m) => !isInGroup(m));
      if (insideGroup.length > 0 && outsideGroup.length > 0) {
        toRename.push(...insideGroup);
      }
    }
    if (toRename.length === 0) return false;
    this._toRename = toRename;
    return true;
  }
  then(matches, _whenResponse, _context) {
    const toRename = this._toRename || [];
    for (const match of toRename) {
      matches.remove(match);
      match.name = "absolute_episode";
      matches.append(match);
    }
  }
}
class RemoveWeakIfSxxExxRule extends Rule {
  constructor() {
    super(...arguments);
    this.consequence = RemoveMatch;
    this.priority = 64;
  }
  when(matches, _context) {
    const toRemove = [];
    const toRename = [];
    const fileparts = matches.markers?.named("path") || [];
    const filepartArr = Array.isArray(fileparts) ? fileparts : [fileparts];
    for (const filepart of filepartArr) {
      const sxxexxMatches = matches.range?.(
        filepart.start,
        filepart.end,
        (m) => !m.private && m.tags?.includes("SxxExx")
      ) || [];
      const hasSxxExx = Array.isArray(sxxexxMatches) ? sxxexxMatches.length > 0 : !!sxxexxMatches;
      if (hasSxxExx) {
        const weakEpisodes = matches.range?.(
          filepart.start,
          filepart.end,
          (m) => m.tags?.includes("weak-episode")
        ) || [];
        const weakEpByInitiator = /* @__PURE__ */ new Map();
        for (const match of weakEpisodes) {
          const init = match.initiator;
          if (!weakEpByInitiator.has(init)) weakEpByInitiator.set(init, []);
          weakEpByInitiator.get(init).push(match);
        }
        for (const match of weakEpisodes) {
          const initiator = match.initiator;
          const isWeakEpisode = match.name === "episode" && initiator?.name === "weak_episode";
          const siblings = weakEpByInitiator.get(initiator) || [];
          const isRange = siblings.filter((s) => s.name === "episode").length > 1;
          const inp = matches.inputString || "";
          const mStart = initiator?.start ?? match.start;
          const mEnd = initiator?.end ?? match.end;
          const prevChar = mStart > 0 ? inp[mStart - 1] : "";
          const nextChar = mEnd < inp.length ? inp[mEnd] : "";
          const isSurrounded = (!prevChar || seps.includes(prevChar)) && (!nextChar || seps.includes(nextChar));
          if (isWeakEpisode && isSurrounded && isRange) {
            toRename.push(match);
          } else {
            toRemove.push(match);
          }
        }
      }
    }
    this._toRename = toRename;
    return toRemove.length > 0 || toRename.length > 0 ? toRemove : false;
  }
  then(matches, toRemove, _context) {
    if (toRemove && Array.isArray(toRemove)) {
      for (const match of toRemove) {
        matches.remove(match);
      }
    }
    const toRename = this._toRename || [];
    for (const match of toRename) {
      matches.remove(match);
      match.name = "absolute_episode";
      matches.append(match);
    }
  }
}
function container(config) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, "container") });
  rebulk.regexDefaults({ flags: "i" }).stringDefaults({ ignoreCase: true });
  rebulk.defaults({
    name: "container",
    formatter: (value) => value.replace(new RegExp(`[${reEscape(seps)}]`, "g"), ""),
    tags: ["extension"],
    conflictSolver: (match, other2) => other2.name === "source" || other2.name === "video_codec" || other2.name === "container" && !other2.tags.includes("extension") ? other2 : "__default__"
  });
  const subtitles = config["subtitles"] || [];
  const info = config["info"] || [];
  const videos = config["videos"] || [];
  const torrent = config["torrent"] || [];
  const nzb = config["nzb"] || [];
  if (subtitles.length) rebulk.regex("\\." + buildOrPattern(subtitles, void 0, true) + "$", {
    exts: subtitles,
    tags: ["extension", "subtitle"]
  });
  if (info.length) rebulk.regex("\\." + buildOrPattern(info, void 0, true) + "$", {
    exts: info,
    tags: ["extension", "info"]
  });
  if (videos.length) rebulk.regex("\\." + buildOrPattern(videos, void 0, true) + "$", {
    exts: videos,
    tags: ["extension", "video"]
  });
  if (torrent.length) rebulk.regex("\\." + buildOrPattern(torrent, void 0, true) + "$", {
    exts: torrent,
    tags: ["extension", "torrent"]
  });
  if (nzb.length) rebulk.regex("\\." + buildOrPattern(nzb, void 0, true) + "$", {
    exts: nzb,
    tags: ["extension", "nzb"]
  });
  rebulk.defaults({
    clear: true,
    name: "container",
    validator: sepsSurround,
    formatter: (s) => s.toLowerCase(),
    conflictSolver: (match, other2) => other2.name === "source" || other2.name === "video_codec" || other2.name === "container" && other2.tags.includes("extension") ? match : "__default__"
  });
  const nonStdSubtitles = subtitles.filter((s) => !["sub", "ass"].includes(s));
  rebulk.string(...nonStdSubtitles, { tags: ["subtitle"] });
  rebulk.string(...videos, { tags: ["video"] });
  rebulk.string(...torrent, { tags: ["torrent"] });
  rebulk.string(...nzb, { tags: ["nzb"] });
  return rebulk;
}
function source(config) {
  const ripPrefix = config["rip_prefix"] ?? "(?P<other>Rip)-?";
  const ripSuffix = config["rip_suffix"] ?? "-?(?P<other>Rip)";
  function buildSourcePattern(patterns, prefix = "", suffix = "") {
    return patterns.map((p) => `${prefix}(${p})${suffix}`);
  }
  function demoteOther(match, other2) {
    return ["other", "release_group"].includes(other2.name ?? "") ? other2 : "__default__";
  }
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, "source") });
  rebulk.regexDefaults({
    flags: "i",
    abbreviations: [dash],
    privateParent: true,
    children: true
  });
  rebulk.defaults({
    name: "source",
    tags: ["video-codec-prefix", "streaming_service.suffix"],
    validateAll: true,
    validator: { __parent__: or_(sepsBefore, sepsAfter) }
  });
  rebulk.regex(
    ...buildSourcePattern(["VHS"], "", optional(ripSuffix)),
    { value: { source: "VHS", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["CAM"], "", optional(ripSuffix)),
    { value: { source: "Camera", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["HD-?CAM"], "", optional(ripSuffix)),
    { value: { source: "HD Camera", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["TELESYNC", "TS"], "", optional(ripSuffix)),
    { value: { source: "Telesync", other: "Rip" }, tags: ["video-codec-prefix"], overrides: ["tags"] }
  );
  rebulk.regex(
    ...buildSourcePattern(["HD-?TELESYNC", "HD-?TS"], "", optional(ripSuffix)),
    { value: { source: "HD Telesync", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["WORKPRINT", "WP"]),
    { value: "Workprint" }
  );
  rebulk.regex(
    ...buildSourcePattern(["TELECINE", "TC"], "", optional(ripSuffix)),
    { value: { source: "Telecine", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["HD-?TELECINE", "HD-?TC"], "", optional(ripSuffix)),
    { value: { source: "HD Telecine", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["PPV"], "", optional(ripSuffix)),
    { value: { source: "Pay-per-view", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["SD-?TV"], "", optional(ripSuffix)),
    { value: { source: "TV", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["TV"], "", ripSuffix),
    { value: { source: "TV", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["TV", "SD-?TV"], ripPrefix),
    { value: { source: "TV", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["TV-?(?=Dub)"]),
    { value: "TV" }
  );
  rebulk.regex(
    ...buildSourcePattern(["DVB", "PD-?TV"], "", optional(ripSuffix)),
    { value: { source: "Digital TV", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["DVD"], "", optional(ripSuffix)),
    { value: { source: "DVD", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["DM"], "", optional(ripSuffix)),
    { value: { source: "Digital Master", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["VIDEO-?TS", "DVD-?R(?:$|(?!E))", "DVD-?9", "DVD-?5"]),
    { value: "DVD" }
  );
  rebulk.regex(
    ...buildSourcePattern(["HD-?TV"], "", optional(ripSuffix)),
    { conflictSolver: demoteOther, value: { source: "HDTV", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["TV-?HD"], "", ripSuffix),
    { conflictSolver: demoteOther, value: { source: "HDTV", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["TV"], "", "-?(?P<other>Rip-?HD)"),
    { conflictSolver: demoteOther, value: { source: "HDTV", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["VOD"], "", optional(ripSuffix)),
    { value: { source: "Video on Demand", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["WEB", "WEB-?DL"], "", ripSuffix),
    { value: { source: "Web", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["WEB-?(?P<another>Cap)"], "", optional(ripSuffix)),
    { value: { source: "Web", other: "Rip", another: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["WEB-?DL", "WEB-?U?HD", "DL-?WEB", "DL(?=-?Mux)"]),
    { value: { source: "Web" } }
  );
  rebulk.regex("(WEB)", { value: "Web", tags: "weak.source" });
  rebulk.regex(
    ...buildSourcePattern(["HD-?DVD"], "", optional(ripSuffix)),
    { value: { source: "HD-DVD", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["Blu-?ray", "BD", "BD[59]", "BD25", "BD50"], "", optional(ripSuffix)),
    { value: { source: "Blu-ray", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["(?P<another>BR)-?(?=Scr(?:eener)?)", "(?P<another>BR)-?(?=Mux)"]),
    { value: { source: "Blu-ray", another: "Reencoded" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["(?P<another>BR)"], "", ripSuffix),
    { value: { source: "Blu-ray", other: "Rip", another: "Reencoded" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["Ultra-?Blu-?ray", "Blu-?ray-?Ultra"]),
    { value: "Ultra HD Blu-ray" }
  );
  rebulk.regex(
    ...buildSourcePattern(["AHDTV"]),
    { value: "Analog HDTV" }
  );
  rebulk.regex(
    ...buildSourcePattern(["UHD-?TV"], "", optional(ripSuffix)),
    { conflictSolver: demoteOther, value: { source: "Ultra HDTV", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["UHD"], "", ripSuffix),
    { conflictSolver: demoteOther, value: { source: "Ultra HDTV", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["DSR", "DTH"], "", optional(ripSuffix)),
    { value: { source: "Satellite", other: "Rip" } }
  );
  rebulk.regex(
    ...buildSourcePattern(["DSR?", "SAT"], "", ripSuffix),
    { value: { source: "Satellite", other: "Rip" } }
  );
  rebulk.rules(ValidateSourcePrefixSuffix, ValidateWeakSource, UltraHdBlurayRule);
  return rebulk;
}
const _ValidateSourcePrefixSuffix = class _ValidateSourcePrefixSuffix extends Rule {
  constructor() {
    super(...arguments);
    this.consequence = RemoveMatch;
  }
  enabled(context) {
    return !isDisabled(context, "source");
  }
  when(matches, _context) {
    const ret = [];
    for (const filepart of matches.markers.named("path") ? [matches.markers.named("path")].flat() : []) {
      const fp = filepart;
      const sources = matches.range(fp.start, fp.end, (m) => m.name === "source");
      for (const match of Array.isArray(sources) ? sources : sources ? [sources] : []) {
        const initiator = match.initiator ?? match;
        const hasPrefixSep = sepsBefore(initiator);
        const hasPrefixTag = matches.range(
          initiator.start - 1,
          initiator.start,
          (m) => m.tags?.includes("source-prefix")
        );
        if (!hasPrefixSep && !(Array.isArray(hasPrefixTag) ? hasPrefixTag.length > 0 : !!hasPrefixTag)) {
          if (initiator.children?.length > 0) ret.push(...initiator.children.toArray());
          ret.push(initiator);
          continue;
        }
        const hasSuffixSep = sepsAfter(initiator);
        const hasSuffixTag = matches.range(
          initiator.end,
          initiator.end + 1,
          (m) => m.tags?.includes("source-suffix")
        );
        if (!hasSuffixSep && !(Array.isArray(hasSuffixTag) ? hasSuffixTag.length > 0 : !!hasSuffixTag)) {
          if (initiator.children?.length > 0) ret.push(...initiator.children.toArray());
          ret.push(initiator);
        }
      }
    }
    return ret;
  }
};
_ValidateSourcePrefixSuffix.priority = 64;
let ValidateSourcePrefixSuffix = _ValidateSourcePrefixSuffix;
const _ValidateWeakSource = class _ValidateWeakSource extends Rule {
  constructor() {
    super(...arguments);
    this.consequence = RemoveMatch;
  }
  enabled(context) {
    return !isDisabled(context, "source");
  }
  when(matches, _context) {
    const ret = [];
    for (const filepart of [matches.markers.named("path")].flat().filter(Boolean)) {
      const sources = matches.range(filepart.start, filepart.end, (m) => m.name === "source");
      for (const match of Array.isArray(sources) ? sources : sources ? [sources] : []) {
        if (!match.tags?.includes("weak.source")) continue;
        const nextSource = matches.range(match.end, filepart.end, (m) => m.name === "source");
        const hasNextSource = Array.isArray(nextSource) ? nextSource.length > 0 : !!nextSource;
        const holeBeforeMatch = matches.holes(filepart.start, match.start, {
          predicate: (m) => !!(m.value && String(m.value).replace(new RegExp(`[${sepsPattern}]`, "g"), ""))
        });
        const hasHoleBefore = Array.isArray(holeBeforeMatch) ? holeBeforeMatch.length > 0 : !!holeBeforeMatch;
        if (hasNextSource && hasHoleBefore) {
          if (match.children?.length > 0) ret.push(...match.children.toArray());
          ret.push(match);
        }
      }
    }
    return ret;
  }
};
_ValidateWeakSource.priority = 64;
let ValidateWeakSource = _ValidateWeakSource;
class UltraHdBlurayRule extends Rule {
  constructor() {
    super(...arguments);
    this.consequence = [RemoveMatch, AppendMatch];
  }
  enabled(context) {
    return !isDisabled(context, "source");
  }
  when(matches, _context) {
    const toRemove = [];
    const toAppend = [];
    for (const filepart of [matches.markers.named("path")].flat().filter(Boolean)) {
      const bluRaySources = matches.range(
        filepart.start,
        filepart.end,
        (m) => !m.private && m.name === "source" && m.value === "Blu-ray"
      );
      for (const match of Array.isArray(bluRaySources) ? bluRaySources : bluRaySources ? [bluRaySources] : []) {
        const findUltraHd = (start, end) => matches.range(start, end, (m) => !m.private && m.name === "other" && m.value === "Ultra HD")?.[0];
        let other2 = findUltraHd(filepart.start, match.start);
        if (other2) {
          const hasHoles = matches.holes(
            other2.end,
            match.start,
            { predicate: (m) => !!(m.value && String(m.value).replace(new RegExp(`[${sepsPattern}]`, "g"), "")) }
          );
          const hasInvalidMatches = matches.range(
            other2.end,
            match.start,
            (m) => !m.private && !["screen_size", "color_depth"].includes(m.name ?? "") && !(m.name === "other" && m.tags?.includes("uhdbluray-neighbor"))
          );
          if ((Array.isArray(hasHoles) ? hasHoles.length : hasHoles ? 1 : 0) > 0 || (Array.isArray(hasInvalidMatches) ? hasInvalidMatches.length : hasInvalidMatches ? 1 : 0) > 0) {
            other2 = void 0;
          }
        }
        if (!other2) {
          other2 = findUltraHd(match.end, filepart.end);
          if (other2) {
            const hasHoles = matches.holes(
              match.end,
              other2.start,
              { predicate: (m) => !!(m.value && String(m.value).replace(new RegExp(`[${sepsPattern}]`, "g"), "")) }
            );
            const hasInvalidMatches = matches.range(
              match.end,
              other2.start,
              (m) => !m.private && !["screen_size", "color_depth"].includes(m.name ?? "") && !(m.name === "other" && m.tags?.includes("uhdbluray-neighbor"))
            );
            if ((Array.isArray(hasHoles) ? hasHoles.length : hasHoles ? 1 : 0) > 0 || (Array.isArray(hasInvalidMatches) ? hasInvalidMatches.length : hasInvalidMatches ? 1 : 0) > 0) {
              other2 = void 0;
            }
          }
        }
        if (!other2) {
          const has2160 = matches.range(
            filepart.start,
            filepart.end,
            (m) => m.name === "screen_size" && m.value === "2160p"
          );
          if (!(Array.isArray(has2160) ? has2160.length : has2160 ? 1 : 0)) continue;
        }
        if (other2) other2.private = true;
        const newSource = new Match(match.start, match.end, {
          name: match.name,
          inputString: matches.inputString,
          tags: [...match.tags ?? []],
          private: match.private,
          value: "Ultra HD Blu-ray"
        });
        toRemove.push(match);
        toAppend.push(newSource);
      }
    }
    if (toRemove.length || toAppend.length) return [toRemove, toAppend];
    return false;
  }
}
function videoCodec(config) {
  const rebulk = new Rebulk();
  rebulk.regexDefaults({
    flags: "i",
    abbreviations: [dash]
  });
  rebulk.stringDefaults({ ignoreCase: true });
  rebulk.defaults({
    name: "video_codec",
    tags: ["source-suffix", "streaming_service.suffix"],
    disabled: (context) => isDisabled(context, "video_codec")
  });
  rebulk.regex("Rv\\d{2}", { value: "RealVideo" });
  rebulk.regex("Mpe?g-?2", "[hx]-?262", { value: "MPEG-2" });
  rebulk.string("DVDivX", "DivX", { value: "DivX" });
  rebulk.string("XviD", { value: "Xvid" });
  rebulk.regex("VC-?1", { value: "VC-1" });
  rebulk.string("VP7", { value: "VP7" });
  rebulk.string("VP8", "VP80", { value: "VP8" });
  rebulk.string("VP9", { value: "VP9" });
  rebulk.regex("[hx]-?263", { value: "H.263" });
  rebulk.regex("[hx]-?264", "(?:MPEG-?4)?AVC(?:HD)?", { value: "H.264" });
  rebulk.regex("[hx]-?265", "HEVC", { value: "H.265" });
  rebulk.regex("(?<video_codec>hevc)(?<color_depth>10)", {
    value: { video_codec: "H.265", color_depth: "10-bit" },
    tags: ["video-codec-suffix"],
    children: true
  });
  rebulk.defaults({
    clear: true,
    name: "video_profile",
    validator: sepsSurround,
    disabled: (context) => isDisabled(context, "video_profile")
  });
  rebulk.string("BP", { value: "Baseline", tags: "video_profile.rule" });
  rebulk.string("XP", "EP", { value: "Extended", tags: "video_profile.rule" });
  rebulk.string("MP", { value: "Main", tags: "video_profile.rule" });
  rebulk.string("HP", "HiP", { value: "High", tags: "video_profile.rule" });
  rebulk.string("SC", "SVC", { value: "Scalable Video Coding", tags: "video_profile.rule" });
  rebulk.regex("AVC(?:HD)?", { value: "Advanced Video Codec High Definition", tags: "video_profile.rule" });
  rebulk.string("HEVC", { value: "High Efficiency Video Coding", tags: "video_profile.rule" });
  rebulk.regex("Hi422P", { value: "High 4:2:2" });
  rebulk.regex("Hi444PP", { value: "High 4:4:4 Predictive" });
  rebulk.regex("Hi10P?", { value: "High 10" });
  rebulk.string("DXVA", {
    value: "DXVA",
    name: "video_api",
    disabled: (context) => isDisabled(context, "video_api")
  });
  rebulk.defaults({
    clear: true,
    name: "color_depth",
    validator: sepsSurround,
    disabled: (context) => isDisabled(context, "color_depth")
  });
  rebulk.regex("12.?bits?", { value: "12-bit" });
  rebulk.regex("10.?bits?", "YUV420P10", "Hi10P?", { value: "10-bit" });
  rebulk.regex("8.?bits?", { value: "8-bit" });
  rebulk.rules(ValidateVideoCodec, VideoProfileRule);
  return rebulk;
}
const _ValidateVideoCodec = class _ValidateVideoCodec extends Rule {
  enabled(context) {
    return !isDisabled(context, "video_codec");
  }
  when(matches, _context) {
    const ret = [];
    const codecs = matches.named("video_codec");
    for (const codec of codecs) {
      if (!sepsBefore(codec) && !matches.atIndex(codec.start - 1, (m) => m.tags?.includes("video-codec-prefix"))) {
        ret.push(codec);
        continue;
      }
      if (!sepsAfter(codec) && !matches.atIndex(codec.end + 1, (m) => m.tags?.includes("video-codec-suffix"))) {
        ret.push(codec);
        continue;
      }
    }
    return ret;
  }
};
_ValidateVideoCodec.priority = 64;
_ValidateVideoCodec.consequence = RemoveMatch;
let ValidateVideoCodec = _ValidateVideoCodec;
const _VideoProfileRule = class _VideoProfileRule extends Rule {
  enabled(context) {
    return !isDisabled(context, "video_profile");
  }
  when(matches, _context) {
    const profileList = matches.named("video_profile", (m) => m.tags?.includes("video_profile.rule")) ?? [];
    const ret = [];
    for (const profile of profileList) {
      let codec = matches.atSpan(profile.span, (m) => m.name === "video_codec", 0);
      if (!codec) {
        codec = matches.previous(profile, (m) => m.name === "video_codec", 0);
      }
      if (!codec) {
        codec = matches.next(profile, (m) => m.name === "video_codec", 0);
      }
      if (!codec) {
        ret.push(profile);
      }
    }
    return ret;
  }
};
_VideoProfileRule.consequence = RemoveMatch;
let VideoProfileRule = _VideoProfileRule;
const REGEX_PREFIX = "re:";
const IMPORT_PREFIX = "import:";
const EVAL_PREFIX = "eval:";
const PATTERN_TYPES = ["regex", "string"];
const importCache = /* @__PURE__ */ new Map();
const registry = /* @__PURE__ */ new Map();
function registerFunction(name, fn) {
  registry.set(name, fn);
}
registry.set("seps_after", sepsAfter);
registry.set("seps_before", sepsBefore);
registry.set("seps_surround", sepsSurround);
const KNOWN_CONFLICT_SOLVERS = {
  // DTS-HD: remove the other audio_codec in favor of DTS-HD
  "lambda match, other: other if other.name == 'audio_codec' else '__default__'": (match, other2) => other2.name === "audio_codec" ? other2 : "__default__",
  // bit_rate: remove bit_rate if other is a strong audio_channels; else remove audio_channels
  "lambda match, other: match if other.name == 'audio_channels' and 'weak-audio_channels' not in other.tags else other": (match, other2) => {
    if (other2.name === "audio_channels" && !(other2.tags ?? []).includes("weak-audio_channels")) {
      return match;
    }
    return other2;
  },
  // bonus: yield to video_codec or strong episode; win against weak episodes
  "lambda match, conflicting: match if conflicting.name in ('video_codec', 'episode') and 'weak-episode' not in conflicting.tags else '__default__'": (match, conflicting) => {
    if (["video_codec", "episode"].includes(conflicting.name) && !(conflicting.tags ?? []).includes("weak-episode")) {
      return match;
    }
    if (conflicting.name === "episode" && (conflicting.tags ?? []).includes("weak-episode")) {
      return conflicting;
    }
    return "__default__";
  },
  // special edition: remove episode_details 'Special' in favor of this match
  "lambda match, other: other if other.name == 'episode_details' and other.value == 'Special' else '__default__'": (match, other2) => other2.name === "episode_details" && other2.value === "Special" ? other2 : "__default__"
};
const KNOWN_VALIDATORS = {
  "lambda match: 0 < match.value < 100": (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (match) => typeof match.value === "number" && match.value > 0 && match.value < 100
  )
};
function processExecutable(value, _defaultModule) {
  if (value.startsWith(IMPORT_PREFIX)) {
    const target = value.slice(IMPORT_PREFIX.length);
    if (importCache.has(target)) return importCache.get(target);
    const fn = registry.get(target);
    if (fn !== void 0) {
      importCache.set(target, fn);
      return fn;
    }
    return void 0;
  }
  if (value.startsWith(EVAL_PREFIX)) {
    const expr = value.slice(EVAL_PREFIX.length).trim();
    if (expr === "int") return (s) => parseInt(String(s), 10);
    if (expr === "float") return (s) => parseFloat(String(s));
    if (expr === "bool") return (s) => Boolean(s);
    return expr;
  }
  if (value.startsWith("lambda ") || value.startsWith("lambda:")) {
    const knownConflict = KNOWN_CONFLICT_SOLVERS[value];
    if (knownConflict) return knownConflict;
    const knownValidator = KNOWN_VALIDATORS[value];
    if (knownValidator) return knownValidator;
    return void 0;
  }
  return value;
}
const SNAKE_TO_CAMEL = {
  conflict_solver: "conflictSolver",
  private_parent: "privateParent",
  private_children: "privateChildren",
  private_names: "privateNames",
  ignore_names: "ignoreNames",
  format_all: "formatAll",
  validate_all: "validateAll",
  pre_match_processor: "preMatchProcessor",
  post_match_processor: "postMatchProcessor",
  post_processor: "postProcessor",
  log_level: "logLevel",
  ignore_case: "ignoreCase"
};
function normalizeCamelCase(obj) {
  for (const [snake, camel] of Object.entries(SNAKE_TO_CAMEL)) {
    if (snake in obj && !(camel in obj)) {
      obj[camel] = obj[snake];
      delete obj[snake];
    }
  }
  return obj;
}
function processOption(name, value) {
  if (name === "validator" || name === "conflict_solver" || name === "formatter") {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const result = {};
      for (const [k, v] of Object.entries(value)) {
        result[k] = processOption(name, v);
      }
      return result;
    }
    if (value !== null && value !== void 0 && typeof value === "string") {
      return processExecutable(value);
    }
  }
  return value;
}
function buildEntryDecl(entry, options, value) {
  const defaultOpts = options[Symbol.for("default")] || options["__default__"] || {};
  const entryDecl = { ...defaultOpts };
  if (!value.startsWith("_")) {
    entryDecl["value"] = value;
  }
  if (typeof entry === "string") {
    if (entry.startsWith(REGEX_PREFIX)) {
      entryDecl["regex"] = [entry.slice(REGEX_PREFIX.length)];
    } else {
      entryDecl["string"] = [entry];
    }
  } else if (entry && typeof entry === "object") {
    Object.assign(entryDecl, entry);
  }
  if ("pattern" in entryDecl) {
    const legacyPattern = entryDecl["pattern"];
    delete entryDecl["pattern"];
    if (legacyPattern.startsWith(REGEX_PREFIX)) {
      entryDecl["regex"] = [legacyPattern.slice(REGEX_PREFIX.length)];
    } else {
      entryDecl["string"] = [legacyPattern];
    }
  }
  return entryDecl;
}
function loadPatterns(rebulk, patternType, patterns, options = {}) {
  const defaultOpts = options[Symbol.for("default")] || options["__default__"] || {};
  const itemOptions = { ...defaultOpts };
  const patternTypeOption = options[patternType];
  if (patternTypeOption) Object.assign(itemOptions, patternTypeOption);
  const processedOptions = {};
  for (const [name, val] of Object.entries(itemOptions)) {
    processedOptions[name] = processOption(name, val);
  }
  for (const key of Object.keys(processedOptions)) {
    if (processedOptions[key] === void 0) {
      delete processedOptions[key];
    }
  }
  normalizeCamelCase(processedOptions);
  if (patternType === "regex") {
    rebulk.regex(...patterns, processedOptions);
  } else {
    rebulk.string(...patterns, processedOptions);
  }
}
function loadConfigPatterns(rebulk, config, options = {}) {
  if (!config) return;
  for (const [value, rawEntries] of Object.entries(config)) {
    const entries = Array.isArray(rawEntries) ? rawEntries : [rawEntries];
    for (const entry of entries) {
      const entryDecl = buildEntryDecl(entry, options, value);
      for (const patternType of PATTERN_TYPES) {
        let patterns = entryDecl[patternType];
        if (!patterns) continue;
        if (!Array.isArray(patterns)) patterns = [patterns];
        const patternsEntryDecl = { ...entryDecl };
        for (const pt of PATTERN_TYPES) delete patternsEntryDecl[pt];
        const currentPatternOptions = { ...options };
        currentPatternOptions[Symbol.for("default")] = patternsEntryDecl;
        currentPatternOptions["__default__"] = patternsEntryDecl;
        loadPatterns(rebulk, patternType, patterns, currentPatternOptions);
      }
    }
  }
}
function audioCodec(config) {
  const rebulk = new Rebulk();
  rebulk.regexDefaults({
    flags: "i",
    abbreviations: [dash]
  });
  rebulk.stringDefaults({ ignoreCase: true });
  rebulk.defaults({
    name: "audio_codec",
    tags: ["source-suffix", "streaming_service.suffix"],
    disabled: (context) => isDisabled(context, "audio_codec")
  });
  loadConfigPatterns(rebulk, config["audio_codec"]);
  rebulk.defaults({
    clear: true,
    name: "audio_profile",
    validator: sepsSurround,
    disabled: (context) => isDisabled(context, "audio_profile")
  });
  loadConfigPatterns(rebulk, config["audio_profile"]);
  rebulk.defaults({
    clear: true,
    name: "audio_channels",
    disabled: (context) => isDisabled(context, "audio_channels")
  });
  loadConfigPatterns(rebulk, config["audio_channels"]);
  function findCompoundAudio(input) {
    const results = [];
    const patterns = [
      { regex: /DTS-?ES/gi, codec: "DTS", profile: "Extended Surround" },
      { regex: /DTS-?MA/gi, codec: "DTS-HD", profile: "Master Audio" },
      { regex: /HE-?AAC/gi, codec: "AAC", profile: "High Efficiency" },
      { regex: /DD-?EX/gi, codec: "Dolby Digital", profile: "EX" }
    ];
    for (const p of patterns) {
      let m;
      while ((m = p.regex.exec(input)) !== null) {
        results.push([m.index, m.index + m[0].length, { value: p.codec, tags: ["compound-audio"] }]);
      }
    }
    return results;
  }
  rebulk.functional(findCompoundAudio, {
    name: "audio_codec",
    disabled: (context) => isDisabled(context, "audio_codec")
  });
  rebulk.rules(
    CompoundAudioProfileRule,
    DtsHDRule,
    DtsRule,
    AacRule,
    DolbyDigitalRule,
    HqConflictRule,
    AudioValidatorRule,
    AudioChannelsValidatorRule
  );
  return rebulk;
}
const COMPOUND_PROFILES = {
  "DTS": "Extended Surround",
  "DTS-HD": "Master Audio",
  "AAC": "High Efficiency",
  "Dolby Digital": "EX"
};
const _CompoundAudioProfileRule = class _CompoundAudioProfileRule extends Rule {
  when(matches) {
    const codecs = matches.named("audio_codec");
    for (const codec of codecs) {
      if (codec.tags?.includes("compound-audio")) {
        const profileValue = COMPOUND_PROFILES[String(codec.value)];
        if (profileValue) {
          const profile = new Match(codec.start, codec.end, {
            name: "audio_profile",
            value: profileValue,
            inputString: codec.inputString
          });
          return profile;
        }
      }
      if (String(codec.value) === "DTS-HD") {
        const raw = (codec.raw ?? codec.inputString?.slice(codec.start, codec.end) ?? "").toUpperCase();
        if (/MA/.test(raw)) {
          const profile = new Match(codec.start, codec.end, {
            name: "audio_profile",
            value: "Master Audio",
            inputString: codec.inputString
          });
          return profile;
        }
        const inputStr = codec.inputString ?? "";
        const afterCodec = inputStr.slice(codec.end, codec.end + 4).toUpperCase();
        if (/^[.\-_\s]?MA(?!\w*[b-ln-z])/i.test(afterCodec)) {
          const maStart = codec.end + (afterCodec.match(/^[.\-_\s]/) ? 1 : 0);
          const profile = new Match(maStart, maStart + 2, {
            name: "audio_profile",
            value: "Master Audio",
            inputString: codec.inputString
          });
          return profile;
        }
      }
    }
  }
};
_CompoundAudioProfileRule.consequence = AppendMatch;
let CompoundAudioProfileRule = _CompoundAudioProfileRule;
const _AudioProfileRule = class _AudioProfileRule extends Rule {
  enabled(context) {
    return !isDisabled(context, "audio_profile");
  }
  when(matches, _context) {
    const ret = [];
    const profiles = matches.named("audio_profile");
    const hasResult = (v) => v && (!Array.isArray(v) || v.length > 0);
    for (const profile of profiles) {
      if (!profile.tags.includes(this.codecName)) continue;
      let codec = matches.atSpan(profile.span, (m) => m.name === `audio_codec` && m.value === this.codecName);
      if (!hasResult(codec)) {
        const prevMatch = matches.previous(profile, (m) => !m.private, 0);
        if (prevMatch && prevMatch.name === "audio_codec" && prevMatch.value === this.codecName) {
          codec = prevMatch;
        }
      }
      if (!hasResult(codec)) {
        const nextMatch = matches.next(profile, (m) => !m.private, 0);
        if (nextMatch && nextMatch.name === "audio_codec" && nextMatch.value === this.codecName) {
          codec = nextMatch;
        }
      }
      if (!hasResult(codec)) {
        ret.push(profile);
      }
    }
    return ret.length > 0 ? ret : false;
  }
};
_AudioProfileRule.consequence = RemoveMatch;
let AudioProfileRule = _AudioProfileRule;
class DtsHDRule extends AudioProfileRule {
  constructor() {
    super(...arguments);
    this.codecName = "DTS-HD";
  }
}
class DtsRule extends AudioProfileRule {
  constructor() {
    super(...arguments);
    this.codecName = "DTS";
  }
}
class AacRule extends AudioProfileRule {
  constructor() {
    super(...arguments);
    this.codecName = "AAC";
  }
}
class DolbyDigitalRule extends AudioProfileRule {
  constructor() {
    super(...arguments);
    this.codecName = "Dolby Digital";
  }
}
const _HqConflictRule = class _HqConflictRule extends Rule {
  enabled(context) {
    return !isDisabled(context, "audio_profile");
  }
  when(matches, _context) {
    const ret = [];
    const others = matches.named("other");
    const hqProfiles = matches.named("audio_profile", (m) => m.value === "High Quality") ?? [];
    for (const hq of hqProfiles) {
      for (const other2 of others) {
        if (other2.span[0] === hq.span[0] && other2.span[1] === hq.span[1]) {
          ret.push(other2);
        }
      }
    }
    return ret;
  }
};
_HqConflictRule.consequence = RemoveMatch;
let HqConflictRule = _HqConflictRule;
const _AudioValidatorRule = class _AudioValidatorRule extends Rule {
  enabled(context) {
    return !isDisabled(context, "audio_codec") && !isDisabled(context, "audio_profile");
  }
  when(matches, _context) {
    const ret = [];
    const audioProps = [...matches.named("audio_codec"), ...matches.named("audio_profile")];
    for (const prop of audioProps) {
      if (!sepsBefore(prop)) {
        const prevMatch = matches.atIndex(prop.start - 1, null, 0);
        if (!prevMatch || prevMatch.name !== "audio_codec" && prevMatch.name !== "audio_profile") {
          ret.push(prop);
        }
      } else if (!sepsAfter(prop)) {
        const nextMatch = matches.atIndex(prop.end + 1, null, 0);
        if (!nextMatch || nextMatch.name !== "audio_codec" && nextMatch.name !== "audio_profile" && nextMatch.name !== "audio_channels") {
          ret.push(prop);
        }
      }
    }
    return ret;
  }
};
_AudioValidatorRule.priority = 64;
_AudioValidatorRule.consequence = RemoveMatch;
let AudioValidatorRule = _AudioValidatorRule;
const _AudioChannelsValidatorRule = class _AudioChannelsValidatorRule extends Rule {
  enabled(context) {
    return !isDisabled(context, "audio_channels");
  }
  when(matches, _context) {
    const ret = [];
    const weakChannels = matches.named("audio_channels", (m) => m.tags.includes("weak-audio_channels")) ?? [];
    for (const channels of weakChannels) {
      const prevCodec = matches.previous(channels, (m) => m.name === `audio_codec`);
      if (!prevCodec) {
        ret.push(channels);
      }
    }
    return ret;
  }
};
_AudioChannelsValidatorRule.priority = 128;
_AudioChannelsValidatorRule.consequence = RemoveMatch;
let AudioChannelsValidatorRule = _AudioChannelsValidatorRule;
const PARSER_RE = /^(?<magnitude>\d+(?:[.]\d+)?)(?<units>[^\d]+)?/;
class Quantity {
  constructor(magnitude, units) {
    this.magnitude = magnitude;
    this.units = units;
  }
  static parseUnits(_value) {
    throw new Error("parseUnits must be implemented by subclass");
  }
  static fromstring(string) {
    const m = PARSER_RE.exec(string);
    if (!m?.groups) throw new Error(`Cannot parse quantity: ${string}`);
    const magStr = m.groups["magnitude"];
    const magnitude = magStr.includes(".") ? parseFloat(magStr) : parseInt(magStr, 10);
    const unitsStr = m.groups["units"] ?? "";
    const units = this.parseUnits(unitsStr);
    return new this(magnitude, units);
  }
  toString() {
    return `${this.magnitude}${this.units}`;
  }
  equals(other2) {
    if (typeof other2 === "string") return this.toString() === other2;
    if (!(other2 instanceof Quantity)) return false;
    return this.magnitude === other2.magnitude && this.units === other2.units;
  }
}
class Size extends Quantity {
  static parseUnits(value) {
    let s = value;
    for (const sep of seps) s = s.split(sep).join("");
    return s.toUpperCase();
  }
  static fromstring(string) {
    return Quantity.fromstring.call(Size, string);
  }
}
class BitRate extends Quantity {
  static parseUnits(value) {
    let s = value;
    for (const sep of seps) s = s.split(sep).join("");
    s = s.charAt(0).toUpperCase() + s.slice(1);
    for (const token of ["bits", "bit"]) {
      s = s.replace(token, "bps");
    }
    return s;
  }
  static fromstring(string) {
    return Quantity.fromstring.call(BitRate, string);
  }
}
class FrameRate extends Quantity {
  static parseUnits(_value) {
    return "fps";
  }
  static fromstring(string) {
    return Quantity.fromstring.call(FrameRate, string);
  }
}
function screenSize(config) {
  const interlaced = new Set(config.interlaced);
  const progressive = new Set(config.progressive);
  const standardHeights = progressive;
  const frameRates = config.frame_rates;
  const minAr = config.min_ar;
  const maxAr = config.max_ar;
  const rebulk = new Rebulk();
  rebulk.stringDefaults({ ignoreCase: true });
  rebulk.regexDefaults({ flags: "i" });
  rebulk.defaults({
    name: "screen_size",
    validator: sepsSurround,
    abbreviations: [dash],
    disabled: (context) => isDisabled(context, "screen_size")
  });
  const frameRatePattern = buildOrPattern(frameRates, "frame_rate");
  const interlacedPattern = buildOrPattern([...interlaced], "height");
  const progressivePattern = buildOrPattern([...progressive], "height");
  const resPattern = `(?:(?<width>\\d{3,4})(?:x|\\*))?`;
  rebulk.regex(resPattern + interlacedPattern + `(?<scan_type>i)` + frameRatePattern + `?`);
  rebulk.regex(resPattern + progressivePattern + `(?<scan_type>p)` + frameRatePattern + `?`);
  rebulk.regex(resPattern + progressivePattern + `(?<scan_type>p)?(?:hd)`);
  rebulk.regex(resPattern + progressivePattern + `(?<scan_type>p)?x?`);
  rebulk.string("4k", {
    value: "2160p",
    conflictSolver: (match, other2) => other2.name === "screen_size" ? "__default__" : match
  });
  rebulk.regex(`(?<width>\\d{3,4})-?(?:x|\\*)-?(?<height>\\d{3,4})`, {
    conflictSolver: (match, other2) => other2.name === "screen_size" ? "__default__" : other2
  });
  rebulk.regex(frameRatePattern + `-?(?:p|fps)`, {
    name: "frame_rate",
    formatter: (s) => FrameRate.fromstring(s).toString(),
    disabled: (context) => isDisabled(context, "frame_rate")
  });
  rebulk.rules(
    new PostProcessScreenSize(standardHeights, minAr, maxAr),
    ScreenSizeOnlyOne,
    ResolveScreenSizeConflicts
  );
  return rebulk;
}
const _PostProcessScreenSize = class _PostProcessScreenSize extends Rule {
  constructor(standardHeights, minAr, maxAr) {
    super();
    this.standardHeights = standardHeights;
    this.minAr = minAr;
    this.maxAr = maxAr;
  }
  when(matches, context) {
    const toAppend = [];
    for (const match of matches.named("screen_size")) {
      if (!isDisabled(context, "frame_rate")) {
        for (const frameRate of match.children.named("frame_rate")) {
          frameRate.formatter = (s) => FrameRate.fromstring(s).toString();
          toAppend.push(frameRate);
        }
      }
      let values = match.children.toDict();
      if (!("height" in values)) {
        const raw = String(match.raw ?? "");
        const rxWxH = /^(\d{3,4})\s*[xX*]\s*(\d{3,4})$/i;
        const mWxH = rxWxH.exec(raw);
        if (mWxH) {
          values = { width: mWxH[1], height: mWxH[2], scan_type: void 0 };
        } else {
          const rxH = /^(\d{3,4})([ip])?/i;
          const mH = rxH.exec(raw);
          if (mH && mH[1]) {
            values = { height: mH[1], scan_type: mH[2] };
          } else {
            continue;
          }
        }
      }
      const scanType = (values["scan_type"] || "p").toLowerCase();
      const height = String(values["height"] ?? "");
      if (!("width" in values) || values["width"] === void 0) {
        match.value = `${height}${scanType}`;
        continue;
      }
      const width = String(values["width"] ?? "");
      const calculatedAr = parseFloat(width) / parseFloat(height);
      if (this.standardHeights.has(height) && this.minAr < calculatedAr && calculatedAr < this.maxAr) {
        match.value = `${height}${scanType}`;
      } else {
        match.value = `${width}x${height}`;
      }
      if (!isDisabled(context, "aspect_ratio") && width && this.minAr < calculatedAr && calculatedAr < this.maxAr) {
        const arMatch = new Match(match.start, match.end, {
          name: "aspect_ratio",
          value: Math.round(calculatedAr * 1e3) / 1e3,
          inputString: match.inputString
        });
        toAppend.push(arMatch);
      }
    }
    return toAppend;
  }
};
_PostProcessScreenSize.consequence = AppendMatch;
let PostProcessScreenSize = _PostProcessScreenSize;
const _ScreenSizeOnlyOne = class _ScreenSizeOnlyOne extends Rule {
  when(matches, _context) {
    const toRemove = [];
    for (const filepart of matches.markers.named("path")) {
      const screenSizes = matches.range(filepart.start, filepart.end, (m) => m.name === "screen_size").reverse();
      const uniqueValues = new Set(screenSizes.map((m) => m.value));
      if (screenSizes.length > 1 && uniqueValues.size > 1) {
        toRemove.push(...screenSizes.slice(1));
      }
    }
    return toRemove;
  }
};
_ScreenSizeOnlyOne.consequence = RemoveMatch;
let ScreenSizeOnlyOne = _ScreenSizeOnlyOne;
const _ResolveScreenSizeConflicts = class _ResolveScreenSizeConflicts extends Rule {
  when(matches, _context) {
    const toRemove = [];
    for (const filepart of matches.markers.named("path")) {
      const screenSizeMatch = matches.range(filepart.start, filepart.end, (m) => m.name === "screen_size", 0);
      if (!screenSizeMatch) continue;
      const conflicts = matches.conflicting(screenSizeMatch, (m) => ["season", "episode"].includes(m.name ?? "")) ?? [];
      if (conflicts.length === 0) continue;
      let hasNeighbor = false;
      const videoProfile = matches.range(screenSizeMatch.end, filepart.end, (m) => m.name === "video_profile", 0);
      if (videoProfile && matches.holes(screenSizeMatch.end, videoProfile.start, { predicate: (h) => !!(h.value && String(h.value).replace(new RegExp(`[${sepsPattern}]`, "g"), "")) }).length === 0) {
        toRemove.push(...conflicts);
        hasNeighbor = true;
      }
      const previous = matches.previous(screenSizeMatch, (m) => ["date", "source", "other", "streaming_service"].includes(m.name ?? ""), 0);
      if (previous && matches.holes(previous.end, screenSizeMatch.start, { predicate: (h) => !!(h.value && String(h.value).replace(new RegExp(`[${sepsPattern}]`, "g"), "")) }).length === 0) {
        toRemove.push(...conflicts);
        hasNeighbor = true;
      }
      if (!hasNeighbor) {
        toRemove.push(screenSizeMatch);
      }
    }
    return toRemove;
  }
};
_ResolveScreenSizeConflicts.consequence = RemoveMatch;
let ResolveScreenSizeConflicts = _ResolveScreenSizeConflicts;
const DEFAULT_TLDS = [
  "com",
  "org",
  "net",
  "edu",
  "gov",
  "mil",
  "int",
  "co",
  "uk",
  "ca",
  "de",
  "fr",
  "it",
  "es",
  "nl",
  "be",
  "ch",
  "se",
  "no",
  "dk",
  "fi",
  "pl",
  "ru",
  "cn",
  "jp",
  "au",
  "nz",
  "in",
  "br",
  "mx",
  "za",
  "kr",
  "tw",
  "hk"
];
function website(config) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, "website") });
  rebulk.regexDefaults({ flags: "i" }).stringDefaults({ ignoreCase: true });
  rebulk.defaults({ name: "website" });
  const tlds = config["tlds"] || DEFAULT_TLDS;
  const safeTlds = config["safe_tlds"] || ["com", "org", "net"];
  const safeSubdomains = config["safe_subdomains"] || ["www"];
  const safePrefix = config["safe_prefixes"] || [];
  const websitePrefixes = config["prefixes"] || [];
  rebulk.regex(
    `(?:[^a-z0-9]|^)((?:${buildOrPattern(safeSubdomains)}\\.)+(?:[a-z-0-9-]+\\.)+(?:${buildOrPattern(tlds)}))(?:[^a-z0-9]|$)`,
    { children: true }
  );
  rebulk.regex(
    `(?:[^a-z0-9]|^)((?:${buildOrPattern(safeSubdomains)}\\.)*[a-z0-9-]+\\.(?:${buildOrPattern(safeTlds)}))(?:[^a-z0-9]|$)`,
    { children: true }
  );
  rebulk.regex(
    `(?:[^a-z0-9]|^)((?:${buildOrPattern(safeSubdomains)}\\.)*[a-z0-9-]+\\.(?:${buildOrPattern(safePrefix)}\\.)+(?:${buildOrPattern(tlds)}))(?:[^a-z0-9]|$)`,
    { children: true }
  );
  rebulk.string(...websitePrefixes, {
    validator: sepsSurround,
    private: true,
    tags: ["website.prefix"]
  });
  class PreferTitleOverWebsiteWithConfig extends Rule {
    constructor(safeTldsArg, safePrefixArg) {
      super();
      this.consequence = RemoveMatch;
      this.safeTlds = safeTldsArg;
      this.safePrefix = safePrefixArg;
    }
    validFollowers(match) {
      return ["season", "episode", "year"].includes(match.name ?? "");
    }
    when(matches) {
      const toRemove = [];
      for (const websiteMatch of matches.named("website")) {
        let safe = false;
        for (const safeStart of [...this.safeTlds, ...this.safePrefix]) {
          if (String(websiteMatch.value ?? "").toLowerCase().startsWith(safeStart)) {
            safe = true;
            break;
          }
        }
        if (!safe) {
          const filepart = matches.markers.atMatch(websiteMatch, (m) => m.name === "path", 0);
          const searchEnd = filepart?.end ?? (matches.inputString?.length ?? websiteMatch.end + 50);
          const followers = matches.range(
            websiteMatch.end,
            searchEnd,
            (m) => !m.private && this.validFollowers(m)
          );
          const followerArr = Array.isArray(followers) ? followers : followers ? [followers] : [];
          const suffix = followerArr.length > 0 ? followerArr[0] : void 0;
          if (suffix) {
            const group = matches.markers.atMatch(
              websiteMatch,
              (m) => m.name === "group",
              0
            );
            if (!group) {
              toRemove.push(websiteMatch);
            }
          }
        }
      }
      return toRemove;
    }
  }
  rebulk.rules(new PreferTitleOverWebsiteWithConfig(safeTlds, safePrefix), ValidateWebsitePrefix);
  return rebulk;
}
const _ValidateWebsitePrefix = class _ValidateWebsitePrefix extends Rule {
  when(matches) {
    const toRemove = [];
    for (const prefix of matches.tagged("website.prefix")) {
      const websites = matches.range(
        prefix.end,
        prefix.end + 100,
        (m) => !m.private && m.name === "website"
      );
      const webArr = Array.isArray(websites) ? websites : websites ? [websites] : [];
      const websiteMatch = webArr.length > 0 ? webArr[0] : void 0;
      if (!websiteMatch || matches.holes(prefix.end, websiteMatch.start, cleanup, seps, (m) => m.value)) {
        toRemove.push(prefix);
      }
    }
    return toRemove;
  }
};
_ValidateWebsitePrefix.priority = 64;
_ValidateWebsitePrefix.consequence = RemoveMatch;
let ValidateWebsitePrefix = _ValidateWebsitePrefix;
const DSEP = "[-/ .]";
const DSEP_BIS = "[-/ .x]";
const DATE_REGEXPS = [
  new RegExp(`${DSEP}((\\d{8}))${DSEP}`, "i"),
  new RegExp(`${DSEP}((\\d{6}))${DSEP}`, "i"),
  new RegExp(`(?:^|[^\\d])((\\d{2})${DSEP}(\\d{1,2})${DSEP}(\\d{1,2}))(?:$|[^\\d])`, "i"),
  new RegExp(`(?:^|[^\\d])((\\d{1,2})${DSEP}(\\d{1,2})${DSEP}(\\d{2}))(?:$|[^\\d])`, "i"),
  new RegExp(`(?:^|[^\\d])((\\d{4})${DSEP_BIS}(\\d{1,2})${DSEP}(\\d{1,2}))(?:$|[^\\d])`, "i"),
  new RegExp(`(?:^|[^\\d])((\\d{1,2})${DSEP}(\\d{1,2})${DSEP_BIS}(\\d{4}))(?:$|[^\\d])`, "i"),
  new RegExp(`(?:^|[^\\d])((\\d{1,2}(?:st|nd|rd|th)?${DSEP}(?:[a-z]{3,10})${DSEP}\\d{4}))(?:$|[^\\d])`, "i")
];
function validYear(year) {
  return year >= 1920 && year < 2035;
}
function validWeek(week) {
  return week >= 1 && week < 53;
}
function isInt(s) {
  return !isNaN(parseInt(s, 10)) && String(parseInt(s, 10)) === s.replace(/^0+/, "") || s === "0";
}
function guessDayFirst(groups2) {
  const first = groups2[0];
  const last = groups2[groups2.length - 1];
  if (isInt(first) && validYear(parseInt(first.slice(0, 4), 10))) return false;
  if (isInt(last) && validYear(parseInt(last.slice(-4), 10))) return true;
  if (isInt(first) && parseInt(first.slice(0, 2), 10) > 31) return false;
  if (isInt(last) && parseInt(last.slice(-2), 10) > 31) return true;
  return void 0;
}
function tryParseDate(match, groups2, yearFirst, dayFirst) {
  const normalized = match.replace(/[-/ .x]/g, "-");
  const parts = normalized.split("-").filter(Boolean);
  const yearFirstOpts = yearFirst !== void 0 ? [yearFirst] : [false, true];
  const dayFirstOpts = dayFirst !== void 0 ? [dayFirst] : [true, false];
  for (const yf of yearFirstOpts) {
    for (const df of dayFirstOpts) {
      let year, month, day;
      if (parts.length === 1) {
        const s = parts[0];
        if (s.length === 8) {
          year = parseInt(s.slice(0, 4), 10);
          month = parseInt(s.slice(4, 6), 10);
          day = parseInt(s.slice(6, 8), 10);
        } else if (s.length === 6) {
          const yy = parseInt(s.slice(0, 2), 10);
          year = yy > 50 ? 1900 + yy : 2e3 + yy;
          month = parseInt(s.slice(2, 4), 10);
          day = parseInt(s.slice(4, 6), 10);
        } else {
          continue;
        }
      } else if (parts.length === 3) {
        const p = parts.map(Number);
        if (yf) {
          [year, month, day] = df ? [p[0], p[2], p[1]] : [p[0], p[1], p[2]];
          if (!validYear(year) && year < 100) {
            year = year > 50 ? 1900 + year : 2e3 + year;
          }
        } else {
          const longIdx = p.findIndex((n, i) => parts[i].length === 4 && validYear(n));
          if (longIdx === 0) {
            [year, month, day] = df ? [p[0], p[2], p[1]] : [p[0], p[1], p[2]];
          } else if (longIdx === 2) {
            [year, month, day] = df ? [p[2], p[1], p[0]] : [p[2], p[0], p[1]];
          } else {
            if (df) {
              [day, month, year] = yf ? [p[2], p[1], p[0]] : [p[0], p[1], p[2]];
            } else {
              [month, day, year] = yf ? [p[2], p[0], p[1]] : [p[0], p[1], p[2]];
            }
            const yy = year > 100 ? year : year > 50 ? 1900 + year : 2e3 + year;
            year = yy;
          }
        }
      } else {
        continue;
      }
      if (month < 1 || month > 12) continue;
      if (day < 1 || day > 31) continue;
      if (!validYear(year)) continue;
      try {
        const ts = Date.UTC(year, month - 1, day);
        const date2 = new Date(ts);
        if (date2.getUTCFullYear() === year && date2.getUTCMonth() === month - 1 && date2.getUTCDate() === day) {
          return date2;
        }
      } catch {
      }
    }
  }
  return void 0;
}
function searchDate(string, yearFirst, dayFirst) {
  for (const dateRe of DATE_REGEXPS) {
    const globalRe = new RegExp(dateRe.source, dateRe.flags.includes("g") ? dateRe.flags : dateRe.flags + "g");
    let m;
    globalRe.lastIndex = 0;
    while ((m = globalRe.exec(string)) !== null) {
      if (!m[1]) continue;
      const start = m.index + m[0].indexOf(m[1]);
      const end = start + m[1].length;
      const groups2 = m.slice(2).filter(Boolean);
      const matchStr = m[1];
      let dfGuess = dayFirst;
      if (yearFirst && dfGuess === void 0) dfGuess = false;
      const dfGuessWasExplicit = dfGuess !== void 0;
      if (!dfGuessWasExplicit && groups2.length > 0) {
        dfGuess = guessDayFirst(groups2);
      }
      const dfOptions = dfGuess !== void 0 ? dfGuessWasExplicit ? [dfGuess] : [dfGuess, !dfGuess] : [void 0];
      let date2;
      for (const df of dfOptions) {
        date2 = tryParseDate(matchStr, groups2, yearFirst, df);
        if (date2 && validYear(date2.getUTCFullYear())) break;
      }
      if (date2 && validYear(date2.getUTCFullYear())) {
        return [start, end, date2];
      }
    }
  }
  return void 0;
}
const _KeepMarkedYearInFilepart = class _KeepMarkedYearInFilepart extends Rule {
  constructor() {
    super(...arguments);
    this.consequence = RemoveMatch;
  }
  enabled(context) {
    return !isDisabled(context, "year");
  }
  when(matches, _context) {
    const ret = [];
    const yearMatches = matches.named("year");
    const yearArray = Array.isArray(yearMatches) ? yearMatches : yearMatches ? [yearMatches] : [];
    if (yearArray.length <= 1) return ret;
    const pathMarkers = matches.markers.named("path");
    const pathArray = Array.isArray(pathMarkers) ? pathMarkers : pathMarkers ? [pathMarkers] : [];
    for (const filepart of pathArray) {
      const yearsInPart = matches.range(
        filepart.start,
        filepart.end,
        (m) => m.name === "year"
      );
      const yearsInPartArray = Array.isArray(yearsInPart) ? yearsInPart : yearsInPart ? [yearsInPart] : [];
      if (yearsInPartArray.length <= 1) continue;
      const groupYears = [];
      const ungroupYears = [];
      for (const year of yearsInPartArray) {
        const groupMarker = matches.markers.atMatch(year, (m) => m.name === "group", 0);
        if (groupMarker) {
          groupYears.push(year);
        } else {
          ungroupYears.push(year);
        }
      }
      if (groupYears.length > 0 && ungroupYears.length > 0) {
        const firstGroupStart = groupYears[0].start;
        ret.push(...ungroupYears.filter((y) => y.start < firstGroupStart));
        ret.push(...groupYears.slice(1));
      } else if (groupYears.length === 0) {
        ret.push(ungroupYears[0]);
        if (ungroupYears.length > 2) {
          ret.push(...ungroupYears.slice(2));
        }
      }
    }
    return ret;
  }
};
_KeepMarkedYearInFilepart.priority = 64;
let KeepMarkedYearInFilepart = _KeepMarkedYearInFilepart;
function date(config) {
  const rebulk = new Rebulk().defaults({ validator: sepsSurround });
  rebulk.regex("\\d{4}", {
    name: "year",
    formatter: (s) => parseInt(s, 10),
    disabled: (context) => isDisabled(context, "year"),
    conflictSolver: (match, other2) => other2.name === "episode" || other2.name === "season" ? other2.raw && match.raw && other2.raw.length < match.raw.length ? other2 : "__default__" : "__default__",
    validator: (m) => sepsSurround(m) && validYear(m.value)
  });
  const weekWords = config["week_words"];
  if (weekWords && weekWords.length > 0) {
    const weekPattern = buildOrPattern(weekWords) + "-?(\\d{1,2})";
    rebulk.regex(weekPattern, {
      name: "week",
      formatter: (s) => parseInt(s.replace(/\D/g, ""), 10),
      children: true,
      flags: "i",
      abbreviations: [dash],
      conflictSolver: (match, other2) => other2.name === "episode" || other2.name === "season" ? other2.raw && match.raw && other2.raw.length < match.raw.length ? other2 : "__default__" : "__default__",
      validator: (m) => sepsSurround(m) && validWeek(m.value)
    });
  }
  const dateFunctional = (inputString, context) => {
    const result = searchDate(
      inputString,
      context?.["date_year_first"],
      context?.["date_day_first"]
    );
    if (result) {
      return [[result[0], result[1], { value: result[2] }]];
    }
    return [];
  };
  rebulk.functional(dateFunctional, {
    name: "date",
    properties: { date: [null] },
    disabled: (context) => isDisabled(context, "date"),
    conflictSolver: (match, other2) => other2.name === "episode" || other2.name === "season" || other2.name === "crc32" ? other2 : "__default__"
  });
  rebulk.rules(KeepMarkedYearInFilepart);
  return rebulk;
}
function markerComparatorPredicate(m) {
  return !m.private && m.name !== "proper_count" && m.name !== "title" && !(m.name === "container" && m.tags?.includes("extension")) && !(m.name === "other" && m.value === "Rip");
}
function markerWeight(matches, marker, predicate) {
  const rangeResult = matches.range(marker.start, marker.end, predicate);
  const arr = Array.isArray(rangeResult) ? rangeResult : rangeResult ? [rangeResult] : [];
  const names = new Set(arr.map((m) => m.name));
  return names.size;
}
function markerSorted(markers, matches, predicate = markerComparatorPredicate) {
  const markersArr = [...markers];
  return markersArr.sort((a, b) => {
    const weightDiff = markerWeight(matches, b, predicate) - markerWeight(matches, a, predicate);
    if (weightDiff !== 0) return weightDiff;
    return markersArr.indexOf(b) - markersArr.indexOf(a);
  });
}
function buildExpectedFunction(optionName) {
  return function findExpected(inputString, context) {
    let expected = context?.[optionName];
    if (!expected || Array.isArray(expected) && expected.length === 0) return [];
    if (typeof expected === "string") expected = [expected];
    const SEP_CLASS = "[\\s._-]";
    const results = [];
    for (const title2 of expected) {
      let pattern;
      if (title2.startsWith("re:")) {
        const rawPattern = title2.slice(3);
        try {
          pattern = new RegExp(rawPattern, "gi");
        } catch {
          continue;
        }
      } else {
        const parts = title2.split(/[\s._-]+/).map((p) => p.replace(/[-[\]{}()*+?.,\\^$|#]/g, "\\$&"));
        if (parts.length === 0) continue;
        const patternStr = "(?<![a-zA-Z0-9])" + parts.join(`${SEP_CLASS}?`) + "(?![a-zA-Z0-9])";
        try {
          pattern = new RegExp(patternStr, "gi");
        } catch {
          const literalPat = title2.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
          try {
            pattern = new RegExp(literalPat, "gi");
          } catch {
            continue;
          }
        }
      }
      let m;
      while ((m = pattern.exec(inputString)) !== null) {
        results.push([m.index, m.index + m[0].length, {}]);
        if (m[0].length === 0) break;
      }
    }
    return results;
  };
}
function hasmatch$1(result) {
  if (result === null || result === void 0) return false;
  if (Array.isArray(result)) return result.length > 0;
  return true;
}
const _TitleBaseRule = class _TitleBaseRule extends Rule {
  constructor(matchName, propertyNames, alternativePropertyName) {
    super();
    this.consequence = [AppendMatch, RemoveMatch];
    this.matchName = matchName;
    this.propertyName = propertyNames[0] ?? "title";
    this.alternativePropertyName = alternativePropertyName;
  }
  /**
   * Filter predicate for holes.
   */
  holeFilter(_hole) {
    return true;
  }
  /**
   * Filter predicate for fileparts.
   */
  filepartFilter(_filepart) {
    return true;
  }
  /**
   * Process holes: crop by group markers, skip markers spanning entire path.
   */
  holesProcess(holes, matches, filepart) {
    const groupMarkers = matches.markers.named("group");
    const groupArray = Array.isArray(groupMarkers) ? groupMarkers : groupMarkers ? [groupMarkers] : [];
    const relevantGroups = groupArray.filter((g) => g.start >= filepart.start && g.end <= filepart.end);
    const filteredGroups = relevantGroups.filter((g) => !(g.start === filepart.start && g.end === filepart.end));
    const ret = [];
    for (const hole of holes) {
      const cropped = hole.crop(filteredGroups);
      if (!cropped) continue;
      if (Array.isArray(cropped)) {
        ret.push(...cropped);
      } else {
        ret.push(cropped);
      }
    }
    return ret;
  }
  /**
   * Determine if a match should be ignored (e.g., language, country).
   */
  isIgnored(match) {
    return match.name === "language" || match.name === "country" || match.name === "episode_details";
  }
  /**
   * Determine if we should keep a hole boundary (don't trim this side).
   * Returns false (allow trimming) only when the ignored match spans the entire hole edge
   * with no remaining title content — i.e., it's a pure language/country/episode_details hole.
   * Mirrors Python TitleBaseRule.should_keep().
   */
  shouldKeep(hole, ignored, before) {
    if (before) {
      return ignored[0].end < hole.end || ignored.length > 1;
    } else {
      return ignored[ignored.length - 1].start > hole.start && ignored.length > 1;
    }
  }
  /**
   * Check if a trailing ignored match (language/country) appears again in the same filepart
   * after the given position. If so, the occurrence in the title hole is part of the movie/show
   * title (e.g. "Immersion French" where "FRENCH" also appears later as a separate tag).
   */
  languageDuplicatedAfterHole(lastIgnored, afterPos, matches) {
    if (lastIgnored.name !== "language" && lastIgnored.name !== "country") return false;
    const filepart = matches.markers.atMatch(lastIgnored, (m) => m.name === "path");
    if (!filepart) return false;
    const ignoredValueStr = String(lastIgnored.value ?? "").toLowerCase();
    const duplicates = matches.range(
      afterPos,
      filepart.end,
      (m) => m.name === lastIgnored.name && String(m.value ?? "").toLowerCase() === ignoredValueStr
    );
    return Array.isArray(duplicates) ? duplicates.length > 0 : !!duplicates;
  }
  /**
   * Determine if we should remove a hole.
   */
  shouldRemove(_hole) {
    return false;
  }
  /**
   * Split a title hole at titleSeps characters (- / | + \) into title + alternative_titles.
   * Returns null if no split is possible.
   * Mirrors Python's TitleBaseRule._split_title_alternative().
   */
  splitTitleAlternative(hole, inputString) {
    const text = inputString.slice(hole.start, hole.end);
    const splitPositions = [];
    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      if (!titleSeps.includes(ch)) continue;
      const prevIsSep = i === 0 || seps.includes(text[i - 1]);
      const nextIsSep = i === text.length - 1 || seps.includes(text[i + 1]);
      if (prevIsSep && nextIsSep || ch === "/") {
        splitPositions.push(i);
      }
    }
    if (splitPositions.length === 0) return null;
    const createMatch = (start, end) => {
      let s = start;
      let e = end;
      while (s < e && seps.includes(inputString[s])) s++;
      while (e > s && seps.includes(inputString[e - 1])) e--;
      if (s >= e) return null;
      const raw = inputString.slice(s, e);
      const value = hole.formatter ? hole.formatter(raw) : raw;
      return new Match(s, e, { inputString, formatter: hole.formatter, value });
    };
    const segments = [];
    let prevEnd = hole.start;
    for (const pos of splitPositions) {
      const absPos = hole.start + pos;
      const seg = createMatch(prevEnd, absPos);
      if (seg) segments.push(seg);
      prevEnd = absPos + 1;
    }
    const lastSeg = createMatch(prevEnd, hole.end);
    if (lastSeg) segments.push(lastSeg);
    if (segments.length < 2) return null;
    return { title: segments[0], alternatives: segments.slice(1) };
  }
  /**
   * Check and extract titles from a filepart.
   * Mirrors Python's TitleBaseRule.check_titles_in_filepart().
   */
  checkTitlesInFilepart(filepart, matches) {
    const toAppend = [];
    const toRemove = [];
    const firstYearInFilepart = matches.range(
      filepart.start,
      filepart.end,
      (m) => m.name === "year",
      0
    );
    const hasYearInFilepart = !!firstYearInFilepart;
    const hasDateInFilepart = !!matches.range(
      filepart.start,
      filepart.end,
      (m) => m.name === "date",
      0
    );
    const hasSxxExxInFilepart = !!matches.range(
      filepart.start,
      filepart.end,
      (m) => m.tags?.includes("SxxExx") && !m.private,
      0
    );
    const holesResult = matches.holes(filepart.start, filepart.end, {
      formatter: formatters(cleanup, reorderTitle),
      ignore: (m) => {
        if (this.isIgnored(m)) return true;
        if (m.tags?.includes("weak-episode") || m.tags?.includes("weak-duplicate")) {
          const initiator = m.initiator;
          const startsAtFilepart = m.start === filepart.start || initiator.start === filepart.start;
          if (startsAtFilepart) {
            if (hasYearInFilepart || hasDateInFilepart || hasSxxExxInFilepart) return true;
          }
          if (hasYearInFilepart && m.start >= filepart.start && m.start < filepart.start + 4 && m.end <= filepart.start + 4) {
            return true;
          }
          if (firstYearInFilepart && m.end <= firstYearInFilepart.start) {
            return true;
          }
        }
        return false;
      },
      predicate: (m) => m.value ? true : false
    });
    const holeArray = Array.isArray(holesResult) ? holesResult : holesResult ? [holesResult] : [];
    let processedHoles = this.holesProcess(holeArray, matches, filepart);
    for (const hole of processedHoles) {
      if (!this.holeFilter(hole)) continue;
      if (process.env.DEBUG_TITLE_TRIM) {
        const inp2 = matches.inputString ?? "";
        console.log(`[trim] hole="${inp2.slice(hole.start, hole.end)}" [${hole.start},${hole.end})`);
      }
      const ignoredInHole = matches.range(
        hole.start,
        hole.end,
        (m) => this.isIgnored(m)
      );
      const ignoredArray = Array.isArray(ignoredInHole) ? ignoredInHole : ignoredInHole ? [ignoredInHole] : [];
      let trimmedHole = hole;
      const inp = matches.inputString ?? "";
      while (trimmedHole.start < trimmedHole.end && seps.includes(inp[trimmedHole.start])) {
        trimmedHole.start++;
      }
      while (trimmedHole.end > trimmedHole.start && seps.includes(inp[trimmedHole.end - 1])) {
        const pos = trimmedHole.end - 1;
        if (inp[pos] === "." && pos >= 2 && /[a-zA-Z0-9]/.test(inp[pos - 1]) && inp[pos - 2] === ".") {
          break;
        }
        trimmedHole.end--;
      }
      if (process.env.DEBUG_TITLE_TRIM) {
        const ignoredNames = ignoredArray.map((m) => `${m.name}="${inp.slice(m.start, m.end)}"@[${m.start},${m.end})`).join(", ");
        console.log(`  after pre-strip hole=[${trimmedHole.start},${trimmedHole.end}) ignoredArray=[${ignoredNames}]`);
      }
      while (ignoredArray.length > 0) {
        const firstIgnored = ignoredArray[0];
        if (firstIgnored.start === trimmedHole.start) {
          const keep = firstIgnored.name === "country" ? false : this.shouldKeep(trimmedHole, ignoredArray, true);
          if (process.env.DEBUG_TITLE_TRIM) {
            console.log(`  leading trim: shouldKeep=${keep} for "${inp.slice(firstIgnored.start, firstIgnored.end)}"`);
          }
          if (keep) {
            let hasTitleSep = false;
            for (let pp = firstIgnored.end; pp < trimmedHole.end; pp++) {
              const ch = inp[pp];
              if (titleSeps.includes(ch)) {
                hasTitleSep = true;
                break;
              }
              if (!seps.includes(ch)) break;
            }
            if (hasTitleSep) ;
            else {
              break;
            }
          }
          trimmedHole.start = firstIgnored.end;
          while (trimmedHole.start < trimmedHole.end && seps.includes(inp[trimmedHole.start])) {
            trimmedHole.start++;
          }
          ignoredArray.shift();
        } else {
          break;
        }
      }
      while (ignoredArray.length > 0) {
        const lastIgnored = ignoredArray[ignoredArray.length - 1];
        if (lastIgnored.end === trimmedHole.end) {
          if (lastIgnored.name === "episode_details" && lastIgnored.value === "Special") {
            const nextMatch = matches.range(
              lastIgnored.end,
              lastIgnored.end + 10,
              (m) => m.name === "year" && !m.private,
              0
            );
            if (nextMatch) {
              const between = inp.slice(lastIgnored.end, nextMatch.start);
              if ([...between].every((c) => seps.includes(c))) {
                break;
              }
            }
          }
          if (this.languageDuplicatedAfterHole(lastIgnored, trimmedHole.end, matches)) {
            toRemove.push(lastIgnored);
            ignoredArray.pop();
            break;
          }
          if (this.shouldKeep(trimmedHole, ignoredArray, false)) {
            let allContiguousAtEnd = true;
            let checkEnd = trimmedHole.end;
            for (let k = ignoredArray.length - 1; k >= 0; k--) {
              const ig = ignoredArray[k];
              const between = inp.slice(ig.end, checkEnd);
              if (![...between].every((c) => seps.includes(c))) {
                allContiguousAtEnd = false;
                break;
              }
              checkEnd = ig.start;
            }
            if (!allContiguousAtEnd) break;
          }
          trimmedHole.end = lastIgnored.start;
          while (trimmedHole.end > trimmedHole.start && seps.includes(inp[trimmedHole.end - 1])) {
            trimmedHole.end--;
          }
          ignoredArray.pop();
        } else {
          break;
        }
      }
      if (process.env.DEBUG_TITLE_TRIM) {
        console.log(`  result: hole=[${trimmedHole.start},${trimmedHole.end}) length=${trimmedHole.length} value="${trimmedHole.value}"`);
      }
      if (trimmedHole.length > 0 && !this.shouldRemove(trimmedHole) && trimmedHole.value) {
        const splitResult = this.splitTitleAlternative(trimmedHole, inp);
        if (splitResult) {
          splitResult.title.name = this.matchName;
          toAppend.push(splitResult.title);
          for (const alt of splitResult.alternatives) {
            alt.name = this.alternativePropertyName;
            toAppend.push(alt);
          }
        } else {
          trimmedHole.name = this.matchName;
          toAppend.push(trimmedHole);
        }
      }
    }
    return { toAppend, toRemove };
  }
  /**
   * Find the "series name" filepart: the directory immediately preceding a season-only directory.
   * e.g. in Series/Californication/Season 2/..., returns the Californication filepart.
   * Mirrors Python's TitleBaseRule._serie_name_filepart().
   */
  _serieNameFilepart(matches, fileparts) {
    for (let index = 0; index < fileparts.length - 1; index++) {
      if (index === 0) continue;
      const filepart = fileparts[index];
      const fpMatches = matches.range(filepart.start, filepart.end).filter((m) => !m.private);
      if (process.env.DEBUG_TITLE) {
        const inp = matches.inputString ?? "";
        console.log(`[_serieNameFilepart] index=${index} fp="${inp.slice(filepart.start, filepart.end)}" fpMatches=${fpMatches.map((m) => `${m.name}="${m.value}"@[${m.start},${m.end})`).join(",")}`);
        if (fpMatches[0]) {
          const parent = fpMatches[0].parent;
          console.log(`  season span=[${fpMatches[0].start},${fpMatches[0].end}), filepart=[${filepart.start},${filepart.end}), parent span=${parent ? `[${parent.start},${parent.end})` : "null"}`);
        }
      }
      if (fpMatches.length === 1 && fpMatches[0].name === "season" && (fpMatches[0].start === filepart.start && fpMatches[0].end === filepart.end || fpMatches[0].parent && fpMatches[0].parent.start === filepart.start && fpMatches[0].parent.end === filepart.end)) {
        return fileparts[index + 1] ?? null;
      }
    }
    return null;
  }
  /**
   * Get the title match from the series name filepart.
   * Mirrors Python's TitleBaseRule._serie_name_filepart_match().
   *
   * First looks for an existing title match in the filepart (added by Filepart3EpisodeTitle
   * or Filepart2EpisodeTitle which run before TitleFromPosition). If not found, attempts
   * to create one from holes in the filepart.
   */
  _serieNameFilepartMatch(matches, serieNameFilepart, toAppend, toRemove) {
    const existingTitle = matches.range(
      serieNameFilepart.start,
      serieNameFilepart.end,
      (m) => m.name === "title",
      0
    );
    if (existingTitle) {
      if (process.env.DEBUG_TITLE) {
        const inp = matches.inputString ?? "";
        console.log(`[_serieNameFilepartMatch] fp="${inp.slice(serieNameFilepart.start, serieNameFilepart.end)}" found existing title="${existingTitle.value}"`);
      }
      return existingTitle;
    }
    const weakIgnored = (m) => m.tags ? m.tags.some((t) => t === "weak" || t.startsWith("weak-")) : false;
    const savedIsIgnored = this.isIgnored.bind(this);
    const combinedIgnore = (m) => savedIsIgnored(m) || weakIgnored(m);
    const holesResult = matches.holes(serieNameFilepart.start, serieNameFilepart.end, {
      formatter: formatters(cleanup, reorderTitle),
      ignore: combinedIgnore,
      predicate: (m) => m.value ? true : false
    });
    const holeArray = Array.isArray(holesResult) ? holesResult : holesResult ? [holesResult] : [];
    const processedHoles = this.holesProcess(holeArray, matches, serieNameFilepart);
    if (process.env.DEBUG_TITLE) {
      const inp = matches.inputString ?? "";
      console.log(`[_serieNameFilepartMatch] fp="${inp.slice(serieNameFilepart.start, serieNameFilepart.end)}" holeArray=${holeArray.length} processedHoles=${processedHoles.length}`);
      processedHoles.forEach((h, i) => console.log(`  hole[${i}]="${inp.slice(h.start, h.end)}" value="${h.value}"`));
    }
    if (processedHoles.length === 1 && processedHoles[0].value) {
      const serieTitle = processedHoles[0];
      serieTitle.name = this.matchName;
      toAppend.push(serieTitle);
      return serieTitle;
    }
    return null;
  }
  when(matches, context) {
    const existingExpected = matches.tagged("expected")?.filter(
      (m) => m.name === "title"
    ) ?? [];
    if (existingExpected.length > 0) {
      return null;
    }
    const toAppend = [];
    const toRemove = [];
    const pathMarkers = matches.markers.named("path");
    const pathArray = Array.isArray(pathMarkers) ? pathMarkers : pathMarkers ? [pathMarkers] : [];
    const sortedFileparts = markerSorted(pathArray, matches);
    const serieNameFilepart = this._serieNameFilepart(matches, sortedFileparts);
    let serieNameMatch = null;
    if (serieNameFilepart) {
      serieNameMatch = this._serieNameFilepartMatch(matches, serieNameFilepart, toAppend, toRemove);
    }
    if (process.env.DEBUG_TITLE) {
      const inp = matches.inputString ?? "";
      console.log(`[when] sortedFileparts: ${sortedFileparts.map((fp) => `"${inp.slice(fp.start, fp.end)}"`).join(", ")}`);
      console.log(`[when] serieNameFilepart: ${serieNameFilepart ? `"${inp.slice(serieNameFilepart.start, serieNameFilepart.end)}"` : "null"}`);
      console.log(`[when] serieNameMatch: ${serieNameMatch ? `"${serieNameMatch.value}"` : "null"}`);
    }
    const yearFileparts = new Set(
      sortedFileparts.filter(
        (fp) => hasmatch$1(matches.range(fp.start, fp.end, (m) => m.name === "year", 0))
      )
    );
    for (const filepart of sortedFileparts) {
      yearFileparts.delete(filepart);
      if (!this.filepartFilter(filepart)) continue;
      const result = this.checkTitlesInFilepart(filepart, matches);
      if (result.toAppend.length > 0 || result.toRemove.length > 0) {
        if (serieNameMatch) {
          const normTitle = (s) => {
            try {
              s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
            } catch {
            }
            return s.replace(/[''`]/g, "").replace(/\.+$/, "").toLowerCase().trim();
          };
          for (const titleMatch of result.toAppend) {
            if (normTitle(String(titleMatch.value)) !== normTitle(String(serieNameMatch.value))) {
              titleMatch.name = "episode_title";
            }
          }
        }
        toAppend.push(...result.toAppend);
        toRemove.push(...result.toRemove);
        break;
      }
    }
    for (const filepart of yearFileparts) {
      if (!this.filepartFilter(filepart)) continue;
      const result = this.checkTitlesInFilepart(filepart, matches);
      const filteredAppend = [];
      for (const newTitle of result.toAppend) {
        if (newTitle.name !== this.matchName) {
          filteredAppend.push(newTitle);
          continue;
        }
        const newVal = String(newTitle.value ?? "");
        const norm = (s) => {
          try {
            s = s.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
          } catch {
          }
          return s.replace(/[''`]/g, "").toLowerCase();
        };
        const existingIdx = toAppend.findIndex((m) => {
          if (m.name !== this.matchName) return false;
          const existingVal = String(m.value ?? "");
          return norm(existingVal) === norm(newVal) && existingVal !== newVal;
        });
        if (existingIdx !== -1) {
          toAppend[existingIdx].value = newVal;
          continue;
        }
        const isSuperset = toAppend.some((m) => {
          if (m.name !== this.matchName) return false;
          const existingNorm = norm(String(m.value ?? ""));
          const newNorm = norm(newVal);
          return newNorm.startsWith(existingNorm + " ") || newNorm.endsWith(" " + existingNorm);
        });
        if (isSuperset) continue;
        filteredAppend.push(newTitle);
      }
      toAppend.push(...filteredAppend);
      toRemove.push(...result.toRemove);
    }
    if (toAppend.length === 0 && toRemove.length === 0) {
      return null;
    }
    return { toAppend, toRemove };
  }
  then(matches, whenResponse, context) {
    if (!whenResponse || typeof whenResponse !== "object") return;
    const response = whenResponse;
    const removeConsequence = new RemoveMatch();
    removeConsequence.then(matches, response.toRemove, context);
    const appendConsequence = new AppendMatch();
    appendConsequence.then(matches, response.toAppend, context);
  }
};
_TitleBaseRule.priority = 0;
_TitleBaseRule.properties = {};
let TitleBaseRule = _TitleBaseRule;
const _TitleFromPosition = class _TitleFromPosition extends TitleBaseRule {
  constructor() {
    super("title", ["title"], "alternative_title");
  }
};
_TitleFromPosition.priority = 0;
_TitleFromPosition.dependency = ["DashSeparatedReleaseGroup", "SubtitlePrefixLanguageRule", "SubtitleSuffixLanguageRule", "SubtitleExtensionRule"];
_TitleFromPosition.properties = { title: [null], alternative_title: [null] };
let TitleFromPosition = _TitleFromPosition;
const _PreferTitleWithYear = class _PreferTitleWithYear extends Rule {
  constructor() {
    super(...arguments);
    this.consequence = [RemoveMatch, AppendTags];
  }
  when(matches, _context) {
    const ret = [];
    const titleMatches = matches.named("title");
    const titleArray = Array.isArray(titleMatches) ? titleMatches : titleMatches ? [titleMatches] : [];
    matches.named("year");
    for (const title2 of titleArray) {
      if (title2.tags?.includes("expected")) continue;
      const filepart = matches.markers.atMatch(title2, (m) => m.name === "path", 0);
      if (!filepart) continue;
      const yearsInPart = matches.range(
        filepart.start,
        filepart.end,
        (m) => m.name === "year"
      );
      const yearsInPartArray = Array.isArray(yearsInPart) ? yearsInPart : yearsInPart ? [yearsInPart] : [];
      if (yearsInPartArray.length === 0) {
        ret.push(title2);
      }
    }
    return ret;
  }
  then(matches, whenResponse, context) {
    if (!whenResponse || !Array.isArray(whenResponse)) return;
    const removeConsequence = new RemoveMatch();
    removeConsequence.then(matches, whenResponse, context);
    const appendConsequence = new AppendTags(["equivalent-ignore"]);
    appendConsequence.then(matches, whenResponse, context);
  }
};
_PreferTitleWithYear.priority = 32;
_PreferTitleWithYear.dependency = [TitleFromPosition];
let PreferTitleWithYear = _PreferTitleWithYear;
function title(config) {
  const rebulk = new Rebulk({
    disabled: (context) => isDisabled(context, "title")
  });
  rebulk.rules(TitleFromPosition, PreferTitleWithYear);
  const expectedTitle = buildExpectedFunction("expected_title");
  rebulk.functional(expectedTitle, {
    name: "title",
    tags: ["expected", "title"],
    validator: sepsSurround,
    formatter: formatters(cleanup, reorderTitle),
    conflictSolver: (match, other2) => other2,
    disabled: (context) => !context?.["expected_title"]
  });
  return rebulk;
}
function hasmatch(result) {
  if (result === null || result === void 0) return false;
  if (Array.isArray(result)) return result.length > 0;
  return true;
}
const LEADING_ARTICLES_RE = /^(the|a|an|le|la|les|l'|el|los|las|der|die|das)\s+/i;
function normalizeTitle(s) {
  return s.toLowerCase().replace(LEADING_ARTICLES_RE, "").trim();
}
function episodeTitle(config) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, "episode_title") });
  rebulk.rules(
    RemoveConflictsWithEpisodeTitle,
    TitleToEpisodeTitle,
    ExtendEpisodeTitleWithDetails,
    EpisodeTitleFromPosition,
    AlternativeTitleReplace,
    TrimLanguageFromEpisodeTitle,
    Filepart3EpisodeTitle,
    Filepart2EpisodeTitle,
    RenameEpisodeTitleWhenMovieType
  );
  return rebulk;
}
const _RemoveConflictsWithEpisodeTitle = class _RemoveConflictsWithEpisodeTitle extends Rule {
  constructor() {
    super(...arguments);
    this.consequence = RemoveMatch;
    this.previousNames = ["episode", "episode_count", "season", "season_count", "date", "title", "year"];
    this.nextNames = ["streaming_service", "screen_size", "source", "video_codec", "audio_codec", "other", "container"];
    this.affectedIfHolesAfter = ["part"];
    this.affectedNames = ["part", "year"];
  }
  when(matches, _context) {
    const toRemove = [];
    const fileparts = matches.markers.named("path");
    for (const filepart of fileparts) {
      const affectedMatches = matches.range(
        filepart.start,
        filepart.end,
        (m) => this.affectedNames.includes(m.name ?? "")
      );
      for (const match of affectedMatches) {
        const before = matches.range(
          filepart.start,
          match.start,
          (m) => !m.private,
          -1
        );
        if (!before || !this.previousNames.includes(before.name ?? "")) {
          continue;
        }
        if (before.tags?.includes("weak-episode") || before.tags?.includes("weak-duplicate")) {
          continue;
        }
        if (match.name === "year") {
          const yearGroup = matches.markers.atMatch(
            match,
            (m) => m.name === "group",
            0
          );
          if (yearGroup) continue;
        }
        const after = matches.range(
          match.end,
          filepart.end,
          (m) => !m.private,
          0
        );
        if (!after || !this.nextNames.includes(after.name ?? "")) {
          continue;
        }
        const group = matches.markers.atMatch(
          match,
          (m) => m.name === "group",
          0
        );
        const hasValueInSameGroup = (m) => !!(m.value && String(m.value).replace(new RegExp(`[${sepsPattern}]`, "g"), "")) && group === matches.markers.atMatch(m, (mm) => mm.name === "group", 0);
        const holesBefore = matches.holes(before.end, match.start, { predicate: hasValueInSameGroup });
        const holesAfter = matches.holes(match.end, after.start, { predicate: hasValueInSameGroup });
        const hasHolesBefore = hasmatch(holesBefore);
        const hasHolesAfter = hasmatch(holesAfter);
        if (!hasHolesBefore && !hasHolesAfter) {
          continue;
        }
        if (this.affectedIfHolesAfter.includes(match.name ?? "") && !hasHolesAfter) {
          continue;
        }
        toRemove.push(match);
        if (match.parent) {
          toRemove.push(match.parent);
        }
      }
    }
    return toRemove;
  }
};
_RemoveConflictsWithEpisodeTitle.priority = 64;
let RemoveConflictsWithEpisodeTitle = _RemoveConflictsWithEpisodeTitle;
const _TitleToEpisodeTitle = class _TitleToEpisodeTitle extends Rule {
  when(matches, _context) {
    const titles = matches.named("title");
    const titleGroups = {};
    for (const title2 of titles) {
      const key = String(title2.value);
      titleGroups[key] = titleGroups[key] || [];
      titleGroups[key].push(title2);
    }
    const episodeTitles = [];
    if (Object.keys(titleGroups).length < 2) {
      return episodeTitles;
    }
    const epNames = /* @__PURE__ */ new Set(["episode", "season", "date", "year"]);
    const findPrevEpisode = (title2) => {
      const filepart = matches.markers.atMatch(title2, (m) => m.name === "path", 0);
      if (!filepart) return void 0;
      const prevMatches = matches.range(
        filepart.start,
        title2.start,
        (m) => !m.private && epNames.has(m.name ?? "")
      );
      const arr = Array.isArray(prevMatches) ? prevMatches : prevMatches ? [prevMatches] : [];
      return arr.length > 0 ? arr[arr.length - 1] : void 0;
    };
    const seriesTitleKeys = /* @__PURE__ */ new Set();
    for (const title2 of titles) {
      const prevEpisode = findPrevEpisode(title2);
      if (!prevEpisode) {
        seriesTitleKeys.add(normalizeTitle(String(title2.value)));
      }
    }
    for (const title2 of titles) {
      const prevEpisode = findPrevEpisode(title2);
      if (prevEpisode) {
        const norm = normalizeTitle(String(title2.value));
        if (!seriesTitleKeys.has(norm)) {
          episodeTitles.push(title2);
        }
      }
    }
    return episodeTitles;
  }
  then(matches, whenResponse, _context) {
    const episodeTitles = whenResponse;
    for (const title2 of episodeTitles) {
      matches.remove(title2);
      title2.name = "episode_title";
      matches.append(title2);
    }
  }
};
_TitleToEpisodeTitle.dependency = ["TitleFromPosition"];
let TitleToEpisodeTitle = _TitleToEpisodeTitle;
const _ExtendEpisodeTitleWithDetails = class _ExtendEpisodeTitleWithDetails extends Rule {
  when(matches, _context) {
    const episodeTitles = matches.named("episode_title");
    if (!episodeTitles || episodeTitles.length === 0) return void 0;
    const updates = [];
    for (const et of episodeTitles) {
      const inp = matches.inputString ?? "";
      const detailMatches = matches.range(
        et.end,
        et.end + 20,
        (m) => m.name === "episode_details"
      );
      if (!detailMatches || detailMatches.length === 0) continue;
      for (const detail of detailMatches) {
        const between = inp.slice(et.end, detail.start);
        if ([...between].every((c) => seps.includes(c))) {
          updates.push({ et, detail });
          break;
        }
      }
    }
    return updates.length > 0 ? updates : void 0;
  }
  then(matches, whenResponse, _context) {
    const updates = whenResponse;
    if (!updates) return;
    for (const { et, detail } of updates) {
      matches.remove(et);
      et.end = detail.end;
      et.value = void 0;
      et.value;
      matches.append(et);
    }
  }
};
_ExtendEpisodeTitleWithDetails.dependency = ["TitleToEpisodeTitle"];
let ExtendEpisodeTitleWithDetails = _ExtendEpisodeTitleWithDetails;
const _EpisodeTitleFromPosition = class _EpisodeTitleFromPosition extends Rule {
  constructor() {
    super(...arguments);
    this.previousNames = ["episode", "episode_count", "season", "season_count", "date", "title", "year"];
  }
  isIgnored(match) {
    return match.name === "language" || match.name === "country" || match.name === "episode_details";
  }
  when(matches, _context) {
    const toAppend = [];
    const fileparts = matches.markers.named("path");
    for (const filepart of fileparts) {
      const hasEpTitleInPart = hasmatch(matches.range(
        filepart.start,
        filepart.end,
        (m) => m.name === "episode_title",
        0
      ));
      if (hasEpTitleInPart) continue;
      const hasTitleInPart = hasmatch(matches.range(
        filepart.start,
        filepart.end,
        (m) => m.name === "title",
        0
      ));
      const hasEpisodeInPart = hasmatch(matches.range(
        filepart.start,
        filepart.end,
        (m) => m.name === "episode" && !m.private,
        0
      ));
      if (!hasTitleInPart && !hasEpisodeInPart) continue;
      const holesResult = matches.holes(filepart.start, filepart.end, {
        formatter: formatters(cleanup, reorderTitle),
        ignore: (m) => this.isIgnored(m),
        predicate: (m) => !!m.value
      });
      const holeArray = Array.isArray(holesResult) ? holesResult : holesResult ? [holesResult] : [];
      for (const hole of holeArray) {
        const prevPred = (m) => !m.private && this.previousNames.includes(m.name ?? "");
        const prevMatches = matches.range(filepart.start, hole.start, prevPred);
        const prevArr = Array.isArray(prevMatches) ? prevMatches : prevMatches ? [prevMatches] : [];
        const prevEpisode = prevArr.length > 0 ? prevArr[prevArr.length - 1] : void 0;
        let prevCrc32;
        if (!prevEpisode) {
          const crc32Matches = matches.range(
            filepart.start,
            hole.start,
            (m) => !m.private && m.name === "crc32"
          );
          const crc32Arr = Array.isArray(crc32Matches) ? crc32Matches : crc32Matches ? [crc32Matches] : [];
          prevCrc32 = crc32Arr.length > 0 ? crc32Arr[crc32Arr.length - 1] : void 0;
        }
        if (!prevEpisode && !prevCrc32) continue;
        hole.name = "episode_title";
        toAppend.push(hole);
      }
    }
    return toAppend;
  }
  then(matches, whenResponse, _context) {
    const holes = whenResponse;
    for (const hole of holes) {
      if (!matches.includes(hole)) {
        matches.append(hole);
      }
    }
  }
};
_EpisodeTitleFromPosition.dependency = ["ExtendEpisodeTitleWithDetails"];
let EpisodeTitleFromPosition = _EpisodeTitleFromPosition;
const _AlternativeTitleReplace = class _AlternativeTitleReplace extends Rule {
  constructor() {
    super(...arguments);
    this.previousNames = ["episode", "episode_count", "season", "season_count", "date", "title", "year"];
  }
  when(matches, _context) {
    if (hasmatch(matches.named("episode_title", null, 0))) {
      return void 0;
    }
    const alternativeTitle = matches.range(
      0,
      void 0,
      (m) => m.name === "alternative_title",
      0
    );
    if (alternativeTitle) {
      const mainTitle = matches.chainBefore(
        alternativeTitle.start,
        seps,
        0,
        (m) => m.name === "title",
        0
      );
      if (mainTitle) {
        const filepart = matches.markers.atMatch(mainTitle, (m) => m.name === "path", 0);
        const searchStart = filepart?.start ?? 0;
        const prevPred = (m) => !m.private && this.previousNames.includes(m.name ?? "");
        const prevMatches = matches.range(searchStart, mainTitle.start, prevPred);
        const prevArr = Array.isArray(prevMatches) ? prevMatches : prevMatches ? [prevMatches] : [];
        const episode = prevArr.length > 0 ? prevArr[prevArr.length - 1] : void 0;
        const searchEnd = filepart?.end ?? (matches.inputString?.length ?? mainTitle.end + 100);
        const crc32Matches = !episode ? matches.range(
          searchStart,
          searchEnd,
          (m) => !m.private && m.name === "crc32"
        ) : void 0;
        const crc32Arr = Array.isArray(crc32Matches) ? crc32Matches : crc32Matches ? [crc32Matches] : [];
        const crc32 = crc32Arr.length > 0 ? crc32Arr[0] : void 0;
        if (episode || crc32) {
          return alternativeTitle;
        }
      }
    }
    return void 0;
  }
  then(matches, whenResponse, _context) {
    const match = whenResponse;
    if (!match) return;
    matches.remove(match);
    match.name = "episode_title";
    match.tags = match.tags || [];
    match.tags.push("alternative-replaced");
    matches.append(match);
  }
};
_AlternativeTitleReplace.dependency = ["EpisodeTitleFromPosition"];
let AlternativeTitleReplace = _AlternativeTitleReplace;
const _TrimLanguageFromEpisodeTitle = class _TrimLanguageFromEpisodeTitle extends Rule {
  constructor() {
    super(...arguments);
    this.langNames = /* @__PURE__ */ new Set(["language", "country", "subtitle_language"]);
  }
  when(matches, _context) {
    const episodeTitles = matches.named("episode_title");
    if (!episodeTitles || episodeTitles.length === 0) return void 0;
    const updates = [];
    for (const et of episodeTitles) {
      let newStart = et.start;
      let newEnd = et.end;
      const overlapping = matches.range(
        et.start,
        et.end,
        (m) => this.langNames.has(m.name ?? "")
      );
      if (!overlapping || overlapping.length === 0) continue;
      const sorted = [...overlapping].sort((a, b) => b.start - a.start);
      for (const lang of sorted) {
        if (lang.start >= newStart && lang.start < newEnd) {
          const inputStr = et.inputString ?? "";
          const between = lang.end >= newEnd ? "" : inputStr.slice(lang.end, newEnd);
          if (between === "" || [...between].every((c) => seps.includes(c))) {
            let trimEnd = lang.start;
            while (trimEnd > newStart && seps.includes(inputStr[trimEnd - 1])) {
              trimEnd--;
            }
            if (trimEnd < newEnd) {
              newEnd = trimEnd;
            }
          }
        }
      }
      if (newStart !== et.start || newEnd !== et.end) {
        if (newEnd > newStart) {
          updates.push({ match: et, newStart, newEnd });
        }
      }
    }
    return updates.length > 0 ? updates : void 0;
  }
  then(matches, whenResponse, _context) {
    const updates = whenResponse;
    if (!updates) return;
    for (const { match, newStart, newEnd } of updates) {
      matches.remove(match);
      match.start = newStart;
      match.end = newEnd;
      match.value = void 0;
      const val = match.value;
      if (val && String(val).trim()) {
        matches.append(match);
      }
    }
  }
};
_TrimLanguageFromEpisodeTitle.dependency = ["EpisodeTitleFromPosition", "AlternativeTitleReplace"];
let TrimLanguageFromEpisodeTitle = _TrimLanguageFromEpisodeTitle;
class Filepart3EpisodeTitle extends Rule {
  constructor() {
    super(...arguments);
    this.consequence = new AppendMatch("title");
  }
  when(matches, _context) {
    if (hasmatch(matches.tagged("filepart-title", null, 0))) {
      return void 0;
    }
    const fileparts = matches.markers.named("path");
    if (fileparts.length < 3) {
      return void 0;
    }
    const filename = fileparts[fileparts.length - 1];
    const directory = fileparts[fileparts.length - 2];
    const subdirectory = fileparts[fileparts.length - 3];
    const episodeNumber = matches.range(
      filename.start,
      filename.end,
      (m) => m.name === "episode",
      0
    );
    if (episodeNumber) {
      const season = matches.range(
        directory.start,
        directory.end,
        (m) => m.name === "season",
        0
      );
      if (season) {
        const hole = matches.holes(subdirectory.start, subdirectory.end, {
          ignore: or_(
            (m) => !!m.tags?.includes("weak-episode"),
            (m) => m.name === "language" || m.name === "country" || m.name === "episode_details"
          ),
          formatter: cleanup,
          seps: titleSeps,
          predicate: (m) => !!m.value,
          index: 0
        });
        if (hole) {
          return hole;
        }
      }
    }
    return void 0;
  }
}
class Filepart2EpisodeTitle extends Rule {
  constructor() {
    super(...arguments);
    this.consequence = new AppendMatch("title");
  }
  when(matches, _context) {
    if (hasmatch(matches.tagged("filepart-title", null, 0))) {
      return void 0;
    }
    const fileparts = matches.markers.named("path");
    if (fileparts.length < 2) {
      return void 0;
    }
    const filename = fileparts[fileparts.length - 1];
    const directory = fileparts[fileparts.length - 2];
    const episodeNumber = matches.range(
      filename.start,
      filename.end,
      (m) => m.name === "episode",
      0
    );
    if (episodeNumber) {
      const season = matches.range(directory.start, directory.end, (m) => m.name === "season", 0) || matches.range(filename.start, filename.end, (m) => m.name === "season", 0);
      if (season) {
        const hole = matches.holes(directory.start, directory.end, {
          ignore: or_(
            (m) => !!m.tags?.includes("weak-episode"),
            (m) => m.name === "language" || m.name === "country" || m.name === "episode_details"
          ),
          formatter: cleanup,
          seps: titleSeps,
          predicate: (m) => !!m.value,
          index: 0
        });
        if (hole) {
          const groupMarkers = matches.markers.named("group");
          const groupArray = Array.isArray(groupMarkers) ? groupMarkers : groupMarkers ? [groupMarkers] : [];
          const relevantGroups = groupArray.filter(
            (g) => g.start >= directory.start && g.end <= directory.end && !(g.start === directory.start && g.end === directory.end)
          );
          if (relevantGroups.length > 0) {
            const cropped = hole.crop(relevantGroups);
            const croppedArr = Array.isArray(cropped) ? cropped : cropped ? [cropped] : [];
            const first = croppedArr.find((c) => c.value);
            if (first) {
              first.tags = first.tags || [];
              first.tags.push("filepart-title");
              return first;
            }
          } else {
            hole.tags = hole.tags || [];
            hole.tags.push("filepart-title");
            return hole;
          }
        }
      }
    }
    return void 0;
  }
}
const _RenameEpisodeTitleWhenMovieType = class _RenameEpisodeTitleWhenMovieType extends Rule {
  when(matches, _context) {
    const episodeTitles = matches.named(
      "episode_title",
      (m) => !m.tags?.includes("alternative-replaced")
    ) || [];
    const episodeType = matches.named("type", (m) => m.value === "episode", 0);
    if (episodeTitles.length > 0 && !episodeType) {
      return episodeTitles;
    }
    return void 0;
  }
  then(matches, whenResponse, _context) {
    const episodeTitles = whenResponse;
    if (!episodeTitles) return;
    for (const match of episodeTitles) {
      matches.remove(match);
      match.name = "alternative_title";
      matches.append(match);
    }
  }
};
_RenameEpisodeTitleWhenMovieType.priority = POST_PROCESS;
_RenameEpisodeTitleWhenMovieType.dependency = ["TypeProcessor"];
let RenameEpisodeTitleWhenMovieType = _RenameEpisodeTitleWhenMovieType;
const LANGUAGES = [
  // Major languages
  { alpha3: "eng", alpha2: "en", name: "English", opensubtitles: "eng" },
  { alpha3: "fra", alpha2: "fr", name: "French", opensubtitles: "fre" },
  { alpha3: "deu", alpha2: "de", name: "German", opensubtitles: "ger" },
  { alpha3: "spa", alpha2: "es", name: "Spanish", opensubtitles: "spa" },
  { alpha3: "ita", alpha2: "it", name: "Italian", opensubtitles: "ita" },
  { alpha3: "por", alpha2: "pt", name: "Portuguese", opensubtitles: "por" },
  { alpha3: "rus", alpha2: "ru", name: "Russian", opensubtitles: "rus" },
  { alpha3: "jpn", alpha2: "ja", name: "Japanese", opensubtitles: "jpn" },
  { alpha3: "zho", alpha2: "zh", name: "Chinese", opensubtitles: "chi" },
  { alpha3: "kor", alpha2: "ko", name: "Korean", opensubtitles: "kor" },
  { alpha3: "ara", alpha2: "ar", name: "Arabic", opensubtitles: "ara" },
  { alpha3: "hin", alpha2: "hi", name: "Hindi", opensubtitles: "hin" },
  { alpha3: "tur", alpha2: "tr", name: "Turkish", opensubtitles: "tur" },
  { alpha3: "pol", alpha2: "pl", name: "Polish", opensubtitles: "pol" },
  { alpha3: "nld", alpha2: "nl", name: "Dutch", opensubtitles: "dut" },
  { alpha3: "swe", alpha2: "sv", name: "Swedish", opensubtitles: "swe" },
  { alpha3: "dan", alpha2: "da", name: "Danish", opensubtitles: "dan" },
  { alpha3: "nor", alpha2: "no", name: "Norwegian", opensubtitles: "nor" },
  { alpha3: "fin", alpha2: "fi", name: "Finnish", opensubtitles: "fin" },
  { alpha3: "hun", alpha2: "hu", name: "Hungarian", opensubtitles: "hun" },
  { alpha3: "ces", alpha2: "cs", name: "Czech", opensubtitles: "cze" },
  { alpha3: "rum", alpha2: "ro", name: "Romanian", opensubtitles: "rum" },
  { alpha3: "ukr", alpha2: "uk", name: "Ukrainian", opensubtitles: "ukr" },
  { alpha3: "heb", alpha2: "he", name: "Hebrew", opensubtitles: "heb" },
  { alpha3: "cat", alpha2: "ca", name: "Catalan", opensubtitles: "cat" },
  { alpha3: "vie", alpha2: "vi", name: "Vietnamese", opensubtitles: "vie" },
  { alpha3: "tha", alpha2: "th", name: "Thai", opensubtitles: "tha" },
  { alpha3: "ind", alpha2: "id", name: "Indonesian", opensubtitles: "ind" },
  { alpha3: "mal", alpha2: "ml", name: "Malayalam", opensubtitles: "mal" },
  { alpha3: "tel", alpha2: "te", name: "Telugu", opensubtitles: "tel" },
  { alpha3: "tam", alpha2: "ta", name: "Tamil", opensubtitles: "tam" },
  { alpha3: "bul", alpha2: "bg", name: "Bulgarian", opensubtitles: "bul" },
  { alpha3: "hrv", alpha2: "hr", name: "Croatian", opensubtitles: "hrv" },
  { alpha3: "srp", alpha2: "sr", name: "Serbian", opensubtitles: "srp" },
  { alpha3: "slk", alpha2: "sk", name: "Slovak", opensubtitles: "slo" },
  { alpha3: "slv", alpha2: "sl", name: "Slovenian", opensubtitles: "slv" },
  { alpha3: "ell", alpha2: "el", name: "Greek", opensubtitles: "ell" },
  { alpha3: "lit", alpha2: "lt", name: "Lithuanian", opensubtitles: "lit" },
  { alpha3: "lav", alpha2: "lv", name: "Latvian", opensubtitles: "lav" },
  { alpha3: "est", alpha2: "et", name: "Estonian", opensubtitles: "est" },
  { alpha3: "glg", alpha2: "gl", name: "Galician", opensubtitles: "glg" },
  { alpha3: "eus", alpha2: "eu", name: "Basque", opensubtitles: "baq" },
  { alpha3: "ben", alpha2: "bn", name: "Bengali", opensubtitles: "ben" },
  { alpha3: "isl", alpha2: "is", name: "Icelandic", opensubtitles: "ice" },
  { alpha3: "mkd", alpha2: "mk", name: "Macedonian", opensubtitles: "mac" },
  { alpha3: "bos", alpha2: "bs", name: "Bosnian", opensubtitles: "bos" },
  { alpha3: "alb", alpha2: "sq", name: "Albanian", opensubtitles: "alb" },
  { alpha3: "per", alpha2: "fa", name: "Persian", opensubtitles: "per" },
  { alpha3: "msa", alpha2: "ms", name: "Malay", opensubtitles: "may" },
  { alpha3: "mon", alpha2: "mn", name: "Mongolian", opensubtitles: "mon" },
  { alpha3: "tha", alpha2: "th", name: "Thai", opensubtitles: "tha" },
  { alpha3: "urd", alpha2: "ur", name: "Urdu", opensubtitles: "urd" },
  { alpha3: "pan", alpha2: "pa", name: "Punjabi", opensubtitles: "pun" },
  { alpha3: "guj", alpha2: "gu", name: "Gujarati", opensubtitles: "guj" },
  { alpha3: "kan", alpha2: "kn", name: "Kannada", opensubtitles: "kan" },
  { alpha3: "mar", alpha2: "mr", name: "Marathi", opensubtitles: "mar" },
  { alpha3: "asm", alpha2: "as", name: "Assamese", opensubtitles: "asm" },
  { alpha3: "mya", alpha2: "my", name: "Burmese", opensubtitles: "mya" },
  { alpha3: "khm", alpha2: "km", name: "Khmer", opensubtitles: "khm" },
  { alpha3: "lao", alpha2: "lo", name: "Lao", opensubtitles: "lao" },
  // Regional variants
  { alpha3: "por", alpha2: "pt", name: "Brazilian Portuguese", country: "BR", opensubtitles: "pob" },
  { alpha3: "zho", alpha2: "zh", name: "Simplified Chinese", country: "CN", opensubtitles: "chi" },
  { alpha3: "zho", alpha2: "zh", name: "Traditional Chinese", country: "TW", opensubtitles: "zht" },
  { alpha3: "zho", alpha2: "zh", name: "Hong Kong Chinese", country: "HK", opensubtitles: "zht" },
  { alpha3: "deu", alpha2: "de", name: "Swiss German", country: "CH", opensubtitles: "ger" },
  { alpha3: "fra", alpha2: "fr", name: "Swiss French", country: "CH", opensubtitles: "fre" },
  { alpha3: "ita", alpha2: "it", name: "Swiss Italian", country: "CH", opensubtitles: "ita" },
  { alpha3: "nld", alpha2: "nl", name: "Flemish", country: "BE", opensubtitles: "dut" },
  // Special languages
  { alpha3: "und", name: "Undetermined", opensubtitles: "und" },
  { alpha3: "mul", name: "Multiple Languages", opensubtitles: "mul" }
];
function buildLookupMap(key) {
  const map = /* @__PURE__ */ new Map();
  for (const lang of LANGUAGES) {
    const value = lang[key];
    if (value) {
      const k = String(value).toLowerCase();
      if (!map.has(k) || !lang.country && map.get(k).country) {
        map.set(k, lang);
      }
    }
  }
  return map;
}
const ALPHA3_MAP = buildLookupMap("alpha3");
const ALPHA2_MAP = buildLookupMap("alpha2");
const NAME_MAP = buildLookupMap("name");
const OPENSUBTITLES_MAP = buildLookupMap("opensubtitles");
const GUESSIT_SYNONYMS = {
  "ell": ["gr", "greek"],
  "spa": ["esp", "español", "espanol"],
  "fra": ["français", "vf", "vff", "vfi", "vfq"],
  "swe": ["se"],
  "por_BR": ["po", "pb", "pob", "ptbr", "br", "brazilian"],
  "deu_CH": ["swissgerman", "swiss german"],
  "nld_BE": ["flemish"],
  "cat": ["català", "castellano", "espanol castellano", "español castellano"],
  "ces": ["cz"],
  "ukr": ["ua"],
  "zho": ["cn"],
  "jpn": ["jp"],
  "hrv": ["scr"],
  "mul": ["multi", "multiple", "dl"]
};
class Language {
  constructor(alpha3, country2, script) {
    this.alpha3 = alpha3;
    this.country = country2;
    this.script = script;
  }
  /**
   * Convert to string representation: "eng" or "eng-US"
   */
  toString() {
    if (this.country) {
      return `${this.alpha3}-${this.country}`;
    }
    return this.alpha3;
  }
  /**
   * Get the language name
   */
  getName() {
    this.country ? `${this.alpha3}-${this.country}` : this.alpha3;
    for (const lang of LANGUAGES) {
      if (lang.alpha3 === this.alpha3 && lang.country === this.country) {
        return lang.name;
      }
    }
    for (const lang of LANGUAGES) {
      if (lang.alpha3 === this.alpha3 && !lang.country) {
        return lang.name;
      }
    }
    return this.alpha3;
  }
  /**
   * Get the alpha2 code if available
   */
  getAlpha2() {
    for (const lang of LANGUAGES) {
      if (lang.alpha3 === this.alpha3 && lang.country === this.country) {
        return lang.alpha2;
      }
    }
    for (const lang of LANGUAGES) {
      if (lang.alpha3 === this.alpha3 && !lang.country) {
        return lang.alpha2;
      }
    }
    return void 0;
  }
  /**
   * Get the OpenSubtitles code if available
   */
  getOpenSubtitles() {
    for (const lang of LANGUAGES) {
      if (lang.alpha3 === this.alpha3 && lang.country === this.country) {
        return lang.opensubtitles;
      }
    }
    for (const lang of LANGUAGES) {
      if (lang.alpha3 === this.alpha3 && !lang.country) {
        return lang.opensubtitles;
      }
    }
    return void 0;
  }
  /**
   * Create a Language from a string (main lookup method)
   * Tries multiple formats: alpha3, alpha2, name, IETF, OpenSubtitles, synonyms
   */
  static fromString(value) {
    if (!value) return void 0;
    const lower = value.toLowerCase().trim();
    const lang = this.fromSynonym(lower);
    if (lang) return lang;
    if (lower.length === 3) {
      return this.fromAlpha3(lower);
    }
    if (lower.length === 2) {
      return this.fromAlpha2(lower);
    }
    const byName = this.fromName(lower);
    if (byName) return byName;
    const byOpenSubs = this.fromOpenSubtitles(lower);
    if (byOpenSubs) return byOpenSubs;
    const byIETF = this.fromIetf(lower);
    if (byIETF) return byIETF;
    return void 0;
  }
  /**
   * Create a Language from alpha3 code
   */
  static fromAlpha3(code) {
    if (!code) return void 0;
    const lower = code.toLowerCase().trim();
    const lang = ALPHA3_MAP.get(lower);
    if (lang) {
      return new Language(lang.alpha3, lang.country, lang.script);
    }
    return void 0;
  }
  /**
   * Create a Language from alpha2 code
   */
  static fromAlpha2(code) {
    if (!code) return void 0;
    const lower = code.toLowerCase().trim();
    const lang = ALPHA2_MAP.get(lower);
    if (lang) {
      return new Language(lang.alpha3, lang.country, lang.script);
    }
    return void 0;
  }
  /**
   * Create a Language from language name
   */
  static fromName(name) {
    if (!name) return void 0;
    const lower = name.toLowerCase().trim();
    const lang = NAME_MAP.get(lower);
    if (lang) {
      return new Language(lang.alpha3, lang.country, lang.script);
    }
    return void 0;
  }
  /**
   * Create a Language from OpenSubtitles code
   */
  static fromOpenSubtitles(code) {
    if (!code) return void 0;
    const lower = code.toLowerCase().trim();
    const lang = OPENSUBTITLES_MAP.get(lower);
    if (lang) {
      return new Language(lang.alpha3, lang.country, lang.script);
    }
    return void 0;
  }
  /**
   * Create a Language from IETF language tag (e.g., "en-US", "pt-BR")
   */
  static fromIetf(tag) {
    if (!tag) return void 0;
    const parts = tag.toLowerCase().trim().split("-");
    if (parts.length === 0) return void 0;
    if (parts.length >= 1) {
      const byAlpha2 = this.fromAlpha2(parts[0]);
      if (byAlpha2 && parts.length >= 2) {
        if (parts[1].length === 2) {
          byAlpha2.country = parts[1].toUpperCase();
        } else {
          return void 0;
        }
      }
      return byAlpha2;
    }
    return void 0;
  }
  /**
   * Create a Language from a guessit synonym
   */
  static fromSynonym(value) {
    if (!value) return void 0;
    const lower = value.toLowerCase().trim();
    for (const [key, synonyms] of Object.entries(GUESSIT_SYNONYMS)) {
      for (const syn of synonyms) {
        if (syn.toLowerCase() === lower) {
          const [alpha3, country2] = key.split("_");
          return new Language(alpha3, country2);
        }
      }
    }
    return void 0;
  }
  /**
   * Check equality
   */
  equals(other2) {
    return this.alpha3 === other2.alpha3 && this.country === other2.country && this.script === other2.script;
  }
}
const UNDETERMINED = new Language("und");
const MULTIPLE = new Language("mul");
function* iterWords(string) {
  let start = null;
  for (let i = 0; i <= string.length; i++) {
    const ch = i < string.length ? string[i] : null;
    if (ch !== null && !seps.includes(ch)) {
      if (start === null) start = i;
    } else {
      if (start !== null) {
        yield { span: [start, i], value: string.slice(start, i) };
        start = null;
      }
    }
  }
}
class LanguageWord {
  constructor(start, end, value, inputString, nextWord) {
    this.start = start;
    this.end = end;
    this.value = value;
    this.inputString = inputString;
    this.nextWord = nextWord;
  }
  /**
   * Get extended word by combining with next word if separators match
   */
  get extendedWord() {
    if (!this.nextWord) return void 0;
    const separator = this.inputString.slice(this.end, this.nextWord.start);
    const nextSeparator = this.inputString.slice(
      this.nextWord.end,
      this.nextWord.end + 1
    );
    if (separator === "-" && separator !== nextSeparator || separator === " " || separator === ".") {
      const value = this.inputString.slice(this.start, this.nextWord.end).replace(/\./g, " ");
      return new LanguageWord(
        this.start,
        this.nextWord.end,
        value,
        this.inputString,
        this.nextWord.nextWord
      );
    }
    return void 0;
  }
}
class LanguageFinder {
  constructor(context, subtitlePrefixes, subtitleSuffixes, langPrefixes, langSuffixes, weakAffixes, commonWords) {
    const allowedLanguagesArray = context?.allowed_languages || [];
    this.allowedLanguages = new Set(
      allowedLanguagesArray.map((l) => l.toLowerCase())
    );
    this.weakAffixes = new Set(weakAffixes);
    this.commonWords = commonWords ?? /* @__PURE__ */ new Set();
    this.prefixesMap = /* @__PURE__ */ new Map();
    this.suffixesMap = /* @__PURE__ */ new Map();
    if (!isDisabled(context, "subtitle_language")) {
      this.prefixesMap.set("subtitle_language", subtitlePrefixes);
      this.suffixesMap.set("subtitle_language", subtitleSuffixes);
    }
    this.prefixesMap.set("language", langPrefixes);
    this.suffixesMap.set("language", langSuffixes);
  }
  /**
   * Find all language matches in the string
   */
  *find(inputString) {
    const regularLangMap = /* @__PURE__ */ new Map();
    const undeterminedMap = /* @__PURE__ */ new Map();
    const multiMap = /* @__PURE__ */ new Map();
    for (const match of this.iterLanguageMatches(inputString)) {
      const key = match.propertyName;
      if (match.lang.equals(UNDETERMINED)) {
        if (!undeterminedMap.has(key)) undeterminedMap.set(key, /* @__PURE__ */ new Set());
        undeterminedMap.get(key).add(match);
      } else if (match.lang.equals(MULTIPLE)) {
        if (!multiMap.has(key)) multiMap.set(key, /* @__PURE__ */ new Set());
        multiMap.get(key).add(match);
      } else {
        if (!regularLangMap.has(key)) regularLangMap.set(key, /* @__PURE__ */ new Set());
        regularLangMap.get(key).add(match);
      }
    }
    for (const [key, values] of multiMap) {
      if (regularLangMap.has(key) || !undeterminedMap.has(key)) {
        for (const value of values) {
          yield this.toRebulkMatch(value);
        }
      }
    }
    for (const [key, values] of undeterminedMap) {
      if (!regularLangMap.has(key)) {
        for (const value of values) {
          yield this.toRebulkMatch(value);
        }
      }
    }
    for (const values of regularLangMap.values()) {
      for (const value of values) {
        yield this.toRebulkMatch(value);
      }
    }
  }
  /**
   * Convert LanguageMatch to rebulk match tuple
   */
  toRebulkMatch(match) {
    const word = match.word;
    const start = word.start;
    const end = word.end;
    const name = match.propertyName;
    if (match.lang.equals(UNDETERMINED)) {
      return [
        start,
        end,
        {
          name,
          value: word.value.toLowerCase(),
          formatter: (s) => new Language("und"),
          tags: ["weak-language"]
        }
      ];
    }
    const tags = [];
    if (this.commonWords.has(word.value.toLowerCase())) {
      tags.push("common");
    }
    return [
      start,
      end,
      {
        name,
        value: match.lang,
        ...tags.length > 0 ? { tags } : {}
      }
    ];
  }
  /**
   * Iterate over language matches in the string
   */
  *iterLanguageMatches(inputString) {
    const candidates = [];
    let previous = null;
    for (const word of iterWords(inputString)) {
      const languageWord = new LanguageWord(
        word.span[0],
        word.span[1],
        word.value,
        inputString
      );
      if (previous) {
        previous.nextWord = languageWord;
        candidates.push(previous);
      }
      previous = languageWord;
    }
    if (previous) {
      candidates.push(previous);
    }
    for (const candidate of candidates) {
      yield* this.iterMatchesForCandidate(candidate);
    }
  }
  /**
   * Iterate over matches for a candidate word
   */
  *iterMatchesForCandidate(languageWord) {
    if (languageWord.nextWord) {
      const match2 = this.findMatchForWord(
        languageWord.nextWord,
        languageWord,
        this.prefixesMap,
        (w, p) => w.startsWith(p),
        (w, p) => w.slice(p.length)
      );
      if (match2) yield match2;
    }
    const match = this.findMatchForWord(
      languageWord,
      languageWord.nextWord ?? void 0,
      this.suffixesMap,
      (w, s) => w.endsWith(s),
      (w, s) => w.slice(0, -s.length)
    );
    if (match) yield match;
    const directMatch = this.findLanguageMatchForWord(languageWord);
    if (directMatch) yield directMatch;
  }
  /**
   * Find match for word with affixes
   */
  findMatchForWord(word, fallbackWord, affixes, isAffix, stripAffix) {
    if (!word) return void 0;
    for (const currentWord of [word.extendedWord, word]) {
      if (!currentWord) continue;
      const wordLang = currentWord.value.toLowerCase();
      for (const [key, parts] of affixes) {
        for (const part2 of parts) {
          if (!isAffix(wordLang, part2)) continue;
          let match = void 0;
          const value = stripAffix(wordLang, part2);
          if (!value) {
            if (fallbackWord && (Math.abs(fallbackWord.start - currentWord.end) <= 1 || Math.abs(currentWord.start - fallbackWord.end) <= 1)) {
              match = this.findLanguageMatchForWord(fallbackWord, key);
            }
            if (!match && !this.weakAffixes.has(part2)) {
              match = this.createLanguageMatch(
                key,
                new LanguageWord(
                  currentWord.start,
                  currentWord.end,
                  "und",
                  currentWord.inputString
                )
              );
            }
          } else {
            let matchStart = currentWord.start;
            let matchEnd = currentWord.end;
            if (currentWord !== word) {
              const trimmedValue = value.trim();
              if (trimmedValue && fallbackWord) {
                matchStart = fallbackWord.start;
                matchEnd = fallbackWord.end;
              }
            }
            match = this.createLanguageMatch(
              key,
              new LanguageWord(
                matchStart,
                matchEnd,
                value,
                currentWord.inputString
              )
            );
          }
          if (match) return match;
        }
      }
    }
    return void 0;
  }
  /**
   * Find language match for word
   */
  findLanguageMatchForWord(word, key = "language") {
    if (!word) return void 0;
    for (const currentWord of [word.extendedWord, word]) {
      if (currentWord) {
        const match = this.createLanguageMatch(key, currentWord);
        if (match) return match;
      }
    }
    return void 0;
  }
  /**
   * Create a LanguageMatch for a word
   */
  createLanguageMatch(key, word) {
    const lang = this.parseLanguage(word.value.toLowerCase());
    if (lang) {
      return {
        propertyName: key,
        word,
        lang
      };
    }
    return void 0;
  }
  /**
   * Parse a language word into a Language object
   */
  parseLanguage(langWord) {
    const lang = Language.fromString(langWord);
    if (!lang) return void 0;
    if (this.allowedLanguages.size === 0) {
      return lang;
    }
    const name = lang.getName().toLowerCase();
    const alpha2 = lang.getAlpha2();
    const alpha3 = lang.alpha3.toLowerCase();
    if (this.allowedLanguages.has(name) || alpha2 && this.allowedLanguages.has(alpha2.toLowerCase()) || this.allowedLanguages.has(alpha3)) {
      return lang;
    }
    return void 0;
  }
}
class SubtitlePrefixLanguageRule extends Rule {
  constructor() {
    super(...arguments);
    this.consequence = RemoveMatch;
    this.properties = { subtitle_language: [null] };
  }
  enabled(context) {
    return !isDisabled(context, "subtitle_language");
  }
  when(matches, context) {
    const toRename = [];
    const toRemove = matches.named("subtitle_language.prefix") || [];
    for (const lang of matches.named("language") || []) {
      let prefix = matches.previous(
        lang,
        (m) => m.name === "subtitle_language.prefix",
        0
      );
      if (!prefix) {
        const groupMarker = matches.markers?.at(lang, (m) => m.name === "group", 0);
        if (groupMarker) {
          prefix = matches.previous(
            groupMarker,
            (m) => m.name === "subtitle_language.prefix",
            0
          );
          if (!prefix) {
            prefix = matches.range?.(
              groupMarker.start,
              lang.start,
              (m) => m.name === "subtitle_language.prefix",
              0
            );
          }
        }
      }
      if (!prefix) {
        const groupMarker = matches.markers?.atMatch?.(lang, (m) => m.name === "group", 0);
        if (groupMarker) {
          const siblingRename = toRename.find(
            ([_pfx, renamedLang]) => renamedLang.start >= groupMarker.start && renamedLang.end <= groupMarker.end
          );
          if (siblingRename) {
            prefix = siblingRename[0];
          }
        }
      }
      if (prefix) {
        toRename.push([prefix, lang]);
        const conflicting = matches.conflicting?.(lang) || [];
        toRemove.push(...conflicting);
        if (toRemove.includes(prefix)) {
          toRemove.splice(toRemove.indexOf(prefix), 1);
        }
      }
    }
    if (toRename.length > 0 || toRemove.length > 0) {
      return { toRename, toRemove };
    }
    return false;
  }
  then(matches, whenResponse, context) {
    const { toRename, toRemove } = whenResponse;
    for (const m of toRemove) {
      matches.remove(m);
    }
    for (const [prefix, match] of toRename) {
      const suffix = { ...prefix, name: "subtitle_language.suffix" };
      if (matches.includes?.(suffix)) {
        matches.remove(suffix);
      }
      matches.remove(match);
      match.name = "subtitle_language";
      matches.append(match);
    }
  }
}
class SubtitleSuffixLanguageRule extends Rule {
  constructor() {
    super(...arguments);
    this.dependency = SubtitlePrefixLanguageRule;
    this.consequence = RemoveMatch;
    this.properties = { subtitle_language: [null] };
  }
  enabled(context) {
    return !isDisabled(context, "subtitle_language");
  }
  when(matches, context) {
    const toAppend = [];
    const toRemove = matches.named("subtitle_language.suffix") || [];
    for (const lang of matches.named("language") || []) {
      const suffix = matches.next(
        lang,
        (m) => m.name === "subtitle_language.suffix",
        0
      );
      if (suffix) {
        const nextLang = matches.next(
          suffix,
          (m) => m.name === "language" || m.name === "subtitle_language",
          0
        );
        if (nextLang) {
          continue;
        }
        const overlapping = matches.range?.(
          suffix.start,
          suffix.end + 10,
          (m) => (m.name === "language" || m.name === "subtitle_language") && m.start >= suffix.start && m.end > suffix.end,
          0
        );
        if (overlapping) {
          continue;
        }
        toAppend.push(lang);
        if (toRemove.includes(suffix)) {
          toRemove.splice(toRemove.indexOf(suffix), 1);
        }
      }
    }
    if (toAppend.length > 0 || toRemove.length > 0) {
      return { toAppend, toRemove };
    }
    return false;
  }
  then(matches, whenResponse, context) {
    const { toAppend, toRemove } = whenResponse;
    for (const m of toRemove) {
      matches.remove(m);
    }
    for (const match of toAppend) {
      matches.remove(match);
      match.name = "subtitle_language";
      matches.append(match);
    }
  }
}
const _SubtitleExtensionRule = class _SubtitleExtensionRule extends Rule {
  constructor() {
    super(...arguments);
    this.dependency = SubtitleSuffixLanguageRule;
  }
  when(matches, context) {
    const containers = matches.named("container") || [];
    const containerArr = Array.isArray(containers) ? containers : containers ? [containers] : [];
    const subtitleContainer = containerArr.find(
      (c) => _SubtitleExtensionRule.SUBTITLE_EXTENSIONS.has(String(c.value).toLowerCase())
    );
    if (!subtitleContainer) return false;
    const fileparts = matches.markers?.named("path") || [];
    const filepartArr = Array.isArray(fileparts) ? fileparts : fileparts ? [fileparts] : [];
    const subtitleFilepart = filepartArr.find(
      (fp) => subtitleContainer.start >= fp.start && subtitleContainer.end <= fp.end
    );
    const languages = matches.named("language") || [];
    const langArr = Array.isArray(languages) ? languages : languages ? [languages] : [];
    let toConvert;
    if (subtitleFilepart) {
      toConvert = langArr.filter(
        (l) => l.start >= subtitleFilepart.start && l.end <= subtitleFilepart.end
      );
    } else {
      toConvert = langArr;
    }
    return toConvert.length > 0 ? toConvert : false;
  }
  then(matches, whenResponse, _context) {
    if (!whenResponse || !Array.isArray(whenResponse)) return;
    for (const match of whenResponse) {
      matches.remove(match);
      match.name = "subtitle_language";
      matches.append(match);
    }
  }
};
_SubtitleExtensionRule.SUBTITLE_EXTENSIONS = /* @__PURE__ */ new Set(["srt", "sub", "smi", "ssa", "ass", "vtt", "idx", "sup"]);
let SubtitleExtensionRule = _SubtitleExtensionRule;
class RemoveCommonWordsLanguageRule extends Rule {
  constructor() {
    super(...arguments);
    this.consequence = RemoveMatch;
    this.priority = 32;
  }
  when(matches, context) {
    const toRemove = [];
    const fileparts = matches.markers?.named("path") || [];
    const filepartArr = Array.isArray(fileparts) ? fileparts : fileparts ? [fileparts] : [];
    for (const filepart of filepartArr) {
      const langs = matches.range?.(
        filepart.start,
        filepart.end,
        (m) => m.name === "language" || m.name === "subtitle_language"
      ) || [];
      const commonLangs = langs.filter((m) => m.tags?.includes("common"));
      const nonCommonLangs = langs.filter((m) => !m.tags?.includes("common"));
      if (nonCommonLangs.length === 0) {
        toRemove.push(...commonLangs);
      } else {
        const groups2 = matches.markers?.named?.("group") || [];
        const groupArr = Array.isArray(groups2) ? groups2 : groups2 ? [groups2] : [];
        const isInGroup = (m) => groupArr.some((g) => m.start >= g.start && m.end <= g.end);
        const nonCommonOutsideGroups = nonCommonLangs.filter((m) => !isInGroup(m));
        if (nonCommonOutsideGroups.length === 0) {
          const commonOutsideGroups = commonLangs.filter((m) => !isInGroup(m));
          toRemove.push(...commonOutsideGroups);
        }
      }
    }
    return toRemove.length > 0 ? toRemove : false;
  }
}
class RemoveLanguageRule extends Rule {
  constructor() {
    super(...arguments);
    this.consequence = RemoveMatch;
  }
  enabled(context) {
    return isDisabled(context, "language");
  }
  when(matches, context) {
    return matches.named("language") || false;
  }
}
class RemoveUndeterminedLanguagesRule2 extends Rule {
  constructor() {
    super(...arguments);
    this.consequence = RemoveMatch;
    this.priority = 32;
  }
  when(matches, context) {
    const toRemove = [];
    for (const match of matches.range?.(0, matches.inputString?.length) || []) {
      if (!["language", "subtitle_language"].includes(match.name)) continue;
      if (match.value === "und" || match.value instanceof Language && match.value.alpha3 === "und") {
        const previous = matches.previous?.(match, void 0, 0);
        const next = matches.next?.(match, void 0, 0);
        const langNames = /* @__PURE__ */ new Set(["language", "subtitle_language"]);
        if (previous && langNames.has(previous.name) || next && langNames.has(next.name)) {
          toRemove.push(match);
        }
      }
    }
    return toRemove.length > 0 ? toRemove : false;
  }
}
function language(config, commonWords) {
  const subtitleBoth = config.subtitle_affixes;
  const subtitlePrefixes = [
    ...subtitleBoth,
    ...config.subtitle_prefixes
  ].sort((a, b) => b.length - a.length);
  const subtitleSuffixes = [
    ...subtitleBoth,
    ...config.subtitle_suffixes
  ].sort((a, b) => b.length - a.length);
  const langBoth = config.language_affixes;
  const langPrefixes = [...langBoth, ...config.language_prefixes].sort(
    (a, b) => b.length - a.length
  );
  const langSuffixes = [...langBoth, ...config.language_suffixes].sort(
    (a, b) => b.length - a.length
  );
  const weakAffixes = new Set(config.weak_affixes);
  const rebulk = new Rebulk().stringDefaults({ ignoreCase: true }).defaults({
    validator: sepsSurround
  });
  for (const prefix of subtitlePrefixes) {
    rebulk.string(prefix, {
      name: "subtitle_language.prefix",
      ignoreCase: true,
      private: true,
      validator: sepsSurround,
      tags: ["release-group-prefix"],
      disabled: (context) => isDisabled(context, "subtitle_language")
    });
  }
  for (const suffix of subtitleSuffixes) {
    rebulk.string(suffix, {
      name: "subtitle_language.suffix",
      ignoreCase: true,
      private: true,
      validator: sepsSurround,
      disabled: (context) => isDisabled(context, "subtitle_language")
    });
  }
  for (const suffix of langSuffixes) {
    rebulk.string(suffix, {
      name: "language.suffix",
      ignoreCase: true,
      private: true,
      validator: sepsSurround,
      tags: ["source-suffix"],
      disabled: (context) => isDisabled(context, "language")
    });
  }
  rebulk.functional(
    (input, context) => {
      const finder = new LanguageFinder(
        context,
        subtitlePrefixes,
        subtitleSuffixes,
        langPrefixes,
        langSuffixes,
        Array.from(weakAffixes),
        commonWords
      );
      return Array.from(finder.find(input));
    },
    {
      properties: { language: [null] },
      disabled: (context) => isDisabled(context, "language")
    }
  );
  rebulk.rules(
    SubtitlePrefixLanguageRule,
    SubtitleSuffixLanguageRule,
    SubtitleExtensionRule,
    RemoveCommonWordsLanguageRule,
    RemoveLanguageRule,
    RemoveUndeterminedLanguagesRule2
  );
  return rebulk;
}
const COUNTRY_MAP = {
  "us": "US",
  "usa": "US",
  "united states": "US",
  "gb": "GB",
  "uk": "GB",
  "united kingdom": "GB",
  "ca": "CA",
  "canada": "CA",
  "de": "DE",
  "germany": "DE",
  "fr": "FR",
  "france": "FR",
  "it": "IT",
  "italy": "IT",
  "es": "ES",
  "spain": "ES",
  "nl": "NL",
  "netherlands": "NL",
  "be": "BE",
  "belgium": "BE",
  "ch": "CH",
  "switzerland": "CH",
  "se": "SE",
  "sweden": "SE",
  "no": "NO",
  "norway": "NO",
  "dk": "DK",
  "denmark": "DK",
  "fi": "FI",
  "finland": "FI",
  "pl": "PL",
  "poland": "PL",
  "ru": "RU",
  "russia": "RU",
  "cn": "CN",
  "china": "CN",
  "jp": "JP",
  "japan": "JP",
  "au": "AU",
  "australia": "AU",
  "nz": "NZ",
  "new zealand": "NZ",
  "in": "IN",
  "india": "IN",
  "br": "BR",
  "brazil": "BR",
  "mx": "MX",
  "mexico": "MX",
  "za": "ZA",
  "south africa": "ZA",
  "kr": "KR",
  "south korea": "KR",
  "tw": "TW",
  "taiwan": "TW",
  "hk": "HK",
  "hong kong": "HK"
};
function country(config, commonWords) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, "country") });
  rebulk.defaults({ name: "country" });
  function findCountries(str, context) {
    const allowedCountries = context?.["allowed_countries"];
    return new CountryFinder(allowedCountries, commonWords).find(str);
  }
  rebulk.functional(findCountries, {
    conflictSolver: (match, other2) => other2.name !== "language" || !["US", "GB"].includes(String(match.value)) ? match : other2,
    properties: { country: [null] },
    disabled: (context) => !context?.["allowed_countries"]
  });
  return rebulk;
}
class CountryFinder {
  constructor(allowedCountries, commonWords) {
    this.allowedCountries = new Set(
      allowedCountries?.map((c) => c.toLowerCase()) || []
    );
    this.commonWords = commonWords;
  }
  find(str) {
    const results = [];
    for (const wordMatch of iterWords(str.trim().toLowerCase())) {
      const word = wordMatch.value;
      if (this.commonWords.has(word.toLowerCase())) {
        continue;
      }
      const countryCode = COUNTRY_MAP[word.toLowerCase()];
      if (countryCode) {
        if (this.allowedCountries.has(countryCode.toLowerCase()) || this.allowedCountries.has(word.toLowerCase())) {
          results.push([
            wordMatch.span[0],
            wordMatch.span[1],
            { value: countryCode }
          ]);
        }
      }
    }
    return results;
  }
}
function releaseGroup(config) {
  const forbiddenGroupnames = config["forbidden_names"];
  const groupnameIgnoreSeps = config["ignored_seps"];
  const groupnameSeps = seps.split("").filter((c) => !groupnameIgnoreSeps.includes(c)).join("");
  function cleanGroupname(str) {
    let result = strip(str, groupnameSeps);
    const containsIgnored = groupnameIgnoreSeps.split("").some((c) => result.includes(c));
    const startsWithIgnored = groupnameIgnoreSeps.split("").some((c) => result.startsWith(c));
    const endsWithIgnored = groupnameIgnoreSeps.split("").some((c) => result.endsWith(c));
    if (!(startsWithIgnored && endsWithIgnored) && !containsIgnored) {
      result = strip(result, groupnameIgnoreSeps);
    }
    for (const forbidden of forbiddenGroupnames) {
      if (result.toLowerCase().startsWith(forbidden) && result.length > forbidden.length && seps.includes(result[forbidden.length])) {
        result = strip(result.slice(forbidden.length), groupnameSeps);
      }
      if (result.toLowerCase().endsWith(forbidden) && result.length > forbidden.length && seps.includes(result[result.length - forbidden.length - 1])) {
        result = strip(result.slice(0, result.length - forbidden.length), groupnameSeps);
      }
    }
    result = result.replace(/\s*[)\]]\s*$/, (m) => {
      const closing = m.trim();
      const opening = closing === ")" ? "(" : "[";
      return result.includes(opening) ? m : "";
    }).trim();
    return result.replace(/(.+)\)\s*\[(.+)\]/, "$1 $2").trim();
  }
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, "release_group") });
  const expectedGroup = buildExpectedFunction("expected_group");
  rebulk.functional(expectedGroup, {
    name: "release_group",
    tags: ["expected"],
    validator: sepsSurround,
    conflictSolver: () => null,
    disabled: (context) => !context?.["expected_group"]
  });
  return rebulk.rules(
    new DashSeparatedReleaseGroup(cleanGroupname),
    new SceneReleaseGroup(cleanGroupname),
    AnimeReleaseGroup
  );
}
class DashSeparatedReleaseGroup extends Rule {
  constructor(valueFormatter) {
    super();
    this.consequence = [RemoveMatch, AppendMatch];
    this.valueFormatter = valueFormatter;
  }
  isValid(matches, candidate, start, end, atEnd) {
    if (!atEnd) {
      if (String(candidate.value).length <= 1) {
        return false;
      }
      if (matches.markers.atMatch(candidate, (m) => m.name === "group", 0)) {
        return false;
      }
      const firstHole = matches.holes(
        candidate.end,
        end,
        { predicate: (m) => m.start === candidate.end, index: 0 }
      );
      if (!firstHole) {
        return false;
      }
      const rawValue = firstHole.raw;
      return rawValue[0] === "-" && !rawValue.slice(1).includes("-") && rawValue.includes(".") && !rawValue.includes(" ");
    }
    const group = matches.markers.atMatch(
      candidate,
      (m) => m.name === "group",
      0
    );
    if (group && matches.atMatch(group, (m) => !m.private && m.span !== candidate.span)) {
      return false;
    }
    let count = 0;
    let match = candidate;
    while (match) {
      const current = matches.range(
        start,
        match.start,
        (m) => !m.private && !m.tags.includes("expected"),
        -1
      );
      if (!current) {
        break;
      }
      const inputStr = matches.inputString ?? "";
      let separator = inputStr.slice(current.end, match.start);
      if (!separator && (match.raw ?? "")[0] === "-") {
        separator = "-";
      }
      match = current;
      if (count === 0) {
        if (separator !== "-") {
          break;
        }
        count++;
        continue;
      }
      if (separator === ".") {
        return true;
      }
    }
    return false;
  }
  detect(matches, start, end, atEnd) {
    let candidate = null;
    if (atEnd) {
      const container2 = matches.ending(end, (m) => m.name === "container", 0);
      if (container2) {
        end = container2.start;
      }
      candidate = matches.ending(
        end,
        (m) => !m.private && !(m.name === "other" && m.tags.includes("not-a-release-group")) && !(m.raw ?? "").includes("-") && (m.raw ?? "").trim() === m.raw,
        0
      );
    }
    if (!candidate) {
      const ignoreWeak = (m) => !!(m.tags?.includes("weak-episode") || m.tags?.includes("weak-duplicate"));
      if (atEnd) {
        candidate = matches.holes(
          start,
          end,
          {
            seps,
            index: -1,
            ignore: ignoreWeak,
            predicate: (m) => m.end === end && !!(m.raw ?? "").trim() && (m.raw ?? "")[0] === "-"
          }
        );
      } else {
        candidate = matches.holes(
          start,
          end,
          {
            seps,
            index: 0,
            ignore: ignoreWeak,
            predicate: (m) => m.start === start && !!(m.raw ?? "").trim()
          }
        );
      }
    }
    if (candidate && this.isValid(matches, candidate, start, end, atEnd)) {
      return candidate;
    }
    return null;
  }
  when(matches) {
    if (matches.named("release_group").length > 0) {
      return;
    }
    const toRemove = [];
    const toAppend = [];
    for (const filepart of matches.markers.named("path")) {
      let candidate = this.detect(matches, filepart.start, filepart.end, true);
      if (candidate) {
        toRemove.push(...matches.atMatch(candidate));
      } else {
        candidate = this.detect(matches, filepart.start, filepart.end, false);
      }
      if (candidate) {
        const releasegroup = new Match(candidate.start, candidate.end, {
          name: "release_group",
          inputString: matches.inputString
        });
        releasegroup.formatter = this.valueFormatter;
        if (releasegroup.value) {
          toAppend.push(releasegroup);
        }
        if (toRemove.length || toAppend.length) {
          return [toRemove, toAppend];
        }
      }
    }
  }
}
const _SceneReleaseGroup = class _SceneReleaseGroup extends Rule {
  constructor(valueFormatter) {
    super();
    this.valueFormatter = valueFormatter;
  }
  isPreviousMatch(match) {
    const sceneNames = [
      "video_codec",
      "source",
      "video_api",
      "audio_codec",
      "audio_profile",
      "video_profile",
      "audio_channels",
      "screen_size",
      "other",
      "container",
      "language",
      "subtitle_language",
      "subtitle_language.suffix",
      "subtitle_language.prefix",
      "language.suffix"
    ];
    const scenePrefixTags = ["release-group-prefix"];
    const sceneNoPrefixTags = ["no-release-group-prefix"];
    return sceneNames.includes(match.name ?? "") ? !match.tags.some((t) => sceneNoPrefixTags.includes(t)) : match.tags.some((t) => scenePrefixTags.includes(t));
  }
  when(matches) {
    const ret = [];
    for (const filepart of markerSorted(matches.markers.named("path"), matches)) {
      const { start, end } = filepart;
      if (matches.named(
        "release_group",
        (m) => m.start >= start && m.end <= end
      ).length > 0) {
        continue;
      }
      const titles = matches.named(
        "title",
        (m) => m.start >= start && m.end <= end
      );
      const keepOnlyFirstTitle = (match) => titles.slice(1).includes(match) || match.name === "episode_title" || !!(match.tags?.includes("weak-episode") || match.tags?.includes("weak-duplicate"));
      const lastHole = matches.holes(
        start,
        end + 1,
        {
          formatter: (s) => cleanup(s),
          ignore: keepOnlyFirstTitle,
          predicate: (hole) => Boolean(cleanup(String(hole.value ?? ""))),
          index: -1
        }
      );
      if (lastHole) {
        const previousMatchFilter = (match) => {
          if (match.start < filepart.start) {
            return false;
          }
          return !match.private || this.isPreviousMatch(match);
        };
        const previousMatch = matches.previous(lastHole, previousMatchFilter, 0);
        const inputStr = matches.inputString ?? "";
        const holeValue = String(lastHole.value ?? "");
        if (previousMatch && this.isPreviousMatch(previousMatch) && !inputStr.slice(previousMatch.end, lastHole.start).replace(new RegExp(`[${sepsPattern}]`, "g"), "") && !intCoercable(holeValue.replace(new RegExp(`[${sepsPattern}]`, "g"), ""))) {
          lastHole.name = "release_group";
          lastHole.tags = ["scene"];
          lastHole.formatter = this.valueFormatter;
          const group = matches.markers.atMatch(
            lastHole,
            (m) => m.name === "group",
            0
          );
          if (group) {
            group.formatter = this.valueFormatter;
            if (group.value === lastHole.value) {
              lastHole.start = group.start + 1;
              lastHole.end = group.end - 1;
              lastHole.tags = ["anime"];
            }
          }
          const ignoredMatches = matches.range(
            lastHole.start,
            lastHole.end,
            keepOnlyFirstTitle
          );
          for (const ignoredMatch of ignoredMatches) {
            matches.remove(ignoredMatch);
          }
          ret.push(lastHole);
        }
      }
    }
    return ret;
  }
};
_SceneReleaseGroup.dependency = ["TitleFromPosition"];
_SceneReleaseGroup.consequence = AppendMatch;
_SceneReleaseGroup.properties = { release_group: [null] };
let SceneReleaseGroup = _SceneReleaseGroup;
const _AnimeReleaseGroup = class _AnimeReleaseGroup extends Rule {
  when(matches) {
    const toRemove = [];
    const toAppend = [];
    if (matches.named("release_group").length > 0) {
      return false;
    }
    if (!matches.named("episode").length && !matches.named("season").length && matches.named("release_group").length > 0) {
      return false;
    }
    for (const filepart of markerSorted(matches.markers.named("path"), matches)) {
      const isGroupEmpty = (m) => {
        const innerMatches = matches.range(
          m.start,
          m.end,
          (mm) => !mm.tags.includes("weak-language")
        );
        if (innerMatches.length === 0) return true;
        return innerMatches.every((mm) => mm.name === "other");
      };
      const emptyGroup = matches.markers.range(
        filepart.start,
        filepart.end,
        (m) => m.name === "group" && isGroupEmpty(m) && String(m.value).replace(new RegExp(`[${sepsPattern}]`, "g"), "") && !intCoercable(String(m.value).replace(new RegExp(`[${sepsPattern}]`, "g"), "")),
        0
      );
      if (emptyGroup) {
        const group = new Match(emptyGroup.start + 1, emptyGroup.end - 1, {
          name: "release_group",
          inputString: matches.inputString,
          tags: ["anime"]
        });
        toAppend.push(group);
        toRemove.push(
          ...matches.range(
            emptyGroup.start,
            emptyGroup.end,
            (m) => m.tags.includes("weak-language") || m.name === "other"
          )
        );
      }
    }
    if (toRemove.length || toAppend.length) {
      return [toRemove, toAppend];
    }
    return false;
  }
};
_AnimeReleaseGroup.dependency = ["SceneReleaseGroup", "TitleFromPosition"];
_AnimeReleaseGroup.consequence = [RemoveMatch, AppendMatch];
_AnimeReleaseGroup.properties = { release_group: [null] };
let AnimeReleaseGroup = _AnimeReleaseGroup;
function streamingService(config) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, "streaming_service") });
  rebulk.stringDefaults({ ignoreCase: true }).regexDefaults({ flags: "i", abbreviations: [dash] });
  rebulk.defaults({ name: "streaming_service", tags: ["source-prefix"] });
  loadConfigPatterns(rebulk, config);
  rebulk.rules(ValidateStreamingService);
  return rebulk;
}
const _ValidateStreamingService = class _ValidateStreamingService extends Rule {
  when(matches) {
    const toRemove = [];
    const allServices = matches.named("streaming_service");
    if (process.env.DEBUG_SS) console.log(`[VS.when] allServices count=${allServices.length}`);
    for (const service of allServices) {
      const suffixPred = (m) => !m.private && m.tags?.includes("streaming_service.suffix");
      const prefixPred = (m) => !m.private && m.tags?.includes("streaming_service.prefix");
      const suffixMatches = matches.range(service.end, service.end + 30, suffixPred);
      const suffixArray = Array.isArray(suffixMatches) ? suffixMatches : suffixMatches ? [suffixMatches] : [];
      const nextMatch = suffixArray.length > 0 ? suffixArray.reduce((a, b) => a.start < b.start ? a : b) : void 0;
      const prefixMatches = matches.range(Math.max(0, service.start - 30), service.start, prefixPred);
      const prefixArray = Array.isArray(prefixMatches) ? prefixMatches : prefixMatches ? [prefixMatches] : [];
      const previousMatch = prefixArray.length > 0 ? prefixArray.reduce((a, b) => a.end > b.end ? a : b) : void 0;
      const hasOther = service.initiator && service.initiator.children.named("other").length > 0;
      if (process.env.DEBUG_SS) {
        console.log(`[SS] service=${service.value} [${service.start},${service.end}) nextMatch=${nextMatch?.name}@${nextMatch?.start} prevMatch=${previousMatch?.name} sepsBefore=${sepsBefore(service)} sepsAfter=${sepsAfter(service)}`);
      }
      if (!hasOther) {
        const holesToNext = nextMatch ? matches.holes(service.end, nextMatch.start, { predicate: (m) => Boolean(String(m.value).replace(new RegExp(`[${sepsPattern}]`, "g"), "")) }) : null;
        const holesToPrev = previousMatch ? matches.holes(previousMatch.end, service.start, { predicate: (m) => Boolean(String(m.value).replace(new RegExp(`[${sepsPattern}]`, "g"), "")) }) : null;
        const maxDistance = 20;
        const nextTooFar = nextMatch && nextMatch.start - service.end > maxDistance;
        const prevTooFar = previousMatch && service.start - previousMatch.end > maxDistance;
        const matchesBetweenNext = nextMatch ? matches.range(
          service.end,
          nextMatch.start,
          (m) => m.name !== "streaming_service" && !m.private && m.name !== "other"
        ) : null;
        const matchesBetweenPrev = previousMatch ? matches.range(
          previousMatch.end,
          service.start,
          (m) => m.name !== "streaming_service" && !m.private && m.name !== "other"
        ) : null;
        const nextHasIntervening = matchesBetweenNext && matchesBetweenNext.length > 0;
        const prevHasIntervening = matchesBetweenPrev && matchesBetweenPrev.length > 0;
        if (!nextMatch || nextTooFar || nextHasIntervening || holesToNext !== null && holesToNext.length > 0 || !sepsBefore(service)) {
          if (!previousMatch || prevTooFar || prevHasIntervening || holesToPrev !== null && holesToPrev.length > 0 || !sepsAfter(service)) {
            if (process.env.DEBUG_SS) console.log(`  [VS.when] pushing to toRemove: ${service.value}`);
            toRemove.push(service);
            continue;
          }
        }
      }
      if (service.value === "Comedy Central") {
        toRemove.push(
          ...matches.named("edition", (m) => m.value === "Criterion")
        );
      }
    }
    if (process.env.DEBUG_SS) console.log(`[VS.when] returning toRemove.length=${toRemove.length}`);
    return toRemove;
  }
};
_ValidateStreamingService.priority = 128;
_ValidateStreamingService.consequence = RemoveMatch;
let ValidateStreamingService = _ValidateStreamingService;
function other(config) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, "other") });
  rebulk.regexDefaults({ flags: "i", abbreviations: [dash] }).stringDefaults({ ignoreCase: true });
  rebulk.defaults({ name: "other", validator: sepsSurround });
  loadConfigPatterns(rebulk, config["other"]);
  rebulk.rules(
    RenameAnotherToOther,
    ValidateHasNeighbor,
    ValidateHasNeighborAfter,
    ValidateHasNeighborBefore,
    ValidateScreenerRule,
    ValidateMuxRule,
    ValidateHardcodedSubs,
    ValidateStreamingServiceNeighbor,
    ValidateAtEnd,
    ValidateReal,
    ProperCountRule,
    FixCountRule
  );
  return rebulk;
}
function completeWords(rebulk, seasonWords, completeArticleWords) {
  const seasonWordsPattern = buildOrPattern(seasonWords);
  const completeArticleWordsPattern = buildOrPattern(completeArticleWords);
  function validateComplete(match) {
    const children = match.children;
    if (!children.named("completeWordsBefore") && !children.named("completeWordsAfter")) {
      return false;
    }
    return true;
  }
  rebulk.regex(
    `(?P<completeArticle>${completeArticleWordsPattern}-)?(?P<completeWordsBefore>${seasonWordsPattern}-)?Complete(?P<completeWordsAfter>-${seasonWordsPattern})?`,
    {
      privateNames: ["completeArticle", "completeWordsBefore", "completeWordsAfter"],
      value: { other: "Complete" },
      tags: ["release-group-prefix"],
      validator: {
        __parent__: (m) => sepsSurround(m) && validateComplete(m)
      }
    }
  );
}
const _ProperCountRule = class _ProperCountRule extends Rule {
  when(matches, context) {
    const propers = matches.named("other", (m) => m.value === "Proper");
    if (!propers || propers.length === 0) {
      return;
    }
    const raws = {};
    for (const proper of propers) {
      raws[rawCleanup(proper.raw)] = proper;
    }
    let value = 0;
    let start = null;
    let end = null;
    for (const proper of Object.values(raws)) {
      if (!start || start > proper.start) {
        start = proper.start;
      }
      if (!end || end < proper.end) {
        end = proper.end;
      }
      const properCount = proper.children.named("proper_count", null, 0);
      if (properCount) {
        value += parseInt(String(properCount.value), 10);
      } else if (proper.tags.includes("real")) {
        value += 2;
      } else {
        value += 1;
      }
    }
    const properCountMatch = new Match(start, end, {
      name: "proper_count"
    });
    properCountMatch.value = value;
    return [properCountMatch];
  }
};
_ProperCountRule.priority = POST_PROCESS;
_ProperCountRule.consequence = AppendMatch;
_ProperCountRule.properties = { proper_count: [null] };
let ProperCountRule = _ProperCountRule;
const _FixCountRule = class _FixCountRule extends Rule {
  when(matches) {
    const fixes = matches.named("other", (m2) => m2.value === "Fix").filter((m2) => {
      const raw = rawCleanup(m2.raw).toLowerCase();
      return raw === "fix" || raw === "fixed";
    });
    if (!fixes || fixes.length === 0) return;
    const existing = matches.named("proper_count");
    if (existing && (Array.isArray(existing) ? existing.length > 0 : true)) return;
    let start = null;
    let end = null;
    for (const fix of fixes) {
      if (start === null || fix.start < start) start = fix.start;
      if (end === null || fix.end > end) end = fix.end;
    }
    const m = new Match(start, end, { name: "proper_count" });
    m.value = -1;
    return [m];
  }
};
_FixCountRule.priority = POST_PROCESS;
_FixCountRule.consequence = AppendMatch;
_FixCountRule.properties = { proper_count: [null] };
let FixCountRule = _FixCountRule;
const _RenameAnotherToOther = class _RenameAnotherToOther extends Rule {
  when(matches) {
    return matches.named("another");
  }
};
_RenameAnotherToOther.priority = 32;
_RenameAnotherToOther.consequence = new RenameMatch("other");
let RenameAnotherToOther = _RenameAnotherToOther;
const _ValidateHasNeighbor = class _ValidateHasNeighbor extends Rule {
  when(matches) {
    const ret = [];
    for (const toCheck of matches.range(0, void 0, (m) => m.tags.includes("has-neighbor"))) {
      let previousMatch = matches.previous(toCheck, (m) => true, 0);
      let previousGroup = matches.markers.previous(
        toCheck,
        (m) => m.name === "group",
        0
      );
      if (previousGroup && (!previousMatch || previousGroup.end > previousMatch.end)) {
        previousMatch = previousGroup;
      }
      if (previousMatch && !matches.inputString.slice(previousMatch.end, toCheck.start).replace(new RegExp(`[${sepsPattern}]`, "g"), "")) {
        continue;
      }
      let nextMatch = matches.next(toCheck, (m) => true, 0);
      let nextGroup = matches.markers.next(toCheck, (m) => m.name === "group", 0);
      if (nextGroup && (!nextMatch || nextGroup.start < nextMatch.start)) {
        nextMatch = nextGroup;
      }
      if (nextMatch && !matches.inputString.slice(toCheck.end, nextMatch.start).replace(new RegExp(`[${sepsPattern}]`, "g"), "")) {
        continue;
      }
      ret.push(toCheck);
    }
    return ret;
  }
};
_ValidateHasNeighbor.consequence = RemoveMatch;
_ValidateHasNeighbor.priority = 64;
let ValidateHasNeighbor = _ValidateHasNeighbor;
const _ValidateHasNeighborBefore = class _ValidateHasNeighborBefore extends Rule {
  when(matches) {
    const ret = [];
    for (const toCheck of matches.range(0, void 0, (m) => m.tags.includes("has-neighbor-before"))) {
      let previousMatch = matches.previous(toCheck, (m) => true, 0);
      let previousGroup = matches.markers.previous(
        toCheck,
        (m) => m.name === "group",
        0
      );
      if (previousGroup && (!previousMatch || previousGroup.end > previousMatch.end)) {
        previousMatch = previousGroup;
      }
      if (previousMatch && !matches.inputString.slice(previousMatch.end, toCheck.start).replace(new RegExp(`[${sepsPattern}]`, "g"), "")) {
        continue;
      }
      ret.push(toCheck);
    }
    return ret;
  }
};
_ValidateHasNeighborBefore.consequence = RemoveMatch;
_ValidateHasNeighborBefore.priority = 64;
let ValidateHasNeighborBefore = _ValidateHasNeighborBefore;
const _ValidateHasNeighborAfter = class _ValidateHasNeighborAfter extends Rule {
  when(matches) {
    const ret = [];
    for (const toCheck of matches.range(
      0,
      void 0,
      (m) => m.tags.includes("has-neighbor-after")
    )) {
      let nextMatch = matches.next(toCheck, (m) => true, 0);
      let nextGroup = matches.markers.next(toCheck, (m) => m.name === "group", 0);
      if (nextGroup && (!nextMatch || nextGroup.start < nextMatch.start)) {
        nextMatch = nextGroup;
      }
      if (nextMatch && !matches.inputString.slice(toCheck.end, nextMatch.start).replace(new RegExp(`[${sepsPattern}]`, "g"), "")) {
        continue;
      }
      ret.push(toCheck);
    }
    return ret;
  }
};
_ValidateHasNeighborAfter.consequence = RemoveMatch;
_ValidateHasNeighborAfter.priority = 64;
let ValidateHasNeighborAfter = _ValidateHasNeighborAfter;
const _ValidateScreenerRule = class _ValidateScreenerRule extends Rule {
  when(matches) {
    const ret = [];
    for (const screener of matches.named(
      "other",
      (m) => m.tags.includes("other.validate.screener")
    )) {
      const sourceMatch = matches.previous(
        screener,
        (m) => m.initiator?.name === "source",
        0
      );
      if (!sourceMatch || matches.inputString.slice(sourceMatch.end, screener.start).replace(new RegExp(`[${sepsPattern}]`, "g"), "")) {
        ret.push(screener);
      }
    }
    return ret;
  }
};
_ValidateScreenerRule.consequence = RemoveMatch;
_ValidateScreenerRule.priority = 64;
let ValidateScreenerRule = _ValidateScreenerRule;
const _ValidateMuxRule = class _ValidateMuxRule extends Rule {
  when(matches) {
    const ret = [];
    for (const mux of matches.named(
      "other",
      (m) => m.tags.includes("other.validate.mux")
    )) {
      const sourceMatch = matches.previous(
        mux,
        (m) => m.initiator?.name === "source",
        0
      );
      if (!sourceMatch) {
        ret.push(mux);
      }
    }
    return ret;
  }
};
_ValidateMuxRule.consequence = RemoveMatch;
_ValidateMuxRule.priority = 64;
let ValidateMuxRule = _ValidateMuxRule;
const _ValidateHardcodedSubs = class _ValidateHardcodedSubs extends Rule {
  when(matches) {
    return [];
  }
};
_ValidateHardcodedSubs.priority = 32;
_ValidateHardcodedSubs.consequence = RemoveMatch;
let ValidateHardcodedSubs = _ValidateHardcodedSubs;
const _ValidateStreamingServiceNeighbor = class _ValidateStreamingServiceNeighbor extends Rule {
  when(matches) {
    const toRemove = [];
    for (const match of matches.named(
      "other",
      (m) => m.initiator?.name !== "source" && (m.tags.includes("streaming_service.prefix") || m.tags.includes("streaming_service.suffix"))
    )) {
      let initiatorMatch = match.initiator;
      if (!sepsAfter(initiatorMatch)) {
        if (initiatorMatch.tags.includes("streaming_service.prefix")) {
          const nextMatch = matches.next(
            initiatorMatch,
            (m) => m.name === "streaming_service",
            0
          );
          if (nextMatch && !matches.holes(
            initiatorMatch.end,
            nextMatch.start,
            (m) => String(m.value).replace(new RegExp(`[${sepsPattern}]`, "g"), "")
          ).length) {
            continue;
          }
        }
        if (initiatorMatch.children) {
          toRemove.push(...initiatorMatch.children);
        }
        toRemove.push(initiatorMatch);
      } else if (!sepsBefore(initiatorMatch)) {
        if (initiatorMatch.tags.includes("streaming_service.suffix")) {
          const previousMatch = matches.previous(
            initiatorMatch,
            (m) => m.name === "streaming_service",
            0
          );
          if (previousMatch && !matches.holes(
            previousMatch.end,
            initiatorMatch.start,
            (m) => String(m.value).replace(new RegExp(`[${sepsPattern}]`, "g"), "")
          ).length) {
            continue;
          }
        }
        if (initiatorMatch.children) {
          toRemove.push(...initiatorMatch.children);
        }
        toRemove.push(initiatorMatch);
      }
    }
    return toRemove;
  }
};
_ValidateStreamingServiceNeighbor.priority = 32;
_ValidateStreamingServiceNeighbor.consequence = RemoveMatch;
let ValidateStreamingServiceNeighbor = _ValidateStreamingServiceNeighbor;
const _ValidateAtEnd = class _ValidateAtEnd extends Rule {
  when(matches) {
    const toRemove = [];
    for (const filepart of matches.markers.named("path")) {
      for (const match of matches.range(
        filepart.start,
        filepart.end,
        (m) => m.name === "other" && m.tags.includes("at-end")
      )) {
        if (matches.holes(
          match.end,
          filepart.end,
          (m) => String(m.value).replace(new RegExp(`[${sepsPattern}]`, "g"), "")
        ).length || matches.range(
          match.end,
          filepart.end,
          (m) => !["other", "container"].includes(m.name ?? "")
        ).length) {
          toRemove.push(match);
        }
      }
    }
    return toRemove;
  }
};
_ValidateAtEnd.priority = 32;
_ValidateAtEnd.consequence = RemoveMatch;
let ValidateAtEnd = _ValidateAtEnd;
const _ValidateReal = class _ValidateReal extends Rule {
  when(matches) {
    const ret = [];
    for (const filepart of matches.markers.named("path")) {
      for (const match of matches.range(
        filepart.start,
        filepart.end,
        (m) => m.name === "other" && m.tags.includes("real")
      )) {
        const before = matches.range(filepart.start, match.start);
        if (!before || before.length === 0) {
          ret.push(match);
        }
      }
    }
    return ret;
  }
};
_ValidateReal.consequence = RemoveMatch;
_ValidateReal.priority = 64;
let ValidateReal = _ValidateReal;
function size(config) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, "size") });
  rebulk.regexDefaults({ flags: "i", abbreviations: [dash] });
  rebulk.defaults({ name: "size", validator: sepsSurround });
  rebulk.regex("\\d+-?[mgt]b", "\\d+\\.\\d+-?[mgt]b", {
    formatter: (s) => Size.fromstring(s).toString(),
    tags: ["release-group-prefix"]
  });
  return rebulk;
}
registerFunction(
  "guessit.rules.common.quantity:BitRate.fromstring",
  (s) => BitRate.fromstring(s).toString()
);
function bitRate(config) {
  const rebulk = new Rebulk({
    disabled: (context) => isDisabled(context, "audio_bit_rate") && isDisabled(context, "video_bit_rate")
  });
  rebulk.regexDefaults({ flags: "i", abbreviations: [dash] });
  rebulk.defaults({ name: "audio_bit_rate", validator: sepsSurround });
  loadConfigPatterns(rebulk, config["bit_rate"]);
  rebulk.rules(BitRateTypeRule);
  return rebulk;
}
const _BitRateTypeRule = class _BitRateTypeRule extends Rule {
  when(matches, context) {
    const toRename = [];
    const toRemove = [];
    if (isDisabled(context, "audio_bit_rate")) {
      toRemove.push(...matches.named("audio_bit_rate"));
    } else {
      const videoBitRateDisabled = isDisabled(context, "video_bit_rate");
      for (const match of matches.named("audio_bit_rate")) {
        const previous = matches.previous(
          match,
          (m) => ["source", "screen_size", "video_codec"].includes(m.name ?? ""),
          0
        );
        const inputStr = matches.inputString ?? "";
        const onlySepsBetween = (a, b) => inputStr.slice(a, b).replace(new RegExp(`[${sepsPattern}]`, "g"), "") === "";
        const noHolesBefore = previous ? onlySepsBetween(previous.end, match.start) : false;
        if (previous && noHolesBefore) {
          const bitrate = String(match.value);
          const lc = bitrate.toLowerCase();
          const isKbps = /kbps$|kbits?$/.test(lc);
          const after = matches.next(
            match,
            (m) => m.name === "audio_codec",
            0
          );
          if (after && onlySepsBetween(match.end, after.start)) {
            if (!isKbps) {
              if (videoBitRateDisabled) {
                toRemove.push(match);
              } else {
                toRename.push(match);
              }
            }
            continue;
          }
          if (!isKbps) {
            if (videoBitRateDisabled) {
              toRemove.push(match);
            } else {
              toRename.push(match);
            }
          }
        }
      }
    }
    if (toRename.length || toRemove.length) {
      return [toRename, toRemove];
    }
    return false;
  }
};
_BitRateTypeRule.consequence = [new RenameMatch("video_bit_rate"), RemoveMatch];
let BitRateTypeRule = _BitRateTypeRule;
function edition(config) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, "edition") });
  rebulk.regexDefaults({ flags: "i", abbreviations: [dash] }).stringDefaults({ ignoreCase: true });
  rebulk.defaults({ name: "edition", validator: sepsSurround });
  loadConfigPatterns(rebulk, config["edition"]);
  return rebulk;
}
function cd(config) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, "cd") });
  rebulk.regexDefaults({ flags: "i", abbreviations: [dash] });
  loadConfigPatterns(rebulk, config);
  return rebulk;
}
function bonus(config) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, "bonus") });
  rebulk.regexDefaults({ name: "bonus", flags: "i" });
  loadConfigPatterns(rebulk, config["bonus"]);
  rebulk.rules(BonusToEpisodeRule, BonusTitleRule);
  return rebulk;
}
const _BonusToEpisodeRule = class _BonusToEpisodeRule extends Rule {
  when(matches) {
    const bonuses = matches.named("bonus")?.filter((m) => !m.private) ?? [];
    const toConvert = [];
    for (const bonus2 of bonuses) {
      const filepart = matches.markers.atMatch(bonus2, (m) => m.name === "path", 0);
      if (!filepart) continue;
      const hasSeason = !!matches.range(
        filepart.start,
        filepart.end,
        (m) => m.name === "season" && !m.private,
        0
      );
      const hasEpisode = !!matches.range(
        filepart.start,
        filepart.end,
        (m) => m.name === "episode" && !m.private,
        0
      );
      if (hasSeason && !hasEpisode) {
        toConvert.push(bonus2);
      }
    }
    return toConvert;
  }
  then(matches, whenResponse) {
    const toConvert = whenResponse;
    for (const bonus2 of toConvert) {
      matches.remove(bonus2);
      bonus2.name = "episode";
      matches.append(bonus2);
    }
  }
};
_BonusToEpisodeRule.priority = 64;
let BonusToEpisodeRule = _BonusToEpisodeRule;
const BOUNDARY_NAMES = /* @__PURE__ */ new Set([
  "source",
  "video_codec",
  "audio_codec",
  "screen_size",
  "container",
  "release_group",
  "language",
  "country",
  "other",
  "streaming_service",
  "edition",
  "audio_channels",
  "season",
  "date"
]);
const _BonusTitleRule = class _BonusTitleRule extends Rule {
  when(matches) {
    const bonusNumber = matches.named(
      "bonus",
      (m) => !m.private,
      0
    );
    if (!bonusNumber) return;
    const filepath = matches.markers.atMatch(
      bonusNumber,
      (m) => m.name === "path",
      0
    );
    if (!filepath) return;
    const titleAfterBonus = matches.range(
      bonusNumber.end,
      filepath.end + 1,
      (m) => (m.name === "title" || m.name === "alternative_title" || m.name === "episode_title") && !m.private,
      0
    );
    if (titleAfterBonus && titleAfterBonus.value) {
      const inputString2 = matches.inputString || "";
      const containerMatch2 = matches.range(
        bonusNumber.end,
        filepath.end + 1,
        (m) => m.name === "container" && !m.private,
        0
      );
      const maxEnd2 = containerMatch2 ? containerMatch2.start : filepath.end;
      let btStart = bonusNumber.end;
      while (btStart < titleAfterBonus.start && /[\s._\-]/.test(inputString2[btStart])) btStart++;
      let btEnd = titleAfterBonus.end;
      const yearAfterTitle = matches.range(
        titleAfterBonus.end,
        maxEnd2,
        (m) => !m.private && m.name === "year",
        0
      );
      if (yearAfterTitle) {
        const gapBefore = inputString2.slice(titleAfterBonus.end, yearAfterTitle.start);
        const gapAfter = inputString2.slice(yearAfterTitle.end, maxEnd2);
        const onlySesBefore = [...gapBefore].every((c) => /[\s._\-]/.test(c));
        const onlySepsAfter = [...gapAfter].every((c) => /[\s._\-]/.test(c));
        if (onlySesBefore && onlySepsAfter) {
          btEnd = yearAfterTitle.end;
        }
      }
      const rawText2 = inputString2.slice(btStart, btEnd);
      const bonusTitleValue2 = cleanup(rawText2);
      const toRemove2 = [titleAfterBonus];
      const allMatchesInRange = matches.range(
        btStart,
        btEnd,
        (m) => !m.private && m.name !== "bonus" && m.name !== "container"
      ) || [];
      for (const m of allMatchesInRange) {
        if (!toRemove2.includes(m)) toRemove2.push(m);
      }
      const bonusTitle2 = new Match(btStart, btEnd, {
        name: "bonus_title",
        value: bonusTitleValue2 || cleanup(String(titleAfterBonus.value)),
        inputString: inputString2
      });
      return { toRemove: toRemove2, toAppend: [bonusTitle2] };
    }
    const inputString = matches.inputString || "";
    const containerMatch = matches.range(
      bonusNumber.end,
      filepath.end + 1,
      (m) => m.name === "container" && !m.private,
      0
    );
    const maxEnd = containerMatch ? containerMatch.start : filepath.end;
    const boundaryMatches = matches.range(
      bonusNumber.end,
      maxEnd,
      (m) => !m.private && BOUNDARY_NAMES.has(m.name ?? "")
    ) || [];
    boundaryMatches.sort((a, b) => a.start - b.start);
    let endPos = maxEnd;
    if (boundaryMatches.length > 0) {
      endPos = boundaryMatches[0].start;
    }
    let start = bonusNumber.end;
    while (start < endPos && /[\s._\-]/.test(inputString[start])) start++;
    let end = endPos;
    while (end > start && /[\s._\-]/.test(inputString[end - 1])) end--;
    if (start >= end) return;
    const rawText = inputString.slice(start, end);
    const bonusTitleValue = cleanup(rawText);
    if (!bonusTitleValue) return;
    const toRemove = [];
    const matchesInRange = matches.range(
      start,
      end,
      (m) => !m.private && m.name !== "bonus" && m.name !== "container"
    ) || [];
    for (const m of matchesInRange) {
      toRemove.push(m);
    }
    const bonusTitle = new Match(start, end, {
      name: "bonus_title",
      value: bonusTitleValue,
      inputString
    });
    return { toRemove, toAppend: [bonusTitle] };
  }
  then(matches, whenResponse) {
    if (!whenResponse) return;
    if (whenResponse instanceof Match) {
      matches.append(whenResponse);
      return;
    }
    const { toRemove, toAppend } = whenResponse;
    for (const m of toRemove) {
      matches.remove(m);
    }
    for (const m of toAppend) {
      matches.append(m);
    }
  }
};
_BonusTitleRule.dependency = ["TitleFromPosition"];
_BonusTitleRule.properties = { bonus_title: [null] };
let BonusTitleRule = _BonusTitleRule;
function film(config) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, "film") });
  rebulk.regexDefaults({ flags: "i", abbreviations: [dash] }).stringDefaults({ ignoreCase: true });
  rebulk.defaults({ name: "film", validator: sepsSurround });
  loadConfigPatterns(rebulk, config["film"]);
  rebulk.rules(FilmTitleRule);
  return rebulk;
}
const _FilmTitleRule = class _FilmTitleRule extends Rule {
  enabled(context) {
    return !isDisabled(context, "film_title");
  }
  when(matches) {
    const bonusNumber = matches.named(
      "film",
      (m) => !m.private,
      0
    );
    if (bonusNumber) {
      const filepath = matches.markers.atMatch(
        bonusNumber,
        (m) => m.name === "path",
        0
      );
      if (!filepath) return;
      const hole = matches.holes(
        filepath.start,
        bonusNumber.start + 1,
        {
          formatter: cleanup,
          predicate: (h) => !!h.value,
          index: 0
        }
      );
      if (hole && hole.value) {
        hole.name = "film_title";
        return hole;
      }
    }
  }
};
_FilmTitleRule.consequence = AppendMatch;
_FilmTitleRule.properties = { film_title: [null] };
let FilmTitleRule = _FilmTitleRule;
function part(config) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, "part") });
  rebulk.regexDefaults({
    flags: "i",
    abbreviations: [dash],
    validator: { __parent__: sepsSurround }
  });
  const prefixes = config["prefixes"];
  const wordNumerals = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
    "thirteen",
    "fourteen",
    "fifteen",
    "sixteen",
    "seventeen",
    "eighteen",
    "nineteen",
    "twenty"
  ];
  const numeral = `(?:\\d+|[ivxlcdm]+|${wordNumerals.join("|")})`;
  function validateRoman2(match) {
    if (intCoercable(match.raw)) {
      return true;
    }
    return sepsSurround(match);
  }
  rebulk.regex(
    `${buildOrPattern(prefixes)}-?(?P<part>${numeral})`,
    {
      prefixes,
      validateAll: true,
      privateParent: true,
      children: true,
      formatter: parseNumber,
      validator: {
        part: and_(
          validateRoman2,
          (m) => 0 < m.value && m.value < 100
        )
      }
    }
  );
  return rebulk;
}
const DIGIT = 0;
const LETTER = 1;
const OTHER = 2;
const IDNUM_SOURCE = "[a-zA-Z0-9-]{20,}";
function guessIdnumber(str) {
  const ret = [];
  const regex = new RegExp(IDNUM_SOURCE, "g");
  let match;
  while ((match = regex.exec(str)) !== null) {
    const uuid = match[0];
    let switchCount = 0;
    let switchLetterCount = 0;
    let letterCount = 0;
    let lastLetter = null;
    let last = LETTER;
    for (const c of uuid) {
      let ci;
      if ("0123456789".includes(c)) {
        ci = DIGIT;
      } else if (/[a-zA-Z]/.test(c)) {
        ci = LETTER;
        if (c !== lastLetter) switchLetterCount++;
        lastLetter = c;
        letterCount++;
      } else {
        ci = OTHER;
      }
      if (ci !== last) switchCount++;
      last = ci;
    }
    const switchRatio = switchCount / uuid.length;
    const lettersRatio = letterCount > 0 ? switchLetterCount / letterCount : 1;
    if (switchRatio > 0.4 && lettersRatio > 0.4) {
      if (/^[sS]\d+[eE]\d+/i.test(uuid)) continue;
      ret.push([match.index, match.index + uuid.length]);
    }
  }
  return ret;
}
function crc(_config) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, "crc32") });
  rebulk.regexDefaults({ flags: "i" });
  rebulk.defaults({ validator: sepsSurround });
  rebulk.regex("(?:[a-fA-F]|[0-9]){8}", {
    name: "crc32",
    conflictSolver: (_match, other2) => ["episode", "season"].includes(other2.name ?? "") ? other2 : "__default__"
  });
  rebulk.regex("[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}", {
    name: "uuid",
    validator: null,
    conflictSolver: (_match, other2) => ["episode", "season", "crc32"].includes(other2.name ?? "") ? other2 : "__default__"
  });
  rebulk.functional(guessIdnumber, {
    name: "uuid",
    conflictSolver: (_match, other2) => ["episode", "season", "crc32"].includes(other2.name ?? "") ? other2 : "__default__"
  });
  return rebulk;
}
const MIMETYPE_MAP = {
  "mkv": "video/x-matroska",
  "mp4": "video/mp4",
  "avi": "video/x-msvideo",
  "mov": "video/quicktime",
  "flv": "video/x-flv",
  "wmv": "video/x-ms-wmv",
  "webm": "video/webm",
  "mp3": "audio/mpeg",
  "flac": "audio/flac",
  "aac": "audio/aac",
  "ogg": "audio/ogg",
  "wma": "audio/x-ms-wma",
  "jpg": "image/jpeg",
  "jpeg": "image/jpeg",
  "png": "image/png",
  "gif": "image/gif",
  "zip": "application/zip",
  "rar": "application/x-rar-compressed",
  "pdf": "application/pdf"
};
function mimetype(_config) {
  const rebulk = new Rebulk({ disabled: (context) => isDisabled(context, "mimetype") });
  rebulk.rules(Mimetype);
  return rebulk;
}
const _Mimetype = class _Mimetype extends Rule {
  when(matches, _context) {
    const input = matches.inputString ?? "";
    const ext = input.split(".").pop()?.toLowerCase() || "";
    return MIMETYPE_MAP[ext] || null;
  }
  then(matches, whenResponse, _context) {
    if (whenResponse && typeof whenResponse === "string") {
      const len = matches.inputString?.length ?? 0;
      const match = new Match(len, len, {
        name: "mimetype",
        value: whenResponse,
        inputString: matches.inputString
      });
      matches.append(match);
    }
  }
};
_Mimetype.priority = POST_PROCESS;
_Mimetype.dependency = ["Processors"];
_Mimetype.properties = { mimetype: [null] };
let Mimetype = _Mimetype;
function addType(matches, value) {
  matches.append(
    new Match(matches.inputString?.length ?? 0, matches.inputString?.length ?? 0, {
      name: "type",
      value
    })
  );
}
const _TypeProcessor = class _TypeProcessor extends Rule {
  constructor() {
    super(...arguments);
    this.priority = POST_PROCESS;
    this.consequence = AppendMatch;
  }
  when(matches, context) {
    const optionType = context?.["type"];
    if (optionType) return optionType;
    const episode = matches.named("episode");
    const season = matches.named("season");
    const absoluteEpisode = matches.named("absolute_episode");
    const episodeDetails = matches.named("episode_details");
    const year = matches.named("year");
    const episodeArr = Array.isArray(episode) ? episode : episode ? [episode] : [];
    const seasonArr = Array.isArray(season) ? season : season ? [season] : [];
    const hasYear = !!(year && (Array.isArray(year) ? year.length > 0 : true));
    const hasAbsoluteEpisode = !!(absoluteEpisode && (Array.isArray(absoluteEpisode) ? absoluteEpisode.length > 0 : true));
    const hasEpisodeDetails = !!(episodeDetails && (Array.isArray(episodeDetails) ? episodeDetails.length > 0 : true));
    if (episodeArr.length > 0 || seasonArr.length > 0 || hasEpisodeDetails || hasAbsoluteEpisode) {
      episodeArr.length > 0 && episodeArr.every((m) => m.tags.includes("weak-episode") || m.tags.includes("weak-duplicate"));
      const yearArr2 = Array.isArray(year) ? year : year ? [year] : [];
      const firstYearStart = yearArr2.length > 0 ? yearArr2[0].start : Infinity;
      const allSeasonsWeak = seasonArr.every(
        (m) => (m.tags.includes("weak-duplicate") || m.tags.includes("weak-episode")) && m.start < firstYearStart
      );
      (seasonArr.length === 0 || allSeasonsWeak) && !hasAbsoluteEpisode && !hasEpisodeDetails;
      let hasEpisodeRange = false;
      const weakEpisodes = episodeArr.filter((m) => m.tags.includes("weak-episode") || m.tags.includes("weak-duplicate"));
      if (weakEpisodes.length >= 3) {
        hasEpisodeRange = true;
      } else if (weakEpisodes.length === 2) {
        const sorted = [...weakEpisodes].sort((a, b) => a.start - b.start);
        const between = (matches.inputString ?? "").slice(sorted[0].end, sorted[1].start);
        const betweenClean = between.replace(/[\s._]/g, "");
        if (betweenClean === "-" || betweenClean === "~" || betweenClean.toLowerCase() === "to") {
          hasEpisodeRange = true;
        }
      }
      const allEpisodesWeakNoRange = episodeArr.length > 0 && !hasEpisodeRange && episodeArr.every((m) => m.tags.includes("weak-episode") || m.tags.includes("weak-duplicate"));
      const allSeasonsWeakExtended = seasonArr.every((m) => {
        if (!(m.tags.includes("weak-duplicate") || m.tags.includes("weak-episode"))) return false;
        if (m.start < firstYearStart) return true;
        const inputStr = matches.inputString ?? "";
        const initiator = m.initiator;
        if (initiator) {
          const iStart = initiator.start ?? m.start;
          const iEnd = initiator.end ?? m.end;
          const charBefore = iStart > 0 ? inputStr[iStart - 1] : "";
          const charAfter = iEnd < inputStr.length ? inputStr[iEnd] : "";
          if (charBefore && /[a-zA-Z]/.test(charBefore)) return true;
          if (charAfter && /[a-zA-Z]/.test(charAfter)) return true;
        }
        return false;
      });
      const noStrongIndicatorsExtended = (seasonArr.length === 0 || allSeasonsWeakExtended) && !hasAbsoluteEpisode && !hasEpisodeDetails;
      const releaseGroup2 = matches.named("release_group");
      const rgArr = Array.isArray(releaseGroup2) ? releaseGroup2 : releaseGroup2 ? [releaseGroup2] : [];
      const inputStr2 = matches.inputString ?? "";
      const hasAnimeStyleRG = rgArr.some((rg) => {
        const charBefore = rg.start > 0 ? inputStr2[rg.start - 1] : "";
        return charBefore === "[";
      });
      if (allEpisodesWeakNoRange && noStrongIndicatorsExtended && hasYear && !hasAnimeStyleRG) {
        return { type: "movie", removeWeak: true };
      } else if (episodeArr.length === 0 && seasonArr.length === 0 && !hasAbsoluteEpisode && hasEpisodeDetails && hasYear) {
        const epDetailsArr = Array.isArray(episodeDetails) ? episodeDetails : episodeDetails ? [episodeDetails] : [];
        const yearArr = Array.isArray(year) ? year : year ? [year] : [];
        const yearStart = yearArr.length > 0 ? yearArr[0].start : Infinity;
        const epDetailsAfterYear = epDetailsArr.some((m) => m.start > yearStart);
        if (epDetailsAfterYear) {
          return "episode";
        }
      } else {
        return "episode";
      }
    }
    const film2 = matches.named("film");
    if (film2 && (Array.isArray(film2) ? film2.length > 0 : true)) {
      return "movie";
    }
    const date2 = matches.named("date");
    if (date2 && (Array.isArray(date2) ? date2.length > 0 : true)) {
      if (!year || (Array.isArray(year) ? year.length === 0 : false)) {
        return "episode";
      }
    }
    const bonus2 = matches.named("bonus");
    if (bonus2 && (Array.isArray(bonus2) ? bonus2.length > 0 : true)) {
      if (!year || (Array.isArray(year) ? year.length === 0 : false)) {
        return "episode";
      }
    }
    const crc32 = matches.named("crc32");
    const animeReleaseGroup = matches.named(
      "release_group",
      (m) => m.tags.includes("anime")
    );
    if (crc32 && (Array.isArray(crc32) ? crc32.length > 0 : true) && animeReleaseGroup && (Array.isArray(animeReleaseGroup) ? animeReleaseGroup.length > 0 : true)) {
      return "episode";
    }
    return "movie";
  }
  then(matches, whenResponse, _context) {
    if (!whenResponse) return;
    let typeValue;
    let removeWeak = false;
    if (typeof whenResponse === "string") {
      typeValue = whenResponse;
    } else if (typeof whenResponse === "object" && whenResponse !== null && "type" in whenResponse) {
      const resp = whenResponse;
      typeValue = resp.type;
      removeWeak = !!resp.removeWeak;
    } else {
      return;
    }
    if (removeWeak) {
      const toRemove = [];
      for (const name of ["episode", "season"]) {
        const arr = matches.named(name);
        const items = Array.isArray(arr) ? arr : arr ? [arr] : [];
        for (const m of items) {
          if (m.tags.includes("weak-episode") || m.tags.includes("weak-duplicate")) {
            toRemove.push(m);
          }
        }
      }
      for (const m of toRemove) {
        matches.remove(m);
      }
    }
    addType(matches, typeValue);
  }
};
_TypeProcessor.priority = POST_PROCESS;
_TypeProcessor.dependency = void 0;
_TypeProcessor.properties = { type: ["episode", "movie"] };
let TypeProcessor = _TypeProcessor;
function type_(config) {
  const rebulk = new Rebulk({
    disabled: (context) => isDisabled(context, "type")
  });
  rebulk.rules(TypeProcessor);
  return rebulk;
}
const LANG_KEYS = /* @__PURE__ */ new Set(["language", "subtitle_language"]);
function isUndeterminedLang(match) {
  if (!LANG_KEYS.has(match.name ?? "")) return false;
  const v = match.value;
  if (v === "und") return true;
  if (v && typeof v === "object" && "alpha3" in v) {
    return v.alpha3 === "und";
  }
  return false;
}
const _EnlargeGroupMatches = class _EnlargeGroupMatches extends CustomRule {
  when(matches, _context) {
    const starting = [];
    const ending = [];
    for (const group of matches.markers.named("group")) {
      for (const match of matches.starting(group.start + 1)) {
        starting.push(match);
      }
      for (const match of matches.ending(group.end - 1)) {
        ending.push(match);
      }
    }
    if (starting.length > 0 || ending.length > 0) return [starting, ending];
    return false;
  }
  then(matches, whenResponse, _context) {
    const [starting, ending] = whenResponse;
    for (const match of starting) {
      matches.remove(match);
      match.start -= 1;
      match.rawStart += 1;
      matches.append(match);
    }
    for (const match of ending) {
      matches.remove(match);
      match.end += 1;
      match.rawEnd -= 1;
      matches.append(match);
    }
  }
};
_EnlargeGroupMatches.priority = PRE_PROCESS;
let EnlargeGroupMatches = _EnlargeGroupMatches;
function preferredString(value1, value2) {
  if (value1 === value2) return value1;
  if (isTitleCase(value1) && !isTitleCase(value2)) return value1;
  if (!value1.toUpperCase().startsWith(value1) && value2 === value2.toUpperCase()) return value1;
  if (!value1.toUpperCase().startsWith(value1) && value1[0] === value1[0].toUpperCase() && value2[0] !== value2[0].toUpperCase()) return value1;
  if (countTitleWords(value1) > countTitleWords(value2)) return value1;
  return value2;
}
function isTitleCase(s) {
  return s.split(" ").every((w) => w.length === 0 || w[0] === w[0].toUpperCase());
}
function countTitleWords(value) {
  let ret = 0;
  for (const word of iterWords(value)) {
    if (word.value[0] === word.value[0].toUpperCase() && word.value[0] !== word.value[0].toLowerCase()) ret++;
  }
  return ret;
}
const _EquivalentHoles = class _EquivalentHoles extends Rule {
  when(matches, _context) {
    const newMatches = [];
    for (const filepath of markerSorted(matches.markers.named("path"), matches)) {
      const holes = matches.holes(filepath.start, filepath.end, { formatter: cleanup });
      for (const name of matches.names) {
        const holesLeft = [...holes];
        for (const hole of [...holesLeft]) {
          for (const currentMatch of matches.named(name)) {
            if (typeof currentMatch.value === "string" && hole.value && typeof hole.value === "string" && hole.value.toLowerCase() === currentMatch.value.toLowerCase()) {
              if (currentMatch.tags.includes("equivalent-ignore")) continue;
              const newValue = preferredString(hole.value, currentMatch.value);
              if (hole.value !== newValue) hole.value = newValue;
              if (currentMatch.value !== newValue) currentMatch.value = newValue;
              hole.name = name;
              hole.tags = ["equivalent"];
              newMatches.push(hole);
              const idx = holesLeft.indexOf(hole);
              if (idx > -1) holesLeft.splice(idx, 1);
            }
          }
        }
      }
    }
    return newMatches;
  }
};
_EquivalentHoles.priority = POST_PROCESS;
_EquivalentHoles.consequence = AppendMatch;
let EquivalentHoles = _EquivalentHoles;
const _RemoveAmbiguous = class _RemoveAmbiguous extends Rule {
  constructor(sortFn, predicate) {
    super();
    this.sortFunction = sortFn ?? markerSorted;
    this.predicate = predicate ?? null;
  }
  when(matches, _context) {
    const fileparts = this.sortFunction(matches.markers.named("path"), matches);
    const previousFilepartsNames = /* @__PURE__ */ new Set();
    const values = /* @__PURE__ */ new Map();
    const toRemove = [];
    for (const filepart of fileparts) {
      const filepartMatches = this.predicate ? matches.range(filepart.start, filepart.end, this.predicate) : matches.range(filepart.start, filepart.end);
      const filepartNames = /* @__PURE__ */ new Set();
      for (const match of filepartMatches) {
        const matchName = match.name ?? "";
        filepartNames.add(matchName);
        if (previousFilepartsNames.has(matchName)) {
          const vals = values.get(matchName) ?? [];
          if (!vals.includes(match.value)) {
            if (matchName === "episode_title") {
              const hasSxxExx = matches.range(
                filepart.start,
                filepart.end,
                (m) => !m.private && (m.tags?.includes("SxxExx") ?? false),
                0
              );
              if (hasSxxExx) {
                const oldEpTitles = matches.named(matchName).filter(
                  (m) => m.start < filepart.start || m.end > filepart.end
                );
                toRemove.push(...oldEpTitles);
                vals.length = 0;
                vals.push(match.value);
                values.set(matchName, vals);
                continue;
              }
            }
            if (!isUndeterminedLang(match) && LANG_KEYS.has(matchName)) {
              const allUnd = vals.every(
                (v) => v === "und" || v && typeof v === "object" && "alpha3" in v && v.alpha3 === "und"
              );
              if (allUnd) {
                const undMatches = toRemove.length > 0 ? [] : matches.named(matchName).filter((m) => isUndeterminedLang(m));
                toRemove.push(...undMatches);
                vals.length = 0;
                vals.push(match.value);
                values.set(matchName, vals);
                continue;
              }
            }
            toRemove.push(match);
          }
        } else {
          const vals = values.get(matchName) ?? [];
          if (!vals.includes(match.value)) {
            vals.push(match.value);
            values.set(matchName, vals);
          }
        }
      }
      for (const n of filepartNames) previousFilepartsNames.add(n);
    }
    return toRemove;
  }
};
_RemoveAmbiguous.priority = POST_PROCESS;
_RemoveAmbiguous.consequence = RemoveMatch;
let RemoveAmbiguous = _RemoveAmbiguous;
class RemoveLessSpecificSeasonEpisode extends RemoveAmbiguous {
  constructor(name) {
    super(
      (markers, matches) => markerSorted(
        [...[...markers].reverse()],
        matches,
        (m) => m.name === name && m.tags.includes("SxxExx")
      ),
      (m) => m.name === name
    );
  }
}
const _SeasonYear = class _SeasonYear extends Rule {
  when(matches, _context) {
    const ret = [];
    if (matches.named("year").length === 0) {
      for (const season of matches.named("season")) {
        if (typeof season.value === "number" && validYear(season.value)) {
          const year = season.clone();
          year.name = "year";
          ret.push(year);
        }
      }
    }
    return ret;
  }
};
_SeasonYear.priority = POST_PROCESS;
_SeasonYear.consequence = AppendMatch;
let SeasonYear = _SeasonYear;
const _YearSeason = class _YearSeason extends Rule {
  when(matches, _context) {
    const ret = [];
    const strongEpisodes = matches.named("episode").filter(
      (m) => !m.tags.includes("weak-episode") && !m.tags.includes("weak-duplicate")
    );
    if (matches.named("season").length === 0 && strongEpisodes.length > 0) {
      for (const year of matches.named("year")) {
        const season = year.clone();
        season.name = "season";
        ret.push(season);
      }
    }
    return ret;
  }
};
_YearSeason.priority = POST_PROCESS;
_YearSeason.consequence = AppendMatch;
let YearSeason = _YearSeason;
const _Processors = class _Processors extends Rule {
  when(_matches, _context) {
    return false;
  }
};
_Processors.priority = POST_PROCESS;
let Processors = _Processors;
const _StripSeparators = class _StripSeparators extends CustomRule {
  when(matches, _context) {
    return matches;
  }
  then(matches, _whenResponse, _context) {
    for (const match of matches) {
      const span = match.span;
      for (let i = 0; i < span[1] - span[0]; i++) {
        const raw = match.raw;
        if (raw && sepsNoGroups.includes(raw[0]) && (raw.length < 3 || !sepsNoGroups.includes(raw[2]))) {
          match.rawStart = match.rawStart + 1;
        } else break;
      }
      for (let i = span[1] - span[0] - 1; i >= 0; i--) {
        const raw = match.raw;
        if (raw && sepsNoGroups.includes(raw[raw.length - 1]) && (raw.length < 3 || !sepsNoGroups.includes(raw[raw.length - 3]))) {
          match.rawEnd = match.rawEnd - 1;
        } else break;
      }
    }
  }
};
_StripSeparators.priority = POST_PROCESS;
let StripSeparators = _StripSeparators;
const _RemoveInvalidMatches = class _RemoveInvalidMatches extends CustomRule {
  when(matches) {
    const toRemove = [];
    for (const match of matches) {
      if (match.value === null || match.value === void 0 || typeof match.value === "number" && isNaN(match.value) || match.value === "") {
        toRemove.push(match);
      }
    }
    return toRemove;
  }
  then(matches, whenResponse) {
    const toRemove = whenResponse;
    for (const m of toRemove) {
      matches.remove(m);
    }
  }
};
_RemoveInvalidMatches.priority = POST_PROCESS;
let RemoveInvalidMatches = _RemoveInvalidMatches;
function processors(_config) {
  return new Rebulk().rules(
    EnlargeGroupMatches,
    EquivalentHoles,
    new RemoveLessSpecificSeasonEpisode("season"),
    new RemoveLessSpecificSeasonEpisode("episode"),
    RemoveAmbiguous,
    SeasonYear,
    YearSeason,
    Processors,
    StripSeparators,
    RemoveInvalidMatches
  );
}
function rebulkBuilder(config) {
  function cfg(name) {
    return config[name] ?? {};
  }
  const rebulk = new Rebulk();
  const commonWords = new Set(config["common_words"] ?? []);
  rebulk.rebulk(path(cfg("path")));
  rebulk.rebulk(groups(cfg("groups") ?? { starting: "([{", ending: ")]}" }));
  rebulk.rebulk(episodes(cfg("episodes")));
  rebulk.rebulk(container(cfg("container")));
  rebulk.rebulk(source(cfg("source")));
  rebulk.rebulk(videoCodec(cfg("video_codec")));
  rebulk.rebulk(audioCodec(cfg("audio_codec")));
  rebulk.rebulk(screenSize(cfg("screen_size")));
  rebulk.rebulk(website(cfg("website")));
  rebulk.rebulk(date(cfg("date")));
  rebulk.rebulk(title(cfg("title")));
  rebulk.rebulk(episodeTitle(cfg("episode_title")));
  rebulk.rebulk(language(cfg("language"), commonWords));
  rebulk.rebulk(country(cfg("country"), commonWords));
  rebulk.rebulk(releaseGroup(cfg("release_group")));
  rebulk.rebulk(streamingService(cfg("streaming_service")));
  const otherRebulk = other(cfg("other"));
  cfg("episodes");
  const completeSeasonWords = ["seasons?", "series?"];
  const completeArticleWords = ["The"];
  completeWords(otherRebulk, completeSeasonWords, completeArticleWords);
  rebulk.rebulk(otherRebulk);
  rebulk.rebulk(size(cfg("size")));
  rebulk.rebulk(bitRate(cfg("bit_rate")));
  rebulk.rebulk(edition(cfg("edition")));
  rebulk.rebulk(cd(cfg("cd")));
  rebulk.rebulk(bonus(cfg("bonus")));
  rebulk.rebulk(film(cfg("film")));
  rebulk.rebulk(part(cfg("part")));
  rebulk.rebulk(crc(cfg("crc")));
  rebulk.rebulk(processors(cfg("processors")));
  rebulk.rebulk(mimetype(cfg("mimetype")));
  rebulk.rebulk(type_(cfg("type")));
  rebulk.customizeProperties = function customizeProperties(properties2) {
    const count = properties2["count"];
    delete properties2["count"];
    properties2["season_count"] = count;
    properties2["episode_count"] = count;
    return properties2;
  };
  return rebulk;
}
const expected_title = [
  "OSS 117",
  "This is Us"
];
const allowed_countries = [
  "au",
  "gb",
  "us"
];
const allowed_languages = [
  "ca",
  "cs",
  "de",
  "en",
  "es",
  "fr",
  "he",
  "hi",
  "hu",
  "it",
  "ja",
  "ko",
  "mul",
  "nl",
  "no",
  "pl",
  "pt",
  "ro",
  "ru",
  "sv",
  "te",
  "uk",
  "und"
];
const advanced_config = {
  common_words: [
    "ca",
    "cat",
    "de",
    "he",
    "it",
    "no",
    "por",
    "rum",
    "se",
    "st",
    "sub"
  ],
  groups: {
    starting: "([{",
    ending: ")]}"
  },
  audio_codec: {
    audio_codec: {
      MP3: {
        string: [
          "MP3",
          "LAME"
        ],
        regex: [
          "LAME(?:\\d)+-?(?:\\d)+"
        ]
      },
      MP2: "MP2",
      "Dolby Digital": {
        string: [
          "Dolby",
          "DolbyDigital"
        ],
        regex: [
          "Dolby-Digital",
          "DD",
          "AC-?3D?"
        ]
      },
      "Dolby Atmos": {
        string: [
          "Atmos"
        ],
        regex: [
          "Dolby-?Atmos"
        ]
      },
      AAC: "AAC",
      "Dolby Digital Plus": {
        string: [
          "DDP",
          "DD+"
        ],
        regex: [
          "E-?AC-?3"
        ]
      },
      FLAC: "Flac",
      DTS: "DTS",
      "DTS-HD": {
        regex: [
          "DTS-?HD",
          "DTS(?=-?MA)",
          "DTS-?MA"
        ],
        conflict_solver: "lambda match, other: other if other.name == 'audio_codec' else '__default__'"
      },
      "DTS:X": {
        string: [
          "DTS:X",
          "DTS-X",
          "DTSX"
        ]
      },
      "Dolby TrueHD": {
        regex: [
          "True-?HD"
        ]
      },
      Opus: "Opus",
      Vorbis: "Vorbis",
      PCM: "PCM",
      LPCM: "LPCM"
    },
    audio_channels: {
      "1.0": [
        "1ch",
        "mono",
        "re:(1[\\W_]0(?:ch)?)(?=[^\\d]|$)"
      ],
      "2.0": [
        "2ch",
        "stereo",
        {
          regex: "(2[\\W_]0(?:ch)?)(?=[^\\d]|$)",
          children: true
        },
        {
          string: "20",
          validator: "import:seps_after",
          tags: "weak-audio_channels"
        }
      ],
      "5.1": [
        "5ch",
        "6ch",
        {
          regex: "(5[\\W_][01](?:ch)?)(?=[^\\d]|$)",
          children: true
        },
        {
          regex: "(6[\\W_]0(?:ch)?)(?=[^\\d]|$)",
          children: true
        },
        {
          regex: "5[01]",
          validator: "import:seps_after",
          tags: "weak-audio_channels"
        }
      ],
      "7.1": [
        "7ch",
        "8ch",
        {
          regex: "(7[\\W_][01](?:ch)?)(?=[^\\d]|$)",
          children: true
        },
        {
          regex: "7[01]",
          validator: "import:seps_after",
          tags: "weak-audio_channels"
        }
      ]
    },
    audio_profile: {
      "Master Audio": {
        string: "MA",
        tags: [
          "audio_profile.rule",
          "DTS-HD"
        ]
      },
      "High Resolution Audio": {
        string: [
          "HR",
          "HRA"
        ],
        tags: [
          "audio_profile.rule",
          "DTS-HD"
        ]
      },
      "Extended Surround": {
        string: "ES",
        tags: [
          "audio_profile.rule",
          "DTS"
        ]
      },
      "High Efficiency": {
        string: "HE",
        tags: [
          "audio_profile.rule",
          "AAC"
        ]
      },
      "Low Complexity": {
        string: "LC",
        tags: [
          "audio_profile.rule",
          "AAC"
        ]
      },
      "High Quality": {
        string: "HQ",
        tags: [
          "audio_profile.rule",
          "Dolby Digital"
        ]
      },
      EX: {
        string: "EX",
        tags: [
          "audio_profile.rule",
          "Dolby Digital"
        ]
      }
    }
  },
  bit_rate: {
    bit_rate: {
      _: {
        regex: [
          "\\d+-?[kmg]b(ps|its?)",
          "\\d+\\.\\d+-?[kmg]b(ps|its?)"
        ],
        conflict_solver: "lambda match, other: match if other.name == 'audio_channels' and 'weak-audio_channels' not in other.tags else other",
        formatter: "import:guessit.rules.common.quantity:BitRate.fromstring",
        tags: [
          "release-group-prefix"
        ]
      }
    }
  },
  bonus: {
    bonus: {
      _: {
        regex: "x(\\d+)",
        private_parent: true,
        children: true,
        formatter: "eval:int",
        validator: {
          __parent__: "import:seps_surround"
        },
        validate_all: true,
        conflict_solver: "lambda match, conflicting: match if conflicting.name in ('video_codec', 'episode') and 'weak-episode' not in conflicting.tags else '__default__'"
      }
    }
  },
  cd: {
    _cd_of_cd_count: {
      regex: "cd-?(?P<cd>\\d+)(?:-?of-?(?P<cd_count>\\d+))?",
      validator: {
        cd: "lambda match: 0 < match.value < 100",
        cd_count: "lambda match: 0 < match.value < 100"
      },
      formatter: {
        cd: "eval:int",
        cd_count: "eval:int"
      },
      children: true,
      private_parent: true,
      properties: {
        cd: [
          null
        ],
        cd_count: [
          null
        ]
      }
    },
    _cd_count: {
      regex: "(?P<cd_count>\\d+)-?cds?",
      validator: {
        cd: "lambda match: 0 < match.value < 100",
        cd_count: "lambda match: 0 < match.value < 100"
      },
      formatter: {
        cd_count: "eval:int"
      },
      children: true,
      private_parent: true,
      properties: {
        cd: [
          null
        ],
        cd_count: [
          null
        ]
      }
    }
  },
  container: {
    subtitles: [
      "srt",
      "idx",
      "sub",
      "ssa",
      "ass"
    ],
    info: [
      "nfo"
    ],
    videos: [
      "3g2",
      "3gp",
      "3gp2",
      "asf",
      "avi",
      "divx",
      "flv",
      "iso",
      "m4v",
      "mk2",
      "mk3d",
      "mka",
      "mkv",
      "mov",
      "mp4",
      "mp4a",
      "mpeg",
      "mpg",
      "ogg",
      "ogm",
      "ogv",
      "qt",
      "ra",
      "ram",
      "rm",
      "ts",
      "m2ts",
      "vob",
      "wav",
      "webm",
      "wma",
      "wmv"
    ],
    torrent: [
      "torrent"
    ],
    nzb: [
      "nzb"
    ]
  },
  country: {
    synonyms: {
      ES: [
        "españa"
      ],
      GB: [
        "UK"
      ],
      BR: [
        "brazilian",
        "bra"
      ],
      CA: [
        "québec",
        "quebec",
        "qc"
      ],
      MX: [
        "Latinoamérica",
        "latin america"
      ]
    }
  },
  edition: {
    edition: {
      Collector: {
        string: [
          "collector"
        ],
        regex: [
          "collector'?s?-edition",
          "edition-collector"
        ]
      },
      Special: [
        {
          regex: [
            "special-edition",
            "edition-special"
          ],
          conflict_solver: "lambda match, other: other if other.name == 'episode_details' and other.value == 'Special' else '__default__'"
        },
        {
          string: "se",
          tags: "has-neighbor"
        }
      ],
      "Director's Definitive Cut": "ddc",
      Criterion: {
        string: [
          "CC",
          "Criterion"
        ],
        regex: [
          "criterion-edition",
          "edition-criterion"
        ]
      },
      Deluxe: {
        string: [
          "deluxe"
        ],
        regex: [
          "deluxe-edition",
          "edition-deluxe"
        ]
      },
      Limited: {
        string: [
          "limited"
        ],
        regex: [
          "limited-edition"
        ],
        tags: [
          "has-neighbor",
          "release-group-prefix"
        ]
      },
      Theatrical: {
        string: [
          "theatrical"
        ],
        regex: [
          "theatrical-cut",
          "theatrical-edition"
        ]
      },
      "Director's Cut": {
        string: [
          "DC"
        ],
        regex: [
          "director'?s?-cut",
          "director'?s?-cut-edition",
          "edition-director'?s?-cut"
        ]
      },
      Extended: {
        string: [
          "extended"
        ],
        regex: [
          "extended-?cut",
          "extended-?version"
        ],
        tags: [
          "has-neighbor",
          "release-group-prefix"
        ]
      },
      "Alternative Cut": {
        regex: [
          "alternat(e|ive)(?:-?Cut)?"
        ],
        tags: [
          "has-neighbor",
          "release-group-prefix"
        ]
      },
      Remastered: [
        {
          regex: "(?:4k.)?remaster(?:ed)?",
          tags: [
            "release-group-prefix"
          ]
        }
      ],
      Restored: [
        {
          regex: "(?:4k.)?restore(?:d)?",
          tags: [
            "release-group-prefix"
          ]
        }
      ],
      Uncensored: {
        string: "Uncensored",
        tags: [
          "has-neighbor",
          "release-group-prefix"
        ]
      },
      Uncut: {
        string: "Uncut",
        tags: [
          "has-neighbor",
          "release-group-prefix"
        ]
      },
      Unrated: {
        string: "Unrated",
        tags: [
          "has-neighbor",
          "release-group-prefix"
        ]
      },
      Festival: {
        string: "Festival",
        tags: [
          "has-neighbor-before",
          "has-neighbor-after"
        ]
      },
      IMAX: {
        string: [
          "imax"
        ],
        regex: [
          "imax-edition"
        ]
      },
      Fan: {
        regex: [
          "fan-edit(?:ion)?",
          "fan-collection"
        ]
      },
      Ultimate: {
        regex: [
          "ultimate-edition"
        ]
      },
      _Ultimate_Collector: {
        regex: [
          "ultimate-collector'?s?-edition"
        ],
        value: [
          "Ultimate",
          "Collector"
        ]
      },
      _Ultimate_Fan: {
        regex: [
          "ultimate-fan-edit(?:ion)?",
          "ultimate-fan-collection"
        ],
        value: [
          "Ultimate",
          "Fan"
        ]
      }
    }
  },
  episodes: {
    season_max_range: 100,
    episode_max_range: 100,
    max_range_gap: 1,
    season_markers: [
      "s"
    ],
    season_ep_markers: [
      "x"
    ],
    disc_markers: [
      "d"
    ],
    episode_markers: [
      "xe",
      "ex",
      "ep",
      "e",
      "x"
    ],
    range_separators: [
      "-",
      "~",
      "to",
      "a"
    ],
    discrete_separators: [
      "+",
      "&",
      "and",
      "et"
    ],
    season_words: [
      "season",
      "saison",
      "seizoen",
      "seasons",
      "saisons",
      "tem",
      "temp",
      "temporada",
      "temporadas",
      "stagione"
    ],
    episode_words: [
      "episode",
      "episodes",
      "eps",
      "ep",
      "episodio",
      "episodios",
      "capitulo",
      "capitulos"
    ],
    of_words: [
      "of",
      "sur"
    ],
    all_words: [
      "All"
    ]
  },
  film: {
    film: {
      _f: {
        regex: "f(\\d{1,2})",
        name: "film",
        validate_all: true,
        validator: {
          __parent__: "import:seps_surround"
        },
        private_parent: true,
        children: true,
        formatter: "eval:int"
      }
    }
  },
  language: {
    synonyms: {
      ell: [
        "gr",
        "greek"
      ],
      spa: [
        "esp",
        "español",
        "espanol"
      ],
      fra: [
        "français",
        "vf",
        "vff",
        "vfi",
        "vfq"
      ],
      swe: [
        "se"
      ],
      por_BR: [
        "po",
        "pb",
        "pob",
        "ptbr",
        "br",
        "brazilian"
      ],
      deu_CH: [
        "swissgerman",
        "swiss german"
      ],
      nld_BE: [
        "flemish"
      ],
      cat: [
        "català",
        "castellano",
        "espanol castellano",
        "español castellano"
      ],
      ces: [
        "cz"
      ],
      ukr: [
        "ua"
      ],
      zho: [
        "cn"
      ],
      jpn: [
        "jp"
      ],
      hrv: [
        "scr"
      ],
      mul: [
        "multi",
        "multiple",
        "dl"
      ]
    },
    subtitle_affixes: [
      "sub",
      "subs",
      "subtitle",
      "subtitles",
      "esub",
      "esubs",
      "subbed",
      "custom subbed",
      "custom subs",
      "custom sub",
      "customsubbed",
      "customsubs",
      "customsub",
      "soft subtitles",
      "soft subs"
    ],
    subtitle_prefixes: [
      "st",
      "vost",
      "subforced",
      "fansub",
      "hardsub",
      "legenda",
      "legendas",
      "legendado",
      "subtitulado",
      "soft"
    ],
    subtitle_suffixes: [
      "subforced",
      "fansub",
      "hardsub"
    ],
    language_affixes: [
      "dublado",
      "dubbed",
      "dub"
    ],
    language_prefixes: [
      "true"
    ],
    language_suffixes: [
      "audio"
    ],
    weak_affixes: [
      "v",
      "audio",
      "true",
      "st"
    ]
  },
  other: {
    other: {
      "Audio Fixed": {
        regex: [
          "Audio-?Fix",
          "Audio-?Fixed"
        ]
      },
      "Sync Fixed": {
        regex: [
          "Sync-?Fix",
          "Sync-?Fixed"
        ]
      },
      "Dual Audio": {
        string: [
          "Dual"
        ],
        regex: [
          "Dual-?Audio"
        ]
      },
      Widescreen: {
        string: [
          "ws"
        ],
        regex: [
          "wide-?screen"
        ]
      },
      Reencoded: {
        regex: [
          "Re-?Enc(?:oded)?"
        ]
      },
      _repack_with_count: {
        regex: [
          "Repack(?P<proper_count>\\d*)",
          "Rerip(?P<proper_count>\\d*)"
        ],
        value: {
          other: "Proper"
        },
        tags: [
          "streaming_service.prefix",
          "streaming_service.suffix"
        ]
      },
      Proper: [
        {
          string: "Proper",
          tags: [
            "has-neighbor",
            "streaming_service.prefix",
            "streaming_service.suffix"
          ]
        },
        {
          regex: [
            "Real-Proper",
            "Real-Repack",
            "Real-Rerip"
          ],
          tags: [
            "streaming_service.prefix",
            "streaming_service.suffix",
            "real"
          ]
        },
        {
          string: "Real",
          tags: [
            "has-neighbor",
            "streaming_service.prefix",
            "streaming_service.suffix",
            "real"
          ]
        }
      ],
      Fix: [
        {
          string: [
            "Fix",
            "Fixed"
          ],
          tags: [
            "has-neighbor-before",
            "has-neighbor-after",
            "streaming_service.prefix",
            "streaming_service.suffix"
          ]
        },
        {
          string: [
            "Dirfix",
            "Nfofix",
            "Prooffix"
          ],
          tags: [
            "streaming_service.prefix",
            "streaming_service.suffix"
          ]
        },
        {
          regex: [
            "(?:Proof-?)?Sample-?Fix"
          ],
          tags: [
            "streaming_service.prefix",
            "streaming_service.suffix"
          ]
        }
      ],
      "Fan Subtitled": {
        string: "Fansub",
        tags: "has-neighbor"
      },
      "Fast Subtitled": {
        string: "Fastsub",
        tags: "has-neighbor"
      },
      "Region 5": "R5",
      "Region C": "RC",
      Preair: {
        regex: "Pre-?Air"
      },
      "PS Vita": [
        {
          regex: "(?:PS-?)Vita"
        },
        {
          string: "Vita",
          tags: "has-neighbor"
        }
      ],
      _HdRip: {
        value: {
          other: "HD",
          another: "Rip"
        },
        regex: [
          "(HD)(?P<another>Rip)"
        ],
        private_parent: true,
        children: true,
        validator: {
          __parent__: "import:seps_surround"
        },
        validate_all: true
      },
      Screener: [
        "Screener",
        {
          regex: "Scr(?:eener)?",
          validator: null,
          tags: [
            "other.validate.screener",
            "source-prefix",
            "source-suffix"
          ]
        }
      ],
      Remux: "Remux",
      Hybrid: "Hybrid",
      PAL: "PAL",
      SECAM: "SECAM",
      NTSC: "NTSC",
      XXX: "XXX",
      "2in1": "2in1",
      "3D": {
        string: "3D",
        tags: "has-neighbor"
      },
      "High Quality": {
        string: "HQ",
        tags: "uhdbluray-neighbor"
      },
      "High Resolution": "HR",
      "Line Dubbed": "LD",
      "Mic Dubbed": "MD",
      "Micro HD": [
        "mHD",
        "HDLight"
      ],
      "Low Definition": "LDTV",
      "High Frame Rate": "HFR",
      "Variable Frame Rate": "VFR",
      HD: {
        string: "HD",
        validator: null,
        tags: [
          "streaming_service.prefix",
          "streaming_service.suffix"
        ]
      },
      "Full HD": {
        string: [
          "FHD"
        ],
        regex: [
          "Full-?HD"
        ],
        validator: null,
        tags: [
          "streaming_service.prefix",
          "streaming_service.suffix"
        ]
      },
      "Ultra HD": {
        string: [
          "UHD"
        ],
        regex: [
          "Ultra-?(?:HD)?"
        ],
        validator: null,
        tags: [
          "streaming_service.prefix",
          "streaming_service.suffix"
        ]
      },
      Upscaled: {
        regex: "Upscaled?"
      },
      Complete: {
        string: [
          "Complet",
          "Complete"
        ],
        tags: [
          "has-neighbor",
          "release-group-prefix"
        ]
      },
      Classic: {
        string: "Classic",
        tags: [
          "has-neighbor",
          "release-group-prefix"
        ]
      },
      Bonus: {
        string: "Bonus",
        tags: [
          "has-neighbor",
          "release-group-prefix"
        ]
      },
      Trailer: {
        string: "Trailer",
        tags: [
          "has-neighbor",
          "release-group-prefix"
        ]
      },
      Retail: {
        string: "Retail",
        tags: [
          "has-neighbor",
          "release-group-prefix"
        ]
      },
      Colorized: {
        string: "Colorized",
        tags: [
          "has-neighbor",
          "release-group-prefix"
        ]
      },
      Internal: {
        string: "Internal",
        tags: [
          "has-neighbor",
          "release-group-prefix"
        ]
      },
      "Line Audio": {
        string: "LiNE",
        tags: [
          "has-neighbor-before",
          "has-neighbor-after",
          "release-group-prefix"
        ]
      },
      "Read NFO": {
        regex: "Read-?NFO"
      },
      Converted: {
        string: "CONVERT",
        tags: "has-neighbor"
      },
      Documentary: {
        string: [
          "DOCU",
          "DOKU"
        ],
        tags: "has-neighbor"
      },
      "Open Matte": {
        regex: "(?:OM|Open-?Matte)",
        tags: "has-neighbor"
      },
      "Straight to Video": {
        string: "STV",
        tags: "has-neighbor"
      },
      "Original Aspect Ratio": {
        string: "OAR",
        tags: "has-neighbor"
      },
      "East Coast Feed": {
        regex: "(?:Live-)?(?:Episode-)?East-?(?:Coast-)?Feed"
      },
      "West Coast Feed": {
        regex: "(?:Live-)?(?:Episode-)?West-?(?:Coast-)?Feed"
      },
      "Original Video": {
        string: [
          "VO",
          "OV"
        ],
        tags: "has-neighbor"
      },
      "Original Animated Video": {
        string: [
          "Ova",
          "Oav"
        ]
      },
      "Original Net Animation": "Ona",
      "Original Animation DVD": "Oad",
      Mux: {
        string: "Mux",
        validator: "import:seps_after",
        tags: [
          "other.validate.mux",
          "video-codec-prefix",
          "source-suffix"
        ]
      },
      "Hardcoded Subtitles": [
        "HC",
        "vost"
      ],
      "Standard Dynamic Range": {
        string: "SDR",
        tags: "uhdbluray-neighbor"
      },
      HDR10: {
        regex: "HDR(?:10)?",
        tags: "uhdbluray-neighbor"
      },
      "Dolby Vision": {
        regex: "(?:Dolby-?Vision|DV)",
        tags: "uhdbluray-neighbor"
      },
      "BT.2020": {
        regex: "BT-?2020",
        tags: "uhdbluray-neighbor"
      },
      Sample: {
        string: "Sample",
        tags: [
          "at-end",
          "not-a-release-group"
        ]
      },
      Extras: [
        {
          string: "Extras",
          tags: "has-neighbor"
        },
        {
          regex: "Digital-?Extras?"
        }
      ],
      Proof: {
        string: "Proof",
        tags: [
          "at-end",
          "not-a-release-group"
        ]
      },
      Obfuscated: {
        string: [
          "Obfuscated",
          "Scrambled"
        ],
        tags: [
          "at-end",
          "not-a-release-group"
        ]
      },
      Repost: {
        string: [
          "xpost",
          "postbot",
          "asrequested"
        ],
        tags: "not-a-release-group"
      },
      _complete_words: {
        callable: "import:guessit.rules.properties.other:complete_words",
        season_words: [
          "seasons?",
          "series?"
        ],
        complete_article_words: [
          "The"
        ]
      }
    }
  },
  part: {
    prefixes: [
      "pt",
      "part"
    ]
  },
  release_group: {
    forbidden_names: [
      "bonus",
      "by",
      "for",
      "par",
      "pour",
      "rip"
    ],
    ignored_seps: "[]{}()"
  },
  screen_size: {
    frame_rates: [
      "23\\.976",
      "24(?:\\.0{1,3})?",
      "25(?:\\.0{1,3})?",
      "29\\.970",
      "30(?:\\.0{1,3})?",
      "48(?:\\.0{1,3})?",
      "50(?:\\.0{1,3})?",
      "60(?:\\.0{1,3})?",
      "120(?:\\.0{1,3})?"
    ],
    min_ar: 1.333,
    max_ar: 1.898,
    interlaced: [
      "360",
      "480",
      "540",
      "576",
      "900",
      "1080"
    ],
    progressive: [
      "360",
      "480",
      "540",
      "576",
      "900",
      "1080",
      "368",
      "720",
      "1440",
      "2160",
      "4320"
    ]
  },
  source: {
    rip_prefix: "(?P<other>Rip)-?",
    rip_suffix: "-?(?P<other>Rip)"
  },
  website: {
    safe_tlds: [
      "com",
      "net",
      "org"
    ],
    safe_subdomains: [
      "www"
    ],
    safe_prefixes: [
      "co",
      "com",
      "net",
      "org"
    ],
    prefixes: [
      "from"
    ]
  },
  streaming_service: {
    "9Now": "9NOW",
    "A&E": [
      "AE",
      "A&E"
    ],
    ABC: "AMBC",
    "ABC Australia": "AUBC",
    "Al Jazeera English": "AJAZ",
    AMC: "AMC",
    "Amazon Prime": [
      "AMZN",
      "AMZN-CBR",
      "Amazon",
      "re:Amazon-?Prime"
    ],
    "Adult Swim": [
      "AS",
      "re:Adult-?Swim"
    ],
    "America's Test Kitchen": "ATK",
    "Animal Planet": "ANPL",
    AnimeLab: "ANLB",
    AOL: "AOL",
    AppleTV: [
      "ATVP",
      "ATV+",
      "APTV"
    ],
    ARD: "ARD",
    "BBC iPlayer": [
      "iP",
      "re:BBC-?iPlayer"
    ],
    Binge: "BNGE",
    Blackpills: "BKPL",
    BluTV: "BLU",
    Boomerang: "BOOM",
    "Disney+": "DSNP",
    BravoTV: "BRAV",
    "Canal+": "CNLP",
    "Cartoon Network": "CN",
    CBC: "CBC",
    CBS: "CBS",
    CNBC: "CNBC",
    "Comedy Central": [
      "CC",
      "re:Comedy-?Central"
    ],
    "Channel 4": [
      "ALL4",
      "4OD"
    ],
    CHRGD: "CHGD",
    Cinemax: "CMAX",
    "Country Music Television": "CMT",
    "Comedians in Cars Getting Coffee": "CCGC",
    Crave: "CRAV",
    "Crunchy Roll": [
      "CR",
      "re:Crunchy-?Roll"
    ],
    Crackle: "CRKL",
    CSpan: "CSPN",
    CTV: "CTV",
    CuriosityStream: "CUR",
    CWSeed: "CWS",
    Daisuki: "DSKI",
    "DC Universe": "DCU",
    "Deadhouse Films": "DHF",
    DramaFever: [
      "DF",
      "DramaFever"
    ],
    "Digiturk Diledigin Yerde": "DDY",
    Discovery: [
      "DISC",
      "Discovery"
    ],
    "Discovery Plus": "DSCP",
    Disney: [
      "DSNY",
      "Disney"
    ],
    "DIY Network": "DIY",
    "Doc Club": "DOCC",
    DPlay: "DPLY",
    "E!": "ETV",
    ePix: "EPIX",
    "El Trece": "ETTV",
    ESPN: "ESPN",
    Esquire: "ESQ",
    "Facebook Watch": "FBWatch",
    Family: "FAM",
    "Family Jr": "FJR",
    Fandor: "FANDOR",
    "Food Network": "FOOD",
    Fox: "FOX",
    "Fox Premium": "FOXP",
    Foxtel: "FXTL",
    Freeform: "FREE",
    "FYI Network": "FYI",
    GagaOOLala: "Gaga",
    Global: "GLBL",
    "GloboSat Play": "GLOB",
    Hallmark: "HLMK",
    "HBO Go": [
      "HBO",
      "re:HBO-?Go"
    ],
    "HBO Max": "HMAX",
    HGTV: "HGTV",
    History: [
      "HIST",
      "History"
    ],
    Hulu: "HULU",
    "Investigation Discovery": "ID",
    IFC: "IFC",
    hoichoi: "HoiChoi",
    iflix: "IFX",
    iQIYI: "iQIYI",
    iTunes: [
      "iTunes",
      {
        pattern: "iT",
        ignore_case: false
      }
    ],
    ITV: "ITV",
    "Knowledge Network": "KNOW",
    Lifetime: "LIFE",
    "Motor Trend OnDemand": "MTOD",
    MBC: [
      "MBC",
      "MBCVOD"
    ],
    MSNBC: "MNBC",
    MTV: "MTV",
    MUBI: "MUBI",
    "National Audiovisual Institute": "INA",
    "National Film Board": "NFB",
    "National Geographic": [
      "NATG",
      "re:National-?Geographic"
    ],
    "NBA TV": [
      "NBA",
      "re:NBA-?TV"
    ],
    NBC: "NBC",
    Netflix: [
      "NF",
      "Netflix"
    ],
    NFL: "NFL",
    "NFL Now": "NFLN",
    "NHL GameCenter": "GC",
    Nickelodeon: [
      "NICK",
      "Nickelodeon",
      "NICKAPP"
    ],
    "Norsk Rikskringkasting": "NRK",
    OnDemandKorea: [
      "ODK",
      "OnDemandKorea"
    ],
    Opto: "OPTO",
    "Oprah Winfrey Network": "OWN",
    "Paramount+": [
      "PMTP",
      "PMNP",
      "PMT+",
      "Paramount+",
      "ParamountPlus"
    ],
    PBS: "PBS",
    "PBS Kids": "PBSK",
    Peacock: [
      "PCOK",
      "Peacock"
    ],
    "Playstation Network": "PSN",
    Pluzz: "PLUZ",
    PokerGO: "POGO",
    "Rakuten TV": "RKTN",
    "The Roku Channel": "ROKU",
    "RTE One": "RTE",
    RUUTU: "RUUTU",
    SBS: "SBS",
    "Science Channel": "SCI",
    SeeSo: [
      "SESO",
      "SeeSo"
    ],
    Shomi: "SHMI",
    Showtime: "SHO",
    Sony: "SONY",
    Spike: "SPIK",
    "Spike TV": [
      "SPKE",
      "re:Spike-?TV"
    ],
    Sportsnet: "SNET",
    Sprout: "SPRT",
    Stan: "STAN",
    Starz: "STZ",
    "Sveriges Television": "SVT",
    SwearNet: "SWER",
    Syfy: "SYFY",
    TBS: "TBS",
    TFou: "TFOU",
    "The CW": [
      "CW",
      "re:The-?CW"
    ],
    TLC: "TLC",
    TubiTV: "TUBI",
    "TV3 Ireland": "TV3",
    "TV4 Sweeden": "TV4",
    TVING: "TVING",
    "TV Land": [
      "TVL",
      "re:TV-?Land"
    ],
    TVNZ: "TVNZ",
    UFC: "UFC",
    "UFC Fight Pass": "FP",
    UKTV: "UKTV",
    Univision: "UNIV",
    "USA Network": "USAN",
    Velocity: "VLCT",
    VH1: "VH1",
    Viceland: "VICE",
    Viki: "VIKI",
    Vimeo: "VMEO",
    VRV: "VRV",
    "W Network": "WNET",
    WatchMe: "WME",
    "WWE Network": "WWEN",
    "Xbox Video": "XBOX",
    Yahoo: "YHOO",
    "YouTube Red": "RED",
    ZDF: "ZDF"
  },
  date: {
    week_words: [
      "week"
    ]
  }
};
const defaultOptions = {
  expected_title,
  allowed_countries,
  allowed_languages,
  advanced_config
};
function parseOptions(options, _api = false) {
  if (!options) return {};
  if (typeof options === "object" && !Array.isArray(options)) return options;
  return {};
}
function loadConfig(options = {}) {
  const configurations = [];
  if (!options.noDefaultConfig) {
    configurations.push(defaultOptions);
  }
  const config = configurations.length > 0 ? mergeOptions(...configurations) : {};
  if (!("advanced_config" in config)) {
    config["advanced_config"] = defaultOptions["advanced_config"];
  }
  return config;
}
function mergeOptions(...optionsList) {
  let merged = {};
  if (optionsList.length === 0) return merged;
  if (optionsList[0]) {
    merged = deepCopy(optionsList[0]);
  }
  for (const opts of optionsList.slice(1)) {
    if (!opts) continue;
    const pristine = opts["pristine"];
    if (pristine === true) {
      merged = {};
    } else if (Array.isArray(pristine)) {
      for (const key of pristine) {
        delete merged[key];
      }
    }
    for (const [option, value] of Object.entries(opts)) {
      mergeOptionValue(option, value, merged);
    }
  }
  return merged;
}
function mergeOptionValue(option, value, merged) {
  if (value !== null && value !== void 0 && option !== "pristine") {
    const existing = merged[option];
    if (Array.isArray(existing) && Array.isArray(value)) {
      for (const val of value) {
        if (!existing.includes(val) && val !== null) {
          existing.push(val);
        }
      }
    } else if (existing !== null && typeof existing === "object" && !Array.isArray(existing) && value !== null && typeof value === "object" && !Array.isArray(value)) {
      merged[option] = mergeOptions(existing, value);
    } else if (Array.isArray(value)) {
      merged[option] = [...value];
    } else {
      merged[option] = value;
    }
  }
}
function deepCopy(obj) {
  return JSON.parse(JSON.stringify(obj));
}
class GuessItException extends Error {
  constructor(string, options, cause) {
    const causeMsg = cause instanceof Error ? cause.message : String(cause);
    super(
      `An internal error has occurred in guessit.
string=${string}
options=${JSON.stringify(options)}
` + causeMsg
    );
    this.name = "GuessItException";
    this.string = string;
    this.options = options;
    if (cause instanceof Error) this.cause = cause;
  }
}
class GuessItApi {
  constructor() {
    this._rebulk = null;
    this._config = null;
    this._loadConfigOptions = null;
    this._advancedConfig = null;
  }
  reset() {
    this._rebulk = null;
    this._config = null;
    this._loadConfigOptions = null;
    this._advancedConfig = null;
  }
  configure(options, rulesBuilder, force = false, sanitizeOptions = true) {
    const builder = rulesBuilder ?? rebulkBuilder;
    let parsedOptions = sanitizeOptions ? parseOptions(options, true) : options ?? {};
    const hasSameConfigProps = (a, b) => a["config"] === b["config"] && a.noUserConfig === b.noUserConfig && a.noDefaultConfig === b.noDefaultConfig;
    let config;
    if (this._config === null || this._loadConfigOptions === null || force || !hasSameConfigProps(this._loadConfigOptions, parsedOptions)) {
      config = loadConfig(parsedOptions);
      this._loadConfigOptions = parsedOptions;
    } else {
      config = this._config;
    }
    const advancedConfig = mergeOptions(
      config["advanced_config"] ?? {},
      parsedOptions["advancedConfig"] ?? {}
    );
    const shouldBuild = force || !this._rebulk || !this._advancedConfig || JSON.stringify(this._advancedConfig) !== JSON.stringify(advancedConfig);
    if (shouldBuild) {
      this._advancedConfig = JSON.parse(JSON.stringify(advancedConfig));
      this._rebulk = builder(advancedConfig);
    }
    this._config = config;
    return config;
  }
  guessit(string, options) {
    try {
      const parsedOptions = parseOptions(options, true);
      const config = this.configure(parsedOptions, void 0, false, false);
      const mergedOptions = mergeOptions(config, parsedOptions);
      if (!this._rebulk) {
        throw new Error("Rebulk not initialized");
      }
      const matches = this._rebulk.matches(string, mergedOptions);
      const matchesDict = matches.toDict(
        !!mergedOptions["advanced"],
        !!mergedOptions["singleValue"] || !!mergedOptions["single_value"],
        !!mergedOptions["enforceList"] || !!mergedOptions["enforce_list"]
      );
      const result = Object.fromEntries(matchesDict);
      if (mergedOptions["outputInputString"] || mergedOptions["output_input_string"]) {
        result["input_string"] = matches.inputString;
      }
      return result;
    } catch (err) {
      if (err instanceof GuessItException) throw err;
      throw new GuessItException(
        string,
        typeof options === "object" && options !== null ? options : {},
        err
      );
    }
  }
  properties(options) {
    const parsedOptions = parseOptions(options, true);
    const config = this.configure(parsedOptions, void 0, false, false);
    mergeOptions(config, parsedOptions);
    if (!this._rebulk) return {};
    const props = {};
    for (const pattern of this._rebulk.effectivePatterns()) {
      if (pattern.properties) {
        for (const [k, vals] of Object.entries(pattern.properties)) {
          if (!props[k]) props[k] = /* @__PURE__ */ new Set();
          for (const v of vals) props[k].add(v);
        }
      }
    }
    const ordered = {};
    for (const k of Object.keys(props).sort()) {
      ordered[k] = [...props[k]].sort((a, b) => String(a).localeCompare(String(b)));
    }
    const rb = this._rebulk;
    if (rb.customizeProperties) {
      return rb.customizeProperties(ordered);
    }
    return ordered;
  }
  suggestedExpected(titles, options) {
    const suggested = [];
    for (const title2 of titles) {
      const guess = this.guessit(title2, options);
      if (Object.keys(guess).length !== 2 || !("title" in guess)) {
        suggested.push(title2);
      }
    }
    return suggested;
  }
}
const defaultApi = new GuessItApi();
function guessit(string, options) {
  return defaultApi.guessit(string, options);
}
function properties(options) {
  return defaultApi.properties(options);
}
function configure(options, rulesBuilder, force = false) {
  defaultApi.configure(options, rulesBuilder, force);
}
function reset() {
  defaultApi.reset();
}
exports.GuessItApi = GuessItApi;
exports.GuessItException = GuessItException;
exports.configure = configure;
exports.defaultApi = defaultApi;
exports.guessit = guessit;
exports.loadConfig = loadConfig;
exports.mergeOptions = mergeOptions;
exports.parseOptions = parseOptions;
exports.properties = properties;
exports.rebulkBuilder = rebulkBuilder;
exports.reset = reset;
//# sourceMappingURL=guessit-js.cjs.map
