/* Guitar motion drills: a model of how hard a change is for the hands, and a generator that builds endless
   bars of chord changes, scale runs, or both mixed, at a chosen motion level (1-5) and rhythm level (1-5).
   Pure: no DOM, no app state, and the random source is passed in, so Node can test it.

   The difficulty model (a heuristic to tune by feel, not a law):
   - chord -> chord: fingers that have to land somewhere new, plus a penalty when the whole hand shifts more than a fret,
     plus extra for starting a barre. Sliding the same shape up or down the neck is cheaper than rebuilding it.
   - note -> note: fret distance, string distance, and extra for jumps of 4+ and 7+ frets or skipping strings.
   - Motion level 1..5 is just a band of that cost. Rhythm level sets how much time you get to make each move. */
import { CHORDDB } from "../library/chorddb.js";
import { CH, KEYS, PR_SCALES, absFret, noteName, pretty, rootOf, token } from "../library/catalog.js";
import { OPEN, posAll } from "../core/theory.js";

export const TICKS = 12; // grid steps per beat: divides into eighths, triplets and sixteenths
export const BAR = 4 * TICKS;
export const BANDS = [[0, 1.6], [1.6, 2.6], [2.6, 3.8], [3.8, 5.6], [5.6, 99]];
export const MOTION_NAMES = ["Tiny", "Small", "Medium", "Big", "Huge"];
export const MOTION_HINT = [
  "Fingers barely move: shared fingers stay put, one hand position",
  "One or two fingers move, hand stays in place",
  "A whole new shape, or a jump of a few frets",
  "Rebuild the shape, start a barre, or shift the hand",
  "Barre to open and back, or long runs up and down the neck",
];
export const CHORD_RHYTHM_NAMES = ["One change a bar", "Two a bar", "Every beat", "Off-beats", "Syncopated"];
export const SCALE_RHYTHM_NAMES = ["Quarter notes", "Eighth notes", "Triplets", "Sixteenths", "Mixed speeds"];
const CHORD_RHYTHMS = [
  [[0]],
  [[0, 2]],
  [[0, 1, 2, 3]],
  [[0, 1.5, 2, 3.5], [0, 1, 2.5, 3], [0, 0.5, 2, 3]],
  [[0, 0.5, 1.5, 2, 2.5, 3.5], [0, 1, 1.5, 2, 3, 3.5], [0, 0.5, 1, 2, 2.5, 3]],
];
const SCALE_STEP = [12, 6, 4, 3]; // ticks between notes for rhythm levels 1-4 (level 5 mixes them)

/* ---------- chord shapes ---------- */
const SUFS = ["major", "minor", "7", "m7", "maj7", "sus4", "sus2", "add9"];
export const BASIC = ["major", "minor", "7"];
const fretsOf = (v) => v[1].map((_, s) => absFret(v, s));
let SHAPES = null;
export function allShapes() {
  if (SHAPES) return SHAPES;
  SHAPES = [];
  KEYS.forEach((k, ri) => {
    const r = rootOf(k);
    SUFS.forEach((suf) => {
      const vs = (CHORDDB[k] || {})[suf] || [];
      const pcs = CH[suf][2].split(" ").map((t) => (r.pc + token(t).semis) % 12);
      vs.forEach((v, vi) => {
        const frets = fretsOf(v),
          fingered = frets.map((f, s) => [s, f]).filter(([, f]) => f > 0),
          pos = fingered.length ? fingered.reduce((a, [, f]) => a + f, 0) / fingered.length : 0,
          rel = fingered.length ? Math.min(...fingered.map(([, f]) => f)) : 0;
        SHAPES.push({
          kind: "chord", id: `${k}:${suf}:${vi}`, root: ri, suf, vi, v,
          name: pretty(k) + CH[suf][1], frets, fingered, pos, pcs,
          barre: (v[3] || []).length > 0,
          open: frets.includes(0),
          // same-shape signature: used to spot "slide the whole shape" moves (only when nothing is open)
          sig: frets.includes(0) ? null : frets.map((f) => (f < 0 ? "x" : f - rel)).join(","),
          rel,
          midis: frets.map((f, s) => (f >= 0 ? OPEN[s] + f : null)).filter((m) => m !== null),
          tab: frets.map((f, s) => [s, f]).filter(([, f]) => f >= 0),
        });
      });
    });
  });
  return SHAPES;
}
const fk = (s, f) => s * 100 + f;
export function chordCost(A, B) {
  const aset = new Set(A.fingered.map(([s, f]) => fk(s, f))),
    bset = new Set(B.fingered.map(([s, f]) => fk(s, f))),
    moved = B.fingered.filter(([s, f]) => !aset.has(fk(s, f))).length,
    lifted = A.fingered.filter(([s, f]) => !bset.has(fk(s, f))).length,
    shift = Math.abs(A.pos - B.pos);
  if (A.sig && A.sig === B.sig && shift > 0) return +(1.2 + 0.6 * shift).toFixed(2);
  const base = Math.max(moved, lifted > 0 ? 0.5 : 0.3);
  return +(base + 0.7 * Math.max(0, shift - 1) + (B.barre && !A.barre ? 1.5 : 0) + (A.barre && !B.barre ? 0.5 : 0)).toFixed(2);
}

