/* Theory 2: Rhythm. */
import { ask, course, lesson, practice, quiz, read } from "../dsl.js";

const DUR = [
  ["a whole note", "4"],
  ["a half note", "2"],
  ["a dotted half note", "3"],
  ["a quarter note", "1"],
  ["a dotted quarter note", "1½"],
  ["an eighth note", "½"],
  ["a quarter rest", "1"],
  ["a half rest", "2"],
];
const ALL = ["½", "1", "1½", "2", "3", "4"];
const beat = { head: ["1", "&", "2", "&", "3", "&", "4", "&"] };

export const T2 = course(
  "T2",
  "Rhythm",
  "The beat, note lengths, rests, time signatures, dots and ties, off-beats and compound time.",
  [
    lesson(
      "T2.1",
      "Beat and tempo",
      4,
      read("Feel the pulse", [
        "Most music has a <b>beat</b>: a steady pulse you can tap your foot to. The beat doesn’t change speed, even when the notes on top of it do.",
        "How fast the beat goes is the <b>tempo</b>, usually measured in <b>beats per minute (BPM)</b>. 60 BPM = one beat each second (like a clock). 120 BPM = two beats a second, a brisk walking pace.",
      ], { hear: [{ l: "60 BPM", seq: [60, 60, 60, 60], onsets: [0, 1, 2, 3], tempo: 60 }, { l: "120 BPM", seq: [60, 60, 60, 60, 60, 60, 60, 60], onsets: [0, 1, 2, 3, 4, 5, 6, 7], tempo: 120 }] }),
      quiz(
        ask("The beat is…", ["A steady pulse", "The loudest note", "The melody", "The key"], 0),
        ask("How long is one beat at 60 BPM?", ["1 second", "½ second", "2 seconds", "¼ second"], 0),
        ask("How long is one beat at 120 BPM?", ["½ second", "1 second", "2 seconds", "1½ seconds"], 0, "120 beats in 60 seconds: two a second."),
        ask("Tempo is…", ["How fast the beat is", "How high the notes are", "How loud the music is", "How many chords there are"], 0),
      ),
    ),
    lesson(
      "T2.2",
      "Quarter, half and whole notes",
      6,
      read("How long does a note last?", [
        "Notes show <b>how long</b> to play as well as which pitch. The most common length is the <b>quarter note</b>: a filled-in head with a stem. In music in 4/4 it gets <b>one beat</b>. A <b>half note</b> has an open head and a stem and lasts <b>two beats</b>. A <b>whole note</b> has an open head and no stem: <b>four beats</b>.",
        "Each is half as long as the one before: a whole note is two half notes, and a half note is two quarter notes.",
      ], { figs: [{ rhythm: "x-x-x-x-", cap: "Four quarter notes: one beat each." }, { rhythm: "x---x---", cap: "Two half notes: two beats each." }, { rhythm: "x-------", cap: "One whole note: four beats." }], hear: [{ l: "▶ Quarters", seq: [60, 60, 60, 60], onsets: [0, 1, 2, 3], tempo: 80 }, { l: "▶ Halves", seq: [60, 60], onsets: [0, 2], tempo: 80 }, { l: "▶ Whole", seq: [60], onsets: [0], tempo: 80 }] }),
      quiz(
        ask("How many beats does a half note last in 4/4?", ["2", "1", "4", "3"], 0),
        ask("How many beats does a whole note last in 4/4?", ["4", "2", "1", "8"], 0),
        ask("How many quarter notes make one whole note?", ["4", "2", "8", "3"], 0),
        ask("Which note has an open head and no stem?", ["Whole note", "Half note", "Quarter note", "Eighth note"], 0),
        ask("How many beats are in this bar?", ["4", "2", "3", "8"], 0, "Two half notes: 2 + 2.", { rhythm: "x---x---" }),
      ),
    ),
    lesson(
      "T2.3",
      "Bars and 4/4 time",
      6,
      read("Bars and time signatures", [
        "Music is divided into equal chunks called <b>bars</b> (or measures), separated by vertical <b>bar lines</b>. Each bar holds the same number of beats.",
        "The two numbers at the start, the <b>time signature</b>, say how. The <b>top number</b> is how many beats are in each bar. The <b>bottom number</b> says which note gets one beat (4 = a quarter note). So <b>4/4</b> means four quarter-note beats in every bar. It is so common that it is also written <b>C</b> (common time).",
      ], { fig: { staff: { notes: ["C5", "D5", "E5", "F5"], ts: [4, 4], gap: 46 }, cap: "4/4: four quarter notes fill one bar." } }),
      quiz(
        ask("In 4/4, the top number 4 means…", ["Four beats per bar", "Four bars", "Quarter notes only", "Fourth fret"], 0),
        ask("In 4/4, the bottom number 4 means…", ["A quarter note gets one beat", "Four beats per minute", "Four notes per beat", "The key of four"], 0),
        ask("What fills one bar of 4/4?", ["Two half notes", "Three quarter notes", "One half note", "Five quarter notes"], 0),
        ask("Another name for 4/4 is…", ["Common time", "Waltz time", "March time", "Free time"], 0),
        ask("Bar lines divide music into…", ["Equal groups of beats", "Verses", "Keys", "Voices"], 0),
      ),
    ),
    lesson(
      "T2.4",
      "Rests",
      6,
      read("Silence counts", [
        "A <b>rest</b> is a length of silence. Each note value has a matching rest: a <b>quarter rest</b> lasts one beat, a <b>half rest</b> two beats (a small block sitting on the middle line) and a <b>whole rest</b> four beats (a block hanging from the line above the middle).",
        "Keep counting through rests: the beat never stops. Rests are what make music breathe, and playing them in time is as important as playing the notes.",
      ], { figs: [{ rhythm: "x-x-..x-", cap: "Quarter, quarter, quarter rest, quarter." }, { rhythm: "x-..x-..", cap: "Note, rest, note, rest." }] }),
      quiz(
        ask("How many beats is a quarter rest in 4/4?", ["1", "2", "4", "½"], 0),
        ask("How many beats is a half rest in 4/4?", ["2", "1", "4", "3"], 0),
        ask("How many beats is a whole rest in 4/4?", ["4", "2", "1", "8"], 0),
        ask("While you’re resting, you should…", ["Keep counting", "Stop counting", "Tap faster", "Play louder"], 0),
        ask("How many beats of silence are in this bar?", ["1", "2", "0", "4"], 0, "One quarter rest.", { rhythm: "x-x-..x-" }),
      ),
    ),
    lesson(
      "T2.5",
      "Eighth notes and counting",
      6,
      read("Splitting the beat", [
        "An <b>eighth note</b> lasts half a beat, so two of them fit in each beat. It looks like a quarter note with a flag, and two together are joined by a beam. Count the beat as <b>“1 and”</b>: the numbers are the beats and the “and”s (written <b>&</b>) are the halves between them.",
        "A bar of 4/4 full of eighth notes is counted <b>1 & 2 & 3 & 4 &</b>: eight notes in all.",
      ], { figs: [{ rhythm: "xxxxxxxx", cap: "Eight eighth notes: 1 & 2 & 3 & 4 &." }, { rhythm: "x-xxx-xx", cap: "A mix: quarter, two eighths, quarter, two eighths." }], hear: [{ l: "▶ Eighths", seq: [60, 60, 60, 60, 60, 60, 60, 60], onsets: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], tempo: 80 }] }),
      practice("Tap the beat with your foot and clap eight eighth notes against it saying “1 and 2 and 3 and 4 and”. Then try the mixed pattern. You can also use Games ▸ Tap the rhythm for more.", {}),
      quiz(
        ask("How many eighth notes fill a bar of 4/4?", ["8", "4", "16", "2"], 0),
        ask("How long does an eighth note last?", ["Half a beat", "One beat", "Two beats", "A quarter beat"], 0),
        ask("How many eighth notes are in one beat?", ["2", "1", "4", "3"], 0),
        ask("In “1 & 2 &”, the “&” falls…", ["Halfway between beats", "On the beat", "At the end of the bar only", "Before the bar"], 0),
        ask("How many notes are played in this bar?", ["6", "8", "5", "4"], 0, "Quarter, two eighths, quarter, two eighths = 6 notes.", { rhythm: "x-xxx-xx" }),
      ),
    ),
    lesson(
      "T2.6",
      "Dots and ties",
      7,
      read("A dot adds half", [
        "A <b>dot</b> after a note adds <b>half of its length</b>. A half note is 2 beats, so a <b>dotted half note</b> is 2 + 1 = <b>3 beats</b>. A quarter is 1 beat, so a <b>dotted quarter</b> is 1 + ½ = <b>1½ beats</b>.",
      ], { figs: [{ rhythm: "x-----x-", cap: "Dotted half note (3 beats) then a quarter note." }, { rhythm: "x--xx--x", cap: "Dotted quarter, eighth, dotted quarter, eighth." }] }),
      read("Ties join notes", [
        "A <b>tie</b> is a curved line joining two notes of the <b>same pitch</b>. You play the first and hold it through the second: the lengths add. A quarter note tied to an eighth note lasts 1½ beats. Ties let a note cross a bar line or sit on the off-beat, where a single note value can’t fit.",
      ]),
      quiz(
        ask("A dotted half note lasts…", ["3 beats", "2 beats", "4 beats", "1½ beats"], 0),
        ask("A dotted quarter note lasts…", ["1½ beats", "2 beats", "1 beat", "¾ beat"], 0),
        ask("A dot adds…", ["Half the note’s length", "A whole beat", "Double the length", "A quarter of the length"], 0),
        ask("A tie joins two notes of…", ["The same pitch", "Different pitches", "Any length", "Different keys"], 0),
        ask("A half note tied to a quarter note lasts…", ["3 beats", "2 beats", "4 beats", "1 beat"], 0),
      ),
    ),
    lesson(
      "T2.7",
      "3/4 and 2/4",
      6,
      read("Other time signatures", [
        "<b>3/4</b> has three quarter-note beats per bar: <b>1 2 3, 1 2 3</b>. It feels like a waltz: a strong beat, then two lighter ones. <b>2/4</b> has two beats per bar: a march. The bottom number is still 4, so a quarter note is still one beat.",
        "A bar of 3/4 can be three quarter notes, a half note and a quarter, or a dotted half note.",
      ], { fig: { staff: { notes: ["E5", "E5", "E5"], ts: [3, 4], gap: 46 }, cap: "3/4: one bar of three quarter notes." }, hear: [{ l: "▶ 3/4 waltz feel", seq: [48, 60, 60, 48, 60, 60], onsets: [0, 1, 2, 3, 4, 5], tempo: 110 }, { l: "▶ 2/4 march feel", seq: [48, 60, 48, 60], onsets: [0, 1, 2, 3], tempo: 110 }] }),
      quiz(
        ask("How many beats per bar in 3/4?", ["3", "4", "2", "6"], 0),
        ask("Which time signature feels like a waltz?", ["3/4", "4/4", "2/4", "5/4"], 0),
        ask("How many quarter notes fit in a bar of 2/4?", ["2", "3", "4", "1"], 0),
        ask("In 3/4, a dotted half note…", ["Fills a whole bar", "Lasts 2 beats", "Is too long to fit", "Fills half a bar"], 0, "Dotted half = 3 beats = a full bar of 3/4."),
        ask("In 3/4 the bottom number 4 means…", ["A quarter note gets a beat", "Four beats per bar", "Four bars", "Fourth beat is strong"], 0),
      ),
    ),
    lesson(
      "T2.8",
      "Off-beats and syncopation",
      7,
      read("On the beat, off the beat", [
        "In <b>1 & 2 & 3 & 4 &</b> the numbers are <b>on-beats</b> and the “&”s are <b>off-beats</b>. Most notes land on the beat, which feels stable.",
        "<b>Syncopation</b> means stressing the weaker spots: notes that start on an off-beat and are held across the next beat. It makes rhythm feel like it is leaning forward or bouncing, and it is everywhere in folk, blues, rock and jazz.",
      ], { figs: [{ rhythm: "x-x-x-x-", cap: "On the beat: steady." }, { rhythm: ".x.x.x.x", cap: "Only the off-beats: every “&”." }, { rhythm: "x--xx--x", cap: "Syncopated: the second note starts on an “&” and is held over the beat." }] }),
      practice("Tap your foot on every beat and clap only the “&”s (off-beats): ‘1 AND 2 AND’. Then try the syncopated pattern above. Try it in Games ▸ Tap the rhythm, levels 4 and 5.", {}),
      quiz(
        ask("Off-beats are…", ["The “&”s between the beats", "Beats 1 and 3", "Silent beats", "Bar lines"], 0),
        ask("Syncopation means…", ["Stressing weak beats or off-beats", "Playing every note staccato", "Playing exactly on the beat", "Slowing down"], 0),
        ask("In the pattern .x.x.x.x, notes fall on…", ["Every off-beat", "Every beat", "Only beat 1", "Only beat 4"], 0),
        ask("Syncopation is common in…", ["Folk, blues, rock and jazz", "Only classical", "Only marches", "Only hymns"], 0),
      ),
    ),
    lesson(
      "T2.9",
      "Sixteenth notes",
      6,
      read("Four to a beat", [
        "<b>Sixteenth notes</b> last a quarter of a beat: four to each beat. They have two flags (or two beams). The count is <b>1 e & a, 2 e & a, 3 e & a, 4 e & a</b>: sixteen notes in a bar of 4/4.",
        "Fast strumming, hammer-ons and fast riffs are often written with sixteenth notes. When you can count “1 e & a” steadily, you can read almost any rhythm.",
      ], { fig: { table: { ...beat, head: ["1", "e", "&", "a", "2", "e", "&", "a"], rows: [["♬", "♬", "♬", "♬", "♬", "♬", "♬", "♬"]] }, cap: "Two beats of sixteenth notes: 1 e & a 2 e & a." }, hear: [{ l: "▶ Sixteenths", seq: [60, 60, 60, 60, 60, 60, 60, 60], onsets: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75], tempo: 80 }] }),
      quiz(
        ask("How many sixteenth notes in one beat (quarter note)?", ["4", "2", "8", "3"], 0),
        ask("How many sixteenth notes fill a bar of 4/4?", ["16", "8", "12", "4"], 0),
        ask("The usual count for sixteenths is…", ["1 e & a", "1 & 2 &", "1 2 3 4", "1 la le li"], 0),
        ask("A sixteenth note lasts…", ["¼ of a beat", "½ of a beat", "1 beat", "2 beats"], 0),
      ),
    ),
    lesson(
      "T2.10",
      "Compound time: 6/8",
      7,
      read("Beats in threes", [
        "In <b>6/8</b> there are six eighth notes per bar, grouped in <b>two groups of three</b>. It is counted <b>1 2 3 4 5 6</b> with accents on 1 and 4, but it feels like <b>two</b> big beats, each divided into three. That is called <b>compound time</b> (as opposed to “simple” time like 4/4, where each beat divides into two).",
        "6/8 has a rolling, lilting feel: many jigs, lullabies and slow folk songs are in 6/8. A pattern of down-down-up-down-up-down in your strumming hand matches it naturally.",
      ], { fig: { table: { head: ["1", "2", "3", "4", "5", "6"], rows: [["BEAT", "·", "·", "BEAT", "·", "·"]] }, cap: "Two big beats, each split into three." }, hear: [{ l: "▶ 6/8 feel", seq: [48, 60, 60, 52, 60, 60], onsets: [0, 1, 2, 3, 4, 5], tempo: 200 }] }),
      quiz(
        ask("How many eighth notes are in one bar of 6/8?", ["6", "8", "3", "12"], 0),
        ask("How is 6/8 grouped?", ["Two groups of three", "Three groups of two", "One group of six", "Six groups of one"], 0),
        ask("In 6/8 the accents usually fall on counts…", ["1 and 4", "1 and 3", "2 and 5", "Every count"], 0),
        ask("Compound time means each beat divides into…", ["Three", "Two", "Four", "Five"], 0),
        ask("Which time signature is a ‘two big beats in threes’ feel?", ["6/8", "4/4", "3/4", "2/4"], 0),
      ),
    ),
  ],
  {
    gen: (n) =>
      Array.from({ length: n }, () => {
        const [what, val] = DUR[(Math.random() * DUR.length) | 0],
          opts = [val, ...ALL.filter((x) => x !== val).sort(() => Math.random() - 0.5).slice(0, 3)];
        return { p: `In 4/4, how many beats does ${what} last?`, a: opts, c: 0 };
      }),
  },
);
