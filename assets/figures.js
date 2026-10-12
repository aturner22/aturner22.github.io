(function () {
  "use strict";
  var TAU = Math.PI * 2, D2R = Math.PI / 180, FEED = {}, ALL = [];
  var reduce = !!(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches), paused = false;
  function rng(seed) { var a = seed >>> 0; return function () { a = (a + 0x6D2B79F5) | 0; var t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  var SEGS = { 1: [[3, 2]], 2: [[2, 1]], 3: [[3, 1]], 4: [[0, 1]], 5: [[0, 1], [3, 2]], 6: [[0, 2]], 7: [[0, 3]], 8: [[0, 3]], 9: [[0, 2]], 10: [[0, 3], [2, 1]], 11: [[0, 1]], 12: [[3, 1]], 13: [[2, 1]], 14: [[3, 2]] };
  function field(S) {
    var R = rng(S.seed), W = S.W, H = S.H, K = Math.max(6, Math.round(W / H * 4)), cell = W < 600 ? 12 : 16, B = [], i;
    for (i = 0; i < K; i++) B.push({ x: (i + R()) / K, y: 0.1 + 0.8 * R(), s: (0.14 + 0.16 * R()) * H, a: 0.5 + 0.7 * R(), dx: (R() - 0.5) * 0.5, dy: 0.3 + 0.5 * R(), ph: R() * TAU });
    return function () {
      var p = reduce ? 0.5 : S.page, c = S.ctx, nx = Math.ceil(W / cell), ny = Math.ceil(H / cell), G = new Float32Array((nx + 1) * (ny + 1)), P = [], ix, iy, n, l;
      for (n = 0; n < K; n++) { var b = B[n]; P.push({ x: W * (b.x + b.dx * Math.sin(p * Math.PI + b.ph)), y: H * (b.y + b.dy * (0.5 - p)), s: b.s, a: b.a }); }
      for (iy = 0; iy <= ny; iy++) for (ix = 0; ix <= nx; ix++) {
        var x = ix * cell, y = iy * cell, v = 0;
        for (n = 0; n < K; n++) { var q = P[n], dx = x - q.x, dy = y - q.y; v += q.a * Math.exp(-(dx * dx + dy * dy) / (2 * q.s * q.s)); }
        G[iy * (nx + 1) + ix] = v;
      }
      c.lineWidth = 1; c.strokeStyle = S.col.sky;
      for (l = 0; l < 8; l++) {
        var L = 0.2 + l * 0.14; c.beginPath();
        for (iy = 0; iy < ny; iy++) for (ix = 0; ix < nx; ix++) {
          var k = iy * (nx + 1) + ix, v0 = G[k], v1 = G[k + 1], v2 = G[k + nx + 2], v3 = G[k + nx + 1];
          var code = (v0 > L ? 8 : 0) | (v1 > L ? 4 : 0) | (v2 > L ? 2 : 0) | (v3 > L ? 1 : 0);
          if (!code || code === 15) continue;
          var x0 = ix * cell, y0 = iy * cell, E = [[x0 + cell * (L - v0) / (v1 - v0), y0], [x0 + cell, y0 + cell * (L - v1) / (v2 - v1)], [x0 + cell * (L - v3) / (v2 - v3), y0 + cell], [x0, y0 + cell * (L - v0) / (v3 - v0)]];
          SEGS[code].forEach(function (s) { c.moveTo(E[s[0]][0], E[s[0]][1]); c.lineTo(E[s[1]][0], E[s[1]][1]); });
        }
        c.globalAlpha = 0.35 + 0.06 * l; c.stroke();
      }
      c.globalAlpha = 1;
    };
  }

  function earth(S) {
    var R = rng(S.seed), W = S.W, H = S.H, Rg = Math.min(W, H) * 0.47, cx = W / 2, cy = H / 2, N = W < 400 ? 800 : W < 600 ? 1400 : 2000, P = [], i;
    var TILT = -23.44 * D2R, LEAN = rotY(0, 0, 1, TILT), phi = R() * TAU, M, acc = 0, fed = null, ref = 1;
    var wph = [R() * TAU, R() * TAU, R() * TAU], CYC = [];
    for (i = 0; i < 5; i++) { var hemi = i % 2 ? -1 : 1; CYC.push({ la: hemi * (0.85 + 0.25 * R()), lo: R() * TAU, s: hemi, k: 9 + 6 * R(), r2: 0.05 + 0.04 * R() }); }
    function rotY(ax, ay, az, th) { var c0 = Math.cos(th), s0 = Math.sin(th), t = 1 - c0; return [t * ax * ax + c0, t * ax * ay - s0 * az, t * ax * az + s0 * ay, t * ax * ay + s0 * az, t * ay * ay + c0, t * ay * az - s0 * ax, t * ax * az - s0 * ay, t * ay * az + s0 * ax, t * az * az + c0]; }
    function mul(A, B) { var C = [], r, k; for (r = 0; r < 3; r++) for (k = 0; k < 3; k++) C.push(A[r * 3] * B[k] + A[r * 3 + 1] * B[3 + k] + A[r * 3 + 2] * B[6 + k]); return C; }
    function proj(lat, lon) { var cl = Math.cos(lat), x = cl * Math.sin(lon), y = Math.sin(lat), z = cl * Math.cos(lon); return [cx + Rg * (M[0] * x + M[1] * y + M[2] * z), cy - Rg * (M[3] * x + M[4] * y + M[5] * z), M[6] * x + M[7] * y + M[8] * z]; }
    function real(lat, lon) {
      var g = FEED.earth, fi = clamp((lat / D2R - g.lat0) / g.dlat, 0, g.nlat - 1.001), fj = (((lon / D2R) % 360 + 540) % 360 - 180 - g.lon0) / g.dlon;
      fj = (fj % g.nlon + g.nlon) % g.nlon;
      var i0 = Math.floor(fi), j0 = Math.floor(fj), i1 = i0 + 1, j1 = (j0 + 1) % g.nlon, a = fi - i0, b = fj - j0, n = g.nlon;
      function at(arr) { return (arr[i0 * n + j0] * (1 - a) + arr[i1 * n + j0] * a) * (1 - b) + (arr[i0 * n + j1] * (1 - a) + arr[i1 * n + j1] * a) * b; }
      return [at(g.u), at(g.v)];
    }
    function synthetic(lat, lon) {
      var a = Math.abs(lat), s = lat < 0 ? -1 : 1, n, cc, dx, dy, w;
      var trade = -6 * Math.exp(-Math.pow((a - 0.25) / 0.2, 2)), west = 11 * Math.exp(-Math.pow((a - 0.8) / 0.22, 2)), polar = -3 * Math.exp(-Math.pow((a - 1.35) / 0.15, 2));
      var wave = 0.45 * Math.sin(4 * lon + wph[0] + s * 0.8) + 0.25 * Math.sin(6 * lon + wph[1]);
      var u = trade + west * (1 + 0.35 * wave) + polar, v = 0.55 * west * s * Math.cos(4 * lon + wph[0] + s * 0.8) + 1.5 * Math.sin(3 * lon + wph[2]) * Math.cos(lat);
      for (n = 0; n < CYC.length; n++) { cc = CYC[n]; dx = Math.atan2(Math.sin(lon - cc.lo), Math.cos(lon - cc.lo)) * Math.cos(lat); dy = lat - cc.la; w = cc.s * cc.k * Math.exp(-(dx * dx + dy * dy) / cc.r2); u -= dy * w; v += dx * w; }
      return [u, v];
    }
    function wind(lat, lon) { return FEED.earth ? real(lat, lon) : synthetic(lat, lon); }
    function calibrate() {
      var g = FEED.earth, arr = [], k, Q, f;
      if (g) for (k = 0; k < g.u.length; k++) arr.push(Math.hypot(g.u[k], g.v[k]));
      else { Q = rng(S.seed ^ 77); for (k = 0; k < 500; k++) { f = synthetic(Math.asin(2 * Q() - 1), Q() * TAU); arr.push(Math.hypot(f[0], f[1])); } }
      arr.sort(function (a, b) { return a - b; }); ref = Math.max(1e-6, arr[Math.floor(arr.length * 0.9)]);
    }
    function hex(h) { h = h.replace("#", ""); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2]; return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
    var RAMP = [], stops = [hex(S.col.sky), hex(S.col.blue), hex(S.col.accent)];
    for (i = 0; i < 24; i++) { var t = i / 23, u = t < 0.55 ? t / 0.55 : (t - 0.55) / 0.45, p = stops[t < 0.55 ? 0 : 1], q = stops[t < 0.55 ? 1 : 2]; RAMP.push("rgb(" + [0, 1, 2].map(function (j) { return Math.round(p[j] + (q[j] - p[j]) * u); }).join(",") + ")"); }
    function spawn(p) { p.la = Math.asin(2 * R() - 1); p.lo = R() * TAU; p.age = 0; p.life = 50 + 70 * R(); p.h = [[p.la, p.lo]]; }
    function step(p) { var f = wind(p.la, p.lo); p.la += f[1] / ref * 0.012; p.lo += f[0] / ref / Math.max(0.25, Math.cos(p.la)) * 0.012; p.age++; p.h.push([p.la, p.lo]); if (p.h.length > 12) p.h.shift(); }
    function warm() { P.forEach(function (p) { for (var m = 0; m < 12; m++) step(p); }); }
    for (i = 0; i < N; i++) { var p0 = {}; spawn(p0); p0.age = Math.floor(p0.life * R()); P.push(p0); }
    function trail(c, h, i0, i1, alpha) {
      var j, q, pen = false;
      c.globalAlpha = alpha; c.beginPath();
      for (j = i0; j <= i1; j++) { q = proj(h[j][0], h[j][1]); if (q[2] > 0.02) { c[pen ? "lineTo" : "moveTo"](q[0], q[1]); pen = true; } else pen = false; }
      c.stroke();
    }
    function arcs(c, pts) { for (var j = 1; j < pts.length; j++) { var q = pts[j], front = q[2] > 0; if (front !== (pts[j - 1][2] > 0)) continue; c.globalAlpha = front ? 0.5 : 0.07; c.beginPath(); c.moveTo(pts[j - 1][0], pts[j - 1][1]); c.lineTo(q[0], q[1]); c.stroke(); } }
    calibrate(); warm();
    return function () {
      var c = S.ctx, n, m, q, la, lo, pts, dx, dy;
      dx = S.dragDX; dy = S.dragDY; S.dragDX = S.dragDY = 0;
      if (!S.dragging && (S.velX || S.velY)) { dx = S.velX * S.real / 16.7; dy = S.velY * S.real / 16.7; S.velX *= 0.991; S.velY *= 0.991; if (Math.abs(S.velX) + Math.abs(S.velY) < 0.08) S.velX = S.velY = 0; }
      phi += (dx * Math.cos(TILT) - dy * Math.sin(TILT)) / Rg;
      M = mul(LEAN, rotY(0, 1, 0, phi)); S.phi = phi;
      if (fed !== (FEED.earth || null)) { fed = FEED.earth || null; calibrate(); warm(); }
      c.fillStyle = S.col.wash; c.globalAlpha = 1; c.beginPath(); c.arc(cx, cy, Rg, 0, TAU); c.fill();
      c.lineWidth = 1; c.strokeStyle = S.col.sky;
      for (la = -60; la <= 60; la += 30) { pts = []; for (lo = 0; lo <= 360; lo += 4) pts.push(proj(la * D2R, lo * D2R)); arcs(c, pts); }
      for (lo = 0; lo < 360; lo += 30) { pts = []; for (la = -90; la <= 90; la += 4) pts.push(proj(la * D2R, lo * D2R)); arcs(c, pts); }
      if (FEED.coast) {
        c.strokeStyle = S.col.blue;
        for (var pass = 0; pass < 2; pass++) {
          c.globalAlpha = pass ? 0.8 : 0.4; c.beginPath();
          FEED.coast.forEach(function (line) { var prev = null; line.forEach(function (pt) { var q = proj(pt[1] * D2R, pt[0] * D2R); if (prev && q[2] > 0.02 && prev[2] > 0.02 && (q[2] > 0.5) === !!pass) { c.moveTo(prev[0], prev[1]); c.lineTo(q[0], q[1]); } prev = q; }); });
          c.stroke();
        }
      }
      c.globalAlpha = 0.9; c.strokeStyle = S.col.sky; c.beginPath(); c.arc(cx, cy, Rg, 0, TAU); c.stroke();
      c.globalAlpha = 0.8; c.strokeStyle = S.col.blue; c.beginPath();
      for (n = -1; n <= 1; n += 2) { q = proj(n * Math.PI / 2, 0); var ux = (q[0] - cx) / Rg, uy = (q[1] - cy) / Rg; c.moveTo(cx + ux * Rg, cy + uy * Rg); c.lineTo(cx + ux * Rg * 1.035, cy + uy * Rg * 1.035); }
      c.stroke();
      acc += 0.9 * S.k; var steps = Math.floor(acc); acc -= steps;
      c.lineCap = "round"; c.lineWidth = 1.1;
      for (n = 0; n < N; n++) {
        var p = P[n];
        for (m = 0; m < steps; m++) step(p);
        if (p.age > p.life || Math.abs(p.la) > 1.45) { spawn(p); continue; }
        q = proj(p.la, p.lo); if (q[2] <= 0.02 || p.h.length < 2) continue;
        var fade = Math.min(1, p.age / (0.4 * p.life), (p.life - p.age) / (0.4 * p.life)); fade = fade * fade * (3 - 2 * fade);
        var alpha = (0.35 + 0.6 * q[2]) * fade, half = Math.floor(p.h.length / 2), w = wind(p.la, p.lo);
        c.strokeStyle = RAMP[clamp(Math.round(Math.hypot(w[0], w[1]) / ref / 1.25 * 23), 0, 23)];
        trail(c, p.h, 0, half, alpha * 0.45); trail(c, p.h, half, p.h.length - 1, alpha);
      }
      c.globalAlpha = 1; c.lineCap = "butt"; S.btn = null;
      if (FEED.caption && window.innerWidth > 1120) {
        var cr = Rg + 14, cth, cw = [], ctot = 0;
        c.font = "400 15px \"Libertinus Sans\", sans-serif"; c.textAlign = "center"; c.textBaseline = "alphabetic"; c.fillStyle = S.col.ink; c.strokeStyle = S.col.ink; c.globalAlpha = 0.7;
        for (n = 0; n < FEED.caption.length; n++) { cw.push(c.measureText(FEED.caption[n]).width); ctot += cw[n]; }
        cth = 76 * D2R + ctot / cr;
        for (n = 0; n < FEED.caption.length; n++) {
          cth -= cw[n] / 2 / cr;
          c.save(); c.translate(cx + cr * Math.cos(cth), cy + cr * Math.sin(cth)); c.rotate(cth - Math.PI / 2); c.fillText(FEED.caption[n], 0, 0); c.restore();
          cth -= cw[n] / 2 / cr;
        }
        cth = 76 * D2R - 16 / cr;
        S.btn = { x: cx + (cr - 4) * Math.cos(cth), y: cy + (cr - 4) * Math.sin(cth), r: 12 };
        c.lineWidth = 1.2; c.beginPath(); c.arc(S.btn.x, S.btn.y, 6.5, 0, TAU); c.stroke();
        if (paused || reduce) { c.beginPath(); c.moveTo(S.btn.x - 2, S.btn.y - 3.2); c.lineTo(S.btn.x - 2, S.btn.y + 3.2); c.lineTo(S.btn.x + 3.4, S.btn.y); c.closePath(); c.fill(); }
        else { c.lineWidth = 1.5; c.beginPath(); c.moveTo(S.btn.x - 2, S.btn.y - 3); c.lineTo(S.btn.x - 2, S.btn.y + 3); c.moveTo(S.btn.x + 2, S.btn.y - 3); c.lineTo(S.btn.x + 2, S.btn.y + 3); c.stroke(); }
        c.globalAlpha = 1;
      }
    };
  }
  var KINDS = { field: field, earth: earth };

  function page() { return clamp((window.scrollY || 0) / Math.max(1, document.documentElement.scrollHeight - window.innerHeight), 0, 1); }
  function mount(canvas) {
    var kind = canvas.getAttribute("data-fig"), live = kind === "earth";
    if (!KINDS[kind]) return null;
    var S = { ctx: canvas.getContext("2d"), W: 0, H: 0, col: {}, k: 0, real: 16, page: page(), seed: (Math.random() * 4294967296) >>> 0, dragging: false, dragDX: 0, dragDY: 0, velX: 0, velY: 0, phi: 0 };
    var f = { canvas: canvas, S: S, live: live, draw: null, last: 0, awake: 0, drag: null };
    f.build = function () {
      var cs = getComputedStyle(canvas), dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      ["wash", "blue", "sky", "accent", "ink"].forEach(function (n) { S.col[n] = cs.getPropertyValue("--" + n).trim(); });
      S.W = canvas.clientWidth; S.H = canvas.clientHeight;
      if (!S.W || !S.H) return;
      canvas.width = Math.round(S.W * dpr); canvas.height = Math.round(S.H * dpr); S.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      S.page = page(); f.draw = KINDS[kind](S); f.last = 0; f.frame(performance.now());
    };
    f.frame = function (now) {
      var real = f.last ? Math.min(now - f.last, 50) : 16;
      f.last = now; S.real = real; S.k = paused || reduce ? 0 : real * 0.3 / 16.7;
      S.ctx.clearRect(0, 0, S.W, S.H); S.ctx.globalAlpha = 1; f.draw();
    };
    ALL.push(f); f.build(); canvas._fig = f;
    if (live) requestAnimationFrame(function () { if (!paused && !reduce) S.velX = Math.random() < 0.5 ? -0.8 : 0.8; });
    return f;
  }
  function scrolled() { return clamp(window.scrollY || 0, 0, Math.max(0, document.documentElement.scrollHeight - window.innerHeight)); }
  function spin(dy) { var now = performance.now(); ALL.forEach(function (f) { if (f.live && !f.drag) { f.S.velX = clamp(f.S.velX + dy * 0.004, -40, 40); f.awake = now + 1200; } }); }
  var lastY = scrolled(), ty = 0;
  window.addEventListener("scroll", function () { var p = page(), y = scrolled(), now = performance.now(); spin(y - lastY); lastY = y; ALL.forEach(function (f) { f.S.page = p; f.awake = now + 1200; }); }, { passive: true });
  function turn(dy) { var y = scrolled(), end = document.documentElement.scrollHeight - window.innerHeight - 1; if ((y <= 0 && dy < 0) || (y >= end && dy > 0)) spin(dy); }
  window.addEventListener("wheel", function (e) { turn(e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY); }, { passive: true });
  window.addEventListener("touchstart", function (e) { ty = e.touches[0].clientY; }, { passive: true });
  window.addEventListener("touchmove", function (e) { var y = e.touches[0].clientY; turn(ty - y); ty = y; }, { passive: true });
  window.addEventListener("pointerdown", function (e) {
    ALL.forEach(function (f) { if (!f.live || e.button) return; var b = f.canvas.getBoundingClientRect(), x = e.clientX - b.left, y = e.clientY - b.top; if (x < 0 || x > b.width || y < 0 || y > b.height) return; e.preventDefault(); if (f.S.btn && Math.hypot(x - f.S.btn.x, y - f.S.btn.y) < f.S.btn.r) { f.tap = true; return; } f.drag = { x: e.clientX, y: e.clientY }; f.S.dragging = true; f.S.velX = f.S.velY = 0; });
  });
  window.addEventListener("pointermove", function (e) {
    ALL.forEach(function (f) { if (f.live && f.S.btn) { var b = f.canvas.getBoundingClientRect(); document.documentElement.style.cursor = Math.hypot(e.clientX - b.left - f.S.btn.x, e.clientY - b.top - f.S.btn.y) < f.S.btn.r ? "pointer" : ""; } if (!f.drag) return; var dx = e.clientX - f.drag.x, dy = e.clientY - f.drag.y; f.S.dragDX += dx; f.S.dragDY += dy; f.S.velX = dx; f.S.velY = dy; f.drag.x = e.clientX; f.drag.y = e.clientY; f.awake = performance.now() + 600; });
  }, { passive: true });
  function release() { ALL.forEach(function (f) { if (f.tap) { f.tap = false; f.canvas.dispatchEvent(new Event("pause")); } if (f.drag) { f.drag = null; f.S.dragging = false; f.awake = performance.now() + 15000; } }); }
  window.addEventListener("pointerup", release); window.addEventListener("pointercancel", release);
  var rz; window.addEventListener("resize", function () { clearTimeout(rz); rz = setTimeout(function () { ALL.forEach(function (f) { f.build(); }); }, 140); });
  (function loop(now) {
    ALL.forEach(function (f) { if (document.hidden || !f.draw) return; if ((!f.live || paused || reduce) && now > f.awake) return; f.frame(now); });
    requestAnimationFrame(loop);
  })(performance.now());

  window.Fig = {
    mount: mount, fed: FEED,
    feed: function (name, data) { FEED[name] = data || null; var now = performance.now(); ALL.forEach(function (f) { f.awake = now + 1200; }); },
    pause: function (on, byVisitor) { paused = !!on; if (!paused && byVisitor) reduce = false; var now = performance.now(); ALL.forEach(function (f) { f.last = 0; f.awake = now + 300; }); return paused || reduce; }
  };
})();
