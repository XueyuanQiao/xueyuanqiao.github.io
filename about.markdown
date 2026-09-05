---
layout: landing
title: 关于
excerpt: 全栈开发工程师，企业信息化系统与大模型工程化方向，十年大厂质量工程做底座
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
            <span class="about-eyebrow-text">// 个人说明 · 2026.09 更新</span>
        </div>

        <h1 class="about-title">
            <span class="about-title-line">你好，我是</span>
            <span class="about-title-line">
                <span class="grad-text">Xueyuan</span><span class="about-title-cursor">▍</span>
            </span>
        </h1>

        <p class="about-typed">
            <span data-typed
                  data-typed-strings='["全栈开发工程师","企业信息化系统交付","大模型工程化与 Agent 落地","需求到上线完整闭环","平台与业务系统独立交付","十年质量工程与稳定性经验"]'>
            </span><span class="caret">_</span>
        </p>

        <div class="about-status">
            <span class="status-pill status-pill--online">
                <span class="status-led"></span>
                <span>九识智能</span>
            </span>
            <span class="status-pill">
                <span class="status-key">当前</span>
                <span class="status-val">全栈开发</span>
            </span>
            <span class="status-pill">
                <span class="status-key">地点</span>
                <span class="status-val">杭州</span>
            </span>
            <span class="status-pill">
                <span class="status-key">方向</span>
                <span class="status-val">企业信息化全栈 / 大模型工程化</span>
            </span>
            <span class="status-pill">
                <span class="status-key">从业计时</span>
                <span class="status-val" data-about-uptime>—</span>
            </span>
        </div>

        <div class="about-quick">
            <a class="btn btn-primary" href="#transition">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3h7v7"/><path d="M10 14L21 3"/><path d="M21 14v7H3V3h7"/></svg>
                从测开到全栈
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
                <span class="snap-val" data-text="1. 身份与目标 · Identity"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">身份</span>
                <span class="snap-val" data-text="乔雪源 / Xueyuan，全栈开发工程师。2016—2026 在大厂做测试开发与质量工程，现在做全栈。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">当前</span>
                <span class="snap-val" data-text="在九识智能做企业信息化系统，从需求到上线一个人闭环。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">目标</span>
                <span class="snap-val" data-text="把大模型做成公司能管住的公共能力；再往前是业务合伙人（BP）角色，用技术换业务人效。"></span>
            </li>

            <li class="snap-line snap-head">
                <span class="snap-hash">#</span>
                <span class="snap-val" data-text="2. 业务背景 · Context"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">经历</span>
                <span class="snap-val" data-text="历经 SaaS 客服、百度核心搜索、支付宝基金与个人养老金、ASR / 翻译 / TTS 实时语音、L4 无人配送车，长期处理高可用、长链路与复杂协同场景。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">责任域</span>
                <span class="snap-val" data-text="当前覆盖业务需求与方案、前后端实现、数据建模、鉴权与权限、CI/CD 流水线、部署运维和线上问题闭环。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">交付域</span>
                <span class="snap-val" data-text="一个系统的全部环节都在我手上：需求分析、产品与交互设计、前后端、数据建模、CI/CD、部署和上线后的治理。"></span>
            </li>

            <li class="snap-line snap-head">
                <span class="snap-hash">#</span>
                <span class="snap-val" data-text="3. 核心能力 · Capabilities"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">全栈</span>
                <span class="snap-val" data-text="React / TypeScript 前端，FastAPI 与 Spring Boot 后端，MySQL / Redis / OceanBase 数据层，RocketMQ / Kafka / MQTT 消息，Nacos / Diamond / Apollo 配置中心，XXL-JOB 定时调度，Docker 与流水线部署。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">大模型</span>
                <span class="snap-val" data-text="企业级大模型网关：多租户预算逐级分配与实时计费、供应商故障自动容错、多模型协议统一、全链路调用审计。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">业务</span>
                <span class="snap-val" data-text="贴着业务方定义问题，判断需求真伪与优先级，用流程重构和自动化换人效。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">底座</span>
                <span class="snap-val" data-text="十年质量工程留下的：容量基线、全链路压测、容灾演练、监控与复盘。写业务代码先算故障代价，是那时候养成的。"></span>
            </li>

            <li class="snap-line snap-head">
                <span class="snap-hash">#</span>
                <span class="snap-val" data-text="4. 工作原则 · Operating Principles"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">判断</span>
                <span class="snap-val" data-text="先定义问题、风险与证据，再选择技术；不以功能数、工具数或代码量替代业务结果。"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">协作</span>
                <span class="snap-val" data-text="用 AI 加速调研、原型、开发与分析；关键判断回到原始数据，代码进入正常的评审、测试和发布流程。"></span>
            </li>

            <li class="snap-line snap-head">
                <span class="snap-hash">#</span>
                <span class="snap-val" data-text="5. 完成标准 · Success Criteria"></span>
            </li>
            <li class="snap-line snap-item">
                <span class="snap-field">验收</span>
                <span class="snap-val" data-text="链路能复现，风险有边界，改动不用重写，能交给别人接手。"></span>
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
                <span class="snap-stat-label">工程年限</span>
            </div>
            <div class="snap-stat">
                <span class="snap-stat-value">4</span>
                <span class="snap-stat-label">主要业务领域</span>
            </div>
            <div class="snap-stat">
                <span class="snap-stat-value">0→1</span>
                <span class="snap-stat-label">平台独立自研上线</span>
            </div>
        </div>

        <a class="snapshot-cta" data-snapshot-cta href="#experience">
            <span class="snapshot-cta-glow" aria-hidden="true"></span>
            <span class="snapshot-cta-icon" aria-hidden="true">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/><path d="M8 13h8"/><path d="M8 17h8"/><path d="M8 9h2"/></svg>
            </span>
            <span class="snapshot-cta-text">
                <span class="snapshot-cta-main">完整职业经历与技术栈</span>
                <span class="snapshot-cta-sub">能力雷达 · 六段经历 · 技术栈</span>
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
            <h3>先判断业务价值，再决定怎么做</h3>
            <p>先看业务目标、关键链路和故障代价，再决定做什么、做多深。验收看业务流程有没有变化，不看交付了多少功能。</p>
        </article>
        <article class="manifesto-card" style="--accent: 89,227,255">
            <div class="manifesto-num">02</div>
            <h3>不同问题，用不同的尺子</h3>
            <p>确定性系统靠契约、自动化和门禁；大模型输出靠固定评测集、多维指标和人工抽检。两类问题分开治理。</p>
        </article>
        <article class="manifesto-card" style="--accent: 184,136,255">
            <div class="manifesto-num">03</div>
            <h3>让 AI 提速，责任仍由人承担</h3>
            <p>用 AI 查资料、做原型、写代码和分析结果；关键结论要能回到原始数据，代码仍要经过评审、测试和发布流程。</p>
        </article>
        <article class="manifesto-card" style="--accent: 124,255,180">
            <div class="manifesto-num">04</div>
            <h3>把一次性交付变成长期资产</h3>
            <p>高频动作接进流水线，能力做成可复用的平台，指标、失败样本和复盘留在系统里。工具会换，判断依据不能丢。</p>
        </article>
    </div>
