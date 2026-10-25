/* Endless drills: each one makes a fresh multiple-choice question every time (the same shape as a lesson's ask()).
   Pure: no DOM, no app state. Every generator takes a random function `r()` in [0,1) so tests can run them with fixed seeds. */
import { isValid } from "../games/rhythm-patterns.js";
import { SH } from "../core/theory.js";

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"],
  LPC = [0, 2, 4, 5, 7, 9, 11];
const pick = (r, a) => a[Math.floor(r() * a.length)];
const mod = (n, m) => ((n % m) + m) % m;
export const sample = (r, a, n) => {
  const b = a.slice(),
    out = [];
  while (b.length && out.length < n) out.push(b.splice(Math.floor(r() * b.length), 1)[0]);
  return out;
};
/* Put the right answer among the wrong ones in a random place. Returns { a, c }. */
function options(r, right, wrong, n = 4) {
  const w = [...new Set(wrong)].filter((x) => x !== right);
  const a = sample(r, w, n - 1);
  const c = Math.floor(r() * (a.length + 1));
  a.splice(c, 0, right);
  return { a, c };
}
const ask = (p, o, extra = {}) => ({ p, a: o.a, c: o.c, ...extra });

/* ---------- spelling ---------- */
const acc = (n) => (n === 0 ? "" : n === 1 ? "♯" : n === 2 ? "𝄪" : n === -1 ? "♭" : n === -2 ? "𝄫" : n > 0 ? "♯".repeat(n) : "♭".repeat(-n));
/* A note is { l: letter index 0-6, a: accidental }. */
export const noteName = (n) => LETTERS[n.l] + acc(n.a);
export const notePc = (n) => mod(LPC[n.l] + n.a, 12);
/* The note `number` letters above n (1 = same letter) that is `semis` half steps higher; null when it needs more than a double accidental. */
export function above(n, number, semis) {
  const l = mod(n.l + number - 1, 7),
    a = mod(notePc(n) + semis - LPC[l] + 6, 12) - 6;
  return Math.abs(a) > 2 ? null : { l, a };
}
/* The note with the same pitch as pc but written on letter l. */
const onLetter = (pc, l) => ({ l, a: mod(pc - LPC[l] + 6, 12) - 6 });

export const INTERVALS = [
  { n: "minor 2nd", num: 2, s: 1 },
  { n: "major 2nd", num: 2, s: 2 },
  { n: "minor 3rd", num: 3, s: 3 },
  { n: "major 3rd", num: 3, s: 4 },
  { n: "perfect 4th", num: 4, s: 5 },
  { n: "tritone", num: 4, s: 6, aug: true },
  { n: "perfect 5th", num: 5, s: 7 },
  { n: "minor 6th", num: 6, s: 8 },
  { n: "major 6th", num: 6, s: 9 },
  { n: "minor 7th", num: 7, s: 10 },
  { n: "major 7th", num: 7, s: 11 },
  { n: "octave", num: 8, s: 12 },
];
const TONICS = [
  { l: 0, a: 0 }, { l: 1, a: 0 }, { l: 2, a: 0 }, { l: 3, a: 0 }, { l: 4, a: 0 }, { l: 5, a: 0 }, { l: 6, a: 0 },
  { l: 3, a: 1 }, { l: 6, a: -1 }, { l: 2, a: -1 }, { l: 5, a: -1 }, { l: 1, a: -1 }, { l: 4, a: -1 },
];
const MAJ = [0, 2, 4, 5, 7, 9, 11],
  MAJKEYS = [[0, 0], [4, 0], [1, 0], [5, 0], [2, 0], [6, 0], [3, 1], [3, 0], [6, -1], [2, -1], [5, -1], [1, -1]].map(([l, a]) => ({ l, a }));
/* The major scale from a tonic, spelled with every letter once: [{l,a} × 7]. Null if it would need triple accidentals. */
export function majorScale(t) {
  const out = [];
  for (let i = 0; i < 7; i++) {
    const n = above(t, i + 1, MAJ[i]);
    if (!n) return null;
    out.push(n);
  }
  return out;
}
const SHARPS_IN = (t) => {
  const sc = majorScale(t);
  if (!sc) return null;
  const s = sc.reduce((x, n) => x + Math.max(0, n.a), 0),
    f = sc.reduce((x, n) => x + Math.max(0, -n.a), 0);
  return s ? { sharps: s } : { flats: f };
};

