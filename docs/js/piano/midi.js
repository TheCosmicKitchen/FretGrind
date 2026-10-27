/* Web MIDI input. Listens to every connected MIDI keyboard and passes notes to the handlers the piano page
   registers. Keyboards plugged in later are picked up automatically. Works in Chrome, Edge, Opera and Firefox
   (desktop and Android); Safari and iOS have no Web MIDI, so the computer keys and on-screen keys are the
   fallback there. */
import { S, save } from "../core/store.js";

export const midi = {
  state: typeof navigator !== "undefined" && navigator.requestMIDIAccess ? "off" : "unsupported", // off | pending | ready | denied | unsupported
  names: [],
};
export const midiHooks = { on: () => {}, off: () => {}, allOff: () => {}, change: () => {} };
export const midiReady = () => midi.state === "ready" && midi.names.length > 0;

let access = null;

function bind() {
  midi.names = [];
  if (!access) return;
  for (const input of access.inputs.values()) {
    if (input.state === "disconnected") continue;
    input.onmidimessage = message;
    midi.names.push(input.name || "MIDI keyboard");
  }
}

function message(e) {
  const [status, d1, d2] = e.data,
    cmd = status & 0xf0;
  if (cmd === 0x90 && d2 > 0) midiHooks.on(d1, d2);
  else if (cmd === 0x80 || (cmd === 0x90 && d2 === 0)) midiHooks.off(d1);
  else if (cmd === 0xb0 && (d1 === 123 || d1 === 120)) midiHooks.allOff(); // all notes off / all sound off
}

/* Ask for MIDI access (the browser may prompt). Remembers success so the next visit reconnects by itself. */
export function midiConnect() {
  if (midi.state === "unsupported" || midi.state === "pending") return Promise.resolve();
  if (access) {
    bind();
    return Promise.resolve();
  }
  midi.state = "pending";
  return navigator
    .requestMIDIAccess({ sysex: false })
    .then((acc) => {
      access = acc;
      midi.state = "ready";
      bind();
      acc.onstatechange = () => {
        bind();
        midiHooks.change();
      };
      S.piano.midi = true;
      save();
    })
    .catch(() => {
      midi.state = "denied";
      S.piano.midi = false;
      save();
    });
}

/* Under a flash card that a played note can answer. */
export const midiBox = (text = "Play it on your keyboard…") =>
  `<div class="mic-box"><span aria-hidden="true">🎹</span><span id="midi-note">${text}</span></div>`;
