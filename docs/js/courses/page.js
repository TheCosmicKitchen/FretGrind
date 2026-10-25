/* The Learn tab: home (daily plan, two tracks), a track's path map, the lesson player, tests, reviews and the progress code.
   Everything the player needs lives in ui.learn; everything saved lives in S.courses (see progress.js). */
import { S, ui, save } from "../core/store.js";
import { action, render, screen } from "../core/bus.js";
import { app } from "../core/dom.js";
import { play } from "../core/audio.js";
import { shuf } from "../core/theory.js";
import { header } from "../view/chrome.js";
import {
  CHECKPOINT_PASS, CHECKPOINT_Q, COURSE_PASS, COURSE_Q, TRACKS, courseOf, courseOfLesson, courseStats, findLesson, lessonsOf, nextLesson, nodesOf, track, validIds, written,
  testSpecs,
} from "./curriculum.js";
import { PASS_LESSON, addDays, clearPending, dayKey, dueReviews, exportCode, importCode, pendingPractice, recordLesson, recordReview, recordTest, recordTestedOut, sanitize, streakNow, touch } from "./progress.js";
import { figure } from "./figures.js";
import { mapSvg } from "./map.js";
import { advance, answer, cur, finished, newRun, questionHtml, score } from "./runner.js";
import { drillSpecs, lessonMinutes, makePlan, miniSpecs, needsGuitar } from "./today.js";

/* Tidy S.courses after loading. Returns true when something changed so the caller can save. */
export function sanitizeCourses() {
  const before = JSON.stringify(S.courses);
  S.courses = sanitize(S.courses, validIds());
  return before !== JSON.stringify(S.courses);
}

const LN = () => (ui.learn ||= { view: "home", track: "guitar", course: null, sel: null, les: null, qz: null, plan: null, confirm: "", note: "" });
const C = () => S.courses;
const nice = (key) => {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { month: "short", day: "numeric" });
};
const bar = (a, b) => `<div class="ln-bar"><i style="width:${b ? Math.round((100 * a) / b) : 0}%"></i></div>`;
const xp = (n) => (S.xp = (S.xp || 0) + n);
const go = (view) => {
  LN().view = view;
  LN().confirm = "";
  render();
  window.scrollTo(0, 0);
};
let hears = [];
const hearButtons = (list) =>
  list && list.length
    ? `<div class="ln-hear">${list.map((h) => `<button data-ln-hear="${hears.push(h) - 1}">${h.l.startsWith("▶") ? h.l : "▶ " + h.l}</button>`).join("")}</div>`
    : "";

