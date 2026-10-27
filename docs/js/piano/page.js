/* The Piano tab: an on-screen keyboard, a grand staff, the lesson runner and a small synth for keys you press.
   Notes arrive from three places, all through noteOn / noteOff: a MIDI keyboard (midi.js), the computer keyboard
   (A W S E D ... K, Z/X for octave) and clicks on the drawn keys. On the Cards tab, notes from a MIDI keyboard
   also answer cards that accept a played note, the same way the microphone does. */
import { S, ui, save } from "../core/store.js";
import { action, render, screen } from "../core/bus.js";
import { app } from "../core/dom.js";
import { ctx, audioReady, tone } from "../core/audio.js";
import { micHooks } from "../core/mic.js";
import { header } from "../view/chrome.js";
import { next } from "../cards/scheduler.js";
import { midi, midiConnect, midiHooks } from "./midi.js";
import { PASS_MARK, PIANO_LESSONS, PIANO_UNITS, chordName, grade, isBlack, matches, noteName } from "./lessons.js";

let run = null, // the lesson in progress
  pointer = null; // the drawn key held with the mouse or a finger
const held = new Set(), // MIDI numbers held down right now
  voices = new Map(),
  kbDown = new Map(); // computer key -> the MIDI number it started

/* Saved piano state: finished lessons and a few preferences. */
export function sanitizePiano() {
  const p = S.piano && typeof S.piano === "object" ? S.piano : {};
  if (!p.done || typeof p.done !== "object") p.done = {};
  if (typeof p.thru !== "boolean") p.thru = true; // the app sounds the keys you press
  if (typeof p.anyOct !== "boolean") p.anyOct = false;
  if (typeof p.midi !== "boolean") p.midi = false; // MIDI was allowed before: reconnect on load
  if (!(p.kbOct >= 24 && p.kbOct <= 96)) p.kbOct = 60;
  S.piano = p;
}
const anyOct = () => S.piano.anyOct;

/* ---------- sound ---------- */
function voiceOn(m, vel) {
  voiceOff(m);
  if (!S.piano.thru || S.mute || !ctx || ctx.state !== "running") return;
  const t = ctx.currentTime,
    f = 440 * Math.pow(2, (m - 69) / 12),
    v = 0.05 + 0.16 * (vel / 127),
    g = ctx.createGain(),
    o = ctx.createOscillator(),
    o2 = ctx.createOscillator(),
    g2 = ctx.createGain();
  o.type = "triangle";
  o.frequency.value = f;
  o2.type = "sine";
  o2.frequency.value = f * 2;
  g2.gain.value = 0.3;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(v, t + 0.005);
  g.gain.setTargetAtTime(v * 0.3, t + 0.01, 0.35); // a quick piano-like decay...
  g.gain.setTargetAtTime(0.0001, t + 1.2, 2.2); // ...then a long fade while the key is held
  o.connect(g);
  o2.connect(g2);
  g2.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o2.start(t);
  voices.set(m, { g, o, o2 });
}
function voiceOff(m) {
  const vc = voices.get(m);
  if (!vc) return;
  voices.delete(m);
  const t = ctx.currentTime;
  vc.g.gain.cancelScheduledValues(t);
  vc.g.gain.setValueAtTime(Math.max(0.0001, vc.g.gain.value), t);
  vc.g.gain.setTargetAtTime(0.0001, t, 0.07);
  vc.o.stop(t + 0.5);
  vc.o2.stop(t + 0.5);
}
/* Play steps one after another; the notes of one step sound together. */
function playSteps(steps, beat = 0.5) {
  if (S.mute) {
    if (run) {
      run.msg = "Sound is off. Turn it on (🔊) to hear the notes.";
      paintMsg();
    }
    return;
  }
  audioReady()
    .then(() => {
      const t = ctx.currentTime + 0.08;
      steps.forEach((st, i) => st.forEach((m) => tone(m, t + i * beat, 0.9 * beat, 0.32 / Math.sqrt(st.length))));
    })
    .catch(() => {});
}

