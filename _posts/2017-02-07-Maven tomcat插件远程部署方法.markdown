---
layout: post
title: '如何通过maven往tomcat部署war包'
categories: maven
excerpt: 一般的我们往tomcat上部署war包都是登录tomcat管理页面，在管理页面上传war包，然后tomcat完成部署。现在我们只需要一条命令就能解决这个问题！
---
# Maven tomcat插件远程部署方法

tomcat的manager提供了可以部署项目的接口，可以使用maven的tomcat插件通过一个命令方便的进行部署、重新部署等操作。

## 修改~/.m2/setting.xml

新增一个```<server>```

```
<server>
  <id>tomcat8</id>
  <username>tomcat</username>
  <password>tomcat</password>
</server>
```

## 加入tomcat插件

```xml
<!-- 加到pom.xml中 -->
<build>
    <plugins>
        <plugin>
            <groupId>org.apache.tomcat.maven</groupId>
            <artifactId>tomcat7-maven-plugin</artifactId>
            <version>2.2</version>
            <configuration>
                <url>http://localhost:8080/manager/text</url>
                <server>tomcat8</server>
                <!-- 这里是项目的context path -->
                <path>/</path>
            </configuration>
        </plugin>
    </plugins>
</build>
```

## 使用方法

先启动tomcat,并确定manager页面可用并且可成功登陆


## 部署到tomcat

```
mvn tomcat7:deploy
mvn tomcat7:deploy-only
```

## 重新部署

```
mvn tomcat7:redeploy
mvn tomcat7:redeploy-only
```

## 取消部署

```
mvn tomcat7:undeploy
```