/* ---------- single notes ---------- */
export function noteCost([s1, f1], [s2, f2]) {
  const dF = f1 === 0 || f2 === 0 ? Math.min(Math.abs(f2 - f1), 2) : Math.abs(f2 - f1),
    dS = Math.abs(s2 - s1);
  return +(0.45 * dF + 0.55 * dS + (dF >= 4 ? 1 : 0) + (dF >= 7 ? 1 : 0) + (dS >= 2 ? 0.4 : 0)).toFixed(2);
}
/* cost to go between a chord and a single note, either way round */
export function mixCost(a, b) {
  if (a.kind === "chord" && b.kind === "note") return +(0.6 + 0.7 * Math.max(0, Math.abs(a.pos - b.f) - 1)).toFixed(2);
  if (a.kind === "note" && b.kind === "chord") return +(b.fingered.length * 0.6 + 0.7 * Math.max(0, Math.abs(b.pos - a.f) - 1) + (b.barre ? 1.5 : 0)).toFixed(2);
  return a.kind === "chord" ? chordCost(a, b) : noteCost([a.s, a.f], [b.s, b.f]);
}
export const levelOf = (cost) => 1 + BANDS.findIndex(([, hi]) => cost <= hi);

/* ---------- scales ---------- */
export const SCALE_CHOICES = [
  { id: "majpent", name: "Major pentatonic", idx: 3, parent: 0 },
  { id: "minpent", name: "Minor pentatonic", idx: 2, parent: 1 },
  { id: "major", name: "Major", idx: 0, parent: 0 },
  { id: "minor", name: "Natural minor", idx: 1, parent: 1 },
  { id: "blues", name: "Blues", idx: 4, parent: 1 },
  { id: "dorian", name: "Dorian", idx: 6, parent: 6 },
  { id: "mixo", name: "Mixolydian", idx: 9, parent: 9 },
];
export const scaleChoice = (id) => SCALE_CHOICES.find((s) => s.id === id) || SCALE_CHOICES[0];
const semisOf = (idx) => PR_SCALES[idx][1].split(" ").map((t) => token(t).semis % 12);
/* every scale tone between written MIDI 52 and 88, with its spelled name */
export function ladder(keyIdx, choice) {
  const r = rootOf(KEYS[keyIdx]),
    toks = PR_SCALES[choice.idx][1].split(" "),
    out = [];
  for (let m = 52; m <= 88; m++) {
    const i = toks.findIndex((t) => ((r.pc + token(t).semis) % 12) === m % 12);
    if (i >= 0) out.push({ m, name: noteName(r, toks[i]), root: i === 0 });
  }
  return out;
}
const MAXFRET = 14;
const notePos = (m) => posAll(m).filter(([, f]) => f <= MAXFRET);

/* ---------- the generator ---------- */
const pickRand = (a, r) => a[Math.floor(r() * a.length) % a.length];
function choose(cands, level, r, prefer) {
  const [lo, hi] = BANDS[level - 1],
    inBand = cands.filter((c) => c.cost >= lo - 1e-9 && c.cost <= hi);
  let pool = inBand;
  if (!pool.length) {
    const mid = (lo + Math.min(hi, lo + 3)) / 2;
    const sorted = [...cands].sort((a, b) => Math.abs(a.cost - mid) - Math.abs(b.cost - mid));
    pool = sorted.slice(0, Math.max(3, Math.ceil(sorted.length * 0.08)));
  }
  if (prefer) {
    const pref = pool.filter(prefer);
    if (pref.length) pool = pref;
  }
  return pickRand(pool, r);
}

