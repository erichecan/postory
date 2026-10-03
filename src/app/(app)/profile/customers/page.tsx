import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { CreateCustomerForm } from "@/components/customers/create-customer-form";
import { CustomerList } from "@/components/customers/customer-list";
import { requireUser } from "@/lib/auth/session";
import { listEndCustomers } from "@/lib/db/end-customers";

export default async function CustomersPage() {
  const user = await requireUser();
  const [customers, t] = await Promise.all([listEndCustomers(user.id), getTranslations("customers")]);

  return (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-8 px-4 py-10">
      <header className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{t("title")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>
        <Link href="/profile" className="rounded-md border px-3 py-1.5 text-sm hover:bg-accent">
          {t("backToProfile")}
        </Link>
      </header>
      <CreateCustomerForm />
      {customers.length === 0 ? (
        <div className="rounded-xl border border-dashed py-10 text-center text-sm text-muted-foreground">{t("empty")}</div>
      ) : (
        <CustomerList items={customers} />
      )}
    </div>
  );
}
