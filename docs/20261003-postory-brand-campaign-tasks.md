# PoStory 品牌改版 + Dashboard/My Campaign — 任务台账

依据 `docs/20261003-postory-brand-campaign-plan.md`（已确认，2026-10-03）。一周期 = 一个单元：读台账 → 做 → 验证 → 提交 → 回写状态。

- [x] 1+2. 品牌色彩 token 替换 + Logo 接入 + BRAND.name 改 "PoStory" + favicon（合并执行：两者分开截图会有一个单元是"半成品logo"，不如一起验收）
      验收命令：`npx tsc --noEmit` 通过、`npm run build` 通过（35 路由全部生成）、`npx eslint` 改动文件无错误
      可看物：file:///Volumes/datacenter/04-eric/AIcoding/postory/.playwright-mcp/page-2026-10-04T02-03-27-485Z.png （首页）、file:///Volumes/datacenter/04-eric/AIcoding/postory/.playwright-mcp/page-2026-10-04T02-03-31-879Z.png （Calendar）、file:///Volumes/datacenter/04-eric/AIcoding/postory/.playwright-mcp/page-2026-10-04T02-03-36-795Z.png （Templates）
      定性状态：待你确认（你已经选了"B 浅色整体"方向，这是按那个方向做的）
      证据：全站从强制深色改为默认浅色+热粉主色；逐个排查了 22 处写死 border-white/bg-white/bg-black/text-white 的旧深色残留，区分"overlay在图片上的徽章"（不碰，如模板缩略图角标）和"页面级半透明表面/边框"（换成 border-border/bg-muted/bg-accent 等语义 token），Playwright 实测首页/Calendar/Templates/Admin(未登录态自动跳转)均无破损；旧 favicon.ico 删除，改用从参考图裁出的 logo-mark 做 src/app/icon.png + 页头 Logo 组件换新
      依赖：无

- [ ] 3. 顶部导航重排：Dashboard/My Campaign/Calendar/My Brand；模板库/AI生图/我的设计/会员从客户导航拿掉；/profile 文案改 My Brand
      验收命令：verify.sh 路由探针（待单元12统一补）
      可看物：截图
      定性状态：待你确认
      证据：
      依赖：2

- [ ] 4. Schema migration：Campaign 模型 + Design.campaignId/reviewStatus/reviewNote + 两个新 enum
      验收命令：`npx prisma migrate status` 干净，`npx tsc --noEmit`
      可看物：无（纯 schema）
      定性状态：不涉及
      证据：
      依赖：无

- [ ] 5. db/actions 基础层：campaign 列表/详情查询（含鉴权）、dashboard 聚合查询（snapshot/currentCampaign/comingUp/socialAccounts）
      验收命令：单测/脚本跑一次查询，断言查询数固定不随数据量增长
      可看物：无（后端逻辑）
      定性状态：不涉及
      证据：
      依赖：4

- [ ] 6. Dashboard 页面（Hero/Snapshot/CurrentCampaign/ComingUp/SocialAccounts + 新客户态）+ 登录后默认落地页改为 /dashboard
      验收命令：verify.sh 路由探针（待单元12统一补）
      可看物：截图
      定性状态：待你确认
      证据：
      依赖：5

- [ ] 7. My Campaign 列表页（Active/Upcoming/Past 三个 tab）
      验收命令：verify.sh 路由探针（待单元12统一补）
      可看物：截图
      定性状态：待你确认
      证据：
      依赖：5

- [ ] 8. Campaign Detail 页（Hero + Strategy + Content Grid 4:5 卡片）
      验收命令：verify.sh 路由+越权探针（待单元12统一补）
      可看物：截图
      定性状态：待你确认
      证据：
      依赖：7

- [ ] 9. Content Review Drawer（480px 抽屉 + Approve/Request Changes action + toast 文案 + Ready for Review 橙色高亮）
      验收命令：Playwright 实测 approve/request changes 全流程
      可看物：截图
      定性状态：待你确认
      证据：
      依赖：8

- [ ] 10. Instagram 掉线横幅（视觉态，手动/静态触发）+ Campaign Completed 态文案
      验收命令：无
      可看物：截图
      定性状态：待你确认
      证据：
      依赖：6, 8

- [ ] 11. Admin 内容创作后台：/admin/accounts/[id] 加 Campaigns 区块（建 campaign、挑模板生成内容、标待审核、改排期文案）
      验收命令：Playwright 实测 admin 建 campaign+内容，客户侧能看到
      可看物：截图
      定性状态：待你确认
      证据：
      依赖：4, 8

- [ ] 12. verify.sh 全量补齐 + 跑通（路由/越权/admin 403/查询效率/迁移）
      验收命令：`bash scripts/verify.sh` 全绿
      可看物：无
      定性状态：不涉及
      证据：
      依赖：1-11

- [ ] 13. /code-review high + /security-review
      验收命令：findings 逐条处理或写明理由
      可看物：无
      定性状态：不涉及
      证据：
      依赖：12

- [ ] 14. DEV-REPORT.md
      验收命令：无
      可看物：完整报告
      定性状态：待你确认
      证据：
      依赖：13
