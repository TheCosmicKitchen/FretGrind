/* Builds the question for a card key ("deck:id"): prompt, picture, how to check the answer, what to play. */
import { ui } from "../core/store.js";
import { NAMES, OPEN, RT, SN, SH, CQ, SQ, STAFF_NOTE, pt, posAll, rng, shuf, spell } from "../core/theory.js";
import { CLASSICS, DN, TAP_SEGMENTS, activeRegions, fretOk, regionSpan } from "../core/decks.js";
import { AC, BAD, OK, board, dots, staff } from "../view/notation.js";
import { specOfKey } from "../courses/curriculum.js";
import { figure } from "../courses/figures.js";
import { build } from "../songs/format.js";
import { noteHint, noteTip } from "../core/readtips.js";
import { songSvg } from "../songs/draw.js";

// A bar of music drawn on the staff, for the reading cards.
const bar = (key, bars) => `<div class="cd-staff">${songSvg(build({ id: "card", title: "A card", key, time: "4/4", tempo: 60, bars }), null, { width: 260, view: "staff" })}</div>`;
const MAJOR_OF = ["Gb", "Db", "Ab", "Eb", "Bb", "F", "C", "G", "D", "A", "E", "B", "F#"],
  MINOR_OF = ["Eb", "Bb", "F", "C", "G", "D", "A", "E", "B", "F#", "C#", "G#", "D#"],
  keyName = (t) => t.replace("#", "♯").replace("b", "♭"),
  GENERIC = ["", "", "2nd", "3rd", "4th", "5th", "6th", "7th", "Octave"],
  LETTERS = ["C", "D", "E", "F", "G", "A", "B"],
  natural = (p) => `${LETTERS[p % 7]}${Math.floor(p / 7)}`;
// four answers: the right one and three near it
const near = (all, i) => shuf([all[i], ...shuf(all.filter((_, j) => j !== i && Math.abs(j - i) <= 3)).slice(0, 3)]);

// The chunk of the neck that holds fret f (see TAP_SEGMENTS): zoomed views show only this part.
const segOf = (f) => {
  const g = TAP_SEGMENTS.find((x) => f >= x.min && f <= x.max) || TAP_SEGMENTS[TAP_SEGMENTS.length - 1];
  return [g.min, g.max];
};
// Board view for the regions being practised: zoom to their span when it is narrow enough to read,
// otherwise show the whole neck. Frets outside the regions are dimmed and can't be tapped.
function regionView() {
  const sp = regionSpan();
  return { allow: fretOk, range: sp && sp[1] - sp[0] + 1 <= 12 ? sp : undefined };
}

