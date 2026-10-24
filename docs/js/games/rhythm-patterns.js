/* Rhythm game data and maths. Pure (no DOM, no audio), so Node can test it.

   A pattern is one 4/4 bar written on an eighth-note grid of 8 slots (2 per beat):
     x  a note starts here      -  the note keeps sounding      .  rest
   "x-x-x-x-" is four quarter notes; "x--xx--x" is dotted quarter, eighth, dotted quarter, eighth. */

export const SLOTS = 8;

export const LEVELS = [
  { id: 1, name: "Steady quarters", hint: "Quarter notes and quarter rests", patterns: ["x-x-x-x-", "x-x-x-..", "x-x-..x-", "x-..x-x-", "x-..x-.."] },
  { id: 2, name: "Longer notes", hint: "Half notes and a dotted half", patterns: ["x---x-x-", "x-x-x---", "x-----x-", "x---x---", "x-x---x-"] },
  { id: 3, name: "Eighth notes", hint: "Two taps per beat", patterns: ["xxxxxxxx", "x-xxx-xx", "xxx-xxx-", "x-x-xxxx", "xxxxx-x-", "xxx-x-xx"] },
  { id: 4, name: "Off the beat", hint: "Eighth rests: tap only the 'and'", patterns: ["x-.xx-.x", ".xx-.xx-", "x-.x.xx-", ".x.x.x.x", "xx.xxx.x"] },
  { id: 5, name: "Dotted & syncopated", hint: "Notes that lean across the beat", patterns: ["x--xx--x", "x--xx-x-", "x-x--x--", "x--x--x-", "x--x-x-x"] },
];

const NOTE_LENGTHS = [1, 2, 3, 4, 6, 8]; // eighth, quarter, dotted quarter, half, dotted half, whole

/* Is this a well-formed pattern (right length, holds only after a note, only notatable lengths)? */
export function isValid(p) {
  if (typeof p !== "string" || p.length !== SLOTS || /[^x\-.]/.test(p)) return false;
  if (p[0] === "-" || /\.-/.test(p)) return false;
  return parse(p).every((e) => e.type === "rest" || NOTE_LENGTHS.includes(e.len));
}

/* Turn a pattern into notes and rests: [{ type: "note"|"rest", slot, len }]. */
export function parse(p) {
  const out = [];
  for (let i = 0; i < p.length; ) {
    if (p[i] === "x") {
      let len = 1;
      while (p[i + len] === "-") len++;
      out.push({ type: "note", slot: i, len });
      i += len;
    } else {
      // a run of rests: quarter rests where they line up with a beat, eighth rests otherwise
      let j = i;
      while (p[j] === ".") j++;
      for (let s = i; s < j; ) {
        const len = s % 2 === 0 && j - s >= 2 ? 2 : 1;
        out.push({ type: "rest", slot: s, len });
        s += len;
      }
      i = j;
    }
  }
  return out;
}

/* Slots where the player has to tap. */
export const onsets = (p) => parse(p).filter((e) => e.type === "note").map((e) => e.slot);

/* Pairs of eighth notes inside one beat are beamed together: [[slotA, slotB], ...]. */
export function beams(p) {
  const n = parse(p).filter((e) => e.type === "note" && e.len === 1),
    slots = new Set(n.map((e) => e.slot));
  return n.filter((e) => e.slot % 2 === 0 && slots.has(e.slot + 1)).map((e) => [e.slot, e.slot + 1]);
}

/* A random pattern of this level that is not `not` (when there is a choice). */
export function pickPattern(level, not, rand = Math.random) {
  const L = LEVELS.find((l) => l.id === level) || LEVELS[0],
    pool = L.patterns.filter((p) => p !== not);
  return (pool.length ? pool : L.patterns)[Math.floor(rand() * (pool.length || L.patterns.length))];
}

/* ---- grading ---- */
export const PERFECT_MS = 45,
  GOOD_MS = 90,
  MAX_WINDOW_MS = 170;

/* How close a tap must be to count: at most 170 ms, and never more than 40% of the gap between notes. */
export function windowFor(expected) {
  let gap = Infinity;
  for (let i = 1; i < expected.length; i++) gap = Math.min(gap, expected[i] - expected[i - 1]);
  return Math.min(MAX_WINDOW_MS, gap * 0.4);
}

/* Match taps to the notes they were aiming at.
   expected / taps: times in ms on one clock; win: the window from windowFor().
   Each note takes the closest tap inside its window; leftover taps are "extra" (tapped on a rest, or twice).
   Returns { notes: [{ delta, pts }], extras, pts, max, accuracy } where delta = tap minus note (negative = early). */
export function gradeTaps(expected, taps, win) {
  const used = new Set(),
    notes = expected.map((t) => {
      let best = -1;
      taps.forEach((tp, i) => {
        if (used.has(i)) return;
        const d = Math.abs(tp - t);
        if (d <= win && (best < 0 || d < Math.abs(taps[best] - t))) best = i;
      });
      if (best < 0) return { delta: null, pts: 0 };
      used.add(best);
      const delta = taps[best] - t,
        a = Math.abs(delta);
      return { delta, tap: best, pts: a <= PERFECT_MS ? 3 : a <= GOOD_MS ? 2 : 1 };
    }),
    extras = taps.map((_, i) => i).filter((i) => !used.has(i)),
    got = notes.reduce((s, n) => s + n.pts, 0),
    max = 3 * expected.length,
    pts = Math.max(0, got - extras.length);
  return { notes, extras, pts, max, accuracy: max ? pts / max : 0 };
}

export const stars = (acc) => (acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : acc >= 0.4 ? 1 : 0);

/* Average early/late of the taps that landed, in ms (negative = rushing). */
export function bias(notes) {
  const d = notes.filter((n) => n.delta !== null).map((n) => n.delta);
  return d.length ? d.reduce((a, b) => a + b, 0) / d.length : 0;
}
