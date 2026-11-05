/* Classic progressions in any key, and progressions made up on the spot: every one plays as a run of changes. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { build, check } from "../../docs/js/songs/format.js";
import { namedShape, runById, runPlan } from "../../docs/js/songs/changes.js";
import { CLASSICS, MAJOR_KEYS, MINOR_KEYS, NUMERALS, PALETTE, chordsIn, easiestKey, makeProgression, runId, shapesIn } from "../../docs/js/songs/classics.js";

test("every classic, in every key it offers, plays as a run of changes with a lesson", () => {
  for (const c of CLASSICS)
    for (const k of c.minor ? MINOR_KEYS : MAJOR_KEYS) {
      const names = chordsIn(c.nums, k),
        def = runById(runId(names));
      assert.ok(def, `${c.id} in key ${k}: ${names.join(" ")}`);
      assert.deepEqual(check(build(def)), [], def.id);
      assert.equal(runPlan(build(def)).length, 4);
    }
});

test("the numerals mean what they say", () => {
  assert.deepEqual(chordsIn(["I", "V", "vi", "IV"], 7), ["G", "D", "Em", "C"]);
  assert.deepEqual(chordsIn(["i", "bVII", "bVI", "V"], 9), ["Am", "G", "F", "E"]);
  assert.deepEqual(chordsIn(["ii7", "V7", "Imaj7"], 0), ["Dm7", "G7", "Cmaj7"]);
  assert.deepEqual(chordsIn(["I", "IV", "V"], 10), ["B♭", "E♭", "F"]);
  assert.equal(CLASSICS.find((c) => c.id === "blues").nums.length, 12);
});

test("the easiest key keeps to open chords where it can", () => {
  for (const id of ["pop", "fifties", "three", "axis", "rock", "circle", "jazz", "blues", "minor"]) {
    const c = CLASSICS.find((x) => x.id === id);
    assert.ok(shapesIn(chordsIn(c.nums, easiestKey(c.nums, c.minor))).open, id);
  }
  assert.equal(easiestKey(["I", "V", "vi", "IV"], false), 7, "the pop progression is easiest in G");
  assert.deepEqual(shapesIn(["G", "Bm", "F"]).hard, ["Bm", "F"]);
  assert.ok(namedShape("Bm").pos < 5, "Bm is the barre at the 2nd fret, not a shape up the neck");
});

test("a progression made up on the spot starts at home, uses the palette, loops back, and they vary", () => {
  let x = 7;
  const r = () => ((x = (x * 16807) % 2147483647) / 2147483647),
    seen = new Set();
  for (const minor of [false, true])
    for (let i = 0; i < 200; i++) {
      const p = makeProgression(minor, r);
      assert.equal(p.length, 4);
      assert.equal(p[0], minor ? "i" : "I");
      assert.ok(p.every((n) => PALETTE[minor ? "minor" : "major"].includes(n) && NUMERALS[n]), p.join(" "));
      assert.ok(p.slice(1).every((n, j) => n !== p[j]), `a chord twice running: ${p.join(" ")}`);
      assert.ok((minor ? ["V", "V7", "bVII", "iv"] : ["V", "V7", "IV", "bVII"]).includes(p[3]), `the last chord leads home: ${p.join(" ")}`);
      seen.add(p.join(" "));
      assert.ok(runById(runId(chordsIn(p, easiestKey(p, minor)))));
    }
  assert.ok(seen.size >= 20, `only ${seen.size} different progressions`);
});

test("a random progression to practise: three to six chords, open shapes when the key allows, and it plays", async () => {
  const { randomProgression } = await import("../../docs/js/songs/classics.js");
  let x = 11;
  const r = () => ((x = (x * 16807) % 2147483647) / 2147483647),
    lengths = new Set(),
    modes = new Set();
  for (let i = 0; i < 300; i++) {
    const p = randomProgression(r),
      names = chordsIn(p.nums, p.key);
    assert.ok(p.nums.length >= 3 && p.nums.length <= 6);
    assert.ok((p.minor ? MINOR_KEYS : MAJOR_KEYS).includes(p.key));
    const openKey = (p.minor ? MINOR_KEYS : MAJOR_KEYS).some((k) => shapesIn(chordsIn(p.nums, k)).open);
    if (openKey) assert.ok(shapesIn(names).open, `${names.join(" ")} needs a barre when an open key exists`);
    assert.ok(runById(runId(names)), names.join(" "));
    lengths.add(p.nums.length);
    modes.add(p.minor);
  }
  assert.equal(lengths.size, 4);
  assert.equal(modes.size, 2);
});
