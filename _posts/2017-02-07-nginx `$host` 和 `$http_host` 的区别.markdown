---
layout: post
title: nginx `$host` 和 `$http_host` 的区别
categories: nginx
excerpt: 配nginx的时候，我们都碰到过这个参数`proxy_set_header Host`，对于这个参数的值网上一般有两种，$host和$http_host，这两个值究竟有啥区别呢？
---

# nginx `$host` 和 `$http_host` 的区别

`$host`是[core](http://nginx.org/en/docs/http/ngx_http_core_module.html)模块内部的一个变量

1. 当请求头里不存在`Host`属性或者是个空值，`$host`则等于server_name
2. 如果请求头里有`Host`属性，那么`$host`等于`Host`属性除了端口号的部分，例如`Host`属性是`www.example.com`，那么`$host`就是`www.example.com`

`$http_host`也是core模块内部的变量，`$http_HEADER`，其中HEADER可以是请求头里的任意属性，
例如`$http_user_agent`,`$http_referer`

所以`$http_host`总是等于请求头里的`Host`属性

