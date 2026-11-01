/* The Songs tab: a searchable library of public-domain music graded by level, generated exercises, and a player that
   shows each piece as sheet music and tab and plays it along with a click. */
import { S, save } from "../core/store.js";
import { action, on, render, screen } from "../core/bus.js";
import { app } from "../core/dom.js";
import { header } from "../view/chrome.js";
import { SONGS } from "./data.js";
import { build, keyLabel } from "./format.js";
import { tabify } from "./tabify.js";
import { followPlan, followTop, ribbon, ribbonX, songSvg } from "./draw.js";
import { songBusy, songClock, songRunning, songStart, songStop } from "./player.js";
import { gradeRun, waitStep } from "./grade.js";
import { libraryRows, loadIndex, loadTune } from "./library.js";
import { PATTERNS, POSITIONS, PROGRESSIONS, RHYTHMS, SCALES, SHAPES, STYLES, exerciseById } from "./exercises.js";
import { KEYS, pretty } from "../library/catalog.js";
import { NAMES } from "../core/theory.js";
import { stringOffsets } from "../core/pitch.js";
import { ctx, tone } from "../core/audio.js";
import { listen, listenStart, onNote } from "../core/listen-io.js";
import { listenPanel } from "../core/listen-ui.js";

const OWN = SONGS.map(build),
  byId = Object.fromEntries(OWN.map((s) => [s.id, s])),
  tabs = {};
const tabFor = (s) => (tabs[s.id] ||= tabify(s));
const shiftOf = (s, i) => stringOffsets(S.tuning)[tabFor(s)[i][0]]; // how far off the string playing note i is
export const LEVEL_NAMES = {
  1: "Level 1 · First position, simple rhythms",
  2: "Level 2 · Pick-ups and dotted rhythms",
  3: "Level 3 · Faster notes and string crossing",
  4: "Level 4 · Fiddle-tune speed, wider range",
  5: "Level 5 · Up the neck, busy rhythms",
  6: "Level 6 · Concert pieces and hard reels",
};
const STYLE_TABS = [
    ["all", "All"],
    ["classical", "Classical"],
    ["folk", "Folk"],
    ["air", "Airs"],
    ["reel", "Reels"],
    ["jig", "Jigs"],
    ["hornpipe", "Hornpipes"],
    ["dance", "Dances"],
    ["beginner", "First tunes"],
    ["exercise", "Exercises"],
  ],
  IN_STYLE = { folk: ["folk", "waltz"], dance: ["dance", "waltz"] },
  PAGE = 60;
const VIEWS = [["staff", "Sheet music"], ["tab", "Tab"], ["both", "Both"]],
  SCROLLS = [["lines", "Page"], ["lane", "Lane"]],
  SPEEDS = [50, 75, 90, 100],
  MODES = [["hear", "Hear it"], ["along", "Play along"], ["wait", "Wait for me"]],
  LANE_AT = 0.22, // how far across the view the lane stands: most of the width is what's coming
  HOLD_OFF_MS = 3500; // after the player scrolls by hand, leave the view alone this long

const EX_DEFAULT = { kind: "scale", tonic: "G", scale: "major", pattern: "straight", pos: 2, rhythm: "e", prog: "I-IV-V-I", shape: "open", style: "block", beats: 4, tempo: 72 };

