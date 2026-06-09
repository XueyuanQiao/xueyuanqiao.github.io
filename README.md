# 雪源的博客 · Aurora

> Building AI-native quality at scale.

基于 Jekyll 的个人技术博客，自研 **Aurora** 主题：玻璃拟态 + 极光渐变 + 微交互，零运行时依赖，原生 ES。

- 在线访问：<https://xueyuanqiao.github.io>
- 主题风格：暗 / 亮双主题，跟随系统并支持手动切换
- 设备支持：桌面、平板、手机（含刘海屏 / 安全区）

## 目录

- [功能特性](#功能特性)
- [目录结构](#目录结构)
- [本地预览](#本地预览)
- [写一篇新文章](#写一篇新文章)
- [分类系统](#分类系统)
- [移动端适配](#移动端适配)
- [主题与可定制项](#主题与可定制项)
- [部署](#部署)
- [依赖与安全](#依赖与安全)
- [技术栈](#技术栈)
- [维护清单](#维护清单)

## 功能特性

- **Aurora 自研主题**：极光渐变背景、玻璃拟态卡片、神经网络动效（Landing 页）
- **响应式布局**：单栏 / 双栏自动切换，桌面 ≥ 921px、平板 / 手机 ≤ 920px、极窄 ≤ 520px 三档断点
- **主题切换**：暗色为默认，跟随 `prefers-color-scheme`，支持点击切换并记忆到 `localStorage`
- **阅读体验**：阅读进度条、文章 TOC（移动端默认折叠）、回到顶部、图片 lightbox、代码一键复制 + 语言标签
- **首页着陆区**：动态打字效果、统计计数器、3D Tilt 卡片、霓虹滚动 marquee
- **SEO 友好**：`jekyll-seo-tag`、`jekyll-sitemap`、`jekyll-feed` 内置
- **触屏优化**：自动禁用 hover 残留态、3D Tilt、神经网络背景，节省电量与 GPU
- **无障碍**：尊重 `prefers-reduced-motion`、键盘可达、菜单 Esc 关闭

## 目录结构

```
.
├── _config.yml              站点配置
├── _layouts/                布局模板
│   ├── default.html         全站基础骨架（侧栏 / 主内容）
│   ├── landing.html         首页着陆页
│   ├── page.html            通用页（about / doc / cate）
│   └── post.html            文章详情页（含 TOC）
├── _posts/                  Markdown 文章源
├── assets/
│   ├── css/aurora.css       主题样式（含移动端适配）
│   ├── css/code.css         代码块样式
│   └── js/site.js           主题交互逻辑（零依赖）
├── category/
│   ├── index.html           动态分类页（按 ?tag= 过滤）
│   └── category.json        文章索引数据（脚本生成）
├── css/highlight/           highlight.js 代码高亮主题
├── images/                  图片资源
├── doc/                     工程文档（不参与构建）
├── 404.html                 自定义 404 页
├── about.markdown           关于
├── cate.html                按主题归档
├── doc.markdown             链接收藏
├── home.html                文章存档
├── index.html               首页（landing）
├── generate-category-json.sh  分类索引生成脚本
└── Gemfile                  Ruby 依赖
```

## 本地预览

```bash
# 安装依赖（首次）
bundle install

# 启动本地服务，监听文件变化
bundle exec jekyll serve

# 打开浏览器
open http://localhost:4000
```

调试移动端体验：

- 使用 Chrome / Safari DevTools 的 Device Emulation
- 真机访问可在终端用 `bundle exec jekyll serve --host 0.0.0.0`，然后通过局域网 IP 访问

## 写一篇新文章

1. 在 `_posts/` 下新建文件，命名为 `YYYY-MM-DD-slug.markdown`
2. 添加 YAML Frontmatter（**不要加引号**）：

   ```yaml
   ---
   layout: post
   title: 文章标题
   date: 2026-02-22 16:00:00 +0800
   excerpt: 一句话摘要，会出现在列表与 SEO 中
   categories: AI Testing 工程化
   ---
   ```

3. 写正文（kramdown / GFM 语法），代码块会自动应用语言标签 + 复制按钮
4. 更新分类索引：

   ```bash
   bash generate-category-json.sh
   ```

更详细的写法、字段与最佳实践见 [`doc/`](./doc/) 目录。

## 热门文章（首页置顶）

首页「热门文章 · Popular」区块用于把重要文章**永久置顶**到首页，不会因为发布时间久而被新文章挤到后面。

- 在文章 Frontmatter 中加入 `featured: true` 即可标记为热门：

  ```yaml
  ---
  layout: post
  title: MySQL索引原理及慢查询优化
  date: 2017-10-03 14:10:13 +0800
  excerpt: 一句话摘要
  categories: database
  featured: true        # 标记为热门，永久透出在首页
  featured_rank: 1      # 可选，数字越小越靠前；不设则按默认顺序
  ---
  ```

- 热门文章会单独成区，带「热门」角标，始终显示。
- 被标记为热门的文章会自动从下方「近期文章」中剔除，避免重复展示。
- 取消热门：删除 `featured` 字段或设为 `false` 即可。
- 无需运行任何脚本，保存重新构建即可生效。

## 分类系统

### 工作原理

- 任何位置点击分类标签（如 `AI`），都会跳转到 `/category/?tag=AI`
- `category/index.html` 读取 `category/category.json`，按 `tag` 过滤后渲染列表
- 列表为前端动态渲染，不需要为每个分类生成静态页

### 更新索引

```bash
bash generate-category-json.sh
```

脚本会：

- 遍历 `_posts/`，跳过命名不规范的文件
- 解析 YAML frontmatter（标题、摘要、分类、日期）
- 将分类统一小写、清理多余空格
- 处理北京时间 → UTC 的时区差异（与 GitHub Pages 行为对齐）
- 生成格式化、UTF-8 友好的 `category/category.json`

### 时区注意

GitHub Pages 在 UTC 时区下生成 URL。例如 `2026-02-21 03:22:04 +0800`（北京凌晨）会被转成 UTC `2026-02-20 19:22:04`，URL 用的是 20 日。

- 脚本已自动处理这种凌晨时间偏移，与 GitHub Pages 输出一致
- 简化办法：发文时间统一用 **北京时间 08:00 以后**，可避免日期偏移

## 移动端适配

桌面端（≥ 921px）视觉与交互完全保持原样；移动端做了系统性的优化：

- **断点**：`920px` 单栏切换 + 抽屉侧栏，`520px` 极窄屏进一步收敛
- **iOS 安全区**：菜单按钮、悬浮按钮、主内容、侧栏均使用 `env(safe-area-inset-*)` 避让刘海与 Home Indicator
- **抽屉菜单**：宽度 `min(280px, 86vw)`，打开时锁定 body 滚动，支持 Esc / 点遮罩关闭
- **触控优化**：复制按钮、菜单按钮、悬浮按钮均 ≥ 44px，符合 HIG 触控标准
- **正文可读性**：关闭中文 `inter-character` 两端对齐避免字间空隙；行内代码取消 `nowrap` 避免横溢；首字下沉缩到 2.4em
- **代码块**：内边距与字号收敛、横向滚动启用 `-webkit-overflow-scrolling: touch`
- **TOC**：移动端默认折叠，节省纵向空间
- **触屏专属**（`hover: none and pointer: coarse`）：
  - 关闭所有 hover 位移与阴影抖动（解决 tap 后视觉残留）
  - 隐藏标题锚点 `#`（hover 永久态会一直可见）
  - 禁用神经网络 canvas 背景（中低端机非常耗电）
  - 关闭 3D Tilt 卡片（避免 tap 后永久倾斜）
- **极窄屏**：列表摘要限制 3 行，上下篇导航 ellipsis，页脚导航单列

实现位置：

- 样式：`assets/css/aurora.css` 末尾的 `Mobile adaptation` 章节
- 交互：`assets/js/site.js` 中 `isTouchDevice` / `isNarrowScreen` 检测分支

## 主题与可定制项

### 配色

`assets/css/aurora.css` 顶部 `:root` 与 `[data-theme="light"]` 暴露的 CSS 变量：

| 变量 | 含义 |
| --- | --- |
| `--bg-0` ~ `--bg-3` | 背景层级 |
| `--text-1` ~ `--text-mute` | 文字层级 |
| `--brand` / `--brand-2` / `--brand-3` | 主品牌色 / 渐变副色 |
| `--surface` / `--surface-strong` | 玻璃面板背景 |
| `--radius-sm` ~ `--radius-xl` | 圆角档位 |
| `--shadow-1` / `--shadow-2` | 阴影预设 |

### 站点信息

`_config.yml`：

```yaml
title: Xueyuan's Tech Blog
email: 1336582921@qq.com
description: Xueyuan's Blog · 分享编程技术与思考
url: https://xueyuanqiao.github.io
github_username: XueyuanQiao
```

### Landing 文案

首页 `index.html` 的 typed 动画来自 `data-typed-strings` 属性，可直接编辑：

```html
<span data-typed
      data-typed-strings='["十年质量治理实践","AI Agent · LLM-as-a-Judge"]'>
</span>
```

## 部署

推送到 `main` 分支后，GitHub Pages 自动构建并发布，无需手动操作。

```bash
git add .
git commit -m "feat: ..."
git push origin main
```

自定义域名通过仓库根目录的 `CNAME` 文件配置。

## 依赖与安全

- **GitHub Pages 运行时**：使用 GitHub 自己内置的 Jekyll，不读仓库里的 `Gemfile.lock`
- **本地开发**：`Gemfile.lock` 不入版本库（已加入 `.gitignore`），首次 `bundle install` 会拉到最新补丁版本
- **CVE 兜底**：`Gemfile` 里对 `rexml` / `addressable` / `public_suffix` 做了最小版本约束，避免被解析到有公开漏洞的版本
- **Dependabot**：`.github/dependabot.yml` 每月扫一次 bundler 与 GitHub Actions 依赖，自动开 PR

升级流程：

```bash
bundle install            # 首次或 Gemfile 改动后
bundle update             # 安全更新（按月或收到 Dependabot PR 时）
bundle exec jekyll serve  # 本地走查
```

## 技术栈

- **Jekyll** — 静态站点生成器（GitHub Pages 原生支持）
- **kramdown** — Markdown 引擎，支持 GFM、脚注、任务列表
- **highlight.js** — 代码高亮（已内置 80+ 主题供选择）
- **CSS3** — 自定义属性、`color-mix`、`backdrop-filter`、`mask-image`
- **原生 ES** — 零依赖，无打包，IntersectionObserver / matchMedia 等现代 API

## 维护清单

- [ ] 新增 / 修改文章后运行 `bash generate-category-json.sh` 更新索引
- [ ] 文件命名严格遵循 `YYYY-MM-DD-slug.markdown`
- [ ] Frontmatter 不使用引号，`categories` 用空格分隔
- [ ] 发文时间避开北京凌晨 0:00–8:00（或确认时区偏移效果）
- [ ] 重大改动前用 DevTools 切到 iPhone / Pixel 验证移动端
- [ ] 升级依赖：`bundle update` 后本地 `bundle exec jekyll serve` 走查一遍

更细的工程问题排查见 [`doc/troubleshooting.md`](./doc/troubleshooting.md)。
