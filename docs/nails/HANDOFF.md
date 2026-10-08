# PoStory for Nails — 开发接力

更新时间：2026-10-07。当前任务：九个开发工作包中的 **2. 作品素材库（P0）**。

当前交接：第 1、2 包本地实现均已完成；第 3 包待开发。跨工具入口为 [CONTINUE.md](./CONTINUE.md)，已由根目录 CLAUDE.md 导入、AGENTS.md 引用。九包的完整任务和验收标准见 [WORK-PACKAGES.md](./WORK-PACKAGES.md)。

## 产品与实现范围

在现有 PoStory 仓库内增加独立 `/nails` 入口，共享 User、认证会话、邮箱令牌和品牌组件。主平台 `/create`、`/onboarding` 等已有路径保持原有用途，因此美甲版使用带前缀的路由。

本阶段提供邮箱验证码注册/登录、原账号密码登录、个人工作室创建与编辑、手机导航、只读演示，以及登录后 `/nails/create` 的真实作品素材库（1–5 张照片上传、压缩、持久化、删除、选中排序、再次选择复用）。Post 编辑、AI 文案、图片模板导出、预约引擎、发布仍是明确标注“即将开放”的占位页；素材库区块不在此列，已经可以正常使用。

## 本地使用

```sh
npm install
npx prisma migrate deploy
npx prisma generate
npm run dev
```

- 登录：<http://localhost:3002/nails/login>
- 无需登录的演示：<http://localhost:3002/nails/demo>
- 个人工作区：<http://localhost:3002/nails>
- 首次设置：`/nails/onboarding`，名称 + 实际营业地时区。
- 登录后导航：`/nails/create`、`/nails/appointments`、`/nails/me`。

开发环境没有 `RESEND_API_KEY` 时，验证码只输出到运行 `npm run dev` 的终端，标记为 `[mail:dev]`，不会送达邮箱。已有密码的 PoStory 账号可点击“使用密码登录”。生产环境未配置邮件时，新的验证码登录入口返回发送失败，不假装已发出邮件。

这些是本机地址，尚未部署为手机远程访问地址。代码和本文件保存在仓库中，下次可从此继续；本次没有配置 session 远程控制服务。

## 环境配置

沿用根目录 `.env.local`，不要提交真实凭据：

```dotenv
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/social_shell?schema=public
AUTH_SECRET=至少32个字符的随机秘密
APP_URL=http://localhost:3002
# 真实邮件发送需要以下两项；发件域名需在现有邮件服务中配置。
RESEND_API_KEY=邮件服务密钥
MAIL_FROM=PoStory <no-reply@YOUR_VERIFIED_DOMAIN>
```

开发时可省略邮件配置。正式上线应使用 HTTPS，生产会话 Cookie 带 Secure。`AUTH_SECRET` 需要稳定保存，它同时用于会话签名和验证码 HMAC。新增流程沿用 7 天 HttpOnly / SameSite=Lax 会话，验证码有效期 15 分钟、每码最多尝试 5 次、60 秒发送冷却、每小时每邮箱每用途最多 5 次。数据库事务锁阻止并发发送绕过限制。

## 数据模型与隔离

- `User`：沿用主平台身份与资料，不另建账号库。
- `Studio`：`id`、唯一 `ownerId`、`name`、IANA `timeZone`、创建和更新时间。
- 第一阶段限定“一人一个自有工作室”；所有者关系即当前成员关系，设置直接存 Studio。暂不增加无用途的多成员/权限/设置表。团队协作可在后续独立迁移中引入。
- `createMany(skipDuplicates)` + `ownerId` 唯一约束保证并发 onboarding 幂等，重复创建不会覆盖已有资料。
- 服务端从有效会话读取用户 ID，忽略客户端提交的 `ownerId` / `id`；所有数据库读写按 owner 过滤。
- `Studio` 开启 `ENABLE ROW LEVEL SECURITY` 和 `FORCE ROW LEVEL SECURITY`，策略同时限制 `USING` 与 `WITH CHECK`。
- 数据访问层在同一事务内用 `set_config('app.studio_owner_id', userId, true)` 注入会话身份，事务结束后不泄漏到连接池下一请求。
- **生产运行数据库角色必须是 `NOSUPERUSER NOBYPASSRLS`**；PostgreSQL 超级用户和 BYPASSRLS 角色会绕过 RLS，即使 FORCE 也不例外。迁移账号可以另用高权限角色。应用层 owner 过滤始终执行。
- 测试使用事务内临时非超级用户角色验证真实 RLS；事务回滚后角色与临时授权一起消失。
- 新迁移：`prisma/migrations/20261008010000_nails_studio/migration.sql`，已应用到本地数据库，无重置或数据删除。

