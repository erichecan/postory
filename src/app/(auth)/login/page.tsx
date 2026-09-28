import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { DemoLogin } from "@/components/auth/demo-login";
import { loginAction } from "@/lib/actions/auth";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  if (await getCurrentUser()) redirect("/templates");
  const { next } = await searchParams;
  return (
    <AuthShell>
      <div className="flex w-full max-w-sm flex-col gap-4">
        <DemoLogin />
        <AuthForm mode="login" action={loginAction} next={typeof next === "string" ? next : undefined} />
      </div>
    </AuthShell>
  );
}
