/* The Games tab: a menu of games, or the game that is running. */
import { screen } from "../core/bus.js";
import { app } from "../core/dom.js";
import { header } from "../view/chrome.js";
import { mountScore, renderScore, scoreActive, scoreMenu, stopScore } from "./score.js";
import { mountRhythm, renderRhythm, rhythmActive, rhythmMenu, stopRhythm } from "./rhythm.js";

function renderGames() {
  if (scoreActive()) return renderScore();
  if (rhythmActive()) return renderRhythm();
  app.innerHTML = header() + rhythmMenu() + scoreMenu();
}

export function mountGames() {
  screen("games", renderGames);
  mountScore();
  mountRhythm();
}

/* Leaving the Games tab ends any game in progress. */
export function stopGames() {
  stopScore();
  stopRhythm();
}