export function makeGen(opt, r = Math.random) {
  const o = { content: "chords", motion: 2, rhythm: 2, key: -1, scale: "majpent", vocab: "basic", ...opt },
    ch = scaleChoice(o.scale),
    key = o.key >= 0 ? o.key : Math.floor(r() * 12),
    parentPcs = new Set(semisOf(ch.parent).map((s) => (rootOf(KEYS[key]).pc + s) % 12)),
    lad = ladder(key, ch),
    shapes = allShapes().filter((s) => o.vocab === "rich" || BASIC.includes(s.suf)),
    // chord pool: any chord when no key is chosen (chords only); otherwise chords built from the scale's parent key
    pool = o.key < 0 && o.content === "chords" ? shapes : shapes.filter((s) => [...s.pcs].every((p) => parentPcs.has(p)));
  const st = { n: 0, id: 0, last: null, recent: [], dir: 1, win: null, ni: -1 };

  function chordEvent(level) {
    let c;
    if (!st.last) {
      const easy = pool.filter((s) => s.pos <= 4 && s.suf !== "sus2" && s.suf !== "add9");
      c = pickRand(easy.length ? easy : pool, r);
      return { sh: c, cost: 0 };
    }
    const cands = pool.filter((s) => s.name !== (st.last.kind === "chord" ? st.last.name : "")).map((s) => ({ sh: s, cost: mixCost(st.last, s) }));
    c = choose(cands, level, r, (x) => !st.recent.includes(x.sh.name));
    return c;
  }
  function noteEvent(level, first) {
    const w = st.win,
      inWin = (f) => !w || (f >= w[0] && f <= w[1]) || (f === 0 && w[0] <= 2),
      maxLeap = [1, 2, 3, 4, 7][level - 1],
      cands = [];
    if (first || st.ni < 0) {
      lad.forEach((n, j) =>
        notePos(n.m).forEach(([s, f]) => {
          if (!inWin(f)) return;
          const cand = { kind: "note", s, f, m: n.m, name: n.name, j };
          cands.push({ n: cand, cost: st.last ? mixCost(st.last, cand) : 0 });
        }),
      );
    } else
      for (let j = Math.max(0, st.ni - maxLeap); j <= Math.min(lad.length - 1, st.ni + maxLeap); j++) {
        if (j === st.ni) continue;
        notePos(lad[j].m).forEach(([s, f]) => {
          if (!inWin(f)) return;
          cands.push({ n: { kind: "note", s, f, m: lad[j].m, name: lad[j].name, j }, cost: noteCost([st.last.s, st.last.f], [s, f]) });
        });
      }
    if (!cands.length) return null;
    // keep a direction for a while: it makes a run sound like a run
    const c = choose(cands, level, r, (x) => st.ni < 0 || first || Math.sign(x.n.j - st.ni) === st.dir || r() < 0.3);
    if (!first && st.ni >= 0) st.dir = Math.sign(c.n.j - st.ni) || st.dir;
    return c;
  }

  const startWindow = () => {
    const level = o.motion;
    if (level > 2) return (st.win = null);
    const span = level === 1 ? 3 : 4,
      base = st.last && st.last.kind === "chord" ? Math.max(0, Math.round(st.last.pos) - 1) : Math.floor(r() * 8);
    st.win = [Math.max(0, Math.min(base, 9)), Math.max(0, Math.min(base, 9)) + span];
  };
  return {
    opt: o, key, scale: ch, pool,
    nextBar() {
      const n = st.n++,
        kind = o.content === "mixed" ? (n % 2 === 0 ? "chord" : "scale") : o.content === "scales" ? "scale" : "chord",
        events = [];
      let times;
      if (kind === "chord") {
        const set = CHORD_RHYTHMS[o.rhythm - 1];
        times = pickRand(set, r).map((b) => Math.round(b * TICKS));
        for (const t of times) {
          const c = chordEvent(o.motion),
            sh = c.sh;
          events.push({ t, kind: "chord", name: sh.name, sh, v: sh.v, midis: sh.midis, tab: sh.tab, cost: c.cost, level: c.cost ? levelOf(c.cost) : 1, id: ++st.id });
          st.last = sh;
          st.recent = [sh.name, ...st.recent].slice(0, 3);
        }
      } else {
        const steps = [];
        if (o.rhythm < 5) for (let t = 0; t < BAR; t += SCALE_STEP[o.rhythm - 1]) steps.push(t);
        else for (let b = 0; b < 4; b++) {
          const d = pickRand(SCALE_STEP, r);
          for (let t = 0; t < TICKS; t += d) steps.push(b * TICKS + t);
        }
        times = steps;
        let first = !st.last || st.last.kind !== "note" || n === 0;
        if (first) {
          startWindow();
          st.ni = -1;
        }
        for (const t of times) {
          const c = noteEvent(o.motion, first);
          if (!c) break;
          st.ni = c.n.j;
          events.push({ t, kind: "note", name: c.n.name, n: c.n, m: c.n.m, s: c.n.s, f: c.n.f, midis: [c.n.m], tab: [[c.n.s, c.n.f]], cost: c.cost, level: c.cost ? levelOf(c.cost) : 1, id: ++st.id });
          st.last = c.n;
          first = false;
        }
      }
      // ticks since the previous event: the time you get to make each move
      events.forEach((e, i) => (e.since = i === 0 ? (st.prevT == null ? null : BAR - st.prevT + times[0]) : times[i] - times[i - 1]));
      if (events.length) st.prevT = events[events.length - 1].t;
      return { n, kind, events, key: pretty(KEYS[key]), scale: ch.name };
    },
  };
}

