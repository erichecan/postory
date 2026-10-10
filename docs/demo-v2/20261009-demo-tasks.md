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

- [ ] contracts.ts 类型与 zod 校验
      验收命令:`npx tsc --noEmit`
      可看物:无(纯类型层)
      定性状态:不涉及
      证据:
      依赖:M0 完成

- [ ] IndexedDB session 封装(session/draft/asset CRUD、revision CAS、过期清理)
      验收命令:单元测试(待定) + 手动控制台验证
      可看物:无
      定性状态:不涉及
      证据:
      依赖:contracts.ts

- [ ] 媒体归一化(EXIF 方向、长边缩放、1-6 张校验)
      验收命令:上传测试图,断言输出尺寸与方向
      可看物:无
      定性状态:不涉及
      证据:
      依赖:contracts.ts

- [ ] Nails 行业配置 + 1 个模板组件跑通「真实照片→带水印PNG」
      验收命令:手动上传→选模板→导出,byte 级校验水印存在
      可看物:docs/demo-v2/shots/ 下导出截图
      定性状态:待你确认
      证据:
      依赖:session、媒体归一化、render.ts

- [ ] Sushi 行业配置 + 1 个模板组件跑通「真实照片→带水印PNG」
      验收命令:同上
      可看物:docs/demo-v2/shots/ 下导出截图
      定性状态:待你确认
      证据:
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
