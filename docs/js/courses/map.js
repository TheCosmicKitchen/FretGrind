/* The path map: one course drawn as a winding road of lesson circles and test diamonds. Pure (string in, string out).
   States: done (green tick), next (the one to do now, pulsing), open (not done yet), due (done, but a review is waiting),
   and for tests: passed or not yet. Tapping a node is handled by the page through data-ln-node. */
import { nodesOf } from "./curriculum.js";

export const PER_ROW = 5;
const X0 = 38,
  DX = 71,
  Y0 = 44,
  DY = 104,
  W = 360;

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;");
/* Split a title into at most two short lines for under a node. */
export function wrap(t, max = 12) {
  const words = String(t).split(/\s+/),
    lines = [""];
  for (const w of words) {
    const l = lines[lines.length - 1];
    if (!l) lines[lines.length - 1] = w;
    else if ((l + " " + w).length <= max) lines[lines.length - 1] = l + " " + w;
    else lines.push(w);
  }
  if (lines.length > 2) {
    lines.length = 2;
    lines[1] = (lines[1].length >= max ? lines[1].slice(0, max - 1) : lines[1]) + "…";
  }
  return lines.map((l) => (l.length > max + 2 ? l.slice(0, max) + "…" : l));
}

/* Where node i sits: rows run left to right, then right to left, like a snake, so each row ends above the start of the next. */
export function nodePos(i) {
  const row = Math.floor(i / PER_ROW),
    k = i % PER_ROW,
    col = row % 2 ? PER_ROW - 1 - k : k;
  return { x: X0 + col * DX, y: Y0 + row * DY, row };
}

/* state of each node, from progress: p = the progress object, due = Set of lesson ids with a review waiting */
export function nodeState(node, trackId, p, due, nextId) {
  if (node.kind === "lesson") {
    if (!p[trackId].les[node.id]) return node.id === nextId ? "next" : "open";
    return due.has(node.id) ? "due" : "done";
  }
  return p[trackId].tst[node.id]?.ok ? "done" : "open";
}

export function mapSvg(course, trackId, p, due, sel, nextId) {
  const nodes = nodesOf(course),
    rows = Math.ceil(nodes.length / PER_ROW),
    H = Y0 + (rows - 1) * DY + 78,
    pos = nodes.map((_, i) => nodePos(i));
  let h = `<svg class="ln-map" viewBox="0 0 ${W} ${H}" role="group" aria-label="Path map for ${esc(course.name)}">`;
  // the road: a line through every node, then the same line again in colour as far as the last finished node
  const d = pos.map((q, i) => `${i ? "L" : "M"}${q.x} ${q.y}`).join(" ");
  let lastDone = -1;
  nodes.forEach((n, i) => nodeState(n, trackId, p, due, nextId) === "done" || nodeState(n, trackId, p, due, nextId) === "due" ? (lastDone = i) : 0);
  h += `<path class="ln-road" d="${d}"/>`;
  if (lastDone > 0) h += `<path class="ln-road done" d="${pos.slice(0, lastDone + 1).map((q, i) => `${i ? "L" : "M"}${q.x} ${q.y}`).join(" ")}"/>`;
  nodes.forEach((n, i) => {
    const { x, y } = pos[i],
      st = nodeState(n, trackId, p, due, nextId),
      on = sel === n.id ? " sel" : "";
    let label, body, name;
    if (n.kind === "lesson") {
      name = `Lesson ${n.i + 1}: ${n.lesson.title}`;
      label = wrap(n.lesson.title);
      body = `${st === "next" ? `<circle class="ln-pulse" cx="${x}" cy="${y}" r="24"/>` : ""}<circle class="ln-c ${st}" cx="${x}" cy="${y}" r="20"/><text class="ln-num ${st}" x="${x}" y="${y + 6}" text-anchor="middle">${st === "done" || st === "due" ? "✓" : n.i + 1}</text>${st === "due" ? `<circle class="ln-badge" cx="${x + 15}" cy="${y - 15}" r="6"/>` : ""}`;
    } else {
      const big = n.kind === "test",
        r = big ? 26 : 19;
      name = big ? "Course test" : "Checkpoint";
      label = [big ? "Course test" : "Checkpoint"];
      body = `<rect class="ln-d ${st}" x="${x - r * 0.72}" y="${y - r * 0.72}" width="${r * 1.44}" height="${r * 1.44}" rx="4" transform="rotate(45 ${x} ${y})"/><text class="ln-num ${st}" x="${x}" y="${y + 6}" text-anchor="middle">${st === "done" ? "✓" : big ? "★" : "?"}</text>`;
    }
    h += `<g class="ln-node${on}" data-ln-node="${n.id}" role="button" tabindex="0" aria-label="${esc(name)}, ${st}">${on ? `<circle class="ln-selring" cx="${x}" cy="${y}" r="${n.kind === "test" ? 34 : 28}"/>` : ""}${body}`;
    label.forEach((l, k) => (h += `<text class="ln-lab" x="${x}" y="${y + (n.kind === "test" ? 46 : 38) + k * 13}" text-anchor="middle">${esc(l)}</text>`));
    h += "</g>";
  });
  return h + "</svg>";
}
