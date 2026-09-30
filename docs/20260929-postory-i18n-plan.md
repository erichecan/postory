# 中英文双语 · 开发计划

来源：用户 2026-09-28 原话「另外整个网站做成中英文双语切换的」（见 docs/20260927-postory-需求原话.md）

## 范围

- 现状：49 个文件、约 390 处中文硬编码文案；`<html lang="zh-CN">` 写死
- 做：界面文案（导航、模板库、详情、编辑器、我的作品、商家资料、引导、登录注册、后台）、表单校验与服务端报错、平台分类名、日期格式、页面 title/description
- 不做：模板内容本身（标题/描述/图内文字，源数据即英文）、用户输入的数据（店名、作品名等）

## 技术方案

| 项 | 决定 | 理由 |
| :-- | :-- | :-- |
| 库 | next-intl（无路由模式） | App Router + Server Components/Server Actions 原生支持，服务端 `getTranslations`、客户端 `useTranslations` 同一套 key |
| 语言存储 | cookie `NEXT_LOCALE` | 网址不变，现有路由、redirect、`next=` 参数都不用动 |
| 首次访问 | cookie → `Accept-Language`（en* → en）→ 默认 zh | 英文浏览器看到英文 |
| 文案文件 | `src/i18n/messages/{zh,en}.json`，按页面分命名空间 | 一处改两语 |
| 切换 | Server Action 写 cookie + `router.refresh()` | 不跳页、不丢编辑器状态以外的内容 |
| 平台名 | `platforms.ts` 只留 id，label 走 messages | 分类栏、卡片标签、详情页共用 |
| 校验报错 | zod schema 返回 key，Action 里 `getTranslations` 翻译 | 报错也随语言 |

## 模块拆解（按顺序，每步可独立验证）

1. 基础设施：next-intl 接入、`i18n/request.ts`、`<html lang>` 动态、切换组件（顶栏 + 登录注册页右上角）
2. 登录 / 注册 / 一键登录 / 引导页 / 校验与 Action 报错
3. 顶栏、模板库（分类栏、hero、卡片、加载更多、空状态）、模板详情、相似模板
4. 编辑器（工具栏、样式/图层/页面/商家资料面板、导出、发布设定）
5. 我的作品、商家资料、后台账号管理
6. 收尾：扫描残留硬编码中文、两份 messages key 集合一致性、截图对比

## 风险

- 编辑器文案分散在 11 个文件，漏翻风险最高 → verify 脚本 grep `src/**/*.tsx` 中残留中文（白名单：demo.ts 的店铺资料）
- 英文文案普遍比中文长 → 按钮/标签可能换行或撑开，逐页截图检查 1440 与 390 两个宽度
- 瀑布流标题行数估算与语言无关（标题是模板数据），不受影响

## 附录 A · 技术验收

`scripts/verify.sh` 增加：

- `node scripts/check-i18n.mjs`：zh/en key 集合完全一致；无空值
- `grep -rnE "[一-龥]" src --include=*.tsx`（排除 messages、demo.ts）结果为空
- 路由探针：对路由清单每个 path 分别带 `NEXT_LOCALE=zh` / `en` cookie 请求，断言非 404/500 且 `<html lang>` 对应
- 原有 tsc / build / prisma migrate status / 鉴权探针照跑
