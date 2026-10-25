/* Theory 10: Harmony in pop and jazz. Chord symbols, sevenths, ii-V-I, the blues, secondary dominants, colour chords and turnarounds. */
import { ask, course, lesson, quiz, read } from "../dsl.js";

// piano-style voicings (MIDI) so every chord sounds as a block
const V = {
  C: [60, 64, 67], F: [60, 65, 69], G: [59, 62, 67], Am: [57, 60, 64], Dm: [62, 65, 69], Em: [59, 64, 67],
  C7: [60, 64, 67, 70], G7: [59, 62, 65, 67], D7: [62, 66, 69, 72], E7: [59, 62, 68, 71], A7: [61, 64, 67, 69],
  Cmaj7: [60, 64, 67, 71], Fmaj7: [60, 64, 65, 69], Dm7: [62, 65, 69, 72], Am7: [57, 60, 64, 67], Em7: [59, 62, 64, 67], Cm: [60, 63, 67], Cm7: [60, 63, 67, 70],
  Dm7b5: [62, 65, 68, 72], Csus4: [60, 65, 67], Csus2: [60, 62, 67], Cadd9: [60, 64, 67, 74], C6: [60, 64, 67, 69], C9: [60, 64, 67, 70, 74],
  Bdim: [59, 62, 65], Caug: [60, 64, 68],
};
V.F7 = [53, 57, 60, 63]; // F A C Eb
V.Db7 = [61, 65, 68, 71]; // Db F Ab Cb(B)
const play = (l, names, gap = 2, tempo = 110) => ({ l, seq: names.flatMap((n) => V[n]), onsets: names.flatMap((n, i) => V[n].map(() => i * gap)), tempo });

