# social-shell 任务台账（进度唯一真相）

- [x] T0 素材：抓取模板图 + 筛选社交类 167 个 + Orshot 30 个图层数据
      证据：templates.json 167 条；orshot-layers/ 30 个 json
- [ ] T1 脚手架：create-next-app + shadcn + Prisma + 本地 Postgres + seed
      验收命令：npx prisma migrate status && Template 计数 = 167
- [ ] T2 静态可看物：模板库 / 详情页 / 编辑器 三页静态版（假数据、能点）
      可看物：docs/shots/20260927-{library,detail,editor}.png
      定性状态：待你确认
- [ ] T3 Orshot 图层渲染器 + 编辑（选中/改字/改色/换图/拖动/图层/页面）+ 导出 PNG
      依赖：T2 确认
- [ ] T4 账号：注册/登录/登出 + 管理员线下开通 + 停用
- [ ] T5 商家资料 + onboarding + 编辑器「商家资料」页签一键填入
- [ ] T6 作品保存 / 发布计划 / 我的作品
- [ ] T7 verify.sh 全绿 + code-review + security-review + DEV-REPORT
