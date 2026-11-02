/* Learning a piece: cut it into phrases you can hold in your head, group those into short lessons, and build up to the whole thing. Pure, so Node can test it.
   A chunk is a run of whole bars. A repeat is the same notes again, so it is learned once and only played in the runs that carry it. */
import { cutPhrases } from "../core/phrases.js";
import { GUITAR_PATH } from "./path-data.js";

export { GUITAR_PATH };
const WANT = 10; // notes that make a comfortable chunk
const SITTING = 24; // new notes one lesson can take in
const SO_FAR = 24; // bars a run from the top can reasonably carry

export const notesPerSecond = (s) => +(s.sounding.length / ((s.total / s.beat) * (60 / s.tempo))).toFixed(2);
export const speedWord = (nps) => (nps < 2.5 ? "Slow" : nps < 4.5 ? "Moderate" : "Fast");

export const PATH_SONGS = GUITAR_PATH.flatMap((stage) => stage.songs.map((song) => ({ ...song, course: stage.course })));
export const stageOfCourse = (courseId) => GUITAR_PATH.find((s) => s.course === courseId) || null;
/* The next piece on the path not yet learned. */
export const nextPathSong = (learned) => PATH_SONGS.find((s) => !learned[s.id]) || null;

/* [{ from, to, first, last, same, like }]: bars from..to, sounding notes first..last, same / like = the earlier chunk it repeats or nearly repeats, or -1 */
export function chunksOf(song) {
  const bars = song.barLens.map(() => []),
    ends = song.barLens.map(() => null);
  song.notes.forEach((n) => {
    if (!n.rest) bars[n.bar].push(`${n.pitches.map((p) => p.midi).join("+")}:${n.dur}`);
    ends[n.bar] = n;
  });
  const closes = ends.map((n) => (!n || n.rest ? 1 : Math.min(1, n.dur / (2 * song.beat))));
  return cutPhrases({ bars, closes, head: song.pickup ? 1 : 0, want: WANT }).map((c) => {
    const first = song.sounding.findIndex((n) => n.bar >= c.from && n.bar <= c.to);
    if (first < 0) return { ...c, first: 0, last: -1 };
    let last = first;
    while (last + 1 < song.sounding.length && song.sounding[last + 1].bar <= c.to) last++;
    return { ...c, first, last };
  });
}

/* What there is to learn, and how it divides into sittings.
   { chunks, parts: [chunk + { i, n, notes, was }], lessons: [[part]] }: was = the number of the part it nearly repeats, or 0 */
export function lessonsOf(song) {
  const chunks = chunksOf(song),
    parts = [];
  chunks.forEach((c, i) => {
    const notes = c.last - c.first + 1;
    if (c.same >= 0 || !notes || (notes < 4 && chunks.length > 1)) return; // a few stray notes are picked up in the runs
    parts.push({ ...c, i, n: parts.length + 1, notes, was: parts.find((p) => p.i === c.like)?.n || 0 });
  });
  const lessons = [];
  let load = 0;
  for (const p of parts) {
    const cost = p.was ? p.notes / 3 : p.notes,
      now = lessons[lessons.length - 1];
    if (now && now.length < 3 && load + cost <= SITTING) {
      now.push(p);
      load += cost;
    } else {
      lessons.push([p]);
      load = cost;
    }
  }
  return { chunks, parts, lessons };
}

/* The shape of a piece, as blocks to draw: [{ from, to, bars, n, repeat }] with n the part it plays, 0 for a stray scrap */
export function formOf(song) {
  const { chunks, parts } = lessonsOf(song);
  return chunks.map((c, i) => ({ from: c.from, to: c.to, bars: c.to - c.from + 1, repeat: c.same >= 0, n: parts.find((p) => p.i === (c.same >= 0 ? c.same : i))?.n || 0 }));
}

/* The bar most likely to trip you in a part, worth its own go: much busier or jumpier than the bars around it. -1 if none stands out. */
function trickyBar(song, part) {
  const cost = new Map();
  song.sounding.slice(part.first, part.last + 1).forEach((n, k, ns) => {
    const jump = k ? Math.abs(n.midi - ns[k - 1].midi) : 0;
    cost.set(n.bar, (cost.get(n.bar) || 0) + 1 + jump / 5 + (n.pitches.length - 1) / 2);
  });
  if (song.pickup) cost.delete(0); // a pick-up bar is too little to drill alone
  for (const bar of [...cost.keys()]) if (song.sounding.filter((n) => n.bar === bar).length < 4) cost.delete(bar);
  cost.delete(song.barLens.length - 1);
  if (cost.size < 3) return -1;
  const all = [...cost.values()],
    top = Math.max(...all),
    rest = (all.reduce((a, c) => a + c, 0) - top) / (all.length - 1);
  return top >= rest * 1.6 ? [...cost].find(([, c]) => c === top)[0] : -1;
}

