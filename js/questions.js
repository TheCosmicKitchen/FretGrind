function Q(k) {
  const i = k.indexOf(":"),
    d = k.slice(0, i),
    id = k.slice(i + 1);
  let q;
  if (d == "tapAll") {
    const [pc, si] = id.split(".").map(Number),
      seg = TAP_SEGMENTS[si],
      expected = [];
    for (let st = 0; st < 6; st++)
      for (let f = seg.min; f <= seg.max; f++) if ((OPEN[st] + f) % 12 === pc) expected.push([st, f]);
    const ids = new Set(expected.map(([st, f]) => st + "." + f));
    q = {
      p: "Tap every " + NAMES[pc] + " in the " + seg.name + " segment",
      kind: "tapAll",
      expected,
      vis: (r) => {
        const chosen = [...(cur?.sel || [])].map((v) => v.split(".").map(Number)),
          marks = r
            ? [
                ...expected.map(([st, f]) => [st, f, OK]),
                ...chosen.filter(([st, f]) => !ids.has(st + "." + f)).map(([st, f]) => [st, f, BAD]),
              ]
            : chosen.map(([st, f]) => [st, f, AC]);
        return board({ nF: 24, full: true, tap: !r, w: 960, segment: seg, dots: marks });
      },
      rev: expected.map(pt).join(" · "),
      snd: expected.map(([st, f]) => OPEN[st] + f),
    };
  } else if (d == "interval") {
    const c = CLASSICS[+id],
      opts = ["Minor 2nd up", "Major 3rd down", "Perfect 5th up", "Major 2nd up"];
    q = {
      p: "Name the first clear interval in this excerpt",
      kind: "mc",
      ch: shuf(opts),
      vis: () =>
        `<div class="snippet"><b>${c.title}</b><button data-play>▶ Play excerpt</button><small>Listen for the first change in pitch.</small></div>`,
      ok: (a) => a === c.interval,
      rev: c.interval,
      seq: c.notes,
      onsets: c.beats,
      tempo: 104,
    };
  } else if (d == "staff" || d == "staffFret") {
    const m = +id,
      g = posAll(m),
      nm = STAFF_NOTE[m % 12][0];
    q =
      d == "staff"
        ? {
            p: "Which note is this?",
            kind: "pc12",
            labels: STAFF_NOTE.map((x) => x[0]),
            vis: () => staff(m),
            ok: (a) => a === m % 12,
            rev: `${nm} — e.g. ${pt(g[0])}`,
            snd: [m],
          }
        : {
            p: "Tap one matching position anywhere on the fretboard",
            kind: "tap",
            vis: (r, t) => staff(m) + board({ nF: 24, full: true, tap: !r, w: 960, dots: dots(r, g, t) }),
            ok: (s, f) => OPEN[s] + f === m,
            rev: `${nm}: ${g.map(pt).join(" / ")}`,
            snd: [m],
          };
  } else if (d == "fretNote") {
    const [s, f] = id.split(".").map(Number),
      p = (OPEN[s] + f) % 12;
    q = {
      p: "Which note is this?",
      kind: "pc12",
      vis: () => board({ nF: 24, full: true, w: 960, dots: [[s, f, AC]] }),
      ok: (a) => a === p,
      rev: NAMES[p],
      snd: [OPEN[s] + f],
    };
  } else if (d == "findFret") {
    const [p, s] = id.split(".").map(Number),
      g = rng(0, 24)
        .filter((f) => (OPEN[s] + f) % 12 === p)
        .map((f) => [s, f]);
    q = {
      p: `Find <b>${NAMES[p]}</b> on the ${SN[s]} string`,
      kind: "tap",
      vis: (r, t) => board({ nF: 24, full: true, tap: !r, w: 960, dots: dots(r, g, t) }),
      ok: (s2, f) => s2 === s && (OPEN[s] + f) % 12 === p,
      rev: g.map((x) => (x[1] ? "fret " + x[1] : "open")).join(" / "),
      snd: [OPEN[s] + g[0][1]],
    };
  } else if (d == "chord") {
    const sh = SH[id],
      dt = [],
      mk = [];
    sh.forEach((f, s) => (f > 0 ? dt.push([s, f, AC]) : mk.push([s, f])));
    q = {
      p: "Which chord is this?",
      kind: "mc",
      ch: shuf([id, ...shuf(Object.keys(SH).filter((x) => x !== id)).slice(0, 3)]),
      vis: () => board({ nF: 5, w: 210, dots: dt, mk }),
      ok: (a) => a === id,
      rev: "It’s " + id,
      snd: sh.map((f, s) => (f >= 0 ? OPEN[s] + f : null)).filter((x) => x !== null),
      gap: 0.06,
    };
  } else {
    const [r, qi] = id.split(".").map(Number),
      R = RT[r],
      c = d == "spellChord" ? CQ[qi] : SQ[qi],
      sp = d == "spellChord" ? spell(R, c[2], c[3]) : spell(R, c[1], c[2]);
    q = {
      p: d == "spellChord" ? `Spell <b>${R.n}${c[0] || " major"}</b>` : `Notes of <b>${R.n} ${c[0]}</b>`,
      kind: "multi",
      exp: new Set(sp.map((x) => x.pc)),
      vis: () => "",
      rev: sp.map((x) => x.t).join(" – "),
      snd: (d == "spellChord" ? c[3] : c[2]).map((x) => 60 + R.pc + x),
      gap: d == "spellChord" ? 0.06 : 0.28,
    };
  }
  q.n = DN[d];
  return q;
}
const GR = {
  Reading: ["staff"],
  Fretboard: ["staffFret", "fretNote", "findFret"],
  "Tap all": ["tapAll"],
  Chords: ["chord", "spellChord"],
  Scales: ["spellScale"],
  Listening: ["interval"],
};
