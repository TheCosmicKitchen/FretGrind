/* Learning a piece: cut it into chunks you can hold in your head, and walk them one at a time. Pure, so Node can test it.
   A chunk is a run of whole bars. A repeat is the same notes again, so it is learned once and only played in the full run. */
import { GUITAR_PATH } from "./path-data.js";

export { GUITAR_PATH };
const WANT = 10; // notes that make a comfortable chunk

export const PATH_SONGS = GUITAR_PATH.flatMap((stage) => stage.songs.map((song) => ({ ...song, course: stage.course })));
export const stageOfCourse = (courseId) => GUITAR_PATH.find((s) => s.course === courseId) || null;
/* The next piece on the path not yet learned. */
export const nextPathSong = (learned) => PATH_SONGS.find((s) => !learned[s.id]) || null;

function barsPerChunk(song) {
  const bars = song.barLens.length,
    perBar = song.sounding.length / bars;
  let size = [1, 2, 4, 8].find((b) => perBar * b >= WANT) || 8;
  while (size > 1 && size * 2 > bars) size /= 2; // a short tune is still worth dividing
  return size;
}

/* [{ from, to, first, last, same }]: bars from..to, sounding notes first..last, same = the earlier chunk it repeats, or -1 */
export function chunksOf(song) {
  const bars = song.barLens.length,
    size = barsPerChunk(song),
    head = song.pickup ? 1 : 0, // a pick-up belongs to the phrase it leads into
    out = [];
  for (let from = 0; from < bars; ) {
    let to = Math.min(bars - 1, (from === 0 ? head : from) + size - 1);
    if (bars - 1 - to < size / 2) to = bars - 1; // a short tail joins the chunk before it
    out.push({ from, to });
    from = to + 1;
  }
  const seen = new Map();
  return out.map((c, i) => {
    const ns = song.sounding.map((n, k) => ({ n, k })).filter(({ n }) => n.bar >= c.from && n.bar <= c.to),
      sig = ns.map(({ n }) => `${n.pitches.map((p) => p.midi).join("+")}:${n.dur}`).join(" "),
      same = ns.length && seen.has(sig) ? seen.get(sig) : -1;
    if (same < 0) seen.set(sig, i);
    return { ...c, first: ns.length ? ns[0].k : 0, last: ns.length ? ns[ns.length - 1].k : -1, same };
  });
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

/* The steps that take a piece from nothing to played. kind: "hear" | "wait" | "along" | "join" | "full" */
export function coachPlan(song) {
  const chunks = chunksOf(song),
    parts = chunks.map((c, i) => ({ ...c, i })).filter((c) => c.same < 0 && c.last >= c.first),
    steps = [];
  if (parts.length > 1)
    parts.forEach((c, n) => {
      const part = { part: n + 1, parts: parts.length, from: c.from, to: c.to };
      steps.push({ ...part, kind: "hear", mode: "hear", pct: 75, title: "Listen", say: "Hear how this part goes, and follow the tab." });
      steps.push({ ...part, kind: "wait", mode: "wait", pct: 75, title: "Note by note", say: "No clock. Find each note in your own time." });
      steps.push({ ...part, kind: "along", mode: "along", pct: 75, title: "In time", say: "Now with the click, a little slower than full speed." });
      if (n > 0) steps.push({ ...part, from: chunks[c.i - 1].from, kind: "join", mode: "along", pct: 75, title: "Join it on", say: "Play the part before and carry straight through this one." });
    });
  steps.push({ part: 0, parts: parts.length, from: 0, to: song.barLens.length - 1, kind: "full", mode: "along", pct: 75, title: "The whole piece, slowly", say: "Start to finish at a steady speed." });
  steps.push({ part: 0, parts: parts.length, from: 0, to: song.barLens.length - 1, kind: "full", mode: "along", pct: 100, title: "The whole piece", say: "Full speed. This is the performance." });
  return steps;
}

export const PASS_MARK = 0.7; // share of a run that must land for it to count
export const starsFor = (acc) => (acc >= 0.9 ? 3 : acc >= 0.8 ? 2 : acc >= PASS_MARK ? 1 : 0);
