/* The Library tab (browse chords and scales) and the Practice tab (play along with the metronome).
   Both show the same selection, kept in S.prac. */
import { S, save } from "../core/store.js";
import { action, render, screen } from "../core/bus.js";
import { app } from "../core/dom.js";
import { play } from "../core/audio.js";
import { header } from "../view/chrome.js";
import { CH, CH_COMMON, KEYS, PR_SCALES, chordInfo, currentItem, pretty, voiceLabel, voicings } from "./catalog.js";
import { CHORDDB } from "./chorddb.js";
import { RT } from "../core/theory.js";
import { boxView, staffView, tabView } from "./draw.js";
import { metBusy, metRunning, metShown, metStart, metStop, show } from "./metronome.js";

/* Make the saved choices safe to use (a stale or damaged save must never break the page). */
export function sanitizeLibrary() {
  const p = S.prac && typeof S.prac === "object" ? S.prac : {},
    ok = (v, a, d) => (a.includes(v) ? v : d),
    cr = Number.isInteger(p.cRoot) && KEYS[p.cRoot] ? p.cRoot : 7;
  S.prac = {
    kind: ok(p.kind, ["chord", "scale"], "chord"),
    cRoot: cr,
    cSuf: (CHORDDB[KEYS[cr]] || {})[p.cSuf] ? p.cSuf : "major",
    cVoice: Number.isInteger(p.cVoice) && p.cVoice >= 0 ? p.cVoice : 0,
    root: Number.isInteger(p.root) && RT[p.root] ? p.root : 0,
    scale: Number.isInteger(p.scale) && PR_SCALES[p.scale] ? p.scale : 0,
    view: ok(p.view, ["staff", "tab", "both"], "both"),
    bpm: Number.isFinite(p.bpm) ? Math.max(40, Math.min(200, Math.round(p.bpm))) : 80,
    sub: p.sub === 2 ? 2 : 1,
    click: p.click !== false,
    notes: p.notes !== false,
    countIn: p.countIn !== false,
    updown: p.updown === true,
  };
  if (!(CHORDDB[KEYS[S.prac.cRoot]][S.prac.cSuf] || [])[S.prac.cVoice]) S.prac.cVoice = 0;
}

const VIEWS = [["staff", "Sheet music"], ["tab", "Tab"], ["both", "Both"]];
const seg = (key, opts, val) =>
  `<div class="seg">${opts.map(([v, l]) => `<button data-pr="${key}" data-v="${v}" class="${String(val) === String(v) ? "on" : ""}">${l}</button>`).join("")}</div>`;
const tog = (key, label, on) => `<button data-pr="${key}" class="tg ${on ? "a" : ""}" aria-pressed="${on}">${label}</button>`;

function picker() {
  const P = S.prac;
  if (P.kind === "scale")
    return `<div class="chips pr-pick">${RT.map((r, i) => `<button data-pr="root" data-v="${i}" class="${P.root === i ? "a" : ""}">${r.n}</button>`).join("")}</div>
      <label class="pr-sel">Scale <select data-pr-sel="scale">${PR_SCALES.map((q, i) => `<option value="${i}"${P.scale === i ? " selected" : ""}>${q[0]}</option>`).join("")}</select></label>`;
  const have = Object.keys(CHORDDB[KEYS[P.cRoot]] || {}),
    common = CH_COMMON.filter((s) => have.includes(s)),
    groups = [
      ["Common", common],
      ["Sevenths, 6ths & extensions", have.filter((s) => CH[s] && !common.includes(s))],
      ["Slash chords", have.filter((s) => !CH[s])],
    ];
  return `<div class="chips pr-pick">${KEYS.map((k, i) => `<button data-pr="cRoot" data-v="${i}" class="${P.cRoot === i ? "a" : ""}">${pretty(k)}</button>`).join("")}</div>
    <div class="chips pr-pick">${common.map((s) => `<button data-pr="cSuf" data-v="${s}" class="${P.cSuf === s ? "a" : ""}">${CH[s][1] || "maj"}</button>`).join("")}</div>
    <label class="pr-sel">All chord types <select data-pr-sel="cSuf">${groups
      .filter((g) => g[1].length)
      .map((g) => `<optgroup label="${g[0]}">${g[1].map((s) => `<option value="${s}"${P.cSuf === s ? " selected" : ""}>${chordInfo(s).sym || "maj"} · ${chordInfo(s).name}</option>`).join("")}</optgroup>`)
      .join("")}</select></label>`;
}
const notation = (it) =>
  `${seg("view", VIEWS, S.prac.view)}<div class="pr-scroll">${S.prac.view !== "tab" ? staffView(it) : ""}${S.prac.view !== "staff" ? tabView(it) : ""}</div>`;
const heading = (it) =>
  `<h2>${it.title}</h2><p class="pr-sub">${it.kind === "chord" ? it.sub + " · " : ""}Notes: ${it.spelled} · Formula: ${it.formula}</p>`;
