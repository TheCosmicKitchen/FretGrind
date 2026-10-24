/* Short public-domain themes for the "Follow the score" game: 4 bars of 4 notes each, with chord and key. */
export const SONGS = [
  {
    id: "joy",
    title: "Ode to Joy",
    composer: "Beethoven · Symphony No. 9",
    scale: "C major",
    bars: [
      { notes: [64, 64, 65, 67], chord: "C major", harmony: [60, 64, 67] },
      { notes: [67, 65, 64, 62], chord: "G7", harmony: [67, 71, 74, 77] },
      { notes: [60, 60, 62, 64], chord: "C major", harmony: [60, 64, 67] },
      { notes: [64, 62, 60, 60], chord: "C major", harmony: [60, 64, 67] },
    ],
  },
  {
    id: "fifth",
    title: "Symphony No. 5",
    composer: "Beethoven · Symphony No. 5",
    scale: "C minor",
    flats: true, // key signature has flats: spell E♭, not D♯
    bars: [
      { notes: [67, 67, 67, 63], chord: "G7", harmony: [67, 71, 74, 77] },
      { notes: [65, 65, 65, 62], chord: "C minor", harmony: [60, 63, 67] },
      { notes: [67, 67, 67, 63], chord: "G7", harmony: [67, 71, 74, 77] },
      { notes: [65, 65, 65, 62], chord: "C minor", harmony: [60, 63, 67] },
    ],
  },
  {
    id: "mozart",
    title: "Eine kleine Nachtmusik",
    composer: "Mozart · Serenade No. 13",
    scale: "G major",
    bars: [
      { notes: [67, 74, 67, 74], chord: "G major", harmony: [67, 71, 74] },
      { notes: [67, 74, 67, 71], chord: "D7", harmony: [62, 66, 69, 72] },
      { notes: [74, 74, 74, 74], chord: "G major", harmony: [67, 71, 74] },
      { notes: [74, 72, 71, 69], chord: "D7", harmony: [62, 66, 69, 72] },
    ],
  },
];
