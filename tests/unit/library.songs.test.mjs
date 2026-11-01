import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { build, check } from "../../docs/js/songs/format.js";
import { playability, tabify } from "../../docs/js/songs/tabify.js";
import { lineOf, ribbon, ribbonX, songSvg } from "../../docs/js/songs/draw.js";
import { timeline } from "../../docs/js/songs/player.js";
import { PATTERNS, POSITIONS, PROGRESSIONS, RHYTHMS, SCALES, SHAPES, STYLES, chordExercise, exerciseById, positionNotes, scaleExercise } from "../../docs/js/songs/exercises.js";
import { KEYS } from "../../docs/js/library/catalog.js";
import { OPEN } from "../../docs/js/core/theory.js";

const lib = fileURLToPath(new URL("../../docs/lib/", import.meta.url)),
  rows = JSON.parse(readFileSync(join(lib, "index.json"), "utf8")),
  tunes = readdirSync(lib).filter((f) => f.startsWith("songs-")).flatMap((f) => JSON.parse(readFileSync(join(lib, f), "utf8")));
const named = (t) => tunes.find((x) => x.title === t);

test("the library is big, varied and covers every level", () => {
  assert.equal(rows.length, tunes.length);
  assert.ok(tunes.length > 2000, `${tunes.length} tunes`);
  assert.ok(tunes.filter((t) => t.style === "classical").length >= 70);
  for (const lv of [1, 2, 3, 4, 5, 6]) assert.ok(tunes.filter((t) => t.level === lv).length >= 40, `level ${lv}`);
  assert.equal(new Set(tunes.map((t) => t.id)).size, tunes.length);
});

test("every tune in the library is sound: bars add up, the tab plays, and its source is named", () => {
  for (const t of tunes) {
    const s = build({ reviewed: false, ...t });
    assert.deepEqual(check(s), [], t.id);
    assert.equal(s.total % s.beat, 0, t.id + ": a loop must end on a beat");
    assert.ok(t.title && t.by && t.src, t.id);
    const tab = tabify(s);
    assert.deepEqual(playability(s, tab), [], t.id);
    assert.equal(tab.length, s.sounding.length, t.id);
  }
});

test("known tunes came through the import with the right notes", () => {
  const menuet = build(tunes.find((t) => t.title === "Menuet in G" && t.key === "G"));
  assert.deepEqual(menuet.sounding.slice(0, 8).map((n) => n.name), ["D5", "G4", "A4", "B4", "C5", "D5", "G4", "G4"]);
  assert.equal(menuet.sounding[0].pitches[0].name, "G3", "the bass under the melody");
  const weasel = build(named("Pop Goes The Weasel"));
  assert.equal(weasel.time, "6/8");
  const air = tunes.filter((t) => t.src === "oneills");
  assert.ok(air.every((t) => !/“|"/.test(t.title)));
});

test("a sample of the library draws cleanly at phone and desktop widths", () => {
  for (const t of tunes.filter((_, i) => i % 97 === 0 || _.style === "classical")) {
    const s = build(t),
      tab = tabify(s);
    for (const width of [300, 760]) {
      const svg = songSvg(s, tab, { width, view: "both" });
      assert.ok(!/NaN|undefined/.test(svg), t.id);
      assert.equal(lineOf(s, width).filter((x) => x === undefined).length, 0, t.id);
    }
    assert.equal(timeline(s).filter((e) => e.note !== undefined).length, s.sounding.length);
  }
});

test("scale exercises stay in one hand position and walk the right notes", () => {
  const notes = positionNotes("G", "major", 2);
  assert.ok(notes.every((n) => n.f >= 1 && n.f <= 5));
  assert.ok(notes.every((n) => [7, 9, 11, 0, 2, 4, 6].includes(n.m % 12)), "only G major");
  const s = build(scaleExercise({ tonic: "G", scale: "major", pattern: "straight", pos: 2, rhythm: "e", tempo: 80 }));
  assert.deepEqual(s.sounding.slice(0, 3).map((n) => n.name), ["G3", "A3", "B3"]);
  assert.equal(s.sounding[0].name, s.sounding[s.sounding.length - 1].name, "ends home");
  const t = tabify(s);
  t.forEach(([str, f], i) => assert.equal(OPEN[str] + f, s.sounding[i].midi));
});

test("every scale exercise and chord exercise builds, for every key", () => {
  for (const tonic of KEYS) {
    for (const scale of Object.keys(SCALES))
      for (const pattern of Object.keys(PATTERNS))
        for (const rhythm of Object.keys(RHYTHMS)) {
          const pos = POSITIONS[(tonic.length + pattern.length) % POSITIONS.length],
            s = build(scaleExercise({ tonic, scale, pattern, pos, rhythm, tempo: 80 }));
          assert.deepEqual(check(s), [], s.id);
          assert.deepEqual(playability(s, tabify(s)), [], s.id);
        }
    for (const prog of Object.keys(PROGRESSIONS))
      for (const shape of Object.keys(SHAPES))
        for (const style of Object.keys(STYLES))
          for (const beats of [1, 2, 4]) {
            const s = build(chordExercise({ tonic, prog, shape, style, beats, tempo: 80 }));
            assert.deepEqual(check(s), [], s.id);
            assert.deepEqual(playability(s, tabify(s)), [], s.id);
          }
  }
});

test("chord exercises name their chords and use real shapes", () => {
  const s = build(chordExercise({ tonic: "G", prog: "I-IV-V-I", shape: "open", style: "block", beats: 4, tempo: 80 }));
  assert.deepEqual(s.sounding.map((n) => n.label), ["G", "C", "D", "G"]);
  const tab = tabify(s);
  assert.ok(tab.every((c) => c.all.length >= 3), "whole chords");
  assert.ok(songSvg(s, tab, { width: 760, view: "both" }).includes('class="sg-lab"'));
  const barres = build(chordExercise({ tonic: "A", prog: "shift", shape: "barre", style: "block", beats: 4, tempo: 80 }));
  assert.equal(barres.sounding.length, 8);
});

test("an exercise can be saved and reopened by its id, and a bad id is refused", () => {
  const s = scaleExercise({ tonic: "Eb", scale: "dorian", pattern: "thirds", pos: 5, rhythm: "t", tempo: 72 });
  assert.equal(exerciseById(s.id).bars, s.bars);
  const c = chordExercise({ tonic: "A", prog: "blues", shape: "any", style: "arp", beats: 2, tempo: 88 });
  assert.equal(exerciseById(c.id).bars, c.bars);
  assert.equal(exerciseById("ex:s:H:major:thirds:5:t:72"), null);
  assert.equal(exerciseById("joy"), null);
});

test("the lane: each note reaches it exactly on time, and the line never jumps", () => {
  const s = build(tunes.find((t) => t.level === 3 && t.style === "reel")),
    r = ribbon(s, tabify(s), { view: "both" });
  assert.equal((r.svg.match(/class="sg-sys"/g) || []).length, 1, "one endless line");
  r.starts.forEach((u, i) => assert.ok(Math.abs(ribbonX(r, u) - r.xs[i]) < 1e-6, `note ${i}`));
  let last = ribbonX(r, -8);
  for (let u = -8; u < s.total + 4; u += 0.25) {
    const x = ribbonX(r, u);
    assert.ok(x >= last, `moves one way only at ${u}`);
    assert.ok(x - last < 80, `no jump at ${u}: ${x - last}px`);
    last = x;
  }
});
