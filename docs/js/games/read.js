/* "Read the rhythm": four bars of rhythm on the staff, never seen before. A bar of count-in to look ahead, then you tap
   it straight through with the click, and every note is graded in milliseconds. Taps share the clock pairing and the
   delay compensation of "Tap the rhythm". */
import { S, save } from "../core/store.js";
import { audioReady, click, ctx, tone } from "../core/audio.js";
import { action, render } from "../core/bus.js";
import { app } from "../core/dom.js";
import { header } from "../view/chrome.js";
import { build } from "../songs/format.js";
import { songSvg } from "../songs/draw.js";
import { bias, gradeTaps, stars, windowFor } from "./rhythm-patterns.js";
import { syncClock } from "./rhythm.js";
import { READ_BARS, READ_LEVELS, readLine } from "./reading.js";

const LINES = 4,
  SPEEDS = [60, 75, 100, 125];

export function sanitizeRead() {
  const r = S.read && typeof S.read === "object" ? S.read : {},
    best = {};
  for (const l of READ_LEVELS) if (r.best && Number.isFinite(r.best[l.id])) best[l.id] = Math.max(0, Math.min(1, r.best[l.id]));
  S.read = {
    level: READ_LEVELS.some((l) => l.id === r.level) ? r.level : 1,
    pct: SPEEDS.includes(r.pct) ? r.pct : 100,
    click: r.click !== false,
    best, // the best whole run at full speed or faster, per level
  };
}

let run = null; // { level, round, results, song, sync, start, end, due, taps, result, raf, hot }
export const readActive = () => !!run;
export function stopRead() {
  if (run) cancelAnimationFrame(run.raf);
  run = null;
}
const toPerf = (t) => run.sync.perf + (t - run.sync.audio) * 1000 + run.sync.lat;

/* ---- one line ---- */
function schedule() {
  const s = run.song,
    usec = 60 / (s.tempo * (S.read.pct / 100) * s.beat), // seconds per sixteenth
    beats = Math.round(s.bar / s.beat),
    t0 = ctx.currentTime + 0.3,
    start = t0 + s.bar * usec;
  for (let b = 0; b < beats; b++) click(t0 + b * s.beat * usec, b === 0); // the count-in always clicks
  if (S.read.click) for (let u = 0; u < s.total; u += s.beat) click(start + u * usec, u % s.bar === 0);
  Object.assign(run, { usec, t0, start, end: start + s.total * usec, due: s.sounding.map((n) => start + n.start * usec), taps: [], result: null, hot: -1, sync: syncClock() });
}

function frame() {
  if (!run || run.result) return;
  run.sync = syncClock();
  const now = ctx.currentTime,
    s = run.song,
    status = document.getElementById("rd-status"),
    pad = document.getElementById("rd-pad");
  if (status) status.textContent = now < run.start ? `Count in… ${Math.min(Math.round(s.bar / s.beat), Math.floor((now - run.t0) / (s.beat * run.usec)) + 1)}` : now < run.end ? "Tap it!" : "…";
  if (pad) pad.classList.toggle("live", now >= run.start - s.beat * run.usec && now < run.end);
  // the note that's due lights up, so you can keep your place while your eyes run ahead
  let i = run.hot;
  while (i + 1 < run.due.length && run.due[i + 1] <= now) i++;
  if (i !== run.hot) {
    document.querySelectorAll(".rd-score .hot").forEach((e) => e.classList.remove("hot"));
    document.querySelectorAll(`.rd-score [data-n="${i}"]`).forEach((e) => e.classList.add("hot"));
    run.hot = i;
  }
  if (now >= run.end + 0.4) return finishLine();
  run.raf = requestAnimationFrame(frame);
}

function beginLine(again) {
  if (!again) {
    run.round++;
    run.song = build(readLine(`rr:${run.level}:${1 + Math.floor(Math.random() * 1e6)}`));
  }
  schedule();
  render();
  cancelAnimationFrame(run.raf);
  run.raf = requestAnimationFrame(frame);
}

function tapAt(perf) {
  if (!run || run.result || !run.due) return;
  if (perf < toPerf(run.start) - run.song.beat * run.usec * 500 || perf > toPerf(run.end) + 250) return;
  run.taps.push(perf - S.rhythm.offset);
  tone(88, ctx.currentTime, 0.1, 0.22, "triangle", true);
  const pad = document.getElementById("rd-pad");
  if (pad) (pad.classList.add("hit"), setTimeout(() => pad.classList.remove("hit"), 90));
}