/* ---------- sounds ---------- */
const root = (r, lo = 55, hi = 66) => lo + Math.floor(r() * (hi - lo + 1));
const melodic = (ms, tempo = 100) => ({ l: "▶ Listen", seq: ms, onsets: ms.map((_, i) => i), tempo });
const together = (ms) => ({ l: "▶ Listen", snd: ms, gap: 0.05 });

const CHORDS = [
  { n: "major", s: [0, 4, 7], sym: "" },
  { n: "minor", s: [0, 3, 7], sym: "m" },
  { n: "diminished", s: [0, 3, 6], sym: "dim" },
  { n: "augmented", s: [0, 4, 8], sym: "aug" },
  { n: "dominant 7th", s: [0, 4, 7, 10], sym: "7" },
  { n: "major 7th", s: [0, 4, 7, 11], sym: "maj7" },
  { n: "minor 7th", s: [0, 3, 7, 10], sym: "m7" },
];
const SCALES = [
  { n: "major", s: [0, 2, 4, 5, 7, 9, 11, 12] },
  { n: "natural minor", s: [0, 2, 3, 5, 7, 8, 10, 12] },
  { n: "harmonic minor", s: [0, 2, 3, 5, 7, 8, 11, 12] },
  { n: "dorian", s: [0, 2, 3, 5, 7, 9, 10, 12] },
  { n: "mixolydian", s: [0, 2, 4, 5, 7, 9, 10, 12] },
  { n: "major pentatonic", s: [0, 2, 4, 7, 9, 12] },
  { n: "minor pentatonic", s: [0, 3, 5, 7, 10, 12] },
];

