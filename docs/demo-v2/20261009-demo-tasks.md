# PoStory Demo V2(Nails+Sushi)任务台账

台账是进度唯一真相。每周期从这里读起,不凭记忆。

## M0 仓库审查

- [x] M0 仓库审查文档
      验收命令:人工审阅 `docs/demo-v2/repository-audit.md` 完整性
      可看物:docs/demo-v2/repository-audit.md
      定性状态:不涉及
      证据:已核实无 middleware、export-page.ts 渲染管线、storage.ts 全文 165 行、
            i18n/config.ts 非路径前缀路由、无匿名 session 基建、Template.pages 不可复用。
            详见 docs/demo-v2/repository-audit.md 证据矩阵。
      依赖:无

## M1 共享核心

- [x] contracts.ts 类型与 zod 校验
      验收命令:`npx tsc --noEmit -p .`
      可看物:无(纯类型层)
      定性状态:不涉及
      证据:`tsc --noEmit` 全仓库通过,0 错误(含本文件涉及的全部 demo 模块)。
            `src/lib/demo/contracts.ts` 完整定义 IndustryId/FieldValue/OutputId/FieldSpec/
            OutputSpec/TemplateRef/IndustryConfig/MediaAsset/PhotoBinding/ContentDraft/
            DemoSession/RenderArtifact/TemplateDescriptor/ValidationIssue,对照 V2.0 §4-§9
            逐字段核对。
      依赖:M0 完成

- [x] IndexedDB session 封装(session/draft/asset CRUD、revision CAS、过期清理)
      验收命令:真实浏览器(Playwright+Chromium)跑通 create→save→load→export 全链路
      可看物:无(基础设施层,行为体现在下方两条可看物里)
      定性状态:不涉及
      证据:`src/lib/demo/session.ts`,DB `postory.demo.v2`,store `sessions`/`blobs`,
            key 格式 `postory.demo.v2.{industry}.{sessionId}`,24h TTL。
            Nails/Sushi 两条真实浏览器测试均完整走完 createEmptySession→saveSession→
            putBlob→导出,控制台 0 错误,证明 CRUD 与 blob 存取可用。
            revision CAS(`updateSession`)与 `cleanupExpired()` 为纯函数实现,
            随 M2/M3 真实多步编辑流程接入时补充端到端用例,当前未被独立触发,
            如实标注为⚠️未在本轮用真实场景覆盖。
      依赖:contracts.ts

- [x] 媒体归一化(EXIF 方向、长边缩放、1-6 张校验)
      验收命令:真实浏览器上传 PNG 测试图(480×486,带 alpha),断言归一化输出
      可看物:docs/demo-v2/shots/m1-nails-preview-dom.png(上传后状态截图)
      定性状态:不涉及
      证据:两次真实测试均输出 `已归一化:480x486,231KB`(Nails/Sushi 一致,
            因图片未超过 MAX_NORMALIZED_LONG_EDGE=2560 故未触发缩放分支)。
            `createImageBitmap(file,{imageOrientation:"from-image"})` 处理 EXIF,
            SHA-256 contentHash 生成成功(渲染管线依赖该 hash 组装 renderKey,
            renderKey 计算未报错即间接证明 hash 产出正确)。
            长边缩放分支、7 张拒绝、超限文件拒绝本轮未用真实大图/多图触发,
            如实标注为⚠️未覆盖,记入 M4 边界用例。
      依赖:contracts.ts

- [x] Nails 行业配置 + 1 个模板组件跑通「真实照片→带水印PNG」
      验收命令:`node /private/tmp/postory-browser/demo-v2-pipeline-check.cjs`
      (真实 Chromium headless,上传 public/brand/postory-social-logo-480.png →
      /demo/m1-harness → 导出)
      可看物:docs/demo-v2/shots/m1-nails-export.png
      定性状态:待你确认
      证据:STATUS_MID: 导出完成:postory-nails-19fe4dc8-1080x1620.png,1122KB;
            PNG_MAGIC_OK: true;FILE_BYTES: 1149152;CONSOLE_ERRORS: [];
            `sips -g pixelWidth -g pixelHeight` 确认 1080×1620,与 portrait-2x3 规格一致。
            Read 工具目视核验导出图:真实上传照片满铺背景、底部渐变遮罩、
            标题"今日作品分享"与短文案"欢迎预约,点击了解更多"正确渲染、
            深色圆角"PoStory"水印烘焙在右下角安全区像素内(非 CSS 叠加)。
            修复过程中发现并解决一个真实 bug:`toCanvas` 的 `cacheBust:true` 给
            blob: URL 追加 `?timestamp` 导致 `net::ERR_FILE_NOT_FOUND` 静默导出失败,
            已在 `src/lib/demo/render.ts` 改为 `cacheBust:false` 并留注释说明。
      依赖:session、媒体归一化、render.ts

