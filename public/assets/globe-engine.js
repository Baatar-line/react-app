/* Framework-agnostic Three.js globe engine — plain-JS port of the handoff.
   Expects THREE, d3 (d3-geo), and topojson on window (loaded via CDN in <helmet>).
   Accent recolored from neon #b9ff3b to the app's green #8FD14F.
   Exposes window.GlobeEngine and window.GLOBE_COUNTRIES / window.resolveCountry. */
(function () {
  var ACCENT = "#E8B84B";
  var ACCENT_RGB = "232,184,75";
  var YELLOW = "#050505";
  var YELLOW_RGB = "5,5,5";

  var HOME_VIEW = { latitude: 46.8, longitude: 103.8 }; // Mongolia

  var countries = [
    { id: "mn", name: "Mongolia", latitude: 46.8, longitude: 103.8, region: "Central Asia",
      description: "Endless steppe, the Gobi Desert and a living nomadic culture — the heart of the Atlas archive.",
      categories: ["nature", "culture", "history"], media: ["read", "listen"], pinColor: ACCENT },
    { id: "us", name: "United States of America", latitude: 39, longitude: -98, region: "North America",
      description: "A sprawling federation of stories — jazz archives, oral histories of migration, and civil-rights recordings held in city libraries.",
      categories: ["culture", "audio", "history"], media: ["read", "listen"], pinColor: ACCENT },
    { id: "br", name: "Brazil", latitude: -10, longitude: -52, region: "South America",
      description: "Sound-rich cultural memory: samba lineages, Amazonian field recordings, and interviews with keepers of Afro-Brazilian tradition.",
      categories: ["audio", "culture", "interview"], media: ["listen", "watch"], pinColor: ACCENT },
    { id: "fr", name: "France", latitude: 47, longitude: 2, region: "Western Europe",
      description: "Cinema, resistance letters, and museum voice-archives — an editorial vault of the written and the spoken.",
      categories: ["video", "history", "memory"], media: ["read", "watch"], pinColor: ACCENT },
    { id: "eg", name: "Egypt", latitude: 27, longitude: 30, region: "North Africa",
      description: "Millennia layered in stone and script — from papyrus fragments to recorded interviews with Nile-delta artisans.",
      categories: ["history", "culture", "memory"], media: ["read", "watch"], pinColor: ACCENT },
    { id: "jp", name: "Japan", latitude: 37, longitude: 138, region: "East Asia",
      description: "Craft, sound design and preserved oral folklore — a quiet archive of process, patience and place.",
      categories: ["culture", "audio", "video"], media: ["watch", "listen"], pinColor: ACCENT },
    { id: "in", name: "India", latitude: 22, longitude: 79, region: "South Asia",
      description: "A polyphonic archive: regional languages, ragas, and human-rights testimony gathered across states.",
      categories: ["audio", "human rights", "interview"], media: ["listen", "read"], pinColor: ACCENT },
    { id: "za", name: "South Africa", latitude: -29, longitude: 24, region: "Southern Africa",
      description: "Testimony and reconciliation — recorded interviews, protest photography and the memory of a changed nation.",
      categories: ["human rights", "interview", "history"], media: ["read", "watch"], pinColor: ACCENT },
    { id: "au", name: "Australia", latitude: -25, longitude: 134, region: "Oceania",
      description: "Deep-time custodial knowledge and travel narratives spanning coast, desert and the songlines between.",
      categories: ["travel", "culture", "audio"], media: ["listen", "watch"], pinColor: ACCENT },
    { id: "is", name: "Iceland", latitude: 65, longitude: -18, region: "Northern Europe",
      description: "Sagas, field recordings of ice and geothermal landscape, and a small nation's outsized literary memory.",
      categories: ["travel", "audio", "memory"], media: ["read", "listen"], pinColor: ACCENT },
    { id: "ma", name: "Morocco", latitude: 32, longitude: -6, region: "North Africa",
      description: "Medina soundscapes, oral poetry and the layered memory of trade routes between sea and Sahara.",
      categories: ["culture", "travel", "audio"], media: ["listen", "read"], pinColor: ACCENT },
    { id: "mx", name: "Mexico", latitude: 23, longitude: -102, region: "North America",
      description: "Muralist history, radio testimonies and the vivid memory-keeping of festival and family.",
      categories: ["culture", "video", "memory"], media: ["watch", "read"], pinColor: ACCENT },
    { id: "de", name: "Germany", latitude: 51, longitude: 10, region: "Central Europe",
      description: "A rigorous public archive: reunification interviews, film, and the documented memory of a divided century.",
      categories: ["history", "interview", "video"], media: ["read", "watch"], pinColor: ACCENT },
    { id: "ke", name: "Kenya", latitude: 0, longitude: 38, region: "East Africa",
      description: "Community radio, wildlife field audio and oral histories collected along the Rift.",
      categories: ["audio", "travel", "interview"], media: ["listen", "watch"], pinColor: ACCENT },
    { id: "pe", name: "Peru", latitude: -10, longitude: -76, region: "South America",
      description: "Andean sound, textile memory and highland travel accounts recorded village by village.",
      categories: ["travel", "culture", "audio"], media: ["listen", "read"], pinColor: ACCENT }
  ];

  var countryByName = {};
  countries.forEach(function (c) { countryByName[c.name] = c; });

  function resolveCountry(name) {
    if (countryByName[name]) return countryByName[name];
    return {
      id: name.toLowerCase().replace(/\s+/g, "-"), name: name, latitude: 0, longitude: 0,
      region: "Archive",
      description: "Stories, audio and memory gathered from across " + name + " — an open archive of voices, images and place.",
      categories: ["culture", "memory", "audio"], media: ["read", "listen"], pinColor: ACCENT
    };
  }

  var ATLAS_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

  function GlobeEngine(mount, cb) {
    this.mount = mount;
    this.cb = cb || {};
    this.isMobile = window.innerWidth < 820;
    this.raycaster = new THREE.Raycaster();
    this.features = [];
    // Ultra-wide desktop displays have much more canvas around the archive
    // panels. Pull the camera back there so the globe keeps the same visual
    // proportion it has on a notebook instead of swallowing the side cards.
    this.targetZ = window.innerWidth >= 1500 ? 4.1 : 3.2;
    this.lastInteract = 0;
    this.lastHoverT = 0;
    this.raf = 0;
    this.alive = false;
    this._disposed = false;
    this.selName = null;
    this.selLL = null;
    this.hovName = null;
    this.filter = null;
    this.pins = [];
    this.archiveSites = {};
    this.archiveDots = [];
    this.activeSite = null;
    this.flagImg = null;
    this.flagReady = false;
    this._cleanupPointer = function () {};
  }

  // Admin-uploaded real flag photo/graphic for Mongolia — once loaded, buildTexture
  // draws it in place of the procedural Soyombo. Safe to call before or after init().
  GlobeEngine.prototype.setMongoliaFlag = function (url) {
    var self = this;
    var img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = function () {
      self.flagImg = img;
      self.flagReady = true;
      self._texDirty = true;
    };
    img.onerror = function () { self.flagReady = false; };
    img.src = url;
  };

  GlobeEngine.prototype.init = function () {
    var self = this;
    return fetch(ATLAS_URL).then(function (r) { return r.json(); }).then(function (topo) {
      // dispose() (component unmounted — e.g. navigating away from /globe
      // and back before this fetch finished) sets `alive` false, but nothing
      // stopped this resolved callback from stomping it back to true and
      // building a *second* full Three.js scene + pin set into the same
      // mount element — the two independent instances then rendered every
      // country's badge twice, each pair a frame apart. `_disposed` isn't
      // touched anywhere else, so it survives to actually gate this.
      if (self._disposed) return;
      var fc = topojson.feature(topo, topo.objects.countries);
      self.features = fc.features.filter(function (f) { return f.properties && f.properties.name; });
      self.alive = true;
      self.initThree();
      if (self.cb.onReady) self.cb.onReady();
    });
  };

  Object.defineProperty(GlobeEngine.prototype, "countryNames", {
    get: function () { return this.features.map(function (f) { return f.properties.name; }).sort(); }
  });

  GlobeEngine.prototype.llToVec = function (lat, lng, r) {
    if (r === undefined) r = 1;
    var la = (lat * Math.PI) / 180;
    var th = (lng * Math.PI) / 180 + Math.PI;
    return new THREE.Vector3(
      -Math.cos(th) * Math.cos(la) * r,
      Math.sin(la) * r,
      Math.sin(th) * Math.cos(la) * r
    );
  };
  GlobeEngine.prototype.vecToLL = function (v) {
    var n = v.clone().normalize();
    var lat = (Math.asin(Math.max(-1, Math.min(1, n.y))) * 180) / Math.PI;
    var th = Math.atan2(n.z, -n.x);
    var lng = ((th - Math.PI) * 180) / Math.PI;
    while (lng < -180) lng += 360;
    while (lng > 180) lng -= 360;
    return [lat, lng];
  };

  GlobeEngine.prototype.featureLineGeom = function (f, r) {
    var self = this;
    var pts = [];
    var addRing = function (ring) {
      for (var i = 0; i < ring.length - 1; i++) {
        var a = ring[i], b = ring[i + 1];
        if (Math.abs(b[0] - a[0]) > 180) continue;
        var steps = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / 2));
        for (var s = 0; s < steps; s++) {
          var t0 = s / steps, t1 = (s + 1) / steps;
          var p0 = self.llToVec(a[1] + (b[1] - a[1]) * t0, a[0] + (b[0] - a[0]) * t0, r);
          var p1 = self.llToVec(a[1] + (b[1] - a[1]) * t1, a[0] + (b[0] - a[0]) * t1, r);
          pts.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
        }
      }
    };
    var g = f.geometry;
    if (g.type === "Polygon") g.coordinates.forEach(addRing);
    else if (g.type === "MultiPolygon") g.coordinates.forEach(function (poly) { poly.forEach(addRing); });
    var geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(pts, 3));
    return geom;
  };

  GlobeEngine.prototype.refreshOutline = function () {
    var self = this;
    if (!this.outlineGroup) return;
    while (this.outlineGroup.children.length) {
      var c = this.outlineGroup.children.pop();
      c.geometry.dispose();
      c.material.dispose();
      this.outlineGroup.remove(c);
    }
    if (this.hovName || this.selName) { /* highlight handled by texture stroke — no floating 3D outline */ }
  };

  GlobeEngine.prototype.buildTexture = function () {
    var W = 2048, H = 1024;
    if (!this.canvas) {
      this.canvas = document.createElement("canvas");
      this.canvas.width = W; this.canvas.height = H;
    }
    var ctx = this.canvas.getContext("2d");
    var proj = d3.geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
    var path = d3.geoPath(proj, ctx);
    ctx.fillStyle = "#030303";
    ctx.fillRect(0, 0, W, H);
    ctx.beginPath();
    path(d3.geoGraticule().step([15, 15])());
    ctx.lineWidth = 0.5;
    ctx.strokeStyle = "rgba(255,255,255,.045)";
    ctx.stroke();
    for (var i = 0; i < this.features.length; i++) {
      var f = this.features[i];
      ctx.beginPath();
      path(f);
      var nm = f.properties.name;
      var isSel = this.selName && nm === this.selName;
      var isHov = this.hovName && nm === this.hovName;
      if (isSel && nm === "Mongolia" && this.flagReady && this.flagImg) {
        // real admin-uploaded flag photo, drawn to cover the country's shape
        var fb = path.bounds(f);
        var ffx = fb[0][0], ffy = fb[0][1], ffw = fb[1][0] - fb[0][0], ffh = fb[1][1] - fb[0][1];
        ctx.save();
        ctx.clip();
        var imgAr = this.flagImg.width / this.flagImg.height;
        var boxAr = ffw / ffh;
        var dw = ffw, dh = ffh, dx = ffx, dy = ffy;
        if (imgAr > boxAr) { dw = ffh * imgAr; dx = ffx - (dw - ffw) / 2; }
        else { dh = ffw / imgAr; dy = ffy - (dh - ffh) / 2; }
        ctx.drawImage(this.flagImg, dx, dy, dw, dh);
        ctx.restore();
      } else if (isSel && nm === "Mongolia") {
        // fill Mongolia's shape with the national flag
        var b = path.bounds(f);
        var fx = b[0][0], fy = b[0][1], fw = b[1][0] - b[0][0], fh = b[1][1] - b[0][1];
        var band = fw / 3;
        ctx.save();
        ctx.clip();
        ctx.fillStyle = "#C4272E"; ctx.fillRect(fx, fy, band + 1, fh);
        ctx.fillStyle = "#015197"; ctx.fillRect(fx + band, fy, band + 1, fh);
        ctx.fillStyle = "#C4272E"; ctx.fillRect(fx + 2 * band, fy, band + 1, fh);
        // Soyombo on the hoist band
        var GOLD = "#F9CF02", RED = "#C4272E";
        var cx0 = fx + band * 0.5;
        var u = Math.min(band * 0.13, fh * 0.045);
        var y = fy + fh * 0.5 - u * 8.5;
        ctx.fillStyle = GOLD;
        // flame — three tongues
        for (var t = -1; t <= 1; t++) {
          var fxo = cx0 + t * u * 1.15;
          ctx.beginPath(); ctx.moveTo(fxo, y - u * 0.5 - (t === 0 ? u * 0.3 : 0));
          ctx.lineTo(fxo - u * 0.5, y + u * 1.9); ctx.lineTo(fxo + u * 0.5, y + u * 1.9);
          ctx.closePath(); ctx.fill();
        }
        y += u * 2.4;
        // sun
        ctx.beginPath(); ctx.arc(cx0, y + u * 0.7, u * 0.7, 0, Math.PI * 2); ctx.fill();
        y += u * 1.9;
        // moon — crescent opening upward (bite a same-size disc out, offset up
        // enough to leave a real sliver instead of shaving a thin edge off)
        ctx.beginPath(); ctx.arc(cx0, y + u * 0.75, u * 0.72, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = RED; ctx.beginPath(); ctx.arc(cx0, y + u * 0.32, u * 0.72, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = GOLD;
        y += u * 2.0;
        // triangle pointing down
        ctx.beginPath(); ctx.moveTo(cx0, y + u * 1.2); ctx.lineTo(cx0 - u * 2.2, y); ctx.lineTo(cx0 + u * 2.2, y); ctx.closePath(); ctx.fill();
        y += u * 1.5;
        // top bar
        ctx.fillRect(cx0 - u * 2.4, y, u * 4.8, u * 0.7); y += u * 1.2;
        // taiji — a real yin-yang S-swirl (two half-discs forming the divide,
        // each with an opposite-colour dot), not just a plain disc with dots
        var tCy = y + u * 1.1, tR = u * 1.1;
        ctx.beginPath(); ctx.arc(cx0, tCy, tR, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = RED;
        ctx.beginPath();
        ctx.arc(cx0, tCy - tR / 2, tR / 2, Math.PI * 1.5, Math.PI * 0.5, true);
        ctx.arc(cx0, tCy + tR / 2, tR / 2, Math.PI * 0.5, Math.PI * 1.5, true);
        ctx.closePath(); ctx.fill();
        ctx.beginPath(); ctx.arc(cx0, tCy + tR / 2, tR * 0.22, 0, Math.PI * 2); ctx.fillStyle = GOLD; ctx.fill();
        ctx.beginPath(); ctx.arc(cx0, tCy - tR / 2, tR * 0.22, 0, Math.PI * 2); ctx.fillStyle = RED; ctx.fill();
        ctx.fillStyle = GOLD;
        y += u * 2.6;
        // bottom bar
        ctx.fillRect(cx0 - u * 2.4, y, u * 4.8, u * 0.7); y += u * 1.2;
        // triangle pointing up
        ctx.beginPath(); ctx.moveTo(cx0, y); ctx.lineTo(cx0 - u * 2.2, y + u * 1.2); ctx.lineTo(cx0 + u * 2.2, y + u * 1.2); ctx.closePath(); ctx.fill();
        // vertical pillars framing the column
        var pilTop = fy + fh * 0.5 - u * 2.7, pilH = u * 8.0;
        ctx.fillRect(cx0 - u * 3.2, pilTop, u * 0.6, pilH);
        ctx.fillRect(cx0 + u * 2.6, pilTop, u * 0.6, pilH);
        ctx.restore();
      } else {
        ctx.fillStyle = isSel ? ACCENT : isHov ? "#474747" : "#303030";
        ctx.fill();
      }
      ctx.lineWidth = isSel || isHov ? 1.0 : 0.7;
      ctx.strokeStyle = isSel || isHov ? "rgba(8,8,8,.9)" : "rgba(8,8,8,.72)";
      ctx.stroke();
    }
    if (this.texture) this.texture.needsUpdate = true;
    this.refreshOutline();
  };

  GlobeEngine.prototype.initThree = function () {
    var el = this.mount;
    var w = el.clientWidth, h = el.clientHeight;
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(38, w / h, 0.1, 100);
    this.camera.position.set(0, 0, this.targetZ);
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio || 1));
    this.renderer.setSize(w, h);
    el.appendChild(this.renderer.domElement);
    this.renderer.domElement.style.cursor = "grab";
    this.renderer.domElement.style.touchAction = "none";

    // Level axis, equator centered — was Earth's real 23.5° obliquity, but
    // that tilt read as an error on this stylized globe rather than a
    // deliberate astronomical touch.
    this.tiltQuat = new THREE.Quaternion();
    this.tiltGroup = new THREE.Group();
    this.tiltGroup.quaternion.copy(this.tiltQuat);
    this.scene.add(this.tiltGroup);
    this.group = new THREE.Group();
    this.tiltGroup.add(this.group);
    this.uprightQuat = new THREE.Quaternion();       // identity — level axis
    this.targetTilt = this.tiltQuat.clone();         // animated tilt target

    this.buildTexture();
    var tex = new THREE.CanvasTexture(this.canvas);
    tex.anisotropy = (this.renderer.capabilities.getMaxAnisotropy && this.renderer.capabilities.getMaxAnisotropy()) || 4;
    if (THREE.SRGBColorSpace) tex.colorSpace = THREE.SRGBColorSpace;
    this.texture = tex;
    this.globe = new THREE.Mesh(new THREE.SphereGeometry(1, 64, 64), new THREE.MeshBasicMaterial({ map: tex }));
    this.group.add(this.globe);

    this.outlineGroup = new THREE.Group();
    this.group.add(this.outlineGroup);
    this.refreshOutline();

    var atmMat = new THREE.ShaderMaterial({
      uniforms: { c: { value: new THREE.Color(0.24, 0.24, 0.24) } },
      vertexShader: "varying vec3 vN; void main(){ vN=normalize(normalMatrix*normal); gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
      fragmentShader: "varying vec3 vN; uniform vec3 c; void main(){ float i=pow(clamp(0.62 - dot(vN, vec3(0.0,0.0,1.0)),0.0,1.0),2.4); gl_FragColor=vec4(c, i*0.3);}",
      side: THREE.BackSide, transparent: true, depthWrite: false
    });
    this.scene.add(new THREE.Mesh(new THREE.SphereGeometry(1.11, 64, 64), atmMat));

    this.pinLayer = document.createElement("div");
    Object.assign(this.pinLayer.style, { position: "absolute", inset: "0", pointerEvents: "none", zIndex: "4" });
    el.appendChild(this.pinLayer);
    this.nameLabel = document.createElement("div");
    Object.assign(this.nameLabel.style, { position: "absolute", transform: "translate(-50%,-165%)", pointerEvents: "none", opacity: "0", whiteSpace: "nowrap", font: "italic 600 17px 'Playfair Display',serif", color: "#26261f", textShadow: "0 1px 6px rgba(255,255,255,.9)", willChange: "transform,opacity", transition: "opacity .3s" });
    this.pinLayer.appendChild(this.nameLabel);
    var self = this;
    var seeded = function (seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; };
    countries.forEach(function (c) {
      var h = 0; for (var i = 0; i < c.name.length; i++) h = (h * 31 + c.name.charCodeAt(i)) >>> 0;
      var count = 6;
      c.count = count;
      var center = self.llToVec(c.latitude, c.longitude, 1.015);

      // count badge — shown by default (like the Maps page markers)
      var badge = document.createElement("div");
      // Country archive counts are intentionally hidden; visitors select the
      // country shape itself and see its individual site pins after opening it.
      Object.assign(badge.style, { position: "absolute", display: "none", transform: "translate(-50%,-50%)", pointerEvents: "none", cursor: "pointer", willChange: "transform,opacity" });
      badge.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;border-radius:999px;font:600 9px/1 ui-monospace,SFMono-Regular,Menlo,monospace;color:#1a1a18;background:#fff;border:1px solid rgba(0,0,0,.08);box-shadow:0 1px 5px rgba(0,0,0,.16)">' + count + '</div>';
      badge.addEventListener("click", function (ev) { ev.stopPropagation(); self.selectByName(c.name); });
      badge.addEventListener("pointerdown", function (ev) { ev.stopPropagation(); });
      self.pinLayer.appendChild(badge);

      // scattered archive pins — revealed only when this country is selected
      var dots = [];
      self.pins.push({ name: c.name, vec: center, badge: badge, dots: dots });
    });

    var home = this.quatFor(HOME_VIEW.latitude, HOME_VIEW.longitude);
    this.group.quaternion.copy(home);
    this.targetQ = home.clone();
    this.targetZ = window.innerWidth >= 1500 ? 4.1 : 3.2;
    this.lastInteract = performance.now() + 2500;

    this.bindPointer();
    this.animate();
  };

  GlobeEngine.prototype.bindPointer = function () {
    var self = this;
    var dom = this.renderer.domElement;
    var dragging = false, moved = 0, px = 0, py = 0;
    var down = function (e) { dragging = true; moved = 0; px = e.clientX; py = e.clientY; self.lastInteract = performance.now(); dom.style.cursor = "grabbing"; };
    var move = function (e) {
      if (dragging) {
        var dx = e.clientX - px, dy = e.clientY - py;
        px = e.clientX; py = e.clientY;
        moved += Math.abs(dx) + Math.abs(dy);
        var qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), dx * 0.005);
        var qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), dy * 0.005);
        self.group.quaternion.premultiply(qy).premultiply(qx);
        self.targetQ.copy(self.group.quaternion);
        self.lastInteract = performance.now();
      } else {
        self.hoverPick(e.clientX, e.clientY);
      }
    };
    var up = function (e) {
      if (dragging && moved < 6) self.clickPick(e.clientX, e.clientY);
      dragging = false; dom.style.cursor = "grab"; self.lastInteract = performance.now();
    };
    dom.addEventListener("pointerdown", down);
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    var wheel = function (e) {
      e.preventDefault();
      self.targetZ = Math.max(2.0, Math.min(4.6, self.targetZ + e.deltaY * 0.0016));
      self.lastInteract = performance.now();
    };
    dom.addEventListener("wheel", wheel, { passive: false });
    this._cleanupPointer = function () {
      dom.removeEventListener("pointerdown", down);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      dom.removeEventListener("wheel", wheel);
    };
  };

  GlobeEngine.prototype.screenToSphere = function (cx, cy) {
    var r = this.renderer.domElement.getBoundingClientRect();
    var ndc = new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    this.raycaster.setFromCamera(ndc, this.camera);
    var hit = this.raycaster.intersectObject(this.globe, false);
    if (!hit.length) return null;
    // The globe sits under tiltGroup -> group -> mesh (see updatePins, which
    // applies both quaternions the same way going the other direction:
    // .applyQuaternion(q).applyQuaternion(tq)). This only undid `group`'s
    // rotation and ignored the 23.5° axial tilt entirely, so every pick was
    // off by the current tilt angle — clicking Mongolia could resolve to a
    // neighboring country instead, which then gets stuck selected since the
    // miscalculation is consistent.
    var p = hit[0].point.clone();
    p.applyQuaternion(this.tiltGroup.quaternion.clone().invert());
    p.applyQuaternion(this.group.quaternion.clone().invert());
    return p;
  };

  GlobeEngine.prototype.countryAt = function (cx, cy) {
    var local = this.screenToSphere(cx, cy);
    if (!local) return null;
    var ll = this.vecToLL(local);
    for (var i = 0; i < this.features.length; i++) {
      try { if (d3.geoContains(this.features[i], [ll[1], ll[0]])) return this.features[i].properties.name; } catch (e) {}
    }
    return null;
  };

  GlobeEngine.prototype.hoverPick = function (cx, cy) {
    if (!this.features.length) return;
    var now = performance.now();
    if (now - this.lastHoverT < 80) return;
    this.lastHoverT = now;
    var name = this.countryAt(cx, cy);
    if (name !== this.hovName) {
      this.hovName = name;
      this._texDirty = true; // coalesced rebuild in animate() — avoids a full 2048×1024 redraw per mousemove
      this.renderer.domElement.style.cursor = name ? "pointer" : "grab";
    }
    if (this.cb.onHover) this.cb.onHover(name, cx, cy);
  };

  GlobeEngine.prototype.clickPick = function (cx, cy) {
    var name = this.countryAt(cx, cy);
    if (name) this.selectByName(name);
  };

  GlobeEngine.prototype.quatFor = function (lat, lng) {
    var d = this.llToVec(lat, lng, 1).normalize();
    var ry = Math.atan2(-d.x, d.z);
    var dpz = -d.x * Math.sin(ry) + d.z * Math.cos(ry);
    var rx = Math.atan2(d.y, dpz);
    var qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), ry);
    var qx = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), rx);
    return qx.multiply(qy);
  };

  GlobeEngine.prototype.flyTo = function (lat, lng) {
    this.targetQ = this.quatFor(lat, lng);
    // Keep the selected country readable without letting the globe cover the
    // larger archive cards on ultra-wide desktop screens.
    this.targetZ = this.isMobile ? 2.7 : (window.innerWidth >= 1500 ? 3.35 : 2.5);
  };

  GlobeEngine.prototype.selectByName = function (name) {
    var ll = null;
    var cur = countries.find(function (c) { return c.name === name; });
    if (cur) ll = [cur.latitude, cur.longitude];
    if (!ll) {
      var f = this.features.find(function (x) { return x.properties.name === name; });
      if (f) { var c2 = d3.geoCentroid(f); ll = [c2[1], c2[0]]; }
    }
    if (!ll) return;
    this.selName = name;
    this.selLL = ll;
    this.hovName = null;
    this.targetTilt = this.uprightQuat.clone();   // straighten axis on select
    this._texDirty = true;
    this.flyTo(ll[0], ll[1]);
    this.lastInteract = performance.now() + 100000;
    this.buildArchiveDots(name);
    if (this.cb.onSelect) this.cb.onSelect(name);
  };

  GlobeEngine.prototype.setArchiveSites = function (rows) {
    var grouped = {};
    (rows || []).forEach(function (s) { (grouped[s.country] || (grouped[s.country] = [])).push(s); });
    this.archiveSites = grouped;
    if (this.selName && this.pinLayer) this.buildArchiveDots(this.selName);
  };

  GlobeEngine.prototype.buildArchiveDots = function (name) {
    this.archiveDots.forEach(function (d) { d.el.remove(); });
    this.archiveDots = [];
    this.activeSite = null;
    if (!this.pinLayer) return;
    var self = this;
    var sites = (this.archiveSites[name] || []).filter(function (s) { return Number.isFinite(s.latitude) && Number.isFinite(s.longitude); }).sort(function (a, b) { return a.position - b.position; });
    sites.forEach(function (site) {
      var dot = document.createElement("button");
      dot.type = "button";
      dot.title = String(site.position).padStart(2, "0") + " · " + site.name;
      Object.assign(dot.style, { position: "absolute", width: "28px", height: "28px", padding: "0", border: "0", background: "transparent", transform: "translate(-50%,-50%)", pointerEvents: "auto", cursor: "pointer", opacity: "0", willChange: "transform,opacity", zIndex: "5" });
      dot.innerHTML = '<span class="ring" style="position:absolute;left:50%;top:50%;width:11px;height:11px;transform:translate(-50%,-50%);border-radius:50%;border:1.25px solid rgba(' + YELLOW_RGB + ',.8)"></span><span class="core" style="position:absolute;left:50%;top:50%;width:6px;height:6px;transform:translate(-50%,-50%);border-radius:50%;background:' + YELLOW + ';box-shadow:0 0 7px 2px rgba(' + YELLOW_RGB + ',.9)"></span>';
      dot.addEventListener("pointerdown", function (ev) { ev.stopPropagation(); });
      dot.addEventListener("click", function (ev) { ev.stopPropagation(); self.setActiveSite(site.position); if (self.cb.onSiteSelect) self.cb.onSiteSelect(site.position); });
      self.pinLayer.appendChild(dot);
      self.archiveDots.push({ site: site, vec: self.llToVec(site.latitude, site.longitude, 1.018), el: dot, ring: dot.querySelector('.ring'), core: dot.querySelector('.core') });
    });
  };

  GlobeEngine.prototype.setActiveSite = function (position) {
    this.activeSite = position || null;
    this.archiveDots.forEach(function (d) {
      var on = d.site.position === position;
      d.core.style.background = YELLOW;
      d.core.style.boxShadow = on ? '0 0 0 4px rgba(5,5,5,.28),0 0 15px 5px rgba(5,5,5,.75)' : '0 0 8px 2px rgba(5,5,5,.55)';
    });
  };

  GlobeEngine.prototype.clearSelection = function () {
    this.selName = null;
    this.selLL = null;
    this.targetTilt = this.tiltQuat.clone();      // restore 23.5° tilt
    this._texDirty = true;
    this.targetZ = window.innerWidth >= 1500 ? 4.1 : 3.2;
    this.lastInteract = performance.now();
    this.buildArchiveDots(null);
    if (this.cb.onSelect) this.cb.onSelect(null);
  };

  GlobeEngine.prototype.setFilter = function (filter) { this.filter = filter; };

  GlobeEngine.prototype.matchFilter = function (name) {
    var c = countries.find(function (x) { return x.name === name; });
    if (!c) return false;
    return !!this.filter && c.media.indexOf(this.filter) !== -1;
  };

  GlobeEngine.prototype.updatePins = function () {
    var cam = this.camera;
    var dom = this.renderer.domElement;
    var w = dom.clientWidth, h = dom.clientHeight;
    var q = this.group.quaternion;
    var tq = this.tiltGroup.quaternion;
    var t = (performance.now() % 1600) / 1600;
    // `vec.z > 0` (plain front/back hemisphere split) only holds for a camera
    // infinitely far away. This camera sits close (2–4.6 units off a radius-1
    // globe), so the true visible horizon is nearer the camera than the
    // equator-plane — pins between the two "passed" this check while
    // actually already behind the sphere's silhouette from the camera's own
    // point of view, so they floated in place outside the visible globe
    // instead of rotating out of view with it. cos(horizon angle) = R/D.
    var horizonCos = 1 / cam.position.z;
    var isFront = function (v) { return (v.z / v.length()) > horizonCos; };
    // Driven directly by the actual selection (selName/selLL, set in
    // selectByName for *any* of the ~180 real countries) instead of only the
    // 15 curated `countries` pins below — that loop previously left the label
    // showing whichever curated country was selected last (e.g. "Egypt")
    // frozen in place whenever a non-curated country got picked afterwards,
    // since nothing in the loop ever matched to update or clear it.
    if (this.selName && this.selLL && this.nameLabel) {
      var lwv = this.llToVec(this.selLL[0], this.selLL[1], 1.015).applyQuaternion(q).applyQuaternion(tq);
      var lproj = lwv.clone().project(cam);
      var lfront = isFront(lwv);
      this.nameLabel.textContent = this.selName;
      this.nameLabel.style.left = (lproj.x * 0.5 + 0.5) * w + "px";
      this.nameLabel.style.top = (-lproj.y * 0.5 + 0.5) * h + "px";
      this.nameLabel.style.opacity = (lfront && this.selName !== "Mongolia") ? "1" : "0";
    } else if (this.nameLabel) {
      this.nameLabel.style.opacity = "0";
    }
    for (var i = 0; i < this.pins.length; i++) {
      var p = this.pins[i];
      var selected = p.name === this.selName;
      var dim = this.filter && !this.matchFilter(p.name);
      // count badge
      var bwv = p.vec.clone().applyQuaternion(q).applyQuaternion(tq);
      var bproj = bwv.clone().project(cam);
      var bfront = isFront(bwv);
      p.badge.style.left = (bproj.x * 0.5 + 0.5) * w + "px";
      p.badge.style.top = (-bproj.y * 0.5 + 0.5) * h + "px";
      var showBadge = bfront && !selected;
      p.badge.style.opacity = showBadge ? (dim ? "0.15" : "1") : "0";
      p.badge.style.pointerEvents = "none";
      // scattered archive pins (only for selected country)
      for (var k = 0; k < p.dots.length; k++) {
        var d = p.dots[k];
        var wv = d.vec.clone().applyQuaternion(q).applyQuaternion(tq);
        var proj = wv.clone().project(cam);
        var front = isFront(wv);
        d.el.style.left = (proj.x * 0.5 + 0.5) * w + "px";
        d.el.style.top = (-proj.y * 0.5 + 0.5) * h + "px";
        d.el.style.opacity = (selected && front && p.name !== "Mongolia") ? "0.95" : "0";
        // Legacy/static country dots never pulse. Only the explicitly selected
        // archive site below is allowed to animate.
        d.ring.style.transform = "translate(-50%,-50%) scale(1)";
        d.ring.style.opacity = "0.55";
      }
    }
    for (var a = 0; a < this.archiveDots.length; a++) {
      var ad = this.archiveDots[a];
      var awv = ad.vec.clone().applyQuaternion(q).applyQuaternion(tq);
      var aproj = awv.clone().project(cam);
      var afront = isFront(awv);
      ad.el.style.left = (aproj.x * 0.5 + 0.5) * w + "px";
      ad.el.style.top = (-aproj.y * 0.5 + 0.5) * h + "px";
      ad.el.style.opacity = afront ? "0.98" : "0";
      ad.el.style.pointerEvents = afront ? "auto" : "none";
      var active = ad.site.position === this.activeSite;
      ad.ring.style.transform = active
        ? "translate(-50%,-50%) scale(" + (1 + t * 1.8) + ")"
        : "translate(-50%,-50%) scale(1)";
      ad.ring.style.opacity = active ? String((1 - t) * 0.65) : "0.55";
    }
  };

  GlobeEngine.prototype.animate = function () {
    var self = this;
    if (!this.alive) return;
    this.raf = requestAnimationFrame(function () { self.animate(); });
    var now = performance.now();
    var idle = now - this.lastInteract > 3500;
    var auto = idle && !this.selName;
    if (auto) {
      var qy = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), 0.0006);
      this.group.quaternion.premultiply(qy);
      this.targetQ.copy(this.group.quaternion);
    } else {
      this.group.quaternion.slerp(this.targetQ, 0.085);
    }
    if (this.targetTilt) this.tiltGroup.quaternion.slerp(this.targetTilt, 0.08);
    this.camera.position.z += (this.targetZ - this.camera.position.z) * 0.08;
    if (this._texDirty) { this._texDirty = false; this.buildTexture(); } // one coalesced texture rebuild per frame at most
    this.updatePins();
    this.renderer.render(this.scene, this.camera);
  };

  GlobeEngine.prototype.resize = function () {
    if (!this.renderer) return;
    this.isMobile = window.innerWidth < 820;
    var responsiveZ = window.innerWidth >= 1500 ? 4.1 : 3.2;
    // Preserve a user's manual zoom, but update the default camera distance
    // when crossing between notebook and ultra-wide desktop layouts.
    if (Math.abs(this.targetZ - 3.2) < 0.02 || Math.abs(this.targetZ - 3.65) < 0.02 || Math.abs(this.targetZ - 4.1) < 0.02) {
      this.targetZ = responsiveZ;
    }
    var w = this.mount.clientWidth, h = this.mount.clientHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
  };

  GlobeEngine.prototype.dispose = function () {
    this._disposed = true;
    this.alive = false;
    cancelAnimationFrame(this.raf);
    this._cleanupPointer();
    if (this.pinLayer) this.pinLayer.remove();
    if (this.renderer && this.renderer.domElement) this.renderer.domElement.remove();
    if (this.renderer) this.renderer.dispose();
  };

  window.GlobeEngine = GlobeEngine;
  window.GLOBE_COUNTRIES = countries;
  window.resolveCountry = resolveCountry;
  window.GLOBE_ACCENT = ACCENT;
})();
