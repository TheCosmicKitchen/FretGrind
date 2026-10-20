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
function board(o) {
  const nF = o.nF,
    H = 40 + nF * 28,
    full = !!(o.full || o.tap),
    X = (i) => 36 + i * 48,
    edge = (f) =>
      full ? 36 + ((H - 72) * (1 - Math.pow(2, -f / 12))) / (1 - Math.pow(2, -nF / 12)) : 36 + f * 28,
    fy = (f) => (f ? (edge(f - 1) + edge(f)) / 2 : 20);
  let h = full ? '<div class="fb-scroll">' : "";
  h += `<svg viewBox="0 0 ${full ? H : 312} ${full ? 312 : H}" preserveAspectRatio="${full ? "none" : "xMidYMid meet"}" class="fb ${full ? "fb-neck" : ""}" style="width:${full ? "min(100%,960px)" : (o.w || 300) + "px"};min-width:${full ? "712px" : "0"};height:${full ? "min(55vh,500px)" : "auto"};max-width:none">`;
  if (full) h += `<g transform="translate(0 312) rotate(-90)">`;
  if (full) h += `<rect x="30" y="36" width="252" height="${H - 72}" rx="10" fill="#805638"/>`;
  if (full && o.segment) {
    const sy = o.segment.min === 0 ? 4 : edge(o.segment.min - 1),
      ey = edge(o.segment.max);
    h += `<rect class="segment-mark" x="30" y="${sy}" width="252" height="${ey - sy}" rx="6"/>`;
  }
  for (let r = 0; r <= nF; r++)
    h += `<line class="f" x1="36" x2="276" y1="${edge(r)}" y2="${edge(r)}" stroke-width="${r ? 1 : 4}"/>`;
  for (let i = 0; i < 6; i++)
    h += `<line class="s" x1="${X(i)}" x2="${X(i)}" y1="36" y2="${36 + nF * 28}" stroke-width="${2.4 - i * 0.3}"/>`;
  [3, 5, 7, 9, 15, 17, 19, 21].forEach(
    (f) => f <= nF && (h += `<circle class="in" cx="156" cy="${fy(f)}" r="5"/>`),
  );
  if (nF >= 12)
    h += `<circle class="in" cx="108" cy="${fy(12)}" r="5"/><circle class="in" cx="204" cy="${fy(12)}" r="5"/>`;
  if (nF >= 24)
    h += `<circle class="in" cx="108" cy="${fy(24)}" r="5"/><circle class="in" cx="204" cy="${fy(24)}" r="5"/>`;
  [3, 5, 7, 9, 12, 15, 17, 19, 21, 24].forEach(
    (f) => !full && f <= nF && (h += `<text x="8" y="${fy(f) + 4}">${f}</text>`),
  );
  (o.dots || []).forEach(
    ([s, f, c]) => (h += `<circle cx="${X(s)}" cy="${fy(f)}" r="11" style="fill:${c}"/>`),
  );
  (o.mk || []).forEach(
    ([s, v]) =>
      (h +=
        v < 0
          ? `<text x="${X(s) - 4}" y="25" style="font-size:16px">×</text>`
          : `<circle class="h" cx="${X(s)}" cy="20" r="8"/>`),
  );
  if (o.tap)
    for (let r = 0; r <= nF; r++)
      for (let i = 0; i < 6; i++)
        h += `<rect class="tap-zone" data-s="${i}" data-f="${r}" aria-label="${SN[i]}, ${r ? `fret ${r}` : `open string`}" x="${X(i) - 24}" y="${r ? edge(r - 1) : 4}" width="48" height="${r ? edge(r) - edge(r - 1) : 32}"/>`;
  if (full) {
    h += "</g>";
    ["E", "A", "D", "G", "B", "e"].forEach(
      (n, i) =>
        (h +=
          '<text class="neck-label" x="17" y="' +
          (312 - X(i) + 4) +
          '" text-anchor="middle">' +
          n +
          "</text>"),
    );
    [3, 5, 7, 9, 12, 15, 17, 19, 21, 24].forEach(
      (f) =>
        f <= nF &&
        (h += '<text class="neck-label" x="' + fy(f) + '" y="306" text-anchor="middle">' + f + "</text>"),
    );
  }
  h += "</svg>";
  if (full) h += "</div>";
  return h;
}
const dots = (r, g, t) =>
  r
    ? [
        ...g.map(([s, f]) => [s, f, OK]),
        ...(t && !g.some((x) => x[0] == t[0] && x[1] == t[1]) ? [[t[0], t[1], BAD]] : []),
      ]
    : [];
