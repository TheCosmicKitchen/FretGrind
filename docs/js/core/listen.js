/* Listening: find the moment each note is played and which note it is. Pure DSP, so Node can test it.

   Feed it the microphone samples in order, each chunk with the frame number of its first sample (frame / sampleRate
   is the audio-clock time). It returns finished events: { t, strength, level, f, m, cents, clarity }
     t         seconds on the audio clock when the note started (before any latency correction)
     m         written-pitch MIDI number (guitar sounds an octave below the written pitch), or null if unclear
   Onsets come from a sudden rise in loudness; the pitch comes from YIN over the first ~120 ms after the onset. */
import { yinPitch, freqToWritten } from "./pitch.js";

const HOP = 128, // samples per step (about 3 ms)
  WIN = 4, // hops in the loudness window (about 12 ms: long enough for low guitar notes)
  KEEP = 96000, // samples of history kept for pitch (about 2 s)
  PITCH_FROM = 0.028, // seconds after the onset where the pitch window starts (skip the pluck noise)
  PITCH_LEN = 4096,
  PITCH_MIN = 1536; // shortest window worth trusting

/* sensitivity 1 (needs a clear loud pluck) .. 5 (picks up quiet notes) */

/* ---- spectrum helpers ---- */
function fft(re, im) {
  const n = re.length;
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) ([re[i], re[j]] = [re[j], re[i]], [im[i], im[j]] = [im[j], im[i]]);
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len, wr = Math.cos(ang), wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const a = i + k, b = a + len / 2,
          tr = re[b] * cr - im[b] * ci, ti = re[b] * ci + im[b] * cr;
        re[b] = re[a] - tr; im[b] = im[a] - ti; re[a] += tr; im[a] += ti;
        const nr = cr * wr - ci * wi; ci = cr * wi + ci * wr; cr = nr;
      }
    }
  }
}
const NFFT = 4096;
export function magnitude(buf) {
  const re = new Float64Array(NFFT), im = new Float64Array(NFFT), n = Math.min(buf.length, NFFT);
  for (let i = 0; i < n; i++) re[i] = buf[i] * (0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1)));
  fft(re, im);
  const mag = new Float64Array(NFFT / 2);
  for (let k = 0; k < mag.length; k++) mag[k] = Math.hypot(re[k], im[k]);
  return mag;
}
/* How much of the spectrum sits on the harmonics of f0 (first ten, 1.5% wide): 0..1 */
function harmonicScore(mag, bin, top, f0) {
  const last = mag.length - 2;
  let sc = 0;
  for (let j = 1; j <= 10 && f0 * j < 5200; j++) {
    const k0 = Math.max(1, Math.floor((f0 * j * 0.985) / bin)), k1 = Math.min(last, Math.ceil((f0 * j * 1.015) / bin));
    let v = 0;
    for (let k = k0; k <= k1; k++) if (mag[k] > v) v = mag[k];
    sc += Math.sqrt(v / top);
  }
  return sc / 10;
}
const topOf = (mag, bin) => {
  let top = 0;
  for (let k = Math.floor(60 / bin); k <= Math.min(mag.length - 2, Math.ceil(5200 / bin)); k++) top = Math.max(top, mag[k]);
  return top;
};
/* Fundamental from a magnitude spectrum by harmonic support: try every pitch from 70 Hz to 1.4 kHz (every 20 cents) and
   keep the one whose first ten harmonics carry the most energy. Works when the fundamental itself is weak.
   Returns { f, score, best } (score 0..1, best = the winning raw score), or null for silence. */
export function spectralPitch(mag, sr) {
  const bin = sr / NFFT,
    top = topOf(mag, bin);
  if (top <= 0) return null;
  let best = { sc: 0, f0: 0 };
  for (let f0 = 70; f0 <= 1400; f0 *= Math.pow(2, 20 / 1200)) {
    const sc = harmonicScore(mag, bin, top, f0);
    if (sc > best.sc * 1.01) best = { sc, f0 };
  }
  if (!best.f0) return null;
  // refine on the strongest harmonic's interpolated peak
  let hv = 0, hj = 1, hk = 0;
  for (let j = 1; j <= 10 && best.f0 * j < 5200; j++) {
    const k0 = Math.max(1, Math.floor((best.f0 * j * 0.985) / bin)), k1 = Math.min(mag.length - 2, Math.ceil((best.f0 * j * 1.015) / bin));
    for (let k = k0; k <= k1; k++) if (mag[k] > hv) ((hv = mag[k]), (hj = j), (hk = k));
  }
  const a = mag[hk - 1], b = mag[hk], c = mag[hk + 1], d = a - 2 * b + c,
    f = ((hk + (d ? (0.5 * (a - c)) / d : 0)) * bin) / hj;
  return { f: Math.abs(f / best.f0 - 1) < 0.03 ? f : best.f0, score: Math.min(1, best.sc * 2.2), best: best.sc };
}

