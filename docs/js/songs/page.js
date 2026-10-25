/* The Songs tab: a graded list of public-domain songs, and a player that shows each one as sheet
   music and tab and plays it along with a click. */
import { S, save } from "../core/store.js";
import { action, render, screen } from "../core/bus.js";
import { app } from "../core/dom.js";
import { header } from "../view/chrome.js";
import { SONGS } from "./data.js";
import { build } from "./format.js";
import { tabify } from "./tabify.js";
import { lineOf, songSvg } from "./draw.js";
import { songBusy, songRunning, songStart, songStop } from "./player.js";

const LIB = SONGS.map(build),
  byId = Object.fromEntries(LIB.map((s) => [s.id, s])),
  tabs = {};
const tabFor = (s) => (tabs[s.id] ||= tabify(s));
export const LEVEL_NAMES = {
  1: "Level 1 · First position, simple rhythms",
  2: "Level 2 · Pick-ups and dotted rhythms",
  3: "Level 3 · Faster notes and string crossing",
};
const VIEWS = [["staff", "Sheet music"], ["tab", "Tab"], ["both", "Both"]],
  SPEEDS = [50, 75, 90, 100];

export function sanitizeSongs() {
  const p = S.songs && typeof S.songs === "object" ? S.songs : {},
    ok = (v, a, d) => (a.includes(v) ? v : d),
    done = {};
  if (p.done && typeof p.done === "object") for (const id of Object.keys(p.done)) if (byId[id] && p.done[id]) done[id] = 1;
  S.songs = {
    cur: byId[p.cur] ? p.cur : null,
    view: ok(p.view, ["staff", "tab", "both"], "both"),
    pct: ok(p.pct, SPEEDS, 100),
    click: p.click !== false,
    notes: p.notes !== false,
    countIn: p.countIn !== false,
    loop: p.loop === true,
    lyrics: p.lyrics !== false,
    done,
  };
}

const seg = (key, opts, val) =>
  `<div class="seg">${opts.map(([v, l]) => `<button data-sp="${key}" data-v="${v}" class="${String(val) === String(v) ? "on" : ""}">${l}</button>`).join("")}</div>`;
const tog = (key, label, on) => `<button data-sp="${key}" class="${on ? "a" : ""}" aria-pressed="${on}">${label}</button>`;
const meta = (s) => `Key of ${s.key.replace("m", " minor")} · ${s.time} · tempo ${s.tempo}`;

function renderList() {
  const done = Object.keys(S.songs.done).length;
  let h = `${header()}<div class="card prac"><div class="tag">SONGS</div>
    <h2>Songs to work through</h2>
    <p class="pr-sub">${done} of ${LIB.length} learned. Public-domain melodies with sheet music and tab, played along with a click. Start at level 1.</p>`;
  for (const lv of [1, 2, 3]) {
    const list = LIB.filter((s) => s.level === lv);
    if (!list.length) continue;
    h += `<h3 class="sg-lv">${LEVEL_NAMES[lv]}</h3><div class="sg-list">${list
      .map(
        (s) => `<button class="sg-item" data-song-open="${s.id}"><span class="sg-t1">${S.songs.done[s.id] ? "✓ " : ""}${s.title}</span>
        <span class="sg-t2">${s.by} · ${meta(s)}</span><span class="sg-tags">${s.tags.map((t) => `<i>${t}</i>`).join("")}</span></button>`,
      )
      .join("")}</div>`;
  }
  app.innerHTML = h + `<small>Melodies are old enough to be public domain everywhere (the composers died before 1926, or the tune is traditional). The notation and tab are our own.</small></div>`;
}

