---
layout: landing
title: 关于
excerpt: AI 全栈开发、业务与平台交付、质量工程及 L4 无人车端到端质量
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
            <span class="about-eyebrow-text">// 个人说明 · 2026.08 更新</span>
        </div>

        <h1 class="about-title">
            <span class="about-title-line">你好，我是</span>
            <span class="about-title-line">
                <span class="grad-text">Xueyuan</span><span class="about-title-cursor">▍</span>
            </span>
        </h1>

        <p class="about-typed">
            <span data-typed
                  data-typed-strings='["AI 全栈业务开发","质量平台独立交付","L4 无人配送车端到端质量","需求到上线完整闭环","AI 评测与结果分析","业务开发与平台开发均已落地"]'>
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
                <span class="status-val">AI 全栈开发 / 无人车质量</span>
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

<!-- Core profile preview · 核心概述精简展示 + 打字逐行展开 -->
<section class="landing-section about-snapshot" data-about-snapshot>
    <header class="section-head">
        <span class="section-eyebrow">// profile.prompt</span>
        <h2>一个提示词看懂我 · One Prompt</h2>
    </header>

    <div class="snapshot-card" data-snapshot-card>
        <div class="snapshot-glow" aria-hidden="true"></div>
        <div class="snapshot-bar">
            <span class="t-dot t-dot-r"></span>
            <span class="t-dot t-dot-y"></span>
            <span class="t-dot t-dot-g"></span>
            <span class="snapshot-bar-title">~/.prompts/qiaoxueyuan.system.md</span>
            <span class="snapshot-bar-status" data-snapshot-status aria-live="polite"></span>
        </div>

        <ol class="snapshot-lines" data-snapshot-lines>
            <li class="snap-line snap-head">
                <span class="snap-hash">#</span>
                <span class="snap-val" data-text="1. 职业定位 · Profile"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">定位</span>
                <span class="snap-val" data-text="乔雪源 / Xueyuan，AI 全栈开发工程师，近十年质量工程与测试开发经验，已交付业务系统和质量平台。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">经历</span>
                <span class="snap-val" data-text="做过 SaaS 客服、百度搜索、支付宝基金与个人养老金、AI Phone，现进入 L4 无人配送车领域。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">当前</span>
                <span class="snap-val" data-text="在九识负责无人配送车端到端质量，覆盖车端、云端、数据链路、OTA、仿真与路测，同时承担业务开发和质量平台建设。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">开发</span>
                <span class="snap-val" data-text="多个业务和平台项目已落地，成果已经进入真实业务使用。"></span>
            </li>

            <li class="snap-line snap-head">
                <span class="snap-hash">#</span>
                <span class="snap-val" data-text="2. 能解决的问题 · Scope"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">质量</span>
                <span class="snap-val" data-text="从业务目标和故障后果出发，制定测试策略、发布门槛、质量指标和应急方案。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">稳定性</span>
                <span class="snap-val" data-text="通过容量基线、全链路压测、容灾演练、监控和复盘，把风险暴露在上线之前。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">工程</span>
                <span class="snap-val" data-text="能独立完成需求梳理、交互设计、前后端、数据存储、CI/CD 与部署，项目以真实业务使用作为完成标准。"></span>
            </li>

            <li class="snap-line snap-head">
                <span class="snap-hash">#</span>
                <span class="snap-val" data-text="3. AI 时代的质量方法 · AI Quality"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">分层</span>
                <span class="snap-val" data-text="规则明确的流程交给自动化；模型输出用固定评测集、多维指标和人工抽检单独治理。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">评测</span>
                <span class="snap-val" data-text="已将 WER、翻译基准集和 LLM-as-a-Judge 用于同声传译批量评测与回归，并持续跟踪失败分布、成本和结果变化。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">协作</span>
                <span class="snap-val" data-text="用 AI 加速调研、原型、编码和分析，但关键结论必须回到原始数据，代码仍要经过评审与测试。"></span>
            </li>

            <li class="snap-line snap-head">
                <span class="snap-hash">#</span>
                <span class="snap-val" data-text="4. 判断与交付 · Delivery"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">判断</span>
                <span class="snap-val" data-text="不以测试用例数量或工具数量证明质量，优先看关键风险是否收敛、结果是否可解释。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">交付</span>
                <span class="snap-val" data-text="交付的不只是一轮测试结果，还包括可复现的链路、可追溯的数据和可持续维护的工程资产。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">原则</span>
                <span class="snap-val" data-text="先解决真实问题，再选择技术；保留证据和边界，对最终上线结果负责。"></span>
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
                <span class="snap-stat-value">20 万+</span>
                <span class="snap-stat-label">单月代码量</span>
            </div>
        </div>

        <a class="snapshot-cta" data-snapshot-cta href="{{ '/about/2026/02/22/intro.html' | relative_url }}">
            <span class="snapshot-cta-glow" aria-hidden="true"></span>
            <span class="snapshot-cta-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="M8 9h2"/></svg>
            </span>
            <span class="snapshot-cta-text">
                <span class="snapshot-cta-main">阅读完整个人概述</span>
                <span class="snapshot-cta-sub">完整履历 · 业务项目 · 平台交付 · 技术栈</span>
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
            <h3>先判断风险，再决定怎么测</h3>
            <p>先看业务目标、关键链路和故障代价，再决定测试范围与投入。用例数量不是目标，风险收敛才是。</p>
        </article>
        <article class="manifesto-card" style="--accent: 89,227,255">
            <div class="manifesto-num">02</div>
            <h3>不同问题，用不同的尺子</h3>
            <p>规则明确的流程交给自动化；模型输出用固定评测集、多维指标和人工抽检。确定性与概率性问题分开治理。</p>
        </article>
        <article class="manifesto-card" style="--accent: 184,136,255">
            <div class="manifesto-num">03</div>
            <h3>让 AI 提速，责任仍由人承担</h3>
            <p>用 AI 查资料、做原型、写代码和分析结果；关键结论要能回到原始数据，代码仍要经过评审、测试和发布流程。</p>
        </article>
        <article class="manifesto-card" style="--accent: 124,255,180">
            <div class="manifesto-num">04</div>
            <h3>把一次性交付变成长期资产</h3>
            <p>把高频动作接入流水线，把案例、指标、失败样本和复盘留在系统里。工具会换，判断问题的依据不能丢。</p>
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
                <g class="radar-rings">
                    <circle cx="0" cy="0" r="37.5"/>
                    <circle cx="0" cy="0" r="75"/>
                    <circle cx="0" cy="0" r="112.5"/>
                    <circle cx="0" cy="0" r="150"/>
                </g>
                <g class="radar-axes">
                    <line x1="0" y1="0" x2="0" y2="-150"/>
                    <line x1="0" y1="0" x2="129.90" y2="-75"/>
                    <line x1="0" y1="0" x2="129.90" y2="75"/>
                    <line x1="0" y1="0" x2="0" y2="150"/>
                    <line x1="0" y1="0" x2="-129.90" y2="75"/>
                    <line x1="0" y1="0" x2="-129.90" y2="-75"/>
                </g>
                <polygon class="radar-shape" points="0,-135 114.32,-66 71.45,41.25 0,102 -98.73,57 -106.52,-61.5"/>
                <g class="radar-points">
                    <circle r="5" cx="0" cy="-135" data-axis="0"/>
                    <circle r="5" cx="114.32" cy="-66" data-axis="1"/>
                    <circle r="5" cx="71.45" cy="41.25" data-axis="2"/>
                    <circle r="5" cx="0" cy="102" data-axis="3"/>
                    <circle r="5" cx="-98.73" cy="57" data-axis="4"/>
                    <circle r="5" cx="-106.52" cy="-61.5" data-axis="5"/>
                </g>
                <g class="radar-labels">
                    <text x="0" y="-168" data-axis="0">Test Auto</text>
                    <text x="148.96" y="-82" data-axis="1">Stability</text>
                    <text x="148.96" y="90" data-axis="2">Vehicle QA</text>
                    <text x="0" y="176" data-axis="3">AI Eval</text>
                    <text x="-148.96" y="90" data-axis="4">Platform</text>
                    <text x="-148.96" y="-82" data-axis="5">Delivery</text>
                </g>
                <line class="radar-sweep" x1="0" y1="0" x2="0" y2="-150"/>
            </svg>
        </div>

        <ul class="radar-legend">
            <li tabindex="0" data-axis="0" data-label="Test Auto" data-value="90" style="--accent: 124,140,255">
                <span class="dot"></span>
                <div>
                    <div class="r-name">自动化测试</div>
                    <div class="r-desc">Pytest · Selenium · 接口 / 端到端回归</div>
                </div>
                <span class="r-score">长期</span>
            </li>
            <li tabindex="0" data-axis="1" data-label="Stability" data-value="88" style="--accent: 89,227,255">
                <span class="dot"></span>
                <div>
                    <div class="r-name">稳定性</div>
                    <div class="r-desc">压测 · 容灾演练 · 故障注入 · 监控</div>
                </div>
                <span class="r-score">长期</span>
            </li>
            <li tabindex="0" data-axis="2" data-label="Vehicle QA" data-value="55" style="--accent: 184,136,255">
                <span class="dot"></span>
                <div>
                    <div class="r-name">无人车质量</div>
                    <div class="r-desc">车云链路 · OTA · 仿真 / 路测</div>
                </div>
                <span class="r-score">负责</span>
            </li>
            <li tabindex="0" data-axis="3" data-label="AI Eval" data-value="68" style="--accent: 124,255,180">
                <span class="dot"></span>
                <div>
                    <div class="r-name">AI 评测</div>
                    <div class="r-desc">WER · Benchmark · LLM-as-a-Judge</div>
                </div>
                <span class="r-score">落地</span>
            </li>
            <li tabindex="0" data-axis="4" data-label="Platform" data-value="76" style="--accent: 251,191,36">
                <span class="dot"></span>
                <div>
                    <div class="r-name">质量平台开发</div>
                    <div class="r-desc">FastAPI · React · TypeScript · MySQL</div>
                </div>
                <span class="r-score">交付</span>
            </li>
            <li tabindex="0" data-axis="5" data-label="Delivery" data-value="82" style="--accent: 248,113,113">
                <span class="dot"></span>
                <div>
                    <div class="r-name">工程交付</div>
                    <div class="r-desc">Docker · Jenkins / 云效 · SAE · 可观测性</div>
                </div>
                <span class="r-score">常用</span>
            </li>
        </ul>
    </div>
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
                <p>负责车端、云端和数据链路的端到端质量，覆盖仿真、路测、车云协同和 OTA。同期独立开发无人车质量中台，完成需求、前后端、数据库、CI/CD 和部署；平台支持测试执行、质量度量，以及基于测试结果的 AI 辅助分析。</p>
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
        {%- assign stack_items = "Python|Java|Ruby on Rails|Pytest|Selenium|FastAPI|React|TypeScript|Vite|Spring|MySQL|Redis / Tair|OceanBase|RocketMQ|Kafka|SOFA / 分布式事务|Docker|Kubernetes|Prometheus|Grafana|Jenkins|云效|Linux" | split: "|" -%}
        {% for tag in stack_items %}
        <span class="stack-chip" style="--i: {{ forloop.index0 }}">
            <span class="chip-glyph">{{ tag | slice: 0, 1 }}</span>
            {{ tag }}
        </span>
        {% endfor %}
    </div>
