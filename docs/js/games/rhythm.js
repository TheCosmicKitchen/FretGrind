/* "Tap the rhythm": a bar of rhythm is shown, you tap it back in time with a click, and every tap is graded in milliseconds.
   Each round: optional count-in -> optional "listen" bar -> your bar (tap on notes, stay quiet on rests).
   All sounds are scheduled on the audio clock; taps are time-stamped by the browser and mapped onto that clock. */
import { S, save } from "../core/store.js";
import { audioReady, click, ctx, tone } from "../core/audio.js";
import { action, render } from "../core/bus.js";
import { app } from "../core/dom.js";
import { header } from "../view/chrome.js";
import { listen, listenStart, onNote } from "../core/listen-io.js";
import { listenPanel } from "../core/listen-ui.js";
import { LEVELS, bias, gradeTaps, onsets, parse, pickPattern, stars, windowFor } from "./rhythm-patterns.js";
import { rhythmSvg, slotX } from "./rhythm-view.js";

const ROUNDS = 5,
  BPM_MIN = 50,
  BPM_MAX = 140;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* Make the saved settings safe to use. */
export function sanitizeRhythm() {
  const r = S.rhythm && typeof S.rhythm === "object" ? S.rhythm : {},
    best = {};
  for (const l of LEVELS) if (r.best && Number.isFinite(r.best[l.id])) best[l.id] = clamp(r.best[l.id], 0, 1);
  S.rhythm = {
    level: LEVELS.some((l) => l.id === r.level) ? r.level : 1,
    bpm: Number.isFinite(r.bpm) ? clamp(Math.round(r.bpm), BPM_MIN, BPM_MAX) : 80,
    countIn: r.countIn !== false, // the optional count-in
    click: r.click !== false, // metronome click while you play
    listen: r.listen !== false, // hear the bar once before you tap it
    input: r.input === "mic" ? "mic" : "tap", // tap on the screen/Space, or play/clap into the microphone
    offset: Number.isFinite(r.offset) ? clamp(Math.round(r.offset / 10) * 10, -150, 150) : 0, // ms taken off every tap (device delay)
    best,
  };
}

let run = null; // the game in progress
export const rhythmActive = () => !!run;
export function stopRhythm() {
  if (run) {
    cancelAnimationFrame(run.raf);
    if (run.off) run.off(); // the microphone itself stays on until you leave the Games tab
  }
  run = null;
}

/* ---- clock: audio time <-> the browser's tap time stamps ---- */
function syncClock() {
  let ts = null;
  try {
    ts = ctx.getOutputTimestamp && ctx.getOutputTimestamp();
  } catch (e) {}
  if (ts && ts.performanceTime > 0 && ts.contextTime > 0) return { perf: ts.performanceTime, audio: ts.contextTime, lat: 0 };
  return { perf: performance.now(), audio: ctx.currentTime, lat: (ctx.outputLatency || ctx.baseLatency || 0) * 1000 };
}
const toPerf = (t) => run.sync.perf + (t - run.sync.audio) * 1000 + run.sync.lat;
/* Times are graded in milliseconds. Taps use the browser clock; the microphone reports on the audio clock itself. */
const at = (t) => (run.mic ? t * 1000 : toPerf(t));

/* ---- one round ---- */
function schedule() {
  const P = S.rhythm,
    spb = 60 / P.bpm,
    bar = 4 * spb,
    segs = [];
  let t = ctx.currentTime + (P.countIn || P.listen ? 0.25 : 1);
  const quiet = run.mic && !S.listen.phones; // on speakers the click would be heard by the microphone
  const beatClicks = (from, playing) => {
    if (P.click && !(playing && quiet)) for (let i = 0; i < 4; i++) click(from + i * spb, i === 0);
  };
  if (!P.countIn && !P.listen) segs.push({ phase: "ready", start: t - 1, end: t });
  if (P.countIn) {
    for (let i = 0; i < 4; i++) click(t + i * spb, i === 0); // the count-in always clicks
    segs.push({ phase: "countin", start: t, end: t + bar });
    t += bar;
  }
  if (P.listen) {
    parse(run.pattern)
      .filter((e) => e.type === "note")
      .forEach((e) => tone(81, t + (e.slot * spb) / 2, Math.min(0.28, (e.len * spb) / 2), 0.3, "triangle", true));
    beatClicks(t, false);
    segs.push({ phase: "listen", start: t, end: t + bar });
    t += bar;
  }
  beatClicks(t, true);
  segs.push({ phase: "play", start: t, end: t + bar });
  Object.assign(run, { spb, segs, playStart: t, playEnd: t + bar, finishAt: t + bar + 0.45, sync: syncClock(), taps: [], result: null, phase: segs[0].phase });
}

