/* Theory 1: Reading the staff. */
import { ask, card, course, lesson, quiz, read } from "../dsl.js";

const NAT = [52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81]; // written naturals E3..A5

export const T1 = course(
  "T1",
  "Reading the staff",
  "Pitch, the treble clef, every note on and around the staff, and sharps and flats.",
  [
    lesson(
      "T1.1",
      "High, low and the musical alphabet",
      4,
      read("Pitch", [
        "Every note has a <b>pitch</b>: how high or low it sounds. A bass guitar string is low. A whistle is high. Music is mostly about moving between pitches.",
        "Press the buttons. Same note name (C), three different pitches.",
      ], { hear: [{ l: "Low C", snd: [48] }, { l: "Middle C", snd: [60] }, { l: "High C", snd: [72] }] }),
      read("Seven letters", [
        "Notes are named with the first seven letters of the alphabet: <b>A B C D E F G</b>. After G, the pattern starts over at A, and the new A sounds higher.",
        "The distance from one letter to the next one with the same name is an <b>octave</b>. Low C and high C above sound like the same note in a different register, which is why they share a name.",
      ], { fig: { keys: { oct: 2, names: "white", hi: [0], hi2: [] }, cap: "On a piano the white keys run C D E F G A B, then C again an octave higher." } }),
      quiz(
        ask("Which letter comes right after G in the musical alphabet?", ["H", "A", "B", "C"], 1, "The alphabet stops at G and starts over at A."),
        ask("What do we call the distance between a note and the next one with the same name?", ["A step", "A scale", "An octave", "A chord"], 2, "Eight letter names apart, counting both ends: C up to the next C."),
        ask("A whistle compared to a tuba has a…", ["higher pitch", "lower pitch", "longer rhythm", "bigger chord"], 0),
        ask("Which of these is NOT a note name?", ["B", "F", "H", "E"], 2, "Only A to G are used."),
      ),
    ),
    lesson(
      "T1.2",
      "The staff and the treble clef",
      5,
      read("Five lines, four spaces", [
        "Written music puts notes on a <b>staff</b>: five horizontal lines with four spaces between them. We number lines and spaces from the <b>bottom up</b>. A note higher on the staff sounds higher.",
        "The curly symbol at the left is the <b>treble clef</b>, also called the G clef. Its curl wraps around the second line from the bottom and says: this line is <b>G</b>. Every other note is worked out from that.",
      ], { fig: { staff: ["E4", "G4", "B4", "D5", "F5"], names: false, cap: "Five notes, one on each line, counting from the bottom." } }),
      read("Up the staff means up in pitch", [
        "Moving a note to the next line or space moves it to the next letter. The note on the bottom line is E; the space above it is F; the next line up is G (the one the clef curls around).",
      ], { fig: { staff: ["E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5"], names: true, cap: "Line, space, line, space… each step up is the next letter." }, hear: [{ l: "▶ Listen going up", seq: [64, 65, 67, 69, 71, 72, 74, 76], onsets: [0, 1, 2, 3, 4, 5, 6, 7], tempo: 140 }] }),
      quiz(
        ask("How many lines does a staff have?", ["3", "4", "5", "6"], 2),
        ask("How do we count the lines and spaces of a staff?", ["From the top down", "From the bottom up", "From the middle outwards", "From the clef"], 1),
        ask("The treble clef curls around the second line from the bottom. Which note is that line?", ["E", "F", "G", "B"], 2, "That is why it is called the G clef."),
        ask("If a note moves higher on the staff, it sounds…", ["Higher", "Lower", "Louder", "Longer"], 0),
      ),
    ),
    lesson(
      "T1.3",
      "Notes on the lines: E G B D F",
      6,
      read("Every Good Boy Does Fine", [
        "From the bottom line up, the five line notes are <b>E, G, B, D, F</b>. A classic way to remember them: <b>E</b>very <b>G</b>ood <b>B</b>oy <b>D</b>oes <b>F</b>ine.",
        "Skipping a letter each time is why they go E-G-B-D-F: line notes are always two letter-names apart.",
      ], { fig: { staff: ["E4", "G4", "B4", "D5", "F5"], names: true } }),
      read("Try some", "Name the note on the line. Tap the matching letter. There is no penalty for guessing wrong, only for not trying.", { fig: { staff: ["G4", "E4", "F5", "B4"], names: false, cap: "Say them in your head before you check: G, E, F, B." } }),
      quiz(
        card("staff:64"),
        card("staff:67"),
        card("staff:71"),
        card("staff:74"),
        card("staff:77"),
        ask("What does the mnemonic Every Good Boy Does Fine give you?", ["The space notes", "The line notes, bottom to top", "The notes of a chord", "The order of the clefs"], 1),
      ),
    ),
    lesson(
      "T1.4",
      "Notes in the spaces: F A C E",
      5,
      read("It spells FACE", [
        "The four spaces, bottom to top, are <b>F, A, C, E</b>. They spell the word <b>FACE</b>.",
        "Together with the line notes, the staff now has nine notes from E (bottom line) to F (top line), and each one is the next letter up, going line, space, line, space, and so on.",
      ], { fig: { staff: ["F4", "A4", "C5", "E5"], names: true } }),
      read("Lines and spaces together", ["The whole staff, bottom to top, steps through the letters: <b>E F G A B C D E F</b>. That ladder is worth learning by heart."], { fig: { staff: ["E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5"], names: true } }),
      quiz(
        card("staff:65"),
        card("staff:69"),
        card("staff:72"),
        card("staff:76"),
        ask("Which letter is the note in the top space of the staff?", ["D", "E", "F", "G"], 1, "FACE, bottom to top: F, A, C, E."),
        ask("What is the note on the very top line?", ["E", "F", "G", "A"], 1),
      ),
    ),
    lesson(
      "T1.5",
      "Reading a short tune",
      6,
      read("Steps and skips", [
        "When the next note is on the neighbouring line or space, that is a <b>step</b>. When it jumps over one, that is a <b>skip</b> (a third). Bigger jumps are leaps.",
        "Melodies mostly move by step and skip, so you can read them in groups rather than note by note.",
      ], { fig: { staff: ["E4", "F4", "G4", "B4", "A4", "G4"], names: true, cap: "Step, step, skip, step, step. E–F–G steps; G–B skips." } }),
      read("Read by shape", ["Look at the direction first (up, down or staying), then check the size of each move. Here is the opening of a very famous tune. Read it, then listen."],
        { fig: { staff: ["E4", "E4", "F4", "G4", "G4", "F4", "E4", "D4"], names: true }, hear: [{ l: "▶ Listen", seq: [64, 64, 65, 67, 67, 65, 64, 62], onsets: [0, 1, 2, 3, 4, 5, 6, 7], tempo: 110 }] }),
      quiz(
        ask("A move from the bottom line to the line above it is a…", ["Step", "Skip", "Leap", "Repeat"], 1, "E to G skips over F: the space in between.", { staff: ["E4", "G4"], names: true }),
        ask("A move from a line to the space right above it is a…", ["Step", "Skip", "Leap", "Repeat"], 0),
        ask("The same note twice in a row is a…", ["Step", "Skip", "Repeat", "Octave"], 2),
        ask("Name the last note of the tune you just read (Ode to Joy, first phrase).", ["C", "D", "E", "F"], 1, "The tune settles on D.", { staff: ["E4", "E4", "F4", "G4", "G4", "F4", "E4", "D4"], names: false }),
      ),
    ),
    lesson(
      "T1.6",
      "Ledger lines: above and below the staff",
      6,
      read("When the staff runs out", [
        "The staff only holds nine notes. For higher or lower pitches we add short extra lines called <b>ledger lines</b>.",
        "Just <b>below</b> the staff: D sits under the bottom line, then middle <b>C</b> sits on the first ledger line. Above the staff: G in the space above, then <b>A</b> on the first ledger line.",
      ], { fig: { staff: ["D4", "C4", "G5", "A5"], names: true, cap: "D and C below; G and A above." } }),
      read("Keep counting", ["Continue the pattern of letters. Below middle C the notes keep going down through <b>B, A, G, F, E</b>. The guitar's low strings live down here: the lowest note on a guitar, the open sixth string, is written E3."],
        { fig: { staff: ["C4", "B3", "A3", "G3", "F3", "E3"], names: true }, hear: [{ l: "▶ Listen going down", seq: [60, 59, 57, 55, 53, 52], onsets: [0, 1, 2, 3, 4, 5], tempo: 120 }] }),
      quiz(
        card("staff:60"),
        card("staff:57"),
        card("staff:79"),
        card("staff:81"),
        card("staff:55"),
        ask("Where does middle C sit?", ["On the first ledger line below the staff", "In the bottom space", "On the bottom line", "On the first ledger line above"], 0),
      ),
    ),
    lesson(
      "T1.7",
      "Sharps, flats and naturals",
      6,
      read("Between the letters", [
        "Between most pairs of neighbouring letters there is another note. A <b>sharp</b> (♯) raises a note by one <b>half step</b>, the smallest distance in the usual system. A <b>flat</b> (♭) lowers it by one half step. A <b>natural</b> (♮) cancels a sharp or flat.",
        "The sign goes <b>before</b> the note, on the same line or space.",
      ], { fig: { staff: ["F4", "F#4", "Fb4", "Fn4"], names: true, cap: "F, F♯, F♭ and F natural." } }),
      read("Two names, one pitch", [
        "C♯ and D♭ are the same pitch written two ways. Same for D♯/E♭, F♯/G♭, G♯/A♭ and A♯/B♭. These are <b>enharmonic</b> spellings. Which one you see depends on the key you are in; we cover that later.",
        "An accidental stays in force for the rest of the <b>bar</b> (measure) it appears in, and a natural sign cancels it.",
      ], { fig: { keys: { oct: 1, names: "all", hi: [1, 3, 6, 8, 10] }, cap: "The five black keys are the sharps and flats." } }),
      quiz(
        ask("What does a sharp do to a note?", ["Lowers it a half step", "Raises it a half step", "Doubles its length", "Cancels a flat"], 1),
        ask("What does a flat do to a note?", ["Lowers it a half step", "Raises it a half step", "Makes it quiet", "Does nothing"], 0),
        ask("Which sign cancels a sharp or flat?", ["♮ (natural)", "♯", "♭", "𝄐"], 0),
        ask("C♯ and D♭ are…", ["Different notes a whole step apart", "The same pitch with two names", "A chord", "Both flats"], 1, "That's called enharmonic."),
        ask("Where does the sharp sign go?", ["Before the note", "After the note", "Above the staff", "Under the clef"], 0),
      ),
    ),
    lesson(
      "T1.8",
      "The twelve notes",
      6,
      read("Half steps all the way around", [
        "Count every key on a piano, white and black, going up from C: that is <b>12 different pitches</b> before the pattern repeats at the next C. Each neighbouring pair is a half step. On a guitar, each fret is one half step.",
        "There is <b>no</b> black key between <b>E and F</b>, and none between <b>B and C</b>. Those two pairs are already a half step apart, so E–F and B–C need no sharp or flat between them. Every other pair of neighbouring letters has one.",
      ], { fig: { keys: { oct: 1, names: "white", hi: [4, 5], hi2: [11, 0] }, cap: "E–F and B–C: neighbours with no black key in between." } }),
      read("The full list", [
        "Sharps going up: C C♯ D D♯ E F F♯ G G♯ A A♯ B. Flats going up: C D♭ D E♭ E F G♭ G A♭ A B♭ B. Learn both: you will see both when reading.",
      ], { fig: { table: { head: ["Number", "Note", "Number", "Note"], rows: [["0", "C", "6", "F♯/G♭"], ["1", "C♯/D♭", "7", "G"], ["2", "D", "8", "G♯/A♭"], ["3", "D♯/E♭", "9", "A"], ["4", "E", "10", "A♯/B♭"], ["5", "F", "11", "B"]] } } }),
      quiz(
        ask("How many different pitches are in an octave (not counting the repeat)?", ["7", "8", "12", "24"], 2),
        ask("Which pair of neighbouring letters has NO note between them?", ["C and D", "E and F", "F and G", "A and B"], 1, "E–F and B–C are only a half step apart."),
        ask("Which note is a half step above B?", ["C", "C♯", "A♯", "D"], 0),
        ask("On guitar, moving up one fret raises the pitch by…", ["A half step", "A whole step", "An octave", "A third"], 0),
        ask("How many half steps from C up to G?", ["5", "6", "7", "8"], 2, "C–C♯–D–D♯–E–F–F♯–G is 7 half steps."),
      ),
    ),
    lesson(
      "T1.9",
      "Reading for guitar",
      6,
      read("Guitar is written an octave higher", [
        "Guitar music is written one octave <b>higher</b> than it really sounds, so that it fits on the staff. You read the notes exactly as printed and the instrument does the rest.",
        "The six open strings, from the thick one to the thin one, are <b>E A D G B E</b>. Written, that is E3, A3, D4, G4, B4 and E5. The two lowest strings sit below middle C on ledger lines. D4 hangs just under the staff, G4 is on the second line, B4 on the middle line, and the thin E5 is in the top space.",
      ], { fig: { staff: ["E3", "A3", "D4", "G4", "B4", "E5"], names: ["E", "A", "D", "G", "B", "E"], cap: "The open strings, as written." }, hear: [{ l: "▶ Open strings low to high", seq: [52, 57, 62, 67, 71, 76], onsets: [0, 1, 2, 3, 4, 5], tempo: 120 }] }),
      read("One note, several places", [
        "Most notes can be played in more than one spot. The E on the bottom line of the staff is on the D string at fret 2, on the A string at fret 7, and on the low E string at fret 12. They all sound the same pitch. Which one you choose depends on what comes before and after it.",
      ], { fig: { neck: { range: [1, 12], dots: [[2, 2], [1, 7], [0, 12]] }, cap: "Three places for the same E." } }),
      quiz(
        ask("Guitar music is written…", ["An octave lower than it sounds", "An octave higher than it sounds", "Exactly as it sounds", "Two octaves higher"], 1),
        card("staff:52"),
        card("staff:62"),
        card("staff:71"),
        card("staff:76"),
        card("fretNote:2.2"),
      ),
    ),
  ],
  {
    gen: (n) => Array.from({ length: n }, () => ({ card: "staff:" + NAT[(Math.random() * NAT.length) | 0] })),
  },
);
