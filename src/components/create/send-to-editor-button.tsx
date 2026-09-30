"use client";

import { useTransition } from "react";
import { Loader2, PenLine } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { sendToEditorAction } from "@/lib/actions/generations";

export function SendToEditorButton({ generationId, label, size = "lg" }: { generationId: string; label: string; size?: "sm" | "lg" }) {
  const t = useTranslations("create.result");
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size={size}
      className="gap-1.5"
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await sendToEditorAction(generationId);
          if (res && !res.ok) toast.error(res.error);
        })
      }
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <PenLine className="size-4" />} {pending ? t("sending") : label}
    </Button>
  );
}
