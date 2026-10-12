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

- 工作包 1–8：本地实现完成；3–4、6–8 已通过相应本地集成验收。工作包 5 的 Anthropic 服务端接口、事实约束、编辑/失败回退已实现，真实模型调用需配置 `ANTHROPIC_API_KEY`。
- 工作包 9：类型检查、Lint、数据库迁移状态、生产构建和预约/笔记隔离探针通过。生产邮件、云存储、HTTPS、真机与备份恢复仍需真实上线环境验收。
- `/nails/create` 当前包含可用素材库和笔记创建入口；笔记编辑位于 `/nails/posts/[id]`，历史位于 `/nails/posts`，预约位于 `/nails/appointments`。
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

## 工作包 2 的实现落点（已完成）

- `src/app/nails/(workspace)/create/page.tsx` 已接入真实素材库（`MediaLibrary` 组件），不再是占位。
- `src/lib/db/media-assets.ts`、`src/lib/actions/media-assets.ts`：MediaAsset 的 DAL 与 Server Actions，事务内走 RLS 身份、服务端二次校验上传。
- `src/app/api/nails-media/[...key]/route.ts`：鉴权 + 归属 + 存在性校验后的图片读取路由，key 前缀 `nails/<studioId>/<assetId>.png`。
- 笔记照片顺序在 `NailsPostMedia` 中单独保存；同一素材可复用于多篇笔记。删除素材会级联移除笔记图片引用，但保留笔记正文。

## 工作包 3–8 实现落点

- 预约与空档：schema、时区/DST 工具、预约 DAL/Actions 与 Today/Week 页面，迁移 20261008023000_nails_appointments；包含排他约束、事务锁和 RLS。
- 笔记与发布：NailsPost、NailsPostMedia、NailsPostAvailability、NailsPostExport；owner-scoped DAL/Actions、编辑器、私有图片导出与鉴权下载。迁移 20261008033000_nails_posts、20261008035000_nails_post_media_cascade。
- AI 文案使用 Anthropic SDK；ANTHROPIC_TEXT_MODEL 可覆盖模型。缺少 ANTHROPIC_API_KEY 时仍可手工编辑/导出；每篇最多 5 次生成请求，提示约束价格、优惠和空档等事实。
- 探针：scripts/nails-appointments-probe.ts、scripts/nails-posts-probe.ts、scripts/nails-probe.ts。修改 schema 后运行 prisma migrate deploy 与 prisma generate。

预约冲突、DST、营业时间与 RLS 的详细验收结果见 HANDOFF.md 和探针脚本。

## 每次收尾

更新工作包状态和 HANDOFF：改动、迁移、实际执行的检查、失败/跳过原因、下一步。
跑与变更相关的检查，保留已有账号与隔离探针。不要把过去的测试结果当成本次结果。

同一台机器、同一目录可直接读取当前未提交文件；若换机器或远程环境，必须先同步代码和文档，并重新配置环境、应用迁移。单独复制这份计划不能转移本地代码、数据库、上传文件或运行中的 session。

## 可以直接给 Claude Code 的任务

> 请在当前 PoStory 仓库继续 PoStory for Nails。先读取 CLAUDE.md、AGENTS.md 和 Nails 接力文档，再核对 git 状态与代码。工作包 1–8 已完成本地实现；不要重做。先运行类型检查、相关探针和生产构建。后续沿用当前 Prisma/PostgreSQL、工作室 RLS、Next.js 16 文档要求和中英双语，保留用户现有未提交改动。生产部署、发邮件或修改外部资源前，先确认目标环境和凭据。
