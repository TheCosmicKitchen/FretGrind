/* Reading notes on the staff: every note card has a hint that shows the way without saying the note, and a tip after that
   explains it; the notes split into sets to learn in order. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { S } from "../../docs/js/core/store.js";
import { STAFF_NOTE } from "../../docs/js/core/theory.js";
import { DK, cardInRegion } from "../../docs/js/core/decks.js";
import { Q } from "../../docs/js/cards/questions.js";
import { STAFF_SETS, noteHint, noteTip, staffSetOf, staffStep } from "../../docs/js/core/readtips.js";

const notes = DK.staff.map((k) => +k.split(":")[1]);

test("the lines and spaces are named the way every teacher says them", () => {
  assert.equal(staffStep(64), 30, "E4 is the bottom line");
  assert.match(noteTip(64), /^E is on the 1st line from the bottom\. .*Every Good Boy Deserves Fudge/);
  assert.match(noteTip(77), /^F is on the 5th line/);
  assert.match(noteTip(65), /^F is in the 1st space from the bottom\. The spaces, bottom to top, spell F A C E/);
  assert.match(noteTip(76), /^E is in the 4th space/);
  assert.match(noteTip(62), /^D is just under the bottom line/);
  assert.match(noteTip(79), /^G is just over the top line/);
  assert.match(noteTip(60), /^C is on the 1st ledger line below the staff.*E, D, C\..*middle C.*fret 3 on the A string/);
  assert.match(noteTip(52), /^E is under the 3rd ledger line below the staff.*the open low E string/);
  assert.match(noteTip(81), /^A is on the 1st ledger line above the staff.*F, G, A\./);
  assert.match(noteTip(66), /^F♯ is in the 1st space.*The sharp makes F into F♯: one fret higher/);
  assert.match(noteTip(70), /^B♭ is on the 3rd line.*The flat makes B into B♭: one fret lower/);
  assert.ok(!/open B string/.test(noteTip(70)), "a flat on the B line is not the open B string");
});

test("every note card has a hint and a tip; the hint never names the note or gives the ledger count", () => {
  for (const m of notes) {
    const [name, , sign] = STAFF_NOTE[m % 12],
      hint = noteHint(m),
      tip = noteTip(m);
    assert.ok(tip.startsWith(`${name} is `), tip);
    assert.ok(!/^.{0,3}\b[A-G][♯♭]? is /.test(hint), hint);
    assert.ok(!/, [A-G]\./.test(hint), `${m}: the hint gives the count away: ${hint}`);
    assert.ok(!/It's the open|It's middle/.test(hint), `${m}: the hint names it: ${hint}`);
    if (sign) assert.match(hint, sign === "♯" ? /sharp raises it/ : /flat lowers it/);
    for (const d of ["staff", "staffFret"]) {
      const q = Q(`${d}:${m}`);
      assert.equal(q.hint, hint);
      assert.equal(q.tip, tip);
    }
  }
});

test("the notes split into sets, in the order to learn them, and the sets narrow the decks", () => {
  const by = {};
  for (const m of notes) (by[staffSetOf(m)] ||= []).push(m);
  assert.deepEqual(Object.keys(by).sort(), STAFF_SETS.map((x) => x.id).sort());
  assert.deepEqual(by.lines.sort((a, b) => a - b), [64, 67, 71, 74, 77]);
  assert.deepEqual(by.spaces.sort((a, b) => a - b), [62, 65, 69, 72, 76, 79]);
  assert.ok(by.below.every((m) => m < 62) && by.above.every((m) => m > 79));
  assert.ok(by.acc.every((m) => STAFF_NOTE[m % 12][2]));
  S.regions = [];
  S.staffSets = ["lines"];
  assert.deepEqual(DK.staff.filter(cardInRegion).map((k) => +k.split(":")[1]).sort((a, b) => a - b), [64, 67, 71, 74, 77]);
  assert.ok(cardInRegion("fretNote:2.3"), "other decks are untouched");
  S.staffSets = [];
  assert.equal(DK.staff.filter(cardInRegion).length, DK.staff.length);
});
