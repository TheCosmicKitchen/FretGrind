/* The Flash Cards page: deck chips, board regions, the card itself, and the clicks that answer it. */
import { S, ui, save, resetProgress } from "../core/store.js";
import { LET, LSEM, NAMES } from "../core/theory.js";
import { DK, GR, REGIONS, activeRegions, cardInRegion, deckKeys } from "../core/decks.js";
import { play } from "../core/audio.js";
import { mic, micBox, micHooks, toggleMic } from "../core/mic.js";
import { action, render, screen } from "../core/bus.js";
import { app } from "../core/dom.js";
import { header } from "../view/chrome.js";
import { GC, GN, bag, fin, grp, next } from "./scheduler.js";

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
  // Drop saved cards that no longer exist (e.g. open-string cards removed from the decks).
  for (const k of Object.keys(S.it)) {
    const d = k.slice(0, k.indexOf(":"));
    if (!DK[d] || !DK[d].includes(k)) {
      delete S.it[k];
      changed = true;
    }
  }
  return changed;
}

function answers(q) {
  const c = ui.cur,
    b = (cls, att, t, dis) => `<button class="${cls}" ${att} ${dis ? "disabled" : ""}>${t}</button>`,
    dn = c.done;
  const A = (v, t) => b(dn ? (q.ok(v) ? "ok" : c.ch === String(v) ? "bad" : "") : "", `data-a="${v}"`, t, dn);
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
  if (!S.act.some((d) => ["staff", "staffFret", "fretNote", "findFret", "tapAll"].includes(d))) return "";
  const on = activeRegions();
  return `<div class="chips regions" role="group" aria-label="Practise only part of the fretboard"><span class="tag">BOARD</span><button data-region="all" class="${on.length ? "" : "a"}" aria-pressed="${!on.length}">All</button>${REGIONS.map((r) => `<button data-region="${r.id}" class="${on.includes(r) ? "a" : ""}" aria-pressed="${on.includes(r)}">${r.name} <small>${r.min}–${r.max}</small></button>`).join("")}</div>`;
}

function card() {
  const cur = ui.cur;
  if (!cur) return '<div class="card">Pick at least one deck above.</div>';
  const q = cur.q,
    d = cur.done,
    tag = cur.lesson ? "NEW · TAKE A GUESS" : cur.bag ? `SHUFFLE · ${bag.cards.length} LEFT IN BAG` : cur.prac ? "FREE GRIND" : GN[grp(S.it[cur.k].s)].toUpperCase();
  let h = `<div class="card"><div class="tag">${q.n.toUpperCase()} · ${tag}</div><div class="prompt">${q.p}</div>${q.vis(d, cur.tp)}`;
  h += answers(q);
  if (mic.err) h += `<div class="msg badm" role="alert">${mic.err}</div>`;
  if (mic.on && !d && q.mic) h += micBox();
  if (d) h += cur.ok ? '<div class="msg good" role="status">✓ Correct</div>' : `<div class="msg badm" role="status">✗ ${q.rev}</div><button class="go" data-next>Next →</button>`;
  return h + "</div>";
}

function renderCards() {
  const n = Date.now(),
    c = [0, 0, 0, 0, 0];
  let due = 0;
  for (const [k, v] of Object.entries(S.it)) {
    c[grp(v.s)]++;
    if (S.act.includes(k.split(":")[0]) && cardInRegion(k) && v.seen && v.s < 9 && v.due <= n) due++;
  }
  const chips = Object.keys(GR)
    .map((g) => {
      const have = GR[g].reduce((a, d) => a + deckKeys(d).filter((k) => S.it[k]).length, 0),
        all = GR[g].reduce((a, d) => a + deckKeys(d).length, 0);
      return `<button data-g="${g}" class="${GR[g].some((x) => S.act.includes(x)) ? "a" : ""}">${g} ${have}/${all}</button>`;
    })
    .join("");
  app.innerHTML = `${header()}<div class="pills">${GN.map((g, i) => `<span style="background:${GC[i]}">${g} ${c[i]}</span>`).join("")}<span style="background:var(--mu)">Due ${due}</span></div><div class="chips">${chips}<button data-rand class="${S.mode === "bag" ? "a" : ""}" title="Switch between a shuffle bag (every card equally likely) and spaced repetition">${S.mode === "bag" ? "🎲 Shuffle bag" : "↻ Spaced repetition"}</button><button data-mic class="${mic.on ? "a" : ""}">${mic.on ? "🎤 Mic on" : "🎤 Listen"}</button><button data-snd class="${S.mute ? "" : "a"}">${S.mute ? "🔇 Sound off" : "🔊 Sound on"}</button></div>${regionChips()}${card()}<button class="rs" data-reset>${ui.rs ? "Tap again to erase all progress" : "Reset progress"}</button>`;
}

/* Clicks on this page. Answering clicks only count while a card is open and unanswered. */
export function mountCards() {
  screen("cards", renderCards);
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
