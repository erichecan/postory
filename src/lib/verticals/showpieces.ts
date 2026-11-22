/**
 * Phase 3: carefully art-directed public sample creatives for two distinct
 * buying journeys.  These are marketing concepts, never real client work.
 * "Caption" is retained internally as a production brief; customer dialogs
 * do not expose the three-layer copy engine.
 *
 * Nails photos: existing PoStory sample photography in public/demo/photos.
 * Roofing photos: independently credited free Unsplash sources, NOT actual
 * projects, team members or customers of the fictional NORTH ROOFING brand.
 */
export type ShowpieceIndustry = "nails" | "roofing";
export type DesignLayout =
  | "beauty-editorial" | "beauty-fullbleed" | "beauty-window"
  | "beauty-split" | "beauty-minimal" | "beauty-journal"
  | "roof-editorial" | "roof-documentary" | "roof-split"
  | "roof-technical" | "roof-architecture" | "roof-fieldnotes";
export type Showpiece = {
  id:string; goalId:string; variant:"A"|"B"; industry:ShowpieceIndustry;
  image:string; imageAlt:string; layout:DesignLayout;
  eyebrow:string; headline:string; subline:string; cta:string;
  bodyCopy:string; visualReason:string; outcome:string;
  imageCredit:string; photographyNotice:string;
  evidenceNeeded:string[];
};
const n="/demo/photos/";
const roof={
  crew1:"https://images.unsplash.com/photo-1763665814605-a6489a3bf2a0?auto=format&fit=crop&w=1000&q=85",
  crew2:"https://images.unsplash.com/photo-1763665814485-a0a1b6f51ed7?auto=format&fit=crop&w=1000&q=85",
  house1:"https://images.unsplash.com/photo-1755114203680-d39d95efa82c?auto=format&fit=crop&w=1000&q=85",
  house2:"https://images.unsplash.com/photo-1755113717103-eceec858546a?auto=format&fit=crop&w=1000&q=85",
};
const nailNotice="PoStory 演示图库照片，并非 STUDIO NAILS 的实际作品。正式发布需换成店铺授权的真实作品。";
const roofNotice="Unsplash 授权示意照片，并非 NORTH ROOFING 的员工或实际工程。正式客户宣传须改为经授权的项目照片。";
function nail(goalId:string, variant:"A"|"B", layout:DesignLayout, image:string, eyebrow:string,headline:string,subline:string,cta:string,bodyCopy:string,visualReason:string,outcome:string,evidenceNeeded:string[]):Showpiece {
  return {id:`nails-${goalId}-${variant.toLowerCase()}`,goalId,variant,industry:"nails",layout,image,imageAlt:"美甲作品摄影视觉示例，不代表虚构品牌真实业绩",eyebrow,headline,subline,cta,bodyCopy,visualReason,outcome,imageCredit:"PoStory sample photo",photographyNotice:nailNotice,evidenceNeeded};
}
function roofing(goalId:string,variant:"A"|"B",layout:DesignLayout,image:string,eyebrow:string,headline:string,subline:string,cta:string,bodyCopy:string,visualReason:string,outcome:string,evidenceNeeded:string[],credit:string):Showpiece {
  return {id:`roofing-${goalId}-${variant.toLowerCase()}`,goalId,variant,industry:"roofing",layout,image,imageAlt:"住宅屋顶及真实施工图库照片，示意视觉，不代表虚构品牌工程",eyebrow,headline,subline,cta,bodyCopy,visualReason,outcome,imageCredit:credit,photographyNotice:roofNotice,evidenceNeeded};
}