/* ---------- the drills ---------- */
const earInterval = (r) => {
  const iv = pick(r, INTERVALS.filter((x) => !x.aug)),
    m = root(r),
    o = options(r, iv.n, INTERVALS.filter((x) => !x.aug && Math.abs(x.s - iv.s) <= 3).map((x) => x.n).concat(["perfect 5th", "major 3rd", "minor 3rd"]));
  return ask("Listen. Which interval is this (going up)?", o, { hear: melodic([m, m + iv.s], 80) });
};
const earChord = (r) => {
  const ch = pick(r, CHORDS),
    m = root(r, 52, 62),
    o = options(r, ch.n, CHORDS.map((x) => x.n));
  return ask("Listen. What kind of chord is this?", o, { hear: together(ch.s.map((x) => m + x)) });
};
const earScale = (r) => {
  const sc = pick(r, SCALES),
    m = root(r, 55, 64),
    o = options(r, sc.n, SCALES.map((x) => x.n));
  return ask("Listen. Which scale is this?", o, { hear: melodic(sc.s.map((x) => m + x), 150) });
};
const spellInterval = (r) => {
  for (let tries = 0; tries < 50; tries++) {
    const t = pick(r, TONICS),
      iv = pick(r, INTERVALS.filter((x) => !x.aug && x.num < 8)),
      up = above(t, iv.num, iv.s);
    if (!up || Math.abs(up.a) > 1) continue;
    const pc = notePc(up),
      wrong = [onLetter(pc, mod(up.l + 1, 7)), onLetter(pc, mod(up.l - 1, 7)), { l: up.l, a: up.a + 1 }, { l: up.l, a: up.a - 1 }]
        .filter((n) => Math.abs(n.a) <= 1 && noteName(n) !== noteName(up))
        .map(noteName);
    if (wrong.length < 3) continue;
    return ask(`What is a ${iv.n} above ${noteName(t)}?`, options(r, noteName(up), wrong), {
      why: `${noteName(t)} up ${iv.s} half steps, spelled on the letter ${iv.num - 1} letters on from ${LETTERS[t.l]}.`,
    });
  }
  return earInterval(r);
};
const scaleDegree = (r) => {
  const t = pick(r, MAJKEYS),
    sc = majorScale(t),
    d = 1 + Math.floor(r() * 6),
    right = noteName(sc[d]),
    wrong = [noteName(onLetter(notePc(sc[d]), mod(sc[d].l + 1, 7))), noteName(onLetter(notePc(sc[d]), mod(sc[d].l - 1, 7))), noteName(sc[(d + 1) % 7]), noteName(sc[(d + 6) % 7])];
  const ord = ["1st", "2nd", "3rd", "4th", "5th", "6th", "7th"][d];
  return ask(`What is the ${ord} note of ${noteName(t)} major?`, options(r, right, wrong), { why: sc.map(noteName).join(" ") });
};
const keySig = (r) => {
  const t = pick(r, MAJKEYS),
    k = SHARPS_IN(t),
    right = k.sharps ? `${k.sharps} sharp${k.sharps > 1 ? "s" : ""}` : k.flats ? `${k.flats} flat${k.flats > 1 ? "s" : ""}` : "no sharps or flats",
    all = ["no sharps or flats", "1 sharp", "2 sharps", "3 sharps", "4 sharps", "5 sharps", "6 sharps", "1 flat", "2 flats", "3 flats", "4 flats", "5 flats"],
    near = all.filter((x) => x !== right);
  if (r() < 0.5) return ask(`How many sharps or flats does ${noteName(t)} major have?`, options(r, right, near));
  // reverse: which key
  const keyName = noteName(t);
  return ask(`Which major key has ${right}?`, options(r, keyName, MAJKEYS.map(noteName)));
};
const chordSpell = (r) => {
  for (let tries = 0; tries < 50; tries++) {
    const t = pick(r, TONICS),
      ch = pick(r, CHORDS),
      nums = ch.s.length === 3 ? [1, 3, 5] : [1, 3, 5, 7],
      notes = ch.s.map((s, i) => above(t, nums[i], s));
    if (notes.some((n) => !n || Math.abs(n.a) > 1)) continue;
    const show = (ns) => ns.map(noteName).join(" "),
      change = (i, d) => notes.map((n, j) => (j === i ? { l: n.l, a: n.a + d } : n)),
      third = ch.s[1] === 4 ? -1 : 1,
      fifth = ch.s[2] === 7 ? 1 : -1,
      wrong = [
        show(change(1, third)),
        show(change(2, fifth)),
        notes.length === 4 ? show(change(3, ch.s[3] === 10 ? 1 : -1)) : show(change(2, -fifth)),
        show(notes.map((n, j) => (j === 1 ? onLetter(notePc(n), mod(n.l + 1, 7)) : n))),
      ].filter((w) => !/[𝄪𝄫]/.test(w));
    const right = show(notes);
    if (new Set(wrong.filter((w) => w !== right)).size < 3) continue;
    return ask(`Which notes spell ${noteName(t)}${ch.sym}?`, options(r, right, wrong), { why: `A ${ch.n} chord: ${right}.` });
  }
  return earChord(r);
};
const TRIAD_Q = ["", "m", "m", "", "", "m", "dim"],
  ROMAN = ["I", "ii", "iii", "IV", "V", "vi", "vii°"];
