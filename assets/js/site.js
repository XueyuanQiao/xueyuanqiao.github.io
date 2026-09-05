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
  var pageCleanups = [];

  // ========== Theme ==========
  function syncThemeEnvironment(theme) {
    root.setAttribute("data-theme", theme);
    root.style.colorScheme = theme;

    var themeColor = doc.querySelector('meta[name="theme-color"]');
    if (themeColor) {
      themeColor.content = themeColor.getAttribute("data-theme-color-" + theme) ||
        (theme === "light" ? "#eceff7" : "#0b1020");
    }

    var colorScheme = doc.querySelector('meta[name="color-scheme"]');
    if (colorScheme) colorScheme.content = theme;
  }

  function applyTheme(theme) {
    var t = theme === "light" ? "light" : "dark";
    syncThemeEnvironment(t);
    syncThemeToggle(t);
  }

  function syncThemeToggle(theme) {
    var btns = doc.querySelectorAll("[data-theme-toggle]");
    btns.forEach(function (btn) {
      var isLight = theme === "light";
      btn.setAttribute("aria-pressed", isLight ? "true" : "false");
      // 让屏幕阅读器读出"切换到亮/暗色"，更具行动指向性
      btn.setAttribute(
        "aria-label",
        isLight ? "切换到暗色模式" : "切换到亮色模式"
      );
    });
  }

  function initTheme() {
    var saved;
    try { saved = localStorage.getItem(STORE_KEY); } catch (e) {}
    // 默认暗色：仅在用户显式保存为 light 时使用亮色
    var theme = saved === "light" ? "light" : "dark";
    applyTheme(theme);
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

    // Mobile menu toggle
    var menuBtn = doc.querySelector(".menu-toggle");
    var scrim = doc.querySelector(".scrim");
    var sidebar = doc.querySelector(".sidebar");
    var main = doc.querySelector(".main");
    var fabRoot = doc.querySelector(".fab-top");
    function lockScroll(lock) {
      // 仅在窄屏时锁定 body，避免桌面模式被误锁
      if (window.innerWidth > 920) return;
      doc.documentElement.style.overflow = lock ? "hidden" : "";
      body.style.overflow = lock ? "hidden" : "";
    }
    function setInert(el, inert) {
      if (!el) return;
      if (inert) el.setAttribute("inert", "");
      else el.removeAttribute("inert");
    }
    function syncMenuA11y(open) {
      var isMobile = window.innerWidth <= 920;
      if (menuBtn) menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
      if (sidebar) {
        if (isMobile && !open) {
          sidebar.setAttribute("aria-hidden", "true");
          setInert(sidebar, true);
        } else {
          sidebar.removeAttribute("aria-hidden");
          setInert(sidebar, false);
        }
      }
      setInert(main, isMobile && open);
      setInert(fabRoot, isMobile && open);
    }
    function closeMenu(restoreFocus) {
      body.classList.remove("is-menu-open");
      if (scrim) scrim.setAttribute("aria-hidden", "true");
      lockScroll(false);
      syncMenuA11y(false);
      if (restoreFocus && menuBtn) menuBtn.focus();
    }
    function openMenu() {
      body.classList.add("is-menu-open");
      if (scrim) scrim.setAttribute("aria-hidden", "false");
      lockScroll(true);
      syncMenuA11y(true);
      var firstLink = sidebar && sidebar.querySelector(".nav a, .nav button");
      if (firstLink) requestAnimationFrame(function () { firstLink.focus(); });
    }
    if (menuBtn) {
      menuBtn.addEventListener("click", function () {
        if (body.classList.contains("is-menu-open")) closeMenu(true);
        else openMenu();
      });
    }
    if (scrim) scrim.addEventListener("click", function () { closeMenu(true); });
    doc.querySelectorAll(".sidebar a").forEach(function (a) {
      a.addEventListener("click", function () { closeMenu(false); });
    });
    doc.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && body.classList.contains("is-menu-open")) closeMenu(true);
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth > 920) closeMenu(false);
      else syncMenuA11y(body.classList.contains("is-menu-open"));
    });
    syncMenuA11y(false);

    // Theme toggle button(s)
    doc.querySelectorAll("[data-theme-toggle]").forEach(function (btn) {
      btn.addEventListener("click", toggleTheme);
    });
    // 初始挂载后再同步一次按钮状态（applyTheme 在 DOM 解析前就调用过）
    syncThemeToggle(root.getAttribute("data-theme") === "light" ? "light" : "dark");

    // Reading progress + back to top: share one rAF-throttled scroll handler.
    var progress = doc.querySelector(".read-progress");
    var hasNativeScrollTimeline = !!(window.CSS && CSS.supports && CSS.supports("animation-timeline", "scroll()"));
    var jsProgress = progress && !hasNativeScrollTimeline ? progress : null;
    var fab = doc.querySelector(".fab-top");
    if (jsProgress || fab) {
      var scrollTicking = false;
      var updateScrollUI = function () {
        var h = doc.documentElement;
        var scrolled = h.scrollTop || body.scrollTop;
        if (jsProgress) {
          var height = (h.scrollHeight - h.clientHeight) || 1;
          var ratio = Math.min(1, Math.max(0, scrolled / height));
          jsProgress.style.transform = "scaleX(" + ratio.toFixed(4) + ")";
        }
        if (fab) fab.classList.toggle("is-visible", scrolled > 400);
        scrollTicking = false;
      };
      window.addEventListener("scroll", function () {
        if (scrollTicking) return;
        scrollTicking = true;
        requestAnimationFrame(updateScrollUI);
      }, { passive: true });
      window.addEventListener("resize", updateScrollUI, { passive: true });
      updateScrollUI();
    }

    // Back to top
    if (fab) {
      fab.addEventListener("click", function () {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }

    // Command palette search: index is fetched only when the user opens it.
    initSearch(closeMenu);

    // Page-specific behaviors are safe to rerun after a PJAX content swap.
    runPageEnhancements(false);
    initPjax(main, closeMenu, updateScrollUI);
  });

  function runPageEnhancements(notifyPageModules) {
    while (pageCleanups.length) {
      try { pageCleanups.pop()(); } catch (e) {}
    }

    syncActiveNav();
    var revealCleanup = initReveal();
    if (revealCleanup) pageCleanups.push(revealCleanup);
    enhanceCodeBlocks();
    var articleCleanup = enhanceArticle();
    if (articleCleanup) pageCleanups.push(articleCleanup);
    var deferredVideoCleanup = initDeferredAutoplayVideos();
    if (deferredVideoCleanup) pageCleanups.push(deferredVideoCleanup);
    initArchivePagination();

    if (notifyPageModules !== false) {
      doc.dispatchEvent(new CustomEvent("aurora:page-ready", {
        detail: { url: location.href }
      }));
    }
  }

  function syncActiveNav() {
    var path = location.pathname.replace(/\/$/, "") || "/";
    var sectionPath = path;
    if (doc.querySelector(".article")) {
      sectionPath = path.indexOf("/about/") === 0 ? "/about.html" : "/archive.html";
    } else if (path.indexOf("/category") === 0) {
      sectionPath = "/cate.html";
    }

    doc.querySelectorAll(".nav a").forEach(function (a) {
      var href;
      try { href = new URL(a.href, location.href).pathname; }
      catch (e) { href = a.getAttribute("href") || ""; }
      href = href.replace(/\/$/, "") || "/";
      var current = href === sectionPath;
      if (!current && href !== "/" && path.indexOf(href) === 0) current = true;
      a.classList.toggle("is-active", current);
      if (current) a.setAttribute("aria-current", "page");
      else a.removeAttribute("aria-current");
    });
  }

  function initReveal() {
    var revealItems = Array.prototype.slice.call(doc.querySelectorAll(".post-card, .article, .page, .pagination, .hero, .link-category, .cate-cloud, .cate-list"));
    doc.querySelectorAll(".article-theme-water .article-content > h2, .article-theme-water .article-content > h3, .article-theme-water .article-content > blockquote, .article-theme-water .article-content > .post-video, .article-theme-water .article-content > .post-figure").forEach(function (el) {
      if (revealItems.indexOf(el) === -1) revealItems.push(el);
      el.classList.add("water-reveal");
    });
    doc.querySelectorAll(".article-theme-reflection .article-content > h2, .article-theme-reflection .reflection-evidence > *, .article-theme-reflection .reflection-timeline, .article-theme-reflection .reflection-stance, .article-theme-reflection .reflection-figure--absence, .article-theme-reflection .reflection-figure--water, .article-theme-reflection .reflection-ending").forEach(function (el) {
      if (revealItems.indexOf(el) === -1) revealItems.push(el);
      el.classList.add("reflection-reveal");
    });
    doc.querySelectorAll(".article-theme-ai-native .article-content > h2, .article-theme-ai-native .ai-native-context, .article-theme-ai-native .ai-native-verdict, .article-theme-ai-native .ai-native-checks, .article-theme-ai-native .ai-native-timeline, .article-theme-ai-native .ai-native-stats, .article-theme-ai-native .ai-native-curve, .article-theme-ai-native .ai-native-flow, .article-theme-ai-native .ai-native-thesis, .article-theme-ai-native .ai-native-irony").forEach(function (el) {
      if (revealItems.indexOf(el) === -1) revealItems.push(el);
      el.classList.add("ai-native-reveal");
    });
    revealItems.forEach(function (el) { el.classList.add("reveal"); });
    if (!("IntersectionObserver" in window)) {
      revealItems.forEach(function (el) { el.classList.add("is-in"); });
      return null;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: "0px 0px -40px 0px" });
    revealItems.forEach(function (el) { observer.observe(el); });
    return function () { observer.disconnect(); };
  }

  function initDeferredAutoplayVideos() {
    var videos = Array.prototype.slice.call(doc.querySelectorAll("video[data-autoplay-in-view]"));
    if (!videos.length) return null;

    function activate(video) {
      if (!video || video.getAttribute("data-media-loaded") === "true") return;
      video.setAttribute("data-media-loaded", "true");
      video.querySelectorAll("source[data-src]").forEach(function (source) {
        source.src = source.getAttribute("data-src") || "";
        source.removeAttribute("data-src");
      });
      try { video.load(); } catch (e) {}
      var promise;
      try { promise = video.play(); } catch (e) { return; }
      if (promise && promise.catch) promise.catch(function () {});
    }

    if (!("IntersectionObserver" in window)) {
      videos.forEach(activate);
      return null;
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        activate(entry.target);
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.01, rootMargin: "300px 0px" });

    videos.forEach(function (video) { observer.observe(video); });
    return function () { observer.disconnect(); };
  }

  function initPjax(main, closeMenu, updateScrollUI) {
    if (!main || !("fetch" in window) || !("pushState" in history) || !("DOMParser" in window)) return;

    var activeController = null;
    var navigationId = 0;
    var parser = new DOMParser();
    root.classList.add("pjax-enabled");

    function stateWithScroll(base) {
      var state = Object.assign({}, base || history.state || {});
      state.auroraPjax = true;
      state.scrollX = window.scrollX || 0;
      state.scrollY = window.scrollY || 0;
      return state;
    }

    history.replaceState(stateWithScroll(history.state), "", location.href);

    function isPjaxLink(link, target) {
      if (!link || !target || target.origin !== location.origin) return false;
      if (link.target || link.hasAttribute("download") || link.hasAttribute("data-no-pjax")) return false;
      if ((link.getAttribute("rel") || "").split(/\s+/).indexOf("external") !== -1) return false;
      if (/^(mailto:|tel:|javascript:)/i.test(link.getAttribute("href") || "")) return false;
      if (target.pathname.indexOf("/assets/") === 0) return false;
      var file = target.pathname.split("/").pop() || "";
      if (file.indexOf(".") !== -1 && !/\.html?$/i.test(file)) return false;
      if (target.pathname === location.pathname && target.search === location.search) return false;
      return true;
    }

    doc.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      var link = event.target.closest && event.target.closest("a[href]");
      if (!link) return;
      var target;
      try { target = new URL(link.href, location.href); } catch (e) { return; }
      if (!isPjaxLink(link, target)) return;
      event.preventDefault();
      navigate(target, { mode: "push", trigger: link });
    }, true);

    window.addEventListener("popstate", function (event) {
      navigate(new URL(location.href), {
        mode: "pop",
        scrollX: event.state && isFinite(event.state.scrollX) ? event.state.scrollX : 0,
        scrollY: event.state && isFinite(event.state.scrollY) ? event.state.scrollY : 0
      });
    });

    function navigate(target, options) {
      options = options || {};
      var id = ++navigationId;
      if (activeController) activeController.abort();
      activeController = new AbortController();

      if (options.mode === "push") {
        history.replaceState(stateWithScroll(history.state), "", location.href);
      }

      closePersistentOverlays();
      if (typeof closeMenu === "function") closeMenu(false);
      doc.body.classList.add("is-pjax-loading");
      main.setAttribute("aria-busy", "true");
      doc.dispatchEvent(new CustomEvent("aurora:before-navigation", {
        detail: { from: location.href, to: target.href }
      }));

      fetch(target.href, {
        signal: activeController.signal,
        credentials: "same-origin",
        headers: { "Accept": "text/html", "X-Aurora-PJAX": "1" }
      }).then(function (response) {
        var type = response.headers.get("content-type") || "";
        if (!response.ok || type.indexOf("text/html") === -1) throw new Error("Invalid PJAX response");
        return response.text();
      }).then(function (html) {
        if (id !== navigationId) return;
        var incoming = parser.parseFromString(html, "text/html");
        var incomingMain = incoming.querySelector("main#main");
        if (!incomingMain) throw new Error("Unsupported PJAX document");

        if (options.mode === "push") {
          history.pushState({ auroraPjax: true, scrollX: 0, scrollY: 0 }, "", target.href);
        }

        syncHead(incoming);
        doc.body.classList.toggle("is-landing", incoming.body.classList.contains("is-landing"));
        main.className = incomingMain.className;
        main.innerHTML = incomingMain.innerHTML;
        executeMainScripts(main);
        main.removeAttribute("aria-busy");

        runPageEnhancements();
        restoreScroll(target, options);
        if (typeof updateScrollUI === "function") updateScrollUI();

        main.setAttribute("tabindex", "-1");
        try { main.focus({ preventScroll: true }); } catch (e) { main.focus(); }
        window.requestAnimationFrame(function () {
          doc.body.classList.remove("is-pjax-loading");
        });
      }).catch(function (error) {
        if (error && error.name === "AbortError") return;
        location.assign(target.href);
      });
    }

    function closePersistentOverlays() {
      var dialog = doc.querySelector("[data-search-dialog]");
      if (dialog && dialog.open) {
        try { dialog.close(); } catch (e) { dialog.removeAttribute("open"); }
      }
      root.classList.remove("has-modal-open");
      doc.querySelectorAll(".lightbox").forEach(function (lightbox) { lightbox.remove(); });
    }

    function executeMainScripts(scope) {
      scope.querySelectorAll("script").forEach(function (oldScript) {
        var script = doc.createElement("script");
        Array.prototype.slice.call(oldScript.attributes).forEach(function (attribute) {
          script.setAttribute(attribute.name, attribute.value);
        });
        script.text = oldScript.textContent || "";
        oldScript.parentNode.replaceChild(script, oldScript);
      });
    }

    function restoreScroll(target, options) {
      if (target.hash) {
        var id;
        try { id = decodeURIComponent(target.hash.slice(1)); } catch (e) { id = target.hash.slice(1); }
        var anchor = id && doc.getElementById(id);
        if (anchor) {
          anchor.scrollIntoView();
          return;
        }
      }
      if (options.mode === "pop") window.scrollTo(options.scrollX || 0, options.scrollY || 0);
      else window.scrollTo(0, 0);
    }

    function syncHead(incoming) {
      doc.title = incoming.title || doc.title;
      var selectors = [
        'meta[name="description"]',
        'meta[name="keywords"]',
        'meta[name^="twitter:"]',
        'meta[property^="og:"]',
        'meta[property^="article:"]',
        'link[rel="canonical"]',
        'link[rel="prev"]',
        'link[rel="next"]',
        'script[type="application/ld+json"]'
      ];
      selectors.forEach(function (selector) {
        doc.head.querySelectorAll(selector).forEach(function (node) { node.remove(); });
        incoming.head.querySelectorAll(selector).forEach(function (node) {
          doc.head.appendChild(doc.importNode(node, true));
        });
      });
    }
  }

  function enhanceArticle() {
    var content = doc.querySelector('.article-content');
    if (!content) return null;
    var cleanupFns = [];

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
      var toggle = doc.querySelector('[data-toc-toggle]');

      function setTocCollapsed(collapsed) {
        tocEl.setAttribute('data-collapsed', collapsed ? 'true' : 'false');
        if (toggle) toggle.setAttribute('aria-expanded', collapsed ? 'false' : 'true');
      }

      // 页面可通过 front matter 指定默认折叠；移动端仍默认折叠以节省纵向空间
      var defaultCollapsed = tocEl.getAttribute('data-toc-default-collapsed') === 'true';
      var isNarrow = window.matchMedia && window.matchMedia('(max-width: 920px)').matches;
      setTocCollapsed(defaultCollapsed || Boolean(isNarrow));

      // 旋屏 / 缩放穿过断点时同步折叠状态，避免横屏 → 竖屏 TOC 还撑开
      // 仅在用户没手动 toggle 过时跟随断点（dataset.userToggled 由点击设置）
      if (window.matchMedia) {
        var mq = window.matchMedia('(max-width: 920px)');
        var onMq = function (e) {
          if (tocEl.dataset.userToggled === '1') return;
          setTocCollapsed(defaultCollapsed || e.matches);
        };
        if (mq.addEventListener) {
          mq.addEventListener('change', onMq);
          cleanupFns.push(function () { mq.removeEventListener('change', onMq); });
        } else if (mq.addListener) {
          mq.addListener(onMq);
          cleanupFns.push(function () { mq.removeListener(onMq); });
        }
      }

      // Spy active heading
      var links = tocEl.querySelectorAll('a');
      var byId = {};
      links.forEach(function (l) {
        byId[l.getAttribute('href').slice(1)] = l;
      });
      function setActiveToc(link) {
        links.forEach(function (l) {
          var active = l === link;
          l.classList.toggle('is-active', active);
          if (active) l.setAttribute('aria-current', 'location');
          else l.removeAttribute('aria-current');
        });
      }
      setActiveToc(byId[decodeURIComponent(location.hash.slice(1))] || links[0]);
      if ('IntersectionObserver' in window) {
        var spy = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            var link = byId[e.target.id];
            if (!link) return;
            if (e.isIntersecting) setActiveToc(link);
          });
        }, { rootMargin: '-30% 0px -65% 0px', threshold: 0 });
        headings.forEach(function (h) { spy.observe(h); });
        cleanupFns.push(function () { spy.disconnect(); });
      }

      // Collapse toggle
      if (toggle) {
        toggle.addEventListener('click', function () {
          var collapsed = tocEl.getAttribute('data-collapsed') === 'true';
          setTocCollapsed(!collapsed);
          // 标记用户已手动 toggle，避免后续断点变化覆盖用户选择
          tocEl.dataset.userToggled = '1';
        });
      }
    }

    // 4) Image lightbox + lazy loading
    var lb = null;
    var lbCloseTimer = 0;
    var lbTrigger = null;

    // The Mona Lisa portrait has its own lightweight petting interaction.
    var catPortrait = content.querySelector('[data-cat-interactive]');
    if (catPortrait) {
      var catFigure = catPortrait.closest('.post-figure--cat-portrait');
      var catResponse = catFigure && catFigure.querySelector('[data-cat-response]');
      var catMessages = ['喵～', '呼噜呼噜', '喵喵收到摸摸啦', '今天也陪着你'];
      var catMessageIndex = 0;
      var catTimers = [];
      var catStateTimer = 0;
      var catParticles = [
        { text: '♡', dx: -72, dy: -94, rotate: -18 },
        { text: '♥', dx: -34, dy: -122, rotate: 12 },
        { text: '✦', dx: 12, dy: -108, rotate: -8 },
        { text: '♡', dx: 54, dy: -92, rotate: 18 },
        { text: '🐾', dx: 82, dy: -58, rotate: 12 }
      ];

      var petCat = function (event) {
        if (event.type === 'keydown' && event.key !== 'Enter' && event.key !== ' ') return;
        event.preventDefault();
        event.stopPropagation();
        if (!catFigure) return;
        if (catStateTimer) window.clearTimeout(catStateTimer);

        var figureRect = catFigure.getBoundingClientRect();
        var imageRect = catPortrait.getBoundingClientRect();
        var pointerTriggered = typeof event.clientX === 'number' && event.clientX > 0;
        var originX = pointerTriggered
          ? event.clientX - figureRect.left
          : imageRect.left - figureRect.left + imageRect.width * 0.5;
        var originY = pointerTriggered
          ? event.clientY - figureRect.top
          : imageRect.top - figureRect.top + imageRect.height * 0.56;

        catPortrait.classList.remove('is-petted');
        catFigure.classList.remove('is-purring');
        window.requestAnimationFrame(function () {
          catPortrait.classList.add('is-petted');
          catFigure.classList.add('is-purring');
        });

        if (catResponse) {
          catResponse.textContent = catMessages[catMessageIndex % catMessages.length];
          catMessageIndex += 1;
          catResponse.classList.add('is-visible');
        }

        catParticles.forEach(function (particle, index) {
          var el = doc.createElement('span');
          el.className = 'cat-particle';
          el.setAttribute('aria-hidden', 'true');
          el.textContent = particle.text;
          el.style.setProperty('--cat-x', originX.toFixed(1) + 'px');
          el.style.setProperty('--cat-y', originY.toFixed(1) + 'px');
          el.style.setProperty('--cat-dx', particle.dx + 'px');
          el.style.setProperty('--cat-dy', particle.dy + 'px');
          el.style.setProperty('--cat-rotate', particle.rotate + 'deg');
          el.style.setProperty('--cat-delay', (index * 42) + 'ms');
          catFigure.appendChild(el);
          catTimers.push(window.setTimeout(function () { el.remove(); }, 1250));
        });

        catStateTimer = window.setTimeout(function () {
          catPortrait.classList.remove('is-petted');
          catFigure.classList.remove('is-purring');
          if (catResponse) catResponse.classList.remove('is-visible');
          catStateTimer = 0;
        }, 1050);
      };

      catPortrait.addEventListener('click', petCat);
      catPortrait.addEventListener('keydown', petCat);
      cleanupFns.push(function () {
        catPortrait.removeEventListener('click', petCat);
        catPortrait.removeEventListener('keydown', petCat);
        if (catStateTimer) window.clearTimeout(catStateTimer);
        catTimers.forEach(function (timer) { window.clearTimeout(timer); });
        if (catFigure) catFigure.querySelectorAll('.cat-particle').forEach(function (el) { el.remove(); });
      });
    }

    function ensureLightbox() {
      if (lb) return lb;
      lb = doc.createElement('dialog');
      lb.className = 'lightbox';
      lb.setAttribute('aria-label', '图片预览');
      lb.innerHTML =
        '<button class="lightbox-close" type="button" aria-label="关闭图片预览">' +
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>' +
        '</button>' +
        '<figure><img alt=""><figcaption></figcaption></figure>';
      doc.body.appendChild(lb);
      lb.querySelector('.lightbox-close').addEventListener('click', closeLightbox);
      lb.addEventListener('click', function (e) {
        if (e.target === lb) closeLightbox();
      });
      lb.addEventListener('cancel', function (e) {
        e.preventDefault();
        closeLightbox();
      });
      return lb;
    }

    function openLightbox(img) {
      var dialog = ensureLightbox();
      clearTimeout(lbCloseTimer);
      lbTrigger = img;
      var inner = dialog.querySelector('img');
      var caption = dialog.querySelector('figcaption');
      dialog.dataset.theme = img.getAttribute('data-lightbox-theme') || '';
      inner.src = img.currentSrc || img.src;
      inner.alt = img.alt || '';
      caption.textContent = img.alt || '';
      caption.hidden = !img.alt;
      if (!dialog.open && dialog.showModal) dialog.showModal();
      else dialog.setAttribute('open', '');
      root.classList.add('has-modal-open');
      requestAnimationFrame(function () { dialog.classList.add('is-open'); });
    }

    function closeLightbox() {
      if (!lb || !lb.open) return;
      lb.classList.remove('is-open');
      root.classList.remove('has-modal-open');
      lbCloseTimer = setTimeout(function () {
        if (lb.open && lb.close) lb.close();
        else lb.removeAttribute('open');
        if (lbTrigger) lbTrigger.focus();
      }, 320);
    }

    content.querySelectorAll('img').forEach(function (img) {
      // 性能优化：默认懒加载、异步解码（首屏图除外，避免 LCP 倒退）
      var rect = img.getBoundingClientRect();
      var inViewport = rect.top < (window.innerHeight || 0) && rect.bottom > 0;
      if (!img.hasAttribute('loading') && !inViewport) img.setAttribute('loading', 'lazy');
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');

      // 链接中的图片保留原链接语义，不接管点击。
      if (img.closest('a')) return;
      if (img.hasAttribute('data-cat-interactive')) return;
      img.classList.add('image-zoom');
      img.setAttribute('tabindex', '0');
      img.setAttribute('role', 'button');
      img.setAttribute('aria-haspopup', 'dialog');
      img.setAttribute('aria-label', img.alt ? ('查看大图：' + img.alt) : '查看大图');
      img.addEventListener('click', function () {
        openLightbox(img);
      });
      img.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          openLightbox(img);
        }
      });
    });
    var onLightboxKeydown = function (e) {
      if (e.key === 'Escape' && lb && lb.open) {
        e.preventDefault();
        closeLightbox();
      }
    };
    doc.addEventListener('keydown', onLightboxKeydown);
    cleanupFns.push(function () { doc.removeEventListener('keydown', onLightboxKeydown); });

    return function () {
      clearTimeout(lbCloseTimer);
      while (cleanupFns.length) cleanupFns.pop()();
      if (lb) lb.remove();
    };
  }

  // ========== Archive pagination (文章库分页) ==========
  // 客户端分页：一次渲染全部卡片，按每页 10/20/50 显示，支持翻页。
  function initArchivePagination() {
    var root = doc.querySelector('[data-archive]');
    if (!root) return;

    var list = root.querySelector('[data-archive-list]');
    var pager = root.querySelector('[data-archive-pager]');
    var summary = root.querySelector('[data-archive-summary]');
    var select = root.querySelector('[data-page-size]');
    if (!list || !pager) return;

    var items = Array.prototype.slice.call(list.querySelectorAll('[data-post-item]'));
    var total = items.length;
    var ALLOWED = [10, 20, 50];
    var STORE_KEY = 'aurora-archive-pagesize';

    // 初始每页数量：localStorage 记忆 → 默认 10
    var pageSize = 10;
    try {
      var saved = parseInt(localStorage.getItem(STORE_KEY), 10);
      if (ALLOWED.indexOf(saved) !== -1) pageSize = saved;
    } catch (e) {}
    if (select) select.value = String(pageSize);

    var page = 1;

    function totalPages() {
      return Math.max(1, Math.ceil(total / pageSize));
    }

    function clampPage() {
      var max = totalPages();
      if (page > max) page = max;
      if (page < 1) page = 1;
    }

    function render() {
      clampPage();
      var start = (page - 1) * pageSize;
      var end = start + pageSize;

      for (var i = 0; i < total; i++) {
        items[i].hidden = (i < start || i >= end);
      }

      if (summary) {
        if (total === 0) {
          summary.textContent = '共 0 篇';
        } else {
          var from = start + 1;
          var to = Math.min(end, total);
          summary.textContent = '共 ' + total + ' 篇 · 第 ' + from + '–' + to + ' 篇';
        }
      }

      renderPager();
    }

    function makeBtn(label, targetPage, opts) {
      opts = opts || {};
      var el;
      if (opts.current) {
        el = doc.createElement('em');
        el.setAttribute('aria-current', 'page');
      } else if (opts.disabled) {
        el = doc.createElement('span');
        el.setAttribute('aria-disabled', 'true');
      } else {
        el = doc.createElement('a');
        el.href = '#';
        el.addEventListener('click', function (ev) {
          ev.preventDefault();
          page = targetPage;
          render();
          // 翻页后滚动到列表顶部，避免停在页面底部
          var top = root.getBoundingClientRect().top + window.pageYOffset - 80;
          window.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
        });
      }
      if (opts.ellipsis) el.classList.add('is-ellipsis');
      el.textContent = label;
      return el;
    }

    // 计算要显示的页码（首尾 + 当前页附近，过多则省略）
    function pageWindow(max) {
      var pages = [];
      if (max <= 7) {
        for (var i = 1; i <= max; i++) pages.push(i);
        return pages;
      }
      pages.push(1);
      var lo = Math.max(2, page - 1);
      var hi = Math.min(max - 1, page + 1);
      if (lo > 2) pages.push('…');
      for (var j = lo; j <= hi; j++) pages.push(j);
      if (hi < max - 1) pages.push('…');
      pages.push(max);
      return pages;
    }

    function renderPager() {
      var max = totalPages();
      pager.innerHTML = '';

      // 只有一页时隐藏分页器
      if (max <= 1) {
        pager.hidden = true;
        return;
      }
      pager.hidden = false;

      pager.appendChild(makeBtn('‹ 上一页', page - 1, { disabled: page === 1 }));

      pageWindow(max).forEach(function (p) {
        if (p === '…') {
          pager.appendChild(makeBtn('…', 0, { disabled: true, ellipsis: true }));
        } else {
          pager.appendChild(makeBtn(String(p), p, { current: p === page }));
        }
      });

      pager.appendChild(makeBtn('下一页 ›', page + 1, { disabled: page === max }));
    }

    if (select) {
      select.addEventListener('change', function () {
        var v = parseInt(select.value, 10);
        if (ALLOWED.indexOf(v) === -1) v = 10;
        pageSize = v;
        page = 1;
        try { localStorage.setItem(STORE_KEY, String(v)); } catch (e) {}
        render();
      });
    }

    render();
  }

  // ========== Command palette search ==========
  function initSearch(closeMenu) {
    var dialog = doc.querySelector('[data-search-dialog]');
    var input = doc.querySelector('[data-search-input]');
    var results = doc.querySelector('[data-search-results]');
    var status = doc.querySelector('[data-search-status]');
    var closeBtn = doc.querySelector('[data-search-close]');
    var openBtns = doc.querySelectorAll('[data-search-open]');
    if (!dialog || !input || !results || !openBtns.length) return;

    var indexUrl = dialog.getAttribute('data-index-url');
    var posts = null;
    var loadPromise = null;
    var visible = [];
    var active = -1;
    var lastTrigger = null;
    var isMac = /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent || '');

    doc.querySelectorAll('[data-search-shortcut]').forEach(function (kbd) {
      kbd.textContent = isMac ? '⌘ K' : 'Ctrl K';
    });

    function loadIndex() {
      if (posts) return Promise.resolve(posts);
      if (loadPromise) return loadPromise;
      loadPromise = fetch(indexUrl).then(function (response) {
        if (!response.ok) throw new Error('HTTP ' + response.status);
        return response.json();
      }).then(function (data) {
        posts = ((data && data.posts) || []).slice().sort(function (a, b) {
          return String(b.date || '').localeCompare(String(a.date || ''));
        });
        return posts;
      });
      return loadPromise;
    }

    function openSearch() {
      if (dialog.open) return;
      lastTrigger = doc.activeElement;
      if (typeof dialog.showModal === 'function') dialog.showModal();
      else dialog.setAttribute('open', '');
      root.classList.add('has-modal-open');
      if (typeof closeMenu === 'function') closeMenu(false);
      results.innerHTML = '<div class="search-empty">正在加载文章索引…</div>';
      if (status) status.textContent = '';
      requestAnimationFrame(function () { input.focus(); });

      loadIndex().then(function () {
        renderResults(input.value);
      }).catch(function () {
        results.innerHTML = '<div class="search-empty">搜索索引加载失败，请稍后重试。</div>';
        if (status) status.textContent = '';
      });
    }

    function closeSearch() {
      if (typeof dialog.close === 'function' && dialog.open) dialog.close();
      else dialog.removeAttribute('open');
      root.classList.remove('has-modal-open');
      active = -1;
      input.removeAttribute('aria-activedescendant');
    }

    function scorePost(post, query) {
      if (!query) return 1;
      var title = String(post.title || '').toLowerCase();
      var excerpt = String(post.excerpt || '').toLowerCase();
      var categories = (post.categories || []).join(' ').toLowerCase();
      var score = 0;
      if (title.indexOf(query) === 0) score += 100;
      else if (title.indexOf(query) !== -1) score += 60;
      if (categories.indexOf(query) !== -1) score += 30;
      if (excerpt.indexOf(query) !== -1) score += 10;
      return score;
    }

    function renderResults(value) {
      if (!posts) return;
      var query = String(value || '').trim().toLowerCase();
      visible = posts.map(function (post) {
        return { post: post, score: scorePost(post, query) };
      }).filter(function (item) {
        return item.score > 0;
      }).sort(function (a, b) {
        if (a.score !== b.score) return b.score - a.score;
        return String(b.post.date || '').localeCompare(String(a.post.date || ''));
      }).slice(0, 8).map(function (item) { return item.post; });

      active = -1;
      input.removeAttribute('aria-activedescendant');
      if (!visible.length) {
        results.innerHTML = '<div class="search-empty">没有找到相关文章。</div>';
        if (status) status.textContent = '0 条结果';
        return;
      }

      results.innerHTML = visible.map(function (post, index) {
        var categories = (post.categories || []).map(function (category) {
          return '<span>#' + escapeHTML(category) + '</span>';
        }).join('');
        return '<a class="search-result" id="search-result-' + index + '" role="option" aria-selected="false" href="' + escapeHTML(post.url || '#') + '">' +
          '<span class="search-result__title">' + escapeHTML(post.title || '') + '</span>' +
          '<time class="search-result__date">' + escapeHTML(post.date || '') + '</time>' +
          '<p class="search-result__excerpt">' + escapeHTML(post.excerpt || '') + '</p>' +
          '<span class="search-result__meta">' + categories + '</span>' +
          '</a>';
      }).join('');
      if (status) status.textContent = (query ? visible.length + ' 条匹配结果' : '最近更新的 ' + visible.length + ' 篇文章');
    }

    function setActive(next) {
      if (!visible.length) return;
      active = (next + visible.length) % visible.length;
      var options = results.querySelectorAll('.search-result');
      options.forEach(function (option, index) {
        var selected = index === active;
        option.classList.toggle('is-active', selected);
        option.setAttribute('aria-selected', selected ? 'true' : 'false');
        if (selected) option.scrollIntoView({ block: 'nearest' });
      });
      input.setAttribute('aria-activedescendant', 'search-result-' + active);
    }

    openBtns.forEach(function (button) { button.addEventListener('click', openSearch); });
    if (closeBtn) closeBtn.addEventListener('click', closeSearch);
    input.addEventListener('input', function () { renderResults(input.value); });
    results.addEventListener('mouseover', function (event) {
      var option = event.target.closest && event.target.closest('.search-result');
      if (!option) return;
      var index = parseInt(option.id.replace('search-result-', ''), 10);
      if (!isNaN(index)) setActive(index);
    });
    dialog.addEventListener('click', function (event) {
      if (event.target === dialog) closeSearch();
    });
    dialog.addEventListener('close', function () {
      root.classList.remove('has-modal-open');
      var fallback = window.innerWidth <= 920 ? doc.querySelector('.menu-toggle') : lastTrigger;
      if (fallback && !fallback.closest('[inert]')) {
        requestAnimationFrame(function () { fallback.focus(); });
      }
    });

    doc.addEventListener('keydown', function (event) {
      var target = event.target;
      var typing = target && (target.matches('input, textarea, select') || target.isContentEditable);
      var shortcut = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k';
      var slash = !typing && !event.metaKey && !event.ctrlKey && !event.altKey && event.key === '/';
      if (shortcut || slash) {
        event.preventDefault();
        if (dialog.open) closeSearch();
        else openSearch();
        return;
      }
      if (!dialog.open) return;
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        setActive(active + 1);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        setActive(active < 0 ? visible.length - 1 : active - 1);
      } else if (event.key === 'Enter' && visible[active >= 0 ? active : 0]) {
        event.preventDefault();
        location.href = visible[active >= 0 ? active : 0].url;
      } else if (event.key === 'Escape') {
        event.preventDefault();
        closeSearch();
      }
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
   Ambient click feedback
   Mouse-only, theme-aware effects for non-interactive page areas.
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)");
  var interactiveSelector = [
    "a",
    "button",
    "input",
    "select",
    "textarea",
    "label",
    "summary",
    "audio",
    "video",
    "iframe",
    "object",
    "embed",
    "dialog",
    "[contenteditable]:not([contenteditable='false'])",
    "[draggable='true']",
    "[onclick]",
    "[tabindex]:not([tabindex='-1'])",
    "[role='button']",
    "[role='link']",
    "[role='menuitem']",
    "[role='option']",
    "[role='tab']",
    "[role='checkbox']",
    "[role='radio']",
    "[role='switch']",
    "[role='slider']",
    "[data-no-click-effect]",
    "[data-music-player]",
    "[data-cat-interactive]",
    ".skill-card",
    ".lightbox",
    ".scrim"
  ].join(",");
  var variants = ["ripple", "burst", "orbit"];

  function hasInteractiveCursor(target) {
    var el = target;
    while (el && el !== doc.body) {
      var cursor = window.getComputedStyle(el).cursor;
      if (/^(pointer|grab|grabbing|move|[nesw-]+resize|col-resize|row-resize)$/.test(cursor)) {
        return true;
      }
      el = el.parentElement;
    }
    return false;
  }

  function isInteractiveTarget(target) {
    if (!target || target.nodeType !== 1) return true;
    return !!target.closest(interactiveSelector) || hasInteractiveCursor(target);
  }

  function createParticle(index, variant) {
    var particle = doc.createElement("i");
    var step = 360 / 6;
    var jitter = variant === "orbit" ? 0 : (Math.random() * 14 - 7);
    particle.className = "click-bloom__particle";
    particle.style.setProperty("--particle-angle", (index * step + jitter) + "deg");
    particle.style.setProperty("--particle-distance", (18 + Math.random() * 13) + "px");
    particle.style.setProperty("--particle-delay", Math.round(Math.random() * 34) + "ms");
    particle.style.setProperty("--particle-size", (1.5 + Math.random() * 1.5) + "px");
    return particle;
  }

  function showClickEffect(x, y) {
    var variant = variants[Math.floor(Math.random() * variants.length)];
    var tone = 1 + Math.floor(Math.random() * 3);
    var effect = doc.createElement("span");
    var ring = doc.createElement("i");

    effect.className = "click-bloom click-bloom--" + variant + " click-bloom--tone-" + tone;
    effect.setAttribute("aria-hidden", "true");
    effect.style.setProperty("--click-x", x + "px");
    effect.style.setProperty("--click-y", y + "px");
    effect.style.setProperty("--click-rotation", Math.round(Math.random() * 90 - 45) + "deg");

    ring.className = "click-bloom__ring";
    effect.appendChild(ring);
    for (var i = 0; i < 6; i++) effect.appendChild(createParticle(i, variant));

    doc.body.appendChild(effect);
    effect.addEventListener("animationend", function (event) {
      if (event.target === effect) effect.remove();
    });
    window.setTimeout(function () { effect.remove(); }, 1100);
  }

  doc.addEventListener("pointerdown", function (event) {
    if (event.button !== 0 || event.pointerType !== "mouse") return;
    if (reduceMotion && reduceMotion.matches) return;
    if (isInteractiveTarget(event.target)) return;
    showClickEffect(event.clientX, event.clientY);
  }, { passive: true });
})();

