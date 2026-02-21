import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/Sidebar.scss';

const Sidebar: React.FC = () => {
  return (
    <aside className="sidebar shine">
      <div>
        <header className="pulse">
          <a href="/" className="profile-link">
            <img src="/images/head.jpeg" alt="头像" className="ripple" />
          </a>
          <h1>雪源的博客</h1>
        </header>
        <nav>
          <ul>
            <li><Link to="/" className="shine">文章</Link></li>
            <li><Link to="/categories" className="shine">分类</Link></li>
            <li><Link to="/links" className="shine">链接</Link></li>
            <li><Link to="/about" className="shine">关于</Link></li>
          </ul>
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;