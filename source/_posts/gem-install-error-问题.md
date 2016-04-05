---
title: gem install error 问题
date: 2016-04-05 09:38:22
tags:
---
在用gem install 进行安装githug时，出现了如下错误：
> ERROR:  Could not find a valid gem 'githug' (>= 0), here is why:Unable to download data from https://rubygems.org/ - Errno::ECONNRESET: Connection reset by peer - SSL_connect (https://rubygems.org/latest_specs.4.8.gz)

原因：可能是无法连接server的问题

解决方法：使用taobao提供的server

```
gem sources --remove https://rubygems.org/

gem sources -a https://ruby.taobao.org/

gem sources -l

```
请确保只有 ruby.taobao.org
