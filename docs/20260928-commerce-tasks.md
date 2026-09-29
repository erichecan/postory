# 商业化台账（DEV-PLAN v2）

进度唯一真相。每周期：读台账 → 做 → 验证 → 提交 → 回写。

- [x] C0 静态页：/membership、/create、余额不足弹窗、/admin/accounts/[id] 方案表单、会员等级区块、顶栏余额、/plans 权益对比（追加）
      验收命令：npm run typecheck && npm run lint && node scripts/check-i18n.mjs
      可看物：docs/shots/20260928-c0-*.png（12 张，含 plans / plans-390 / plans-en）
      定性状态：导航顺序、三档名字已确认（2026-09-28）；权益对比页待你确认
      证据：tsc 通过；eslint 0 问题；i18n keys zh=425 en=425 OK；390px 下 /membership、/create 无横向滚动
      依赖：无
- [x] C1 Schema 迁移 + 平台 id 迁移 + credit 账本（并发测试）
      验收命令：bash scripts/verify.sh（账本不变量段）
      可看物：docs/shots/20260928-c1-membership-demo.png、20260928-c1-wechat-dialog.png
      定性状态：—（技术单元）
      证据：VERIFY PASS 109 项；ledger-probe 13/13（并发 20 扣 5 恰好 5 成功、退款成对、重复退款拒绝、同作品只扣一次、赠送仅模板、先到期先用、过期/未生效不可扣、refId 幂等）；query-probe 流水+余额 10 条=3 次、200 条=3 次
      偏离 DEV-PLAN：CreditGrant 加 unit(CREDIT|VIDEO)；CreditTxn 用 allocations Json 记录分摊（替代 grantId），@@unique(userId,kind,refId) 保证幂等；MembershipTier 加 slug/tagline/features/recommended
      遗留：/admin/accounts/[id] 仍是假数据（C3）；联系微信号待用户提供，用 NEXT_PUBLIC_CONTACT_WECHAT 配置
      依赖：C0 确认
- [ ] C2 账号改造：邮箱注册、验证码、赠送 10、找回密码
      验收命令：verify.sh 鉴权 + 赠送幂等
      可看物：docs/shots/20260928-c2-*.png
      定性状态：待你确认
      证据：—
      依赖：C1
- [ ] C3 后台：等级、客户方案、线下开通、调整 credit、流水
      验收命令：verify.sh admin 探针
      可看物：docs/shots/20260928-c3-*.png
      定性状态：待你确认
      证据：—
      依赖：C1
- [ ] C4 付费墙：导出/发布计划扣费、平台数限制、余额徽章
      验收命令：verify.sh 扣费不变量
      可看物：docs/shots/20260928-c4-*.png
      定性状态：待你确认
      证据：—
      依赖：C1、C3
- [ ] C5 AI 生图工作台 + 生成历史 + 送到编辑器（fake provider）
      验收命令：verify.sh 生成/退款/限流
      可看物：docs/shots/20260928-c5-*.png
      定性状态：待你确认
      证据：—
      依赖：C1
- [ ] C6 Stripe：订阅、充值、Portal、webhook
      验收命令：verify.sh 金额 + webhook 幂等 + 验签
      可看物：测试模式截图
      定性状态：待你确认
      证据：—
      依赖：C3
- [ ] C7 落地页 + 法律页 + 后台成本看板
      验收命令：verify.sh 路由
      可看物：docs/shots/20260928-c7-*.png
      定性状态：待你确认
      证据：—
      依赖：C3
- [ ] C8 code-review high + security-review + DEV-REPORT；部署前停下确认
      验收命令：bash scripts/verify.sh 全绿
      可看物：DEV-REPORT.md
      定性状态：—
      证据：—
      依赖：C1–C7
