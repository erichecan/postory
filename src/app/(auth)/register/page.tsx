import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { registerAction } from "@/lib/actions/auth";
import { safeNext } from "@/lib/safe-next";

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const { next } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(next));
  return (
    <AuthShell>
      <AuthForm mode="register" action={registerAction} next={typeof next === "string" ? safeNext(next) : undefined} />
    </AuthShell>
  );
}
