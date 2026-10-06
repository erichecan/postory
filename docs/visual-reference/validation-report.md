# PoStory 参考 UI 实现与验证报告

验证日期：2026-10-06。对应提示词：`docs/20261005-reference-ui-prompt.md`。16 张下载稿中 Services 早期稿仅作为辅助；正式实现 15 个最新版页面。

## 查看结果

- 本地网站：http://localhost:3002/
- 客户区设计示例：http://localhost:3002/demo/dashboard
- [全部页面并排对照与透明度叠图](../../preview/visual-validation/index.html)
- 截图目录：`preview/visual-validation`；原始参考图副本：`preview/visual-reference`。
- 每页保存 `{page}-desktop.png` 整页、`{page}-first-screen.png` 首屏、`{page}-mobile.png` 手机整页；真实账户只读截图以 `real-` 开头。

## 实现与检查

使用现有 Next.js / React / TypeScript；文字、导航、表单、筛选、卡片、日历及弹窗均为真实 HTML/CSS/组件。新 Logo 使用提供的透明源图，共用组件覆盖公开网站、客户导航和登录页。照片/帖子画面从设计稿中按独立区域裁切，未将页面或 UI 区块当整张背景图。

生产构建、项目 TypeScript 检查、`eslint src scripts --quiet` 已通过。15 个桌面页面均返回 200，字体与图片加载成功，无浏览器运行错误。75 个补充尺寸检查全部通过，没有横向溢出：375×812、390×844、768×1024、1280×800、1440×900。桌面参考视口为首页 801×900；长稿 1024×900；宽稿 1536×1024。

浏览器交互检查覆盖图片过滤、弹窗焦点与 Escape、真实日期的月份切换、评估必填/邮箱格式/字符数/服务端错误和输入保留、活动标签页和发布状态筛选、原始计划弹窗、反馈预览、日历平台过滤与列表、品牌资料编辑预览、手机菜单及键盘焦点、未登录权限和真实客户数据只读访问。10 组检查通过，结果见 `interaction-report.json`。真实账户四个客户区页面均返回 200；访问不属于该账户的演示活动 ID 返回 404。没有修改账户资料、发送邮件或发布内容。

登录默认入口改为 Dashboard；显式指定的站内返回路径继续保留。新客户区顶栏是 Dashboard / My Campaign / Marketing Calendar / My Brand。旧模板/编辑器等功能仍可按原路由访问；旧日历实现保留在 `src/components/calendar/legacy-calendar-page.tsx`。

## 路由与截图尺寸

以下高度只是整体长度对照，不代表像素相似度评分。长页面按内容自然展开，未拉伸或强行裁切到参考高度。

| 页面 | 实际验收路由 | 视口 px | 参考整页高度 | 实现整页高度 | 高度差 |
|---|---|---|---:|---:|---:|
| Homepage | `/` | 801 × 900 | 1962 | 1974 | +12 |
| Our Work | `/our-work` | 1536 × 1024 | 1024 | 1204 | +180 |
| Beauty Demo | `/our-work/beauty` | 1024 × 900 | 1536 | 1576 | +40 |
| Restaurant Demo | `/our-work/restaurant` | 1024 × 900 | 1536 | 1586 | +50 |
| Contractor Demo | `/our-work/contractor` | 1024 × 900 | 1536 | 1590 | +54 |
| Services V2 | `/services` | 1024 × 900 | 1536 | 1551 | +15 |
| How It Works V2 | `/how-it-works` | 1024 × 900 | 1536 | 1600 | +64 |
| Who We Help V2 | `/who-we-help` | 1024 × 900 | 1536 | 1625 | +89 |
| About V2 | `/about` | 1024 × 900 | 1536 | 1544 | +8 |
| Free Assessment | `/assessment` | 1024 × 900 | 1536 | 1664 | +128 |
| Dashboard V2 | `/demo/dashboard` | 1536 × 1024 | 1024 | 1079 | +55 |
| My Campaign V2 | `/demo/my-campaign` | 1536 × 1024 | 1024 | 1055 | +31 |
| Campaign Detail V2 | `/demo/my-campaign/spring-beauty-refresh` | 1024 × 900 | 1536 | 1519 | -17 |
| Marketing Calendar V2.1 | `/demo/calendar` | 1536 × 1024 | 1024 | 1111 | +87 |
| My Brand V2 | `/demo/my-brand` | 1024 × 900 | 1536 | 1603 | +67 |

