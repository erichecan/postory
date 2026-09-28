"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { ImageUp, X } from "lucide-react";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveProfileAction } from "@/lib/actions/profile";
import type { BrandFields } from "@/components/editor/brand-panel";
import { ACCEPTED_IMAGE_TYPES, imageErrorKey, readImageFile } from "@/lib/image-file";

const FIELDS: Exclude<keyof BrandFields, "logoUrl" | "activity">[] = ["shopName", "slogan", "wechat", "phone", "address"];

export function ProfileForm({ initial, submitLabel, onSaved }: { initial: BrandFields | null; submitLabel?: string; onSaved?: () => void }) {
  const [state, action, pending] = useActionState(saveProfileAction, undefined);
  const [logo, setLogo] = useState(initial?.logoUrl ?? "");
  const fileRef = useRef<HTMLInputElement>(null);
  const t = useTranslations("profile");
  const tc = useTranslations("common");
  const tv = useTranslations("validation");

  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message ?? t("saved"));
      onSaved?.();
    }
  }, [state, onSaved, t]);

  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="flex items-center gap-4">
        <div className="grid size-20 shrink-0 place-items-center overflow-hidden rounded-xl border bg-input/30">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {logo ? <img src={logo} alt={t("logo.alt")} className="size-full object-contain" /> : <ImageUp className="size-6 text-muted-foreground" />}
        </div>
        <div className="flex flex-col gap-1.5">
          <Label>{t("logo.label")}</Label>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => fileRef.current?.click()}>{t("logo.upload")}</Button>
            {logo && <Button type="button" variant="ghost" size="sm" onClick={() => setLogo("")}><X className="size-3.5" />{t("logo.remove")}</Button>}
          </div>
          <p className="text-xs text-muted-foreground">{t("logo.hint")}</p>
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
              toast.error(tv(imageErrorKey(err)));
            }
          }}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        {FIELDS.map((name) => (
          <div key={name} className={`flex flex-col gap-2 ${name === "address" ? "sm:col-span-2" : ""}`}>
            <Label htmlFor={name}>{t(`fields.${name}.label`)}</Label>
            <Input id={name} name={name} defaultValue={initial?.[name] ?? ""} placeholder={t(`fields.${name}.placeholder`)} className="h-10" />
          </div>
        ))}
        <div className="flex flex-col gap-2 sm:col-span-2">
          <Label htmlFor="activity">{t("fields.activity.label")}</Label>
          <Textarea id="activity" name="activity" defaultValue={initial?.activity ?? ""} rows={3} placeholder={t("fields.activity.placeholder")} />
        </div>
      </div>
      {state?.error && <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <div>
        <Button type="submit" size="lg" className="h-10 px-6" disabled={pending}>{pending ? t("saving") : (submitLabel ?? tc("save"))}</Button>
      </div>
    </form>
  );
}
