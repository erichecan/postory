# Logo 素材 v2

输入：用户提供的 `彩色_PoStory_品牌标志展示.png`，RGBA，1774 × 887。仓库原图为 `public/brand/postory-logo-source.png`；本轮未修改原图。

## 精确裁切素材

坐标以原图左上角为原点，单位 px：

| 素材 | 左 / 上 | 宽 × 高 | 文件 |
|---|---|---|---|
| 文字标志 | 122 / 290 | 959 × 258 | `public/brand/postory-wordmark-v2.png` |
| 右侧图标 | 1185 / 200 | 432 × 437 | `public/brand/postory-symbol-v2.png` |

保留透明背景和全部原始像素，不使用 AI 重画，不修改品牌字体或颜色。边界依据 alpha ≥128 的实际内容计算，另保留 4 px 左上安全边距及右下安全边距。文字实质内容边界为 126 / 294 / 951 / 250，图标为 1189 / 204 / 424 / 429。

共用 Logo 组件采用文字 PNG，桌面显示宽度 180 px，手机页头 108 px，流程图 77 px，高度随原比例自动计算。通过 `next/image` 的 `unoptimized` 保留 959 px 原始宽度，取消旧背景图的小数缩放及偏移，并移除手机页头与流程图的 `transform: scale` 二次缩放，不让图片优化器再次缩小或有损编码。各处页头、认证界面、页脚及业务流程图中使用该组件的 Logo 自动同步。

## SVG 衍生稿

`postory-wordmark-v2.svg`、`postory-symbol-v2.svg` 使用 Potrace 从原图轮廓生成 Bézier 路径，保留文字气泡形状；弱化像素噪点、重建近似粉橙渐变。均为真实 SVG 路径，不是把 PNG 包在 SVG 中。它们不是原始设计师矢量文件，存在细微轮廓和渐变差异，暂不默认替换网页 Logo。

文字 SVG 与 PNG 在原尺寸按 alpha ≥128 比较的轮廓交并比约为 99.0%；该数字仅衡量黑白轮廓，不能表示颜色或视觉完全相同。

## 选择建议

- 现有 PNG 裁切稿：当前导航尺寸优先使用；忠于原图，也能满足高像素密度显示。
- 描摹 SVG：适合试用放大场景；正式使用前确认字形和颜色差异。
- 原生 SVG / AI / PDF：长期最优素材；应包含可编辑路径而非嵌入位图，既清晰又保留准确设计。

## 重建与验证

`NODE_PATH=/tmp/postory-logo-tools/node_modules node scripts/build-logo-assets.mjs` 可重新生成裁切及描摹稿。Potrace 仅为本地素材工具，不加入应用依赖。

原图与两份 PNG 的逐像素裁切一致性已验证。普通屏和 Retina 对比截图保存在本地 `preview/logo-v2/comparison-1x.png`、`comparison-2x.png`。30 项页面与视口检查覆盖首页、服务页、客户演示、品牌页、登录及价格页，1440 / 1280 / 1024 / 768 / 390 px、DPR 2；报告为 `preview/logo-v2/site-report.json`。

部署记录见 `docs/20260928-postory-deploy-log.md`。
