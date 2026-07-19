---
layout: landing
title: 关于
excerpt: 质量工程、测试开发与无人车质量实践
permalink: /about.html
---

<section class="about-hero" data-about-hero>
    <div class="about-hero-grid"></div>
    <div class="about-scanline"></div>

    <div class="about-hologram" aria-hidden="true">
        <div class="holo-ring holo-ring-1"></div>
        <div class="holo-ring holo-ring-2"></div>
        <div class="holo-ring holo-ring-3"></div>
        <div class="holo-orbit">
            <span class="holo-particle holo-particle-1"></span>
            <span class="holo-particle holo-particle-2"></span>
            <span class="holo-particle holo-particle-3"></span>
        </div>
        <div class="holo-avatar">
            <picture>
                <source type="image/webp"
                        srcset="{{ '/images/head-160.webp' | relative_url }} 160w, {{ '/images/head-256.webp' | relative_url }} 256w"
                        sizes="160px">
                <img src="{{ '/images/head.jpeg' | relative_url }}" alt="头像" width="160" height="160" loading="eager" decoding="async">
            </picture>
            <div class="holo-scan"></div>
        </div>
        <canvas class="holo-rain" aria-hidden="true"></canvas>
    </div>

    <div class="about-hero-content">
        <div class="about-eyebrow">
            <span class="dot"></span>
            <span class="about-eyebrow-text">// 个人说明 · 2026.07 更新</span>
        </div>

        <h1 class="about-title">
            <span class="about-title-line">你好，我是</span>
            <span class="about-title-line">
                <span class="grad-text">Xueyuan</span><span class="about-title-cursor">▍</span>
            </span>
        </h1>

        <p class="about-typed">
            <span data-typed
                  data-typed-strings='["质量工程与测试开发","L4 无人配送车质量","Python / FastAPI / Pytest","React / TypeScript","AI 评测：WER / LLM-as-a-Judge","CI/CD 与质量平台"]'>
            </span><span class="caret">_</span>
        </p>

        <div class="about-status">
            <span class="status-pill status-pill--online">
                <span class="status-led"></span>
                <span>九识无人车</span>
            </span>
            <span class="status-pill">
                <span class="status-key">当前</span>
                <span class="status-val">端到端质量</span>
            </span>
            <span class="status-pill">
                <span class="status-key">地点</span>
                <span class="status-val">杭州</span>
            </span>
            <span class="status-pill">
                <span class="status-key">方向</span>
                <span class="status-val">测试平台 / AI 评测</span>
            </span>
            <span class="status-pill">
                <span class="status-key">从业计时</span>
                <span class="status-val" data-about-uptime>—</span>
            </span>
        </div>

        <div class="about-quick">
            <a class="btn btn-primary" href="{{ '/about/2026/02/22/intro.html' | relative_url }}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3h7v7"/><path d="M10 14L21 3"/><path d="M21 14v7H3V3h7"/></svg>
                查看详细经历
            </a>
            <a class="btn btn-ghost" href="mailto:{{ site.email }}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/></svg>
                {{ site.email }}
            </a>
        </div>
    </div>
</section>

