import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { requireUser } from "@/lib/auth/session";
import { safeNext } from "@/lib/safe-next";

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const user = await requireUser();
  const { sendFailed, next } = await searchParams;
  const returnPath = typeof next === "string" ? safeNext(next) : undefined;
  if (!user.email || user.emailVerifiedAt) redirect(returnPath ?? "/dashboard");
  return (
    <AuthShell>
      <VerifyEmailForm email={user.email} sendFailed={sendFailed === "1"} next={returnPath} />
    </AuthShell>
  );
}
