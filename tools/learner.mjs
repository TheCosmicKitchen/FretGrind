/* Walk a pretend learner through the whole syllabus, and report what it is like: how long each lesson and stage takes, where the difficulty jumps,
   and how the app treats them on the way. Run: node tools/learner.mjs */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { SONGS } from "../docs/js/songs/data.js";
import { build } from "../docs/js/songs/format.js";
import { tabify } from "../docs/js/songs/tabify.js";
import { GUITAR_PATH, coachPlan, lessonsIn, sliceDef } from "../docs/js/songs/path.js";
import { chordId, chordPlan, chordSong } from "../docs/js/songs/changes.js";
import { exerciseById } from "../docs/js/songs/exercises.js";
import { demandsOf } from "../docs/js/songs/demands.js";
import { freshNotes } from "../docs/js/songs/path.js";

const lib = fileURLToPath(new URL("../docs/lib/", import.meta.url)),
  tunes = readdirSync(lib).filter((f) => /^songs-/.test(f)).flatMap((f) => JSON.parse(readFileSync(join(lib, f), "utf8"))),
  defs = new Map([...SONGS, ...tunes].map((d) => [d.id, d]));

/* Minutes to do a step once well: playing it through, with a retry on the hard ones. "wait" runs at a walk. */
function minutes(s, step) {
  const b = step.def ? build(step.def) : step.from === 0 && step.to === s.barLens.length - 1 ? s : build(sliceDef(s, step.from, step.to)),
    pass = ((b.total / b.beat) * 60) / (b.tempo * ((step.pct || 100) / 100)) / 60,
    tries = step.mode === "hear" ? 1 : 2.5;
  return step.mode === "wait" ? (b.sounding.length * 2.5) / 60 + pass : pass * tries + 0.1;
}

const rows = [];
for (const st of GUITAR_PATH)
  for (const x of st.songs) {
    const c = chordId(x.id);
    let s, plan;
    if (x.ex) {
      s = build(exerciseById(x.id));
      plan = coachPlan(s);
    } else if (c) {
      s = build(chordSong(build(defs.get(c.base)), c));
      plan = chordPlan(s);
    } else {
      s = build(defs.get(x.id));
      plan = coachPlan(s, tabify(s, 6));
    }
    const lessons = lessonsIn(plan).map((L) => plan.slice(L.first, L.last + 1).reduce((a, p) => a + minutes(s, p), 0)),
      d = x.ex || c ? null : demandsOf(s, tabify(s, 6), freshNotes(s));
    rows.push({ st, x, s, steps: plan.length, lessons, total: lessons.reduce((a, b) => a + b, 0), d });
  }

let hours = 0;
console.log("stage                     pieces lessons  steps   hours  longest lesson  median lesson");
for (const st of GUITAR_PATH) {
  const r = rows.filter((x) => x.st === st),
    all = r.flatMap((x) => x.lessons).sort((a, b) => a - b),
    h = r.reduce((a, x) => a + x.total, 0) / 60;
  hours += h;
  console.log(`${(st.course + " " + st.title).padEnd(26)}${String(r.length).padStart(5)}${String(all.length).padStart(8)}${String(r.reduce((a, x) => a + x.steps, 0)).padStart(7)}${h.toFixed(1).padStart(8)}${all[all.length - 1].toFixed(0).padStart(11)} min${all[all.length >> 1].toFixed(0).padStart(11)} min`);
}
console.log(`total ${hours.toFixed(0)} hours\n`);

const long = rows.flatMap((r) => r.lessons.map((m, i) => ({ m, i, r }))).sort((a, b) => b.m - a.m).slice(0, 6);
console.log("longest lessons:\n" + long.map((l) => `  ${l.m.toFixed(0)} min  ${l.r.st.course} ${l.r.x.title.slice(0, 34)} lesson ${l.i + 1}/${l.r.lessons.length}`).join("\n"));
const over = rows.flatMap((r) => r.lessons).filter((m) => m > 15).length,
  count = rows.flatMap((r) => r.lessons).length;
console.log(`lessons over 15 minutes: ${over} of ${count}\n`);

console.log("hardest demand at each stage (median of tunes):");
for (const st of GUITAR_PATH) {
  const r = rows.filter((x) => x.st === st && x.d);
  if (!r.length) continue;
  const med = (k) => r.map((x) => x.d[k]).sort((a, b) => a - b)[r.length >> 1];
  console.log(`  ${st.course.padEnd(4)} hand ${med("hand")} rhythm ${med("rhythm")} voices ${med("voices")} key ${med("reading")} length ${med("length")} | nps ${(r.map((x) => x.s.sounding.length / ((x.s.total / x.s.beat) * (60 / x.s.tempo))).sort((a, b) => a - b)[r.length >> 1]).toFixed(1)}`);
}
