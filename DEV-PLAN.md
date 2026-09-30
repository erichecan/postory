# DEV-PLAN · Postory 真实发布（Ayrshare）+ Orshot 现状核实

日期：2026-09-29　上一版（商业化）：`docs/20260928-DEV-PLAN-v2-商业化.md`

## 0. 读取的文档

- 无 PRD 文件。需求来源：用户对话原话，逐字存档于 `docs/20260927-postory-需求原话.md`「2026-09-29 Ayrshare / Orshot 接入讨论」
- 早期归档方案（不同产品形态，仅作技术参考）：`docs/social-agency/20260927-DEV-PLAN.md`、`系统架构设计.md`、`详细设计.md`、`social-agency-tasks.md`、`code/src/lib/providers/{ayrshare,orshot,types}.ts`、`code/src/lib/crypto.ts`
- 当前代码现状核查：`prisma/schema.prisma`（User/Design/Template/Generation）、`src/lib/platforms.ts`、`src/components/editor/publish-dialog.tsx`、`src/lib/actions/designs.ts`、`src/lib/storage.ts`、`src/app/api/media/[...key]/route.ts`、`src/components/editor/export-page.ts`
- 官方文档实时核实（WebFetch，2026-09-29）：Ayrshare `apis/overview`、`apis/profiles/overview`、`multiple-users/*`、`apis/post/post`、`additional/mcp-action-server`、`pricing`；Orshot `api-reference/render-from-template`、`orshot-embed/introduction`、`pricing`

## 1. 目标与范围

**目标**：把现在"点发布只是本地扣费、状态机打勾"的假发布，换成真的调用 Ayrshare 把设计图发到社交平台；同时把 Orshot 的定位说清楚——不是"模板库哪来的"这件事有歧义，而是要不要真的接 Orshot 的 API/编辑器。

**做**（2026-09-29 更新：既然免费试用本身就含多租户能力，改为直接做多租户，不留后补）

- 服务端真实调用 Ayrshare `/post`，**多租户 Profile 模式**：每个 postory 用户对应一个 Ayrshare Profile，各自连接各自的社交账号，互相隔离
- 每个用户一个"连接社交账号"页面：点某平台 → 后端建/取该用户的 Profile-Key → 生成 Ayrshare 托管的连接链接 → **新标签页打开**（官方明确不支持 iframe 嵌入）→ 连接完跳回站内 → 站内刷新该用户已连接平台列表
- 设计导出图从"纯浏览器截图下载"改为额外上传到服务器 → 生成公开可访问 URL → 传给 Ayrshare 当 `mediaUrls`
- Ayrshare 提供商自适配层：`AYRSHARE_MODE=fake|real`，仿照现有 `AI_PROVIDER`/`STRIPE_MODE` 的假档模式，默认 fake，代码全部走完整链路（含建 Profile、连接、发布）但不花钱、不真调用
- `PublishDialog` 只能勾选**当前用户自己**真正连接了的平台，不会出现选了却发不出去的情况
- Ayrshare Profile-Key 按 social-agency 方案的 `crypto.ts`（AES-256-GCM）加密落库，不明文存
- Orshot：**不接入**（详见第 5 节理由），继续用现有自建 canvas 渲染引擎；把这个决定和理由写清楚，避免以后有人以为"模板显示"还差一步 Orshot 集成

**不做**

- 真去注册 Ayrshare Launch 试用账号、真的调用真实平台连接/发一条帖子——这一步需要你先决定"现在就要真验证"还是"先把代码全部写完、demo 走通再验证"，见下方确认点
- Orshot Render API / Embed 编辑器接入
- Webhook 接收 Ayrshare 发布状态回调（要 Business 档才有，暂时用"发布时同步拿到的状态"，不做异步回调）
- X/Twitter 自 2026-03-31 起需要额外的 OAuth1.0a Key/Secret（应用级，不分用户）——先不接 X 平台的真实发布，等你有自己的 Twitter Developer 账号再补

