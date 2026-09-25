/* carousel.js
   Builds one card per project, then walks the track one card to the left
   every HOLD milliseconds. The first few projects are cloned onto the end so
   the jump back to the start never shows. Auto-advance pauses on hover, on
   keyboard focus, while a project panel is open, and in a background tab. */

window.PF = window.PF || {};
(function (PF) {
  "use strict";

  const { WORK, reduced } = PF;

  const trackEl    = document.getElementById("track");
  const carouselEl = document.getElementById("carousel");
  const glyphs = [];
  const GAP = 18;
  const HOLD = 3000;          // one card every three seconds

  const visibleCount = () =>
    window.innerWidth < 620 ? 1 : window.innerWidth < 980 ? 2 : 3;

  function addCard(w, i) {
    const b = document.createElement("button");
    b.className = "card";
    b.type = "button";
    // the card's hover treatment reads this, so the spotlight and the focus
    // ring are the project's own colour rather than one blue for all eight
    b.style.setProperty("--hue", w.hue);
    b.innerHTML =
      `<span class="card__accent" style="background:${w.hue}" aria-hidden="true"></span>` +
      `<canvas class="glyph" aria-hidden="true"></canvas>` +
      `<span class="card__yr">${w.yr}</span>` +
      `<span class="card__ttl">${w.ttl}</span>` +
      `<span class="card__meta">` +
        `<i class="card__dot" style="background:${w.hue}" aria-hidden="true"></i>${w.meta}` +
      `</span>`;
    b.addEventListener("click", () => PF.select(i));
    trackEl.appendChild(b);
    glyphs.push({
      cv: b.querySelector("canvas"),
      draw: w.draw,
      // spread and offY are solved per canvas in sizeGlyphs(), see core.frameTo
      cam: {
        yaw: w.yaw ?? 0.6,
        pitch: w.pitch ?? 0.22,
        spread: 0.46,
        offY: 0,
        hue: w.hue,
      },
      // the scene's own best frame, see poseT in work.js
      poseT: w.poseT ?? 0,
      // repainted only while the card is actually on screen; see the observer
      // at the bottom of this file
      live: true,
      ctx: null, W: 0, H: 0, btn: b, idx: i,
    });
  }

  WORK.forEach(addCard);
  // three clones on the end so the wrap never snaps in view
  WORK.slice(0, 3).forEach((w, i) => addCard(w, i));

  let pos = 0, step = 0, busy = false;
  const SLIDE = 760;          // must match the track transition

  function applyX(animate) {
    trackEl.style.transition = animate
      ? "transform .72s cubic-bezier(.4,0,.2,1)" : "none";
    trackEl.style.transform = `translateX(${-pos * step}px)`;
  }

  function layoutCarousel() {
    const v = visibleCount();
    const cw = (carouselEl.clientWidth - GAP * (v - 1)) / v;
    trackEl.style.setProperty("--cw", cw + "px");
    step = cw + GAP;
    if (pos > WORK.length - 1) pos = 0;
    applyX(false);
  }

  // Positions 0..WORK.length-1 are the real ones. Stepping past the end lands
  // on the clones, which look identical, so we rebase back to 0 unseen.
  function advance(d) {
    if (busy || step === 0) return;
    busy = true;

    if (pos + d < 0) {
      pos = WORK.length;                 // same view, other end of the track
      applyX(false);
      requestAnimationFrame(() => { pos += d; applyX(true); });
    } else {
      pos += d;
      applyX(true);
    }

    setTimeout(() => {
      if (pos >= WORK.length) { pos -= WORK.length; applyX(false); }
      busy = false;
    }, SLIDE);
  }

  let paused = false;
  const holdOn  = () => { paused = true; };
  const holdOff = () => { paused = false; };
  carouselEl.addEventListener("pointerenter", holdOn);
  carouselEl.addEventListener("pointerleave", holdOff);
  carouselEl.addEventListener("focusin", holdOn);
  carouselEl.addEventListener("focusout", holdOff);

  document.getElementById("prev").addEventListener("click", () => advance(-1));
  document.getElementById("next").addEventListener("click", () => advance(1));

  // An explicit, always-visible pause control: hover/focus-pausing (above)
  // helps a mouse or keyboard user, but gives a touch-only visitor no way
  // to stop the motion, which auto-advancing content needs (WCAG 2.2.2).
  let userPaused = false;
  const playPauseEl = document.getElementById("playpause");
  if (reduced) {
    // nothing to pause — there is no autoplay to begin with
    playPauseEl.hidden = true;
  } else {
    playPauseEl.addEventListener("click", () => {
      userPaused = !userPaused;
      playPauseEl.textContent = userPaused ? "Play" : "Pause";
      playPauseEl.setAttribute("aria-pressed", String(userPaused));
      playPauseEl.setAttribute("aria-label",
        userPaused ? "Resume automatic scrolling" : "Pause automatic scrolling");
    });

    setInterval(() => {
      if (!paused && !userPaused && PF.selected === null && !document.hidden) advance(1);
    }, HOLD);
  }

  /* spotlight border: the glyph's radial gradient follows the cursor */
  trackEl.addEventListener("pointermove", e => {
    const card = e.target.closest(".card");
    if (!card) return;
    const glyph = card.querySelector(".glyph");
    if (!glyph) return;
    const r = glyph.getBoundingClientRect();
    glyph.style.setProperty("--mx", (e.clientX - r.left) + "px");
    glyph.style.setProperty("--my", (e.clientY - r.top) + "px");
  });

  /* staggered entry: cards fade in one by one when the section scrolls into view */
  if (!reduced) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        const cards = trackEl.querySelectorAll(".card:not(.visible)");
        cards.forEach((c, i) => {
          setTimeout(() => c.classList.add("visible"), i * 80);
        });
        io.disconnect();
      });
    }, { threshold: 0.15 });
    io.observe(carouselEl);
  } else {
    trackEl.querySelectorAll(".card").forEach(c => c.classList.add("visible"));
  }

  /* Eleven card canvases (eight projects plus the three wrap clones) were
     being repainted every frame for the whole life of the page, including
     while the carousel was scrolled well out of view. Each one only draws
     while it is somewhere near the viewport. */
  if ("IntersectionObserver" in window) {
    const liveIO = new IntersectionObserver(entries => {
      entries.forEach(e => {
        const g = glyphs.find(x => x.btn === e.target);
        if (g) g.live = e.isIntersecting;
      });
    }, { rootMargin: "120px" });
    glyphs.forEach(g => liveIO.observe(g.btn));
  }

  Object.assign(PF, { glyphs, layoutCarousel, advance });
})(window.PF);
