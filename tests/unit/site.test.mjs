import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const docs = new URL("../../docs/", import.meta.url).pathname;
const walk = (d) => readdirSync(d).flatMap((n) => (statSync(join(d, n)).isDirectory() ? walk(join(d, n)) : [join(d, n)]));

test("the service worker caches every module, so the app works offline", () => {
  const sw = readFileSync(join(docs, "sw.js"), "utf8"),
    files = walk(join(docs, "js")).map((f) => f.slice(docs.length));
  for (const f of files) assert.ok(sw.includes(`"${f}"`), `sw.js is missing ${f}`);
});

test("index.html loads one module entry and nothing else from js/", () => {
  const html = readFileSync(join(docs, "index.html"), "utf8");
  assert.match(html, /<script type="module" src="js\/main\.js"><\/script>/);
  assert.equal((html.match(/src="js\//g) || []).length, 1);
});

test("every import in the app resolves to a file (static hosting needs exact paths)", () => {
  for (const f of walk(join(docs, "js")).filter((x) => x.endsWith(".js"))) {
    const src = readFileSync(f, "utf8");
    for (const m of src.matchAll(/from "(\.[^"]+)"/g)) {
      const target = new URL(m[1], "file://" + f).pathname;
      assert.ok(statSync(target, { throwIfNoEntry: false })?.isFile(), `${f} imports missing ${m[1]}`);
    }
  }
});

test("pure modules do not touch the DOM at import time", () => {
  for (const f of ["core/theory.js", "core/decks.js", "core/pitch.js", "games/rhythm-patterns.js", "library/catalog.js", "songs/format.js", "songs/tabify.js", "songs/draw.js", "songs/data.js"]) {
    const src = readFileSync(join(docs, "js", f), "utf8");
    assert.ok(!/\bdocument\.|\bwindow\.|localStorage/.test(src), f);
  }
});
