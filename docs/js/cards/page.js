/* The Flash Cards page: deck chips, board regions, the card itself, and the clicks that answer it. */
import { S, ui, save, resetProgress } from "../core/store.js";
import { LET, LSEM, NAMES } from "../core/theory.js";
import { DK, GR, REGIONS, activeRegions, cardInRegion, deckKeys } from "../core/decks.js";
import { play } from "../core/audio.js";
import { mic, micBox, micHooks, toggleMic } from "../core/mic.js";
import { midiBox, midiReady } from "../piano/midi.js";
import { action, render, screen } from "../core/bus.js";
import { app } from "../core/dom.js";
import { header } from "../view/chrome.js";
import { GC, GN, bag, fin, grp, next, scoped } from "./scheduler.js";
import { isMine, sanitizeMine, toggleMine } from "./mine.js";
import { findLesson, lessonOfCard } from "../courses/curriculum.js";

/* Make a saved state safe to use: keep only decks that exist, valid regions and a valid mode.
   Returns true when something was dropped so the caller can save the cleaned state. */
export function sanitizeCards() {
  const known = Object.values(GR).flat(),
    act = (Array.isArray(S.act) ? S.act : []).filter((d) => known.includes(d));
  let changed = !Array.isArray(S.act) || act.length !== S.act.length || !act.length;
  S.act = act.length ? act : ["staff", "fretNote"];
  // Board regions being practised (ids from REGIONS); empty means the whole board.
  S.regions = (Array.isArray(S.regions) ? S.regions : []).filter((id) => REGIONS.some((r) => r.id === id));
  if (![80, 100, 120].includes(S.tempo)) S.tempo = 100;
  // "bag" = shuffle bag, every card equally likely (default); "srs" = spaced repetition
  if (S.mode !== "bag" && S.mode !== "srs") S.mode = "bag";
  delete S.randomize;
  if (sanitizeMine()) changed = true;
  // Drop saved cards that no longer exist (e.g. open-string cards removed from the decks).
  for (const k of Object.keys(S.it)) {
    const d = k.slice(0, k.indexOf(":"));
    if (d === "lq" ? !S.mine.includes(k) : !DK[d] || !DK[d].includes(k)) {
      delete S.it[k];
      changed = true;
    }
  }
  return changed;
}

function answers(q) {
  const c = ui.cur,
    attr = (v) => String(v).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;"),
    b = (cls, att, t, dis) => `<button class="${cls}" ${att} ${dis ? "disabled" : ""}>${t}</button>`,
    dn = c.done;
  const A = (v, t) => b(dn ? (q.ok(v) ? "ok" : c.ch === String(v) ? "bad" : "") : "", `data-a="${attr(v)}"`, t, dn);
  if (q.kind == "let") return `<div class="g7">${LET.map((l, i) => A(LSEM[i], l)).join("")}</div>`;
  if (q.kind == "tapAll") return `<button class="go" data-check>Check all ${c.sel.size} selected</button>`;
  if (q.kind == "pc12") return `<div class="g4">${(q.labels || NAMES).map((n, i) => A(i, n)).join("")}</div>`;
  if (q.kind == "mc") return `<div class="g2">${q.ch.map((x) => A(x, x)).join("")}</div>`;
  if (q.kind == "multi")
    return (
      `<div class="g4">${NAMES.map((n, i) => b(dn ? (q.exp.has(i) ? "ok" : c.sel.has(i) ? "bad" : "") : c.sel.has(i) ? "on" : "", `data-t="${i}"`, n, dn)).join("")}</div>` +
      (dn ? "" : '<button class="go" data-check>Check</button>')
    );
  return "";
}

// "Board" chips: limit practice (and the part of the neck that is drawn) to some 6-fret regions.
function regionChips() {
  if (S.onlyMine || !S.act.some((d) => ["staff", "staffFret", "fretNote", "findFret", "tapAll"].includes(d))) return "";
  const on = activeRegions();
  return `<div class="chips regions" role="group" aria-label="Practise only part of the fretboard"><span class="tag">BOARD</span><button data-region="all" class="${on.length ? "" : "a"}" aria-pressed="${!on.length}">All</button>${REGIONS.map((r) => `<button data-region="${r.id}" class="${on.includes(r) ? "a" : ""}" aria-pressed="${on.includes(r)}">${r.name} <small>${r.min}–${r.max}</small></button>`).join("")}</div>`;
}

