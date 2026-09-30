# social-shell 部署日志

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
