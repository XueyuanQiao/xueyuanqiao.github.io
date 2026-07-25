(function () {
  "use strict";

  var canvas = document.getElementById("cat-particle-stage");
  if (!canvas) return;

  var ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) {
    document.documentElement.classList.add("no-particle-canvas");
    return;
  }

  var phaseLabel = document.querySelector("[data-particle-phase]");
  var countLabel = document.querySelector("[data-particle-count]");
  var triggerButton = document.querySelector("[data-particle-trigger]");
  var autoButton = document.querySelector("[data-particle-auto]");
  var resetButton = document.querySelector("[data-particle-reset]");

  var reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var coarsePointerQuery = window.matchMedia("(pointer: coarse)");
  var prefersReducedMotion = reducedMotionQuery.matches;
  var autoPlay = !prefersReducedMotion;

  var width = 0;
  var height = 0;
  var dpr = 1;
  var centerX = 0;
  var centerY = 0;
  var sceneScale = 1;
  var particles = [];
  var wirePaths = [];
  var stars = [];
  var meteors = [];
  var shockwaves = [];
  var animationFrame = 0;
  var lastFrame = performance.now();
  var elapsed = 0;
  var morph = 0;
  var transition = null;
  var nextAutoAt = lastFrame + 4300;
  var yaw = -0.42;
  var pitch = 0.04;
  var targetYaw = yaw;
  var targetPitch = pitch;
  var yawVelocity = 0;
  var pitchVelocity = 0;
  var zoom = 1;
  var targetZoom = 1;
  var dragging = false;
  var activePointerId = null;
  var pointerX = 0;
  var pointerY = 0;
  var pointerStrength = 0;
  var pointerTargetStrength = 0;
  var pointerLastMove = 0;
  var pointerDownX = 0;
  var pointerDownY = 0;
  var pointerDownAt = 0;
  var pointerTravel = 0;
  var transitionEnergy = 0;
  var frameSamples = 0;
  var slowFrames = 0;
  var renderStride = 1;

  var COLORS = {
    cyan: [101, 231, 255],
    blue: [91, 139, 255],
    violet: [177, 139, 255],
    pink: [255, 116, 175],
    mint: [115, 247, 205],
    gold: [255, 207, 108],
    ice: [205, 248, 255]
  };

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, amount) {
    return a + (b - a) * amount;
  }

  function easeInOut(value) {
    var t = clamp(value, 0, 1);
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  function smoothstep(min, max, value) {
    var t = clamp((value - min) / (max - min), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function qualityFactor() {
    var cores = navigator.hardwareConcurrency || 4;
    var memory = navigator.deviceMemory || 4;
    if (window.innerWidth < 520 || cores <= 2 || memory <= 2) return 0.48;
    if (coarsePointerQuery.matches || window.innerWidth < 900 || cores <= 4 || memory <= 4) return 0.68;
    return 1;
  }

  var quality = qualityFactor();

  function particleColor(name, variation) {
    var color = COLORS[name] || COLORS.cyan;
    var amount = variation || 0;
    return [
      clamp(Math.round(color[0] + amount), 0, 255),
      clamp(Math.round(color[1] + amount), 0, 255),
      clamp(Math.round(color[2] + amount), 0, 255)
    ];
  }

  function addParticle(x, y, z, colorName, part, options) {
    var directionTheta = Math.random() * Math.PI * 2;
    var directionPhi = Math.acos(randomRange(-1, 1));
    var radius = randomRange(3.3, 5.7);
    var spreadX = Math.sin(directionPhi) * Math.cos(directionTheta) * radius;
    var spreadY = Math.cos(directionPhi) * radius * 0.82;
    var spreadZ = Math.sin(directionPhi) * Math.sin(directionTheta) * radius;
    var settings = options || {};

    particles.push({
      x: x,
      y: y,
      z: z,
      sx: spreadX + randomRange(-0.38, 0.38),
      sy: spreadY + randomRange(-0.28, 0.28),
      sz: spreadZ + randomRange(-0.38, 0.38),
      color: particleColor(colorName, randomRange(-15, 18)),
      part: part || "body",
      tailT: settings.tailT || 0,
      size: settings.size || randomRange(0.65, 1.55),
      alpha: settings.alpha || randomRange(0.52, 0.98),
      phase: Math.random() * Math.PI * 2,
      speed: randomRange(0.35, 1.15),
      delay: randomRange(0, 0.17),
      glow: settings.glow || Math.random() > 0.965,
      previousX: null,
      previousY: null
    });
  }

  function sampleEllipsoid(count, cx, cy, cz, rx, ry, rz, colorName, part, options) {
    var total = Math.max(1, Math.round(count * quality));
    for (var i = 0; i < total; i += 1) {
      var theta = Math.random() * Math.PI * 2;
      var unitY = randomRange(-1, 1);
      var ring = Math.sqrt(Math.max(0, 1 - unitY * unitY));
      var jitter = randomRange(0.965, 1.035);
      addParticle(
        cx + Math.cos(theta) * ring * rx * jitter,
        cy + unitY * ry * jitter,
        cz + Math.sin(theta) * ring * rz * jitter,
        colorName,
        part,
        options
      );
    }
  }

  function sampleCylinder(count, cx, topY, bottomY, cz, radiusX, radiusZ, colorName, part) {
    var total = Math.max(1, Math.round(count * quality));
    for (var i = 0; i < total; i += 1) {
      var angle = Math.random() * Math.PI * 2;
      var y = randomRange(bottomY, topY);
      addParticle(
        cx + Math.cos(angle) * radiusX * randomRange(0.94, 1.04),
        y,
        cz + Math.sin(angle) * radiusZ * randomRange(0.94, 1.04),
        colorName,
        part
      );
    }
  }

  function sampleTriangle(count, a, b, c, colorName, part, zDepth) {
    var total = Math.max(1, Math.round(count * quality));
    for (var i = 0; i < total; i += 1) {
      var u = Math.random();
      var v = Math.random();
      if (u + v > 1) {
        u = 1 - u;
        v = 1 - v;
      }
      var x = a[0] + u * (b[0] - a[0]) + v * (c[0] - a[0]);
      var y = a[1] + u * (b[1] - a[1]) + v * (c[1] - a[1]);
      var z = zDepth + randomRange(-0.12, 0.12);
      addParticle(x, y, z, colorName, part, { size: randomRange(0.72, 1.42) });
    }
  }

  function sampleTail(count) {
    var total = Math.max(1, Math.round(count * quality));
    for (var i = 0; i < total; i += 1) {
      var t = Math.random();
      var angle = Math.random() * Math.PI * 2;
      var radius = lerp(0.24, 0.095, t);
      var baseX = 0.72 + 1.75 * t + 0.28 * Math.sin(t * Math.PI * 1.4);
      var baseY = -0.65 + 2.45 * t - 0.62 * t * t + 0.35 * Math.sin(t * Math.PI);
      var baseZ = -0.08 + 0.42 * Math.cos(t * Math.PI * 1.25);
      addParticle(
        baseX + Math.cos(angle) * radius,
        baseY + Math.sin(angle) * radius,
        baseZ + Math.sin(angle) * radius * 0.72,
        t > 0.72 ? "violet" : "blue",
        "tail",
        { tailT: t, size: randomRange(0.7, 1.5) }
      );
    }
  }

  function buildCat() {
    particles = [];

    sampleEllipsoid(1040, 0, -0.2, 0, 1.16, 1.36, 0.82, "blue", "body");
    sampleEllipsoid(430, 0, -0.03, 0.72, 0.78, 1.13, 0.17, "ice", "chest", { alpha: 0.86 });
    sampleEllipsoid(860, 0, 1.42, 0.04, 1.01, 0.8, 0.8, "cyan", "head");
    sampleEllipsoid(185, 0, 1.76, 0.64, 0.69, 0.35, 0.13, "blue", "head", { alpha: 0.7 });

    sampleTriangle(250, [-0.84, 1.72], [-0.19, 2.0], [-0.59, 2.63], "violet", "ear-left", 0.02);
    sampleTriangle(250, [0.19, 2.0], [0.84, 1.72], [0.59, 2.63], "violet", "ear-right", 0.02);
    sampleTriangle(85, [-0.68, 1.83], [-0.31, 2.02], [-0.56, 2.39], "pink", "ear-left", 0.31);
    sampleTriangle(85, [0.31, 2.02], [0.68, 1.83], [0.56, 2.39], "pink", "ear-right", 0.31);

    sampleCylinder(180, -0.56, -0.9, -2.0, 0.32, 0.26, 0.25, "blue", "leg");
    sampleCylinder(180, 0.56, -0.9, -2.0, 0.32, 0.26, 0.25, "blue", "leg");
    sampleEllipsoid(135, -0.61, -2.08, 0.38, 0.42, 0.25, 0.46, "ice", "paw");
    sampleEllipsoid(135, 0.61, -2.08, 0.38, 0.42, 0.25, 0.46, "ice", "paw");

    sampleTail(500);
    sampleEllipsoid(150, -0.29, 1.12, 0.72, 0.38, 0.27, 0.2, "ice", "muzzle", { alpha: 0.9 });
    sampleEllipsoid(150, 0.29, 1.12, 0.72, 0.38, 0.27, 0.2, "ice", "muzzle", { alpha: 0.9 });
    sampleEllipsoid(30, -0.37, 1.55, 0.79, 0.1, 0.135, 0.065, "blue", "eye", { glow: true, size: 1.12 });
    sampleEllipsoid(30, 0.37, 1.55, 0.79, 0.1, 0.135, 0.065, "blue", "eye", { glow: true, size: 1.12 });
    sampleEllipsoid(26, 0, 1.2, 0.95, 0.105, 0.073, 0.06, "pink", "nose", { glow: true, size: 1.25 });

    buildWireframe();
    if (countLabel) countLabel.textContent = particles.length.toLocaleString("en-US");
  }

  function ellipsePath(cx, cy, cz, rx, ry, rz, plane, count) {
    var points = [];
    var total = count || 48;
    for (var i = 0; i <= total; i += 1) {
      var angle = i / total * Math.PI * 2;
      if (plane === "xy") points.push([cx + Math.cos(angle) * rx, cy + Math.sin(angle) * ry, cz]);
      else if (plane === "yz") points.push([cx, cy + Math.cos(angle) * ry, cz + Math.sin(angle) * rz]);
      else points.push([cx + Math.cos(angle) * rx, cy, cz + Math.sin(angle) * rz]);
    }
    return points;
  }

  function buildWireframe() {
    wirePaths = [
      { points: ellipsePath(0, -0.2, 0.02, 1.16, 1.36, 0.82, "xy", 64), color: "cyan", alpha: 0.62 },
      { points: ellipsePath(0, -0.18, 0, 1.16, 1.36, 0.82, "yz", 48), color: "blue", alpha: 0.34 },
      { points: ellipsePath(0, -0.15, 0, 1.16, 1.36, 0.82, "xz", 48), color: "blue", alpha: 0.3 },
      { points: ellipsePath(0, 1.42, 0.08, 1.01, 0.8, 0.8, "xy", 58), color: "cyan", alpha: 0.74 },
      { points: ellipsePath(0, 1.42, 0.02, 1.01, 0.8, 0.8, "yz", 48), color: "violet", alpha: 0.38 },
      { points: [[-0.84, 1.72, 0.04], [-0.59, 2.63, 0.04], [-0.19, 2.0, 0.04], [-0.84, 1.72, 0.04]], color: "violet", alpha: 0.75 },
      { points: [[0.19, 2.0, 0.04], [0.59, 2.63, 0.04], [0.84, 1.72, 0.04], [0.19, 2.0, 0.04]], color: "violet", alpha: 0.75 },
      { points: [[-0.75, 1.22, 0.78], [-1.58, 1.02, 0.9]], color: "cyan", alpha: 0.55 },
      { points: [[-0.72, 1.08, 0.8], [-1.66, 0.78, 0.86]], color: "cyan", alpha: 0.52 },
      { points: [[0.75, 1.22, 0.78], [1.58, 1.02, 0.9]], color: "cyan", alpha: 0.55 },
      { points: [[0.72, 1.08, 0.8], [1.66, 0.78, 0.86]], color: "cyan", alpha: 0.52 },
      { points: ellipsePath(-0.37, 1.55, 0.8, 0.1, 0.135, 0.065, "xy", 20), color: "blue", alpha: 0.88 },
      { points: ellipsePath(0.37, 1.55, 0.8, 0.1, 0.135, 0.065, "xy", 20), color: "blue", alpha: 0.88 }
    ];

    var tailLine = [];
    for (var i = 0; i <= 38; i += 1) {
      var t = i / 38;
      tailLine.push([
        0.72 + 1.75 * t + 0.28 * Math.sin(t * Math.PI * 1.4),
        -0.65 + 2.45 * t - 0.62 * t * t + 0.35 * Math.sin(t * Math.PI),
        -0.08 + 0.42 * Math.cos(t * Math.PI * 1.25)
      ]);
    }
    wirePaths.push({ points: tailLine, color: "violet", alpha: 0.72 });
  }

  function buildStars() {
    var total = width < 600 ? 65 : 125;
    stars = [];
    for (var i = 0; i < total; i += 1) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: randomRange(0.35, 1.65),
        alpha: randomRange(0.12, 0.72),
        phase: Math.random() * Math.PI * 2,
        speed: randomRange(0.25, 1.1)
      });
    }

    meteors = [];
    var meteorTotal = width < 600 ? 2 : 5;
    for (var j = 0; j < meteorTotal; j += 1) {
      meteors.push({
        phase: Math.random(),
        y: randomRange(0.04, 0.68),
        length: randomRange(35, 82),
        speed: randomRange(0.72, 1.28),
        alpha: randomRange(0.18, 0.48)
      });
    }
  }

  function resize() {
    width = Math.max(1, window.innerWidth);
    height = Math.max(1, window.innerHeight);
    dpr = Math.min(window.devicePixelRatio || 1, quality < 0.7 ? 1.35 : 1.75);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    var desktop = width > 760;
    centerX = desktop ? width * 0.35 : width * 0.5;
    centerY = desktop ? height * 0.53 : height * 0.35;
    sceneScale = desktop
      ? Math.min(height * 0.145, width * 0.092)
      : Math.min(height * 0.104, width * 0.15);
    buildStars();
  }

  function rotatePoint(x, y, z) {
    var tailCos = Math.cos(yaw);
    var tailSin = Math.sin(yaw);
    var pitchCos = Math.cos(pitch);
    var pitchSin = Math.sin(pitch);
    var x1 = x * tailCos - z * tailSin;
    var z1 = x * tailSin + z * tailCos;
    var y1 = y * pitchCos - z1 * pitchSin;
    var z2 = y * pitchSin + z1 * pitchCos;
    return [x1, y1, z2];
  }

  function projectPoint(x, y, z) {
    var rotated = rotatePoint(x, y, z);
    var perspective = 8.6 / Math.max(4.8, 8.6 - rotated[2]);
    return {
      x: centerX + rotated[0] * sceneScale * perspective * zoom,
      y: centerY - rotated[1] * sceneScale * perspective * zoom,
      z: rotated[2],
      perspective: perspective
    };
  }

  function modelPosition(particle, time) {
    var x = particle.x;
    var y = particle.y;
    var z = particle.z;
    var breathing = Math.sin(time * 0.0016) * 0.022;

    if (particle.part === "body" || particle.part === "chest") {
      x *= 1 + breathing * 0.2;
      y += breathing * (particle.y + 2.2) * 0.35;
    } else if (particle.part === "head" || particle.part.indexOf("ear") === 0) {
      y += Math.sin(time * 0.00135) * 0.025;
    } else if (particle.part === "tail") {
      var sway = Math.sin(time * 0.0017 + particle.tailT * 2.8) * (0.05 + particle.tailT * 0.11);
      x += sway;
      z += sway * 0.7;
    }
    return [x, y, z];
  }

  function drawBackground(time) {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    var ambience = 0.5 + Math.sin(time * 0.00023) * 0.5;
    var aura = ctx.createRadialGradient(centerX, centerY, 10, centerX, centerY, sceneScale * 4.8);
    aura.addColorStop(0, "rgba(" + Math.round(92 + ambience * 36) + "," + Math.round(70 + ambience * 86) + ",255,0.085)");
    aura.addColorStop(0.42, "rgba(69,220,220,0.035)");
    aura.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = aura;
    ctx.fillRect(0, 0, width, height);

    for (var i = 0; i < stars.length; i += 1) {
      var star = stars[i];
      var shimmer = 0.58 + Math.sin(time * 0.001 * star.speed + star.phase) * 0.42;
      ctx.globalAlpha = star.alpha * shimmer;
      ctx.fillStyle = i % 9 === 0 ? "#b59bff" : "#b8efff";
      ctx.beginPath();
      ctx.arc(star.x * width, star.y * height, star.size, 0, Math.PI * 2);
      ctx.fill();
    }

    if (!prefersReducedMotion) {
      for (var j = 0; j < meteors.length; j += 1) {
        var meteor = meteors[j];
        var cycle = (time * 0.000036 * meteor.speed + meteor.phase) % 1;
        if (cycle > 0.13) continue;
        var travel = cycle / 0.13;
        var meteorX = width * (1.12 - travel * 1.34);
        var meteorY = height * meteor.y + travel * height * 0.18;
        var meteorVisibility = Math.sin(travel * Math.PI) * meteor.alpha;
        var meteorGradient = ctx.createLinearGradient(meteorX, meteorY, meteorX + meteor.length, meteorY - meteor.length * 0.42);
        meteorGradient.addColorStop(0, "rgba(148,242,255," + meteorVisibility.toFixed(3) + ")");
        meteorGradient.addColorStop(1, "rgba(148,242,255,0)");
        ctx.globalAlpha = 1;
        ctx.strokeStyle = meteorGradient;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(meteorX, meteorY);
        ctx.lineTo(meteorX + meteor.length, meteorY - meteor.length * 0.42);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawOrbitField(time) {
    var visibility = (1 - smoothstep(0.18, 0.92, morph)) * (0.76 + pointerStrength * 0.22);
    if (visibility <= 0.01) return;

    var motionTime = prefersReducedMotion ? 0 : time;
    var rings = [
      { rx: 1.62, ry: 0.12, rz: 1.02, cy: -0.2, tilt: 0.2, speed: 0.00018, color: COLORS.cyan, alpha: 0.22 },
      { rx: 1.34, ry: 1.94, rz: 0.34, cy: 0.18, tilt: 1.1, speed: -0.00013, color: COLORS.violet, alpha: 0.16 },
      { rx: 1.22, ry: 0.08, rz: 0.86, cy: 1.42, tilt: -0.55, speed: 0.00024, color: COLORS.mint, alpha: 0.2 }
    ];

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 0.7;
    ctx.setLineDash([2, 7]);

    for (var r = 0; r < rings.length; r += 1) {
      var ring = rings[r];
      var offset = motionTime * ring.speed + ring.tilt;
      ctx.beginPath();
      var satellite = null;
      for (var i = 0; i <= 72; i += 1) {
        var angle = i / 72 * Math.PI * 2 + offset;
        var ringX = Math.cos(angle) * ring.rx;
        var ringY = ring.cy + Math.sin(angle) * ring.ry;
        var ringZ = Math.sin(angle) * ring.rz;
        var projectedRing = projectPoint(ringX, ringY, ringZ);
        if (i === 0) ctx.moveTo(projectedRing.x, projectedRing.y);
        else ctx.lineTo(projectedRing.x, projectedRing.y);
        if (i === 10 + r * 13) satellite = projectedRing;
      }
      ctx.strokeStyle = "rgba(" + ring.color[0] + "," + ring.color[1] + "," + ring.color[2] + "," + (ring.alpha * visibility).toFixed(3) + ")";
      ctx.stroke();

      if (satellite) {
        ctx.setLineDash([]);
        ctx.globalAlpha = 0.65 * visibility;
        ctx.fillStyle = "rgb(" + ring.color[0] + "," + ring.color[1] + "," + ring.color[2] + ")";
        ctx.beginPath();
        ctx.arc(satellite.x, satellite.y, 1.8 + pointerStrength, 0, Math.PI * 2);
        ctx.fill();
        ctx.setLineDash([2, 7]);
      }
    }

    var scanProgress = prefersReducedMotion ? 0.58 : (time * 0.000105) % 1;
    var scanY = -2.2 + scanProgress * 4.85;
    var scanWidth = 0.72 + (1 - Math.min(1, Math.abs(scanY + 0.05) / 2.55)) * 0.92;
    ctx.setLineDash([]);
    ctx.lineWidth = 1;
    ctx.shadowBlur = 13;
    ctx.shadowColor = "rgba(102,238,255,0.58)";
    ctx.beginPath();
    for (var s = 0; s <= 64; s += 1) {
      var scanAngle = s / 64 * Math.PI * 2;
      var scanPoint = projectPoint(Math.cos(scanAngle) * scanWidth, scanY, Math.sin(scanAngle) * 0.88);
      if (s === 0) ctx.moveTo(scanPoint.x, scanPoint.y);
      else ctx.lineTo(scanPoint.x, scanPoint.y);
    }
    var scanAlpha = Math.sin(scanProgress * Math.PI) * 0.42 * visibility;
    ctx.strokeStyle = "rgba(112,236,255," + scanAlpha.toFixed(3) + ")";
    ctx.stroke();
    ctx.restore();
  }

  function drawWireframe(time) {
    var visibility = (1 - smoothstep(0.05, 0.7, morph)) * (1 - pointerStrength * 0.44);
    if (visibility <= 0.01) return;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.lineWidth = 0.72;
    ctx.shadowBlur = 8;

    for (var i = 0; i < wirePaths.length; i += 1) {
      var path = wirePaths[i];
      var color = COLORS[path.color] || COLORS.cyan;
      ctx.beginPath();
      for (var j = 0; j < path.points.length; j += 1) {
        var point = path.points[j];
        var projected = projectPoint(point[0], point[1], point[2]);
        if (j === 0) ctx.moveTo(projected.x, projected.y);
        else ctx.lineTo(projected.x, projected.y);
      }
      var alpha = path.alpha * visibility * (0.88 + Math.sin(time * 0.0017 + i) * 0.12);
      ctx.strokeStyle = "rgba(" + color[0] + "," + color[1] + "," + color[2] + "," + alpha.toFixed(3) + ")";
      ctx.shadowColor = "rgba(" + color[0] + "," + color[1] + "," + color[2] + ",0.42)";
      ctx.stroke();
    }
    ctx.restore();
  }

  function applyFluidField(projected, time) {
    var influence = 0;
    var radius = width < 760 ? 86 : 138;
    var activeStrength = pointerStrength * (dragging ? 0.12 : 1);

    if (activeStrength > 0.005) {
      var dx = projected.x - pointerX;
      var dy = projected.y - pointerY;
      var distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < radius * radius) {
        var distance = Math.sqrt(distanceSquared) || 0.001;
        influence = Math.pow(1 - distance / radius, 2) * activeStrength;
        var currentPulse = 0.88 + Math.sin(time * 0.004 + distance * 0.035) * 0.12;
        var force = (28 + radius * 0.32) * influence * currentPulse;
        projected.x += dx / distance * force;
        projected.y += dy / distance * force;
      }
    }

    for (var i = 0; i < shockwaves.length; i += 1) {
      var shockwave = shockwaves[i];
      var age = (time - shockwave.start) / 1050;
      if (age < 0 || age > 1) continue;
      var waveDx = projected.x - shockwave.x;
      var waveDy = projected.y - shockwave.y;
      var waveDistance = Math.sqrt(waveDx * waveDx + waveDy * waveDy) || 0.001;
      var ringDistance = age * (width < 760 ? 190 : 310);
      var ringWidth = 52 + age * 30;
      var ringInfluence = Math.max(0, 1 - Math.abs(waveDistance - ringDistance) / ringWidth) * (1 - age);
      if (ringInfluence > 0) {
        var waveForce = ringInfluence * (width < 760 ? 24 : 42);
        projected.x += waveDx / waveDistance * waveForce;
        projected.y += waveDy / waveDistance * waveForce;
        influence = Math.max(influence, ringInfluence * 0.72);
      }
    }

    return influence;
  }

  function drawParticles(time) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    for (var i = 0; i < particles.length; i += renderStride) {
      var particle = particles[i];
      var localMorph = smoothstep(particle.delay, 1, morph);
      var shapedMorph = easeInOut(localMorph);
      var model = modelPosition(particle, time);
      var drift = Math.sin(time * 0.00072 * particle.speed + particle.phase);
      var swirl = Math.sin(time * 0.00045 + particle.phase + particle.sy) * shapedMorph;
      var x = lerp(model[0], particle.sx, shapedMorph) + swirl * 0.16 * shapedMorph;
      var y = lerp(model[1], particle.sy, shapedMorph) + drift * 0.085 * shapedMorph;
      var z = lerp(model[2], particle.sz, shapedMorph) + Math.cos(time * 0.00055 + particle.phase) * 0.1 * shapedMorph;
      var projected = projectPoint(x, y, z);
      var fluidInfluence = applyFluidField(projected, time);

      if (projected.x < -20 || projected.x > width + 20 || projected.y < -20 || projected.y > height + 20) continue;

      var depthAlpha = clamp(0.52 + (projected.z + 3) * 0.075, 0.24, 1);
      var twinkle = 0.82 + Math.sin(time * 0.0022 * particle.speed + particle.phase) * 0.18;
      var fieldFade = lerp(1, 0.78, shapedMorph);
      var alpha = particle.alpha * depthAlpha * twinkle * fieldFade;
      var size = particle.size * projected.perspective * lerp(1, 0.78, shapedMorph) * (1 + fluidInfluence * 0.62);
      var color = particle.color;
      var fluidColor = Math.min(0.78, fluidInfluence * 0.9);
      var accent = Math.sin(time * 0.0018 + particle.phase) > 0 ? COLORS.pink : COLORS.mint;
      var red = Math.round(lerp(color[0], accent[0], fluidColor));
      var green = Math.round(lerp(color[1], accent[1], fluidColor));
      var blue = Math.round(lerp(color[2], accent[2], fluidColor));

      if ((transitionEnergy > 0.04 || fluidInfluence > 0.06) && i % 7 === 0 && particle.previousX !== null) {
        var trailAlpha = Math.min(0.32, transitionEnergy * 0.18 + fluidInfluence * 0.28) * alpha;
        ctx.globalAlpha = trailAlpha;
        ctx.strokeStyle = "rgb(" + red + "," + green + "," + blue + ")";
        ctx.lineWidth = Math.max(0.45, size * 0.5);
        ctx.beginPath();
        ctx.moveTo(particle.previousX, particle.previousY);
        ctx.lineTo(projected.x, projected.y);
        ctx.stroke();
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = "rgb(" + red + "," + green + "," + blue + ")";
      if (particle.glow || size > 1.45) {
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, Math.max(0.65, size), 0, Math.PI * 2);
        ctx.fill();
      } else {
        var pixel = Math.max(0.8, size * 1.16);
        ctx.fillRect(projected.x - pixel * 0.5, projected.y - pixel * 0.5, pixel, pixel);
      }

      if (particle.glow) {
        ctx.globalAlpha = alpha * 0.13;
        ctx.beginPath();
        ctx.arc(projected.x, projected.y, size * 5.2, 0, Math.PI * 2);
        ctx.fill();
      }

      particle.previousX = projected.x;
      particle.previousY = projected.y;
    }
    ctx.restore();
  }

  function drawInteractionFx(time) {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";

    if (pointerStrength > 0.01) {
      var fieldRadius = (width < 760 ? 86 : 138) * (0.92 + Math.sin(time * 0.003) * 0.04);
      var pointerAura = ctx.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, fieldRadius);
      pointerAura.addColorStop(0, "rgba(255,255,255," + (0.075 * pointerStrength).toFixed(3) + ")");
      pointerAura.addColorStop(0.18, "rgba(177,139,255," + (0.09 * pointerStrength).toFixed(3) + ")");
      pointerAura.addColorStop(0.58, "rgba(83,238,219," + (0.045 * pointerStrength).toFixed(3) + ")");
      pointerAura.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = pointerAura;
      ctx.beginPath();
      ctx.arc(pointerX, pointerY, fieldRadius, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.34 * pointerStrength;
      ctx.strokeStyle = "rgba(121,238,255,0.82)";
      ctx.lineWidth = 0.8;
      ctx.setLineDash([2, 8]);
      ctx.lineDashOffset = prefersReducedMotion ? 0 : -time * 0.018;
      ctx.beginPath();
      ctx.arc(pointerX, pointerY, fieldRadius * 0.72, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      ctx.globalAlpha = 0.72 * pointerStrength;
      ctx.fillStyle = "#d9fbff";
      ctx.beginPath();
      ctx.arc(pointerX, pointerY, 1.4, 0, Math.PI * 2);
      ctx.fill();
    }

    var activeShockwaves = [];
    for (var i = 0; i < shockwaves.length; i += 1) {
      var shockwave = shockwaves[i];
      var age = (time - shockwave.start) / 1050;
      if (age < 0 || age > 1) continue;
      activeShockwaves.push(shockwave);
      var shockRadius = age * (width < 760 ? 190 : 310);
      var shockAlpha = Math.pow(1 - age, 1.6);
      ctx.globalAlpha = shockAlpha * 0.68;
      ctx.strokeStyle = i % 2 ? "#b58cff" : "#76f5d1";
      ctx.lineWidth = 1.2 + (1 - age) * 1.5;
      ctx.shadowBlur = 16;
      ctx.shadowColor = ctx.strokeStyle;
      ctx.beginPath();
      ctx.arc(shockwave.x, shockwave.y, shockRadius, 0, Math.PI * 2);
      ctx.stroke();
    }
    shockwaves = activeShockwaves;
    ctx.restore();
  }

  function setPhase(text) {
    if (phaseLabel && phaseLabel.textContent !== text) phaseLabel.textContent = text;
  }

  function startTransition(target, now) {
    var destination = clamp(target, 0, 1);
    if (transition && Math.abs(transition.to - destination) < 0.001) return;
    transition = {
      from: morph,
      to: destination,
      start: now || performance.now(),
      duration: destination > morph ? 2350 : 2750
    };
    setPhase(destination > morph ? "DISSOLVING" : "REASSEMBLING");
  }

  function updateTransition(now) {
    if (transition) {
      var progress = clamp((now - transition.start) / transition.duration, 0, 1);
      transitionEnergy = Math.sin(progress * Math.PI);
      morph = lerp(transition.from, transition.to, easeInOut(progress));
      if (progress >= 1) {
        morph = transition.to;
        transition = null;
        setPhase(morph > 0.5 ? "PARTICLE FIELD" : "MODEL LOCKED");
        nextAutoAt = now + (morph > 0.5 ? 1250 : 4400);
      }
    } else if (autoPlay && now >= nextAutoAt) {
      startTransition(morph < 0.5 ? 1 : 0, now);
    } else {
      transitionEnergy += (0 - transitionEnergy) * 0.12;
    }
  }

  function updateCamera(delta, time) {
    if (!dragging) {
      targetYaw += delta * 0.000055;
      targetYaw += yawVelocity;
      targetPitch += pitchVelocity;
      yawVelocity *= 0.91;
      pitchVelocity *= 0.89;
    }

    targetPitch = clamp(targetPitch, -0.72, 0.72);
    yaw += (targetYaw - yaw) * 0.1;
    pitch += (targetPitch - pitch) * 0.1;
    zoom += (targetZoom - zoom) * 0.12;
    pointerStrength += (pointerTargetStrength - pointerStrength) * (pointerTargetStrength > pointerStrength ? 0.12 : 0.075);

    if (!dragging && Math.abs(yawVelocity) < 0.0001) {
      targetPitch += (0.035 + Math.sin(time * 0.0004) * 0.035 - targetPitch) * 0.003;
    }
  }

  function monitorPerformance(delta) {
    frameSamples += 1;
    if (delta > 25) slowFrames += 1;
    if (frameSamples >= 180) {
      if (slowFrames > 72 && renderStride === 1) renderStride = 2;
      frameSamples = 0;
      slowFrames = 0;
    }
  }

  function render(now) {
    var delta = clamp(now - lastFrame, 0, 50);
    lastFrame = now;
    elapsed += delta;
    updateTransition(now);
    updateCamera(delta, now);
    drawBackground(now);
    drawOrbitField(now);
    drawWireframe(now);
    drawParticles(now);
    drawInteractionFx(now);
    monitorPerformance(delta);
    animationFrame = window.requestAnimationFrame(render);
  }

  function resetView() {
    targetYaw = -0.42;
    targetPitch = 0.04;
    targetZoom = 1;
    yawVelocity = 0;
    pitchVelocity = 0;
  }

  function updateAutoButton() {
    if (!autoButton) return;
    autoButton.setAttribute("aria-pressed", String(autoPlay));
    autoButton.textContent = "自动循环：" + (autoPlay ? "开" : "关");
  }

  canvas.addEventListener("pointerdown", function (event) {
    if (event.button !== undefined && event.button !== 0) return;
    dragging = true;
    activePointerId = event.pointerId;
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerDownX = event.clientX;
    pointerDownY = event.clientY;
    pointerDownAt = performance.now();
    pointerTravel = 0;
    pointerLastMove = pointerDownAt;
    pointerTargetStrength = coarsePointerQuery.matches ? 0.45 : 1;
    yawVelocity = 0;
    pitchVelocity = 0;
    canvas.classList.add("is-dragging");
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", function (event) {
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerLastMove = performance.now();
    pointerTargetStrength = coarsePointerQuery.matches && !dragging ? 0 : 1;
    if (autoPlay && morph < 0.5 && !transition) nextAutoAt = Math.max(nextAutoAt, pointerLastMove + 1500);
    if (!dragging || event.pointerId !== activePointerId) return;
    var movementX = event.clientX - pointerDownX;
    var movementY = event.clientY - pointerDownY;
    pointerTravel += Math.abs(movementX) + Math.abs(movementY);
    pointerDownX = event.clientX;
    pointerDownY = event.clientY;
    targetYaw += movementX * 0.0085;
    targetPitch += movementY * 0.0065;
    yawVelocity = movementX * 0.00072;
    pitchVelocity = movementY * 0.0005;
  });

  function releasePointer(event) {
    if (event.pointerId !== activePointerId) return;
    var wasTap = event.type === "pointerup" && pointerTravel < 9 && performance.now() - pointerDownAt < 520;
    if (wasTap && !prefersReducedMotion) {
      shockwaves.push({ x: event.clientX, y: event.clientY, start: performance.now() });
      if (shockwaves.length > 3) shockwaves.shift();
    }
    dragging = false;
    activePointerId = null;
    canvas.classList.remove("is-dragging");
  }

  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);
  canvas.addEventListener("pointerenter", function (event) {
    pointerX = event.clientX;
    pointerY = event.clientY;
    pointerTargetStrength = coarsePointerQuery.matches ? 0 : 1;
  });
  canvas.addEventListener("pointerleave", function () {
    if (!dragging) pointerTargetStrength = 0;
  });
  canvas.addEventListener("lostpointercapture", function () {
    dragging = false;
    activePointerId = null;
    pointerTargetStrength = 0;
    canvas.classList.remove("is-dragging");
  });

  canvas.addEventListener("wheel", function (event) {
    event.preventDefault();
    targetZoom = clamp(targetZoom - event.deltaY * 0.00075, 0.72, 1.42);
  }, { passive: false });

  canvas.addEventListener("dblclick", resetView);

  if (triggerButton) {
    triggerButton.addEventListener("click", function () {
      startTransition(morph < 0.5 ? 1 : 0, performance.now());
    });
  }

  if (autoButton) {
    autoButton.addEventListener("click", function () {
      autoPlay = !autoPlay;
      nextAutoAt = performance.now() + (morph > 0.5 ? 1200 : 4200);
      updateAutoButton();
    });
  }

  if (resetButton) resetButton.addEventListener("click", resetView);

  window.addEventListener("keydown", function (event) {
    var target = event.target;
    if (target && /button|a|input|textarea|select/i.test(target.tagName)) return;
    if (event.key === "ArrowLeft") targetYaw -= 0.14;
    else if (event.key === "ArrowRight") targetYaw += 0.14;
    else if (event.key === "ArrowUp") targetPitch = clamp(targetPitch - 0.1, -0.72, 0.72);
    else if (event.key === "ArrowDown") targetPitch = clamp(targetPitch + 0.1, -0.72, 0.72);
    else if (event.key === " ") {
      event.preventDefault();
      startTransition(morph < 0.5 ? 1 : 0, performance.now());
    }
  });

  var resizeTimer = 0;
  window.addEventListener("resize", function () {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(resize, 100);
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    } else if (!animationFrame) {
      lastFrame = performance.now();
      animationFrame = window.requestAnimationFrame(render);
    }
  });

  reducedMotionQuery.addEventListener("change", function (event) {
    prefersReducedMotion = event.matches;
    if (prefersReducedMotion) autoPlay = false;
    updateAutoButton();
  });

  resize();
  buildCat();
  updateAutoButton();
  setPhase("MODEL LOCKED");
  animationFrame = window.requestAnimationFrame(render);
})();
