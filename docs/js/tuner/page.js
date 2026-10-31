/* Tuner tab. Whatever an open string sounds like is taken as the truth for this guitar: it is saved in S.tuning (cents
   from standard per string, null until heard) and every fret is then judged relative to it (see core/pitch.js). */
import { S, save } from "../core/store.js";
import { action, render, screen } from "../core/bus.js";
import { app } from "../core/dom.js";
import { header } from "../view/chrome.js";
import { NAMES, OPEN } from "../core/theory.js";
import { STRING_NAMES, writtenPitch } from "../core/pitch.js";
import { MIC_MIN_RMS, mic, micHooks, micRead, toggleMic } from "../core/mic.js";

const ATTACK = 4, // readings to skip after a pluck, which starts out sharp (~200ms)
  WINDOW = 10, // readings to take the median of, so the needle doesn't jitter
  RANGE = 250, // cents: anything further from every string is a misheard harmonic
  SAMPLE_RANGE = 700, // cents: when we ask for a string by name it may be tuned almost anywhere
  IN_TUNE = 5; // cents

let now = { s: null, vals: [] },
  step = null, // which string the guided sample is asking for (null: free tuning)
  armed = true, // false until a new pluck, so the last string's ring isn't taken for the next one
  prevRms = 0;

export function sanitizeTuner() {
  if (!Array.isArray(S.tuning) || S.tuning.length !== OPEN.length) S.tuning = OPEN.map(() => null);
}

const stringName = (s) => NAMES[OPEN[s] % 12];
const stringPitch = (s) => OPEN[s] + (S.tuning[s] || 0) / 100; // this string as last heard
const label = (c) => (Math.abs(c) <= IN_TUNE ? "In tune" : `${Math.abs(c)}¢ ${c < 0 ? "flat" : "sharp"}`);

function paintString(s) {
  const el = document.getElementById("tn-s" + s),
    c = S.tuning[s];
  if (!el) return;
  el.querySelector("small").textContent = c === null ? "not heard" : label(c);
  el.className = c === null ? "" : Math.abs(c) <= IN_TUNE ? "ok" : "off";
}

function paintNeedle(s, c) {
  const note = document.getElementById("tn-note"),
    needle = document.getElementById("tn-needle"),
    text = document.getElementById("tn-cents");
  if (!note) return;
  note.textContent = stringName(s);
  needle.style.left = 50 + Math.max(-50, Math.min(50, c)) + "%";
  needle.className = Math.abs(c) <= IN_TUNE ? "ok" : "";
  text.textContent = label(c);
}

function tick() {
  const { rms, f, clarity } = micRead(),
    plucked = rms > prevRms * 1.8;
  prevRms = rms;
  if (rms < MIC_MIN_RMS) {
    now = { s: null, vals: [] };
    armed = true;
    return;
  }
  if (plucked) armed = true;
  if (!armed || !f || clarity < 0.85) return;
  const w = writtenPitch(f),
    sampling = step !== null,
    // Free tuning matches the string as last heard, so one tuned far from standard isn't mistaken for its neighbour.
    s = sampling ? step : OPEN.reduce((a, _, i) => (Math.abs(w - stringPitch(i)) < Math.abs(w - stringPitch(a)) ? i : a), 0);
  if (Math.abs(w - stringPitch(s)) * 100 > (sampling ? SAMPLE_RANGE : RANGE)) return;
  if (s !== now.s) now = { s, vals: [] };
  now.vals.push((w - OPEN[s]) * 100);
  const n = now.vals.length;
  if (n <= ATTACK) return;
  const v = now.vals.slice(Math.max(ATTACK, n - WINDOW)).sort((a, b) => a - b),
    c = Math.round(v[v.length >> 1]);
  S.tuning[s] = c;
  if (n % 5 === 0) save();
  paintNeedle(s, c);
  paintString(s);
  if (sampling && n >= ATTACK + WINDOW) {
    step = s + 1 < OPEN.length ? s + 1 : null;
    now = { s: null, vals: [] };
    armed = false;
    save();
    render();
  }
}

async function sample() {
  S.tuning = OPEN.map(() => null); // start clean, so old readings can't steer the new ones
  save();
  step = 0;
  now = { s: null, vals: [] };
  armed = true;
  if (!mic.on) await toggleMic();
  render();
}

function draw() {
  sanitizeTuner(); // a restored save code may not have it
  if (!mic.on) step = null;
  const heard = S.tuning.some((c) => c !== null),
    sampling = step !== null;
  app.innerHTML =
    header() +
    `<div class="card tuner"><div class="tag">TUNER</div><h2>Your guitar</h2><p>No need to be perfectly in tune. Sample your open strings and Fret Grind treats however they sound as correct, then judges every fret relative to that. Or start the tuner to tune up as usual.</p>${mic.err ? `<div class="msg badm" role="alert">${mic.err}</div>` : ""}<div class="tn-read"><b id="tn-note">${sampling ? stringName(step) : mic.on ? "♪" : "–"}</b><div class="tn-dial" aria-hidden="true"><i id="tn-needle"></i></div><span id="tn-cents" role="status">${sampling ? `Pluck your open ${STRING_NAMES[step]} string (${step + 1} of ${OPEN.length})` : mic.on ? "Pluck a string…" : "Tuner is off"}</span></div><div class="tn-strings">${OPEN.map((_, s) => `<span id="tn-s${s}"><b>${stringName(s)}</b><small></small></span>`).join("")}</div>${sampling ? "" : `<button class="go" data-tuner-sample>🎸 Sample my strings</button>`}<button class="${sampling ? "go" : "rs"}" data-mic>${mic.on ? "Stop" : "🎤 Start tuner"}</button>${heard && !sampling ? `<button class="rs" data-tuner-clear>Forget this guitar’s tuning</button>` : ""}</div>`;
  OPEN.forEach((_, s) => paintString(s));
}

export function mountTuner() {
  screen("tuner", draw);
  micHooks.pages.tuner = { tick };
  action("tunerSample", sample);
  action("tunerClear", () => {
    S.tuning = OPEN.map(() => null);
    save();
    render();
  });
}
