# social-shell 任务台账（进度唯一真相）

- [x] T0 素材：抓取模板图 + 筛选社交类 167 个 + Orshot 30 个图层数据
      证据：templates.json 167 条；orshot-layers/ 30 个 json
- [x] T1 脚手架：create-next-app + shadcn + Prisma + 本地 Postgres + seed
      验收命令：npx prisma migrate status && Template 计数 = 167
      证据：psql Template count=167 editable=30；commit b59348f
- [x] T2 模板库 / 详情页 / 编辑器（直接接真数据，用户已指定参考 Orshot）
      可看物：docs/shots/20260927-{library,detail,editor-orshot,editor-bannerbear,export}.png
      定性状态：待你确认（2026-09-27 已发截图）
      证据：commit f384234；tsc/eslint 通过
- [x] T3 Orshot 图层渲染器 + 编辑（选中/改字/改色/换图/拖动/图层/页面）+ 导出 PNG
      证据：Playwright 实测改字、拖动、填入活动、导出 1080x1350 PNG，状态"已保存"
- [ ] T4 账号：注册/登录/登出（已完成）+ 管理员线下开通 + 停用（未做）
- [ ] T5 商家资料页 + onboarding（未做）；编辑器「商家资料」页签（已完成）
- [ ] T6 作品保存 + 发布计划弹窗（已完成）/ 我的作品列表页（未做）
- [ ] T7 verify.sh 全绿 + code-review + security-review + DEV-REPORT
