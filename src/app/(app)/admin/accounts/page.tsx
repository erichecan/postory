import { getTranslations } from "next-intl/server";
import { AdminSubnav } from "@/components/admin/admin-subnav";
import { CreateAccountForm } from "@/components/admin/create-account-form";
import { CustomerTable } from "@/components/admin/customer-table";
import { Pagination } from "@/components/templates/pagination";
import { requireAdmin } from "@/lib/auth/session";
import { listCustomers } from "@/lib/db/admin-customers";

export default async function AccountsPage({ searchParams }: PageProps<"/admin/accounts">) {
  await requireAdmin();
  const { page } = await searchParams;
  const current = Math.max(1, Number.parseInt(typeof page === "string" ? page : "1", 10) || 1);
  const [data, t] = await Promise.all([listCustomers(current), getTranslations("admin")]);
  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-8 px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("total", { count: data.total })}</p>
        </div>
        <AdminSubnav active="accounts" />
      </header>
      <CreateAccountForm />
      <CustomerTable items={data.items} />
      <Pagination page={current} pageCount={data.pageCount} makeHref={(p) => (p > 1 ? `/admin/accounts?page=${p}` : "/admin/accounts")} />
    </div>
  );
}
