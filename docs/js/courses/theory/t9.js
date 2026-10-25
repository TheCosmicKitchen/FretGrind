/* Theory 9: Cadences, phrases and form. How music punctuates itself and how songs are built from motives, phrases and sections. */
import { ask, course, lesson, quiz, read } from "../dsl.js";

const block = (l, chords) => ({ l, seq: chords.flat(), onsets: chords.flatMap((c, i) => c.map(() => i * 2)), tempo: 110 });
const T = { C: [60, 64, 67], F: [60, 65, 69], G: [59, 62, 67], Am: [57, 60, 64], Dm: [62, 65, 69], G7: [59, 62, 65, 67] };

export const T9 = course(
  "T9",
  "Cadences, phrases and form",
  "How music punctuates itself: cadences, phrases and periods, motives and sequences, and the shapes of whole songs.",
  [
    lesson(
      "T9.1",
      "Cadences",
      8,
      read("Musical punctuation", [
        "A <b>cadence</b> is the chord move that ends a phrase, like punctuation in a sentence. Four are worth knowing in major:",
        "<b>Authentic (V–I)</b>: the full stop. G (or G7) to C feels finished. <b>Half (…–V)</b>: a comma or question mark: the phrase stops on V and waits for an answer. <b>Plagal (IV–I)</b>: the “Amen” cadence, gentler than V–I. <b>Deceptive (V–vi)</b>: you expect I but get vi (Am in C): a surprise, as if the sentence takes a turn.",
      ], { fig: { table: { head: ["Cadence", "Chords in C", "Feels like"], rows: [["Authentic", "G(7) – C", "A full stop"], ["Half", "… – G", "A comma / question"], ["Plagal", "F – C", "“Amen”"], ["Deceptive", "G(7) – Am", "A surprise"]] } }, hear: [block("▶ Authentic", [T.G7, T.C]), block("▶ Half", [T.C, T.G]), block("▶ Plagal", [T.F, T.C]), block("▶ Deceptive", [T.G7, T.Am])] }),
      quiz(
        ask("Which cadence is V–I?", ["Authentic", "Plagal", "Half", "Deceptive"], 0),
        ask("Which cadence ends on V?", ["Half", "Authentic", "Plagal", "Deceptive"], 0),
        ask("Which cadence is IV–I, the “Amen” cadence?", ["Plagal", "Authentic", "Deceptive", "Half"], 0),
        ask("In C major, G – Am is a…", ["Deceptive cadence", "Plagal cadence", "Half cadence", "Authentic cadence"], 0),
        ask("A half cadence feels…", ["Unfinished: it waits for an answer", "Completely finished", "Sad", "Fast"], 0),
        ask("In the key of D major, the plagal cadence is…", ["G – D", "A – D", "D – A", "Bm – D"], 0),
        ask("Listen. Which cadence is this?", ["Authentic", "Half", "Plagal", "Deceptive"], 0, "V7 to I: tension released.", null, block("▶", [T.G7, T.C])),
        ask("Listen. Which cadence is this?", ["Deceptive", "Authentic", "Plagal", "Half"], 0, "The ending lands on vi where you expect I.", null, block("▶", [T.G7, T.Am])),
      ),
    ),
    lesson(
      "T9.2",
      "Phrases and periods",
      8,
      read("Question and answer", [
        "A <b>phrase</b> is a musical sentence: typically 4 bars long, ending in a cadence. Two phrases often pair as a <b>period</b>: an <b>antecedent</b> phrase (the question) ends on a weak cadence such as the half cadence, and a <b>consequent</b> phrase (the answer) starts the same way but ends on a strong one, the authentic cadence. If the two phrases start identically it is a <b>parallel period</b>.",
        "Look at <i>Twinkle, Twinkle</i>: the first four bars (C C G G A A G) end on G, the dominant, and leave things hanging. The next four (F F E E D D C) end on C, the tonic, and settle it. <i>Ode to Joy</i> works the same way: its first half ends on D (over V) and its second half returns home to C.",
      ], { figs: [{ staff: ["C4", "C4", "G4", "G4", "A4", "A4", "G4"], names: true, cap: "Antecedent: ends on G (the dominant): a question." }, { staff: ["F4", "F4", "E4", "E4", "D4", "D4", "C4"], names: true, cap: "Consequent: ends on C (the tonic): the answer." }], hear: [{ l: "▶ Both phrases", seq: [60, 60, 67, 67, 69, 69, 67, 65, 65, 64, 64, 62, 62, 60], onsets: [0, 1, 2, 3, 4, 5, 6, 8, 9, 10, 11, 12, 13, 14], tempo: 110 }] }),
      quiz(
        ask("A typical phrase is how many bars?", ["4", "2", "6", "16"], 0),
        ask("The antecedent phrase usually ends with a…", ["Weak cadence, such as a half cadence", "Authentic cadence", "Deceptive cadence on purpose", "Rest"], 0),
        ask("The consequent phrase usually ends with a…", ["Strong cadence, such as authentic", "Half cadence", "Key change", "Time change"], 0),
        ask("A period is…", ["Two phrases: a question and an answer", "A single long note", "A full stop at the end of a song", "A repeat sign"], 0),
        ask("In Twinkle, Twinkle, the first phrase ends on which note?", ["G", "C", "F", "A"], 0, "C C G G A A G: the dominant.", { staff: ["C4", "C4", "G4", "G4", "A4", "A4", "G4"], names: false }),
        ask("In Twinkle, Twinkle, the second phrase ends on which note?", ["C", "G", "D", "E"], 0, "F F E E D D C: back home.", { staff: ["F4", "F4", "E4", "E4", "D4", "D4", "C4"], names: false }),
        ask("A parallel period is one in which…", ["Both phrases start the same way", "The phrases are in different keys", "The melody never moves", "Only one phrase appears"], 0),
      ),
    ),
    lesson(
      "T9.3",
      "Motive and sequence",
      8,
      read("Building from a tiny idea", [
        "A <b>motive</b> is the smallest memorable musical idea: a few notes with a recognisable rhythm. Composers make whole movements from one. The most famous: the four-note opening of Beethoven’s Fifth Symphony, <b>G G G E♭</b>, short–short–short–long.",
        "Ways to develop a motive: <b>repeat</b> it exactly; <b>sequence</b> it (repeat the same shape starting on a different note, higher or lower); <b>vary</b> it (change a rhythm or an interval); <b>invert</b> it (flip the shape upside down); <b>extend</b> it. Beethoven’s next move is a sequence: the motive again a step lower, <b>F F F D</b>. Hearing a sequence helps you predict where a tune is going.",
      ], { fig: { staff: ["G4", "G4", "G4", "Eb4", "F4", "F4", "F4", "D4"], names: true, cap: "The motive and its sequence a step lower." }, hear: [{ l: "▶ Motive and sequence", seq: [67, 67, 67, 63, 65, 65, 65, 62], onsets: [0, 0.5, 1, 1.5, 4, 4.5, 5, 5.5], tempo: 130 }] }),
      quiz(
        ask("A motive is…", ["The smallest memorable idea in a piece", "A whole verse", "A chord", "A time signature"], 0),
        ask("A sequence is…", ["The same shape repeated on a different pitch", "An exact repeat", "A change of key", "A change of tempo"], 0),
        ask("Inverting a motive means…", ["Turning its shape upside down", "Playing it backwards in time only", "Playing it louder", "Transposing by an octave"], 0),
        ask("Beethoven’s Fifth begins with the notes…", ["G G G E♭", "C C C A", "E E E C", "D D D B"], 0),
        ask("What does the second statement of the opening motive do?", ["Moves down a step as a sequence", "Repeats exactly", "Goes up an octave", "Changes the rhythm"], 0, "F F F D is the same shape one step lower."),
        ask("Why does recognising a sequence help you read or play?", ["You can predict the next notes", "It makes the piece shorter", "It changes the key", "It speeds up the tempo"], 0),
      ),
    ),
    lesson(
      "T9.4",
      "Binary, ternary and rondo form",
      8,
      read("Letters for sections", [
        "We label sections with letters: same letter = same music, a new letter = new music. The classic small forms:",
        "<b>Binary</b> (A B): two sections, often each repeated; common in dances and folk tunes. <b>Ternary</b> (A B A): statement, contrast, return: a very satisfying shape. <b>Rondo</b> (A B A C A…): a main theme keeps returning between contrasting episodes. <b>Theme and variations</b> (A A′ A″…): one tune, changed each time. <b>Strophic</b> (A A A): the same music for every verse. <b>Through-composed</b>: new music all the way through.",
      ], { fig: { table: { head: ["Form", "Letters", "Where you hear it"], rows: [["Binary", "A B", "Dances, many folk tunes"], ["Ternary", "A B A", "Minuets, lullabies, arias"], ["Rondo", "A B A C A", "Classical finales"], ["Strophic", "A A A", "Hymns, folk songs"], ["Theme & variations", "A A′ A″", "Classical sets"], ["Through-composed", "A B C D", "Some art songs, film music"]] } } }),
      quiz(
        ask("A B A is…", ["Ternary form", "Binary form", "Rondo", "Strophic"], 0),
        ask("A B is…", ["Binary form", "Ternary form", "Rondo", "Theme and variations"], 0),
        ask("A B A C A is…", ["Rondo", "Ternary", "Binary", "Strophic"], 0),
        ask("Which form repeats the same music for every verse?", ["Strophic", "Through-composed", "Rondo", "Binary"], 0),
        ask("The letter A′ (A prime) means…", ["The A music, varied", "A completely new section", "A rest", "Louder"], 0),
        ask("Through-composed means…", ["New music throughout, no repeats", "Every verse the same", "Two sections", "A song with a bridge"], 0),
        ask("Which form fits a lullaby that goes A, then a contrasting B, then A again?", ["Ternary", "Binary", "Rondo", "Strophic"], 0),
      ),
    ),
    lesson(
      "T9.5",
      "Counting form in a song",
      8,
      read("Bars, sections and lengths", [
        "Most songs are built from sections with a regular length: <b>8 bars</b> (two 4-bar phrases) is the basic unit of folk and pop, with <b>12 bars</b> for the blues, <b>16 bars</b> for a longer verse, and <b>32 bars</b> for the classic <b>AABA</b> song form (four 8-bar sections: two similar A sections, a contrasting <b>bridge</b>, then A again).",
        "To find the form of a song you do not know, <b>count in 4s or 8s</b> from the first downbeat, listening for where the music <i>repeats</i> or <i>changes character</i>. If your count ends one bar early or late, look for a <b>pickup</b>, a <b>tag</b> or an <b>extension</b>. Phrases that sound four bars long but last five, or three, are a sign of such an extra bar.",
      ], { fig: { table: { head: ["Form", "Bars", "Layout"], rows: [["Folk verse", "8", "4 + 4 (question and answer)"], ["12-bar blues", "12", "4 + 4 + 4"], ["Pop verse / chorus", "8 or 16", "two or four 4-bar phrases"], ["AABA standard", "32", "8 + 8 + 8 + 8"]] } } }),
      quiz(
        ask("How many bars is a classic AABA song?", ["32", "12", "16", "8"], 0),
        ask("How many bars is a 12-bar blues?", ["12", "8", "16", "24"], 0),
        ask("The B in AABA is also called the…", ["Bridge", "Chorus", "Coda", "Intro"], 0),
        ask("The basic folk unit is…", ["8 bars, two 4-bar phrases", "5 bars", "3 bars", "20 bars"], 0),
        ask("To find a song’s form, you…", ["Count in 4s or 8s and listen for repeats", "Count the sharps", "Count the verses of lyrics only", "Check the key signature"], 0),
        ask("A phrase that lasts 5 bars instead of 4 probably has…", ["An extension", "A key change", "A tempo change", "No melody"], 0),
      ),
    ),
    lesson(
      "T9.6",
      "Cadence and form workout",
      8,
      read("Mixed practice", [
        "No new rules: this is a mixed round. Listen for the cadence at the end of each little excerpt, and work out the form from the letters.",
      ]),
      quiz(
        ask("Listen. Which cadence ends this?", ["Plagal", "Authentic", "Half", "Deceptive"], 0, "F to C: IV–I.", null, block("▶", [T.C, T.F, T.C])),
        ask("Listen. Which cadence ends this?", ["Half", "Authentic", "Plagal", "Deceptive"], 0, "It stops on G (V) and waits.", null, block("▶", [T.C, T.Am, T.G])),
        ask("Listen. Which cadence ends this?", ["Authentic", "Half", "Plagal", "Deceptive"], 0, "G7 pulls to C.", null, block("▶", [T.C, T.F, T.G7, T.C])),
        ask("A song goes verse, verse, bridge, verse. Its form is…", ["AABA", "ABAB", "ABCD", "AAAA"], 0),
        ask("A song’s first two phrases end on V then I. This pair is a…", ["Period (antecedent and consequent)", "Rondo", "Binary form", "Sequence"], 0),
        ask("Which is the strongest, most final cadence?", ["Authentic", "Half", "Deceptive", "Plagal"], 0),
        ask("Which section is a contrast, heard once, in the middle?", ["The bridge", "The chorus", "The verse", "The intro"], 0),
        ask("The same motive repeated a step lower is a…", ["Sequence", "Cadence", "Period", "Inversion"], 0),
      ),
    ),
  ],
  { more: [{ t: "Open Music Theory (cadences, phrase, form), free online text", u: "https://viva.pressbooks.pub/openmusictheory/" }] },
);
