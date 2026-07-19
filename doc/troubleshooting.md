# 故障排查

写完文章一切都正常的话，本文档可以不用看。下面是高频问题及定位方式。

## 文章不显示

| 现象 | 排查 |
| --- | --- |
| 列表页/归档页看不到 | 文件名是否符合 `YYYY-MM-DD-slug.markdown` 格式 |
| | Frontmatter 是否完整（开头结尾两组 `---`） |
| | `published` 是否被设为 `false` |
| | `date` 是否设在了未来时间（Jekyll 默认不发布未来文章） |
| GitHub Pages 上看不到，但本地正常 | Actions 是否构建成功（仓库 → Actions） |
| | 是否仍在分支上、未合并到 `main` |

## 分类页找不到新文章

```bash
bash generate-category-json.sh
git status     # 应该看到 category/category.json 变更
```

确认 `category/category.json` 已被一起提交。如果忘了，分类页不会更新。

## URL 日期错位

文章 URL 显示的是前一天，原因是 `date` 落在北京时间 0:00–7:59：

```
date: 2026-03-15 03:22:04 +0800
```

GitHub Pages 转 UTC 后变成 `2026-03-14 19:22:04`，于是路径里的日期是 `14`。

**修复方式（任选其一）**：

- 把 `date` 改为 `08:00:00 +0800` 之后
- 维持原状，`generate-category-json.sh` 会做对齐降日，让 `category.json` 与 Pages 一致

## 标题里包含冒号或 `#`

YAML 会把这些当成结构符号。两种解法：

```yaml
title: "MySQL：索引原理"   # 用引号
title: MySQL — 索引原理     # 用全角冒号或破折号
```

## 代码块没有高亮

- 围栏写法 `` ```python `` 三个反引号紧贴语言名，不要有空格
- Jekyll Liquid 风 `{% highlight python %}` 必须配对 `{% endhighlight %}`
- 代码高亮由 Jekyll/Rouge 在构建期生成；浏览器端不再加载 `highlight.js`

## 图片不显示

- 路径必须以 `/images/` 开头（绝对），不要写成 `images/...`
- 文件大小写敏感，`.JPG` 与 `.jpg` 在 Linux/GitHub Pages 上是不同的文件
- 用 `<img>` 标签时记得带 `alt`，无障碍 + SEO 都需要

## 本地预览启动失败

```text
You must use Bundler 2 or greater with this lockfile.
```

本机 Bundler 版本太旧。升级方式：

```bash
gem install bundler
bundle install
bundle exec jekyll serve
```

如果系统 Ruby 是 2.6 这类老版本，建议安装 [rbenv](https://github.com/rbenv/rbenv) 或 [asdf](https://asdf-vm.com/) 切换到 Ruby 3.x。

## 主题样式没生效

按以下顺序排查：

1. 浏览器强制刷新（<kbd>Cmd</kbd>+<kbd>Shift</kbd>+<kbd>R</kbd>）以绕过缓存
2. 打开 DevTools → Network，看 `aurora.css` `code.css` `site.js` 是否 200
3. 路径是否被项目自定义的 `baseurl` 影响——本项目 `baseurl: ""`，所以 `/assets/css/aurora.css` 即可
4. GitHub Pages 部署完成需要数十秒，刚 push 不会立刻生效

## RSS / Sitemap 没更新

- `_config.yml` 的 plugins 必须包含 `jekyll-feed` 与 `jekyll-sitemap`（项目已配置）
- GitHub Pages 构建完成后，访问 `/feed.xml` 与 `/sitemap.xml` 验证
- 这两个文件是构建产物，**不要手工编辑**

## 我把哪一步搞乱了？

如果不确定改坏了什么，可以基于上次提交回滚：

```bash
git status
git diff
git restore -- 文件路径   # 撤销某文件的本地修改
```

或更激进地：

```bash
git stash       # 把所有未提交修改暂存起来
git stash pop   # 想恢复时再放回来
```

仍然解决不了的话，把 Frontmatter、报错信息、文件路径告诉我，我们一起看。
