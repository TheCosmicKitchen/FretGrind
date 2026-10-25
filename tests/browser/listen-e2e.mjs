/* Listening end to end in a real browser: the microphone is replaced by a stream that the test fills with claps at exact
   audio-clock times, so the whole path (worklet -> detector -> latency -> grading) is measured.
   Start the site first:  npm run serve   then:  node tests/browser/listen-e2e.mjs [http://localhost:8765] */
import { chromium } from "playwright";

const base = process.argv[2] || "http://localhost:8765",
  fails = [];
const check = (ok, what) => {
  console.log((ok ? "  ok  " : "  FAIL ") + what);
  if (!ok) fails.push(what);
};
const browser = await chromium.launch({ args: ["--autoplay-policy=no-user-gesture-required"] });
const page = await browser.newPage({ viewport: { width: 420, height: 900 } }),
  errs = [];
page.on("pageerror", (e) => errs.push(e.message));
page.on("console", (m) => m.type() === "error" && errs.push(m.text()));
await page.addInitScript(() => {
  navigator.mediaDevices.getUserMedia = async () => {
    const c = window.__fg.audioCtx(),
      d = c.createMediaStreamDestination();
    window.__dest = d;
    return d.stream;
  };
});
await page.goto(base + "/index.html?debug");
await page.click("[data-page=cards]");
await page.waitForSelector(".card .prompt");

// pure helper used from the page
const clapAt = (lateMs) =>
  page.evaluate(async (lateMs) => {
    const { onsets } = await import("/js/games/rhythm-patterns.js");
    const { run } = __fg.rhythmDebug(),
      c = __fg.audioCtx(),
      spb = run.spb;
    const b = c.createBuffer(1, 4410, c.sampleRate),
      d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = 0.6 * (Math.random() * 2 - 1) * Math.exp(-i / 500);
    onsets(run.pattern).forEach((s) => {
      const src = c.createBufferSource();
      src.buffer = b;
      src.connect(window.__dest);
      src.start(run.playStart + (s * spb) / 2 + lateMs / 1000);
    });
    return onsets(run.pattern).length;
  }, lateMs);

let base0 = null;
async function round(lateMs, label) {
  await page.evaluate(() => {
    Object.assign(__fg.S.rhythm, { level: 3, bpm: 100, countIn: false, listen: false, click: false, input: "mic" });
    __fg.S.listen.latency = 0;
    __fg.openPage("games");
  });
  if (!(await page.evaluate(() => document.querySelector(".ls-panel .tg.a")))) await page.click("[data-ls-toggle]");
  await page.waitForSelector(".ls-panel .tg.a");
  await page.waitForTimeout(500); // the listener learns the room
  await page.click("[data-rh-start]");
  await page.waitForFunction(() => __fg.rhythmDebug().run?.playStart);
  const n = await clapAt(lateMs);
  await page.waitForFunction(() => __fg.rhythmDebug().run?.result, null, { timeout: 15000 });
  const r = await page.evaluate(() => {
    const x = __fg.rhythmDebug().run.result;
    return { acc: x.g.accuracy, bias: x.bias, extras: x.g.extras.length, hit: x.g.notes.filter((n) => n.delta !== null).length };
  });
  check(r.hit === n, `${label}: all ${n} claps heard and matched (got ${r.hit})`);
  check(r.extras === 0, `${label}: no stray notes`);
  // the test stream itself adds a fixed delay (a few audio blocks), so timing is judged against the on-the-beat round
  if (base0 === null) base0 = r.bias;
  check(Math.abs(r.bias - base0 - lateMs) < 15, `${label}: read ${Math.round(r.bias - base0)} ms vs the beat (played ${lateMs} ms late)`);
  await page.evaluate(() => document.querySelector("[data-rh-exit]").click());
}

console.log("rhythm game with the microphone");
await round(0, "on the beat");
await round(40, "40 ms late");
await round(-30, "30 ms early");

// ---- songs: play along and wait for me, with synthetic plucked notes in the stream
const pluckInPage = () =>
  page.evaluate(() => {
    window.__pluck = (freq, secs = 0.6) => {
      const c = __fg.audioCtx(),
        n = Math.round(c.sampleRate * secs),
        dl = Math.round(c.sampleRate / freq),
        line = new Float32Array(dl),
        b = c.createBuffer(1, n, c.sampleRate),
        out = b.getChannelData(0);
      for (let i = 0; i < dl; i++) line[i] = Math.random() * 2 - 1;
      let p = 0;
      for (let i = 0; i < n; i++) {
        const a = line[p], q = line[(p + 1) % dl];
        out[i] = a * 0.5;
        line[p] = 0.996 * 0.5 * (a + q);
        p = (p + 1) % dl;
      }
      return b;
    };
    window.__play = (written, when) => {
      const c = __fg.audioCtx(), src = c.createBufferSource();
      src.buffer = window.__pluck(440 * Math.pow(2, (written - 12 - 69) / 12));
      src.connect(window.__dest);
      src.start(when);
    };
  });