<!-- Core profile preview -->
<section class="landing-section about-snapshot" data-about-snapshot>
    <header class="section-head">
        <span class="section-eyebrow">// profile.summary</span>
        <h2>我在做什么 · At a Glance</h2>
    </header>

    <div class="snapshot-card" data-snapshot-card>
        <div class="snapshot-glow" aria-hidden="true"></div>
        <div class="snapshot-bar">
            <span class="t-dot t-dot-r"></span>
            <span class="t-dot t-dot-y"></span>
            <span class="t-dot t-dot-g"></span>
            <span class="snapshot-bar-title">~/about/qiaoxueyuan.md</span>
            <span class="snapshot-bar-status" data-snapshot-status aria-live="polite"></span>
        </div>

        <ol class="snapshot-lines" data-snapshot-lines>
            <li class="snap-line snap-head">
                <span class="snap-hash">#</span>
                <span class="snap-val" data-text="1. 当前工作"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">岗位</span>
                <span class="snap-val" data-text="九识无人车质量工程，负责 L4 无人配送车端到端质量。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">对象</span>
                <span class="snap-val" data-text="车端、云端、数据链路，以及仿真和路测中的关键场景。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">阶段</span>
                <span class="snap-val" data-text="软件质量经验较多；自动驾驶仿真与路测仍在系统学习。"></span>
            </li>

            <li class="snap-line snap-head">
                <span class="snap-hash">#</span>
                <span class="snap-val" data-text="2. 做过的业务"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">搜索</span>
                <span class="snap-val" data-text="百度大搜索：检索链路测试、自动化 diff、日历和天气垂类研发。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">金融</span>
                <span class="snap-val" data-text="支付宝基金养老：压测、容灾演练、资金链路与日常质量治理。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">AI 应用</span>
                <span class="snap-val" data-text="AI Phone：VOIP / ASR / 翻译 / TTS 链路与模型效果评测。"></span>
            </li>

            <li class="snap-line snap-head">
                <span class="snap-hash">#</span>
                <span class="snap-val" data-text="3. 近期交付"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">质量中台</span>
                <span class="snap-val" data-text="独立完成需求梳理、前后端开发、数据存储与 CI/CD 部署。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">技术栈</span>
                <span class="snap-val" data-text="FastAPI / React / TypeScript / MySQL / Tair / Docker / SAE。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">AI 分析</span>
                <span class="snap-val" data-text="根据测试数据归纳失败模式并给出排查建议，按业务配置提示词。"></span>
            </li>

            <li class="snap-line snap-head">
                <span class="snap-hash">#</span>
                <span class="snap-val" data-text="4. 工作习惯"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">验证</span>
                <span class="snap-val" data-text="先定义指标与回归集，再用数据判断效果。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">自动化</span>
                <span class="snap-val" data-text="高频回归尽量接入流水线，保留可追溯的结果。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">边界</span>
                <span class="snap-val" data-text="生产实践、个人项目和学习验证分开说明。"></span>
            </li>
        </ol>

        <div class="snapshot-stats" data-snapshot-stats>
            <div class="snap-stat">
                <span class="snap-stat-value" data-counter="{{ site.posts.size }}">0</span>
                <span class="snap-stat-label">已发布文章</span>
            </div>
            <div class="snap-stat">
                <span class="snap-stat-value" data-counter="{{ site.categories.size }}">0</span>
                <span class="snap-stat-label">主题分类</span>
            </div>
            <div class="snap-stat">
                <span class="snap-stat-value" data-counter="10">0</span>
                <span class="snap-stat-label">质量工程年限</span>
            </div>
            <div class="snap-stat">
                <span class="snap-stat-value">4</span>
                <span class="snap-stat-label">主要业务领域</span>
            </div>
            <div class="snap-stat">
                <span class="snap-stat-value">2016</span>
                <span class="snap-stat-label">开始从事测试</span>
            </div>
        </div>

        <a class="snapshot-cta" data-snapshot-cta href="{{ '/about/2026/02/22/intro.html' | relative_url }}">
            <span class="snapshot-cta-glow" aria-hidden="true"></span>
            <span class="snapshot-cta-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="M8 9h2"/></svg>
            </span>
            <span class="snapshot-cta-text">
                <span class="snapshot-cta-main">阅读完整个人概述</span>
                <span class="snapshot-cta-sub">职业经历 · 项目实践 · 技术范围 · 学习边界</span>
            </span>
            <span class="snapshot-cta-arrow" aria-hidden="true">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </span>
        </a>
    </div>
</section>

