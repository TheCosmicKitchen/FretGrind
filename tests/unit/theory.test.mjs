import test from "node:test";
import assert from "node:assert/strict";
import { OPEN, RT, SN, posAll, pt, spell, rng, shuf } from "../../docs/js/core/theory.js";
import { DK, GR, REGIONS, deckKeys, cardInRegion, fretOk, activeRegions, TAP_SEGMENTS } from "../../docs/js/core/decks.js";
import { S, startFresh } from "../../docs/js/core/store.js";

test("spell: chords and scales get the right letters", () => {
  const G = RT.find((r) => r.n === "G"),
    Eb = RT.find((r) => r.n === "E♭");
  assert.deepEqual(spell(G, [0, 2, 4], [0, 4, 7]).map((x) => x.t), ["G", "B", "D"]);
  assert.deepEqual(spell(Eb, [0, 2, 4], [0, 4, 7]).map((x) => x.t), ["E♭", "G", "B♭"]);
});

test("posAll: every position gives the pitch back; fret range 0-24", () => {
  for (let m = OPEN[0]; m <= 88; m++) {
    const ps = posAll(m);
    assert.ok(ps.length > 0, `note ${m} has a position`);
    for (const [s, f] of ps) assert.equal(OPEN[s] + f, m);
  }
  assert.match(pt([0, 3]), /fret 3/);
  assert.equal(SN.length, 6);
});

test("decks: no open-string cards (they would give the answer away)", () => {
  for (const k of DK.fretNote) assert.ok(+k.split(".")[1] >= 1, k);
  for (const k of DK.findFret) {
    const [p, s] = k.split(":")[1].split(".").map(Number);
    assert.notEqual(OPEN[s] % 12, p, k);
  }
  assert.ok(!DK.rhythm, "the old unbuildable rhythm deck is gone");
});

test("decks: every group lists real decks, and tap-all matches the regions", () => {
  for (const d of Object.values(GR).flat()) assert.ok(DK[d]?.length, d);
  assert.equal(DK.tapAll.length, 12 * TAP_SEGMENTS.length);
});

test("regions: any combination keeps the board decks non-empty and every card inside the region", () => {
  for (let mask = 0; mask < 16; mask++) {
    startFresh();
    S.regions = REGIONS.filter((_, i) => mask & (1 << i)).map((r) => r.id);
    const on = activeRegions();
    for (const d of ["staff", "staffFret", "fretNote", "findFret", "tapAll"]) {
      const keys = deckKeys(d);
      assert.ok(keys.length > 0, `${d} empty for mask ${mask}`);
      for (const k of keys) assert.ok(cardInRegion(k));
    }
    for (const k of deckKeys("fretNote")) assert.ok(!on.length || fretOk(+k.split(".")[1]), k);
  }
  startFresh();
});

test("shuf keeps every element", () => {
  const a = rng(1, 50);
  assert.deepEqual([...shuf([...a])].sort((x, y) => x - y), a);
});
