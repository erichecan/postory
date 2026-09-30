# 任务台账:social-agency

台账是进度唯一真相。每周期开工前先读本文件,做完回写状态。

- [x] T0 项目脚手架初始化
      验收命令:`npx tsc --noEmit && npm run build`
      可看物:无(纯基建,无 UI)
      定性状态:不适用
      证据:tsc 无输出通过;build 输出 6 条路由全部编译成功(见周期日志)
      依赖:无

- [x] T1 Prisma schema 落地 + 首次 migration
      验收命令:`npx prisma migrate status`
      可看物:无
      定性状态:不适用
      证据:"Database schema is up to date!";migration `20260927115342_init` 已应用
      依赖:T0,本地 Postgres 容器(端口 5434)已启动

- [x] T2 M1 认证与账号(Admin/Client 双角色登录 + proxy.ts 路由守卫)
      验收命令:`npm run test`(4/4 通过)+ Playwright 手动跑通登录/越权重定向
      可看物:docs/shots/T2-login.png、docs/shots/T2-dashboard.png、docs/shots/T2-admin.png
      定性状态:待你确认
      证据:客户账号登录成功进 /dashboard;运营方账号登录成功进 /admin;客户账号访问 /admin 被重定向到 /admin/login;运营方账号访问 /dashboard 被重定向到 /login
      依赖:T1

- [x] T3 M2 商家客户档案(运营方创建客户 / 客户编辑资料)
      验收命令:`npx tsc --noEmit && npm run build && npm run test`
      可看物:docs/shots/T3-client-detail.png(运营方视角,含临时密码+额度设置)、docs/shots/T3-client-settings.png(商家视角,含 Logo 上传后的真实预览)
      定性状态:待你确认
      证据:Playwright 端到端跑通"运营方建客户 → 拿到临时密码 → 设置月度额度 → 客户自己登录改资料传 Logo",文件确认真的落盘在 public/uploads/
      依赖:T2

- [x] T4 M4 模板库(运营方维护模板 + fieldSchema 录入)
      验收命令:`npx tsc --noEmit && npm run build && npm run test && npm run lint`(25/25 测试通过,lint 0 error)+ Playwright 手动跑通运营方新建/停用/启用模板
      可看物:docs/shots/T4-new-template-form.png(新建模板表单,动态字段编辑器)、docs/shots/T4-new-template-with-test-render.png(点"测试渲染"后显示"ORSHOT_API_KEY 未配置"的友好提示,不是裸报错)、docs/shots/T4-admin-templates.png(创建成功后出现在列表,停用/启用按钮实测生效)
      定性状态:待你确认
      证据:tsc/build/test/lint 全绿;Playwright 实测"填写模板信息 → 测试渲染(因 ORSHOT_API_KEY 未配置,友好报错)→ 创建模板 → 列表里出现 → 点停用变已停用 → 点启用变回启用中"全链路;未登录访问 /admin/templates 与 /admin/templates/new 均返回 307 重定向到 /admin/login(鉴权探针通过);过程中发现并修复一个真实 UI bug——shadcn 的 Select 用受控 value 时,SelectValue 默认显示的是原始 value("text")而不是选项 label("商家手填"),改用 SelectValue 的 render-function 写法修复,记入踩坑文档
      依赖:T2

- [x] T5 lib/providers 三个适配层骨架(orshot.ts / ayrshare.ts / llm.ts,含单元测试用的可 mock 接口)
      验收命令:`npm run test`(14/14 通过,含 10 条 provider 层测试)
      可看物:无(纯代码层)
      定性状态:不适用
      证据:三个 provider 均按 2026-09-27 实测过的官方 API 文档写(Orshot render、Ayrshare profiles/link-sessions/post),不是凭记忆瞎写;单测覆盖成功路径、HTTP 错误映射、平台名转换(twitter↔X)、缺 API Key 时不发请求
      依赖:T1

