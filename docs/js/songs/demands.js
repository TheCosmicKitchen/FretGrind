/* What a piece actually asks of you. Pure, so the importer and Node can both use it.
   demandsOf rates each thing a player has to manage from 1 to 6, against rungs anyone can check, and a piece's level is its hardest
   demand: an easy rhythm can't hide a hard left hand. skillsOf names what you must already be able to do, so the syllabus can order
   songs by what each one adds. Speed stays out of both, since the lessons set the speed. */
const rung = (x, tops) => {
  const i = tops.findIndex((t) => x <= t);
  return i < 0 ? tops.length + 1 : i + 1;
};
const share = (xs, f) => (xs.length ? xs.filter(f).length / xs.length : 0);
const pct = (xs, p) => [...xs].sort((a, b) => a - b)[Math.floor((xs.length - 1) * p)] ?? 0;
const SIG = { C: 0, G: 1, D: 2, A: 3, E: 4, B: 5, "F#": 6, "C#": 7, F: -1, Bb: -2, Eb: -3, Ab: -4, Db: -5, Gb: -6, Cb: -7 },
  MODE = { "": 0, m: -3, dor: -2, phr: -4, lyd: 1, mix: -1, loc: -5 };
export function sharpsOf(key) {
  const m = /^([A-G][#b]?)(m|dor|phr|lyd|mix|loc)?$/.exec(key);
  return m ? (SIG[m[1]] ?? 0) + MODE[m[2] || ""] : 0;
}

/* Position changes per note: the hand covers five frets with a stretch, and moves when a note falls outside them. */
function shiftsOf(tab) {
  let lo = 0,
    moves = 0;
  for (const c of tab) {
    const f = c[1];
    if (f <= 0 || (f >= lo && f <= lo + 4)) continue;
    if (lo) moves++;
    lo = f < lo ? f : Math.max(1, f - 4);
  }
  return moves / Math.max(1, tab.length);
}
/* The note value the tune moves in. Old fiddle tunes are often written in steady sixteenths: that is their pulse, not a hard rhythm. */
function pulseOf(ns) {
  const n = new Map();
  ns.forEach((x) => n.set(x.dur, (n.get(x.dur) || 0) + 1));
  return [...n].sort((a, b) => b[1] - a[1])[0]?.[0] ?? 4;
}

/* The facts both views are built from. */
function factsOf(s, tab) {
  const ns = s.sounding,
    pulse = pulseOf(ns),
    fretted = tab.flatMap((c) => (c.all || [c]).map((p) => p[1])).filter((f) => f > 0),
    beat = s.beat === 6 ? 2 : 4, // the quarter note of simple time, the eighth of compound time
    short = (d) => share(ns, (n) => n.dur <= d + 1e-9);
  return {
    ns, tab, beat,
    high: pct(fretted, 0.95), top: fretted.reduce((a, x) => Math.max(a, x), 0),
    strings: new Set(tab.flatMap((c) => (c.all || [c]).map((p) => p[0]))),
    shifts: shiftsOf(tab),
    finer: share(ns, (n) => n.dur < pulse - 1e-9),
    kinds: new Set(ns.map((n) => n.dur)).size,
    eighths: short(2) - short(1),
    sixteenths: short(1),
    triplets: share(ns, (n) => n.triplet),
    dotted: share(ns.slice(1), (n, i) => ns[i].dur === 3 || ns[i].dur === 6),
    offBeat: share(ns, (n) => n.dur >= 3 && (n.start - (s.pickup || 0)) % beat !== 0),
    two: share(ns, (n) => n.pitches.length === 2),
    full: share(ns, (n) => n.pitches.length >= 3),
    accidentals: share(ns, (n) => n.show),
    sharps: Math.abs(sharpsOf(s.key)),
    rests: s.notes.some((n) => n.rest && n.start > (s.pickup || 0)),
  };
}

/* { hand, rhythm, voices, reading, length } each 1..6, level, and limit: the one that sets the level */
export function demandsOf(s, tab, fresh = s.sounding.length) {
  const f = factsOf(s, tab),
    hand = Math.max(rung(f.high, [3, 5, 7, 9, 12]), rung(f.shifts, [0.01, 0.03, 0.06, 0.1, 0.16])),
    rhythm = Math.max(rung(f.finer, [0.05, 0.15, 0.3, 0.45, 0.6]), f.dotted >= 0.03 ? 2 : 1, f.dotted >= 0.2 ? 3 : 1, f.triplets >= 0.15 ? 5 : f.triplets >= 0.02 ? 4 : 1, rung(f.offBeat, [0.03, 0.08, 0.15, 0.3, 0.45]), f.kinds >= 7 ? 5 : f.kinds >= 5 ? 3 : 1),
    held = f.two + f.full,
    voices = !held ? 1 : Math.max(rung(held, [0.1, 0.3, 0.6]) + 1, f.full >= 0.3 ? 5 : f.full >= 0.1 ? 4 : 0),
    reading = Math.max(sharpsOf(s.key) < 0 ? Math.min(6, f.sharps + 1) : rung(f.sharps, [2, 3, 4, 5, 6]), rung(f.accidentals, [0.03, 0.08, 0.15, 0.25, 0.35])),
    length = rung(fresh, [60, 120, 200, 320, 500]),
    playing = { hand, rhythm, voices, reading };
  let limit = Object.keys(playing).reduce((a, k) => (playing[k] > playing[a] ? k : a), "hand"),
    level = playing[limit];
  if (length > level && level < 6) {
    level++; // a lot to learn counts for one step, not as much as a hard technique
    limit = "length";
  }
  return { ...playing, length, level, limit };
}

export const LIMITS = { hand: "Hand position", rhythm: "Rhythm", voices: "Two voices", reading: "Key", length: "Length" };

/* Everything a piece needs, as skill ids, in the order a beginner tends to meet them. */
export function skillsOf(s, tab) {
  const f = factsOf(s, tab),
    out = [];
  for (const str of [...f.strings].sort((a, b) => b - a)) out.push(`string:${str}`);
  for (const [top, id] of [[3, "fret4"], [5, "fret6"], [7, "fret8"], [9, "fret10"], [12, "fret13"]]) if (f.top > top) out.push(id);
  if (f.eighths >= 0.05) out.push("eighths");
  if (f.dotted >= 0.03) out.push("dotted");
  if (f.sixteenths >= 0.02) out.push("sixteenths");
  if (f.triplets >= 0.02) out.push("triplets");
  if (f.offBeat >= 0.1) out.push("syncopation");
  if (s.pickup) out.push("pickup");
  if (f.rests) out.push("rests");
  if (s.time !== "4/4") out.push(`time:${s.time}`);
  const n = sharpsOf(s.key);
  for (let k = 1; k <= Math.abs(n); k++) out.push(n > 0 ? `sharps:${k}` : `flats:${k}`);
  if (f.accidentals >= 0.03) out.push("accidentals");
  if (f.shifts >= 0.02) out.push("shifts");
  if (f.two + f.full > 0) out.push("two");
  if (f.full >= 0.05) out.push("three");
  return out;
}

const STRINGS = ["low E string", "A string", "D string", "G string", "B string", "high E string"];
const WORDS = { fret4: "frets up to 5", fret6: "frets up to 7", fret8: "frets up to 9", fret10: "frets up to 12", fret13: "above fret 12", eighths: "eighth notes", dotted: "dotted rhythms", sixteenths: "sixteenth notes", triplets: "triplets", syncopation: "off-beat accents", pickup: "pick-up notes", rests: "rests", accidentals: "accidentals", shifts: "position shifts", two: "two notes at once", three: "full chords" };
export function skillWord(id) {
  const [kind, v] = id.split(":");
  if (kind === "string") return `the ${STRINGS[+v]}`;
  if (kind === "time") return `${v} time`;
  if (kind === "sharps") return `${v} sharp${v > 1 ? "s" : ""}`;
  if (kind === "flats") return `${v} flat${v > 1 ? "s" : ""}`;
  if (kind === "chord") return `the ${v} chord`;
  return WORDS[id] || id;
}
