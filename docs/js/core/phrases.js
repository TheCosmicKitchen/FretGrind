/* Where a piece of music breathes: cut it into phrases of whole bars, the way a teacher would mark it up. Pure, so Node can test it.
   A phrase wants a comfortable number of notes, a tidy length, and an ending that sounds like one: a long note, a rest, or the tune coming round again.
   Music that repeats is cut the way it was cut the first time, so a repeat is found whole and learned once. */
const MOST = 8; // bars in a phrase
const NEARLY = 0.6; // share of notes two phrases must share to count as the same idea

const fit = (n, want) => (n < want ? (want / n - 1) * 2 : Math.log2(n / want) * 0.6);
const tidy = (b) => (b === 1 ? 0 : b % 4 === 0 ? -0.25 : b % 2 === 0 ? -0.1 : 0.3);

/* bars: one array of note tokens per bar. closes: 0..1 per bar, how much its end sounds like an end. head: 1 if bar 0 is a pick-up.
   [{ from, to, same, like }]: same = the earlier phrase it repeats exactly, like = the earlier phrase it nearly repeats, or -1 */
export function cutPhrases({ bars, closes, head = 0, want = 10 }) {
  const n = bars.length,
    key = bars.map((b) => b.join(" ")),
    out = [],
    notes = (a, b) => bars.slice(a, b + 1).reduce((t, x) => t + x.length, 0),
    bodyOf = (c) => (c.from === 0 ? Math.min(head, c.to) : c.from); // a pick-up isn't there when the tune comes round again
  const repeatAt = (from) => {
    let best = null;
    out.forEach((c, i) => {
      const a = bodyOf(c),
        len = c.to - a + 1;
      if (c.same >= 0 || !notes(a, c.to) || from + len > n || (best && len <= best.len)) return;
      for (let k = 0; k < len; k++) if (key[a + k] !== key[from + k]) return;
      best = { i, len };
    });
    return best;
  };
  for (let from = 0; from < n; ) {
    const start = from === 0 ? Math.min(head, n - 1) : from;
    if (!notes(from, start)) {
      // bars of rest stand alone: the next phrase shouldn't open with silence
      let to = from;
      while (to + 1 < n && !bars[to + 1].length) to++;
      if (to >= start) {
        out.push({ from, to, same: -1, like: -1 });
        from = to + 1;
        continue;
      }
    }
    const again = from ? repeatAt(from) : null;
    if (again) {
      out.push({ from, to: from + again.len - 1, same: again.i, like: -1 });
      from += again.len;
      continue;
    }
    let to = n - 1,
      low = Infinity;
    for (let b = 1; b <= MOST && start + b <= n; b++) {
      const end = start + b - 1,
        count = notes(from, end);
      if (!count) continue;
      if (b > 1 && count > want * 3) break;
      const comesRound = end + 1 < n && (key[end + 1] === key[start] || repeatAt(end + 1)),
        cost = fit(count, want) + tidy(b) - closes[end] * 0.9 - (comesRound ? 0.8 : 0);
      if (cost < low) {
        low = cost;
        to = end;
      }
    }
    if (notes(to + 1, n - 1) <= 3) to = n - 1; // a scrap of a tail joins the phrase before it
    out.push({ from, to, same: -1, like: -1 });
    from = to + 1;
  }
  const words = (c) => bars.slice(bodyOf(c), c.to + 1).flat();
  out.forEach((c, i) => {
    const me = words(c);
    if (c.same >= 0 || me.length < 6) return;
    c.like = out.findIndex((o, j) => {
      if (j >= i || o.same >= 0) return false;
      const was = words(o),
        most = Math.min(me.length, was.length);
      let a = 0,
        z = 0;
      while (a < most && me[a] === was[a]) a++;
      while (z < most - a && me[me.length - 1 - z] === was[was.length - 1 - z]) z++;
      return (a + z) / Math.max(me.length, was.length) >= NEARLY;
    });
  });
  return out;
}
