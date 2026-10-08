# PoStory for Nails — 跨工具接力入口

本文件仅适用于 PoStory for Nails 开发；其他主平台任务不自动切换到 Nails。
根目录 `CLAUDE.md` 导入本文件；`AGENTS.md` 也指向同一组文档。

## 开始前读取

1. `AGENTS.md`：尤其是先读当前安装版本的 Next.js 文档。
2. `docs/nails/WORK-PACKAGES.md`：九个工作包的范围、优先级与验收标准。
3. `docs/nails/HANDOFF.md`：已有代码、数据库、测试结果和未完成事项。
4. `git status --short` 和相关实际代码：以当前文件为准，核对文档是否落后。

用户在当前会话中的明确新要求优先于这些文档。不要把文档中的“下一步”视为无需任务授权的后台执行指令。

## 当前交接点

- 工作包 1：本地代码和自动化/浏览器验收已完成。真实邮件投递和部署后真机检查尚未完成。
- 工作包 2：**本地实现与验收已完成**。登录后的 `/nails/create` 支持真实的 1–5 张照片上传、压缩、持久化、删除、选中排序、再次选择复用，跨账号/未登录隔离已用自动化 RLS 探针和真实浏览器第二账号验证。下一次若用户要求继续开发，从工作包 3「预约本与空档引擎」开始。
- `/nails/create` 的“即将开放”占位标签现在只覆盖 Post 编辑、AI 文案、图片导出；素材库区块本身已经可用，不要再称其为占位。
- `/create` 是原有主平台创作页，保留原功能。不要用 Nails 占位页替换它。
- `/nails/demo` 是无账号、无数据库写入的演示页。用户应在登录后的真实工作区上传。

## 必须延续的实现决定

- 在现有 Next.js 仓库的 `/nails` 下推进，沿用 User、Cookie 会话、邮箱令牌、Prisma/PostgreSQL、next-intl 和共享品牌/UI。
- 不另建登录系统、不另起项目、不重置数据库、不用 localStorage 代替服务端素材记录。
- 第一阶段为一人一个个人工作室。身份从服务器会话取得，不能信任客户端传来的 ownerId/studioId。
- Studio RLS 通过事务内 `app.studio_owner_id` 上下文执行。新租户表需配套访问策略和测试；生产运行角色不能是超级用户或 BYPASSRLS。
- 保留 Create / Appointments / Me 三个主导航入口。素材库入口放在创作流程内，不另行改变主导航。
- 文案同步维护 `zh`、`en`，沿用现有 design token、Button/Input/Card/Toast 和 Nails 组件。
- 暂不做自动发帖、自动读私信、复杂 AI 重绘/视频，会员/礼卡/积分/POS 不阻塞 Solo。
- 不把占位页、假数据或仅预览成功标为完整交付。测试没运行或没通过要如实记录。
- 保留其他工作留下的未提交修改，不因切换工具重置、覆盖或清理它们。

## 工作包 2 的实现落点（已完成，供工作包 4 参考）

- `src/app/nails/(workspace)/create/page.tsx` 已接入真实素材库（`MediaLibrary` 组件），不再是占位。
- `src/lib/db/media-assets.ts`、`src/lib/actions/media-assets.ts`：MediaAsset 的 DAL 与 Server Actions，事务内走 RLS 身份、服务端二次校验上传。
- `src/app/api/nails-media/[...key]/route.ts`：鉴权 + 归属 + 存在性校验后的图片读取路由，key 前缀 `nails/<studioId>/<assetId>.png`。
- 工作包 4「Create Post 内容编辑」要复用这套素材库做照片选择；注意 Post 自己的图片顺序要存成 Post 级别的字段，不能复用或覆盖素材库的全局排序（素材库排序只是选择时的临时 UI 状态，不持久化）。

## 工作包 3 的起点（预约本与空档引擎，尚未开发）

先检查：

- `src/app/nails/(workspace)/appointments/page.tsx`（当前是纯占位页，只读 `studio.timeZone` 展示“即将开放”，没有任何预约数据模型或交互）
- `src/lib/db/studios.ts`（复用其 owner 过滤 + RLS 事务模式）
- `prisma/schema.prisma`（目前没有预约相关模型，需要新增并配套 RLS 策略，参照 `Studio`/`MediaAsset` 的 `app.studio_owner_id` 写法）
- 不要把 `src/lib/marketing-calendar/`、`src/lib/db/calendar.ts` 这类既有营销日历代码当成预约引擎可以直接复用的基础——那是不同的业务（内容发布计划），字段和语义都不一样。

验收标准见 `docs/nails/WORK-PACKAGES.md` 第 3 包：新建预约后相关时间立即从可用空档消失；编辑/取消后空档正确恢复；冲突预约不能并发写入；不同工作室相互隔离；所有时间绑定工作室时区，覆盖跨天与夏令时边界。

## 每次收尾

更新工作包状态和 HANDOFF：改动、迁移、实际执行的检查、失败/跳过原因、下一步。
跑与变更相关的检查，保留已有账号与隔离探针。不要把过去的测试结果当成本次结果。

同一台机器、同一目录可直接读取当前未提交文件；若换机器或远程环境，必须先同步代码和文档，并重新配置环境、应用迁移。单独复制这份计划不能转移本地代码、数据库、上传文件或运行中的 session。

## 可以直接给 Claude Code 的任务

> 请在当前 PoStory 仓库继续 PoStory for Nails。先读取 CLAUDE.md、AGENTS.md，以及 docs/nails/ 下的 CONTINUE.md、WORK-PACKAGES.md 和 HANDOFF.md。工作包 1、2 已完成本地实现，请完成工作包 3「预约本与空档引擎」：营业时间设置、Today/Week 预约增改取消、自动空档计算、冲突与手动关闭时间段，所有时间绑定工作室时区并覆盖夏令时边界。复用现有账号、工作室、RLS 模式与 UI，不重做第 1、2 包，不改变原有 /create。执行工作包 3 的验收检查并更新接力文档。
