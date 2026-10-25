/* Microphone note detection for the flash cards.
   Listens to the mic, tracks pitch with YIN, and answers the current card when it hears the right note.
   Guitar music is written an octave above where it sounds, so detected pitches are shifted up 12 semitones
   (see pitch.js) to match the written-pitch MIDI numbers used by the decks. */
import { NAMES } from "./theory.js";
import { ui } from "./store.js";
import { ctx, audioReady } from "./audio.js";
import { render } from "./bus.js";
import { listenStop } from "./listen-io.js";
import { yinPitch, freqToWritten } from "./pitch.js";

export const mic = { on: false, err: "" }; // read by the cards page
export const micHooks = { correct: () => {} }; // the cards page says what "heard the right note" does

let micRing = null,
  micHold = 0,
  micWrongUntil = 0,
  micWrongText = "",
  micPrevRms = 0,
  micStable = { m: null, n: 0, fired: false },
  micStream,
  micSrc,
  micAn,
  micTimer,
  micBuf;

const MIC_MIN_RMS = 0.008, // below this the mic is treated as silent
  MIC_STABLE = 4, // consecutive 50ms readings of one note before it counts (~200ms)
  MIC_HOLD_MS = 1500; // ignore the mic after a new card appears (lets the last note die out)

/* Ignore the mic for a moment (a new card just appeared). */
export const holdMic = (ms = MIC_HOLD_MS) => (micHold = performance.now() + ms);

function micUI(text, rms) {
  const t = document.getElementById("mic-note"),
    l = document.getElementById("mic-level");
  if (t) t.textContent = performance.now() < micWrongUntil ? micWrongText : text;
  if (l) l.style.width = Math.min(100, rms * 700) + "%";
}

function micTick() {
  micAn.getFloatTimeDomainData(micBuf);
  let sum = 0;
  for (let i = 0; i < micBuf.length; i++) sum += micBuf[i] * micBuf[i];
  const rms = Math.sqrt(sum / micBuf.length);
  if (rms < MIC_MIN_RMS) {
    micStable = { m: null, n: 0, fired: false };
    micRing = null; // silence: the previous note has finished ringing
    micPrevRms = rms;
    return micUI("Play it on your guitar…", rms);
  }
  // A sudden jump in volume is a new pluck: allow the same note to be tried again.
  if (rms > micPrevRms * 1.8) micStable = { m: null, n: 0, fired: false };
  micPrevRms = rms;
  const r = yinPitch(micBuf, ctx.sampleRate);
  if (!r || r.clarity < 0.85) return micUI("Listening…", rms);
  const { m, cents } = freqToWritten(r.f);
  if (Math.abs(cents) > 35) return micUI("Listening…", rms);
  micUI("Hearing " + NAMES[m % 12], rms);
  if (m === micStable.m) micStable.n++;
  else micStable = { m, n: 1, fired: false };
  if (micStable.n >= MIC_STABLE && !micStable.fired && micHeard(m)) micStable.fired = true;
}

/* Called once per stable note. Returns false if the note should be re-offered later. */
function micHeard(m) {
  const cur = ui.cur;
  if (!mic.on || ui.page !== "cards" || !cur || cur.done || !cur.q.mic) return true;
  if (performance.now() < micHold) return false;
  if (micRing !== null && m % 12 === micRing) return true; // still the previous note ringing
  if (cur.q.mic(m)) {
    micRing = m % 12;
    micHooks.correct();
  } else {
    micWrongText = "Heard " + NAMES[m % 12] + " – not quite, try again";
    micWrongUntil = performance.now() + 1800;
  }
  return true;
}

export const micBox = () =>
  `<div class="mic-box"><span aria-hidden="true">🎤</span><span id="mic-note">Play it on your guitar…</span><span class="mic-meter"><i id="mic-level"></i></span></div><button class="rs" data-micskip>Show answer</button>`;

export function micStop() {
  clearInterval(micTimer);
  if (micStream) micStream.getTracks().forEach((t) => t.stop());
  if (micSrc) micSrc.disconnect();
  mic.on = false;
  micStream = micSrc = micAn = null;
}

export async function toggleMic() {
  if (mic.on) {
    micStop();
    return render();
  }
  mic.err = "";
  listenStop(); // only one thing listens at a time
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    mic.err = "Microphone access needs a secure (https) page and a browser that supports it.";
    return render();
  }
  try {
    await audioReady();
    micStream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    micSrc = ctx.createMediaStreamSource(micStream);
    micAn = ctx.createAnalyser();
    micAn.fftSize = 4096;
    micBuf = new Float32Array(micAn.fftSize);
    micSrc.connect(micAn); // analyser only; never routed to the speakers, so no feedback
    mic.on = true;
    holdMic(400);
    micRing = null;
    micStable = { m: null, n: 0, fired: false };
    micTimer = setInterval(micTick, 50);
  } catch (e) {
    micStop();
    mic.err =
      e && e.name === "NotAllowedError"
        ? "Microphone blocked. Allow mic access in your browser’s site settings, then try again."
        : "Could not start the microphone.";
  }
  render();
}

// Release the microphone when the tab is hidden.
if (typeof document !== "undefined")
  document.addEventListener("visibilitychange", () => {
    if (document.hidden && mic.on) {
      micStop();
      if (ui.page === "cards") render();
    }
  });
