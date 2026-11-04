/* Choosing what to listen to: a guitar plugged in by USB, or the microphone. The browser's devices are faked here. */
import { test } from "node:test";
import assert from "node:assert/strict";
import { S } from "../../docs/js/core/store.js";
import { sanitizeListen, quietInput } from "../../docs/js/core/listen-io.js";
import { audioConstraints, chooseInput, inputPicker, inputs, looksPlugged, openInput, refreshInputs } from "../../docs/js/core/inputs.js";

const DEVICES = [
  { kind: "audioinput", deviceId: "default", label: "Default - Microphone Array" },
  { kind: "audioinput", deviceId: "communications", label: "Communications - Microphone Array" },
  { kind: "audioinput", deviceId: "mic1", label: "Microphone Array (Realtek Audio)" },
  { kind: "audioinput", deviceId: "rs", label: "Rocksmith Guitar Adapter Mono (12ba:00ff)" },
  { kind: "audiooutput", deviceId: "spk", label: "Speakers" },
];
let opened = [];
Object.defineProperty(globalThis, "navigator", {
  configurable: true,
  value: {
    mediaDevices: {
      enumerateDevices: async () => DEVICES,
      getUserMedia: async (c) => {
        opened.push(c.audio.deviceId?.exact || "default");
        if (c.audio.deviceId && !DEVICES.some((d) => d.deviceId === c.audio.deviceId.exact)) throw Object.assign(new Error("gone"), { name: "OverconstrainedError" });
        return { id: "stream" };
      },
    },
  },
});

test("saved choices are tidied: a bad id is dropped, the default needs no id", () => {
  S.listen = { input: 42, plugged: "yes" };
  sanitizeListen();
  assert.equal(S.listen.input, null);
  assert.equal(S.listen.plugged, false);
  S.listen = { input: "rs", plugged: true };
  sanitizeListen();
  assert.equal(S.listen.input, "rs");
  assert.equal(audioConstraints().audio.deviceId.exact, "rs");
  assert.equal(audioConstraints().audio.echoCancellation, false, "nothing smears the attack");
});

test("the list holds real inputs only, and names that are guitar leads are recognised", async () => {
  await refreshInputs();
  assert.deepEqual(inputs.list.map((x) => x.id), ["mic1", "rs"]);
  for (const name of ["Rocksmith Guitar Adapter Mono", "Real Tone Cable", "Focusrite Scarlett Solo USB", "iRig HD 2", "Line 6 Helix", "BOSS Katana", "USB Audio CODEC", "Instrument (UMC204HD)"]) assert.ok(looksPlugged(name), name);
  for (const name of ["Microphone Array (Realtek Audio)", "MacBook Pro Microphone", "Logitech Webcam C920", "AirPods", "Blue Yeti"]) assert.ok(!looksPlugged(name), name);
});

test("choosing the cable: it's opened, it counts as plugged in, and the click can keep sounding", async () => {
  S.listen = { phones: false };
  sanitizeListen();
  assert.equal(quietInput(), false, "a microphone on speakers hears the click");
  chooseInput("rs");
  assert.equal(S.listen.plugged, true);
  assert.equal(quietInput(), true);
  opened = [];
  await openInput();
  assert.deepEqual(opened, ["rs"]);
  assert.match(inputPicker(), /Rocksmith Guitar Adapter/);
  assert.match(inputPicker(), /data-ls-plugged class="tg a"/);
  chooseInput("mic1");
  assert.equal(S.listen.plugged, false);
  assert.equal(quietInput(), false);
  chooseInput("");
  assert.equal(S.listen.input, null);
});

test("an input that has been unplugged falls back to the default microphone, and is forgotten", async () => {
  S.listen.input = "gone-cable";
  S.listen.plugged = true;
  opened = [];
  await openInput();
  assert.deepEqual(opened, ["gone-cable", "default"]);
  assert.equal(S.listen.input, null);
  assert.equal(S.listen.plugged, false);
});
