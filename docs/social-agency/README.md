# social-agency（已并入 Postory 的早期方案）

2026-09-27 的第一版方向：代运营后台，Orshot 出图 + Ayrshare 真实发布 + LLM 文案，客户只填资料选模板、不改模板。
同日转向 social-shell（现 Postory）的套壳演示路线，本方案停在台账 8/16。

- 文档：需求原话、架构设计、详细设计、验收标准、踩坑记录、任务台账、DEV-PLAN
- `shots/`：T2–T7 阶段截图
- `code/`：当时的完整源码快照（不含 node_modules、上传文件）。已从 Postory 的 tsconfig 排除，不参与构建。
  将来做真实发布时可参考 `code/src/lib/providers/{ayrshare,orshot,llm}.ts` 和 `code/src/lib/crypto.ts`。
