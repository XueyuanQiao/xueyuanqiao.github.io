---
layout: landing
title: 关于
excerpt: 关于本站与作者
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
            <img src="{{ '/images/head.jpeg' | relative_url }}" alt="头像" width="160" height="160" decoding="async">
            <div class="holo-scan"></div>
        </div>
        <canvas class="holo-rain" aria-hidden="true"></canvas>
    </div>

    <div class="about-hero-content">
        <div class="about-eyebrow">
            <span class="dot"></span>
            <span class="about-eyebrow-text">// profile · uplink established</span>
        </div>

        <h1 class="about-title">
            <span class="about-title-line">你好，我是</span>
            <span class="about-title-line">
                <span class="grad-text">Xueyuan</span><span class="about-title-cursor">▍</span>
            </span>
        </h1>

        <p class="about-typed">
            <span data-typed
                  data-typed-strings='["十年质量工程师","AI Native 探索者","金融级稳定性玩家","Aurora 主题作者","好奇心驱动的写作者"]'>
            </span><span class="caret">_</span>
        </p>

        <div class="about-status">
            <span class="status-pill status-pill--online">
                <span class="status-led"></span>
                <span>在线 · Online</span>
            </span>
            <span class="status-pill">
                <span class="status-key">FOCUS</span>
                <span class="status-val">AI × QA</span>
            </span>
            <span class="status-pill">
                <span class="status-key">TZ</span>
                <span class="status-val">UTC+8 / Hangzhou</span>
            </span>
            <span class="status-pill">
                <span class="status-key">UPTIME</span>
                <span class="status-val" data-about-uptime>—</span>
            </span>
        </div>

        <div class="about-quick">
            <a class="btn btn-primary" href="{{ '/about/2026/02/22/intro.html' | relative_url }}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3h7v7"/><path d="M10 14L21 3"/><path d="M21 14v7H3V3h7"/></svg>
                完整个人概述
            </a>
            <a class="btn btn-ghost" href="mailto:{{ site.email }}">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16v16H4z"/><path d="M22 6l-10 7L2 6"/></svg>
                {{ site.email }}
            </a>
        </div>
    </div>
</section>

<!-- System status / boot sequence -->
<section class="landing-section about-system">
    <header class="section-head">
        <span class="section-eyebrow">// system.status</span>
        <h2>当前频段 · System Status</h2>
    </header>

    <div class="about-system-grid">
        <div class="about-terminal" aria-hidden="true">
            <div class="terminal-bar">
                <span class="t-dot t-dot-r"></span>
                <span class="t-dot t-dot-y"></span>
                <span class="t-dot t-dot-g"></span>
                <span class="t-title">~/about — boot.sequence</span>
            </div>
            <div class="terminal-body">
                <div class="t-line"><span class="t-prompt">▶</span> <span class="t-cmd">whoami</span></div>
                <div class="t-line t-out">  xueyuan · <span class="t-hl">Quality Engineer</span> @ <span class="t-arg">AI-native era</span></div>
                <div class="t-line"><span class="t-prompt">▶</span> <span class="t-cmd">stack.list</span> <span class="t-arg">--top 6</span></div>
                <div class="t-line t-out">  Python · Java · Ruby · LLM · Pytest · Selenium</div>
                <div class="t-line"><span class="t-prompt">▶</span> <span class="t-cmd">mission.show</span></div>
                <div class="t-line t-out">  让 AI 成为质量工程的<span class="t-hl">第一公民</span>，而不是补丁。</div>
                <div class="t-line"><span class="t-prompt">▶</span> <span class="t-cmd">ping</span> <span class="t-arg">latest.thoughts</span></div>
                <div class="t-line t-out">  ✓ <span class="t-hl">{{ site.posts.size }}</span> articles · last <span class="t-hl">{{ site.posts.first.date | date: "%Y-%m-%d" }}</span></div>
                <div class="t-line t-out">  <span class="t-dim">ready.</span> <span class="t-cursor">▍</span></div>
            </div>
        </div>

        <div class="about-metrics">
            <div class="about-metric">
                <span class="m-label">Articles</span>
                <span class="m-value" data-counter="{{ site.posts.size }}">0</span>
                <span class="m-sub">已发布文章</span>
            </div>
            <div class="about-metric">
                <span class="m-label">Categories</span>
                <span class="m-value" data-counter="{{ site.categories.size }}">0</span>
                <span class="m-sub">主题分类</span>
            </div>
            <div class="about-metric">
                <span class="m-label">Years in QA</span>
                <span class="m-value" data-counter="10">0</span>
                <span class="m-sub">质量工程经验</span>
            </div>
            <div class="about-metric">
                <span class="m-label">Coffee · ∞</span>
                <span class="m-value about-metric-glyph">∞</span>
                <span class="m-sub">每日续航来源</span>
            </div>
        </div>
    </div>
