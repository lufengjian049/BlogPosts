---
title: js干货代码
date: 2016-04-20 13:38:49
tags: js
categories: javascript
---
该篇文章收罗强大的干货代码

###  为html层添加不同颜色的高亮边框
```
[].forEach.call($$("*"),function(a){

  a.style.outline="1px solid #"+(~~(Math.random()*(1<<24))).toString(16)

})
```
* Chrome浏览器中特有的函数$$, $$ = document.querySelectorAll  得到的是一个类arguments的类数组，nodeLists
* Array.prototype.forEach.call = [].forEach.call 但是后者节省
* 为元素添加边框，而不影响元素的布局。
    ```
        a.style.outline="1px solid #ccc";
    ```
* 颜色是一个16进制的数，可以用toString(16)转换。
* 颜色数值的范围应该在 0 ~ ffffff 之间
    ```
        parseInt("ffffff",16) = 16777215 = 2 ^ 24 - 1
        1 << 24 = 2 ^ 24
    ```
* ~进行取反，~~则进行取整数，去除小数部分
    ```
        ~~ a = parseInt(a,10) = 0 | a
    ```