const voiceChips = (vs) =>
  `<div class="chips pr-pick" aria-label="Voicings">${vs.map((v, i) => `<button data-pr="cVoice" data-v="${i}" class="${S.prac.cVoice === i ? "a" : ""}">${i + 1} · ${voiceLabel(v)}</button>`).join("")}</div>`;

function renderLibrary() {
  const P = S.prac,
    it = currentItem(),
    chord = it.kind === "chord";
  app.innerHTML = `${header()}<div class="card prac">
    <div class="tag">LIBRARY</div>
    ${seg("kind", [["chord", "Chords"], ["scale", "Scales"]], P.kind)}
    ${picker()}
    ${heading(it)}
    ${chord ? `${voiceChips(voicings(P))}<div class="pr-boxwrap">${boxView(it.voice)}</div>` : ""}
    ${notation(it)}
    <div class="pr-ctl"><button class="go pr-play" data-pr="hear">🔊 Hear it</button><button class="go alt pr-play" data-pr="toPractice">Practice this with the metronome →</button></div>
    <small>${chord ? "Voicings from the open-source chords-db library (MIT)." : "One octave in a single hand position; Up &amp; down is on the Practice tab."}</small>
  </div>`;
}

function renderPractice() {
  const P = S.prac,
    it = currentItem(),
    chord = it.kind === "chord",
    run = metRunning(),
    vs = voicings(P),
    beats = [0, 1, 2, 3].map((b) => `<span class="bd" data-b="${b}">${b + 1}</span>`).join("");
  app.innerHTML = `${header()}<div class="card prac">
    <div class="tag">PRACTICE</div>
    <div class="pr-now"><div>${heading(it)}</div><button class="tg" data-page="library">Change in Library</button></div>
    ${chord && vs.length > 1 ? voiceChips(vs) : ""}
    ${notation(it)}
    <div class="beats" aria-label="Beat">${beats}</div>
    <div class="pr-ctl">
      <button class="go pr-play" data-pr="play">${run ? "■ Stop" : metBusy() ? "…" : "▶ Start"}</button>
      <div class="bpm"><button data-pr="bpm" data-v="-5" aria-label="Slower">−</button><label><b id="bpmv">${P.bpm}</b> BPM<input type="range" id="bpmr" min="40" max="200" step="1" value="${P.bpm}" aria-label="Tempo in beats per minute"/></label><button data-pr="bpm" data-v="5" aria-label="Faster">+</button></div>
    </div>
    <div class="chips pr-opts">${tog("click", "🕒 Click", P.click)}${tog("notes", "🔊 Notes", P.notes)}${tog("countIn", "1-bar count-in", P.countIn)}${chord ? "" : tog("sub", "Eighth notes", P.sub === 2) + tog("updown", "Up & down", P.updown)}</div>
    <small>${chord ? "The chord is strummed on every beat." : "One note per beat (two with Eighth notes); the loop repeats until you stop it."} The highlight follows the audio. Space starts and stops.</small>
  </div>`;
  if (run && metShown()) show(metShown());
}

function change(k, v) {
  const P = S.prac;
  if (k === "play") return metBusy() ? metStop() : metStart();
  if (k === "hear") {
    const it = currentItem(),
      ms = it.kind === "chord" ? it.cols[0].notes.map((n) => n.m) : it.cols.map((c) => c.notes[0].m);
    return play({ snd: ms, gap: it.kind === "chord" ? 0.035 : 0.28 });
  }
  if (k === "toPractice") {
    return goPractice();
  }
  if (k === "kind") P.kind = v;
  else if (k === "cRoot") {
    P.cRoot = +v;
    P.cVoice = 0;
    if (!(CHORDDB[KEYS[P.cRoot]] || {})[P.cSuf]) P.cSuf = "major"; // some keys lack some slash chords
  } else if (k === "cSuf") (P.cSuf = v), (P.cVoice = 0);
  else if (k === "cVoice") P.cVoice = +v;
  else if (k === "root") P.root = +v;
  else if (k === "scale") P.scale = +v;
  else if (k === "view") P.view = v;
  else if (k === "bpm") P.bpm = Math.max(40, Math.min(200, P.bpm + +v));
  else if (k === "sub") P.sub = P.sub === 2 ? 1 : 2;
  else if (["click", "notes", "countIn", "updown"].includes(k)) P[k] = !P[k];
  save();
  render();
}
let goPractice = () => {};

export function mountLibrary(openPage) {
  screen("library", renderLibrary);
  screen("practice", renderPractice);
  goPractice = () => openPage("practice");
  action("pr", (D) => change(D.pr, D.v));
  // the tempo slider and the "all chord types" / scale dropdowns
  app.addEventListener("input", (e) => {
    if (e.target.id !== "bpmr") return;
    S.prac.bpm = +e.target.value;
    const l = document.getElementById("bpmv");
    l && (l.textContent = S.prac.bpm);
    save();
  });
  app.addEventListener("change", (e) => {
    const k = e.target.dataset && e.target.dataset.prSel;
    if (k) change(k, e.target.value);
  });
}
/* Space starts and stops the metronome on the Practice tab. */
export const togglePlay = () => change("play");
