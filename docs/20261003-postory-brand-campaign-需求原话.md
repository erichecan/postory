# 品牌改版 + Dashboard/My Campaign 需求原话

2026-10-03，用户在对话里粘贴了以下内容，说明来源：这是用户和另一个 AI（ChatGPT）讨论产品方向时产出的线框设计稿文字说明（不是用户本人逐字撰写，但用户把它作为这次改版的设计依据原封不动转发给我）。逐字保留，不转述、不润色。

同时提供了一张品牌设计参考图：`docs/20261003-postory-brand-campaign-reference-board.png`（原文件 `/Users/eric/Downloads/ChatGPT_Image_2026年10月3日_10_01_32.png`，已拷贝归档），内容是 PoStory 的 Logo 设计理念、品牌色彩（Hot Pink #FF2D8D / Orange #FF7A00）、品牌关键词、以及网站首页/App 图标/社媒头像等效果图。

用户在图片之后的原话：

> 1,根据这个新的设计稿,把网站的 logo,社媒的头像等等都切出来,变成一个单独文件;2,根据设计稿里定的品牌主色调,设计风格,根据前面的文字描诉,重新设计网页

用户在"这次改版范围是哪一种"的澄清问题中选择的选项（澄清问题见下，用户选的是第二个）：

> 按文字稿做产品转型 —— 新增 Dashboard、My Campaign、Campaign 审批工作流等全新页面和数据模型，把产品从"自助工具"改造成"代运营服务"。

---

## 原始线框设计稿全文（逐字）