/* ---------- Home ---------- */
function home() {
  const c = C(),
    t = dayKey(),
    streak = streakNow(c, t),
    d = c.days[t] || { les: 0, tst: 0, rev: 0, q: 0 },
    items = makePlan(c, c.min, t),
    did = d.les + d.tst + d.rev;
  const kinds = { review: "Review", lesson: "Lesson", drill: "Weak-spot drill", mini: "Mixed quiz" };
  const planList = items.length
    ? `<ol class="ln-plan">${items.map((i) => `<li><b>${kinds[i.kind]}</b> ${i.title ? "· " + i.title : ""}<small>${i.cost} min</small></li>`).join("")}</ol>`
    : "<p class='ln-sub'>Nothing to plan yet.</p>";
  const tracks = TRACKS.map((tr) => {
    const total = lessonsOf(tr.id).length,
      done = Object.keys(c[tr.id].les).length,
      nl = nextLesson(c, tr.id),
      due = dueReviews(c, tr.id, t).length;
    return `<section class="card ln-track"><div class="ln-row"><span class="ln-ic">${tr.icon}</span><div><h2>${tr.name}</h2><p class="ln-sub">${tr.blurb}</p></div></div>${bar(done, total)}<p class="ln-sub">${done} of ${total} written lessons done${due ? ` · <b>${due} review${due > 1 ? "s" : ""} due</b>` : ""}</p><div class="ln-btns">${nl ? `<button class="go" data-ln-cont="${tr.id}">Continue · ${nl.lesson.id} ${nl.lesson.title}</button>` : '<button class="go" disabled>All written lessons done 🎉</button>'}<button data-ln-track="${tr.id}">Path map</button></div></section>`;
  }).join("");
  const queue = TRACKS.flatMap((tr) => pendingPractice(c, tr.id).map((id) => ({ tr: tr.id, id, l: findLesson(tr.id, id) })));
  const q = queue.length
    ? `<section class="card ln-queue"><div class="tag">PRACTICE AT HOME</div><p class="ln-sub">You studied these away from the guitar. Play them when you have it with you:</p>${queue.map((x) => `<div class="ln-qrow"><span>${x.id} · ${x.l ? x.l.title : ""}</span><button data-ln-practiced="${x.tr}:${x.id}">Done ✓</button></div>`).join("")}</section>`
    : "";
  return `${header()}<section class="card ln-today"><div class="ln-row between"><div><div class="tag">TODAY</div><h2>Daily plan</h2></div><div class="ln-streak" title="Days in a row">🔥 ${streak}<small>best ${c.streak.best}</small></div></div><p class="ln-sub">${did ? `${did} done today. Nice.` : "Nothing yet today."} Study a little every day.</p><div class="chips" role="group" aria-label="Minutes">${[5, 10, 20].map((m) => `<button data-ln-min="${m}" class="${c.min === m ? "a" : ""}">${m} min</button>`).join("")}<button data-ln-noguitar class="${c.noGuitar ? "a" : ""}" title="Guitar steps are saved for when you are back at home">🚆 No guitar with me</button></div>${planList}<button class="go" data-ln-plan data-ln-go ${items.length ? "" : "disabled"}>Start today's plan</button></section>${tracks}${q}${backup()}`;
}

function backup() {
  const open = LN().note === "backup";
  return `<section class="card ln-backup"><button class="ln-link" data-ln-backup>${open ? "▾" : "▸"} Save or restore your progress</button>${
    open
      ? `<p class="ln-sub">Progress is stored in this browser only. Copy the code to keep a backup or move to another device, then paste it here to restore.</p><textarea readonly rows="3" class="ln-code" id="ln-save">${exportCode(C())}</textarea><div class="ln-btns"><button data-ln-copy>Copy code</button></div><textarea rows="3" class="ln-code" id="ln-restore" placeholder="Paste a code here…"></textarea>${LN().err ? `<p class="msg badm" role="alert">${LN().err}</p>` : ""}<div class="ln-btns"><button data-ln-restore>Restore from code</button><button data-ln-reset>${LN().confirm === "reset" ? "Tap again to erase course progress" : "Erase course progress"}</button></div>`
      : ""
  }</section>`;
}

/* ---------- Track page and path map ---------- */
function status(trackId, node, t) {
  const c = C();
  if (node.kind === "lesson") {
    const r = c[trackId].les[node.id];
    if (!r) return "Not started";
    return `Done · best ${r.b}%${r.n ? (r.n <= t ? " · <b>review due</b>" : " · review " + nice(r.n)) : " · mastered"}${r.p ? " · 🎸 practice waiting" : ""}`;
  }
  const r = c[trackId].tst[node.id];
  return r ? `${r.ok ? "Passed" : "Not passed yet"} · best ${r.b}% · ${r.a} attempt${r.a > 1 ? "s" : ""}` : "Not taken";
}
function nodeTitle(node) {
  return node.kind === "lesson" ? `Lesson ${node.i + 1} · ${node.lesson.title}` : node.kind === "cp" ? `Checkpoint · lessons ${node.from + 1}–${node.to + 1}` : "Course test";
}

