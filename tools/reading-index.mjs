/* Real music to read: cut every tune in the library into four-bar phrases and file each one under the lowest level of the
   reading ladder it fits: its notes are all in that level's keys, strings and hand position, and its rhythms are ones the
   level has met in Read the rhythm. A phrase may be moved to another key or octave to fit (its own key first), the way a
   method book prints a folk tune in C. Writes docs/lib/reading.json:
   { levels: [[[tuneId, fromBar, toBar, title, semitones moved, which of the level's keys], ...], ...] }.
   Run: node tools/reading-index.mjs */
import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { build } from "../docs/js/songs/format.js";
import { SONGS } from "../docs/js/songs/data.js";
import { LADDER, ladderPool } from "../docs/js/songs/ladder.js";

const LIB = new URL("../docs/lib/", import.meta.url),
  PER_LEVEL = 400, // phrases kept for each level
  PER_TUNE = 3, // and from any one tune, so a level isn't one long tune
  BARS = 4;

/* The Read the rhythm level a phrase needs: the highest of what its notes and rests ask for, or 0 if it has something the
   game never teaches (a quintuplet, a sixteenth triplet, a tied-over length). */
function rhythmLevel(s, notes) {
  if (!["4/4", "3/4", "2/4", "6/8"].includes(s.time)) return 0;
  let lv = s.time === "6/8" ? 9 : s.time === "4/4" ? 1 : 4;
  for (const n of notes) {
    const at = n.start % s.beat;
    if (n.triplet) {
      if (Math.abs(n.dur - 4 / 3) > 1e-6 || s.time === "6/8") return 0;
      lv = Math.max(lv, 10);
      continue;
    }
    const d = n.dur;
    if (s.time === "6/8") {
      if (![1, 2, 3, 4, 6, 12].includes(d)) return 0;
      continue;
    }
    if (n.rest) {
      if (![1, 2, 4, 8, 12, 16].includes(d)) return 0;
      lv = Math.max(lv, d === 1 ? 7 : d === 2 ? 6 : d >= 8 ? 2 : 1);
      continue;
    }
    if (![1, 2, 3, 4, 6, 8, 12, 16].includes(d)) return 0;
    const need = d === 3 ? 8 : d === 1 ? 7 : d === 6 ? 5 : d === 2 ? (at % 2 === 0 ? 3 : 7) : d >= 8 ? 2 : 1;
    lv = Math.max(lv, need, at === 2 && d >= 4 ? 6 : 0); // a quarter or longer from the "and" is syncopation
  }
  return lv;
}

/* The lowest ladder level from..to whose keys, strings and position hold every note (moved by t semitones, the smallest
   move first), and whose rhythms cover the phrase: { lv, t, k } or null. */
const FIRST = LADDER.findIndex((L) => L.keys.some((k) => k[2] > 0)); // the levels before this stay in first position
const MOVES = Array.from({ length: 49 }, (_, i) => i - 24).sort((a, b) => Math.abs(a) - Math.abs(b) || a - b);
const pools = LADDER.map((L, i) => L.keys.map((key) => new Set(ladderPool(i + 1, key).map((n) => n.m))));
function levelOf(s, notes, from = 1, to = LADDER.length) {
  const sounding = notes.filter((n) => !n.rest);
  if (sounding.length < 6 || sounding.some((n) => n.pitches.length > 1)) return null;
  const rl = rhythmLevel(s, notes);
  if (!rl) return null;
  for (let lv = from; lv <= to; lv++) {
    if (Math.max(...LADDER[lv - 1].rhythm) < rl) continue;
    for (const t of MOVES)
      for (let k = 0; k < pools[lv - 1].length; k++) if (sounding.every((n) => pools[lv - 1][k].has(n.midi + t))) return { lv, t, k };
  }
  return null;
}

/* Every four-bar phrase of a tune, on the four-bar grid after any pick-up. */
function phrases(def) {
  let s;
  try {
    s = build(def);
  } catch (e) {
    return [];
  }
  const head = s.pickup ? 1 : 0,
    out = [];
  for (let from = head; from + BARS - 1 < s.barLens.length; from += BARS) {
    const to = from + BARS - 1;
    if (s.barLens.slice(from, to + 1).some((l) => l !== s.bar)) continue; // whole bars only
    // filed twice: at its level in first position, and at its level up the neck, so position levels read in position
    const notes = s.notes.filter((n) => n.bar >= from && n.bar <= to);
    for (const fit of [levelOf(s, notes, 1, FIRST), levelOf(s, notes, FIRST + 1)]) if (fit) out.push({ ...fit, id: def.id, from, to, title: def.title });
  }
  return out;
}

const tunes = [...SONGS.filter((d) => d.style !== "exercise")];
for (const f of readdirSync(LIB).filter((f) => /^songs-\d+\.json$/.test(f)).sort()) tunes.push(...JSON.parse(readFileSync(new URL(f, LIB))));

/* a steady shuffle, so the file only changes when the music does */
const hash = (t) => [...t].reduce((h, c) => (Math.imul(h, 31) + c.charCodeAt(0)) >>> 0, 7);
const levels = LADDER.map(() => []);
for (const def of tunes) {
  const got = phrases(def);
  for (let lv = 1; lv <= LADDER.length; lv++) {
    const here = got.filter((p) => p.lv === lv).sort((a, b) => hash(`${a.id}${a.from}`) - hash(`${b.id}${b.from}`)).slice(0, PER_TUNE);
    here.forEach((p, i) => (p.rank = i)); // a tune's first phrase comes before anyone's second
    levels[lv - 1].push(...here);
  }
}
const out = levels.map((ps) => ps.sort((a, b) => a.rank - b.rank || hash(`${a.id}:${a.from}`) - hash(`${b.id}:${b.from}`)).slice(0, PER_LEVEL).map((p) => [p.id, p.from, p.to, p.title, p.t, p.k]));
writeFileSync(new URL("reading.json", LIB), JSON.stringify({ levels: out }));
console.log(`${tunes.length} tunes; phrases per level: ${levels.map((l, i) => `${i + 1}:${l.length}${l.length > PER_LEVEL ? `→${PER_LEVEL}` : ""}`).join(" ")}`);
