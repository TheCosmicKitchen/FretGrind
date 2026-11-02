/* The guitar syllabus, built from the music. Each stage says what a piece may ask of you. Within those rules a first draft is improved by hill
   climbing against fitness(), which scores the whole syllabus the way a teacher would: new skills a couple at a time, each played in, music worth
   playing, chord songs from tunes you know, small changes before big ones. Pure and seeded: the same library gives the same syllabus. */
import { skillWord } from "../docs/js/songs/demands.js";

/* most: how much of each demand the stage allows. wants: at least one of these skills. */
export const STAGES = [
  { course: "G1", title: "First notes", goal: "Play a short tune on the top strings, in time, without looking.", most: { hand: 1, rhythm: 2, voices: 1, reading: 1, length: 1 }, strings: [5, 4, 3], frets: 5, nps: 2.2, units: 6, chords: 0 },
  { course: "G2", title: "Finding the notes", goal: "Find any note in first position and read a whole tune from the tab.", most: { hand: 2, rhythm: 2, voices: 1, reading: 1, length: 2 }, frets: 5, nps: 2.6, prefer: /^string/, units: 8, chords: 0 },
  { course: "G3", title: "First chord changes", goal: "Change between open chords on the beat and strum through a song you know.", most: { hand: 2, rhythm: 2, voices: 1, reading: 1, length: 2 }, units: 0, chords: 7, chordMax: 3, chordRate: 0.8, tuneMost: 3, chordCore: ["Em", "Am", "C", "G", "D"], chordOnly: /^(Em|Am|C|G|D|A|E|D7|A7)$/ },
  { course: "G4", title: "Songs in time", goal: "Hold the beat through pick-ups, rests, dotted notes and 3/4.", most: { hand: 2, rhythm: 3, voices: 1, reading: 1, length: 2 }, frets: 5, nps: 3.2, wants: ["pickup", "rests", "dotted", "time:3/4", "time:6/8", "time:2/4"], prefer: /^(pickup|rests|dotted|time:|string)/, units: 6, chords: 2, chordMax: 4, chordRate: 1, tuneMost: 3 },
  { course: "G5", title: "Folk melodies", goal: "Learn a full folk tune with two sections, up to the fifth fret and beyond.", most: { hand: 3, rhythm: 3, voices: 1, reading: 2, length: 3 }, frets: 7, nps: 3.8, pace: 2.8, units: 6, chords: 1, chordMax: 4, tuneMost: 4 },
  { course: "G6", title: "Songs with changes", goal: "Play tunes with more movement, and chord songs in minor keys and with more chords.", most: { hand: 3, rhythm: 4, voices: 1, reading: 3, length: 3 }, frets: 9, nps: 4.2, pace: 3.2, units: 5, chords: 3, chordMax: 6, chordMin: 4, tuneMost: 4 },
  { course: "G7", title: "Fingerstyle pieces", goal: "Keep a bass line and melody going together, and pick a song's chords.", most: { hand: 4, rhythm: 4, voices: 5, reading: 3, length: 4 }, frets: 12, needs: "two", pace: 3.2, units: 5, chords: 2, chordMax: 5, chordKind: "arp" },
  { course: "G8", title: "Up the neck", goal: "Shift cleanly up the neck, and play a song's chords with barres.", most: { hand: 5, rhythm: 4, voices: 2, reading: 3, length: 4 }, needs: "shifts", handMin: 3, nps: 4.4, pace: 3.8, units: 5, chords: 2, chordMax: 6, chordKind: "bar", chordCore: ["F", "Bm"], extras: [{ id: "ex:c:A:shift:barre:block:4:60", title: "One barre shape up the neck", by: "Barre chords", ex: 1 }, { id: "ex:c:E:blues:barre:block:4:72", title: "12-bar blues in E", by: "Barre chords", ex: 1 }] },
  { course: "G9", title: "Speed and scales", goal: "Bring a fast fiddle tune up to speed with even, relaxed picking.", most: { hand: 5, rhythm: 5, voices: 1, reading: 4, length: 5 }, fast: true, pace: 4.8, units: 5, chords: 0, extras: [{ id: "ex:s:A:minpent:thirds:5:e:72", title: "A minor pentatonic in thirds", by: "Position 5", ex: 1 }, { id: "ex:s:G:major:fours:2:e:72", title: "G major in groups of four", by: "Position 2", ex: 1 }] },
  { course: "G10", title: "Concert pieces", goal: "Finish a full piece and perform it start to finish.", most: { hand: 6, rhythm: 6, voices: 6, reading: 6, length: 6 }, classical: true, least: 4, long: 3, units: 6, chords: 0 },
];