export const SHOWPIECES:Showpiece[]=[
  nail("bookings","A","beauty-editorial",n+"nail-1.jpg","THE APPOINTMENT EDIT","Your next set.\nYour kind of detail.","A fresh look for your next appointment.","VIEW THE WORK",
    "A nail set can be simple without being ordinary. Start with the shape, finish and details you actually like. Explore our work, then ask about appointment availability.",
    "真实作品放在视觉焦点，预约行动单独出现，不靠未确认的折扣吸引新客。","作品页访问与预约咨询",["可展示作品的授权","真实预约入口","可预约服务项目"]),
  nail("bookings","B","beauty-window",n+"nail-2.jpg","AN INVITATION","A little time\nfor your nails.","A quiet moment, made yours.","EXPLORE APPOINTMENTS",
    "Planning a little time for yourself? Browse the nail looks first and choose what feels like you. Contact the studio to check available appointments.",
    "采用空间留白和预约场景，而不是用虚假的可约日期和优惠价格填满图片。","来自作品页的预约意向",["实际可预约时间","服务项目","真实咨询方式"]),
  nail("styles","A","beauty-fullbleed",n+"nail-2.jpg","DETAIL STUDY  /  01","It's all\nin the finish.","One close-up. Every detail.","SEE MORE LOOKS",
    "The tiniest details change the whole look. Swipe through the finish, colour and shape of this nail set. Which element catches your eye first?",
    "作品特写承担主要说服任务，文案只解释可见细节，不编造材料或色号。","作品收藏、款式咨询",["实拍款式与授权","已核实的颜色／材料","系列图"]),
  nail("styles","B","beauty-journal",n+"nail-3.jpg","THE LOOKBOOK","A new\nnail mood.","Find the look that feels like you.","BROWSE THE GALLERY",
    "Picking your next nail design? Start with the details: shape, finish and how the colour works in different light. Save the look you love and ask whether the studio can create it.",
    "作品图集封面语言，不假装所有流行款式均已由门店提供。","作品收藏与咨询",["真实作品授权","能否提供该款","实际价格范围"]),
  nail("openings","A","beauty-split",n+"nail-3.jpg","YOUR NEXT VISIT","Make room\nfor you.","Check the studio's available times.","ASK ABOUT AVAILABILITY",
    "Need a nail appointment that fits your week? Tell us your preferred service and time window. We can help you find an available slot.",
    "用预约便利性表达“填档期”，不写未确认的明天有空或只剩三席。","空档咨询和实际预约",["实时可约时段","服务时长","预约限制"]),
  nail("openings","B","beauty-minimal",n+"nail-4.jpg","STUDIO NOTES","A moment\nto reset.","Take a look at the appointment diary.","CONTACT THE STUDIO",
    "A small reset between busy days can feel like a treat. See the studio's work, then get in touch to ask about the next available appointment.",
    "强调个人护理体验，不把空档营销变成硬促销。","预约入口点击",["最新可约档期","服务项目","取消政策"]),
  nail("return","A","beauty-journal",n+"nail-4.jpg","THE RETURN VISIT","Ready for\na refresh?","A new detail for a familiar ritual.","SEE WHAT'S NEW",
    "Have a new colour or finish in mind? Explore a few recent nail looks and choose the details for your next visit. Ask the studio about timing and availability.",
    "用作品更新提醒回访，不虚构“会员专享”权益。","老顾客咨询和回访预约",["近期真实作品","服务时长","真实回访权益（如有）"]),
  nail("return","B","beauty-editorial",n+"nail-1.jpg","BACK AT THE STUDIO","Another visit.\nAnother look.","Choose your next favourite.","BROWSE NAIL LOOKS",
    "Your next visit does not have to mean the same design. Look through the studio's recent work for an idea worth trying.",
    "将回访理由建立在新的审美选择，而不是制造不真实的会员优惠。","老客咨询及作品互动",["真实近期款式","可预约服务"]),
  nail("premium","A","beauty-minimal",n+"nail-2.jpg","THE CRAFT","The details\nare the work.","A closer look at the finish.","EXPLORE THE SERVICE",
    "Choosing a nail service is about more than the colour. Ask what the service includes, how long it takes and which finish is right for your everyday routine.",
    "以细节特写支持服务价值说明，不使用无根据的高端、顶级认证。","高价值服务咨询",["真实服务内容","时长和收费","实际使用材料"]),
  nail("premium","B","beauty-split",n+"nail-4.jpg","SERVICE FOCUS","Not just\na colour.","Understand the service behind the look.","ASK ABOUT OPTIONS",
    "There is a difference between choosing a colour and choosing a full nail service. Compare what each option includes before booking.",
    "通过服务内容解释高客单价的合理性，不制造模糊套餐。","不同服务咨询比率",["服务对照说明","真实材料","价格"]),
  nail("trust","A","beauty-window",n+"nail-3.jpg","BEHIND THE LOOK","Made with\nattention.","Good work is worth looking at closely.","SEE THE DETAILS",
    "A closer look at a finished set tells you more than a generic promise. Browse the details and ask the studio about the process behind this look.",
    "用可见的真实完成作品展示技术，而非虚构好评或卫生认证。","作品浏览深度与信任咨询",["作品授权","工艺流程照片","可核实服务说明"]),
  nail("trust","B","beauty-fullbleed",n+"nail-1.jpg","STUDIO PORTRAIT","Care shows\nin the details.","The small things matter.","MEET THE STUDIO",
    "Before choosing a nail studio, look at the work it actually does. The finish, shape and consistency are a useful place to start.",
    "以真实作品质量建立信任，克制文案，不展示未经核实的客户证言。","主页访问与咨询",["作品授权","真实工作环境","客户使用同意"]),
  roofing("quotes","A","roof-editorial",roof.crew1,"FIRST STEP  /  ASSESSMENT","Not sure what\nyour roof needs?","A clear assessment starts with the right questions.","REQUEST AN ASSESSMENT",
    "Not every roof concern has the same answer. Before deciding on repairs or replacement, discuss the roof's age, visible condition and what an assessment will include. Contact us to ask about the process.",
    "从房主真实顾虑切入，用施工场景配合清晰的评估流程，不宣传虚构的免费服务。","有效评估咨询",["真实服务区域","评估是否收费","实际评估范围"],"Sergej / Unsplash"),
  roofing("quotes","B","roof-technical",roof.house1,"HOMEOWNER GUIDE","Know the roof.\nThen decide.","Questions worth asking before requesting a quote.","DISCUSS YOUR ROOF",
    "Planning roofing work? Have the roof type, approximate age and areas of concern ready when you request an assessment. Clear information helps start a useful conversation.",
    "采用房屋建筑视角与信息结构，帮助客户形成有效线索。","带有房屋信息的报价咨询",["真实服务地区","接单方式","专业评估条件"],"Paragon Exterior / Unsplash"),
  roofing("projects","A","roof-architecture",roof.house2,"WORK, DOCUMENTED","The result\ndeserves a look.","See the detail behind a roofing project.","EXPLORE PROJECT WORK",
    "A roofing decision deserves more than a promise. Look for details in the materials, installation approach and completed work. Ask which project examples are available to review.",
    "以屋顶建筑照片为视觉中心，案例必须附真实项目来源而不能冒充该虚构公司的工程。","工程案例阅读和报价咨询",["真实项目授权","地址隐私许可","施工范围与年份"],"Paragon Exterior / Unsplash"),
  roofing("projects","B","roof-fieldnotes",roof.crew2,"FROM THE FIELD","What goes\ninto the work.","A closer view of roof installation.","SEE THE PROCESS",
    "Before-and-after photos show the result, but the work in between also matters. Ask your contractor about materials, layers and the inspection steps that are part of the project.",
    "以工作过程取代空泛“保证质量”口号；不虚构完工指标。","工程流程内容互动",["现场照片授权","工艺说明","可核实工序"],"Sergej / Unsplash"),
  roofing("trust","A","roof-documentary",roof.crew2,"CRAFT + PROCESS","Look closer\nat the process.","Good questions make better decisions.","LEARN HOW WE WORK",
    "Choosing a roofing contractor? Ask how the work will be scoped, what materials are proposed and how changes are handled. A clear process makes a large home decision easier to understand.",
    "用真实施工细节作为信任证据入口，而不是虚构评论、资质或保修保证。","深入咨询与资质询问",["资质和保险文件","工作流程","真实施工照片"],"Sergej / Unsplash"),
  roofing("trust","B","roof-split",roof.crew1,"FIELD NOTES","Know who's\non the roof.","The process matters as much as the finish.","ASK ABOUT THE CREW",
    "The details of a roofing project matter. Ask about the team, safety process, site protection and how the work will be reviewed.",
    "人物与工地记录风格，建立透明感；明确这是图库施工照片。","团队和工艺问询",["真实团队授权","安全流程","保险／执照（如适用）"],"Sergej / Unsplash"),
  roofing("seasonal","A","roof-technical",roof.house1,"SEASONAL CHECKLIST","Before the\nweather turns.","Know what to look at around your roof.","VIEW THE CHECKLIST",
    "Seasonal changes are a useful time to pay attention to your roof and gutters. If you notice signs of concern, ask a qualified local contractor what an appropriate assessment involves.",
    "科普型而非恐吓型广告，不虚构风暴损坏或免费检查。","季节检查相关咨询",["适用季节与地区","检查服务收费","安全建议"],"Paragon Exterior / Unsplash"),
  roofing("seasonal","B","roof-editorial",roof.crew1,"MAINTENANCE NOTES","A roof check\nstarts here.","A practical question before the next season.","ASK ABOUT INSPECTION",
    "If you are considering seasonal roof maintenance, start with a clear list of concerns and an explanation of what can safely be inspected. Discuss availability and fees before booking.",
    "让时令营销服务于真实信息，而不靠倒计时与危机制造。","检查服务询问",["检查项目","服务费","地区与时间"],"Sergej / Unsplash"),
  roofing("referrals","A","roof-architecture",roof.house2,"NEIGHBOURHOOD WORK","Trust begins\nwith the details.","Ask to see relevant local work.","EXPLORE REAL PROJECTS",
    "Before choosing roofing work for your home, ask for project examples relevant to your roof type and local conditions. Real work is easier to evaluate than slogans.",
    "以本地建筑环境带出邻里信任，但不伪造“邻居都推荐”。","本地案例浏览与转介绍咨询",["可公开的当地工程","转介绍授权","服务范围"],"Paragon Exterior / Unsplash"),
  roofing("referrals","B","roof-fieldnotes",roof.crew2,"COMMUNITY + CRAFT","Local work.\nClear answers.","A conversation starts with the work.","ASK ABOUT OUR PROCESS",
    "A recommendation can start a conversation, but the project details should finish it. Ask about materials, the scope of work and what similar projects can be reviewed.",
    "把邻里推荐转化成对工程证据的检验，不编造口碑评分。","推荐线索和项目咨询",["真实推荐授权（如引用）","工程资料","区域"],"Sergej / Unsplash"),
];

export function getShowpieces(industry:string, goalId:string):readonly Showpiece[] {
  if(industry!=="nails" && industry!=="roofing")return [];
  return SHOWPIECES.filter(item=>item.industry===industry && item.goalId===goalId);
}