/* Each note's mark: on time, early, late or missed, as the songs mark them. */
export const markOf = (n) => (n.delta === null ? "miss" : n.pts === 3 ? "ok" : n.delta < 0 ? "early" : "late");
function finishLine() {
  const exp = run.due.map(toPerf),
    g = gradeTaps(exp, run.taps, windowFor(exp));
  run.result = { g, stars: stars(g.accuracy), bias: bias(g.notes), again: run.retried };
  S.xp += g.pts;
  save();
  render();
}

/* ---- pages ---- */
const pct = (x) => Math.round(x * 100) + "%";
const starRow = (n) => "★".repeat(n) + "☆".repeat(3 - n);
const width = () => Math.max(280, Math.min(760, Math.floor(app.clientWidth - 58)));

function resultBlock() {
  const r = run.result,
    g = r.g,
    marks = g.notes.map(markOf),
    count = (m) => marks.filter((x) => x === m).length,
    b = r.bias,
    biasText = g.notes.every((n) => n.delta === null) ? "No taps landed on a note." : Math.abs(b) < 15 ? "Right on the click." : b > 0 ? `You land about ${Math.round(b)} ms late.` : `You land about ${Math.round(-b)} ms early.`,
    last = run.round >= LINES;
  return `<div class="rh-result"><div class="rh-stars" aria-label="${r.stars} of 3 stars">${starRow(r.stars)}</div><div class="rh-acc">${pct(g.accuracy)} · ${count("ok")} of ${marks.length} right on time</div><p>${biasText}${count("miss") ? ` ${count("miss")} missed.` : ""}${g.extras.length ? ` ${g.extras.length} extra tap${g.extras.length > 1 ? "s" : ""} (on a rest or twice).` : ""}${r.again ? " A second look at the same line is practice; the first read is the one that counts." : ""}</p><div class="sg-key"><i class="res-ok">on time</i><i class="res-early">early</i><i class="res-late">late</i><i class="res-miss">missed</i></div><div class="rh-actions"><button class="go" data-rd-next>${last ? "Finish" : "Next line →"}</button><button data-rd-retry>Try this line again</button></div></div>`;
}

export function renderRead() {
  const L = READ_LEVELS.find((l) => l.id === run.level);
  if (run.error) {
    app.innerHTML = `${header()}<div class="card"><div class="msg badm" role="alert">${run.error}</div><button class="rs" data-rd-exit>← Games</button></div>`;
    return;
  }
  if (run.done) {
    const firsts = run.results.filter((r) => !r.again),
      avg = firsts.reduce((a, r) => a + r.g.accuracy, 0) / (firsts.length || 1),
      best = S.read.best[run.level] || 0;
    app.innerHTML = `${header()}<div class="card rhythm-card"><div class="tag">READ THE RHYTHM · LEVEL ${run.level} · DONE</div><div class="prompt">${LINES} lines read</div><div class="rh-stars">${starRow(stars(avg))}</div><div class="rh-acc">${pct(avg)} on first reads</div><p>${avg >= 0.9 && run.level < READ_LEVELS.length ? `Ready for level ${run.level + 1}: ${READ_LEVELS[run.level].name.toLowerCase()}.` : avg >= 0.7 ? "Solid. Another run, or a little faster." : "Try it a little slower: reading is easier when there's time to look ahead."}${best ? ` Your best: ${pct(best)}.` : ""}</p><div class="rh-actions">${avg >= 0.9 && run.level < READ_LEVELS.length ? `<button class="go" data-rd-up>Level ${run.level + 1} →</button>` : ""}<button class="${avg >= 0.9 && run.level < READ_LEVELS.length ? "" : "go"}" data-rd-start>Read ${LINES} more</button><button data-rd-exit>← Games</button></div></div>`;
    return;
  }
  const s = run.song,
    r = run.result;
  app.innerHTML = `${header()}<div class="card rhythm-card"><div class="tag">READ THE RHYTHM · LEVEL ${run.level} · LINE ${run.round} / ${LINES} · ${Math.round((s.tempo * S.read.pct) / 100)} BPM</div><div class="prompt" id="rd-status">${r ? "Here is how you did" : "Get ready…"}</div><div class="sg-wrap rd-score">${songSvg(s, null, { width: width(), view: "staff" })}</div>${
    r ? resultBlock() : `<button class="rh-pad" id="rd-pad" data-rd-pad aria-label="Tap here, or press Space">TAP<small>${esc(L.hint)} · or press Space</small></button>`
  }<button class="rs" data-rd-exit>← Games</button></div>`;
  if (r) r.g.notes.forEach((n, i) => document.querySelectorAll(`.rd-score [data-n="${i}"]`).forEach((e) => e.classList.add("res-" + markOf(n))));
}
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

