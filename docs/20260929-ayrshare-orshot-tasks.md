# Ayrshare 真实发布 · 任务台账

计划：DEV-PLAN.md（用户 2026-09-29 确认，多租户版）

- [x] 1. Schema + 加密工具：SocialAccount/User/Design 字段迁移，crypto.ts（AES-256-GCM）
      验收命令：npx prisma migrate status；npx tsc --noEmit；scripts/social-probe.ts 里的 crypto 用例
      可看物：—
      定性状态：—
      证据：迁移 20260930032116_ayrshare_social_accounts 已应用；加密往返/随机 iv/篡改抛错三项 PASS
      依赖：无
- [x] 2. Ayrshare provider：src/lib/ayrshare.ts（createProfile/createConnectLink/getConnectedAccounts/publish），fake/real 双模式，平台名映射
      验收命令：scripts/social-probe.ts（结构性检查 fake 函数体无 fetch()、平台名映射 x→twitter）
      可看物：—
      定性状态：—
      证据：4 项 PASS；code-review 发现 getConnectedAccounts 未把 Ayrshare 平台名转换回内部 id（真实模式下 X 永远显示未连接），已修复并加了反向映射
      依赖：1
- [x] 3. 存储：pub/ 前缀 key + /api/public-media/[...key] 公开路由 + /api/designs/[id]/publish-asset 上传接口
      验收命令：verify.sh 路由探针（未登录 401、私有 gen/ 前缀 404、公开图任何人可读）
      可看物：—
      定性状态：—
      证据：4 项 PASS；独立安全审查确认 PUB_KEY_PATTERN 与 GEN_KEY_PATTERN 互斥，两个路由互不能读到对方的对象
      依赖：1
- [x] 4. 社交账号连接页：/profile 下新区块，connectSocialAction/disconnectSocialAction，/api/social/callback
      验收命令：verify.sh 鉴权探针；浏览器手动走一遍 fake 模式连接流程
      可看物：docs/shots/20260929-social-connect-{zh-before,zh,en}.png
      定性状态：待你确认
      证据：Playwright 实测点"连接"→新标签页→fake 模式秒连接→原标签页自动刷新显示"已连接 demo"；code-review 指出的 setInterval 未清理已修复
      依赖：1,2
- [x] 5. 发布改造：PublishDialog 加文案输入框+只显示已连接平台，scheduleDesignAction 接真实（fake）发布，写回状态
      验收命令：scripts/social-probe.ts 全流程 + 浏览器手动发布一次
      可看物：docs/shots/20260929-publish-flow-en.png（文案输入框 + 平台锁定态）
      定性状态：待你确认
      证据：浏览器实测 Design 写回 publishStatus=SUCCESS、ayrsharePostId 有值；自测中发现"已选平台后来被锁无法取消勾选"的 bug 并修复；code-review 指出的"改时间重新提交会重复真实发布"已修复（加 charge.duplicate 判断 + 回归探针）
      依赖：2,3,4
- [x] 6. i18n：新增文案（zh/en）；verify.sh 补充探针；code-review high + security-review；DEV-REPORT；部署
      验收命令：scripts/verify.sh
      可看物：DEV-REPORT.md + 线上地址
      定性状态：待你确认
      证据：check-i18n OK（765=765）；verify.sh 全绿（含新增 social-probe）；code-review 6 条发现 5 条已修复、1 条记录为不处理（AYRSHARE_MODE=real 缺 key 时静默降级 fake，理由见 DEV-REPORT）；security-review 未发现高置信度漏洞
      依赖：1-5
