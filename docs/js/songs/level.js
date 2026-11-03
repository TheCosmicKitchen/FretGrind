/* Level work: what each stage of the path asks for besides its pieces. Graded exams build every grade from the same strands
   (pieces, technique at a set tempo, sight-reading something never seen, and an ear test), so a level means a balanced
   player and not just a longer list of tunes. Pure, so Node can test it.
   Technique drills are generated (exercises.js, groove.js); the sight-read is the stage's level of the reading ladder
   (ladder.js); the ear test is an echo round: the app plays a few notes and you play them back by ear.
   ids: "eo:2:41" = an echo round for stage 3, round 41. */
import { positionNotes } from "./exercises.js";
import { rng, takeless } from "./groove.js";
import { isLadder, ladderLevel } from "./ladder.js";

export const EAR_ROUND = 8; // phrases in an echo round
export const LEVEL_PASS = 0.7; // the same mark a piece needs
const STRING_NAMES = ["low E", "A", "D", "G", "B", "high E"];

/* One entry per stage, in path order. tech: drills to play cleanly at their own tempo ("*" = any take of a groove);
   ear: the notes an echo round draws on (top = strings, n = notes
   in a phrase, leap = the widest jump, in scale steps). */
export const LEVEL_WORK = [
  { tech: [], ear: { tonic: "C", scale: "major", pos: 0, top: 2, n: 2, leap: 2 } },
  { tech: [{ id: "ex:s:C:major:straight:0:q:72", name: "C major scale" }], ear: { tonic: "C", scale: "major", pos: 0, top: 3, n: 3, leap: 2 } },
  { tech: [{ id: "gx:c:G:folk:A:open:strum:even:take:bar:4:60:*", name: "G, C, D and Em, a chord a bar" }], ear: { tonic: "G", scale: "major", pos: 0, top: 3, n: 3, leap: 2 } },
  { tech: [{ id: "ex:s:G:major:straight:0:e:72", name: "G major scale in eighths" }, { id: "gx:c:G:folk:AH:open:strum:even:phrase:bar:8:72:*", name: "Strumming in G" }], ear: { tonic: "G", scale: "major", pos: 0, top: 4, n: 3, leap: 2 } },
  { tech: [{ id: "ex:s:D:major:thirds:2:e:72", name: "D major in thirds" }], ear: { tonic: "D", scale: "major", pos: 2, top: 4, n: 4, leap: 2 } },
  { tech: [{ id: "gx:c:G:folk:APH:open:bass:even:phrase:half:8:76:*", name: "Bass and strum, two chords a bar" }, { id: "ex:s:A:minor:straight:0:e:80", name: "A minor scale" }], ear: { tonic: "A", scale: "minor", pos: 0, top: 6, n: 4, leap: 2 } },
  { tech: [{ id: "gx:c:G:folk:AHD:open:pick:even:phrase:bar:8:66:*", name: "Picked chords in G" }, { id: "ex:s:E:minor:triads:0:e:72", name: "E minor in broken triads" }], ear: { tonic: "E", scale: "minor", pos: 0, top: 6, n: 4, leap: 3 } },
  { tech: [{ id: "gx:c:A:maj:APHD:barre:strum:sync:phrase:mix:8:80:*", name: "Barre chords in A, syncopated" }, { id: "ex:s:A:major:straight:5:e:88", name: "A major scale, fifth position" }], ear: { tonic: "A", scale: "major", pos: 5, top: 6, n: 5, leap: 3 } },
  { tech: [{ id: "ex:s:G:major:threes:2:s:72", name: "G major in threes, sixteenths" }, { id: "gx:s:A:minpent:5:busy:seq:8:88:*", name: "A minor pentatonic sequences" }], ear: { tonic: "A", scale: "minpent", pos: 5, top: 6, n: 5, leap: 2 } },
  { tech: [{ id: "gx:c:A:min:AHD:any:pick:sync:bar:push:8:84:*", name: "Minor key, pushed changes, picked" }, { id: "ex:s:C:major:triads:7:t:72", name: "C major broken triads in triplets" }], ear: { tonic: "G", scale: "major", pos: 7, top: 6, n: 6, leap: 3 } },
];

