/* An adversarial pass over everything a learner meets: every piece on the path, every step of every lesson. It tries to find what a
   teacher would throw out, and prints the worst of it. Run: node tools/audit.mjs   (exit 1 if anything fails a hard check) */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { SONGS } from "../docs/js/songs/data.js";
import { build, check } from "../docs/js/songs/format.js";
import { tabify } from "../docs/js/songs/tabify.js";
import { GUITAR_PATH, coachPlan, sliceDef } from "../docs/js/songs/path.js";
import { SIZES, changeRun, changesOf, chordId, chordPlan, chordSong, generateRun, namedShape, recommendChanges } from "../docs/js/songs/changes.js";
import { CHANGE_USE } from "../docs/js/songs/changes-data.js";
import { SKILLS } from "../docs/js/songs/moments-data.js";
import { chordCost } from "../docs/js/courses/motion.js";
import { musicOf } from "../docs/js/songs/demands.js";

const lib = fileURLToPath(new URL("../docs/lib/", import.meta.url)),
  tunes = readdirSync(lib).filter((f) => /^songs-/.test(f)).flatMap((f) => JSON.parse(readFileSync(join(lib, f), "utf8"))),
  defs = new Map([...SONGS, ...tunes].map((d) => [d.id, d])),
  flaws = [],
  flag = (hard, where, what) => flaws.push({ hard, where, what }),
  changeCost = (a, b) => Math.max(chordCost(namedShape(a), namedShape(b)), chordCost(namedShape(b), namedShape(a)));

/* What a stand of notes looks like to the hand. */
function stand(s, tab) {
  const ns = s.sounding,
    m = musicOf(s, tab);
  return { n: ns.length, ...m };
}

for (const st of GUITAR_PATH)
  for (const x of st.songs) {
    if (x.ex) continue;
    const where = `${st.course} ${x.title}`,
      c = chordId(x.id),
      d = defs.get(c ? c.base : x.id);
    if (!d) { flag(true, where, "piece is missing"); continue; }
    const s = build(d),
      tab = tabify(s, 6),
      q = stand(s, tab);
    if (c) {
      const song = build(chordSong(s, c)),
        moves = changesOf(song.chart);
      if (song.chart.names.length < 2) flag(true, where, "only one chord");
      if (!moves.length) flag(true, where, "no changes to drill");
      if (song.chart.fit < 0.72) flag(false, where, `chords fit the tune poorly (${song.chart.fit})`);
      if (song.chart.moves / s.barLens.length > 1.4) flag(false, where, `chords change too often for a beginner (${song.chart.moves} in ${s.barLens.length} bars)`);
      for (const p of chordPlan(song)) if (p.def) { const b = build(p.def); if (b.sounding.length < 2) flag(true, where, `step "${p.title}" is empty`); }
      continue;
    }
    if (q.pitches < (st.course === "G1" ? 3 : 5)) flag(true, where, `only ${q.pitches} different notes`);
    const arpeggio = s.style === "classical"; // a study can sit on open strings and still be music
    if (q.same > 0.45) flag(true, where, `${Math.round(q.same * 100)}% of notes repeat the last one`);
    if (q.run >= 7 && !arpeggio) flag(true, where, `the same note ${q.run} times running`);
    if (q.open > 0.6 && !arpeggio) flag(true, where, `${Math.round(q.open * 100)}% open strings`);
    if (q.turns < 0.15) flag(false, where, `hardly any melodic shape (${q.turns.toFixed(2)})`);
    if (q.gaps > 0.15) flag(false, where, `${Math.round(q.gaps * 100)}% empty bars`);
    if (q.perBar < 2) flag(false, where, `only ${q.perBar.toFixed(1)} notes a bar`);
    for (const p of coachPlan(s, tab)) {
      const b = p.def ? build(p.def) : p.from === 0 && p.to === s.barLens.length - 1 ? s : build(sliceDef(s, p.from, p.to));
      if (!b.sounding.length) { flag(true, where, `step "${p.title}" has no notes`); continue; }
      const first = s.sounding.findIndex((n) => n.bar >= p.from),
        sub = p.def ? tabify(b, 6) : tab.slice(first, first + b.sounding.length),
        qs = stand(b, sub);
      const label = `step "${p.title}" bars ${p.from + 1}-${p.to + 1}`;
      if (qs.pitches < 2 && p.kind !== "prep") flag(true, where, `${label}: one note only`);
      else if (p.kind === "prep" && p.title === "The rhythm" && qs.open > 0.9) flag(true, where, `${label}: an open string over and over`);
      else if (qs.pitches < 3 && qs.n >= 4 && p.kind !== "prep") flag(false, where, `${label}: only ${qs.pitches} notes`);
      if (b.sounding.length < 3) flag(false, where, `${label}: only ${b.sounding.length} notes on the stand`);
    }
  }

/* ---------- does it hang together as a course? ---------- */
const units = GUITAR_PATH.flatMap((st, i) => st.songs.map((x) => ({ ...x, st, i }))),
  tuneAt = new Map(units.filter((u) => !u.ch && !u.ex).map((u, k) => [u.id, k])),
  orderOf = (u) => units.indexOf(u);