/* ---------- note input ---------- */
function noteOn(m, vel, src) {
  held.add(m);
  voiceOn(m, vel);
  if (ui.page === "cards") return src === "midi" && cardsNote(m);
  if (ui.page !== "piano") return;
  if (run && run.phase === "play") judge(m);
  paintKeys();
}
function noteOff(m) {
  held.delete(m);
  voiceOff(m);
  if (ui.page === "piano") paintKeys();
}
export function pianoAllOff() {
  [...held].forEach(noteOff);
  kbDown.clear();
  pointer = null;
}

/* A MIDI note answers the flash card on screen, like the microphone does. */
let cardMsgTimer = 0;
function cardsNote(m) {
  const cur = ui.cur;
  if (!cur || cur.done || !cur.q.mic) return;
  if (cur.q.mic(m)) return micHooks.correct();
  const el = document.getElementById("midi-note");
  if (!el) return;
  el.textContent = "Heard " + noteName(m) + " – not quite, try again";
  clearTimeout(cardMsgTimer);
  cardMsgTimer = setTimeout(() => {
    const e2 = document.getElementById("midi-note");
    if (e2) e2.textContent = "Play it on your keyboard…";
  }, 1800);
}

/* ---------- lesson logic ---------- */
const target = () => run.L.parsed[run.i];
const shown = () => (!run || run.phase !== "play" ? [] : run.L.mode === "keys" || run.reveal ? target() : []);

function judge(m) {
  const r = run,
    T = target(),
    nm = (x) => noteName(x, r.L.flats);
  if (T.some((t) => matches(m, t, anyOct()))) {
    const have = T.filter((t) => [...held].some((h) => matches(h, t, anyOct()))).length;
    if (have === T.length) return stepDone();
    r.msg = `${have} of ${T.length} keys. Hold them and add the rest.`;
    r.msgCls = "";
  } else if (!anyOct() && T.some((t) => t % 12 === m % 12)) {
    // the right note in the wrong octave is a hint, not a mistake
    const t = T.find((x) => x % 12 === m % 12),
      o = Math.round(Math.abs(t - m) / 12);
    r.msg = `Right note, wrong octave: go ${m < t ? "up" : "down"} ${o > 1 ? o + " octaves" : "an octave"}.`;
    r.msgCls = "warn";
  } else {
    r.miss++;
    r.stepMiss++;
    r.msgCls = "badm";
    r.msg = r.L.mode === "keys" ? `That's ${nm(m)}. Look for ${T.map(nm).join(" + ")}.` : `That's ${nm(m)}. Try again.`;
    if (!r.reveal && ((r.L.mode === "read" && r.stepMiss >= 1) || (r.L.mode === "ear" && r.stepMiss >= 2))) {
      r.reveal = true;
      return render();
    }
  }
  paintMsg();
}
function stepDone() {
  const r = run;
  r.hits++;
  r.i++;
  Object.assign(r, { stepMiss: 0, reveal: false, msg: "", msgCls: "" });
  if (r.i >= r.L.parsed.length) return finish();
  render();
  if (r.L.mode === "ear") setTimeout(() => run === r && r.phase === "play" && playSteps([target()]), 650);
}
function finish() {
  const r = run,
    g = grade(r.hits, r.miss),
    rec = S.piano.done[r.L.id] || { best: 0, stars: 0 };
  r.result = { ...g, secs: Math.round((performance.now() - r.t0) / 1000) };
  S.piano.done[r.L.id] = { best: Math.max(rec.best, g.pct), stars: Math.max(rec.stars, g.stars) };
  S.xp += g.passed ? 20 + g.stars * 5 : 5;
  r.phase = "done";
  save();
  render();
}
function openLesson(id) {
  const L = PIANO_LESSONS.find((x) => x.id === id);
  if (!L) return;
  run = { L, i: 0, hits: 0, miss: 0, stepMiss: 0, reveal: false, phase: "intro", msg: "", msgCls: "" };
  render();
}
function start() {
  const r = run;
  Object.assign(r, { i: 0, hits: 0, miss: 0, stepMiss: 0, reveal: false, phase: "play", msg: "", msgCls: "", t0: performance.now() });
  render();
  if (r.L.mode === "ear") setTimeout(() => run === r && playSteps([target()]), 350);
}
const passed = (id) => (S.piano.done[id]?.best || 0) >= PASS_MARK;
const nextLesson = () => PIANO_LESSONS.find((L) => !passed(L.id)) || PIANO_LESSONS[0];