const CONCERT = /Sicilienne|Etude 1$|Prelude in D Minor|Lute Suite|Vals no\. 3|Etude in A minor/; // kept for the last stage
/* Two settings of one tune count as one tune. */
const tuneOf = (t) => t.toLowerCase().replace(/\(.*?\)|[^a-z ]/g, "").replace(/^(the|sweet) /, "").trim();
const fitsStage = (x, st) => Object.entries(st.most).every(([k, v]) => x.d[k] <= v) && (!st.strings || x.strings.every((s) => st.strings.includes(s))) && (!st.wants || x.skills.some((k) => st.wants.includes(k))) && (!st.needs || x.skills.includes(st.needs)) && (!st.fast || x.nps >= 4) && (!st.least || x.level >= st.least) && (!st.long || x.d.length >= st.long) && (!st.classical || x.classical) && (!st.frets || x.top <= st.frets) && (!st.nps || x.nps <= st.nps) && (!st.handMin || x.d.hand >= st.handMin) && (st.course === "G10" || !CONCERT.test(x.title)) && !JUNK.test(x.title) && x.q.pitches >= (st.course === "G1" ? 3 : 5) && x.q.gaps <= 0.15 && (x.classical || x.own || x.q.open <= 0.58);
const JUNK = /^\w+: \w+$/; // a stray colon from a badly split title
/* A tune an earlier stage is allowed to teach, so its chords can follow it. */
const teachable = (x, k) => STAGES.slice(0, k).some((s) => s.units && fitsStage(x, s));
const chordSet = (x, st) => (st.chordKind === "bar" ? x.barre : x.open);
const fitsChords = (x, st) => {
  const set = chordSet(x, st);
  return !!set && x.d.voices === 1 && x.fit >= 0.76 && set.names.length >= (st.chordMin || 2) && set.names.length <= st.chordMax && (st.chordKind ? true : set.easy) && set.rate <= (st.chordRate || 1.2) && x.level <= (st.tuneMost || 6) && !JUNK.test(x.title) && (!st.chordOnly || set.names.every((n) => st.chordOnly.test(n)));
};

/* A tune worth a learner's time: shape, variety, and not one note over and over. Songs people already know come first in the early stages. */
const interest = (x) => Math.min(x.q.pitches, 10) * 0.12 + Math.min(x.q.turns, 0.5) * 3 - x.q.same * 4 - (x.q.run >= 6 ? 1.5 : 0) - (x.sparse ? 3 : 0) - (x.lied ? 1 : 0) + (x.known ? 1.6 : 0);
const familiar = (x, i) => (x.own ? 16 : x.known ? 4 : 0) * (i < 6 ? 1 : 0.3);

/* How good a whole syllabus is. New things arrive one or two at a time and get played in; the music is worth playing; chord songs reuse tunes
   you know, add a chord at a time, and work up from small changes to big ones; a stage climbs rather than lurches. */
export function fitness(stages) {
  const known = new Set(),
    chords = new Set(),
    placed = new Set();
  let score = 0,
    last = 1,
    peak = 0,
    climb = 0;
  const seen = new Set();
  stages.forEach(({ st, units }, stage) => {
    let level = 0;
    const tunes = units.filter((u) => !u.chord).map((u) => u.x),
      mean = tunes.length ? tunes.reduce((a, x) => a + x.level + x.nps * 0.25, 0) / tunes.length : 0;
    if (mean) {
      score -= Math.max(0, climb - mean) * 14; // the path only goes up
      if (st.pace) score -= Math.abs(tunes.reduce((a, x) => a + x.nps, 0) / tunes.length - st.pace) * 12; // and speeds up in steps, not a leap
      climb = Math.max(climb, mean);
    }
    const times = new Set(),
      keys = new Set();
    for (const u of units) {
      const { x } = u;
      if (u.chord) {
        const set = chordSet(x, st),
          fresh = set.names.filter((n) => !chords.has(n));
        score += fresh.length === 1 ? 2 : fresh.length === 2 ? 1 : fresh.length ? -2 * fresh.length : st.chordKind ? 0 : -0.5;
        score += placed.has(x.id) ? 6 : st.chordKind === "bar" ? -14 : -60; // chords go on a tune your fingers know
        score += familiar(x, stage) * 0.5 - set.rate * 1.5 + x.fit * 2 + interest(x) * 0.2;
        score += seen.has(`${stage}:${x.id}`) ? -8 : 0;
        seen.add(`${stage}:${x.id}`);
        score -= Math.max(0, set.peak - peak - 1) * 1.5; // a change much bigger than any so far
        peak = Math.max(peak, set.peak);
        fresh.forEach((n) => chords.add(n));
        continue;
      }
      const fresh = x.skills.filter((k) => !known.has(k)).length;
      score += fresh === 0 ? (last ? 1 : -1) : fresh <= 2 ? 1.5 : fresh === 3 ? -1 : -4 * (fresh - 2);
      last = fresh;
      score += interest(x) * 1.2 + familiar(x, stage);
      score -= Math.max(0, level - x.level) * 0.7;
      level = Math.max(level, x.level);
      score += st.prefer && x.skills.some((k) => st.prefer.test(k) && !known.has(k)) ? 1 : 0;
      x.skills.forEach((k) => known.add(k));
      placed.add(x.id);
      times.add(x.time);
      keys.add(x.key);
    }
    score += Math.min(times.size, 3) * 0.3 + Math.min(keys.size, 4) * 0.2;
    for (const c of st.chordCore || []) score += chords.has(c) ? 20 : -20; // what a stage promises, it teaches
  });
  return score;
}

