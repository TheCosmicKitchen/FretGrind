/* Course progress. Pure: no DOM, no app state, so Node can test it.

   Everything lives in one plain object (S.courses in the app):
     guitar / theory   one record set per track
       les[id]   { d: 1, b: best %, f: first day done, n: next review day ("" = finished), r: review stage 0-3, p: 1 = practice waiting, w: 1 = passed weakly }
       tst[id]   { b: best %, ok: 1 once passed, a: attempts, f: day first passed }
     streak      { last: day, n: days in a row, best }
     days        { "2026-10-24": { les, tst, rev, q } }   what was done on each day (last 60 days kept)
     min         minutes picked for the daily plan (5, 10 or 20)
     noGuitar    1 = studying away from the guitar: play steps are saved for later
   Days are local-calendar strings "YYYY-MM-DD", so reviews are due on a real calendar day. */

export const TRACK_IDS = ["guitar", "theory"];
export const REVIEW_DAYS = [3, 14, 45]; // a lesson comes back after 3 days, then 14, then 45
export const PASS_LESSON = 60; // % of a lesson's questions needed to count as done without a flag

const pad = (n) => String(n).padStart(2, "0");
export const dayKey = (d = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
export function addDays(key, n) {
  const [y, m, d] = key.split("-").map(Number);
  return dayKey(new Date(y, m - 1, d + n));
}
const isDay = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);
const pct = (n) => (Number.isFinite(+n) ? Math.max(0, Math.min(100, Math.round(+n))) : 0);
const obj = (o) => (o && typeof o === "object" && !Array.isArray(o) ? o : {});

export const fresh = () => ({
  v: 1,
  guitar: { les: {}, tst: {} },
  theory: { les: {}, tst: {} },
  streak: { last: "", n: 0, best: 0 },
  days: {},
  min: 10,
  noGuitar: 0,
});

/* Make anything (a damaged save, a pasted code) into a safe progress object.
   `valid` = { guitar: { les: Set, tst: Set }, theory: {...} } drops records for lessons that no longer exist. */
export function sanitize(raw, valid) {
  const c = fresh(),
    r = obj(raw);
  for (const t of TRACK_IDS) {
    const src = obj(r[t]);
    for (const [id, v] of Object.entries(obj(src.les))) {
      if (valid && !valid[t].les.has(id)) continue;
      const o = obj(v);
      if (!o.d) continue;
      c[t].les[id] = {
        d: 1,
        b: pct(o.b),
        f: isDay(o.f) ? o.f : "",
        n: isDay(o.n) ? o.n : "",
        r: Math.max(0, Math.min(3, o.r | 0)),
        p: o.p ? 1 : 0,
        w: o.w ? 1 : 0,
      };
    }
    for (const [id, v] of Object.entries(obj(src.tst))) {
      if (valid && !valid[t].tst.has(id)) continue;
      const o = obj(v);
      c[t].tst[id] = { b: pct(o.b), ok: o.ok ? 1 : 0, a: Math.max(0, Math.min(999, o.a | 0)), f: isDay(o.f) ? o.f : "" };
    }
  }
  const st = obj(r.streak);
  c.streak = { last: isDay(st.last) ? st.last : "", n: Math.max(0, Math.min(9999, st.n | 0)), best: Math.max(0, Math.min(9999, st.best | 0)) };
  c.streak.best = Math.max(c.streak.best, c.streak.n);
  const keys = Object.keys(obj(r.days)).filter(isDay).sort().slice(-60);
  for (const k of keys) {
    const d = obj(r.days[k]);
    c.days[k] = { les: d.les | 0, tst: d.tst | 0, rev: d.rev | 0, q: d.q | 0 };
  }
  c.min = [5, 10, 20].includes(r.min) ? r.min : 10;
  c.noGuitar = r.noGuitar ? 1 : 0;
  return c;
}

