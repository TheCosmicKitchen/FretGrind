/* Reading on the guitar: a ladder of short tunes to read from the staff, one level per stage of the path. Notes come in the
   order guitar methods teach them (the top strings first, then down to the low E, then keys with sharps and flats, then
   positions up the neck) and the rhythms follow Read the rhythm, a step or two behind, so the eyes only learn one new
   thing at a time. Every line is new, so it is read, not remembered. Pure and seeded, so Node can test it.
   ids: "rd:3:41" = level 3, line 41. */
import { rng } from "./groove.js";
import { SCALES, fix, positionNotes, safeKey } from "./exercises.js";
import { READ_LEVELS, rhythmBars } from "../games/reading.js";

/* keys: [tonic, scale, hand position]; top: the strings in use, counted from the high E; rhythm: Read the rhythm levels */
export const LADDER = [
  { name: "The top two strings", notes: "E, F, G on the high E string; B, C, D on the B string", keys: [["C", "major", 0]], top: 2, rhythm: [1], tempo: 60, leap: 2 },
  { name: "Adding the G string", notes: "G and A on the G string", keys: [["C", "major", 0]], top: 3, rhythm: [1, 2], tempo: 60, leap: 2 },
  { name: "Adding the D string", notes: "D, E and F on the D string", keys: [["C", "major", 0], ["A", "minor", 0]], top: 4, rhythm: [2, 3], tempo: 60, leap: 2 },
  { name: "All six strings", notes: "the A and low E strings: first position complete", keys: [["C", "major", 0], ["A", "minor", 0]], top: 6, rhythm: [3, 4], tempo: 63, leap: 3 },
  { name: "Sharps: G and D major", notes: "F♯ and C♯", keys: [["G", "major", 0], ["D", "major", 0], ["E", "minor", 0]], top: 6, rhythm: [3, 5], tempo: 63, leap: 3 },
  { name: "Flats: F major and D minor", notes: "B♭", keys: [["F", "major", 0], ["D", "minor", 0], ["G", "major", 0]], top: 6, rhythm: [5, 6], tempo: 66, leap: 3 },
  { name: "Second position", notes: "frets 1 to 5, the hand moved up", keys: [["D", "major", 2], ["A", "major", 2], ["B", "minor", 2]], top: 6, rhythm: [5, 6], tempo: 66, leap: 3 },
  { name: "Fifth position", notes: "frets 4 to 8", keys: [["A", "minor", 5], ["C", "major", 5], ["F", "major", 5]], top: 6, rhythm: [6, 7], tempo: 66, leap: 3 },
  { name: "Seventh position", notes: "frets 6 to 10", keys: [["E", "minor", 7], ["G", "major", 7], ["D", "major", 7]], top: 6, rhythm: [7, 8], tempo: 66, leap: 4 },
  { name: "Anywhere, any time", notes: "positions 2 to 9, compound time and triplets", keys: [["B", "minor", 7], ["E", "major", 9], ["Bb", "major", 5], ["A", "major", 2]], top: 6, rhythm: [9, 10], tempo: 66, leap: 4 },
];
export const LADDER_BARS = 4;

/* The notes a key can use at a level: the scale in its hand position, on the strings the level has reached. */
export const ladderPool = (lv, [tonic, scale, pos]) => positionNotes(tonic, scale, pos).filter((n) => n.s >= 6 - LADDER[lv - 1].top);

export const isLadder = (id) => /^rd:\d+:\d+$/.test(String(id));
export const ladderLevel = (id) => (isLadder(id) ? +String(id).split(":")[1] : 0);
/* the next line at the same level */
export const nextLine = (id) => String(id).replace(/:(\d+)$/, (_, n) => `:${+n + 1}`);

/* One line to read: a song definition, or null for a bad id. The tune starts and ends at home, moves mostly by step and
   keeps going the way it set off, with a skip now and then. */
export function ladderLine(id) {
  if (!isLadder(id)) return null;
  const [, lv, seed] = String(id).split(":").map(Number),
    L = LADDER[lv - 1];
  if (!L || seed < 1) return null;
  const r = rng(seed * 131 + lv),
    pick = (a) => a[Math.floor(r() * a.length)],
    key = pick(L.keys),
    pool = ladderPool(lv, key),
    roots = pool.map((n, i) => (n.root ? i : -1)).filter((i) => i >= 0),
    rl = pick(L.rhythm),
    { time, bars } = rhythmBars(rl, r, LADDER_BARS),
    notes = bars.flat().filter((x) => !x.startsWith("r")).length;
  let at = roots[Math.floor(roots.length / 2)] ?? 0,
    dir = r() < 0.5 ? -1 : 1,
    k = 0;
  const step = () => {
    if (k++ === 0) return at;
    if (k === notes) return (at = roots.reduce((b, i) => (Math.abs(i - at) < Math.abs(b - at) ? i : b), roots[0])); // home to finish
    if (r() < 0.25) dir = -dir;
    const size = r() < 0.7 ? 1 : 2 + Math.floor(r() * (L.leap - 1));
    let to = at + dir * size;
    if (to < 0 || to >= pool.length) ((dir = -dir), (to = at + dir * size));
    return (at = Math.max(0, Math.min(pool.length - 1, to)));
  };
  const tok = (x) => {
    if (x.startsWith("r")) return `r:${x.slice(1)}`;
    const n = pool[step()];
    return `${n.tok}:${x}${fix(n)}`;
  };
  const [tonic, scale, pos] = key;
  return {
    id,
    title: `Reading level ${lv}, line ${seed}`,
    by: `${pos ? `Position ${pos}` : "First position"} · ${READ_LEVELS.find((l) => l.id === rl).name.toLowerCase()}`,
    level: lv,
    style: "exercise",
    key: safeKey(tonic + SCALES[scale].mode),
    time,
    tempo: L.tempo,
    tags: [],
    bars: bars.map((b) => b.map(tok).join(" ")).join(" | "),
    source: "A generated reading line: every one is new. The tab is there to check yourself afterwards, not to read from.",
    reviewed: true,
  };
}
