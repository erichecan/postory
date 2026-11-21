"use client";

import Link from "next/link";
import "./sushi-brand.css";
import Image from "next/image";
import { useEffect, useRef, useState, type CSSProperties, type ChangeEvent } from "react";
import { ArrowLeft, ArrowRight, Check, Camera, FileImage, ImagePlus, LockKeyhole, ShieldCheck, X } from "lucide-react";

type AssetType = "logo" | "store" | "product";
type IntakeImage = { id: string; name: string; url: string; type: AssetType; file?: File };

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
  const [revision, setRevision] = useState<number | null>(null);
  const [shops, setShops] = useState<Array<{id:string;name:string;industry:string}>>([]);
  const [shopId, setShopId] = useState("");
  const [newShopName, setNewShopName] = useState("");
  const [creatingShop, setCreatingShop] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingDraft, setLoadingDraft] = useState(true);
  const [loginRequired, setLoginRequired] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const imageUrls = useRef(new Set<string>());
  useEffect(() => () => { for (const url of imageUrls.current) URL.revokeObjectURL(url); imageUrls.current.clear(); }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadShops() {
      try {
        const response = await fetch("/api/content-engine/shops", { cache:"no-store" });
        if (cancelled) return;
        if (response.status===401) {setLoginRequired(true);return;}
        if (!response.ok) throw new Error("shops_failed");
        const data = await response.json() as {shops:Array<{id:string;name:string;industry:string}>};
        if (cancelled) return;
        const sushiShops=data.shops.filter(shop=>shop.industry==="sushi");
        setShops(sushiShops);
        const requested = new URLSearchParams(window.location.search).get("shop");
        const chosen=sushiShops.find(shop=>shop.id===requested)||sushiShops[0];
        if (chosen) setShopId(chosen.id);
      } catch {
        if (!cancelled) setError("无法读取门店列表，请检查账号登录状态或网络。");
      } finally {if (!cancelled) setLoadingDraft(false);}
    }
    void loadShops();
    return ()=>{cancelled=true;};
  }, []);

  useEffect(() => {
    if (!shopId) return;
    let cancelled=false;
    async function loadDraft() {
      setLoadingDraft(true);
      try{
        const response=await fetch(`/api/content-engine/brand?shopId=${encodeURIComponent(shopId)}`,{cache:"no-store"});
        if (!response.ok) throw new Error("load_failed");
        const data=await response.json() as {profile?:{
          revision:number;businessName:string;serviceArea:string;locale:"zh"|"en";
          tagline:string;website:string;voice:"minimal"|"warm"|"bright";accent:string;
          assets:Array<{id:string;kind:AssetType;url:string}>;
        }|null};
        if(cancelled) return;
        setRevision(null);setStage("details");setSaveMessage("");
        setBusinessName("");setLocation("");setTagline("");setWebsite("");setTone("minimal");setLanguage("en");setAccent("#2F5149");setImages([]);
        if(!data.profile)return;
        setBusinessName(data.profile.businessName);
        setLocation(data.profile.serviceArea);
        setLanguage(data.profile.locale);
        setTagline(data.profile.tagline);
        setWebsite(data.profile.website);
        setTone(data.profile.voice);
        setAccent(data.profile.accent);
        setRevision(data.profile.revision);
        setImages(data.profile.assets.map(a=>({id:a.id,name:"已保存素材",url:a.url,type:a.kind})));
        setSaveMessage(`已恢复第 ${data.profile.revision} 版草稿。`);
      } catch { if(!cancelled)setError("无法恢复该门店的品牌档案。"); }
      finally {if(!cancelled)setLoadingDraft(false);}
    }
    void loadDraft();
    return ()=>{cancelled=true;};
  },[shopId]);

  async function createShop(){
    const name=newShopName.trim();
    if (!name || creatingShop)return;
    setCreatingShop(true);setError("");
    try {
      const response=await fetch("/api/content-engine/shops",{
        method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({name,industry:"sushi"})
      });
      const result=await response.json() as {shop?:{id:string;name:string;industry:string};error?:string};
      if(!response.ok||!result.shop)throw new Error(result.error||"create_failed");
      setShops(current=>[...current,result.shop!]);
      setNewShopName("");
      setShopId(result.shop.id);
    }catch{setError("创建门店失败，请检查名称或门店数量限制。");}
    finally{setCreatingShop(false);}
  }

  async function saveDraft() {
    if (!canProceed || saving || loadingDraft || loginRequired || !shopId) return;
    setSaving(true); setError(""); setSaveMessage("");
    try {
      const uploaded = await Promise.all(images.map(async asset => {
        if (!asset.file) return { id:asset.id,url:asset.url,name:asset.name,type:asset.type };
        const form = new FormData();
        form.append("shopId",shopId);
        form.append("kind",asset.type);
        form.append("file",asset.file);
        const response = await fetch("/api/content-engine/brand/assets",{method:"POST",body:form});
        const result = await response.json() as { id?:string; url?:string; error?:string };
        if (!response.ok || !result.id || !result.url) throw new Error(result.error || "upload_failed");
        return { id:result.id,url:result.url,name:asset.name,type:asset.type };
      }));
      const response = await fetch("/api/content-engine/brand",{
        method:"PUT",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          shopId,businessName,serviceArea:location,locale:language,tagline,website,
          voice:tone,accent,assetIds:uploaded.map(a=>a.id),expectedRevision:revision
        }),
      });
      const data = await response.json() as {profile?:{revision:number};error?:string};
      if (!response.ok || !data.profile) throw new Error(data.error || "save_failed");
      for (const asset of images) if (asset.file) { URL.revokeObjectURL(asset.url); imageUrls.current.delete(asset.url); }
      setImages(uploaded);
      setRevision(data.profile.revision);
      setSaveMessage(`品牌档案第 ${data.profile.revision} 版草稿已安全保存。后续仍需要商家和设计人员确认，才能用于正式发布。`);
    } catch (cause) {
      const detail = cause instanceof Error ? cause.message : "save_failed";
      setError(detail === "revision_conflict" ? "其他页面已修改品牌档案，请刷新后再保存。" :
        detail === "invalid_asset_ownership" ? "素材权限检查失败，请重新选择图片。" :
        detail === "login_required" ? "请先登录后再保存。" : "保存未成功，已保留当前页面中的内容，请稍后重试。");
    } finally { setSaving(false); }
  }

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
setSaveMessage("");
  }
  function removeImage(id: string) {
    const asset = images.find((item) => item.id === id);
    if (asset) { URL.revokeObjectURL(asset.url); imageUrls.current.delete(asset.url); }
    setImages((current) => current.filter((item) => item.id !== id));
    setSaveMessage("");
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
    {loginRequired && <div className="ps-brand-auth-notice"><ShieldCheck size={18}/> 你可以先体验品牌档案预览；需要 <Link href="/login?next=%2Ffor%2Fsushi%2Fbrand">登录 PoStory</Link> 才能安全保存并跨设备恢复资料。</div>}
    {loadingDraft && <div className="ps-brand-auth-notice">正在检查已保存的品牌档案…</div>}
    {!loginRequired && <section className="ps-brand-shop-selector" aria-label="选择寿司门店">
      <div><strong>选择需要建立档案的门店</strong><span>每家门店的 Logo、照片与品牌资料互不共享</span></div>
      <select aria-label="当前门店" value={shopId} onChange={e=>{setShopId(e.target.value);setError("");}} disabled={loadingDraft||saving}>
        {!shopId&&<option value="">请选择或新建门店</option>}
        {shops.map(shop=><option key={shop.id} value={shop.id}>{shop.name}</option>)}
      </select>
      <div className="ps-brand-shop-create"><input aria-label="新门店名称" maxLength={120} placeholder="输入另一家寿司店名称" value={newShopName} onChange={e=>setNewShopName(e.target.value)}/><button type="button" disabled={!newShopName.trim()||creatingShop} onClick={()=>void createShop()}>{creatingShop?"创建中…":"添加门店"}</button></div>
    </section>}
    <nav className="ps-brand-steps" aria-label="品牌建档步骤">
      {[["details","01","门店信息"],["photos","02","真实素材"],["profile","03","品牌预览"]].map(([key,index,label])=><button key={key} type="button" className={stage === key ? "active" : ""} onClick={() => { if (key === "details" || canProceed) {setStage(key as typeof stage);setError("");} }} disabled={key !== "details" && (!canProceed || (!loginRequired && !shopId))}><span>{index}</span>{label}</button>)}
    </nav>
    {stage === "details" && <section className="ps-brand-panel">
      <div className="ps-brand-panel-head"><span className="ps-vertical-eyebrow">01 / THE BASICS</span><h2>品牌从真实的名字开始。</h2><p>以下信息用于预览品牌档案。请填写门店真实资料，系统不会擅自生成菜单价格或营业承诺。</p></div>
      <div className="ps-brand-fields">
        <label>门店名称 <b>必填</b><input maxLength={120} placeholder="例如 Sakura Sushi" value={businessName} onChange={(e)=>{setBusinessName(e.target.value);setSaveMessage("");}}/></label>
        <label>所在城市或服务地区 <b>必填</b><input maxLength={160} placeholder="例如 Toronto, Ontario" value={location} onChange={(e)=>{setLocation(e.target.value);setSaveMessage("");}}/></label>
        <label>一句话介绍（选填）<input maxLength={150} placeholder="例如 现代日式料理与寿司" value={tagline} onChange={(e)=>setTagline(e.target.value)}/></label>
        <label>网站或社媒主页（选填）<input maxLength={240} placeholder="例如 https://..." value={website} onChange={(e)=>setWebsite(e.target.value)}/></label>
        <label>主要内容语言<select value={language} onChange={(e)=>setLanguage(e.target.value as "zh"|"en")}><option value="en">English</option><option value="zh">简体中文</option></select></label>
        <label>希望呈现的品牌感觉<select value={tone} onChange={(e)=>setTone(e.target.value as typeof tone)}><option value="minimal">简约精致</option><option value="warm">温暖社区</option><option value="bright">年轻活力</option></select></label>
      </div>
      <div className="ps-brand-panel-actions"><span>在确认保存草稿前，这些信息不会上传。</span><button type="button" disabled={!canProceed || (!loginRequired && !shopId)} className="ps-vertical-button" onClick={()=>setStage("photos")}>下一步 · 上传素材 <ArrowRight size={17}/></button></div>
    </section>}
    {stage === "photos" && <section className="ps-brand-panel">
      <div className="ps-brand-panel-head"><span className="ps-vertical-eyebrow">02 / REAL MATERIALS</span><h2>我们更相信真实的作品。</h2><p>优先上传你的 Logo、门店实景和真实菜品照片。选好的素材会先在浏览器预览。只有点击保存草稿且已登录后，才会通过私有接口上传；不会自动修图或发布。</p></div>
      {error && <p role="alert" className="ps-brand-error">{error}</p>}
      <div className="ps-brand-upload-grid">
        <UploadGroup title="品牌 Logo" hint="1 张 · 建议透明 PNG" assets={logo?[logo]:[]} type="logo" onUpload={addImages} onRemove={removeImage}/>
        <UploadGroup title="门店与店内实景" hint="最多 3 张 · 门头、座位或吧台" assets={scenes} type="store" onUpload={addImages} onRemove={removeImage}/>
        <UploadGroup title="真实寿司与菜品" hint="最多 4 张 · 主推商品优先" assets={products} type="product" onUpload={addImages} onRemove={removeImage}/>
      </div>
      <div className="ps-brand-panel-actions"><button type="button" className="ps-brand-secondary" onClick={()=>setStage("details")}>上一步</button><button className="ps-vertical-button" type="button" onClick={()=>setStage("profile")}>查看我的品牌档案 <ArrowRight size={17}/></button></div>
    </section>}
    {stage === "profile" && <section className="ps-brand-panel ps-brand-review">
      <div className="ps-brand-panel-head"><span className="ps-vertical-eyebrow">03 / BRAND PROFILE</span><h2>这是你的品牌起点。</h2><p>下面的品牌颜色和风格是可修改的初步建议，尚未经过 AI 自动识别或人工确认。真实商品价格、营业时间和优惠规则还需要后续核实。</p></div>
      <div className="ps-brand-review-grid">
        <article className={`ps-brand-profile-card tone-${tone}`} style={{"--brand-accent":accent} as CSSProperties}>
          <div className="ps-brand-profile-top"><span>BRAND PROFILE / DRAFT</span><span>01</span></div>
          <div className="ps-brand-profile-wordmark">{logo ? <Image src={logo.url} alt="上传的品牌 Logo" width={70} height={70} unoptimized/> : <span className="ps-brand-profile-mark">{businessName.trim().slice(0,1) || "S"}</span>}<span>{businessName || "Your Sushi Restaurant"}</span></div>
          <div className="ps-brand-profile-image">{scenes[0] ? <Image src={scenes[0].url} alt="门店实景预览" fill sizes="(max-width: 640px) 100vw, 440px" unoptimized/> : <Image src={PLACEHOLDER} alt="示意门店场景，不是你的店铺照片" fill sizes="(max-width: 640px) 100vw, 440px" unoptimized/>}{!scenes.length && <span>示意背景 · 待上传真实门店照片</span>}</div>
          <div className="ps-brand-profile-bottom"><span>{location || "Your neighbourhood"}</span><strong>{tagline || (language === "en" ? "A place for fresh moments." : "让每一餐都有好心情。")}</strong><small>VISUAL DIRECTION · {toneNames[tone]}</small></div>
        </article>
        <div className="ps-brand-review-side">
          <div className="ps-brand-review-box"><h3>建议的品牌方向</h3><p>这是一套起点，而不是自动得出的结论。确认后才可以成为后续内容的正式品牌依据。</p><label>建议主色 <input type="color" aria-label="调整品牌主色" value={accent} onChange={(e)=>{setAccent(e.target.value);setSaveMessage("");}}/><strong>{accent.toUpperCase()}</strong></label><div className="ps-brand-tone"><span>表达风格</span><strong>{toneNames[tone]}</strong></div></div>
          <div className="ps-brand-review-box"><h3>资料完整度</h3><div className="ps-brand-checks">{checklist.map(item=><div key={item.title}><span className={item.complete?"is-ready":""}>{item.complete?<Check size={14}/>:<span>·</span>}</span>{item.title}<small>{item.complete?"已提供":"待补充"}</small></div>)}</div></div>
          <div className="ps-brand-review-box"><h3>真实素材</h3><p>{images.length} 张已选择或已保存，未经 PoStory 人工审核或优化。</p><div className="ps-brand-mini-photos">{products.slice(0,3).map(asset=><Image key={asset.id} src={asset.url} alt={asset.name} width={90} height={75} unoptimized/>)}</div></div>
        </div>
      </div>
      {saveMessage && <p className="ps-brand-local-confirm" role="status"><Check size={17}/>{saveMessage}</p>}{error && <p className="ps-brand-error" role="alert">{error}</p>}
      <div className="ps-brand-panel-actions"><button type="button" className="ps-brand-secondary" onClick={()=>setStage("photos")}>返回修改素材</button>{loginRequired ? <Link className="ps-vertical-button" href="/login?next=%2Ffor%2Fsushi%2Fbrand"><ShieldCheck size={17}/> 登录后保存</Link> : <button type="button" className="ps-vertical-button" disabled={!canProceed || !shopId || saving || loadingDraft} onClick={()=>void saveDraft()}><ShieldCheck size={17}/>{saving ? "正在安全保存…" : "保存品牌档案草稿"}</button>}</div>
    </section>}
    <aside className="ps-brand-privacy"><LockKeyhole size={17}/><span>品牌资料在登录、选择门店并点击“保存品牌档案草稿”后上传到门店专属的私有存储。保存的是未审核草稿，不等于商家授权图片使用、正式确认品牌规范或批准发布。</span></aside>
    <footer className="ps-brand-footer"><Link href="/for/sushi">Sushi Marketing</Link><span>PoStory · Done-for-You Marketing</span></footer>
  </main>;
}

function UploadGroup({title,hint,assets,type,onUpload,onRemove}:{
  title:string;hint:string;assets:IntakeImage[];type:AssetType;
  onUpload:(e:ChangeEvent<HTMLInputElement>,type:AssetType)=>void;onRemove:(id:string)=>void;
}){
  return <div className="ps-brand-upload-group"><div className="ps-brand-upload-title"><FileImage size={17}/><strong>{title}</strong></div><p>{hint}</p><div className="ps-brand-upload-assets">{assets.map(asset=><div className="ps-brand-upload-thumbnail" key={asset.id}><Image src={asset.url} alt={asset.name} width={120} height={100} unoptimized/><button type="button" onClick={()=>onRemove(asset.id)} aria-label={`移除${asset.name}`}><X size={15}/></button></div>)}<label className="ps-brand-upload-button"><ImagePlus size={23}/><span>添加图片</span><input type="file" accept="image/jpeg,image/png,image/webp" multiple={type!=="logo"} onChange={(e)=>onUpload(e,type)}/></label></div><small><Camera size={13}/> 优先上传未加滤镜的原图</small></div>;
}
