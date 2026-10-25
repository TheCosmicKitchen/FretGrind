/* Theory 3: Scales and keys. */
import { ask, course, lesson, practice, quiz, read } from "../dsl.js";

const up = (start, steps) => {
  const out = [start];
  for (const s of steps) out.push(out[out.length - 1] + s);
  return out;
};
const MAJ = [2, 2, 1, 2, 2, 2, 1];
const NMIN = [2, 1, 2, 2, 1, 2, 2];
const seq = (start, steps = MAJ) => ({ seq: up(start, steps), onsets: [0, 1, 2, 3, 4, 5, 6, 7], tempo: 150 });
const KEYS_SHARP = [["G", 1], ["D", 2], ["A", 3], ["E", 4], ["B", 5]];
const KEYS_FLAT = [["F", 1], ["B♭", 2], ["E♭", 3], ["A♭", 4], ["D♭", 5]];

export const T3 = course(
  "T3",
  "Scales and keys",
  "Whole and half steps, the major scale, key signatures, the circle of fifths, minor scales and pentatonics.",
  [
    lesson(
      "T3.1",
      "Whole steps and half steps",
      5,
      read("Two sizes of step", [
        "The smallest distance between notes is the <b>half step</b> (semitone): to the very next key on a piano, or the next fret on a guitar. Two half steps make a <b>whole step</b> (whole tone), skipping one key or one fret.",
        "From C to D is a whole step (a black key in between). From E to F is only a half step (there is no black key). The pairs <b>E–F</b> and <b>B–C</b> are the only natural neighbours that are a half step apart.",
      ], { fig: { keys: { oct: 1, names: "white", hi: [0, 2], hi2: [4, 5] }, cap: "C–D is a whole step (blue). E–F is a half step (gold)." }, hear: [{ l: "▶ Whole step C–D", seq: [60, 62], onsets: [0, 1], tempo: 70 }, { l: "▶ Half step E–F", seq: [64, 65], onsets: [0, 1], tempo: 70 }] }),
      quiz(
        ask("C to D is a…", ["Whole step", "Half step", "Third", "Octave"], 0),
        ask("E to F is a…", ["Half step", "Whole step", "Third", "Fourth"], 0),
        ask("B to C is a…", ["Half step", "Whole step", "Third", "Unison"], 0),
        ask("A whole step is…", ["Two half steps", "One half step", "Three half steps", "Four half steps"], 0),
        ask("On a guitar, a whole step is…", ["Two frets", "One fret", "Three frets", "Five frets"], 0),
        ask("G to A is a…", ["Whole step", "Half step", "Fourth", "Third"], 0),
      ),
    ),
    lesson(
      "T3.2",
      "The major scale pattern",
      6,
      read("W W H W W W H", [
        "A <b>scale</b> is a set of notes in order from one note to the same note an octave higher. The <b>major scale</b> is the do-re-mi scale, and it follows one pattern of whole (W) and half (H) steps: <b>W W H W W W H</b>.",
        "Start on C: C–D (W), D–E (W), E–F (H), F–G (W), G–A (W), A–B (W), B–C (H). That gives the white-key scale <b>C D E F G A B C</b>. Start the same pattern on any other note and you get that note’s major scale.",
      ], { fig: { pattern: { steps: ["W", "W", "H", "W", "W", "W", "H"], notes: ["C", "D", "E", "F", "G", "A", "B", "C"] } }, hear: [{ l: "▶ C major", ...seq(60) }] }),
      quiz(
        ask("What is the major scale pattern?", ["W W H W W W H", "W H W W H W W", "H W W H W W W", "W W W H W W H"], 0),
        ask("Between which scale notes are the half steps in the major scale?", ["3–4 and 7–8", "1–2 and 5–6", "2–3 and 6–7", "4–5 and 7–8"], 0, "E–F and B–C in C major: degrees 3–4 and 7–8."),
        ask("How many different notes does a major scale have (not counting the repeated top note)?", ["7", "8", "5", "12"], 0),
        ask("The C major scale uses…", ["Only white keys", "Only black keys", "Three sharps", "Two flats"], 0),
        ask("How many whole steps are in a major scale?", ["5", "7", "2", "3"], 0),
      ),
    ),
    lesson(
      "T3.3",
      "Scale degrees",
      5,
      read("Numbers and names", [
        "Each note in a scale has a number, its <b>degree</b>: 1 to 7. The first note is the <b>tonic</b>: the home note that gives the scale and key their name. The fifth is the <b>dominant</b>, the fourth the <b>subdominant</b>, and the seventh the <b>leading tone</b>, because in the major scale it is a half step below the tonic and pulls up to it.",
        "Singers use <b>solfège</b>: do re mi fa sol la ti do. In any major key, do is the tonic.",
      ], { fig: { table: { head: ["Degree", "1", "2", "3", "4", "5", "6", "7"], rows: [["Name", "Tonic", "Supertonic", "Mediant", "Subdominant", "Dominant", "Submediant", "Leading tone"], ["Solfège", "do", "re", "mi", "fa", "sol", "la", "ti"], ["In C", "C", "D", "E", "F", "G", "A", "B"]] } } }),
      quiz(
        ask("The first degree of a scale is called…", ["The tonic", "The dominant", "The leading tone", "The mediant"], 0),
        ask("Degree 5 is…", ["The dominant", "The tonic", "The mediant", "The subdominant"], 0),
        ask("In C major, which note is degree 4?", ["F", "G", "E", "A"], 0),
        ask("In solfège, the fifth note is…", ["sol", "fa", "la", "mi"], 0),
        ask("The leading tone is a half step below…", ["The tonic", "The dominant", "The mediant", "The subdominant"], 0),
      ),
    ),
    lesson(
      "T3.4",
      "Building other major scales: G, D and F",
      7,
      read("Same pattern, different start", [
        "Apply W W H W W W H starting on <b>G</b>: G–A (W), A–B (W), B–C (H), C–D (W), D–E (W), E–F♯ (W), F♯–G (H). The seventh note has to be <b>F♯</b>, not F, to keep the pattern. So <b>G major has one sharp</b>.",
        "Rule of thumb: <b>use each letter name exactly once</b> (G A B C D E F♯, never G A B C D E G♭), then add the sharps or flats the pattern demands.",
      ], { fig: { staff: { notes: ["G4", "A4", "B4", "C5", "D5", "E5", "F#5", "G5"], names: true }, cap: "G major: one sharp, F♯." }, hear: [{ l: "▶ G major", ...seq(67) }] }),
      read("D major and F major", [
        "<b>D major</b>: D E F♯ G A B C♯ D. Two sharps (F♯ and C♯).",
        "<b>F major</b> goes the other way: F G A B♭ C D E F. The fourth note must be B♭ instead of B (the half step has to land between degrees 3 and 4). One flat.",
      ], { figs: [{ staff: { notes: ["D4", "E4", "F#4", "G4", "A4", "B4", "C#5", "D5"], names: true }, cap: "D major: F♯ and C♯." }, { staff: { notes: ["F4", "G4", "A4", "Bb4", "C5", "D5", "E5", "F5"], names: true }, cap: "F major: B♭." }], hear: [{ l: "▶ D major", ...seq(62) }, { l: "▶ F major", ...seq(65) }] }),
      quiz(
        ask("How many sharps does G major have?", ["1", "2", "0", "3"], 0),
        ask("Which note is the seventh of G major?", ["F♯", "F", "G♭", "E"], 0),
        ask("What are the sharps of D major?", ["F♯ and C♯", "F♯ only", "C♯ and G♯", "B♭ and E♭"], 0),
        ask("What is the fourth note of F major?", ["B♭", "B", "A♯", "C"], 0),
        ask("Why is it B♭ and not A♯ in F major?", ["Each letter name is used once", "A♯ doesn’t exist", "It sounds better", "It is a tradition for guitar"], 0),
        ask("Which of these is the D major scale?", ["D E F♯ G A B C♯ D", "D E F G A B C D", "D E F♯ G A B♭ C D", "D E♭ F G A B C D"], 0),
      ),
    ),
    lesson(
      "T3.5",
      "Key signatures with sharps",
      7,
      read("Sharps in a fixed order", [
        "Instead of writing a sharp every time, the <b>key signature</b> places the sharps or flats a key needs at the start of each line, just after the clef. Every F in the music is then F♯ unless cancelled.",
        "Sharps always appear in the same order: <b>F C G D A E B</b> (a mnemonic: <b>F</b>ather <b>C</b>harles <b>G</b>oes <b>D</b>own <b>A</b>nd <b>E</b>nds <b>B</b>attle). Keys with sharps: <b>G</b> (1♯), <b>D</b> (2♯), <b>A</b> (3♯), <b>E</b> (4♯), <b>B</b> (5♯).",
      ], { figs: [{ staff: { notes: ["G4"], ks: { sharps: 1 }, names: ["G major"] } }, { staff: { notes: ["D4"], ks: { sharps: 2 }, names: ["D major"] } }, { staff: { notes: ["A4"], ks: { sharps: 3 }, names: ["A major"] } }] }),
      read("Find the key", ["To name a sharp key from its signature: <b>go up a half step from the last sharp</b>. Two sharps (F♯, C♯): the last is C♯, so the key is D. Three sharps (F♯, C♯, G♯): last G♯ → A. Four sharps: last D♯ → E."]),
      quiz(
        ask("What is the order of sharps?", ["F C G D A E B", "B E A D G C F", "C D E F G A B", "A B C D E F G"], 0),
        ask("A key signature with two sharps (F♯ C♯) is…", ["D major", "G major", "A major", "E major"], 0),
        ask("A key signature with three sharps is…", ["A major", "E major", "D major", "B major"], 0),
        ask("How many sharps does E major have?", ["4", "3", "5", "2"], 0),
        ask("Which major key has five sharps?", ["B", "A", "E", "F♯"], 0),
        ask("What is the first sharp in any key signature?", ["F♯", "C♯", "G♯", "B♯"], 0),
      ),
    ),
    lesson(
      "T3.6",
      "Key signatures with flats",
      7,
      read("Flats in reverse", [
        "Flats appear in the opposite order: <b>B E A D G C F</b> (<b>B</b>attle <b>E</b>nds <b>A</b>nd <b>D</b>own <b>G</b>oes <b>C</b>harles’ <b>F</b>ather). The keys: <b>F</b> (1♭), <b>B♭</b> (2♭), <b>E♭</b> (3♭), <b>A♭</b> (4♭), <b>D♭</b> (5♭).",
        "To name a flat key: <b>the key is the second-to-last flat</b>. Three flats (B♭ E♭ A♭): the second-to-last is E♭, so the key is E♭ major. (F major, with just one flat, you need to remember.)",
      ], { figs: [{ staff: { notes: ["F4"], ks: { flats: 1 }, names: ["F major"] } }, { staff: { notes: ["Bb4"], ks: { flats: 2 }, names: ["B♭ major"] } }, { staff: { notes: ["Eb4"], ks: { flats: 3 }, names: ["E♭ major"] } }] }),
      quiz(
        ask("What is the order of flats?", ["B E A D G C F", "F C G D A E B", "F B E A D G C", "C F B E A D G"], 0),
        ask("A key signature with two flats (B♭ E♭) is…", ["B♭ major", "E♭ major", "F major", "A♭ major"], 0),
        ask("A key signature with three flats is…", ["E♭ major", "B♭ major", "A♭ major", "F major"], 0),
        ask("How many flats does A♭ major have?", ["4", "3", "5", "2"], 0),
        ask("Which major key has one flat?", ["F", "B♭", "G", "C"], 0),
        ask("What is the first flat in any key signature?", ["B♭", "E♭", "F♭", "A♭"], 0),
      ),
    ),
    lesson(
      "T3.7",
      "The circle of fifths",
      7,
      read("Twelve keys in a ring", [
        "Arrange the keys by <b>fifths</b> (each step is up a fifth: C → G → D → A…) and they form a circle. <b>Clockwise adds one sharp each time</b>: C (none), G (1♯), D (2♯), A (3♯)… and <b>counter-clockwise adds one flat</b>: F (1♭), B♭ (2♭), E♭ (3♭)… The two meet at the bottom, where F♯ (6♯) and G♭ (6♭) are the same pitch.",
        "The inner ring shows each key’s <b>relative minor</b>, which shares its key signature. The circle also tells you which chords are close friends: the keys next to yours share most of their notes.",
      ], { fig: { circle: { hi: [0, 1, 11] }, cap: "C major with its neighbours G and F highlighted." } }),
      quiz(
        ask("Going clockwise around the circle from C, each key adds…", ["One sharp", "One flat", "Two sharps", "A natural"], 0),
        ask("Which key is one step counter-clockwise from C?", ["F", "G", "D", "B♭"], 0),
        ask("How many sharps does the key A have?", ["3", "2", "4", "1"], 0, "C, G (1), D (2), A (3).", { circle: { hi: [3] } }),
        ask("What does the inner ring of the circle show?", ["Relative minor keys", "Chords of the tonic", "Tempo markings", "Frets"], 0),
        ask("Each step around the circle is up a…", ["Fifth", "Second", "Third", "Octave"], 0),
        ask("Keys next to each other on the circle share…", ["Most of their notes", "No notes", "The same tonic", "The same tempo"], 0),
      ),
    ),
    lesson(
      "T3.8",
      "Natural minor and relative keys",
      7,
      read("The sad scale", [
        "The <b>natural minor</b> scale has the step pattern <b>W H W W H W W</b>. A minor: A B C D E F G A, all white keys. It sounds darker than major because its third is a half step lower.",
        "Every major key has a <b>relative minor</b> that uses exactly the same notes and key signature. It starts on the <b>6th note</b> of the major scale (or, equivalently, three half steps below the major tonic): C major ↔ A minor, G major ↔ E minor, D major ↔ B minor, F major ↔ D minor.",
      ], { fig: { staff: { notes: ["A4", "B4", "C5", "D5", "E5", "F5", "G5", "A5"], names: true }, cap: "A natural minor." }, hear: [{ l: "▶ A minor", ...seq(69, NMIN) }, { l: "▶ C major", ...seq(60) }] }),
      read("Parallel minor and harmonic minor", [
        "<b>Parallel</b> keys share the same tonic: C major and C minor. C minor has three flats (B♭ E♭ A♭). In the <b>harmonic minor</b> the 7th note is raised a half step (A minor: G♯ instead of G), which creates the pull back to the tonic that you hear in many classical and folk melodies.",
      ]),
      quiz(
        ask("What is the pattern of the natural minor scale?", ["W H W W H W W", "W W H W W W H", "W W H W W H W", "H W W H W W W"], 0),
        ask("What is the relative minor of C major?", ["A minor", "E minor", "D minor", "G minor"], 0),
        ask("What is the relative minor of G major?", ["E minor", "A minor", "B minor", "D minor"], 0),
        ask("What is the relative minor of D major?", ["B minor", "E minor", "F♯ minor", "G minor"], 0),
        ask("Relative keys share…", ["The same key signature", "The same tonic", "The same tempo", "No notes"], 0),
        ask("The harmonic minor scale raises the…", ["7th note", "3rd note", "5th note", "2nd note"], 0),
      ),
    ),
    lesson(
      "T3.9",
      "Pentatonic and blues scales",
      7,
      read("Five-note scales", [
        "<b>Pentatonic</b> scales keep five notes of a seven-note scale and drop the two that rub against the rest. The <b>major pentatonic</b> is degrees <b>1 2 3 5 6</b> of the major scale: in C, C D E G A. The <b>minor pentatonic</b> is <b>1 ♭3 4 5 ♭7</b>: in A, A C D E G.",
        "These two are the same five notes: C major pentatonic = A minor pentatonic, which is why one guitar box serves for both. Adding the <b>♭5</b> to the minor pentatonic gives the <b>blues scale</b>: A C D E♭ E G.",
      ], { fig: { table: { head: ["Scale", "Formula", "In A / C"], rows: [["Major pentatonic", "1 2 3 5 6", "C D E G A"], ["Minor pentatonic", "1 ♭3 4 5 ♭7", "A C D E G"], ["Blues scale", "1 ♭3 4 ♭5 5 ♭7", "A C D E♭ E G"]] } }, hear: [{ l: "▶ C major pentatonic", seq: [60, 62, 64, 67, 69, 72], onsets: [0, 1, 2, 3, 4, 5], tempo: 140 }, { l: "▶ A minor pentatonic", seq: [69, 72, 74, 76, 79, 81], onsets: [0, 1, 2, 3, 4, 5], tempo: 140 }] }),
      quiz(
        ask("How many notes does a pentatonic scale have?", ["5", "7", "6", "12"], 0),
        ask("Which notes are in C major pentatonic?", ["C D E G A", "C E G B D", "C D F G A", "C D E F G"], 0),
        ask("A minor pentatonic is…", ["A C D E G", "A B C D E", "A C E G B", "A B D E F"], 0),
        ask("The blues scale adds which note to the minor pentatonic?", ["The ♭5", "The 6th", "The major 7th", "The 2nd"], 0),
        ask("C major pentatonic and A minor pentatonic have…", ["The same notes", "No notes in common", "Different key signatures", "Different tempos"], 0),
      ),
    ),
  ],
  {
    gen: (n) =>
      Array.from({ length: n }, () => {
        const pool = [
          ...KEYS_SHARP.map(([k, c]) => ({ p: `How many sharps does ${k} major have?`, a: [String(c), String((c + 1) % 8), String((c + 2) % 8), String((c + 3) % 8)].filter((v, i, a) => a.indexOf(v) === i), c: 0 })),
          ...KEYS_FLAT.map(([k, c]) => ({ p: `How many flats does ${k} major have?`, a: [String(c), String((c + 1) % 8), String((c + 2) % 8), String((c + 3) % 8)].filter((v, i, a) => a.indexOf(v) === i), c: 0 })),
        ];
        return pool[(Math.random() * pool.length) | 0];
      }),
  },
);
