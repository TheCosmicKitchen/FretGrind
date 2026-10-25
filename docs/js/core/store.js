/* Shared state.
   S  = what is saved in the browser (progress, chosen decks, preferences).
   ui = what only lives while the page is open (current page, current card, ...).
   Both are plain objects that every module imports; they are changed in place, never replaced. */
export const S = {};
export const ui = {
  page: "cards", // "cards" | "games" | "library" | "practice"
  cur: null, // the flash card on screen
  rs: 0, // 1 while "tap again to erase all progress" is pending
  retry: [], // missed cards that come back soon (spaced-repetition mode)
  cnt: 0, // cards shown so far
  last: "", // key of the previous card
  tm: 0, // timer that moves on after a correct answer
};

const KEY = "fg1";
const fresh = () => ({ it: {}, act: ["staff", "fretNote"], xp: 0, st: 0, best: 0, mine: [], onlyMine: 0 });
const replace = (o) => {
  for (const k of Object.keys(S)) delete S[k];
  Object.assign(S, o);
};

/* Read the saved state (or start fresh when it is missing or damaged). Returns true when a save was found. */
export function load() {
  let s = null;
  try {
    s = JSON.parse(localStorage.getItem(KEY));
  } catch (e) {}
  const ok = !!(s && typeof s === "object" && s.it);
  replace(ok ? s : fresh());
  return ok;
}
export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {}
}
/* Forget card progress and XP but keep preferences (mode, sound, tempo, chosen decks, ...). */
export function resetProgress() {
  Object.assign(S, { it: {}, xp: 0, st: 0, best: 0 });
}
export const startFresh = () => replace(fresh()); // for tests
