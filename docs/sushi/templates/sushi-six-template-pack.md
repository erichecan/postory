# PoStory 寿司六款代码模板包

此包以已在 Demo 注册的六款作为完整模板库，不重复新增 ID：招牌美食、午餐推荐、新品菜单、聚会拼盘、餐厅环境、日式寿司。模板由共用 TemplateRenderer 渲染，每款使用独立的 1:1、4:5、9:16 布局；用户照片与文字可替换，CSS/SVG 装饰分层，水印由统一导出管线最后合成。

| 模板 ID | 画面方向 | JSON 定义 | 探索概念（非精确预览） | 实际渲染预览 |
|---|---|---|---|---|
| `sushi-signature-editorial-01` | 深色摄影、白色衬线标题、金色植物线稿 | `public/demo/templates/sushi/sushi-signature-editorial-01.v1.json` | `sushi-signature-editorial-01-concept.png` | `sushi-signature-editorial-01-renderer-preview.webp` |
| `sushi-lunch-special-01` | 午市橙色信息条、深色照片 | `sushi-lunch-special-01.v1.json` | `sushi-lunch-special-01-concept.webp` | `sushi-lunch-special-01-renderer-preview.webp` |
| `sushi-new-menu-01` | 米色纸面分区、陶土色标题 | `sushi-new-menu-01.v1.json` | `sushi-new-menu-01-concept.webp` | `sushi-new-menu-01-renderer-preview.webp` |
| `sushi-party-platter-01` | 炭黑分享拼盘、金色同心线 | `sushi-party-platter-01.v1.json` | `sushi-party-platter-01-concept.webp` | `sushi-party-platter-01-renderer-preview.webp` |
| `sushi-dine-with-us-01` | 温暖木质餐厅、品牌欢迎语 | `sushi-dine-with-us-01.v1.json` | `sushi-dine-with-us-01-concept.webp` | `sushi-dine-with-us-01-renderer-preview.webp` |
| `sushi-authentic-japanese-01` | 深陶盘与寿司特写、手作质感 | `sushi-authentic-japanese-01.v1.json` | `sushi-authentic-japanese-01-concept.webp` | `sushi-authentic-japanese-01-renderer-preview.webp` |

## 图片与实际模板的对应关系

概念图与干净示例照片是独立生成的，不能保证照片构图、食物位置、光线和概念稿一致。概念图只用于探索方向。上表的“实际渲染预览”从 Demo 共用的 `TemplateRenderer` 按 4:5、1080×1350 捕获，准确展示当前生产组件的照片、文字和装饰合成；导出时由共享导出管线添加水印。

清爽可替换照片 `/demo/photos/sushi-salmon-nigiri.png` 独立于所有模板文案与装饰。第一款继续使用各自独立的植物 SVG；其他款的纸面、线纹、色块、分割线由共享 Sushi 组件按模板变体绘制，没有把装饰或文案并入照片。

## ImageGen 概念图提示词

除第一款沿用已确认的设计参考外，其余五款按模板样式分别生成一张视觉方向图。概念图仅用于视觉交接，生产版文字和装饰仍由注册模板组件绘制。

1. **Lunch Special：** 高级寿司店午餐宣传，三文鱼握寿司和便当占下半部，顶部深炭色渐变放白色衬线标题和橙色小标签；提示文案 “LUNCH SPECIAL / Lunch Special / Fresh sushi for your midday break.”，暖木色与橙色，单张 4:5 海报，不要 Logo、水印、UI 或拼图。
2. **New Menu：** 右侧为时令握寿司拼盘，左侧暖象牙色撕边纸面板，陶土色大标题及浅米色副文案胶囊；提示文案 “JUST ARRIVED / New Menu / Discover the latest sushi creations.”，编辑部式餐饮摄影，单张 4:5，不要 Logo、水印、UI 或拼图。
3. **Party Platter：** 深色炭黑编辑面板搭配右下的大份寿司拼盘，奶油白标题与低调金色同心圆线；提示文案 “MADE TO SHARE / Party Platters / Birthdays · Office events · Family dinners.”，暖色餐厅灯光，单张 4:5，不要 Logo、水印、UI 或拼图。
4. **Dine With Us：** 温暖木质寿司吧台、右下黑陶盘和握寿司，左侧深棕渐变承载白色标题与细黄铜分隔线；提示文案 “GOOD FOOD · GOOD COMPANY / Dine With Us / A welcoming place for sushi and good company.”，亲切高级，单张 4:5，不要人物脸、Logo、水印、UI 或拼图。
5. **Authentic Japanese：** 深色粗陶盘上有真实手作的三文鱼、金枪鱼与白身鱼握寿司，主体居中偏下，深色下方留出奶油色三行标题；提示文案 “JAPANESE CUISINE / Authentic Japanese Sushi / Fresh sushi, made with care.”，克制自然侧光，单张 4:5，不要 Logo、水印、UI 或拼图。

照片生成与新模板资产提示词由 `.agents/skills/postory-template-builder/references/image-generation-prompts.md` 指导；现有完整照片提示词位于对应美甲模板包文件，寿司主图为独立无文案图层。
