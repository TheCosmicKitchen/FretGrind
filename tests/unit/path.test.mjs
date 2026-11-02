import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { SONGS } from "../../docs/js/songs/data.js";
import { build, check } from "../../docs/js/songs/format.js";
import { GUITAR_PATH, PATH_SONGS, chunksOf, coachPlan, formOf, lessonsIn, lessonsOf, nextPathSong, sliceDef, speedWord, starsFor } from "../../docs/js/songs/path.js";
import { SKILLS } from "../../docs/js/songs/moments-data.js";
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
  assert.deepEqual(plan.filter((p) => p.kind === "full").map((p) => p.pct), [75, 90, 100]);
  for (const x of every.filter((_, i) => i % 23 === 0)) assert.ok(coachPlan(x).length >= 3, x.id);
  assert.deepEqual([0.95, 0.85, 0.72, 0.5].map(starsFor), [3, 2, 1, 0]);
});

test("phrases follow the music: they end on a long note, and a repeat after a pick-up is still a repeat", () => {
  const breath = build({ id: "x", title: "x", key: "C", time: "4/4", bars: "C5:2 D5:2 E5:2 F5:2 G5:2 A5:2 G5:2 F5:2 | E5:2 D5:2 C5:2 D5:2 E5:2 F5:2 G5:2 A5:2 | B5:2 A5:2 G5:16/2 | C5:2 D5:2 E5:2 F5:2 G5:2 A5:2 G5:2 F5:2 | E5:16" }),
    cut = chunksOf(breath);
  assert.equal(cut[0].to, 2, JSON.stringify(cut));
  const tune = Array(4).fill("C5:4 D5:4 E5:4 F5:2 G5:2 | A5:4 G5:4 F5:4 E5:2 D5:2 | C5:4 E5:4 G5:4 A5:4 | G5:12 C5:4").join(" | "),
    s = build({ id: "y", title: "y", key: "C", time: "4/4", pickup: 4, bars: `C5:4 | ${tune} | C5:12` }),
    { chunks, parts } = lessonsOf(s);
  assert.ok(chunks.some((c) => c.same === 0), JSON.stringify(chunks));
  assert.ok(parts.length < chunks.length);
});

test("a nearly repeated phrase is recognised, and skips the note-by-note step", () => {
  const a = "C5:4 D5:4 E5:4 F5:4 | G5:4 F5:4 E5:4 D5:4 | C5:4 E5:4 G5:4 E5:4",
    s = build({ id: "x", title: "x", key: "C", time: "4/4", bars: `${a} | D5:16 | ${a} | C5:16` }),
    { parts } = lessonsOf(s);
  assert.ok(parts.some((p) => p.was === 1), JSON.stringify(parts));
  const n = parts.find((p) => p.was === 1).n,
    steps = coachPlan(s).filter((x) => x.part === n && x.kind !== "warm").map((x) => x.kind);
  assert.ok(steps.includes("hear") && !steps.includes("wait"), steps.join());
});

test("lessons build towards the whole piece", () => {
  for (const s of every.filter((_, i) => i % 7 === 0)) {
    const plan = coachPlan(s),
      lessons = lessonsIn(plan),
      end = s.barLens.length - 1,
      { parts } = lessonsOf(s);
    assert.equal(lessons.length, plan[0].lessons, s.id);
    assert.equal(lessons[lessons.length - 1].name, "Put it together", s.id);
    assert.equal(lessons[0].first, 0, s.id);
    lessons.forEach((L, i) => {
      if (i) assert.equal(L.first, lessons[i - 1].last + 1, s.id);
      if (i && i < lessons.length - 1) assert.equal(plan[L.first].kind, "warm", `${s.id} lesson ${L.n} recalls the last`);
    });
    assert.deepEqual([...new Set(plan.filter((x) => x.kind === "hear").map((x) => x.part))], parts.map((p) => p.n), s.id);
    assert.ok(plan.every((x) => x.from >= 0 && x.to <= end && x.from <= x.to), s.id);
    plan.filter((x) => x.kind === "spot").forEach((x) => assert.ok(build(sliceDef(s, x.from, x.to)).sounding.length >= 4, s.id));
    const tally = (k) => plan.filter((x) => x.kind === k).length;
    assert.equal(tally("full"), 3, s.id);
    assert.equal(tally("join"), Math.max(0, parts.length - 1), s.id);
  }
  const g = coachPlan(every.find((x) => x.id === "greensleeves")),
    runs = g.filter((x) => x.kind === "run");
  assert.ok(runs.length && runs.every((x) => x.from === 0), "runs go from the top");
  assert.ok(runs.every((x, i) => !i || x.to > runs[i - 1].to), "and reach further each time");
});