function pianoAction(D) {
  audioReady().catch(() => {}); // a click is the gesture browsers need before sound can start
  const a = D.pn,
    r = run;
  if (a === "connect") {
    midiConnect().then(render);
    return render();
  }
  if (a === "open") return openLesson(D.pnArg);
  if ((a === "start" || a === "retry") && r) return start();
  if (a === "next" && r) {
    const k = PIANO_LESSONS.indexOf(r.L);
    return openLesson((PIANO_LESSONS[k + 1] || PIANO_LESSONS[0]).id);
  }
  if (a === "exit") {
    run = null;
    return render();
  }
  if (a === "hear" && r) return playSteps(r.phase === "play" ? [target()] : r.L.parsed.slice(0, 12));
  if (a === "show" && r && r.phase === "play" && !r.reveal) {
    r.reveal = true;
    r.miss++; // peeking costs one mistake
    render();
    if (r.L.mode === "ear") playSteps([target()]);
    return;
  }
  if (a === "drill" && r && r.L.drill) {
    S.act = [...r.L.drill];
    S.onlyMine = 0;
    run = null;
    pianoAllOff();
    ui.page = "cards";
    save();
    return next();
  }
  if (a === "oct") S.piano.anyOct = !S.piano.anyOct;
  if (a === "thru") S.piano.thru = !S.piano.thru;
  save();
  render();
}

/* ---------- drawing ---------- */
function keyboard(lo, hi) {
  let wx = 0,
    whites = "",
    blacks = "";
  for (let m = lo; m <= hi; m++) {
    if (isBlack(m)) {
      blacks += `<rect class="pk pkb" data-pk="${m}" x="${wx * 20 - 6}" y="0" width="12" height="56" rx="2"><title>${noteName(m)}</title></rect>`;
    } else {
      whites += `<rect class="pk pkw" data-pk="${m}" x="${wx * 20}" y="0" width="20" height="92" rx="3"><title>${noteName(m)}</title></rect>`;
      if (m % 12 === 0) whites += `<text class="pk-lbl" x="${wx * 20 + 10}" y="84">${noteName(m)}</text>`;
      wx++;
    }
  }
  return `<svg class="pn-keys" viewBox="-1 -1 ${wx * 20 + 2} 94" role="group" aria-label="Piano keyboard">${whites}${blacks}</svg>`;
}
function paintKeys() {
  const sh = shown(),
    playing = run && run.phase === "play",
    T = playing ? target() : [];
  app.querySelectorAll(".pk").forEach((el) => {
    const m = +el.dataset.pk,
      h = held.has(m),
      good = h && playing && T.some((t) => matches(m, t, anyOct())),
      oct = h && playing && !good && T.some((t) => t % 12 === m % 12);
    el.classList.toggle("tg", !h && sh.includes(m));
    el.classList.toggle("gd", good);
    el.classList.toggle("oc", oct);
    el.classList.toggle("wr", h && playing && !good && !oct);
    el.classList.toggle("hd", h && !playing);
  });
  const fr = document.getElementById("pn-free");
  if (fr) {
    const hs = [...held].sort((a, b) => a - b),
      c = chordName(hs);
    fr.textContent = hs.length ? hs.map((m) => noteName(m)).join(" · ") + (c ? "  →  " + c : "") : "Play something to test your keyboard…";
  }
}
function paintMsg() {
  const el = document.getElementById("pn-msg");
  if (!el || !run) return;
  el.textContent = run.msg;
  el.className = "msg pn-msg " + (run.msgCls || "");
}
function paintStatus() {
  const el = document.getElementById("pn-conn");
  if (el) el.innerHTML = connHtml();
}
function connHtml() {
  if (midi.state === "unsupported")
    return "⚠️ This browser has no Web MIDI (Safari and iPhone/iPad don't support it). Use Chrome or Edge to connect a keyboard. Until then, play with your computer keys or click the keys below.";
  if (midi.state === "off") return `<button class="go" data-pn="connect">🎹 Connect MIDI keyboard</button>`;
  if (midi.state === "pending") return "Waiting for MIDI permission…";
  if (midi.state === "denied")
    return `MIDI access was blocked. Allow MIDI for this site in your browser settings, then <button data-pn="connect">try again</button>`;
  if (!midi.names.length) return "🎹 MIDI is on, but no keyboard was found. Plug one in and it will be picked up automatically.";
  return `<span class="pn-dot"></span> Connected: <b>${midi.names.join(", ")}</b>`;
}

