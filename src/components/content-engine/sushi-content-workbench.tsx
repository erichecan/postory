"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";

type Format = "square" | "portrait" | "story";
type Template = "food-editorial" | "product-feature" | "local-story";
type ApprovedBrand = {
  approvalEventId:string;revision:number;businessName:string;
  assets:Array<{id:string;kind:string;url:string}>;
};
const TEMPLATES: Array<{id:Template;label:string}> = [
  {id:"food-editorial",label:"餐饮编辑风"},
  {id:"product-feature",label:"菜品主推"},
  {id:"local-story",label:"本地门店故事"},
];
const FORMATS: Array<{id:Format;label:string}> = [
  {id:"square",label:"1:1 正方形"},
  {id:"portrait",label:"4:5 竖版"},
  {id:"story",label:"9:16 Story"},
];

export function SushiContentWorkbench() {
  const [shops,setShops]=useState<Array<{id:string;name:string;industry:string}>>([]);
  const [shopId,setShopId]=useState("");
  const [brand,setBrand]=useState<ApprovedBrand|null>(null);
  const [assetId,setAssetId]=useState("");
  const [format,setFormat]=useState<Format>("portrait");
  const [template,setTemplate]=useState<Template>("food-editorial");
  const [headline,setHeadline]=useState("");
  const [subheadline,setSubheadline]=useState("");
  const [cta,setCta]=useState("View menu");
  const [confirmed,setConfirmed]=useState(false);
  const [busy,setBusy]=useState(false);
  const [error,setError]=useState("");
  const [notice,setNotice]=useState("");
  const [preview,setPreview]=useState("");
  const [approvalId,setApprovalId]=useState("");
  const [blocked,setBlocked]=useState(false);
  const [loginRequired,setLoginRequired]=useState(false);
  const previewUrl=useRef("");

  useEffect(()=>{
    let cancelled=false;
    void (async()=>{
      try {
        const response=await fetch("/api/content-engine/shops",{cache:"no-store"});
        if(cancelled)return;
        if(response.status===401){setLoginRequired(true);return;}
        if(response.status===503){setBlocked(true);return;}
        if(!response.ok)throw new Error("shops_failed");
        const data=await response.json() as {shops:Array<{id:string;name:string;industry:string}>};
        if(cancelled)return;
        const sushi=data.shops.filter(shop=>shop.industry==="sushi");
        setShops(sushi);
        const requested=new URLSearchParams(window.location.search).get("shop");
        setShopId(sushi.find(shop=>shop.id===requested)?.id||sushi[0]?.id||"");
      }catch{if(!cancelled)setError("门店列表读取失败，请刷新重试。");}
    })();
    return()=>{cancelled=true;};
  },[]);

  useEffect(()=>{
    let cancelled=false;
    setBrand(null);setAssetId("");setConfirmed(false);setApprovalId("");setNotice("");
    if(!shopId)return;
    void(async()=>{
      try{
        const response=await fetch(`/api/content-engine/brand/approved?shopId=${encodeURIComponent(shopId)}`,{cache:"no-store"});
        if(cancelled)return;
        if(response.status===404){setNotice("尚无已批准的 Brand Profile。请先完成品牌建档和商家审核。");return;}
        if(!response.ok)throw new Error("load_failed");
        const data=await response.json() as ApprovedBrand;
        if(cancelled)return;
        setBrand(data);
        setAssetId(data.assets.find(a=>a.kind==="product")?.id||data.assets[0]?.id||"");
      }catch{if(!cancelled)setError("读取已批准品牌资料失败。");}
    })();
    return()=>{cancelled=true;};
  },[shopId]);

  function clearApproval(){
    setConfirmed(false);setApprovalId("");setNotice("");
    if(previewUrl.current)URL.revokeObjectURL(previewUrl.current);
    previewUrl.current="";setPreview("");
  }
  useEffect(()=>()=>{if(previewUrl.current)URL.revokeObjectURL(previewUrl.current);},[]);

  const canPreview=!!(brand&&assetId&&headline.trim()&&headline.length<=55 &&
    subheadline.length<=62&&cta.length<=28&&!busy);
  async function makePreview(){
    if(!canPreview)return;
    setBusy(true);setError("");clearApproval();
    try{
      const response=await fetch("/api/content-engine/brand/preview",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({shopId,assetId,template,format,headline,subheadline,cta}),
      });
      if(!response.ok)throw new Error("preview_failed");
      const url=URL.createObjectURL(await response.blob());
      previewUrl.current=url;setPreview(url);
      setNotice("这是带水印的草稿预览。请逐项确认图片与全部文案后，再批准正式内容。");
    }catch{setError("图片预览失败。可尝试缩短标题或更换布局。");}
    finally{setBusy(false);}
  }

  async function approve(){
    if(!brand||!canPreview||!preview||!confirmed)return;
    setBusy(true);setError("");setApprovalId("");
    try{
      const response=await fetch("/api/content-engine/content/approved",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          shopId,brandApprovalEventId:brand.approvalEventId,brandRevision:brand.revision,
          assetId,format,template,headline,subheadline,cta,confirmExactContent:true,
        }),
      });
      const data=await response.json() as {contentApprovalId?:string;error?:string};
      if(!response.ok||!data.contentApprovalId)throw new Error(data.error||"approval_failed");
      setApprovalId(data.contentApprovalId);
      setNotice("商家已确认这组具体文案、图片和版式，可以导出正式 PNG。此操作不会自动发布社媒。");
    }catch{setError("内容批准失败。请核对品牌审批版本和图片权限，必要时刷新页面。");}
    finally{setBusy(false);}
  }

  async function exportApproved(){
    if(!approvalId||busy)return;
    setBusy(true);setError("");
    try{
      const response=await fetch(`/api/content-engine/content/approved?contentApprovalId=${encodeURIComponent(approvalId)}`,{cache:"no-store"});
      if(!response.ok)throw new Error("export_failed");
      const blob=await response.blob();
      const url=URL.createObjectURL(blob);
      const link=document.createElement("a");link.href=url;
      link.download="postory-approved.png";
      document.body.appendChild(link);link.click();link.remove();
      URL.revokeObjectURL(url);
      setNotice("已请求下载正式 PNG；这不是社媒发布操作。");
    }catch{setError("导出失败，可能是品牌审批或素材已更新，请重新审核。");}
    finally{setBusy(false);}
  }

  const photo=brand?.assets.find(a=>a.id===assetId);
  return <main className="mx-auto max-w-6xl px-5 py-10">
    <div className="mb-8 flex flex-wrap items-center justify-between gap-3">
      <Link href="/for/sushi/brand" className="text-sm underline">← 返回 Brand Profile</Link>
      <span className="text-xs tracking-widest text-neutral-500">POSTORY · CONTENT WORKBENCH</span>
    </div>
    <h1 className="mb-2 text-3xl font-bold">寿司店内容制作与审批</h1>
    <p className="mb-8 max-w-2xl text-sm text-neutral-600">只使用已批准的品牌资料与真实授权图片。先预览，再由商家确认具体文案，最后导出正式图片。目前不支持含价格或促销规则的正式导出。</p>
    {blocked&&<p role="status" className="mb-5 rounded-lg border p-4">Content Engine 尚未启用，生产数据库和存储验收完成前无法使用工作台。</p>}
    {loginRequired&&<p role="status" className="mb-5 rounded-lg border p-4">请先 <Link className="underline" href="/login?next=%2Ffor%2Fsushi%2Fcontent">登录</Link> 以访问你的门店资料。</p>}
    {error&&<p role="alert" className="mb-5 rounded-lg border border-red-300 p-4 text-red-700">{error}</p>}
    {notice&&<p role="status" className="mb-5 rounded-lg border p-4">{notice}</p>}
    <div className="grid gap-8 md:grid-cols-2">
      <section className="space-y-5 rounded-xl border p-5" aria-label="内容编辑">
        <label className="block text-sm font-medium">选择门店
          <select className="mt-2 w-full rounded-md border p-3" value={shopId} onChange={e=>{clearApproval();setShopId(e.target.value);}}>
            {!shops.length&&<option value="">请选择门店</option>}
            {shops.map(shop=><option key={shop.id} value={shop.id}>{shop.name}</option>)}
          </select>
        </label>
        {brand&&<p className="text-sm text-neutral-600">已批准品牌：{brand.businessName} · 第 {brand.revision} 版</p>}
        <label className="block text-sm font-medium">真实素材
          <select className="mt-2 w-full rounded-md border p-3" value={assetId} onChange={e=>{clearApproval();setAssetId(e.target.value);}}>
            {!brand?.assets.length&&<option value="">暂无已授权图片</option>}
            {brand?.assets.map((asset,i)=><option key={asset.id} value={asset.id}>{asset.kind} · 图片 {i+1}</option>)}
          </select>
        </label>
        {photo&&<div className="relative h-44 w-full overflow-hidden rounded-lg bg-neutral-100"><Image src={photo.url} alt="已批准的门店素材" fill sizes="(max-width: 768px) 100vw, 450px" unoptimized className="object-contain"/></div>}
        <label className="block text-sm font-medium">版式
          <select className="mt-2 w-full rounded-md border p-3" value={template} onChange={e=>{clearApproval();setTemplate(e.target.value as Template);}}>
            {TEMPLATES.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">尺寸
          <select className="mt-2 w-full rounded-md border p-3" value={format} onChange={e=>{clearApproval();setFormat(e.target.value as Format);}}>
            {FORMATS.map(item=><option key={item.id} value={item.id}>{item.label}</option>)}
          </select>
        </label>
        <label className="block text-sm font-medium">主标题（55 字以内）
          <input className="mt-2 w-full rounded-md border p-3" maxLength={55} value={headline} onChange={e=>{clearApproval();setHeadline(e.target.value);}} placeholder="A fresh sushi lunch"/>
        </label>
        <label className="block text-sm font-medium">副标题（62 字以内）
          <input className="mt-2 w-full rounded-md border p-3" maxLength={62} value={subheadline} onChange={e=>{clearApproval();setSubheadline(e.target.value);}} placeholder="Made with care"/>
        </label>
        <label className="block text-sm font-medium">行动文案（28 字以内）
          <input className="mt-2 w-full rounded-md border p-3" maxLength={28} value={cta} onChange={e=>{clearApproval();setCta(e.target.value);}}/>
        </label>
        <button type="button" className="w-full rounded-lg bg-neutral-900 p-3 font-medium text-white disabled:opacity-40" disabled={!canPreview} onClick={()=>void makePreview()}>{busy?"正在处理…":"生成带水印预览"}</button>
      </section>
      <section className="space-y-5 rounded-xl border p-5" aria-label="客户审核与导出">
        <h2 className="text-xl font-semibold">预览与商家确认</h2>
        {preview?<div className="relative overflow-hidden rounded-lg bg-neutral-100"><Image src={preview} width={540} height={675} alt="待审核带水印的内容预览" unoptimized className="h-auto w-full"/></div>:
          <div className="grid min-h-64 place-content-center rounded-lg border border-dashed p-5 text-center text-sm text-neutral-500">选择素材和文案后生成预览</div>}
        <label className="flex items-start gap-3 text-sm">
          <input type="checkbox" className="mt-1" checked={confirmed} disabled={!preview||busy||!!approvalId} onChange={e=>setConfirmed(e.target.checked)}/>
          <span>我代表门店确认这张图所使用的真实照片、标题、副标题及行动文案准确且可用于商业宣传。图片中没有未核实的价格或优惠承诺。</span>
        </label>
        <button type="button" className="w-full rounded-lg border p-3 font-medium disabled:opacity-40" disabled={!preview||!confirmed||busy||!!approvalId} onClick={()=>void approve()}>批准这份具体内容</button>
        <button type="button" className="w-full rounded-lg bg-neutral-900 p-3 font-medium text-white disabled:opacity-40" disabled={!approvalId||busy} onClick={()=>void exportApproved()}>导出正式 PNG</button>
        <p className="text-xs text-neutral-500">修改任何内容后必须重新预览和确认。导出不会创建排期或发布帖子。</p>
      </section>
    </div>
  </main>;
}
