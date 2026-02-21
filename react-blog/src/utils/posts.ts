// Mock data for blog posts
export interface Post {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  categories: string[];
  content?: string;
}

// Mock blog posts data
export const mockPosts: Post[] = [
  {
    id: 1,
    title: 'Python尾递归优化',
    excerpt: '探讨Python中的尾递归优化技术和实现方式，深入了解递归函数的性能优化策略。',
    date: '2017-09-22',
    categories: ['Python', '算法', '性能优化'],
    content: `# Python尾递归优化

在计算机科学中，尾调用是指一个函数执行的最后一步是调用另一个函数。尾递归是递归的一种特殊形式，在这种形式中，递归函数的最后一步操作就是调用自身。

## 尾递归的优势

尾递归可以被编译器优化，将递归调用转换为循环，从而避免了栈溢出的风险。

## 实现示例

\`\`\`python
def factorial(n, acc=1):
    if n <= 1:
        return acc
    return factorial(n-1, acc*n)
\`\`\`

这种优化对于处理大数据集的递归算法非常有用。`
  },
  {
    id: 2,
    title: 'Python陷阱解析',
    excerpt: '深入分析Python编程中常见的陷阱和最佳实践，帮助开发者避免常见错误。',
    date: '2017-09-22',
    categories: ['Python', '技巧', '调试'],
    content: `# Python陷阱解析

Python是一门优雅的语言，但也有一些容易让人困惑的地方。

## 可变默认参数

\`\`\`python
def append_to_list(value, target_list=[]):
    target_list.append(value)
    return target_list

# 这样使用会有问题
list1 = append_to_list(1)  # [1]
list2 = append_to_list(2)  # [1, 2]，不是预期的 [2]!
\`\`\`

## 解决方案

使用None作为默认值：

\`\`\`python
def append_to_list(value, target_list=None):
    if target_list is None:
        target_list = []
    target_list.append(value)
    return target_list
\`\`\``
  },
  {
    id: 3,
    title: '爬虫技术详解',
    excerpt: '详细介绍网络爬虫的实现原理、常用工具和反爬虫对策。',
    date: '2017-09-22',
    categories: ['爬虫', 'Python', '网络'],
    content: `# 爬虫技术详解

网络爬虫是一种自动获取网页内容的技术，广泛应用于数据挖掘、搜索引擎等领域。

## 基础实现

使用requests和BeautifulSoup：

\`\`\`python
import requests
from bs4 import BeautifulSoup

def crawl_page(url):
    response = requests.get(url)
    soup = BeautifulSoup(response.text, 'html.parser')
    return soup.find_all('a')
\`\`\`

## 注意事项

- 遵守robots.txt协议
- 控制请求频率
- 处理反爬虫机制`
  },
  {
    id: 4,
    title: '线程与进程对比',
    excerpt: '比较Python中线程和进程的差异，以及在不同场景下的应用选择。',
    date: '2017-09-22',
    categories: ['Python', '并发', '多线程'],
    content: `# 线程与进程对比

在Python中，线程和进程是实现并发的两种主要方式。

## 线程(Thread)

- 轻量级，创建和销毁开销小
- 共享内存空间
- 受GIL限制，CPU密集型任务效果不佳

## 进程(Process)

- 重量级，资源隔离
- 多核并行计算能力强
- IPC通信开销较大

## 选择建议

- I/O密集型任务：使用线程
- CPU密集型任务：使用进程`
  },
  {
    id: 5,
    title: 'MySQL索引与慢查询',
    excerpt: '深入讲解MySQL索引的工作原理和如何优化慢查询。',
    date: '2017-10-10',
    categories: ['MySQL', '数据库', '性能优化'],
    content: `# MySQL索引与慢查询

数据库性能优化是后端开发的重要技能。

## 索引类型

- B+树索引：适用于范围查询
- 哈希索引：适用于等值查询
- 全文索引：适用于文本搜索

## 慢查询优化

使用EXPLAIN分析查询计划：

\`\`\`sql
EXPLAIN SELECT * FROM users WHERE name = 'John';
\`\`\``
  }
];

// Function to get all posts
export const getAllPosts = (): Post[] => {
  return mockPosts;
};

// Function to get a single post by id
export const getPostById = (id: number): Post | undefined => {
  return mockPosts.find(post => post.id === id);
};

// Function to get posts by category
export const getPostsByCategory = (category: string): Post[] => {
  return mockPosts.filter(post => post.categories.some(cat => cat === category));
};

// Function to get unique categories
export const getCategories = (): string[] => {
  const categories = new Set<string>();
  mockPosts.forEach(post => {
    post.categories.forEach(cat => categories.add(cat));
  });
  return Array.from(categories);
};