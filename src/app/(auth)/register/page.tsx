import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { registerAction } from "@/lib/actions/auth";

export default function RegisterPage() {
  return (
    <AuthShell>
      <AuthForm mode="register" action={registerAction} />
    </AuthShell>
  );
}
