/* Guitar 2: Notes on the neck. */
import { ask, card, course, lesson, practice, quiz, read } from "../dsl.js";

const string = (s, frets) => frets.map((f) => [s, f]);
const NECK = (dots, range = [1, 12], cap) => ({ neck: { range, dots }, ...(cap ? { cap } : {}) });
// written pitches (what the app plays): low E string = 52
const SEQ = (s, frets) => frets.map((f) => [52, 57, 62, 67, 71, 76][s] + f);
const RUN = (s, frets) => ({ l: "▶ Hear it", seq: SEQ(s, frets), onsets: frets.map((_, i) => i), tempo: 110 });

export const G2 = course(
  "G2",
  "Notes on the neck",
  "Where every note lives on the fretboard: strings, frets, naturals, sharps and flats, octaves.",
  [
    lesson(
      "G2.1",
      "Frets are half steps",
      6,
      read("One fret, one half step", [
        "Each fret you move up raises the pitch by one <b>half step</b> (a semitone): the smallest step in Western music. Twelve frets later you reach the same note name an <b>octave</b> higher. That is why the 12th fret has two dots.",
        "Start on the thickest string. Open, it is E. Fret 1 is F. Fret 2 is F♯. Fret 3 is G. There is no black key between E and F, and none between B and C, so those pairs are only one fret apart. Every other pair of natural notes is two frets apart.",
      ], { fig: NECK(string(0, [0, 1, 2, 3, 4, 5]), [1, 5], "Low E string: E, F, F♯, G, G♯, A."), hear: [RUN(0, [0, 1, 2, 3, 4, 5])] }),
      practice("On the low E string, play open, 1, 2, 3, 4, 5, one finger per fret, saying the names as you go: E, F, F♯, G, G♯, A.", { needs: "guitar", fig: { tab: { cols: string(0, [0, 1, 2, 3, 4, 5]).map((x) => [x]), names: ["E", "F", "F♯", "G", "G♯", "A"] } } }),
      quiz(
        ask("One fret up raises the pitch by…", ["A half step", "A whole step", "An octave", "A third"], 0),
        ask("Which fret gives the same note name as the open string, an octave higher?", ["12", "7", "5", "10"], 0),
        ask("On the low E string, what is fret 1?", ["F", "F♯", "E♭", "G"], 0, "E to F is only a half step.", NECK([[0, 1]], [1, 5])),
        card("fretNote:0.1"),
        card("fretNote:0.3"),
        card("fretNote:0.5"),
      ),
    ),
    lesson(
      "G2.2",
      "The low E and A strings",
      6,
      read("Natural notes on the low E string", [
        "The natural notes (no sharps or flats) on the thick E string are: <b>E</b> (open), <b>F</b> (1), <b>G</b> (3), <b>A</b> (5), <b>B</b> (7), <b>C</b> (8), <b>D</b> (10), <b>E</b> (12). The gaps are 1 – 2 – 2 – 2 – 1 – 2 – 2 frets: one fret for E–F and B–C, two frets everywhere else.",
      ], { fig: NECK(string(0, [0, 1, 3, 5, 7, 8, 10, 12]), [1, 12]), hear: [RUN(0, [0, 1, 3, 5, 7, 8, 10, 12])] }),
      read("…and on the A string", [
        "The A string follows the same pattern, starting at A: <b>A</b> (open), <b>B</b> (2), <b>C</b> (3), <b>D</b> (5), <b>E</b> (7), <b>F</b> (8), <b>G</b> (10), <b>A</b> (12). Notice the notes of the 5th fret and the 7th fret: A string 5th fret is D, which is the next open string up.",
        "The notes you play on the low E and A strings are the roots of most chords in the first couple of years of playing, so these two strings are worth learning thoroughly.",
      ], { fig: NECK(string(1, [0, 2, 3, 5, 7, 8, 10, 12]), [1, 12]), hear: [RUN(1, [0, 2, 3, 5, 7, 8, 10, 12])] }),
      quiz(
        card("fretNote:0.7"),
        card("fretNote:0.8"),
        card("fretNote:0.10"),
        card("fretNote:1.2"),
        card("fretNote:1.3"),
        card("fretNote:1.7"),
        ask("Which fret on the A string is the note C?", ["3", "2", "5", "1"], 0, "A (0) – B (2) – C (3).", NECK([[1, 3]], [1, 5])),
      ),
    ),
    lesson(
      "G2.3",
      "The D and G strings",
      6,
      read("The D string", [
        "<b>D</b> (open), <b>E</b> (2), <b>F</b> (3), <b>G</b> (5), <b>A</b> (7), <b>B</b> (9), <b>C</b> (10), <b>D</b> (12). The same pattern again: two frets between most notes, one fret for E–F and B–C.",
      ], { fig: NECK(string(2, [0, 2, 3, 5, 7, 9, 10, 12]), [1, 12]), hear: [RUN(2, [0, 2, 3, 5, 7, 9, 10, 12])] }),
      read("The G string", [
        "<b>G</b> (open), <b>A</b> (2), <b>B</b> (4), <b>C</b> (5), <b>D</b> (7), <b>E</b> (9), <b>F</b> (10), <b>G</b> (12). It is the same pattern as the D string, just starting from G.",
        "Watch the E–F and B–C pairs: they give you the one-fret steps. On the D string they are at frets 2–3 and 9–10; on the G string, B–C is at 4–5 and E–F is at 9–10.",
      ], { fig: NECK(string(3, [0, 2, 4, 5, 7, 9, 10, 12]), [1, 12]), hear: [RUN(3, [0, 2, 4, 5, 7, 9, 10, 12])] }),
      practice("Play up the D string from open to the 7th fret, naming the natural notes (D E F G A), then the G string (G A B C D). Look for the one-fret steps between E–F and B–C.", { needs: "guitar" }),
      quiz(
        card("fretNote:2.2"),
        card("fretNote:2.5"),
        card("fretNote:2.7"),
        card("fretNote:3.2"),
        card("fretNote:3.4"),
        card("fretNote:3.5"),
        ask("On the G string, which fret is C?", ["5", "3", "4", "7"], 0, "G (0) – A (2) – B (4) – C (5).", NECK([[3, 5]], [1, 7])),
      ),
    ),
    lesson(
      "G2.4",
      "The B and high E strings",
      6,
      read("The B string", [
        "<b>B</b> (open), <b>C</b> (1), <b>D</b> (3), <b>E</b> (5), <b>F</b> (6), <b>G</b> (8), <b>A</b> (10), <b>B</b> (12). B and C are the first pair, so C is right next to the nut at fret 1.",
      ], { fig: NECK(string(4, [0, 1, 3, 5, 6, 8, 10, 12]), [1, 12]), hear: [RUN(4, [0, 1, 3, 5, 6, 8, 10, 12])] }),
      read("The high E string", [
        "The thinnest string is also E, so it has exactly the same notes as the thick E string: <b>E</b> (open), <b>F</b> (1), <b>G</b> (3), <b>A</b> (5), <b>B</b> (7), <b>C</b> (8), <b>D</b> (10), <b>E</b> (12). The only difference is that it sounds two octaves higher.",
      ], { fig: NECK(string(5, [0, 1, 3, 5, 7, 8, 10, 12]), [1, 12]), hear: [RUN(5, [0, 1, 3, 5, 7, 8, 10, 12])] }),
      quiz(
        card("fretNote:4.1"),
        card("fretNote:4.3"),
        card("fretNote:4.5"),
        card("fretNote:4.6"),
        card("fretNote:5.1"),
        card("fretNote:5.3"),
        ask("The high E string has the same note pattern as…", ["The low E string", "The A string", "The G string", "The B string"], 0),
      ),
    ),
    lesson(
      "G2.5",
      "First position map",
      6,
      read("The first four frets", [
        "Most beginner music stays near the nut, in <b>first position</b> (frets 0–4). Here are all the natural notes you can reach there. Learn them as shapes: every string looks the same, except that the G–B pair is one fret closer.",
      ], { fig: { table: { head: ["String", "Open", "Fret 1", "Fret 2", "Fret 3", "Fret 4"], rows: [["6th E", "E", "F", "–", "G", "–"], ["5th A", "A", "–", "B", "C", "–"], ["4th D", "D", "–", "E", "F", "–"], ["3rd G", "G", "–", "A", "–", "B"], ["2nd B", "B", "C", "–", "D", "–"], ["1st e", "E", "F", "–", "G", "–"]] }, cap: "A dash is a sharp or flat in between." } }),
      read("Tricks to remember it", [
        "• Both E strings and the B string start on a one-fret step: E–F on the E strings, B–C on the B string.<br>• The <b>4th fret of the G string</b> is the same pitch as the open B string.<br>• <b>Fret 5 of any string</b> is the same pitch as the next open string up (except on the G string, where it is fret 4).",
      ]),
      practice("Go string by string, open to fret 3, and play only the natural notes. Say each note as you play it. Try to do it with your eyes on the neck, not on the chart.", { needs: "guitar" }),
      quiz(
        card("fretNote:0.3"),
        card("fretNote:1.2"),
        card("fretNote:2.3"),
        card("fretNote:3.2"),
        card("fretNote:4.1"),
        card("fretNote:5.1"),
        ask("Fret 5 of the low E string matches which open string?", ["A", "D", "G", "B"], 0, "Fret 5 of any string except the G string is the open note of the next string up. Low E fret 5 = A."),
        ask("Fret 4 of the G string matches which open string?", ["B", "D", "A", "E"], 0, "The G to B gap is a major third, one fret smaller than the others."),
      ),
    ),
    lesson(
      "G2.6",
      "One note, many places: octaves",
      6,
      read("Octave shapes", [
        "The same note name appears in many places. A very handy pattern: to find the <b>note one octave higher</b>, move two strings toward the floor (thinner strings) and:<br>• from the 6th string to the 4th string: <b>+2 frets</b>;<br>• from the 5th string to the 3rd string: <b>+2 frets</b>;<br>• from the 4th string to the 2nd string: <b>+3 frets</b>;<br>• from the 3rd string to the 1st string: <b>+3 frets</b>.",
        "The extra fret in the last two comes from the G–B gap. Example: G is at fret 3 of the low E string. One octave higher is the D string, fret 5.",
      ], { fig: NECK([[0, 3], [2, 5]], [1, 7], "Same note, an octave apart: low E fret 3 and D string fret 5 (both G)."), hear: [{ l: "▶ G, then G an octave up", seq: [55, 67], onsets: [0, 1.2], tempo: 60 }] }),
      read("Why bother?", [
        "Octave shapes let you jump quickly to the same note in a better spot, say to avoid shifting your hand mid-song. They are also the shape of the classic “octave” riffs and a good way to check your fretboard knowledge.",
      ]),
      quiz(
        ask("Low E string fret 5 is A. Where is the A an octave higher, on the D string?", ["Fret 7", "Fret 5", "Fret 8", "Fret 3"], 0, "6th to 4th string is +2 frets.", NECK([[0, 5]], [1, 9])),
        ask("D string fret 2 is E. Where is the E an octave higher on the B string?", ["Fret 5", "Fret 4", "Fret 3", "Fret 2"], 0, "4th to 2nd string is +3 frets."),
        ask("A string fret 3 is C. Where is the C an octave higher on the G string?", ["Fret 5", "Fret 6", "Fret 3", "Fret 4"], 0, "5th to 3rd string is +2 frets."),
        ask("G string fret 4 is B. Where is the B an octave higher on the high E string?", ["Fret 7", "Fret 6", "Fret 5", "Fret 8"], 0, "3rd to 1st string is +3 frets."),
        card("findFret:7.0"),
        card("findFret:9.2"),
      ),
    ),
    lesson(
      "G2.7",
      "Sharps and flats on the neck",
      6,
      read("The frets in between", [
        "Any fret that is not a natural note is a sharp or a flat. Between each pair of two-fret-apart naturals lies one note that can be called either, for example fret 2 of the low E string, between F and G, is <b>F♯ or G♭</b>.",
        "Which name is right depends on the key of the music. Sharps are named from the lower note (F♯ is F raised), flats from the higher one (G♭ is G lowered). For now, always learn both names.",
      ], { fig: NECK([[0, 2], [0, 4], [0, 6], [1, 1], [1, 4], [1, 6]], [1, 7], "Low E string frets 2, 4, 6 and A string frets 1, 4, 6: F♯/G♭, G♯/A♭, A♯/B♭ and A♯/B♭, C♯/D♭, D♯/E♭.") }),
      read("Same pitch across strings", [
        "The 6th fret of the low E string (A♯/B♭) is the same pitch as fret 1 of the A string. Fret 5 of the E string is the open A. These overlaps are what the fifth-fret tuning method uses: press the 5th fret of a string and match it to the next open string.",
      ]),
      quiz(
        card("fretNote:0.2"),
        card("fretNote:1.1"),
        card("fretNote:2.4"),
        card("fretNote:3.1"),
        card("fretNote:4.2"),
        ask("Fret 4 of the low E string is…", ["G♯/A♭", "A", "G", "F♯/G♭"], 0, "Fret 3 is G, so fret 4 is G♯.", NECK([[0, 4]], [1, 6])),
        ask("Which two names can the same fret have?", ["A sharp name and a flat name", "A major and minor name", "A high and low name", "Two different pitches"], 0),
      ),
    ),
    lesson(
      "G2.8",
      "Staff to fret",
      7,
      read("Reading and finding", [
        "Reading music on the guitar means finding the right place on the neck. For the open strings and the first few frets this gets quick with practice. Look at the note on the staff, name it, then find a place for it on the neck.",
        "When there are several places, pick one near where your hand already is. Low notes sit below the staff on ledger lines: the low E string is written E3, the A string A3.",
      ], { fig: { staff: ["E3", "F3", "G3", "A3", "B3", "C4"], names: true, cap: "The first notes of the low E and A strings, written." } }),
      quiz(
        card("staffFret:52"),
        card("staffFret:53"),
        card("staffFret:55"),
        card("staffFret:57"),
        card("staffFret:59"),
        card("staffFret:60"),
        card("staffFret:62"),
        card("staffFret:64"),
      ),
    ),
  ],
  { gen: (n) => Array.from({ length: n }, () => ({ card: "fretNote:" + ((Math.random() * 5) | 0) + "." + (1 + ((Math.random() * 12) | 0)) })) },
);
