import test from "node:test";
import assert from "node:assert/strict";
import { PIANO_LESSONS, PIANO_UNITS, chordName, grade, matches, noteName, pianoNote } from "../../docs/js/piano/lessons.js";

test("note names parse to MIDI numbers (middle C = 60)", () => {
  assert.equal(pianoNote("C4"), 60);
  assert.equal(pianoNote("C#4"), 61);
  assert.equal(pianoNote("Bb3"), 58);
  assert.equal(pianoNote("G2"), 43);
  assert.throws(() => pianoNote("H4"));
  assert.equal(noteName(61), "C♯4");
  assert.equal(noteName(61, true), "D♭4");
});

test("every piano lesson is well formed", () => {
  const ids = new Set();
  assert.equal(PIANO_LESSONS.length, PIANO_UNITS.reduce((a, u) => a + u.lessons.length, 0));
  for (const L of PIANO_LESSONS) {
    assert.ok(!ids.has(L.id), "duplicate id " + L.id);
    ids.add(L.id);
    assert.ok(L.title && L.intro && L.parsed.length >= 5, L.id);
    assert.ok(["keys", "read", "ear"].includes(L.mode), L.id);
    if (L.fing.length) assert.equal(L.fing.length, L.parsed.length, L.id + ": one finger per step");
    for (const f of L.fing) assert.match(f, /^[1-5-]$/, L.id);
    for (const st of L.parsed) {
      assert.equal(new Set(st).size, st.length, L.id + ": no note twice in one step");
      for (const m of st) assert.ok(m >= 36 && m <= 84, `${L.id}: ${m} fits a 49-key keyboard`);
      assert.ok(Math.max(...st) - Math.min(...st) <= 24, L.id + ": a step fits two hands");
    }
    if (L.mode === "ear") assert.ok(L.parsed.every((st) => st.length === 1), L.id + ": ear lessons are single notes");
    if (L.drill) assert.ok(L.drill.every((d) => typeof d === "string"), L.id);
  }
});

test("chords are named from the notes held", () => {
  assert.equal(chordName([60, 64, 67]), "C");
  assert.equal(chordName([57, 60, 64]), "Am");
  assert.equal(chordName([55, 59, 62, 65]), "G7");
  assert.equal(chordName([64, 67, 72]), "C/E");
  assert.equal(chordName([60]), "");
  assert.equal(chordName([60, 61, 62]), "");
});

test("octave matching and grading", () => {
  assert.ok(matches(72, 60, true) && !matches(72, 60, false) && matches(60, 60, false));
  assert.deepEqual(grade(10, 0), { pct: 100, stars: 3, passed: true });
  assert.deepEqual(grade(8, 2), { pct: 80, stars: 1, passed: true });
  assert.equal(grade(7, 3).passed, false);
  assert.equal(grade(0, 0).pct, 0);
});
