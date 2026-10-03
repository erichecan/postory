# 营销日历模块 — 任务台账

依据 `DEV-PLAN.md`（2026-10-03 全量版）。一周期 = 一个单元：读台账 → 做 → 验证 → 提交 → 回写状态。

- [x] 1. Schema：BrandProfile 新字段 + 7 张新表 + migration
      验收命令：`npx prisma migrate status` 干净，`npx tsc --noEmit` 通过
      可看物：无（纯 schema）
      定性状态：不涉及
      证据：migration 20261003001948_marketing_calendar_module 已应用；tsc 无输出（通过）；commit 2442219
      依赖：无

- [x] 2. 行业映射表 + 种子数据（MarketingEvent ~25条 / CampaignTemplate 各行业活动库）
      验收命令：`npx prisma db seed` 跑完，查表行数符合预期
      可看物：无（数据）
      定性状态：不涉及
      证据：marketingEvents=28 campaignTemplates=35；抽查lunar-new-year-2027关联正确；commit b3d908c
      依赖：1

- [x] 3. 日历生成引擎（规则引擎，按 industry+country+月份 生成 CalendarSlot）
      验收命令：单测/脚本跑一次生成，断言 createMany 不是循环 insert
      可看物：无（后端逻辑）
      定性状态：不涉及
      证据：本地脚本验证：2026-11生成22条/5次查询，幂等重跑created=0；commit 01c27fc
      依赖：1, 2

- [x] 4. /calendar 月视图页面 + 模板抽屉交互
      验收命令：verify.sh 路由探针（待单元13统一补）
      可看物：file:///Volumes/datacenter/04-eric/AIcoding/postory/.playwright-mcp/page-2026-10-03T03-58-05-685Z.png
      定性状态：待你确认
      证据：Playwright实测月视图渲染、模板抽屉、确认后caption+status正确、无资料兜底页均通过；commit 1c1e83c
      依赖：3

- [x] 5. /calendar/week 周视图
      验收命令：verify.sh 路由探针（待单元13统一补）
      可看物：file:///Volumes/datacenter/04-eric/AIcoding/postory/.playwright-mcp/page-2026-10-03T04-13-27-120Z.png
      定性状态：待你确认
      证据：Playwright实测渲染正常；commit 289ff08
      依赖：4

- [x] 6. onboarding 扩展（行业/国家/WhatsApp号/营销触达同意）
      验收命令：合法值200/非法值422（待单元13用verify.sh固化）
      可看物：file:///Volumes/datacenter/04-eric/AIcoding/postory/.playwright-mcp/page-2026-10-03T04-15-16-059Z.png
      定性状态：待你确认
      证据：Playwright实测管理员账号填表保存后/calendar按新行业国家正确生成；commit 06c14f3
      依赖：1

- [x] 7. IA 切换：登录后默认页改为 /calendar，/templates 降级为"素材库"
      验收命令：verify.sh 鉴权+路由探针（待单元13统一补）
      可看物：file:///Volumes/datacenter/04-eric/AIcoding/postory/.playwright-mcp/page-2026-10-03T04-18-22-057Z.png
      定性状态：待你确认
      证据：Playwright实测login/logout/一键登录均落地/calendar；commit f13ddfa
      依赖：4

- [x] 8. WhatsApp 审核流（Twilio gateway + fake模式 + webhook + 自动通过cron）
      验收命令：fake模式下全流程跑通；webhook签名校验探针（待单元13固化）
      可看物：脚本输出见commit message
      定性状态：待你确认（真实模式还没验证，需要Twilio key）
      证据：脚本直测通过，幂等性确认（二次运行processed=0）；commit c55046b
      依赖：4
      备注：真实模式需要 Twilio Account SID/Auth Token/WhatsApp发送号，你有了告诉我

- [x] 9. 邮件/短信自动化（5条流程 + sms.ts + outreach cron）
      验收命令：fake模式控制台能看到应发内容；幂等性探针（待单元13固化）
      可看物：脚本输出见commit message
      定性状态：待你确认（真实模式还没验证，需要Resend/Twilio key）
      证据：脚本直测通过，二次扫描sent=0确认不重发；commit 464dd1c
      依赖：1
      备注：真实模式需要 RESEND_API_KEY（邮件）+ Twilio短信号，你有了告诉我

- [x] 10. 一句话下单（Claude API + 规则兜底）
      验收命令：无key时规则兜底能跑通（待单元13补verify.sh）
      可看物：file:///Volumes/datacenter/04-eric/AIcoding/postory/.playwright-mcp/page-2026-10-03T04-28-41-085Z.png
      定性状态：待你确认（AI模式还没验证，需要ANTHROPIC_API_KEY）
      证据：Playwright实测"周二搞促销"→规则兜底正确解析日期+精准匹配；commit 53cd404
      依赖：3
      备注：真实AI润色需要 ANTHROPIC_API_KEY，你有了告诉我

- [x] 11. EndCustomer 顾客名单管理页
      验收命令：verify.sh 路由+鉴权探针（待单元13统一补）
      可看物：file:///Volumes/datacenter/04-eric/AIcoding/postory/.playwright-mcp/page-2026-10-03T12-08-20-152Z.png
      定性状态：待你确认
      证据：Playwright实测/profile/customers添加/删除/校验（邮箱电话至少填一个）均通过；入口已加到/profile页；commit (本次)
      依赖：1

- [x] 12. /calendar-preview 官网公开获客页 + CalendarLead
      验收命令：未登录200，提交留资后邮件通知（fake模式打日志）（待单元13补verify.sh）
      可看物：file:///Volumes/datacenter/04-eric/AIcoding/postory/.playwright-mcp/page-2026-10-03T12-08-23-145Z.png
      定性状态：待你确认
      证据：curl无cookie 200确认未登录可访问；12宫格用真实MarketingEvent/CampaignTemplate渲染（3次查询，不随数据量增长）；提交留资后CalendarLead落库+fake邮件打印到控制台；commit (本次)
      依赖：2, 3
      备注：开发过程中发现 src/proxy.ts（这个Next.js版本里 middleware.ts 的替代品）有一份公开路由白名单 PUBLIC_PATHS，漏加新路由会被当成未登录重定向而不是404——已把 /calendar-preview 加进去，verify.sh 的路由探针要记得覆盖这类"看似200实则被重定向"的情况

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
