/* Tabs tab: text tabs are uploaded or pasted, kept in this browser only, and the mic walks through them one note at a
   time, at the player's own speed. */
import { S } from "../core/store.js";
import { action, render, screen } from "../core/bus.js";
import { app } from "../core/dom.js";
import { header } from "../view/chrome.js";
import { mic, micBoxLive, micHooks, micPass } from "../core/mic.js";
import { STRING_NAMES } from "../core/pitch.js";
import { parseTextTab, tabTarget } from "./parse.js";

const KEY = "fg-tabs",
  MAX_BYTES = 2e6,
  WINDOW = 28; // notes shown at once

let tabs = [],
  run = null, // the tab being followed: { tab, i }
  msg = "";

const esc = (t) => String(t).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

function keep() {
  try {
    localStorage.setItem(KEY, JSON.stringify(tabs));
    return true;
  } catch (e) {
    return false;
  }
}

function add(text, name) {
  try {
    const t = parseTextTab(text, name);
    tabs.unshift(t);
    msg = keep() ? `Added “${t.title}” (${t.ev.length} notes).` : "Added for now, but this browser is out of room to keep it.";
  } catch (e) {
    if (typeof e !== "string") throw e;
    msg = e;
  }
  render();
}

async function addFile(file) {
  if (/\.(gp\d?|gpx)$/i.test(file.name)) msg = "Guitar Pro files aren’t supported yet. Text tabs (.txt) work.";
  else if (file.size > MAX_BYTES) msg = "That file is too big to be a text tab.";
  else return add(await file.text(), file.name.replace(/\.\w+$/, ""));
  render();
}

function strip(r) {
  const from = Math.max(0, r.i - 4),
    shown = r.tab.ev.slice(from, from + WINDOW),
    col = (e, j) => {
      const at = from + j,
        newBar = j && e.b !== shown[j - 1].b;
      return `<span class="${at === r.i ? "now" : at < r.i ? "past" : ""}${newBar ? " bar" : ""}">${[5, 4, 3, 2, 1, 0]
        .map((s) => {
          const n = e.n.find((x) => x[0] === s);
          return `<i>${n ? n[1] : ""}</i>`;
        })
        .join("")}</span>`;
    };
  return `<div class="tb-strip" aria-hidden="true">${shown.map(col).join("")}</div>`;
}

function draw() {
  const r = run;
  if (!r) {
    app.innerHTML =
      header() +
      `<div class="card tb-home"><div class="tag">TABS</div><h2>Play along with a tab</h2><p>Add a text tab and Fret Grind listens as you play it, moving on when it hears the right note. Tabs stay in this browser.</p>${msg ? `<div class="msg" role="status">${esc(msg)}</div>` : ""}<label class="go tb-upload">Upload a text tab<input id="tab-file" type="file" accept=".txt,.tab,.crd,text/plain" /></label><textarea id="tab-paste" rows="7" spellcheck="false" aria-label="Paste a tab" placeholder="…or paste one here&#10;e|--0--3--5--|&#10;B|-----------|&#10;G|-----------|&#10;D|-----------|&#10;A|-----------|&#10;E|-----------|"></textarea><button data-tb="paste">Add pasted tab</button><div class="tb-list">${tabs.map((t) => `<div><button data-tb="open" data-arg="${esc(t.id)}"><b>${esc(t.title)}</b><small>${t.ev.length} notes</small></button><button class="rs" data-tb="delete" data-arg="${esc(t.id)}" aria-label="Delete ${esc(t.title)}">Delete</button></div>`).join("")}</div></div>`;
    return;
  }
  const e = r.tab.ev[r.i],
    where = e ? e.n.map(([s, f]) => `${STRING_NAMES[s]} string, ${f ? "fret " + f : "open"}`).join(" + ") : "";
  app.innerHTML =
    header() +
    `<div class="card tb-run"><div class="tag">TABS · ${Math.min(r.i + 1, r.tab.ev.length)} / ${r.tab.ev.length}</div><h2>${esc(r.tab.title)}</h2>${strip(r)}${
      !e
        ? `<div class="msg good" role="status">✓ You reached the end</div><button class="go" data-tb="restart">Play it again</button>`
        : `<p class="tb-next">${where}${e.n.length > 1 ? "<small>Chord: any one of its notes moves you on</small>" : ""}</p>${mic.on ? micBoxLive() : `<button class="go" data-mic>🎤 Start listening</button>`}${mic.err ? `<div class="msg badm" role="alert">${mic.err}</div>` : ""}<div class="tb-controls"><button data-tb="back">← Back</button><button data-tb="skip">Skip →</button><button data-tb="restart">Restart</button></div>`
    }<button class="rs" data-tb="exit">← All tabs</button></div>`;
}

function act(D) {
  const a = D.tb,
    arg = D.arg;
  if (a === "open") {
    const tab = tabs.find((t) => t.id === arg);
    if (tab) run = { tab, i: 0 };
    msg = "";
  } else if (a === "delete") {
    tabs = tabs.filter((t) => t.id !== arg);
    keep();
  } else if (a === "paste") return add(document.getElementById("tab-paste").value, "");
  else if (a === "exit") run = null;
  else if (a === "skip") run.i = Math.min(run.tab.ev.length, run.i + 1);
  else if (a === "back") run.i = Math.max(0, run.i - 1);
  else if (a === "restart") run.i = 0;
  micPass();
  render();
}

export function mountTabs() {
  try {
    tabs = JSON.parse(localStorage.getItem(KEY)) || [];
  } catch (e) {}
  screen("tabs", draw);
  action("tb", act);
  micHooks.pages.tabs = {
    repeats: true, // tabs repeat notes, so a fresh pluck counts even mid-ring
    target: () => run && tabTarget(run.tab, run.i, S.tuning),
    hit: () => {
      run.i++;
      render();
    },
  };
  app.addEventListener("change", (e) => {
    if (e.target.id === "tab-file" && e.target.files[0]) addFile(e.target.files[0]);
  });
}
