# 🎸 Fret Grind

A guitar fretboard and music sight-reading trainer. Spaced-repetition flash cards (staff reading, fretboard
notes, chord shapes, chord/scale spelling, ear training) plus a "follow the score" game. Installable and works offline.

Two practice modes (toggle chip): **Shuffle bag** deals every card in your enabled decks once per round in random order; **Spaced repetition** schedules cards by how well you know them.

**Board regions** (the BOARD chips) cut the neck into Open 1–6, Mid 7–12, High 13–18 and Top 19–24. Pick one or more to practise only those frets: cards are limited to notes that live there, and the fretboard is drawn zoomed to the region (or dimmed outside it if you pick far-apart regions). Open strings are never quizzed.

**Library** tab: every chord type in all 12 keys (about 500 chords, up to 4 voicings each, with fingering diagrams) and 21 scales/modes, shown as sheet music, tab or both, with a Hear-it button. **Practice** tab: play the chosen chord or scale along with a metronome (click, count-in, eighths, up & down) that highlights each note in time. Chord voicings come from [chords-db](https://github.com/tombatossals/chords-db) (MIT, (c) tombatossals), stored in `docs/js/library/chorddb.js`.

**Songs** tab: a graded library of public-domain melodies (level 1 to 3) shown as sheet music, tab or both, with optional lyrics. Play one along with a click: count-in, loop, 50/75/90/100% speed, the current note lights up in the score and the tab, and you can tick songs off as learned. Every melody is public domain everywhere (the composer died before 1926, or the tune is traditional); the notation and tab are our own. Tabs are chosen by a small search that keeps the hand close to where it was and are flagged as not yet checked by hand until someone reviews them.

**Listening** (microphone, optional, nothing leaves your device): in the Songs player, *Play along* counts you in with a click and then marks every note you play for pitch and timing (on time / early / late / wrong note / missed, with the trouble bars and your average early or late bias), and *Wait for me* lights up one note at a time and moves on when you play it (an octave off still counts). *Tap the rhythm* can also be played by playing or clapping instead of tapping. Use the delay "Measure" button once (speaker beeps, no headphones) so timing is judged against what you hear; on speakers the click stops after the count-in so the microphone does not hear it, with headphones it keeps going. The detector is plain signal processing in `core/listen.js` (no model, no download).

**Games** tab: *Tap the rhythm* (tap eighth-note patterns on the audio clock, 5 levels, optional count-in, click, listen-first and tap-delay compensation, graded perfect/good/ok with stars) and *Follow the score*. **Cards** (flash cards) are a separate tab from the games.

**Learn** tab (the start page): two separate tracks, *Guitar* (G1–G10: playing, tab and folk songs, no staff reading) and *Music theory* (T1–T11: notation, scales, intervals, chords, keys, modes, cadences and form, pop and jazz harmony, and ear training; no guitar-neck lessons), each a course path drawn as a winding map of lesson circles, checkpoint (?) and course-test (★) diamonds. Lessons mix short reading, figures (staff, tab, neck, chords, keys, rhythm), ear questions and quizzes. A daily plan (5, 10 or 20 minutes) picks due reviews (after 3, 14 and 45 days), the next lesson and a quick drill. "No guitar with me" saves play-along steps for later, so lessons work on the train. **★ My review deck:** tap ☆ on any lesson question or flash card (or add everything you missed from a result screen); the Cards tab's *★ My deck* chip then practises only those. Each card links to the lesson that teaches it, and each lesson result links to the matching card decks. **🎯 Drills:** 16 endless practice sets (ear, reading, spelling, harmony, guitar), ten fresh questions per round, plus a mixed round; they never touch your lesson progress. **🎸 Motion drills** (in the Guitar group) generate chord changes, scale runs, or both mixed, on the fly and in time with a built-in metronome: you choose a hand-motion level (1 tiny to 5 huge, scored from how many fingers must land somewhere new, how far the hand shifts, barres, and fret and string jumps for single notes) and a separate rhythm level (how much time each move gets, from one change a bar to syncopated half-beat changes), plus key, scale and chord vocabulary. The score is a heuristic to tune by feel. Courses can list free outside reading under *Go deeper*; all lesson text is original and those are links only. Progress is kept in this browser; copy a save code under *Save or restore your progress* to back it up or move device. Chord charts for folk songs are typical arrangements, and only public-domain songs are named.

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
node tests/browser/listen-e2e.mjs # listening end to end: the mic is replaced by a stream the test fills with claps and notes
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
| `core/pitch.js`, `core/mic.js` | YIN pitch detection (pure) and the Flash Cards microphone hook |
| `core/listen.js` | Note-onset and pitch detector for live playing (pure, tested with synthetic audio) |
| `core/listen-io.js`, `listen-worklet.js`, `listen-ui.js` | Microphone capture on the audio clock, delay calibration, the shared listening panel |
| `view/notation.js`, `view/chrome.js` | SVG staff, fretboard and chord boxes; header and tabs |
| `cards/` | Question builder, scheduler (bag and SRS), Flash Cards page |
| `games/` | Games page, Follow the score, Tap the rhythm (`rhythm-patterns.js` is pure) |
| `library/` | Chord/scale catalog, drawing, metronome, Library and Practice pages |
| `songs/` | Song data and format (`data.js`, `format.js`), tab assignment (`tabify.js`), score drawing (`draw.js`), click-synced player, play-along grading (`grade.js`, pure) and the Songs page |

`sw.js` keeps an explicit asset list: **add every new file there** (a unit test checks this) and bump `CACHE` when you deploy.

## Adding a lesson
Lessons are plain data in `docs/js/courses/guitar/` and `theory/` (one file per course), built with the helpers in `courses/dsl.js` (`read`, `quiz`, `ask`, `card`, `practice`) and registered in `courses/curriculum.js`. Add new files to `docs/sw.js`; `npm test` validates every question, figure and answer index.

## Adding a song

Add an entry to `docs/js/songs/data.js`. A song is bars of `pitch:length` tokens (see `songs/format.js`): written guitar pitch such as `E5` or `F#4`, and a length in sixteenth notes (4 = quarter, 2 = eighth, 8 = half). Add `=s.f` to a token to fix its string and fret. `npm test` checks every bar adds up, the lyrics match the notes, and the tab is playable for the song's level. Record where the melody comes from in `source`, and only use melodies by composers who died before 1926 or that are traditional.
