/* The Songs tab: a searchable library of public-domain music graded by level, generated exercises, and a player that
   shows each piece as sheet music and tab and plays it along with a click. */
import { S, save, ui } from "../core/store.js";
import { action, on, render, screen } from "../core/bus.js";
import { app } from "../core/dom.js";
import { header } from "../view/chrome.js";
import { SONGS } from "./data.js";
import { build, keyLabel } from "./format.js";
import { GUITAR_PATH, PASS_MARK, PATH_SONGS, coachPlan, formOf, freshNotes, lessonsIn, notesPerSecond, sliceDef, speedWord, starsFor } from "./path.js";
import { LIMITS, demandsOf } from "./demands.js";
import { chordChart } from "./harmony.js";
import { chartFor, chordId, chordPlan, chordSong, shapeOf } from "./changes.js";
import { boxView } from "../library/draw.js";
import { SKILLS } from "./moments-data.js";
import { recordSong } from "../courses/progress.js";
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
    ["path", "Learning path"],
    ["all", "All music"],
    ["classical", "Classical"],
    ["folk", "Folk"],
    ["skills", "Skills"],
    ["song", "Art songs"],
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

/* How far each piece has been learned: { n: steps finished, stars, lesson: the one you're on, lessons: how many there are } */
function tidyLearn(raw, isId) {
  const out = {};
  if (raw && typeof raw === "object")
    for (const [id, v] of Object.entries(raw)) if (isId(id) && v && Number.isFinite(v.n)) out[id] = { n: Math.max(0, v.n | 0), stars: Math.max(0, Math.min(3, v.stars | 0)), lesson: Math.max(0, v.lesson | 0), lessons: Math.max(0, v.lessons | 0) };
  return out;
}

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
    names: p.names === true,
    done,
    style: ok(p.style, STYLE_TABS.map((t) => t[0]), "path"),
    learn: tidyLearn(p.learn, isId),
    level: ok(p.level, [0, 1, 2, 3, 4, 5, 6], 0),
    speed: ok(p.speed, ["", "Slow", "Moderate", "Fast"], ""),
    skill: ok(p.skill, SKILLS.map((k) => k.id), SKILLS[0].id),
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
const meta = (s) => `${keyLabel(s.key)} · ${s.time} · ${s.tempo} bpm`;
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`);

/* ----- the list ----- */
let shown = PAGE,
  query = "",
  indexFailed = false;
const ownLevel = (s) => (s.graded ??= demandsOf(s, tabify(s, 6), freshNotes(s)));
const ownRows = () => OWN.map((s) => ({ id: s.id, title: s.title, by: s.by, style: s.style, level: s.style === "exercise" ? s.level : ownLevel(s).level, limit: s.style === "exercise" ? "" : ownLevel(s).limit, key: s.key, time: s.time, tempo: s.tempo, tags: s.tags, nps: notesPerSecond(s) }));
const allRows = () => [...ownRows(), ...(libraryRows() || [])];

function matching() {
  const P = S.songs,
    words = query.toLowerCase().split(/\s+/).filter(Boolean),
    styles = IN_STYLE[P.style] || [P.style];
  return allRows().filter((r) => {
    if (P.style !== "all" && !styles.includes(r.style)) return false;
    if (P.level && r.level !== P.level) return false;
    if (P.speed && speedWord(r.nps) !== P.speed) return false;
    const text = `${r.title} ${r.by}`.toLowerCase();
    return words.every((w) => text.includes(w));
  });
}
function skillsHtml() {
  const on = SKILLS.find((k) => k.id === S.songs.skill),
    row = (x) => `<button class="sp-song" data-song-open="${esc(x.id)}"><span class="sp-t">${esc(x.title)}</span><small>${esc(x.by)} · bars ${x.bars}</small><span class="sp-s">Level ${x.level}</span></button>`;
  return `${chipRow("skill", SKILLS.map((k) => [k.id, k.name]), on.id)}<section class="sp-stage"><header><div><h3>${on.name}</h3><p>${on.blurb} Each drill is a phrase from a real piece, easiest first.</p></div></header><div class="sp-list">${on.items.map(row).join("")}</div></section>`;
}
const item = (r) => `<button class="sg-item" data-song-open="${esc(r.id)}"><span class="sg-t1">${S.songs.done[r.id] ? "✓ " : ""}${esc(r.title)}</span>
        <span class="sg-t2">${esc(r.by)} · ${meta(r)}</span><span class="sg-tags"><i>Level ${r.level}</i>${LIMITS[r.limit] ? `<i>${LIMITS[r.limit]}</i>` : ""}${r.nps ? `<i>${speedWord(r.nps)}</i>` : ""}${(r.tags || []).map((t) => `<i>${esc(t)}</i>`).join("")}</span></button>`;

function results() {
  // within a level, the well-known songs that ship with the app come before the imported collections
  const found = matching().sort((a, b) => a.level - b.level || (a.chunk !== undefined) - (b.chunk !== undefined) || (a.h || 0) - (b.h || 0)),
    head = !libraryRows() && !indexFailed ? "Loading the library…" : `${found.length} piece${found.length === 1 ? "" : "s"}`,
    more = found.length > shown ? `<button class="rs" data-sl="more">Show more</button>` : "";
  return `<p class="pr-sub" role="status">${head}${indexFailed ? " (the full library needs a connection the first time)" : ""}</p>${[1, 2, 3, 4, 5, 6].map((lv) => { const part = found.slice(0, shown).filter((r) => r.level === lv); return part.length ? `<h3 class="sg-lv">${LEVEL_NAMES[lv]}</h3><div class="sg-list">${part.map(item).join("")}</div>` : ""; }).join("")}${more}`;
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

const learned = (id) => (S.songs.learn[id] || {}).stars > 0 || !!S.songs.done[id];
const drillRow = (course) => {
  const here = SKILLS.filter((k) => k.course === course);
  return here.length ? `<div class="sp-drills"><small>Skills for this stage</small>${here.map((k) => `<button data-sl="openskill" data-v="${k.id}">${k.name}</button>`).join("")}</div>` : "";
};
function pathHtml() {
  const stages = GUITAR_PATH.map((st, k) => {
    const got = st.songs.filter((x) => learned(x.id)).length,
      rows = st.songs
        .map((x) => {
          const L = S.songs.learn[x.id],
            adds = (x.adds || []).length ? `New: ${x.adds.join(", ")}` : x.ch ? x.by : x.ex ? x.by : `${x.by} · play it in`;
          return `<button class="sp-song${learned(x.id) ? " done" : ""}${x.ch ? " ch" : ""}" data-song-open="${esc(x.id)}"><span class="sp-t">${esc(x.title)}</span><small>${esc(adds)}</small><span class="sp-s">${L && L.stars ? "★".repeat(L.stars) + "☆".repeat(3 - L.stars) : L && L.lessons ? `Lesson ${L.lesson} of ${L.lessons}` : L && L.n ? "In progress" : x.ex ? "Exercise" : ""}</span></button>`;
        })
        .join("");
    return `<section class="sp-stage${got === st.songs.length ? " fin" : ""}"><header><span class="sp-n">${k + 1}</span><div><h3>${st.title}</h3><p>${st.blurb}</p></div><small>${got} / ${st.songs.length}</small></header><div class="sp-list">${rows}</div>${drillRow(st.course)}</section>`;
  }).join("");
  const next = PATH_SONGS.find((x) => !learned(x.id)),
    at = next && GUITAR_PATH.findIndex((st) => st.songs.some((x) => x.id === next.id)),
    hero = next ? `<div class="sp-next"><small>Next in your syllabus · stage ${at + 1}, ${esc(GUITAR_PATH[at].title)}</small><h3>${esc(next.title)}</h3><p>${(next.adds || []).length ? `Adds ${esc(next.adds.join(", "))}.` : "Plays in what you've just learned."}</p><button class="go" data-song-open="${esc(next.id)}">${S.songs.learn[next.id]?.n ? "Carry on" : "Start"}</button></div>` : "";
  return `${hero}<div class="sp-path">${stages}</div>`;
}

function renderList() {
  const P = S.songs,
    done = Object.keys(P.done).length;
  let h = `${header()}<div class="card prac"><div class="tag">SONGS</div><h2>Music to work through</h2>
    <p class="pr-sub">${done} learned. Each piece breaks into small parts you learn one at a time, from first notes to concert pieces.</p>
    ${chipRow("style", STYLE_TABS, P.style, "sg-styles")}`;
  if (P.style === "exercise") h += exercisePanel();
  else if (P.style === "path") h += pathHtml();
  else if (P.style === "skills") h += skillsHtml();
  else
    h += `<input id="sg-q" class="sg-q" type="search" placeholder="Search by title or composer" aria-label="Search the library" value="${esc(query)}" />${chipRow("level", [[0, "Any level"], ...[1, 2, 3, 4, 5, 6].map((l) => [l, l])], P.level)}${P.level ? `<p class="pr-sub">${LEVEL_NAMES[P.level]}</p>` : ""}${chipRow("speed", [["", "Any speed"], ["Slow", "Slow"], ["Moderate", "Moderate"], ["Fast", "Fast"]], P.speed)}<div id="sg-results">${results()}</div>`;
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

/* ----- learning a piece part by part ----- */
let coach = null; // { id, plan, i, passed, stars, done }
const opts = () => (coach && !coach.done ? { ...S.songs, mode: coach.plan[coach.i].mode, pct: coach.plan[coach.i].pct, loop: false } : S.songs);

/* What is on the stand now: the whole piece, or the bars of the current step (fingered as they are in the whole piece). */
function onStand(full) {
  if (!coach || coach.done) return full;
  const st = coach.plan[coach.i];
  if (st.def) return (byId[st.def.id] ||= build(st.def));
  if (st.from === 0 && st.to === full.barLens.length - 1) return full;
  const id = `${full.id}@${st.from}-${st.to}`;
  if (!byId[id]) {
    byId[id] = build(sliceDef(full, st.from, st.to));
    const first = full.sounding.findIndex((n) => n.bar >= st.from);
    tabs[id] = tabFor(full).slice(first, first + byId[id].sounding.length);
  }
  return byId[id];
}
/* From the start of a chosen lesson, or else where you left off. */
const planFor = (full) => (full.chart ? chordPlan(full) : coachPlan(full, full.style === "exercise" ? undefined : tabFor(full)));
function coachStart(full, lesson) {
  const plan = planFor(full),
    L = S.songs.learn[full.id] || {},
    n = lesson ? plan.findIndex((st) => st.lesson === lesson) : L.stars ? 0 : Math.min(L.n || 0, plan.length - 1);
  coach = { id: full.id, plan, i: Math.max(0, n), passed: false, done: false, rest: 0 };
  res = null;
  render();
}
function coachPass(score = 1) {
  if (!coach || coach.done) return;
  const st = coach.plan[coach.i],
    want = st.mode === "along" ? PASS_MARK : 0;
  coach.score = score;
  coach.passed = score >= want;
}
function coachNext(skipped) {
  const full = byId[coach.id],
    L = (S.songs.learn[coach.id] ||= { n: 0, stars: 0 }),
    last = coach.i === coach.plan.length - 1;
  L.n = Math.max(L.n, coach.i + 1);
  S.xp += skipped ? 0 : 3;
  res = null;
  if (last) {
    const stars = skipped ? 1 : starsFor(coach.score ?? 0);
    L.stars = Math.max(L.stars, stars);
    S.songs.done[coach.id] = 1;
    S.xp += 30 + stars * 10;
    recordSong(S.courses, coach.id, Math.round((coach.score ?? 0.7) * 100));
    coach.done = true;
    coach.stars = stars;
  } else {
    const { lesson: was, kind } = coach.plan[coach.i];
    coach.i++;
    coach.passed = false;
    coach.score = undefined;
    if (coach.plan[coach.i].lesson !== was && kind !== "prep") coach.rest = was; // a natural place to stop for today
  }
  const on = coach.plan[Math.min(L.n, coach.plan.length - 1)];
  L.lesson = on.lesson;
  L.lessons = on.lessons;
  save();
  render();
  document.getElementById("sg-coach")?.scrollIntoView({ block: "nearest" });
  return full;
}
/* The piece as a strip of parts, repeats dimmed, with the bars you're on now picked out. */
const formStrip = (full, st) => `<div class="sc-form" aria-hidden="true">${formOf(full).map((f) => `<span style="flex-grow:${f.bars}" class="${f.repeat ? "rep" : ""}${st && f.from <= st.to && f.to >= st.from ? " on" : ""}">${f.n || ""}</span>`).join("")}</div>`;

function lessonList(full, plan, L) {
  const lessons = lessonsIn(plan),
    reached = L ? L.n : 0,
    rows = lessons.map((x) => `<button class="sc-l${reached > x.last ? " done" : reached >= x.first ? " next" : ""}" data-sp="clesson" data-v="${x.n}"><span>${x.n}. ${x.name}</span><small>${reached > x.last ? "✓" : x.prep ? (full.chart ? "" : "warm-up") : `bars ${x.from + 1}–${x.to + 1}`}</small></button>`).join("");
  return `<details class="sc-lessons"${lessons.length <= 6 ? " open" : ""}><summary>${lessons.length} lessons</summary>${rows}</details>`;
}

/* Diagrams of the chords in play. */
function chordBoxes(full, names) {
  const { chart } = full;
  return `<div class="sc-boxes">${names.map((n) => {
    const sp = chart.spans.find((x) => x.name === n);
    return sp ? `<figure><figcaption>${esc(n)}</figcaption>${boxView(shapeOf(sp.root, sp.suf, chart.shapes).v)}</figure>` : "";
  }).join("")}</div>`;
}
/* Every tune has chords in it, even if nobody wrote them down. */
function suggested(full) {
  if (full.id.includes("@") || full.style === "exercise" || full.sounding.filter((n) => n.pitches.length > 1).length > full.sounding.length * 0.2) return "";
  const c = chartFor(full);
  return c.names.length < 2 ? "" : `<p class="sc-ch">Chords for this tune: <b>${c.names.map(esc).join(" ")}</b> <button class="rs" data-song-open="ch:${esc(full.id)}">Learn the chords</button></p>`;
}

function coachBar(full) {
  if (coach && coach.rest) {
    const next = coach.plan[coach.i];
    return `<div class="sc-card" id="sg-coach"><div class="sc-top"><span>Lesson ${coach.rest} of ${next.lessons} finished</span><button class="ln-x" data-sp="cquit" aria-label="Stop learning">✕</button></div>${formStrip(full, { from: 0, to: Math.max(...coach.plan.slice(0, coach.i).map((st) => st.to)) })}<h3>Good place to stop</h3><p>Practice sticks better spread over a few days, and the next lesson opens by warming this one up. Or carry on now.</p><div class="sc-acts"><button class="go" data-sp="cgo">Next: ${next.lessonName} →</button></div></div>`;
  }
  if (coach && coach.done)
    return `<div class="sc-card" id="sg-coach"><div class="sc-stars">${"★".repeat(coach.stars)}${"☆".repeat(3 - coach.stars)}</div><h3>You learned ${esc(full.title)}</h3><p>Come back to it next week and it will still be yours.</p><button class="go" data-sp="cquit">Back to the path</button></div>`;
  if (full.id.includes("@")) return `<div class="sc-card" id="sg-coach"><p>A short drill from this piece. Loop it slowly, then bring it up to speed.</p><button class="go alt" data-song-open="${esc(full.id.split("@")[0])}">Open the whole piece</button></div>`;
  if (!coach) {
    const L = S.songs.learn[full.id],
      plan = planFor(full),
      { parts, lessons } = plan[0],
      fresh = L && L.n && !L.stars,
      intro = full.chart ? `${full.chart.names.length} chords and ${full.chart.moves} changes. Drill the changes this song uses, then play it with the tune.${full.chart.capo ? ` Played in ${full.chart.key} for easy shapes. A capo at fret ${full.chart.capo} matches the original key.` : ""} These chords are suggested from the melody.` : `${parts > 1 ? `${parts} phrases to learn, in ${lessons} short lessons` : "Learn it step by step"}. Each one builds on the last until you can play the whole piece.`;
    return `<div class="sc-card" id="sg-coach"><p>${intro}${L && L.stars ? ` Your best: ${"★".repeat(L.stars)}` : ""}</p>${full.chart ? chordBoxes(full, full.chart.names) : formStrip(full)}${fresh ? `<div class="ln-bar"><i style="width:${(100 * L.n) / plan.length}%"></i></div>` : ""}<button class="go" data-sp="cstart">${L && L.stars ? "Learn it again" : fresh ? "Carry on learning" : "Start lesson 1"}</button>${lessonList(full, plan, L)}${full.chart ? "" : suggested(full)}</div>`;
  }
  const st = coach.plan[coach.i],
    span = lessonsIn(coach.plan).find((x) => x.n === st.lesson),
    where = `Lesson ${st.lesson} of ${st.lessons} · ${st.lessonName}`,
    pct = st.mode === "along" && coach.score !== undefined ? ` ${Math.round(coach.score * 100)}%` : "",
    note = coach.passed ? `<b class="good">${st.mode === "along" ? `Nice.${pct}` : "Got it."}</b>` : coach.score !== undefined ? `<b class="badm">${pct.trim()}. Aim for ${PASS_MARK * 100}%, then move on.</b>` : st.say;
  return `<div class="sc-card" id="sg-coach"><div class="sc-top"><span>${where}</span><button class="ln-x" data-sp="cquit" aria-label="Stop learning">✕</button></div>${st.chords ? chordBoxes(full, st.chords) : st.def ? "" : formStrip(full, st)}<div class="sc-steps">${coach.plan.slice(span.first, span.last + 1).map((_, k) => `<i class="${k + span.first < coach.i ? "d" : k + span.first === coach.i ? "n" : ""}"></i>`).join("")}</div><h3>${st.title}<small>${st.def && !st.chartStep ? "" : st.from === st.to ? `bar ${st.from + 1}` : `bars ${st.from + 1}–${st.to + 1}`}${st.mode === "along" ? ` · ${st.pct}%` : ""}</small></h3><p role="status">${note}</p><div class="sc-acts">${coach.passed ? `<button class="go" data-sp="cnext">Next step →</button>` : `<button class="rs" data-sp="cskip">${st.mode === "along" ? "No microphone? I played it, move on" : "Skip this step"}</button>`}</div></div>`;
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
  const chord = chordId(id),
    [base, bars] = chord ? [chord.base] : String(id).split("@");
  if (chord && byId[base]) return (byId[id] = build(chordSong(byId[base], chord)));
  if (bars && byId[base]) {
    const [a, b] = bars.split("-").map(Number),
      full = byId[base],
      first = full.sounding.findIndex((n) => n.bar >= a);
    byId[id] = build(sliceDef(full, a, b));
    tabs[id] = tabFor(full).slice(first, first + byId[id].sounding.length);
    return byId[id];
  }
  const ex = exerciseById(id);
  if (ex) return (byId[id] = build(ex));
  if (opening !== id) {
    opening = id;
    loadTune(base)
      .then((d) => {
        opening = null;
        if (d) byId[base] = build(d);
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

/* Show the suggested chords over the notes of a tune. */
const charts = {};
function nameChords(s) {
  const [base, bars] = s.id.split("@"),
    full = byId[base] || s;
  if (s.chart || s.style === "exercise" || s.id.includes(":") || Object.keys(full.labels || {}).length) return;
  s.sounding.forEach((n) => delete n.label);
  if (!S.songs.names) return;
  const first = bars ? full.sounding.findIndex((n) => n.bar >= +bars.split("-")[0]) : 0;
  (charts[base] ||= chordChart(full)).spans.forEach((sp) => {
    const n = s.sounding[full.sounding.findIndex((x) => x.start >= sp.start - 1e-9) - first];
    if (n) n.label = sp.name;
  });
}

function scoreHtml(s) {
  const P = S.songs,
    lyrics = words(s);
  nameChords(s);
  if (P.scroll !== "lane") {
    lane = null;
    return `<div class="sg-wrap" id="sg-wrap">${songSvg(s, tabFor(s), { width: width(), view: P.view, lyrics })}</div>`;
  }
  lane = { song: s.id, ...ribbon(s, tabFor(s), { view: P.view, lyrics }) };
  return `<div class="sg-lane" id="sg-lane"><div class="sg-track" id="sg-track" style="width:${lane.width}px">${lane.svg}</div><i class="sg-hit" aria-hidden="true"></i></div>`;
}

function renderPlayer() {
  const full = current(),
    P = opts();
  if (!full) {
    app.innerHTML = `${header()}<div class="card prac"><p class="pr-sub" role="status">Loading…</p><button class="tg" data-sp="back">← All songs</button></div>`;
    return;
  }
  if (coach && coach.id !== full.id) coach = null;
  const s = onStand(full),
    run = songRunning(),
    mode = P.mode,
    beats = Array.from({ length: Math.round(s.bar / s.beat) }, (_, b) => `<span class="bd" data-b="${b}">${b + 1}</span>`).join(""),
    hasWords = s.words !== undefined;
  app.innerHTML = `${header()}<div class="card prac">
    <div class="pr-now"><div><h2>${esc(s.title)}</h2><p class="pr-sub">${esc(s.by)} · ${meta(s)}</p></div><button class="tg" data-sp="back">← All songs</button></div>
    ${coachBar(full)}
    ${seg("view", VIEWS, P.view)}${seg("scroll", SCROLLS, P.scroll)}${coach ? "" : seg("mode", MODES, mode)}
    ${scoreHtml(s)}
    <div class="beats" aria-label="Beat">${beats}</div>
    ${mode === "hear" ? "" : modeBlock(s)}
    <div class="pr-ctl">
      <button class="go pr-play" data-sp="play">${run || wait ? "■ Stop" : songBusy() ? "…" : mode === "hear" ? "▶ Play" : mode === "along" ? "▶ Start (count-in, then play)" : "▶ Start"}</button>
      ${coach ? "" : `<div class="chips pr-opts">${SPEEDS.map((v) => `<button data-sp="pct" data-v="${v}" class="${P.pct === v ? "a" : ""}">${v}%</button>`).join("")}</div>`}
    </div>
    <small class="sg-bpm">${Math.round((s.tempo * P.pct) / 100)} beats per minute</small>
    <div class="chips pr-opts">${tog("click", "Click", P.click)}${tog("notes", "Notes", P.notes)}${tog("countIn", "1-bar count-in", P.countIn)}${tog("loop", "Loop", P.loop)}${hasWords ? tog("lyrics", "Words", P.lyrics) : ""}${s.style === "exercise" || s.style === "chords" ? "" : tog("names", "Chords", P.names)}${s.style === "exercise" ? "" : tog("done", P.done[s.id] ? "✓ Learned" : "Mark as learned", !!P.done[s.id])}</div>
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
  const mode = opts().mode;
  let h = listenPanel();
  if (mode === "along") {
    h += along
      ? `<p class="sg-say" id="sg-say">Count-in, then play the melody. Notes are marked when it ends.</p>`
      : res && res.song === s.id
        ? resultBlock(s, res.g)
        : `<p class="sg-say">The click counts you in, then you play the melody on your guitar. Every note is marked for pitch and for timing (${S.listen.phones ? "the click keeps going because you wear headphones" : "the click stops after the count-in so the microphone only hears you"}).</p>`;
  } else if (wait)
    h += `<p class="sg-say" id="sg-say">${waitSay(s)}</p><div class="chips"><button data-sp="hearNote">Hear this note</button></div>`;
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
  if (res && res.song === s.id && opts().mode === "along" && !along)
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
      if (coach) (coachPass(), render());
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
  if (opts().mode === "wait") {
    wait = { song: s.id, i: 0, wrong: 0, msg: "", done: false, quietUntil: 0, off: onNote(onWait) };
    render();
    return followStart(s);
  }
  const P = opts();
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
      const beatSec = 60 / (s.tempo * (opts().pct / 100)),
        from = a.clock.due[0] - Math.min(0.3, beatSec * 0.45),
        heard = a.heard.filter((e) => e.t >= from),
        exp = a.clock.due.map((t, i) => ({ t, m: s.sounding[i].midi, ms: allOf(s.sounding[i]), shift: shiftOf(s, i) }));
      res = { song: s.id, g: gradeRun(exp, heard, { sr: ctx.sampleRate }) };
      coachPass(res.g.accuracy);
    }
  }
  if (document.querySelector("#sg-wrap") || document.querySelector("#sg-lane")) render();
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
    if (coach && opts().mode === "hear") coachPass();
    if (document.querySelector("#sg-wrap") || document.querySelector("#sg-lane")) render();
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
  const s = byId[S.songs.cur] && onStand(byId[S.songs.cur]);
  if (!s) return;
  if (songBusy() || wait) {
    stopSongs();
    return render();
  }
  if (opts().mode !== "hear") return startListening(s);
  songStart(s, opts(), hooks(s));
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
  if (k === "cstart") return coachStart(byId[P.cur]);
  if (k === "clesson") return coachStart(byId[P.cur], +v);
  if (k === "cgo") {
    coach.rest = 0;
    return render();
  }
  if (k === "cnext") return coachNext(false);
  if (k === "cskip") return coachNext(true);
  if (k === "cquit") {
    coach = null;
    res = null;
    if (P.fromPath) (P.cur = null), (P.style = "path");
    save();
    return render();
  }
  if (k === "mode" || k === "pct") res = null;
  if (k === "back") {
    P.cur = null;
    coach = null;
  }
  else if (k === "view") P.view = v;
  else if (k === "scroll") P.scroll = v;
  else if (k === "mode") P.mode = ["hear", "along", "wait"].includes(v) ? v : "hear";
  else if (k === "pct") P.pct = +v;
  else if (k === "done") P.done[P.cur] ? delete P.done[P.cur] : (P.done[P.cur] = 1);
  else if (["click", "notes", "countIn", "loop", "lyrics", "names"].includes(k)) P[k] = !P[k];
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
  if (k === "openskill") {
    P.style = "skills";
    P.skill = v;
  } else if (k === "style") P.style = v;
  else if (k === "level") P.level = +v;
  else if (k === "speed") P.speed = v;
  else if (k === "skill") P.skill = v;
  else if (["pos", "beats", "tempo"].includes(k)) P.ex[k] = +v;
  else P.ex[k] = v;
  save();
  render();
}

export function mountSongs() {
  screen("songs", () => (S.songs.cur ? renderPlayer() : renderList()));
  on("open-song", (id) => {
    S.songs.cur = id;
    S.songs.style = "path";
    coach = null;
    res = null;
    ui.page = "songs";
    save();
    render();
    window.scrollTo(0, 0);
  });
  action("songOpen", (D) => {
    S.songs.cur = D.songOpen;
    coach = null;
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
