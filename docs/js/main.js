/* Fret Grind: entry point. Loads saved state, registers every page and click handler, and starts the app.
   Plain ES modules, no build step: this file is loaded straight from index.html. */
import { S, ui, load, save } from "./core/store.js";
import { action, mountClicks, render } from "./core/bus.js";
import { app } from "./core/dom.js";
import { ctx } from "./core/audio.js";
import { mic, micStop } from "./core/mic.js";
import { sanitizeListen, listenStop } from "./core/listen-io.js";
import { mountListenUi } from "./core/listen-ui.js";
import { mountCards, sanitizeCards } from "./cards/page.js";
import { mountLearn, sanitizeCourses } from "./courses/page.js";
import { motionKey, motionStop } from "./courses/motion-view.js";
import { next } from "./cards/scheduler.js";
import { mountGames, stopGames } from "./games/page.js";
import { rhythmDebug, rhythmKey, sanitizeRhythm, stopRhythm } from "./games/rhythm.js";
import { mountLibrary, sanitizeLibrary, togglePlay } from "./library/pages.js";
import { metBusy, metStop } from "./library/metronome.js";
import { mountSongs, sanitizeSongs, songKey, songsDebug, stopSongs } from "./songs/page.js";

/* Saved state: read it, then let each feature tidy its own part. */
const found = load(),
  tidied = sanitizeCards();
sanitizeLibrary();
sanitizeRhythm();
sanitizeSongs();
sanitizeListen();
const coursesTidied = sanitizeCourses();
if (!found || tidied || coursesTidied) save();

/* Switching tabs ends whatever the old tab had running (microphone, metronome, a game). */
function openPage(id) {
  if (id !== "cards" && mic.on) micStop(); // never leave the mic running out of sight
  if (id !== "practice" && metBusy()) metStop();
  if (id !== "learn") motionStop();
  if (id !== "games") stopGames();
  if (id !== "songs") stopSongs();
  if (id !== "games" && id !== "songs") listenStop(); // the microphone only runs where it is used
  ui.page = id;
  render();
}

mountLearn();
mountCards();
mountGames();
mountLibrary(openPage);
mountSongs();
mountListenUi();
action("page", (D) => openPage(D.page));
action("snd", () => {
  S.mute = !S.mute;
  save();
  render();
});
mountClicks(app);

document.addEventListener("keydown", (e) => {
  if (rhythmKey(e)) return; // taps in the rhythm game
  if (ui.page === "songs" && songKey(e)) return;
  if (ui.page === "learn") {
    if (motionKey(e, ui.learn && ui.learn.view)) return;
    if (e.key === "Enter" && !/^(BUTTON|INPUT|SELECT|TEXTAREA|A)$/.test(e.target.tagName)) {
      const b = app.querySelector("[data-ln-go]:not([disabled])");
      b && b.click();
    }
    return;
  }
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
    stopSongs();
    if (ui.page === "games" || ui.page === "songs") render();
  }
});

if (new URLSearchParams(location.search).has("debug")) window.__fg = { S, ui, render, next, openPage, rhythmDebug, songsDebug, audioCtx: () => ctx };

ui.page = "learn"; // the app opens on the Learn tab
next(); // draws the first card