<!-- Working principles -->
<section class="landing-section about-manifesto">
    <header class="section-head">
        <span class="section-eyebrow">// working.notes</span>
        <h2>做事方式 · How I Work</h2>
    </header>

    <div class="manifesto-grid">
        <article class="manifesto-card" style="--accent: 124,140,255">
            <div class="manifesto-num">01</div>
            <h3>先把关键链路跑通</h3>
            <p>先识别最容易出问题、最影响用户的路径，再补自动化、数据和监控，不追求一次做全。</p>
        </article>
        <article class="manifesto-card" style="--accent: 89,227,255">
            <div class="manifesto-num">02</div>
            <h3>用指标代替感觉</h3>
            <p>性能看容量基线，语音识别看 WER，模型输出看基准集；先约定口径，再讨论好坏。</p>
        </article>
        <article class="manifesto-card" style="--accent: 184,136,255">
            <div class="manifesto-num">03</div>
            <h3>重复工作接入流水线</h3>
            <p>把稳定的回归、检查和部署步骤自动化，减少手工操作，也让问题更容易复现和追踪。</p>
        </article>
        <article class="manifesto-card" style="--accent: 124,255,180">
            <div class="manifesto-num">04</div>
            <h3>明确经验边界</h3>
            <p>做过的项目、个人练习和正在学习的方向分开写；不把工具使用等同于生产经验。</p>
        </article>
    </div>
</section>

<!-- Work map -->
<section class="landing-section about-radar-section">
    <header class="section-head">
        <span class="section-eyebrow">// work.map</span>
        <h2>常做的事情 · Work Map</h2>
    </header>

    <div class="about-radar-wrap">
        <div class="about-radar" data-about-radar>
            <svg viewBox="-180 -180 360 360" class="radar-svg" aria-hidden="true">
                <defs>
                    <radialGradient id="radarGlow" cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stop-color="rgba(124,140,255,0.55)"/>
                        <stop offset="60%" stop-color="rgba(124,140,255,0.18)"/>
                        <stop offset="100%" stop-color="rgba(124,140,255,0)"/>
                    </radialGradient>
                    <linearGradient id="radarFill" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="rgba(124,140,255,0.55)"/>
                        <stop offset="50%" stop-color="rgba(89,227,255,0.45)"/>
                        <stop offset="100%" stop-color="rgba(184,136,255,0.55)"/>
                    </linearGradient>
                </defs>
                <circle cx="0" cy="0" r="155" fill="url(#radarGlow)" class="radar-bgglow"/>
                <g class="radar-rings"></g>
                <g class="radar-axes"></g>
                <polygon class="radar-shape" points=""/>
                <g class="radar-points"></g>
                <g class="radar-labels"></g>
                <line class="radar-sweep" x1="0" y1="0" x2="0" y2="-150"/>
            </svg>
        </div>

        <ul class="radar-legend">
            <li data-axis="0" data-label="Test Auto" data-value="90" style="--accent: 124,140,255">
                <span class="dot"></span>
                <div>
                    <div class="r-name">自动化测试</div>
                    <div class="r-desc">Pytest · Selenium · 接口 / 端到端回归</div>
                </div>
                <span class="r-score">长期</span>
            </li>
            <li data-axis="1" data-label="Stability" data-value="88" style="--accent: 89,227,255">
                <span class="dot"></span>
                <div>
                    <div class="r-name">稳定性</div>
                    <div class="r-desc">压测 · 容灾演练 · 故障注入 · 监控</div>
                </div>
                <span class="r-score">长期</span>
            </li>
            <li data-axis="2" data-label="Vehicle QA" data-value="55" style="--accent: 184,136,255">
                <span class="dot"></span>
                <div>
                    <div class="r-name">无人车质量</div>
                    <div class="r-desc">车云链路 · OTA · 仿真 / 路测学习中</div>
                </div>
                <span class="r-score">起步</span>
            </li>
            <li data-axis="3" data-label="AI Eval" data-value="68" style="--accent: 124,255,180">
                <span class="dot"></span>
                <div>
                    <div class="r-name">AI 评测</div>
                    <div class="r-desc">WER · Benchmark · LLM-as-a-Judge</div>
                </div>
                <span class="r-score">实践</span>
            </li>
            <li data-axis="4" data-label="Platform" data-value="76" style="--accent: 251,191,36">
                <span class="dot"></span>
                <div>
                    <div class="r-name">质量平台开发</div>
                    <div class="r-desc">FastAPI · React · TypeScript · MySQL</div>
                </div>
                <span class="r-score">项目</span>
            </li>
            <li data-axis="5" data-label="Delivery" data-value="82" style="--accent: 248,113,113">
                <span class="dot"></span>
                <div>
                    <div class="r-name">工程交付</div>
                    <div class="r-desc">Docker · Jenkins / 云效 · SAE · 可观测性</div>
                </div>
                <span class="r-score">常用</span>
            </li>
        </ul>
    </div>
    <p class="about-foot">六边形用于展示工作内容分布，标签表示经验状态，不再使用主观百分制自评。</p>
