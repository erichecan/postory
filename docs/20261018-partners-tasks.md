# 代理商合作销售 — 执行台账

计划：`docs/20261018-DEV-PLAN-代理商合作销售.md`（已确认）
需求原话：`docs/20261018-代理商合作销售-需求原话.md`

- [x] 单元 0：数据层 schema 变更 + migration
      验收命令：`npx prisma migrate dev --name partners_agency_access_and_trial`、`npx tsc --noEmit`、`npx prisma migrate status`
      可看物：无（纯数据层）
      定性状态：不涉及
      证据：
        - `npx prisma migrate dev` → 生成并应用 `prisma/migrations/20261018155127_partners_agency_access_and_trial/`，"Your database is now in sync with your schema."
        - `npx prisma migrate status` → "Database schema is up to date!"
        - `npx tsc --noEmit` → 无输出（通过）。中途修复了新增枚举值引发的连锁类型错误：
          `src/types/commerce.ts`（ChargeKind 手写类型补 VIDEO_STANDARD/VIDEO_OVERAGE）、
          `src/lib/billing/plan-math.ts`（CHARGE_CREDITS 补两项，占位 0，单价未定且暂无真实扣费入口，见假设清单）、
          `src/i18n/messages/{zh,en}/generations.json`（补 mode.VIDEO）、
          `src/i18n/messages/{zh,en}/billing.json`（补 charge.VIDEO_STANDARD/VIDEO_OVERAGE）。
      依赖：无
      假设（未阻塞开发，待你补充真实单价时再改）：
        - `GrantUnit.VIDEO` 的额度发放/余额展示（`admin-customers.ts`/`stripe-billing.ts`/`demo-commerce.ts`/`credits.ts getBalanceAt`）此前已存在；但“按视频实际扣费”的调用入口（`chargeCredits` 对应 VIDEO_STANDARD/VIDEO_OVERAGE 的真实消费场景）目前代码库里还没有任何视频生成功能会触发它，所以 `CHARGE_CREDITS.VIDEO_STANDARD/VIDEO_OVERAGE` 先占位为 0，不代表定价，附录 A 的"视频时长探针"在没有真实视频生成入口前标 ⚠️ 未验证。

- [x] 单元 1：权限助手 + 试做 DAL（AgencyAccess 校验、PartnerTrialRequest 系列 CRUD）
      验收命令：`npx tsc --noEmit`
      可看物：无（纯后端）
      定性状态：不涉及
      证据：
        - 新增 `src/lib/db/agency-access.ts`（hasAgencyAccess/grantAgencyAccess/listAgencyClients）
        - 新增 `src/lib/auth/agency-access.ts`（resolveClientUserId/assertClientAccess/requireClientAccess，统一"是本人或有 AgencyAccess 授权"判定，供单元 4 的跨账号路由复用）
        - 新增 `src/lib/db/partner-trials.ts`（createTrialRequest 含"按客户限 1 次"判重、getTrialRequestByToken/ById、addTrialFeedback）
        - `npx tsc --noEmit` → 无输出（通过）
      依赖：单元 0
      遗留（记入风险点，非本单元阻塞项）：
        - 试做阶段的 3 张样片/30 天计划由 PoStory 内部人工生产后写入 `PartnerTrialAsset`/`PartnerTrialPlanItem`，DEV-PLAN 路由清单里没有专门的"内部填充"页面/接口，单元 2 做查看页时需要决定这一步先靠 `/admin` 加一个最小录入动作还是先用脚本/Prisma Studio 手工写，不在本单元展开。

