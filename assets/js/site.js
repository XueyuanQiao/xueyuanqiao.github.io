/* Aurora Theme · site.js
 * 零依赖原生 JS，提供：
 *  - 主题切换（暗/亮，记忆 localStorage）
 *  - 移动端侧边栏抽屉
 *  - 当前导航激活态
 *  - 滚动渐显（IntersectionObserver）
 *  - 阅读进度条
 *  - 回到顶部按钮
 *  - 代码块语言标签 + 一键复制
 */
(function () {
  "use strict";

  var doc = document;
  var root = doc.documentElement;
  var STORE_KEY = "aurora-theme";

  // ========== Theme ==========
  function applyTheme(theme) {
    if (theme === "light") {
      root.setAttribute("data-theme", "light");
    } else {
      root.removeAttribute("data-theme");
    }
  }

  function initTheme() {
    var saved;
    try { saved = localStorage.getItem(STORE_KEY); } catch (e) {}
    if (!saved) {
      var prefersLight = window.matchMedia && window.matchMedia("(prefers-color-scheme: light)").matches;
      saved = prefersLight ? "light" : "dark";
    }
    applyTheme(saved);
  }

  function toggleTheme() {
    var next = root.getAttribute("data-theme") === "light" ? "dark" : "light";
    applyTheme(next);
    try { localStorage.setItem(STORE_KEY, next); } catch (e) {}
  }

  initTheme();

  // ========== DOM ready ==========
  function ready(fn) {
    if (doc.readyState !== "loading") fn();
    else doc.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    var body = doc.body;

    // Active nav link
    var path = location.pathname.replace(/\/$/, "") || "/";
    doc.querySelectorAll(".nav a").forEach(function (a) {
      var href = (a.getAttribute("href") || "").replace(/\/$/, "") || "/";
      var current = href === path;
      if (!current && href !== "/" && path.indexOf(href) === 0) current = true;
      if (current) a.classList.add("is-active");
    });

    // Mobile menu toggle
    var menuBtn = doc.querySelector(".menu-toggle");
    var scrim = doc.querySelector(".scrim");
    function lockScroll(lock) {
      // 仅在窄屏时锁定 body，避免桌面模式被误锁
      if (window.innerWidth > 920) return;
      doc.documentElement.style.overflow = lock ? "hidden" : "";
      body.style.overflow = lock ? "hidden" : "";
    }
    function closeMenu() {
      body.classList.remove("is-menu-open");
      lockScroll(false);
    }
    function openMenu() {
      body.classList.add("is-menu-open");
      lockScroll(true);
    }
    if (menuBtn) {
      menuBtn.addEventListener("click", function () {
        if (body.classList.contains("is-menu-open")) closeMenu();
        else openMenu();
      });
    }
    if (scrim) scrim.addEventListener("click", closeMenu);
    doc.querySelectorAll(".sidebar a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && body.classList.contains("is-menu-open")) closeMenu();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 920) closeMenu();
    });

    // Theme toggle button
    var themeBtn = doc.querySelector("[data-theme-toggle]");
    if (themeBtn) themeBtn.addEventListener("click", toggleTheme);

    // Reveal on scroll
    var revealItems = doc.querySelectorAll(".post-card, .article, .page, .pagination, .hero, .link-category, .cate-cloud, .cate-list");
    revealItems.forEach(function (el) { el.classList.add("reveal"); });

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      }, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
      revealItems.forEach(function (el) { io.observe(el); });
    } else {
      revealItems.forEach(function (el) { el.classList.add("is-in"); });
    }

    // Reading progress
    var progress = doc.querySelector(".read-progress");
    if (progress) {
      var ticking = false;
      window.addEventListener("scroll", function () {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(function () {
          var h = doc.documentElement;
          var scrolled = h.scrollTop || body.scrollTop;
          var height = (h.scrollHeight - h.clientHeight) || 1;
          var pct = Math.min(100, (scrolled / height) * 100);
          progress.style.width = pct + "%";
          ticking = false;
        });
      }, { passive: true });
    }

    // Back to top
    var fab = doc.querySelector(".fab-top");
    if (fab) {
      window.addEventListener("scroll", function () {
        if (window.scrollY > 400) fab.classList.add("is-visible");
        else fab.classList.remove("is-visible");
      }, { passive: true });
      fab.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // Code block enhancements
    enhanceCodeBlocks();

    // Article-only enhancements
    enhanceArticle();

    // Landing-only enhancements run via a separate IIFE listener.
  });

  function enhanceArticle() {
    var content = doc.querySelector('.article-content');
    if (!content) return;

    // 1) Wrap tables for horizontal scrolling
    content.querySelectorAll('table').forEach(function (table) {
      if (table.parentElement && table.parentElement.classList.contains('table-wrap')) return;
      var wrap = doc.createElement('div');
      wrap.className = 'table-wrap';
      table.parentNode.insertBefore(wrap, table);
      wrap.appendChild(table);
    });

    // 2) Slugify + anchor + collect TOC
    var headings = content.querySelectorAll('h2, h3, h4');
    var slugCount = {};
    var tocItems = [];
    headings.forEach(function (h) {
      var text = (h.textContent || '').trim();
      if (!text) return;
      var slug = h.id || slugify(text);
      if (slugCount[slug]) {
        slugCount[slug] += 1;
        slug = slug + '-' + slugCount[slug];
      } else {
        slugCount[slug] = 1;
      }
      h.id = slug;

      var a = doc.createElement('a');
      a.className = 'anchor';
      a.href = '#' + slug;
      a.setAttribute('aria-label', '锚点链接');
      a.textContent = '#';
      h.appendChild(a);

      tocItems.push({ id: slug, level: h.tagName, text: text });
    });

    // 3) Build TOC if there are >= 2 headings
    var tocEl = doc.querySelector('[data-toc]');
    var tocList = doc.querySelector('[data-toc-list]');
    if (tocEl && tocList && tocItems.length >= 2) {
      tocList.innerHTML = tocItems.map(function (it) {
        var cls = 'toc-' + it.level.toLowerCase();
        return '<li class="' + cls + '"><a href="#' + it.id + '">' + escapeHTML(it.text) + '</a></li>';
      }).join('');
      tocEl.hidden = false;

      // 移动端默认折叠目录，节省纵向空间
      var isNarrow = window.matchMedia && window.matchMedia('(max-width: 920px)').matches;
      if (isNarrow) tocEl.setAttribute('data-collapsed', 'true');

      // Spy active heading
      var links = tocEl.querySelectorAll('a');
      var byId = {};
      links.forEach(function (l) {
        byId[l.getAttribute('href').slice(1)] = l;
      });
      if ('IntersectionObserver' in window) {
        var spy = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            var link = byId[e.target.id];
            if (!link) return;
            if (e.isIntersecting) {
              links.forEach(function (l) { l.classList.remove('is-active'); });
              link.classList.add('is-active');
            }
          });
        }, { rootMargin: '-30% 0px -65% 0px', threshold: 0 });
        headings.forEach(function (h) { spy.observe(h); });
      }

      // Collapse toggle
      var toggle = doc.querySelector('[data-toc-toggle]');
      if (toggle) {
        toggle.addEventListener('click', function () {
          var collapsed = tocEl.getAttribute('data-collapsed') === 'true';
          tocEl.setAttribute('data-collapsed', collapsed ? 'false' : 'true');
        });
      }
    }

    // 4) Image lightbox
    var lb = null;
    content.querySelectorAll('img').forEach(function (img) {
      img.addEventListener('click', function () {
        if (!lb) {
          lb = doc.createElement('div');
          lb.className = 'lightbox';
          lb.innerHTML = '<img alt="">';
          doc.body.appendChild(lb);
          lb.addEventListener('click', function () { lb.classList.remove('is-open'); });
        }
        var inner = lb.querySelector('img');
        inner.src = img.currentSrc || img.src;
        inner.alt = img.alt || '';
        requestAnimationFrame(function () { lb.classList.add('is-open'); });
      });
    });
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb) lb.classList.remove('is-open');
    });
  }

  function slugify(text) {
    return String(text)
      .toLowerCase()
      .trim()
      .replace(/[\s\u3000]+/g, '-')
      .replace(/[^\w\u4e00-\u9fa5\-]+/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') || 'section';
  }

  function escapeHTML(s) {
    return String(s).replace(/[&<>"']/g, function (m) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[m];
    });
  }

  function enhanceCodeBlocks() {
    var blocks = doc.querySelectorAll("pre > code, figure.highlight pre code");
    blocks.forEach(function (code) {
      var pre = code.closest("pre");
      if (!pre || pre.dataset.enhanced) return;
      pre.dataset.enhanced = "1";

      // language detection
      var lang = "";
      var clsList = (code.className || "").split(/\s+/);
      for (var i = 0; i < clsList.length; i++) {
        var c = clsList[i];
        if (c.indexOf("language-") === 0) { lang = c.slice(9); break; }
        if (c.indexOf("lang-") === 0) { lang = c.slice(5); break; }
      }
      if (!lang) {
        var fig = pre.closest("figure.highlight");
        if (fig) {
          var m = (fig.className || "").match(/highlight\s+([\w-]+)/);
          if (m) lang = m[1];
        }
      }
      if (lang) {
        var label = doc.createElement("span");
        label.className = "code-lang";
        label.textContent = lang;
        pre.appendChild(label);
      }

      // copy button
      var btn = doc.createElement("button");
      btn.className = "code-copy";
      btn.type = "button";
      btn.setAttribute("aria-label", "复制代码");
      btn.textContent = "复制";
      btn.addEventListener("click", function () {
        var text = code.innerText;
        var done = function () {
          btn.textContent = "已复制";
          btn.classList.add("is-copied");
          setTimeout(function () {
            btn.textContent = "复制";
            btn.classList.remove("is-copied");
          }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done).catch(fallback);
        } else {
          fallback();
        }
        function fallback() {
          var ta = doc.createElement("textarea");
          ta.value = text;
          ta.style.position = "fixed";
          ta.style.opacity = "0";
          doc.body.appendChild(ta);
          ta.select();
          try { doc.execCommand("copy"); done(); } catch (e) {}
          doc.body.removeChild(ta);
        }
      });
      pre.appendChild(btn);
    });
  }
})();


