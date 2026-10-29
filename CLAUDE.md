# Ash Studio

Browser-based music production PWA (FL Studio-like): step sequencer, piano roll, playlist, mixer, DSP stem separation, WAV/MIDI/project export-import. Vanilla JS ES modules, no build step, no dependencies.

## Run
- Serve over HTTP (service worker needs it): `start.bat` or `python -m http.server 8080` or `npx serve .` then open http://localhost:8080
- No tests/linter configured.

## Structure
- `index.html` – layout; `css/style.css` – theme tokens (light/dark via `data-theme` + prefers-color-scheme)
- `js/app.js` – bootstrap, header/transport, tabs, menu, file ops, keyboard
- `js/state.js` – project model, undo/redo, IndexedDB autosave, (de)serialize
- `js/sequence.js` – pure step/event logic shared by live playback, offline render, MIDI export
- `js/engine.js` – Web Audio: mix graph, instruments (drum/synth/sample), scheduler, offline render
- `js/fileio.js` – WAV encoder, MIDI export/parse, base64, download
- `js/stems.js` + `js/stems-worker.js` – HPSS + stereo-center STFT stem separation in a worker
- `js/generator.js` – seeded song generator (styles, example songs, per-channel randomize)
- `js/ui-*.js` – rack/inspector, piano roll (canvas), playlist, mixer, stems, examples panels
- `sw.js` – network-first cache; bump `CACHE` and update `ASSETS` when adding files

## Rules
- UI text is Turkish; code in English.
- Grid unit = 16th-note step; 1 bar = 16 steps (`BAR` in sequence.js).
- Call `changed(scope)` after mutating `state.project`; scopes `mix|steps|param|notes` skip re-render.
