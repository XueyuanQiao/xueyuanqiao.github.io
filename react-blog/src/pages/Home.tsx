import React from 'react';
import ArticleCard from '../components/ArticleCard';
import '../styles/Home.scss';

// Mock data for blog posts
const mockPosts = [
  {
    id: 1,
    title: 'Python尾递归优化',
    excerpt: '探讨Python中的尾递归优化技术和实现方式...',
    date: '2017-09-22',
    categories: ['Python', '算法']
  },
  {
    id: 2,
    title: 'Python陷阱解析',
    excerpt: '深入分析Python编程中常见的陷阱和最佳实践...',
    date: '2017-09-22',
    categories: ['Python', '技巧']
  },
  {
    id: 3,
    title: '爬虫技术详解',
    excerpt: '详细介绍网络爬虫的实现原理和注意事项...',
    date: '2017-09-22',
    categories: ['爬虫', 'Python']
  }
];

const Home: React.FC = () => {
  return (
    <div className="home-page">
      <h1>首页</h1>
      {mockPosts.map(post => (
        <ArticleCard key={post.id} post={post} />
      ))}
      <div className="pagination">
        <a href="#">上一页</a>
        <em>1</em>
        <a href="#">2</a>
        <a href="#">3</a>
        <a href="#">下一页</a>
      </div>
    </div>
  );
};

export default Home;