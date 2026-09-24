/* app.js
   Wires everything together: opening and closing a project, the typed
   tagline, and the single animation loop that repaints the stage and every
   card each frame. Loaded last, so PF already holds the pieces. */

window.PF = window.PF || {};
(function (PF) {
  "use strict";

  const { reduced, C, fitCanvas, cam, HERO_YAW, HERO_PITCH,
          frameHero, drawHeroNetwork, WORK, glyphs, layoutCarousel } = PF;

  /* the canvas the stage draws on, and the state the loop advances */
  const cv = document.getElementById("scene");
  let hero = fitCanvas(cv);
  let wave = 0.15;
  let t = 0;

  PF.selected = null;

  const detailEl = document.getElementById("detail");
  const closeEl  = document.getElementById("close");
  const dMeta  = document.getElementById("d-meta");
  const dTtl   = document.getElementById("d-ttl");
  const dBlurb = document.getElementById("d-blurb");
  const heroEl = document.getElementById("hero");
  const dStack = document.getElementById("d-stack");
  const dLinks = document.getElementById("d-links");
  const scrollcueEl = document.getElementById("scrollcue");

  /* Frame the open scene into the right half, clear of the copy. On a narrow
     screen there is no right half, so centre it and shrink it instead. `fit`
     is the project's own share of the frame — the scenes are not all the same
     shape, so without it the small ones read as lost in the middle. */
  function frameStage(w) {
    const narrow = window.innerWidth < 860;
    cam.spread = (narrow ? 0.40 : 0.62) * (w.fit ?? 1);
    cam.offX = narrow ? 0 : 0.18;
    // Narrow: the copy sits over the scene, so push it clear downward. Wide:
    // offX already clears the copy sideways, and nudging down as well only
    // ran the ground-plane scenes off the bottom edge.
    cam.offY = narrow ? 0.18 : -0.02;
  }

  function select(i) {
    PF.selected = i;
    const w = WORK[i];

    dMeta.textContent  = `${w.yr} · ${w.meta}`;
    dTtl.textContent   = w.ttl;
    dBlurb.textContent = w.blurb;
    dStack.innerHTML = w.stack.map(k => `<span>${k}</span>`).join("");
    dLinks.innerHTML = (w.links || [])
      .map(l => `<a class="doclink" href="${l.href}" target="_blank" ` +
                `rel="noopener noreferrer">${l.label} \u2192</a>`)
      .join("");

    heroEl.hidden = true;
    detailEl.hidden = false;
    closeEl.hidden = false;
    scrollcueEl.hidden = true;
    // restart the entrance animation on every selection
    detailEl.style.animation = "none";
    void detailEl.offsetWidth;
    detailEl.style.animation = "";

    glyphs.forEach(g =>
      g.btn.setAttribute("aria-current", String(g.idx === i)));

    cam.yaw = w.yaw ?? 0.6;
    cam.pitch = w.pitch ?? 0.22;
    // the scene is painted in the project's own colour, the same one the card
    // carries, so opening a card does not change the colour you clicked on
    cam.hue = w.hue;
    frameStage(w);

    document.querySelector(".stage")
      .scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  function deselect() {
    PF.selected = null;
    heroEl.hidden = false;
    detailEl.hidden = true;
    closeEl.hidden = true;
    scrollcueEl.hidden = false;
    glyphs.forEach(g => g.btn.setAttribute("aria-current", "false"));
    cam.yaw = HERO_YAW;
    cam.pitch = HERO_PITCH;
    cam.hue = undefined;          // the network keeps its own hop palette
    frameHero();
  }

  closeEl.addEventListener("click", deselect);
  window.addEventListener("keydown", e => {
    if (e.key === "Escape" && PF.selected !== null) deselect();
  });

  function sizeGlyphs() {
    layoutCarousel();
    glyphs.forEach(g => {
      const r = fitCanvas(g.cv);
      g.ctx = r.ctx; g.W = r.W; g.H = r.H;
    });
  }

  /* camera breathing: a very subtle drift so scenes feel hand-held */
  const breathe = (base, t, ampY, ampP) => ({
    yaw:   base.yaw   + Math.sin(t * 0.23) * ampY + Math.sin(t * 0.37) * ampY * 0.4,
    pitch: base.pitch + Math.cos(t * 0.19) * ampP + Math.cos(t * 0.31) * ampP * 0.3,
    // this replaces the camera for one frame, so everything the scenes read
    // off it has to come along — hue included, or the colour drops out
    spread: base.spread, offX: base.offX, offY: base.offY, hue: base.hue,
  });

  function tick() {
    if (!reduced) {
      t += 0.016;
      wave = (wave + 0.0023) % 1.14;
    }

    if (PF.selected === null) {
      drawHeroNetwork(hero.ctx, hero.W, hero.H, wave);
    } else {
      const { ctx, W, H } = hero;
      ctx.fillStyle = C.void;
      ctx.fillRect(0, 0, W, H);
      const liveCam = reduced ? cam : breathe(cam, t, 0.012, 0.006);
      WORK[PF.selected].draw(ctx, W, H, liveCam, t);
    }

    // A card canvas that is scrolled out of view is still a canvas being
    // repainted sixty times a second, and there are eleven of them. `live` is
    // set by the observer in carousel.js.
    glyphs.forEach(g => {
      if (!g.ctx || !g.live) return;
      g.ctx.fillStyle = "#050810";
      g.ctx.fillRect(0, 0, g.W, g.H);
      const gCam = reduced ? g.cam : breathe(g.cam, t, 0.008, 0.004);
      g.draw(g.ctx, g.W, g.H, gCam, t);
    });

    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", () => {
    hero = fitCanvas(cv);
    sizeGlyphs();
    // the stage frames differently above and below 860px, so an open project
    // has to be re-framed too, not just the hero
    if (PF.selected === null) frameHero();
    else frameStage(WORK[PF.selected]);
  });

  /* ── the tagline types itself ── */
  const TAGLINE = "THINK. BUILD. ITERATE.";
  const typedEl = document.getElementById("typed");

  if (reduced) {
    typedEl.textContent = TAGLINE;
  } else {
    let ti = 0, back = false;
    const step = () => {
      typedEl.textContent = TAGLINE.slice(0, ti);
      let wait = back ? 34 : 78;
      if (!back && ti === TAGLINE.length) { back = true; wait = 2400; }
      else if (back && ti === 0) { back = false; wait = 520; }
      else ti += back ? -1 : 1;
      setTimeout(step, wait);
    };
    step();
  }

  Object.assign(PF, { select, deselect });

  /* go */
  frameHero();
  sizeGlyphs();
  tick();


})(window.PF);
