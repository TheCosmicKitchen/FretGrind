/* Guitar 6: Chord changes, with folk-song progressions. The chord charts are typical folk-style arrangements of these traditional tunes
   (the tunes are old and in the public domain); other books may harmonise them a little differently. */
import { ask, card, course, hearChord as hc, lesson, practice, quiz, read } from "../dsl.js";

const chart = (...rows) => ({ chart: { rows } });
const song = (title, why) => `<b>${title}</b>: ${why}`;

export const G6 = course(
  "G6",
  "Chord changes and folk songs",
  "Switching cleanly between chords, with the chord moves behind real folk songs.",
  [
    lesson(
      "G6.1",
      "How a chord change works",
      7,
      read("Move a shape, not three fingers", [
        "Changing chords is the hardest part of early guitar. The trick is to stop thinking of three separate fingers and think of <b>one shape</b> you pick up and put down together. Visualise the next shape before you move.",
        "Look for <b>pivot fingers</b>: fingers that stay on the same string and fret (an anchor) or that only slide one string over. Fewer movements, fewer mistakes.",
      ]),
      read("The one-minute change test", [
        "Use a stopwatch. Switch between two chords, strumming once per chord, for one minute. Count how many <b>clean</b> changes you manage. Write it down and beat that number tomorrow. Starting scores are usually 10–20; good players reach 40 or more.",
        "Two more habits: <b>start the move early</b> (lift your fingers a split second before the downbeat so the new chord is ready on the beat), and <b>keep the right hand strumming steadily</b> even if you mute the strings during the change. The beat never stops.",
      ]),
      practice("Try the one-minute test with Em ↔ Am, strumming each chord once. Count your clean changes. Then rest and try again.", { needs: "guitar", fig: { chords: ["Em", "Am"] } }),
      quiz(
        ask("A pivot finger is one that…", ["Stays put, or only slides one string, between two chords", "Plays the lowest note", "Is always finger 4", "Lifts off the neck"], 0),
        ask("Why should you start moving a little before the beat?", ["So the new chord is ready on the beat", "To strum louder", "To confuse the audience", "To get a head start on the song"], 0),
        ask("What should your strumming hand do during a difficult change?", ["Keep going steadily, even if the strings are muted", "Stop completely", "Play faster", "Strum only once per bar"], 0),
        ask("What is the best way to measure your progress on changes?", ["Count clean changes in one minute", "Time how long it takes you to give up", "Count mistakes", "Play louder"], 0),
      ),
    ),
    lesson(
      "G6.2",
      "G ↔ C",
      7,
      read("The first folk change", [
        "G and C are two of the most important chords in folk music. With the 3-2-4 fingering of G, notice: finger 3 sits on fret 3 of the thick E string, and in C it sits on fret 3 of the A string. Finger 2 sits on fret 2 of the A string in G and fret 2 of the D string in C. So <b>fingers 3 and 2 each slide over one string</b>, keeping their frets. Finger 4 lifts off and finger 1 drops onto the B string at fret 1.",
        song("Amazing Grace", "this old hymn tune is played in 3/4 and moves mostly between G, C and D. In a waltz feel, a first line might look like this:"),
      ], { fig: { chords: ["G", "C"] }, hear: [hc("G"), hc("C")] }),
      read("A waltz loop", ["Use the bass-strum-strum waltz pattern (from the strumming course) and play one chord per bar: G for two bars, then C, then G again."], { fig: chart(["G", "G", "C", "G"], ["G", "G", "C", "G"]) }),
      practice("One-minute change test: G ↔ C. Then play the loop above in 3/4: bass note, strum, strum, one chord per bar, at 70 BPM.", { needs: "guitar", fig: { chords: ["G", "C"] } }),
      quiz(
        ask("In the G → C change (3-2-4 fingering for G), finger 3 moves…", ["Across one string at the same fret", "Up three frets", "Off the neck", "To the e string"], 0, "From the low E string fret 3 to the A string fret 3.", { chords: ["G", "C"] }),
        ask("Which finger lands on the B string at fret 1 in C?", ["Finger 1", "Finger 2", "Finger 3", "Finger 4"], 0),
        ask("What time signature is Amazing Grace usually played in?", ["3/4", "4/4", "2/4", "6/8"], 0),
        card("chord:G"),
        card("chord:C"),
      ),
    ),
    lesson(
      "G6.3",
      "G ↔ D7",
      7,
      read("Home and away", [
        "A song’s home chord (here G) and the dominant seventh built on the fifth note of the scale (D7) are the most common pair in folk music: G feels like <b>home</b> and D7 feels like <b>about to go home</b>.",
        song("Skip to My Lou", "a simple call-and-response song built on this pair"),
        song("Oh! Susanna", "Stephen Foster’s 1848 song, which in G mostly uses G, D7 and C"),
        "D7 uses only the top four strings and is made of three fingers close together: G string fret 2, B string fret 1, e string fret 2. Place your hand over the shape before strumming.",
      ], { fig: { chords: ["G", "D7"] }, hear: [hc("G"), hc("D7")] }),
      read("A two-chord loop", ["Two bars each, then one bar each in the last line. Strum steadily down-down-up-up-down-up while you change."], { fig: chart(["G", "G", "D7", "D7"], ["G", "G", "D7", "G"]) }),
      practice("One-minute change test: G ↔ D7. Then play the chart above with the all-purpose strum (down, down-up, up-down-up) at 70 BPM.", { needs: "guitar", fig: { chords: ["G", "D7"] } }),
      quiz(
        ask("Which string do you start strumming for D7?", ["The 4th (D)", "The 6th (E)", "The 5th (A)", "The 1st (e)"], 0, "D7 uses only the four thinnest strings.", { chords: ["D7"] }),
        ask("What does a D7 chord ‘want’ to do in the key of G?", ["Go home to G", "Go to A", "Stay where it is", "Go to F"], 0),
        ask("Which pair of chords is the home chord and its dominant seventh in the key of G?", ["G and D7", "G and C", "C and F", "Em and Am"], 0),
        card("chord:D7"),
        card("chord:G"),
      ),
    ),
    lesson(
      "G6.4",
      "G – C – D7: the folk three",
      8,
      read("Three chords, thousands of songs", [
        "G (home), C (a little away) and D7 (tension) cover a huge share of folk, country and blues. In the key of G they are called the <b>I, IV and V7</b> chords: the ones built on the 1st, 4th and 5th notes of the G scale.",
        song("Red River Valley", "a traditional cowboy and folk song that is a perfect example of this"),
        "Play one chord per bar. When you can do it with a steady beat, change to two bars each, and then mix them up.",
      ], { fig: chart(["G", "G", "C", "G"], ["G", "D7", "D7", "G"]), hear: [hc("G"), hc("C"), hc("D7")] }),
      practice("Play through the 8-bar loop above at 70 BPM using the all-purpose strum, counting out loud. Aim for three clean passes with no pauses. Count the beats in your head even on the changes.", { needs: "guitar", fig: chart(["G", "G", "C", "G"], ["G", "D7", "D7", "G"]) }),
      quiz(
        ask("In the key of G, the I, IV and V7 chords are…", ["G, C and D7", "G, D and A", "C, F and G7", "Em, Am and Bm"], 0),
        ask("Which of these chords is the ‘IV’ chord in the key of G?", ["C", "D7", "G", "Em"], 0),
        ask("Which chord provides the tension that leads back home?", ["D7", "G", "C", "Em"], 0),
        card("chord:G"),
        card("chord:C"),
        card("chord:D7"),
      ),
    ),
    lesson(
      "G6.5",
      "Am ↔ C",
      7,
      read("Two fingers stay put", [
        "Am and C look different but share most of their shape. Finger 1 stays on the B string at fret 1, and finger 2 stays on the D string at fret 2. Only <b>finger 3</b> moves: from the G string (fret 2) in Am to the A string (fret 3) in C.",
        song("Greensleeves", "an English folk melody (in 3/4 or 6/8) usually played with Am, C, G and E"),
        "Because two fingers never leave the neck, you can concentrate on getting the third one there on time.",
      ], { fig: { chords: ["Am", "C"] }, hear: [hc("Am"), hc("C")] }),
      read("A minor-key loop", ["Greensleeves-style: Am, C, G, then the dominant E (play E major) to lead back to Am."], { fig: chart(["Am", "C", "G", "E"], ["Am", "C", "E", "Am"]) }),
      practice("One-minute change test: Am ↔ C (keep fingers 1 and 2 planted). Then play the chart above at 70 BPM, one chord per bar.", { needs: "guitar", fig: { chords: ["Am", "C"] } }),
      quiz(
        ask("Which fingers stay in place from Am to C?", ["Fingers 1 and 2", "Fingers 2 and 3", "Fingers 3 and 4", "None"], 0, "Finger 1 on B string fret 1 and finger 2 on D string fret 2.", { chords: ["Am", "C"] }),
        ask("Which finger moves between Am and C?", ["Finger 3", "Finger 1", "Finger 2", "Finger 4"], 0),
        ask("Which chord gives the leading-back-to-Am feel in a minor key?", ["E (major)", "C", "G", "D"], 0, "The major chord on the fifth note of the A minor scale pulls strongly back to Am."),
        card("chord:Am"),
        card("chord:C"),
        card("chord:E"),
      ),
    ),
    lesson(
      "G6.6",
      "Am ↔ E",
      7,
      read("A sliding shape", [
        "Am and E are the same <b>shape</b> played one string apart. Am has fingers on the D, G and B strings; E has the same fingers on the A, D and G strings. To change, slide the whole shape one string toward the thick end, moving the three fingers together, like moving a ruler.",
        song("Wayfaring Stranger", "an American spiritual that sits mostly on Am and E (or E7)"),
        "Practise the move slowly and watch the shape travel as one piece.",
      ], { fig: { chords: ["Am", "E"] }, hear: [hc("Am"), hc("E")] }),
      read("A slow minor tune", ["Play each chord for a full bar of four strums. Four bars of Am, two of E, then back."], { fig: chart(["Am", "Am", "Am", "Am"], ["E", "E", "Am", "Am"]) }),
      practice("One-minute change test: Am ↔ E. Then play the chart above, down-strumming four times per bar at 60 BPM.", { needs: "guitar", fig: { chords: ["Am", "E"] } }),
      quiz(
        ask("Compared with Am, the E shape is…", ["The same shape one string lower (thicker)", "A different shape", "Played at the 5th fret", "A barre chord"], 0),
        ask("When changing from Am to E you should…", ["Move all three fingers together", "Move them one at a time", "Lift all of them first", "Move only finger 3"], 0),
        card("chord:Am"),
        card("chord:E"),
      ),
    ),
    lesson(
      "G6.7",
      "Am – G – C – D",
      8,
      read("A four-chord loop", [
        "Many folk songs and countless pop songs circle around the four chords <b>Am, G, C and D</b>. Moving through them in a loop is an excellent workout, because each chord has a different set of strings.",
        song("Scarborough Fair", "an English ballad usually built from Am, C, G and D"),
        "Plan the next shape while you play the current one. The easiest moves are G → C (slide fingers 3 and 2) and C → D (fingers on the thin strings).",
      ], { fig: chart(["Am", "G", "C", "D"], ["Am", "G", "C", "D"]), hear: [hc("Am"), hc("G"), hc("C"), hc("D")] }),
      practice("Loop Am, G, C, D with one chord per bar and four down-strums each at 60 BPM. Aim for no pause between bars. Then try the all-purpose pattern at 70 BPM.", { needs: "guitar", fig: chart(["Am", "G", "C", "D"]) }),
      quiz(
        ask("Which chord in this loop only uses the four thinnest strings?", ["D", "Am", "G", "C"], 0),
        ask("Which move in the loop uses the ‘slide across one string’ trick?", ["G → C", "C → D", "D → Am", "Am → G"], 0),
        card("chord:Am"),
        card("chord:G"),
        card("chord:C"),
        card("chord:D"),
      ),
    ),
    lesson(
      "G6.8",
      "Am – C – D – F: a four-chord story",
      9,
      read("An easy F", [
        "Next, a famous progression: <b>Am – C – D – F</b>, then <b>Am – C – E – E</b>. It is the chord sequence most players use for the traditional American folk song <b>House of the Rising Sun</b>.",
        "A full F needs a barre. For now use <b>Fmaj7</b>, an easy, close cousin: finger 3 on the D string fret 3, finger 2 on the G string fret 2, finger 1 on the B string fret 1, with the high e string open. Finger 1 stays on the B string through <b>Am, C and Fmaj7</b>: a handy anchor.",
      ], { fig: { chords: ["Am", "C", "D", "Fmaj7"] }, hear: [hc("Fmaj7")] }),
      read("The whole progression", ["Play one chord per bar, or two strums per chord for a rolling arpeggio feel, in 6/8 or 4/4."], { fig: chart(["Am", "C", "D", "Fmaj7"], ["Am", "C", "E", "E"]) }),
      practice("Practise each move separately: Am→C, C→D, D→Fmaj7, Fmaj7→Am (that last one is easy). Then play the 8-bar chart at 60 BPM.", { needs: "guitar", fig: chart(["Am", "C", "D", "Fmaj7"], ["Am", "C", "E", "E"]) }),
      quiz(
        ask("Which finger stays on the B string at fret 1 across Am, C and Fmaj7?", ["Finger 1", "Finger 2", "Finger 3", "Finger 4"], 0),
        ask("Why use Fmaj7 instead of F at this stage?", ["It avoids the barre", "It is the same chord", "It has no frets", "It is in a different key"], 0),
        ask("Which chord ends the first four bars?", ["Fmaj7", "D", "C", "E"], 0, "Am – C – D – Fmaj7.", chart(["Am", "C", "D", "Fmaj7"])),
        card("chord:Fmaj7"),
        card("chord:D"),
        card("chord:Am"),
      ),
    ),
    lesson(
      "G6.9",
      "Same changes, new key: D, G, A",
      8,
      read("I – IV – V in D", [
        "The G–C–D7 pattern works in every key. In the key of D the three chords are <b>D (I), G (IV), A (V)</b>: exactly the same relationship, just starting on a different note. A is played x-0-2-2-2-0.",
        song("Shenandoah", "a traditional American river song, commonly played with D, G and A"),
        song("Simple Gifts", "a Shaker hymn from 1848, also often played with D, G and A"),
      ], { fig: { chords: ["D", "G", "A"] }, hear: [hc("D"), hc("G"), hc("A")] }),
      read("The same loop", ["Same shape as G–C–D7, one step higher. Play one chord per bar, then two."], { fig: chart(["D", "D", "G", "D"], ["D", "G", "A", "D"]) }),
      practice("Play the 8-bar loop at 70 BPM with the all-purpose strum. Then repeat the same loop in G (G, C, D7) and notice how it feels the same.", { needs: "guitar", fig: chart(["D", "D", "G", "D"], ["D", "G", "A", "D"]) }),
      quiz(
        ask("In the key of D, the I, IV and V chords are…", ["D, G and A", "D, A and G", "G, C and D", "D, E and A"], 0),
        ask("Which chord is the V chord in the key of D?", ["A", "G", "E", "Bm"], 0),
        ask("What stays the same when you move a progression to a new key?", ["The relationship between the chords", "The chord names", "The finger shapes", "The tempo only"], 0),
        card("chord:D"),
        card("chord:G"),
        card("chord:A"),
      ),
    ),
  ],
  { gen: (n) => Array.from({ length: n }, () => ({ card: "chord:" + ["G", "C", "D7", "Am", "E", "D", "A", "Fmaj7"][(Math.random() * 8) | 0] })) },
);
