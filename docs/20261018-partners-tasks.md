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

- [x] 单元 3：合作介绍页 /partners（文案+真实样例+跳转到现有 demo 流程演示）
      验收命令：`npx tsc --noEmit`、`npm run build`、`npx eslint ...`、手工路由/分享元数据探针（见下）
      可看物：同单元 2，本沙箱仍然装不上 Chrome，无法生成 docs/shots/20261018-partners-landing.png，
             改用操作路径代替：打开 http://localhost:3002/partners，首屏是真实样例图（Sophie Chen Beauty Studio），
             往下依次是"适合谁/合作分工/能交付什么/如何合作/计费说明/客户如何参与/常见问题/结束引导"八个区块，
             主按钮"免费试做 3 张图片"跳 `/partners/trial`，次按钮"查看合作流程"跳现有 `/demo/my-brand`。
      定性状态：待你确认（真人该看的页面，我这边没法代签）
      证据：
        - 新增 `src/components/partners/partner-landing.tsx`（八个区块的纯展示组件，复用 `/visual/beauty-1`、`beauty-2`、`campaign-cover` 三张 Sophie Chen Beauty Studio 样板图作为"首屏真实样例"，和三节流程演示共用同一套素材，不重复生产，按需求原话第 165/175 条口径）、
          `src/app/partners/page.tsx`（路由文件，`ds-document`/`PublicHeader`/`AppFooter`/next-intl 约定，与单元 2 的 `/partners/trial` 保持同一体系；全站另有一套 `ps-`/`VisualHeader` 视觉大页体系用于 `/services` 等面向终端商家客户的页面，经核对后判断 `/partners` 的受众是代理商，和 `/partners/trial` 同一受众同一套体系更合适，不跟 `/services` 混用，这个取舍记在这里）。
        - `src/i18n/messages/{zh,en}/partners.json` 新增 `landing` 命名空间（含 `meta.title/description` 供分享元数据使用）。
        - `generateMetadata` 接入 OpenGraph/Twitter 卡片（标题/摘要/封面图），满足需求原话第 4 条"补齐链接分享时显示的标题、摘要和封面"；复用同一张 `campaign-cover.webp` 做封面图，因为全站目前没有专门制作的分享封面图素材（记为假设，不阻塞，有专门素材后再换）。
        - 顺手给 `/partners/trial/[token]`（代理商实际会转发给客户的那条专属链接）也补了同样的 OG 元数据（标题=客户品牌名，摘要=当前状态），比合作介绍页本身更需要这个，手工验证：提交一条新申请拿到 token，`curl` 该页 `<title>`/`og:title`/`og:description`/`og:image` 均正确显示品牌名和状态。
        - 顺手修复单元 2 遗留的一个小缺口：`partner-trial-view.tsx` 的"转付费"区块只有文案提到"联系我们核实预付款"，却没有真正的联系按钮（`convertContact` 这个翻译 key 之前定义了但没用上）；补了 `<ContactButton>`，手工验证按钮文案"联系我们开通"确实渲染在页面里。
        - 没有改动面向终端商家客户的主站导航（`src/components/visual/shell.tsx` 的 `publicLinks`）：`/partners` 是面向代理商的独立转发链接入口（需求原话"建议设置独立的合作介绍页"），不是要抢主站给商家客户看的导航位，先不加；之后如果要在主站导航露出，是一行代码的事，记在这里。
        - `npx tsc --noEmit` → 无输出；`npm run build` → 成功，`/partners` 出现在路由表，构建输出无 warning/error；`npx eslint <改动文件>` → 无输出。
        - 手工探针（`npm run dev -- -p 3099`）：
          - `GET /partners` → 200；`<title>`/`og:title`/`og:description`/`og:image` 均正确；页面正文包含八个区块标题且各出现 3 次（可见文案 + RSC payload，属正常重复，不是渲染了多份）；两个指向 `/demo/my-brand` 的链接（次按钮 + "如何合作"区块的"查看完整演示"）和指向 `/partners/trial` 的主按钮均渲染为真实 `<a href="...">`；FAQ 区块渲染出 6 个 `<details>`，和配置的 6 条问答对应。
          - 复用单元 2 建立的 curl 模拟无 JS Server Action 回退协议，提交一条新申请（品牌名"单元3验证品牌OG"）验证 `/partners/trial/[token]` 的分享元数据和新增的"联系我们开通"按钮。
        - 测试数据再添一条留在本机开发库（品牌名"单元3验证品牌OG"），和单元 2 的"测试客户品牌A"一样留在本机 `social_shell` 库，可自行用 Prisma Studio 清理。
      依赖：单元 2
      遗留（记入风险点，非本单元阻塞项）：
        - 没有真实浏览器环境做视觉截图，这一步仍然需要你自己打开页面看一眼。
        - "能交付什么"区块里的"短视频"一项按需求原话如实标注"计数和修改规则尚在确定"，没有编造具体规则。

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
