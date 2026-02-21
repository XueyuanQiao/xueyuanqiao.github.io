import React from 'react';
import './styles/App.scss';
import Layout from './components/Layout';
import Home from './pages/Home';
import About from './pages/About';
import Categories from './pages/Categories';
import Links from './pages/Links';
import PostDetail from './pages/PostDetail';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';

const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/links" element={<Links />} />
          <Route path="/post/:id" element={<PostDetail />} />
        </Routes>
      </Layout>
    </Router>
  );
};

export default App;