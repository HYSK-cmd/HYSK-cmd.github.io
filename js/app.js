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
    // restart the entrance animation on every selection
    detailEl.style.animation = "none";
    void detailEl.offsetWidth;
    detailEl.style.animation = "";

    glyphs.forEach(g =>
      g.btn.setAttribute("aria-current", String(g.idx === i)));

    cam.yaw = w.yaw ?? 0.6;
    cam.pitch = w.pitch ?? 0.22;
    // Frame the scene into the right half, clear of the copy. On a narrow
    // screen there is no right half, so centre it and shrink it instead.
    const narrow = window.innerWidth < 860;
    cam.spread = narrow ? 0.40 : 0.62;
    cam.offX = narrow ? 0 : 0.18;
    cam.offY = narrow ? 0.18 : 0.06;

    document.querySelector(".stage")
      .scrollIntoView({ behavior: reduced ? "auto" : "smooth", block: "start" });
  }

  function deselect() {
    PF.selected = null;
    heroEl.hidden = false;
    detailEl.hidden = true;
    closeEl.hidden = true;
    glyphs.forEach(g => g.btn.setAttribute("aria-current", "false"));
    cam.yaw = HERO_YAW;
    cam.pitch = HERO_PITCH;
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
      WORK[PF.selected].draw(ctx, W, H, cam, t);
    }

    glyphs.forEach(g => {
      if (!g.ctx) return;
      g.ctx.fillStyle = "#050810";
      g.ctx.fillRect(0, 0, g.W, g.H);
      g.draw(g.ctx, g.W, g.H, g.cam, t);
    });

    requestAnimationFrame(tick);
  }

  window.addEventListener("resize", () => {
    hero = fitCanvas(cv);
    sizeGlyphs();
    if (PF.selected === null) frameHero();
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
