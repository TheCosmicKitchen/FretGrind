/* Sheet music and tab for a song as SVG strings, laid out in lines that fit the screen width.
   Pure string building (no DOM), so Node can import it for tests. */
import { keyCount } from "./format.js";

const U = 9, // px per sixteenth note of time
  MIN = 21, // least room for any note
  PAD = 12,
  STEM = 29,
  TAB_GAP = 14;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const SHARPS = [38, 35, 39, 36, 33, 37, 34], // staff step of each sharp in a treble key signature (F C G D A E B)
  FLATS = [34, 37, 33, 36, 32, 35, 31]; // (B E A D G C F)

/* Split the notes into bars, size each bar, and break them into lines no wider than `width`. */
export function layout(song, width, lyrics = false) {
  const sig = keyCount(song.key),
    head1 = 52 + Math.abs(sig) * 9 + 26,
    head2 = 14;
  const bars = [];
  song.notes.forEach((n) => (bars[n.bar] ||= []).push(n));
  // a note needs room for its time value, and for its syllable when the words are shown
  const need = (n) => Math.max(n.dur * U, MIN, lyrics && n.syl ? n.syl.length * 6.6 + 6 : 0);
  const sized = bars.map((ns, bi) => ({ bi, ns, w: PAD * 2 + ns.reduce((a, n) => a + need(n), 0) }));
  const lines = [];
  let cur = { bars: [], w: 0, head: head1 };
  sized.forEach((b) => {
    if (cur.bars.length && cur.head + cur.w + b.w > width) {
      lines.push(cur);
      cur = { bars: [], w: 0, head: head2 };
    }
    cur.bars.push(b);
    cur.w += b.w;
  });
  lines.push(cur);
  lines.forEach((ln, i) => {
    const room = width - ln.head - 4,
      k = Math.min(i === lines.length - 1 ? 1.25 : 1.5, Math.max(1, room / ln.w));
    let x = ln.head;
    ln.bars.forEach((b) => {
      b.x0 = x;
      let nx = x + PAD * k;
      b.ns.forEach((n) => {
        const slot = need(n) * k;
        n.x = nx + 8;
        nx += slot;
      });
      b.x1 = x + b.w * k;
      x = b.x1;
    });
    ln.end = x;
  });
  return lines;
}

/* Runs of short notes that share a beam: notes of at most a dotted eighth inside the same beat. */
function beamRuns(song, ns) {
  const g0 = song.pickup || 0,
    runs = [];
  let run = null;
  ns.forEach((n) => {
    const ok = !n.rest && n.dur <= 3,
      beat = Math.floor((n.start - g0) / song.beat);
    if (ok && run && run.beat === beat) run.items.push(n);
    else {
      run = ok ? { beat, items: [n] } : null;
      if (run) runs.push(run);
    }
  });
  return runs;
}

/* Stems, beams and flags. items = [{x, y, dur}] for one run (or one note); dir = -1 stem up, 1 stem down. */
function stems(items, dir, beamed) {
  const sx = (it) => it.x + (dir < 0 ? 5.6 : -5.6);
  let end = dir < 0 ? Math.min(...items.map((i) => i.y)) - STEM : Math.max(...items.map((i) => i.y)) + STEM,
    h = "";
  items.forEach((it) => {
    if (it.dur >= 16) return;
    h += `<line class="sg-stem" x1="${sx(it)}" x2="${sx(it)}" y1="${it.y}" y2="${beamed ? end : dir < 0 ? it.y - STEM : it.y + STEM}"/>`;
  });
  if (beamed && items.length > 1) {
    const x0 = sx(items[0]), x1 = sx(items[items.length - 1]),
      rect = (a, b, off) => `<rect class="sg-beam" x="${a}" y="${dir < 0 ? end + off : end - off - 4}" width="${b - a}" height="4"/>`;
    h += rect(x0, x1, 0);
    items.forEach((it, i) => {
      if (it.dur !== 1) return;
      const nx = items[i + 1], pv = items[i - 1];
      if (nx && nx.dur === 1) h += rect(sx(it), sx(nx), 6);
      else if (!(pv && pv.dur === 1)) h += pv ? rect(sx(it) - 8, sx(it), 6) : rect(sx(it), sx(it) + 8, 6);
    });
  } else if (!beamed) {
    items.forEach((it) => {
      if (it.dur > 3) return;
      const flags = it.dur === 1 ? 2 : 1;
      for (let f = 0; f < flags; f++) {
        const y = (dir < 0 ? it.y - STEM + f * 7 : it.y + STEM - f * 7),
          q = dir < 0 ? "9 8 6 20" : "9 -8 6 -20";
        h += `<path class="sg-flag" d="M ${sx(it)} ${y} q ${q}"/>`;
      }
    });
  }
  return h;
}

