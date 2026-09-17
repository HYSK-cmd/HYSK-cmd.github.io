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

  Object.assign(PF, { reduced, C, rnd, project, fitCanvas, rgba });
})(window.PF);
