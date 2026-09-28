import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { registerAction } from "@/lib/actions/auth";

export default async function RegisterPage() {
  if (await getCurrentUser()) redirect("/templates");
  return (
    <AuthShell>
      <AuthForm mode="register" action={registerAction} />
    </AuthShell>
  );
}
