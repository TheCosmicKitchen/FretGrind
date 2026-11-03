/* Today's practice: one button, and the app takes you through it. Pure, so Node can test it.
   Time goes first to what would otherwise be lost, then to moving on. It plays in the order a session should run: warm hands, trouble spots while
   you're fresh, new music, speed, the music you already have, and something easy to finish on. */
import { GUITAR_PATH, nextPathSong } from "./path.js";
import { recommendChanges } from "./changes.js";
import { CHANGE_USE } from "./changes-data.js";
import { findLesson, nextLesson } from "../courses/curriculum.js";
import { dueReviews, dueSongs } from "../courses/progress.js";
import { lessonMinutes } from "../courses/today.js";

export const PLAN_WORDS = { warm: "Warm up", fix: "Fix it", song: "Learn", climb: "Speed", replay: "Keep it alive", encore: "Finish with", review: "Review", lesson: "Lesson", drill: "Weak-spot drill", mini: "Mixed quiz" };
export const SONG_KINDS = ["warm", "fix", "song", "climb", "replay", "encore"]; // the ones that happen on the Songs tab
const LESSON_MIN = 7; // a lesson of a piece, near enough
const SLOTS = ["warm", "fix", "lesson", "song", "climb", "replay", "review", "encore"];

export const isLearned = (P, id) => (P.learn[id] || {}).stars > 0 || !!P.done[id];
export const knownChords = (P) => [...new Set(GUITAR_PATH.flatMap((st) => st.songs).filter((x) => x.ch && isLearned(P, x.id)).flatMap((x) => x.by.split(" ")))];

export function makeSession(p, mins, today, P) {
  const slots = Object.fromEntries(SLOTS.map((k) => [k, []])),
    has = Object.entries(p.rep || {}).map(([id, v]) => ({ id, ...v })),
    due = dueSongs(p, today),
    dueIds = new Set(due.map((s) => s.id));
  let left = mins;
  const add = (kind, it, cost) => {
    if (cost > left) return false;
    slots[kind].push({ ...it, kind, cost, done: false });
    left -= cost;
    return true;
  };
  const songStep = () => {
    const song = nextPathSong(p.songs || {}),
      on = song && P.learn[song.id],
      n = slots.song.length;
    if (!song) return false;
    return add("song", { id: song.id, title: on?.lessons ? `${song.title}, lesson ${Math.min(on.lessons, on.lesson + n)} of ${on.lessons}` : n ? `${song.title}, the next lesson` : song.title }, Math.min(LESSON_MIN, left));
  };
  const written = () => {
    const nl = nextLesson(p, "guitar");
    return nl && add("lesson", { track: "guitar", id: nl.lesson.id, title: nl.lesson.title }, lessonMinutes(nl.lesson, 0));
  };
  // the very first day starts with how to hold the thing
  if (!has.length && !Object.keys(p.guitar.les).length) written();
  // what would fade if it waited
  for (const s of due.slice(0, mins <= 10 ? 1 : mins <= 20 ? 2 : 3)) add("replay", { id: s.id, title: s.title }, 3);
  const known = knownChords(P);
  if (mins >= 10 && known.length >= 2) {
    const c = recommendChanges("small", CHANGE_USE, P.moved, known)[0];
    if (c) add("warm", { id: `chg:${c.a},${c.b}:4:66`, title: `${c.a} to ${c.b}` }, 2);
  }
  const weak = Object.entries(P.weak || {}).map(([id, v]) => ({ id, ...v })).sort((a, b) => (a.d < b.d ? 1 : -1));
  for (const w of weak.slice(0, mins <= 10 ? 1 : 2)) add("fix", { id: w.id, from: w.from, to: w.to, pitch: w.pitch, title: `${w.t}, ${w.at}` }, 3);
  // then forward
  if (left >= 4) songStep();
  if (!slots.lesson.length && left >= 5) written();
  // a piece you can play but not yet well
  const polish = has.filter((x) => !dueIds.has(x.id) && (P.learn[x.id]?.stars || 0) < 3).sort((a, b) => (P.learn[a.id]?.stars || 0) - (P.learn[b.id]?.stars || 0))[0];
  if (polish && mins >= 20) add("climb", { id: polish.id, title: polish.t }, 3);
  if (left >= LESSON_MIN) songStep();
  for (const d of dueReviews(p, "guitar", today).slice(0, 2)) if (mins >= 20) add("review", { track: d.track, id: d.id, title: findLesson(d.track, d.id)?.title || d.id }, 2);
  // the last thing should feel good
  const best = has.filter((x) => !dueIds.has(x.id) && x.id !== polish?.id).sort((a, b) => b.b - a.b).slice(0, 5);
  if (best.length) {
    const x = best[+today.slice(-2) % best.length];
    add("encore", { id: x.id, title: x.t }, Math.min(2, left || 2));
  }
  return SLOTS.flatMap((k) => slots[k]);
}