function rest(n, y) {
  const x = n.x;
  if (n.dur >= 16) return `<rect class="sg-rest" x="${x - 6}" y="${y(36)}" width="12" height="5"/>`;
  if (n.dur >= 8) return `<rect class="sg-rest" x="${x - 6}" y="${y(34) - 5}" width="12" height="5"/>`;
  const my = y(34);
  if (n.dur >= 4) return `<path class="sg-rl" d="M ${x - 2} ${my - 13} L ${x + 3} ${my - 6} L ${x - 3} ${my} L ${x + 3} ${my + 7} q -7 -1 -6 6"/>`;
  const dots = n.dur === 1 ? 2 : 1;
  let h = `<line class="sg-rl" x1="${x + 3}" y1="${my - 8}" x2="${x - 3}" y2="${my + 10}"/>`;
  for (let i = 0; i < dots; i++) h += `<circle class="sg-rd" cx="${x - 3 + i * -2.5}" cy="${my - 5 + i * 7}" r="2.3"/>`;
  return h;
}

/* One system (line): staff, optional lyrics, optional tab. */
function system(song, tab, ln, li, ctx) {
  const { width, view, lyrics, ys } = ctx,
    top = ys.top,
    y = (s) => top + 32 - (s - 30) * 4,
    showStaff = view !== "tab",
    showTab = view !== "staff",
    stavesBottom = y(30) + ys.below;
  let h = "";
  const tabTop = showStaff ? stavesBottom + (lyrics ? 24 : 6) + 6 : 16,
    TY = (s) => tabTop + (5 - s) * TAB_GAP,
    tabBottom = TY(0);
  const height = (showTab ? tabBottom + (showStaff ? 14 : 44) : stavesBottom + (lyrics ? 26 : 8));
  h += `<svg class="sg-svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" role="img" aria-label="${esc(song.title)}, line ${li + 1}">`;
  if (showStaff) {
    for (let i = 0; i < 5; i++) h += `<line class="sg-ln" x1="4" x2="${ln.end}" y1="${y(30 + i * 2)}" y2="${y(30 + i * 2)}"/>`;
    if (li === 0) {
      h += `<text class="sg-clef" x="8" y="${y(30) - 2}">𝄞</text>`;
      const n = keyCount(song.key),
        list = n > 0 ? SHARPS.slice(0, n) : FLATS.slice(0, -n);
      list.forEach((st, i) => (h += `<text class="sg-acc" x="${40 + i * 9}" y="${y(st) + 5}">${n > 0 ? "♯" : "♭"}</text>`));
      const [a, b] = song.time.split("/"),
        tx = 44 + Math.abs(n) * 9 + 6;
      h += `<text class="sg-ts" x="${tx}" y="${y(34) - 1}">${a}</text><text class="sg-ts" x="${tx}" y="${y(30) - 1}">${b}</text>`;
    }
  }
  if (showTab) {
    for (let s = 0; s < 6; s++) h += `<line class="sg-ln" x1="4" x2="${ln.end}" y1="${TY(s)}" y2="${TY(s)}"/>`;
    h += `<text class="sg-tab-clef" x="6" y="${TY(3) - 2}">T</text><text class="sg-tab-clef" x="6" y="${TY(2) + 8}">A</text><text class="sg-tab-clef" x="6" y="${TY(1) + 16}">B</text>`;
  }
  ln.bars.forEach((b, bi) => {
    const last = li === ctx.lines.length - 1 && bi === ln.bars.length - 1,
      bx = b.x1;
    const bl = (x, thick) => {
      let s = "";
      if (showStaff) s += `<line class="${thick ? "sg-bar thick" : "sg-bar"}" x1="${x}" x2="${x}" y1="${y(38)}" y2="${y(30)}"/>`;
      if (showTab) s += `<line class="${thick ? "sg-bar thick" : "sg-bar"}" x1="${x}" x2="${x}" y1="${TY(5)}" y2="${TY(0)}"/>`;
      return s;
    };
    h += last ? bl(bx - 5) + bl(bx, true) : bl(bx);
    h += `<text class="sg-bn" x="${b.x0 + 3}" y="${(showStaff ? y(38) : TY(5)) - 20}">${song.pickup ? b.bi || "" : b.bi + 1}</text>`;
    // staff
    const runs = beamRuns(song, b.ns),
      inRun = new Map();
    runs.forEach((r) => r.items.forEach((n) => inRun.set(n, r)));
    const done = new Set();
    b.ns.forEach((n) => {
      if (n.rest) {
        if (showStaff) h += rest(n, y);
        return;
      }
      const idx = ctx.index.get(n),
        yy = y(n.step);
      if (showStaff) {
        let g = `<g class="sg-n" data-n="${idx}">`;
        for (let s = 28; s >= n.step; s -= 2) g += `<line class="sg-ln" x1="${n.x - 10}" x2="${n.x + 10}" y1="${y(s)}" y2="${y(s)}"/>`;
        for (let s = 40; s <= n.step; s += 2) g += `<line class="sg-ln" x1="${n.x - 10}" x2="${n.x + 10}" y1="${y(s)}" y2="${y(s)}"/>`;
        if (n.show) g += `<text class="sg-acc" x="${n.x - 17}" y="${yy + 5}">${n.show}</text>`;
        g += `<ellipse class="sg-head${n.dur >= 8 ? " open" : ""}" cx="${n.x}" cy="${yy}" rx="6.6" ry="4.9" transform="rotate(-18 ${n.x} ${yy})"/>`;
        if ([3, 6, 12].includes(n.dur)) g += `<circle class="sg-dot" cx="${n.x + 11}" cy="${yy + (n.step % 2 ? 0 : -4)}" r="1.9"/>`;
        h += g + "</g>";
      }
      if (showTab) {
        const [s, f] = ctx.tab[idx];
        h += `<g class="sg-t" data-n="${idx}"><rect class="sg-tbg" x="${n.x - 7}" y="${TY(s) - 7}" width="14" height="14" rx="3"/><text class="sg-fret" x="${n.x}" y="${TY(s) + 4.2}">${f}</text></g>`;
      }
      if (lyrics && n.syl && showStaff) h += `<text class="sg-syl" x="${n.x - 5}" y="${stavesBottom + 14}">${esc(n.syl)}</text>`;
      // stems: once per run, or per single note
      const r = inRun.get(n);
      if (r && !done.has(r)) {
        done.add(r);
        if (showStaff && r.items.length > 1) {
          const avg = r.items.reduce((a, m) => a + m.step, 0) / r.items.length;
          h += stems(r.items.map((m) => ({ x: m.x, y: y(m.step), dur: m.dur })), avg < 34 ? -1 : 1, true);
        }
        if (!showStaff && r.items.length > 1) h += stems(r.items.map((m) => ({ x: m.x + 0.1, y: tabBottom + 12, dur: m.dur })), 1, true);
      }
      if (!r || r.items.length === 1) {
        if (showStaff && n.dur < 16) h += stems([{ x: n.x, y: yy, dur: n.dur }], n.step < 34 ? -1 : 1, false);
        if (!showStaff && n.dur < 16) h += stems([{ x: n.x + 0.1, y: tabBottom + 12, dur: n.dur }], 1, false);
      }
    });
  });
  return h + "</svg>";
}

/* All lines for a song. opts: {width, view: "staff" | "tab" | "both", lyrics: bool} */
export function songSvg(song, tab, opts) {
  const lines = layout(song, opts.width, opts.lyrics && opts.view !== "tab"),
    index = new Map(song.sounding.map((n, i) => [n, i])),
    steps = song.sounding.map((n) => n.step),
    ys = {
      top: Math.max(18, (Math.max(...steps, 38) - 38) * 4 + STEM + 4),
      below: Math.max(14, (30 - Math.min(...steps, 30)) * 4 + STEM + 4),
    },
    ctx = { ...opts, lines, index, tab, ys };
  return lines.map((ln, i) => `<div class="sg-sys" data-line="${i}">${system(song, tab, ln, i, ctx)}</div>`).join("");
}

/* Which line each note is on (for scrolling the playing line into view). */
export function lineOf(song, width, lyrics = false) {
  const m = new Map();
  layout(song, width, lyrics).forEach((ln, i) => ln.bars.forEach((b) => b.ns.forEach((n) => !n.rest && m.set(n, i))));
  return song.sounding.map((n) => m.get(n));
}
