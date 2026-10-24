/* Sheet music, tab and chord diagram for a chord or scale, as SVG strings. */
const COL_X0 = 78,
  COL_DX = 46;
export const colX = (i) => COL_X0 + i * COL_DX;
export function staffView(it) {
  const y = (s) => 180 - (s - 30) * 4;
  const steps = it.cols.flatMap((c) => c.notes.map((n) => n.step)),
    minY = Math.min(104, y(Math.max(...steps)) - 44),
    maxY = Math.max(200, y(Math.min(...steps)) + 40),
    W = colX(it.cols.length - 1) + 40;
  let h = `<svg viewBox="0 ${minY} ${W} ${maxY - minY}" style="width:${W}px;height:${maxY - minY}px" class="pr-svg pr-staff" role="img" aria-label="Sheet music for ${it.title}">`;
  for (let i = 0; i < 5; i++) h += `<line class="ln" x1="8" x2="${W - 8}" y1="${y(30 + i * 2)}" y2="${y(30 + i * 2)}"/>`;
  h += `<text class="clef" x="14" y="172" font-size="62">𝄞</text>`;
  it.cols.forEach((c, i) => {
    const cx = colX(i),
      ns = c.notes;
    h += `<g class="pn" data-col="${i}">`;
    const lo = Math.min(...ns.map((n) => n.step)),
      hi = Math.max(...ns.map((n) => n.step));
    for (let s = 28; s >= lo; s -= 2) h += `<line class="ln" x1="${cx - 13}" x2="${cx + 13}" y1="${y(s)}" y2="${y(s)}"/>`;
    for (let s = 40; s <= hi; s += 2) h += `<line class="ln" x1="${cx - 13}" x2="${cx + 13}" y1="${y(s)}" y2="${y(s)}"/>`;
    let prev = -9,
      flip = false,
      ac = 0;
    ns.forEach((n) => {
      flip = n.step - prev === 1 && !flip; // neighbouring notes sit on opposite sides of the stem
      prev = n.step;
      if (n.acc) h += `<text class="acc" x="${cx - 21 - 11 * (ac++ % 3)}" y="${y(n.step) + 5}">${n.acc > 0 ? "♯" : "♭"}</text>`;
      h += `<ellipse class="nh" cx="${cx + (flip ? 10 : 0)}" cy="${y(n.step)}" rx="7.5" ry="5.4"/>`;
    });
    h += hi < 34
      ? `<line class="stem" x1="${cx + 7}" x2="${cx + 7}" y1="${y(lo)}" y2="${y(hi) - 30}"/>`
      : `<line class="stem" x1="${cx - 7}" x2="${cx - 7}" y1="${y(hi)}" y2="${y(lo) + 30}"/>`;
    h += "</g>";
  });
  return h + "</svg>";
}
export function tabView(it) {
  const Y = (s) => 22 + (5 - s) * 18, // high e on top
    W = colX(it.cols.length - 1) + 40;
  let h = `<svg viewBox="0 0 ${W} 138" style="width:${W}px;height:138px" class="pr-svg pr-tab" role="img" aria-label="Tab for ${it.title}">`;
  for (let s = 0; s < 6; s++) {
    h += `<line class="ln" x1="40" x2="${W - 8}" y1="${Y(s)}" y2="${Y(s)}"/>`;
    h += `<text class="tl" x="20" y="${Y(s) + 4}" text-anchor="middle">${["E", "A", "D", "G", "B", "e"][s]}</text>`;
  }
  it.cols.forEach((c, i) => {
    const cx = colX(i);
    h += `<g class="tn" data-col="${i}">`;
    c.tab.forEach(([s, f]) => {
      h += `<rect x="${cx - 9}" y="${Y(s) - 8}" width="18" height="16" rx="3"/><text x="${cx}" y="${Y(s) + 4.5}" text-anchor="middle">${f}</text>`;
    });
    (it.muted || []).forEach((s) => (h += `<text class="mute" x="${cx}" y="${Y(s) + 4.5}" text-anchor="middle">×</text>`));
    h += "</g>";
  });
  return h + "</svg>";
}
// chord diagram with finger numbers
export function boxView(v) {
  const rel = v[1].filter((f) => f > 0),
    rows = Math.max(4, ...rel),
    X = (s) => 34 + s * 24,
    Y = (f) => 30 + (f - 0.5) * 24,
    H = 40 + rows * 24;
  let h = `<svg viewBox="0 0 180 ${H}" class="pr-box" role="img" aria-label="Chord diagram">`;
  for (let f = 0; f <= rows; f++) h += `<line class="g" x1="${X(0)}" x2="${X(5)}" y1="${30 + f * 24}" y2="${30 + f * 24}" stroke-width="${f === 0 && v[0] === 1 ? 4 : 1}"/>`;
  for (let s = 0; s < 6; s++) h += `<line class="g" x1="${X(s)}" x2="${X(s)}" y1="30" y2="${30 + rows * 24}"/>`;
  if (v[0] > 1) h += `<text class="bf" x="${X(5) + 12}" y="${Y(1) + 4}">${v[0]}fr</text>`;
  (v[3] || []).forEach((b) => {
    const ss = v[1].map((f, s) => (f === b ? s : -1)).filter((s) => s >= 0);
    h += `<rect class="barre" x="${X(Math.min(...ss)) - 9}" y="${Y(b) - 9}" width="${X(Math.max(...ss)) - X(Math.min(...ss)) + 18}" height="18" rx="9"/>`;
  });
  v[1].forEach((f, s) => {
    if (f < 0) h += `<text class="mk" x="${X(s)}" y="22" text-anchor="middle">×</text>`;
    else if (f === 0) h += `<circle class="op" cx="${X(s)}" cy="17" r="5"/>`;
    else h += `<circle class="dt" cx="${X(s)}" cy="${Y(f)}" r="9"/>` + (v[2][s] ? `<text class="fg" x="${X(s)}" y="${Y(f) + 4}" text-anchor="middle">${v[2][s]}</text>` : "");
  });
  return h + "</svg>";
}

