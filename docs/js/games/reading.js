/* Rhythm reading: lines of rhythm made up fresh, on one note, in levels that follow the rhythm course (T2): quarters, long
   notes, eighths, other meters, dots, off-beats, sixteenths, dotted eighths, compound time and triplets. Every line is
   new, so you read it rather than remember it. Pure and seeded, so Node can test it.
   A line is an ordinary song ("rr:5:41" = level 5, line 41), so the score is drawn like any piece. */
import { rng } from "../songs/groove.js";

const PITCH = "B4"; // the middle line of the treble staff
export const READ_BARS = 4;

/* cells: a beat or more of rhythm, in sixteenths ("r4" a rest, "4/3" an eighth-note triplet). Each level keeps the cells
   of the one before and adds its own; a cell listed twice comes up twice as often. */
const BASE = [[4], [4], [4], ["r4"]],
  LONG = [[8], [8], [16], [12]],
  EIGHTHS = [[2, 2], [2, 2], [2, 2]],
  DOTS = [[6, 2], [6, 2]],
  OFF = [["r2", 2], ["r2", 2], [2, 4, 2]],
  SIXTEENTHS = [[1, 1, 1, 1], [2, 1, 1], [1, 1, 2]],
  DOTTED = [[3, 1], [3, 1], [1, 2, 1], [1, 3]],
  TRIPLETS = [["4/3", "4/3", "4/3"], ["4/3", "4/3", "4/3"], ["8/3", "8/3", "8/3"]];
export const READ_LEVELS = [
  { id: 1, name: "Quarter notes", hint: "Quarter notes and quarter rests", course: "T2.1", times: ["4/4"], tempo: 72, cells: BASE },
  { id: 2, name: "Long notes", hint: "Half, dotted half and whole notes", course: "T2.2", times: ["4/4"], tempo: 76, cells: [...BASE, ...LONG] },
  { id: 3, name: "Eighth notes", hint: "Two to a beat", course: "T2.3", times: ["4/4"], tempo: 72, cells: [...BASE, ...LONG, ...EIGHTHS] },
  { id: 4, name: "Three and two beats", hint: "3/4 and 2/4", course: "T2.5", times: ["3/4", "2/4", "3/4"], tempo: 80, cells: [...BASE, ...LONG, ...EIGHTHS] },
  { id: 5, name: "Dotted quarters", hint: "Dotted quarter and eighth", course: "T2.4", times: ["4/4", "3/4"], tempo: 72, cells: [...BASE, [8], ...EIGHTHS, ...DOTS] },
  { id: 6, name: "Off the beat", hint: "Eighth rests and syncopation", course: "T2.6", times: ["4/4"], tempo: 72, cells: [...BASE, [8], ...EIGHTHS, ...DOTS, ...OFF] },
  { id: 7, name: "Sixteenth notes", hint: "Four to a beat", course: "T2.7", times: ["4/4"], tempo: 66, cells: [[4], ["r4"], [8], ...EIGHTHS, ...SIXTEENTHS, ...SIXTEENTHS] },
  { id: 8, name: "Dotted eighths", hint: "Dotted eighth and sixteenth, the snap", course: "T2.7", times: ["4/4"], tempo: 66, cells: [[4], ["r4"], ...EIGHTHS, ...SIXTEENTHS, ...DOTTED, ...OFF] },
  { id: 9, name: "Compound time", hint: "6/8: two big beats of three", course: "T2.8", times: ["6/8"], tempo: 56, cells: [[6], [6], [12], [4, 2], [4, 2], [2, 2, 2], [2, 2, 2], [3, 1, 2], [2, 4], ["r2", 2, 2], [2, "r2", 2]] },
  { id: 10, name: "Triplets", hint: "Three in the time of two", course: "T2.9", times: ["4/4"], tempo: 66, cells: [[4], ["r4"], [8], ...EIGHTHS, ...EIGHTHS, ...TRIPLETS, ...DOTS] },
];
const BAR = { "4/4": 16, "3/4": 12, "2/4": 8, "6/8": 12 },
  BEAT = { "4/4": 4, "3/4": 4, "2/4": 4, "6/8": 6 };

const len = (x) => (String(x).startsWith("r") ? +String(x).slice(1) : String(x).split("/").map(Number).reduce((a, b) => a / b));
export const spanOf = (cell) => cell.reduce((a, x) => a + len(x), 0);
/* Where a cell may start so it reads the usual way: a beat's worth on any beat, a half bar on the half, longer only at the bar. */
function fitsAt(cell, u, bar, beat) {
  const span = spanOf(cell);
  if (u + span > bar + 1e-9) return false;
  if (span <= beat) return true;
  if (span === 2 * beat && bar === 4 * beat) return u % (2 * beat) === 0;
  return u === 0;
}

/* The rhythm of a line at a level: { time, bars: [[length, ...]] } with each length a string in sixteenths ("4", "4/3") or a
   rest ("r4"). Every bar has a note in it, and the line starts with a note on the downbeat. */
export function rhythmBars(level, r, count = READ_BARS) {
  const L = READ_LEVELS.find((l) => l.id === level),
    pick = (a) => a[Math.floor(r() * a.length)],
    time = pick(L.times),
    bar = BAR[time],
    beat = BEAT[time],
    bars = [];
  while (bars.length < count) {
    const lens = [];
    let u = 0;
    while (u < bar) {
      const c = pick(L.cells.filter((c) => fitsAt(c, u, bar, beat)));
      c.forEach((x) => lens.push(String(x)));
      u += spanOf(c);
    }
    if (!lens.some((x) => !x.startsWith("r")) || (!bars.length && lens[0].startsWith("r"))) continue;
    bars.push(lens);
  }
  return { time, bars };
}

export const isReading = (id) => /^rr:\d+:\d+$/.test(String(id));
/* One line to read: a song definition, or null for a bad id. */
export function readLine(id) {
  if (!isReading(id)) return null;
  const [, lv, seed] = String(id).split(":").map(Number),
    L = READ_LEVELS.find((l) => l.id === lv);
  if (!L || seed < 1) return null;
  const { time, bars } = rhythmBars(lv, rng(seed * 97 + lv)),
    tok = (x) => (x.startsWith("r") ? `r:${x.slice(1)}` : `${PITCH}:${x}`);
  return { id, title: `${L.name}, line ${seed}`, by: L.hint, level: lv, style: "exercise", key: "C", time, tempo: L.tempo, tags: [], bars: bars.map((b) => b.map(tok).join(" ")).join(" | "), source: "A generated reading line: every one is new.", reviewed: true };
}
