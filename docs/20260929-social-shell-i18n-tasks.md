# 双语 · 任务台账

计划：docs/20260929-social-shell-i18n-plan.md（用户 2026-09-28 确认）

- [x] 1. 基础设施：next-intl、cookie 语言、html lang、切换组件、按命名空间拆分的 messages
      验收命令：npx tsc --noEmit；curl 带 NEXT_LOCALE=en 断言 <html lang="en">
      可看物：—
      定性状态：—
      证据：cookie en → <html lang="en"> title "Postory · Social media content studio…"；cookie zh / 无 cookie → zh-CN；Accept-Language en-US → en。tsc 通过。残留中文基线 223 行
      依赖：无
- [x] 2. 登录 / 注册 / 一键登录 / 引导 / 校验与 Action 报错
      验收命令：scripts/check-i18n.mjs
      可看物：docs/shots/20260929-i18n-login-{zh,en}.png
      定性状态：待你确认
      证据：auth 25 / profile 25 / validation +4 key；登录页 en/zh 截图；check-i18n OK；demo 账号标识改为不可注册的 "demo"（安全审查 #1）
      依赖：1
- [x] 3. 顶栏、模板库、模板详情、相似模板、平台名
      验收命令：scripts/check-i18n.mjs
      可看物：docs/shots/20260929-i18n-templates-{zh,en}.png
      定性状态：待你确认
      证据：nav/gallery/templates/designs/admin/platforms 共 6 个命名空间；390–1440 宽度导航无截断、无横向滚动（<768 导航换到第二行）
      依赖：1
- [x] 4. 编辑器
      验收命令：scripts/check-i18n.mjs
      可看物：docs/shots/20260929-i18n-editor-{zh,en}.png
      定性状态：待你确认
      证据：editor 78 key；多伦多时区实测：选 10:00 → 提示与卡片均显示 10:00 AM；外链图片保存被拒（新探针）
      依赖：1
- [x] 5. 我的作品、商家资料、后台
      验收命令：scripts/check-i18n.mjs
      可看物：docs/shots/20260929-i18n-designs-en.png
      定性状态：待你确认
      证据：designs/admin 双语；列表用 format.list；时区随浏览器 cookie
      依赖：1
- [ ] 6. 收尾：残留中文扫描、key 一致性、verify.sh、双宽度截图、部署并线上验证
      验收命令：scripts/verify.sh
      可看物：线上地址
      定性状态：待你确认
      证据：
      依赖：2–5