export function sanitizeSongs() {
  const p = S.songs && typeof S.songs === "object" ? S.songs : {},
    ok = (v, a, d) => (a.includes(v) ? v : d),
    done = {},
    isId = (id) => typeof id === "string" && id.length < 90,
    x = p.ex && typeof p.ex === "object" ? p.ex : {};
  // the library loads later, so a tune's id can't be looked up yet; one that has gone is dropped when opened
  if (p.done && typeof p.done === "object") for (const id of Object.keys(p.done)) if (isId(id) && p.done[id]) done[id] = 1;
  S.songs = {
    cur: isId(p.cur) ? p.cur : null,
    view: ok(p.view, ["staff", "tab", "both"], "both"),
    scroll: ok(p.scroll, ["lines", "lane"], "lines"),
    mode: ok(p.mode, ["hear", "along", "wait"], "hear"),
    pct: ok(p.pct, SPEEDS, 100),
    click: p.click !== false,
    notes: p.notes !== false,
    countIn: p.countIn !== false,
    loop: p.loop === true,
    lyrics: p.lyrics !== false,
    done,
    style: ok(p.style, STYLE_TABS.map((t) => t[0]), "all"),
    level: ok(p.level, [0, 1, 2, 3, 4, 5, 6], 0),
    ex: {
      kind: ok(x.kind, ["scale", "chord"], EX_DEFAULT.kind),
      tonic: ok(x.tonic, KEYS, EX_DEFAULT.tonic),
      scale: ok(x.scale, Object.keys(SCALES), EX_DEFAULT.scale),
      pattern: ok(x.pattern, Object.keys(PATTERNS), EX_DEFAULT.pattern),
      pos: ok(x.pos, POSITIONS, EX_DEFAULT.pos),
      rhythm: ok(x.rhythm, Object.keys(RHYTHMS), EX_DEFAULT.rhythm),
      prog: ok(x.prog, Object.keys(PROGRESSIONS), EX_DEFAULT.prog),
      shape: ok(x.shape, Object.keys(SHAPES), EX_DEFAULT.shape),
      style: ok(x.style, Object.keys(STYLES), EX_DEFAULT.style),
      beats: ok(x.beats, [1, 2, 4], EX_DEFAULT.beats),
      tempo: ok(x.tempo, [50, 60, 72, 88, 104, 120], EX_DEFAULT.tempo),
    },
  };
}

const seg = (key, opts, val) =>
  `<div class="seg">${opts.map(([v, l]) => `<button data-sp="${key}" data-v="${v}" class="${String(val) === String(v) ? "on" : ""}">${l}</button>`).join("")}</div>`;
const tog = (key, label, on) => `<button data-sp="${key}" class="${on ? "a" : ""}" aria-pressed="${on}">${label}</button>`;
const meta = (s) => `${keyLabel(s.key)} · ${s.time} · tempo ${s.tempo}`;
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/* ----- the list ----- */
let shown = PAGE,
  query = "",
  indexFailed = false;
const ownRows = () => SONGS.map((s) => ({ id: s.id, title: s.title, by: s.by, style: s.style, level: s.level, key: s.key, time: s.time, tempo: s.tempo, tags: s.tags }));
const allRows = () => [...ownRows(), ...(libraryRows() || [])];

function matching() {
  const P = S.songs,
    words = query.toLowerCase().split(/\s+/).filter(Boolean),
    styles = IN_STYLE[P.style] || [P.style];
  return allRows().filter((r) => {
    if (P.style !== "all" && !styles.includes(r.style)) return false;
    if (P.level && r.level !== P.level) return false;
    const text = `${r.title} ${r.by}`.toLowerCase();
    return words.every((w) => text.includes(w));
  });
}
const item = (r) => `<button class="sg-item" data-song-open="${esc(r.id)}"><span class="sg-t1">${S.songs.done[r.id] ? "✓ " : ""}${esc(r.title)}</span>
        <span class="sg-t2">${esc(r.by)} · ${meta(r)}</span><span class="sg-tags"><i>Level ${r.level}</i>${(r.tags || []).map((t) => `<i>${esc(t)}</i>`).join("")}</span></button>`;

function results() {
  // within a level, the well-known songs that ship with the app come before the imported collections
  const found = matching().sort((a, b) => a.level - b.level || (a.chunk !== undefined) - (b.chunk !== undefined) || a.title.localeCompare(b.title)),
    head = !libraryRows() && !indexFailed ? "Loading the library…" : `${found.length} piece${found.length === 1 ? "" : "s"}`,
    more = found.length > shown ? `<button class="rs" data-sl="more">Show more</button>` : "";
  return `<p class="pr-sub" role="status">${head}${indexFailed ? " (the full library needs a connection the first time)" : ""}</p><div class="sg-list">${found.slice(0, shown).map(item).join("")}</div>${more}`;
}

const chipRow = (key, opts, val, cls = "") =>
  `<div class="chips pr-opts ${cls}">${opts.map(([v, l]) => `<button data-sl="${key}" data-v="${v}" class="${String(val) === String(v) ? "a" : ""}" aria-pressed="${String(val) === String(v)}">${l}</button>`).join("")}</div>`;