export function Q(k) {
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
      p: "Tap every " + NAMES[pc] + " in " + seg.name,
      kind: "tapAll",
      expected,
      vis: (r) => {
        const chosen = [...(ui.cur?.sel || [])].map((v) => v.split(".").map(Number)),
          marks = r
            ? [
                ...expected.map(([st, f]) => [st, f, OK]),
                ...chosen.filter(([st, f]) => !ids.has(st + "." + f)).map(([st, f]) => [st, f, BAD]),
              ]
            : chosen.map(([st, f]) => [st, f, AC]);
        return board({ nF: 24, full: true, tap: !r, w: 960, range: [seg.min, seg.max], dots: marks });
      },
      rev: expected.map(pt).join(" · "),
      snd: expected.map(([st, f]) => OPEN[st] + f),
    };
  } else if (d == "lq") {
    // a question written in a lesson, kept in "My deck"
    const sp = specOfKey(k);
    if (!sp) throw new Error("unknown lesson question " + k);
    const hr = sp.hear;
    q = {
      p: sp.p,
      kind: "mc",
      ch: shuf(sp.a.slice()),
      vis: () => (sp.fig ? figure(sp.fig) : "") + (hr ? '<div class="ln-hear"><button data-play>▶ Listen</button></div>' : ""),
      ok: (a) => a === sp.a[sp.c],
      rev: sp.why ? `${sp.a[sp.c]} — ${sp.why}` : sp.a[sp.c],
      ...(hr ? (hr.snd ? { snd: hr.snd, gap: hr.gap } : { seq: hr.seq, onsets: hr.onsets, tempo: hr.tempo }) : {}),
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
  } else if (d == "keySig") {
    const [n, mode] = id.split("."),
      i = +n + 6,
      names = (mode == "M" ? MAJOR_OF : MINOR_OF).map((t) => `${keyName(t)} ${mode == "M" ? "major" : "minor"}`),
      count = Math.abs(+n);
    q = {
      p: `Which ${mode == "M" ? "major" : "minor"} key has this key signature?`,
      kind: "mc",
      ch: near(names, i),
      vis: () => bar(MAJOR_OF[i], "r:16"),
      ok: (a) => a === names[i],
      rev: `${names[i]}: ${count ? `${count} ${+n > 0 ? "sharp" : "flat"}${count > 1 ? "s" : ""}` : "no sharps or flats"}`,
    };
  } else if (d == "staffInt") {
    const [p, g, dir] = id.split("."),
      lo = natural(+p),
      hi = natural(+p + +g - 1),
      [a, b] = dir == "u" ? [lo, hi] : [hi, lo],
      ans = GENERIC.slice(2);
    q = {
      p: "How far apart are these two notes?",
      kind: "mc",
      ch: near(ans, +g - 2),
      vis: () => bar("C", `${a}:8 ${b}:8`),
      ok: (x) => x === GENERIC[+g],
      rev: `${GENERIC[+g] === "Octave" ? "An octave" : `A ${GENERIC[+g]}`}, ${dir == "u" ? "up" : "down"}: ${a.slice(0, -1)} to ${b.slice(0, -1)}. Count the lines and spaces, both notes included.`,
      snd: build({ id: "i", key: "C", time: "4/4", tempo: 60, bars: `${a}:8 ${b}:8` }).sounding.map((x) => x.midi),
      gap: 0.5,
    };
  } else if (d == "staff" || d == "staffFret") {
    const m = +id,
      g = posAll(m).filter(([, f]) => fretOk(f)),
      nm = STAFF_NOTE[m % 12][0];
    // how to read it: a hint before answering, the reasoning after
    const read = { hint: noteHint(m), tip: noteTip(m) };
    q =
      d == "staff"
        ? {
            p: "Which note is this?",
            kind: "pc12",
            labels: STAFF_NOTE.map((x) => x[0]),
            vis: () => staff(m),
            ok: (a) => a === m % 12,
            mic: (x) => x % 12 === m % 12,
            rev: nm, // the tip says where it is on the guitar
            snd: [m],
            ...read,
          }
        : {
            p: activeRegions().length ? "Tap one matching position in the lit part of the fretboard" : "Tap one matching position anywhere on the fretboard",
            kind: "tap",
            vis: (r, t) => staff(m) + board({ nF: 24, full: true, tap: !r, w: 960, dots: dots(r, g, t), ...regionView() }),
            ok: (s, f) => OPEN[s] + f === m && fretOk(f),
            mic: (x) => (m >= OPEN[0] && m <= OPEN[5] + 24 ? x === m : x % 12 === m % 12),
            rev: `${nm}: ${g.map(pt).join(" / ")}`,
            snd: [m],
            ...read,
          };
  } else if (d == "fretNote") {
    const [s, f] = id.split(".").map(Number),
      p = (OPEN[s] + f) % 12;
    q = {
      p: "Which note is this?",
      kind: "pc12",
      vis: () => board({ nF: 24, full: true, w: 960, dots: [[s, f, AC]], range: segOf(f) }),
      ok: (a) => a === p,
      mic: (x) => x % 12 === p,
      rev: NAMES[p],
      snd: [OPEN[s] + f],
    };
  } else if (d == "findFret") {
    const [p, s] = id.split(".").map(Number),
      g = rng(0, 24)
        .filter((f) => (OPEN[s] + f) % 12 === p && fretOk(f))
        .map((f) => [s, f]);
    q = {
      p: `Find <b>${NAMES[p]}</b> on the ${SN[s]} string`,
      kind: "tap",
      vis: (r, t) => board({ nF: 24, full: true, tap: !r, w: 960, dots: dots(r, g, t), ...regionView() }),
      ok: (s2, f) => s2 === s && (OPEN[s] + f) % 12 === p && fretOk(f),
      mic: (x) => x % 12 === p,
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
