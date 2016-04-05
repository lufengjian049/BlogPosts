---
title: git 常用命令
date: 2016-04-05 11:23:07
tags:
---
### rm
A file has been removed from the working tree, however the file was not removed from the repository.  Find out what this file was and remove it.    

	git rm deleteme.rb

### rm_cached(has been added to stage)
A file has accidentally been added to your staging area, find out which file and remove it from the staging area.   
 *NOTE* :Do not remove the file from the file system, only from git.     

	git rm --cached deleteme.rb

### stash相关
You've made some changes and want to work on them later. You should save them, but don't commit them.  

	git stash (它就把当前未提交的改动「复制」到另一个地方暂存起来)
	git stash pop (恢复)

### rename
We have a file called `oldfile.txt`. We want to rename it to `newfile.txt` and stage this change.  

	git mv(take a look)
	git mv oldfile.txt newfile.txt

### restructure(重建)
You added some files to your repository, but now realize that your project needs to be restructured.  Make a new folder named `src` and using Git move all of the .html files into this folder.

	mkdir src
	git mv *.html src/

### tag
We have a git repo and we want to tag the current commit with `new_tag`.

	git tag new_tag

There are tags in the repository that aren't pushed into remote repository. Push them now.

	git push --tags

### commit_amend
The `README` file has been committed, but it looks like the file `forgotten_file.rb` was missing from the commit.  Add the file and amend your previous commit to include it.  

有时候提交之后发现漏掉了某些文件，怎么办？
往往很多人就会选择再单独提交一次，这样做其实是不合理的，之前的 commit 就不完整了，有可能上了 CI 就会挂掉。
好的做法是 amend

	git add forgotten_file.rb
	git commit --amend
