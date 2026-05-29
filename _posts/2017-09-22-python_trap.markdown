---
layout: post
title: Python 编程陷阱：可变默认值、共享引用与那些一年坑你两次的细节
type: post
date: 2017-09-22 17:05:13 +0800
excerpt: 从经典的"可变默认参数"到引用传递的真相，再到原文里隐藏的 if not var2 反 bug，把 Python 数据模型的几个反直觉点重新讲一遍。
categories: python
---

> 本文 2017 年首发，2026 年校订。原文 `print` 用了 Python 2 的语法，`if not var2:` 这个修复方案本身就是 bug——这次一并改正，并补上几个工程里更常见的现代陷阱（dataclass、闭包延迟绑定、字典视图等）。

Python 的语法看起来很温和，但**它的数据模型不温和**。下面三类陷阱，无论入行几年都会反复栽——因为它们的根源不是 API，而是 Python 对象与作用域的底层语义。

## 陷阱一：可变对象作为函数默认参数

直觉写法：

{% highlight python %}
def search_for_links(page, add_to=[]):
    new_links = page.search_for_links()
    add_to.extend(new_links)
    return add_to
{% endhighlight %}

看起来人畜无害——调用时传 `add_to`，就用传的；不传，就给个空列表。但实际跑起来：

{% highlight python %}
def fn(var1, var2=[]):
    var2.append(var1)
    print(var2)

fn(3)
fn(4)
fn(5)
{% endhighlight %}

输出是：

```text
[3]
[3, 4]
[3, 4, 5]
```

而不是预期的 `[3]` `[4]` `[5]`。

**根因**：函数的默认参数对象**只在函数定义时被创建一次**，之后所有"没传该参数"的调用都共享同一个对象。这不是 bug，是 Python 数据模型的明确语义——`def` 是一个执行语句，默认值表达式在 def 执行那一刻就被求值并绑定到函数对象上。

### 修复方案：用 None 哨兵 + is 判断

原文给的修复是这样：

{% highlight python %}
def fn(var1, var2=None):
    if not var2:
        var2 = []
    var2.append(var1)
{% endhighlight %}

> **校订**：这个修复本身就是个新 bug。`if not var2:` 在 `var2` 是空列表 `[]`、空字符串 `""`、`0`、`False` 时都成立——也就是说，**你显式传了一个空列表进来，会被静默替换成另一个空列表**。

正确写法应该用 `is None` 显式判断：

{% highlight python %}
def fn(var1, var2=None):
    if var2 is None:
        var2 = []
    var2.append(var1)
    print(var2)
{% endhighlight %}

`is None` 检查的是身份（identity），不会被任何"看起来像空"的合法值误伤。**任何用 None 做哨兵的地方都应该用 `is None`，这条几乎没有例外**。

### 现代写法：dataclass 的 field(default_factory=...)

如果是类的字段，Python 3.7+ 推荐用 `dataclasses.field`：

{% highlight python %}
from dataclasses import dataclass, field

@dataclass
class URLCatcher:
    urls: list[str] = field(default_factory=list)
{% endhighlight %}

`default_factory=list` 表示"每次实例化时调用 `list()` 生成新对象"，而不是共享同一个。

> 顺带一提：**不可变类型作为默认值是安全的**，因为不可变对象天然没有"被共同修改"的可能：

{% highlight python %}
def func(message="my message"):
    print(message)
{% endhighlight %}

字符串、元组、整型、`frozenset`、`None`——这些都可以放心做默认值。

## 陷阱二：可变对象作为类变量

很多人用类变量初始化"实例数据"：

{% highlight python %}
class URLCatcher:
    urls = []  # 危险！这是类变量，不是实例变量

    def add_url(self, url):
        self.urls.append(url)
{% endhighlight %}

行为：

{% highlight python %}
a = URLCatcher()
a.add_url('http://www.google.com')
b = URLCatcher()
b.add_url('http://www.bbc.co.uk')

print(a.urls)  # ['http://www.google.com', 'http://www.bbc.co.uk']
print(b.urls)  # ['http://www.google.com', 'http://www.bbc.co.uk']
{% endhighlight %}

a 和 b 的 urls 居然一样。

**根因**：`urls = []` 写在类体里，是**类属性**，类的所有实例共享。`self.urls.append(url)` 修改的是这个共享对象，不是实例自己的属性。

注意一个微妙之处——`self.urls.append(...)` 有效，但 `self.urls = [...]` **才是真正的实例属性赋值**：

{% highlight python %}
a = URLCatcher()
a.urls = ['private']  # 现在 a.urls 是 a 自己的实例属性
print(URLCatcher.urls)  # 还是 []
print(b.urls)  # 还是上面的共享列表
{% endhighlight %}

这种"读时退化到类、写时晋升到实例"的语义，是 Python 数据模型最容易让人犯迷糊的地方之一。

### 修复：在 `__init__` 里初始化实例属性

