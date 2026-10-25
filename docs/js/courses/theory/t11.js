/* Theory 11: Ear training. Intervals through familiar tunes, chord quality, scale degrees, rhythm dictation, progressions. */
import { ask, course, lesson, quiz, read } from "../dsl.js";

const NAMES = { 1: "minor 2nd", 2: "major 2nd", 3: "minor 3rd", 4: "major 3rd", 5: "perfect 4th", 6: "tritone", 7: "perfect 5th", 8: "minor 6th", 9: "major 6th", 10: "minor 7th", 11: "major 7th", 12: "octave" };
const two = (l, a, b, harm = false) => ({ l, seq: [a, b], onsets: harm ? [0, 0] : [0, 1.2], tempo: 100 });
const tune = (l, notes, tempo = 120) => ({ l, seq: notes, onsets: notes.map((_, i) => i), tempo });
// an interval question: root, semitones up, the right name, and three wrong ones
const iq = (root, semis, wrong, why) => ask("Listen. Which interval is this (going up)?", [NAMES[semis], ...wrong.map((w) => NAMES[w])], 0, why || "It spans " + semis + " semitones.", null, two("▶", root, root + semis));
const V = {
  C: [60, 64, 67], Cm: [60, 63, 67], Cdim: [60, 63, 66], Caug: [60, 64, 68], C7: [60, 64, 67, 70], Cmaj7: [60, 64, 67, 71],
  F: [60, 65, 69], G: [59, 62, 67], Am: [57, 60, 64], Dm: [62, 65, 69], G7: [59, 62, 65, 67], Em: [59, 64, 67],
};
const chord = (l, ns) => ({ l, seq: ns, onsets: ns.map(() => 0), tempo: 100 });
const prog = (l, names, tempo = 100) => ({ l, seq: names.flatMap((n) => V[n]), onsets: names.flatMap((n, i) => V[n].map(() => i * 2)), tempo });
// rhythm dictation: each beat is "ta" (x-), "ti-ti" (xx) or "rest" (..)
const BEAT = { "x-": "ta", xx: "ti-ti", "..": "rest" };
const syl = (p) => (p.match(/../g) || []).map((b) => BEAT[b]).join(" ");
const rhy = (p) => ({ l: "▶", seq: [...p].flatMap((c, i) => (c === "x" ? [67] : [])), onsets: [...p].flatMap((c, i) => (c === "x" ? [i / 2] : [])), tempo: 100 });
const rq = (p, wrong) => ask("Listen. Which rhythm is this?", [syl(p), ...wrong.map(syl)], 0, "Spoken: " + syl(p) + ".", { rhythm: p }, rhy(p));