const pairs = (o, f = (x) => x.name) => Object.entries(o).map(([k, v]) => [k, f(v)]);
const exId = (x) =>
  x.kind === "scale"
    ? `ex:s:${x.tonic}:${x.scale}:${x.pattern}:${x.pos}:${x.rhythm}:${x.tempo}`
    : `ex:c:${x.tonic}:${x.prog}:${x.shape}:${x.style}:${x.beats}:${x.tempo}`;

function exercisePanel() {
  const x = S.songs.ex,
    keys = KEYS.map((k) => [k, pretty(k)]);
  let h = `<div class="sg-ex">${chipRow("kind", [["scale", "Scales"], ["chord", "Chord changes"]], x.kind)}<h3 class="sg-lv">Key</h3>${chipRow("tonic", keys, x.tonic)}`;
  if (x.kind === "scale")
    h += `<h3 class="sg-lv">Scale</h3>${chipRow("scale", pairs(SCALES), x.scale)}<h3 class="sg-lv">Pattern</h3>${chipRow("pattern", pairs(PATTERNS), x.pattern)}<h3 class="sg-lv">Hand position</h3>${chipRow("pos", POSITIONS.map((p) => [p, p ? `Fret ${p}` : "Open"]), x.pos)}<h3 class="sg-lv">Rhythm</h3>${chipRow("rhythm", pairs(RHYTHMS), x.rhythm)}`;
  else
    h += `<h3 class="sg-lv">Changes</h3>${chipRow("prog", pairs(PROGRESSIONS), x.prog)}<h3 class="sg-lv">Shapes</h3>${chipRow("shape", Object.entries(SHAPES), x.shape)}<h3 class="sg-lv">Right hand</h3>${chipRow("style", Object.entries(STYLES), x.style)}<h3 class="sg-lv">How often it changes</h3>${chipRow("beats", [[4, "Every bar"], [2, "Twice a bar"], [1, "Every beat"]], x.beats)}`;
  return `${h}<h3 class="sg-lv">Tempo</h3>${chipRow("tempo", [50, 60, 72, 88, 104, 120].map((t) => [t, t]), x.tempo)}<button class="go" data-song-open="${exId(x)}">▶ Open this exercise</button></div>`;
}

function renderList() {
  const P = S.songs,
    done = Object.keys(P.done).length;
  let h = `${header()}<div class="card prac"><div class="tag">SONGS</div><h2>Music to work through</h2>
    <p class="pr-sub">${done} learned. Public-domain classical, folk and fiddle music with sheet music and tab, plus scale and chord exercises made to order.</p>
    ${chipRow("style", STYLE_TABS, P.style, "sg-styles")}`;
  if (P.style === "exercise") h += exercisePanel();
  else
    h += `<input id="sg-q" class="sg-q" type="search" placeholder="Search by title or composer" aria-label="Search the library" value="${esc(query)}" />${chipRow("level", [[0, "Any level"], ...[1, 2, 3, 4, 5, 6].map((l) => [l, l])], P.level)}${P.level ? `<p class="pr-sub">${LEVEL_NAMES[P.level]}</p>` : ""}<div id="sg-results">${results()}</div>`;
  app.innerHTML = h + `<small>Everything here is public domain: the composers died long ago, or the tune is traditional. Sources are credited on each piece. Tabs are chosen by the program, so if a fingering feels awkward, trust your hand.</small></div>`;
  if (!libraryRows() && !indexFailed)
    loadIndex()
      .then(() => S.songs.cur || refresh())
      .catch(() => {
        indexFailed = true;
        S.songs.cur || refresh();
      });
}
function refresh() {
  const e = document.getElementById("sg-results");
  if (e) e.innerHTML = results();
}

/* ----- the player ----- */
const width = () => Math.max(280, Math.min(760, Math.floor(app.clientWidth - 58)));
const words = (s) => s.words !== undefined && S.songs.lyrics;
let lane = null, // the piece as one line: from ribbon(), and whose it is
  opening = null; // a tune being fetched

