import test from "node:test";
import assert from "node:assert/strict";
import { BAR, BANDS, allShapes, chordCost, ladder, levelOf, loadOf, loadWord, makeGen, moveHint, noteCost, scaleChoice, starterTempo } from "../../docs/js/courses/motion.js";
import { OPEN } from "../../docs/js/core/theory.js";

const seeded = (seed) => {
  let x = seed;
  return () => (x = (x * 16807) % 2147483647) / 2147483647;
};
const shape = (name, i = 0) => allShapes().find((s) => s.name === name && s.vi === i);
const bars = (opt, n = 14, seed = 5) => {
  const g = makeGen(opt, seeded(seed));
  return Array.from({ length: n }, () => g.nextBar());
};

test("chord shapes: every voicing has six strings and consistent notes", () => {
  const all = allShapes();
  assert.ok(all.length > 300);
  for (const s of all) {
    assert.equal(s.frets.length, 6);
    assert.equal(s.midis.length, s.tab.length);
    s.tab.forEach(([st, f], i) => assert.equal(s.midis[i], OPEN[st] + f));
  }
});

test("chord cost: shared fingers are cheap, new shapes and barres cost more", () => {
  assert.ok(chordCost(shape("Am"), shape("C")) <= BANDS[0][1], "Am to C keeps two fingers");
  assert.equal(levelOf(chordCost(shape("G"), shape("C"))), 3);
  assert.equal(levelOf(chordCost(shape("G"), shape("F"))), 5, "open G to a barre F is the biggest kind of change");
  assert.ok(chordCost(shape("Am"), shape("Am7")) < chordCost(shape("Am"), shape("E")));
  // sliding the same barre shape is cheaper than rebuilding a different one
  const f = shape("F", 0),
    g = shape("G", 1);
  assert.ok(f && g && chordCost(f, g) < chordCost(shape("C"), shape("F")));
});

test("note cost grows with fret distance, string distance and skipping strings", () => {
  assert.ok(noteCost([2, 5], [2, 7]) < noteCost([2, 5], [2, 9]));
  assert.ok(noteCost([2, 5], [3, 5]) < noteCost([2, 5], [4, 5]));
  assert.ok(noteCost([2, 5], [2, 9]) > noteCost([2, 5], [2, 8]) + 0.9, "a jump of 4+ frets costs extra");
  assert.equal(noteCost([2, 5], [2, 5]), 0);
});

test("generated bars are well formed at every setting", () => {
  for (const content of ["chords", "scales", "mixed"])
    for (const motion of [1, 2, 3, 4, 5])
      for (const rhythm of [1, 2, 3, 4, 5]) {
        const bs = bars({ content, motion, rhythm, key: content === "chords" ? -1 : 7 });
        let prev = null;
        for (const b of bs) {
          assert.ok(b.events.length >= 1, `${content} M${motion} R${rhythm}: a bar has events`);
          let t = -1;
          for (const e of b.events) {
            assert.ok(Number.isInteger(e.t) && e.t > t && e.t < BAR, "events are in order and inside the bar");
            t = e.t;
            assert.ok(e.midis.length >= 1 && e.name);
            if (e.kind === "note") {
              assert.equal(e.m, OPEN[e.s] + e.f);
              assert.ok(e.f >= 0 && e.f <= 14);
            }
            if (prev && prev.kind === "chord" && e.kind === "chord") assert.notEqual(e.name, prev.name, "no chord repeats back to back");
            prev = e;
          }
        }
      }
});

