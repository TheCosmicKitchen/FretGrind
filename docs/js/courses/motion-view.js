/* The Guitar motion drill screen (in Drills): choose chords, scales or both, how big the hand moves are and how tight the
   rhythm is, then play along. Bars are generated one at a time while it runs, scheduled on the audio clock like the Practice
   metronome, and what you see is driven by that same clock. The model and generator live in motion.js. */
import { S, save } from "../core/store.js";
import { action, render } from "../core/bus.js";
import { audioReady, click, ctx, tone } from "../core/audio.js";
import { header } from "../view/chrome.js";
import { KEYS, pretty } from "../library/catalog.js";
import { boxView } from "../library/draw.js";
import {
  BAR, MOTION_HINT, MOTION_NAMES, SCALE_CHOICES, TICKS, loadOf, loadWord, makeGen, moveHint, starterTempo,
} from "./motion.js";

const CONTENT = [["chords", "Chords"], ["scales", "Scales"], ["mixed", "Chords + scales"]];
const STRINGS = ["6th", "5th", "4th", "3rd", "2nd", "1st"];

/* saved preferences, made safe */
export function prefs() {
  const p = S.mo && typeof S.mo === "object" ? S.mo : {},
    int = (v, lo, hi, d) => (Number.isInteger(v) && v >= lo && v <= hi ? v : d);
  S.mo = {
    content: ["chords", "scales", "mixed"].includes(p.content) ? p.content : "chords",
    motion: int(p.motion, 1, 5, 2),
    rhythm: int(p.rhythm, 1, 5, 2),
    key: int(p.key, -1, 11, -1),
    scale: SCALE_CHOICES.some((s) => s.id === p.scale) ? p.scale : "majpent",
    vocab: p.vocab === "rich" ? "rich" : "basic",
    bpm: int(Math.round(p.bpm), 30, 200, 70),
    click: p.click !== false,
    notes: p.notes !== false,
    countIn: p.countIn !== false,
  };
  return S.mo;
}
const opts = (P = prefs()) => ({ content: P.content, motion: P.motion, rhythm: P.rhythm, key: P.key, scale: P.scale, vocab: P.vocab });

let run = null; // null = stopped, { starting } = waiting for audio, otherwise running
export const motionBusy = () => !!run;
const memo = {};
const suggested = (P) => {
  const k = JSON.stringify(opts(P));
  return (memo[k] ||= starterTempo(opts(P)));
};
const CHORD_WHY = ["One change a bar: four beats to move", "A change every 2 beats", "A change on every beat", "Changes land on the off-beats: only half a beat to move", "Syncopated, with changes as little as half a beat apart"];
const SCALE_WHY = ["Quarter notes: one note a beat", "Eighth notes: two a beat", "Triplets: three a beat", "Sixteenths: four a beat", "A different speed on each beat"];
const rhythmNames = (P) => (P.content === "scales" ? SCALE_WHY : P.content === "chords" ? CHORD_WHY : CHORD_WHY.map((c, i) => `Chords: ${c.toLowerCase()}. Scales: ${SCALE_WHY[i].toLowerCase()}`));
/* one example bar and the first few names it produces */
function example(P) {
  const g = makeGen(opts(P)),
    bars = [g.nextBar(), g.nextBar()],
    names = bars.flatMap((b) => b.events.map((e) => e.name)).slice(0, 8);
  return { bar: bars[P.content === "mixed" ? 0 : 1], names: names.join(" · ") };
}

const seg = (key, rows, val) => `<div class="mo-seg">${rows.map(([v, l]) => `<button data-mo-set="${key}" data-v="${v}" class="${String(val) === String(v) ? "on" : ""}">${l}</button>`).join("")}</div>`;
const tog = (key, label, on) => `<button data-mo-set="${key}" class="tg ${on ? "a" : ""}" aria-pressed="${on}">${label}</button>`;

