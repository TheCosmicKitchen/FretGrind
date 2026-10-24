/* Web Audio: a shared AudioContext, one-note synth, and the card/prompt player. */
import { S } from "./store.js";
import { emit } from "./bus.js";

export let ctx; // the AudioContext, created on first use (live binding: importers always see the current value)

export function audioReady() {
  const C = window.AudioContext || window.webkitAudioContext;
  if (!C) return Promise.reject(new Error("Web Audio unavailable"));
  ctx = ctx || new C();
  return (ctx.state === "suspended" ? ctx.resume() : Promise.resolve()).then(() => ctx);
}

/* One note at MIDI number m, starting at audio time st for d seconds. */
export function tone(m, st, d, v = 0.2, type = "triangle", pluck = false) {
  const o = ctx.createOscillator(),
    g = ctx.createGain();
  o.type = type;
  o.frequency.value = 440 * Math.pow(2, (m - 69) / 12);
  g.gain.setValueAtTime(0.0001, st);
  if (pluck) {
    // quick attack, then an exponential fade: a short plucked burst
    g.gain.linearRampToValueAtTime(v, st + 0.006);
    g.gain.exponentialRampToValueAtTime(0.001, st + d);
  } else {
    g.gain.linearRampToValueAtTime(v, st + 0.018);
    g.gain.setValueAtTime(v, Math.max(st + 0.019, st + d - 0.06));
    g.gain.exponentialRampToValueAtTime(0.001, st + d);
  }
  o.connect(g);
  g.connect(ctx.destination);
  o.start(st);
  o.stop(st + d + 0.02);
}

/* A short metronome tick (accent = higher pitch). */
export function click(t, accent) {
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

/* Play a card/prompt: q.snd = MIDI notes (chord when q.gap is small), or q.seq/q.onsets = a tune in beats. */
export function play(q, when) {
  if (S.mute || (!q.snd && !q.seq)) return;
  audioReady()
    .then(() => {
      const t = when ?? ctx.currentTime + 0.08;
      if (q.seq) {
        const beat = 60 / (q.tempo || 100);
        q.seq.forEach((m, i) => tone(m, t + q.onsets[i] * beat, 0.32 * beat, 0.2));
        return;
      }
      const v = 0.3 / Math.sqrt(q.snd.length);
      // single notes ring briefly; strummed chords a little longer; spelled-out scales are quick staccato plucks
      const dur = q.snd.length === 1 ? 0.45 : (q.gap || 0) >= 0.2 ? 0.35 : 0.7;
      q.snd.forEach((m, i) => tone(m, t + i * (q.gap || 0), dur, v * 1.6, "triangle", true));
    })
    .catch(() => emit("audio-error", "Audio could not start. Check browser sound settings."));
}
