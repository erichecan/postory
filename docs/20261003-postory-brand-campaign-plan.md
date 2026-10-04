# PoStory 品牌改版 + Dashboard / My Campaign 产品转型 — DEV-PLAN

依据：`docs/20261003-postory-brand-campaign-需求原话.md`（线框设计稿全文）+ `docs/20261003-postory-brand-campaign-reference-board.png`（品牌参考图，logo/配色/mockup）。

读取了哪些现有代码来做这份计划：`prisma/schema.prisma`（User/Design/CalendarSlot/SocialAccount/BrandProfile 等全部现有模型）、`src/lib/brand.ts`、`src/components/brand/logo.tsx`、`src/components/shell/{app-header,nav-links,public-header}.tsx`、`src/app/globals.css`（颜色 token）、`src/lib/platforms.ts`、`src/app/(app)/admin/*`（现有 admin 审核模式）、`src/proxy.ts`（公开路由白名单）。

---

## 一、这次改版是什么

现状：Postory 是一个**自助式**工具——商家自己挑模板、自己用 AI 生成图、自己确认日历格子、自己排期发布（含我们刚交付的"营销日历"单元1-12）。

设计稿要的是**代运营服务**模式——"PoStory 团队"帮商家做好 Campaign 和内容，商家只负责 **View / Approve / Request Changes** 三个动作，不自己编辑任何东西。这是产品定位的转型，不是换皮。

**两套模式不会互相替换，而是共存**：设计稿的顶部导航本身就是 `Dashboard · My Campaign · Calendar · My Brand` 四个 tab，Calendar 还在，说明新的"代运营"叙事是主干，旧的"自助排期"日历仍然保留、只是从"登录后首页"降级为导航里的一个次要 tab。

---

## 二、模块拆解

1. **品牌重塑**：Logo（已从参考图切出 5 个文件，见下）、主色调从现在的灰阶+蓝紫（`oklch(0.58 0.2 268)`）换成 Hot Pink `#FF2D8D` → Orange `#FF7A00` 渐变体系，`BRAND.name` 从 `"Postory"` 改成 `"PoStory"`。这次**只换全局视觉 token + Logo + 顶部导航结构**，不重写首页营销文案/落地页 section（那是另一个还没设计完的东西，参考图里那张"More Visibility. More Customers."首页 mockup 不在这次范围内）。
2. **IA 重排**：顶部导航改成 `Dashboard · My Campaign · Calendar · My Brand`。`/profile` 直接改名叫 My Brand（内容不变）。`/templates`、`/create`、`/designs`、`/membership` 四个现有自助功能**从客户导航整体移除**（你确认的决定：全交给 admin 后台管）——路由本身不删（避免破坏性操作），只是不再出现在客户能看到的任何入口里。计费这块好消息是不用新建：`/admin/accounts/[id]` 现在就已经能让 admin 直接给客户设置 tier/credits/offline 开通（`PlanForm`/`saveCustomerPlan`/`activateOffline`，原本就是给 OFFLINE 账号用的），客户不再需要自己上 `/membership` 走 Stripe 自助升级。
3. **新 schema**：`Campaign` 模型 + `Design` 加两个审核相关字段，复用现有 `Design`（图片/文案/平台/排期/发布状态全都已经有）来当"Content Piece"，不另起一张重复的表。
4. **Dashboard 页面**（新默认落地页，取代 `/calendar`）：Hero / Monthly Snapshot / Current Campaign / Coming Up / Social Accounts 五块，新客户态、Instagram 掉线横幅态。
5. **My Campaign 页面**：Active / Upcoming / Past 三个 tab。
6. **Campaign Detail 页面**：Hero + Strategy + Content Grid（4:5 卡片）。
7. **Content Review Drawer**：右侧 480px 抽屉，Approve / Request Changes 两个动作，这是商家唯一能做的"编辑"操作。
8. **Admin 内容创作后台**（设计稿没画，但没有这个商家侧的页面就是空的——见风险点1）：在现有 `/admin/accounts/[id]` 详情页加一个 Campaigns 区块，admin 能为这个商家建 Campaign、挑模板生成内容、填文案排期、标记"等待客户审核"。

---

