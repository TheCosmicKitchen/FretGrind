/* Music theory data and helpers. Pure: no DOM and no app state, so Node can import it for tests. */
export const NAMES = ["C", "C♯/D♭", "D", "D♯/E♭", "E", "F", "F♯/G♭", "G", "G♯/A♭", "A", "A♯/B♭", "B"];
export const LET = ["C", "D", "E", "F", "G", "A", "B"],
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
export const OPEN = [52, 57, 62, 67, 71, 76],
  SN = ["6th (low E)", "5th (A)", "4th (D)", "3rd (G)", "2nd (B)", "1st (high e)"];
export const RT = [
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
export const CQ = [
  ["", "major", [0, 2, 4], [0, 4, 7]],
  ["m", "minor", [0, 2, 4], [0, 3, 7]],
  ["7", "dom 7", [0, 2, 4, 6], [0, 4, 7, 10]],
  ["maj7", "maj 7", [0, 2, 4, 6], [0, 4, 7, 11]],
  ["m7", "min 7", [0, 2, 4, 6], [0, 3, 7, 10]],
];
export const W = [0, 1, 2, 3, 4, 5, 6];
export const SQ = [
  ["major", W, [0, 2, 4, 5, 7, 9, 11]],
  ["natural minor", W, [0, 2, 3, 5, 7, 8, 10]],
  ["minor pentatonic", [0, 2, 3, 4, 6], [0, 3, 5, 7, 10]],
  ["major pentatonic", [0, 1, 2, 4, 5], [0, 2, 4, 7, 9]],
  ["dorian", W, [0, 2, 3, 5, 7, 9, 10]],
  ["mixolydian", W, [0, 2, 4, 5, 7, 9, 10]],
  ["blues", [0, 2, 3, 4, 4, 6], [0, 3, 5, 6, 7, 10]],
];
export const SH = {
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

export const rng = (a, b) => Array.from({ length: b - a + 1 }, (_, i) => a + i),
  nat = (m) => LSEM.includes(m % 12),
  shuf = (a) => {
    for (let i = a.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
export const posAll = (m) => OPEN.map((o, s) => [s, m - o]).filter(([s, f]) => f >= 0 && f <= 24);
export const pt = ([s, f]) => `${SN[s].split(" ")[0]} string, ${f ? "fret " + f : "open"}`;

// Spell a chord or scale: r = root {l: letter index, pc}, st = letter steps, se = semitones.
export function spell(r, st, se) {
  return st.map((s, i) => {
    const li = (r.l + s) % 7;
    let d = (((r.pc + se[i] - LSEM[li]) % 12) + 12) % 12;
    if (d > 6) d -= 12;
    return { pc: (r.pc + se[i]) % 12, t: LET[li] + (d > 0 ? "♯".repeat(d) : d < 0 ? "♭".repeat(-d) : "") };
  });
}