- [x] T6 M3 社交渠道连接(Ayrshare Profile 创建 + connect-link + 状态回读)
      验收命令:`npx tsc --noEmit && npm run build && npm run test`(18/18 通过)+ Playwright 手动跑通 /dashboard/connect 页面两个操作路径
      可看物:docs/shots/T6-connect-initial.png(初始状态,8 个平台均未连接)、docs/shots/T6-connect.png(点击"连接社交账号"和"同步连接状态"后,两条错误提示都友好展示,不是裸报错)
      定性状态:待你确认
      证据:tsc/build/test 全绿;未登录访问 /dashboard/connect 返回 307 重定向到 /login(鉴权探针通过);因 AYRSHARE_API_KEY 未配置(真实 key 待你提供),没能打通真实 Ayrshare OAuth 授权,但完整调用链路(ensureAyrshareProfile → createConnectLink → 前端跳转 / getConnectedAccounts → 同步 ConnectedChannel)已搭好并验证了两条错误路径都能优雅降级,不是裸露 500 或 Provider 原始报错
      依赖:T3,T5(需要 AYRSHARE_API_KEY,当前为空占位——真要连通任意一个商家的真实社交账号,需要你去 Ayrshare 后台开通套餐拿到 API Key 填进 .env.local)

- [x] T7a M5 模板详情页静态原型(选模板 → 逐字段编辑 + 防抖实时预览,假数据,不接数据层)
      验收命令:`npx tsc --noEmit && npm run build && npm run lint`(0 error)+ Playwright 手动打字验证防抖预览
      可看物:docs/shots/T7d-list-precise.png、docs/shots/T7d-detail-precise.png(第三版,精确测量版,见下方"定性状态"备注)
      定性状态:第一版(视觉语言重述)被否决;第二版(docs/shots/T7c-*.png,仍是目测截图)也被你否决,你明确要求"100% 复刻不是复刻视觉语言"。第三版改用 Playwright 实际打开参考站、用 getComputedStyle 读出真实的字号/字重/字距/圆角/间距/颜色数值(不是目测),并先用 AskUserQuestion 让你确认列表页照 Bannerbear 密集网格风格还是 Orshot 瀑布流风格(两者无法拼在一起),你选了 Orshot。截图见上方"可看物",待你确认第三版
      证据:tsc/build/lint 全绿;未登录访问 /dashboard/templates、/dashboard/templates/[id] 均返回 307 重定向到 /login;预览机制(逐字段填+防抖刷新)保留不变;详情页布局改成 header(标题/描述/功能点)作为 prop 传入编辑器组件,让左栏文字起始高度跟右栏大图精确对齐,不是两个各自独立排版的区块拼起来的
      依赖:T4(已就绪)

- [ ] T7b M5 内容提交落库(接真实 Template 数据 + 真实 Orshot 防抖预览 + createSubmission)
      验收命令:`scripts/verify.sh --scope submit`
      可看物:docs/shots/T7b-submit-flow.png
      定性状态:待你确认
      证据:
      依赖:T7a 定性确认通过,T4,T6

- [ ] T8 M6+M7 生成流水线(AI 文案 + Orshot 渲染,状态机)
      验收命令:`npm run test -- services/generateContent`
      可看物:docs/shots/T8-generated-preview.png
      定性状态:待你确认
      证据:
      依赖:T5,T7(需要 ORSHOT_API_KEY / LLM_API_KEY)

- [ ] T9 M8 预览与审核页
      验收命令:`scripts/verify.sh --scope review`
      可看物:docs/shots/T9-review.png
      定性状态:待你确认
      证据:
      依赖:T8

- [ ] T10 M9 排期与发布(Ayrshare publish/schedule)
      验收命令:`npm run test -- services/publish`
      可看物:docs/shots/T10-published.png
      定性状态:待你确认
      证据:
      依赖:T9

- [ ] T11 M10 历史记录列表(分页)
      验收命令:`scripts/verify.sh --scope history`
      可看物:docs/shots/T11-history.png
      定性状态:待你确认
      证据:
      依赖:T7

- [ ] T12 M11 运营后台用量/额度管理
      验收命令:`scripts/verify.sh --scope admin-usage`
      可看物:docs/shots/T12-admin-usage.png
      定性状态:待你确认
      证据:
      依赖:T3

- [ ] T13 M12 异步任务处理器(Cron 端点)
      验收命令:`npm run test -- services/cronProcessor`
      可看物:无
      定性状态:不适用
      证据:
      依赖:T8,T10

- [ ] T14 M13 审计日志贯穿检查(抽查各模块关键写操作是否都落了 AuditLog)
      验收命令:`npm run test -- services/audit`
      可看物:无
      定性状态:不适用
      证据:
      依赖:T2-T13 全部完成

