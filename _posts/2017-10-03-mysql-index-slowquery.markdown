---
layout: post
title: MySQL 8.4 索引与慢查询优化：一套可验证的排查方法
date: 2017-10-03 14:10:13 +0800
excerpt: 从访问模式和联合索引出发，结合 EXPLAIN ANALYZE、慢查询日志、Performance Schema、直方图与不可见索引，整理 MySQL 8.4 中可验证的慢查询优化流程。
categories: 数据库
---

> 本文最初写于 2017 年。旧版内容主要基于早期 MySQL 的经验规则，部分结论过于绝对，也缺少 MySQL 8 提供的实际执行信息。2026 年重写时以 MySQL 8.4 LTS 为生产基线。

慢查询优化不是“看到 WHERE 就加索引”。一个查询是否快，取决于数据分布、访问路径、返回行数、排序与临时表、缓存状态、并发和硬件。可靠的方法是：先建立基线，再看实际执行计划，最后用同一负载验证改动。

## 先说明索引能做什么

InnoDB 的普通二级索引使用 B+Tree。叶子节点保存索引键和主键值；如果查询还需要其它列，存储引擎通常要根据主键回到聚簇索引取整行，这就是常说的“回表”。

索引主要帮助数据库：

- 缩小需要读取的行范围；
- 按索引顺序返回数据，减少额外排序；
- 通过覆盖索引直接取得查询所需列；
- 更高效地完成连接和唯一性检查。

代价同样明确：

- 占用磁盘和缓存；
- INSERT、UPDATE、DELETE 要维护更多树；
- 过宽或重复索引增加写放大；
- 统计信息不准确时，优化器仍可能选错访问路径。

因此，索引设计应来自稳定的查询模式，而不是来自单个字段的“区分度排行榜”。

## 用一条查询说明联合索引

假设订单表常见查询是：

{% highlight sql %}
SELECT id, total_amount, created_at
FROM orders
WHERE tenant_id = ?
  AND status = ?
  AND created_at >= ?
  AND created_at < ?
ORDER BY created_at DESC
LIMIT 50;
{% endhighlight %}

候选联合索引：

{% highlight sql %}
CREATE INDEX idx_orders_tenant_status_created
ON orders (tenant_id, status, created_at DESC);
{% endhighlight %}

这个顺序把等值条件放在前面，再用时间范围缩小扫描区间，并与排序方向对齐。

所谓“最左前缀”更准确的理解是：B+Tree 按索引列顺序排序，查询必须先确定左侧列，才能高效定位后续列。若只按 `status` 查询，上面的索引通常不能像以 `status` 开头的索引那样直接定位。

“遇到范围条件后，右侧列完全用不到”也过于绝对。范围条件之后的列通常不能继续缩小索引的连续扫描区间，但仍可能用于 Index Condition Pushdown、覆盖查询或过滤。是否有效要看执行计划，不能只背口诀。

## 第一步：把慢查询记录下来

先保存这些信息：

- 完整 SQL 和参数，而不是只保留模板；
- 数据库版本、表结构和索引；
- 执行时间、返回行数和检查行数；
- 调用频率、并发量和业务时段；
- 冷缓存与热缓存是否有明显差异；
- 是单次慢，还是总消耗高。

慢查询日志适合发现超过阈值的语句；Performance Schema 和 `sys` schema 更适合按摘要聚合，找出“单次不算慢但调用很多”的查询。

不要再使用旧教程中的 `SQL_NO_CACHE` 做基准。MySQL 8 已移除查询缓存，性能测试应该明确数据规模、缓存状态和重复次数。

## 第二步：看估算计划

{% highlight sql %}
EXPLAIN FORMAT=TREE
SELECT ...;
{% endhighlight %}

重点看：

- 访问方式是全表扫描、索引范围扫描还是唯一查找；
- 使用了哪个索引，候选索引有哪些；
- 每一步估算行数；
- 连接顺序和连接算法；
- 是否出现临时表、额外排序或大量回表；
- 过滤条件在哪一层生效。

传统表格中的 `rows` 只是估算值，不是实际读取行数。“rows 小就一定快”并不成立：单行大对象、磁盘随机读、锁等待、相关子查询和高频调用都可能让查询变慢。

## 第三步：用 EXPLAIN ANALYZE 看实际执行

MySQL 8 的 `EXPLAIN ANALYZE` 会真正执行查询，并输出每个迭代器的实际时间、返回行数和循环次数：

{% highlight sql %}
EXPLAIN ANALYZE
SELECT ...;
{% endhighlight %}

它最有价值的地方是比较“估算”和“实际”：

- 估算 10 行、实际 100 万行：统计信息或数据相关性可能有问题；
- 某一步循环次数异常大：可能是连接顺序或嵌套循环放大；
- 扫描很少但耗时很高：可能是 I/O、锁等待或单行计算成本；
- 排序前产生大量中间结果：应考虑提前过滤或改变访问路径。

因为它会执行语句，应在安全环境使用，并评估查询本身的资源消耗。不要拿一条已知会拖垮生产库的 SQL 直接做 `EXPLAIN ANALYZE`。

## 第四步：判断是哪一类问题

### 条件无法有效使用索引

常见原因：

- 在索引列上计算或做隐式类型转换；
- 联合索引缺少左侧列；
- `LIKE '%keyword'` 以通配符开头；
- 字符集、排序规则或数据类型不一致；
- OR 条件跨度很大，成本高于全表扫描。

