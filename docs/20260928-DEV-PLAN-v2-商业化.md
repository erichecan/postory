# DEV-PLAN · Postory 商业化（会员 · credit · AI 生图 · Stripe）

日期：2026-09-28　上一版（演示原型）：`docs/20260927-DEV-PLAN-v1-原型.md`

## 0. 读取的文档

- 无 PRD 文件。需求来源：用户对话原话，逐字存档于 `docs/20260927-postory-需求原话.md`「2026-09-28 商业化讨论」
- 讨论稿：`docs/20260928-postory-商业化框架.md`
- 用户确认：6 个待定点"都按推荐来"（2026-09-28）

## 1. 目标与范围

**目标**：把演示原型变成能收钱的产品——会员方案每人单独定价，用 credit 计量模板出图和 AI 生图，通过 Stripe 收 EUR / CAD。

**做**
- 会员等级（只展示权益，不公开价格）+ 每个客户一份专属方案（管理员配置）
- Credit 账本：模板出图 1 · AI 标准图 1 · AI 高清图 2；月度额度月底清零，赠送和充值的不过期
- AI 生图工作台：实拍美化（上传照片）+ 文生图，多轮改提示词，每轮扣费
- Stripe：专属方案订阅（Checkout 现场生成金额）、自助充值、账单管理、webhook
- 线下收款：管理员手动开通 N 个月 / 手动加减 credit
- 发布平台权益：基础 4 个（FB、IG、TikTok、小红书），额外平台按方案开通
- 注册改邮箱 + 验证码，验证后送 10 credit；找回密码
- 法律页（条款 / 隐私 / 退款）

**不做**
- 公开价格页
- 真实发布到社交平台（仍然只记录发布计划；平台数权益只限制"能选几个"）
- 视频生成（方案里记录每月视频条数并展示，暂时没有消耗入口）
- Stripe Tax / 增值税计算
- 移动端 App

## 2. 已定规则（来自用户）

| 规则 | 值 | 来源 |
| :-- | :-- | :-- |
| 包月基础价 | 99（EUR 客户 €99，CAD 客户 C$99） | 原话 6 + 推荐 A |
| 基础平台 | FB、IG、TikTok、小红书 | 原话 1、6 |
| 额外平台 | 每个 +30 / 月 | 原话 6 |
| 包月默认额度 | 60 credit + 4 条视频 | 推荐 |
| 模板出图 | 1 credit，**导出或加入发布计划时扣**，同一作品只扣一次 | 原话 3 + 推荐 A |
| AI 生图 | 标准 1 / 高清 2，每轮重新生成都扣 | 原话 4、5 |
| 注册赠送 | 10 credit，**只能用于模板** | 原话 4 + 推荐 A |
| 月度额度 | 到期清零 | 推荐 A |
| 超额充值 | 客户登录后自助充值，单价取方案价，默认 1 / credit | 推荐 A |
| 币种 | EUR、CAD | 原话 2 |
| 价格 | 不公开；每人单独定价；可设全包一口价 | 原话 1 |

## 3. 模块拆解

