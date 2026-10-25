/* Play a song against a click, scheduled ahead on the audio clock (like the practice metronome).
   The page highlight is driven by the same clock, so what you see matches what you hear. */
import { audioReady, click, ctx, tone } from "../core/audio.js";

let run = null; // null = stopped, { starting: true } = waiting for audio, otherwise running
export const songBusy = () => !!run;
export const songRunning = () => !!run && !run.starting;
/* Where the song sits on the audio clock: note i is due at start[i]. Only while a pass is running. */
export function songClock(song) {
  if (!run || run.starting) return null;
  return { c0: run.c0, usec: run.usec, due: song.sounding.map((n) => run.c0 + (n.start + run.pass * song.total) * run.usec), first: run.c0 };
}

/* The events of one pass through the song, in sixteenth-note units: notes and beat clicks. */
export function timeline(song) {
  const g0 = song.pickup || 0,
    ev = [];
  song.sounding.forEach((n, i) => ev.push({ u: n.start, note: i }));
  for (let u = g0 - Math.ceil(g0 / song.beat) * song.beat; u < song.total; u += song.beat) {
    if (u < 0) continue;
    const rel = u - g0,
      beatInBar = ((rel % song.bar) + song.bar) % song.bar / song.beat;
    ev.push({ u, beat: Math.round(beatInBar) });
  }
  return ev.sort((a, b) => a.u - b.u || (a.beat === undefined) - (b.beat === undefined));
}
/* The clicks of the count-in bar: they end on the beat just before the first note. */
export function countIn(song) {
  const g0 = song.pickup || 0,
    out = [];
  for (let u = g0 - song.bar; u < 0; u += song.beat) out.push({ u, beat: Math.round((u - (g0 - song.bar)) / song.beat) });
  return out;
}

/* opts: {pct, click, clickIn (count-in clicks even when click is off), notes, countIn, loop}; hooks: {note(i), beat(b), end()} */
export function songStart(song, opts, hooks) {
  if (run) return;
  run = { starting: true };
  audioReady()
    .then(() => {
      if (!run) return;
      const usec = 60 / (song.tempo * (opts.pct / 100) * song.beat),
        pre = opts.countIn ? countIn(song) : [],
        cyc = timeline(song),
        first = ctx.currentTime + 0.12 - (pre.length ? pre[0].u * usec : 0);
      run = { c0: first, pass: 0, i: -pre.length, q: [], usec, pre, cyc, endAt: 0, hooks };
      const total = song.total;
      const sched = () => {
        while (run && !run.endAt) {
          const ev = run.i < 0 ? run.pre[run.pre.length + run.i] : run.cyc[run.i],
            u = ev.u + (run.i < 0 ? 0 : run.pass * total),
            t = run.c0 + u * run.usec;
          if (t > ctx.currentTime + 0.16) break;
          if (ev.note !== undefined) {
            const n = song.sounding[ev.note];
            if (opts.notes) tone(n.midi - 12, t, Math.min(1.8, Math.max(0.35, n.dur * run.usec * 1.3)), 0.3, "triangle", true);
            run.q.push({ t, note: ev.note });
          } else {
            if (opts.click || (run.i < 0 && opts.clickIn)) click(t, ev.beat === 0);
            run.q.push({ t, beat: ev.beat });
          }
          run.i++;
          if (run.i >= run.cyc.length) {
            if (opts.loop) (run.pass++, (run.i = 0));
            else run.endAt = run.c0 + total * run.usec + 0.45;
          }
        }
      };
      run.timer = setInterval(sched, 25);
      const frame = () => {
        if (!run) return;
        while (run.q.length && run.q[0].t <= ctx.currentTime) {
          const e = run.q.shift();
          e.note !== undefined ? hooks.note(e.note) : hooks.beat(e.beat);
        }
        if (run.endAt && ctx.currentTime >= run.endAt) return hooks.end();
        run.raf = requestAnimationFrame(frame);
      };
      sched();
      run.raf = requestAnimationFrame(frame);
      hooks.started && hooks.started();
    })
    .catch(() => {
      run = null;
      hooks.end && hooks.end();
    });
}

export function songStop() {
  if (!run) return;
  clearInterval(run.timer);
  cancelAnimationFrame(run.raf);
  run = null;
}
