---
title: git多账号使用问题
date: 2016-04-12 10:48:46
tags: git
categories: Git
---
本地配置有两个ssh key时，一个用作公司的git服务器，另一个则是个人的github账号，如何解决冲突：

cd 到.ssh目录
生成个人的ssh key
```
ssh-keygen -t rsa -C "email-address"
将rsa文件的名称改为 github
公司的账号生成的rsa还是默认的文件
```
接下来就是配置我们的config文件
```
vim config
host github
user git
hostname github.com
port 22
identityfile ~/.ssh/github

测试命令
ssh -T github
```
