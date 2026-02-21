---
layout: post
title: 测试多标签文章
date: 2026-02-22 10:00:00 +0800
excerpt: 这是一篇测试多标签功能的文章
categories: test python tutorial
---

## 测试内容

这篇文章用于测试多标签功能，它同时属于 test、python 和 tutorial 三个分类。

### 测试目标

1. 验证文章是否能在多个分类页面中显示
2. 验证通过不同标签的路径是否都能正常打开文章
3. 验证脚本是否能正确处理多个标签的情况

### 测试结果

- 文章应该出现在 /category/?tag=test 页面
- 文章应该出现在 /category/?tag=python 页面
- 文章应该出现在 /category/?tag=tutorial 页面
- 所有分类页面中的文章链接应该指向同一个URL
