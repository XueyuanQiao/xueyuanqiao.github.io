---
layout: post
title: Python 网页采集：从单页脚本到可维护爬虫
date: 2017-09-22 16:16:13 +0800
excerpt: 不再罗列多年无人维护的爬虫仓库，而是从数据来源、合规边界、工具选型、限速重试、去重存储和可观测性出发，搭一套能长期运行的网页采集方案。
categories: Python
---

> 2017 年的原文是一份“32 个 Python 爬虫项目”链接清单。多年后，大部分目标站点、登录方式和反自动化机制都已经变化，照着旧仓库复制代码意义不大。本文改为一份不依赖具体网站的工程指南。

网页采集最容易写出的，是“在我的电脑上抓到一页”；真正困难的是持续、合规、可恢复地获取数据，并且在页面变化时知道哪里坏了。

## 第一步不是选框架，而是确认数据来源

建议按下面顺序查找：

1. 官方开放 API、数据导出或 RSS；
2. 页面 HTML 中已经存在的结构化数据；
3. 页面调用的公开接口；
4. 必须执行 JavaScript 才能得到的内容；
5. 需要登录、验证码或高风险绕过的内容。

越靠后，维护和合规成本越高。能使用官方 API，就不要把浏览器自动化当作默认方案。

在动手前至少确认：

- 站点服务条款和数据许可是否允许自动访问、保存与再分发；
- `robots.txt` 对相应路径的声明；
- 是否包含个人信息、账号数据或受版权保护的内容；
- 请求频率是否会影响对方服务；
- 是否有更合适的授权或数据合作渠道。

`robots.txt` 是爬虫行为约定，不等同于法律授权；允许抓取也不等于允许公开或商业使用。

## 工具怎么选

| 需求 | 合适工具 | 说明 |
| --- | --- | --- |
| 少量静态页面 | `httpx` / `requests` + Beautiful Soup / lxml | 依赖少，容易测试 |
| 站点级抓取、队列、去重、重试 | Scrapy | 工程能力完整，适合长期任务 |
| 页面依赖浏览器执行 JavaScript | Playwright | 只在确有需要时使用 |
| 数据接口已公开且有文档 | 官方 SDK 或 HTTP 客户端 | 稳定性通常最好 |
| 一次性数据整理 | 小脚本 + 明确的缓存和输出 | 不必先搭平台 |

浏览器自动化不是“更强的 requests”，它需要下载浏览器、执行页面资源，并承受更高的 CPU、内存和失败率。先验证静态 HTML 和接口，再决定是否引入 Playwright。

## 一个克制的单页采集器

下面的例子展示超时、明确的 User-Agent、状态码检查和结构化解析。选择器只是示例，不能直接套到其他站点。

{% highlight python %}
from dataclasses import dataclass
from urllib.parse import urljoin

import httpx
from bs4 import BeautifulSoup

@dataclass(frozen=True)
class Article:
    title: str
    url: str

def fetch_articles(url: str) -> list[Article]:
    headers = {
        "User-Agent": "example-research-bot/1.0 contact=you@example.com"
    }
    timeout = httpx.Timeout(10.0, connect=3.0)

    with httpx.Client(
        headers=headers,
        timeout=timeout,
        follow_redirects=True,
    ) as client:
        response = client.get(url)
        response.raise_for_status()

    soup = BeautifulSoup(response.text, "html.parser")
    articles = []
    for link in soup.select("article h2 a"):
        title = link.get_text(" ", strip=True)
        href = link.get("href")
        if title and href:
            articles.append(Article(title, urljoin(url, href)))
    return articles
{% endhighlight %}

这个示例还不适合直接放进定时任务。生产化至少还需要缓存、重试策略、去重、日志和数据校验。

## 重试不是无限重放

合理的重试通常只覆盖短暂故障，例如连接重置、`429` 和部分 `5xx`。应使用指数退避并尊重 `Retry-After`，同时设置总尝试次数。

以下情况不应盲目重试：

- `401` / `403`：通常是认证或访问策略问题；
- `404`：资源不存在，除非业务明确允许稍后出现；
- 解析失败：页面结构可能已经变化；
- 验证码或封禁页：应停止任务并人工检查。

重试之前还要确认操作是否幂等。普通 GET 一般可以安全重试，带副作用的请求不应被采集程序随意重放。

## 去重、增量与可恢复

长期任务至少要持久化三类状态：

- **请求状态**：URL、抓取时间、状态码、重试次数；
- **内容状态**：规范化 URL、内容哈希、版本或更新时间；
- **解析状态**：解析器版本、字段完整性、失败原因。

不要只用原始 URL 去重。跟踪参数、大小写、尾斜杠和重定向都可能让同一资源出现多个地址。可以先做 URL 规范化，再用业务主键或内容哈希兜底。

增量抓取优先利用 `ETag`、`Last-Modified`、更新时间字段或游标。没有变化的页面不必重复下载和解析。

## 动态页面什么时候用 Playwright

满足下面任一条件时才值得考虑浏览器：

- 关键内容在 JavaScript 执行后才生成；
- 必须完成页面交互才能取得公开数据；
- 需要验证真实浏览器渲染结果。

即便如此，也要先观察页面是否调用了稳定的数据接口。浏览器可用于确认交互和网络请求，采集任务未必需要永久依赖浏览器。

Playwright 任务应额外控制：

- 浏览器上下文和页面数量；
- 资源拦截（图片、字体等是否需要）；
- 导航、选择器和脚本超时；
- 截图、HAR 或 trace 等失败证据；
- 登录态与凭据的安全存储。

## 监控比“成功退出”更重要

进程返回 0 不能说明数据正确。建议监控：

- 每轮抓取数量和去重后新增数量；
- HTTP 状态码分布与重试率；
- 字段缺失率、解析失败率；
- 内容体积和关键字段分布变化；
- 单页耗时、队列积压和整体延迟。

例如，任务每天都“成功”，但新增记录突然从 5000 变成 0，往往是登录页、风控页或 DOM 改版被误当成正常内容。数据断言应和程序异常同等重要。

## 代码结构建议

一个容易维护的采集项目可以保持简单分层：

{% highlight text %}
src/
  client.py       # HTTP、限速、重试
  parser.py       # 纯解析逻辑
  models.py       # 数据结构与校验
  storage.py      # 幂等写入和版本
  pipeline.py     # 调度与状态流转
tests/
  fixtures/       # 脱敏后的固定 HTML
  test_parser.py
{% endhighlight %}

解析器尽量写成“HTML 输入、结构化对象输出”的纯函数，并保存少量脱敏页面作为回归样本。这样页面改版时可以离线定位，不必反复访问目标站点。

## 参考资料

- [RFC 9309：Robots Exclusion Protocol](https://www.rfc-editor.org/rfc/rfc9309)
- [Scrapy 官方文档](https://docs.scrapy.org/en/latest/)
- [Playwright for Python 官方文档](https://playwright.dev/python/docs/intro)
- [HTTPX 官方文档](https://www.python-httpx.org/)
