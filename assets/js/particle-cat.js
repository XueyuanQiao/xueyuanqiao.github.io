(function () {
  "use strict";

  var canvas = document.getElementById("cat-particle-stage");
  if (!canvas) return;

  var ctx = canvas.getContext("2d", { alpha: true, desynchronized: true });
  if (!ctx) {
    document.documentElement.classList.add("no-particle-canvas");
    return;
  }

  var poseButton = document.querySelector("[data-particle-pose]");
  var triggerButton = document.querySelector("[data-particle-trigger]");
  var autoButton = document.querySelector("[data-particle-auto]");
  var resetButton = document.querySelector("[data-particle-reset]");
  var photoElements = Array.prototype.slice.call(document.querySelectorAll("[data-particle-photo]"));
  var reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var coarsePointerQuery = window.matchMedia("(pointer: coarse)");
  var prefersReducedMotion = reducedMotionQuery.matches;
  var autoPlay = !prefersReducedMotion;
  var poseNames = ["正面", "侧望", "卧姿"];
  var modelSources = [
    canvas.getAttribute("data-model-src-1"),
    canvas.getAttribute("data-model-src-2"),
    canvas.getAttribute("data-model-src-3")
  ].filter(Boolean);

  var width = 0;
  var height = 0;
  var dpr = 1;
  var centerX = 0;
  var centerY = 0;
  var sceneScale = 1;
  var particles = [];
  var poseImages = [];
  var poseMetas = [];
  var stars = [];
  var shockwaves = [];
  var animationFrame = 0;
  var lastFrame = performance.now();
  var elapsed = 0;
  var morph = 0;
  var morphTransition = null;
  var currentPose = 0;
  var poseFrom = 0;
  var poseTo = 0;
  var poseMix = 1;
  var poseTransition = null;
  var nextAutoAt = lastFrame + 5200;
  var yaw = -0.08;
  var pitch = 0.01;
  var targetYaw = yaw;
  var targetPitch = pitch;
  var zoom = 1.05;
  var targetZoom = 1.05;
  var dragging = false;
  var activePointerId = null;
  var pointerX = 0;
  var pointerY = 0;
  var pointerStrength = 0;
  var pointerTargetStrength = 0;
  var pointerLastMove = 0;
  var pointerDownAt = 0;
  var pointerTravel = 0;
  var transitionEnergy = 0;
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
    if (window.innerWidth < 520 || cores <= 2 || memory <= 2) return 0.48;
    if (coarsePointerQuery.matches || window.innerWidth < 900 || cores <= 4 || memory <= 4) return 0.68;
    return 1;
  }

  var quality = qualityFactor();

  function targetParticleCount() {
    return Math.round(18000 * quality);
  }

  function colorChannel(value) {
    return clamp(Math.round(value / 10) * 10, 0, 255);
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

  function extractPose(image, wanted) {
    var maximum = 760;
    var ratio = Math.min(1, maximum / Math.max(image.naturalWidth, image.naturalHeight));
    var sampleWidth = Math.max(1, Math.round(image.naturalWidth * ratio));
    var sampleHeight = Math.max(1, Math.round(image.naturalHeight * ratio));
    var sampleCanvas = document.createElement("canvas");
    var sampleContext = sampleCanvas.getContext("2d", { willReadFrequently: true });
    sampleCanvas.width = sampleWidth;
    sampleCanvas.height = sampleHeight;
    sampleContext.clearRect(0, 0, sampleWidth, sampleHeight);
    sampleContext.drawImage(image, 0, 0, sampleWidth, sampleHeight);

    var data = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight).data;
    var candidates = [];
    var minX = sampleWidth;
    var minY = sampleHeight;
    var maxX = 0;
    var maxY = 0;
    var scanStep = quality < 0.55 ? 2 : 1;

    for (var y = 0; y < sampleHeight; y += scanStep) {
      for (var x = 0; x < sampleWidth; x += scanStep) {
        var index = (y * sampleWidth + x) * 4;
        var alpha = data[index + 3];
        if (alpha <= 28) continue;

        var r = data[index];
        var g = data[index + 1];
        var b = data[index + 2];
        var luma = r * 0.2126 + g * 0.7152 + b * 0.0722;
        candidates.push({ x: x, y: y, r: r, g: g, b: b, a: alpha, luma: luma });
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
      }
    }

    if (!candidates.length) throw new Error("猫猫照片中没有可用主体");

    var count = Math.min(wanted, candidates.length);
    var selected = [];
    for (var i = 0; i < count; i += 1) {
      var pick = i + Math.floor(Math.random() * (candidates.length - i));
      var temporary = candidates[i];
      candidates[i] = candidates[pick];
      candidates[pick] = temporary;
      selected.push(candidates[i]);
    }

    selected.sort(function (first, second) {
      var firstY = (first.y - minY) / Math.max(1, maxY - minY);
      var secondY = (second.y - minY) / Math.max(1, maxY - minY);
      var bandDifference = Math.floor(firstY * 90) - Math.floor(secondY * 90);
      return bandDifference || first.x - second.x;
    });

    var subjectWidth = Math.max(1, maxX - minX);
    var subjectHeight = Math.max(1, maxY - minY);
    var modelScale = Math.min(4.9 / subjectWidth, 5.18 / subjectHeight);
    var subjectCenterX = (minX + maxX) * 0.5;
    var subjectCenterY = (minY + maxY) * 0.5;

    var points = selected.map(function (pixel) {
      var modelX = (pixel.x - subjectCenterX) * modelScale;
      var modelY = (subjectCenterY - pixel.y) * modelScale;
      var normalizedSide = clamp(Math.abs(modelX) / 2.45, 0, 1);
      var z = (1 - Math.pow(normalizedSide, 1.55)) * 0.48 + randomRange(-0.07, 0.07);
      var visibilityLift = pixel.luma < 72 ? (72 - pixel.luma) * 0.78 : 7;
      var red = colorChannel(pixel.r + (255 - pixel.r) * 0.16 + visibilityLift * 0.72);
      var green = colorChannel(pixel.g + (255 - pixel.g) * 0.16 + visibilityLift * 0.86);
      var blue = colorChannel(pixel.b + (255 - pixel.b) * 0.16 + visibilityLift);

      return {
        x: modelX,
        y: modelY,
        z: z,
        r: red,
        g: green,
        b: blue,
        a: pixel.a / 255,
        luma: pixel.luma,
        css: "rgb(" + red + "," + green + "," + blue + ")"
      };
    });

    return {
      points: points,
      meta: {
        sampleWidth: sampleWidth,
        sampleHeight: sampleHeight,
        subjectCenterX: subjectCenterX,
        subjectCenterY: subjectCenterY,
        modelScale: modelScale
      }
    };
  }

  function buildParticles(images) {
    var wanted = targetParticleCount();
    var extracted = images.map(function (image) { return extractPose(image, wanted); });
    var poseSets = extracted.map(function (pose) { return pose.points; });
    poseImages = images;
    poseMetas = extracted.map(function (pose) { return pose.meta; });
    var count = Math.min.apply(Math, poseSets.map(function (pose) { return pose.length; }));
    particles = [];

    for (var i = 0; i < count; i += 1) {
      var theta = Math.random() * Math.PI * 2;
      var radial = randomRange(2.4, 5.9);
      particles.push({
        poses: poseSets.map(function (pose) { return pose[i]; }),
        sx: Math.cos(theta) * radial + randomRange(-0.7, 0.7),
        sy: Math.sin(theta) * radial * 0.78 + randomRange(-0.55, 0.55),
        sz: Math.sin(theta * 1.7) * randomRange(1.3, 4.0),
        bridgeX: Math.cos(theta * 1.8) * randomRange(0.18, 0.85),
        bridgeY: Math.sin(theta * 1.35) * randomRange(0.14, 0.7),
        bridgeZ: Math.cos(theta * 0.75) * randomRange(0.2, 1.1),
        size: randomRange(1.42, 2.65),
        alpha: randomRange(0.94, 1),
        phase: Math.random() * Math.PI * 2,
        speed: randomRange(0.45, 1.25),
        delay: Math.random() * 0.17,
        glow: Math.random() > 0.978,
        previousX: null,
        previousY: null
      });
    }
  }

  function buildStars() {
    var starCount = Math.round(150 * Math.max(0.6, quality));
    stars = [];
    for (var i = 0; i < starCount; i += 1) {
      stars.push({
        x: Math.random(),
        y: Math.random(),
        size: randomRange(0.35, 1.25),
        alpha: randomRange(0.08, 0.52),
        phase: Math.random() * Math.PI * 2,
        speed: randomRange(0.12, 0.55),
        tint: Math.random() > 0.84 ? "125,234,255" : "205,228,240"
      });
    }
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, quality < 0.6 ? 1.35 : 1.8);
    canvas.width = Math.max(1, Math.round(width * dpr));
    canvas.height = Math.max(1, Math.round(height * dpr));
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    if (width <= 900) {
      centerX = width * 0.5;
      centerY = height * 0.4;
      sceneScale = Math.min(height * 0.145, width * 0.255);
    } else {
      centerX = width * 0.5;
      centerY = height * 0.48;
      sceneScale = Math.min(height * 0.18, width * 0.115);
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
    var perspective = clamp(1 + finalZ * 0.045, 0.78, 1.22);
    var scale = sceneScale * zoom * perspective;
    return {
      x: centerX + rotatedX * scale,
      y: centerY - rotatedY * scale,
      z: finalZ,
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

    if (pointerStrength > 0.02) {
      var aura = ctx.createRadialGradient(pointerX, pointerY, 0, pointerX, pointerY, 150);
      aura.addColorStop(0, "rgba(125,234,255," + (0.055 * pointerStrength) + ")");
      aura.addColorStop(0.45, "rgba(107,125,255," + (0.025 * pointerStrength) + ")");
      aura.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = aura;
      ctx.beginPath();
      ctx.arc(pointerX, pointerY, 150, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function waveDisplacement(screenX, screenY) {
    var dx = 0;
    var dy = 0;

    for (var i = 0; i < shockwaves.length; i += 1) {
      var wave = shockwaves[i];
      var distance = Math.hypot(screenX - wave.x, screenY - wave.y);
      var band = Math.abs(distance - wave.radius);
      if (band < 72) {
        var force = (1 - band / 72) * wave.alpha * 21;
        var angle = Math.atan2(screenY - wave.y, screenX - wave.x);
        dx += Math.cos(angle) * force;
        dy += Math.sin(angle) * force;
      }
    }

    return { x: dx, y: dy };
  }

  function placePhoto(index, alpha) {
    if (!photoElements[index] || !poseImages[index] || !poseMetas[index]) return;
    var element = photoElements[index];
    var meta = poseMetas[index];
    var factor = meta.modelScale * sceneScale * zoom;
    var drawWidth = meta.sampleWidth * factor;
    var drawHeight = meta.sampleHeight * factor;
    var drawX = centerX - meta.subjectCenterX * factor;
    var drawY = centerY - meta.subjectCenterY * factor;

    element.style.left = drawX + "px";
    element.style.top = drawY + "px";
    element.style.width = drawWidth + "px";
    element.style.height = drawHeight + "px";
    element.style.opacity = String(clamp(alpha, 0, 1));
    element.style.transformOrigin = meta.subjectCenterX * factor + "px " + meta.subjectCenterY * factor + "px";
    element.style.transform = "rotate(" + (pitch * 0.08) + "rad) scaleX(" + (1 - Math.abs(yaw) * 0.1) + ")";
  }

  function updatePhotoLayer() {
    var bridge = poseTransition && !prefersReducedMotion ? Math.sin(poseMix * Math.PI) : 0;
    var photoAlpha = (0.96 - morph * 0.52) * (1 - bridge * 0.18);
    for (var i = 0; i < photoElements.length; i += 1) {
      photoElements[i].style.opacity = "0";
    }
    if (poseTransition) {
      placePhoto(poseFrom, photoAlpha * (1 - poseMix));
      placePhoto(poseTo, photoAlpha * poseMix);
    } else {
      placePhoto(currentPose, photoAlpha);
    }
  }

  function renderParticles(time) {
    var breathing = prefersReducedMotion ? 1 : 1 + Math.sin(time * 0.75) * 0.007;
    var bridge = poseTransition && !prefersReducedMotion ? Math.sin(poseMix * Math.PI) : 0;
    var movement = transitionEnergy + pointerStrength * 0.45 + bridge * 0.55;
    var stride = renderStride;

    ctx.save();
    ctx.globalCompositeOperation = "screen";

    for (var i = 0; i < particles.length; i += stride) {
      var particle = particles[i];
      var from = particle.poses[poseFrom];
      var to = particle.poses[poseTo];
      var localPoseMix = easeInOut(clamp((poseMix - particle.delay * 0.42) / (1 - particle.delay * 0.42), 0, 1));
      var modelX = lerp(from.x, to.x, localPoseMix) + particle.bridgeX * bridge;
      var modelY = lerp(from.y, to.y, localPoseMix) + particle.bridgeY * bridge;
      var modelZ = lerp(from.z, to.z, localPoseMix) + particle.bridgeZ * bridge;
      var localMorph = easeInOut(clamp((morph - particle.delay) / (1 - particle.delay), 0, 1));
      var drift = prefersReducedMotion ? 0 : Math.sin(time * particle.speed + particle.phase) * (0.011 + localMorph * 0.055);
      var x = lerp(modelX * breathing, particle.sx, localMorph) + drift;
      var y = lerp(modelY * breathing, particle.sy, localMorph) + drift * 0.65;
      var z = lerp(modelZ, particle.sz, localMorph) + drift * 0.9;
      var projected = project(x, y, z);
      var screenX = projected.x;
      var screenY = projected.y;

      if (pointerStrength > 0.015) {
        var deltaX = screenX - pointerX;
        var deltaY = screenY - pointerY;
        var distanceSquared = deltaX * deltaX + deltaY * deltaY;
        var radius = 145;

        if (distanceSquared < radius * radius && distanceSquared > 0.1) {
          var distance = Math.sqrt(distanceSquared);
          var force = Math.pow(1 - distance / radius, 2) * pointerStrength;
          screenX += deltaX / distance * force * 62;
          screenY += deltaY / distance * force * 62;
        }
      }

      var wave = waveDisplacement(screenX, screenY);
      screenX += wave.x;
      screenY += wave.y;

      var red = Math.round(lerp(from.r, to.r, localPoseMix));
      var green = Math.round(lerp(from.g, to.g, localPoseMix));
      var blue = Math.round(lerp(from.b, to.b, localPoseMix));
      var color = poseTransition ? "rgb(" + red + "," + green + "," + blue + ")" : to.css;
      var alpha = lerp(from.a, to.a, localPoseMix) * particle.alpha;

      if (movement > 0.2 && i % 23 === 0 && particle.previousX !== null) {
        ctx.strokeStyle = "rgba(" + red + "," + green + "," + blue + ",0.13)";
        ctx.lineWidth = 0.55;
        ctx.beginPath();
        ctx.moveTo(particle.previousX, particle.previousY);
        ctx.lineTo(screenX, screenY);
        ctx.stroke();
      }

      particle.previousX = screenX;
      particle.previousY = screenY;

      if (particle.glow && i % 2 === 0) {
        ctx.fillStyle = "rgba(" + red + "," + green + "," + blue + ",0.12)";
        ctx.beginPath();
        ctx.arc(screenX, screenY, particle.size * 3.6 * projected.perspective, 0, Math.PI * 2);
        ctx.fill();
      }

      if (i % 5 === 0) {
        var haloSize = particle.size * projected.perspective * 2.35;
        ctx.fillStyle = "rgba(" + red + "," + green + "," + blue + ",0.11)";
        ctx.fillRect(screenX - haloSize * 0.5, screenY - haloSize * 0.5, haloSize, haloSize);
      }

      ctx.fillStyle = color;
      var particleVisibility = 0.42 + Math.max(localMorph, bridge) * 0.58;
      ctx.globalAlpha = alpha * particleVisibility * (0.88 + projected.perspective * 0.1);
      var size = Math.max(1.3, particle.size * projected.perspective);
      ctx.fillRect(screenX - size * 0.5, screenY - size * 0.5, size, size);
    }

    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function updateShockwaves(delta) {
    for (var i = shockwaves.length - 1; i >= 0; i -= 1) {
      shockwaves[i].radius += delta * 0.23;
      shockwaves[i].alpha -= delta * 0.00058;
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
      duration: duration || 1550
    };
    transitionEnergy = 1;
    if (triggerButton) triggerButton.textContent = target > 0.5 ? "重新聚合" : "粒子散开";
  }

  function startPoseTransition(nextPose, duration) {
    if (poseTransition || nextPose === currentPose) return;
    poseFrom = currentPose;
    poseTo = nextPose;
    poseMix = 0;
    poseTransition = {
      start: performance.now(),
      duration: duration || 1850
    };
    transitionEnergy = 1;
    if (morph > 0.08) startMorph(0, 1050);
  }

  function updateTransitions(now) {
    if (morphTransition) {
      var morphProgress = clamp((now - morphTransition.start) / morphTransition.duration, 0, 1);
      morph = lerp(morphTransition.from, morphTransition.to, easeInOut(morphProgress));
      if (morphProgress >= 1) morphTransition = null;
    }

    if (poseTransition) {
      var poseProgress = clamp((now - poseTransition.start) / poseTransition.duration, 0, 1);
      poseMix = easeInOut(poseProgress);
      if (poseProgress >= 1) {
        currentPose = poseTo;
        poseFrom = currentPose;
        poseTo = currentPose;
        poseMix = 1;
        poseTransition = null;
        if (poseButton) poseButton.textContent = "姿态：" + poseNames[currentPose];
      }
    }
  }

  function switchToNextPose() {
    startPoseTransition((currentPose + 1) % poseNames.length, 1900);
  }

  function updateAuto(now) {
    if (!autoPlay || prefersReducedMotion || dragging) return;
    if (!poseTransition && !morphTransition && now >= nextAutoAt) {
      if (morph > 0.08) {
        startMorph(0, 1100);
      } else {
        switchToNextPose();
      }
      nextAutoAt = now + 6500;
    }
  }

  function updatePerformance(delta) {
    frameSamples += 1;
    if (delta > 31) slowFrames += 1;
    if (frameSamples < 180) return;
    if (slowFrames > 74 && renderStride < 2) renderStride = 2;
    frameSamples = 0;
    slowFrames = 0;
  }

  function animate(now) {
    var delta = Math.min(50, now - lastFrame);
    lastFrame = now;
    elapsed += delta * 0.001;

    updateTransitions(now);
    updateAuto(now);
    updateShockwaves(delta);
    updatePerformance(delta);

    yaw = lerp(yaw, targetYaw, 0.075);
    pitch = lerp(pitch, targetPitch, 0.075);
    zoom = lerp(zoom, targetZoom, 0.08);
    pointerStrength = lerp(pointerStrength, pointerTargetStrength, 0.12);
    transitionEnergy = lerp(transitionEnergy, poseTransition || morphTransition ? 0.78 : 0, 0.045);

    if (!dragging && now - pointerLastMove > 110) pointerTargetStrength = 0;

    updatePhotoLayer();
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
      targetYaw = clamp(targetYaw + deltaX * 0.0022, -0.2, 0.2);
      targetPitch = clamp(targetPitch - deltaY * 0.0016, -0.08, 0.08);
    }
  });

  function releasePointer(event) {
    if (!dragging || event.pointerId !== activePointerId) return;
    var held = performance.now() - pointerDownAt;
    dragging = false;
    activePointerId = null;
    canvas.classList.remove("is-dragging");
    if (pointerTravel < 12 && held < 460) {
      shockwaves.push({ x: pointerX, y: pointerY, radius: 6, alpha: 1 });
    }
  }

  canvas.addEventListener("pointerup", releasePointer);
  canvas.addEventListener("pointercancel", releasePointer);
  canvas.addEventListener("pointerleave", function () {
    if (!dragging) pointerTargetStrength = 0;
  });

  canvas.addEventListener("wheel", function (event) {
    event.preventDefault();
    targetZoom = clamp(targetZoom - event.deltaY * 0.0006, 0.92, 1.2);
  }, { passive: false });

  if (poseButton) {
    poseButton.textContent = "姿态：" + poseNames[currentPose];
    poseButton.addEventListener("click", function () {
      nextAutoAt = performance.now() + 6500;
      switchToNextPose();
    });
  }

  if (triggerButton) {
    triggerButton.addEventListener("click", function () {
      nextAutoAt = performance.now() + 6500;
      startMorph(morph > 0.5 ? 0 : 1, 1550);
    });
  }

  if (autoButton) {
    autoButton.setAttribute("aria-pressed", String(autoPlay));
    autoButton.textContent = "自动循环：" + (autoPlay ? "开" : "关");
    autoButton.addEventListener("click", function () {
      autoPlay = !autoPlay;
      nextAutoAt = performance.now() + 3600;
      autoButton.setAttribute("aria-pressed", String(autoPlay));
      autoButton.textContent = "自动循环：" + (autoPlay ? "开" : "关");
      if (!autoPlay && morph > 0.05) startMorph(0, 1200);
    });
  }

  if (resetButton) {
    resetButton.addEventListener("click", function () {
      targetYaw = -0.08;
      targetPitch = 0.01;
      targetZoom = 1.05;
      if (morph > 0.03) startMorph(0, 1150);
    });
  }

  function handleMotionPreference(event) {
    prefersReducedMotion = event.matches;
    if (prefersReducedMotion) {
      autoPlay = false;
      morph = 0;
      morphTransition = null;
      poseTransition = null;
      poseFrom = currentPose;
      poseTo = currentPose;
      poseMix = 1;
    }
    if (autoButton) {
      autoButton.setAttribute("aria-pressed", String(autoPlay));
      autoButton.textContent = "自动循环：" + (autoPlay ? "开" : "关");
    }
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
    if (modelSources.length !== 3) {
      document.documentElement.classList.add("no-particle-model");
      return;
    }

    resize();
    buildStars();
    Promise.all(modelSources.map(loadImage)).then(function (images) {
      buildParticles(images);
      document.documentElement.classList.add("particle-ready");
      lastFrame = performance.now();
      animationFrame = window.requestAnimationFrame(animate);
    }).catch(function () {
      document.documentElement.classList.add("no-particle-model");
    });
  }

  start();
})();
