/* Rhythm reading: every level makes lines that are whole bars, read the usual way, use only that level's rhythms, and
   don't repeat. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { build, check } from "../../docs/js/songs/format.js";
import { READ_BARS, READ_LEVELS, isReading, readLine, spanOf } from "../../docs/js/games/reading.js";
import { markOf } from "../../docs/js/games/read.js";

test("every level makes whole bars, starting on a note, with something to play in every bar", () => {
  for (const L of READ_LEVELS)
    for (let seed = 1; seed <= 200; seed++) {
      const s = build(readLine(`rr:${L.id}:${seed}`));
      assert.deepEqual(check(s), [], s.id);
      assert.equal(s.barLens.length, READ_BARS);
      assert.ok(L.times.includes(s.time));
      assert.ok(!s.notes[0].rest, `${s.id} starts on a rest`);
      s.barLens.forEach((_, b) => assert.ok(s.sounding.some((n) => n.bar === b), `${s.id}: bar ${b + 1} is empty`));
    }
});

test("each level uses its own rhythms and nothing it hasn't taught yet", () => {
  const lens = (id) => new Set(READ_LEVELS.find((l) => l.id === id) && Array.from({ length: 60 }, (_, i) => build(readLine(`rr:${id}:${i + 1}`))).flatMap((s) => s.notes.map((n) => `${n.rest ? "r" : ""}${+n.dur.toFixed(3)}`)));
  assert.deepEqual([...lens(1)].sort(), ["4", "r4"]);
  assert.ok(!lens(2).has("2") && lens(2).has("8") && lens(2).has("16") && lens(2).has("12"));
  assert.ok(lens(3).has("2") && !lens(3).has("1") && !lens(3).has("6"));
  assert.ok(lens(5).has("6") && !lens(5).has("r2"));
  assert.ok(lens(6).has("r2"));
  assert.ok(lens(7).has("1") && !lens(7).has("3"));
  assert.ok(lens(8).has("3"));
  assert.ok([...lens(10)].some((x) => x === "1.333"), "eighth-note triplets");
  for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9]) assert.ok(![...lens(id)].some((x) => x.includes(".")), `level ${id} has no triplets`);
});

test("long notes sit where they read clearly: a half note on beat 1 or 3, a dotted half or whole at the bar", () => {
  for (const L of READ_LEVELS)
    for (let seed = 1; seed <= 100; seed++) {
      const s = build(readLine(`rr:${L.id}:${seed}`));
      for (const n of s.notes) {
        const at = n.start % s.bar;
        if (n.dur >= 12) assert.equal(at, 0, `${s.id}: a ${n.dur} off the bar line`);
        if (n.dur === 8 && s.time === "4/4") assert.equal(at % 8, 0, `${s.id}: a half note across the middle of the bar`);
        if (s.time !== "6/8" && n.dur <= 4 && !n.triplet) assert.ok(Math.floor(at / 4) === Math.floor((at + n.dur - 1e-9) / 4) || n.dur === 4 || (n.dur === 6 && at % 8 === 0) || (n.dur === 4 && at % 2 === 0), `${s.id}: a short note across a beat`);
      }
    }
});

test("lines change: the same level rarely gives the same line twice", () => {
  for (const L of READ_LEVELS) {
    const lines = new Set(Array.from({ length: 50 }, (_, i) => readLine(`rr:${L.id}:${i + 1}`).bars));
    assert.ok(lines.size >= 45, `level ${L.id}: only ${lines.size} different lines in 50`);
  }
  assert.equal(readLine("rr:3:9").bars, readLine("rr:3:9").bars);
});

test("ids and marks", () => {
  for (const bad of ["rr:0:1", "rr:11:1", "rr:3:0", "rr:3", "gx:s:C:major:0:even:steps:4:60:1"]) assert.equal(readLine(bad), null, bad);
  assert.ok(isReading("rr:10:5"));
  assert.equal(spanOf(["4/3", "4/3", "4/3"]), 4);
  assert.deepEqual([{ delta: null, pts: 0 }, { delta: 10, pts: 3 }, { delta: -70, pts: 2 }, { delta: 120, pts: 1 }].map(markOf), ["miss", "ok", "early", "late"]);
});
