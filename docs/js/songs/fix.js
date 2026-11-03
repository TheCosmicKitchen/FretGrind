/* Working on a weak spot: find the bars that went wrong in a run, then loop them up to speed. Pure, so Node can test it.
   A climb is one stretch played over and over. Clean runs move the speed up, shaky ones bring it down, and it goes again by itself so the hands can stay on the guitar. */
import { lessonsOf, notesPerSecond } from "./path.js";

export const CLEAN = 0.85, // a run this good counts towards speeding up
  SHAKY = 0.6, // two runs below this in a row bring the speed down
  FIXABLE = 0.8; // bars scoring below this are worth stopping for
const POINTS = { ok: 1, early: 0.6, late: 0.6, wrong: 0.2, miss: 0 }; // as the run's own score counts them

const barNo = (song, i) => Math.max(1, song.pickup ? i : i + 1);
export const barsWord = (song, a, b) => (a === b ? `bar ${barNo(song, a)}` : `bars ${barNo(song, a)}–${barNo(song, b)}`);

/* The bar that lost the most in a run, with its neighbour when that went wrong too or the bar alone is too little to loop.
   notes: the graded notes of the run. { from, to, score, pitch: mostly wrong notes rather than bad timing }, or null when there is nothing worth stopping for. */
export function worstBars(song, notes) {
  if (notes.every((n) => n.state === "miss")) return null; // nothing heard: that's the microphone, not the bars
  const bars = new Map();
  song.sounding.forEach((n, i) => {
    const b = bars.get(n.bar) || { n: 0, pts: 0, off: 0 },
      st = notes[i].state;
    b.n++;
    b.pts += POINTS[st];
    if (st === "wrong" || st === "miss") b.off++;
    bars.set(n.bar, b);
  });
  const lost = (i) => (bars.has(i) ? bars.get(i).n - bars.get(i).pts : 0),
    top = [...bars.keys()].reduce((a, i) => (lost(i) > lost(a) ? i : a));
  if (lost(top) < 1) return null;
  const up = lost(top + 1),
    down = lost(top - 1),
    side = up >= down && bars.has(top + 1) ? top + 1 : bars.has(top - 1) ? top - 1 : top,
    both = Math.max(up, down) >= lost(top) / 2 || bars.get(top).n < 4,
    [from, to] = both ? [Math.min(top, side), Math.max(top, side)] : [top, top],
    span = (from === to ? [from] : [from, to]).map((i) => bars.get(i)),
    n = span.reduce((a, b) => a + b.n, 0),
    pts = span.reduce((a, b) => a + b.pts, 0),
    off = span.reduce((a, b) => a + b.off, 0);
  return pts / n >= FIXABLE ? null : { from, to, score: pts / n, pitch: off * 2 >= n - pts };
}

/* One stretch built back up: shaped like coachPlan's steps. */
export function fixPlan(song, from, to, pitch) {
  const tag = { lesson: 1, lessons: 1, lessonName: "Fix it", parts: 0, part: 0, from, to },
    end = song.barLens.length - 1,
    a = Math.max(0, from - 1),
    b = Math.min(end, to + 1),
    steps = [{ ...tag, kind: "hear", mode: "hear", pct: 75, title: "Hear it", say: "Just this bit, slower than the run." }];
  if (pitch) steps.push({ ...tag, kind: "wait", mode: "wait", pct: 75, title: "Note by note", say: "These were wrong notes more than late ones. Find each one with no clock." });
  steps.push({ ...tag, kind: "climb", mode: "along", pct: notesPerSecond(song) >= 4.5 ? 50 : 60, goal: 100, step: 10, need: 2, max: 14, title: "Build it up", say: "Two clean runs and it speeds up. It repeats by itself, so keep your hands on the guitar." });
  if (a !== from || b !== to) steps.push({ ...tag, from: a, to: b, kind: "along", mode: "along", pct: 90, title: "Back in place", say: "With the bars either side, so it joins up again." });
  return steps;
}

/* Up to speed by steps: a short stretch takes two clean runs a step, a long one takes one, in bigger steps. About four minutes of playing at most. best: the fastest clean % so far. */
export function speedPlan(song, from, to, best = 0) {
  const secs = (song.barLens.slice(from, to + 1).reduce((a, b) => a + b, 0) / song.beat) * (60 / song.tempo),
    step = secs > 40 ? 10 : 5,
    need = secs > 20 ? 1 : 2,
    base = notesPerSecond(song) >= 4.5 ? 50 : 60,
    pct = best >= 100 ? 80 : Math.max(base, Math.round((best - 10) / 5) * 5),
    max = Math.max(4, Math.min(20, Math.round(240 / (secs * 1.4))));
  return [{ lesson: 1, lessons: 1, lessonName: "Speed trainer", parts: 0, part: 0, from, to, kind: "climb", mode: "along", pct, goal: 100, step, need, max, title: "Speed trainer", say: `${need > 1 ? `${need} clean runs` : "A clean run"} and it speeds up. It repeats by itself, so keep your hands on the guitar.` }];
}

/* The busiest part of a piece: where speed work pays. */
export function hardPart(song) {
  const { parts } = lessonsOf(song),
    rate = (p) => p.notes / (p.to - p.from + 1);
  return parts.length < 2 ? { from: 0, to: song.barLens.length - 1 } : parts.reduce((a, p) => (rate(p) > rate(a) ? p : a));
}

export const climbStart = (st) => ({ pct: st.pct, start: st.pct, goal: st.goal, step: st.step, need: st.need, max: st.max, floor: Math.max(30, st.pct - 2 * st.step), clean: 0, slips: 0, passes: 0, best: 0, over: "", free: false });

/* A run of the climb is over. Returns "up", "down" or "". c.over becomes "top" at full speed, or "rest" when that's enough for one go. */
export function climbPass(c, score) {
  let moved = "";
  c.passes++;
  if (score >= CLEAN) {
    c.best = Math.max(c.best, c.pct);
    c.slips = 0;
    if (++c.clean >= c.need) {
      c.clean = 0;
      if (c.pct >= c.goal) c.over = "top";
      else {
        c.pct = Math.min(c.goal, c.pct + c.step);
        moved = "up";
      }
    }
  } else {
    c.clean = 0;
    if (score < SHAKY && ++c.slips >= 2) {
      c.slips = 0;
      if (c.pct > c.floor) {
        c.pct = Math.max(c.floor, c.pct - c.step);
        moved = "down";
      }
    }
  }
  if (!c.over && c.passes >= c.max) c.over = "rest";
  return moved;
}
