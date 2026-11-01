import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { SONGS } from "../../docs/js/songs/data.js";
import { build, check } from "../../docs/js/songs/format.js";
import { GUITAR_PATH, PATH_SONGS, chunksOf, coachPlan, nextPathSong, sliceDef, starsFor } from "../../docs/js/songs/path.js";
import { exerciseById } from "../../docs/js/songs/exercises.js";
import { PIANO_PATH, partsOfPiece, pieceLessons, stepsOf } from "../../docs/js/piano/songs.js";
import { TRACKS, courseStats, nodesOf } from "../../docs/js/courses/curriculum.js";
import { fresh, recordSong, sanitize } from "../../docs/js/courses/progress.js";
import { makePlan } from "../../docs/js/courses/today.js";
import { mapSvg } from "../../docs/js/courses/map.js";

const lib = fileURLToPath(new URL("../../docs/lib/", import.meta.url)),
  read = (re) => readdirSync(lib).filter((f) => re.test(f)).flatMap((f) => JSON.parse(readFileSync(join(lib, f), "utf8"))),
  tunes = read(/^songs-/),
  pieces = read(/^piano-\d/);
const every = [...SONGS, ...tunes].map(build);

test("every piece divides into parts that cover it exactly", () => {
  for (const s of every) {
    const ch = chunksOf(s);
    assert.equal(ch[0].from, 0, s.id);
    assert.equal(ch[ch.length - 1].to, s.barLens.length - 1, s.id);
    ch.forEach((c, i) => {
      if (i) assert.equal(c.from, ch[i - 1].to + 1, s.id);
    });
    assert.equal(ch.reduce((a, c) => a + (c.last - c.first + 1), 0), s.sounding.length, s.id);
  }
});

test("a repeat is learned once", () => {
  const s = build({ id: "x", title: "x", key: "C", time: "4/4", bars: Array(8).fill("C5:4 D5:4 E5:4 F5:4").join(" | ") }),
    ch = chunksOf(s);
  assert.ok(ch.length > 1);
  assert.ok(ch.slice(1).every((c) => c.same === 0), JSON.stringify(ch));
});

test("a slice of any piece is itself a sound piece", () => {
  for (const s of every.filter((_, i) => i % 11 === 0))
    for (const c of chunksOf(s)) {
      const part = build(sliceDef(s, c.from, c.to));
      assert.equal(part.sounding.length, c.last - c.first + 1, s.id);
      assert.deepEqual(part.sounding.map((n) => n.midi), s.sounding.slice(c.first, c.last + 1).map((n) => n.midi), s.id);
      assert.equal(check(part).filter((m) => !/has .* sixteenths/.test(m) || c.to < s.barLens.length - 1).length, 0, `${s.id} ${c.from}-${c.to}: ${check(part)}`);
    }
});

test("a lesson plan walks parts in order and ends with the whole piece at full speed", () => {
  const s = every.find((x) => x.id === "greensleeves"),
    plan = coachPlan(s);
  assert.deepEqual(plan.slice(0, 3).map((p) => p.kind), ["hear", "wait", "along"]);
  assert.ok(plan.some((p) => p.kind === "join"));
  const last = plan[plan.length - 1];
  assert.equal(last.kind, "full");
  assert.equal(last.pct, 100);
  assert.equal(plan[plan.length - 2].pct, 75);
  for (const x of every.filter((_, i) => i % 23 === 0)) assert.ok(coachPlan(x).length >= 2, x.id);
  assert.deepEqual([0.95, 0.85, 0.72, 0.5].map(starsFor), [3, 2, 1, 0]);
});

test("the guitar path sits beside the courses and every piece on it exists", () => {
  const ids = new Set([...SONGS, ...tunes].map((s) => s.id)),
    courses = TRACKS[0].courses.map((c) => c.id);
  assert.deepEqual(GUITAR_PATH.map((s) => s.course), courses);
  for (const st of GUITAR_PATH) {
    assert.ok(st.songs.length >= 4, st.course);
    for (const x of st.songs) assert.ok(x.ex ? exerciseById(x.id) : ids.has(x.id), `${st.course}: ${x.id}`);
  }
  assert.equal(new Set(PATH_SONGS.map((s) => s.id)).size, PATH_SONGS.length, "no piece twice");
  assert.equal(nextPathSong({}).id, "hotcross");
  assert.equal(nextPathSong({ hotcross: 90 }).id, "mary");
});

test("songs appear on the course map, count for nothing in test scores, and show as learned", () => {
  const c = TRACKS[0].courses[0],
    nodes = nodesOf(c),
    songs = nodes.filter((n) => n.kind === "song");
  assert.equal(songs.length, GUITAR_PATH[0].songs.length);
  assert.equal(nodes[nodes.length - 1].kind, "test");
  const p = fresh();
  assert.equal(courseStats(p, "guitar", c).tests, nodes.filter((n) => n.kind === "cp" || n.kind === "test").length);
  recordSong(p, songs[0].song.id, 88, "2026-11-01");
  assert.equal(p.songs[songs[0].song.id], 88);
  assert.equal(sanitize(JSON.parse(JSON.stringify(p))).songs[songs[0].song.id], 88);
  const svg = mapSvg(c, "guitar", p, new Set(), null, null);
  assert.ok(svg.includes(`data-ln-node="song:${songs[0].song.id}"`));
  assert.equal(p.streak.n, 1, "learning a song counts as a study day");
});

test("the daily plan includes the next piece", () => {
  const items = makePlan(fresh(), 20, "2026-11-01");
  assert.ok(items.some((i) => i.kind === "song" && i.id === "hotcross"), JSON.stringify(items));
});

test("every piano piece reads, with both hands, and its parts cover it", () => {
  assert.ok(pieces.length >= 100, `${pieces.length} pieces`);
  for (const p of pieces) {
    const st = stepsOf(p);
    assert.equal(st.length, p.n, p.id);
    assert.ok(st.flatMap((s) => [...s.r, ...s.l]).every((m) => m >= 21 && m <= 108), p.id + " off the keyboard");
    const les = pieceLessons(p);
    assert.equal(les[les.length - 1].mode, "read");
    assert.ok(les.every((l) => l.parsed.length && l.parsed.every((x) => x.length)), p.id);
    assert.ok(partsOfPiece(p).every((x) => x.from <= x.to), p.id);
  }
});

test("a piano part goes right hand, left hand, together", () => {
  const p = { id: "x", title: "x", key: "C", bars: ["C5/C3:4 D5/:4 E5/G3:8", "F5/F3:16"] },
    les = pieceLessons(p);
  assert.deepEqual(les.slice(0, 3).map((l) => l.id.split(":")[1].slice(-1)), ["r", "l", "b"]);
  assert.deepEqual(les[0].parsed, [[72], [74], [76], [77]].slice(0, les[0].parsed.length));
  assert.deepEqual(les[1].parsed[0], [48]);
  assert.deepEqual(les[2].parsed[0], [72, 48]);
});

test("the piano path covers the keyboard library, easiest first", () => {
  assert.equal(PIANO_PATH.length, 6);
  const ids = new Set(pieces.map((p) => p.id));
  assert.equal(PIANO_PATH.flatMap((s) => s.songs).length, pieces.length);
  for (const s of PIANO_PATH) for (const x of s.songs) assert.ok(ids.has(x.id), x.id);
  assert.ok(!/Chorale/.test(PIANO_PATH[0].songs[0].title), "a first piece should not be a four-voice chorale");
});
