/* Pictures for lessons, as HTML/SVG strings. No state, no DOM: every figure is described by a small plain object,
   e.g. { staff: ["C4","E4","G4"], names: true }, { keys: { hi: [0,4,7] } }, { chords: ["G","C"] }.
   figure(f) turns one description into markup; badFigure(f) says what is wrong with one (used by the tests). */
import { LET, LSEM, SH } from "../core/theory.js";
import { AC, board } from "../view/notation.js";
import { rhythmSvg } from "../games/rhythm-view.js";
import { isValid } from "../games/rhythm-patterns.js";

/* "F#4" -> { step, midi, acc, letter }. step counts letters up from C0, so E4 = 30, the bottom line of the treble staff. */
export function parseNote(s) {
  const m = /^([A-G])([#b]{0,2}|n)(-?\d)$/.exec(String(s));
  if (!m) return null;
  const li = LET.indexOf(m[1]),
    acc = m[2] === "n" ? 0 : [...m[2]].reduce((a, c) => a + (c === "#" ? 1 : -1), 0),
    oct = +m[3];
  return { step: oct * 7 + li, midi: (oct + 1) * 12 + LSEM[li] + acc, acc, natural: m[2] === "n", letter: m[1], shown: m[2], oct };
}
export const noteName = (s) => {
  const n = parseNote(s);
  return n ? label(n) : "";
};
const accGlyph = (n) => (n.natural ? "♮" : n.shown.replace(/#/g, "♯").replace(/b/g, "♭"));
const label = (n) => n.letter + accGlyph(n);
const SHARP_STEPS = [38, 35, 39, 36, 33, 37, 34], // F C G D A E B on the treble staff
  FLAT_STEPS = [34, 37, 33, 36, 32, 35, 31]; // B E A D G C F

/* Notes on a treble staff. o = { notes: [...], names: bool | [labels], hi: [indices], stack: bool, ks: {sharps:n}|{flats:n}, ts: [n, d] } */
function staffSvg(o) {
  const ns = o.notes.map(parseNote),
    y = (s) => 180 - (s - 30) * 4,
    ks = o.ks ? (o.ks.sharps ? SHARP_STEPS.slice(0, o.ks.sharps) : FLAT_STEPS.slice(0, o.ks.flats || 0)) : [],
    ksGlyph = o.ks && o.ks.sharps ? "♯" : "♭",
    x0 = 78 + ks.length * 13 + (o.ts ? 28 : 0),
    gap = o.stack ? 0 : o.gap || 46,
    xs = ns.map((_, i) => x0 + 22 + i * gap),
    W = (o.stack ? x0 + 90 : xs[xs.length - 1] + 40) | 0,
    top = Math.min(...ns.map((n) => y(n.step))),
    bot = Math.max(...ns.map((n) => y(n.step))),
    minY = Math.min(124, top - 44),
    maxY = Math.max(196, bot + 26),
    labels = o.names ? (Array.isArray(o.names) ? o.names : ns.map(label)) : null,
    H = maxY - minY + (labels ? 24 : 0);
  let h = `<svg viewBox="0 ${minY} ${W} ${H}" class="stf fg-staff" style="max-width:${Math.min(520, Math.max(220, W * 1.3))}px" role="img" aria-label="Music staff">`;
  for (let i = 0; i < 5; i++) h += `<line x1="10" x2="${W - 8}" y1="${y(30 + i * 2)}" y2="${y(30 + i * 2)}"/>`;
  h += `<text x="16" y="172" font-size="62" font-family="'Noto Music','Apple Symbols','Segoe UI Symbol',serif">𝄞</text>`;
  ks.forEach((s, i) => (h += `<text class="st-acc" x="${72 + i * 13}" y="${y(s) + 6}">${ksGlyph}</text>`));
  if (o.ts) h += `<text class="fg-ts" x="${x0 - 26}" y="${y(36) + 2}">${o.ts[0]}</text><text class="fg-ts" x="${x0 - 26}" y="${y(32) + 2}">${o.ts[1]}</text>`;
  const hiSet = new Set(o.hi || []);
  const stems = ns.reduce((a, n) => a + n.step, 0) / ns.length >= 34;
  ns.forEach((n, i) => {
    const cx = o.stack ? x0 + 40 + (i && n.step - ns[i - 1].step === 1 ? 10 : 0) : xs[i],
      cy = y(n.step),
      cls = hiSet.has(i) ? ' class="fg-hi"' : "";
    for (let s = 28; s >= n.step; s -= 2) h += `<line x1="${cx - 13}" x2="${cx + 13}" y1="${y(s)}" y2="${y(s)}"/>`;
    for (let s = 40; s <= n.step; s += 2) h += `<line x1="${cx - 13}" x2="${cx + 13}" y1="${y(s)}" y2="${y(s)}"/>`;
    if (n.shown) h += `<text class="st-acc" x="${cx - 24}" y="${cy + 5}">${accGlyph(n)}</text>`;
    h += `<ellipse${cls} cx="${cx}" cy="${cy}" rx="8" ry="5.5"/>`;
    if (!o.stack) {
      const down = n.step >= 34;
      h += `<line class="st" x1="${down ? cx - 7.5 : cx + 7.5}" x2="${down ? cx - 7.5 : cx + 7.5}" y1="${cy}" y2="${down ? cy + 32 : cy - 32}"/>`;
    }
    if (labels) h += `<text class="fg-lab${hiSet.has(i) ? " fg-hi" : ""}" x="${cx}" y="${maxY + 18}" text-anchor="middle">${labels[i] ?? ""}</text>`;
  });
  if (o.stack) {
    const cx = x0 + 40;
    h += `<line class="st" x1="${stems ? cx - 7.5 : cx + 7.5}" x2="${stems ? cx - 7.5 : cx + 7.5}" y1="${y(ns[0].step)}" y2="${stems ? top + 32 : top - 32}"/>`;
  }
  return h + "</svg>";
}

/* One or two octaves of piano keys from C. o = { oct: 1|2, hi: [pitch classes], names: "white"|"all"|"", hi2: [pcs in the second colour] } */
function keysSvg(o) {
  const oct = o.oct || 1,
    ww = 36,
    hh = 112,
    W = 7 * oct * ww + 2,
    hi = new Set(o.hi || []),
    hi2 = new Set(o.hi2 || []),
    NM = ["C", "D", "E", "F", "G", "A", "B"],
    BK = [[1, "C♯"], [3, "D♯"], [6, "F♯"], [8, "G♯"], [10, "A♯"]],
    BKX = [1, 2, 4, 5, 6];
  let h = `<svg viewBox="0 0 ${W} ${hh + 8}" class="fg-keys" style="max-width:${Math.min(520, 40 * oct * 7 + 20)}px" role="img" aria-label="Piano keys">`;
  for (let i = 0; i < 7 * oct; i++) {
    const pc = LSEM[i % 7],
      cls = hi.has(pc) ? " hi" : hi2.has(pc) ? " hi2" : "";
    h += `<rect class="wk${cls}" x="${1 + i * ww}" y="1" width="${ww}" height="${hh}" rx="3"/>`;
    if (o.names === "white" || o.names === "all") h += `<text class="kl${cls ? " on" : ""}" x="${1 + i * ww + ww / 2}" y="${hh - 8}" text-anchor="middle">${NM[i % 7]}</text>`;
  }
  for (let k = 0; k < oct; k++)
    BK.forEach(([pc, nm], j) => {
      const cls = hi.has(pc) ? " hi" : hi2.has(pc) ? " hi2" : "",
        x = 1 + (k * 7 + BKX[j]) * ww - 11;
      h += `<rect class="bk${cls}" x="${x}" y="1" width="22" height="${hh * 0.62}" rx="2"/>`;
      if (o.names === "all" || (o.names && cls)) h += `<text class="kl bkl" x="${x + 11}" y="${hh * 0.62 - 7}" text-anchor="middle">${nm.length > 1 && o.names === "all" ? nm : cls ? nm.replace(/.*\//, "") : ""}</text>`;
    });
  return h + "</svg>";
}

/* Guitar tab: cols = [[[string, fret], ...], ...] with string 0 = low E ... 5 = high e. Notes in one column sound together. */
function tabSvg(o) {
  const cols = o.cols,
    gx = 30,
    cw = o.cw || 34,
    W = gx + 22 + cols.length * cw,
    sy = (s) => 14 + (5 - s) * 15;
  let h = `<svg viewBox="0 0 ${W} 112" class="fg-tab" style="max-width:${Math.min(520, W * 1.4)}px" role="img" aria-label="Guitar tab">`;
  for (let s = 0; s < 6; s++) h += `<line x1="${gx - 6}" x2="${W - 6}" y1="${sy(s)}" y2="${sy(s)}"/>`;
  h += `<line x1="${gx - 6}" x2="${gx - 6}" y1="${sy(5)}" y2="${sy(0)}"/><line x1="${W - 6}" x2="${W - 6}" y1="${sy(5)}" y2="${sy(0)}"/>`;
  h += `<text class="tabword" x="6" y="${sy(3) + 1}">T</text><text class="tabword" x="6" y="${sy(2) + 4}">A</text><text class="tabword" x="6" y="${sy(1) + 7}">B</text>`;
  cols.forEach((col, i) => {
    const x = gx + 14 + i * cw;
    col.forEach(([s, f]) => {
      h += `<rect class="tabbg" x="${x - 7}" y="${sy(s) - 8}" width="14" height="16"/><text class="tabn" x="${x}" y="${sy(s) + 4.5}" text-anchor="middle">${f}</text>`;
    });
  });
  (o.names || []).forEach((t, i) => (h += `<text class="tabx" x="${gx + 14 + i * cw}" y="108" text-anchor="middle">${t}</text>`));
  return h + "</svg>";
}

function circleSvg(o) {
  const maj = ["C", "G", "D", "A", "E", "B", "F♯", "D♭", "A♭", "E♭", "B♭", "F"],
    min = ["Am", "Em", "Bm", "F♯m", "C♯m", "G♯m", "D♯m", "B♭m", "Fm", "Cm", "Gm", "Dm"],
    sig = ["0", "1♯", "2♯", "3♯", "4♯", "5♯", "6", "5♭", "4♭", "3♭", "2♭", "1♭"],
    hi = new Set(o.hi || []);
  let h = `<svg viewBox="0 0 280 280" class="fg-circle" style="max-width:340px" role="img" aria-label="Circle of fifths">`;
  h += `<circle class="cr-ring" cx="140" cy="140" r="118"/><circle class="cr-ring" cx="140" cy="140" r="82"/><circle class="cr-ring" cx="140" cy="140" r="50"/>`;
  maj.forEach((n, i) => {
    const a = (i * Math.PI) / 6 - Math.PI / 2,
      p = (r) => [140 + Math.cos(a) * r, 140 + Math.sin(a) * r],
      [x, yy] = p(100),
      [x2, y2] = p(66),
      [x3, y3] = p(131);
    h += `<g class="${hi.has(i) ? "hi" : ""}"><text class="cr-maj" x="${x}" y="${yy + 5}" text-anchor="middle">${n}</text><text class="cr-min" x="${x2}" y="${y2 + 4}" text-anchor="middle">${min[i]}</text></g>`;
    if (o.sig !== false) h += `<text class="cr-sig" x="${x3}" y="${y3 + 4}" text-anchor="middle">${sig[i]}</text>`;
  });
  return h + `<text class="cr-mid" x="140" y="136" text-anchor="middle">${o.mid || "Circle"}</text><text class="cr-mid" x="140" y="152" text-anchor="middle">${o.mid ? "" : "of fifths"}</text></svg>`;
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");

export const FIGURE_TYPES = ["staff", "keys", "tab", "neck", "chords", "chart", "table", "rhythm", "circle", "pattern", "html"];

/* What is wrong with this figure description? Returns a message, or "" when it is fine. */
export function badFigure(f) {
  if (!f || typeof f !== "object") return "not an object";
  const k = FIGURE_TYPES.filter((t) => t in f);
  if (k.length !== 1) return "needs exactly one of " + FIGURE_TYPES.join("/");
  const v = f[k[0]];
  if (k[0] === "staff") {
    const o = Array.isArray(v) ? { notes: v } : v;
    if (!o || !Array.isArray(o.notes) || !o.notes.length) return "staff needs notes";
    const bad = o.notes.find((n) => !parseNote(n));
    if (bad) return "bad note " + bad;
    if (Array.isArray(o.names) && o.names.length > o.notes.length) return "staff has more labels than notes";
  }
  if (k[0] === "rhythm" && !isValid(v)) return "bad rhythm " + v;
  if (k[0] === "chords" && (!Array.isArray(v) || v.some((c) => !SH[c]))) return "unknown chord in " + JSON.stringify(v);
  if (k[0] === "tab" && !(v && Array.isArray(v.cols) && v.cols.every((c) => c.every(([s, fr]) => s >= 0 && s <= 5 && fr >= 0 && fr <= 24)))) return "bad tab";
  if (k[0] === "neck" && !(v && Array.isArray(v.dots))) return "neck needs dots";
  if (k[0] === "chart" && !(v && Array.isArray(v.rows))) return "chart needs rows";
  if (k[0] === "table" && !(v && Array.isArray(v.head) && Array.isArray(v.rows))) return "table needs head and rows";
  if (k[0] === "pattern" && !(v && Array.isArray(v.steps))) return "pattern needs steps";
  return "";
}

export function figure(f) {
  if (!f) return "";
  const cap = f.cap ? `<figcaption>${f.cap}</figcaption>` : "";
  let h = "";
  if ("staff" in f) h = staffSvg(Array.isArray(f.staff) ? { notes: f.staff, ...f } : { ...f.staff });
  else if ("keys" in f) h = keysSvg(f.keys);
  else if ("tab" in f) h = tabSvg(f.tab);
  else if ("neck" in f) h = board({ nF: 24, full: true, w: 960, range: f.neck.range || [1, 5], dots: f.neck.dots.map(([s, fr, c]) => [s, fr, c || AC]) });
  else if ("chords" in f)
    h =
      '<div class="fg-chords">' +
      f.chords
        .map((n) => {
          const dt = [],
            mk = [];
          SH[n].forEach((fr, s) => (fr > 0 ? dt.push([s, fr, AC]) : mk.push([s, fr])));
          return `<figure><b>${n}</b>${board({ nF: 4, w: 130, dots: dt, mk })}</figure>`;
        })
        .join("") +
      "</div>";
  else if ("chart" in f)
    h =
      '<div class="fg-chart" role="img" aria-label="Chord chart">' +
      f.chart.rows.map((r) => `<div class="fg-crow">${r.map((b) => `<span>${b || "·"}</span>`).join("")}</div>`).join("") +
      "</div>";
  else if ("table" in f)
    h = `<div class="fg-table"><table><thead><tr>${f.table.head.map((x) => `<th>${x}</th>`).join("")}</tr></thead><tbody>${f.table.rows.map((r) => `<tr>${r.map((x) => `<td>${x}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;
  else if ("rhythm" in f) h = rhythmSvg(f.rhythm).replace(' id="rh-head"', "");
  else if ("circle" in f) h = circleSvg(f.circle);
  else if ("pattern" in f) {
    const p = f.pattern;
    h =
      '<div class="fg-pat">' +
      p.steps
        .map((s, i) => `${p.notes ? `<span class="n">${p.notes[i]}</span>` : ""}<span class="s s${s}">${s}</span>`)
        .join("")
        .concat(p.notes ? `<span class="n">${p.notes[p.steps.length]}</span>` : "") +
      "</div>";
  } else if ("html" in f) h = f.html;
  return `<figure class="fg">${h}${cap}</figure>`;
}
export { esc };
