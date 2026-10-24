/* Practice library: pick a chord or scale, read it as sheet music and/or tab, and play along with a metronome.
   The metronome is scheduled on the audio clock (look-ahead), and the highlight follows the same clock. */

const PR_X0 = 78, // x of the first column
  PR_DX = 46; // distance between columns
const prAcc = (t) => (t.match(/♯/g) || []).length - (t.match(/♭/g) || []).length;
function prNote(m, t) {
  const acc = prAcc(t),
    oct = Math.floor((m - acc) / 12) - 1;
  return { m, t, acc, step: oct * 7 + LET.indexOf(t[0]) };
}

/* ----- the material ----- */
// A scale as columns: one note each, with tab positions chosen from one hand position.
function prScale(ri, qi, updown) {
  const r = RT[ri],
    [name, st, se] = SQ[qi],
    sp = spell(r, st, se);
  let base = OPEN[0];
  while (base % 12 !== r.pc) base++;
  const up = sp.map((x, i) => prNote(base + se[i], x.t));
  up.push(prNote(base + 12, sp[0].t));
  // pick the lowest hand position (a window of frets) that covers every note
  let pos = null;
  for (const span of [4, 5, 6, 7, 9]) {
    for (let lo = 0; lo <= 24 - span && !pos; lo++) {
      const p = up.map((n) => posAll(n.m).find(([, f]) => f >= lo && f <= lo + span));
      if (p.every(Boolean)) pos = p;
    }
    if (pos) break;
  }
  pos = pos || up.map((n) => posAll(n.m)[0]);
  const idx = up.map((_, i) => i);
  const order = updown ? idx.concat(idx.slice(0, -1).reverse().slice(0, -1)) : idx;
  return {
    kind: "scale",
    title: `${r.n} ${name}`,
    cols: order.map((i) => ({ notes: [up[i]], tab: [pos[i]] })),
    spelled: up.map((n) => n.t).join("  "),
  };
}
// An open-position chord shape from SH, spelled from its root and quality.
function prChord(key) {
  const mt = key.match(/^([A-G])(.*)$/),
    rt = RT.find((x) => x.n === mt[1]),
    q = CQ.find((c) => c[0] === mt[2]),
    sp = spell(rt, q[2], q[3]),
    fr = SH[key],
    tab = [],
    notes = [];
  fr.forEach((f, s) => {
    if (f < 0) return;
    const m = OPEN[s] + f;
    tab.push([s, f]);
    notes.push(prNote(m, (sp.find((x) => x.pc === m % 12) || { t: NAMES[m % 12] }).t));
  });
  notes.sort((a, b) => a.m - b.m);
  return {
    kind: "chord",
    title: `${rt.n}${q[0]} · ${rt.n} ${q[1]}`,
    cols: [{ notes, tab }],
    muted: fr.map((f, s) => (f < 0 ? s : -1)).filter((s) => s >= 0),
    spelled: sp.map((x) => x.t).join("  "),
  };
}
function pracItems() {
  const P = S.prac;
  return P.kind === "chord" ? prChord(P.chord) : prScale(P.root, P.scale, P.updown);
}

/* ----- drawing ----- */
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
      const nx = cx + (flip ? 10 : 0);
      if (n.acc) h += `<text class="acc" x="${cx - 21 - 11 * (ac++ % 3)}" y="${y(n.step) + 5}">${n.acc > 0 ? "♯" : "♭"}</text>`;
      h += `<ellipse class="nh" cx="${nx}" cy="${y(n.step)}" rx="7.5" ry="5.4"/>`;
    });
    const up = hi < 34;
    h += up
      ? `<line class="stem" x1="${cx + 7}" x2="${cx + 7}" y1="${y(lo)}" y2="${y(hi) - 30}"/>`
      : `<line class="stem" x1="${cx - 7}" x2="${cx - 7}" y1="${y(hi)}" y2="${y(lo) + 30}"/>`;
    return (h += "</g>");
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

