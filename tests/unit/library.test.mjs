import test from "node:test";
import assert from "node:assert/strict";
import { OPEN } from "../../docs/js/core/theory.js";
import { CHORDDB } from "../../docs/js/library/chorddb.js";
import { KEYS, PR_SCALES, CH, buildChord, buildScale, chordInfo, voicings } from "../../docs/js/library/catalog.js";
import { boxView, staffView, tabView } from "../../docs/js/library/draw.js";

const PC = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const spelledPc = (n) => (((PC[n.t[0]] + n.acc) % 12) + 12) % 12;

test("every chord voicing builds: spelled notes match their pitch, tab frets match the strings", () => {
  let count = 0;
  KEYS.forEach((key, cRoot) => {
    for (const cSuf of Object.keys(CHORDDB[key])) {
      assert.ok(chordInfo(cSuf), `known chord type ${cSuf}`);
      voicings({ cRoot, cSuf }).forEach((v, cVoice) => {
        const it = buildChord({ cRoot, cSuf, cVoice });
        count++;
        assert.ok(it.cols[0].notes.length >= 3, `${key}${cSuf} #${cVoice}`);
        for (const n of it.cols[0].notes) assert.equal(spelledPc(n), n.m % 12, `${key}${cSuf} ${n.t}`);
        for (const [s, f] of it.cols[0].tab) assert.ok(f >= 0 && f <= 24 && OPEN[s] + f > 0);
        assert.ok(staffView(it) && tabView(it) && boxView(it.voice));
      });
    }
  });
  assert.ok(count > 1500, `expected a big library, got ${count}`);
});

test("every scale in every key builds, in order, with correct tab positions", () => {
  for (let root = 0; root < 12; root++)
    for (let scale = 0; scale < PR_SCALES.length; scale++)
      for (const updown of [false, true]) {
        const it = buildScale({ root, scale, updown });
        const ms = it.cols.map((c) => c.notes[0].m);
        if (!updown) assert.deepEqual(ms, [...ms].sort((a, b) => a - b), `${it.title} ascends`);
        it.cols.forEach((c, i) => {
          const n = c.notes[0];
          assert.equal(spelledPc(n), n.m % 12, `${it.title} ${n.t}`);
          assert.equal(OPEN[c.tab[0][0]] + c.tab[0][1], n.m, `${it.title} tab ${i}`);
        });
        assert.ok(staffView(it) && tabView(it));
      }
});

test("a major scale is spelled with seven different letters", () => {
  const it = buildScale({ root: 0, scale: 0, updown: false });
  assert.equal(it.spelled.split("  ").slice(0, 7).join(""), "CDEFGAB");
});

test("chord names: slash chords and symbols", () => {
  assert.equal(chordInfo("m/B").sym, "m/B");
  assert.equal(chordInfo("/E").bass, "E");
  assert.ok(CH.maj7);
});
