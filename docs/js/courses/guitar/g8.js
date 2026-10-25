/* Guitar 8: Barre chords and the capo. */
import { ask, card, course, hearChord as hc, lesson, practice, quiz, read } from "../dsl.js";

export const G8 = course(
  "G8",
  "Barre chords and the capo",
  "Moveable chord shapes, the barre, power chords and changing key with a capo.",
  [
    lesson(
      "G8.1",
      "The barre",
      7,
      read("One finger, many strings", [
        "A <b>barre</b> (say “bar”) is when one finger lies flat across several strings at the same fret, acting like a movable nut. It lets you play a chord shape anywhere on the neck, because there are no open strings left to give the chord its name.",
        "Lay your index finger across all six strings just behind the fret wire, turned slightly so the bony side presses. Rest your thumb behind the neck, roughly behind the index finger. Press with the weight of your arm rather than squeezing. Expect it to feel difficult for weeks: that is normal, and a good barre comes with strength you build gradually.",
      ]),
      practice("Place your index finger across all six strings at the 1st fret and pluck each string one at a time. Don’t worry if some buzz: keep adjusting where the finger lies and how much pressure you use. Do it for a minute at a time, then rest.", { needs: "guitar" }),
      quiz(
        ask("A barre is…", ["One finger pressing several strings at once", "Two fingers on one string", "A strumming pattern", "Playing with a capo"], 0),
        ask("Where does the barring finger go?", ["Just behind a fret wire", "On top of a fret wire", "In the middle of the fret", "Between two strings"], 0),
        ask("How do you get enough pressure?", ["Use arm weight and a good position, not a hard squeeze", "Squeeze with the thumb as hard as possible", "Use your pinky", "Use a thicker pick"], 0),
        ask("Why are barre chords moveable?", ["No open strings: the shape works at any fret", "They are played with a pick", "They have fewer notes", "They use thinner strings"], 0),
      ),
    ),
    lesson(
      "G8.2",
      "F major: the E shape",
      8,
      read("Em’s big brother", [
        "Take the open <b>E</b> chord and slide the whole shape up one fret. The open strings are now covered by your index finger as a barre across fret 1. That is the <b>F major</b> chord: index finger barres all six strings at fret 1, finger 2 on the G string at fret 2, finger 3 on the A string at fret 3 and finger 4 on the D string at fret 3.",
        "You name this chord by the note on the <b>low E string</b> under your barre: that note is the root.",
      ], { fig: { chords: ["E", "F"] }, hear: [hc("E"), hc("F")] }),
      read("Slide it anywhere", ["Because the shape is moveable, the same fingering one fret higher is F♯, at the 3rd fret it is G, at the 5th fret A, at the 7th fret B, at the 8th fret C, at the 10th D, at the 12th E again. Use what you learned about the notes on the low E string."], { fig: { table: { head: ["Barre fret", "1", "3", "5", "7", "8", "10"], rows: [["Chord", "F", "G", "A", "B", "C", "D"]] } } }),
      practice("Make the F shape at fret 1, then move it up to fret 3 (G), then back down. Strum slowly and listen to whether every string rings; adjust until it does.", { needs: "guitar", fig: { chords: ["F"] } }),
      quiz(
        ask("A barre chord using the E shape at the 3rd fret is…", ["G", "A", "F", "B"], 0, "Fret 3 on the low E string is G.", { chords: ["F"] }),
        ask("A barre chord using the E shape at the 5th fret is…", ["A", "G", "B", "C"], 0),
        ask("A barre chord using the E shape at the 8th fret is…", ["C", "B", "D", "A"], 0),
        ask("How do you name a barre chord in the E shape?", ["By the note on the low E string under the barre", "By the highest note", "By the number of fingers", "By the tempo"], 0),
        card("chord:F"),
      ),
    ),
    lesson(
      "G8.3",
      "Bm: the A shape",
      8,
      read("A different shape, same idea", [
        "The open A-minor shape moves too. Slide it up two frets and a barre at fret 2 takes the place of the open strings: that is <b>Bm</b>. Index finger barres strings 5 to 1 at fret 2, finger 3 goes on the D string at fret 4, finger 4 on the G string at fret 4, and finger 2 on the B string at fret 3.",
        "This shape’s root is on the <b>5th string</b> (A). With the barre at fret 2, the 5th string is B, so it is B minor. Skip the low E string.",
      ], { fig: { chords: ["Am", "Bm"] }, hear: [hc("Am"), hc("Bm")] }),
      read("Two families", ["Moveable chords come from two families: the <b>E shape</b> (root on the 6th string) and the <b>A shape</b> (root on the 5th). Knowing the notes on those two strings lets you play any major or minor chord."], { fig: { table: { head: ["Shape", "Root on", "Example"], rows: [["E shape", "6th string", "F at fret 1"], ["A shape", "5th string", "Bm at fret 2"]] } } }),
      practice("Make the Bm shape at fret 2 and strum the five thinnest strings. Move it up one fret (Cm) and back. Work on getting a clear sound from every string.", { needs: "guitar", fig: { chords: ["Bm"] } }),
      quiz(
        ask("In the A-shape barre chord, the root is on…", ["The 5th string", "The 6th string", "The 4th string", "The 1st string"], 0),
        ask("A-shape barre chord with the barre at the 2nd fret has root…", ["B", "A", "C", "D"], 0, "Fret 2 on the A string is B."),
        ask("Which string do you skip when strumming the A shape?", ["The 6th (low E)", "The 1st (high e)", "The 3rd", "None"], 0),
        card("chord:Bm"),
      ),
    ),
    lesson(
      "G8.4",
      "The capo",
      7,
      read("A movable nut", [
        "A <b>capo</b> is a clamp that you fix across the neck at a fret. It shortens all the strings, so every string sounds higher by one half step for each fret the capo moves up. It lets you use easy open chord shapes in any key.",
        "The shapes stay the same, but the names change. <b>New chord = shape you play, moved up by the capo fret in half steps.</b> Playing a G shape with the capo at fret 2 sounds an <b>A</b>. A C shape with the capo at fret 2 sounds a <b>D</b>.",
      ], { fig: { table: { head: ["Capo fret", "0", "1", "2", "3", "4", "5", "7"], rows: [["G shape sounds", "G", "A♭", "A", "B♭", "B", "C", "D"], ["C shape sounds", "C", "D♭", "D", "E♭", "E", "F", "G"]] } } }),
      read("Why use one", ["A singer’s voice often sits better in a different key from the one you know the shapes for. Instead of learning difficult barre chords you can clamp a capo and keep the easy shapes. It also gives a brighter, chiming sound."]),
      quiz(
        ask("A capo at fret 2 with a G shape sounds like…", ["A", "G", "B", "F"], 0),
        ask("A capo at fret 5 with a G shape sounds like…", ["C", "D", "E", "F"], 0, "Five half steps above G is C."),
        ask("A capo at fret 4 with a C shape sounds like…", ["E", "D", "F", "G"], 0),
        ask("Each fret of capo raises all the strings by…", ["One half step", "One whole step", "An octave", "A third"], 0),
        ask("What does a capo let you do?", ["Use easy shapes in different keys", "Tune the guitar", "Play louder", "Play without frets"], 0),
      ),
    ),
    lesson(
      "G8.5",
      "Reading capo instructions",
      7,
      read("“Capo 3, play in G”", [
        "Chord sheets often tell you the capo fret and the shapes to play. “<b>Capo 3, play in G</b>” means: put the capo on fret 3 and play G-family shapes (G, C, D, Em…). The actual sound is three half steps higher: B♭.",
        "To work out what key you are really in: <b>shape key + capo fret</b>, counted in half steps. For example: shapes in D, capo 4 → F♯; shapes in A, capo 2 → B; shapes in C, capo 7 → G.",
      ]),
      quiz(
        ask("“Capo 3, play in G” sounds in the key of…", ["B♭", "G", "A", "C"], 0, "Three half steps above G: G♯/A♭ → A → B♭.", { table: { head: ["Shapes", "Capo", "Sounds"], rows: [["G", "3", "?"]] } }),
        ask("Shapes in D with the capo at fret 2 sound in…", ["E", "D", "F", "C"], 0),
        ask("Shapes in C with the capo at fret 5 sound in…", ["F", "G", "E", "D"], 0),
        ask("Shapes in E with the capo at fret 3 sound in…", ["G", "F", "A", "D"], 0, "E up three half steps: F, F♯, G."),
        ask("Shapes in A with the capo at fret 4 sound in…", ["C♯", "C", "D", "B"], 0),
      ),
    ),
    lesson(
      "G8.6",
      "Power chords",
      7,
      read("Two notes and an octave", [
        "A <b>power chord</b> (written like <b>G5</b>) has only the root and the fifth (sometimes doubled an octave up). It is neither major nor minor, so it works with either and is a rock-guitar staple. It is also the simplest moveable shape.",
        "Root on the <b>6th string</b> at fret n, finger 3 or 4 two frets higher on the <b>5th string</b> (the fifth) and the same on the <b>4th string</b>. Strum only those three strings. At fret 3 this is G5; at fret 5, A5; at fret 7, B5; at fret 8, C5.",
      ], { fig: { tab: { cols: [[[0, 3], [1, 5], [2, 5]]] }, cap: "G5: low E fret 3, A string fret 5, D string fret 5." } }),
      practice("Play the power chord G5 at fret 3, then slide it to A5 at fret 5, then C5 at fret 8, then back. Mute the unused strings with the side of your index finger if they ring.", { needs: "guitar", fig: { tab: { cols: [[[0, 3], [1, 5], [2, 5]], [[0, 5], [1, 7], [2, 7]], [[0, 8], [1, 10], [2, 10]]] } } }),
      quiz(
        ask("A power chord contains…", ["The root and the fifth", "Root, third, fifth and seventh", "Only the root", "The root and the third"], 0),
        ask("A power chord with its root on low E fret 5 is…", ["A5", "G5", "B5", "C5"], 0),
        ask("Is a power chord major or minor?", ["Neither", "Major", "Minor", "Both"], 0, "It has no third."),
        ask("Where is the fifth of a 6th-string-root power chord?", ["On the 5th string, two frets higher", "On the 6th string", "On the 1st string", "On the 4th string, one fret lower"], 0),
      ),
    ),
  ],
);
