# Xueyuan's Tech Blog - React版本

这是原Jekyll博客的React重构版本，保留了原有的科技感设计风格和动画效果。

## 🚀 功能特色

- **现代化UI设计**：采用深色科技风格配色方案，结合渐变色彩和光影效果
- **流畅动画交互**：包含多种动画效果如悬停变换、渐入效果、扫光动画等
- **响应式布局**：适配各种屏幕尺寸，提供一致的用户体验
- **高性能渲染**：基于React的虚拟DOM，确保快速加载和流畅体验

## 🛠 技术栈

- **框架**：React 18 + TypeScript
- **路由**：React Router v6
- **样式**：SCSS + CSS Modules
- **构建工具**：Create React App
- **动画效果**：CSS3动画 + 自定义动效

## 📦 项目结构

```
react-blog/
├── public/                 # 静态资源
├── src/
│   ├── components/         # 可复用组件
│   ├── pages/             # 页面组件
│   ├── styles/            # 样式文件
│   ├── utils/             # 工具函数
│   └── assets/            # 静态资源
├── package.json           # 项目依赖
└── README.md
```

## 🔧 本地开发

1. 安装依赖：
```bash
npm install
```

2. 启动开发服务器：
```bash
npm start
```

3. 构建生产版本：
```bash
npm run build
```

## 🚀 部署到GitHub Pages

1. 安装gh-pages：
```bash
npm install --save-dev gh-pages
```

2. 在package.json中添加脚本：
```json
{
  "homepage": "https://xueyuanqiao.github.io/react-blog",
  "scripts": {
    "predeploy": "npm run build",
    "deploy": "gh-pages -d build"
  }
}
```

3. 部署：
```bash
npm run deploy
```

## 📊 内容涵盖

持续分享编程经验与技术心得，包括但不限于：
- Python开发技巧
- 爬虫技术
- 自动化测试
- 数据库优化
- 前端技术

## 🎨 设计亮点

- 深色主题配合蓝色高亮，营造科技氛围
- 卡片式布局，带悬停提升和发光效果
- 动态网格背景，增强视觉层次
- 流畅的过渡动画和交互动效
- 现代化的排版和间距设计

访问地址：https://xueyuanqiao.github.io/react-blog