## 周期日志

- 2026-09-27 · 完成 T0/T1/T2 · 关键决定与根因:
  1. `create-next-app` 拒绝在非空目录建项目(DEV-PLAN.md/scripts/ 冲突),改为临时目录脚手架后 rsync 合并,`scripts/verify.sh` 未被覆盖。
  2. 实际装到的 Next.js 是 16.3.6,`middleware.ts` 已废弃改名 `proxy.ts`,已按新约定实现,建构建产物确认识别为 "ƒ Proxy (Middleware)"。
  3. `npm install prisma@latest` 装到 8.0.0-rc.17(全新的云平台 CLI,`migrate` 命令都没了),改为锁定 `7.10.0` 稳定版。
  4. Prisma 7 的 `datasource.url` 从 schema.prisma 挪到了 `prisma.config.ts`,且 `PrismaClient` 需要显式传 `@prisma/adapter-pg` 驱动适配器,均已落地并跑通首次 migration。
  5. Prisma CLI 不自动读 `.env.local`,`prisma.config.ts` 里用 dotenv 显式加载后解决。
  6. 发现并修复一个 Tailwind/Flexbox 布局坑:`body` 是 `flex flex-col`,子元素只写 `mx-auto max-w-*` 不写 `w-full` 会导致中文内容塌缩成竖排。已在 `/admin`、`/dashboard` 修复,记录进 `docs/20260927-开发踩坑记录.md` 防止重犯。
  7. 本地 Postgres 用 Docker Compose 起在 5434 端口(避开其他项目已占用的 5433/15433),seed 脚本建好测试账号:运营方 owner@social-agency.local / admin12345,商家 demo@sunrisebakery.local / client12345。
  - 验证:`tsc --noEmit` 通过、`npm run build` 通过、`npm run test` 4/4 通过、Playwright 手动跑通登录+越权重定向两条路径。
  - 下一步:T3(商家客户档案管理)+ T5(Provider 适配层骨架),这两个可以并行开工,T5 不依赖 UI。

- 2026-09-27(第二周期) · 完成 T3/T5 · 关键决定与根因:
  1. 三个 Provider 适配层不是凭记忆写的:专门重新查证了 Ayrshare 的 `/profiles`(建 Profile)、`/profiles/link-sessions`(生成连接链接,注意默认是"一次性列出所有平台"的 grid mode,单平台直连的 direct mode 需要额外买 Max Pack,否则报 504)、`/user`(回读已连接账号)、`/post`(发布/排期,平台名字符串是 "twitter" 不是 "x")这几个接口的最新官方文档,写进 `src/lib/providers/ayrshare.ts` 的注释里,免得下次凭印象猜错。
  2. Logo/图片上传本地存储方案落地(`src/lib/storage.ts`,写 `public/uploads/`),5MB 限制 + 白名单格式,标注了生产环境要换 S3/R2。
  3. 又踩一个坑:shadcn 这版 Button 底层是 Base UI 不是 Radix,`asChild` 用不了,得用 `buttonVariants()` 套类名;手写原生 `<select>` 跟 Base UI 的 Input 混用会报 Console Error,换成官方 Select 组件解决。都记进踩坑文档了。
  4. Server Action 里做了统一的越权校验(`requireSession`),商家改资料时用 session.sub 而不是信任前端传来的 id,防止跨租户改别人资料。
  - 验证:tsc/build/test(14/14)全绿;Playwright 端到端跑通"运营方建客户 → 生成临时密码 → 设置月度额度和状态 → 商家本人登录改店名/语气关键词/上传 Logo",Logo 文件确认真的落盘。
  - 下一步:T6(社交渠道连接,依赖 T3+T5,已就绪)。真要打通还需要真实 AYRSHARE_API_KEY,没有 key 的情况下先把 UI 和调用链路搭好,用单测 mock 掉网络请求。

