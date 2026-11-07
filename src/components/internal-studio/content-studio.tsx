"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowDownToLine, ArrowLeft, BadgeCheck, CalendarDays, CheckCircle2,
  Clapperboard, FileImage, ImagePlus, Images, LayoutDashboard, LoaderCircle,
  RotateCcw, ScanSearch, ShieldCheck, Sparkles, UploadCloud, WandSparkles,
} from "lucide-react";
import { Logo } from "@/components/brand/logo";
import "./studio.css";

type Frame = { time: number; dataUrl: string; source: string };
type Product = {
  id: string; name: string; category: string; features: string[];
  frameIndex: number; bbox: number[]; caution: string; angles: string[];
};
type AnalyzeResponse = { summary: string; products: Product[] };
type Stage = "upload" | "products" | "refine" | "next";
type Ratio = "1:1" | "4:5" | "16:9";

const ANALYSIS_BATCH_SIZE = 8;

const STEPS: { id: Stage; label: string; detail: string; Icon: typeof UploadCloud }[] = [
  { id: "upload", label: "素材上传", detail: "导入图片或视频", Icon: UploadCloud },
  { id: "products", label: "商品识别", detail: "逐帧查找商品", Icon: ScanSearch },
  { id: "refine", label: "产品精修", detail: "裁切、标准尺寸", Icon: ImagePlus },
  { id: "next", label: "内容策划", detail: "下一阶段", Icon: CalendarDays },
];

function waitEvent(target: HTMLVideoElement, name: string, ms: number) {
  return new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(() => { cleanup(); reject(new Error("视频解码等待超时，请换用 MP4/H.264 视频。")); }, ms);
    const success = () => { cleanup(); resolve(); };
    const fail = () => { cleanup(); reject(new Error("浏览器无法读取该视频编码，请尝试 MP4/H.264。")); };
    const cleanup = () => {
      clearTimeout(timer);
      target.removeEventListener(name, success);
      target.removeEventListener("error", fail);
    };
    target.addEventListener(name, success, { once: true });
    target.addEventListener("error", fail, { once: true });
  });
}

function canvasFromImage(image: CanvasImageSource, width: number, height: number) {
  const scale = Math.min(1, 960 / Math.max(width, height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  canvas.getContext("2d")?.drawImage(image, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.84);
}

async function imageFrame(file: File): Promise<Frame> {
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    const loaded = new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("无法读取图片：" + file.name));
    });
    img.src = url;
    await loaded;
    return { time: 0, source: file.name, dataUrl: canvasFromImage(img, img.naturalWidth, img.naturalHeight) };
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function videoFrames(file: File): Promise<Frame[]> {
  const url = URL.createObjectURL(file);
  const video = document.createElement("video");
  video.preload = "auto";
  video.muted = true;
  video.playsInline = true;
  try {
    const metadataReady = waitEvent(video, "loadedmetadata", 22000);
    video.src = url;
    video.load();
    await metadataReady;
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) throw new Error("无法识别视频时长。");
    const fractions = duration < 3 ? [0.2, 0.6] : [0.04, 0.2, 0.38, 0.56, 0.74, 0.92];
    const frames: Frame[] = [];
    for (const fraction of fractions) {
      const time = Math.min(Math.max(0, duration * fraction), Math.max(0, duration - 0.05));
      const seeked = waitEvent(video, "seeked", 15000);
      video.currentTime = time;
      await seeked;
      if (!video.videoWidth || !video.videoHeight) continue;
      frames.push({ time, source: file.name, dataUrl: canvasFromImage(video, video.videoWidth, video.videoHeight) });
    }
    if (!frames.length) throw new Error("未能从视频提取画面，请换用 MP4/H.264。");
    return frames;
  } finally {
    video.pause();
    video.removeAttribute("src");
    video.load();
    URL.revokeObjectURL(url);
  }
}

function downloadUrl(url: string, filename: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
}

async function cropFrame(dataUrl: string, box: number[], ratio: Ratio) {
  const img = new Image();
  const loaded = new Promise<void>((resolve, reject) => {
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("无法读取裁切图片"));
  });
  img.src = dataUrl;
  await loaded;
  const sourceWidth = img.naturalWidth;
  const sourceHeight = img.naturalHeight;
  const sx = Math.max(0, Math.round(sourceWidth * box[0] / 100));
  const sy = Math.max(0, Math.round(sourceHeight * box[1] / 100));
  const sw = Math.max(1, Math.min(sourceWidth - sx, Math.round(sourceWidth * box[2] / 100)));
  const sh = Math.max(1, Math.min(sourceHeight - sy, Math.round(sourceHeight * box[3] / 100)));
  const targetRatio = ratio === "16:9" ? 16 / 9 : ratio === "4:5" ? 4 / 5 : 1;
  const width = ratio === "16:9" ? 1280 : ratio === "4:5" ? 800 : 1000;
  const height = Math.round(width / targetRatio);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("浏览器不支持 Canvas");
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, width, height);
  const scale = Math.min((width * 0.92) / sw, (height * 0.92) / sh);
  const destWidth = sw * scale;
  const destHeight = sh * scale;
  ctx.drawImage(img, sx, sy, sw, sh, (width - destWidth) / 2, (height - destHeight) / 2, destWidth, destHeight);
  return canvas.toDataURL("image/png");
}

