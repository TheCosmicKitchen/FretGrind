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
      "Half steps, whole steps and the major scale",
      9,
      read("Two sizes of step", [
        "The <b>half step</b> (semitone) is the distance to the very next key on a piano. Two half steps make a <b>whole step</b> (whole tone). Between most neighbouring letters there is a black key, so they are a whole step apart; only <b>E–F</b> and <b>B–C</b> are a half step.",
      ], { fig: { keys: { oct: 1, names: "white", hi: [0, 2], hi2: [4, 5] }, cap: "C–D is a whole step (blue). E–F is a half step (gold)." }, hear: [{ l: "▶ Whole step C–D", seq: [60, 62], onsets: [0, 1], tempo: 70 }, { l: "▶ Half step E–F", seq: [64, 65], onsets: [0, 1], tempo: 70 }] }),
      read("W W H W W W H", [
        "A <b>scale</b> climbs from one note to the same note an octave up. The <b>major scale</b>, the do-re-mi scale, is defined by one pattern of whole (W) and half (H) steps: <b>W W H W W W H</b>. From C: C–D (W), D–E (W), E–F (H), F–G, G–A, A–B (W W W), B–C (H): the white keys C D E F G A B C. Start the same pattern on any other note and you get that note’s major scale.",
        "The pattern is really two identical four-note groups, each <b>W W H</b>, joined by a whole step: <b>W W H + W + W W H</b>. Such a group is a <b>tetrachord</b>. The top tetrachord of C major (G A B C) is exactly the bottom tetrachord of G major, which is where key signatures come from.",
      ], { fig: { pattern: { steps: ["W", "W", "H", "W", "W", "W", "H"], notes: ["C", "D", "E", "F", "G", "A", "B", "C"] } }, hear: [{ l: "▶ C major", ...seq(60) }] }),
      quiz(
        ask("C to D is a…", ["Whole step", "Half step", "Third", "Octave"], 0),
        ask("E to F is a…", ["Half step", "Whole step", "Third", "Fourth"], 0),
        ask("A whole step is…", ["Two half steps", "One half step", "Three half steps", "Four half steps"], 0),
        ask("What is the major scale pattern?", ["W W H W W W H", "W H W W H W W", "H W W H W W W", "W W W H W W H"], 0),
        ask("Where are the half steps in a major scale?", ["Between degrees 3–4 and 7–8", "1–2 and 5–6", "2–3 and 6–7", "4–5 and 7–8"], 0, "E–F and B–C in C major."),
        ask("How many whole steps does a major scale contain?", ["5", "7", "2", "3"], 0),
        ask("G to A is a…", ["Whole step", "Half step", "Fourth", "Third"], 0),
        ask("B to C is a…", ["Half step", "Whole step", "Third", "Unison"], 0),
        ask("A tetrachord in the major scale has the shape…", ["W W H", "W H W", "H W W", "W W W"], 0),
      ),
    ),
    lesson(
      "T3.2",
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
      "T3.3",
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
        ask("Why is it B♭ and not A♯ in F major?", ["Each letter name is used once", "A♯ doesn’t exist", "It sounds better", "It is a tradition for piano"], 0),
        ask("Which of these is the D major scale?", ["D E F♯ G A B C♯ D", "D E F G A B C D", "D E F♯ G A B♭ C D", "D E♭ F G A B C D"], 0),
      ),
    ),
    lesson(
      "T3.4",
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
      "T3.5",
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
      "T3.6",
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
        ask("What does the inner ring of the circle show?", ["Relative minor keys", "Chords of the tonic", "Tempo markings", "Fingerings"], 0),
        ask("Each step around the circle is up a…", ["Fifth", "Second", "Third", "Octave"], 0),
        ask("Keys next to each other on the circle share…", ["Most of their notes", "No notes", "The same tonic", "The same tempo"], 0),
      ),
    ),
    lesson(
      "T3.7",
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
      "T3.8",
      "Harmonic and melodic minor",
      8,
      read("Fixing the minor scale", [
        "The natural minor has a problem: its 7th note is a <b>whole</b> step below the tonic, so it has no strong pull upward. Composers fix that by <b>raising the 7th</b>: that is the <b>harmonic minor</b>: pattern <b>W H W W H W+H H</b>. A harmonic minor: A B C D E F <b>G♯</b> A. The jump from F to G♯ is an <b>augmented second</b> (3 half steps), which gives it the exotic, Middle-Eastern or classical sound.",
        "To avoid that awkward jump, the <b>melodic minor</b> raises <b>both the 6th and 7th</b> going <b>up</b> (A B C D E <b>F♯ G♯</b> A) and uses the natural minor coming <b>down</b>. In jazz, the “jazz melodic minor” uses the raised version in both directions.",
      ], { fig: { table: { head: ["Scale", "A minor"], rows: [["Natural", "A B C D E F G A"], ["Harmonic", "A B C D E F G♯ A"], ["Melodic (up)", "A B C D E F♯ G♯ A"], ["Melodic (down)", "A G F E D C B A"]] } }, hear: [{ l: "▶ Natural", ...seq(69, NMIN) }, { l: "▶ Harmonic", seq: [69, 71, 72, 74, 76, 77, 80, 81], onsets: [0, 1, 2, 3, 4, 5, 6, 7], tempo: 150 }, { l: "▶ Melodic (up)", seq: [69, 71, 72, 74, 76, 78, 80, 81], onsets: [0, 1, 2, 3, 4, 5, 6, 7], tempo: 150 }] }),
      quiz(
        ask("The harmonic minor scale raises the…", ["7th note", "3rd note", "5th note", "2nd note"], 0),
        ask("A harmonic minor contains the note…", ["G♯", "F♯", "B♭", "C♯"], 0),
        ask("The melodic minor, ascending, raises the…", ["6th and 7th", "3rd and 4th", "2nd and 5th", "7th only"], 0),
        ask("How does the traditional melodic minor go down?", ["Like the natural minor", "Like the harmonic minor", "Like the major", "It never goes down"], 0),
        ask("What interval is F to G♯ in A harmonic minor?", ["Augmented 2nd", "Major 2nd", "Minor 3rd", "Perfect 4th"], 0, "F to G♯ is three half steps spelled as a second."),
        ask("Why raise the 7th of a minor scale?", ["To make a leading tone that pulls up to the tonic", "To make it easier to play", "To make it longer", "To match the relative major"], 0),
        ask("Listen. Which scale is this?", ["Harmonic minor", "Natural minor", "Major", "Pentatonic"], 0, "The jump from the 6th to the raised 7th gives it away.", null, { seq: [69, 71, 72, 74, 76, 77, 80, 81], onsets: [0, 1, 2, 3, 4, 5, 6, 7], tempo: 150 }),
      ),
    ),
    lesson(
      "T3.9",
      "Pentatonic and blues scales",
      7,
      read("Five-note scales", [
        "<b>Pentatonic</b> scales keep five notes of a seven-note scale and drop the two that rub against the rest. The <b>major pentatonic</b> is degrees <b>1 2 3 5 6</b> of the major scale: in C, C D E G A. The <b>minor pentatonic</b> is <b>1 ♭3 4 5 ♭7</b>: in A, A C D E G.",
        "These two are the same five notes: C major pentatonic = A minor pentatonic, which is why one fingering pattern serves for both on an instrument. Adding the <b>♭5</b> to the minor pentatonic gives the <b>blues scale</b>: A C D E♭ E G.",
      ], { fig: { table: { head: ["Scale", "Formula", "In A / C"], rows: [["Major pentatonic", "1 2 3 5 6", "C D E G A"], ["Minor pentatonic", "1 ♭3 4 5 ♭7", "A C D E G"], ["Blues scale", "1 ♭3 4 ♭5 5 ♭7", "A C D E♭ E G"]] } }, hear: [{ l: "▶ C major pentatonic", seq: [60, 62, 64, 67, 69, 72], onsets: [0, 1, 2, 3, 4, 5], tempo: 140 }, { l: "▶ A minor pentatonic", seq: [69, 72, 74, 76, 79, 81], onsets: [0, 1, 2, 3, 4, 5], tempo: 140 }] }),
      quiz(
        ask("How many notes does a pentatonic scale have?", ["5", "7", "6", "12"], 0),
        ask("Which notes are in C major pentatonic?", ["C D E G A", "C E G B D", "C D F G A", "C D E F G"], 0),
        ask("A minor pentatonic is…", ["A C D E G", "A B C D E", "A C E G B", "A B D E F"], 0),
        ask("The blues scale adds which note to the minor pentatonic?", ["The ♭5", "The 6th", "The major 7th", "The 2nd"], 0),
        ask("C major pentatonic and A minor pentatonic have…", ["The same notes", "No notes in common", "Different key signatures", "Different tempos"], 0),
      ),
    ),
    lesson(
      "T3.10",
      "Chromatic, whole-tone and diminished scales",
      8,
      read("Scales that aren’t major or minor", [
        "The <b>chromatic scale</b> is every half step in an octave: 12 notes, no key, no home. The <b>whole-tone scale</b> is only whole steps: <b>C D E F♯ G♯ A♯ C</b>. It has just six notes and no half steps, so no leading tone and no sense of resolution: a floating, dreamy sound (Debussy used it a lot). There are only two different whole-tone scales.",
        "The <b>diminished</b> (octatonic) scale alternates whole and half steps: <b>W H W H W H W H</b>, eight notes: C D E♭ F G♭ A♭ A B. It is used in jazz over diminished and dominant chords. All these are <b>symmetrical</b>: the pattern repeats inside the octave, so they have no unique root.",
      ], { fig: { table: { head: ["Scale", "Notes", "Pattern"], rows: [["Chromatic", "12 notes", "H H H H H H H H H H H H"], ["Whole-tone", "6 notes: C D E F♯ G♯ A♯", "W W W W W W"], ["Diminished", "8 notes: C D E♭ F G♭ A♭ A B", "W H W H W H W H"]] } }, hear: [{ l: "▶ Whole tone", seq: [60, 62, 64, 66, 68, 70, 72], onsets: [0, 1, 2, 3, 4, 5, 6], tempo: 150 }, { l: "▶ Diminished", seq: [60, 62, 63, 65, 66, 68, 69, 71, 72], onsets: [0, 1, 2, 3, 4, 5, 6, 7, 8], tempo: 170 }] }),
      quiz(
        ask("How many notes does the whole-tone scale have in one octave?", ["6", "7", "8", "12"], 0),
        ask("How many notes does the diminished (octatonic) scale have?", ["8", "7", "6", "12"], 0),
        ask("The diminished scale alternates…", ["Whole and half steps", "Only whole steps", "Only half steps", "Thirds"], 0),
        ask("The chromatic scale contains…", ["Every half step", "Only white keys", "Only black keys", "Seven notes"], 0),
        ask("Why does the whole-tone scale sound unresolved?", ["It has no half steps and so no leading tone", "It is too fast", "It has too many notes", "It is always minor"], 0),
        ask("Which is the whole-tone scale from C?", ["C D E F♯ G♯ A♯", "C D E F G A", "C D♭ E♭ F G♭ A♭", "C E G B D F"], 0),
      ),
    ),
    lesson(
      "T3.11",
      "Spelling any scale",
      9,
      read("The one-letter-once rule", [
        "To spell a major scale from <b>any</b> root: write the seven letter names in order starting from the root (e.g. E F G A B C D), then use the W W H W W W H pattern to decide which need a sharp or flat. The scale of E: E F♯ G♯ A B C♯ D♯. Never repeat a letter or skip one, even if the result is an unusual name like B♯ or F𝄪; that is correct spelling.",
        "Check: each scale has either sharps or flats, never both mixed, and the number of accidentals matches the key signature (E major = four sharps: F♯ C♯ G♯ D♯).",
      ]),
      quiz(
        ask("Spell E major: which note is the 3rd?", ["G♯", "G", "F♯", "A"], 0, "E F♯ G♯ A B C♯ D♯."),
        ask("In E major, the 7th is…", ["D♯", "D", "E♯", "C♯"], 0),
        ask("In B♭ major, the 4th is…", ["E♭", "E", "F", "D"], 0, "B♭ C D E♭ F G A."),
        ask("In B♭ major, the 6th is…", ["G", "G♭", "A", "F"], 0),
        ask("In A♭ major, the 2nd is…", ["B♭", "B", "C", "A"], 0, "A♭ B♭ C D♭ E♭ F G."),
        ask("In D major, the 6th is…", ["B", "B♭", "A", "C♯"], 0, "D E F♯ G A B C♯."),
        ask("In F major, the 4th is…", ["B♭", "B", "A", "E"], 0, "F G A B♭ C D E."),
        ask("Which of these is a correctly spelled scale?", ["F G A B♭ C D E", "F G A A♯ C D E", "F G A B♭ B♭ D E", "F G G♯ B♭ C D E"], 0),
        ask("How many sharps does E major have?", ["4", "3", "5", "2"], 0),
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