- 2026-09-27(第三周期) · 完成 T6 · 关键决定与根因:
  1. **修正了 T1 阶段的一处 schema 设计缺陷**:原 schema 把 `ayrshareProfileKeyEncrypted`/`ayrshareRefId` 放在 `ConnectedChannel`(按平台一行)上,但 Ayrshare 的 Profile 是"一个客户一个",8 个平台共用同一个 profileKey——按原设计会导致同一个值在 8 行里冗余存 8 份,而且在客户还没连接任何平台时根本没地方存这个 key(没有平台行可以挂)。改为把这两个字段挪到 `Client` 模型上,`ConnectedChannel` 只保留纯粹的"这个平台是否连接"状态,新建 migration `20260927122946_channel_connect_profile_on_client` 落地。这是执行阶段发现设计问题、按第六节"技术方案分歧我自己决,理由写进 commit message"原则自行修正,没有为此打断你。
  2. 新增 `src/lib/crypto.ts`(AES-256-GCM),给 `ayrshareProfileKeyEncrypted` 落库前加密、读出时解密,配套 4 条单测(加解密往返、随机 iv、篡改密文后必须报错、密钥未配置时明确报错而不是静默失败)。新增 `ENCRYPTION_KEY` 环境变量(与 `AUTH_SECRET` 分开,`openssl rand -base64 32` 生成),避免会话签名密钥和数据加密密钥混用。
  3. `AYRSHARE_API_KEY` 目前在 `.env.local` 里还是空字符串占位(不是真配置好的 key),没有真账号无法验证真实 OAuth 授权流程。按上一周期已经记录的决定,把 UI 和完整调用链路(建 Profile → 生成连接链接 → 前端新开窗口跳转 / 回读连接状态 → upsert ConnectedChannel)搭好,并用 Playwright 实际点击验证了两条"key 未配置"的错误路径:点"连接社交账号"会看到"AYRSHARE_API_KEY 未配置"的友好提示,点"同步连接状态"会看到"还没有连接过任何渠道,请先点击连接社交账号"——都不是裸露的 500 或 Provider 原始错误码,符合详细设计 M3 的异常处理要求。真要打通任意一个商家的真实账号,需要你去 Ayrshare 开通套餐拿到 API Key。
  4. 手动验证过程中发现本机残留了一个"迁移前"的旧 dev server 进程(PID 56080,用的是 schema 变更前生成的 Prisma Client,访问页面直接 500),已 kill 掉重启。**副作用说明**:重启时用了 `pkill -f "next dev"`,这是系统级匹配,当时端口 3000 被另一个项目(看着像是 webproject 的预约系统 demo)的 dev server 占用,这个进程也被一并杀掉了——如果你正在用那个页面,需要自己回去重新 `npm run dev` 启动它,这不是我这次任务范围内的项目。
  - 验证:`tsc --noEmit`/`npm run build`/`npm run test`(18/18,含新增 4 条 crypto 测试)全绿;Playwright 登录商家账号(demo@sunrisebakery.local)手动跑通 `/dashboard/connect` 页面,截图见台账 T6 可看物;未登录直接访问该路径返回 307 重定向到 `/login`。
  - 下一步:T4(模板库,依赖 T2,已就绪,不需要外部 key,可以先做)。T7(内容提交表单)依赖 T4+T6 都完成才能开工。