{% highlight python %}
class URLCatcher:
    def __init__(self):
        self.urls = []

    def add_url(self, url):
        self.urls.append(url)
{% endhighlight %}

或者，再次推荐 dataclass 写法：

{% highlight python %}
from dataclasses import dataclass, field

@dataclass
class URLCatcher:
    urls: list[str] = field(default_factory=list)

    def add_url(self, url: str) -> None:
        self.urls.append(url)
{% endhighlight %}

## 陷阱三：赋值不是复制

{% highlight python %}
a = {'1': 'one', '2': 'two'}
b = a
b['3'] = 'three'

print(a)  # {'1': 'one', '2': 'two', '3': 'three'}
print(b)  # {'1': 'one', '2': 'two', '3': 'three'}
{% endhighlight %}

**根因**：Python 里 `b = a` 不是"把 a 的内容复制给 b"，而是"让 b 这个名字也指向 a 指向的同一个对象"。两个名字、一个对象——任何一方修改，对方立刻看到。

不可变类型不会让你踩这个坑——`d = (4, 5)` 之后 d 重新指向了一个新元组，c 还指向原来的 (2, 3)，因为元组本身不可变，"修改"只能通过重新绑定来实现。

### 浅拷贝 vs 深拷贝

修复方法看起来简单：

{% highlight python %}
b = a.copy()      # 字典浅拷贝
b = a[:]          # 列表浅拷贝（也可以用 list(a)）
b = list(a)       # 列表浅拷贝（更显式）
b = dict(a)       # 字典浅拷贝（更显式）
{% endhighlight %}

**但浅拷贝只复制顶层结构**。如果元素本身是可变对象，新容器和旧容器仍然共享元素：

{% highlight python %}
a = [[1, 2], [3, 4]]
b = a[:]
b[0].append(99)
print(a)  # [[1, 2, 99], [3, 4]]  ← a 也被改了！
{% endhighlight %}

要彻底独立的副本，用 `copy.deepcopy`：

{% highlight python %}
import copy
b = copy.deepcopy(a)
b[0].append(99)
print(a)  # [[1, 2], [3, 4]]  ← a 干净
{% endhighlight %}

但 `deepcopy` 不便宜——它要递归遍历整个对象图。**生产代码里 99% 的情况下你应该重新设计数据流，让"共享 vs 独占"在架构层就明确，而不是依赖 deepcopy 兜底**。

### 一个 2026 年最常见的现代变体

字典视图（dict views）也会让人栽跟头：

{% highlight python %}
d = {'a': 1, 'b': 2}
keys = d.keys()
d['c'] = 3
print(list(keys))  # ['a', 'b', 'c']  ← keys 是动态视图，不是快照！
{% endhighlight %}

如果想要快照，必须显式 `list(d.keys())`。同理 `.values()` 和 `.items()`。

## 几个原文没提到、但工程里更高频的陷阱

### 陷阱四：闭包延迟绑定

{% highlight python %}
funcs = [lambda: i for i in range(3)]
for f in funcs:
    print(f())
{% endhighlight %}

直觉输出 `0 1 2`，**实际输出 `2 2 2`**。

原因：lambda 里的 `i` 是个**自由变量**，它在 lambda 被调用时去查当前作用域里 `i` 的值，而不是 lambda 被定义时。等三个 lambda 都被定义完，`i` 已经是 2 了。

修复：用默认参数把 `i` 当时的值"冻"在函数签名里：

{% highlight python %}
funcs = [lambda i=i: i for i in range(3)]
for f in funcs:
    print(f())  # 0 1 2
{% endhighlight %}

或者用 `functools.partial`。

### 陷阱五：迭代时修改容器

{% highlight python %}
d = {'a': 1, 'b': 2, 'c': 3}
for k in d:
    if d[k] < 3:
        del d[k]
# RuntimeError: dictionary changed size during iteration
{% endhighlight %}

修复：迭代副本，或者构造新字典：

{% highlight python %}
d = {k: v for k, v in d.items() if v >= 3}
{% endhighlight %}

### 陷阱六：`is` vs `==`

{% highlight python %}
a = 256
b = 256
print(a is b)  # True

a = 257
b = 257
print(a is b)  # False（CPython 实现细节，不要依赖）
{% endhighlight %}

CPython 缓存了 [-5, 256] 范围的小整数，用 `is` 比较看起来"刚好"成立。**不要依赖这个**。比较值用 `==`，比较身份才用 `is`（最常见场景就是 `is None` / `is True` / `is False`）。

## 一句话总结

Python 的所有"可变陷阱"，都是同一件事的不同投影——**赋值是绑定，不是复制；可变对象的修改是原地的，会被所有持有它的名字看到**。

接受了这一条，再回头看默认参数、类属性、字典视图、闭包变量——所有的反直觉行为都立刻变得可预测。这才是写 Python 多年之后最值得反复打磨的"基本功"。
