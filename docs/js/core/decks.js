/* The flash-card decks (every card is a string "deck:id") and the fretboard regions. */
import { S } from "./store.js";
import { OPEN, SH, CQ, RT, SQ, rng, posAll } from "./theory.js";

export const DN = {
  interval: "Intervals",
  staff: "Staff → Note",
  staffFret: "Tap One · Staff → Fret",
  fretNote: "Fret → Note",
  findFret: "Tap One · Note → Fret",
  tapAll: "Tap All · Fretboard",
  chord: "Chord shapes",
  spellChord: "Chord spelling",
  spellScale: "Scale spelling",
};
export const DK = {};
// Start at the lowest guitar note (written E3 = MIDI 52): lower pitches have no fretboard position.
const stv = rng(OPEN[0], 88).sort((a, b) => Math.abs(a - 64) - Math.abs(b - 64));
DK.staff = stv.map((m) => "staff:" + m);
DK.staffFret = stv.map((m) => "staffFret:" + m);
// No open-string cards: the string names are printed on the neck, so open notes would give themselves away.
DK.fretNote = rng(1, 24).flatMap((f) => rng(0, 5).map((s) => `fretNote:${s}.${f}`));
DK.findFret = [0, 2, 4, 5, 7, 9, 11, 1, 3, 6, 8, 10].flatMap((p) =>
  rng(0, 5)
    .filter((s) => OPEN[s] % 12 !== p) // skip "find E on the E string": the answer would be the open string
    .map((s) => `findFret:${p}.${s}`),
);
DK.chord = Object.keys(SH).map((n) => "chord:" + n);
DK.spellChord = CQ.flatMap((_, q) => RT.map((_, r) => `spellChord:${r}.${q}`));
DK.spellScale = SQ.flatMap((_, q) => RT.map((_, r) => `spellScale:${r}.${q}`));
// The neck is cut into four 6-fret regions. Open strings (fret 0) are left out: their names are printed on the neck.
export const REGIONS = [
  { id: "open", name: "Open", min: 1, max: 6 },
  { id: "mid", name: "Mid", min: 7, max: 12 },
  { id: "high", name: "High", min: 13, max: 18 },
  { id: "top", name: "Top", min: 19, max: 24 },
];
// Tap All asks about one region at a time.
export const TAP_SEGMENTS = REGIONS.map((r) => ({ id: r.id, name: `${r.name} · frets ${r.min}–${r.max}`, min: r.min, max: r.max }));
DK.tapAll = Array.from(
  { length: 12 * TAP_SEGMENTS.length },
  (_, i) => "tapAll:" + Math.floor(i / TAP_SEGMENTS.length) + "." + (i % TAP_SEGMENTS.length),
);
export const CLASSICS = [
  {
    title: "Symphony No. 5 · Beethoven",
    notes: [67, 67, 67, 63],
    beats: [0, 0.55, 1.1, 1.9],
    interval: "Major 3rd down",
  },
  {
    title: "Ode to Joy · Beethoven",
    notes: [64, 64, 65, 67, 67, 65, 64, 62],
    beats: [0, 1, 2, 3, 4, 5, 6, 7],
    interval: "Minor 2nd up",
  },
  {
    title: "Eine kleine Nachtmusik · Mozart",
    notes: [67, 74, 67, 74, 67, 71, 74],
    beats: [0, 1, 2, 3, 4, 5, 6],
    interval: "Perfect 5th up",
  },
];
DK.interval = CLASSICS.map((_, i) => `interval:${i}`);

/* ---- Practice regions ---------------------------------------------------------------------------
   S.regions lists the region ids being practised; empty (or all four) means the whole board. */
export const activeRegions = () => {
  const ids = S.regions || [],
    r = REGIONS.filter((x) => ids.includes(x.id));
  return r.length < REGIONS.length ? r : [];
};
export const fretOk = (f) => {
  const r = activeRegions();
  return !r.length || r.some((x) => f >= x.min && f <= x.max);
};
export const regionSpan = () => {
  const r = activeRegions();
  return r.length ? [r[0].min, r[r.length - 1].max] : null;
};
// Does card k fall inside the regions being practised?
export function cardInRegion(k) {
  if (!activeRegions().length) return true;
  const i = k.indexOf(":"),
    d = k.slice(0, i),
    id = k.slice(i + 1);
  if (d === "fretNote") return fretOk(+id.split(".")[1]);
  if (d === "findFret") {
    const [p, s] = id.split(".").map(Number);
    return rng(1, 24).some((f) => fretOk(f) && (OPEN[s] + f) % 12 === p);
  }
  if (d === "staff" || d === "staffFret") return posAll(+id).some(([, f]) => f > 0 && fretOk(f));
  if (d === "tapAll") return activeRegions().includes(REGIONS[+id.split(".")[1]]);
  return true;
}
export const deckKeys = (d) => (DK[d] || []).filter(cardInRegion);


// The deck groups shown as chips on the Flash Cards page.
export const GR = {
  Reading: ["staff"],
  Fretboard: ["staffFret", "fretNote", "findFret"],
  "Tap all": ["tapAll"],
  Chords: ["chord", "spellChord"],
  Scales: ["spellScale"],
  Listening: ["interval"],
};