const width = () => Math.max(280, Math.min(760, Math.floor(app.clientWidth - 58)));
function renderPlayer() {
  const s = byId[S.songs.cur],
    P = S.songs,
    run = songRunning(),
    beats = Array.from({ length: s.bar / s.beat }, (_, b) => `<span class="bd" data-b="${b}">${b + 1}</span>`).join(""),
    hasWords = s.words !== undefined;
  app.innerHTML = `${header()}<div class="card prac">
    <div class="pr-now"><div><h2>${s.title}</h2><p class="pr-sub">${s.by} · ${meta(s)}</p></div><button class="tg" data-sp="back">← All songs</button></div>
    ${seg("view", VIEWS, P.view)}
    <div class="sg-wrap" id="sg-wrap">${songSvg(s, tabFor(s), { width: width(), view: P.view, lyrics: hasWords && P.lyrics })}</div>
    <div class="beats" aria-label="Beat">${beats}</div>
    <div class="pr-ctl">
      <button class="go pr-play" data-sp="play">${run ? "■ Stop" : songBusy() ? "…" : "▶ Play"}</button>
      <div class="chips pr-opts">${SPEEDS.map((v) => `<button data-sp="pct" data-v="${v}" class="${P.pct === v ? "a" : ""}">${v}%</button>`).join("")}</div>
    </div>
    <small class="sg-bpm">${Math.round((s.tempo * P.pct) / 100)} beats per minute</small>
    <div class="chips pr-opts">${tog("click", "🕒 Click", P.click)}${tog("notes", "🔊 Notes", P.notes)}${tog("countIn", "1-bar count-in", P.countIn)}${tog("loop", "🔁 Loop", P.loop)}${hasWords ? tog("lyrics", "Words", P.lyrics) : ""}${tog("done", P.done[s.id] ? "✓ Learned" : "Mark as learned", !!P.done[s.id])}</div>
    <small>${s.source}${s.reviewed ? "" : " The tab was chosen by the program and has not been checked by hand yet: if a fingering feels awkward, trust your hand."} Space starts and stops.</small>
  </div>`;
}

/* ----- playing ----- */
let lastLine = -1,
  lines = [],
  hotEls = [];
function clearHot() {
  hotEls.forEach((e) => e.classList.remove("hot"));
  hotEls = [];
}
const hooks = (s) => ({
  note(i) {
    clearHot();
    hotEls = [...document.querySelectorAll(`[data-n="${i}"]`)];
    hotEls.forEach((e) => e.classList.add("hot"));
    const ln = lines[i];
    if (ln !== lastLine) {
      lastLine = ln;
      const el = document.querySelector(`.sg-sys[data-line="${ln}"]`);
      el && el.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  },
  beat(b) {
    document.querySelectorAll(".bd").forEach((e) => e.classList.toggle("on", +e.dataset.b === b));
  },
  started: () => render(),
  end: () => {
    songStop();
    clearHot();
    if (S.songs.cur === s.id && document.querySelector("#sg-wrap")) render();
  },
});
export function stopSongs() {
  if (!songBusy()) return;
  songStop();
  clearHot();
}
function togglePlay() {
  const s = byId[S.songs.cur];
  if (!s) return;
  if (songBusy()) {
    stopSongs();
    return render();
  }
  lines = lineOf(s, width(), s.words !== undefined && S.songs.lyrics && S.songs.view !== "tab");
  lastLine = -1;
  songStart(s, S.songs, hooks(s));
  render();
}
export const songKey = (e) => {
  if (e.key !== " " || /^(BUTTON|INPUT|SELECT)$/.test(e.target.tagName) || !S.songs.cur) return false;
  e.preventDefault();
  togglePlay();
  return true;
};

function change(k, v) {
  const P = S.songs;
  if (k === "play") return togglePlay();
  stopSongs();
  if (k === "back") P.cur = null;
  else if (k === "view") P.view = v;
  else if (k === "pct") P.pct = +v;
  else if (k === "done") P.done[P.cur] ? delete P.done[P.cur] : (P.done[P.cur] = 1);
  else if (["click", "notes", "countIn", "loop", "lyrics"].includes(k)) P[k] = !P[k];
  save();
  render();
}

export function mountSongs() {
  screen("songs", () => (S.songs.cur ? renderPlayer() : renderList()));
  action("songOpen", (D) => {
    S.songs.cur = D.songOpen;
    save();
    render();
    window.scrollTo(0, 0);
  });
  action("sp", (D) => change(D.sp, D.v));
  // redraw when the screen turns (the lines are laid out for the width)
  let t = 0,
    w = innerWidth;
  addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      if (innerWidth === w || !document.querySelector("#sg-wrap") || songBusy()) return (w = innerWidth);
      w = innerWidth;
      render();
    }, 150);
  });
}
export const songsActive = () => songBusy();
