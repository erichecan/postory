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

- [x] 单元 4：代理商登录后客户汇总 + 跨账号访问鉴权改造（/partners/clients、/partners/clients/[clientUserId]）
      验收命令：`npx tsc --noEmit`、`npm run build`、`npx eslint ...`、手工路由/越权探针（见下）。
             "验收命令：`scripts/verify.sh --scope partners-access`"是之前写计划时设想的写法，这个 flag 实际不存在
             （和单元 2、3 一样，verify.sh 目前没有 --scope 支持），延续单元 2/3 的实际做法：手工探针代替。
      可看物：同单元 2/3，本沙箱装不上 Chrome，没法生成 docs/shots/20261018-partners-clients.png。
             改用操作路径代替：代理商登录后打开 http://localhost:3002/partners/clients，看到已授权客户列表
             （客户名/店铺/已连接平台/本月产出/授权时间），点"查看"进 /partners/clients/<id>，复用现有
             Dashboard/My Brand/My Campaign/Calendar 四个页面展示该客户的真实数据，顶部有"正在以客户身份查看（只读）"
             提示条，My Brand 页面里所有"✎ Edit"编辑入口和"管理连接/断开连接"按钮都不出现。
      定性状态：待你确认（这是真人该打开看的页面，我这边没法代签"符合"）
      依赖：单元 0
      范围决定（L2，我自己定，记在这里）：
        本单元只做**只读**跨账号查看（Dashboard/My Brand/My Campaign/Calendar 四个现有页面复用），
        不做"代替客户操作"（/create 生成、/editor/[id] 编辑、日历排期/发布）。
        理由：追查后发现 `src/lib/actions/designs.ts`、`src/app/(app)/create/page.tsx` 等所有写路径都是
        `requireUser()`/`assertUser()` 直接绑定 session 自己的 user.id，没有任何"以 clientUserId 身份写"的参数化，
        要做成真正安全的"代替操作"需要改造一整条链路（AI 生成扣费、排期、发布），工作量和新攻击面都够开一个独立单元，
        和 DEV-PLAN 自己写的风险点 #1"跨账号访问是全新攻击面"冲突——不该在这个已经是最高风险的单元里再扩大攻击面。
        这个"代替操作"能力推迟到后续单元，不在本单元范围内。
      关键发现（如果没发现会出真实 bug，记下来避免以后踩同一个坑）：
        `BrandPage` 组件里有 7 处 `<BrandEditor data={data}>`（品牌资料/服务/优惠/相册的编辑入口）
        和一个"已连接社交账号"管理区（`SocialAccountsPanel` + "管理连接"链接），这些全部是绑定调用者自己 session 的
        写操作（`ProfileForm`、`connectSocialAction`/`disconnectSocialAction`）。如果直接复用这几个组件给代理商看客户数据，
        代理商点"编辑"改的会是**代理商自己**的品牌资料/社交账号，不是客户的——会悄悄写错数据，不会报错，很难发现。
        修法：`AgencyData` 新增 `readOnly` 字段；`BrandEditor`（`src/components/visual/forms.tsx`）在 `readOnly` 时直接
        `return null`（一处改动覆盖全部 7 个调用点，不用逐个包裹）；`BrandPage` 的社交账号区在 `readOnly` 时和 `demo`
        一样走静态列表分支，不渲染 `SocialAccountsPanel`。`DashboardPage`/`CampaignsPage`/`CampaignDetailPage`/
        `CalendarPage` 逐个查过，没有类似的写操作绑定，可以直接复用。日历里唯一一处不带前缀的
        `/editor/${item.id}` 链接经确认是安全的：`getOwnDesign` 按 `userId` 查询，代理商点进去会 404，不会看到或改到
        别人的内容，保留现状不处理。
      证据：
        - 新增 `src/lib/db/agency-access.ts` 的 `listAgencyClientOverviews`（客户列表汇总，固定 4 条查询不随客户数线性增长，
          满足 DEV-PLAN 风险点 #7）、`hasAnyAgencyAccess`。
        - 新增 `src/lib/db/users.ts` 的 `getUserName`（给跨账号查看解析客户姓名用）。
        - 重写 `src/lib/auth/agency-access.ts` 的 `requireClientAccess`：未登录走 `requireUser()` 的 302；已登录但
          没有这个客户的 `AgencyAccess` 走 `forbidden()`（Next.js 16 `authInterrupts`，真实 403 状态码，不是假装的
          redirect）；用 `react cache()` 包一层，同一次请求里 layout + page 各调一次只真正查一次库。
          `next.config.ts` 开启 `experimental.authInterrupts: true`（`forbidden()` 的前提条件）。
        - `src/lib/agency/types.ts` 的 `AgencyData` 新增 `basePath?`/`readOnly?`；`src/lib/agency/data.ts` 拆出
          `loadAgencyData(userId, name)`，`getAgencyData()` 保持向后兼容，新增 `getAgencyDataForClient(clientUserId, clientName, basePath)`。
        - `src/components/visual/shell.tsx`（`VisualHeader` 新增 `basePath` 覆盖导航前缀）、
          `src/components/visual/customer-pages.tsx`（`prefix()` helper 改用 `data.basePath`，`CustomerFrame` 透传
          `basePath`，只读查看时顶部提示条，社交账号区 `readOnly` 分支）、`src/components/visual/forms.tsx`
          （`BrandEditor` 的 `readOnly` 短路）。
        - 新增路由：`src/app/partners/clients/page.tsx`（客户列表，`PartnerClientsList` 组件）、
          `src/app/partners/clients/forbidden.tsx`（403 自定义文案）、
          `src/app/partners/clients/[clientUserId]/layout.tsx`（鉴权闸门）、
          `.../page.tsx`（Dashboard）、`.../my-brand/page.tsx`、`.../my-campaign/page.tsx`、
          `.../my-campaign/[campaignId]/page.tsx`、`.../calendar/page.tsx`。
        - `src/i18n/messages/{zh,en}/partners.json` 新增 `clients` 命名空间。
        - `npx next typegen && npx tsc --noEmit` → 无输出；`npm run build` → 成功，8 个新路由全部出现在路由表
          （含 `/partners/clients/[clientUserId]/my-campaign/[campaignId]`）；
          `npx eslint src/app/partners src/lib/agency src/lib/auth/agency-access.ts src/lib/db/agency-access.ts
          src/lib/db/users.ts src/components/visual/{customer-pages,shell,forms}.tsx
          src/components/partners/partner-clients-list.tsx` → 无输出。
        - 手工越权探针（`npx next start -p 3010`，本机 `social_shell` 库里已有的真实账号：代理商 A=13900000000，
          代理商 B=13600000002，客户=13700000001 阿杰烘焙；用脚本直接写 `AgencyAccess` 表授予 A→客户 的访问权，
          AgencyAccess 行留在本机开发库里）：
          - 未登录 `GET /partners/clients` → 307→`/login?next=...`；未登录 `GET /partners/clients/<id>` → 同样 307。
          - 代理商 A（有授权）`GET /partners/clients` → 200，正文含客户真名"阿杰烘焙"。
          - 代理商 A `GET /partners/clients/<客户id>` → 200；`.../my-brand` → 200，正文里 `ps-small-button`
            （编辑按钮 class）出现 0 次，`connectSocialAction`/`disconnectSocialAction` 出现 0 次，
            "管理连接"文案出现 0 次，"正在以客户身份查看（只读）"提示条出现 1 次——确认写操作入口全部被隐藏。
          - 代理商 B（没有这个客户的 `AgencyAccess`）`GET /partners/clients/<客户id>` → 403，正文含"没有权限查看"
            和"返回客户列表"（`forbidden.tsx` 自定义文案生效，不是默认 Next.js 错误页）。
          - 客户本人查看自己 `GET /partners/clients/<自己id>` → 200（改用另一个未被禁用的账号验证——原计划用的
            13700000001 这个账号本身在数据库里是 `disabled=true`，自己登录会被直接 307 到 `/login`，这是账号
            本身的既有状态，和本单元代码无关，排查后换了另一个未禁用的账号确认"自己查自己"这条路径没问题）。
      假设（未阻塞开发，记在这里）：
        - 代理商 A→客户（阿杰烘焙）的 `AgencyAccess` 授权是我手工用脚本写入的测试数据，不是通过产品里的真实流程
          授予的——因为授予入口本来就是单元 5（`/admin` 试做转付费核账动作）要做的事，单元 4 的 DEV-PLAN 依赖写的
          也只是"单元 0"（schema），不依赖单元 5，所以这里的测试数据是为了验证单元 4 本身而手工搭的，不代表
          单元 5 已经做了。