</section>

<!-- Career timeline -->
<section class="landing-section about-timeline-section">
    <header class="section-head">
        <span class="section-eyebrow">// timeline</span>
        <h2>职业经历 · Experience</h2>
    </header>

    <ol class="about-timeline" data-about-timeline>
        <li class="tl-item">
            <span class="tl-node"></span>
            <div class="tl-card">
                <div class="tl-meta">
                    <span class="tl-year">2026 — Now</span>
                    <span class="tl-tag">菜鸟无人车 → 九识 · L4</span>
                </div>
                <h3>L4 无人配送车质量</h3>
                <p>负责车端、云端和数据链路的质量工作，并开始参与仿真、路测、车云协同和 OTA 等场景。自动驾驶是新领域，当前仍在补齐感知 / 规划 / 控制相关知识。同期独立开发无人车质量中台，完成前后端、数据库和部署流水线；平台支持测试执行、质量度量，以及基于测试结果的 AI 辅助分析。</p>
                <div class="tl-chips">
                    <span>车云链路</span><span>仿真 / 路测</span><span>OTA</span><span>FastAPI</span><span>React</span><span>云效 / SAE</span>
                </div>
            </div>
        </li>
        <li class="tl-item">
            <span class="tl-node"></span>
            <div class="tl-card">
                <div class="tl-meta">
                    <span class="tl-year">2025 — 2026</span>
                    <span class="tl-tag">腾展 · AI Phone</span>
                </div>
                <h3>AI Phone 测试负责人</h3>
                <p>负责 App 与服务端质量，覆盖 <strong>VOIP / ASR / 翻译 / TTS</strong> 链路。为同声传译建立 WER 自动化评估和翻译基准集，并使用 <strong>LLM-as-a-Judge</strong> 做批量验证；同时推动接口测试从 JUnit 迁移到 Pytest，测试覆盖率提升 <strong>70%</strong>。</p>
                <div class="tl-chips">
                    <span>VOIP</span><span>ASR</span><span>TTS</span><span>WER</span><span>LLM-as-a-Judge</span><span>Pytest</span>
                </div>
            </div>
        </li>
        <li class="tl-item">
            <span class="tl-node"></span>
            <div class="tl-card">
                <div class="tl-meta">
                    <span class="tl-year">2021 — 2024</span>
                    <span class="tl-tag">蚂蚁 · 金融级</span>
                </div>
                <h3>基金与个人养老金质量治理</h3>
                <p>担任支付宝基金养老专区 QA Owner，负责需求评审、测试策略、全链路压测、容灾演练、监控和应急预案。个人养老金项目重点覆盖开户、缴存、资金链路和对账场景，负责期间保持 <strong>0 重大事故</strong>。</p>
                <div class="tl-chips">
                    <span>QA Owner</span><span>Stress Test</span><span>Chaos</span><span>Risk Control</span><span>SLO</span>
                </div>
            </div>
        </li>
        <li class="tl-item">
            <span class="tl-node"></span>
            <div class="tl-card">
                <div class="tl-meta">
                    <span class="tl-year">2018 — 2020</span>
                    <span class="tl-tag">百度 · 大搜索</span>
                </div>
                <h3>搜索质量与垂类研发</h3>
                <p>参与核心搜索 VUI 和检索链路质量保障，使用 Python / Shell 开发自动化 diff 工具并接入 CI。后转研发，负责日历、天气垂类的业务开发和架构迁移。</p>
                <div class="tl-chips">
                    <span>Search</span><span>Ranking</span><span>A/B</span><span>Test → Dev</span>
                </div>
            </div>
        </li>
        <li class="tl-item">
            <span class="tl-node"></span>
            <div class="tl-card">
                <div class="tl-meta">
                    <span class="tl-year">2016 — 2017</span>
                    <span class="tl-tag">SaaS · 客服系统</span>
                </div>
                <h3>SaaS 客服系统测试</h3>
                <p>覆盖 Web、服务端和移动 App。使用 Minitest 补齐 Ruby on Rails 后端单测，代码覆盖率提升到 <strong>80%+</strong>；使用 Selenium / Appium + Jenkins 建设端到端自动化，核心回归场景实现自动执行，单次回归耗时缩短 <strong>90%+</strong>。</p>
                <div class="tl-chips">
                    <span>SaaS</span><span>Web</span><span>Backend</span><span>Minitest</span><span>Selenium/Appium</span><span>Automation</span>
                </div>
            </div>
        </li>
    </ol>
