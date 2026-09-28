"use client";

import { useRef } from "react";
import { ImageUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { ACCEPTED_IMAGE_TYPES, imageErrorKey, readImageFile } from "@/lib/image-file";

export function ImageReplace({ onPick, label }: { onPick: (dataUrl: string) => void; label?: string }) {
  const t = useTranslations("editor");
  const tv = useTranslations("validation");
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.click()} className="flex h-8 items-center justify-center gap-1.5 rounded-md border text-xs hover:bg-accent">
        <ImageUp className="size-3.5" />
        {label ?? t("style.replaceImage")}
      </button>
      <input
        ref={ref}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            onPick(await readImageFile(file));
          } catch (err) {
            toast.error(tv(imageErrorKey(err)));
          }
        }}
      />
    </>
  );
}
