import { redirect } from "next/navigation";
import { AuthShell } from "@/components/auth/auth-shell";
import { VerifyEmailForm } from "@/components/auth/verify-email-form";
import { requireUser } from "@/lib/auth/session";

export default async function VerifyEmailPage({ searchParams }: PageProps<"/verify-email">) {
  const user = await requireUser();
  const { sendFailed } = await searchParams;
  if (!user.email || user.emailVerifiedAt) redirect("/templates");
  return (
    <AuthShell>
      <VerifyEmailForm email={user.email} sendFailed={sendFailed === "1"} />
    </AuthShell>
  );
}
