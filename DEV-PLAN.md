# DEV-PLAN：营销日历模块（全量版，含代运营自动化四件套）

## 读取了哪些文档

- 用户分享的 claude.ai 对话（定价与营销日历讨论全文，2026-09-30 ~ 2026-10-02）
- 该对话里链接的 Claude Docs 文档《本地商家营销日历手册》（第一~九节全文）
- 现有代码：`prisma/schema.prisma`、`src/lib/ayrshare.ts`、`src/lib/mail.ts`（已有 Resend 封装，fake/真实两种模式）、`src/lib/platforms.ts`、`src/data/marketing-calendar.json`（另一个东西，见风险点）

2026-10-03 更新：用户明确要求把原计划里标"本轮不做"的四项（WhatsApp 审核自动发布、邮件短信自动化、一句话下单、官网公开获客页）**全部纳入这轮**，所需的外部账号/Key 由用户后续提供，我先把代码路径和 fake 模式搭好，key 到位后切真实模式——沿用这个项目里 `AYRSHARE_MODE=fake` 已经验证过的模式，不是新发明。

## 一、这个模块是什么

Postory 从"选模板→填字→发布"的工具，升级成"社交媒体代运营"：商家登录后看到一份已经替他排好的内容日历，日历自动生成候选内容，WhatsApp 推送审核，24 小时不回复自动发布；同时系统按节奏自动发营销邮件/短信触达老客户；商家也可以直接打字说"周二搞促销"让系统即时生成一条内容；未登录的潜在客户在官网能看到"你这个行业的全年日历长什么样"并留资。

## 二、模块拆解

### 2.1 数据层（schema 变更）

**BrandProfile 新增字段：**
- `industry`: enum `FOOD_TAKEAWAY / BEAUTY_HAIR / FITNESS / PHONE_REPAIR / OTHER`
- `country`: enum `IE / CA`
- `whatsappNumber`: String?（用于审核推送）
- `marketingEmailOptIn` / `marketingSmsOptIn`: Boolean（GDPR/CASL 合规要求的明示同意，手册第八章原文提到两地法规都要求，不能省）

**新表 `MarketingEvent`**（全年节点库，手册第二章 ~25 条）：
`id, startDate, endDate, nameZh, nameEn, region(IE/CA/BOTH/CHINESE_COMMUNITY), industries(String[]), prepWeeks, source`

**新表 `CampaignTemplate`**（行业活动库，手册三~七章）：
`id, industry, nameZh, nameEn, mechanism, suggestedPostCount, eventId?, captionAngle`

**新表 `CalendarSlot`**（商家视角的日历格子）：
`id, userId, date, campaignTemplateId?, eventId?, weeklyRhythmTag?, status(SUGGESTED/CONFIRMED/DESIGN_CREATED/PUBLISHED), designId?`

**新表 `ApprovalRequest`**（WhatsApp 审核流）：
`id, calendarSlotId, userId, channel(WHATSAPP), sentAt, status(PENDING/APPROVED/AUTO_APPROVED/REJECTED), respondedAt, autoApproveAt(sentAt+24h), providerMessageId`

**新表 `OutreachAutomation`**（五条必备自动流程，手册第八章：欢迎/消费后感谢/生日/到期提醒/召回）：
`id, userId, type(WELCOME/THANK_YOU/BIRTHDAY/RENEWAL_REMINDER/WINBACK_1/WINBACK_2/WINBACK_3), channel(EMAIL/SMS), triggerAt, status(SCHEDULED/SENT/SKIPPED), payload(Json，文案和收件信息)`

**新表 `EndCustomer`**（商家的顾客名单，触达自动化需要知道发给谁——这是目前项目完全没有的新概念，`User` 表是开店主自己，不是开店主的顾客）：
`id, userId(属于哪个商家), name?, email?, phone?, lastVisitAt?, birthday?, source, createdAt`

**新表 `CalendarLead`**（官网公开获客页留资）：
`id, shopName, industry, country, contactEmail, contactPhone?, generatedPreviewUrl?, createdAt, status(NEW/CONTACTED/CONVERTED)`

