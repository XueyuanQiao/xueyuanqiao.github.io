---
layout: post
title: 尾递归与 Python：一个永远没被优化的承诺
date: 2017-09-22 17:26:13 +0800
excerpt: 从 fact(n) 这个最经典的递归例子讲起，把尾递归、栈帧、TCO、trampoline 与 CPython 为什么坚持不做尾调用优化的设计哲学一次性讲透。
categories: python
---

> 本文 2017 年首发，2026 年校订并做了深度扩展。原文里几处 Python 2 的痕迹和 Python 3 的异常名字都做了修正，并补上了"为什么 Guido 不愿意做 TCO"这条工程哲学背后的讨论。

阶乘 `fact(n)` 是讲递归绕不开的例子。最直白的写法：

{% highlight python %}
def fact(n):
    if n == 1:
        return 1
    return n * fact(n - 1)
{% endhighlight %}

`fact(5)` 的展开过程，每一步都有未完成的乘法在等：

```text
fact(5)
→ 5 * fact(4)
→ 5 * (4 * fact(3))
→ 5 * (4 * (3 * fact(2)))
→ 5 * (4 * (3 * (2 * fact(1))))
→ 5 * (4 * (3 * (2 * 1)))
→ 120
```

递归优雅，但代价藏在调用栈里——**每一层都要在栈上保存一个未完成的乘法表达式**。栈不是无限的，所以 `fact(1000)` 直接爆栈：

```text
>>> fact(1000)
Traceback (most recent call last):
  File "<stdin>", line 1, in <module>
  File "<stdin>", line 4, in fact
  ...
RecursionError: maximum recursion depth exceeded in comparison
```

> **校订**：原文这里写的是 `RuntimeError`。Python 3.5 起这个异常被独立成 `RecursionError`（仍然继承自 `RuntimeError`，所以旧代码 `except RuntimeError` 仍能捕到，但语义上应该用 `RecursionError`）。

CPython 默认的递归上限是 1000 层（可通过 `sys.getrecursionlimit()` 查看）。你可以用 `sys.setrecursionlimit(10_000)` 调高，但这只是**把崩溃推迟**——本质问题没解决。

## 尾递归：把栈帧"偷"回来的承诺

尾递归的核心思想：**把递归调用放在函数返回的最后一步，且 return 不再包含表达式**。这样编译器/解释器理论上可以复用当前栈帧，把递归"原地"展开成循环。

把 `fact` 改成尾递归形式，要把"未完成的乘积"显式作为参数传下去：

{% highlight python %}
def fact(n):
    return fact_iter(n, 1)

def fact_iter(num, product):
    if num == 1:
        return product
    return fact_iter(num - 1, num * product)
{% endhighlight %}

`fact_iter(num - 1, num * product)` 这一行就是关键——`num - 1` 和 `num * product` 在函数调用**之前**就已经被求值，调用本身是函数返回的最后动作。理论上栈帧就该被复用。

`fact(5)` 对应的展开：

```text
fact_iter(5, 1)
→ fact_iter(4, 5)
→ fact_iter(3, 20)
→ fact_iter(2, 60)
→ fact_iter(1, 120)
→ 120
```

注意每一步都没有"未完成的运算"挂在调用栈上——这是尾递归之所以能被优化的根本原因。

## 一个被反复重提的事实：CPython 不做 TCO

但这里有个让所有从 Scheme/Scala/Haskell 过来的人都不爽的事实——**CPython 不做尾调用优化（Tail Call Optimization, TCO）**。把上面那个尾递归版本拿去跑 `fact(10000)`，照样爆栈。

