# 秋季猫眼新品模板

模板 ID：`nails-autumn-cat-eye-01`，当前版本 `1.0.1`。设计参考见同目录下的 `nails-autumn-cat-eye-01-concept.webp`；可替换的干净主图、两片独立透明叶片和笔触素材位于 `public/demo/templates/nails/assets/`。运行时模板由共享 `TemplateRenderer` 渲染，导出继续使用现有 DOM 栅格化与水印管线。

## 图层顺序

由后向前：用户/示例主图 → 暖金氛围光和暗角 → 深酒红渐变 → 两片带叶脉与浆果细节的独立 SVG → 橘红笔触 → 金色编辑线和系列眉题 → 双行金属渐变标题 → 副标题 → 导出水印。标题按行做大小层级，暖金渐变加强与猫眼光泽的呼应；画面保留照片作为主视觉，装饰不压住指甲。水印仍由导出流程合成，不烘焙进照片。完整坐标、裁切点、字体、层级、可编辑规则和三个独立画幅见 `public/demo/templates/nails/nails-autumn-cat-eye-01.v1.json`；运行时定义见 `src/lib/demo/templates/nails-autumn-cat-eye-01.ts`。

## 图片生成提示词

### 高保真视觉参考图

```text
Create a premium autumn cat-eye nail salon social campaign poster, portrait 4:5. Elegant editorial beauty photography, close-up of a woman's hand with medium almond nails in deep burgundy, copper and magnetic cat-eye shimmer, soft directional light revealing the luminous cat-eye stripe, warm dark espresso and wine background, subtle amber bokeh, refined autumn foliage in muted antique gold at the upper-right and lower-left, understated coral brush accent. Leave clear negative space in the upper-left for a two-line Chinese headline and a short subtitle. The hand and nail art stay prominent in the lower-right half. Sophisticated salon campaign, tactile realistic skin, immaculate manicure, high contrast but readable, restrained premium palette. Include the exact headline “秋日猫眼 新品上线” and subtitle “一抹流光，点亮秋日”. Do not include any brand logo, watermark, phone mockup, interface, border, or extra text. This image is a visual reference only; editable text, ornaments and watermark will be rebuilt as separate layers.
```

### 可替换主图（本模板使用的独立素材）

```text
Create a photorealistic premium nail salon hero photograph, portrait 4:5, with no text and no graphics. A graceful woman's hand with medium almond-shaped nails painted deep burgundy and copper magnetic cat-eye polish; visible luminous diagonal cat-eye reflections on every nail, crisp polished cuticles, natural elegant hand pose. Compose the hand and nails in the lower-right 60 percent of the frame. Keep the upper-left third dark, softly blurred espresso and wine-colored negative space for later typography. Warm autumn light, restrained amber bokeh and very subtle out-of-focus dried foliage, editorial beauty campaign, realistic skin texture, rich but accurate nail color, high-end photography. No words, no logo, no watermark, no border, no extra fingers, no jewelry covering nails.
```

叶片和笔触采用独立透明 SVG 绘制，便于在不同输出比例下保持清晰；无需从高保真图中切图或重新生成整张背景。

## 画幅

- 1:1：1080 × 1080，标题区域、照片焦点和装饰分别布局。
- 4:5：1080 × 1350，作为默认编辑和导出比例。
- 9:16：1080 × 1920，改为顶部渐变与顶部标题，照片构图更适合竖屏。

各比例独立定义，不是把单张 4:5 画面简单拉伸。缩略图、编辑预览和导出共用同一 React 模板组件；导出只提高栅格化目标分辨率并在最后合成水印。

实际渲染预览：`nails-autumn-cat-eye-01-renderer-preview.webp`（4:5，1080×1350；由 `/demo/nails/templates` 的共用模板组件捕获）。

## 验收

自动化用例覆盖版本注册、三比例画布与安全区域、三种渲染模式的同布局，以及隐藏可选副标题。模板选项的手动验收入口为 `/demo/nails/templates`，完成编辑后可分别导出三个尺寸。