/* A seeded random source, so the same library always gives the same syllabus. */
const random = (seed) => () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* Hill climbing: try a small change, keep it if the whole syllabus scores better, a little over and over. Every change stays inside the stage's rules. */
function climb(stages, pool, steps = 60000) {
  const r = random(20261102),
    pick = (a) => a[Math.floor(r() * a.length)],
    tunesOf = () => new Set(stages.flatMap((s) => s.units.filter((u) => !u.chord).map((u) => tuneOf(u.x.title)))),
    chordIds = () => new Set(stages.flatMap((s) => s.units.filter((u) => u.chord).map((u) => u.x.id))),
    pools = stages.map(({ st }, k) => ({ songs: pool.filter((x) => fitsStage(x, st)), chords: st.chords ? pool.filter((x) => fitsChords(x, st) && (st.chordKind || teachable(x, k))) : [] }));
  let best = fitness(stages),
    kept = 0;
  const start = best;
  for (let i = 0; i < steps; i++) {
    const k = Math.floor(r() * stages.length),
      { units } = stages[k];
    if (!units.length) continue;
    const a = Math.floor(r() * units.length);
    if (units[a].chord && r() < 0.35) {
      // a chord song and the tune under it have to arrive together, or neither change ever pays
      const x = pick(pools[k].chords),
        j = x ? pools.findIndex((p, n) => n < k && p.songs.includes(x)) : -1,
        at = j < 0 ? [] : stages[j].units.map((u, n) => (u.chord ? -1 : n)).filter((n) => n >= 0);
      if (!at.length || tunesOf().has(tuneOf(x.title)) || chordIds().has(x.id)) continue;
      const b = pick(at),
        wasTune = stages[j].units[b],
        wasChord = units[a];
      stages[j].units[b] = { ...wasTune, x };
      units[a] = { ...wasChord, x };
      const now = fitness(stages);
      if (now > best + 1e-9) ((best = now), kept++);
      else {
        stages[j].units[b] = wasTune;
        units[a] = wasChord;
      }
      continue;
    }
    if (r() < 0.3) {
      const b = Math.floor(r() * units.length);
      if (a === b) continue;
      [units[a], units[b]] = [units[b], units[a]];
      const now = fitness(stages);
      if (now > best + 1e-9) ((best = now), kept++);
      else [units[a], units[b]] = [units[b], units[a]];
      continue;
    }
    const was = units[a],
      from = was.chord ? pools[k].chords : pools[k].songs;
    if (!from.length) continue;
    const x = pick(from);
    if (was.chord ? chordIds().has(x.id) : tunesOf().has(tuneOf(x.title))) continue;
    units[a] = { ...was, x };
    const now = fitness(stages);
    if (now > best + 1e-9) ((best = now), kept++);
    else units[a] = was;
  }
  return { start, best, kept };
}