test("rhythm level sets how many events a bar holds", () => {
  const count = (content, rhythm) => bars({ content, motion: 2, rhythm, key: 0 }, 6).filter((b) => b.kind === (content === "chords" ? "chord" : "scale")).map((b) => b.events.length);
  assert.deepEqual([...new Set(count("chords", 1))], [1]);
  assert.deepEqual([...new Set(count("chords", 2))], [2]);
  assert.deepEqual([...new Set(count("chords", 3))], [4]);
  assert.deepEqual([...new Set(count("scales", 1))], [4]);
  assert.deepEqual([...new Set(count("scales", 2))], [8]);
  assert.deepEqual([...new Set(count("scales", 3))], [12]);
  assert.deepEqual([...new Set(count("scales", 4))], [16]);
  for (const b of bars({ content: "scales", motion: 2, rhythm: 5, key: 0 }, 8)) for (const e of b.events.slice(1)) assert.ok(e.since >= 3 && e.since <= 12);
});

test("motion level steers the cost of the moves", () => {
  for (const content of ["chords", "scales"]) {
    let last = 0;
    for (const motion of [1, 2, 3, 4, 5]) {
      const bs = bars({ content, motion, rhythm: 3, key: content === "chords" ? -1 : 4 }, 20),
        costs = bs.flatMap((b) => b.events).filter((e) => e.cost).map((e) => e.cost),
        mean = costs.reduce((a, b) => a + b, 0) / costs.length;
      assert.ok(mean > last, `${content}: mean cost rises with the motion level (${motion}: ${mean.toFixed(2)})`);
      last = mean;
      const lv = bs.flatMap((b) => b.events).filter((e) => e.cost).map((e) => e.level),
        avg = lv.reduce((a, b) => a + b, 0) / lv.length;
      assert.ok(Math.abs(avg - motion) < 0.6, `${content} level ${motion} measured as ${avg.toFixed(2)}`);
    }
  }
});

test("small motion keeps scales in one hand position", () => {
  for (const b of bars({ content: "scales", motion: 1, rhythm: 2, key: 7 }, 8)) {
    const fr = b.events.map((e) => e.f).filter((f) => f > 0);
    assert.ok(Math.max(...fr) - Math.min(...fr) <= 4, "fret span " + fr.join(","));
  }
});

test("a chosen key keeps every chord and note inside the scale", () => {
  const choice = scaleChoice("major"),
    inKey = new Set(ladder(0, choice).map((n) => n.m % 12));
  const parent = new Set([0, 2, 4, 5, 7, 9, 11]);
  for (const b of bars({ content: "mixed", motion: 3, rhythm: 3, key: 0, scale: "major", vocab: "rich" }, 14)) for (const e of b.events) {
    if (e.kind === "note") assert.ok(inKey.has(e.m % 12), e.name + " is in C major");
    else assert.ok([...e.sh.pcs].every((p) => parent.has(p)), e.name + " is diatonic to C");
  }
});

test("mixed content alternates chord bars and scale bars", () => {
  assert.deepEqual(bars({ content: "mixed", motion: 2, rhythm: 2, key: 7 }, 6).map((b) => b.kind), ["chord", "scale", "chord", "scale", "chord", "scale"]);
});

test("starter tempo and load words", () => {
  const easy = starterTempo({ content: "chords", motion: 1, rhythm: 1 }),
    hard = starterTempo({ content: "chords", motion: 5, rhythm: 5 });
  assert.ok(easy > hard, `easy ${easy} vs hard ${hard}`);
  for (const t of [easy, hard]) assert.ok(t >= 30 && t <= 160);
  // at its own starter tempo a drill reads as on target, and faster means harder
  const opt = { content: "scales", motion: 3, rhythm: 2, key: 4 },
    bs = bars(opt, 16, 12345),
    at = starterTempo(opt);
  assert.ok(loadOf(bs, at * 2).peak > loadOf(bs, at).peak);
  assert.equal(loadWord(1), "Warm-up");
  assert.equal(loadWord(3), "On target");
  assert.equal(loadWord(4.5), "Stretch");
  assert.equal(loadWord(9), "Brutal");
});

test("move hints describe what the hand has to do", () => {
  assert.match(moveHint(shape("G"), { kind: "chord", sh: shape("C"), cost: 3 }) || "", /finger/);
  assert.equal(moveHint(null, null), "");
});