客户区示例以 `/demo` 开头；真实受保护路由是 `/dashboard`、`/my-campaign`、`/my-campaign/[campaignId]`、`/calendar`、`/my-brand`。真实页面仅查询当前账户的数据，未把 Sophie Chen 示例内容植入客户数据库。

## 仍存在的差异与能力边界

当前不是逐像素 100% 一致。已对照截图修正多轮布局、图片、标题换行、卡片排列及手机/中间尺寸溢出；仍有以下差异：

1. 字体原文件未提供，采用项目 Inter。字形、粗细、字距及部分行换行与图片存在差别，局部卡片、模块间距尚有偏差，已通过上方并排与叠图保留证据。
2. 独立摄影原图与视频未提供。照片/帖子使用有坐标记录的设计稿裁切，分辨率有限，部分原稿照片被浮层遮挡，尤其人物 Hero 与重叠帖子；画面范围、倾斜角、背景渐变/弧形细节和个别图标不能完全相同。播放按钮打开静帧预览，明确说明没有视频文件。
3. 按提示词最终决定移除客户区重复左侧栏，主内容重新居中；示例增加轻量提示以区分真实数据。这是需求优先级带来的明确偏差。
4. 设计稿部分日期与统计不一致。公开月历使用正确的 March 2026 日期，需要六周；Our Work 原图截断了月历尾部，实现保留完整可操作月历，因此整页更长。Calendar 原图显示 18 但实际有 19 项可见内容；示例统计根据实际项目计算为 19。保护页统计来自账户保存的数据，未显示虚构社媒增长。
5. Assessment 增加选填邮箱便于回复，没有新增必填条件；因此表单整页更长。提交与客户反馈复用邮件网关；缺少发送配置时显示未提交/未发送。成功提示仅在实际送达网关后出现；本次未验证外部真实投递。
6. 客户活动沿用现有 CalendarSlot/CampaignTemplate/Design 关联，当前账户没有活动时展示空状态。当前 schema 未提供独立客户活动审批、结构化服务/促销、品牌色及媒体库实体。本次复用品牌资料/Logo 上传/社媒授权功能，Services/Promotions 的添加入口打开品牌描述编辑，不代表独立实体已保存。样例 Edit 仅本地预览。活动修改意见以详情中的反馈表单发送，不伪造审批状态或实时分析。
7. 桌面参照已逐页检查，移动端未提供设计稿，采用提示词规定的阅读顺序、边距、折叠菜单和日历列表；无法声明移动视觉与不存在的移动稿完全一致。

## 素材与分析记录

- [布局规格与假设](layout-spec.md)
- [逐页文案 OCR 转录与待确认内容](page-copy.md)
- [原始参考图映射](references.json)
- [照片/帖子裁切坐标映射](assets.json)

Logo：`public/brand/postory-logo-source.png`，来源 `彩色_PoStory_品牌标志展示.png`，1774×887，CSS 裁切原始透明文字标志。本次摄影/帖子素材共 136 个独立裁切文件，位于 `public/visual`。

## 重跑截图检查

开发服务运行在 3002；验证脚本为 `scripts/validate-reference-ui.mjs`。Playwright 放在独立临时工具目录，未添加项目依赖。

```sh
NODE_PATH=/tmp/postory-browser/node_modules CHROME_PATH='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' node scripts/validate-reference-ui.mjs
```

可用 `VISUAL_BASE_URL` 指定其他运行地址。脚本进行 15 个桌面和 75 个响应式只读检查，保存截图与 JSON，并在 HTTP/溢出/图片/运行错误时返回非零退出码。
