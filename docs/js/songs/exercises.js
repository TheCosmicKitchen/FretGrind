/* Generated exercises: scale patterns in one hand position, and chord changes. Each comes out as an ordinary song, so it
   gets sheet music, tab, the click, Play along and Wait for me. Pure, and the same options always give the same notes.
   An exercise is named by its id ("ex:s:G:major:thirds:2:e:80"), so it can be saved and reopened like any song. */
import { KEYS, PR_SCALES, noteName, rootOf, token } from "../library/catalog.js";
import { allShapes, chordCost } from "../courses/motion.js";
import { OPEN } from "../core/theory.js";
import { keySig } from "./format.js";

export const SCALES = {
  major: { name: "Major", idx: 0, mode: "" },
  minor: { name: "Natural minor", idx: 1, mode: "m" },
  harmonic: { name: "Harmonic minor", idx: 11, mode: "m" },
  melodic: { name: "Melodic minor", idx: 12, mode: "m" },
  majpent: { name: "Major pentatonic", idx: 3, mode: "" },
  minpent: { name: "Minor pentatonic", idx: 2, mode: "m" },
  blues: { name: "Blues", idx: 4, mode: "m" },
  dorian: { name: "Dorian", idx: 6, mode: "dor" },
  phrygian: { name: "Phrygian", idx: 7, mode: "phr" },
  lydian: { name: "Lydian", idx: 8, mode: "lyd" },
  mixolydian: { name: "Mixolydian", idx: 9, mode: "mix" },
};
/* index patterns over the notes of the position: each returns the walk up; the way down mirrors it */
const seq = (n, size, fn) => Array.from({ length: Math.max(0, n - size + 1) }, (_, i) => fn(i)).flat();
export const PATTERNS = {
  straight: { name: "Up and down", walk: (n) => Array.from({ length: n }, (_, i) => i) },
  thirds: { name: "In thirds", walk: (n) => seq(n, 3, (i) => [i, i + 2]) },
  fours: { name: "Groups of four", walk: (n) => seq(n, 4, (i) => [i, i + 1, i + 2, i + 3]) },
  threes: { name: "Groups of three", walk: (n) => seq(n, 3, (i) => [i, i + 1, i + 2]) },
  triads: { name: "Broken triads", walk: (n) => seq(n, 5, (i) => [i, i + 2, i + 4]) },
  sixths: { name: "In sixths", walk: (n) => seq(n, 6, (i) => [i, i + 5]) },
};
export const RHYTHMS = {
  q: { name: "Quarter notes", len: "4", per: 1 },
  e: { name: "Eighth notes", len: "2", per: 2 },
  t: { name: "Triplets", len: "4/3", per: 3 },
  s: { name: "Sixteenths", len: "1", per: 4 },
};
export const POSITIONS = [0, 2, 3, 5, 7, 9, 12];
const SPAN = 4; // frets the hand covers in a position

export const PROGRESSIONS = {
  "I-IV-V-I": { name: "I – IV – V – I", steps: [[0, "major"], [5, "major"], [7, "major"], [0, "major"]] },
  "I-V-vi-IV": { name: "I – V – vi – IV", steps: [[0, "major"], [7, "major"], [9, "minor"], [5, "major"]] },
  "I-vi-IV-V": { name: "I – vi – IV – V", steps: [[0, "major"], [9, "minor"], [5, "major"], [7, "major"]] },
  "ii-V-I": { name: "ii – V – I", steps: [[2, "m7"], [7, "7"], [0, "maj7"], [0, "maj7"]] },
  "i-iv-V-i": { name: "i – iv – V – i (minor)", steps: [[0, "minor"], [5, "minor"], [7, "7"], [0, "minor"]] },
  blues: { name: "12-bar blues", steps: [0, 0, 0, 0, 5, 5, 0, 0, 7, 5, 0, 7].map((d) => [d, "7"]) },
  circle: { name: "Round the circle of fifths", steps: [0, 5, 10, 3, 8, 1, 6, 11, 4, 9, 2, 7].map((d) => [d, "major"]) },
  shift: { name: "One shape up the neck", steps: [0, 2, 4, 5, 7, 5, 4, 2].map((d) => [d, "major"]), slide: true },
};
export const SHAPES = { open: "Open chords", barre: "Barre chords", any: "Easiest change" };
export const STYLES = { block: "Held chords", strum: "Strum each beat", arp: "Picked arpeggio" };

