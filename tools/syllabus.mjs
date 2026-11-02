/* The guitar syllabus, built from the music. Each stage says what a piece may ask of you; within a stage, songs are chosen so each adds
   only a skill or two to what you have, with a song that adds little after one that adds a lot, so new things get played in before the next.
   Chord units come from tunes you already know wherever possible, and add a chord or two at a time. Pure: the importer passes the pool in. */
import { skillWord } from "../docs/js/songs/demands.js";

/* most: how much of each demand the stage allows. wants: at least one of these skills. */
export const STAGES = [
  { course: "G1", title: "First notes", goal: "Play a short tune on the top strings, in time, without looking.", most: { hand: 1, rhythm: 2, voices: 1, reading: 1, length: 1 }, strings: [5, 4, 3], frets: 5, units: 6, chords: 0 },
  { course: "G2", title: "Finding the notes", goal: "Find any note in first position and read a whole tune from the tab.", most: { hand: 2, rhythm: 2, voices: 1, reading: 1, length: 2 }, frets: 5, prefer: /^string/, units: 6, chords: 0 },
  { course: "G3", title: "First chord changes", goal: "Change between open chords on the beat and strum through a song you know.", most: { hand: 2, rhythm: 2, voices: 1, reading: 1, length: 2 }, units: 0, chords: 6, chordMax: 3 },
  { course: "G4", title: "Songs in time", goal: "Hold the beat through pick-ups, rests, dotted notes and 3/4.", most: { hand: 2, rhythm: 3, voices: 1, reading: 1, length: 2 }, frets: 5, wants: ["pickup", "rests", "dotted", "time:3/4", "time:6/8", "time:2/4"], prefer: /^(pickup|rests|dotted|time:|string)/, units: 6, chords: 2, chordMax: 4 },
  { course: "G5", title: "Folk melodies", goal: "Learn a full folk tune with two sections, up to the fifth fret and beyond.", most: { hand: 3, rhythm: 3, voices: 1, reading: 2, length: 3 }, frets: 7, units: 6, chords: 1, chordMax: 4 },
  { course: "G6", title: "Songs with changes", goal: "Play tunes with more movement, and chord songs in minor keys and with more chords.", most: { hand: 3, rhythm: 4, voices: 1, reading: 2, length: 3 }, frets: 9, units: 5, chords: 3, chordMax: 6, chordMin: 4 },
  { course: "G7", title: "Fingerstyle pieces", goal: "Keep a bass line and melody going together, and pick a song's chords.", most: { hand: 4, rhythm: 4, voices: 5, reading: 3, length: 4 }, frets: 12, needs: "two", units: 5, chords: 2, chordMax: 5, chordKind: "arp" },
  { course: "G8", title: "Up the neck", goal: "Shift cleanly up the neck, and play a song's chords with barres.", most: { hand: 5, rhythm: 4, voices: 2, reading: 3, length: 4 }, needs: "shifts", handMin: 3, units: 5, chords: 2, chordMax: 6, chordKind: "bar", extras: [{ id: "ex:c:A:shift:barre:block:4:60", title: "One barre shape up the neck", by: "Barre chords", ex: 1 }, { id: "ex:c:E:blues:barre:block:4:72", title: "12-bar blues in E", by: "Barre chords", ex: 1 }] },
  { course: "G9", title: "Speed and scales", goal: "Bring a fast fiddle tune up to speed with even, relaxed picking.", most: { hand: 5, rhythm: 5, voices: 1, reading: 4, length: 5 }, fast: true, units: 5, chords: 0, extras: [{ id: "ex:s:A:minpent:thirds:5:e:72", title: "A minor pentatonic in thirds", by: "Position 5", ex: 1 }, { id: "ex:s:G:major:fours:2:e:72", title: "G major in groups of four", by: "Position 2", ex: 1 }] },
  { course: "G10", title: "Concert pieces", goal: "Finish a full piece and perform it start to finish.", most: { hand: 6, rhythm: 6, voices: 6, reading: 6, length: 6 }, classical: true, least: 4, long: 3, units: 6, chords: 0 },
];

