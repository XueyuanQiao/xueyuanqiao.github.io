import React from 'react';
import '../styles/About.scss';

const About: React.FC = () => {
  return (
    <div className="about-page">
      <h1>关于我</h1>
      <p>欢迎来到我的技术博客！这里分享我对编程和技术的热情。</p>
      <p>持续分享编程经验与技术心得，包括但不限于Python开发技巧、爬虫技术、自动化测试、数据库优化等。</p>
    </div>
  );
};

export default About;