- [x] 单元 5：/admin 试做转付费核账动作（/admin/partner-trials、/admin/partner-trials/[id]）
      验收命令：`npx tsc --noEmit`、`npm run build`、`npx eslint ...`、手工业务逻辑/鉴权探针（见下）。
             "验收命令：`scripts/verify.sh --scope partners-convert`"是之前写计划时设想的写法，这个 flag 不存在
             （和单元 2-4 一样，verify.sh 没有 --scope 支持），延续同样的做法：手工探针代替。
      可看物：同单元 2-4，本沙箱装不上 Chrome，没法生成 docs/shots/20261018-admin-convert.png。
             改用操作路径代替：管理员登录后打开 http://localhost:3002/admin/partner-trials，看到试做申请列表
             （客户名/代理商/状态/提交时间），点"查看"进详情页，看到代理商名称/联系方式/代理商账号（有登录就显示
             账号 id，匿名提交就显示"未登录提交，需手动核对账号"并多一个"代理商邮箱"输入框）/行业/国家/产品介绍，
             未转化的申请下方是"确认收款，创建客户账号"表单（邮箱/电话/姓名/初始密码，匿名提交额外要填代理商邮箱）；
             提交后跳到该客户的 `/admin/accounts/[id]`，账号详情页复用现有功能选套餐、点"开通"激活线下付费。
      定性状态：待你确认（这是真人该打开看的管理后台页面，我这边没法代签"符合"；此外见下方"未验证"说明）
      依赖：单元 1、单元 4
      范围决定（L2，我自己定，记在这里）：
        DEV-PLAN 字面写"创建客户 User + CustomerPlan(billing=OFFLINE) + AgencyAccess + 置 CONVERTED"，
        但没规定套餐怎么选、线下预付了几个月。账号详情页（`/admin/accounts/[id]`）已经有现成的套餐选择
        （`PlanForm`→`adminSavePlanAction`）和"线下开通 N 个月"（`adminActivateOfflineAction`→`activateOffline`，
        会按月数发放 credit/视频额度）——这两个动作本来就要管理员填等级、币种、月费、月数这些业务参数，
        不是本单元该臆造默认值的地方。所以本单元只做"开户 + 授权 + 标记转化"三件事，
        套餐/开通线下付费这一步直接导向现成页面，不重新做一套重复的表单。
        理由：DRY，且避免凭空定一个等级/月数的默认值糊弄过去——这类业务参数该由管理员在核账时当场填，
        不该由我猜。
      证据：
        - 新增 `src/lib/db/partner-trials.ts` 的 `listTrialRequests`（全量，人工核账场景量级不大，不分页）、
          `markTrialConverted`（置 CONVERTED + 写 convertedUserId）。
        - 新增 `src/lib/actions/partner-trials-admin.ts` 的 `adminConvertTrialAction`：
          管理员鉴权 → 查申请存在且未转化 → 解析代理商 userId（申请自带 agencyUserId 直接用；
          为空则要求填 agencyEmail 并按邮箱查找已注册账号，查不到报错，不会静默失败或自己造一个代理商账号）→
          `createUser`（复用现有 `source: "OFFLINE"` 开户路径，和线下开户账号同一套逻辑）→
          `grantAgencyAccess`（单元 1 已有的 upsert，防重复）→ `markTrialConverted` → `redirect` 到账号详情页。
          email 唯一冲突（P2002）会报"该邮箱已有账号"，不会把部分步骤的脏数据留下
          （createUser 失败发生在 grantAgencyAccess/markTrialConverted 之前，不会有部分提交）。
        - 新增页面 `src/app/(app)/admin/partner-trials/page.tsx`（列表）、`.../[id]/page.tsx`（详情+转化表单）、
          `src/components/admin/convert-trial-form.tsx`（根据 `agencyUserId === null` 决定是否显示代理商邮箱输入框）。
        - `src/components/admin/admin-subnav.tsx` 加了"代理商试做"标签页。
        - `src/i18n/messages/{zh,en}/admin.json` 新增 `nav.partnerTrials`、`partnerTrials` 命名空间
          （含 6 条 errors 文案）。
        - `npm run typecheck`（`next typegen && tsc --noEmit`）→ 无输出；`npm run build` → 成功，
          `/admin/partner-trials`、`/admin/partner-trials/[id]` 均出现在路由表；
          `npx eslint src/lib/db/partner-trials.ts src/lib/actions/partner-trials-admin.ts
          src/components/admin/convert-trial-form.tsx src/components/admin/admin-subnav.tsx
          "src/app/(app)/admin/partner-trials/page.tsx" "src/app/(app)/admin/partner-trials/[id]/page.tsx"`
          → 无输出。
        - 手工鉴权探针（`npx next start -p 3002`，真实生产模式服务器）：未登录 `GET /admin/partner-trials` → 307；
          非管理员真实账号 `GET /admin/partner-trials`、`GET /admin/partner-trials/<id>` → 均 307；
          管理员真实账号 → 均 200；详情页按 `agencyUserId` 是否为空正确显示/隐藏"代理商邮箱"输入框
          （grep 页面 HTML 确认）。
        - 手工业务逻辑探针（脚本直接复现 `adminConvertTrialAction` 内部完全一致的查询/写入序列，
          因为该函数依赖 `cookies()`/`next-intl`/`redirect()` 等仅在 Next 请求上下文里才能用的 API，
          脚本没法跳过 Next 运行时直接调用这个函数本身——见下方"未验证"说明）：
          用真实测试数据（代理商账号、已登录提交的试做申请 A、匿名提交的试做申请 B、匿名提交的试做申请 C）跑了
          6 个场景：① A 正常转化成功，agencyUserId 正确复用申请自带的值；② A 再次转化报 `alreadyConverted`；
          ③ B 不填代理商邮箱报 `agencyEmailRequired`；④ B 填一个不存在的代理商邮箱报 `agencyNotFound`；
          ⑤ B 填正确的代理商邮箱转化成功，agencyUserId 正确解析为该邮箱对应账号；⑥ C 用一个已被占用的邮箱报
          `emailTaken`，且失败后 `PartnerTrialRequest` 状态仍是 `SUBMITTED`、`convertedUserId` 仍是 null
          （没有留下部分提交的脏数据）。数据库核对：新建客户账号 `source=OFFLINE`、`emailVerifiedAt` 非空；
          两条成功场景各生成一行 `AgencyAccess`；对应 `PartnerTrialRequest` 状态和 `convertedUserId` 都正确更新。
          所有测试用户/试做申请/AgencyAccess 行均已清理，复查确认残留数为 0。
      未验证（⚠️，如实标注，不包装成已完成）：
        - 上面"业务逻辑探针"验证的是**和 Server Action 完全一致的查询/写入序列**，不是 Server Action 本身
          被真实点击提交的那次调用。原因：`adminConvertTrialAction` 用了 `assertAdmin()`（内部 `cookies()`）、
          `getTranslations()`、`redirect()`，这些都要求 Next.js 的请求上下文（AsyncLocalStorage），脚本在
          Next 运行时之外直接 import 调用会直接抛错，没法用来测这个函数本体；而真正走 HTTP 发 Server Action
          需要构造 React 的内部 action-id/RSC 协议，这个沙箱也没有真实浏览器能点一次表单。
          这一步（真的点一次"确认并创建账号"按钮）需要你或我在有浏览器的环境里实际操作一次来补这个空当，
          和"可看物"要你确认的事项是同一件事，不是独立的新问题。

