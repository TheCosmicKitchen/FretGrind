/* Song format. Pure: no DOM and no app state, so Node can import it for tests.

   A song is written as bars of "pitch:length" tokens, split by "|":
     pitch   a written guitar pitch such as E5, F#4, Bb3, or "r" for a rest
             (written pitch: the open strings are E3 A3 D4 G4 B4 E5, the same as the rest of the app)
     length  in sixteenth notes: 1 sixteenth, 2 eighth, 3 dotted eighth, 4 quarter, 6 dotted quarter,
             8 half, 12 dotted half, 16 whole. Triplets are fractions: 4/3 an eighth-note triplet, 2/3 a sixteenth one,
             8/3 a quarter-note one
   Join pitches with "+" for notes struck together: C4+E4+G4:4. The highest is the melody note.
   Optional "=s.f" after a token fixes the tab (s = string 1..6 with 1 the high e, f = fret); a chord lists one for each
   pitch in the same order, C4+E4:4=5.3+4.2.
   The first bar may be a pick-up bar (song.pickup = its length). */
import { LET, LSEM, OPEN } from "../core/theory.js";

export const METERS = {
  "4/4": { bar: 16, beat: 4 },
  "3/4": { bar: 12, beat: 4 },
  "2/4": { bar: 8, beat: 4 },
  "5/4": { bar: 20, beat: 4 },
  "6/4": { bar: 24, beat: 4 },
  "2/2": { bar: 16, beat: 8 },
  "3/2": { bar: 24, beat: 8 },
  "6/8": { bar: 12, beat: 6 },
  "9/8": { bar: 18, beat: 6 },
  "12/8": { bar: 24, beat: 6 },
  "3/8": { bar: 6, beat: 2 },
};

/* Key signatures: how many sharps (+) or flats (-) the major key on each tonic has, and how far each mode moves that. */
const MAJOR = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6, "C#": 7, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7 },
  MODES = { "": [0, "major"], m: [-3, "minor"], dor: [-2, "Dorian"], phr: [-4, "Phrygian"], lyd: [1, "Lydian"], mix: [-1, "Mixolydian"], loc: [-5, "Locrian"] };
function parseKey(key) {
  const m = /^([A-G][#b]?)(m|dor|phr|lyd|mix|loc)?$/.exec(key),
    n = m ? MAJOR[m[1]] : undefined;
  if (n === undefined) return null;
  const [off, name] = MODES[m[2] || ""],
    sig = n + off;
  return Math.abs(sig) > 7 ? null : { tonic: m[1], sig, name };
}
/* "Dmix" -> "D Mixolydian", "Am" -> "A minor" */
export function keyLabel(key) {
  const k = parseKey(key);
  return k ? `${k.tonic.replace("#", "♯").replace("b", "♭")} ${k.name}` : key;
}
const SHARP_ORDER = ["F", "C", "G", "D", "A", "E", "B"], FLAT_ORDER = ["B", "E", "A", "D", "G", "C", "F"];
export function keySig(key) {
  const k = parseKey(key);
  if (!k) throw new Error(`Unknown key "${key}"`);
  const n = k.sig,
    m = {};
  (n > 0 ? SHARP_ORDER.slice(0, n) : FLAT_ORDER.slice(0, -n)).forEach((l) => (m[l] = n > 0 ? 1 : -1));
  return m;
}
export const keyCount = (key) => parseKey(key).sig;

export function parsePitch(p) {
  const m = /^([A-G])(#|b)?(\d)$/.exec(p);
  if (!m) throw new Error(`Bad pitch "${p}"`);
  const li = LET.indexOf(m[1]),
    acc = m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0,
    oct = +m[3];
  return { midi: 12 * (oct + 1) + LSEM[li] + acc, step: oct * 7 + li, letter: m[1], acc, oct, name: m[1] + (acc > 0 ? "♯" : acc < 0 ? "♭" : "") + oct };
}

const PITCH = "[A-G][#b]?\\d",
  TOKEN = new RegExp(`^(r|${PITCH}(?:\\+${PITCH})*):(\\d+)(?:/(\\d+))?(?:=([1-6]\\.\\d+(?:\\+[1-6]\\.\\d+)*))?$`),
  TWELFTHS = 12; // times are counted in twelfths of a sixteenth, so triplets add up exactly

/* Turn a song definition into notes with times, bar numbers and accidentals to show. */
export function build(def) {
  const meter = METERS[def.time];
  if (!meter) throw new Error(`${def.id}: unknown time ${def.time}`);
  const sig = keySig(def.key),
    pick = def.pickup || 0,
    bars = def.bars.split("|").map((b) => b.trim()).filter(Boolean),
    notes = [];
  let t = 0; // in twelfths
  const lens = [];
  bars.forEach((b, bi) => {
    const carried = {}; // accidentals already shown in this bar, per letter+octave
    let len = 0;
    b.split(/\s+/).forEach((tok) => {
      const m = TOKEN.exec(tok);
      if (!m) throw new Error(`${def.id}: bad token "${tok}" in bar ${bi}`);
      const dur = +m[2] / (m[3] ? +m[3] : 1),
        ticks = Math.round(dur * TWELFTHS),
        start = t / TWELFTHS,
        triplet = !Number.isInteger(dur);
      if (m[1] === "r") notes.push({ rest: true, start, dur, bar: bi, triplet });
      else {
        const names = m[1].split("+"),
          fixes = m[4] ? m[4].split("+") : [];
        if (fixes.length && fixes.length !== names.length) throw new Error(`${def.id}: "${tok}" needs one fret per pitch`);
        const pitches = names
          .map((name, i) => {
            const p = parsePitch(name),
              k = p.letter + p.oct,
              was = k in carried ? carried[k] : sig[p.letter] || 0,
              fx = fixes[i] ? fixes[i].split(".") : null;
            carried[k] = p.acc;
            return { ...p, show: was === p.acc ? null : p.acc > 0 ? "♯" : p.acc < 0 ? "♭" : "♮", fix: fx ? [6 - +fx[0], +fx[1]] : null };
          })
          .sort((a, b) => a.midi - b.midi);
        // the note itself is the highest pitch (the melody); pitches holds them all, lowest first
        notes.push({ ...pitches[pitches.length - 1], pitches, start, dur, bar: bi, triplet });
      }
      t += ticks;
      len += ticks;
    });
    lens.push(len / TWELFTHS);
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
  // labels: text to show over a note, by its place among the sounding notes (chord names in the exercises)
  Object.entries(def.labels || {}).forEach(([i, t]) => (sounding[i].label = t));
  return { ...def, meter, bar: meter.bar, beat: meter.beat, pickup: pick, notes, sounding, total: t / TWELFTHS, barLens: lens, wordCount: words.length };
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
  const lo = Math.min(...song.sounding.flatMap((n) => n.pitches.map((p) => p.midi)));
  if (lo < OPEN[0]) bad.push(`lowest note ${lo} is below the guitar's low E`);
  return bad;
}
