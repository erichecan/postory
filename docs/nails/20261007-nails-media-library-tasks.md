# 工作包 2「作品素材库」任务台账

台账是进度唯一真相；每周期从读这里开始。来源计划：[20261007-nails-media-library-dev-plan.md](./20261007-nails-media-library-dev-plan.md)。

- [x] Schema + 迁移：`MediaAsset` 模型、Studio 反向关系、RLS 策略
      验收命令：`npx prisma validate && npx prisma migrate status`
      可看物：（无 UI，纯 schema）
      定性状态：不涉及
      证据：`The schema at prisma/schema.prisma is valid` / `Database schema is up to date!`（13 migrations found）
      依赖：无

- [x] 存储层：`nails/` key 前缀、key 校验收紧为仅接纳 `gen/`、`pub/`、`nails/` 三前缀
      验收命令：`npx tsc --noEmit`（经 `npm run typecheck` 跑 `next typegen && tsc --noEmit`）
      可看物：（无 UI）
      定性状态：不涉及
      证据：`✓ Types generated successfully`，无类型错误
      依赖：Schema 完成

- [x] 数据访问层 `src/lib/db/media-assets.ts`（list/create/delete + RLS 事务）
      验收命令：`npx tsc --noEmit`
      可看物：（无 UI）
      定性状态：不涉及
      证据：同上；另见下方 RLS 探针证据
      依赖：存储层完成

- [x] Server Actions（上传 / 删除）
      验收命令：`npx tsc --noEmit`
      可看物：（无 UI，下一条联调后才可看）
      定性状态：不涉及
      证据：typecheck 通过；浏览器实测见下方 UI 条目
      依赖：数据访问层完成

- [x] 读取路由 `/api/nails-media/[...key]`（鉴权 + 归属 + 存在性）
      验收命令：`NAILS_DEV=1 npx tsx scripts/nails-probe.ts http://localhost:3002`
      可看物：（无 UI）
      定性状态：不涉及
      证据：新增 9 项 MediaAsset 专项检查全部 PASS（匿名 401、跨工作室 404、同一所有者 200 且字节/类型一致、不存在 key 404、删除后 404），详见 HANDOFF.md
      依赖：Server Actions 完成

- [x] UI：素材库网格 + 多选上传 + 处理中/成功/失败反馈 + 删除 + 选中顺序调整
      验收命令：Chromium 实际操作（390px 宽）
      可看物：docs/nails/shots/20261007-media-library-*.png（空状态、5 张上传、超量拒绝提示、已选排序、重排后、删除确认弹窗、删除后、刷新后持久化、跨账号隔离）
      定性状态：待你确认
      证据：全部操作在真实浏览器中执行并截图，见 DEV-REPORT 场景表
      依赖：读取路由完成

- [x] 双语文案 `nails.json`（zh/en 新键同步）
      验收命令：`node scripts/check-i18n.mjs`
      可看物：（随上条 UI 截图一并体现）
      定性状态：不涉及
      证据：check-i18n 报告的残留问题均为本次改动之前、与 Nails 无关的既有文件（design-system demo、营销日历等），`grep -i nails` 命中为 0
      依赖：UI 完成

- [x] 隔离与鉴权验证：跨账号/未登录读取、删除他人素材
      验收命令：`nails-probe.ts`（自动化 RLS 探针）+ Chromium 真实浏览器第二账号
      可看物：docs/nails/shots/20261007-media-library-cross-account-isolated.png
      定性状态：符合
      证据：自动化探针用事务内受限 Postgres 角色证明 RLS 拒绝跨所有者读/删；浏览器中创建第二个真实账号「测试美甲工作室B」，/nails/create 显示空素材库，看不到工作室 A 已上传的 4 张照片
      依赖：读取路由 + Server Actions 完成

- [x] 收尾：更新 WORK-PACKAGES.md、HANDOFF.md、CONTINUE.md 下次起点
      验收命令：（文档核对）
      可看物：（文档本身）
      定性状态：不涉及
      证据：见对应文件改动
      依赖：以上全部完成
