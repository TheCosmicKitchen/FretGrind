import test from "node:test";
import assert from "node:assert/strict";
import { matchNote, stringOffsets } from "../../docs/js/core/pitch.js";

const open = [null, null, null, null, null, null],
  wants = (n) => ({ mic: (x) => x % 12 === n % 12 }),
  E = 64,
  same = (c) => [c, c, c, c, c, c];

test("with nothing sampled, a note up to 70 cents out still answers the card", () => {
  for (const c of [-69, -45, -35, 0, 35, 45, 69]) assert.equal(matchNote(E + c / 100, open, wants(E)) % 12, E % 12, c + " cents");
});

test("an in-tune wrong fret is never accepted", () => {
  for (const d of [-2, -1, 1, 2]) assert.notEqual(matchNote(E + d, open, wants(E)) % 12, E % 12, d + " frets");
});

test("a sampled guitar is the truth: a 35 cent flat guitar is judged relative to itself", () => {
  assert.equal(matchNote(E - 0.35, same(-35), wants(E)) % 12, E % 12);
  assert.notEqual(matchNote(E + 1 - 0.35, same(-35), wants(E)) % 12, E % 12); // one fret high on that guitar
});

test("a guitar sampled a half step down plays its frets as the usual notes", () => {
  assert.equal(matchNote(E - 1, same(-100), wants(E)), E);
  assert.notEqual(matchNote(E, same(-100), wants(E)) % 12, E % 12);
});

test("naming the string stops another string's tuning from excusing a wrong note", () => {
  const t = [-30, 290, -100, 12, -250, 0],
    q = { ...wants(62), strings: [2] };
  assert.notEqual(matchNote(62, t, q) % 12, 62 % 12); // one fret high on that string
  assert.equal(matchNote(61, t, q) % 12, 62 % 12);
});

test("strings not sampled use the average of those that were", () => {
  assert.deepEqual(stringOffsets([-40, null, null, null, null, -20]).map((x) => +x.toFixed(2)), [-0.4, -0.3, -0.3, -0.3, -0.3, -0.2]);
  assert.deepEqual(stringOffsets(undefined), [0, 0, 0, 0, 0, 0]);
});
