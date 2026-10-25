import test from "node:test";
import assert from "node:assert/strict";
import { TRACKS, CHECKPOINT_EVERY, nodesOf, validIds, poolOf, testSpecs, nextLesson, courseStats, findLesson } from "../../docs/js/courses/curriculum.js";
import { badFigure } from "../../docs/js/courses/figures.js";
import { DK } from "../../docs/js/core/decks.js";
import { newRun, answer, score, advance, finished, cur, build } from "../../docs/js/courses/runner.js";
import { fresh, sanitize, recordLesson, recordReview, recordTest, recordTestedOut, dueReviews, touch, streakNow, addDays, exportCode, importCode, dayKey, pendingPractice, clearPending } from "../../docs/js/courses/progress.js";
import { makePlan, drillSpecs, miniSpecs } from "../../docs/js/courses/today.js";
import { mapSvg, nodePos, PER_ROW, wrap } from "../../docs/js/courses/map.js";

const allCourses = TRACKS.flatMap((t) => t.courses.map((c) => [t.id, c]));
const allLessons = allCourses.flatMap(([t, c]) => c.lessons.map((l) => [t, c, l]));

test("every course has an id, name, blurb, and either lessons or a 'soon' note", () => {
  const ids = new Set();
  for (const [t, c] of allCourses) {
    assert.match(c.id, /^[GT]\d+$/, c.id);
    assert.ok(!ids.has(c.id), "duplicate course " + c.id);
    ids.add(c.id);
    assert.equal(c.id[0], t === "guitar" ? "G" : "T", c.id + " is in the wrong track");
    assert.ok(c.name && c.blurb, c.id);
    assert.ok(c.lessons.length > 0 || c.soon, c.id + " has neither lessons nor a soon note");
  }
});

test("lessons: ids follow their course, are unique, and have a sensible shape", () => {
  const seen = new Set();
  for (const [, c, l] of allLessons) {
    assert.match(l.id, new RegExp(`^${c.id}\\.\\d+$`), l.id);
    assert.ok(!seen.has(l.id), "duplicate " + l.id);
    seen.add(l.id);
    assert.ok(l.title && l.title.length < 60, l.id + " title");
    assert.ok(l.min >= 3 && l.min <= 12, l.id + " minutes");
    assert.ok(l.steps.length >= 2, l.id + " too short");
    assert.ok(l.steps.some((s) => s.t === "quiz"), l.id + " has no quiz");
    assert.ok(l.steps[l.steps.length - 1].t !== "read", l.id + " should end on a question or a practice step, not a page of text");
  }
  // numbering is 1..n in order
  for (const [, c] of allCourses) c.lessons.forEach((l, i) => assert.equal(l.id, `${c.id}.${i + 1}`));
});

test("every step is well formed: figures, play buttons, questions", () => {
  for (const [, , l] of allLessons) {
    for (const [i, s] of l.steps.entries()) {
      const where = `${l.id} step ${i + 1}`;
      assert.ok(["read", "quiz", "do"].includes(s.t), where + " type");
      if (s.t === "read") {
        assert.ok(s.h && s.p.length && s.p.every((p) => typeof p === "string" && p.length > 10), where + " text");
        for (const f of s.figs || (s.fig ? [s.fig] : [])) assert.equal(badFigure(f), "", where + " figure");
        for (const h of [].concat(s.hear || [])) {
          assert.ok(h.l, where + " hear label");
          assert.ok(Array.isArray(h.snd) || (Array.isArray(h.seq) && Array.isArray(h.onsets) && h.seq.length === h.onsets.length), where + " hear sound");
        }
      }
      if (s.t === "do") {
        assert.ok(s.task && s.task.length > 15, where + " task");
        if (s.fig) assert.equal(badFigure(s.fig), "", where + " figure");
        for (const h of [].concat(s.hear || [])) assert.ok(h.l && (h.snd || h.seq), where + " hear");
      }
      if (s.t === "quiz") {
        assert.ok(s.qs.length >= 2, where + " needs at least 2 questions");
        for (const q of s.qs) {
          if (q.card) {
            const d = q.card.slice(0, q.card.indexOf(":"));
            assert.ok(DK[d]?.includes(q.card), `${where}: unknown card ${q.card}`);
            build(q); // throws if the card kind is not supported in lessons
          } else {
            assert.ok(typeof q.p === "string" && q.p.length > 5, where + " prompt");
            assert.ok(Array.isArray(q.a) && q.a.length >= 2 && q.a.length <= 6, where + " options: " + q.p);
            assert.ok(Number.isInteger(q.c) && q.c >= 0 && q.c < q.a.length, where + " answer index: " + q.p);
            assert.equal(new Set(q.a).size, q.a.length, where + " duplicate options: " + q.p);
            if (q.fig) assert.equal(badFigure(q.fig), "", where + " question figure");
            if (q.hear) assert.ok(Array.isArray(q.hear.snd) || (Array.isArray(q.hear.seq) && q.hear.seq.length === q.hear.onsets?.length), where + " question sound");
          }
        }
      }
    }
  }
});

