import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getPostById } from '../utils/posts';
import '../styles/PostDetail.scss';

interface PostParams {
  id: string;
}

const PostDetail: React.FC = () => {
  const { id } = useParams<PostParams>();
  const [post, setPost] = useState<any>(null);

  useEffect(() => {
    const postId = parseInt(id || '0');
    const postData = getPostById(postId);
    setPost(postData);
  }, [id]);

  if (!post) {
    return <div className="post-detail">文章未找到</div>;
  }

  return (
    <div className="post-detail">
      <article className="post-content card-hover glow">
        <h1>{post.title}</h1>
        <div className="post-meta">
          <span className="date">{post.date}</span>
          <div className="categories">
            {post.categories.map((category: string, index: number) => (
              <span key={index} className="category-tag">{category}</span>
            ))}
          </div>
        </div>
        <div className="post-body" dangerouslySetInnerHTML={{ __html: post.content?.replace(/\n/g, '<br />') }} />
      </article>
    </div>
  );
};

export default PostDetail;