/* The song for the current id: at once if it is here, otherwise fetched and drawn when it arrives. */
function current() {
  const id = S.songs.cur;
  if (byId[id]) return byId[id];
  const ex = exerciseById(id);
  if (ex) return (byId[id] = build(ex));
  if (opening !== id) {
    opening = id;
    loadTune(id)
      .then((d) => {
        opening = null;
        if (d) byId[id] = build(d);
        else if (S.songs.cur === id) S.songs.cur = null;
      })
      .catch(() => {
        opening = null;
        if (S.songs.cur === id) S.songs.cur = null;
      })
      .finally(() => render());
  }
  return null;
}

function scoreHtml(s) {
  const P = S.songs,
    lyrics = words(s);
  if (P.scroll !== "lane") {
    lane = null;
    return `<div class="sg-wrap" id="sg-wrap">${songSvg(s, tabFor(s), { width: width(), view: P.view, lyrics })}</div>`;
  }
  lane = { song: s.id, ...ribbon(s, tabFor(s), { view: P.view, lyrics }) };
  return `<div class="sg-lane" id="sg-lane"><div class="sg-track" id="sg-track" style="width:${lane.width}px">${lane.svg}</div><i class="sg-hit" aria-hidden="true"></i></div>`;
}

function renderPlayer() {
  const s = current(),
    P = S.songs;
  if (!s) {
    app.innerHTML = `${header()}<div class="card prac"><p class="pr-sub" role="status">Loading…</p><button class="tg" data-sp="back">← All songs</button></div>`;
    return;
  }
  const run = songRunning(),
    mode = P.mode,
    beats = Array.from({ length: Math.round(s.bar / s.beat) }, (_, b) => `<span class="bd" data-b="${b}">${b + 1}</span>`).join(""),
    hasWords = s.words !== undefined;
  app.innerHTML = `${header()}<div class="card prac">
    <div class="pr-now"><div><h2>${esc(s.title)}</h2><p class="pr-sub">${esc(s.by)} · ${meta(s)}</p></div><button class="tg" data-sp="back">← All songs</button></div>
    ${seg("view", VIEWS, P.view)}${seg("scroll", SCROLLS, P.scroll)}${seg("mode", MODES, mode)}
    ${scoreHtml(s)}
    <div class="beats" aria-label="Beat">${beats}</div>
    ${mode === "hear" ? "" : modeBlock(s)}
    <div class="pr-ctl">
      <button class="go pr-play" data-sp="play">${run || wait ? "■ Stop" : songBusy() ? "…" : mode === "hear" ? "▶ Play" : mode === "along" ? "▶ Start (count-in, then play)" : "▶ Start"}</button>
      <div class="chips pr-opts">${SPEEDS.map((v) => `<button data-sp="pct" data-v="${v}" class="${P.pct === v ? "a" : ""}">${v}%</button>`).join("")}</div>
    </div>
    <small class="sg-bpm">${Math.round((s.tempo * P.pct) / 100)} beats per minute</small>
    <div class="chips pr-opts">${tog("click", "🕒 Click", P.click)}${tog("notes", "🔊 Notes", P.notes)}${tog("countIn", "1-bar count-in", P.countIn)}${tog("loop", "🔁 Loop", P.loop)}${hasWords ? tog("lyrics", "Words", P.lyrics) : ""}${s.style === "exercise" ? "" : tog("done", P.done[s.id] ? "✓ Learned" : "Mark as learned", !!P.done[s.id])}</div>
    <small>${esc(s.source)}${s.reviewed ? "" : " The tab was chosen by the program and has not been checked by hand yet: if a fingering feels awkward, trust your hand."} Space starts and stops.</small>
  </div>`;
  paint(s);
}

/* ----- following the music ----- */
let plan = [], // per note: { line, late }
  lineTop = -1,
  handUntil = 0,
  laneFrame = 0;

