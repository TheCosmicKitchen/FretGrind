/* "My deck": cards the player chose to keep reviewing. S.mine is a list of card keys: flash cards ("staff:64") and
   lesson questions ("lq:guitar|G3.2|1"). S.onlyMine = 1 makes the Cards tab draw from this list instead of the chosen decks. */
import { S, save } from "../core/store.js";
import { DK } from "../core/decks.js";
import { specOfKey } from "../courses/curriculum.js";

export const MAX_MINE = 500;
export const validKey = (k) => {
  if (typeof k !== "string") return false;
  if (k.startsWith("lq:")) return !!specOfKey(k);
  const d = k.slice(0, k.indexOf(":"));
  return !!DK[d] && DK[d].includes(k);
};
export const isMine = (k) => Array.isArray(S.mine) && S.mine.includes(k);
export function addMine(keys) {
  S.mine = Array.isArray(S.mine) ? S.mine : [];
  let n = 0;
  for (const k of keys) if (validKey(k) && !S.mine.includes(k) && S.mine.length < MAX_MINE) (S.mine.push(k), n++);
  if (n) save();
  return n;
}
/* Add the key, or take it out when it is already there. Returns true when it is in the deck afterwards. */
export function toggleMine(k) {
  S.mine = Array.isArray(S.mine) ? S.mine : [];
  const i = S.mine.indexOf(k);
  if (i >= 0) {
    S.mine.splice(i, 1);
    if (!S.mine.length) S.onlyMine = 0;
  } else if (validKey(k) && S.mine.length < MAX_MINE) S.mine.push(k);
  save();
  return S.mine.includes(k);
}
/* Make S.mine safe after loading. Returns true when something was dropped. */
export function sanitizeMine() {
  const before = JSON.stringify([S.mine, S.onlyMine]);
  S.mine = [...new Set(Array.isArray(S.mine) ? S.mine : [])].filter(validKey).slice(0, MAX_MINE);
  S.onlyMine = S.onlyMine && S.mine.length ? 1 : 0;
  return before !== JSON.stringify([S.mine, S.onlyMine]);
}