### 2.2 生成逻辑

**日历生成（规则引擎 + 可选 AI 润色）**：
1. 按 `industry + country + 月份` 查 `MarketingEvent`，用每周节奏规则（70/20/10）填满 `CampaignTemplate`
2. 按行业匹配 `Template.categories`，挂候选模板
3. 写入 `CalendarSlot[]`（批量 `createMany`）

**一句话下单**（新增，原计划里的"不做"项）：
- 商家在 `/calendar` 页面一个输入框打字，比如"周二搞促销"
- 调用 Claude API（`ANTHROPIC_API_KEY`）：输入「这句话 + 商家 industry/country/BrandProfile + 最近的 CalendarSlot 上下文」，输出「匹配到哪个 CampaignTemplate 或新建一个、文案初稿、建议发布时间」
- 没有 key 时降级成规则兜底：从 `CampaignTemplate.captionAngle` 里关键词匹配（比如"促销"→匹配 mechanism=淡时段特价的活动），不是空着不能用，只是没有 AI 润色

**WhatsApp 审核自动发布**（新增）：
- 商家确认一个 `CalendarSlot` 生成 `Design` 后，若 `BrandProfile.whatsappNumber` 已填，创建 `ApprovalRequest`，通过 Twilio WhatsApp API 推送预览图+文案
- Webhook 路由接收商家回复（"OK"→`APPROVED`，其他文字视为需要修改→停住等人工介入）
- 后台定时任务（类似现有 `ai:daily-templates` 的 launchd/cron 模式）每小时扫一遍 `PENDING` 且 `autoApproveAt` 已过的请求，置成 `AUTO_APPROVED` 并触发真正的 Ayrshare 发布
- 技术选型（我定，不占用你的确认时间）：用 **Twilio WhatsApp API**，不用 Meta Cloud API 直连——Twilio 有现成 Sandbox，接入快，而且短信和 WhatsApp 共用一套 Twilio 账号/SDK，不用对接两个不同的服务商

**邮件/短信自动化**（新增，复用已有 `src/lib/mail.ts` 的 fake/真实双模式）：
- 五条自动流程（欢迎/消费后感谢/生日/到期提醒/召回 3 封）按手册第八章的触发时机和文案公式写成模板
- 邮件走 `src/lib/mail.ts`（已存在，缺 `RESEND_API_KEY` 时自动降级成控制台打印，不会报错）
- 短信走新增的 `src/lib/sms.ts`，同样"无 key 则 fake 模式打印"的写法
- 召回三封超时不回应自动停止（手册原话），避免被投诉退订
- 退订链接/合规提示（GDPR/CASL）必须在每封邮件里出现，这是法规要求不是可选项

**官网公开获客页**（新增，手册第九节）：
- 新路由 `/calendar-preview`（未登录可访问）：选行业 → 看全年 12 宫格日历预览（用真实 `MarketingEvent` + `CampaignTemplate` 渲染，不用登录） → 底部表单"输入店名，生成你的专属日历预览"
- 提交后用现有规则引擎跑一次生成（不落 `CalendarSlot`，只是预览），存一条 `CalendarLead`，并给你发一封通知邮件（复用 `src/lib/mail.ts`，收件人写死成你自己的邮箱）

### 2.3 页面/路由清单

| 路由 | 登录 | 说明 |
| :-- | :-- | :-- |
| `/calendar` | 需要 | 月视图主页，取代 `/templates` 成为登录后默认落地页；含"一句话下单"输入框 |
| `/calendar/week` | 需要 | 周执行视图 |
| `/calendar-preview` | 不需要 | 官网公开获客页，选行业看全年预览 + 留资表单 |
| `/api/whatsapp/webhook` | — | 接收 Twilio WhatsApp 回复 |
| `/api/whatsapp/cron`（或复用现有定时任务脚本模式） | — | 扫描超时未回复、触发自动通过+发布 |
| `/api/outreach/cron` | — | 扫描到期的 `OutreachAutomation`，发邮件/短信 |
| `/onboarding` | 需要 | 新增选行业/国家/WhatsApp 号/营销触达同意勾选 |
| `/profile` | 需要 | 新增"顾客名单"管理入口（维护 `EndCustomer`，生日/到店记录，手动或导入） |
| `/templates` | 需要 | 保留，降级为"素材库"二级入口 |