const roman = (r) => {
  const t = pick(r, MAJKEYS),
    sc = majorScale(t),
    d = Math.floor(r() * 7),
    chord = noteName(sc[d]) + TRIAD_Q[d];
  if (r() < 0.5) {
    const pool = ROMAN.filter((x) => x !== ROMAN[d]);
    return ask(`In ${noteName(t)} major, the chord ${chord} is…`, options(r, ROMAN[d], pool), { why: `${chord} is built on the ${d + 1}${["st", "nd", "rd", "th", "th", "th", "th"][d]} note.` });
  }
  const others = [...Array(7).keys()].filter((x) => x !== d).map((x) => noteName(sc[x]) + TRIAD_Q[x]);
  return ask(`In ${noteName(t)} major, which chord is ${ROMAN[d]}?`, options(r, chord, others));
};
const transpose = (r) => {
  const from = pick(r, MAJKEYS.slice(0, 7)),
    to = pick(r, MAJKEYS.filter((k) => noteName(k) !== noteName(from))),
    prog = pick(r, [[0, 3, 4], [0, 5, 3, 4], [0, 3, 0, 4], [1, 4, 0], [0, 4, 5, 3]]),
    a = majorScale(from),
    b = majorScale(to),
    chords = (sc) => prog.map((d) => noteName(sc[d]) + TRIAD_Q[d]).join(" – "),
    right = chords(b);
  const wrong = [chords(majorScale(pick(r, MAJKEYS))), chords(majorScale(pick(r, MAJKEYS))), chords(majorScale(pick(r, MAJKEYS))), prog.map((d) => noteName(b[(d + 1) % 7]) + TRIAD_Q[d]).join(" – ")];
  return ask(`These chords are in ${noteName(from)} major: ${chords(a)}. Move them to ${noteName(to)} major.`, options(r, right, wrong), { why: "Same numerals, new key." });
};
const nashville = (r) => {
  const t = pick(r, MAJKEYS.filter((k) => k.l !== 6 || k.a !== 0)),
    sc = majorScale(t),
    d = Math.floor(r() * 6),
    right = noteName(sc[d]) + TRIAD_Q[d],
    wrong = [0, 1, 2, 3, 4, 5].filter((x) => x !== d).map((x) => noteName(sc[x]) + TRIAD_Q[x]);
  return ask(`In the key of ${noteName(t)}, the Nashville number ${d + 1} chord is…`, options(r, right, wrong), { why: "Nashville numbers count scale degrees: 1 = the key chord, 4 = IV, 5 = V, 6m = vi." });
};
/* reading notes */
const TREBLE = ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5", "G5", "A5"],
  BASS = ["G2", "A2", "B2", "C3", "D3", "E3", "F3", "G3", "A3", "B3", "C4"];
const readNote = (r) => {
  const bass = r() < 0.4,
    n = pick(r, bass ? BASS : TREBLE),
    letter = n[0];
  return ask(`Name this note (${bass ? "bass" : "treble"} clef).`, options(r, letter, LETTERS.filter((x) => x !== letter)), {
    fig: { staff: { notes: [n], ...(bass ? { clef: "bass" } : {}) } },
    why: `${n}: letter ${letter}.`,
  });
};
/* counting rhythm */
const pattern = (r) => {
  for (let tries = 0; tries < 60; tries++) {
    let p = "",
      left = 8;
    while (left) {
      const len = pick(r, [1, 1, 2, 2, 2, 3, 4].filter((x) => x <= left)),
        rest = r() < 0.3;
      p += (rest ? "." : "x") + (rest ? "." : "-").repeat(len - 1);
      left -= len;
    }
    if (isValid(p) && p.includes("x")) return p;
  }
  return "x-x-x-x-";
};
const rhythmCount = (r) => {
  const p = pattern(r),
    notes = [...p].filter((c) => c === "x").length;
  const near = [notes - 2, notes - 1, notes + 1, notes + 2, notes + 3].filter((x) => x >= 1 && x <= 8 && x !== notes).map(String);
  return ask("How many notes are played in this bar? Rests stay silent.", options(r, String(notes), near), { fig: { rhythm: p }, why: "Count each filled note head; rests and tied-on slots add none." });
};
const beatsText = (n) => (n === 0 ? "None" : n === 0.5 ? "½ a beat" : n === 1 ? "1 beat" : Number.isInteger(n) ? `${n} beats` : `${Math.floor(n)}½ beats`);
const rhythmRests = (r) => {
  const p = pattern(r),
    rests = [...p].filter((c) => c === ".").length / 2;
  return ask("How many beats of silence are in this 4/4 bar?", options(r, beatsText(rests), [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5].map(beatsText)), { fig: { rhythm: p }, why: "Each rest slot is half a beat." });
};
/* guitar */
const KEYNAMES = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
const capoKey = (r) => {
  const shape = pick(r, ["C", "G", "D", "A", "E"]),
    fret = 1 + Math.floor(r() * 7),
    pc = mod({ C: 0, D: 2, E: 4, G: 7, A: 9 }[shape] + fret, 12),
    right = KEYNAMES[pc],
    near = [-2, -1, 1, 2, 3].map((d) => KEYNAMES[mod(pc + d, 12)]);
  return ask(`You play ${shape}-family shapes with the capo on fret ${fret}. What key does it sound in?`, options(r, right, near), { why: `${shape} + ${fret} half steps = ${right}.` });
};
const capoFret = (r) => {
  const shape = pick(r, ["C", "G", "D", "A", "E"]),
    fret = 1 + Math.floor(r() * 7),
    spc = { C: 0, D: 2, E: 4, G: 7, A: 9 }[shape],
    song = KEYNAMES[mod(spc + fret, 12)],
    right = String(fret),
    near = [fret - 2, fret - 1, fret + 1, fret + 2, 0].filter((x) => x > 0 && x <= 9 && x !== fret).map(String);
  return ask(`A song is in ${song}. You want to play ${shape}-family shapes. Which capo fret?`, options(r, right, near), { why: `${shape} up ${fret} half steps is ${song}.` });
};
const chordTones = (r) => {
  const name = pick(r, ["Em", "Am", "C", "G", "D", "A", "E", "Dm"]),
    shape = SH[name],
    fretted = shape.filter((f) => f > 0).length,
    right = String(fretted),
    near = [0, 1, 2, 3, 4].map(String);
  return ask(`How many fingers does the open ${name} chord need?`, options(r, right, near.filter((x) => x !== right)), { why: `${name}: ${shape.map((f) => (f < 0 ? "x" : f)).join(" ")} (low string first).` });
};

