import test from "node:test";
import assert from "node:assert/strict";
import { yinPitch, freqToWritten } from "../../docs/js/core/pitch.js";

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
