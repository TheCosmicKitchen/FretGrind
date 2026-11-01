/* Pitch maths for the microphone. Pure, so Node can test it. */
import { OPEN } from "./theory.js";

export const STRING_NAMES = ["low E", "A", "D", "G", "B", "high E"];
const TOLERANCE = 0.7, // how far (semitones) a note may be from the answer: a wrong fret is 1.0 away
  TOLERANCE_TUNED = 0.45; // the same once strings are sampled, so less slack is needed

/* YIN pitch detection. Returns { f: Hz, clarity: 0..1 } or null. */
export function yinPitch(buf, sr) {
  const W = buf.length >> 1,
    tauMin = Math.max(2, Math.floor(sr / 1400)),
    tauMax = Math.min(W - 1, Math.floor(sr / 70)),
    d = new Float32Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau++) {
    let s = 0;
    for (let j = 0; j < W; j++) {
      const x = buf[j] - buf[j + tau];
      s += x * x;
    }
    d[tau] = s;
  }
  let run = 0;
  d[0] = 1;
  for (let tau = 1; tau <= tauMax; tau++) {
    run += d[tau];
    d[tau] = run ? (d[tau] * tau) / run : 1;
  }
  let tau = tauMin;
  for (; tau <= tauMax; tau++) {
    if (d[tau] < 0.15) {
      while (tau + 1 <= tauMax && d[tau + 1] < d[tau]) tau++;
      break;
    }
  }
  if (tau > tauMax) return null;
  const a = d[tau - 1],
    b = d[tau],
    c = d[Math.min(tau + 1, tauMax)],
    den = a + c - 2 * b,
    t = tau + (den ? (a - c) / (2 * den) : 0);
  return { f: sr / t, clarity: 1 - b };
}

/* Hz -> written-pitch MIDI number (+12 for guitar transposition) and how many cents off it is. */
export function freqToWritten(f) {
  const midi = 69 + 12 * Math.log2(f / 440),
    r = Math.round(midi);
  return { m: r + 12, cents: (midi - r) * 100 };
}

/* Hz -> written pitch as a fractional MIDI number. */
export const writtenPitch = (f) => 69 + 12 * Math.log2(f / 440) + 12;

/* The furthest (cents) a string may sit from standard and still be that string. It has to stay well under the 400-500
   cents between neighbours, or the next string along passes for a badly tuned one. Three semitones allows drop and
   open tunings. */
export const MAX_DETUNE = 300;
const plausible = (c) => c !== null && Number.isFinite(c) && Math.abs(c) <= MAX_DETUNE;
export const saneTuning = (tuning) => tuning.map((c) => (plausible(c) ? c : null));

/* A reading while the guided sample asks for string `asked`: { cents } to take it, or { other: s } when it is not that
   string (the wrong string was plucked, or the last one is still ringing). */
export function sampleReading(w, asked) {
  const cents = Math.round((w - OPEN[asked]) * 100);
  if (Math.abs(cents) <= MAX_DETUNE) return { cents };
  return { other: OPEN.reduce((a, o, i) => (Math.abs(w - o) < Math.abs(w - OPEN[a]) ? i : a), 0) };
}

/* Which string free tuning is hearing, or null. It goes by the string as last heard, so one tuned far from standard
   isn't mistaken for its neighbour, but only inside MAX_DETUNE of standard, so a wrong saved value can't capture it. */
export function nearestString(w, tuning) {
  const t = saneTuning(tuning || OPEN.map(() => null));
  let best = null,
    bestD = Infinity;
  OPEN.forEach((o, s) => {
    const d = Math.abs(w - o - (t[s] || 0) / 100);
    if (d < bestD && Math.abs(w - o) * 100 <= MAX_DETUNE) ((best = s), (bestD = d));
  });
  return best;
}

/* Are these readings (cents) one settled pitch? A stray reading must not go into a string's saved tuning. */
export const steady = (vals, spread = 40) => Math.max(...vals) - Math.min(...vals) <= spread;

/* How far each open string is from standard tuning, in semitones. tuning = cents per string, null if not sampled.
   Strings not sampled use the average of those that were, since a guitar is usually flat or sharp as a whole. */
export function stringOffsets(tuning) {
  const t = saneTuning(tuning || OPEN.map(() => null)),
    known = t.filter((c) => c !== null),
    mean = known.length ? known.reduce((a, c) => a + c, 0) / known.length : 0;
  return t.map((c) => (c === null ? mean : c) / 100);
}

/* Which note was played, judged relative to how the guitar is tuned. target = what is wanted: { mic(note), strings? }
   or null. Unless the target names the strings we can't tell which one was played, so try the pitch against each
   string's tuning and give the answer the benefit of the doubt if any fits. Otherwise report the nearest note. */
export function matchNote(w, tuning, target) {
  const off = stringOffsets(tuning);
  let best = null,
    bestD = (tuning || []).some((c) => c !== null) ? TOLERANCE_TUNED : TOLERANCE;
  if (target)
    off.forEach((o, s) => {
      if (target.strings && !target.strings.includes(s)) return;
      const x = w - o;
      for (const n of [Math.floor(x), Math.ceil(x)]) {
        const d = Math.abs(x - n);
        if (d <= bestD && n >= OPEN[s] && n <= OPEN[s] + 24 && target.mic(n)) {
          best = n;
          bestD = d;
        }
      }
    });
  if (best !== null) return best;
  return Math.round(w - (target && target.strings ? off[target.strings[0]] : off.reduce((a, o) => a + o, 0) / off.length));
}

/* Distance between two pitches in semitones, ignoring octaves. */
export function pitchClassGap(a, b) {
  const d = Math.abs(a - b) % 12;
  return Math.min(d, 12 - d);
}

