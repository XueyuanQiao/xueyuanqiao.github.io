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

    // Active nav link（文章详情归入“文章”，分类筛选页归入“分类”）
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
      if (current) {
        a.classList.add("is-active");
        a.setAttribute("aria-current", "page");
      }
    });

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
      }, { threshold: 0, rootMargin: "0px 0px -40px 0px" });
      revealItems.forEach(function (el) { io.observe(el); });
    } else {
      revealItems.forEach(function (el) { el.classList.add("is-in"); });
    }

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

    // Code block enhancements
    enhanceCodeBlocks();

    // Article-only enhancements
    enhanceArticle();

    // Archive pagination (文章库分页：10/20/50 每页)
    initArchivePagination();

    // Command palette search: index is fetched only when the user opens it.
    initSearch(closeMenu);

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
        if (mq.addEventListener) mq.addEventListener('change', onMq);
        else if (mq.addListener) mq.addListener(onMq);
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
    doc.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && lb && lb.open) {
        e.preventDefault();
        closeLightbox();
      }
    });
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
    initSkillClickFeedback();
    if (!isTouchDevice) initTilt();
    if (!isTouchDevice) initSkillSpotlight();
    try {
      if (isLanding && !isTouchDevice && !isNarrowScreen) initNeural();
    } catch (err) {
      // 神经网络背景失败不应阻断其他交互
      if (window.console) console.warn("[site] initNeural failed:", err);
    }
    try { initAvatarSpin(); } catch (err) {
      if (window.console) console.warn("[site] initAvatarSpin failed:", err);
    }
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
    if (!canvas || !canvas.getContext) return;
    if (prefersReducedMotion) return;

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

    window.addEventListener("resize", debounce(resize, 150), { passive: true });
    window.addEventListener("pointermove", onMove, { passive: true });
    doc.documentElement.addEventListener("pointerleave", onLeave, { passive: true });
    window.addEventListener("blur", onLeave);

    // Visibility pause
    doc.addEventListener("visibilitychange", function () {
      if (doc.hidden) stop();
      else start();
    });

    resize();
    start();
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

  function ready(fn) {
    if (doc.readyState !== "loading") fn();
    else doc.addEventListener("DOMContentLoaded", fn);
  }

  ready(function () {
    if (!doc.querySelector("[data-about-hero]")) return;

    initHoloRain();
    initUptime();
    initRadar();
    initTimeline();
    initManifestoSpotlight();
    initSnapshot();
  });

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
    if (prefersReducedMotion || isTouchDevice) return;
    var canvas = doc.querySelector(".holo-rain");
    if (!canvas || !canvas.getContext) return;

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
    if (ro) ro.observe(canvas);
    else window.addEventListener("resize", resize);

    resize();
    step();

    doc.addEventListener("visibilitychange", function () {
      if (doc.hidden) cancelAnimationFrame(rafId);
      else step();
    });
  }

  // ---------- Career time since 2016 ----------
  function initUptime() {
    var el = doc.querySelector("[data-about-uptime]");
    if (!el) return;
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
    setInterval(tick, 1000);
  }

  // ---------- Skill radar ----------
  function initRadar() {
    var radar = doc.querySelector("[data-about-radar]");
    if (!radar) return;
    var svg = radar.querySelector("svg");
    if (!svg) return;

    var legend = doc.querySelectorAll(".radar-legend li");
    var labels = [];
    var values = []; // out of 100
    legend.forEach(function (li) {
      labels.push(li.getAttribute("data-label") || "");
      values.push(parseFloat(li.getAttribute("data-value")) || 0);
    });
    if (!values.length) return;

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

    if ("IntersectionObserver" in window) {
      var io = new IntersectionObserver(function (entries) {
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
  }

  // ---------- Timeline ----------
  function initTimeline() {
    var items = doc.querySelectorAll("[data-about-timeline] .tl-item");
    if (!items.length) return;
    if (!("IntersectionObserver" in window) || prefersReducedMotion) {
      items.forEach(function (it) { it.classList.add("is-in"); });
      return;
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
