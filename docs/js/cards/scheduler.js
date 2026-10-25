/* Which card comes next, and what happens when it is answered.
   Two modes: "bag" (shuffle bag, every card once per round) and "srs" (spaced repetition). */
import { S, ui, save } from "../core/store.js";
import { shuf } from "../core/theory.js";
import { cardInRegion, deckKeys } from "../core/decks.js";
import { play } from "../core/audio.js";
import { holdMic, mic } from "../core/mic.js";
import { render } from "../core/bus.js";
import { Q } from "./questions.js";

const HR = 36e5,
  IV = [0, 4 * HR, 8 * HR, 24 * HR, 48 * HR, 168 * HR, 336 * HR, 720 * HR, 2880 * HR, 9e15]; // wait after each level
export const grp = (s) => (s < 5 ? 0 : s < 7 ? 1 : s < 8 ? 2 : s < 9 ? 3 : 4); // level -> Apprentice..Burned
export const GN = ["Apprentice", "Guru", "Master", "Enlightened", "Burned"],
  GC = ["#e0508f", "#8b5bd6", "#3b7fe0", "#19a0c9", "#7d7a74"];

const MAX_LEARNING = 20, // how many not-yet-learned cards can be in rotation at once
  INTRO_WINDOW = 8, // new cards are drawn at random from the next N in a deck
  FREE_GRIND_POOL = 30; // when nothing is due, practise a random one of the N weakest cards

/* Is this card in what is being practised: My deck, or the chosen decks and board regions? */
export const scoped = (k) => (S.onlyMine ? Array.isArray(S.mine) && S.mine.includes(k) : S.act.includes(k.slice(0, k.indexOf(":"))) && cardInRegion(k));

export const bag = { cards: [], sig: "" }; // cards still to be drawn in this round, and which decks it was built from

export function pick() {
  const n = Date.now();
  if (S.onlyMine) for (const k of S.mine || []) if (!S.it[k]) S.it[k] = { s: 0, due: 0, seen: 0 };
  const ent = Object.entries(S.it).filter(([k]) => scoped(k));
  if (S.mode === "bag") {
    // Shuffle bag ("tetris" style): every card in the enabled decks once per round, in random order.
    const sig = S.onlyMine ? "mine|" + S.mine.join() : [...S.act].sort().join() + "|" + S.regions.join();
    if (sig !== bag.sig) {
      bag.cards = [];
      bag.sig = sig;
    }
    if (!bag.cards.length) {
      bag.cards = shuf(S.onlyMine ? S.mine.slice() : S.act.flatMap(deckKeys));
      const e = bag.cards.length - 1;
      if (e > 0 && bag.cards[e] === ui.last) [bag.cards[0], bag.cards[e]] = [bag.cards[e], bag.cards[0]]; // no repeat across a refill
    }
    if (!bag.cards.length) return null;
    const k = bag.cards.pop();
    if (!S.it[k]) S.it[k] = { s: 0, due: 0, seen: 0 };
    save();
    return { k, prac: 1, bag: 1 };
  }
  const ri = ui.retry.findIndex((r) => r.at <= ui.cnt && S.it[r.k] && scoped(r.k));
  if (ri >= 0) return { k: ui.retry.splice(ri, 1)[0].k };
  const un = ent.find(([, v]) => !v.seen);
  if (un) return { k: un[0], lesson: 1 };
  const due = ent.filter(([k, v]) => v.s < 9 && v.due <= n && k !== ui.last);
  if (due.length) return { k: due[(Math.random() * due.length) | 0][0] };
  if (!S.onlyMine && ent.filter(([, v]) => v.s < 5).length < MAX_LEARNING) {
    const c = S.act
      .map((d) => [d, deckKeys(d).filter((k) => !S.it[k])])
      .filter((x) => x[1].length)
      .sort((a, b) => deckKeys(a[0]).length - a[1].length - (deckKeys(b[0]).length - b[1].length));
    if (c.length) {
      // pick randomly from the next few unseen cards (still easiest-first) instead of always the first
      const win = c[0][1].slice(0, INTRO_WINDOW),
        k = win[(Math.random() * win.length) | 0];
      S.it[k] = { s: 0, due: 0, seen: 0 };
      save();
      return { k, lesson: 1 };
    }
  }
  const pool = ent
    .filter(([k]) => k !== ui.last)
    .sort((a, b) => a[1].s - b[1].s)
    .slice(0, FREE_GRIND_POOL);
  return pool.length ? { k: pool[(Math.random() * pool.length) | 0][0], prac: 1 } : null;
}

export function next() {
  clearTimeout(ui.tm);
  ui.rs = 0; // any new card cancels a pending "tap again to erase"
  const p = pick();
  ui.cnt++;
  holdMic();
  if (!p) {
    ui.cur = null;
    return render();
  }
  ui.last = p.k;
  ui.cur = { k: p.k, q: Q(p.k), lesson: p.lesson, prac: p.prac, bag: p.bag, sel: new Set(), done: 0 };
  render();
}

/* The current card was answered (ok = right or wrong; tp = the tapped fretboard spot). */
export function fin(ok, tp) {
  const cur = ui.cur;
  if (cur.done) return;
  cur.done = 1;
  cur.ok = ok;
  cur.tp = tp;
  const it = S.it[cur.k],
    n = Date.now();
  it.seen = 1;
  if (ok) {
    S.xp += 10;
    S.st++;
    S.best = Math.max(S.best, S.st);
    if (!cur.prac) {
      it.s = Math.min(9, it.s + 1);
      it.due = n + IV[it.s];
    }
  } else {
    S.st = 0;
    it.s = it.s >= 5 ? it.s - 2 : Math.max(1, it.s - 1);
    it.due = n + IV[it.s];
    ui.retry.push({ k: cur.k, at: ui.cnt + 3 });
    // In bag mode a miss goes back into the bag a few draws from now, so it comes around again soon.
    if (cur.bag) bag.cards.splice(Math.max(0, bag.cards.length - 3 - ((Math.random() * 8) | 0)), 0, cur.k);
  }
  save();
  render();
  if (!(mic.on && ok && cur.q.mic)) play(cur.q);
  if (ok) ui.tm = setTimeout(next, 900);
}
