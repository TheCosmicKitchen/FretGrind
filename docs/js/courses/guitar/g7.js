/* Guitar 7: Fingerstyle basics. */
import { ask, card, course, hearChord as hc, lesson, practice, quiz, read } from "../dsl.js";

const OPEN = [52, 57, 62, 67, 71, 76];
const tab = (cols, names) => ({ tab: { cols, cw: 30, ...(names ? { names } : {}) } });
const hear = (cols, tempo = 110, l = "▶ Hear it", gap) => ({ l, seq: cols.flat().map(([s, f]) => OPEN[s] + f), onsets: cols.flatMap((c, i) => c.map(() => i)), tempo });

const AM_ARP = [[[1, 0]], [[3, 2]], [[4, 1]], [[5, 0]], [[4, 1]], [[3, 2]]];
const C_ALT = [[[1, 3]], [[2, 2]], [[1, 3]], [[2, 2]], [[1, 3]], [[2, 2]], [[1, 3]], [[2, 2]]];

export const G7 = course(
  "G7",
  "Fingerstyle basics",
  "Plucking with the fingers: finger names, arpeggios, alternating bass and folk accompaniment.",
  [
    lesson(
      "G7.1",
      "Thumb and fingers",
      6,
      read("p, i, m, a", [
        "In fingerstyle you pluck the strings with your thumb and fingers instead of using a pick. Letters from classical guitar name the fingers: <b>p</b> (thumb), <b>i</b> (index), <b>m</b> (middle), <b>a</b> (ring). The little finger stays out of the way.",
        "A reliable starting arrangement: the <b>thumb (p) plays the three thick strings</b> (6, 5, 4) and each finger has its own thin string: <b>i on the 3rd string (G), m on the 2nd (B), a on the 1st (e)</b>.",
        "Keep your hand relaxed, fingertips curved, and pluck by curling the finger in toward your palm. Keep your fingernails short and smooth, or use the flesh of the fingertip.",
      ], { fig: { table: { head: ["Finger", "p", "i", "m", "a"], rows: [["Plays", "6th, 5th, 4th", "3rd (G)", "2nd (B)", "1st (e)"]] } } }),
      practice("Make an Em shape and pluck each string once, slowly: thumb on the 6th, 5th and 4th strings, then i on the G, m on the B, a on the high e. Let each note ring.", { needs: "guitar", fig: { chords: ["Em"] } }),
      quiz(
        ask("Which finger does the letter ‘m’ stand for?", ["Middle", "Thumb", "Index", "Ring"], 0),
        ask("In the basic assignment, which string does finger ‘a’ pluck?", ["The 1st (high e)", "The 6th", "The 3rd", "The 2nd"], 0),
        ask("Which strings does the thumb normally play?", ["The three thickest", "The three thinnest", "Only the high e", "All six"], 0),
        ask("Which letter is the thumb in fingerstyle notation?", ["p", "i", "m", "a"], 0),
      ),
    ),
    lesson(
      "G7.2",
      "Your first arpeggio",
      7,
      read("A broken chord", [
        "An <b>arpeggio</b> is a chord played one note at a time instead of strummed. A classic pattern is <b>p – i – m – a – m – i</b>: thumb on the bass note, then up through the strings and back down. That is six notes, perfect for a bar of 3/4 or 6/8.",
        "Here it is on Am: the thumb plays the open A string, then the fingers play the G string (fret 2), the B string (fret 1), the high e string (open), then back down the B and G strings.",
      ], { fig: { ...tab(AM_ARP, ["p", "i", "m", "a", "m", "i"]) }, hear: [hear(AM_ARP, 130)] }),
      practice("Make an Am chord and play the pattern slowly, over and over. Let the notes ring into each other. Then try the same pattern on Em (bass on the low E string, i on G, m on B, a on high e).", { needs: "guitar", fig: tab(AM_ARP, ["p", "i", "m", "a", "m", "i"]) }),
      quiz(
        ask("An arpeggio is…", ["A chord played one note at a time", "A very fast strum", "A single high note", "A chord with a barre"], 0),
        ask("In p-i-m-a-m-i, how many notes are played?", ["6", "4", "8", "3"], 0),
        ask("On Am, which string does the thumb pluck in this pattern?", ["The open A string", "The low E string", "The high e string", "The D string"], 0),
        ask("Which fingers play the strings in order after the thumb?", ["i, m, a, m, i", "a, m, i", "m, i, a", "i, i, i"], 0),
      ),
    ),
    lesson(
      "G7.3",
      "Alternating bass",
      7,
      read("The “boom-chick” of folk guitar", [
        "Much of the folk and country guitar you hear has a thumb that <b>alternates between two bass strings</b>, steady as a heartbeat, while the fingers add melody or chords above it. It’s sometimes called “Travis picking” after Merle Travis.",
        "For C, the thumb alternates between the 5th string (C, fret 3) and the 4th string (D string, fret 2). For G it goes between the 6th string (fret 3) and the 4th string (open D). The root note comes on beats 1 and 3; the alternate note on 2 and 4.",
      ], { fig: tab(C_ALT, ["1", "2", "3", "4", "1", "2", "3", "4"]), hear: [hear(C_ALT, 110)] }),
      practice("With a C chord, play the thumb pattern alone, steady: A string (fret 3), D string (fret 2), A, D… for a full minute at 70 BPM. Don’t add fingers yet.", { needs: "guitar", fig: { chords: ["C"] } }),
      practice("Now add your index or middle finger plucking the high e string on beat 1 along with the thumb. It’s a pinch: both strings sound together on beat 1.", { needs: "guitar" }),
      quiz(
        ask("In alternating bass, what does the thumb do?", ["Swaps between two bass strings", "Plays only the highest string", "Stays on one string", "Slaps the guitar"], 0),
        ask("For the C chord the thumb plays the 5th string and the…", ["4th string", "6th string", "1st string", "3rd string"], 0),
        ask("What does the thumb keep going like?", ["A steady heartbeat", "A solo", "A rest", "A scratch"], 0),
        ask("The alternating bass is common in…", ["Folk and country", "Only metal", "Only classical", "Only pop with synthesizers"], 0),
      ),
    ),
    lesson(
      "G7.4",
      "A song with fingerpicking",
      7,
      read("Greensleeves-style accompaniment", [
        "Combine what you know: take the progression from the chord-changes course, <b>Am – C – G – E</b>, and play the six-note arpeggio pattern (p-i-m-a-m-i) on each chord, one chord per bar of 3/4 or 6/8. Choose the bass string by the chord’s root: A for Am, A for C (fret 3), the low E for G (fret 3), the low E open for E.",
        "Let each note ring until the next. Don’t rush the changes: breathe between them and let the first beat of the bar land on time.",
      ], { fig: { chart: { rows: [["Am", "C", "G", "E"], ["Am", "C", "E", "Am"]] } } }),
      practice("Play the arpeggio on Am for one bar, then change to C and play the pattern, and so on through the first line. Go slowly: 60 BPM, one bar each.", { needs: "guitar", fig: { chart: { rows: [["Am", "C", "G", "E"]] } } }),
      quiz(
        ask("What decides which string the thumb plays as the bass note?", ["The root of the chord", "The key of the song", "The tuning", "The tempo"], 0),
        ask("For Am, the thumb plays which string?", ["The 5th (A)", "The 6th (E)", "The 4th (D)", "The 1st (e)"], 0),
        ask("For G (320003), the thumb’s bass note is on…", ["The 6th string, fret 3", "The 5th string, open", "The 4th string, fret 3", "The 1st string"], 0),
        ask("What should the notes of an arpeggio do?", ["Ring into each other", "Stop instantly", "Be as loud as possible", "Be muted"], 0),
      ),
    ),
    lesson(
      "G7.5",
      "Which string is the bass?",
      6,
      read("Root string cheat sheet", [
        "Quick reference for the open chords: the chord’s <b>root</b> (its name note) sits on a particular string and is what the thumb plays on beat 1.",
      ], { fig: { table: { head: ["Chord", "Root on", "Fret"], rows: [["E, Em, E7", "6th string", "open"], ["A, Am, A7", "5th string", "open"], ["D, Dm, D7", "4th string", "open"], ["G", "6th string", "3"], ["C", "5th string", "3"]] } } }),
      read("Use it", ["When you read a chord chart, glance at the chord name, pick the right bass string and begin your pattern there. Soon this becomes automatic."]),
      quiz(
        ask("For a D chord, the root is on…", ["The 4th string (open)", "The 5th string", "The 6th string", "The 3rd string"], 0),
        ask("For an E chord, the root is on…", ["The 6th string (open)", "The 5th string", "The 4th string", "The 1st string"], 0),
        ask("For a C chord, the root note is on…", ["The 5th string, fret 3", "The 6th string, fret 3", "The 4th string, fret 2", "The 1st string"], 0),
        ask("For an A chord, the root is on…", ["The 5th string (open)", "The 6th string (open)", "The 4th string (open)", "The 3rd string"], 0),
        ask("Which chord has its root on the low E string at fret 3?", ["G", "C", "A", "D"], 0),
      ),
    ),
  ],
);
