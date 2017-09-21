---
layout: post
title: "JSON格式校验"
categories: json
excerpt: json格式校验
---

```
{
    "$schema":"http://json-schema.org/draft-04/schema",
    "type":"object",
    "properties":{
        "a":{
            "type":"array",
            "items":{
                "type":"object",
                "properties":{
                    "b":{
                        "type":"integer"
                    }
                }
            }
        }
    },
    "required":["a"]
}
```

以上规则可以校验以下的json数据

```
{
    "a":[
        {
            "b":9
        }
    ]
}
```