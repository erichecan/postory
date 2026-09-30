"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { CheckoutFailure } from "@/lib/actions/billing";
import { cn } from "@/lib/utils";

export function StripeRedirectButton({
  action,
  children,
  variant = "default",
  className,
}: {
  action: () => Promise<CheckoutFailure>;
  children: React.ReactNode;
  variant?: "default" | "outline";
  className?: string;
}) {
  const t = useTranslations("billing.checkout");
  const [pending, start] = useTransition();
  return (
    <Button
      size="lg"
      variant={variant}
      className={cn("gap-2", className)}
      disabled={pending}
      onClick={() =>
        start(async () => {
          const res = await action();
          if (res && !res.ok) toast.error(res.error);
        })
      }
    >
      {pending ? (
        <>
          <Loader2 className="size-4 animate-spin" /> {t("redirecting")}
        </>
      ) : (
        children
      )}
    </Button>
  );
}