## 2. 模块拆解

1. **Provider 适配层** `src/lib/ayrshare.ts`：`createProfile(userId)`、`createConnectLink(profileKey, redirectUrl)`、`getConnectedAccounts(profileKey)`、`publish({ profileKey, platforms, mediaUrl, caption, scheduleDate })`；fake 模式全部返回构造好的成功结果，不发请求。平台名映射表（本项目 `"x"` → Ayrshare `"twitter"`；`"xiaohongshu"`/`"douyin"`/`"wechat-moments"` 不在 Ayrshare 支持列表内，标记为"仅记录、暂不真实发布"）
2. **社交账号连接页**（新增 `/profile` 下的一个区块或独立页面）：按平台列出连接状态，未连接显示"连接"按钮（`window.open` 打开 Ayrshare 托管页，禁止用 `<a>` 普通跳转——官方要求用 `window.open`）；已连接显示账号名 + "断开"
3. **导出转公开图**：复用现有 `export-page.ts` 的浏览器端渲染，产出 PNG 后 `POST /api/designs/[id]/publish-asset` 上传到服务器，存 GCS 一个新前缀 `pub/`，返回公开 URL（这类图本来就是要给用户拿去公开发布的内容，公开托管没有隐私问题）
4. **发布动作改造**：`scheduleDesignAction` 拆成"校验+扣费"（不变）+ 新增"用该用户的 Profile-Key 真调用 Ayrshare"一步；写回 `Design.ayrsharePostId`/`publishStatus`/`publishError`

## 3. Schema 设计

```prisma
enum PublishStatus {
  PENDING
  SUCCESS
  PARTIAL
  FAILED
}

model User {
  // ...现有字段不变，新增：
  ayrshareProfileKeyEnc String?  // AES-256-GCM 加密存储，复用 social-agency 版 crypto.ts
  ayrshareRefId         String?  // Ayrshare 返回的 profile 标识
  socialAccounts        SocialAccount[]
}

model SocialAccount {
  id          String    @id @default(cuid())
  userId      String
  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  platform    String    // ayrshare 平台名，如 "facebook" "instagram" "twitter"
  handle      String?
  connectedAt DateTime?
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  @@unique([userId, platform])
}

model Design {
  // ...现有字段不变，新增：
  caption           String?        @db.Text
  exportedImageUrl  String?
  ayrsharePostId    String?
  publishStatus     PublishStatus?
  publishError      String?        @db.Text
}
```

对齐早期 social-agency 方案的踩坑：Profile-Key 是"一个用户一把，8 个平台共用"，所以挂在 `User` 上而不是 `SocialAccount` 上（`SocialAccount` 只存纯连接状态，避免同一个 key 在多行里冗余存多份）。

## 4. 路由 / Actions 清单

| 路径 | 方法 | 说明 |
| :-- | :-- | :-- |
| `connectSocialAction(platform)` | Server Action | 若用户还没有 Profile 先建一个，再建 link session，返回 URL 给前端 `window.open` |
| `/api/social/callback` | GET | Ayrshare 连接页跳回来的落地页，刷新该用户 `GET /user`（带其 Profile-Key）写回 `SocialAccount`，再跳回站内连接页 |
| `disconnectSocialAction(platform)` | Server Action | 删除本地 `SocialAccount` 记录（Ayrshare 侧断开需要用户自己在其托管页操作，我们只能清本地状态） |
| `/api/designs/[id]/publish-asset` | POST | 登录用户上传导出的 PNG，存 GCS `pub/` 前缀，返回公开 URL |
| `/api/public-media/[...key]` | GET | 公开只读，仅匹配 `pub/` 前缀 key（正则拦截，不会读到 `gen/` 私有前缀） |
| `scheduleDesignAction`（改造）| Server Action | 扣费后用当前用户的 Profile-Key 调用 `ayrshare.publish()`，写回状态 |

## 5. 风险点 / 需要你确认的判断

