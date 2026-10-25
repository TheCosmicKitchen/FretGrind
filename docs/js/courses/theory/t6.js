/* Theory 6: Keys and transposing. */
import { ask, course, lesson, quiz, read } from "../dsl.js";

const SEMI = ["C", "C♯", "D", "E♭", "E", "F", "F♯", "G", "A♭", "A", "B♭", "B"];
const MAJOR_CHORDS = {
  C: ["C", "Dm", "Em", "F", "G", "Am"],
  G: ["G", "Am", "Bm", "C", "D", "Em"],
  D: ["D", "Em", "F♯m", "G", "A", "Bm"],
  A: ["A", "Bm", "C♯m", "D", "E", "F♯m"],
  E: ["E", "F♯m", "G♯m", "A", "B", "C♯m"],
  F: ["F", "Gm", "Am", "B♭", "C", "Dm"],
};

export const T6 = course(
  "T6",
  "Keys and transposing",
  "What a key is, finding the key of a song, moving a progression, transposing instruments and the Nashville number system.",
  [
    lesson(
      "T6.1",
      "What is a key?",
      5,
      read("A home note", [
        "A <b>key</b> is the group of notes and chords a piece mostly uses, centred on one home note, the <b>tonic</b>. A song “in the key of G major” uses the notes of the G major scale, and G is where it feels at rest.",
        "The key signature (the sharps or flats at the start) tells you which scale the music is in, and the tonic is usually the note the tune ends on. Because every major scale has the same pattern, a tune can be played in any key and it is still the same tune: just higher or lower.",
      ], { hear: [{ l: "▶ Twinkle in C", seq: [60, 60, 67, 67, 69, 69, 67], onsets: [0, 1, 2, 3, 4, 5, 6], tempo: 140 }, { l: "▶ Twinkle in G", seq: [67, 67, 74, 74, 76, 76, 74], onsets: [0, 1, 2, 3, 4, 5, 6], tempo: 140 }] }),
      quiz(
        ask("The tonic of a key is…", ["The home note", "The loudest note", "The highest note", "The fifth note"], 0),
        ask("A song ‘in the key of D major’ mostly uses…", ["The notes of the D major scale", "Only D", "Only D chords", "Only black keys"], 0),
        ask("The same tune in two different keys is…", ["The same tune, higher or lower", "Two different tunes", "Always in minor", "Impossible"], 0),
        ask("Where is the key signature written?", ["At the start of each staff line", "In the title only", "At the end", "Over each bar"], 0),
      ),
    ),
    lesson(
      "T6.2",
      "Finding the key from the chords",
      7,
      read("Which family do they belong to?", [
        "To find a song’s key, look at its chords and ask <b>which key’s chord family they all fit in</b>. The chords of a major key are I ii iii IV V vi. If you see G, C and D, they are the I, IV and V of G major. Add Em: the vi of G.",
        "A good clue: the first and the last chord of a song are very often the <b>tonic</b>. If a song begins and ends on Am it is probably in A minor (or its relative, C major, if it fits the C chord family).",
      ], { fig: { table: { head: ["Key", "I", "ii", "iii", "IV", "V", "vi"], rows: Object.entries(MAJOR_CHORDS).map(([k, c]) => [k, ...c]) } } }),
      quiz(
        ask("G, C and D are the chords of which key?", ["G major", "C major", "D major", "A major"], 0),
        ask("D, G, A and Bm fit which key?", ["D major", "G major", "A major", "E major"], 0),
        ask("C, F, G and Am fit which key?", ["C major", "F major", "G major", "A major"], 0),
        ask("A, D, E and F♯m fit which key?", ["A major", "D major", "E major", "B major"], 0),
        ask("The first and last chord of a song are often…", ["The tonic", "The dominant", "The leading tone", "The subdominant"], 0),
        ask("A song uses Em, Am, D and G. The key that fits is probably…", ["G major (or E minor)", "C major only", "D major only", "A major"], 0, "Em, Am, D and G are vi, ii, V and I of G major."),
      ),
    ),
    lesson(
      "T6.3",
      "Transposing",
      7,
      read("Move everything by the same interval", [
        "To <b>transpose</b> is to move music into another key. Shift <b>every note and chord by the same interval</b>. Use scale degrees: a song in C with chords <b>C – F – G</b> (I – IV – V) becomes <b>G – C – D</b> in G, and <b>D – G – A</b> in D.",
        "Method: 1) write the progression as Roman numerals in the old key; 2) write out the chords of the new key; 3) swap numeral for numeral. Singers often ask to transpose a song to suit their voice.",
      ], { fig: { table: { head: ["Numeral", "I", "IV", "V"], rows: [["C", "C", "F", "G"], ["G", "G", "C", "D"], ["D", "D", "G", "A"], ["A", "A", "D", "E"], ["E", "E", "A", "B"]] } } }),
      quiz(
        ask("Transpose C – F – G into the key of A.", ["A – D – E", "A – E – D", "A – C – G", "A – D – G"], 0),
        ask("Transpose G – Em – C – D into the key of D. (I – vi – IV – V)", ["D – Bm – G – A", "D – Em – G – A", "D – Bm – A – G", "D – F♯m – G – A"], 0),
        ask("Transpose C – Am – F – G into the key of G.", ["G – Em – C – D", "G – Am – C – D", "G – Em – D – C", "G – Bm – C – D"], 0),
        ask("When you transpose, you move every note by…", ["The same interval", "A different interval each time", "One octave", "Nothing"], 0),
        ask("What is the first step of transposing by numerals?", ["Write the chords as Roman numerals", "Change the tempo", "Choose a new time signature", "Lower the volume"], 0),
      ),
    ),
    lesson(
      "T6.4",
      "Transposing by half steps",
      7,
      read("Counting semitones", [
        "When the new key is a certain number of half steps away, <b>move every chord root up (or down) by that many half steps</b>. Up 2 half steps: C → D, F → G, G → A, Am → Bm. Up 5 half steps: C → F, G → C, D → G.",
        "The twelve roots in order: <b>C, C♯, D, E♭, E, F, F♯, G, A♭, A, B♭, B</b>. Count along the list: going up 7 from C lands on G.",
      ], { fig: { table: { head: ["+ half steps", "0", "1", "2", "3", "4", "5", "6", "7"], rows: [["From C", ...SEMI.slice(0, 8)]] } } }),
      quiz(
        ask("Move C – F – G up 2 half steps.", ["D – G – A", "E – A – B", "D – F – A", "C – E – G"], 0),
        ask("Move G up 5 half steps.", ["C", "D", "A", "F"], 0),
        ask("Move D up 7 half steps.", ["A", "G", "E", "B"], 0),
        ask("Move A down 2 half steps.", ["G", "B", "F♯", "F"], 0),
        ask("Move E up 3 half steps.", ["G", "F♯", "A", "F"], 0),
        ask("Move Am up 3 half steps.", ["Cm", "Bm", "Dm", "Em"], 0),
      ),
    ),
    lesson(
      "T6.5",
      "Transposing instruments",
      8,
      read("Written pitch vs concert pitch", [
        "Some instruments are <b>transposing instruments</b>: the note they read is not the note you hear. <b>Concert pitch</b> is what actually sounds (a piano in C is the reference). A <b>B♭ trumpet or clarinet</b> reading a written <b>C</b> sounds <b>B♭</b>, a major 2nd lower. An <b>E♭ alto saxophone</b> reading C sounds <b>E♭</b>, a major 6th lower. A <b>horn in F</b> reading C sounds <b>F</b>, a perfect 5th lower. Guitar is also a (mild) transposing instrument: its music is written an octave above where it sounds.",
        "Why? So that players can switch between family members (clarinet in B♭ and A, saxes) and use the same fingerings. The cost: to play together in a concert key, each part must be transposed. A song in concert C needs a B♭ trumpet to <b>read in D</b> (up a whole step), and an E♭ alto sax to read in <b>A</b> (up a major 6th).",
      ], { fig: { table: { head: ["Instrument", "Written C sounds as", "Interval below"], rows: [["B♭ trumpet / clarinet", "B♭", "Major 2nd"], ["E♭ alto sax", "E♭", "Major 6th"], ["F horn", "F", "Perfect 5th"], ["Guitar (octave)", "C an octave lower", "Octave"]] } }, hear: [{ l: "▶ Written C", snd: [72] }, { l: "▶ B♭ trumpet sounds", snd: [70] }] }),
      quiz(
        ask("A B♭ trumpet reads a written C. What sounds?", ["B♭", "D", "C", "A"], 0),
        ask("A song is in concert C. A B♭ trumpet player should read in…", ["D", "B♭", "C", "A"], 0, "Written pitch is a whole step higher than concert."),
        ask("An E♭ alto sax reads a written C. What sounds?", ["E♭", "E", "A", "F"], 0),
        ask("A horn in F reads a written C. What sounds?", ["F", "G", "E", "A"], 0),
        ask("Concert pitch means…", ["The pitch that actually sounds", "The written pitch", "A pitch of 440 Hz only", "The loudest pitch"], 0),
        ask("Why do transposing instruments exist?", ["Players of one family can share fingerings", "To make music harder", "They have no written music", "To tune the audience"], 0),
        ask("Guitar music is written…", ["An octave above where it sounds", "Exactly as it sounds", "A fifth above", "A tone below"], 0),
      ),
    ),
    lesson(
      "T6.6",
      "The Nashville number system",
      6,
      read("Chords as numbers", [
        "Session musicians in Nashville write chords as <b>numbers</b> instead of letters: a <b>1</b> chord is the tonic, <b>4</b> is the subdominant, <b>5</b> the dominant, <b>6m</b> is the relative minor. A song written as <b>1 – 4 – 5 – 1</b> can be played in any key the singer needs.",
        "It is the same idea as Roman numerals, easier to type. In G: 1 = G, 4 = C, 5 = D. In D: 1 = D, 4 = G, 5 = A. Learn the chords of a few common keys and you can read a Nashville chart on sight.",
      ], { fig: { table: { head: ["Number", "1", "2m", "3m", "4", "5", "6m"], rows: [["Key of C", "C", "Dm", "Em", "F", "G", "Am"], ["Key of G", "G", "Am", "Bm", "C", "D", "Em"], ["Key of D", "D", "Em", "F♯m", "G", "A", "Bm"]] } } }),
      quiz(
        ask("In the Nashville system, the ‘4’ chord in the key of G is…", ["C", "D", "Em", "A"], 0),
        ask("In the key of D, the ‘5’ chord is…", ["A", "G", "Bm", "E"], 0),
        ask("In the key of C, the ‘6m’ chord is…", ["Am", "Dm", "Em", "F"], 0),
        ask("1 – 5 – 6m – 4 in the key of E is…", ["E – B – C♯m – A", "E – A – B – C♯m", "E – B – F♯m – A", "E – D – A – B"], 0),
        ask("Why do musicians like numbers instead of chord letters?", ["The song can be played in any key", "Numbers are louder", "They are required for blues", "Letters are banned"], 0),
      ),
    ),
  ],
  {
    gen: (n) =>
      Array.from({ length: n }, () => {
        const keys = Object.keys(MAJOR_CHORDS),
          k = keys[(Math.random() * keys.length) | 0],
          d = (Math.random() * 6) | 0,
          names = ["I", "ii", "iii", "IV", "V", "vi"],
          wrong = MAJOR_CHORDS[k].filter((_, i) => i !== d).sort(() => Math.random() - 0.5).slice(0, 3);
        return { p: `In the key of ${k} major, which chord is ${names[d]}?`, a: [MAJOR_CHORDS[k][d], ...wrong], c: 0 };
      }),
  },
);
