"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import type { Appointment } from "@/generated/prisma/client";
import type { AvailableSlot } from "@/lib/nails/availability";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveAppointmentAction } from "@/lib/actions/appointments";
import { minuteLabel } from "@/lib/nails/time";
import { BottomSheet } from "./bottom-sheet";

type AppointmentView = Pick<Appointment, "id" | "startAt" | "endAt" | "clientName" | "note">;

function slotLabel(slot: AvailableSlot, timeZone: string) {
  const time = new Intl.DateTimeFormat(undefined, { timeZone, hour: "numeric", minute: "2-digit", timeZoneName: "short" }).format(slot.startAt);
  return `${minuteLabel(slot.localMinute)} · ${time}`;
}

export function AppointmentSheet({ date, slots, timeZone, appointment, onDone }: { date: string; slots: AvailableSlot[]; timeZone: string; appointment?: AppointmentView; onDone: () => void }) {
  const t = useTranslations("nails");
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const existing = appointment?.startAt.toISOString();
  const options = existing && !slots.some((slot) => slot.startAt.toISOString() === existing)
    ? [{ startAt: appointment!.startAt, endAt: appointment!.endAt, localDate: date, localMinute: new Intl.DateTimeFormat("en", { timeZone, hour: "numeric", minute: "2-digit", hourCycle: "h23" }).formatToParts(appointment!.startAt).reduce((minute, p) => p.type === "hour" ? Number(p.value) * 60 : p.type === "minute" ? minute + Number(p.value) : minute, 0) }, ...slots]
    : slots;
  return <BottomSheet
    open={open} onOpenChange={(value) => { setOpen(value); if (!value) setError(""); }}
    trigger={appointment ? t("appointmentEdit") : t("appointmentAdd")}
    title={t(appointment ? "appointmentEditTitle" : "appointmentAddTitle")}
    description={t("appointmentSheetDescription")}
  >
    <form className="space-y-5" onSubmit={(event) => {
      event.preventDefault();
      setError("");
      const formData = new FormData(event.currentTarget);
      formData.set("date", date);
      if (appointment) formData.set("id", appointment.id);
      startTransition(async () => {
        const result = await saveAppointmentAction(undefined, formData);
        if (!result?.ok) { setError(result?.error ?? t("appointmentSaveFailed")); return; }
        toast.success(t("appointmentSaved"));
        setOpen(false);
        router.refresh();
        onDone();
      });
    }}>
      <input type="hidden" name="date" value={date} />
      <div className="space-y-2"><Label htmlFor={`client-${appointment?.id ?? date}`}>{t("clientName")}</Label><Input id={`client-${appointment?.id ?? date}`} name="clientName" required maxLength={80} defaultValue={appointment?.clientName} placeholder={t("clientNamePlaceholder")} className="h-12" /></div>
      <div className="space-y-2"><Label htmlFor={`slot-${appointment?.id ?? date}`}>{t("appointmentStart")}</Label>
        <select id={`slot-${appointment?.id ?? date}`} name="startAt" defaultValue={existing ?? options[0]?.startAt.toISOString() ?? ""} required disabled={!options.length} className="h-12 w-full rounded-lg border border-input bg-background px-3 text-base">
          {options.map((slot) => <option key={slot.startAt.toISOString()} value={slot.startAt.toISOString()}>{slotLabel(slot, timeZone)}</option>)}
        </select>
        {!options.length && <p className="text-sm text-muted-foreground">{t("noSlots")}</p>}
      </div>
      <div className="space-y-2"><Label htmlFor={`note-${appointment?.id ?? date}`}>{t("appointmentNote")}</Label><Input id={`note-${appointment?.id ?? date}`} name="note" maxLength={280} defaultValue={appointment?.note ?? ""} placeholder={t("appointmentNotePlaceholder")} className="h-12" /></div>
      {error && <p role="alert" className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
      <Button type="submit" disabled={pending || !options.length} className="h-12 w-full">{pending ? t("working") : t(appointment ? "appointmentSave" : "appointmentAdd")}</Button>
    </form>
  </BottomSheet>;
}