演示 `/nails/demo` 使用组件内示例文字，无数据库访问、无共用演示账号、无写操作。

### 作品素材库（工作包 2）

- `MediaAsset`：`id`、`studioId`（外键 → Studio）、`key`（存储对象路径）、`mimeType`、`byteSize`、`width`、`height`、创建时间；素材独立于单篇笔记，属于 studio，可被多次选择复用。
- 存储 key 方案：`nails/<studioId>/<assetId>.png`，与既有生成图 `gen/` 和公开导出图 `pub/` 前缀并列，互不冲突；`src/lib/storage.ts` 的 key 校验正则同时接纳三个前缀，拒绝其余路径（防止路径穿越写入任意位置）。
- 上传流程：客户端用 `readImageFileWithSize`（`src/lib/image-file.ts`）读取、校验类型、按最大边长（1600px）压缩并优先编码为 WebP，任一编码结果超过 2MB（`MAX_ENCODED_CHARS`）就降级到 PNG 再到 JPEG，保证三种编码路径都有体积上限，返回 dataURL；Server Action `uploadMediaAssetsAction`（`src/lib/actions/media-assets.ts`）再次校验类型/大小/数量上限（单批 ≤5 张），不信任客户端已校验的结果；成功的条目逐一落盘并写入 `MediaAsset` 记录。
- 读取：`/api/nails-media/[...key]` 校验当前会话、key 归属当前用户的 studio、记录存在，三者皆满足才返回图片字节；否则匿名 401、跨 studio 或不存在 404，不泄漏存在性之外的信息。
- 删除：`deleteMediaAssetAction` 校验 owner 后删除数据库记录与存储对象；数据库删除优先，存储对象删除失败目前只记录为已知技术债（见下方技术债），不会让已删除记录继续可读。
- RLS：`MediaAsset` 同 `Studio` 一样开启 `ENABLE/FORCE ROW LEVEL SECURITY`，策略通过 `app.studio_owner_id` 关联 `Studio.ownerId`；事务内注入身份，事务结束不泄漏。
- 新迁移：`prisma/migrations/20261008014507_nails_media_asset/migration.sql`，已应用到本地数据库，无重置或数据删除。

## 文件地图

| 文件/目录 | 用途 |
| --- | --- |
| `src/app/nails/` | 登录、首次设置、工作区、演示、加载与错误页面 |
| `src/components/nails/` | 表单、底部导航、底部弹层、卡片/空状态、退出登录 |
| `src/lib/actions/nails-auth.ts` | OTP 发送/验证/自动注册/退出；复用现有认证基础 |
| `src/lib/actions/studio.ts` | 验证会话与输入后创建、更新个人工作室 |
| `src/lib/nails/` | 工作区访问保护、输入和返回路径验证 |
| `src/lib/db/studios.ts` | 带 owner 过滤和事务内 RLS 身份的数据库访问 |
| `src/lib/db/email-tokens.ts` | 增加 login 用途、并发安全的发送限流 |
| `src/lib/actions/auth.ts`、现有 auth 页面/表单 | 保留安全的 next 路径，打通主平台密码注册/验证到 Nails 的返回流程 |
| `src/proxy.ts` | Nails 受保护路由跳转到 Nails 登录；开放独立演示 |
| `src/i18n/messages/{zh,en}/nails.json` | 双语文案键，沿用 next-intl |
| `src/lib/db/media-assets.ts` | MediaAsset 的 list/create/delete，事务内 RLS 身份 |
| `src/lib/actions/media-assets.ts` | 上传（压缩后落盘+建记录）、删除 Server Actions，服务端二次校验类型/大小/数量 |
| `src/app/api/nails-media/[...key]/route.ts` | 鉴权 + 归属 + 存在性校验后的图片读取路由 |
| `src/components/nails/media-library.tsx` | 素材库网格、多选、处理中反馈、删除确认、选中排序 UI |
| `scripts/nails-probe.ts` | 新工作区集成检查、并发、鉴权与 RLS 验证（含 MediaAsset 专项） |