</section>

<!-- Music hobby -->
<section class="landing-section about-music-section" id="music">
    <header class="section-head">
        <span class="section-eyebrow">// off.work</span>
        <h2>工作之外的爱好 · Music</h2>
    </header>

    <div class="artist-card artist-card--about">
        <div class="artist-card__visual" aria-hidden="true">
            <div class="artist-orbit artist-orbit--outer"></div>
            <div class="artist-orbit artist-orbit--inner"></div>
            <div class="artist-disc">
                <span>XY</span>
                <small>AI MUSIC</small>
            </div>
            <div class="artist-wave"><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
        </div>

        <div class="artist-card__content">
            <span class="artist-card__badge"><span></span> PERSONAL HOBBY · MUSIC</span>
            <h3>音乐，工作之外的一点兴趣</h3>
            <p>业余时间我会创作音乐。生成式工具参与旋律、编曲和声音方案的生成与打磨，主题、取舍和最终成品由我自己决定。它不是我的职业主线，只是一个长期保留的爱好。</p>
            <p class="artist-card__note">发布作品时使用名字 <strong>xueyuan</strong>，目前可在网易云音乐和 QQ 音乐找到。本站播放器收录 <strong>{{ site.music_tracks.size }} 首作品</strong>：{% for track in site.music_tracks %}《{{ track.title }}》{% unless forloop.last %}、{% endunless %}{% endfor %}。</p>
            <div class="artist-card__actions">
                <button class="btn btn-primary" type="button" data-music-play>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.55.83l10.2-6.8a1 1 0 0 0 0-1.66L9.55 4.37A1 1 0 0 0 8 5.2z"/></svg>
                    播放站内作品
                </button>
                <button class="btn btn-ghost" type="button" data-music-queue-open>查看播放列表</button>
                <a class="btn btn-ghost" href="{{ site.netease_music_url }}" target="_blank" rel="noopener">网易云音乐</a>
                <a class="btn btn-ghost" href="{{ site.qq_music_url }}" target="_blank" rel="noopener">QQ 音乐</a>
            </div>
        </div>
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
        <a class="contact-card" href="{{ site.netease_music_url }}" target="_blank" rel="noopener">
            <div class="contact-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8.2 5.5A7.2 7.2 0 1 1 5.4 8"/><path d="M6.2 3.5c4.5-.2 7.6 2.2 8.2 5.5.5 2.8-1.2 5.2-3.8 5.6-2.1.3-4-1-4.3-2.8-.2-1.5.8-2.9 2.3-3.1 1.2-.2 2.3.5 2.5 1.6"/></svg>
            </div>
            <div class="contact-name">NetEase Music</div>
            <div class="contact-value">歌手 xueyuan</div>
            <div class="contact-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </div>
        </a>
        <a class="contact-card" href="{{ site.qq_music_url }}" target="_blank" rel="noopener">
            <div class="contact-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18.2V6.8l9-2.2V16"/><path d="M9 10.2l9-2.2"/><ellipse cx="6.5" cy="18.2" rx="2.5" ry="1.8"/><ellipse cx="15.5" cy="16" rx="2.5" ry="1.8"/></svg>
            </div>
            <div class="contact-name">QQ Music</div>
            <div class="contact-value">歌手 xueyuan</div>
            <div class="contact-arrow">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5l7 7-7 7"/></svg>
            </div>
        </a>
    </div>
</section>
