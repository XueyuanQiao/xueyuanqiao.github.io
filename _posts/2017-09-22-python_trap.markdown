---
layout: post
title: Python 可变对象的几个常见陷阱
type: post
date: 2017-09-22 17:05:13 +0800
excerpt: 用对象绑定这条主线解释可变默认参数、类属性共享、浅拷贝、闭包延迟绑定和 is/== 的区别，并给出适用于现代 Python 的写法。
categories: python
---

> 本文最初写于 2017 年，2026 年按现代 Python 语法校订。很多所谓“Python 陷阱”并不是特殊规则，它们大多可以归结为一句话：名字绑定到对象，赋值本身不会复制对象。

## 可变默认参数只创建一次

下面的默认列表在函数定义执行时创建，而不是每次调用时创建：

{% highlight python %}
def collect(value, items=[]):
    items.append(value)
    return items

print(collect(1))  # [1]
print(collect(2))  # [1, 2]
{% endhighlight %}

如果希望每次调用都得到新列表，使用 `None` 作为哨兵：

{% highlight python %}
def collect(value, items=None):
    if items is None:
        items = []
    items.append(value)
    return items
{% endhighlight %}

这里必须写 `is None`，不能写 `if not items`。后者会把调用者显式传入的空列表、空字符串或 0 一并当成“没有传值”。

可变默认参数并非绝对禁止。缓存、状态累积等少数场景可能会有意利用它，但这种意图应在函数名、文档和测试里说明，否则维护者很难判断共享状态是不是缺陷。

## dataclass 字段使用 default_factory

类字段也有相同问题。现代 Python 的 `dataclass` 会阻止一部分明显的可变默认值，并提供 `default_factory`：

{% highlight python %}
from dataclasses import dataclass, field

@dataclass
class UrlBucket:
    urls: list[str] = field(default_factory=list)
{% endhighlight %}

工厂函数会在每次实例化时调用，因此不同实例不会共享列表。

需要注意，“不可变容器”不一定意味着内部完全不可变。比如元组可以包含列表。判断默认值是否安全，要看调用者是否能通过它修改可达对象，而不只是看最外层类型。

## 类属性与实例属性不是一回事

{% highlight python %}
class UrlBucket:
    urls = []

    def add(self, url: str) -> None:
        self.urls.append(url)
{% endhighlight %}

`urls` 定义在类体中，是所有实例共享的类属性。`self.urls.append(...)` 修改的仍是同一个列表。

实例状态应该在初始化时创建：

{% highlight python %}
class UrlBucket:
    def __init__(self) -> None:
        self.urls: list[str] = []
{% endhighlight %}

类属性适合常量、配置元数据或明确需要共享的状态。即便确实要共享可变状态，也要考虑锁、生命周期和测试隔离。

## 赋值不是复制

{% highlight python %}
original = {"tags": ["python"]}
alias = original
alias["tags"].append("testing")

print(original)  # {'tags': ['python', 'testing']}
{% endhighlight %}

`alias = original` 只是让两个名字指向同一个字典。

浅拷贝会创建新的外层容器，但仍共享内部对象：

{% highlight python %}
copied = original.copy()
copied["tags"].append("database")

print(original["tags"])  # 内部列表仍被修改
{% endhighlight %}

如果确实需要递归复制，可以使用 `copy.deepcopy`，但它不是免费的，也未必适合文件句柄、连接、锁或自定义资源对象。更稳妥的做法通常是明确数据所有权，或使用不可变数据结构和“创建新值”的更新方式。

## 字典视图不是快照

`dict.keys()`、`dict.values()` 和 `dict.items()` 返回动态视图：

{% highlight python %}
data = {"a": 1}
keys = data.keys()
data["b"] = 2

print(list(keys))  # ['a', 'b']
{% endhighlight %}

需要快照时要显式转换，例如 `list(data)` 或 `tuple(data.items())`。

遍历字典时直接增删键会触发 `RuntimeError`。可以遍历键的副本，或者更直接地构造新字典：

{% highlight python %}
filtered = {key: value for key, value in data.items() if value >= 2}
{% endhighlight %}

## 闭包读取的是调用时的变量

{% highlight python %}
funcs = [lambda: index for index in range(3)]
print([func() for func in funcs])  # [2, 2, 2]
{% endhighlight %}

闭包捕获的是变量，不是定义瞬间的值。循环结束后，三个函数读取到的都是最终的 `index`。

可以通过默认参数绑定当时的值：

{% highlight python %}
funcs = [lambda index=index: index for index in range(3)]
{% endhighlight %}

复杂回调更适合用普通函数或 `functools.partial`，可读性通常比 lambda 技巧更好。

## `is` 比较身份，`==` 比较值

{% highlight python %}
left = []
right = []

print(left == right)  # True：内容相等
print(left is right)  # False：不是同一个对象
{% endhighlight %}

`is` 最常见的用途是判断 `None` 或自定义哨兵：

{% highlight python %}
MISSING = object()

def read(value=MISSING):
    if value is MISSING:
        ...
{% endhighlight %}

不要用整数、字符串驻留或编译器常量折叠现象来推断身份关系；这些属于实现细节。同样，普通真假判断通常写 `if enabled` 或 `if not enabled`，不必机械地写 `is True`、`is False`。

## 最后归纳

遇到共享状态问题时，可以依次问四个问题：

1. 这个对象在什么时候创建？
2. 现在有多少名字或实例指向它？
3. 当前操作是在重新绑定名字，还是原地修改对象？
4. 调用者需要共享、浅拷贝，还是完全独立的数据？

把这四件事说清楚，可变默认值、类属性、浅拷贝和闭包等行为就不再神秘。

## 参考资料

- [Python 教程：默认参数值](https://docs.python.org/3/tutorial/controlflow.html#default-argument-values)
- [Python 文档：`dataclasses.field`](https://docs.python.org/3/library/dataclasses.html#dataclasses.field)
- [Python 文档：浅拷贝与深拷贝](https://docs.python.org/3/library/copy.html)
- [Python 数据模型](https://docs.python.org/3/reference/datamodel.html)
