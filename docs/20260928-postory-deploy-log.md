# social-shell 部署日志

## 2026-10-06 · Logo 精确裁切与桌面尺寸修正上线

- **应用提交**：`255e338`。GitHub Actions [37550616817](https://github.com/erichecan/postory/actions/runs/37550616817) 成功；Cloud Run revision `postory-00017-6f2` 承接 100% 流量。
- **修改**：从用户提供的原图分别裁切 959 × 258 文字 PNG 和 432 × 437 图标 PNG，保留原始像素与透明背景。共用 Logo 直接加载文字 PNG，桌面宽度改为 180 px；手机页头 108 px，流程图 77 px。取消背景偏移裁切和 `transform: scale` 二次缩放，保留完整原图分辨率。SVG 描摹稿作为备选素材，不默认替换 PNG。
- **验证**：本地类型检查、生产构建通过，lint 0 错误、6 条现有警告；裁切 PNG 与原图对应区域逐像素一致。线上首页、服务页、客户演示、品牌演示、登录和价格页，在 1440 / 1280 / 1024 / 768 / 390 px、DPR 2 下共 30 项检查通过；图片地址和 959 × 258 原始尺寸正确，桌面显示宽度 180 px，无横向溢出或运行错误。流水线首页、登录、法律与模板素材均返回 200。
- **截图**：本地 `preview/logo-deployment-20261006`；不上传公开仓库。
- **部署范围**：沿用现有 Cloud Run 配置，未修改数据库、计费或发布行为。

## 2026-10-06 · 参考页面重建与 Design System v1 上线

- **部署内容**：主要营销页面、客户 Dashboard / My Campaign / Calendar / My Brand、公开演示页和组件规范页；统一字体角色、颜色、间距、按钮、表单及导航，保留提供的 PNG Logo。旧工具接入基础规范，尚未逐组件完成全站改造；Logo 清晰度优化尚未实施。
- **提交与部署**：应用提交 `4d0dd75`；GitHub Actions [37459602245](https://github.com/erichecan/postory/actions/runs/37459602245) 成功；Cloud Run revision `postory-00016-qns` 承接 100% 流量。沿用 min 0 / max 3，未执行数据库迁移或 seed。
- **地址**：https://postory-dfd7b2qpra-ew.a.run.app 。组件规范：`/demo/design-system`。
- **本地验证**：类型检查、生产构建通过；lint 0 错误，6 条现有警告。设计系统浏览器验收见 `docs/design-system/validation.md`。
- **线上验证**：18 个页面在 1440 × 900 和 390 × 900 下共 36 项浏览器检查；页面返回 200，无运行错误、横向溢出或可见图片加载失败。4 个客户页面未登录均 307 跳转登录；Logo 与页面图片素材返回 200。流水线另验证登录、首页、法律与模板素材均 200。手机登录页中隐藏的懒加载图片不作为失败判断。
- **截图与数据**：部署截图与报告保存在本地 `preview/deployment-20261006`；`preview` 已加入 Git 忽略，客户截图不上传公开仓库。
- **已知限制**：Logo 仍为 PNG 缩放裁切；旧客户工具、管理员页面与编辑器尚未完成所有组件和状态的统一。原有 fake 发布/计费配置沿用；邮件提交仍需配置邮件服务才能实际发送。

## 2026-10-04 · 营销日历模块（单元1-12）+ PoStory 品牌改版第一步（浅色主题+新Logo）上线

- **想达成什么**：把本地攒了两天没推的 15 个 commit 一次性推上线——① 营销日历自助排期模块全套（行业日历、WhatsApp审核自动发布、邮件短信触达自动化、一句话下单、顾客名单、官网获客页 `/calendar-preview`）；② PoStory 品牌改版第一步：浅色主题 + Hot Pink/Orange 新配色 + 新 Logo（后续 Dashboard/My Campaign 代运营模式改造还在进行中，这次只上了品牌视觉这一层）。
- **部署结果**：
  - commit `683cce1`（含security修复）GitHub Actions run `37178823803` 成功；Verify：login/landing/legal/asset 均 200
  - commit `0f789ae`（补齐遗漏的"Postory"拼写）GitHub Actions run `37178987791` 成功
  - 线上地址：https://postory-dfd7b2qpra-ew.a.run.app ，min-instances 仍为 0（零成本策略未破）
- **本次变更**：
  - 线上库 `migrate deploy` 3 个迁移：营销日历模块整套表（BrandProfile新字段 + MarketingEvent/CampaignTemplate/CalendarSlot/ApprovalRequest/OutreachAutomation/EndCustomer/CalendarLead）、CalendarSlot按用户+日期唯一约束、BrandProfile.whatsappNumber唯一约束（见下方安全修复）；执行前后 User(1)/Template(428)/BrandProfile(1)/Design(2) 行数一致
  - `SEED_SCOPE=templates` 补种营销日历参考数据：线上 MarketingEvent 0→28、CampaignTemplate 0→35，MembershipTier/Template 不变
  - **推送前跑了 `/security-review`（两级：首轮扫描 + 独立复核子agent）**，发现并修复：
    1. [HIGH] `/api/whatsapp/webhook` 在 `TWILIO_AUTH_TOKEN` 未配置时（当前线上就是这个状态）直接跳过签名校验而不是拒绝请求，任何人拿商家公开WhatsApp号当 From 字段裸调用就能无鉴权批准/发布别人的待审内容。改成未配置时直接503拒绝（fail closed，和Stripe webhook一个模式），签名比较换成 timingSafeEqual。部署后线上实测确认已返回 503。
    2. [MEDIUM，影响有限] `BrandProfile.whatsappNumber` 没有唯一约束也没有验证，加了 `@unique` + 保存时捕获冲突给友好提示。更完整的"审批绑定到具体某条请求"没做，记在这里。
  - 顺带补了全仓库扫出来的遗漏品牌拼写（meta标题、验证邮件、Stripe商品名、邮件发件人显示名，共6个文件）
- **技术观测（我负责）**：
  - 部署后线上实测：`/calendar-preview`（未登录公开页）200、`/calendar` 和 `/profile/customers`（需登录）未带 session 均 307、favicon/新logo 200、WhatsApp webhook 无token时 503（修复前是会被无鉴权接受的，这个差异本身就是验证通过的证据）
  - Playwright 截图确认首页浅色主题+新Logo渲染正确，中文默认 locale 下标题正确显示 "PoStory 帖事 · ..."
  - 观测窗口 7 天：Cloud Run 5xx、WhatsApp webhook 的 403/503 比例（如果突然出现大量403，可能是有人在探测这个端点，需要跟进）
- **定性观测（用户/客户负责）**：这次是打包部署，没有新增单独需要你看一眼的界面变化——品牌视觉这块之前已经在对话里用两套深色/浅色对比截图让你选过了（选了浅色）。如果你自己上线看一眼 https://postory-dfd7b2qpra-ew.a.run.app 和预期的新 Logo/配色对不上，告诉我。
- **已知限制**：
  - WhatsApp/邮件短信触达/一句话下单的AI润色仍是 fake 模式（没配 Twilio/Resend/Anthropic key），功能链路都在但不会真的发出去，这个之前就说过"再等等"
  - PoStory 品牌改版只做完了"视觉皮"这一层（配色/Logo/全局 token），Dashboard/My Campaign 代运营IA改造（新顶部导航、Campaign管理、Admin内容创作后台等）还在按单元台账推进中，台账见 `docs/20261003-postory-brand-campaign-tasks.md`
  - `BrandProfile.whatsappNumber` 的审批绑定仍然是"匹配到哪个号就信哪个"，没有做成"绑定到具体某条待审请求"的更严格版本（上面安全修复里提到的已知后续项）
- **状态**：待观测

## 2026-09-28 · 首次上线

- **想达成什么**：Postory 帖事首次公开上线，任何人可注册；代码公开到 GitHub，但模板素材（Orshot / Bannerbear）不进公开库。
- **线上地址**：https://postory-dfd7b2qpra-ew.a.run.app
- **仓库**：https://github.com/erichecan/postory（public，历史已用 filter-repo 清除模板素材）
- **架构**：
  - Cloud Run `postory` · supply-491510 · europe-west1（europe-west3 报 region quota exceeded）· min 0 / max 3 · 1 vCPU / 1Gi
  - 镜像：`europe-west3-docker.pkg.dev/supply-491510/postory/web:<sha>`
  - 数据库：Neon eu-central-1（运行时走 pooler；迁移走直连）
  - Secrets：`postory-database-url`、`postory-auth-secret`（Secret Manager，由 compute 默认 SA 读取）
  - 模板图片：`gs://postory-templates`（allUsers 仅 legacyObjectReader：可 GET 单张，不可 list），应用内 `/assets/templates/*` fallback rewrite 代理
  - CI：`.github/workflows/deploy-web.yml`，SA `postory-deploy`（run.admin + 仅 postory 仓库 writer + 仅 compute SA 的 serviceAccountUser）
- **技术观测（我负责）**：
  - 部署时：GitHub Actions Verify `/login` 200、模板图 200；Playwright 实测登录 → 模板库（8/8 可见图加载，卡片高度 5 种）→ 编辑器打开并自动保存
  - 测试账号已删除；线上库 User=0 / Design=0 / Template=273
  - 观测窗口 7 天：Cloud Run 5xx 数、冷启动时长、Neon 连接数
- **定性观测（用户负责）**：请用手机打开线上地址注册一次，挑一个模板改店名导出 PNG——问自己一句：「这张图我愿意直接发出去吗？」
- **更新模板素材的方法**：本地 `public/assets/templates` 变更后 `gcloud storage rsync -r public/assets/templates gs://postory-templates`；模板数据用 `DATABASE_URL=<直连> SEED_SCOPE=templates npx tsx prisma/seed.ts` 导入
- **状态**：待观测

## 2026-09-29 · 一键登录 + 中英双语

- **想达成什么**：访客不注册也能试用（共用演示店铺）；中英文用户都能用。
- **技术观测（我负责）**：部署 Verify login/asset 200；Playwright 线上实测英文浏览器自动英文、一键登录、切换语言、390px 布局；线上库演示账号标识由 13900000000 改为 demo（未删数据）。观测窗口 7 天：Cloud Run 5xx、演示账号作品数增长。
- **定性观测（用户负责）**：把线上链接发给一位英文用户，问一句：「不看说明，你能在 3 分钟内做出一张图并导出吗？」
- **状态**：待观测

## 2026-09-28 · 商业化静态页（C0）

- **想达成什么**：让合作伙伴在线上看到商业化后的样子——会员权益对比页、我的会员、AI 生图工作台、后台客户方案表单。**全部是假数据**，不扣费、不收款、不调 OpenAI。
- **新增路由**：`/plans`（公开）、`/membership`、`/create`、`/admin/accounts/[id]`
- **技术观测（我负责）**：部署前 verify.sh VERIFY PASS；部署后线上探针 `/plans` 未登录 200、`/membership` `/create` 登录态 200、未登录跳登录；Playwright 线上截图。观测窗口 3 天：Cloud Run 5xx。
- **部署结果**：commit 12f6413，GitHub Actions run 36513435381 成功；Verify login 200、asset 200；线上 `/plans` 未登录 200，`/membership` `/create` 未登录 307 → /login，一键登录后均 200，AI 生图假结果图加载成功（截图 docs/shots/20260928-c0-prod-*.png）
- **定性观测（用户负责）**：把 `/plans` 链接发给一位目标客户，问一句：「看完这张表，你知道自己该选哪一档吗？」
- **状态**：待观测

## 2026-09-30 · 商业化演示版（C1–C8，方案 A）

- **想达成什么**：合作伙伴在线上看到完整的商业化流程——落地页、注册与邮箱验证、会员方案、credit 扣费、AI 生图（占位图）、生成历史、送到编辑器、付款流程（模拟 Stripe）、后台方案与成本看板。**不收真钱、不调 OpenAI。**
- **部署结果**：commit 7180190，GitHub Actions run 36656278591 成功；Verify：login、landing、legal、asset 均 200
- **本次变更**：
  - 线上库 `migrate deploy` 4 个迁移（commerce、session_version、generation_started_at、login_lockout），执行前后行数一致（User 1 / Template 273 / BrandProfile 1）
  - `SEED_SCOPE=templates` 写入 3 档会员等级
  - 新建私有桶 `gs://postory-user-media`（europe-west1，禁止公开访问），只有运行时 SA 有 objectAdmin
  - Cloud Run 环境变量：APP_URL、STORAGE=gcs、GCS_BUCKET、AI_PROVIDER=fake、STRIPE_MODE=fake；timeout 300s；min 0 / max 3
- **技术观测（我负责）**：
  - 部署后：公开页 7 个 200，/legal/nope 404；受保护页 4 个未登录跳 /login；webhook 无签名 400；media 未登录 401
  - 线上临时账号实测：文生图扣 1（3→2），结果图写入 GCS 并经 /api/media 加载，生成历史、送到编辑器正常；测试账号与 GCS 对象已删除；部署后 ERROR 日志 0 条
  - 观测窗口 7 天：Cloud Run 5xx、`[stripe]` / `[generation` 错误日志、GCS 桶用量
- **定性观测（用户负责）**：把线上地址发给一位合作伙伴，问一句：「从首页到做出一张图，哪一步让你犹豫了？」
- **已知限制（演示版）**：
  - 没配 Resend，线上注册收不到验证码（能跳过验证继续用，但领不到注册赠送的 10 个模板）
  - 点"去付款"会停在"还在确认付款结果"：模拟模式下没有 Stripe 通知
  - 线上还没有管理员账号，没法给合作伙伴手动加 credit 来试 AI 生图
- **状态**：待观测

## 2026-09-30 · Ayrshare 真实发布集成（多租户，fake 模式）

- **想达成什么**：让"设定发布"从假的本地状态机变成真的会调用 Ayrshare 发布网关（多租户：每个用户各自连接各自账号）；这一步先用 fake 模式把整条链路铺好，不产生真实调用和费用，等你决定注册 Ayrshare 付费试用再切换。
- **部署结果**：commit 37e3d37，GitHub Actions run 36667416178 成功；Verify：login/landing/legal/asset 均 200
- **本次变更**：
  - 线上库 `migrate deploy` 1 个迁移（新增 SocialAccount 表、User/Design 若干字段），执行前后行数一致（User 1 / Design 1 / Template 273）
  - 新建 Secret Manager 密钥 `postory-encryption-key`（复用现有项目级 secretAccessor 授权，未新增 IAM 绑定）
  - Cloud Run 环境变量新增 `AYRSHARE_MODE=fake`
- **技术观测（我负责）**：
  - 部署后线上实测：演示账号一键登录 → /profile 点 Facebook「连接」→ 新标签页 fake 秒连接 → 原页面自动刷新显示"已连接 demo"
  - 本地对同一套代码额外跑通了"上传导出图→真实调用发布网关→写回 publishStatus=SUCCESS/ayrsharePostId"，线上未重复这一步（避免在共用演示账号上留测试作品）
  - `verify.sh` 337 PASS / 0 FAIL；code-review high 6 条修复 5 条；security-review 未发现高置信度漏洞
  - 观测窗口 7 天：Cloud Run 5xx、`[ayrshare` 相关错误日志（目前没有任何真实 API 调用，理论上不会有）
- **定性观测（用户负责）**：没有新的用户可见界面变化需要单独问——这次是给已有的「设定发布」按钮接上真实后端，界面上多了 /profile 里的"已连接的社交账号"区块，可以自己点一次"连接"看看体验对不对
- **已知限制**：
  - 还没有真实 Ayrshare 账号，所有"发布"都是 fake 模式模拟成功，实际没有发到任何社交平台
  - X/Twitter 真实发布需要额外的 Twitter Developer OAuth1.0a Key，这次没接
  - 共用演示账号的 Facebook 现在处于"已连接（demo）"状态，是我验证时留下的，无害（fake 模式无真实副作用），未清理
- **状态**：待观测

## 2026-10-01 · 模板库按行业分类扩充至 428 个 + AI 每日自动生成草稿

- **想达成什么**：模板库补上行业分类（之前 Orshot 自带的分类数据被转换脚本丢弃），并从 Orshot 公开接口批量抓更多餐饮/美容/健身/医疗类模板；同时上线每天凌晨 3 点自动生成 10 个行业海报草稿的本地定时任务。
- **部署结果**：commit 81ee0da，GitHub Actions run 36813164366 成功；Verify：login/landing/legal/asset 均 200
- **本次变更**：
  - 线上库 `migrate deploy` 1 个迁移（Template 新增 categories/status 字段），执行前后行数一致（User 1 / Design 2）
  - 模板素材同步 `gcloud storage rsync` 到 `gs://postory-templates`，新增 338 个文件，dry-run 确认零删除
  - `SEED_SCOPE=templates` 重新导入模板：线上 Template 273 → **428**
  - 修复 `listTemplates`/`countTemplatesByPlatform`/`listSimilarTemplates` 未按 `status` 过滤的问题——这个漏洞发现于本地验证阶段，部署前已修复，AI 草稿从未在生产环境暴露过
  - 本地新增定时任务 `com.eric.postory.ai-daily-templates`（launchd，每天 3:00），用 `claude -p` headless 生成图层 JSON，status=draft，**不随本次 seed 上生产**，只在本地库
- **技术观测（我负责）**：
  - 部署后线上实测（Playwright，一键登录 → `/templates`）：分类筛选条显示"全部428"，新抓模板（orshot-999 美发、orshot-2084 美甲）图片 200 可加载
  - 本地实跑一次 AI 每日生成：10/10 成功，总成本 $0.5167（含 prompt cache 命中），数据只在本地库，未进生产
  - 观测窗口 7 天：Cloud Run 5xx、本地 launchd 任务是否按时触发（`~/Library/Logs/postory/ai-daily-templates.log`）
- **定性观测（用户负责）**：打开线上模板库，按行业关键词搜一下"餐饮"/"beauty"，看搜出来的结果是不是你想要的那种调性
- **已知限制**：
  - Orshot 库存里美发/美甲模板天然稀缺，批量抓取后关键词兜底只命中 2 条真实相关，这两个垂直目前基本是空的
  - AI 每日生成的草稿没有审核 UI，也没有背景图（image 图层只有文字描述占位），要看内容目前只能用 Prisma Studio 直接查本地库
  - 营销日历（`src/data/marketing-calendar.json`）里的农历节日日期是 2026 年专用，明年要手动更新
- **状态**：待观测