- [x] 单元 2：试做申请表单 + 专属查看链接页面（/partners/trial、/partners/trial/[token]，含反馈提交）
      验收命令：`npx tsc --noEmit`、`npm run build`、`npx eslint ...`、手工路由/提交探针（见下）
      可看物：本机截图工具（Playwright/Chrome DevTools MCP）在当前沙箱里都装不上 Chrome（`/Applications/Google Chrome.app` 不存在，`npx playwright install chrome` 报 `ENOENT /playwright`），没法生成 docs/shots/20261018-partners-trial.png。
             改用 20 秒内可复现的操作路径代替：`npm run dev` 后打开 http://localhost:3002/partners/trial 填表提交，
             会跳转到 http://localhost:3002/partners/trial/<token> 看到状态/缺项清单/30天计划(空)/3张图(空)/参考图/反馈表单。
      定性状态：待你确认（这是真人能打开看的页面，不是我这边能代签的"符合"）
      证据：
        - 发现并补齐 Unit 0 漏做的字段：新增 `PartnerTrialReference` 模型承载"Logo/照片/参考内容"上传，迁移 `20261018160447_partners_trial_reference`，`npx prisma migrate status` → up to date。
        - 新增文件：`src/lib/actions/partner-trials.ts`（提交+反馈两个 Server Action）、
          `src/components/partners/{partner-trial-form,partner-trial-feedback-form,partner-trial-view}.tsx`、
          `src/app/partners/trial/page.tsx`、`src/app/partners/trial/[token]/page.tsx`、
          `src/app/api/partners-media/[...key]/route.ts`（参考资料/样片图片下载，key 不可猜测+DB 存在性校验，不要求登录）、
          `src/lib/partners/trial-view.ts`（缺项计算、platformVariants 解析）、
          `src/i18n/messages/{zh,en}/partners.json`。
        - 修改：`src/lib/storage.ts`（新增 `partners-ref/`、`partners-asset/` key 命名空间）、
          `src/lib/db/partner-trials.ts`（补 `references` include、新增 addTrialReference/isPartnersRefServable/isPartnersAssetServable）、
          `src/lib/ai/image-bytes.ts`（拆出 `validateImageBytes` 给原生 File 上传复用，不只支持 dataURL）、
          `src/proxy.ts`（**修复遗留 bug**：登录态中间件白名单原来没有 `/partners`，会把试做公开页整体重定向到 `/login`，和 DEV-PLAN 2.2 节"公开（不需要登录）"的路由清单矛盾；补加 `/partners`、`/partners/trial*` 为公开路径）。
        - `npx tsc --noEmit` → 无输出；`npm run build` → 成功，`/partners/trial`、`/partners/trial/[token]` 均出现在路由表；`npx eslint <改动文件>` → 无输出。
        - 手工探针（`npm run dev`，curl 模拟浏览器无 JS 的 Server Action 原生表单回退协议，复现了真实的"填表→提交→跳转→查看→反馈"全流程，不是绕过业务逻辑的直接调用）：
          - `GET /partners/trial` → 200；修复 proxy.ts 前是 307→/login，修复后 200。
          - `GET /partners/trial/<随机字符串>` → 404。
          - `POST /partners/trial`（带一张 68 字节测试 PNG 作为参考资料）→ 303 跳转到 `/partners/trial/<token>`。
          - `GET /partners/trial/<token>` → 200，正文含品牌名、"已提交，等待制作"、缺项清单正确只列出未填的"官网链接"（其余字段都填了）、参考图 `<img>` 指向 `/api/partners-media/partners-ref/...png`。
          - `GET /api/partners-media/partners-ref/<真实key>` → 200 image/png；伪造 key → 404；用 `gen/` 命名空间的 key 去闯 → 404（命名空间互相隔离没被突破）。
          - 用同一个 `clientBrandName+agencyContact` 再提交一次 → 303 跳到**同一个** token（判重命中，附录 A"试做判重探针"的前半部分，另一半"第二次被拒绝/标记重复"按我单元 1 就定下的"直接复用同一条链接"口径，不是拒绝，口径已在单元 1 遗留记录过）。
          - `POST /partners/trial/<token>`（反馈表单）→ 200，页面渲染出"已收到反馈"和刚提交的反馈内容。
        - 测试数据原样留在本机开发数据库里（客户品牌名"测试客户品牌A"），本机 `social_shell` 库，不是生产环境，可自行用 Prisma Studio 清理。
      依赖：单元 1
      遗留（记入风险点，非本单元阻塞项）：
        - `PartnerTrialAsset`（30天计划+3张样片）目前还没有任何写入入口——单元 1 就记过这个遗留，这里再次确认：查看页已经按"空状态"正确处理（`planEmpty`/`assetsEmpty` 文案），等单元 5 的 `/admin` 录入动作做完才能看到非空效果，不是本单元的 bug。
        - 没有真实浏览器环境做视觉截图，"长什么样"这一步需要你自己打开 http://localhost:3002/partners/trial 看一眼，我这边没法越过这一步替你确认。

- [ ] 单元 3：合作介绍页 /partners（文案+真实样例+跳转到现有 demo 流程演示）
      验收命令：`scripts/verify.sh --scope partners-landing`
      可看物：docs/shots/20261018-partners-landing.png
      定性状态：待你确认
      依赖：单元 2（试做入口要能跳转）

- [ ] 单元 4：代理商登录后客户汇总 + 跨账号访问鉴权改造（/partners/clients、/partners/clients/[clientUserId]）
      验收命令：`scripts/verify.sh --scope partners-access`
      可看物：docs/shots/20261018-partners-clients.png
      定性状态：待你确认
      依赖：单元 0

- [ ] 单元 5：/admin 试做转付费核账动作
      验收命令：`scripts/verify.sh --scope partners-convert`
      可看物：docs/shots/20261018-admin-convert.png
      定性状态：待你确认
      依赖：单元 1、单元 4

- [ ] 单元 6：verify.sh 全量探针补完 + 中英文案核对
      验收命令：`scripts/verify.sh`
      可看物：无
      定性状态：不涉及
      依赖：单元 0-5
