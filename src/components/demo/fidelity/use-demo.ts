"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DemoSession, IndustryId, MediaAsset } from "@/lib/demo/contracts";
import { createEmptySession, getBlob, loadActiveSession, loadSession, putBlob, saveSession } from "@/lib/demo/session";
import { normalizeImage } from "@/lib/demo/media";

export function useDemo(industry: IndustryId) {
  const router = useRouter();
  const params = useSearchParams();
  const [session, setSession] = useState<DemoSession | null>(null);
  const sessionRef = useRef<DemoSession | null>(null);
  const urlsRef = useRef<string[]>([]);
  const samplePhotos = industry === "nails" ? [1,2,3,4].map(i => `/demo/fidelity/nail-photo-${i}.webp`) : ["/demo/fidelity/sushi-photo.webp"];
  const [photos, setPhotos] = useState<string[]>(samplePhotos);
  const [title, setTitle] = useState(industry === "nails" ? "秋日温柔猫眼款" : "Fresh Sushi Always\na Good Idea");
  const [caption, setCaption] = useState(industry === "nails" ? "这个秋天，换一款温柔的猫眼美甲 💗\n低调又精致，显白又百搭～\n新款已上线，欢迎私信预约 ✨" : "Simple ingredients, extraordinary taste.");
  const [description, setDescription] = useState("");
  const [styleIndex, setStyleIndex] = useState(0);
  const [custom, setCustom] = useState(false);
  const [tags, setTags] = useState(industry === "nails" ? ["猫眼美甲", "秋日美甲", "显白"] : ["Sushi", "JapaneseFood", "FreshSushi", "TorontoEats"]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const alive = useRef(true);

  useEffect(() => {
    alive.current = true;
    async function init() {
      try {
        const id = params.get("session");
        let s = params.get("reference") === "1" ? null : id ? await loadSession(industry, id) : await loadActiveSession(industry);
        if (!s) {
          s = createEmptySession(industry, "2026.10.09-fidelity", "zh");
          const assets: MediaAsset[] = [];
          for (const src of samplePhotos) {
            const response = await fetch(src);
            if (!response.ok) throw new Error("示例照片加载失败");
            const blob = await response.blob();
            const normalized = await normalizeImage(new File([blob], "sample.webp", { type: "image/webp" }));
            const id = crypto.randomUUID(); await putBlob(id, normalized.blob);
            assets.push({ id, status: "ready", storageKey: id, mime: normalized.mime, width: normalized.width, height: normalized.height, byteSize: normalized.byteSize, contentHash: normalized.contentHash, createdAt: s.createdAt, expiresAt: s.expiresAt });
          }
          s = { ...s, assets, assetOrder: assets.map(a => a.id) };
          await saveSession(s);
        }
        const urls: string[] = [];
        for (const id of s.assetOrder) { const blob = await getBlob(id); if (blob) urls.push(URL.createObjectURL(blob)); }
        if (!alive.current) { urls.forEach(URL.revokeObjectURL); return; }
        urlsRef.current.push(...urls);
        const f = s.draft?.fields;
        if (typeof f?.title === "string") setTitle(f.title);
        if (typeof f?.shortCopy === "string") setCaption(f.shortCopy);
        if (typeof f?.dishName === "string") setDescription(f.dishName);
        if (typeof f?.styleIndex === "number") setStyleIndex(f.styleIndex);
        if (typeof f?.custom === "boolean") setCustom(f.custom);
        if (Array.isArray(f?.tags)) setTags(f.tags);
        setPhotos(urls); setSession(s); sessionRef.current = s; setReady(true);
      } catch { if (alive.current) setError("演示草稿无法读取，请刷新后重试。"); }
    }
    void init();
    return () => { alive.current = false; urlsRef.current.forEach(URL.revokeObjectURL); urlsRef.current = []; };
    // Each page owns its session. Navigations remount it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [industry]);

  async function persist() {
    const s = sessionRef.current;
    if (!s) throw new Error("照片正在准备，请稍后重试");
    const next: DemoSession = { ...s, revision: s.revision + 1, updatedAt: new Date().toISOString(), draft: { templateId: `${industry}-demo-classic`, templateVersion: "1", fields: { title, shortCopy: caption, dishName: description, styleIndex, custom, tags }, bindings: s.assetOrder[0] ? [{ slotId: "hero", assetId: s.assetOrder[0], crop: { x: 0, y: 0, width: 1, height: 1 } }] : [], outputId: "portrait-2x3" } };
    await saveSession(next); sessionRef.current = next; setSession(next); return next;
  }
  async function go(page: string) {
    try { const s = await persist(); router.push(`/demo/${industry}${page === "landing" ? "" : `/${page}`}?session=${s.id}`); } catch (e) { setError(e instanceof Error ? e.message : "草稿保存失败"); }
  }
  async function upload(files: FileList | null, replace = false) {
    const s = sessionRef.current;
    if (!files?.length || !s || busy) return;
    if (files.length + (replace ? 0 : s.assets.length) > 6) { setError("一次最多选择 6 张照片，请减少照片后重试。"); return; }
    setBusy(true);setError("");
    try {
      const newAssets: MediaAsset[] = []; const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const normalized = await normalizeImage(file); const id = crypto.randomUUID();
        await putBlob(id, normalized.blob); const url = URL.createObjectURL(normalized.blob); urlsRef.current.push(url); newUrls.push(url);
        newAssets.push({ id, status:"ready", storageKey:id, mime:normalized.mime,width:normalized.width,height:normalized.height,byteSize:normalized.byteSize,contentHash:normalized.contentHash,createdAt:new Date().toISOString(),expiresAt:s.expiresAt });
      }
      const assets = replace ? newAssets : [...s.assets,...newAssets];
      const next = {...s,assets,assetOrder:assets.map(a=>a.id),revision:s.revision+1,updatedAt:new Date().toISOString(), ...(s.draft ? {draft:{...s.draft,fields:{...s.draft.fields,custom:true}}} : {})};
      await saveSession(next);sessionRef.current=next;setSession(next);setPhotos(replace ? newUrls : [...photos,...newUrls]);setCustom(true);
    } catch { setError("照片处理失败。请使用 JPG、PNG 或 WebP，单张不超过 15MB。"); } finally { setBusy(false); }
  }
  async function remove(index: number) {
    const s=sessionRef.current;if(!s)return;
    const id=s.assetOrder[index];const order=s.assetOrder.filter(v=>v!==id);
    const next={...s,assets:s.assets.filter(a=>a.id!==id),assetOrder:order,revision:s.revision+1,updatedAt:new Date().toISOString()};
    try { await saveSession(next);sessionRef.current=next;setSession(next);setPhotos(photos.filter((_,i)=>i!==index)); } catch { setError("删除失败，请重试。"); }
  }
  async function reorder(from: number, to: number) {
    const s=sessionRef.current;if(!s||from===to||to<0||to>=s.assetOrder.length)return;
    const order=[...s.assetOrder]; const [id]=order.splice(from,1);order.splice(to,0,id);
    const next={...s,assetOrder:order,revision:s.revision+1,updatedAt:new Date().toISOString()};
    try { await saveSession(next);const p=[...photos];const [url]=p.splice(from,1);p.splice(to,0,url);sessionRef.current=next;setSession(next);setPhotos(p);setCustom(true); } catch { setError("排序失败，请重试。"); }
  }
  return { session, photos, title, setTitle, caption, setCaption, description, setDescription, styleIndex, setStyleIndex, custom, setCustom, tags, setTags, busy, error, setError, ready, persist, go, upload, remove, reorder };
}
