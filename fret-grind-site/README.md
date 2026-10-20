# 🎸 Fret Grind

A guitar fretboard and music sight-reading trainer. Spaced-repetition flash cards (staff reading, fretboard
notes, chord shapes, chord/scale spelling, ear training) plus a "follow the score" game. Installable and works offline.

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
| `js/songs.js` | Themes for the score game |
| `js/games.js` | Score-run game |
| `js/state.js` | Saved progress, spaced-repetition scheduler, card UI |
| `js/main.js` | Click and keyboard handlers, startup |
| `sw.js` | Offline cache (bump `CACHE` when you deploy changes) |

Scripts are plain `<script>` tags sharing globals, so **load order in `index.html` matters**.
