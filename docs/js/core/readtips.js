/* Reading notes on the treble staff: how to tell what a note is, as a teacher would say it. The lines and the spaces each
   spell something you can remember, ledger lines count on from the staff, and a few landmarks (the G line the clef curls
   round, the open strings) give a place to read from. Also the order to learn them in: lines, spaces, below the staff,
   above it, then sharps and flats. Pure, so Node can test it. */
import { OPEN, STAFF_NOTE } from "./theory.js";

const LETTERS = ["C", "D", "E", "F", "G", "A", "B"],
  ORD = ["", "1st", "2nd", "3rd", "4th", "5th"],
  STRINGS = ["low E", "A", "D", "G", "B", "high E"];
/* Steps up the staff, a letter at a time: E4, the bottom line, is 30; each line or space is one more. */
export const staffStep = (m) => (Math.floor(m / 12) - 1) * 7 + STAFF_NOTE[m % 12][1];
const BOTTOM = 30, // E4, the bottom line
  TOP = 38; // F5, the top line
const letterOf = (st) => LETTERS[((st % 7) + 7) % 7];

/* The sets to learn the staff in, in order. */
export const STAFF_SETS = [
  { id: "lines", name: "Lines", blurb: "E G B D F" },
  { id: "spaces", name: "Spaces", blurb: "F A C E, and the notes just outside" },
  { id: "below", name: "Below the staff", blurb: "Ledger lines: the guitar's low notes" },
  { id: "above", name: "Above the staff", blurb: "Ledger lines: high up the neck" },
  { id: "acc", name: "Sharps and flats", blurb: "A fret up or down from a letter" },
];
export function staffSetOf(m) {
  if (STAFF_NOTE[m % 12][2]) return "acc";
  const st = staffStep(m);
  if (st < BOTTOM - 1) return "below";
  if (st > TOP + 1) return "above";
  return (st - BOTTOM) % 2 === 0 ? "lines" : "spaces";
}

/* Where it sits, said plainly ("on the 2nd line"), how to work it out, and for ledger lines the count itself (which is
   the answer, so only for after). */
function place(st) {
  if (st >= BOTTOM && st <= TOP) {
    const n = (st - BOTTOM) / 2 + 1;
    return Number.isInteger(n)
      ? { where: `on the ${ORD[n]} line from the bottom`, how: "The lines, bottom to top, are E G B D F: “Every Good Boy Deserves Fudge.”" }
      : { where: `in the ${ORD[Math.ceil(n - 0.5)]} space from the bottom`, how: "The spaces, bottom to top, spell F A C E." };
  }
  if (st === BOTTOM - 1) return { where: "just under the bottom line", how: "The bottom line is E, so the space under it is one letter down." };
  if (st === TOP + 1) return { where: "just over the top line", how: "The top line is F, so the space over it is one letter up." };
  if (st < BOTTOM) {
    const down = BOTTOM - st,
      ledger = Math.floor(down / 2);
    return { where: down % 2 ? `under the ${ORD[ledger]} ledger line below the staff` : `on the ${ORD[ledger]} ledger line below the staff`, how: "Count down from the bottom line, E, a letter for each line and space.", count: countFrom(BOTTOM, -1, down) };
  }
  const up = st - TOP,
    ledger = Math.floor(up / 2);
  return { where: up % 2 ? `over the ${ORD[ledger]} ledger line above the staff` : `on the ${ORD[ledger]} ledger line above the staff`, how: "Count up from the top line, F, a letter for each line and space.", count: countFrom(TOP, 1, up) };
}
const countFrom = (st, dir, n) => Array.from({ length: n + 1 }, (_, i) => letterOf(st + dir * i)).join(", ");

/* The landmarks a guitarist reads from: the open strings, and the G line the treble clef curls round. */
const LANDMARKS = [
  ...OPEN.map((m, s) => ({ st: staffStep(m), say: `the open ${STRINGS[s]} string` })),
  { st: staffStep(60), say: "middle C" },
];
function landmark(st) {
  const near = LANDMARKS.map((l) => ({ ...l, d: st - l.st })).sort((a, b) => Math.abs(a.d) - Math.abs(b.d))[0];
  if (!near || Math.abs(near.d) > 2) return "";
  if (!near.d) return `It's ${near.say}.`;
  return `It's ${Math.abs(near.d) === 1 ? "one letter" : "two letters"} ${near.d > 0 ? "above" : "below"} ${near.say}.`;
}

/* Where to find it on the guitar: first position if it's there, the open string if it is one. */
function onGuitar(m) {
  const spots = OPEN.map((o, s) => [s, m - o]).filter(([, f]) => f >= 0 && f <= 24);
  if (!spots.length) return "";
  const [s, f] = spots.find(([, f]) => f <= 4) || spots.sort((a, b) => a[1] - b[1])[0];
  return `On the guitar: ${f ? `fret ${f} on the ${STRINGS[s]} string` : `the open ${STRINGS[s]} string`}.`;
}

/* Before answering: where it is and how to work it out, without giving it away. A landmark helps only if it isn't the note. */
export function noteHint(m) {
  const [, , sign] = STAFF_NOTE[m % 12],
    st = staffStep(m),
    p = place(st),
    mark = sign ? "" : landmark(st);
  return `It's ${p.where}. ${p.how}${mark && !mark.startsWith("It's the") && !mark.startsWith("It's middle") ? ` ${mark}` : ""}${sign ? ` Then the ${sign === "♯" ? "sharp raises it a fret" : "flat lowers it a fret"}.` : ""}`;
}

/* After answering: the note, where it sits and why, and where it lives on the guitar. */
export function noteTip(m) {
  const [name, , sign] = STAFF_NOTE[m % 12],
    st = staffStep(m),
    p = place(st),
    letter = letterOf(st),
    mark = landmark(st);
  return `${name} is ${p.where}. ${p.how}${p.count ? ` ${p.count}.` : ""}${sign ? ` The ${sign === "♯" ? "sharp" : "flat"} makes ${letter} into ${name}: one fret ${sign === "♯" ? "higher" : "lower"}.` : mark.startsWith("It's the open") ? "" : ` ${mark}`} ${onGuitar(m)}`.replace(/\s+/g, " ").trim();
}
