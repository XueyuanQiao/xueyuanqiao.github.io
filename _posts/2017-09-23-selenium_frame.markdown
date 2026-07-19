---
layout: post
title: Selenium 4 中定位 iframe 的正确方式
date: 2017-09-23 15:30:13 +0800
excerpt: 解释浏览上下文、嵌套 iframe、显式等待和 Selenium 4 的 frame 切换 API，并给出定位不到元素时的排查顺序。
categories: 质量工程
---

页面上的元素明明能在开发者工具里看到，Selenium 却报 `NoSuchElementException`，常见原因之一是元素位于 `iframe` 中。

`iframe` 会创建新的浏览上下文。WebDriver 默认只在当前上下文查找元素；进入 frame 后，主文档里的元素暂时也不可见，直到切回去。

## Selenium 4 的三个核心方法

{% highlight python %}
driver.switch_to.frame(reference)
driver.switch_to.parent_frame()
driver.switch_to.default_content()
{% endhighlight %}

`reference` 可以是：

- frame 的索引；
- `id` 或 `name`；
- 已定位到的 frame `WebElement`。

索引容易受页面插入、排序影响，通常优先使用稳定的 `id`、`name` 或元素定位器。

## 等 frame 可用后再切换

动态页面中，frame 标签出现不代表内部文档已经可用。Selenium 的显式等待可以等待并完成切换：

{% highlight python %}
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

wait = WebDriverWait(driver, 10)
wait.until(
    EC.frame_to_be_available_and_switch_to_it(
        (By.CSS_SELECTOR, "iframe[data-testid='payment-frame']")
    )
)

submit = wait.until(
    EC.element_to_be_clickable((By.CSS_SELECTOR, "button[type='submit']"))
)
submit.click()
{% endhighlight %}

处理结束后切回主文档：

{% highlight python %}
driver.switch_to.default_content()
{% endhighlight %}

如果后续步骤无论成功或失败都必须回到主文档，可以使用 `try/finally`：

{% highlight python %}
wait.until(
    EC.frame_to_be_available_and_switch_to_it(
        (By.ID, "payment-frame")
    )
)
try:
    wait.until(
        EC.element_to_be_clickable((By.ID, "confirm"))
    ).click()
finally:
    driver.switch_to.default_content()
{% endhighlight %}

## 嵌套 frame 要逐层进入

假设目标元素位于 `outer` 中的 `inner`：

{% highlight python %}
wait.until(
    EC.frame_to_be_available_and_switch_to_it((By.ID, "outer"))
)
wait.until(
    EC.frame_to_be_available_and_switch_to_it((By.ID, "inner"))
)

message = wait.until(
    EC.visibility_of_element_located((By.CSS_SELECTOR, ".message"))
)
{% endhighlight %}

从 `inner` 回到 `outer`：

{% highlight python %}
driver.switch_to.parent_frame()
{% endhighlight %}

直接回到最外层文档：

{% highlight python %}
driver.switch_to.default_content()
{% endhighlight %}

不要假设可以从主文档一次跳进任意深度的 frame。WebDriver 必须沿父子上下文逐层切换。

## 一个完整示例

{% highlight python %}
from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

driver = webdriver.Chrome()
wait = WebDriverWait(driver, 10)

try:
    driver.get("https://example.test/checkout")

    wait.until(
        EC.frame_to_be_available_and_switch_to_it(
            (By.CSS_SELECTOR, "iframe[title='Payment']")
        )
    )
    wait.until(
        EC.visibility_of_element_located((By.NAME, "card-number"))
    ).send_keys("4111111111111111")
finally:
    driver.switch_to.default_content()
    driver.quit()
{% endhighlight %}

示例卡号仅用于测试环境。真实支付自动化应使用服务方提供的 sandbox 和测试凭据。

## 定位不到元素时按什么顺序排查

1. **当前上下文是否正确**：打印 `driver.current_url`，检查自己是否已经进入或仍停留在某个 frame。
2. **frame 是否动态加载**：使用 `frame_to_be_available_and_switch_to_it`，不要用固定 `sleep`。
3. **是否嵌套**：从目标元素向上检查所有 frame 边界。
4. **定位器是否稳定**：优先测试专用属性、`id` 或语义清晰的 CSS。
5. **是否其实是新窗口**：frame 切换与 window handle 切换是两套 API。
6. **是否位于 Shadow DOM**：Shadow Root 也不是 iframe，需要使用 Selenium 的 shadow root API。
7. **页面是否已重新渲染**：旧 frame 元素可能变成 stale，需要重新定位再切换。

## 旧 API 迁移

Selenium 4 代码应使用：

{% highlight python %}
driver.find_element(By.CSS_SELECTOR, "iframe")
driver.switch_to.frame(frame_element)
driver.switch_to.default_content()
{% endhighlight %}

`find_element_by_*`、`switch_to_frame` 和 `switch_to_default_content` 等旧写法已经淘汰，不应继续出现在新代码或教程中。

## 参考资料

- [Selenium 官方文档：Working with frames](https://www.selenium.dev/documentation/webdriver/interactions/frames/)
- [Selenium 官方文档：Waiting strategies](https://www.selenium.dev/documentation/webdriver/waits/)
- [Selenium Python API：Expected Conditions](https://www.selenium.dev/selenium/docs/api/py/selenium_webdriver_support/selenium.webdriver.support.expected_conditions.html)
