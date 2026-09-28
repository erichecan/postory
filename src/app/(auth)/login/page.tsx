import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { loginAction } from "@/lib/actions/auth";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/templates");
  const { next } = await searchParams;
  return (
    <AuthShell>
      <AuthForm mode="login" action={loginAction} next={typeof next === "string" ? next : undefined} />
    </AuthShell>
  );
}
