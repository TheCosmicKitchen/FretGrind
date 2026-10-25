# 🎸 Fret Grind

A guitar fretboard and music sight-reading trainer. Spaced-repetition flash cards (staff reading, fretboard
notes, chord shapes, chord/scale spelling, ear training) plus a "follow the score" game. Installable and works offline.

Two practice modes (toggle chip): **Shuffle bag** deals every card in your enabled decks once per round in random order; **Spaced repetition** schedules cards by how well you know them.

**Board regions** (the BOARD chips) cut the neck into Open 1–6, Mid 7–12, High 13–18 and Top 19–24. Pick one or more to practise only those frets: cards are limited to notes that live there, and the fretboard is drawn zoomed to the region (or dimmed outside it if you pick far-apart regions). Open strings are never quizzed.

**Library** tab: every chord type in all 12 keys (about 500 chords, up to 4 voicings each, with fingering diagrams) and 21 scales/modes, shown as sheet music, tab or both, with a Hear-it button. **Practice** tab: play the chosen chord or scale along with a metronome (click, count-in, eighths, up & down) that highlights each note in time. Chord voicings come from [chords-db](https://github.com/tombatossals/chords-db) (MIT, (c) tombatossals), stored in `docs/js/library/chorddb.js`.

**Songs** tab: a graded library of public-domain melodies (level 1 to 3) shown as sheet music, tab or both, with optional lyrics. Play one along with a click: count-in, loop, 50/75/90/100% speed, the current note lights up in the score and the tab, and you can tick songs off as learned. Every melody is public domain everywhere (the composer died before 1926, or the tune is traditional); the notation and tab are our own. Tabs are chosen by a small search that keeps the hand close to where it was and are flagged as not yet checked by hand until someone reviews them.

**Games** tab: *Tap the rhythm* (tap eighth-note patterns on the audio clock, 5 levels, optional count-in, click, listen-first and tap-delay compensation, graded perfect/good/ok with stars) and *Follow the score*. **Flash Cards** are a separate tab from the games.

Static site: no build step, no bundler, no dependencies. The app is native ES modules served as plain files from `docs/`. Progress is stored in your browser's `localStorage`.

## Run locally

```sh
npm run serve   # python3 -m http.server 8765 --directory docs, then open http://localhost:8765
```

Modules need http(s): opening `index.html` as a `file://` page will not load them.

## Tests

```sh
npm test                          # unit tests for the pure modules (node:test, no installs)
node tests/browser/smoke.mjs      # browser smoke test; needs Playwright, with the site served on :8765
```

## Layout (`docs/js`)

| Path | Purpose |
| --- | --- |
| `main.js` | Entry: loads state, wires tabs, keyboard and the service worker |
| `core/store.js` | Saved progress `S` and runtime state `ui` |
| `core/bus.js` | Screens, render, delegated click actions, events |
| `core/theory.js` | Notes, tunings, chord/scale tables, spelling (pure) |
| `core/decks.js` | Decks, board regions, classics |
| `core/audio.js` | Web Audio synth and click |
| `core/pitch.js`, `core/mic.js` | YIN pitch detection (pure) and the microphone hook |
| `view/notation.js`, `view/chrome.js` | SVG staff, fretboard and chord boxes; header and tabs |
| `cards/` | Question builder, scheduler (bag and SRS), Flash Cards page |
| `games/` | Games page, Follow the score, Tap the rhythm (`rhythm-patterns.js` is pure) |
| `library/` | Chord/scale catalog, drawing, metronome, Library and Practice pages |
| `songs/` | Song data and format (`data.js`, `format.js`), tab assignment (`tabify.js`), score drawing (`draw.js`), click-synced player and the Songs page |

`sw.js` keeps an explicit asset list: **add every new file there** (a unit test checks this) and bump `CACHE` when you deploy.

## Adding a song

Add an entry to `docs/js/songs/data.js`. A song is bars of `pitch:length` tokens (see `songs/format.js`): written guitar pitch such as `E5` or `F#4`, and a length in sixteenth notes (4 = quarter, 2 = eighth, 8 = half). Add `=s.f` to a token to fix its string and fret. `npm test` checks every bar adds up, the lyrics match the notes, and the tab is playable for the song's level. Record where the melody comes from in `source`, and only use melodies by composers who died before 1926 or that are traditional.
