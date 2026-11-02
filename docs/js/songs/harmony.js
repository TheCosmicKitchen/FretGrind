/* Chords for a tune that came without any. Pure.
   Most of the library is a bare melody, so we work out chords the way a player would by ear: for each bar or half bar, which chord of the key
   fits the notes that matter, moving through the key in a way that sounds natural (a Viterbi search), and using the fewest different chords
   that fit. Strong beats and long notes count most, passing notes hardly at all. These are suggested chords, not the composer's. */
const PC = { C: 0, "C#": 1, Db: 1, D: 2, "D#": 3, Eb: 3, E: 4, F: 5, "F#": 6, Gb: 6, G: 7, "G#": 8, Ab: 8, A: 9, "A#": 10, Bb: 10, B: 11 };
const SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"];

const c = (deg, d, suf, fn) => ({ deg, d, suf, fn }); // fn: T tonic, S on the way, D wanting to go home
const I = c("I", 0, "major", "T"), IV = c("IV", 5, "major", "S"), V = c("V", 7, "major", "D"), vi = c("vi", 9, "minor", "T"), ii = c("ii", 2, "minor", "S"), iii = c("iii", 4, "minor", "T");
const i_ = c("i", 0, "minor", "T"), iv = c("iv", 5, "minor", "S"), v_ = c("v", 7, "minor", "D"), III = c("III", 3, "major", "T"), VI = c("VI", 8, "major", "S"), VII = c("VII", 10, "major", "D");
/* scale, and the sets of chords to try, smallest first */
const MODES = {
  major: { scale: [0, 2, 4, 5, 7, 9, 11], sets: [[I, V], [I, IV, V], [I, IV, V, vi], [I, IV, V, vi, ii], [I, IV, V, vi, ii, iii]] },
  minor: { scale: [0, 2, 3, 5, 7, 8, 10, 11], sets: [[i_, V], [i_, iv, V], [i_, iv, V, VII, III], [i_, iv, V, VII, III, VI]] },
  mix: { scale: [0, 2, 4, 5, 7, 9, 10], sets: [[I, VII], [I, IV, VII], [I, IV, VII, v_], [I, IV, VII, v_, ii]] },
  dor: { scale: [0, 2, 3, 5, 7, 9, 10], sets: [[i_, VII], [i_, IV, VII], [i_, IV, VII, III], [i_, IV, VII, III, v_]] },
};
const PCS = { major: [0, 4, 7], minor: [0, 3, 7], 7: [0, 4, 7, 10] };
const FITS = 0.74; // share of the notes that matter a set of chords must cover

export const chordName = (root, suf, flats) => (flats ? FLAT : SHARP)[root] + (suf === "minor" ? "m" : suf === "7" ? "7" : "");

