/* Microphone listening for the rhythm game and the songs.
   Captures the mic on the audio clock (an AudioWorklet, with a fallback), runs the Listener on it, and tells subscribers
   about every note it hears: { t, raw, m, cents, ... } where t is the time the note was played on the audio clock after
   taking off the device's delay (see latencyMs). */
import { S, save } from "./store.js";
import { audioReady, ctx, tone } from "./audio.js";
import { Listener } from "./listen.js";
import { emit } from "./bus.js";
import { mic, micStop } from "./mic.js";

export const listen = { on: false, starting: false, err: "" };
let stream, src, node, sink, listener, subs = [], recent = [], inLat = 0, fallbackFrame = 0;

export function sanitizeListen() {
  const l = S.listen && typeof S.listen === "object" ? S.listen : {};
  S.listen = {
    sens: Number.isFinite(l.sens) ? Math.max(1, Math.min(5, Math.round(l.sens))) : 3,
    latency: Number.isFinite(l.latency) ? Math.max(0, Math.min(600, Math.round(l.latency))) : null, // measured or set by hand, ms
    phones: l.phones === true, // headphones on: the click can keep sounding while you play
  };
}

/* Total delay between a sound being due and the microphone reporting it: speaker + air + microphone, in ms. */
export function latencyMs() {
  if (S.listen.latency !== null) return S.listen.latency;
  const out = (ctx && (ctx.outputLatency || ctx.baseLatency)) || 0.03,
    base = (ctx && ctx.baseLatency) || 0.01;
  return Math.round((out + base + inLat + 0.01) * 1000);
}
export const listenLevel = () => (listener ? { db: listener.level, floor: listener.floor } : { db: -90, floor: -90 });
export const heard = () => recent;
export function onNote(fn) {
  subs.push(fn);
  return () => (subs = subs.filter((f) => f !== fn));
}

function deliver(chunk, frame) {
  if (!listener) return;
  for (const e of listener.feed(chunk, frame)) {
    e.raw = e.t;
    e.t = e.raw - latencyMs() / 1000;
    recent.push(e);
    if (recent.length > 300) recent.shift();
    subs.slice().forEach((f) => f(e));
  }
}

export async function listenStart() {
  if (listen.on || listen.starting) return listen.on;
  listen.err = "";
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    listen.err = "Microphone access needs a secure (https) page and a browser that supports it.";
    return false;
  }
  listen.starting = true;
  try {
    if (mic.on) micStop(); // only one thing listens at a time
    await audioReady();
    stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const track = stream.getAudioTracks()[0],
      st = (track && track.getSettings && track.getSettings()) || {};
    inLat = Number.isFinite(st.latency) ? st.latency : 0.01;
    src = ctx.createMediaStreamSource(stream);
    listener = new Listener({ sr: ctx.sampleRate, sensitivity: S.listen.sens });
    recent = [];
    sink = ctx.createGain(); // keeps the capture node running; silent, so the mic never reaches the speakers
    sink.gain.value = 0;
    sink.connect(ctx.destination);
    if (ctx.audioWorklet && typeof AudioWorkletNode !== "undefined") {
      await ctx.audioWorklet.addModule(new URL("./listen-worklet.js", import.meta.url));
      node = new AudioWorkletNode(ctx, "fg-capture", { numberOfInputs: 1, numberOfOutputs: 1, channelCount: 1 });
      node.port.onmessage = (m) => deliver(m.data.data, m.data.frame);
    } else {
      node = ctx.createScriptProcessor(2048, 1, 1);
      fallbackFrame = Math.round(ctx.currentTime * ctx.sampleRate);
      node.onaudioprocess = (e) => {
        const d = Float32Array.from(e.inputBuffer.getChannelData(0));
        deliver(d, fallbackFrame);
        fallbackFrame += d.length;
      };
    }
    src.connect(node);
    node.connect(sink);
    listen.on = true;
    return true;
  } catch (e) {
    listenStop();
    listen.err =
      e && e.name === "NotAllowedError"
        ? "Microphone blocked. Allow mic access in your browser’s site settings, then try again."
        : "Could not start the microphone.";
    return false;
  } finally {
    listen.starting = false;
  }
}

export function listenStop() {
  if (stream) stream.getTracks().forEach((t) => t.stop());
  try {
    node && node.disconnect();
    src && src.disconnect();
    sink && sink.disconnect();
  } catch (e) {}
  if (node && node.port) node.port.onmessage = null;
  stream = src = node = sink = listener = null;
  const was = listen.on;
  listen.on = false;
  subs = [];
  if (was) emit("listen-stopped");
}
export const setSensitivity = (v) => {
  S.listen.sens = v;
  if (listener) listener.setSensitivity(v);
  save();
};

/* Measure the device delay: play six beeps, listen for them, and keep the typical gap. Needs speakers (headphones
   do not reach the microphone). Returns { ms, n } or { err }. */
export async function calibrate() {
  if (!(await listenStart())) return { err: listen.err || "Could not start the microphone." };
  await new Promise((r) => setTimeout(r, 450)); // let the listener learn the room first
  const t0 = ctx.currentTime + 0.5,
    due = Array.from({ length: 6 }, (_, k) => t0 + k * 0.6);
  due.forEach((t) => tone(88, t, 0.12, 0.7, "triangle", true));
  const got = [];
  const off = onNote((e) => {
    const k = due.findIndex((t) => e.raw >= t - 0.02 && e.raw < t + 0.45 && !got.some((g) => g.k === t));
    if (k >= 0) got.push({ k: due[k], d: e.raw - due[k] });
  });
  await new Promise((r) => setTimeout(r, (due[5] - ctx.currentTime + 0.7) * 1000));
  off();
  if (got.length < 4) return { err: "Could not hear the beeps. Turn the volume up, take headphones off, and keep the room quiet." };
  const ds = got.map((g) => g.d).sort((a, b) => a - b),
    ms = Math.round(ds[ds.length >> 1] * 1000);
  S.listen.latency = Math.max(0, Math.min(600, ms));
  save();
  emit("listen-calibrated");
  return { ms: S.listen.latency, n: got.length };
}

if (typeof document !== "undefined")
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && listen.on) listenStop(); // never keep the mic open in a hidden tab
  });
