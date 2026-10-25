/* Theory 4: Intervals. */
import { ask, course, lesson, quiz, read } from "../dsl.js";

const IV = [
  ["a minor 2nd", 1], ["a major 2nd", 2], ["a minor 3rd", 3], ["a major 3rd", 4], ["a perfect 4th", 5], ["a tritone", 6], ["a perfect 5th", 7], ["a minor 6th", 8], ["a major 6th", 9], ["a minor 7th", 10], ["a major 7th", 11], ["an octave", 12],
];
const two = (a, b, tempo = 70) => ({ seq: [a, b], onsets: [0, 1], tempo });

export const T4 = course(
  "T4",
  "Intervals",
  "The distance between two notes: counting, quality, semitones, the tritone and hearing intervals.",
  [
    lesson(
      "T4.1",
      "What is an interval?",
      5,
      read("Counting letters", [
        "An <b>interval</b> is the distance between two notes. It is named with a number, found by counting letter names <b>including both notes</b>: C to E is C-D-E, so a <b>3rd</b>. C to G is C-D-E-F-G: a <b>5th</b>. The same note twice is a <b>unison</b> (1st), and the next note with the same name is an <b>octave</b> (8th).",
        "Played one after the other the interval is <b>melodic</b>; played together it is <b>harmonic</b>. Intervals are the building blocks of melodies and chords.",
      ], { fig: { staff: { notes: ["C4", "E4"], stack: true, names: ["C + E = 3rd"] } }, hear: [{ l: "▶ Together", snd: [60, 64], gap: 0 }, { l: "▶ One after the other", ...two(60, 64) }] }),
      quiz(
        ask("C up to E is a…", ["3rd", "2nd", "4th", "5th"], 0, "C-D-E: three letter names."),
        ask("C up to G is a…", ["5th", "4th", "6th", "3rd"], 0),
        ask("D up to A is a…", ["5th", "4th", "6th", "3rd"], 0, "D-E-F-G-A."),
        ask("E up to the next E is a…", ["Octave", "Unison", "7th", "5th"], 0),
        ask("Two notes played at the same time form a…", ["Harmonic interval", "Melodic interval", "Scale", "Key"], 0),
        ask("A to C is a…", ["3rd", "2nd", "4th", "5th"], 0),
      ),
    ),
    lesson(
      "T4.2",
      "Perfect intervals",
      6,
      read("Unison, 4th, 5th, octave", [
        "The unison, 4th, 5th and octave are called <b>perfect</b> intervals (P1, P4, P5, P8). They sound very stable and open, and they are the same in major and minor. Measured in half steps: P4 = <b>5</b> half steps, P5 = <b>7</b>, octave = <b>12</b>.",
        "Examples from C: C–F is a perfect 4th (5 half steps), C–G is a perfect 5th (7 half steps). A power chord is just a root and a perfect 5th.",
      ], { fig: { table: { head: ["Interval", "Half steps", "From C"], rows: [["Perfect 4th", "5", "C–F"], ["Perfect 5th", "7", "C–G"], ["Octave", "12", "C–C"]] } }, hear: [{ l: "▶ Perfect 4th", ...two(60, 65) }, { l: "▶ Perfect 5th", ...two(60, 67) }, { l: "▶ Octave", ...two(60, 72) }] }),
      quiz(
        ask("How many half steps in a perfect 5th?", ["7", "5", "6", "8"], 0),
        ask("How many half steps in a perfect 4th?", ["5", "4", "7", "6"], 0),
        ask("C to G is a…", ["Perfect 5th", "Perfect 4th", "Major 3rd", "Major 6th"], 0),
        ask("C to F is a…", ["Perfect 4th", "Perfect 5th", "Major 2nd", "Minor 3rd"], 0),
        ask("A power chord is a root plus a…", ["Perfect 5th", "Major 3rd", "Minor 7th", "Perfect 4th"], 0),
        ask("Which of these is NOT a perfect interval?", ["Major 3rd", "Perfect 5th", "Octave", "Perfect 4th"], 0),
        ask("Listen. What interval is this?", ["Perfect 5th", "Perfect 4th", "Octave", "Major 3rd"], 0, "", null, two(60, 67)),
      ),
    ),
    lesson(
      "T4.3",
      "Major intervals",
      6,
      read("From the tonic of a major scale", [
        "The 2nd, 3rd, 6th and 7th above the tonic of a <b>major scale</b> are <b>major</b> intervals: major 2nd (2 half steps), major 3rd (4), major 6th (9), major 7th (11). From C: C–D, C–E, C–A, C–B.",
        "The major 3rd is the interval that makes a chord sound happy. Stack a major 3rd with the 5th above the root and you have a major chord.",
      ], { fig: { table: { head: ["Interval", "Half steps", "From C"], rows: [["Major 2nd", "2", "C–D"], ["Major 3rd", "4", "C–E"], ["Major 6th", "9", "C–A"], ["Major 7th", "11", "C–B"]] } }, hear: [{ l: "▶ M2", ...two(60, 62) }, { l: "▶ M3", ...two(60, 64) }, { l: "▶ M6", ...two(60, 69) }, { l: "▶ M7", ...two(60, 71) }] }),
      quiz(
        ask("C to E is a…", ["Major 3rd", "Minor 3rd", "Perfect 4th", "Major 2nd"], 0),
        ask("C to B is a…", ["Major 7th", "Minor 7th", "Major 6th", "Octave"], 0),
        ask("How many half steps in a major 3rd?", ["4", "3", "5", "2"], 0),
        ask("How many half steps in a major 6th?", ["9", "8", "10", "7"], 0),
        ask("C to A is a…", ["Major 6th", "Minor 6th", "Perfect 5th", "Major 7th"], 0),
        ask("G to B is a…", ["Major 3rd", "Minor 3rd", "Perfect 4th", "Major 2nd"], 0, "G up to B: 4 half steps."),
      ),
    ),
    lesson(
      "T4.4",
      "Minor intervals",
      6,
      read("One half step smaller", [
        "A <b>minor</b> interval is one half step smaller than the matching major one: <b>minor 2nd</b> (1 half step), <b>minor 3rd</b> (3), <b>minor 6th</b> (8) and <b>minor 7th</b> (10). From C: C–D♭, C–E♭, C–A♭, C–B♭.",
        "A minor 3rd on the bottom of a chord (root up to the third) gives a minor chord. The difference between a happy and a sad chord is one half step.",
      ], { fig: { table: { head: ["Interval", "Half steps", "From C"], rows: [["Minor 2nd", "1", "C–D♭"], ["Minor 3rd", "3", "C–E♭"], ["Minor 6th", "8", "C–A♭"], ["Minor 7th", "10", "C–B♭"]] } }, hear: [{ l: "▶ m2", ...two(60, 61) }, { l: "▶ m3", ...two(60, 63) }, { l: "▶ m6", ...two(60, 68) }, { l: "▶ m7", ...two(60, 70) }] }),
      quiz(
        ask("C to E♭ is a…", ["Minor 3rd", "Major 3rd", "Perfect 4th", "Minor 2nd"], 0),
        ask("C to B♭ is a…", ["Minor 7th", "Major 7th", "Minor 6th", "Major 6th"], 0),
        ask("A minor 3rd is how many half steps?", ["3", "4", "2", "5"], 0),
        ask("A minor 2nd is how many half steps?", ["1", "2", "3", "0"], 0),
        ask("A to C is a…", ["Minor 3rd", "Major 3rd", "Perfect 4th", "Major 2nd"], 0),
        ask("What is the relationship between a minor interval and the matching major one?", ["One half step smaller", "One whole step smaller", "One half step larger", "No relationship"], 0),
        ask("Listen. Is this interval a major 3rd or a minor 3rd?", ["Minor 3rd", "Major 3rd", "Perfect 5th", "Octave"], 0, "", null, two(60, 63)),
      ),
    ),
    lesson(
      "T4.5",
      "Half steps cheat sheet",
      5,
      read("Twelve sizes", [
        "Every interval up to an octave is a certain number of half steps. Learn them in this order, the first one is the smallest.",
      ], { fig: { table: { head: ["Half steps", "Interval", "From C"], rows: [["1", "Minor 2nd", "C♯/D♭"], ["2", "Major 2nd", "D"], ["3", "Minor 3rd", "E♭"], ["4", "Major 3rd", "E"], ["5", "Perfect 4th", "F"], ["6", "Tritone", "F♯/G♭"], ["7", "Perfect 5th", "G"], ["8", "Minor 6th", "A♭"], ["9", "Major 6th", "A"], ["10", "Minor 7th", "B♭"], ["11", "Major 7th", "B"], ["12", "Octave", "C"]] } } }),
      quiz(
        ask("7 half steps is…", ["Perfect 5th", "Perfect 4th", "Major 6th", "Minor 7th"], 0),
        ask("4 half steps is…", ["Major 3rd", "Minor 3rd", "Perfect 4th", "Major 2nd"], 0),
        ask("9 half steps is…", ["Major 6th", "Minor 6th", "Minor 7th", "Perfect 5th"], 0),
        ask("10 half steps is…", ["Minor 7th", "Major 7th", "Major 6th", "Octave"], 0),
      ),
    ),
    lesson(
      "T4.6",
      "The tritone",
      5,
      read("The odd one out", [
        "Exactly in the middle of the octave, <b>6 half steps</b>, is the <b>tritone</b> (three whole tones). It is called an <b>augmented 4th</b> (C–F♯) or a <b>diminished 5th</b> (C–G♭): same sound, two spellings. It sounds tense and unresolved, and was nicknamed “the devil in music”.",
        "It matters because a <b>dominant seventh chord</b> contains one: in G7 (G B D F) the B and F are a tritone apart. That tension is exactly why G7 so strongly pulls back to C.",
      ], { hear: [{ l: "▶ Tritone", ...two(60, 66) }, { l: "▶ G7 chord", snd: [55, 59, 62, 65], gap: 0.04 }] }),
      quiz(
        ask("A tritone is how many half steps?", ["6", "5", "7", "4"], 0),
        ask("C to F♯ is a…", ["Tritone (augmented 4th)", "Perfect 5th", "Major 3rd", "Perfect 4th"], 0),
        ask("A tritone sounds…", ["Tense and unresolved", "Calm and stable", "Like an octave", "Like a unison"], 0),
        ask("Which chord type contains a tritone?", ["Dominant seventh", "Major triad", "Minor triad", "Power chord"], 0),
        ask("Listen. Which interval is this?", ["Tritone", "Perfect 5th", "Perfect 4th", "Major 3rd"], 0, "", null, two(60, 66)),
      ),
    ),
    lesson(
      "T4.7",
      "Hearing intervals",
      7,
      read("Songs as reference", [
        "To recognise an interval by ear, link each one to the start of a song you know. A few classics, all from old or traditional tunes:",
        "• <b>Minor 2nd up</b>: the opening notes of the Ode to Joy melody (E–E–F: the move from E to F)<br>• <b>Major 2nd up</b>: Frère Jacques (C–D)<br>• <b>Major 2nd down</b>: Mary Had a Little Lamb (E–D)<br>• <b>Minor 3rd up</b>: Greensleeves (A–C)<br>• <b>Major 3rd up</b>: When the Saints Go Marching In (C–E)<br>• <b>Perfect 4th up</b>: Here Comes the Bride (C–F)<br>• <b>Perfect 5th up</b>: Twinkle, Twinkle, Little Star (C–G)<br>• <b>Major 6th up</b>: My Bonnie Lies Over the Ocean (C–A)<br>• <b>Octave up</b>: Take Me Out to the Ball Game",
        "Press the buttons to hear each interval, then see if you can name them with no help.",
      ], { hear: [{ l: "m2", ...two(64, 65) }, { l: "M2", ...two(60, 62) }, { l: "m3", ...two(69, 72) }, { l: "M3", ...two(60, 64) }, { l: "P4", ...two(60, 65) }, { l: "P5", ...two(60, 67) }, { l: "M6", ...two(60, 69) }, { l: "Octave", ...two(60, 72) }] }),
      quiz(
        ask("Listen. Which interval?", ["Perfect 5th", "Perfect 4th", "Major 3rd", "Octave"], 0, "", null, two(62, 69)),
        ask("Listen. Which interval?", ["Major 3rd", "Minor 3rd", "Perfect 4th", "Major 2nd"], 0, "", null, two(65, 69)),
        ask("Listen. Which interval?", ["Octave", "Perfect 5th", "Major 7th", "Perfect 4th"], 0, "", null, two(57, 69)),
        ask("Listen. Which interval?", ["Minor 3rd", "Major 3rd", "Minor 2nd", "Perfect 4th"], 0, "", null, two(64, 67)),
        ask("Listen. Which interval?", ["Major 6th", "Minor 6th", "Perfect 5th", "Minor 7th"], 0, "", null, two(60, 69)),
        ask("Which song starts with a perfect 5th (C up to G)?", ["Twinkle, Twinkle, Little Star", "Frère Jacques", "Mary Had a Little Lamb", "Greensleeves"], 0),
      ),
    ),
  ],
  {
    gen: (n) =>
      Array.from({ length: n }, () => {
        const [what, st] = IV[(Math.random() * IV.length) | 0],
          near = [st - 2, st - 1, st + 1, st + 2].filter((x) => x >= 1 && x <= 12).sort(() => Math.random() - 0.5).slice(0, 3);
        return { p: `How many half steps in ${what}?`, a: [String(st), ...near.map(String)], c: 0 };
      }),
  },
);