export const T10 = course(
  "T10",
  "Harmony in pop and jazz",
  "Read chord symbols fluently, build seventh chords, and understand ii–V–I, the blues, borrowed dominants and the standard moves of pop and jazz.",
  [
    lesson(
      "T10.1",
      "Chord symbols decoded",
      8,
      read("Reading the shorthand", [
        "A chord symbol is a recipe: a <b>root letter</b>, then a <b>quality</b>, then any <b>extras</b>. Plain letter = major triad (C = C E G). <b>m</b> or <b>min</b> = minor (Cm = C E♭ G). <b>dim</b> or <b>°</b> = diminished (C E♭ G♭). <b>aug</b> or <b>+</b> = augmented (C E G♯). A number after the letter adds a note on top: <b>C7</b> adds the flat seventh, <b>Cmaj7</b> (or CΔ) adds the natural seventh.",
        "A slash chord like <b>C/E</b> means “play C, but with E in the bass”. The note after the slash is the lowest note; the chord stays the same. Slash chords are often used to make the bass line walk smoothly: C – C/B – Am – Am/G.",
      ], { fig: { table: { head: ["Symbol", "Notes", "Quality"], rows: [["C", "C E G", "Major"], ["Cm", "C E♭ G", "Minor"], ["Cdim", "C E♭ G♭", "Diminished"], ["Caug", "C E G♯", "Augmented"], ["C7", "C E G B♭", "Dominant 7th"], ["Cmaj7", "C E G B", "Major 7th"], ["C/E", "C E G, E in the bass", "First inversion"]] } }, hear: [play("▶ C", ["C"]), play("▶ Cm", ["Cm"]), play("▶ Caug", ["Caug"])] }),
      quiz(
        ask("What are the notes of Cm?", ["C E♭ G", "C E G", "C E♭ G♭", "C F G"], 0),
        ask("What does C/E tell you?", ["Play C with E in the bass", "Play C and E together as two chords", "Play C in the key of E", "Play C an octave lower"], 0),
        ask("Caug has which notes?", ["C E G♯", "C E♭ G♭", "C E♭ G", "C E G"], 0),
        ask("C7 differs from C by adding…", ["B♭ (the flat seventh)", "B (the major seventh)", "D", "A"], 0),
        ask("Which symbol means a diminished chord?", ["Cdim or C°", "Cm", "Csus", "C+"], 0),
        ask("What is the difference between Cmaj7 and C7?", ["The 7th is B in Cmaj7 and B♭ in C7", "None", "Cmaj7 is minor", "C7 has no third"], 0),
        ask("Listen. Is this chord major, minor or augmented?", ["Augmented", "Major", "Minor", "Diminished"], 0, "The stretched, unresolved sound of C E G♯.", null, play("▶", ["Caug"])),
      ),
    ),
    lesson(
      "T10.2",
      "Seventh chords and where they live",
      9,
      read("Four notes, five types", [
        "Add a third-stacked note on top of a triad and you get a <b>seventh chord</b>. Five types matter: <b>maj7</b> (C E G B, smooth and dreamy), <b>dominant 7</b> (C E G B♭, bluesy and wanting to move), <b>m7</b> (C E♭ G B♭, mellow), <b>m7♭5</b> (C E♭ G♭ B♭, “half-diminished”) and <b>dim7</b> (C E♭ G♭ B𝄫, all minor thirds).",
        "Stack thirds on every note of the major scale and each degree gets its own seventh chord. In C major: <b>Cmaj7, Dm7, Em7, Fmaj7, G7, Am7, Bm7♭5</b>. Only the V chord is dominant 7, which is why G7 is such a strong pointer back to C.",
      ], { fig: { table: { head: ["Degree", "Chord in C", "Type"], rows: [["I", "Cmaj7", "maj7"], ["ii", "Dm7", "m7"], ["iii", "Em7", "m7"], ["IV", "Fmaj7", "maj7"], ["V", "G7", "dominant 7"], ["vi", "Am7", "m7"], ["vii", "Bm7♭5", "m7♭5"]] } }, hear: [play("▶ Cmaj7", ["Cmaj7"]), play("▶ C7", ["C7"]), play("▶ Cm7", ["Cm7"])] }),
      quiz(
        ask("In a major key, which seventh chord is built on V?", ["Dominant 7", "maj7", "m7", "m7♭5"], 0),
        ask("In C major, the seventh chord on ii is…", ["Dm7", "D7", "Dmaj7", "Dm7♭5"], 0),
        ask("In C major, the seventh chord on IV is…", ["Fmaj7", "F7", "Fm7", "Fm7♭5"], 0),
        ask("In C major, the chord on vii is…", ["Bm7♭5", "Bm7", "B7", "Bmaj7"], 0),
        ask("In G major, the chord on vi is…", ["Em7", "E7", "Emaj7", "Em7♭5"], 0, "G major: Gmaj7, Am7, Bm7, Cmaj7, D7, Em7, F♯m7♭5."),
        ask("In G major, which chord is the dominant 7?", ["D7", "C7", "A7", "G7"], 0),
        ask("Cmaj7 contains which seventh?", ["B", "B♭", "A", "C"], 0),
        ask("Listen. Which sound is this?", ["Dominant 7", "Major 7", "Minor 7", "Diminished"], 0, "C7 sounds bluesy and wants to resolve.", null, play("▶", ["C7"])),
      ),
    ),
    lesson(
      "T10.3",
      "ii–V–I, the jazz engine",
      9,
      read("The most common progression in jazz", [
        "The <b>ii–V–I</b> is a three-chord move that appears in nearly every standard. In C major it is <b>Dm7 – G7 – Cmaj7</b>. The bass moves down a fifth each time (D → G → C): the strongest root movement in tonal music. The ii chord sets up the dominant, the V creates tension, and the I resolves it.",
        "In a <b>minor</b> key it is <b>ii°7 (m7♭5) – V7 – i</b>: in C minor, <b>Dm7♭5 – G7 – Cm7</b>. Look for it in the middle of a tune: a ii–V–I often <i>temporarily</i> points at a chord other than the home key, as a little “visit”.",
      ], { fig: { chart: { rows: [["Dm7", "G7", "Cmaj7", "%"], ["Dm7♭5", "G7", "Cm7", "%"]] }, cap: "Top: ii–V–I in C major. Bottom: ii–V–i in C minor." }, hear: [play("▶ Major ii–V–I", ["Dm7", "G7", "Cmaj7"]), play("▶ Minor ii–V–i", ["Dm7b5", "G7", "Cm7"])] }),
      quiz(
        ask("What is the ii–V–I in G major?", ["Am7 – D7 – Gmaj7", "Bm7 – E7 – Gmaj7", "Am7 – D7 – Cmaj7", "Gmaj7 – Am7 – D7"], 0),
        ask("What is the ii–V–I in F major?", ["Gm7 – C7 – Fmaj7", "Am7 – D7 – Fmaj7", "Gm7 – D7 – Fmaj7", "Fmaj7 – Gm7 – C7"], 0),
        ask("What is the ii chord in a minor ii–V–i?", ["m7♭5", "maj7", "dominant 7", "m7"], 0),
        ask("The roots of a ii–V–I move…", ["Down a fifth each time", "Up a step each time", "By octaves", "Down a half step each time"], 0, "D → G → C."),
        ask("In the key of C minor, the ii–V–i is…", ["Dm7♭5 – G7 – Cm7", "Dm7 – G7 – Cmaj7", "Dm7♭5 – G7 – Cmaj7", "Dm7 – A7 – Cm7"], 0),
        ask("Listen. Which progression is this?", ["Major ii–V–I", "Minor ii–V–i", "I–IV–V", "I–vi–IV"], 0, "It ends on a bright major seventh chord.", null, play("▶", ["Dm7", "G7", "Cmaj7"])),
        ask("Listen. Which progression is this?", ["Minor ii–V–i", "Major ii–V–I", "I–IV–I", "vi–IV–I"], 0, "The ending chord is minor.", null, play("▶", ["Dm7b5", "G7", "Cm7"])),
      ),
    ),
    lesson(
      "T10.4",
      "The 12-bar blues in detail",
      9,
      read("Twelve bars, three chords", [
        "The basic 12-bar blues uses I, IV and V (usually all as dominant 7ths) in a fixed pattern. In C: <b>four bars of C7</b>; <b>two of F7</b>, <b>two of C7</b>; then <b>G7, F7, C7, and G7 or C7</b> in the last bar. The final G7 is the <b>turnaround</b>: it sets up the repeat.",
        "A common variation is the <b>quick change</b>: bar 2 moves to IV (F7) for one bar, then back to I. The <b>minor blues</b> uses i7, iv7 and V7 (Cm7, Fm7, G7) with the same bar layout, giving it a darker sound. Learn the shape in numbers (I, IV, V) and you can play it in any key.",
      ], { fig: { chart: { rows: [["C7", "C7", "C7", "C7"], ["F7", "F7", "C7", "C7"], ["G7", "F7", "C7", "G7"]] }, cap: "12-bar blues in C, with a turnaround in bar 12." }, hear: [play("▶ First eight bars", ["C7", "C7", "F7", "F7", "C7", "C7", "G7", "F7"], 2, 120)] }),
      quiz(
        ask("How many bars is the basic blues?", ["12", "8", "16", "32"], 0),
        ask("Which chords does a basic blues use?", ["I, IV and V", "I, ii and V", "I, vi and ii", "I only"], 0),
        ask("In C, the IV chord of the blues is…", ["F7", "G7", "Dm7", "A7"], 0),
        ask("In E, the V7 of the blues is…", ["B7", "A7", "D7", "F♯7"], 0),
        ask("A “quick change” blues goes to the IV chord in…", ["Bar 2", "Bar 1", "Bar 5", "Bar 9"], 0),
        ask("What is the last bar of the blues called when it sets up the repeat?", ["The turnaround", "The bridge", "The coda", "The intro"], 0),
        ask("A minor blues in A uses which chords?", ["Am7, Dm7, E7", "A7, D7, E7", "Am, D, E", "A, E, B"], 0),
        ask("In the key of A, the full 12 bars start with how many bars of A7?", ["4", "2", "8", "1"], 0),
      ),
    ),
    lesson(
      "T10.5",
      "Secondary dominants",
      9,
      read("Borrowing a V for another chord", [
        "Any chord in the key can be <b>tonicised</b>, treated as a temporary home, by putting its own dominant 7th in front of it. This is a <b>secondary dominant</b>, written <b>V7/x</b>, “the five of x”. In C major, the chord a fifth above any target is a dominant 7th.",
        "<b>V7/V = D7</b> (leading to G), <b>V7/vi = E7</b> (leading to Am), <b>V7/ii = A7</b> (leading to Dm), <b>V7/IV = C7</b> (leading to F). The telltale sign is a dominant 7th on a chord that is not V in the key: D7 in C major contains F♯, which is not in the scale. It acts like a spice: one outside note that pulls hard toward the next chord.",
      ], { fig: { table: { head: ["Secondary", "In C", "Leads to"], rows: [["V7/V", "D7", "G"], ["V7/vi", "E7", "Am"], ["V7/ii", "A7", "Dm"], ["V7/IV", "C7", "F"]] } }, hear: [play("▶ C – D7 – G", ["C", "D7", "G"]), play("▶ C – E7 – Am", ["C", "E7", "Am"])] }),
      quiz(
        ask("In C major, what is V7/V?", ["D7", "G7", "E7", "A7"], 0),
        ask("In C major, E7 normally leads to…", ["Am", "Dm", "F", "G"], 0),
        ask("In C major, A7 normally leads to…", ["Dm", "G", "F", "Am"], 0),
        ask("In G major, what is V7/V?", ["A7", "D7", "E7", "B7"], 0, "The V of G is D, and the V7 of D is A7."),
        ask("In C major, the note F♯ in D7 is…", ["Outside the scale: it tonicises G", "Part of the scale", "The root", "A passing rest"], 0),
        ask("What does V7/ii mean?", ["The dominant 7th that leads to chord ii", "The seventh of chord ii", "Chord V inside key ii", "A cadence on ii"], 0),
        ask("In F major, what is V7/vi?", ["A7", "C7", "D7", "E7"], 0, "vi in F is Dm; its V7 is A7."),
      ),
    ),
    lesson(
      "T10.6",
      "Colour chords: sus, add and extensions",
      9,
      read("Spice for plain triads", [
        "<b>Suspended chords</b> swap the third for another note. <b>sus4</b> raises it to the 4th (Csus4 = C F G); <b>sus2</b> lowers it to the 2nd (Csus2 = C D G). With no third they are neither major nor minor, and they often sit on the way to the plain chord: Csus4 → C.",
        "<b>Add</b> chords layer an extra note without a seventh: <b>Cadd9</b> = C E G D. A <b>6 chord</b> adds the sixth: C6 = C E G A. <b>Extensions</b> (9, 11, 13) stack further thirds above the seventh: C9 = C E G B♭ D. The number 9 is the same note as 2, one octave higher. A chord symbol with 9 includes the seventh, while “add9” does not.",
      ], { fig: { table: { head: ["Symbol", "Notes", "Idea"], rows: [["Csus2", "C D G", "Open, third replaced by 2nd"], ["Csus4", "C F G", "Tension wanting to fall to E"], ["Cadd9", "C E G D", "Triad plus a bright 9th"], ["C6", "C E G A", "Triad plus a sixth"], ["C9", "C E G B♭ D", "Dominant 7th plus a 9th"]] } }, hear: [play("▶ Csus4 → C", ["Csus4", "C"]), play("▶ Cadd9", ["Cadd9"]), play("▶ C9", ["C9"])] }),
      quiz(
        ask("Csus4 has which notes?", ["C F G", "C D G", "C E G", "C E♭ G"], 0),
        ask("Csus2 has which notes?", ["C D G", "C F G", "C E G", "C D♯ G"], 0),
        ask("Cadd9 is…", ["C E G D", "C E G B♭ D", "C F G D", "C E♭ G D"], 0),
        ask("What is the difference between C9 and Cadd9?", ["C9 includes the seventh; Cadd9 doesn’t", "None", "C9 is minor", "Cadd9 has no third"], 0),
        ask("A sus chord has no…", ["Third", "Root", "Fifth", "Bass"], 0),
        ask("A 9th is the same note as the…", ["2nd, an octave up", "4th", "7th", "Root"], 0),
        ask("Listen. This chord is…", ["Csus4 resolving to C", "C minor", "Caug", "C7"], 0, "The F falls to E.", null, play("▶", ["Csus4", "C"])),
      ),
    ),
    lesson(
      "T10.7",
      "Turnarounds and substitutions",
      9,
      read("Going round again", [
        "A <b>turnaround</b> is a short progression at the end of a section that leads back to the start. The most famous is <b>I – vi – ii – V</b>: in C, <b>C – Am – Dm – G</b>. Notice the roots fall by fifths (A → D → G → C): the engine again. Variants: <b>iii – vi – ii – V</b> (Em – Am – Dm – G), or all dominant: C – A7 – D7 – G7.",
        "A <b>substitution</b> replaces a chord with one that shares important notes. <b>Tritone sub</b>: swap a dominant 7th for the dominant a tritone away. G7 contains B and F; D♭7 contains F and C♭ (= B), the same two notes. So <b>Dm7 – D♭7 – Cmaj7</b> works like Dm7 – G7 – Cmaj7 but with a chromatic bass line D → D♭ → C.",
      ], { fig: { chart: { rows: [["C", "Am", "Dm", "G"], ["Dm7", "D♭7", "Cmaj7", "%"]] }, cap: "Top: I–vi–ii–V. Bottom: ii–♭II7–I (tritone substitution)." }, hear: [play("▶ I – vi – ii – V", ["C", "Am", "Dm", "G7"]), play("▶ With tritone sub", ["Dm7", "Db7", "Cmaj7"])] }),
      quiz(
        ask("A turnaround is…", ["A short progression leading back to the start", "A key change", "A tempo change", "A repeat sign"], 0),
        ask("I–vi–ii–V in the key of G is…", ["G – Em – Am – D", "G – Am – Em – D", "G – Em – C – D", "G – Bm – Am – D"], 0),
        ask("What is the tritone sub of G7?", ["D♭7", "C7", "F♯m7", "A7"], 0),
        ask("Why does D♭7 work in place of G7?", ["They share the same two key notes (B/C♭ and F)", "They have the same root", "Both are minor", "They are the same chord"], 0),
        ask("In I–vi–ii–V, how do the roots move?", ["Down a fifth, mostly", "Up a step", "By octave", "Stay put"], 0),
        ask("What is the tritone sub of D7?", ["A♭7", "G7", "E7", "B♭7"], 0, "A tritone (six semitones) from D is A♭."),
        ask("Listen. This progression is…", ["I – vi – ii – V", "I – IV – V", "ii – V – I", "I – iii – IV"], 0, "Fifths all the way round.", null, play("▶", ["C", "Am", "Dm", "G7"])),
      ),
    ),
  ],
  { more: [{ t: "Open Music Theory (harmony, chromaticism, jazz), free online text", u: "https://viva.pressbooks.pub/openmusictheory/" }] },
);