| 模块 | 内容 |
| :-- | :-- |
| M1 账号改造 | 注册改为邮箱 + 密码 + 6 位邮件验证码；登录支持邮箱或手机号（兼容老账号）；找回密码（邮件链接，30 分钟有效）；邮箱验证成功时发放 10 个赠送 credit（每个邮箱只发一次）；演示账号保留一键登录，但不能 AI 生图、不能充值 |
| M2 Credit 账本 | `CreditGrant`（一笔额度：来源、总数、剩余、可用范围、生效/到期）+ `CreditTxn`（只增不改的流水）。扣费在事务内锁用户行，按"先到期先用"从可用的 grant 里扣；失败退回原 grant。余额 = 当前有效 grant 的剩余之和 |
| M3 会员与方案 | `MembershipTier`（等级名、中英文权益说明、默认额度 / 平台数，内部参考价）；`CustomerPlan`（每客户一份：等级、币种、基础价、额外平台列表 + 单价、每月 credit / 视频、全包一口价、充值单价、状态、Stripe 订阅号）|
| M4 Stripe | 订阅：客户在「我的会员」点付款 → 服务器按方案现场建 Checkout（subscription 模式，`price_data` 动态金额）；充值：payment 模式，最少 10 credit；Customer Portal 管理卡和发票；webhook 处理 `checkout.session.completed` / `invoice.paid` / `invoice.payment_failed` / `customer.subscription.updated/deleted` / `charge.refunded`，按 event id 幂等 |
| M5 线下开通 | 管理员「线下已收款 · 开通 N 个月」→ 一次生成 N 个月度 grant，每个只在对应月份有效（不需要定时任务）；手动加减 credit，必填原因 |
| M6 AI 生图 | 工作台两种模式：实拍美化（上传照片 → OpenAI images.edit）、文生图（images.generate）；场景预设（餐饮 / 美业 / 节日，中英文）+ 店铺资料自动带入；后台先用 LLM 把用户描述扩写成专业提示词；多轮：每轮以上一张为输入继续改；结果存储（本地盘 / GCS）；可"发送到编辑器"作为新作品或替换模板图片 |
| M7 付费墙 | 顶栏余额徽章；导出 / 加入发布计划 / 生成前检查余额，不够弹出「余额不足」（有方案 → 充值；没方案 → 联系开通）；发布计划可选平台数按方案限制，没方案的不能加入发布计划 |
| M8 平台权益 | 发布目标改为 id：基础 `facebook` `instagram` `tiktok` `xiaohongshu`；额外 `x` `youtube` `pinterest` `linkedin` `threads` `douyin` `wechat-moments`；老数据迁移 |
| M9 后台 | 客户列表加"方案 / 余额"列；客户详情页（配方案、生成付款状态、线下开通、调整 credit、流水）；会员等级管理（含权益对比矩阵逐项编辑）；生成日志与成本（每日 OpenAI 成本、credit 收入、毛利） |
| M10 公开页 | `/plans` 会员权益对比（用户 2026-09-28 追加："没看到权益对比页面"）；落地页改版（卖点 + AI 前后对比 + 会员等级权益，无价格 + 联系方式）；`/legal/terms` `/legal/privacy` `/legal/refund` |

## 4. Schema 增量（Prisma）

