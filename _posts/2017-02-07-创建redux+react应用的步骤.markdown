---
layout: post
title: "创建redux+react应用的步骤"
categories: javascript
excerpt: 记录搭建redux+react应用的步骤，方便以后开发。
---

## 1.安装webpack
```javascript
npm install webpack -g
npm install webpack --save-dev
```
在项目目录创建webpack.config.js，写入下面内容

```js
var path = require('path');

module.exports = {
    entry: "./src/app.js",
    output: {
        path: __dirname,
        filename: "bundle.js"
    },
    module: {
        loaders: [
            { test: /\.css$/, loader: "style!css" },
            { test: /\.js$/, exclude: /node_modules/, loader: "babel-loader"}
        ]
    }
};
```
## 2.安装redux
```
npm install redux --save
npm install react-redux --save
```
## 3.安装react
```
npm install react react-dom --save
```
## 4.安装babel
```
npm install --save-dev babel-loader babel-core babel-preset-es2015 babel-preset-react
```
在项目目录创建.babelrc文件，写入下面内容

```json
{
   "presets": ["es2015","react"]
}
```
## 5.创建目录与文件
在项目目录下创建src目录，index.html，在src目录下创建app.js，page-title.js

![目录结构](/images/react-redux.png)


index.html写入下面内容

```html
<!DOCTYPE html>
<html>
<head></head>
<body>
<script src="./bundle.js"></script>
</body>
</html>
```

page-title.js写入下面内容

```javascript
import React from "react";

export default React.createClass({
  render: function() {
    return (
      <div className="page-title">
        {this.props.title}!
      </div>
    );
  },
});
```

app.js写入下面内容

```javascript
import React from "react";
import ReactDom from "react-dom";
import PageTitle from "./page-title";

export default ReactDom.render(
  <PageTitle title="页面标题" />,
  document.body
);
```

## 6.编译并打包
运行命令

```
webpack
```
然后就能看到类似下面的内容，说明成功了

```
Hash: 2a32cbe6b1f6844f6bdb
Version: webpack 1.12.11
Time: 6247ms
    Asset    Size  Chunks             Chunk Names
bundle.js  677 kB       0  [emitted]  main
    + 160 hidden modules
```

> 上面的步骤包含了babel的es2015插件，
> 所以可以用es2015的语法写js哦！



