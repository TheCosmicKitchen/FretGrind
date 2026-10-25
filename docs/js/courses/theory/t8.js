/* Theory 8: Modes and borrowed colour. The seven modes, how they sound, the chords that go with them, and borrowing from the parallel minor. */
import { ask, course, lesson, quiz, read } from "../dsl.js";

const STEPS = {
  ionian: [2, 2, 1, 2, 2, 2, 1],
  dorian: [2, 1, 2, 2, 2, 1, 2],
  phrygian: [1, 2, 2, 2, 1, 2, 2],
  lydian: [2, 2, 2, 1, 2, 2, 1],
  mixolydian: [2, 2, 1, 2, 2, 1, 2],
  aeolian: [2, 1, 2, 2, 1, 2, 2],
  locrian: [1, 2, 2, 1, 2, 2, 2],
};
const up = (start, steps) => steps.reduce((a, s) => [...a, a[a.length - 1] + s], [start]);
const scale = (start, mode, l, tempo = 150) => ({ l: l || "▶ " + mode[0].toUpperCase() + mode.slice(1), seq: up(start, STEPS[mode]), onsets: [0, 1, 2, 3, 4, 5, 6, 7], tempo });
// a chord as a quick arpeggio, three notes per chord
const arp = (l, chords, tempo = 160) => ({ l, seq: chords.flat(), onsets: chords.flatMap((c, i) => c.map((_, j) => i * 3 + j * 0.5)), tempo });