/* Is the note with written-pitch MIDI number `written` in this event? Returns 0..1 relative to the best-supported pitch
   (1 = it is the strongest candidate). Uses the "what is new" spectrum kept on the event, so a string still ringing does not count. */
export function support(ev, written, sr) {
  if (!ev.spec || !ev.best) return 0;
  const bin = sr / NFFT,
    f = 440 * Math.pow(2, (written - 12 - 69) / 12);
  return Math.min(1, harmonicScore(ev.spec, bin, ev.top, f) / ev.best);
}
export const SENS = [null, { rise: 9, above: 14 }, { rise: 7.5, above: 11 }, { rise: 6, above: 9 }, { rise: 5, above: 7 }, { rise: 4, above: 5.5 }];

/* One loudness track: per-hop energy, a smoothed level in dB, a noise floor and "how far above the recent quiet" the level is. */
class Band {
  constructor() {
    this.e = [];
    this.hl = [];
    this.wl = [];
    this.floor = -70;
  }
  push(c) {
    let e = 0;
    for (let i = 0; i < HOP; i++) e += c[i] * c[i];
    this.e.push(e);
    this.hl.push(10 * Math.log10(e / HOP + 1e-10));
    if (this.e.length > 64) (this.e.shift(), this.hl.shift(), this.wl.shift());
    let w = 0;
    for (let k = Math.max(0, this.e.length - WIN); k < this.e.length; k++) w += this.e[k];
    const L = 10 * Math.log10(w / (WIN * HOP) + 1e-10);
    this.wl.push(L);
    this.floor = L < this.floor ? L : Math.min(L, this.floor + 0.012); // follows quiet moments down, creeps up slowly
    const n = this.wl.length;
    let m = Infinity;
    for (let k = Math.max(0, n - 14); k < n - 1; k++) m = Math.min(m, this.wl[k]); // the quietest recent moment
    this.L = L;
    this.m = m;
    this.rise = n < 14 ? 0 : L - m;
    return this;
  }
  /* index (from the newest hop, 0 = newest) where the rise really began: first hop in the last ~25 ms clearly above the quiet level */
  begin() {
    const n = this.hl.length;
    for (let k = Math.max(0, n - 9); k < n; k++) if (this.hl[k] - this.m > 3) return n - 1 - k;
    return 0;
  }
}

export class Listener {
  constructor({ sr = 44100, sensitivity = 3, refractory = 0.07 } = {}) {
    this.sr = sr;
    this.refractory = refractory;
    this.lpA = 1 - Math.exp((-2 * Math.PI * 1500) / sr);
    this.setSensitivity(sensitivity);
    this.reset();
  }
  setSensitivity(s) {
    this.sens = SENS[Math.max(1, Math.min(5, Math.round(s)))];
  }
  reset() {
    this.ring = new Float32Array(KEEP);
    this.end = 0; // frames written so far (absolute)
    this.carry = []; // samples of an unfinished hop
    this.carryHi = [];
    this.lo = new Band(); // whole sound (rumble removed)
    this.hi = new Band(); // only above ~1.5 kHz: the pluck's click, which stands out even over ringing strings
    this.lastOnset = -1e9;
    this.hp = { x: 0, y: 0 };
    this.lp = 0;
    this.pending = [];
    this.level = -90;
    this.expect = null;
    this.hops = 0;
  }
  get floor() {
    return this.lo.floor;
  }

  /* Add samples (a Float32Array) whose first sample is frame number `frame`. Returns the events that are complete. */
  feed(samples, frame) {
    const out = [];
    if (this.expect !== null && frame !== this.expect) this.reset(); // a gap in the stream: start clean
    this.expect = frame + samples.length;
    if (this.end === 0 && this.carry.length === 0) this.base = frame;
    for (let i = 0; i < samples.length; i++) {
      this.ring[(frame + i) % KEEP] = samples[i];
      // remove rumble and hum below ~90 Hz so a bumped mic or a fan does not trigger notes
      const x = samples[i],
        y = 0.9876 * (this.hp.y + x - this.hp.x);
      this.hp.x = x;
      this.hp.y = y;
      this.lp += this.lpA * (x - this.lp);
      this.carry.push(y);
      this.carryHi.push(x - this.lp);
      if (this.carry.length === HOP) {
        this.hop(frame + i + 1 - HOP, out);
        this.carry = [];
        this.carryHi = [];
      }
    }
    this.end = frame + samples.length;
    this.ripen(out, false);
    return out;
  }

