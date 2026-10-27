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
  // a fake MIDI keyboard for the Piano tab: __midi(0x90, note, velocity) plays it
  await page.addInitScript(() => {
    const input = { name: "Test keys", state: "connected", onmidimessage: null };
    window.__midi = (st, d1, d2) => input.onmidimessage && input.onmidimessage({ data: new Uint8Array([st, d1, d2]) });
    navigator.requestMIDIAccess = () => Promise.resolve({ inputs: new Map([["1", input]]), onstatechange: null });
  });
  await page.goto(base + "/index.html?debug");
  await page.waitForSelector(".ln-wrap, .ln-track, [data-ln-plan]");

  // --- learn tab: the home screen, a whole lesson, the daily plan
  check(await page.evaluate(() => document.querySelector("[data-page=learn]")?.classList.contains("on")), "learn is the first tab");
  check(await page.evaluate(() => document.querySelectorAll(".ln-track").length === 2), "learn home shows both tracks");
  // drive the screen by clicking whatever the lesson asks for, until the result screen shows
  const drive = async (limit = 120) => {
    for (let i = 0; i < limit; i++) {
      const acted = await page.evaluate(() => {
        const q = (sel) => document.querySelector(sel + ":not([disabled])");
        const el = q("[data-ln-ans]") || q("[data-ln-z]") || q("[data-ln-chk]") || q("[data-ln-next]") || q("[data-ln-did]") || q("[data-ln-skip]") || q("[data-ln-cont]") || q("[data-ln-anyway]");
        if (!el) return false;
        if (el.matches("[data-ln-z]") && !document.querySelector(".ln-opts .ok, .fb")) { el.dispatchEvent(new MouseEvent("click", { bubbles: true })); return true; }
        el.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        return true;
      });
      if (!acted) return i;
    }
    return limit;
  };
  await page.click("[data-ln-plan]");
  check(await page.evaluate(() => !!document.querySelector(".ln-step, .ln-q, .ln-run, [data-ln-next], [data-ln-ans]")), "the daily plan opens its first lesson");
  await drive();
  check(await page.evaluate(() => /Lesson|learned|done|Nice|score|%/i.test(document.body.textContent)), "a lesson can be walked from first step to result");
  check(await page.evaluate(() => Object.keys(__fg.S.courses.guitar.les).length + Object.keys(__fg.S.courses.theory.les).length >= 1), "finishing a lesson is saved");
  // drills: open the screen, run a mixed round to the result, go again
  await page.evaluate(() => (document.querySelector("[data-ln-quit]") || document.querySelector("[data-ln-home]"))?.click());
  await page.click("[data-page=learn]");
  await page.evaluate(() => document.querySelector("[data-ln-home]")?.click());
  await page.click("[data-ln-drills]");
  check(await page.evaluate(() => document.querySelectorAll("[data-ln-dgo]").length >= 16), "the Drills screen lists every drill and a mixed round");
  await page.click('[data-ln-dgo="mix"]');
  await drive();
  check(await page.evaluate(() => !!document.querySelector("[data-ln-dgo]") && /DRILL|%|score/i.test(document.body.textContent)), "a drill round reaches its result with Another round");
  await page.evaluate(() => document.querySelector("[data-ln-quit]")?.click());
  // motion drills: setup, a few seconds of generated bars on the audio clock, a live tempo change, stop
  await page.evaluate(() => document.querySelector("[data-ln-quit]")?.click());
  await page.click("[data-page=learn]");
  await page.evaluate(() => document.querySelector("[data-ln-home]")?.click());
  await page.click("[data-ln-drills]");
  await page.click("[data-ln-motion]");
  check(await page.evaluate(() => !!document.querySelector("[data-mo-start]") && document.querySelectorAll("[data-mo-set=motion]").length === 5), "the Motion drills setup shows five motion levels");
  await page.evaluate(() => (__fg.S.mo = { ...__fg.S.mo, countIn: false, bpm: 120 }));
  await page.click('[data-mo-set="content"][data-v="mixed"]');
  await page.click('[data-mo-set="rhythm"][data-v="3"]');
  await page.click("[data-mo-start]");
  await page.waitForFunction(() => document.getElementById("mo-now")?.innerText.trim().length > 1, null, { timeout: 8000 });
  check(await page.evaluate(() => !!document.getElementById("mo-next")?.innerText.trim() && !!document.querySelector("#mo-strip .mo-strip")), "a motion drill shows now, next and the bar");
  await page.click('[data-mo-set="bpm"][data-v="5"]');
  check(await page.evaluate(() => __fg.S.mo.bpm === 125 && !!document.getElementById("mo-now")), "the tempo can change while it plays");
  await page.click("[data-mo-stop]");
  check(await page.evaluate(() => !!document.querySelector("[data-mo-start]")), "stopping returns to the setup");
  await page.evaluate(() => document.querySelector("[data-ln-drills]")?.click());
  await page.evaluate(() => document.querySelector("[data-ln-home]")?.click());
  // review deck: save a lesson question, review it on the Cards tab, and jump back to its lesson
  await page.evaluate(() => (__fg.S.mine = [], __fg.S.onlyMine = 0));
  await page.evaluate(() => { const e = document.createElement("button"); e.setAttribute("data-ln-start", "theory:T1.1"); document.querySelector(".topnav").parentElement.appendChild(e); e.click(); e.remove(); });
  for (let i = 0; i < 40 && !(await page.$("[data-ln-ans]:not([disabled])")); i++) await page.evaluate(() => document.querySelector("[data-ln-next]")?.click());
  await page.click("[data-ln-ans]");
  await page.click("[data-ln-save]");
  check(await page.evaluate(() => __fg.S.mine.length === 1), "a lesson question can be saved to my review deck");
  await page.click("[data-page=cards]");
  await page.click("[data-mine-mode]");
  check(await page.evaluate(() => /MY DECK/.test(document.querySelector(".card .tag")?.textContent || "")), "my deck mode shows saved cards");
  await page.click("[data-learn-lesson]");
  check(await page.evaluate(() => document.querySelector("[data-page=learn]").classList.contains("on") && !!document.querySelector(".ln-card")), "a card links back to its lesson");
  await page.click("[data-ln-quit]");
  await page.evaluate(() => (__fg.S.onlyMine = 0));
  await page.click("[data-ln-home]").catch(() => {});
  await page.click("[data-page=cards]");
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
  // --- songs: list, sheet music and tab, play, highlight, stop, mark learned
  await page.click("[data-page=songs]");
  check((await page.locator(".sg-item").count()) >= 9, "songs: the list shows the library");
  await page.click("[data-song-open=mary]");
  await page.waitForSelector(".sg-svg");
  const counts = await page.evaluate(() => ({ staff: document.querySelectorAll(".sg-n").length, tab: document.querySelectorAll(".sg-t").length }));
  check(counts.staff === 26 && counts.tab === 26, `songs: every note is drawn in staff and tab (${counts.staff}/${counts.tab})`);
  await page.click('[data-sp=view][data-v=tab]');
  check(await page.evaluate(() => document.querySelectorAll(".sg-n").length === 0 && document.querySelectorAll(".sg-t").length === 26), "songs: tab-only view");
  await page.click('[data-sp=view][data-v=both]');
  await page.evaluate(() => { __fg.S.songs.countIn = false; __fg.S.songs.pct = 100; __fg.render(); });
  await page.click("[data-sp=play]");
  await page.waitForFunction(() => document.querySelector(".sg-n.hot"), null, { timeout: 5000 });
  check(true, "songs: playing highlights the current note");
  await page.click("[data-sp=play]");
  check(await page.evaluate(() => !document.querySelector(".sg-n.hot") && /Play/.test(document.querySelector("[data-sp=play]").textContent)), "songs: stop clears the highlight");
  await page.click("[data-sp=done]");
  check(await page.evaluate(() => !!__fg.S.songs.done.mary), "songs: mark as learned");
  await page.click("[data-sp=play]"); // leave the tab while playing: it must stop
  await page.click("[data-page=cards]");
  await page.waitForTimeout(300);
  await page.click("[data-page=songs]");
  check(await page.evaluate(() => /Play/.test(document.querySelector("[data-sp=play]").textContent)), "songs: leaving the tab stops playback");

  await page.evaluate(() => localStorage.setItem("fg1", JSON.stringify({ it: { "bogus:1": {} }, act: ["nope"], prac: { cRoot: 99 }, rhythm: { bpm: "x" }, regions: ["zz"] })));
  await page.reload();
  await page.click("[data-page=cards]");
  await page.waitForSelector(".card");
  check(await page.evaluate(() => __fg.S.act.length > 0 && __fg.S.prac.cRoot === 7 && __fg.S.rhythm.bpm === 80 && __fg.S.regions.length === 0), "damaged save is repaired on load");

  // --- piano: connect a MIDI keyboard, walk a lesson with a wrong note and an octave slip, a chord, and Cards
  await page.click("[data-page=piano]");
  check((await page.locator("[data-pn=open]").count()) >= 27, "piano: the lesson list shows every lesson");
  await page.click("[data-pn=connect]");
  await page.waitForFunction(() => /Test keys/.test(document.getElementById("pn-conn")?.textContent || ""));
  await page.evaluate(() => [60, 64, 67].forEach((m) => __midi(0x90, m, 100)));
  check(/C4 · E4 · G4\s+→\s+C/.test(await page.textContent("#pn-free")), "piano: held MIDI notes are shown and named as a chord");
  await page.evaluate(() => [60, 64, 67].forEach((m) => __midi(0x80, m, 0)));
  await page.click('[data-pn=open][data-pn-arg=cde]');
  await page.click("[data-pn=start]");
  await page.evaluate(() => (__midi(0x90, 65, 90), __midi(0x80, 65, 0), __midi(0x90, 72, 90), __midi(0x80, 72, 0)));
  check(/octave/.test(await page.textContent("#pn-msg")), "piano: the right note in the wrong octave gets a hint");
  await page.evaluate(() => [60, 62, 64, 64, 62, 60, 62, 64, 60, 64, 62, 60].forEach((m) => (__midi(0x90, m, 90), __midi(0x80, m, 0))));
  check(await page.evaluate(() => /passed/i.test(document.body.textContent) && __fg.S.piano.done.cde.best === 92), "piano: a lesson finishes and saves its score (one wrong note = 92%)");
  await page.click('[data-pn=exit]');
  await page.click('[data-pn=open][data-pn-arg=triads]');
  await page.click("[data-pn=start]");
  await page.evaluate(() => [60, 64].forEach((m) => __midi(0x90, m, 90)));
  check(/STEP 1 \//.test(await page.textContent(".tag")), "piano: a chord waits until every note is held");
  await page.evaluate(() => __midi(0x90, 67, 90));
  check(/STEP 2 \//.test(await page.textContent(".tag")), "piano: holding the whole chord moves on");
  await page.evaluate(() => [60, 64, 67].forEach((m) => __midi(0x80, m, 0)));
  await page.keyboard.down("a");
  check(await page.waitForFunction(() => !!document.querySelector(".pk.wr, .pk.gd, .pk.oc"), null, { timeout: 3000 }).then(() => true, () => false), "piano: computer keys play notes");
  await page.keyboard.up("a");
  await page.click("[data-page=cards]");
  check(await page.evaluate(() => !__fg.ui.cur?.q.mic || !!document.getElementById("midi-note")), "cards: a connected MIDI keyboard can answer");

  check(errs.length === 0, `no console errors ${errs.join(" | ")}`);
  await page.close();
}
await browser.close();
console.log(fails.length ? `\n${fails.length} FAILED` : "\nall ok");
process.exit(fails.length ? 1 : 0);
