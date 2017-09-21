---
layout: post
categories: javascript
excerpt: 这是一篇读书笔记，记录阅读《编写可维护的Javascript》时学习到的知识。
title: "《编写可维护的Javascript》笔记"
---

## 1、编程风格
为了使代码易于维护，团队中所有人都有必要按照一个规范去写代码。
具体有下面规范：

- 缩进层级，推荐4个空格。
- 行尾保留分号。
- 行最长长度，推荐80个字符。
- 换行，符号永远在后面。

```javascript
//判断条件第二行前面有8个空格（两个缩进）
if(isLast === true && location.hostname === 'www.example.com' &&
        location.protocol === "http"){
    doSomething();
}

//换行后等号后面对齐
var sum = value1 + value2 + value3 + value4 + value5 +
          value6;
```
- 空行

> 在方法之间
> 在方法中局部变量和第一条语句之间
> 在多行和单行注释之前
> 在方法内的逻辑片段之间插入空行

- 变量命名规范，推荐驼峰命名法，是一个名词。
- 方法命名规范，推荐驼峰命名法，动词打头。

> 动词 | 含义
> -------|-------
> can | 函数返回一个boolean
> has | 函数返回一个boolean
> is  | 函数返回一个boolean
> get | 函数返回一个非boolean
> set | 函数用来保存一个值

- 常量，全大写，用_标识分割单词，例如MAX_COUNT
- 花括号风格，指花括号起始与结束应该如何摆放，推荐下面写法。

```javascript
if(true){
   //do something
}
```
- 类，首字母大写，例如Person
- string，推荐用双引号，多行文本不推荐下面的写法

```javascript
var longString = "Here's the store, of a man \
named Brady.";

//请使用下面的代码代替上面写法
var longString = "here's the store, of a man" +
                 "named Brady";
```

- 数字

```javascript
//整数
var count = 10;

//小数
var price = 10.0;
var price = 10.00;

//不推荐的小数写法，没有小数部分
var price = 10.;

//不推荐的小数写法，没有整数部分
var price = .8;

//不推荐的写法，八进制已经被ECMA弃用了，现在还能用是为了向旧代码兼容
var num = 010;

//十六进制写法
var num = 0xA2;

//科学计数法
var num = 1e23;
```

- null

> 在下列场景中使用
> 
> - 用来初始化一个可能是object的变量
> - 用来和一个已经初始化的变量比较，这个变量可以是也可以不是一个对象
> - 当函数的参数期望是对象时，用作参数传入
> - 当函数的返回值期望是对象时，用作返回值传出
> 
> 在下列场景中不使用
> 
> - 不要使用null来检测是否传入了某个参数
> - 不要用null来检测一个未初始化的变量

- undefined, 尽量避免接触，如果一个变量可能被赋值object，请初始化为null

```javascript
var person = null;
console.log(person === null);  //true
```

- object

```javascript
var book = {
    title: "三国演义",
    author: "罗贯中"
}
```

- 数组

```javascript
var colors = ["red", "green", "blud"];
```

## 2、注释
### 单行注释
单行注释应该应用于解释后面的一段或者一行代码

- 之前空一行
- 与下面的代码保持一致的缩进
- 只能有一行，如果注释有多行，请使用多行注释
- 如果注释的是代码，可以有多行

```javascript
if (condition) {
    
    // 这是注释，上面空一行，与下面代码缩进一致
    doSomething();
}

// 用于代码的注释
// if (condition) {
//     doSomething();
// }
```

### 多行注释
推荐下面的写法

```javascript
if (ticket) {
    
    /*
     * 如果买到车票了
     * 那么我就回家
     * 星号后面有一个空格
     * 注释上面有空行
     */
    goHome();
}
```

### 使用注释

- 难于理解的代码
- 可能被认为出错的代码
- 浏览器特性hack

### 注释文档
可以通过注释生成文档

- YUIDoc
- JSDoc Toolkit

## 3、语句和表达式
推荐下面写法

```javascript

//括号前面与后面有空格，花括号不要省略，并且不在一行
if (condition) {
    doSomething();
} else {
    doSomethingElse();
}

while (condition) {
    doSomething();
}

do {
    doSomething();
} while (condition);

for (var i = 0; i < 10; i++) {
    console.log(i);
}

switch (condition) {
    case "first":
    case "second":
        break;
    case "third":
        doAnotherThing();
        break;
    default:
        doSomething();
}

```

with语句禁止使用！

## 4、变量、函数和运算符


