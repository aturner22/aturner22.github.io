/* Living figures. A library of small generative drawings on a canvas, new on
   every visit. They are decoration: no captions. Three movement levels:
     still   nothing moves on its own; a figure answers only the pointer over it
     subtle  slow ambient movement, no wandering, no scroll coupling (the default)
     lively  the earlier behaviour
   None reproduces a published figure. */
(function () {
  "use strict";
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches);
  var TAU = Math.PI * 2, LEVEL = "subtle", SPEED = { still: 0, subtle: 0.3, lively: 1 };
  function frozen() { return reduce || LEVEL === "still"; }
  function lively() { return !reduce && LEVEL === "lively"; }

  function rng(seed) {
    var a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) | 0;
      var t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function gauss(R) { var u = 0, v = 0; while (!u) u = R(); while (!v) v = R(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(TAU * v); }
  function newSeed() { return (Math.random() * 4294967296) >>> 0; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function dot(c, x, y, r) { c.beginPath(); c.arc(x, y, r, 0, TAU); c.fill(); }
  function heavy(R) { return Math.sqrt(1.7 * (Math.pow(1 - R(), -2 / 1.7) - 1)); }      // heavy-tailed magnitude
  function stepper(rate) { var acc = 0; return function (S) { acc += rate * S.k; var n = Math.floor(acc); acc -= n; return n; }; }

  var KINDS = {};
  /* key, name, field, the piece of work it belongs to (if any) */
  var META = [
    ["hae", "Same ring", "about the work", "Homogeneous Autoencoders"],
    ["threshold", "Threshold", "about the work", "Where does “extreme” begin?"],
    ["abc", "Accept", "about the work", "Inference without a likelihood"],
    ["match", "Match", "about the work", "Snowseer"],
    ["prior", "Belief", "about the work", "Elicitor"],
    ["twin", "What if", "about the work", "Weather, intervened"],
    ["paths", "Paths", "probability and statistics"],
    ["galton", "Galton", "probability and statistics"],
    ["posterior", "Posterior", "probability and statistics"],
    ["sampler", "Sampler", "probability and statistics"],
    ["peaks", "Peaks", "probability and statistics"],
    ["bridge", "Bridge", "generative modelling"],
    ["signal", "Signal", "generative modelling"],
    ["score", "Score", "generative modelling"],
    ["lattice", "Lattice", "generative modelling"],
    ["manifold", "Roll", "representation learning"],
    ["scurve", "Fold", "representation learning"],
    ["project", "Project", "representation learning"],
    ["embed", "Embed", "representation learning"],
    ["clusters", "Clusters", "representation learning"],
    ["contours", "Contours", "weather, climate and space"],
    ["flow", "Flow", "weather, climate and space"],
    ["vortex", "Vortex", "weather, climate and space"],
    ["globe", "Globe", "weather, climate and space"],
    ["orbits", "Orbits", "weather, climate and space"],
    ["attractor", "Attractor", "weather, climate and space"],
    ["needles", "Needles", "robotics and control"],
    ["tree", "Tree", "robotics and control"],
    ["reach", "Reach", "robotics and control"],
    ["scan", "Scan", "robotics and control"],
    ["flock", "Flock", "robotics and control"],
    ["overtones", "Overtones", "music"]
  ];

  /* ====================================================== about the work */
  /* Homogeneous Autoencoders: the data lie on a cone, a ruffled sheet of rays from the origin.
     The encoder lays the sheet flat and leaves every point exactly as far from the origin as it was.
     Rings mark equal size, the few largest points are picked out. Wide: before and after, turned by
     the pointer. Narrow: one sheet that the pointer lays flat. */
  KINDS.hae = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, two = W > 2.1 * H, N = W < 500 ? 160 : 280, P = [], i;
    var k = 3 + Math.floor(R() * 2), amp = 0.34, ph = R() * TAU, a0 = R() * TAU, turn = 0, flat = 0;
    var LV = [0.3, 0.55, 0.8, 1.05], NR = 12, RMAX = 1.2, se = Math.sin(0.62), ce = Math.cos(0.62);
    var sc = Math.min((H / 2 - 5) / (RMAX * (se + amp * ce)), ((two ? W / 2 : W) / 2 - 8) / RMAX), M = [R() * TAU, R() * TAU, R() * TAU];
    for (i = 0; i < N; i++) {
      var far = R() < 0.08, rho = far ? 0.9 + 0.3 * R() : 0.86 * Math.sqrt(R());   // the sheet evenly covered, and a few far out
      P.push({ r: rho, a: R() < 0.25 ? M[Math.floor(R() * 3)] + gauss(R) * 0.3 : R() * TAU, hot: far });
    }
    /* a point of size rho in direction phi, on a sheet ironed flat by e in [0,1]; its distance from the origin is rho throughout */
    function pt(cx, rho, phi, e, ca, sa) {
      var z = amp * (1 - e) * Math.sin(k * phi + ph), q = rho / Math.sqrt(1 + z * z);
      var x = q * Math.cos(phi), y = q * Math.sin(phi), xr = x * ca - y * sa, yr = x * sa + y * ca;
      z *= q;
      return [cx + xr * sc, H / 2 + (yr * se - z * ce) * sc, yr * ce + z * se];
    }
    return function (t) {
      var c = S.ctx, n, m, a, q;
      turn += ((S.ptr.inside ? (S.ptr.x / W - 0.5) * 2.4 : 0) - turn) * 0.06;
      if (!two) flat += (clamp(S.u(0) * 1.3 - 0.15, 0, 1) - flat) * 0.06;
      var ang = 0.5 + (two ? turn : 0) + (lively() ? 0.3 * Math.sin(a0 + t * 0.0004) : 0), ca = Math.cos(ang), sa = Math.sin(ang);
      function panel(cx, e) {
        c.lineWidth = 1; c.strokeStyle = S.col.rule; c.globalAlpha = 1;
        c.beginPath();
        for (n = 0; n < NR; n++) { q = pt(cx, LV[LV.length - 1], n / NR * TAU, e, ca, sa); c.moveTo(cx, H / 2); c.lineTo(q[0], q[1]); }
        c.stroke();
        c.strokeStyle = S.col.sky; c.globalAlpha = 0.9;
        for (m = 0; m < LV.length; m++) {
          c.beginPath();
          for (a = 0; a < TAU; a += 0.05) { q = pt(cx, LV[m], a, e, ca, sa); if (a) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); }
          c.closePath(); c.stroke();
        }
        for (n = 0; n < N; n++) {
          var p = P[n], dp; q = pt(cx, p.r, p.a, e, ca, sa); dp = clamp(q[2] / 2.6 + 0.5, 0, 1);
          c.globalAlpha = 0.35 + 0.6 * dp; c.fillStyle = p.hot ? S.col.accent : S.col.blue;
          dot(c, q[0], q[1], (p.hot ? 1.9 : 1) + 1.3 * dp);
        }
        c.globalAlpha = 1;
      }
      if (two) { panel(W * 0.27, 0); panel(W * 0.73, 1); }
      else panel(W / 2, flat * flat * (3 - 2 * flat));
    };
  };

  /* Threshold selection: where the scattered bulk gives way to a few directions. */
  KINDS.threshold = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, N = W < 500 ? 170 : 300, P = [], i, u = 4.9, x0 = S.x0;
    var lev = [0.16 + 0.14 * R(), 0.46 + 0.1 * R(), 0.74 + 0.12 * R()];
    function sc(r) { return r / Math.pow(1 + r / 2, 0.38); }
    var HI = sc(30);
    function X(r) { return x0 + sc(r) / HI * (W - x0); }
    function inv(x) { var v = clamp((x - x0) / (W - x0), 0, 1) * HI, lo = 0, hi = 400, md, q; for (q = 0; q < 36; q++) { md = (lo + hi) / 2; if (sc(md) < v) lo = md; else hi = md; } return lo; }
    for (i = 0; i < N; i++) {
      var r = heavy(R), z = Math.log(Math.max(r, 1e-6) / 3.2), a = 1 / (1 + Math.exp(-z / 0.25));
      P.push({ r: r, y: clamp(R() < a ? lev[Math.floor(R() * 3)] + (0.012 + 0.05 * Math.exp(-1.2 * z)) * gauss(R) : R(), 0.03, 0.97) });
    }
    return function () {
      var c = S.ctx, n, p, xu;
      u += ((S.ptr.inside ? clamp(inv(S.ptr.x), 0.5, 26) : 4.9) - u) * 0.12; xu = X(u);
      c.strokeStyle = S.col.sky; c.lineWidth = 1; c.setLineDash([2, 5]); c.beginPath(); c.moveTo(xu, 3); c.lineTo(xu, H - 3); c.stroke(); c.setLineDash([]);
      for (n = 0; n < N; n++) { p = P[n]; var far = p.r > u; c.fillStyle = far ? S.col.accent : S.col.blue; c.globalAlpha = far ? 1 : 0.5; dot(c, X(p.r), 6 + p.y * (H - 12), far ? 2.1 : 1.6); }
      c.globalAlpha = 1;
    };
  };

  /* Approximate Bayesian computation: keep the simulations that land close to what was seen. */
  KINDS.abc = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, M = W < 500 ? 26 : 46, C = [], i, x, cy = H / 2, A = H * 0.19, eps = 0.075 * H, st = W < 500 ? 6 : 8;
    var k1 = 1.1 + R() * 0.8, k2 = 2.6 + R() * 1.5, p1 = R() * TAU, p2 = R() * TAU;
    function obs(px) { var s = px / W * TAU; return cy + A * (Math.sin(k1 * s + p1) + 0.45 * Math.sin(k2 * s + p2)); }
    function sim(px, q) { var s = px / W * TAU; return cy + q.db + A * ((1 + q.da) * Math.sin(k1 * s + p1 + q.dp) + 0.45 * Math.sin(k2 * s + p2)); }
    for (i = 0; i < M; i++) {
      var q = { da: gauss(R) * 0.45, dp: gauss(R) * 0.5, db: gauss(R) * 0.11 * H, d: 0 }, cnt = 0;
      for (x = 0; x <= W; x += 24) { q.d += Math.abs(sim(x, q) - obs(x)); cnt++; }
      q.d /= cnt; C.push(q);
    }
    return function () {
      var c = S.ctx, n, s;
      eps += ((S.ptr.inside ? clamp(Math.abs(S.ptr.y - cy), 0.03 * H, 0.42 * H) : 0.075 * H) - eps) * 0.12;
      c.lineWidth = 1;
      for (n = 0; n < M; n++) {
        var ok = C[n].d < eps; c.strokeStyle = ok ? S.col.accent : S.col.blue; c.globalAlpha = ok ? 0.8 : 0.16; c.beginPath();
        for (x = 0; x <= W + st; x += st) { if (x) c.lineTo(x, sim(x, C[n])); else c.moveTo(x, sim(x, C[n])); }
        c.stroke();
      }
      c.globalAlpha = 0.9; c.strokeStyle = S.col.sky; c.setLineDash([2, 5]);
      for (s = -1; s <= 1; s += 2) { c.beginPath(); for (x = 0; x <= W + st; x += st) { if (x) c.lineTo(x, obs(x) + s * eps); else c.moveTo(x, obs(x) + s * eps); } c.stroke(); }
      c.setLineDash([]); c.globalAlpha = 1; c.strokeStyle = S.col.ink; c.lineWidth = 1.7; c.beginPath();
      for (x = 0; x <= W + st; x += st) { if (x) c.lineTo(x, obs(x)); else c.moveTo(x, obs(x)); }
      c.stroke();
    };
  };

  /* Snowseer: the same landmarks in two views, and a road carried across. */
  KINDS.match = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, N = W < 500 ? 16 : 28, F = [], i, pad = Math.max(6, H * 0.08), px = 0, py = 0;
    var L = { x: W * 0.03, y: pad, w: W * 0.43, h: H - 2 * pad }, Q = { x: W * 0.54, y: pad, w: W * 0.43, h: H - 2 * pad };
    for (i = 0; i < N; i++) F.push({ u: 0.06 + 0.88 * R(), v: 0.08 + 0.84 * R(), lost: R() < 0.12, nx: gauss(R) * 0.008, ny: gauss(R) * 0.008 });
    var road = [[0.28, 1], [0.74, 1], [0.57, 0.4], [0.47, 0.4]], vw = { a: 0.14 * (R() - 0.5), b: 0.25 + 0.2 * R(), s: 0.08 * (R() - 0.5) };
    function warp(u, v) { var du = u - 0.5, dv = v - 0.5, w = 1 + (vw.b + px) * du + py * dv; return [0.5 + (du * 0.9 + vw.s * dv) / w + vw.a * dv * 0.3, 0.5 + (dv * 0.9 + vw.a * du) / w]; }
    function poly(c, f, B) { c.beginPath(); for (var n = 0; n < road.length; n++) { var q = f(road[n][0], road[n][1]); if (n) c.lineTo(B.x + q[0] * B.w, B.y + q[1] * B.h); else c.moveTo(B.x + q[0] * B.w, B.y + q[1] * B.h); } c.closePath(); }
    function same(u, v) { return [u, v]; }
    return function () {
      var c = S.ctx, n, f, q;
      px += ((S.ptr.inside ? (S.ptr.x / W - 0.5) * 0.5 : 0) - px) * 0.1; py += ((S.ptr.inside ? (S.ptr.y / H - 0.5) * 0.4 : 0) - py) * 0.1;
      c.strokeStyle = S.col.rule; c.lineWidth = 1; c.strokeRect(L.x + 0.5, L.y + 0.5, L.w, L.h); c.strokeRect(Q.x + 0.5, Q.y + 0.5, Q.w, Q.h);
      [[same, L], [warp, Q]].forEach(function (pr) {
        c.save(); c.beginPath(); c.rect(pr[1].x, pr[1].y, pr[1].w, pr[1].h); c.clip();
        poly(c, pr[0], pr[1]); c.fillStyle = S.col.accent; c.globalAlpha = 0.13; c.fill(); c.globalAlpha = 0.95; c.strokeStyle = S.col.accent; c.lineWidth = 1.3; c.stroke();
        c.restore();
      });
      c.lineWidth = 1;
      for (n = 0; n < N; n++) {
        f = F[n]; q = warp(f.u, f.v); q[0] += f.nx; q[1] += f.ny;
        var lx = L.x + f.u * L.w, ly = L.y + f.v * L.h, ok = !f.lost && q[0] > 0.02 && q[0] < 0.98 && q[1] > 0.02 && q[1] < 0.98;
        if (ok) { c.strokeStyle = S.col.sky; c.globalAlpha = 0.5; c.beginPath(); c.moveTo(lx, ly); c.lineTo(Q.x + q[0] * Q.w, Q.y + q[1] * Q.h); c.stroke(); c.globalAlpha = 0.9; c.fillStyle = S.col.blue; dot(c, Q.x + q[0] * Q.w, Q.y + q[1] * Q.h, 1.9); }
        c.globalAlpha = ok ? 0.9 : 0.4; c.fillStyle = S.col.blue; dot(c, lx, ly, 1.9);
      }
      c.globalAlpha = 1;
    };
  };

  /* Elicitor: a belief turned into a distribution, with its three quantiles. */
  KINDS.prior = function (S) {
    var W = S.W, H = S.H, med = 0.2 + 0.25 * S.rest, sg = 0.42, base = H * 0.86, top = H * 0.1;
    return function () {
      var c = S.ctx, x, mu, pm, qs, n;
      med += ((S.ptr.inside ? clamp(S.ptr.x / W, 0.1, 0.72) : 0.2 + 0.25 * S.rest) - med) * 0.1;
      sg += ((S.ptr.inside ? clamp(0.2 + S.ptr.y / H * 0.6, 0.2, 0.8) : 0.42) - sg) * 0.1;
      mu = Math.log(med);
      function pdf(v) { return Math.exp(-Math.pow(Math.log(v) - mu, 2) / (2 * sg * sg)) / (v * sg); }
      pm = pdf(Math.exp(mu - sg * sg));
      function Y(v) { return base - pdf(v) / pm * (base - top); }
      c.beginPath(); c.moveTo(0, base);
      for (x = 2; x <= W; x += 3) c.lineTo(x, Y(x / W));
      c.lineTo(W, base); c.closePath(); c.fillStyle = S.col.sky; c.globalAlpha = 0.22; c.fill();
      c.globalAlpha = 1; c.strokeStyle = S.col.blue; c.lineWidth = 1.6; c.beginPath();
      for (x = 2; x <= W; x += 3) { if (x > 2) c.lineTo(x, Y(x / W)); else c.moveTo(x, Y(x / W)); }
      c.stroke();
      c.strokeStyle = S.col.ink3; c.lineWidth = 1; c.beginPath(); c.moveTo(0, base + 0.5); c.lineTo(W, base + 0.5); c.stroke();
      qs = [Math.exp(mu - 1.645 * sg), med, Math.exp(mu + 1.645 * sg)];
      for (n = 0; n < 3; n++) {
        if (qs[n] > 1) continue;
        c.strokeStyle = S.col.accent; c.globalAlpha = 0.7; c.beginPath(); c.moveTo(qs[n] * W, base); c.lineTo(qs[n] * W, Y(qs[n])); c.stroke();
        c.globalAlpha = 1; c.fillStyle = S.col.accent; dot(c, qs[n] * W, base, n === 1 ? 3.6 : 2.6);
      }
    };
  };

  /* Weather, intervened: one forecast, and the same forecast after a nudge. */
  KINDS.twin = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, K = [], J = [], i, cy = H / 2, xs = 0.35, sgn = R() < 0.5 ? 1 : -1, st = W < 500 ? 5 : 7;
    for (i = 0; i < 4; i++) { K.push({ a: (0.5 + R()) / (i + 1), w: (i + 1) * (0.6 + 0.5 * R()), p: R() * TAU }); J.push({ a: (0.5 + R()) / (i + 1), w: (i + 1) * (0.5 + 0.5 * R()), p: R() * TAU }); }
    function base(x) { var s = x / W * Math.PI, v = 0, n; for (n = 0; n < 4; n++) v += K[n].a * Math.sin(K[n].w * s * 2 + K[n].p); return cy + 0.15 * H * v; }
    function div(x, x0) { if (x <= x0) return 0; var d = (x - x0) / W, v = 0, n; for (n = 0; n < 4; n++) v += J[n].a * Math.sin(J[n].w * d * TAU + J[n].p); return sgn * 0.3 * H * (1 - Math.exp(-d * 4.5)) * (0.6 + 0.3 * v); }
    return function () {
      var c = S.ctx, x, x0;
      xs += ((S.ptr.inside ? clamp(S.ptr.x / W, 0.05, 0.9) : 0.35) - xs) * 0.1; x0 = xs * W;
      c.beginPath(); c.moveTo(x0, base(x0));
      for (x = x0; x <= W + st; x += st) c.lineTo(x, base(x));
      for (x = W + st; x >= x0; x -= st) c.lineTo(x, base(x) + div(x, x0));
      c.closePath(); c.fillStyle = S.col.accent; c.globalAlpha = 0.13; c.fill();
      c.globalAlpha = 1; c.strokeStyle = S.col.ink; c.lineWidth = 1.5; c.beginPath();
      for (x = 0; x <= W + st; x += st) { if (x) c.lineTo(x, base(x)); else c.moveTo(x, base(x)); }
      c.stroke();
      c.strokeStyle = S.col.accent; c.lineWidth = 1.6; c.beginPath(); c.moveTo(x0, base(x0));
      for (x = x0; x <= W + st; x += st) c.lineTo(x, base(x) + div(x, x0));
      c.stroke(); c.fillStyle = S.col.accent; dot(c, x0, base(x0), 3.6);
    };
  };

  /* ========================================== probability and statistics */
  KINDS.paths = function (S) {
    var R = rng(S.seed), N = S.W < 500 ? 22 : 44, M = S.W < 500 ? 120 : 200, i, k;
    var sd = 0.2 * S.H / Math.sqrt(M), obs = [0], F = [], cur = 0.36 * M;
    for (i = 1; i <= M; i++) obs.push(obs[i - 1] * 0.992 + sd * gauss(R));
    for (k = 0; k < N; k++) { var c0 = [0]; for (i = 1; i <= M; i++) c0.push(c0[i - 1] + sd * gauss(R)); F.push(c0); }
    return function () {
      var c = S.ctx, W = S.W, H = S.H, xl = S.x0, cy = H / 2, j;
      cur += (clamp((S.ptr.inside ? (S.ptr.x - xl) / Math.max(1, W - xl) : 0.26 + 0.58 * S.u(0.18)) * M, 3, M - 6) - cur) * 0.18;
      var i0 = Math.round(cur);
      function X(n) { return xl + n / M * (W - xl); }
      c.lineWidth = 1; c.strokeStyle = S.col.sky; c.globalAlpha = 0.9; c.setLineDash([2, 5]);
      [-1, 1].forEach(function (s) {
        c.beginPath();
        for (j = i0; j <= M; j++) { var y = cy + obs[i0] + s * 2 * sd * Math.sqrt(j - i0); if (j === i0) c.moveTo(X(j), y); else c.lineTo(X(j), y); }
        c.stroke();
      });
      c.setLineDash([]); c.strokeStyle = S.col.blue; c.globalAlpha = 0.3;
      for (k = 0; k < N; k++) {
        c.beginPath(); c.moveTo(X(i0), cy + obs[i0]);
        for (j = i0 + 1; j <= M; j++) c.lineTo(X(j), cy + obs[i0] + F[k][j] - F[k][i0]);
        c.stroke();
      }
      c.globalAlpha = 1; c.strokeStyle = S.col.ink; c.lineWidth = 1.6;
      c.beginPath(); c.moveTo(X(0), cy + obs[0]);
      for (j = 1; j <= i0; j++) c.lineTo(X(j), cy + obs[j]);
      c.stroke();
      c.fillStyle = S.col.accent; dot(c, X(i0), cy + obs[i0], S.W < 500 ? 3.2 : 4.5);
    };
  };

  KINDS.galton = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, rows = H < 190 ? 7 : 9;
    var dx = Math.min(W / (rows + 3), 30), dy = Math.min(H * 0.52 / rows, dx * 0.95), top = H * 0.08, cx = W / 2;
    var counts = [], balls = [], wait = 0, gapY = 5, cap = Math.max(4, Math.floor((H - top - rows * dy - 16) / gapY)), i;
    for (i = 0; i <= rows; i++) counts.push(0);
    function px(r, k) { return cx + (k - r / 2) * dx; }
    function land(k) { counts[k]++; if (counts[k] > cap) for (var q = 0; q <= rows; q++) if (counts[q] > 0) counts[q]--; }
    for (i = 0; i < 90; i++) { var k0 = 0; for (var r0 = 0; r0 < rows; r0++) if (R() < 0.5) k0++; land(k0); }
    return function () {
      var c = S.ctx, n, b, r, k, p = 0.5 + (S.ptr.inside ? 0.34 * (S.ptr.x / W - 0.5) : 0);
      wait += S.dt;
      if (wait > 260 && balls.length < 8 && S.k > 0) { balls.push({ r: 0, k: 0, u: 0, go: R() < p ? 1 : 0, hot: R() < 0.14 }); wait = 0; }
      c.fillStyle = S.col.sky; c.globalAlpha = 0.9;
      for (r = 0; r < rows; r++) for (k = 0; k <= r; k++) dot(c, px(r, k), top + r * dy, 1.6);
      for (n = balls.length - 1; n >= 0; n--) {
        b = balls[n]; b.u += S.dt * 0.0035;
        if (b.u >= 1) { b.k += b.go; b.r++; b.u = 0; b.go = R() < p ? 1 : 0; if (b.r >= rows) { land(b.k); balls.splice(n, 1); continue; } }
        var x = px(b.r, b.k) + (px(b.r + 1, b.k + b.go) - px(b.r, b.k)) * b.u, y = top + (b.r + b.u) * dy - Math.sin(b.u * Math.PI) * dy * 0.3;
        c.globalAlpha = 1; c.fillStyle = b.hot ? S.col.accent : S.col.blue; dot(c, x, y - 4, 2.2);
      }
      c.globalAlpha = 0.85; c.fillStyle = S.col.blue;
      for (k = 0; k <= rows; k++) for (n = 0; n < counts[k]; n++) dot(c, px(rows, k), H - 5 - n * gapY, 1.9);
      c.globalAlpha = 1;
    };
  };

  KINDS.posterior = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, N = W < 500 ? 10 : 16, C = [], pins = [], i, k, np = W < 500 ? 2 : 3;
    for (i = 0; i < N; i++) { var c0 = []; for (k = 0; k < 4; k++) c0.push({ a: (0.5 + R()) / (k + 1), w: (k + 1) * (0.7 + 0.6 * R()), p: R() * TAU, v: (R() - 0.5) * 0.0007 }); C.push(c0); }
    for (i = 0; i < np; i++) pins.push({ x: (i + 0.5 + (R() - 0.5) * 0.5) / np * W, y: H * (0.3 + 0.4 * R()) });
    var mv = { x: W * S.restX, y: H * S.restY }, step = W < 500 ? 5 : 7, ell = Math.max(26, 0.085 * W);
    return function (t) {
      var c = S.ctx, a = S.aim(1, 1), cy = H / 2, x, j, n, all, mean = [], wt = [], xs = [], live = lively();
      mv.x += (a[0] - mv.x) * 0.1; mv.y += (clamp(a[1], H * 0.15, H * 0.85) - mv.y) * 0.1;
      all = pins.concat([mv]);
      for (x = 0; x <= W + step; x += step) {
        var w = 1, num = 0, den = 0;
        for (j = 0; j < all.length; j++) { var kk = Math.exp(-(x - all[j].x) * (x - all[j].x) / (2 * ell * ell)); w *= 1 - kk; num += all[j].y * kk; den += kk; }
        xs.push(x); wt.push(w); mean.push(cy * w + (1 - w) * (den > 1e-6 ? num / den : cy));
      }
      c.lineWidth = 1; c.strokeStyle = S.col.blue; c.globalAlpha = 0.3;
      for (n = 0; n < N; n++) {
        c.beginPath();
        for (j = 0; j < xs.length; j++) {
          var g = 0; for (k = 0; k < 4; k++) g += C[n][k].a * Math.sin(C[n][k].w * xs[j] / W * Math.PI + C[n][k].p + (live ? C[n][k].v * t : 0));
          var y = mean[j] + wt[j] * 0.2 * H * g;
          if (j) c.lineTo(xs[j], y); else c.moveTo(xs[j], y);
        }
        c.stroke();
      }
      c.globalAlpha = 1; c.strokeStyle = S.col.ink; c.lineWidth = 1.5; c.beginPath();
      for (j = 0; j < xs.length; j++) { if (j) c.lineTo(xs[j], mean[j]); else c.moveTo(xs[j], mean[j]); }
      c.stroke();
      c.fillStyle = S.col.blue; for (j = 0; j < pins.length; j++) dot(c, pins[j].x, pins[j].y, 3.2);
      c.fillStyle = S.col.accent; dot(c, mv.x, mv.y, 4);
    };
  };

  KINDS.sampler = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, M = [], pts = [], i, max = W < 500 ? 360 : 800, adv = stepper(0.45);
    var nm = 2 + (R() < 0.5 ? 1 : 0);
    for (i = 0; i < nm; i++) M.push({ x: W * (0.2 + 0.6 * R()), y: H * (0.28 + 0.44 * R()), sx: W * (0.06 + 0.06 * R()), sy: H * (0.1 + 0.1 * R()), r: (R() - 0.5) * 1.2, w: 0.6 + R() });
    var extra = { x: W / 2, y: H / 2, sx: W * 0.06, sy: H * 0.12, r: 0, w: 0 }, cur = { x: M[0].x, y: M[0].y }, sd = Math.min(W, H) * 0.075;
    function dens(x, y) {
      var v = 0, n, m, dx, dy, q;
      for (n = 0; n <= nm; n++) { m = n < nm ? M[n] : extra; if (m.w < 0.01) continue; dx = (x - m.x) / m.sx; dy = (y - m.y) / m.sy; q = (dx * dx - 2 * m.r * 0.6 * dx * dy + dy * dy) / (1 - 0.36 * m.r * m.r); v += m.w * Math.exp(-q / 2); }
      return v;
    }
    function advance(n) {
      while (n-- > 0) {
        var px = cur.x + gauss(R) * sd, py = cur.y + gauss(R) * sd;
        if (px > 2 && py > 2 && px < W - 2 && py < H - 2 && R() < dens(px, py) / Math.max(dens(cur.x, cur.y), 1e-12)) { cur = { x: px, y: py }; pts.push(cur); if (pts.length > max) pts.shift(); }
      }
    }
    advance(1400);
    return function () {
      var c = S.ctx, n, fresh = 10;
      if (S.ptr.inside) { extra.x += (S.ptr.x - extra.x) * 0.1; extra.y += (S.ptr.y - extra.y) * 0.1; extra.w += (1.6 - extra.w) * 0.06; } else extra.w *= 0.97;
      advance(adv(S));
      c.fillStyle = S.col.blue;
      for (n = 0; n < pts.length - fresh; n++) { c.globalAlpha = 0.15 + 0.5 * n / pts.length; dot(c, pts[n].x, pts[n].y, 1.5); }
      c.fillStyle = S.col.accent;
      for (n = Math.max(0, pts.length - fresh); n < pts.length; n++) { var age = pts.length - 1 - n; c.globalAlpha = 1 - 0.08 * age; dot(c, pts[n].x, pts[n].y, age ? 2 : 3.2); }
      c.globalAlpha = 1;
    };
  };

  KINDS.peaks = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, M = Math.max(50, Math.round(W / 5)), v = [], x = 0, i, acc = 0, u = 1.3;
    function next() { var s = gauss(R) * 0.33; if (R() < 0.05) s += 1.1 + 3 * R() * R(); x = 0.78 * x + s; return x; }
    for (i = 0; i < M + 2; i++) v.push(next());
    return function () {
      var c = S.ctx, base = H * 0.8, unit = H * 0.17, dxs = W / (M - 1), off, j;
      acc += S.dt; while (acc > 80) { v.push(next()); v.shift(); acc -= 80; }
      off = -acc / 80 * dxs;
      u += ((S.ptr.inside ? clamp((base - S.ptr.y) / unit, 0.3, 3.4) : 0.9 + 1.2 * S.u(0.35)) - u) * 0.1;
      var yu = base - u * unit;
      function line() { c.beginPath(); for (j = 0; j < v.length; j++) { var px = off + j * dxs, py = base - v[j] * unit; if (j) c.lineTo(px, py); else c.moveTo(px, py); } c.stroke(); }
      c.strokeStyle = S.col.sky; c.lineWidth = 1; c.setLineDash([2, 5]); c.beginPath(); c.moveTo(0, yu); c.lineTo(W, yu); c.stroke(); c.setLineDash([]);
      c.strokeStyle = S.col.blue; c.globalAlpha = 0.75; c.lineWidth = 1.2; line();
      c.save(); c.beginPath(); c.rect(0, 0, W, yu); c.clip(); c.globalAlpha = 1; c.strokeStyle = S.col.accent; c.lineWidth = 1.7; line(); c.restore();
      c.globalAlpha = 1; c.fillStyle = S.col.accent;
      for (j = 1; j < v.length - 1; j++) if (v[j] > u && v[j] >= v[j - 1] && v[j] > v[j + 1]) dot(c, off + j * dxs, base - v[j] * unit, 3);
    };
  };

  /* ================================================= generative modelling */
  /* Bridge: every particle leaves one distribution and arrives at another along its own noisy path. */
  KINDS.bridge = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, N = W < 500 ? 26 : 46, P = [], i, k, s = 0.55;
    for (i = 0; i < N; i++) {
      var an = R() * Math.PI, up = i % 2 === 0, w = [];
      for (k = 0; k < 3; k++) w.push(gauss(R) * H * 0.075 / (k + 1));
      P.push({ x0: W * (0.1 + 0.03 * gauss(R)), y0: H * (0.5 + 0.13 * gauss(R)), w: w,
        x1: W * (up ? 0.8 + 0.09 * Math.cos(an) : 0.88 - 0.09 * Math.cos(an)), y1: H * (up ? 0.43 - 0.22 * Math.sin(an) : 0.57 + 0.22 * Math.sin(an)) });
    }
    function at(p, q) { var wy = 0; for (var j = 0; j < 3; j++) wy += p.w[j] * Math.sin((j + 1) * Math.PI * q); return [p.x0 + (p.x1 - p.x0) * q, p.y0 + (p.y1 - p.y0) * q + wy]; }
    return function () {
      var c = S.ctx, n, q, a;
      s += (S.u(0.55) - s) * 0.08;
      c.strokeStyle = S.col.blue; c.lineWidth = 1; c.globalAlpha = 0.2;
      for (n = 0; n < N; n++) { c.beginPath(); for (q = 0; q <= 1.001; q += 0.04) { a = at(P[n], q); if (q) c.lineTo(a[0], a[1]); else c.moveTo(a[0], a[1]); } c.stroke(); }
      c.fillStyle = S.col.sky; c.globalAlpha = 0.9;
      for (n = 0; n < N; n++) { dot(c, P[n].x0, P[n].y0, 1.3); dot(c, P[n].x1, P[n].y1, 1.3); }
      for (n = 0; n < N; n++) { a = at(P[n], s); c.globalAlpha = 1; c.fillStyle = n % 6 === 0 ? S.col.accent : n % 7 === 0 ? S.col.alt : S.col.blue; dot(c, a[0], a[1], 2.3); }
    };
  };

  KINDS.signal = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, N = W < 500 ? 300 : 760, P = [], i, xl = S.x0, cy = H / 2;
    var k1 = 1.2 + R() * 0.9, k2 = 3 + R() * 2, p1 = R() * TAU, p2 = R() * TAU, lam = 0.6;
    for (i = 0; i < N; i++) {
      var u = (i + R()) / N, tx = xl + u * (W - xl);
      P.push({ tx: tx, ty: cy + 0.27 * H * Math.sin(TAU * k1 * u + p1) + 0.1 * H * Math.sin(TAU * k2 * u + p2), nx: tx + gauss(R) * 0.03 * W, ny: cy + gauss(R) * 0.2 * H, hot: i % 11 === 0 });
    }
    return function () {
      var c = S.ctx, n, q;
      lam += (clamp(S.u(0.68) * 1.15 - 0.05, 0, 1) - lam) * 0.06;
      var e = lam * lam * (3 - 2 * lam);
      for (n = 0; n < N; n++) { q = P[n]; c.fillStyle = q.hot ? S.col.accent : S.col.blue; c.globalAlpha = q.hot ? 1 : 0.6; dot(c, q.nx + (q.tx - q.nx) * e, q.ny + (q.ty - q.ny) * e, q.hot ? 2.1 : 1.5); }
      c.globalAlpha = 1;
    };
  };

  /* Score: little arrows that all point back towards where the data lie. */
  KINDS.score = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, gap = W < 500 ? 18 : 26, cx = W / 2, cy = H / 2, p = R() * TAU, q = R() * TAU;
    var asp = clamp(W / H * 0.72, 1, 2.2), R0 = Math.min(W * 0.3 / asp, H * 0.34);
    function rad(th) { return R0 * (1 + 0.22 * Math.sin(2 * th + p) + 0.13 * Math.sin(3 * th + q)); }
    return function () {
      var c = S.ctx, gx, gy, th, off = ((S.x0 % gap) + gap) % gap;
      c.strokeStyle = S.col.sky; c.lineWidth = 1.3; c.globalAlpha = 0.95; c.beginPath();
      for (th = 0; th <= TAU + 0.05; th += 0.05) { var rr = rad(th); if (th) c.lineTo(cx + asp * rr * Math.cos(th), cy + rr * Math.sin(th)); else c.moveTo(cx + asp * rr * Math.cos(th), cy + rr * Math.sin(th)); }
      c.stroke();
      c.strokeStyle = S.col.blue; c.lineWidth = 1.2; c.lineCap = "round";
      for (gx = off + gap * 0.5; gx < W; gx += gap) for (gy = gap * 0.5; gy < H; gy += gap) {
        var dx = (gx - cx) / asp, dy = gy - cy, rho = Math.hypot(dx, dy) || 1, g = rad(Math.atan2(dy, dx)) - rho, s = g > 0 ? 1 : -1;
        var len = clamp(Math.abs(g) * 0.16, 1.2, 7), ux = dx / rho * s * asp, uy = dy / rho * s, un = Math.hypot(ux, uy) || 1;
        c.globalAlpha = clamp(0.22 + Math.abs(g) / R0 * 0.5, 0.22, 0.8);
        c.beginPath(); c.moveTo(gx, gy); c.lineTo(gx + ux / un * len, gy + uy / un * len); c.stroke();
      }
      c.lineCap = "butt"; c.globalAlpha = 1;
      if (S.ptr.inside) {
        var ddx = (S.ptr.x - cx) / asp, ddy = S.ptr.y - cy, a = Math.atan2(ddy, ddx), r1 = rad(a), ex = cx + asp * r1 * Math.cos(a), ey = cy + r1 * Math.sin(a);
        c.strokeStyle = S.col.accent; c.lineWidth = 1.4; c.beginPath(); c.moveTo(S.ptr.x, S.ptr.y); c.lineTo(ex, ey); c.stroke();
        c.fillStyle = S.col.accent; dot(c, S.ptr.x, S.ptr.y, 2.4); dot(c, ex, ey, 3.6);
      }
    };
  };

  KINDS.lattice = function (S) {
    var R = rng(S.seed), gap = S.W < 500 ? 18 : 27, cx = S.W * S.restX, cy = S.H * S.restY, turn = R() < 0.5 ? 1 : -1;
    return function () {
      var c = S.ctx, W = S.W, H = S.H, a = S.aim(1, 1), gx, gy;
      cx += (a[0] - cx) * 0.06; cy += (a[1] - cy) * 0.06;
      var sig = 0.42 * H, off = ((S.x0 % gap) + gap) % gap;
      for (gx = off - gap; gx < W + gap; gx += gap) for (gy = -gap * 0.5; gy < H + gap; gy += gap) {
        var dx = gx - cx, dy = gy - cy, w = Math.exp(-(dx * dx + dy * dy) / (2 * sig * sig));
        var an = turn * 0.85 * w, sc = 1 + 0.38 * w, ca = Math.cos(an), sa = Math.sin(an);
        c.globalAlpha = 0.45 + 0.55 * w; c.fillStyle = w > 0.55 ? S.col.accent : S.col.blue;
        dot(c, cx + (dx * ca - dy * sa) * sc, cy + (dx * sa + dy * ca) * sc, 1.3 + 1.3 * w);
      }
      c.globalAlpha = 1;
    };
  };

  /* ============================================== representation learning */
  /* A rolled or folded sheet of points that the pointer lays flat. */
  function sheet(shape) {
    return function (S) {
      var R = rng(S.seed), W = S.W, H = S.H, N = W < 500 ? 250 : 480, P = [], i, un = 0, a0 = R() * TAU;
      for (i = 0; i < N; i++) P.push({ s: R(), h: R() * 2 - 1, hot: R() < 0.07 });
      return function (t) {
        var c = S.ctx, n, p, e, ang = 0.55 + 0.4 * Math.sin(a0 + t * 0.0004), sc = Math.min(W / 46, H / 34), tilt = 0.3;
        un += (clamp(S.u(0) * 1.3 - 0.15, 0, 1) - un) * 0.06; e = un * un * (3 - 2 * un);
        var ca = Math.cos(ang), sa = Math.sin(ang), ct = Math.cos(tilt), st = Math.sin(tilt);
        for (n = 0; n < N; n++) {
          p = P[n];
          var X, Y, tt;
          if (shape === "roll") { tt = 1.5 * Math.PI + 3 * Math.PI * p.s; X = tt * Math.cos(tt); Y = tt * Math.sin(tt); }
          else { tt = (p.s - 0.5) * 3 * Math.PI; X = 8 * (tt > 0 ? 1 : -1) * (1 - Math.cos(tt)); Y = 8 * Math.sin(tt); }
          X = X * (1 - e) + (p.s - 0.5) * 36 * e; Y = Y * (1 - e);
          var Z = p.h * 9, xr = X * ca + Z * sa, zr = -X * sa + Z * ca, yr = Y * ct - zr * st, dp = clamp((Y * st + zr * ct + 16) / 32, 0, 1);
          c.globalAlpha = 0.3 + 0.6 * dp; c.fillStyle = p.hot ? S.col.accent : S.col.blue;
          dot(c, W / 2 + xr * sc, H / 2 + yr * sc, 1 + 1.5 * dp);
        }
        c.globalAlpha = 1;
      };
    };
  }
  KINDS.manifold = sheet("roll");
  KINDS.scurve = sheet("fold");

  /* Project: every point is sent to the nearest place on a learned curve. The gaps are the error. */
  KINDS.project = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, N = W < 500 ? 60 : 110, P = [], i, cy = H / 2, f = 1 + R() * 0.6, ph = R() * TAU, bend = 1, M = 90;
    function curve(s, b) { return [W * (0.05 + 0.9 * s), cy + b * 0.24 * H * Math.sin(TAU * f * s + ph)]; }
    for (i = 0; i < N; i++) { var c0 = curve(R(), 1); P.push({ x: c0[0] + gauss(R) * W * 0.012, y: clamp(c0[1] + gauss(R) * H * 0.09, 4, H - 4), e: 0, qx: 0, qy: 0 }); }
    return function () {
      var c = S.ctx, n, m, C = [], order;
      bend += ((S.ptr.inside ? clamp((0.5 - S.ptr.y / H) * 3.2, -1.4, 1.4) : 1) - bend) * 0.08;
      for (m = 0; m <= M; m++) C.push(curve(m / M, bend));
      for (n = 0; n < N; n++) {
        var p = P[n], bd = 1e12, d;
        for (m = 0; m <= M; m++) { d = (p.x - C[m][0]) * (p.x - C[m][0]) + (p.y - C[m][1]) * (p.y - C[m][1]); if (d < bd) { bd = d; p.qx = C[m][0]; p.qy = C[m][1]; } }
        p.e = bd;
      }
      order = P.slice().sort(function (a, b) { return b.e - a.e; });
      c.lineWidth = 1;
      for (n = 0; n < N; n++) { var big = n < 6; c.strokeStyle = big ? S.col.accent : S.col.sky; c.globalAlpha = big ? 0.95 : 0.8; c.beginPath(); c.moveTo(order[n].x, order[n].y); c.lineTo(order[n].qx, order[n].qy); c.stroke(); }
      c.globalAlpha = 1; c.strokeStyle = S.col.blue; c.lineWidth = 1.5; c.beginPath();
      for (m = 0; m <= M; m++) { if (m) c.lineTo(C[m][0], C[m][1]); else c.moveTo(C[m][0], C[m][1]); }
      c.stroke();
      for (n = 0; n < N; n++) { c.fillStyle = n < 6 ? S.col.accent : S.col.blue; c.globalAlpha = 0.85; dot(c, order[n].x, order[n].y, 1.8); }
      c.globalAlpha = 1;
    };
  };

  /* Embed: one muddled cloud that separates into its classes. */
  KINDS.embed = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, N = W < 500 ? 90 : 170, P = [], cen = [], i, k, m = 0.8, a0 = R() * TAU;
    for (k = 0; k < 3; k++) cen.push([W * (0.5 + 0.3 * Math.cos(a0 + k / 3 * TAU)), H * (0.5 + 0.3 * Math.sin(a0 + k / 3 * TAU))]);
    for (i = 0; i < N; i++) { k = i % 3; P.push({ k: k, mx: W * 0.5 + gauss(R) * W * 0.09, my: H * 0.5 + gauss(R) * H * 0.15, sx: cen[k][0] + gauss(R) * W * 0.035, sy: cen[k][1] + gauss(R) * H * 0.06 }); }
    return function () {
      var c = S.ctx, n, p, cols = [S.col.blue, S.col.accent, S.col.alt], e;
      m += (S.u(0.8) - m) * 0.06; e = m * m * (3 - 2 * m);
      for (n = 0; n < N; n++) { p = P[n]; c.fillStyle = cols[p.k]; c.globalAlpha = 0.85; dot(c, p.mx + (p.sx - p.mx) * e, p.my + (p.sy - p.my) * e, 1.9); }
      c.globalAlpha = 1;
    };
  };

  KINDS.clusters = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, K = 4, N = W < 500 ? 110 : 200, P = [], C = [], B = [], i, k;
    for (k = 0; k < K; k++) B.push({ x: W * (0.15 + 0.7 * R()), y: H * (0.2 + 0.6 * R()) });
    for (i = 0; i < N; i++) { var b = B[Math.floor(R() * K)]; P.push({ x: clamp(b.x + gauss(R) * W * 0.075, 4, W - 4), y: clamp(b.y + gauss(R) * H * 0.13, 4, H - 4), k: 0 }); }
    for (k = 0; k < K; k++) { var q0 = P[Math.floor(R() * N)]; C.push({ x: q0.x, y: q0.y }); }
    return function () {
      var c = S.ctx, cols = [S.col.blue, S.col.sky, S.col.alt, S.col.accent], sx = [0, 0, 0, 0], sy = [0, 0, 0, 0], sn = [0, 0, 0, 0], n, p, best, bd, d;
      for (n = 0; n < N; n++) {
        p = P[n]; bd = 1e12; best = 0;
        for (k = 0; k < K; k++) { d = (p.x - C[k].x) * (p.x - C[k].x) + (p.y - C[k].y) * (p.y - C[k].y); if (d < bd) { bd = d; best = k; } }
        p.k = best; sx[best] += p.x; sy[best] += p.y; sn[best]++;
      }
      for (k = 0; k < K; k++) {
        if (k === K - 1 && S.ptr.inside) { C[k].x += (S.ptr.x - C[k].x) * 0.12; C[k].y += (S.ptr.y - C[k].y) * 0.12; }
        else if (sn[k]) { C[k].x += (sx[k] / sn[k] - C[k].x) * 0.05; C[k].y += (sy[k] / sn[k] - C[k].y) * 0.05; }
      }
      c.lineWidth = 1;
      for (n = 0; n < N; n++) { p = P[n]; c.strokeStyle = cols[p.k]; c.globalAlpha = 0.16; c.beginPath(); c.moveTo(p.x, p.y); c.lineTo(C[p.k].x, C[p.k].y); c.stroke(); }
      for (n = 0; n < N; n++) { p = P[n]; c.fillStyle = cols[p.k]; c.globalAlpha = 0.9; dot(c, p.x, p.y, 1.8); }
      c.globalAlpha = 1; c.lineWidth = 1.4;
      for (k = 0; k < K; k++) { c.strokeStyle = cols[k]; c.beginPath(); c.arc(C[k].x, C[k].y, 5, 0, TAU); c.stroke(); }
    };
  };

  /* ============================================ weather, climate and space */
  KINDS.contours = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, B = [], K = Math.max(5, Math.round(W / H * 3.2)), i;
    for (i = 0; i < K; i++) B.push({ x: (i + R()) / K * W, y: (0.15 + 0.7 * R()) * H, s: (0.15 + R() * 0.17) * H, a: 0.55 + R() * 0.75, vx: (R() - 0.5) * 0.012, vy: (R() - 0.5) * 0.007 });
    var hill = { x: W * 0.5, y: H * 0.5, a: 0 }, cell = W < 500 ? 6 : 10, LEV = [];
    for (i = 0; i < 9; i++) LEV.push(0.16 + i * 0.14);
    var SEG = { 1: [[3, 2]], 2: [[2, 1]], 3: [[3, 1]], 4: [[0, 1]], 5: [[0, 1], [3, 2]], 6: [[0, 2]], 7: [[0, 3]], 8: [[0, 3]], 9: [[0, 2]], 10: [[0, 3], [2, 1]], 11: [[0, 1]], 12: [[3, 1]], 13: [[2, 1]], 14: [[3, 2]] };
    function f(x, y) {
      var v = 0, n, b, dx, dy;
      for (n = 0; n < K; n++) { b = B[n]; dx = x - b.x; dy = y - b.y; v += b.a * Math.exp(-(dx * dx + dy * dy) / (2 * b.s * b.s)); }
      if (hill.a > 0.01) { dx = x - hill.x; dy = y - hill.y; v += hill.a * Math.exp(-(dx * dx + dy * dy) / (2 * 0.04 * H * H)); }
      return v;
    }
    return function () {
      var c = S.ctx, nx = Math.ceil(W / cell), ny = Math.ceil(H / cell), ix, iy, n, l;
      for (n = 0; n < K; n++) { var b = B[n]; b.x += b.vx * S.dt; b.y += b.vy * S.dt; if (b.x < 0 || b.x > W) b.vx *= -1; if (b.y < 0 || b.y > H) b.vy *= -1; }
      if (S.ptr.inside) { hill.x += (S.ptr.x - hill.x) * 0.12; hill.y += (S.ptr.y - hill.y) * 0.12; hill.a += (0.8 - hill.a) * 0.06; } else hill.a *= 0.95;
      var G = new Float32Array((nx + 1) * (ny + 1));
      for (iy = 0; iy <= ny; iy++) for (ix = 0; ix <= nx; ix++) G[iy * (nx + 1) + ix] = f(ix * cell, iy * cell);
      c.lineWidth = 1;
      for (l = 0; l < LEV.length; l++) {
        var L = LEV[l]; c.beginPath();
        for (iy = 0; iy < ny; iy++) for (ix = 0; ix < nx; ix++) {
          var k = iy * (nx + 1) + ix, v0 = G[k], v1 = G[k + 1], v2 = G[k + nx + 2], v3 = G[k + nx + 1];
          var code = (v0 > L ? 8 : 0) | (v1 > L ? 4 : 0) | (v2 > L ? 2 : 0) | (v3 > L ? 1 : 0);
          if (!code || code === 15) continue;
          var x = ix * cell, y = iy * cell;
          var E = [[x + cell * (L - v0) / (v1 - v0), y], [x + cell, y + cell * (L - v1) / (v2 - v1)], [x + cell * (L - v3) / (v2 - v3), y + cell], [x, y + cell * (L - v0) / (v3 - v0)]];
          var segs = SEG[code];
          for (n = 0; n < segs.length; n++) { c.moveTo(E[segs[n][0]][0], E[segs[n][0]][1]); c.lineTo(E[segs[n][1]][0], E[segs[n][1]][1]); }
        }
        var top = l >= LEV.length - 2;
        c.strokeStyle = top ? S.col.accent : S.col.blue; c.globalAlpha = top ? 0.95 : 0.28 + 0.09 * l; c.stroke();
      }
      c.globalAlpha = 1;
    };
  };

  KINDS.flow = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, N = W < 500 ? 120 : 300, P = [], i, first = true, fade = 0;
    var f1 = 0.7 + R(), f2 = 0.7 + R(), p1 = R() * TAU, p2 = R() * TAU, p3 = R() * TAU;
    function angle(x, y, t) {
      var u = x / H, v = y / H, a = 0.75 * Math.sin(u * 1.25 * f1 + p1 + t * 0.00006) + 0.6 * Math.sin(v * 2.3 * f2 + p2) + 0.4 * Math.sin((u - v) * 0.8 + p3 - t * 0.00009);
      if (S.ptr.inside) { var dx = x - S.ptr.x, dy = y - S.ptr.y, w = Math.exp(-(dx * dx + dy * dy) / (2 * 90 * 90)); a += w * (Math.atan2(dy, dx) + Math.PI / 2 - a) * 0.7; }
      return a;
    }
    function spawn(p, anywhere) { p.x = anywhere ? R() * W : -4; p.y = R() * H; p.life = 80 + R() * 260; p.hot = R() < 0.06; p.alt = R() < 0.5; }
    for (i = 0; i < N; i++) { var p = {}; spawn(p, true); P.push(p); }
    var fn = function (t) {
      var c = S.ctx, q, a, nx, ny, n, s;
      if (frozen()) {
        var Q = rng(S.seed);
        c.lineWidth = 1;
        for (n = 0; n < 90; n++) {
          var x = Q() * W, y = Q() * H; c.beginPath(); c.moveTo(x, y);
          for (s = 0; s < 70; s++) { a = angle(x, y, 0); x += Math.cos(a) * 3; y += Math.sin(a) * 3; c.lineTo(x, y); }
          c.strokeStyle = n % 13 === 0 ? S.col.accent : S.col.blue; c.globalAlpha = n % 13 === 0 ? 0.9 : 0.4; c.stroke();
        }
        c.globalAlpha = 1; return;
      }
      if (first) { c.clearRect(0, 0, W, H); first = false; }
      fade += S.k;
      while (fade >= 1) { c.globalCompositeOperation = "destination-out"; c.globalAlpha = 0.055; c.fillStyle = "#000"; c.fillRect(0, 0, W, H); c.globalCompositeOperation = "source-over"; fade -= 1; }
      c.lineWidth = 1.1;
      for (n = 0; n < N; n++) {
        q = P[n]; a = angle(q.x, q.y, t); nx = q.x + Math.cos(a) * 1.8 * S.k; ny = q.y + Math.sin(a) * 1.8 * S.k;
        c.globalAlpha = q.hot ? 0.95 : 0.55; c.strokeStyle = q.hot ? (q.alt ? S.col.b : S.col.accent) : S.col.blue;
        c.beginPath(); c.moveTo(q.x, q.y); c.lineTo(nx, ny); c.stroke();
        q.x = nx; q.y = ny; q.life -= S.k;
        if (q.life < 0 || nx > W + 5 || nx < -6 || ny < -6 || ny > H + 6) spawn(q, R() < 0.55);
      }
      c.globalAlpha = 1;
    };
    fn.keep = function () { return !frozen(); };
    return fn;
  };

  /* Vortex: spiral bands turning about a centre, faster near the middle. */
  KINDS.vortex = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, N = W < 500 ? 240 : 460, P = [], i, RM = Math.min(W * 0.42, H * 0.72), cx = W / 2, cy = H / 2, tw = 2.2 + R(), dir = R() < 0.5 ? 1 : -1;
    for (i = 0; i < N; i++) { var rr = Math.pow(R(), 0.7); P.push({ r: 0.06 + 0.94 * rr, a: (i % 3) * TAU / 3 + gauss(R) * 0.22 * (0.4 + rr), hot: R() < 0.06 }); }
    return function (t) {
      var c = S.ctx, n, p;
      cx += ((S.ptr.inside ? W / 2 + (S.ptr.x - W / 2) * 0.25 : W / 2) - cx) * 0.06; cy += ((S.ptr.inside ? H / 2 + (S.ptr.y - H / 2) * 0.25 : H / 2) - cy) * 0.06;
      for (n = 0; n < N; n++) {
        p = P[n]; var ang = dir * (p.a + tw * Math.log(p.r + 0.08) - t * 0.00035 / Math.sqrt(p.r + 0.15));
        c.fillStyle = p.hot ? S.col.accent : S.col.blue; c.globalAlpha = 0.35 + 0.5 * (1 - p.r);
        dot(c, cx + p.r * RM * Math.cos(ang), cy + p.r * RM * 0.62 * Math.sin(ang), 1 + 1.2 * (1 - p.r));
      }
      c.globalAlpha = 1;
    };
  };

  /* Globe: a dotted sphere turning slowly, with two wavy bands of wind. */
  KINDS.globe = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, Rg = Math.min(W, H) * 0.44, cx = W / 2, cy = H / 2, l0 = R() * TAU, tilt = 0.38, ph = R() * TAU, off = 0, D = Math.PI / 180;
    function proj(lat, lon) { var cl = Math.cos(lat), x = cl * Math.sin(lon), y = Math.sin(lat), z = cl * Math.cos(lon); return [cx + Rg * x, cy - Rg * (y * Math.cos(tilt) - z * Math.sin(tilt)), y * Math.sin(tilt) + z * Math.cos(tilt)]; }
    return function (t) {
      var c = S.ctx, la, lo, q, rot, pen;
      off += ((S.ptr.inside ? (S.ptr.x / W - 0.5) * 2.2 : 0) - off) * 0.06; rot = l0 + t * 0.00012 + off;
      c.strokeStyle = S.col.sky; c.lineWidth = 1; c.globalAlpha = 0.8; c.beginPath(); c.arc(cx, cy, Rg, 0, TAU); c.stroke();
      c.fillStyle = S.col.blue;
      for (la = -75; la <= 75; la += 15) for (lo = 0; lo < 360; lo += 15) { q = proj(la * D, lo * D + rot); if (q[2] > 0) { c.globalAlpha = 0.2 + 0.6 * q[2]; dot(c, q[0], q[1], 1 + 0.9 * q[2]); } }
      [[50, 8, 4, S.col.accent], [-34, 6, 5, S.col.b]].forEach(function (bnd) {
        c.strokeStyle = bnd[3]; c.lineWidth = 1.5; c.globalAlpha = 0.95; c.beginPath(); pen = false;
        for (lo = 0; lo <= 360; lo += 3) { q = proj((bnd[0] + bnd[1] * Math.sin(bnd[2] * lo * D + ph + t * 0.0002)) * D, lo * D + rot); if (q[2] > 0.02) { if (pen) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); pen = true; } else pen = false; }
        c.stroke();
      });
      c.globalAlpha = 1;
    };
  };

  /* Orbits: bodies on ellipses, quick when close in and slow far out. */
  KINDS.orbits = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, O = [], i, n = W < 500 ? 3 : 4, sc = Math.min(W * 0.46, H * 0.95), cx = W / 2, cy = H / 2, inc = 0.42;
    for (i = 0; i < n; i++) O.push({ a: 0.28 + 0.72 * (i + 1) / n, e: 0.08 + 0.32 * R(), w: R() * TAU, M0: R() * TAU });
    function pos(o, E) { var x = o.a * (Math.cos(E) - o.e), y = o.a * Math.sqrt(1 - o.e * o.e) * Math.sin(E), cw = Math.cos(o.w), sw = Math.sin(o.w); return [cx + sc * (x * cw - y * sw), cy + sc * inc * (x * sw + y * cw)]; }
    return function (t) {
      var c = S.ctx, k, E, q, it;
      inc += ((S.ptr.inside ? 0.2 + 0.6 * S.ptr.y / H : 0.42) - inc) * 0.06;
      c.strokeStyle = S.col.sky; c.lineWidth = 1; c.globalAlpha = 0.85;
      for (k = 0; k < n; k++) { c.beginPath(); for (E = 0; E <= TAU + 0.11; E += 0.1) { q = pos(O[k], E); if (E) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); } c.stroke(); }
      c.globalAlpha = 1; c.fillStyle = S.col.ink; dot(c, cx, cy, 3.4);
      for (k = 0; k < n; k++) {
        var M = O[k].M0 + t * 0.0006 / Math.pow(O[k].a, 1.5); E = M;
        for (it = 0; it < 5; it++) E -= (E - O[k].e * Math.sin(E) - M) / (1 - O[k].e * Math.cos(E));
        q = pos(O[k], E); c.fillStyle = k === 1 ? S.col.accent : k === n - 1 ? S.col.b : S.col.blue; dot(c, q[0], q[1], 3);
      }
    };
  };

  KINDS.attractor = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, P = [], x = 0.1 + R(), y = 0, z = 20 + R() * 5, n, max = 2400, a0 = R() * TAU, adv = stepper(3);
    function step() { var h = 0.008, dx = 10 * (y - x), dy = x * (28 - z) - y, dz = x * y - 8 / 3 * z; x += dx * h; y += dy * h; z += dz * h; P.push([x, y, z]); if (P.length > max) P.shift(); }
    for (n = 0; n < max; n++) step();
    return function (t) {
      var c = S.ctx, ang, ca, sa, sc = Math.min(W / 66, H / 54), chunk, m, q, CH = 9;
      for (n = adv(S); n > 0; n--) step();
      ang = -Math.PI / 4 + 0.32 * Math.sin(a0 + t * 0.00022) + (S.ptr.inside ? (S.ptr.x / W - 0.5) * 1.1 : 0);
      ca = Math.cos(ang); sa = Math.sin(ang);
      c.strokeStyle = S.col.blue; c.lineWidth = 1;
      for (chunk = 0; chunk < CH; chunk++) {
        var from = Math.floor(P.length * chunk / CH), to = Math.min(P.length - 1, Math.floor(P.length * (chunk + 1) / CH));
        c.globalAlpha = 0.14 + 0.8 * chunk / CH; c.beginPath();
        for (m = from; m <= to; m++) { q = P[m]; var px = W / 2 + (q[0] * ca - q[1] * sa) * sc, py = H / 2 - (q[2] - 25) * sc; if (m === from) c.moveTo(px, py); else c.lineTo(px, py); }
        c.stroke();
      }
      q = P[P.length - 1]; c.globalAlpha = 1; c.fillStyle = S.col.accent; dot(c, W / 2 + (q[0] * ca - q[1] * sa) * sc, H / 2 - (q[2] - 25) * sc, 3.2);
    };
  };

  /* ================================================= robotics and control */
  /* Needles: a field of small strokes. Only those near the pointer turn to face it. */
  KINDS.needles = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, gap = W < 500 ? 17 : 26, A = [], q1 = R() * TAU, q2 = R() * TAU;
    var sw = { x: W * (0.25 + 0.5 * R()), y: H * (0.25 + 0.5 * R()), s: R() < 0.5 ? 1 : -1 };
    return function () {
      var c = S.ctx, a = S.aim(1.4, 1.1), on = S.ptr.inside || lively(), gx, gy, n = 0, off = ((S.x0 % gap) + gap) % gap;
      c.lineWidth = 1.3; c.lineCap = "round";
      for (gx = off; gx < W; gx += gap) for (gy = gap * 0.5; gy < H; gy += gap, n++) {
        var s2 = (gx - sw.x) * (gx - sw.x) + (gy - sw.y) * (gy - sw.y), rest = 0.7 * Math.sin(gx / H * 2.2 + q1) + 0.6 * Math.cos(gy / H * 3.1 + q2) + sw.s * 1.5 * Math.exp(-s2 / (2 * 0.09 * H * H));
        var d2 = (gx - a[0]) * (gx - a[0]) + (gy - a[1]) * (gy - a[1]), w = on ? Math.exp(-d2 / (2 * 0.1 * H * H)) : 0, to = Math.atan2(a[1] - gy, a[0] - gx);
        var want = rest + w * Math.atan2(Math.sin(to - rest), Math.cos(to - rest));
        if (A[n] === undefined) A[n] = want;
        A[n] += Math.atan2(Math.sin(want - A[n]), Math.cos(want - A[n])) * 0.1;
        var len = 3.5 + 3 * w, ca = Math.cos(A[n]) * len, sa = Math.sin(A[n]) * len;
        c.globalAlpha = 0.34 + 0.6 * w; c.strokeStyle = w > 0.55 ? S.col.accent : S.col.blue;
        c.beginPath(); c.moveTo(gx - ca, gy - sa); c.lineTo(gx + ca, gy + sa); c.stroke();
      }
      c.globalAlpha = 1; c.lineCap = "butt";
    };
  };

  KINDS.tree = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, obs = [], i, nodes, hold = 0, no = W < 500 ? 3 : 5, adv = stepper(2);
    for (i = 0; i < no; i++) obs.push({ x: W * (0.28 + 0.55 * R()), y: H * (0.15 + 0.7 * R()), r: Math.min(W, H) * (0.08 + 0.09 * R()) });
    var start = { x: W * 0.05, y: H * (0.3 + 0.4 * R()) }, stp = Math.max(8, Math.min(W, H) * 0.05), max = W < 500 ? 240 : 520;
    function free(x, y) { if (x < 2 || y < 2 || x > W - 2 || y > H - 2) return false; for (var n = 0; n < obs.length; n++) if (Math.hypot(x - obs[n].x, y - obs[n].y) < obs[n].r + 3) return false; return true; }
    function reset() { nodes = [{ x: start.x, y: start.y, p: -1 }]; }
    function grow(n) {
      while (n-- > 0 && nodes.length < max) {
        var sx = R() * W, sy = R() * H, best = 0, bd = 1e12, j, d;
        for (j = 0; j < nodes.length; j++) { d = (nodes[j].x - sx) * (nodes[j].x - sx) + (nodes[j].y - sy) * (nodes[j].y - sy); if (d < bd) { bd = d; best = j; } }
        var b = nodes[best], L = Math.sqrt(bd) || 1, nx = b.x + (sx - b.x) / L * stp, ny = b.y + (sy - b.y) / L * stp;
        if (free(nx, ny)) nodes.push({ x: nx, y: ny, p: best });
      }
    }
    reset(); grow(frozen() ? 4000 : Math.floor(max * 0.6));
    return function () {
      var c = S.ctx, g = S.aim(0.8, 1.2), j, d, bd = 1e12, best = 0, n;
      if (nodes.length < max) grow(adv(S)); else if (lively()) { hold += S.dt; if (hold > 7000 && !S.ptr.inside) { hold = 0; reset(); } }
      c.fillStyle = S.col.sky; c.globalAlpha = 0.22; for (n = 0; n < obs.length; n++) dot(c, obs[n].x, obs[n].y, obs[n].r);
      c.strokeStyle = S.col.blue; c.globalAlpha = 0.42; c.lineWidth = 1; c.beginPath();
      for (j = 1; j < nodes.length; j++) { c.moveTo(nodes[nodes[j].p].x, nodes[nodes[j].p].y); c.lineTo(nodes[j].x, nodes[j].y); }
      c.stroke();
      for (j = 0; j < nodes.length; j++) { d = (nodes[j].x - g[0]) * (nodes[j].x - g[0]) + (nodes[j].y - g[1]) * (nodes[j].y - g[1]); if (d < bd) { bd = d; best = j; } }
      c.globalAlpha = 1; c.strokeStyle = S.col.accent; c.lineWidth = 1.8; c.beginPath(); c.moveTo(nodes[best].x, nodes[best].y);
      for (j = best; nodes[j].p >= 0; j = nodes[j].p) c.lineTo(nodes[nodes[j].p].x, nodes[nodes[j].p].y);
      c.stroke();
      c.fillStyle = S.col.ink; dot(c, start.x, start.y, 3); c.fillStyle = S.col.accent; dot(c, nodes[best].x, nodes[best].y, 3.6);
    };
  };

  KINDS.reach = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, n = 3, L = Math.min(H * 0.34, W * 0.2), base = { x: W * (0.4 + 0.2 * R()), y: H * 0.95 }, J = [], i, trail = [];
    for (i = 0; i <= n; i++) J.push({ x: base.x, y: base.y - i * L });
    var tip = { x: W * S.restX, y: H * S.restY * 0.8 };
    return function () {
      var c = S.ctx, a = S.aim(1.7, 1.3), it, k, dx, dy, d;
      tip.x += (a[0] - tip.x) * 0.1; tip.y += (a[1] - tip.y) * 0.1;
      var gx = tip.x, gy = tip.y; dx = gx - base.x; dy = gy - base.y; d = Math.hypot(dx, dy);
      if (d > n * L * 0.995) { gx = base.x + dx / d * n * L * 0.995; gy = base.y + dy / d * n * L * 0.995; }
      for (it = 0; it < 6; it++) {
        J[n].x = gx; J[n].y = gy;
        for (k = n - 1; k >= 0; k--) { dx = J[k].x - J[k + 1].x; dy = J[k].y - J[k + 1].y; d = Math.hypot(dx, dy) || 1; J[k].x = J[k + 1].x + dx / d * L; J[k].y = J[k + 1].y + dy / d * L; }
        J[0].x = base.x; J[0].y = base.y;
        for (k = 1; k <= n; k++) { dx = J[k].x - J[k - 1].x; dy = J[k].y - J[k - 1].y; d = Math.hypot(dx, dy) || 1; J[k].x = J[k - 1].x + dx / d * L; J[k].y = J[k - 1].y + dy / d * L; }
      }
      var lastP = trail[trail.length - 1];
      if (!lastP || Math.hypot(lastP.x - J[n].x, lastP.y - J[n].y) > 0.6) { trail.push({ x: J[n].x, y: J[n].y }); if (trail.length > 170) trail.shift(); }
      c.strokeStyle = S.col.sky; c.lineWidth = 1; c.globalAlpha = 0.9; c.beginPath();
      for (k = 0; k < trail.length; k++) { if (k) c.lineTo(trail[k].x, trail[k].y); else c.moveTo(trail[k].x, trail[k].y); }
      c.stroke();
      c.globalAlpha = 1; c.strokeStyle = S.col.ink; c.lineWidth = 2; c.lineCap = "round"; c.lineJoin = "round"; c.beginPath(); c.moveTo(J[0].x, J[0].y);
      for (k = 1; k <= n; k++) c.lineTo(J[k].x, J[k].y);
      c.stroke(); c.lineCap = "butt";
      c.fillStyle = S.col.blue; for (k = 0; k < n; k++) dot(c, J[k].x, J[k].y, 3.2);
      c.fillStyle = S.col.accent; dot(c, J[n].x, J[n].y, 4);
    };
  };

  KINDS.scan = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, segs = [], boxes = [], hits = [], i, nb = W < 500 ? 3 : 5, pos = { x: W * S.restX, y: H * S.restY }, tick = 0;
    function addBox(x, y, w, h) { segs.push([x, y, x + w, y], [x + w, y, x + w, y + h], [x + w, y + h, x, y + h], [x, y + h, x, y]); }
    addBox(1, 1, W - 2, H - 2);
    for (i = 0; i < nb; i++) { var bw = W * (0.07 + 0.11 * R()), bh = H * (0.16 + 0.22 * R()), bx = W * (0.08 + 0.8 * R()) - bw / 2, by = H * (0.1 + 0.8 * R()) - bh / 2; boxes.push([bx, by, bw, bh]); addBox(bx, by, bw, bh); }
    function inBox(x, y) { for (var n = 0; n < boxes.length; n++) if (x > boxes[n][0] - 4 && x < boxes[n][0] + boxes[n][2] + 4 && y > boxes[n][1] - 4 && y < boxes[n][1] + boxes[n][3] + 4) return true; return false; }
    function cast(ox, oy, a) {
      var dx = Math.cos(a), dy = Math.sin(a), best = 1e9, n, s, ex, ey, den, t, u;
      for (n = 0; n < segs.length; n++) { s = segs[n]; ex = s[2] - s[0]; ey = s[3] - s[1]; den = dx * ey - dy * ex; if (Math.abs(den) < 1e-9) continue; t = ((s[0] - ox) * ey - (s[1] - oy) * ex) / den; u = ((s[0] - ox) * dy - (s[1] - oy) * dx) / den; if (t > 0 && u >= 0 && u <= 1 && t < best) best = t; }
      return best;
    }
    var guard = 0; while (inBox(pos.x, pos.y) && guard++ < 200) { pos.x = W * R(); pos.y = H * R(); }
    return function (t) {
      var c = S.ctx, a = S.aim(1.3, 1.9), n, k, NR = W < 500 ? 40 : 72, nx = pos.x + (a[0] - pos.x) * 0.08, ny = pos.y + (a[1] - pos.y) * 0.08, still = frozen();
      if (S.ptr.inside || lively()) { if (!inBox(nx, pos.y)) pos.x = clamp(nx, 4, W - 4); if (!inBox(pos.x, ny)) pos.y = clamp(ny, 4, H - 4); }
      tick++; if (still) hits = [];
      c.strokeStyle = S.col.sky; c.lineWidth = 1; c.globalAlpha = 0.26; c.beginPath();
      for (k = 0; k < NR; k++) {
        var ang = k / NR * TAU + t * 0.0005, d = cast(pos.x, pos.y, ang), hx = pos.x + Math.cos(ang) * d, hy = pos.y + Math.sin(ang) * d;
        c.moveTo(pos.x, pos.y); c.lineTo(hx, hy);
        if ((still || tick % 3 === 0) && hx > 3 && hy > 3 && hx < W - 3 && hy < H - 3) hits.push({ x: hx, y: hy, age: 0 });
      }
      c.stroke();
      if (hits.length > 1300) hits.splice(0, hits.length - 1300);
      c.fillStyle = S.col.blue;
      for (n = 0; n < hits.length; n++) { hits[n].age += S.real; c.globalAlpha = still ? 0.85 : clamp(1 - hits[n].age / 5200, 0, 1) * 0.85; if (c.globalAlpha > 0.02) dot(c, hits[n].x, hits[n].y, 1.5); }
      c.globalAlpha = 1; c.fillStyle = S.col.accent; dot(c, pos.x, pos.y, 3.8);
    };
  };

  KINDS.flock = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, N = W < 500 ? 44 : 90, B = [], i;
    for (i = 0; i < N; i++) B.push({ x: R() * W, y: R() * H, vx: R() * 2 - 1, vy: R() * 2 - 1, hot: R() < 0.09, alt: R() < 0.5 });
    function sim(k) {
      var n, m, b, o, dx, dy, d2;
      for (n = 0; n < N; n++) {
        b = B[n]; var ax = 0, ay = 0, cxm = 0, cym = 0, vxm = 0, vym = 0, cnt = 0;
        for (m = 0; m < N; m++) {
          if (m === n) continue; o = B[m]; dx = o.x - b.x; dy = o.y - b.y; d2 = dx * dx + dy * dy;
          if (d2 < 3600) { cxm += o.x; cym += o.y; vxm += o.vx; vym += o.vy; cnt++; if (d2 < 280) { ax -= dx * 0.035; ay -= dy * 0.035; } }
        }
        if (cnt) { ax += (cxm / cnt - b.x) * 0.0016 + (vxm / cnt - b.vx) * 0.045; ay += (cym / cnt - b.y) * 0.0016 + (vym / cnt - b.vy) * 0.045; }
        if (S.ptr.inside) { dx = b.x - S.ptr.x; dy = b.y - S.ptr.y; d2 = dx * dx + dy * dy; if (d2 < 8100) { ax += dx / (d2 + 60) * 5; ay += dy / (d2 + 60) * 5; } }
        b.vx += ax * k; b.vy += ay * k;
        var sp = Math.hypot(b.vx, b.vy) || 1, lim = clamp(sp, 0.9, 1.9); b.vx = b.vx / sp * lim; b.vy = b.vy / sp * lim;
      }
      for (n = 0; n < N; n++) {
        b = B[n]; b.x += b.vx * k; b.y += b.vy * k;
        if (b.x < -8) b.x += W + 16; else if (b.x > W + 8) b.x -= W + 16; if (b.y < -8) b.y += H + 16; else if (b.y > H + 8) b.y -= H + 16;
      }
    }
    for (i = 0; i < 160; i++) sim(1);                       // let it settle into groups before it is first seen
    return function () {
      var c = S.ctx, n, b;
      if (S.k > 0) sim(S.k);
      c.lineWidth = 1.4; c.lineCap = "round";
      for (n = 0; n < N; n++) {
        b = B[n]; var s = Math.hypot(b.vx, b.vy) || 1; c.strokeStyle = b.hot ? (b.alt ? S.col.b : S.col.accent) : S.col.blue; c.globalAlpha = b.hot ? 1 : 0.75;
        c.beginPath(); c.moveTo(b.x, b.y); c.lineTo(b.x - b.vx / s * 7, b.y - b.vy / s * 7); c.stroke();
      }
      c.globalAlpha = 1; c.lineCap = "butt";
    };
  };

  /* A weather globe. A sphere with a graticule and the coastlines, and winds streaming across it:
     the real 10 m wind when the page has fetched it, otherwise jets and cyclones. Particles live
     briefly, fading in and out, and leave short trails that belong to the sphere, so turning the
     globe turns them too. The scroll turns the globe about its own tilted axis, a drag spins it
     about that axis with some momentum, and the clock alone moves the wind. */
  var FEED = {};   // data handed in from outside, by name: Fig.feed("earth", grid), Fig.feed("coast", lines)
  KINDS.earth = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, Rg = Math.min(W, H) * 0.47, cx = W / 2, cy = H / 2, off = 0, lastOff = 0, N = W < 400 ? 500 : W < 600 ? 900 : 1300, HL = 12, P = [], i;
    /* the fallback wind, in metres per second, shaped like the general circulation: easterly trades either side of the
       equator, westerlies in the mid-latitudes with waves along the jets, weak polar easterlies, a few lows on the storm
       tracks turning the right way for their hemisphere, and a little noise */
    var CYC = [], nc, adv = stepper(0.9), first = true, fed = null, wph = [R() * TAU, R() * TAU, R() * TAU];
    for (nc = 0; nc < 5; nc++) { var hemi = nc % 2 ? -1 : 1; CYC.push({ la: hemi * (0.85 + 0.25 * R()), lo: R() * TAU, s: hemi, k: 9 + 6 * R(), r2: 0.05 + 0.04 * R() }); }
    function rotAxis(ax, ay, az, th) { var c0 = Math.cos(th), s0 = Math.sin(th), t = 1 - c0; return [t * ax * ax + c0, t * ax * ay - s0 * az, t * ax * az + s0 * ay, t * ax * ay + s0 * az, t * ay * ay + c0, t * ay * az - s0 * ax, t * ax * az - s0 * ay, t * ay * az + s0 * ax, t * az * az + c0]; }
    function mul(A, B) { var C = [], r, k; for (r = 0; r < 3; r++) for (k = 0; k < 3; k++) C.push(A[r * 3] * B[k] + A[r * 3 + 1] * B[3 + k] + A[r * 3 + 2] * B[6 + k]); return C; }
    var TILT = -23.44 * Math.PI / 180, LEAN = rotAxis(0, 0, 1, TILT), phi = R() * TAU, M = mul(LEAN, rotAxis(0, 1, 0, phi)); S.M = M;   // mounted at the Earth's axial tilt, leaning to the right, turning about that axis only
    function proj(lat, lon) { var cl = Math.cos(lat), x = cl * Math.sin(lon), y = Math.sin(lat), z = cl * Math.cos(lon); return [cx + Rg * (M[0] * x + M[1] * y + M[2] * z), cy - Rg * (M[3] * x + M[4] * y + M[5] * z), M[6] * x + M[7] * y + M[8] * z]; }
    /* real winds: bilinear in a lat-lon grid of u (east) and v (north) in m/s, wrapping in longitude */
    function real(lat, lon) {
      var g = FEED.earth, fi = clamp((lat * 180 / Math.PI - g.lat0) / g.dlat, 0, g.nlat - 1.001), lonDeg = ((lon * 180 / Math.PI) % 360 + 540) % 360 - 180, fj = ((lonDeg - g.lon0) / g.dlon % g.nlon + g.nlon) % g.nlon;
      var i0 = Math.floor(fi), j0 = Math.floor(fj), i1 = i0 + 1, j1 = (j0 + 1) % g.nlon, a = fi - i0, b = fj - j0, k00 = i0 * g.nlon + j0, k01 = i0 * g.nlon + j1, k10 = i1 * g.nlon + j0, k11 = i1 * g.nlon + j1;
      return [(g.u[k00] * (1 - a) + g.u[k10] * a) * (1 - b) + (g.u[k01] * (1 - a) + g.u[k11] * a) * b, (g.v[k00] * (1 - a) + g.v[k10] * a) * (1 - b) + (g.v[k01] * (1 - a) + g.v[k11] * a) * b];
    }
    /* the wind as [east, north] in the source's own units: the real grid when it has arrived, otherwise jets and cyclones */
    function field(lat, lon) {
      if (FEED.earth) return real(lat, lon);
      var a = Math.abs(lat), s = lat < 0 ? -1 : 1, n, cc, dx, dy, w, u, v;
      var trade = -6 * Math.exp(-Math.pow((a - 0.25) / 0.2, 2));                    // easterlies, strongest near 15 degrees
      var west = 11 * Math.exp(-Math.pow((a - 0.8) / 0.22, 2));                      // westerlies, strongest near 45 degrees
      var polar = -3 * Math.exp(-Math.pow((a - 1.35) / 0.15, 2));                    // weak easterlies near the poles
      var wave = Math.sin(4 * lon + wph[0] + s * 0.8) * 0.45 + Math.sin(6 * lon + wph[1]) * 0.25;   // standing waves on the jets
      u = trade + west * (1 + 0.35 * wave) + polar;
      v = west * 0.55 * Math.cos(4 * lon + wph[0] + s * 0.8) * s + 1.5 * Math.sin(3 * lon + wph[2]) * Math.cos(lat);
      for (n = 0; n < CYC.length; n++) { cc = CYC[n]; dx = Math.atan2(Math.sin(lon - cc.lo), Math.cos(lon - cc.lo)) * Math.cos(lat); dy = lat - cc.la; w = cc.s * cc.k * Math.exp(-(dx * dx + dy * dy) / cc.r2); u += -dy * w; v += dx * w; }
      return [u, v];
    }
    /* both sources are scaled by their own ninetieth-percentile speed, so motion and colour look the same whichever is showing */
    var ref = 1;
    function calibrate() {
      var g = FEED.earth, arr = [], k, Q, f;
      if (g) { for (k = 0; k < g.u.length; k++) arr.push(Math.hypot(g.u[k], g.v[k])); }
      else { Q = rng(S.seed ^ 77); for (k = 0; k < 500; k++) { f = field(Math.asin(2 * Q() - 1), Q() * TAU); arr.push(Math.hypot(f[0], f[1])); } }
      arr.sort(function (a, b) { return a - b; }); ref = Math.max(1e-6, arr[Math.floor(arr.length * 0.9)]);
    }
    calibrate();
    function wind(lat, lon) { var f = field(lat, lon); return [f[1] / ref, f[0] / ref / Math.max(0.25, Math.cos(lat))]; }
    function speed(lat, lon) { var f = field(lat, lon); return Math.hypot(f[0], f[1]) / ref; }
    /* a ramp of colours for the wind, slow to fast: the quiet blue, the full blue, then the warm accent */
    function hex(h) { h = h.replace("#", ""); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
    var RAMP = (function () { var a = hex(S.col.sky), b = hex(S.col.blue), c0 = hex(S.col.accent), out = [], k, t, p, q, u; for (k = 0; k < 24; k++) { t = k / 23; if (t < 0.55) { u = t / 0.55; p = a; q = b; } else { u = (t - 0.55) / 0.45; p = b; q = c0; } out.push("rgb(" + Math.round(p[0] + (q[0] - p[0]) * u) + "," + Math.round(p[1] + (q[1] - p[1]) * u) + "," + Math.round(p[2] + (q[2] - p[2]) * u) + ")"); } return out; })();
    function tone(lat, lon) { return RAMP[Math.max(0, Math.min(23, Math.round(speed(lat, lon) / 1.25 * 23)))]; }
    /* particles: a short life, a fade in and out, and a trail of recent positions on the sphere */
    function spawn(p) { p.la = Math.asin(2 * R() - 1); p.lo = R() * TAU; p.age = 0; p.life = 50 + 70 * R(); p.h = [[p.la, p.lo]]; }
    for (i = 0; i < N; i++) { var p0 = {}; spawn(p0); p0.age = Math.floor(p0.life * R()); P.push(p0); }
    function trail(c, h, i0, i1, alpha) {
      var j, q, pen = false;
      if (i1 <= i0) return;
      c.globalAlpha = alpha; c.beginPath();
      for (j = i0; j <= i1; j++) { q = proj(h[j][0], h[j][1]); if (q[2] > 0.02) { if (pen) c.lineTo(q[0], q[1]); else c.moveTo(q[0], q[1]); pen = true; } else pen = false; }
      c.stroke();
    }
    return function () {
      var c = S.ctx, n, m, q, la, lo, steps = adv(S), dl, dx, dy, len, want;
      /* the scroll turns it slowly about its axis, gliding on a little after the scroll stops */
      want = S.ptr.inside ? (S.ptr.x / W - 0.5) * 2.6 : 0;
      if (first) { off = lastOff = want; first = false; }
      off += (want - off) * 0.0225;
      if (off !== lastOff) { phi += off - lastOff; lastOff = off; }
      /* a drag turns it about the same axis, by the part of the drag that runs across the axis; on release it coasts for a while */
      dx = S.dragDX; dy = S.dragDY; S.dragDX = S.dragDY = 0;
      if (!S.dragging && (S.velX || S.velY)) { dx = S.velX * (S.real / 16.7); dy = S.velY * (S.real / 16.7); S.velX *= 0.991; S.velY *= 0.991; if (Math.abs(S.velX) + Math.abs(S.velY) < 0.08) S.velX = S.velY = 0; }
      len = (dx * Math.cos(TILT) - dy * Math.sin(TILT)) / Rg;
      if (len) phi += len;
      M = mul(LEAN, rotAxis(0, 1, 0, phi)); S.M = M; S.phi = phi;
      if (fed !== (FEED.earth || null)) { calibrate(); fed = FEED.earth || null; }
      /* the sphere */
      c.fillStyle = S.col.wash; c.globalAlpha = 1; c.beginPath(); c.arc(cx, cy, Rg, 0, TAU); c.fill();
      c.lineWidth = 1; c.strokeStyle = S.col.sky;
      function arc(pts) { for (var j = 1; j < pts.length; j++) { q = pts[j]; var front = q[2] > 0; if (front !== (pts[j - 1][2] > 0)) continue; c.globalAlpha = front ? 0.5 : 0.07; c.beginPath(); c.moveTo(pts[j - 1][0], pts[j - 1][1]); c.lineTo(q[0], q[1]); c.stroke(); } }
      for (la = -60; la <= 60; la += 30) { var pts = []; for (lo = 0; lo <= 360; lo += 4) pts.push(proj(la * Math.PI / 180, lo * Math.PI / 180)); arc(pts); }
      for (lo = 0; lo < 360; lo += 30) { var mp = []; for (la = -90; la <= 90; la += 4) mp.push(proj(la * Math.PI / 180, lo * Math.PI / 180)); arc(mp); }
      /* the coastlines, when the page has loaded them: the near half firm, the far half faint */
      if (FEED.coast) {
        var D2R = Math.PI / 180, pass, line, prev;
        c.strokeStyle = S.col.blue; c.lineWidth = 1;
        for (pass = 0; pass < 2; pass++) {
          c.globalAlpha = pass ? 0.8 : 0.4; c.beginPath();
          for (n = 0; n < FEED.coast.length; n++) {
            line = FEED.coast[n]; prev = null;
            for (m = 0; m < line.length; m++) {
              q = proj(line[m][1] * D2R, line[m][0] * D2R);
              if (prev && q[2] > 0.02 && prev[2] > 0.02 && ((q[2] > 0.5) === !!pass)) { c.moveTo(prev[0], prev[1]); c.lineTo(q[0], q[1]); }
              prev = q;
            }
          }
          c.stroke();
        }
      }
      c.globalAlpha = 0.9; c.strokeStyle = S.col.sky; c.beginPath(); c.arc(cx, cy, Rg, 0, TAU); c.stroke();
      /* the axis: a short rod out of each pole, touching the rim. The poles lie on the rim, since the axis is tilted within the picture plane. */
      c.strokeStyle = S.col.blue; c.lineWidth = 1; c.globalAlpha = 0.8; c.beginPath();
      for (n = -1; n <= 1; n += 2) { q = proj(n * Math.PI / 2, 0); var ux = (q[0] - cx) / Rg, uy = (q[1] - cy) / Rg; c.moveTo(cx + ux * Rg, cy + uy * Rg); c.lineTo(cx + ux * Rg * 1.035, cy + uy * Rg * 1.035); }
      c.stroke();
      /* the wind: each particle moves by the clock alone, and its trail is drawn where the sphere now puts it */
      c.lineCap = "round"; c.lineWidth = 1.1;
      for (n = 0; n < N; n++) {
        var p = P[n];
        for (m = 0; m < steps; m++) { dl = wind(p.la, p.lo); p.la += dl[0] * 0.012; p.lo += dl[1] * 0.012; p.age++; p.h.push([p.la, p.lo]); if (p.h.length > HL) p.h.shift(); }
        if (p.age > p.life || Math.abs(p.la) > 1.45) { spawn(p); continue; }
        q = proj(p.la, p.lo); if (q[2] <= 0.02 || p.h.length < 2) continue;
        var fade = Math.min(1, p.age / (0.4 * p.life), (p.life - p.age) / (0.4 * p.life)); fade = fade * fade * (3 - 2 * fade);
        var alpha = (0.35 + 0.6 * q[2]) * fade, half = Math.floor(p.h.length / 2);
        c.strokeStyle = tone(p.la, p.lo);
        trail(c, p.h, 0, half, alpha * 0.45); trail(c, p.h, half, p.h.length - 1, alpha);
      }
      c.globalAlpha = 1; c.lineCap = "butt";
    };
  };

  /* ============================================================ background */
  /* A quiet field of contour lines behind the page. The hills move with the scroll
     position, never with time or the pointer. Mounted with drive: "scroll". */
  var SEGS = { 1: [[3, 2]], 2: [[2, 1]], 3: [[3, 1]], 4: [[0, 1]], 5: [[0, 1], [3, 2]], 6: [[0, 2]], 7: [[0, 3]], 8: [[0, 3]], 9: [[0, 2]], 10: [[0, 3], [2, 1]], 11: [[0, 1]], 12: [[3, 1]], 13: [[2, 1]], 14: [[3, 2]] };
  KINDS.field = function (S) {
    var R = rng(S.seed), W = S.W, H = S.H, K = Math.max(6, Math.round(W / H * 4)), B = [], i, cell = W < 600 ? 12 : 16, LEV = [];
    for (i = 0; i < K; i++) B.push({ x: (i + R()) / K, y: 0.1 + 0.8 * R(), s: (0.14 + 0.16 * R()) * H, a: 0.5 + 0.7 * R(), dx: (R() - 0.5) * 0.5, dy: 0.3 + 0.5 * R(), ph: R() * TAU });
    for (i = 0; i < 8; i++) LEV.push(0.2 + i * 0.14);
    return function () {
      var p = reduce ? 0.5 : S.page, c = S.ctx, nx = Math.ceil(W / cell), ny = Math.ceil(H / cell), ix, iy, n, l, G = new Float32Array((nx + 1) * (ny + 1)), P = [];
      for (n = 0; n < K; n++) { var b = B[n]; P.push({ x: W * (b.x + b.dx * Math.sin(p * Math.PI + b.ph)), y: H * (b.y + b.dy * (0.5 - p)), s: b.s, a: b.a }); }
      for (iy = 0; iy <= ny; iy++) for (ix = 0; ix <= nx; ix++) {
        var x = ix * cell, y = iy * cell, v = 0;
        for (n = 0; n < K; n++) { var q = P[n], dx = x - q.x, dy = y - q.y; v += q.a * Math.exp(-(dx * dx + dy * dy) / (2 * q.s * q.s)); }
        G[iy * (nx + 1) + ix] = v;
      }
      c.lineWidth = 1; c.strokeStyle = S.col.sky;
      for (l = 0; l < LEV.length; l++) {
        var L = LEV[l]; c.beginPath();
        for (iy = 0; iy < ny; iy++) for (ix = 0; ix < nx; ix++) {
          var k = iy * (nx + 1) + ix, v0 = G[k], v1 = G[k + 1], v2 = G[k + nx + 2], v3 = G[k + nx + 1];
          var code = (v0 > L ? 8 : 0) | (v1 > L ? 4 : 0) | (v2 > L ? 2 : 0) | (v3 > L ? 1 : 0);
          if (!code || code === 15) continue;
          var x0 = ix * cell, y0 = iy * cell;
          var E = [[x0 + cell * (L - v0) / (v1 - v0), y0], [x0 + cell, y0 + cell * (L - v1) / (v2 - v1)], [x0 + cell * (L - v3) / (v2 - v3), y0 + cell], [x0, y0 + cell * (L - v0) / (v3 - v0)]];
          var segs = SEGS[code];
          for (n = 0; n < segs.length; n++) { c.moveTo(E[segs[n][0]][0], E[segs[n][0]][1]); c.lineTo(E[segs[n][1]][0], E[segs[n][1]][1]); }
        }
        c.globalAlpha = 0.35 + 0.06 * l; c.stroke();
      }
      c.globalAlpha = 1;
    };
  };

  /* ================================================================= music */
  KINDS.overtones = function (S) {
    var R = rng(S.seed), ph = R() * TAU, lev = 4;
    return function (t) {
      var c = S.ctx, W = S.W, H = S.H, cy = H / 2, A = H * 0.27, cyc = W / (W < 500 ? 170 : 300), sh = ph + t * 0.0011, k, x, amp = [], y;
      lev += (1 + 6 * S.u(0.5) - lev) * 0.05;
      for (k = 1; k <= 7; k++) amp.push(clamp(lev - (k - 1), 0, 1) / k);
      c.lineWidth = 1; c.strokeStyle = S.col.sky; c.globalAlpha = 0.75;
      for (k = 1; k <= 7; k++) {
        if (amp[k - 1] < 0.01) continue;
        c.beginPath(); for (x = 0; x <= W; x += 3) { y = cy + A * amp[k - 1] * Math.sin(k * (x / W * cyc * TAU - sh)); if (x) c.lineTo(x, y); else c.moveTo(x, y); } c.stroke();
      }
      function sum(px) { var v = 0; for (var j = 1; j <= 7; j++) v += amp[j - 1] * Math.sin(j * (px / W * cyc * TAU - sh)); return cy + A * v; }
      c.globalAlpha = 1; c.strokeStyle = S.col.blue; c.lineWidth = 1.7; c.beginPath();
      for (x = 0; x <= W; x += 2) { if (x) c.lineTo(x, sum(x)); else c.moveTo(x, sum(x)); }
      c.stroke(); c.fillStyle = S.col.accent; dot(c, W * 0.72, sum(W * 0.72), 3.6);
    };
  };

  /* ================================================================= mount */
  var ALL = [];
  function place(f) {
    var b = f.plot.getBoundingClientRect(), vh = window.innerHeight || 1, y = window.scrollY || 0;
    var top = b.top + y, start = Math.max(0, top - vh), end = top + b.height;
    f.S.scroll = clamp((y - start) / Math.max(end - start, 1), 0, 1);
    f.S.page = clamp(y / Math.max(1, document.documentElement.scrollHeight - vh), 0, 1);
    if (f.drive === "scroll" || f.drive === "scroll-live") { f.S.ptr.inside = true; f.S.ptr.x = f.S.page * f.S.W; f.S.ptr.y = f.S.H / 2; f.awake = performance.now() + 1200; }
  }
  window.addEventListener("pointermove", function (e) {
    var now = performance.now();
    for (var i = 0; i < ALL.length; i++) {
      var f = ALL[i], b = f.plot.getBoundingClientRect(), S = f.S, m = lively() ? Math.max(24, Math.min(b.width, b.height) * 0.2) : 0;
      if (f.drive === "scroll") continue;
      if (f.drive === "scroll-live") {
        if (f.drag) { var ddx = e.clientX - f.drag.lastX, ddy = e.clientY - f.drag.lastY; S.dragDX += ddx; S.dragDY += ddy; S.velX = ddx; S.velY = ddy; f.drag.lastX = e.clientX; f.drag.lastY = e.clientY; f.awake = now + 600; }
        continue;
      }
      var inside = e.clientX > b.left - m && e.clientX < b.right + m && e.clientY > b.top - m && e.clientY < b.bottom + m;
      if (inside || S.ptr.inside) f.awake = now + 900;
      S.ptr.inside = inside; S.ptr.x = clamp(e.clientX - b.left, 0, b.width); S.ptr.y = clamp(e.clientY - b.top, 0, b.height);
    }
  }, { passive: true });
  window.addEventListener("pointerdown", function (e) {
    for (var i = 0; i < ALL.length; i++) {
      var f = ALL[i]; if (f.drive !== "scroll-live" || e.button) continue;
      var b = f.plot.getBoundingClientRect();
      if (e.clientX > b.left && e.clientX < b.right && e.clientY > b.top && e.clientY < b.bottom) { f.drag = { lastX: e.clientX, lastY: e.clientY }; f.S.dragging = true; f.S.velX = f.S.velY = 0; e.preventDefault(); }
    }
  });
  function release() { for (var i = 0; i < ALL.length; i++) { var f = ALL[i]; if (f.drag) { f.drag = null; f.S.dragging = false; f.awake = performance.now() + 15000; } } }
  window.addEventListener("pointerup", release); window.addEventListener("pointercancel", release);
  document.addEventListener("pointerleave", function () { var now = performance.now(); for (var i = 0; i < ALL.length; i++) { var g = ALL[i]; if (g.drive) continue; if (g.S.ptr.inside) g.awake = now + 900; g.S.ptr.inside = false; } });
  window.addEventListener("scroll", function () { for (var i = 0; i < ALL.length; i++) place(ALL[i]); }, { passive: true });
  var rz = 0;
  window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { for (var i = 0; i < ALL.length; i++) ALL[i].build(); }, 140); });
  /* one loop for every figure. A frozen figure is redrawn only while the pointer is on it and for a moment after. */
  function loop(now) {
    for (var i = 0; i < ALL.length; i++) {
      var f = ALL[i];
      if (!f.on || document.hidden) continue;
      if ((frozen() || f.drive === "scroll") && now > f.awake) continue;
      f.frame(now);
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  function mount(fig, opts) {
    opts = opts || {};
    var plot = fig.querySelector(".fig__plot"), canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true"); plot.textContent = ""; plot.appendChild(canvas);
    var S = { ctx: canvas.getContext("2d"), W: 0, H: 0, x0: 0, col: {}, dt: 0, k: 0, real: 16, t: 0, scroll: 0, page: 0, rest: 0.55, restX: 0.5, restY: 0.5, seed: opts.seed != null ? opts.seed : newSeed(), ptr: { x: 0, y: 0, inside: false }, dragging: false, dragDX: 0, dragDY: 0, velX: 0, velY: 0 };
    /* one number in [0,1]: the pointer if it is on the figure; otherwise a resting value (or, when lively, scroll or a slow breath) */
    S.u = function (rest) {
      if (opts.drive === "scroll" || opts.drive === "scroll-live") return reduce ? 0.5 : S.page;
      if (S.ptr.inside) return clamp(S.ptr.x / S.W, 0, 1);
      if (lively()) return opts.scroll ? S.scroll : 0.5 - 0.5 * Math.cos(S.t * 0.0004);
      return rest != null ? rest : S.rest;
    };
    /* a point to aim at: the pointer if it is on the figure; otherwise a resting point (or, when lively, a slow wander) */
    S.aim = function (a, b) {
      if (opts.drive === "scroll" || opts.drive === "scroll-live") { var pp = reduce ? 0.5 : S.page; return [S.W * (0.2 + 0.6 * pp), S.H * (0.3 + 0.4 * Math.sin(pp * Math.PI))]; }
      if (S.ptr.inside) return [S.ptr.x, S.ptr.y];
      if (lively()) { var ph = opts.scroll ? S.scroll * 5 : 0; return [S.W * (0.5 + 0.34 * Math.sin(S.t * 0.00023 * a + ph)), S.H * (0.5 + 0.3 * Math.sin(S.t * 0.00037 * b + 1 + ph * 0.7))]; }
      return [S.W * S.restX, S.H * S.restY];
    };
    var f = { fig: fig, plot: plot, S: S, kind: opts.kind || fig.getAttribute("data-fig") || "paths", drive: opts.drive || null, draw: null, on: true, last: 0, awake: 0 };

    f.build = function () {
      var cs = getComputedStyle(fig), dpr = Math.min(window.devicePixelRatio || 1, f.drive ? 1.5 : 2), Q = rng(S.seed ^ 0x9e3779b9);
      ["paper", "wash", "ink", "ink-2", "ink-3", "rule", "blue", "sky", "accent", "accent-2"].forEach(function (n) { S.col[n.replace("-", "")] = cs.getPropertyValue("--" + n).trim(); });
      S.col.b = S.col.accent2 || S.col.accent;                                        // second highlight
      S.col.alt = S.col.accent2 && S.col.accent2 !== S.col.accent ? S.col.accent2 : S.col.ink3;   // a third distinct colour
      S.rest = 0.45 + 0.25 * Q(); S.restX = 0.32 + 0.36 * Q(); S.restY = 0.32 + 0.36 * Q();
      S.W = plot.clientWidth; S.H = plot.clientHeight;
      if (!S.W || !S.H) return;
      canvas.width = Math.round(S.W * dpr); canvas.height = Math.round(S.H * dpr);
      S.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (opts.align) { var ref = document.querySelector(opts.align); S.x0 = ref ? Math.max(0, ref.getBoundingClientRect().left + (parseFloat(getComputedStyle(ref).paddingLeft) || 0) - plot.getBoundingClientRect().left) : 0; }
      else S.x0 = 0;
      if (!KINDS[f.kind]) f.kind = "paths";
      fig.setAttribute("data-kind", f.kind);
      place(f);
      S.k = 0; S.dt = 0;
      f.draw = KINDS[f.kind](S);
      f.last = 0; f.frame(performance.now());
    };
    f.frame = function (now) {
      if (!f.draw) return;
      var real = f.last ? Math.min(now - f.last, 50) : 16, sp = frozen() ? 0 : SPEED[LEVEL];
      f.last = now; S.real = real; S.dt = real * sp; S.k = S.dt / 16.7; S.t += S.dt;
      var keep = typeof f.draw.keep === "function" ? f.draw.keep() : false;
      if (!keep) S.ctx.clearRect(0, 0, S.W, S.H);
      S.ctx.globalAlpha = 1; S.ctx.setLineDash([]);
      f.draw(S.t);
    };
    plot.addEventListener("click", function () { if (f.drive) return; S.seed = newSeed(); f.build(); f.awake = performance.now() + 900; });
    if ("IntersectionObserver" in window) new IntersectionObserver(function (en) { f.on = en[0].isIntersecting; if (f.on) f.last = 0; }, { rootMargin: "80px" }).observe(plot);
    ALL.push(f);
    f.build();
    fig._fig = f;
    return { setKind: function (k) { if (KINDS[k] && k !== f.kind) { f.kind = k; f.build(); } }, redraw: f.build, state: S };
  }

  window.Fig = {
    build: 5, mount: mount, meta: META, fed: FEED,
    feed: function (name, data) { FEED[name] = data || null; for (var i = 0; i < ALL.length; i++) if (ALL[i].kind === name) ALL[i].awake = performance.now() + 1200; },
    motion: function (level) { if (level && SPEED[level] !== undefined) { LEVEL = level; if (level !== "still") reduce = false; var now = performance.now(); for (var i = 0; i < ALL.length; i++) { ALL[i].last = 0; ALL[i].awake = now + 300; } } return LEVEL; },
    still: function () { return frozen(); }
  };
})();
