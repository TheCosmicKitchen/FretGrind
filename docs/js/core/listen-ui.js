/* The listening panel shared by the rhythm game and the songs: on/off, a live level meter, sensitivity, the device
   delay (measured with speaker beeps, or set by hand) and a headphones switch. */
import { S, save } from "./store.js";
import { action, emit, on, render } from "./bus.js";
import { calibrate, latencyMs, listen, listenLevel, listenStart, listenStop, onNote, setSensitivity } from "./listen-io.js";
import { chooseInput, inputPicker, inputs, refreshInputs } from "./inputs.js";

const cal = { busy: false, text: "" };
let timer = 0,
  flashUntil = 0;

export const listenOn = () => listen.on;

/* Markup. `extra` goes at the end (a page can add its own line). */
export function listenPanel(extra = "") {
  const L = S.listen,
    msg = listen.err || cal.text;
  const plugged = S.listen.input && S.listen.plugged;
  return `<div class="ls-panel"><div class="ls-row"><button data-ls-toggle class="tg ${listen.on ? "a" : ""}" aria-pressed="${listen.on}">${listen.starting ? "Starting…" : listen.on ? (plugged ? "Guitar input on" : "Microphone on") : plugged ? "Listen to my guitar" : "Use microphone"}</button><span class="mic-meter ls-meter"><i id="ls-level"></i></span><span class="ls-dot" id="ls-dot" aria-hidden="true"></span></div>${
    listen.on
      ? `${inputPicker()}<div class="ls-row"><span>Sensitivity</span><button data-ls-sens="-1" aria-label="Less sensitive">−</button><b>${L.sens}</b><button data-ls-sens="1" aria-label="More sensitive">+</button><button data-ls-phones class="tg ${L.phones ? "a" : ""}" aria-pressed="${L.phones}">Headphones</button></div><div class="ls-row"><span>Delay</span><button data-ls-lat="-10" aria-label="Less delay">−</button><b>${latencyMs()} ms</b><button data-ls-lat="10" aria-label="More delay">+</button><button data-ls-cal ${cal.busy ? "disabled" : ""}>${cal.busy ? "Listening…" : "Measure"}</button></div>`
      : ""
  }<small class="ls-msg" id="ls-msg" role="status">${msg || (listen.on ? (plugged ? "Guitar plugged in: a clean signal, and it can't hear your speakers, so the click keeps sounding while you play." : L.phones ? "Headphones on: the click keeps sounding while you play." : "On speakers the click stops while you play, so the microphone does not hear it.") : "Plays along with your guitar (or claps) using the microphone. Nothing is recorded or sent anywhere.")}</small>${extra}</div>`;
}

function tick() {
  const lv = document.getElementById("ls-level"),
    dot = document.getElementById("ls-dot");
  if (!lv) return;
  const { db } = listenLevel();
  lv.style.width = Math.max(0, Math.min(100, ((db + 80) / 55) * 100)) + "%";
  if (dot) dot.classList.toggle("on", performance.now() < flashUntil);
}

export function mountListenUi() {
  on("listen-stopped", () => render());
  let seen = -1; // redraw when the list of inputs changes, so the picker shows what is plugged in
  on("inputs-changed", () => inputs.list.length !== seen && ((seen = inputs.list.length), render()));
  if (typeof navigator !== "undefined" && navigator.mediaDevices && navigator.mediaDevices.addEventListener)
    navigator.mediaDevices.addEventListener("devicechange", async () => {
      await refreshInputs();
      emit("inputs-changed");
    });
  // choosing an input: whatever is listening starts again on the new one
  document.addEventListener("change", async (e) => {
    if (!e.target.matches || !e.target.matches("[data-ls-input]")) return;
    chooseInput(e.target.value);
    const { mic, micStop, toggleMic } = await import("./mic.js");
    if (listen.on) {
      listenStop();
      await listenStart();
      onNoteFlash();
    } else if (mic.on) {
      micStop();
      await toggleMic();
    }
    render();
  });
  action("lsPlugged", () => {
    S.listen.plugged = !S.listen.plugged;
    save();
    render();
  });
  onNoteFlash();
  clearInterval(timer);
  timer = setInterval(tick, 70);
  action("lsToggle", async () => {
    if (listen.on) listenStop();
    else {
      cal.text = "";
      const { micStop, mic } = await import("./mic.js");
      if (mic.on) micStop(); // only one thing listens at a time
      render();
      await listenStart();
      onNoteFlash();
    }
    render();
  });
  action("lsSens", (D) => {
    setSensitivity(Math.max(1, Math.min(5, S.listen.sens + +D.lsSens)));
    render();
  });
  action("lsPhones", () => {
    S.listen.phones = !S.listen.phones;
    save();
    render();
  });
  action("lsLat", (D) => {
    S.listen.latency = Math.max(0, Math.min(600, latencyMs() + +D.lsLat));
    save();
    render();
  });
  action("lsCal", async () => {
    cal.busy = true;
    cal.text = "Keep quiet for a few seconds…";
    render();
    const r = await calibrate();
    cal.busy = false;
    cal.text = r.err ? r.err : `Measured ${r.ms} ms from ${r.n} beeps.`;
    render();
  });
}

let flashSub = null;
function onNoteFlash() {
  if (!listen.on) return;
  if (flashSub) flashSub();
  flashSub = onNote(() => (flashUntil = performance.now() + 140));
}