function frame() {
  if (!run || run.result) return;
  run.sync = syncClock(); // re-pair the two clocks every frame (the audio clock may only start moving after the first round is scheduled)
  const now = ctx.currentTime,
    seg = run.segs.find((s) => now >= s.start && now < s.end),
    phase = seg ? seg.phase : now >= run.playEnd ? "tail" : "ready";
  if (phase !== run.phase) run.phase = phase;
  const status = document.getElementById("rh-status"),
    count = document.getElementById("rh-count"),
    head = document.getElementById("rh-head"),
    pad = document.getElementById("rh-pad");
  if (status)
    status.textContent = { ready: "Get ready…", countin: "Count in…", listen: "Listen…", play: run.mic ? "Your turn: play or clap it!" : "Your turn: tap it!", tail: "…" }[phase] || "";
  if (count) count.textContent = phase === "countin" ? String(Math.min(4, Math.floor((now - seg.start) / run.spb) + 1)) : phase === "play" ? "Go" : "";
  if (pad) pad.classList.toggle("live", phase === "play");
  if (head) {
    if (seg && (phase === "listen" || phase === "play")) {
      const x = slotX(((now - seg.start) / (run.spb / 2)) * 1);
      head.setAttribute("x1", x);
      head.setAttribute("x2", x);
      head.setAttribute("opacity", "1");
      head.setAttribute("class", "rh-head-line " + phase);
    } else head.setAttribute("opacity", "0");
  }
  if (now >= run.finishAt) return finishRound();
  run.raf = requestAnimationFrame(frame);
}

function beginRound(again) {
  if (!again) {
    run.round++;
    run.pattern = pickPattern(run.level, run.pattern);
  }
  schedule();
  render();
  cancelAnimationFrame(run.raf);
  run.raf = requestAnimationFrame(frame);
}

/* A tap (perf = the event's time stamp, on the same clock as performance.now()). */
function tapAt(perf) {
  if (!run || run.result || run.mic) return;
  const lo = toPerf(run.playStart) - run.spb * 450,
    hi = toPerf(run.playEnd) + 250;
  if (perf < lo || perf > hi) return;
  run.taps.push(perf - S.rhythm.offset);
  if (ctx) tone(88, ctx.currentTime, 0.1, 0.22, "triangle", true);
  flashPad();
}
function flashPad() {
  const pad = document.getElementById("rh-pad");
  if (pad) {
    pad.classList.add("hit");
    setTimeout(() => pad.classList.remove("hit"), 90);
  }
}

/* A note heard by the microphone (e.t = when it was played, on the audio clock, with the device delay taken off). */
function heardAt(e) {
  if (!run || run.result || !run.mic || !run.segs) return;
  const early = S.listen.phones ? run.spb * 0.45 : Math.min(0.2, run.spb * 0.3), // on speakers, keep clear of the listen bar's tail
    ms = e.t * 1000;
  if (e.t < run.playStart - early || e.t > run.playEnd + 0.25) return;
  run.taps.push(ms);
  flashPad();
}

function finishRound() {
  const exp = onsets(run.pattern).map((s) => at(run.playStart + (s * run.spb) / 2)),
    win = windowFor(exp),
    g = gradeTaps(exp, run.taps, win);
  run.result = { g, win, stars: stars(g.accuracy), bias: bias(g.notes), pattern: run.pattern };
  run.phase = "result";
  S.xp += g.pts;
  const prev = S.rhythm.best[run.level] || 0;
  S.rhythm.best[run.level] = Math.max(prev, g.accuracy);
  save();
  render();
}

/* ---- pages ---- */
const pct = (x) => Math.round(x * 100) + "%";
const starRow = (n) => "★".repeat(n) + "☆".repeat(3 - n);

