/* Guitar 10: Folk songs, start to finish. Common public-domain folk songs: chords (typical, not lyrics), strums, picking, key and capo, and arranging your own. */
import { ask, course, hearChord as hc, lesson, practice, quiz, read } from "../dsl.js";

const OPEN = [52, 57, 62, 67, 71, 76];
const tab = (cols, names) => ({ tab: { cols, cw: 30, ...(names ? { names } : {}) } });
const hear = (cols, tempo = 110, l = "▶ Hear it") => ({ l, seq: cols.flat().map(([s, f]) => OPEN[s] + f), onsets: cols.flatMap((c, i) => c.map(() => i)), tempo });

// thumb bass notes for G and C chords, one bar of 3/4: bass, then two higher notes together
const G_WALTZ = [[[0, 3]], [[3, 0], [4, 0], [5, 3]], [[3, 0], [4, 0], [5, 3]]];
const C_WALTZ = [[[1, 3]], [[3, 0], [4, 1], [5, 0]], [[3, 0], [4, 1], [5, 0]]];
const G_ALT = [[[0, 3]], [[2, 0]], [[0, 3]], [[2, 0]], [[0, 3]], [[2, 0]], [[0, 3]], [[2, 0]]];

export const G10 = course(
  "G10",
  "Folk songs, start to finish",
  "Public-domain songs you can play from beginning to end: the chords, a strum or picking pattern, a comfortable key, and how to arrange your own version.",
  [
    lesson(
      "G10.1",
      "Three chords, a hundred songs",
      7,
      read("The I–IV–V toolkit", [
        "Most traditional folk songs use just three chords: the <b>I</b> (home), <b>IV</b> (away) and <b>V</b> (tension that wants to go home). In the key of G these are <b>G, C and D</b> (or D7). In C they are <b>C, F and G7</b>. Learn the three chords in a key and you can play a huge amount of music.",
        "Songs that are commonly played with this toolkit include <i>When the Saints Go Marching In</i>, <i>Clementine</i>, <i>Down in the Valley</i> and <i>Oh! Susanna</i>. The charts below are the <b>typical</b> chords for each: your version might differ slightly, and that is allowed. Folk music has always been passed on by ear and changed along the way.",
      ], { fig: { chart: { rows: [["G", "G", "G", "G"], ["C", "C", "G", "G"], ["D7", "D7", "G", "G"]] }, cap: "A typical I–IV–V layout in G: not any single song, but the shape of many." }, hear: [hc("G"), hc("C"), hc("D7")] }),
      practice("Play G → C → D7 → G, four strums each, at a speed where the changes are clean. Say “one, two, three, four” out loud as you change.", { needs: "guitar", fig: { chords: ["G", "C", "D7"] } }),
      quiz(
        ask("In the key of G, the three main chords are…", ["G, C and D", "G, A and B", "G, F and D", "G, Am and Em"], 0),
        ask("In the key of C, the V7 chord is…", ["G7", "F7", "C7", "D7"], 0),
        ask("Which numbers name the three main chords in a key?", ["I, IV and V", "I, II and III", "I, V and VII", "II, V and I"], 0),
        ask("A “typical” chord chart for a folk song is…", ["The common way to play it, not the only way", "A strict rule", "Copyrighted notation", "The melody"], 0),
      ),
    ),
    lesson(
      "G10.2",
      "Waltz songs in 3/4",
      8,
      read("Bass, then two strums", [
        "Many classic folk songs are in <b>3/4</b>, counted <b>ONE two three</b>: <i>Down in the Valley</i>, <i>Clementine</i> and <i>Amazing Grace</i> are examples. The easiest accompaniment is “boom, chick, chick”: play the chord’s <b>bass note</b> on beat 1, then <b>strum the higher strings</b> on beats 2 and 3.",
        "For G, the bass note is the low E string, third fret. For C, it is the A string, third fret. For D, the open D string. On the strums, play just the top three or four strings, softly, so the bass stands out.",
      ], { fig: { ...tab(G_WALTZ, ["1 boom", "2 chick", "3 chick"]), cap: "G waltz: bass, then the three top strings twice." }, hear: [hear(G_WALTZ, 110, "▶ G waltz")] }),
      practice("Play the G waltz pattern 8 times in a row at 80 BPM, then switch to C (bass on the A string) and do the same. The goal is an even three: ONE two three, ONE two three.", { needs: "guitar", fig: tab(C_WALTZ, ["1 boom", "2 chick", "3 chick"]) }),
      practice("Put it to a song: the typical chords for a simple waltz tune are G for two bars, D7 for two bars, G for two bars, then D7 and G. Play the pattern on each chord and hum any waltz you know on top.", { needs: "guitar", fig: { chart: { rows: [["G", "G", "D7", "D7"], ["G", "G", "D7", "G"]] } } }),
      quiz(
        ask("3/4 time is counted…", ["ONE two three", "ONE two three four", "ONE and two and", "ONE two"], 0),
        ask("In “boom, chick, chick”, the boom is…", ["The bass note on beat 1", "A full strum on beat 1", "A rest", "A harmonic"], 0),
        ask("For a G chord, the bass note you play is…", ["The low E string, 3rd fret", "The A string, open", "The high e string", "The D string, 2nd fret"], 0),
        ask("Why play the “chick” strums on the top strings only?", ["So the bass note stands out", "To avoid breaking strings", "It’s louder", "It’s required by theory"], 0),
        ask("Which song is typically in 3/4?", ["Amazing Grace", "When the Saints Go Marching In", "Twinkle, Twinkle", "Jingle Bells"], 0),
      ),
    ),
    lesson(
      "G10.3",
      "Minor-key folk songs",
      8,
      read("Am, G, C and E", [
        "Many old folk songs are in a minor key, which gives them a haunting sound. In <b>A minor</b>, the chords you need are <b>Am, G, C, F, Dm and E (or E7)</b>. The <b>E</b> chord is a major V chord borrowed from A harmonic minor (G♯ is its third), and it gives a strong pull home to Am.",
        "<i>Greensleeves</i> (typically in 6/8 or 3/4), <i>House of the Rising Sun</i> (a ballad commonly played with an arpeggio) and <i>Scarborough Fair</i> (a modal tune with a Dorian sound) all use these. For the minor songs, <b>arpeggios</b> usually work better than strumming: pluck the bass note, then the strings above, one at a time.",
      ], { fig: { chart: { rows: [["Am", "C", "D", "F"], ["Am", "C", "E", "E"]] }, cap: "A typical minor-key ballad loop in A minor." }, hear: [hc("Am"), hc("C"), hc("E")] }),
      practice("Play Am → C → D → F → Am → C → E → E as an arpeggio: bass note first, then up the strings and back (thumb, then fingers). Two bars per chord is plenty slow.", { needs: "guitar", fig: { chords: ["Am", "C", "E"] } }),
      quiz(
        ask("The chords of a simple A minor folk song are…", ["Am, G, C, F, Dm and E", "A, D and E", "Em, B and F♯", "C, G and Am only"], 0),
        ask("Why do many minor songs use an E (major) chord?", ["It pulls strongly back to Am", "It is easier to play", "It is quieter", "It is the relative major"], 0),
        ask("Which technique often suits a minor ballad better than a strum?", ["Arpeggios", "Tremolo", "Rasgueado", "Pull-offs only"], 0),
        ask("Scarborough Fair’s tune has a ___ sound.", ["Dorian (modal)", "Mixolydian", "Blues", "Whole-tone"], 0),
        ask("In A minor, the relative major key is…", ["C major", "E major", "D major", "G major"], 0),
      ),
    ),
    lesson(
      "G10.4",
      "A folk fingerpicking pattern",
      8,
      read("Thumb alternates, fingers decorate", [
        "You already know the alternating bass from fingerstyle. Here it is for a song: the thumb alternates between the chord’s <b>root</b> and a <b>second bass note</b> on every beat while the fingers play melody or chord tones above it. On G the thumb swaps between the low E string (fret 3) and the open D string.",
        "Keep the thumb pattern <b>running without a break</b> as the chords change. When you move from G to C, the thumb simply moves to C’s bass notes (A string fret 3, D string fret 2). If the thumb never stops, the left hand can take its time.",
      ], { fig: { ...tab(G_ALT, ["1", "2", "3", "4", "1", "2", "3", "4"]), cap: "G alternating bass." }, hear: [hear(G_ALT, 120, "▶ Alternating bass")] }),
      practice("Play the G alternating bass for 8 bars. Then change to C without stopping the thumb: C’s notes are the A string at fret 3 and the D string at fret 2. Work up to 70 BPM.", { needs: "guitar", fig: { chords: ["G", "C"] } }),
      quiz(
        ask("In the alternating bass, the thumb plays…", ["Two different bass strings in turn", "The same string only", "The highest string", "Chords"], 0),
        ask("When changing chords, you should…", ["Keep the thumb pattern going", "Stop and restart", "Strum instead", "Slow down gradually"], 0),
        ask("On a G chord the alternating bass uses the low E string and…", ["The open D string", "The B string", "The A string", "The high e string"], 0),
        ask("On a C chord the alternating bass uses the A string (fret 3) and…", ["The D string (fret 2)", "The low E string", "The G string", "The B string"], 0),
      ),
    ),
    lesson(
      "G10.5",
      "Choosing a key: voice and capo",
      8,
      read("Fit the song to your voice", [
        "The key you play in should fit <b>your singing voice</b>, not the other way round. If the song feels too high, move the whole thing to a lower key; if it feels too low, move it up. Sing the highest and lowest notes of the tune and make sure they sit comfortably, and remember that a song you’ll sing for ten minutes needs a range with no strain.",
        "A <b>capo</b> clamps across the neck and acts as a movable nut. If you play G shapes with the capo on fret 2, the song sounds in A (G + 2 semitones). Add the capo number to the shape’s key: shapes in <b>G with capo 3</b> sound in <b>B♭</b>; shapes in <b>C with capo 2</b> sound in <b>D</b>. The capo can only raise the key; to go lower, change to a different set of shapes.",
      ], { fig: { table: { head: ["Shapes in", "Capo fret", "Sounds in"], rows: [["G", "2", "A"], ["G", "3", "B♭"], ["G", "5", "C"], ["C", "2", "D"], ["C", "5", "F"], ["D", "2", "E"], ["E", "1", "F"]] } } }),
      quiz(
        ask("G shapes with the capo on fret 2 sound in…", ["A", "F", "B", "G"], 0),
        ask("C shapes with the capo on fret 2 sound in…", ["D", "B♭", "E", "C"], 0),
        ask("A song is too high for your voice. You…", ["Move it to a lower key with different chord shapes", "Put a capo higher up", "Strum harder", "Play it faster"], 0),
        ask("Which key do G shapes with the capo on fret 5 sound in?", ["C", "D", "F", "B♭"], 0),
        ask("A capo can…", ["Only raise the key", "Only lower the key", "Change the key either way", "Change the time signature"], 0),
        ask("You want the song in F using easy C shapes. Where does the capo go?", ["Fret 5", "Fret 3", "Fret 7", "Fret 2"], 0),
      ),
    ),
    lesson(
      "G10.6",
      "Arrange it yourself",
      9,
      read("From chart to performance", [
        "Here is a repeatable recipe for turning any chord chart into a finished song. (1) <b>Pick the key</b> for your voice and capo if you like. (2) <b>Choose the feel</b> from the time signature: a strum for 4/4 songs, boom-chick-chick for 3/4, arpeggios for slow ballads. (3) <b>Plan the form</b>: most folk songs are <b>strophic</b> (the same music for every verse), so you only learn one verse.",
        "(4) Add an <b>intro</b> (the last two bars of the verse, or the chords once through) and an <b>ending</b> (slow down, hold the last chord, or repeat the last line). (5) Vary the verses: play quieter on the first, fuller on the middle, softer again at the end. Small changes in dynamics, strumming or picking keep the same chords interesting through six or seven verses.",
      ], { fig: { table: { head: ["Step", "Decision"], rows: [["1", "Key (and capo) for your voice"], ["2", "Strum, waltz, or fingerpicking"], ["3", "One verse: learn the chords"], ["4", "Intro and ending"], ["5", "Vary the verses"]] } } }),
      practice("Pick a song you can sing. Write its chords as a chart, choose a key for your voice, decide your feel, and perform it start to finish with an intro and an ending. Record it on your phone and listen back for places to improve.", { needs: "guitar" }),
      quiz(
        ask("A strophic song uses…", ["The same music for each verse", "New music in every verse", "Only a chorus", "No chords"], 0),
        ask("A good feel for a slow, sad ballad is…", ["Arpeggios", "A fast strum", "Palm muting", "Power chords"], 0),
        ask("For a 3/4 song, a good pattern is…", ["Boom, chick, chick", "A 4-beat strum", "Eight eighths", "Tremolo"], 0),
        ask("Which of these keeps a six-verse song interesting?", ["Changing dynamics and strumming", "Changing the chords", "Changing the lyrics", "Playing faster each verse"], 0),
        ask("The first step of arranging is…", ["Pick a key that fits your voice", "Choose the capo brand", "Write the melody", "Pick the ending"], 0),
      ),
    ),
  ],
);