## 三、Logo / 社媒头像已切出的文件

从参考图里裁出来的（抠了白底透明背景，不是矢量重绘，细节见下方风险点3）：

| 文件 | 用途 |
| :-- | :-- |
| `preview/20261003-postory-brand-assets/logo-full.png` | 完整 lockup（图标+PoStory字标+slogan），透明底，用于网站 Header |
| `preview/20261003-postory-brand-assets/logo-mark.png` | 纯图标（对话框+播放键），透明底，用于 favicon 源图/小尺寸场景 |
| `preview/20261003-postory-brand-assets/app-icon-light.png` | 白底圆角方形图标（参考图标注"1024×1024"，实际裁出约 255×255，见风险点3） |
| `preview/20261003-postory-brand-assets/social-avatar.png` | 粉橙渐变圆形头像（参考图标注"1080×1080"，实际裁出约 250×250） |
| `preview/20261003-postory-brand-assets/icon-dark.png` | 深色模式用的黑底图标 |

---

## 四、Schema 设计

```prisma
enum CampaignStatus {
  PLANNED
  ACTIVE
  COMPLETED
}

enum ContentReviewStatus {
  READY_FOR_REVIEW
  APPROVED
  CHANGES_REQUESTED
}

model Campaign {
  id          String         @id @default(cuid())
  userId      String
  user        User           @relation(fields: [userId], references: [id], onDelete: Cascade)
  name        String         @db.VarChar(128)
  description String?        @db.Text       // "What We're Focusing On"
  audience    String?        @db.VarChar(255)
  channels    String[]       @default([])   // 复用 src/lib/platforms.ts 的 publish slug（facebook/instagram/tiktok…）
  startDate   DateTime       @db.Date
  endDate     DateTime       @db.Date
  status      CampaignStatus @default(PLANNED)
  createdAt   DateTime       @default(now())
  updatedAt   DateTime       @updatedAt
  contents    Design[]

  @@index([userId, status])
  @@index([userId, startDate])
}

// Design 新增字段（不建新表，直接复用现有图片/文案/平台/排期/发布状态）：
model Design {
  // ...现有字段不变...
  campaignId   String?
  campaign     Campaign?             @relation(fields: [campaignId], references: [id], onDelete: SetNull)
  reviewStatus ContentReviewStatus?  // null = 自助生成的普通设计，不走审核流程
  reviewNote   String?   @db.Text   // Request Changes 弹窗里商家填的内容
}
```

**状态怎么算，不再加字段**：

- Content Card 状态 = `reviewStatus=CHANGES_REQUESTED` → Changes Requested；`reviewStatus=READY_FOR_REVIEW` → 🟠 Ready for Review；否则看 `publishStatus=SUCCESS` → Published，不然 → Scheduled。
- `Campaign.status` 由 admin 建的时候按日期给个默认建议值（今天在 `[startDate,endDate]` 区间内建议 ACTIVE），但存成显式字段，允许 admin 手动改，不做 cron 自动翻转（避免过度设计，一天批量脚本都省了）。

---

## 五、路由清单

| 路由 | 登录 | 说明 |
| :-- | :-- | :-- |
| `/dashboard` | 需要 | **新默认落地页**，取代 `/calendar` |
| `/my-campaign` | 需要 | Active/Upcoming/Past 三个 tab |
| `/my-campaign/[campaignId]` | 需要 | Campaign Detail + Content Grid；越权查他人 campaignId → 404 |
| `/calendar`、`/calendar/week` | 需要 | 保留，功能不变，只换全局配色 token，导航降级为次要 tab |
| `/profile` | 需要 | 保留原路径，导航文案改成 **My Brand** |
| `/admin/accounts/[id]` | 需要(ADMIN) | 新增 Campaigns 区块：建 Campaign、加内容、标记待审核 |

---

## 六、风险点

