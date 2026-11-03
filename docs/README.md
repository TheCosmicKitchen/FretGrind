# 🎸 Fret Grind

A guitar fretboard and music sight-reading trainer. Spaced-repetition flash cards (staff reading, fretboard
notes, chord shapes, chord/scale spelling, ear training) plus a "follow the score" game. Installable and works offline.

Two practice modes (toggle chip): **Shuffle bag** deals every card in your enabled decks once per round in random order; **Spaced repetition** schedules cards by how well you know them.

**Board regions** (the BOARD chips) cut the neck into Open 1–6, Mid 7–12, High 13–18 and Top 19–24. Pick one or more to practise only those frets: cards are limited to notes that live there, and the fretboard is drawn zoomed to the region (or dimmed outside it if you pick far-apart regions). Open strings are never quizzed.

**Library** tab: every chord type in all 12 keys (about 500 chords, up to 4 voicings each, with fingering diagrams) and 21 scales/modes, shown as sheet music, tab or both, with a Hear-it button. **Practice** tab: play the chosen chord or scale along with a metronome (click, count-in, eighths, up & down) that highlights each note in time. Chord voicings come from [chords-db](https://github.com/tombatossals/chords-db) (MIT, (c) tombatossals), stored in `docs/js/library/chorddb.js`.

**Songs** tab: a searchable library of about 2,500 public-domain pieces (levels 1 to 6) shown as sheet music, tab or both: classical guitar from the Mutopia Project (Bach, Carcassi, Sor, Tárrega, Fauré, Brahms, Matiegka and more), fiddle tunes from Ryan's Mammoth Collection (1883), Irish music from O'Neill's Music of Ireland (1903), art songs from [OpenScore Lieder](https://github.com/OpenScore/Lieder) (CC0; please keep this credit), and a few folk songs and classical themes entered by hand. Filter by style and level or search by title or composer. Play one along with a click: count-in, loop, 50/75/90/100% speed, and two ways of following along. *Page* keeps the playing line high in the view, moves the next line into place before you reach it and fades what you have played. *Lane* slides the music through a fixed view past a lane that stands still and cuts through the tab numbers, like a rhythm game. Every tune is public domain, each piece credits its source, and tabs are chosen by a small search that keeps the hand close to where it was and are flagged as not yet checked by hand. Classical pieces come from the score's MIDI, so all voices are written on one line and a held bass can show shorter than it rings.

**The song path** is the heart of the app. Songs are graded by how hard they are to play, and the guitar path has a stage beside each course (G1 to G10), so songs appear as stops on the course map and in the daily plan. Any piece can be learned part by part: it is cut into phrases of whole bars (a repeat is learned once), and each part goes Listen, Note by note, In time, then joins the part before it, ending with the whole piece at 75% and at full speed for up to three stars. Pieces can be played without a microphone by moving on by hand. See `songs/path.js`.

**Levels and the syllabus**: a piece's level is its hardest demand (`songs/demands.js`): left-hand position, rhythm, notes held together, or key, with length counting for one step. Speed stays out, because lessons set the speed. `tools/syllabus.mjs` then builds the path from the music: each stage says what a piece may ask, and songs are picked so each adds a skill or two, followed by one that plays them in.

`tools/audit.mjs` is an adversarial pass over everything a learner meets, and runs as a test, so a piece with no music in it, a lesson step on one note, or a stage that breaks its promise fails the build. `tools/tune-harmony.mjs` scores the worked-out chords against composers' real left hands and tunes the weights, on songs held back from the tuning.

**Repertoire**: a finished piece isn't over. It lands in My repertoire and comes back in the daily plan after 2 days, then 7, 21, 60 and 150 while it stays solid, and sooner if it slips. One play-through is all it takes.

**Today's practice**: one button on the Learn tab, for 5, 10, 20 or 30 minutes. It goes first to what would otherwise be lost, then to moving on, and plays in the order a session should run: a chord change to warm up, your latest trouble spots, the next lesson of the next piece, speed work, the pieces due back, and something easy to finish on. Each step leads straight to the next, and a strip on every page lets you skip a step or stop. See `songs/session.js`.

**Fix it and the speed trainer**: after a run, the bars that went worst get a Fix button. It plays them, finds wrong notes with no clock, loops them up to speed, and puts them back between their neighbours. The loop runs by itself so the hands stay on the guitar: clean runs raise the speed, two bad ones lower it, and it stops by itself after a set number of runs. The speed trainer is the same loop on a whole piece, and it remembers your fastest clean speed. Without a microphone it steps up with the click instead. Trouble spots from real run-throughs are kept for your next practice. See `songs/fix.js`.

**Grooves**: scale and chord drills made up fresh every take, under Songs → Exercises. Chord grooves move through a major key, a minor key or sevenths in four-bar phrases that end on the cadences you pick (perfect, plagal, half, deceptive); the chords change every bar, twice a bar, or at mixed times with some pushed an eighth early, and the right hand strums, splits bass and strum, or picks, in straight, syncopated or sixteenth-note rhythms that can change every phrase or every bar. Scale grooves run through one hand position in mixed, syncopated or sixteenth rhythms, by step, with skips, or in sequences, in two-bar phrases that land on the fifth and then home. With Loop on, the next take follows on the beat, after a bar of count-in to read it or straight on. See `songs/groove.js`.

**Chord changes**: every change between the common open chords is sized by how far the hand moves (Small, Medium, Big, Leaps). The app recommends the ones real pieces use most, drops the ones you've mastered, and can generate a fresh run of changes at any size.

**Chords**: most of the library is bare melody, so `songs/harmony.js` works out suggested chords from each tune, using the fewest that fit. `songs/changes.js` turns them into lessons: drill the changes that song really uses, then play its chords with its tune behind you, moved to easier open shapes with a capo where that helps.

**Lessons**: every piece is cut into real phrases (`core/phrases.js`): it finds where the music breathes, learns a repeat once, and spots a phrase that nearly repeats. Phrases group into short lessons that open by recalling the last one and close by running everything so far, then a final lesson brings the whole piece up to speed. Piano pieces build the same way.

**Skills**: phrases mined from the whole library that show one technique clearly (scale runs, arpeggios, triplets, syncopation, position shifts and more), each opening as a short drill inside its piece. Library tunes also carry a speed, so you can filter by Slow, Moderate or Fast.

**Piano pieces**: 126 two-handed public-domain pieces from the Mutopia Project (Bach, Burgmüller, Czerny, Chopin, Joplin and more), graded into six stages. Each part goes right hand, left hand, hands together, and the piece finishes read from the score, with upcoming notes on the staff. They run on the same lesson player as the piano lessons (`piano/songs.js`).

**Exercises** (a style in the Songs tab): scale patterns in one hand position (11 scales, 12 keys, six patterns, seven positions, four rhythms) and chord changes (eight progressions from I–IV–V to the 12-bar blues and the circle of fifths, as open or barre shapes, held, strummed or picked). Voicings are chosen so the hand moves as little as it can. An exercise is an ordinary song, so Play along, Wait for me and both follow views all work.

**Listening** (microphone, optional, nothing leaves your device): in the Songs player, *Play along* counts you in with a click and then marks every note you play for pitch and timing (on time / early / late / wrong note / missed, with the trouble bars and your average early or late bias), and *Wait for me* lights up one note at a time and moves on when you play it (an octave off still counts). *Tap the rhythm* can also be played by playing or clapping instead of tapping. Use the delay "Measure" button once (speaker beeps, no headphones) so timing is judged against what you hear; on speakers the click stops after the count-in so the microphone does not hear it, with headphones it keeps going. The detector is plain signal processing in `core/listen.js` (no model, no download).

**Cards**: flash cards are their own area, separate from the courses, with a home screen of decks and mastery and a full-screen study session.

**Games** (in Music): *Tap the rhythm* (tap eighth-note patterns on the audio clock, 5 levels, optional count-in, click, listen-first and tap-delay compensation, graded perfect/good/ok with stars) and *Follow the score*.

**Piano** tab: 27 step-by-step piano lessons (finding the keys, first melodies, reading treble and bass clef, scales, chords and inversions, hands together, ear training) that listen to a USB or Bluetooth **MIDI keyboard** through Web MIDI (Chrome, Edge, Firefox; not Safari or iOS). Each step shows the notes on a grand staff and an on-screen keyboard; keys turn green, red, or orange (right note, wrong octave) as you play, and chords pass when every note is held together. *Any octave* helps on small keyboards, and the app can sound your keys if the keyboard has no speakers. No keyboard? The computer keys A–K (Z/X change octave) and the drawn keys work too. Once connected, the MIDI keyboard also answers the Cards that accept a played note. Lessons are plain data in `docs/js/piano/lessons.js`.

**Tuner** tab: a normal tuner, plus *Sample my strings*, which asks for each open string and treats however it sounds as correct. Every microphone feature (Cards, Tabs, Wait for me, Play along) then judges notes relative to the guitar as it is, so it does not have to be in tune. A string can be up to three semitones from standard (`MAX_DETUNE` in `core/pitch.js`), which covers drop and open tunings; anything further is taken as the wrong string, so the A string can never be saved as a very sharp low E. Without a sample, Cards and Tabs still allow a note to be up to 70 cents out.

**Tabs** tab: upload or paste a text tab (six lines of dashes and fret numbers) and the microphone follows you through it note by note, with the note to play at a fixed lane and two rows of what comes next. Chords, two-digit frets, bends, drop tunings, capo and multiple sections are read; text tabs rarely give rhythm, so it goes at your speed. Tabs stay in this browser.

**Learn** tab (the start page): two separate tracks, *Guitar* (G1–G10: playing, tab and folk songs, no staff reading) and *Music theory* (T1–T11: notation, scales, intervals, chords, keys, modes, cadences and form, pop and jazz harmony, and ear training; no guitar-neck lessons), each a course path drawn as a winding map of lesson circles, checkpoint (?) and course-test (★) diamonds. Lessons mix short reading, figures (staff, tab, neck, chords, keys, rhythm), ear questions and quizzes. "No guitar with me" swaps today's practice for a study plan of due reviews (after 3, 14 and 45 days), the next lesson and a quick drill, and saves play-along steps for later, so lessons work on the train. **★ My review deck:** tap ☆ on any lesson question or flash card (or add everything you missed from a result screen); the Cards tab's *★ My deck* chip then practises only those. Each card links to the lesson that teaches it, and each lesson result links to the matching card decks. **🎯 Drills:** 16 endless practice sets (ear, reading, spelling, harmony, guitar), ten fresh questions per round, plus a mixed round; they never touch your lesson progress. **🎸 Motion drills** (in the Guitar group) generate chord changes, scale runs, or both mixed, on the fly and in time with a built-in metronome: you choose a hand-motion level (1 tiny to 5 huge, scored from how many fingers must land somewhere new, how far the hand shifts, barres, and fret and string jumps for single notes) and a separate rhythm level (how much time each move gets, from one change a bar to syncopated half-beat changes), plus key, scale and chord vocabulary. The score is a heuristic to tune by feel. Courses can list free outside reading under *Go deeper*; all lesson text is original and those are links only. Progress is kept in this browser; the save code under *Save or restore your progress* holds all of it (songs, lessons, repertoire, cards and settings, but not this device's microphone settings), to back it up or move device. The screen stays on wherever you might be playing. Chord charts for folk songs are typical arrangements, and only public-domain songs are named.

Static site: no build step, no bundler, no dependencies. The app is native ES modules served as plain files from `docs/`. Progress is stored in your browser's `localStorage`.

## Design

Five areas (Learn, Music, Cards, Chords, Tuner), listed in `view/chrome.js`: a sidebar on wide screens, a tab bar on phones, sub-tabs inside an area. Page ids stay flat, so moving a page between areas is a one-line change. The frame steps aside during lessons and while following a score.

The look lives in the tokens at the top of `css/styles.css`: indigo on cool neutrals, light and dark, one accent. Use the tokens rather than new colours (`--on-ac` is the text colour on the accent), keep surfaces flat, and give each screen one primary action (`.go`). Icons are inline SVG, not emoji.

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
| `core/pitch.js`, `core/mic.js` | YIN pitch detection and note matching relative to the guitar's tuning (pure), and the microphone hook for Cards, Tuner and Tabs |
| `core/listen.js` | Note-onset and pitch detector for live playing (pure, tested with synthetic audio) |
| `core/listen-io.js`, `listen-worklet.js`, `listen-ui.js` | Microphone capture on the audio clock, delay calibration, the shared listening panel |
| `view/notation.js`, `view/chrome.js` | SVG staff, fretboard and chord boxes; header and tabs |
| `cards/` | Question builder, scheduler (bag and SRS), Flash Cards page |
| `games/` | Games page, Follow the score, Tap the rhythm (`rhythm-patterns.js` is pure) |
| `library/` | Chord/scale catalog, drawing, metronome, Library and Practice pages |
| `piano/` | Piano lessons (`lessons.js`, pure data and helpers), Web MIDI input (`midi.js`) and the Piano page |
| `tuner/` | Tuner and string sampling (saved as `S.tuning`) |
| `tabs/` | Text tab parser (`parse.js`, pure) and the Tabs page |
| `songs/` | Song data and format (`data.js`, `format.js`), tab assignment (`tabify.js`), score drawing and follow-along geometry (`draw.js`), the generated exercises (`exercises.js`), the imported library's loader (`library.js`), click-synced player, play-along grading (`grade.js`, pure) and the Songs page |

`sw.js` keeps an explicit asset list: **add every new file there** (a unit test checks this) and bump `CACHE` when you deploy. The library's chunks in `docs/lib/` are left out on purpose, so a first visit stays small: a chunk is cached the first time a tune in it is opened.

## Adding a lesson
Lessons are plain data in `docs/js/courses/guitar/` and `theory/` (one file per course), built with the helpers in `courses/dsl.js` (`read`, `quiz`, `ask`, `card`, `practice`) and registered in `courses/curriculum.js`. Add new files to `docs/sw.js`; `npm test` validates every question, figure and answer index.

## Adding a song

Add an entry to `docs/js/songs/data.js`. A song is bars of `pitch:length` tokens (see `songs/format.js`): written guitar pitch such as `E5` or `F#4`, and a length in sixteenth notes (4 = quarter, 2 = eighth, 8 = half, 4/3 = triplet eighth). Join pitches with `+` for a chord. Add `=s.f` to a token to fix its string and fret. `npm test` checks every bar adds up, the lyrics match the notes, and the tab is playable for the song's level. Record where the melody comes from in `source`, and only use melodies by composers who died before 1926 or that are traditional.

## Rebuilding the library

`docs/lib/`, `songs/path-data.js` and `piano/path-data.js` are generated by `tools/import-music.mjs` from ABC and MIDI sources (see the top of that file). Edit the stages there, not in the generated files. Only Mutopia pieces marked Public Domain are used: its Creative Commons encodings are left out. A tune that can't be written faithfully is skipped, not bent to fit. Run the importer again after changing how tunes are graded.
