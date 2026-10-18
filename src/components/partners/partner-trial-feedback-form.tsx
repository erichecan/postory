"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { submitPartnerTrialFeedbackAction } from "@/lib/actions/partner-trials";

const CATEGORY_VALUES = ["STYLE", "CONTENT_ACCURACY", "REVISION_REQUEST"] as const;

export function PartnerTrialFeedbackForm({ token }: { token: string }) {
  const t = useTranslations("partners.view");
  const [state, action, pending] = useActionState(submitPartnerTrialFeedbackAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-3">
      <input type="hidden" name="token" value={token} />
      <div className="flex flex-col gap-1.5">
        <label htmlFor="category" className="text-sm font-medium">{t("feedbackCategory")}</label>
        <select id="category" name="category" required defaultValue="" className="h-9 w-fit rounded-lg border bg-input/30 px-3 text-sm">
          <option value="" disabled>
            {t("feedbackCategory")}
          </option>
          {CATEGORY_VALUES.map((v) => (
            <option key={v} value={v}>
              {t(`feedbackCategoryOptions.${v}`)}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="content" className="text-sm font-medium">{t("feedbackContent")}</label>
        <Textarea id="content" name="content" required maxLength={2000} />
      </div>
      {state?.error && <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      {state?.ok && <p className="rounded-md bg-primary/10 px-3 py-2 text-sm text-primary">{t("feedbackSuccess")}</p>}
      <div>
        <Button type="submit" disabled={pending}>{pending ? t("feedbackSubmitting") : t("feedbackSubmit")}</Button>
      </div>
    </form>
  );
}
