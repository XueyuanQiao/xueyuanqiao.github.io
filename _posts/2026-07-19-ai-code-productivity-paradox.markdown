---
layout: post
title: AI 写了 75% 的代码，我们怎么没快 75%
date: 2026-07-19 22:30:00 +0800
excerpt: AI 加速了写代码，却没有同时加速需求理解、测试、评审和上线。生成比例可以很高，整个团队仍可能被验证和返工拖慢。
categories: AI
permalink: /ai/engineering/2026/07/19/ai-code-productivity-paradox.html
---

2026 年 4 月，Google CEO Sundar Pichai 说，公司大约 75% 的新代码已经由 AI 生成，再交给工程师审核。

另一边，METR 找了 16 位资深开源维护者，让他们在自己长期参与的仓库里做真实任务。允许使用 AI 的任务，平均慢了 19%。这些开发者原本觉得自己会快 24%，做完以后还觉得快了 20%。

两个数字没有打架。Google 统计的是代码从哪里来，METR 统计的是一件事多久做完。

一项需求从开始到上线，大致要经过：

> 理解需求 → 写代码 → 测试 → 评审 → 发布

AI 目前最明显地加速了“写代码”。后面几段没有自动变快，有时还会因为代码增加而变慢。这就是全文的核心。

<!-- more -->

## 两个数字测的不是一件事

“75% 由 AI 生成”听起来很大，和“节省了 75% 的研发时间”差得很远。

假设一个任务原来需要 100 分钟：理解需求 20 分钟，写代码 30 分钟，测试和评审 50 分钟。AI 把写代码从 30 分钟压到 10 分钟，整个任务也只是从 100 分钟变成 80 分钟。

如果 AI 生成的代码还带来 25 分钟额外检查和返工，总时间就会变成 105 分钟。AI 写掉了大部分代码，人却比以前更慢。

GitHub 的 Copilot 实验和 METR 的实验，差别就在这里。

GitHub 让 95 位开发者从零写同一个 JavaScript HTTP 服务器，使用 Copilot 的一组快了 55%。任务规格清楚、环境干净，写完也容易判断对错。编码时间减少，几乎直接变成了任务时间减少。

METR 测的是成熟仓库里的真实缺陷、功能和重构。一个小补丁背后可能有几年历史、兼容要求和项目惯例。模型把代码写完，维护者仍要确认它有没有破坏别的东西。

所以，越容易检查结果的任务，AI 越容易带来净收益。数据转换、脚手架和重复测试通常比较合适；支付状态、权限、并发和跨系统改造要谨慎得多。

Stack Overflow 2025 年的调查也说明了这个问题。84% 的受访者正在使用或准备使用 AI 工具，信任其准确性的只有 33%，明确不信任的有 46%。大家最烦的是“几乎正确，还差一点”。完全错的代码可以直接丢掉，“差一点”的代码才需要花时间排查。

## 省下来的时间去了哪里

很多时间去了评审。

GitLab 2026 年调查了六个国家的 1528 名开发者和技术采购者。78% 的人说写入和提交代码变快了，85% 说瓶颈已经转到评审，43% 无法可靠区分自己仓库里的人工代码和 AI 代码。

原因很直接：AI 可以在几分钟内生成大量代码，熟悉业务和系统的 reviewer 没有增加。他们仍要弄清楚需求、阅读 diff、检查边界条件，再决定能不能合并。

于是前面写得越快，后面的 PR 队列可能越长。代码已经生成，却还没有被验证、合并和上线，对用户没有产生价值。

DORA 2025 报告把 AI 叫作“放大器”。测试扎实、反馈快、责任清楚的团队，更容易把 AI 代码送到线上。CI 不稳定、关键知识只在人脑子里的团队，会先看到 PR 变多，然后看到评审、发布和运维一起变忙。

这也是为什么不能只看代码行数、PR 数量和 AI 生成比例。更有用的是看：

- 一个任务从开始到上线花了多久；
- PR 等待评审多久；
- AI 代码被人工修改了多少；
- 上线后的缺陷和回滚有没有增加。

这些数字变好，才说明团队真的快了。

## 真正该改什么

团队首先要补验证能力。

需求、约束和验收标准写清楚，减少 Agent 猜错方向；让测试、静态检查和安全扫描先挡一轮，减少 reviewer 的机械劳动；把真实缺陷和历史事故整理成自己的 eval，换模型后重新验证；控制 PR 大小，并记录代码来源和回滚方式。

这些工作看起来没有“AI 写了多少代码”亮眼，却决定了生成速度能不能变成交付速度。

对个人来说，写语法会越来越便宜，判断和验证会越来越贵。工程师需要更会澄清需求、设计测试、理解系统影响，也要能解释为什么选择这个方案，并为合并结果负责。

新人培养也要跟着调整。样板代码和小功能可以少写，但不能只学会发指令和接受结果。新人仍要解释方案、参与评审、补验证证据，并跟到上线。否则几年以后，团队可能拥有很多 Agent，却缺少能判断 Agent 是否做对的人。

## 结论

一句话总结：**AI 让代码生成变便宜，却把研发瓶颈推向了验证、评审和责任判断。**

所以，AI 代码占比不是效率指标。真正要看的是，一项需求能不能用更短时间完成验证并可靠上线。如果生成比例提高了，PR 等待、人工返工和线上缺陷也一起增加，团队只是把工作从编码阶段搬到了验证阶段。

对团队来说，提效的关键是测试、评审、eval 和清晰的验收标准能不能跟上代码产量。对个人来说，价值会从“写出代码”更多转向“判断代码是否正确、是否值得合并，并为结果负责”。

75% 不值得单独庆祝。可靠变更交付得更快，才算真的快了。

## 参考资料

- [DevOps.com：Google CEO Says 75% of New Code is AI-Generated](https://devops.com/google-ceo-says-75-of-new-code-is-ai-generated/)
- [METR：Measuring the Impact of Early-2025 AI on Experienced Open-Source Developer Productivity](https://metr.org/blog/2025-07-10-early-2025-ai-experienced-os-dev-study/)
- [Anthropic：How Anthropic teams use Claude Code](https://claude.com/blog/how-anthropic-teams-use-claude-code)
- [GitHub：Quantifying GitHub Copilot's impact on developer productivity](https://github.blog/news-insights/research/research-quantifying-github-copilots-impact-on-developer-productivity-and-happiness/)
- [The New Stack：Developers are now validating code they didn't write](https://thenewstack.io/gitlab-ai-code-governance/)
- [Stack Overflow：2025 Developer Survey—AI](https://survey.stackoverflow.co/2025/ai/)
- [Google DORA：State of AI-assisted Software Development 2025](https://dora.dev/research/2025/dora-report/)
