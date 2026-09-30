import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getFormatter, getLocale, getTranslations } from "next-intl/server";
import enLegal from "@/i18n/messages/en/legal.json";
import zhLegal from "@/i18n/messages/zh/legal.json";
import { AppFooter } from "@/components/shell/app-footer";
import { PublicHeader } from "@/components/shell/public-header";
import { getCurrentUser } from "@/lib/auth/session";
import { BRAND, CONTACT_EMAIL, LEGAL_ENTITY, LEGAL_UPDATED } from "@/lib/brand";
import { cn } from "@/lib/utils";

const DOCS = ["terms", "privacy", "refund"] as const;
type Doc = (typeof DOCS)[number];
const isDoc = (v: string): v is Doc => (DOCS as readonly string[]).includes(v);

type LegalDoc = { title: string; intro: string } & Record<string, string | { h: string; p: string }>;
const LEGAL: Record<"zh" | "en", Record<Doc, LegalDoc>> = { zh: zhLegal, en: enLegal };

function fill(text: string, vars: Record<string, string>) {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => vars[k] ?? m);
}

export function generateStaticParams() {
  return DOCS.map((doc) => ({ doc }));
}

export async function generateMetadata({ params }: PageProps<"/legal/[doc]">): Promise<Metadata> {
  const { doc } = await params;
  if (!isDoc(doc)) return {};
  return { title: `${(await getTranslations("legal.nav"))(doc)} · ${BRAND.name}` };
}

export default async function LegalPage({ params }: PageProps<"/legal/[doc]">) {
  const { doc } = await params;
  if (!isDoc(doc)) notFound();
  const [user, tn, format, locale] = await Promise.all([getCurrentUser(), getTranslations("legal"), getFormatter(), getLocale()]);
  const vars = { brand: BRAND.name, entity: LEGAL_ENTITY };
  const content = LEGAL[locale][doc];
  const sections = Object.entries(content).flatMap(([k, v]) => (/^s\d+$/.test(k) && typeof v === "object" ? [{ key: k, ...v }] : []));

  return (
    <div className="flex min-h-screen flex-col">
      <PublicHeader signedIn={user !== null} />
      <main className="mx-auto flex w-full max-w-[1080px] flex-1 flex-col gap-8 px-4 py-12 md:flex-row md:gap-12">
        <nav aria-label={tn("nav.label")} className="flex gap-1 text-sm md:w-44 md:shrink-0 md:flex-col">
          {DOCS.map((d) => (
            <Link key={d} href={`/legal/${d}`} className={cn("rounded-md px-3 py-1.5", d === doc ? "bg-muted font-medium" : "text-muted-foreground hover:text-foreground")}>
              {tn(`nav.${d}`)}
            </Link>
          ))}
        </nav>
        <article className="flex max-w-2xl flex-col gap-6">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight">{content.title}</h1>
            <p className="mt-2 text-sm text-muted-foreground">{tn("updated", { date: format.dateTime(new Date(LEGAL_UPDATED), { dateStyle: "long", timeZone: "UTC" }) })}</p>
          </header>
          <p className="leading-relaxed text-foreground/90">{fill(content.intro, vars)}</p>
          {sections.map((s) => (
            <section key={s.key} className="flex flex-col gap-2">
              <h2 className="text-lg font-semibold">{s.h}</h2>
              {fill(s.p, vars)
                .split("\n")
                .map((para) => (
                  <p key={para} className="text-sm leading-relaxed text-muted-foreground">{para}</p>
                ))}
            </section>
          ))}
          <p className="border-t pt-6 text-sm text-muted-foreground">
            {tn("contactLine", { channel: CONTACT_EMAIL ? tn("channelEmail", { email: CONTACT_EMAIL }) : tn("channelChat") })}
          </p>
        </article>
      </main>
      <AppFooter />
    </div>
  );
}