function resultBlock() {
  const r = run.result,
    g = r.g,
    last = run.round >= run.rounds;
  const note = g.notes.every((n) => n.delta === null) ? "No taps landed on a note." : "";
  const b = r.bias,
    biasText =
      Math.abs(b) < 15 ? "Right on the grid." : b > 0 ? `You land about ${Math.round(b)} ms late. Try tapping a touch earlier.` : `You land about ${Math.round(-b)} ms early. Try waiting for the click.`;
  return `<div class="rh-result"><div class="rh-stars" aria-label="${r.stars} of 3 stars">${starRow(r.stars)}</div><div class="rh-acc">${pct(g.accuracy)} accurate · +${g.pts} XP</div><p>${note || biasText}${g.extras.length ? ` ${g.extras.length} extra tap${g.extras.length > 1 ? "s" : ""} (on a rest or twice).` : ""}</p><div class="rh-actions"><button class="go" data-rh-next>${last ? "Finish" : "Next pattern →"}</button><button data-rh-retry>Try this one again</button></div></div>`;
}

function marksFor() {
  const r = run.result,
    cls = ["rh-miss", "rh-ok", "rh-good", "rh-perfect"],
    slots = onsets(run.pattern),
    marks = g_notes(r).map((n, i) => ({
      slot: slots[i],
      cls: cls[n.pts],
      label: n.delta === null ? "miss" : (n.delta > 0 ? "+" : "") + Math.round(n.delta),
    })),
    t0 = at(run.playStart),
    taps = run.taps.map((tp, i) => {
      const hit = r.g.notes.find((n) => n.tap === i);
      return { slot: (tp - t0) / (run.spb * 500), cls: hit ? cls[hit.pts] : "rh-extra" };
    });
  return { marks, taps };
}
const g_notes = (r) => r.g.notes;

export function renderRhythm() {
  const P = S.rhythm;
  if (run.error) {
    app.innerHTML = `${header()}<div class="card"><div class="msg badm" role="alert">${run.error}</div><button class="rs" data-rh-exit>← Games</button></div>`;
    return;
  }
  if (run.phase === "done") {
    const rs = run.results,
      avg = rs.reduce((a, r) => a + r.g.accuracy, 0) / (rs.length || 1);
    app.innerHTML = `${header()}<div class="card rhythm-card"><div class="tag">TAP THE RHYTHM · LEVEL ${run.level} · DONE</div><div class="prompt">Run complete</div><div class="rh-stars">${starRow(stars(avg))}</div><div class="rh-acc">${pct(avg)} average over ${rs.length} patterns</div><p>${rs.map((r) => starRow(r.stars)).join(" · ")}</p><div class="rh-actions"><button class="go" data-rh-start>Play again</button><button data-rh-exit>← Games</button></div></div>`;
    return;
  }
  const res = run.result,
    view = res ? marksFor() : { marks: [], taps: [] };
  app.innerHTML = `${header()}<div class="card rhythm-card"><div class="tag">TAP THE RHYTHM · LEVEL ${run.level} · PATTERN ${run.round} / ${run.rounds} · ${P.bpm} BPM</div><div class="prompt" id="rh-status">${res ? "Here is how you did" : "Get ready…"}</div>${res ? "" : '<div class="rh-big" id="rh-count" aria-live="polite"></div>'}${rhythmSvg(run.pattern, view.marks, view.taps)}${
    res
      ? resultBlock()
      : run.mic
        ? `<div class="rh-pad rh-listen" id="rh-pad" role="status">🎤 LISTENING<small>play or clap on the notes</small></div>`
        : `<button class="rh-pad" id="rh-pad" data-rh-pad aria-label="Tap here, or press Space">TAP<small>or press Space</small></button>`
  }<button class="rs" data-rh-exit>← Games</button></div>`;
}

export async function startRhythm() {
  S.mute = false; // the clock is the audio, so sound must be on
  save();
  run = { level: S.rhythm.level, round: 0, rounds: ROUNDS, results: [], pattern: "", phase: "loading", result: null, error: "", mic: S.rhythm.input === "mic" };
  const mine = run;
  try {
    await audioReady();
    if (mine.mic && !listen.on && !(await listenStart())) throw new Error(listen.err);
  } catch (e) {
    mine.error = mine.mic && listen.err ? listen.err : "Audio could not start. Check your browser's sound settings and try again.";
    return run === mine && render();
  }
  if (run !== mine) return;
  if (mine.mic) mine.off = onNote(heardAt);
  beginRound(false);
}

