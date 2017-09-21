---
layout: post
title: 'liquibase，一个数据库持续维护的工具'
excerpt: liquibase(读音：李逵贝斯)是一个可以对数据库持续维护的工具，可以用命令行、ant、maven、Spring、servlet listener和CDI容器执行维护的操作，本文仅简单记录maven使用liquibase的过程。
categories: database
---
# liquibase，一个数据库持续维护的工具

[官网](http://www.liquibase.org/index.html)

liquibase(读音：李逵贝斯)是一个可以对数据库持续维护的工具，可以用命令行、ant、maven、Spring、servlet listener和CDI容器执行维护的操作，本文仅简单记录maven使用liquibase的过程。

### Step 1
在项目目录src/main/resources下创建db.properties,内容如下

```properties
username=root
password=root
url=jdbc:mysql://localhost:3306/dbname
driver=com.mysql.jdbc.Driver
```
请根据实际情况修改配置文件内容

### Step 2
还是在项目目录src/main/resources下，创建migration.xml，内容如下

```xml
<?xml version="1.0" encoding="UTF-8"?>

<databaseChangeLog
        xmlns="http://www.liquibase.org/xml/ns/dbchangelog"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:ext="http://www.liquibase.org/xml/ns/dbchangelog-ext"
        xsi:schemaLocation="http://www.liquibase.org/xml/ns/dbchangelog http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-3.0.xsd
        http://www.liquibase.org/xml/ns/dbchangelog-ext http://www.liquibase.org/xml/ns/dbchangelog/dbchangelog-ext.xsd">
        <!-- 可以有多个changeSet,每个changeSet代表了一个数据库版本 -->
        <changeSet id="1" author="jevi">
            <!-- changeSet里面则描述对数据库做了哪些操作 -->
            <createTable tableName="user">
                <column name="id" type="varchar(255)">
                    <constraints primaryKey="true" nullable="false"/>
                </column>
                <column name="password" type="varchar(255)">
                    <constraints nullable="true"/>
                </column>
                <column name="username" type="varchar(255)">
                    <constraints nullable="false"/>
                </column>
            </createTable>
            <!-- rollback用于回滚，可以不写 -->
            <rollback>
                <dropTable tableName="user"/>
            </rollback>
        </changeSet>
        <changeSet id="2" author="jeve">
            <createTable tableName="user_authorities">
                <column name="user_id" type="varchar(255)">
                    <constraints foreignKeyName="fk_user_authorities_user_id" referencedTableName="user"
                                 referencedColumnNames="id"/>
                </column>
                <column name="AUTHORITIES" type="varchar(255)"/>
            </createTable>
            <!-- 复合主键 -->
            <addPrimaryKey tableName="user_authorities" columnNames="user_id,AUTHORITIES"/>
            <rollback>
                <droptable tableName="user_authorities"/>
            </rollback>
        </changeSet>
</databaseChangeLog>
```


### Step 3
pom.xml新增插件

```xml
<plugin>
 <groupId>org.liquibase</groupId>
 <artifactId>liquibase-maven-plugin</artifactId>
 <version>3.0.5</version>
 <configuration>
     <changeLogFile>src/main/resources/migration.xml</changeLogFile>
     <propertyFile>src/main/resources/db.properties</propertyFile>
 </configuration>
</plugin>
```

### Step 4

##### 更新数据库命令

```
mvn liquibase:update
```

##### 回滚数据库命令

```
mvn liquibase:rollback -Dliquibase.rollbackCount=1
```

