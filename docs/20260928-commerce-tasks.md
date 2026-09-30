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
- [x] C2 账号改造：邮箱注册、验证码、赠送 10、找回密码
      验收命令：verify.sh 鉴权 + 赠送幂等
      可看物：docs/shots/20260928-c2-{register,verify,banner,gift,membership-gift,login,forgot-sent}.png
      定性状态：待你确认
      证据：VERIFY PASS 137 项；auth-probe 23/23（注册跳验证、邮箱小写、重复邮箱拒绝、60s 重发限流、错 5 次作废、过期拒绝、正确码送 10 仅模板且不重复送、邮箱大小写不敏感登录、找回密码不泄露是否注册、错/重复 token 拒绝、重设后旧会话失效、手机号老账号可登录）
      偏离 DEV-PLAN：新增 User.sessionVersion（重设密码后旧会话失效）
      上线前必须：Cloud Run 配 APP_URL（重设链接域名，生产缺失会报错，防 Host 头伪造）、RESEND_API_KEY + MAIL_FROM（没有时验证码只打印在日志里，线上用户收不到）
      遗留：后台线下开通仍用手机号（C3 改为邮箱）；老手机号账号没有邮箱，收不到收据和找回密码
      依赖：C1
- [x] C3 后台：等级、客户方案、线下开通、调整 credit、流水
      验收命令：verify.sh admin 探针
      可看物：docs/shots/20260928-c3-{accounts,customer,tiers}.png
      定性状态：待你确认
      证据：VERIFY PASS 192 项；admin-probe 52/52（5 个写操作 × 无会话/伪造/普通用户/伪造 role 全部拒绝且库不变；负价/未知平台/非法币种拒绝；线下开通 3 个月=3 个首尾相接的月度 grant+3 个视频额度、仅当月可用、续开从原有效期末接续；调整需原因且记操作人、超额扣减拒绝；等级矩阵多项/缺项拒绝、推荐唯一、/plans 立即更新；邮箱建线下账号不送注册赠送）；客户列表 +200 用户查询数恒为 5 次
      遗留：方案表单的等级下拉只列对外显示的等级；Stripe 方案改价要到 C6 才同步到订阅
      依赖：C1
- [x] C4 付费墙：导出/发布计划扣费、平台数限制、余额徽章
      验收命令：verify.sh 扣费不变量
      可看物：docs/shots/20260928-c4-{export-charged,export-again,publish-locked,insufficient,membership-demo}.png
      定性状态：待你确认
      证据：VERIFY PASS 206 项；paywall-probe 14/14（无会话跳登录；余额 0 导出提示不够；别人作品 notFound 且不扣钱；首次导出扣 1、再导出不扣；无会员不能排期且不扣；方案外平台拒绝且不扣；基础+加开平台成功扣 1；改时间/已导出过不再扣；余额不足保持草稿；PAST_DUE 仍可排期；CANCELED 需开通）
      决策：先扣费再导出——导出失败时这个作品之后再导出免费，用户不会白花钱；截图绕过无法防，接受
      附带：新用户余额为 0 时，弹窗提示"先验证邮箱免费领 10 个模板"；演示账号余额卡显示"演示账号不能充值"
      依赖：C1、C3
- [x] C5 AI 生图工作台 + 生成历史 + 送到编辑器（fake provider）
      验收命令：verify.sh 生成/退款/限流
      可看物：docs/shots/20260928-c5-{photo-round1,refine-round2,failed-refund,history,history-390,editor}.png
      定性状态：待你确认
      证据：VERIFY PASS 240 项；gen-probe 29/29（无会话跳登录/run 401/media 401；演示账号拒绝；仅模板赠送不能生图且不留记录；标准扣 1、高清扣 2；上一张未完成再点→忙且不扣；B 调 A 的 run/取 A 的图/以 A 的图为底→404/拒绝；重复执行 409；路径穿越 404；[fail]/[reject] → FAILED + DEBIT/REFUND 成对；超 10 分钟 PENDING 打开历史即失败退款且不可再执行；GIF/伪装 PNG 拒绝；>10MB 拒绝不扣；每小时 30 次限流不扣；全站当日成本超上限拒绝不扣；同人并发 6 次只成 1 次只扣 1；送到编辑器生成新作品）；query-probe 生成历史 10 条=200 条=3 次、每页 24；/generations autocannon p50=28ms p97.5=37ms 341 req/s
      偏离 DEV-PLAN：Generation 加 startedAt（防同一条被执行两次）；提示词扩写先用固定模板拼英文提示词，接 OpenAI 时再加 LLM 扩写；"替换模板图片"未做，只做"送到编辑器新建作品"
      上线前必须：OPENAI_API_KEY + AI_PROVIDER=openai（真实 provider 待写）；STORAGE=gcs 待实现（目前只有本地盘，Cloud Run 上重启即丢）；Cloud Run 请求超时调到 300s
      遗留：>10MB 上传由 Next 请求体上限直接拒绝（500，前端已压缩到 1600px 正常用户碰不到）；删除用户时生成图文件不清理；多轮改图时占位图会把上一轮文字叠上去（仅占位图现象）
      依赖：C1
