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
  function applyTheme(theme) {
    var t = theme === "light" ? "light" : "dark";
    root.setAttribute("data-theme", t);
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

      // 移动端默认折叠目录，节省纵向空间
      var isNarrow = window.matchMedia && window.matchMedia('(max-width: 920px)').matches;
      setTocCollapsed(Boolean(isNarrow));

      // 旋屏 / 缩放穿过断点时同步折叠状态，避免横屏 → 竖屏 TOC 还撑开
      // 仅在用户没手动 toggle 过时跟随断点（dataset.userToggled 由点击设置）
      if (window.matchMedia) {
        var mq = window.matchMedia('(max-width: 920px)');
        var onMq = function (e) {
          if (tocEl.dataset.userToggled === '1') return;
          setTocCollapsed(e.matches);
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
   Global background music player
   Native Audio + Pointer-friendly ranges + Media Session + Web Audio visualizer
   ========================================================================== */
(function () {
  "use strict";

  var doc = document;
  var STORE_VOLUME = "aurora-music-volume";
  var STORE_COLLAPSED = "aurora-music-collapsed";
  var STORE_DOCK_POSITION = "aurora-music-dock-position";
  var EDGE_SNAP_DISTANCE = 96;
  var SESSION_TIME = "aurora-music-time";
  var SESSION_PLAYING = "aurora-music-playing";
  var SESSION_TRACK = "aurora-music-track";

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
    var reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var dragPointerId = null;
    var dragStart = null;
    var dockResizeTimer = 0;
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

    try { resumeAfterNavigation = sessionStorage.getItem(SESSION_PLAYING) === "1"; } catch (e) {}

    // A cold visit remains completely idle: do not attach an audio URL until
    // the user presses play. A real continuation still loads immediately so
    // metadataReady() can restore the saved track and position.
    audio.pause();
    audio.loop = false;
    if (resumeAfterNavigation) {
      audio.src = tracks[currentTrackIndex].src;
      try { audio.load(); } catch (e) {}
    }
    syncTrackUI();
    audio.volume = readNumber(localStorage, STORE_VOLUME, 0.72, 0, 1);
    if (volume) volume.value = String(audio.volume);
    setVolumePaint(audio.volume);
    initMusicCache();
    initEmbeddedVideoPause();
    doc.addEventListener("aurora:page-ready", initEmbeddedVideoPause);
    doc.addEventListener("aurora:page-ready", syncDockForCurrentPage);
    syncDockExpansionForCurrentPage();

    toggle.addEventListener("click", function () {
      if (audio.paused) playAudio(false);
      else audio.pause();
    });

    doc.addEventListener("click", function (event) {
      var playButton = event.target.closest && event.target.closest("[data-music-play]");
      if (playButton) {
        if (dock.classList.contains("is-edge-docked")) releaseDockFromEdge();
        setCollapsed(false);
        playAudio(false);
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
        audio.muted = next === 0;
        setVolumePaint(next);
        syncMute();
        try { localStorage.setItem(STORE_VOLUME, String(next)); } catch (e) {}
      });
    }

    if (mute) {
      mute.addEventListener("click", function () {
        audio.muted = !audio.muted;
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
      if (shouldPlaySelectedTrack) {
        window.requestAnimationFrame(function () { playAudio(false); });
      } else if (resumeAfterNavigation && !resumeAttempted) {
        resumeAttempted = true;
        window.requestAnimationFrame(function () { playAudio(true); });
      }
    };

    audio.addEventListener("loadedmetadata", metadataReady);

    audio.addEventListener("durationchange", function () { updateProgress(true); });
    audio.addEventListener("progress", function () {
      updateBuffered();
      maybeCacheCurrentTrack();
    });
    audio.addEventListener("timeupdate", function () { if (!seeking) updateProgress(false); });
    audio.addEventListener("play", function () {
      resumeAfterNavigation = false;
      dock.classList.add("is-playing");
      dock.classList.remove("is-error", "is-resume-pending");
      if (statusEl) statusEl.textContent = defaultStatusText();
      toggle.setAttribute("aria-label", "暂停背景音乐");
      toggle.setAttribute("aria-pressed", "true");
      setPlaybackIntent(true);
      queryCurrentTrackCache();
      maybeCacheCurrentTrack();
      if (navigator.mediaSession) navigator.mediaSession.playbackState = "playing";
      startRenderLoop();
    });
    audio.addEventListener("pause", function () {
      dock.classList.remove("is-playing");
      if (statusEl && !dock.classList.contains("is-resume-pending") && !dock.classList.contains("is-video-paused")) {
        statusEl.textContent = defaultStatusText();
      }
      toggle.setAttribute("aria-label", "播放背景音乐");
      toggle.setAttribute("aria-pressed", "false");
      if (!isPageLeaving && !isTrackSwitching) setPlaybackIntent(false);
      if (navigator.mediaSession) navigator.mediaSession.playbackState = "paused";
      if (frameId) cancelAnimationFrame(frameId);
      frameId = 0;
      drawIdleVisualizer();
      if (!isTrackSwitching) savePosition();
    });
    audio.addEventListener("ended", function () {
      requestCurrentTrackCache();
      switchTrack((currentTrackIndex + 1) % tracks.length, true);
    });
    audio.addEventListener("error", function () {
      if (resumeAfterNavigation && audioLoadRetries < 3) {
        retryAudioLoad();
        return;
      }
      dock.classList.add("is-error");
      toggle.setAttribute("aria-label", "音频加载失败，请稍后重试");
      setPlaybackIntent(false);
    });

    window.addEventListener("pagehide", function () {
      isPageLeaving = true;
      if (leavingPlaybackIntent === null) leavingPlaybackIntent = !audio.paused && !audio.ended;
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
      leavingPlaybackIntent = !audio.paused && !audio.ended;
      persistPlaybackSession(leavingPlaybackIntent);
    }, true);

    if (canvas && canvasContext) {
      var resize = function () {
        var rect = canvas.getBoundingClientRect();
        var ratio = Math.min(2, window.devicePixelRatio || 1);
        canvas.width = Math.max(1, Math.round(rect.width * ratio));
        canvas.height = Math.max(1, Math.round(rect.height * ratio));
        canvasContext.setTransform(ratio, 0, 0, ratio, 0, 0);
        drawIdleVisualizer();
      };
      if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
      else window.addEventListener("resize", resize, { passive: true });
      resize();
    }

    updateProgress(true);
    updateBuffered();
    syncMute();
    initDockDragging();
    if (audio.readyState >= 1) metadataReady();
    else if (resumeAfterNavigation) {
      window.setTimeout(function () {
        if (audio.readyState === 0 && !resumeAttempted) retryAudioLoad();
      }, 320);
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
      var bufferedAhead = bufferedEnd - audio.currentTime;
      var bufferedRatio = bufferedEnd / audio.duration;
      if (bufferedAhead >= 30 || bufferedRatio >= 0.85) requestCurrentTrackCache();
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

    function playAudio(isContinuation) {
      if (!audio.getAttribute("src")) audio.src = tracks[currentTrackIndex].src;
      var promise;
      try { promise = audio.play(); }
      catch (error) { handlePlayFailure(isContinuation); return; }
      if (promise && promise.then) {
        promise.then(function () {
          // The visualizer is optional: only attach it after native playback has
          // started so a suspended AudioContext can never block the track.
          ensureAudioGraph();
        }).catch(function () {
          handlePlayFailure(isContinuation);
        });
      } else {
        ensureAudioGraph();
      }
    }

    function handlePlayFailure(isContinuation) {
      setPlaybackIntent(false);
      if (isContinuation) {
        dock.classList.add("is-resume-pending");
        dock.classList.remove("is-error");
        if (statusEl) statusEl.textContent = "点击继续播放";
        toggle.setAttribute("aria-label", "继续播放背景音乐");
        return;
      }
      dock.classList.add("is-error");
      toggle.setAttribute("aria-label", "播放失败，请再次点击重试");
    }

    function switchTrack(index, playWhenReady) {
      var nextIndex = Math.round(clamp(index, 0, tracks.length - 1));
      if (nextIndex === currentTrackIndex) {
        if (playWhenReady && audio.paused) playAudio(false);
        return;
      }

      isTrackSwitching = true;
      currentTrackIndex = nextIndex;
      currentTrackCached = false;
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
        handlePlayFailure(false);
      }
    }

    function syncTrackUI() {
      var track = tracks[currentTrackIndex];
      if (!track) return;
      dock.setAttribute("data-track-title", track.title);
      if (titleEl) titleEl.textContent = track.title;
      if (durationEl) durationEl.textContent = track.duration;
      if (statusEl && !dock.classList.contains("is-resume-pending")) statusEl.textContent = defaultStatusText();
      trackButtons.forEach(function (button, index) {
        var active = index === currentTrackIndex;
        button.classList.toggle("is-active", active);
        if (active) button.setAttribute("aria-current", "true");
        else button.removeAttribute("aria-current");
      });
    }

    function defaultStatusText() {
      return pad2(currentTrackIndex + 1) + " / " + pad2(tracks.length) + " · AI MUSIC";
    }

    function setQueueOpen(open) {
      dock.classList.toggle("is-queue-open", open);
      if (queueToggle) {
        queueToggle.setAttribute("aria-expanded", open ? "true" : "false");
        queueToggle.setAttribute("aria-label", open ? "收起播放列表" : "展开播放列表");
      }
      window.setTimeout(function () {
        if (!dock.classList.contains("is-positioned")) return;
        clampDockPosition();
        saveDockPosition();
      }, reducedMotion ? 0 : 360);
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
            else handlePlayFailure(true);
          }, 520);
        }
        catch (e) { handlePlayFailure(true); }
      }, audioLoadRetries * 180);
    }

    function setCollapsed(collapsed, persistPreference) {
      dock.classList.toggle("is-collapsed", collapsed);
      if (collapsed) setQueueOpen(false);
      if (!collapse) return;
      collapse.setAttribute("aria-expanded", collapsed ? "false" : "true");
      collapse.setAttribute("aria-label", collapsed ? "展开播放器" : "收起播放器");
      if (persistPreference !== false) {
        try { localStorage.setItem(STORE_COLLAPSED, collapsed ? "1" : "0"); } catch (e) {}
      }
      window.setTimeout(function () {
        if (!dock.classList.contains("is-positioned")) return;
        if (dock.classList.contains("is-edge-docked")) clampEdgeDockPosition();
        else clampDockPosition();
        saveDockPosition();
      }, reducedMotion ? 0 : 440);
    }

    function initDockDragging() {
      if (!dragHandle || !("PointerEvent" in window)) return;

      dragHandle.addEventListener("pointerdown", function (event) {
        if (!isDockDragEnabled() || event.button !== 0 || event.isPrimary === false) return;
        if (event.target.closest("button, a, input, label")) return;

        var rect = dock.getBoundingClientRect();
        dragPointerId = event.pointerId;
        dragStart = {
          pointerX: event.clientX,
          pointerY: event.clientY,
          left: rect.left,
          top: rect.top
        };

        event.preventDefault();
        dock.classList.add("is-positioned", "is-dragging");
        dock.style.left = rect.left.toFixed(1) + "px";
        dock.style.top = rect.top.toFixed(1) + "px";
        dock.style.right = "auto";
        dock.style.bottom = "auto";
        try { dragHandle.setPointerCapture(event.pointerId); } catch (e) {}
      });

      var moveDrag = function (event) {
        if (!dragStart) return;
        event.preventDefault();
        positionDock(
          dragStart.left + event.clientX - dragStart.pointerX,
          dragStart.top + event.clientY - dragStart.pointerY
        );
      };

      var finishDrag = function (event) {
        if (!dragStart) return;
        var pointerId = dragPointerId;
        dragPointerId = null;
        dragStart = null;
        try { dragHandle.releasePointerCapture(pointerId); } catch (e) {}
        dock.classList.remove("is-dragging");
        settleDockAfterDrag();
      };

      window.addEventListener("pointermove", moveDrag, { passive: false });
      window.addEventListener("pointerup", finishDrag);
      window.addEventListener("pointercancel", finishDrag);
      dragHandle.addEventListener("lostpointercapture", finishDrag);
      dragHandle.addEventListener("dblclick", function (event) {
        if (event.target.closest("button, a, input, label")) return;
        resetDockPosition(true);
      });

      window.addEventListener("resize", function () {
        window.clearTimeout(dockResizeTimer);
        dockResizeTimer = window.setTimeout(function () {
          if (isHomePage()) {
            if (dock.classList.contains("is-edge-docked")) {
              clampEdgeDockPosition();
              saveDockPosition();
            } else if (dock.classList.contains("is-positioned") && isDockDragEnabled()) {
              clampDockPosition();
              saveDockPosition();
            } else {
              resetDockPosition(false);
            }
            return;
          }

          if (dock.classList.contains("is-edge-docked")) {
            clampEdgeDockPosition();
            saveDockPosition();
          } else if (isDockDragEnabled()) {
            restoreDockPosition();
          } else {
            resetDockPosition(false);
          }
        }, 120);
      }, { passive: true });

      window.requestAnimationFrame(syncDockForCurrentPage);
    }

    function isHomePage() {
      return doc.body.classList.contains("is-landing") || location.pathname === "/" || location.pathname === "/index.html";
    }

    function syncDockExpansionForCurrentPage() {
      if (isHomePage()) {
        setQueueOpen(false);
        setCollapsed(false, false);
        return;
      }

      var savedCollapsed = null;
      try { savedCollapsed = localStorage.getItem(STORE_COLLAPSED); } catch (e) {}
      var collapseByDefault = savedCollapsed === null && window.matchMedia &&
        window.matchMedia("(max-width: 680px), (max-height: 480px)").matches;
      setCollapsed(savedCollapsed === "1" || collapseByDefault, false);
    }

    function syncDockForCurrentPage() {
      syncDockExpansionForCurrentPage();
      if (isHomePage()) {
        // 每次进入首页先回到右下角默认位置，之后仍允许用户自由拖放。
        resetDockPosition(false);
      } else {
        restoreDockPosition();
      }
    }

    function isDockDragEnabled() {
      return window.innerWidth > 680;
    }

    function positionDock(left, top) {
      var margin = 12;
      var rect = dock.getBoundingClientRect();
      var maxLeft = Math.max(margin, window.innerWidth - rect.width - margin);
      var maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
      dock.style.left = clamp(left, margin, maxLeft).toFixed(1) + "px";
      dock.style.top = clamp(top, margin, maxTop).toFixed(1) + "px";
      dock.style.right = "auto";
      dock.style.bottom = "auto";
    }

    function clampDockPosition() {
      if (!dock.classList.contains("is-positioned") || !isDockDragEnabled()) return;
      var rect = dock.getBoundingClientRect();
      positionDock(rect.left, rect.top);
    }

    function saveDockPosition() {
      if (!dock.classList.contains("is-positioned")) return;
      var margin = 12;
      var rect = dock.getBoundingClientRect();
      if (dock.classList.contains("is-edge-docked")) {
        var edgeAvailableY = Math.max(1, window.innerHeight - rect.height - margin * 2);
        var edgeState = {
          edge: true,
          side: dock.classList.contains("is-edge-left") ? "left" : "right",
          y: clamp((rect.top - margin) / edgeAvailableY, 0, 1)
        };
        try { localStorage.setItem(STORE_DOCK_POSITION, JSON.stringify(edgeState)); } catch (e) {}
        return;
      }
      if (!isDockDragEnabled()) return;
      var availableX = Math.max(1, window.innerWidth - rect.width - margin * 2);
      var availableY = Math.max(1, window.innerHeight - rect.height - margin * 2);
      var state = {
        edge: false,
        x: clamp((rect.left - margin) / availableX, 0, 1),
        y: clamp((rect.top - margin) / availableY, 0, 1)
      };
      try { localStorage.setItem(STORE_DOCK_POSITION, JSON.stringify(state)); } catch (e) {}
    }

    function restoreDockPosition() {
      var state = null;
      try { state = JSON.parse(localStorage.getItem(STORE_DOCK_POSITION) || "null"); } catch (e) {}
      if (state && state.edge === true && (state.side === "left" || state.side === "right")) {
        var edgeMargin = 12;
        var edgeRect = dock.getBoundingClientRect();
        var edgeAvailableY = Math.max(0, window.innerHeight - edgeRect.height - edgeMargin * 2);
        dockToEdge(state.side, edgeMargin + clamp(state.y, 0, 1) * edgeAvailableY, false);
        return;
      }
      if (!isDockDragEnabled()) {
        resetDockPosition(false);
        return;
      }
      if (!state || !isFinite(state.x) || !isFinite(state.y)) return;

      var margin = 12;
      var rect = dock.getBoundingClientRect();
      var availableX = Math.max(0, window.innerWidth - rect.width - margin * 2);
      var availableY = Math.max(0, window.innerHeight - rect.height - margin * 2);
      dock.classList.add("is-positioned");
      positionDock(
        margin + clamp(state.x, 0, 1) * availableX,
        margin + clamp(state.y, 0, 1) * availableY
      );
    }

    function resetDockPosition(removeStoredPosition) {
      dragPointerId = null;
      dragStart = null;
      dock.classList.remove("is-positioned", "is-dragging", "is-edge-docked", "is-edge-left", "is-edge-right");
      dock.style.removeProperty("left");
      dock.style.removeProperty("top");
      dock.style.removeProperty("right");
      dock.style.removeProperty("bottom");
      syncEdgeToggle(false);
      if (removeStoredPosition) {
        try { localStorage.removeItem(STORE_DOCK_POSITION); } catch (e) {}
      }
    }

    function dockToNearestEdge() {
      var rect = dock.getBoundingClientRect();
      var side = rect.left + rect.width / 2 <= window.innerWidth / 2 ? "left" : "right";
      dockToEdge(side, rect.top, true);
    }

    function settleDockAfterDrag() {
      var rect = dock.getBoundingClientRect();
      var leftGap = Math.max(0, rect.left);
      var rightGap = Math.max(0, window.innerWidth - rect.right);
      var nearestGap = Math.min(leftGap, rightGap);

      if (nearestGap <= EDGE_SNAP_DISTANCE) {
        dockToEdge(leftGap <= rightGap ? "left" : "right", rect.top, true);
        return;
      }

      dock.classList.remove("is-edge-docked", "is-edge-left", "is-edge-right");
      syncEdgeToggle(false);
      setCollapsed(false);
      clampDockPosition();
      saveDockPosition();
    }

    function dockToEdge(side, top, persist) {
      side = side === "left" ? "left" : "right";
      setCollapsed(true);
      dock.classList.add("is-positioned", "is-edge-docked");
      dock.classList.toggle("is-edge-left", side === "left");
      dock.classList.toggle("is-edge-right", side === "right");
      dock.style.top = (isFinite(top) ? top : 12).toFixed(1) + "px";
      dock.style.bottom = "auto";
      if (side === "left") {
        dock.style.left = "0px";
        dock.style.right = "auto";
      } else {
        dock.style.left = "auto";
        dock.style.right = "0px";
      }
      syncEdgeToggle(true);
      window.requestAnimationFrame(function () {
        clampEdgeDockPosition();
        if (persist !== false) saveDockPosition();
      });
    }

    function clampEdgeDockPosition() {
      if (!dock.classList.contains("is-edge-docked")) return;
      var margin = 12;
      var rect = dock.getBoundingClientRect();
      var maxTop = Math.max(margin, window.innerHeight - rect.height - margin);
      dock.style.top = clamp(rect.top, margin, maxTop).toFixed(1) + "px";
      dock.style.bottom = "auto";
      if (dock.classList.contains("is-edge-left")) {
        dock.style.left = "0px";
        dock.style.right = "auto";
      } else {
        dock.style.left = "auto";
        dock.style.right = "0px";
      }
    }

    function releaseDockFromEdge() {
      if (!dock.classList.contains("is-edge-docked")) return;
      var side = dock.classList.contains("is-edge-left") ? "left" : "right";
      var rect = dock.getBoundingClientRect();
      var margin = 12;

      dock.classList.remove("is-edge-docked", "is-edge-left", "is-edge-right");
      syncEdgeToggle(false);
      setCollapsed(false);

      dock.style.top = rect.top.toFixed(1) + "px";
      dock.style.bottom = "auto";
      if (side === "left") {
        dock.style.left = margin + "px";
        dock.style.right = "auto";
      } else {
        dock.style.left = "auto";
        dock.style.right = margin + "px";
      }
    }

    function syncEdgeToggle(docked) {
      if (!edgeToggle) return;
      edgeToggle.setAttribute("aria-pressed", docked ? "true" : "false");
      edgeToggle.setAttribute("aria-label", docked ? "展开播放器" : "贴边收起播放器");
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
      var muted = audio.muted || audio.volume === 0;
      dock.classList.toggle("is-muted", muted);
      if (mute) {
        mute.setAttribute("aria-pressed", muted ? "true" : "false");
        mute.setAttribute("aria-label", muted ? "取消静音" : "静音");
      }
    }

    function savePosition() {
      if (!isFinite(audio.currentTime)) return;
      try {
        sessionStorage.setItem(SESSION_TIME, String(audio.currentTime));
        sessionStorage.setItem(SESSION_TRACK, String(currentTrackIndex));
      } catch (e) {}
    }

    function setPlaybackIntent(playing) {
      try { sessionStorage.setItem(SESSION_PLAYING, playing ? "1" : "0"); } catch (e) {}
    }

    function persistPlaybackSession(playing) {
      savePosition();
      setPlaybackIntent(typeof playing === "boolean" ? playing : (!audio.paused && !audio.ended));
    }

    function startRenderLoop() {
      if (frameId) cancelAnimationFrame(frameId);
      var render = function () {
        if (audio.paused || audio.ended) {
          frameId = 0;
          return;
        }
        if (!seeking) updateProgress(false);
        drawActiveVisualizer();
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
      if (!canvasContext || !canvas) return;
      var width = canvas.getBoundingClientRect().width;
      var height = canvas.getBoundingClientRect().height;
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
      if (!canvasContext || !canvas) return;
      if (!analyser || !frequencyData || reducedMotion) {
        drawIdleVisualizer();
        return;
      }
      analyser.getByteFrequencyData(frequencyData);
      var width = canvas.getBoundingClientRect().width;
      var height = canvas.getBoundingClientRect().height;
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
        navigator.mediaSession.setActionHandler("play", function () { playAudio(false); });
        navigator.mediaSession.setActionHandler("pause", function () { audio.pause(); });
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

  function pad2(value) {
    return value < 10 ? "0" + value : String(value);
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
    if (!doc.querySelector("[data-about-hero]")) return;

    addCleanup(initHoloRain());
    addCleanup(initUptime());
    addCleanup(initRadar());
    addCleanup(initTimeline());
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

    // 减少动效偏好 / 无 IO 支持：直接呈现全部内容
    if (prefersReducedMotion || !("IntersectionObserver" in window)) {
      lines.forEach(function (li) {
        var val = li.querySelector(".snap-val");
        if (val) val.textContent = val.getAttribute("data-text") || "";
        li.classList.add("is-revealed");
      });
      section.classList.add("is-done");
      setStatus("done");
      return;
    }

    var started = false;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting && !started) {
          started = true;
          io.unobserve(e.target);
          runSequence();
        }
      });
    }, { threshold: 0.3 });
    io.observe(section);

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
        section.classList.remove("is-typing");
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
    var items = doc.querySelectorAll("[data-about-timeline] .tl-item");
    if (!items.length) return null;
    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      items.forEach(function (it) { it.classList.add("is-in"); });
      return null;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) {
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -10% 0px" });
    items.forEach(function (it) { io.observe(it); });
    return function () { io.disconnect(); };
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
