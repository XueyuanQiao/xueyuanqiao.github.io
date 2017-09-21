---
layout: post
title: 关于nginx的gzip
categories: nginx
excerpt: 如何打开nginx的gzip功能？
---

gzip可以有效的压缩内容，提高网站的访问速度，nginx提供了gzip支持。

nginx中与gzip有关的命令包括下面这些

```
gzip
gzip_buffers
gzip_comp_level
gzip_disable
gzip_min_length
gzip_http_version
gzip_proxied
gzip_types
gzip_vary
```

#### gzip

设置gzip是否开启，可以是 `on` 或 `off`，默认是off。

#### gzip_buffers

设置缓存的数量和大小，可选值为 32 4k|16 8k。

#### gzip_comp_level

设置压缩比，从1到9，1是最低

#### gzip_disable

根据User-Agent判断是否需要gzip，值是一个正则。

#### gzip_min_length

如果response的content-length小于这个值，则不压缩，默认值20。

#### gzip_http_version

1.0或者1.1

#### gzip_proxied

为代理的服务开启gzip服务，值为off | expired | no-cache | no-store | private | no_last_modified | no_etag | auth | any。

#### gzip_types

根据MIME types判断是否压缩，默认值text/html

#### gzip_vary

值为 on|off，如果是on，则会加一个响应头Vary:Accept-Encoding


### 例子

```
gzip  on;
gzip_proxied any;
gzip_types application/json text/css;
```


