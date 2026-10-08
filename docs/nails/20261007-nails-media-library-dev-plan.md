# PoStory for Nails — 工作包 2「作品素材库」DEV-PLAN

状态：待确认。确认后按此计划执行，不再逐项打断。

## 读取了哪些文档

- `AGENTS.md`、`docs/nails/CONTINUE.md`、`docs/nails/WORK-PACKAGES.md`、`docs/nails/HANDOFF.md`
- 现有代码：`src/lib/storage.ts`、`src/lib/image-file.ts`、`src/lib/ai/image-bytes.ts`、`src/app/api/media/[...key]/route.ts`、
  `src/lib/db/studios.ts`、`src/lib/nails/workspace.ts`、`src/app/nails/(workspace)/create/page.tsx`、
  `prisma/schema.prisma`、`prisma/migrations/20261008010000_nails_studio/migration.sql`、`src/components/create/studio-controls.tsx`、
  `src/lib/actions/generations.ts`（现有图片上传落库的参照实现）

## 模块拆解

1. **Schema**：新增 `MediaAsset` 模型（studio 私有素材），`Studio` 加反向关系。
2. **存储**：`storage.ts` 新增 `nails/<studioId>/<assetId>.<ext>` key 前缀，和现有 `gen/`（AI 生成）、`pub/`（公开导出）隔离，互不影响。
3. **数据访问层**（`src/lib/db/media-assets.ts`）：list / create / delete，事务内注入 `app.studio_owner_id`，复用 `studios.ts` 的 RLS 写法。
4. **Server Actions**（`src/lib/actions/media-assets.ts`）：
   - `uploadMediaAssetsAction`：接收 1–5 张已压缩图片（含宽高），逐张解码、落存储、写库；单张失败不影响其它张，不产生"看似可用"的坏记录。
   - `deleteMediaAssetAction`：按 studio 校验归属后删库 + 删存储对象。
5. **读取路由**（`src/app/api/nails-media/[...key]/route.ts`）：登录 + studio 归属校验 + 数据库存在性校验，仿 `/api/media` 但按 studio 而非按 generation 校验。
6. **UI**（`src/app/nails/(workspace)/create/page.tsx` + 新 `src/components/nails/media-library.tsx`）：
   - 素材网格（已持久化素材，最近优先）。
   - 多选文件输入（1–5 张/批），逐张显示处理中/成功/失败/重试反馈。
   - 删除素材（二次确认）。
   - 当前选中素材的顺序调整（上移/下移），为工作包 4 的 Post Media 做铺垫，本包不落盘"笔记顺序"（笔记还不存在）。
7. **双语文案**：`nails.json` 新增素材库相关键（zh/en 同步）。
8. **测试**：`scripts/nails-probe.ts` 增加 MediaAsset 的 RLS 隔离探针 + 读取路由鉴权探针；浏览器实际操作验证上传/删除/排序/跨账号隔离。

## Schema 设计

```prisma
model MediaAsset {
  id        String   @id @default(cuid())
  studioId  String
  studio    Studio   @relation(fields: [studioId], references: [id], onDelete: Cascade)
  key       String   @unique
  mimeType  String   @db.VarChar(32)
  byteSize  Int
  width     Int
  height    Int
  createdAt DateTime @default(now())

  @@index([studioId, createdAt])
}
```

`Studio` 增加 `mediaAssets MediaAsset[]`。

RLS（新迁移 SQL）：

```sql
ALTER TABLE "MediaAsset" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MediaAsset" FORCE ROW LEVEL SECURITY;
CREATE POLICY "media_asset_owner" ON "MediaAsset"
    USING ("studioId" IN (SELECT "id" FROM "Studio" WHERE "ownerId" = current_setting('app.studio_owner_id', true)))
    WITH CHECK ("studioId" IN (SELECT "id" FROM "Studio" WHERE "ownerId" = current_setting('app.studio_owner_id', true)));
```

## 路由清单（新增）

| 方法 | 路径 | 鉴权 |
| --- | --- | --- |
| GET | `/api/nails-media/[...key]` | 登录 + studio 归属 + 素材存在性 |
| Server Action | `uploadMediaAssetsAction` | 登录 + studio |
| Server Action | `deleteMediaAssetAction` | 登录 + studio |

## 风险点

- **存储 key 冲突**：新前缀 `nails/` 与现有 `gen/`、`pub/` 正则互斥，`isMediaKey` 需要同时接受三种前缀，否则 `putObject`/`getObject`/`deleteObject` 会拒绝写入；已在设计中明确三者并存。
- **孤儿存储对象**：删除素材时如果存储删除失败（网络抖动等），数据库记录已删但对象文件可能残留；记录为已知技术债，不阻塞交付（没有列出路径就不会被读取，不构成数据泄露）。
- **大小/数量限制**：复用现有 `image-file.ts` 单图 15MB 压缩上限与 Server Action 12MB 请求体上限；5 张压缩后图片合计需小于 12MB，按现有压缩参数（最长边 1600px、WebP 0.85）估算单图通常 < 400KB，5 张合计远低于上限，暂不需要改请求体上限。
- **RLS 子查询性能**：`MediaAsset` 策略里按 `studioId IN (SELECT ...)` 子查询，数据量级（单工作室至多几百张素材）下可忽略；若后续放大需要再评估是否冗余存 `ownerId` 列。

## 附录 A：技术验收标准

- `npx tsc --noEmit`、`npm run build`、`npx prisma migrate status` 通过。
- `prisma validate` 通过；`MediaAsset` 迁移本地应用成功、无数据重置。
- `scripts/nails-probe.ts` 新增项全部 PASS：
  - 跨 studio 无法读取/删除对方素材（RLS + 应用层双重拒绝）。
  - 未登录请求 `/api/nails-media/...` 返回 401；已登录但非该 studio 返回 404。
  - 删除不存在/不属于自己的素材返回失败而非静默成功。
- 浏览器实际操作（Chromium，手机宽度 390px）：
  - 选择 1 张、选择 5 张、选择 6 张（应提示超限、不上传）。
  - 上传成功后刷新页面、重新登录仍可见；删除后刷新不再出现。
  - 上移/下移调整选中素材顺序，UI 状态正确。
  - 另一账号登录看不到该素材。
- 无命令输出的条目标记 ⚠️ 未验证，不写入"符合"。

## 歧义清单

- WORK-PACKAGES.md 未说明单批选择超过 5 张时的行为 → 按保守解释处理：整批拒绝并提示"一次最多选 5 张"，不静默丢弃用户选择的照片、不只取前 5 张。

## 假设清单

- 单图上传大小沿用现有 `image-file.ts` 的 15MB 原始文件上限与压缩逻辑，不新增限制。
- 素材库暂不做分页 UI（当前验收标准未要求），仅加索引防止列表查询随数据量退化；一次列表查询加 100 条上限兜底极端情况。
- 图片宽高在浏览器端读取（复用现有 `<img>` 解码得到的 `naturalWidth/naturalHeight`），随压缩后的图一起提交，服务器不重新解析图片字节，不引入新的图片处理依赖。
