# 广告平台范围说明

## 本次主候选的现成平台

PoStory 当前评估的主控制层是开源仓库 [ynnickw/adport](https://github.com/ynnickw/adport)。该仓库的 provider 范围包含：

| 平台 | 常见广告用途（通俗版） | 接入说明 |
|---|---|---|
| Meta Ads（Facebook / Instagram） | 社交信息流、视频、潜在客户、网站销售 | 需 Meta 应用与所需权限；访问客户账户取决于客户授权和应用审核 |
| TikTok Ads | 短视频触达、观看、销售、线索 | 账户地区和 API 能力会影响可用投放位置与对象 |
| Google Ads | 搜索意图、YouTube、展示、购物等 | 投放类型差异较大，需按目标选择对应 campaign type |
| Apple Search Ads | App Store 内的应用搜索推广 | 适用于 App 拉新，不适用于一般电商网站广告 |
| Microsoft Advertising | Bing 等 Microsoft 搜索/受众网络 | 适用于搜索与受众广告，需单独账户授权 |
| Reddit Ads | Reddit 兴趣社区、帖子和对话场景 | 需确认账户、地区和 provider 当前覆盖能力 |

以上表示“主候选代码中有 provider”，不等于 PoStory 已经获得平台生产权限或已经连上客户账户。真实代运营仍要逐平台完成开发者应用/权限审核、客户本人授权、客户广告账户映射与实账验证。**LinkedIn Ads 暂不在 Adport 当前 provider 列表中**；虽然 LinkedIn 有广告 API，但应作为后续单独评估与开发的接入，而非原型承诺的现成功能。

## 原型中的平台选择

首次向导用“推荐渠道与广告账户”让客户确认可用平台；推荐只是建议，客户必须确认平台和账户。原型只演示 Meta、TikTok、Google、Apple Search Ads、Microsoft Ads、Reddit Ads 的选择，不发起授权或广告 API 请求。

平台推荐规则应综合客户目标、客户已授权账户、地区可用性、PoStory 可用素材与追踪能力。例：视频观看可优先建议 TikTok/Meta；搜索需求和明确的网站访问可建议 Google/Microsoft；App 安装可考虑 Apple Search Ads。**最终候选由广告账户能力和客户确认决定**，不能只凭行业或 AI 推测自动打开新渠道。

## 官方平台结构参考

- [Google Ads campaign types](https://developers.google.com/google-ads/api/docs/campaigns)：类型决定广告在哪些网络投放及可用素材、竞价功能。
- [TikTok API ads structure](https://ads.tiktok.com/gateway/docs/index?doc_id=1739381193120770)：Campaign 设目标，Ad Group 配受众/预算/日程，Ad 设具体展示内容。
- [LinkedIn Advertising API overview](https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads/ads-overview?view=li-lms-2026-01)：官方 API 可管理客户广告账户、campaign、creative 和 analytics，但需把接入单独排期。
- [Meta Marketing API collection](https://www.postman.com/meta/facebook-marketing-api/overview)：官方 API 示例涵盖 campaigns、ad sets、ads 与 insights。
