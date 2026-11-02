import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { SONGS } from "../../docs/js/songs/data.js";
import { build, check } from "../../docs/js/songs/format.js";
import { GUITAR_PATH, PATH_SONGS, chunksOf, coachPlan, formOf, lessonsIn, lessonsOf, nextPathSong, sliceDef, speedWord, starsFor } from "../../docs/js/songs/path.js";
import { SKILLS } from "../../docs/js/songs/moments-data.js";
import { demandsOf, skillsOf } from "../../docs/js/songs/demands.js";
import { chordChart, easiestCapo } from "../../docs/js/songs/harmony.js";
import { SIZES, anchorTip, changeDrill, changeKey, changeRun, changesOf, chartFor, chordId, chordPlan, chordSong, everyChange, generateRun, namedShape, recommendChanges, runById, runPlan, shapeOf } from "../../docs/js/songs/changes.js";
import { CHANGE_USE } from "../../docs/js/songs/changes-data.js";
import { STAGES, fitness } from "../../tools/syllabus.mjs";
import { spawnSync } from "node:child_process";
import { tabify } from "../../docs/js/songs/tabify.js";
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
    for (const x of st.songs) assert.ok(x.ex ? exerciseById(x.id) : ids.has(chordId(x.id)?.base || x.id), `${st.course}: ${x.id}`);
  }
  assert.equal(new Set(PATH_SONGS.map((s) => s.id)).size, PATH_SONGS.length, "no piece twice");
  assert.equal(nextPathSong({}).id, PATH_SONGS[0].id);
  assert.equal(nextPathSong({ [PATH_SONGS[0].id]: 90 }).id, PATH_SONGS[1].id);
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
  assert.ok(items.some((i) => i.kind === "song" && i.id === PATH_SONGS[0].id), JSON.stringify(items));
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
  for (const lv of [2, 3, 4, 5, 6]) assert.ok(rows.filter((r) => r[4] === lv).length >= 80, "level " + lv);
  assert.ok(rows.some((r) => r[4] === 1));
  const mean = (lv) => { const x = rows.filter((r) => r[4] === lv); return x.reduce((a, r) => a + r[9], 0) / x.length; };
  for (const lv of [2, 3, 4, 5]) assert.ok(mean(lv) < mean(lv + 1), "hardness rises with level");
});

