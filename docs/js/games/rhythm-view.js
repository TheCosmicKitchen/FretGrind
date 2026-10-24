/* One bar of rhythm drawn on a single line: note heads, stems, beams, dots, rests, beat numbers.
   `marks` colour each tapped note ({ slot, cls, label }); `taps` show where you actually tapped ({ slot, cls }). */
import { SLOTS, beams, parse } from "./rhythm-patterns.js";

export const RX = { x0: 64, dx: 64, line: 84 }; // x of slot 0, distance between slots, y of the line
export const slotX = (slot) => RX.x0 + slot * RX.dx;
const W = slotX(SLOTS) - 20 + 24;

export function rhythmSvg(pattern, marks = [], taps = []) {
  const ev = parse(pattern),
    y = RX.line,
    mark = new Map(marks.map((m) => [m.slot, m])),
    paired = new Set(beams(pattern).flat());
  let h = `<svg class="rh-svg" viewBox="0 0 ${W} 196" role="img" aria-label="One bar of rhythm in 4/4">`;
  h += `<line class="rh-line" x1="26" x2="${W - 14}" y1="${y}" y2="${y}"/>`;
  h += `<line class="rh-bar" x1="${W - 14}" x2="${W - 14}" y1="${y - 22}" y2="${y + 22}"/><line class="rh-bar" x1="26" x2="26" y1="${y - 22}" y2="${y + 22}"/>`;
  // beat grid and numbers
  for (let s = 0; s < SLOTS; s++) {
    if (s % 2 === 0) h += `<line class="rh-grid" x1="${slotX(s)}" x2="${slotX(s)}" y1="${y + 26}" y2="${y + 52}"/>`;
    h += `<text class="rh-count" x="${slotX(s)}" y="${y + 70}" text-anchor="middle">${s % 2 ? "+" : s / 2 + 1}</text>`;
  }
  ev.forEach((e) => {
    const x = slotX(e.slot),
      m = mark.get(e.slot),
      cls = m ? " " + m.cls : "";
    if (e.type === "rest") {
      h +=
        e.len === 2
          ? `<path class="rh-rest" d="M${x - 4} ${y - 18} l8 9 l-9 9 l8 9 l-5 4"/>`
          : `<circle class="rh-restdot" cx="${x - 3}" cy="${y - 9}" r="2.8"/><path class="rh-rest" d="M${x - 3} ${y - 9} q7 1 4 8 l-9 18"/>`;
      return;
    }
    const open = e.len >= 4;
    h += `<ellipse class="rh-head${open ? " open" : ""}${cls}" cx="${x}" cy="${y}" rx="9" ry="6.5" transform="rotate(-18 ${x} ${y})"/>`;
    if (e.len >= 8) return; // whole note: no stem
    h += `<line class="rh-stem${cls}" x1="${x + 8}" x2="${x + 8}" y1="${y - 2}" y2="${y - 42}"/>`;
    if (e.len === 3 || e.len === 6) h += `<circle class="rh-dot${cls}" cx="${x + 17}" cy="${y + 4}" r="2.4"/>`;
    if (e.len === 1 && !paired.has(e.slot)) h += `<path class="rh-flag${cls}" d="M${x + 8} ${y - 42} q12 6 8 20"/>`;
  });
  beams(pattern).forEach(([a, b]) => {
    const m = mark.get(a) || mark.get(b);
    h += `<line class="rh-beam${m ? " " + m.cls : ""}" x1="${slotX(a) + 8}" x2="${slotX(b) + 8}" y1="${y - 41}" y2="${y - 41}"/>`;
  });
  marks.forEach((m) => {
    if (m.label) h += `<text class="rh-label ${m.cls}" x="${slotX(m.slot)}" y="${y + 106}" text-anchor="middle">${m.label}</text>`;
  });
  taps.forEach((t) => {
    h += `<path class="rh-tap ${t.cls}" d="M${slotX(t.slot) - 6} ${y + 130} l6 -11 l6 11z"/>`;
  });
  h += `<line id="rh-head" class="rh-head-line" x1="${slotX(0) - 18}" x2="${slotX(0) - 18}" y1="${y - 52}" y2="${y + 56}" opacity="0"/>`;
  return h + "</svg>";
}
