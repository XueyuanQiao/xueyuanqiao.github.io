# Frontmatter 字段速查

每篇文章顶部必须以两组 `---` 包裹一段 YAML，称为 Frontmatter。

## 标准模板

```yaml
---
layout: post
title: 文章标题
date: 2026-03-15 09:30:00 +0800
excerpt: 一句摘要，会显示在列表卡片和分类页上。
categories: ai llm test
---
```

## 字段说明

| 字段 | 类型 | 必填 | 默认 | 说明 |
| --- | --- | --- | --- | --- |
| `layout` | string | ✅ | — | 固定为 `post`，对应 `_layouts/post.html` |
| `title` | string | ✅ | — | 标题，**不要加引号**；如需冒号请用全角或转义 |
| `date` | datetime | ✅ | — | 推荐 `YYYY-MM-DD HH:MM:SS +0800` |
| `excerpt` | string |  | 自动取首段 | 摘要，建议 80–160 字 |
| `categories` | string / array | ✅ | — | 多分类用空格分隔；也可写成 YAML 数组 |
| `tags` | array |  | — | 关键词，用于 SEO；不影响 URL |
| `permalink` | string |  | — | 自定义 URL，未设置则按默认规则生成 |
| `image` | string |  | — | 文章封面，可被 SEO 插件读取 |
| `published` | bool |  | `true` | 设为 `false` 可暂时隐藏 |

## categories 的两种写法

**A. 空格分隔（推荐，与现有文章一致）：**

```yaml
categories: ai llm test
```

**B. YAML 数组：**

```yaml
categories:
  - ai
  - llm
  - test
```

两种写法生成的 URL 一致。`generate-category-json.sh` 都能识别。

## 常见错误

| 现象 | 原因 | 处理 |
| --- | --- | --- |
| 文章不显示 | Frontmatter 缺失或 `published: false` | 补全字段或移除 published |
| 标题成 `"标题"` 带引号 | YAML 把字符串原样输出 | 移除引号 |
| 日期错位 | 北京时间 0–8 点会被换算到前一天 | 用 ≥ 08:00 或运行 `generate-category-json.sh` |
| URL 包含未编码中文 | 分类用了中文 | 没问题，浏览器会自动 URL-encode；如不希望，请用英文 |
| `excerpt` 出现 HTML 标签 | 自动从正文截取了 Markdown 转 HTML 后的内容 | 显式写 `excerpt` 字段或用 `<!-- more -->` 分隔 |

## SEO 增强（可选）

模板已经接入 `jekyll-seo-tag` 与 `jekyll-feed`。如果想为某篇文章定制 OG/Twitter 卡片，可以追加：

```yaml
image: /images/2026031501.png
description: 自定义描述，会覆盖 excerpt 用于 meta description。
```
