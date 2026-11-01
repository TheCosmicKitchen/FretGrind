/* Learning a piano piece: each part hands apart, then together, then from the score alone.
   Pieces come from docs/lib (tools/import-music.mjs), written bar by bar as "right/left:length" steps. They arrive as
   ordinary piano lessons, so the lesson runner needs nothing special. Pure apart from the fetch. */
import { pianoNote } from "./lessons.js";
import { PIANO_PATH } from "./path-data.js";

export { PIANO_PATH };
const WANT = 16; // steps that make a comfortable part
const url = (f) => new URL(`../../lib/${f}`, import.meta.url);

const hand = (s) => (s ? s.split("+").map(pianoNote) : []);
/* one step per moment something is struck: { bar, r: [midi], l: [midi], dur (sixteenths) } */
export function stepsOf(piece) {
  return piece.bars.flatMap((b, bar) =>
    b.split(" ").map((tok) => {
      const [notes, dur] = tok.split(":"),
        [r, l] = notes.split("/");
      return { bar, r: hand(r), l: hand(l), dur: +dur };
    }),
  );
}

/* Runs of whole bars, repeats counted once: [{ from, to, steps }] */
export function partsOfPiece(piece) {
  const steps = stepsOf(piece),
    bars = piece.bars.length,
    size = Math.max(1, Math.min(8, Math.round((WANT * bars) / steps.length))),
    seen = new Set(),
    out = [];
  for (let from = 0; from < bars; from += size) {
    const to = Math.min(bars - 1, from + size - 1),
      part = steps.filter((s) => s.bar >= from && s.bar <= to),
      sig = part.map((s) => `${s.r}/${s.l}`).join(" ");
    if (seen.has(sig) || !part.length) continue;
    seen.add(sig);
    out.push({ from, to, steps: part });
  }
  return out;
}

const lessonOf = (piece, id, title, intro, steps, mode, part, parts, flats) => ({ id, title, intro, mode, parsed: steps, fing: [], flats, song: piece.id, part, parts, unit: -1, pieceTitle: piece.title });

/* The lessons that take a piece from nothing to played from the score. */
export function pieceLessons(piece) {
  const flats = /^(F|Bb|Eb|Ab|Db|Gb|Dm|Gm|Cm|Fm|Bbm)/.test(piece.key),
    parts = partsOfPiece(piece),
    out = [],
    both = (s) => [...s.r, ...s.l];
  parts.forEach((p, i) => {
    const n = i + 1,
      where = `Part ${n} of ${parts.length}, bars ${p.from + 1}–${p.to + 1}`,
      add = (key, title, intro, steps, mode) => steps.length && out.push(lessonOf(piece, `${piece.id}:${n}${key}`, `${title} · part ${n}`, intro, steps, mode, n, parts.length, flats));
    add("r", "Right hand", `${where}. The right hand alone, with the keys lit.`, p.steps.filter((s) => s.r.length).map((s) => s.r), "keys");
    add("l", "Left hand", `${where}. Now the left hand alone. It is the foundation, so give it the same care.`, p.steps.filter((s) => s.l.length).map((s) => s.l), "keys");
    add("b", "Hands together", `${where}. Both hands. Go as slowly as you need: it waits for you.`, p.steps.map(both), "keys");
  });
  const all = parts.flatMap((p) => p.steps.map(both));
  out.push(lessonOf(piece, `${piece.id}:all`, "The whole piece", "From the score alone: the keys stay dark unless you miss. Upcoming notes show on the staff, so read ahead.", all, "read", 0, parts.length, flats));
  return out;
}

let index = null;
const chunks = new Map();
export async function loadPiece(id) {
  index ||= await fetch(url("piano-index.json")).then((r) => r.json());
  const row = index.find((r) => r[0] === id);
  if (!row) return null;
  const c = row[7];
  if (!chunks.has(c)) chunks.set(c, await fetch(url(`piano-${c}.json`)).then((r) => r.json()));
  return chunks.get(c).find((p) => p.id === id) || null;
}