/* ---------- setup screen ---------- */
function setupHtml() {
  const P = prefs(),
    sug = suggested(P),
    samples = (() => {
      let x = 777;
      const r = () => (x = (x * 16807) % 2147483647) / 2147483647,
        g = makeGen(opts(P), r);
      return loadOf(Array.from({ length: 16 }, () => g.nextBar()), P.bpm);
    })(),
    word = loadWord(samples.peak),
    needScale = P.content !== "chords",
    showKey = true;
  return `${header()}<button class="ln-back" data-ln-drills>← Drills</button>
  <div class="ln-title"><span class="ln-ic">🎸</span><div><h2>Motion drills</h2><p class="ln-sub">Chord changes and scale runs, built on the spot and played in time. Pick how far your hands travel and how little time you get to do it.</p></div></div>
  <section class="card mo-set">
    <div class="tag">WHAT TO PRACTISE</div>${seg("content", CONTENT, P.content)}
    <div class="tag">HAND MOTION</div>${seg("motion", MOTION_NAMES.map((n, i) => [i + 1, n]), P.motion)}
    <p class="ln-sub">${MOTION_HINT[P.motion - 1]}.</p>
    <div class="tag">RHYTHM</div>${seg("rhythm", [1, 2, 3, 4, 5].map((n) => [n, n]), P.rhythm)}
    <p class="ln-sub">${rhythmNames(P)[P.rhythm - 1]}.</p>
    ${showKey ? `<div class="tag">KEY</div><div class="chips mo-keys"><button data-mo-set="key" data-v="-1" class="${P.key < 0 ? "a" : ""}">Any</button>${KEYS.map((k, i) => `<button data-mo-set="key" data-v="${i}" class="${P.key === i ? "a" : ""}">${pretty(k)}</button>`).join("")}</div>` : ""}
    ${needScale || P.key >= 0 ? `<label class="pr-sel">Scale <select data-mo-sel="scale">${SCALE_CHOICES.map((s) => `<option value="${s.id}"${P.scale === s.id ? " selected" : ""}>${s.name}</option>`).join("")}</select></label>` : ""}
    ${P.content !== "scales" ? `<div class="tag">CHORDS</div>${seg("vocab", [["basic", "Basic: major, minor, 7"], ["rich", "Rich: 7ths, sus, add9"]], P.vocab)}` : ""}
    <div class="tag">TEMPO</div>
    <div class="bpm mo-bpm"><button data-mo-set="bpm" data-v="-5" aria-label="Slower">−</button><label><b id="mo-bpmv">${P.bpm}</b> BPM<input type="range" id="mo-bpm" min="30" max="200" step="1" value="${P.bpm}" aria-label="Tempo in beats per minute"></label><button data-mo-set="bpm" data-v="5" aria-label="Faster">+</button></div>
    <p class="ln-sub mo-load">At this tempo it feels like: <b>${word}</b>. <button class="tg" data-mo-set="suggest" data-v="${sug}">Use ${sug} BPM</button></p>
    ${(() => { const ex = example(P); return `<div class="tag">ONE BAR OF THIS</div>${strip(ex.bar, -1)}<p class="ln-sub mo-ex">${ex.names}</p>`; })()}
    <div class="chips pr-opts">${tog("click", "🕒 Click", P.click)}${tog("notes", "🔊 Play the notes", P.notes)}${tog("countIn", "1-bar count-in", P.countIn)}</div>
    <button class="go" data-mo-start>${run ? "…" : "▶ Start"}</button>
    <small>Every round is made fresh, so you can keep going as long as you like. The difficulty score is a rough guide: tune it by feel.</small>
  </section>`;
}

/* ---------- run screen (painted once; the clock updates the pieces) ---------- */
const miniTab = (e) => {
  const Y = (s) => 12 + (5 - s) * 9;
  return `<svg viewBox="0 0 150 66" class="mo-tab" role="img" aria-label="${STRINGS[e.s]} string, fret ${e.f}">${[0, 1, 2, 3, 4, 5].map((s) => `<line x1="14" x2="144" y1="${Y(s)}" y2="${Y(s)}"/>`).join("")}<rect x="66" y="${Y(e.s) - 7}" width="22" height="14" rx="4"/><text x="77" y="${Y(e.s) + 4}" text-anchor="middle">${e.f}</text></svg>`;
};
const face = (e) => (e.kind === "chord" ? `<div class="mo-name">${e.name}</div><div class="mo-box">${boxView(e.v)}</div>` : `<div class="mo-name">${e.name}</div>${miniTab(e)}<small>${STRINGS[e.s]} string · fret ${e.f || "open"}</small>`);
const strip = (bar, hot) =>
  `<div class="mo-strip${bar.events.length > 6 ? " dots" : ""}" aria-label="Where the changes fall in this bar">${[0, 1, 2, 3].map((b) => `<i style="left:${(b / 4) * 100}%"></i>`).join("")}${bar.events.map((e) => `<span class="${e.id === hot ? "hot" : ""}" style="left:${(e.t / BAR) * 100}%">${e.name}</span>`).join("")}</div>`;