/* Treble + bass staff, with several notes stacked as a chord. Staff steps match the rest of the app (E4 = 30). */
const SHARP_POS = [[0, ""], [0, "♯"], [1, ""], [1, "♯"], [2, ""], [3, ""], [3, "♯"], [4, ""], [4, "♯"], [5, ""], [5, "♯"], [6, ""]],
  FLAT_POS = [[0, ""], [1, "♭"], [1, ""], [2, "♭"], [2, ""], [3, ""], [4, "♭"], [4, ""], [5, "♭"], [5, ""], [6, "♭"], [6, ""]];
function grandStaff(notes, flats) {
  const map = flats ? FLAT_POS : SHARP_POS,
    step = (m) => (Math.floor(m / 12) - 1) * 7 + map[m % 12][0],
    yT = (s) => 60 - (s - 38) * 5, // treble: top line F5 (38) ... bottom line E4 (30)
    yB = (s) => 150 - (s - 26) * 5, // bass: top line A3 (26) ... bottom line G2 (18)
    X = 130,
    ledger = (x, y) => `<line x1="${x - 12}" x2="${x + 12}" y1="${y}" y2="${y}"/>`;
  let h = `<svg class="pn-staff" viewBox="0 0 220 200" role="img" aria-label="Grand staff">`;
  for (let i = 0; i < 5; i++)
    h += `<line x1="16" x2="206" y1="${yT(30 + i * 2)}" y2="${yT(30 + i * 2)}"/><line x1="16" x2="206" y1="${yB(18 + i * 2)}" y2="${yB(18 + i * 2)}"/>`;
  h += `<line x1="16" x2="16" y1="${yT(38)}" y2="${yB(18)}"/><text x="20" y="${yT(30) - 9}" font-size="74">𝄞</text><text x="22" y="${yB(24) + 3}" font-size="58">𝄢</text>`;
  const ns = notes.map((m) => ({ m, s: step(m), tr: m >= 60 })).sort((a, b) => a.s - b.s);
  let prev = null,
    accN = 0;
  for (const n of ns) {
    const y = n.tr ? yT(n.s) : yB(n.s);
    n.x = prev && prev.tr === n.tr && n.s - prev.s === 1 && prev.x === X ? X + 12 : X; // a second sits beside its neighbour
    prev = n;
    if (n.tr) {
      for (let s = 28; s >= n.s; s -= 2) h += ledger(n.x, yT(s));
      for (let s = 40; s <= n.s; s += 2) h += ledger(n.x, yT(s));
    } else {
      for (let s = 28; s <= n.s; s += 2) h += ledger(n.x, yB(s));
      for (let s = 16; s >= n.s; s -= 2) h += ledger(n.x, yB(s));
    }
    const acc = map[n.m % 12][1];
    if (acc) h += `<text class="pn-acc" x="${X - 24 - (accN++ % 2) * 11}" y="${y + 6}">${acc}</text>`;
    h += `<ellipse class="pn-note" cx="${n.x}" cy="${y}" rx="7.5" ry="5.5" transform="rotate(-20 ${n.x} ${y})"/>`;
  }
  return h + "</svg>";
}