test("questions can be built and answered right and wrong without errors", () => {
  for (const [, , l] of allLessons) {
    const run = newRun(poolOf([l]));
    let right = 0;
    while (!finished(run)) {
      const q = cur(run);
      if (q.kind === "mc" || q.kind === "pc12") answer(run, right++ % 2 ? q.right : (q.right + 1) % q.opts.length);
      else if (q.kind === "multi") {
        q.exp.forEach((x) => run.sel.add(x));
        answer(run);
      } else answer(run, [0, 1]);
      advance(run);
    }
    assert.equal(run.got.length, run.qs.length);
    const s = score(run);
    assert.ok(s.right <= s.total);
  }
});

test("the right answer index is respected after shuffling", () => {
  const spec = { p: "Pick B please", a: ["A", "B", "C", "D"], c: 1, why: "because" };
  for (let i = 0; i < 40; i++) {
    const q = build(spec);
    assert.equal(q.opts[q.right], "B");
    assert.ok(q.ok(q.right));
    assert.ok(!q.ok((q.right + 1) % 4));
  }
});

test("path nodes: a checkpoint after every third lesson, a course test last, ids unique", () => {
  for (const [, c] of allCourses.filter(([, c]) => c.lessons.length)) {
    const nodes = nodesOf(c);
    assert.equal(nodes[nodes.length - 1].kind, "test");
    assert.equal(new Set(nodes.map((n) => n.id)).size, nodes.length);
    const cps = nodes.filter((n) => n.kind === "cp");
    assert.equal(cps.length, Math.floor((c.lessons.length - 1) / CHECKPOINT_EVERY));
    for (const cp of cps) assert.ok(cp.to - cp.from + 1 === CHECKPOINT_EVERY, "checkpoint covers " + CHECKPOINT_EVERY + " lessons");
    // tests have enough questions to draw from
    for (const n of nodes.filter((x) => x.kind !== "lesson")) {
      const pool = poolOf(c.lessons.slice(n.from, n.to + 1));
      assert.ok(pool.length >= (n.kind === "cp" ? 9 : 14), `${n.id} has only ${pool.length} questions to draw on`);
      const specs = testSpecs(c, n, n.kind === "cp" ? 10 : 20);
      assert.ok(specs.length >= (n.kind === "cp" ? 9 : 16), `${n.id} test would have ${specs.length} questions`);
    }
  }
});

test("the map lays nodes out in a snake and draws every node", () => {
  assert.deepEqual([0, 4, 5, 9, 10].map((i) => nodePos(i).x), [38, 322, 322, 38, 38]);
  const c = TRACKS[1].courses[0],
    p = fresh(),
    svg = mapSvg(c, "theory", p, new Set(), c.lessons[0].id, c.lessons[0].id);
  for (const n of nodesOf(c)) assert.ok(svg.includes(`data-ln-node="${n.id}"`), n.id);
  assert.ok(PER_ROW === 5);
  const w = wrap("The staff and the treble clef");
  assert.ok(w.length === 2 && w.every((l) => l.length <= 14) && w[1].endsWith("…"), JSON.stringify(w));
  assert.deepEqual(wrap("Notes"), ["Notes"]);
});

test("progress: lessons, reviews, streaks", () => {
  const p = fresh(),
    d1 = "2026-10-20";
  recordLesson(p, "theory", "T1.1", 80, d1);
  assert.equal(p.theory.les["T1.1"].n, "2026-10-23");
  assert.equal(p.streak.n, 1);
  assert.deepEqual(dueReviews(p, "theory", "2026-10-22"), []);
  assert.equal(dueReviews(p, "theory", "2026-10-23").length, 1);
  recordReview(p, "theory", "T1.1", true, "2026-10-23");
  assert.equal(p.theory.les["T1.1"].n, "2026-11-06"); // 14 days later
  recordReview(p, "theory", "T1.1", false, "2026-11-06");
  assert.equal(p.theory.les["T1.1"].n, "2026-11-07"); // failed: back tomorrow, same stage
  recordReview(p, "theory", "T1.1", true, "2026-11-07");
  recordReview(p, "theory", "T1.1", true, "2026-12-21");
  assert.equal(p.theory.les["T1.1"].n, "", "after three passes the lesson is mastered");
  // a weak finish comes back tomorrow
  recordLesson(p, "guitar", "G1.1", 40, d1);
  assert.equal(p.guitar.les["G1.1"].n, "2026-10-21");
  assert.equal(p.guitar.les["G1.1"].w, 1);
  // streak: consecutive days count, a gap resets
  const s = fresh();
  touch(s, "2026-10-20");
  touch(s, "2026-10-21");
  touch(s, "2026-10-21");
  assert.equal(s.streak.n, 2);
  assert.equal(streakNow(s, "2026-10-22"), 2, "still alive the day after");
  assert.equal(streakNow(s, "2026-10-23"), 0, "lapsed after a missed day");
  touch(s, "2026-10-25");
  assert.equal(s.streak.n, 1);
  assert.equal(s.streak.best, 2);
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2026-03-01", -1), "2026-02-28");
});

