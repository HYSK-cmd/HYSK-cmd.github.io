/* scenes.js
   One function per project, each drawing its own little 3D world into a
   canvas. Every one has the same shape:
   
     glyphX(ctx, W, H, cam, t)
   
   t is seconds since load, so anything that moves is a function of t. The
   camera never moves; only the scene does. Which camera a scene is read from
   lives next to the project in work.js, not here. */

window.PF = window.PF || {};
(function (PF) {
  "use strict";

  const { C, project, rgba } = PF;

  /* 1 · Agentic Readiness Screener
     A loop: the agent asks the human a question, the answer closes a gap, and
     once the gaps are closed a report is emitted. Off to the side, two feeds
     keep supplying the agent — a knowledge graph and a schema collector. */
  function glyphAgents(ctx, W, H, cam, t) {
    const pr = p => project(p, cam, W, H, 2.5);
    const AGENT  = [0, 0.02, 0];
    const HUMAN  = [0.02, 0.66, -0.10];
    const REPORT = [0.70, -0.28, 0.14];
    const SCHEMA = [-0.68, -0.40, -0.22];

    /* The knowledge graph is a sphere: nodes spread evenly over a shell,
       wired to their nearest neighbours so the lattice reads as a ball, with
       a core at the centre. Only the core reaches out to the agent. */
    const GC = [-0.70, 0.28, 0.08];         // sphere centre — the core node
    const GR = 0.30;
    const KG = [];
    for (let i = 0; i < 18; i++) {
      // a Fibonacci sphere: even coverage, no clumping at the poles
      const y  = 1 - (i / 17) * 2;
      const rr = Math.sqrt(Math.max(0, 1 - y * y));
      const th = i * 2.39996;
      KG.push([GC[0] + Math.cos(th) * rr * GR,
               GC[1] + y * GR,
               GC[2] + Math.sin(th) * rr * GR]);
    }
    const KG_EDGES = [];
    KG.forEach((a, i) => {
      KG.map((b, j) => ({ j, d: Math.hypot(b[0]-a[0], b[1]-a[1], b[2]-a[2]) }))
        .filter(o => o.j !== i)
        .sort((m, n) => m.d - n.d)
        .slice(0, 3)
        .forEach(({ j }) => {
          const lo = Math.min(i, j), hi = Math.max(i, j);
          if (!KG_EDGES.some(e => e[0] === lo && e[1] === hi)) KG_EDGES.push([lo, hi]);
        });
    });

    const cycle = (t * 0.30) % 1;          // one ask/answer/report round
    const round = Math.floor((t * 0.30) % 3);

    const edge = (a, b, col, w) => {
      const p = pr(a), q = pr(b);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
    };
    const token = (a, b, u, col) => {
      const p = pr(a), q = pr(b);
      ctx.beginPath();
      ctx.arc(p.x + (q.x - p.x) * u, p.y + (q.y - p.y) * u, 4.6, 0, 6.2832);
      ctx.fillStyle = col; ctx.fill();
    };

    /* shell lattice, faded by depth so the ball reads as a ball */
    const depths = KG.map(k => pr(k).depth);
    const dLo = Math.min(...depths), dHi = Math.max(...depths);
    const near = d => dHi === dLo ? 1 : 1 - (d - dLo) / (dHi - dLo);   // 1 = front

    KG_EDGES.forEach(([i, j]) => {
      const f = near((pr(KG[i]).depth + pr(KG[j]).depth) / 2);
      edge(KG[i], KG[j], rgba(C.a, 0.10 + f * 0.26), 0.6 + f * 0.7);
    });
    // faint spokes to the core, so the centre reads as the hub of the sphere
    KG.forEach((k, i) => { if (i % 3 === 0) edge(GC, k, rgba(C.a, 0.09), 0.6); });

    // the only wire out of the graph: core -> agent
    edge(GC, AGENT, rgba(C.a, 0.26), 1.4);
    edge(SCHEMA, AGENT, rgba(C.a, 0.18), 1.2);
    edge(AGENT, HUMAN, rgba(C.a, 0.30), 1.7);
    edge(AGENT, REPORT, rgba(C.a, 0.24), 1.5);

    // the ask / answer exchange
    if (cycle < 0.28)       token(AGENT, HUMAN, cycle / 0.28, C.a);
    else if (cycle < 0.56)  token(HUMAN, AGENT, (cycle - 0.28) / 0.28, C.b);
    else if (cycle < 0.74) {
      const u = (cycle - 0.56) / 0.18;
      token(GC, AGENT, u, rgba(C.a, 0.9));
      token(SCHEMA, AGENT, u, rgba(C.a, 0.9));
    }

    /* a traversal hopping along the shell, so the sphere reads as something
       being queried rather than an ornament */
    const walk = KG_EDGES[Math.floor(t * 1.1) % KG_EDGES.length];
    edge(KG[walk[0]], KG[walk[1]], rgba(C.b, 0.75), 1.8);
    token(KG[walk[0]], KG[walk[1]], (t * 1.1) % 1, C.b);

    // shell nodes, back to front, dimmer and smaller the further away
    KG.map((k, i) => ({ k, i, q: pr(k) }))
      .sort((m, n) => n.q.depth - m.q.depth)
      .forEach(({ k, q }) => {
        const f = near(q.depth);
        const r = (2.6 + f * 2.4) * q.k;
        ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, 6.2832);
        ctx.fillStyle = rgba(C.a, 0.28 + f * 0.55); ctx.fill();
        ctx.beginPath(); ctx.arc(q.x, q.y, r, 0, 6.2832);
        ctx.strokeStyle = rgba(C.a, 0.30 + f * 0.55); ctx.lineWidth = 0.8; ctx.stroke();
      });

    // the core
    const cq = pr(GC);
    ctx.beginPath(); ctx.arc(cq.x, cq.y, 11 * cq.k, 0, 6.2832);
    ctx.fillStyle = rgba(C.a, 0.10); ctx.fill();
    ctx.beginPath(); ctx.arc(cq.x, cq.y, 6.0 * cq.k, 0, 6.2832);
    ctx.fillStyle = rgba(C.a, 0.95); ctx.fill();

    // schema collector — a stack of table rows
    const sq = pr(SCHEMA);
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.rect(sq.x - 13, sq.y - 11 + i * 8.4, 26, 5.0);
      ctx.fillStyle = rgba(C.a, 0.55 - i * 0.12); ctx.fill();
    }

    // human
    const hq = pr(HUMAN);
    ctx.beginPath(); ctx.arc(hq.x, hq.y - 9.0, 6.4, 0, 6.2832);
    ctx.fillStyle = C.text; ctx.fill();
    ctx.beginPath();
    ctx.moveTo(hq.x - 10, hq.y + 9.5);
    ctx.quadraticCurveTo(hq.x, hq.y - 4.0, hq.x + 10, hq.y + 9.5);
    ctx.strokeStyle = C.text; ctx.lineWidth = 3.0; ctx.stroke();

    // agent
    const aq = pr(AGENT);
    const pulse = 1 + Math.sin(t * 3.4) * 0.12;
    ctx.beginPath(); ctx.arc(aq.x, aq.y, 14 * aq.k * pulse, 0, 6.2832);
    ctx.fillStyle = C.b; ctx.fill();
    ctx.globalAlpha = 0.20;
    ctx.beginPath(); ctx.arc(aq.x, aq.y, 30 * aq.k * pulse, 0, 6.2832);
    ctx.strokeStyle = C.b; ctx.lineWidth = 2.2; ctx.stroke();
    ctx.globalAlpha = 1;

    // report, with a gap meter that empties as rounds complete
    const rq = pr(REPORT);
    ctx.beginPath();
    ctx.rect(rq.x - 17, rq.y - 22, 34, 44);
    ctx.fillStyle = rgba(C.b, cycle > 0.74 ? 0.20 : 0.08);
    ctx.fill();
    ctx.strokeStyle = cycle > 0.74 ? C.b : rgba(C.a, 0.45);
    ctx.lineWidth = 1.8; ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const closed = i < round;
      ctx.beginPath();
      ctx.rect(rq.x - 11, rq.y - 14 + i * 10.5, closed ? 22 : 11, 4.2);
      ctx.fillStyle = closed ? rgba(C.b, 0.85) : rgba(C.a, 0.35);
      ctx.fill();
    }
  }

  /* 2 · Knowledge-Sharing Hub
     The pipeline the platform actually runs, left to right: a recording is
     uploaded, an orchestration of agents takes it apart, and what comes out
     is not one file but many — chapters, highlights, slides — fanning out
     into one hub. A lens glides over the wall and blows up whatever it is
     over, which is the searching half of the product. */
  function glyphHub(ctx, W, H, cam, t) {
    const pr = p => project(p, cam, W, H, 2.5);

    const PERIOD = 10.0;
    const c = (t % PERIOD) / PERIOD;
    const span = (a, b) => Math.min(1, Math.max(0, (c - a) / (b - a)));
    const ease = u => u * u * (3 - 2 * u);

    const lift    = ease(span(0.00, 0.14));   // clip rises off the tray
    const toAgent = ease(span(0.14, 0.30));   // travels into the orchestrator
    const work    =      span(0.30, 0.56);    // agents take it apart
    const toHub   = ease(span(0.56, 0.70));   // lands in the hub
    const fan     = ease(span(0.70, 0.88));   // one clip becomes many

    const TRAY = [-0.82, -0.40, 0.10];
    const ORCH = [-0.08,  0.04, 0.00];
    const HUB  = [ 0.62,  0.02, -0.06];

    const lerp3 = (a, b, u) => [a[0]+(b[0]-a[0])*u, a[1]+(b[1]-a[1])*u, a[2]+(b[2]-a[2])*u];
    const line = (a, b, col, w, dash) => {
      const p = pr(a), q = pr(b);
      if (dash) ctx.setLineDash(dash);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
      ctx.strokeStyle = col; ctx.lineWidth = w; ctx.stroke();
      ctx.setLineDash([]);
    };

    /* ── the conveyor the clip rides ── */
    line([TRAY[0], TRAY[1] + 0.34, TRAY[2]], ORCH, rgba(C.a, 0.20), 0.9, [5, 5]);
    line(ORCH, HUB, rgba(C.a, 0.20), 0.9, [5, 5]);

    /* ── 1 · upload tray ── */
    const tray = [[-0.20,0,-0.13],[0.20,0,-0.13],[0.20,0,0.13],[-0.20,0,0.13]]
      .map(p => pr([TRAY[0]+p[0], TRAY[1], TRAY[2]+p[2]]));
    ctx.beginPath();
    tray.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.closePath();
    ctx.fillStyle = rgba(C.a, 0.07); ctx.fill();
    ctx.strokeStyle = rgba(C.a, 0.40); ctx.lineWidth = 0.9; ctx.stroke();
    const ab = pr([TRAY[0], TRAY[1] + 0.08, TRAY[2]]);
    const at = pr([TRAY[0], TRAY[1] + 0.30, TRAY[2]]);
    ctx.beginPath(); ctx.moveTo(ab.x, ab.y); ctx.lineTo(at.x, at.y);
    ctx.strokeStyle = lift > 0 && lift < 1 ? C.b : rgba(C.a, 0.45);
    ctx.lineWidth = 1.6; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(at.x - 4, at.y + 5); ctx.lineTo(at.x, at.y);
    ctx.lineTo(at.x + 4, at.y + 5);
    ctx.stroke();

    /* ── 2 · the orchestration: a ring of agents around a coordinator ── */
    const RING = [0, 1, 2].map(i => {
      const a = i * 2.0944 + 0.4;
      return [ORCH[0] + Math.cos(a) * 0.26, ORCH[1] + Math.sin(a) * 0.20,
              Math.sin(a * 1.7) * 0.18];
    });
    const busy = work > 0 && work < 1;
    RING.forEach((k, i) => {
      line(ORCH, k, busy ? rgba(C.b, 0.42) : rgba(C.a, 0.20), busy ? 1.0 : 0.8);
      const q = pr(k);
      const beat = busy ? 0.5 + 0.5 * Math.sin(t * 6 + i * 2.1) : 0;
      ctx.beginPath(); ctx.arc(q.x, q.y, (3.8 + beat * 2.2) * q.k, 0, 6.2832);
      ctx.fillStyle = busy ? rgba(C.b, 0.55 + beat * 0.45) : rgba(C.a, 0.55);
      ctx.fill();
      if (busy) {
        const u = (work * 3 + i * 0.33) % 1;
        const p = pr(lerp3(ORCH, k, u < 0.5 ? u * 2 : 2 - u * 2));
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.9, 0, 6.2832);
        ctx.fillStyle = C.b; ctx.fill();
      }
    });
    const oq = pr(ORCH);
    ctx.beginPath(); ctx.arc(oq.x, oq.y, 6.4 * oq.k, 0, 6.2832);
    ctx.fillStyle = busy ? C.b : rgba(C.a, 0.7); ctx.fill();

    /* ── 3 · the hub: one arrival fans out into many ──
       Each derived clip flies from the hub's centre to its own place on a
       3x3 wall, so the wall assembles itself out of the single upload. */
    const PW = 0.145, PH = 0.125, GAPX = 0.042, GAPY = 0.038;
    const CENTER = [HUB[0], HUB[1], HUB[2]];
    const CELLS = [];
    for (let r = 0; r < 3; r++) {
      for (let cx = 0; cx < 3; cx++) {
        CELLS.push([
          HUB[0] - (PW + GAPX) + cx * (PW + GAPX),
          HUB[1] + (PH + GAPY) - r * (PH + GAPY),
          HUB[2] + Math.abs(cx - 1) * 0.06 - 0.04,
        ]);
      }
    }

    const slab = [[-0.36,0,-0.24],[0.36,0,-0.24],[0.36,0,0.24],[-0.36,0,0.24]]
      .map(p => pr([HUB[0]+p[0], HUB[1]-0.34, HUB[2]+p[2]]));
    ctx.beginPath();
    slab.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.closePath();
    ctx.fillStyle = rgba(C.a, 0.06); ctx.fill();
    ctx.strokeStyle = rgba(C.a, 0.26); ctx.lineWidth = 0.8; ctx.stroke();

    /* The wall is the hub's standing state, so it is always on screen. When a
       new recording arrives the tiles collapse into it and bloom back out —
       one clip becoming many — instead of the wall blinking out of existence.
       The lens only appears once the wall has settled. */
    const settled = fan >= 1 || toHub <= 0;
    const lensIdx = settled ? Math.floor(t * 0.45) % CELLS.length : -1;
    const panel = (centre, scale, hot, alpha) => {
      const [px, py, pz] = centre;
      const w = PW * scale / 2, h = PH * scale / 2;
      const quad = [[-w,h],[w,h],[w,-h],[-w,-h]]
        .map(([dx, dy]) => pr([px + dx, py + dy, pz]));
      ctx.beginPath();
      quad.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.closePath();
      ctx.globalAlpha = alpha;
      ctx.fillStyle = hot ? rgba(C.b, 0.26) : rgba(C.a, 0.11);
      ctx.fill();
      ctx.strokeStyle = hot ? C.b : rgba(C.a, 0.36);
      ctx.lineWidth = hot ? 1.3 : 0.8;
      ctx.stroke();
      // a play mark and a scrub line so each tile reads as a video
      const m = pr([px, py, pz]);
      const s = 3.0 * scale;
      ctx.beginPath();
      ctx.moveTo(m.x - s * 0.7, m.y - s); ctx.lineTo(m.x + s, m.y);
      ctx.lineTo(m.x - s * 0.7, m.y + s); ctx.closePath();
      ctx.fillStyle = hot ? C.b : rgba(C.a, 0.5); ctx.fill();
      const b0 = pr([px - w * 0.72, py - h * 0.66, pz]);
      const b1 = pr([px + w * 0.72, py - h * 0.66, pz]);
      ctx.beginPath(); ctx.moveTo(b0.x, b0.y); ctx.lineTo(b1.x, b1.y);
      ctx.strokeStyle = rgba(hot ? C.b : C.a, 0.45); ctx.lineWidth = 1.0; ctx.stroke();
      ctx.globalAlpha = 1;
      return m;
    };

    CELLS.forEach((cell, i) => {
      let u = 1;                                     // 1 = parked in its cell
      if (fan > 0 && fan < 1) {
        // each tile leaves the centre at its own moment, so the fan staggers
        u = Math.min(1, Math.max(0, fan * 1.6 - i * 0.06));
      } else if (fan <= 0 && toHub > 0) {
        u = 1 - toHub;                               // collapsing inward
      }
      const pos = lerp3(CENTER, cell, ease(u));
      panel(pos, 0.45 + u * 0.55, i === lensIdx, 0.30 + u * 0.70);
    });

    /* ── the clip itself, wherever it is on its trip ── */
    let clip = null, glow = false;
    if (lift < 1)          clip = lerp3([TRAY[0], TRAY[1] + 0.06, TRAY[2]],
                                        [TRAY[0], TRAY[1] + 0.34, TRAY[2]], lift);
    else if (toAgent < 1)  clip = lerp3([TRAY[0], TRAY[1] + 0.34, TRAY[2]], ORCH, toAgent);
    else if (work < 1)   { clip = ORCH; glow = true; }
    else if (toHub < 1)    clip = lerp3(ORCH, CENTER, toHub);
    else if (fan < 1)      clip = CENTER;

    if (clip) {
      const q = pr(clip);
      if (glow) {
        const s = 13 + Math.sin(t * 5) * 1.6;
        ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.rect(q.x - s, q.y - s * 0.62, s * 2, s * 1.24);
        ctx.strokeStyle = rgba(C.b, 0.55); ctx.lineWidth = 1.1; ctx.stroke();
        ctx.setLineDash([]);
      } else if (fan < 1) {
        const s = 9.5 * (1 - fan * 0.8);
        ctx.beginPath(); ctx.rect(q.x - s, q.y - s * 0.62, s * 2, s * 1.24);
        ctx.fillStyle = rgba(C.b, 0.30); ctx.fill();
        ctx.strokeStyle = C.b; ctx.lineWidth = 1.4; ctx.stroke();
      }
    }

    /* ── the magnifier ── */
    if (lensIdx >= 0) {
      const cell = CELLS[lensIdx];
      const m = pr(cell);
      const R = 26;
      // the glass: dark disc, the tile redrawn large inside it
      ctx.save();
      ctx.beginPath(); ctx.arc(m.x, m.y, R, 0, 6.2832);
      ctx.fillStyle = "rgba(5,8,16,0.92)"; ctx.fill();
      ctx.clip();
      ctx.beginPath();
      ctx.rect(m.x - R * 0.82, m.y - R * 0.60, R * 1.64, R * 1.20);
      ctx.fillStyle = rgba(C.b, 0.20); ctx.fill();
      ctx.strokeStyle = rgba(C.b, 0.8); ctx.lineWidth = 1.3; ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(m.x - 6, m.y - 8.5); ctx.lineTo(m.x + 9, m.y);
      ctx.lineTo(m.x - 6, m.y + 8.5); ctx.closePath();
      ctx.fillStyle = C.b; ctx.fill();
      // a scrub bar with a playhead, so the zoom shows detail the tile cannot
      const bw = R * 1.3;
      ctx.beginPath();
      ctx.moveTo(m.x - bw / 2, m.y + R * 0.44); ctx.lineTo(m.x + bw / 2, m.y + R * 0.44);
      ctx.strokeStyle = rgba(C.a, 0.45); ctx.lineWidth = 1.6; ctx.stroke();
      const ph = (t * 0.5) % 1;
      ctx.beginPath();
      ctx.arc(m.x - bw / 2 + bw * ph, m.y + R * 0.44, 2.2, 0, 6.2832);
      ctx.fillStyle = C.b; ctx.fill();
      ctx.restore();

      // rim and handle
      ctx.beginPath(); ctx.arc(m.x, m.y, R, 0, 6.2832);
      ctx.strokeStyle = rgba(C.text, 0.85); ctx.lineWidth = 2.0; ctx.stroke();
      ctx.beginPath(); ctx.arc(m.x, m.y, R - 3, 0, 6.2832);
      ctx.strokeStyle = rgba(C.text, 0.20); ctx.lineWidth = 1.0; ctx.stroke();
      const hx = m.x + R * 0.70, hy = m.y + R * 0.70;
      ctx.beginPath();
      ctx.moveTo(hx, hy); ctx.lineTo(hx + 13, hy + 13);
      ctx.strokeStyle = rgba(C.text, 0.85);
      ctx.lineWidth = 3.4; ctx.lineCap = "round"; ctx.stroke();
      ctx.lineCap = "butt";
    }
  }

  // 3 · predicted vs ground-truth flight path
  function glyphTrajectory(ctx, W, H, cam, t) {
    const pr = p => project(p, cam, W, H, 2.4);
    const A = [], B = [];
    for (let i = 0; i <= 70; i++) {
      const u = i / 70, ang = u * Math.PI * 2.0, r = 0.72 - u * 0.22;
      const x = Math.cos(ang) * r, z = Math.sin(ang) * r, y = -0.5 + u * 1.0;
      A.push([x, y, z]);
      const d = u * u * 0.26;
      B.push([x + d * Math.cos(ang * 1.8), y + d * 0.35, z + d * Math.sin(ang * 1.5)]);
    }
    const line = (arr, col, lw) => {
      ctx.beginPath();
      arr.forEach((p, i) => { const q = pr(p); i ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y); });
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
    };
    line(A, C.b, 1.5);
    line(B, rgba(C.a, 0.9), 1.1);
    const i = Math.floor((t * 0.17 % 1) * 70);
    [[A[i], C.b], [B[i], C.a]].forEach(([p, col]) => {
      const q = pr(p);
      ctx.beginPath(); ctx.arc(q.x, q.y, 2.6, 0, 6.2832);
      ctx.fillStyle = col; ctx.fill();
    });
  }

  /* 4 · Speed Violation Tracker
     A roadside camera watching two lanes. Traffic keeps its lane and its
     spacing, so nothing ever overlaps; the one car over the limit runs the
     outside lane and overtakes. The camera's field of view is drawn as a
     frustum with range rings and a sweeping scan line, and when the speeder
     crosses it the lens tracks, a bracket snaps shut and the shutter fires. */
  function glyphCamera(ctx, W, H, cam, t) {
    const pr = p => project(p, cam, W, H, 2.4);
    const GY = -0.44;
    const CAM = [0.86, 0.34, -0.74];        // lens, on top of the pole
    const LANE = [-0.17, 0.17];             // inner lane, outside lane

    /* ── road ── */
    const road = [[-1.05, GY, -0.36], [1.05, GY, -0.36],
                  [1.05, GY, 0.42], [-1.05, GY, 0.42]].map(pr);
    ctx.beginPath();
    road.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.closePath();
    ctx.fillStyle = rgba(C.a, 0.05); ctx.fill();
    ctx.strokeStyle = rgba(C.a, 0.26); ctx.lineWidth = 0.9; ctx.stroke();

    // lane divider
    ctx.strokeStyle = rgba(C.a, 0.30); ctx.lineWidth = 0.9;
    for (let i = -5; i <= 5; i++) {
      const x = i * 0.18;
      const a = pr([x - 0.05, GY + 0.002, 0.03]), b = pr([x + 0.05, GY + 0.002, 0.03]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }

    /* ── traffic ──
       Two cars share the inner lane at a constant half-cycle apart, so their
       gap never closes. The speeder has the outside lane to itself. */
    const cars = [
      { u: (t * 0.14) % 1,        lane: 0, fast: false },
      { u: (t * 0.14 + 0.5) % 1,  lane: 0, fast: false },
      { u: (t * 0.32 + 0.18) % 1, lane: 1, fast: true  },
    ];
    const carX = c => -1.0 + c.u * 2.0;

    const speeder = cars.find(c => c.fast);
    const sx = carX(speeder);

    /* ── field of view: a frustum onto the road ── */
    const FOV = [[0.54, GY, -0.32], [0.60, GY, 0.38],
                 [-0.30, GY, 0.38], [-0.24, GY, -0.32]];
    const locked = sx > -0.24 && sx < 0.56;
    const head = pr(CAM);
    const fov = FOV.map(pr);

    ctx.beginPath();
    fov.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.closePath();
    ctx.fillStyle = locked ? rgba(C.b, 0.11) : rgba(C.a, 0.05);
    ctx.fill();
    ctx.strokeStyle = locked ? rgba(C.b, 0.50) : rgba(C.a, 0.22);
    ctx.lineWidth = 0.9; ctx.stroke();

    // the four rays that make it a frustum rather than a flat patch
    fov.forEach(p => {
      ctx.beginPath(); ctx.moveTo(head.x, head.y); ctx.lineTo(p.x, p.y);
      ctx.strokeStyle = locked ? rgba(C.b, 0.26) : rgba(C.a, 0.13);
      ctx.lineWidth = 0.7; ctx.stroke();
    });

    // range rings across the footprint, and a scan line sweeping over them
    const across = (u, k) => {                    // u along x, k across z
      const near = [FOV[0][0] + (FOV[3][0] - FOV[0][0]) * u,
                    GY + 0.003,
                    FOV[0][2] + (FOV[3][2] - FOV[0][2]) * u];
      const far  = [FOV[1][0] + (FOV[2][0] - FOV[1][0]) * u,
                    GY + 0.003,
                    FOV[1][2] + (FOV[2][2] - FOV[1][2]) * u];
      return [near[0] + (far[0] - near[0]) * k,
              GY + 0.003,
              near[2] + (far[2] - near[2]) * k];
    };
    ctx.lineWidth = 0.7;
    for (let r = 1; r <= 3; r++) {
      const k = r / 4;
      const a = pr(across(0, k)), b = pr(across(1, k));
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = rgba(locked ? C.b : C.a, 0.12); ctx.stroke();
    }
    const sweep = (t * 0.55) % 1;
    const sa = pr(across(sweep, 0)), sb = pr(across(sweep, 1));
    ctx.beginPath(); ctx.moveTo(sa.x, sa.y); ctx.lineTo(sb.x, sb.y);
    ctx.strokeStyle = rgba(locked ? C.b : C.a, 0.42); ctx.lineWidth = 1.2; ctx.stroke();

    /* ── vehicles ── */
    const drawCar = c => {
      const x = carX(c), z = LANE[c.lane];
      const L = 0.125, Wd = 0.050;
      const hot = c.fast && locked;
      const line = hot ? C.b : rgba(C.a, 0.66);
      const lw = hot ? 1.2 : 0.9;

      const box = (x0, x1, y0, y1, z0, z1, fill) => {
        const v = [
          [x0,y0,z0],[x1,y0,z0],[x1,y1,z0],[x0,y1,z0],
          [x0,y0,z1],[x1,y0,z1],[x1,y1,z1],[x0,y1,z1],
        ].map(pr);
        if (fill) {
          ctx.beginPath();
          [4,5,6,7].forEach((k, j) => j ? ctx.lineTo(v[k].x, v[k].y) : ctx.moveTo(v[k].x, v[k].y));
          ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
        }
        ctx.strokeStyle = line; ctx.lineWidth = lw;
        [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]
          .forEach(([m, n]) => {
            ctx.beginPath(); ctx.moveTo(v[m].x, v[m].y); ctx.lineTo(v[n].x, v[n].y); ctx.stroke();
          });
        return v;
      };

      // chassis, then a shorter cabin set back from the nose
      const body = box(x - L, x + L, GY + 0.015, GY + 0.055, z - Wd, z + Wd,
                       hot ? rgba(C.b, 0.20) : rgba(C.a, 0.10));
      box(x - L * 0.55, x + L * 0.30, GY + 0.055, GY + 0.098,
          z - Wd * 0.82, z + Wd * 0.82,
          hot ? rgba(C.b, 0.16) : rgba(C.a, 0.08));

      // wheels
      [[-L * 0.62, -Wd], [L * 0.62, -Wd], [-L * 0.62, Wd], [L * 0.62, Wd]]
        .forEach(([dx, dz]) => {
          const q = pr([x + dx, GY + 0.018, z + dz]);
          ctx.beginPath(); ctx.arc(q.x, q.y, 2.1, 0, 6.2832);
          ctx.fillStyle = rgba(C.text, hot ? 0.55 : 0.32); ctx.fill();
        });

      // capture bracket around the offender
      if (hot) {
        const xs = body.map(p => p.x), ys = body.map(p => p.y);
        const x0 = Math.min(...xs) - 4, x1 = Math.max(...xs) + 4;
        const y0 = Math.min(...ys) - 4, y1 = Math.max(...ys) + 4;
        const Lb = Math.min(8, (x1 - x0) * 0.35);
        ctx.strokeStyle = C.b; ctx.lineWidth = 1.4;
        [[x0,y0,1,1],[x1,y0,-1,1],[x1,y1,-1,-1],[x0,y1,1,-1]].forEach(([bx,by,dx,dy]) => {
          ctx.beginPath();
          ctx.moveTo(bx + dx * Lb, by); ctx.lineTo(bx, by); ctx.lineTo(bx, by + dy * Lb);
          ctx.stroke();
        });
      }
    };
    // far lane first so the near lane paints over it
    cars.slice().sort((a, b) => LANE[a.lane] - LANE[b.lane]).forEach(drawCar);

    /* ── pole and housing, lens tracking the speeder ── */
    const base = pr([CAM[0], GY, CAM[2]]);
    ctx.beginPath(); ctx.moveTo(base.x, base.y); ctx.lineTo(head.x, head.y);
    ctx.strokeStyle = rgba(C.a, 0.55); ctx.lineWidth = 1.6; ctx.stroke();

    const aim = pr([locked ? sx : 0.16, GY + 0.06, LANE[speeder.lane]]);
    const ang = Math.atan2(aim.y - head.y, aim.x - head.x);
    ctx.save();
    ctx.translate(head.x, head.y);
    ctx.rotate(ang);
    ctx.beginPath(); ctx.rect(-5, -4.2, 14, 8.4);
    ctx.fillStyle = locked ? rgba(C.b, 0.35) : rgba(C.a, 0.18);
    ctx.fill();
    ctx.strokeStyle = locked ? C.b : rgba(C.a, 0.8);
    ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath(); ctx.arc(9.5, 0, 2.2, 0, 6.2832);
    ctx.fillStyle = locked ? C.b : rgba(C.a, 0.7); ctx.fill();
    ctx.restore();

    // shutter flash the moment the lock begins
    if (locked && sx < -0.10) {
      ctx.globalAlpha = 1 - (sx + 0.24) / 0.14;
      ctx.beginPath(); ctx.arc(head.x, head.y, 16, 0, 6.2832);
      ctx.fillStyle = rgba(C.b, 0.30); ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  /* 5 · Autonomous Spider Bot
     A deliberate loop, arachnid in shape: it walks in, notices something in
     the way, rakes it with the scanner, picks a line around it, and takes
     it. Four legs, but with the knee riding high and outboard so the
     silhouette reads as a spider rather than a table. */
  function glyphSpider(ctx, W, H, cam, t) {
    const GROUND = -0.46;
    const pr = p => project(p, cam, W, H, 2.45);

    /* One episode: walk, notice something, scan it, pick a way round, take it.
       Phase boundaries are fractions of PERIOD so they are easy to retune. */
    const PERIOD = 11.0;
    const c = (t % PERIOD) / PERIOD;
    const span = (a, b) => Math.min(1, Math.max(0, (c - a) / (b - a)));
    const ease = u => u * u * (3 - 2 * u);

    const walkIn  = ease(span(0.00, 0.20));   // approach
    const notice  =      span(0.20, 0.30);    // stop, something ahead
    const scan    =      span(0.30, 0.52);    // sweep the obstacle
    const plan    =      span(0.52, 0.64);    // choose the detour
    const detour  = ease(span(0.64, 1.00));   // follow it

    const moving = walkIn > 0 && walkIn < 1 || detour > 0 && detour < 1;

    const OBS = [0.30, 0, -0.02];             // the thing in the way
    const OBS_R = 0.095;

    /* ONE route function for the whole episode, so the line that is drawn
       and the line that is walked cannot drift apart. u = 0 at the start of
       the approach, 1 when the swerve has rejoined the straight. sin^1.6
       leaves and rejoins with zero slope, so the body never snaps heading. */
    const SPLIT = 0.45;                       // where the approach ends
    const ROUTE = u => {
      // the approach stops well clear of the block, so the legs never
      // straddle it while it is being scanned
      if (u <= SPLIT) return [-0.70 + (u / SPLIT) * 0.54, 0];
      const q = (u - SPLIT) / (1 - SPLIT);
      return [-0.16 + q * 0.88, 0.38 * Math.pow(Math.sin(Math.PI * q), 1.6)];
    };

    const prog = detour > 0 ? SPLIT + detour * (1 - SPLIT) : walkIn * SPLIT;
    const [bx, bz] = ROUTE(prog);
    const ahead = ROUTE(Math.min(1, prog + 0.015));
    const heading = Math.atan2(ahead[1] - bz, ahead[0] - bx);

    /* blueprint floor */
    ctx.lineWidth = 0.7;
    for (let i = -4; i <= 4; i++) {
      const u = i / 4 * 0.95;
      const major = i === 0;
      ctx.strokeStyle = rgba(C.a, major ? 0.26 : 0.10);
      let a = pr([u, GROUND, -0.95]), b = pr([u, GROUND, 0.95]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
      a = pr([-0.95, GROUND, u]); b = pr([0.95, GROUND, u]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
    }

    /* the obstacle — a block, lit once it has been noticed */
    const seen = notice > 0;
    const OH = 0.15;
    const ov = [
      [-OBS_R,GROUND,-OBS_R],[OBS_R,GROUND,-OBS_R],[OBS_R,GROUND+OH,-OBS_R],[-OBS_R,GROUND+OH,-OBS_R],
      [-OBS_R,GROUND, OBS_R],[OBS_R,GROUND, OBS_R],[OBS_R,GROUND+OH, OBS_R],[-OBS_R,GROUND+OH, OBS_R],
    ].map(p => pr([OBS[0] + p[0], p[1], OBS[2] + p[2]]));
    ctx.beginPath();
    [4,5,6,7].forEach((k, j) => j ? ctx.lineTo(ov[k].x, ov[k].y) : ctx.moveTo(ov[k].x, ov[k].y));
    ctx.closePath();
    ctx.fillStyle = seen ? rgba(C.b, 0.16) : rgba(C.a, 0.07); ctx.fill();
    ctx.strokeStyle = seen ? rgba(C.b, 0.85) : rgba(C.a, 0.5);
    ctx.lineWidth = seen ? 1.2 : 0.9;
    [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]]
      .forEach(([m, n]) => {
        ctx.beginPath(); ctx.moveTo(ov[m].x, ov[m].y); ctx.lineTo(ov[n].x, ov[n].y); ctx.stroke();
      });

    const bodyY = -0.16 + (moving ? Math.sin(t * 5.6) * 0.012 : 0);
    const SC = 0.60;                           // the whole robot, scaled down

    const rot = (x, z) => [x * Math.cos(heading) - z * Math.sin(heading),
                           x * Math.sin(heading) + z * Math.cos(heading)];
    const at = (mx, mz, my) => {
      const [rx, rz] = rot(mx * SC, mz * SC);
      return [bx + rx, my, bz + rz];
    };

    /* scanning: rays raking across the obstacle, plus a lock bracket */
    if (scan > 0 && scan < 1) {
      const o = pr([bx, bodyY + 0.06, bz]);
      for (let k = 0; k < 14; k++) {
        const u = (scan * 2 + k / 28) % 1;
        const a = -0.5 + u * 1.0;
        const q = pr([OBS[0] + Math.sin(a) * OBS_R * 1.1,
                      GROUND + 0.04 + (k / 14) * OH,
                      OBS[2] + Math.cos(a) * OBS_R * 0.4]);
        ctx.beginPath(); ctx.moveTo(o.x, o.y); ctx.lineTo(q.x, q.y);
        ctx.strokeStyle = rgba(C.b, 0.22 * (1 - k / 14)); ctx.lineWidth = 0.8;
        ctx.stroke();
      }
      const xs = ov.map(p => p.x), ys = ov.map(p => p.y);
      const x0 = Math.min(...xs) - 3, x1 = Math.max(...xs) + 3;
      const y0 = Math.min(...ys) - 3, y1 = Math.max(...ys) + 3;
      const Lb = Math.min(8, (x1 - x0) * 0.35);
      ctx.strokeStyle = C.b; ctx.lineWidth = 1.2;
      [[x0,y0,1,1],[x1,y0,-1,1],[x1,y1,-1,-1],[x0,y1,1,-1]].forEach(([px,py,dx,dy]) => {
        ctx.beginPath();
        ctx.moveTo(px + dx * Lb, py); ctx.lineTo(px, py); ctx.lineTo(px, py + dy * Lb);
        ctx.stroke();
      });
    }

    /* the route itself: the approach is always faintly there, and the part
       beyond the split lights up once a way round has been chosen */
    const routeLeg = (u0, u1, col, lw) => {
      ctx.setLineDash([4, 4]);
      ctx.beginPath();
      for (let k = 0; k <= 48; k++) {
        const w = ROUTE(u0 + (u1 - u0) * (k / 48));
        const q = pr([w[0], GROUND + 0.01, w[1]]);
        k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
      }
      ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
      ctx.setLineDash([]);
    };
    routeLeg(0, SPLIT, rgba(C.a, 0.18), 0.9);
    if (plan > 0) {
      const glow = plan < 1 ? 0.30 * Math.sin(plan * Math.PI) : 0.10;
      routeLeg(SPLIT, 1, rgba(C.b, 0.30 + glow), 1.1);
    }

    /* ── legs ──
       Four legs, but arachnid in shape: each one reaches UP to a knee above
       the body, then down and well outside it, so the silhouette is a spider
       crouch rather than a table. Diagonal pairs alternate as it walks. */
    const HIPS = [[-0.13, -0.11], [0.13, -0.11], [0.13, 0.11], [-0.13, 0.11]];
    HIPS.forEach(([hx, hz], i) => {
      const diag = (i === 0 || i === 2) ? 0 : Math.PI;
      const step = moving ? Math.sin(t * 5.6 + diag) : 0;
      const liftL = Math.max(0, step) * 0.09;
      const outX = Math.sign(hx), outZ = Math.sign(hz);

      const hip   = at(hx, hz, bodyY);
      // knee rides high and outboard — the spider's raised joint
      const knee  = at(hx + outX * 0.11, hz + outZ * 0.15,
                       bodyY + 0.13 + liftL * 0.5);
      const ankle = at(hx + outX * 0.23, hz + outZ * 0.29,
                       bodyY - 0.05 + liftL);
      const foot  = at(hx + outX * (0.28 + step * 0.04), hz + outZ * 0.35,
                       GROUND + liftL);

      const segp = [hip, knee, ankle, foot].map(pr);
      ctx.beginPath();
      segp.forEach((p, k) => k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.strokeStyle = rgba(C.a, 0.92); ctx.lineWidth = 1.3; ctx.stroke();
      // joints
      [segp[1], segp[2]].forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, 1.5, 0, 6.2832);
        ctx.fillStyle = rgba(C.a, 0.8); ctx.fill();
      });
      const f = segp[3];
      ctx.beginPath(); ctx.arc(f.x, f.y, liftL > 0.004 ? 2.0 : 1.6, 0, 6.2832);
      ctx.fillStyle = liftL > 0.004 ? C.b : rgba(C.a, 0.85); ctx.fill();
    });

    /* ── body: a small front section and a rounder rear one ── */
    const blob = (cx, cz, rx, rz, fill, stroke, lw) => {
      ctx.beginPath();
      for (let k = 0; k <= 26; k++) {
        const a = (k / 26) * 6.2832;
        const q = pr(at(cx + Math.cos(a) * rx, cz + Math.sin(a) * rz, bodyY));
        k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
      }
      ctx.closePath();
      ctx.fillStyle = fill; ctx.fill();
      ctx.strokeStyle = stroke; ctx.lineWidth = lw; ctx.stroke();
    };
    blob(-0.16, 0, 0.20, 0.17, rgba(C.b, 0.18), rgba(C.b, 0.75), 1.0);   // abdomen
    blob(0.13, 0, 0.14, 0.12, rgba(C.b, 0.26), C.b, 1.2);                // head

    // two eyes on the front section, and short palps ahead of them
    [-1, 1].forEach(s => {
      const e = pr(at(0.21, s * 0.05, bodyY + 0.01));
      ctx.beginPath(); ctx.arc(e.x, e.y, 1.5, 0, 6.2832);
      ctx.fillStyle = seen ? C.b : rgba(C.text, 0.8); ctx.fill();
      const p0 = pr(at(0.24, s * 0.06, bodyY));
      const p1 = pr(at(0.36, s * 0.13, bodyY - 0.03));
      ctx.beginPath(); ctx.moveTo(p0.x, p0.y); ctx.lineTo(p1.x, p1.y);
      ctx.strokeStyle = rgba(C.a, 0.8); ctx.lineWidth = 1.0; ctx.stroke();
    });

    /* noticing and planning both read as a pulse over the body */
    const think = notice > 0 && notice < 1 ? notice
                : plan > 0 && plan < 1 ? plan : 0;
    if (think) {
      const h = pr([bx, bodyY + 0.30, bz]);
      ctx.globalAlpha = Math.sin(think * Math.PI);
      ctx.beginPath(); ctx.arc(h.x, h.y, 3 + think * 7, 0, 6.2832);
      ctx.strokeStyle = C.b; ctx.lineWidth = 1.1; ctx.stroke();
      ctx.globalAlpha = 1;
    }
  }

  /* 6 · ZotTARS
     The loop the assistant actually runs: it spots an object, drives over to
     it, closes the gripper, and lifts. Vision → approach → grasp → lift, then
     it sets the object back down and looks for the next one. */
  function glyphTars(ctx, W, H, cam, t) {
    const pr = p => project(p, cam, W, H, 2.5);
    const GY = -0.40;
    const OBJ_X = 0.52, OBJ_Z = 0.02, OS = 0.115;  // object half-size
    const HOME = -0.58, STOP = OBJ_X - 0.32;       // where the base parks

    const PERIOD = 8.0;
    const ph = (t % PERIOD) / PERIOD;
    const seg = (a, b) => Math.min(1, Math.max(0, (ph - a) / (b - a)));
    const ease = u => u * u * (3 - 2 * u);

    const look    = seg(0.00, 0.26);
    const approach= ease(seg(0.26, 0.50));
    const grasp   = seg(0.46, 0.60);
    const lift    = ease(seg(0.60, 0.76));
    const place   = ease(seg(0.80, 1.00));

    const bx = HOME + (STOP - HOME) * approach - (STOP - HOME) * place;
    const held = grasp >= 1 ? 1 : 0;
    const objY = GY + (held ? (lift - place) * 0.34 : 0);
    const objX = held ? bx + 0.26 : OBJ_X;

    // floor
    const flr = [[-0.84,GY,-0.40],[0.84,GY,-0.40],[0.84,GY,0.40],[-0.84,GY,0.40]].map(pr);
    ctx.beginPath();
    flr.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.closePath();
    ctx.fillStyle = rgba(C.a, 0.04); ctx.fill();
    ctx.strokeStyle = rgba(C.a, 0.16); ctx.lineWidth = 0.7; ctx.stroke();
    for (let i = -3; i <= 3; i++) {
      const a = pr([i * 0.26, GY, -0.40]), b = pr([i * 0.26, GY, 0.40]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = rgba(C.a, 0.07); ctx.lineWidth = 0.6; ctx.stroke();
    }

    const box = (cx, cy, cz, hx, hy, hz, col, lw, fill) => {
      const v = [
        [cx-hx,cy-hy,cz-hz],[cx+hx,cy-hy,cz-hz],[cx+hx,cy+hy,cz-hz],[cx-hx,cy+hy,cz-hz],
        [cx-hx,cy-hy,cz+hz],[cx+hx,cy-hy,cz+hz],[cx+hx,cy+hy,cz+hz],[cx-hx,cy+hy,cz+hz],
      ].map(pr);
      if (fill) {
        ctx.beginPath();
        [4,5,6,7].forEach((k, j) => j ? ctx.lineTo(v[k].x, v[k].y) : ctx.moveTo(v[k].x, v[k].y));
        ctx.closePath(); ctx.fillStyle = fill; ctx.fill();
      }
      const E = [[0,1],[1,2],[2,3],[3,0],[4,5],[5,6],[6,7],[7,4],[0,4],[1,5],[2,6],[3,7]];
      ctx.strokeStyle = col; ctx.lineWidth = lw;
      E.forEach(([m, n]) => {
        ctx.beginPath(); ctx.moveTo(v[m].x, v[m].y); ctx.lineTo(v[n].x, v[n].y); ctx.stroke();
      });
      return v;
    };

    // the target, outlined while it is being looked at or carried
    const seen = look > 0.05;
    box(objX, objY + OS, OBJ_Z, OS, OS, OS,
        seen ? C.b : rgba(C.a, 0.55), seen ? 1.3 : 0.9,
        seen ? rgba(C.b, 0.14) : rgba(C.a, 0.06));

    // chassis + head
    const HEAD = [bx, GY + 0.50, 0];
    box(bx, GY + 0.17, 0, 0.20, 0.17, 0.17, rgba(C.a, 0.62), 1.1, rgba(C.a, 0.07));
    box(HEAD[0], HEAD[1], 0, 0.11, 0.095, 0.11, rgba(C.text, 0.72), 1.1, rgba(C.a, 0.10));
    const lens = pr([bx + 0.115, GY + 0.51, 0]);
    ctx.beginPath(); ctx.arc(lens.x, lens.y, 3.0, 0, 6.2832);
    ctx.fillStyle = seen ? C.b : rgba(C.a, 0.7); ctx.fill();

    // the look: scan rays sweeping from the lens onto the object
    if (look > 0 && look < 1) {
      const o = pr([objX, objY + OS, OBJ_Z]);
      for (let k = 0; k < 4; k++) {
        const u = (look * 2 + k * 0.25) % 1;
        ctx.beginPath();
        ctx.moveTo(lens.x, lens.y);
        ctx.lineTo(lens.x + (o.x - lens.x) * u, lens.y + (o.y - lens.y) * u);
        ctx.strokeStyle = rgba(C.b, 0.30 * (1 - u)); ctx.lineWidth = 0.9; ctx.stroke();
      }
    }

    // arm: shoulder → elbow → wrist, extending as the base closes in
    const reach = Math.max(approach, held ? 1 : 0) - place;
    const SH = [bx + 0.13, GY + 0.34, 0];
    const WR = [bx + 0.32 * Math.max(0.40, reach), objY + OS, OBJ_Z * reach];
    const EL = [(SH[0] + WR[0]) / 2, Math.max(SH[1], WR[1]) + 0.16, (SH[2] + WR[2]) / 2];
    [[SH, EL], [EL, WR]].forEach(([a, b]) => {
      const p = pr(a), q = pr(b);
      ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(q.x, q.y);
      ctx.strokeStyle = rgba(C.text, 0.78); ctx.lineWidth = 2.0; ctx.stroke();
    });
    [SH, EL].forEach(j => {
      const p = pr(j);
      ctx.beginPath(); ctx.arc(p.x, p.y, 2.6, 0, 6.2832);
      ctx.fillStyle = rgba(C.a, 0.8); ctx.fill();
    });

    // gripper: two fingers that close over the object
    const open = OS + 0.10 * (1 - Math.max(grasp, held ? 1 : 0));
    [-1, 1].forEach(sgn => {
      const a = pr([WR[0] - 0.05, WR[1] + 0.085, WR[2] + sgn * open]);
      const b = pr([WR[0] + 0.07, WR[1] - 0.070, WR[2] + sgn * open]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = grasp > 0 ? C.b : rgba(C.text, 0.75);
      ctx.lineWidth = 2.2; ctx.stroke();
    });
    const w = pr(WR);
    ctx.beginPath(); ctx.arc(w.x, w.y, 2.8, 0, 6.2832);
    ctx.fillStyle = grasp > 0 ? C.b : rgba(C.a, 0.8); ctx.fill();
  }

  /* 7 · MyToDo
     A stack of task cards floating over a store. A check sweeps down the list;
     each card it marks writes a record down into the database below. */
  function glyphTodo(ctx, W, H, cam, t) {
    const pr = p => project(p, cam, W, H, 2.5);
    const N = 5, CW = 0.52, CH = 0.11, GAP = 0.175;
    const DB = [0.0, -0.66, 0.0];
    const head = (t * 0.30) % 1.25;

    const card = (i) => {
      const y = 0.52 - i * GAP;
      const done = head > (i + 1) / N * 1.05;
      const just = Math.abs(head - (i + 1) / N * 1.05) < 0.05;
      const v = [[-CW,y,-CH],[CW,y,-CH],[CW,y,CH],[-CW,y,CH]].map(pr);
      ctx.beginPath();
      v.forEach((p, j) => j ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
      ctx.closePath();
      ctx.fillStyle = done ? rgba(C.b, 0.10) : rgba(C.a, 0.06);
      ctx.fill();
      ctx.strokeStyle = just ? C.b : done ? rgba(C.b, 0.5) : rgba(C.a, 0.42);
      ctx.lineWidth = just ? 1.4 : 0.9;
      ctx.stroke();

      // checkbox at the left edge
      const bx = pr([-CW + 0.09, y, 0]);
      ctx.beginPath(); ctx.rect(bx.x - 3.2, bx.y - 3.2, 6.4, 6.4);
      ctx.strokeStyle = done ? C.b : rgba(C.a, 0.5);
      ctx.lineWidth = 1; ctx.stroke();
      if (done) {
        ctx.beginPath();
        ctx.moveTo(bx.x - 2, bx.y); ctx.lineTo(bx.x - 0.4, bx.y + 2); ctx.lineTo(bx.x + 2.4, bx.y - 2.2);
        ctx.strokeStyle = C.b; ctx.lineWidth = 1.3; ctx.stroke();
      }
      // a ruled title line so the card reads as a task, not a plate
      const t0 = pr([-CW + 0.19, y, 0]), t1 = pr([CW - 0.12 - (i % 3) * 0.1, y, 0]);
      ctx.beginPath(); ctx.moveTo(t0.x, t0.y); ctx.lineTo(t1.x, t1.y);
      ctx.strokeStyle = done ? rgba(C.dim, 0.8) : rgba(C.text, 0.32);
      ctx.lineWidth = 1.6; ctx.stroke();

      // the write that lands in the store
      if (just) {
        const a = pr([0, y, 0]), b = pr(DB);
        const w = (head * 8) % 1;
        ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = rgba(C.b, 0.28); ctx.lineWidth = 0.8; ctx.stroke();
        ctx.beginPath();
        ctx.arc(a.x + (b.x - a.x) * w, a.y + (b.y - a.y) * w, 2.2, 0, 6.2832);
        ctx.fillStyle = C.b; ctx.fill();
      }
    };
    for (let i = N - 1; i >= 0; i--) card(i);

    // the store: a short cylinder drawn as two ellipse rings
    const ring = (yy, alpha, lw) => {
      ctx.beginPath();
      for (let k = 0; k <= 36; k++) {
        const a = (k / 36) * 6.2832;
        const q = pr([Math.cos(a) * 0.30, yy, Math.sin(a) * 0.30]);
        k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
      }
      ctx.strokeStyle = rgba(C.a, alpha); ctx.lineWidth = lw; ctx.stroke();
    };
    ring(DB[1] + 0.10, 0.6, 1.0);
    ring(DB[1] - 0.06, 0.35, 0.9);
    [[-0.30, 0], [0.30, 0]].forEach(([x, z]) => {
      const a = pr([x, DB[1] + 0.10, z]), b = pr([x, DB[1] - 0.06, z]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y);
      ctx.strokeStyle = rgba(C.a, 0.45); ctx.lineWidth = 0.9; ctx.stroke();
    });
  }

  /* 8 · Drone Project
     A quadcopter running a waypoint mission: four rotors turning, a dashed
     route through the marks below, and telemetry dropping to the ground link. */
  function glyphDrone(ctx, W, H, cam, t) {
    const pr = p => project(p, cam, W, H, 2.5);
    const GY = -0.62;
    const WPS = [[-0.78, 0.18, -0.34], [-0.18, 0.34, 0.30], [0.42, 0.14, -0.22], [0.86, 0.30, 0.28]];
    const GS = [-0.88, GY, 0.40];

    // ground plane
    const flr = [[-1.0,GY,-0.55],[1.0,GY,-0.55],[1.0,GY,0.55],[-1.0,GY,0.55]].map(pr);
    ctx.beginPath();
    flr.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y));
    ctx.closePath();
    ctx.fillStyle = rgba(C.a, 0.04); ctx.fill();
    ctx.strokeStyle = rgba(C.a, 0.15); ctx.lineWidth = 0.7; ctx.stroke();

    // route: a catmull-ish sample through the waypoints
    const at = (u) => {
      const f = u * (WPS.length - 1);
      const i = Math.min(WPS.length - 2, Math.floor(f));
      const k = f - i, A = WPS[i], B = WPS[i + 1];
      const e = k * k * (3 - 2 * k);                     // ease so turns look flown
      return [A[0] + (B[0]-A[0])*e, A[1] + (B[1]-A[1])*e + Math.sin(k*Math.PI)*0.06, A[2] + (B[2]-A[2])*e];
    };
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    for (let k = 0; k <= 80; k++) {
      const q = pr(at(k / 80));
      k ? ctx.lineTo(q.x, q.y) : ctx.moveTo(q.x, q.y);
    }
    ctx.strokeStyle = rgba(C.a, 0.42); ctx.lineWidth = 1.0; ctx.stroke();
    ctx.setLineDash([]);

    // waypoint marks, with a drop line to the ground
    const u = (t * 0.10) % 1;
    const legNow = Math.min(WPS.length - 2, Math.floor(u * (WPS.length - 1)));
    WPS.forEach((p, i) => {
      const a = pr(p), g = pr([p[0], GY, p[2]]);
      ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(g.x, g.y);
      ctx.strokeStyle = rgba(C.a, 0.16); ctx.lineWidth = 0.7; ctx.stroke();
      const passed = i <= legNow;
      ctx.beginPath(); ctx.arc(a.x, a.y, 2.6, 0, 6.2832);
      ctx.fillStyle = passed ? C.b : rgba(C.a, 0.45); ctx.fill();
    });

    // the aircraft
    const P = at(u);
    const nx = at(Math.min(1, u + 0.01));
    const hdg = Math.atan2(nx[2] - P[2], nx[0] - P[0]);
    const ARM = 0.17;
    const arms = [0.8, 2.34, 3.94, 5.48].map(a => {
      const ang = a + hdg;
      return [P[0] + Math.cos(ang) * ARM, P[1], P[2] + Math.sin(ang) * ARM];
    });
    const hub = pr(P);
    arms.forEach(m => {
      const q = pr(m);
      ctx.beginPath(); ctx.moveTo(hub.x, hub.y); ctx.lineTo(q.x, q.y);
      ctx.strokeStyle = rgba(C.text, 0.72); ctx.lineWidth = 1.3; ctx.stroke();
      // rotor disc
      ctx.beginPath();
      for (let k = 0; k <= 22; k++) {
        const a = (k / 22) * 6.2832;
        const s = pr([m[0] + Math.cos(a) * 0.085, m[1] + 0.012, m[2] + Math.sin(a) * 0.085]);
        k ? ctx.lineTo(s.x, s.y) : ctx.moveTo(s.x, s.y);
      }
      ctx.strokeStyle = rgba(C.a, 0.55); ctx.lineWidth = 0.8; ctx.stroke();
      // blade, spinning fast enough to blur into the disc
      const bl = t * 34;
      const b1 = pr([m[0] + Math.cos(bl) * 0.085, m[1] + 0.012, m[2] + Math.sin(bl) * 0.085]);
      const b2 = pr([m[0] - Math.cos(bl) * 0.085, m[1] + 0.012, m[2] - Math.sin(bl) * 0.085]);
      ctx.beginPath(); ctx.moveTo(b1.x, b1.y); ctx.lineTo(b2.x, b2.y);
      ctx.strokeStyle = rgba(C.b, 0.8); ctx.lineWidth = 1.1; ctx.stroke();
    });
    ctx.beginPath(); ctx.arc(hub.x, hub.y, 3.0, 0, 6.2832);
    ctx.fillStyle = C.b; ctx.fill();

    // ground station and the telemetry packet coming down
    const gs = pr(GS), mast = pr([GS[0], GS[1] + 0.22, GS[2]]);
    ctx.beginPath(); ctx.moveTo(gs.x, gs.y); ctx.lineTo(mast.x, mast.y);
    ctx.strokeStyle = rgba(C.a, 0.55); ctx.lineWidth = 1.2; ctx.stroke();
    ctx.beginPath(); ctx.arc(mast.x, mast.y, 2.2, 0, 6.2832);
    ctx.fillStyle = rgba(C.a, 0.8); ctx.fill();
    const pk = (t * 0.7) % 1;
    ctx.beginPath(); ctx.moveTo(hub.x, hub.y); ctx.lineTo(mast.x, mast.y);
    ctx.strokeStyle = rgba(C.a, 0.14); ctx.lineWidth = 0.7; ctx.stroke();
    ctx.beginPath();
    ctx.arc(hub.x + (mast.x - hub.x) * pk, hub.y + (mast.y - hub.y) * pk, 1.9, 0, 6.2832);
    ctx.fillStyle = rgba(C.b, 0.9); ctx.fill();
  }

  Object.assign(PF, {
    glyphAgents, glyphHub, glyphTrajectory, glyphCamera,
    glyphSpider, glyphTars, glyphTodo, glyphDrone,
  });
})(window.PF);