```text
好。我们直接进入**线框级设计规格**。这一版我会把它写到可以直接交给 UI Designer / AI Coding Agent 的程度。

先不做视觉稿、不写代码，先把 **Dashboard + My Campaign** 的结构、尺寸、内容和交互锁死。

---

# 1. PoStory Desktop 基础框架

先统一整个站的画布。

### Desktop

Viewport
1440 × 900

TOP NAV 72px
Content max-width: 1200px

### Top Navigation

高度：72px
内容最大宽度：1200px

PoStory       Dashboard   My Campaign   Calendar   My Brand
                                                   🔔   Eric ▾

### Nav 状态

Active 页面：
* 字体加粗
* 下方 2px Hot Pink 小线
* 不使用大面积色块

---

# 2. Dashboard

## 页面总体结构

Dashboard
├── Hero
├── Monthly Snapshot
├── Current Campaign        ← 最大模块
├── Coming Up               ← 次重点
└── Social Accounts

页面内容宽度：1200px
页面左右：24px
模块之间：24px

---

# 3. Dashboard — Hero

高度：128px

不要做传统 SaaS 那种巨大 Hero。

Good morning, Sarah
Your social media is taken care of.
Here's what's happening with your marketing this month.

### Typography

**Good morning, Sarah**
* 30px / Semibold / #171717

第二行：
> Your social media is taken care of.
* 16px / Gray

---

# 4. Dashboard — Monthly Snapshot

四个数字不要做。我建议只做 **3 个**。

12 / Posts Published
3 / Campaigns This Month
3 / Accounts Connected

三个卡片：384 × 104px 左右

不要显示：Engagement / Reach / Followers —— 这些全部从客户网站里消失。

---

# 5. Dashboard — Current Campaign

这是整个 Dashboard 的**视觉核心**。
高度：约 280px

## 顶部

CURRENT CAMPAIGN
Spring Beauty Refresh                    ● ACTIVE
Mar 1 – Mar 31

Campaign 名：26px / Semibold

## Campaign 描述

We're focusing on seasonal beauty services,
real customer transformations and spring appointments.

最多两行。

## Channels

Instagram    Facebook    TikTok

用小 icon + 名字。不要做成三个巨大按钮。

## Content Progress

12 CONTENT PIECES
8 Published                         4 Scheduled
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

进度条可以有，但非常细。高度：4px

## CTA

右下角：**View Campaign →**
这是整个 Dashboard 最重要的 CTA。

---

# 6. Current Campaign 卡片完整结构

┌─────────────────────────────────────────────────────────────┐
│ CURRENT CAMPAIGN                              ● ACTIVE      │
│                                                             │
│ Spring Beauty Refresh                                      │
│ Mar 1 – Mar 31                                             │
│                                                             │
│ We're focusing on seasonal beauty services, real customer  │
│ transformations and spring appointments.                   │
│                                                             │
│ Instagram   Facebook   TikTok                              │
│                                                             │
│ 12 CONTENT PIECES                                          │
│ 8 Published                              4 Scheduled        │
│                                                             │
│                                      View Campaign →         │
└─────────────────────────────────────────────────────────────┘

---

# 7. Dashboard — Coming Up

高度：约 250px
标题：**Coming Up**
右侧：View Calendar →

三个内容横向排列：
MAR 18 / Before & After / Instagram / ● Scheduled
MAR 20 / Customer Story / Facebook / ● Scheduled
MAR 22 / Spring Promotion / Instagram / ● Scheduled

每张：384 × 160px

---

# 8. Coming Up 卡片不要放完整图片

Dashboard 不应该变成 Instagram feed。

### Dashboard
只显示：内容类型 + 标题 + 日期 + 平台

### My Campaign
才显示：**真正的图片 / 视频**

这样 Dashboard 很干净。

---

# 9. Dashboard — Social Accounts

高度：140–160px

Your Social Accounts                         Manage →
Instagram       @sarahbeauty       ● Connected
Facebook        Sarah Beauty       ● Connected
TikTok          @sarahbeauty       ● Connected

如果三个全部正常：**3 accounts connected** 即可。

---

# 10. Dashboard 最终长度

1440×900 屏幕大概看到：NAV / Hero / Snapshot / Current Campaign / Coming Up / Social Accounts

**不需要滚动太多。**这非常重要。

客户打开 Dashboard：**一屏基本理解 PoStory 在做什么。**

---

# 11. Dashboard 新客户状态

如果刚注册，Hero：**Welcome to PoStory.** 下面：We're getting your marketing ready.

Current Campaign：
Your first campaign is being prepared.
Your PoStory team is building your first marketing plan and content.

而不是空白页面。

---

# 12. Dashboard 异常状态

假设 Instagram 掉线。Current Campaign 仍然正常。顶部另外出现：

⚠ Instagram needs to be reconnected
We need access to Instagram to publish your upcoming content.          Reconnect →

高度：64px。浅色背景。不要用红色大警告。

---

# 13. 接下来进入 My Campaign

这个页面和 Dashboard 最大的区别：
> Dashboard 是 **summary**
> My Campaign 是 **story**

客户进入以后，要真正理解：**"PoStory 这个月到底怎么帮我营销。"**

---

# 14. My Campaign — 页面顶部

My Campaign
Marketing campaigns PoStory is running for your business.

下面不是筛选器，而是：Active / Upcoming / Past —— 三个非常轻的 Tab。

---

# 15. Active Campaign

页面最大卡片：

● ACTIVE
Spring Beauty Refresh
Mar 1 – Mar 31
Drive spring appointments through seasonal services, customer transformations and limited-time offers.
Instagram   Facebook   TikTok
12 Content Pieces
8 Published · 4 Scheduled
                                         View Campaign →

高度：260–280px

---

# 16. Upcoming Campaign

下面：### Upcoming，卡片做小一点。

Mother's Day Beauty Event   / Apr 15 – May 12 / ● Planned / View Campaign →
Summer Skin Refresh         / Jun 1 – Jun 30   / ● Planned / View Campaign →

---

# 17. Past Campaign

最后：### Past Campaigns，不用默认全部展开。

New Year Refresh / Jan 2 – Jan 31 / ✓ Completed
Holiday Gift Campaign / Dec 1 – Dec 24 / ✓ Completed

可以只显示 3 个。按钮：**View All Past Campaigns**

---

# 18. 点击 Active Campaign

进入：
← My Campaign
Spring Beauty Refresh
Mar 1 – Mar 31
● Active

这里开始进入真正的 Campaign Detail。

---

# 19. Campaign Detail — Hero

高度：180px

左：SPRING BEAUTY REFRESH / Mar 1 – Mar 31 / ● Active
右：12 / Content Pieces / 8 Published / 4 Scheduled

---

# 20. Campaign Detail — Strategy

标题：**What We're Focusing On**

内容：We're using real customer transformations, seasonal beauty services and limited-time offers to drive spring appointments.

下面：
### Audience
Existing customers + new customers

### Channels
Instagram · Facebook · TikTok

这块实际上在告诉客户：**我们不是随便帮你发图。**

---

# 21. Campaign Detail — Content

接下来：# Campaign Content，两列 Grid。

## Content Card

建议图片比例：**4:5**（非常适合 Instagram 内容）
卡片宽：约 570px
图片：570 × 712px（实际网页可以 responsive 缩放）

### 卡片结构

IMAGE
MAR 18 · 10:00 AM
Before & After
Instagram
● Scheduled

---

# 22. 点击 Content Card

打开右侧 Drawer。宽：480px。不要跳新页面。

Content                       ×
[ IMAGE ]
Before & After
Instagram
Mar 18 · 10:00 AM
Campaign: Spring Beauty Refresh
Caption
Spring is the perfect time...
● Scheduled

如果需要 Review，底部出现：[ Approve ]    [ Request Changes ]
如果已经 Scheduled：不用出现任何按钮。

---

# 23. Ready for Review 状态

这是唯一需要突出显示的状态。

IMAGE
MAR 18 · 10:00 AM
Before & After
Instagram
🟠 READY FOR REVIEW

颜色：**Orange**（不是 Hot Pink），因为 Orange = 需要你注意。

---

# 24. Approve 后

立即变：● Scheduled

页面 Toast：**Approved. We'll take it from here.**

这个微文案再次强化：**你不用继续做任何事情。**

---

# 25. Request Changes

弹窗：
Request a Change
Tell us what you'd like us to adjust.
[ 文本框 ]
Cancel                 Send Request

提交后：**Thanks. We'll take care of it.**
状态：**Changes Requested**

---

# 26. My Campaign 最关键的设计原则

这里一定不要出现：Edit Post / Edit Caption / Change Date / Change Platform / Delete / Duplicate / Create Post —— 全部没有。

客户只有：**View / Approve / Request Changes** 这三个核心动作。

---

# 27. Campaign 完成以后

顶部：Spring Beauty Refresh / Mar 1 – Mar 31 / ✓ Completed

不要出现："87% complete"，而是：12 Content Pieces / 12 Published

下面可以出现：**Campaign completed.** 然后：Your monthly marketing summary will be included in your next report.

这样 Results 就自然连接到 Email，而不是网站。

---

# 28. Dashboard → My Campaign → Calendar 的关系

DASHBOARD
  ├ Current Campaign → MY CAMPAIGN → CAMPAIGN DETAIL → CONTENT CARD → REVIEW
  │                                                                    ↙      ↘
  │                                                               APPROVE   CHANGES
  │                                                                  │          │
  │                                                                  ↓          ↓
  │                                                             SCHEDULED   PoStory Team
  │                                                                  │
  │                                                                  ↓
  │                                                              PUBLISHED
  │                                                                  │
  │                                                                  ↓
  │                                                            MONTHLY EMAIL
  ├ Coming Up
  └ Calendar

---

# 29. V1 核心页面尺寸锁定

| 元素             | Dashboard | My Campaign |
| -------------- | --------: | ----------: |
| Header         |      72px |        72px |
| Content max    |    1200px |      1200px |
| Hero           |     128px |       120px |
| Main card      |     280px |       280px |
| Secondary card |     160px |       180px |
| Content card   |         — |         4:5 |
| Drawer         |         — |       480px |
| Section gap    |      24px |        32px |
| Card radius    |   14–16px |     14–16px |

---

# 30. Dashboard 不要做成"卡片地狱"

Dashboard 最多 5 个视觉模块：① Welcome → ② Snapshot → ③ Current Campaign（最大） → ④ Coming Up → ⑤ Social Accounts

My Campaign：① Page Header → ② Active Campaign（最大） → ③ Upcoming → ④ Past

Campaign Detail：① Campaign Hero → ② What We're Focusing On → ③ Campaign Content（最大）

下一步我建议直接继续往下做 **Calendar + My Brand 的同等级线框规格**，然后四个页面就完整闭环。之后我们再做一个更关键的步骤：**把这四个页面转换成一份可以直接丢给 Claude / Cursor / Lovable / Replit 之类 AI Coding Agent 的完整 PoStory 网站改版 Prompt**，这样你现在的 `/templates` 初稿就可以开始真正改造成我们现在定义的产品。
```
