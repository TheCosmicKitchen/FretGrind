/* Choose a string and fret for every note of a piece. Pure.
   For each note we list every place it can be played, then pick the path through the piece that
   keeps the hand close to where it was: a Viterbi search over the candidates with a small cost for
   position jumps, string changes and high frets. A tab written into the song (fix) always wins.
   Each result is [string, fret] of the melody note; a chord also carries .all, every [string, fret] lowest first. */
import { OPEN } from "../core/theory.js";

export const LEVELS = {
  1: { maxFret: 5, maxJump: 3 },
  2: { maxFret: 7, maxJump: 4 },
  3: { maxFret: 9, maxJump: 5 },
  4: { maxFret: 12, maxJump: 7 },
  5: { maxFret: 15, maxJump: 12 },
  6: { maxFret: 19, maxJump: 19 },
};
const REACH = 4; // most frets one hand holds at once in a chord

export const places = (midi, maxFret) => OPEN.map((o, s) => [s, midi - o]).filter(([, f]) => f >= 0 && f <= maxFret);

/* where the hand sits for a candidate: the average fretted note, 0 if everything is open */
function handOf(c) {
  const on = (c.all || [c]).map((p) => p[1]).filter((f) => f > 0);
  return on.length ? on.reduce((a, f) => a + f, 0) / on.length : 0;
}

/* Every way to hold these pitches at once: one string each, rising across the neck, within one hand's reach. */
export function grips(pitches, maxFret) {
  const out = [],
    walk = (i, held) => {
      if (i === pitches.length) {
        const top = held[held.length - 1],
          c = [top[0], top[1]];
        c.all = held;
        out.push(c);
        return;
      }
      const p = pitches[i];
      for (const pl of p.fix ? [p.fix] : places(p.midi, maxFret)) {
        if (held.length && pl[0] <= held[held.length - 1][0]) continue;
        const frets = [...held, pl].map((h) => h[1]).filter((f) => f > 0);
        if (frets.length && Math.max(...frets) - Math.min(...frets) > REACH) continue;
        walk(i + 1, [...held, pl]);
      }
    };
  walk(0, []);
  return out;
}

const candidates = (n, maxFret) => (n.pitches && n.pitches.length > 1 ? grips(n.pitches, maxFret) : n.fix ? [n.fix] : places(n.midi, maxFret));

function cost(a, b) {
  const fa = handOf(a), fb = handOf(b);
  let c = 0;
  if (fa > 0 && fb > 0) c += Math.abs(fa - fb) * 1.2; // both fretted: hand movement
  else if (fa > 0 || fb > 0) c += Math.abs(Math.max(fa, fb) - 2) * 0.35; // to or from an open string: mild
  c += Math.abs(a[0] - b[0]) * 0.35; // string change
  return c;
}
const own = (c) => handOf(c) * 0.12 + (handOf(c) === 0 ? -0.15 : 0); // low positions are easier
const topFret = (c) => Math.max(...(c.all || [c]).map((p) => p[1]));

export function tabify(song, level = song.level) {
  const L = LEVELS[level] || LEVELS[4],
    ns = song.sounding,
    cand = ns.map((n) => {
      const c = candidates(n, Math.max(L.maxFret, 12));
      return c.length ? c : candidates(n, 24); // a high passage may have nowhere to go under fret 12
    });
  if (cand.some((c) => !c.length)) throw new Error(`${song.id}: a note cannot be played on a guitar`);
  const best = cand.map((c) => c.map(() => ({ c: Infinity, from: -1 })));
  cand[0].forEach((p, j) => (best[0][j] = { c: own(p) + (topFret(p) > L.maxFret ? 6 : 0), from: -1 }));
  for (let i = 1; i < ns.length; i++)
    cand[i].forEach((p, j) => {
      const pen = own(p) + (topFret(p) > L.maxFret ? 6 + (topFret(p) - L.maxFret) : 0);
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
export function playability(song, tab, level = song.level) {
  const L = LEVELS[level] || LEVELS[4],
    bad = [];
  tab.forEach((c, i) => {
    const n = song.sounding[i],
      pitches = n.pitches || [n];
    (c.all || [c]).forEach(([s, f], k) => {
      const want = c.all ? pitches[k] : n;
      if (OPEN[s] + f !== want.midi) bad.push(`note ${i + 1}: string ${6 - s} fret ${f} is not ${want.name}`);
      if (f > L.maxFret) bad.push(`note ${i + 1}: fret ${f} is above fret ${L.maxFret} for level ${level}`);
    });
    if (i && handOf(c) > 0 && handOf(tab[i - 1]) > 0 && Math.abs(handOf(c) - handOf(tab[i - 1])) > L.maxJump)
      bad.push(`note ${i + 1}: jump of ${Math.round(Math.abs(handOf(c) - handOf(tab[i - 1])))} frets`);
  });
  return bad;
}

/* The easiest level a piece fits, from where its tab sits on the neck. */
export function levelOfTab(song) {
  for (const lv of Object.keys(LEVELS).map(Number)) if (!playability(song, tabify(song, lv), lv).length) return lv;
  return 6;
}