export function rhythmMenu() {
  const P = S.rhythm,
    tog = (k, label) => `<button data-rh-opt="${k}" class="tg ${P[k] ? "a" : ""}" aria-pressed="${P[k]}">${label}</button>`;
  const mic = P.input === "mic";
  return `<div class="card game-library rhythm-menu"><div class="tag">GAME · TAP ALONG</div><h2>Tap the rhythm</h2><p>A bar of rhythm is shown on one line. Play it back in time: on every note, silent on rests. Every note is graded in milliseconds.</p><div class="chips"><button data-rh-input="tap" class="tg ${mic ? "" : "a"}" aria-pressed="${!mic}">Tap the screen or Space</button><button data-rh-input="mic" class="tg ${mic ? "a" : ""}" aria-pressed="${mic}">Play or clap (microphone)</button></div>${mic ? listenPanel() : ""}<div class="song-picker">${LEVELS.map((l) => `<button data-rh-level="${l.id}" class="${P.level === l.id ? "on" : ""}"><b>Level ${l.id} · ${l.name}</b><small>${l.hint}${P.best[l.id] ? " · best " + pct(P.best[l.id]) : ""}</small></button>`).join("")}</div><div class="bpm rh-bpm"><button data-rh-bpm="-5" aria-label="Slower">−</button><label><b>${P.bpm}</b> BPM</label><button data-rh-bpm="5" aria-label="Faster">+</button></div><div class="chips">${tog("countIn", "Count-in (one bar of clicks)")}${tog("click", "Click while I tap")}${tog("listen", "Hear it first")}</div>${mic ? "" : `<div class="bpm rh-bpm"><button data-rh-offset="-10" aria-label="Less compensation">−</button><label><b>${P.offset} ms</b> tap delay compensation</label><button data-rh-offset="10" aria-label="More compensation">+</button></div><small>If every tap is marked late, raise the compensation: wireless headphones and some phones add delay between a tap and the sound.</small>`}<button class="go" data-rh-start>Start (${ROUNDS} patterns)</button></div>`;
}

export function mountRhythm() {
  const change = (fn) => (D) => {
    fn(D);
    save();
    render();
  };
  action("rhStart", () => startRhythm());
  action("rhLevel", change((D) => (S.rhythm.level = +D.rhLevel)));
  action("rhBpm", change((D) => (S.rhythm.bpm = clamp(S.rhythm.bpm + +D.rhBpm, BPM_MIN, BPM_MAX))));
  action("rhOffset", change((D) => (S.rhythm.offset = clamp(S.rhythm.offset + +D.rhOffset, -150, 150))));
  action("rhInput", change((D) => (S.rhythm.input = D.rhInput === "mic" ? "mic" : "tap")));
  action("rhOpt", change((D) => (S.rhythm[D.rhOpt] = !S.rhythm[D.rhOpt])));
  action("rhExit", () => {
    stopRhythm();
    render();
  });
  action("rhRetry", () => run && beginRound(true));
  action("rhNext", () => {
    if (!run || !run.result) return;
    run.results.push(run.result);
    if (run.round >= run.rounds) {
      run.phase = "done";
      run.result = null;
      return render();
    }
    beginRound(false);
  });
  // Taps: pointerdown (not click) so there is no extra delay between the finger and the time stamp.
  app.addEventListener("pointerdown", (e) => {
    if (run && !run.result && e.target.closest("[data-rh-pad]")) {
      e.preventDefault();
      tapAt(e.timeStamp);
    }
  });
}

/* Keyboard taps. Returns true when the key press was used. */
export function rhythmKey(e) {
  if (!run || run.result || run.phase === "done" || !run.segs) return false;
  if (e.code === "Space" || e.key === "Enter") {
    e.preventDefault();
    if (!e.repeat) tapAt(e.timeStamp);
    return true;
  }
  return false;
}

/* For the browser tests (reached through ?debug): the live round and the clock conversion. */
export const rhythmDebug = () => ({ run, toPerf: run && run.sync ? toPerf : null });
