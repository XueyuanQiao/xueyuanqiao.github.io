# 雪源的博客

一个基于Jekyll的个人技术博客，使用深蓝色科技感主题。

## 功能特性

- 科技感深蓝色调主题
- 响应式设计，适配不同屏幕尺寸
- 分类系统，支持按标签浏览文章
- 平滑的动画效果和过渡
- 卡片式布局设计

## 目录结构

- `_posts/` - 博客文章目录
- `_layouts/` - 页面布局模板
- `css/` - 样式文件
- `category/` - 分类页面和数据
- `images/` - 图片资源

## 分类系统

### 工作原理

本博客使用通用分类页面 `category/index.html` 来处理所有分类请求：

1. 点击首页的分类标签，会跳转到 `category/?tag=标签名`
2. 通用分类页面会根据URL参数中的 `tag` 值显示对应的文章列表
3. 文章数据存储在 `category/category.json` 文件中

### 自动更新分类数据

当添加新文章或修改现有文章时，需要更新 `category.json` 文件：

1. 运行生成脚本：
   ```bash
   ./generate-category-json.sh
   ```

2. 脚本会自动：
   - 遍历 `_posts` 目录下的所有文章
   - 提取文章的标题、摘要、分类和日期信息
   - 生成 `category.json` 文件

### 添加新文章

1. 在 `_posts` 目录下创建新文件，命名格式为：
   ```
   YYYY-MM-DD-文章标题.markdown
   ```

2. 添加YAML前置元数据：
   ```yaml
   ---
   layout: post
   title: 文章标题
   date: 2026-02-22 03:22:04 +0800
   excerpt: 文章摘要
   categories: 分类1 分类2
   ---
   ```

3. 编写文章内容（使用Markdown格式）

4. 运行生成脚本更新分类数据：
   ```bash
   ./generate-category-json.sh
   ```

## 本地预览

1. 安装依赖：
   ```bash
   bundle install
   ```

2. 启动本地服务器：
   ```bash
   bundle exec jekyll serve
   ```

3. 访问预览：
   ```
   http://localhost:4000
   ```

## 部署

将代码推送到GitHub仓库，GitHub Pages会自动部署网站。

## 技术栈

- Jekyll - 静态网站生成器
- Markdown - 文章写作格式
- CSS3 - 样式和动画
- JavaScript - 分类页面交互

## 维护说明

- 定期运行 `./generate-category-json.sh` 脚本更新分类数据
- 保持文章文件的命名格式和YAML前置元数据的一致性
- 新添加分类时，不需要创建新页面，脚本会自动处理