- [x] 单元 6：verify.sh 全量探针补完 + 中英文案核对
      验收命令：`scripts/verify.sh`（完整跑一遍，含本单元新增的 partners-probe 步骤）
      可看物：无
      定性状态：不涉及
      依赖：单元 0-5
      范围核对（发现冲突事实，记录后按合理判断继续，不是新问题/不阻塞）：
        DEV-PLAN 附录 A 第 95、96 条（"修改次数探针"：同一 Design 编辑 3 次第 3 次应新建记录；
        "视频时长探针"：durationSeconds > 12 走 VIDEO_OVERAGE 计费路径）核对代码后确认：
          - `revisionCount` 字段只在 `prisma/schema.prisma` 里声明和注释，整个 `src/` 没有任何地方读写它，
            应用层从未实现"原地累加 2 次、第 3 次强制新建"的逻辑。
          - `src/lib/billing/plan-math.ts` 明确注释：VIDEO_STANDARD/VIDEO_OVERAGE 单价未定，
            "代码库里还没有任何会真正发起视频生成请求、调用 chargeCredits(VIDEO_OVERAGE) 的入口"。
        这两条验收标准对应的功能本身不存在，和这次"代理商合作销售"范围无关（不是本轮新增，也不是
        本轮改坏的），本单元不代为实现这两个无关功能去凑一条探针——那是另一个功能模块该做的事，
        维持 ⚠️ 未验证/功能未实现，不标 ✅、也不假装测过。
        第 97 条"多平台不重复扣费"核对后确认**已实现且已有探针覆盖**：`chargeDesign` 按
        `design:${design.id}` 做幂等 key（`src/lib/db/entitlements.ts`），`scripts/paywall-probe.ts`
        里"同一作品改发布时间不再扣"场景已经把平台集合从 3 个改成 1 个并断言余额不变，等价覆盖了
        这条验收点，不需要重复新建一条探针。
      证据：
        - 新增 `scripts/partners-probe.ts`：覆盖附录 A 第 90-94 条里真正属于本次范围、且此前
          verify.sh 未覆盖的部分——
          路由探针（`/partners`、`/partners/trial` 公开 200；`/partners/trial/[存在token]` 200；
          `/partners/trial/[随机token]` 404）、
          越权探针（代理商 A 查代理商 B 的客户 → 403；没有任何 AgencyAccess 的普通用户查任意客户 → 403；
          未登录访问 `/partners/clients` → 跳登录）、
          试做判重探针（同一 `clientBrandName+agencyContact` 重复提交，`createTrialRequest` 返回
          `duplicate:true` 且复用同一条记录的 id，期间前后 `PartnerTrialRequest` 总数不变）。
        - `scripts/verify.sh` 新增一步调用 `partners-probe.ts`（放在 admin-probe 之后），沿用其它
          server-only DAL 直调探针的 `NODE_OPTIONS="--conditions=react-server"` 用法。
        - 关于"未登录访问 /partners/clients → 302"：实测该路径走 `requireUser()` 的 `redirect("/login")`，
          真实状态码是 **307**，不是 DEV-PLAN 附录 A 原文写的 302——和这个代码库里所有其它"未登录跳登录"
          场景的真实返回码一致（`scripts/probes.ts`/`scripts/admin-probe.ts` 等全部断言 307），
          附录 A 原文的"302"是写计划时的笼统说法，探针按实测的真实行为断言，不是本单元引入的不一致。
        - `npx eslint scripts/partners-probe.ts --quiet` → 无输出；`npm run typecheck` → 无输出。
        - `npx tsx scripts/partners-probe.ts <生产模式服务器>`（`NODE_OPTIONS="--conditions=react-server"`）
          单独运行：8 项全部 PASS（见下方命令输出片段）；复查确认测试账号/试做申请全部清理，残留数 0。
          ```
          ## 路由探针
          PASS  GET /partners 公开 200
          PASS  GET /partners/trial 公开 200
          PASS  GET /partners/trial/[存在的token] → 200
          PASS  GET /partners/trial/[随机token] → 404
          ## 越权探针
          PASS  未登录访问 /partners/clients → 跳登录（3xx）  (status=307)
          PASS  代理商 A 访问代理商 B 名下客户 → 403  (status=403)
          PASS  没有任何 AgencyAccess 的普通用户访问任意客户 → 403  (status=403)
          ## 试做判重探针
          PASS  同一 clientBrandName+agencyContact 重复提交 → 标记重复，不新建记录  (before=3 after=3 duplicate=true)

          全部通过
          ```
        - `node scripts/check-i18n.mjs` → exit 0，key 一致性/空值检查无报错；输出里列出的"残留中文"
          全部是本次改动之外的既有文件（`src/lib/demo/industries/*`、`src/lib/db/nl-order.ts`、
          `src/lib/db/calendar.ts` 等演示/日历模块的中文字面量），admin.json/partners 相关命名空间
          没有被列出，不是本单元引入的问题。
        - `scripts/verify.sh` 全量跑了一遍（含上面新增的 partners-probe 步骤），结论是 **VERIFY FAIL**，
          3 项失败，但**全部确认是本次"代理商合作销售"改动之前就存在、与这次范围无关的既有问题**，
          不是本单元引入的，也不是本单元该代为修复的：
          1. `eslint`：2 个既有文件报错（`scripts/visual/verify-demo-fidelity.cjs` 的 require 导入、
             `src/lib/demo/templates/__tests__/template-pack-definitions.test.ts` 的 `any` 类型），
             `git log` 确认最后改动于 `3287219`（本次单元 0-6 之前），和 partners/admin 代码无关。
          2. `check-i18n.mjs`：真实退出码是 1（之前我手动核对时错把 `tail` 的退出码当成了它的退出码，
             这里纠正），报出的"残留中文"全部在既有的演示行业模板（`src/lib/demo/industries/*`）、
             自然语言排期（`src/lib/db/nl-order.ts`）、WhatsApp 文案（`src/lib/whatsapp.ts`）、
             营销日历（`src/lib/marketing-calendar/*`）等文件里，没有一条出现在 `admin.json`/
             `partners.*` 相关文件或本单元新增文件。
          3. `Template 数量 = catalog.json`：期望 428、实际 438，数据库里多出 10 条真实 `orshot-*`
             模板（非测试脏数据，`psql` 核对过是正常模板行），是本地开发库和 `catalog.json` 文件
             本身的既有漂移，与本次改动无关、我的探针从未写过 `Template` 表。
          本次新增的 `partners-probe` 步骤本身在全量跑里完整 PASS（见上面单独运行的 8 项输出，
          全量跑里位置相同、同样全部 PASS）。按铁律如实记录：**不**把这次 `scripts/verify.sh`
          标为整体 ✅通过——退出码确实非 0；但这 3 项失败和本次代理商合作销售的范围无关，
          不在本单元里代为修复（修 eslint any 类型、翻译既有中文文案、重新对齐模板种子数据，
          都是跟这次改动无关的独立技术债，擅自去改会超出本单元范围）。这件事需要在给用户的
          汇报里明确提一句，不能埋在台账里就当作本单元"通过"了。