function trackView() {
  const L = LN(),
    c = C(),
    t = dayKey(),
    tr = track(L.track),
    course = courseOf(tr.id, L.course) || (nextLesson(c, tr.id) ? nextLesson(c, tr.id).course : tr.courses[0]);
  L.course = course.id;
  const due = new Set(dueReviews(c, tr.id, t).map((x) => x.id)),
    nodes = nodesOf(course),
    nl = nextLesson(c, tr.id),
    nextId = nl && nl.course.id === course.id ? nl.lesson.id : null;
  const defaultSel = nextId || (nodes.length ? nodes[nodes.length - 1].id : null);
  if (!nodes.some((n) => n.id === L.sel)) L.sel = defaultSel;
  const chips = tr.courses
    .map((x) => {
      const s = courseStats(c, tr.id, x);
      return `<button data-ln-course="${x.id}" class="${x.id === course.id ? "a" : ""}${s.complete ? " fin" : ""}${written(x) ? "" : " soon"}"><b>${x.id}</b> ${x.name}${written(x) ? `<small>${s.done}/${s.total}${s.complete ? " ✓" : ""}</small>` : "<small>soon</small>"}</button>`;
    })
    .join("");
  const s = courseStats(c, tr.id, course);
  let body;
  if (!written(course)) body = `<div class="card"><p class="ln-sub">${course.soon || "Coming soon"}. This course is on the roadmap but its lessons are not written yet.</p></div>`;
  else {
    const node = nodes.find((n) => n.id === L.sel),
      dueHere = nodes.filter((n) => n.kind === "lesson" && due.has(n.id)).length;
    body = `<div class="card ln-mapcard">${mapSvg(course, tr.id, c, due, L.sel, nextId)}<div class="ln-legend"><span><i class="lg done"></i>done</span><span><i class="lg next"></i>start here</span><span><i class="lg due"></i>review due</span><span><i class="lg dia"></i>test</span></div></div>${node ? nodePanel(tr.id, course, node, t) : ""}${dueHere ? `<button class="go alt" data-ln-reviewfirst="${tr.id}">Review ${dueHere} lesson${dueHere > 1 ? "s" : ""} now (≈${dueHere * 2} min)</button>` : ""}<ul class="ln-list">${nodes.map((n) => `<li><button data-ln-node="${n.id}" class="${n.id === L.sel ? "on" : ""}"><span class="ln-dot ${n.kind === "lesson" ? (C()[tr.id].les[n.id] ? "done" : "open") : C()[tr.id].tst[n.id]?.ok ? "done" : "open"} ${n.kind}"></span><span><b>${nodeTitle(n)}</b><small>${status(tr.id, n, t)}</small></span></button></li>`).join("")}</ul>`;
  }
  return `${header()}<button class="ln-back" data-ln-home>← Learn</button><div class="ln-title"><span class="ln-ic">${tr.icon}</span><div><h2>${tr.name}</h2><p class="ln-sub">${tr.blurb}</p></div></div><div class="ln-courses" role="group" aria-label="Courses">${chips}</div><div class="card ln-cinfo"><b>${course.id} · ${course.name}</b><p class="ln-sub">${course.blurb}</p>${written(course) ? `${bar(s.done, s.total)}<p class="ln-sub">${s.done}/${s.total} lessons · ${s.passed}/${s.tests} tests passed</p>` : ""}</div>${body}`;
}

function nodePanel(trackId, course, node, t) {
  const c = C();
  let info = "",
    btn = "";
  if (node.kind === "lesson") {
    const l = node.lesson,
      done = !!c[trackId].les[l.id];
    info = `~${lessonMinutes(l, c.noGuitar)} min · ${l.steps.length} parts${needsGuitar(l) ? " · has a guitar part" : ""}`;
    btn = `<button class="go" data-ln-start="${trackId}:${l.id}" data-ln-go>${done ? "Do it again" : "Start lesson"}</button>`;
  } else {
    const cp = node.kind === "cp";
    info = cp
      ? `${CHECKPOINT_Q} questions from lessons ${node.from + 1}–${node.to + 1}. Pass with ${CHECKPOINT_PASS}.`
      : `${COURSE_Q} questions from the whole course. Pass with ${COURSE_PASS}. Already know this? Pass it and every lesson in the course counts as done.`;
    btn = `<button class="go" data-ln-test="${trackId}:${node.id}" data-ln-go>${c[trackId].tst[node.id] ? "Take it again" : "Take the test"}</button>`;
  }
  return `<div class="card ln-panel"><div class="tag">${node.kind === "lesson" ? "LESSON" : node.kind === "cp" ? "CHECKPOINT" : "COURSE TEST"}</div><h3>${nodeTitle(node)}</h3><p class="ln-sub">${info}</p><p class="ln-sub">${status(trackId, node, t)}</p>${btn}</div>`;
}