function homeHtml() {
  const nx = nextLesson(),
    started = Object.keys(S.piano.done).length > 0;
  const units = PIANO_UNITS.map((u, ui) => {
    const ls = PIANO_LESSONS.filter((L) => L.unit === ui);
    return `<h3>${u.name}<small>${ls.filter((L) => passed(L.id)).length} / ${ls.length}</small></h3><div class="pn-list">${ls
      .map((L) => {
        const d = S.piano.done[L.id],
          note = d ? (d.stars ? "★".repeat(d.stars) + "☆".repeat(3 - d.stars) : d.best + "%") : L.mode === "read" ? "reading" : L.mode === "ear" ? "ear" : "";
        return `<button data-pn="open" data-pn-arg="${L.id}" class="${passed(L.id) ? "done" : ""} ${L === nx ? "next" : ""}"><span>${L.title}</span><small>${note}</small></button>`;
      })
      .join("")}</div>`;
  }).join("");
  return (
    `<div class="card pn-home"><div class="tag">PIANO LESSONS · MIDI</div><div id="pn-conn" class="pn-conn">${connHtml()}</div>` +
    `<div class="chips pn-opts"><button data-pn="oct" class="${anyOct() ? "a" : ""}" title="Accept the right note in any octave (handy on small keyboards)">${anyOct() ? "✓ " : ""}Any octave</button><button data-pn="thru" class="${S.piano.thru ? "a" : ""}" title="Sound the keys you press (turn off if your keyboard has its own speakers)">${S.piano.thru ? "🔊 App plays my keys" : "🔇 App sound off"}</button></div>` +
    `<div class="pn-kb">${keyboard(48, 83)}</div><div id="pn-free" class="pn-free"></div>` +
    `<small class="pn-kbhint">No MIDI keyboard? Use the computer keys <b>A W S E D F T G Y H U J K</b> (Z / X change octave) or click the keys.</small></div>` +
    `<button class="go" data-pn="open" data-pn-arg="${nx.id}">${started ? "Continue" : "Start"}: ${nx.title}</button><div class="card pn-units">${units}</div>`
  );
}

function lessonHtml() {
  const r = run,
    L = r.L,
    n = L.parsed.length,
    all = L.parsed.flat(),
    lo = Math.min(...all) - (Math.min(...all) % 12),
    hi = Math.max(lo + 23, Math.max(...all) + 11 - (Math.max(...all) % 12)),
    modeLabel = { keys: "keys light up", read: "read from the staff", ear: "play by ear" }[L.mode];
  let body;
  if (r.phase === "intro") {
    body = `<h2>${L.title}</h2><p class="pn-intro">${L.intro}</p><div class="pn-meta">${n} steps · ${modeLabel} · pass with ${PASS_MARK}%</div>${L.mode === "ear" ? "" : `<button class="sound-toggle" data-pn="hear">▶ Hear the start</button>`}<button class="go" data-pn="start">Start lesson</button>`;
  } else if (r.phase === "play") {
    const T = target(),
      nm = T.map((m) => noteName(m, L.flats)),
      f = L.fing[r.i],
      open = L.mode === "keys" || r.reveal,
      prompt =
        L.mode === "ear" && !r.reveal
          ? "Play the note you hear"
          : !open
            ? T.length > 1
              ? "Play these notes together"
              : "Play this note"
            : T.length > 1
              ? `Play <b>${nm.join(" + ")}</b> together`
              : `Play <b>${nm[0]}</b>`,
      cn = T.length > 2 && open ? chordName(T) : "",
      chord = /^[A-G]♯?(\/|$)/.test(cn) ? cn.replace(/^([A-G]♯?)/, "$1 major") : cn;
    body =
      `<div class="prompt">${prompt}${chord ? ` <span class="pn-chip">${chord}</span>` : ""}${f && f !== "-" ? ` <span class="pn-chip">finger ${f}</span>` : ""}</div>` +
      (L.mode === "ear" && !r.reveal ? `<div class="pn-ear" aria-hidden="true">🎧</div>` : grandStaff(T, L.flats)) +
      `<div class="pn-kb">${keyboard(lo, hi)}</div><div id="pn-msg" class="msg pn-msg ${r.msgCls || ""}" role="status">${r.msg}</div>` +
      `<div class="pn-bar"><i style="width:${(100 * r.i) / n}%"></i></div>` +
      `<div class="g2"><button data-pn="hear">▶ Hear it</button>${L.mode !== "keys" && !r.reveal ? `<button data-pn="show">Show me</button>` : `<button data-pn="oct" class="${anyOct() ? "on" : ""}">Any octave</button>`}</div>` +
      `<div id="pn-conn" class="pn-conn small">${connHtml()}</div>`;
  } else {
    const x = r.result,
      more = PIANO_LESSONS.indexOf(L) < PIANO_LESSONS.length - 1;
    body =
      `<h2>${x.passed ? "Lesson passed!" : "Almost there"}</h2><div class="pn-stars">${"★".repeat(x.stars)}${"☆".repeat(3 - x.stars)}</div>` +
      `<p>${x.pct}% accuracy · ${r.miss} wrong ${r.miss === 1 ? "note" : "notes"} · ${x.secs}s</p>` +
      (x.passed ? "" : `<p class="pn-intro">You need ${PASS_MARK}% to pass. Go slowly; accuracy matters, not speed.</p>`) +
      (x.passed && more ? `<button class="go" data-pn="next">Next lesson →</button>` : "") +
      `<button class="${x.passed ? "sound-toggle" : "go"}" data-pn="retry">↻ Try again</button>` +
      (L.drill ? `<button class="sound-toggle" data-pn="drill">Drill this in Cards (your keyboard answers)</button>` : "");
  }
  return `<div class="card pn-lesson"><div class="tag">PIANO · ${PIANO_UNITS[L.unit].name.toUpperCase()}${r.phase === "play" ? ` · STEP ${r.i + 1} / ${n}` : ""}</div>${body}<button class="rs" data-pn="exit">← All piano lessons</button></div>`;
}

