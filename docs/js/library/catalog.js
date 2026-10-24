/* The chord and scale catalogue: names, interval formulas, and builders that turn a choice into notes and tab.
   Pure (the builders take the choice as an argument), so Node can test it. */
import { S } from "../core/store.js";
import { LET, LSEM, NAMES, OPEN, RT, posAll } from "../core/theory.js";
import { CHORDDB } from "./chorddb.js";

export const KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
export const pretty = (s) => s.replace("#", "♯").replace(/b/g, (c, i) => (i === 1 && /^[A-G]/.test(s) ? "♭" : c));
export const rootOf = (k) => ({ n: pretty(k), l: LET.indexOf(k[0]), pc: (LSEM[LET.indexOf(k[0])] + (k[1] === "#" ? 1 : k[1] === "b" ? -1 : 0) + 12) % 12 });

// suffix -> [name, symbol, formula]
export const CH = {
  major: ["Major", "", "1 3 5"],
  minor: ["Minor", "m", "1 b3 5"],
  7: ["Dominant 7th", "7", "1 3 5 b7"],
  maj7: ["Major 7th", "maj7", "1 3 5 7"],
  m7: ["Minor 7th", "m7", "1 b3 5 b7"],
  sus2: ["Suspended 2nd", "sus2", "1 2 5"],
  sus4: ["Suspended 4th", "sus4", "1 4 5"],
  dim: ["Diminished", "dim", "1 b3 b5"],
  aug: ["Augmented", "aug", "1 3 #5"],
  6: ["Major 6th", "6", "1 3 5 6"],
  add9: ["Add 9", "add9", "1 3 5 9"],
  m7b5: ["Half-diminished", "m7♭5", "1 b3 b5 b7"],
  m6: ["Minor 6th", "m6", "1 b3 5 6"],
  madd9: ["Minor add 9", "madd9", "1 b3 5 9"],
  9: ["Dominant 9th", "9", "1 3 5 b7 9"],
  m9: ["Minor 9th", "m9", "1 b3 5 b7 9"],
  maj9: ["Major 9th", "maj9", "1 3 5 7 9"],
  11: ["Dominant 11th", "11", "1 3 5 b7 9 11"],
  m11: ["Minor 11th", "m11", "1 b3 5 b7 9 11"],
  maj11: ["Major 11th", "maj11", "1 3 5 7 9 11"],
  13: ["Dominant 13th", "13", "1 3 5 b7 9 13"],
  maj13: ["Major 13th", "maj13", "1 3 5 7 9 13"],
  69: ["Six-nine", "6/9", "1 3 5 6 9"],
  m69: ["Minor six-nine", "m6/9", "1 b3 5 6 9"],
  dim7: ["Diminished 7th", "dim7", "1 b3 b5 bb7"],
  "7sus4": ["7 suspended 4th", "7sus4", "1 4 5 b7"],
  aug7: ["Augmented 7th", "aug7", "1 3 #5 b7"],
  aug9: ["Augmented 9th", "aug9", "1 3 #5 b7 9"],
  "7b5": ["7♭5", "7♭5", "1 3 b5 b7"],
  "9b5": ["9♭5", "9♭5", "1 3 b5 b7 9"],
  "7b9": ["7♭9", "7♭9", "1 3 5 b7 b9"],
  "7#9": ["7♯9 (Hendrix)", "7♯9", "1 3 5 b7 #9"],
  "9#11": ["9♯11", "9♯11", "1 3 5 b7 9 #11"],
  maj7b5: ["Major 7♭5", "maj7♭5", "1 3 b5 7"],
  "maj7#5": ["Major 7♯5", "maj7♯5", "1 3 #5 7"],
  mmaj7: ["Minor-major 7th", "m(maj7)", "1 b3 5 7"],
  mmaj7b5: ["Minor-major 7♭5", "m(maj7♭5)", "1 b3 b5 7"],
  mmaj9: ["Minor-major 9th", "m(maj9)", "1 b3 5 7 9"],
  mmaj11: ["Minor-major 11th", "m(maj11)", "1 b3 5 7 9 11"],
};
export const CH_COMMON = ["major", "minor", "7", "maj7", "m7", "sus2", "sus4", "dim", "aug", "6", "add9", "m7b5"];
// slash chords ("/E", "m/B") are a major or minor chord over a bass note
export function chordInfo(suf) {
  if (CH[suf]) return { ...{ name: CH[suf][0], sym: CH[suf][1], formula: CH[suf][2] }, bass: null };
  const m = suf.match(/^(m?)\/([A-G][#b]?)$/);
  if (!m) return null;
  const base = CH[m[1] ? "minor" : "major"];
  return { name: (m[1] ? "Minor" : "Major") + " over " + pretty(m[2]), sym: m[1] + "/" + pretty(m[2]), formula: base[2], bass: m[2] };
}
export const PR_SCALES = [
  ["Major (Ionian)", "1 2 3 4 5 6 7"],
  ["Natural minor (Aeolian)", "1 2 b3 4 5 b6 b7"],
  ["Minor pentatonic", "1 b3 4 5 b7"],
  ["Major pentatonic", "1 2 3 5 6"],
  ["Blues", "1 b3 4 b5 5 b7"],
  ["Major blues", "1 2 b3 3 5 6"],
  ["Dorian", "1 2 b3 4 5 6 b7"],
  ["Phrygian", "1 b2 b3 4 5 b6 b7"],
  ["Lydian", "1 2 3 #4 5 6 7"],
  ["Mixolydian", "1 2 3 4 5 6 b7"],
  ["Locrian", "1 b2 b3 4 b5 b6 b7"],
  ["Harmonic minor", "1 2 b3 4 5 b6 7"],
  ["Melodic minor", "1 2 b3 4 5 6 7"],
  ["Phrygian dominant", "1 b2 3 4 5 b6 b7"],
  ["Lydian dominant", "1 2 3 #4 5 6 b7"],
  ["Altered", "1 b2 b3 b4 b5 b6 b7"],
  ["Whole tone", "1 2 3 #4 #5 b7"],
  ["Diminished (whole-half)", "1 2 b3 4 b5 b6 bb7 7"],
  ["Diminished (half-whole)", "1 b2 b3 3 #4 5 6 b7"],
  ["Hungarian minor", "1 2 b3 #4 5 b6 7"],
  ["Bebop dominant", "1 2 3 4 5 6 b7 7"],
];
export const DEGS = [0, 2, 4, 5, 7, 9, 11];
// one formula token -> {semis above the root, letters above the root, text}
export function token(tok) {
  const m = tok.match(/^(bb|b|#)?(\d+)$/),
    n = +m[2],
    acc = m[1] === "#" ? 1 : m[1] === "bb" ? -2 : m[1] === "b" ? -1 : 0;
  return { semis: DEGS[(n - 1) % 7] + (n > 7 ? 12 : 0) + acc, letters: n - 1, text: (m[1] || "").replace("bb", "♭♭").replace("b", "♭").replace("#", "♯") + n };
}
// the spelled name of the note `tok` above root r
export function noteName(r, tok) {
  const t = token(tok),
    li = (r.l + t.letters) % 7;
  let d = (((r.pc + t.semis - LSEM[li]) % 12) + 12) % 12;
  if (d > 6) d -= 12;
  return LET[li] + (d > 0 ? "♯".repeat(d) : d < 0 ? "♭".repeat(-d) : "");
}
export const accOf = (t) => (t.match(/♯/g) || []).length - (t.match(/♭/g) || []).length;
export function makeNote(m, t) {
  const acc = accOf(t),
    oct = Math.floor((m - acc) / 12) - 1;
  return { m, t, acc, step: oct * 7 + LET.indexOf(t[0]) };
}

/* ----- the selection as drawable columns ----- */
export const absFret = (v, s) => (v[1][s] > 0 ? v[1][s] + v[0] - 1 : v[1][s]); // absolute fret (>0), 0 open, -1 muted
export function voicings(P) {
  return (CHORDDB[KEYS[P.cRoot]] || {})[P.cSuf] || [];
}
export function voiceLabel(v) {
  const fr = v[1].map((_, s) => absFret(v, s)).filter((f) => f > 0);
  return v[0] === 1 && v[1].includes(0) ? "Open" : v[0] === 1 && !v[1].includes(0) ? "Fret " + Math.min(...fr) : "Fret " + Math.min(...fr);
}
export function buildChord(P) {
  const r = rootOf(KEYS[P.cRoot]),
    info = chordInfo(P.cSuf),
    v = voicings(P)[P.cVoice] || voicings(P)[0],
    toks = info.formula.split(" "),
    map = {};
  toks.forEach((t) => {
    const pc = (r.pc + token(t).semis) % 12;
    if (!(pc in map)) map[pc] = noteName(r, t);
  });
  if (info.bass) {
    const b = info.bass;
    map[(LSEM[LET.indexOf(b[0])] + (b[1] === "#" ? 1 : b[1] === "b" ? -1 : 0) + 12) % 12] = pretty(b);
  }
  const tab = [],
    notes = [];
  v[1].forEach((_, s) => {
    const f = absFret(v, s);
    if (f < 0) return;
    const m = OPEN[s] + f;
    tab.push([s, f]);
    notes.push(makeNote(m, map[m % 12] || NAMES[m % 12].split("/")[0]));
  });
  notes.sort((a, b) => a.m - b.m);
  return {
    kind: "chord",
    title: r.n + info.sym,
    sub: r.n + " " + info.name.toLowerCase(),
    cols: [{ notes, tab }],
    muted: v[1].map((f, s) => (f < 0 ? s : -1)).filter((s) => s >= 0),
    spelled: [...new Set(notes.map((n) => n.t))].join("  "),
    formula: toks.map((t) => token(t).text).join(" ") + (info.bass ? " / " + pretty(info.bass) : ""),
    voice: v,
  };
}
export function buildScale(P) {
  const r = RT[P.root],
    [name, formula] = PR_SCALES[P.scale],
    toks = formula.split(" ");
  let base = OPEN[0];
  while (base % 12 !== r.pc) base++;
  const up = toks.map((t) => makeNote(base + token(t).semis, noteName(r, t)));
  up.push(makeNote(base + 12, up[0].t));
  // the lowest hand position (a window of frets) that covers every note
  let pos = null;
  for (const span of [4, 5, 6, 7, 9]) {
    for (let lo = 0; lo <= 24 - span && !pos; lo++) {
      const p = up.map((n) => posAll(n.m).find(([, f]) => f >= lo && f <= lo + span));
      if (p.every(Boolean)) pos = p;
    }
    if (pos) break;
  }
  pos = pos || up.map((n) => posAll(n.m)[0]);
  const idx = up.map((_, i) => i),
    order = P.updown ? idx.concat(idx.slice(0, -1).reverse().slice(0, -1)) : idx;
  return {
    kind: "scale",
    title: `${r.n} ${name}`,
    sub: "",
    cols: order.map((i) => ({ notes: [up[i]], tab: [pos[i]] })),
    spelled: up.map((n) => n.t).join("  "),
    formula: toks.map((t) => token(t).text).join(" "),
  };
}
export const currentItem = () => (S.prac.kind === "chord" ? buildChord(S.prac) : buildScale(S.prac));

