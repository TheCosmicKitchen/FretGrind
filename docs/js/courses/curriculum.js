/* The two tracks, their courses and lessons, and how a course turns into nodes on the path map.
   Pure: no DOM, no app state. Each course lives in its own file under guitar/ or theory/. */
import { T1 } from "./theory/t1.js";
import { T2 } from "./theory/t2.js";
import { T3 } from "./theory/t3.js";
import { T4 } from "./theory/t4.js";
import { T5 } from "./theory/t5.js";
import { T6 } from "./theory/t6.js";
import { T7 } from "./theory/t7.js";
import { soon } from "./dsl.js";
import { G1 } from "./guitar/g1.js";
import { G2 } from "./guitar/g2.js";
import { G3 } from "./guitar/g3.js";
import { G4 } from "./guitar/g4.js";
import { G5 } from "./guitar/g5.js";
import { G6 } from "./guitar/g6.js";
import { G7 } from "./guitar/g7.js";
import { G8 } from "./guitar/g8.js";
import { G9 } from "./guitar/g9.js";

export const TRACKS = [
  {
    id: "guitar",
    name: "Guitar",
    icon: "🎸",
    blurb: "From holding the guitar to folk songs and chord changes.",
    courses: [
      G1, G2, G3, G4, G5, G6, G7, G8, G9,
      soon("G10", "Folk songs, start to finish", "A repertoire of public-domain folk songs with chords, arrangement and fingerpicking.", "Coming soon"),
    ],
  },
  {
    id: "theory",
    name: "Music theory",
    icon: "🎼",
    blurb: "Notes, rhythm, scales, keys and chords. Works without a guitar.",
    courses: [
      T1, T2, T3, T4, T5, T6, T7,
      soon("T8", "Modes and richer harmony", "Dorian, mixolydian and friends, secondary dominants, borrowed chords, extensions.", "Coming soon"),
    ],
  },
];

export const CHECKPOINT_EVERY = 3; // a checkpoint test after every third lesson
export const CHECKPOINT_Q = 10;
export const CHECKPOINT_PASS = 8;
export const COURSE_Q = 20;
export const COURSE_PASS = 16;

export const track = (id) => TRACKS.find((t) => t.id === id);
export const courseOf = (trackId, courseId) => track(trackId)?.courses.find((c) => c.id === courseId);
export const written = (c) => c.lessons.length > 0;

/* The nodes of a course in path order:
   { kind: "lesson", id, i, lesson } | { kind: "cp", id, from, to } (a checkpoint over lessons from..to) | { kind: "test", id } (the course test) */
export function nodesOf(course) {
  const out = [],
    n = course.lessons.length;
  if (!n) return out;
  let from = 0;
  course.lessons.forEach((lesson, i) => {
    out.push({ kind: "lesson", id: lesson.id, i, lesson });
    if ((i + 1) % CHECKPOINT_EVERY === 0 && i + 1 < n) {
      out.push({ kind: "cp", id: `${course.id}.c${(i + 1) / CHECKPOINT_EVERY}`, from, to: i });
      from = i + 1;
    }
  });
  out.push({ kind: "test", id: `${course.id}.t`, from: 0, to: n - 1 });
  return out;
}

export const lessonsOf = (trackId) => track(trackId).courses.flatMap((c) => c.lessons.map((l) => ({ ...l, course: c.id })));
export const findLesson = (trackId, id) => lessonsOf(trackId).find((l) => l.id === id);
export const courseOfLesson = (trackId, id) => track(trackId).courses.find((c) => c.lessons.some((l) => l.id === id));

/* Every id progress may mention, so a saved record for a lesson that was removed is dropped. */
export function validIds() {
  const v = {};
  for (const t of TRACKS) {
    v[t.id] = { les: new Set(), tst: new Set() };
    for (const c of t.courses) {
      c.lessons.forEach((l) => v[t.id].les.add(l.id));
      nodesOf(c).filter((n) => n.kind !== "lesson").forEach((n) => v[t.id].tst.add(n.id));
    }
  }
  return v;
}

/* All the question specs a set of lessons asks: the pool that tests and reviews draw from. */
export const poolOf = (lessons) => lessons.flatMap((l) => l.steps.filter((s) => s.t === "quiz").flatMap((s) => s.qs));

/* Review-deck keys. A flash-card question is saved under its card key ("staff:64"); a question written in a lesson is saved
   as "lq:<track>|<lesson>|<n>", n = its place in that lesson's questions. These maps are built once, on first use. */
let REFS = null;
function refs() {
  if (REFS) return REFS;
  const spec = new Map(),
    key = new Map(),
    cardLesson = new Map(),
    deckLesson = new Map();
  for (const t of TRACKS)
    for (const c of t.courses)
      for (const l of c.lessons)
        poolOf([l]).forEach((q, i) => {
          if (q.card) {
            const d = q.card.slice(0, q.card.indexOf(":"));
            if (!cardLesson.has(q.card)) cardLesson.set(q.card, { track: t.id, id: l.id });
            if (!deckLesson.has(d)) deckLesson.set(d, { track: t.id, id: l.id });
          } else {
            const k = `lq:${t.id}|${l.id}|${i}`;
            spec.set(q, k);
            key.set(k, q);
          }
        });
  return (REFS = { spec, key, cardLesson, deckLesson });
}
export const specKey = (q) => (q && (q.card || refs().spec.get(q))) || "";
export const specOfKey = (k) => (String(k).startsWith("lq:") ? refs().key.get(k) || null : null);
/* Which lesson teaches this review-deck card? (the lesson that asks it, else the first lesson that uses its deck) */
export function lessonOfCard(k) {
  if (k.startsWith("lq:")) {
    const [track, id] = k.slice(3).split("|");
    return findLesson(track, id) ? { track, id } : null;
  }
  const r = refs();
  return r.cardLesson.get(k) || r.deckLesson.get(k.slice(0, k.indexOf(":"))) || null;
}
/* The flash-card decks a lesson asks about, e.g. ["staff"] */
export const decksOfLesson = (l) => [...new Set(poolOf([l]).filter((q) => q.card).map((q) => q.card.slice(0, q.card.indexOf(":"))))];

/* The question pool for a test node: its lessons' questions, plus the course's own generated ones when it has them. */
export function testSpecs(course, node, n, pick = (a) => a) {
  const lessons = course.lessons.slice(node.from, node.to + 1),
    base = pick(poolOf(lessons).slice()),
    gen = course.gen ? course.gen(Math.ceil(n / 2)) : [];
  const mix = [];
  // alternate generated and written questions so a test is not all one kind
  for (let i = 0; mix.length < n && (i < base.length || i < gen.length); i++) {
    if (gen[i]) mix.push(gen[i]);
    if (mix.length < n && base[i]) mix.push(base[i]);
  }
  return mix.slice(0, n);
}

/* First lesson not yet done, in path order (the track page highlights it as "start here"). */
export function nextLesson(progress, trackId) {
  for (const c of track(trackId).courses) {
    for (const l of c.lessons) if (!progress[trackId].les[l.id]) return { course: c, lesson: l };
  }
  return null;
}
export function courseStats(progress, trackId, course) {
  const les = progress[trackId].les,
    done = course.lessons.filter((l) => les[l.id]).length,
    nodes = nodesOf(course),
    tests = nodes.filter((n) => n.kind !== "lesson"),
    passed = tests.filter((n) => progress[trackId].tst[n.id]?.ok).length;
  return { done, total: course.lessons.length, tests: tests.length, passed, complete: done === course.lessons.length && passed === tests.length && tests.length > 0 };
}
