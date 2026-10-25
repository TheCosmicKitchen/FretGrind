import test from "node:test";
import assert from "node:assert/strict";
import { DRILLS, above, drillQuestions, majorScale, noteName } from "../../docs/js/courses/drills.js";
import { badFigure } from "../../docs/js/courses/figures.js";

const lcg = (seed) => () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);

test("spelling helpers: intervals and major scales", () => {
  const n = (l, a = 0) => ({ l, a });
  assert.equal(noteName(above(n(0), 3, 4)), "E");
  assert.equal(noteName(above(n(6, -1), 3, 4)), "D");
  assert.equal(noteName(above(n(3, 1), 3, 4)), "A♯");
  assert.equal(noteName(above(n(0), 5, 7)), "G");
  assert.equal(majorScale(n(3, 1)).map(noteName).join(" "), "F♯ G♯ A♯ B C♯ D♯ E♯");
  assert.equal(majorScale(n(6, -1)).map(noteName).join(" "), "B♭ C D E♭ F G A");
  assert.equal(majorScale(n(1, -1)).map(noteName).join(" "), "D♭ E♭ F G♭ A♭ B♭ C");
});

test("every drill makes well-formed, answerable questions, many times over", () => {
  for (const d of DRILLS) {
    const r = lcg(d.id.length * 7919);
    for (let i = 0; i < 300; i++) {
      const q = d.make(r),
        where = d.id + ": " + q.p;
      assert.ok(typeof q.p === "string" && q.p.length > 8, where);
      assert.ok(q.a.length >= 3 && q.a.length <= 5, where + " options " + q.a.length);
      assert.equal(new Set(q.a).size, q.a.length, where + " duplicate options " + q.a);
      assert.ok(Number.isInteger(q.c) && q.c >= 0 && q.c < q.a.length, where + " answer index");
      assert.ok(q.a.every((x) => typeof x === "string" && x.length), where);
      if (q.fig) assert.equal(badFigure(q.fig), "", where);
      if (q.hear) assert.ok(q.hear.snd || (q.hear.seq && q.hear.seq.length === q.hear.onsets.length), where);
      assert.ok(!/undefined|NaN|null/.test(q.p + q.a.join()), where);
    }
  }
});

test("drill answers are musically right (spot checks)", () => {
  const r = lcg(42);
  for (const q of drillQuestions("spellInterval", 80, r)) {
    const m = /What is a (.+) above (.+)\?/.exec(q.p);
    assert.ok(m, q.p);
  }
  for (const q of drillQuestions("keySig", 60, r)) {
    const m = /How many sharps or flats does (.+) major have\?/.exec(q.p);
    if (!m) continue;
    const want = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F♯": 6, F: 1, "B♭": 2, "E♭": 3, "A♭": 4, "D♭": 5 }[m[1]];
    const got = parseInt(q.a[q.c]) || 0;
    assert.equal(got, want, q.p + " → " + q.a[q.c]);
  }
  for (const q of drillQuestions("capoKey", 40, r)) {
    const m = /(\w)-family shapes with the capo on fret (\d+)/.exec(q.p);
    const base = { C: 0, D: 2, E: 4, G: 7, A: 9 }[m[1]],
      names = ["C", "D♭", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
    assert.equal(q.a[q.c], names[(base + +m[2]) % 12], q.p);
  }
});

test("drillQuestions gives n different questions, and a mixed set", () => {
  assert.equal(drillQuestions("earChord", 10).length, 10);
  assert.equal(drillQuestions("mix", 12).length, 12);
  assert.equal(drillQuestions("nope", 5).length, 0);
});
