/* Chord lessons built from a song: find the changes it actually uses, drill the ones worth drilling, then play its chords along with its tune.
   Everything comes out as an ordinary song, so it gets tab, the click and the microphone. Pure. */
import { allShapes, chordCost } from "../courses/motion.js";
import { OPEN } from "../core/theory.js";
import { chordChart, chordName, easiestCapo } from "./harmony.js";

const SHARP = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"],
  FLAT = ["C", "Db", "D", "Eb", "E", "F", "Gb", "G", "Ab", "A", "Bb", "B"],
  KEYNAME = ["C", "Db", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const STRING = ["low E", "A", "D", "G", "B", "high E"];
const HOLDS = [16, 12, 8, 6, 4, 3, 2, 1]; // lengths a held chord can be written as
const plain = (m, flats) => (flats ? FLAT : SHARP)[m % 12] + (Math.floor(m / 12) - 1);

/* The open shape everyone learns for a chord, or the lowest barre if it has none. */
export function shapeOf(root, suf, shapes = "open") {
  const lean = shapes === "barre" ? -1 : 1,
    mine = allShapes().filter((sh) => sh.root === root && sh.suf === suf).sort((a, b) => lean * (b.open - a.open || a.barre - b.barre) || a.pos - b.pos);
  if (!mine.length) throw new Error("no shape for a chord");
  return mine[0];
}
const shapeBy = (name, chart) => {
  const sp = chart.spans.find((x) => x.name === name);
  return shapeOf(sp.root, sp.suf, chart.shapes);
};

const tokensOf = (sh, flats) => {
  const notes = sh.tab.map(([s, f]) => ({ s, f, tok: plain(OPEN[s] + f, flats) }));
  return { notes, all: notes.map((n) => n.tok).join("+"), fix: notes.map((n) => `${6 - n.s}.${n.f}`).join("+") };
};
const held = (t, len) => {
  const out = [];
  for (const h of HOLDS) while (len >= h) (out.push(`${t.all}:${h}=${t.fix}`), (len -= h));
  return out;
};
const ARP = [1, 2, 3, 2];
/* Tokens for one chord over len sixteenths. */
function play(t, len, style, beat) {
  if (style === "hold") return held(t, len);
  if (style === "arp") {
    const out = [],
      upper = t.notes.slice(1);
    for (let u = 0, i = 0; u + 2 <= len; u += 2, i++) {
      const n = i === 0 ? t.notes[0] : upper[(ARP[(i - 1) % 4] + upper.length - 1) % upper.length];
      out.push(`${n.tok}:2=${6 - n.s}.${n.f}`);
    }
    if (len % 2) out.push(`r:${len % 2}`);
    return out;
  }
  const out = [];
  let left = len;
  while (left >= beat) (out.push(`${t.all}:${beat}=${t.fix}`), (left -= beat));
  return left ? [...out, ...held(t, left)] : out;
}

/* A chart ready to play: the song's chords moved to the easiest shapes, with shapes for each. */
export function chartFor(song, shapes = "open") {
  const chart = chordChart(song),
    capo = shapes === "open" ? easiestCapo(chart) : 0,
    spans = chart.spans.map((sp) => ({ ...sp, root: (sp.root - capo + 12) % 12 })),
    tonic = (spans[spans.length - 1].root + 12) % 12,
    minor = spans[spans.length - 1].suf === "minor",
    flats = capo ? [5, 10, 3, 8, 1].includes(minor ? (tonic + 3) % 12 : tonic) : chart.flats;
  spans.forEach((sp) => (sp.name = chordName(sp.root, sp.suf, flats)));
  return { ...chart, spans, capo, flats, shapes, key: KEYNAME[tonic] + (minor ? "m" : ""), names: [...new Set(spans.map((s) => s.name))] };
}

/* "ch:arp:tune" names the chords of a tune as a piece: plain, picked, or with barres. */
export function chordId(id) {
  const m = /^ch:(?:(arp|bar):)?(.+)$/.exec(String(id));
  return m ? { id: m[0], base: m[2], style: m[1] === "arp" ? "arp" : "strum", shapes: m[1] === "bar" ? "barre" : "open" } : null;
}

/* The song's chords as a piece of its own, same bars and same tune, with the melody playing behind. style: "hold" | "strum" | "arp" */
export function chordSong(song, opts = {}) {
  const { style = "strum", shapes = "open" } = opts,
    chart = opts.chart || chartFor(song, shapes),
    bars = [],
    labels = {};
  let at = 0,
    u = 0,
    count = 0,
    sp = 0;
  const tokens = chart.spans.map((x) => tokensOf(shapeOf(x.root, x.suf, chart.shapes), chart.flats));
  song.barLens.forEach((len) => {
    const out = [],
      end = u + len;
    if (u < (chart.spans[0]?.start ?? 0)) {
      const gap = Math.min(end, chart.spans[0].start) - u;
      for (const h of HOLDS) while (at < gap && gap - at >= h) (out.push(`r:${h}`), (at += h));
      u += gap;
      at = 0;
    }
    while (u < end - 1e-9) {
      while (sp + 1 < chart.spans.length && u >= chart.spans[sp + 1].start - 1e-9) sp++;
      const span = chart.spans[sp],
        stop = Math.min(end, span.start + span.len, sp + 1 < chart.spans.length ? chart.spans[sp + 1].start : Infinity),
        piece = play(tokens[sp], stop - u, style, song.beat);
      if (u <= span.start + 1e-9 || !out.length) labels[count] = span.name;
      count += piece.filter((t) => !t.startsWith("r")).length;
      out.push(...piece);
      u = stop;
    }
    bars.push(out.join(" "));
  });
  return {
    id: opts.id || `ch:${song.id}`,
    melody: song,
    title: `${song.title}: chords`,
    by: song.by,
    level: song.level,
    style: "chords",
    playStyle: style,
    key: chart.key,
    time: song.time,
    tempo: Math.min(song.tempo, 110),
    pickup: song.pickup || 0,
    tags: [],
    bars: bars.join(" | "),
    labels,
    chart,
    backing: song.sounding.map((n) => ({ u: n.start, dur: n.dur, midi: n.midi - chart.capo })),
    source: "Suggested chords, worked out from the melody. They fit the tune; they are not the composer's own.",
    reviewed: true,
  };
}

/* The changes a chart uses, most worth drilling first: [{ a, b, count, cost, tip }]. Hard changes that keep coming round pay back most. */
export function changesOf(chart) {
  const seen = new Map();
  chart.spans.slice(1).forEach((sp, i) => {
    const from = chart.spans[i].name,
      key = [from, sp.name].sort().join(">");
    if (from === sp.name) return;
    const was = seen.get(key) || { a: from, b: sp.name, count: 0 };
    was.count++;
    seen.set(key, was);
  });
  return [...seen.values()]
    .map((x) => {
      const A = shapeBy(x.a, chart),
        B = shapeBy(x.b, chart);
      return { ...x, cost: Math.max(chordCost(A, B), chordCost(B, A)), tip: anchorTip(A, B) };
    })
    .sort((p, q) => q.cost * Math.sqrt(q.count) - p.cost * Math.sqrt(p.count));
}

/* What the hand should think about in a change: the finger that can stay, or the one that leads. */
export function anchorTip(A, B) {
  const kept = A.fingered.filter(([s, f]) => B.fingered.some(([t, g]) => t === s && g === f)),
    fingers = (sh, s) => sh.v[2]?.[s],
    sameString = A.fingered.filter(([s]) => B.fingered.some(([t]) => t === s)).find(([s]) => fingers(A, s) && fingers(A, s) === fingers(B, s));
  if (kept.length) {
    const [s, f] = kept[0];
    return `Keep the ${STRING[s]} string, fret ${f} held down the whole way. ${kept.length > 1 ? `${kept.length} fingers stay put, so only` : "Only"} the others move.`;
  }
  if (sameString) return `Your ${["", "first", "second", "third", "fourth"][fingers(A, sameString[0])] || "lead"} finger stays on the ${STRING[sameString[0]]} string and slides. Let it guide the rest.`;
  const lead = B.fingered[0];
  return `Nothing stays, so move all the fingers as one. Aim for the ${STRING[lead[0]]} string, fret ${lead[1]} first.`;
}

/* Two chords back and forth. beats: how long each is held. */
export function changeDrill(chart, a, b, beats, tempo = 60) {
  const flats = chart.flats,
    [A, B] = [a, b].map((n) => shapeBy(n, chart)),
    [ta, tb] = [A, B].map((sh) => tokensOf(sh, flats)),
    per = 16 / beats,
    toks = [],
    labels = {};
  for (let i = 0; i < per; i++) {
    const t = i % 2 ? tb : ta;
    labels[i * beats] = i % 2 ? b : a;
    for (let k = 0; k < beats; k++) toks.push(`${t.all}:4=${t.fix}`);
  }
  const bars = [];
  for (let i = 0; i < toks.length; i += 4) bars.push(toks.slice(i, i + 4).join(" "));
  return { id: `ch:drill:${a}-${b}-${beats}`, title: `${a} to ${b}`, by: "Chord change", level: 2, style: "chords", key: chart.key, time: "4/4", tempo, tags: [], bars: bars.join(" | "), labels, source: "A change from the song you are learning.", reviewed: true };
}

/* Lesson by lesson, the steps that take a song's chords from new to played with the tune. Shaped like coachPlan's steps; def is what goes on the stand. */
export function chordPlan(song) {
  const { chart, playStyle } = song,
    moves = changesOf(chart).slice(0, 4).reverse(), // easiest first, so the hardest arrives when the hands are warm
    total = moves.length + 1,
    end = song.barLens.length - 1,
    steps = [];
  moves.forEach((m, i) => {
    const tag = { lesson: i + 1, lessons: total, lessonName: `${m.a} to ${m.b}`, parts: 0, part: 0, from: 0, to: 0, chords: [m.a, m.b] };
    steps.push({ ...tag, kind: "wait", mode: "wait", pct: 100, title: "Find the shapes", say: m.tip, def: changeDrill(chart, m.a, m.b, 4) });
    steps.push({ ...tag, kind: "along", mode: "along", pct: 100, title: "A bar each", say: "Land on beat one. Strum clean or late, but don't stop the click.", def: changeDrill(chart, m.a, m.b, 4, 72) });
    steps.push({ ...tag, kind: "along", mode: "along", pct: 100, title: "Two beats each", say: m.count > 1 ? `The song makes this change ${m.count} times, so it pays to make it easy.` : "Half the time to move. Start the change on the beat before.", def: changeDrill(chart, m.a, m.b, 2, 72) });
  });
  const tag = { lesson: total, lessons: total, lessonName: "Play the song", parts: 0, part: 0, from: 0, to: end, chords: chart.names, chartStep: true },
    hold = chordSong(song.melody, { style: "hold", chart, id: `${song.id}:hold` });
  steps.push({ ...tag, kind: "hear", mode: "hear", pct: 100, title: "Listen", say: "Hear the chords move under the tune.", def: hold });
  steps.push({ ...tag, kind: "wait", mode: "wait", pct: 100, title: "Chord by chord", say: "No clock. Walk through the changes in order.", def: hold });
  steps.push({ ...tag, kind: "along", mode: "along", pct: 70, title: "Slowly, with the tune", say: "One strum on each change. The melody plays over you.", def: hold });
  steps.push({ ...tag, kind: "full", mode: "along", pct: 85, title: playStyle === "arp" ? "Pick it through" : "Strum on the beat", say: playStyle === "arp" ? "Bass note first, then walk up the strings." : "A strum on every beat now." });
  steps.push({ ...tag, kind: "full", mode: "along", pct: 100, title: "The whole song", say: "Full speed, with the tune. This is the performance." });
  return steps;
}
