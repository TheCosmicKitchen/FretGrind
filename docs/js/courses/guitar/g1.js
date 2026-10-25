/* Guitar 1: Meet your guitar. */
import { ask, card, course, lesson, practice, quiz, read } from "../dsl.js";

const OPEN = [52, 57, 62, 67, 71, 76];

export const G1 = course(
  "G1",
  "Meet your guitar",
  "Parts, holding it, tuning, reading tab and chord boxes, and good practice habits.",
  [
    lesson(
      "G1.1",
      "Parts of the guitar and how to hold it",
      5,
      read("Know the parts", [
        "From the top: the <b>headstock</b> carries the <b>tuning pegs</b>. The <b>nut</b> is a small ridge where the strings leave the headstock and start along the <b>neck</b>. The strips of metal across the neck are <b>frets</b>, and the flat surface they sit in is the <b>fretboard</b>.",
        "The <b>body</b> is the big part. On an acoustic guitar the <b>sound hole</b> lets the sound out. The strings end at the <b>bridge</b>. Your picking or strumming hand works over the sound hole.",
      ]),
      read("Sit and hold it", [
        "Sit up straight on a chair without arms. Rest the waist of the body on your thigh (the right one if you are right-handed) and hold the guitar close to your chest. The neck points slightly upward, not straight out.",
        "Your fretting hand cradles the neck: the <b>thumb rests behind the neck</b>, roughly opposite your middle finger, and your fingers curve over the strings. Your strumming forearm rests lightly on the top edge of the body. Left-handed players do all of this as a mirror image.",
        "To hold a pick, pinch it between the pad of your thumb and the side of your bent index finger. Only a small point should stick out.",
      ]),
      quiz(
        ask("Where are the tuning pegs?", ["On the headstock", "On the bridge", "Inside the sound hole", "On the nut"], 0),
        ask("What are the metal strips across the neck called?", ["Nuts", "Frets", "Bridges", "Pegs"], 1),
        ask("Where does your fretting-hand thumb usually go?", ["Over the top of the neck", "Behind the neck", "On the sound hole", "On the headstock"], 1, "Behind the neck gives your fingers room to curve over the strings."),
        ask("Where do the strings end on the body?", ["At the bridge", "At the nut", "At the pick guard", "At the headstock"], 0),
      ),
    ),
    lesson(
      "G1.2",
      "The six strings and tuning",
      6,
      read("Six strings, six names", [
        "The six strings, from the <b>thickest</b> (lowest sound) to the <b>thinnest</b> (highest), are <b>E A D G B E</b>. A memory trick: <b>E</b>ddie <b>A</b>te <b>D</b>ynamite, <b>G</b>ood <b>B</b>ye <b>E</b>ddie.",
        "Strings are also numbered, but the other way round: the <b>thinnest is string 1</b> and the thickest is string 6. So the low E is the 6th string and the high E is the 1st string.",
      ], { fig: { table: { head: ["String", "6th", "5th", "4th", "3rd", "2nd", "1st"], rows: [["Name", "E", "A", "D", "G", "B", "E"], ["Thickness", "thickest", "", "", "", "", "thinnest"]] } }, hear: [{ l: "▶ All six strings", seq: OPEN, onsets: [0, 1, 2, 3, 4, 5], tempo: 100 }, { l: "Low E", snd: [52] }, { l: "High E", snd: [76] }] }),
      read("Tuning", [
        "Guitars drift out of tune, especially new ones and after changing strings. Use a <b>clip-on tuner</b> or a free tuner app: pluck one string, read the display, and turn the matching peg until the needle sits in the middle.",
        "<b>Tightening a string raises its pitch</b>; loosening lowers it. Always tune <b>up</b> to the note. If the string is too high, loosen it past the note and then tighten back up to it, because that keeps it from slipping flat again.",
      ]),
      practice("Tune your guitar string by string, starting with the thickest: E, A, D, G, B, E. Pluck each one on its own, and use a tuner or tuner app.", { needs: "guitar" }),
      quiz(
        ask("What are the open strings, thickest to thinnest?", ["E A D G B E", "A B C D E F", "E B G D A E", "G D A E B E"], 0),
        ask("Which string is the 1st string?", ["The thinnest", "The thickest", "The middle one", "It depends on the guitar"], 0, "String numbers count from the thinnest up to the thickest."),
        ask("To raise the pitch of a string you…", ["Tighten the peg", "Loosen the peg", "Press the bridge", "Pluck harder"], 0),
        ask("Why tune up to the note instead of down to it?", ["The string is less likely to slip flat afterwards", "It sounds louder", "It protects the bridge", "It is easier to see on the tuner"], 0),
        ask("Which string is the thickest?", ["6th (low E)", "5th (A)", "1st (high e)", "3rd (G)"], 0),
      ),
    ),
    lesson(
      "G1.3",
      "Reading tab",
      6,
      read("Six lines, six strings", [
        "<b>Tablature</b> (tab) is a guitar-specific kind of notation. Instead of notes on a staff, you see six lines: one for each string. The <b>bottom line is the thickest string</b> (low E) and the <b>top line is the thinnest</b> (high e), as if you were looking down at the guitar in your lap.",
        "A <b>number</b> on a line is the <b>fret</b> to press on that string. <b>0 means play the string open</b>, with no finger down.",
      ], { fig: { tab: { cols: [[[0, 0]], [[1, 0]], [[2, 0]], [[3, 0]], [[4, 0]], [[5, 0]]], names: ["E", "A", "D", "G", "B", "e"] }, cap: "The six open strings, one after another." } }),
      read("Left to right is time", [
        "Read tab from left to right: numbers further left are played first. Numbers stacked in the same column are played <b>together</b> (that is how chords look). Most tab does not show how long each note lasts, so it is usually paired with a recording or with standard notation.",
      ], { fig: { tab: { cols: [[[0, 0]], [[0, 1]], [[0, 3]], [[1, 0]], [[1, 2]], [[1, 3]]] }, cap: "Low E string: open, fret 1, fret 3. Then the A string: open, fret 2, fret 3." }, hear: [{ l: "▶ Hear this", seq: [52, 53, 55, 57, 59, 60], onsets: [0, 1, 2, 3, 4, 5], tempo: 110 }] }),
      read("A chord in tab", ["Here three notes are in one column, so you play them at the same moment, a strum of the A string, D string and G string: that is the beginning of an E chord."], { fig: { tab: { cols: [[[1, 2], [2, 2], [3, 1]]] } } }),
      practice("Play the exercise in the tab above: low E string open, fret 1, fret 3, then the A string open, fret 2, fret 3. Press just behind the fret wire and pick slowly.", { needs: "guitar", fig: { tab: { cols: [[[0, 0]], [[0, 1]], [[0, 3]], [[1, 0]], [[1, 2]], [[1, 3]]] } } }),
      quiz(
        ask("In tab, which line is the thickest string?", ["The bottom line", "The top line", "The middle line", "The line with the clef"], 0),
        ask("What does a 0 mean in tab?", ["Play the string open", "Do not play this string", "Press the 10th fret", "Rest"], 0),
        ask("Which string and fret is this?", ["B string, fret 3", "B string, fret 2", "G string, fret 3", "e string, fret 3"], 0, "The 2nd line from the top is the 2nd string (B).", { tab: { cols: [[[4, 3]]] } }),
        ask("Numbers stacked in one column are played…", ["At the same time", "One after the other, bottom to top", "Very quietly", "Only once per bar"], 0),
        ask("What does tab not usually tell you?", ["How long each note lasts", "Which string to play", "Which fret to press", "The order of the notes"], 0),
      ),
    ),
    lesson(
      "G1.4",
      "Pressing the strings",
      6,
      read("How to fret a note", [
        "Press the string down with the <b>tip</b> of a finger, not the pad, so the finger is curved like a claw. Place it <b>just behind the fret wire</b> (on the side of the wire nearer the headstock), not in the middle of the space and not on top of the metal. Closer to the wire needs less pressure and gives a cleaner note.",
        "Press firmly enough that the note rings without buzzing, but no harder: squeezing too tightly just tires your hand.",
      ]),
      read("Number your fingers", [
        "Fingering is always described with numbers: <b>1 = index, 2 = middle, 3 = ring, 4 = little finger</b>. The thumb is not numbered. Typically one finger takes one fret: finger 1 plays fret 1, finger 2 fret 2, and so on, called playing in <b>position</b>.",
        "Sore fingertips are normal for the first couple of weeks. Short sessions, several times a day, build up the callus faster than one long session.",
      ]),
      practice("The 1-2-3-4 warm-up: on the low E string play fret 1 with finger 1, fret 2 with finger 2, fret 3 with finger 3, fret 4 with finger 4. Then do the same on the A string, then the D string. Go slowly and keep every finger curved.", { needs: "guitar", fig: { tab: { cols: [[[0, 1]], [[0, 2]], [[0, 3]], [[0, 4]], [[1, 1]], [[1, 2]], [[1, 3]], [[1, 4]]] } } }),
      quiz(
        ask("Which finger is number 3?", ["Ring finger", "Middle finger", "Index finger", "Little finger"], 0),
        ask("Where should the fretting finger sit?", ["Just behind the fret wire", "On top of the fret wire", "In the middle of the space", "Just past the fret wire"], 0),
        ask("Which part of the finger touches the string?", ["The tip", "The flat pad", "The knuckle", "The nail only"], 0),
        ask("In the 1-2-3-4 exercise, which finger plays fret 3?", ["Finger 3", "Finger 1", "Finger 2", "Finger 4"], 0),
        ask("What helps sore fingertips toughen up fastest?", ["Short sessions several times a day", "One two-hour session a week", "Pressing as hard as possible", "Using only the thumb"], 0),
      ),
    ),
    lesson(
      "G1.5",
      "Picking the strings",
      5,
      read("Down and up", [
        "With a pick, a <b>downstroke</b> moves toward the floor (symbol <b>⊓</b> or ↓) and an <b>upstroke</b> moves toward the ceiling (symbol <b>V</b> or ↑). Moving down-up-down-up on single notes is called <b>alternate picking</b>, and it is the foundation of fast, even playing.",
        "Rest your picking hand lightly, keep the wrist loose, and let the pick brush each string cleanly. Play each open string and say its name aloud.",
      ], { hear: [{ l: "A steady pulse", seq: [52, 52, 52, 52], onsets: [0, 1, 2, 3], tempo: 90 }] }),
      practice("Play each open string four times with downstrokes only, naming it as you go: E E E E, A A A A, D D D D, G G G G, B B B B, e e e e. Keep a steady beat (about 60 beats per minute).", { needs: "guitar" }),
      practice("Now alternate: down-up-down-up on each open string. Count “1 and 2 and 3 and 4 and”. Down-strokes are on the numbers, up-strokes on the “and”.", { needs: "guitar" }),
      quiz(
        ask("When you play down-up-down-up on single notes you are…", ["Alternate picking", "Strumming a chord", "Tuning", "Muting"], 0),
        ask("In the count “1 and 2 and”, the upstrokes fall on…", ["The “and”s", "The numbers", "Only the 1", "Nowhere in particular"], 0),
        ask("A downstroke moves…", ["Toward the floor", "Toward the ceiling", "Toward the headstock", "Sideways"], 0),
        ask("How should you hold the pick?", ["Pinched between thumb and the side of the index finger", "In your fist", "With all five fingers", "Between index and middle finger"], 0),
      ),
    ),
    lesson(
      "G1.6",
      "Reading chord boxes",
      6,
      read("A picture of the neck", [
        "A <b>chord box</b> (chord diagram) is a picture of the neck, as if you stood the guitar up and looked at it from the front. The <b>six vertical lines are the strings</b>: thickest on the left, thinnest on the right. The <b>horizontal lines are frets</b>; the thick line at the top is the nut.",
        "A <b>dot</b> shows where to put a finger. An <b>○</b> above a string means play it open. An <b>×</b> means do not play that string. A string with neither is just being held down by a dot.",
      ], { fig: { chords: ["Em", "A", "D"], cap: "Em plays all six strings; A skips the low E; D skips both low strings." } }),
      read("Names and shapes", [
        "The letter above a diagram is the chord’s name. You will learn a handful of chords in the next course. For now just practise reading: count which strings are played, and which frets the dots are on.",
      ]),
      quiz(
        ask("In a chord box the thickest string is on the…", ["Left", "Right", "Middle", "It varies"], 0),
        ask("What does an × above a string mean?", ["Do not play that string", "Play it open", "Press hard", "Use finger 4"], 0),
        ask("How many strings are played in this chord?", ["6", "5", "4", "3"], 1, "The × on the thickest string means skip it.", { chords: ["A"] }),
        ask("How many strings are played in this chord?", ["6", "5", "4", "3"], 2, "Two × marks: only the four thinnest strings are played.", { chords: ["D"] }),
        card("chord:Em"),
        card("chord:D"),
      ),
    ),
    lesson(
      "G1.7",
      "How to practise",
      5,
      read("Little and often", [
        "A short, regular habit beats an occasional marathon. <b>Ten to fifteen minutes every day</b> builds your hands and your memory much faster than two hours once a week, and it is easier to keep up. The daily plan on the Learn tab is built for exactly that.",
        "Warm up slowly. Start with an easy exercise (like the 1-2-3-4 warm-up), then work on the new thing, then finish by playing something you enjoy.",
      ]),
      read("Slow, then faster", [
        "Play new material <b>slowly enough to get it right every time</b>. Speed only comes from accurate repetition. Add a metronome (there is one in the Practice tab) and only speed it up when you can play the passage three times in a row without mistakes.",
        "If your hand or wrist hurts, stop. Tension and pain are signs to rest, shake out your hands and check your posture. Keep your guitar in tune and away from heat or damp, and change your strings now and then so it keeps its bright sound.",
      ]),
      quiz(
        ask("Which routine works best for most beginners?", ["10–15 minutes every day", "Three hours every Sunday", "Only when you feel inspired", "Playing as fast as you can"], 0),
        ask("When learning something new you should first play it…", ["Slowly and accurately", "At full speed", "Without looking, to be brave", "Only once"], 0),
        ask("Your hand hurts while practising. You should…", ["Stop and rest", "Press harder", "Play through it", "Tune the guitar"], 0),
        ask("When is it time to raise the metronome speed?", ["After playing it cleanly three times in a row", "After one try", "Never", "As soon as you feel bored"], 0),
      ),
    ),
  ],
  { gen: (n) => Array.from({ length: n }, () => ({ card: "chord:" + ["Em", "A", "D", "E", "Am"][(Math.random() * 5) | 0] })) },
);
