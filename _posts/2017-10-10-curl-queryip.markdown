---
layout: post
title: 用 curl 查询公网出口 IP，并区分本机地址
date: 2017-10-10 12:10:13 +0800
excerpt: 说明公网出口 IP、内网接口地址、IPv4/IPv6 和代理出口的区别，并给出适合交互使用与脚本使用的 curl 写法。
categories: devtools
---

“本机 IP”可能指完全不同的东西：

- 网卡上的局域网地址，例如 `192.168.x.x`；
- 经过 NAT 后，互联网服务看到的公网出口地址；
- VPN、HTTP 代理或容器网络的出口地址；
- IPv4 和 IPv6 地址。

向外部服务发请求，查到的是**对方看到的请求来源地址**，不一定是网卡地址。

## 查询公网 IPv4

{% highlight bash %}
curl --fail --silent --show-error --max-time 5 \
  https://api.ipify.org
{% endhighlight %}

强制使用 IPv4：

{% highlight bash %}
curl -4 --fail --silent --show-error --max-time 5 \
  https://api.ipify.org
{% endhighlight %}

也可以使用另一个服务交叉确认：

{% highlight bash %}
curl -4 --fail --silent --show-error --max-time 5 \
  https://ifconfig.co/ip
{% endhighlight %}

`--fail` 会让 HTTP 4xx/5xx 返回失败状态，`--max-time` 防止脚本无限等待，`--silent --show-error` 适合在减少进度输出的同时保留错误信息。

## 查询公网 IPv6

前提是本机网络、DNS 和服务端都支持 IPv6：

{% highlight bash %}
curl -6 --fail --silent --show-error --max-time 5 \
  https://api64.ipify.org
{% endhighlight %}

如果命令失败，不代表机器一定没有 IPv6，也可能是当前网络、DNS、代理或防火墙不支持这条路径。

## 查询出口信息

需要 ASN、运营商或大致地区时，可以请求 JSON：

{% highlight bash %}
curl --fail --silent --show-error --max-time 5 \
  https://ipinfo.io/json
{% endhighlight %}

IP 地理位置通常只是近似值，不能当作用户精确位置。第三方服务还会记录请求来源，敏感环境应先评估隐私与合规要求。

## 查询局域网接口地址

Linux：

{% highlight bash %}
ip address
ip route get 1.1.1.1
{% endhighlight %}

macOS 常见 Wi-Fi 接口：

{% highlight bash %}
ipconfig getifaddr en0
{% endhighlight %}

机器有多个网卡、容器、VPN 或虚拟机时，可能同时存在多个地址。`ip route get` 更接近“访问某个目标时会使用哪个源地址”，但它仍然是 NAT 之前的本地地址。

## 脚本中不要只依赖一个公共站点

如果公网 IP 是部署或监控的关键输入，建议：

1. 设置连接和总超时；
2. 准备两个独立服务，但不要高频轮询；
3. 校验返回值确实是合法 IP；
4. 记录失败，不要把空字符串当成地址继续执行；
5. 考虑代理、NAT 网关和双栈网络；
6. 对稳定需求优先从云厂商元数据或网络配置获取。

公网 IP 查询服务适合诊断，不应该在每个业务请求里调用。

## 参考资料

- [curl 命令行选项](https://curl.se/docs/manpage.html)
- [ipify API](https://www.ipify.org/)
- [ifconfig.co](https://ifconfig.co/)
- [ipinfo 开发文档](https://ipinfo.io/developers)
