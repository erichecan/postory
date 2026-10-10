# M0 仓库审查 — PoStory Multi-Industry Demo Platform

对照 V2.0 §2.2 证据矩阵逐项核实,结论用于指导 M1 起的实现,不重复假设。

## 证据矩阵

| 能力 | 实际文件或服务 | 验证方法及结果 | 处理决定 |
|---|---|---|---|
| 路由鉴权机制 | **修正(原结论不完整)**:本仓库是 Next.js 16,中间件约定由 `middleware.ts` 改名为 `src/proxy.ts`(AGENTS.md 已警示这类破坏性改动)。`src/proxy.ts` 的 `PUBLIC_PATHS` 逻辑里 `pathname.startsWith("/demo/")` **已经**是公开路径,无需登录 session 即放行;`nails` workspace 鉴权在 layout 层叠加,与 proxy 是两层独立机制 | 全文读取 `src/proxy.ts`(22行)确认 matcher 覆盖除 `_next/api/assets/visual/brand` 外的几乎所有路径,`/demo/` 前缀已在公开白名单里 | `/demo/nails`、`/demo/sushi` **不需要**修改 `proxy.ts` 即可天然匿名可访问 —— 沿用 DEV-PLAN 已定的 `/demo/:industry` 路由,不改路由基准;也发现 `src/app/demo/{calendar,dashboard,design-system,my-brand,my-campaign}` 是已存在的、不相关的主平台代运营销售演示页(`getDemoData()`),属同级兄弟目录,无共享 layout、无代码耦合,仅路径前缀相同,不构成技术冲突 |
| 现有渲染/导出管线 | `src/components/editor/export-page.ts`(64行):`toPng`(html-to-image)+ Google Fonts CSS2 API 子集嵌入 | 全文读取,确认 `renderPagePng(node, page)` 返回 dataURL,`exportNodeAsPng` 触发浏览器下载,纯客户端、不依赖服务端渲染 | 复用该模式写 Demo 自己的 `render.ts`,在 `toPng` 输出的 dataURL 基础上过一次离屏 `<canvas>` 合成水印像素,不新增 puppeteer/satori/resvg/sharp 依赖 |
| 对象存储能力 | `src/lib/storage.ts`(165行,全文读取):`gen/`/`pub/`/`nails/`/`nails-export/` 四种 key 前缀正则校验,GCS/local-fs 双后端,均为 **Node-only 服务端** 调用 | 确认 `putObject/getObject/deleteObject` 无浏览器可调用路径,新增 key 前缀需要改 `isMediaKey`/`EXT_BY_MIME` 等正则并新增 server action | Demo 产物(上传照片归一化结果 + 导出PNG)全部停留在浏览器 IndexedDB/内存,不接入 `storage.ts`,不新增 key 前缀 —— 省掉一整条服务端存储改动面,且与"匿名、免注册、无需服务端持久化"的产品定位一致 |
| Session/身份隔离 | `src/lib/auth/session.ts`(cookie session,登录态专用);全仓库无匿名 session/anonymousId 相关代码(`grep -rli anonymous src` 命中仅 `layout.tsx` 文案字符串和 `nails-post-editor.tsx` 注释,均非会话逻辑) | grep 确认无现成匿名会话基建可复用 | 按 DEV-PLAN 既定决策,`DemoSession` 完全建在浏览器端 IndexedDB(`sessionId` 为客户端生成的 UUID,不经服务端分配、不落 cookie),天然做到"陌生人与陌生人互不可见"——没有共享存储就没有越权读取的攻击面 |
| 数据库/Prisma 影响面 | `prisma/schema.prisma` 现有 `Template` model(`pages: Json` 通用布局结构,服务于主平台营销模板画廊,非逐字段照片槽协议) | 已在前一阶段读取确认,字段形状与 V2.0 `TemplateDescriptor`/`FieldSpec` 不匹配 | 不改 schema、不迁移、不新建表;Demo 模板用 React 组件 + 行业配置对象手写,原因见 DEV-PLAN 歧义清单 |
| i18n 路由 | `src/i18n/config.ts`:`LOCALES=["zh","en"]`,通过 `NEXT_LOCALE` cookie + `Accept-Language` 判定,**不走 URL 路径前缀**(非 `/zh/xxx` 形式) | 读取全文确认 `resolveLocale` 签名,`nails` layout 用 `getTranslations("nails")` + `<LocaleSwitcher/>` | `/demo/:industry/*` 路由无需加 locale 路径段,沿用现有 cookie-based 方案,新增 `messages/{zh,en}/demo.json` 命名空间即可,与 `nails` 命名空间并列 |
| 可测试模板路径 | 目前**没有**任何字段驱动、"换照片即可出图"的模板组件存在 | 搜索确认 `Template.pages` 为自由格式 JSON,无字段绑定协议实现 | 这是一个确认的**缺口**,不是未验证项:M1 第一个任务就是手写 Nails/Sushi 各一个能跑通"真实照片→带水印PNG"的模板组件,从零实现,不存在可直接复用的半成品 |

## 结论

- 本次改动对现有仓库是**纯增量**:新路由组 `src/app/demo/[industry]/*`、新 i18n 命名空间 `demo`、新客户端模块(contracts/session/media/render/模板组件),**零** schema 迁移、**零**中间件改动、**零**对 `storage.ts`/`auth/session.ts`/Studio RLS 的触碰。
- 唯一确认的技术缺口是"字段驱动模板组件"需要从零手写,已计入 M1 工作量,不是未知风险。
- 真机(iOS Safari / Android Chrome)下 IndexedDB 隱私模式可靠性仍待 M2/M3 实测验证,已记录在 DEV-PLAN 风险点,非本轮 M0 结论可下定论。

---
对应台账:`docs/demo-v2/20261009-demo-tasks.md` → M0 仓库审查文档 → 已完成,证据见本文件。