function runHtml() {
  const P = prefs();
  return `${header()}<div class="ln-top"><button class="ln-x" data-mo-stop aria-label="Stop">✕</button><div><div class="tag">MOTION DRILL</div><b>${CONTENT.find((c) => c[0] === P.content)[1]} · ${MOTION_NAMES[P.motion - 1]} motion · rhythm ${P.rhythm}</b></div></div>
  <section class="card mo-run">
    <div class="beats" aria-label="Beat">${[0, 1, 2, 3].map((b) => `<span class="bd" data-b="${b}">${b + 1}</span>`).join("")}</div>
    <p class="mo-info" id="mo-info">Get ready…</p>
    <div class="mo-pair"><div class="mo-now"><div class="tag">NOW</div><div id="mo-now" class="mo-face">·</div></div><div class="mo-next"><div class="tag">NEXT <span id="mo-lv"></span></div><div id="mo-next" class="mo-face">·</div><p id="mo-hint" class="mo-hint"></p></div></div>
    <div id="mo-strip"></div>
    <div class="pr-ctl"><button class="go alt pr-play" data-mo-stop>■ Stop</button><button class="go alt pr-play" data-mo-new>New pattern</button>
      <div class="bpm"><button data-mo-set="bpm" data-v="-5" aria-label="Slower">−</button><label><b id="mo-bpmv">${P.bpm}</b> BPM<input type="range" id="mo-bpm" min="30" max="200" step="1" value="${P.bpm}" aria-label="Tempo in beats per minute"></label><button data-mo-set="bpm" data-v="5" aria-label="Faster">+</button></div></div>
    <div class="chips pr-opts">${tog("click", "🕒 Click", P.click)}${tog("notes", "🔊 Play the notes", P.notes)}</div>
  </section>`;
}
export const motionView = () => (run ? runHtml() : setupHtml());

const el = (id) => document.getElementById(id);
function paint(s) {
  if (!s) return;
  if (run) s.kind === "beat" ? (run.beatS = s) : (run.shown = s);
  document.querySelectorAll(".bd").forEach((e) => e.classList.toggle("on", s.beat != null && +e.dataset.b === s.beat));
  if (s.info != null && el("mo-info")) el("mo-info").textContent = s.info;
  if (s.kind === "beat") return;
  if (s.kind === "ready") {
    el("mo-now") && (el("mo-now").innerHTML = "·");
    el("mo-next") && (el("mo-next").innerHTML = face(s.next));
    el("mo-hint") && (el("mo-hint").textContent = "Get your hands ready");
    return;
  }
  el("mo-now") && (el("mo-now").innerHTML = face(s.ev));
  if (el("mo-strip")) el("mo-strip").innerHTML = strip(s.bar, s.ev.id);
  if (s.next) {
    el("mo-next").innerHTML = face(s.next);
    el("mo-lv").innerHTML = `<span class="mo-lv l${s.next.level}">${MOTION_NAMES[s.next.level - 1]}</span> in ${s.gap / TICKS === 1 ? "1 beat" : +(s.gap / TICKS).toFixed(2) + " beats"}`;
    el("mo-hint").textContent = moveHint(s.ev, s.next);
  }
}
export const motionAfter = () => {
  if (!run) return;
  run.shown && paint(run.shown);
  run.beatS && paint(run.beatS);
};

/* ---------- the clock ---------- */
function pump() {
  const P = prefs();
  while (run && !run.starting && run.time < ctx.currentTime + 0.18) {
    const T = run.tick,
      t = run.time;
    if (T % TICKS === 0) {
      const beat = (((T / TICKS) % 4) + 4) % 4;
      if (P.click || T < 0) click(t, beat === 0);
      run.q.push({ t, kind: "beat", beat, info: T < 0 ? "Count-in: " + (4 - beat) : null });
      if (T === -BAR) run.q[run.q.length - 1].ready = run.bars[0].events[0];
    }
    if (T >= 0) {
      const bi = Math.floor(T / BAR),
        tt = T % BAR;
      if (tt === 0) {
        while (run.top <= bi + 1) run.bars[run.top] = run.g.nextBar(), run.top++;
        delete run.bars[bi - 3];
      }
      const bar = run.bars[bi],
        i = bar.events.findIndex((e) => e.t === tt);
      if (i >= 0) {
        const ev = bar.events[i],
          nb = run.bars[bi + 1];
        let next = bar.events[i + 1],
          gap = next ? next.t - ev.t : 0;
        if (!next && nb && nb.events.length) (next = nb.events[0]), (gap = BAR - ev.t + next.t);
        const spb = 60 / P.bpm;
        if (P.notes) {
          const sec = Math.min(1.4, ((gap || TICKS) / TICKS) * spb * 0.92);
          ev.midis.forEach((m, k) => tone(m, t + (ev.kind === "chord" ? k * 0.028 : 0), sec, (0.3 / Math.sqrt(ev.midis.length)) * 1.6, "triangle", true));
        }
        run.q.push({ t, kind: "event", ev, next, gap, bar, beat: Math.floor(tt / TICKS), info: `Bar ${bi + 1}` });
      }
    }
    run.tick++;
    run.time += 60 / P.bpm / TICKS;
  }
}
function frame() {
  if (!run) return;
  while (run.q.length && run.q[0].t <= ctx.currentTime) {
    const s = run.q.shift();
    if (s.ready) paint({ kind: "ready", next: s.ready, beat: s.beat, info: s.info });
    else paint(s);
  }
  run.raf = requestAnimationFrame(frame);
}

