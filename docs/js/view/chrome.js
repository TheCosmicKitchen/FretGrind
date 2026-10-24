/* The header and the four tabs shown on every page. */
import { S, ui } from "../core/store.js";

const TABS = [
  ["cards", "Flash Cards"],
  ["games", "Games"],
  ["library", "Library"],
  ["practice", "Practice"],
];
export const topnav = () =>
  `<nav class="topnav">${TABS.map(([id, label]) => `<button data-page="${id}" class="${ui.page === id ? "on" : ""}">${label}</button>`).join("")}</nav>`;
export const header = () =>
  `<header><span>🎸 Fret Grind</span><span>${S.xp} XP · 🔥${S.st} (best ${S.best})</span></header>${topnav()}`;
export const soundToggle = (long) =>
  `<button class="sound-toggle" data-snd>${S.mute ? "🔇 Sound off" + (long ? " · click to enable" : "") : "🔊 Sound on" + (long ? " · click to mute" : "")}</button>`;