test("the library has real variety of speed, and reels move", () => {
  const rows = JSON.parse(readFileSync(join(lib, "index.json"), "utf8")),
    share = (w) => rows.filter((r) => speedWord(r[10]) === w).length / rows.length;
  for (const w of ["Slow", "Moderate", "Fast"]) assert.ok(share(w) >= 0.12, w + " " + share(w));
  assert.ok(new Set(rows.map((r) => r[7])).size >= 60, "many different tempos");
  const reels = rows.filter((r) => r[3] === "reel" && r[4] >= 4);
  assert.ok(reels.filter((r) => r[10] >= 4).length / reels.length > 0.8, "advanced reels are quick");
  assert.ok(rows.filter((r) => r[4] === 2 && ["reel", "jig", "hornpipe"].includes(r[3])).every((r) => r[10] <= 3.3), "early targets are reachable");
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

test("a level is the hardest demand, and a steady tune is not a hard rhythm", () => {
  const make = (bars, time = "4/4") => build({ id: "x", title: "x", key: "C", time, level: 6, bars }),
    steady = make(Array(8).fill("C5:2 D5:2 E5:2 F5:2 G5:2 F5:2 E5:2 D5:2").join(" | ")),
    even = make(Array(8).fill("C5:1 D5:1 E5:1 F5:1 G5:1 F5:1 E5:1 D5:1").join(" | "), "2/4"),
    jerky = make(Array(8).fill("C5:3 D5:1 E5:4/3 F5:4/3 G5:4/3 F5:2 E5:1 D5:1 C5:4").join(" | "));
  assert.ok(demandsOf(steady, tabify(steady, 6)).rhythm <= 2);
  assert.ok(demandsOf(even, tabify(even, 6)).rhythm <= 2, "written in sixteenths, still even");
  assert.ok(demandsOf(jerky, tabify(jerky, 6)).rhythm >= 4);
  for (const s of every.filter((_, i) => i % 13 === 0)) {
    const d = demandsOf(s, tabify(s, 6));
    assert.ok(d.level >= Math.max(d.hand, d.rhythm, d.voices, d.reading), s.id);
    assert.ok(d.level <= 6, s.id);
  }
  const lessons = demandsOf(every.find((x) => x.id === "hotcross"), tabify(every.find((x) => x.id === "hotcross"), 6));
  assert.ok(lessons.level <= 2);
});

test("a tune's chords sound like its key, end at home, and use few chords", () => {
  const of = (id) => chordChart(every.find((x) => x.id === id));
  assert.deepEqual(of("hotcross").names.sort(), ["C", "G"]);
  assert.deepEqual(of("susanna").names.sort(), ["C", "G"]);
  assert.ok(of("greensleeves").names.includes("Am"));
  for (const s of every.filter((_, i) => i % 9 === 0)) {
    const c = chordChart(s),
      end = s.key.replace(/(dor|mix|phr|lyd|loc)$/, "").replace(/m$/, "");
    assert.equal(c.spans[0].start, s.pickup || 0, s.id);
    assert.ok(c.spans[c.spans.length - 1].name.replace(/m|7/g, "").replace("#", "♯") === end.replace("#", "♯") || c.spans.at(-1).deg.toLowerCase() === "i", s.id);
    assert.ok(c.names.length <= 7, s.id);
    assert.ok(c.spans.every((sp, i) => !i || sp.start > c.spans[i - 1].start), s.id);
  }
});

test("a capo appears only when it spares the hand", () => {
  assert.equal(easiestCapo(chordChart(every.find((x) => x.id === "hotcross"))), 0);
  const inBb = build({ id: "x", title: "x", key: "Bb", time: "4/4", level: 6, bars: "Bb4:4 D5:4 F5:4 D5:4 | Eb5:4 G5:4 Bb5:4 G5:4 | F5:4 A5:4 C6:4 A5:4 | Bb4:16" }),
    c = chartFor(inBb);
  assert.ok(c.capo > 0);
  assert.ok(c.names.every((n) => !/^(Bb|Eb|F)$/.test(n)), c.names.join());
});

test("a song's chords make a sound piece that follows its bars and carries its tune", () => {
  for (const s of every.filter((x, i) => i % 5 === 0 && x.sounding.filter((n) => n.pitches.length > 1).length < x.sounding.length * 0.2)) {
    for (const opt of [{}, { style: "arp" }, { style: "hold" }, { shapes: "barre" }]) {
      const c = build(chordSong(s, opt));
      assert.deepEqual(c.barLens, s.barLens, `${s.id} ${JSON.stringify(opt)}`);
      assert.equal(c.backing.length, s.sounding.length, s.id);
      assert.equal(check(c).length, 0, s.id);
    }
  }
});

test("chord drills start from the changes the song really uses", () => {
  const s = every.find((x) => x.id === "greensleeves"),
    c = build(chordSong(s)),
    moves = changesOf(c.chart),
    used = new Set(c.chart.spans.slice(1).flatMap((sp, i) => [`${c.chart.spans[i].name}>${sp.name}`, `${sp.name}>${c.chart.spans[i].name}`]));
  assert.ok(moves.length);
  assert.ok(moves.every((m) => used.has(`${m.a}>${m.b}`) && m.tip.length > 10));
  const plan = chordPlan(c),
    last = plan[plan.length - 1];
  assert.equal(last.kind, "full");
  assert.equal(last.pct, 100);
  assert.ok(plan.filter((p) => p.def).every((p) => build(p.def).sounding.length >= 2));
  assert.equal(plan[0].chords.length, 2);
  const drill = build(changeDrill(c.chart, moves[0].a, moves[0].b, 2));
  assert.equal(drill.barLens.length, 4);
  assert.ok(check(drill).length === 0);
  assert.match(anchorTip(shapeOf(0, "major"), shapeOf(9, "minor")), /Keep/, "C to Am keeps its shared fingers down");
});

test("barre lessons use barres, picked lessons pick", () => {
  assert.deepEqual(chordId("ch:bar:tune"), { id: "ch:bar:tune", base: "tune", style: "strum", shapes: "barre" });
  assert.equal(chordId("ch:arp:tune").style, "arp");
  assert.equal(chordId("tune"), null);
  const s = every.find((x) => x.id === "hotcross");
  assert.ok(build(chordSong(s, { style: "arp" })).sounding.every((n) => n.pitches.length === 1));
  assert.ok(chartFor(s, "barre").shapes === "barre" && shapeOf(7, "major", "barre").barre);
});

test("a lesson part always has some music in it", () => {
  const s = build({ id: "x", title: "x", key: "C", time: "4/4", bars: `${Array(6).fill("C5:2 D5:2 E5:2 F5:2 G5:2 A5:2 G5:2 E5:2").join(" | ")} | D5:2 D5:2 D5:2 D5:2 D5:2 D5:2 D5:2 D5:2` }),
    plan = coachPlan(s);
  assert.ok(lessonsOf(s).parts.every((p) => new Set(s.sounding.slice(p.first, p.last + 1).map((n) => n.midi)).size >= 3));
  assert.equal(plan[plan.length - 1].kind, "full");
});

test("small changes keep fingers down, big ones rebuild the shape", () => {
  const moved = (a, b) => namedShape(b).fingered.filter(([s, f]) => !namedShape(a).fingered.some(([t, g]) => t === s && g === f)).length;
  for (const c of everyChange()) {
    assert.equal(c.cost <= SIZES.find((x) => x.id === c.size).most, true, c.key);
    if (c.size === "small") assert.ok(moved(c.a, c.b) <= 2, c.key);
    assert.ok(c.tip.length > 10, c.key);
  }
  assert.equal(everyChange().find((c) => c.key === changeKey("C", "Am")).size, "small");
  assert.ok(everyChange().filter((c) => c.a === "F" || c.b === "F").every((c) => ["big", "leap"].includes(c.size)));
});

test("recommended changes are the ones real songs use, and mastered ones drop down", () => {
  for (const { id } of SIZES) {
    const list = recommendChanges(id, CHANGE_USE);
    assert.ok(list.length >= 2, id);
    assert.ok(list.every((c) => c.size === id), id);
  }
  const small = recommendChanges("small", CHANGE_USE);
  assert.ok(small[0].n >= small[small.length - 1].n);
  const after = recommendChanges("small", CHANGE_USE, { [small[0].key]: 0.95 });
  assert.notEqual(after[0].key, small[0].key, "a mastered change gives way");
  for (const v of Object.values(CHANGE_USE)) assert.ok(v.n >= 1 && v.songs.length >= 1);
  const known = recommendChanges("medium", CHANGE_USE, {}, ["Em", "G"])[0];
  assert.ok([known.a, known.b].some((x) => ["Em", "G"].includes(x)), "a recommendation builds on chords you have");
});

test("generated runs stay in size, keep moving, and can always be played", () => {
  for (const size of SIZES)
    for (let seed = 1; seed <= 25; seed++) {
      const run = generateRun(size.id, CHANGE_USE, seed);
      assert.ok(run.length >= 4 && new Set(run).size >= 3, `${size.id} ${seed}: ${run}`);
      assert.ok(run.every((x, i) => !i || x !== run[i - 1]));
      const s = build(changeRun(run, 2, 72));
      assert.equal(check(s).length, 0);
      assert.deepEqual(runById(s.id).names, run);
      assert.ok(runPlan(s).every((st) => st.def));
    }
  assert.deepEqual(generateRun("big", CHANGE_USE, 7), generateRun("big", CHANGE_USE, 7), "the same seed gives the same run");
  assert.notDeepEqual(generateRun("big", CHANGE_USE, 7), generateRun("big", CHANGE_USE, 8));
  assert.equal(runById("chg:Nope,C:4:66"), null);
  assert.equal(runById("hotcross"), null);
});

test("the adversarial audit finds nothing a teacher would throw out", () => {
  const out = spawnSync(process.execPath, [fileURLToPath(new URL("../../tools/audit.mjs", import.meta.url)), "20"], { encoding: "utf8" });
  assert.equal(out.status, 0, out.stdout + out.stderr);
});

test("hill climbing only ever raises the score, and stays inside each stage's rules", () => {
  const skill = ["string:5", "string:4"],
    make = (id, h, extra = {}) => ({ id, title: id, by: "x", level: 1, d: { hand: 1, rhythm: 1, voices: 1, reading: 1, length: 1 }, skills: skill, strings: [5, 4], top: 3, h, nps: 2, time: "4/4", key: "C", q: { pitches: 7, turns: 0.3, same: 0.1, run: 2, open: 0.1 }, fit: 0.9, ...extra });
  const units = [make("a", 1), make("b", 2)].map((x) => ({ x, chord: false })),
    st = STAGES[0],
    base = fitness([{ st, units }]),
    better = fitness([{ st, units: units.map((u, i) => (i ? { ...u, x: make("c", 2, { q: { pitches: 9, turns: 0.45, same: 0.05, run: 2, open: 0 } }) } : u)) }]),
    dull = fitness([{ st, units: units.map((u, i) => (i ? { ...u, x: make("d", 2, { q: { pitches: 3, turns: 0.05, same: 0.6, run: 8, open: 0.9 } }) } : u)) }]);
  assert.ok(better > base && dull < base);
});

test("a song's lessons open by getting the hands ready for that tune", () => {
  const s = every.find((x) => x.id === "greensleeves"),
    tab = tabify(s, s.level),
    plan = coachPlan(s, tab),
    prep = plan.filter((p) => p.kind === "prep");
  assert.ok(prep.length >= 1 && plan[0].lessonName === "Get ready");
  for (const p of prep) assert.equal(check(build(p.def)).filter((m) => !/has .* sixteenths/.test(m)).length, 0, p.def.id);
  const notes = build(prep[0].def);
  assert.ok(notes.sounding.every((n) => s.sounding.some((x) => x.midi === n.midi)), "only the tune's own notes");
  assert.equal(lessonsIn(plan)[0].prep, true);
});

test("the syllabus keeps each stage to what it promises, and each song adds little", () => {
  const defs = new Map([...SONGS, ...tunes].map((d) => [d.id, d])),
    heard = new Set(),
    names = new Set();
  GUITAR_PATH.forEach((st, i) => {
    const gate = STAGES[i];
    assert.equal(st.course, gate.course);
    for (const x of st.songs.filter((y) => !y.ex && !y.ch)) {
      const s = build(defs.get(x.id)),
        tab = tabify(s, 6),
        d = demandsOf(s, tab, chunksOf(s).filter((c) => c.same < 0).reduce((a, c) => a + (c.last - c.first + 1), 0));
      for (const k of Object.keys(gate.most)) assert.ok(d[k] <= gate.most[k], `${st.course} ${x.title}: ${k} ${d[k]}`);
      const fresh = skillsOf(s, tab).filter((k) => !heard.has(k));
      assert.ok(fresh.length <= 4, `${st.course} ${x.title} adds ${fresh}`);
      fresh.forEach((k) => heard.add(k));
      const tune = x.title.toLowerCase().replace(/\(.*?\)|[^a-z ]/g, "").replace(/^(the|sweet) /, "").trim();
      assert.ok(!names.has(tune), `${x.title} appears twice`);
      names.add(tune);
    }
  });
  const median = (st) => { const l = st.songs.filter((x) => !x.ex && !x.ch).map((x) => x.level).sort((a, b) => a - b); return l[l.length >> 1]; },
    tuneStages = GUITAR_PATH.filter((st) => st.songs.some((x) => !x.ex && !x.ch));
  tuneStages.slice(1).forEach((st, i) => assert.ok(median(st) >= median(tuneStages[i]) - 1, st.course));
  assert.ok(median(tuneStages[tuneStages.length - 1]) >= 4);
});

test("chord stages are songs, built from tunes you can already play", () => {
  const g3 = GUITAR_PATH.find((s) => s.course === "G3");
  assert.ok(g3.songs.length >= 4 && g3.songs.every((x) => x.ch), "no bare progressions");
  const earlier = new Set(GUITAR_PATH.slice(0, 3).flatMap((s) => s.songs.map((x) => x.id)));
  assert.ok(g3.songs.filter((x) => earlier.has(chordId(x.id).base)).length >= g3.songs.length / 2);
  const seen = new Set();
  for (const x of g3.songs) {
    const fresh = x.by.split(" ").filter((n) => !seen.has(n));
    assert.ok(fresh.length <= 3, x.title);
    fresh.forEach((n) => seen.add(n));
  }
});

test("art songs are in the library, and only from composers who died before 1926", () => {
  const songs = tunes.filter((t) => t.src === "lieder");
  assert.ok(songs.length >= 300, songs.length + " songs");
  for (const who of ["Webern", "Berg", "Schoenberg", "Strauss", "Ives", "Warlock"]) assert.ok(!songs.some((t) => t.by.includes(who)), who);
  assert.ok(songs.some((t) => /Schubert/.test(t.by)));
});
