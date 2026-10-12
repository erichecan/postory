import { requireAdmin } from "@/lib/auth/session";
import { DemoTrialOverrideForm } from "@/components/admin/demo-trial-override-form";

export default async function Page() {
  await requireAdmin();
  return <main className="mx-auto max-w-3xl space-y-6 p-6"><header><h1 className="text-2xl font-bold">Demo 试用保护</h1><p className="mt-2 text-sm text-muted-foreground">查看被拦截顾客的人工放行入口。</p></header><DemoTrialOverrideForm /></main>;
}
