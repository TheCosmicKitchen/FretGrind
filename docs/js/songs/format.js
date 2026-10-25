/* Song format. Pure: no DOM and no app state, so Node can import it for tests.

   A song is written as bars of "pitch:length" tokens, split by "|":
     pitch   a written guitar pitch such as E5, F#4, Bb3, or "r" for a rest
             (written pitch: the open strings are E3 A3 D4 G4 B4 E5, the same as the rest of the app)
     length  in sixteenth notes: 1 sixteenth, 2 eighth, 3 dotted eighth, 4 quarter, 6 dotted quarter,
             8 half, 12 dotted half, 16 whole
   Optional "=s.f" after a token fixes the tab (s = string 1..6 with 1 the high e, f = fret).
   The first bar may be a pick-up bar (song.pickup = its length). */
import { LET, LSEM, OPEN } from "../core/theory.js";

export const METERS = { "4/4": { bar: 16, beat: 4 }, "3/4": { bar: 12, beat: 4 }, "2/4": { bar: 8, beat: 4 }, "6/8": { bar: 12, beat: 6 }, "3/8": { bar: 6, beat: 2 } };

/* Key signatures: how many sharps (+) or flats (-). */
const SIG = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, F: -1, Bb: -2, Eb: -3, Am: 0, Em: 1, Bm: 2, "F#m": 3, Dm: -1, Gm: -2, Cm: -3 };
const SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"], FLAT_ORDER = ["B", "E", "A", "D", "G", "C", "F"];
export function keySig(key) {
  const n = SIG[key];
  if (n === undefined) throw new Error(`Unknown key "${key}"`);
  const m = {};
  (n > 0 ? SHARP_ORDER.slice(0, n) : FLAT_ORDER.slice(0, -n)).forEach((l) => (m[l] = n > 0 ? 1 : -1));
  return m;
}
export const keyCount = (key) => SIG[key];

export function parsePitch(p) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(p);
  if (!m) throw new Error(`Bad pitch "${p}"`);
  const li = LET.indexOf(m[1]),
    acc = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0,
    oct = +m[3];
  return { midi: 12 * (oct + 1) + LSEM[li] + acc, step: oct * 7 + li, letter: m[1], acc, oct, name: m[1] + (acc > 0 ? "♯" : acc < 0 ? "♭" : "") + oct };
}

/* Turn a song definition into notes with times, bar numbers and accidentals to show. */
export function build(def) {
  const meter = METERS[def.time];
  if (!meter) throw new Error(`${def.id}: unknown time ${def.time}`);
  const sig = keySig(def.key),
    pick = def.pickup || 0,
    bars = def.bars.split("|").map((b) => b.trim()).filter(Boolean),
    notes = [];
  let t = 0;
  const lens = [];
  bars.forEach((b, bi) => {
    const carried = {}; // accidentals already shown in this bar, per letter+octave
    let len = 0;
    b.split(/\s+/).forEach((tok) => {
      const m = /^([A-G][#b]?\d|r):(\d+)(?:=([1-6])\.(\d+))?$/.exec(tok);
      if (!m) throw new Error(`${def.id}: bad token "${tok}" in bar ${bi}`);
      const dur = +m[2];
      if (m[1] === "r") notes.push({ rest: true, start: t, dur, bar: bi });
      else {
        const p = parsePitch(m[1]),
          k = p.letter + p.oct,
          was = k in carried ? carried[k] : sig[p.letter] || 0;
        carried[k] = p.acc;
        notes.push({
          ...p,
          start: t,
          dur,
          bar: bi,
          show: was === p.acc ? null : p.acc > 0 ? "♯" : p.acc < 0 ? "♭" : "♮",
          fix: m[3] ? [6 - +m[3], +m[4]] : null,
        });
      }
      t += dur;
      len += dur;
    });
    lens.push(len);
  });
  // lyrics: one syllable per sounding note; "_" holds the previous syllable, a trailing "-" joins the next one
  const words = (def.words || "").split(/\s+/).filter(Boolean);
  let w = 0;
  notes.forEach((n) => {
    if (n.rest) return;
    const s = words[w++];
    if (s && s !== "_") n.syl = s;
  });
  const sounding = notes.filter((n) => !n.rest);
  return { ...def, meter, bar: meter.bar, beat: meter.beat, pickup: pick, notes, sounding, total: t, barLens: lens, wordCount: words.length };
}

/* Problems with a definition (empty when it is sound): bar lengths, pitch range, lyrics count. */
export function check(song) {
  const bad = [],
    { bar, pickup, barLens } = song;
  barLens.forEach((len, i) => {
    const last = i === barLens.length - 1;
    if (i === 0 && pickup) {
      if (len !== pickup) bad.push(`pick-up bar is ${len}, expected ${pickup}`);
    } else if (len !== bar && !(last && pickup && len === bar - pickup)) bad.push(`bar ${i + 1} has ${len} sixteenths, expected ${bar}`);
  });
  if (song.words !== undefined && song.wordCount !== song.sounding.length)
    bad.push(`lyrics have ${song.wordCount} syllables for ${song.sounding.length} notes`);
  const lo = Math.min(...song.sounding.map((n) => n.midi));
  if (lo < OPEN[0]) bad.push(`lowest note ${lo} is below the guitar's low E`);
  return bad;
}
