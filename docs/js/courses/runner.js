/* Asking questions inside lessons, tests and reviews.

   A question spec is either
     { p, a: [options], c: index of the right option, why, fig }   a multiple-choice question written in the lesson, or
     { card: "staff:64" }                                          a flash-card question (see cards/questions.js)
   build(spec) turns it into a ready question; a "run" is a list of them plus where you are.
   Nothing here touches the flash-card state (ui.cur, S.it): lessons keep their own. */
import { NAMES, shuf } from "../core/theory.js";
import { drillScope } from "../core/decks.js";
import { Q } from "../cards/questions.js";
import { figure } from "./figures.js";

/* Flash-card questions we can show: one answer from a list, one tap on the neck, or a set of notes. */
export const CARD_KINDS = ["pc12", "mc", "tap", "multi"];

export function build(spec) {
  if (spec.card) {
    return drillScope(() => {
      const q = Q(spec.card);
      if (!CARD_KINDS.includes(q.kind)) throw new Error("lessons can't use " + q.kind + " cards: " + spec.card);
      const out = { spec, kind: q.kind, p: q.p, card: q, snd: q.snd, gap: q.gap, rev: q.rev };
      if (q.kind === "pc12") {
        out.opts = q.labels || NAMES;
        out.ok = (v) => q.ok(v);
        out.right = out.opts.findIndex((_, i) => q.ok(i));
      } else if (q.kind === "mc") {
        out.opts = q.ch;
        out.ok = (v) => q.ok(q.ch[v]);
        out.right = q.ch.findIndex((x) => q.ok(x));
      } else if (q.kind === "multi") {
        out.opts = NAMES;
        out.exp = q.exp;
      }
      return out;
    });
  }
  const order = shuf(spec.a.map((_, i) => i)),
    right = order.indexOf(spec.c);
  return {
    spec,
    kind: "mc",
    p: spec.p,
    opts: order.map((i) => spec.a[i]),
    right,
    ok: (v) => v === right,
    rev: spec.why ? `${spec.a[spec.c]} — ${spec.why}` : spec.a[spec.c],
    fig: spec.fig,
  };
}

/* A run: the questions, which one is on screen, and what has been answered. */
export function newRun(specs) {
  return { qs: specs.map(build), i: 0, got: [], sel: new Set(), tap: null, pick: undefined, done: false };
}
export const cur = (run) => run.qs[run.i];
export const finished = (run) => run.i >= run.qs.length;
export const score = (run) => {
  const right = run.got.filter((g) => g.ok).length;
  return { right, total: run.qs.length, pct: run.qs.length ? Math.round((100 * right) / run.qs.length) : 100 };
};

/* Record an answer to the current question. v: option index (mc/pc12), [string, fret] (tap); multi uses run.sel. */
export function answer(run, v) {
  const q = cur(run);
  if (!q || run.done) return null;
  let ok;
  if (q.kind === "tap") {
    ok = !!drillScope(() => q.card.ok(v[0], v[1]));
    run.tap = v;
  } else if (q.kind === "multi") ok = run.sel.size === q.exp.size && [...run.sel].every((x) => q.exp.has(x));
  else {
    ok = !!q.ok(v);
    run.pick = v;
  }
  run.done = true;
  run.got.push({ spec: q.spec, ok, rev: q.rev, p: q.p });
  return ok;
}
export function advance(run) {
  run.i++;
  run.done = false;
  run.sel = new Set();
  run.tap = null;
  run.pick = undefined;
}

/* Markup for the question on screen. Answer buttons use lesson-only data attributes. */
export function questionHtml(run) {
  const q = cur(run),
    d = run.done;
  let h = `<div class="prompt">${q.p}</div>`;
  if (q.kind === "mc" && q.fig) h += figure(q.fig);
  if (q.spec.hear) h += '<div class="ln-hear"><button data-ln-qhear>▶ Listen</button></div>';
  if (q.card && q.kind !== "multi") {
    const vis = drillScope(() => q.card.vis(d, run.tap));
    h += vis.replace(/data-s="(\d+)" data-f="(\d+)"/g, 'data-ln-z="$1.$2"');
  }
  if (q.kind === "pc12" || q.kind === "mc") {
    const cls = (i) => (d ? (i === q.right ? "ok" : run.pick === i ? "bad" : "") : ""),
      len = Math.max(...q.opts.map((o) => String(o).replace(/<[^>]*>/g, "").length)),
      grid = q.kind === "pc12" || (q.opts.length <= 4 && len <= 5) ? "g4" : len <= 22 && q.opts.length > 1 ? "g2" : "g1";
    h += `<div class="${grid} ln-opts">${q.opts.map((o, i) => `<button class="${cls(i)}" data-ln-ans="${i}" ${d ? "disabled" : ""}>${o}</button>`).join("")}</div>`;
  } else if (q.kind === "multi") {
    h += `<div class="g4 ln-opts">${NAMES.map((n, i) => `<button class="${d ? (q.exp.has(i) ? "ok" : run.sel.has(i) ? "bad" : "") : run.sel.has(i) ? "on" : ""}" data-ln-tog="${i}" ${d ? "disabled" : ""}>${n}</button>`).join("")}</div>`;
    if (!d) h += '<button class="go" data-ln-chk>Check</button>';
  }
  return h;
}
