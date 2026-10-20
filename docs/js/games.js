function selectedSong() {
  return SONGS.find((x) => x.id === S.song) || SONGS[0];
}
function scoreBars() {
  return selectedSong().bars;
}
function scoreNotes() {
  return scoreBars().flatMap((b) => b.notes);
}
const TOPNAV = () =>
  `<nav class="topnav"><button data-page="cards" class="${page === "cards" ? "on" : ""}">Flash Cards</button><button data-page="games" class="${page === "games" ? "on" : ""}">Games</button></nav>`;
function scoreTypes() {
  const a = [];
  if (S.act.some((x) => ["staff", "staffFret", "fretNote", "findFret"].includes(x))) a.push("note");
  if (S.act.includes("interval")) a.push("interval");
  if (S.act.some((x) => ["chord", "spellChord"].includes(x))) a.push("chord");
  if (S.act.includes("spellScale")) a.push("scale");
  return a.length ? a : ["note"];
}
function intervalName(a, b) {
  const d = b - a,
    n =
      [
        "Unison",
        "Minor 2nd",
        "Major 2nd",
        "Minor 3rd",
        "Major 3rd",
        "Perfect 4th",
        "Tritone",
        "Perfect 5th",
        "Minor 6th",
        "Major 6th",
        "Minor 7th",
        "Major 7th",
        "Octave",
      ][Math.min(12, Math.abs(d))] || "Interval";
  return d === 0 ? n : n + (d > 0 ? " up" : " down");
}
function optionsFor(correct, pool) {
  const rest = shuf([...new Set(pool.filter((x) => x !== correct))]).slice(0, 3);
  return shuf([correct, ...rest]);
}
function makeScoreChallenge(barIndex) {
  const type = scoreTypes()[(Math.random() * scoreTypes().length) | 0],
    bar = scoreBars()[barIndex],
    song = selectedSong(),
    base = barIndex * 4;
  let correct, choices, highlight, prompt;
  if (type === "note") {
    const j = (Math.random() * 4) | 0,
      m = bar.notes[j];
    correct = NAMES[m % 12];
    highlight = [base + j];
    prompt = "Which note is this?";
    choices = optionsFor(correct, NAMES);
  } else if (type === "interval") {
    const j = (Math.random() * 3) | 0;
    correct = intervalName(bar.notes[j], bar.notes[j + 1]);
    highlight = [base + j, base + j + 1];
    prompt = "Name the highlighted interval.";
    choices = optionsFor(correct, [
      "Unison",
      "Minor 2nd up",
      "Major 2nd up",
      "Minor 3rd up",
      "Major 3rd up",
      "Perfect 4th up",
      "Perfect 5th up",
      "Minor 2nd down",
      "Major 2nd down",
    ]);
  } else if (type === "chord") {
    correct = bar.chord;
    highlight = [base, base + 1, base + 2, base + 3];
    prompt = "Which chord accompanies this bar?";
    choices = optionsFor(correct, ["C major", "G7", "G major", "F major", "A minor", "D minor"]);
  } else {
    correct = song.scale;
    highlight = Array.from({ length: scoreNotes().length }, (_, i) => i);
    prompt = "Which scale is this theme centered around?";
    choices = optionsFor(correct, song.scaleOptions);
  }
  return { type, correct, choices, highlight, prompt };
}
function scoreStaff() {
  const r = scoreRun,
    notes = scoreNotes(),
    bars = scoreBars(),
    hi = new Set(r.challenge?.highlight || []),
    type = r.challenge?.type || "",
    cls =
      type === "interval"
        ? "mark-interval"
        : type === "note"
          ? "mark-note"
          : type === "chord"
            ? "mark-chord"
            : "mark-scale",
    pmap = [
      [0, ""],
      [0, "♯"],
      [1, ""],
      [1, "♯"],
      [2, ""],
      [3, ""],
      [3, "♯"],
      [4, ""],
      [4, "♯"],
      [5, ""],
      [5, "♯"],
      [6, ""],
    ],
    pos = (m) => {
      const [di] = pmap[m % 12],
        oct = Math.floor(m / 12) - 1;
      return 138 - (oct * 7 + di - 30) * 7;
    },
    x = (i) => 68 + i * 38;
  let h = `<svg class="score-svg" viewBox="0 0 710 190" role="img" aria-label="Treble staff with ${selectedSong().title}">`;
  [82, 96, 110, 124, 138].forEach(
    (y) => (h += `<line class="staff-line" x1="38" x2="686" y1="${y}" y2="${y}"/>`),
  );
  h += '<text class="clef" x="42" y="132">𝄞</text>';
  for (let b = 0; b < bars.length - 1; b++)
    h += `<line class="bar-line" x1="${68 + (b + 1) * 4 * 38 - 19}" x2="${68 + (b + 1) * 4 * 38 - 19}" y1="82" y2="138"/>`;
  if (type === "interval" && hi.size === 2) {
    const left = x(Math.min(...hi)) - 18,
      right = x(Math.max(...hi)) + 18;
    h += `<path class="interval-bracket" d="M${left + 7} 78 H${left} V160 H${left + 7} M${right - 7} 78 H${right} V160 H${right - 7}"/><text class="interval-edge" x="${x(Math.min(...hi))}" y="70" text-anchor="middle">START</text><text class="interval-edge" x="${x(Math.max(...hi))}" y="70" text-anchor="middle">END</text>`;
  }
  if (type === "chord") {
    const cx = 668,
      hs = bars[r.bar].harmony;
    hs.forEach((m) => {
      const y = pos(m),
        pc = m % 12,
        acc = pmap[pc][1];
      if (acc) h += `<text class="accidental mark-chord" x="${cx - 17}" y="${y + 4}">${acc}</text>`;
      h += `<ellipse class="chord-note mark-chord" cx="${cx}" cy="${y}" rx="8" ry="5.5"/>`;
      if (m === 60)
        h += `<line class="staff-line ledger" x1="${cx - 12}" x2="${cx + 12}" y1="${y}" y2="${y}"/>`;
    });
  }
  notes.forEach((m, i) => {
    const y = pos(m),
      active = hi.has(i),
      acc = pmap[m % 12][1];
    if (active) h += `<ellipse class="note-halo ${cls}" cx="${x(i)}" cy="${y}" rx="14" ry="11"/>`;
    if (acc) h += `<text class="accidental ${active ? cls : ""}" x="${x(i) - 15}" y="${y + 4}">${acc}</text>`;
    h += `<ellipse class="score-note ${active ? cls : ""}" cx="${x(i)}" cy="${y}" rx="8" ry="5.5"/>`;
    h += `<line class="stem ${active ? cls : ""}" x1="${x(i) + 7}" x2="${x(i) + 7}" y1="${y}" y2="${y - 34}"/>`;
    if (m % 12 === 0)
      h += `<line class="staff-line ledger" x1="${x(i) - 12}" x2="${x(i) + 12}" y1="${y}" y2="${y}"/>`;
  });
  if (r.phase === "playing") {
    const cx = x((r.clipSequence?.[0] ?? r.bar) * 4);
    h += `<line id="score-cursor" class="score-cursor" x1="${cx}" x2="${cx}" y1="72" y2="160"/>`;
  }
  return h + "</svg>";
}
function animateScoreCursor() {
  const r = scoreRun,
    line = document.getElementById("score-cursor"),
    sc = document.querySelector(".score-scroll");
  if (!r || !line || !sc) return;
  function tick(now) {
    if (scoreRun !== r || r.phase !== "playing") return;
    const elapsed = Math.max(0, now - r.started),
      beatMs = 60000 / r.tempo,
      beat = Math.min(r.clipSequence.length * 4 - 0.001, elapsed / beatMs),
      part = Math.min(r.clipSequence.length - 1, Math.floor(beat / 4)),
      note = Math.min(3, Math.floor(beat - part * 4)),
      bar = r.clipSequence[part],
      x = 68 + bar * 4 * 38 + note * 38;
    line.setAttribute("x1", x);
    line.setAttribute("x2", x);
    const max = Math.max(0, sc.scrollWidth - sc.clientWidth),
      left = Math.max(0, Math.min(max, x - sc.clientWidth * 0.52));
    sc.scrollLeft = left;
    r.scrollLeft = left;
    if (elapsed < r.clipMs) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
function playScoreClip(r) {
  if (S.mute) {
    r.audioError = "Sound is off. Turn sound on to hear the piece.";
    return;
  }
  audioReady()
    .then(() => {
      if (scoreRun !== r) return;
      r.started = performance.now() + 100;
      const t = ctx.currentTime + 0.1,
        beat = 60 / r.tempo;
      r.clipSequence.forEach((bi, part) => {
        const b = scoreBars()[bi],
          base = t + part * 4 * beat;
        b.notes.forEach((m, i) => tone(m, base + i * beat, 0.76 * beat, 0.2));
        b.harmony.forEach((m) => tone(m, base, 3.7 * beat, 0.045, "sine"));
      });
    })
    .catch(() => {
      if (scoreRun === r) {
        r.audioError = "Audio could not start. Check browser audio permissions, then press Play again.";
        render();
      }
    });
}
function scoreHeader() {
  return `<header><span>🎸 Fret Grind</span><span>${S.xp} XP · 🔥${S.st} (best ${S.best})</span></header>${TOPNAV()}`;
}
function renderGames() {
  app.innerHTML =
    scoreHeader() +
    `<div class="card game-library"><div class="tag">GAMES</div><h2>Follow the score</h2><p>Choose a classical theme. The score follows the playback, then a random prompt comes from your enabled Flash Card lessons.</p><div class="song-picker">${SONGS.map((s) => `<button data-song="${s.id}" class="${selectedSong().id === s.id ? "on" : ""}"><b>${s.title}</b><small>${s.composer}</small></button>`).join("")}</div><div class="game-tags">${scoreTypes()
      .map(
        (x) =>
          `<span>${x === "note" ? "Notes" : x === "interval" ? "Intervals" : x === "chord" ? "Chords" : "Scales"}</span>`,
      )
      .join(
        "",
      )}</div><div class="tempo"><button data-game-tempo="80" class="${(S.tempo || 100) === 80 ? "on" : ""}">80 BPM</button><button data-game-tempo="100" class="${(S.tempo || 100) === 100 ? "on" : ""}">100 BPM</button><button data-game-tempo="120" class="${(S.tempo || 100) === 120 ? "on" : ""}">120 BPM</button></div><button class="sound-toggle" data-snd>${S.mute ? "🔇 Sound off · click to enable" : "🔊 Sound on · click to mute"}</button><button class="go" data-score-start>Start Score Run</button><small>Short synthesized themes based on public-domain compositions. No recordings or downloads.</small></div>`;
}
function renderScore() {
  const r = scoreRun,
    total = scoreBars().length,
    song = selectedSong();
  let text =
    r.phase === "intro"
      ? "Listen as the cursor follows the score. A short phrase plays around each question."
      : r.phase === "playing"
        ? "Listen and follow the moving cursor…"
        : r.phase === "question"
          ? r.challenge.prompt
          : r.phase === "feedback"
            ? r.lastCorrect
              ? "✓ Correct"
              : "✗ Answer: " + r.challenge.correct
            : `Run complete · ${r.correct} of ${total} correct`;
  let controls = "";
  if (r.phase === "intro") controls = `<button class="go" data-score-play>Play piece</button>`;
  if (r.phase === "question")
    controls = `<div class="g2">${r.challenge.choices.map((c) => `<button data-score-answer="${c}">${c}</button>`).join("")}</div>`;
  if (r.phase === "feedback")
    controls = `<div class="msg ${r.lastCorrect ? "good" : "badm"}">${r.lastCorrect ? "Correct!" : "The answer was " + r.challenge.correct}</div>`;
  if (r.phase === "complete") controls = `<button class="go" data-score-again>Play again</button>`;
  const typeName = r.challenge
    ? { note: "NOTE", interval: "INTERVAL", chord: "CHORD", scale: "SCALE" }[r.challenge.type] || ""
    : "";
  app.innerHTML =
    scoreHeader() +
    `<div class="card score-card"><div class="tag">SCORE RUN · BAR ${Math.min(r.bar + 1, total)} / ${total} · ${r.tempo} BPM ${typeName ? " · " + typeName : ""}</div><div class="prompt">${text}</div><div class="score-scroll">${scoreStaff()}</div><div class="score-legend"><span class="legend-note">Note</span><span class="legend-interval">Interval · START → END</span><span class="legend-chord">Chord</span><span class="legend-scale">Scale</span></div><div class="score-meta">${song.title} · ${song.composer} · ${r.audioError || "Cursor follows the notes; a short lead-in and tail play around each prompt."}</div>${controls}<button class="sound-toggle" data-snd>${S.mute ? "🔇 Sound off · click to enable" : "🔊 Sound on · click to mute"}</button><button class="rs" data-page="games">← Games</button></div>`;
  const sc = app.querySelector(".score-scroll");
  if (sc) {
    let left = r.scrollLeft || 0;
    if (r.phase === "playing") {
      const start = 68 + (r.clipSequence?.[0] || 0) * 4 * 38;
      left = Math.max(0, start - sc.clientWidth * 0.56);
    } else if ((r.phase === "question" || r.phase === "feedback") && r.challenge) {
      const ix = r.challenge.highlight,
        focus = ix.reduce((a, n) => a + 68 + n * 38, 0) / ix.length;
      left = Math.max(0, focus - sc.clientWidth * 0.56);
    }
    sc.scrollLeft = Math.min(left, Math.max(0, sc.scrollWidth - sc.clientWidth));
    r.scrollLeft = sc.scrollLeft;
  }
  if (r.phase === "playing") animateScoreCursor();
}
function launchScore() {
  S.mute = false;
  save();
  scoreRun = { bar: 0, phase: "intro", tempo: S.tempo || 100, correct: 0, audioError: "" };
  render();
}
function beginScoreBar() {
  const r = scoreRun;
  if (!r) return;
  r.challenge = makeScoreChallenge(r.bar);
  r.phase = "playing";
  r.clipSequence = [Math.max(0, r.bar - 1), r.bar, Math.min(scoreBars().length - 1, r.bar + 1)];
  r.barMs = (4 * 60000) / r.tempo;
  r.clipMs = r.clipSequence.length * r.barMs;
  r.started = performance.now() + 100;
  r.audioError = "";
  render();
  playScoreClip(r);
  clearTimeout(r.timer);
  r.timer = setTimeout(() => {
    if (scoreRun !== r || r.phase !== "playing") return;
    r.phase = "question";
    render();
  }, r.clipMs + 700);
}
function answerScore(a) {
  const r = scoreRun;
  if (!r || r.phase !== "question") return;
  r.lastCorrect = a === r.challenge.correct;
  if (r.lastCorrect) {
    r.correct++;
    S.xp += 5;
    save();
  }
  r.phase = "feedback";
  render();
  r.timer = setTimeout(() => {
    if (scoreRun !== r) return;
    if (r.bar + 1 >= scoreBars().length) {
      r.phase = "complete";
      render();
    } else {
      r.bar++;
      beginScoreBar();
    }
  }, 1050);
}
