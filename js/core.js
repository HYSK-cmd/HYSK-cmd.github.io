/* core.js
   The shared bits every other script leans on: the palette, a seeded random
   so the scenes look the same on every load, the 3D projector, and the
   canvas sizing helper.
   
   project([x, y, z], cam, W, H, zoom, spread) maps a point in scene space to
   screen space. cam is { yaw, pitch } plus optional framing (spread, offX,
   offY). There is no 3D library here — this function is the whole engine. */

window.PF = window.PF || {};
(function (PF) {
  "use strict";

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const C = { text:"#e6ecf5", dim:"#5d6b7d", line:"#1c2733", a:"#8ab4f8", b:"#f0b849", void:"#070a0f" };

  let seed = 20260916;
  const rnd = () => (seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296;

  /* ── shared 3D ───────────────────────────── */
  function project(p, cam, W, H, zoom, spread = 0.46) {
    const cy = Math.cos(cam.yaw),   sy = Math.sin(cam.yaw);
    const cp = Math.cos(cam.pitch), sp = Math.sin(cam.pitch);
    let x = p[0] * cy - p[2] * sy;
    let z = p[0] * sy + p[2] * cy;
    let y = p[1] * cp - z * sp;
    z = p[1] * sp + z * cp;
    const depth = z + 3.6;
    const k = zoom / depth;
    // A cam may carry its own framing — the stage uses it to enlarge a scene
    // and push it clear of the text panel. Glyph cams leave these unset.
    const s = Math.min(W, H) * (cam.spread ?? spread);
    return {
      x: W / 2 + (cam.offX ?? 0) * W + x * k * s,
      y: H / 2 + (cam.offY ?? 0) * H - y * k * s,
      k, depth,
    };
  }

  function fitCanvas(cv) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const r = cv.getBoundingClientRect();
    cv.width = Math.max(1, Math.round(r.width * dpr));
    cv.height = Math.max(1, Math.round(r.height * dpr));
    const ctx = cv.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { ctx, W: r.width, H: r.height };
  }

  const rgba = (hex, a) => {
    const h = hex.slice(1);
    return `rgba(${parseInt(h.slice(0,2),16)},${parseInt(h.slice(2,4),16)},${parseInt(h.slice(4,6),16)},${a})`;
  };

  /* shared easing helpers used by multiple scenes */
  const ease = u => u * u * (3 - 2 * u);
  const span = (c, a, b) => Math.min(1, Math.max(0, (c - a) / (b - a)));

  /* Every scene is drawn twice at very different sizes: once full-bleed on the
     stage, once inside a carousel card. project() scales scene-space geometry
     with the canvas, but the flat details each scene draws on top — a figure, a
     lens, a checkbox — are plain CSS pixels and would stay the same size in both
     frames, reading as specks on the stage and as clutter on a card.

     unit(W, H) is the factor those constants are written against. REF is the
     card canvas's short side at 3-up desktop, so a card draws at 1.0 and keeps
     exactly the size it has today; the stage grows from there. The clamp stops
     a very small or very tall canvas from running away with it. */
  const REF = 230;
  const unit = (W, H) => Math.min(2.2, Math.max(0.85, Math.min(W, H) / REF));

  /* One zoom for every scene. How much of the frame a particular scene fills is
     a property of that scene, so it is set per project in work.js (`fit`), not
     by each draw function quietly picking its own zoom. */
  const ZOOM = 2.5;

  /* depth fog: returns a function that maps a projected k value to
     a 0.55..1 factor where 1 = nearest. Gives glyph scenes the same
     sense of depth that the hero network already has. */
  function fogMaker(projArr) {
    let minK = Infinity, maxK = -Infinity;
    for (let i = 0; i < projArr.length; i++) {
      const k = projArr[i].k;
      if (k < minK) minK = k;
      if (k > maxK) maxK = k;
    }
    const kSpan = Math.max(1e-4, maxK - minK);
    return k => 0.55 + 0.45 * ((k - minK) / kSpan);
  }

  Object.assign(PF, {
    reduced, C, rnd, project, fitCanvas, rgba, ease, span, fogMaker, unit, ZOOM,
  });
})(window.PF);
