/* The Songs tab: a searchable library of public-domain music graded by level, generated exercises, and a player that
   shows each piece as sheet music and tab and plays it along with a click. */
import { S, save, ui } from "../core/store.js";
import { action, emit, on, render, screen } from "../core/bus.js";
import { app } from "../core/dom.js";
import { header } from "../view/chrome.js";
import { SONGS } from "./data.js";
import { build, keyLabel } from "./format.js";
import { GUITAR_PATH, PASS_MARK, PATH_SONGS, coachPlan, formOf, freshNotes, lessonsIn, notesPerSecond, sliceDef, speedWord, starsFor } from "./path.js";
import { barsWord, climbPass, climbStart, fixPlan, hardPart, speedPlan, worstBars } from "./fix.js";
import { isLearned, knownChords } from "./session.js";
import { LIMITS, demandsOf } from "./demands.js";
import { chordChart } from "./harmony.js";
import { SIZES, changeKey, chartFor, chordId, chordPlan, chordSong, generateRun, recommendChanges, runById, runPlan, shapeOf } from "./changes.js";
import { CHANGE_USE } from "./changes-data.js";
import { boxView } from "../library/draw.js";
import { SKILLS } from "./moments-data.js";
import { SONG_DAYS, dayKey, dueSongs, recordReplay, recordSong } from "../courses/progress.js";
import { tabify } from "./tabify.js";
import { followPlan, followTop, ribbon, ribbonX, songSvg } from "./draw.js";
import { songBusy, songClock, songRunning, songStart, songStop } from "./player.js";
import { gradeRun, summary, waitStep } from "./grade.js";
import { libraryRows, loadIndex, loadTune } from "./library.js";
import { PATTERNS, POSITIONS, PROGRESSIONS, RHYTHMS, SCALES, SHAPES, STYLES, exerciseById } from "./exercises.js";
import { CADENCES, FEELS, HANDS, HARM, HARMONY, LENGTHS, MOTIONS, SFEELS, VARY, grooveById, isGroove, nextTake, withTake } from "./groove.js";
import { LADDER, isLadder, ladderLevel, ladderLine, nextLine } from "./ladder.js";
import { EAR_ROUND, LEVEL_PASS, LEVEL_WORK, echoById, isEcho, levelState, placeOf, stageDone, strandOf, tempoOf } from "./level.js";
import { KEYS, pretty } from "../library/catalog.js";
import { NAMES } from "../core/theory.js";
import { stringOffsets } from "../core/pitch.js";
import { audioReady, ctx, tone } from "../core/audio.js";
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
    ["reading", "Reading"],
    ["all", "All music"],
    ["classical", "Classical"],
    ["folk", "Folk"],
    ["skills", "Skills"],
    ["changes", "Chord changes"],
    ["repertoire", "My repertoire"],
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
  HOLD_OFF_MS = 3500, // after the player scrolls by hand, leave the view alone this long
  AGAIN_MS = 1400, // the breath between one run of a loop and the next
  WEAK_KEPT = 12; // trouble spots remembered for your next practice

const EX_DEFAULT = { kind: "scale", tonic: "G", scale: "major", pattern: "straight", pos: 2, rhythm: "e", prog: "I-IV-V-I", shape: "open", style: "block", beats: 4, tempo: 72,
  sfeel: "mixed", motion: "skips", len: 8, harmony: "maj", cads: "APHD", hand: "strum", feel: "sync", vary: "phrase", harm: "mix" };
const CAD_ORDER = "APHD";

/* How far each piece has been learned: { n: steps finished, stars, lesson: the one you're on, lessons: how many there are } */
function tidyLearn(raw, isId) {
  const out = {};
  if (raw && typeof raw === "object")
    for (const [id, v] of Object.entries(raw)) if (isId(id) && v && Number.isFinite(v.n)) out[id] = { n: Math.max(0, v.n | 0), stars: Math.max(0, Math.min(3, v.stars | 0)), lesson: Math.max(0, v.lesson | 0), lessons: Math.max(0, v.lessons | 0) };
  return out;
}

/* Best score for each chord change practised: { "C>G": 0.85 } */
function tidyMoved(raw) {
  const out = {};
  if (raw && typeof raw === "object") for (const [k, v] of Object.entries(raw)) if (k.length < 12 && Number.isFinite(v)) out[k] = Math.max(0, Math.min(1, v));
  return out;
}

/* The fastest clean run of each piece, as a % of its full speed: { tune: 85 } */
function tidyTop(raw) {
  const out = {};
  if (raw && typeof raw === "object") for (const [k, v] of Object.entries(raw)) if (k.length < 110 && Number.isFinite(v)) out[k] = Math.max(0, Math.min(100, v | 0));
  return out;
}

/* The bars that went worst in each piece's latest run, for next time: { tune: { from, to, at: "bars 5–6", pitch, s: score, d: day, t: title } } */
function tidyWeak(raw, isId) {
  const out = {};
  if (raw && typeof raw === "object")
    for (const [id, v] of Object.entries(raw)) if (isId(id) && v && Number.isFinite(v.from) && Number.isFinite(v.to)) out[id] = { from: Math.max(0, v.from | 0), to: Math.max(0, v.to | 0), at: String(v.at || "").slice(0, 24), pitch: !!v.pitch, s: Number.isFinite(v.s) ? v.s : 0, d: String(v.d || "").slice(0, 10), t: String(v.t || id).slice(0, 120) };
  return out;
}

