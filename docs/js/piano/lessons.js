/* Piano lessons: plain data plus small pure helpers (no DOM, so Node can import it for tests).
   Each lesson:
     steps   - space-separated steps; a step is one note ("E4") or notes played together ("C4+E4+G4").
               Middle C is C4 (MIDI 60): pianos sound as written, unlike the guitar decks. Use # or b for accidentals.
     fingers - optional, one finger number per step (1 = thumb ... 5 = little finger), "-" for none.
     mode    - "keys": the target keys light up (default)
               "read": only the staff is shown; the keys light up after a miss
               "ear":  the note is played and hidden; it is revealed after two misses
     flats   - spell black keys as flats.
     drill   - optional flash-card decks to practise afterwards (a MIDI keyboard can answer them). */
import { LET, LSEM } from "../core/theory.js";

export const PASS_MARK = 80;

export const PIANO_UNITS = [
  {
    name: "Find your way around",
    lessons: [
      {
        id: "middle-c",
        title: "Find middle C",
        intro:
          "Black keys come in groups of <b>two</b> and <b>three</b>. Every <b>C</b> is the white key just left of a group of two. <b>Middle C</b> is the C closest to the middle of your keyboard. Play each C the app asks for. Small keyboard? Use its octave buttons, or turn on <i>Any octave</i>.",
        steps: "C4 C4 C5 C4 C3 C4",
        fingers: "1 1 1 1 1 1",
      },
      {
        id: "cde",
        title: "C, D, E: the group of two",
        intro:
          "Put your right thumb (finger 1) on middle C, finger 2 on D and finger 3 on E. D sits <b>between</b> the two black keys; E is just right of them.",
        steps: "C4 D4 E4 E4 D4 C4 D4 E4 C4 E4 D4 C4",
        fingers: "1 2 3 3 2 1 2 3 1 3 2 1",
      },
      {
        id: "fgab",
        title: "F, G, A, B: the group of three",
        intro:
          "F is the white key just left of a group of three black keys. Then come G, A and B, and the next C starts the pattern again.",
        steps: "F4 G4 A4 B4 B4 A4 G4 F4 G4 B4 A4 F4",
      },
      {
        id: "white-keys",
        title: "All seven white keys",
        intro:
          "The white keys repeat <b>C D E F G A B</b>. Play up from middle C and back down. Tuck your thumb under after E on the way up, and cross finger 3 over on the way down.",
        steps: "C4 D4 E4 F4 G4 A4 B4 C5 B4 A4 G4 F4 E4 D4 C4",
        fingers: "1 2 3 1 2 3 4 5 4 3 2 1 3 2 1",
      },
      {
        id: "black-keys",
        title: "Black keys: sharps",
        intro:
          "A <b>sharp</b> (♯) is the key just to the right. The black key right of C is <b>C♯</b>. Play each sharp the app names.",
        steps: "C#4 D#4 F#4 G#4 A#4 F#4 C#4 G#4 D#4 A#4",
      },
      {
        id: "flats",
        title: "Black keys: flats",
        intro:
          "A <b>flat</b> (♭) is the key just to the left. The black key left of E is <b>E♭</b>, the same key as D♯. Each black key has two names.",
        steps: "Bb4 Eb4 Ab4 Db4 Gb4 Eb4 Bb4 Db4",
        flats: true,
      },
    ],
  },
  {
    name: "First melodies",
    lessons: [
      {
        id: "mary",
        title: "Mary Had a Little Lamb",
        intro: "Traditional. Right thumb on middle C; your hand stays still the whole song.",
        steps: "E4 D4 C4 D4 E4 E4 E4 D4 D4 D4 E4 G4 G4 E4 D4 C4 D4 E4 E4 E4 E4 D4 D4 E4 D4 C4",
        fingers: "3 2 1 2 3 3 3 2 2 2 3 5 5 3 2 1 2 3 3 3 3 2 2 3 2 1",
      },
      {
        id: "ode",
        title: "Ode to Joy",
        intro: "Beethoven, Symphony No. 9. Right thumb on middle C again. Five notes, five fingers.",
        steps: "E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 E4 D4 D4 E4 E4 F4 G4 G4 F4 E4 D4 C4 C4 D4 E4 D4 C4 C4",
        fingers: "3 3 4 5 5 4 3 2 1 1 2 3 3 2 2 3 3 4 5 5 4 3 2 1 1 2 3 2 1 1",
      },
      {
        id: "twinkle",
        title: "Twinkle, Twinkle, Little Star",
        intro: "Traditional. The jump from C up to G is a <b>fifth</b>. Stretch your hand a little so you can reach A.",
        steps:
          "C4 C4 G4 G4 A4 A4 G4 F4 F4 E4 E4 D4 D4 C4 G4 G4 F4 F4 E4 E4 D4 G4 G4 F4 F4 E4 E4 D4 C4 C4 G4 G4 A4 A4 G4 F4 F4 E4 E4 D4 D4 C4",
      },
      {
        id: "jacques",
        title: "Frère Jacques",
        intro: "Traditional round. The last line dips below middle C to the G underneath.",
        steps: "C4 D4 E4 C4 C4 D4 E4 C4 E4 F4 G4 E4 F4 G4 G4 A4 G4 F4 E4 C4 G4 A4 G4 F4 E4 C4 C4 G3 C4 C4 G3 C4",
      },
    ],
  },
  {
    name: "Reading music",
    lessons: [
      {
        id: "read-treble",
        title: "Reading the treble staff",
        intro:
          "Now the keys won't light up; read the note from the staff. Treble lines from the bottom are <b>E G B D F</b> (Every Good Boy Does Fine). The spaces spell <b>F A C E</b>. Middle C sits on a little ledger line below.",
        steps: "E4 G4 B4 D5 F5 F4 A4 C5 E5 C4 D4 G4 B4 E5 A4 F5 C5 D5",
        mode: "read",
        drill: ["staff"],
      },
      {
        id: "read-bass",
        title: "Reading the bass staff (left hand)",
        intro:
          "The bass staff is for your left hand. Its lines are <b>G B D F A</b> (Good Boys Do Fine Always) and its spaces <b>A C E G</b> (All Cows Eat Grass). Middle C is a ledger line above.",
        steps: "G2 B2 D3 F3 A3 A2 C3 E3 G3 C4 C3 G2 F3 D3 B2 E3",
        mode: "read",
      },
      {
        id: "read-sharps",
        title: "Reading sharps and flats",
        intro: "A ♯ or ♭ in front of a note moves it to the next key right or left, usually a black key.",
        steps: "F#4 Bb4 C#5 Eb4 G#4 F#5 Ab4 D#5",
        mode: "read",
      },
    ],
  },
  {
    name: "Scales",
    lessons: [
      {
        id: "c-major",
        title: "C major scale (right hand)",
        intro:
          "All white keys from C to C. Fingering: <b>1 2 3</b>, tuck the thumb under to F, then <b>1 2 3 4 5</b>. Coming down, cross finger 3 over the thumb at E.",
        steps: "C4 D4 E4 F4 G4 A4 B4 C5 B4 A4 G4 F4 E4 D4 C4",
        fingers: "1 2 3 1 2 3 4 5 4 3 2 1 3 2 1",
      },
      {
        id: "c-major-lh",
        title: "C major scale (left hand)",
        intro: "Left hand, an octave lower. Start on finger 5, then cross finger 3 over the thumb at A.",
        steps: "C3 D3 E3 F3 G3 A3 B3 C4 B3 A3 G3 F3 E3 D3 C3",
        fingers: "5 4 3 2 1 3 2 1 2 3 1 2 3 4 5",
      },
      {
        id: "g-major",
        title: "G major scale",
        intro: "Same shape as C major, starting on G. It has one black key: <b>F♯</b>.",
        steps: "G4 A4 B4 C5 D5 E5 F#5 G5 F#5 E5 D5 C5 B4 A4 G4",
        fingers: "1 2 3 1 2 3 4 5 4 3 2 1 3 2 1",
      },
      {
        id: "f-major",
        title: "F major scale",
        intro: "F major has one flat: <b>B♭</b>. The thumb tucks after B♭ this time: <b>1 2 3 4</b>, then <b>1 2 3 4</b>.",
        steps: "F4 G4 A4 Bb4 C5 D5 E5 F5 E5 D5 C5 Bb4 A4 G4 F4",
        fingers: "1 2 3 4 1 2 3 4 3 2 1 4 3 2 1",
        flats: true,
      },
      {
        id: "a-minor",
        title: "A natural minor scale",
        intro: "The same white keys as C major, but starting on A. Hear how much darker it sounds.",
        steps: "A4 B4 C5 D5 E5 F5 G5 A5 G5 F5 E5 D5 C5 B4 A4",
        fingers: "1 2 3 1 2 3 4 5 4 3 2 1 3 2 1",
      },
    ],
  },
  {
    name: "Chords",
    lessons: [
      {
        id: "triads",
        title: "Your first chords: C, F and G",
        intro:
          "A <b>triad</b> is three notes stacked in thirds: skip a white key, play one, skip one, play one. Hold all three keys at the same time. Use fingers <b>1 3 5</b>.",
        steps: "C4+E4+G4 F4+A4+C5 G4+B4+D5 C4+E4+G4 G4+B4+D5 F4+A4+C5 C4+E4+G4",
        fingers: "- - - - - - -",
      },
      {
        id: "minor-triads",
        title: "Minor chords: Am, Dm and Em",
        intro: "Same shape, but these chords have a <b>minor third</b> on the bottom, so they sound sadder.",
        steps: "A3+C4+E4 D4+F4+A4 E4+G4+B4 A3+C4+E4 E4+G4+B4 D4+F4+A4 A3+C4+E4",
      },
      {
        id: "inversions",
        title: "I – IV – V – I with inversions",
        intro:
          "Moving your whole hand between chords is slow. Rearrange the notes instead (an <b>inversion</b>) so each chord is close to the last. C stays home; F becomes C-F-A; G becomes B-D-G.",
        steps: "C4+E4+G4 C4+F4+A4 B3+D4+G4 C4+E4+G4 C4+F4+A4 B3+D4+G4 C4+E4+G4",
      },
      {
        id: "pop",
        title: "The pop progression: C – G – Am – F",
        intro: "Hundreds of songs use these four chords. These inversions keep your hand in one spot.",
        steps: "C4+E4+G4 B3+D4+G4 C4+E4+A4 C4+F4+A4 C4+E4+G4 B3+D4+G4 C4+E4+A4 C4+F4+A4 C4+E4+G4",
      },
      {
        id: "sevenths",
        title: "Seventh chords",
        intro: "Add one more third on top and you get a four-note <b>seventh chord</b>. G7 pulls strongly home to C.",
        steps: "C4+E4+G4+B4 D4+F4+A4+C5 G3+B3+D4+F4 C4+E4+G4 D4+F4+A4+C5 G3+B3+D4+F4 C4+E4+G4+B4",
      },
    ],
  },
  {
    name: "Hands together",
    lessons: [
      {
        id: "bass-melody",
        title: "Ode to Joy with a bass note",
        intro:
          "Left hand plays one bass note at the start of each bar, <b>together</b> with the melody note. Press both at once on the steps with two notes.",
        steps: "C3+E4 E4 F4 G4 G3+G4 F4 E4 D4 C3+C4 C4 D4 E4 G3+E4 D4 D4 C3+E4 E4 F4 G4 G3+G4 F4 E4 D4 C3+C4 C4 D4 E4 G3+D4 C4 C3+C4",
      },
      {
        id: "lh-chords",
        title: "Left-hand chords under a melody",
        intro: "Left hand holds a triad; right hand plays the top note. Play all four notes together.",
        steps: "C3+E3+G3+E4 F3+A3+C4+F4 G3+B3+D4+G4 C3+E3+G3+C5 F3+A3+C4+A4 G3+B3+D4+B4 C3+E3+G3+C5",
      },
    ],
  },
  {
    name: "Ear training",
    lessons: [
      {
        id: "echo",
        title: "Echo: play the note you hear",
        intro:
          "Each note is played to you; find it on the keyboard. Every note is between middle C and G. Press <b>▶ Hear it</b> to hear it again.",
        steps: "C4 E4 G4 D4 F4 E4 C4 G4 D4 F4 E4 G4",
        mode: "ear",
      },
      {
        id: "echo-octave",
        title: "Echo: the whole C major scale",
        intro: "The same game across a full octave, C to C. Use the first note as a reference if you get lost.",
        steps: "C4 G4 E4 A4 D4 B4 F4 C5 A4 E4 G4 D4 B4 C5",
        mode: "ear",
      },
    ],
  },
];

