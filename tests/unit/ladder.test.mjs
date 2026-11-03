/* The reading ladder: every level makes lines that are whole bars, fingered where the level says, using only the notes it
   has taught, starting and ending at home. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { build, check } from "../../docs/js/songs/format.js";
import { OPEN } from "../../docs/js/core/theory.js";
import { GUITAR_PATH } from "../../docs/js/songs/path-data.js";
import { LADDER, LADDER_BARS, isLadder, ladderLevel, ladderLine, ladderPool, nextLine } from "../../docs/js/songs/ladder.js";
import { READ_LEVELS } from "../../docs/js/games/reading.js";

const lines = (lv, n = 120) => Array.from({ length: n }, (_, i) => build(ladderLine(`rd:${lv}:${i + 1}`)));

test("one reading level for each stage of the path", () => {
  assert.equal(LADDER.length, GUITAR_PATH.length);
  LADDER.forEach((L) => L.rhythm.forEach((r) => assert.ok(READ_LEVELS.some((x) => x.id === r))));
});

test("every line: whole bars, a real fret for every note, notes from the level's pool, home at both ends", () => {
  LADDER.forEach((L, k) => {
    const lv = k + 1,
      pools = L.keys.map((key) => ladderPool(lv, key).map((n) => n.m));
    for (const s of lines(lv)) {
      assert.deepEqual(check(s), [], s.id);
      assert.equal(s.barLens.length, LADDER_BARS);
      assert.ok(s.sounding.every((n) => OPEN[n.pitches[0].fix[0]] + n.pitches[0].fix[1] === n.midi), `${s.id}: a fret that isn't its note`);
      assert.ok(pools.some((p) => s.sounding.every((n) => p.includes(n.midi))), `${s.id}: a note from outside its key and position`);
      assert.equal(s.sounding[0].midi % 12, s.sounding.at(-1).midi % 12, `${s.id} ends where it began`);
    }
  });
});

test("notes arrive in the order guitar methods teach them", () => {
  const strings = (lv) => new Set(lines(lv, 80).flatMap((s) => s.sounding.map((n) => n.pitches[0].fix[0])));
  assert.deepEqual([...strings(1)].sort(), [4, 5], "level 1: the B and high E strings");
  assert.ok(![...strings(2)].some((s) => s < 3) && strings(2).has(3), "level 2 adds the G string");
  assert.ok(![...strings(3)].some((s) => s < 2) && strings(3).has(2), "level 3 adds the D string");
  assert.ok(strings(4).has(0) && strings(4).has(1), "level 4 uses all six");
  for (const lv of [1, 2, 3, 4]) assert.ok(lines(lv, 80).every((s) => s.sounding.every((n) => n.acc === 0)), `level ${lv} has no sharps or flats`);
  assert.ok(lines(5, 80).some((s) => s.sounding.some((n) => n.acc > 0)) && lines(5, 80).every((s) => s.sounding.every((n) => n.acc >= 0)), "level 5 brings sharps");
  assert.ok(lines(6, 80).some((s) => s.sounding.some((n) => n.acc < 0)), "level 6 brings flats");
  for (const lv of [1, 2, 3, 4, 5, 6]) assert.ok(lines(lv, 60).every((s) => s.sounding.every((n) => n.pitches[0].fix[1] <= 4)), `level ${lv} stays in first position`);
  assert.ok(lines(8, 60).every((s) => s.sounding.every((n) => n.pitches[0].fix[1] >= 4 && n.pitches[0].fix[1] <= 8)), "level 8 stays in fifth position");
});

test("the tune moves mostly by step, and lines differ", () => {
  LADDER.forEach((L, k) => {
    const ls = lines(k + 1, 60),
      moves = ls.flatMap((s) => s.sounding.slice(1).map((n, i) => Math.abs(n.step - s.sounding[i].step)));
    assert.ok(moves.filter((d) => d <= 1).length / moves.length > 0.5, `level ${k + 1} jumps about too much`);
    assert.ok(new Set(ls.map((s) => s.bars)).size >= 55, `level ${k + 1} repeats itself`);
  });
});

test("ids", () => {
  for (const bad of ["rd:0:1", "rd:11:1", "rd:3:0", "rd:3", "rr:3:4"]) assert.equal(ladderLine(bad), null, bad);
  assert.ok(isLadder("rd:4:9") && ladderLevel("rd:4:9") === 4 && ladderLevel("gx:s") === 0);
  assert.equal(nextLine("rd:4:9"), "rd:4:10");
  assert.equal(ladderLine("rd:6:3").bars, ladderLine("rd:6:3").bars);
});