</section>

<!-- Transition & roadmap -->
<section class="landing-section about-manifesto" id="transition">
    <header class="section-head">
        <span class="section-eyebrow">// transition.log</span>
        <h2>从测开到全栈 · Transition</h2>
    </header>

    <div class="manifesto-grid">
        <article class="manifesto-card" style="--accent: 148,163,184">
            <div class="manifesto-num">01</div>
            <h3>过去 · 十年质量工程与测试开发</h3>
            <p>2016 到 2026，在 SaaS、搜索、金融、实时语音四类业务做测试开发与质量工程：自动化体系、全链路压测、容灾演练、发布门禁，其间在百度转过一段垂类研发。留下来的是风险判断和对复杂系统的认知。</p>
        </article>
        <article class="manifesto-card" style="--accent: 124,140,255">
            <div class="manifesto-num">02</div>
            <h3>转型 · 独立交付一套平台</h3>
            <p>一套内部平台从零做到线上，全部环节一个人完成：信息架构、界面交互、登录鉴权、前后端、数据建模、实时消息、异步任务编排、容器化部署和线上运维；流水线侧打通自动构建、镜像发布、合入前冒烟拦截和发布通知。平台至今在真实业务里持续使用和迭代。</p>
        </article>
        <article class="manifesto-card" style="--accent: 89,227,255">
            <div class="manifesto-num">03</div>
            <h3>现在 · 全栈开发，企业信息化</h3>
            <p>先和业务方把问题、流程和收益定清楚，再判断做不做、做到什么程度，然后自己做出来、发上去、维护住。对流程效率和线上表现负责，不只对交付物负责。</p>
        </article>
        <article class="manifesto-card" style="--accent: 184,136,255">
            <div class="manifesto-num">04</div>
            <h3>下一步 · 企业级大模型网关</h3>
            <p>要解决四件事：算力开销只能事后对账、成本落不到团队；单一供应商抖动拖停业务；接新模型要改代码；调用记录分散、合规无从追溯。目标是预算逐级分配、花超即停，供应商故障自动切换，接新模型走配置，每笔调用可追溯。再往前一步是业务合伙人（BP）角色。</p>
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
                <polygon class="radar-shape" points="0,-138 114.32,-66 77.94,45 0,105 -106.52,61.5 -110.42,-63.75"/>
                <g class="radar-points">
                    <circle r="5" cx="0" cy="-138" data-axis="0"/>
                    <circle r="5" cx="114.32" cy="-66" data-axis="1"/>
                    <circle r="5" cx="77.94" cy="45" data-axis="2"/>
                    <circle r="5" cx="0" cy="105" data-axis="3"/>
                    <circle r="5" cx="-106.52" cy="61.5" data-axis="4"/>
                    <circle r="5" cx="-110.42" cy="-63.75" data-axis="5"/>
                </g>
                <g class="radar-labels">
                    <text x="0" y="-168" data-axis="0">Full-Stack</text>
                    <text x="148.96" y="-82" data-axis="1">Delivery</text>
                    <text x="148.96" y="90" data-axis="2">LLM Eng</text>
                    <text x="0" y="176" data-axis="3">Business</text>
                    <text x="-148.96" y="90" data-axis="4">Platform</text>
                    <text x="-148.96" y="-82" data-axis="5">Reliability</text>
                </g>
                <line class="radar-sweep" x1="0" y1="0" x2="0" y2="-150"/>
            </svg>
        </div>

        <ul class="radar-legend">
            <li tabindex="0" data-axis="0" data-label="Full-Stack" data-value="92" style="--accent: 124,140,255">
                <span class="dot"></span>
                <div>
                    <div class="r-name">全栈开发</div>
                    <div class="r-desc">React / TS · Spring · FastAPI · MQ · 配置中心 · 调度</div>
                </div>
                <span class="r-score">主职</span>
            </li>
            <li tabindex="0" data-axis="1" data-label="Delivery" data-value="88" style="--accent: 89,227,255">
                <span class="dot"></span>
                <div>
                    <div class="r-name">工程交付</div>
                    <div class="r-desc">Docker · CI/CD 流水线 · 部署运维 · 可观测性</div>
                </div>
                <span class="r-score">常用</span>
            </li>
            <li tabindex="0" data-axis="2" data-label="LLM Eng" data-value="60" style="--accent: 184,136,255">
                <span class="dot"></span>
                <div>
                    <div class="r-name">大模型工程化</div>
                    <div class="r-desc">配额树 · 流式计费 · Fallback · 协议统一</div>
                </div>
                <span class="r-score">在建</span>
            </li>
            <li tabindex="0" data-axis="3" data-label="Business" data-value="70" style="--accent: 124,255,180">
                <span class="dot"></span>
                <div>
                    <div class="r-name">业务理解</div>
                    <div class="r-desc">需求判断 · 流程重构 · 人效提升</div>
                </div>
                <span class="r-score">进行中</span>
            </li>
            <li tabindex="0" data-axis="4" data-label="Platform" data-value="82" style="--accent: 251,191,36">
                <span class="dot"></span>
                <div>
                    <div class="r-name">平台建设</div>
                    <div class="r-desc">从需求到上线独立自研内部平台</div>
                </div>
                <span class="r-score">交付</span>
            </li>
            <li tabindex="0" data-axis="5" data-label="Reliability" data-value="85" style="--accent: 248,113,113">
                <span class="dot"></span>
                <div>
                    <div class="r-name">稳定性与质量</div>
                    <div class="r-desc">压测 · 容灾 · 故障注入 · 监控与门禁</div>
                </div>
                <span class="r-score">底座</span>
            </li>
        </ul>
    </div>
