---
layout: post
categories: java
title: 'spring boot 发送邮件步骤'
excerpt: 本文简述了spring boot 发送邮件的步骤
---
spring boot 发送邮件步骤
====
>以下内容基于spring boot默认配置

### step 1

maven导入需要用到的包.

```xml
<!-- javamail -->
<dependency>
     <groupId>org.springframework.boot</groupId>
     <artifactId>spring-boot-starter-mail</artifactId>
</dependency>

<!-- 模板引擎 -->
<dependency>
     <groupId>org.springframework.boot</groupId>
     <artifactId>spring-boot-starter-thymeleaf</artifactId>
</dependency>
```

### step 2

注册Bean

```java
@Bean
public JavaMailSender mailSender() {
   JavaMailSenderImpl mailSender = new JavaMailSenderImpl();
   mailSender.setDefaultEncoding("utf-8");
   mailSender.setHost("smtp.qq.com");
   mailSender.setUsername("619588019@qq.com");
   mailSender.setPassword("********");//这里要写真实密码
   mailSender.setProtocol("smtps");
   Properties props = new Properties();
   props.put("mail.smtps.auth", "true");
   props.put("mail.smtp.ssl.enable", "true");
   props.put("mail.transport.protocol", "smtps");

   mailSender.setJavaMailProperties(props);
   return mailSender;
}
```

### step 3

创建email模板文件，
在resorces/templates下创建emailTemplate.html

```html
<!DOCTYPE html>
<html lang="zh" xmlns:th="http://www.thymeleaf.org">
<head>
    <meta charset="UTF-8"/>
    <title>Title</title>
</head>
<body>
您好,这是验证邮件,请点击下面的链接完成验证,<br/>
<a href="#" th:href="@{ http://www.smiple.com/yanzhen/{id}(id=${id}) }">激活账号</a>
</body>
</html>
```

### step 4

假设我们要在controller里面某个action中发送邮件

```java
@Autowired
private JavaMailSender mailSender;

@Autowired
private TemplateEngine templateEngine;

@RequestMapping(value="/sendEmail")
@ResponseBody
public String test(){

   //创建邮件正文
   Context context = new Context();
   context.setVariable("id", "1");
   String emailContent = templateEngine.process("emailTemplate", context);
   
   //创建一个线程发送邮件
   new Thread(() -> {
       MimeMessage mimeMessage = mailSender.createMimeMessage();
       MimeMessageHelper mimeMessageHelper = new MimeMessageHelper(mimeMessage, "utf-8");
       
       try {
       
           //此处from必须与步骤2的username一致
           mimeMessageHelper.setFrom("某某网 <619588019@qq.com>");
           mimeMessageHelper.setTo("test@126.com");
           mimeMessageHelper.setText(emailContent, true);
           mailSender.send(mimeMessage);
       } catch (Exception e) {
           e.printStackTrace();
       }
   }).start();
   
   return "邮件已发送";
}
```





