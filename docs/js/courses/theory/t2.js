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
  "The beat, note values and bars, rests, eighths and sixteenths, dots and ties, time signatures, syncopation, compound and odd meters, triplets and swing.",
  [
    lesson(
      "T2.1",
      "Beat, note values and bars",
      8,
      read("The pulse and how fast it goes", [
        "Most music has a <b>beat</b>: a steady pulse you could tap a foot to. Its speed is the <b>tempo</b>, measured in <b>beats per minute (BPM)</b>: at 60 BPM a beat lasts one second, at 120 BPM half a second. The beat doesn’t change when the notes on top of it do.",
      ], { hear: [{ l: "60 BPM", seq: [60, 60, 60, 60], onsets: [0, 1, 2, 3], tempo: 60 }, { l: "120 BPM", seq: [60, 60, 60, 60, 60, 60, 60, 60], onsets: [0, 1, 2, 3, 4, 5, 6, 7], tempo: 120 }] }),
      read("Note values: each is half the one before", [
        "A <b>whole note</b> (open head, no stem) lasts four beats in 4/4, a <b>half note</b> (open head, stem) two, a <b>quarter note</b> (filled head, stem) one, and an <b>eighth note</b> (a flag or beam) half a beat. Halve again for sixteenths. So one whole note = two halves = four quarters = eight eighths.",
        "Music is cut into equal <b>bars</b> by bar lines. The <b>time signature</b> says how: the <b>top</b> number is how many beats per bar, the <b>bottom</b> number says which note gets the beat (4 = a quarter, 8 = an eighth). So <b>4/4</b> (common time, also written <b>C</b>) is four quarter-note beats per bar.",
      ], { figs: [{ rhythm: "x-x-x-x-", cap: "Four quarter notes: one beat each." }, { rhythm: "x---x---", cap: "Two half notes: two beats each." }, { rhythm: "x-------", cap: "One whole note: four beats." }], hear: [{ l: "▶ Quarters", seq: [60, 60, 60, 60], onsets: [0, 1, 2, 3], tempo: 80 }, { l: "▶ Halves", seq: [60, 60], onsets: [0, 2], tempo: 80 }, { l: "▶ Whole", seq: [60], onsets: [0], tempo: 80 }] }),
      quiz(
        ask("How long is one beat at 90 BPM?", ["⅔ second", "1 second", "½ second", "1½ seconds"], 0, "60 ÷ 90 = ⅔ of a second."),
        ask("How long is one beat at 120 BPM?", ["½ second", "1 second", "2 seconds", "¼ second"], 0),
        ask("How many beats does a half note last in 4/4?", ["2", "1", "4", "3"], 0),
        ask("How many eighth notes make one whole note?", ["8", "4", "2", "16"], 0),
        ask("In 4/4, what does the bottom 4 mean?", ["A quarter note gets one beat", "Four bars", "Four beats per minute", "Four sharps"], 0),
        ask("How many beats are in this bar?", ["4", "2", "3", "8"], 0, "Two half notes: 2 + 2.", { rhythm: "x---x---" }),
        ask("What fills one bar of 4/4?", ["Two half notes", "Three quarter notes", "One half note", "Five quarter notes"], 0),
        ask("In 2/2 (cut time) the half note gets the beat. How many beats does a whole note last?", ["2", "4", "1", "½"], 0, "The half note is the beat, so a whole note is two beats."),
      ),
    ),
    lesson(
      "T2.2",
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
      "T2.3",
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
      "T2.4",
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
      "T2.5",
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
      "T2.6",
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
      "T2.7",
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
      "T2.8",
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
    lesson(
      "T2.9",
      "Triplets and tuplets",
      8,
      read("Three in the space of two", [
        "A <b>triplet</b> squeezes <b>three</b> equal notes into the time that would normally hold <b>two</b> of the same kind. An <b>eighth-note triplet</b> fits three notes into one beat, counted <b>1-trip-let, 2-trip-let</b>… (or “1 la li, 2 la li”). It is marked with a small <b>3</b> over a bracket or beam.",
        "More generally a <b>tuplet</b> fits <i>n</i> notes into the space of a different usual number: a <b>quintuplet</b> puts five in the space of four, a <b>sextuplet</b> six, and so on. A <b>quarter-note triplet</b> fits three quarter notes into two beats and sounds like a slow, rolling cross-rhythm.",
        "Triplets give 12/8 and 6/8 their lilt, and shuffle blues is built from triplets with the middle one left out.",
      ], { fig: { table: { head: ["1", "trip", "let", "2", "trip", "let"], rows: [["3 in 1 beat", "", "", "3 in 1 beat", "", ""]] }, cap: "Two beats of eighth-note triplets: six notes where we normally play four." }, hear: [{ l: "▶ Straight eighths", seq: [60, 60, 60, 60], onsets: [0, 0.5, 1, 1.5], tempo: 90 }, { l: "▶ Triplets", seq: [60, 60, 60, 60, 60, 60], onsets: [0, 1 / 3, 2 / 3, 1, 4 / 3, 5 / 3], tempo: 90 }] }),
      quiz(
        ask("A triplet fits three notes into the time of…", ["Two of the same kind", "Four of the same kind", "Three of the same kind", "One bar"], 0),
        ask("How many eighth-note triplet notes fit in one beat?", ["3", "2", "4", "6"], 0),
        ask("How many eighth-note triplet notes in one bar of 4/4?", ["12", "8", "6", "16"], 0, "Three per beat, four beats."),
        ask("A quintuplet normally puts five notes in the space of…", ["Four", "Three", "Six", "Two"], 0),
        ask("The small 3 over a group of notes marks a…", ["Triplet", "Third", "Three-bar rest", "Time change"], 0),
        ask("Listen. Which is playing?", ["Triplets", "Straight eighths", "Sixteenths", "Quarter notes"], 0, "", null, { seq: [60, 60, 60, 60, 60, 60], onsets: [0, 1 / 3, 2 / 3, 1, 4 / 3, 5 / 3], tempo: 90 }),
      ),
    ),
    lesson(
      "T2.10",
      "Odd meters: 5/4 and 7/8",
      8,
      read("Counting in fives and sevens", [
        "Not every bar splits into twos and threes evenly. <b>5/4</b> has five quarter beats, almost always felt as <b>3 + 2</b> or <b>2 + 3</b>. <b>7/8</b> has seven eighths, usually <b>2 + 2 + 3</b>, <b>3 + 2 + 2</b> or <b>2 + 3 + 2</b>. These <b>asymmetric</b> meters feel like a limp or a lilt rather than a march.",
        "To count them, don’t count to 7: count the <b>groups</b>: “1-2, 1-2, 1-2-3” for 2+2+3. Famous examples: Take Five (5/4, 3+2), Mission: Impossible (5/4), and many Balkan dances (7/8, 9/8).",
      ], { fig: { table: { head: ["1", "2", "3", "4", "5", "6", "7"], rows: [["▶", "·", "▶", "·", "▶", "·", "·"]] }, cap: "7/8 as 2 + 2 + 3: accents on 1, 3 and 5." }, hear: [{ l: "▶ 7/8 as 2+2+3", seq: [60, 55, 60, 55, 60, 55, 55], onsets: [0, 1, 2, 3, 4, 5, 6], tempo: 260 }] }),
      quiz(
        ask("How many beats are in a bar of 5/4?", ["5", "4", "3", "10"], 0),
        ask("5/4 is usually felt as…", ["3 + 2 or 2 + 3", "4 + 1", "5 single beats", "2 + 2 + 1 only"], 0),
        ask("7/8 is often grouped as…", ["2 + 2 + 3", "4 + 4", "3 + 3", "5 + 2 + 1"], 0),
        ask("How many eighth notes fill one bar of 7/8?", ["7", "8", "14", "4"], 0),
        ask("A bar of 5/4 contains the same duration as…", ["Five quarter notes", "Four quarter notes", "Three half notes", "Eight eighths"], 0),
        ask("Why are 5/4 and 7/8 called asymmetric?", ["Their beats group unequally", "They have no beat", "They use rests only", "They are always slow"], 0),
      ),
    ),
    lesson(
      "T2.11",
      "Pickups, swing and feel",
      8,
      read("Starting before the bar", [
        "A tune often starts <b>before</b> the first full bar: that short bar is the <b>pickup</b> or <b>anacrusis</b> (the first two syllables of “Happy Birthday”, “Hap-py”, are a pickup). The missing beats are usually found at the very end, so the first and last bars together add up to one full bar.",
        "Written rhythms are only half the story: <b>feel</b> matters. In <b>swing</b> (jazz, blues), pairs of eighths are played long–short, roughly like the first and third parts of a triplet, even though they are written as straight eighths. A <b>shuffle</b> is the same idea at blues tempos. <b>Straight</b> feel plays them evenly.",
      ], { hear: [{ l: "▶ Straight eighths", seq: [60, 67, 60, 67, 60, 67, 60, 67], onsets: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], tempo: 100 }, { l: "▶ Swung eighths", seq: [60, 67, 60, 67, 60, 67, 60, 67], onsets: [0, 2 / 3, 1, 5 / 3, 2, 8 / 3, 3, 11 / 3], tempo: 100 }] }),
      quiz(
        ask("A pickup bar (anacrusis) is…", ["A short opening bar before the first full bar", "The last bar", "A bar of rests", "A repeated bar"], 0),
        ask("In swing, a pair of written eighths is played…", ["Long, then short", "Short, then long", "Equally", "As a chord"], 0),
        ask("A straight feel plays eighth notes…", ["Evenly", "Long–short", "As triplets", "As sixteenths"], 0),
        ask("If a song starts with a one-beat pickup in 4/4, its last bar typically has…", ["Three beats", "Four beats", "One beat", "Five beats"], 0, "Pickup + last bar = one full bar."),
        ask("A shuffle feel is related to…", ["Triplets", "Sixteenths", "Whole notes", "Fermatas"], 0),
      ),
    ),
    lesson(
      "T2.12",
      "Rhythm reading workout",
      8,
      read("Count it, then name it", [
        "Mixed practice. Strategy: find the time signature, count a bar out loud (“1 & 2 & 3 & 4 &”), then place each note on its count. Rests take up their share of the bar, ties add, a dot adds half.",
      ]),
      quiz(
        ask("How many beats does this bar contain?", ["4", "3", "5", "6"], 0, "A quarter, two eighths, a half: 1 + 1 + 2.", { rhythm: "x-xxx---" }),
        ask("How many beats of rest are in this bar?", ["2", "1", "0", "4"], 0, "Two quarter rests.", { rhythm: "x-x-...." }),
        ask("A dotted quarter note lasts…", ["1½ beats", "2 beats", "¾ of a beat", "1 beat"], 0),
        ask("A quarter note tied to an eighth note lasts…", ["1½ beats", "2 beats", "1 beat", "¾ of a beat"], 0),
        ask("A dotted half note plus a quarter note fills a bar of…", ["4/4", "3/4", "2/4", "6/8"], 0),
        ask("Which time signature has three beats per bar?", ["3/4", "4/4", "2/2", "6/8 felt in two"], 0),
        ask("How many sixteenths equal a dotted quarter note?", ["6", "4", "8", "3"], 0, "Quarter = 4, dot adds 2."),
        ask("A bar of 6/8 holds the same length as…", ["Three quarter notes", "Four quarter notes", "Two quarter notes", "Six quarter notes"], 0, "Six eighths = three quarters."),
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
