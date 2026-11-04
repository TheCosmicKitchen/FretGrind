/* Which sound input to listen to: the default microphone, or a guitar plugged in by USB (a Rocksmith Real Tone Cable,
   or the guitar input of an audio interface). A plugged-in guitar is the clean signal the note detector likes best, and it
   can't hear the speakers, so the click can keep going while you play. Shared by every listener in the app (songs and
   games through listen-io.js, the tuner and the cards through mic.js), so the choice is made once. */
import { S, save } from "./store.js";

export const inputs = { list: [] }; // [{ id, label }]: names only show once the browser has been allowed to listen

/* The usual capture settings, with the chosen input. Echo cancelling and the like smear the attack the detector times. */
export function audioConstraints() {
  const audio = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
  if (S.listen.input) audio.deviceId = { exact: S.listen.input };
  return { audio };
}

/* Open the chosen input. If it has gone (unplugged since last time), forget it and open the default microphone. One that
   is only busy (another program has it) is kept, and the error says so. */
export async function openInput() {
  try {
    return await navigator.mediaDevices.getUserMedia(audioConstraints());
  } catch (e) {
    if (!S.listen.input || !e || !["OverconstrainedError", "NotFoundError"].includes(e.name)) throw e;
    S.listen.input = null;
    S.listen.plugged = false;
    save();
    return navigator.mediaDevices.getUserMedia(audioConstraints());
  }
}

/* The inputs there are now. The "default" and "communications" entries are the same devices again under another name. */
export async function refreshInputs() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return inputs.list;
  const all = await navigator.mediaDevices.enumerateDevices();
  inputs.list = all.filter((d) => d.kind === "audioinput" && d.deviceId && !["default", "communications"].includes(d.deviceId)).map((d, i) => ({ id: d.deviceId, label: d.label || `Input ${i + 1}` }));
  return inputs.list;
}

/* Does this input's name say it's a guitar lead rather than a microphone? Used to guess, and the player can say otherwise. */
export const looksPlugged = (label) => /rocksmith|real ?tone|guitar|instrument|hi-?z|line ?in|interface|scarlett|focusrite|clarett|irig|umc|behringer|presonus|audient|motu|steinberg|boss|line ?6|helix|katana|usb audio codec/i.test(String(label || ""));

/* Choose an input by id ("" = the default microphone). */
export function chooseInput(id) {
  const x = inputs.list.find((i) => i.id === id);
  S.listen.input = x ? x.id : null;
  S.listen.plugged = x ? looksPlugged(x.label) : false;
  save();
}

/* The picker, for any panel that listens. Nothing to pick with only one input. */
export function inputPicker() {
  if (inputs.list.length < 2 && !S.listen.input) return "";
  const opt = (v, l) => `<option value="${v}"${(S.listen.input || "") === v ? " selected" : ""}>${String(l).replace(/[&<>"]/g, (c) => `&#${c.charCodeAt(0)};`)}</option>`;
  return `<div class="ls-row"><label class="ls-in"><span>Listen to</span><select data-ls-input>${opt("", "Default microphone")}${inputs.list.map((x) => opt(x.id, x.label)).join("")}</select></label>${S.listen.input ? `<button data-ls-plugged class="tg ${S.listen.plugged ? "a" : ""}" aria-pressed="${!!S.listen.plugged}">Guitar plugged in</button>` : ""}</div>`;
}
