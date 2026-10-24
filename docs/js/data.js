const NAMES = ["C", "C♯/D♭", "D", "D♯/E♭", "E", "F", "F♯/G♭", "G", "G♯/A♭", "A", "A♯/B♭", "B"];
const LET = ["C", "D", "E", "F", "G", "A", "B"],
  LSEM = [0, 2, 4, 5, 7, 9, 11],
  STAFF_NOTE = [
    ["C", 0, ""],
    ["C♯", 0, "♯"],
    ["D", 1, ""],
    ["E♭", 2, "♭"],
    ["E", 2, ""],
    ["F", 3, ""],
    ["F♯", 3, "♯"],
    ["G", 4, ""],
    ["A♭", 5, "♭"],
    ["A", 5, ""],
    ["B♭", 6, "♭"],
    ["B", 6, ""],
  ];
const OPEN = [52, 57, 62, 67, 71, 76],
  SN = ["6th (low E)", "5th (A)", "4th (D)", "3rd (G)", "2nd (B)", "1st (high e)"];
const OK = "var(--ok)",
  BAD = "var(--bad)",
  AC = "var(--ac)";
const RT = [
  ["C", 0, 0],
  ["G", 4, 7],
  ["D", 1, 2],
  ["A", 5, 9],
  ["E", 2, 4],
  ["B", 6, 11],
  ["F", 3, 5],
  ["F♯", 3, 6],
  ["B♭", 6, 10],
  ["E♭", 2, 3],
  ["A♭", 5, 8],
  ["D♭", 1, 1],
].map(([n, l, pc]) => ({ n, l, pc }));
const CQ = [
  ["", "major", [0, 2, 4], [0, 4, 7]],
  ["m", "minor", [0, 2, 4], [0, 3, 7]],
  ["7", "dom 7", [0, 2, 4, 6], [0, 4, 7, 10]],
  ["maj7", "maj 7", [0, 2, 4, 6], [0, 4, 7, 11]],
  ["m7", "min 7", [0, 2, 4, 6], [0, 3, 7, 10]],
];
const W = [0, 1, 2, 3, 4, 5, 6];
const SQ = [
  ["major", W, [0, 2, 4, 5, 7, 9, 11]],
  ["natural minor", W, [0, 2, 3, 5, 7, 8, 10]],
  ["minor pentatonic", [0, 2, 3, 4, 6], [0, 3, 5, 7, 10]],
  ["major pentatonic", [0, 1, 2, 4, 5], [0, 2, 4, 7, 9]],
  ["dorian", W, [0, 2, 3, 5, 7, 9, 10]],
  ["mixolydian", W, [0, 2, 4, 5, 7, 9, 10]],
  ["blues", [0, 2, 3, 4, 4, 6], [0, 3, 5, 6, 7, 10]],
];
const SH = {
  E: [0, 2, 2, 1, 0, 0],
  A: [-1, 0, 2, 2, 2, 0],
  D: [-1, -1, 0, 2, 3, 2],
  G: [3, 2, 0, 0, 0, 3],
  C: [-1, 3, 2, 0, 1, 0],
  Em: [0, 2, 2, 0, 0, 0],
  Am: [-1, 0, 2, 2, 1, 0],
  Dm: [-1, -1, 0, 2, 3, 1],
  E7: [0, 2, 0, 1, 0, 0],
  A7: [-1, 0, 2, 0, 2, 0],
  D7: [-1, -1, 0, 2, 1, 2],
  G7: [3, 2, 0, 0, 0, 1],
  C7: [-1, 3, 2, 3, 1, 0],
  B7: [-1, 2, 1, 2, 0, 2],
  Cmaj7: [-1, 3, 2, 0, 0, 0],
  Fmaj7: [-1, -1, 3, 2, 1, 0],
  Em7: [0, 2, 0, 0, 0, 0],
  Am7: [-1, 0, 2, 0, 1, 0],
  Dmaj7: [-1, -1, 0, 2, 2, 2],
  F: [1, 3, 3, 2, 1, 1],
  Bm: [-1, 2, 4, 4, 3, 2],
};
const DN = {
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
const rng = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i),
  nat = (m) => LSEM.includes(m % 12),
  shuf = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
const posAll = (m) => OPEN.map((o, s) => [s, m - o]).filter(([s, f]) => f >= 0 && f <= 24);
const pt = ([s, f]) => `${SN[s].split(" ")[0]} string, ${f ? "fret " + f : "open"}`;
const DK = {};
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
const TAP_SEGMENTS = [
  // no open strings in the first segment: the string names are printed on the neck
  { name: "1st–5th fret", min: 1, max: 5 },
  { name: "6th–12th fret", min: 6, max: 12 },
  { name: "13th–24th fret", min: 13, max: 24 },
];
DK.tapAll = Array.from({ length: 36 }, (_, i) => "tapAll:" + Math.floor(i / 3) + "." + (i % 3));
const CLASSICS = [
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
DK.rhythm = CLASSICS.map((_, i) => `rhythm:${i}`);