for (const u of units.filter((x) => x.ch)) {
  const base = chordId(u.id).base;
  if (u.st.course === "G3" && tuneAt.get(base) === undefined) flag(true, `${u.st.course} ${u.title}`, "a chord song on a tune the syllabus never teaches");
  const at = units.findIndex((x) => x.id === base);
  if (at > orderOf(u) && !chordId(u.id).id.startsWith("ch:arp") && !chordId(u.id).id.startsWith("ch:bar")) flag(true, `${u.st.course} ${u.title}`, "chords come before the tune is learned");
}
const learnt = (n) => new Set(GUITAR_PATH.slice(0, n).flatMap((st) => st.songs.filter((x) => x.ch).flatMap((x) => x.by.split(" "))));
for (const c of ["Em", "Am", "C", "G", "D"]) if (!learnt(3).has(c)) flag(true, "G3", `${c} isn't taught by the end of the first chord stage`);
for (const c of ["F", "Bm"]) if (!learnt(8).has(c)) flag(true, "G8", `${c} isn't taught by the end of the barre stage`);
for (const id of SONGS.map((d) => d.id)) if (!units.some((u) => u.id === id || (u.id.startsWith("ch:") && chordId(u.id).base === id)) && !["turca", "nachtmusik", "canon", "largo"].includes(id)) flag(false, "syllabus", `well-known tune ${id} is left out`);
const dropAt = GUITAR_PATH.flatMap((st) => { const l = st.songs.filter((x) => !x.ex && !x.ch).map((x) => x.level); return l.slice(1).filter((x, i) => l[i] - x >= 2).map(() => st.course); });
dropAt.forEach((c) => flag(false, c, "level drops by two inside a stage"));
for (const u of units) if (!u.ch && (/\w:\w/.test(u.title) || /^\w+: \w+$/.test(u.title) || /[A-Z]{4,}/.test(u.by))) flag(true, `${u.st.course} ${u.title}`, "messy title or composer");

/* ---------- the generator ---------- */
for (const size of SIZES) {
  const list = recommendChanges(size.id, CHANGE_USE);
  if (!list.length) flag(true, `changes ${size.id}`, "nothing to recommend");
  if (list[0] && !list[0].n && size.id !== "leap") flag(false, `changes ${size.id}`, `top pick ${list[0].a} to ${list[0].b} appears in no song`);
  if (list.some((c) => c.size !== size.id)) flag(true, `changes ${size.id}`, "recommends the wrong size");
  for (let seed = 1; seed <= 40; seed++) {
    const run = generateRun(size.id, CHANGE_USE, seed);
    if (new Set(run).size < 3) flag(true, `run ${size.id} seed ${seed}`, `only ${new Set(run).size} chords: ${run}`);
    if (run.length < 4) flag(true, `run ${size.id} seed ${seed}`, `too short: ${run}`);
    if (run.some((x, i) => i && x === run[i - 1])) flag(true, `run ${size.id} seed ${seed}`, `stands still: ${run}`);
    const costs = run.slice(1).map((n, i) => changeCost(run[i], n));
    if (costs.some((c) => c > size.most)) flag(true, `run ${size.id} seed ${seed}`, `a change is bigger than asked: ${run}`);
    const def = changeRun(run, 2, 72);
    if (!def || check(build(def)).length) flag(true, `run ${size.id} seed ${seed}`, "does not build");
  }
}

/* ---------- the whole library ---------- */
let empty = 0;
for (const d of tunes) {
  const s = build(d),
    q = musicOf(s, tabify(s, 6));
  if (q.pitches < 5 || q.same > 0.5 || q.run >= 10 || q.perBar < 1.5) (empty++, flag(true, d.title, "too little tune for the library"));
}
for (const k of SKILLS)
  for (const it of k.items) {
    const [id, r] = it.id.split("@"),
      [a, b] = r.split("-").map(Number),
      p = build(sliceDef(build(defs.get(id)), a, b)),
      q = musicOf(p, tabify(p, 6));
    if (q.pitches < 4) flag(true, `${k.name} ${it.title}`, `drill has ${q.pitches} notes`);
    if (q.same > 0.45) flag(false, `${k.name} ${it.title}`, "drill mostly repeats one note");
  }

const hard = flaws.filter((f) => f.hard),
  soft = flaws.filter((f) => !f.hard),
  kinds = {};
for (const f of flaws) {
  const k = f.what.replace(/step "[^"]*"( bars [\d-]+)?/, "step").replace(/[\d.]+/g, "#");
  kinds[k] = (kinds[k] || 0) + 1;
}
console.log(`${hard.length} hard flaws, ${soft.length} soft`);
console.log(Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 14).map(([k, n]) => `${String(n).padStart(4)}  ${k}`).join("\n"));
for (const f of [...hard, ...soft].slice(0, +process.argv[2] || 30)) console.log(`${f.hard ? "HARD" : "soft"} ${f.where}: ${f.what}`);
process.exitCode = hard.length ? 1 : 0;