</section>

<!-- Career timeline -->
<section class="landing-section about-timeline-section" id="experience">
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
                    <span class="tl-tag">九识智能 · 全栈开发</span>
                </div>
                <h3>全栈开发 · 企业信息化系统</h3>
                <p>岗位从测试开发转为全栈开发，方向是企业信息化系统：贴着业务方定义问题，再独立把系统从需求做到上线并持续维护。下一阶段的主战场是企业级大模型网关，把分散的调用收进统一入口，解决成本归属、供应商容错、多模型接入和调用审计四件事。</p>
                <div class="tl-chips">
                    <span>企业信息化</span><span>全栈交付</span><span>LLM Gateway</span><span>Go</span><span>Agent</span><span>线上治理</span>
                </div>
            </div>
        </li>
        <li class="tl-item">
            <span class="tl-node"></span>
            <div class="tl-card">
                <div class="tl-meta">
                    <span class="tl-year">2026 上半年</span>
                    <span class="tl-tag">九识智能 · L4</span>
                </div>
                <h3>平台自研与流水线建设（转型验证期）</h3>
                <p>入职时岗位是测试开发，承接 L4 无人配送车业务的质量保障、灰度跟进与云端压测。同期重心压到工程建设上：一套内部平台的需求、界面交互、鉴权、前后端、数据建模、实时消息、任务编排、CI/CD 与部署运维由我一个人做完，并打通自动构建、发布通知与合入前冒烟拦截。</p>
                <div class="tl-chips">
                    <span>React / TypeScript</span><span>FastAPI</span><span>Java / Spring</span><span>MySQL / Tair</span><span>MQTT</span><span>Docker</span><span>CI/CD</span>
                </div>
            </div>
        </li>
        <li class="tl-item">
            <span class="tl-node"></span>
            <div class="tl-card">
                <div class="tl-meta">
                    <span class="tl-year">2025 — 2026</span>
                    <span class="tl-tag">腾展 · ASR / 翻译 / TTS</span>
                </div>
                <h3>AI Phone 测试负责人 / AI 评测基建</h3>
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

    <p style="margin: 18px 0 0; padding-left: 48px; font-family: var(--font-mono); font-size: 0.8rem; color: var(--text-3);">
        2016—2026 测开时期的旧版履历留档：<a href="{{ '/about/2026/02/22/intro.html' | relative_url }}" style="color: inherit; text-decoration: underline; text-underline-offset: 3px;">archive</a>
    </p>