function followStart(s) {
  plan = followPlan(s, width(), words(s) && S.songs.view !== "tab");
  lineTop = -1;
  handUntil = 0;
  const box = document.getElementById(S.songs.scroll === "lane" ? "sg-lane" : "sg-wrap");
  if (!box) return;
  box.classList.add("following");
  box.scrollIntoView({ block: "start", behavior: "smooth" }); // once: from here on only the score moves
  if (S.songs.scroll === "lane") laneRun(s);
}
function followEnd() {
  cancelAnimationFrame(laneFrame);
  laneFrame = 0;
  const box = document.getElementById("sg-wrap") || document.getElementById("sg-lane");
  if (box) box.classList.remove("following");
  document.querySelectorAll(".sg-sys.played").forEach((e) => e.classList.remove("played"));
}
/* Page view: keep the playing line high in the box with what's coming below it. */
function followLine(i, smooth = true) {
  const box = document.getElementById("sg-wrap"),
    p = plan[i];
  if (!box || !p || performance.now() < handUntil) return;
  const sys = [...box.querySelectorAll(".sg-sys")],
    top = followTop(sys.map((e) => e.offsetTop - box.offsetTop), sys.map((e) => e.offsetHeight), box.clientHeight, p.line, p.late);
  sys.forEach((e, n) => e.classList.toggle("played", n < p.line));
  if (top === lineTop) return;
  lineTop = top;
  box.scrollTo({ top, behavior: smooth ? "smooth" : "auto" });
}
/* Lane view: the line slides under a lane that stands still. */
function lanePlace(px) {
  const t = document.getElementById("sg-track"),
    box = document.getElementById("sg-lane");
  if (t && box) t.style.transform = `translate3d(${Math.round(box.clientWidth * LANE_AT - px)}px,0,0)`;
}
function laneRun(s) {
  cancelAnimationFrame(laneFrame);
  const frame = () => {
    const c = lane && songClock(s);
    if (c) {
      let u = (ctx.currentTime - c.c0) / c.usec;
      if (S.songs.loop && u > 0) u %= s.total;
      lanePlace(ribbonX(lane, u));
    }
    laneFrame = requestAnimationFrame(frame);
  };
  laneFrame = requestAnimationFrame(frame);
}
function laneTo(i) {
  const t = document.getElementById("sg-track");
  if (t) t.classList.add("glide");
  if (lane) lanePlace(lane.xs[i]);
}

/* ----- listening: "Play along" (graded against the click) and "Wait for me" (the song waits for each note) ----- */
let along = null, // a play-along in progress: { song, heard, off, clock }
  res = null, // the last play-along's result: { song, g }
  wait = null; // wait-for-me in progress: { song, i, wrong, off, msg, done, quietUntil }
const bar = (s, i) => (s.pickup ? s.sounding[i].bar || "pick-up" : s.sounding[i].bar + 1);
const allOf = (n) => n.pitches.map((p) => p.midi);

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
  if (lane && !songBusy() && !wait) lanePlace(lane.xs[0] || 0);
  if (wait && wait.song === s.id && !wait.done) {
    markNote(wait.i);
    S.songs.scroll === "lane" ? laneTo(wait.i) : followLine(wait.i, false);
  }
}
function markNote(i) {
  clearHot();
  hotEls = [...document.querySelectorAll(`[data-n="${i}"]`)];
  hotEls.forEach((e) => e.classList.add("hot"));
}
const say = (t) => {
  const e = document.getElementById("sg-say");
  if (e) e.textContent = t;
};
function onWait(e) {
  if (!wait || wait.done || performance.now() < wait.quietUntil) return;
  const s = byId[wait.song],
    n = s.sounding[wait.i],
    r = waitStep(e, n.midi, ctx.sampleRate, shiftOf(s, wait.i), allOf(n));
  if (r === "wrong") {
    wait.wrong++;
    wait.msg = `Heard ${NAMES[e.m % 12]}: not quite.`;
  } else if (r === "hit") {
    wait.msg = "";
    wait.i++;
    if (wait.i >= s.sounding.length) {
      wait.done = true;
      clearHot();
      followEnd();
    } else {
      markNote(wait.i);
      S.songs.scroll === "lane" ? laneTo(wait.i) : followLine(wait.i);
    }
  } else return;
  say(waitSay(s));
}
async function startListening(s) {
  if (!listen.on && !(await listenStart())) return render();
  res = null;
  if (S.songs.mode === "wait") {
    wait = { song: s.id, i: 0, wrong: 0, msg: "", done: false, quietUntil: 0, off: onNote(onWait) };
    render();
    return followStart(s);
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
      followStart(s);
    },
    end: () => finishAlong(s),
  });
  render();
}
function finishAlong(s) {
  songStop();
  clearHot();
  followEnd();
  const a = along;
  along = null;
  if (a) {
    a.off();
    if (a.clock) {
      const beatSec = 60 / (s.tempo * (S.songs.pct / 100)),
        from = a.clock.due[0] - Math.min(0.3, beatSec * 0.45),
        heard = a.heard.filter((e) => e.t >= from),
        exp = a.clock.due.map((t, i) => ({ t, m: s.sounding[i].midi, ms: allOf(s.sounding[i]), shift: shiftOf(s, i) }));
      res = { song: s.id, g: gradeRun(exp, heard, { sr: ctx.sampleRate }) };
    }
  }
  if (S.songs.cur === s.id && (document.querySelector("#sg-wrap") || document.querySelector("#sg-lane"))) render();
}

