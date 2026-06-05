---
layout: post
title: 置身钉内
date: 2026-06-05 10:00:00 +0800
excerpt: 一名 2025 年入职钉钉的产品经理，用亲历的「ONE」项目，记录一款战略级 AI 办公产品从立项、发布、共创到收缩的完整生命周期——理想如何被翻译成目标，目标如何在组织里变形落地。
categories: product ai
permalink: /product/2026/06/05/zhi-shen-ding-nei.html
---

这是一份约 7.5 万字、105 页的长文档：一名 2025 年 6 月入职钉钉的产品经理，用亲历的「ONE」项目（一款战略级 AI 办公产品），完整复盘了它从立项、发布、共创到收缩的生命周期。文中既有对产品「发心」、定位、设计、用户、敏捷、秩序、军争与长期价值的专业思考，也夹叙夹议地记录了理想如何在组织惯性中变形、落地的过程。

原文档排版与图表较多，为保留全部细节，这里直接以 PDF 原件呈现。下方可在线翻阅，也可下载或在新窗口中打开。

<!-- more -->

<div class="pdf-actions">
  <a class="pdf-btn" href="/assets/pdf/zhi-shen-ding-nei.pdf" target="_blank" rel="noopener">在新窗口打开</a>
  <a class="pdf-btn pdf-btn-ghost" href="/assets/pdf/zhi-shen-ding-nei.pdf" download>下载 PDF（约 33MB）</a>
</div>

<div id="pdf-viewer" class="pdf-viewer" data-pdf-src="/assets/pdf/zhi-shen-ding-nei.pdf" aria-label="《置身钉内》PDF 在线阅读">
  <div class="pdf-loading">正在加载 PDF 阅读器…</div>
</div>

<noscript>
  <p>当前浏览器未启用 JavaScript，无法内嵌阅读。请 <a href="/assets/pdf/zhi-shen-ding-nei.pdf">点此下载或打开 PDF</a>。</p>
</noscript>

<style>
.pdf-actions{display:flex;gap:.6rem;flex-wrap:wrap;margin:1.2rem 0;}
.pdf-btn{display:inline-block;padding:.5rem .95rem;border-radius:8px;font-size:.92rem;line-height:1;
  background:#2f6fed;color:#fff;text-decoration:none;border:1px solid transparent;transition:opacity .15s;}
.pdf-btn:hover{opacity:.88;}
.pdf-btn-ghost{background:transparent;color:#2f6fed;border-color:#2f6fed;}
.pdf-viewer{background:#3a3d42;border-radius:10px;padding:14px;min-height:60vh;
  box-shadow:inset 0 0 0 1px rgba(0,0,0,.12);overflow:hidden;}
.pdf-loading{color:#e7e9ee;text-align:center;padding:3rem 1rem;font-size:.95rem;}
.pdf-page{margin:0 auto 14px;background:#fff;box-shadow:0 4px 16px rgba(0,0,0,.28);
  border-radius:2px;max-width:100%;}
.pdf-page:last-child{margin-bottom:0;}
.pdf-page canvas{display:block;width:100%;height:auto;border-radius:2px;}
.pdf-error{color:#ffd7d7;text-align:center;padding:2rem 1rem;}
.pdf-error a{color:#fff;text-decoration:underline;}
</style>

<script src="https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js"></script>
<script>
(function () {
  var el = document.getElementById("pdf-viewer");
  if (!el) return;
  var url = el.getAttribute("data-pdf-src");

  function fail() {
    el.innerHTML = '<div class="pdf-error">阅读器加载失败，请直接 ' +
      '<a href="' + url + '" target="_blank" rel="noopener">下载或打开 PDF</a>。</div>';
  }

  if (!("pdfjsLib" in window)) { fail(); return; }
  var pdfjsLib = window["pdfjsLib"];
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

  // 仅按需取用页面，避免一次性下载整份 33MB
  var task = pdfjsLib.getDocument({
    url: url,
    disableAutoFetch: true,
    disableStream: false,
    rangeChunkSize: 262144
  });

  task.promise.then(function (pdf) {
    el.innerHTML = "";
    var total = pdf.numPages;
    var dpr = window.devicePixelRatio || 1;
    var rendered = {};

    // 用首页比例为所有占位页估算高度，保证懒加载按滚动逐页触发
    pdf.getPage(1).then(function (firstPage) {
      var vp1 = firstPage.getViewport({ scale: 1 });
      var ratio = vp1.height / vp1.width;

      for (var i = 1; i <= total; i++) {
        var wrap = document.createElement("div");
        wrap.className = "pdf-page";
        wrap.setAttribute("data-page", i);
        wrap.style.height = Math.round(el.clientWidth * ratio) + "px";
        el.appendChild(wrap);
      }

      function renderPage(wrap) {
        var num = parseInt(wrap.getAttribute("data-page"), 10);
        if (rendered[num]) return;
        rendered[num] = true;
        pdf.getPage(num).then(function (page) {
          var cw = el.clientWidth;
          var vpBase = page.getViewport({ scale: 1 });
          var scale = cw / vpBase.width;
          var vp = page.getViewport({ scale: scale });
          var canvas = document.createElement("canvas");
          canvas.width = Math.floor(vp.width * dpr);
          canvas.height = Math.floor(vp.height * dpr);
          wrap.style.height = "auto";
          wrap.innerHTML = "";
          wrap.appendChild(canvas);
          var ctx = canvas.getContext("2d");
          page.render({
            canvasContext: ctx,
            viewport: vp,
            transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : null
          });
        });
      }

      if ("IntersectionObserver" in window) {
        var io = new IntersectionObserver(function (entries) {
          entries.forEach(function (e) {
            if (e.isIntersecting) { renderPage(e.target); io.unobserve(e.target); }
          });
        }, { rootMargin: "800px 0px" });
        el.querySelectorAll(".pdf-page").forEach(function (w) { io.observe(w); });
      } else {
        el.querySelectorAll(".pdf-page").forEach(renderPage);
      }
    });
  }).catch(fail);
})();
</script>
