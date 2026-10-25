import test from "node:test";
import assert from "node:assert/strict";
import { S, ui, startFresh } from "../../docs/js/core/store.js";
import { Q } from "../../docs/js/cards/questions.js";
import { bag, pick, scoped } from "../../docs/js/cards/scheduler.js";
import { addMine, isMine, sanitizeMine, toggleMine, validKey } from "../../docs/js/cards/mine.js";
import { TRACKS, decksOfLesson, findLesson, lessonOfCard, poolOf, specKey, specOfKey } from "../../docs/js/courses/curriculum.js";

const fresh = () => {
  startFresh();
  S.mode = "bag";
  S.regions = [];
  bag.cards = [];
  bag.sig = "";
  ui.last = "";
  ui.retry = [];
};
const lessons = TRACKS.flatMap((t) => t.courses.flatMap((c) => c.lessons.map((l) => [t.id, l])));

test("every written lesson question has a review-deck key that finds it again", () => {
  for (const [, l] of lessons)
    for (const q of poolOf([l])) {
      const k = specKey(q);
      assert.ok(k, l.id);
      if (!q.card) assert.equal(specOfKey(k), q, k);
      assert.ok(validKey(k), k);
    }
});

test("a lesson question becomes a flash card that can be answered", () => {
  const [t, l] = lessons.find(([, x]) => x.id === "T3.1"),
    q = poolOf([l]).find((x) => !x.card),
    k = specKey(q),
    card = Q(k);
  assert.equal(card.kind, "mc");
  assert.equal(card.p, q.p);
  assert.ok(card.ok(q.a[q.c]) && !card.ok(q.a[q.c + 1] ?? "zzz"));
  assert.equal(typeof card.vis(false), "string");
  assert.deepEqual([...card.ch].sort(), [...q.a].sort());
  assert.deepEqual(lessonOfCard(k), { track: t, id: "T3.1" });
});

test("a card links back to the lesson that teaches it, and a lesson to its decks", () => {
  const ref = lessonOfCard("staff:64");
  assert.ok(ref && findLesson(ref.track, ref.id), "staff cards have a lesson");
  assert.ok(decksOfLesson(findLesson(ref.track, ref.id)).includes("staff"));
  assert.equal(lessonOfCard("nonsense:1"), null);
});

test("my deck: add, remove, repair", () => {
  fresh();
  const a = "staff:64",
    b = "chord:Em";
  assert.equal(toggleMine(a), true);
  assert.equal(toggleMine(a), false);
  assert.equal(addMine([a, b, "nope:1", a]), 2);
  assert.ok(isMine(a) && isMine(b) && S.mine.length === 2);
  S.mine.push("junk", "lq:guitar|G9.9|0", a);
  S.onlyMine = 1;
  assert.equal(sanitizeMine(), true);
  assert.deepEqual(S.mine, [a, b]);
  assert.equal(S.onlyMine, 1);
  S.mine = [];
  sanitizeMine();
  assert.equal(S.onlyMine, 0, "an empty deck turns the mode off");
});

test("my deck mode only draws from the deck, in both modes", () => {
  fresh();
  const [, l] = lessons.find(([, x]) => x.id === "T3.1"),
    lq = specKey(poolOf([l]).find((x) => !x.card));
  addMine(["staff:64", "chord:Em", lq]);
  S.onlyMine = 1;
  S.act = ["fretNote"];
  assert.ok(scoped("staff:64") && !scoped("fretNote:0.1"));
  const seen = new Set();
  for (let i = 0; i < 12; i++) seen.add(pick().k);
  assert.deepEqual([...seen].sort(), ["chord:Em", lq, "staff:64"].sort());
  fresh();
  addMine(["staff:64", "chord:Em"]);
  S.onlyMine = 1;
  S.mode = "srs";
  for (let i = 0; i < 8; i++) assert.ok(["staff:64", "chord:Em"].includes(pick().k));
});

test("every lesson question works as a card", () => {
  for (const [, l] of lessons)
    for (const q of poolOf([l])) {
      if (q.card) continue;
      const card = Q(specKey(q));
      assert.equal(typeof card.vis(true), "string");
      assert.ok(card.ok(q.a[q.c]), specKey(q));
      assert.ok(card.ch.length === q.a.length);
      assert.equal(typeof card.rev, "string");
    }
});