</section>

<!-- Tech stack marquee -->
<section class="landing-section about-stack-section">
    <header class="section-head">
        <span class="section-eyebrow">// stack</span>
        <h2>常用技术 · Tech Stack</h2>
    </header>
    <div class="about-stack">
        {%- assign stack_items = "Python|Java|Ruby on Rails|Pytest|Selenium|FastAPI|React|TypeScript|Vite|Spring|MySQL|Redis / Tair|RocketMQ|Kafka|Docker|Kubernetes|Prometheus|Grafana|Jenkins|云效|Linux" | split: "|" -%}
        {% for tag in stack_items %}
        <span class="stack-chip" style="--i: {{ forloop.index0 }}">
            <span class="chip-glyph">{{ tag | slice: 0, 1 }}</span>
            {{ tag }}
        </span>
        {% endfor %}
    </div>
</section>

<!-- Contact -->
<section class="landing-section about-contact-section">
    <header class="section-head">
        <span class="section-eyebrow">// contact</span>
        <h2>联系方式 · Get in Touch</h2>
    </header>

    <div class="about-contact-grid">
        <a class="contact-card" href="mailto:{{ site.email }}">
            <div class="contact-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/></svg>
            </div>
            <div class="contact-name">Email</div>
            <div class="contact-value">{{ site.email }}</div>
            <div class="contact-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </div>
        </a>
        <a class="contact-card" href="https://github.com/{{ site.github_username }}" target="_blank" rel="noopener">
            <div class="contact-icon">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56v-2.18c-3.2.7-3.87-1.36-3.87-1.36-.52-1.33-1.27-1.69-1.27-1.69-1.04-.71.08-.7.08-.7 1.15.08 1.76 1.18 1.76 1.18 1.02 1.75 2.68 1.25 3.34.96.1-.74.4-1.25.72-1.54-2.55-.29-5.24-1.27-5.24-5.66 0-1.25.45-2.27 1.18-3.07-.12-.29-.51-1.46.11-3.04 0 0 .96-.31 3.16 1.17.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.49 3.16-1.17 3.16-1.17.62 1.58.23 2.75.11 3.04.74.8 1.18 1.82 1.18 3.07 0 4.4-2.69 5.36-5.25 5.65.41.35.78 1.05.78 2.12v3.14c0 .31.21.67.8.56 4.57-1.52 7.85-5.83 7.85-10.91C23.5 5.65 18.35.5 12 .5z"/></svg>
            </div>
            <div class="contact-name">GitHub</div>
            <div class="contact-value">@{{ site.github_username }}</div>
            <div class="contact-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </div>
        </a>
        <a class="contact-card" href="{{ '/feed.xml' | relative_url }}">
            <div class="contact-icon">
                <svg viewBox="0 0 24 24" fill="currentColor"><path d="M5 3v3a15 15 0 0 1 15 15h3A18 18 0 0 0 5 3zm0 7v3a8 8 0 0 1 8 8h3a11 11 0 0 0-11-11zm1.5 8a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5z"/></svg>
            </div>
            <div class="contact-name">RSS</div>
            <div class="contact-value">订阅文章更新</div>
            <div class="contact-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </div>
        </a>
    </div>

    <p class="about-foot">
        本站基于 <a href="https://jekyllrb.com/" target="_blank" rel="noopener">Jekyll</a> 构建，部署在 GitHub Pages。
        页面样式与交互由我维护，主要使用原生 CSS 和 JavaScript。
    </p>
</section>