/* ----- playing ----- */
let hotEls = [];
function clearHot() {
  hotEls.forEach((e) => e.classList.remove("hot"));
  hotEls = [];
}
const hooks = (s) => ({
  note(i) {
    markNote(i);
    if (S.songs.scroll === "lines") followLine(i);
  },
  beat(b) {
    document.querySelectorAll(".bd").forEach((e) => e.classList.toggle("on", +e.dataset.b === b));
  },
  started: () => {
    render();
    followStart(s);
  },
  end: () => {
    songStop();
    clearHot();
    followEnd();
    if (S.songs.cur === s.id && (document.querySelector("#sg-wrap") || document.querySelector("#sg-lane"))) render();
  },
});
export function stopSongs() {
  if (along) (along.off(), (along = null));
  if (wait) (wait.off(), (wait = null));
  followEnd();
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
      byId[wait.song].sounding[wait.i].pitches.forEach((p) => tone(p.midi - 12, ctx.currentTime + 0.02, 0.9, 0.3, "triangle", true));
    }
    return;
  }
  stopSongs();
  if (k === "mode" || k === "pct") res = null;
  if (k === "back") P.cur = null;
  else if (k === "view") P.view = v;
  else if (k === "scroll") P.scroll = v;
  else if (k === "mode") P.mode = ["hear", "along", "wait"].includes(v) ? v : "hear";
  else if (k === "pct") P.pct = +v;
  else if (k === "done") P.done[P.cur] ? delete P.done[P.cur] : (P.done[P.cur] = 1);
  else if (["click", "notes", "countIn", "loop", "lyrics"].includes(k)) P[k] = !P[k];
  save();
  render();
}

/* the list's filters and the exercise builder */
function pick(k, v) {
  const P = S.songs;
  if (k === "more") {
    shown += PAGE;
    return refresh();
  }
  shown = PAGE;
  if (k === "style") P.style = v;
  else if (k === "level") P.level = +v;
  else if (["pos", "beats", "tempo"].includes(k)) P.ex[k] = +v;
  else P.ex[k] = v;
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
  action("sl", (D) => pick(D.sl, D.v));
  app.addEventListener("input", (e) => {
    if (e.target.id !== "sg-q") return;
    query = e.target.value;
    shown = PAGE;
    refresh();
  });
  // scrolling by hand takes over from following for a moment
  for (const ev of ["wheel", "touchmove"])
    app.addEventListener(ev, (e) => {
      if (e.target.closest && e.target.closest("#sg-wrap")) handUntil = performance.now() + HOLD_OFF_MS;
    }, { passive: true });
  on("listen-stopped", () => {
    if (along || wait) (stopSongs(), render()); // no microphone, nothing to listen with
  });
  // redraw when the screen turns (the lines are laid out for the width)
  let t = 0,
    w = innerWidth;
  addEventListener("resize", () => {
    clearTimeout(t);
    t = setTimeout(() => {
      if (innerWidth === w || !(document.querySelector("#sg-wrap") || document.querySelector("#sg-lane")) || songBusy()) return (w = innerWidth);
      w = innerWidth;
      render();
    }, 150);
  });
}
export const songsActive = () => songBusy() || !!wait;

/* For the browser tests (reached through ?debug). */
export const songsDebug = () => ({ res, along, wait });
