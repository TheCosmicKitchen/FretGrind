/* Small helpers for writing lessons as data. A lesson is a list of steps:
     read(heading, paragraphs, { fig, figs, hear })   something to read, with pictures and play buttons
     quiz(...questions)                               questions: ask(...) or card("staff:64")
     practice(task, { needs: "guitar", min, fig })    something to do on the instrument (skipped when you study without it)
   hear = [{ l: "button label", snd: [midi...], gap: seconds between notes }] or { l, seq: [midi...], onsets: [beats], tempo } */
export const lesson = (id, title, min, ...steps) => ({ id, title, min, steps });
export const read = (h, p, extra = {}) => ({ t: "read", h, p: [].concat(p), ...extra });
export const quiz = (...qs) => ({ t: "quiz", qs });
/* A multiple-choice question: prompt, options, index of the right one, why, optional picture, optional sound to play (same shape as a hear button). */
export const ask = (p, a, c, why, fig, hear) => ({ p, a, c, why, ...(fig ? { fig } : {}), ...(hear ? { hear } : {}) });
export const card = (k) => ({ card: k });
export const practice = (task, extra = {}) => ({ t: "do", task, ...extra });
export const course = (id, name, blurb, lessons, extra = {}) => ({ id, name, blurb, lessons, ...extra });
export const soon = (id, name, blurb, note) => ({ id, name, blurb, lessons: [], soon: note || "Coming soon" });
/* Scale a MIDI-note list: C major scale from middle C etc. */
export const midi = (...ns) => ns;
/* A "play this chord" button: all the strings of a chord shape, strummed. */
import { OPEN, SH } from "../core/theory.js";
export const hearChord = (name, gap = 0.045) => ({ l: "▶ " + name, snd: SH[name].map((f, s) => (f >= 0 ? OPEN[s] + f : null)).filter((x) => x !== null), gap });
