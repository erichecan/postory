# DEV-PLAN：PoStory Multi-Industry Demo Platform(Nails + Sushi 免费匿名 Demo)

## 读取了哪些文档

- `/Users/eric/Documents/Codex/2026-10-09/referenced-chatgpt-conversation-this-is-an/outputs/PoStory-Multi-Industry-Demo-Platform-V2.0.md`(主规格文档,666行,全文通读两遍)
- `/Users/eric/Documents/Codex/2026-10-09/referenced-chatgpt-conversation-this-is-an-2/outputs/PoStory-Sushi-Mobile-Demo-Development-Specification-V1.0.md`(参考文档,1371行,已与 V2.0 做过差异对比)
- `~/Downloads/` 下 19 张高保真设计稿(2026-10-09 新增,853×1844px,≈390×844 CSS px × 2.19,与两份文档的移动端设计基准吻合):11 张 Nails + 8 张 Sushi,逐张核对完毕,见下文「设计稿映射」
- 现有代码:`AGENTS.md`、`docs/nails/CONTINUE.md`、`prisma/schema.prisma`(Template model)、`src/components/nails/demo.tsx`(现有 `/nails/demo` 占位页)、`src/components/editor/export-page.ts`(现有 html-to-image 渲染导出管线)、`src/app/` 路由结构

用户本轮明确指令:「以 V2 为主文档,1-6 张、输出比例按 V2 版本,其他按我的建议,开始开发;设计稿在 Downloads;不能保证 100% 还原要先说明」。

## 一、这个模块是什么

两个独立行业(美甲 Nails、寿司 Sushi)的**免费匿名获客 Demo**:陌生人不登录,上传自己 1–6 张照片 → 选模板 → 编辑文案 → 预览导出带水印成品图 → 转化页介绍 PoStory 代运营服务。目的是让潜在客户在几分钟内看到"我的照片套进去是什么效果",作为代运营服务的获客入口。与现有登录态付费工作区(`/nails/(workspace)/*`)是完全独立的两个产品,不共用数据、不共用登录态。

## 二、设计稿映射(19 张,逐张核对结果)

### Nails(11 张,6 张入本次范围 + 5 张排除)

| V2.0 页 | 设计稿文件 |
|---|---|
| 01 Landing | 美甲社交媒体预约助手.png |
| 02 Upload | 美甲作品上传界面.png |
| 03 Templates | 美甲社交媒体模板精选UI.png |
| 04 Edit | 粉色美甲社媒模板编辑器.png |
| 05 Preview&Export | 美甲笔记预览与导出页面.png |
| 06 Success/转化 | 粉色美甲社媒发布成功页.png |

排除(登录态付费工作区页面,非本次范围):PoStory美甲内容画廊.png(我的内容列表)、PoStory美甲内容管理仪表盘.png(首页)、美甲社媒安排发布界面.png、美甲社媒发布日历界面.png、美甲社媒账号管理界面.png。

### Sushi(8 张,全部入本次范围,原图自带"Step X of 6"编号)

| V2.0 页 | 设计稿文件 |
|---|---|
| 01 Landing | 寿司社媒营销落地页.png |
| 02 Upload(Step 2 of 6) | 寿司照片上传界面(1).png |
| 03 Templates(Step 3 of 6) | 寿司社交媒体模板选择界面.png |
| 04 Edit(Step 4 of 6) | 寿司社交媒体内容预览界面.png |
| 05 Preview&Export(Step 5 of 6,两屏) | 寿司社交内容预览界面.png(调整文字/风格) + 寿司社交贴文预览界面.png(最终导出) |
| 06 Success/转化 | 寿司营销图片下载成功界面.png |
| 额外发现(Step 6 of 6) | 寿司社交媒体发布安排界面.png —— 见下方歧义清单第 1 条 |

## 三、歧义清单(我自行裁定,记录依据,不再就此打断你)

1. **Sushi「Step 6 of 6 选择发布时间」页与规格硬边界冲突**:该页是真实的选日期/时间 + 勾选 Instagram/Facebook + "确认并安排发布"功能 UI,但 V1.0 §1.2 与 V2.0 §1.2/§4.1(`capabilities.scheduling:false, publishing:false`)都明确免费 Demo 不排期、不发布、不连接社媒账号。
   **处理**:视觉按设计稿 100% 还原,但"确认并安排发布"按钮不接 OAuth、不接真实定时任务,点击后展示诚实文案(类似"这是免费体验效果展示,真实排期发布需要代运营服务"),与其他页面"了解代运营服务"转化位风格一致。不在本轮做任何社媒账号接入。