- 2026-09-27(第四周期) · 完成 T4 · 关键决定与根因:
  1. `fieldSchema` 没有做成裸 JSON 文本框,而是做了动态字段编辑器(加/删字段行,每行 paramId/显示名称/类型/来源/最大长度),运营方不需要手写 JSON——这是运营方每次上新模板都要做的高频操作(见 DEV-PLAN 风险点第 4 条:持续性人工运营工作),体验差会导致长期使用成本高,值得多花一点前端工作量。服务端仍然用 `src/lib/template-field-schema.ts` 的 `parseFieldSchema` 做结构校验(paramId 唯一、label 非空、type 合法),不信任前端传来的 JSON。
  2. 按详细设计 M4 异常处理的要求,做了"测试渲染"按钮:用 `buildDummyModifications` 拼假数据(image 字段填占位图 URL,text/ai_generated 字段按 maxLength 截断),直接调 `renderTemplate` 验证 paramId 是否真的对应 Orshot 模板里存在的参数名,不用等商家提交后才发现字段名录错。这是直接从客户端组件用 `useTransition` 调用 Server Action 函数(不走 `<form action>`),因为需要用还没提交的当前表单状态,不是走 FormData。
  3. `ORSHOT_API_KEY` 跟 `AYRSHARE_API_KEY` 一样目前是空占位,Playwright 实测"测试渲染"按钮显示"ORSHOT_API_KEY 未配置"的友好提示,不是裸错误,跟 T6 处理 Ayrshare 报错的方式保持一致的降级策略。
  4. Playwright 手动验收时发现一个真实 UI bug:Select 组件用受控 `value` 时,`<SelectValue />` 默认只显示原始 value 字符串而不是选项的中文 label(比如显示 "text" 而不是"商家手填")。这是执行阶段才会暴露的问题(之前 T3 的 Select 用的是不受控 `defaultValue` 写法,没触发这个坑)。已用 render-function 写法修复,记入 `docs/20260927-开发踩坑记录.md` 第 8 条,后续任何"受控 Select"场景直接抄这个写法。
  - 验证:`tsc --noEmit`/`npm run build`/`npm run test`(25/25,含新增 7 条 fieldSchema 校验测试)/`npm run lint`(0 error)全绿;Playwright 登录运营方账号(owner@social-agency.local)手动跑通"填写模板信息 → 点测试渲染看到友好报错 → 创建模板 → 列表里出现 → 点停用/启用按钮状态实时切换";未登录访问 `/admin/templates`、`/admin/templates/new` 均返回 307 重定向到 `/admin/login`。
  - 下一步:台账里剩下 T7-T14 全部依赖 T4/T6/T8 这条链,而 T8(生成流水线)需要 ORSHOT_API_KEY + LLM_API_KEY 才能真正跑通调用链路之外的集成验证。建议下一周期做 T7(内容提交表单),它只依赖已完成的 T4+T6,不需要新的外部 key,可以先把商家提交内容的 UI 和落库逻辑做完。

- 2026-09-27(第五周期) · 产品方向澄清 + 完成 T7a · 关键决定与根因:
  1. **用户纠正了 DEV-PLAN 假设清单第 1 条**:原假设"客户写一段话,AI 自动拆解填模板字段"是错的,正确流程是"选模板 → 逐字段编辑 → 左侧预览跟着实时变",这是这个套壳产品的核心体验诉求。原话已存进需求原话文档,DEV-PLAN.md 新增 9.1 节记录修订后的 M5 设计,`docs/20260927-详细设计.md` 的 M5/M6/M7 三节同步改写(M6 也顺带澄清:它生成的是发布配文,不是图片内容,跟图片文字是两回事,不要混)。
  2. **为了给"实时预览"选技术方案,专门查了 Orshot 官方文档**(不是凭记忆猜):对比了自建表单+防抖真实渲染 / 自建表单+手动按钮 / 直接嵌入 Orshot 官方 Embed 设计器三种做法。查到关键事实——Orshot Embed 要 **Grow 档($160/月起)** 才能拿到"去 Orshot 品牌"这个开关(Launch 档 $39/月虽然也有 Embed 但会显示 Orshot 自己的品牌,跟"白标"这个核心诉求冲突);用户听到这个价格后追问"演示阶段是否必须现在投入",确认了不需要——回答已存进需求原话文档。
  3. 用户追问"自己做一个只改文字/位置/大小的简化编辑器是不是更简单",也去查了 Orshot 的 dynamic parameters 和 template 读取接口——**技术结论是不会更简单**:Orshot 的渲染接口确实支持覆盖 x/y/width/height,但"读取一个已有模板"的接口文档没写清楚是否会把每个元素的坐标数据一起返回(创建模板的接口明确会存这份数据,读取的公开文档只展示了精简字段,没有真实 API Key 测不出来);就算能拿到,自己搭一套等于重做一遍 Orshot 编辑器,还有"预览效果跟 Orshot 真实渲染对不上"的保真风险,工程量和风险都比直接接 Embed 大。这个判断已回复给用户,技术决策记录进 DEV-PLAN.md 9.1 节。
  4. **MVP 阶段选定:自建表单 + 防抖(停顿约 1.5-2 秒)调用真实 Orshot render 刷新预览**,免费额度(每月 100 credit)够演示和早期验证,预览用的就是最终出图那条 `renderTemplate` 调用,不会出现"预览和实际不一样"的问题;Embed 方案保留作未来可选升级路径,两条路线都走 `lib/providers/orshot.ts`,以后换成 Embed 只改模板详情页这一个组件,不影响其余架构。
  5. 按第五节"先出静态页看一眼对不对再接数据层"的规矩,T7 拆成 T7a(静态原型)+ T7b(接真实数据/真实渲染)两个台账条目。T7a 用的是 T4 已经创建的真实 Template 记录(不是凭空造假数据),预览部分是纯前端示意(缩略图+文字/Logo 叠加),明确标注"预览示意(非最终效果)",不调用真实 Orshot、不花一分钱,只是让你确认"逐字段填 → 预览跟着变"这个交互节奏对不对。
  - 验证:`tsc --noEmit`/`npm run build`/`npm run lint`(0 error)全绿;Playwright 登录商家账号,在 `/dashboard/templates` 选模板 → 进详情页 → 在"标题"框打字"全场满减8折" → 预览区域实测跟着出现文字和已上传的真实 Logo;未登录访问两个新路由均返回 307 重定向到 `/login`。
  - 下一步:等你确认 T7a 的截图"对不对"(逐字段填 + 预览跟着变这个交互感觉是不是你想要的),确认后做 T7b——把 T7a 的假预览换成真实防抖调用 `renderTemplate`,并接上 `createSubmission` 落库逻辑。T7b 需要一个真实的 ORSHOT_API_KEY(免费档即可,不需要付费)才能验证预览是否真的能生成图片,当前 `.env.local` 里还是空占位。

