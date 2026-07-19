---
layout: post
title: Python 并发选型：线程、进程、asyncio 与子解释器
date: 2017-09-22 12:06:13 +0800
excerpt: 以 Python 3.14 为基线，解释默认 GIL、free-threaded 构建、线程池、进程池、asyncio 和 InterpreterPoolExecutor 的适用边界。
categories: Python
---

> 本文最初写于 2017 年，2026 年按 Python 3.14 更新。Python 的并发选型已经不再是“线程还是进程”二选一，但负载特征仍然是最重要的判断依据。

## 先区分并发和并行

- **并发**：多个任务在一段时间内都取得进展，不要求同一时刻执行。
- **并行**：多个任务在同一时刻运行，通常需要多个 CPU 核心或设备。
- **I/O 密集**：大部分时间在等待网络、磁盘、数据库或外部服务。
- **CPU 密集**：大部分时间在执行 Python 计算。

线程共享同一进程的内存，通信方便，但也带来锁、竞态和可见性问题。进程地址空间隔离更强，代价是创建、序列化和进程间通信更重。协程由事件循环调度，适合大量可异步等待的 I/O。

## 默认 CPython 的 GIL 到底限制了什么

标准 CPython 构建仍有全局解释器锁（GIL）。在同一解释器内，通常只有一个线程执行 Python 字节码。因此，纯 Python 的 CPU 密集任务很难通过增加线程获得多核加速。

这不等于“Python 线程没有用”：

- 阻塞 I/O 通常会释放 GIL；
- NumPy 等扩展可能在原生计算期间释放 GIL；
- 线程共享内存，适合并发量适中、调用方式仍是同步接口的 I/O 任务。

是否释放 GIL 取决于具体实现和扩展库，不能只看函数名推断。

## I/O 任务：先考虑线程池或 asyncio

下面是一个受控并发的端口连通性检查。只应扫描自己拥有或明确获授权的主机。

{% highlight python %}
from concurrent.futures import ThreadPoolExecutor
from socket import create_connection

def is_open(host: str, port: int, timeout: float = 0.5) -> bool:
    try:
        with create_connection((host, port), timeout=timeout):
            return True
    except OSError:
        return False

host = "127.0.0.1"
ports = range(1, 1000)

with ThreadPoolExecutor(max_workers=64) as pool:
    results = pool.map(lambda port: is_open(host, port), ports)

for port, opened in zip(ports, results):
    if opened:
        print(f"{port} open")
{% endhighlight %}

线程数不是越多越好。文件描述符、对端限流、连接池大小、DNS 和网络带宽都会先成为瓶颈。应该用压测确定并发上限，而不是复制一个固定数字。

当调用链已经使用异步库、并发连接很多，`asyncio` 往往更合适：

{% highlight python %}
import asyncio

async def is_open(host: str, port: int, limit: asyncio.Semaphore) -> bool:
    async with limit:
        try:
            _, writer = await asyncio.wait_for(
                asyncio.open_connection(host, port),
                timeout=0.5,
            )
            writer.close()
            await writer.wait_closed()
            return True
        except (OSError, TimeoutError):
            return False

async def main() -> None:
    host = "127.0.0.1"
    ports = range(1, 1000)
    limit = asyncio.Semaphore(200)
    results = await asyncio.gather(
        *(is_open(host, port, limit) for port in ports)
    )
    for port, opened in zip(ports, results):
        if opened:
            print(f"{port} open")

asyncio.run(main())
{% endhighlight %}

即使使用协程也要限制并发。事件循环减少了线程调度成本，并不会取消操作系统和对端服务的容量限制。

## CPU 任务：进程池仍是稳妥基线

对纯 Python 计算，`ProcessPoolExecutor` 能绕开默认 GIL，利用多个核心：

{% highlight python %}
from concurrent.futures import ProcessPoolExecutor

def work(limit: int) -> int:
    return sum(value * value for value in range(limit))

if __name__ == "__main__":
    inputs = [8_000_000] * 4
    with ProcessPoolExecutor() as pool:
        results = list(pool.map(work, inputs))
{% endhighlight %}

被提交的函数和参数通常需要可序列化；任务太小会让进程调度和序列化成本盖过并行收益。基准测试应使用真实数据、固定输入，并同时观察吞吐、内存和尾延迟。

## Python 3.14 的两个新选择

### Free-threaded CPython

PEP 703 引入的 free-threaded 构建从 Python 3.13 开始提供，Python 3.14 按 PEP 779 进入“官方支持但仍可选”的阶段。它可以关闭 GIL，让多个线程并行执行 Python 代码，但默认构建并没有因此消失。

使用前要确认：

- 依赖的 C 扩展是否支持 free-threaded 构建；
- 扩展导入时是否重新启用了 GIL；
- 共享对象是否有正确同步；
- 单线程性能、内存占用和部署工具链是否满足要求。

free-threaded 解决的是解释器并行限制，不会自动修复数据竞争。

### `InterpreterPoolExecutor`

Python 3.14 新增 `concurrent.futures.InterpreterPoolExecutor`。每个工作线程拥有独立解释器和独立 GIL，因此可以在同一进程里取得多核并行。

它的关键特征是**隔离**：模块状态、全局变量和大多数 Python 对象不能像普通线程那样直接共享。任务、参数和结果需要跨解释器传递，使用体验更接近进程池，而不是共享内存线程池。

它适合希望获得解释器隔离、又不想创建多个操作系统进程的场景。扩展模块兼容性、序列化成本和故障隔离仍需单独验证。

## 一张实用选型表

| 场景 | 优先方案 | 主要注意点 |
| --- | --- | --- |
| 同步 SDK、数据库或少量网络并发 | `ThreadPoolExecutor` | 线程安全、连接池、超时 |
| 大量异步网络连接 | `asyncio` | 必须使用异步库并限制并发 |
| 纯 Python CPU 计算 | `ProcessPoolExecutor` | 序列化、启动成本、内存 |
| 依赖已支持无 GIL 的生态 | free-threaded Python | 扩展兼容与数据竞争 |
| 需要解释器级隔离和多核 | `InterpreterPoolExecutor` | 对象隔离、跨解释器通信 |
| NumPy/推理等原生计算 | 先测库自身并行能力 | 避免线程池与库内线程过度嵌套 |
| I/O 与 CPU 混合 | 事件循环或线程负责 I/O，进程/解释器池负责计算 | 背压、取消、超时和资源上限 |

## 不要漏掉的工程条件

无论选哪种模型，都应显式处理：

- 超时、取消和重试；
- 并发上限与背压；
- 共享状态和幂等；
- 任务失败、进程退出和部分结果；
- 可观测性与基准测试；
- 服务端或第三方接口的限流规则。

并发模型只是执行手段。先说明任务在等待什么、数据如何共享、失败如何恢复，再决定线程、进程、协程或子解释器，通常比从 GIL 出发选型更可靠。

## 参考资料

- [Python 3.14：free-threaded Python 正式进入支持阶段](https://docs.python.org/3/whatsnew/3.14.html#free-threaded-python-is-officially-supported)
- [Python 文档：Free-threaded Python HOWTO](https://docs.python.org/3/howto/free-threading-python.html)
- [Python 文档：`InterpreterPoolExecutor`](https://docs.python.org/3/library/concurrent.futures.html#interpreterpoolexecutor)
- [Python 文档：多解释器与隔离](https://docs.python.org/3/library/concurrent.interpreters.html)
- [Python 文档：`asyncio`](https://docs.python.org/3/library/asyncio.html)
