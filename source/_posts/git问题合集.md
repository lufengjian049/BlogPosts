---
title: git问题合集
date: 2016-04-08 16:32:20
tags: git
categories: Git
---

### 与远程分支建立关联关系(重新拉取新分支)
    从远程分支 checkout 出来的本地分支，称为跟踪分支；在跟踪分支上可以直接git pull和git push；
    在克隆仓库时，Git 通常会自动创建一个名为 master 的分支来跟踪 origin/master；
    如果要切换其他分支，可以采用的方法：
<!-- more -->
```
    git branch -r/-a 查看分支 远程/所有
    git checkout -b [分支名] [远程]/[分支名]
    或者
    git checkout --track [远程]/[分支名]
```

### git fetch 与 git pull
    git fetch 与 git merge = git pull
    git fetch更安全，可控