2. **成功页"图片已保存到相册/手机相册"文案**违反 V2.0 §6.4/§9.4/§15.3 的"不得将无法检测的磁盘保存称为已保存到相册"。
   **处理**:改为"图片已生成,点击下载保存"一类不过度承诺的文案,浏览器下载请求成功发起即可进入下一页,不做保存状态检测。Nails、Sushi 成功页都要改。

3. **输出尺寸**:V1.0(1:1/4:5/9:16)、V2.0(portrait-2x3 1080×1620/square 1080×1080/portrait-4x5 1080×1350)、Nails 设计稿(3:4 1080×1440/1:1 1080×1080/4:5 1080×1350/16:9 1200×675)、Sushi「Step4预览」「Step5调整」「Step5导出」三处又各不相同,Sushi 自己内部甚至自相矛盾(同一 Facebook 卡片一会儿 1.91:1 横版一会儿 1200×1200 正方形)。
   **处理**:按用户指示,工程实现(真实渲染尺寸、OutputSpec)用 V2.0 的 portrait-2x3/square/portrait-4x5 三档;UI 视觉保留设计稿的平台分组方式和图标风格,但数字替换为 V2.0 的实际值。不照抄设计稿里互相矛盾的数字。

4. **字段字符上限**:V1.0(标题50/描述80)、V2.0(建议标题40/短文案160/联系说明80)、Nails 设计稿(标题~10、正文~200)、Sushi 设计稿(标题50、副标题80、简单描述50)均不同。V2.0 §4.2 原文本身写明"最终约束取模板实际安全上限与上述限制的较小值"。
   **处理**:按各行业设计稿实际显示的数字配置各自独立的 FieldSpec.maxLength,不强行统一成一套全局数值,这也符合 V2.0 IndustryConfig 按行业独立配置字段的设计本意。

5. **现有 `/nails/demo` 与本次新 Demo 不是同一个东西**:`/nails/demo`(`src/components/nails/demo.tsx`)是登录态工作区内的空态预览 Tab,点击任何操作都跳 `/nails/login`,不含真实上传/模板/编辑/导出功能;本次要建的是完全独立的匿名获客流程。
   **处理**:`/nails/demo` 保持不动,新流程建在 `/demo/nails`、`/demo/sushi`(匹配 V2.0 §6 建议路由 `/demo/:industry`)。不做别名/跳转,避免影响现有工作区导航。

## 四、技术架构决策(L2,已自行裁定)

- **渲染/导出**:复用仓库现有 `html-to-image` 客户端渲染管线(`src/components/editor/export-page.ts` 的 `renderPagePng`/字体内嵌模式),不新建服务端渲染栈(puppeteer/satori/sharp 等均不在现有依赖里,引入属于不必要的新基础设施)。
- **水印**:导出前用离屏 `<canvas>` 把水印图层合成进 PNG 像素(先 toPng 产出素材图,再 canvas 二次合成水印后才允许下载),满足 V2.0 §9.3"烘焙进像素,不是 CSS 覆盖"的要求。
- **草稿/素材存储**:纯本地 IndexedDB(V2.0 §8.3/§10 明确允许的"本地处理方案"),**不新建 Prisma 表,不改 schema,不碰 Studio RLS**。草稿 24 小时内有效,刷新/关闭后可恢复;隐私模式/空间不足时降级为当前标签页内存,明确提示可能丢失但不阻断下载。
  这个决定把本次"大改"的风险面从"新模块 + 改 schema + 超 5 文件"降到"新模块 + 超 5 文件",不涉及数据库迁移和生产数据风险。
- **模板实现**:按行业写成 React 组件 + 行业配置(`IndustryConfig`/`TemplateDescriptor` 按 V2.0 §4.1/§7 的类型落地为 TypeScript),不复用现有 `Template`/`Design` Prisma model(那是通用营销模板库,`pages: Json` 的图层结构和字段驱动协议完全对不上,勉强套用等于伪造模板能力,V2.0 §2.3 明确禁止)。
- **路由**:`src/app/demo/[industry]/{page,upload,templates,edit,preview,success}/page.tsx`,公开路由组,不挂载在 `(app)` 或 `nails/(workspace)` 认证边界内。

## 五、模块拆解

1. `src/lib/demo/contracts.ts` —— IndustryConfig / FieldSpec / TemplateDescriptor / ContentDraft / RenderInput 等类型 + 运行时校验(zod)
2. `src/lib/demo/industries/nails.ts`、`src/lib/demo/industries/sushi.ts` —— 两套行业配置(类别、字段、模板引用、文案 key、代运营转化文案)
3. `src/lib/demo/session.ts` —— IndexedDB 封装(session/draft/asset 读写、revision CAS、过期清理)
4. `src/lib/demo/media.ts` —— 上传校验归一化(EXIF 方向、长边缩放、格式校验,1–6 张)
5. `src/components/demo/templates/nails/*`、`.../sushi/*` —— 各行业模板 React 组件(对应设计稿里展示的具体风格卡片)
6. `src/components/demo/*` —— 六页共享 UI:DemoShell、StepIndicator、MediaPicker、TemplateGallery、ContentFieldForm、ArtworkPreview、OutputSelector、ExportActions、ConversionPanel(按 V2.0 §13 组件契约命名)
7. `src/lib/demo/render.ts` —— 渲染编排 + 水印合成(复用 export-page.ts 模式)
8. `src/app/demo/[industry]/*/page.tsx` —— 六页路由
9. `src/i18n/messages/{zh,en}/demo.json` —— 双语文案

