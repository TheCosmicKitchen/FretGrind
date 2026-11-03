/* Grooves: generated drills that change every take. Swept across settings and seeds, because a generator is only as
   good as its worst take. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { build, check } from "../../docs/js/songs/format.js";
import { OPEN } from "../../docs/js/core/theory.js";
import { KEYS, PR_SCALES, rootOf, token } from "../../docs/js/library/catalog.js";
import { SCALES, positionNotes } from "../../docs/js/songs/exercises.js";
import { CADENCES, FEELS, HANDS, HARM, HARMONY, MOTIONS, SFEELS, VARY, chordGroove, grooveById, isGroove, nextTake, scaleGroove } from "../../docs/js/songs/groove.js";

const READABLE = [16, 12, 8, 6, 4, 3, 2, 1],
  onsets = (s) => s.sounding.map((n) => n.start % 16),
  sound = (s) => s.sounding,
  fretsOk = (s) => s.sounding.every((n) => n.pitches.every((p) => p.fix && p.fix[1] >= 0 && p.fix[1] <= 17 && OPEN[p.fix[0]] + p.fix[1] === p.midi));

const chordSet = [];
for (const harmony of Object.keys(HARMONY))
  for (const harm of Object.keys(HARM))
    for (const feel of Object.keys(FEELS))
      for (const hand of Object.keys(HANDS))
        chordSet.push({ tonic: KEYS[(chordSet.length * 5) % 12], harmony, cads: ["APHD", "A", "H", "PD", "AD"][chordSet.length % 5], shape: ["open", "barre", "any"][chordSet.length % 3], hand, feel, vary: Object.keys(VARY)[chordSet.length % 3], harm, len: [4, 8, 16][chordSet.length % 3], tempo: 72, seed: 1 + chordSet.length });

test("every chord groove builds: whole bars, readable lengths, a fret for every note", () => {
  for (const o of chordSet) {
    const d = chordGroove(o),
      s = build(d);
    assert.deepEqual(check(s), [], d.id);
    assert.equal(s.barLens.length, o.len, d.id);
    assert.ok(s.notes.every((n) => n.triplet || READABLE.includes(n.dur)), `${d.id}: an unreadable length`);
    assert.ok(fretsOk(s), `${d.id}: a fret that doesn't make its pitch`);
    assert.equal(grooveById(d.id)?.bars, d.bars, `${d.id} reopens as the same take`);
  }
});

test("each phrase ends on the cadence it says, and a take with a perfect cadence ends at home", () => {
  for (const o of chordSet) {
    const d = chordGroove(o),
      { cadences, numerals } = d.groove,
      H = HARMONY[o.harmony];
    assert.equal(cadences.length, o.len / 4);
    cadences.forEach((c) => assert.ok(o.cads.includes(c.kind), `${d.id}: ${c.kind} wasn't asked for`));
    assert.deepEqual(numerals.slice(-cadences.at(-1).nums.length), cadences.at(-1).nums);
    if (o.cads.includes("A")) assert.equal(numerals.at(-1), H.home, `${d.id} should end at home`);
    if (o.cads === "H") assert.ok(["V", "V7"].includes(numerals.at(-1)), `${d.id}: a half cadence ends on V`);
    assert.ok(d.story.includes(`${CADENCES[cadences[0].kind].name.toLowerCase()}`) || d.story.includes(CADENCES[cadences[0].kind].says), d.story);
  }
});

test("chord names sit over every change, and the voicings are the chords named", () => {
  for (const o of chordSet.slice(0, 40)) {
    const d = chordGroove(o),
      s = build(d),
      named = s.sounding.filter((n) => n.label);
    assert.ok(named.length >= d.groove.numerals.length - 1, d.id); // a change can repeat a chord (V then V7 share a name only rarely)
    assert.ok(named.every((n) => d.chordNames.includes(n.label)));
  }
});

test("syncopated and sixteenth feels really are off the beat, and pushed changes come early", () => {
  const off = (feel, harm) =>
    [1, 2, 3, 4, 5].map((seed) => build(chordGroove({ tonic: "G", harmony: "maj", cads: "APHD", shape: "open", hand: "strum", feel, vary: "bar", harm, len: 8, tempo: 72, seed })));
  const share = (ss, f) => ss.flatMap(onsets).filter(f).length / ss.flatMap(onsets).length;
  assert.equal(share(off("even", "bar"), (u) => u % 2), 0, "straight has no sixteenth offbeats");
  assert.ok(share(off("sync", "bar"), (u) => u % 4) > 0.3, "syncopated strikes between the beats");
  assert.ok(share(off("funk", "bar"), (u) => u % 2) > 0.15, "sixteenths strike on the e and the a");
  const pushed = off("even", "push").flatMap((s) => s.sounding.filter((n) => n.label && n.start % 16 === 14));
  assert.ok(pushed.length > 0, "some changes land an eighth before the bar");
  assert.equal(off("even", "bar").flatMap((s) => s.sounding.filter((n) => n.label && n.start % 16)).length, 0, "with no push, changes land on the bar");
});

test("takes differ: the harmony, the rhythm and the notes move on from take to take", () => {
  const o = { tonic: "D", harmony: "maj", cads: "APHD", shape: "open", hand: "strum", feel: "sync", vary: "phrase", harm: "mix", len: 8, tempo: 72 },
    takes = [1, 2, 3, 4, 5, 6].map((seed) => chordGroove({ ...o, seed }));
  assert.ok(new Set(takes.map((d) => d.groove.numerals.join(" "))).size >= 5, "the chords change");
  assert.ok(new Set(takes.map((d) => d.bars.replace(/[A-G][#b]?\d|=[\d.+]+/g, ""))).size >= 5, "the rhythms change");
  const one = build(takes[0]),
    bars = one.barLens.map((_, b) => one.notes.filter((n) => n.bar === b).map((n) => `${n.start % 16}${n.rest ? "r" : ""}`).join());
  assert.ok(new Set(bars.slice(0, 7)).size >= 2, "the right hand changes within a take");
  assert.equal(new Set(build(chordGroove({ ...o, vary: "take", harm: "bar", seed: 3 })).notes.filter((n) => n.bar < 7 && !n.rest).map((n) => n.start % 16)).size <= 8, true);
});

test("the right hand: strum hits the whole shape, bass and strum splits it, picked plays one string at a time", () => {
  const o = { tonic: "C", harmony: "maj", cads: "AH", shape: "open", feel: "even", vary: "take", harm: "bar", len: 4, tempo: 72, seed: 9 };
  const strum = build(chordGroove({ ...o, hand: "strum" })),
    bass = build(chordGroove({ ...o, hand: "bass" })),
    pick = build(chordGroove({ ...o, hand: "pick" }));
  assert.ok(strum.sounding.every((n) => n.pitches.length >= 4));
  assert.ok(bass.sounding.some((n) => n.pitches.length === 1) && bass.sounding.some((n) => n.pitches.length >= 3));
  assert.ok(bass.sounding.filter((n) => n.label).every((n) => n.pitches.length === 1), "a change starts on its bass note");
  assert.ok(pick.sounding.every((n) => n.pitches.length === 1));
});

const scaleSet = [];
for (const scale of Object.keys(SCALES))
  for (const feel of Object.keys(SFEELS))
    for (const motion of Object.keys(MOTIONS)) scaleSet.push({ tonic: KEYS[(scaleSet.length * 7) % 12], scale, pos: [0, 2, 3, 5, 7, 9, 12][scaleSet.length % 7], feel, motion, len: [4, 8, 16][scaleSet.length % 3], tempo: 72, seed: 1 + scaleSet.length });

test("every scale groove builds, stays in the scale and the hand position, and ends on the root", () => {
  for (const o of scaleSet) {
    const d = scaleGroove(o),
      s = build(d),
      pcs = new Set(PR_SCALES[SCALES[o.scale].idx][1].split(" ").map((t) => (rootOf(o.tonic).pc + token(t).semis) % 12)),
      frets = positionNotes(o.tonic, o.scale, o.pos).map((n) => n.f);
    assert.deepEqual(check(s), [], d.id);
    assert.equal(s.barLens.length, o.len, d.id);
    assert.ok(s.notes.every((n) => n.triplet || READABLE.includes(n.dur)), `${d.id}: an unreadable length`);
    assert.ok(fretsOk(s), d.id);
    assert.ok(sound(s).every((n) => pcs.has(n.midi % 12)), `${d.id}: a note outside the scale`);
    assert.ok(sound(s).every((n) => n.pitches[0].fix[1] >= Math.min(...frets) && n.pitches[0].fix[1] <= Math.max(...frets)), `${d.id}: the hand left its position`);
    assert.equal(sound(s).at(-1).midi % 12, rootOf(o.tonic).pc, `${d.id} ends at home`);
    assert.equal(sound(s)[0].midi % 12, rootOf(o.tonic).pc, `${d.id} starts at home`);
    assert.equal(grooveById(d.id)?.bars, d.bars);
  }
});

test("scale phrases land: away from home first, then home", () => {
  const s = build(scaleGroove({ tonic: "G", scale: "major", pos: 2, feel: "mixed", motion: "skips", len: 8, tempo: 72, seed: 4 })),
    landing = (bar) => s.sounding.find((n) => n.bar === bar && n.start % 16 === 8 && n.dur >= 4);
  assert.equal(landing(1).midi % 12, 2, "the first phrase stops on the fifth, D");
  assert.equal(landing(3).midi % 12, 7, "the second comes home to G");
});

test("scale rhythms: straight stays on the eighths, the others mix lengths in", () => {
  const takes = (feel) => [1, 2, 3, 4].map((seed) => build(scaleGroove({ tonic: "A", scale: "minpent", pos: 5, feel, motion: "steps", len: 8, tempo: 72, seed })));
  assert.ok(takes("even").every((s) => s.notes.every((n) => [2, 4, 8].includes(n.dur))));
  assert.ok(takes("mixed").some((s) => s.notes.some((n) => n.triplet || n.dur === 3)));
  assert.ok(takes("sync").some((s) => s.notes.some((n) => !n.rest && n.start % 4 === 2 && n.dur >= 4)), "a note held across the beat");
  assert.ok(takes("busy").every((s) => s.notes.filter((n) => n.dur === 1).length >= 8));
});

test("ids: bad ones are refused, the next take moves the seed on", () => {
  const id = "gx:c:G:maj:APHD:open:strum:sync:phrase:mix:8:72:7";
  assert.ok(isGroove(id) && grooveById(id));
  assert.equal(nextTake(id), "gx:c:G:maj:APHD:open:strum:sync:phrase:mix:8:72:8");
  assert.equal(nextTake("gx:s:G:major:2:mixed:skips:8:72:999"), "gx:s:G:major:2:mixed:skips:8:72:1000");
  for (const bad of ["gx:c:G:maj:AA:open:strum:sync:phrase:mix:8:72:7", "gx:c:G:maj:X:open:strum:sync:phrase:mix:8:72:7", "gx:c:H:maj:A:open:strum:sync:phrase:mix:8:72:7", "gx:c:G:maj:A:open:strum:sync:phrase:mix:6:72:7", "gx:s:G:major:4:mixed:skips:8:72:1", "gx:s:G:major:2:mixed:skips:8:72:0", "gx:s:G:major:2:mixed:skips:8:72", "ex:s:G:major:thirds:2:e:80"])
    assert.equal(grooveById(bad), null, bad);
});
