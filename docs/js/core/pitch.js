/* Pitch maths for the microphone. Pure, so Node can test it. */

/* YIN pitch detection. Returns { f: Hz, clarity: 0..1 } or null. */
export function yinPitch(buf, sr) {
  const W = buf.length >> 1,
    tauMin = Math.max(2, Math.floor(sr / 1400)),
    tauMax = Math.min(W - 1, Math.floor(sr / 70)),
    d = new Float32Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau++) {
    let s = 0;
    for (let j = 0; j < W; j++) {
      const x = buf[j] - buf[j + tau];
      s += x * x;
    }
    d[tau] = s;
  }
  let run = 0;
  d[0] = 1;
  for (let tau = 1; tau <= tauMax; tau++) {
    run += d[tau];
    d[tau] = run ? (d[tau] * tau) / run : 1;
  }
  let tau = tauMin;
  for (; tau <= tauMax; tau++) {
    if (d[tau] < 0.15) {
      while (tau + 1 <= tauMax && d[tau + 1] < d[tau]) tau++;
      break;
    }
  }
  if (tau > tauMax) return null;
  const a = d[tau - 1],
    b = d[tau],
    c = d[Math.min(tau + 1, tauMax)],
    den = a + c - 2 * b,
    t = tau + (den ? (a - c) / (2 * den) : 0);
  return { f: sr / t, clarity: 1 - b };
}

/* Hz -> written-pitch MIDI number (+12 for guitar transposition) and how many cents off it is. */
export function freqToWritten(f) {
  const midi = 69 + 12 * Math.log2(f / 440),
    r = Math.round(midi);
  return { m: r + 12, cents: (midi - r) * 100 };
}

