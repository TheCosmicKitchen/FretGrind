/* The frame around every page: five areas, shown as a sidebar on wide screens and a tab bar on phones, with sub-tabs
   inside an area. Page ids stay flat, so a page never needs to know which area it is in. */
import { S, ui } from "../core/store.js";

const icon = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`;
const ICONS = {
  brand: icon('<path d="M20 4l-7.5 7.5"/><path d="M18 2.5l3.5 3.5"/><path d="M12.8 8.7c-2-.6-3.6.2-4.6 1.6-.6.9-1.7 1-2.9 1.4C3.3 12.4 2 14 3.1 16.6c.9 2.1 2.2 3.5 4.3 4.3 2.6 1.1 4.2-.2 4.9-2.2.4-1.2.5-2.3 1.4-2.9 1.4-1 2.2-2.6 1.6-4.6"/><circle cx="9.5" cy="14.5" r="1.6"/>'),
  learn: icon('<path d="M4 5.5A2 2 0 0 1 6 4h13v14H6a2 2 0 0 0-2 2z"/><path d="M4 20V5.5"/><path d="M9 9h6"/>'),
  music: icon('<path d="M9 18V6l10-2v12"/><circle cx="6.5" cy="18" r="2.5"/><circle cx="16.5" cy="16" r="2.5"/>'),
  cards: icon('<rect x="4" y="7" width="12" height="13" rx="2"/><path d="M8 7V6a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-2"/>'),
  chords: icon('<path d="M6 3v18M10 3v18M14 3v18M18 3v18M6 3h12M6 8h12M6 13h12"/><circle cx="10" cy="10.5" r="1.4" fill="currentColor"/><circle cx="14" cy="15.5" r="1.4" fill="currentColor"/>'),
  tuner: icon('<path d="M4 17a8.5 8.5 0 1 1 16 0"/><path d="M12 15l4-6"/><circle cx="12" cy="15.5" r="1.3"/>'),
  sun: icon('<circle cx="12" cy="12" r="4"/><path d="M12 3v2M12 19v2M3 12h2M19 12h2M5.6 5.6L7 7M17 17l1.4 1.4M5.6 18.4L7 17M17 7l1.4-1.4"/>'),
  moon: icon('<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'),
};

const AREAS = [
  { id: "learn", label: "Learn", pages: [["learn", "Courses"], ["piano", "Piano"]] },
  { id: "music", label: "Music", pages: [["songs", "Songs"], ["tabs", "My tabs"], ["games", "Games"]] },
  { id: "cards", label: "Cards", pages: [["cards", "Flash cards"]] },
  { id: "chords", label: "Chords", pages: [["library", "Chords & scales"], ["practice", "Play along"]] },
  { id: "tuner", label: "Tuner", pages: [["tuner", "Tuner"]] },
];
const TITLED = { learn: "Courses", games: "Games", library: "Chords & scales", practice: "Play along", piano: "Piano" }; // pages with no heading of their own
const areaOf = (page) => AREAS.find((a) => a.pages.some(([id]) => id === page)) || AREAS[0];
const last = {}; // the page each area was left on, so coming back lands where you were

const dark = () => {
  const t = document.documentElement.dataset.theme;
  return t ? t === "dark" : matchMedia("(prefers-color-scheme: dark)").matches;
};
const themeBtn = () =>
  `<button class="icon-btn" data-theme-toggle aria-label="Switch to ${dark() ? "light" : "dark"} theme">${dark() ? ICONS.sun : ICONS.moon}</button>`;
const stats = () => `<span class="stats"><span title="Experience"><b>${S.xp}</b> XP</span><span title="Current streak, best ${S.best}"><b>${S.st}</b> streak</span></span>`;
const brand = `<span class="brand">${ICONS.brand}Fret Grind</span>`;

function frame() {
  const cur = areaOf(ui.page);
  last[cur.id] = ui.page;
  const rail = AREAS.map(
    (a) => `<div>${a.pages.length > 1 ? `<h4>${a.label}</h4>` : ""}${a.pages.map(([id, label]) => `<button data-page="${id}" class="${ui.page === id ? "on" : ""}" ${ui.page === id ? 'aria-current="page"' : ""}>${label}</button>`).join("")}</div>`,
  ).join("");
  const bar = AREAS.map(
    (a) => `<button data-page="${last[a.id] || a.pages[0][0]}" class="${a === cur ? "on" : ""}" ${a === cur ? 'aria-current="page"' : ""}>${ICONS[a.id]}<span>${a.label}</span></button>`,
  ).join("");
  return `<aside class="rail">${brand}<nav aria-label="Main">${rail}</nav><div class="rail-foot">${stats()}${themeBtn()}</div></aside>
    <div class="appbar">${brand}<span class="stats">${stats()}${themeBtn()}</span></div>
    <nav class="tabbar" aria-label="Main">${bar}</nav>`;
}

/* Redraw the frame only when something in it changed, so a click elsewhere never disturbs it. */
let drawn = "";
export function paintFrame() {
  const key = [ui.page, S.xp, S.st, S.best, document.documentElement.dataset.theme].join();
  const nav = document.getElementById("nav");
  if (key === drawn || !nav) return; // an old cached index.html has no frame to draw into
  drawn = key;
  nav.innerHTML = frame();
}

/* Where you are in today's practice, on every page, so it can always be picked up or left. */
function planStrip() {
  const p = ui.learn?.plan,
    it = p && !p.closed && p.session && p.items[p.at];
  if (!it || p.items.every((x) => x.done)) return "";
  const n = p.items.filter((x) => x.done).length,
    here = ui.page === "songs" ? S.songs.cur === it.id : ui.page === "learn" && ["lesson", "quiz"].includes(ui.learn.view);
  return `<div class="ss-strip"><span>Today's practice · ${n + 1} of ${p.items.length}</span>${here ? "" : "<button data-ln-plannext>Carry on</button>"}<button data-ln-planskip>Skip this</button><button data-ln-planend>End</button></div>`;
}

/* The top of every page: the area's sub-tabs (the sidebar shows them on wide screens). */
export const header = () => {
  const a = areaOf(ui.page),
    tabs = a.pages.length < 2 ? "" : `<div class="subnav">${a.pages.map(([id, label]) => `<button data-page="${id}" class="${ui.page === id ? "on" : ""}">${label}</button>`).join("")}</div>`;
  return planStrip() + tabs + (TITLED[ui.page] ? `<h1 class="ptitle">${TITLED[ui.page]}</h1>` : "");
};
export const soundToggle = (long) =>
  `<button class="sound-toggle" data-snd>${S.mute ? "Sound off" + (long ? " · click to enable" : "") : "Sound on" + (long ? " · click to mute" : "")}</button>`;