例如：

{% highlight sql %}
-- 不利于普通 created_at 索引
WHERE DATE(created_at) = '2026-07-19'

-- 改成半开区间
WHERE created_at >= '2026-07-19 00:00:00'
  AND created_at <  '2026-07-20 00:00:00'
{% endhighlight %}

如果业务必须按表达式查询，可以评估函数索引或生成列，但仍应先确认查询频率和写入代价。

### 排序和分页扫描过多

深分页：

{% highlight sql %}
SELECT id, created_at
FROM orders
ORDER BY created_at DESC, id DESC
LIMIT 100000, 50;
{% endhighlight %}

数据库仍要找到并跳过前 100000 行。连续翻页更适合 keyset pagination：

{% highlight sql %}
SELECT id, created_at
FROM orders
WHERE (created_at, id) < (?, ?)
ORDER BY created_at DESC, id DESC
LIMIT 50;
{% endhighlight %}

对应索引应与过滤和排序顺序匹配。

### 返回数据过多

索引只能帮助“找到行”，不能消除把大量数据传到应用的成本。避免无目的的 `SELECT *`，确认是否真的需要一次返回几万行、长文本或 JSON。

### 连接产生中间结果爆炸

检查每张表在连接前后的行数，确认连接键有合适索引，并警惕：

- 缺失连接条件导致笛卡尔积；
- 一对多关系被多次展开；
- OR 连接条件让优化器难以使用单一路径；
- 排序和 LIMIT 在大量连接结果之后才生效。

有时把逻辑拆成 `UNION ALL`、先聚合再连接或改写为 EXISTS 会更清楚，但必须用完整数据集验证语义等价，尤其要检查重复行和 NULL。

### 不是 SQL 本身，而是锁和资源

执行计划正常但响应很慢时，还要看：

- 行锁、元数据锁和事务持续时间；
- Buffer Pool 命中率和磁盘 I/O；
- 临时表是否落盘；
- CPU、连接数和线程池是否饱和；
- 主从延迟或存储抖动。

慢查询优化不能替代事务治理和容量规划。

## 统计信息、直方图和优化器误判

InnoDB 统计信息可能无法表达列之间的相关性。对没有索引、但数据分布明显不均匀的列，可以用直方图帮助优化器估算：

{% highlight sql %}
ANALYZE TABLE orders
UPDATE HISTOGRAM ON status WITH 64 BUCKETS;
{% endhighlight %}

直方图不是越多越好，也需要随数据变化维护。使用前后应比较计划和实际执行，避免把“刷新统计信息”当成固定仪式。

## 用不可见索引降低删除风险

MySQL 8 支持 invisible index。优化器默认忽略不可见索引，但数据库仍维护它，因此可以先观察不使用该索引时查询是否退化：

{% highlight sql %}
ALTER TABLE orders
ALTER INDEX idx_old INVISIBLE;
{% endhighlight %}

确认业务和监控没有异常后再删除。需要回滚时可快速改回 `VISIBLE`。这比直接删除索引更安全，但不能替代完整压测，因为不可见期间仍有维护成本。

## 一套可复用的优化流程

1. 从慢查询日志或 Performance Schema 找到高影响 SQL；
2. 保存参数、数据规模、频率和基线耗时；
3. 检查表结构、现有索引和统计信息；
4. 用 `EXPLAIN FORMAT=TREE` 阅读估算计划；
5. 在安全环境用 `EXPLAIN ANALYZE` 验证实际行数和耗时；
6. 只提出一个主要改动：改 SQL、加/改索引、刷新统计或调整业务访问方式；
7. 用真实分布和边界参数回归结果正确性；
8. 同时观察读性能、写性能、锁、磁盘和缓存；
9. 灰度发布并保留回滚方案；
10. 上线后继续观察 p95/p99，而不只看一次最快结果。

## 索引评审清单

- 它服务哪些高频或高风险查询？
- 是否与已有索引重复或被更长索引覆盖？
- 列顺序是否对应等值、范围、排序和连接模式？
- 是否为了“覆盖”加入了过多大字段？
- 写入放大和磁盘成本是否可接受？
- 数据分布变化后仍然有效吗？
- 是否用实际执行计划验证，而不是只靠经验规则？

好的优化结论应该能够被复现：在明确的数据集和查询参数下，扫描更少、延迟更稳，并且没有把成本悄悄转移到写入、锁或其它查询上。

## 参考资料

- [MySQL 8.4 Reference Manual：EXPLAIN](https://dev.mysql.com/doc/refman/8.4/en/explain.html)
- [MySQL 8.4：EXPLAIN ANALYZE](https://dev.mysql.com/doc/refman/8.4/en/explain.html#explain-analyze)
- [MySQL 8.4：Invisible Indexes](https://dev.mysql.com/doc/refman/8.4/en/invisible-indexes.html)
- [MySQL 8.4：Optimizer Statistics 与 Histograms](https://dev.mysql.com/doc/refman/8.4/en/optimizer-statistics.html)
- [MySQL 8.4：Slow Query Log](https://dev.mysql.com/doc/refman/8.4/en/slow-query-log.html)
- [MySQL 8.4：Performance Schema Statement Summary Tables](https://dev.mysql.com/doc/refman/8.4/en/performance-schema-statement-summary-tables.html)
