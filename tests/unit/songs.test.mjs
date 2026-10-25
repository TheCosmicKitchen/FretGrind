import test from "node:test";
import assert from "node:assert/strict";
import { SONGS } from "../../docs/js/songs/data.js";
import { build, check, keySig, parsePitch } from "../../docs/js/songs/format.js";
import { LEVELS, places, playability, tabify } from "../../docs/js/songs/tabify.js";
import { countIn, timeline } from "../../docs/js/songs/player.js";
import { layout, lineOf, songSvg } from "../../docs/js/songs/draw.js";
import { OPEN } from "../../docs/js/core/theory.js";

const built = SONGS.map(build);

test("pitches and key signatures parse", () => {
  assert.equal(parsePitch("C4").midi, 60);
  assert.equal(parsePitch("F#4").midi, 66);
  assert.equal(parsePitch("Bb3").midi, 58);
  assert.equal(parsePitch("E5").step, 37); // same staff steps as the rest of the app (E4 = 30)
  assert.deepEqual(keySig("G"), { F: 1 });
  assert.deepEqual(keySig("F"), { B: -1 });
  assert.deepEqual(keySig("Am"), {});
  assert.throws(() => parsePitch("H2"));
});

test("every song is well formed: bar lengths, lyrics, range, metadata", () => {
  const ids = new Set();
  for (const s of built) {
    assert.deepEqual(check(s), [], s.id);
    assert.ok(!ids.has(s.id), "duplicate id " + s.id);
    ids.add(s.id);
    assert.ok(s.title && s.by && s.source && s.tags.length, s.id + " metadata");
    assert.ok([1, 2, 3, 4].includes(s.level) && s.tempo >= 40 && s.tempo <= 200, s.id);
    assert.equal(s.total % s.beat, 0, s.id + ": a loop must end on a beat");
  }
});

test("a wrong bar length or lyric count is caught", () => {
  const bad = build({ id: "x", title: "x", key: "C", time: "4/4", bars: "C5:4 C5:4 | C5:16", words: "a b" });
  const msgs = check(bad).join(" ");
  assert.match(msgs, /bar 1 has 8/);
  assert.match(msgs, /lyrics have 2 syllables for 3 notes/);
});

test("accidentals: shown once per bar, restored or cancelled when they change", () => {
  const s = build({ id: "x", title: "x", key: "G", time: "4/4", bars: "F5:4 F#5:4 F5:4 F#5:4 | F#5:16" });
  assert.deepEqual(s.sounding.map((n) => n.show), ["♮", "♯", "♮", "♯", null]);
  const e = built.find((x) => x.id === "elise");
  assert.equal(e.sounding[1].name, "D♯5");
  assert.equal(e.sounding[1].show, "♯");
  const bar1 = e.sounding.filter((n) => n.bar === 1);
  assert.equal(bar1.find((n) => n.name === "D5").show, "♮", "D natural after D sharp in the same bar");
});

test("tab: right pitch on every note, within the level's limits", () => {
  for (const s of built) {
    const tab = tabify(s);
    assert.deepEqual(playability(s, tab), [], s.id);
    tab.forEach(([str, fret], i) => assert.equal(OPEN[str] + fret, s.sounding[i].midi));
  }
});

test("tab: a fixed fingering in the song wins", () => {
  const s = build({ id: "x", title: "x", key: "C", time: "4/4", level: 1, bars: "E5:4=2.5 E5:4 E5:4 E5:4" });
  const tab = tabify(s);
  assert.deepEqual(tab[0], [4, 5]); // "=2.5": string 2 (the B string), fret 5
  assert.ok(places(52, 24).length > 0 && places(40, 24).length === 0); // written E3 is the lowest guitar note
  assert.ok(LEVELS[1].maxFret < LEVELS[4].maxFret);
});

test("click timeline: beats per bar, accents on downbeats, count-in ends before the first note", () => {
  for (const s of built) {
    const ev = timeline(s),
      clicks = ev.filter((e) => e.beat !== undefined),
      notes = ev.filter((e) => e.note !== undefined);
    assert.equal(notes.length, s.sounding.length);
    const g0 = s.pickup || 0;
    clicks.forEach((c) => assert.equal(c.beat === 0, (c.u - g0) % s.bar === 0, `${s.id} u=${c.u}`));
    const ci = countIn(s);
    assert.ok(ci.length > 0 && ci.every((c) => c.u < 0));
    assert.equal(ci.length * s.beat + g0 % s.bar, s.bar, s.id + ": the count-in is one bar up to the downbeat... or its pick-up");
  }
});

test("drawing: every note appears in staff and tab, lines fit the width, nothing is NaN", () => {
  for (const s of built)
    for (const width of [300, 390, 760]) {
      const tab = tabify(s);
      for (const view of ["staff", "tab", "both"]) {
        const svg = songSvg(s, tab, { width, view, lyrics: true });
        assert.ok(!/NaN|undefined/.test(svg), `${s.id} ${width} ${view}`);
        const staff = (svg.match(/class="sg-n"/g) || []).length,
          tabs = (svg.match(/class="sg-t"/g) || []).length;
        assert.equal(staff, view === "tab" ? 0 : s.sounding.length, `${s.id} staff notes`);
        assert.equal(tabs, view === "staff" ? 0 : s.sounding.length, `${s.id} tab notes`);
      }
      layout(s, width, true).forEach((ln) => assert.ok(ln.end <= width + 1, `${s.id}: a line is ${ln.end}px wide in ${width}px`));
      assert.equal(lineOf(s, width, true).length, s.sounding.length);
    }
});
