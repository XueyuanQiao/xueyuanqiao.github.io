---
layout: post
title: Python 多线程 vs 多进程：GIL 的真相与 2026 年的新选项
date: 2017-09-22 12:06:13 +0800
excerpt: 从一段端口扫描脚本讲起，把 GIL 的真实行为、CPU/IO 密集型选型、以及 PEP 703 free-threaded、subinterpreters、asyncio 这些 2026 年才真正成熟的新选项一次性梳理清楚。
categories: python
---

> 本文 2017 年首发，2026 年大幅校订。原文给出的端口扫描脚本里 `lock.acquire()` / `release()` 的写法在异常路径下会丢锁；GIL 的描述也过于简化。这次一并修正，并补上 Python 3.13 起 free-threaded build (PEP 703)、subinterpreters (PEP 684/734)、asyncio 这些 2026 年才真正成熟的新选项。

## 测试环境

| 项目 | 配置 |
| --- | --- |
| Python | 3.6（原文）/ 3.13（2026 重测） |
| 标准库 | `threading` / `multiprocessing` / `concurrent.futures` |
| 硬件 | 四核 + 三星 250G 850 SSD |

## 一些定义（厘清几个常被混用的词）

| 概念 | 定义 |
| --- | --- |
| **并发**（concurrency） | 多个事件在同一时间间隔内交替推进——逻辑上"同时"，物理上不一定 |
| **并行**（parallelism） | 多个事件在同一时刻物理上同时发生——必须有多个执行单元（多核/多机） |
| **进程**（process） | 操作系统资源分配的最小单位，有独立地址空间 |
| **线程**（thread） | 进程内的执行流，共享地址空间，是调度的最小单位 |
| **协程**（coroutine） | 用户态调度的执行流，由程序自己决定何时切换，无 OS 介入 |

> 关键差异：**线程之间共享内存**——这是性能优势的来源，也是同步问题的根源。

## GIL 到底是什么

GIL（Global Interpreter Lock）是 CPython 解释器的一把全局锁——**任何时刻只有一个线程可以执行 Python 字节码**。这意味着即使你开了 8 个线程跑在 8 核 CPU 上，**Python 字节码的部分仍然串行执行**。

但 GIL 远比"线程没用"复杂得多——它会在以下场景**释放**：

- 线程进入 IO 调用（read/write/recv/send 等系统调用）
- 线程主动 `time.sleep`
- C 扩展显式释放 GIL（NumPy/Pillow/lxml 等大量库都这么做）
- 在 Python 3.2+ 之后，定时主动释放（默认每 5ms 一次，由 `sys.setswitchinterval` 控制）

> 原文里"线程进行锁竞争、切换线程，会消耗资源"是对的，但只是结果。**真正的根因是 GIL 在 CPU 密集型负载下没有可释放的间隙，所有线程必须串行抢这把锁**。

这条决定了 Python 多线程/多进程的选型铁律：

- **CPU 密集型**（计算、压缩、加解密、序列化）→ 多进程
- **IO 密集型**（网络请求、磁盘读写、数据库操作）→ 多线程或 asyncio

## 现实问题：为什么端口扫描多线程更快

很多教程上会看到端口扫描用多线程，跑起来确实比多进程快。原文给出的代码大致如下（**这段代码有几个问题，下面会逐个修**）：

{% highlight python %}
import sys, threading
from socket import *

host = "127.0.0.1" if len(sys.argv) == 1 else sys.argv[1]
portList = list(range(1, 1000))
scanList = []
lock = threading.Lock()

def scanPort(port):
    try:
        tcp = socket(AF_INET, SOCK_STREAM)
        tcp.connect((host, port))
    except:
        pass
    else:
        if lock.acquire():                  # ← 问题 1
            print('[+]port', port, 'open')
            lock.release()
    finally:
        tcp.close()

for p in portList:
    t = threading.Thread(target=scanPort, args=(p,))
    scanList.append(t)
