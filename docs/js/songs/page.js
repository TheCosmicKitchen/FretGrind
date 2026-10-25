/* The Songs tab: a graded list of public-domain songs, and a player that shows each one as sheet
   music and tab and plays it along with a click. */
import { S, save } from "../core/store.js";
import { action, on, render, screen } from "../core/bus.js";
import { app } from "../core/dom.js";
import { header } from "../view/chrome.js";
import { SONGS } from "./data.js";
import { build } from "./format.js";
import { tabify } from "./tabify.js";
import { lineOf, songSvg } from "./draw.js";
import { songBusy, songClock, songRunning, songStart, songStop } from "./player.js";
import { gradeRun, waitStep } from "./grade.js";
import { NAMES } from "../core/theory.js";
import { ctx, tone } from "../core/audio.js";
import { listen, listenStart, onNote } from "../core/listen-io.js";
import { listenPanel } from "../core/listen-ui.js";

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
  SPEEDS = [50, 75, 90, 100],
  MODES = [["hear", "Hear it"], ["along", "Play along"], ["wait", "Wait for me"]];

export function sanitizeSongs() {
  const p = S.songs && typeof S.songs === "object" ? S.songs : {},
    ok = (v, a, d) => (a.includes(v) ? v : d),
    done = {};
  if (p.done && typeof p.done === "object") for (const id of Object.keys(p.done)) if (byId[id] && p.done[id]) done[id] = 1;
  S.songs = {
    cur: byId[p.cur] ? p.cur : null,
    view: ok(p.view, ["staff", "tab", "both"], "both"),
    mode: ok(p.mode, ["hear", "along", "wait"], "hear"),
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
    mode = P.mode,
    beats = Array.from({ length: s.bar / s.beat }, (_, b) => `<span class="bd" data-b="${b}">${b + 1}</span>`).join(""),
    hasWords = s.words !== undefined;
  app.innerHTML = `${header()}<div class="card prac">
    <div class="pr-now"><div><h2>${s.title}</h2><p class="pr-sub">${s.by} · ${meta(s)}</p></div><button class="tg" data-sp="back">← All songs</button></div>
    ${seg("view", VIEWS, P.view)}${seg("mode", MODES, mode)}
    <div class="sg-wrap" id="sg-wrap">${songSvg(s, tabFor(s), { width: width(), view: P.view, lyrics: hasWords && P.lyrics })}</div>
    <div class="beats" aria-label="Beat">${beats}</div>
    ${mode === "hear" ? "" : modeBlock(s)}
    <div class="pr-ctl">
      <button class="go pr-play" data-sp="play">${run || wait ? "■ Stop" : songBusy() ? "…" : mode === "hear" ? "▶ Play" : mode === "along" ? "▶ Start (count-in, then play)" : "▶ Start"}</button>
      <div class="chips pr-opts">${SPEEDS.map((v) => `<button data-sp="pct" data-v="${v}" class="${P.pct === v ? "a" : ""}">${v}%</button>`).join("")}</div>
    </div>
    <small class="sg-bpm">${Math.round((s.tempo * P.pct) / 100)} beats per minute</small>
    <div class="chips pr-opts">${tog("click", "🕒 Click", P.click)}${tog("notes", "🔊 Notes", P.notes)}${tog("countIn", "1-bar count-in", P.countIn)}${tog("loop", "🔁 Loop", P.loop)}${hasWords ? tog("lyrics", "Words", P.lyrics) : ""}${tog("done", P.done[s.id] ? "✓ Learned" : "Mark as learned", !!P.done[s.id])}</div>
    <small>${s.source}${s.reviewed ? "" : " The tab was chosen by the program and has not been checked by hand yet: if a fingering feels awkward, trust your hand."} Space starts and stops.</small>
  </div>`;
  paint(s);
}

/* ----- listening: "Play along" (graded against the click) and "Wait for me" (the song waits for each note) ----- */
let along = null, // a play-along in progress: { song, heard, off, clock }
  res = null, // the last play-along's result: { song, g }
  wait = null; // wait-for-me in progress: { song, i, wrong, off, msg, done, quietUntil }
const bar = (s, i) => (s.pickup ? s.sounding[i].bar || "pick-up" : s.sounding[i].bar + 1);

function modeBlock(s) {
  const mode = S.songs.mode;
  let h = listenPanel();
  if (mode === "along") {
    h += along
      ? `<p class="sg-say" id="sg-say">Count-in, then play the melody. Notes are marked when it ends.</p>`
      : res && res.song === s.id
        ? resultBlock(s, res.g)
        : `<p class="sg-say">The click counts you in, then you play the melody on your guitar. Every note is marked for pitch and for timing (${S.listen.phones ? "the click keeps going because you wear headphones" : "the click stops after the count-in so the microphone only hears you"}).</p>`;
  } else if (wait)
    h += `<p class="sg-say" id="sg-say">${waitSay(s)}</p><div class="chips"><button data-sp="hearNote">🔊 Hear this note</button></div>`;
  else h += `<p class="sg-say">The song waits for you. Play each note as it lights up and the song moves on. No clock, so take your time.</p>`;
  return h;
}
function waitSay(s) {
  if (!wait) return "";
  if (wait.done) return `Done! ${wait.wrong ? wait.wrong + " wrong note" + (wait.wrong > 1 ? "s" : "") + " on the way." : "Not one wrong note."}`;
  const n = s.sounding[wait.i];
  return `Play the lit note (${wait.i + 1} of ${s.sounding.length}, bar ${bar(s, wait.i)}).${wait.msg ? " " + wait.msg : ""}`;
}
function resultBlock(s, g) {
  const c = g.counts,
    n = g.notes.length,
    p = (st) => g.notes.map((x, i) => (x.state === st ? bar(s, i) : null)).filter((x, i, a) => x !== null && a.indexOf(x) === i),
    spots = ["wrong", "miss", "late", "early"].map((st) => [st, p(st)]).filter(([, b]) => b.length),
    name = { wrong: "wrong note", miss: "missed", late: "late", early: "early" },
    b = g.bias,
    biasText = Math.abs(b) < 15 ? "Right on the click." : b > 0 ? `You land about ${Math.round(b)} ms behind the click on average.` : `You land about ${Math.round(-b)} ms ahead of the click on average.`;
  return `<div class="rh-result sg-res"><div class="rh-acc">${Math.round(g.accuracy * 100)}% · ${c.ok} of ${n} notes right on time</div><p>${biasText}${g.extras.length ? ` ${g.extras.length} extra note${g.extras.length > 1 ? "s" : ""}.` : ""}</p>${spots.length ? `<p>${spots.map(([st, bs]) => `<b>${name[st]}</b> in bar ${bs.slice(0, 6).join(", ")}`).join(" · ")}</p>` : "<p>No trouble spots.</p>"}<div class="sg-key"><i class="res-ok">on time</i><i class="res-early">early</i><i class="res-late">late</i><i class="res-wrong">wrong note</i><i class="res-miss">missed</i></div></div>`;
}
/* put the marks on the notes after a redraw */
function paint(s) {
  if (res && res.song === s.id && S.songs.mode === "along" && !along)
    res.g.notes.forEach((x, i) => document.querySelectorAll(`[data-n="${i}"]`).forEach((e) => e.classList.add("res-" + x.state)));
  if (wait && wait.song === s.id && !wait.done) markNote(wait.i, false);
}
function markNote(i, scroll = true) {
  clearHot();
  hotEls = [...document.querySelectorAll(`[data-n="${i}"]`)];
  hotEls.forEach((e) => e.classList.add("hot"));
  const ln = lines[i];
  if (scroll && ln !== lastLine) {
    lastLine = ln;
    const el = document.querySelector(`.sg-sys[data-line="${ln}"]`);
    el && el.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }
}
const say = (t) => {
  const e = document.getElementById("sg-say");
  if (e) e.textContent = t;
};
function onWait(e) {
  if (!wait || wait.done || performance.now() < wait.quietUntil) return;
  const s = byId[wait.song],
    r = waitStep(e, s.sounding[wait.i].midi, ctx.sampleRate);
  if (r === "wrong") {
    wait.wrong++;
    wait.msg = `Heard ${NAMES[e.m % 12]}: not quite.`;
  } else if (r === "hit") {
    wait.msg = "";
    wait.i++;
    if (wait.i >= s.sounding.length) {
      wait.done = true;
      clearHot();
    } else markNote(wait.i);
  } else return;
  say(waitSay(s));
}
async function startListening(s) {
  if (!listen.on && !(await listenStart())) return render();
  lines = lineOf(s, width(), s.words !== undefined && S.songs.lyrics && S.songs.view !== "tab");
  lastLine = -1;
  res = null;
  if (S.songs.mode === "wait") {
    wait = { song: s.id, i: 0, wrong: 0, msg: "", done: false, quietUntil: 0, off: onNote(onWait) };
    return render();
  }
  const P = S.songs;
  along = { song: s.id, heard: [], clock: null };
  along.off = onNote((e) => along && along.heard.push(e));
  const h = hooks(s);
  songStart(s, { ...P, click: P.click && S.listen.phones, clickIn: true, notes: false, countIn: true, loop: false }, {
    ...h,
    started: () => {
      if (along) along.clock = songClock(s);
      render();
    },
    end: () => finishAlong(s),
  });
  render();
}
function finishAlong(s) {
  songStop();
  clearHot();
  const a = along;
  along = null;
  if (a) {
    a.off();
    if (a.clock) {
      const beatSec = 60 / (s.tempo * (S.songs.pct / 100)),
        from = a.clock.due[0] - Math.min(0.3, beatSec * 0.45),
        heard = a.heard.filter((e) => e.t >= from),
        exp = a.clock.due.map((t, i) => ({ t, m: s.sounding[i].midi }));
      res = { song: s.id, g: gradeRun(exp, heard, { sr: ctx.sampleRate }) };
    }
  }
  if (S.songs.cur === s.id && document.querySelector("#sg-wrap")) render();
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
  if (along) (along.off(), (along = null));
  if (wait) (wait.off(), (wait = null));
  if (!songBusy()) return;
  songStop();
  clearHot();
}
function togglePlay() {
  const s = byId[S.songs.cur];
  if (!s) return;
  if (songBusy() || wait) {
    stopSongs();
    return render();
  }
  if (S.songs.mode !== "hear") return startListening(s);
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
  if (k === "hearNote") {
    if (wait && !wait.done) {
      wait.quietUntil = performance.now() + 1200; // the microphone must not take the app's own note for the player's
      tone(byId[wait.song].sounding[wait.i].midi - 12, ctx.currentTime + 0.02, 0.9, 0.3, "triangle", true);
    }
    return;
  }
  stopSongs();
  if (k === "mode" || k === "pct") res = null;
  if (k === "back") P.cur = null;
  else if (k === "view") P.view = v;
  else if (k === "mode") P.mode = ["hear", "along", "wait"].includes(v) ? v : "hear";
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
    res = null;
    save();
    render();
    window.scrollTo(0, 0);
  });
  action("sp", (D) => change(D.sp, D.v));
  on("listen-stopped", () => {
    if (along || wait) (stopSongs(), render()); // no microphone, nothing to listen with
  });
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
export const songsActive = () => songBusy() || !!wait;

/* For the browser tests (reached through ?debug). */
export const songsDebug = () => ({ res, along, wait });