export const DRILLS = [
  { id: "earInterval", group: "Ear", track: "theory", title: "Hear the interval", blurb: "Name the distance between two notes you hear.", make: earInterval },
  { id: "earChord", group: "Ear", track: "theory", title: "Hear the chord", blurb: "Major, minor, diminished, augmented and sevenths.", make: earChord },
  { id: "earScale", group: "Ear", track: "theory", title: "Hear the scale", blurb: "Major, minor, modes and pentatonics.", make: earScale },
  { id: "readNote", group: "Reading", track: "theory", title: "Name the note", blurb: "Treble and bass clef, with ledger lines.", make: readNote },
  { id: "rhythmCount", group: "Reading", track: "theory", title: "Count the notes", blurb: "How many notes does this bar play?", make: rhythmCount },
  { id: "rhythmRests", group: "Reading", track: "theory", title: "Count the rests", blurb: "How many beats of silence?", make: rhythmRests },
  { id: "spellInterval", group: "Spelling", track: "theory", title: "Spell the interval", blurb: "Right letter, right accidental.", make: spellInterval },
  { id: "scaleDegree", group: "Spelling", track: "theory", title: "Scale degrees", blurb: "Which note is the 6th of E♭ major?", make: scaleDegree },
  { id: "keySig", group: "Spelling", track: "theory", title: "Key signatures", blurb: "How many sharps or flats, and which key?", make: keySig },
  { id: "chordSpell", group: "Spelling", track: "theory", title: "Spell the chord", blurb: "Triads and sevenths in any key.", make: chordSpell },
  { id: "roman", group: "Harmony", track: "theory", title: "Roman numerals", blurb: "Chord ↔ numeral in any major key.", make: roman },
  { id: "transpose", group: "Harmony", track: "theory", title: "Transpose a progression", blurb: "Move a chord sequence to a new key.", make: transpose },
  { id: "nashville", group: "Guitar", track: "guitar", title: "Nashville numbers", blurb: "Number → chord in the key you pick.", make: nashville },
  { id: "capoKey", group: "Guitar", track: "guitar", title: "Capo: what key?", blurb: "Shapes + capo fret → the key you hear.", make: capoKey },
  { id: "capoFret", group: "Guitar", track: "guitar", title: "Capo: which fret?", blurb: "Song key + shapes → capo fret.", make: capoFret },
  { id: "chordTones", group: "Guitar", track: "guitar", title: "Chord fingers", blurb: "How many fingers does this open chord need?", make: chordTones },
];
export const drillById = (id) => DRILLS.find((d) => d.id === id);
export const drillGroups = () => [...new Set(DRILLS.map((d) => d.group))];

/* n different questions from one drill (or from every drill when id is "mix"). */
export function drillQuestions(id, n = 10, r = Math.random) {
  const out = [],
    seen = new Set();
  for (let tries = 0; out.length < n && tries < n * 20; tries++) {
    const d = id === "mix" ? pick(r, DRILLS) : drillById(id);
    if (!d) return [];
    const q = d.make(r);
    const key = q.p + "|" + q.a[q.c] + JSON.stringify(q.fig || "") + JSON.stringify(q.hear ? q.hear.seq || q.hear.snd : "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(q);
  }
  return out;
}