</section>

<!-- Manifesto -->
<section class="landing-section about-manifesto">
    <header class="section-head">
        <span class="section-eyebrow">// manifesto</span>
        <h2>我相信什么 · What I Build For</h2>
    </header>

    <div class="manifesto-grid">
        <article class="manifesto-card" style="--accent: 124,140,255">
            <div class="manifesto-num">01</div>
            <h3>把 AI 接进真实链路</h3>
            <p>LLM 不是 demo 的玩具，而是能被压测、能被回归、能被治理的工程组件。我做的是让它跑在 CI 里。</p>
        </article>
        <article class="manifesto-card" style="--accent: 89,227,255">
            <div class="manifesto-num">02</div>
            <h3>测试是产品力</h3>
            <p>稳定性不是冷冰冰的数字，是用户对你产品的信任。金融级 99.99% 背后是工程审美与笨功夫。</p>
        </article>
        <article class="manifesto-card" style="--accent: 184,136,255">
            <div class="manifesto-num">03</div>
            <h3>持续学习的复利</h3>
            <p>每周读论文、写小工具、给团队做技术分享。技术栈会变，但好奇心和写作能复利。</p>
        </article>
        <article class="manifesto-card" style="--accent: 124,255,180">
            <div class="manifesto-num">04</div>
            <h3>简单胜于复杂</h3>
            <p>能用一个清晰的脚本说清楚的事情，不引入框架。能用一段对话讲明白的设计，不画 UML。</p>
        </article>
    </div>
</section>

<!-- Skill radar -->
<section class="landing-section about-radar-section">
    <header class="section-head">
        <span class="section-eyebrow">// matrix.radar</span>
        <h2>能力雷达 · Skill Radar</h2>
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
            <li data-axis="0" style="--accent: 124,140,255">
                <span class="dot"></span>
                <div>
                    <div class="r-name">AI &amp; LLM</div>
                    <div class="r-desc">Agent · RAG · LLM-as-a-Judge · Prompt</div>
                </div>
                <span class="r-score">92</span>
            </li>
            <li data-axis="1" style="--accent: 89,227,255">
                <span class="dot"></span>
                <div>
                    <div class="r-name">Test Automation</div>
                    <div class="r-desc">框架设计 · 白/灰盒 · CI/CD · 覆盖率治理</div>
                </div>
                <span class="r-score">95</span>
            </li>
            <li data-axis="2" style="--accent: 184,136,255">
                <span class="dot"></span>
                <div>
                    <div class="r-name">Distributed</div>
                    <div class="r-desc">高并发 · 全链路压测 · 混沌工程</div>
                </div>
                <span class="r-score">85</span>
            </li>
            <li data-axis="3" style="--accent: 124,255,180">
                <span class="dot"></span>
                <div>
                    <div class="r-name">Quality Governance</div>
                    <div class="r-desc">QA Owner · 风险建模 · 测试左移 · SLO</div>
                </div>
                <span class="r-score">90</span>
            </li>
            <li data-axis="4" style="--accent: 251,191,36">
                <span class="dot"></span>
                <div>
                    <div class="r-name">Coding Craft</div>
                    <div class="r-desc">Python · Java · Ruby · 工程化 · 调试直觉</div>
                </div>
                <span class="r-score">88</span>
            </li>
            <li data-axis="5" style="--accent: 248,113,113">
                <span class="dot"></span>
                <div>
                    <div class="r-name">Writing &amp; Sharing</div>
                    <div class="r-desc">技术写作 · 分享 · 团队赋能</div>
                </div>
                <span class="r-score">80</span>
            </li>
        </ul>
    </div>
</section>