export function ContentStudio() {
  const fileInput = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [frames, setFrames] = useState<Frame[]>([]);
  const [busy, setBusy] = useState(false);
  const [busyLabel, setBusyLabel] = useState("");
  const [error, setError] = useState("");
  const [context, setContext] = useState("");
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(0);
  const [box, setBox] = useState<number[]>([10, 10, 80, 80]);
  const [ratio, setRatio] = useState<Ratio>("1:1");
  const [saved, setSaved] = useState<{ name: string; url: string; ratio: Ratio }[]>([]);

  const activeProduct = analysis?.products[selectedProduct];
  const selectedFrame = frames[activeIndex] ?? frames[0];
  const cropBox = useMemo(() => box, [box]);

  function setFilesFromInput(value: FileList | null) {
    if (!value?.length) return;
    const all = Array.from(value);
    if (all.length > 8) { setError("单批最多 8 个文件。"); return; }
    if (all.some(f => !(f.type.startsWith("image/") || f.type.startsWith("video/")))) {
      setError("请上传图片或视频文件。"); return;
    }
    if (all.some(f => f.size > 500 * 1024 * 1024)) {
      setError("单个文件暂限 500 MB；视频只在浏览器本地抽帧。"); return;
    }
    setError("");
    setFiles(all);
    setFrames([]);
    setAnalysis(null);
    setSaved([]);
    setStage("upload");
  }

  async function prepare() {
    if (!files.length) return;
    setBusy(true);
    setBusyLabel("正在准备关键帧提取…");
    setError("");
    try {
      const all: Frame[] = [];
      const videos = files.filter(file => file.type.startsWith("video/"));
      if (videos.some(file => !file.type.includes("mp4") && !file.type.includes("webm") && !file.type.includes("quicktime"))) {
        throw new Error("建议使用 MP4/H.264 视频，其他格式取决于浏览器是否支持。");
      }
      for (const [index, file] of files.entries()) {
        setBusyLabel(`正在处理素材 ${index + 1}/${files.length}…`);
        const next = file.type.startsWith("video/") ? await videoFrames(file) : [await imageFrame(file)];
        all.push(...next);
      }
      setFrames(all);
      setActiveIndex(0);
      setStage("products");
    } catch (e) {
      setError(e instanceof Error ? e.message : "抽帧失败");
    } finally {
      setBusy(false);
    }
  }

  async function analyze() {
    if (!frames.length || busy) return;
    setBusy(true);
    setError("");
    try {
      const batches = Array.from({ length: Math.ceil(frames.length / ANALYSIS_BATCH_SIZE) }, (_, i) => {
        const start = i * ANALYSIS_BATCH_SIZE;
        return { start, frames: frames.slice(start, start + ANALYSIS_BATCH_SIZE) };
      });
      const summaries: string[] = [];
      const products: Product[] = [];
      for (const [batchIndex, batch] of batches.entries()) {
        setBusyLabel(`正在识别第 ${batchIndex + 1}/${batches.length} 批关键帧…`);
        const res = await fetch("/api/internal/content-studio/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ context, frames: batch.frames.map(({ time, dataUrl }) => ({ time, dataUrl })) })
        });
        const data = await res.json() as AnalyzeResponse & { error?: string };
        if (!res.ok) throw new Error(data.error || `第 ${batchIndex + 1} 批商品识别失败`);
        summaries.push(data.summary);
        products.push(...data.products.map((product, productIndex) => ({
          ...product,
          id: `batch-${batchIndex + 1}-${productIndex + 1}`,
          frameIndex: Math.min(frames.length - 1, batch.start + product.frameIndex),
        })));
      }
      setAnalysis({ summary: summaries.join("；"), products });
      if (products.length) {
        setSelectedProduct(0);
        setActiveIndex(products[0].frameIndex);
        setBox(products[0].bbox);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "商品识别失败");
    } finally {
      setBusy(false);
    }
  }

  function pickProduct(index: number) {
    const product = analysis?.products[index];
    if (!product) return;
    setSelectedProduct(index);
    setActiveIndex(product.frameIndex);
    setBox(product.bbox);
    setStage("refine");
  }

  function updateBox(index: number, number: number) {
    setBox(previous => {
      const next = [...previous];
      next[index] = number;
      if (index === 0) next[2] = Math.min(next[2], 100 - number);
      if (index === 1) next[3] = Math.min(next[3], 100 - number);
      if (index === 2) next[0] = Math.min(next[0], 100 - number);
      if (index === 3) next[1] = Math.min(next[1], 100 - number);
      return next;
    });
  }

  async function exportCrop() {
    if (!selectedFrame) return;
    setBusy(true);
    setBusyLabel("正在生成标准展示图…");
    try {
      const url = await cropFrame(selectedFrame.dataUrl, cropBox, ratio);
      const name = (activeProduct?.name || "product").replace(/[^\w\u4e00-\u9fa5-]/g, "-").slice(0, 35);
      downloadUrl(url, "postory-" + name + "-" + ratio.replace(":", "x") + ".png");
      setSaved(prev => [{ name, url, ratio }, ...prev].slice(0, 16));
    } catch (e) {
      setError(e instanceof Error ? e.message : "无法导出");
    } finally {
      setBusy(false);
    }
  }

  function exportReport() {
    const payload = { producedAt: new Date().toISOString(), sources: files.map(f => ({ name: f.name, type: f.type, size: f.size })), frames: frames.map(f => ({ time: f.time, source: f.source })), context, analysis, note: "Browser-only MVP; exported product image crops are not high-resolution source extractions." };
    const objectUrl = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" }));
    downloadUrl(objectUrl, "postory-asset-analysis.json");
    window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
  }

  useEffect(() => {
    if (stage === "refine" && !frames.length) setStage("upload");
  }, [stage, frames.length]);

  return (
    <div className="pcs">
      <aside className="pcs-side">
        <div className="pcs-brand"><Logo href="/" /><span className="pcs-internal-tag">内部生产</span></div>
        <p className="pcs-side-caption">CONTENT STUDIO</p>
        <div className="pcs-nav">
          <Link href="/dashboard" className="pcs-nav-link"><LayoutDashboard size={17} /> 返回仪表盘</Link>
          <span className="pcs-nav-active"><Images size={17}/> 素材工作台</span>
          <span className="pcs-nav-muted"><CalendarDays size={17}/> 30 天内容日历 <small>规划中</small></span>
          <span className="pcs-nav-muted"><Clapperboard size={17}/> 一键剪辑 <small>规划中</small></span>
        </div>
        <div className="pcs-side-bottom"><ShieldCheck size={16}/><span>管理员专用 · 非客户 SaaS</span></div>
      </aside>

      <main className="pcs-main">
        <header className="pcs-header">
          <div><span className="pcs-eyebrow">PRODUCTION WORKSPACE</span><h1>素材到商品，一站式整理</h1>
            <p>识别实拍内容，提取清晰的商品画面，为后续内容策划准备可靠素材。</p></div>
          <span className="pcs-status"><span/> 第一版 · P0 + P1</span>
        </header>

        <div className="pcs-stepper">
          {STEPS.map((item, index) => (
            <button key={item.id} type="button" onClick={() => {
              if (item.id === "upload" || (item.id === "products" && frames.length) || (item.id === "refine" && frames.length) || item.id === "next") setStage(item.id);
            }} className={"pcs-step " + (stage === item.id ? "is-active" : "")}>
              <span className="pcs-step-icon"><item.Icon size={18}/></span>
              <span className="pcs-step-text"><strong>{String(index + 1).padStart(2, "0")} {item.label}</strong><small>{item.detail}</small></span>
            </button>
          ))}
        </div>

        {error && <div className="pcs-error" role="alert">{error}</div>}
        <div className="pcs-layout">
          <section className="pcs-work">
            {stage === "upload" && (
              <>
                <div className="pcs-card-head"><div><h2>导入实拍素材</h2><p>最多选择 8 个文件；多条视频会逐条抽帧，再分批识别。</p></div><span className="pcs-small-tag">01 / 04</span></div>
                <input ref={fileInput} type="file" accept="image/*,video/*" multiple hidden onChange={event => setFilesFromInput(event.target.files)}/>
                <button type="button" className="pcs-drop" onClick={() => fileInput.current?.click()}>
                  <span className="pcs-drop-icon"><UploadCloud size={27}/></span><strong>点击选择视频或图片</strong>
                  <span>支持 MP4 等浏览器可解码的视频格式，以及 JPG / PNG / WebP 等图片</span>
                  <small>单批最多 8 个文件，单个最多 500 MB · 每条视频最多抽取 6 帧 · 按每批 8 帧顺序调用识别，素材越多等待时间和 OpenAI 用量越高。视频原文件仅在浏览器本地读取。</small>
                </button>
                {!!files.length && <div className="pcs-file-list">{files.map((f,i)=><div className="pcs-file" key={i}><FileImage size={19}/><span>{f.name}</span><small>{(f.size/1048576).toFixed(1)} MB</small></div>)}</div>}
                <label className="pcs-label" htmlFor="pcs-context">商品或客户背景（可选）</label>
                <textarea id="pcs-context" className="pcs-textarea" maxLength={1000} value={context} onChange={e => setContext(e.target.value)} placeholder="例如：多伦多的家电折扣店，本次拍摄冰箱、洗衣机等现货；价格与型号尚待确认。"/>
                <div className="pcs-actions"><button className="pcs-primary" type="button" disabled={!files.length || busy} onClick={prepare}>{busy?<LoaderCircle className="pcs-spin" size={17}/>:<ScanSearch size={17}/>} {busy?busyLabel:"提取商品关键帧"}</button></div>
              </>
            )}

            {stage === "products" && (
              <>
                <div className="pcs-card-head"><div><h2>商品识别与关键画面</h2><p>检查抽帧结果，识别后再确认商品身份和产品细节。</p></div><span className="pcs-small-tag">02 / 04</span></div>
                {!frames.length ? <div className="pcs-empty">请先上传素材并提取关键帧。</div>:(
                  <>
                    <div className="pcs-frame-grid">{frames.map((frame,i)=><button key={i} type="button" className={"pcs-frame "+(activeIndex===i?"is-selected":"")} onClick={()=>setActiveIndex(i)}><img src={frame.dataUrl} alt={"素材关键帧 "+(i+1)}/><span>{frame.source} · {frame.time.toFixed(1)}s</span></button>)}</div>
                    <div className="pcs-actions"><button className="pcs-primary" disabled={busy} onClick={analyze} type="button">{busy?<LoaderCircle className="pcs-spin" size={17}/>:<Sparkles size={17}/>} {busy?busyLabel:"识别画面中的商品"}</button><button className="pcs-outline" type="button" onClick={()=>{setBox([10,10,80,80]);setStage("refine");}}>跳过识别，手工裁切</button></div>
                  </>
                )}
                {analysis && <div className="pcs-results">
                  <div className="pcs-results-title"><strong>识别报告</strong><button type="button" className="pcs-plain-button" onClick={exportReport}><ArrowDownToLine size={15}/> 下载 JSON</button></div>
                  <p>{analysis.summary}</p>
                  {!analysis.products.length && <p>本批次没有可靠识别出的商品。可返回检查画面，或进入手工裁切。</p>}
                  {analysis.products.map((product,i)=><button type="button" key={product.id} className="pcs-product" onClick={()=>pickProduct(i)}>
                    <img src={frames[product.frameIndex]?.dataUrl} alt={product.name}/><span><strong>{product.name}</strong><small>{product.category} · {product.features.join("、") || "外观特征待确认"}</small><em>{product.caution || "品牌、型号、价格仍需人工核实"}</em></span><ImagePlus size={18}/>
                  </button>)}
                </div>}
              </>
            )}

            {stage === "refine" && (
              <>
                <div className="pcs-card-head"><div><h2>产品裁切与标准展示图</h2><p>先对齐真实商品，再决定用于哪种内容尺寸。</p></div><span className="pcs-small-tag">03 / 04</span></div>
                {frames.length ? <>
                  {analysis?.products?.length ? <div className="pcs-product-tabs">{analysis.products.map((p,i)=><button key={p.id} type="button" className={selectedProduct===i?"is-active":""} onClick={()=>pickProduct(i)}>{p.name}</button>)}</div>:null}
                  <div className="pcs-frame-picker"><label htmlFor="pcs-frame-choice">原始关键帧</label><select id="pcs-frame-choice" value={activeIndex} onChange={e=>{setActiveIndex(Number(e.target.value));setBox([10,10,80,80]);}}>{frames.map((f,i)=><option value={i} key={i}>{f.source} · {f.time.toFixed(1)} 秒</option>)}</select></div>
                  <div className="pcs-refine-image">
                    <div className="pcs-img-holder">
                      <img src={(frames[activeIndex] || selectedFrame).dataUrl} alt="原始画面"/>
                      <div className="pcs-bbox" style={{left:box[0]+"%",top:box[1]+"%",width:box[2]+"%",height:box[3]+"%"}}/>
                    </div>
                  </div>
                  <div className="pcs-slider-grid">
                    {["左侧起点","上侧起点","裁切宽度","裁切高度"].map((label,i)=><label key={i}><span>{label} · {box[i]}%</span><input aria-label={label} type="range" min={i<2?0:5} max={i<2?95:100} step={1} value={box[i]} onChange={e=>updateBox(i,Number(e.target.value))}/></label>)}
                  </div>
                  <div className="pcs-ratio-row"><strong>导出画幅</strong>{(["1:1","4:5","16:9"] as Ratio[]).map(r=><button type="button" key={r} className={ratio===r?"is-active":""} onClick={()=>setRatio(r)}>{r}</button>)}<button className="pcs-reset" type="button" onClick={()=>setBox(activeProduct?.bbox || [10,10,80,80])}><RotateCcw size={14}/> 复位</button></div>
                  <div className="pcs-actions"><button className="pcs-primary" type="button" disabled={busy} onClick={exportCrop}>{busy?<LoaderCircle className="pcs-spin" size={17}/>:<ArrowDownToLine size={17}/>} 导出标准产品 PNG</button><button className="pcs-outline" type="button" onClick={()=>setStage("next")}>查看下一阶段</button></div>
                  <p className="pcs-caveat">本版是浏览器关键帧裁切、白底排版与比例适配；尚未加入自动抠图、生成式补全或真实高分辨率增强。商品保真需要人工确认。</p>
                </>:<div className="pcs-empty">请先提取视频关键帧。</div>}
              </>
            )}

            {stage === "next" && <>
              <div className="pcs-card-head"><div><h2>从产品资产到营销内容</h2><p>后续阶段将复用通过审核的真实产品图片。</p></div><span className="pcs-small-tag">04 / 04</span></div>
              <div className="pcs-next-grid">
                <div><CalendarDays size={23}/><strong>30 天内容策划</strong><p>20 个不同主题，包含文案、真实产品图、目标受众及排期。</p><span>尚未开发</span></div>
                <div><Clapperboard size={23}/><strong>一键视频剪辑</strong><p>根据真实镜头生成可审核的短视频初稿与时间线。</p><span>尚未开发</span></div>
              </div>
              <div className="pcs-results"><strong>这次测试的可交付结果</strong><p>关键帧图库、商品识别 JSON（需要 OpenAI 密钥）以及已导出的标准产品 PNG。请先用真实代理商视频验证商品识别与裁切质量。</p><button type="button" className="pcs-plain-button" onClick={()=>setStage("products")}>返回识别报告</button></div>
            </>}
          </section>

          <aside className="pcs-inspector">
            <div className="pcs-panel-title"><WandSparkles size={19}/><strong>工作台状态</strong></div>
            <div className="pcs-metric"><span>已选择文件</span><strong>{files.length}</strong></div>
            <div className="pcs-metric"><span>已提取关键帧</span><strong>{frames.length}</strong></div>
            <div className="pcs-metric"><span>已识别商品</span><strong>{analysis?.products.length ?? "—"}</strong></div>
            <div className="pcs-metric"><span>本次导出图片</span><strong>{saved.length}</strong></div>
            <div className="pcs-panel-divider"/>
            <div className="pcs-panel-title"><BadgeCheck size={18}/><strong>可验证的交付</strong></div>
            <p className="pcs-note"><CheckCircle2 size={16}/> 浏览器端真实视频抽帧</p>
            <p className="pcs-note"><CheckCircle2 size={16}/> 调用 OpenAI 视觉识别（需配置密钥）</p>
            <p className="pcs-note"><CheckCircle2 size={16}/> 人工调整裁切框并导出 PNG</p>
            <p className="pcs-note pcs-note-muted"><span>○</span> AI 抠图、精修与视频剪辑：后续</p>
            <div className="pcs-panel-divider"/>
            <div className="pcs-panel-title"><FileImage size={18}/><strong>本次导出预览</strong></div>
            {!saved.length?<p className="pcs-hint">产品图导出后在此出现。刷新页面会清空本次测试数据。</p>:<div className="pcs-saved-grid">{saved.map((item,i)=><button type="button" key={i} onClick={()=>downloadUrl(item.url,"postory-"+item.name+"-"+item.ratio.replace(":","x")+".png")}><img src={item.url} alt={item.name}/><small>{item.ratio}</small></button>)}</div>}
          </aside>
        </div>
        <footer className="pcs-footer"><span>PoStory Internal Content Studio · 真实素材优先</span><span>仅管理员可用 · 非公开演示</span></footer>
      </main>
    </div>
  );
}
