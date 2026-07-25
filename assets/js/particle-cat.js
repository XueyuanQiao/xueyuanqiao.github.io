(function () {
  "use strict";

  var canvas = document.getElementById("cat-particle-stage");
  if (!canvas) return;

  var ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) {
    document.documentElement.classList.add("no-particle-canvas");
    return;
  }

  var root = document.documentElement;
  var triggerButton = document.querySelector("[data-particle-trigger]");
  var flowButton = document.querySelector("[data-particle-flow]");
  var glowButton = document.querySelector("[data-particle-glow]");
  var resetButton = document.querySelector("[data-particle-reset]");
  var reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var coarsePointerQuery = window.matchMedia("(pointer: coarse)");

  var width = 0;
  var height = 0;
  var dpr = 1;
  var particles = [];
  var meteors = [];
  var waves = [];
  var frameId = 0;
  var lastFrame = performance.now();
  var lastMeteor = performance.now();
  var pointer = { x: -9999, y: -9999, active: false, strength: 0 };
  var view = { x: 0, y: 0, targetX: 0, targetY: 0 };
  var flowEnabled = !reducedMotionQuery.matches;
  var glowEnabled = true;
  var paused = false;
  var quality = getQuality();

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function getQuality() {
    var cores = navigator.hardwareConcurrency || 4;
    var memory = navigator.deviceMemory || 4;
    if (window.innerWidth < 520 || cores <= 2 || memory <= 2) return 0.48;
    if (coarsePointerQuery.matches || window.innerWidth < 900 || cores <= 4 || memory <= 4) return 0.7;
    return 1;
  }

  function starCount() {
    var areaFactor = clamp((window.innerWidth * window.innerHeight) / 1200000, 0.65, 1.35);
    return Math.round(760 * quality * areaFactor);
  }

  function makeParticle(index, total) {
    var depth = Math.pow(Math.random(), 0.72);
    var bright = Math.random();
    var warm = Math.random() > 0.82;
    var blue = !warm && Math.random() > 0.72;
    var size = bright > 0.965 ? random(1.45, 2.5) : random(0.32, 1.22);

    return {
      x: index < total * 0.1 ? (index / (total * 0.1)) : Math.random(),
      y: Math.random(),
      depth: depth,
      size: size,
      alpha: random(0.18, bright > 0.94 ? 0.94 : 0.67),
      phase: Math.random() * Math.PI * 2,
      twinkle: random(0.45, 1.4),
      drift: random(0.14, 0.55) * (Math.random() > 0.5 ? 1 : -1),
      color: warm ? "255,205,155" : blue ? "152,211,255" : "226,238,255",
      ox: 0,
      oy: 0,
      vx: 0,
      vy: 0,
      streak: bright > 0.985
    };
  }

  function buildUniverse() {
    var count = starCount();
    particles = [];
    for (var i = 0; i < count; i += 1) particles.push(makeParticle(i, count));
  }

  function resize() {
    var oldWidth = width || window.innerWidth;
    var oldHeight = height || window.innerHeight;
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, quality < 0.6 ? 1.25 : 1.75);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (oldWidth !== width || oldHeight !== height) {
      pointer.x = -9999;
      pointer.y = -9999;
    }
  }

  function updateView() {
    view.x += (view.targetX - view.x) * 0.045;
    view.y += (view.targetY - view.y) * 0.045;
    root.style.setProperty("--space-x", view.x.toFixed(4));
    root.style.setProperty("--space-y", view.y.toFixed(4));
  }

  function updateParticle(particle, dt, time) {
    var depthScale = 0.22 + particle.depth * 0.78;
    var x = particle.x * width + view.x * 23 * depthScale;
    var y = particle.y * height + view.y * 15 * depthScale;

    if (flowEnabled && !reducedMotionQuery.matches) {
      particle.x += particle.drift * 0.0000058 * dt * depthScale;
      particle.y += Math.sin(time * 0.00022 + particle.phase) * 0.0000018 * dt * depthScale;
      if (particle.x > 1.04) particle.x = -0.04;
      if (particle.x < -0.04) particle.x = 1.04;
      if (particle.y > 1.04) particle.y = -0.04;
      if (particle.y < -0.04) particle.y = 1.04;
    }

    if (pointer.strength > 0.01) {
      var dx = x + particle.ox - pointer.x;
      var dy = y + particle.oy - pointer.y;
      var radius = (coarsePointerQuery.matches ? 108 : 148) * (0.72 + depthScale * 0.38);
      var distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < radius * radius && distanceSquared > 0.1) {
        var distance = Math.sqrt(distanceSquared);
        var force = Math.pow(1 - distance / radius, 2) * 1.35 * pointer.strength * depthScale;
        particle.vx += dx / distance * force;
        particle.vy += dy / distance * force;
      }
    }

    for (var i = 0; i < waves.length; i += 1) {
      var wave = waves[i];
      var wx = x + particle.ox - wave.x;
      var wy = y + particle.oy - wave.y;
      var waveDistance = Math.hypot(wx, wy);
      var band = Math.abs(waveDistance - wave.radius);
      if (band < wave.width && waveDistance > 0.1) {
        var waveForce = (1 - band / wave.width) * wave.power * wave.opacity * depthScale;
        particle.vx += wx / waveDistance * waveForce;
        particle.vy += wy / waveDistance * waveForce;
      }
    }

    particle.vx += -particle.ox * 0.014;
    particle.vy += -particle.oy * 0.014;
    particle.vx *= 0.906;
    particle.vy *= 0.906;
    particle.ox += particle.vx * dt * 0.06;
    particle.oy += particle.vy * dt * 0.06;

    return { x: x + particle.ox, y: y + particle.oy, depth: depthScale };
  }

  function drawParticle(particle, point, time) {
    var twinkle = reducedMotionQuery.matches
      ? 0.82
      : 0.7 + Math.sin(time * 0.001 * particle.twinkle + particle.phase) * 0.3;
    var alpha = particle.alpha * twinkle * (0.58 + point.depth * 0.52);
    var size = particle.size * (0.58 + point.depth * 0.72);

    if (glowEnabled && particle.size > 1.3) {
      var halo = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, size * 5.5);
      halo.addColorStop(0, "rgba(" + particle.color + "," + Math.min(0.3, alpha * 0.34) + ")");
      halo.addColorStop(0.22, "rgba(" + particle.color + "," + Math.min(0.11, alpha * 0.12) + ")");
      halo.addColorStop(1, "rgba(" + particle.color + ",0)");
      ctx.fillStyle = halo;
      ctx.beginPath();
      ctx.arc(point.x, point.y, size * 5.5, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = "rgba(" + particle.color + "," + alpha + ")";
    ctx.beginPath();
    ctx.arc(point.x, point.y, size, 0, Math.PI * 2);
    ctx.fill();

    if (particle.streak && glowEnabled) {
      ctx.strokeStyle = "rgba(" + particle.color + "," + alpha * 0.18 + ")";
      ctx.lineWidth = 0.55;
      ctx.beginPath();
      ctx.moveTo(point.x - size * 4.6, point.y);
      ctx.lineTo(point.x + size * 4.6, point.y);
      ctx.moveTo(point.x, point.y - size * 4.6);
      ctx.lineTo(point.x, point.y + size * 4.6);
      ctx.stroke();
    }
  }

  function spawnMeteor(force) {
    if (meteors.length > 4) return;
    var fromLeft = Math.random() > 0.38;
    meteors.push({
      x: fromLeft ? random(width * 0.12, width * 0.72) : random(width * 0.52, width * 0.9),
      y: random(-30, height * 0.28),
      vx: fromLeft ? random(8.5, 13.5) : random(-11.5, -7.5),
      vy: random(3.2, 5.8),
      length: force ? random(130, 220) : random(75, 150),
      life: 1,
      decay: force ? random(0.012, 0.018) : random(0.017, 0.025),
      warm: Math.random() > 0.72
    });
  }

  function drawMeteors(dt) {
    for (var i = meteors.length - 1; i >= 0; i -= 1) {
      var meteor = meteors[i];
      meteor.x += meteor.vx * dt * 0.06;
      meteor.y += meteor.vy * dt * 0.06;
      meteor.life -= meteor.decay * dt * 0.06;
      if (meteor.life <= 0 || meteor.y > height + 100) {
        meteors.splice(i, 1);
        continue;
      }

      var speed = Math.hypot(meteor.vx, meteor.vy);
      var tailX = meteor.x - meteor.vx / speed * meteor.length;
      var tailY = meteor.y - meteor.vy / speed * meteor.length;
      var gradient = ctx.createLinearGradient(tailX, tailY, meteor.x, meteor.y);
      var color = meteor.warm ? "255,199,151" : "188,228,255";
      gradient.addColorStop(0, "rgba(" + color + ",0)");
      gradient.addColorStop(0.78, "rgba(" + color + "," + meteor.life * 0.2 + ")");
      gradient.addColorStop(1, "rgba(255,255,255," + meteor.life * 0.82 + ")");
      ctx.strokeStyle = gradient;
      ctx.lineWidth = 1.15;
      ctx.beginPath();
      ctx.moveTo(tailX, tailY);
      ctx.lineTo(meteor.x, meteor.y);
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255," + meteor.life + ")";
      ctx.beginPath();
      ctx.arc(meteor.x, meteor.y, 1.25, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function addWave(x, y, power, delay) {
    window.setTimeout(function () {
      waves.push({ x: x, y: y, radius: 0, opacity: 0.72, speed: random(4.8, 6.4), width: 52, power: power || 0.9 });
    }, delay || 0);
  }

  function updateAndDrawWaves(dt) {
    for (var i = waves.length - 1; i >= 0; i -= 1) {
      var wave = waves[i];
      wave.radius += wave.speed * dt * 0.06;
      wave.opacity *= Math.pow(0.983, dt * 0.06);
      if (wave.opacity < 0.015 || wave.radius > Math.hypot(width, height)) {
        waves.splice(i, 1);
        continue;
      }

      var ring = ctx.createRadialGradient(
        wave.x,
        wave.y,
        Math.max(0, wave.radius - wave.width),
        wave.x,
        wave.y,
        wave.radius + wave.width
      );
      ring.addColorStop(0, "rgba(113,197,255,0)");
      ring.addColorStop(0.46, "rgba(129,211,255," + wave.opacity * 0.05 + ")");
      ring.addColorStop(0.5, "rgba(220,240,255," + wave.opacity * 0.22 + ")");
      ring.addColorStop(0.54, "rgba(156,143,255," + wave.opacity * 0.08 + ")");
      ring.addColorStop(1, "rgba(113,197,255,0)");
      ctx.fillStyle = ring;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.radius + wave.width, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawNebulaDust(time) {
    if (!glowEnabled) return;
    var x = width * (0.58 + view.x * 0.015);
    var y = height * (0.44 + view.y * 0.012);
    var radius = Math.min(width, height) * 0.58;
    var aura = ctx.createRadialGradient(x, y, 0, x, y, radius);
    var breath = reducedMotionQuery.matches ? 0.055 : 0.047 + Math.sin(time * 0.00035) * 0.012;
    aura.addColorStop(0, "rgba(96,166,224," + breath + ")");
    aura.addColorStop(0.38, "rgba(91,83,176," + breath * 0.42 + ")");
    aura.addColorStop(1, "rgba(5,10,30,0)");
    ctx.fillStyle = aura;
    ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
  }

  function render(now) {
    if (paused) return;
    var dt = clamp(now - lastFrame, 8, 34);
    lastFrame = now;
    updateView();
    pointer.strength += ((pointer.active ? 1 : 0) - pointer.strength) * 0.08;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    drawNebulaDust(now);

    for (var i = 0; i < particles.length; i += 1) {
      var point = updateParticle(particles[i], dt, now);
      drawParticle(particles[i], point, now);
    }

    if (flowEnabled && !reducedMotionQuery.matches && now - lastMeteor > random(4200, 7800)) {
      spawnMeteor(false);
      lastMeteor = now;
    }
    drawMeteors(dt);
    updateAndDrawWaves(dt);
    ctx.restore();
    frameId = requestAnimationFrame(render);
  }

  function setPointer(event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
    view.targetX = clamp((event.clientX / width - 0.5) * 2, -1, 1);
    view.targetY = clamp((event.clientY / height - 0.5) * 2, -1, 1);
  }

  function clearPointer() {
    pointer.active = false;
    view.targetX = 0;
    view.targetY = 0;
  }

  function nebulaBurst() {
    var centerX = width * random(0.42, 0.58);
    var centerY = height * random(0.36, 0.54);
    for (var i = 0; i < particles.length; i += 1) {
      var particle = particles[i];
      var px = particle.x * width;
      var py = particle.y * height;
      var dx = px - centerX;
      var dy = py - centerY;
      var distance = Math.max(42, Math.hypot(dx, dy));
      var force = clamp(460 / distance, 0.25, 3.8) * random(0.65, 1.15);
      particle.vx += dx / distance * force;
      particle.vy += dy / distance * force;
    }
    addWave(centerX, centerY, 1.55, 0);
    addWave(centerX, centerY, 1.05, 180);
    addWave(centerX, centerY, 0.72, 370);
    spawnMeteor(true);
    window.setTimeout(function () { spawnMeteor(true); }, 230);

    if (triggerButton) {
      triggerButton.textContent = "星云扩散中…";
      triggerButton.disabled = true;
      window.setTimeout(function () {
        triggerButton.textContent = "星云爆发";
        triggerButton.disabled = false;
      }, 1150);
    }
  }

  function resetUniverse() {
    pointer.active = false;
    view.targetX = 0;
    view.targetY = 0;
    meteors = [];
    waves = [];
    for (var i = 0; i < particles.length; i += 1) {
      particles[i].ox = 0;
      particles[i].oy = 0;
      particles[i].vx = 0;
      particles[i].vy = 0;
    }
    addWave(width * 0.5, height * 0.48, 0.72, 0);
  }

  function updateFlowButton() {
    if (!flowButton) return;
    flowButton.setAttribute("aria-pressed", String(flowEnabled));
    flowButton.textContent = "星轨流动：" + (flowEnabled ? "开" : "关");
  }

  function updateGlowButton() {
    if (!glowButton) return;
    glowButton.setAttribute("aria-pressed", String(glowEnabled));
    glowButton.textContent = "宇宙辉光：" + (glowEnabled ? "开" : "关");
    document.body.classList.toggle("glow-off", !glowEnabled);
  }

  function onVisibilityChange() {
    if (document.hidden) {
      paused = true;
      cancelAnimationFrame(frameId);
    } else if (paused) {
      paused = false;
      lastFrame = performance.now();
      frameId = requestAnimationFrame(render);
    }
  }

  canvas.addEventListener("pointermove", setPointer, { passive: true });
  canvas.addEventListener("pointerenter", setPointer, { passive: true });
  canvas.addEventListener("pointerleave", clearPointer, { passive: true });
  canvas.addEventListener("pointerdown", function (event) {
    setPointer(event);
    addWave(event.clientX, event.clientY, 1.05, 0);
  }, { passive: true });

  window.addEventListener("mousemove", function (event) {
    view.targetX = clamp((event.clientX / width - 0.5) * 2, -1, 1);
    view.targetY = clamp((event.clientY / height - 0.5) * 2, -1, 1);
  }, { passive: true });
  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", onVisibilityChange);

  if (triggerButton) triggerButton.addEventListener("click", nebulaBurst);
  if (resetButton) resetButton.addEventListener("click", resetUniverse);
  if (flowButton) {
    flowButton.addEventListener("click", function () {
      flowEnabled = !flowEnabled;
      updateFlowButton();
    });
  }
  if (glowButton) {
    glowButton.addEventListener("click", function () {
      glowEnabled = !glowEnabled;
      updateGlowButton();
    });
  }

  function onReducedMotionChange(event) {
    if (event.matches) {
      flowEnabled = false;
      meteors = [];
      updateFlowButton();
    }
  }

  if (typeof reducedMotionQuery.addEventListener === "function") {
    reducedMotionQuery.addEventListener("change", onReducedMotionChange);
  }

  resize();
  buildUniverse();
  updateFlowButton();
  updateGlowButton();
  root.classList.add("particle-ready");
  addWave(width * 0.54, height * 0.46, 0.52, 420);
  frameId = requestAnimationFrame(render);
})();