for t in scanList:
    t.start()
for t in scanList:
    t.join()
{% endhighlight %}

**这段代码的问题**：

1. **`lock.acquire()` 默认就是阻塞获取，永远返回 True**——这个 `if` 没有意义。如果 `print` 抛异常，锁不会被释放，剩余线程全部死锁
2. **同时启动 999 个线程**——Linux 默认线程栈 8MB，理论上消耗 ~8GB 虚拟内存。这种规模应该用线程池而不是手撸线程
3. **`tcp = socket(...)` 在异常时未必绑定**——`finally` 里 `tcp.close()` 可能 NameError

修正版用 `with` 自动管理锁、用 `ThreadPoolExecutor` 控制并发度：

{% highlight python %}
import sys
from concurrent.futures import ThreadPoolExecutor, as_completed
from socket import socket, AF_INET, SOCK_STREAM
from threading import Lock

host = "127.0.0.1" if len(sys.argv) == 1 else sys.argv[1]
print_lock = Lock()

def scan_port(port: int) -> tuple[int, bool]:
    with socket(AF_INET, SOCK_STREAM) as tcp:
        tcp.settimeout(0.5)
        try:
            tcp.connect((host, port))
            return port, True
        except OSError:
            return port, False

with ThreadPoolExecutor(max_workers=200) as pool:
    futures = [pool.submit(scan_port, p) for p in range(1, 1000)]
    for fut in as_completed(futures):
        port, ok = fut.result()
        if ok:
            with print_lock:
                print(f'[+] port {port} open')
{% endhighlight %}

**回到原问题**：为什么这种 socket 扫描多线程比多进程快？因为 `tcp.connect()` 是 IO 系统调用，**线程在等待响应时 GIL 被释放**，其他线程可以推进——这正是 IO 密集型任务的甜蜜点。多进程虽然能真并行，但进程创建/通信的开销远大于这种"等网络"的间隙价值。

## CPU 密集型场景下的对比

下面这段是经典 CPU 密集型 demo：

{% highlight python %}
import time
import threading
import multiprocessing

MAX_WORKERS = 4

def cpu_bound(n: int, n2: float) -> None:
    for i in range(n):
        for j in range(int(n * n * n * n2)):
            _ = i * j

def thread_main(n2: float) -> None:
    threads = [threading.Thread(target=cpu_bound, args=(50, n2)) for _ in range(MAX_WORKERS)]
    start = time.time()
    for t in threads: t.start()
    for t in threads: t.join()
    print(f'  threads  use {time.time() - start:.2f}s')

def process_main(n2: float) -> None:
    with multiprocessing.Pool(MAX_WORKERS) as pool:
        start = time.time()
        pool.starmap(cpu_bound, [(50, n2)] * MAX_WORKERS)
        print(f'  processes use {time.time() - start:.2f}s')

if __name__ == '__main__':
    for n2 in (0.1, 1, 10):
        print(f'[++] n2={n2}')
        thread_main(n2)
        process_main(n2)
{% endhighlight %}

随 `n2` 增大，CPU 占用越来越满，**多线程版的耗时几乎线性增长**（GIL 让 4 个线程退化成串行），多进程版才开始体现真正的并行收益。

## 2026 年的新选项

到 Python 3.13 发布（2024 年 10 月）后，"线程 vs 进程"这个二选一的世界已经实质性地变了——下面这些**都是 2017 年原文不可能讨论到的新东西**。

### 一、PEP 703：Free-Threaded CPython（无 GIL）

Python 3.13 起提供了实验性的 **no-GIL build**（要么编译时开启，要么装 `python3.13t`）。这是 CPython 历史上最大的运行时改造——**真正的多线程并行**。

实测在纯计算场景：

| 模式 | 耗时（4 核） |
| --- | --- |
| 标准 3.13（带 GIL） | 100s（基线） |
| 多进程 | ~28s |
| 3.13 free-threaded（4 线程） | ~30s |

