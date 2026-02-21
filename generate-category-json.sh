#!/bin/bash

# 生成category.json文件的脚本
# 使用基本的shell命令解析文章文件

echo "开始生成category.json文件..."

# 初始化JSON结构
json="{\"posts\": ["

# 遍历_posts目录下的所有markdown文件
first=true
for file in _posts/*.markdown; do
  if [ -f "$file" ]; then
    # 提取文件名
    filename=$(basename "$file")
    
    # 检查文件名格式，跳过不符合格式的文件
    if [[ "$filename" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}-.*\.markdown$ ]]; then
      # 提取文件名中的日期和标题
      date_part=${filename:0:10}
      
      # 读取文件内容
      content=$(cat "$file")
      
      # 提取标题并清理空格（更严格的空格清理）
      title=$(echo "$content" | grep "^title:" | head -n 1 | awk -F': ' '{print $2}' | xargs)
      
      # 提取摘要并清理空格（更严格的空格清理）
      excerpt=$(echo "$content" | grep "^excerpt:" | head -n 1 | awk -F': ' '{print $2}' | xargs)
      
      # 提取分类并清理空格（更严格的空格清理）
      categories_line=$(echo "$content" | grep "^categories:" | head -n 1)
      
      # 确保标题和分类不为空
      if [ -n "$title" ] && [ -n "$categories_line" ]; then
        # 解析分类（支持多种格式：空格分隔、YAML数组等）
        categories=$(echo "$categories_line" | awk -F': ' '{print $2}' | xargs)
        
        # 处理分类，支持多个标签
        IFS=' ' read -ra category_array <<< "$categories"
        
        # 生成分类数组的JSON字符串
        categories_json=""
        first_category=true
        for cat in "${category_array[@]}"; do
          if [ -n "$cat" ]; then
            # 清理分类名称并转换为小写
            clean_cat=$(echo "$cat" | tr '[:upper:]' '[:lower:]' | xargs | sed 's/"//g' | sed 's/\[//g' | sed 's/\]//g' | sed 's/,//g')
            if [ -n "$clean_cat" ]; then
              if [ "$first_category" = true ]; then
                first_category=false
              else
                categories_json="$categories_json,"
              fi
              categories_json="$categories_json\"$clean_cat\""
            fi
          fi
        done
        
        # 如果没有有效分类，跳过
        if [ -z "$categories_json" ]; then
          continue
        fi
        
        # 使用第一个分类作为URL路径的一部分
        primary_category=$(echo "$categories_json" | cut -d'"' -f2)
        
        # 生成URL路径
        # 从文件名提取标题部分
        url_title=$(echo "$filename" | sed 's/^[0-9\-]*//;s/\.markdown$//')
        
        # 格式化日期为 /year/month/day/ 格式
        year=${date_part:0:4}
        month=${date_part:5:2}
        day=${date_part:8:2}
        
        # 生成URL（使用用户要求的格式：/分类/年/月/日/标题.html）
        url="/$primary_category/$year/$month/$day/$url_title.html"
        
        # 添加到JSON中
        if [ "$first" = true ]; then
          first=false
        else
          json="$json,"
        fi
        
        # 清理JSON中的特殊字符
        clean_title=$(echo "$title" | sed 's/"/\\"/g')
        clean_excerpt=$(echo "$excerpt" | sed 's/"/\\"/g')
        
        # 生成紧凑的JSON格式
        json="$json{\"title\":\"$clean_title\",\"url\":\"$url\",\"date\":\"$date_part\",\"excerpt\":\"$clean_excerpt\",\"categories\":[$categories_json]}"
      fi
    fi
  fi
done

# 完成JSON结构
json="$json]}"

# 保存到category.json文件
if command -v python3 &> /dev/null; then
  # 使用Python格式化JSON，确保中文显示为原文
  echo "$json" | python3 -c "import json,sys; print(json.dumps(json.load(sys.stdin), ensure_ascii=False, indent=2))" > category/category.json
  echo "已使用Python格式化JSON，中文显示为原文"
else
  # 如果没有Python，直接保存
  echo "$json" > category/category.json
  echo "已直接保存JSON（未格式化）"
fi

echo "category.json文件生成完成！"
echo "文件位置: category/category.json"

# 显示生成的文件内容（可选）
echo "\n生成的文件内容:"
cat category/category.json