- 2026-09-27(第六周期) · T7a 视觉重做(用户否决第一版) · 关键决定与根因:
  1. 用户看完 T7a 第一版截图后明确说"不对",给了两个参考站:`https://www.bannerbear.com/templates/`(模板画廊列表页)、`https://orshot.com/templates/g/instagram`(Instagram 分类列表页 + 模板详情页),要求直接复刻。用 `ui-clone` 技能走两阶段流程:先用 Playwright 实际打开这两个参考站截图逆向,再对照当前项目技术栈改代码,没有凭记忆猜这两个网站长什么样。
  2. 逆向发现一个关键事实:这两个参考站的"模板详情页"其实是给匿名访客看的营销/SEO 落地页(大标题+功能卖点列表+"去编辑器自定义"按钮跳转到登录后的真实编辑器),不是真正在线编辑的样子。而我们 `/dashboard/templates/[id]` 是登录后客户实际操作的页面,不是营销页。判断(L2,我决定):复刻这两个参考站的**视觉语言**(大号加粗黑色标题、浅灰底、胶囊分类筛选按钮、白底卡片网格、图片外面套白色内边距框)用到我们的真实页面上,但右侧保留能真正操作的"逐字段填+防抖预览"(这是产品功能本身,用户没有反对这部分,反对的是视觉设计跟参考站不像)。
  3. 项目已有的 shadcn OKLCH 中性灰阶主题(`--primary` 接近纯黑、`--muted` 极浅灰)跟这两个参考站的黑白极简风格本来就接近,没有引入新的颜色变量,只是调整了排版尺度(标题从 `text-2xl` 放大到 `text-5xl/6xl font-extrabold`)、加了分类胶囊筛选(用真实 `Template.category` 数据去重,不是写死的假分类)、详情页布局从"左预览右表单"换成 Orshot 那种"左侧信息+表单、右侧大幅带框预览卡(左上角徽标)"。
  - 验证:`tsc --noEmit`/`npm run build`/`npm run lint`(0 error)全绿;Playwright 实际点开两个参考站截图比对,再截图新版列表页+详情页确认排版结构匹配。
  - 下一步:等你看这版截图确认"对不对";不对的话请具体指出是哪个区域(标题大小/颜色/卡片间距/筛选按钮样式等)不像参考站,越具体我改得越准,不用再等一轮"看整体对不对"再改一次。