```prisma
enum Currency { EUR CAD }
enum PlanStatus { DRAFT PENDING_PAYMENT ACTIVE PAST_DUE CANCELED }
enum PlanBilling { STRIPE OFFLINE }
enum GrantSource { SIGNUP_GIFT MONTHLY TOPUP ADMIN REFUND_RETURN }
enum GrantScope { ANY TEMPLATE_ONLY }
enum TxnKind { GRANT DEBIT REFUND EXPIRE ADJUST }
enum ChargeKind { TEMPLATE_EXPORT AI_STANDARD AI_HD }
enum GenerationMode { PHOTO_ENHANCE TEXT_TO_IMAGE }
enum GenerationStatus { PENDING SUCCEEDED FAILED }

model User {
  // 现有字段 + ↓
  email            String?   @unique @db.VarChar(254)
  emailVerifiedAt  DateTime?
  stripeCustomerId String?   @unique
  phone            String?   @unique @db.VarChar(20)   // 改为可空，兼容老账号
  plan             CustomerPlan?
  grants           CreditGrant[]
  txns             CreditTxn[]
  generations      Generation[]
}

model EmailToken {            // 注册验证码 / 找回密码
  id        String   @id @default(cuid())
  email     String   @db.VarChar(254)
  purpose   String   @db.VarChar(16)   // verify | reset
  codeHash  String
  attempts  Int      @default(0)
  expiresAt DateTime
  usedAt    DateTime?
  @@index([email, purpose])
}

model MembershipTier {
  id                    String  @id @default(cuid())
  nameZh                String  @db.VarChar(64)
  nameEn                String  @db.VarChar(64)
  benefitsZh            String  @db.Text
  benefitsEn            String  @db.Text
  taglineZh             String  @db.VarChar(64)
  taglineEn             String  @db.VarChar(64)
  features              Json                     // 权益对比矩阵：{ monthlyCredits: 60 | "custom", prioritySupport: true, ... }，键见 lib/billing/tier-features.ts
  defaultMonthlyCredits Int     @default(60)
  defaultMonthlyVideos  Int     @default(4)
  referenceFee          Int     @default(9900)   // 分，仅后台可见
  sortOrder             Int     @default(0)
  visible               Boolean @default(true)
  plans                 CustomerPlan[]
}

model CustomerPlan {
  userId               String      @id
  user                 User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  tierId               String
  tier                 MembershipTier @relation(fields: [tierId], references: [id])
  currency             Currency
  billing              PlanBilling @default(STRIPE)
  baseFee              Int         // 分
  extraPlatforms       String[]
  extraPlatformFee     Int         // 分 / 个
  allInclusiveFee      Int?        // 有值则忽略上面两项
  monthlyCredits       Int
  monthlyVideos        Int
  topupUnitPrice       Int         @default(100)   // 分 / credit
  status               PlanStatus  @default(DRAFT)
  stripeSubscriptionId String?     @unique
  currentPeriodEnd     DateTime?
  updatedAt            DateTime    @updatedAt
}

model CreditGrant {
  id        String      @id @default(cuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  source    GrantSource
  scope     GrantScope  @default(ANY)
  amount    Int
  remaining Int
  validFrom DateTime    @default(now())
  expiresAt DateTime?
  refId     String?     @unique        // invoice id / checkout id / 赠送标记，保证幂等
  createdAt DateTime    @default(now())
  @@index([userId, expiresAt])
}

model CreditTxn {
  id        String      @id @default(cuid())
  userId    String
  user      User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  kind      TxnKind
  charge    ChargeKind?
  delta     Int
  grantId   String?
  refId     String?                     // designId / generationId / stripe id
  note      String?     @db.VarChar(255)
  actorId   String?                     // 管理员操作人
  createdAt DateTime    @default(now())
  @@index([userId, createdAt])
}

model Generation {
  id          String           @id @default(cuid())
  userId      String
  user        User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  parentId    String?                       // 多轮：上一轮
  mode        GenerationMode
  quality     String           @db.VarChar(8)   // standard | hd
  size        String           @db.VarChar(16)
  userPrompt  String           @db.Text
  finalPrompt String?          @db.Text
  inputUrl    String?
  outputUrl   String?
  credits     Int
  costMicros  Int?                           // OpenAI 实际成本（百万分之一美元）
  status      GenerationStatus @default(PENDING)
  error       String?          @db.VarChar(255)
  createdAt   DateTime         @default(now())
  @@index([userId, createdAt])
  @@index([status, createdAt])
}

model StripeEvent {            // webhook 幂等
  id          String   @id    // evt_xxx
  type        String
  processedAt DateTime @default(now())
}

model Design {
  // 现有字段 + ↓
  chargedAt DateTime?          // 首次扣费时间，之后不再扣
}
```

## 5. 路由清单

| 路径 | 说明 | 鉴权 |
| :-- | :-- | :-- |
| `/` | 落地页改版：卖点、AI 前后对比、会员等级权益（无价格）、联系方式 | 公开 |
| `/plans` | 会员权益对比：三档逐项对比（额度 / 平台 / 创作工具 / 服务），无价格，FAQ，咨询按钮；手机端每档一张卡 | 公开 |
| `/legal/terms` `/legal/privacy` `/legal/refund` | 法律页 | 公开 |
| `/register` | 邮箱 + 密码 → 验证码页 | 公开 |
| `/verify-email` | 输入 6 位验证码；验证成功送 10 credit | 已登录未验证 |
| `/forgot-password` `/reset-password` | 找回密码 | 公开 |
| `/membership` | 我的会员：专属方案、付款、本月剩余、平台权益、充值、Stripe 账单入口、流水 | USER |
| `/membership/success` `/membership/cancel` | 支付回跳 | USER |
| `/create` | AI 生图工作台 | USER（非演示） |
| `/generations` | 生成历史（瀑布流，24 条分页） | USER |
| `/admin/accounts/[id]` | 客户详情：方案、线下开通、调整 credit、流水 | ADMIN |
| `/admin/tiers` | 会员等级 | ADMIN |
| `/admin/generations` | 生成日志与成本 | ADMIN |
| `POST /api/stripe/webhook` | Stripe webhook（验签） | Stripe 签名 |
| `POST /api/generations/[id]/run` | 执行一次生成（同步调用 OpenAI，最长 300s） | 本人 |
| Server Actions | sendVerifyCode / verifyEmail / requestReset / resetPassword / startCheckout / startTopup / openBillingPortal / chargeDesign / createGeneration / sendToEditor / adminSavePlan / adminActivateOffline / adminAdjustCredits / adminSaveTier | 按上表 |