1. **这次新增一块"内容生产后台"，设计稿里完全没画**：没有 admin 创作页，Dashboard/My Campaign 做出来也是空的（没数据）。我把它算进这次范围（第二节模块7），минимal 够用：admin 在客户详情页建 Campaign、挑模板生成内容、填排期文案、标"待审核"。这部分工作量不小，但不做的话整个功能链路无法端到端验证。
2. **IA 大改，而且这次要改两次**：登录后默认页从 `/calendar` 再改成 `/dashboard`（`/calendar` 今天刚刚才从 `/templates` 换过来，见 commit f13ddfa）。所有写死 `/calendar` 当登录后跳转目标的地方（login/register/demo-login/onboarding 跳转、admin 权限不足回退路径）都要改成 `/dashboard`，执行阶段会 grep 一遍 `"/calendar"` 字面量确认改全。
3. **切出来的 Logo 不是生产级资产**：参考图整张只有 1536×1024，是 ChatGPT 生成的一张"效果图合集"，不是真实的矢量源文件或分层 PSD。裁出来的几个文件实际分辨率只有一两百像素，边缘是用"连通域洪水填充"脱的白底，不是专业抠图，能用来过渡开发/预览，**不建议直接当最终生产 favicon/App Store 图标**——真要上架应用商店或印名片，建议找设计师用矢量重做一版。
4. ~~现有自助功能从主导航消失~~ **已确认**：模板库/AI生图/我的设计/会员四个客户入口整体拿掉，全交给 admin 后台管。路由代码不删（avoid 破坏性操作），只是不再链接给客户；会员计费走 `/admin/accounts/[id]` 现成的 `PlanForm`，不用新建。
5. **Instagram 掉线横幅（第12节）**：现有 `SocialAccount.connectedAt` 只能区分"从没连过"和"连过"，没有"连过但后来掉线"这个信号，而且 Ayrshare 现在还在 fake 模式（上次上线记录：代码已上线但保持 fake，真实账号的事你说"再等等"）。这次我会把横幅组件做出来（视觉符合设计稿），但触发条件先留空/手动，不编一个假的掉线检测骗自己也骗客户——等 Ayrshare 真实模式上线后再接真实信号。
6. **多个 ACTIVE Campaign 的边界情况**：设计稿假设商家任何时候只有一个"Current Campaign"，但 schema 没有唯一性约束。按"取最近 startDate 的一个"处理，admin 后台会提示"这个商家已经有一个 Active Campaign 了"但不强制阻止（防止卡住 admin 操作）。
7. **这次不碰**：公开首页 `/` 的营销文案和大 Hero（参考图里的"More Visibility. More Customers."是另一个还没定稿的东西）；`/calendar` 内部的视觉/交互重做（等设计稿补完 Calendar 线框再说）；真实的 Instagram 掉线自动检测；WhatsApp/邮件短信触达流程；Membership/计费页面本身。

---

## 七、附录 A：技术验收标准（scripts/verify.sh 新增）

- `npx prisma migrate status` 干净，`npx tsc --noEmit` 通过
- 路由探针：`/dashboard`、`/my-campaign`、`/my-campaign/[id]` 登录后 200 / 未登录 302（复用 `src/proxy.ts` 的鉴权，不需要加进 PUBLIC_PATHS——这次单元12踩过这个坑，会特别注意）
- 越权探针：`/my-campaign/[campaignId]` 查别的商家的 campaignId → 404；Approve/Request Changes action 只能操作自己名下的 Design，不能靠猜 id 改别人的内容
- Admin 探针：`/admin/accounts/[id]` 的 Campaign 创建/加内容 action，非 ADMIN 角色 → 403
- 查询效率：Dashboard 聚合（Snapshot 三个数字 + Current Campaign + Coming Up + Social Accounts）固定查询数，不随 Design/Campaign 行数线性增长
- 迁移：新增 `Campaign` 表 + `Design` 两个新字段的 migration 能正常 up

---

## 八、工作量预估 & 拆分

这是一次"大改"，预计工作量大于营销日历那一轮（15 个单元），按同样的"一周期一个交付单元"节奏拆：品牌 token 替换→Logo 接入→导航重排→schema migration→Dashboard 五个区块→My Campaign 列表→Campaign Detail→Content Drawer+Approve/RequestChanges→Admin 创作后台→verify.sh→code-review+security-review→DEV-REPORT，预计 12-14 个单元，会单独建一份 `docs/20261003-postory-brand-campaign-tasks.md` 台账（计划确认后再建，台账单元可能根据你的反馈调整）。
