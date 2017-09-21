---
layout: post
title:  "centos7安装nginx步骤"
date:   2017-02-07 10:25:55 +0800
categories: nginx
tags: [centos, nginx]
excerpt: 记录centos7安装nginx的方法，方便下次做类似操作。
---

# centos7安装nginx步骤

[官方的安装文档](https://nginx.org/en/linux_packages.html#stable)

## step 1
创建文件/etc/yum.repos.d/nginx.repo，写入下面内容。

```
[nginx]
name=nginx repo
http://nginx.org/packages/centos/7/$basearch/
gpgcheck=0
enabled=1
```

## step 2
运行命令

```
yum install nginx
```

## step 3
```
nginx   //启动
nginx -s stop   //停止
nginx -s reload //重新启动
```

