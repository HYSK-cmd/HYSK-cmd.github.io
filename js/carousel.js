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
    b.innerHTML =
      `<canvas class="glyph" aria-hidden="true"></canvas>` +
      `<span class="card__yr">${w.yr}</span>` +
      `<span class="card__ttl">${w.ttl}</span>` +
      `<span class="card__meta">${w.meta}</span>`;
    b.addEventListener("click", () => PF.select(i));
    trackEl.appendChild(b);
    glyphs.push({
      cv: b.querySelector("canvas"),
      draw: w.draw,
      cam: { yaw: w.yaw ?? 0.6, pitch: w.pitch ?? 0.22 },
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

  if (!reduced) {
    setInterval(() => {
      if (!paused && PF.selected === null && !document.hidden) advance(1);
    }, HOLD);
  }

  Object.assign(PF, { glyphs, layoutCarousel, advance });
})(window.PF);