/* A song definition holding only bars from..to, which plays and draws like any other song. */
export function sliceDef(song, from, to) {
  const { id, title, by, level, style, key, time, tempo, source, reviewed } = song,
    bars = song.bars.split("|").map((b) => b.trim()).filter(Boolean),
    first = song.sounding.findIndex((n) => n.bar >= from),
    labels = {};
  for (const [i, t] of Object.entries(song.labels || {})) {
    const n = song.sounding[i];
    if (n && n.bar >= from && n.bar <= to) labels[i - first] = t;
  }
  return { id: `${id}@${from}-${to}`, title, by, level, style, key, time, tempo, source, reviewed, tags: [], pickup: from === 0 ? song.pickup : 0, bars: bars.slice(from, to + 1).join(" | "), labels };
}

/* The steps that take a piece from nothing to played, lesson by lesson. Each lesson opens by recalling the last one and closes by running
   everything so far, so what you know keeps growing towards the whole piece. kind: "warm" | "hear" | "wait" | "spot" | "along" | "join" | "run" | "full" */
export function coachPlan(song) {
  const fast = notesPerSecond(song) >= 4.5,
    slow = fast ? 60 : 75, // a quick tune gets a gentler first run
    ladder = fast ? [60, 80, 100] : [75, 90, 100],
    { chunks, parts, lessons } = lessonsOf(song),
    end = song.barLens.length - 1,
    total = lessons.length + 1,
    label = (g) => (g.length === 1 ? `Part ${g[0].n}` : g.length === 2 ? `Parts ${g[0].n} and ${g[1].n}` : `Parts ${g[0].n} to ${g[g.length - 1].n}`),
    steps = [];
  lessons.forEach((g, li) => {
    const tag = { lesson: li + 1, lessons: total, lessonName: label(g), parts: parts.length },
      was = li ? lessons[li - 1][lessons[li - 1].length - 1] : null;
    if (was) steps.push({ ...tag, part: was.n, from: was.from, to: was.to, kind: "warm", mode: "along", pct: slow, title: "Warm up", say: "From last time. Can you still play it?" });
    for (const p of g) {
      const part = { ...tag, part: p.n, from: p.from, to: p.to },
        whole = parts.length === 1 && p.from === 0 && p.to === end,
        spot = p.was ? -1 : trickyBar(song, p);
      steps.push({ ...part, kind: "hear", mode: "hear", pct: 75, title: "Listen", say: p.was ? `This is nearly part ${p.was} again. Listen for what changes.` : "Hear how this part goes, and follow the tab." });
      if (!p.was) steps.push({ ...part, kind: "wait", mode: "wait", pct: 75, title: "Note by note", say: "No clock. Find each note in your own time." });
      if (spot >= 0) steps.push({ ...part, from: spot, to: spot, kind: "spot", mode: "along", pct: slow, title: "The tricky bar", say: `Bar ${spot + 1} is the hard one. Get it right on its own.` });
      if (!whole) steps.push({ ...part, kind: "along", mode: "along", pct: slow, title: "In time", say: `Now with the click, at ${slow}% speed.` });
      if (p.n > 1) steps.push({ ...part, from: chunks[p.i - 1].from, kind: "join", mode: "along", pct: 75, title: "Join it on", say: "Play the part before and carry straight through this one." });
    }
    const to = g[g.length - 1].to,
      from = to < SO_FAR ? 0 : lessons[li - 1]?.[0].from ?? 0,
      lastStep = steps[steps.length - 1];
    if (li && to < end && (lastStep.from !== from || lastStep.to !== to)) steps.push({ ...tag, part: g[g.length - 1].n, from, to, kind: "run", mode: "along", pct: 75, title: from ? "The last two lessons" : "Everything so far", say: "One run, no stopping. This is the piece taking shape." });
  });
  const tag = { lesson: total, lessons: total, lessonName: "Put it together", parts: parts.length, part: 0, from: 0, to: end, kind: "full", mode: "along" };
  steps.push({ ...tag, pct: ladder[0], title: "The whole piece, slowly", say: "Start to finish at a steady speed." });
  steps.push({ ...tag, pct: ladder[1], title: "Bring it up to speed", say: `Same again at ${ladder[1]}%. Keep it relaxed.` });
  steps.push({ ...tag, pct: 100, title: "The whole piece", say: "Full speed. This is the performance." });
  return steps;
}

/* The lessons of a plan: [{ n, name, first, last, from, to }]: steps first..last, teaching bars from..to */
export function lessonsIn(plan) {
  const out = [];
  plan.forEach((st, i) => {
    let L = out[out.length - 1];
    if (!L || L.n !== st.lesson) out.push((L = { n: st.lesson, name: st.lessonName, first: i, last: i, from: st.from, to: st.to }));
    L.last = i;
    if (st.kind === "hear" || st.kind === "full") {
      if (plan[L.first].kind === "warm" && L.from === plan[L.first].from) L.from = st.from;
      L.to = Math.max(st.to, plan[L.first].kind === "warm" && L.to === plan[L.first].to ? st.to : L.to);
    }
  });
  return out;
}

export const PASS_MARK = 0.7; // share of a run that must land for it to count
export const starsFor = (acc) => (acc >= 0.9 ? 3 : acc >= 0.8 ? 2 : acc >= PASS_MARK ? 1 : 0);
