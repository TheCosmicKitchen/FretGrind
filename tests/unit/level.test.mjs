/* Level work: every stage's technique, reading and ear test opens, plays, and is pitched at that stage. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { build, check } from "../../docs/js/songs/format.js";
import { GUITAR_PATH } from "../../docs/js/songs/path-data.js";
import { exerciseById } from "../../docs/js/songs/exercises.js";
import { grooveById, nextTake, takeless, withTake } from "../../docs/js/songs/groove.js";
import { EAR_ROUND, LEVEL_PASS, LEVEL_WORK, earPool, echoById, isEcho, levelState, placeOf, stageDone, strandOf, tempoOf } from "../../docs/js/songs/level.js";

const open = (id, take = 3) => (id.includes("*") ? grooveById(withTake(id, take)) : exerciseById(id));

test("one stage of level work for every stage of the path", () => {
  assert.equal(LEVEL_WORK.length, GUITAR_PATH.length);
});

test("every technique drill and every sight-read opens, keeps whole bars, and is known again as that stage's work", () => {
  LEVEL_WORK.forEach((w, k) => {
    for (const [id, kind, i] of [...w.tech.map((x, i) => [x.id, "tech", i]), [w.read, "read", undefined]])
      for (const take of [1, 2, 77]) {
        const d = open(id, take);
        assert.ok(d, `stage ${k + 1}: ${id} doesn't open`);
        const s = build(d);
        assert.deepEqual(check(s), [], d.id);
        assert.equal(s.tempo, tempoOf(id), d.id);
        assert.deepEqual(strandOf(d.id), kind === "tech" ? { k, kind, i } : { k, kind }, d.id);
      }
  });
});

test("the work gets harder stage by stage: reading speeds up and echo phrases get longer", () => {
  const reads = LEVEL_WORK.map((w) => tempoOf(w.read)),
    notes = LEVEL_WORK.map((w) => w.ear.n);
  reads.slice(1).forEach((t, k) => assert.ok(t >= reads[k], `stage ${k + 2} reads slower than stage ${k + 1}`));
  notes.slice(1).forEach((n, k) => assert.ok(n >= notes[k]));
  assert.ok(notes[0] <= 2 && notes.at(-1) >= 5);
});

test("the first stage keeps to the top two strings, the strings its tunes use", () => {
  for (let take = 1; take <= 20; take++) {
    const s = build(open(LEVEL_WORK[0].read, take));
    assert.ok(s.sounding.every((n) => n.pitches[0].fix[0] >= 4), `take ${take} left the top strings`);
  }
  assert.ok(earPool(LEVEL_WORK[0].ear).every((x) => x.s >= 4));
});

test("an echo round: eight phrases of the stage's length, from its notes, starting on a note of the home chord, never one note twice running", () => {
  LEVEL_WORK.forEach((w, k) => {
    const pool = earPool(w.ear).map((x) => x.m),
      seen = new Set();
    for (let seed = 1; seed <= 30; seed++) {
      const r = echoById(`eo:${k}:${seed}`);
      assert.equal(r.phrases.length, EAR_ROUND);
      assert.equal(new Set(r.phrases.map((ph) => ph.map((x) => x.m).join())).size, EAR_ROUND, `${r.id} asks a phrase twice`);
      for (const ph of r.phrases) {
        assert.equal(ph.length, w.ear.n);
        assert.ok(ph.every((x) => pool.includes(x.m)));
        assert.ok([0, 3, 4, 7].includes(ph[0].semi), `stage ${k + 1}: a phrase starts off the home chord`);
        ph.slice(1).forEach((x, j) => {
          assert.notEqual(x.m, ph[j].m);
          assert.ok(Math.abs(pool.indexOf(x.m) - pool.indexOf(ph[j].m)) <= w.ear.leap);
        });
        seen.add(ph.map((x) => x.m).join());
        assert.match(placeOf(ph[0]), /string, (fret \d+|open)$/);
      }
    }
    assert.ok(seen.size >= [0, 0, 8, 25, 50][Math.min(4, w.ear.n)], `stage ${k + 1}: too few different phrases (${seen.size})`);
  });
  assert.deepEqual(echoById("eo:3:9"), echoById("eo:3:9"), "the same id, the same round");
  for (const bad of ["eo:99:1", "eo:2:0", "eo:2", "eo:x:3", "gx:s:C:major:0:even:steps:4:60:1"]) assert.equal(echoById(bad), null, bad);
  assert.ok(isEcho("eo:0:5") && strandOf("eo:0:5").kind === "ear");
});

test("a stage is done when its pieces are learned and each strand has passed", () => {
  const k = 3,
    w = LEVEL_WORK[k],
    all = { t: w.tech.map(() => LEVEL_PASS), r: 0.9, e: 0.75 };
  assert.equal(levelState(k, {}).length, w.tech.length + 2);
  assert.ok(levelState(k, {}).every((x) => !x.pass && x.best === 0));
  assert.ok(stageDone(k, true, all));
  assert.ok(!stageDone(k, false, all), "the pieces still count");
  assert.ok(!stageDone(k, true, { ...all, e: 0.5 }));
  assert.ok(!stageDone(k, true, { ...all, t: [1] }), "every technique drill");
  assert.ok(stageDone(0, true, { r: 0.8, e: 1 }), "stage 1 has no technique drills");
});

test("a groove on the top strings keeps that in its id, and its takes move on", () => {
  const id = withTake(LEVEL_WORK[0].read, 41);
  assert.equal(id, "gx:s:C:major:0:even:steps:4:60:41:2");
  assert.equal(grooveById(id)?.id, id);
  assert.equal(nextTake(id), "gx:s:C:major:0:even:steps:4:60:42:2");
  assert.equal(takeless(id), LEVEL_WORK[0].read);
  assert.equal(nextTake("gx:c:G:folk:A:open:strum:even:take:bar:4:60:9"), "gx:c:G:folk:A:open:strum:even:take:bar:4:60:10");
  for (const bad of ["gx:s:C:major:0:even:steps:4:60:41:1", "gx:s:C:major:0:even:steps:4:60:41:6", "gx:s:C:major:0:even:steps:4:60:41:x"]) assert.equal(grooveById(bad), null, bad);
});

test("folk harmony keeps to open chords a beginner knows", () => {
  for (let seed = 1; seed <= 40; seed++) {
    const d = grooveById(`gx:c:G:folk:APHD:open:strum:even:phrase:mix:8:72:${seed}`);
    assert.ok(d.chordNames.every((n) => ["G", "C", "D", "D7", "Em"].includes(n)), d.chordNames.join(" "));
  }
});
