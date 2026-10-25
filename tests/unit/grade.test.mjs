import test from "node:test";
import assert from "node:assert/strict";
import { Listener } from "../../docs/js/core/listen.js";
import { gradeRun, waitStep } from "../../docs/js/songs/grade.js";
import { mix, run } from "../helpers/synth.mjs";

const SR = 44100,
  W = [64, 64, 65, 67, 67, 65, 64, 62]; // E E F G G F E D (written; Ode to Joy opening)
const expectedFor = (t0, gap) => W.map((m, i) => ({ t: t0 + i * gap, m }));
const hear = (notes, secs) => run(new Listener({ sr: SR }), mix(SR, secs, notes.map((n) => ({ ...n, m: n.m - 12, dur: 0.5 }))));

test("a clean performance is graded on time, with a small lateness shown as bias", () => {
  const exp = expectedFor(0.8, 0.45),
    ev = hear(exp.map((x) => ({ t: x.t + 0.03, m: x.m })), 5),
    g = gradeRun(exp, ev, { sr: SR });
  assert.equal(g.counts.ok, 8, JSON.stringify(g.notes));
  assert.ok(g.accuracy > 0.95);
  assert.ok(g.bias > 15 && g.bias < 45, "bias " + g.bias);
  assert.equal(g.extras.length, 0);
});

test("late, early, wrong, and missing notes are told apart", () => {
  const exp = expectedFor(0.8, 0.45),
    play = exp.map((x) => ({ t: x.t, m: x.m }));
  play[1].t += 0.12; // late
  play[2].t -= 0.11; // early
  play[3].m = 69; // wrong note
  play.splice(5, 1); // missed
  const g = gradeRun(exp, hear(play, 5), { sr: SR });
  assert.deepEqual(
    g.notes.map((n) => n.state),
    ["ok", "late", "early", "wrong", "ok", "miss", "ok", "ok"],
    JSON.stringify(g.notes),
  );
  assert.equal(g.notes[3].heard % 12, 69 % 12);
});

test("an octave off counts as the right note and is flagged", () => {
  const exp = expectedFor(0.8, 0.5),
    play = exp.map((x, i) => ({ t: x.t, m: i === 2 ? x.m + 12 : x.m })),
    g = gradeRun(exp, hear(play, 5.2), { sr: SR });
  assert.equal(g.counts.ok, 8, JSON.stringify(g.notes));
  assert.ok(g.notes[2].octave);
});

test("extra notes between the song's notes are counted and cost points", () => {
  const exp = expectedFor(0.8, 0.6),
    play = [...exp.map((x) => ({ t: x.t, m: x.m })), { t: exp[3].t + 0.3, m: 60 }],
    g = gradeRun(exp, hear(play, 6), { sr: SR });
  assert.equal(g.counts.ok, 8);
  assert.equal(g.extras.length, 1);
  assert.ok(g.accuracy < 1);
});

test("nothing played grades as all missed; the room alone adds no extras", () => {
  const exp = expectedFor(0.8, 0.45),
    g = gradeRun(exp, hear([], 5), { sr: SR });
  assert.equal(g.counts.miss, 8);
  assert.equal(g.extras.length, 0);
  assert.equal(g.accuracy, 0);
});

test("wait-for-me: the wanted note moves on, another note does not, a bump is ignored", () => {
  const ev = (m) => hear([{ t: 0.5, m }], 1.6)[0];
  assert.equal(waitStep(ev(64), 64, SR), "hit");
  assert.equal(waitStep(ev(64 + 12), 64, SR), "hit"); // octave tolerant
  assert.equal(waitStep(ev(67), 64, SR), "wrong");
  assert.equal(waitStep({ m: null, spec: null, best: 0 }, 64, SR), "ignore");
});

test("pitch check: the right note and its octaves pass; fifths, fourths, and neighbours do not", async () => {
  const { pitchOk } = await import("../../docs/js/songs/grade.js");
  let right = 0, rightN = 0, wrong = 0, wrongN = 0;
  for (const w of [52, 55, 59, 62, 64, 67, 71, 74, 76]) {
    for (const d of [0, 12, -12]) {
      if (w + d < 52 || w + d > 88) continue; // a guitar written range: E3 (open low E) up
      rightN++;
      right += pitchOk(hear([{ t: 0.5, m: w + d }], 1.6)[0], w, SR).ok;
    }
    for (const d of [1, -1, 2, -2, 3, 5, -5, 7, -7, 19]) {
      if (w + d < 52 || w + d > 88) continue; // a guitar written range: E3 (open low E) up
      wrongN++;
      wrong += pitchOk(hear([{ t: 0.5, m: w + d }], 1.6)[0], w, SR).ok;
    }
  }
  assert.ok(right / rightN >= 0.95, `right ${right}/${rightN}`);
  assert.ok(wrong / wrongN <= 0.04, `wrong accepted ${wrong}/${wrongN}`);
});