<!-- Career timeline -->
<section class="landing-section about-timeline-section">
    <header class="section-head">
        <span class="section-eyebrow">// timeline</span>
        <h2>这十年走过的路 · Career Trajectory</h2>
    </header>

    <ol class="about-timeline" data-about-timeline>
        <li class="tl-item">
            <span class="tl-node"></span>
            <div class="tl-card">
                <div class="tl-meta">
                    <span class="tl-year">2026 — Now</span>
                    <span class="tl-tag">菜鸟无人车 · L4</span>
                </div>
                <h3>L4 无人配送车的端到端质量</h3>
                <p>把过往十年沉淀的测试架构方法论与 AI 能力，带进 <strong>感知 / 规划 / 控制</strong> 全链路。质量保障的对象，从"软件系统"扩展到"软件 + 硬件 + 物理世界"——在这里第一次真正理解<em>"安全是工程问题"</em>。</p>
                <div class="tl-chips">
                    <span>L4 Autonomy</span><span>Simulation</span><span>Road Test</span><span>OTA</span><span>Agent Eval</span>
                </div>
            </div>
        </li>
        <li class="tl-item">
            <span class="tl-node"></span>
            <div class="tl-card">
                <div class="tl-meta">
                    <span class="tl-year">2025 — 2026</span>
                    <span class="tl-tag">海外通讯 · 同声传译</span>
                </div>
                <h3>第一次把 AI 跑进真实链路</h3>
                <p>负责海外通讯同声传译产品的质量保障，深入 <strong>ASR / TTS</strong> 端到端语音链路。在这里第一次系统性接触 AI——把语音识别、机器翻译、语音合成这条流水线的<strong>语义指标</strong>纳入测试体系，从此明白 AI 系统的质量必须用"评估"而不是"断言"来衡量。</p>
                <div class="tl-chips">
                    <span>ASR</span><span>TTS</span><span>Speech Quality</span><span>AI Eval</span>
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
                <h3>把质量做进金融级支付</h3>
                <p>担任核心业务 QA Owner，主导 <strong>个人养老金</strong> 国家级战略项目的质量护航，长期负责养老基金等核心金融业务的日常治理。把"99.99% 高可用"从 PPT 落到全链路压测、容灾演练、混沌注入与资金链路对账，踩过一次次真实流量的雷。</p>
                <div class="tl-chips">
                    <span>Stress Test</span><span>Chaos</span><span>Risk Control</span><span>SLO</span>
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
                <h3>大搜索体系下的稳定性</h3>
                <p>在百度大搜索从测试起步、再向研发延伸，深度参与亿级 PV 检索链路的质量保障与核心模块演进。在这里学会了用数据说话，也第一次见识"规模"二字的分量，奠定了 <em>以研发视角重塑质量底座</em> 的方法论根基。</p>
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
                <h3>从 SaaS 客服系统起步</h3>
                <p>第一份工作做 SaaS 客服系统的测试，覆盖 <strong>Web 端、服务端、自动化</strong> 全链条。从一行行用例写起，把功能、接口、UI 自动化串成一张能跑得稳的网，也是从这里开始相信——好的测试不是事后补救，而是写在产品里的工程能力。</p>
                <div class="tl-chips">
                    <span>SaaS</span><span>Web</span><span>Backend</span><span>Automation</span>
                </div>
            </div>
        </li>
    </ol>
</section>

<!-- Tech stack marquee -->
<section class="landing-section about-stack-section">
    <header class="section-head">
        <span class="section-eyebrow">// stack</span>
        <h2>常驻工具箱 · Tech Stack</h2>
    </header>
    <div class="about-stack">
        {%- assign stack_items = "Python|Java|Ruby on Rails|Pytest|Selenium|LangChain|Claude|MCP|FastAPI|Spring|MySQL|Redis|Kafka|Docker|Kubernetes|Prometheus|Grafana|Jenkins|GitHub Actions|Linux|VS Code|Cursor|Notion|Obsidian" | split: "|" -%}
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
        <span class="section-eyebrow">// uplink</span>
        <h2>联系频道 · Get in Touch</h2>
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
        主题 <strong>Aurora</strong> 为自研：玻璃拟态 + 极光渐变 + 微交互，零运行时依赖，原生 ES。
    </p>
</section>