**这不是技术做不到，是 Guido 主动选择不做的**。他在 [Tail Recursion Elimination (2009)](http://neopythonic.blogspot.com/2009/04/tail-recursion-elimination.html) 一文里给过明确理由，归纳起来三条：

1. **会破坏调用栈追踪**——TCO 之后，traceback 里看不到完整的调用链，调试体验严重下降
2. **Python 不是函数式语言**——在 Python 里写循环就该用 `for` / `while`，递归不是首选
3. **隐式优化让代码语义依赖编译器**——同一段代码在不同实现/版本下行为不同，违反 Python 显式优于隐式的哲学

不管你是否同意，**这是个一致性极强的设计取舍**。一旦接受 CPython 永远不会做 TCO，剩下的问题就只有一个：递归深度可能爆栈时，怎么办？

## 三种现实的解法

### 一、改成显式循环

最朴素也最 Pythonic 的做法。能改循环就改循环：

{% highlight python %}
def fact(n):
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result
{% endhighlight %}

> **栈深度 O(1)，性能远优于递归版本**。Python 里几乎所有"看起来必须递归"的算法，都能改成循环 + 显式栈/队列。这才是 Guido 想推的方向。

### 二、Trampoline：用循环模拟尾递归

如果非要保留递归形式（比如算法可读性更好、或者在写解析器/解释器），可以手写 trampoline：

{% highlight python %}
def trampoline(func):
    def wrapper(*args, **kwargs):
        result = func(*args, **kwargs)
        while callable(result):
            result = result()
        return result
    return wrapper

@trampoline
def fact_iter(num, product=1):
    if num == 1:
        return product
    return lambda: fact_iter(num - 1, num * product)

print(fact_iter(10000))  # 不再爆栈
{% endhighlight %}

原理：每次"递归"返回一个 lambda（thunk），由外层 while 循环不断 evaluate。**栈深度恒为 1**，代价是每次调用多一层闭包开销。

### 三、用 sys.setrecursionlimit + 调大栈

如果递归深度可控（比如最大就几万层），且性能敏感，可以考虑：

{% highlight python %}
import sys
import threading

sys.setrecursionlimit(100000)

# 同时把线程栈调大（默认 8MB 在 macOS/Linux 已足够，Windows 较小）
threading.stack_size(256 * 1024 * 1024)
t = threading.Thread(target=lambda: print(fact(50000)))
t.start()
t.join()
{% endhighlight %}

> **这是最不优雅的方案**——你只是把炸弹的引线变长了。生产代码里慎用。

## Python 3.14 的 PEP 657 与栈追踪改进

2024 年起 CPython 在异常信息和栈追踪上做了大量改进（PEP 657 精确错误位置、PEP 712 等）。这让"递归调试体验"比 2017 年好很多——这其实**进一步加固了 Guido 当年的论点**：保留完整调用栈的价值，比 TCO 带来的性能/优雅性更值得。

## 如果一定要尾递归优化，去哪儿找

不是 Python 圈的话，下面这些语言/实现都把 TCO 当一等公民：

| 语言 / 实现 | TCO 支持 |
| --- | --- |
| Scheme / Racket | 语言规范强制 TCO |
| Scala | `@tailrec` 注解 + 编译器优化 |
| Kotlin | `tailrec` 关键字 |
| Erlang / Elixir | 强制 TCO，整个语言哲学就建立在尾递归上 |
| Clojure | 显式 `recur` 表达式 |
| OCaml / F# | 编译器自动优化 |
| LLVM 后端 (Rust/C++) | 启发式 TCO，不强制 |
| **CPython** | **从未做、不会做** |

## 一句话总结

尾递归是个漂亮的概念，但 **Python 把它从"语言能力"降级成了"算法练习"**。在 CPython 上写递归算法，要么改循环，要么 trampoline，要么接受深度有限——把希望寄托在编译器优化上，是把问题留给一个永远不会兑现的承诺。

这件事多年后回头看，反而能体会到 Guido 的克制——一个语言决定**不做什么**，往往比决定**做什么**更能塑造它的性格。

## 延伸阅读

- [Tail Recursion Elimination — Guido van Rossum](http://neopythonic.blogspot.com/2009/04/tail-recursion-elimination.html)
- [Final Words on Tail Calls — Guido van Rossum](http://neopythonic.blogspot.com/2009/04/final-words-on-tail-calls.html)
- [PEP 657 – Include Fine-Grained Error Locations in Tracebacks](https://peps.python.org/pep-0657/)