- [x] Sushi 行业配置 + 1 个模板组件跑通「真实照片→带水印PNG」
      验收命令:`node /private/tmp/postory-browser/demo-v2-sushi-check.cjs`
      (同上,额外先点击"寿司"切换行业)
      可看物:docs/demo-v2/shots/m1-sushi-export.png
      定性状态:待你确认
      证据:SUGGESTED_FILENAME: postory-sushi-04f98001-1080x1620.png;
            PNG_MAGIC_OK: true;FILE_BYTES: 1328381;CONSOLE_ERRORS: [];
            `sips` 确认 1080×1620。Read 工具目视核验:菜名"鲑鱼刺身拼盘"、
            标题"今日作品分享"、短文案、"PoStory"水印均正确渲染在导出图中,
            与 Nails 复用同一 render.ts 管线,无需额外修复。
      依赖:同上

## M2 Nails 六页

- [ ] 01 Landing(美甲社交媒体预约助手.png)
      验收命令:`/demo/nails` 可访问,截图比对
      可看物:docs/demo-v2/shots/nails-01-landing.png
      定性状态:待你确认
      证据:
      依赖:M1

- [ ] 02 Upload(美甲作品上传界面.png)
      可看物:docs/demo-v2/shots/nails-02-upload.png
      定性状态:待你确认
      依赖:01

- [ ] 03 Templates(美甲社交媒体模板精选UI.png)
      可看物:docs/demo-v2/shots/nails-03-templates.png
      定性状态:待你确认
      依赖:02

- [ ] 04 Edit(粉色美甲社媒模板编辑器.png)
      可看物:docs/demo-v2/shots/nails-04-edit.png
      定性状态:待你确认
      依赖:03

- [ ] 05 Preview&Export(美甲笔记预览与导出页面.png)
      可看物:docs/demo-v2/shots/nails-05-preview.png
      定性状态:待你确认
      依赖:04

- [ ] 06 Success(粉色美甲社媒发布成功页.png,文案已改"已保存到相册"为"已生成可下载")
      可看物:docs/demo-v2/shots/nails-06-success.png
      定性状态:待你确认
      依赖:05

- [ ] Nails 端到端移动端视口回归 + 真机冒烟
      验收命令:390×844/320/430 三档视口截图,至少一台 iOS Safari 实测
      定性状态:待你确认
      依赖:01-06 全部完成

## M3 Sushi 六页

- [ ] 01 Landing(寿司社媒营销落地页.png)
      依赖:M1

- [ ] 02 Upload(寿司照片上传界面(1).png)
      依赖:01

- [ ] 03 Templates(寿司社交媒体模板选择界面.png)
      依赖:02

- [ ] 04 Edit(寿司社交媒体内容预览界面.png)
      依赖:03

- [ ] 05 Preview&Export(寿司社交内容预览界面.png + 寿司社交贴文预览界面.png)
      依赖:04

- [ ] 05b 发布排程页改造(寿司社交媒体发布安排界面.png,视觉还原但不接真实发布,见 DEV-PLAN 歧义清单第1条)
      定性状态:待你确认(这是我推断的处理方式,重点看)
      依赖:05

- [ ] 06 Success(寿司营销图片下载成功界面.png,文案同步修正)
      依赖:05b

- [ ] Sushi 端到端移动端视口回归 + 真机冒烟
      依赖:01-06 全部完成

## M4 完整质量

- [ ] 两行业模板风格补全至各 6 种(或记录缺口,不伪造)
- [ ] 错误处理矩阵(对照 V2.0 §12.3 error code 表,按需要的子集实现)
- [ ] 边界用例(第7张照片、超长文案、空必填、损坏图片)

## M5 收尾

- [ ] DEV-REPORT.md
- [ ] docs/nails/CONTINUE.md 与 HANDOFF.md 同步更新(本次新增内容不属于 Nails workspace,但需要在接力文档里注明新增了 /demo 独立入口,避免未来工具误判)

---
更新规则:每完成一项,勾选 + 填证据 + commit。同一问题连续 2 次没修好,停下问用户。