export const T8 = course(
  "T8",
  "Modes and borrowed colour",
  "The seven modes, what makes each one sound the way it does, modal chord moves, and borrowing chords from the parallel minor.",
  [
    lesson(
      "T8.1",
      "What is a mode?",
      8,
      read("Same notes, different home", [
        "Play the white keys from C to C and you hear C major. Now play the same white keys from <b>D to D</b>: same seven notes, but a different home note, and so a different mood. That is a <b>mode</b>: a scale you get by starting on another degree of a parent scale.",
        "Each degree of the major scale gives one mode, and each has a Greek-sounding name: <b>Ionian</b> (starting on 1, the ordinary major scale), <b>Dorian</b> (2), <b>Phrygian</b> (3), <b>Lydian</b> (4), <b>Mixolydian</b> (5), <b>Aeolian</b> (6, the natural minor) and <b>Locrian</b> (7).",
      ], { fig: { table: { head: ["Start on", "Mode", "White-key scale"], rows: [["C", "Ionian", "C D E F G A B"], ["D", "Dorian", "D E F G A B C"], ["E", "Phrygian", "E F G A B C D"], ["F", "Lydian", "F G A B C D E"], ["G", "Mixolydian", "G A B C D E F"], ["A", "Aeolian", "A B C D E F G"], ["B", "Locrian", "B C D E F G A"]] } }, hear: [scale(60, "ionian", "▶ C Ionian (major)"), scale(62, "dorian", "▶ D Dorian"), scale(64, "phrygian", "▶ E Phrygian")] }),
      read("Each mode has its own step pattern", [
        "Because the half steps (E–F and B–C) fall in different places, each mode has its own pattern of whole (W) and half (H) steps: Dorian is <b>W H W W W H W</b>, Mixolydian <b>W W H W W H W</b>, Lydian <b>W W W H W W H</b>. You can build any mode on any root by applying its pattern, just as you do for the major scale.",
      ], { fig: { pattern: { steps: ["W", "H", "W", "W", "W", "H", "W"], notes: ["D", "E", "F", "G", "A", "B", "C", "D"] }, cap: "D Dorian: the white keys D to D." } }),
      quiz(
        ask("A mode is…", ["A scale built by starting on another degree of a parent scale", "A kind of chord", "A time signature", "A tuning"], 0),
        ask("Playing the white keys from D to D gives…", ["D Dorian", "D major", "D Lydian", "D Aeolian"], 0),
        ask("Which mode is the same as the natural minor scale?", ["Aeolian", "Dorian", "Lydian", "Phrygian"], 0),
        ask("Which mode is the same as the major scale?", ["Ionian", "Mixolydian", "Locrian", "Dorian"], 0),
        ask("The mode that starts on the 5th degree of the major scale is…", ["Mixolydian", "Lydian", "Phrygian", "Locrian"], 0),
        ask("What is the step pattern of Dorian?", ["W H W W W H W", "W W H W W W H", "H W W W H W W", "W W W H W W H"], 0),
        ask("Which white-key scale is E Phrygian?", ["E F G A B C D", "E F♯ G A B C♯ D", "E F♯ G♯ A B C♯ D♯", "E F G A B C♯ D"], 0),
      ),
    ),
    lesson(
      "T8.2",
      "Dorian and Mixolydian",
      8,
      read("The two modes you will meet most", [
        "<b>Dorian</b> is a minor sound with a lift. Compared with the natural minor (Aeolian) it has a <b>raised 6th</b>: formula <b>1 2 ♭3 4 5 6 ♭7</b>. D Dorian is D E F G A B C. The old English tune <i>Scarborough Fair</i> and the sea shanty <i>Drunken Sailor</i> are usually described as Dorian. The signature chord move is <b>i – IV</b> (Dm – G): a minor chord rocking to a major one.",
        "<b>Mixolydian</b> is a major sound with a relaxed edge: a major scale with a <b>lowered 7th</b>, formula <b>1 2 3 4 5 6 ♭7</b>. G Mixolydian is G A B C D E F. The fiddle tune <i>Old Joe Clark</i> is usually played Mixolydian, and so are countless rock and blues riffs. The signature move is <b>I – ♭VII</b> (G – F).",
      ], { fig: { table: { head: ["Mode", "Formula", "On D / G", "Home chords"], rows: [["Dorian", "1 2 ♭3 4 5 6 ♭7", "D E F G A B C", "Dm – G"], ["Mixolydian", "1 2 3 4 5 6 ♭7", "G A B C D E F", "G – F"]] } }, hear: [scale(62, "dorian", "▶ D Dorian"), scale(67, "mixolydian", "▶ G Mixolydian"), arp("▶ Dm – G", [[62, 65, 69], [67, 71, 74]]), arp("▶ G – F", [[67, 71, 74], [65, 69, 72]])] }),
      quiz(
        ask("Dorian differs from natural minor by having a…", ["Raised 6th", "Lowered 2nd", "Raised 7th", "Lowered 5th"], 0),
        ask("Mixolydian differs from major by having a…", ["Lowered 7th", "Raised 4th", "Lowered 3rd", "Raised 5th"], 0),
        ask("Which chord pair is typical of Dorian?", ["i – IV (Dm – G)", "I – ♭VII (G – F)", "I – V (C – G)", "i – ♭II (Em – F)"], 0),
        ask("Which chord pair is typical of Mixolydian?", ["I – ♭VII (G – F)", "i – IV (Dm – G)", "ii – V (Dm – G)", "I – IV (C – F)"], 0),
        ask("What are the notes of G Mixolydian?", ["G A B C D E F", "G A B♭ C D E F", "G A B C D E F♯", "G A♭ B♭ C D E♭ F"], 0),
        ask("What are the notes of D Dorian?", ["D E F G A B C", "D E F G A B♭ C", "D E F♯ G A B C", "D E♭ F G A B C"], 0),
        ask("Listen. Which mode is this?", ["Mixolydian", "Ionian (major)", "Dorian", "Aeolian"], 0, "The major third is there, but the 7th is a whole step below the top.", null, scale(67, "mixolydian")),
        ask("Listen. Which mode is this?", ["Dorian", "Mixolydian", "Lydian", "Phrygian"], 0, "A minor sound with a bright 6th.", null, scale(62, "dorian")),
      ),
    ),
    lesson(
      "T8.3",
      "Lydian, Phrygian, Aeolian and Locrian",
      8,
      read("The rest of the family, brightest to darkest", [
        "Line the seven modes up by how many notes are raised (bright) or lowered (dark) compared with major: <b>Lydian</b> (♯4) is brightest, then <b>Ionian</b>, <b>Mixolydian</b> (♭7), <b>Dorian</b> (♭3 ♭7), <b>Aeolian</b> (♭3 ♭6 ♭7), <b>Phrygian</b> (♭2 ♭3 ♭6 ♭7) and <b>Locrian</b> (♭2 ♭3 ♭5 ♭6 ♭7) darkest.",
        "Each has one <b>characteristic note</b> that gives its colour: Lydian’s <b>♯4</b> (dreamy, floating), Phrygian’s <b>♭2</b> (dark, Spanish), Aeolian’s <b>♭6</b> (plain minor), Locrian’s <b>♭5</b> (unstable: its tonic chord is diminished, so it is rarely a home key).",
      ], { fig: { table: { head: ["Mode", "Formula", "Colour note"], rows: [["Lydian", "1 2 3 ♯4 5 6 7", "♯4"], ["Ionian", "1 2 3 4 5 6 7", "none: plain major"], ["Mixolydian", "1 2 3 4 5 6 ♭7", "♭7"], ["Dorian", "1 2 ♭3 4 5 6 ♭7", "natural 6"], ["Aeolian", "1 2 ♭3 4 5 ♭6 ♭7", "♭6"], ["Phrygian", "1 ♭2 ♭3 4 5 ♭6 ♭7", "♭2"], ["Locrian", "1 ♭2 ♭3 4 ♭5 ♭6 ♭7", "♭5"]] } }, hear: [scale(65, "lydian", "▶ F Lydian"), scale(64, "phrygian", "▶ E Phrygian"), scale(71, "locrian", "▶ B Locrian")] }),
      quiz(
        ask("Which mode is the brightest?", ["Lydian", "Dorian", "Aeolian", "Locrian"], 0),
        ask("Which mode is the darkest?", ["Locrian", "Phrygian", "Aeolian", "Dorian"], 0),
        ask("Lydian’s characteristic note is the…", ["♯4", "♭2", "♭7", "♭6"], 0),
        ask("Phrygian’s characteristic note is the…", ["♭2", "♯4", "♭7", "natural 6"], 0),
        ask("Locrian’s tonic chord is…", ["Diminished", "Major", "Minor", "Augmented"], 0, "Its 3rd and 5th are both flat: 1 ♭3 ♭5."),
        ask("Which mode has the formula 1 ♭2 ♭3 4 5 ♭6 ♭7?", ["Phrygian", "Locrian", "Aeolian", "Dorian"], 0),
        ask("Which mode is F G A B C D E?", ["F Lydian", "F Ionian", "F Mixolydian", "F Dorian"], 0, "The B natural is the ♯4 of F."),
        ask("Listen. Which mode is this?", ["Lydian", "Ionian", "Phrygian", "Locrian"], 0, "Major sound with a raised 4th.", null, scale(65, "lydian")),
      ),
    ),
    lesson(
      "T8.4",
      "Building a mode on any note",
      9,
      read("Two ways to think, one answer", [
        "<b>Relative thinking:</b> a mode is a rotation of its parent major scale. A Dorian on D uses the notes of C major (the key a whole step <i>below</i>). So to find G Dorian: the major scale with G as its 2nd degree is F major (F G A B♭ C D E), so G Dorian is G A B♭ C D E F.",
        "<b>Parallel thinking:</b> start from the major scale on the <i>same</i> root and alter notes using the formula. G Dorian: G major (G A B C D E F♯) with a ♭3 and ♭7: G A B♭ C D E F. Both give the same notes. Relative thinking is fastest for reading, parallel thinking is best for hearing the colour, because you compare it with the major scale on the same note.",
      ], { fig: { table: { head: ["Mode on the 2nd degree", "Parent key", "Mode"], rows: [["D Dorian", "C major", "D E F G A B C"], ["E Dorian", "D major", "E F♯ G A B C♯ D"], ["G Dorian", "F major", "G A B♭ C D E F"], ["A Dorian", "G major", "A B C D E F♯ G"]] } } }),
      quiz(
        ask("G Dorian uses the notes of which major scale?", ["F major", "C major", "D major", "B♭ major"], 0),
        ask("Which notes make E Dorian?", ["E F♯ G A B C♯ D", "E F♯ G♯ A B C♯ D♯", "E F G A B C D", "E F♯ G A B C D"], 0),
        ask("A Mixolydian uses the notes of which major scale?", ["D major", "E major", "G major", "A major"], 0, "A is the 5th degree of D."),
        ask("B♭ Mixolydian uses the notes of which major scale?", ["E♭ major", "F major", "B♭ major", "A♭ major"], 0),
        ask("Parallel to G major, G Mixolydian has a…", ["Lowered 7th", "Lowered 3rd", "Raised 4th", "Lowered 2nd"], 0),
        ask("Parallel to C major, C Lydian has a…", ["Raised 4th", "Lowered 7th", "Lowered 3rd", "Lowered 6th"], 0),
        ask("Which notes make A Phrygian?", ["A B♭ C D E F G", "A B C D E F G", "A B C♯ D E F♯ G", "A B♭ C D E♭ F G"], 0, "A Phrygian is F major, starting on its 3rd degree."),
        ask("Relative to D Dorian, which major scale has the same notes?", ["C major", "D major", "F major", "G major"], 0),
      ),
    ),
    lesson(
      "T8.5",
      "Modal chord moves and vamps",
      8,
      read("Chords that say the mode", [
        "A mode does not need a long progression: two chords repeated (a <b>vamp</b>) are enough to set the colour. The trick is to use the chord that contains the <b>characteristic note</b>. Each mode’s fingerprint:",
        "<b>Dorian</b>: i – IV (Dm – G): the major IV carries the natural 6th. <b>Mixolydian</b>: I – ♭VII (G – F), or I – ♭VII – IV: the ♭VII carries the flat 7th. <b>Lydian</b>: I – II (F – G): the major II carries the ♯4. <b>Phrygian</b>: i – ♭II (Em – F): the half-step move up is the sound of flamenco and heavy metal. <b>Aeolian</b>: i – ♭VI – ♭VII (Am – F – G).",
        "These are the progressions where <b>functional harmony</b> (V pulling to I) is largely absent: the music feels like it rests on the tonic rather than driving to it.",
      ], { fig: { table: { head: ["Mode", "Vamp", "In key of"], rows: [["Dorian", "i – IV", "Dm – G"], ["Mixolydian", "I – ♭VII", "G – F"], ["Lydian", "I – II", "F – G"], ["Phrygian", "i – ♭II", "Em – F"], ["Aeolian", "i – ♭VI – ♭VII", "Am – F – G"]] } }, hear: [arp("▶ Dm – G (Dorian)", [[62, 65, 69], [67, 71, 74]]), arp("▶ F – G (Lydian)", [[65, 69, 72], [67, 71, 74]]), arp("▶ Em – F (Phrygian)", [[64, 67, 71], [65, 69, 72]])] }),
      quiz(
        ask("Which move says Mixolydian?", ["I – ♭VII", "i – IV", "I – II", "i – ♭II"], 0),
        ask("Which move says Dorian?", ["i – IV", "I – ♭VII", "I – V", "i – ♭VI"], 0),
        ask("Which move says Lydian?", ["I – II", "i – ♭II", "I – ♭VII", "i – iv"], 0),
        ask("Which move says Phrygian?", ["i – ♭II", "I – II", "i – IV", "I – ♭VII"], 0),
        ask("In Dorian, why does the IV chord matter?", ["It carries the natural 6th", "It carries the flat 2nd", "It carries the sharp 4th", "It is the dominant"], 0),
        ask("A vamp is…", ["A short chord pattern repeated", "A long modulation", "A cadence", "A key signature"], 0),
        ask("The chords G – F in the key of G are…", ["I – ♭VII", "V – IV", "I – IV", "ii – I"], 0),
        ask("Listen. Which vamp is this?", ["i – ♭II (Phrygian)", "i – IV (Dorian)", "I – II (Lydian)", "I – V (major)"], 0, "A minor chord stepping up a half step to a major chord.", null, arp("▶", [[64, 67, 71], [65, 69, 72]])),
      ),
    ),
    lesson(
      "T8.6",
      "Borrowed chords",
      8,
      read("Borrowing from the parallel minor", [
        "A song in C major can <b>borrow</b> chords from C minor (its parallel minor). This is <b>modal mixture</b> or <b>modal interchange</b>. The most common borrowed chords in C major are <b>♭VII</b> (B♭), <b>♭VI</b> (A♭), <b>♭III</b> (E♭) and <b>iv</b> (Fm), all from C Aeolian (C minor).",
        "The effect is a darker, more dramatic colour that passes quickly. The classic example is the <b>minor iv</b> sneaking into a major song: <b>I – IV – iv – I</b> (C – F – Fm – C) is the sound of a wistful ending in countless songs. A common four-chord pop line is <b>I – ♭VII – ♭VI – V</b> (C – B♭ – A♭ – G): the middle two chords are borrowed.",
      ], { fig: { chart: { rows: [["C", "F", "Fm", "C"], ["C", "B♭", "A♭", "G"]] }, cap: "Two examples: C – F – Fm – C and C – B♭ – A♭ – G (borrowed chords are Fm, B♭ and A♭)." }, hear: [arp("▶ C – F – Fm – C", [[60, 64, 67], [60, 65, 69], [60, 65, 68], [60, 64, 67]], 140), arp("▶ C – B♭ – A♭ – G", [[60, 64, 67], [58, 62, 65], [56, 60, 63], [55, 59, 62]], 140)] }),
      quiz(
        ask("Modal mixture means…", ["Borrowing chords from the parallel minor (or another mode)", "Mixing two time signatures", "Playing two keys at once", "Adding a capo"], 0),
        ask("In C major, which chord is a borrowed ♭VII?", ["B♭", "B", "B♭m", "Bdim"], 0),
        ask("In C major, which chord is a borrowed iv?", ["Fm", "F", "Fmaj7", "F7"], 0),
        ask("In C major, which chord is ♭VI?", ["A♭", "A", "Am", "E♭"], 0),
        ask("C – F – Fm – C borrows…", ["The minor iv from C minor", "The V from G major", "A tritone substitute", "A secondary dominant"], 0),
        ask("Why do borrowed chords sound dark?", ["They come from the minor key with the same tonic", "They are louder", "They are always diminished", "They come from the dominant key"], 0),
        ask("In the key of G major, a borrowed ♭VII chord would be…", ["F", "F♯", "Fm", "Fdim"], 0),
        ask("In the key of D major, a borrowed ♭VI chord would be…", ["B♭", "B", "Bm", "A♭"], 0),
      ),
    ),
  ],
  { more: [{ t: "Open Music Theory (modes, mixture), free online text", u: "https://viva.pressbooks.pub/openmusictheory/" }] },
);
