const HR = 36e5,
  IV = [0, 4 * HR, 8 * HR, 24 * HR, 48 * HR, 168 * HR, 336 * HR, 720 * HR, 2880 * HR, 9e15];
const grp = (s) => (s < 5 ? 0 : s < 7 ? 1 : s < 8 ? 2 : s < 9 ? 3 : 4),
  GN = ["Apprentice", "Guru", "Master", "Enlightened", "Burned"],
  GC = ["#e0508f", "#8b5bd6", "#3b7fe0", "#19a0c9", "#7d7a74"];
let S,
  cur,
  cnt = 0,
  retry = [],
  tm,
  rs = 0,
  last = "",
  page = "cards",
  scoreRun = null;
const app = document.getElementById("app");
try {
  S = JSON.parse(localStorage.getItem("fg1"));
} catch (e) {}
if (!S || !S.it) S = { it: {}, act: ["staff", "fretNote"], xp: 0, st: 0, best: 0 };
const migrateRhythm = S.act.includes("rhythm");
if (migrateRhythm) {
  S.act = S.act.filter((x) => x !== "rhythm");
  if (!S.act.length) S.act = ["staff", "fretNote"];
}
if (![80, 100, 120].includes(S.tempo)) S.tempo = 100;
// Practice modes: "bag" (shuffle bag, every card equally likely) or "srs" (spaced repetition). Bag is the default.
if (S.mode !== "bag" && S.mode !== "srs") S.mode = "bag";
delete S.randomize;
const save = () => {
  try {
    localStorage.setItem("fg1", JSON.stringify(S));
  } catch (e) {}
};
// Drop saved cards that no longer exist (e.g. open-string cards removed from the decks).
let pruned = false;
for (const k of Object.keys(S.it)) {
  const d = k.slice(0, k.indexOf(":"));
  if (DK[d] && !DK[d].includes(k)) {
    delete S.it[k];
    pruned = true;
  }
}
if (migrateRhythm || pruned) save();

const MAX_LEARNING = 20, // how many not-yet-learned cards can be in rotation at once
  INTRO_WINDOW = 8, // new cards are drawn at random from the next N in a deck
  FREE_GRIND_POOL = 30; // when nothing is due, practise a random one of the N weakest cards

let bag = [], // cards still to be drawn in the current bag
  bagSig = ""; // which decks the bag was built from

