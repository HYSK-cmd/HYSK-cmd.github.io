# hysk-cmd.github.io

Personal site for **Hoon Yang** — Computer Engineering, UC Irvine.

Served by GitHub Pages straight from `main` at the repository root. No build
step, no dependencies, no framework: plain HTML, five stylesheets and six
scripts that the browser loads directly.

## Structure

```
.
├── index.html            the markup, split into commented sections
├── styles/
│   ├── base.css          colour tokens, typefaces, page shell
│   ├── stage.css         the canvas at the top and the project panel over it
│   ├── hero.css          portrait, name, link row, typed tagline
│   ├── work.css          the My Work heading, carousel and cards
│   └── responsive.css    everything that changes under 680px
├── js/
│   ├── core.js           palette, seeded random, the 3D projector
│   ├── scenes.js         one drawing function per project
│   ├── network.js        the forward-pass diagram behind the hero
│   ├── work.js           THE CONTENT — one entry per project
│   ├── carousel.js       builds the cards, auto-advances the track
│   └── app.js            open/close a project, the tagline, the loop
└── assets/
    ├── selfie.jpg        portrait in the hero
    ├── resume.pdf        linked from the hero
    ├── aerolance-research.pdf
    └── spider-bot.pdf
```

## Where to change what

| I want to change | Open |
| --- | --- |
| a project's title, blurb, stack chips or links | `js/work.js` |
| which 3D scene a project shows, or its camera angle | `js/work.js` (`draw`, `yaw`, `pitch`) |
| how much of the frame a scene fills | `js/work.js` (`fit`) |
| a project's colour, on its card and in its scene | `js/work.js` (`hue`) |
| how a 3D scene is drawn | `js/scenes.js` |
| the network shape or its colours | `js/network.js` (`WIDTHS`, `HOP`) |
| name, degree lines, the four `<.../>` lines, the link row | `index.html` |
| the typed tagline | bottom of `js/app.js` (`TAGLINE`) |
| how fast the carousel moves | `js/carousel.js` (`HOLD`) |
| any colour or typeface | `styles/base.css` |

## How the pieces talk to each other

Every script wraps itself in an IIFE and hangs what the others need on one
global, `window.PF`. Each file destructures what it uses at the top, so the
imports are visible in the first few lines. `index.html` loads them in
dependency order, and that order matters — `work.js` needs the scene functions,
`app.js` needs everything.

The 3D is hand-rolled. `project([x, y, z], cam, W, H, zoom)` in `core.js` is the
whole engine: rotation by the camera's `yaw` and `pitch`, then a perspective
divide. No library, nothing to install. Cameras are fixed — in every scene the
thing that moves is the scene, not the viewpoint.

Every scene is drawn twice, full-bleed on the stage and small inside a card, and
those two frames differ by roughly two and a half times. `project()` scales the
geometry with the canvas, but the flat details a scene paints on top — a figure,
a lens, a checkbox — are plain CSS pixels and would not. So each scene opens with

```js
const u = unit(W, H), px = n => n * u;
const A = cam.hue || C.a;
```

`px(n)` is how every flat constant is written, and `A` is the project's own
colour from `work.js`, which is why a card and its scene are the same colour.
`C.b` (amber) stays the shared "happening now" colour in all eight.

## Previewing

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

Use a server rather than opening `index.html` directly — separate CSS and JS
files need `http://`, not `file://`.

## Deploying

Commit and push to `main`. GitHub Pages redeploys within a minute.