const name = (s) => s.replace("♯", "#").replace("♭", "b");
/* a spelled note and its pitch -> "F#4", or null when the spelling needs a double accidental */
function pitchToken(m, spelled) {
  const t = name(spelled);
  if (!/^[A-G][#b]?$/.test(t)) return null;
  const acc = t[1] === "#" ? 1 : t[1] === "b" ? -1 : 0;
  return t + (Math.floor((m - acc) / 12) - 1);
}
const SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];
const plain = (m, flats) => (flats ? FLAT : SHARP)[m % 12] + (Math.floor(m / 12) - 1);

function safeKey(key) {
  try {
    keySig(key);
    return key;
  } catch (e) {
    return "C"; // a key signature with more than seven: accidentals on the notes read better
  }
}
const usesFlats = (key) => Object.values(keySig(key)).some((v) => v < 0);

/* The scale's notes in one hand position, lowest first, each once: { m, tok, s, f }. */
export function positionNotes(tonic, scale, pos) {
  const r = rootOf(tonic),
    toks = PR_SCALES[SCALES[scale].idx][1].split(" "),
    key = safeKey(tonic + SCALES[scale].mode),
    lo = pos === 0 ? 0 : pos - 1,
    hi = pos === 0 ? SPAN : pos + SPAN - 1,
    seen = new Map();
  OPEN.forEach((o, s) => {
    for (let f = lo; f <= hi; f++) {
      const m = o + f,
        i = toks.findIndex((t) => (r.pc + token(t).semis) % 12 === m % 12);
      if (i < 0) continue;
      // a pitch that fits on two strings goes on the higher one once this string runs out of comfortable frets
      if (!seen.has(m) || f === lo + 0) seen.set(m, { m, tok: pitchToken(m, noteName(r, toks[i])) || plain(m, usesFlats(key)), s, f, root: i === 0 });
    }
  });
  return [...seen.values()].sort((a, b) => a.m - b.m);
}

const fix = (n) => `=${6 - n.s}.${n.f}`;
/* cut a list of tokens with their lengths (in sixteenths) into 4/4 bars, closing the last bar with rests */
function toBars(toks) {
  const bars = [];
  let cur = [],
    room = 16;
  for (const [t, len] of toks) {
    cur.push(t);
    room -= len;
    if (room < 1e-6) {
      bars.push(cur.join(" "));
      cur = [];
      room = 16;
    }
  }
  if (cur.length) {
    for (const r of [8, 4, 2, 1]) while (room >= r - 1e-6) ((cur.push(`r:${r}`), (room -= r)));
    bars.push(cur.join(" "));
  }
  return bars.join(" | ");
}

export function scaleExercise({ tonic, scale, pattern, pos, rhythm, tempo }) {
  const all = positionNotes(tonic, scale, pos),
    first = all.findIndex((n) => n.root),
    last = all.length - 1 - [...all].reverse().findIndex((n) => n.root),
    use = first >= 0 && last > first ? all.slice(first, last + 1) : all,
    n = use.length,
    walked = PATTERNS[pattern].walk(n),
    up = walked.length ? walked : PATTERNS.straight.walk(n), // a pentatonic position can be too short for wide patterns
    down = up.map((i) => n - 1 - i),
    path = [...up, ...down.slice(up[up.length - 1] === down[0] ? 1 : 0)],
    R = RHYTHMS[rhythm],
    len = R.len.split("/").reduce((a, b) => a / +b),
    toks = path.map((i) => [`${use[i].tok}:${R.len}${fix(use[i])}`, len]);
  // fill the beat with the last note, then land on the root for a whole beat
  while (toks.length % R.per) toks.push([toks[toks.length - 1][0], len]);
  toks.push([`${use[0].tok}:4${fix(use[0])}`, 4]);
  return {
    id: `ex:s:${tonic}:${scale}:${pattern}:${pos}:${rhythm}:${tempo}`,
    title: `${tonic.replace("#", "♯").replace("b", "♭")} ${SCALES[scale].name.toLowerCase()}: ${PATTERNS[pattern].name.toLowerCase()}`,
    by: pos ? `Position ${pos}` : "Open position",
    level: 6,
    style: "exercise",
    key: safeKey(tonic + SCALES[scale].mode),
    time: "4/4",
    tempo,
    tags: [R.name],
    bars: toBars(toks),
    source: "Generated exercise. The fingering stays in one hand position.",
    reviewed: true,
  };
}

/* The cheapest run of voicings through the changes (the motion drills' idea of hard). */
function voiceChords(chords, shape) {
  const fits = (sh, c) => sh.root === c.root && sh.suf === c.suf,
    all = allShapes(),
    pools = chords.map((c) => {
      const mine = all.filter((sh) => fits(sh, c)),
        pick =
          shape === "open" ? mine.filter((sh) => sh.open && sh.pos <= 4) :
          shape === "barre" ? mine.filter((sh) => sh.barre || (!sh.open && sh.frets.filter((f) => f >= 0).length >= 5)) :
          mine;
      return pick.length ? pick : mine;
    });
  if (pools.some((p) => !p.length)) throw new Error("no shape for a chord");
  const best = pools.map((p) => p.map(() => ({ c: Infinity, from: -1 })));
  pools[0].forEach((p, j) => (best[0][j] = { c: p.pos * 0.1, from: -1 }));
  for (let i = 1; i < pools.length; i++)
    pools[i].forEach((p, j) =>
      pools[i - 1].forEach((q, k) => {
        const c = best[i - 1][k].c + chordCost(q, p);
        if (c < best[i][j].c) best[i][j] = { c, from: k };
      }),
    );
  let j = best[pools.length - 1].reduce((b, x, k, a) => (x.c < a[b].c ? k : b), 0);
  const out = [];
  for (let i = pools.length - 1; i >= 0; i--) {
    out[i] = pools[i][j];
    j = best[i][j].from;
  }
  return out;
}

const ARP = [0, 1, 2, 3, 2, 1]; // over the shape's own strings, low to high

export function chordExercise({ tonic, prog, shape, style, beats, tempo }) {
  const P = PROGRESSIONS[prog],
    tonicPc = rootOf(tonic).pc,
    minor = prog === "i-iv-V-i",
    key = safeKey(tonic + (minor ? "m" : "")),
    flats = usesFlats(key),
    chords = P.steps.map(([d, suf]) => ({ root: (tonicPc + d) % 12, suf })),
    voiced = voiceChords(chords, P.slide && shape === "open" ? "barre" : shape),
    toks = [],
    labels = {};
  let count = 0;
  voiced.forEach((sh) => {
    const notes = sh.tab.map(([s, f]) => ({ s, f, m: OPEN[s] + f, tok: plain(OPEN[s] + f, flats) })),
      whole = `${notes.map((n) => n.tok).join("+")}`,
      frets = notes.map((n) => `${6 - n.s}.${n.f}`).join("+"),
      add = (t, len) => (toks.push([t, len]), count++);
    labels[count] = sh.name;
    if (style === "block") add(`${whole}:${beats * 4}=${frets}`, beats * 4);
    else if (style === "strum") for (let b = 0; b < beats; b++) add(`${whole}:4=${frets}`, 4);
    else {
      const bass = notes[0],
        upper = notes.slice(-4).filter((n) => n !== bass);
      for (let e = 0; e < beats * 2; e++) {
        const n = e === 0 ? bass : upper[ARP[(e - 1) % ARP.length] % upper.length];
        add(`${n.tok}:2${fix(n)}`, 2);
      }
    }
  });
  return {
    id: `ex:c:${tonic}:${prog}:${shape}:${style}:${beats}:${tempo}`,
    title: `${P.name} in ${tonic.replace("#", "♯").replace("b", "♭")}`,
    by: SHAPES[shape],
    level: 6,
    style: "exercise",
    key,
    time: "4/4",
    tempo,
    tags: [STYLES[style], beats === 4 ? "A chord a bar" : beats === 2 ? "Two chords a bar" : "A chord a beat"],
    bars: toBars(toks),
    labels,
    source: "Generated exercise. Voicings are picked so the hand moves as little as it can between chords.",
    reviewed: true,
  };
}

/* The exercise an id names, or null. */
export function exerciseById(id) {
  const p = String(id).split(":");
  if (p[0] !== "ex") return null;
  try {
    if (p[1] === "s" && p.length === 8 && KEYS.includes(p[2]) && SCALES[p[3]] && PATTERNS[p[4]] && RHYTHMS[p[6]])
      return scaleExercise({ tonic: p[2], scale: p[3], pattern: p[4], pos: +p[5], rhythm: p[6], tempo: +p[7] });
    if (p[1] === "c" && p.length === 8 && KEYS.includes(p[2]) && PROGRESSIONS[p[3]] && SHAPES[p[4]] && STYLES[p[5]])
      return chordExercise({ tonic: p[2], prog: p[3], shape: p[4], style: p[5], beats: +p[6], tempo: +p[7] });
  } catch (e) {}
  return null;
}
