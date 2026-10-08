import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getCurrentUser } from "@/lib/auth/session";
import { AuthForm } from "@/components/auth/auth-form";
import { AuthShell } from "@/components/auth/auth-shell";
import { DemoLogin } from "@/components/auth/demo-login";
import { loginAction } from "@/lib/actions/auth";
import { safeNext } from "@/lib/safe-next";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, reset } = await searchParams;
  if (await getCurrentUser()) redirect(safeNext(next));
  const t = await getTranslations("auth.reset");
  return (
    <AuthShell>
      <div className="flex w-full max-w-sm flex-col gap-4">
        <DemoLogin />
        <AuthForm mode="login" action={loginAction} next={typeof next === "string" ? next : undefined} notice={reset === "1" ? t("done") : undefined} />
      </div>
    </AuthShell>
  );
}