## 6. 关键技术决策（L2，我已决）

1. **扣费一致性**：`chargeCredits(userId, kind, refId)` 在单个事务里 `SELECT … FOR UPDATE` 锁用户行 → 查有效 grant（`validFrom ≤ now < expiresAt`，按 expiresAt 升序、空值最后；模板扣费时 TEMPLATE_ONLY 优先）→ 扣减 + 写流水。同一 refId 重复扣费直接返回已扣结果
2. **生成流程**：createGeneration（扣费 + 建 PENDING 记录）→ 前端调 `/api/generations/[id]/run` 同步执行 → 成功写结果；失败或被审核拒绝 → 退回 credit。超过 10 分钟仍 PENDING 的，在列表页加载时标记 FAILED 并退款（Cloud Run 请求结束后 CPU 会被限流，不做后台线程）
3. **AI 提供方**：OpenAI `gpt-image` 系列（开工时核实当前最新型号和价格）；标准 = medium 质量，高清 = high 质量；尺寸 1:1 / 4:5 / 9:16 / 16:9。提示词扩写用 OpenAI 小模型。`AI_PROVIDER=fake` 时返回本地占位图，verify.sh 和本地开发不花钱
4. **风控**：每人同时只能跑 1 个生成、每小时 30 次；全站每日成本上限 `AI_DAILY_COST_CAP_USD`（默认 50），超出拒绝且不扣费；上传 ≤ 10MB，浏览器端压到 ≤ 4MB
5. **存储**：`STORAGE=local`（dev，写 `.data/uploads/`，已 gitignore）/ `STORAGE=gcs`（prod，新建桶 `postory-user-media`）
6. **Stripe 专属价**：只建一个 Product「Postory Membership」，每次 Checkout 用 `price_data` 动态金额；基础价、额外平台（quantity = N）分两行；全包是一行。管理员改价 → 更新订阅项，下个周期生效
7. **月度额度**：`invoice.paid` → 发一个 MONTHLY grant（refId = invoice id，expiresAt = 本期结束）；线下开通一次生成 N 个 grant，每个只在对应月份有效
8. **邮件**：Resend（免费档每月 3000 封）；没有 key 时把邮件打印到服务端日志，本地和 verify 可用
9. **导出扣费**：导出 PNG 在浏览器端完成，先调 `chargeDesign` 成功后才导出。截图绕过无法防，接受
10. **平台 id 迁移**：老数据里的中文平台值映射到新 id（小红书 → xiaohongshu、抖音 → douyin、微信朋友圈 → wechat-moments、Instagram → instagram、Facebook → facebook、X / Twitter → x）

## 7. 执行顺序（静态页先行）

| 周期 | 单元 | 可看物 |
| :-- | :-- | :-- |
| 0 | **静态页**：`/membership`、`/create`、余额不足弹窗、`/admin/accounts/[id]` 方案表单、落地页会员区（真实文案 + 假数据 + 能点） | 截图发你，等"对 / 不对" |
| 1 | Schema 迁移 + 平台 id 迁移 + credit 账本（含并发测试） | verify 输出 |
| 2 | 账号改造：邮箱注册、验证码、赠送、找回密码 | 截图 |
| 3 | 后台：等级、客户方案、线下开通、调整 credit | 截图 |
| 4 | 付费墙：模板导出 / 发布计划扣费、平台数限制、余额徽章 | 截图 |
| 5 | AI 生图工作台 + 生成历史 + 发送到编辑器（先 fake provider，拿到 key 后接 OpenAI） | 截图 + 前后对比样图 |
| 6 | Stripe：订阅、充值、Portal、webhook | 测试模式付款录屏截图 |
| 7 | 落地页 + 法律页 + 后台成本看板 | 截图 |
| 8 | `/code-review high` + `/security-review` → 部署（GCP 操作前停下确认） | 生产 URL 验证 |

