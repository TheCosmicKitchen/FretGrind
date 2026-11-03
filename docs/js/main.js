/* Fret Grind: entry point. Loads saved state, registers every page and click handler, and starts the app.
   Plain ES modules, no build step: this file is loaded straight from index.html. */
import { S, ui, load, save } from "./core/store.js";
import { action, mountClicks, on, render } from "./core/bus.js";
import { app } from "./core/dom.js";
import { paintFrame } from "./view/chrome.js";
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
import { mountPiano, pianoAllOff, pianoKey, sanitizePiano } from "./piano/page.js";
import { mountTuner, sanitizeTuner } from "./tuner/page.js";
import { mountTabs } from "./tabs/page.js";
import { stayAwake } from "./core/awake.js";

/* Saved state: read it, then let each feature tidy its own part. */
function tidyAll() {
  const cards = sanitizeCards();
  sanitizeLibrary();
  sanitizeRhythm();
  sanitizeSongs();
  sanitizeListen();
  sanitizePiano();
  sanitizeTuner();
  return sanitizeCourses() || cards;
}
const found = load();
if (tidyAll() || !found) save();

/* Switching tabs ends whatever the old tab had running (microphone, metronome, a game). */
function openPage(id) {
  if (id !== ui.page && mic.on) micStop(); // never leave the mic running out of sight
  if (id !== "practice" && metBusy()) metStop();
  if (id !== "learn") motionStop();
  if (id !== "games") stopGames();
  if (id !== "songs") stopSongs();
  if (id !== "games" && id !== "songs") listenStop(); // the microphone only runs where it is used
  if (id !== "piano") pianoAllOff(); // release keys held on the Piano tab
  const swap = () => {
    ui.page = id;
    render();
    scrollTo(0, 0);
  };
  // a soft cross-fade between pages where the browser has it; it runs a frame later, so the page is set for the caller now
  if (id === ui.page || !document.startViewTransition || matchMedia("(prefers-reduced-motion: reduce)").matches) return swap();
  ui.page = id;
  document.startViewTransition(swap).ready.catch(() => {}); // a second tap skips the fade, not the page
}

mountLearn();
mountCards();
mountGames();
mountLibrary(openPage);
mountSongs();
mountListenUi();
mountPiano();
mountTuner();
mountTabs();
action("page", (D) => openPage(D.page));
action("snd", () => {
  S.mute = !S.mute;
  save();
  render();
});
action("themeToggle", () => {
  const root = document.documentElement,
    isDark = root.dataset.theme ? root.dataset.theme === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
  root.dataset.theme = isDark ? "light" : "dark";
  try {
    localStorage.setItem("fg-theme", root.dataset.theme);
  } catch (e) {}
  paintFrame();
});
on("drawn", paintFrame);
on("restored", tidyAll);
on("open-page", openPage);
/* The screen stays on wherever you might be playing with both hands busy. */
const HANDS = ["practice", "piano", "tuner", "tabs"];
on("drawn", () => stayAwake(HANDS.includes(ui.page) || (ui.page === "songs" && !!S.songs.cur) || (ui.page === "learn" && ["lesson", "motion"].includes(ui.learn?.view))));
mountClicks(document.body); // the frame sits outside #app

document.addEventListener("keydown", (e) => {
  if (rhythmKey(e)) return; // taps in the rhythm game
  if (ui.page === "songs" && songKey(e)) return;
  if (ui.page === "piano") return void pianoKey(e); // computer keys play the piano
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
