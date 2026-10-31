/* Drawing: the staff, the fretboard and the chord diagram, as SVG strings. No state, no DOM. */
import { STAFF_NOTE, SN } from "../core/theory.js";

// Colours used for answer marks (CSS variables, so they follow the light/dark theme).
export const OK = "var(--ok)",
  BAD = "var(--bad)",
  AC = "var(--ac)";

export function staff(m) {
  const spec = STAFF_NOTE[m % 12],
    st = (Math.floor(m / 12) - 1) * 7 + spec[1],
    y = (s) => 180 - (s - 30) * 4,
    ny = y(st);
  // crop the picture to the clef, the staff and this note (plus its stem and ledger lines)
  const minY = Math.min(110, ny - 42),
    maxY = Math.max(196, ny + 42);
  let h = `<svg viewBox="0 ${minY} 260 ${maxY - minY}" class="stf" style="max-width:200px">`;
  for (let i = 0; i < 5; i++) h += `<line x1="10" x2="250" y1="${y(30 + i * 2)}" y2="${y(30 + i * 2)}"/>`;
  h += `<text x="16" y="172" font-size="62" font-family="'Noto Music','Apple Symbols','Segoe UI Symbol',serif">𝄞</text>`;
  for (let s = 28; s >= st; s -= 2) h += `<line x1="150" x2="190" y1="${y(s)}" y2="${y(s)}"/>`;
  for (let s = 40; s <= st; s += 2) h += `<line x1="150" x2="190" y1="${y(s)}" y2="${y(s)}"/>`;
  if (spec[2]) h += `<text x="148" y="${ny + 5}" class="st-acc">${spec[2]}</text>`;
  h += `<ellipse cx="170" cy="${ny}" rx="8" ry="5.5"/><line class="st" x1="${st >= 34 ? 162.5 : 177.5}" x2="${st >= 34 ? 162.5 : 177.5}" y1="${ny}" y2="${st >= 34 ? ny + 32 : ny - 32}"/></svg>`;
  return h;
}
/* Horizontal fretboard (24 frets). Frets are spaced like a real neck.
   Pass o.range = [lo, hi] to show only those frets, scaled up to fill the width (no sideways scrolling). */