  hop(start, out) {
    const lo = this.lo.push(this.carry),
      hi = this.hi.push(this.carryHi);
    this.level = lo.L;
    this.hops++;
    if (this.hops < 70) return; // the first ~0.2 s only learns the room's noise level
    const t = (start + HOP) / this.sr,
      S = this.sens;
    const byLo = lo.rise >= S.rise && lo.L >= lo.floor + S.above && lo.L > -62,
      byHi = hi.rise >= S.rise + 2 && hi.L >= hi.floor + S.above && hi.L > -70 && lo.L > -62;
    if (!(byLo || byHi) || t - this.lastOnset < this.refractory) return;
    const band = byLo ? lo : hi,
      back = band.begin(),
      onsetFrame = start - back * HOP;
    this.lastOnset = t;
    // a new note ends the pitch window of the previous one
    this.ripen(out, true, onsetFrame);
    this.pending.push({ frame: onsetFrame, strength: band.rise, level: lo.L });
  }

  /* Finish pitch for pending onsets whose window is complete (or cut short by the next onset at `cut`). */
  ripen(out, force, cut = Infinity) {
    const keep = [];
    for (const p of this.pending) {
      const from = p.frame + Math.round(PITCH_FROM * this.sr),
        full = from + PITCH_LEN,
        stop = Math.min(full, cut - Math.round(0.006 * this.sr));
      if (this.end >= full || (force && cut !== Infinity)) {
        const len = Math.min(PITCH_LEN, Math.min(this.end, stop) - from);
        out.push(this.finish(p, from, len));
      } else keep.push(p);
    }
    this.pending = keep;
  }

  grab(from, len) {
    const buf = new Float32Array(len);
    for (let i = 0; i < len; i++) buf[i] = this.ring[(from + i + KEEP * 4) % KEEP];
    return buf;
  }

  finish(p, from, len) {
    const ev = { t: p.frame / this.sr, frame: p.frame, strength: p.strength, level: p.level, f: null, m: null, cents: 0, clarity: 0, spec: null, best: 0, top: 0 };
    if (len < PITCH_MIN || from + len > this.end || from < this.end - KEEP + 1) return ev;
    const after = this.grab(from, len & ~1),
      bFrom = p.frame - Math.round(0.006 * this.sr) - after.length,
      haveBefore = bFrom > this.end - KEEP + 1 && bFrom >= (this.base || 0),
      rms = (b) => Math.sqrt(b.reduce((a, x) => a + x * x, 0) / b.length + 1e-12),
      before = haveBefore ? this.grab(bFrom, after.length) : null,
      tail = before ? rms(before) / rms(after) : 0;
    const clean = () => {
      const r = yinPitch(after, this.sr);
      return r && r.clarity >= 0.8 ? { f: r.f, clarity: r.clarity } : null;
    };
    const diff = () => {
      const A = magnitude(after), B = magnitude(before), D = new Float64Array(A.length);
      let ea = 0, ed = 0;
      for (let k = 0; k < A.length; k++) {
        D[k] = Math.max(0, A[k] - 0.6 * B[k]);
        ea += A[k] * A[k];
        ed += D[k] * D[k];
      }
      const use = ed > 0.15 * ea ? D : A; // same note again: little new energy, use the whole spectrum
      const r = spectralPitch(use, this.sr);
      if (r) ((ev.spec = Float32Array.from(use)), (ev.best = r.best), (ev.top = topOf(use, this.sr / NFFT)));
      return r && r.score >= 0.35 ? { f: r.f, clarity: r.score } : null;
    };
    // On a clean start trust YIN. Over a ringing string compare with the "what is new" spectrum: when they name the same note, use YIN's exact value
    if (!before) {
      const A = magnitude(after), r0 = spectralPitch(A, this.sr);
      if (r0) ((ev.spec = Float32Array.from(A)), (ev.best = r0.best), (ev.top = topOf(A, this.sr / NFFT)));
    }
    const y = clean(),
      d = before ? diff() : null,
      pc = (o) => ((freqToWritten(o.f).m % 12) + 12) % 12;
    let r = null;
    if (y && d) r = pc(y) === pc(d) ? y : tail < 0.04 ? y : d;
    else r = y || d;
    if (r) Object.assign(ev, { f: r.f, clarity: r.clarity }, freqToWritten(r.f));
    return ev;
  }

  /* Give back events still waiting for their pitch window (call when listening stops). */
  flush() {
    const out = [];
    this.ripen(out, true, this.end);
    return out;
  }
}
