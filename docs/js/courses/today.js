/* The daily plan: what to do in 5, 10 or 20 minutes. Pure, so Node can test it.
   Order: reviews that are due, then the next lesson (in the track you've touched least recently), then a quick drill of
   your weakest lesson, then a mixed quiz to fill what is left. Nothing is locked: it is a suggestion. */
import { TRACKS, findLesson, nextLesson, poolOf } from "./curriculum.js";
import { dueReviews } from "./progress.js";

export const needsGuitar = (lesson) => lesson.steps.some((s) => s.t === "do" && s.needs === "guitar");
/* Minutes a lesson takes: shorter when its guitar steps are saved for later. */
export const lessonMinutes = (lesson, noGuitar) => Math.max(3, Math.round(lesson.min * (noGuitar && needsGuitar(lesson) ? 0.7 : 1)));

const lastTouched = (p, t) => Object.values(p[t].les).reduce((a, v) => (v.f > a ? v.f : a), "");

export function makePlan(p, mins, today) {
  const items = [];
  let left = mins;
  const add = (it, cost) => {
    items.push({ ...it, cost, done: false });
    left -= cost;
  };
  // 1. reviews that are due
  const due = TRACKS.flatMap((t) => dueReviews(p, t.id, today)).sort((a, b) => (a.n < b.n ? -1 : 1)),
    maxRev = mins <= 5 ? 2 : mins <= 10 ? 3 : 5;
  for (const d of due.slice(0, maxRev)) if (left >= 2) add({ kind: "review", track: d.track, id: d.id, title: findLesson(d.track, d.id)?.title || d.id }, 2);
  // 2. the next lesson: the track you've gone longest without comes first
  const order = TRACKS.map((t) => t.id).sort((a, b) => (lastTouched(p, a) < lastTouched(p, b) ? -1 : 1));
  let lessons = 0;
  for (const t of order) {
    const nl = nextLesson(p, t);
    if (!nl) continue;
    const cost = lessonMinutes(nl.lesson, p.noGuitar);
    if (lessons === 0 ? left >= Math.min(cost, 4) || !items.length : cost <= left) {
      add({ kind: "lesson", track: t, id: nl.lesson.id, title: nl.lesson.title }, cost);
      lessons++;
    }
  }
  // 3. a drill for your weakest finished lesson
  if (left >= 3) {
    const weak = TRACKS.flatMap((t) => Object.entries(p[t.id].les).map(([id, v]) => ({ track: t.id, id, b: v.b, f: v.f })))
      .filter((x) => x.b < 85 && x.f !== today && !items.some((i) => i.id === x.id))
      .sort((a, b) => a.b - b.b)[0];
    if (weak) add({ kind: "drill", track: weak.track, id: weak.id, title: findLesson(weak.track, weak.id)?.title || weak.id }, 3);
  }
  // 4. a mixed quiz with what is left
  const finished = TRACKS.some((t) => Object.keys(p[t.id].les).length);
  if (left >= 2 && finished) add({ kind: "mini", title: "Mixed quiz" }, 2);
  if (!items.length && finished) add({ kind: "mini", title: "Mixed quiz" }, 2);
  return items;
}

/* Questions for a quick drill: a handful from one lesson's pool. */
export function drillSpecs(trackId, id, n = 5, pick = (a) => a) {
  const l = findLesson(trackId, id);
  return l ? pick(poolOf([l]).slice()).slice(0, n) : [];
}
/* Questions for a mixed quiz: a few from each lesson that has been finished. */
export function miniSpecs(p, n = 6, pick = (a) => a) {
  const all = TRACKS.flatMap((t) => Object.keys(p[t.id].les).map((id) => findLesson(t.id, id)).filter(Boolean));
  return pick(poolOf(all).slice()).slice(0, n);
}