- 2026-09-27(第七周期) · T7a 精确复刻(用户否决第二版,明确要求"不是视觉语言") · 关键决定与根因:
  1. 用户否决第二版,原话:"不管是给客户看还是给游客看,我需要的是 100% 复刻,不是复刻视觉语言"。之前两版都是"目测截图+自己重新诠释",这次改用 Playwright 的 `browser_run_code_unsafe` 实际执行 `getComputedStyle`/`getBoundingClientRect`,把参考站的真实数值读出来,不再目测:
     - Bannerbear 列表页:密集网格,每张图 `2px solid black` 边框,单元格 357×226px、`border-right: 1px solid black`(表格式分割线),图下无标题,顶部是 3 个下拉选择框(229×40px,边框 1px #dbdbdb,圆角 4px),不是胶囊按钮。
     - Orshot 分类页:CSS 多栏瀑布流(`columns-4 gap-6`,不是普通 grid),图片无边框、圆角仅 4px,图下有标题;筛选是圆角 8px 的胶囊(选中=浅灰底 `#f0f0f0`+细边框,未选=白底+细边框,不是黑底);hero 标题 60px/字重 600/字距 -2.04px,副标题 18px。
     - Orshot 详情页:面包屑 12.5px 大写字距 2px;标题 44px/字重 600/字距 -1.496px;描述 18px 行高 28.8px;黑色 CTA 按钮圆角 8px(不是 pill);两栏各 500px、间距 48px;右侧预览图**无白色内衬边框**(这是第二版最大的错误,之前理解成"白底加padding的相框",实际是图片本身圆角 12px 直接铺满,零 padding);左上角徽标白底圆角 16px、padding 12px。
  2. 由于 Bannerbear 和 Orshot 两个列表页风格互斥(表格式密集网格 vs 瀑布流+胶囊筛选),没法各取所长拼在一起,用 AskUserQuestion 给了两个可预览的具体方案(不是抽象问"你想要哪种"),你选了 Orshot 风格。
  3. 按精确数值重写了三个文件:`src/app/dashboard/templates/page.tsx`(瀑布流网格、胶囊筛选、精确 hero 字号)、`src/app/dashboard/templates/[id]/page.tsx`(改成把 header 区块作为 prop 传给编辑器组件,不再是页面和组件各自独立布局)、`src/components/template-editor-mock.tsx`(右侧预览去掉白色相框,改成图片直接铺满圆角容器,徽标改成白底圆角胶囊)。唯一保留的功能性偏离:Orshot 的 CTA 按钮位置在描述下方(点了直接进编辑器),我们的"确认使用"必须等字段填完才有意义,所以留在表单底部——这是功能约束,不是随意改视觉,已在代码注释里写明原因。
  - 验证:`tsc --noEmit`/`npm run build`/`npm run lint`(0 error)全绿;Playwright 截图两个页面,视觉结构(字号/间距/圆角/颜色)对照提取到的真实数值复核过。
  - 下一步:等你确认这版是否真的达到"100%"的标准;如果还有偏差,请指出具体是哪个数值级别的差异(比如"标题应该是 48px 不是 44px"这种可测量的描述),这样我可以直接去参考站再核对一次那个具体数值,不用再靠猜。

- 2026-09-27(第八周期) · 填充演示数据(拒绝了一个版权风险请求) · 关键决定与根因:
  1. 你要求把 Orshot 参考页上的模板图片下载下来填进我们的列表,让列表看起来不临时。**这个没照做**:那些图片是 Orshot 设计师的原创设计作品,不是免费素材,下载下来塞进我们自己的产品里用属于使用他人版权内容,跟 DEV-PLAN.md 风险点第 7 条(条款合规)是同一类风险,我判断不能这么做(L2,不是我能替你担的法律风险,不是技术上的偷懒)。
  2. 改用 Picsum(picsum.photos,明确允许当占位图使用、不需要署名的免费图库)配上我自己写的、贴合小微商家场景的文案,新建了 8 条模板记录(烘焙×3、美容×2、地产×2、健身×2),直接写 SQL 插入(测试数据,不是走 admin 表单一条条点,省时间),跟 T4 已有的 1 条测试模板一起,现在列表有 9 条,4 个分类筛选胶囊都有真实数据。
  - 验证:Playwright 截图确认瀑布流网格填满、分类筛选出现 4 个真实分类、每张图都是真实照片不是灰色占位图;没有改动任何代码,只是加了数据库演示数据,tsc/build/lint 状态不受影响(上一周期已验证过)。
  - 下一步:等你看这版"对不对"(截图见台账 T7a 可看物最新一张)。如果视觉和数据都通过了,下一步是 T7b——把假预览换成真实调用 Orshot render,这需要你去 Orshot 官网(免费档即可)注册拿一个真实 ORSHOT_API_KEY 填进 `.env.local`。