/* "C#4" -> 61, "Bb3" -> 58 */
export function pianoNote(s) {
  const m = /^([A-G])([#b]?)(-?\d)$/.exec(s);
  if (!m) throw new Error("Bad note " + s);
  return (+m[3] + 1) * 12 + LSEM[LET.indexOf(m[1])] + (m[2] === "#" ? 1 : m[2] === "b" ? -1 : 0);
}
export const PIANO_LESSONS = PIANO_UNITS.flatMap((u, ui) =>
  u.lessons.map((L) => ({
    ...L,
    unit: ui,
    mode: L.mode || "keys",
    parsed: L.steps.trim().split(/\s+/).map((t) => t.split("+").map(pianoNote)),
    fing: L.fingers ? L.fingers.trim().split(/\s+/) : [],
  })),
);

const SHARP = ["C", "C♯", "D", "D♯", "E", "F", "F♯", "G", "G♯", "A", "A♯", "B"],
  FLAT = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];
/* 61 -> "C♯4" (or "D♭4" with flats) */
export const noteName = (m, flats, oct = true) => (flats ? FLAT : SHARP)[m % 12] + (oct ? Math.floor(m / 12) - 1 : "");
export const isBlack = (m) => [1, 3, 6, 8, 10].includes(m % 12);

const CHORDS = [
  [[0, 4, 7], ""],
  [[0, 3, 7], "m"],
  [[0, 3, 6], "dim"],
  [[0, 4, 8], "aug"],
  [[0, 4, 7, 10], "7"],
  [[0, 4, 7, 11], "maj7"],
  [[0, 3, 7, 10], "m7"],
  [[0, 3, 6, 10], "m7♭5"],
  [[0, 2, 7], "sus2"],
  [[0, 5, 7], "sus4"],
  [[0, 7], "5"],
];
/* Name the chord in a set of held notes: [60, 64, 67] -> "C", [64, 67, 72] -> "C/E". "" when unknown. */
export function chordName(notes) {
  const pcs = [...new Set(notes.map((m) => m % 12))];
  if (pcs.length < 2) return "";
  const bass = Math.min(...notes) % 12;
  for (const root of pcs) {
    const iv = pcs.map((p) => (p - root + 12) % 12).sort((a, b) => a - b).join();
    const hit = CHORDS.find(([t]) => t.join() === iv);
    if (hit) return SHARP[root] + hit[1] + (bass !== root ? "/" + SHARP[bass] : "");
  }
  return "";
}

/* Does a played note count for target t? anyOct accepts the same note name in any octave. */
export const matches = (x, t, anyOct) => (anyOct ? x % 12 === t % 12 : x === t);

/* Accuracy and stars for a finished lesson. */
export function grade(hits, miss) {
  const pct = Math.round((100 * hits) / Math.max(1, hits + miss));
  return { pct, stars: pct >= 100 ? 3 : pct >= 90 ? 2 : pct >= PASS_MARK ? 1 : 0, passed: pct >= PASS_MARK };
}
