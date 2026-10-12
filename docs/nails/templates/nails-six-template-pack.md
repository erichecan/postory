# PoStory 美甲六款代码模板包

使用 `postory-template-builder` Skill 构建。六款都走相同的 `TemplateRenderer` 与 `FullBleedEditorialFamily`，照片、文案、装饰、渐变、导出水印分层；每款有 `1:1 1080×1080`、`4:5 1080×1350`、`9:16 1080×1920` 独立布局。JSON 使用左上角原点和相对画布归一化坐标。

| 顺序 | 模板 ID | 视觉方向 | 可替换主图 | 探索概念（非精确预览） | 实际渲染预览 |
|---|---|---|---|---|---|
| 1 | `nails-glazed-pearl-01` | 裸透珍珠、柔粉、珍珠光 | `hero-glazed-pearl-sample.webp` | `nails-glazed-pearl-01-concept.webp` | `nails-glazed-pearl-01-renderer-preview.webp` |
| 2 | `nails-french-terracotta-01` | 陶土红法式、奶油纸感 | `hero-french-terracotta-sample.webp` | `nails-french-terracotta-01-concept.webp` | `nails-french-terracotta-01-renderer-preview.webp` |
| 3 | `nails-autumn-cat-eye-01` | 酒红铜色猫眼、金色秋叶 | `hero-autumn-cat-eye-sample.png` | `nails-autumn-cat-eye-01-concept.webp` | `nails-autumn-cat-eye-01-renderer-preview.webp` |
| 4 | `nails-berry-velvet-01` | 莓果酒红、天鹅绒、金箔 | `hero-berry-velvet-sample.webp` | `nails-berry-velvet-01-concept.webp` | `nails-berry-velvet-01-renderer-preview.webp` |
| 5 | `nails-winter-berry-01` | 冬日莓红、香槟闪粉、雪花 | `hero-winter-berry-sample.webp` | `nails-winter-berry-01-concept.webp` | `nails-winter-berry-01-renderer-preview.webp` |
| 6 | `nails-copper-autumn-offer-01` | 铜色猫眼、秋季礼遇、克制促销感 | `hero-copper-autumn-offer-sample.webp` | `nails-copper-autumn-offer-01-concept.webp` | `nails-copper-autumn-offer-01-renderer-preview.webp` |

## 图片与实际模板的对应关系

早期概念图和干净主图是分开生成的，因此手势、指甲位置、镜头和留白可能不完全对应。概念图只用于探索方向，不能当作可替换主图的精确设计稿。上表的“实际渲染预览”是从 Demo 使用的 `TemplateRenderer` 按 4:5、1080×1350 捕获的，展示真实的照片、文字和装饰合成效果；导出时再由共享导出管线添加水印。

## 图片生成提示词

以下是早期图片方向记录。概念图与主图曾各自独立生成，所以可能不一一对应；生产版以实际渲染预览为准。后续生成模板时先固定视觉锚点并生成干净主图，再围绕该图布局文字和装饰；不要要求模型独立重画同一场景两次。主图绝不含字、Logo 或水印。生成工具：内置 ImageGen。

### 1. 裸透珍珠

**视觉概念：** 4:5 美甲社媒海报；半透奶油粉、珍珠铬光的短杏仁甲；手部落在右下，左上留文案空间；珍珠白、贝壳粉、米色，细银弧和珍珠点缀；文案参考“裸透珍珠／日常上新”“温柔显白，轻盈有光”。

**主图：** 写实美甲产品照；自然手部与五指，半透奶油粉短杏仁甲、轻微珍珠铬光，手部斜置右下；象牙白和浅玫瑰背景，左上留大块干净留白，柔和日光；只出照片，不要任何文字、银弧、珍珠图形、Logo、水印或海报元素。

### 2. 陶土红法式

**视觉概念：** 4:5 高级沙龙新品海报；暖裸粉底和细陶土红法式尖端；手部位于右下，奶油纸色背景；上左留标题；细弧形线与小陶红笔触；文案参考“法式新意／指尖上新”“经典线条，温柔焕新”。

**主图：** 写实优雅手部，五指结构自然，裸粉底短椭圆甲和细陶土红法式尖端；手部在右下，暖象牙色纹理背景、左上大块留白，柔和自然光；只出照片，不要文字、弧线、笔触、Logo、水印或海报布局。

### 3. 秋季猫眼

视觉参考和主图提示词详见 [nails-autumn-cat-eye-01.md](./nails-autumn-cat-eye-01.md)。方向为深酒红与铜色磁吸猫眼光带，主标题放左上，金色秋叶为独立 SVG。

### 4. 莓果酒红

**视觉概念：** 4:5 深酒红节日限定海报；黑樱桃与酒红杏仁甲、少量金箔；手部落右下，左上留奶油色标题区；天鹅绒、金色浆果枝线稿；文案参考“莓果酒红／节日限定”“深色显白 · 预约开启”。

**主图：** 写实手部、五指自然，黑樱桃与深酒红亮面杏仁甲、仅两枚甲片有少量金箔；手在右下，深酒红天鹅绒背景、左上留干净暗部；戏剧性侧光；只出照片，不要浆果、叶片插画、文字、金色徽章、Logo、水印或海报元素。

### 5. 冬日莓红

**视觉概念：** 4:5 冬季新品海报；蔓越莓红与香槟细闪，少量白色雪花甲绘；手部在右下，左上为浅粉奶油色标题区；银色星芒与冬枝装饰；文案参考“冬日莓红／节日新款”“温暖一整个冬天”。

**主图：** 写实手部、五指自然，短杏仁甲为蔓越莓红和香槟细闪，仅一两枚含小型白色雪花甲绘；手在右下，淡粉象牙色针织背景、左上大块干净留白，柔和冬日棚拍光；不要树枝、挂饰、星形图案、文字、Logo、水印或海报布局。

### 6. 铜色秋日礼遇

**视觉概念：** 4:5 高级秋季活动海报，不做廉价优惠券；铜色磁吸猫眼甲和深咖啡丝绸；手部在右下，左上留浅奶油色标题空间；细金属框角、几何封印和克制笔触；文案参考“秋日焕新／美甲礼遇”“限时预约 · 为指尖加点光”。不生成具体折扣数字。

**主图：** 写实手部、五指自然，短杏仁甲为反光铜色磁吸猫眼，清晰斜向光带；手在右下，深咖啡与铜金丝绸背景、左上留干净暗部；奢华秋季侧光；只出照片，不要文字、边框、叶片、促销徽章、Logo、水印或 UI。

每个主图均按 4:5 生成，保留足够外围照片用于 1:1 和 9:16 裁切。透明装饰由独立 SVG 文件提供，避免把透明装饰烘焙到主图；每个变体的三个装饰文件位于 `public/demo/templates/nails/assets/`。