const CONCERT = /Sicilienne|Etude 1$|Prelude in D Minor|Lute Suite|Vals no\. 3|Etude in A minor/; // kept for the last stage
/* Two settings of one tune count as one tune. */
const tuneOf = (t) => t.toLowerCase().replace(/\(.*?\)|[^a-z ]/g, "").replace(/^(the|sweet) /, "").trim();
const entry = (x, adds) => ({ id: x.id, title: x.title, by: x.by, level: x.level, adds: adds.slice(0, 4).map(skillWord) });
const fitsStage = (x, st) => Object.entries(st.most).every(([k, v]) => x.d[k] <= v) && (!st.strings || x.strings.every((s) => st.strings.includes(s))) && (!st.wants || x.skills.some((k) => st.wants.includes(k))) && (!st.needs || x.skills.includes(st.needs)) && (!st.fast || x.nps >= 4.5) && (!st.least || x.level >= st.least) && (!st.long || x.d.length >= st.long) && (!st.classical || x.classical) && (!st.frets || x.top <= st.frets) && (!st.handMin || x.d.hand >= st.handMin) && (st.course === "G10" || !CONCERT.test(x.title));

/* How well a piece fills the next slot: this many new skills is what we're after, a known title beats an obscure one. Lower is better. */
const slotCost = (x, fresh, want, st) => Math.abs(fresh.length - want) * 3 + (fresh.length > 3 ? 8 : 0) + x.h * 0.35 - (x.known ? 2.5 : 0) + (x.sparse ? 6 : 0) + (x.lied ? 2 : 0) - (st.prefer && fresh.some((k) => st.prefer.test(k)) ? 3 : 0);

function pickSongs(pool, st, known, used, tunes) {
  const out = [];
  const open = pool.filter((x) => fitsStage(x, st) && !used.has(x.id));
  for (let i = 0; i < st.units && open.length; i++) {
    const want = i % 2 ? 0 : 2; // something new, then something that plays it in
    let best = null;
    for (const x of open) {
      if (used.has(x.id) || tunes.has(tuneOf(x.title))) continue;
      const fresh = x.skills.filter((k) => !known.has(k)),
        c = slotCost(x, fresh, want, st);
      if (!best || c < best.c) best = { x, fresh, c };
    }
    if (!best) break;
    used.add(best.x.id);
    tunes.add(tuneOf(best.x.title));
    best.fresh.forEach((k) => known.add(k));
    out.push(entry(best.x, best.fresh));
  }
  return out;
}

/* Chord units: fewest new chords first, from tunes the syllabus has already taught, which is what makes them music rather than drills. */
function pickChords(pool, st, chords, usedChords, placed) {
  const out = [],
    kind = st.chordKind ? `${st.chordKind}:` : "",
    how = { arp: "picked chords", bar: "barre chords" }[st.chordKind] || "chords";
  for (let i = 0; i < st.chords; i++) {
    let best = null;
    for (const x of pool) {
      const set = st.chordKind === "bar" ? x.barre : x.open;
      if (!set || usedChords.has(x.id) || x.d.voices > 1 || x.fit < 0.76 || set.names.length < (st.chordMin || 2) || set.names.length > st.chordMax) continue;
      if (!st.chordKind && !set.easy) continue;
      const fresh = set.names.filter((n) => !chords.has(n)),
        c = Math.abs(fresh.length - (chords.size ? 1 : 2)) * 4 + (placed.has(x.id) ? 0 : 3) + set.moves * 0.03 + x.h * 0.1 - (x.known ? 1 : 0) + (x.sparse ? 6 : 0);
      if (!best || c < best.c) best = { x, set, fresh, c };
    }
    if (!best) break;
    usedChords.add(best.x.id);
    best.fresh.forEach((n) => chords.add(n));
    const { x, set } = best;
    out.push({ id: `ch:${kind}${x.id}`, title: `${x.title}: ${how}`, by: set.names.join(" "), level: x.level, ch: 1, adds: [...best.fresh.slice(0, 4).map((n) => `the ${n} chord`), ...(st.chordKind && !best.fresh.length ? [how] : [])] });
  }
  return out;
}

export function buildSyllabus(pool) {
  const used = new Set(),
    usedChords = new Set(),
    known = new Set(),
    tunes = new Set(),
    chords = new Set(),
    placed = new Set();
  return STAGES.map((st) => {
    const songs = pickSongs(pool, st, known, used, tunes);
    songs.forEach((s) => placed.add(s.id));
    const units = pickChords(pool, st, chords, usedChords, placed),
      all = [];
    // chords sit among the tunes, each after the song it grew from when that is in this stage
    for (let i = 0; i < Math.max(songs.length, units.length); i++) {
      if (songs[i]) all.push(songs[i]);
      if (units[i]) all.push(units[i]);
    }
    return { course: st.course, title: st.title, blurb: st.goal, songs: [...all, ...(st.extras || []).map((e) => ({ ...e, adds: [] }))] };
  });
}