/* ==========================================================================
   Global background music player
   Native Audio + Pointer-friendly ranges + Media Session
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var STORE_VOLUME = "aurora-music-volume";
  var STORE_DOCK_POSITION = "aurora-music-dock-position-v5";
  var SESSION_TIME = "aurora-music-time";
  var SESSION_PLAYING = "aurora-music-playing";
  var SESSION_TRACK = "aurora-music-track";
  var SESSION_USER_PAUSED = "aurora-music-user-paused";
  var SESSION_EXPAND_ON_ARRIVAL = "aurora-music-expand-on-arrival";
  var UNIVERSE_ARRIVAL_MAX_AGE = 120000;

  function ready(fn) {
    if (doc.readyState !== "loading") fn();
    else doc.addEventListener("DOMContentLoaded", fn);
  }

  ready(function initMusicPlayer() {
    var dock = doc.querySelector("[data-music-player]");
    if (!dock) return;

    var audio = dock.querySelector("[data-music-audio]");
    var toggle = dock.querySelector("[data-music-toggle]");
    var previous = dock.querySelector("[data-music-prev]");
    var next = dock.querySelector("[data-music-next]");
    var collapse = dock.querySelector("[data-music-collapse]");
    var edgeToggle = dock.querySelector("[data-music-edge]");
    var dragHandle = dock.querySelector("[data-music-drag-handle]");
    var queueToggle = dock.querySelector("[data-music-queue-toggle]");
    var seek = dock.querySelector("[data-music-seek]");
    var currentEl = dock.querySelector("[data-music-current]");
    var durationEl = dock.querySelector("[data-music-duration]");
    var statusEl = dock.querySelector("[data-music-status]");
    var titleEl = dock.querySelector("[data-music-title]");
    var cacheStatusEl = dock.querySelector("[data-music-cache-status]");
    var dockStatusEl = dock.querySelector("[data-music-dock-status]");
    var mute = dock.querySelector("[data-music-mute]");
    var volume = dock.querySelector("[data-music-volume]");
    var canvas = dock.querySelector("[data-music-visualizer]");
    var trackButtons = Array.prototype.slice.call(dock.querySelectorAll("[data-music-track]"));
    var tracks = trackButtons.map(function (button) {
      return {
        title: button.getAttribute("data-track-title") || "Untitled",
        src: button.getAttribute("data-track-src") || "",
        duration: button.getAttribute("data-track-duration") || "0:00"
      };
    });
    if (!audio || !toggle || !seek || !tracks.length) return;

    var seeking = false;
    var frameId = 0;
    var lastPositionUpdate = 0;
    var audioContext = null;
    var audioSource = null;
    var audioCapture = null;
    var silentGain = null;
    var audioGraphPromise = null;
    var analyser = null;
    var frequencyData = null;
    var canvasContext = canvas && canvas.getContext ? canvas.getContext("2d") : null;
    var reducedMotionQuery = window.matchMedia ? window.matchMedia("(prefers-reduced-motion: reduce)") : null;
    var reducedMotion = Boolean(reducedMotionQuery && reducedMotionQuery.matches);
    var dragPointerId = null;
    var dragStart = null;
    var dragFrameId = 0;
    var suppressedEdgeDragControl = null;
    var suppressEdgeDragClickTimer = 0;
    var isAutoDocked = false;
    var dockResizeTimer = 0;
    var dockMotionAnimation = null;
    var dockHeadAnimation = null;
    var dockDetailsAnimation = null;
    var dockMotionGeneration = 0;
    var visualizerResizeTimer = 0;
    var visualizerWidth = 0;
    var visualizerHeight = 0;
    var lastProgressPaint = 0;
    var lastVisualizerPaint = 0;
    var isPageLeaving = false;
    var leavingPlaybackIntent = null;
    var resumeAfterNavigation = false;
    var resumeAttempted = false;
    var audioLoadRetries = 0;
    var audioLoadRetryTimer = 0;
    var currentTrackIndex = Math.round(readNumber(sessionStorage, SESSION_TRACK, 0, 0, tracks.length - 1));
    var restoreTimeOnMetadata = true;
    var pendingTrackAutoplay = false;
    var isTrackSwitching = false;
    var musicWorkerRegistration = null;
    var currentTrackCached = false;
    var cacheRequests = {};
    var cacheStatusTimer = 0;
    var embeddedVideoFrames = [];
    var embeddedVideoPauseBound = false;
    var videoPauseStatusTimer = 0;
    var shouldAutoplayOnHome = false;
    var expandOnUniverseArrival = false;
    var safePlaybackRequested = false;
    var safePlaybackContinuation = false;
    var safePlaybackAutoplay = false;
    var safeBufferTimer = 0;
    var safeBufferSamples = [];
    var canPlayThrough = false;
    var isBufferingPause = false;
    var isRecoveryBuffering = false;
    var autoplayBlocked = false;
    var autoplayGestureBound = false;
    var isSilentPriming = false;
    var primeStartTime = 0;
    var primeRestoreMuted = false;
    var silentPrimeGeneration = 0;
    var primeFinishTimer = 0;
    var lastNativePlayAttemptAt = 0;
    var desiredMuted = false;

    if (reducedMotionQuery) {
      var syncReducedMotion = function (event) {
        reducedMotion = Boolean(event.matches);
        if (reducedMotion) {
          cancelDockMotion();
          settleDockLayout(false, true);
          drawIdleVisualizer();
        } else {
          scheduleVisualizerResize(0);
        }
      };
      if (typeof reducedMotionQuery.addEventListener === "function") {
        reducedMotionQuery.addEventListener("change", syncReducedMotion);
      } else if (typeof reducedMotionQuery.addListener === "function") {
        reducedMotionQuery.addListener(syncReducedMotion);
      }
    }

    // 默认不自动播放：只在用户此前已经点过播放、且是同一次会话内跳页时续播。
    // shouldAutoplayOnHome 恒为 false，保留变量以便日后需要时重新开启首页自动播放。
    try {
      resumeAfterNavigation = sessionStorage.getItem(SESSION_PLAYING) === "1";
    } catch (e) {
      resumeAfterNavigation = false;
    }
    expandOnUniverseArrival = consumeUniverseArrivalIntent();

    // The universe page has already warmed the browser's HTTP media cache when
    // possible. After the full document load gate, the blog attaches the same
    // URL and still waits for an adaptive safety buffer before audible playback.
    audio.pause();
    audio.loop = false;
    audio.preload = "auto";
    syncTrackUI();
    audio.volume = readNumber(localStorage, STORE_VOLUME, 0.72, 0, 1);
    desiredMuted = audio.volume === 0;
    audio.muted = desiredMuted;
    if (volume) volume.value = String(audio.volume);
    setVolumePaint(audio.volume);
    initMusicCache();
    initEmbeddedVideoPause();
    doc.addEventListener("aurora:page-ready", initEmbeddedVideoPause);
    doc.addEventListener("aurora:page-ready", function () {
      syncDockForCurrentPage(false);
    });
    syncDockExpansionForCurrentPage();

    toggle.addEventListener("click", function () {
      if (safePlaybackRequested) {
        setUserPaused(true);
        cancelSafePlayback();
      } else if (audio.paused) {
        setUserPaused(false);
        playAudio(false, false);
      } else {
        setUserPaused(true);
        audio.pause();
      }
    });

    doc.addEventListener("click", function (event) {
      var playButton = event.target.closest && event.target.closest("[data-music-play]");
      if (playButton) {
        if (dock.classList.contains("is-edge-docked")) releaseDockFromEdge();
        setCollapsed(false);
        setUserPaused(false);
        playAudio(false, false);
        window.setTimeout(function () { toggle.focus({ preventScroll: true }); }, 0);
        return;
      }

      var queueButton = event.target.closest && event.target.closest("[data-music-queue-open]");
      if (queueButton) {
        if (dock.classList.contains("is-edge-docked")) releaseDockFromEdge();
        setCollapsed(false);
        setQueueOpen(true);
        window.setTimeout(function () {
          if (queueToggle) queueToggle.focus({ preventScroll: true });
        }, 0);
      }
    });

    if (collapse) {
      collapse.addEventListener("click", function () {
        setCollapsed(!dock.classList.contains("is-collapsed"));
      });
    }

    if (edgeToggle) {
      edgeToggle.addEventListener("click", function () {
        if (dock.classList.contains("is-edge-docked")) releaseDockFromEdge();
        else dockToNearestEdge();
      });
      edgeToggle.addEventListener("keydown", function (event) {
        if (!dock.classList.contains("is-edge-docked")) return;
        if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Home", "End"].indexOf(event.key) === -1) return;
        event.preventDefault();
        moveEdgeDockWithKeyboard(event.key, event.shiftKey);
      });
    }

    if (previous) {
      previous.addEventListener("click", function () {
        if (audio.currentTime > 3) {
          audio.currentTime = 0;
          updateProgress(true);
          savePosition();
          return;
        }
        switchTrack((currentTrackIndex - 1 + tracks.length) % tracks.length, !audio.paused);
      });
    }

    if (next) {
      next.addEventListener("click", function () {
        switchTrack((currentTrackIndex + 1) % tracks.length, !audio.paused);
      });
    }

    if (queueToggle) {
      queueToggle.addEventListener("click", function () {
        setQueueOpen(!dock.classList.contains("is-queue-open"));
      });
    }

    trackButtons.forEach(function (button) {
      button.addEventListener("click", function () {
        var index = parseInt(button.getAttribute("data-track-index"), 10);
        if (!isFinite(index)) return;
        setCollapsed(false);
        switchTrack(index, true);
      });
    });

    seek.addEventListener("pointerdown", function () { seeking = true; });
    seek.addEventListener("input", function () {
      seeking = true;
      seekToRange();
    });
    seek.addEventListener("change", function () {
      seekToRange();
      seeking = false;
    });
    window.addEventListener("pointerup", function () { seeking = false; }, { passive: true });

    if (volume) {
      volume.addEventListener("input", function () {
        var next = clamp(parseFloat(volume.value), 0, 1);
        audio.volume = next;
        desiredMuted = next === 0;
        if (isSilentPriming) {
          primeRestoreMuted = desiredMuted;
          audio.muted = true;
        } else {
          audio.muted = desiredMuted;
        }
        setVolumePaint(next);
        syncMute();
        try { localStorage.setItem(STORE_VOLUME, String(next)); } catch (e) {}
      });
    }

    if (mute) {
      mute.addEventListener("click", function () {
        desiredMuted = !desiredMuted;
        if (isSilentPriming) {
          primeRestoreMuted = desiredMuted;
          audio.muted = true;
        } else {
          audio.muted = desiredMuted;
        }
        syncMute();
      });
    }

    var metadataReady = function () {
      var savedTime = restoreTimeOnMetadata
        ? readNumber(sessionStorage, SESSION_TIME, 0, 0, Math.max(0, audio.duration - 0.25))
        : 0;
      restoreTimeOnMetadata = false;
      if (savedTime > 0 && isFinite(audio.duration)) audio.currentTime = savedTime;
      updateProgress(true);
      setupMediaSession();
      queryCurrentTrackCache();
      var shouldPlaySelectedTrack = pendingTrackAutoplay;
      pendingTrackAutoplay = false;
      isTrackSwitching = false;
      if (safePlaybackRequested) scheduleSafeBufferCheck(0);
      else if (shouldPlaySelectedTrack) playAudio(false, false);
    };

    audio.addEventListener("loadedmetadata", metadataReady);

    audio.addEventListener("durationchange", function () { updateProgress(true); });
    audio.addEventListener("progress", function () {
      updateBuffered();
      recordSafeBufferSample();
      if (safePlaybackRequested) scheduleSafeBufferCheck(0);
      maybeCacheCurrentTrack();
    });
    audio.addEventListener("canplaythrough", function () {
      canPlayThrough = true;
      recordSafeBufferSample();
      if (safePlaybackRequested) scheduleSafeBufferCheck(0);
    });
    audio.addEventListener("loadeddata", function () {
      if (safePlaybackRequested) scheduleSafeBufferCheck(0);
    });
    audio.addEventListener("timeupdate", function () {
      if (!seeking) updateProgress(false);
      if (isSilentPriming && safePlaybackRequested) scheduleSafeBufferCheck(0);
      else if (!safePlaybackRequested && !audio.paused && (desiredMuted || !audio.muted) && !dock.classList.contains("is-playing")) {
        markAudiblePlaybackStarted();
      }
    });
    audio.addEventListener("play", function () {
      if (isSilentPriming) {
        dock.classList.add("is-buffering");
        dock.classList.remove("is-playing", "is-error", "is-resume-pending");
        toggle.setAttribute("aria-label", "取消连续播放缓冲");
        toggle.setAttribute("aria-pressed", "false");
        scheduleSafeBufferCheck(0);
        return;
      }
      markAudiblePlaybackStarted();
    });
    audio.addEventListener("playing", function () {
      if (!isSilentPriming) markAudiblePlaybackStarted();
    });

    function markAudiblePlaybackStarted() {
      if (isSilentPriming || audio.paused) return;
      if (!isPageLeaving) leavingPlaybackIntent = null;
      resumeAfterNavigation = false;
      resumeAttempted = true;
      autoplayBlocked = false;
      unbindAutoplayGesture();
      clearSafeBufferTimer();
      safePlaybackRequested = false;
      isRecoveryBuffering = false;
      dock.classList.add("is-playing");
      dock.classList.remove("is-error", "is-resume-pending", "is-buffering");
      if (statusEl) statusEl.textContent = defaultStatusText();
      toggle.setAttribute("aria-label", "暂停背景音乐");
      toggle.setAttribute("aria-pressed", "true");
      setUserPaused(false);
      setPlaybackIntent(true);
      queryCurrentTrackCache();
      maybeCacheCurrentTrack();
      if (navigator.mediaSession) navigator.mediaSession.playbackState = "playing";
      startRenderLoop();
    }
    audio.addEventListener("pause", function () {
      dock.classList.remove("is-playing");
      if (statusEl && !dock.classList.contains("is-resume-pending") && !dock.classList.contains("is-video-paused") && !dock.classList.contains("is-buffering")) {
        statusEl.textContent = defaultStatusText();
      }
      toggle.setAttribute("aria-label", "播放背景音乐");
      toggle.setAttribute("aria-pressed", "false");
      if (!isPageLeaving && !isTrackSwitching && !isBufferingPause) setPlaybackIntent(false);
      if (navigator.mediaSession) navigator.mediaSession.playbackState = "paused";
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      drawIdleVisualizer();
      if (!isTrackSwitching) savePosition();
    });
    audio.addEventListener("ended", function () {
      if (isSilentPriming) {
        finishSilentPriming();
        return;
      }
      if (currentTrackIndex < tracks.length - 1) {
        switchTrack(currentTrackIndex + 1, true);
        return;
      }
      finishPlaylistPlayback();
    });
    audio.addEventListener("waiting", function () {
      if (isSilentPriming) {
        if (safePlaybackRequested) scheduleSafeBufferCheck(360);
        return;
      }
      if (audio.paused || audio.ended || safePlaybackRequested) return;
      var now = window.performance && performance.now ? performance.now() : Date.now();
      if (now - lastNativePlayAttemptAt < 700 && bufferedAheadSeconds() >= 4) return;
      isBufferingPause = true;
      isRecoveryBuffering = true;
      safeBufferSamples = [];
      canPlayThrough = false;
      audio.pause();
      isBufferingPause = false;
      playAudio(true, false);
    });
    audio.addEventListener("error", function () {
      if (resumeAfterNavigation && audioLoadRetries < 3) {
        retryAudioLoad();
        return;
      }
      isTrackSwitching = false;
      dock.classList.add("is-error");
      toggle.setAttribute("aria-label", "音频加载失败，请稍后重试");
      setPlaybackIntent(false);
    });

    window.addEventListener("pagehide", function () {
      isPageLeaving = true;
      var currentIntent = hasPlaybackIntent();
      if (leavingPlaybackIntent === null || currentIntent) leavingPlaybackIntent = currentIntent;
      persistPlaybackSession(leavingPlaybackIntent);
    });

    // Mark same-tab internal navigation early so a browser-generated pause
    // event during teardown cannot overwrite the intention to keep playing.
    doc.addEventListener("click", function (event) {
      if (event.defaultPrevented || event.button !== 0) return;
      var link = event.target.closest("a[href]");
      if (!link || link.target || link.hasAttribute("download")) return;
      var next;
      try { next = new URL(link.href, location.href); } catch (e) { return; }
      if (next.origin !== location.origin) return;
      if (next.pathname === location.pathname && next.search === location.search && next.hash) return;
      isPageLeaving = true;
      leavingPlaybackIntent = hasPlaybackIntent();
      persistPlaybackSession(leavingPlaybackIntent);
    }, true);

    if (canvas && canvasContext) {
      resizeVisualizer();
      window.addEventListener("resize", function () {
        scheduleVisualizerResize(120);
      }, { passive: true });
    }

    updateProgress(true);
    updateBuffered();
    syncMute();
    initDockDragging();
    if (resumeAfterNavigation || shouldAutoplayOnHome) {
      scheduleInitialPlaybackAfterPageLoad();
    } else if (audio.readyState >= 1) {
      metadataReady();
    }

    function initEmbeddedVideoPause() {
      embeddedVideoFrames = Array.prototype.slice.call(doc.querySelectorAll(".post-video iframe"));
      if (embeddedVideoPauseBound) return;
      embeddedVideoPauseBound = true;

      window.addEventListener("message", function (event) {
        if (!isTrustedEmbeddedVideoOrigin(event.origin)) return;
        var fromKnownPlayer = embeddedVideoFrames.some(function (frame) {
          return frame.contentWindow === event.source;
        });
        if (fromKnownPlayer && isEmbeddedVideoPlayMessage(event.data)) pauseMusicForVideo();
      });

      // Cross-origin players do not consistently expose their playback state.
      // When a user starts operating an iframe, focus moves from this window to
      // the player. This is a dependable fallback for click/tap and keyboard play.
      window.addEventListener("blur", function () {
        window.setTimeout(function () {
          var active = doc.activeElement;
          if (active && embeddedVideoFrames.indexOf(active) !== -1) pauseMusicForVideo();
        }, 0);
      });

      doc.addEventListener("fullscreenchange", function () {
        if (doc.fullscreenElement && embeddedVideoFrames.indexOf(doc.fullscreenElement) !== -1) {
          pauseMusicForVideo();
        }
      });
    }

    function pauseMusicForVideo() {
      if (audio.paused || audio.ended) return;
      dock.classList.add("is-video-paused");
      audio.pause();
      if (statusEl) statusEl.textContent = "视频播放中 · 音乐已暂停";
      if (videoPauseStatusTimer) window.clearTimeout(videoPauseStatusTimer);
      videoPauseStatusTimer = window.setTimeout(function () {
        dock.classList.remove("is-video-paused");
        if (statusEl && audio.paused) statusEl.textContent = defaultStatusText();
      }, 2800);
    }

    function isTrustedEmbeddedVideoOrigin(origin) {
      try {
        var host = new URL(origin).hostname;
        return host === "bilibili.com" || host.slice(-13) === ".bilibili.com";
      } catch (e) {
        return false;
      }
    }

    function isEmbeddedVideoPlayMessage(payload) {
      if (typeof payload === "string") {
        var trimmed = payload.trim();
        if (!trimmed) return false;
        try { return isEmbeddedVideoPlayMessage(JSON.parse(trimmed)); }
        catch (e) { return isPlayStateToken(trimmed); }
      }
      if (!payload || typeof payload !== "object") return false;

      var eventKeys = ["event", "action", "state", "status", "method", "name", "type", "cmd", "command"];
      for (var i = 0; i < eventKeys.length; i += 1) {
        var value = payload[eventKeys[i]];
        if (typeof value === "string" && isPlayStateToken(value)) return true;
      }
      return payload.data && payload.data !== payload && isEmbeddedVideoPlayMessage(payload.data);
    }

    function isPlayStateToken(value) {
      var token = String(value).trim().toLowerCase();
      if (!token || /(pause|paused|progress|timeupdate|ready|seek|buffer|canplay|playback)/.test(token)) return false;
      return token === "play" || token === "playing" || token === "onplay" ||
        /(^|[_:.-])(play|playing)($|[_:.-])/.test(token);
    }

    function initMusicCache() {
      if (!("serviceWorker" in navigator) || !window.isSecureContext) {
        setCacheStatus("unavailable");
        return;
      }

      navigator.serviceWorker.addEventListener("message", function (event) {
        var data = event.data || {};
        if (data.type !== "MUSIC_CACHED" && data.type !== "MUSIC_CACHE_STATUS") return;
        var path = trackPath(currentTrackIndex);
        if (!path || normalizedTrackPath(data.url) !== path) return;

        if (data.type === "MUSIC_CACHED" || data.cached) {
          currentTrackCached = true;
          delete cacheRequests[path];
          window.clearTimeout(cacheStatusTimer);
          setCacheStatus("cached");
        } else {
          currentTrackCached = false;
          setCacheStatus("available");
        }
      });

      navigator.serviceWorker.register("/service-worker.js", {
        scope: "/",
        updateViaCache: "none"
      }).then(function () {
        return navigator.serviceWorker.ready;
      }).then(function (registration) {
        musicWorkerRegistration = registration;
        queryCurrentTrackCache();
      }).catch(function () {
        setCacheStatus("unavailable");
      });
    }

    function activeMusicWorker() {
      if (navigator.serviceWorker && navigator.serviceWorker.controller) {
        return navigator.serviceWorker.controller;
      }
      if (!musicWorkerRegistration) return null;
      return musicWorkerRegistration.active || musicWorkerRegistration.waiting || musicWorkerRegistration.installing;
    }

    function queryCurrentTrackCache() {
      var worker = activeMusicWorker();
      var path = trackPath(currentTrackIndex);
      if (!worker || !path) return;
      worker.postMessage({ type: "MUSIC_CACHE_STATUS", url: path });
    }

    function maybeCacheCurrentTrack() {
      if (audio.paused || currentTrackCached || !isFinite(audio.duration) || audio.duration <= 0) return;
      var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (connection && (connection.saveData || /(^|-)2g$/i.test(connection.effectiveType || ""))) return;
      var path = trackPath(currentTrackIndex);
      if (!path || cacheRequests[path] || !audio.buffered || !audio.buffered.length) return;
      var bufferedEnd = 0;
      try { bufferedEnd = audio.buffered.end(audio.buffered.length - 1); } catch (e) { return; }
      var bufferedRatio = bufferedEnd / audio.duration;
      // Cache Storage needs a whole-response fetch. Starting that fetch while
      // the active media stream still needs bandwidth can cause the exact
      // contention this player is designed to avoid, so only persist once the
      // browser has effectively received the whole track.
      if (bufferedRatio >= 0.97) requestCurrentTrackCache();
    }

    function requestCurrentTrackCache() {
      var worker = activeMusicWorker();
      var path = trackPath(currentTrackIndex);
      if (!worker || !path || currentTrackCached || cacheRequests[path]) return;
      cacheRequests[path] = true;
      setCacheStatus("caching");
      worker.postMessage({ type: "MUSIC_CACHE_TRACK", url: path });
      window.clearTimeout(cacheStatusTimer);
      cacheStatusTimer = window.setTimeout(function () {
        if (trackPath(currentTrackIndex) !== path || currentTrackCached) return;
        delete cacheRequests[path];
        setCacheStatus("available");
        queryCurrentTrackCache();
      }, 20000);
    }

    function setCacheStatus(state) {
      if (!cacheStatusEl) return;
      var text = "智能缓存 · 跨页续播";
      if (state === "cached") text = "已缓存 · 跨页续播";
      else if (state === "caching") text = "缓存中 · 跨页续播";
      else if (state === "unavailable") text = "跨页续播";
      cacheStatusEl.textContent = text;
      cacheStatusEl.setAttribute("data-cache-state", state);
    }

    function trackPath(index) {
      var track = tracks[index];
      return track ? normalizedTrackPath(track.src) : "";
    }

    function normalizedTrackPath(value) {
      try { return new URL(value, location.href).pathname; }
      catch (e) { return ""; }
    }

    function isBlogHomePage() {
      var path = location.pathname.replace(/\/index\.html$/i, "/");
      return path === "/blog" || path === "/blog/";
    }

    function consumeUniverseArrivalIntent() {
      var requestedAt = 0;
      try {
        requestedAt = parseInt(sessionStorage.getItem(SESSION_EXPAND_ON_ARRIVAL), 10);
        sessionStorage.removeItem(SESSION_EXPAND_ON_ARRIVAL);
      } catch (e) {}
      var age = Date.now() - requestedAt;
      return isBlogHomePage() && requestedAt > 0 && age >= 0 && age <= UNIVERSE_ARRIVAL_MAX_AGE;
    }

    function scheduleInitialPlaybackAfterPageLoad() {
      var start = function () {
        window.requestAnimationFrame(function () {
          window.requestAnimationFrame(function () {
            if (isPageLeaving || safePlaybackRequested || !audio.paused) return;

            var userPaused = false;
            var continuationAllowed = resumeAfterNavigation;
            try {
              userPaused = sessionStorage.getItem(SESSION_USER_PAUSED) === "1";
              if (resumeAfterNavigation) {
                continuationAllowed = sessionStorage.getItem(SESSION_PLAYING) === "1";
              }
            } catch (error) {}

            if (userPaused || (resumeAfterNavigation && !continuationAllowed)) {
              resumeAfterNavigation = false;
              return;
            }

            var continuation = resumeAfterNavigation;
            playAudio(continuation, shouldAutoplayOnHome && !continuation);
            if (continuation) {
              window.setTimeout(function () {
                if (audio.readyState === 0 && !resumeAttempted) retryAudioLoad();
              }, 320);
            }
          });
        });
      };

      if (doc.readyState === "complete") start();
      else window.addEventListener("load", start, { once: true });
    }

    function playAudio(isContinuation, isAutoplayAttempt) {
      if (audio.ended && currentTrackIndex === tracks.length - 1) {
        try { audio.currentTime = 0; } catch (error) {}
        updateProgress(true);
      }
      safePlaybackRequested = true;
      safePlaybackContinuation = Boolean(isContinuation);
      safePlaybackAutoplay = Boolean(isAutoplayAttempt);
      autoplayBlocked = false;
      unbindAutoplayGesture();
      if (!audio.getAttribute("src")) {
        canPlayThrough = false;
        safeBufferSamples = [];
        audio.src = tracks[currentTrackIndex].src;
        try { audio.load(); }
        catch (error) { handlePlayFailure(error, isContinuation, isAutoplayAttempt); return; }
      }
      maybeStartSafePlayback();
    }

    function maybeStartSafePlayback() {
      if (!safePlaybackRequested || !audio.getAttribute("src")) return;
      recordSafeBufferSample();
      var state = safeBufferState();
      renderSafeBufferState(state);
      if (isSilentPriming) {
        if (state.ready) finishSilentPriming();
        else scheduleSafeBufferCheck(520);
        return;
      }
      if (state.ready) {
        startNativePlayback(safePlaybackContinuation, safePlaybackAutoplay);
        return;
      }
      if (state.browserConfident) {
        startSilentPriming();
        return;
      }
      scheduleSafeBufferCheck(680);
    }

    function startSilentPriming() {
      if (isSilentPriming || !safePlaybackRequested) return;
      isSilentPriming = true;
      primeStartTime = isFinite(audio.currentTime) ? audio.currentTime : 0;
      primeRestoreMuted = desiredMuted;
      audio.muted = true;
      safeBufferSamples = [];
      recordSafeBufferSample();
      var generation = ++silentPrimeGeneration;
      var promise;
      try { promise = audio.play(); }
      catch (error) {
        isSilentPriming = false;
        audio.muted = primeRestoreMuted;
        handlePlayFailure(error, safePlaybackContinuation, safePlaybackAutoplay);
        return;
      }
      if (promise && promise.catch) {
        promise.catch(function (error) {
          if (generation !== silentPrimeGeneration || !isSilentPriming) return;
          isSilentPriming = false;
          audio.muted = primeRestoreMuted;
          handlePlayFailure(error, safePlaybackContinuation, safePlaybackAutoplay);
        });
      }
    }

    function finishSilentPriming() {
      if (!isSilentPriming) return;
      var continuation = safePlaybackContinuation;
      var autoplayAttempt = safePlaybackAutoplay;
      silentPrimeGeneration += 1;
      clearSafeBufferTimer();
      isBufferingPause = true;
      audio.pause();
      isBufferingPause = false;
      try { audio.currentTime = primeStartTime; } catch (error) {}
      audio.muted = primeRestoreMuted;
      isSilentPriming = false;
      safeBufferSamples = [];
      if (primeFinishTimer) window.clearTimeout(primeFinishTimer);
      primeFinishTimer = window.setTimeout(function () {
        primeFinishTimer = 0;
        if (!safePlaybackRequested) return;
        startNativePlayback(continuation, autoplayAttempt);
      }, 180);
    }

    function startNativePlayback(isContinuation, isAutoplayAttempt) {
      clearSafeBufferTimer();
      safePlaybackRequested = false;
      safePlaybackContinuation = false;
      safePlaybackAutoplay = false;
      dock.classList.remove("is-buffering");
      if (isContinuation) resumeAttempted = true;
      audio.muted = desiredMuted;
      lastNativePlayAttemptAt = window.performance && performance.now ? performance.now() : Date.now();
      var promise;
      try { promise = audio.play(); }
      catch (error) { handlePlayFailure(error, isContinuation, isAutoplayAttempt); return; }
      if (!audio.paused && (desiredMuted || !audio.muted)) markAudiblePlaybackStarted();
      window.setTimeout(function () {
        if (!audio.paused && (desiredMuted || !audio.muted)) markAudiblePlaybackStarted();
      }, 260);
      if (promise && promise.then) {
        promise.then(function () {
          if (!desiredMuted && audio.muted) {
            isBufferingPause = true;
            audio.pause();
            isBufferingPause = false;
            audio.muted = false;
            handlePlayFailure({ name: "NotAllowedError" }, isContinuation, isAutoplayAttempt);
            return;
          }
          markAudiblePlaybackStarted();
          // The visualizer is optional: only attach it after native playback has
          // started so a suspended AudioContext can never block the track.
          ensureAudioGraph();
        }).catch(function (error) {
          handlePlayFailure(error, isContinuation, isAutoplayAttempt);
        });
      } else {
        markAudiblePlaybackStarted();
        ensureAudioGraph();
      }
    }

    function handlePlayFailure(error, isContinuation, isAutoplayAttempt) {
      clearSafeBufferTimer();
      safePlaybackRequested = false;
      dock.classList.remove("is-buffering", "is-playing");
      toggle.setAttribute("aria-pressed", "false");
      if (error && error.name === "NotAllowedError") {
        autoplayBlocked = true;
        dock.classList.add("is-resume-pending");
        dock.classList.remove("is-error");
        if (statusEl) statusEl.textContent = "已缓冲 · 点击播放";
        toggle.setAttribute("aria-label", "继续播放背景音乐");
        bindAutoplayGesture();
        return;
      }
      setPlaybackIntent(false);
      if (isContinuation || isAutoplayAttempt) {
        dock.classList.add("is-resume-pending");
        dock.classList.remove("is-error");
        if (statusEl) statusEl.textContent = "播放未开始 · 点击重试";
        toggle.setAttribute("aria-label", "继续播放背景音乐");
        return;
      }
      dock.classList.add("is-error");
      toggle.setAttribute("aria-label", "播放失败，请再次点击重试");
    }

    function scheduleSafeBufferCheck(delay) {
      clearSafeBufferTimer();
      safeBufferTimer = window.setTimeout(function () {
        safeBufferTimer = 0;
        maybeStartSafePlayback();
      }, Math.max(0, delay || 0));
    }

    function clearSafeBufferTimer() {
      if (!safeBufferTimer) return;
      window.clearTimeout(safeBufferTimer);
      safeBufferTimer = 0;
    }

    function cancelSafePlayback() {
      clearSafeBufferTimer();
      if (primeFinishTimer) {
        window.clearTimeout(primeFinishTimer);
        primeFinishTimer = 0;
      }
      if (isSilentPriming) {
        silentPrimeGeneration += 1;
        isBufferingPause = true;
        audio.pause();
        isBufferingPause = false;
        try { audio.currentTime = primeStartTime; } catch (error) {}
        audio.muted = primeRestoreMuted;
        isSilentPriming = false;
      }
      safePlaybackRequested = false;
      safePlaybackContinuation = false;
      safePlaybackAutoplay = false;
      pendingTrackAutoplay = false;
      resumeAfterNavigation = false;
      isRecoveryBuffering = false;
      autoplayBlocked = false;
      unbindAutoplayGesture();
      dock.classList.remove("is-buffering", "is-resume-pending");
      if (statusEl) statusEl.textContent = defaultStatusText();
      toggle.setAttribute("aria-label", "播放背景音乐");
      toggle.setAttribute("aria-pressed", "false");
      setPlaybackIntent(false);
      setCacheStatus(currentTrackCached ? "cached" : "available");
    }

    function bufferedAheadSeconds() {
      var current = isFinite(audio.currentTime) ? audio.currentTime : 0;
      if (!audio.buffered) return 0;
      for (var i = 0; i < audio.buffered.length; i += 1) {
        var start = 0;
        var end = 0;
        try {
          start = audio.buffered.start(i);
          end = audio.buffered.end(i);
        } catch (error) {
          continue;
        }
        if (current + 0.08 >= start && current <= end + 0.08) return Math.max(0, end - current);
      }
      return 0;
    }

    function recordSafeBufferSample() {
      var now = window.performance && performance.now ? performance.now() : Date.now();
      var ahead = bufferedAheadSeconds();
      var last = safeBufferSamples[safeBufferSamples.length - 1];
      if (last && now - last.time < 420) return;
      safeBufferSamples.push({ time: now, ahead: ahead });
      while (safeBufferSamples.length > 2 && now - safeBufferSamples[0].time > 9000) {
        safeBufferSamples.shift();
      }
    }

    function observedBufferRate() {
      if (safeBufferSamples.length < 2) return null;
      var first = safeBufferSamples[0];
      var last = safeBufferSamples[safeBufferSamples.length - 1];
      var elapsed = (last.time - first.time) / 1000;
      if (elapsed < 0.8) return null;
      var netGrowth = (last.ahead - first.ahead) / elapsed;
      return Math.max(0, netGrowth + (isSilentPriming ? 1 : 0));
    }

    function safeBufferTarget(rate) {
      var connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      var effectiveType = connection && connection.effectiveType ? connection.effectiveType : "";
      var target = 28;
      if (connection && connection.saveData) target = 48;
      else if (effectiveType === "slow-2g") target = 60;
      else if (effectiveType === "2g") target = 52;
      else if (effectiveType === "3g") target = 36;
      else if (effectiveType === "4g") target = 22;

      if (rate !== null) {
        if (rate >= 3) target = Math.min(target, 12);
        else if (rate >= 1.8) target = Math.min(target, 18);
        else if (rate >= 1.3) target = Math.max(target, 28);
        else if (rate >= 1.1) target = Math.max(target, 42);
        else target = Math.max(target, 60);
      }
      if (isRecoveryBuffering) target = Math.min(72, target + 12);
      return target;
    }

    function safeBufferState() {
      var ahead = bufferedAheadSeconds();
      var duration = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
      var current = isFinite(audio.currentTime) ? audio.currentTime : 0;
      var remaining = duration ? Math.max(0, duration - current) : Infinity;
      var rate = observedBufferRate();
      var target = Math.min(safeBufferTarget(rate), remaining);
      var fullyBuffered = duration > 0 && ahead >= Math.max(0, remaining - 0.9);
      // HAVE_ENOUGH_DATA / canplaythrough is the browser's own throughput-aware
      // estimate. Some engines keep downloading while exposing only a short
      // buffered range, so require a small real reserve without forcing them to
      // reveal the whole in-flight download before playback can begin.
      var browserConfident = (canPlayThrough || audio.readyState === 4) && ahead >= Math.min(4, remaining);
      var rateIsSustainable = rate === null || rate >= 1.1;
      var reserveIsSafe = ahead >= target && (rateIsSustainable || ahead >= 60);
      var ready = audio.readyState >= 3 && (fullyBuffered || reserveIsSafe);
      return {
        ahead: ahead,
        target: target,
        rate: rate,
        ready: ready,
        fullyBuffered: fullyBuffered,
        browserConfident: browserConfident
      };
    }

    function renderSafeBufferState(state) {
      dock.classList.add("is-buffering");
      dock.classList.remove("is-error", "is-resume-pending");
      var ahead = Math.max(0, Math.floor(state.ahead));
      var target = Math.max(1, Math.ceil(state.target));
      var status = isRecoveryBuffering
        ? "网络波动 · 稳定缓冲 "
        : (isSilentPriming ? "静默预热 · " : "准备连续播放 · ");
      if (statusEl) statusEl.textContent = status + ahead + "s";
      toggle.setAttribute("aria-label", "取消连续播放缓冲");
      if (cacheStatusEl) {
        var warmupStarted = false;
        try { warmupStarted = sessionStorage.getItem("aurora-music-warmup-started") === "1"; }
        catch (error) {}
        cacheStatusEl.textContent = ahead > 0
          ? "安全缓冲 " + ahead + " / " + target + "s"
          : (warmupStarted ? "接续宇宙页预热" : "建立安全缓冲");
        cacheStatusEl.setAttribute("data-cache-state", "buffering");
      }
    }

    function bindAutoplayGesture() {
      if (autoplayGestureBound) return;
      autoplayGestureBound = true;
      doc.addEventListener("pointerdown", resumeBlockedAutoplay, true);
      doc.addEventListener("click", resumeBlockedAutoplay, true);
      doc.addEventListener("keydown", resumeBlockedAutoplay, true);
    }

    function unbindAutoplayGesture() {
      if (!autoplayGestureBound) return;
      autoplayGestureBound = false;
      doc.removeEventListener("pointerdown", resumeBlockedAutoplay, true);
      doc.removeEventListener("click", resumeBlockedAutoplay, true);
      doc.removeEventListener("keydown", resumeBlockedAutoplay, true);
    }

    function resumeBlockedAutoplay(event) {
      if (!autoplayBlocked || !audio.paused) return;
      if (event.type === "keydown") {
        if (event.key !== "Enter" && event.key !== " ") return;
        var active = doc.activeElement;
        if (active && /^(INPUT|TEXTAREA|SELECT)$/.test(active.tagName)) return;
      }
      if (event.target.closest && event.target.closest("[data-music-toggle]")) return;
      autoplayBlocked = false;
      setUserPaused(false);
      playAudio(false, false);
    }

    function switchTrack(index, playWhenReady) {
      var nextIndex = Math.round(clamp(index, 0, tracks.length - 1));
      if (nextIndex === currentTrackIndex) {
        if (playWhenReady && audio.paused) playAudio(false, false);
        return;
      }

      if (safePlaybackRequested) cancelSafePlayback();
      isTrackSwitching = true;
      currentTrackIndex = nextIndex;
      currentTrackCached = false;
      canPlayThrough = false;
      safeBufferSamples = [];
      isRecoveryBuffering = false;
      autoplayBlocked = false;
      unbindAutoplayGesture();
      setCacheStatus("available");
      restoreTimeOnMetadata = false;
      pendingTrackAutoplay = Boolean(playWhenReady);
      resumeAfterNavigation = false;
      resumeAttempted = false;
      audioLoadRetries = 0;
      if (audioLoadRetryTimer) {
        window.clearTimeout(audioLoadRetryTimer);
        audioLoadRetryTimer = 0;
      }

      try {
        sessionStorage.setItem(SESSION_TRACK, String(currentTrackIndex));
        sessionStorage.setItem(SESSION_TIME, "0");
      } catch (e) {}

      syncTrackUI();
      seek.value = "0";
      dock.style.setProperty("--seek", "0%");
      dock.style.setProperty("--buffered", "0%");
      if (currentEl) currentEl.textContent = "0:00";
      audio.src = tracks[currentTrackIndex].src;
      queryCurrentTrackCache();
      try { audio.load(); }
      catch (e) {
        isTrackSwitching = false;
        handlePlayFailure(e, false, false);
      }
    }

    function finishPlaylistPlayback() {
      pendingTrackAutoplay = false;
      resumeAfterNavigation = false;
      leavingPlaybackIntent = false;
      setUserPaused(true);
      setPlaybackIntent(false);
      if (currentTrackIndex !== 0) {
        switchTrack(0, false);
      } else {
        syncTrackUI();
      }
      try { audio.currentTime = 0; } catch (error) {}
      try {
        sessionStorage.setItem(SESSION_TRACK, "0");
        sessionStorage.setItem(SESSION_TIME, "0");
      } catch (error) {}
      dock.classList.remove("is-playing", "is-buffering", "is-resume-pending");
      if (statusEl) statusEl.textContent = defaultStatusText();
      toggle.setAttribute("aria-label", "播放背景音乐");
      toggle.setAttribute("aria-pressed", "false");
      updateProgress(true);
      if (navigator.mediaSession) navigator.mediaSession.playbackState = "paused";
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      drawIdleVisualizer();
    }

    function syncTrackUI() {
      var track = tracks[currentTrackIndex];
      if (!track) return;
      dock.setAttribute("data-track-title", track.title);
      if (titleEl) titleEl.textContent = track.title;
      if (durationEl) durationEl.textContent = track.duration;
      if (statusEl && !dock.classList.contains("is-resume-pending") && !dock.classList.contains("is-buffering")) statusEl.textContent = defaultStatusText();
      trackButtons.forEach(function (button, index) {
        var active = index === currentTrackIndex;
        button.classList.toggle("is-active", active);
        if (active) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
      });
    }

    function defaultStatusText() {
      return dock.getAttribute("data-track-artist") || "xueyuan";
    }

    function applyQueueState(open) {
      dock.classList.toggle("is-queue-open", open);
      if (queueToggle) {
        queueToggle.setAttribute("aria-expanded", open ? "true" : "false");
        queueToggle.setAttribute("aria-label", open ? "收起播放列表" : "展开播放列表");
      }
    }

    function setQueueOpen(open, options) {
      open = Boolean(open);
      if (dock.classList.contains("is-queue-open") === open && !dockMotionAnimation) {
        applyQueueState(open);
        return;
      }
      animateDockMutation(function () {
        applyQueueState(open);
      }, "is-queue-transitioning", 250, options);
    }

    function retryAudioLoad() {
      if (!resumeAfterNavigation || audioLoadRetries >= 3 || audioLoadRetryTimer) return;
      audioLoadRetries += 1;
      dock.classList.add("is-resume-pending");
      dock.classList.remove("is-error");
      if (statusEl) statusEl.textContent = "正在恢复播放";
      toggle.setAttribute("aria-label", "正在恢复背景音乐");
      audioLoadRetryTimer = window.setTimeout(function () {
        audioLoadRetryTimer = 0;
        try {
          audio.load();
          window.setTimeout(function () {
            if (audio.readyState >= 1 || resumeAttempted) return;
            if (audioLoadRetries < 3) retryAudioLoad();
            else handlePlayFailure(new Error("音频恢复超时"), true, false);
          }, 520);
        }
        catch (e) { handlePlayFailure(e, true, false); }
      }, audioLoadRetries * 180);
    }

    function applyCollapsedState(collapsed) {
      dock.classList.toggle("is-collapsed", collapsed);
      if (collapsed) applyQueueState(false);
      if (collapse) {
        collapse.setAttribute("aria-expanded", collapsed ? "false" : "true");
        collapse.setAttribute("aria-label", collapsed ? "展开播放器" : "收起播放器");
        collapse.setAttribute("title", collapsed ? "展开播放器" : "最小化播放器");
      }
    }

    function setCollapsed(collapsed, options) {
      collapsed = Boolean(collapsed);
      if (dock.classList.contains("is-collapsed") === collapsed && !dockMotionAnimation) {
        applyCollapsedState(collapsed);
        settleDockLayout(options && options.persist, true);
        return;
      }
      animateDockMutation(function () {
        applyCollapsedState(collapsed);
      }, collapsed ? "is-collapsing" : "is-expanding", 280, options);
    }

    function cancelDockMotion() {
      dockMotionGeneration += 1;
      if (dockMotionAnimation) {
        dockMotionAnimation.onfinish = null;
        dockMotionAnimation.oncancel = null;
        try { dockMotionAnimation.cancel(); } catch (e) {}
        dockMotionAnimation = null;
      }
      if (dockHeadAnimation) {
        try { dockHeadAnimation.cancel(); } catch (e) {}
        dockHeadAnimation = null;
      }
      if (dockDetailsAnimation) {
        try { dockDetailsAnimation.cancel(); } catch (e) {}
        dockDetailsAnimation = null;
      }
      dock.classList.remove("is-layout-transitioning", "is-collapsing", "is-expanding", "is-queue-transitioning", "is-edge-transitioning", "is-edge-drag-settling");
    }

    function buildQueueScaleCompensation(element, initialScaleY) {
      var keyframes = [];
      var offsetTop = element.offsetTop;
      var steps = 12;
      for (var index = 0; index <= steps; index += 1) {
        var offset = index / steps;
        var parentScaleY = initialScaleY + (1 - initialScaleY) * offset;
        var inverseScaleY = Math.abs(parentScaleY) > 0.001 ? 1 / parentScaleY : 1;
        var offsetY = offsetTop * (inverseScaleY - 1);
        keyframes.push({
          offset: offset,
          transformOrigin: "top left",
          transform: "translateY(" + offsetY.toFixed(2) + "px) scaleY(" + inverseScaleY.toFixed(4) + ")"
        });
      }
      return keyframes;
    }

    function animateDockMutation(mutate, motionClass, duration, options) {
      options = options || {};
      var firstRect = dock.getBoundingClientRect();
      cancelDockMotion();

      if (options.instant || reducedMotion || typeof dock.animate !== "function") {
        mutate();
        settleDockLayout(options.persist, true);
        return;
      }

      var generation = ++dockMotionGeneration;
      dock.classList.add("is-layout-transitioning", motionClass);
      mutate();
      clampDockForCurrentState();
      var lastRect = dock.getBoundingClientRect();
      var scaleX = lastRect.width > 0 ? firstRect.width / lastRect.width : 1;
      var scaleY = lastRect.height > 0 ? firstRect.height / lastRect.height : 1;
      var translateX = firstRect.left - lastRect.left;
      var translateY = firstRect.top - lastRect.top;

      if (!isFinite(scaleX) || !isFinite(scaleY)) {
        finishDockMotion(generation, options.persist);
        return;
      }

      dockMotionAnimation = dock.animate([
        {
          transformOrigin: "top left",
          transform: "translate(" + translateX.toFixed(2) + "px, " + translateY.toFixed(2) + "px) scale(" + scaleX.toFixed(4) + ", " + scaleY.toFixed(4) + ")",
          opacity: 0.985
        },
        {
          transformOrigin: "top left",
          transform: "translate(0, 0) scale(1, 1)",
          opacity: 1
        }
      ], {
        duration: duration,
        easing: "cubic-bezier(0.22, 1, 0.36, 1)"
      });
      dockMotionAnimation.onfinish = function () {
        finishDockMotion(generation, options.persist);
      };
      dockMotionAnimation.oncancel = function () {};

      var head = dock.querySelector(".music-dock__head");
      var details = dock.querySelector("[data-music-details]");
      if (motionClass === "is-queue-transitioning") {
        if (head && typeof head.animate === "function") {
          dockHeadAnimation = head.animate(buildQueueScaleCompensation(head, scaleY), {
            duration: duration,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "both"
          });
        }
        if (details && typeof details.animate === "function") {
          dockDetailsAnimation = details.animate(buildQueueScaleCompensation(details, scaleY), {
            duration: duration,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "both"
          });
        }
      } else if (head && typeof head.animate === "function") {
          dockHeadAnimation = head.animate([
            { opacity: 0, offset: 0 },
            { opacity: 0, offset: 0.34 },
            { opacity: 1, offset: 1 }
          ], {
            duration: duration,
            easing: "cubic-bezier(0.22, 1, 0.36, 1)",
            fill: "both"
          });
      }

      if (motionClass === "is-expanding") {
        if (details && typeof details.animate === "function") {
          dockDetailsAnimation = details.animate([
            { opacity: 0, offset: 0 },
            { opacity: 0, offset: 0.56 },
            { opacity: 1, offset: 1 }
          ], {
            duration: duration,
            easing: "ease-out",
            fill: "both"
          });
        }
      }
    }

    function finishDockMotion(generation, persist) {
      if (generation !== dockMotionGeneration) return;
      if (dockMotionAnimation) {
        dockMotionAnimation.onfinish = null;
        dockMotionAnimation.oncancel = null;
      }
      dockMotionAnimation = null;
      if (dockHeadAnimation) {
        try { dockHeadAnimation.cancel(); } catch (e) {}
        dockHeadAnimation = null;
      }
      if (dockDetailsAnimation) {
        try { dockDetailsAnimation.cancel(); } catch (e) {}
        dockDetailsAnimation = null;
      }
      dock.classList.remove("is-layout-transitioning", "is-collapsing", "is-expanding", "is-queue-transitioning", "is-edge-transitioning", "is-edge-drag-settling");
      settleDockLayout(persist, false);
    }

    function clampDockForCurrentState() {
      if (!dock.classList.contains("is-positioned")) return;
      if (dock.classList.contains("is-edge-docked")) clampEdgeDockPosition();
      else clampDockPosition();
    }

    function settleDockLayout(persist, shouldClamp) {
      window.clearTimeout(visualizerResizeTimer);
      visualizerResizeTimer = 0;
      resizeVisualizer();
      if (!dock.classList.contains("is-positioned")) return;
      if (shouldClamp) clampDockForCurrentState();
      if (persist !== false) saveDockPosition();
    }

    function initDockDragging() {
      if (!dragHandle || !("PointerEvent" in window)) return;

      dock.addEventListener("click", function (event) {
        if (!suppressedEdgeDragControl || event.detail === 0) return;
        if (event.target !== suppressedEdgeDragControl && !suppressedEdgeDragControl.contains(event.target)) return;
        suppressedEdgeDragControl = null;
        window.clearTimeout(suppressEdgeDragClickTimer);
        suppressEdgeDragClickTimer = 0;
        event.preventDefault();
        event.stopImmediatePropagation();
      }, true);

      dragHandle.addEventListener("pointerdown", function (event) {
        if (dragStart) return;
        var edgeDrag = dock.classList.contains("is-edge-docked");
        var interactiveTarget = event.target.closest("button, a, input, label");
        if ((!edgeDrag && !isDockDragEnabled()) || event.button !== 0 || event.isPrimary === false) return;
        if (!edgeDrag && interactiveTarget) return;
        if (dock.classList.contains("is-layout-transitioning")) return;

        var rect = dock.getBoundingClientRect();
        cancelDockMotion();
        dragPointerId = event.pointerId;
        dragStart = {
          pointerX: event.clientX,
          pointerY: event.clientY,
          left: rect.left,
          top: rect.top,
          width: rect.width,
          height: rect.height,
          nextLeft: rect.left,
          nextTop: rect.top,
          rawNextTop: rect.top,
          lastPointerX: event.clientX,
          lastPointerY: event.clientY,
          started: false,
          edge: edgeDrag,
          side: dock.classList.contains("is-edge-left") ? "left" : "right",
          crossing: false,
          interactiveTarget: edgeDrag ? interactiveTarget : null,
          captureTarget: interactiveTarget || dragHandle,
          edgeBounds: edgeDrag ? getEdgeViewportBounds(rect.width, rect.height) : null,
          positionBounds: edgeDrag ? null : getPositionedViewportBounds(rect.width, rect.height)
        };

        if (!interactiveTarget) event.preventDefault();
        try { dragStart.captureTarget.setPointerCapture(event.pointerId); } catch (e) {}
      });

      var beginDrag = function (state) {
        state.started = true;
        isAutoDocked = false;
        dock.classList.add("is-positioned", "is-dragging");
        if (state.edge) {
          applyCollapsedState(true);
          dock.classList.add("is-edge-dragging");
        }
        dock.style.left = state.left.toFixed(1) + "px";
        dock.style.top = state.top.toFixed(1) + "px";
        dock.style.right = "auto";
        dock.style.bottom = "auto";
      };

      var updateDragTarget = function (state, clientX, clientY) {
        if (!isFinite(clientX) || !isFinite(clientY)) return;
        state.lastPointerX = clientX;
        state.lastPointerY = clientY;
        var deltaX = clientX - state.pointerX;
        var deltaY = clientY - state.pointerY;
        state.rawNextTop = state.top + deltaY;
        if (state.edge) {
          state.nextTop = clamp(state.rawNextTop, state.edgeBounds.minTop, state.edgeBounds.maxTop);
          var inwardDistance = state.side === "left" ? deltaX : -deltaX;
          if (!state.crossing && inwardDistance >= Math.max(42, Math.abs(deltaY) * 0.55)) {
            state.crossing = true;
          }
          state.nextLeft = state.crossing
            ? clamp(state.left + deltaX, state.edgeBounds.minLeft, state.edgeBounds.maxLeft)
            : (state.side === "left" ? state.edgeBounds.minLeft : state.edgeBounds.maxLeft);
          if (state.crossing) {
            var previewSide = state.nextLeft + state.width / 2 <= state.edgeBounds.centerX ? "left" : "right";
            dock.classList.toggle("is-edge-left", previewSide === "left");
            dock.classList.toggle("is-edge-right", previewSide === "right");
          }
          return;
        }
        state.nextLeft = clamp(state.left + deltaX, state.positionBounds.minLeft, state.positionBounds.maxLeft);
        state.nextTop = clamp(state.rawNextTop, state.positionBounds.minTop, state.positionBounds.maxTop);
      };

      var moveDrag = function (event) {
        if (!dragStart || event.pointerId !== dragPointerId) return;
        event.preventDefault();
        var deltaX = event.clientX - dragStart.pointerX;
        var deltaY = event.clientY - dragStart.pointerY;
        if (!dragStart.started) {
          if (Math.hypot(deltaX, deltaY) < (dragStart.edge ? 6 : 3)) return;
          beginDrag(dragStart);
        }
        updateDragTarget(dragStart, event.clientX, event.clientY);
        if (dragFrameId) return;
        dragFrameId = window.requestAnimationFrame(function () {
          dragFrameId = 0;
          if (!dragStart) return;
          dock.style.transform = "translate3d(" + (dragStart.nextLeft - dragStart.left).toFixed(1) + "px, " + (dragStart.nextTop - dragStart.top).toFixed(1) + "px, 0)";
        });
      };

      var finishDrag = function (event, useEventPosition) {
        if (!dragStart || event.pointerId !== dragPointerId) return;
        var completedDrag = dragStart;
        var pointerId = dragPointerId;
        if (useEventPosition && isFinite(event.clientX) && isFinite(event.clientY)) {
          if (!completedDrag.started && Math.hypot(
            event.clientX - completedDrag.pointerX,
            event.clientY - completedDrag.pointerY
          ) >= (completedDrag.edge ? 6 : 3)) {
            beginDrag(completedDrag);
          }
          if (completedDrag.started) updateDragTarget(completedDrag, event.clientX, event.clientY);
        }
        dragPointerId = null;
        dragStart = null;
        try { completedDrag.captureTarget.releasePointerCapture(pointerId); } catch (e) {}
        if (!completedDrag.started) return;
        if (completedDrag.edge && completedDrag.interactiveTarget) {
          suppressedEdgeDragControl = completedDrag.interactiveTarget;
          window.clearTimeout(suppressEdgeDragClickTimer);
          suppressEdgeDragClickTimer = window.setTimeout(function () {
            suppressedEdgeDragControl = null;
            suppressEdgeDragClickTimer = 0;
          }, 100);
        }
        if (dragFrameId) {
          window.cancelAnimationFrame(dragFrameId);
          dragFrameId = 0;
        }
        dock.style.left = completedDrag.nextLeft.toFixed(1) + "px";
        dock.style.top = completedDrag.nextTop.toFixed(1) + "px";
        dock.style.right = "auto";
        dock.style.bottom = "auto";
        dock.style.removeProperty("transform");
        void dock.offsetWidth;
        dock.classList.remove("is-dragging", "is-edge-dragging");
        if (completedDrag.edge) {
          settleEdgeDockAfterDrag(completedDrag);
          return;
        }
        settleDockAfterDrag(completedDrag);
      };

      window.addEventListener("pointermove", moveDrag, { passive: false });
      window.addEventListener("pointerup", function (event) { finishDrag(event, true); });
      window.addEventListener("pointercancel", function (event) { finishDrag(event, false); });
      dock.addEventListener("lostpointercapture", function (event) { finishDrag(event, false); }, true);
      dragHandle.addEventListener("dblclick", function (event) {
        if (event.target.closest("button, a, input, label")) return;
        resetDockPosition(true);
      });

      var scheduleDockViewportSync = function () {
        window.clearTimeout(dockResizeTimer);
        dockResizeTimer = window.setTimeout(function () {
          if (dragStart || dock.classList.contains("is-layout-transitioning")) {
            scheduleDockViewportSync();
            return;
          }
          if (dock.classList.contains("is-edge-docked")) {
            clampEdgeDockPosition();
            if (isAutoDocked) placeDefaultDockAwayFromContent();
            else saveDockPosition();
          } else if (dock.classList.contains("is-positioned") && isDockDragEnabled()) {
            clampDockPosition();
            saveDockPosition();
          } else {
            resetDockPosition(false);
            placeDefaultDockAwayFromContent();
          }
        }, 120);
      };
      window.addEventListener("resize", scheduleDockViewportSync, { passive: true });
      if (window.visualViewport) {
        window.visualViewport.addEventListener("resize", scheduleDockViewportSync, { passive: true });
        window.visualViewport.addEventListener("scroll", scheduleDockViewportSync, { passive: true });
      }

      window.requestAnimationFrame(function () {
        syncDockForCurrentPage(true);
      });
    }

    function syncDockExpansionForCurrentPage() {
      setCollapsed(false);
    }

    function syncDockForCurrentPage(restoreStoredPosition) {
      if (restoreStoredPosition) {
        if (expandOnUniverseArrival) {
          expandOnUniverseArrival = false;
          resetDockPosition(false);
          applyCollapsedState(false);
          return;
        }
        expandOnUniverseArrival = false;
        if (restoreDockPosition()) return;
      }
      if (dock.classList.contains("is-edge-docked")) {
        clampEdgeDockPosition();
        if (isAutoDocked) window.requestAnimationFrame(placeDefaultDockAwayFromContent);
        return;
      }
      if (dock.classList.contains("is-positioned") && isDockDragEnabled()) {
        clampDockPosition();
        return;
      }
      window.requestAnimationFrame(placeDefaultDockAwayFromContent);
    }

    function placeDefaultDockAwayFromContent() {
      if (!isDockDragEnabled()) {
        isAutoDocked = false;
        resetDockPosition(false);
        return;
      }
      if (!dock.classList.contains("is-collapsed")) {
        isAutoDocked = false;
        resetDockPosition(false);
        return;
      }
      var main = doc.querySelector(".main");
      var mainRect = main && main.getBoundingClientRect();
      var dockRect = dock.getBoundingClientRect();
      var rightGutter = mainRect ? window.innerWidth - mainRect.right : 0;
      var restingDockWidth = dock.classList.contains("is-collapsed")
        ? Math.min(220, Math.max(0, window.innerWidth - 28))
        : dockRect.width;
      if (rightGutter < restingDockWidth + 10) {
        isAutoDocked = true;
        dockToEdge("right", Math.max(12, window.innerHeight - 92), false, false);
      } else {
        isAutoDocked = false;
        resetDockPosition(false);
      }
    }

    function isDockDragEnabled() {
      return window.innerWidth > 680;
    }

    function positionDock(left, top) {
      var rect = dock.getBoundingClientRect();
      var bounds = getPositionedViewportBounds(rect.width, rect.height);
      dock.style.left = clamp(left, bounds.minLeft, bounds.maxLeft).toFixed(1) + "px";
      dock.style.top = clamp(top, bounds.minTop, bounds.maxTop).toFixed(1) + "px";
      dock.style.right = "auto";
      dock.style.bottom = "auto";
    }

    function clampDockPosition() {
      if (!dock.classList.contains("is-positioned") || !isDockDragEnabled()) return;
      var rect = dock.getBoundingClientRect();
      positionDock(rect.left, rect.top);
    }

    function saveDockPosition() {
      if (isAutoDocked || !dock.classList.contains("is-positioned")) return;
      var rect = dock.getBoundingClientRect();
      if (dock.classList.contains("is-edge-docked")) {
        var edgeBounds = getEdgeViewportBounds(rect.width, rect.height);
        var edgeAvailableY = Math.max(1, edgeBounds.maxTop - edgeBounds.minTop);
        var edgeState = {
          edge: true,
          side: dock.classList.contains("is-edge-left") ? "left" : "right",
          y: clamp((rect.top - edgeBounds.minTop) / edgeAvailableY, 0, 1)
        };
        try { localStorage.setItem(STORE_DOCK_POSITION, JSON.stringify(edgeState)); } catch (e) {}
        return;
      }
      if (!isDockDragEnabled()) {
        try { localStorage.removeItem(STORE_DOCK_POSITION); } catch (e) {}
        return;
      }
      var positionBounds = getPositionedViewportBounds(rect.width, rect.height);
      var availableX = Math.max(1, positionBounds.maxLeft - positionBounds.minLeft);
      var availableY = Math.max(1, positionBounds.maxTop - positionBounds.minTop);
      var state = {
        edge: false,
        x: clamp((rect.left - positionBounds.minLeft) / availableX, 0, 1),
        y: clamp((rect.top - positionBounds.minTop) / availableY, 0, 1)
      };
      try { localStorage.setItem(STORE_DOCK_POSITION, JSON.stringify(state)); } catch (e) {}
    }

    function restoreDockPosition() {
      var state = null;
      try { state = JSON.parse(localStorage.getItem(STORE_DOCK_POSITION) || "null"); } catch (e) {}
      if (state && state.edge === true && (state.side === "left" || state.side === "right")) {
        isAutoDocked = false;
        dockToEdge(state.side, 0, false, false, clamp(state.y, 0, 1));
        return true;
      }
      if (!isDockDragEnabled()) {
        resetDockPosition(false);
        return false;
      }
      if (!state || !isFinite(state.x) || !isFinite(state.y)) return false;

      var rect = dock.getBoundingClientRect();
      var positionBounds = getPositionedViewportBounds(rect.width, rect.height);
      var availableX = Math.max(0, positionBounds.maxLeft - positionBounds.minLeft);
      var availableY = Math.max(0, positionBounds.maxTop - positionBounds.minTop);
      isAutoDocked = false;
      dock.classList.add("is-positioned");
      positionDock(
        positionBounds.minLeft + clamp(state.x, 0, 1) * availableX,
        positionBounds.minTop + clamp(state.y, 0, 1) * availableY
      );
      return true;
    }

    function resetDockPosition(removeStoredPosition) {
      cancelDockMotion();
      if (dragFrameId) {
        window.cancelAnimationFrame(dragFrameId);
        dragFrameId = 0;
      }
      dragPointerId = null;
      dragStart = null;
      suppressedEdgeDragControl = null;
      window.clearTimeout(suppressEdgeDragClickTimer);
      suppressEdgeDragClickTimer = 0;
      isAutoDocked = false;
      dock.classList.remove("is-positioned", "is-dragging", "is-edge-dragging", "is-edge-drag-settling", "is-edge-docked", "is-edge-left", "is-edge-right");
      dock.style.removeProperty("left");
      dock.style.removeProperty("top");
      dock.style.removeProperty("right");
      dock.style.removeProperty("bottom");
      dock.style.removeProperty("transform");
      syncEdgeToggle(false);
      if (removeStoredPosition) {
        try { localStorage.removeItem(STORE_DOCK_POSITION); } catch (e) {}
      }
    }

    function dockToNearestEdge() {
      isAutoDocked = false;
      var rect = dock.getBoundingClientRect();
      var edgeBounds = getEdgeViewportBounds(rect.width, rect.height);
      var side = rect.left + rect.width / 2 <= edgeBounds.centerX ? "left" : "right";
      dockToEdge(side, rect.top, true);
    }

    function settleDockAfterDrag(completedDrag) {
      settleEdgeDockAfterDrag(completedDrag);
    }

    function settleEdgeDockAfterDrag(completedDrag, requestedSide) {
      var rect = dock.getBoundingClientRect();
      var edgeBounds = getEdgeViewportBounds(rect.width, rect.height);
      var viewport = getDockViewportMetrics();
      var side = requestedSide === "left" || requestedSide === "right"
        ? requestedSide
        : (completedDrag.lastPointerX <= viewport.left + viewport.width / 2 ? "left" : "right");
      var targetLeft = side === "left" ? edgeBounds.minLeft : edgeBounds.maxLeft;
      var snapDistance = Math.abs(rect.left - targetLeft);
      var applyEdgePosition = function () {
        applyCollapsedState(true);
        dock.classList.add("is-positioned", "is-edge-docked");
        dock.classList.toggle("is-edge-left", side === "left");
        dock.classList.toggle("is-edge-right", side === "right");
        var edgeRect = dock.getBoundingClientRect();
        var finalBounds = getEdgeViewportBounds(edgeRect.width, edgeRect.height);
        var requestedTop = isFinite(completedDrag.rawNextTop) ? completedDrag.rawNextTop : completedDrag.nextTop;
        var top = clamp(requestedTop, finalBounds.minTop, finalBounds.maxTop);
        dock.style.top = top.toFixed(1) + "px";
        dock.style.bottom = "auto";
        if (side === "left") {
          dock.style.left = finalBounds.minLeft.toFixed(1) + "px";
          dock.style.right = "auto";
        } else {
          dock.style.left = finalBounds.maxLeft.toFixed(1) + "px";
          dock.style.right = "auto";
        }
        syncEdgeToggle(true);
        announceDockPosition(side, top, edgeRect.width, edgeRect.height);
      };

      if (completedDrag.edge !== false && snapDistance < 0.5) {
        applyEdgePosition();
        settleDockLayout(true, true);
        return;
      }

      animateDockMutation(
        applyEdgePosition,
        "is-edge-drag-settling",
        Math.min(260, Math.max(160, 150 + snapDistance * 0.12)),
        { persist: true }
      );
    }

    function moveEdgeDockWithKeyboard(key, largeStep) {
      var rect = dock.getBoundingClientRect();
      var edgeBounds = getEdgeViewportBounds(rect.width, rect.height);
      var step = largeStep ? 64 : 24;
      var side = dock.classList.contains("is-edge-left") ? "left" : "right";
      var nextSide = side;
      var nextTop = rect.top;

      if (key === "ArrowUp") nextTop = clamp(rect.top - step, edgeBounds.minTop, edgeBounds.maxTop);
      else if (key === "ArrowDown") nextTop = clamp(rect.top + step, edgeBounds.minTop, edgeBounds.maxTop);
      else if (key === "Home") nextTop = edgeBounds.minTop;
      else if (key === "End") nextTop = edgeBounds.maxTop;
      else if (key === "ArrowLeft") nextSide = "left";
      else if (key === "ArrowRight") nextSide = "right";

      settleEdgeDockAfterDrag({
        nextLeft: rect.left,
        nextTop: nextTop,
        width: rect.width,
        height: rect.height
      }, nextSide);
    }

    function announceDockPosition(side, top, width, height) {
      if (!dockStatusEl) return;
      var edgeBounds = getEdgeViewportBounds(width, height);
      var availableY = Math.max(1, edgeBounds.maxTop - edgeBounds.minTop);
      var ratio = clamp((top - edgeBounds.minTop) / availableY, 0, 1);
      var verticalLabel = ratio < 0.34 ? "上方" : (ratio > 0.66 ? "下方" : "中部");
      dockStatusEl.textContent = "播放器已移到" + (side === "left" ? "左侧" : "右侧") + verticalLabel;
    }

    function dockToEdge(side, top, persist, animate, normalizedY) {
      side = side === "left" ? "left" : "right";
      animateDockMutation(function () {
        applyCollapsedState(true);
        dock.classList.add("is-positioned", "is-edge-docked");
        dock.classList.toggle("is-edge-left", side === "left");
        dock.classList.toggle("is-edge-right", side === "right");
        var edgeRect = dock.getBoundingClientRect();
        var edgeBounds = getEdgeViewportBounds(edgeRect.width, edgeRect.height);
        var edgeTop = isFinite(top) ? clamp(top, edgeBounds.minTop, edgeBounds.maxTop) : edgeBounds.minTop;
        if (isFinite(normalizedY)) {
          edgeTop = edgeBounds.minTop + clamp(normalizedY, 0, 1) * Math.max(0, edgeBounds.maxTop - edgeBounds.minTop);
        }
        dock.style.top = edgeTop.toFixed(1) + "px";
        dock.style.bottom = "auto";
        if (side === "left") {
          dock.style.left = edgeBounds.minLeft.toFixed(1) + "px";
          dock.style.right = "auto";
        } else {
          dock.style.left = edgeBounds.maxLeft.toFixed(1) + "px";
          dock.style.right = "auto";
        }
        syncEdgeToggle(true);
      }, "is-edge-transitioning", 260, { instant: animate === false, persist: persist });
    }

    function clampEdgeDockPosition() {
      if (!dock.classList.contains("is-edge-docked")) return;
      var rect = dock.getBoundingClientRect();
      var edgeBounds = getEdgeViewportBounds(rect.width, rect.height);
      dock.style.top = clamp(rect.top, edgeBounds.minTop, edgeBounds.maxTop).toFixed(1) + "px";
      dock.style.bottom = "auto";
      if (dock.classList.contains("is-edge-left")) {
        dock.style.left = edgeBounds.minLeft.toFixed(1) + "px";
        dock.style.right = "auto";
      } else {
        dock.style.left = edgeBounds.maxLeft.toFixed(1) + "px";
        dock.style.right = "auto";
      }
    }

    function getEdgeViewportBounds(width, height) {
      var viewport = getDockViewportMetrics();
      var minLeft = viewport.left + viewport.safeLeft;
      var maxLeft = Math.max(minLeft, viewport.left + viewport.width - viewport.safeRight - width);
      var minTop = viewport.top + viewport.safeTop + 12;
      var maxTop = Math.max(minTop, viewport.top + viewport.height - viewport.safeBottom - height - 12);
      return {
        minLeft: minLeft,
        maxLeft: maxLeft,
        minTop: minTop,
        maxTop: maxTop,
        centerX: viewport.left + viewport.width / 2
      };
    }

    function getPositionedViewportBounds(width, height) {
      var viewport = getDockViewportMetrics();
      var margin = 12;
      var minLeft = viewport.left + viewport.safeLeft + margin;
      var maxLeft = Math.max(minLeft, viewport.left + viewport.width - viewport.safeRight - width - margin);
      var minTop = viewport.top + viewport.safeTop + margin;
      var maxTop = Math.max(minTop, viewport.top + viewport.height - viewport.safeBottom - height - margin);
      return { minLeft: minLeft, maxLeft: maxLeft, minTop: minTop, maxTop: maxTop };
    }

    function getDockViewportMetrics() {
      var styles = window.getComputedStyle(dock);
      var safeTop = parseFloat(styles.getPropertyValue("--music-safe-top")) || 0;
      var safeBottom = parseFloat(styles.getPropertyValue("--music-safe-bottom")) || 0;
      var safeLeft = parseFloat(styles.getPropertyValue("--music-safe-left")) || 0;
      var safeRight = parseFloat(styles.getPropertyValue("--music-safe-right")) || 0;
      var viewport = window.visualViewport;
      var viewportLeft = viewport ? viewport.offsetLeft : 0;
      var viewportTop = viewport ? viewport.offsetTop : 0;
      var viewportWidth = viewport ? viewport.width : window.innerWidth;
      var viewportHeight = viewport ? viewport.height : window.innerHeight;
      return {
        left: viewportLeft,
        top: viewportTop,
        width: viewportWidth,
        height: viewportHeight,
        safeTop: safeTop,
        safeBottom: safeBottom,
        safeLeft: safeLeft,
        safeRight: safeRight
      };
    }

    function releaseDockFromEdge() {
      if (!dock.classList.contains("is-edge-docked")) return;
      isAutoDocked = false;
      var side = dock.classList.contains("is-edge-left") ? "left" : "right";
      var rect = dock.getBoundingClientRect();
      var persistExpandedPosition = isDockDragEnabled();
      if (!persistExpandedPosition) {
        try { localStorage.removeItem(STORE_DOCK_POSITION); } catch (e) {}
      }

      animateDockMutation(function () {
        dock.classList.remove("is-edge-docked", "is-edge-left", "is-edge-right");
        syncEdgeToggle(false);
        applyCollapsedState(false);
        var expandedRect = dock.getBoundingClientRect();
        var bounds = getPositionedViewportBounds(expandedRect.width, expandedRect.height);
        dock.style.top = clamp(rect.top, bounds.minTop, bounds.maxTop).toFixed(1) + "px";
        dock.style.bottom = "auto";
        dock.style.left = (side === "left" ? bounds.minLeft : bounds.maxLeft).toFixed(1) + "px";
        dock.style.right = "auto";
      }, "is-edge-transitioning", 280, { persist: persistExpandedPosition });
    }

    function syncEdgeToggle(docked) {
      if (!edgeToggle) return;
      edgeToggle.setAttribute("aria-pressed", docked ? "true" : "false");
      edgeToggle.setAttribute("aria-label", docked ? "展开播放器" : "贴边收起播放器");
      edgeToggle.setAttribute("title", docked ? "展开播放器 · 方向键可移动" : "贴边收起");
      if (docked) edgeToggle.setAttribute("aria-keyshortcuts", "ArrowUp ArrowDown ArrowLeft ArrowRight Home End");
      else edgeToggle.removeAttribute("aria-keyshortcuts");
      if (dragHandle) dragHandle.setAttribute("title", docked ? "上下拖曳或拖到另一侧" : "拖曳移动播放器 · 双击归位");
    }

    function seekToRange() {
      if (!isFinite(audio.duration) || audio.duration <= 0) return;
      var ratio = clamp(parseFloat(seek.value) / 1000, 0, 1);
      audio.currentTime = ratio * audio.duration;
      dock.style.setProperty("--seek", (ratio * 100).toFixed(3) + "%");
      if (currentEl) currentEl.textContent = formatTime(audio.currentTime);
      updateMediaPosition(true);
    }

    function updateProgress(forceMediaSession) {
      var duration = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
      var current = isFinite(audio.currentTime) ? audio.currentTime : 0;
      var ratio = duration ? clamp(current / duration, 0, 1) : 0;
      if (!seeking) seek.value = String(Math.round(ratio * 1000));
      dock.style.setProperty("--seek", (ratio * 100).toFixed(3) + "%");
      if (currentEl) currentEl.textContent = formatTime(current);
      if (durationEl && duration) durationEl.textContent = formatTime(duration);
      updateMediaPosition(forceMediaSession);
    }

    function updateBuffered() {
      var duration = isFinite(audio.duration) && audio.duration > 0 ? audio.duration : 0;
      var end = 0;
      if (duration && audio.buffered && audio.buffered.length) {
        try { end = audio.buffered.end(audio.buffered.length - 1); } catch (e) {}
      }
      var ratio = duration ? clamp(end / duration, 0, 1) : 0;
      dock.style.setProperty("--buffered", (ratio * 100).toFixed(3) + "%");
    }

    function setVolumePaint(value) {
      dock.style.setProperty("--volume", (clamp(value, 0, 1) * 100).toFixed(1) + "%");
    }

    function syncMute() {
      var muted = desiredMuted || audio.volume === 0;
      dock.classList.toggle("is-muted", muted);
      if (mute) {
        mute.setAttribute("aria-pressed", muted ? "true" : "false");
        mute.setAttribute("aria-label", muted ? "取消静音" : "静音");
      }
    }

    function savePosition() {
      if (!isFinite(audio.currentTime)) return;
      var savedTime = audio.ended && currentTrackIndex === tracks.length - 1 ? 0 : audio.currentTime;
      try {
        sessionStorage.setItem(SESSION_TIME, String(savedTime));
        sessionStorage.setItem(SESSION_TRACK, String(currentTrackIndex));
      } catch (e) {}
    }

    function setPlaybackIntent(playing) {
      try { sessionStorage.setItem(SESSION_PLAYING, playing ? "1" : "0"); } catch (e) {}
    }

    function setUserPaused(paused) {
      try { sessionStorage.setItem(SESSION_USER_PAUSED, paused ? "1" : "0"); } catch (e) {}
    }

    function persistPlaybackSession(playing) {
      savePosition();
      setPlaybackIntent(typeof playing === "boolean" ? playing : hasPlaybackIntent());
    }

    function hasPlaybackIntent() {
      return pendingTrackAutoplay || safePlaybackRequested || (!audio.paused && !audio.ended);
    }

    function scheduleVisualizerResize(delay) {
      window.clearTimeout(visualizerResizeTimer);
      visualizerResizeTimer = window.setTimeout(function resizeWhenStable() {
        if (dock.classList.contains("is-layout-transitioning")) {
          visualizerResizeTimer = window.setTimeout(resizeWhenStable, 80);
          return;
        }
        visualizerResizeTimer = 0;
        resizeVisualizer();
      }, Math.max(0, delay || 0));
    }

    function resizeVisualizer() {
      if (!canvasContext || !canvas) return;
      if (dock.classList.contains("is-layout-transitioning")) {
        scheduleVisualizerResize(80);
        return;
      }
      var rect = canvas.getBoundingClientRect();
      var width = Math.max(1, Math.round(rect.width));
      var height = Math.max(1, Math.round(rect.height));
      var ratio = Math.min(2, window.devicePixelRatio || 1);
      var pixelWidth = Math.max(1, Math.round(width * ratio));
      var pixelHeight = Math.max(1, Math.round(height * ratio));

      visualizerWidth = width;
      visualizerHeight = height;
      if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
        canvas.width = pixelWidth;
        canvas.height = pixelHeight;
        canvasContext.setTransform(ratio, 0, 0, ratio, 0, 0);
      }
      drawIdleVisualizer();
    }

    function startRenderLoop() {
      if (frameId) cancelAnimationFrame(frameId);
      lastProgressPaint = 0;
      lastVisualizerPaint = 0;
      var render = function (timestamp) {
        if (audio.paused || audio.ended) {
          frameId = 0;
          return;
        }
        if (!seeking && timestamp - lastProgressPaint >= 80) {
          updateProgress(false);
          lastProgressPaint = timestamp;
        }
        if (
          analyser &&
          frequencyData &&
          !reducedMotion &&
          doc.visibilityState !== "hidden" &&
          !dock.classList.contains("is-layout-transitioning") &&
          !dock.classList.contains("is-collapsed") &&
          !dock.classList.contains("is-edge-docked") &&
          timestamp - lastVisualizerPaint >= 33
        ) {
          drawActiveVisualizer();
          lastVisualizerPaint = timestamp;
        }
        frameId = requestAnimationFrame(render);
      };
      frameId = requestAnimationFrame(render);
    }

    function ensureAudioGraph() {
      if (!canvasContext || audioGraphPromise) return;
      var AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;
      try {
        if (!audioContext) audioContext = new AudioContextClass();
        var resume = audioContext.state === "suspended" ? audioContext.resume() : Promise.resolve();
        audioGraphPromise = Promise.resolve(resume).then(function () {
          if (audioContext.state !== "running") {
            audioGraphPromise = null;
            return;
          }
          var capture = audio.captureStream || audio.mozCaptureStream;
          // captureStream keeps the <audio> element on its native playback
          // path. Unlike createMediaElementSource, an unsupported/suspended
          // visualizer therefore cannot interrupt the music.
          if (!capture) {
            audioGraphPromise = null;
            return;
          }
          if (!audioCapture) audioCapture = capture.call(audio);
          if (!audioSource) audioSource = audioContext.createMediaStreamSource(audioCapture);
          if (!analyser) {
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 128;
            analyser.smoothingTimeConstant = 0.84;
            frequencyData = new Uint8Array(analyser.frequencyBinCount);
            silentGain = audioContext.createGain();
            silentGain.gain.value = 0;
            audioSource.connect(analyser);
            analyser.connect(silentGain);
            silentGain.connect(audioContext.destination);
          }
          audioGraphPromise = null;
        }).catch(function () {
          audioGraphPromise = null;
        });
      } catch (e) {
        audioGraphPromise = null;
        analyser = null;
        frequencyData = null;
      }
    }

    function drawIdleVisualizer() {
      if (!canvasContext || !canvas || !visualizerWidth || !visualizerHeight) return;
      var width = visualizerWidth;
      var height = visualizerHeight;
      canvasContext.clearRect(0, 0, width, height);
      var gradient = canvasContext.createLinearGradient(0, height, width, 0);
      gradient.addColorStop(0, "rgba(141,124,255,0.02)");
      gradient.addColorStop(0.55, "rgba(141,124,255,0.22)");
      gradient.addColorStop(1, "rgba(89,227,255,0.46)");
      canvasContext.fillStyle = gradient;
      var count = 34;
      var gap = 4;
      var barWidth = Math.max(2, (width - gap * (count - 1)) / count);
      for (var i = 0; i < count; i++) {
        var wave = (Math.sin(i * 0.72) + 1) * 0.5;
        var barHeight = 5 + wave * height * 0.16;
        roundedBar(i * (barWidth + gap), height - barHeight, barWidth, barHeight, Math.min(3, barWidth / 2));
      }
    }

    function drawActiveVisualizer() {
      if (!canvasContext || !canvas || !analyser || !frequencyData || reducedMotion || !visualizerWidth || !visualizerHeight) return;
      analyser.getByteFrequencyData(frequencyData);
      var width = visualizerWidth;
      var height = visualizerHeight;
      canvasContext.clearRect(0, 0, width, height);
      var gradient = canvasContext.createLinearGradient(width * 0.25, height, width, 0);
      gradient.addColorStop(0, "rgba(141,124,255,0.08)");
      gradient.addColorStop(0.55, "rgba(141,124,255,0.58)");
      gradient.addColorStop(1, "rgba(89,227,255,0.88)");
      canvasContext.fillStyle = gradient;
      var count = Math.min(42, frequencyData.length);
      var gap = 3;
      var barWidth = Math.max(2, (width - gap * (count - 1)) / count);
      for (var i = 0; i < count; i++) {
        var sample = frequencyData[Math.min(frequencyData.length - 1, Math.floor(i * 1.28))] / 255;
        var shaped = Math.pow(sample, 1.32);
        var barHeight = 4 + shaped * height * 0.78;
        roundedBar(i * (barWidth + gap), height - barHeight, barWidth, barHeight, Math.min(3, barWidth / 2));
      }
    }

    function roundedBar(x, y, width, height, radius) {
      if (canvasContext.roundRect) {
        canvasContext.beginPath();
        canvasContext.roundRect(x, y, width, height, radius);
        canvasContext.fill();
      } else {
        canvasContext.fillRect(x, y, width, height);
      }
    }

    function setupMediaSession() {
      if (!("mediaSession" in navigator)) return;
      try {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: dock.getAttribute("data-track-title") || "King Without a Crown",
          artist: dock.getAttribute("data-track-artist") || "xueyuan",
          album: "xueyuan · AI Music"
        });
        navigator.mediaSession.setActionHandler("play", function () {
          setUserPaused(false);
          playAudio(false, false);
        });
        navigator.mediaSession.setActionHandler("pause", function () {
          setUserPaused(true);
          if (safePlaybackRequested) cancelSafePlayback();
          else audio.pause();
        });
        navigator.mediaSession.setActionHandler("seekbackward", function (details) {
          audio.currentTime = Math.max(0, audio.currentTime - (details.seekOffset || 10));
        });
        navigator.mediaSession.setActionHandler("seekforward", function (details) {
          audio.currentTime = Math.min(audio.duration || Infinity, audio.currentTime + (details.seekOffset || 10));
        });
        navigator.mediaSession.setActionHandler("seekto", function (details) {
          if (typeof details.seekTime === "number") audio.currentTime = details.seekTime;
        });
        navigator.mediaSession.setActionHandler("previoustrack", function () {
          if (audio.currentTime > 3) audio.currentTime = 0;
          else switchTrack((currentTrackIndex - 1 + tracks.length) % tracks.length, !audio.paused);
        });
        navigator.mediaSession.setActionHandler("nexttrack", function () {
          switchTrack((currentTrackIndex + 1) % tracks.length, !audio.paused);
        });
      } catch (e) {}
    }

    function updateMediaPosition(force) {
      if (!("mediaSession" in navigator) || !navigator.mediaSession.setPositionState) return;
      if (!isFinite(audio.duration) || audio.duration <= 0) return;
      var now = performance.now();
      if (!force && now - lastPositionUpdate < 1000) return;
      lastPositionUpdate = now;
      try {
        navigator.mediaSession.setPositionState({
          duration: audio.duration,
          playbackRate: audio.playbackRate,
          position: clamp(audio.currentTime, 0, audio.duration)
        });
      } catch (e) {}
    }
  });

  function formatTime(seconds) {
    if (!isFinite(seconds) || seconds < 0) return "0:00";
    var whole = Math.floor(seconds);
    var minutes = Math.floor(whole / 60);
    var remainder = whole % 60;
    return minutes + ":" + (remainder < 10 ? "0" : "") + remainder;
  }

  function clamp(value, min, max) {
    if (!isFinite(value)) return min;
    return Math.min(max, Math.max(min, value));
  }

  function readNumber(storage, key, fallback, min, max) {
    try {
      var value = parseFloat(storage.getItem(key));
      return isFinite(value) ? clamp(value, min, max) : fallback;
    } catch (e) {
      return fallback;
    }
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
  var landingCleanups = [];
  // 触屏 / 粗指针设备：不启用 3D tilt 与神经网络背景，避免性能浪费与残留态
  var isTouchDevice =
    (window.matchMedia && window.matchMedia("(hover: none) and (pointer: coarse)").matches) ||
    ("ontouchstart" in window && navigator.maxTouchPoints > 0);
  var isNarrowScreen = window.matchMedia && window.matchMedia("(max-width: 920px)").matches;

  function bootstrap() {
    while (landingCleanups.length) {
      try { landingCleanups.pop()(); } catch (e) {}
    }

    var isLanding = doc.body.classList.contains("is-landing");
    addCleanup(initTyped());
    addCleanup(initCounters());
    initSkillClickFeedback();
    if (!isTouchDevice) initTilt();
    if (!isTouchDevice) initSkillSpotlight();
    try {
      if (isLanding && !isTouchDevice && !isNarrowScreen) addCleanup(initNeural());
    } catch (err) {
      // 神经网络背景失败不应阻断其他交互
      if (window.console) console.warn("[site] initNeural failed:", err);
    }
    try { initAvatarSpin(); } catch (err) {
      if (window.console) console.warn("[site] initAvatarSpin failed:", err);
    }
  }

  function addCleanup(cleanup) {
    if (typeof cleanup === "function") landingCleanups.push(cleanup);
  }

  if (doc.readyState !== "loading") bootstrap();
  else doc.addEventListener("DOMContentLoaded", bootstrap);
  doc.addEventListener("aurora:page-ready", bootstrap);

  // ---------- Typed text ----------
  function initTyped() {
    var nodes = doc.querySelectorAll("[data-typed]");
    var states = [];
    nodes.forEach(function (el) {
      var raw = el.getAttribute("data-typed-strings") || "[]";
      var lines;
      try { lines = JSON.parse(raw); } catch (e) { lines = []; }
      if (!lines.length) return;

      if (prefersReducedMotion) { el.textContent = lines[0]; return; }

      var li = 0, ci = 0, deleting = false;
      var state = { timer: 0, cancelled: false };
      states.push(state);
      function schedule(delay) {
        state.timer = setTimeout(tick, delay);
      }
      function tick() {
        if (state.cancelled || !el.isConnected) return;
        var cur = lines[li];
        if (!deleting) {
          ci++;
          el.textContent = cur.slice(0, ci);
          if (ci === cur.length) {
            deleting = true;
            schedule(1600);
            return;
          }
          schedule(60 + Math.random() * 40);
        } else {
          ci--;
          el.textContent = cur.slice(0, ci);
          if (ci === 0) {
            deleting = false;
            li = (li + 1) % lines.length;
            schedule(200);
            return;
          }
          schedule(26);
        }
      }
      tick();
    });
    return function () {
      states.forEach(function (state) {
        state.cancelled = true;
        if (state.timer) clearTimeout(state.timer);
      });
    };
  }

  // ---------- Counters ----------
  function initCounters() {
    var els = doc.querySelectorAll("[data-counter]");
    if (!els.length) return null;
    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      els.forEach(function (el) { el.textContent = el.getAttribute("data-counter"); });
      return null;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        animateCounter(e.target);
        io.unobserve(e.target);
      });
    }, { threshold: 0.4 });
    els.forEach(function (el) { io.observe(el); });
    return function () { io.disconnect(); };
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

  // ---------- Skill card click feedback ----------
  function initSkillClickFeedback() {
    var cards = doc.querySelectorAll(".skill-card");
    cards.forEach(function (card) {
      card.addEventListener("click", function (e) {
        var r = card.getBoundingClientRect();
        var hasPointerPosition = e.clientX !== 0 || e.clientY !== 0;
        var x = hasPointerPosition ? e.clientX - r.left : r.width / 2;
        var y = hasPointerPosition ? e.clientY - r.top : r.height / 2;

        card.style.setProperty("--click-x", x + "px");
        card.style.setProperty("--click-y", y + "px");

        // 连续点击时先清除再强制重排，让动画可以从头播放。
        card.classList.remove("is-clicked");
        void card.offsetWidth;
        card.classList.add("is-clicked");
      });

      card.addEventListener("animationend", function (e) {
        if (e.target === card && e.animationName === "skill-card-click") {
          card.classList.remove("is-clicked");
        }
      });
    });
  }

  // ---------- Neural network background ----------
  function initNeural() {
    var canvas = doc.querySelector(".bg-neural");
    if (!canvas || !canvas.getContext) return null;
    if (prefersReducedMotion) return null;

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var nodes = [];
    var mouse = { x: -9999, y: -9999, active: false };
    var rafId = 0;
    var running = false;

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.style.width = w + "px";
      canvas.style.height = h + "px";
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
      if (!running || doc.hidden) return;
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

    function start() {
      if (running || doc.hidden) return;
      running = true;
      rafId = requestAnimationFrame(step);
    }

    function stop() {
      running = false;
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }

    function onMove(e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.active = true;
    }
    function onLeave() { mouse.active = false; }
    var onResize = debounce(resize, 150);
    var onVisibility = function () {
      if (doc.hidden) stop();
      else start();
    };

    window.addEventListener("resize", onResize, { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    doc.documentElement.addEventListener("pointerleave", onLeave, { passive: true });
    window.addEventListener("blur", onLeave);

    // Visibility pause
    doc.addEventListener("visibilitychange", onVisibility);

    resize();
    start();
    return function () {
      stop();
      window.removeEventListener("resize", onResize);
      window.removeEventListener("pointermove", onMove);
      doc.documentElement.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("blur", onLeave);
      doc.removeEventListener("visibilitychange", onVisibility);
      ctx.clearRect(0, 0, w, h);
    };
  }

  function debounce(fn, ms) {
    var t;
    return function () {
      var args = arguments, ctx = this;
      clearTimeout(t);
      t = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  // ========== Avatar hover spin ==========
  // 默认不动；鼠标移上去开始旋转，移开后平滑回到 0deg。
  function initAvatarSpin() {
    if (initAvatarSpin._done) return;
    var avatar = doc.querySelector(".avatar");
    if (!avatar) return;
    initAvatarSpin._done = true;

    var reduced = false;
    try {
      reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    } catch (e) {}
    if (reduced) return;

    var angle = 0;          // 当前角度（deg，可累积）
    var speed = 0;          // 当前角速度（deg/s）
    var targetSpeed = 0;    // 目标角速度（deg/s）
    var TARGET_SPEED = 360 / 14; // 与原动画一致：14s 一圈
    var ACCEL = 90;         // 速度变化（deg/s²），影响进入/退出节奏
    var RETURN_RATE = 6;    // 回正阶段每秒按 6 倍剩余角度衰减
    var lastT = 0;
    var rafId = 0;
    var running = false;

    function step(now) {
      if (!lastT) lastT = now;
      var dt = Math.min(0.05, (now - lastT) / 1000); // 限制单帧 dt，防卡顿后跳变
      lastT = now;

      // 平滑逼近目标角速度
      if (speed < targetSpeed) {
        speed = Math.min(targetSpeed, speed + ACCEL * dt);
      } else if (speed > targetSpeed) {
        speed = Math.max(targetSpeed, speed - ACCEL * dt);
      }

      if (speed > 0) {
        angle = (angle + speed * dt) % 360;
      } else if (targetSpeed === 0) {
        // 回正：让角度沿最近方向指数衰减到 0
        var norm = ((angle % 360) + 540) % 360 - 180; // (-180, 180]
        if (Math.abs(norm) < 0.05) {
          angle = 0;
        } else {
          angle = norm * Math.exp(-RETURN_RATE * dt);
        }
      }

      avatar.style.transform = "rotate(" + angle.toFixed(3) + "deg)";

      // 判断是否还需要继续动画
      var atRest = (targetSpeed === 0 && speed === 0 && angle === 0);
      if (atRest) {
        running = false;
        rafId = 0;
        lastT = 0;
        return;
      }
      rafId = requestAnimationFrame(step);
    }

    function ensureRunning() {
      if (running) return;
      running = true;
      lastT = 0;
      rafId = requestAnimationFrame(step);
    }

    avatar.addEventListener("mouseenter", function () {
      targetSpeed = TARGET_SPEED;
      ensureRunning();
    });
    avatar.addEventListener("mouseleave", function () {
      targetSpeed = 0;
      ensureRunning();
    });
    // 触屏 / 键盘焦点也给点反馈
    avatar.addEventListener("focus", function () {
      targetSpeed = TARGET_SPEED;
      ensureRunning();
    });
    avatar.addEventListener("blur", function () {
      targetSpeed = 0;
      ensureRunning();
    });

    // 标签页隐藏时暂停，避免后台空转
    doc.addEventListener("visibilitychange", function () {
      if (doc.hidden) {
        if (rafId) cancelAnimationFrame(rafId);
        running = false;
        lastT = 0;
      } else if (targetSpeed !== 0 || angle !== 0 || speed !== 0) {
        ensureRunning();
      }
    });
  }

  if (doc.readyState === "loading") {
    doc.addEventListener("DOMContentLoaded", function () {
      // 兜底：如果 bootstrap 因其他原因没跑到 avatar，这里再尝试一次
      if (!initAvatarSpin._done) initAvatarSpin();
    });
  }
})();


/* ==========================================================================
   About page enhancements · 关于页专属交互
   - 全息头像旁的字符雨（canvas）
   - 在线时长 (uptime since 2015) 滚动数字
   - 能力雷达图渲染 + 进入视口绘制 + 互动联动
   - 时间线滚动激活
   - manifesto 卡片 spotlight + 轻量 tilt
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var prefersReducedMotion =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouchDevice =
    (window.matchMedia && window.matchMedia("(hover: none) and (pointer: coarse)").matches) ||
    ("ontouchstart" in window && navigator.maxTouchPoints > 0);
  var aboutCleanups = [];

  function ready(fn) {
    if (doc.readyState !== "loading") fn();
    else doc.addEventListener("DOMContentLoaded", fn);
  }

  function bootstrapAbout() {
    while (aboutCleanups.length) {
      try { aboutCleanups.pop()(); } catch (e) {}
    }
    // 时间轴组件不只用于「关于」页，首页成长路线也复用它，因此先于 about 门禁初始化
    addCleanup(initTimeline());

    if (!doc.querySelector("[data-about-hero]")) return;

    addCleanup(initHoloRain());
    addCleanup(initUptime());
    addCleanup(initRadar());
    initManifestoSpotlight();
    initSnapshot();
  }

  function addCleanup(cleanup) {
    if (typeof cleanup === "function") aboutCleanups.push(cleanup);
  }

  ready(bootstrapAbout);
  doc.addEventListener("aurora:page-ready", bootstrapAbout);

  // ---------- Core profile snapshot · 级联滑入 + 字符解码 ----------
  function initSnapshot() {
    var section = doc.querySelector("[data-about-snapshot]");
    if (!section) return;
    var lines = section.querySelectorAll(".snap-line");
    if (!lines.length) return;
    var statusEl = section.querySelector("[data-snapshot-status]");
    var statusTimer = null;
    var fallbackTimer = null;

    function setStatus(state) {
      if (!statusEl) return;
      if (statusTimer) { clearInterval(statusTimer); statusTimer = null; }
      statusEl.classList.remove("is-thinking", "is-generating", "is-done");
      if (state === "thinking" || state === "generating") {
        statusEl.classList.add(state === "thinking" ? "is-thinking" : "is-generating");
        var label = state === "thinking" ? "thinking" : "generating";
        var step = 0;
        var render = function () {
          var dots = ".".repeat((step % 3) + 1);
          statusEl.textContent = "▍ " + label + dots;
          step++;
        };
        render();
        statusTimer = setInterval(render, 380);
      } else if (state === "done") {
        statusEl.classList.add("is-done");
        statusEl.textContent = "✓ done";
      } else {
        statusEl.textContent = "";
      }
    }

    function revealStatic() {
      lines.forEach(function (li) {
        var val = li.querySelector(".snap-val");
        if (val) val.textContent = val.getAttribute("data-text") || "";
        li.classList.add("is-revealed");
      });
      section.classList.remove("is-pending", "is-typing");
      section.classList.add("is-done");
      setStatus("done");
    }

    // 减少动效偏好 / 无 IO 支持：直接呈现全部内容
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      revealStatic();
      return;
    }

    section.classList.add("is-pending");
    var started = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !started) {
          started = true;
          if (fallbackTimer) clearTimeout(fallbackTimer);
          io.unobserve(e.target);
          runSequence();
        }
      });
    }, { threshold: 0.08 });
    io.observe(section);
    fallbackTimer = setTimeout(function () {
      if (started) return;
      started = true;
      io.unobserve(section);
      revealStatic();
    }, 8000);

    function runSequence() {
      section.classList.add("is-typing");
      // 先「思考」，再「生成」，贴近推理型大模型的两段式过程
      setStatus("thinking");
      setTimeout(startGenerating, 900);
    }

    function startGenerating() {
      setStatus("generating");
      var stagger = 150;        // 行与行之间的启动间隔（级联，不必等上一行结束）
      var lastEnd = 0;
      lines.forEach(function (li, i) {
        var startAt = i * stagger;
        setTimeout(function () {
          li.classList.add("is-revealed");
          scramble(li.querySelector(".snap-val"));
        }, startAt);
        // 估算每行解码结束时间（解码约 28 帧 ≈ 460ms）
        lastEnd = startAt + 520;
      });
      setTimeout(function () {
        section.classList.remove("is-pending", "is-typing");
        section.classList.add("is-done");
        setStatus("done");
      }, lastEnd + 200);
    }

    function scramble(el) {
      if (!el) return;
      var full = el.getAttribute("data-text") || "";
      var glyphs = "ABCDEFGHJKLMNPQRSTUVWXYZ0123456789#%&$@/<>*=+";
      el.classList.add("is-decoding");
      var frame = 0;
      // 每个字符在第 N 帧定格，制造从左到右逐渐稳定的解码感
      var settleAt = [];
      for (var i = 0; i < full.length; i++) {
        settleAt.push(Math.floor(i * 0.9) + 4 + Math.floor(Math.random() * 5));
      }
      (function tick() {
        var out = "";
        var done = 0;
        for (var i = 0; i < full.length; i++) {
          var ch = full.charAt(i);
          if (ch === " ") { out += " "; done++; continue; }
          if (frame >= settleAt[i]) { out += ch; done++; }
          else { out += glyphs.charAt((Math.random() * glyphs.length) | 0); }
        }
        el.textContent = out;
        frame++;
        if (done < full.length) {
          requestAnimationFrame(tick);
        } else {
          el.textContent = full;
          el.classList.remove("is-decoding");
        }
      })();
    }
  }

  // ---------- Holographic rain (matrix-style) ----------
  function initHoloRain() {
    if (prefersReducedMotion || isTouchDevice) return null;
    var canvas = doc.querySelector(".holo-rain");
    if (!canvas || !canvas.getContext) return null;

    var ctx = canvas.getContext("2d");
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var w = 0, h = 0;
    var cols = [];
    var glyphs = "0123456789ABCDEFアイウエオカキクケコサシスセソナニヌネノΨΩΣ∑∞";
    var rafId = 0;

    function resize() {
      var rect = canvas.getBoundingClientRect();
      w = rect.width;
      h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var fontSize = 14;
      var count = Math.max(8, Math.floor(w / fontSize));
      cols = new Array(count).fill(0).map(function () {
        return {
          y: Math.random() * h,
          speed: 1 + Math.random() * 1.6,
          size: fontSize,
          tail: 12 + Math.floor(Math.random() * 14),
        };
      });
    }

    function step() {
      // fade trail
      ctx.fillStyle = "rgba(8, 12, 28, 0.18)";
      ctx.fillRect(0, 0, w, h);

      var theme = doc.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      var head = theme === "light" ? "rgba(85,102,255,0.95)" : "rgba(180,210,255,0.95)";
      var body = theme === "light" ? "rgba(85,102,255,0.55)" : "rgba(124,140,255,0.7)";

      ctx.font = "12px JetBrains Mono, ui-monospace, monospace";
      ctx.textBaseline = "top";

      for (var i = 0; i < cols.length; i++) {
        var c = cols[i];
        var x = (i / Math.max(1, cols.length - 1)) * w;
        // head glyph
        ctx.fillStyle = head;
        ctx.fillText(rndGlyph(), x, c.y);
        // tail
        ctx.fillStyle = body;
        for (var k = 1; k < c.tail; k++) {
          var ty = c.y - k * c.size;
          if (ty < -c.size) break;
          if (k > 4 && Math.random() > 0.6) continue;
          ctx.fillText(rndGlyph(), x, ty);
        }
        c.y += c.speed;
        if (c.y > h + c.size * 4) {
          c.y = -Math.random() * h * 0.6;
          c.speed = 1 + Math.random() * 1.6;
        }
      }
      rafId = requestAnimationFrame(step);
    }

    function rndGlyph() {
      return glyphs.charAt((Math.random() * glyphs.length) | 0);
    }

    var ro = ("ResizeObserver" in window) ? new ResizeObserver(resize) : null;
    var onVisibility = function () {
      if (doc.hidden) cancelAnimationFrame(rafId);
      else step();
    };
    if (ro) ro.observe(canvas);
    else window.addEventListener("resize", resize);

    resize();
    step();

    doc.addEventListener("visibilitychange", onVisibility);
    return function () {
      cancelAnimationFrame(rafId);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", resize);
      doc.removeEventListener("visibilitychange", onVisibility);
      ctx.clearRect(0, 0, w, h);
    };
  }

  // ---------- Career time since 2016 ----------
  function initUptime() {
    var el = doc.querySelector("[data-about-uptime]");
    if (!el) return null;
    var start = new Date("2016-01-01T00:00:00+08:00");
    function tick() {
      var now = new Date();
      var diff = Math.max(0, now - start);
      var d = Math.floor(diff / (1000 * 60 * 60 * 24));
      var h = Math.floor((diff / (1000 * 60 * 60)) % 24);
      var m = Math.floor((diff / (1000 * 60)) % 60);
      var s = Math.floor((diff / 1000) % 60);
      el.textContent = d.toLocaleString() + "d " + pad(h) + ":" + pad(m) + ":" + pad(s);
    }
    function pad(n) { return n < 10 ? "0" + n : "" + n; }
    tick();
    var timer = setInterval(tick, 1000);
    return function () { clearInterval(timer); };
  }

  // ---------- Skill radar ----------
  function initRadar() {
    var radar = doc.querySelector("[data-about-radar]");
    if (!radar) return null;
    var svg = radar.querySelector("svg");
    if (!svg) return null;

    var legend = doc.querySelectorAll(".radar-legend li");
    var labels = [];
    var values = []; // out of 100
    legend.forEach(function (li) {
      labels.push(li.getAttribute("data-label") || "");
      values.push(parseFloat(li.getAttribute("data-value")) || 0);
    });
    if (!values.length) return null;

    var R = 150;
    var n = values.length;
    var rings = svg.querySelector(".radar-rings");
    var axes = svg.querySelector(".radar-axes");
    var labelsG = svg.querySelector(".radar-labels");
    var pointsG = svg.querySelector(".radar-points");
    var shape = svg.querySelector(".radar-shape");

    // rings (4 levels)
    rings.innerHTML = "";
    for (var i = 1; i <= 4; i++) {
      var c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      c.setAttribute("cx", "0");
      c.setAttribute("cy", "0");
      c.setAttribute("r", String((R * i) / 4));
      rings.appendChild(c);
    }

    // axes + labels
    axes.innerHTML = "";
    labelsG.innerHTML = "";
    pointsG.innerHTML = "";
    var pts = [];
    for (var k = 0; k < n; k++) {
      var ang = (Math.PI * 2 * k) / n - Math.PI / 2;
      var x = Math.cos(ang) * R;
      var y = Math.sin(ang) * R;

      var line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", "0");
      line.setAttribute("y1", "0");
      line.setAttribute("x2", String(x));
      line.setAttribute("y2", String(y));
      axes.appendChild(line);

      var label = document.createElementNS("http://www.w3.org/2000/svg", "text");
      var lx = Math.cos(ang) * (R + 22);
      var ly = Math.sin(ang) * (R + 22) + 4;
      label.setAttribute("x", String(lx));
      label.setAttribute("y", String(ly));
      label.setAttribute("data-axis", String(k));
      label.textContent = labels[k] || "";
      labelsG.appendChild(label);

      // initial points at center
      var pt = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      pt.setAttribute("r", "5");
      pt.setAttribute("cx", "0");
      pt.setAttribute("cy", "0");
      pt.setAttribute("data-axis", String(k));
      pointsG.appendChild(pt);
      pts.push({ angle: ang, el: pt });
    }

    function setShape(progress) {
      var coords = [];
      for (var k = 0; k < n; k++) {
        var v = values[k] / 100 * progress;
        var x = Math.cos(pts[k].angle) * R * v;
        var y = Math.sin(pts[k].angle) * R * v;
        coords.push(x.toFixed(2) + "," + y.toFixed(2));
        pts[k].el.setAttribute("cx", x.toFixed(2));
        pts[k].el.setAttribute("cy", y.toFixed(2));
      }
      shape.setAttribute("points", coords.join(" "));
    }

    // animate when in viewport
    setShape(0);
    function play() {
      if (prefersReducedMotion) { setShape(1); return; }
      var dur = 1400;
      var start = performance.now();
      function frame(t) {
        var p = Math.min(1, (t - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        setShape(eased);
        if (p < 1) requestAnimationFrame(frame);
      }
      requestAnimationFrame(frame);
    }

    var io = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) {
            play();
            io.unobserve(e.target);
          }
        });
      }, { threshold: 0.4 });
      io.observe(radar);
    } else {
      play();
    }

    // legend hover -> highlight axis
    legend.forEach(function (li, idx) {
      li.addEventListener("mouseenter", function () { highlight(idx); });
      li.addEventListener("mouseleave", function () { highlight(-1); });
      li.addEventListener("focus", function () { highlight(idx); });
      li.addEventListener("blur", function () { highlight(-1); });
    });

    function highlight(idx) {
      pts.forEach(function (p, i) {
        if (i === idx) p.el.classList.add("is-active");
        else p.el.classList.remove("is-active");
      });
      labelsG.querySelectorAll("text").forEach(function (t, i) {
        if (i === idx) t.classList.add("is-active");
        else t.classList.remove("is-active");
      });
      legend.forEach(function (l, i) {
        if (i === idx) l.classList.add("is-active");
        else l.classList.remove("is-active");
      });
    }
    return function () { if (io) io.disconnect(); };
  }

  // ---------- Timeline ----------
  function initTimeline() {
    var timeline = doc.querySelector("[data-about-timeline]");
    if (!timeline) return null;
    var items = timeline.querySelectorAll(".tl-item");
    if (!items.length) return null;
    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      items.forEach(function (it) { it.classList.add("is-in"); });
      return null;
    }

    items.forEach(function (it) {
      var rect = it.getBoundingClientRect();
      if (rect.top < window.innerHeight * 0.9 && rect.bottom > 0) {
        it.classList.add("is-in");
      }
    });
    timeline.classList.add("is-enhanced");

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -10% 0px" });
    items.forEach(function (it) {
      if (!it.classList.contains("is-in")) io.observe(it);
    });
    return function () {
      io.disconnect();
      timeline.classList.remove("is-enhanced");
    };
  }

  // ---------- Manifesto card spotlight + light tilt ----------
  function initManifestoSpotlight() {
    if (isTouchDevice) return;
    var cards = doc.querySelectorAll(".manifesto-card");
    cards.forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var r = card.getBoundingClientRect();
        var px = (e.clientX - r.left) / r.width;
        var py = (e.clientY - r.top) / r.height;
        card.style.setProperty("--mx", (px * 100) + "%");
        card.style.setProperty("--my", (py * 100) + "%");
        if (!prefersReducedMotion) {
          var rx = (py - 0.5) * -6;
          var ry = (px - 0.5) * 6;
          card.style.transform = "translateY(-4px) rotateX(" + rx.toFixed(2) + "deg) rotateY(" + ry.toFixed(2) + "deg)";
        }
      });
      card.addEventListener("mouseleave", function () {
        card.style.transform = "";
        card.style.removeProperty("--mx");
        card.style.removeProperty("--my");
      });
    });
  }
})();