</section>

<!-- Tech stack marquee -->
<section class="landing-section about-stack-section">
    <header class="section-head">
        <span class="section-eyebrow">// stack</span>
        <h2>常用技术 · Tech Stack</h2>
    </header>
    <div class="about-stack">
        {%- assign stack_groups = "语言@Python,Go,Java,TypeScript,Ruby,Shell;;前端@React,Ant Design,Vite,Zustand,Three.js,WebSocket;;后端@FastAPI,Spring Boot,SQLAlchemy / Alembic,MyBatis,Dubbo RPC,Ruby on Rails;;大模型@LLM Gateway,Agent / MCP,LangChain,RAG,Evals,LLM-as-a-Judge;;数据@MySQL,OceanBase,Redis / Tair,数据建模 / ER,SQL 调优;;中间件@RocketMQ,Kafka,EMQX / MQTT,Dubbo,SOFA / 分布式事务;;配置与调度@Nacos,Diamond,Apollo,XXL-JOB,APScheduler;;运维部署@Docker,Kubernetes,Jenkins,云效,SAE,Nginx,Linux;;可观测@Prometheus,Grafana,APM / Trace,日志与告警,SLO;;质量与稳定性@Pytest,JUnit,Selenium,Appium,Minitest,全链路压测,故障注入,容灾演练;;设计@OpenAPI / Swagger,接口契约,领域建模,信息架构,交互设计" | split: ";;" -%}
        {% for group in stack_groups %}
        {%- assign gparts = group | split: "@" -%}
        {%- assign gitems = gparts[1] | split: "," -%}
        <div class="stack-group">
            <span class="stack-group-label">{{ gparts[0] }}</span>
            {% for tag in gitems %}
            <span class="stack-chip" style="--i: {{ forloop.parentloop.index0 | times: 2 | plus: forloop.index0 }}">
                <span class="chip-glyph">{{ tag | slice: 0, 1 }}</span>
                {{ tag }}
            </span>
            {% endfor %}
        </div>
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
            <p>业余时间写歌。生成式工具参与旋律、编曲和声音方案的生成与打磨，主题、取舍和成品由我自己定。一个留了很久的爱好，跟工作不搭边。</p>
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
