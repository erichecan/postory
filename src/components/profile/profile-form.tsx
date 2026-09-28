"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ImageUp, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveProfileAction } from "@/lib/actions/profile";
import type { BrandFields } from "@/components/editor/brand-panel";
import { ACCEPTED_IMAGE_TYPES, readImageFile } from "@/lib/image-file";

const FIELDS: { name: Exclude<keyof BrandFields, "logoUrl" | "activity">; label: string; placeholder: string }[] = [
  { name: "shopName", label: "店名", placeholder: "例如：小满咖啡" },
  { name: "slogan", label: "口号", placeholder: "一句话介绍你的店" },
  { name: "wechat", label: "微信号", placeholder: "顾客加你的微信号" },
  { name: "phone", label: "联系电话", placeholder: "例如：139-0000-0000" },
  { name: "address", label: "门店地址", placeholder: "省市区 + 街道门牌" },
];

export function ProfileForm({ initial, submitLabel = "保存", onSaved }: { initial: BrandFields | null; submitLabel?: string; onSaved?: () => void }) {
  const [state, action, pending] = useActionState(saveProfileAction, undefined);
  const [logo, setLogo] = useState(initial?.logoUrl ?? "");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message ?? "已保存");
      onSaved?.();
    }
  }, [state, onSaved]);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border bg-input/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo ? <img src={logo} alt="店铺 Logo" className="size-full object-contain" /> : <ImageUp className="size-6 text-muted-foreground" />}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>店铺 Logo</Label>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>上传图片</Button>
            {logo && <Button type="button" variant="ghost" size="sm" onClick={() => setLogo("")}><X className="size-3.5" />移除</Button>}
          </div>
          <p className="text-xs text-muted-foreground">PNG / JPG / WebP，不超过 2MB，会自动压缩</p>
        </div>
        <input type="hidden" name="logoUrl" value={logo} />
        <input
          ref={fileRef}
          type="file"
          hidden
          accept={ACCEPTED_IMAGE_TYPES.join(",")}
          onChange={async (e) => {
            const file = e.target.files?.[0];
            e.target.value = "";
            if (!file) return;
            try {
              setLogo(await readImageFile(file));
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "图片读取失败");
            }
          }}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((f) => (
          <div key={f.name} className={`flex flex-col gap-2 ${f.name === "address" ? "sm:col-span-2" : ""}`}>
            <Label htmlFor={f.name}>{f.label}</Label>
            <Input id={f.name} name={f.name} defaultValue={initial?.[f.name] ?? ""} placeholder={f.placeholder} className="h-10" />
          </div>
        ))}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="activity">常用活动文案</Label>
          <Textarea id="activity" name="activity" defaultValue={initial?.activity ?? ""} rows={3} placeholder="例如：国庆限定，拿铁第二杯半价，10/1–10/7" />
        </div>
      </div>
      {state?.error && <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <div>
        <Button type="submit" size="lg" className="h-10 px-6" disabled={pending}>{pending ? "保存中…" : submitLabel}</Button>
      </div>
    </form>
  );
}