test("the form strip covers the piece and marks repeats by the part they play", () => {
  for (const s of every.filter((_, i) => i % 29 === 0)) {
    const form = formOf(s);
    assert.equal(form.reduce((a, f) => a + f.bars, 0), s.barLens.length, s.id);
    assert.ok(form.filter((f) => f.repeat).every((f) => f.n >= 0), s.id);
  }
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

test("a piano piece joins each part to the last and runs what you have so far", () => {
  const bar = (a, b) => `${a}5/C3:4 ${b}5/E3:4 ${a}5/G3:4 ${b}5/C3:4`,
    tunes = [["C", "D"], ["E", "F"], ["G", "A"], ["B", "A"], ["F", "E"], ["D", "E"]].flatMap(([a, b]) => [bar(a, b), bar(b, a), bar(a, a), bar(b, b)]),
    p = { id: "x", title: "x", key: "C", bars: tunes },
    les = pieceLessons(p),
    parts = partsOfPiece(p);
  assert.ok(parts.length >= 4, parts.length + " parts");
  assert.equal(les.filter((l) => l.id.endsWith("j")).length, parts.length - 1);
  assert.ok(les.some((l) => l.id.endsWith("s")));
  assert.equal(les[les.length - 1].mode, "read");
  const twice = { id: "y", title: "y", key: "C", bars: [...tunes.slice(0, 4), ...tunes.slice(0, 4), ...tunes.slice(4, 8)] };
  assert.ok(partsOfPiece(twice).reduce((a, x) => a + x.steps.length, 0) < stepsOf(twice).length, "a repeat is learned once");
});

test("the piano path covers the keyboard library, easiest first", () => {
  assert.equal(PIANO_PATH.length, 6);
  const ids = new Set(pieces.map((p) => p.id));
  assert.equal(PIANO_PATH.flatMap((s) => s.songs).length, pieces.length);
  for (const s of PIANO_PATH) for (const x of s.songs) assert.ok(ids.has(x.id), x.id);
  assert.ok(!/Chorale/.test(PIANO_PATH[0].songs[0].title), "a first piece should not be a four-voice chorale");
});

test("levels spread across the ladder and keep a sensible order", () => {
  const rows = JSON.parse(readFileSync(join(lib, "index.json"), "utf8"));
  for (const lv of [1, 2, 3, 4, 5, 6]) assert.ok(rows.filter((r) => r[4] === lv).length >= 100, "level " + lv);
  const mean = (lv) => { const x = rows.filter((r) => r[4] === lv); return x.reduce((a, r) => a + r[9], 0) / x.length; };
  for (const lv of [1, 2, 3, 4, 5]) assert.ok(mean(lv) < mean(lv + 1), "hardness rises with level");
});

test("the library has real variety of speed, and reels move", () => {
  const rows = JSON.parse(readFileSync(join(lib, "index.json"), "utf8")),
    share = (w) => rows.filter((r) => speedWord(r[10]) === w).length / rows.length;
  for (const w of ["Slow", "Moderate", "Fast"]) assert.ok(share(w) >= 0.12, w + " " + share(w));
  assert.ok(new Set(rows.map((r) => r[7])).size >= 60, "many different tempos");
  const reels = rows.filter((r) => r[3] === "reel" && r[4] >= 4);
  assert.ok(reels.filter((r) => r[10] >= 4.5).length / reels.length > 0.9, "advanced reels are quick");
});

test("every skill drill is a real phrase that shows up as its own short piece", () => {
  assert.ok(SKILLS.length >= 10);
  const byId = new Map(tunes.map((t) => [t.id, t]));
  for (const k of SKILLS) {
    assert.ok(k.items.length >= 5, k.name + " has " + k.items.length);
    assert.ok(TRACKS[0].courses.some((c) => c.id === k.course), k.course);
    for (const x of k.items) {
      const [id, bars] = x.id.split("@"),
        [a, b] = bars.split("-").map(Number),
        t = byId.get(id);
      assert.ok(t, x.id);
      const part = build(sliceDef(build(t), a, b));
      assert.ok(part.sounding.length >= 6 && b - a <= 5, x.id);
    }
    assert.ok(k.items.every((x, i) => !i || k.items[i - 1].level <= x.level), k.name + " is easiest first");
  }
});

test("art songs are in the library, and only from composers who died before 1926", () => {
  const songs = tunes.filter((t) => t.src === "lieder");
  assert.ok(songs.length >= 300, songs.length + " songs");
  for (const who of ["Webern", "Berg", "Schoenberg", "Strauss", "Ives", "Warlock"]) assert.ok(!songs.some((t) => t.by.includes(who)), who);
  assert.ok(songs.some((t) => /Schubert/.test(t.by)));
});
