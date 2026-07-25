(function () {
  "use strict";

  var canvas = document.getElementById("cat-particle-stage");
  if (!canvas) return;

  var ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) {
    document.documentElement.classList.add("no-particle-canvas");
    return;
  }

  var triggerButton = document.querySelector("[data-particle-trigger]");
  var flowButton = document.querySelector("[data-particle-flow]");
  var glowButton = document.querySelector("[data-particle-glow]");
  var resetButton = document.querySelector("[data-particle-reset]");
  var reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var coarsePointerQuery = window.matchMedia("(pointer: coarse)");
  var prefersReducedMotion = reducedMotionQuery.matches;
  var modelSource = canvas.getAttribute("data-model-src");

  var width = 0;
  var height = 0;
  var dpr = 1;
  var centerX = 0;
  var centerY = 0;
  var sceneScale = 1;
  var particles = [];
  var stars = [];
  var shockwaves = [];
  var animationFrame = 0;
  var lastFrame = performance.now();
  var elapsed = 0;
  var morph = 0;
  var morphTransition = null;
  var flowEnabled = !prefersReducedMotion;
  var glowEnabled = true;
  var yaw = -0.035;
  var pitch = 0.012;
  var targetYaw = yaw;
  var targetPitch = pitch;
  var zoom = 1;
  var targetZoom = 1;
  var dragging = false;
  var activePointerId = null;
  var pointerX = -1000;
  var pointerY = -1000;
  var pointerStrength = 0;
  var pointerTargetStrength = 0;
  var pointerLastMove = 0;
  var pointerDownAt = 0;
  var pointerTravel = 0;
  var frameSamples = 0;
  var slowFrames = 0;
  var renderStride = 1;

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

  function randomRange(min, max) {
    return min + Math.random() * (max - min);
  }

  function qualityFactor() {
    var cores = navigator.hardwareConcurrency || 4;
    var memory = navigator.deviceMemory || 4;
    if (window.innerWidth < 520 || cores <= 2 || memory <= 2) return 0.43;
    if (coarsePointerQuery.matches || window.innerWidth < 900 || cores <= 4 || memory <= 4) return 0.62;
    return 1;
  }

  var quality = qualityFactor();

  function targetParticleCount() {
    return Math.round(30000 * quality);
  }

  function loadImage(source) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.decoding = "async";
      image.onload = function () { resolve(image); };
      image.onerror = reject;
      image.src = source;
    });
  }

  function boostedColor(r, g, b, luma) {
    var lift = luma < 78 ? (78 - luma) * 0.8 : 4;
    var warmth = Math.max(0, r - b) * 0.055;
    var red = clamp(Math.round(r + lift * 0.58 + warmth), 0, 255);
    var green = clamp(Math.round(g + lift * 0.72 + 3), 0, 255);
    var blue = clamp(Math.round(b + lift + 7), 0, 255);
    return {
      r: red,
      g: green,
      b: blue,
      css: "rgb(" + red + "," + green + "," + blue + ")"
    };
  }

  function buildParticles(image) {
    var maximum = 900;
    var ratio = Math.min(1, maximum / Math.max(image.naturalWidth, image.naturalHeight));
    var sampleWidth = Math.max(1, Math.round(image.naturalWidth * ratio));
    var sampleHeight = Math.max(1, Math.round(image.naturalHeight * ratio));
    var sampleCanvas = document.createElement("canvas");
    var sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
    sampleCanvas.width = sampleWidth;
    sampleCanvas.height = sampleHeight;
    sampleContext.clearRect(0, 0, sampleWidth, sampleHeight);
    sampleContext.drawImage(image, 0, 0, sampleWidth, sampleHeight);

    var pixels = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight).data;
    var candidates = [];
    var scanStep = quality < 0.55 ? 2 : 1;

    for (var y = 0; y < sampleHeight; y += scanStep) {
      for (var x = 0; x < sampleWidth; x += scanStep) {
        var index = (y * sampleWidth + x) * 4;
        var alpha = pixels[index + 3];
        if (alpha < 38) continue;

        var r = pixels[index];
        var g = pixels[index + 1];
        var b = pixels[index + 2];
        var luma = r * 0.2126 + g * 0.7152 + b * 0.0722;
        var acceptance = (alpha / 255) * (0.54 + (255 - luma) / 255 * 0.46);
        if (Math.random() > acceptance) continue;
        candidates.push({ x: x, y: y, r: r, g: g, b: b, a: alpha, luma: luma });
      }
    }

    if (!candidates.length) throw new Error("头像中没有可用的粒子像素");

    var count = Math.min(targetParticleCount(), candidates.length);
    particles = [];

    for (var i = 0; i < count; i += 1) {
      var pick = i + Math.floor(Math.random() * (candidates.length - i));
      var temporary = candidates[i];
      candidates[i] = candidates[pick];
      candidates[pick] = temporary;
      var pixel = candidates[i];
      var modelX = pixel.x / sampleWidth * 2 - 1;
      var modelY = 1 - pixel.y / sampleHeight * 2;
      var side = clamp(Math.abs(modelX), 0, 1);
      var depth = (1 - Math.pow(side, 1.5)) * 0.12 + (128 - pixel.luma) / 255 * 0.08 + randomRange(-0.045, 0.045);
      var theta = Math.random() * Math.PI * 2;
      var radius = randomRange(1.2, 2.75);
      var color = boostedColor(pixel.r, pixel.g, pixel.b, pixel.luma);
      var detailBoost = pixel.luma < 118 ? 1.28 : 1;

      particles.push({
        x: modelX,
        y: modelY,
        z: depth,
        scatterX: Math.cos(theta) * radius + randomRange(-0.35, 0.35),
        scatterY: Math.sin(theta) * radius + randomRange(-0.35, 0.35),
        scatterZ: Math.sin(theta * 1.7) * randomRange(0.8, 2.1),
        r: color.r,
        g: color.g,
        b: color.b,
        css: color.css,
        alpha: Math.max(pixel.a / 255, pixel.luma < 118 ? 0.86 : 0.48),
        size: randomRange(1.05, 2.15) * detailBoost,
        phase: Math.random() * Math.PI * 2,
        speed: randomRange(0.45, 1.2),
        delay: Math.random() * 0.2,
        glow: Math.random() > (pixel.luma < 118 ? 0.94 : 0.975),
        offsetX: 0,
        offsetY: 0,
        velocityX: 0,
        velocityY: 0,
        previousX: null,
        previousY: null
      });
    }
  }

  function buildStars() {
    var count = Math.round(180 * Math.max(0.58, quality));
    stars = [];
    for (var i = 0; i < count; i += 1) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: randomRange(0.35, 1.35),
        alpha: randomRange(0.06, 0.42),
        phase: Math.random() * Math.PI * 2,
        speed: randomRange(0.12, 0.55),
        tint: Math.random() > 0.84 ? "125,234,255" : "211,228,238"
      });
    }
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, quality < 0.55 ? 1.3 : 1.75);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (width <= 900) {
      centerX = width * 0.5;
      centerY = height * 0.42;
      sceneScale = Math.min(width * 0.58, height * 0.36);
    } else {
      centerX = width * 0.5;
      centerY = height * 0.47;
      sceneScale = Math.min(width * 0.39, height * 0.475);
    }
  }

  function project(x, y, z) {
    var cosYaw = Math.cos(yaw);
    var sinYaw = Math.sin(yaw);
    var cosPitch = Math.cos(pitch);
    var sinPitch = Math.sin(pitch);
    var rotatedX = x * cosYaw - z * sinYaw;
    var rotatedZ = x * sinYaw + z * cosYaw;
    var rotatedY = y * cosPitch - rotatedZ * sinPitch;
    var finalZ = y * sinPitch + rotatedZ * cosPitch;
    var perspective = clamp(1 + finalZ * 0.1, 0.76, 1.26);
    var scale = sceneScale * zoom * perspective;
    return {
      x: centerX + rotatedX * scale,
      y: centerY - rotatedY * scale,
      perspective: perspective
    };
  }

  function drawBackground(time) {
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (var i = 0; i < stars.length; i += 1) {
      var star = stars[i];
      var twinkle = 0.56 + Math.sin(time * star.speed + star.phase) * 0.44;
      ctx.fillStyle = "rgba(" + star.tint + "," + (star.alpha * twinkle) + ")";
      ctx.fillRect(star.x * width, star.y * height, star.size, star.size);
    }

    var auraRadius = Math.min(width, height) * 0.48;
    var aura = ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, auraRadius);
    aura.addColorStop(0, "rgba(93,182,222,0.095)");
    aura.addColorStop(0.42, "rgba(101,92,194,0.038)");
    aura.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = aura;
    ctx.fillRect(centerX - auraRadius, centerY - auraRadius, auraRadius * 2, auraRadius * 2);
    ctx.restore();
  }

  function waveForce(particle, screenX, screenY) {
    for (var i = 0; i < shockwaves.length; i += 1) {
      var wave = shockwaves[i];
      var dx = screenX - wave.x;
      var dy = screenY - wave.y;
      var distance = Math.hypot(dx, dy);
      var band = Math.abs(distance - wave.radius);
      if (band < 54 && distance > 0.1) {
        var force = (1 - band / 54) * wave.alpha * 1.45;
        particle.velocityX += dx / distance * force;
        particle.velocityY += dy / distance * force;
      }
    }
  }

  function updateParticleOffset(particle, screenX, screenY) {
    if (pointerStrength > 0.015) {
      var dx = screenX + particle.offsetX - pointerX;
      var dy = screenY + particle.offsetY - pointerY;
      var distanceSquared = dx * dx + dy * dy;
      var radius = coarsePointerQuery.matches ? 118 : 154;

      if (distanceSquared < radius * radius && distanceSquared > 0.2) {
        var distance = Math.sqrt(distanceSquared);
        var force = Math.pow(1 - distance / radius, 2) * pointerStrength * 1.35;
        particle.velocityX += dx / distance * force;
        particle.velocityY += dy / distance * force;
      }
    }

    waveForce(particle, screenX + particle.offsetX, screenY + particle.offsetY);
    particle.velocityX += -particle.offsetX * 0.021;
    particle.velocityY += -particle.offsetY * 0.021;
    particle.velocityX *= 0.875;
    particle.velocityY *= 0.875;
    particle.offsetX += particle.velocityX;
    particle.offsetY += particle.velocityY;
  }

  function renderParticles(time) {
    var globalFloat = flowEnabled && !prefersReducedMotion ? Math.sin(time * 0.62) * 7 : 0;
    var breathing = flowEnabled && !prefersReducedMotion ? 1 + Math.sin(time * 1.18) * 0.011 : 1;
    var movement = morphTransition || morph > 0.02 || pointerStrength > 0.05 || shockwaves.length;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (var i = 0; i < particles.length; i += renderStride) {
      var particle = particles[i];
      var localMorph = easeInOut(clamp((morph - particle.delay) / (1 - particle.delay), 0, 1));
      var drift = flowEnabled && !prefersReducedMotion
        ? Math.sin(time * particle.speed + particle.phase) * (0.004 + localMorph * 0.025)
        : 0;
      var modelX = lerp(particle.x * breathing, particle.scatterX, localMorph) + drift;
      var modelY = lerp(particle.y * breathing, particle.scatterY, localMorph) + drift * 0.75;
      var modelZ = lerp(particle.z, particle.scatterZ, localMorph) + drift * 0.7;
      var projected = project(modelX, modelY, modelZ);
      var screenX = projected.x;
      var screenY = projected.y + globalFloat;

      updateParticleOffset(particle, screenX, screenY);
      screenX += particle.offsetX;
      screenY += particle.offsetY;

      if (movement && i % 31 === 0 && particle.previousX !== null) {
        ctx.globalAlpha = 0.1;
        ctx.strokeStyle = particle.css;
        ctx.lineWidth = 0.55;
        ctx.beginPath();
        ctx.moveTo(particle.previousX, particle.previousY);
        ctx.lineTo(screenX, screenY);
        ctx.stroke();
      }

      particle.previousX = screenX;
      particle.previousY = screenY;

      var alpha = particle.alpha * (0.72 + projected.perspective * 0.19);
      var size = Math.max(0.9, particle.size * projected.perspective * (1 + localMorph * 0.12));

      if (glowEnabled && (particle.glow || i % 8 === 0)) {
        ctx.globalAlpha = alpha * (particle.glow ? 0.17 : 0.075);
        ctx.fillStyle = particle.css;
        var halo = size * (particle.glow ? 4.8 : 2.6);
        ctx.fillRect(screenX - halo * 0.5, screenY - halo * 0.5, halo, halo);
      }

      ctx.globalAlpha = alpha;
      ctx.fillStyle = particle.css;
      ctx.fillRect(screenX - size * 0.5, screenY - size * 0.5, size, size);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function updateShockwaves(delta) {
    for (var i = shockwaves.length - 1; i >= 0; i -= 1) {
      shockwaves[i].radius += delta * 0.25;
      shockwaves[i].alpha -= delta * 0.00072;
      if (shockwaves[i].alpha <= 0) shockwaves.splice(i, 1);
    }
  }

  function drawShockwaves() {
    if (!shockwaves.length) return;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (var i = 0; i < shockwaves.length; i += 1) {
      var wave = shockwaves[i];
      ctx.strokeStyle = "rgba(125,234,255," + (wave.alpha * 0.28) + ")";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
      ctx.stroke();
    }
    ctx.restore();
  }

  function startMorph(target, duration) {
    morphTransition = {
      from: morph,
      to: target,
      start: performance.now(),
      duration: duration || 1700
    };
    if (triggerButton) triggerButton.textContent = target > 0.5 ? "重新聚合" : "扩散粒子";
  }

  function updateTransitions(now) {
    if (!morphTransition) return;
    var progress = clamp((now - morphTransition.start) / morphTransition.duration, 0, 1);
    morph = lerp(morphTransition.from, morphTransition.to, easeInOut(progress));
    if (progress >= 1) morphTransition = null;
  }

  function updatePerformance(delta) {
    frameSamples += 1;
    if (delta > 31) slowFrames += 1;
    if (frameSamples < 180) return;
    if (slowFrames > 72 && renderStride < 2) renderStride = 2;
    frameSamples = 0;
    slowFrames = 0;
  }

  function animate(now) {
    var delta = Math.min(50, now - lastFrame);
    lastFrame = now;
    elapsed += delta * 0.001;

    updateTransitions(now);
    updateShockwaves(delta);
    updatePerformance(delta);

    yaw = lerp(yaw, targetYaw, 0.075);
    pitch = lerp(pitch, targetPitch, 0.075);
    zoom = lerp(zoom, targetZoom, 0.08);
    pointerStrength = lerp(pointerStrength, pointerTargetStrength, 0.115);
    if (!dragging && now - pointerLastMove > 90) pointerTargetStrength = 0;

    drawBackground(elapsed);
    renderParticles(elapsed);
    drawShockwaves();
    animationFrame = window.requestAnimationFrame(animate);
  }

  function pointerPosition(event) {
    var rect = canvas.getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
  }

  canvas.addEventListener("pointerdown", function (event) {
    var point = pointerPosition(event);
    activePointerId = event.pointerId;
    dragging = true;
    pointerX = point.x;
    pointerY = point.y;
    pointerDownAt = performance.now();
    pointerTravel = 0;
    pointerTargetStrength = 1;
    pointerLastMove = performance.now();
    canvas.classList.add("is-dragging");
    canvas.setPointerCapture(event.pointerId);
  });

  canvas.addEventListener("pointermove", function (event) {
    var point = pointerPosition(event);
    var deltaX = point.x - pointerX;
    var deltaY = point.y - pointerY;
    pointerX = point.x;
    pointerY = point.y;
    pointerTargetStrength = 1;
    pointerLastMove = performance.now();

    if (dragging && event.pointerId === activePointerId) {
      pointerTravel += Math.abs(deltaX) + Math.abs(deltaY);
      targetYaw = clamp(targetYaw + deltaX * 0.0025, -0.32, 0.32);
      targetPitch = clamp(targetPitch - deltaY * 0.0018, -0.13, 0.13);
    }
  });

  function releasePointer(event) {
    if (!dragging || event.pointerId !== activePointerId) return;
    var held = performance.now() - pointerDownAt;
    dragging = false;
    activePointerId = null;
    canvas.classList.remove("is-dragging");
    if (pointerTravel < 12 && held < 480) {
      shockwaves.push({ x: pointerX, y: pointerY, radius: 7, alpha: 1 });
      if (shockwaves.length > 4) shockwaves.shift();
    }
  }

  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);
  canvas.addEventListener("pointerleave", function () {
    if (!dragging) pointerTargetStrength = 0;
  });

  canvas.addEventListener("wheel", function (event) {
    event.preventDefault();
    targetZoom = clamp(targetZoom - event.deltaY * 0.0006, 0.88, 1.18);
  }, { passive: false });

  if (triggerButton) {
    triggerButton.addEventListener("click", function () {
      startMorph(morph > 0.5 ? 0 : 1, 1750);
    });
  }

  function updateFlowButton() {
    if (!flowButton) return;
    flowButton.setAttribute("aria-pressed", String(flowEnabled));
    flowButton.textContent = "呼吸流动：" + (flowEnabled ? "开" : "关");
  }

  function updateGlowButton() {
    if (!glowButton) return;
    glowButton.setAttribute("aria-pressed", String(glowEnabled));
    glowButton.textContent = "粒子辉光：" + (glowEnabled ? "开" : "关");
  }

  if (flowButton) {
    updateFlowButton();
    flowButton.addEventListener("click", function () {
      flowEnabled = !flowEnabled;
      updateFlowButton();
    });
  }

  if (glowButton) {
    updateGlowButton();
    glowButton.addEventListener("click", function () {
      glowEnabled = !glowEnabled;
      updateGlowButton();
    });
  }

  function resetCloud() {
    targetYaw = -0.035;
    targetPitch = 0.012;
    targetZoom = 1;
    if (morph > 0.01) startMorph(0, 1250);
    shockwaves = [];
    for (var i = 0; i < particles.length; i += 1) {
      particles[i].offsetX = 0;
      particles[i].offsetY = 0;
      particles[i].velocityX = 0;
      particles[i].velocityY = 0;
    }
  }

  if (resetButton) resetButton.addEventListener("click", resetCloud);

  function handleMotionPreference(event) {
    prefersReducedMotion = event.matches;
    if (prefersReducedMotion) {
      flowEnabled = false;
      morph = 0;
      morphTransition = null;
      resetCloud();
    }
    updateFlowButton();
  }

  if (reducedMotionQuery.addEventListener) {
    reducedMotionQuery.addEventListener("change", handleMotionPreference);
  } else if (reducedMotionQuery.addListener) {
    reducedMotionQuery.addListener(handleMotionPreference);
  }

  window.addEventListener("resize", resize, { passive: true });
  document.addEventListener("visibilitychange", function () {
    if (document.hidden) {
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
      animationFrame = 0;
    } else if (!animationFrame && particles.length) {
      lastFrame = performance.now();
      animationFrame = window.requestAnimationFrame(animate);
    }
  });

  function start() {
    if (!modelSource) {
      document.documentElement.classList.add("no-particle-model");
      return;
    }

    resize();
    buildStars();
    loadImage(modelSource).then(function (image) {
      buildParticles(image);
      document.documentElement.classList.add("particle-ready");
      lastFrame = performance.now();
      animationFrame = window.requestAnimationFrame(animate);
    }).catch(function () {
      document.documentElement.classList.add("no-particle-model");
    });
  }

  start();
})();
