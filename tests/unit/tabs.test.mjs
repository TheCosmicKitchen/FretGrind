import test from "node:test";
import assert from "node:assert/strict";
import { parseTextTab, tabTarget } from "../../docs/js/tabs/parse.js";
import { OPEN } from "../../docs/js/core/theory.js";

const block = (e = "-----", b = "-----", g = "-----", d = "-----", a = "-----", E = "-----") => `e|${e}|\nB|${b}|\nG|${g}|\nD|${d}|\nA|${a}|\nE|${E}|`;
const notes = (t) => parseTextTab(t).ev.map((e) => e.n.map((x) => x.join(":")).join("+"));
const blank = OPEN.map(() => null);

test("reads notes in playing order, top line as the high e, and takes the first short line as the title", () => {
  const t = parseTextTab(`Smoke Test\n\n${block("-----", "-----", "--0--3--5", "2--------")}`);
  assert.equal(t.title, "Smoke Test");
  assert.deepEqual(t.open, OPEN);
  assert.deepEqual(t.ev.map((e) => e.n[0].join(":")), ["2:2", "3:0", "3:3", "3:5"]);
});

test("notes in one column are a chord, even with two-digit frets", () => {
  assert.deepEqual(notes(block("--12--0--", "--12-----", "---9-----")), ["5:12+4:12+3:9", "5:0"]);
});

test("the number after a bend or release is not a note", () => {
  assert.deepEqual(notes(block("--7b9--5h7p5--10r8--x--")), ["5:7", "5:5", "5:7", "5:5", "5:10"]);
});

test("drop D labels change the low string, and a capo is kept apart from the tuning", () => {
  const t = parseTextTab(`Capo 2\ne|--0--|\nB|-----|\nG|-----|\nD|-----|\nA|-----|\nD|--0--|`);
  assert.equal(t.open[0], 50);
  assert.equal(t.capo, 2);
});

test("works without labels, upside down, and across blocks", () => {
  assert.deepEqual(notes("--0---|\n------|\n------|\n------|\n------|\n---3--|"), ["5:0", "0:3"]);
  assert.deepEqual(notes("E|--3--|\nA|-----|\nD|-----|\nG|-----|\nB|-----|\ne|--0--|"), ["0:3+5:0"]);
  assert.deepEqual(notes(block("--0--") + "\n\n" + block("--1--")), ["5:0", "5:1"]);
});

test("text with no tab says so", () => {
  assert.throws(() => parseTextTab("hello world\nthis is not a tab - at all"), /Couldn’t find/);
});

test("a tab target names the string, and a sampled string overrides the tab's own tuning", () => {
  const t = parseTextTab(`e|-----|\nB|-----|\nG|-----|\nD|-----|\nA|-----|\nD|--2--|`);
  assert.deepEqual(tabTarget(t, 0, blank).strings, [0]);
  assert.ok(tabTarget(t, 0, blank).mic(52)); // unsampled: the tab's D plus two frets is E
  assert.ok(tabTarget(t, 0, [-200, null, null, null, null, null]).mic(54)); // sampled: frets count up from the string's own place
  assert.equal(tabTarget(t, 1, blank), undefined);
});
