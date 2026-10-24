/* The practice metronome: clicks, optional notes and a count-in, scheduled ahead on the audio clock.
   The highlight on the page is driven by the same clock, so what you see matches what you hear. */
import { S, ui } from "../core/store.js";
import { audioReady, click, ctx, tone } from "../core/audio.js";
import { render } from "../core/bus.js";
import { currentItem } from "./catalog.js";
import { colX } from "./draw.js";

let met = null; // null = stopped, { starting: true } = waiting for audio, otherwise running
export const metBusy = () => !!met;
export const metRunning = () => !!met && !met.starting;
export const metShown = () => (met ? met.shown : null);

function schedule() {
  const P = S.prac,
    spb = 60 / P.bpm;
  while (met && met.next < ctx.currentTime + 0.16) {
    const t = met.next;
    if (met.ci > 0) {
      // count-in: one bar of clicks
      click(t, met.ci === 4);
      met.q.push({ t, col: -1, beat: 4 - met.ci });
      met.ci--;
      met.next += spb;
      continue;
    }
    const it = currentItem(),
      chord = it.kind === "chord",
      sub = chord ? 1 : P.sub,
      g = met.g,
      beat = Math.floor(g / sub) % 4,
      col = chord ? 0 : g % it.cols.length;
    if (g % sub === 0 && P.click) click(t, beat === 0);
    if (P.notes) {
      const ms = it.cols[col].notes.map((n) => n.m),
        v = 0.3 / Math.sqrt(ms.length),
        d = Math.min(chord ? 0.9 : 0.5, (spb / sub) * (chord ? 1.6 : 1.1));
      ms.forEach((m, i) => tone(m, t + (chord ? i * 0.028 : 0), d, v * 1.6, "triangle", true));
    }
    met.q.push({ t, col, beat });
    met.g++;
    met.next += spb / sub;
  }
}

/* Light up the current column (col -1 = count-in: only the beat dots). */
export function show(s) {
  document.querySelectorAll(".pn.hot,.tn.hot").forEach((e) => e.classList.remove("hot"));
  document.querySelectorAll(".bd").forEach((e) => e.classList.toggle("on", !!s && +e.dataset.b === s.beat));
  if (!s) return;
  if (met) met.shown = s;
  if (s.col < 0) return;
  document.querySelectorAll(`[data-col="${s.col}"]`).forEach((e) => e.classList.add("hot"));
  const box = document.querySelector(".pr-scroll");
  if (box && box.scrollWidth > box.clientWidth) box.scrollLeft = colX(s.col) - box.clientWidth / 2;
}
function frame() {
  if (!met) return;
  while (met.q.length && met.q[0].t <= ctx.currentTime) show(met.q.shift());
  met.raf = requestAnimationFrame(frame);
}

export function metStart() {
  if (met) return;
  met = { starting: true };
  audioReady()
    .then(() => {
      if (!met) return;
      met = { next: ctx.currentTime + 0.1, g: 0, ci: S.prac.countIn ? 4 : 0, q: [], shown: null };
      schedule();
      met.timer = setInterval(schedule, 25);
      met.raf = requestAnimationFrame(frame);
      render();
    })
    .catch(() => {
      met = null;
      render();
    });
  render();
}
export function metStop() {
  if (!met) return;
  clearInterval(met.timer);
  cancelAnimationFrame(met.raf);
  met = null;
  if (ui.page === "practice") render();
}
document.addEventListener("visibilitychange", () => document.hidden && met && metStop());
