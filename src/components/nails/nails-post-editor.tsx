"use client";
/* eslint-disable @next/next/no-img-element */

import { useRef, useState, useTransition } from "react";
import { toPng } from "html-to-image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { saveNailsPostAction, generateNailsCopyAction, saveNailsPostAvailabilityAction, markNailsPostPublishedAction } from "@/lib/actions/nails-posts";

type Photo = { id: string; url: string };
type Slot = { value: string; label: string };
type Post = { id: string; title: string; body: string; tags: string[]; theme: "SHOWCASE" | "OPEN_SLOTS" | "PROMOTION" | "DAILY"; template: "WORK" | "SLOTS" | "PROMOTION"; status: "DRAFT" | "EXPORTED" | "PUBLISHED"; media: Photo[]; selectedAt: string | null; stale: boolean; exports: { id: string; createdAt: string }[] };

export function NailsPostEditor({ post, library, slots }: { post: Post; library: Photo[]; slots: Slot[] }) {
  const t = useTranslations("nails");
  const router = useRouter();
  const artworkRef = useRef<HTMLDivElement>(null);
  const [title, setTitle] = useState(post.title);
  const [body, setBody] = useState(post.body);
  const [tags, setTags] = useState(post.tags.join(" "));
  const [theme, setTheme] = useState(post.theme);
  const [template, setTemplate] = useState(post.template);
  const [description, setDescription] = useState("");
  const [service, setService] = useState("");
  const [tone, setTone] = useState<"WARM" | "PLAYFUL" | "ELEGANT">("WARM");
  const [slot, setSlot] = useState(post.selectedAt ?? "");
  const [selectedMediaIds, setSelectedMediaIds] = useState(post.media.map((item) => item.id));
  const [busy, startTransition] = useTransition();

  function payload() { return { title, body, tags: tags.split(/[\s,，]+/).map((x) => x.replace(/^#/, "")).filter(Boolean).slice(0, 12), theme, template, mediaIds: selectedMediaIds }; }
  function togglePhoto(id: string) {
    setSelectedMediaIds((current) => {
      if (current.includes(id)) return current.filter((item) => item !== id);
      if (current.length >= 5) { toast.error(t("postPhotoLimit")); return current; }
      return [...current, id];
    });
  }
  function movePhoto(index: number, step: -1 | 1) {
    setSelectedMediaIds((current) => {
      const nextIndex = index + step;
      if (nextIndex < 0 || nextIndex >= current.length) return current;
      const next = [...current]; [next[index], next[nextIndex]] = [next[nextIndex], next[index]]; return next;
    });
  }
  const selectedPhotos = selectedMediaIds.map((id) => library.find((photo) => photo.id === id)).filter((photo): photo is Photo => Boolean(photo));
  function save() { startTransition(async () => { const result = await saveNailsPostAction(post.id, payload()); if (result.ok) { toast.success(t("postSaved")); router.refresh(); } else toast.error(t("postSaveFailed")); }); }
  async function generate() {
    startTransition(async () => {
      await saveNailsPostAction(post.id, payload());
      const result = await generateNailsCopyAction(post.id, { description, service, tone });
      if (result.ok) { setTitle(result.copy.title); setBody(result.copy.body); setTags(result.copy.tags.map((x) => `#${x.replace(/^#/, "")}`).join(" ")); toast.success(t("postAiDone")); }
      else toast.error(result.error);
    });
  }
  async function updateSlot(value: string) {
    setSlot(value);
    const result = await saveNailsPostAvailabilityAction(post.id, value || null);
    if (!result.ok) toast.error(t("postSaveFailed")); else router.refresh();
  }
  async function exportImage() {
    if (!artworkRef.current) return;
    startTransition(async () => {
      const saved = await saveNailsPostAction(post.id, payload());
      if (!saved.ok) { toast.error(t("postSaveFailed")); return; }
      try {
        const dataUrl = await toPng(artworkRef.current!, { pixelRatio: 3, cacheBust: true, backgroundColor: "#fffaf5" });
        const blob = await (await fetch(dataUrl)).blob();
        const form = new FormData(); form.set("image", new File([blob], "postory.png", { type: "image/png" }));
        const response = await fetch(`/api/nails/posts/${post.id}/export`, { method: "POST", body: form });
        if (!response.ok) throw new Error("upload");
        const imageFile = new File([blob], "postory-nail-post.png", { type: "image/png" });
        if (navigator.canShare?.({ files: [imageFile] })) {
          try { await navigator.share({ files: [imageFile], title: title || t("postPreviewTitle") }); }
          catch (error) { if (!(error instanceof DOMException && error.name === "AbortError")) throw error; }
        } else {
          const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = "postory-nail-post.png"; link.click();
          window.setTimeout(() => URL.revokeObjectURL(link.href), 60_000);
        }
        toast.success(t("postExported")); router.refresh();
      } catch { toast.error(t("postExportFailed")); }
    });
  }
  async function copyText() { try { await navigator.clipboard.writeText([title, body, tags].filter(Boolean).join("\n\n")); toast.success(t("postCopied")); } catch { toast.error(t("postCopyFailed")); } }

  return <div className="space-y-5">
    {post.stale && <div role="status" className="rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">{t("postSlotStale")}</div>}
    <label className="block space-y-2 text-sm">{t("postTheme")}<select className="min-h-11 w-full rounded-lg border bg-background px-3" value={theme} onChange={(e) => setTheme(e.target.value as typeof theme)}><option value="SHOWCASE">{t("postThemeShowcase")}</option><option value="OPEN_SLOTS">{t("postThemeSlots")}</option><option value="PROMOTION">{t("postThemePromo")}</option><option value="DAILY">{t("postThemeDaily")}</option></select></label>
    <label className="block space-y-2 text-sm">{t("postSlot")}<select className="min-h-11 w-full rounded-lg border bg-background px-3" value={slot} onChange={(e) => void updateSlot(e.target.value)}><option value="">{t("postNoSlot")}</option>{slots.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}</select></label>
    {library.length > 0 && <div className="space-y-2"><p className="text-sm font-medium">{t("postChoosePhotos")}</p><div className="grid grid-cols-4 gap-2">{library.map((photo) => { const index = selectedMediaIds.indexOf(photo.id); const chosen = index >= 0; return <div key={photo.id} className="relative aspect-square"><button type="button" aria-pressed={chosen} onClick={() => togglePhoto(photo.id)} className={`size-full overflow-hidden rounded-lg ${chosen ? "ring-2 ring-primary" : ""}`}><img src={photo.url} alt="" className="size-full object-cover" /></button>{chosen && <span className="absolute top-1 left-1 rounded bg-primary px-1.5 text-xs text-primary-foreground">{index + 1}</span>}</div>; })}</div><div className="flex gap-2">{selectedMediaIds.map((id, index) => <div key={id} className="flex gap-1"><Button size="icon" variant="outline" aria-label={t("mediaMoveLeft")} disabled={index === 0} onClick={() => movePhoto(index, -1)}><ChevronLeft className="size-4" /></Button><Button size="icon" variant="outline" aria-label={t("mediaMoveRight")} disabled={index === selectedMediaIds.length - 1} onClick={() => movePhoto(index, 1)}><ChevronRight className="size-4" /></Button></div>)}</div></div>}
    <label className="block space-y-2 text-sm">{t("postDescription")}<textarea className="min-h-20 w-full rounded-lg border bg-background p-3" value={description} maxLength={800} onChange={(e) => setDescription(e.target.value)} /></label>
    <label className="block space-y-2 text-sm">{t("postService")}<input className="min-h-11 w-full rounded-lg border bg-background px-3" value={service} maxLength={120} onChange={(e) => setService(e.target.value)} /></label>
    <label className="block space-y-2 text-sm">{t("postTone")}<select className="min-h-11 w-full rounded-lg border bg-background px-3" value={tone} onChange={(e) => setTone(e.target.value as typeof tone)}><option value="WARM">{t("postToneWarm")}</option><option value="PLAYFUL">{t("postTonePlayful")}</option><option value="ELEGANT">{t("postToneElegant")}</option></select></label>
    <Button disabled={busy} onClick={() => void generate()} className="min-h-11 w-full">{busy ? t("working") : t("postGenerate")}</Button>
    <label className="block space-y-2 text-sm">{t("postTitle")}<input className="min-h-11 w-full rounded-lg border bg-background px-3" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} /></label>
    <label className="block space-y-2 text-sm">{t("postBody")}<textarea className="min-h-40 w-full rounded-lg border bg-background p-3" value={body} maxLength={3000} onChange={(e) => setBody(e.target.value)} /></label>
    <label className="block space-y-2 text-sm">{t("postTags")}<input className="min-h-11 w-full rounded-lg border bg-background px-3" value={tags} maxLength={400} onChange={(e) => setTags(e.target.value)} /></label>
    <label className="block space-y-2 text-sm">{t("postTemplate")}<select className="min-h-11 w-full rounded-lg border bg-background px-3" value={template} onChange={(e) => setTemplate(e.target.value as typeof template)}><option value="WORK">{t("postTemplateWork")}</option><option value="SLOTS">{t("postTemplateSlots")}</option><option value="PROMOTION">{t("postTemplatePromo")}</option></select></label>
    <div className={`mx-auto w-full max-w-[360px] overflow-hidden rounded-xl border p-4 ${template === "PROMOTION" ? "bg-rose-50" : template === "SLOTS" ? "bg-violet-50" : "bg-[#fffaf5]"}`} ref={artworkRef} style={{ aspectRatio: "3 / 4" }}>
      <div className="flex h-full flex-col justify-between gap-3">
        {selectedPhotos[0] && <img src={selectedPhotos[0].url} alt="" crossOrigin="anonymous" className={`min-h-0 flex-1 rounded-lg object-cover ${template === "SLOTS" || template === "PROMOTION" ? "order-2" : ""}`} />}
        <div className={`space-y-2 ${template === "SLOTS" || template === "PROMOTION" ? "order-1" : ""}`}><p className="text-xs uppercase tracking-[.2em] text-rose-700">{t(`postTheme${theme === "SHOWCASE" ? "Showcase" : theme === "OPEN_SLOTS" ? "Slots" : theme === "PROMOTION" ? "Promo" : "Daily"}`)}</p><p className={`line-clamp-3 font-semibold leading-tight text-stone-900 ${template === "PROMOTION" ? "text-3xl" : "text-2xl"}`}>{title || t("postPreviewTitle")}</p>{slot && <p className="text-sm text-rose-800">{slots.find((item) => item.value === slot)?.label ?? t("postSlotStale")}</p>}<p className="line-clamp-2 whitespace-pre-wrap text-sm text-stone-600">{body}</p></div>
        <p className="text-xs text-rose-700">{tags}</p>
      </div>
    </div>
    <div className="grid grid-cols-2 gap-2"><Button disabled={busy} variant="outline" onClick={save} className="min-h-11">{t("postSave")}</Button><Button disabled={busy} onClick={() => void exportImage()} className="min-h-11">{t("postExport")}</Button></div>
    <Button variant="outline" onClick={() => void copyText()} className="min-h-11 w-full">{t("postCopy")}</Button>
    {post.status === "EXPORTED" && <Button variant="outline" onClick={() => startTransition(async () => { const result = await markNailsPostPublishedAction(post.id); if (result.ok) { toast.success(t("postPublished")); router.refresh(); } else toast.error(t("postSaveFailed")); })} className="min-h-11 w-full">{t("postMarkPublished")}</Button>}
    {post.exports.length > 0 && <div className="space-y-2"><h2 className="font-medium">{t("postExportHistory")}</h2>{post.exports.map((item) => <a key={item.id} className="block text-sm text-primary underline" href={`/api/nails/exports/${item.id}`} download>{new Date(item.createdAt).toLocaleString()}</a>)}</div>}
  </div>;
}
