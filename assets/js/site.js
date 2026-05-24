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
    function closeMenu() { body.classList.remove("is-menu-open"); }
    function openMenu() { body.classList.add("is-menu-open"); }
    if (menuBtn) {
      menuBtn.addEventListener("click", function () {
        body.classList.toggle("is-menu-open");
      });
    }
    if (scrim) scrim.addEventListener("click", closeMenu);
    doc.querySelectorAll(".sidebar a").forEach(function (a) {
      a.addEventListener("click", closeMenu);
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