### 2.4 国际化

`src/i18n/messages/{en,zh}/calendar.json`、`outreach.json`，中英双语。

## 三、需要你提供的外部账号/资料（到对应环节我会提前说，不会一开始就堵住）

| 做到哪一步需要 | 需要什么 | 没有时的降级方案 |
| :-- | :-- | :-- |
| WhatsApp 审核 | Twilio 账号的 Account SID + Auth Token；正式上线前还需要 Twilio 完成 WhatsApp Business 发送方审核（有审核周期，建议尽早启动） | 开发阶段用 Twilio Sandbox（几分钟能拿到测试号），fake 模式下只打日志不真发 |
| 短信触达 | 同一个 Twilio 账号 + 一个短信发送号（IE/CA 可能要分别买号，到时候一起确认） | fake 模式打日志 |
| 邮件触达 | `RESEND_API_KEY`（项目已经接好 Resend，只是线上一直没配，部署日志里提过这件事） | fake 模式打日志，和现在注册验证邮件的现状一样 |
| 一句话下单的 AI 润色 | `ANTHROPIC_API_KEY` | 规则兜底（关键词匹配活动库），能用但没有自然语言理解能力 |
| 节日日期准确性 | 你或当地人帮忙复核农历节日和加拿大具体日期（手册原文自己写的免责声明） | 先照抄手册数据上线，标注"待复核"，不阻塞开发 |

## 四、风险点

1. **IA 大改**：登录后默认页从 `/templates` 换成 `/calendar`，直接切（现有用户少，窗口期好）。
2. **两套"marketing-calendar"别混**：`src/data/marketing-calendar.json` 是现有 AI 每日生成草稿任务用的中国节点表，服务对象、用途都不同，不删不改，新表完全独立。
3. **行业分类映射**：`Template.categories` 中英混杂，我维护一张代码内映射表，不展示给商家，纯技术细节。
4. **新的攻击面变多了**：WhatsApp webhook、cron 触发的自动发布/自动发消息，都是无人值守自动执行外部动作的路径，鉴权和幂等性（不能同一个 ApprovalRequest 被重复触发发布）要重点测，写进附录 A。
5. **EndCustomer 顾客数据是新的个人信息类别**：涉及姓名/邮箱/电话/生日，GDPR/CASL 合规要求更高（取得同意、提供退订、数据最小化），这块我会按手册里提到的合规要求做，但不是律师，真正上线前建议你找当地人确认一下合规细节。
6. **成本**：Twilio（WhatsApp+SMS）和 Resend（邮件）、Claude API（一句话下单）都是按量计费的外部服务，量大起来之后有真实成本，这个我会在验收报告里把用量和单价记清楚，定价那边你自己再核算。

## 附录 A：技术验收标准

`scripts/verify.sh` 新增：
- 路由探针：`/calendar`、`/calendar/week` 登录后 200/未登录 302；`/calendar-preview` 未登录也要 200
- 迁移探针：`npx prisma migrate status` 干净
- 鉴权/越权探针：
  - `/calendar/[slotId]/confirm`：无登录 401，别人的 slotId 403
  - `/api/whatsapp/webhook`：无 Twilio 签名验证直接拒绝（防伪造回复）
  - cron 类路由：不能被普通用户直接触发，只能内部密钥调用
- 幂等性探针：同一个 `ApprovalRequest` 的 cron 自动发布逻辑重复跑两次，断言只真正调用一次 Ayrshare `/post`（不能重复发帖）
- 查询探针：日历批量生成是 `createMany` 而不是循环 insert
- fake/真实模式切换：所有新外部依赖（Twilio、Resend、Claude）在没有对应 Key 时必须走 fake 路径且不报错，和现有 `AYRSHARE_MODE=fake` 行为一致