/* ---------- Lesson player ---------- */
function startLesson(trackId, id, planIdx) {
  const L = LN(),
    lesson = findLesson(trackId, id);
  if (!lesson) return;
  L.les = { track: trackId, id, lesson, si: -1, right: 0, total: 0, pending: 0, run: null, planIdx: planIdx ?? null, state: "play", rec: false, xp: 0 };
  goStep(L.les, 0);
  go("lesson");
}
function goStep(s, to) {
  s.si = to;
  s.run = null;
  const st = s.lesson.steps[to];
  if (!st) return finishLesson(s);
  if (st.t === "quiz") s.run = newRun(st.qs);
  else if (st.t === "do" && st.needs === "guitar" && C().noGuitar) {
    s.pending = 1;
    goStep(s, to + 1);
  }
}
function finishLesson(s) {
  s.state = "result";
  s.pct = s.total ? Math.round((100 * s.right) / s.total) : 100;
  if (s.pct >= PASS_LESSON) commitLesson(s, false);
}
function commitLesson(s, weak) {
  if (s.rec) return;
  s.rec = true;
  recordLesson(C(), s.track, s.id, s.pct, dayKey(), { weak, pending: s.pending });
  s.xp = 20;
  xp(20);
  const L = LN();
  if (s.planIdx != null && L.plan && L.plan.items[s.planIdx]) L.plan.items[s.planIdx].done = true;
  save();
}

