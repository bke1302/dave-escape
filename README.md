# Dave Escape

A retro pixel-art platformer that runs entirely in a single HTML file — no build step, no dependencies, no backend.

**[Play it now](https://flowopsai.co.il/dave-escape/)**

## Controls

| Key | Action |
|---|---|
| ← / → | Move |
| Space / ↑ | Jump |
| Z | Shoot |

## Features

- Procedurally generated levels — every run is different
- HTML5 Canvas rendering with pixel-art aesthetics (`image-rendering: pixelated`)
- Enemies, shooting, and darkly humorous death messages
- Zero dependencies: one `index.html`, open it and play

## Tech

Vanilla JavaScript + HTML5 Canvas, in a single self-contained file. Deployed via GitHub Pages.

---

## Also in this repo: BLACKJACK MASTER

A full Hebrew (RTL) blackjack learning app — game engine, 15-chapter course, Hi-Lo
card-counting trainers, casino simulation, Monte Carlo simulator and risk analysis.
Installable on iPhone/Android as a PWA and works offline.

**[Play it now](https://bke1302.github.io/dave-escape/blackjack/)** — or add it to your
phone's home screen to run it full-screen and offline.

Source and docs: [`blackjack-master/`](blackjack-master/README.md) ·
Published folder: `blackjack/` (served by GitHub Pages at `/blackjack/`)

```bash
cd blackjack-master && npm run build && npm run serve
```
