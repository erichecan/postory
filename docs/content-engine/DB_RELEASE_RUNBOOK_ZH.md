# PoStory Content Engine · 数据库发布与回滚操作清单

更新：2026-11-21。适用范围：PR #7 的 `ContentBrandShop`、`ContentBrandProfile`、`ContentBrandAsset`、`ContentBrandReviewEvent`。
**这是一份执行手册；写入 GitHub 或合并 main 并不会自动修改生产数据库。**

## 0. 前提和责任

- 部署执行者必须有生产 PostgreSQL/Cloud SQL 权限，以及用于发布 Cloud Run 的权限。
- 需要取得当前生产数据库 `DATABASE_URL` 的安全连接方式；不要把密码写进代码、日志、聊天或 `NEXT_PUBLIC_*`。
- 先查看现有数据库的 `_prisma_migrations`，确认没有执行过尚未合并时被改写的同名迁移 `20261121093000_content_brand_profiles`。
- 必须备份数据库或创建可恢复的 Cloud SQL 备份/PITR 恢复点；记录项目、实例、备份时间、应用旧版本镜像。
- 确保上传图片使用 GCS 且配置相关服务账号权限，不要依赖 Cloud Run 容器本地文件永久存储。

## 1. 当前已经验证

GitHub Actions 隔离 PostgreSQL 16 服务上运行全套 `npx prisma migrate deploy`，随后测试账号/门店隔离、草稿版本并发控制、私有素材归属和审核事件记录；与生产连接无关。

## 2. 推荐发布步骤

1. 在维护窗口前确认 CI 成功且 PR 的目标提交 SHA 与待部署版本一致。
2. 在具有生产访问权限的环境中创建 Cloud SQL 备份／恢复点，并验证可用。
3. 在部署服务之前、使用匹配代码与 Prisma 版本的 migration 容器执行以下命令（数据库连接通过 Secret Manager 或受控环境注入）：

```bash
npx prisma migrate status
npx prisma migrate deploy
npx prisma migrate status
```

4. 查询 `_prisma_migrations` 中新迁移是否成功，并在受限连接下检查四个 ContentBrand 表存在。不能仅以 CLI 退出码作为唯一上线依据。
5. 发布对应代码到 Cloud Run（现有项目 Dockerfile 已定义 migration stage；具体 GCP project、service account、registry 与 Cloud SQL 网络接入依生产现有流水线，不在本文捏造配置）。
6. 测试两个独立登录账号、同账号两家门店：创建、保存、刷新、图片上传和读取；同账号不同门店不得互相引用图片，跨账号访问必须拒绝。
7. 检查服务的 GCS 读写、图片 MIME 解码、内容类型和缓存头，以及错误和请求日志；任何检查失败都暂停客户使用。
8. 上线后先只开放给内部测试账号，验证 Brand Profile 的审核事件仍停留在待审，未开启内容自动发布。

## 3. 失败与回滚

- Prisma 迁移是向前增加表和索引，**不要在生产执行 `migrate reset` 或随意删除表**。
- 代码问题优先回滚 Cloud Run 到部署前的已知正常镜像/修订版，保留向前兼容的新表。
- 迁移问题应恢复数据库备份或由 DBA 制作专门的修复迁移，不允许对存储有客户资料的表直接执行随意 `DROP`。
- 若迁移部分失败，先读取 `_prisma_migrations` 和 Cloud SQL 日志，再决定修复路径；避免重复跑手工 SQL。
- 上传失败后检查 GCS 权限和对象孤儿记录，不把 DB 更新成功等同于素材已可读取。

## 4. 剩余上线门禁

- HTTP + 真实 Session 的跨账号/跨门店权限测试；当前 CI 主要是数据层集成测试。
- GCS 实际上传/读取/删除，含网络失败、重试和孤儿对象清理。
- 生产限流、用户可见错误处理和经客户授权的素材使用规则。
- 全面的版本审批角色（商家/设计师/代理商）与授权操作；当前 `submitted_for_review` 是正式审核入口的基础，不是发布许可。
- 分层 Renderer、行业促销规则、邮件确认、真实渠道发布还未进入本次数据库发布范围。

## 5. 已知限制

用户要求“尽快完成全部开发”是目标，但目前只完成 Content Engine 基础和部分审核链路；请勿将数据库迁移、PR 合并或构建成功描述为整个系统交付或 Cloud Run 生产上线。

## 6. 默认关闭的发布开关

合并 `main` 或自动部署 **不会开启** Content Engine 的品牌数据库接口。所有新接口默认检查运行环境的 `CONTENT_ENGINE_ENABLED`，只有值为精确字符串 `true` 时才开放；未开启时返回 503。旧的 `/store` 完全不使用这个开关。

必须按以下顺序发布：
1. 新版本代码与 Prisma migrations 可安全进入 `main`；新接口默认不可用。
2. 运维拥有 Cloud SQL 权限时执行备份、`prisma migrate deploy`、权限和存储测试。
3. 仅在第 2 步通过后，用部署环境的受控配置设置 `CONTENT_ENGINE_ENABLED=true`，发布新 Cloud Run 修订版并验证真实登录流程。
4. 发现任何越权或存储问题时，立刻取消该环境变量并重新发布应用配置，停止品牌档案 API；这不能代替撤销已经授权的访问或审计事故处理。

绝对不要为了让页面看起来可用，就在尚未迁移的生产环境中提前开启开关。