function dots(s) {
  return `<div class="ln-steps">${s.lesson.steps.map((_, i) => `<i class="${i < s.si ? "d" : i === s.si ? "n" : ""}"></i>`).join("")}</div>`;
}
function lessonView() {
  const s = LN().les;
  if (!s) return home();
  const l = s.lesson,
    top = `<div class="ln-top"><button class="ln-x" data-ln-quit aria-label="Leave lesson">✕</button><div><div class="tag">${s.id} · ${courseOfLesson(s.track, s.id)?.name || ""}</div><b>${l.title}</b></div></div>`;
  if (s.state === "result") return `${header()}${top}${lessonResult(s)}`;
  const st = l.steps[s.si];
  let h = `${header()}${top}<div class="card ln-card">${dots(s)}`;
  if (st.t === "read") {
    h += `<h2 class="ln-h">${st.h}</h2>${st.p.map((p) => `<p class="ln-p">${p}</p>`).join("")}${(st.figs || (st.fig ? [st.fig] : [])).map(figure).join("")}${hearButtons(st.hear)}<button class="go" data-ln-next data-ln-go>Next →</button>`;
  } else if (st.t === "quiz") {
    h += qCard(s.run, "next");
  } else if (st.t === "do") {
    h += `<div class="tag">${st.needs === "guitar" ? "🎸 WITH YOUR GUITAR" : "TRY IT"}</div><h2 class="ln-h">Your turn</h2><p class="ln-p">${st.task}</p>${st.fig ? figure(st.fig) : ""}${hearButtons(st.hear)}<button class="go" data-ln-did data-ln-go>Done ✓</button><button class="ln-skip" data-ln-skip>${st.needs === "guitar" ? "I don't have my guitar. Save it for later" : "Skip"}</button>`;
  }
  return h + "</div>";
}
function lessonResult(s) {
  const L = LN(),
    ok = s.pct >= PASS_LESSON,
    t = dayKey();
  let h = `<div class="card ln-card ln-result"><div class="ln-big">${ok ? "✅" : "🤔"}</div><h2>${ok ? "Lesson complete" : "Not quite yet"}</h2>`;
  if (s.total) h += `<p class="ln-score">${s.right} of ${s.total} correct · ${s.pct}%</p>`;
  if (ok) {
    h += `<p class="ln-sub">+${s.xp} XP · it comes back for a quick review in ${s.pct >= PASS_LESSON ? "3 days" : "1 day"}.${s.pending ? " <b>The guitar part is saved in “Practice at home”.</b>" : ""}</p>`;
    h += nextButtons(s);
  } else {
    h += `<p class="ln-sub">You need ${PASS_LESSON}% to count this lesson as learned. Look it over again, or move on and it will come back tomorrow.</p><button class="go" data-ln-qagain data-ln-go>Try the questions again</button><button data-ln-redo>Read the lesson again</button><button class="ln-skip" data-ln-anyway>Move on anyway</button>`;
  }
  return h + "</div>";
}
function nextButtons(s) {
  const L = LN();
  let h = "";
  const plan = L.plan,
    more = plan && plan.items.some((i) => !i.done);
  if (more) h += `<button class="go" data-ln-plannext data-ln-go>Next in today's plan →</button>`;
  else if (plan && plan.items.length) h += `<p class="ln-sub"><b>Plan complete. See you tomorrow.</b></p>`;
  if (s && s.track) {
    const nl = nextLesson(C(), s.track);
    if (nl && !more && !(s.kind === "test" && s.pass === false))
      h += `<button class="${more ? "" : "go"}" data-ln-start="${s.track}:${nl.lesson.id}" ${more ? "" : "data-ln-go"}>Next lesson · ${nl.lesson.title}</button>`;
  }
  return h + `<button data-ln-back>Back to the path</button>`;
}

/* ---------- Questions in tests, reviews and drills ---------- */
function qCard(run, mode) {
  const q = cur(run),
    n = run.qs.length;
  let h = `<div class="tag">QUESTION ${run.i + 1} OF ${n}</div>${bar(run.i + (run.done ? 1 : 0), n)}${questionHtml(run)}`;
  if (run.done) {
    const g = run.got[run.got.length - 1];
    h += g.ok ? '<div class="msg good" role="status">✓ Correct</div>' : `<div class="msg badm" role="status">✗ ${q.rev}</div>`;
    if (q.snd) h += `<button class="ln-listen" data-ln-qplay>🔊 Hear it</button>`;
    h += `<button class="go" data-ln-next data-ln-go>${run.i + 1 >= n ? "Finish" : "Next →"}</button>`;
  }
  return h;
}

function startQuiz(kind, trackId, id, specs, planIdx, extra = {}) {
  const L = LN();
  if (!specs.length) return;
  const need = extra.need ?? 0;
  L.qz = { kind, track: trackId, id, run: newRun(specs), need, planIdx: planIdx ?? null, state: "play", title: extra.title || "Quiz", sub: extra.sub || "", rec: false };
  go("quiz");
}
function startTest(trackId, nodeId, planIdx) {
  const course = TRACKS.find((t) => t.id === trackId).courses.find((c) => nodeId.startsWith(c.id + ".")),
    node = course && nodesOf(course).find((n) => n.id === nodeId);
  if (!node) return;
  const cp = node.kind === "cp",
    specs = testSpecs(course, node, cp ? CHECKPOINT_Q : COURSE_Q, shuf),
    need = Math.min(cp ? CHECKPOINT_PASS : COURSE_PASS, Math.ceil(specs.length * 0.8));
  startQuiz(cp ? "cp" : "test", trackId, nodeId, specs, planIdx, { need, title: nodeTitle(node), sub: `Pass with ${need} of ${specs.length}` });
  LN().qz.course = course.id;
}
function startReview(trackId, id, planIdx, kind = "review") {
  const l = findLesson(trackId, id),
    specs = drillSpecs(trackId, id, 5, shuf);
  startQuiz(kind, trackId, id, specs, planIdx, {
    need: kind === "review" ? Math.ceil(specs.length * 0.8) : 0,
    title: (kind === "review" ? "Review · " : "Drill · ") + (l ? l.title : id),
    sub: kind === "review" ? "Get 4 of 5 to push the next review further away" : "A few quick questions from this lesson",
  });
}
function startMini(planIdx) {
  startQuiz("mini", "", "", miniSpecs(C(), 6, shuf), planIdx, { title: "Mixed quiz", sub: "A few questions from lessons you have done" });
}

