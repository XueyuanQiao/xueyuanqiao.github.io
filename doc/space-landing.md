# 360° 宇宙首页维护文档

本文记录站点根路径宇宙首页的设计边界、资源规格、加载流程、交互实现和验证方法。修改首页前先阅读本文，避免影响已经稳定的博客页面。

## 1. 路由与稳定边界

| 路径 | 源文件 | 职责 |
| --- | --- | --- |
| `/` | `particle-cat.html` | 360° 宇宙首页，仅负责沉浸式展示和引导进入博客 |
| `/blog/` | `index.html` | 原有 Aurora 博客首页 |
| 文章、分类、关于页 | 原有 Jekyll 模板与页面 | 不依赖宇宙首页脚本 |

宇宙首页使用独立的 HTML、CSS 和 JavaScript，不改动 `_layouts/`、`assets/css/aurora.css` 或 `assets/js/site.js`。这是保护现有博客结构的核心约束。

博客布局中的“首页”导航必须显式指向 `/blog/`，不能使用根路径 `/`。头像入口是有意保留的宇宙页返回入口，继续指向根路径 `/`。维护时不要混淆这两个入口的职责。

`particle-cat.html`、`particle-cat.css` 和 `particle-cat.js` 是早期方案留下的文件名。当前页面已经不包含猫主题，但为了降低路由和部署风险暂不重命名；维护时应按“宇宙首页文件”理解。

## 2. 文件清单

| 文件 | 作用 |
| --- | --- |
| `particle-cat.html` | 页面结构、全景资源地址、博客入口、重置入口和降级内容 |
| `assets/css/particle-cat.css` | 宇宙首页全部视觉、响应式、火箭与回航动画 |
| `assets/js/particle-cat.js` | WebGL 全景、Canvas 粒子、360° 交互、渐进纹理升级和入口行为 |
| `images/space-panorama-360-preview.webp` | 加载阶段的模糊背景和首个 WebGL 交互纹理 |
| `images/space-panorama-360-medium.webp` | 历史中清资源，当前加载链路不再使用 |
| `images/space-panorama-360.webp` | 默认且唯一的最终 WebGL 高清纹理 |
| `images/space-panorama-360-mobile.webp` | 仅在 GPU 最大纹理尺寸不足 6000 时使用的兼容降级纹理 |