- [x] C6 Stripe：订阅、充值、Portal、webhook
      验收命令：verify.sh 金额 + webhook 幂等 + 验签
      可看物：docs/shots/20260929-c6-{pending-plan,success-pending,success-active,active-plan,topup-dialog,topup-success,cancel}.png（模拟 Stripe + 本地签名 webhook）
      定性状态：待你确认
      证据：VERIFY PASS 278 项；stripe-probe 30/30（无会话跳登录；无方案/演示账号不能付款也不建 Stripe 客户；99+2×30 EUR → 两行 15900 分；全包 C$200 → 一行；复用同一 Stripe 客户；无签名/错签名 400 且库不变；checkout 完成 → 生效+订阅号；invoice.paid 同事件 2 次+同发票新事件 1 次 → 只发 1 次 60+4 视频，本期末过期；invoice.paid 先于 checkout 到达 → 按客户号找到方案；payment_failed → 扣款失败；subscription.updated/deleted 状态同步；取消后可重新付款、生效中不能重复付；充值 <10 拒绝、50×€1.20 金额正确、到账不过期且只到一次、未付款不发；退款收回剩余只收一次；Portal；后台改价 → 订阅项替换；普通用户改价拒绝；后台取消 → 取消 Stripe 订阅）；.next/static 无密钥；/membership p50=36ms p97.5=51ms
      决策：Checkout 与订阅项都挂在固定 id 的 Product（postory_membership / postory_credits，首次调用自动创建），金额用 price_data 现场生成；改价 proration_behavior=none，下个周期生效；后台取消 = 立即取消 Stripe 订阅（不退款）；充值退款只收回这笔充值还没用掉的部分
      上线前必须：STRIPE_SECRET_KEY、STRIPE_WEBHOOK_SECRET（生产缺 key 会直接报错，不会走模拟）；Stripe 后台开 EUR/CAD、配 Customer Portal、webhook 订阅 6 个事件（checkout.session.completed、invoice.paid、invoice.payment_failed、customer.subscription.updated/deleted、charge.refunded）指向 /api/stripe/webhook
      遗留：部分退款（charge.refunded=false）不处理；订阅费退款不收回月度额度
      依赖：C3
- [x] C7 落地页 + 法律页 + 后台成本看板
      验收命令：verify.sh 路由
      可看物：docs/shots/20260929-c7-{landing,landing-hero,landing-390,landing-en,legal-refund,admin-generations}.png
      定性状态：待你确认（落地页文案与版式、法律条款内容）
      证据：VERIFY PASS 297 项；/、/legal/{terms,privacy,refund} 中英 200 且 lang 正确、未登录 200、/legal/不存在 404；/admin/generations 管理员 200、普通用户/无 token/伪造 token 跳走；后台生成日志+每日汇总 10 条=200 条=5 次查询；390px 无横向滚动
      决策：首页对所有人开放（原来登录后直接跳 /templates，现在顶栏按钮显示"进入工作台"）；成本看板不跨币种算毛利，给"每 credit 实际 OpenAI 成本（USD）"对比参考售价 €1；首页模板图人工精选 9 个餐饮/美业模板
      待你提供：运营主体名称（NEXT_PUBLIC_LEGAL_ENTITY，默认 Postory）、联系邮箱（NEXT_PUBLIC_CONTACT_EMAIL，没有时法律页写"通过网站联系我们（微信）"）；法律条款是按已实现规则起草的通用版本，未经律师审阅，未写适用法律/管辖地
      遗留：AI 前后对比是用 CSS 滤镜做的示意图（已标"示意图"），接 OpenAI 后换成真实前后对比图
      依赖：C3
- [ ] C8 code-review high + security-review + DEV-REPORT；部署前停下确认
      验收命令：bash scripts/verify.sh 全绿
      可看物：DEV-REPORT.md
      定性状态：—
      证据：—
      依赖：C1–C7
