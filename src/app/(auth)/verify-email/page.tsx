import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { requireUser } from "@/lib/auth/session";

export default async function VerifyEmailPage() {
  const user = await requireUser();
  if (!user.email || user.emailVerifiedAt) redirect("/templates");
  return (
    <AuthShell>
      <VerifyEmailForm email={user.email} />
    </AuthShell>
  );
}