/* Count today as a study day. Called whenever something is finished. */
export function touch(c, today, what = {}) {
  const s = c.streak;
  if (s.last !== today) {
    s.n = s.last && addDays(s.last, 1) === today ? s.n + 1 : 1;
    s.last = today;
    s.best = Math.max(s.best, s.n);
  }
  const d = (c.days[today] ||= { les: 0, tst: 0, rev: 0, q: 0 });
  for (const [k, v] of Object.entries(what)) d[k] = (d[k] || 0) + v;
  const keep = Object.keys(c.days).sort().slice(-60);
  for (const k of Object.keys(c.days)) if (!keep.includes(k)) delete c.days[k];
}
/* The streak as it should be shown today: it lapses once a whole day was missed. */
export const streakNow = (c, today) => (c.streak.last === today || (c.streak.last && addDays(c.streak.last, 1) === today) ? c.streak.n : 0);

/* A lesson was finished with this score (0-100). A low score still counts but comes back tomorrow. */
export function recordLesson(c, track, id, score, today, o = {}) {
  const t = c[track],
    old = t.les[id],
    weak = score < PASS_LESSON || o.weak ? 1 : 0,
    rec = (t.les[id] = {
      d: 1,
      b: Math.max(old ? old.b : 0, pct(score)),
      f: old && old.f ? old.f : today,
      n: addDays(today, weak ? 1 : REVIEW_DAYS[0]),
      r: 0,
      p: o.pending || (old && old.p) ? 1 : 0,
      w: weak,
    });
  touch(c, today, { les: 1 });
  return rec;
}
/* A lesson was passed by a course test instead of being studied: it counts, and comes back in two weeks. */
export function recordTestedOut(c, track, id, today) {
  const t = c[track];
  if (t.les[id]) return;
  t.les[id] = { d: 1, b: 100, f: today, n: addDays(today, REVIEW_DAYS[1]), r: 1, p: 0, w: 0 };
}
export function recordTest(c, track, id, score, passed, today) {
  const t = c[track],
    old = t.tst[id] || { b: 0, ok: 0, a: 0, f: "" };
  t.tst[id] = { b: Math.max(old.b, pct(score)), ok: old.ok || passed ? 1 : 0, a: old.a + 1, f: old.f || (passed ? today : "") };
  touch(c, today, { tst: 1 });
  return t.tst[id];
}
/* A review of an old lesson: passing moves it to the next, longer gap; failing brings it back tomorrow. */
export function recordReview(c, track, id, passed, today) {
  const rec = c[track].les[id];
  if (!rec) return null;
  if (passed) {
    rec.r = Math.min(3, rec.r + 1);
    rec.n = rec.r >= 3 ? "" : addDays(today, REVIEW_DAYS[rec.r]);
    rec.w = 0;
  } else rec.n = addDays(today, 1);
  touch(c, today, { rev: 1 });
  return rec;
}
export const clearPending = (c, track, id) => c[track].les[id] && (c[track].les[id].p = 0);

/* Lessons whose review day has come, oldest first. */
export function dueReviews(c, track, today) {
  return Object.entries(c[track].les)
    .filter(([, v]) => v.d && v.n && v.n <= today)
    .sort((a, b) => (a[1].n < b[1].n ? -1 : a[1].n > b[1].n ? 1 : a[0] < b[0] ? -1 : 1))
    .map(([id, v]) => ({ track, id, n: v.n }));
}
export const pendingPractice = (c, track) => Object.entries(c[track].les).filter(([, v]) => v.p).map(([id]) => id);

/* Save / restore. The code is the progress as base64 text with a prefix, safe to paste anywhere. */
export const exportCode = (c) => "FG1." + btoa(JSON.stringify(c));
export function importCode(text, valid) {
  try {
    const m = /FG1\.([A-Za-z0-9+/=]+)/.exec(String(text));
    if (!m) return null;
    const raw = JSON.parse(atob(m[1]));
    if (!raw || typeof raw !== "object" || Array.isArray(raw) || !("guitar" in raw || "theory" in raw)) return null;
    return sanitize(raw, valid);
  } catch (e) {
    return null;
  }
}