/* ----- page ----- */
const PR_VIEWS = [
  ["staff", "Sheet music"],
  ["tab", "Tab"],
  ["both", "Both"],
];
const prSeg = (key, opts, val) =>
  `<div class="seg">${opts.map(([v, l]) => `<button data-pr="${key}" data-v="${v}" class="${String(val) === String(v) ? "on" : ""}">${l}</button>`).join("")}</div>`;
const prTog = (key, label, on) => `<button data-pr="${key}" class="tg ${on ? "a" : ""}" aria-pressed="${on}">${label}</button>`;

function renderPractice() {
  const P = S.prac,
    it = pracItems(),
    chord = it.kind === "chord",
    run = met && !met.starting;
  const pick = chord
    ? `<div class="chips pr-pick">${Object.keys(SH).map((k) => `<button data-pr="chord" data-v="${k}" class="${P.chord === k ? "a" : ""}">${k}</button>`).join("")}</div>`
    : `<div class="chips pr-pick">${RT.map((r, i) => `<button data-pr="root" data-v="${i}" class="${P.root === i ? "a" : ""}">${r.n}</button>`).join("")}</div>
       <div class="chips pr-pick">${SQ.map((q, i) => `<button data-pr="scale" data-v="${i}" class="${P.scale === i ? "a" : ""}">${q[0]}</button>`).join("")}</div>`;
  const beats = [0, 1, 2, 3].map((b) => `<span class="bd" data-b="${b}">${b + 1}</span>`).join("");
  app.innerHTML = `${scoreHeader()}<div class="card prac">
    <div class="tag">PRACTICE LIBRARY</div>
    ${prSeg("kind", [["chord", "Chords"], ["scale", "Scales"]], P.kind)}
    ${pick}
    <h2>${it.title}</h2>
    <p class="pr-sub">${chord ? "Notes" : "Scale"}: ${it.spelled}${chord ? " · open-position shape" : " · one octave, one hand position"}</p>
    ${prSeg("view", PR_VIEWS, P.view)}
    <div class="pr-scroll">${P.view !== "tab" ? prStaff(it) : ""}${P.view !== "staff" ? prTab(it) : ""}</div>
    <div class="beats" aria-label="Beat">${beats}</div>
    <div class="pr-ctl">
      <button class="go pr-play" data-pr="play">${run ? "■ Stop" : met ? "…" : "▶ Start"}</button>
      <div class="bpm"><button data-pr="bpm" data-v="-5" aria-label="Slower">−</button><label><b id="bpmv">${P.bpm}</b> BPM<input type="range" id="bpmr" min="40" max="200" step="1" value="${P.bpm}" aria-label="Tempo in beats per minute"/></label><button data-pr="bpm" data-v="5" aria-label="Faster">+</button></div>
    </div>
    <div class="chips pr-opts">${prTog("click", "🕒 Click", P.click)}${prTog("notes", "🔊 Notes", P.notes)}${prTog("countIn", "1-bar count-in", P.countIn)}${chord ? "" : prTog("sub", "Eighth notes", P.sub === 2) + prTog("updown", "Up & down", P.updown)}</div>
    <small>${chord ? "The chord is strummed on every beat." : "One note per beat (two with Eighth notes) and the loop repeats until you stop it."} The highlight follows the audio, so you can read along. Space starts and stops.</small>
  </div>`;
  if (run && met.shown) prShow(met.shown);
}
function practiceClick(k, v) {
  const P = S.prac;
  if (k === "play") return met ? metStop() : metStart();
  if (k === "kind") P.kind = v;
  else if (k === "chord") P.chord = v;
  else if (k === "root") P.root = +v;
  else if (k === "scale") P.scale = +v;
  else if (k === "view") P.view = v;
  else if (k === "bpm") P.bpm = Math.max(40, Math.min(200, P.bpm + +v));
  else if (k === "sub") P.sub = P.sub === 2 ? 1 : 2;
  else if (["click", "notes", "countIn", "updown"].includes(k)) P[k] = !P[k];
  save();
  render();
}
app.addEventListener("input", (e) => {
  if (e.target.id !== "bpmr") return;
  S.prac.bpm = +e.target.value;
  const l = document.getElementById("bpmv");
  l && (l.textContent = S.prac.bpm);
  save();
});
