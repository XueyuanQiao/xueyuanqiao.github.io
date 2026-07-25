(function () {
  "use strict";

  var panoramaCanvas = document.getElementById("space-panorama");
  var particleCanvas = document.getElementById("cat-particle-stage");
  if (!panoramaCanvas || !particleCanvas) return;

  var gl = panoramaCanvas.getContext("webgl", {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    powerPreference: "high-performance"
  });
  var particleContext = particleCanvas.getContext("2d", { alpha: true, desynchronized: true });

  if (!gl || !particleContext) {
    document.documentElement.classList.add("no-particle-canvas");
    return;
  }

  var root = document.documentElement;
  var resetButton = document.querySelector("[data-particle-reset]");
  var reducedMotionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
  var coarsePointerQuery = window.matchMedia("(pointer: coarse)");

  var width = 1;
  var height = 1;
  var dpr = 1;
  var textureWidth = 6000;
  var textureHeight = 3000;
  var stars = [];
  var streams = [];
  var animationFrame = 0;
  var lastFrame = performance.now();
  var dragging = false;
  var dragPointerId = null;
  var previousPointerX = 0;
  var previousPointerY = 0;
  var inertiaYaw = 0;
  var inertiaPitch = 0;
  var yaw = 0.68;
  var pitch = -0.035;
  var fov = 96;
  var flowEnabled = !reducedMotionQuery.matches;
  var glowEnabled = true;
  var flowAmount = flowEnabled ? 1 : 0;
  var glowAmount = 1;
  var firstInteraction = false;
  var pointer = { x: -9999, y: -9999, active: false, strength: 0 };

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function random(minimum, maximum) {
    return minimum + Math.random() * (maximum - minimum);
  }

  function wrapAngle(value) {
    var twoPi = Math.PI * 2;
    return ((value + Math.PI) % twoPi + twoPi) % twoPi - Math.PI;
  }

  function compileShader(type, source) {
    var shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      var error = gl.getShaderInfoLog(shader);
      gl.deleteShader(shader);
      throw new Error(error || "WebGL 着色器编译失败");
    }
    return shader;
  }

  function createProgram(vertexSource, fragmentSource) {
    var program = gl.createProgram();
    gl.attachShader(program, compileShader(gl.VERTEX_SHADER, vertexSource));
    gl.attachShader(program, compileShader(gl.FRAGMENT_SHADER, fragmentSource));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) || "WebGL 程序链接失败");
    }
    return program;
  }

  var vertexShaderSource = [
    "attribute vec2 aPosition;",
    "varying vec2 vUv;",
    "void main() {",
    "  vUv = aPosition * 0.5 + 0.5;",
    "  gl_Position = vec4(aPosition, 0.0, 1.0);",
    "}"
  ].join("\n");

  var fragmentShaderSource = [
    "precision highp float;",
    "uniform sampler2D uPanorama;",
    "uniform vec2 uResolution;",
    "uniform vec2 uTexel;",
    "uniform float uYaw;",
    "uniform float uPitch;",
    "uniform float uFov;",
    "uniform float uFlow;",
    "uniform float uGlow;",
    "varying vec2 vUv;",
    "const float PI = 3.141592653589793;",
    "vec3 rotateX(vec3 p, float a) {",
    "  float c = cos(a); float s = sin(a);",
    "  return vec3(p.x, c * p.y - s * p.z, s * p.y + c * p.z);",
    "}",
    "vec3 rotateY(vec3 p, float a) {",
    "  float c = cos(a); float s = sin(a);",
    "  return vec3(c * p.x + s * p.z, p.y, -s * p.x + c * p.z);",
    "}",
    "vec3 samplePano(vec2 uv) {",
    "  return texture2D(uPanorama, vec2(fract(uv.x), clamp(uv.y, 0.001, 0.999))).rgb;",
    "}",
    "void main() {",
    "  vec2 screen = vUv * 2.0 - 1.0;",
    "  screen.x *= uResolution.x / uResolution.y;",
    "  float focal = 1.0 / tan(radians(uFov) * 0.5);",
    "  vec3 direction = normalize(vec3(screen.x, screen.y, focal));",
    "  direction = rotateX(direction, uPitch);",
    "  direction = rotateY(direction, uYaw);",
    "  float longitude = atan(direction.x, direction.z);",
    "  float latitude = asin(clamp(direction.y, -1.0, 1.0));",
    "  vec2 uv = vec2(0.5 + longitude / (2.0 * PI), 0.5 - latitude / PI);",
    "  vec3 base = samplePano(uv);",
    "  vec3 trailA = samplePano(uv - vec2(uTexel.x * 8.0, 0.0));",
    "  vec3 trailB = samplePano(uv - vec2(uTexel.x * 17.0, 0.0));",
    "  vec3 trailC = samplePano(uv - vec2(uTexel.x * 30.0, 0.0));",
    "  float trailLumaA = max(dot(trailA, vec3(0.2126, 0.7152, 0.0722)) - 0.62, 0.0);",
    "  float trailLumaB = max(dot(trailB, vec3(0.2126, 0.7152, 0.0722)) - 0.67, 0.0);",
    "  float trailLumaC = max(dot(trailC, vec3(0.2126, 0.7152, 0.0722)) - 0.72, 0.0);",
    "  vec3 trail = trailA * trailLumaA * 0.42 + trailB * trailLumaB * 0.28 + trailC * trailLumaC * 0.16;",
    "  vec3 color = base + trail * uFlow;",
    "  vec3 blur = samplePano(uv + vec2(uTexel.x * 5.0, 0.0));",
    "  blur += samplePano(uv - vec2(uTexel.x * 5.0, 0.0));",
    "  blur += samplePano(uv + vec2(0.0, uTexel.y * 5.0));",
    "  blur += samplePano(uv - vec2(0.0, uTexel.y * 5.0));",
    "  blur *= 0.25;",
    "  vec3 bloom = max(blur - vec3(0.69), vec3(0.0)) * 0.62;",
    "  color += bloom * uGlow;",
    "  color *= mix(vec3(0.72, 0.77, 0.83), vec3(0.99, 1.02, 1.07), uGlow);",
    "  float vignette = smoothstep(1.18, 0.2, length((vUv - 0.5) * vec2(0.82, 1.0)));",
    "  color *= mix(0.72, 1.0, vignette);",
    "  color = pow(max(color, 0.0), vec3(0.94));",
    "  gl_FragColor = vec4(color, 1.0);",
    "}"
  ].join("\n");

  var program;
  var locations;
  var panoramaTexture;

  try {
    program = createProgram(vertexShaderSource, fragmentShaderSource);
    locations = {
      position: gl.getAttribLocation(program, "aPosition"),
      resolution: gl.getUniformLocation(program, "uResolution"),
      texel: gl.getUniformLocation(program, "uTexel"),
      yaw: gl.getUniformLocation(program, "uYaw"),
      pitch: gl.getUniformLocation(program, "uPitch"),
      fov: gl.getUniformLocation(program, "uFov"),
      flow: gl.getUniformLocation(program, "uFlow"),
      glow: gl.getUniformLocation(program, "uGlow"),
      panorama: gl.getUniformLocation(program, "uPanorama")
    };

    var buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1
    ]), gl.STATIC_DRAW);
    gl.useProgram(program);
    gl.enableVertexAttribArray(locations.position);
    gl.vertexAttribPointer(locations.position, 2, gl.FLOAT, false, 0, 0);
    gl.uniform1i(locations.panorama, 0);
  } catch (error) {
    console.error(error);
    root.classList.add("no-particle-canvas");
    return;
  }

  function choosePanoramaSource() {
    var maximumTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
    var useMobile = window.innerWidth < 900 || coarsePointerQuery.matches || maximumTextureSize < 6000;
    return useMobile
      ? panoramaCanvas.getAttribute("data-panorama-mobile-src")
      : panoramaCanvas.getAttribute("data-panorama-src");
  }

  function loadImage(source) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.decoding = "async";
      image.onload = function () { resolve(image); };
      image.onerror = function () { reject(new Error("360° 全景影像载入失败")); };
      image.src = source;
    });
  }

  function uploadPanorama(image) {
    textureWidth = image.naturalWidth;
    textureHeight = image.naturalHeight;
    panoramaTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, panoramaTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  }

  function buildStars() {
    var quality = coarsePointerQuery.matches || window.innerWidth < 700 ? 0.62 : 1;
    var count = Math.round(260 * quality);
    stars = [];
    for (var i = 0; i < count; i += 1) {
      var bright = Math.random();
      stars.push({
        yaw: random(-Math.PI, Math.PI),
        pitch: Math.asin(random(-0.96, 0.96)),
        depth: random(0.3, 1),
        size: bright > 0.94 ? random(1.2, 2.2) : random(0.35, 1.1),
        alpha: random(0.16, bright > 0.94 ? 0.82 : 0.54),
        phase: random(0, Math.PI * 2),
        speed: random(0.35, 1.1),
        color: Math.random() > 0.78 ? "158,211,255" : Math.random() > 0.86 ? "255,207,167" : "226,238,255",
        ox: 0,
        oy: 0,
        vx: 0,
        vy: 0,
        halo: bright > 0.92
      });
    }

    var streamCount = coarsePointerQuery.matches || window.innerWidth < 700 ? 9 : 16;
    streams = [];
    for (var j = 0; j < streamCount; j += 1) {
      streams.push({
        x: Math.random(),
        y: random(0.08, 0.88),
        speed: random(0.025, 0.062),
        length: random(70, 175),
        alpha: random(0.16, 0.32),
        slope: random(-0.12, 0.08),
        depth: random(0.5, 1),
        color: Math.random() > 0.72 ? "157,207,255" : "222,236,255"
      });
    }
  }

  function resize() {
    width = window.innerWidth;
    height = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, coarsePointerQuery.matches ? 1.25 : 1.5);

    panoramaCanvas.width = Math.max(1, Math.round(width * dpr));
    panoramaCanvas.height = Math.max(1, Math.round(height * dpr));
    panoramaCanvas.style.width = width + "px";
    panoramaCanvas.style.height = height + "px";
    gl.viewport(0, 0, panoramaCanvas.width, panoramaCanvas.height);

    particleCanvas.width = Math.max(1, Math.round(width * dpr));
    particleCanvas.height = Math.max(1, Math.round(height * dpr));
    particleCanvas.style.width = width + "px";
    particleCanvas.style.height = height + "px";
    particleContext.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function projectStar(star) {
    var relativeYaw = wrapAngle(star.yaw - yaw);
    var relativePitch = star.pitch + pitch;
    var verticalFov = fov * Math.PI / 180;
    var tanVertical = Math.tan(verticalFov * 0.5);
    var tanHorizontal = tanVertical * (width / height);
    var x = Math.tan(relativeYaw) / tanHorizontal;
    var y = Math.tan(relativePitch) / tanVertical;

    if (Math.cos(relativeYaw) <= 0 || Math.abs(x) > 1.15 || Math.abs(y) > 1.15) return null;
    return {
      x: (x * 0.5 + 0.5) * width,
      y: (0.5 - y * 0.5) * height
    };
  }

  function updateStar(star, point, dt) {
    if (pointer.strength > 0.01) {
      var dx = point.x + star.ox - pointer.x;
      var dy = point.y + star.oy - pointer.y;
      var radius = coarsePointerQuery.matches ? 90 : 128;
      var distanceSquared = dx * dx + dy * dy;
      if (distanceSquared < radius * radius && distanceSquared > 0.1) {
        var distance = Math.sqrt(distanceSquared);
        var force = Math.pow(1 - distance / radius, 2) * 0.78 * pointer.strength * star.depth;
        star.vx += dx / distance * force;
        star.vy += dy / distance * force;
      }
    }

    star.vx += -star.ox * 0.018;
    star.vy += -star.oy * 0.018;
    star.vx *= 0.89;
    star.vy *= 0.89;
    star.ox += star.vx * dt * 0.06;
    star.oy += star.vy * dt * 0.06;
  }

  function drawStars(now, dt) {
    particleContext.clearRect(0, 0, width, height);
    particleContext.save();
    particleContext.globalCompositeOperation = "screen";
    var trailDistance = 14 + flowAmount * 44;

    for (var i = 0; i < stars.length; i += 1) {
      var star = stars[i];
      var point = projectStar(star);
      if (!point) continue;
      updateStar(star, point, dt);
      var x = point.x + star.ox;
      var y = point.y + star.oy;
      var twinkle = reducedMotionQuery.matches ? 0.85 : 0.72 + Math.sin(now * 0.001 * star.speed + star.phase) * 0.28;
      var alpha = star.alpha * twinkle * (0.58 + star.depth * 0.52);
      var size = star.size * (0.56 + star.depth * 0.68);

      if (flowAmount > 0.05) {
        var gradient = particleContext.createLinearGradient(x - trailDistance * star.depth, y, x, y);
        gradient.addColorStop(0, "rgba(" + star.color + ",0)");
        gradient.addColorStop(0.68, "rgba(" + star.color + "," + alpha * 0.28 * flowAmount + ")");
        gradient.addColorStop(1, "rgba(" + star.color + "," + alpha * 0.92 * flowAmount + ")");
        particleContext.strokeStyle = gradient;
        particleContext.lineWidth = Math.max(0.42, size * 0.82);
        particleContext.beginPath();
        particleContext.moveTo(x - trailDistance * star.depth, y);
        particleContext.lineTo(x, y);
        particleContext.stroke();
      }

      if (glowAmount > 0.03 && star.halo) {
        var radius = size * (5 + glowAmount * 5);
        var halo = particleContext.createRadialGradient(x, y, 0, x, y, radius);
        halo.addColorStop(0, "rgba(" + star.color + "," + alpha * 0.32 * glowAmount + ")");
        halo.addColorStop(0.25, "rgba(" + star.color + "," + alpha * 0.1 * glowAmount + ")");
        halo.addColorStop(1, "rgba(" + star.color + ",0)");
        particleContext.fillStyle = halo;
        particleContext.beginPath();
        particleContext.arc(x, y, radius, 0, Math.PI * 2);
        particleContext.fill();
      }

      particleContext.fillStyle = "rgba(" + star.color + "," + alpha + ")";
      particleContext.beginPath();
      particleContext.arc(x, y, size, 0, Math.PI * 2);
      particleContext.fill();
    }

    if (flowAmount > 0.02) {
      for (var j = 0; j < streams.length; j += 1) {
        var stream = streams[j];
        stream.x += stream.speed * dt * 0.001 * flowAmount;
        if (stream.x > 1.18) {
          stream.x = random(-0.2, -0.05);
          stream.y = random(0.08, 0.88);
        }

        var headX = stream.x * width;
        var headY = stream.y * height;
        var length = stream.length * stream.depth * flowAmount;
        var tailX = headX - length;
        var tailY = headY - length * stream.slope;
        var streamGradient = particleContext.createLinearGradient(tailX, tailY, headX, headY);
        streamGradient.addColorStop(0, "rgba(" + stream.color + ",0)");
        streamGradient.addColorStop(0.68, "rgba(" + stream.color + "," + stream.alpha * 0.22 * flowAmount + ")");
        streamGradient.addColorStop(1, "rgba(245,250,255," + stream.alpha * flowAmount + ")");
        particleContext.strokeStyle = streamGradient;
        particleContext.lineWidth = 0.65 + stream.depth * 0.55;
        particleContext.beginPath();
        particleContext.moveTo(tailX, tailY);
        particleContext.lineTo(headX, headY);
        particleContext.stroke();
        particleContext.fillStyle = "rgba(244,250,255," + stream.alpha * 0.72 * flowAmount + ")";
        particleContext.beginPath();
        particleContext.arc(headX, headY, 0.65 + stream.depth * 0.5, 0, Math.PI * 2);
        particleContext.fill();
      }
    }

    particleContext.restore();
  }

  function renderPanorama() {
    gl.useProgram(program);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, panoramaTexture);
    gl.uniform2f(locations.resolution, panoramaCanvas.width, panoramaCanvas.height);
    gl.uniform2f(locations.texel, 1 / textureWidth, 1 / textureHeight);
    gl.uniform1f(locations.yaw, yaw);
    gl.uniform1f(locations.pitch, pitch);
    gl.uniform1f(locations.fov, fov);
    gl.uniform1f(locations.flow, flowAmount);
    gl.uniform1f(locations.glow, glowAmount);
    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  function render(now) {
    var dt = clamp(now - lastFrame, 8, 34);
    lastFrame = now;
    pointer.strength += ((pointer.active && !dragging ? 1 : 0) - pointer.strength) * 0.075;
    flowAmount += ((flowEnabled ? 1 : 0) - flowAmount) * 0.045;
    glowAmount += ((glowEnabled ? 1 : 0) - glowAmount) * 0.055;

    if (!dragging) {
      yaw += inertiaYaw * dt;
      pitch += inertiaPitch * dt;
      inertiaYaw *= Math.pow(0.91, dt * 0.06);
      inertiaPitch *= Math.pow(0.88, dt * 0.06);
      if (flowEnabled && !reducedMotionQuery.matches) yaw += 0.00002 * dt;
    }

    yaw = wrapAngle(yaw);
    pitch = clamp(pitch, -1.18, 1.18);
    renderPanorama();
    drawStars(now, dt);
    animationFrame = requestAnimationFrame(render);
  }

  function markExplored() {
    if (firstInteraction) return;
    firstInteraction = true;
    document.body.classList.add("has-explored");
  }

  function onPointerDown(event) {
    dragging = true;
    dragPointerId = event.pointerId;
    previousPointerX = event.clientX;
    previousPointerY = event.clientY;
    inertiaYaw = 0;
    inertiaPitch = 0;
    pointer.active = false;
    particleCanvas.setPointerCapture(event.pointerId);
    document.body.classList.add("is-dragging");
    markExplored();
  }

  function onPointerMove(event) {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;

    if (!dragging || event.pointerId !== dragPointerId) return;
    var dx = event.clientX - previousPointerX;
    var dy = event.clientY - previousPointerY;
    var yawDelta = -dx * 0.0042;
    var pitchDelta = dy * 0.0033;
    yaw += yawDelta;
    pitch = clamp(pitch + pitchDelta, -1.18, 1.18);
    inertiaYaw = yawDelta * 0.052;
    inertiaPitch = pitchDelta * 0.042;
    previousPointerX = event.clientX;
    previousPointerY = event.clientY;
  }

  function onPointerUp(event) {
    if (event.pointerId !== dragPointerId) return;
    dragging = false;
    dragPointerId = null;
    document.body.classList.remove("is-dragging");
    if (particleCanvas.hasPointerCapture(event.pointerId)) particleCanvas.releasePointerCapture(event.pointerId);
  }

  function resetUniverse() {
    yaw = 0.68;
    pitch = -0.035;
    fov = 96;
    inertiaYaw = 0;
    inertiaPitch = 0;
    for (var i = 0; i < stars.length; i += 1) {
      stars[i].ox = 0;
      stars[i].oy = 0;
      stars[i].vx = 0;
      stars[i].vy = 0;
    }
  }

  function onWheel(event) {
    event.preventDefault();
    fov = clamp(fov + event.deltaY * 0.025, 52, 100);
    markExplored();
  }

  function onKeyDown(event) {
    if (event.key === "ArrowLeft") yaw -= 0.08;
    else if (event.key === "ArrowRight") yaw += 0.08;
    else if (event.key === "ArrowUp") pitch = clamp(pitch - 0.06, -1.18, 1.18);
    else if (event.key === "ArrowDown") pitch = clamp(pitch + 0.06, -1.18, 1.18);
    else return;
    markExplored();
  }

  particleCanvas.addEventListener("pointerdown", onPointerDown);
  particleCanvas.addEventListener("pointermove", onPointerMove, { passive: true });
  particleCanvas.addEventListener("pointerup", onPointerUp, { passive: true });
  particleCanvas.addEventListener("pointercancel", onPointerUp, { passive: true });
  particleCanvas.addEventListener("pointerleave", function () {
    if (!dragging) pointer.active = false;
  }, { passive: true });
  particleCanvas.addEventListener("wheel", onWheel, { passive: false });
  window.addEventListener("keydown", onKeyDown);
  window.addEventListener("resize", resize, { passive: true });

  if (resetButton) resetButton.addEventListener("click", resetUniverse);

  if (typeof reducedMotionQuery.addEventListener === "function") {
    reducedMotionQuery.addEventListener("change", function (event) {
      if (event.matches) {
        flowEnabled = false;
      }
    });
  }

  resize();
  buildStars();

  loadImage(choosePanoramaSource())
    .then(function (image) {
      uploadPanorama(image);
      root.classList.add("particle-ready");
      lastFrame = performance.now();
      animationFrame = requestAnimationFrame(render);
    })
    .catch(function (error) {
      console.error(error);
      root.classList.add("no-particle-canvas");
      cancelAnimationFrame(animationFrame);
    });
})();
