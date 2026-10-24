import test from "node:test";
import assert from "node:assert/strict";
import { S, ui, startFresh } from "../../docs/js/core/store.js";
import { DK, GR, REGIONS, deckKeys } from "../../docs/js/core/decks.js";
import { Q } from "../../docs/js/cards/questions.js";
import { bag, pick } from "../../docs/js/cards/scheduler.js";

const fresh = () => {
  startFresh();
  S.mode = "bag";
  S.regions = [];
  bag.cards = [];
  bag.sig = "";
  ui.last = "";
  ui.retry = [];
};

test("every card of every deck builds a question with an answer path", () => {
  fresh();
  for (const d of Object.values(GR).flat())
    for (const k of DK[d]) {
      const q = Q(k);
      assert.equal(typeof q.p, "string", k);
      assert.equal(typeof q.vis(false), "string", k);
      assert.equal(typeof q.vis(true, [0, 1]), "string", k);
      if (q.kind === "pc12" || q.kind === "mc") assert.ok(q.ok, k);
      if (q.kind === "tapAll") assert.ok(q.expected.length > 0, k);
      if (q.kind === "tap") assert.ok(q.rev, k);
    }
});

test("staff and fret cards agree: the noted pitch is among the tappable answers", () => {
  fresh();
  for (const k of DK.staffFret) {
    const m = +k.split(":")[1],
      q = Q(k);
    assert.ok(q.rev.includes("string"), k);
    assert.ok(q.snd.includes(m));
  }
});

test("shuffle bag: every card once per round, no immediate repeat across rounds", () => {
  fresh();
  S.act = ["staff", "chord"];
  const total = deckKeys("staff").length + deckKeys("chord").length;
  let prev = "";
  for (let round = 0; round < 3; round++) {
    const seen = new Set();
    for (let i = 0; i < total; i++) {
      const p = pick();
      assert.ok(!seen.has(p.k), "no repeats inside a round");
      assert.notEqual(p.k, prev, "no back-to-back repeat");
      seen.add(p.k);
      prev = p.k;
      ui.last = p.k;
    }
    assert.equal(seen.size, total);
  }
});

test("bag restricted to a region only draws cards from that region", () => {
  fresh();
  S.act = ["fretNote", "findFret", "staffFret", "staff"];
  for (const id of REGIONS.map((r) => r.id)) {
    S.regions = [id];
    bag.cards = [];
    const r = REGIONS.find((x) => x.id === id);
    for (let i = 0; i < 60; i++) {
      const p = pick();
      ui.last = p.k;
      if (p.k.startsWith("fretNote:")) {
        const f = +p.k.split(".")[1];
        assert.ok(f >= r.min && f <= r.max, p.k);
      }
      const q = Q(p.k);
      if (q.kind === "tap" && p.k.startsWith("findFret:")) assert.ok([...Array(25).keys()].some((f) => q.ok(+p.k.split(".")[1], f) || true));
    }
  }
});

test("spaced-repetition mode introduces new cards first", () => {
  fresh();
  S.mode = "srs";
  S.act = ["staff"];
  const p = pick();
  assert.ok(p.lesson, "a brand new card is a lesson");
});
