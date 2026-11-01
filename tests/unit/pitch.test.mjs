import test from "node:test";
import assert from "node:assert/strict";
import { freqToWritten, matchNote, nearestString, sampleReading, saneTuning, steady, stringOffsets, yinPitch } from "../../docs/js/core/pitch.js";

const sine = (hz, sr, n) => Float32Array.from({ length: n }, (_, i) => 0.5 * Math.sin((2 * Math.PI * hz * i) / sr));

test("YIN finds the pitch of a clean tone (guitar range)", () => {
  for (const hz of [82.41, 110, 196, 329.63, 659.26]) {
    const r = yinPitch(sine(hz, 48000, 4096), 48000);
    assert.ok(r, `heard ${hz}`);
    assert.ok(Math.abs(r.f - hz) / hz < 0.01, `${hz} -> ${r.f}`);
    assert.ok(r.clarity > 0.9);
  }
});

test("YIN returns nothing for silence", () => {
  assert.equal(yinPitch(new Float32Array(4096), 48000), null);
});

test("freqToWritten: guitar sounds an octave below the written note", () => {
  assert.equal(freqToWritten(82.41).m, 52); // low E sounds E2 (40), is written E3 (52)
  assert.ok(Math.abs(freqToWritten(440).cents) < 0.01);
});

test("sampling: a neighbouring string is never saved as the string that was asked for", () => {
  assert.deepEqual(sampleReading(57, 0), { other: 1 }, "open A while low E is asked for");
  assert.deepEqual(sampleReading(52, 1), { other: 0 }, "low E still ringing while A is asked for");
  assert.equal(sampleReading(70.6, 3).other, 4, "the B string, even flat, while G is asked for");
  assert.equal(sampleReading(52.3, 0).cents, 30);
  assert.equal(sampleReading(50, 0).cents, -200, "drop D is still welcome");
  assert.equal(sampleReading(55, 1).cents, -200, "open G tuning's A string down to G");
});

test("free tuning: a saved reading cannot pull the A string onto the low E", () => {
  const bad = [500, null, null, null, null, null]; // saved by an older version: "E" is really the A string
  assert.equal(nearestString(57, bad), 1);
  assert.equal(nearestString(56.8, [240, null, null, null, null, null]), 1);
  assert.equal(nearestString(50, [-200, null, null, null, null, null]), 0, "drop D stays the low E");
  assert.equal(nearestString(52.1, null), 0);
  assert.equal(nearestString(82, null), null, "above every string: a misheard harmonic");
});

test("a reading no guitar is tuned to does not skew every other string", () => {
  const off = stringOffsets([500, null, null, null, null, null]);
  assert.deepEqual([...off], [0, 0, 0, 0, 0, 0]);
  assert.deepEqual(saneTuning([500, -20, null, -705, 10, 0]), [null, -20, null, null, 10, 0]);
  // and the note answers as itself instead of "low E, open"
  assert.equal(matchNote(57, [500, null, null, null, null, null], { mic: (n) => n === 52 }), 57);
});

test("sampling needs a steady pitch, not one that is still jumping about", () => {
  assert.ok(steady([12, 14, 11, 13, 12]));
  assert.ok(!steady([12, 14, 480, 13, 12]));
});
