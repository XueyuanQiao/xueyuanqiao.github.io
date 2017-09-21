---
layout: post
title: "Spring-boot不同环境使用不同配置"
categories: java
excerpt: 在开发中，开发环境与产品环境可能略有不同，使用spring-boot如何区别不同的环境变量呢？
---
# Spring-boot不同环境使用不同配置

spring-boot会在classpath中查找名为`application-{profile}.properties`的配置文件，`application-default.properties`始终加载，如果使用了profile，那么相同配置将会覆盖`application-default.properties`中的值，通过指定`spring.profiles.active`属性可以让spring加载指定的配置文件。

假设我们有一个项目proj，将会部署到tomcat/webapps下，context path是`proj`，那么部署完以后，webapps下将会有个proj目录。

## 步骤一
在resources目录中新建`application-defaut.properties` `application-dev.properties` `application-prod.properties`

## 步骤二
在tomcat/conf/Catalina/local（没有则创建一个）目录下创建`ROOT.xml`，写入一下内容

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Context >
    <!-- 这里可以修改value为prod，使spring使用application-prod.properties配置，这里使用的是application-dev.properties -->
    <Environment name="spring.profiles.active" value="dev"
         type="java.lang.String" override="false"/>
</Context>

```

