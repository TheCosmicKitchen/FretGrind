/* Synthetic guitar for tests: Karplus-Strong plucked strings mixed into a buffer, plus noise. */
export function pluck(freq, sr, secs, { decay = 0.996, amp = 0.5, seed = 1 } = {}) {
  const n = Math.round(sr * secs),
    d = Math.round(sr / freq),
    line = new Float32Array(d),
    out = new Float32Array(n);
  let s = seed;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  for (let i = 0; i < d; i++) line[i] = rnd();
  let p = 0;
  for (let i = 0; i < n; i++) {
    const a = line[p],
      b = line[(p + 1) % d];
    out[i] = a * amp;
    line[p] = decay * 0.5 * (a + b);
    p = (p + 1) % d;
  }
  return out;
}
export const hz = (midiSounding) => 440 * Math.pow(2, (midiSounding - 69) / 12);
export function mix(sr, secs, notes, { noise = 0.002, seed = 7, hum = 0 } = {}) {
  const buf = new Float32Array(Math.round(sr * secs));
  let s = seed;
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;
  for (let i = 0; i < buf.length; i++) buf[i] = noise * rnd() + hum * Math.sin((2 * Math.PI * 50 * i) / sr);
  notes.forEach(({ t, m, amp = 0.5, dur = 1.2 }, k) => {
    const x = pluck(hz(m), sr, dur, { amp, seed: k + 3 }),
      o = Math.round(t * sr);
    for (let i = 0; i < x.length && o + i < buf.length; i++) buf[o + i] += x[i];
  });
  return buf;
}
/* feed a buffer to a listener in chunks (like an audio worklet would) */
export function run(listener, buf, chunk = 128) {
  const ev = [];
  for (let i = 0; i < buf.length; i += chunk) ev.push(...listener.feed(buf.subarray(i, Math.min(buf.length, i + chunk)), i));
  ev.push(...listener.flush());
  return ev;
}
/* A hand clap / desk tap: a short burst of noise that dies away fast. Adds into buf at time t. */
export function clap(buf, sr, t, { amp = 0.6, ms = 35, seed = 11 } = {}) {
  let s = seed + Math.round(t * 1000);
  const rnd = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1,
    n = Math.round((ms / 1000) * sr * 3),
    o = Math.round(t * sr);
  for (let i = 0; i < n && o + i < buf.length; i++) buf[o + i] += amp * rnd() * Math.exp((-i / sr) / (ms / 1000 / 3));
  return buf;
}