/* Level work on each stage of the path: { G3: { t: [best per technique drill], r: best first read, e: best echo round, rt: the take last read } } */
function tidyLv(raw) {
  const out = {},
    num = (v) => (Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0);
  if (raw && typeof raw === "object")
    for (const { course } of GUITAR_PATH) {
      const v = raw[course];
      if (v && typeof v === "object") out[course] = { t: Array.isArray(v.t) ? v.t.slice(0, 4).map(num) : [], r: num(v.r), e: num(v.e), rt: String(v.rt || "").slice(0, 90) };
    }
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
    vary: p.vary !== false,
    lyrics: p.lyrics !== false,
    names: p.names === true,
    size: ok(p.size, SIZES.map((x) => x.id), "small"),
    runSeed: Number.isFinite(p.runSeed) ? p.runSeed | 0 : 1,
    moved: tidyMoved(p.moved),
    top: tidyTop(p.top),
    weak: tidyWeak(p.weak, isId),
    lv: tidyLv(p.lv),
    done,
    style: ok(p.style, STYLE_TABS.map((t) => t[0]), "path"),
    learn: tidyLearn(p.learn, isId),
    level: ok(p.level, [0, 1, 2, 3, 4, 5, 6], 0),
    speed: ok(p.speed, ["", "Slow", "Moderate", "Fast"], ""),
    skill: ok(p.skill, SKILLS.map((k) => k.id), SKILLS[0].id),
    ex: {
      kind: ok(x.kind, ["scale", "chord", "sgroove", "cgroove"], EX_DEFAULT.kind),
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
      sfeel: ok(x.sfeel, Object.keys(SFEELS), EX_DEFAULT.sfeel),
      motion: ok(x.motion, Object.keys(MOTIONS), EX_DEFAULT.motion),
      len: ok(x.len, LENGTHS, EX_DEFAULT.len),
      harmony: ok(x.harmony, Object.keys(HARMONY), EX_DEFAULT.harmony),
      cads: typeof x.cads === "string" && /^A?P?H?D?$/.test(x.cads) && x.cads ? x.cads : EX_DEFAULT.cads,
      hand: ok(x.hand, Object.keys(HANDS), EX_DEFAULT.hand),
      feel: ok(x.feel, Object.keys(FEELS), EX_DEFAULT.feel),
      vary: ok(x.vary, Object.keys(VARY), EX_DEFAULT.vary),
      harm: ok(x.harm, Object.keys(HARM), EX_DEFAULT.harm),
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
/* Chord changes by size: what to practise next, and a button that makes up a fresh run. */
function changesHtml() {
  const P = S.songs,
    size = SIZES.find((x) => x.id === P.size),
    list = recommendChanges(size.id, CHANGE_USE, P.moved, knownChords(P)),
    top = list[0],
    pairId = (c) => `chg:${c.a},${c.b}:4:66`,
    row = (c) => `<button class="sp-song" data-song-open="${esc(pairId(c))}"><span class="sp-t">${esc(c.a)} to ${esc(c.b)}</span><small>${c.n ? `In ${c.n} piece${c.n === 1 ? "" : "s"}` : "Not common in this library"}${c.songs[0] ? `, like ${esc(c.songs[0].title)}` : ""}</small><span class="sp-s">${c.best >= 0.7 ? `✓ ${Math.round(c.best * 100)}%` : ""}</span></button>`;
  return `${chipRow("csize", SIZES.map((x) => [x.id, x.name]), size.id)}<div class="sp-next"><small>${esc(size.blurb)}</small><h3>Recommended: ${esc(top.a)} to ${esc(top.b)}</h3><p>${esc(top.tip)}</p><div class="sc-acts"><button class="go" data-song-open="${esc(pairId(top))}">Practise this change</button> <button class="rs" data-sl="genrun">Generate a run of ${size.word} changes</button></div></div><section class="sp-stage"><header><div><h3>More ${size.word} changes</h3><p>The ones real songs use most come first, and changes you've mastered drop down.</p></div></header><div class="sp-list">${list.slice(1, 11).map(row).join("")}</div></section>`;
}

/* What you can already play, and when each piece is next due back. */
function repertoireHtml() {
  const today = dayKey(),
    rep = Object.entries(S.courses.rep || {}).map(([id, v]) => ({ id, ...v })).sort((a, b) => (a.n < b.n ? -1 : 1)),
    due = dueSongs(S.courses, today).length,
    when = (n) => {
      if (n <= today) return "Due now";
      const days = Math.round((new Date(n) - new Date(today)) / 864e5);
      return days === 1 ? "Tomorrow" : `In ${days} days`;
    };
  if (!rep.length) return `<p class="pr-sub">Every piece you finish lands here, and comes back in your daily plan before it fades.</p>`;
  return `<p class="pr-sub" role="status">${rep.length} piece${rep.length === 1 ? "" : "s"} you can play${due ? `, ${due} due today` : ", nothing due today"}. A quick play-through keeps them in your hands.</p><div class="sp-list sp-rep">${rep.map((x) => `<button class="sp-song" data-sl="replay" data-v="${esc(x.id)}"><span class="sp-t">${esc(x.t)}</span><small>Best ${x.b}%${x.r ? ` · played again ${x.r} time${x.r === 1 ? "" : "s"}` : ""}</small><span class="sp-s${x.n <= today ? " due" : ""}">${when(x.n)}</span></button>`).join("")}</div>`;
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
const exId = (x, take = 1) =>
  x.kind === "scale"
    ? `ex:s:${x.tonic}:${x.scale}:${x.pattern}:${x.pos}:${x.rhythm}:${x.tempo}`
    : x.kind === "chord"
      ? `ex:c:${x.tonic}:${x.prog}:${x.shape}:${x.style}:${x.beats}:${x.tempo}`
      : x.kind === "sgroove"
        ? `gx:s:${x.tonic}:${x.scale}:${x.pos}:${x.sfeel}:${x.motion}:${x.len}:${x.tempo}:${take}`
        : `gx:c:${x.tonic}:${x.harmony}:${x.cads}:${x.shape}:${x.hand}:${x.feel}:${x.vary}:${x.harm}:${x.len}:${x.tempo}:${take}`;

function exercisePanel() {
  const x = S.songs.ex,
    keys = KEYS.map((k) => [k, pretty(k)]);
  let h = `<div class="sg-ex">${chipRow("kind", [["scale", "Scales"], ["chord", "Chord changes"], ["sgroove", "Scale grooves"], ["cgroove", "Chord grooves"]], x.kind)}${x.kind.endsWith("groove") ? `<p class="pr-sub">Made up fresh every take: new rhythms, new turns of phrase, and with Loop on the next take follows straight on.</p>` : ""}<h3 class="sg-lv">Key</h3>${chipRow("tonic", keys, x.tonic)}`;
  const bars = `<h3 class="sg-lv">Bars in a take</h3>${chipRow("len", LENGTHS.map((n) => [n, n]), x.len)}`;
  if (x.kind === "sgroove")
    h += `<h3 class="sg-lv">Scale</h3>${chipRow("scale", pairs(SCALES), x.scale)}<h3 class="sg-lv">Hand position</h3>${chipRow("pos", POSITIONS.map((p) => [p, p ? `Fret ${p}` : "Open"]), x.pos)}<h3 class="sg-lv">Rhythm</h3>${chipRow("sfeel", pairs(SFEELS), x.sfeel)}<h3 class="sg-lv">How the tune moves</h3>${chipRow("motion", Object.entries(MOTIONS), x.motion)}${bars}`;
  else if (x.kind === "cgroove")
    h += `<h3 class="sg-lv">Harmony</h3>${chipRow("harmony", pairs(HARMONY), x.harmony)}<h3 class="sg-lv">Cadences: how phrases end</h3><div class="chips pr-opts">${[...CAD_ORDER].map((k) => `<button data-sl="cad" data-v="${k}" class="${x.cads.includes(k) ? "a" : ""}" aria-pressed="${x.cads.includes(k)}" title="${CADENCES[k].blurb}">${CADENCES[k].name}</button>`).join("")}</div><p class="pr-sub">${[...x.cads].map((k) => `${CADENCES[k].name}: ${CADENCES[k].blurb}.`).join(" ")}</p><h3 class="sg-lv">How often the chords change</h3>${chipRow("harm", pairs(HARM), x.harm)}<h3 class="sg-lv">Right hand</h3>${chipRow("hand", Object.entries(HANDS), x.hand)}<h3 class="sg-lv">Rhythm</h3>${chipRow("feel", pairs(FEELS), x.feel)}<h3 class="sg-lv">New rhythm</h3>${chipRow("vary", Object.entries(VARY), x.vary)}<h3 class="sg-lv">Shapes</h3>${chipRow("shape", Object.entries(SHAPES), x.shape)}${bars}`;
  else if (x.kind === "scale")
    h += `<h3 class="sg-lv">Scale</h3>${chipRow("scale", pairs(SCALES), x.scale)}<h3 class="sg-lv">Pattern</h3>${chipRow("pattern", pairs(PATTERNS), x.pattern)}<h3 class="sg-lv">Hand position</h3>${chipRow("pos", POSITIONS.map((p) => [p, p ? `Fret ${p}` : "Open"]), x.pos)}<h3 class="sg-lv">Rhythm</h3>${chipRow("rhythm", pairs(RHYTHMS), x.rhythm)}`;
  else
    h += `<h3 class="sg-lv">Changes</h3>${chipRow("prog", pairs(PROGRESSIONS), x.prog)}<h3 class="sg-lv">Shapes</h3>${chipRow("shape", Object.entries(SHAPES), x.shape)}<h3 class="sg-lv">Right hand</h3>${chipRow("style", Object.entries(STYLES), x.style)}<h3 class="sg-lv">How often it changes</h3>${chipRow("beats", [[4, "Every bar"], [2, "Twice a bar"], [1, "Every beat"]], x.beats)}`;
  const open = x.kind.endsWith("groove") ? `<button class="go" data-sl="gxopen">▶ Make a groove</button>` : `<button class="go" data-song-open="${exId(x)}">▶ Open this exercise</button>`;
  return `${h}<h3 class="sg-lv">Tempo</h3>${chipRow("tempo", [50, 60, 72, 88, 104, 120].map((t) => [t, t]), x.tempo)}${open}</div>`;
}

const learned = (id) => isLearned(S.songs, id);
const drillRow = (course) => {
  const here = SKILLS.filter((k) => k.course === course);
  return here.length ? `<div class="sp-drills"><small>Skills for this stage</small>${here.map((k) => `<button data-sl="openskill" data-v="${k.id}">${k.name}</button>`).join("")}</div>` : "";
};
/* What a stage asks for besides its pieces: technique at a set tempo, a sight-read and an ear test. */
const levelRow = (k, course) =>
  `<div class="sp-drills sp-lvl"><small>Level work</small>${levelState(k, S.songs.lv[course]).map((x) => `<button data-sl="lvopen" data-v="${k}:${x.kind}:${x.i}" class="${x.pass ? "ok" : ""}">${x.pass ? "✓ " : ""}${esc(x.name)}</button>`).join("")}</div>`;
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
    return `<section class="sp-stage${stageDone(k, got === st.songs.length, S.songs.lv[st.course]) ? " fin" : ""}"><header><span class="sp-n">${k + 1}</span><div><h3>${st.title}</h3><p>${st.blurb}</p></div><small>${got} / ${st.songs.length}</small></header><div class="sp-list">${rows}</div>${drillRow(st.course)}${levelRow(k, st.course)}</section>`;
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
  else if (P.style === "reading") h += readingHtml();
  else if (P.style === "changes") h += changesHtml();
  else if (P.style === "repertoire") h += repertoireHtml();
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
function opts() {
  if (!coach || coach.done) return S.songs;
  const st = coach.plan[coach.i],
    c = coach.climb;
  return c ? { ...S.songs, mode: c.free ? "hear" : "along", pct: c.pct, loop: false, countIn: true, click: c.free || S.songs.click } : { ...S.songs, mode: st.mode, pct: st.pct, loop: false };
}

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
const planFor = (full) => (full.names ? runPlan(full) : full.chart ? chordPlan(full) : coachPlan(full, full.style === "exercise" ? undefined : tabFor(full)));
function coachFor(full, lesson) {
  const plan = planFor(full),
    L = S.songs.learn[full.id] || {},
    n = lesson ? plan.findIndex((st) => st.lesson === lesson) : L.stars ? 0 : Math.min(L.n || 0, plan.length - 1);
  return { id: full.id, plan, i: Math.max(0, n), passed: false, done: false, rest: 0 };
}
function coachStart(full, lesson) {
  coach = coachFor(full, lesson);
  res = null;
  render();
}
/* Work on one stretch, then go back to what you were doing. solo: "fix" | "speed" */
function soloCoach(solo, full, plan, prior) {
  const st = plan[0];
  return { id: full.id, plan, i: 0, passed: false, done: false, rest: 0, solo, prior, climb: st.kind === "climb" ? climbStart(st) : null };
}
function speedCoach(full, from, to) {
  const whole = from === 0 && to === full.barLens.length - 1,
    key = whole ? full.id : `${full.id}@${from}-${to}`;
  return { ...soloCoach("speed", full, speedPlan(full, from, to, S.songs.top[key] || 0), null), key };
}
/* What a step of today's practice opens on: { id, kind, ... } */
let queued = null;
function coachOf(full, it) {
  const end = full.barLens.length - 1;
  if (it.kind === "replay") return replayCoach(full);
  if (it.kind === "encore") {
    const c = replayCoach(full);
    c.plan = [{ ...c.plan[0], lessonName: "Finish with this", title: "Play it for fun", say: "Something you already have, for the pleasure of it. The score doesn't matter." }];
    return { ...c, encore: true };
  }
  if (it.kind === "fix") return it.to > end ? coachFor(full) : soloCoach("fix", full, fixPlan(full, it.from, it.to, it.pitch), null);
  if (it.kind === "climb") {
    const p = full.id.includes(":") ? { from: 0, to: end } : hardPart(full);
    return speedCoach(full, p.from, p.to);
  }
  return coachFor(full);
}
/* One play-through of a finished piece: all it takes to keep it. */
function replayCoach(full) {
  const end = full.barLens.length - 1,
    step = { lesson: 1, lessons: 1, lessonName: "Keep it alive", parts: 0, part: 0, from: 0, to: end, kind: "full", mode: "along", pct: 100, title: "Play it through", say: "Once, start to finish, at full speed. No warm-up needed." };
  return { id: full.id, plan: [step], i: 0, passed: false, done: false, rest: 0, replay: true };
}
function coachPass(score = 1) {
  if (!coach || coach.done) return;
  const st = coach.plan[coach.i],
    want = st.mode === "along" ? PASS_MARK : 0;
  coach.score = score;
  coach.passed = score >= want;
}
/* A worked stretch: on to its next step, or done. What it reached is kept for next time. */
function soloNext(skipped) {
  const P = S.songs,
    c = coach.climb;
  if (c) coach.won = c;
  S.xp += skipped ? 0 : 2;
  res = null;
  coach.note = "";
  if (coach.i < coach.plan.length - 1) {
    coach.i++;
    coach.passed = false;
    coach.score = undefined;
    const st = coach.plan[coach.i];
    coach.climb = st.kind === "climb" ? climbStart(st) : null;
  } else {
    const won = coach.won;
    coach.done = true;
    coach.climb = null;
    if (coach.solo === "speed" && won?.best) P.top[coach.key] = Math.max(P.top[coach.key] || 0, won.best);
    if (coach.solo === "fix" && won?.best >= 90) delete P.weak[coach.id];
  }
  save();
  render();
}
function coachNext(skipped) {
  if (coach.solo) return soloNext(skipped);
  if (coach.replay) {
    const score = Math.round((skipped ? 0.8 : coach.score ?? 0.8) * 100);
    coach.score = score / 100;
    if (!coach.encore) coach.back = recordReplay(S.courses, coach.id, score);
    coach.done = true;
    S.xp += skipped ? 2 : 12;
    res = null;
    save();
    return render();
  }
  const full = byId[coach.id],
    L = (S.songs.learn[coach.id] ||= { n: 0, stars: 0 }),
    last = coach.i === coach.plan.length - 1;
  L.n = Math.max(L.n, coach.i + 1);
  S.xp += skipped ? 0 : 3;
  res = null;
  if (last) {
    const stars = skipped ? 1 : starsFor(coach.score ?? 0);
    L.stars = Math.max(L.stars, stars);
    if (full.names) {
      full.names.slice(1).forEach((n, i) => {
        const key = changeKey(full.names[i], n);
        if (!skipped) S.songs.moved[key] = Math.max(S.songs.moved[key] || 0, coach.score ?? 0);
      });
      coach.done = true;
      coach.stars = stars;
      save();
      return render();
    }
    S.songs.done[coach.id] = 1;
    S.xp += 30 + stars * 10;
    recordSong(S.courses, coach.id, Math.round((coach.score ?? 0.7) * 100), dayKey(), full.title);
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
/* Real music that uses a change. */
function changeSongs(full) {
  const songs = full.names.length === 2 ? CHANGE_USE[changeKey(...full.names)]?.songs || [] : [];
  return songs.length ? `<p class="sc-ch">Songs with this change: ${songs.map((x) => `<button class="rs" data-song-open="ch:${esc(x.id)}">${esc(x.title)}</button>`).join(" ")}</p>` : "";
}
/* Every tune has chords in it, even if nobody wrote them down. */
function suggested(full) {
  if (full.id.includes("@") || full.style === "exercise" || full.sounding.filter((n) => n.pitches.length > 1).length > full.sounding.length * 0.2) return "";
  const c = chartFor(full);
  return c.names.length < 2 ? "" : `<p class="sc-ch">Chords for this tune: <b>${c.names.map(esc).join(" ")}</b> <button class="rs" data-song-open="ch:${esc(full.id)}">Learn the chords</button></p>`;
}

/* Today's practice, if this piece is the step it's on. */
function planStep(full) {
  const p = ui.learn?.plan,
    it = p && p.items[p.at];
  return it && !it.done && it.id === full.id ? p.items.slice(p.at + 1).find((x) => !x.done) || "last" : null;
}
/* The way out of a finished stretch: on through today's practice if you're in it, otherwise the button given. */
function onward(full, otherwise) {
  const next = planStep(full);
  return !next ? otherwise : `<button class="go" data-sp="pnext">${next === "last" ? "Finish today's practice" : `Next: ${esc(next.title)} →`}</button>`;
}

function soloDone(full) {
  const c = coach.won,
    best = c?.best || 0,
    back = coach.prior ? "Back to the piece" : coach.solo === "fix" ? "Back" : "Done",
    head = coach.solo === "fix" ? (best >= 100 ? "Fixed" : best ? "Getting there" : "Stopped there") : best ? `${Math.round((full.tempo * best) / 100)} beats per minute` : "Stopped there",
    was = coach.before === undefined ? "" : ` It was ${Math.round(coach.before * 100)}% in that run.`,
    text = !best ? "Pick it up again whenever you like." : coach.solo === "fix" ? (best >= 100 ? `Clean at full speed.${was}` : `Clean up to ${best}% of full speed.${best < 90 ? " It'll come back in your next practice." : ""}`) : `Clean at ${best}% of full speed.${best >= 100 ? "" : " Next time it starts near here."}`;
  return `<div class="sc-card" id="sg-coach"><h3>${head}</h3><p>${text}</p><div class="sc-acts">${onward(full, `<button class="go" data-sp="cquit">${back}</button>`)}</div></div>`;
}
/* The note under a climb, and how far up it has got. */
function climbCard(full, st) {
  const c = coach.climb,
    pct = Math.round((100 * (c.pct - c.start)) / Math.max(1, c.goal - c.start));
  return `<div class="sc-card" id="sg-coach"><div class="sc-top"><span>${st.lessonName}</span><button class="ln-x" data-sp="cquit" aria-label="Stop">✕</button></div><div class="ln-bar"><i style="width:${pct}%"></i></div><h3>${st.title}<small>${st.from === st.to ? `bar ${st.from + 1}` : `bars ${st.from + 1}–${st.to + 1}`} · ${c.pct}%</small></h3><p role="status">${coach.note || (c.free ? `Play along with the click. It goes up every ${c.need > 1 ? `${c.need} runs` : "run"}.` : st.say)}</p><div class="sc-acts">${c.free ? `<button class="rs" data-sp="cslow">Too fast, slow it down</button>` : `<button class="rs" data-sp="cfree">No microphone? Just step it up with the click</button>`} <button class="rs" data-sp="cskip">That's enough</button></div></div>`;
}

function coachBar(full) {
  if (coach && coach.rest) {
    const next = coach.plan[coach.i],
      more = `<button class="${planStep(full) ? "rs" : "go"}" data-sp="cgo">${planStep(full) ? "Keep going with this piece" : `Next: ${next.lessonName} →`}</button>`;
    return `<div class="sc-card" id="sg-coach"><div class="sc-top"><span>Lesson ${coach.rest} of ${next.lessons} finished</span><button class="ln-x" data-sp="cquit" aria-label="Stop learning">✕</button></div>${formStrip(full, { from: 0, to: Math.max(...coach.plan.slice(0, coach.i).map((st) => st.to)) })}<h3>Good place to stop</h3><p>Practice sticks better spread over a few days, and the next lesson opens by warming this one up. Or carry on now.</p><div class="sc-acts">${onward(full, "")}${more}</div></div>`;
  }
  if (coach && coach.done && coach.solo) return soloDone(full);
  if (coach && coach.done && coach.encore) return `<div class="sc-card" id="sg-coach"><h3>That's the way to finish</h3><p>Music you can already play is why any of this is worth doing.</p><div class="sc-acts">${onward(full, `<button class="go" data-sp="cquit">Done</button>`)}</div></div>`;
  if (coach && coach.done && coach.replay) {
    const held = coach.score >= 0.6;
    return `<div class="sc-card" id="sg-coach"><h3>${coach.score >= 0.8 ? "Still yours" : held ? "Nearly there" : "It's slipped a little"}</h3><p>${coach.score >= 0.8 ? `Solid. It can wait ${coach.back} days now.` : held ? `Good enough to keep. Back in ${coach.back} days.` : "That happens. It'll come back tomorrow, or go through a lesson again now."}</p><div class="sc-acts">${onward(full, `<button class="go" data-sp="cquit">Done</button>`)}${held ? "" : ` <button class="rs" data-sp="clesson" data-v="1">Go through the lessons</button>`}</div></div>`;
  }
  if (coach && coach.done && full.names)
    return `<div class="sc-card" id="sg-coach"><div class="sc-stars">${"★".repeat(coach.stars)}${"☆".repeat(3 - coach.stars)}</div><h3>${esc(full.title)}</h3><p>Back tomorrow, this will feel easier.</p>${changeSongs(full)}${onward(full, `<button class="go" data-sp="cquit">Back</button>`)}</div>`;
  if (coach && coach.done)
    return `<div class="sc-card" id="sg-coach"><div class="sc-stars">${"★".repeat(coach.stars)}${"☆".repeat(3 - coach.stars)}</div><h3>You learned ${esc(full.title)}</h3><p>It's in your repertoire now, and comes back in your daily plan in ${SONG_DAYS[0]} days, before it fades.</p>${onward(full, `<button class="go" data-sp="cquit">Back to the path</button>`)}</div>`;
  if (!coach && isLadder(full.id)) return readingCard(full);
  if (!coach && strandOf(full.id)) return strandCard(full);
  if (!coach && isGroove(full.id))
    return `<div class="sc-card" id="sg-coach"><p>${full.story ? `${esc(full.story)} ` : ""}Every take is new, so you read it rather than remember it. ${S.songs.loop ? (S.songs.vary ? "With Loop on, the next take follows on the beat" : "Loop plays this take again; switch on New take each loop for a fresh one every time") : "Turn on Loop and keep going: the next take follows on the beat"}${S.songs.loop && !S.songs.vary ? "" : S.songs.countIn ? ", with a bar of count-in to look ahead" : ", straight on with no gap"}.</p></div>`;
  if (!coach && full.id.includes("@")) return `<div class="sc-card" id="sg-coach"><p>A short drill from this piece. Loop it slowly, then bring it up to speed.</p><button class="go alt" data-song-open="${esc(full.id.split("@")[0])}">Open the whole piece</button></div>`;
  if (!coach) {
    const L = S.songs.learn[full.id],
      plan = planFor(full),
      { parts, lessons } = plan[0],
      fresh = L && L.n && !L.stars,
      intro = full.names ? (full.names.length === 2 ? "Slow to quick: the same change with less and less time to make it." : "A generated run of chord changes, each one of the size you asked for.") : full.chart ? `${full.chart.names.length} chords and ${full.chart.moves} changes. Drill the changes this song uses, then play it with the tune.${full.chart.capo ? ` Played in ${full.chart.key} for easy shapes. A capo at fret ${full.chart.capo} matches the original key.` : ""} These chords are suggested from the melody.` : `${parts > 1 ? `${parts} phrases to learn, in ${lessons} short lessons` : "Learn it step by step"}. Each one builds on the last until you can play the whole piece.`;
    return `<div class="sc-card" id="sg-coach"><p>${intro}${L && L.stars ? ` Your best: ${"★".repeat(L.stars)}` : ""}</p>${full.chart ? chordBoxes(full, full.chart.names) : formStrip(full)}${fresh ? `<div class="ln-bar"><i style="width:${(100 * L.n) / plan.length}%"></i></div>` : ""}<button class="go" data-sp="cstart">${L && L.stars ? "Learn it again" : fresh ? "Carry on learning" : "Start lesson 1"}</button>${full.names ? changeSongs(full) : lessonList(full, plan, L)}${full.chart ? "" : suggested(full)}</div>`;
  }
  const st = coach.plan[coach.i];
  if (coach.climb) return climbCard(full, st);
  const span = lessonsIn(coach.plan).find((x) => x.n === st.lesson),
    where = st.lessons > 1 ? `Lesson ${st.lesson} of ${st.lessons} · ${st.lessonName}` : st.lessonName,
    pct = st.mode === "along" && coach.score !== undefined ? ` ${Math.round(coach.score * 100)}%` : "",
    note = coach.passed ? `<b class="good">${st.mode === "along" ? `Nice.${pct}` : "Got it."}</b>` : coach.score !== undefined ? `<b class="badm">${pct.trim()}. Aim for ${PASS_MARK * 100}%, then move on.</b>` : st.say;
  return `<div class="sc-card" id="sg-coach"><div class="sc-top"><span>${where}</span><button class="ln-x" data-sp="cquit" aria-label="Stop learning">✕</button></div>${st.chords ? chordBoxes(full, st.chords) : st.def ? "" : formStrip(full, st)}<div class="sc-steps">${coach.plan.slice(span.first, span.last + 1).map((_, k) => `<i class="${k + span.first < coach.i ? "d" : k + span.first === coach.i ? "n" : ""}"></i>`).join("")}</div><h3>${st.title}<small>${st.def && !st.chartStep ? "" : st.from === st.to ? `bar ${st.from + 1}` : `bars ${st.from + 1}–${st.to + 1}`}${st.mode === "along" ? ` · ${st.pct}%` : ""}</small></h3><p role="status">${note}</p><div class="sc-acts">${coach.passed ? `<button class="go" data-sp="cnext">Next step →</button>` : `<button class="rs" data-sp="cskip">${st.mode === "along" ? "No microphone? I played it, move on" : "Skip this step"}</button>`}</div></div>`;
}

/* A technique drill or a sight-read from a stage's level work: what passes, and your best so far. */
function strandCard(full) {
  const st = strandOf(full.id),
    w = LEVEL_WORK[st.k],
    L = S.songs.lv[GUITAR_PATH[st.k].course] || {},
    row = levelState(st.k, L).find((x) => x.kind === st.kind && x.i === (st.i || 0)),
    pass = Math.round(LEVEL_PASS * 100),
    best = row.best ? ` Your best: ${Math.round(row.best * 100)}%${row.pass ? ", passed ✓" : ""}.` : "",
    text = `Play along at full speed (${tempoOf(w.tech[st.i].id)} beats per minute) and land ${pass}% of the notes to pass. Loop it in Hear it, or at a slower speed, until it's comfortable.`;
  return `<div class="sc-card" id="sg-coach"><div class="sc-top"><span>Stage ${st.k + 1} level work · Technique</span></div><p>${text}${best}</p>${full.story ? `<p>${esc(full.story)}</p>` : ""}<div class="sc-acts"><button class="rs" data-sp="back">Back to the path</button></div></div>`;
}

/* A line from the reading ladder: read it from the staff, first go counts. */
let peek = null; // the reading line whose tab is showing
function readingCard(full) {
  const lv = ladderLevel(full.id),
    L = LADDER[lv - 1],
    got = S.songs.lv[GUITAR_PATH[lv - 1].course] || {},
    best = got.r ? ` Your best first read: ${Math.round(got.r * 100)}%${got.r >= LEVEL_PASS ? ", passed ✓" : ""}.` : "",
    rhythm = Math.max(...L.rhythm),
    text =
      got.rt === full.id
        ? "You've had your first read of this line. Play it again as practice, or read a new one: only a first read counts."
        : `Read it from the staff, without listening first. Play along at full speed: your first go counts, and ${Math.round(LEVEL_PASS * 100)}% passes stage ${lv}'s sight-reading. Stuck on the notes? Wait for me lets you find each one with no clock.`;
  return `<div class="sc-card" id="sg-coach"><div class="sc-top"><span>Reading level ${lv} of ${LADDER.length} · ${esc(L.name)}</span></div><p>${text}${best}</p><div class="sc-acts"><button class="go" data-sp="take">Read a new line</button> <button class="rs" data-sp="peek">${peek === full.id ? "Hide the tab" : "Show the tab"}</button> <button class="rs" data-sp="rhythmfirst" data-v="${rhythm}">Rhythm first: Read the rhythm, level ${rhythm}</button></div></div>`;
}
/* The reading ladder: one level per stage, each with your best first read. */
const readBest = (lv) => S.songs.lv[GUITAR_PATH[lv - 1].course]?.r || 0;
const keyWords = ([t, sc]) => `${t.replace("#", "♯").replace("b", "♭")} ${SCALES[sc].name.toLowerCase().replace("natural ", "")}`;
function readingHtml() {
  const at = LADDER.findIndex((_, i) => readBest(i + 1) < LEVEL_PASS),
    next = at < 0 ? LADDER.length : at + 1,
    L = LADDER[next - 1],
    row = (x, i) => {
      const b = readBest(i + 1);
      return `<button class="sp-song${b >= LEVEL_PASS ? " done" : ""}" data-sl="rdopen" data-v="${i + 1}"><span class="sp-t">${i + 1}. ${esc(x.name)}</span><small>New: ${esc(x.notes)} · ${x.keys.map(keyWords).join(", ")}</small><span class="sp-s">${b ? `${Math.round(b * 100)}%${b >= LEVEL_PASS ? " ✓" : ""}` : `Stage ${i + 1}`}</span></button>`;
    };
  return `<div class="sp-next"><small>Reading level ${next} of ${LADDER.length}${at < 0 ? " · every level passed" : ""}</small><h3>${esc(L.name)}</h3><p>New: ${esc(L.notes)}. Read it from the staff: the tab stays hidden until you ask for it. Your first go at each line is the one that counts.</p><button class="go" data-sl="rdopen" data-v="${next}">Read a line</button></div><section class="sp-stage"><header><div><h3>The reading ladder</h3><p>Notes in the order guitar methods teach them, with the rhythms from Read the rhythm a step behind. Each level is the sight-reading test for its stage of the path.</p></div></header><div class="sp-list">${LADDER.map(row).join("")}</div></section>`;
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
  const run = runById(id);
  if (run) return (byId[id] = build(run));
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
  const ex = exerciseById(id) || grooveById(id) || ladderLine(id);
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
    lyrics = words(s),
    view = isLadder(s.id) && peek !== s.id ? "staff" : P.view;
  nameChords(s);
  if (P.scroll !== "lane") {
    lane = null;
    return `<div class="sg-wrap" id="sg-wrap">${songSvg(s, tabFor(s), { width: width(), view, lyrics })}</div>`;
  }
  lane = { song: s.id, ...ribbon(s, tabFor(s), { view, lyrics }) };
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
  if (queued?.id === full.id) {
    coach = coachOf(full, queued);
    queued = null;
  }
  const s = onStand(full),
    run = songRunning(),
    mode = P.mode,
    beats = Array.from({ length: Math.round(s.bar / s.beat) }, (_, b) => `<span class="bd" data-b="${b}">${b + 1}</span>`).join(""),
    hasWords = s.words !== undefined;
  app.innerHTML = `${header()}<div class="card prac">
    <div class="pr-now"><div><h2>${esc(s.title)}</h2><p class="pr-sub">${esc(s.by)} · ${meta(s)}</p></div><button class="tg" data-sp="back">← All songs</button></div>
    ${coachBar(full)}
    ${isLadder(s.id) && peek !== s.id ? "" : seg("view", VIEWS, P.view)}${seg("scroll", SCROLLS, P.scroll)}${coach ? "" : seg("mode", MODES, mode)}
    ${scoreHtml(s)}
    <div class="beats" aria-label="Beat">${beats}</div>
    ${mode === "hear" ? "" : modeBlock(s)}
    <div class="pr-ctl">
      <button class="go pr-play" data-sp="play">${run || wait || again ? "■ Stop" : songBusy() ? "…" : mode === "hear" ? "▶ Play" : mode === "along" ? "▶ Start (count-in, then play)" : "▶ Start"}</button>
      ${coach ? "" : `<div class="chips pr-opts">${SPEEDS.map((v) => `<button data-sp="pct" data-v="${v}" class="${P.pct === v ? "a" : ""}">${v}%</button>`).join("")}<button data-sp="climb">Speed trainer</button></div>`}
    </div>
    <small class="sg-bpm">${Math.round((s.tempo * P.pct) / 100)} beats per minute</small>
    <div class="chips pr-opts">${tog("click", "Click", P.click)}${tog("notes", "Notes", P.notes)}${tog("countIn", "1-bar count-in", P.countIn)}${tog("loop", "Loop", P.loop)}${isGroove(s.id) && !coach ? `${tog("vary", "New take each loop", P.vary)}<button data-sp="take">New take</button>` : ""}${hasWords ? tog("lyrics", "Words", P.lyrics) : ""}${s.style === "exercise" || s.style === "chords" ? "" : tog("names", "Chords", P.names)}${s.style === "exercise" ? "" : tog("done", P.done[s.id] ? "✓ Learned" : "Mark as learned", !!P.done[s.id])}</div>
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
/* Where the music on the stand starts in the piece, in bars. */
const standAt = () => (coach && !coach.done ? coach.plan[coach.i].from : 0);
/* Fix it can run on the bars of a tune, but not on a drill that isn't part of the piece. */
const fixable = () => !coach || (!coach.solo && !coach.done && !coach.plan[coach.i].def);
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
    w = fixable() && worstBars(s, g.notes),
    fix = w ? `<button class="${coach?.passed === false || !coach ? "go" : "rs"}" data-sp="fix">Fix ${barsWord(s, w.from, w.to)}</button>` : "",
    biasText = Math.abs(b) < 15 ? "Right on the click." : b > 0 ? `You land about ${Math.round(b)} ms behind the click on average.` : `You land about ${Math.round(-b)} ms ahead of the click on average.`;
  return `<div class="rh-result sg-res"><div class="rh-acc">${Math.round(g.accuracy * 100)}% · ${c.ok} of ${n} notes right on time</div><p>${biasText}${g.extras.length ? ` ${g.extras.length} extra note${g.extras.length > 1 ? "s" : ""}.` : ""}</p>${spots.length ? `<p>${spots.map(([st, bs]) => `<b>${name[st]}</b> in bar ${bs.slice(0, 6).join(", ")}`).join(" · ")}</p>` : "<p>No trouble spots.</p>"}<div class="sg-key"><i class="res-ok">on time</i><i class="res-early">early</i><i class="res-late">late</i><i class="res-wrong">wrong note</i><i class="res-miss">missed</i></div>${fix}</div>`;
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
      if (coach) {
        coachPass();
        coach.solo ? soloOn() : render();
      }
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
      graded(s, gradeRun(exp, heard, { sr: ctx.sampleRate }));
    }
  }
  if (document.querySelector("#sg-wrap") || document.querySelector("#sg-lane")) render();
}
function graded(s, g) {
  res = { song: s.id, g };
  noteWeak(byId[S.songs.cur], s, g);
  noteLevel(s, g.accuracy);
  if (coach?.climb) climbAfter(s, g.accuracy);
  else coachPass(g.accuracy);
}
/* Remember what went worst in a real run through, for your next practice. A clean run clears it. First goes at new bars don't count. */
function noteWeak(full, s, g) {
  const P = S.songs,
    id = full.id,
    st = coach && !coach.done ? coach.plan[coach.i] : null;
  if (/[@:]/.test(id) || coach?.solo || st?.def || (st && !["join", "run", "full"].includes(st.kind))) return;
  const at = standAt(),
    was = P.weak[id];
  if (was && g.accuracy >= 0.9 && was.from >= at && was.to <= at + s.barLens.length - 1) delete P.weak[id];
  const w = g.accuracy >= 0.4 && opts().pct >= 75 && worstBars(s, g.notes);
  if (!w) return;
  P.weak[id] = { from: w.from + at, to: w.to + at, at: barsWord(full, w.from + at, w.to + at), pitch: w.pitch, s: w.score, d: dayKey(), t: full.title };
  Object.entries(P.weak).sort((a, b) => (a[1].d < b[1].d ? 1 : -1)).slice(WEAK_KEPT).forEach(([k]) => delete P.weak[k]);
  save();
}

/* Level work: a technique drill counts at full speed; a sight-read counts only the first time you play that piece. */
function noteLevel(s, acc) {
  const st = !coach && opts().pct === 100 && strandOf(s.id);
  if (!st) return;
  const L = (S.songs.lv[GUITAR_PATH[st.k].course] ||= { t: [], r: 0, e: 0, rt: "" });
  if (st.kind === "tech") L.t[st.i] = Math.max(L.t[st.i] || 0, acc);
  else if (st.kind === "read" && L.rt !== s.id) ((L.rt = s.id), (L.r = Math.max(L.r, acc)));
  save();
}

/* ----- loops that run by themselves, so the hands can stay on the guitar ----- */
let again = 0; // the next run is on its way
const goAgain = () => {
  again = setTimeout(() => {
    again = 0;
    togglePlay();
  }, AGAIN_MS);
};
/* The stretch moves on by itself, unless that was the end of it. */
function soloOn() {
  coachNext(false);
  if (!coach.done) goAgain();
}
function climbAfter(s, score) {
  const c = coach.climb,
    moved = climbPass(c, score),
    got = c.free ? "" : `${Math.round(score * 100)}%. `;
  coach.score = score;
  coach.note = `${got}${moved === "up" ? `Up to ${c.pct}%.` : moved === "down" ? `Back down to ${c.pct}%. Slow is how it gets fast.` : c.over ? "" : c.clean ? `Clean. ${c.need - c.clean} more at this speed.` : "Again at this speed."}`;
  if (c.over) return soloOn();
  goAgain();
}
function fixStart() {
  const full = byId[S.songs.cur],
    s = onStand(full),
    w = res && res.song === s.id && worstBars(s, res.g.notes),
    at = standAt();
  if (!w) return;
  coach = { ...soloCoach("fix", full, fixPlan(full, w.from + at, w.to + at, w.pitch), coach), before: w.score };
  res = null;
  render();
  togglePlay();
}

/* ----- echo: the app plays a few notes, you play them back by ear ----- */
const ECHO_GAP = 0.62; // seconds between the notes of a phrase
let echo = null; // { id, round, i: phrase, got: its notes found, miss: wrong notes, shown, played, ok, msg, right: [first time], from: when to listen, off, done }
function echoState() {
  if (echo?.id === S.songs.cur) return echo;
  echoQuiet();
  const round = echoById(S.songs.cur);
  return (echo = round && { id: round.id, round, i: 0, got: 0, miss: 0, shown: false, played: false, ok: false, msg: "", right: [], from: Infinity, off: null, done: false });
}
function echoQuiet() {
  if (echo?.off) (echo.off(), (echo.off = null));
}
const noteName = (x) => x.tok.replace(/-?\d+$/, "").replace("#", "♯").replace(/(.)b/, "$1♭");
async function echoPlay() {
  const e = echo;
  if (!e || e.done) return;
  await audioReady();
  const ph = e.round.phrases[e.i],
    t0 = ctx.currentTime + 0.08;
  ph.forEach((x, j) => tone(x.m - 12, t0 + j * ECHO_GAP, 0.75, 0.3, "triangle", true));
  e.from = t0 + (ph.length - 1) * ECHO_GAP + 0.45; // the microphone must not take the app's own notes for yours
  e.played = true;
  e.msg = "";
  render();
}
function onEcho(ev) {
  const e = echo;
  if (!e || e.done || e.ok || !e.played || ev.t < e.from || e.got >= e.round.n) return;
  const r = waitStep(ev, e.round.phrases[e.i][e.got].m, ctx.sampleRate);
  if (r === "hit") e.got++;
  else if (r === "wrong") ((e.miss++), (e.msg = `Heard ${NAMES[ev.m % 12]}: not that one. Listen again if you need to.`));
  else return;
  if (e.got === e.round.n) return echoMark(!e.miss && !e.shown);
  render();
}
/* A phrase finished: right first time or not, then on to the next one. */
function echoMark(first) {
  const e = echo;
  e.right[e.i] = first;
  e.ok = true;
  e.msg = first ? "Right first time." : "Got it.";
  render();
  setTimeout(() => echo === e && e.ok && echoNext(), 1300);
}
function echoNext() {
  const e = echo;
  Object.assign(e, { i: e.i + 1, got: 0, miss: 0, shown: false, played: false, ok: false, msg: "", from: Infinity });
  if (e.i < EAR_ROUND) {
    render();
    return setTimeout(() => echo === e && !e.played && echoPlay(), 500); // hands stay on the guitar
  }
  const score = e.right.filter(Boolean).length / EAR_ROUND,
    L = (S.songs.lv[GUITAR_PATH[e.round.k].course] ||= { t: [], r: 0, e: 0, rt: "" });
  L.e = Math.max(L.e, score);
  S.xp += 10;
  e.done = true;
  echoQuiet();
  save();
  render();
}
function echoAct(k) {
  const e = echo;
  if (!e) return;
  if (k === "play") return echoPlay();
  if (k === "show") ((e.shown = true), (e.msg = ""));
  if (k === "had") return echoMark(true);
  if (k === "next") return e.ok || e.shown ? (e.ok || (e.right[e.i] = false), echoNext()) : undefined;
  if (k === "again") {
    S.songs.cur = `eo:${e.round.k}:${1 + Math.floor(Math.random() * 999)}`;
    save();
  }
  render();
}
function renderEcho() {
  const e = echoState();
  if (!e) {
    S.songs.cur = null;
    return renderList();
  }
  if (listen.on && !e.off && !e.done) e.off = onNote(onEcho);
  const k = e.round.k,
    best = S.songs.lv[GUITAR_PATH[k].course]?.e || 0,
    top = `${header()}<div class="card prac"><div class="pr-now"><div><h2>Echo by ear</h2><p class="pr-sub">Stage ${k + 1}, ${esc(GUITAR_PATH[k].title)} · ${e.round.n} notes at a time</p></div><button class="tg" data-sp="back">← All songs</button></div>`;
  if (e.done) {
    const n = e.right.filter(Boolean).length,
      pass = n / EAR_ROUND >= LEVEL_PASS;
    app.innerHTML = `${top}<div class="sc-card" id="sg-coach"><h3>${n} of ${EAR_ROUND} right first time</h3><p>${pass ? `That passes the ear test for stage ${k + 1}.` : `${Math.ceil(LEVEL_PASS * EAR_ROUND)} of ${EAR_ROUND} passes. Every round has new phrases, so another go is a fresh test.`}${best > n / EAR_ROUND ? ` Your best is ${Math.round(best * EAR_ROUND)}.` : ""}</p><div class="sc-acts"><button class="go" data-eo="again">Another round</button> <button class="rs" data-sp="back">Back to the path</button></div></div></div>`;
    return;
  }
  const ph = e.round.phrases[e.i],
    slot = (x, j) => {
      const seen = j === 0 || j < e.got || e.shown || e.ok;
      return `<span class="eo-n${j < e.got ? " got" : ""}${j === e.got && e.played && !e.shown && !e.ok ? " on" : ""}">${seen ? `<b>${noteName(x)}</b><small>${placeOf(x)}</small>` : "<b>?</b>"}</span>`;
    },
    say = e.msg || (!e.played ? `Press Play and listen. Then play the notes back on your guitar, in your own time. The first one is shown to start you off.` : e.shown ? (listen.on ? "There it is. Play it through, then move on." : "Was that what you played?") : listen.on ? `Your turn: play the ${e.round.n} notes back.` : "Your turn: play them back, then press Show me to check."),
    acts = e.ok
      ? `<button class="go" data-eo="next">Next →</button>`
      : e.shown && !listen.on
        ? `<button class="go" data-eo="had">I had it</button> <button class="rs" data-eo="next">Not yet</button>`
        : `<button class="go" data-eo="play">${e.played ? "▶ Hear it again" : "▶ Play"}</button> ${e.shown ? `<button class="rs" data-eo="next">Next →</button>` : e.played ? `<button class="rs" data-eo="show">Show me</button>` : ""}`;
  app.innerHTML = `${top}<p class="pr-sub">The app plays a short phrase and you play it back by ear: the most direct way to connect what you hear to where it is on the neck. ${Math.ceil(LEVEL_PASS * EAR_ROUND)} of ${EAR_ROUND} right first time passes.${best ? ` Your best: ${Math.round(best * EAR_ROUND)} of ${EAR_ROUND}.` : ""}</p>${listenPanel()}<div class="sc-steps" aria-label="Phrase ${e.i + 1} of ${EAR_ROUND}">${Array.from({ length: EAR_ROUND }, (_, j) => `<i class="${j < e.i ? "d" : j === e.i ? "n" : ""}"></i>`).join("")}</div><div class="eo-row">${ph.map(slot).join("")}</div><p class="sg-say" role="status">${say}</p><div class="sc-acts">${acts}</div><small>Space plays the phrase again. ${listen.on ? "Any octave counts." : "Turn on the microphone and it checks each note for you."}</small></div>`;
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
  /* a groove on loop: the next take, built now and shown as it starts */
  next: () => {
    const id = S.songs.cur;
    if (coach || !S.songs.vary || !isGroove(id) || id.includes("@")) return null;
    const nx = nextTake(id);
    return byId[nx] || (byId[nx] = build(grooveById(nx)));
  },
  swap: (nx) => {
    S.songs.cur = nx.id;
    res = null;
    save();
    render();
    followStart(nx);
  },
  end: () => {
    songStop();
    clearHot();
    followEnd();
    if (coach?.climb) climbAfter(s, 1);
    else if (coach && opts().mode === "hear") {
      coachPass();
      if (coach.solo) return soloOn();
    }
    if (document.querySelector("#sg-wrap") || document.querySelector("#sg-lane")) render();
  },
});
export function stopSongs() {
  echoQuiet();
  clearTimeout(again);
  again = 0;
  if (along) (along.off(), (along = null));
  if (wait) (wait.off(), (wait = null));
  followEnd();
  if (!songBusy()) return;
  songStop();
  clearHot();
}
function togglePlay() {
  if (isEcho(S.songs.cur)) return echoAct("play");
  const s = byId[S.songs.cur] && onStand(byId[S.songs.cur]);
  if (!s) return;
  if (songBusy() || wait || again) {
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
  if (k === "cslow") {
    const c = coach.climb;
    c.pct = Math.max(c.floor, c.pct - c.step);
    c.clean = 0;
    coach.note = `Down to ${c.pct}%.`;
    const e = document.querySelector("#sg-coach [role=status]");
    if (e) e.textContent = coach.note; // the run in progress keeps playing
    return;
  }
  stopSongs();
  if (k === "pnext") {
    coach = null;
    res = null;
    P.cur = null;
    return emit("plan-next");
  }
  if (k === "fix") return fixStart();
  if (k === "peek") {
    peek = peek === P.cur ? null : P.cur;
    return render();
  }
  if (k === "rhythmfirst") {
    S.read.level = +v || 1;
    save();
    return emit("open-page", "games");
  }
  if (k === "take") {
    P.cur = isLadder(P.cur) ? nextLine(P.cur) : nextTake(P.cur);
    res = null;
    save();
    return render();
  }
  if (k === "climb") {
    coach = speedCoach(byId[P.cur], 0, byId[P.cur].barLens.length - 1);
    res = null;
    return render();
  }
  if (k === "cfree") {
    coach.climb.free = true;
    coach.note = "";
    res = null;
    render();
    return togglePlay();
  }
  if (k === "cstart") return coachStart(byId[P.cur]);
  if (k === "clesson") return coachStart(byId[P.cur], +v);
  if (k === "cgo") {
    coach.rest = 0;
    return render();
  }
  if (k === "cnext") return coachNext(false);
  if (k === "cskip") return coachNext(true);
  if (k === "cquit") {
    const wasReplay = coach?.replay;
    if (coach?.prior) {
      coach = { ...coach.prior, passed: false, score: undefined };
      res = null;
      return render();
    }
    coach = null;
    res = null;
    if (String(P.cur).startsWith("chg:") || wasReplay) P.cur = null; // a drill goes back to the list it came from
    if (wasReplay) P.style = "repertoire";
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
  else if (["click", "notes", "countIn", "loop", "vary", "lyrics", "names"].includes(k)) P[k] = !P[k];
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
  if (k === "csize") P.size = v;
  if (k === "replay") {
    P.cur = v;
    queued = { id: v, kind: "replay" };
    coach = null;
    res = null;
    save();
    render();
    return window.scrollTo(0, 0);
  }
  if (k === "genrun") {
    P.cur = `chg:${generateRun(P.size, CHANGE_USE, ++P.runSeed).join(",")}:4:66`;
    coach = null;
    res = null;
    save();
    render();
    return window.scrollTo(0, 0);
  }
  if (k === "lvopen") {
    const [st, kind, i] = v.split(":"),
      w = LEVEL_WORK[+st],
      take = 1 + Math.floor(Math.random() * 999);
    if (!w) return;
    P.cur = kind === "ear" ? `eo:${st}:${take}` : kind === "read" ? `rd:${+st + 1}:${take}` : withTake(w.tech[+i].id, take);
    if (kind !== "ear") ((P.mode = "along"), (P.pct = 100));
    coach = null;
    res = null;
    save();
    render();
    return window.scrollTo(0, 0);
  }
  if (k === "rdopen") {
    P.cur = `rd:${+v}:${1 + Math.floor(Math.random() * 999)}`;
    P.mode = "along";
    P.pct = 100;
    coach = null;
    res = null;
    save();
    render();
    return window.scrollTo(0, 0);
  }
  if (k === "gxopen") {
    P.cur = exId(P.ex, 1 + Math.floor(Math.random() * 999));
    coach = null;
    res = null;
    save();
    render();
    return window.scrollTo(0, 0);
  }
  if (k === "cad") {
    const on = new Set(P.ex.cads);
    on.has(v) ? on.size > 1 && on.delete(v) : on.add(v); // at least one kind of ending stays
    P.ex.cads = [...CAD_ORDER].filter((c) => on.has(c)).join("");
  } else if (k === "openskill") {
    P.style = "skills";
    P.skill = v;
  } else if (k === "style") P.style = v;
  else if (k === "level") P.level = +v;
  else if (k === "speed") P.speed = v;
  else if (k === "skill") P.skill = v;
  else if (["pos", "beats", "tempo", "len"].includes(k)) P.ex[k] = +v;
  else P.ex[k] = v;
  save();
  render();
}

export function mountSongs() {
  screen("songs", () => (!S.songs.cur ? renderList() : isEcho(S.songs.cur) ? renderEcho() : renderPlayer()));
  action("eo", (D) => echoAct(D.eo));
  on("open-song", (id, step) => {
    stopSongs();
    S.songs.cur = id;
    queued = step ? { ...step, id } : null;
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
export const songsDebug = () => ({
  res,
  along,
  wait,
  coach,
  /* A graded run with no microphone: a state for each note on the stand. */
  run(state) {
    const s = onStand(byId[S.songs.cur]),
      notes = s.sounding.map((_, i) => ({ state: state(i, s), dt: 0 }));
    graded(s, { notes, extras: [], ...summary(notes, []) });
    render();
  },
});