const SONG_KINDS = { arp: "picked chords", bar: "barre chords" };
/* Name what each unit adds, walking the finished syllabus in order. */
function finish(stages) {
  const known = new Set(),
    chords = new Set();
  return stages.map(({ st, units }) => ({
    course: st.course,
    title: st.title,
    blurb: st.goal,
    songs: [
      ...units.map((u) => {
        const { x } = u;
        if (u.chord) {
          const set = chordSet(x, st),
            fresh = set.names.filter((n) => !chords.has(n)),
            how = SONG_KINDS[st.chordKind];
          fresh.forEach((n) => chords.add(n));
          return { id: `ch:${st.chordKind ? `${st.chordKind}:` : ""}${x.id}`, title: `${x.title}: ${how || "chords"}`, by: set.names.join(" "), level: x.level, ch: 1, adds: [...fresh.slice(0, 4).map((n) => `the ${n} chord`), ...(st.chordKind && !fresh.length ? [how] : [])] };
        }
        const fresh = x.skills.filter((k) => !known.has(k));
        fresh.forEach((k) => known.add(k));
        return { id: x.id, title: x.title, by: x.by, level: x.level, adds: fresh.slice(0, 4).map(skillWord) };
      }),
      ...(st.extras || []).map((e) => ({ ...e, adds: [] })),
    ],
  }));
}

/* Chords a stage promises go into the draft, each on a tune an earlier stage can teach, so the climb starts from a syllabus that keeps its promises. */
function plantCore(stages, pool) {
  const missing = [],
    has = (n, k) => stages.slice(0, k + 1).some(({ st, units }) => units.some((u) => u.chord && chordSet(u.x, st).names.includes(n)));
  stages.forEach(({ st, units }, k) => {
    for (const c of st.chordCore || []) {
      if (has(c, k)) continue;
      const taken = new Set(stages.flatMap((s) => s.units.map((u) => tuneOf(u.x.title)))),
        options = pool.filter((x) => fitsChords(x, st) && (st.chordKind || teachable(x, k)) && chordSet(x, st).names.includes(c)).sort((a, b) => interest(b) - interest(a));
      let done = false;
      for (const x of options) {
        const earlier = stages.slice(0, k).find(({ st: s, units: us }) => fitsStage(x, s) && us.some((u) => !u.chord && !u.x.own));
        if (!earlier && !taken.has(tuneOf(x.title))) continue;
        if (earlier && !taken.has(tuneOf(x.title))) {
          const slot = earlier.units.map((u, i) => (!u.chord && !u.x.own ? i : -1)).filter((i) => i >= 0).pop();
          earlier.units[slot] = { x, chord: false };
        } else if (!stages.slice(0, k).some((s) => s.units.some((u) => !u.chord && u.x.id === x.id))) continue;
        const spare = units.map((u, i) => (u.chord && !(st.chordCore || []).some((n) => chordSet(u.x, st).names.includes(n) && !u.x.own) ? i : -1)).filter((i) => i >= 0).pop();
        units[spare ?? units.findIndex((u) => u.chord)] = { x, chord: true };
        done = true;
        break;
      }
      if (!done) missing.push(c);
    }
  });
  return missing;
}

/* A first draft to climb from: the plainest pieces that fit each stage, with chord songs among them. */
export function buildSyllabus(pool, log = () => {}) {
  const tunes = new Set(),
    usedChords = new Set(),
    stages = STAGES.map((st) => {
      const songs = pool.filter((x) => fitsStage(x, st)).sort((a, b) => b.own - a.own || interest(b) - interest(a) || a.h - b.h),
        chords = st.chords ? pool.filter((x) => fitsChords(x, st) && (st.chordKind || teachable(x, STAGES.indexOf(st)))).sort((a, b) => interest(b) - interest(a)) : [],
        units = [],
        tune = [];
      for (const x of songs) {
        if (tune.length >= st.units) break;
        if (tunes.has(tuneOf(x.title))) continue;
        tunes.add(tuneOf(x.title));
        tune.push({ x, chord: false });
      }
      const chord = [];
      for (const x of chords) {
        if (chord.length >= st.chords) break;
        if (usedChords.has(x.id)) continue;
        usedChords.add(x.id);
        chord.push({ x, chord: true });
      }
      for (let i = 0; i < Math.max(tune.length, chord.length); i++) {
        if (tune[i]) units.push(tune[i]);
        if (chord[i]) units.push(chord[i]);
      }
      return { st, units };
    }),
    missing = plantCore(stages, pool),
    run = climb(stages, pool);
  if (missing.length) log(`no tune could carry: ${missing.join(", ")}`);
  log(`syllabus fitness ${run.start.toFixed(1)} -> ${run.best.toFixed(1)}, ${run.kept} improvements kept`);
  return finish(stages);
}