export function motionStart() {
  if (run) return;
  const P = prefs();
  run = { starting: true };
  render();
  audioReady()
    .then(() => {
      if (!run) return;
      const g = makeGen(opts(P)),
        bars = {};
      bars[0] = g.nextBar();
      run = { g, bars, top: 1, q: [], tick: P.countIn ? -BAR : 0, time: ctx.currentTime + 0.12, shown: null };
      if (!P.countIn) run.q.push({ t: run.time, kind: "ready", next: bars[0].events[0] });
      pump();
      run.timer = setInterval(pump, 25);
      run.raf = requestAnimationFrame(frame);
      render();
    })
    .catch(() => {
      run = null;
      render();
    });
}
export function motionStop() {
  if (!run) return;
  clearInterval(run.timer);
  cancelAnimationFrame(run.raf);
  run = null;
}
const stopAndShow = () => (motionStop(), render());
document.addEventListener("visibilitychange", () => {
  if (document.hidden && run) stopAndShow();
});
/* Space starts and stops it. Returns true when the key was used. */
export function motionKey(e, view) {
  if (view !== "motion" || e.key !== " " || /^(BUTTON|INPUT|SELECT|TEXTAREA|A)$/.test(e.target.tagName)) return false;
  e.preventDefault();
  run ? stopAndShow() : motionStart();
  return true;
}

function set(k, v) {
  const P = prefs();
  if (k === "bpm") P.bpm = Math.max(30, Math.min(200, P.bpm + +v));
  else if (k === "suggest") P.bpm = +v;
  else if (["click", "notes", "countIn"].includes(k)) P[k] = !P[k];
  else if (k === "vocab") P.vocab = v;
  else if (k === "content") P.content = v;
  else P[k] = +v;
  save();
  if (run && ["click", "notes", "bpm"].includes(k)) {
    // while playing: update just what changed, so the clock is never interrupted
    document.querySelectorAll('[data-mo-set="click"],[data-mo-set="notes"]').forEach((b) => {
      const on = P[b.dataset.moSet];
      b.classList.toggle("a", on);
      b.setAttribute("aria-pressed", on);
    });
    el("mo-bpmv") && (el("mo-bpmv").textContent = P.bpm);
    el("mo-bpm") && (el("mo-bpm").value = P.bpm);
    return;
  }
  render();
}

export function mountMotion() {
  action("moSet", (D) => set(D.moSet, D.v));
  action("moStart", () => motionStart());
  action("moStop", () => stopAndShow());
  action("moNew", () => {
    if (!run || run.starting) return;
    const P = prefs(),
      g = makeGen(opts(P));
    run.g = g;
    // the next bar the clock asks for will come from the new generator; bars already queued play out
    run.top = Math.max(run.top, Math.floor(Math.max(0, run.tick) / BAR) + 1);
    run.bars[run.top] = g.nextBar();
    run.top++;
  });
  document.addEventListener("input", (e) => {
    if (e.target.id !== "mo-bpm") return;
    prefs().bpm = +e.target.value;
    el("mo-bpmv") && (el("mo-bpmv").textContent = prefs().bpm);
    save();
  });
  document.addEventListener("change", (e) => {
    const k = e.target.dataset && e.target.dataset.moSel;
    if (k) (prefs()[k] = e.target.value), save(), render();
    else if (e.target.id === "mo-bpm") render();
  });
}
