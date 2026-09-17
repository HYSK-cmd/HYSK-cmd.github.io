/* network.js
   The forward-pass diagram behind the identity card.
   
   WIDTHS is the shape of the network, one number per layer. HOP is one
   colour per hop between layers — the activation front takes the colour of
   the hop it is crossing. Edit either and the picture follows.
   
   frameHero() decides where the diagram sits on the stage; drawHeroNetwork()
   paints one frame for a given wave position (0 at the input, 1 at the
   output). */

window.PF = window.PF || {};
(function (PF) {
  "use strict";

  const { C, rnd, project, rgba } = PF;

  // 1-3-5-3-5-3-1 — two bulges around a narrow middle, evenly spaced so
  // the stack reads as a diagram rather than a scatter.
  const WIDTHS = [1, 3, 5, 3, 5, 3, 1];
  const ROW = 0.22;                     // constant vertical spacing
  const HOP = ["#5ad1c4", "#8ab4f8", "#a48cf0", "#e878b4", "#f0954a", "#f0c94a"];
  const nodeCol = li => HOP[Math.min(li, HOP.length - 1)];

  const net = WIDTHS.map((n, li) => {
    const z = 2.34 - (li / (WIDTHS.length - 1)) * 4.68;
    const nodes = [];
    for (let i = 0; i < n; i++) {
      nodes.push({ p: [0, (i - (n - 1) / 2) * ROW, z], bias: rnd() });
    }
    return { n, z, nodes };
  });

  // every node to every node in the next layer
  const edges = [];
  for (let li = 0; li < net.length - 1; li++) {
    net[li].nodes.forEach(a => {
      net[li + 1].nodes.forEach(b => {
        edges.push({ li, a, b, w: 0.30 + rnd() * 0.70 });
      });
    });
  }

  // ~ +81deg: side-on, and in this direction the input column lands on the
  // left, so the activation front sweeps left to right.
  const HERO_YAW = 1.42;
  const HERO_PITCH = 0.20;
  const HERO_SPREAD = 0.58;          // glyphs keep the 0.46 default
  // One fixed vantage point per scene. Nothing orbits: the motion in every
  // scene is the process itself, not the camera moving around it.
  const cam = { yaw: HERO_YAW, pitch: HERO_PITCH };

  // The identity card owns the top of the stage, so the network is framed
  // into the space below it.
  function frameHero() {
    const narrow = window.innerWidth < 760;
    cam.spread = narrow ? 0.26 : 0.31;
    cam.offX   = 0;
    cam.offY   = narrow ? 0.28 : 0.22;
  }


  // activation level per layer, driven by the wave front
  function layerAct(li, wave) {
    const lz = net[li].z;
    const wz = 2.34 - wave * 4.68;
    const d = Math.abs(lz - wz);
    return Math.max(0, 1 - d / 0.50);
  }

  function drawHeroNetwork(ctx, W, H, wave) {
    ctx.fillStyle = C.void;
    ctx.fillRect(0, 0, W, H);

    // edges carry the colour of the hop they belong to
    for (const e of edges) {
      const pa = project(e.a.p, cam, W, H, 2.55, HERO_SPREAD);
      const pb = project(e.b.p, cam, W, H, 2.55, HERO_SPREAD);
      // An edge belongs to the layer it LEAVES: when a layer lights up, only
      // the lines running forward out of it light with it. Its incoming lines
      // already had their turn one step earlier.
      const act = layerAct(e.li, wave);
      const col = HOP[e.li];
      ctx.beginPath();
      ctx.moveTo(pa.x, pa.y);
      ctx.lineTo(pb.x, pb.y);
      ctx.strokeStyle = rgba(col, 0.10 + act * e.w * 0.52);
      ctx.lineWidth = 0.5 + act * e.w * 1.1;
      ctx.stroke();
    }

    // nodes, painted back to front
    const all = [];
    net.forEach((L, li) => L.nodes.forEach(nd => all.push({ nd, li })));
    all.map(o => ({ ...o, pr: project(o.nd.p, cam, W, H, 2.55, HERO_SPREAD) }))
       .sort((m, n) => n.pr.depth - m.pr.depth)
       .forEach(({ nd, li, pr }) => {
         const col = nodeCol(li);
         const act = layerAct(li, wave) * (0.55 + nd.bias * 0.45);
         const r = (2.3 + act * 3.2) * pr.k;
         if (act > 0.08) {
           ctx.beginPath();
           ctx.arc(pr.x, pr.y, r * 3.2, 0, 6.2832);
           ctx.fillStyle = rgba(col, act * 0.13);
           ctx.fill();
         }
         ctx.beginPath();
         ctx.arc(pr.x, pr.y, Math.max(0.9, r), 0, 6.2832);
         ctx.fillStyle = rgba(col, 0.34 + act * 0.66);
         ctx.fill();
       });
  }

  Object.assign(PF, {
    HERO_YAW, HERO_PITCH, HERO_SPREAD, cam, frameHero, drawHeroNetwork,
  });
})(window.PF);
