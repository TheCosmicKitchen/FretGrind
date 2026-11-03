/* Keep the screen on while the hands are on the guitar, where the browser allows it. If nothing is touched for a long while it lets go, so a phone left on the stand can still sleep. */
const IDLE_MS = 20 * 60 * 1000;
let lock = null,
  asking = false,
  wanted = false,
  idle = 0;

async function take() {
  if (lock || asking || !wanted || document.hidden || !navigator.wakeLock) return;
  asking = true;
  try {
    const got = await navigator.wakeLock.request("screen");
    got.addEventListener("release", () => {
      if (lock === got) lock = null;
    });
    lock = got;
    if (!wanted) drop();
  } catch (e) {} // low battery, or not allowed here: the screen just behaves as usual
  asking = false;
}
function drop() {
  if (lock) lock.release().catch(() => {});
  lock = null;
}
export function stayAwake(on) {
  wanted = on;
  clearTimeout(idle);
  if (!on) return drop();
  take();
  idle = setTimeout(() => stayAwake(false), IDLE_MS);
}
document.addEventListener("visibilitychange", take); // the browser lets go when the page is hidden