全景原始影像来自 [ESO 360° 全天星空全景](https://www.eso.org/public/images/eso0932a/)，页面左下角保留署名。

## 3. 页面分层

页面由下到上分为：

1. `.space-backdrop`：CSS 预览背景、WebGL 全景画布和暗角遮罩。
2. `#cat-particle-stage`：Canvas 2D 星尘、星轨和鼠标扰动粒子。
3. `.particle-ambient` / `.particle-vignette`：轻微噪点、辉光和边缘压暗。
4. `.space-drag-hint` / `.space-credit`：拖曳提示和影像署名。
5. `.particle-entry`：博客入口与“重置视角”。
6. `.particle-loading` / `.particle-fallback`：三体深空信号载入场景和 WebGL/图片失败降级。
7. `.launch-transition`：点击博客入口后显示的全屏火箭升空、星轨加速与暗色引力透镜转场，层级固定为 `z-index: 30`。

不要把交互按钮放到粒子画布下方。`.particle-entry` 本身使用 `pointer-events: none`，只有入口链接和按钮恢复为 `pointer-events: auto`，这样大部分页面区域仍可拖动。

## 4. 渐进交互与原图后台升级

当前采用“可交互 Preview + 原始高清纹理”策略：

| 阶段 | 分辨率 | 约大小 | 用途 |
| --- | ---: | ---: | --- |
| Preview | 768 × 384 | 5.6 KB | CSS 首屏背景和加载阶段的 WebGL 交互纹理 |
| Original Final | 6000 × 3000 | 6.8 MB | 默认最终画质，也是正常设备唯一上传到 WebGL 的纹理 |
| Compatibility Final | 4096 × 2048 | 2.1 MB | 仅供 `MAX_TEXTURE_SIZE < 6000` 的设备兼容使用 |

加载顺序：

1. 浏览器解析 CSS 时立即显示 Preview 背景，并通过模糊遮罩、扫描光和“三体信号”接收动画明确表达“正在加载”。加载态不使用玻璃卡片，避免和底部博客入口混淆。
2. `<head>` 同时预载 5.6 KB Preview 和 6000 × 3000 原始图；JavaScript 立即发起原图请求并复用 Preview，二者互不串行等待。
3. Preview 完成解码并上传为 WebGL 纹理后添加 `.panorama-preview-ready` 和 `.particle-ready`，立刻开放拖曳、惯性、缩放、方向键和粒子渲染。
4. 原始图继续后台下载；完成解码并上传后添加 `.panorama-high-ready`，三体加载状态和模糊遮罩淡出。
5. 只有 GPU 最大纹理尺寸不足 6000 时才选择 4096 × 2048 兼容纹理，避免上传失败导致页面不可用。

纹理升级只替换当前 WebGL Texture，不重建 program，也不修改 `yaw`、`pitch` 或 `fov`，所以用户在原图下载期间可以持续拖动，画质升级时视角不会回到初始位置。原图加载失败时保留可交互的模糊 Preview，并结束加载动画。

最终高清资源没有降质。除非明确接受新的画质基线，不要为了减小体积再次压缩 `space-panorama-360.webp` 或 `space-panorama-360-mobile.webp`。

### 运行时状态类

| 类名 | 含义 |
| --- | --- |
| `.panorama-preview-ready` | Preview 已上传，加载阶段可以交互 |
| `.panorama-high-ready` | 原始高清纹理（或硬件兼容纹理）已上传，开始淡入最终画面 |
| `.particle-ready` | 渲染循环和交互已经启动 |
| `.panorama-upgrade-failed` | 原图升级失败，保留可交互 Preview 并结束加载状态 |
| `.has-explored` | 用户已拖动、缩放或使用方向键，隐藏拖曳提示 |
| `.is-dragging` | 正在拖动，切换抓取光标 |
| `.no-particle-canvas` | WebGL、Canvas 或初始图片失败，显示博客降级入口 |

## 5. 360° 交互和默认特效

- 鼠标或触摸拖曳：修改 `yaw` 和 `pitch`，松手后保留惯性。
- 鼠标滚轮：调整 `fov`，范围为 52°–100°。
- 键盘方向键：调整水平和垂直视角。
- “重置视角”：恢复初始 `yaw`、`pitch`、`fov`，同时清空粒子位移与速度。
- 背景自动漂移、星轨、辉光和鼠标粒子扰动默认开启，不再提供单独开关。
- 移动端降低粒子数量和 DPR 上限，最终全景仍使用高清纹理。

着色器采用等距柱状全景映射，把屏幕方向向量转换为经纬度 UV；星轨和辉光在 fragment shader 内完成。Canvas 2D 叠加的星点与流星使用 `screen` 混合模式，不会改变原始全景资源。

## 6. 入口与重置控件

### 博客入口

- 主文案：`探索 Xueyuan 的技术宇宙`
- 辅助文案：`深空坐标 · 技术博客`
- 链接目标：`/blog/`
- 点击普通左键后添加 `.is-launching`，同时激活 `.launch-transition.is-active`。
- JavaScript 读取入口火箭的实际屏幕坐标，通过 CSS 变量 `--launch-x` / `--launch-y` 让转场火箭从按钮位置起飞。
- 转场总时长为 1580ms：火箭升空、驶向屏幕中央的暗色引力透镜、星轨进入加速状态，画面柔和收束后再跳转 `/blog/`。
- `launch-transition__canvas` 使用 Canvas 2D 构建三维透视时光隧道：每个星点具有 `x / y / z` 深度，沿 Z 轴向镜头移动，并根据前后帧投影位置绘制纵深拖影。
- 隧道额外包含不同深度和倾角的非完整椭圆弧带，随镜头前进放大并轻微旋转，形成空间曲率和穿越感；中心引力透镜仅作为低亮度消失点，不再承担主要视觉效果。
- 引力透镜、吸积盘、火箭和文案由 CSS 动画完成，不引入额外运行时依赖。
- 不使用大面积 HUD 同心圆或中心白色闪光。整体亮度保持克制，以灰蓝、暗紫和深黑为主。
- 转场末段读取 `localStorage['aurora-theme']`：亮色博客渐变到低饱和蓝灰，暗色博客渐变到深黑，从而降低跨页面切换的突兀感。
- `<head>` 使用低优先级 `prefetch` 预取 `/blog/` 文档，减少转场结束后的页面等待感。
- `Ctrl`、`Command`、`Shift`、`Alt` 修饰点击保持浏览器原生行为。
- 用户启用 `prefers-reduced-motion` 时不等待动画，直接跳转。

入口宽度和移动端字号在 `assets/css/particle-cat.css` 的 `.particle-enter` 与 `@media (max-width: 520px)` 中维护。更换文案后必须检查 320px、375px、390px 三种窄屏宽度。

### 重置视角

按钮只显示清晰的轨道回航 SVG 图标，使用圆形深空玻璃样式；`aria-label` 和 `title` 仍保留“重置宇宙视角”，保证键盘、读屏与悬停提示可理解。

点击后不会直接改写视角，而是创建 `viewReset` 插值状态：

- `yaw` 使用 `wrapAngle()` 计算到默认角度的最短旋转路径。
- `pitch` 与 `fov` 使用同一条 `easeInOutCubic` 曲线恢复。
- 动画按当前偏移量动态计算为 760–1120ms，重置图标动画通过 `--reset-duration` 保持同步。
- 粒子位移使用回弹速度恢复，不会瞬间归零。
- 用户在重置过程中拖动、滚轮缩放或按方向键会调用 `cancelViewReset()`，立即接管当前视角。
- `prefers-reduced-motion` 环境仍采用即时重置。

## 7. 响应式、无障碍与降级

- 页面主语言为简体中文，`Xueyuan` 等专有名称可保留英文。
- 入口链接和重置按钮均有明确的 `aria-label`、可见焦点态和键盘访问能力。
- `prefers-reduced-motion: reduce` 会把 CSS 动画与过渡降到最小，并关闭自动星轨流动。
- JavaScript 不可用时，`noscript` 提供直达 `/blog/` 的链接。
- WebGL 或 Canvas 初始化失败时显示 `.particle-fallback`，用户仍能进入博客。
- 移动端使用安全区变量避让刘海和 Home Indicator。

## 8. 更换全景资源

新资源必须满足：

- 2:1 等距柱状全景图；普通横图无法实现无缝 360°。
- 左右边缘可无缝衔接。
- 桌面最终资源建议不低于 6000 × 3000。
- 保留来源与授权信息，并同步更新页面署名和本文链接。

使用 `cwebp` 生成当前四档资源的参考命令：

```bash
cwebp -q 25 -resize 768 384 source.jpg -o images/space-panorama-360-preview.webp
cwebp -q 72 -resize 1600 800 source.jpg -o images/space-panorama-360-medium.webp
cwebp -q 90 -resize 4096 2048 source.jpg -o images/space-panorama-360-mobile.webp
cwebp -q 94 source.jpg -o images/space-panorama-360.webp
```

替换后用 `sips -g pixelWidth -g pixelHeight images/space-panorama-360*.webp` 核对尺寸，并确认桌面和移动端都能完成 `.panorama-high-ready`。

## 9. 本地验证

基础检查：

```bash
node --check assets/js/particle-cat.js
git diff --check
bundle exec jekyll build
bundle exec jekyll serve --host 127.0.0.1 --port 4000 --no-watch
```

浏览器验收清单：

- `/` 首屏出现带模糊和扫描光的 Preview 过渡背景，以及“正在接收三体信号”场景；三颗天体独立运行，中心接收器和频谱持续反馈载入状态，且视觉上不能像底部博客入口卡片。
- Preview 上传后出现 `.panorama-preview-ready` 和 `.particle-ready`；原图仍在下载时，鼠标和触摸拖曳已经能移动模糊全景。
- 最终出现 `.panorama-high-ready`，三体信号接收场景平滑消失，高清画面在当前视角完成升级且没有中清停留状态。
- 水平可连续拖动 360°，垂直视角不会翻转。
- 惯性、滚轮缩放、方向键和“重置视角”有效。
- 点击博客入口后，火箭应从入口图标位置升空，出现具有明显前后景深的三维星线、旋转空间弧带、暗色引力透镜与“航向 Xueyuan 的技术宇宙”文案，约 1.58 秒后进入 `/blog/`；过程中不应出现刺眼白光或占满屏幕的机械圆环。
- 把视角拖离默认方向并改变缩放，点击重置后应看到画面沿最短路径平滑旋转和缩放到默认状态，而不是瞬间切换。
- 重置动画中再次拖动、滚轮缩放或按方向键，动画应立即停止并由用户继续控制。
- `/blog/` 的 Aurora 布局、导航、主题切换、文章列表没有变化。
- 在博客任意页面点击侧栏“首页”应回到 `/blog/`；点击头像应回到根路径宇宙页 `/`。
- 390 × 844 移动视口无横向溢出，入口不遮挡安全区。
- 控制台无 JavaScript、WebGL 或资源 404 错误。

## 10. 性能和维护原则

- 不引入 Three.js 等运行时库；当前实现是原生 WebGL + Canvas 2D。
- 跃迁 Canvas 复用首页 DPR 上限，桌面最高 1.5、粗指针设备最高 1.25，避免转场短时间内过度占用 GPU。
- 原始高清资源使用 `preload` 和高优先级请求，但不能作为阻塞 HTML 解析的同步资源。
- 不要在渐进加载期间重建 WebGL program 或重置视角状态。
- 新增视觉效果前先确认不会遮挡博客入口、拖曳区域或明显增加 GPU 占用。
- 页面只保留博客入口和图标式重置入口，其他效果默认开启。
- 修改任何宇宙首页 HTML、CSS、JS、资源或文案时，同步更新本文的文件清单、资源表、行为说明和验证清单。

## 11. 变更记录

### 2026-07-30

- 将“正在接收原始星图”玻璃状态卡改为“正在接收三体信号”深空接收场景。
- 加入三颗天体独立轨道、中心接收器脉冲、背景扫描和信号频谱动画，与博客入口建立明确视觉区分。
- Preview 完成后立即开放模糊全景拖曳，原始高清纹理保持高优先级后台加载，升级时保留用户视角。

### 2026-07-27

- 移除 Preview → Medium → Final 的 WebGL 分级替换，正常设备始终只上传 6000 × 3000 原始高清纹理。
- Preview 改为带模糊遮罩、扫描光和原图加载状态卡的纯 CSS 过渡背景。
- 原始图完成后再淡入高清画布并启动交互，避免用户把中清过渡误认为最终画质。
- 仅在 GPU 最大纹理尺寸不足 6000 时保留 4096 × 2048 兼容降级。

### 2026-07-26

- 将根路径与原博客拆分：`/` 为独立宇宙首页，`/blog/` 保持原站结构。
- 使用 ESO 2:1 全天星空全景实现 WebGL 360° 拖曳、惯性和缩放。
- 默认开启星轨、辉光、粒子扰动，移除多余的特效开关。
- 增加 Preview → Medium → Final 渐进加载，高清纹理后台无缝替换，最终画质不降级。
- 博客入口升级为深空导航舱样式，增加火箭离轨跳转动画。
- 入口文案调整为“探索 Xueyuan 的技术宇宙”。
- 重置入口改为轨道回航图标，并保留无障碍名称与反馈动画。
- 火箭入口初版增加全屏深空跃迁转场与 `/blog/` 预取，解决直接切页的突兀感。
- 将跃迁转场调整为低亮度电影感方案：移除大型 HUD 圆环和中心白光，改用暗色引力透镜、低饱和星轨，并根据博客明暗主题选择结束遮罩颜色。
- 将星轨升级为三维透视时光隧道，加入 Z 轴穿越、前后帧投影拖影和旋转空间弧带；引力透镜缩小为消失点。
- 重置视角改为 760–1120ms 最短路径插值，并支持拖动、滚轮和键盘随时打断。