export function neck(o) {
  const nF = o.nF,
    R = o.range,
    b0 = R ? (R[0] > 1 ? R[0] - 1 : 0) : 0, // fret boundary at the left edge (0 = the nut)
    b1 = R ? R[1] : nF, // fret boundary at the right edge
    n = b1 - b0,
    gap = R ? 44 : 36, // string spacing
    x0 = b0 === 0 ? 84 : 60, // left edge of the playable area
    x1 = R ? x0 + Math.max(480, n * 70) : 1168,
    VW = R ? x1 + 36 : 1200,
    top = 44, // high-e string
    bodyY = top - 20,
    bodyH = 5 * gap + 40,
    Y = (i) => top + (5 - i) * gap, // low E at the bottom, high e on top
    E = (f) => 1 - Math.pow(2, -f / 12),
    edge = (f) => x0 + ((x1 - x0) * (E(f) - E(b0))) / (E(b1) - E(b0)),
    fx = (f) => (f ? (edge(f - 1) + edge(f)) / 2 : x0 - 34),
    vis = (f) => f > b0 && f <= b1, // is fret f on screen?
    mid = top + 2.5 * gap,
    W = [3.2, 2.6, 2.1, 1.6, 1.25, 1],
    MARK = [3, 5, 7, 9, 12, 15, 17, 19, 21, 24],
    allow = o.allow || (() => true); // which frets may be tapped (regions being practised)
  let h = `<div class="fb-scroll"><svg viewBox="0 0 ${VW} ${bodyY + bodyH + 36}" class="fb fb-neck${R ? " zoom" : ""}"${R ? ` style="max-width:${Math.round(VW * 1.25)}px"` : ""} role="group" aria-label="Guitar fretboard${R ? `, frets ${R[0]} to ${R[1]}` : ""}">`;
  h += '<defs><linearGradient id="neckGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--neck-a)"/><stop offset="1" style="stop-color:var(--neck-b)"/></linearGradient></defs>';
  h += `<rect class="neck-body" x="${x0 - 3}" y="${bodyY}" width="${x1 - x0 + 21}" height="${bodyH}" rx="10" fill="url(#neckGrad)"/>`;
  // inlays
  [3, 5, 7, 9, 15, 17, 19, 21].forEach((f) => vis(f) && f <= nF && (h += `<circle class="inlay" cx="${fx(f)}" cy="${mid}" r="8"/>`));
  [12, 24].forEach(
    (f) =>
      vis(f) &&
      f <= nF &&
      (h += `<circle class="inlay" cx="${fx(f)}" cy="${mid - gap}" r="8"/><circle class="inlay" cx="${fx(f)}" cy="${mid + gap}" r="8"/>`),
  );
  if (o.segment && !R) {
    const sx = o.segment.min === 0 ? x0 - 3 : edge(o.segment.min - 1),
      ex = edge(o.segment.max);
    h += `<rect class="segment-mark" x="${sx}" y="${bodyY}" width="${ex - sx}" height="${bodyH}" rx="8"/>`;
  }
  // dim the frets that are outside the practised regions
  for (let f = b0 + 1; f <= b1; f++) {
    if (allow(f)) continue;
    let g = f;
    while (g + 1 <= b1 && !allow(g + 1)) g++;
    h += `<rect class="dim" x="${edge(f - 1)}" y="${bodyY}" width="${edge(g) - edge(f - 1)}" height="${bodyH}"/>`;
    f = g;
  }
  // fret wires (the left edge of a zoomed view is a wire too) and the nut
  for (let f = Math.max(b0, 1); f <= b1; f++)
    h += `<line class="fret" x1="${edge(f)}" x2="${edge(f)}" y1="${bodyY + 2}" y2="${bodyY + bodyH - 2}"/>`;
  if (b0 === 0) h += `<rect class="nut" x="${x0 - 6}" y="${bodyY}" width="6" height="${bodyH}" rx="1.5"/>`;
  // strings (a faint stub carries each one left of the nut)
  for (let i = 0; i < 6; i++) {
    const cls = i < 3 ? "string wound" : "string",
      y = Y(i);
    h += `<line class="string-shadow" x1="${x0}" x2="${x1 + 18}" y1="${y + 2}" y2="${y + 2}" stroke-width="${W[i]}"/>`;
    h += `<line class="${cls}" x1="${x0}" x2="${x1 + 18}" y1="${y}" y2="${y}" stroke-width="${W[i]}"/>`;
    if (b0 === 0) h += `<line class="${cls} stub" x1="${x0 - 52}" x2="${x0 - 6}" y1="${y}" y2="${y}" stroke-width="${W[i]}"/>`;
  }
  // fret numbers: every visible fret when zoomed, the usual marker frets otherwise
  for (let f = b0 + 1; f <= b1; f++)
    if (R || MARK.includes(f)) h += `<text class="neck-label" x="${fx(f)}" y="${bodyY + bodyH + 22}" text-anchor="middle">${f}</text>`;
  // answer / selection markers
  (o.dots || []).forEach(([s, f, c]) => (!f || vis(f)) && (h += `<circle class="dot" cx="${fx(f)}" cy="${Y(s)}" r="12" style="fill:${c}"/>`));
  // tap targets
  if (o.tap)
    for (let f = R ? b0 + 1 : 0; f <= b1; f++)
      for (let i = 0; i < 6 && allow(f); i++) {
        const xa = f ? edge(f - 1) : x0 - 58,
          xb = f ? edge(f) : x0 - 6;
        h += `<rect class="tap-zone" data-s="${i}" data-f="${f}" aria-label="${SN[i]}, ${f ? `fret ${f}` : "open string"}" x="${xa}" y="${Y(i) - gap / 2}" width="${xb - xa}" height="${gap}" rx="6"/>`;
      }
  return h + "</svg></div>";
}

/* Small 5-fret chord diagram. */
export function chordBox(o) {
  const nF = o.nF,
    H = 40 + nF * 28,
    X = (i) => 36 + i * 48,
    edge = (f) => 36 + f * 28,
    fy = (f) => (f ? (edge(f - 1) + edge(f)) / 2 : 20);
  let h = `<svg viewBox="0 0 312 ${H}" class="fb" style="width:${o.w || 300}px;max-width:100%">`;
  for (let r = 0; r <= nF; r++)
    h += `<line class="f" x1="36" x2="276" y1="${edge(r)}" y2="${edge(r)}" stroke-width="${r ? 1 : 4}"/>`;
  for (let i = 0; i < 6; i++)
    h += `<line class="s" x1="${X(i)}" x2="${X(i)}" y1="36" y2="${edge(nF)}" stroke-width="${2.4 - i * 0.3}"/>`;
  [3, 5].forEach((f) => f <= nF && (h += `<circle class="in" cx="156" cy="${fy(f)}" r="5"/><text x="8" y="${fy(f) + 4}">${f}</text>`));
  (o.dots || []).forEach(([s, f, c]) => (h += `<circle cx="${X(s)}" cy="${fy(f)}" r="11" style="fill:${c}"/>`));
  (o.mk || []).forEach(
    ([s, v]) =>
      (h += v < 0 ? `<text x="${X(s) - 4}" y="25" style="font-size:16px">×</text>` : `<circle class="h" cx="${X(s)}" cy="20" r="8"/>`),
  );
  return h + "</svg>";
}
export const board = (o) => (o.full || o.tap ? neck(o) : chordBox(o));
export const dots = (r, g, t) =>
  r
    ? [
        ...g.map(([s, f]) => [s, f, OK]),
        ...(t && !g.some((x) => x[0] == t[0] && x[1] == t[1]) ? [[t[0], t[1], BAD]] : []),
      ]
    : [];
