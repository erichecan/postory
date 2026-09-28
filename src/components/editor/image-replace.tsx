"use client";

import { useRef } from "react";
import { ImageUp } from "lucide-react";
import { toast } from "sonner";

export const MAX_UPLOAD_BYTES = 2 * 1024 * 1024;
const ACCEPT = ["image/png", "image/jpeg", "image/webp"];

export function readImageFile(file: File): Promise<string> {
  if (!ACCEPT.includes(file.type)) return Promise.reject(new Error("只支持 PNG、JPG、WebP 图片"));
  if (file.size > MAX_UPLOAD_BYTES) return Promise.reject(new Error("图片不能超过 2MB"));
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("图片读取失败"));
    reader.readAsDataURL(file);
  });
}

export function ImageReplace({ onPick, label = "换一张图片" }: { onPick: (dataUrl: string) => void; label?: string }) {
  const ref = useRef<HTMLInputElement>(null);
  return (
    <>
      <button type="button" onClick={() => ref.current?.click()} className="flex h-8 items-center justify-center gap-1.5 rounded-md border text-xs hover:bg-accent">
        <ImageUp className="size-3.5" />
        {label}
      </button>
      <input
        ref={ref}
        type="file"
        accept={ACCEPT.join(",")}
        hidden
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          try {
            onPick(await readImageFile(file));
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "图片读取失败");
          }
        }}
      />
    </>
  );
}