function modeOf(key) {
  const m = /^([A-G][#b]?)(m|dor|phr|lyd|mix|loc)?$/.exec(key) || [];
  return { tonic: PC[m[1]] ?? 0, mode: { m: "minor", phr: "minor", loc: "minor", dor: "dor", mix: "mix" }[m[2]] || "major" };
}
const flatKey = (key) => /b/.test(key) || /^(F|Dm|Gm|Cm|Fm)$/.test(key);

/* How well each chord could go next. A dominant wants home; going backwards from one sounds wrong. */
function flow(a, b) {
  if (a === b) return 0;
  const step = a.fn + b.fn;
  return { TS: 0.05, SD: 0.12, DT: 0.18, TD: 0, ST: -0.02, DS: -0.3, TT: -0.12, SS: -0.08, DD: -0.3 }[step] ?? 0;
}

/* The notes that matter in each slot of the piece: [{ pc, w }] */
function slotsOf(song) {
  const head = song.pickup || 0,
    halves = ["4/4", "2/2", "6/8", "C", "C|"].includes(song.time) ? 2 : ["12/8"].includes(song.time) ? 4 : 1,
    len = song.bar / halves,
    count = Math.ceil((song.total - head) / len - 1e-9),
    slots = Array.from({ length: Math.max(1, count) }, () => []);
  for (const n of song.sounding) {
    const at = n.start - head;
    if (at < 0) continue;
    const i = Math.min(slots.length - 1, Math.floor(at / len + 1e-9)),
      strong = at % song.bar < 1e-9 ? 3 : at % len < 1e-9 ? 2 : at % song.beat < 1e-9 ? 1.4 : 0.6,
      w = strong * Math.min(2, Math.sqrt(n.dur / 2));
    for (const p of n.pitches) slots[i].push({ pc: p.midi % 12, w: w / n.pitches.length });
  }
  return { slots, len, head, halves };
}

function solve(slots, set, tonic, scale, halves) {
  const inScale = new Set(scale.map((d) => (tonic + d) % 12)),
    weights = slots.map((s) => s.reduce((a, x) => a + x.w, 0) || 1),
    gain = (slot, ch, k) => {
      const root = (tonic + ch.d) % 12,
        tones = PCS[ch.suf].map((p) => (root + p) % 12);
      return slot.reduce((a, x) => a + x.w * (x.pc === root ? 1.15 : tones.includes(x.pc) ? 1 : inScale.has(x.pc) ? -0.25 : -0.6), 0) / weights[k];
    },
    best = slots.map(() => set.map(() => ({ c: -Infinity, from: -1 })));
  set.forEach((ch, j) => (best[0][j] = { c: gain(slots[0], ch, 0) + (j === 0 ? 0.25 : 0), from: -1 }));
  for (let k = 1; k < slots.length; k++)
    set.forEach((ch, j) => {
      const here = gain(slots[k], ch, k),
        midBar = k % halves !== 0;
      set.forEach((was, w) => {
        const v = best[k - 1][w].c + here + flow(was, ch) - (was !== ch ? (midBar ? 0.3 : 0.08) : 0);
        if (v > best[k][j].c) best[k][j] = { c: v, from: w };
      });
    });
  let j = 0; // every tune here ends at home
  const path = new Array(slots.length);
  for (let k = slots.length - 1; k >= 0; k--) {
    path[k] = j;
    j = best[k][j].from;
  }
  const strong = slots.flat().filter((x) => x.w >= 1.4),
    tonesAt = path.map((p) => {
      const ch = set[p],
        root = (tonic + ch.d) % 12;
      return PCS[ch.suf].map((x) => (root + x) % 12);
    });
  let hit = 0,
    all = 0;
  slots.forEach((s, k) => s.forEach((x) => { if (x.w >= 1.4) ((all += x.w), tonesAt[k].includes(x.pc) && (hit += x.w)); }));
  return { path, fit: all ? hit / all : strong.length ? 0 : 1 };
}

/* { spans: [{ start, len, root, suf, deg, name }], fit, names, moves, flats }: the chord at each stretch of the piece, in sixteenths */
export function chordChart(song) {
  const { tonic, mode } = modeOf(song.key),
    M = MODES[mode],
    { slots, len, head, halves } = slotsOf(song),
    flats = flatKey(song.key);
  let found = null;
  for (const set of M.sets) {
    const r = solve(slots, set, tonic, M.scale, halves);
    found = { ...r, set };
    if (r.fit >= FITS) break;
  }
  const spans = [];
  found.path.forEach((p, k) => {
    const ch = found.set[p],
      start = head + k * len,
      prev = spans[spans.length - 1];
    if (prev && prev.deg === ch.deg) prev.len += len;
    else spans.push({ start, len, root: (tonic + ch.d) % 12, suf: ch.suf, deg: ch.deg });
  });
  const tail = spans[spans.length - 1];
  tail.len = Math.max(0, song.total - tail.start);
  // a dominant whose seventh is in the tune is a dominant seventh
  for (const sp of spans) {
    if (sp.deg !== "V") continue;
    const seventh = (sp.root + 10) % 12,
      inside = song.sounding.filter((n) => n.start >= sp.start && n.start < sp.start + sp.len);
    if (inside.some((n) => n.dur >= 2 && n.midi % 12 === seventh)) sp.suf = "7";
  }
  if (spans.some((sp) => sp.deg === "V" && sp.suf === "7")) spans.forEach((sp) => sp.deg === "V" && (sp.suf = "7")); // one shape for the dominant is enough to learn
  spans.forEach((sp) => (sp.name = chordName(sp.root, sp.suf, flats)));
  return { spans, fit: +found.fit.toFixed(2), names: [...new Set(spans.map((s) => s.name))], moves: Math.max(0, spans.length - 1), flats };
}

/* What it costs a beginner to hold each open chord. Anything missing needs a barre. */
const EASY = { Em: 0, Am: 0.2, E: 0.3, E7: 0.4, A: 0.5, A7: 0.5, D: 0.5, Dm: 0.8, C: 0.8, G: 0.8, D7: 0.8, G7: 1, B7: 1.2, C7: 1.2, F: 2.5 };
/* The capo fret that lets the chart use the easiest open shapes: { capo, shift } (play everything shift semitones lower, in shapes). */
export function easiestCapo(chart) {
  if (chart.spans.every((sp) => (EASY[chordName(sp.root, sp.suf, false)] ?? 5) < 2)) return 0; // already in open shapes: a capo would only get in the way
  let best = { capo: 0, cost: Infinity };
  for (let capo = 0; capo <= 7; capo++) {
    const cost = chart.spans.reduce((a, sp) => a + (EASY[chordName((sp.root - capo + 12) % 12, sp.suf, false)] ?? 5), 0) / chart.spans.length + capo * 0.12;
    if (cost < best.cost - 1e-9) best = { capo, cost };
  }
  return best.capo;
}
