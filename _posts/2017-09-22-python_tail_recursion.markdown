---
layout: post
title: Python 为什么不优化尾递归
date: 2017-09-22 17:26:13 +0800
excerpt: 从调用栈、尾调用优化和 CPython 的设计取舍出发，说明为什么把递归改成尾递归仍会触发 RecursionError，以及工程中更合适的替代方案。
categories: python
---

> 本文最初写于 2017 年，2026 年按 Python 3.14 重新校订。实际项目中如果只是计算阶乘，请直接使用标准库 `math.factorial`；这里仍以阶乘为例，是为了说明递归与调用栈。

递归代码往往很贴近问题定义。下面这个阶乘函数读起来没有障碍：

{% highlight python %}
def factorial(n: int) -> int:
    if n < 0:
        raise ValueError("n must be non-negative")
    if n <= 1:
        return 1
    return n * factorial(n - 1)
{% endhighlight %}

问题也很直观：每次调用都要保留当前栈帧，等待更深一层返回后再完成乘法。递归足够深时，CPython 会抛出 `RecursionError`，避免继续增长的调用栈破坏解释器进程。

`sys.getrecursionlimit()` 可以查看当前限制。它常见的默认值约为 1000，但这是实现和运行环境参数，不应写成业务假设。

## 尾递归改变了什么

尾递归把尚未完成的计算放进参数，使递归调用成为函数返回前的最后一个动作：

{% highlight python %}
def factorial_tail(n: int, acc: int = 1) -> int:
    if n < 0:
        raise ValueError("n must be non-negative")
    if n <= 1:
        return acc
    return factorial_tail(n - 1, n * acc)
{% endhighlight %}

从数学上看，这个版本不再需要回到上一层继续乘法。支持尾调用优化（Tail Call Optimization，TCO）的语言可以复用当前栈帧，把这段递归执行得近似循环。

但“可以优化”不等于“Python 会优化”。CPython 目前不会消除尾调用，所以 `factorial_tail(10_000)` 仍会不断创建调用帧，最终触发 `RecursionError`。

## CPython 为什么保留完整调用栈

Python 设计 FAQ 对这项取舍有明确说明。核心并不是实现难度，而是语言设计：

- 完整调用栈对 traceback、调试和运行时诊断有直接价值；
- Python 已经有清晰的 `for` 和 `while`，不需要依赖递归表达普通循环；
- 如果一段程序只有在特定实现完成 TCO 时才能运行，它的可移植性会变差。

这不代表尾递归没有价值。它仍然是理解编译器优化、函数式语言和控制流转换的好例子，只是不适合作为 CPython 中规避栈深限制的手段。

## 工程中应该怎么写

### 普通迭代优先

阶乘可以直接改成循环，空间复杂度为 O(1)：

{% highlight python %}
def factorial_iter(n: int) -> int:
    if n < 0:
        raise ValueError("n must be non-negative")

    result = 1
    for value in range(2, n + 1):
        result *= value
    return result
{% endhighlight %}

树、图、目录遍历等更适合递归的问题，如果深度不受控，可以把待处理节点放进显式栈或队列。这样既保留算法结构，也能控制内存与失败方式。

### 业务代码优先用标准库

{% highlight python %}
from math import factorial

value = factorial(10_000)
{% endhighlight %}

标准库实现通常比 Python 层循环更快，也省去了输入边界和性能细节的重复处理。

### 不要把调高递归上限当成通用修复

`sys.setrecursionlimit()` 只适合调用深度已知、测试充分的特殊场景。设置过高可能导致解释器或进程崩溃；设置过低也可能让正常代码提前失败。它改变的是保护阈值，不会把递归变成常量空间。

Trampoline 可以用循环不断执行“下一步调用”对象，从而模拟尾调用，但会引入额外协议、对象分配和调试成本。除了解释器、解析器等少数场景，直接写循环通常更清楚。

## 如何选择

| 场景 | 建议 |
| --- | --- |
| 深度很小且有明确上界 | 可以保留递归，补充边界测试 |
| 深度来自用户输入或外部数据 | 使用显式栈、队列或迭代算法 |
| 阶乘、排列组合等常见运算 | 优先使用标准库 |
| 教学或语言实现研究 | 可以讨论尾递归和 trampoline |
| 依赖 TCO 才能正确运行 | 不应直接运行在 CPython 上 |

尾递归描述的是一种可被优化的控制流形态，不是 Python 的栈安全保证。对 CPython 来说，最稳妥的判断仍然是：递归深度如果可能持续增长，就把它改写成显式迭代。

## 参考资料

- [Python 文档：`sys.getrecursionlimit` 与 `sys.setrecursionlimit`](https://docs.python.org/3/library/sys.html#sys.getrecursionlimit)
- [Python 设计 FAQ：为什么不优化尾递归](https://docs.python.org/3/faq/design.html#why-does-python-not-optimize-tail-recursion)
- [Python 文档：`math.factorial`](https://docs.python.org/3/library/math.html#math.factorial)
