/* Marks what the microphone heard against what the song asks for. Pure: no browser, so it can be tested with synthetic audio.
   expected = [{ t, m }] (seconds on the audio clock, written MIDI note); heard = events from core/listen.js (t already has the device delay taken off). */
import { support } from "../core/listen.js";

export const TIGHT = 0.07, // seconds: within this is "on time"
  PITCH_OK = 0.6; // how much of the strongest sound must sit on the wanted note's overtones

/* Is this sound the wanted note? An octave off still counts (the pitch is right, so only the octave is flagged). */
export function pitchOk(ev, written, sr) {
  const s = support(ev, written, sr),
    // the detector's own pitch estimate: a different note name (an octave error does not change the name) vetoes a borderline match
    other = ev.m !== null && ev.m !== undefined && ev.m % 12 !== written % 12;
  if (s >= (other ? 0.85 : PITCH_OK)) return { ok: true, octave: false, s };
  if (!other)
    for (const d of [12, -12]) {
      const o = support(ev, written + d, sr);
      if (o >= PITCH_OK + 0.1) return { ok: true, octave: true, s: o };
    }
  return { ok: false, octave: false, s };
}

/* How far from its note a sound may land and still be that note's: nearer than half the way to a neighbour. */
function windowOf(expected, i) {
  let gap = Infinity;
  if (i > 0) gap = Math.min(gap, expected[i].t - expected[i - 1].t);
  if (i < expected.length - 1) gap = Math.min(gap, expected[i + 1].t - expected[i].t);
  return Math.min(0.24, Math.max(0.08, gap * 0.48));
}

export function gradeRun(expected, heard, { sr = 44100 } = {}) {
  const pairs = [];
  expected.forEach((x, i) => {
    const w = windowOf(expected, i);
    heard.forEach((h, j) => {
      const dt = h.t - x.t;
      if (Math.abs(dt) <= w) pairs.push({ i, j, dt, p: pitchOk(h, x.m, sr) });
    });
  });
  pairs.sort((a, b) => (b.p.ok - a.p.ok) || Math.abs(a.dt) - Math.abs(b.dt));
  const note = expected.map(() => null),
    used = new Set();
  for (const p of pairs) {
    if (note[p.i] || used.has(p.j)) continue;
    note[p.i] = p;
    used.add(p.j);
  }
  const notes = expected.map((x, i) => {
    const p = note[i];
    if (!p) return { state: "miss", dt: null };
    if (!p.p.ok) return { state: "wrong", dt: p.dt, heard: heard[p.j].m };
    return { state: Math.abs(p.dt) <= TIGHT ? "ok" : p.dt < 0 ? "early" : "late", dt: p.dt, octave: p.p.octave };
  });
  const first = expected.length ? expected[0].t - 0.3 : 0,
    last = expected.length ? expected[expected.length - 1].t + 0.45 : 0,
    extras = heard.map((_, j) => j).filter((j) => !used.has(j) && heard[j].t >= first && heard[j].t <= last);
  return { notes, extras, ...summary(notes, extras) };
}

export function summary(notes, extras) {
  const c = { ok: 0, early: 0, late: 0, wrong: 0, miss: 0 };
  notes.forEach((n) => c[n.state]++);
  const timed = notes.filter((n) => n.dt !== null && n.state !== "wrong").map((n) => n.dt),
    n = notes.length || 1,
    pts = c.ok + 0.6 * (c.early + c.late) + 0.2 * c.wrong;
  return {
    counts: c,
    accuracy: Math.max(0, (pts - 0.25 * extras.length) / n),
    bias: timed.length ? (timed.reduce((a, b) => a + b, 0) / timed.length) * 1000 : 0, // ms; + = late
  };
}

/* "Wait for me": does this sound move the song on? "hit" = the wanted note, "wrong" = a different note was played, "ignore" = not a note. */
export function waitStep(ev, written, sr) {
  if (pitchOk(ev, written, sr).ok) return "hit";
  return ev.m === null || ev.m === undefined ? "ignore" : "wrong";
}
