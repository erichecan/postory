"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminAddTrialAssetAction } from "@/lib/actions/partner-trials-admin";
import { PUBLISH_PLATFORMS } from "@/lib/platforms";

const ASSET_ERROR_KEYS = ["notFound", "limit", "fileRequired", "fileTooLarge", "fileBadType", "saveFailed"] as const;

export function AddTrialAssetForm({ trialRequestId, platforms, remaining }: { trialRequestId: string; platforms: string[]; remaining: number }) {
  const t = useTranslations("admin.partnerTrials.assets");
  const tp = useTranslations("platforms.publish");
  const [state, action, pending] = useActionState(adminAddTrialAssetAction, undefined);
  return (
    <form action={action} className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div>
        <h2 className="font-semibold">{t("title", { remaining })}</h2>
        <p className="mt-1 text-xs text-muted-foreground">{t("hint")}</p>
      </div>
      <input type="hidden" name="trialRequestId" value={trialRequestId} />
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="trial-asset-file">{t("file")}</Label>
        <Input id="trial-asset-file" name="asset" type="file" accept="image/png,image/jpeg,image/webp" required />
      </div>
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="trial-asset-caption">{t("caption")}</Label>
        <Input id="trial-asset-caption" name="caption" maxLength={500} />
      </div>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-sm font-medium">{t("platforms")}</legend>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {PUBLISH_PLATFORMS.map((platform) => (
            <label key={platform} className="flex items-center gap-1.5 text-sm">
              <input type="checkbox" name="platforms" value={platform} defaultChecked={platforms.includes(platform)} className="size-4 rounded border" />
              {tp(platform)}
            </label>
          ))}
        </div>
      </fieldset>
      {state?.ok && <p className="text-sm text-primary">{t("success")}</p>}
      {state?.error && ASSET_ERROR_KEYS.some((key) => key === state.error) && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{t(`errors.${state.error}` as `errors.${(typeof ASSET_ERROR_KEYS)[number]}`)}</p>}
      <div><Button type="submit" disabled={pending}>{pending ? t("pending") : t("submit")}</Button></div>
    </form>
  );
}
