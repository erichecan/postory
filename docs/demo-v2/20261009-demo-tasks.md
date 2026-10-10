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

- [x] 01 Landing(美甲社交媒体预约助手.png)
      验收命令:`node /private/tmp/postory-browser/demo-v2-nails-flow.cjs`(真实 Chromium,
      完整走 Landing→Upload→Templates→Edit→Preview→Success 全流程)
      可看物:docs/demo-v2/shots/m2-nails-01-landing.png
      定性状态:待你确认
      证据:curl 200;`tsc --noEmit -p .` 全仓库 0 错误;整条流程 CONSOLE_ERRORS: []。
            Read 工具目视核验:标题/副标题/3卡轮播(小红书/Instagram/Facebook 平台 mock)/
            CTA 按钮/2×2 功能格栅/多平台支持行/底部转化引导区均正确渲染,文字与结构对照
            mockup 一致。已知简化(如实记录,不冒充 100% 还原):爱心线稿装饰、下划线波浪线、
            轮播分页圆点、照片拼贴纹理未实现,用纯色/emoji 替代。
      依赖:M1

- [x] 02 Upload(美甲作品上传界面.png)
      验收命令:同上,脚本内上传 2 张真实 PNG 文件并断言"已上传 2/6"文案出现
      可看物:docs/demo-v2/shots/m2-nails-02-upload.png
      定性状态:待你确认
      证据:上传后 2 张缩略图、编号徽标、✕ 移除按钮、"+再添加一张"占位格、
            小贴士卡片均正确渲染,"下一步"按钮在 count<1 时禁用、≥1 时可点击,
            实测点击后正确跳转 /demo/nails/templates。
            已知简化:拖动排序手势(⇄ 按住拖动排序)未实现,当前仅支持点 ✕ 删除后重新上传,
            如实标注,未冒充已支持。
      依赖:01

- [x] 03 Templates(美甲社交媒体模板精选UI.png)
      验收命令:同上;另跑 `node /private/tmp/postory-browser/demo-v2-nails-viewport-check.cjs`
      做 320/390/430 三档视口 overflow 断言
      可看物:docs/demo-v2/shots/m2-nails-03-templates.png、m2-nails-03-templates-320.png
      定性状态:待你确认
      证据:1 张真实可选模板(实际走查显示用户刚上传的照片)+ 5 张"即将上线"禁用占位卡,
            不伪造 6 套真实可用模板。三档视口 document.scrollWidth<=clientWidth 均为 false
            (无横向溢出)。⚠️ fullPage 截图中固定定位的"使用这个模板"按钮会悬浮在页面中段
            遮住 03/04 卡片文字——经二次验证(滚动到底部后截取视口截图,见
            /tmp/templates-scrolled-viewport.png,未入库)确认这是 Playwright fullPage 截图对
            position:fixed 元素的已知渲染假象,真实滚动场景下按钮正确停留在视口底部、
            不遮挡任何卡片,不是真实渲染缺陷。
      依赖:02

- [x] 04 Edit(粉色美甲社媒模板编辑器.png)
      验收命令:同上
      可看物:docs/demo-v2/shots/m2-nails-04-edit.png、m2-nails-04-edit-saved.png
      定性状态:待你确认
      证据:模板实时预览卡、3 个 tab(文案内容/照片替换/预约时间)、标题输入框
            (真实 maxLength=30,实测显示"7/30")、正文描述 textarea(真实 maxLength=200,
            实测显示"46/200")均正确渲染并与 NAILS_FIELD_CATALOG 的真实字段上限绑定。
            "保存草稿"按钮本轮修复:此前该按钮无 onClick、是无效 UI 元素,
            已接入真实保存逻辑(写入 session.draft 但不跳转),实测点击后出现
            "草稿已保存 HH:MM"提示,m2-nails-04-edit-saved.png 为证据截图。
            "预约时间" tab 如实显示"档期编辑即将推出,当前免费体验版仅支持标题与正文描述"
            静态提示,不伪造可用控件。"照片替换" tab 为真实功能,点击已上传的其他照片
            可切换预览用的主图。
      依赖:03

- [x] 05 Preview&Export(美甲笔记预览与导出页面.png)
      验收命令:同上,脚本内真实点击"导出我的作品"并捕获浏览器下载
      可看物:docs/demo-v2/shots/m2-nails-05-preview.png
      定性状态:待你确认
      证据:SUGGESTED_FILENAME: postory-nails-f4a1a2c2-1080x1620.png;PNG_MAGIC_OK: true;
            FILE_BYTES: 1154861;`sips -g pixelWidth -g pixelHeight` 确认 1080×1620,
            与 portrait-2x3 规格一致。尺寸选择区按"不伪造"原则只有小红书竖版 2:3 可选
            (真实功能),Instagram 方形 1:1 与竖版 4:5 显示"即将支持"禁用态,
            未假装支持 V2.0 之外或未实现的尺寸。信息横幅显示真实
            WATERMARK_POLICY_VERSION(demo-v1)。导出后自动跳转到 Success 页并带上
            session 与生成的文件名。
      依赖:04

- [x] 06 Success(粉色美甲社媒发布成功页.png,文案已改"已保存到相册"为"已生成可下载")
      验收命令:同上,跳转后断言 URL 含 /success
      可看物:docs/demo-v2/shots/m2-nails-06-success.png
      定性状态:待你确认
      证据:DEV-PLAN 歧义清单第2条要求的文案修正已落实并截图验证:
            "图片已生成,点击下载保存"(非"已保存到相册")、
            "下载后可手动发布到小红书等平台"(非"可直接发布到小红书",因无真实发布集成)。
            结果卡复用真实渲染的模板预览(含用户照片与文案),4 项核对清单文字如实,
            底部转化区"了解 PoStory 代运营服务"与"继续制作下一篇"按钮均可点击,
            后者实测正确跳转回 /demo/nails/upload 开启新一轮。
      依赖:05

- [x] Nails 端到端移动端视口回归
      验收命令:`node /private/tmp/postory-browser/demo-v2-nails-viewport-check.cjs`
      定性状态:待你确认
      证据:320/390/430 三档视口下,Landing→Upload→Templates→Edit→Preview 全部
            document.documentElement.scrollWidth<=clientWidth(无横向滚动),
            320px 下三页截图(m2-nails-01-landing-320.png、m2-nails-03-templates-320.png、
            m2-nails-04-edit-320.png、m2-nails-05-preview-320.png)目视核验排版未破版。
            ⚠️ 真机(iOS Safari/Android Chrome)冒烟本轮沙箱环境无法执行,
            如实标注为未验证,留给真实上线前人工测试。
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