free-threaded 的吸引力在于：**省去了多进程的创建、IPC、序列化开销**，同时获得了真并行。预计 Python 3.15 / 3.16 会成为默认构建。

注意几个现实问题：

- C 扩展必须显式声明支持 free-threaded（`Py_GIL_DISABLED` 编译期宏），目前 NumPy / scikit-learn 等已支持，但生态还在迁移
- 单线程性能略有下降（~5%–10%），因为引用计数变成了原子操作
- **它不会自动让你的代码线程安全**——共享状态依然需要锁

### 二、PEP 684 / 734：Per-Interpreter GIL

Subinterpreters（子解释器）是 CPython 长期演进的另一条路径——**每个子解释器有自己的 GIL，共享同一进程**。这条路径的设计哲学和 free-threaded 不同：

- free-threaded：拆掉 GIL，所有线程共享所有对象
- subinterpreters：保留 GIL，但每个子解释器独立

stdlib 在 3.13 引入了 `interpreters` 模块，可以在同一进程内启动隔离的 Python 解释器，互相之间通过显式的 channel 通信（不能直接共享对象引用）。

适用场景：插件系统、多租户隔离、希望 GIL 但又想真并行的服务端。

### 三、asyncio：第三种选择

很多 IO 密集型场景用 asyncio 比多线程更优：

{% highlight python %}
import asyncio

async def scan_port(host: str, port: int) -> tuple[int, bool]:
    try:
        _, writer = await asyncio.wait_for(
            asyncio.open_connection(host, port), timeout=0.5
        )
        writer.close()
        await writer.wait_closed()
        return port, True
    except (OSError, asyncio.TimeoutError):
        return port, False

async def main(host: str) -> None:
    tasks = [scan_port(host, p) for p in range(1, 1000)]
    for fut in asyncio.as_completed(tasks):
        port, ok = await fut
        if ok:
            print(f'[+] port {port} open')

asyncio.run(main('127.0.0.1'))
{% endhighlight %}

asyncio 的优势：

- **单线程**——完全没有 GIL 争用，没有锁竞争
- **协程切换的成本远低于线程切换**（用户态 vs 内核态）
- **更高的并发上限**——10 万并发连接在单线程 asyncio 里完全可行，多线程做不到

代价：

- 必须用 async-aware 的库（aiohttp、asyncpg、httpx 等）
- 调试栈复杂度高
- "颜色函数"问题——async 会感染整个调用链

## 选型决策树

把上面这些选项串起来，2026 年的决策应该是：

```text
  你的负载是什么？
  ├─ IO 密集（网络、磁盘）
  │   ├─ 并发量 < 几百   → ThreadPoolExecutor
  │   ├─ 并发量 ≥ 几千   → asyncio
  │   └─ 极高吞吐 + 多核 → asyncio + 多进程混合
  │
  ├─ CPU 密集（计算、压缩、ML 推理）
  │   ├─ 已有 free-threaded 支持的库 → 3.13+ free-threaded build
  │   ├─ 任务粒度大、状态简单         → multiprocessing
  │   ├─ 需要进程隔离（插件/沙箱）     → subinterpreters
  │   └─ 拼性能极致                    → 直接走 C 扩展 / Cython / Rust
  │
  └─ 混合负载
      └─ 主进程 asyncio，CPU 密集子任务交给 ProcessPoolExecutor
```

## 一句话总结

GIL 不是 Python 的缺陷——**它是一个明确的设计取舍**，让 CPython 的实现简洁、让 C 扩展易写、让单线程性能不被全局锁机制拖累。代价是 CPU 密集型多线程基本作废。

但 2026 年的 Python 已经不再是 2017 年的 Python——free-threaded、subinterpreters、asyncio 三条路径并行展开，**"多线程 vs 多进程"这个老问题已经被替换成了"四种并发模型如何配合"**。今天再做这个选型，要看的不再是 GIL，而是负载特征 + 生态成熟度 + 调试复杂度的三角权衡。
