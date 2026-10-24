/* Browser smoke test (needs Playwright: `npm i -D playwright && npx playwright install chromium`).
   Start the site first:  npm run serve   then:  node tests/browser/smoke.mjs [http://localhost:8765] */
import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:8765",
  fails = [];
const check = (ok, what) => {
  console.log((ok ? "  ok  " : "  FAIL ") + what);
  if (!ok) fails.push(what);
};
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });

for (const [w, h, name] of [[1100, 900, "desktop"], [390, 800, "phone"]]) {
  console.log(`\n${name} ${w}x${h}`);
  const page = await browser.newPage({ viewport: { width: w, height: h } }),
    errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
  await page.goto(base + "/index.html?debug");
  await page.waitForSelector(".card .prompt");

  // --- flash cards: answer cards in every deck, correct and wrong
  const decks = ["staff", "staffFret", "fretNote", "findFret", "tapAll", "chord", "spellChord", "spellScale", "interval"];
  for (const d of decks) {
    await page.evaluate((d) => { __fg.S.act = [d]; __fg.S.regions = []; __fg.next(); }, d);
    const kind = await page.evaluate(() => __fg.ui.cur.q.kind);
    // wrong answer first
    await page.evaluate(() => document.querySelector("[data-a],[data-t],[data-s],[data-check]")?.dispatchEvent(new MouseEvent("click", { bubbles: true })));
    await page.waitForTimeout(30);
    check(await page.evaluate(() => !!document.querySelector(".card")), `${d} (${kind}) renders and takes a click`);
  }
  // --- regions
  await page.evaluate(() => { __fg.S.act = ["fretNote", "staffFret"]; __fg.next(); });
  await page.click('[data-region="mid"]');
  check(await page.evaluate(() => __fg.S.regions.join() === "mid"), "region chip selects Mid");
  const tapOk = await page.evaluate(() => { const z = [...document.querySelectorAll(".tap-zone")].map((e) => +e.dataset.f); return z.every((f) => f >= 7 && f <= 12); });
  check(tapOk, "tap zones only cover the chosen region");
  await page.click('[data-region="all"]');

  // --- library & practice
  await page.click("[data-page=library]");
  await page.click('[data-pr="kind"][data-v="scale"]');
  await page.selectOption("[data-pr-sel=scale]", "11");
  check((await page.textContent(".prac h2")).includes("Harmonic minor"), "scale dropdown changes the scale");
  await page.click('[data-pr="kind"][data-v="chord"]');
  await page.click('[data-pr="cRoot"][data-v="3"]');
  await page.selectOption("[data-pr-sel=cSuf]", "m7b5");
  check((await page.textContent(".prac h2")).includes("E♭"), "chord root and type change");
  await page.click("[data-pr=toPractice]");
  check((await page.textContent(".tag")) === "PRACTICE", "Practice tab opens from Library");
  await page.evaluate(() => { __fg.S.prac.countIn = false; __fg.S.prac.bpm = 200; });
  await page.click("[data-pr=play]");
  await page.waitForTimeout(1200);
  check((await page.textContent("[data-pr=play]")).includes("Stop"), "metronome starts");
  check(await page.evaluate(() => document.querySelectorAll(".bd.on").length === 1), "one beat dot lit");
  await page.click("[data-page=cards]");
  await page.click("[data-page=practice]");
  check((await page.textContent("[data-pr=play]")).includes("Start"), "metronome stops when leaving the tab");

  // --- games: score run
  await page.click("[data-page=games]");
  await page.click("[data-score-start]");
  await page.click("[data-score-play]");
  await page.waitForSelector(".score-card");
  await page.click("[data-score-exit]");
  check(await page.evaluate(() => !!document.querySelector(".rhythm-menu")), "score game exits to the menu");

  // --- games: rhythm, with taps on time
  await page.evaluate(() => { Object.assign(__fg.S.rhythm, { level: 3, bpm: 100, countIn: false, listen: false, click: false }); __fg.render(); });
  await page.click("[data-rh-start]");
  await page.waitForSelector("#rh-pad");
  await page.evaluate(() => {
    const { run, toPerf } = __fg.rhythmDebug(),
      slots = [...run.pattern].map((c, i) => (c === "x" ? i : -1)).filter((i) => i >= 0);
    slots.forEach((s) => setTimeout(() => document.getElementById("rh-pad").dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, cancelable: true })), Math.max(0, toPerf(run.playStart + (s * run.spb) / 2) - performance.now())));
  });
  await page.waitForSelector(".rh-result", { timeout: 15000 });
  const acc = await page.evaluate(() => __fg.rhythmDebug().run.result.g.accuracy);
  check(acc >= 0.9, `rhythm: on-time taps score ${(acc * 100) | 0}%`);
  await page.click("[data-rh-retry]");
  await page.waitForSelector("#rh-pad");
  await page.waitForSelector(".rh-result", { timeout: 15000 }); // no taps this time
  check((await page.evaluate(() => __fg.rhythmDebug().run.result.g.accuracy)) === 0, "rhythm: no taps score 0%");
  await page.click("[data-rh-exit]");
  check(await page.evaluate(() => !!document.querySelector(".rhythm-menu")), "rhythm exits to the menu");

  // --- reset keeps preferences
  await page.click("[data-page=cards]");
  await page.click("[data-reset]");
  await page.click("[data-reset]");
  check(await page.evaluate(() => Object.keys(__fg.S.it).length <= 1 && __fg.S.mode === "bag"), "reset clears progress, keeps the mode");

  // --- a damaged save must not break the app
  await page.evaluate(() => localStorage.setItem("fg1", JSON.stringify({ it: { "bogus:1": {} }, act: ["nope"], prac: { cRoot: 99 }, rhythm: { bpm: "x" }, regions: ["zz"] })));
  await page.reload();
  await page.waitForSelector(".card");
  check(await page.evaluate(() => __fg.S.act.length > 0 && __fg.S.prac.cRoot === 7 && __fg.S.rhythm.bpm === 80 && __fg.S.regions.length === 0), "damaged save is repaired on load");

  check(errs.length === 0, `no console errors ${errs.join(" | ")}`);
  await page.close();
}
await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED` : "\nall ok");
process.exit(fails.length ? 1 : 0);
