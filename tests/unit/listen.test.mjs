import test from "node:test";
import assert from "node:assert/strict";
import { Listener, support } from "../../docs/js/core/listen.js";
import { mix, run } from "../helpers/synth.mjs";

const SR = 44100;
// written MIDI -> sounding MIDI is 12 lower; E3 written = low E open (sounding 40)
const S = (written) => written - 12;

test("finds each note's start within a few milliseconds and names the note", () => {
  const notes = [[0.5, 64], [1.2, 67], [1.9, 71], [2.6, 76], [3.3, 52]].map(([t, w]) => ({ t, m: S(w) })), // E4 G4 B4 E5 E3
    ev = run(new Listener({ sr: SR }), mix(SR, 4.5, notes));
  assert.equal(ev.length, notes.length, JSON.stringify(ev.map((e) => e.t.toFixed(3))));
  ev.forEach((e, i) => {
    assert.ok(Math.abs(e.t - notes[i].t) < 0.012, `onset ${i}: ${e.t} vs ${notes[i].t}`);
    assert.equal(e.m % 12, (notes[i].m + 12) % 12, `pitch class ${i}: ${e.m}`);
    assert.ok(Math.abs(e.cents) < 15);
  });
});

test("fast repeated notes (sixteenths at 100 bpm) are all found, once each, and the played note is confirmed", () => {
  const ms = [64, 62, 60, 62, 64, 64, 64], // E D C D E E E (written)
    notes = ms.map((w, i) => ({ t: 0.4 + i * 0.15, m: S(w), dur: 0.4 })),
    ev = run(new Listener({ sr: SR }), mix(SR, 2.4, notes));
  assert.equal(ev.length, notes.length, JSON.stringify(ev.map((e) => e.t.toFixed(3))));
  ev.forEach((e, i) => assert.ok(Math.abs(e.t - notes[i].t) < 0.02, `onset ${i}: ${e.t}`));
  const ok = ev.filter((e, i) => support(e, ms[i], SR) >= 0.75).length;
  assert.ok(ok >= 6, `${ok} of 7 confirmed`);
});

test("confirming a note: the right note scores high, a wrong note low, over ringing strings", () => {
  let seed = 12345;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  let right = 0, wrong = 0, wrongTried = 0, total = 0;
  for (let trial = 0; trial < 6; trial++) {
    const seq = Array.from({ length: 8 }, () => 52 + Math.floor(rnd() * 28)),
      ev = run(new Listener({ sr: SR }), mix(SR, 5, seq.map((w, i) => ({ t: 0.5 + i * 0.5, m: S(w), dur: 1 }))));
    assert.equal(ev.length, 8);
    ev.forEach((e, i) => {
      total++;
      if (support(e, seq[i], SR) >= 0.8) right++;
      const other = seq[i] + [1, 2, 3, 4, 6, 8, 10, 11][Math.floor(rnd() * 8)]; // never a fifth or an octave: they share harmonics
      wrongTried++;
      if (support(e, other, SR) >= 0.8) wrong++;
    });
  }
  assert.ok(right / total >= 0.95, `right ${right}/${total}`);
  assert.ok(wrong / wrongTried <= 0.1, `wrong accepted ${wrong}/${wrongTried}`);
});

test("a ringing note does not trigger again while it fades", () => {
  const ev = run(new Listener({ sr: SR }), mix(SR, 4, [{ t: 0.5, m: S(52), dur: 3.5 }]));
  assert.equal(ev.length, 1);
});

test("background noise, hum and silence give no notes", () => {
  const l = new Listener({ sr: SR }),
    ev = run(l, mix(SR, 5, [], { noise: 0.01, hum: 0.02 }));
  assert.equal(ev.length, 0);
  assert.equal(run(new Listener({ sr: SR }), new Float32Array(SR * 2)).length, 0);
});

test("quiet notes need a higher sensitivity", () => {
  const notes = [{ t: 0.8, m: S(64), amp: 0.02 }, { t: 1.6, m: S(67), amp: 0.02 }, { t: 2.3, m: S(71), amp: 0.02 }],
    buf = mix(SR, 3, notes, { noise: 0.01 });
  assert.equal(run(new Listener({ sr: SR, sensitivity: 5 }), buf).length, 3);
  assert.equal(run(new Listener({ sr: SR, sensitivity: 1 }), buf).length, 0);
});

test("a gap in the stream resets cleanly instead of making a false note", () => {
  const l = new Listener({ sr: SR }),
    a = mix(SR, 1, [{ t: 0.5, m: S(64) }]),
    ev = [...l.feed(a, 0), ...l.feed(a, SR * 3)]; // the second chunk starts 2 s late
  ev.push(...l.flush());
  assert.equal(ev.length, 2);
});

test("works at 48 kHz", () => {
  const sr = 48000,
    ev = run(new Listener({ sr }), mix(sr, 2, [{ t: 0.5, m: S(67) }, { t: 1.1, m: S(71) }]));
  assert.deepEqual(ev.map((e) => e.m), [67, 71]);
});

test("claps (no pitch) are found as onsets, in time, including eighth-notes at 100 bpm", async () => {
  const { clap } = await import("../helpers/synth.mjs");
  const times = [0.5, 1.1, 1.7, 2.0, 2.3, 2.9, 3.2, 3.35],
    buf = mix(SR, 4.2, [], { noise: 0.003 });
  times.forEach((t) => clap(buf, SR, t));
  const ev = run(new Listener({ sr: SR }), buf);
  assert.equal(ev.length, times.length, JSON.stringify(ev.map((e) => e.t.toFixed(3))));
  ev.forEach((e, i) => assert.ok(Math.abs(e.t - times[i]) < 0.015, `clap ${i}: ${e.t} vs ${times[i]}`));
});

test("a soft metronome-click leak does not hide a played note that lands on it", () => {
  const buf = mix(SR, 3, [{ t: 1.5, m: 52, amp: 0.5 }], { noise: 0.003 });
  for (let k = 0; k < 4; k++) {
    // 1175 Hz square-ish tick, ~45 ms, quiet (it is a speaker heard across a room)
    const o = Math.round((0.6 + k * 0.45) * SR);
    for (let i = 0; i < 0.045 * SR; i++) buf[o + i] += 0.03 * Math.sign(Math.sin((2 * Math.PI * 1175 * i) / SR)) * Math.exp(-i / (0.012 * SR));
  }
  const ev = run(new Listener({ sr: SR, sensitivity: 3 }), buf),
    near = ev.filter((e) => Math.abs(e.t - 1.5) < 0.03);
  assert.equal(near.length, 1, JSON.stringify(ev.map((e) => e.t.toFixed(3))));
});
