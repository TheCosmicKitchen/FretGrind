/* Fret Grind: entry point. Loads saved state, registers every page and click handler, and starts the app.
   Plain ES modules, no build step: this file is loaded straight from index.html. */
import { S, ui, load, save } from "./core/store.js";
import { action, mountClicks, render } from "./core/bus.js";
import { app } from "./core/dom.js";
import { mic, micStop } from "./core/mic.js";
import { mountCards, sanitizeCards } from "./cards/page.js";
import { next } from "./cards/scheduler.js";
import { mountGames, stopGames } from "./games/page.js";
import { rhythmDebug, rhythmKey, sanitizeRhythm, stopRhythm } from "./games/rhythm.js";
import { mountLibrary, sanitizeLibrary, togglePlay } from "./library/pages.js";
import { metBusy, metStop } from "./library/metronome.js";

/* Saved state: read it, then let each feature tidy its own part. */
const found = load(),
  tidied = sanitizeCards();
sanitizeLibrary();
sanitizeRhythm();
if (!found || tidied) save();

/* Switching tabs ends whatever the old tab had running (microphone, metronome, a game). */
function openPage(id) {
  if (id !== "cards" && mic.on) micStop(); // never leave the mic running out of sight
  if (id !== "practice" && metBusy()) metStop();
  if (id !== "games") stopGames();
  ui.page = id;
  render();
}

mountCards();
mountGames();
mountLibrary(openPage);
action("page", (D) => openPage(D.page));
action("snd", () => {
  S.mute = !S.mute;
  save();
  render();
});
mountClicks(app);

document.addEventListener("keydown", (e) => {
  if (rhythmKey(e)) return; // taps in the rhythm game
  if (ui.page === "practice") {
    if (e.key === " " && !/^(BUTTON|INPUT|SELECT)$/.test(e.target.tagName)) {
      e.preventDefault();
      togglePlay();
    }
    return;
  }
  if (e.key === "Enter") {
    const b = app.querySelector("[data-next],[data-check]");
    b && b.click();
  }
});
// A hidden tab can't keep time for the rhythm game: end the round.
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopRhythm();
    if (ui.page === "games") render();
  }
});

if (new URLSearchParams(location.search).has("debug")) window.__fg = { S, ui, render, next, openPage, rhythmDebug };

next(); // draws the first card
