# 营销日历模块 — 任务台账

依据 `DEV-PLAN.md`（2026-10-03 全量版）。一周期 = 一个单元：读台账 → 做 → 验证 → 提交 → 回写状态。

- [ ] 1. Schema：BrandProfile 新字段 + 7 张新表 + migration
      验收命令：`npx prisma migrate status` 干净，`npx tsc --noEmit` 通过
      可看物：无（纯 schema）
      定性状态：不涉及
      证据：
      依赖：无

- [ ] 2. 行业映射表 + 种子数据（MarketingEvent ~25条 / CampaignTemplate 各行业活动库）
      验收命令：`npx prisma db seed` 跑完，查表行数符合预期
      可看物：无（数据）
      定性状态：不涉及
      证据：
      依赖：1

- [ ] 3. 日历生成引擎（规则引擎，按 industry+country+月份 生成 CalendarSlot）
      验收命令：单测/脚本跑一次生成，断言 createMany 不是循环 insert
      可看物：无（后端逻辑）
      定性状态：不涉及
      证据：
      依赖：1, 2

- [ ] 4. /calendar 月视图页面 + 模板抽屉交互
      验收命令：verify.sh 路由探针
      可看物：截图
      定性状态：待你确认
      证据：
      依赖：3

- [ ] 5. /calendar/week 周视图
      验收命令：verify.sh 路由探针
      可看物：截图
      定性状态：待你确认
      证据：
      依赖：4

- [ ] 6. onboarding 扩展（行业/国家/WhatsApp号/营销触达同意）
      验收命令：合法值200/非法值422
      可看物：截图
      定性状态：待你确认
      证据：
      依赖：1

- [ ] 7. IA 切换：登录后默认页改为 /calendar，/templates 降级为"素材库"
      验收命令：verify.sh 鉴权+路由探针
      可看物：截图
      定性状态：待你确认
      证据：
      依赖：4

- [ ] 8. WhatsApp 审核流（Twilio gateway + fake模式 + webhook + 自动通过cron）
      验收命令：fake模式下全流程跑通；webhook签名校验探针
      可看物：截图/操作录屏
      定性状态：待你确认
      证据：
      依赖：4
      备注：真实模式需要 Twilio Account SID/Auth Token，到这一步再找你要

- [ ] 9. 邮件/短信自动化（5条流程 + sms.ts + outreach cron）
      验收命令：fake模式控制台能看到应发内容；幂等性探针
      可看物：截图（控制台日志/后台列表）
      定性状态：待你确认
      证据：
      依赖：1
      备注：真实模式需要 RESEND_API_KEY（邮件）+ Twilio短信号，到这一步再找你要

- [ ] 10. 一句话下单（Claude API + 规则兜底）
      验收命令：无key时规则兜底能跑通；verify.sh补充
      可看物：截图/操作录屏
      定性状态：待你确认
      证据：
      依赖：3
      备注：真实AI润色需要 ANTHROPIC_API_KEY，到这一步再找你要

- [ ] 11. EndCustomer 顾客名单管理页
      验收命令：verify.sh 路由+鉴权探针
      可看物：截图
      定性状态：待你确认
      证据：
      依赖：1

- [ ] 12. /calendar-preview 官网公开获客页 + CalendarLead
      验收命令：未登录200，提交留资后邮件通知（fake模式打日志）
      可看物：截图
      定性状态：待你确认
      证据：
      依赖：2, 3

- [ ] 13. verify.sh 全量补齐 + 跑通
      验收命令：`bash scripts/verify.sh` 全绿
      可看物：无
      定性状态：不涉及
      证据：
      依赖：1-12

- [ ] 14. /code-review high + /security-review
      验收命令：findings 逐条处理或写明理由
      可看物：无
      定性状态：不涉及
      证据：
      依赖：13

- [ ] 15. DEV-REPORT.md
      验收命令：无
      可看物：完整报告
      定性状态：待你确认
      证据：
      依赖：14
