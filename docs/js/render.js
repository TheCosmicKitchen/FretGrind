function spell(r, st, se) {
  return st.map((s, i) => {
    const li = (r.l + s) % 7;
    let d = (((r.pc + se[i] - LSEM[li]) % 12) + 12) % 12;
    if (d > 6) d -= 12;
    return { pc: (r.pc + se[i]) % 12, t: LET[li] + (d > 0 ? "♯".repeat(d) : d < 0 ? "♭".repeat(-d) : "") };
  });
}
function staff(m) {
  const spec = STAFF_NOTE[m % 12],
    st = (Math.floor(m / 12) - 1) * 7 + spec[1],
    y = (s) => 180 - (s - 30) * 4,
    ny = y(st);
  let h = '<svg viewBox="0 0 260 250" class="stf" style="max-width:200px">';
  for (let i = 0; i < 5; i++) h += `<line x1="10" x2="250" y1="${y(30 + i * 2)}" y2="${y(30 + i * 2)}"/>`;
  h += `<text x="16" y="172" font-size="62" font-family="'Noto Music','Apple Symbols','Segoe UI Symbol',serif">𝄞</text>`;
  for (let s = 28; s >= st; s -= 2) h += `<line x1="150" x2="190" y1="${y(s)}" y2="${y(s)}"/>`;
  for (let s = 40; s <= st; s += 2) h += `<line x1="150" x2="190" y1="${y(s)}" y2="${y(s)}"/>`;
  if (spec[2]) h += `<text x="148" y="${ny + 5}" class="st-acc">${spec[2]}</text>`;
  h += `<ellipse cx="170" cy="${ny}" rx="8" ry="5.5"/><line class="st" x1="${st >= 34 ? 162.5 : 177.5}" x2="${st >= 34 ? 162.5 : 177.5}" y1="${ny}" y2="${st >= 34 ? ny + 32 : ny - 32}"/></svg>`;
  return h;
}
/* Full-length horizontal fretboard (24 frets). Frets are spaced like a real neck. */
function neck(o) {
  const nF = o.nF,
    x0 = 84, // nut
    x1 = 1168, // last fret wire
    top = 44, // high-e string
    gap = 36, // string spacing
    bodyY = top - 20,
    bodyH = 5 * gap + 40,
    Y = (i) => top + (5 - i) * gap, // low E at the bottom, high e on top
    edge = (f) => x0 + ((x1 - x0) * (1 - Math.pow(2, -f / 12))) / (1 - Math.pow(2, -nF / 12)),
    fx = (f) => (f ? (edge(f - 1) + edge(f)) / 2 : x0 - 34),
    mid = top + 2.5 * gap,
    NAMES6 = ["E", "A", "D", "G", "B", "e"],
    W = [3.2, 2.6, 2.1, 1.6, 1.25, 1];
  let h = `<div class="fb-scroll"><svg viewBox="0 0 1200 ${bodyY + bodyH + 36}" class="fb fb-neck" role="group" aria-label="Guitar fretboard">`;
  h += '<defs><linearGradient id="neckGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" style="stop-color:var(--neck-a)"/><stop offset="1" style="stop-color:var(--neck-b)"/></linearGradient></defs>';
  h += `<rect class="neck-body" x="${x0 - 3}" y="${bodyY}" width="${x1 - x0 + 21}" height="${bodyH}" rx="10" fill="url(#neckGrad)"/>`;
  // inlays
  [3, 5, 7, 9, 15, 17, 19, 21].forEach((f) => f <= nF && (h += `<circle class="inlay" cx="${fx(f)}" cy="${mid}" r="8"/>`));
  [12, 24].forEach(
    (f) =>
      f <= nF &&
      (h += `<circle class="inlay" cx="${fx(f)}" cy="${mid - gap}" r="8"/><circle class="inlay" cx="${fx(f)}" cy="${mid + gap}" r="8"/>`),
  );
  if (o.segment) {
    const sx = o.segment.min === 0 ? x0 - 3 : edge(o.segment.min - 1),
      ex = edge(o.segment.max);
    h += `<rect class="segment-mark" x="${sx}" y="${bodyY}" width="${ex - sx}" height="${bodyH}" rx="8"/>`;
  }
  // fret wires and nut
  for (let f = 1; f <= nF; f++) h += `<line class="fret" x1="${edge(f)}" x2="${edge(f)}" y1="${bodyY + 2}" y2="${bodyY + bodyH - 2}"/>`;
  h += `<rect class="nut" x="${x0 - 6}" y="${bodyY}" width="6" height="${bodyH}" rx="1.5"/>`;
  // strings (a faint stub carries each one left of the nut so open-string markers have an anchor)
  for (let i = 0; i < 6; i++) {
    const cls = i < 3 ? "string wound" : "string",
      y = Y(i);
    h += `<line class="string-shadow" x1="${x0}" x2="${x1 + 18}" y1="${y + 2}" y2="${y + 2}" stroke-width="${W[i]}"/>`;
    h += `<line class="${cls}" x1="${x0}" x2="${x1 + 18}" y1="${y}" y2="${y}" stroke-width="${W[i]}"/>`;
    h += `<line class="${cls} stub" x1="${x0 - 52}" x2="${x0 - 6}" y1="${y}" y2="${y}" stroke-width="${W[i]}"/>`;
    h += `<text class="neck-label" x="22" y="${y + 4}" text-anchor="middle">${NAMES6[i]}</text>`;
  }
  // fret numbers
  [3, 5, 7, 9, 12, 15, 17, 19, 21, 24].forEach(
    (f) => f <= nF && (h += `<text class="neck-label" x="${fx(f)}" y="${bodyY + bodyH + 22}" text-anchor="middle">${f}</text>`),
  );
  // answer / selection markers
  (o.dots || []).forEach(([s, f, c]) => (h += `<circle class="dot" cx="${fx(f)}" cy="${Y(s)}" r="12" style="fill:${c}"/>`));
  // tap targets
  if (o.tap)
    for (let f = 0; f <= nF; f++)
      for (let i = 0; i < 6; i++) {
        const xa = f ? edge(f - 1) : x0 - 58,
          xb = f ? edge(f) : x0 - 6;
        h += `<rect class="tap-zone" data-s="${i}" data-f="${f}" aria-label="${SN[i]}, ${f ? `fret ${f}` : "open string"}" x="${xa}" y="${Y(i) - gap / 2}" width="${xb - xa}" height="${gap}" rx="6"/>`;
      }
  return h + "</svg></div>";
}

/* Small 5-fret chord diagram. */
function chordBox(o) {
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
const board = (o) => (o.full || o.tap ? neck(o) : chordBox(o));
const dots = (r, g, t) =>
  r
    ? [
        ...g.map(([s, f]) => [s, f, OK]),
        ...(t && !g.some((x) => x[0] == t[0] && x[1] == t[1]) ? [[t[0], t[1], BAD]] : []),
      ]
    : [];
