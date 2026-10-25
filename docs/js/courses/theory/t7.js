/* Theory 7: Reading a score: signs, dynamics, tempo and form. */
import { ask, course, lesson, quiz, read } from "../dsl.js";

export const T7 = course(
  "T7",
  "Reading a score",
  "Repeats, dynamics, tempo words, articulation, song form and reading lead sheets.",
  [
    lesson(
      "T7.1",
      "Repeats and jumps",
      6,
      read("Saving paper", [
        "Composers use signs to avoid writing the same music twice. A <b>repeat sign</b> (a thick double bar with two dots) sends you back to the matching start-repeat sign, or to the beginning if there isn’t one. Play the section a second time, then carry on.",
        "<b>First and second endings</b> are brackets numbered 1 and 2 over the last bars of a repeated section: play ending 1 the first time through, then repeat, and skip it the second time to play ending 2.",
      ]),
      read("Jumps", [
        "<b>D.C.</b> (<i>da capo</i>, “from the head”) means go back to the very beginning. <b>D.S.</b> (<i>dal segno</i>, “from the sign”) means go back to the sign 𝄋. <b>Fine</b> (“the end”) marks where to finish, and <b>al Coda</b> tells you to jump to the Coda (an ending section marked ⊕) at the right moment. A typical instruction: <b>D.C. al Fine</b> = go back to the start and play until the word Fine.",
      ]),
      quiz(
        ask("A repeat sign means…", ["Play the section again", "Play louder", "Stop", "Skip the bar"], 0),
        ask("D.C. means…", ["Go back to the beginning", "Go to the sign", "Play softer", "Hold the note"], 0),
        ask("‘Fine’ marks…", ["Where the piece ends", "Where to start", "A sudden pause", "A change of key"], 0),
        ask("With first and second endings, on the repeat you…", ["Skip the first ending and play the second", "Play both endings", "Play ending 1 again", "Stop"], 0),
        ask("D.S. means…", ["Go back to the sign", "Go to the end", "Dynamic soft", "Double sharp"], 0),
      ),
    ),
    lesson(
      "T7.2",
      "Dynamics",
      5,
      read("Loud and soft", [
        "<b>Dynamics</b> tell you how loud to play, using Italian words abbreviated to letters: <b>p</b> (piano, soft), <b>f</b> (forte, loud), <b>m</b> (mezzo, “medium”). Combined: <b>pp</b> very soft, <b>p</b> soft, <b>mp</b> medium-soft, <b>mf</b> medium-loud, <b>f</b> loud, <b>ff</b> very loud.",
        "A <b>crescendo</b> (a widening wedge ‘&lt;’) means gradually louder; a <b>decrescendo</b> or <b>diminuendo</b> (a closing wedge ‘&gt;’) gradually softer. Every instrument makes dynamics differently: breath, bow speed, how hard a key or string is struck.",
      ], { fig: { table: { head: ["pp", "p", "mp", "mf", "f", "ff"], rows: [["very soft", "soft", "medium soft", "medium loud", "loud", "very loud"]] } } }),
      quiz(
        ask("What does f stand for?", ["Forte: loud", "Fine: end", "Fast", "Flat"], 0),
        ask("What does p stand for?", ["Piano: soft", "Pause", "Pluck", "Perfect"], 0),
        ask("What does mf mean?", ["Medium loud", "Very loud", "Medium soft", "Quick"], 0),
        ask("A crescendo means…", ["Gradually louder", "Gradually softer", "Slower", "Faster"], 0),
        ask("Which is quietest?", ["pp", "p", "mp", "mf"], 0),
      ),
    ),
    lesson(
      "T7.3",
      "Tempo words",
      5,
      read("How fast?", [
        "Besides BPM, scores often use Italian words for tempo. They are not exact, but roughly: <b>Largo</b> (very slow, 40–60 BPM), <b>Adagio</b> (slow, 66–76), <b>Andante</b> (walking pace, 76–108), <b>Moderato</b> (moderate, 108–120), <b>Allegro</b> (fast and lively, 120–156), <b>Presto</b> (very fast, 168–200).",
        "Changes while playing: <b>ritardando</b> (rit.) gradually slower, <b>accelerando</b> (accel.) gradually faster, <b>a tempo</b> back to the original speed, <b>fermata</b> (𝄐) hold the note longer than written.",
      ], { fig: { table: { head: ["Word", "Meaning", "≈ BPM"], rows: [["Largo", "very slow", "40–60"], ["Adagio", "slow", "66–76"], ["Andante", "walking pace", "76–108"], ["Moderato", "moderate", "108–120"], ["Allegro", "fast, lively", "120–156"], ["Presto", "very fast", "168–200"]] } } }),
      quiz(
        ask("Which is the slowest?", ["Largo", "Andante", "Allegro", "Presto"], 0),
        ask("Which is the fastest?", ["Presto", "Allegro", "Moderato", "Adagio"], 0),
        ask("Ritardando means…", ["Gradually slower", "Gradually faster", "Louder", "Return to speed"], 0),
        ask("A tempo means…", ["Back to the original speed", "Slower", "Faster", "Stop"], 0),
        ask("Allegro means…", ["Fast and lively", "Slow and sad", "Soft", "Held"], 0),
      ),
    ),
    lesson(
      "T7.4",
      "Articulation",
      5,
      read("How the note starts and ends", [
        "<b>Articulation</b> says how to play each note, not just how long. <b>Staccato</b> (a dot above or below the notehead): short and detached. <b>Legato</b>: smooth and connected, shown by a curved line called a <b>slur</b> over a group of notes: play them as one flowing phrase. <b>Accent</b> (&gt; over the note): attack it harder. <b>Tenuto</b> (a short line): hold it for its full value.",
        "What a slur means physically depends on the instrument: a string player plays the notes in one bow, a wind player in one breath without re-tonguing, a singer on one syllable. (On guitar, a slur between two notes is typically played as a hammer-on or pull-off.) A <b>tie</b>, by contrast, joins two notes of the <i>same</i> pitch into one longer note.",
      ]),
      quiz(
        ask("Staccato means…", ["Short and detached", "Smooth and connected", "Louder", "Slower"], 0),
        ask("A slur over several notes means…", ["Play them smoothly (legato)", "Play them short", "Repeat them", "Skip them"], 0),
        ask("An accent (>) means…", ["Play that note harder", "Play it quietly", "Hold it forever", "Rest"], 0),
        ask("A tie joins…", ["Two notes of the same pitch into one long note", "Any two notes smoothly", "A note and a rest", "Two bars"], 0),
        ask("Legato is the opposite of…", ["Staccato", "Forte", "Piano", "Allegro"], 0),
      ),
    ),
    lesson(
      "T7.5",
      "Song form",
      6,
      read("The shape of a song", [
        "Songs are built from sections, usually labelled with letters. <b>Verse</b>: the story, with new words each time on the same music. <b>Chorus</b> (refrain): the part that repeats with the same words, usually the catchiest bit. <b>Bridge</b>: a contrast section, new music, often once. <b>Intro</b> and <b>outro</b> open and close the song.",
        "Common forms: <b>strophic</b> (same music for every verse: most folk songs and hymns), <b>verse–chorus</b> (the standard pop and rock form), <b>AABA</b> (two similar sections, a contrasting one, then the first again: many old standards) and the <b>12-bar blues</b> (one 12-bar chord cycle repeated).",
      ], { fig: { table: { head: ["Form", "Pattern"], rows: [["Strophic", "A A A A (every verse the same music)"], ["Verse–chorus", "Verse, Chorus, Verse, Chorus, Bridge, Chorus"], ["AABA", "A, A, B (bridge), A"], ["12-bar blues", "one 12-bar cycle, repeated"]] } } }),
      quiz(
        ask("Which section repeats with the same words each time?", ["Chorus", "Verse", "Bridge", "Intro"], 0),
        ask("A bridge is…", ["A contrasting section", "The first section", "A repeat of the chorus", "A rest"], 0),
        ask("Most folk songs and hymns are…", ["Strophic", "AABA", "Through-composed", "Verse–chorus–bridge"], 0),
        ask("AABA means…", ["Two similar sections, a contrast, then the first again", "Four identical sections", "Verse then chorus", "A single chord"], 0),
        ask("A 12-bar blues is…", ["One 12-bar chord cycle, repeated", "A 12-minute song", "A song in 12/8", "A twelve-string guitar piece"], 0),
      ),
    ),
    lesson(
      "T7.6",
      "Lead sheets and chord charts",
      6,
      read("Melody plus chords", [
        "A <b>lead sheet</b> is a very common way musicians see a song: just the melody on a staff, with <b>chord symbols above</b> it (and lyrics underneath). A <b>chord chart</b> drops the melody and shows only the chords bar by bar.",
        "Handy signs: a <b>slash /</b> in a bar means keep playing the same chord and rhythm; <b>%</b> means repeat the previous bar; <b>N.C.</b> means no chord (play nothing, or just rhythm); a letter or number in a box is a <b>rehearsal mark</b> to help the band find a place.",
      ], { fig: { chart: { rows: [["G", "%", "C", "G"], ["Em", "Am", "D7", "G"]] }, cap: "A chord chart: one chord per bar. % repeats the bar." } }),
      quiz(
        ask("A lead sheet shows…", ["Melody and chord symbols", "Only the lyrics", "Only tab", "Only drums"], 0),
        ask("‘%’ in a chord chart means…", ["Repeat the previous bar", "Skip the bar", "Play louder", "Slow down"], 0),
        ask("N.C. means…", ["No chord", "New chorus", "Next chord", "Not clear"], 0),
        ask("A chord chart shows…", ["The chords bar by bar", "The full melody", "Only dynamics", "Fingerings only"], 0),
        ask("A slash in a bar means…", ["Keep playing the same chord", "Play a different chord", "Rest", "Repeat the song"], 0),
      ),
    ),
  ],
);
