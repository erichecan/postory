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

- [ ] 单元 2：试做申请 API + 专属查看链接页面（/partners/trial、/api/partners/trial、/partners/trial/[token]）
      验收命令：`scripts/verify.sh --scope partners-trial`
      可看物：docs/shots/20261018-partners-trial.png
      定性状态：待你确认
      依赖：单元 1

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