/* ==========================================================================
   Landing-only enhancements
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  // 触屏 / 粗指针设备：不启用 3D tilt 与神经网络背景，避免性能浪费与残留态
  var isTouchDevice =
    (window.matchMedia && window.matchMedia("(hover: none) and (pointer: coarse)").matches) ||
    ("ontouchstart" in window && navigator.maxTouchPoints > 0);
  var isNarrowScreen = window.matchMedia && window.matchMedia("(max-width: 920px)").matches;

  function bootstrap() {
    var isLanding = doc.body.classList.contains("is-landing");
    initTyped();
    initCounters();
    if (!isTouchDevice) initTilt();
    if (!isTouchDevice) initSkillSpotlight();
    if (isLanding && !isTouchDevice && !isNarrowScreen) initNeural();
  }

  if (doc.readyState !== "loading") bootstrap();
  else doc.addEventListener("DOMContentLoaded", bootstrap);

  // ---------- Typed text ----------
  function initTyped() {
    var nodes = doc.querySelectorAll("[data-typed]");
    nodes.forEach(function (el) {
      var raw = el.getAttribute("data-typed-strings") || "[]";
      var lines;
      try { lines = JSON.parse(raw); } catch (e) { lines = []; }
      if (!lines.length) return;

      if (prefersReducedMotion) { el.textContent = lines[0]; return; }

      var li = 0, ci = 0, deleting = false;
      function tick() {
        var cur = lines[li];
        if (!deleting) {
          ci++;
          el.textContent = cur.slice(0, ci);
          if (ci === cur.length) {
            deleting = true;
            return setTimeout(tick, 1600);
          }
          setTimeout(tick, 60 + Math.random() * 40);
        } else {
          ci--;
          el.textContent = cur.slice(0, ci);
          if (ci === 0) {
            deleting = false;
            li = (li + 1) % lines.length;
            return setTimeout(tick, 200);
          }
          setTimeout(tick, 26);
        }
      }
      tick();
    });
  }

  // ---------- Counters ----------
  function initCounters() {
    var els = doc.querySelectorAll("[data-counter]");
    if (!els.length) return;
    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      els.forEach(function (el) { el.textContent = el.getAttribute("data-counter"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        animateCounter(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
  }

  function animateCounter(el) {
    var target = parseFloat(el.getAttribute("data-counter")) || 0;
    var dur = 1200;
    var start = performance.now();
    function frame(t) {
      var p = Math.min(1, (t - start) / dur);
      var eased = 1 - Math.pow(1 - p, 3);
      var v = Math.round(target * eased);
      el.textContent = v.toString();
      if (p < 1) requestAnimationFrame(frame);
      else el.textContent = target.toString();
    }
    requestAnimationFrame(frame);
  }

  // ---------- Tilt + spotlight ----------
  function initTilt() {
    var cards = doc.querySelectorAll("[data-tilt]");
    cards.forEach(function (card) {
      if (prefersReducedMotion) return;
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var x = e.clientX - r.left, y = e.clientY - r.top;
        var rx = ((y / r.height) - 0.5) * -8;
        var ry = ((x / r.width) - 0.5) * 10;
        card.style.transform = "rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg) translateZ(0)";
        card.style.setProperty("--mx", (x / r.width * 100) + "%");
        card.style.setProperty("--my", (y / r.height * 100) + "%");
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
        card.style.removeProperty("--mx");
        card.style.removeProperty("--my");
      });
    });
  }

  // ---------- Skill card spotlight ----------
  function initSkillSpotlight() {
    var cards = doc.querySelectorAll(".skill-card");
    cards.forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - r.left) / r.width * 100) + "%");
        card.style.setProperty("--my", ((e.clientY - r.top) / r.height * 100) + "%");
      });
    });
  }

  // ---------- Neural network background ----------
  function initNeural() {
    var canvas = doc.querySelector(".bg-neural");
    if (!canvas || !canvas.getContext) return;
    if (prefersReducedMotion) return;

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var nodes = [];
    var mouse = { x: -9999, y: -9999, active: false };
    var rafId = 0;

    function resize() {
      w = canvas.clientWidth = window.innerWidth;
      h = canvas.clientHeight = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seed();
    }

    function seed() {
      var area = w * h;
      var count = Math.max(36, Math.min(110, Math.floor(area / 16000)));
      nodes = new Array(count).fill(0).map(function () {
        return {
          x: Math.random() * w,
          y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.25,
          vy: (Math.random() - 0.5) * 0.25,
          r: 1 + Math.random() * 1.6,
          phase: Math.random() * Math.PI * 2,
        };
      });
    }

    function step() {
      ctx.clearRect(0, 0, w, h);

      // Read CSS variables for theme
      var theme = doc.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      var nodeColor = theme === "light" ? "rgba(85, 102, 255, 0.55)" : "rgba(124, 140, 255, 0.85)";
      var nodeColor2 = theme === "light" ? "rgba(26, 169, 201, 0.55)" : "rgba(89, 227, 255, 0.85)";
      var lineBase = theme === "light" ? "rgba(85, 102, 255," : "rgba(124, 140, 255,";

      var t = performance.now() * 0.001;

      // update
      for (var i = 0; i < nodes.length; i++) {
        var p = nodes[i];
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < -10) p.x = w + 10;
        if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10;
        if (p.y > h + 10) p.y = -10;

        // mouse repulsion / attraction
        if (mouse.active) {
          var dx = p.x - mouse.x;
          var dy = p.y - mouse.y;
          var d2 = dx * dx + dy * dy;
          if (d2 < 22000) {
            var d = Math.sqrt(d2) || 1;
            var f = (1 - d / 150) * 0.6;
            p.x += (dx / d) * f;
            p.y += (dy / d) * f;
          }
        }
      }

      // edges
      var maxDist = 130;
      for (var i = 0; i < nodes.length; i++) {
        var a = nodes[i];
        for (var j = i + 1; j < nodes.length; j++) {
          var b = nodes[j];
          var dx2 = a.x - b.x, dy2 = a.y - b.y;
          var d22 = dx2 * dx2 + dy2 * dy2;
          if (d22 < maxDist * maxDist) {
            var alpha = (1 - Math.sqrt(d22) / maxDist) * 0.42;
            ctx.strokeStyle = lineBase + alpha + ")";
            ctx.lineWidth = 0.6;
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.stroke();
          }
        }
      }

      // mouse link
      if (mouse.active) {
        for (var k = 0; k < nodes.length; k++) {
          var n = nodes[k];
          var ddx = n.x - mouse.x, ddy = n.y - mouse.y;
          var dd = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dd < 180) {
            var al = (1 - dd / 180) * 0.6;
            ctx.strokeStyle = lineBase + al + ")";
            ctx.lineWidth = 0.9;
            ctx.beginPath();
            ctx.moveTo(n.x, n.y);
            ctx.lineTo(mouse.x, mouse.y);
            ctx.stroke();
          }
        }
      }

      // nodes (with subtle pulse)
      for (var m = 0; m < nodes.length; m++) {
        var nd = nodes[m];
        var pulse = (Math.sin(t * 1.6 + nd.phase) + 1) * 0.5; // 0..1
        var rad = nd.r + pulse * 0.6;
        ctx.fillStyle = m % 5 === 0 ? nodeColor2 : nodeColor;
        ctx.beginPath();
        ctx.arc(nd.x, nd.y, rad, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(step);
    }

    function onMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }
    function onLeave() { mouse.active = false; }

    window.addEventListener("resize", debounce(resize, 150), { passive: true });
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseout", onLeave, { passive: true });

    // Visibility pause
    doc.addEventListener("visibilitychange", function () {
      if (doc.hidden) cancelAnimationFrame(rafId);
      else step();
    });

    resize();
    step();
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }
})();
