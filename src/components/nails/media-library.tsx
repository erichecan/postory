"use client";

import { useRef, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ImagePlus, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ACCEPTED_IMAGE_TYPES, ImageFileError, readImageFileWithSize } from "@/lib/image-file";
import { deleteMediaAssetAction, uploadMediaAssetsAction, type UploadedMediaAsset } from "@/lib/actions/media-assets";

const MAX_BATCH = 5;
const MAX_SELECTED = 5;

function uploadErrorKey(err: unknown) {
  if (err instanceof ImageFileError) {
    if (err.key === "imageFormat") return "mediaBadType";
    if (err.key === "uploadTooLarge") return "mediaTooLarge";
  }
  return "mediaUploadFailed";
}

export function MediaLibrary({ initialAssets }: { initialAssets: UploadedMediaAsset[] }) {
  const t = useTranslations("nails");
  const [assets, setAssets] = useState(initialAssets);
  const [selected, setSelected] = useState<string[]>([]);
  const [processingCount, setProcessingCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (files.length > MAX_BATCH) {
      toast.error(t("mediaTooMany", { max: MAX_BATCH }));
      return;
    }
    const compressed: { dataUrl: string; width: number; height: number }[] = [];
    for (const file of Array.from(files)) {
      try {
        compressed.push(await readImageFileWithSize(file));
      } catch (err) {
        toast.error(t(uploadErrorKey(err)));
      }
    }
    if (compressed.length === 0) return;
    setProcessingCount((n) => n + compressed.length);
    try {
      const result = await uploadMediaAssetsAction(compressed);
      if (!result.ok) {
        toast.error(result.error);
        return;
      }
      const added: UploadedMediaAsset[] = [];
      for (const item of result.items) {
        if (item.ok) added.push(item.asset);
        else toast.error(item.error);
      }
      if (added.length > 0) setAssets((prev) => [...added, ...prev]);
    } finally {
      setProcessingCount((n) => Math.max(0, n - compressed.length));
    }
  }

  function toggleSelect(id: string) {
    setSelected((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= MAX_SELECTED) {
        toast.error(t("mediaTooMany", { max: MAX_SELECTED }));
        return prev;
      }
      return [...prev, id];
    });
  }

  function move(id: string, dir: -1 | 1) {
    setSelected((prev) => {
      const i = prev.indexOf(id);
      const j = i + dir;
      if (i < 0 || j < 0 || j >= prev.length) return prev;
      const next = [...prev];
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });
  }

  function confirmDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      const result = await deleteMediaAssetAction(id);
      if (result.ok) {
        setAssets((prev) => prev.filter((a) => a.id !== id));
        setSelected((prev) => prev.filter((x) => x !== id));
      } else {
        toast.error(t("mediaDeleteFailed"));
      }
      setDeletingId(null);
    });
  }

  const selectedAssets = selected.map((id) => assets.find((a) => a.id === id)).filter((a): a is UploadedMediaAsset => Boolean(a));

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold">{t("mediaLibraryTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("mediaLibraryDescription")}</p>
        </div>
        <Button onClick={() => inputRef.current?.click()} className="min-h-11 shrink-0 gap-1.5">
          <ImagePlus className="size-4" aria-hidden="true" />
          {t("mediaAddPhotos")}
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          multiple
          className="hidden"
          onChange={(e) => {
            void handleFiles(e.target.files);
            e.target.value = "";
          }}
        />
      </div>
      <p className="text-xs text-muted-foreground">{t("mediaAddHint")}</p>

      {selectedAssets.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground">{t("mediaSelected", { count: selectedAssets.length, max: MAX_SELECTED })}</p>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {selectedAssets.map((asset, index) => (
              <div key={asset.id} className="relative flex-shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.url} alt="" className="size-20 rounded-lg object-cover ring-2 ring-primary" />
                <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/50 py-0.5">
                  <button type="button" aria-label={t("mediaMoveLeft")} disabled={index === 0} onClick={() => move(asset.id, -1)} className="text-white disabled:opacity-30">
                    <ChevronLeft className="size-4" />
                  </button>
                  <button type="button" aria-label={t("mediaMoveRight")} disabled={index === selectedAssets.length - 1} onClick={() => move(asset.id, 1)} className="text-white disabled:opacity-30">
                    <ChevronRight className="size-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {assets.length === 0 && processingCount === 0 ? (
        <p className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">{t("mediaEmptyDescription")}</p>
      ) : (
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {Array.from({ length: processingCount }).map((_, i) => (
            <div key={`pending-${i}`} className="flex aspect-square items-center justify-center rounded-lg border border-dashed text-xs text-muted-foreground">
              {t("mediaProcessing")}
            </div>
          ))}
          {assets.map((asset) => {
            const isSelected = selected.includes(asset.id);
            return (
              <div key={asset.id} className="relative aspect-square">
                <button
                  type="button"
                  onClick={() => toggleSelect(asset.id)}
                  aria-pressed={isSelected}
                  className={`size-full overflow-hidden rounded-lg outline-none ${isSelected ? "ring-2 ring-primary" : ""}`}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={asset.url} alt="" className="size-full object-cover" />
                </button>
                <Dialog>
                  <DialogTrigger
                    aria-label={t("mediaDelete")}
                    className="absolute top-1 right-1 flex size-7 items-center justify-center rounded-full bg-black/60 text-white"
                  >
                    <Trash2 className="size-3.5" aria-hidden="true" />
                  </DialogTrigger>
                  <DialogContent>
                    <DialogTitle>{t("mediaDeleteConfirmTitle")}</DialogTitle>
                    <DialogDescription>{t("mediaDeleteConfirmDescription")}</DialogDescription>
                    <div className="flex justify-end gap-2">
                      <DialogClose render={<Button variant="outline" className="min-h-11" />}>{t("cancel")}</DialogClose>
                      <Button variant="destructive" disabled={deletingId === asset.id} onClick={() => confirmDelete(asset.id)} className="min-h-11">
                        {deletingId === asset.id ? t("working") : t("mediaDeleteConfirm")}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