Button、Input、Card、Toast 复用 `src/components/ui`；BottomSheet 基于既有 Base UI Dialog，支持焦点管理、Esc 关闭和手机底部布局。颜色、字体、间距沿用共享设计 token，没有添加第二套品牌。

## 验证与复现

测试会创建临时 `@example.com` 用户并在结束后清理，只允许 localhost 服务与数据库，不允许已配置真实邮件服务。RLS 测试需要本地开发数据库账号具有创建临时角色的权限。

```sh
# 开发服务已运行在 3002 时
NAILS_DEV=1 npx tsx scripts/nails-probe.ts http://localhost:3002

# 生产模式验证
npm run build
npx next start -p 3011
# 另一终端：
npx tsx scripts/nails-probe.ts http://localhost:3011
npx tsx scripts/auth-probe.ts http://localhost:3011
```

已通过（工作包 1，历史记录）：

- 生产构建及 TypeScript。
- 本次变更文件 ESLint。
- Prisma schema validate、migrate status、数据库/schema diff 无差异。
- Nails 双语键完全一致、非空，英文无中文残留。
- 开发模式集成检查 53 项；生产模式 51 项（生产未配邮件时按预期拒绝发送）。
- 既有认证探针：注册、邮箱大小写、验证码过期/并发猜码限制、登录锁定、密码重设及旧会话失效、老手机号账号兼容。修正了探针中已过时的默认跳转 `/templates` 断言，当前既有默认为 `/dashboard`。
- Chromium 浏览器实际操作通过 15 项检查：错误验证码提示、浏览器时区预选、首次进入工作室、刷新保持会话、底部弹层、预约导航、资料与时区保存后刷新、中英文切换、退出登录保护及无运行时错误。320 / 390 / 768 / 1280 px 宽度均无横向溢出；另验证了无需登录的 Demo 导航。

已通过（工作包 2「作品素材库」，本次）：