/* ---------- difficulty read-outs ---------- */
const TARGET_LOAD = 3; // cost units per second that feels like a comfortable stretch (tune by feel)
/* how hard a stretch of generated bars is at a tempo: the 90th-percentile cost per second of its moves */
export function loadOf(bars, bpm) {
  const loads = [];
  let sum = 0,
    maxCost = 0;
  for (const b of bars) for (const e of b.events) {
    if (!e.cost || !e.since) continue;
    loads.push(e.cost / ((e.since / TICKS) * (60 / bpm)));
    sum += e.cost;
    maxCost = Math.max(maxCost, e.cost);
  }
  loads.sort((a, b) => a - b);
  const peak = loads.length ? loads[Math.min(loads.length - 1, Math.floor(loads.length * 0.9))] : 0;
  return { peak: +peak.toFixed(2), meanCost: loads.length ? +(sum / loads.length).toFixed(2) : 0, maxCost, moves: loads.length };
}
export function loadWord(peak) {
  const x = peak / TARGET_LOAD;
  return x <= 0.7 ? "Warm-up" : x <= 1.1 ? "On target" : x <= 1.6 ? "Stretch" : "Brutal";
}
/* a starting tempo for these settings: generate a sample and scale the tempo so its 90th-percentile load hits the target */
export function starterTempo(opt, seed = 12345) {
  let x = seed;
  const r = () => (x = (x * 16807) % 2147483647) / 2147483647,
    g = makeGen(opt, r),
    bars = Array.from({ length: 16 }, () => g.nextBar()),
    { peak } = loadOf(bars, 60);
  return peak ? Math.max(30, Math.min(160, Math.round((TARGET_LOAD * 60) / peak / 2) * 2)) : 100;
}
/* what to tell the player about the move that is about to happen */
export function moveHint(prev, e) {
  if (!prev || !e || !e.cost) return "";
  if (e.kind === "chord" && prev.kind === "chord") {
    const A = prev.sh || prev, B = e.sh;
    const aset = new Set(A.fingered.map(([s, f]) => fk(s, f))),
      moved = B.fingered.filter(([s, f]) => !aset.has(fk(s, f))).length,
      kept = B.fingered.length - moved,
      shift = Math.round(Math.abs(A.pos - B.pos));
    if (A.sig && A.sig === B.sig) return `Slide the whole shape ${shift} fret${shift === 1 ? "" : "s"}`;
    return `${moved} finger${moved === 1 ? "" : "s"} move${moved === 1 ? "s" : ""}${kept ? `, ${kept} stay` : ""}${shift >= 2 ? `, hand moves ${shift} frets` : ""}${B.barre && !A.barre ? ", barre" : ""}`;
  }
  if (e.kind === "note" && prev.kind === "note") {
    const dF = e.f - prev.f,
      dS = e.s - prev.s;
    const f = dF === 0 ? "same fret" : `${Math.abs(dF)} fret${Math.abs(dF) === 1 ? "" : "s"} ${dF > 0 ? "up" : "down"}`,
      s = dS === 0 ? "same string" : `${Math.abs(dS)} string${Math.abs(dS) === 1 ? "" : "s"} ${dS > 0 ? "thinner" : "thicker"}`;
    return `${f}, ${s}`;
  }
  return e.kind === "chord" ? "Back to a full shape" : "Single notes now";
}
