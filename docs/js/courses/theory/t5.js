/* Theory 5: Chords. */
import { ask, card, course, lesson, quiz, read } from "../dsl.js";

const ch = (l, snd, gap = 0.04) => ({ l: "▶ " + l, snd, gap });
// spellChord:<root index>.<quality index>  (roots: C G D A E B F F♯ B♭ E♭ A♭ D♭, qualities: major minor 7 maj7 m7)
const SPELL = [];
for (const r of [0, 1, 2, 3, 4, 6]) for (const q of [0, 1]) SPELL.push("spellChord:" + r + "." + q);
for (const r of [0, 1, 2, 3, 4, 6]) SPELL.push("spellChord:" + r + ".2");

export const T5 = course(
  "T5",
  "Chords",
  "Triads, seventh chords, building chords from a scale, Roman numerals, progressions and slash chords.",
  [
    lesson(
      "T5.1",
      "What makes a chord",
      5,
      read("Stacks of thirds", [
        "A <b>chord</b> is three or more different notes sounded together. The simplest kind, a <b>triad</b>, has three notes stacked in <b>thirds</b>: take any note (the <b>root</b>), skip a letter to the 3rd above it, skip another to the 5th. C–E–G is a triad built on C.",
        "The three notes are called the <b>root</b>, the <b>third</b> and the <b>fifth</b>, because that is their interval above the root. The chord is named after the root.",
      ], { fig: { staff: { notes: ["C4", "E4", "G4"], stack: true, names: ["C E G"] }, cap: "C–E–G stacked in thirds: a C major triad." }, hear: [ch("C chord", [60, 64, 67]), { l: "▶ One note at a time", seq: [60, 64, 67], onsets: [0, 1, 2], tempo: 100 }] }),
      quiz(
        ask("How many notes are in a triad?", ["3", "2", "4", "5"], 0),
        ask("A triad is built by stacking…", ["Thirds", "Seconds", "Fourths", "Octaves"], 0),
        ask("The three notes of a triad are the root, the third and the…", ["Fifth", "Fourth", "Second", "Seventh"], 0),
        ask("A chord is named after its…", ["Root", "Fifth", "Highest note", "Loudest note"], 0),
        ask("Which notes make a C triad?", ["C E G", "C D E", "C F G", "C E A"], 0),
      ),
    ),
    lesson(
      "T5.2",
      "Major triads",
      6,
      read("1 – 3 – 5", [
        "A <b>major triad</b> uses the 1st, 3rd and 5th notes of the major scale starting on its root. The distances: a <b>major 3rd</b> (4 half steps) from root to third, then a <b>minor 3rd</b> (3 half steps) up to the fifth, which is a <b>perfect 5th</b> (7 half steps) above the root.",
        "C major: C E G. G major: G B D. D major: D F♯ A. F major: F A C. They all share this sound: bright and settled.",
      ], { figs: [{ staff: { notes: ["G3", "B3", "D4"], stack: true, names: ["G B D"] } }, { staff: { notes: ["D4", "F#4", "A4"], stack: true, names: ["D F♯ A"] } }], hear: [ch("C", [60, 64, 67]), ch("G", [55, 59, 62]), ch("D", [62, 66, 69])] }),
      quiz(
        ask("What are the notes of G major?", ["G B D", "G B♭ D", "G A D", "G C D"], 0),
        ask("What are the notes of D major?", ["D F♯ A", "D F A", "D G A", "D E A"], 0),
        ask("What are the notes of F major?", ["F A C", "F A♭ C", "F B♭ C", "F G C"], 0),
        ask("A major triad has which intervals above the root?", ["Major 3rd and perfect 5th", "Minor 3rd and perfect 5th", "Major 3rd and minor 7th", "Perfect 4th and perfect 5th"], 0),
        card("spellChord:0.0"),
        card("spellChord:1.0"),
      ),
    ),
    lesson(
      "T5.3",
      "Minor triads",
      6,
      read("Lower the third", [
        "A <b>minor triad</b> is the major triad with its third lowered by a half step: root, <b>minor 3rd</b> (3 half steps), perfect 5th. It sounds darker. A minor: A C E. E minor: E G B. D minor: D F A. G minor: G B♭ D.",
        "On the guitar, the open Em and Am are the same idea: they differ from E and A by one note moved down a fret.",
      ], { figs: [{ staff: { notes: ["A3", "C4", "E4"], stack: true, names: ["A C E"] } }, { staff: { notes: ["D4", "F4", "A4"], stack: true, names: ["D F A"] } }], hear: [ch("C major", [60, 64, 67]), ch("C minor", [60, 63, 67]), ch("Am", [57, 60, 64])] }),
      quiz(
        ask("What are the notes of A minor?", ["A C E", "A C♯ E", "A B E", "A C F"], 0),
        ask("What are the notes of E minor?", ["E G B", "E G♯ B", "E F B", "E G C"], 0),
        ask("What are the notes of D minor?", ["D F A", "D F♯ A", "D E A", "D F B"], 0),
        ask("How do you turn a major triad into a minor triad?", ["Lower the third by a half step", "Raise the fifth", "Lower the root", "Add a seventh"], 0),
        ask("Listen. Is this chord major or minor?", ["Minor", "Major", "Diminished", "Augmented"], 0, "", null, { snd: [60, 63, 67], gap: 0.04 }),
        card("spellChord:0.1"),
        card("spellChord:4.1"),
      ),
    ),
    lesson(
      "T5.4",
      "Spelling triads",
      7,
      read("A two-step method", [
        "To spell any major or minor triad: <b>1)</b> write the major scale from the root and take the 1st, 3rd and 5th notes. <b>2)</b> For a minor chord, lower the third by a half step.",
        "Example: B♭ major scale = B♭ C D E♭ F G A. Triad: B♭ D F. B♭ minor: B♭ D♭ F. Take it note by note; each letter should appear once, so the third of B♭ is D (not E♯ or C♯♯).",
      ], { fig: { staff: { notes: ["Bb3", "D4", "F4"], stack: true, names: ["B♭ D F"] } } }),
      quiz(
        card("spellChord:3.0"),
        card("spellChord:4.0"),
        card("spellChord:6.0"),
        card("spellChord:2.1"),
        card("spellChord:3.1"),
        card("spellChord:6.1"),
        ask("What is the third of A major?", ["C♯", "C", "B", "D"], 0, "The major scale of A: A B C♯ D E F♯ G♯."),
      ),
    ),
    lesson(
      "T5.5",
      "Diminished and augmented triads",
      6,
      read("Two odd ones", [
        "A <b>diminished</b> triad stacks two <b>minor</b> thirds: root, minor 3rd, <b>diminished 5th</b> (6 half steps). B diminished is B D F. It sounds tense and unsettled.",
        "An <b>augmented</b> triad stacks two <b>major</b> thirds: root, major 3rd, <b>augmented 5th</b> (8 half steps). C augmented is C E G♯. It sounds strange and floating, like a question.",
      ], { fig: { table: { head: ["Chord", "Pattern", "Example"], rows: [["Major", "M3 + m3", "C E G"], ["Minor", "m3 + M3", "C E♭ G"], ["Diminished", "m3 + m3", "C E♭ G♭"], ["Augmented", "M3 + M3", "C E G♯"]] } }, hear: [ch("C dim", [60, 63, 66]), ch("C aug", [60, 64, 68]), ch("C major", [60, 64, 67])] }),
      quiz(
        ask("A diminished triad is made of…", ["Two minor thirds", "Two major thirds", "A major then a minor third", "A minor then a major third"], 0),
        ask("An augmented triad is made of…", ["Two major thirds", "Two minor thirds", "A major then a minor third", "A perfect fourth and a fifth"], 0),
        ask("What are the notes of B diminished?", ["B D F", "B D♯ F♯", "B D F♯", "B D♭ F"], 0),
        ask("What are the notes of C augmented?", ["C E G♯", "C E♭ G", "C E G", "C F G"], 0),
        ask("Which triad has a diminished fifth?", ["Diminished", "Major", "Minor", "Augmented"], 0),
      ),
    ),
    lesson(
      "T5.6",
      "Seventh chords",
      7,
      read("A fourth note", [
        "Add the <b>7th</b> above the root on top of a triad and you get a seventh chord, giving a richer, jazzier sound. Three main kinds:",
        "• <b>Major 7th</b> (Cmaj7): major triad + major 7th = C E G B. Smooth and dreamy.<br>• <b>Dominant 7th</b> (C7): major triad + <b>minor</b> 7th = C E G B♭. Bluesy and tense, wants to resolve.<br>• <b>Minor 7th</b> (Cm7): minor triad + minor 7th = C E♭ G B♭. Mellow.",
      ], { fig: { table: { head: ["Chord", "Formula", "Notes (C)"], rows: [["Cmaj7", "1 3 5 7", "C E G B"], ["C7", "1 3 5 ♭7", "C E G B♭"], ["Cm7", "1 ♭3 5 ♭7", "C E♭ G B♭"]] } }, hear: [ch("Cmaj7", [60, 64, 67, 71]), ch("C7", [60, 64, 67, 70]), ch("Cm7", [60, 63, 67, 70])] }),
      quiz(
        card("spellChord:0.2"),
        card("spellChord:0.3"),
        card("spellChord:0.4"),
        card("spellChord:1.2"),
        card("spellChord:2.2"),
        ask("Which chord is major triad plus minor 7th?", ["Dominant 7th", "Major 7th", "Minor 7th", "Diminished"], 0),
        ask("Which chord has the notes C E G B?", ["Cmaj7", "C7", "Cm7", "Cdim"], 0),
      ),
    ),
    lesson(
      "T5.7",
      "Chords from a scale",
      7,
      read("A chord on every note", [
        "Build a triad on each note of the major scale, using only notes of the scale, and you get a family of chords that fit together. In every major key they follow the same pattern: <b>major, minor, minor, major, major, minor, diminished</b>.",
        "In C: <b>C – Dm – Em – F – G – Am – B°</b>. In G: <b>G – Am – Bm – C – D – Em – F♯°</b>. In D: <b>D – Em – F♯m – G – A – Bm – C♯°</b>. Songs in a key mostly use these chords.",
      ], { fig: { table: { head: ["Degree", "1", "2", "3", "4", "5", "6", "7"], rows: [["Quality", "major", "minor", "minor", "major", "major", "minor", "dim"], ["Key of C", "C", "Dm", "Em", "F", "G", "Am", "B°"], ["Key of G", "G", "Am", "Bm", "C", "D", "Em", "F♯°"], ["Key of D", "D", "Em", "F♯m", "G", "A", "Bm", "C♯°"]] } } }),
      quiz(
        ask("In the key of C, the chord on the 5th note is…", ["G", "F", "Am", "Em"], 0),
        ask("In the key of C, the chord on the 6th note is…", ["Am", "Dm", "Em", "G"], 0),
        ask("In the key of G, the chord on the 4th note is…", ["C", "D", "Em", "Am"], 0),
        ask("In the key of D, the chord on the 2nd note is…", ["Em", "G", "A", "Bm"], 0),
        ask("What are the qualities from degree 1 to 7?", ["Major, minor, minor, major, major, minor, diminished", "All major", "Major, major, minor, minor, major, minor, diminished", "Minor, minor, major, major, minor, major, diminished"], 0),
        ask("Which degree gives the diminished chord?", ["7th", "2nd", "5th", "4th"], 0),
      ),
    ),
    lesson(
      "T5.8",
      "Roman numerals and chord function",
      7,
      read("Chords as numbers", [
        "Musicians label chords with <b>Roman numerals</b> for their degree in the key: <b>I ii iii IV V vi vii°</b>. <b>Capital letters are major</b>, <b>lower case are minor</b>, and ° is diminished. This lets you talk about a progression in any key: “I–IV–V” means C–F–G in C, G–C–D in G.",
        "Chords also have <b>functions</b>: <b>I</b> (tonic) is home; <b>IV</b> (subdominant) moves away from home; <b>V</b> (dominant) creates tension that wants to return to I. Many songs simply move home → away → tension → home.",
      ], { fig: { table: { head: ["Numeral", "I", "ii", "iii", "IV", "V", "vi", "vii°"], rows: [["In C", "C", "Dm", "Em", "F", "G", "Am", "B°"], ["Function", "home", "leads to V", "home-ish", "away", "tension", "home-ish", "tension"]] } } }),
      quiz(
        ask("A lower-case Roman numeral (like vi) means…", ["A minor chord", "A major chord", "A seventh chord", "A bass note"], 0),
        ask("In G major, the IV chord is…", ["C", "D", "Em", "Am"], 0),
        ask("In D major, the V chord is…", ["A", "G", "Bm", "Em"], 0),
        ask("In C major, the vi chord is…", ["Am", "Dm", "F", "Em"], 0),
        ask("Which function creates tension that wants to resolve home?", ["V (dominant)", "I (tonic)", "IV (subdominant)", "ii"], 0),
        ask("I–IV–V in the key of A is…", ["A, D, E", "A, C, G", "A, E, F", "A, D, G"], 0),
      ),
    ),
    lesson(
      "T5.9",
      "Common progressions",
      7,
      read("Patterns that keep appearing", [
        "A <b>chord progression</b> is a sequence of chords. A few turn up in thousands of songs:",
        "• <b>I – IV – V</b> (C F G): folk, rock, country.<br>• <b>I – V – vi – IV</b> (C G Am F): a huge share of pop songs.<br>• <b>vi – IV – I – V</b> (Am F C G): the same four chords in a different order.<br>• <b>ii – V – I</b> (Dm G C): the standard jazz cadence.<br>• The <b>12-bar blues</b>: I I I I | IV IV I I | V IV I I.",
      ], { fig: { chart: { rows: [["G", "G", "G", "G"], ["C", "C", "G", "G"], ["D", "C", "G", "D"]] }, cap: "12-bar blues in G (the last bar often turns around to D)." } }),
      quiz(
        ask("I – V – vi – IV in the key of C is…", ["C G Am F", "C F G Am", "C Am F G", "C G F Am"], 0),
        ask("ii – V – I in the key of C is…", ["Dm G C", "Em A D", "F G C", "Am D G"], 0),
        ask("In a 12-bar blues in G, the four bars before the first change are…", ["G", "C", "D", "Em"], 0),
        ask("How many bars is a standard blues?", ["12", "8", "16", "4"], 0),
        ask("I – IV – V in the key of G is…", ["G C D", "G D A", "G Am Bm", "G F C"], 0),
        ask("Which is the same progression as C G Am F in the key of G?", ["G D Em C", "G C D Em", "G Em C D", "G Am Em C"], 0, "I–V–vi–IV in G: G, D, Em, C."),
      ),
    ),
    lesson(
      "T5.10",
      "Slash chords, inversions and suspensions",
      7,
      read("Which note is in the bass?", [
        "A <b>slash chord</b> like <b>C/E</b> means: play a C chord, but with <b>E</b> as the lowest note. Putting a chord tone other than the root in the bass is an <b>inversion</b>: C/E is first inversion, C/G second inversion. It makes bass lines move smoothly (C → C/B → Am, for example).",
        "<b>Suspended</b> chords replace the third. <b>Csus2</b> = C D G. <b>Csus4</b> = C F G. They have an open, unresolved sound and often move to the major or minor chord. <b>Cadd9</b> = C E G D adds the 9th (the same as the 2nd, an octave up) without a seventh.",
      ], { fig: { table: { head: ["Symbol", "Notes", "Idea"], rows: [["C", "C E G", "root position"], ["C/E", "E C G", "first inversion"], ["C/G", "G C E", "second inversion"], ["Csus2", "C D G", "2nd replaces 3rd"], ["Csus4", "C F G", "4th replaces 3rd"], ["Cadd9", "C E G D", "adds a 9th"]] } }, hear: [ch("C", [60, 64, 67]), ch("C/E", [52, 60, 67]), ch("Csus4", [60, 65, 67]), ch("Cadd9", [60, 64, 67, 74])] }),
      quiz(
        ask("C/E means…", ["A C chord with E in the bass", "An E chord with C in the bass", "C and E chords together", "C major then E minor"], 0),
        ask("What does sus4 do to a chord?", ["Replaces the third with the fourth", "Adds a 7th", "Makes it minor", "Lowers the root"], 0),
        ask("What are the notes of Csus2?", ["C D G", "C F G", "C E G", "C E♭ G"], 0),
        ask("A slash chord’s note after the slash is the…", ["Bass note", "Highest note", "Root of the key", "Fifth"], 0),
        ask("What are the notes of Csus4?", ["C F G", "C D G", "C E G", "C G B"], 0),
        ask("C/G is…", ["Second inversion", "Root position", "First inversion", "A seventh chord"], 0),
      ),
    ),
  ],
  { gen: (n) => Array.from({ length: n }, () => ({ card: SPELL[(Math.random() * SPELL.length) | 0] })) },
);
