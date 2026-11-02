/* How right are the worked-out chords? The piano arrangements of the art songs have a real left hand, written by the composer, so we can hide it,
   work out chords from the melody alone, and count how often the chord agrees with the bass that was really there. Then hill-climb the weights in
   harmony.js against that score, on half the songs, and report the other half, so it can't just memorise the answers.
   Run: node tools/tune-harmony.mjs */
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { build } from "../docs/js/songs/format.js";
import { TUNING, chordChart } from "../docs/js/songs/harmony.js";
import { stepsOf } from "../docs/js/piano/songs.js";

const lib = fileURLToPath(new URL("../docs/lib/", import.meta.url)),
  pieces = readdirSync(lib).filter((f) => /^piano-\d/.test(f)).flatMap((f) => JSON.parse(readFileSync(join(lib, f), "utf8"))),
  tunes = new Map(readdirSync(lib).filter((f) => /^songs-/.test(f)).flatMap((f) => JSON.parse(readFileSync(join(lib, f), "utf8"))).filter((d) => d.src === "lieder").map((d) => [`${d.title}|${d.by}`, d]));

/* Pair each arrangement with its melody, and note the lowest left-hand notes at the start of each bar. */
const cases = [];
for (const p of pieces) {
  const d = tunes.get(`${p.title}|${p.by}`);
  if (!d) continue;
  const s = build(d),
    steps = stepsOf(p),
    bass = new Map();
  for (const st of steps) if (st.l.length && !bass.has(st.bar)) bass.set(st.bar, Math.min(...st.l) % 12);
  if (bass.size >= 6 && p.bars.length === s.barLens.length) cases.push({ s, bass });
}
const half = cases.filter((_, i) => i % 2 === 0),
  rest = cases.filter((_, i) => i % 2);

/* The share of bars whose chord contains the composer's bass note, and the share of bars it is the root. */
function agree(set) {
  let tone = 0,
    root = 0,
    all = 0;
  for (const { s, bass } of set) {
    const { spans } = chordChart(s);
    for (const [bar, pc] of bass) {
      const at = s.notes.find((n) => n.bar === bar)?.start ?? 0,
        sp = spans.find((x) => at >= x.start - 1e-9 && at < x.start + x.len - 1e-9) || spans[spans.length - 1],
        third = sp.suf === "minor" ? 3 : 4;
      all++;
      if (pc === sp.root) root++;
      if ([0, third, 7, ...(sp.suf === "7" ? [10] : [])].some((d) => (sp.root + d) % 12 === pc)) tone++;
    }
  }
  return { tone: tone / all, root: root / all };
}
const value = (set) => {
  const a = agree(set);
  return a.tone + a.root * 0.5;
};

const show = (a) => `bass is in the chord ${Math.round(a.tone * 100)}%, is its root ${Math.round(a.root * 100)}%`;
console.log(`${cases.length} songs with a real left hand`);
console.log("before  train:", show(agree(half)), " held back:", show(agree(rest)));

let seed = 20261102;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) % 4294967296) / 4294967296);
let best = value(half),
  kept = 0;
const keys = Object.keys(TUNING),
  steps = +process.argv[2] || 150;
for (let i = 0; i < steps; i++) {
  const k = keys[Math.floor(rnd() * keys.length)],
    was = TUNING[k];
  TUNING[k] = +(was * (0.7 + rnd() * 0.6)).toFixed(3);
  const now = value(half);
  if (now > best + 1e-6) ((best = now), kept++);
  else TUNING[k] = was;
}
console.log(`${kept} improvements kept out of ${steps}`);
console.log("after   train:", show(agree(half)), " held back:", show(agree(rest)));
console.log("TUNING =", JSON.stringify(TUNING));
