"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { DemoSession, IndustryId, MediaAsset, OutputId, PhotoCropSetting } from "@/lib/demo/contracts";
import { createEmptySession, getBlob, loadSession, putBlob, saveSession } from "@/lib/demo/session";
import { normalizeImage } from "@/lib/demo/media";
import { SUSHI_TEMPLATE_IDS, SUSHI_TEMPLATE_VERSIONS } from "@/lib/demo/templates/sushi-editorial-variants";
import { NAILS_TEMPLATE_IDS } from "@/lib/demo/templates/nails-editorial-variants";
import { NAILS_AUTUMN_CAT_EYE_ID } from "@/lib/demo/templates/nails-autumn-cat-eye-01";
import { NAILS_AUTUMN_CAT_EYE_VERSION } from "@/lib/demo/templates/nails-autumn-cat-eye-01";

export function useDemo(industry: IndustryId) {
  const router = useRouter();
  const params = useSearchParams();
  const [session, setSession] = useState<DemoSession | null>(null);
  const sessionRef = useRef<DemoSession | null>(null);
  const urlsRef = useRef<string[]>([]);
  const samplePhotos = industry === "nails" ? [1,2,3,4].map(i => `/demo/fidelity/nail-photo-${i}.webp`) : ["/demo/photos/sushi-salmon-nigiri.png"];
  const [photos, setPhotos] = useState<string[]>(samplePhotos);
  const [generatedPhotoUrl, setGeneratedPhotoUrl] = useState<string | null>(null);
  const [title, setTitle] = useState(industry === "nails" ? "秋日猫眼\n新品上线" : "Fresh\nSushi");
  const [caption, setCaption] = useState(industry === "nails" ? "一抹流光，点亮秋日" : "SIMPLE INGREDIENTS\nEXTRAORDINARY TASTE");
  const [appointmentSlots, setAppointmentSlots] = useState([
    { date: "2026-10-24", time: "14:00" },
    { date: "2026-10-25", time: "11:00" },
    { date: "2026-10-26", time: "16:00" },
  ]);
  const [description, setDescription] = useState("");
  const [campaignDirection, setCampaignDirection] = useState("");
  const [styleIndex, setStyleIndex] = useState(industry === "nails" ? 2 : 0);
  const [templateId, setTemplateId] = useState(industry === "sushi" ? "sushi-signature-editorial-01" : NAILS_AUTUMN_CAT_EYE_ID);
  const [outputId, setOutputId] = useState<OutputId>(industry === "nails" || industry === "sushi" ? "portrait-4x5" : "portrait-2x3");
  const [cropByOutput, setCropByOutput] = useState<Partial<Record<"square" | "portrait-4x5" | "story-9x16", PhotoCropSetting>>>({
    square: { focalPoint: { x: 0.55, y: 0.58 }, zoom: 1 },
    "portrait-4x5": { focalPoint: { x: 0.55, y: 0.6 }, zoom: 1 },
    "story-9x16": { focalPoint: { x: 0.55, y: 0.55 }, zoom: 1 },
  });
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
        // Entering the industry landing page starts a clean demo session. Resume is
        // explicit through the session query parameter, avoiding stale active drafts.
        let s = params.get("reference") === "1" ? null : id ? await loadSession(industry, id) : null;
        if (!s) s = createEmptySession(industry, "2026.10.09-fidelity", "zh");
        const urls: string[] = [];
        for (const id of s.assetOrder) { const blob = await getBlob(id); if (blob) urls.push(URL.createObjectURL(blob)); }
        // Demo sessions live in IndexedDB. If an older or partially cleared session
        // points at missing blobs, restore usable sample media so the flow can continue.
        if (!urls.length) {
          const assets: MediaAsset[] = [];
          for (const src of samplePhotos) {
            const response = await fetch(src);
            if (!response.ok) throw new Error("示例照片加载失败");
            const blob = await response.blob();
            const normalized = await normalizeImage(new File([blob], industry === "sushi" ? "sushi-sample.jpg" : "sample.webp", { type: industry === "sushi" ? "image/jpeg" : "image/webp" }));
            const id = crypto.randomUUID(); await putBlob(id, normalized.blob);
            assets.push({ id, status: "ready", storageKey: id, mime: normalized.mime, width: normalized.width, height: normalized.height, byteSize: normalized.byteSize, contentHash: normalized.contentHash, createdAt: s.createdAt, expiresAt: s.expiresAt });
          }
          s = { ...s, assets, assetOrder: assets.map(a => a.id), revision: s.revision + 1, updatedAt: new Date().toISOString() };
          await saveSession(s);
          for (const id of s.assetOrder) { const blob = await getBlob(id); if (blob) urls.push(URL.createObjectURL(blob)); }
        }
        if (!alive.current) { urls.forEach(URL.revokeObjectURL); return; }
        if (s.generatedPhotoId) {
          const generated = await getBlob(s.generatedPhotoId);
          if (generated) {
            const generatedUrl = URL.createObjectURL(generated);
            urls.push(generatedUrl);
            setGeneratedPhotoUrl(generatedUrl);
          }
        }
        urlsRef.current.push(...urls);
        const f = s.draft?.fields;
        if (typeof f?.title === "string") setTitle(f.title);
        if (typeof f?.shortCopy === "string") setCaption(f.shortCopy);
        if (Array.isArray(f?.appointmentSlots)) {
          const slots = f.appointmentSlots.flatMap((value) => {
            if (typeof value !== "string") return [];
            const [date, time] = value.split("|");
            return date && time ? [{ date, time }] : [];
          });
          if (slots.length) setAppointmentSlots(slots.slice(0, 3));
        } else if (typeof f?.appointmentDate === "string" && typeof f?.appointmentTime === "string") {
          setAppointmentSlots([{ date: f.appointmentDate, time: f.appointmentTime }]);
        }
        if (typeof f?.dishName === "string") setDescription(f.dishName);
        if (typeof f?.campaignDirection === "string") setCampaignDirection(f.campaignDirection);
        if (typeof f?.styleIndex === "number") setStyleIndex(f.styleIndex);
        if (industry === "sushi" && typeof f?.templateId === "string" && SUSHI_TEMPLATE_IDS.includes(f.templateId as (typeof SUSHI_TEMPLATE_IDS)[number])) setTemplateId(f.templateId);
        else if (industry === "sushi") setTemplateId(SUSHI_TEMPLATE_IDS[typeof f?.styleIndex === "number" ? f.styleIndex : 0] ?? SUSHI_TEMPLATE_IDS[0]);
        else if (industry === "nails") setTemplateId(f?.templateId === "nails-demo-classic" ? "nails-demo-classic" : NAILS_TEMPLATE_IDS.includes(f?.templateId as (typeof NAILS_TEMPLATE_IDS)[number]) ? f!.templateId as string : NAILS_TEMPLATE_IDS[typeof f?.styleIndex === "number" ? f.styleIndex : 2] ?? NAILS_TEMPLATE_IDS[2]);
        if (typeof f?.custom === "boolean") setCustom(f.custom);
        if (Array.isArray(f?.tags)) setTags(f.tags);
        if (s.draft?.outputId && (industry !== "sushi" || s.draft.outputId !== "portrait-2x3")) {
          setOutputId(industry === "nails" && NAILS_TEMPLATE_IDS.includes(f?.templateId as (typeof NAILS_TEMPLATE_IDS)[number]) && s.draft.outputId === "portrait-2x3" ? "portrait-4x5" : s.draft.outputId);
        }
        const restoredCrops = s.draft?.bindings[0]?.cropByOutput;
        if (restoredCrops) setCropByOutput((current) => ({ ...current, ...restoredCrops }));
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
    const templateVersion = NAILS_TEMPLATE_IDS.includes(templateId as (typeof NAILS_TEMPLATE_IDS)[number])
      ? templateId === NAILS_AUTUMN_CAT_EYE_ID ? NAILS_AUTUMN_CAT_EYE_VERSION : "1.0.0"
      : templateId in SUSHI_TEMPLATE_VERSIONS ? SUSHI_TEMPLATE_VERSIONS[templateId as keyof typeof SUSHI_TEMPLATE_VERSIONS] : "1";
    const next: DemoSession = { ...s, revision: s.revision + 1, updatedAt: new Date().toISOString(), draft: { templateId, templateVersion, fields: { title, shortCopy: caption, availabilityText: "", appointmentSlots: appointmentSlots.map(({ date, time }) => `${date}|${time}`), dishName: description, campaignDirection, styleIndex, templateId, custom, tags }, bindings: s.assetOrder[0] ? [{ slotId: "hero", assetId: s.assetOrder[0], crop: { x: 0, y: 0, width: 1, height: 1 }, cropByOutput }] : [], outputId } };
    await saveSession(next); sessionRef.current = next; setSession(next); return next;
  }
  async function persistGeneratedPhoto(dataUrl: string) {
    const current = sessionRef.current;
    if (!current) throw new Error("演示会话尚未准备好。");
    const response = await fetch(dataUrl);
    const blob = await response.blob();
    if (blob.type !== "image/png" || blob.size > 20 * 1024 * 1024) throw new Error("生成的图片无效或过大。");
    const id = `generated-${current.id}`;
    await putBlob(id, blob);
    const url = URL.createObjectURL(blob);
    urlsRef.current.push(url);
    const next = { ...current, generatedPhotoId: id, revision: current.revision + 1, updatedAt: new Date().toISOString() };
    await saveSession(next);
    sessionRef.current = next;
    setSession(next);
    setGeneratedPhotoUrl(url);
    return next;
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
  function setFocalPoint(id: "square" | "portrait-4x5" | "story-9x16", focalPoint: { x: number; y: number }) {
    setCropByOutput((current) => ({ ...current, [id]: { ...(current[id] ?? { zoom: 1 }), focalPoint } }));
  }
  function setZoom(id: "square" | "portrait-4x5" | "story-9x16", zoom: number) {
    setCropByOutput((current) => ({ ...current, [id]: { ...(current[id] ?? { focalPoint: { x: 0.5, y: 0.5 } }), zoom } }));
  }
  return { session, photos, generatedPhotoUrl, persistGeneratedPhoto, title, setTitle, caption, setCaption, appointmentSlots, setAppointmentSlots, description, setDescription, campaignDirection, setCampaignDirection, styleIndex, setStyleIndex, templateId, setTemplateId, outputId, setOutputId, cropByOutput, setFocalPoint, setZoom, custom, setCustom, tags, setTags, busy, error, setError, ready, persist, go, upload, remove, reorder };
}
