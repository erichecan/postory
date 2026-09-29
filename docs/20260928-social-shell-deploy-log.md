# social-shell 部署日志

## 2026-09-28 · 首次上线

- **想达成什么**：Postory 帖事首次公开上线，任何人可注册；代码公开到 GitHub，但模板素材（Orshot / Bannerbear）不进公开库。
- **线上地址**：https://postory-dfd7b2qpra-ew.a.run.app
- **仓库**：https://github.com/erichecan/social-shell（public，历史已用 filter-repo 清除模板素材）
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
- **定性观测（用户负责）**：把 `/plans` 链接发给一位目标客户，问一句：「看完这张表，你知道自己该选哪一档吗？」
- **状态**：待观测