test("progress: tests, test-out and practice waiting", () => {
  const p = fresh();
  recordTest(p, "theory", "T1.c1", 70, false, "2026-10-20");
  assert.equal(p.theory.tst["T1.c1"].ok, 0);
  recordTest(p, "theory", "T1.c1", 90, true, "2026-10-21");
  assert.deepEqual({ ...p.theory.tst["T1.c1"] }, { b: 90, ok: 1, a: 2, f: "2026-10-21" });
  recordTestedOut(p, "theory", "T1.4", "2026-10-21");
  assert.equal(p.theory.les["T1.4"].n, "2026-11-04");
  recordLesson(p, "guitar", "G1.2", 90, "2026-10-21", { pending: true });
  assert.deepEqual(pendingPractice(p, "guitar"), ["G1.2"]);
  clearPending(p, "guitar", "G1.2");
  assert.deepEqual(pendingPractice(p, "guitar"), []);
});

test("progress: a damaged or hostile save becomes a safe one", () => {
  for (const bad of [null, undefined, 5, "x", [], { guitar: 7, theory: [], streak: "no", days: 3, min: "ten" }, { theory: { les: { "T1.1": { d: 1, b: "abc", f: 99, n: {}, r: 99 } } } }]) {
    const c = sanitize(bad);
    assert.deepEqual(Object.keys(c).sort(), Object.keys(fresh()).sort());
    assert.ok([5, 10, 20].includes(c.min));
    for (const t of ["guitar", "theory"]) for (const r of Object.values(c[t].les)) assert.ok(r.b >= 0 && r.b <= 100 && r.r >= 0 && r.r <= 3 && typeof r.n === "string");
  }
  const v = validIds(),
    c = sanitize({ theory: { les: { "T1.1": { d: 1, b: 90 }, "T9.9": { d: 1, b: 90 } } } }, v);
  assert.ok(c.theory.les["T1.1"] && !c.theory.les["T9.9"], "records for lessons that do not exist are dropped");
  const days = {};
  for (let i = 0; i < 90; i++) days[addDays("2026-01-01", i)] = { les: 1 };
  assert.equal(Object.keys(sanitize({ days }).days).length, 60);
});

test("progress code round-trips and rejects junk", () => {
  const p = fresh();
  recordLesson(p, "theory", "T1.1", 100, "2026-10-20");
  const code = exportCode(p);
  assert.match(code, /^FG1\.[A-Za-z0-9+/=]+$/);
  assert.deepEqual(importCode("my backup: " + code + " thanks", validIds()), sanitize(p, validIds()));
  for (const junk of ["", "FG1.", "FG1.!!!", "hello", "FG1." + btoa("not json"), "FG1." + btoa("[1,2]")]) assert.equal(importCode(junk), null, junk);
});

test("today's plan: reviews first, then a lesson, within the minutes asked", () => {
  const p = fresh(),
    t = "2026-10-24";
  let plan = makePlan(p, 10, t);
  assert.equal(plan.filter((i) => i.kind === "lesson").length > 0, true, "a fresh start plans a lesson");
  assert.ok(plan.every((i) => i.kind !== "review" && i.kind !== "drill" && i.kind !== "mini"), "nothing to review on day one");
  recordLesson(p, "theory", "T1.1", 70, "2026-10-19");
  recordLesson(p, "theory", "T1.2", 95, "2026-10-19");
  plan = makePlan(p, 10, t);
  assert.equal(plan[0].kind, "review");
  assert.ok(plan.some((i) => i.kind === "lesson"));
  assert.ok(plan.reduce((a, i) => a + i.cost, 0) <= 14, "stays near ten minutes");
  const five = makePlan(p, 5, t);
  assert.ok(five.length >= 1 && five.length <= 3);
  const twenty = makePlan(p, 20, t);
  assert.ok(twenty.length >= plan.length);
  assert.ok(drillSpecs("theory", "T1.1", 5).length >= 4);
  assert.ok(miniSpecs(p, 6).length === 6);
});

test("nextLesson and course stats follow progress", () => {
  const p = fresh();
  assert.equal(nextLesson(p, "theory").lesson.id, "T1.1");
  recordLesson(p, "theory", "T1.1", 100, "2026-10-20");
  assert.equal(nextLesson(p, "theory").lesson.id, "T1.2");
  const s = courseStats(p, "theory", TRACKS[1].courses[0]);
  assert.equal(s.done, 1);
  assert.equal(s.complete, false);
  assert.ok(findLesson("theory", "T1.1"));
  assert.ok(dayKey(new Date(2026, 9, 5)) === "2026-10-05");
});