function finishQuiz(z) {
  z.state = "result";
  const sc = score(z.run),
    c = C(),
    t = dayKey();
  z.sc = sc;
  z.pass = z.need ? sc.right >= z.need : true;
  if (z.rec) return;
  z.rec = true;
  if (z.kind === "cp" || z.kind === "test") {
    recordTest(c, z.track, z.id, sc.pct, z.pass, t);
    xp(z.pass ? 40 : 5);
    if (z.kind === "test" && z.pass) {
      const course = courseOf(z.track, z.course);
      let n = 0;
      course.lessons.forEach((l) => {
        if (!c[z.track].les[l.id]) {
          recordTestedOut(c, z.track, l.id, t);
          n++;
        }
      });
      z.skipped = n;
    }
  } else if (z.kind === "review") {
    recordReview(c, z.track, z.id, z.pass, t);
    xp(z.pass ? 10 : 2);
  } else {
    touch(c, t, { q: sc.total });
    xp(5);
  }
  const L = LN();
  if (z.planIdx != null && L.plan && L.plan.items[z.planIdx]) L.plan.items[z.planIdx].done = true;
  save();
}
function quizView() {
  const z = LN().qz;
  if (!z) return home();
  const top = `<div class="ln-top"><button class="ln-x" data-ln-quit aria-label="Leave">✕</button><div><div class="tag">${z.kind === "cp" ? "CHECKPOINT" : z.kind === "test" ? "COURSE TEST" : z.kind === "review" ? "REVIEW" : "PRACTICE"}</div><b>${z.title}</b></div></div>`;
  if (z.state === "play") return `${header()}${top}<div class="card ln-card">${z.sub ? `<p class="ln-sub">${z.sub}</p>` : ""}${qCard(z.run, "next")}</div>`;
  const sc = z.sc,
    graded = z.need > 0,
    ok = z.pass,
    missed = z.run.got.filter((g) => !g.ok);
  let h = `<div class="card ln-card ln-result"><div class="ln-big">${graded ? (ok ? "🎉" : "💪") : "👍"}</div><h2>${graded ? (ok ? "Passed" : "Not this time") : "Done"}</h2><p class="ln-score">${sc.right} of ${sc.total} correct · ${sc.pct}%</p>`;
  if (graded) h += `<p class="ln-sub">${ok ? "" : `You needed ${z.need}. `}${z.kind === "review" ? (ok ? "This lesson goes further out in your review schedule." : "It will come back tomorrow.") : ""}</p>`;
  if (z.skipped) h += `<p class="ln-sub"><b>${z.skipped} lesson${z.skipped > 1 ? "s" : ""} in this course now count as done.</b></p>`;
  if (missed.length) h += `<details class="ln-missed" open><summary>${missed.length} to look at again</summary>${missed.map((m) => `<p><span>${m.p}</span><br><b>${m.rev}</b></p>`).join("")}</details>`;
  h += nextButtons({ track: z.track, kind: z.kind, pass: z.pass });
  if (graded && !ok && (z.kind === "cp" || z.kind === "test")) h = h.replace('<button data-ln-back>', '<button class="go" data-ln-retake data-ln-go>Try the test again</button><button data-ln-back>');
  return `${header()}${top}${h}</div>`;
}