function card() {
  const cur = ui.cur;
  if (!cur) return '<div class="card">Pick at least one deck above.</div>';
  const q = cur.q,
    d = cur.done,
    tag = S.onlyMine ? "MY DECK" : cur.lesson ? "NEW · TAKE A GUESS" : cur.bag ? `SHUFFLE · ${bag.cards.length} LEFT IN BAG` : cur.prac ? "FREE GRIND" : GN[grp(S.it[cur.k].s)].toUpperCase();
  let h = `<div class="card"><div class="tag">${q.n.toUpperCase()} · ${tag}</div><div class="prompt">${q.p}</div>${q.vis(d, cur.tp)}`;
  h += answers(q);
  if (mic.err) h += `<div class="msg badm" role="alert">${mic.err}</div>`;
  if (mic.on && !d && q.mic) h += micBox();
  else if (midiReady() && !d && q.mic) h += midiBox(); // a connected MIDI keyboard answers too (piano/page.js)
  if (d) h += cur.ok ? '<div class="msg good" role="status">✓ Correct</div>' : `<div class="msg badm" role="status">✗ ${q.rev}</div><button class="go" data-next>Next →</button>`;
  return h + tools(cur) + "</div>";
}

/* Under every card: keep it in My deck, and jump to the lesson that teaches it. */
function tools(cur) {
  const inDeck = isMine(cur.k),
    ls = lessonOfCard(cur.k),
    l = ls && findLesson(ls.track, ls.id);
  return `<div class="cd-tools"><button class="mine${inDeck ? " on" : ""}" data-mine-save="${cur.k}" aria-pressed="${inDeck}">${inDeck ? "★ In my deck" : "☆ Save to my deck"}</button>${l ? `<button class="lessonlink" data-learn-lesson="${ls.track}:${ls.id}">${l.id} · ${l.title}</button>` : ""}</div>`;
}

/* How well a group of decks is known: share of its cards past the Apprentice stage. */
function groupStats(g, now) {
  const keys = GR[g].flatMap(deckKeys);
  let seen = 0,
    known = 0,
    due = 0;
  for (const k of keys) {
    const v = S.it[k];
    if (!v) continue;
    seen++;
    if (grp(v.s) > 0) known++;
    if (v.seen && v.s < 9 && v.due <= now) due++;
  }
  return { all: keys.length, seen, known, due };
}
const BLURB = { Reading: "Notes, key signatures and intervals on the staff", Fretboard: "Every note, on every string", "Tap all": "Find one note everywhere it appears", Chords: "Spell chords and name their shapes", Scales: "Spell scales and modes", Listening: "Intervals and chords by ear" };

function cardHome() {
  const now = Date.now(),
    rows = Object.keys(GR).map((g) => ({ g, ...groupStats(g, now), on: !S.onlyMine && GR[g].some((x) => S.act.includes(x)) })),
    due = rows.filter((r) => r.on).reduce((a, r) => a + r.due, 0),
    known = rows.reduce((a, r) => a + r.known, 0),
    total = rows.reduce((a, r) => a + r.all, 0);
  app.innerHTML = `${header()}<div class="cd-home"><h1>Flash cards</h1><p class="pr-sub">A few minutes a day, away from the instrument if you like. Separate from your courses: nothing here is required.</p>
    <section class="card cd-hero"><div><b>${S.mode === "bag" ? "Shuffle bag" : due ? `${due} due` : "All caught up"}</b><small>${known} of ${total} cards known</small></div><button class="go" data-cd-go>${S.mode === "bag" || !due ? "Start studying" : "Review now"}</button></section>
    <h3 class="sg-lv">Decks</h3><div class="cd-decks">${rows
      .map((r) => `<button class="cd-deck${r.on ? " on-deck" : ""}" data-g="${r.g}" aria-pressed="${r.on}"><span class="cd-tick">${r.on ? "✓" : ""}</span><span class="cd-name"><b>${r.g}</b><small>${BLURB[r.g] || ""}</small><i class="ln-bar"><i style="width:${(100 * r.known) / (r.all || 1)}%"></i></i></span><small>${r.known} / ${r.all}</small></button>`)
      .join("")}</div>
    ${S.mine.length ? `<button class="cd-deck${S.onlyMine ? " on-deck" : ""}" data-mine-mode><span class="cd-tick">${S.onlyMine ? "✓" : ""}</span><span class="cd-name"><b>★ My deck</b><small>Cards and lesson questions you saved</small></span><small>${S.mine.length}</small></button>` : ""}
    <h3 class="sg-lv">How to study</h3><div class="chips"><button data-rand class="${S.mode === "bag" ? "a" : ""}">Shuffle bag</button><button data-rand class="${S.mode === "bag" ? "" : "a"}">Spaced repetition</button></div><p class="pr-sub">${S.mode === "bag" ? "Every card once per round, in random order." : "Cards come back when you are about to forget them."}</p>
    ${regionChips()}
    <button class="rs" data-reset>${ui.rs ? "Tap again to erase all progress" : "Reset progress"}</button></div>`;
}

