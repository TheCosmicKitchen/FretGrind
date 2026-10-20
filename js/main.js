app.onclick = (e) => {
  const b = e.target.closest(
    "[data-a],[data-t],[data-check],[data-next],[data-got],[data-d],[data-g],[data-snd],[data-mic],[data-micskip],[data-reset],[data-s],[data-play],[data-tempo],[data-page],[data-song],[data-score-start],[data-score-play],[data-score-answer],[data-score-again],[data-game-tempo]",
  );
  if (!b) return;
  const D = b.dataset;
  if ("page" in D) {
    if (D.page === "cards" && page === "games" && scoreRun) {
      clearTimeout(scoreRun.timer);
      scoreRun = null;
    }
    page = D.page;
    return render();
  }
  if ("song" in D) {
    S.song = D.song;
    save();
    return render();
  }
  if ("gameTempo" in D) {
    S.tempo = +D.gameTempo;
    save();
    if (scoreRun) scoreRun.tempo = S.tempo;
    return render();
  }
  if ("scoreStart" in D) return launchScore();
  if ("scorePlay" in D) return beginScoreBar();
  if ("scoreAnswer" in D) return answerScore(D.scoreAnswer);
  if ("scoreAgain" in D) return launchScore();
  if ("mic" in D) return toggleMic();
  if ("snd" in D) {
    S.mute = !S.mute;
    save();
    return render();
  }
  if ("play" in D) return play(cur.q);
  if ("tempo" in D) {
    S.tempo = +D.tempo;
    save();
    if (cur.q.kind == "rhythm") cur.q.tempo = S.tempo;
    return render();
  }
  if ("rand" in D) {
    S.randomize = !S.randomize;
    save();
    return next();
  }
  if ("g" in D) {
    const ds = GR[D.g],
      on = ds.some((x) => S.act.includes(x));
    if (on) {
      const r = S.act.filter((x) => !ds.includes(x));
      if (!r.length) return;
      S.act = r;
    } else S.act.push(...ds);
    save();
    return next();
  }
  if ("d" in D) {
    const i = S.act.indexOf(D.d);
    if (i >= 0) {
      if (S.act.length > 1) S.act.splice(i, 1);
    } else S.act.push(D.d);
    save();
    return next();
  }
  if ("reset" in D) {
    if (!rs) {
      rs = 1;
      return render();
    }
    S = { it: {}, act: S.act, xp: 0, st: 0, best: 0 };
    rs = 0;
    retry = [];
    save();
    return next();
  }
  if (!cur) return;
  rs = 0;
  const q = cur.q;
  if ("got" in D) {
    const it = S.it[cur.k];
    it.seen = 1;
    it.due = Date.now();
    retry.push({ k: cur.k, at: cnt + 2 });
    save();
    return next();
  }
  if ("micskip" in D) return fin(false);
  if ("next" in D) return next();
  if (cur.done) return;
  if ("a" in D) {
    cur.ch = D.a;
    return fin(q.ok(q.kind == "mc" ? D.a : +D.a));
  }
  if ("t" in D) {
    const i = +D.t;
    cur.sel.has(i) ? cur.sel.delete(i) : cur.sel.add(i);
    return render();
  }
  if ("check" in D) {
    if (q.kind == "tapAll") {
      const got = new Set(cur.sel);
      return fin(got.size === q.expected.length && q.expected.every(([st, f]) => got.has(st + "." + f)), [
        ...got,
      ]);
    }
    return fin(cur.sel.size == q.exp.size && [...cur.sel].every((x) => q.exp.has(x)));
  }
  if ("s" in D && q.kind == "tapAll") {
    const key = D.s + "." + D.f;
    cur.sel.has(key) ? cur.sel.delete(key) : cur.sel.add(key);
    return render();
  }
  if ("s" in D && q.kind == "tap") {
    const s = +D.s,
      f = +D.f;
    fin(q.ok(s, f), [s, f]);
  }
};
document.onkeydown = (e) => {
  if (e.key == "Enter") {
    const b = app.querySelector("[data-next],[data-got],[data-check]");
    b && b.click();
  }
};
next();
