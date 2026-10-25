/* Choose a string and fret for every note of a melody. Pure.
   For each note we list every place it can be played, then pick the path through the song that
   keeps the hand close to where it was: a Viterbi search over the candidates with a small cost for
   position jumps, string changes and high frets. A tab written into the song (fix) always wins. */
import { OPEN } from "../core/theory.js";

export const LEVELS = {
  1: { maxFret: 5, maxJump: 3 },
  2: { maxFret: 7, maxJump: 4 },
  3: { maxFret: 9, maxJump: 5 },
  4: { maxFret: 12, maxJump: 7 },
};

export const places = (midi, maxFret) => OPEN.map((o, s) => [s, midi - o]).filter(([, f]) => f >= 0 && f <= maxFret);

function cost(a, b) {
  const fa = a[1], fb = b[1];
  let c = 0;
  if (fa > 0 && fb > 0) c += Math.abs(fa - fb) * 1.2; // both fretted: hand movement
  else if (fa > 0 || fb > 0) c += Math.abs(Math.max(fa, fb) - 2) * 0.35; // to or from an open string: mild
  c += Math.abs(a[0] - b[0]) * 0.35; // string change
  return c;
}
const own = (c) => c[1] * 0.12 + (c[1] === 0 ? -0.15 : 0); // low positions are easier

export function tabify(song, level = song.level) {
  const L = LEVELS[level] || LEVELS[4],
    ns = song.sounding,
    cand = ns.map((n) => (n.fix ? [n.fix] : places(n.midi, Math.max(L.maxFret, 12))));
  if (cand.some((c) => !c.length)) throw new Error(`${song.id}: a note cannot be played on a guitar`);
  const best = cand.map((c) => c.map(() => ({ c: Infinity, from: -1 })));
  cand[0].forEach((p, j) => (best[0][j] = { c: own(p) + (p[1] > L.maxFret ? 6 : 0), from: -1 }));
  for (let i = 1; i < ns.length; i++)
    cand[i].forEach((p, j) => {
      const pen = own(p) + (p[1] > L.maxFret ? 6 + (p[1] - L.maxFret) : 0);
      cand[i - 1].forEach((q, k) => {
        const c = best[i - 1][k].c + cost(q, p) + pen;
        if (c < best[i][j].c) best[i][j] = { c, from: k };
      });
    });
  let j = best[ns.length - 1].reduce((bi, x, k, arr) => (x.c < arr[bi].c ? k : bi), 0);
  const out = new Array(ns.length);
  for (let i = ns.length - 1; i >= 0; i--) {
    out[i] = cand[i][j];
    j = best[i][j].from;
  }
  return out;
}

/* Playability problems for the song's level (empty list = fine). */
export function playability(song, tab) {
  const L = LEVELS[song.level] || LEVELS[4],
    bad = [];
  tab.forEach(([s, f], i) => {
    if (OPEN[s] + f !== song.sounding[i].midi) bad.push(`note ${i + 1}: string ${6 - s} fret ${f} is not ${song.sounding[i].name}`);
    if (f > L.maxFret) bad.push(`note ${i + 1}: fret ${f} is above fret ${L.maxFret} for level ${song.level}`);
    if (i && f > 0 && tab[i - 1][1] > 0 && Math.abs(f - tab[i - 1][1]) > L.maxJump) bad.push(`note ${i + 1}: jump of ${Math.abs(f - tab[i - 1][1])} frets`);
  });
  return bad;
}
