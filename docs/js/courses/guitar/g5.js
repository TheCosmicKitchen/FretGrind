/* Guitar 5: Playing melodies. */
import { ask, card, course, lesson, practice, quiz, read } from "../dsl.js";

const OPEN = [52, 57, 62, 67, 71, 76];
const cols = (list) => ({ tab: { cols: list.map((x) => [x]), cw: 30 } });
const hear = (list, tempo = 110, l = "▶ Hear it") => ({ l, seq: list.map(([s, f]) => OPEN[s] + f), onsets: list.map((_, i) => i), tempo });
// (string index, fret): 5 = high e, 4 = B
const E = [5, 0], F = [5, 1], G = [5, 3], D = [4, 3], C = [4, 1];
const ODE = [E, E, F, G, G, F, E, D, C, C, D, E, E, D, D];
const HCB = [E, D, C, E, D, C, C, C, C, C, D, D, D, D, E, D, C];
const MARY = [E, D, C, D, E, E, E, D, D, D, E, G, G, E, D, C, D, E, E, E, E, D, D, E, D, C];
const SCALE = [[1, 3], [2, 0], [2, 2], [2, 3], [3, 0], [3, 2], [4, 0], [4, 1]];

export const G5 = course(
  "G5",
  "Playing melodies",
  "Single-note tunes in tab and on the staff: picking, first-position scales and simple folk melodies.",
  [
    lesson(
      "G5.1",
      "Your first melody: Ode to Joy",
      7,
      read("A tune on two strings", [
        "A melody is a line of single notes. This famous theme from Beethoven’s Ninth Symphony uses only the two thinnest strings and the first three frets, which makes it perfect to start with.",
        "Read the tab left to right. The <b>top line is the high e string</b>, the second line is the B string. Use finger 1 for fret 1, finger 3 for fret 3. Pick each note with a downstroke at first.",
      ], { fig: cols(ODE), hear: [hear(ODE, 100)] }),
      read("Same tune on the staff", ["Here it is in standard notation. Each note matches one tab number: the first note is the open high E (top space), then F (first fret, top line), then G (fret 3, above the staff)."],
        { fig: { staff: ["E5", "E5", "F5", "G5", "G5", "F5", "E5", "D5", "C5", "C5", "D5", "E5", "E5", "D5", "D5"], names: true, gap: 34 } }),
      practice("Play the tune slowly (60–70 BPM, one note per beat). Aim for clean, even notes. Don’t speed up until it feels automatic.", { needs: "guitar", fig: cols(ODE) }),
      quiz(
        ask("Which string is the top line of tab?", ["The high e string", "The low E string", "The G string", "The A string"], 0),
        ask("The tune starts on the open high e string. What note is that?", ["E", "G", "B", "C"], 0),
        ask("The tune moves from E to F. Which fret is that on the high e string?", ["Fret 1", "Fret 3", "Fret 5", "Fret 2"], 0, "F is a half step above E.", { tab: { cols: [[[5, 0]], [[5, 1]]] } }),
        ask("What is the last note of this tune?", ["D (B string, fret 3)", "C (B string, fret 1)", "E (open e)", "G (e string, fret 3)"], 0, "The melody ends on D, B string fret 3.", cols(ODE)),
      ),
    ),
    lesson(
      "G5.2",
      "Alternate picking and the C major scale",
      7,
      read("Eight notes, up the neck", [
        "A <b>scale</b> is a ladder of notes in order. The <b>C major scale</b> in first position runs C D E F G A B C and uses the open strings along the way. It is the standard way to build a smooth picking hand.",
        "Fingers: A string fret 3 (finger 3), D string open, fret 2 (finger 2), fret 3 (finger 3), G string open, fret 2 (finger 2), B string open, fret 1 (finger 1). Pick <b>down, up, down, up</b>, through the whole scale.",
      ], { fig: { tab: { cols: SCALE.map((x) => [x]), names: ["C", "D", "E", "F", "G", "A", "B", "C"] } }, hear: [hear(SCALE, 110, "▶ Hear the scale")] }),
      read("On the staff", ["Same scale in standard notation: it starts at middle C (the first ledger line below the staff) and climbs to the C in the third space."],
        { fig: { staff: ["C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5"], names: true } }),
      practice("Play the scale up and back down at 60 BPM, alternate picking. Keep the metronome steady. Then try it again a little faster only if it is clean.", { needs: "guitar", fig: { tab: { cols: SCALE.map((x) => [x]), names: ["C", "D", "E", "F", "G", "A", "B", "C"] } } }),
      quiz(
        ask("A scale is…", ["Notes in order, step by step", "Any group of notes", "A strumming pattern", "A tuning"], 0),
        ask("Which fret of the A string is the first note of the C scale?", ["3", "0", "2", "5"], 0, "A string: A (0) – B (2) – C (3).", { tab: { cols: [[[1, 3]]] } }),
        ask("Alternate picking means…", ["Down, up, down, up", "Only downstrokes", "Plucking with the fingers", "Strumming chords"], 0),
        card("fretNote:1.3"),
        card("fretNote:2.3"),
      ),
    ),
    lesson(
      "G5.3",
      "Hot Cross Buns: note lengths",
      6,
      read("Tab doesn’t show length", [
        "Tab tells you <b>where</b> to play, not <b>for how long</b>. For that you need to hear the tune or read standard notation. <b>Hot Cross Buns</b>, an old English street song, is a good one to practise with, because its rhythm is easy to hear.",
        "The first two phrases are <b>short, short, long</b>: two quarter notes (one beat each) and a half note (two beats). Then comes a run of eight quick notes, <b>eighth notes</b>, two to a beat. The last phrase is short, short, long again.",
      ], { fig: cols(HCB), hear: [{ l: "▶ Hear it", seq: HCB.map(([s, f]) => OPEN[s] + f), onsets: [0, 1, 2, 4, 5, 6, 8, 8.5, 9, 9.5, 10, 10.5, 11, 11.5, 12, 13, 14], tempo: 100 }] }),
      practice("Play the tune slowly. Say “short, short, long” for E D C, then play the fast run C C C C D D D D, then finish with short, short, long.", { needs: "guitar", fig: cols(HCB) }),
      quiz(
        ask("What does tab NOT tell you?", ["How long each note lasts", "Which string", "Which fret", "The order of notes"], 0),
        ask("How many beats does a half note last?", ["2", "1", "4", "½"], 0),
        ask("Which notes make up the fast section of Hot Cross Buns?", ["C C C C D D D D", "E D C E D C", "G G G G", "C D E F"], 0),
        ask("Eighth notes in 4/4 are counted…", ["Two to a beat: “1 & 2 &”", "One to a beat", "Four to a beat", "Half a beat each"], 0),
      ),
    ),
    lesson(
      "G5.4",
      "Mary had a little lamb",
      7,
      read("A melody with a pattern", [
        "Another nursery tune that is a delight to play: <b>Mary Had a Little Lamb</b>. It uses E, D, C and G on the top two strings. The pattern repeats: look at the shape of the first phrase (E D C D E E E), then the same idea again.",
        "Spotting <b>repeats and patterns</b> makes any tune easier to learn: instead of 26 separate notes you only need to remember a handful of ideas.",
      ], { fig: cols(MARY), hear: [hear(MARY, 120)] }),
      practice("Learn the first phrase (E D C D E E E). Play it five times. Then add the second phrase (D D D) and join them. Finally play the whole tune at 70 BPM, counting a one-bar count-in.", { needs: "guitar", fig: cols(MARY) }),
      quiz(
        ask("The first phrase goes E D C D E E E. The first note is on…", ["The open high e string", "The B string, fret 3", "The B string, fret 1", "The G string"], 0),
        ask("Why look for patterns in a tune?", ["There is less to memorise", "It makes the tune faster", "Patterns are required by law", "They change the key"], 0),
        ask("What is the note on the B string, fret 1?", ["C", "D", "E", "B"], 0),
        card("fretNote:4.1"),
        card("fretNote:4.3"),
      ),
    ),
    lesson(
      "G5.5",
      "From the staff to the strings",
      7,
      read("Finding notes in first position", [
        "When you read music, you find each written note on the neck. Near the nut the notes on the thin strings are easy to place: the open E string is the space at the top of the staff; F is on the top line; G is just above the staff. On the B string: C is the third space, D the fourth line.",
        "Remember that every note except the very low and the very high ones has more than one place to play. In first position, pick the one closest to the nut.",
      ], { fig: { staff: ["B4", "C5", "D5", "E5", "F5", "G5"], names: true, cap: "B string open, B string fret 1, fret 3, then open e, fret 1, fret 3." } }),
      quiz(
        card("staffFret:71"),
        card("staffFret:72"),
        card("staffFret:74"),
        card("staffFret:76"),
        card("staffFret:77"),
        card("staffFret:79"),
        card("staffFret:67"),
        card("staffFret:69"),
      ),
    ),
  ],
);