function pick() {
  const n = Date.now(),
    ent = Object.entries(S.it).filter(([k]) => S.act.includes(k.split(":")[0]));
  if (S.mode === "bag") {
    // Shuffle bag ("tetris" style): every card in the enabled decks once per round, in random order.
    const sig = [...S.act].sort().join();
    if (sig !== bagSig) {
      bag = [];
      bagSig = sig;
    }
    if (!bag.length) {
      bag = shuf(S.act.flatMap((d) => DK[d] || []));
      const e = bag.length - 1;
      if (e > 0 && bag[e] === last) [bag[0], bag[e]] = [bag[e], bag[0]]; // no repeat across a refill
    }
    if (!bag.length) return null;
    const k = bag.pop();
    if (!S.it[k]) S.it[k] = { s: 0, due: 0, seen: 0 };
    save();
    return { k, prac: 1, bag: 1 };
  }
  const ri = retry.findIndex((r) => r.at <= cnt && S.it[r.k] && S.act.includes(r.k.split(":")[0]));
  if (ri >= 0) return { k: retry.splice(ri, 1)[0].k };
  const un = ent.find(([k, v]) => !v.seen);
  if (un) return { k: un[0], lesson: 1 };
  const due = ent.filter(([k, v]) => v.s < 9 && v.due <= n && k !== last);
  if (due.length) return { k: due[(Math.random() * due.length) | 0][0] };
  if (ent.filter(([k, v]) => v.s < 5).length < MAX_LEARNING) {
    const c = S.act
      .map((d) => [d, DK[d].filter((k) => !S.it[k])])
      .filter((x) => x[1].length)
      .sort((a, b) => DK[a[0]].length - a[1].length - (DK[b[0]].length - b[1].length));
    if (c.length) {
      // pick randomly from the next few unseen cards (still easiest-first) instead of always the first
      const win = c[0][1].slice(0, INTRO_WINDOW),
        k = win[(Math.random() * win.length) | 0];
      S.it[k] = { s: 0, due: 0, seen: 0 };
      save();
      return { k, lesson: 1 };
    }
  }
  const pool = ent
    .filter(([k]) => k !== last)
    .sort((a, b) => a[1].s - b[1].s)
    .slice(0, FREE_GRIND_POOL);
  return pool.length ? { k: pool[(Math.random() * pool.length) | 0][0], prac: 1 } : null;
}
function next() {
  clearTimeout(tm);
  const p = pick();
  cnt++;
  micHold = performance.now() + MIC_HOLD_MS;
  if (!p) {
    cur = null;
    return render();
  }
  last = p.k;
  cur = { k: p.k, q: Q(p.k), lesson: p.lesson, prac: p.prac, bag: p.bag, sel: new Set(), done: 0 };
  render();
}
function fin(ok, tp) {
  if (cur.done) return;
  cur.done = 1;
  cur.ok = ok;
  cur.tp = tp;
  const it = S.it[cur.k],
    n = Date.now();
  it.seen = 1;
  if (ok) {
    S.xp += 10;
    S.st++;
    S.best = Math.max(S.best, S.st);
    if (!cur.prac) {
      it.s = Math.min(9, it.s + 1);
      it.due = n + IV[it.s];
    }
  } else {
    S.st = 0;
    it.s = it.s >= 5 ? it.s - 2 : Math.max(1, it.s - 1);
    it.due = n + IV[it.s];
    retry.push({ k: cur.k, at: cnt + 3 });
    // In bag mode a miss goes back into the bag a few draws from now, so it comes around again soon.
    if (cur.bag) bag.splice(Math.max(0, bag.length - 3 - ((Math.random() * 8) | 0)), 0, cur.k);
  }
  save();
  render();
  if (cur.q.kind !== "rhythm" && !(micOn && ok && cur.q.mic)) play(cur.q);
  if (ok) tm = setTimeout(next, cur.q.kind === "rhythm" ? 2200 : 900);
}
function ans(q) {
  const c = cur,
    b = (cls, att, t, dis) => `<button class="${cls}" ${att} ${dis ? "disabled" : ""}>${t}</button>`,
    dn = c.done;
  const A = (v, t) => b(dn ? (q.ok(v) ? "ok" : c.ch === String(v) ? "bad" : "") : "", `data-a="${v}"`, t, dn);
  if (q.kind == "let") return `<div class="g7">${LET.map((l, i) => A(LSEM[i], l)).join("")}</div>`;
  if (q.kind == "tapAll") return `<button class="go" data-check>Check all ${cur.sel.size} selected</button>`;
  if (q.kind == "pc12") return `<div class="g4">${(q.labels || NAMES).map((n, i) => A(i, n)).join("")}</div>`;
  if (q.kind == "mc") return `<div class="g2">${q.ch.map((x) => A(x, x)).join("")}</div>`;
  if (q.kind == "multi")
    return (
      `<div class="g4">${NAMES.map((n, i) => b(dn ? (q.exp.has(i) ? "ok" : c.sel.has(i) ? "bad" : "") : c.sel.has(i) ? "on" : "", `data-t="${i}"`, n, dn)).join("")}</div>` +
      (dn ? "" : '<button class="go" data-check>Check</button>')
    );
  return "";
}
function card() {
  if (!cur) return '<div class="card">Pick at least one deck above.</div>';
  const q = cur.q,
    d = cur.done;
  let h = `<div class="card"><div class="tag">${q.n.toUpperCase()} · ${cur.lesson ? "NEW · TAKE A GUESS" : cur.bag ? `SHUFFLE · ${bag.length} LEFT IN BAG` : cur.prac ? "FREE GRIND" : GN[grp(S.it[cur.k].s)].toUpperCase()}</div><div class="prompt">${q.p}</div>${q.vis(d, cur.tp)}`;

  h += ans(q);
  if (micErr) h += `<div class="msg badm" role="alert">${micErr}</div>`;
  if (micOn && !d && q.mic) h += micBox();
  if (d)
    h += cur.ok
      ? q.kind === "rhythm"
        ? `<div class="msg good" role="status">✓ ${q.rev}</div>`
        : '<div class="msg good" role="status">✓ Correct</div>'
      : `<div class="msg badm" role="status">✗ ${q.rev}</div><button class="go" data-next>Next →</button>`;
  return h + "</div>";
}
function render() {
  if (page === "games") {
    if (scoreRun) renderScore();
    else renderGames();
    return;
  }
  const n = Date.now(),
    c = [0, 0, 0, 0, 0];
  let due = 0;
  for (const [k, v] of Object.entries(S.it)) {
    c[grp(v.s)]++;
    if (S.act.includes(k.split(":")[0]) && v.seen && v.s < 9 && v.due <= n) due++;
  }
  app.innerHTML = `<header><span>🎸 Fret Grind</span><span>${S.xp} XP · 🔥${S.st} (best ${S.best})</span></header>${TOPNAV()}<div class="pills">${GN.map((g, i) => `<span style="background:${GC[i]}">${g} ${c[i]}</span>`).join("")}<span style="background:var(--mu)">Due ${due}</span></div><div class="chips">${Object.keys(
    GR,
  )
    .map(
      (g) =>
        `<button data-g="${g}" class="${GR[g].some((x) => S.act.includes(x)) ? "a" : ""}">${g} ${GR[g].reduce((a, d) => a + DK[d].filter((k) => S.it[k]).length, 0)}/${GR[g].reduce((a, d) => a + DK[d].length, 0)}</button>`,
    )
    .join(
      "",
    )}<button data-rand class="${S.mode === "bag" ? "a" : ""}" title="Switch between a shuffle bag (every card equally likely) and spaced repetition">${S.mode === "bag" ? "🎲 Shuffle bag" : "↻ Spaced repetition"}</button><button data-mic class="${micOn ? "a" : ""}">${micOn ? "🎤 Mic on" : "🎤 Listen"}</button><button data-snd class="${S.mute ? "" : "a"}">${S.mute ? "🔇 Sound off" : "🔊 Sound on"}</button></div>${card()}<button class="rs" data-reset>${rs ? "Tap again to erase all progress" : "Reset progress"}</button>`;
}
