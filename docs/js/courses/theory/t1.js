/* Theory 1: Reading notation. Pitch names, both clefs, ledger lines, accidentals, the twelve notes, frequency and melodies. */
import { ask, card, course, lesson, quiz, read } from "../dsl.js";

const NAT = [52, 53, 55, 57, 59, 60, 62, 64, 65, 67, 69, 71, 72, 74, 76, 77, 79, 81]; // written naturals E3..A5
const run = (ms, tempo = 120) => ({ seq: ms, onsets: ms.map((_, i) => i), tempo });
const bass = (notes, extra = {}) => ({ staff: { notes, clef: "bass", ...extra } });

export const T1 = course(
  "T1",
  "Reading notation",
  "The staff, treble and bass clefs, ledger lines and octave names, accidentals, the twelve notes, frequency and reading melodies.",
  [
    lesson(
      "T1.1",
      "The staff and the treble clef",
      7,
      read("Lines, spaces and a clef", [
        "Music is written on a <b>staff</b>: five lines and four spaces, counted from the <b>bottom up</b>. Higher on the staff means higher in pitch. Notes use the letters <b>A B C D E F G</b> and then start over, so moving to the next line or space moves to the next letter.",
        "A <b>clef</b> at the left fixes which letter sits where. The <b>treble clef</b> (the G clef) curls around the second line and marks it as <b>G</b>. From there, the five lines read <b>E G B D F</b> (<b>E</b>very <b>G</b>ood <b>B</b>oy <b>D</b>oes <b>F</b>ine) and the four spaces read <b>F A C E</b>, which spells the word.",
      ], { fig: { staff: ["E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5", "F5"], names: true, cap: "Line, space, line, space…: the nine notes of the treble staff, E to F." }, hear: [{ l: "▶ Listen going up", ...run([64, 65, 67, 69, 71, 72, 74, 76, 77], 150) }] }),
      read("Don’t count, learn landmarks", [
        "Reading note by note (“E, G, B…”) is far too slow. Learn a few <b>landmarks</b> and read everything else as a step or skip away from them: <b>G</b> on the second line (the clef’s curl), <b>E</b> on the bottom line, <b>F</b> on the top line, and <b>middle C</b> just below the staff.",
        "Any two neighbouring notes are a <b>step</b> when one is on a line and the other in the next space, and a <b>skip</b> (a third) when both are on lines or both in spaces.",
      ]),
      quiz(
        card("staff:64"),
        card("staff:65"),
        card("staff:67"),
        card("staff:69"),
        card("staff:71"),
        card("staff:72"),
        card("staff:74"),
        card("staff:77"),
        ask("Line notes are two letters apart, so the five lines of the treble staff, bottom to top, read…", ["E G B D F", "F A C E G", "A C E G B", "D F A C E"], 0),
        ask("Which letter does the treble clef’s curl mark?", ["G", "F", "C", "E"], 0, "That is why it is also called the G clef."),
        ask("Two notes, one on a line and one on the neighbouring line, are a…", ["Skip (third)", "Step (second)", "Leap of a fifth", "Repeat"], 0, "E up to G skips over F in between.", { staff: ["E4", "G4"], names: true }),
      ),
    ),
    lesson(
      "T1.2",
      "Ledger lines and octave names",
      7,
      read("When the staff runs out", [
        "Short extra lines called <b>ledger lines</b> extend the staff up or down, and the letters just keep going. Below the staff: <b>D</b> hangs under the bottom line, then <b>middle C</b> sits on the first ledger line, then B in the space under it, then A on the next ledger line. Above: <b>G</b> sits in the space over the top line, and <b>A</b> on the first ledger line above.",
      ], { fig: { staff: ["A3", "B3", "C4", "D4", "E4", "F5", "G5", "A5", "B5", "C6"], names: true, cap: "Ledger lines below and above the treble staff." }, hear: [{ l: "▶ Listen: A3 up to C4 and on", ...run([57, 59, 60, 62, 64], 140) }] }),
      read("The same letter, different octave", [
        "Every letter name repeats every octave, so we add a number: <b>scientific pitch notation</b>. <b>Middle C is C4.</b> The number goes up at every C, not at A: after B3 comes C4, then D4 E4 F4 G4 A4 B4, then C5.",
        "That makes <b>A4</b> the A above middle C (the tuning-fork A, 440 Hz). The lowest note on a standard piano is A0 and the highest C8. A guitar’s low string is written <b>E3</b> but actually sounds <b>E2</b>: guitar music is notated an octave higher than it sounds, so that it fits on the staff.",
      ], { fig: { table: { head: ["Name", "Where", "Note"], rows: [["Piano low A", "bottom of the piano", "A0"], ["Low C", "two octaves below middle C", "C2"], ["Middle C", "centre of the piano", "C4"], ["Tuning A", "A above middle C", "A4"], ["High C", "top of the treble area", "C6"], ["Piano top", "highest key", "C8"]] } } }),
      quiz(
        card("staff:60"),
        card("staff:59"),
        card("staff:57"),
        card("staff:79"),
        card("staff:81"),
        card("staff:55"),
        ask("Where does the octave number go up?", ["At every C", "At every A", "At every G", "At every F"], 0, "B3 is followed by C4."),
        ask("Which note is middle C?", ["C4", "C3", "C5", "A4"], 0),
        ask("Which note comes right after B3?", ["C4", "B4", "A3", "C3"], 0),
        ask("A guitar’s low E is written E3. It actually sounds…", ["E2, an octave lower", "E3, as written", "E4, an octave higher", "E1, two octaves lower"], 0),
      ),
    ),
    lesson(
      "T1.3",
      "The bass clef and the grand staff",
      8,
      read("A second clef", [
        "Low instruments (cello, bassoon, trombone, tuba, bass guitar) and the piano’s left hand would need a pile of ledger lines in treble clef, so they use the <b>bass clef</b> (the F clef): its two dots straddle the fourth line, which is <b>F</b>. The five lines, bottom to top, read <b>G B D F A</b> (<b>G</b>ood <b>B</b>oys <b>D</b>o <b>F</b>ine <b>A</b>lways) and the four spaces <b>A C E G</b> (<b>A</b>ll <b>C</b>ows <b>E</b>at <b>G</b>rass).",
        "The letters are the same, but the pitches are lower: the bottom line is <b>G2</b> and the top line <b>A3</b>.",
      ], { figs: [{ ...bass(["G2", "B2", "D3", "F3", "A3"], { names: true }), cap: "Bass clef lines: G B D F A." }, { ...bass(["A2", "C3", "E3", "G3"], { names: true }), cap: "Bass clef spaces: A C E G." }] }),
      read("The grand staff", [
        "Piano music joins a treble and a bass staff with a brace: the <b>grand staff</b>. Between them sits <b>middle C</b>, which can be written on the first ledger line <i>below</i> the treble staff or on the first ledger line <i>above</i> the bass staff: same pitch, same key, two spellings. Together the two staves cover the whole range with almost no ledger lines.",
        "The practical tip: always read the clef first. The same position on the staff means a different letter in each clef: the bottom line is E in treble clef but G in bass clef.",
      ], { figs: [{ staff: ["C4"], names: true, cap: "Middle C below the treble staff…" }, { ...bass(["C4"], { names: true }), cap: "…and above the bass staff. Same pitch." }] }),
      quiz(
        ask("Which letter does the bass clef’s two dots surround?", ["F", "G", "C", "A"], 0, "The dots sit either side of the fourth line: F."),
        ask("The bass clef lines, bottom to top, read…", ["G B D F A", "E G B D F", "A C E G B", "F A C E G"], 0),
        ask("The bass clef spaces, bottom to top, read…", ["A C E G", "F A C E", "G B D F", "B D F A"], 0),
        ask("Name this note.", ["B", "D", "A", "G"], 0, "Second line of the bass staff: G, B → B.", bass(["B2"])),
        ask("Name this note.", ["F", "E", "G", "A"], 0, "The space below the bottom line (G): F.", bass(["F2"])),
        ask("Name this note.", ["E", "D", "F", "C"], 0, "The third space of the bass staff reads E.", bass(["E3"])),
        ask("Name this note.", ["A", "G", "B", "F"], 0, "The top line of the bass staff.", bass(["A3"])),
        ask("Which of these usually reads bass clef?", ["Cello", "Flute", "Violin", "Trumpet"], 0),
        ask("What is the lowest line of the bass staff?", ["G2", "E4", "A3", "F3"], 0),
        ask("A brace joining a treble and a bass staff makes the…", ["Grand staff", "Great staff", "Double staff", "Piano key"], 0),
      ),
    ),
    lesson(
      "T1.4",
      "Accidentals and enharmonics",
      8,
      read("Sharps, flats, naturals", [
        "A <b>sharp</b> (♯) raises a note one <b>half step</b>, a <b>flat</b> (♭) lowers it one, and a <b>natural</b> (♮) cancels either. A <b>double sharp</b> (𝄪) raises two half steps (a whole step) and a <b>double flat</b> (𝄫) lowers two. The sign goes <b>before</b> the note on the same line or space.",
        "Written in the music (not in the key signature), an accidental is an <b>accidental</b>, and it lasts until the <b>bar line</b>, for that line or space only, in that octave. A tie carries it across the bar line.",
      ], { fig: { staff: ["F4", "F#4", "Fb4", "Fn4", "F##4"], names: true, cap: "F, F♯, F♭, F natural and F double sharp (♯♯)." } }),
      read("One pitch, two spellings", [
        "<b>Enharmonic</b> notes have different names but the same pitch: C♯ = D♭, D♯ = E♭, F♯ = G♭, G♯ = A♭, A♯ = B♭. The names even reach the white keys: <b>E♯ = F</b>, <b>B♯ = C</b>, <b>C♭ = B</b>, <b>F♭ = E</b>, and a double sharp like F𝄪 is the same key as G.",
        "Which spelling you use depends on the key and the scale: a scale uses each letter once. That is why G major has an F♯ and never a G♭, and why a key can need an “odd” note like E♯.",
      ], { fig: { keys: { oct: 1, names: "all", hi: [1, 3, 6, 8, 10] }, cap: "The five black keys, each with two names." } }),
      quiz(
        ask("What does a flat do?", ["Lowers a note one half step", "Raises a note one half step", "Lowers a note a whole step", "Cancels a sharp"], 0),
        ask("A double sharp raises a note by…", ["A whole step", "A half step", "Three half steps", "An octave"], 0),
        ask("How long does an accidental last?", ["Until the end of the bar", "Until the end of the song", "For one note only, even if repeated", "Until the next rest"], 0),
        ask("E♯ is the same pitch as…", ["F", "E", "F♯", "D♯"], 0),
        ask("B♯ is the same pitch as…", ["C", "B", "C♯", "A♯"], 0),
        ask("C♭ is the same pitch as…", ["B", "C", "A♯", "B♭"], 0),
        ask("F double sharp (F𝄪) sounds like…", ["G", "F♯", "E", "G♯"], 0),
        ask("A♯ and B♭ are…", ["Enharmonic: the same pitch", "A whole step apart", "A half step apart", "The same name"], 0),
        ask("Why does the G major scale use F♯ and not G♭?", ["A scale uses each letter name once", "G♭ is not a real note", "It is easier to play", "Flats are only for minor keys"], 0),
      ),
    ),
    lesson(
      "T1.5",
      "The twelve notes and half steps",
      7,
      read("Twelve pitches", [
        "Counting every key on a piano, black and white, gives <b>12 different pitches</b> in an octave. Neighbours are a <b>half step</b> (semitone) apart. Between <b>E and F</b> and between <b>B and C</b> there is no black key, so those pairs are already half steps. Every other pair of neighbouring letters is a whole step with a note in between.",
        "Going up, we normally write the sharps (C C♯ D D♯ E F F♯ G G♯ A A♯ B); going down, the flats (B B♭ A A♭ G G♭ F E E♭ D D♭ C). Musicians also number the twelve from <b>0 (C)</b> to <b>11 (B)</b>: pitch-class numbers. Adding or subtracting <b>modulo 12</b> is a quick way to work out any interval.",
      ], { fig: { table: { head: ["No.", "Note", "No.", "Note"], rows: [["0", "C", "6", "F♯/G♭"], ["1", "C♯/D♭", "7", "G"], ["2", "D", "8", "G♯/A♭"], ["3", "D♯/E♭", "9", "A"], ["4", "E", "10", "A♯/B♭"], ["5", "F", "11", "B"]] } }, hear: [{ l: "▶ Chromatic scale C–C", ...run([60, 61, 62, 63, 64, 65, 66, 67, 68, 69, 70, 71, 72], 220) }] }),
      quiz(
        ask("How many different pitches are in an octave?", ["12", "7", "8", "10"], 0),
        ask("Which neighbouring letters are a half step apart?", ["E and F", "C and D", "G and A", "D and E"], 0),
        ask("What is 5 half steps above B?", ["E", "F", "D", "E♭"], 0, "B→C 1, C♯ 2, D 3, D♯ 4, E 5."),
        ask("What is 7 half steps above D?", ["A", "G", "B", "A♭"], 0),
        ask("What is 8 half steps above E?", ["C", "B", "D", "C♯"], 0),
        ask("What is 6 half steps above F?", ["B", "C", "A♯", "E"], 0, "F up 6 is B: the tritone."),
        ask("What is 3 half steps below C?", ["A", "B♭", "G", "A♭"], 0),
        ask("Which pitch-class number is G♯/A♭?", ["8", "7", "9", "10"], 0),
        ask("What is 9 half steps above G?", ["E", "F", "D", "C"], 0),
        ask("What is 11 half steps above C?", ["B", "A", "C♯", "D"], 0),
      ),
    ),
    lesson(
      "T1.6",
      "Pitch, frequency and A440",
      7,
      read("Pitch is a number", [
        "A pitch is a <b>frequency</b>: vibrations per second, in hertz (Hz). The tuning standard is <b>A4 = 440 Hz</b>. Every <b>octave doubles the frequency</b>: A5 is 880 Hz, A3 220 Hz, A2 110 Hz (the A string of a guitar). That makes the octave a 2:1 ratio, and that is why two notes an octave apart sound like “the same note”.",
        "In today’s <b>equal temperament</b> an octave is split into 12 equal semitones, each a ratio of 2<sup>1/12</sup> ≈ <b>1.0595</b>. Finer than that we use <b>cents</b>: 100 cents per semitone, 1200 per octave. A tuner that says “+10” means 10 cents sharp, a tenth of a semitone.",
      ], { fig: { table: { head: ["Note", "Frequency"], rows: [["A2", "110 Hz"], ["A3", "220 Hz"], ["A4", "440 Hz"], ["A5", "880 Hz"], ["A6", "1760 Hz"]] } }, hear: [{ l: "▶ A3, A4, A5", seq: [57, 69, 81], onsets: [0, 1, 2], tempo: 70 }] }),
      read("MIDI numbers", [
        "Computers number every pitch with an integer: <b>MIDI note numbers</b>. <b>C4 (middle C) = 60</b>, <b>A4 = 69</b>, and each half step adds 1, so an octave is 12 numbers. The number mod 12 gives the pitch class (60 mod 12 = 0 = C). It is the cheapest way to move notes around in code or on a spreadsheet.",
      ]),
      quiz(
        ask("Standard tuning pitch A4 is…", ["440 Hz", "220 Hz", "880 Hz", "261.6 Hz"], 0),
        ask("What is A5’s frequency?", ["880 Hz", "660 Hz", "440 Hz", "1000 Hz"], 0, "An octave up doubles it."),
        ask("What is A2’s frequency?", ["110 Hz", "55 Hz", "220 Hz", "330 Hz"], 0),
        ask("Cents in one semitone?", ["100", "12", "1200", "10"], 0),
        ask("Cents in an octave?", ["1200", "100", "700", "1000"], 0),
        ask("Each equal-tempered semitone multiplies frequency by about…", ["1.06", "2", "1.5", "1.2"], 0),
        ask("What is the MIDI number of middle C?", ["60", "69", "48", "72"], 0),
        ask("What is the MIDI number of C5?", ["72", "70", "64", "84"], 0),
        ask("MIDI note 64 is…", ["E4", "D4", "F4", "E3"], 0, "60 is C4, so 64 is four half steps above."),
        ask("What does 69 mod 12 tell you?", ["The pitch class: 9 = A", "The octave", "The key", "The tempo"], 0),
      ),
    ),
    lesson(
      "T1.7",
      "Reading melodies",
      7,
      read("Contour, steps, skips and leaps", [
        "Before reading the notes, look at the <b>contour</b>: does the tune go up, down, or stay? Then check the <b>size</b> of each move: a <b>step</b> (neighbouring letter), a <b>skip</b> (a third), a <b>leap</b> (a fourth or more), or a <b>repeat</b>. Most melodies are mostly steps with a few skips and the odd leap, so you can read in <b>groups</b> instead of one note at a time.",
        "Here are two tunes you know. Read the shape first, then listen to check.",
      ], { figs: [
        { staff: ["E4", "E4", "F4", "G4", "G4", "F4", "E4", "D4"], names: true, cap: "Ode to Joy, opening: repeat, step, step, repeat, steps down." },
        { staff: ["C4", "C4", "G4", "G4", "A4", "A4", "G4"], names: true, cap: "Twinkle, Twinkle: a leap of a fifth (C up to G), then steps." },
      ], hear: [{ l: "▶ Ode to Joy", ...run([64, 64, 65, 67, 67, 65, 64, 62], 110) }, { l: "▶ Twinkle", ...run([60, 60, 67, 67, 69, 69, 67], 110) }] }),
      quiz(
        ask("The move C4 up to G4 in Twinkle is a…", ["Leap", "Step", "Skip", "Repeat"], 0, "C up to G passes D, E and F: a fifth.", { staff: ["C4", "G4"], names: true }),
        ask("The move E4 to F4 is a…", ["Step", "Skip", "Leap", "Repeat"], 0, "Neighbouring letters."),
        ask("The move G4 up to B4 is a…", ["Skip", "Step", "Leap", "Repeat"], 0, "A third: G B skips A.", { staff: ["G4", "B4"], names: true }),
        ask("The same note twice in a row is a…", ["Repeat", "Step", "Skip", "Unison leap"], 0),
        ask("Name the last note of this melody.", ["D", "C", "E", "F"], 0, "The tune comes down to D.", { staff: ["E4", "E4", "F4", "G4", "G4", "F4", "E4", "D4"], names: false }),
        ask("Name the first note of this melody.", ["C", "D", "E", "G"], 0, "Middle C.", { staff: ["C4", "C4", "G4", "G4"], names: false }),
        ask("Which melody shape is this?", ["Up, then down", "Down, then up", "Always up", "Flat"], 0, "Rises to the top note, then comes back.", { staff: ["C4", "E4", "G4", "E4", "C4"], names: false }),
        ask("Before reading note names, you should look at the…", ["Contour: up, down or flat", "Last bar", "Page number", "Composer"], 0),
      ),
    ),
    lesson(
      "T1.8",
      "Reading workout",
      8,
      read("Mixed practice", [
        "No new rules here: just fast reading. Name each note <b>before</b> you look at the answers, and use landmarks, not counting: the <b>treble G</b> (second line), <b>middle C</b> (first ledger line below), the <b>bass F</b> (fourth line) and the C’s between the staves. Anything else is a step or skip from one of those.",
      ]),
      quiz(
        card("staff:62"),
        card("staff:64"),
        card("staff:67"),
        card("staff:71"),
        card("staff:76"),
        card("staff:77"),
        card("staff:79"),
        card("staff:81"),
        card("staff:57"),
        card("staff:55"),
        card("staff:53"),
        card("staff:60"),
        ask("Name this note.", ["D", "C", "E", "F"], 0, "Bass clef, third line.", bass(["D3"])),
        ask("Name this note.", ["G", "A", "F", "B"], 0, "Bottom line of the bass staff.", bass(["G2"])),
        ask("Name this note.", ["C", "B", "D", "A"], 0, "Second space of the bass staff.", bass(["C3"])),
        ask("Which note sits on the first ledger line above the treble staff?", ["A5", "G5", "B5", "C6"], 0),
      ),
    ),
  ],
  {
    gen: (n) => Array.from({ length: n }, () => ({ card: "staff:" + NAT[(Math.random() * NAT.length) | 0] })),
  },
);