进度台账：`docs/20260928-commerce-tasks.md`（确认后建立）。

## 8. 风险点

1. **小红书没有第三方发布 API**：以后接入真实发布，小红书也只能是"下载 + 复制文案，客户自己发"
2. **OpenAI 成本波动**：高清图单张成本可能接近 $0.2；定价 2 credit ≈ €2 仍有余量；每日成本上限兜底
3. **生成超时**：高清图偶尔要超过 60s，Cloud Run 请求超时调到 300s；超时自动退款
4. **导出扣费可被截图绕过**：客户端导出无法防，接受
5. **老账号**：现有手机号账号可以继续登录，但没有邮箱就收不到收据和找回密码邮件；「我的会员」提示补邮箱
6. **Stripe webhook 乱序**：`invoice.paid` 可能早于 `checkout.session.completed`，两边都按 subscription id 找方案，幂等处理

## 9. 需要的外部账号（开发不阻塞，上线前必须有）

| 账号 | 用途 | 没有时 |
| :-- | :-- | :-- |
| OpenAI API Key | AI 生图、提示词扩写 | fake provider 出占位图 |
| Stripe（测试 + 正式，开通 EUR / CAD） | 收款 | verify 用本地签名的 webhook 事件 + Stripe 假客户端 |
| Resend + 发信域名 | 验证码、找回密码邮件 | 邮件打印到日志 |
| GCS 桶 `postory-user-media` | 存用户生成图 | 本地盘 |

---

## 附录 A · 技术验收标准与 verify.sh 增量

在现有 `scripts/verify.sh`（86 项）基础上增加，退出码 0 = 通过：

1. **基础**：tsc、lint、build、`prisma migrate status`、check-i18n（新增文案中英 key 一致）
2. **路由探针**：第 5 节所有页面 × 中英文，登录态非 404/500；未登录访问受保护页 → 跳转登录
3. **鉴权探针**
   - 新 Server Actions：无 session / 伪造 session / 普通用户调 admin 类 → 401 / 401 / 403，且数据库不变
   - 用户 A 访问 B 的生成记录、调 B 的 `/api/generations/[id]/run` → 404
   - 演示账号调 createGeneration / startTopup → 拒绝
   - webhook：无签名 / 错签名 → 400，数据库不变
4. **账本不变量**
   - 余额 5 时并发 20 次扣 1 → 恰好 5 次成功，余额 0，无负数
   - 生成失败 → credit 退回原 grant，流水 DEBIT + REFUND 成对
   - 同一作品导出 3 次 → 只扣 1 次
   - TEMPLATE_ONLY 赠送额度不能用于 AI 生图
   - 过期 grant 不计入余额、不可扣；未生效的线下月度 grant 不可扣
   - 同一 Stripe event 投递 2 次 → 只发 1 次额度；同一邮箱验证 2 次 → 只送 1 次
   - 全站每日成本超上限 → 拒绝且不扣费
5. **Stripe 金额**：假客户端记录 Checkout 参数，断言 99 + 2 × 30 → 两行、15900 分、币种正确；全包方案 → 一行一口价
6. **查询探针**：`/generations`、`/admin/accounts`、流水列表在 10 条与 200 条数据下查询数相同；分页 24 条
7. **资源约束**：上传 > 10MB 或非 png/jpeg/webp → 拒绝；每人每小时 30 次生成限流生效；验证码错 5 次作废
8. **性能基线**：autocannon `/membership`、`/generations` 10s，本地 p97.5 < 300ms，数值写入 DEV-REPORT
9. **安全**：验证码与重置 token 只存哈希；Stripe / OpenAI key 不出现在客户端 bundle（build 产物 grep）