## 六、Schema 设计

**不改 Prisma schema**(见上文架构决策)。如 M0 审查后发现本地方案在目标浏览器环境下行不通(如 Safari 隐私模式 IndexedDB 限制过严),会记录 ADR 并评估是否退回服务端方案,但不预先假设需要。

## 七、路由清单

```
/demo/[industry]                 Landing(industry: nails | sushi,非法值 404)
/demo/[industry]/upload          Upload
/demo/[industry]/templates       Templates
/demo/[industry]/edit            Edit
/demo/[industry]/preview         Preview & Export
/demo/[industry]/success         Success/转化
```

不新增服务端 API 路由(纯本地方案下媒体/会话/渲染都在客户端完成,无需 `/api/demo/v2/*`)。

## 八、风险点

- **真机验证缺口**:html-to-image 在 iOS Safari/Android Chrome 上的字体渲染、长图导出、相册保存降级路径需要真机测试,模拟器不能替代(V2.0 §15.1 硬性要求)。
- **IndexedDB 在隐私模式/低存储设备上的可靠性**:需要测试降级路径(内存兜底),不能导致下载功能整体不可用。
- **12 页高保真视觉还原工作量大**:两个行业各 6 页,且 Sushi 比 Nails 多一个"Step 6 发布排程"非标准页面需要改造行为(见歧义清单第1条),预计是本次最大的工作量来源,需要按页拆分、逐页截图比对、不能一次性"做完再说"。
- **模板素材**:设计稿里的模板装饰背景(织物纹理、水波纹、樱花枝、料理摄影)需要替换成可商用素材库里风格相近的图片/图形,不是逐像素抠图复刻参考图;真实效果依赖用户自己上传的照片替换主图位置。
- **两行业字段/分类差异需要保持独立配置**,不能为了图省事做成一套硬编码兼容两边,否则后续加第三个行业会出问题。

## 附录 A:验收标准与 verify.sh

每个工作单元(每个页面)的验收证据包括:

1. **技术验收**(我自证,不用你看):
   - `npx tsc --noEmit` 通过
   - `npm run build` 通过
   - 六条路由(`/demo/nails/*`、`/demo/sushi/*`)本地访问非 404/500
   - 上传 1/4/6 张边界用例、第 7 张拒绝提示
   - 导出 PNG 的 magic bytes、尺寸、水印区域像素采样校验(不能只断言"调用了导出函数")
   - 两张视觉明显不同的照片替换同一槽位,断言导出文件确实不同(byte diff)

2. **定性验收**(你来判断,我负责让它好判断):
   - 每页提供浏览器截图,与对应设计稿文件并排对比
   - 对照顺序固定:整体布局 → 图片 → 字体 → 间距 → 控件 → 装饰细节
   - 截图标注验证视口(390×844 为主,320/430 为边界)
   - 仍存在的视觉差异和原因如实列出,不说"基本一致"这类模糊结论

`scripts/verify-demo.sh` 将在 M1(共享核心跑通)后创建,包含上述技术验收项的自动化脚本,退出码即结论。

## 九、里程碑(沿用 V2.0 §17 的 M0–M5,映射到本仓库)

| 阶段 | 本轮具体工作 |
|---|---|
| M0 | 产出 `docs/demo-v2/repository-audit.md`(已完成部分审查:Template model 结构、html-to-image 管线、无现有 demo 路由、无水印代码——正式整理成文档) |
| M1 | 共享核心(contracts/industries 配置/IndexedDB session/media 归一化/最小渲染),单模板跑通真实照片→带水印 PNG(Nails、Sushi 各一个) |
| M2 | Nails 六页完整接入,移动端真机下载验证 |
| M3 | Sushi 六页完整接入(含歧义清单第1条的"发布排程"页改造) |
| M4 | 补全全部模板风格(两行业各目标 6 种)、错误处理、边界用例、视觉回归 |
| M5 | 真机冒烟(至少一台 iOS Safari + 一台 Android Chrome)、公开可访问确认 |

确认后我会先建 `docs/demo-v2/20261009-demo-tasks.md` 任务台账(长任务协议),从 M0 仓库审查文档开始逐项推进,一周期一次汇报。
