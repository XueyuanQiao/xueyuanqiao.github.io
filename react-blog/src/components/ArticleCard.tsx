import React from 'react';
import '../styles/ArticleCard.scss';

interface Post {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  categories: string[];
}

interface ArticleCardProps {
  post: Post;
}

const ArticleCard: React.FC<ArticleCardProps> = ({ post }) => {
  return (
    <section className="article-card card-hover glow">
      <h2><a href={`/post/${post.id}`}>{post.title}</a></h2>
      <p>{post.excerpt}</p>
      <div className="categories">
        {post.categories.map((category, index) => (
          <label key={index}>{category}</label>
        ))}
      </div>
      <div className="time">
        <label>
          <time>{post.date}</time>
        </label>
      </div>
    </section>
  );
};

export default ArticleCard;