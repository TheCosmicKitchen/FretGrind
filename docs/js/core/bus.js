/* Wiring between modules, so they never need to import each other in a circle:
   screens  - each page registers its draw function; render() draws the current page
   actions  - a click on an element with data-<name> calls the handler registered for <name>
   events   - tiny publish/subscribe (e.g. "audio-error") */
import { ui } from "./store.js";

const screens = {},
  handlers = {},
  events = {};

export const screen = (name, fn) => (screens[name] = fn);
export const render = () => (screens[ui.page] || screens.cards)();

export const on = (name, fn) => (events[name] ||= []).push(fn);
export const emit = (name, ...args) => (events[name] || []).forEach((fn) => fn(...args));

export const action = (key, fn) => (handlers[key] = fn); // key is camelCase: "scoreStart" <-> data-score-start
const kebab = (k) => k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());

/* One delegated click listener for the whole app. */
export function mountClicks(root) {
  root.addEventListener("click", (e) => {
    const keys = Object.keys(handlers),
      b = e.target.closest(keys.map((k) => `[data-${kebab(k)}]`).join(","));
    if (!b) return;
    for (const k of keys) if (k in b.dataset) return handlers[k](b.dataset, b, e);
  });
}
