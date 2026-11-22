# PoStory 第三阶段：美甲与屋顶行业创意/文案库 v1
2026-11-21

## 这次实际实现的范围
- 美甲美容 **6 个经营目标 × 2 套创意 = 12 套**，屋顶装修 **5 个经营目标 × 2 套创意 = 10 套**。一共 **22 套视觉、标题、完整社媒正文、CTA、证据清单及创意理由**。
- 第一阶段确认过的五步框架和左右案例布局保持不变；案例卡片增加「创意方案 A / B」两个演示示例。不是自助设计工具，没有让店主进行复杂模板编辑。
- 客户在 `/for/nails`、`/for/roofing` 可直接查看广告视觉、理解对应的经营问题、看完整案例和正式创意必须具备的实际素材。
- 内部配置见 `src/lib/verticals/showpieces.ts`；前端组件见 `src/components/visual/industry-showpiece-poster.tsx`；样式见 `src/components/visual/visual.css`。
- 现有通用生成接口通过行业 slug 和营销目标索引取得参考文案及创意指导，但**不会把演示品牌的项目成果当作真实客户信息**。全套代码仍需使用商户确认的产品、服务、营业规则和授权图片。
- 正式服务的内容制作、审核、排期和发布仍由 PoStory 内部负责。

## 美甲：预约与作品驱动
视觉设计：作品特写优先，暖灰、奶油色、柔和玫瑰色、系列画册节奏；6 类排版（editorial, fullbleed, window, split, minimal, journal）轮换。广告应展现可见的甲面细节和真实服务价值，不需要每张都是折扣海报。
- 预约：作品 → 想象自己完成后的造型 → 咨询实际档期
- 季节款：细节与光线 → 款式收藏 → 咨询是否可以制作
- 填档：个人护理场景 → 实际空档，不捏造“只剩三席”
- 回访：新的款式灵感 → 回访预约，不伪造会员权益
- 高价值服务：服务工艺及内容区别，不靠空泛“奢华”
- 口碑信任：实际作品授权、工艺与服务过程，不虚构五星评分

## 屋顶：信任与高客单价线索
视觉设计：专业施工纪实、建筑细节和清晰工程信息，深海军蓝与暖铜色；6 类结构（editorial, documentary, split, technical, architecture, fieldnotes）交错，避免“屋顶照片 + 免费报价”千篇一律。
- 报价线索：房主疑惑 → 介绍评估范围 → 申请沟通
- 工程案例：真实项目与工艺证明，不能冒用图库施工图片
- 信任：安全施工、人员、材料、流程信息必须核实
- 季节检查：解决具体维护疑虑，不制造灾害恐惧
- 本地推荐：真实当地案例、可证实推荐，不能假造社区信任

## 参考设计原则
Adobe 社媒图文设计：强视觉主体、明确层级、足够留白、手机阅读、场景与行动一致。参阅 https://www.adobe.com/express/learn/blog/design-tips-for-social-media-graphics
Adobe 社媒安全区指南：https://helpx.adobe.com/ca/express/web/publish-and-share/share-to-social-media/optimize-your-design-for-social-media-using-social-safezones.html

## 素材和版权
**美甲**：仓库已有演示照片 `public/demo/photos/nail-1.jpg ... nail-4.jpg`。只证明排版可行，不代表虚构 STUDIO NAILS 的真实服务或客户案例。商业交付仍需店主的授权摄影。

**屋顶**：Unsplash 免费授权图库，摄影师/来源：
- Sergej (@skstrannik), “Workers installing shingles on a steep roof” https://unsplash.com/photos/workers-installing-shingles-on-a-steep-roof-bquoYvs3KtQ
- Serg Karpow (@skstrannik), “Construction workers installing roofing materials on a house” https://unsplash.com/photos/construction-workers-installing-roofing-materials-on-a-house-vJlPP2qB1vI
- Paragon Exterior, “Aerial view of a suburban house with a grey roof” https://unsplash.com/photos/aerial-view-of-a-suburban-house-with-a-grey-roof--uvuU43FAwQ
- Paragon Exterior, “A suburban house nestled among trees on a grassy hill” https://unsplash.com/photos/a-suburban-house-nestled-among-trees-on-a-grassy-hill-MG6Yfoa_H70

Unsplash 许可：https://unsplash.com/license 。照片只能用于演示设计方法；其中的房子和工程不能被宣传成 NORTH ROOFING 的实际业绩。某些人物与私人场所的肖像、财产权利需独立判断。尽管上述页面标注为 Unsplash License，正式商业广告务必替换成获得商家授权的素材。**不将第三方图库打包转售为独立图库产品。**

## 文案分层与店主界面
每套后台数据都有短标题、社媒正文、CTA、所需事实及创意理由。客户案例页面只展示**已经确认保留的标题、营销策略和可观察指标**，不会重新暴露先前要求移除的“第一层/第二层/第三层”内部文案框。

## 验收
1. `/for/nails` 6 个目标，每个可切换 A/B，照片与视觉语言明显不同于餐饮。
2. `/for/roofing` 5 个目标，每个可切换 A/B，真实施工、房屋、纪实照片正常加载，不宣称这些是 NORTH ROOFING 的工程。
3. 图片为 4:5，缩小到手机尺寸可识别核心信息；不同目标不复用同一排版。
4. 证据条件和营销理由与对应行业匹配；不存在无证据折扣与效果保证。
5. `/for/sushi`、`/store` 五步框架和海报保持不变。
6. 产品仍然定位为 Done-for-You：客户看案例、交资料、审核，PoStory 内部负责制作/发布。