1. **Orshot：建议不接入，维持现状**——官方 Render API 只返回渲染后的图片，不暴露完整图层坐标数据；现有 273 个模板的图层 JSON（含 position/parameterizable 等）大概率不是 Orshot 官方 API 导出格式，无法证实这些模板 ID 在 Orshot 上还有效。Embed 编辑器是 iframe 方案，去水印要 Grow 档 $160/月起，且受 Orshot 自家 SDK 能力边界限制（双语支持、深度产品化都不确定）。现有自建渲染器已经上线在用、免费、双语、完全可控。**这条和你最初"最好整合 Orshot 编辑器"的期望不一样，如果你仍然想做，请明确说，我会按 Embed 方案单独评估成本。**
2. **Ayrshare 试用时机与上限**：Launch 档 28 天免费试用从注册那天开始计时，不是"用了才算"；且 Launch 档上限 **10 个 Profile**（10 个用户连接账号），够开发/demo/小范围验证用，真上线给更多真实用户用之前要决定续费 Business 档（阶梯计费，$599/月起）还是别的方案。建议代码先按 fake 模式全部写完、demo 环境走通"建 Profile → 连接 → 发布"整条链路，你看完截图确认没问题后，我们再去注册试用、切 `AYRSHARE_MODE=real` 做真实发布验证，避免试用期在开发阶段被空耗。新增环境变量 `AYRSHARE_API_KEY`（主账号）、`ENCRYPTION_KEY`（AES 密钥，`openssl rand -base64 32` 生成，和 `AUTH_SECRET` 分开）。
3. **平台覆盖缺口**：Ayrshare 不支持小红书、抖音、微信朋友圈（没有这三个平台的公开 API）。现有 `PUBLISH_PLATFORMS` 里的 `xiaohongshu`/`douyin`/`wechat-moments` 会继续保留为"仅记录发布计划，不真实调用"，其余（Facebook/Instagram/TikTok/X/YouTube/Pinterest/LinkedIn/Threads）走真实发布。
4. **MCP Action Server 不用**：官方说明它和 REST API 走同一套后端逻辑，是给 AI Agent 直接操作用的，我们是普通 Next.js 后端服务间调用，直接用 REST `/post` 更直接，不引入这层。
5. **图片公开托管**：发布用的导出图会放在公开可读的存储路径下（Ayrshare 服务器要能直接抓取），不再是私有权限。这些图本来就是用户主动要发到公网社交平台的内容，公开托管本身不产生新的隐私暴露。

## 附录 A · 技术验收标准（verify.sh 新增项）

- `npx tsc --noEmit`、`npm run build`、`npx prisma migrate status` 照旧
- 路由探针：`/api/designs/[id]/publish-asset`、`/api/social/callback` 未登录 401；`connectSocialAction`/`disconnectSocialAction` 未登录/无权限拒绝；`/api/public-media/xxx` 不存在的 key → 404，且用私有 `gen/` 前缀的 key 必须 404（拦截生效，探针里专门造一个 `gen/` key 断言不可读）
- `AYRSHARE_MODE=fake` 时：跑一次完整"建 Profile → 连接 → 发布"流程（unit/集成测试用 mock），断言不产生任何出站 HTTP 请求到 `api.ayrshare.com`
- 单元测试：平台名映射表（`x` → `twitter`）、小红书/抖音/朋友圈不触发真实调用只走本地记录；`crypto.ts` 加解密往返、篡改密文后必须报错、`ENCRYPTION_KEY` 未配置时明确报错
- A 用户不能读到 B 用户的 `SocialAccount`/发布状态（多租户隔离探针）
- 泄露扫描：新增 `AYRSHARE_API_KEY`、`ENCRYPTION_KEY` 加入 `.next/static` 密钥泄露 grep 清单

verify.sh 不过不许写完成报告；本阶段不接入真实 Ayrshare 账号，"真实发布成功"这一条在你决定开始付费验证前，DEV-REPORT 里标 **⚠️ 未验证**，不冒充已完成。