export const T11 = course(
  "T11",
  "Ear training",
  "Learn to hear intervals through familiar tunes, name chords by colour, feel scale degrees pull, write rhythms from sound and follow chord progressions.",
  [
    lesson(
      "T11.1",
      "Intervals through familiar tunes",
      9,
      read("Hang each interval on a song you know", [
        "The quickest way to learn interval sounds is to attach each one to the <i>first two notes</i> of a tune you can sing. Use old public-domain tunes: they are the same for everyone. Try these (all going <b>up</b> unless noted):",
        "<b>Major 2nd</b>: Frère Jacques (the first two notes). <b>Minor 3rd</b>: Greensleeves. <b>Major 3rd</b>: When the Saints Go Marching In. <b>Perfect 4th</b>: Auld Lang Syne. <b>Perfect 5th</b>: Twinkle, Twinkle (the first leap). <b>Major 6th</b>: My Bonny Lies over the Ocean. Going <b>down</b>: Mary Had a Little Lamb starts with a descending major 2nd, and Für Elise begins with a falling minor 2nd.",
      ], { fig: { table: { head: ["Interval (up)", "Semitones", "Tune"], rows: [["Major 2nd", "2", "Frère Jacques"], ["Minor 3rd", "3", "Greensleeves"], ["Major 3rd", "4", "When the Saints…"], ["Perfect 4th", "5", "Auld Lang Syne"], ["Perfect 5th", "7", "Twinkle, Twinkle"], ["Major 6th", "9", "My Bonny…"]] } }, hear: [tune("▶ Frère Jacques", [60, 62, 64, 60]), tune("▶ Twinkle", [60, 60, 67, 67, 69, 69, 67])] }),
      quiz(
        ask("Which tune starts with a perfect 5th leap?", ["Twinkle, Twinkle", "Frère Jacques", "Greensleeves", "Auld Lang Syne"], 0),
        ask("Which tune starts with an upward major 3rd?", ["When the Saints Go Marching In", "Greensleeves", "Auld Lang Syne", "Twinkle, Twinkle"], 0),
        ask("The first interval of Greensleeves is a…", ["Minor 3rd", "Major 3rd", "Perfect 5th", "Perfect 4th"], 0),
        ask("The first interval of Auld Lang Syne is a…", ["Perfect 4th", "Perfect 5th", "Major 3rd", "Major 2nd"], 0),
        iq(60, 7, [5, 4, 9], "Twinkle, Twinkle’s opening leap."),
        iq(60, 4, [3, 5, 7], "The start of When the Saints Go Marching In."),
        iq(60, 5, [4, 7, 9], "The start of Auld Lang Syne."),
        iq(60, 9, [7, 10, 5], "My Bonny Lies over the Ocean."),
      ),
    ),
    lesson(
      "T11.2",
      "Hearing chord quality",
      8,
      read("Four colours, one root", [
        "Hold the root and change the colour. <b>Major</b> is bright and settled. <b>Minor</b> is darker, sadder. <b>Diminished</b> is tense and tight; it sounds like it is about to collapse. <b>Augmented</b> is stretched and floating, unresolved.",
        "Add a seventh and the colour changes again: the <b>dominant 7th</b> is bluesy and wants to move; the <b>major 7th</b> is soft and dreamy. Listen to each in turn and notice the feeling before you name it. Describe the sound in your own words, because that is what you will recall when you are guessing in a lesson.",
      ], { fig: { table: { head: ["Chord", "Colour"], rows: [["Major", "Bright, settled"], ["Minor", "Dark, sad"], ["Diminished", "Tense, collapsing"], ["Augmented", "Floating, unresolved"], ["Dominant 7th", "Bluesy, wants to move"], ["Major 7th", "Soft, dreamy"]] } }, hear: [chord("▶ Major", V.C), chord("▶ Minor", V.Cm), chord("▶ Diminished", V.Cdim), chord("▶ Augmented", V.Caug), chord("▶ Dominant 7th", V.C7), chord("▶ Major 7th", V.Cmaj7)] }),
      quiz(
        ask("Listen. Which chord is this?", ["Major", "Minor", "Diminished", "Augmented"], 0, "Bright and settled.", null, chord("▶", V.C)),
        ask("Listen. Which chord is this?", ["Minor", "Major", "Augmented", "Dominant 7th"], 0, "Darker, with the lowered third.", null, chord("▶", V.Cm)),
        ask("Listen. Which chord is this?", ["Diminished", "Minor", "Major", "Augmented"], 0, "Tight and tense.", null, chord("▶", V.Cdim)),
        ask("Listen. Which chord is this?", ["Augmented", "Major", "Diminished", "Minor"], 0, "Stretched and floating.", null, chord("▶", V.Caug)),
        ask("Listen. Which chord is this?", ["Dominant 7th", "Major 7th", "Major", "Minor"], 0, "Bluesy, with a flat seventh.", null, chord("▶", V.C7)),
        ask("Listen. Which chord is this?", ["Major 7th", "Dominant 7th", "Minor", "Augmented"], 0, "Soft and dreamy.", null, chord("▶", V.Cmaj7)),
        ask("Which chord sounds unresolved and floating?", ["Augmented", "Major", "Minor", "Major 7th"], 0),
      ),
    ),
    lesson(
      "T11.3",
      "Scale degrees and tendency tones",
      9,
      read("Notes that pull", [
        "In a major key, every degree has a personality. <b>1</b> (do) is home: stable. <b>3</b> and <b>5</b> are also stable and sound at rest over the I chord. <b>2</b>, <b>4</b>, <b>6</b> and <b>7</b> are <b>tendency tones</b>: they want to move.",
        "The strongest pulls: <b>7 → 1</b> (the leading tone rises a half step to home); <b>4 → 3</b> (falls a half step); <b>2 → 1</b> (falls a step); <b>6 → 5</b> (falls a step). Test it: sing a major scale and stop on 7. You will feel an almost physical need to sing 1. That need is the leading tone doing its job.",
      ], { fig: { table: { head: ["Degree", "Feels", "Wants to…"], rows: [["1", "Home", "Stay"], ["2", "Light tension", "Fall to 1"], ["3", "Stable", "Stay"], ["4", "Tension", "Fall to 3"], ["5", "Stable", "Stay"], ["6", "Mild tension", "Fall to 5"], ["7", "Strong tension", "Rise to 1"]] } }, hear: [tune("▶ Stop on 7", [60, 62, 64, 65, 67, 69, 71]), tune("▶ Resolve to 1", [60, 62, 64, 65, 67, 69, 71, 72])] }),
      quiz(
        ask("Which scale degree is the leading tone?", ["7", "5", "3", "4"], 0),
        ask("The leading tone wants to…", ["Rise a half step to 1", "Fall to 5", "Stay put", "Leap to 3"], 0),
        ask("Where does 4 want to go?", ["Down to 3", "Up to 5", "Up to 1", "Stay"], 0),
        ask("Which degrees are stable (restful) over a I chord?", ["1, 3 and 5", "2, 4 and 6", "4 and 7", "Only 7"], 0),
        ask("Listen. The scale stops here. Does it feel finished?", ["No: it stops on 7, which wants to rise", "Yes: it is home", "Yes: it stops on 5", "No: it stops on 2"], 0, "Stopping on 7 feels unfinished.", null, tune("▶", [60, 62, 64, 65, 67, 69, 71])),
        ask("Listen. Does this scale feel finished?", ["Yes: it lands on 1", "No: it stops on 7", "No: it is on 4", "No: it is on 6"], 0, "Ending on 1 feels at rest.", null, tune("▶", [60, 62, 64, 65, 67, 69, 71, 72])),
        ask("In C major, the tendency tone B resolves to…", ["C", "A", "G", "D"], 0),
        ask("In G major, the tendency tone F♯ resolves to…", ["G", "E", "A", "D"], 0),
      ),
    ),
    lesson(
      "T11.4",
      "Rhythm dictation",
      9,
      read("Hear it, say it, write it", [
        "Rhythm dictation means listening to a pattern and writing it down. A great trick is to say it with syllables: a single beat is <b>ta</b>; two evenly split beats are <b>ti-ti</b>; a silent beat is a <b>rest</b>. Tap the steady beat with your foot, say the syllables out loud as you listen, then check the pattern.",
        "Do not try to remember the whole bar at once. Listen once for the <b>shape</b> (how many sounds in each beat?), then again for the <b>details</b>. Start with the first beat, then add the rest. This is how professional musicians transcribe a tune they hear.",
      ], { figs: [{ rhythm: "x-x-xxx-", cap: "ta  ta  ti-ti  ta" }, { rhythm: "xxx-..x-", cap: "ti-ti  ta  rest  ta" }], hear: [rhy("x-x-xxx-"), rhy("xxx-..x-")] }),
      quiz(
        rq("x-x-xxx-", ["x-xxx-x-", "xxxxx-x-", "x-x-x-xx"]),
        rq("xxx-x-x-", ["x-xxx-x-", "xxxxx-x-", "x-x-xxx-"]),
        rq("x-..x-xx", ["x-x-x-xx", "x-..xxx-", "x-x-..xx"]),
        rq("xxxxx-x-", ["xxx-x-x-", "x-xxxxx-", "xxxxxxx-"]),
        rq("x-xx..xx", ["x-xxx-xx", "x-..x-xx", "x-xx..x-"]),
        ask("In dictation, how do you write one beat split into two even sounds?", ["ti-ti", "ta", "rest", "ta-a"], 0),
        ask("What is the best way to tackle a rhythm dictation?", ["Keep the beat, listen for the shape, then fill in details", "Memorise it all in one hearing", "Guess the first note", "Ignore the beat"], 0),
      ),
    ),
    lesson(
      "T11.5",
      "Hearing chord progressions",
      9,
      read("Names for the sounds", [
        "You can recognise the common progressions by <b>shape and feel</b>, the way you recognise a friend’s walk. <b>I – IV – V – I</b> is the classic: home, away, tension, home. <b>I – V – vi – IV</b> is the pop anthem. <b>I – vi – IV – V</b> is the 1950s “doo-wop” loop. <b>ii – V – I</b> is the jazz engine.",
        "Listen for the <b>bass</b> first: does it step, leap or fall by fifths? Then listen for whether it ends on a feeling of rest (a I chord) or one of tension. Name each progression by its numbers, so you can play it in any key.",
      ], { fig: { table: { head: ["Progression", "In C", "Feels like"], rows: [["I–IV–V–I", "C F G C", "Classic: away and home"], ["I–V–vi–IV", "C G Am F", "Pop anthem"], ["I–vi–IV–V", "C Am F G", "50s loop"], ["ii–V–I", "Dm G C", "Jazz engine"]] } }, hear: [prog("▶ I–IV–V–I", ["C", "F", "G", "C"]), prog("▶ I–V–vi–IV", ["C", "G", "Am", "F"]), prog("▶ I–vi–IV–V", ["C", "Am", "F", "G"])] }),
      quiz(
        ask("Listen. Which progression is this?", ["I–IV–V–I", "I–V–vi–IV", "I–vi–IV–V", "ii–V–I"], 0, "Classic home–away–tension–home.", null, prog("▶", ["C", "F", "G", "C"])),
        ask("Listen. Which progression is this?", ["I–V–vi–IV", "I–IV–V–I", "I–vi–IV–V", "ii–V–I"], 0, "The pop anthem.", null, prog("▶", ["C", "G", "Am", "F"])),
        ask("Listen. Which progression is this?", ["I–vi–IV–V", "I–V–vi–IV", "I–IV–V–I", "ii–V–I"], 0, "The 1950s loop; it ends on V and wants to repeat.", null, prog("▶", ["C", "Am", "F", "G"])),
        ask("Listen. Which progression is this?", ["ii–V–I", "I–IV–V–I", "I–V–vi–IV", "I–vi–IV–V"], 0, "Falling fifths into home.", null, prog("▶", ["Dm", "G7", "C"])),
        ask("Which progression ends on tension rather than rest?", ["I–vi–IV–V", "I–IV–V–I", "ii–V–I", "I–V–I"], 0),
        ask("What should you listen for first when naming a progression?", ["The bass line", "The tempo", "The volume", "The lyrics"], 0),
      ),
    ),
    lesson(
      "T11.6",
      "Ear workout",
      9,
      read("Mixed practice", [
        "A mixed round: intervals, chords, tendency tones and progressions. Take your time and listen twice before answering. The sound is the real teacher: use the “why” notes to adjust.",
      ]),
      quiz(
        iq(62, 3, [4, 5, 2], "Greensleeves opens like this."),
        iq(60, 7, [5, 4, 9], "Twinkle’s opening leap."),
        iq(65, 2, [3, 4, 1], "The first two notes of Frère Jacques."),
        ask("Listen. Which chord is this?", ["Minor", "Major", "Augmented", "Diminished"], 0, "Darker, with the lowered third.", null, chord("▶", V.Cm)),
        ask("Listen. Which chord is this?", ["Dominant 7th", "Major 7th", "Minor", "Major"], 0, "Bluesy.", null, chord("▶", V.C7)),
        ask("Listen. Does this scale feel finished?", ["No: it stops on 7", "Yes: it lands on 1", "Yes: it ends on 5", "No: it ends on 3"], 0, "It hangs on the leading tone.", null, tune("▶", [60, 62, 64, 65, 67, 69, 71])),
        ask("Listen. Which progression is this?", ["I–V–vi–IV", "I–IV–V–I", "I–vi–IV–V", "ii–V–I"], 0, "The pop anthem.", null, prog("▶", ["C", "G", "Am", "F"])),
        rq("x-xxx-x-", ["xxxxx-x-", "x-x-x-xx", "x-xxxxx-"]),
      ),
    ),
  ],
  { more: [{ t: "Open Music Theory (ear-training-friendly overview of intervals and chords), free online text", u: "https://viva.pressbooks.pub/openmusictheory/" }] },
);
