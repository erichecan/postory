/** Public industry configuration. Shared marketing engine, distinct client-facing
 * goals, proofs, creative directions, offer types and required evidence.
 * Copy is conceptual only; never claim that a fictitious business actually offers
 * a promotion or has the represented credentials/projects.
 */
export type VerticalSlug = "sushi" | "nails" | "roofing" | "accounting" | "fitness" | "retail";
export type GoalConfig = {
  id: string; title: string; detail: string; example: string; category: "acquisition" | "conversion" | "retention" | "basket" | "awareness" | "trust" | "relationship";
  creative: { headline: string; description: string; approach: string[]; indicators: string[]; asset?: string; direction: string };
};
export type PromotionConfig = { id: string; label: string; requiredFacts: string[]; guardrail: string };
export type VerticalConfig = {
  slug: VerticalSlug; label: string; industry: string; serviceLabel: string;
  demoName: string; intro: string; theme: string;
  goals: GoalConfig[]; promotions: PromotionConfig[];
  intake: { nameLabel: string; itemLabel: string; itemPlaceholder: string; factPlaceholder: string; photoLabel: string };
  copyRules: string[]; imageRules: string[]; clientCta: string;
};
const g=(id: string,title:string,detail:string,category:GoalConfig["category"],headline:string,direction:string,asset?:string):GoalConfig=>({
  id,title,detail,category,example:direction,
  creative:{headline,description:direction,asset,direction,
    approach:["从真实客户场景和需求切入","只使用商家确认的事实及素材","以清楚的下一步行动引导咨询或预约"],
    indicators:["相关咨询和预约数量","内容互动及目标页面访问"]},
});
const p=(id:string,label:string,requiredFacts:string[],guardrail:string):PromotionConfig=>({id,label,requiredFacts,guardrail});
const common = {
  noFalseOffer:"未核实活动资格、价格、期限和例外条件时不得发布优惠声明",
  noFalseProof:"不得生成虚构的客户口碑、专业资质、项目结果或保证效果",
};
const configs: Record<VerticalSlug, VerticalConfig>={
  sushi: {
    slug:"sushi",label:"寿司／餐饮",industry:"餐馆",serviceLabel:"餐厅",demoName:"SAKURA SUSHI",
    intro:"围绕真实菜品、用餐时段和到店场景，展示 PoStory 如何持续经营餐厅的社媒内容。",
    theme:"#213831",clientCta:"了解寿司店营销方案",
    intake:{nameLabel:"餐厅名称",itemLabel:"主推菜品／套餐",itemPlaceholder:"例如：三文鱼寿司午餐组合",factPlaceholder:"菜品内容、供应时段、堂食／外带等已确认信息",photoLabel:"菜品或餐厅实拍"},
    goals:[
      g("footfall","增加到店客流或预约","让附近顾客更愿意来店、订位或预约。","acquisition","Make it a sushi lunch.","真实寿司午餐占据视觉中心，呈现明确的午休用餐场景"),
      g("promote","推广新品或主推商品／服务","让顾客认识一款具体菜品或服务。","conversion","A roll worth a look.","用经过确认的真实菜品近景展示主打菜品"),
      g("repeat","提高复购和会员活跃","让曾经到店的顾客想起再次预约。","retention","Sushi night again?","真实用餐氛围与轻量回访提醒，不虚构会员权益"),
      g("basket","提高客单价和组合销售","介绍适合一起分享的真实搭配。","basket","Sushi to share.","用真实多人分享场景展示可供选择的菜品"),
      g("offpeak","带动淡时段或指定日期","让顾客关注已核实的营业日或时段。","conversion","Make time for sushi.","通过时间场景讲述周中用餐理由，不虚构折扣"),
      g("awareness","提高服务地区内的知名度","让周边顾客认识品牌、菜品和制作过程。","awareness","Behind the sushi counter.","真实寿司师傅和餐厅制作过程"),
      g("unsure","我还不确定","先描述想改善的经营情况，PoStory 帮你梳理方向。","relationship","Which sushi tonight?","从实际菜单和顾客疑问寻找内容切入点"),
    ],
    promotions:[
      p("meal","午餐／套餐组合",["菜品和包含内容","真实价格","供应时段","适用门店"],common.noFalseOffer),
      p("seasonal","季节／限定菜单",["具体品项","供应开始及结束时间","实际库存或数量限制"],common.noFalseOffer),
      p("offpeak","指定时段活动",["开始和结束日期","时区及每天时段","资格限制","明确优惠条款"],common.noFalseOffer),
      p("loyalty","回访／会员活动",["参与资格","权益规则","使用限制"],common.noFalseOffer),
    ],
    copyRules:["先用具体菜品或用餐场景吸引注意","菜单、价格、营业时段均以商家确认数据为准","CTA 为查看菜单／订位／联系餐厅"],
    imageRules:["优先真实菜品近景与就餐场景","不得虚构食材配料或商品外观","手机端易读，避免每张图都是促销海报"],
  },
  nails:{
    slug:"nails",label:"美甲／美容",industry:"美甲／美容",serviceLabel:"美甲店",demoName:"STUDIO NAILS",
    intro:"从真实美甲作品、预约档期和客户回访出发，让作品成为最有力的营销素材。",
    theme:"#98526c",clientCta:"了解美甲店营销方案",
    intake:{nameLabel:"店铺／工作室名称",itemLabel:"服务项目／款式",itemPlaceholder:"例如：秋季猫眼美甲",factPlaceholder:"服务时长、材料特点、适用客群、真实预约方式",photoLabel:"真实作品／门店照片"},
    goals:[
      g("bookings","增加新客预约","让顾客清楚怎样预约体验。","acquisition","Your next nail appointment.","展示真实完成的作品和预约入口","/demo/photos/nail-1.jpg"),
      g("styles","展示当季款式","把一款真实完成的作品展示清楚。","conversion","A detail worth keeping.","特写甲面细节与真实色泽","/demo/photos/nail-2.jpg"),
      g("openings","填充空闲档期","在有真实可约时段时提醒顾客。","conversion","A little time for you.","根据商家确认的档期设置预约提醒","/demo/photos/nail-3.jpg"),
      g("return","提醒老客回访","建立维护与下次预约的节奏。","retention","Ready for a refresh?","以实际作品更新作为回访理由","/demo/photos/nail-4.jpg"),
      g("premium","介绍高价值服务","让顾客了解项目区别与适合人群。","basket","It's in the details.","用真实护理过程解释服务价值","/demo/photos/nail-2.jpg"),
      g("trust","建立作品口碑","真实展示技术、卫生标准和服务流程。","trust","Made with care.","展示真实工作过程，未经授权不得展示顾客身份","/demo/photos/nail-1.jpg"),
    ],
    promotions:[
      p("new-client","新客体验",["新客资格","真实价格","服务内容与时长","预约条件"],common.noFalseOffer),
      p("availability","指定时段预约",["可预约日期与时段","项目限制","有效期"],common.noFalseOffer),
      p("return","老客回访权益",["老客资格","权益和兑换限制","有效期"],common.noFalseOffer),
      p("seasonal","季节款活动",["适用款式","价格及额外收费","截止时间"],common.noFalseOffer),
    ],
    copyRules:["真实作品细节优先，避免医疗效果承诺","描述款式、服务时长和预约条件而不是泛泛地夸漂亮","CTA 为看作品／询问空档／预约"],
    imageRules:["使用授权的真实美甲作品","肤色与甲面还原准确，不凭空修改设计","避免未经授权的前后对比"],
  },
  roofing:{
    slug:"roofing",label:"屋顶／装修",industry:"家居服务",serviceLabel:"屋顶公司",demoName:"NORTH ROOFING",
    intro:"高客单价工程需要真实案例、专业施工证据和可信咨询入口，而不是廉价折扣海报。",
    theme:"#314c59",clientCta:"了解屋顶营销方案",
    intake:{nameLabel:"公司名称",itemLabel:"工程类型／服务",itemPlaceholder:"例如：沥青瓦屋顶更换",factPlaceholder:"服务地区、施工流程、材料和已核实的工程说明",photoLabel:"真实工地／完工项目照片"},
    goals:[
      g("quotes","获得有效报价咨询","让客户了解评估过程与服务区域。","acquisition","Start with a roof assessment.","专业评估流程和真实咨询入口，不承诺免费"),
      g("projects","展示工程案例","用真实项目证明施工能力。","trust","Built on real work.","使用已授权完工项目展示工艺"),
      g("trust","建立专业信任","解释工艺、施工安全与材料选型。","trust","See how the work gets done.","以施工细节和团队真实工作建立信任"),
      g("seasonal","推广季节性检查","针对季节问题解释何时需要检查。","conversion","Before the next storm.","季节检查信息不能暗示已经发生的损害"),
      g("referrals","获得邻居推荐","展示实际服务区域和可核实的项目。","relationship","Work your neighbours can see.","真实本地项目，不伪造邻居推荐"),
    ],
    promotions:[
      p("consult","报价咨询",["咨询是否收费","服务区域","评估范围","后续收费条件"],"未经核实不得宣称免费检查或保证报价"),
      p("inspection","季节性检查",["具体检查内容","费用","服务地区","时间及限制"],common.noFalseOffer),
      p("project","工程案例推广",["项目照片授权","项目类型","可公开的工程事实"],common.noFalseProof),
    ],
    copyRules:["从实际房屋问题和风险解释切入，不恐吓","真实工程、资质、保险、保修均须证据","CTA 为查看项目／预约评估／请求报价"],
    imageRules:["只用已授权工程和施工图片","不生成虚构前后对比或资质徽章","不把模型概念图当作实际施工结果"],
  },
  accounting:{
    slug:"accounting",label:"会计／报税",industry:"其他本地商家",serviceLabel:"会计事务所",demoName:"CLEAR ACCOUNTING",
    intro:"用可靠的知识、清楚的服务范围和预约咨询建立专业信任。",
    theme:"#334e61",clientCta:"了解会计营销方案",
    intake:{nameLabel:"事务所／会计师名称",itemLabel:"报税／会计服务",itemPlaceholder:"例如：小企业年度税务申报",factPlaceholder:"适用客户、服务范围、资质、咨询收费与预约方式",photoLabel:"真实工作场景／品牌素材"},
    goals:[
      g("consult","获取咨询预约","引导客户带着具体税务问题预约。","acquisition","Start with the right questions.","从真实问题切入解释服务，不承诺退税额"),
      g("service","解释专业服务","帮助客户理解所需的会计服务。","conversion","Know what to prepare.","信息图和服务清单，不虚构建议"),
      g("taxseason","报税季提醒","提醒客户确认适用的申报时点。","conversion","Tax season, clearly explained.","日期和法规以适用辖区官方信息为准"),
      g("credibility","展示专业能力","介绍可证实的专业资格与服务经验。","trust","Clarity builds trust.","真实顾问与工作过程，资质需有出处"),
      g("business","吸引企业客户","介绍企业服务范围和合作流程。","relationship","Support for business decisions.","具体企业服务与咨询流程"),
    ],
    promotions:[
      p("consult","预约专业咨询",["是否收费","时长","服务范围","顾问资格"],common.noFalseOffer),
      p("season","报税季服务介绍",["适用税务辖区","已核实的截止日期","适用客群","服务收费"],"严禁捏造法规截止日、退税金额和专业资质"),
      p("bundle","企业服务组合",["包含服务","真实价格","排除事项","计费周期"],common.noFalseOffer),
    ],
    copyRules:["专业、审慎、具体；避免提供未经审查的个人税务意见","资格、法规、截止时间必须核实","CTA 为下载材料清单／预约咨询"],
    imageRules:["真实专业场景、清晰信息图","避免假支票、虚构证书或退税保证","涉及客户资料须脱敏"],
  },
  fitness:{
    slug:"fitness",label:"健身",industry:"健身／健康",serviceLabel:"健身工作室",demoName:"MOVE STUDIO",
    intro:"聚焦真实课程、教练指导、体验预约和会员关系，不承诺不现实的效果。",
    theme:"#426050",clientCta:"了解健身营销方案",
    intake:{nameLabel:"健身房／工作室名称",itemLabel:"课程／会员服务",itemPlaceholder:"例如：周二晚小班力量训练",factPlaceholder:"适用人群、课程时间、教练信息及真实价格",photoLabel:"真实课程／场馆／教练照片"},
    goals:[
      g("trial","预约体验课","降低首次参与的了解成本。","acquisition","Find your first class.","真实课堂与体验预约方式"),
      g("members","促进入会咨询","介绍已确认的会员方案。","conversion","Make room for movement.","用真实场馆和方案信息帮助决策"),
      g("schedule","填充课程名额","突出可报名的真实课表。","conversion","A class that fits your week.","实际课程名额与时段"),
      g("renew","提高会员续费","传达持续练习与社区价值。","retention","Keep showing up.","社区氛围和课程连续性"),
      g("coaches","展示教练与氛围","建立专业和安全信任。","trust","Meet the people who coach.","真实教练与指导过程"),
    ],
    promotions:[
      p("trial","体验课程",["真实费用","课程日期","资格","取消条款"],common.noFalseOffer),
      p("membership","入会计划",["会费及强制费用","计费周期","取消及续费规则"],"不可隐瞒自动续费或取消限制"),
      p("class","指定课程活动",["课程名额","日期时间","报名和取消条款"],common.noFalseOffer),
    ],
    copyRules:["强调实际训练场景、课程适配和社区","不得保证减重、身材变化或医疗康复","CTA 为查看课表／预约体验"],
    imageRules:["经授权的真实会员和教练素材","不制造虚构身材前后对比","真实示范器材和安全动作"],
  },
  retail:{
    slug:"retail",label:"零售／家具",industry:"零售店",serviceLabel:"零售门店",demoName:"FORM & HOME",
    intro:"以真实商品、空间搭配、材料细节和清晰购买条件帮助顾客做出选择。",
    theme:"#755743",clientCta:"了解零售营销方案",
    intake:{nameLabel:"门店／品牌名称",itemLabel:"商品／商品组合",itemPlaceholder:"例如：双人沙发及配套边几",factPlaceholder:"尺寸、材质、库存、价格和退换政策",photoLabel:"真实商品／空间展示照片"},
    goals:[
      g("featured","推广主打商品","突出真实商品的用途和细节。","conversion","Made for everyday living.","商品实拍与应用场景"),
      g("bundles","提高组合购买","解释经过确认的搭配及包含内容。","basket","Pieces that belong together.","真实商品搭配，不编造套餐优惠"),
      g("new","展示新品","介绍实际上架的商品。","awareness","A new look for the room.","真实产品材质与尺寸"),
      g("visit","吸引到店体验","让顾客看到空间与产品实物。","acquisition","See it in person.","真实展厅和到店流程"),
      g("stock","开展真实库存活动","在确认库存和优惠条件后进行推广。","conversion","Explore what's available.","不虚构清仓量、原价或倒计时"),
    ],
    promotions:[
      p("bundle","商品套装",["包含商品","原价和活动价依据","库存","适用日期"],common.noFalseOffer),
      p("threshold","满额优惠",["计算门槛","排除商品","截止日期","其他限制"],common.noFalseOffer),
      p("second","第二件优惠",["适用品项","折扣计算方式","库存及退换规则"],common.noFalseOffer),
      p("clearance","季节／库存活动",["真实原价依据","库存条件","活动期限","退换政策"],"不得虚构原价或库存紧迫感"),
    ],
    copyRules:["强调具体商品与使用场景","尺寸、材质、库存、价格须可核实","CTA 为看商品／查看详情／到店体验"],
    imageRules:["采用真实商品图和经核实的空间搭配","禁止改变实际产品外形颜色或材质","不生成不存在的商品功能"],
  },
};
export const VERTICAL_SLUGS=Object.keys(configs) as VerticalSlug[];
export function getVerticalConfig(slug:string):VerticalConfig|undefined {
  return Object.prototype.hasOwnProperty.call(configs,slug)?configs[slug as VerticalSlug]:undefined;
}
export function validatePromotion(vertical: VerticalConfig, id: string, verified: Record<string,string>): string[] {
  const promo=vertical.promotions.find(x=>x.id===id);
  if(!promo)return ["不属于当前行业的活动形式"];
  return promo.requiredFacts.filter(x=>!verified[x]?.trim());
}