await pluckInPage();
console.log("songs: play along");
await page.evaluate(() => {
  __fg.S.listen.latency = 0;
  Object.assign(__fg.S.songs, { cur: "joy", mode: "along", pct: 100, countIn: true });
  __fg.openPage("songs");
});
await page.waitForSelector(".sg-wrap");
if (!(await page.evaluate(() => document.querySelector(".ls-panel .tg.a")))) await page.click("[data-ls-toggle]");
await page.waitForSelector(".ls-panel .tg.a");
await page.waitForTimeout(500);
await page.click('[data-sp="play"]');
await page.waitForFunction(() => document.querySelector('[data-sp="play"]')?.textContent.includes("Stop"));
const plan = await page.evaluate(async () => {
  const { SONGS } = await import("/js/songs/data.js"), { build } = await import("/js/songs/format.js"), { songClock } = await import("/js/songs/player.js");
  const s = build(SONGS.find((x) => x.id === __fg.S.songs.cur)), ck = songClock(s);
  const out = s.sounding.map((n, i) => ({ i, m: n.midi, t: ck.due[i] }));
  // play it with: note 2 late by 120 ms, note 3 wrong (a fifth up), note 5 left out, the rest on time
  out.forEach((o) => {
    if (o.i === 5) return;
    window.__play(o.i === 3 ? o.m + 7 : o.m, o.t + (o.i === 2 ? 0.12 : 0.01));
  });
  return out.length;
});
await page.waitForSelector(".sg-res", { timeout: 40000 });
const states = await page.evaluate(() => {
  const o = {};
  document.querySelectorAll(".sg-svg .sg-n").forEach((e) => {
    const c = [...e.classList].find((x) => x.startsWith("res-"));
    if (c) o[e.dataset.n] = c.slice(4);
  });
  return o;
});
const st = (i) => states[i];
check(Object.keys(states).length === plan, `play along: ${plan} notes get a mark`);
check(st(0) === "ok" && st(1) === "ok", "play along: notes played on time are marked ok");
check(st(2) === "late", `play along: the late note is marked late (${st(2)})`);
check(st(3) === "wrong", `play along: the wrong note is marked wrong (${st(3)})`);
check(st(5) === "miss", `play along: the left-out note is marked missed (${st(5)})`);
check(["ok"].includes(st(plan - 1)), "play along: the last note is ok");
check((await page.textContent(".sg-res")).includes("in bar"), "play along: result names the trouble bars");

console.log("songs: wait for me");
await page.evaluate(() => { __fg.S.songs.mode = "wait"; __fg.render(); });
await page.click('[data-sp="play"]');
await page.waitForFunction(() => document.querySelector("#sg-say")?.textContent.includes("1 of"));
const w = await page.evaluate(async () => {
  const { SONGS } = await import("/js/songs/data.js"), { build } = await import("/js/songs/format.js");
  const s = build(SONGS.find((x) => x.id === __fg.S.songs.cur));
  return s.sounding.slice(0, 4).map((n) => n.midi);
});
const hotIdx = () => page.evaluate(() => document.querySelector(".sg-n.hot")?.dataset.n);
check((await hotIdx()) === "0", "wait: the first note is lit");
await page.evaluate((m) => window.__play(m + 5, __fg.audioCtx().currentTime + 0.05), w[0]); // wrong note
await page.waitForTimeout(900);
check((await hotIdx()) === "0" && (await page.textContent("#sg-say")).includes("not quite"), "wait: a wrong note does not move the song on");
await page.evaluate((m) => window.__play(m, __fg.audioCtx().currentTime + 0.05), w[0]);
await page.waitForFunction(() => document.querySelector(".sg-n.hot")?.dataset.n === "1", null, { timeout: 5000 }).then(() => check(true, "wait: the right note moves the song on"), () => check(false, "wait: the right note moves the song on"));
await page.evaluate((m) => window.__play(m + 12, __fg.audioCtx().currentTime + 0.05), w[1]); // octave up still counts
await page.waitForFunction(() => document.querySelector(".sg-n.hot")?.dataset.n === "2", null, { timeout: 5000 }).then(() => check(true, "wait: an octave off still counts"), () => check(false, "wait: an octave off still counts"));
await page.click('[data-sp="play"]');
check(await page.evaluate(() => !document.querySelector(".sg-n.hot")), "wait: Stop clears the lit note");

check(await page.evaluate(() => document.querySelector(".ls-panel") !== null), "listening panel shows in the menu");
await page.evaluate(() => __fg.openPage("cards"));
await page.waitForTimeout(100);
check(await page.evaluate(async () => !(await import("/js/core/listen-io.js")).listen.on), "microphone is released when leaving the Games tab");
check(errs.length === 0, "no console errors" + (errs.length ? ": " + errs.join(" | ") : ""));
await browser.close();
if (fails.length) {
  console.log(`\n${fails.length} failed`);
  process.exit(1);
}
console.log("\nall good");