function renderPiano() {
  if (S.piano.midi && midi.state === "off") midiConnect().then(() => ui.page === "piano" && paintStatus());
  app.innerHTML = header() + (run ? lessonHtml() : homeHtml());
  paintKeys();
}

/* Computer keys play notes on the Piano tab. Returns true when the key was used. */
const KEYS = { a: 0, w: 1, s: 2, e: 3, d: 4, f: 5, t: 6, g: 7, y: 8, h: 9, u: 10, j: 11, k: 12, o: 13, l: 14, p: 15, ";": 16 };
export function pianoKey(e) {
  if (e.ctrlKey || e.metaKey || e.altKey || /^(INPUT|SELECT|TEXTAREA)$/.test(e.target.tagName)) return false;
  const k = e.key.toLowerCase();
  if (k === "z" || k === "x") {
    S.piano.kbOct = Math.max(24, Math.min(96, S.piano.kbOct + (k === "z" ? -12 : 12)));
    save();
    return true;
  }
  if (!(k in KEYS)) return false;
  e.preventDefault();
  if (e.repeat || kbDown.has(k)) return true;
  const m = S.piano.kbOct + KEYS[k];
  kbDown.set(k, m);
  audioReady()
    .catch(() => {})
    .then(() => kbDown.get(k) === m && noteOn(m, 90, "kb"));
  return true;
}

export function mountPiano() {
  screen("piano", renderPiano);
  action("pn", pianoAction);
  midiHooks.on = (m, v) => noteOn(m, v, "midi");
  midiHooks.off = noteOff;
  midiHooks.allOff = () => [...held].forEach(noteOff);
  midiHooks.change = () => (ui.page === "piano" ? paintStatus() : ui.page === "cards" && render());

  app.addEventListener("pointerdown", (e) => {
    const k = e.target.closest("[data-pk]");
    if (!k) return;
    e.preventDefault();
    if (pointer !== null) noteOff(pointer);
    pointer = +k.dataset.pk;
    const m = pointer;
    audioReady()
      .catch(() => {})
      .then(() => pointer === m && noteOn(m, 90, "mouse"));
  });
  const up = () => {
    if (pointer === null) return;
    const m = pointer;
    pointer = null;
    if (![...kbDown.values()].includes(m)) noteOff(m);
  };
  window.addEventListener("pointerup", up);
  window.addEventListener("pointercancel", up);
  document.addEventListener("keyup", (e) => {
    const k = e.key.toLowerCase();
    if (!kbDown.has(k)) return;
    const m = kbDown.get(k);
    kbDown.delete(k);
    if (held.has(m)) noteOff(m);
  });
  window.addEventListener("blur", pianoAllOff);
  if (S.piano.midi) midiConnect().then(() => ui.page === "cards" && render()); // keyboard allowed before: reconnect
}
