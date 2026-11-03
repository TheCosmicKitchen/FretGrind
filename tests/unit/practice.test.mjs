/* The practice session, Fix it and the speed trainer, and the backup that protects it all. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { SONGS } from "../../docs/js/songs/data.js";
import { build } from "../../docs/js/songs/format.js";
import { PATH_SONGS, sliceDef } from "../../docs/js/songs/path.js";
import { CLEAN, barsWord, climbPass, climbStart, fixPlan, hardPart, speedPlan, worstBars } from "../../docs/js/songs/fix.js";
import { SONG_KINDS, knownChords, makeSession } from "../../docs/js/songs/session.js";
import { fresh, recordSong, sanitize } from "../../docs/js/courses/progress.js";
import { makePlan } from "../../docs/js/courses/today.js";
import { S, backupCode, readBackup, restoreBackup, startFresh } from "../../docs/js/core/store.js";

const song = build(SONGS.find((s) => s.bars.split("|").length >= 8)),
  allOk = () => song.sounding.map(() => ({ state: "ok" })),
  firstOf = (bar) => song.sounding.findIndex((n) => n.bar === bar),
  ruin = (notes, bar, state) => song.sounding.forEach((n, i) => n.bar === bar && (notes[i] = { state }));

test("a clean run has nothing to fix, and silence is the microphone's fault", () => {
  assert.equal(worstBars(song, allOk()), null);
  assert.equal(worstBars(song, song.sounding.map(() => ({ state: "miss" }))), null);
});

test("the worst bar is found, with its neighbour when that went wrong too", () => {
  const busy = [...new Set(song.sounding.map((n) => n.bar))].find((b) => b > 1 && song.sounding.filter((n) => n.bar === b).length >= 4 && song.sounding.some((n) => n.bar === b + 1));
  assert.ok(busy !== undefined && firstOf(busy) > 0);
  const one = allOk();
  ruin(one, busy, "wrong");
  assert.deepEqual([worstBars(song, one).from, worstBars(song, one).to], [busy, busy]);
  assert.equal(worstBars(song, one).pitch, true, "wrong notes are a pitch problem");
  ruin(one, busy + 1, "wrong");
  const two = worstBars(song, one);
  assert.deepEqual([two.from, two.to], [busy, busy + 1]);
  const late = allOk();
  ruin(late, busy, "late");
  assert.equal(worstBars(song, late)?.pitch, false, "late notes are a timing problem");
});

test("every note of every own song can be handed to worstBars", () => {
  for (const def of SONGS) {
    const s = build(def),
      notes = s.sounding.map((_, i) => ({ state: i % 2 ? "wrong" : "ok" })),
      w = worstBars(s, notes);
    if (w) assert.ok(w.from <= w.to && w.to < s.barLens.length && w.score >= 0 && w.score < 1, s.id);
  }
});

test("a fix plan hears the bars, builds them up, and puts them back", () => {
  const steps = fixPlan(song, 3, 4, false),
    kinds = steps.map((x) => x.kind);
  assert.deepEqual(kinds, ["hear", "climb", "along"]);
  assert.deepEqual([steps[2].from, steps[2].to], [2, 5], "back in place takes the bars either side");
  assert.ok(fixPlan(song, 3, 4, true).some((x) => x.kind === "wait"), "wrong notes are found with no clock first");
  const end = song.barLens.length - 1;
  assert.ok(!fixPlan(song, 0, end, false).some((x) => x.kind === "along"), "the whole piece has no bars either side");
  for (const st of steps) assert.ok(build(sliceDef(song, st.from, st.to)).sounding.length, "each step is playable");
});

test("a climb speeds up on clean runs, and only then", () => {
  const c = climbStart({ pct: 60, goal: 100, step: 10, need: 2, max: 30 });
  assert.equal(climbPass(c, 0.9), "");
  assert.equal(c.pct, 60, "one clean run isn't enough");
  assert.equal(climbPass(c, 0.9), "up");
  assert.equal(c.pct, 70);
  climbPass(c, 0.9);
  climbPass(c, 0.7);
  climbPass(c, 0.9);
  assert.equal(c.pct, 70, "clean runs must be in a row");
  assert.equal(c.best, 70);
  for (let i = 0; i < 20 && !c.over; i++) climbPass(c, 1);
  assert.equal(c.over, "top");
  assert.equal(c.pct, 100);
  assert.equal(c.best, 100);
});

test("a climb comes down when it falls apart, but not forever, and it stops", () => {
  const c = climbStart({ pct: 60, goal: 100, step: 10, need: 2, max: 12 });
  climbPass(c, 0.3);
  assert.equal(climbPass(c, 0.3), "down");
  assert.equal(c.pct, 50);
  for (let i = 0; i < 20 && !c.over; i++) climbPass(c, 0.3);
  assert.equal(c.pct, 40, "never lower than two steps down");
  assert.equal(c.over, "rest", "stops by itself, so a dead microphone can't loop for ever");
  assert.equal(c.best, 0);
  assert.ok(CLEAN > 0.7, "harder than passing a lesson");
});

test("the speed trainer fits the music, and starts near your best", () => {
  const end = song.barLens.length - 1,
    [one] = speedPlan(song, 0, end);
  assert.equal(one.kind, "climb");
  assert.ok(one.pct <= 60 && one.goal === 100);
  assert.equal(speedPlan(song, 0, end, 85)[0].pct, 75);
  assert.equal(speedPlan(song, 0, end, 40)[0].pct, one.pct, "never below the usual start");
  assert.equal(speedPlan(song, 0, end, 100)[0].pct, 80);
  const long = { ...song, barLens: Array(200).fill(song.bar) },
    [big] = speedPlan(long, 0, 199);
  assert.ok(big.need === 1 && big.step === 10 && big.max >= 4, "a long piece doesn't ask for sixteen runs");
  const part = hardPart(song);
  assert.ok(part.from >= 0 && part.to <= end);
});

test("bars are named as the score numbers them", () => {
  assert.equal(barsWord({ pickup: 0 }, 2, 3), "bars 3–4");
  assert.equal(barsWord({ pickup: 2 }, 2, 3), "bars 2–3");
  assert.equal(barsWord({ pickup: 0 }, 4, 4), "bar 5");
});

const blank = (o = {}) => ({ learn: {}, done: {}, moved: {}, weak: {}, ...o });

test("day one: how to hold the guitar, then the first piece", () => {
  const items = makeSession(fresh(), 20, "2026-11-02", blank());
  assert.equal(items[0].kind, "lesson");
  assert.ok(items.some((x) => x.kind === "song" && x.id === PATH_SONGS[0].id));
  assert.ok(items.reduce((a, x) => a + x.cost, 0) <= 20);
});

test("a session keeps what you have, fixes what broke and moves on, in order", () => {
  const p = sanitize(fresh()),
    P = blank({ weak: { b: { from: 3, to: 4, at: "bars 4–5", pitch: true, d: "2026-11-01", t: "Tune" } } }),
    day = "2026-11-02";
  for (const x of PATH_SONGS.slice(0, 8)) {
    recordSong(p, x.id, 90, "2026-10-20", x.title);
    P.learn[x.id] = { n: 9, stars: 2, lesson: 1, lessons: 1 };
    P.done[x.id] = 1;
  }
  p.rep[PATH_SONGS[7].id].n = "2026-12-01"; // not due
  const items = makeSession(p, 30, day, P),
    kinds = items.map((x) => x.kind);
  assert.ok(items.reduce((a, x) => a + x.cost, 0) <= 30);
  assert.ok(kinds.includes("replay") && kinds.includes("fix") && kinds.includes("song"), kinds.join());
  assert.ok(kinds.indexOf("fix") < kinds.indexOf("song"), "trouble spots while you're fresh");
  assert.ok(kinds.indexOf("song") < kinds.indexOf("replay"), "new music before old");
  assert.equal(new Set(items.filter((x) => x.kind === "replay").map((x) => x.id)).size, kinds.filter((k) => k === "replay").length, "no piece twice");
  const fix = items.find((x) => x.kind === "fix");
  assert.deepEqual([fix.id, fix.from, fix.to, fix.title], ["b", 3, 4, "Tune, bars 4–5"]);
  const short = makeSession(p, 5, day, P);
  assert.ok(short.reduce((a, x) => a + x.cost, 0) <= 5, "a short day stays short");
  assert.ok(short.length >= 1);
  assert.ok(items.every((x) => x.title), "everything has a name to show");
});

test("chord warm-ups wait until you know two chords", () => {
  const P = blank();
  assert.ok(!makeSession(fresh(), 20, "2026-11-02", P).some((x) => x.kind === "warm"));
  for (const x of PATH_SONGS.filter((s) => s.ch).slice(0, 3)) P.done[x.id] = 1;
  assert.ok(knownChords(P).length >= 2);
  const warm = makeSession(fresh(), 20, "2026-11-02", P).find((x) => x.kind === "warm");
  assert.match(warm.id, /^chg:[^,]+,[^:]+:4:66$/);
});

test("every session step knows where it runs", () => {
  for (const k of ["warm", "fix", "song", "climb", "replay", "encore"]) assert.ok(SONG_KINDS.includes(k));
});

test("no guitar with you: the plan asks for nothing that needs one", () => {
  const p = sanitize(fresh());
  p.noGuitar = 1;
  recordSong(p, "tune", 90, "2026-10-20", "Tune");
  const kinds = makePlan(p, 30, "2026-11-02").map((x) => x.kind);
  assert.ok(!kinds.includes("replay") && !kinds.includes("song"), kinds.join());
});

test("minutes of practice survive a save, and 30 minutes is a plan length", () => {
  const p = fresh();
  p.days["2026-11-02"] = { les: 1, tst: 0, rev: 0, q: 0, min: 24 };
  p.min = 30;
  const c = sanitize(p);
  assert.equal(c.days["2026-11-02"].min, 24);
  assert.equal(c.min, 30);
});

test("the backup holds everything but this device's microphone settings, in any alphabet", () => {
  startFresh();
  Object.assign(S, { xp: 50, courses: { rep: { a: { t: "Что-то – “quoted”" } } }, songs: { learn: { a: { n: 3 } }, moved: { "C>G": 0.9 } }, listen: { latency: 120 }, piano: { x: 1 } });
  const code = backupCode();
  assert.match(code, /^FG2\.[A-Za-z0-9+/=]+$/);
  const raw = readBackup(`my backup: ${code} thanks`);
  assert.equal(raw.courses.rep.a.t, "Что-то – “quoted”");
  assert.deepEqual(raw.songs.moved, { "C>G": 0.9 });
  assert.equal(raw.listen, undefined);
  S.listen = { latency: 80 };
  S.xp = 0;
  raw.best = "<img src=x onerror=alert(1)>";
  restoreBackup(raw);
  assert.equal(S.xp, 50);
  assert.equal(S.best, 0, "numbers shown on the page stay numbers");
  assert.deepEqual(S.listen, { latency: 80 }, "this device's settings stay");
  assert.equal(S.piano.x, 1);
});

test("a big save fits, and rubbish is turned away", () => {
  startFresh();
  S.it = Object.fromEntries(Array.from({ length: 40000 }, (_, i) => [`staff:${i}`, { n: i }]));
  assert.equal(Object.keys(readBackup(backupCode()).it).length, 40000);
  for (const junk of ["", "FG2.", "FG2.!!!", "hello", "FG2." + btoa("not json"), "FG2." + btoa("[1,2]"), "FG2." + btoa("{}")]) assert.equal(readBackup(junk), null, junk);
});
