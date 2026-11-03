/* Shared state.
   S  = what is saved in the browser (progress, chosen decks, preferences).
   ui = what only lives while the page is open (current page, current card, ...).
   Both are plain objects that every module imports; they are changed in place, never replaced. */
export const S = {};
export const ui = {
  page: "cards", // "learn" | "cards" | "games" | "songs" | "library" | "practice" | "piano" | "tabs" | "tuner"
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
/* A backup of everything, as text that is safe to paste anywhere: "FG2." and the saved state as base64 of UTF-8, since a title can hold any character.
   How this device's microphone and speakers behave stays with the device. */
const DEVICE = ["listen"];
export function backupCode(state = S) {
  const o = { ...state };
  DEVICE.forEach((k) => delete o[k]);
  let text = "";
  for (const byte of new TextEncoder().encode(JSON.stringify(o))) text += String.fromCharCode(byte);
  return "FG2." + btoa(text);
}
export function readBackup(text) {
  try {
    const m = /FG2\.([A-Za-z0-9+/=]+)/.exec(String(text));
    if (!m) return null;
    const raw = JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(m[1]), (c) => c.charCodeAt(0))));
    return raw && typeof raw === "object" && !Array.isArray(raw) && raw.it && typeof raw.it === "object" ? raw : null;
  } catch (e) {
    return null;
  }
}
/* Put a backup in place. The caller tidies each feature's part afterwards, as it does for anything loaded. */
export function restoreBackup(raw) {
  const kept = Object.fromEntries(DEVICE.map((k) => [k, S[k]])),
    num = (n) => (Number.isFinite(n) ? n : 0);
  replace({ ...fresh(), ...raw, ...kept, xp: num(raw.xp), st: num(raw.st), best: num(raw.best) });
}
export const startFresh = () => replace(fresh()); // for tests
