/* Text tab -> notes. Pure. A tab is { id, title, open: [written pitch of each string, low to high], capo,
   ev: [{ n: [[string, fret], ...], b: bar }] }. Text tabs rarely say how long a note lasts, so none is kept. */
import { LET, LSEM, OPEN } from "../core/theory.js";

/* A tab line: mostly dashes, with only the marks tabs use. */
function isTabLine(l) {
  const dashes = (l.match(/-/g) || []).length;
  return dashes >= 3 && dashes / l.trim().length > 0.3 && /^[\s\w#♯♭|:\-~/\\()<>.*=^]+$/.test(l);
}

/* Where the strings start on a line: after the string name, if there is one. */
function lineStart(l) {
  const i = l.search(/[|:-]/);
  return i < 0 ? 0 : i;
}

/* Open-string pitches from the line labels. Top line first, unless the labels say low E is on top. */
function tuningOf(block) {
  const labels = block.map((l) => l.slice(0, lineStart(l)).trim().replace("♯", "#").replace("♭", "b")),
    known = labels.every((l) => /^[A-Ga-g][#b]?$/.test(l)),
    flipped = known && labels[1].toUpperCase() === "A" && labels[4].toUpperCase() === "B",
    open = OPEN.slice();
  if (known)
    labels.forEach((l, i) => {
      const s = flipped ? i : 5 - i,
        pc = (LSEM[LET.indexOf(l[0].toUpperCase())] + (l[1] === "#" ? 1 : l[1] === "b" ? 11 : 0)) % 12,
        up = (pc - OPEN[s] + 120) % 12;
      open[s] = OPEN[s] + (up > 6 ? up - 12 : up);
    });
  return { open, flipped };
}

/* Notes in a block of six lines, in playing order. A note can be two columns wide, so notes that overlap are one chord. */
function blockEvents(block, flipped, bar) {
  const hits = [],
    bars = new Set();
  block.forEach((line, i) => {
    const s = flipped ? i : 5 - i,
      // The number after a bend or release is a pitch to reach, not a note to pluck.
      body = line.slice(lineStart(line)).replace(/[br]\(?\d+\)?/gi, (x) => "-".repeat(x.length));
    for (const m of body.matchAll(/\d+/g)) if (+m[0] <= 36) hits.push({ col: m.index, end: m.index + m[0].length, s, f: +m[0] });
    for (const m of body.matchAll(/\|/g)) if (m.index) bars.add(m.index);
  });
  hits.sort((a, b) => a.col - b.col);
  const ev = [];
  let open = null;
  for (const h of hits) {
    if (open && h.col < open.end) {
      if (!open.n.some((x) => x[0] === h.s)) open.n.push([h.s, h.f]);
      open.end = Math.max(open.end, h.end);
    } else {
      open = { n: [[h.s, h.f]], b: bar + [...bars].filter((c) => c <= h.col).length, end: h.end };
      ev.push(open);
    }
  }
  return { ev: ev.map(({ n, b }) => ({ n, b })), bars: bars.size };
}

/* Text -> tab. Throws a message for the player if it doesn't find one. */
export function parseTextTab(text, name) {
  const lines = text.split(/\r?\n/),
    blocks = [];
  let run = [];
  for (const l of [...lines, ""]) {
    if (isTabLine(l)) run.push(l);
    else {
      if (run.length && run.length % 6 === 0) for (let i = 0; i < run.length; i += 6) blocks.push(run.slice(i, i + 6));
      run = [];
    }
  }
  if (!blocks.length) throw "Couldn’t find any guitar tab in that. It needs six lines of dashes and fret numbers.";
  const { open, flipped } = tuningOf(blocks[0]),
    capo = +(text.match(/capo\s*(?:on\s*)?(?:fret\s*)?(\d{1,2})/i) || [])[1] || 0,
    ev = [];
  let bar = 0;
  for (const b of blocks) {
    const r = blockEvents(b, flipped, bar);
    ev.push(...r.ev);
    bar += r.bars + 1;
  }
  if (!ev.length) throw "Found tab lines, but no notes on them.";
  const title = lines.map((l) => l.trim()).find((l) => l && !isTabLine(l) && l.length <= 60);
  return { id: "t" + Date.now(), title: title || name || "Pasted tab", open, capo, ev };
}

/* What a tab wants right now: any note of the chord, since the mic can only hear one pitch at a time. A sampled string
   is the truth whatever the tab says its tuning should be, so frets count up from that. */
export function tabTarget(tab, i, tuning) {
  const e = tab.ev[i],
    open = (s) => (tuning[s] === null ? tab.open[s] : OPEN[s]) + tab.capo;
  return e && { strings: e.n.map((x) => x[0]), mic: (x) => e.n.some(([s, f]) => (open(s) + f) % 12 === x % 12) };
}
