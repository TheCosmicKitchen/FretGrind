/* The song library. Every melody is public domain (composer died before 1926, or traditional) and the
   notation and tab are our own, entered by hand and not copied from any edition.
   Format: see format.js. Pitches are written guitar pitch (open strings E3 A3 D4 G4 B4 E5).
   reviewed:false means the tab was chosen by the program and nobody has checked it by hand yet. */
export const SONGS = [
  {
    id: "joy",
    title: "Ode to Joy",
    by: "Beethoven",
    level: 1,
    key: "C",
    time: "4/4",
    tempo: 96,
    tags: ["first two strings", "quarter notes"],
    bars: `E5:4 E5:4 F5:4 G5:4 | G5:4 F5:4 E5:4 D5:4 | C5:4 C5:4 D5:4 E5:4 | E5:6 D5:2 D5:8 |
           E5:4 E5:4 F5:4 G5:4 | G5:4 F5:4 E5:4 D5:4 | C5:4 C5:4 D5:4 E5:4 | D5:6 C5:2 C5:8`,
    source: "Theme from the finale of Symphony No. 9 (1824) by Ludwig van Beethoven (1770-1827).",
  },
  {
    id: "twinkle",
    title: "Twinkle, Twinkle, Little Star",
    by: "French melody, 1761",
    level: 1,
    key: "C",
    time: "4/4",
    tempo: 100,
    tags: ["first two strings", "jump of a fifth"],
    bars: `C5:4 C5:4 G5:4 G5:4 | A5:4 A5:4 G5:8 | F5:4 F5:4 E5:4 E5:4 | D5:4 D5:4 C5:8 |
           G5:4 G5:4 F5:4 F5:4 | E5:4 E5:4 D5:8 | G5:4 G5:4 F5:4 F5:4 | E5:4 E5:4 D5:8 |
           C5:4 C5:4 G5:4 G5:4 | A5:4 A5:4 G5:8 | F5:4 F5:4 E5:4 E5:4 | D5:4 D5:4 C5:8`,
    words: `Twin- kle twin- kle lit- tle star how I won- der what you are
            up a- bove the world so high like a dia- mond in the sky
            Twin- kle twin- kle lit- tle star how I won- der what you are`,
    source: "The melody of the French song \"Ah! vous dirai-je, maman\" (1761); the English words are by Jane Taylor (1806).",
  },
  {
    id: "hotcross",
    title: "Hot Cross Buns",
    by: "English street cry",
    level: 1,
    key: "C",
    time: "4/4",
    tempo: 92,
    tags: ["three notes", "eighth notes"],
    bars: `E5:4 D5:4 C5:8 | E5:4 D5:4 C5:8 | C5:2 C5:2 C5:2 C5:2 D5:2 D5:2 D5:2 D5:2 | E5:4 D5:4 C5:8`,
    words: `Hot cross buns Hot cross buns one a pen- ny two a pen- ny Hot cross buns`,
    source: "Traditional English street cry and nursery rhyme, 18th century.",
  },
  {
    id: "mary",
    title: "Mary Had a Little Lamb",
    by: "American, 1830s",
    level: 1,
    key: "C",
    time: "4/4",
    tempo: 100,
    tags: ["first two strings", "repeated notes"],
    bars: `E5:4 D5:4 C5:4 D5:4 | E5:4 E5:4 E5:8 | D5:4 D5:4 D5:8 | E5:4 G5:4 G5:8 |
           E5:4 D5:4 C5:4 D5:4 | E5:4 E5:4 E5:4 E5:4 | D5:4 D5:4 E5:4 D5:4 | C5:16`,
    words: `Ma- ry had a lit- tle lamb lit- tle lamb lit- tle lamb Ma- ry had a lit- tle lamb its fleece was white as snow`,
    source: "American nursery rhyme, published by Sarah Josepha Hale in 1830; the tune is traditional.",
  },
  {
    id: "jacques",
    title: "Frère Jacques",
    by: "French round",
    level: 1,
    key: "C",
    time: "4/4",
    tempo: 100,
    tags: ["first two strings", "eighth notes", "round"],
    bars: `C5:4 D5:4 E5:4 C5:4 | C5:4 D5:4 E5:4 C5:4 | E5:4 F5:4 G5:8 | E5:4 F5:4 G5:8 |
           G5:2 A5:2 G5:2 F5:2 E5:4 C5:4 | G5:2 A5:2 G5:2 F5:2 E5:4 C5:4 | C5:4 G4:4 C5:8 | C5:4 G4:4 C5:8`,
    words: `Frè- re Jac- ques Frè- re Jac- ques dor- mez- vous dor- mez- vous
            Son- nez les ma- ti- nes Son- nez les ma- ti- nes din din don din din don`,
    source: "French round, 18th century. Try it as a round: start the second player two bars in.",
  },
  {
    id: "boat",
    title: "Row, Row, Row Your Boat",
    by: "Eliphalet Oram Lyte, 1852",
    level: 1,
    key: "G",
    time: "6/8",
    tempo: 72,
    tags: ["6/8 time", "eighth notes", "round"],
    bars: `G4:6 G4:6 | G4:4 A4:2 B4:6 | B4:4 A4:2 B4:4 C5:2 | D5:12 |
           G5:2 G5:2 G5:2 D5:2 D5:2 D5:2 | B4:2 B4:2 B4:2 G4:2 G4:2 G4:2 | D5:4 C5:2 B4:4 A4:2 | G4:12`,
    words: `Row row row your boat gent- ly down the stream mer- ri- ly mer- ri- ly mer- ri- ly mer- ri- ly life is but a dream`,
    source: "Eliphalet Oram Lyte (1842-1913), published 1852. The beat here is the dotted quarter note.",
  },
  {
    id: "london",
    title: "London Bridge Is Falling Down",
    by: "English nursery rhyme",
    level: 1,
    key: "G",
    time: "2/4",
    tempo: 100,
    tags: ["dotted rhythm", "stepwise"],
    bars: `D5:3 E5:1 D5:2 C5:2 | B4:2 C5:2 D5:4 | A4:2 B4:2 C5:4 | B4:2 C5:2 D5:4 |
           D5:3 E5:1 D5:2 C5:2 | B4:2 C5:2 D5:4 | A4:4 D5:4 | B4:4 G4:4`,
    words: `Lon- don Bridge is fall- ing down fall- ing down fall- ing down Lon- don Bridge is fall- ing down my fair la- dy`,
    source: "English nursery rhyme, 17th-18th century.",
  },
  {
    id: "birthday",
    title: "Happy Birthday to You",
    by: "Mildred J. Hill, 1893",
    level: 2,
    key: "G",
    time: "3/4",
    tempo: 100,
    pickup: 4,
    tags: ["pick-up notes", "dotted rhythm", "leap to the octave"],
    bars: `D4:3 D4:1 | E4:4 D4:4 G4:4 | F#4:8 D4:3 D4:1 | E4:4 D4:4 A4:4 | G4:8 D4:3 D4:1 |
           D5:4 B4:4 G4:4 | F#4:4 E4:4 C5:3 C5:1 | B4:4 G4:4 A4:4 | G4:12`,
    words: `Hap- py birth- day to you Hap- py birth- day to you Hap- py birth- day dear name _ Hap- py birth- day to you`,
    source: "Tune \"Good Morning to All\" by Mildred J. Hill (1859-1916), published 1893.",
  },
  {
    id: "elise",
    title: "Für Elise (opening theme)",
    by: "Beethoven",
    level: 3,
    key: "Am",
    time: "3/8",
    tempo: 100,
    pickup: 2,
    tags: ["sixteenth notes", "rests", "string crossing", "accidentals"],
    bars: `E5:1 D#5:1 | E5:1 D#5:1 E5:1 B4:1 D5:1 C5:1 | A4:2 r:1 C4:1 E4:1 A4:1 | B4:2 r:1 E4:1 G#4:1 B4:1 | C5:2 r:1 E4:1 E5:1 D#5:1 |
           E5:1 D#5:1 E5:1 B4:1 D5:1 C5:1 | A4:2 r:1 C4:1 E4:1 A4:1 | B4:2 r:1 E4:1 C5:1 B4:1 | A4:6`,
    source: "Bagatelle in A minor, WoO 59, by Ludwig van Beethoven (1770-1827), composed about 1810. Count one eighth note per beat.",
  },
].map((s) => ({ reviewed: false, ...s }));
