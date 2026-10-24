/* Library (browse chords & scales) and Practice (play along with a metronome).
   Both tabs share one selection (S.prac). Chord voicings come from chorddb.js; scales are built from interval formulas.
   The metronome is scheduled on the audio clock (look-ahead) and the highlight follows the same clock. */

const KEYS = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];
const prPretty = (s) => s.replace("#", "♯").replace(/b/g, (c, i) => (i === 1 && /^[A-G]/.test(s) ? "♭" : c));
const prRoot = (k) => ({ n: prPretty(k), l: LET.indexOf(k[0]), pc: (LSEM[LET.indexOf(k[0])] + (k[1] === "#" ? 1 : k[1] === "b" ? -1 : 0) + 12) % 12 });

// suffix -> [name, symbol, formula]
const CH = {
  major: ["Major", "", "1 3 5"],
  minor: ["Minor", "m", "1 b3 5"],
  7: ["Dominant 7th", "7", "1 3 5 b7"],
  maj7: ["Major 7th", "maj7", "1 3 5 7"],
  m7: ["Minor 7th", "m7", "1 b3 5 b7"],
  sus2: ["Suspended 2nd", "sus2", "1 2 5"],
  sus4: ["Suspended 4th", "sus4", "1 4 5"],
  dim: ["Diminished", "dim", "1 b3 b5"],
  aug: ["Augmented", "aug", "1 3 #5"],
  6: ["Major 6th", "6", "1 3 5 6"],
  add9: ["Add 9", "add9", "1 3 5 9"],
  m7b5: ["Half-diminished", "m7♭5", "1 b3 b5 b7"],
  m6: ["Minor 6th", "m6", "1 b3 5 6"],
  madd9: ["Minor add 9", "madd9", "1 b3 5 9"],
  9: ["Dominant 9th", "9", "1 3 5 b7 9"],
  m9: ["Minor 9th", "m9", "1 b3 5 b7 9"],
  maj9: ["Major 9th", "maj9", "1 3 5 7 9"],
  11: ["Dominant 11th", "11", "1 3 5 b7 9 11"],
  m11: ["Minor 11th", "m11", "1 b3 5 b7 9 11"],
  maj11: ["Major 11th", "maj11", "1 3 5 7 9 11"],
  13: ["Dominant 13th", "13", "1 3 5 b7 9 13"],
  maj13: ["Major 13th", "maj13", "1 3 5 7 9 13"],
  69: ["Six-nine", "6/9", "1 3 5 6 9"],
  m69: ["Minor six-nine", "m6/9", "1 b3 5 6 9"],
  dim7: ["Diminished 7th", "dim7", "1 b3 b5 bb7"],
  "7sus4": ["7 suspended 4th", "7sus4", "1 4 5 b7"],
  aug7: ["Augmented 7th", "aug7", "1 3 #5 b7"],
  aug9: ["Augmented 9th", "aug9", "1 3 #5 b7 9"],
  "7b5": ["7♭5", "7♭5", "1 3 b5 b7"],
  "9b5": ["9♭5", "9♭5", "1 3 b5 b7 9"],
  "7b9": ["7♭9", "7♭9", "1 3 5 b7 b9"],
  "7#9": ["7♯9 (Hendrix)", "7♯9", "1 3 5 b7 #9"],
  "9#11": ["9♯11", "9♯11", "1 3 5 b7 9 #11"],
  maj7b5: ["Major 7♭5", "maj7♭5", "1 3 b5 7"],
  "maj7#5": ["Major 7♯5", "maj7♯5", "1 3 #5 7"],
  mmaj7: ["Minor-major 7th", "m(maj7)", "1 b3 5 7"],
  mmaj7b5: ["Minor-major 7♭5", "m(maj7♭5)", "1 b3 b5 7"],
  mmaj9: ["Minor-major 9th", "m(maj9)", "1 b3 5 7 9"],
  mmaj11: ["Minor-major 11th", "m(maj11)", "1 b3 5 7 9 11"],
};
const CH_COMMON = ["major", "minor", "7", "maj7", "m7", "sus2", "sus4", "dim", "aug", "6", "add9", "m7b5"];
// slash chords ("/E", "m/B") are a major or minor chord over a bass note
function prChordInfo(suf) {
  if (CH[suf]) return { ...{ name: CH[suf][0], sym: CH[suf][1], formula: CH[suf][2] }, bass: null };
  const m = suf.match(/^(m?)\/([A-G][#b]?)$/);
  if (!m) return null;
  const base = CH[m[1] ? "minor" : "major"];
  return { name: (m[1] ? "Minor" : "Major") + " over " + prPretty(m[2]), sym: m[1] + "/" + prPretty(m[2]), formula: base[2], bass: m[2] };
}
const PR_SCALES = [
  ["Major (Ionian)", "1 2 3 4 5 6 7"],
  ["Natural minor (Aeolian)", "1 2 b3 4 5 b6 b7"],
  ["Minor pentatonic", "1 b3 4 5 b7"],
  ["Major pentatonic", "1 2 3 5 6"],
  ["Blues", "1 b3 4 b5 5 b7"],
  ["Major blues", "1 2 b3 3 5 6"],
  ["Dorian", "1 2 b3 4 5 6 b7"],
  ["Phrygian", "1 b2 b3 4 5 b6 b7"],
  ["Lydian", "1 2 3 #4 5 6 7"],
  ["Mixolydian", "1 2 3 4 5 6 b7"],
  ["Locrian", "1 b2 b3 4 b5 b6 b7"],
  ["Harmonic minor", "1 2 b3 4 5 b6 7"],
  ["Melodic minor", "1 2 b3 4 5 6 7"],
  ["Phrygian dominant", "1 b2 3 4 5 b6 b7"],
  ["Lydian dominant", "1 2 3 #4 5 6 b7"],
  ["Altered", "1 b2 b3 b4 b5 b6 b7"],
  ["Whole tone", "1 2 3 #4 #5 b7"],
  ["Diminished (whole-half)", "1 2 b3 4 b5 b6 bb7 7"],
  ["Diminished (half-whole)", "1 b2 b3 3 #4 5 6 b7"],
  ["Hungarian minor", "1 2 b3 #4 5 b6 7"],
  ["Bebop dominant", "1 2 3 4 5 6 b7 7"],
];
const DEGS = [0, 2, 4, 5, 7, 9, 11];
// one formula token -> {semis above the root, letters above the root, text}
function prTok(tok) {
  const m = tok.match(/^(bb|b|#)?(\d+)$/),
    n = +m[2],
    acc = m[1] === "#" ? 1 : m[1] === "bb" ? -2 : m[1] === "b" ? -1 : 0;
  return { semis: DEGS[(n - 1) % 7] + (n > 7 ? 12 : 0) + acc, letters: n - 1, text: (m[1] || "").replace("bb", "♭♭").replace("b", "♭").replace("#", "♯") + n };
}
// the spelled name of the note `tok` above root r
function prName(r, tok) {
  const t = prTok(tok),
    li = (r.l + t.letters) % 7;
  let d = (((r.pc + t.semis - LSEM[li]) % 12) + 12) % 12;
  if (d > 6) d -= 12;
  return LET[li] + (d > 0 ? "♯".repeat(d) : d < 0 ? "♭".repeat(-d) : "");
}
const prAcc = (t) => (t.match(/♯/g) || []).length - (t.match(/♭/g) || []).length;
function prNote(m, t) {
  const acc = prAcc(t),
    oct = Math.floor((m - acc) / 12) - 1;
  return { m, t, acc, step: oct * 7 + LET.indexOf(t[0]) };
}

/* ----- the selection as drawable columns ----- */
const prFret = (v, s) => (v[1][s] > 0 ? v[1][s] + v[0] - 1 : v[1][s]); // absolute fret (>0), 0 open, -1 muted
function prVoices() {
  const P = S.prac;
  return (CHORDDB[KEYS[P.cRoot]] || {})[P.cSuf] || [];
}
function prVoiceLabel(v) {
  const fr = v[1].map((_, s) => prFret(v, s)).filter((f) => f > 0);
  return v[0] === 1 && v[1].includes(0) ? "Open" : v[0] === 1 && !v[1].includes(0) ? "Fret " + Math.min(...fr) : "Fret " + Math.min(...fr);
}
function prChord() {
  const P = S.prac,
    r = prRoot(KEYS[P.cRoot]),
    info = prChordInfo(P.cSuf),
    v = prVoices()[P.cVoice] || prVoices()[0],
    toks = info.formula.split(" "),
    map = {};
  toks.forEach((t) => {
    const pc = (r.pc + prTok(t).semis) % 12;
    if (!(pc in map)) map[pc] = prName(r, t);
  });
  if (info.bass) {
    const b = info.bass;
    map[(LSEM[LET.indexOf(b[0])] + (b[1] === "#" ? 1 : b[1] === "b" ? -1 : 0) + 12) % 12] = prPretty(b);
  }
  const tab = [],
    notes = [];
  v[1].forEach((_, s) => {
    const f = prFret(v, s);
    if (f < 0) return;
    const m = OPEN[s] + f;
    tab.push([s, f]);
    notes.push(prNote(m, map[m % 12] || NAMES[m % 12].split("/")[0]));
  });
  notes.sort((a, b) => a.m - b.m);
  return {
    kind: "chord",
    title: r.n + info.sym,
    sub: r.n + " " + info.name.toLowerCase(),
    cols: [{ notes, tab }],
    muted: v[1].map((f, s) => (f < 0 ? s : -1)).filter((s) => s >= 0),
    spelled: [...new Set(notes.map((n) => n.t))].join("  "),
    formula: toks.map((t) => prTok(t).text).join(" ") + (info.bass ? " / " + prPretty(info.bass) : ""),
    voice: v,
  };
}
function prScale() {
  const P = S.prac,
    r = RT[P.root],
    [name, formula] = PR_SCALES[P.scale],
    toks = formula.split(" ");
  let base = OPEN[0];
  while (base % 12 !== r.pc) base++;
  const up = toks.map((t) => prNote(base + prTok(t).semis, prName(r, t)));
  up.push(prNote(base + 12, up[0].t));
  // the lowest hand position (a window of frets) that covers every note
  let pos = null;
  for (const span of [4, 5, 6, 7, 9]) {
    for (let lo = 0; lo <= 24 - span && !pos; lo++) {
      const p = up.map((n) => posAll(n.m).find(([, f]) => f >= lo && f <= lo + span));
      if (p.every(Boolean)) pos = p;
    }
    if (pos) break;
  }
  pos = pos || up.map((n) => posAll(n.m)[0]);
  const idx = up.map((_, i) => i),
    order = P.updown ? idx.concat(idx.slice(0, -1).reverse().slice(0, -1)) : idx;
  return {
    kind: "scale",
    title: `${r.n} ${name}`,
    sub: "",
    cols: order.map((i) => ({ notes: [up[i]], tab: [pos[i]] })),
    spelled: up.map((n) => n.t).join("  "),
    formula: toks.map((t) => prTok(t).text).join(" "),
  };
}
const pracItems = () => (S.prac.kind === "chord" ? prChord() : prScale());

/* ----- drawing ----- */
const PR_X0 = 78,
  PR_DX = 46;
const prX = (i) => PR_X0 + i * PR_DX;
function prStaff(it) {
  const y = (s) => 180 - (s - 30) * 4;
  const steps = it.cols.flatMap((c) => c.notes.map((n) => n.step)),
    minY = Math.min(104, y(Math.max(...steps)) - 44),
    maxY = Math.max(200, y(Math.min(...steps)) + 40),
    W = prX(it.cols.length - 1) + 40;
  let h = `<svg viewBox="0 ${minY} ${W} ${maxY - minY}" style="width:${W}px;height:${maxY - minY}px" class="pr-svg pr-staff" role="img" aria-label="Sheet music for ${it.title}">`;
  for (let i = 0; i < 5; i++) h += `<line class="ln" x1="8" x2="${W - 8}" y1="${y(30 + i * 2)}" y2="${y(30 + i * 2)}"/>`;
  h += `<text class="clef" x="14" y="172" font-size="62">𝄞</text>`;
  it.cols.forEach((c, i) => {
    const cx = prX(i),
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
function prTab(it) {
  const Y = (s) => 22 + (5 - s) * 18, // high e on top
    W = prX(it.cols.length - 1) + 40;
  let h = `<svg viewBox="0 0 ${W} 138" style="width:${W}px;height:138px" class="pr-svg pr-tab" role="img" aria-label="Tab for ${it.title}">`;
  for (let s = 0; s < 6; s++) {
    h += `<line class="ln" x1="40" x2="${W - 8}" y1="${Y(s)}" y2="${Y(s)}"/>`;
    h += `<text class="tl" x="20" y="${Y(s) + 4}" text-anchor="middle">${["E", "A", "D", "G", "B", "e"][s]}</text>`;
  }
  it.cols.forEach((c, i) => {
    const cx = prX(i);
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
function prBox(v) {
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

/* ----- metronome / sync ----- */
let met = null;
function prClick(t, accent) {
  const o = ctx.createOscillator(),
    g = ctx.createGain();
  o.type = "square";
  o.frequency.value = accent ? 1760 : 1175;
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(accent ? 0.16 : 0.1, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.045);
  o.connect(g);
  g.connect(ctx.destination);
  o.start(t);
  o.stop(t + 0.06);
}
function prSchedule() {
  const P = S.prac,
    spb = 60 / P.bpm;
  while (met && met.next < ctx.currentTime + 0.16) {
    const t = met.next;
    if (met.ci > 0) {
      // count-in: one bar of clicks
      prClick(t, met.ci === 4);
      met.q.push({ t, col: -1, beat: 4 - met.ci });
      met.ci--;
      met.next += spb;
      continue;
    }
    const it = pracItems(),
      chord = it.kind === "chord",
      sub = chord ? 1 : P.sub,
      g = met.g,
      beat = Math.floor(g / sub) % 4,
      col = chord ? 0 : g % it.cols.length;
    if (g % sub === 0 && P.click) prClick(t, beat === 0);
    if (P.notes) {
      const ms = it.cols[col].notes.map((n) => n.m),
        v = 0.3 / Math.sqrt(ms.length),
        d = Math.min(chord ? 0.9 : 0.5, (spb / sub) * (chord ? 1.6 : 1.1));
      ms.forEach((m, i) => tone(m, t + (chord ? i * 0.028 : 0), d, v * 1.6, "triangle", true));
    }
    met.q.push({ t, col, beat });
    met.g++;
    met.next += spb / sub;
  }
}
function prShow(s) {
  document.querySelectorAll(".pn.hot,.tn.hot").forEach((e) => e.classList.remove("hot"));
  document.querySelectorAll(".bd").forEach((e) => e.classList.toggle("on", !!s && +e.dataset.b === s.beat));
  if (!s) return;
  met && (met.shown = s);
  if (s.col < 0) return;
  document.querySelectorAll(`[data-col="${s.col}"]`).forEach((e) => e.classList.add("hot"));
  const box = document.querySelector(".pr-scroll");
  if (box && box.scrollWidth > box.clientWidth) box.scrollLeft = prX(s.col) - box.clientWidth / 2;
}
function prFrame() {
  if (!met) return;
  while (met.q.length && met.q[0].t <= ctx.currentTime) prShow(met.q.shift());
  met.raf = requestAnimationFrame(prFrame);
}
function metStart() {
  if (met) return;
  met = { starting: true };
  audioReady()
    .then(() => {
      if (!met) return;
      met = { next: ctx.currentTime + 0.1, g: 0, ci: S.prac.countIn ? 4 : 0, q: [], shown: null };
      prSchedule();
      met.timer = setInterval(prSchedule, 25);
      met.raf = requestAnimationFrame(prFrame);
      render();
    })
    .catch(() => {
      met = null;
      render();
    });
  render();
}
function metStop() {
  if (!met) return;
  clearInterval(met.timer);
  cancelAnimationFrame(met.raf);
  met = null;
  if (page === "practice") render();
}
document.addEventListener("visibilitychange", () => document.hidden && met && metStop());

/* ----- pages ----- */
const prSeg = (key, opts, val) =>
  `<div class="seg">${opts.map(([v, l]) => `<button data-pr="${key}" data-v="${v}" class="${String(val) === String(v) ? "on" : ""}">${l}</button>`).join("")}</div>`;
const prTog = (key, label, on) => `<button data-pr="${key}" class="tg ${on ? "a" : ""}" aria-pressed="${on}">${label}</button>`;
const PR_VIEWS = [["staff", "Sheet music"], ["tab", "Tab"], ["both", "Both"]];

function prPicker() {
  const P = S.prac;
  if (P.kind === "scale")
    return `<div class="chips pr-pick">${RT.map((r, i) => `<button data-pr="root" data-v="${i}" class="${P.root === i ? "a" : ""}">${r.n}</button>`).join("")}</div>
      <label class="pr-sel">Scale <select data-pr-sel="scale">${PR_SCALES.map((q, i) => `<option value="${i}"${P.scale === i ? " selected" : ""}>${q[0]}</option>`).join("")}</select></label>`;
  const have = Object.keys(CHORDDB[KEYS[P.cRoot]] || {}),
    common = CH_COMMON.filter((s) => have.includes(s)),
    groups = [
      ["Common", common],
      ["Sevenths, 6ths & extensions", have.filter((s) => CH[s] && !common.includes(s))],
      ["Slash chords", have.filter((s) => !CH[s])],
    ];
  return `<div class="chips pr-pick">${KEYS.map((k, i) => `<button data-pr="cRoot" data-v="${i}" class="${P.cRoot === i ? "a" : ""}">${prPretty(k)}</button>`).join("")}</div>
    <div class="chips pr-pick">${common.map((s) => `<button data-pr="cSuf" data-v="${s}" class="${P.cSuf === s ? "a" : ""}">${CH[s][1] || "maj"}</button>`).join("")}</div>
    <label class="pr-sel">All chord types <select data-pr-sel="cSuf">${groups
      .filter((g) => g[1].length)
      .map((g) => `<optgroup label="${g[0]}">${g[1].map((s) => `<option value="${s}"${P.cSuf === s ? " selected" : ""}>${prChordInfo(s).sym || "maj"} · ${prChordInfo(s).name}</option>`).join("")}</optgroup>`)
      .join("")}</select></label>`;
}
function prNotation(it) {
  const P = S.prac;
  return `${prSeg("view", PR_VIEWS, P.view)}<div class="pr-scroll">${P.view !== "tab" ? prStaff(it) : ""}${P.view !== "staff" ? prTab(it) : ""}</div>`;
}
function prHeading(it) {
  return `<h2>${it.title}</h2><p class="pr-sub">${it.kind === "chord" ? it.sub + " · " : ""}Notes: ${it.spelled} · Formula: ${it.formula}</p>`;
}

function renderLibrary() {
  const P = S.prac,
    it = pracItems(),
    chord = it.kind === "chord",
    vs = prVoices();
  app.innerHTML = `${scoreHeader()}<div class="card prac">
    <div class="tag">LIBRARY</div>
    ${prSeg("kind", [["chord", "Chords"], ["scale", "Scales"]], P.kind)}
    ${prPicker()}
    ${prHeading(it)}
    ${chord ? `<div class="chips pr-pick" aria-label="Voicings">${vs.map((v, i) => `<button data-pr="cVoice" data-v="${i}" class="${P.cVoice === i ? "a" : ""}">${i + 1} · ${prVoiceLabel(v)}</button>`).join("")}</div><div class="pr-boxwrap">${prBox(it.voice)}</div>` : ""}
    ${prNotation(it)}
    <div class="pr-ctl"><button class="go pr-play" data-pr="hear">🔊 Hear it</button><button class="go alt pr-play" data-pr="toPractice">Practice this with the metronome →</button></div>
    <small>${chord ? "Voicings from the open-source chords-db library (MIT)." : "One octave in a single hand position; Up &amp; down is on the Practice tab."}</small>
  </div>`;
}
function renderPractice() {
  const P = S.prac,
    it = pracItems(),
    chord = it.kind === "chord",
    run = met && !met.starting,
    vs = prVoices(),
    beats = [0, 1, 2, 3].map((b) => `<span class="bd" data-b="${b}">${b + 1}</span>`).join("");
  app.innerHTML = `${scoreHeader()}<div class="card prac">
    <div class="tag">PRACTICE</div>
    <div class="pr-now"><div>${prHeading(it)}</div><button class="tg" data-page="library">Change in Library</button></div>
    ${chord && vs.length > 1 ? `<div class="chips pr-pick" aria-label="Voicings">${vs.map((v, i) => `<button data-pr="cVoice" data-v="${i}" class="${P.cVoice === i ? "a" : ""}">${i + 1} · ${prVoiceLabel(v)}</button>`).join("")}</div>` : ""}
    ${prNotation(it)}
    <div class="beats" aria-label="Beat">${beats}</div>
    <div class="pr-ctl">
      <button class="go pr-play" data-pr="play">${run ? "■ Stop" : met ? "…" : "▶ Start"}</button>
      <div class="bpm"><button data-pr="bpm" data-v="-5" aria-label="Slower">−</button><label><b id="bpmv">${P.bpm}</b> BPM<input type="range" id="bpmr" min="40" max="200" step="1" value="${P.bpm}" aria-label="Tempo in beats per minute"/></label><button data-pr="bpm" data-v="5" aria-label="Faster">+</button></div>
    </div>
    <div class="chips pr-opts">${prTog("click", "🕒 Click", P.click)}${prTog("notes", "🔊 Notes", P.notes)}${prTog("countIn", "1-bar count-in", P.countIn)}${chord ? "" : prTog("sub", "Eighth notes", P.sub === 2) + prTog("updown", "Up & down", P.updown)}</div>
    <small>${chord ? "The chord is strummed on every beat." : "One note per beat (two with Eighth notes); the loop repeats until you stop it."} The highlight follows the audio. Space starts and stops.</small>
  </div>`;
  if (run && met.shown) prShow(met.shown);
}
function practiceClick(k, v) {
  const P = S.prac;
  if (k === "play") return met ? metStop() : metStart();
  if (k === "hear") {
    const it = pracItems(),
      ms = it.kind === "chord" ? it.cols[0].notes.map((n) => n.m) : it.cols.map((c) => c.notes[0].m);
    return play({ snd: ms, gap: it.kind === "chord" ? 0.035 : 0.28 });
  }
  if (k === "toPractice") {
    page = "practice";
    return render();
  }
  if (k === "kind") P.kind = v;
  else if (k === "cRoot") (P.cRoot = +v), (P.cVoice = 0), prFixSuffix();
  else if (k === "cSuf") (P.cSuf = v), (P.cVoice = 0);
  else if (k === "cVoice") P.cVoice = +v;
  else if (k === "root") P.root = +v;
  else if (k === "scale") P.scale = +v;
  else if (k === "view") P.view = v;
  else if (k === "bpm") P.bpm = Math.max(40, Math.min(200, P.bpm + +v));
  else if (k === "sub") P.sub = P.sub === 2 ? 1 : 2;
  else if (["click", "notes", "countIn", "updown"].includes(k)) P[k] = !P[k];
  save();
  render();
}
// keep the chord type valid when switching key (some keys lack some slash chords)
function prFixSuffix() {
  const P = S.prac;
  if (!(CHORDDB[KEYS[P.cRoot]] || {})[P.cSuf]) P.cSuf = "major";
}
app.addEventListener("input", (e) => {
  if (e.target.id !== "bpmr") return;
  S.prac.bpm = +e.target.value;
  const l = document.getElementById("bpmv");
  l && (l.textContent = S.prac.bpm);
  save();
});
app.addEventListener("change", (e) => {
  const k = e.target.dataset && e.target.dataset.prSel;
  if (k) practiceClick(k, e.target.value);
});
