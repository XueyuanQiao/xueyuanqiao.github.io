(function () {
  "use strict";

  var panoramaCanvas = document.getElementById("space-panorama");
  var particleCanvas = document.getElementById("cat-particle-stage");
  if (!panoramaCanvas || !particleCanvas) return;

  var musicWarmup = document.querySelector("[data-music-warmup]");
  var musicWarmupStarted = false;
  var musicWarmupScheduled = false;

  var MUSIC_SESSION_EXPAND_ON_ARRIVAL = "aurora-music-expand-on-arrival";

  function rememberMusicWarmup() {
    if (!musicWarmup || !musicWarmup.buffered || !musicWarmup.buffered.length) return;
    var bufferedEnd = 0;
    try { bufferedEnd = musicWarmup.buffered.end(musicWarmup.buffered.length - 1); }
    catch (error) { return; }
    try {
      sessionStorage.setItem("aurora-music-warmup-buffered", bufferedEnd.toFixed(2));
      sessionStorage.setItem("aurora-music-warmup-track", musicWarmup.currentSrc || musicWarmup.src || "");
    } catch (error) {}
  }

  function startMusicWarmup() {
    if (!musicWarmup || musicWarmupStarted) return;
    var source = musicWarmup.getAttribute("data-music-src");
    if (!source) return;
    musicWarmupStarted = true;
    musicWarmup.preload = "auto";
    musicWarmup.src = source;
    musicWarmup.addEventListener("progress", rememberMusicWarmup);
    musicWarmup.addEventListener("canplaythrough", rememberMusicWarmup, { once: true });
    try {
      sessionStorage.setItem("aurora-music-warmup-started", "1");
      musicWarmup.load();
    } catch (error) {}
  }

  function scheduleMusicWarmup() {
    if (musicWarmupScheduled || musicWarmupStarted) return;
    musicWarmupScheduled = true;
    if ("requestIdleCallback" in window) {
      window.requestIdleCallback(startMusicWarmup, { timeout: 1200 });
    } else {
      window.setTimeout(startMusicWarmup, 720);
    }
  }

  function rememberUniverseArrivalIntent() {
    try {
      sessionStorage.setItem(MUSIC_SESSION_EXPAND_ON_ARRIVAL, String(Date.now()));
    } catch (error) {}
  }

  // 只预热音频并让播放器到站后展开，不写播放意图，避免从宇宙页进入博客时自动出声。
  function prepareMusicForNavigation() {
    startMusicWarmup();
    rememberUniverseArrivalIntent();
  }

  function persistMusicNavigationIntent() {
    rememberMusicWarmup();
    rememberUniverseArrivalIntent();
  }

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
    scheduleMusicWarmup();
    return;
  }

  var root = document.documentElement;
  var resetButton = document.querySelector("[data-particle-reset]");
  var entryLink = document.querySelector(".particle-enter");
  var panoramaLoading = document.querySelector("[data-panorama-loading]");
  var panoramaLoadingPhase = document.querySelector("[data-panorama-loading-phase]");
  var panoramaLoadingPercent = document.querySelector("[data-panorama-loading-percent]");
  var panoramaLoadingProgress = document.querySelector("[data-panorama-loading-progress]");
  var panoramaLoadingDetail = document.querySelector("[data-panorama-loading-detail]");
  var panoramaLoadingAnnouncement = document.querySelector("[data-panorama-loading-announcement]");
  var launchTransition = document.querySelector("[data-launch-transition]");
  var launchCanvas = launchTransition && launchTransition.querySelector(".launch-transition__canvas");
  var launchContext = launchCanvas && launchCanvas.getContext("2d", { alpha: true, desynchronized: true });
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
  var launchAnimationFrame = 0;
  var launchStartedAt = 0;
  var launchLastFrame = 0;
  var launchArrivalTheme = "dark";
  var warpStars = [];
  var warpBands = [];
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
  var viewReset = null;
  var flowEnabled = !reducedMotionQuery.matches;
  var glowEnabled = true;
  var flowAmount = flowEnabled ? 1 : 0;
  var glowAmount = 1;
  var firstInteraction = false;
  var pointer = { x: -9999, y: -9999, active: false, strength: 0 };
  var panoramaLoadingState = "connecting";
  var panoramaPreviewReady = false;
  var panoramaTransferLoaded = 0;
  var panoramaTransferTotal = 0;
  var panoramaTransferKnown = false;
  var panoramaTransferSlow = false;
  var panoramaProgressAnnounced = -1;
  var panoramaProgressUpdatedAt = 0;
  var panoramaSlowTimer = 0;
  var panoramaDismissTimer = 0;
  var panoramaTarget = null;

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

  function easeInOutCubic(value) {
    return value < 0.5
      ? 4 * value * value * value
      : 1 - Math.pow(-2 * value + 2, 3) / 2;
  }

  function formatMegabytes(bytes) {
    if (bytes === null || typeof bytes === "undefined" || !isFinite(bytes)) return "";
    if (bytes <= 0) return "0 MB";
    var megabytes = bytes / 1048576;
    if (megabytes < 0.1) return "<0.1 MB";
    return megabytes.toFixed(bytes >= 10485760 ? 0 : 1) + " MB";
  }

  function panoramaTargetSpecification() {
    if (!panoramaTarget) return "高清全天星图";
    return panoramaTarget.width + " × " + panoramaTarget.height + " · " + formatMegabytes(panoramaTarget.expectedBytes);
  }

  function setPanoramaLoadingAnnouncement(message) {
    if (!panoramaLoadingAnnouncement || !message) return;
    panoramaLoadingAnnouncement.textContent = message;
  }

  function setPanoramaLoadingProgress(value, valueText, updateAria) {
    var progress = clamp(value || 0, 0, 1);
    if (panoramaLoading) {
      panoramaLoading.style.setProperty("--panorama-progress", progress.toFixed(4));
    }
    if (!panoramaLoadingProgress || updateAria === false) return;
    panoramaLoadingProgress.setAttribute("aria-valuenow", String(Math.round(progress * 100)));
    panoramaLoadingProgress.setAttribute("aria-valuetext", valueText || (Math.round(progress * 100) + "%"));
  }

  function setPanoramaLoadingIndeterminate(indeterminate) {
    if (panoramaLoading) panoramaLoading.classList.toggle("is-indeterminate", Boolean(indeterminate));
    if (!panoramaLoadingProgress) return;
    if (indeterminate) panoramaLoadingProgress.removeAttribute("aria-valuenow");
  }

  function setPanoramaLoadingCopy(state, phase, percent, detail, announcement) {
    panoramaLoadingState = state;
    if (panoramaLoading) panoramaLoading.setAttribute("data-loading-state", state);
    if (panoramaLoadingPhase) panoramaLoadingPhase.textContent = phase;
    if (panoramaLoadingPercent) panoramaLoadingPercent.textContent = percent;
    if (panoramaLoadingDetail) panoramaLoadingDetail.textContent = detail;
    if (announcement) setPanoramaLoadingAnnouncement(announcement);
  }

  function panoramaTransferPhase() {
    if (panoramaTransferSlow) return "深空信号较远 · 高清星图仍在接收";
    if (panoramaPreviewReady) return "预览可拖曳 · 高清星图接收中";
    return "高清星图接收中";
  }

  function updatePanoramaTransfer(loaded, total, force) {
    panoramaTransferLoaded = Math.max(0, loaded || 0);
    panoramaTransferTotal = Math.max(0, total || panoramaTransferTotal || 0);
    panoramaTransferKnown = panoramaTransferTotal > 0;
    if (panoramaTransferKnown && panoramaTarget) panoramaTarget.expectedBytes = panoramaTransferTotal;

    var now = performance.now();
    if (!force && now - panoramaProgressUpdatedAt < 80) return;
    panoramaProgressUpdatedAt = now;

    var phase = panoramaTransferPhase();
    var specification = panoramaTargetSpecification();
    if (panoramaTransferKnown) {
      var progress = clamp(panoramaTransferLoaded / panoramaTransferTotal, 0, 1);
      var percent = Math.round(progress * 100);
      var announcementStep = Math.floor(percent / 25) * 25;
      var progressStateChanged = panoramaLoadingState !== "receiving";
      var progressBecameKnown = panoramaLoadingProgress && !panoramaLoadingProgress.hasAttribute("aria-valuenow");
      var progressMilestoneChanged = announcementStep >= 25 && announcementStep > panoramaProgressAnnounced;
      setPanoramaLoadingIndeterminate(false);
      setPanoramaLoadingProgress(
        progress,
        phase + "，" + percent + "%",
        progressStateChanged || progressBecameKnown || progressMilestoneChanged
      );
      setPanoramaLoadingCopy(
        "receiving",
        phase,
        percent + "%",
        specification + " · " + formatMegabytes(panoramaTransferLoaded) + " / " + formatMegabytes(panoramaTransferTotal) + " 已接收"
      );

      if (progressMilestoneChanged) {
        panoramaProgressAnnounced = announcementStep;
        setPanoramaLoadingAnnouncement("正在接收三体信号，高清宇宙星象图已加载 " + announcementStep + "% 。");
      }
      return;
    }

    var receivingStarted = panoramaLoadingState !== "receiving";
    setPanoramaLoadingIndeterminate(true);
    if (receivingStarted && panoramaLoadingProgress) {
      panoramaLoadingProgress.setAttribute("aria-valuetext", phase + "，接收中");
    }
    setPanoramaLoadingCopy(
      "receiving",
      phase,
      "接收中",
      specification + (panoramaTransferLoaded ? " · 已接收 " + formatMegabytes(panoramaTransferLoaded) : "")
    );
  }

  function markPanoramaPreviewReady() {
    panoramaPreviewReady = true;
    if (panoramaLoadingState === "receiving") {
      updatePanoramaTransfer(panoramaTransferLoaded, panoramaTransferTotal, true);
      setPanoramaLoadingAnnouncement(
        "预览星图已经可以拖曳，高清宇宙星象图仍在接收。"
      );
      return;
    }
    if (panoramaLoadingState !== "connecting") return;
    setPanoramaLoadingCopy(
      "connecting",
      "预览可拖曳 · 正在建立高清链路",
      "连接中",
      panoramaTargetSpecification() + " 高清全天星图",
      "预览星图已经可以拖曳，高清宇宙星象图正在建立接收链路。"
    );
  }

  function markPanoramaTransferSlow() {
    if (panoramaLoadingState !== "connecting" && panoramaLoadingState !== "receiving") return;
    panoramaTransferSlow = true;
    if (panoramaLoadingState === "receiving") {
      updatePanoramaTransfer(panoramaTransferLoaded, panoramaTransferTotal, true);
      setPanoramaLoadingAnnouncement(
        "三体信号较远，高清宇宙星象图仍在接收，预览星图可以继续拖曳。"
      );
      return;
    }
    setPanoramaLoadingCopy(
      "connecting",
      "深空信号较远 · 高清链路建立中",
      "连接中",
      panoramaTargetSpecification() + " · 抵达后自动显影",
      "三体信号较远，高清宇宙星象图仍在建立接收链路。"
    );
  }

  function markPanoramaDecoding(blobSize) {
    window.clearTimeout(panoramaSlowTimer);
    scheduleMusicWarmup();
    setPanoramaLoadingIndeterminate(false);
    setPanoramaLoadingProgress(1, "星图接收完成，正在解析高清细节");
    setPanoramaLoadingCopy(
      "decoding",
      "星图已接收 · 解析 " + panoramaTarget.width + " × " + panoramaTarget.height + " 星域",
      "100%",
      formatMegabytes(blobSize || panoramaTarget.expectedBytes) + " 深空母版 · 正在解码",
      "三体信号已经接收完成，正在解析高清宇宙星象图。"
    );
  }

  function markPanoramaCalibrating() {
    setPanoramaLoadingProgress(1, "正在完成高清星图校准");
    setPanoramaLoadingCopy(
      "calibrating",
      "深空细节已解析 · 正在完成星图校准",
      "显影中",
      "高清纹理写入中 · 当前探索视角保持不变"
    );
  }

  function dismissPanoramaLoading(delay) {
    window.clearTimeout(panoramaDismissTimer);
    panoramaDismissTimer = window.setTimeout(function () {
      root.classList.add("panorama-loading-dismissed");
    }, delay);
  }

  function markPanoramaComplete() {
    setPanoramaLoadingProgress(1, "高清宇宙星象图已经就绪");
    setPanoramaLoadingCopy(
      "complete",
      "高清星海已就绪 · 拖曳探索 360°",
      "已完成",
      panoramaTargetSpecification() + " 高清全天星图已显影",
      "高清宇宙星象图已经就绪，可以拖曳探索三百六十度星空。"
    );
    dismissPanoramaLoading(reducedMotionQuery.matches ? 280 : 520);
  }

  function markPanoramaUpgradeFailed() {
    window.clearTimeout(panoramaSlowTimer);
    setPanoramaLoadingIndeterminate(false);
    setPanoramaLoadingProgress(
      panoramaTransferKnown ? clamp(panoramaTransferLoaded / panoramaTransferTotal, 0, 1) : 0,
      "高清宇宙星象图接收中断"
    );
    setPanoramaLoadingCopy(
      "failed",
      "预览已保留 · 高清星图接收中断",
      "预览模式",
      "当前仍可拖曳探索 · 稍后刷新可重新接收",
      "高清宇宙星象图接收中断，当前保留可拖曳的预览星图。"
    );
    dismissPanoramaLoading(reducedMotionQuery.matches ? 900 : 1700);
  }

  function cancelViewReset() {
    if (!viewReset) return;
    viewReset = null;
    if (resetButton) resetButton.classList.remove("is-resetting");
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
  var panoramaQuality = 0;
  var renderingStarted = false;

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
    scheduleMusicWarmup();
    return;
  }

  function choosePanoramaSource() {
    var maximumTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE) || 4096;
    var originalSource = panoramaCanvas.getAttribute("data-panorama-src");
    var compatibilitySource = panoramaCanvas.getAttribute("data-panorama-mobile-src");
    if (maximumTextureSize >= 6000 || !compatibilitySource) {
      return {
        source: originalSource,
        width: 6000,
        height: 3000,
        expectedBytes: 7143010
      };
    }
    return {
      source: compatibilitySource,
      width: 4096,
      height: 2048,
      expectedBytes: 2251044
    };
  }

  function loadImage(source, priority) {
    return new Promise(function (resolve, reject) {
      var image = new Image();
      image.decoding = "async";
      if ("fetchPriority" in image) image.fetchPriority = priority || "auto";
      image.onload = function () { resolve(image); };
      image.onerror = function () { reject(new Error("360° 全景影像载入失败")); };
      image.src = source;
    });
  }

  function loadBlobImage(blob) {
    var objectUrl = URL.createObjectURL(blob);
    return loadImage(objectUrl, "auto").then(function (image) {
      URL.revokeObjectURL(objectUrl);
      return image;
    }, function (error) {
      URL.revokeObjectURL(objectUrl);
      throw error;
    });
  }

  function uploadPanorama(image) {
    var previousTexture = panoramaTexture;
    textureWidth = image.naturalWidth;
    textureHeight = image.naturalHeight;
    var nextTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, nextTexture);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
    panoramaTexture = nextTexture;
    if (previousTexture) gl.deleteTexture(previousTexture);
  }

  function showPanorama(image, quality, readyClass) {
    if (quality <= panoramaQuality) return;
    uploadPanorama(image);
    panoramaQuality = quality;
    root.classList.add(readyClass);
  }

  function loadPreviewPanorama() {
    return loadImage(panoramaCanvas.getAttribute("data-panorama-preview-src"), "auto");
  }

  function loadOriginalPanorama() {
    if (!("XMLHttpRequest" in window)) {
      panoramaSlowTimer = window.setTimeout(markPanoramaTransferSlow, 6500);
      return loadImage(panoramaTarget.source, "high").then(function (image) {
        markPanoramaDecoding(panoramaTarget.expectedBytes);
        return image;
      });
    }

    return new Promise(function (resolve, reject) {
      var xhr = new XMLHttpRequest();
      panoramaSlowTimer = window.setTimeout(markPanoramaTransferSlow, 6500);
      xhr.open("GET", panoramaTarget.source, true);
      xhr.responseType = "blob";
      xhr.onprogress = function (event) {
        updatePanoramaTransfer(event.loaded, event.lengthComputable ? event.total : 0, false);
      };
      xhr.onerror = function () {
        reject(new Error("360° 高清全景影像接收失败"));
      };
      xhr.onabort = function () {
        reject(new Error("360° 高清全景影像接收已中断"));
      };
      xhr.onload = function () {
        if ((xhr.status < 200 || xhr.status >= 300) && xhr.status !== 0) {
          reject(new Error("360° 高清全景影像接收失败（" + xhr.status + "）"));
          return;
        }
        var blob = xhr.response;
        if (!blob || !blob.size) {
          reject(new Error("360° 高清全景影像内容为空"));
          return;
        }
        updatePanoramaTransfer(blob.size, panoramaTransferTotal || blob.size, true);
        markPanoramaDecoding(blob.size);
        loadBlobImage(blob).then(resolve, reject);
      };
      xhr.send();
    });
  }

  function startRendering() {
    if (renderingStarted || !panoramaTexture) return;
    renderingStarted = true;
    root.classList.add("particle-ready");
    lastFrame = performance.now();
    animationFrame = requestAnimationFrame(render);
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

    if (launchCanvas && launchContext) {
      launchCanvas.width = Math.max(1, Math.round(width * dpr));
      launchCanvas.height = Math.max(1, Math.round(height * dpr));
      launchCanvas.style.width = width + "px";
      launchCanvas.style.height = height + "px";
      launchContext.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
  }

  function buildWarpStars() {
    var count = coarsePointerQuery.matches || width < 700 ? 132 : 220;
    warpStars = [];
    for (var i = 0; i < count; i += 1) {
      var angle = random(0, Math.PI * 2);
      var radius = random(0.12, 1.18);
      warpStars.push({
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
        z: random(0.12, 1.18),
        speed: random(0.72, 1.36),
        twist: random(-0.18, 0.18),
        alpha: random(0.13, 0.48),
        width: random(0.35, 1),
        color: Math.random() > 0.82 ? "124,145,183" : Math.random() > 0.9 ? "134,119,173" : "186,202,215"
      });
    }

    var bandCount = coarsePointerQuery.matches || width < 700 ? 9 : 14;
    warpBands = [];
    for (var j = 0; j < bandCount; j += 1) {
      warpBands.push({
        z: random(0.18, 1.16),
        radius: random(0.16, 0.34),
        speed: random(0.62, 1.18),
        phase: random(0, Math.PI * 2),
        length: random(0.62, 1.72),
        tilt: random(-0.32, 0.32),
        alpha: random(0.035, 0.095),
        color: Math.random() > 0.68 ? "91,108,153" : "75,91,126"
      });
    }
  }

  function drawLaunchTransition(now) {
    if (!launchContext || !launchCanvas) return;
    var duration = 1580;
    var progress = clamp((now - launchStartedAt) / duration, 0, 1);
    var warpProgress = clamp((progress - 0.05) / 0.76, 0, 1);
    var frameScale = clamp((now - launchLastFrame) / 16.67, 0.5, 2.1);
    var centerX = width * 0.5;
    var centerY = height * 0.43;
    var maximumRadius = Math.hypot(width, height) * 0.72;
    var focalLength = Math.min(width, height) * (0.46 + warpProgress * 0.08);
    launchLastFrame = now;

    launchContext.clearRect(0, 0, width, height);
    launchContext.fillStyle = "rgba(1,3,10," + Math.min(0.96, progress * 1.28) + ")";
    launchContext.fillRect(0, 0, width, height);

    var nebula = launchContext.createRadialGradient(centerX, centerY, 0, centerX, centerY, maximumRadius * 0.72);
    nebula.addColorStop(0, "rgba(49,61,103," + 0.08 * warpProgress + ")");
    nebula.addColorStop(0.24, "rgba(43,49,91," + 0.055 * warpProgress + ")");
    nebula.addColorStop(1, "rgba(2,4,14,0)");
    launchContext.fillStyle = nebula;
    launchContext.fillRect(0, 0, width, height);

    launchContext.save();
    launchContext.globalCompositeOperation = "screen";
    for (var i = 0; i < warpStars.length; i += 1) {
      var star = warpStars[i];
      star.z -= (0.0038 + warpProgress * 0.031) * star.speed * frameScale;
      if (star.z < 0.065) {
        var resetAngle = random(0, Math.PI * 2);
        var resetRadius = random(0.12, 1.18);
        star.x = Math.cos(resetAngle) * resetRadius;
        star.y = Math.sin(resetAngle) * resetRadius;
        star.z = random(1.02, 1.2);
      }

      var tailZ = Math.min(1.34, star.z + (0.016 + warpProgress * 0.12) * star.speed);
      var headRotation = progress * 0.46 * (1 - star.z) + star.twist;
      var tailRotation = progress * 0.46 * (1 - tailZ) + star.twist;
      var headCos = Math.cos(headRotation);
      var headSin = Math.sin(headRotation);
      var tailCos = Math.cos(tailRotation);
      var tailSin = Math.sin(tailRotation);
      var headX3d = star.x * headCos - star.y * headSin;
      var headY3d = star.x * headSin + star.y * headCos;
      var tailX3d = star.x * tailCos - star.y * tailSin;
      var tailY3d = star.x * tailSin + star.y * tailCos;
      var headX = centerX + headX3d * focalLength / star.z;
      var headY = centerY + headY3d * focalLength / star.z;
      var tailX = centerX + tailX3d * focalLength / tailZ;
      var tailY = centerY + tailY3d * focalLength / tailZ;
      var distanceFromCenter = Math.hypot(headX - centerX, headY - centerY);
      var alpha = star.alpha * (0.18 + warpProgress * 0.74) * clamp(distanceFromCenter / 130, 0.12, 1);

      launchContext.strokeStyle = "rgba(" + star.color + "," + alpha + ")";
      launchContext.lineWidth = star.width + warpProgress * clamp(0.45 / star.z, 0, 1.25);
      launchContext.beginPath();
      launchContext.moveTo(tailX, tailY);
      launchContext.lineTo(headX, headY);
      launchContext.stroke();
    }

    for (var j = 0; j < warpBands.length; j += 1) {
      var band = warpBands[j];
      band.z -= (0.0024 + warpProgress * 0.018) * band.speed * frameScale;
      if (band.z < 0.085) {
        band.z = random(1.02, 1.2);
        band.phase = random(0, Math.PI * 2);
      }

      var bandRadius = focalLength * band.radius / band.z;
      if (bandRadius > maximumRadius * 1.35) continue;
      var bandAlpha = band.alpha * (0.25 + warpProgress * 0.75) * clamp(1 - band.z * 0.38, 0.22, 1);
      launchContext.strokeStyle = "rgba(" + band.color + "," + bandAlpha + ")";
      launchContext.lineWidth = 0.55 + warpProgress * clamp(0.7 / band.z, 0, 1.4);
      launchContext.beginPath();
      launchContext.ellipse(
        centerX,
        centerY,
        bandRadius * 1.28,
        bandRadius * 0.7,
        band.tilt + progress * 0.34,
        band.phase,
        band.phase + band.length
      );
      launchContext.stroke();
    }
    launchContext.restore();

    if (progress > 0.84) {
      var darken = clamp((progress - 0.84) / 0.16, 0, 1);
      var arrivalColor = launchArrivalTheme === "light" ? "235,239,247" : "3,5,12";
      launchContext.fillStyle = "rgba(" + arrivalColor + "," + darken * 0.96 + ")";
      launchContext.fillRect(0, 0, width, height);
    }

    if (progress < 1) launchAnimationFrame = requestAnimationFrame(drawLaunchTransition);
  }

  function startLaunchTransition() {
    if (!launchTransition || !entryLink) return 680;
    var badge = entryLink.querySelector("b");
    var badgeBounds = badge ? badge.getBoundingClientRect() : entryLink.getBoundingClientRect();
    launchTransition.style.setProperty("--launch-x", badgeBounds.left + badgeBounds.width * 0.5 + "px");
    launchTransition.style.setProperty("--launch-y", badgeBounds.top + badgeBounds.height * 0.5 + "px");
    launchTransition.setAttribute("aria-hidden", "false");
    try {
      launchArrivalTheme = window.localStorage.getItem("aurora-theme") === "light" ? "light" : "dark";
    } catch (error) {
      launchArrivalTheme = "dark";
    }
    launchTransition.classList.toggle("is-light-arrival", launchArrivalTheme === "light");
    launchTransition.classList.add("is-active");
    document.body.classList.add("is-site-launching");
    buildWarpStars();
    launchStartedAt = performance.now();
    launchLastFrame = launchStartedAt;
    cancelAnimationFrame(launchAnimationFrame);
    if (launchContext) launchAnimationFrame = requestAnimationFrame(drawLaunchTransition);
    return 1580;
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

    if (viewReset) {
      var resetProgress = clamp((now - viewReset.startedAt) / viewReset.duration, 0, 1);
      var resetEase = easeInOutCubic(resetProgress);
      yaw = wrapAngle(viewReset.startYaw + viewReset.deltaYaw * resetEase);
      pitch = viewReset.startPitch + (viewReset.targetPitch - viewReset.startPitch) * resetEase;
      fov = viewReset.startFov + (viewReset.targetFov - viewReset.startFov) * resetEase;
      inertiaYaw = 0;
      inertiaPitch = 0;

      if (resetProgress >= 1) {
        yaw = viewReset.targetYaw;
        pitch = viewReset.targetPitch;
        fov = viewReset.targetFov;
        viewReset = null;
        if (resetButton) resetButton.classList.remove("is-resetting");
      }
    } else if (!dragging) {
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
    cancelViewReset();
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
    var targetYaw = 0.68;
    var targetPitch = -0.035;
    var targetFov = 96;
    inertiaYaw = 0;
    inertiaPitch = 0;

    if (reducedMotionQuery.matches) {
      yaw = targetYaw;
      pitch = targetPitch;
      fov = targetFov;
      viewReset = null;
    } else {
      var deltaYaw = wrapAngle(targetYaw - yaw);
      var travel = Math.abs(deltaYaw) + Math.abs(targetPitch - pitch) + Math.abs(targetFov - fov) / 70;
      var duration = clamp(720 + travel * 230, 760, 1120);
      viewReset = {
        startedAt: performance.now(),
        duration: duration,
        startYaw: yaw,
        startPitch: pitch,
        startFov: fov,
        deltaYaw: deltaYaw,
        targetYaw: targetYaw,
        targetPitch: targetPitch,
        targetFov: targetFov
      };

      if (resetButton) {
        resetButton.classList.remove("is-resetting");
        void resetButton.offsetWidth;
        resetButton.style.setProperty("--reset-duration", duration + "ms");
        resetButton.classList.add("is-resetting");
      }
    }

    for (var i = 0; i < stars.length; i += 1) {
      stars[i].vx += -stars[i].ox * 0.025;
      stars[i].vy += -stars[i].oy * 0.025;
    }
  }

  function onWheel(event) {
    event.preventDefault();
    cancelViewReset();
    fov = clamp(fov + event.deltaY * 0.025, 52, 100);
    markExplored();
  }

  function onKeyDown(event) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "ArrowUp" && event.key !== "ArrowDown") return;
    cancelViewReset();
    if (event.key === "ArrowLeft") yaw -= 0.08;
    else if (event.key === "ArrowRight") yaw += 0.08;
    else if (event.key === "ArrowUp") pitch = clamp(pitch - 0.06, -1.18, 1.18);
    else pitch = clamp(pitch + 0.06, -1.18, 1.18);
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

  if (resetButton) {
    resetButton.addEventListener("click", resetUniverse);
  }

  if (entryLink) {
    entryLink.addEventListener("click", function (event) {
      startMusicWarmup();
      var isModified = event.metaKey || event.ctrlKey || event.shiftKey || event.altKey;
      if (isModified || event.button !== 0) return;
      prepareMusicForNavigation();
      if (reducedMotionQuery.matches) return;
      event.preventDefault();
      if (entryLink.classList.contains("is-launching")) return;
      entryLink.classList.add("is-launching");
      var transitionDuration = startLaunchTransition();
      window.setTimeout(function () {
        persistMusicNavigationIntent();
        window.location.assign(entryLink.href);
      }, transitionDuration);
    });
  }

  if (typeof reducedMotionQuery.addEventListener === "function") {
    reducedMotionQuery.addEventListener("change", function (event) {
      if (event.matches) {
        flowEnabled = false;
      }
    });
  }

  resize();
  buildStars();
  panoramaTarget = choosePanoramaSource();
  setPanoramaLoadingCopy(
    "connecting",
    "正在建立高清宇宙星象图链路",
    "连接中",
    panoramaTargetSpecification() + " 高清全天星图",
    "正在接收三体信号，正在建立高清宇宙星象图链路。"
  );

  var originalPanoramaPromise = loadOriginalPanorama()
    .then(function (image) {
      panoramaTarget.width = image.naturalWidth || panoramaTarget.width;
      panoramaTarget.height = image.naturalHeight || panoramaTarget.height;
      markPanoramaCalibrating();
      return new Promise(function (resolve, reject) {
        requestAnimationFrame(function () {
          try {
            showPanorama(image, 2, "panorama-high-ready");
            startRendering();
          } catch (error) {
            reject(error);
            return;
          }
          requestAnimationFrame(function () {
            markPanoramaComplete();
            resolve(true);
          });
        });
      });
    })
    .catch(function (error) {
      window.clearTimeout(panoramaSlowTimer);
      scheduleMusicWarmup();
      console.warn(error.message);
      return false;
    });

  var previewPanoramaPromise = loadPreviewPanorama()
    .then(function (image) {
      showPanorama(image, 1, "panorama-preview-ready");
      startRendering();
      markPanoramaPreviewReady();
      return true;
    })
    .catch(function (error) {
      console.warn(error.message);
      return false;
    });

  Promise.all([previewPanoramaPromise, originalPanoramaPromise])
    .then(function (results) {
      if (!results[1] && results[0]) {
        root.classList.add("panorama-upgrade-failed");
        markPanoramaUpgradeFailed();
      }
      if (!panoramaTexture) {
        root.classList.add("no-particle-canvas");
        cancelAnimationFrame(animationFrame);
      }
    });
})();