export const tempoOf = (id) => +String(id).split(":")[String(id).startsWith("ex:") ? 7 : String(id).startsWith("gx:c") ? 11 : 8];

/* The notes an echo phrase can use: the scale in one hand position, on the strings this stage has met. */
export const earPool = (ear) => positionNotes(ear.tonic, ear.scale, ear.pos).filter((x) => x.s >= 6 - ear.top);

/* A phrase of n notes: it starts on a note of the home chord so the first note sets the key, mostly moves by step and keeps
   going the way it set off, and never plays the same note twice running. [{ m, tok, s, f }] */
export function echoPhrase(pool, n, leap, r) {
  const homes = pool.map((x, i) => ([0, 3, 4, 7].includes(x.semi) ? i : -1)).filter((i) => i >= 0);
  let at = homes[Math.floor(r() * homes.length)],
    dir = r() < 0.5 ? -1 : 1;
  const out = [at];
  while (out.length < n) {
    const size = leap > 1 && r() < 0.4 ? 2 + Math.floor(r() * (leap - 1)) : 1;
    if (out.length > 1 && r() < 0.3) dir = -dir;
    let to = at + dir * size;
    if (to < 0 || to >= pool.length) ((dir = -dir), (to = at + dir * size)); // off the end of the position: the other way
    at = Math.max(0, Math.min(pool.length - 1, to));
    out.push(at);
  }
  return out.map((i) => pool[i]);
}

export const isEcho = (id) => /^eo:\d+:\d+$/.test(String(id));
/* An echo round for a stage: { id, k, phrases }, or null for a bad id. */
export function echoById(id) {
  if (!isEcho(id)) return null;
  const [, k, seed] = String(id).split(":").map(Number),
    work = LEVEL_WORK[k];
  if (!work || seed < 1) return null;
  const r = rng(seed * 31 + k),
    pool = earPool(work.ear),
    phrases = [],
    seen = new Set();
  for (let tries = 0; phrases.length < EAR_ROUND; tries++) {
    const ph = echoPhrase(pool, work.ear.n, work.ear.leap, r),
      key = ph.map((x) => x.m).join();
    if (seen.has(key) && tries < 200) continue; // a round never asks the same phrase twice
    seen.add(key);
    phrases.push(ph);
  }
  return { id, k, n: work.ear.n, phrases };
}
/* Where a note is: "B string, fret 1" */
export const placeOf = (x) => `${STRING_NAMES[x.s]} string, ${x.f ? `fret ${x.f}` : "open"}`;

/* Which strand of which stage an id is: { k, kind: "tech" | "read" | "ear", i }, or null. */
export function strandOf(id) {
  if (isEcho(id)) {
    const k = +String(id).split(":")[1];
    return LEVEL_WORK[k] ? { k, kind: "ear" } : null;
  }
  if (isLadder(id)) {
    const k = ladderLevel(id) - 1; // a stage's sight-read is the reading ladder's level for it
    return LEVEL_WORK[k] ? { k, kind: "read" } : null;
  }
  const t = takeless(id);
  for (let k = 0; k < LEVEL_WORK.length; k++) {
    const i = LEVEL_WORK[k].tech.findIndex((x) => x.id === t);
    if (i >= 0) return { k, kind: "tech", i };
  }
  return null;
}

/* What a stage's level work has come to, from its saved bests ({ t: [best per drill], r: best first read, e: best echo round }):
   [{ kind, i, name, best, pass }] */
export function levelState(k, got = {}) {
  const w = LEVEL_WORK[k],
    row = (kind, i, name, best) => ({ kind, i, name, best: best || 0, pass: (best || 0) >= LEVEL_PASS });
  return [
    ...w.tech.map((x, i) => row("tech", i, `${x.name} · ${tempoOf(x.id)} bpm`, got.t?.[i])),
    row("read", 0, `Sight-read · reading level ${k + 1}`, got.r),
    row("ear", 0, `Echo ${w.ear.n} notes by ear`, got.e),
  ];
}
/* A stage is finished when its pieces are learned and its level work is passed. */
export const stageDone = (k, learnedAll, got) => learnedAll && levelState(k, got).every((x) => x.pass);
