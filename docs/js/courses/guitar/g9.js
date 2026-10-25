/* Guitar 9: Scales on the neck. */
import { ask, card, course, lesson, practice, quiz, read } from "../dsl.js";

const OPEN = [52, 57, 62, 67, 71, 76];
// A minor pentatonic, box 1: [string, fret]
const BOX = [[0, 5], [0, 8], [1, 5], [1, 7], [2, 5], [2, 7], [3, 5], [3, 7], [4, 5], [4, 8], [5, 5], [5, 8]];
const UP = BOX.map((x) => [x]);
const midi = (c) => c.map(([s, f]) => OPEN[s] + f);

export const G9 = course(
  "G9",
  "Scales on the neck",
  "The pentatonic box, the blue note, major pentatonic and moving a box to any key.",
  [
    lesson(
      "G9.1",
      "Minor pentatonic: box 1",
      7,
      read("Five notes, one shape", [
        "<b>Penta</b> means five: a pentatonic scale has only five notes, with no awkward half steps, and almost anything you play over a chord sounds good. It is the most common scale in rock, blues and folk-rock soloing.",
        "The A minor pentatonic is <b>A C D E G</b>. “Box 1” is its best-known pattern, sitting at frets 5 to 8. The index finger takes fret 5 and the pinky fret 8; where the pattern has fret 7, use the ring finger.",
      ], { fig: { neck: { range: [4, 9], dots: BOX.map(([s, f]) => [s, f]) }, cap: "Box 1, frets 5–8. Roots (A) are on the low E and high e at fret 5 and the D string at fret 7." }, hear: [{ l: "▶ Hear it up", seq: midi(BOX), onsets: BOX.map((_, i) => i * 0.5), tempo: 120 }] }),
      read("In tab", ["Play from the lowest note up. On each string play the two notes shown, using alternate picking:"], { fig: { tab: { cols: UP, cw: 26, names: ["A", "C", "D", "E", "G", "A", "C", "D", "E", "G", "A", "C"] } } }),
      practice("Play the scale up and down at 60 BPM with strict alternate picking. Say the note names as you play. Always start and finish on A so your ear hears where home is.", { needs: "guitar" }),
      quiz(
        ask("How many notes does a pentatonic scale have per octave?", ["5", "7", "12", "8"], 0),
        ask("What are the notes of A minor pentatonic?", ["A C D E G", "A B C D E F G", "A C E", "A B D E F♯"], 0),
        ask("Box 1 of A minor pentatonic starts at which fret?", ["5", "1", "3", "12"], 0),
        ask("Which note is the lowest in box 1?", ["A (low E string, fret 5)", "E (low E string open)", "C (A string)", "G (low E string, fret 3)"], 0),
      ),
    ),
    lesson(
      "G9.2",
      "Roots and playing it",
      7,
      read("Find home", [
        "The <b>root</b> is the note the scale is named after: here, A. It sounds like home. In box 1 the A notes are on the <b>low E string, fret 5</b>, the <b>D string, fret 7</b> and the <b>high e string, fret 5</b>. When you improvise, end phrases on a root and it will sound finished.",
        "A simple way to start soloing: play a 12-bar blues or a chord loop on Am, and move around the box using steps and skips; repeat a short idea (a lick) twice, then change the last note.",
      ], { fig: { neck: { range: [4, 9], dots: [[0, 5], [2, 7], [5, 5]] }, cap: "The three roots in box 1." }, hear: [{ l: "▶ Root notes", seq: [57, 69, 81], onsets: [0, 1, 2], tempo: 100 }] }),
      practice("Make up your own phrases in box 1: four notes, then repeat them and end on a root. Do this ten times. Finish each phrase on a different root (low E, D string, high e).", { needs: "guitar" }),
      quiz(
        ask("Which of these is a root of A minor pentatonic?", ["A", "C", "E", "G"], 0),
        ask("Where is a root on the D string in box 1?", ["Fret 7", "Fret 5", "Fret 8", "Fret 9"], 0, "D string fret 7 is A."),
        ask("Ending a phrase on the root makes it feel…", ["Finished, at home", "Unresolved", "Louder", "Out of tune"], 0),
        ask("To improvise over an Am chord loop you would use…", ["A minor pentatonic", "C♯ major", "The chromatic scale only", "Any random notes"], 0),
      ),
    ),
    lesson(
      "G9.3",
      "The blues note",
      6,
      read("Add one note", [
        "Add one note to the minor pentatonic and you have the <b>blues scale</b>: the <b>♭5</b>, which is E♭ in the key of A. Between D and E, it adds a “crying” colour: bend towards it, slide through it, or use it as a passing note. It is not a note to rest on, only to pass through.",
        "In box 1 the blue note is on the <b>A string at fret 6</b> (between D at 5 and E at 7) and on the <b>G string at fret 8</b> (above D at 7).",
      ], { fig: { neck: { range: [4, 9], dots: [[1, 5, "var(--ac)"], [1, 6, "var(--bad)"], [1, 7, "var(--ac)"], [3, 7, "var(--ac)"], [3, 8, "var(--bad)"]] }, cap: "The red notes are the blue notes (E♭)." } }),
      practice("Play A, C, D, E♭, E, G on the lower strings: low E fret 5, fret 8; A string fret 5, fret 6, fret 7; D string fret 5. Pass through the E♭ and listen to the colour.", { needs: "guitar" }),
      quiz(
        ask("The blues scale adds which note to the minor pentatonic?", ["The ♭5", "The 6th", "The 7th", "The major 3rd"], 0),
        ask("In A, what is the ♭5?", ["E♭", "E", "D", "B"], 0, "The fifth of A is E, so the ♭5 is E♭."),
        ask("How should the blue note be used?", ["As a passing note, not to rest on", "As the final note", "As the root", "Only in chords"], 0),
        ask("Which fret on the A string is the blue note in A box 1?", ["6", "5", "7", "8"], 0),
      ),
    ),
    lesson(
      "G9.4",
      "Moving the box: any key",
      7,
      read("Follow the root", [
        "Box 1’s pattern depends only on where its <b>root on the low E string</b> is. If your index finger starts on fret 5, you are playing A minor pentatonic; move everything up two frets and you are in B minor pentatonic; down two and you are in G minor pentatonic.",
        "To find the key, just name the note under your index finger on the low E string.",
      ], { fig: { table: { head: ["Index finger on low E fret", "1", "3", "5", "7", "8", "10", "12"], rows: [["Key (minor pentatonic)", "F", "G", "A", "B", "C", "D", "E"]] } } }),
      read("The relative major", ["The same five notes also make a major pentatonic: A minor pentatonic = <b>C major pentatonic</b>. Use the same box, but treat C as home (the C on low E fret 8, A string fret 3...). A song in C major will sound good with A minor pentatonic, and the other way around."]),
      quiz(
        ask("Index finger on low E fret 7. Which minor pentatonic is this?", ["B minor", "A minor", "C minor", "D minor"], 0),
        ask("Index finger on low E fret 3. Which minor pentatonic?", ["G minor", "F minor", "A minor", "E minor"], 0),
        ask("Index finger on low E fret 10 gives…", ["D minor pentatonic", "C minor pentatonic", "E minor pentatonic", "B minor pentatonic"], 0),
        ask("Which major pentatonic uses the same notes as A minor pentatonic?", ["C major pentatonic", "A major pentatonic", "G major pentatonic", "E major pentatonic"], 0),
      ),
    ),
  ],
);
