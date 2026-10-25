/* Guitar 4: Strumming and rhythm. */
import { ask, card, course, hearChord as hc, lesson, practice, quiz, read } from "../dsl.js";

const grid = (row) => ({ table: { head: ["1", "&", "2", "&", "3", "&", "4", "&"], rows: [row] } });

export const G4 = course(
  "G4",
  "Strumming and rhythm",
  "Keeping a steady beat, down and up strokes, the all-purpose pattern, muting and waltz time.",
  [
    lesson(
      "G4.1",
      "A steady beat",
      6,
      read("The pulse", [
        "Rhythm starts with a <b>steady beat</b>, like the tick of a clock or tapping your foot. Most music counts the beat in groups of four: <b>1 2 3 4, 1 2 3 4</b>. Speed is measured in <b>beats per minute</b> (BPM). 60 BPM is one beat per second. Start slowly, around 60–70 BPM.",
        "For this lesson you strum a chord once on each beat with a <b>downstroke</b>. Let your forearm swing from the elbow with a relaxed wrist, like shaking water off your fingers, and keep it moving evenly. Evenness matters more than anything else.",
      ], { fig: { rhythm: "x-x-x-x-", cap: "Four beats in a bar: strum on each." }, hear: [{ l: "▶ Steady beat (80 BPM)", seq: [52, 52, 52, 52, 52, 52, 52, 52], onsets: [0, 1, 2, 3, 4, 5, 6, 7], tempo: 80 }] }),
      practice("Set the metronome in the Practice tab to 60 BPM. Strum Em with one downstroke on each click. Count aloud “1 2 3 4”. Keep it going for one full minute without stopping.", { needs: "guitar" }),
      quiz(
        ask("60 BPM means…", ["One beat each second", "60 notes per bar", "Two beats each second", "Sixty bars each minute"], 0),
        ask("What matters most in strumming practice?", ["Staying even and steady", "Strumming loudly", "Strumming fast", "Hitting every string hard"], 0),
        ask("How many beats are in one bar of 4/4?", ["4", "3", "2", "8"], 0),
        ask("A good starting tempo is…", ["60–70 BPM", "180 BPM", "200 BPM", "10 BPM"], 0),
      ),
    ),
    lesson(
      "G4.2",
      "Down and up",
      6,
      read("Eighth-note strumming", [
        "Between the beats there are “<b>ands</b>”: count <b>1 & 2 & 3 & 4 &</b>, two strums per beat. This is <b>eighth-note</b> strumming. Your <b>downstrokes land on the numbers</b> and your <b>upstrokes on the “&”</b>.",
        "Your arm doesn’t stop between them. It swings down, then up, like a pendulum, all the time. On the way up you only catch the thinnest 2–3 strings lightly.",
      ], { fig: { ...grid(["↓", "↑", "↓", "↑", "↓", "↑", "↓", "↑"]), cap: "Down on the numbers, up on the “ands”." }, hear: [{ l: "▶ Hear eight strums", seq: [52, 52, 52, 52, 52, 52, 52, 52], onsets: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5], tempo: 80 }] }),
      practice("Strum Em with a steady down-up-down-up (8 strums to a bar) at 60 BPM, counting “1 & 2 & 3 & 4 &”. Do eight bars.", { needs: "guitar", fig: { ...grid(["↓", "↑", "↓", "↑", "↓", "↑", "↓", "↑"]) } }),
      quiz(
        ask("In the count 1 & 2 & 3 & 4 &, the upstrokes fall on…", ["The “&”s", "The numbers", "Only on beat 1", "Nowhere"], 0),
        ask("How many strums fit into one bar of 4/4 in eighth-note strumming?", ["8", "4", "2", "16"], 0),
        ask("Your strumming arm should…", ["Keep moving down and up like a pendulum", "Stop between strums", "Stay perfectly rigid", "Only move on the downbeats"], 0),
        ask("Which sound do you aim to hear on an upstroke?", ["A lighter, thinner sound from the top strings", "A full six-string blast", "No sound", "A muted thud"], 0),
      ),
    ),
    lesson(
      "G4.3",
      "The all-purpose pattern",
      7,
      read("D, D-U, U-D-U", [
        "This one pattern fits thousands of songs. Count <b>1 & 2 & 3 & 4 &</b> and keep your arm swinging the whole time. You strike on some strokes and just <b>miss the strings</b> on others:",
        "<b>↓ on 1, ↓ on 2, ↑ on the & of 2, ↑ on the & of 3, ↓ on 4, ↑ on the & of 4</b>. In words: “Down, Down-Up, (miss), Up-Down-Up.” The beat-3 down and the & of 1 are the strokes you skip, but the arm still goes through the motion.",
      ], { fig: { ...grid(["↓", "·", "↓", "↑", "·", "↑", "↓", "↑"]), cap: "A dot means: swing through without touching the strings." } }),
      read("Learn it in stages", [
        "First play steady down-up-down-up with no chords changes. Then drop the strum on the &-of-1 (the second one) and on beat 3, one at a time, while your arm keeps moving. Once the pattern is automatic you can change chords without thinking about the right hand.",
      ], { fig: { rhythm: "x-xx-xxx", cap: "Where the strokes land, on the same bar of eight slots." } }),
      practice("Play the pattern on Em for eight bars at 60 BPM, counting out loud. Then do the same with Am, then alternate Em and Am every two bars.", { needs: "guitar", fig: grid(["↓", "·", "↓", "↑", "·", "↑", "↓", "↑"]) }),
      quiz(
        ask("In the all-purpose pattern, which beat has no strum?", ["Beat 3 (the arm still swings)", "Beat 1", "Beat 2", "Beat 4"], 0, "Down on 1, down on 2, up on the & of 2, up on the & of 3, down on 4, up on the & of 4.", grid(["↓", "·", "↓", "↑", "·", "↑", "↓", "↑"])),
        ask("What should your strumming arm do on a skipped stroke?", ["Keep swinging, just miss the strings", "Stop", "Hit harder next time", "Switch hands"], 0),
        ask("How many strokes land on strings in one bar of the pattern?", ["6", "8", "4", "5"], 0, "Down, down, up, up, down, up: six of the eight positions."),
        ask("The best way to learn it is…", ["Slowly, keeping the arm moving", "Fast, hoping it clicks", "Without counting", "One stroke at a time with long pauses"], 0),
      ),
    ),
    lesson(
      "G4.4",
      "Accents, muting and silence",
      6,
      read("Not every strum is equal", [
        "An <b>accent</b> is a stroke played a little louder. Many songs naturally emphasise beats <b>2 and 4</b> (the “backbeat”), which gives that bounce you can tap your foot to. Try strumming beats 2 and 4 a touch harder while keeping 1 and 3 softer.",
        "<b>Silence is part of the rhythm.</b> You can stop all the strings by relaxing your fretting fingers (without lifting them) or by laying the side of your picking hand on the strings near the bridge: a <b>palm mute</b> gives a short, dull “chunk”.",
      ]),
      practice("Strum Em on four beats per bar: soft, LOUD, soft, LOUD (accents on 2 and 4). Then try palm-muting (resting the edge of your picking palm on the strings just in front of the bridge) for a whole bar.", { needs: "guitar" }),
      quiz(
        ask("An accent is…", ["A stroke played a little louder", "A quiet stroke", "A rest", "A wrong note"], 0),
        ask("The backbeat falls on beats…", ["2 and 4", "1 and 3", "1 only", "3 only"], 0),
        ask("A palm mute is made by…", ["Resting the side of the picking hand on the strings by the bridge", "Taking your thumb off the neck", "Lifting your fingers high", "Using a thicker pick"], 0),
        ask("Silences in a rhythm are…", ["Part of the rhythm", "Mistakes", "Only for pros", "Always at the end"], 0),
      ),
    ),
    lesson(
      "G4.5",
      "Waltz time: three beats to the bar",
      6,
      read("Boom, strum, strum", [
        "Many old folk tunes and hymns are in <b>3/4</b>: three beats to a bar, counted <b>1 2 3, 1 2 3</b>. It has a swaying waltz feel: a strong beat followed by two lighter ones.",
        "A classic guitar pattern is <b>bass note, strum, strum</b> (often called oom-pah-pah). On beat 1 pick the chord’s root note on its lowest string. On beats 2 and 3 strum the higher strings lightly.",
      ], { fig: { table: { head: ["1", "2", "3"], rows: [["bass note", "strum ↓", "strum ↓"]] }, cap: "For G: bass = 6th string; for C: bass = 5th string; for D: bass = 4th string." }, hear: [{ l: "▶ Count it: 1 2 3", seq: [55, 67, 67, 55, 67, 67], onsets: [0, 1, 2, 3, 4, 5], tempo: 120 }] }),
      practice("Play the pattern on G and then on C in 3/4 at 70 BPM: bass, strum, strum. Count 1 2 3 out loud. Keep the strums softer than the bass note.", { needs: "guitar", fig: { chords: ["G", "C"] } }),
      quiz(
        ask("How many beats are in a bar of 3/4?", ["3", "4", "2", "6"], 0),
        ask("In the bass-strum-strum pattern, what do you play on beat 1?", ["The chord’s root note on a low string", "A full chord strum, loud", "Nothing", "The highest string"], 0),
        ask("What feel does 3/4 have?", ["A waltz sway: strong, weak, weak", "A march: strong, weak", "A shuffle: long, short", "No pulse"], 0),
        ask("For a G chord the bass note is played on…", ["The 6th string (low E, fret 3)", "The 1st string", "The 2nd string", "The 4th string"], 0, "G’s root is on the thickest string at fret 3."),
      ),
    ),
    lesson(
      "G4.6",
      "Playing in time",
      6,
      read("Keep going", [
        "The most important rhythm skill is <b>not stopping</b>. When you make a mistake, keep the beat and carry on: the music does not wait. In a band, a skipped chord is a smaller problem than a stopped song.",
        "Use a metronome for new patterns: set it at a speed where you can play the whole thing correctly, play it four times in a row, and then add 5 BPM. You can also practise listening: the Songs tab has a click track and a <b>Wait for me</b> mode that follows your playing.",
      ]),
      read("Count in", [
        "When you start a song, <b>count one bar out loud</b> first (“1 2 3 4”) to set the tempo in your head, then begin on the next beat 1. Counting aloud also keeps you honest: if you can’t say the count while you play, you don’t know the part yet.",
      ]),
      practice("Pick two chords you know. Set the metronome to 70 BPM. Strum the all-purpose pattern: four bars on the first chord, four bars on the second. If you miss a change, keep the beat anyway and join in at the next bar.", { needs: "guitar" }),
      quiz(
        ask("You make a mistake in the middle of a song. You should…", ["Keep the beat and carry on", "Stop and start again", "Play faster to catch up", "Switch chords"], 0),
        ask("When can you raise the metronome speed?", ["After playing it correctly several times in a row", "After one try", "Never", "When you feel nervous"], 0),
        ask("Why count a bar in before you start?", ["It sets the tempo in your head", "It is a rule from the 1800s", "It tunes the guitar", "It warms up the fingers"], 0),
        ask("A song’s tempo is measured in…", ["Beats per minute", "Chords per bar", "Strums per song", "Octaves"], 0),
      ),
    ),
  ],
);
