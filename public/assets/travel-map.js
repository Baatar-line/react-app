/* Flat "routes to Mongolia" world map — Air-Canada-style arc map.
   The landmass is a pre-baked static image (public/assets/travel-map-land.svg,
   generated once — see gen-travel-map-land.mjs) rather than ~180 individually
   rendered/selectable country shapes: it's a backdrop, not a chorochromatic map.
   Only the routes/dots are computed live, via window.d3's pure projection math
   (no topojson or network fetch needed for that).
   window.renderTravelMap(container) builds the map once. */
(function () {
  var UB = { name: "Улаанбаатар", lng: 106.92, lat: 47.92 };

  // Top 20 source countries of tourists to Mongolia.
  // Ranks 1–7 = official 2024 figures (China 168,298 … Germany 12,405).
  // Ranks 8–20 = representative estimates of Mongolia's established secondary markets.
  var ORIGINS = [
    { rank: 1,  country: "Хятад",      city: "Бээжин",     lng: 116.4, lat: 39.9,  v: 168298, side: "e" },
    { rank: 2,  country: "Орос",       city: "Москва",     lng: 37.6,  lat: 55.75, v: 141927, side: "w" },
    { rank: 3,  country: "Өмнөд Солонгос", city: "Сөүл",   lng: 126.98,lat: 37.57, v: 101279, side: "e" },
    { rank: 4,  country: "Япон",       city: "Токио",      lng: 139.69,lat: 35.69, v: 24419,  side: "e" },
    { rank: 5,  country: "АНУ",        city: "Вашингтон",  lng: -77.04,lat: 38.9,  v: 18838,  side: "w" },
    { rank: 6,  country: "Казахстан",  city: "Алматы",     lng: 76.9,  lat: 43.24, v: 16264,  side: "w" },
    { rank: 7,  country: "Герман",     city: "Берлин",     lng: 13.4,  lat: 52.52, v: 12405,  side: "w" },
    { rank: 8,  country: "Франц",      city: "Парис",      lng: 2.35,  lat: 48.86, v: 9500,   side: "w", est: true },
    { rank: 9,  country: "Их Британи", city: "Лондон",     lng: -0.13, lat: 51.51, v: 7800,   side: "w", est: true },
    { rank: 10, country: "Австрали",   city: "Сидней",     lng: 151.2, lat: -33.87,v: 6500,   side: "e", est: true },
    { rank: 11, country: "Швейцарь",   city: "Берн",       lng: 7.45,  lat: 46.95, v: 5200,   side: "w", est: true },
    { rank: 12, country: "Итали",      city: "Ром",        lng: 12.5,  lat: 41.9,  v: 4800,   side: "w", est: true },
    { rank: 13, country: "Нидерланд",  city: "Амстердам",  lng: 4.9,   lat: 52.37, v: 4200,   side: "w", est: true },
    { rank: 14, country: "Канад",      city: "Оттава",     lng: -75.7, lat: 45.42, v: 3900,   side: "w", est: true },
    { rank: 15, country: "Чех",        city: "Прага",      lng: 14.42, lat: 50.08, v: 3400,   side: "w", est: true },
    { rank: 16, country: "Турк",       city: "Истанбул",   lng: 28.98, lat: 41.01, v: 3100,   side: "w", est: true },
    { rank: 17, country: "Энэтхэг",    city: "Нью-Дели",   lng: 77.21, lat: 28.61, v: 2900,   side: "e", est: true },
    { rank: 18, country: "Польш",      city: "Варшав",     lng: 21.01, lat: 52.23, v: 2700,   side: "w", est: true },
    { rank: 19, country: "Бельги",     city: "Брюссель",   lng: 4.35,  lat: 50.85, v: 2400,   side: "w", est: true },
    { rank: 20, country: "Испани",     city: "Мадрид",     lng: -3.7,  lat: 40.42, v: 2200,   side: "w", est: true }
  ];

  var LAND_IMAGE_URL = "/assets/travel-map-land.svg";
  var W = 1240, H = 700;

  function esc(s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); }

  window.renderTravelMap = function (container) {
    if (!container || container.__built) return;
    container.__built = true;
    var d3 = window.d3;
    if (!d3) { container.__built = false; setTimeout(function () { window.renderTravelMap(container); }, 150); return; }

    try {
      var proj = d3.geoNaturalEarth1().rotate([-100, 0]);
      proj.fitExtent([[16, 20], [W - 16, H - 40]], { type: "Sphere" });

      var svg = [];
      svg.push('<svg viewBox="0 0 ' + W + ' ' + H + '" width="100%" style="display:block" xmlns="http://www.w3.org/2000/svg">');
      // backdrop — a single flat pre-rendered map image, not per-country shapes
      svg.push('<image href="' + LAND_IMAGE_URL + '" x="0" y="0" width="' + W + '" height="' + H + '" preserveAspectRatio="none" />');

      var hub = proj([UB.lng, UB.lat]);
      var maxV = ORIGINS[0].v;

      // Smooth screen-space arcs. Great-circle interpolation wraps over the pole on a
      // Mongolia-centred projection (long routes shoot to the top edge), so instead we
      // draw a quadratic Bézier between the projected endpoints, bowing toward the top —
      // the clean "flight map" look, with no pole artefacts.
      svg.push('<defs><filter id="arcGlow" x="-20%" y="-20%" width="140%" height="140%">'
        + '<feGaussianBlur stdDeviation="1.4" /></filter></defs>');

      var arcs = [];        // glow underlay (drawn first, behind)
      var arcsTop = [];     // crisp arc on top

      ORIGINS.slice().sort(function (a, b) { return a.v - b.v; }).forEach(function (o) {
        var p0 = proj([o.lng, o.lat]);
        if (!p0) return;
        var x0 = p0[0], y0 = p0[1], x1 = hub[0], y1 = hub[1];
        var dx = x1 - x0, dy = y1 - y0;
        var dist = Math.hypot(dx, dy) || 1;
        // unit perpendicular, forced to point "up" (toward the top of the map)
        var nx = -dy / dist, ny = dx / dist;
        if (ny > 0) { nx = -nx; ny = -ny; }
        var bow = Math.min(dist * 0.20, 96);          // curvature, capped for long routes
        var cx = (x0 + x1) / 2 + nx * bow;
        var cy = (y0 + y1) / 2 + ny * bow;
        var d = 'M' + x0.toFixed(1) + ',' + y0.toFixed(1)
          + ' Q' + cx.toFixed(1) + ',' + cy.toFixed(1) + ' ' + x1.toFixed(1) + ',' + y1.toFixed(1);

        var sw = 0.7 + Math.sqrt(o.v / maxV) * 2.3;   // thickness by volume
        var op = o.est ? 0.42 : 0.8;
        var dash = o.est ? ' stroke-dasharray="1 5"' : '';
        // soft glow underlay
        arcs.push('<path d="' + d + '" stroke-width="' + (sw + 1.4).toFixed(2)
          + '" stroke-opacity="' + (op * 0.28).toFixed(2) + '" filter="url(#arcGlow)" />');
        // crisp arc
        arcsTop.push('<path d="' + d + '" stroke-width="' + sw.toFixed(2)
          + '" stroke-opacity="' + op + '"' + dash + ' />');
      });

      svg.push('<g fill="none" stroke="#e2685c" stroke-linecap="round">');
      svg.push(arcs.join(''));
      svg.push(arcsTop.join(''));
      svg.push('</g>');

      // origin dots + labels
      ORIGINS.forEach(function (o) {
        var p = proj([o.lng, o.lat]);
        if (!p) return;
        var toRight = o.side === "e";
        var dx = toRight ? 7 : -7;
        var anchor = toRight ? "start" : "end";
        svg.push('<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="2.6" fill="#e2685c" />');
        svg.push('<text x="' + (p[0] + dx).toFixed(1) + '" y="' + (p[1] + 3.2).toFixed(1) + '" text-anchor="' + anchor + '" font-family="ui-monospace,SFMono-Regular,Menlo,monospace" font-size="10.5" fill="rgba(242,237,227,.75)">' + esc(o.city) + '</text>');
      });

      // hub — Ulaanbaatar
      svg.push('<circle cx="' + hub[0].toFixed(1) + '" cy="' + hub[1].toFixed(1) + '" r="9" fill="none" stroke="#e2685c" stroke-width="1.2" stroke-opacity="0.7" />');
      svg.push('<circle cx="' + hub[0].toFixed(1) + '" cy="' + hub[1].toFixed(1) + '" r="4.2" fill="#e2685c" />');
      svg.push('<text x="' + hub[0].toFixed(1) + '" y="' + (hub[1] - 14).toFixed(1) + '" text-anchor="middle" font-family="\'Playfair Display\',serif" font-style="italic" font-size="16" font-weight="700" fill="#f6f1e7">Улаанбаатар</text>');

      svg.push('</svg>');
      container.innerHTML = svg.join("");
    } catch (e) { container.__built = false; console.warn("travel map failed", e); }
  };

  window.TRAVEL_ORIGINS = ORIGINS;
})();
