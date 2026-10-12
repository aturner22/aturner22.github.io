(function () {
  "use strict";
  var d = document.documentElement, figs = [];
  function store(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function read(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function redraw() { figs.forEach(function (f) { f.build(); }); }

  var mq = window.matchMedia ? matchMedia("(prefers-color-scheme: dark)") : null;
  document.getElementById("theme").addEventListener("click", function () {
    var dark = (d.getAttribute("data-theme") || (mq && mq.matches ? "dark" : "light")) === "dark", next = dark ? "light" : "dark";
    if (mq && (next === "dark") === mq.matches) { d.removeAttribute("data-theme"); store("theme", null); } else { d.setAttribute("data-theme", next); store("theme", next); }
    redraw();
  });
  if (mq && mq.addEventListener) mq.addEventListener("change", redraw);

  if (!window.Fig) return;
  [].forEach.call(document.querySelectorAll("canvas[data-fig]"), function (c) { var f = Fig.mount(c); if (f) figs.push(f); });
  window.addEventListener("load", redraw);
  var btn = document.getElementById("pause"), globe = document.querySelector("canvas[data-fig=earth]");
  function showPaused(on) { if (on) d.setAttribute("data-motion", "still"); else d.removeAttribute("data-motion"); btn.setAttribute("aria-pressed", on ? "true" : "false"); btn.setAttribute("aria-label", on ? "Resume the animation" : "Pause the animation"); }
  function setPaused(on) { on = Fig.pause(on, true); store("motion", on ? "still" : null); showPaused(on); }
  showPaused(Fig.pause(read("motion") === "still"));
  btn.addEventListener("click", function () { setPaused(btn.getAttribute("aria-pressed") !== "true"); });
  if (globe) globe.addEventListener("pause", function () { setPaused(d.getAttribute("data-motion") !== "still"); });

  if (!globe || !window.fetch) return;
  fetch("/assets/coastlines.json").then(function (r) { return r.json(); }).then(function (j) { Fig.feed("coast", j.lines); }).catch(function () {});
  function useWinds(g) {
    Fig.feed("earth", { nlat: 17, nlon: 24, lat0: -80, dlat: 10, lon0: -180, dlon: 15, u: new Float32Array(g.u), v: new Float32Array(g.v) });
    var t = /T(\d\d:\d\d)/.exec(g.time || "");
    Fig.feed("caption", t ? "Surface wind at " + t[1] + " UTC today" : "Surface wind now");
    document.getElementById("winds").hidden = false;
  }
  var kept = null; try { kept = JSON.parse(sessionStorage.getItem("winds")); } catch (e) {}
  if (kept && Date.now() - kept.at < 3600000 && kept.u && kept.u.length === 408) return useWinds(kept);
  var lats = [], lons = [], la, lo;
  for (la = -80; la <= 80; la += 10) for (lo = -180; lo < 180; lo += 15) { lats.push(la); lons.push(lo); }
  var ctl = window.AbortController ? new AbortController() : null;
  if (ctl) setTimeout(function () { ctl.abort(); }, 8000);
  fetch("https://api.open-meteo.com/v1/forecast?latitude=" + lats + "&longitude=" + lons + "&current=wind_speed_10m,wind_direction_10m&wind_speed_unit=ms&timezone=UTC", { signal: ctl && ctl.signal, credentials: "omit", referrerPolicy: "no-referrer" })
    .then(function (r) { return r.ok ? r.json() : null; })
    .then(function (rows) {
      if (!Array.isArray(rows) || rows.length !== lats.length) return;
      var g = { u: [], v: [], time: rows[0].current.time, at: Date.now() };
      rows.forEach(function (row) { var s = +row.current.wind_speed_10m || 0, a = (+row.current.wind_direction_10m || 0) * Math.PI / 180; g.u.push(Math.round(-s * Math.sin(a) * 100) / 100); g.v.push(Math.round(-s * Math.cos(a) * 100) / 100); });
      try { sessionStorage.setItem("winds", JSON.stringify(g)); } catch (e) {}
      useWinds(g);
    })
    .catch(function () {});
})();
