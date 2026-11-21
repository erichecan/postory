"use client";

import Link from "next/link";
import "./sushi-brand.css";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type ChangeEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Camera, FileImage, ImagePlus, LockKeyhole, ShieldCheck, X } from "lucide-react";

type AssetType = "logo" | "store" | "product";
type IntakeImage = { id: string; name: string; url: string; type: AssetType; file: File };

const PLACEHOLDER = "/demo/photos/restaurant-calendar/sushi-counter.jpg";
const LIMIT_BYTES = 6 * 1024 * 1024;

export function SushiBrandIntake() {
  const [stage, setStage] = useState<"details" | "photos" | "profile">("details");
  const [businessName, setBusinessName] = useState("");
  const [location, setLocation] = useState("");
  const [tagline, setTagline] = useState("");
  const [website, setWebsite] = useState("");
  const [language, setLanguage] = useState<"zh" | "en">("en");
  const [tone, setTone] = useState<"warm" | "minimal" | "bright">("minimal");
  const [accent, setAccent] = useState("#2F5149");
  const [images, setImages] = useState<IntakeImage[]>([]);
  const [error, setError] = useState("");
  const [localConfirmed, setLocalConfirmed] = useState(false);
  const imageUrls = useRef(new Set<string>());
  useEffect(() => () => { for (const url of imageUrls.current) URL.revokeObjectURL(url); imageUrls.current.clear(); }, []);

  const logo = images.find((asset) => asset.type === "logo");
  const scenes = images.filter((asset) => asset.type === "store");
  const products = images.filter((asset) => asset.type === "product");
  const canProceed = Boolean(businessName.trim() && location.trim());

  function addImages(event: ChangeEvent<HTMLInputElement>, type: AssetType) {
    setError("");
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    if (files.some((file) => !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > LIMIT_BYTES)) {
      setError("仅支持 JPG、PNG、WebP，单张不超过 6 MB。"); return;
    }
    const max = type === "logo" ? 1 : type === "store" ? 3 : 4;
    const existing = images.filter((asset) => asset.type === type);
    if (type !== "logo" && files.length + existing.length > max) {
      setError(`最多选择 ${max} 张${type === "store" ? "门店" : "商品"}照片。`); return;
    }
    const added = files.slice(0,max).map((file) => {
      const url = URL.createObjectURL(file);
      imageUrls.current.add(url);
      return { id: crypto.randomUUID(), name: file.name, url, type, file };
    });
    if (type === "logo") {
      for (const old of existing) { URL.revokeObjectURL(old.url); imageUrls.current.delete(old.url); }
      setImages((current) => [...current.filter((asset) => asset.type !== "logo"), ...added.slice(0,1)]);
    } else setImages((current) => [...current,...added]);
    setLocalConfirmed(false);
  }
  function removeImage(id: string) {
    const asset = images.find((item) => item.id === id);
    if (asset) { URL.revokeObjectURL(asset.url); imageUrls.current.delete(asset.url); }
    setImages((current) => current.filter((item) => item.id !== id));
    setLocalConfirmed(false);
  }

  const toneNames = { warm: "温暖社区", minimal: "简约精致", bright: "年轻活力" };
  const checklist = [
    { title: "门店名称", complete: Boolean(businessName.trim()) },
    { title: "服务地区", complete: Boolean(location.trim()) },
    { title: "品牌 Logo", complete: Boolean(logo) },
    { title: "门店真实照片", complete: scenes.length > 0 },
    { title: "商品／菜品照片", complete: products.length > 0 },
  ];
  return <main className="ps-brand">
    <header className="ps-brand-nav"><Link href="/for/sushi" className="ps-brand-return"><ArrowLeft size={17}/> 返回寿司店专属页面</Link><Link href="/" className="ps-brand-logo">PoStory<span>.</span></Link><span className="ps-brand-nav-note">SUSHI BRAND STUDIO</span></header>
    <div className="ps-brand-intro">
      <span className="ps-vertical-eyebrow">YOUR BRAND, YOUR CONTENT</span>
      <h1>先认识你的店，<br/><em>再认真讲好它的故事。</em></h1>
      <p>建立一份专属于寿司店的品牌档案。未来每一张图、每一条文案，都可以从同一份确认过的品牌信息出发。</p>
    </div>
    <nav className="ps-brand-steps" aria-label="品牌建档步骤">
      {[["details","01","门店信息"],["photos","02","真实素材"],["profile","03","品牌预览"]].map(([key,index,label])=><button key={key} type="button" className={stage === key ? "active" : ""} onClick={() => { if (key === "details" || canProceed) {setStage(key as typeof stage);setError("");} }} disabled={key !== "details" && !canProceed}><span>{index}</span>{label}</button>)}
    </nav>
    {stage === "details" && <section className="ps-brand-panel">
      <div className="ps-brand-panel-head"><span className="ps-vertical-eyebrow">01 / THE BASICS</span><h2>品牌从真实的名字开始。</h2><p>以下信息用于预览品牌档案。请填写门店真实资料，系统不会擅自生成菜单价格或营业承诺。</p></div>
      <div className="ps-brand-fields">
        <label>门店名称 <b>必填</b><input maxLength={120} placeholder="例如 Sakura Sushi" value={businessName} onChange={(e)=>{setBusinessName(e.target.value);setLocalConfirmed(false);}}/></label>
        <label>所在城市或服务地区 <b>必填</b><input maxLength={160} placeholder="例如 Toronto, Ontario" value={location} onChange={(e)=>{setLocation(e.target.value);setLocalConfirmed(false);}}/></label>
        <label>一句话介绍（选填）<input maxLength={150} placeholder="例如 现代日式料理与寿司" value={tagline} onChange={(e)=>setTagline(e.target.value)}/></label>
        <label>网站或社媒主页（选填）<input maxLength={240} placeholder="例如 https://..." value={website} onChange={(e)=>setWebsite(e.target.value)}/></label>
        <label>主要内容语言<select value={language} onChange={(e)=>setLanguage(e.target.value as "zh"|"en")}><option value="en">English</option><option value="zh">简体中文</option></select></label>
        <label>希望呈现的品牌感觉<select value={tone} onChange={(e)=>setTone(e.target.value as typeof tone)}><option value="minimal">简约精致</option><option value="warm">温暖社区</option><option value="bright">年轻活力</option></select></label>
      </div>
      <div className="ps-brand-panel-actions"><span>这些信息尚未提交给服务器。</span><button type="button" disabled={!canProceed} className="ps-vertical-button" onClick={()=>setStage("photos")}>下一步 · 上传素材 <ArrowRight size={17}/></button></div>
    </section>}
    {stage === "photos" && <section className="ps-brand-panel">
      <div className="ps-brand-panel-head"><span className="ps-vertical-eyebrow">02 / REAL MATERIALS</span><h2>我们更相信真实的作品。</h2><p>优先上传你的 Logo、门店实景和真实菜品照片。原图在这个预览版本中只在当前浏览器显示，不会自动上传、修图或发布。</p></div>
      {error && <p role="alert" className="ps-brand-error">{error}</p>}
      <div className="ps-brand-upload-grid">
        <UploadGroup title="品牌 Logo" hint="1 张 · 建议透明 PNG" assets={logo?[logo]:[]} type="logo" onUpload={addImages} onRemove={removeImage}/>
        <UploadGroup title="门店与店内实景" hint="最多 3 张 · 门头、座位或吧台" assets={scenes} type="store" onUpload={addImages} onRemove={removeImage}/>
        <UploadGroup title="真实寿司与菜品" hint="最多 4 张 · 主推商品优先" assets={products} type="product" onUpload={addImages} onRemove={removeImage}/>
      </div>
      <div className="ps-brand-panel-actions"><button type="button" className="ps-brand-secondary" onClick={()=>setStage("details")}>上一步</button><button className="ps-vertical-button" type="button" onClick={()=>setStage("profile")}>查看我的品牌档案 <ArrowRight size={17}/></button></div>
    </section>}
    {stage === "profile" && <section className="ps-brand-panel ps-brand-review">
      <div className="ps-brand-panel-head"><span className="ps-vertical-eyebrow">03 / BRAND PROFILE</span><h2>这是你的品牌起点。</h2><p>下面的品牌颜色和风格是可修改的初步建议，不代表已经识别或确认。真实商品价格、营业时间和优惠规则还需要后续核实。</p></div>
      <div className="ps-brand-review-grid">
        <article className={`ps-brand-profile-card tone-${tone}`} style={{"--brand-accent":accent} as CSSProperties}>
          <div className="ps-brand-profile-top"><span>BRAND PROFILE / DRAFT</span><span>01</span></div>
          <div className="ps-brand-profile-wordmark">{logo ? <Image src={logo.url} alt="上传的品牌 Logo" width={70} height={70} unoptimized/> : <span className="ps-brand-profile-mark">{businessName.trim().slice(0,1) || "S"}</span>}<span>{businessName || "Your Sushi Restaurant"}</span></div>
          <div className="ps-brand-profile-image">{scenes[0] ? <Image src={scenes[0].url} alt="门店实景预览" fill sizes="(max-width: 640px) 100vw, 440px" unoptimized/> : <Image src={PLACEHOLDER} alt="示意门店场景，不是你的店铺照片" fill sizes="(max-width: 640px) 100vw, 440px" unoptimized/>}{!scenes.length && <span>示意背景 · 待上传真实门店照片</span>}</div>
          <div className="ps-brand-profile-bottom"><span>{location || "Your neighbourhood"}</span><strong>{tagline || (language === "en" ? "A place for fresh moments." : "让每一餐都有好心情。")}</strong><small>VISUAL DIRECTION · {toneNames[tone]}</small></div>
        </article>
        <div className="ps-brand-review-side">
          <div className="ps-brand-review-box"><h3>建议的品牌方向</h3><p>这是一套起点，而不是自动得出的结论。确认后才可以成为后续内容的正式品牌依据。</p><label>建议主色 <input type="color" aria-label="调整品牌主色" value={accent} onChange={(e)=>{setAccent(e.target.value);setLocalConfirmed(false);}}/><strong>{accent.toUpperCase()}</strong></label><div className="ps-brand-tone"><span>表达风格</span><strong>{toneNames[tone]}</strong></div></div>
          <div className="ps-brand-review-box"><h3>资料完整度</h3><div className="ps-brand-checks">{checklist.map(item=><div key={item.title}><span className={item.complete?"is-ready":""}>{item.complete?<Check size={14}/>:<span>·</span>}</span>{item.title}<small>{item.complete?"已提供":"待补充"}</small></div>)}</div></div>
          <div className="ps-brand-review-box"><h3>真实素材</h3><p>{images.length} 张已选图片，仅保存在浏览器临时预览中；尚未由 PoStory 审核、上传或优化。</p><div className="ps-brand-mini-photos">{products.slice(0,3).map(asset=><Image key={asset.id} src={asset.url} alt={asset.name} width={90} height={75} unoptimized/>)}</div></div>
        </div>
      </div>
      {localConfirmed && <p className="ps-brand-local-confirm" role="status"><Check size={17}/> 已在当前页面标记为“预览确认”。此操作不保存服务器、不会创建正式 Brand Profile 或触发发布。</p>}
      <div className="ps-brand-panel-actions"><button type="button" className="ps-brand-secondary" onClick={()=>setStage("photos")}>返回修改素材</button><button type="button" className="ps-vertical-button" disabled={!canProceed} onClick={()=>setLocalConfirmed(true)}><ShieldCheck size={17}/> 确认当前预览</button></div>
    </section>}
    <aside className="ps-brand-privacy"><LockKeyhole size={17}/><span>当前是首轮建档体验：数据暂存当前页面，刷新会丢失，也不会自动提交。正式的安全上传、客户身份验证、Brand Profile 持久化及审核将在下一开发阶段接入。</span></aside>
    <footer className="ps-brand-footer"><Link href="/for/sushi">Sushi Marketing</Link><span>PoStory · Done-for-You Marketing</span></footer>
  </main>;
}

function UploadGroup({title,hint,assets,type,onUpload,onRemove}:{
  title:string;hint:string;assets:IntakeImage[];type:AssetType;
  onUpload:(e:ChangeEvent<HTMLInputElement>,type:AssetType)=>void;onRemove:(id:string)=>void;
}){
  return <div className="ps-brand-upload-group"><div className="ps-brand-upload-title"><FileImage size={17}/><strong>{title}</strong></div><p>{hint}</p><div className="ps-brand-upload-assets">{assets.map(asset=><div className="ps-brand-upload-thumbnail" key={asset.id}><Image src={asset.url} alt={asset.name} width={120} height={100} unoptimized/><button type="button" onClick={()=>onRemove(asset.id)} aria-label={`移除${asset.name}`}><X size={15}/></button></div>)}<label className="ps-brand-upload-button"><ImagePlus size={23}/><span>添加图片</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple={type!=="logo"} onChange={(e)=>onUpload(e,type)}/></label></div><small><Camera size={13}/> 优先上传未加滤镜的原图</small></div>;
}