/* ---------- Today's plan ---------- */
function runItem(i) {
  const L = LN(),
    it = L.plan.items[i];
  if (!it) return;
  if (it.kind === "lesson") startLesson(it.track, it.id, i);
  else if (it.kind === "review") startReview(it.track, it.id, i, "review");
  else if (it.kind === "drill") startReview(it.track, it.id, i, "drill");
  else startMini(i);
}
function planNext() {
  const L = LN(),
    i = L.plan ? L.plan.items.findIndex((x) => !x.done) : -1;
  if (i < 0) return go("home");
  runItem(i);
}

/* ---------- Screens and clicks ---------- */
function renderLearn() {
  hears = [];
  const v = LN().view;
  app.innerHTML = v === "track" ? trackView() : v === "lesson" ? lessonView() : v === "quiz" ? quizView() : home();
}
/* Leave a lesson or quiz and land on the path map of the course it belonged to. */
function leave() {
  const L = LN(),
    s = L.view === "lesson" ? L.les : L.view === "quiz" ? L.qz : null;
  if (s && s.track) {
    L.track = s.track;
    L.course = s.course || courseOfLesson(s.track, s.id)?.id || null;
    L.sel = null;
    return go("track");
  }
  go("home");
}

export function mountLearn() {
  screen("learn", renderLearn);
  const live = (fn) => (D, el) => fn(D, el, LN());

  action("lnHome", () => go("home"));
  action("lnBack", () => leave());
  action("lnTrack", live((D, el, L) => {
    L.track = D.lnTrack;
    L.course = null;
    L.sel = null;
    go("track");
  }));
  action("lnCont", live((D, el, L) => {
    const nl = nextLesson(C(), D.lnCont);
    if (nl) startLesson(D.lnCont, nl.lesson.id);
  }));
  action("lnCourse", live((D, el, L) => {
    L.course = D.lnCourse;
    L.sel = null;
    render();
  }));
  action("lnNode", live((D, el, L) => {
    L.sel = D.lnNode;
    render();
  }));
  action("lnStart", live((D) => {
    const [t, id] = D.lnStart.split(":");
    startLesson(t, id);
  }));
  action("lnTest", live((D) => {
    const [t, id] = D.lnTest.split(":");
    startTest(t, id);
  }));
  action("lnRetake", live((D, el, L) => L.qz && startTest(L.qz.track, L.qz.id)));
  action("lnReviewfirst", live((D) => {
    const d = dueReviews(C(), D.lnReviewfirst, dayKey())[0];
    if (d) startReview(d.track, d.id, null, "review");
  }));
  action("lnMin", (D) => {
    C().min = +D.lnMin;
    save();
    render();
  });
  action("lnNoguitar", () => {
    C().noGuitar = C().noGuitar ? 0 : 1;
    save();
    render();
  });
  action("lnPlan", live((D, el, L) => {
    const items = makePlan(C(), C().min, dayKey());
    if (!items.length) return;
    L.plan = { items };
    runItem(0);
  }));
  action("lnPlannext", () => planNext());
  action("lnPracticed", (D) => {
    const [t, id] = D.lnPracticed.split(":");
    clearPending(C(), t, id);
    save();
    render();
  });
  action("lnHear", (D) => hears[+D.lnHear] && play(hears[+D.lnHear]));
  action("lnQplay", live((D, el, L) => {
    const q = L.qz ? cur(L.qz.run) : L.les && L.les.run ? cur(L.les.run) : null;
    q && q.snd && play({ snd: q.snd, gap: q.gap });
  }));
  action("lnQhear", live((D, el, L) => {
    const run = L.view === "quiz" && L.qz ? L.qz.run : L.les && L.les.run ? L.les.run : null;
    const q = run && cur(run);
    q && q.spec.hear && play(q.spec.hear);
  }));
  action("lnQuit", () => leave());

  // answers: the run is either the lesson's quiz step or a test/review/drill
  const runOf = (L) => (L.view === "quiz" && L.qz && L.qz.state === "play" ? L.qz.run : L.view === "lesson" && L.les && L.les.state === "play" ? L.les.run : null);
  const after = (L, run, ok) => {
    const q = cur(run);
    if (q.snd && !S.mute && ok !== null) play({ snd: q.snd, gap: q.gap });
    render();
  };
  action("lnAns", live((D, el, L) => {
    const run = runOf(L);
    if (!run || run.done) return;
    answer(run, +D.lnAns);
    after(L, run, true);
  }));
  action("lnTog", live((D, el, L) => {
    const run = runOf(L);
    if (!run || run.done) return;
    const i = +D.lnTog;
    run.sel.has(i) ? run.sel.delete(i) : run.sel.add(i);
    render();
  }));
  action("lnChk", live((D, el, L) => {
    const run = runOf(L);
    if (!run || run.done) return;
    answer(run);
    after(L, run, true);
  }));
  action("lnZ", live((D, el, L) => {
    const run = runOf(L);
    if (!run || run.done) return;
    answer(run, D.lnZ.split(".").map(Number));
    after(L, run, true);
  }));

  action("lnNext", live((D, el, L) => {
    if (L.view === "quiz" && L.qz && L.qz.state === "play") {
      const z = L.qz;
      if (!z.run.done) return;
      advance(z.run);
      if (finished(z.run)) finishQuiz(z);
      return render();
    }
    const s = L.les;
    if (!s || s.state !== "play") return;
    const st = s.lesson.steps[s.si];
    if (st.t === "quiz") {
      if (!s.run.done) return;
      advance(s.run);
      if (!finished(s.run)) return render();
      const sc = score(s.run);
      s.right += sc.right;
      s.total += sc.total;
    }
    goStep(s, s.si + 1);
    render();
    window.scrollTo(0, 0);
  }));
  action("lnDid", live((D, el, L) => {
    const s = L.les;
    if (s && s.state === "play") {
      goStep(s, s.si + 1);
      render();
      window.scrollTo(0, 0);
    }
  }));
  action("lnSkip", live((D, el, L) => {
    const s = L.les;
    if (!s || s.state !== "play") return;
    if (s.lesson.steps[s.si].needs === "guitar") s.pending = 1;
    goStep(s, s.si + 1);
    render();
  }));
  action("lnQagain", live((D, el, L) => {
    const s = L.les;
    if (!s) return;
    s.right = s.total = 0;
    s.state = "play";
    goStep(s, Math.max(0, s.lesson.steps.findIndex((x) => x.t === "quiz")));
    render();
  }));
  action("lnRedo", live((D, el, L) => {
    const s = L.les;
    if (!s) return;
    s.right = s.total = 0;
    s.state = "play";
    goStep(s, 0);
    render();
  }));
  action("lnAnyway", live((D, el, L) => {
    const s = L.les;
    if (!s) return;
    commitLesson(s, true);
    leave();
  }));

  // backup box
  action("lnBackup", live((D, el, L) => {
    L.note = L.note === "backup" ? "" : "backup";
    L.err = "";
    render();
  }));
  action("lnCopy", () => {
    const el = document.getElementById("ln-save");
    el.select();
    try {
      navigator.clipboard.writeText(el.value);
    } catch (e) {
      document.execCommand && document.execCommand("copy");
    }
  });
  action("lnRestore", live((D, el, L) => {
    const v = document.getElementById("ln-restore").value,
      got = importCode(v, validIds());
    if (!got) {
      L.err = "That code did not work. Copy the whole code, starting with FG1.";
      return render();
    }
    L.err = "";
    S.courses = got;
    save();
    render();
  }));
  action("lnReset", live((D, el, L) => {
    if (L.confirm !== "reset") {
      L.confirm = "reset";
      return render();
    }
    L.confirm = "";
    S.courses = sanitize(null);
    L.plan = null;
    save();
    render();
  }));
}