function renderCards() {
  if (ui.cardView !== "session") return cardHome();
  const n = Date.now(),
    c = [0, 0, 0, 0, 0];
  let due = 0;
  for (const [k, v] of Object.entries(S.it)) {
    c[grp(v.s)]++;
    if (scoped(k) && v.seen && v.s < 9 && v.due <= n) due++;
  }
  const chips = Object.keys(GR)
    .map((g) => {
      const have = GR[g].reduce((a, d) => a + deckKeys(d).filter((k) => S.it[k]).length, 0),
        all = GR[g].reduce((a, d) => a + deckKeys(d).length, 0);
      return `<button data-g="${g}" class="${GR[g].some((x) => S.act.includes(x)) ? "a" : ""}">${g} ${have}/${all}</button>`;
    })
    .join("");
  const decksOn = S.onlyMine ? "My deck" : Object.keys(GR).filter((g) => GR[g].some((x) => S.act.includes(x))).join(", ") || "No decks";
  app.innerHTML = `<div class="ln-top cd-top"><button class="ln-x" data-cd-exit aria-label="Finish studying">✕</button><div><div class="tag">FLASH CARDS</div><b>${decksOn}</b></div><small>${S.mode === "bag" ? "Shuffle" : `${due} due`}</small></div>${card()}<div class="chips cd-live"><button data-mic class="${mic.on ? "a" : ""}">${mic.on ? "Mic on" : "Answer by playing"}</button><button data-snd class="${S.mute ? "" : "a"}">${S.mute ? "Sound off" : "Sound on"}</button></div>`;
}

/* Clicks on this page. Answering clicks only count while a card is open and unanswered. */
export function mountCards() {
  screen("cards", renderCards);
  action("cdGo", () => {
    ui.cardView = "session";
    next();
  });
  action("cdExit", () => {
    ui.cardView = "home";
    if (mic.on) toggleMic();
    render();
  });
  micHooks.correct = () => fin(true);

  const live = (fn) => (D) => {
    if (!ui.cur) return;
    ui.rs = 0;
    fn(D, ui.cur, ui.cur.q);
  };
  const open = (fn) => live((D, cur, q) => !cur.done && fn(D, cur, q));

  action("mic", () => toggleMic());
  action("play", () => ui.cur && play(ui.cur.q));
  action("rand", () => {
    S.mode = S.mode === "bag" ? "srs" : "bag";
    save();
    next();
  });
  action("g", (D) => {
    S.onlyMine = 0;
    const ds = GR[D.g],
      on = ds.some((x) => S.act.includes(x));
    if (on) {
      const r = S.act.filter((x) => !ds.includes(x));
      if (!r.length) return; // always keep at least one deck
      S.act = r;
    } else S.act.push(...ds);
    save();
    next();
  });
  action("mineSave", (D) => {
    toggleMine(D.mineSave);
    if (!S.mine.length && S.onlyMine) S.onlyMine = 0;
    render();
  });
  action("mineMode", () => {
    if (!S.mine.length) return;
    S.onlyMine = S.onlyMine ? 0 : 1;
    save();
    next();
  });
  action("region", (D) => {
    if (D.region === "all") S.regions = [];
    else {
      const on = new Set(S.regions);
      on.has(D.region) ? on.delete(D.region) : on.add(D.region);
      S.regions = REGIONS.filter((r) => on.has(r.id)).map((r) => r.id); // keep board order
      if (S.regions.length === REGIONS.length) S.regions = []; // all four = the whole board
    }
    save();
    next();
  });
  action("reset", () => {
    if (!ui.rs) {
      ui.rs = 1;
      return render();
    }
    resetProgress(); // keeps decks and preferences (mode, sound, tempo, song)
    ui.rs = 0;
    ui.retry = [];
    bag.cards = [];
    save();
    next();
  });
  action("micskip", live(() => fin(false)));
  action("next", live(() => next()));
  action("a", open((D, cur, q) => {
    cur.ch = D.a;
    fin(q.ok(q.kind == "mc" ? D.a : +D.a));
  }));
  action("t", open((D, cur) => {
    const i = +D.t;
    cur.sel.has(i) ? cur.sel.delete(i) : cur.sel.add(i);
    render();
  }));
  action("check", open((D, cur, q) => {
    if (q.kind == "tapAll") {
      const got = new Set(cur.sel);
      return fin(got.size === q.expected.length && q.expected.every(([st, f]) => got.has(st + "." + f)), [...got]);
    }
    fin(cur.sel.size == q.exp.size && [...cur.sel].every((x) => q.exp.has(x)));
  }));
  action("s", open((D, cur, q) => {
    if (q.kind == "tapAll") {
      const key = D.s + "." + D.f;
      cur.sel.has(key) ? cur.sel.delete(key) : cur.sel.add(key);
      return render();
    }
    if (q.kind == "tap") fin(q.ok(+D.s, +D.f), [+D.s, +D.f]);
  }));
}
