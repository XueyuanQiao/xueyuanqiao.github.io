# Aurora 主题 Markdown 速查

本主题在标准 kramdown / GFM 的基础上为常见标记元素做了视觉增强。掌握下面这些写法就能写出排版精致的文章。

## 标题层级

```markdown
## 章节（H2）— 带渐变小方块徽标 + 分割线
### 小节（H3）— 渐变左立柱
#### 段落标题（H4）— 带 mono 风 # 前缀
```

> H2 自动作为目录顶层条目；H3/H4 缩进进入二/三级。≥ 2 个标题时，文章顶部会自动出现「目录」组件。

## 段落与强调

| 写法 | 效果 |
| --- | --- |
| `**关键词**` | 自带柔和品牌色高亮（像马克笔划过） |
| `*斜体*` | 强调，颜色微亮 |
| `` `inline code` `` | 渐变胶囊 + mono 字体 |
| `~~删除线~~` | 删除线 |

正文首段会自动启用首字下沉（drop cap），所以**不要**把首段写得太短或全是图标/Emoji。

## 链接

```markdown
[文字](https://example.com)
[外链]: https://example.com "title"
```

链接会有底部品牌渐变下划线，hover 时加粗 + 微荧光。

## 引用块

```markdown
> 单行引用就是一句话。
>
> 多行引用会保持段落间距，最后一行可以加 `<cite>` 表示出处。
> <cite>— 作者 / 来源</cite>
```

## 列表

无序列表：

```markdown
- 一项
- 另一项
  - 子项（▸ 三角项目符）
```

有序列表（自动渲染为渐变圆形序号徽章）：

```markdown
1. 第一步
2. 第二步
3. 第三步
```

任务列表：

```markdown
- [x] 已完成
- [ ] 待办
```

## 代码块

**A. GitHub 风围栏**：

````markdown
```python
def fact(n):
    return 1 if n <= 1 else n * fact(n - 1)
```
````

**B. Jekyll Liquid 风（与历史文章一致）**：

```markdown
{% raw %}{% highlight python %}
def fact(n):
    return 1 if n <= 1 else n * fact(n - 1)
{% endhighlight %}{% endraw %}
```

两种写法都会自动获得：

- macOS 风窗口装饰条（红黄绿三圆点）
- 右上角「复制」按钮
- 右上角语言标签
- Aurora Night 配色

## 键盘按键

行内键帽：

```markdown
按 <kbd>Cmd</kbd> + <kbd>K</kbd> 唤起命令面板。
```

## 表格

```markdown
| 列 1 | 列 2 | 列 3 |
| --- | --- | --- |
| a | b | c |
| 1 | 2 | 3 |
```

主题会：

- 包一层横向滚动容器，移动端不撕版
- 表头粘性（sticky）
- 奇偶行斑马纹 + 行 hover 高亮

## 图片

```markdown
![alt 文本](/images/xxx.png)
```

- 自动加圆角和投影
- 点击进入 lightbox 全屏预览，按 <kbd>Esc</kbd> 关闭
- 推荐宽度 ≤ 1600px，过大请压缩
- 图片放置在 `images/`，**用绝对路径** `/images/...`，子路径与 GitHub Pages 都兼容

如需图注：

```markdown
<figure>
  <img src="/images/xxx.png" alt="架构图">
  <figcaption>图 1: 系统架构</figcaption>
</figure>
```

## 分隔线

```markdown
---
```

会渲染成点状渐隐分割线，比 Word 里那条横线优雅得多。

## 摘要分隔

如果不在 Frontmatter 写 `excerpt`，可以在正文中插入：

```markdown
首段或一两句话作为摘要。

<!-- more -->

剩余正文……
```

## 数学公式（可选）

主题没有内置 KaTeX/MathJax。如需公式，请在文章末尾追加：

```html
<script src="https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js"></script>
```

并使用 `$$...$$` 或 `\(...\)` 语法。

## 反例 · 不推荐写法

| ❌ | ✅ |
| --- | --- |
| 使用 `~~` 满屏吐槽 | 真正需要时才用 |
| 段落里夹大量空行模拟分节 | 用 `## / ###` 标题 |
| `<br>` 控制行距 | 直接换段或用列表 |
| 拷贝带样式的内容（如 Word/Notion） | 转纯文本后再写 Markdown |
| 把整篇文章塞进一个引用块 | 引用应只用于真正引用的文字 |
