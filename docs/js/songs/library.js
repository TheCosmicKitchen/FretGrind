/* The big library in docs/lib (made by tools/import-music.mjs). It is too large to load up front: the index comes down
   when the Songs tab is first opened, and a tune's chunk when the tune is. The service worker keeps whatever has been
   fetched, so anything opened once works offline. */
const url = (f) => new URL(`../../lib/${f}`, import.meta.url);

export const SOURCES = {
  ryans: "From Ryan's Mammoth Collection of Fiddle Tunes (Boston, 1883).",
  oneills: "From Francis O'Neill's The Music of Ireland (Chicago, 1903).",
  mutopia: "A public-domain score from the Mutopia Project.",
};
const COLS = ["id", "title", "by", "style", "level", "key", "time", "tempo", "chunk"];

let index = null,
  pending = null;
const chunks = new Map();

export const libraryRows = () => index;
export function loadIndex() {
  if (index) return Promise.resolve(index);
  pending ||= fetch(url("index.json"))
    .then((r) => {
      if (!r.ok) throw new Error(r.status);
      return r.json();
    })
    .then((rows) => (index = rows.map((r) => Object.fromEntries(COLS.map((c, i) => [c, r[i]])))))
    .finally(() => (pending = null));
  return pending;
}

const sourceText = (d) => {
  const by = d.enc ? ` Encoded by ${d.enc}.` : "",
    ref = d.src === "mutopia" ? ` ${[d.note, d.ref].filter(Boolean).join(", ")}. Every voice is written on one line, so a held bass can show shorter than it rings.` : d.ref ? ` ${d.ref}.` : "";
  return `${SOURCES[d.src] || ""}${ref}${by}`;
};

/* The song definition for an id in the library, or null. */
export async function loadTune(id) {
  await loadIndex();
  const row = index.find((r) => r.id === id);
  if (!row) return null;
  if (!chunks.has(row.chunk)) {
    const r = await fetch(url(`songs-${row.chunk}.json`));
    if (!r.ok) throw new Error(r.status);
    chunks.set(row.chunk, await r.json());
  }
  const d = chunks.get(row.chunk).find((x) => x.id === id);
  return d ? { ...d, reviewed: false, source: sourceText(d) } : null;
}
