/* Grooves: generated drills that come out different every take, so a loop never turns into a recording you've memorised.
   Chord grooves walk through a key in four-bar phrases that end on real cadences, with the chords landing at varied
   times and a right hand that changes its rhythm. Scale grooves run through one hand position in mixed rhythms, in
   two-bar phrases that land the way a tune does: away from home, then home.
   Pure and seeded: the same id always gives the same notes, and the next take is the same id with the seed moved on.
   ids: "gx:c:G:maj:APHD:open:strum:sync:phrase:mix:8:72:7"  key, harmony, cadences, shapes, right hand, feel,
        how often the feel changes, how often the chords change, bars, tempo, take
        "gx:s:G:major:2:mixed:skips:8:72:7"  key, scale, position, rhythm, motion, bars, tempo, take */
import { KEYS, rootOf } from "../library/catalog.js";
import { OPEN } from "../core/theory.js";
import { POSITIONS, SCALES, SHAPES, fix, plain, positionNotes, safeKey, toBars, usesFlats, voiceChords } from "./exercises.js";

/* a small seeded generator (mulberry32): the same seed, the same take */
export function rng(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ---------- chords ---------- */
/* chords by numeral: [semitones above the tonic, quality]; next: where each tends to go; cad: the endings, by kind */
export const HARMONY = {
  maj: {
    name: "Major key",
    short: "major",
    home: "I",
    chords: { I: [0, "major"], ii: [2, "minor"], iii: [4, "minor"], IV: [5, "major"], V: [7, "major"], V7: [7, "7"], vi: [9, "minor"] },
    next: { I: ["IV", "ii", "vi", "V", "iii"], ii: ["V", "V7", "IV"], iii: ["vi", "IV"], IV: ["V", "I", "ii"], V: ["I", "vi"], V7: ["I"], vi: ["IV", "ii", "V"] },
    cad: { A: [["V", "I"], ["V7", "I"], ["IV", "V", "I"]], P: [["IV", "I"]], H: [["ii", "V"], ["IV", "V"], ["I", "V"]], D: [["V", "vi"], ["V7", "vi"]] },
  },
  min: {
    name: "Minor key",
    short: "minor",
    home: "i",
    chords: { i: [0, "minor"], iv: [5, "minor"], v: [7, "minor"], V7: [7, "7"], VI: [8, "major"], III: [3, "major"], VII: [10, "major"] },
    next: { i: ["iv", "VI", "VII", "III", "v"], iv: ["V7", "i", "VII"], v: ["VI", "iv"], V7: ["i"], VI: ["iv", "VII", "III", "V7"], III: ["VI", "iv", "VII"], VII: ["III", "i", "VI"] },
    cad: { A: [["V7", "i"], ["iv", "V7", "i"]], P: [["iv", "i"]], H: [["iv", "V7"], ["VI", "V7"], ["i", "VII", "VI", "V7"]], D: [["V7", "VI"]] },
  },
  jazz: {
    name: "Sevenths",
    short: "sevenths",
    home: "I",
    chords: { I: [0, "maj7"], ii: [2, "m7"], iii: [4, "m7"], IV: [5, "maj7"], V: [7, "7"], vi: [9, "m7"], VI7: [9, "7"] },
    next: { I: ["vi", "VI7", "ii", "IV", "iii"], ii: ["V"], iii: ["vi", "VI7"], IV: ["ii", "V", "iii"], V: ["I", "vi"], vi: ["ii", "IV"], VI7: ["ii"] },
    cad: { A: [["ii", "V", "I"], ["V", "I"]], P: [["IV", "I"]], H: [["I", "ii", "V"], ["IV", "V"]], D: [["ii", "V", "vi"]] },
  },
};
export const CADENCES = {
  A: { name: "Perfect", says: "a perfect cadence", blurb: "V to I: the full stop" },
  P: { name: "Plagal", says: "a plagal cadence", blurb: "IV to I: the amen" },
  H: { name: "Half", says: "a half cadence", blurb: "ends on V: a comma" },
  D: { name: "Deceptive", says: "a deceptive cadence", blurb: "V to vi: the surprise" },
};
/* how often the chords change, as each bar's split in sixteenths; "push" moves some changes an eighth early */
export const HARM = {
  bar: { name: "Every bar", splits: [[16]] },
  half: { name: "Twice a bar", splits: [[8, 8]] },
  mix: { name: "Mixed", splits: [[16], [16], [8, 8], [12, 4]] },
  push: { name: "Mixed, pushed", splits: [[16], [16], [8, 8], [12, 4]], push: 0.35 },
  busy: { name: "Busy, pushed", splits: [[8, 8], [4, 4, 8], [8, 4, 4], [12, 4], [4, 4, 4, 4]], push: 0.3 },
};
/* the right hand's rhythm: where it strikes in a bar, in sixteenths */
export const FEELS = {
  even: { name: "Straight", level: 4, pats: [[0, 8], [0, 4, 8, 12], [0, 4, 8, 12, 14], [0, 4, 6, 8, 12], [0, 2, 4, 6, 8, 10, 12, 14]] },
  sync: { name: "Syncopated", level: 5, pats: [[0, 4, 6, 10, 12, 14], [0, 6, 12], [0, 6, 8, 12], [0, 6, 10, 12], [0, 4, 6, 10], [0, 2, 6, 8, 12, 14], [0, 6, 8, 14]] },
  funk: { name: "Sixteenths", level: 6, pats: [[0, 3, 6, 8, 11, 14], [0, 2, 3, 6, 8, 10, 11, 14], [0, 3, 6, 10, 12], [0, 6, 7, 10, 12, 15], [0, 2, 4, 7, 8, 10, 12, 15]] },
};
export const VARY = { take: "Same all take", phrase: "Each phrase", bar: "Every bar" };
export const HANDS = { strum: "Strum", bass: "Bass and strum", pick: "Picked" };
const ARPS = [[0, 1, 2, 3], [0, 2, 1, 3], [0, 1, 2, 1], [2, 1, 0, 1], [0, 1, 2, 3, 2, 1]];
export const LENGTHS = [4, 8, 16];

/* a length in sixteenths as a note that reads cleanly plus rests to fill the gap */
const NOTE_LENS = [16, 12, 8, 6, 4, 3, 2, 1],
  REST_LENS = [8, 4, 2, 1];
function restsOf(len) {
  const out = [];
  for (const r of REST_LENS) while (len >= r) ((out.push(r), (len -= r)));
  return out;
}
function noteAndRests(len) {
  const n = NOTE_LENS.find((l) => l <= len);
  return [n, restsOf(len - n)];
}

/* The chords of one four-bar phrase: [{ num, len }] with the cadence at the end. */
function phraseChords(H, kind, r, first) {
  const pick = (a) => a[Math.floor(r() * a.length)],
    lens = [0, 1, 2].flatMap(() => pick(HARM[first.harm].splits)).concat([16]),
    n = lens.length,
    cads = H.cad[kind].filter((c) => c.length <= n),
    cad = pick(cads.length ? cads : H.cad.A),
    nums = [];
  if (n > cad.length) nums.push(first.open || r() < 0.6 ? H.home : pick(H.next[H.home]));
  while (nums.length < n - cad.length) {
    const prev = nums[nums.length - 1],
      last = nums.length === n - cad.length - 1,
      opts = H.next[prev].filter((x) => x !== prev && !(last && x === cad[0]));
    nums.push(opts.length ? pick(opts) : Object.keys(H.chords).find((x) => x !== prev && x !== cad[0]));
  }
  nums.push(...cad);
  return { kind, cad, slots: nums.map((num, i) => ({ num, len: lens[i] })) };
}

export function chordGroove({ tonic, harmony, cads, shape, hand, feel, vary, harm, len, tempo, seed }) {
  const r = rng(seed),
    pick = (a) => a[Math.floor(r() * a.length)],
    H = HARMONY[harmony],
    key = safeKey(tonic + (harmony === "min" ? "m" : "")),
    flats = usesFlats(key),
    tonicPc = rootOf(tonic).pc,
    kinds = [...cads],
    phrases = [];
  for (let p = 0; p < len / 4; p++) {
    const lastOne = p === len / 4 - 1,
      prev = phrases[p - 1]?.kind,
      fresh = kinds.filter((k) => k !== prev),
      kind = lastOne && kinds.includes("A") ? "A" : pick(fresh.length ? fresh : kinds);
    phrases.push(phraseChords(H, kind, r, { harm, open: p === 0 }));
  }
  // lay the chords end to end, then push some changes an eighth early (never the very first)
  const slots = phrases.flatMap((ph) => ph.slots);
  let at = 0;
  slots.forEach((sl) => ((sl.start = at), (at += sl.len)));
  const total = at;
  slots.forEach((sl, i) => {
    sl.end = i + 1 < slots.length ? slots[i + 1].start : total;
  });
  if (HARM[harm].push)
    for (let i = 1; i < slots.length; i++)
      if (slots[i].start % 16 === 0 && slots[i - 1].end - slots[i - 1].start >= 8 && r() < HARM[harm].push) {
        slots[i].start -= 2;
        slots[i].pushed = true;
        slots[i - 1].end -= 2;
      }
  const voiced = voiceChords(slots.map((sl) => ({ root: (tonicPc + H.chords[sl.num][0]) % 12, suf: H.chords[sl.num][1] })), shape),
    pats = FEELS[feel].pats,
    toks = [],
    labels = {};
  let count = 0,
    pat = pick(pats),
    arp = pick(ARPS);
  const add = (t, l) => (toks.push([t, l]), t.startsWith("r:") || count++);
  for (let bar = 0; bar < total / 16; bar++) {
    if (vary === "bar" || (vary === "phrase" && bar % 4 === 0 && bar)) ((pat = pick(pats)), (arp = pick(ARPS)));
    const b0 = bar * 16,
      finalBar = bar === total / 16 - 1;
    slots.forEach((sl, si) => {
      const a = Math.max(sl.start, b0),
        e = Math.min(sl.end, b0 + 16);
      if (a >= e) return;
      // where the hand strikes: the pattern, plus the change itself; after a push the downbeat is left ringing
      let on = finalBar ? [a] : pat.map((u) => b0 + u).filter((u) => u >= a && u < e);
      if (sl.start === a && !on.includes(a)) on.unshift(a);
      if (!finalBar && sl.pushed && sl.start < b0 && on[0] === b0) on.shift();
      const sh = voiced[si],
        notes = sh.tab.map(([s, f]) => ({ s, f, m: OPEN[s] + f, tok: plain(OPEN[s] + f, flats) })),
        chordTok = (ns) => `${ns.map((n) => n.tok).join("+")}:%=${ns.map((n) => `${6 - n.s}.${n.f}`).join("+")}`,
        upper = notes.slice(1);
      restsOf((on[0] ?? e) - a).forEach((l) => add(`r:${l}`, l)); // the rest before a late strike, or a bar left ringing
      on.forEach((u, k) => {
        const gap = (on[k + 1] ?? e) - u,
          [nl, rests] = noteAndRests(gap),
          first = u === sl.start,
          bassHit = first || (u - b0) % 8 === 0;
        if (first) labels[count] = sh.name;
        let t;
        if (hand === "strum" || !upper.length) t = chordTok(notes);
        else if (hand === "bass") t = bassHit ? chordTok([!first && (u - b0) % 16 === 8 && notes.length > 3 ? notes[1] : notes[0]]) /* the bass alternates on beat 3 */ : chordTok(upper);
        else t = chordTok([first ? notes[0] : upper[arp[k % arp.length] % upper.length]]);
        add(t.replace("%", nl), nl);
        rests.forEach((l) => add(`r:${l}`, l));
      });
    });
  }
  const names = [...new Set(voiced.map((sh) => sh.name))],
    ends = phrases.map((ph) => `${CADENCES[ph.kind].name.toLowerCase()} (${ph.cad.join("–")})`),
    told = ends.length === 1 ? `the phrase ends on ${CADENCES[phrases[0].kind].says} (${phrases[0].cad.join("–")})` : `the phrases end: ${ends.join(", ")}`;
  return {
    id: `gx:c:${tonic}:${harmony}:${cads}:${shape}:${hand}:${feel}:${vary}:${harm}:${len}:${tempo}:${seed}`,
    title: `${tonic.replace("#", "♯").replace("b", "♭")} ${H.short} groove, take ${seed}`,
    by: `${HANDS[hand]} · ${FEELS[feel].name.toLowerCase()} · ${HARM[harm].name.toLowerCase()}`,
    level: FEELS[feel].level,
    style: "exercise",
    key,
    time: "4/4",
    tempo,
    tags: [FEELS[feel].name, HARM[harm].name, ...kinds.map((k) => CADENCES[k].name)],
    bars: toBars(toks),
    labels,
    chordNames: names,
    groove: { cadences: phrases.map((ph) => ({ kind: ph.kind, nums: ph.cad })), numerals: slots.map((sl) => sl.num) },
    story: `In this take ${told}.`,
    source: "A generated groove: every take is new. Voicings are picked so the hand moves as little as it can.",
    reviewed: true,
  };
}

/* ---------- scales ---------- */
/* rhythm cells, one or two beats long: numbers are sixteenths, "r2" an eighth rest, "4/3" an eighth-note triplet */
export const SFEELS = {
  even: { name: "Quarters and eighths", level: 4, cells: [[4], [2, 2], [2, 2], [4]] },
  mixed: { name: "Mixed", level: 5, cells: [[4], [2, 2], [3, 1], [2, 1, 1], [1, 1, 2], ["4/3", "4/3", "4/3"]] },
  sync: { name: "Syncopated", level: 6, cells: [[2, 2], [3, 1], ["r2", 2], [2, 4, 2], [6, 2], [3, 3, 2], [2, 1, 1]] },
  busy: { name: "Sixteenths", level: 6, cells: [[1, 1, 1, 1], [2, 1, 1], [1, 1, 2], [1, 2, 1], [3, 1], ["4/3", "4/3", "4/3"]] },
};
export const MOTIONS = { steps: "By step", skips: "Steps and skips", seq: "Sequences" };
const SEQS = [[0, 2], [0, 1, 2], [0, 1, 2, 3], [0, 2, 4], [0, 1, -1]]; // thirds, threes, fours, broken triads, turns
const cellLen = (c) => c.reduce((a, x) => a + (String(x).startsWith("r") ? +String(x).slice(1) : eval1(x)), 0);
const eval1 = (x) => String(x).split("/").map(Number).reduce((a, b) => a / b);

export function scaleGroove({ tonic, scale, pos, feel, motion, len, tempo, seed }) {
  const r = rng(seed),
    pick = (a) => a[Math.floor(r() * a.length)],
    all = positionNotes(tonic, scale, pos),
    top = all.length - 1,
    roots = all.map((n, i) => (n.root ? i : -1)).filter((i) => i >= 0),
    has = (semi) => all.some((n) => n.semi === semi),
    away = has(7) ? 7 : has(2) ? 2 : 4, // where an open phrase lands: the fifth if the scale has one
    toks = [];
  let at = roots[0] ?? 0,
    begun = false, // the first note is the root itself
    dir = 1,
    seq = null,
    seqAt = 0,
    base = at;
  const nearest = (semi) => all.reduce((b, n, i) => (n.semi === semi && (b < 0 || Math.abs(i - at) < Math.abs(b - at)) ? i : b), -1),
    note = (i, l) => toks.push([`${all[i].tok}:${l}${fix(all[i])}`, eval1(l)]),
    bounce = (i) => {
      if (i < 0 || i > top) ((dir = -dir), (i = Math.max(0, Math.min(top, at + dir))));
      return i;
    };
  const clamp = (i) => Math.max(0, Math.min(top, i)),
    seqNext = () => {
      if (seqAt >= seq.length) ((seqAt = 0), (base += dir));
      let i = base + dir * seq[seqAt];
      if (i < 0 || i > top) {
        // off the end of the position: turn round and start the figure again from where the hand is
        dir = -dir;
        base = clamp(at + dir);
        seqAt = 0;
        i = base;
      }
      seqAt++;
      return clamp(i);
    };
  const step = () => {
    if (!begun) return ((begun = true), at);
    if (motion === "seq") {
      let i = seqNext();
      if (i === at) i = seqNext(); // never the note just played: a figure starting where the last one stopped moves on
      return (at = i);
    }
    if (r() < 0.18) dir = -dir;
    const size = motion === "skips" ? (r() < 0.28 ? 2 : r() < 0.06 ? 3 : 1) : 1;
    return (at = bounce(at + dir * size));
  };
  const phrases = len / 2;
  for (let p = 0; p < phrases; p++) {
    const last = p === phrases - 1;
    if (motion === "seq") ((seq = pick(SEQS)), (seqAt = 0), (base = at));
    // six beats of tune, then the landing: away from home on odd phrases, home on even ones and at the end
    let u = 0;
    while (u < 24) {
      const fits = SFEELS[feel].cells.filter((c) => cellLen(c) <= 24 - u && (u % 16) + cellLen(c) <= 16), // a cell never crosses the bar line
        cell = pick(fits.length ? fits : [[4]]);
      for (const x of cell)
        if (String(x).startsWith("r")) toks.push([`r:${String(x).slice(1)}`, +String(x).slice(1)]);
        else note(step(), String(x));
      u += cellLen(cell);
    }
    const land = nearest(last || p % 2 ? 0 : away);
    at = land >= 0 ? land : at;
    note(at, last ? "8" : "4");
    if (!last) {
      if (r() < 0.5) toks.push(["r:4", 4]);
      else (toks.push(["r:2", 2]), note(step(), "2")); // a pick-up into the next phrase
    }
  }
  const S0 = SCALES[scale];
  return {
    id: `gx:s:${tonic}:${scale}:${pos}:${feel}:${motion}:${len}:${tempo}:${seed}`,
    title: `${tonic.replace("#", "♯").replace("b", "♭")} ${S0.name.toLowerCase()} groove, take ${seed}`,
    by: `${pos ? `Position ${pos}` : "Open position"} · ${SFEELS[feel].name.toLowerCase()} · ${MOTIONS[motion].toLowerCase()}`,
    level: SFEELS[feel].level,
    style: "exercise",
    key: safeKey(tonic + S0.mode),
    time: "4/4",
    tempo,
    tags: [SFEELS[feel].name, MOTIONS[motion]],
    bars: toBars(toks),
    source: "A generated groove: every take is new. Each two-bar phrase lands like a tune: away from home, then home. The fingering stays in one hand position.",
    reviewed: true,
  };
}

/* ---------- ids ---------- */
const int = (v, lo, hi) => /^\d+$/.test(v) && +v >= lo && +v <= hi;
export const isGroove = (id) => String(id).startsWith("gx:");
export function grooveById(id) {
  const p = String(id).split(":");
  if (p[0] !== "gx") return null;
  try {
    if (p[1] === "c" && p.length === 13 && KEYS.includes(p[2]) && HARMONY[p[3]] && /^(?!.*(.).*\1)[APHD]{1,4}$/.test(p[4]) && SHAPES[p[5]] && HANDS[p[6]] && FEELS[p[7]] && VARY[p[8]] && HARM[p[9]] && LENGTHS.includes(+p[10]) && int(p[11], 30, 240) && int(p[12], 1, 1e9))
      return chordGroove({ tonic: p[2], harmony: p[3], cads: p[4], shape: p[5], hand: p[6], feel: p[7], vary: p[8], harm: p[9], len: +p[10], tempo: +p[11], seed: +p[12] });
    if (p[1] === "s" && p.length === 10 && KEYS.includes(p[2]) && SCALES[p[3]] && POSITIONS.includes(+p[4]) && SFEELS[p[5]] && MOTIONS[p[6]] && LENGTHS.includes(+p[7]) && int(p[8], 30, 240) && int(p[9], 1, 1e9))
      return scaleGroove({ tonic: p[2], scale: p[3], pos: +p[4], feel: p[5], motion: p[6], len: +p[7], tempo: +p[8], seed: +p[9] });
  } catch (e) {}
  return null;
}
/* the same groove, the next take */
export const nextTake = (id) => String(id).replace(/:(\d+)$/, (_, n) => `:${+n + 1}`);
