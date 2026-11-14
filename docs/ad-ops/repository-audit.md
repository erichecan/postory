# GitHub 仓库拉取、代码审阅与本地运行记录

审阅日期：2026-10-27。以下项目在 `repositories/` 下分别浅克隆；提交固定为克隆时远端 `HEAD`。目录保留在本机供后续检查，但作为嵌套 Git 仓库不纳入 PoStory 主仓库提交。没有填写真实凭据，没有连接 Meta/Google/TikTok/Shopify 等生产账户，也没有调用真实广告 API。

| 仓库 | 拉取提交 | 适合定位 | 本轮运行结论 |
|---|---|---|---|
| [ynnickw/adport](https://github.com/ynnickw/adport) | `2d931efeef4748f11fab0ca36cffc907bcd93096` | 多平台投放控制层：CLI + MCP，支持客户账户、统一报表、提案预览、二次审批、预算策略与审计记录 | 已在隔离副本安装依赖、构建全工作区，并以 `ADPORT_DEMO=true` 运行模拟账户列表成功；广告凭据为空。云控制台需要本地 Supabase，当前环境未安装 Supabase CLI，未启动其多租户数据库服务。 |
| [brijr/meta-mcp](https://github.com/brijr/meta-mcp) | `664b20617a6aee529ff31f8093e85fca7db4b7be` | Meta Marketing API MCP 组件，按 JWT `workspaceId` 绑定工作区，Cloudflare D1 存连接，KV 存 OAuth 状态 | 已浅克隆并审阅运行配置和密钥边界；未执行 `wrangler deploy`。仓库配置里存在固定 Cloudflare `account_id`、D1/KV 远端 ID 和自定义域名；需要先移除或替换为自有本地资源，不能直接使用其部署目标。 |
| [curtiskline/meta-ads-manager](https://github.com/curtiskline/meta-ads-manager) | `a89f8af84a7380ad9c495969e93fb578490691e3` | Meta 单平台的轻量化活动创建和绩效看板，使用 Next.js、Supabase、Meta Marketing API | 已浅克隆并审阅 `.env.example`；启动需要 Supabase 项目密钥与 Meta 应用信息。本机未设置这些配置，未调用远端服务或部署。 |
| [aialvi/autopost](https://github.com/aialvi/autopost) | `bdff809ca041bd6b9c92035e8c7a0cc948fb24c5` | 多品牌广告/Shopify 盈利分析、报告与 AI 建议；广告预算由运营控制 | 已浅克隆并审阅隔离 Demo、部署文档和数据入口；启动当前代码需要 `DATABASE_URL`。Demo 说明禁止它访问真实品牌和集成；未配置数据库或服务凭据，因此未启动。它是相邻的分析/自动化参考，不是主要广告投放控制器。 |

## 主要架构判断

- **主候选：adport 的本地 CLI/MCP 控制层。** 同一策略引擎同时服务 CLI 和 MCP。写入先产生带预算变化的只读预览，再用短期 approval id 和完全相同的参数应用；受保护账户、预算上限和参数变更会阻止提交；新建对象先暂停，写操作进入本地追加式审计日志。它更接近运营人员的效率工具，而不是必须收费的 SaaS 平台。
- **云端客户门户仍需按 PoStory 需要决定。** adport 仓库也有 Supabase 多租户云应用源码，含成员/RLS、加密凭据库、OAuth broker、审批和审计；但本地开发说明要求 Docker + Supabase CLI。生产模式另需完成提供方应用审核、密钥/KMS、回调域名、隐私和运营准备。源代码存在不能视为可直接安全上线。
- **Meta MCP 是服务组件，不是多客户运营产品。** 使用它必须由 PoStory 自己发 JWT、承载客户工作区、管理 Worker 密钥和审计；其 `wrangler.jsonc` 当前含有预设部署标识和域名，部署前要将配置改为自己的 Cloudflare 账户并明确 D1 / KV 目标。禁止直接执行仓库预置 `deploy`。
- **Meta Ads Manager 适合简化单平台广告 UI。** README 要求 Meta Developer app 与 Supabase；部署仍依赖 app secret、service role key 和可公开访问的回调 URL。仓库说支持多个品牌，不等于提供客户 OAuth 委托和独立门户。
- **AutoPost 是报告/利润侧参考。** 它聚合多个品牌广告与 Shopify 销售、利润、AI 建议和摘要；部署文档强调平台数据的归因重叠和币种限制。它没有覆盖本次优先的客户逐个授权与计划审批/投放控制链。

## 本地无广告凭据试跑

### Adport CLI 演示模式

运行环境：Node `v25.2.1`；仓库 `pnpm@11.8.0`。主机没有 Corepack，仓库固定 pnpm 且默认试图将 store 写入 `/pnpm-store`。通过显式用户临时缓存绕过后，`pnpm install --frozen-lockfile` 成功，供应链锁文件检查 327 条目通过。完整 `pnpm build` 成功（15 个 workspace 任务）。

安全本地命令：

```sh
ADPORT_DEMO=true ADPORT_HOME=/tmp/postory-adport-demo \
node packages/cli/dist/index.js --demo accounts
```

输出是两个 `mock` 合成账户。默认凭据位置独立指向 `/tmp/postory-adport-demo`；没有写 `~/.config/adport`。试跑不需要环境变量密钥；`ADPORT_DEMO=true` 或 CLI `--demo` 明确启用 mock provider。**不要**运行 `adport connect`，除非准备录入真实平台令牌；它会把本机凭据写入 `${ADPORT_HOME:-~/.config/adport}/credentials.json`，并以 `0600` 文件权限保存。即使在正常模式，adport 无凭据时也会 fail closed，不会自动切换到 mock。

完整 `pnpm build` 的 15 个 workspace 任务通过。首次并行执行构建与测试时，云应用任务因共享 Next 构建目录竞争而失败；随后顺序重跑 `pnpm test`，30 个 Turborepo 任务成功，云端测试显示 256 项通过、28 项因未配置测试数据库而跳过，CLI 测试显示 73 项通过。测试套件成功不代替真实平台账户和授权流程验证。

### 其他项目的所需环境（本轮未设置）

| 仓库 | 本地/云部署必需配置 | 真实平台密钥或凭据示例 |
|---|---|---|
| adport 自托管 CLI | 模拟模式只需 `ADPORT_DEMO=true`；真实接入可用各 provider 的命令或环境变量，凭据默认写入本机 JSON 文件并设为 `0600` 权限 | `META_ACCESS_TOKEN`；Google Ads client/developer token/refresh token；TikTok、Apple、Microsoft、Reddit 等 provider 各自 OAuth/API 密钥。云应用另需 `NEXT_PUBLIC_SUPABASE_URL`、Supabase publishable/secret/db URL、`ADPORT_CLOUD_ENCRYPTION_KEY`、`ADPORT_API_KEY_PEPPER`、`ADPORT_MCP_OAUTH_SIGNING_KEY` 和 provider app OAuth 配置。 |
| meta-mcp | Cloudflare Worker 的 D1 `META_DB`、KV `META_OAUTH_STATE`；JWT issuer/secret 或 JWKS；管理 UI 还需 app password 和 session secret；token 加密密钥 | `META_APP_ID`、`META_APP_SECRET`、`META_REDIRECT_URI`、`META_TOKEN_ENCRYPTION_KEY`。请求需要带 `workspaceId` 的应用签发 JWT。 |
| meta-ads-manager | `NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`、`SUPABASE_SERVICE_ROLE_KEY`、`NEXT_PUBLIC_APP_URL`、`CRON_SECRET` | `META_APP_ID`、`META_APP_SECRET` 以及 Meta Marketing API 访问授权。 |
| autopost | Node 24 / pnpm 12.4.2；`DATABASE_URL`、`AUTH_SECRET`、`ENCRYPTION_KEY`、`CRON_SECRET`、`NEXT_PUBLIC_APP_URL`。孤立演示通过 `DEMO_ENABLED` 开关控制，但现有服务模块在启动时仍要求数据库 URL。 | Meta token/account ID；Google developer token/client/refresh token；Snapchat/TikTok app 和访问凭据；Shopify token。可选 AI、Telegram、Polar 凭据。 |

## 需要在真实实施前完成的事项

1. 选定客户认证和代理授权方案；向 Meta、TikTok 等平台申请并验证应用和必要权限。
2. 先用独立测试业务管理平台和测试广告账户验证授权、读取、撤销、审批、暂停和只读报表。
3. 建立客户/平台/账户三元绑定、租户行级隔离、服务端加密密钥管理、凭据轮换、撤销和审计保留策略。
4. 复核平台条款、最小授权范围、回调域名和实际账户币种/时区/归因窗口；默认预算上限设为零或低额，批准后先创建暂停对象。
5. 将本轮静态原型流程映射到 PoStory 的正式路由和身份模型前，确认演示反馈；此原型自身不包含后端身份、授权或投放。