- `npm run typecheck`（`next typegen && tsc --noEmit`）、`npx eslint src scripts --quiet`：均无报错。
- `npx prisma validate`、`npx prisma migrate status`：schema 有效，13 个迁移已全部应用，数据库 schema 与 schema.prisma 一致。
- `NAILS_DEV=1 npx tsx scripts/nails-probe.ts http://localhost:3002`：**62 项全部 PASS**，含本次新增的 9 项 MediaAsset 专项检查（RLS 无身份时拒绝读取、RLS 隐藏其他 owner 的素材、RLS 阻止跨 owner 删除、RLS 放行自己的素材、匿名请求 401、跨 studio 请求 404、同一 owner 请求 200 且字节与 content-type 正确、格式正确但不存在的 key 返回 404 而非 500、删除后的素材不可再读取）。RLS 断言使用事务内创建的真实受限 Postgres 角色（`NOLOGIN NOSUPERUSER NOBYPASSRLS`），不是走应用自身绕过 RLS 的连接。
- `node scripts/check-i18n.mjs`：残留问题均为本次改动之前、与 Nails 无关的既有文件（`src/app/demo/design-system`、`src/lib/db/calendar.ts`、`src/lib/db/nl-order.ts`、`src/lib/marketing-calendar/*` 等），`grep -i nails` 命中为 0，本次未引入新的双语问题。
- Chromium 真实浏览器操作（390px 宽，Playwright）：空状态 → 一次上传 5 张（JPEG，800×800，逐张压缩为 PNG）成功显示 → 一次上传 6 张被客户端正确拒绝（toast 提示，网格仍为 5 张，无部分上传）→ 全选 5/5 显示排序条、首尾移动按钮正确禁用 → 点击“Move right”后相邻两张顺序互换 → 点击删除图标弹出确认对话框 → 确认删除后网格与已选排序条同步减至 4 张 → 整页刷新后 4 张仍在（选中状态按预期清空，这是前端瞬时状态，不持久化）→ 登出并用全新第二邮箱账号登录、完成 onboarding 建立工作室 B，`/nails/create` 显示空素材库，看不到工作室 A 的任何照片。全部步骤均截图存档于 `docs/nails/shots/`。
- `/code-review high`：发现 2 条，均已修复。
  1. `isNailsMediaServable`（`src/lib/db/media-assets.ts`）原先走不设置 `app.studio_owner_id` 的裸 `prisma` 客户端查询，与同文件其余三个函数的 RLS 事务模式不一致。本地开发数据库角色默认绕过 RLS，所以 bug 在本地和探针里都不会暴露；但按本文档「生产运行角色必须 `NOSUPERUSER NOBYPASSRLS`」的既定约束，生产环境下 `current_setting('app.studio_owner_id', true)` 未设置时策略判定为假，这个函数会对任何合法 owner 的请求都返回“不存在”，导致 `/api/nails-media/[...key]` 对所有真实用户的所有图片一律 404——这是正确性/可用性 bug，不是越权漏洞（因为调用方 `route.ts` 已经用 RLS 事务查出的 `studio.id` 做过一次归属比对）。已改为接收 `userId` 并复用 `withOwner()` 事务包装，与同文件其他函数一致；`nails-probe.ts` 的 “Owner can fetch their own media” 等 9 项 MediaAsset 检查修复后仍全部 PASS。
  2. `src/lib/image-file.ts` 的 WebP 编码分支（`readImageFileWithSize`）此前没有 `MAX_ENCODED_CHARS` 体积上限检查（PNG/JPEG 降级分支有），单张在极端复杂图片下可能产出偏大的 dataURL；5 张一批时理论上可能让请求体逼近/超过 `next.config.ts` 里 `serverActions.bodySizeLimit: "12mb"`，表现为框架层 413 而不是友好的“文件过大”提示。已给 WebP 分支补上同样的 2MB 上限检查，三条编码路径（WebP/PNG/JPEG）现在都有体积上限，5 张批次理论上限收敛到约 10MB，在 12MB 限制内留有余量。
- `/security-review`：无高置信度发现。审查过程中也看到了 `isNailsMediaServable` 的裸查询，但判定为不可利用（调用方已用 RLS 校验过 `studio.id` 归属，不存在越权读取路径）——这与上面 code-review 的结论并不矛盾：一个是“没有越权风险”，一个是“生产环境下合法用户会读不到自己的图”，两者是不同维度的问题，已按 code-review 的结论修复。

全仓 `node scripts/check-i18n.mjs` 仍有本次之前已存在的问题：`customers.columns.actions` 为空、旧设计演示/日历等文件含内联中文。没有将这些无关页面混入此次修改，不能将全仓双语检查宣称为通过。

浏览器验收截图位于 `docs/nails/shots/`（已跟踪进 git，与 `preview/` 不同，这批图直接作为交付证据）。真实手机硬件及实际邮件投递还需要在部署后验收。

## 下次从这里继续

下一工作包是 **预约本与空档引擎（P0）**：营业时间、预约增改取消、空档、冲突与关闭时间。先读 `docs/nails/WORK-PACKAGES.md` 第 3 包的任务与验收标准。

不要把现有营销日历当作预约引擎；不要提前接入自动发帖、自动读取私信、会员/礼卡/POS。Post 编辑器（工作包 4）依赖素材库但尚未开始，不要提前在素材库之外实现笔记编辑。

本次开始前仓库已有 Logo 相关未提交改动：`docs/brand/logo-assets.md`、`scripts/build-logo-assets.mjs` 和四个 `public/brand/*-480.*` 新文件，已保留。工作包 1、2 均未提交 Git commit，也未推送或部署（除非本次完成报告注明已提交）。
