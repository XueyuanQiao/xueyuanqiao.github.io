---
layout: post
title: Selenium 4 元素定位与等待策略
date: 2017-09-23 13:50:13 +0800
excerpt: 从稳定定位器、CSS 与 XPath 的边界、显式等待、StaleElementReferenceException 和 JavaScript 兜底等方面，整理现代 Selenium UI 自动化的基本写法。
categories: 质量工程
---

UI 自动化里，“元素定位不到”经常不是定位器语法问题，而是页面状态、浏览上下文或测试设计问题。现代 Selenium 代码应该把定位与等待放在一起考虑。

## Selenium 4 的统一写法

{% highlight python %}
from selenium.webdriver.common.by import By

username = driver.find_element(By.ID, "username")
submit = driver.find_element(By.CSS_SELECTOR, "button[type='submit']")
{% endhighlight %}

`find_element_by_id`、`find_element_by_xpath` 等旧方法已经废弃。使用 `By` 可以让定位器统一进入显式等待、Page Object 和公共组件。

## 定位器优先级

一个实用顺序是：

1. 产品和测试共同约定的稳定属性，例如 `data-testid`；
2. 唯一且语义稳定的 `id` 或 `name`；
3. 简洁的 CSS 选择器；
4. 文本关系、向上查找等 CSS 难以表达的场景再用 XPath；
5. 索引和绝对路径只用于临时诊断。

例如：

{% highlight html %}
<button data-testid="save-order" type="submit">保存</button>
{% endhighlight %}

{% highlight python %}
SAVE_BUTTON = (By.CSS_SELECTOR, "[data-testid='save-order']")
{% endhighlight %}

测试专用属性不是“污染页面”，而是前端与测试之间的一份稳定契约。相比依赖样式类、DOM 层级或易变文案，它能显著减少无意义维护。

## CSS 与 XPath 怎么选

### CSS 适合常规属性和层级

{% highlight python %}
(By.CSS_SELECTOR, "input[name='email']")
(By.CSS_SELECTOR, "[data-testid='order-row'][data-status='pending']")
(By.CSS_SELECTOR, "form#checkout > button[type='submit']")
{% endhighlight %}

### XPath 适合文本与关系查找

{% highlight python %}
(By.XPATH, "//button[normalize-space()='保存']")
(By.XPATH, "//label[normalize-space()='邮箱']/following::input[1]")
(By.XPATH, "//section[@aria-label='订单']//tr[td='A-1024']")
{% endhighlight %}

浏览器 WebDriver 常用的是 XPath 1.0。旧教程里常见的 `ends-with()` 属于 XPath 2.0，不能假设可用。可以用 CSS 的属性后缀选择器：

{% highlight python %}
(By.CSS_SELECTOR, "[id$='-submit']")
{% endhighlight %}

不要再用“CSS 一定比 XPath 快很多”作为选型理由。现代浏览器里，定位器是否稳定、是否易读，通常比微小的查询耗时差异重要。

## 定位之后还要等待正确状态

元素进入 DOM、可见、可点击是不同状态。与其固定等待几秒，不如等待业务需要的条件：

{% highlight python %}
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.support.ui import WebDriverWait

wait = WebDriverWait(driver, 10)

save = wait.until(
    EC.element_to_be_clickable(
        (By.CSS_SELECTOR, "[data-testid='save-order']")
    )
)
save.click()

wait.until(
    EC.visibility_of_element_located(
        (By.CSS_SELECTOR, "[role='status']")
    )
)
{% endhighlight %}

不要混用很长的隐式等待和显式等待。两种超时叠加后，失败耗时会变得难以预测。团队最好统一一种策略，UI 测试通常以显式等待为主。

## frame、新窗口和 Shadow DOM

定位器只能在当前浏览上下文工作：

- 元素在 `iframe` 中：先 `driver.switch_to.frame(...)`；
- 元素在新窗口：切换 window handle；
- 元素在 Shadow DOM 中：先取得 shadow root；
- 单页应用重新渲染：旧元素引用可能失效。

因此调试 `NoSuchElementException` 时，先确认上下文，再改 XPath。把一个错误的上下文配上更复杂的定位器，只会让脚本更脆弱。

## 正确处理 stale element

React、Vue 等前端重新渲染后，之前保存的 `WebElement` 可能已经不属于当前 DOM，操作时会抛出 `StaleElementReferenceException`。

不要长期缓存易变化的元素对象。保存定位器，在操作前重新查找：

{% highlight python %}
ORDER_TOTAL = (By.CSS_SELECTOR, "[data-testid='order-total']")

wait.until(EC.text_to_be_present_in_element(ORDER_TOTAL, "¥99.00"))
total = driver.find_element(*ORDER_TOTAL)
{% endhighlight %}

如果业务动作触发整块区域刷新，可以显式等待旧元素 stale，再等待新元素出现。

## JavaScript 不是默认点击方式

旧教程经常在 WebDriver 点不动时直接执行：

{% highlight python %}
driver.execute_script("arguments[0].click()", element)
{% endhighlight %}

它会绕过一部分真实用户交互检查。元素被遮挡、不可见或尚未可用时，JavaScript 点击可能让测试“通过”，却掩盖真实页面问题。

更合理的排查顺序是：

1. 等待元素可点击；
2. 检查遮罩、动画和滚动位置；
3. 确认 frame/window 上下文；
4. 检查元素是否 stale；
5. 只有在产品行为明确需要、且普通用户交互并不适用时才使用 JavaScript。

同理，不要假设页面已经加载 jQuery。现代站点可能根本没有它，测试脚本也不应依赖被测页面的内部前端库。

## Page Object 只封装稳定语义

{% highlight python %}
class LoginPage:
    USERNAME = (By.ID, "username")
    PASSWORD = (By.ID, "password")
    SUBMIT = (By.CSS_SELECTOR, "button[type='submit']")

    def __init__(self, driver):
        self.driver = driver
        self.wait = WebDriverWait(driver, 10)

    def login(self, username: str, password: str) -> None:
        self.wait.until(
            EC.visibility_of_element_located(self.USERNAME)
        ).send_keys(username)
        self.driver.find_element(*self.PASSWORD).send_keys(password)
        self.wait.until(
            EC.element_to_be_clickable(self.SUBMIT)
        ).click()
{% endhighlight %}

Page Object 的目标是表达页面行为并集中管理定位器，不是把每一次 `click` 都包成一层没有语义的方法。

## 一份定位器检查表

- 是否唯一，并且在目标页面状态下可重复定位？
- 是否依赖自动生成 class、深层 DOM 或易变文案？
- 是否需要等待可见、可点击或某段文本？
- 是否跨越 iframe、窗口或 Shadow DOM？
- 页面刷新后是否会持有 stale 元素？
- 失败时是否保留截图、页面源码、浏览器日志和当前 URL？

稳定的 UI 自动化通常不是写出“更强的 XPath”，而是让应用提供稳定契约，让测试等待正确状态，并在失败时留下足够证据。

## 参考资料

- [Selenium 官方文档：Locator strategies](https://www.selenium.dev/documentation/webdriver/elements/locators/)
- [Selenium 官方文档：Finding web elements](https://www.selenium.dev/documentation/webdriver/elements/finders/)
- [Selenium 官方文档：Waiting strategies](https://www.selenium.dev/documentation/webdriver/waits/)
- [Selenium 官方文档：Web elements](https://www.selenium.dev/documentation/webdriver/elements/)
