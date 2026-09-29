import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { AuthShell } from "@/components/auth/auth-shell";
import { ResetPasswordForm } from "@/components/auth/password-reset-forms";

export default async function ResetPasswordPage({ searchParams }: PageProps<"/reset-password">) {
  const { email, token } = await searchParams;
  const t = await getTranslations("auth.reset");
  const valid = typeof email === "string" && typeof token === "string" && email.includes("@") && token.length >= 20;
  return (
    <AuthShell>
      {valid ? (
        <ResetPasswordForm email={email} token={token} />
      ) : (
        <div className="flex w-full max-w-sm flex-col gap-4">
          <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{t("invalid")}</p>
          <Link href="/forgot-password" className="text-sm text-primary hover:underline">{t("again")}</Link>
        </div>
      )}
    </AuthShell>
  );
}
