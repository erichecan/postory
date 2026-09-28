import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { loginAction } from "@/lib/actions/auth";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <AuthShell>
      <AuthForm mode="login" action={loginAction} next={typeof next === "string" ? next : undefined} />
    </AuthShell>
  );
}
