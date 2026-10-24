# 🎸 Fret Grind

A guitar fretboard and music sight-reading trainer. Spaced-repetition flash cards (staff reading, fretboard
notes, chord shapes, chord/scale spelling, ear training) plus a "follow the score" game. Installable and works offline.

Two practice modes (toggle chip): **Shuffle bag** deals every card in your enabled decks once per round in random order; **Spaced repetition** schedules cards by how well you know them.

**Board regions** (the BOARD chips) cut the neck into Open 1–6, Mid 7–12, High 13–18 and Top 19–24. Pick one or more to practise only those frets: cards are limited to notes that live there, and the fretboard is drawn zoomed to the region (or dimmed outside it if you pick far-apart regions). Open strings are never quizzed.

Static site: no build step, no dependencies. Progress is stored in your browser's `localStorage`.

## Run locally

```sh
python3 -m http.server 8000   # then open http://localhost:8000
```

(Opening `index.html` directly works for the app, but the service worker needs http://.)

## Layout

| Path | Purpose |
| --- | --- |
| `index.html` | Page shell |
| `css/styles.css` | All styles (theme variables at the top) |
| `js/data.js` | Notes, tunings, chord/scale tables, decks |
| `js/render.js` | SVG staff and fretboard drawing |
| `js/questions.js` | Builds a question from a card key |
| `js/audio.js` | Web Audio synth |
| `js/mic.js` | Microphone pitch detection (YIN) so you can answer cards by playing |
| `js/songs.js` | Themes for the score game |
| `js/games.js` | Score-run game |
| `js/state.js` | Saved progress, spaced-repetition scheduler, card UI |
| `js/main.js` | Click and keyboard handlers, startup |
| `sw.js` | Offline cache (bump `CACHE` when you deploy changes) |

Scripts are plain `<script>` tags sharing globals, so **load order in `index.html` matters**.
