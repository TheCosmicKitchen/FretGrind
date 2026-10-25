/* Guitar 3: First chords. */
import { ask, card, course, hearChord as hc, lesson, practice, quiz, read } from "../dsl.js";

const names = ["Em", "Am", "E", "A", "D", "Dm", "C", "G", "E7", "A7", "D7"];

export const G3 = course(
  "G3",
  "First chords",
  "The open chords every guitarist learns first: Em, Am, E, A, D, Dm, C, G and the sevenths.",
  [
    lesson(
      "G3.1",
      "What is a chord? Your first chord, Em",
      7,
      read("Notes played together", [
        "A <b>chord</b> is three or more notes sounding at once. On the guitar you press down a few strings with your fretting hand and strum across them all together. Because many of the strings are left open, the easiest chords use very few fingers.",
        "The name has a letter (the chord’s <b>root</b>, its “home” note) and sometimes extra marks. A plain letter, like E, means a <b>major</b> chord, which sounds bright. A small <b>m</b> after the letter, like Em, means <b>minor</b>, which sounds darker or sadder.",
      ]),
      read("Em: E minor", [
        "The easiest chord on the guitar: two fingers and all six strings. Put <b>finger 2 on the 5th string (A), fret 2</b> and <b>finger 3 on the 4th string (D), fret 2</b>. Every other string is open. Strum all six strings, starting from the thickest.",
        "Check each string rings out: pick them one at a time from the thickest to the thinnest. If one is muffled or buzzes, a finger is probably touching it. Curve your fingers more and press with the tips.",
      ], { fig: { chords: ["Em"] }, hear: [hc("Em")] }),
      practice("Make the Em shape. Strum it slowly four times with downstrokes, counting 1-2-3-4. Lift your hand off, then make the shape again. Repeat ten times.", { needs: "guitar", fig: { chords: ["Em"] } }),
      quiz(
        ask("What does an m after a chord letter mean?", ["Minor", "Major", "Muted", "Middle"], 0),
        ask("A plain letter, like E, is a…", ["Major chord", "Minor chord", "Single note", "Seventh chord"], 0),
        ask("In Em, which strings are pressed down?", ["The 5th and 4th strings", "The 6th and 1st strings", "All six", "Only the 3rd string"], 0, "The A and D strings, both at fret 2. The rest are open.", { chords: ["Em"] }),
        ask("Which description fits a chord?", ["Three or more notes at once", "One note played loud", "Two notes in a row", "A kind of strum"], 0),
        card("chord:Em"),
      ),
    ),
    lesson(
      "G3.2",
      "Am: A minor",
      6,
      read("Looks like a pyramid", [
        "Am has three fingers: <b>finger 1 on the 2nd string (B), fret 1</b>, <b>finger 2 on the 4th string (D), fret 2</b> and <b>finger 3 on the 3rd string (G), fret 2</b>. Strum from the <b>5th string</b> down (the open A) and leave the low E string alone: it is not in the chord.",
        "Compare it with Em: the shape is the same two-fret-2 fingers plus one more, only one string higher. If you can play Em, you can find Am.",
      ], { fig: { chords: ["Am", "Em"] }, hear: [hc("Am"), hc("Em")] }),
      practice("Switch between Em and Am slowly, four strums each, and count out loud. Don’t worry about speed: aim for the shape to be ready before the strum.", { needs: "guitar", fig: { chords: ["Em", "Am"] } }),
      quiz(
        ask("Which string do you leave out when strumming Am?", ["The 6th (low E)", "The 1st (high e)", "The 3rd (G)", "None: strum all six"], 0, "The × over the thickest string says: do not play it.", { chords: ["Am"] }),
        ask("Which finger goes on the 2nd string, fret 1 in Am?", ["Finger 1", "Finger 2", "Finger 3", "Finger 4"], 0),
        card("chord:Am"),
        card("chord:Em"),
      ),
    ),
    lesson(
      "G3.3",
      "E and A (major)",
      7,
      read("E major", [
        "E is Em with <b>one more finger</b>: add <b>finger 1 on the 3rd string (G), fret 1</b>. Finger 2 sits on the 5th string fret 2 and finger 3 on the 4th string fret 2, just as in Em. Strum all six strings. That one finger changes the sound from dark to bright, because it moves the middle note of the chord from G (minor third) to G♯ (major third).",
      ], { fig: { chords: ["Em", "E"] }, hear: [hc("Em"), hc("E")] }),
      read("A major", [
        "For A, use <b>fingers 1, 2 and 3 side by side on fret 2</b> of the 4th, 3rd and 2nd strings (D, G and B). Strum from the 5th string and skip the low E. If your fingers don’t fit, try fingers 2, 3 and 4, or squeeze them into a neat row, tips together.",
      ], { fig: { chords: ["A"] }, hear: [hc("A")] }),
      practice("Play E, then A, then Em, then Am, four strums each, in a loop. Slow beats fast: if it is messy, slow down.", { needs: "guitar", fig: { chords: ["E", "A", "Em", "Am"] } }),
      quiz(
        ask("How is E different from Em?", ["One extra finger, on the G string fret 1", "It has no open strings", "It is played on the 5th fret", "It skips the low E string"], 0),
        ask("Which strings do you strum for A?", ["The 5 thinnest strings", "All six", "The 4 thinnest strings", "Only the 3 thinnest"], 0),
        card("chord:E"),
        card("chord:A"),
        card("chord:Am"),
      ),
    ),
    lesson(
      "G3.4",
      "D and Dm",
      6,
      read("D major", [
        "D uses only the four thinnest strings, so don’t strum the 6th and 5th. Make a small triangle: <b>finger 1 on the 3rd string (G) fret 2</b>, <b>finger 3 on the 2nd string (B) fret 3</b>, <b>finger 2 on the 1st string (e) fret 2</b>. It is a bright, open sound.",
        "Strum from the open D string (4th) downward. Aim your first downstroke at the D string to avoid the lower two.",
      ], { fig: { chords: ["D"] }, hear: [hc("D")] }),
      read("Dm: D minor", [
        "Dm uses the same strings as D: <b>finger 2 on the 3rd string (G), fret 2</b>, <b>finger 3 on the 2nd string (B), fret 3</b>, and <b>finger 1 on the 1st string (e), fret 1</b>. Compared with D, only the top string moves, from fret 2 down to fret 1, and that half step turns the bright chord into a sad one.",
      ], { fig: { chords: ["D", "Dm"] }, hear: [hc("D"), hc("Dm")] }),
      practice("Strum D four times, then Dm four times, then back. Make sure the 6th and 5th strings stay silent: start each strum on the D string.", { needs: "guitar", fig: { chords: ["D", "Dm"] } }),
      quiz(
        ask("Which strings do you strum for D?", ["The 4 thinnest", "All six", "The 5 thinnest", "Only the thickest 3"], 0),
        ask("What changes between D and Dm?", ["The high e string goes from fret 2 to fret 1", "The shape moves up 2 frets", "A barre is added", "One string is dropped"], 0),
        card("chord:D"),
        card("chord:Dm"),
      ),
    ),
    lesson(
      "G3.5",
      "C major",
      6,
      read("A staircase of fingers", [
        "C is a diagonal: <b>finger 3 on the 5th string (A), fret 3</b>, <b>finger 2 on the 4th string (D), fret 2</b>, <b>finger 1 on the 2nd string (B), fret 1</b>. The 3rd (G) and 1st (e) strings ring open. Strum from the 5th string and skip the low E.",
        "A common problem: finger 1 touching the thin e string and muting it, or finger 3 bumping the low E. Curve your fingers and keep the thumb low behind the neck.",
      ], { fig: { chords: ["C"] }, hear: [hc("C")] }),
      practice("Make the C shape and pick each string one at a time, from the A string up: do all five ring out cleanly? If not, adjust the finger that’s muting. Then strum it four times.", { needs: "guitar", fig: { chords: ["C"] } }),
      practice("Now alternate C and Am slowly: they share finger 1 and finger 2, so only finger 3 moves. Four strums each.", { needs: "guitar", fig: { chords: ["C", "Am"] } }),
      quiz(
        ask("Which string does finger 3 press in C?", ["The 5th (A), fret 3", "The 6th (E), fret 3", "The 4th (D), fret 3", "The 3rd (G), fret 3"], 0, "The ring finger sits on the A string at fret 3.", { chords: ["C"] }),
        ask("Which string do you leave out when strumming C?", ["The low E", "The high e", "The G", "None"], 0),
        card("chord:C"),
        card("chord:Am"),
      ),
    ),
    lesson(
      "G3.6",
      "G major",
      7,
      read("A big, ringing chord", [
        "G uses all six strings, with fingers at both ends of the neck. Place <b>finger 3 on the 6th string (low E), fret 3</b>, <b>finger 2 on the 5th string (A), fret 2</b>, and <b>finger 4 on the 1st string (e), fret 3</b>. The 4th, 3rd and 2nd strings ring open. (Many players use fingers 2, 1 and 3 instead, which suits some hands better. Use whichever feels natural.)",
      ], { fig: { chords: ["G"] }, hear: [hc("G")] }),
      practice("Make the G shape, strum six strings, and check that they all ring. The tip of finger 2 may touch the D string: tilt it and keep the fingers curved.", { needs: "guitar", fig: { chords: ["G"] } }),
      quiz(
        ask("How many strings do you strum for G?", ["6", "5", "4", "3"], 0),
        ask("Which strings ring open in G?", ["The 4th, 3rd and 2nd", "The 6th and 5th", "Only the 1st", "None of them"], 0, "D, G and B ring open.", { chords: ["G"] }),
        card("chord:G"),
        card("chord:C"),
        card("chord:E"),
      ),
    ),
    lesson(
      "G3.7",
      "Seventh chords: E7, A7, D7",
      7,
      read("An unfinished sound", [
        "A <b>7</b> chord (a dominant seventh) adds one extra note to a major chord, which makes it sound tense, as if it wants to go somewhere. You hear it constantly in blues, folk and country, and it usually leads to the chord a fifth below it (E7 → A, A7 → D, D7 → G).",
        "Three easy ones: <b>E7</b> is E with finger 3 lifted off (the D string rings open). <b>A7</b> is A with the finger on the G string lifted. <b>D7</b> is a different shape: fingers on the G string fret 2, B string fret 1 and e string fret 2.",
      ], { fig: { chords: ["E7", "A7", "D7"] }, hear: [hc("E7"), hc("A7"), hc("D7")] }),
      practice("Play E7 then A then D7 then G in a slow loop (four strums each).", { needs: "guitar", fig: { chords: ["E7", "A", "D7", "G"] } }),
      quiz(
        ask("A dominant seventh chord (like E7) sounds…", ["Tense, wanting to resolve", "Calm and finished", "Like a power chord", "Like a single note"], 0),
        ask("How do you turn E into E7 (open position)?", ["Lift finger 3 off the D string", "Add a barre", "Add finger 4", "Move up two frets"], 0),
        ask("Which chord does D7 usually lead to?", ["G", "Em", "A", "C"], 0, "A dominant seventh resolves to the chord a fifth below it: D7 → G."),
        card("chord:E7"),
        card("chord:A7"),
        card("chord:D7"),
      ),
    ),
    lesson(
      "G3.8",
      "Clean chords and chord check",
      6,
      read("Fixing buzz and mute", [
        "<b>Buzzing</b> usually means a finger is too far from the fret wire or pressing too softly: move it closer to the wire and press with a little more weight. <b>Dead (muted) strings</b> mean another finger or a flat fingertip is touching a neighbouring string: curve your fingers so only the tips touch.",
        "Check every chord by picking the strings one at a time: all should ring clearly. Do this daily as part of your warm-up. It takes two minutes and is the biggest single improvement to your sound.",
      ]),
      quiz(
        ask("A string is buzzing. The most likely fix is…", ["Press closer to the fret wire", "Press farther from the wire", "Retune the guitar", "Use a thinner pick"], 0),
        ask("A string is silent (dead). The most likely cause is…", ["A finger touching it", "Strings that are too thick", "Using a pick", "A loose peg"], 0),
        card("chord:Em"),
        card("chord:Am"),
        card("chord:E"),
        card("chord:A"),
        card("chord:D"),
        card("chord:Dm"),
        card("chord:C"),
        card("chord:G"),
      ),
    ),
  ],
  { gen: (n) => Array.from({ length: n }, () => ({ card: "chord:" + names[(Math.random() * names.length) | 0] })) },
);
