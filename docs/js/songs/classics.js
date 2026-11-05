/* Classic chord progressions, in any key, and your own made up on the spot. A progression is written in numerals, so it
   moves to any key; it comes out as a list of chord names, which plays as a run of changes ("chg:G,D,Em,C:4:66") with
   the usual slow-to-quick lesson. Pure, so Node can test it. */
import { namedShape } from "./changes.js";

/* numeral -> [semitones above the tonic, chord quality] */
export const NUMERALS = {
  I: [0, "major"], ii: [2, "minor"], iii: [4, "minor"], IV: [5, "major"], V: [7, "major"], vi: [9, "minor"],
  V7: [7, "7"], I7: [0, "7"], IV7: [5, "7"], ii7: [2, "m7"], Imaj7: [0, "maj7"],
  bVII: [10, "major"], bVI: [8, "major"], bIII: [3, "major"], iv: [5, "minor"],
  i: [0, "minor"], v: [7, "minor"],
};
const SPELL = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"], // the one spelling the shape library has
  SUFFIX = { major: "", minor: "m", 7: "7", m7: "m7", maj7: "maj7" };
export const numeralText = (n) => n.replace(/^b/, "♭").replace("maj7", "maj7");

/* heard: where you've heard it, as a starting point for the ear */
export const CLASSICS = [
  { id: "pop", nick: "The pop progression", nums: ["I", "V", "vi", "IV"], heard: "“Let It Be”, “With or Without You”" },
  { id: "fifties", nick: "The fifties progression", nums: ["I", "vi", "IV", "V"], heard: "“Stand by Me”" },
  { id: "three", nick: "Three chords", nums: ["I", "IV", "V", "IV"], heard: "“Twist and Shout”, “La Bamba”" },
  { id: "axis", nick: "The pop progression from the minor", nums: ["vi", "IV", "I", "V"], heard: "“Zombie”" },
  { id: "rock", nick: "The rock move", nums: ["I", "bVII", "IV", "I"], heard: "“Sweet Child o' Mine”, “Sympathy for the Devil”" },
  { id: "circle", nick: "Round the circle", nums: ["vi", "ii", "V", "I"], heard: "the bridge of many a standard" },
  { id: "royal", nick: "The royal road", nums: ["IV", "V", "iii", "vi"], heard: "a staple of Japanese pop" },
  { id: "jazz", nick: "The jazz turnaround", nums: ["ii7", "V7", "Imaj7", "Imaj7"], heard: "“Autumn Leaves”, most jazz standards" },
  { id: "canon", nick: "Pachelbel's Canon", nums: ["I", "V", "vi", "iii", "IV", "I", "IV", "V"], heard: "the Canon in D, and any wedding" },
  { id: "blues", nick: "The 12-bar blues", nums: ["I7", "I7", "I7", "I7", "IV7", "IV7", "I7", "I7", "V7", "IV7", "I7", "V7"], heard: "“Johnny B. Goode”, “Hound Dog”" },
  { id: "andalusian", nick: "The Andalusian cadence", minor: true, nums: ["i", "bVII", "bVI", "V"], heard: "“Hit the Road Jack”, flamenco" },
  { id: "minor", nick: "Minor and moody", minor: true, nums: ["i", "iv", "v", "i"], heard: "folk ballads in a minor key" },
];
export const MAJOR_KEYS = [0, 7, 2, 9, 4, 5, 10, 3], // C G D A E F B♭ E♭: the guitar's friendliest first
  MINOR_KEYS = [9, 4, 2, 11, 6, 0, 7]; // Am Em Dm Bm F♯m Cm Gm
export const keyText = (tonic, minor) => `${SPELL[tonic]}${minor ? "m" : ""}`;

/* The chord names of a progression in a key. */
export const chordsIn = (nums, tonic) => nums.map((n) => SPELL[(tonic + NUMERALS[n][0]) % 12] + SUFFIX[NUMERALS[n][1]]);
/* How hard the shapes are in this key: { barres: [names that need a barre or are high on the neck] }. */
export function shapesIn(names) {
  const hard = [...new Set(names)].filter((n) => {
    const sh = namedShape(n);
    return !sh || !sh.open;
  });
  return { open: !hard.length, hard };
}
/* The easiest key for a progression: fewest chords off the open shapes, the friendliest key first among equals. */
export function easiestKey(nums, minor) {
  const keys = minor ? MINOR_KEYS : MAJOR_KEYS;
  return keys.map((k, i) => ({ k, hard: shapesIn(chordsIn(nums, k)).hard.length, i })).sort((a, b) => a.hard - b.hard || a.i - b.i)[0].k;
}
/* The run of changes it plays as. */
export const runId = (names, beats = 4, tempo = 66) => `chg:${names.join(",")}:${beats}:${tempo}`;

/* ---------- your own ---------- */
/* What you can add: the chords of the key, a dominant seventh, and the borrowed chords pop and rock reach for. */
export const PALETTE = { major: ["I", "ii", "iii", "IV", "V", "vi", "V7", "bVII", "iv", "bVI"], minor: ["i", "iv", "v", "V", "bVI", "bIII", "bVII", "V7"] };
/* Where each chord likes to go next: the pull of the key, used to make one up on the spot. */
const NEXT = {
  major: { I: ["IV", "V", "vi", "ii", "iii", "bVII"], ii: ["V", "V7", "IV"], iii: ["vi", "IV"], IV: ["V", "I", "ii", "iv"], V: ["I", "vi", "IV"], V7: ["I", "vi"], vi: ["IV", "ii", "V", "iii"], bVII: ["IV", "I"], iv: ["I"], bVI: ["bVII", "V"] },
  minor: { i: ["iv", "bVI", "bVII", "v", "bIII"], iv: ["V", "i", "bVII", "v"], v: ["bVI", "iv"], V: ["i", "bVI"], V7: ["i"], bVI: ["bVII", "iv", "V", "bIII"], bIII: ["bVI", "iv", "bVII"], bVII: ["bIII", "i", "bVI"] },
};
/* A random progression to practise straight away: major or minor, three to six chords, in a key where every chord has
   an open shape if there is one. { nums, minor, key } */
export function randomProgression(r) {
  const minor = r() < 0.3,
    nums = makeProgression(minor, r, 3 + Math.floor(r() * 4)),
    keys = (minor ? MINOR_KEYS : MAJOR_KEYS).filter((k) => shapesIn(chordsIn(nums, k)).open);
  return { nums, minor, key: keys.length ? keys[Math.floor(r() * keys.length)] : easiestKey(nums, minor) };
}

/* A progression made up on the spot: it starts at home, wanders by the pulls of the key, and its last chord leads back
   round to the first, so it loops. r() is a random number 0..1. */
export function makeProgression(minor, r, length = 4) {
  const next = NEXT[minor ? "minor" : "major"],
    home = minor ? "i" : "I",
    leads = minor ? ["V", "V7", "bVII", "iv"] : ["V", "V7", "IV", "bVII"], // chords that lead back home
    pick = (a) => a[Math.floor(r() * a.length)];
  for (let tries = 0; tries < 50; tries++) {
    const out = [home];
    while (out.length < length) {
      const last = out.length === length - 1,
        opts = next[out[out.length - 1]].filter((n) => n !== home && (!last || leads.includes(n)));
      if (!opts.length) break;
      out.push(pick(opts));
    }
    if (out.length === length) return out;
  }
  return minor ? ["i", "bVI", "bVII", "V"] : ["I", "IV", "V", "IV"];
}