export async function startRead() {
  S.mute = false; // the clock is the audio, so sound must be on
  save();
  run = { level: S.read.level, round: 0, results: [], song: null, result: null, error: "" };
  const mine = run;
  try {
    await audioReady();
  } catch (e) {
    mine.error = "Audio could not start. Check your browser's sound settings and try again.";
    return run === mine && render();
  }
  if (run === mine) beginLine(false);
}

export function readMenu() {
  const P = S.read;
  return `<div class="card game-library rhythm-menu"><div class="tag">GAME · READING</div><h2>Read the rhythm</h2><p>Four bars on the staff you've never seen. One bar of count-in to look ahead, then tap every note in time with the click, straight through. Every line is new, so it's real reading. The levels follow the rhythm lessons in Music theory.</p><div class="song-picker">${READ_LEVELS.map((l) => `<button data-rd-level="${l.id}" class="${P.level === l.id ? "on" : ""}"><b>Level ${l.id} · ${l.name}</b><small>${l.hint} · ${l.tempo} bpm${P.best[l.id] ? " · best " + pct(P.best[l.id]) : ""}</small></button>`).join("")}</div><div class="chips">${SPEEDS.map((v) => `<button data-rd-pct="${v}" class="${P.pct === v ? "a" : ""}" aria-pressed="${P.pct === v}">${v}%</button>`).join("")}<button data-rd-click class="tg ${P.click ? "a" : ""}" aria-pressed="${P.click}">Click while I tap</button></div><small>Taps use the delay compensation set in Tap the rhythm (${S.rhythm.offset} ms).</small><button class="go" data-rd-start>Start (${LINES} lines of ${READ_BARS} bars)</button></div>`;
}

export function mountRead() {
  const change = (fn) => (D) => {
    fn(D);
    save();
    render();
  };
  action("rdStart", () => startRead());
  action("rdLevel", change((D) => (S.read.level = +D.rdLevel)));
  action("rdPct", change((D) => (S.read.pct = SPEEDS.includes(+D.rdPct) ? +D.rdPct : 100)));
  action("rdClick", change(() => (S.read.click = !S.read.click)));
  action("rdExit", () => {
    stopRead();
    render();
  });
  action("rdUp", () => {
    S.read.level = Math.min(READ_LEVELS.length, S.read.level + 1);
    save();
    startRead();
  });
  action("rdRetry", () => {
    if (!run || !run.result) return;
    run.results.push(run.result);
    run.retried = true;
    beginLine(true);
  });
  action("rdNext", () => {
    if (!run || !run.result) return;
    run.results.push(run.result);
    run.retried = false;
    if (run.round < LINES) return beginLine(false);
    const firsts = run.results.filter((r) => !r.again),
      avg = firsts.reduce((a, r) => a + r.g.accuracy, 0) / (firsts.length || 1);
    if (S.read.pct >= 100) S.read.best[run.level] = Math.max(S.read.best[run.level] || 0, avg);
    run.done = true;
    save();
    render();
  });
  app.addEventListener("pointerdown", (e) => {
    if (run && !run.result && e.target.closest("[data-rd-pad]")) {
      e.preventDefault();
      tapAt(e.timeStamp);
    }
  });
}

/* Keyboard taps. Returns true when the key press was used. */
export function readKey(e) {
  if (!run || run.result || run.done || !run.due) return false;
  if (e.code === "Space" || e.key === "Enter") {
    e.preventDefault();
    if (!e.repeat) tapAt(e.timeStamp);
    return true;
  }
  return false;
}

/* For the browser tests (reached through ?debug): the live line and the clock conversion. */
export const readDebug = () => ({ run, toPerf: run && run.sync ? toPerf : null });
