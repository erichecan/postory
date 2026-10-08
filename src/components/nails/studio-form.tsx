"use client";

import { useActionState, useEffect, useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createStudioAction, updateStudioAction } from "@/lib/actions/studio";

const COMMON_ZONES = ["America/Toronto", "America/Vancouver", "America/New_York", "America/Los_Angeles", "Europe/Dublin", "Europe/London", "Asia/Shanghai", "Asia/Hong_Kong", "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney", "UTC"];
const subscribe = () => () => {};
const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const serverTimeZone = () => "";

export function StudioForm({ initialName = "", initialTimeZone = "", onboarding = false, timeZones }: { initialName?: string; initialTimeZone?: string; onboarding?: boolean; timeZones: string[] }) {
  const t = useTranslations("nails");
  const [state, action, pending] = useActionState(onboarding ? createStudioAction : updateStudioAction, undefined);
  const [name, setName] = useState(initialName);
  const [timeZone, setTimeZone] = useState(initialTimeZone);
  const detected = useSyncExternalStore(subscribe, browserTimeZone, serverTimeZone);
  const zones = [...new Set([...COMMON_ZONES, ...timeZones, initialTimeZone, detected])].filter(Boolean).sort();
  useEffect(() => {
    if (state?.ok && state.message) toast.success(state.message);
  }, [state]);

  return <form action={action} className="space-y-6" aria-busy={pending}>
    <div className="space-y-2">
      <Label htmlFor="studio-name">{t("studioName")}</Label>
      <Input id="studio-name" name="name" value={name} onChange={(event) => setName(event.target.value)} placeholder={t("studioPlaceholder")} maxLength={64} required autoComplete="organization" className="h-12 text-base" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="studio-timezone">{t("timeZone")}</Label>
      <select id="studio-timezone" name="timeZone" value={timeZone || detected} onChange={(event) => setTimeZone(event.target.value)} required aria-describedby="timezone-help" className="h-12 w-full min-w-0 rounded-lg border border-input bg-background px-3 text-base outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <option value="" disabled>{t("timeZone")}</option>
        {zones.map((zone) => <option key={zone} value={zone}>{zone.replaceAll("_", " ")}</option>)}
      </select>
      <p id="timezone-help" className="text-xs leading-6 text-muted-foreground">{t("timeZoneHelp")}</p>
    </div>
    {state?.error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{state.error}</p>}
    {state?.ok && <p role="status" className="text-sm text-[var(--ds-success)]">{state.message}</p>}
    <Button type="submit" disabled={pending} className="h-12 w-full text-base">{pending ? t("working") : t(onboarding ? "createWorkspace" : "save")}</Button>
  </form>;
}
