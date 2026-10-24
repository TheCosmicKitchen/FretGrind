import test from "node:test";
import assert from "node:assert/strict";
import { LEVELS, SLOTS, isValid, parse, onsets, beams, gradeTaps, windowFor, stars, bias, pickPattern } from "../../docs/js/games/rhythm-patterns.js";

test("every shipped pattern is valid and has something to tap", () => {
  for (const l of LEVELS)
    for (const p of l.patterns) {
      assert.ok(isValid(p), p);
      assert.ok(onsets(p).length >= 2, p);
    }
});

test("isValid rejects broken patterns", () => {
  for (const bad of ["x-x-x-x", "x-x-x-x-x", "-x-x-x-x", "x-.-x-x-", "xyx-x-x-", "x-----x-x", "x----x--"]) assert.ok(!isValid(bad), bad);
});

test("parse: notes, rests and lengths add up to a bar", () => {
  for (const l of LEVELS)
    for (const p of l.patterns) assert.equal(parse(p).reduce((s, e) => s + e.len, 0), SLOTS, p);
  assert.deepEqual(parse("x--xx--x").map((e) => e.len), [3, 1, 3, 1]);
  assert.deepEqual(parse("x-..x-.."), [
    { type: "note", slot: 0, len: 2 },
    { type: "rest", slot: 2, len: 2 },
    { type: "note", slot: 4, len: 2 },
    { type: "rest", slot: 6, len: 2 },
  ]);
});

test("beams join eighth-note pairs inside a beat only", () => {
  assert.deepEqual(beams("xxxxxxxx"), [[0, 1], [2, 3], [4, 5], [6, 7]]);
  assert.deepEqual(beams(".xx-.xx-"), []);
  assert.deepEqual(beams("x-xxx-xx"), [[2, 3], [6, 7]]);
});

test("pickPattern avoids the previous one", () => {
  for (const l of LEVELS) for (let i = 0; i < 20; i++) assert.notEqual(pickPattern(l.id, l.patterns[0]), l.patterns[0]);
});

test("windowFor: 170 ms at most, and under half the gap between notes", () => {
  assert.equal(windowFor([0, 600, 1200]), 170);
  assert.equal(windowFor([0, 250, 500]), 100);
  assert.equal(windowFor([0]), 170);
});

test("gradeTaps: on-time taps score full marks", () => {
  const ex = [0, 500, 1000, 1500],
    g = gradeTaps(ex, [3, 497, 1010, 1495], windowFor(ex));
  assert.equal(g.accuracy, 1);
  assert.equal(g.extras.length, 0);
  assert.equal(stars(g.accuracy), 3);
});

test("gradeTaps: late taps score less; far-off and extra taps do not", () => {
  const ex = [0, 500, 1000, 1500],
    g = gradeTaps(ex, [100, 500, 1500, 2600, 2650], windowFor(ex));
  assert.deepEqual(g.notes.map((n) => n.pts), [1, 3, 0, 3]);
  assert.equal(g.extras.length, 2); // the two taps after the bar
  assert.equal(g.pts, 7 - 2);
  assert.ok(g.accuracy < 0.5);
});

test("gradeTaps: a double tap on one note counts once, the second is extra", () => {
  const ex = [0, 500],
    g = gradeTaps(ex, [0, 20, 500], windowFor(ex));
  assert.equal(g.extras.length, 1);
  assert.equal(g.notes[0].delta, 0);
});

test("gradeTaps: no taps = 0%; never negative", () => {
  assert.equal(gradeTaps([0, 500], [], 170).accuracy, 0);
  assert.equal(gradeTaps([0, 500], [900, 950, 1000, 1100], 170).accuracy, 0);
});

test("bias: positive when late, negative when early", () => {
  assert.equal(bias([{ delta: 20 }, { delta: 40 }, { delta: null }]), 30);
  assert.equal(bias([{ delta: -30 }]), -30);
  assert.equal(bias([]), 0);
});

test("stars thresholds", () => {
  assert.deepEqual([1, 0.9, 0.89, 0.7, 0.69, 0.4, 0.39, 0].map(stars), [3, 3, 2, 2, 1, 1, 0, 0]);
});
