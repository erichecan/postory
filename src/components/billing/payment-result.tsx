import Link from "next/link";
import { CheckCircle2, Clock, XCircle } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const ICONS = { success: CheckCircle2, pending: Clock, cancel: XCircle };
const TONES = { success: "text-emerald-400", pending: "text-amber-300", cancel: "text-muted-foreground" };

export function PaymentResult({ tone, title, body, primary, secondary }: { tone: keyof typeof ICONS; title: string; body: string; primary: { href: string; label: string }; secondary?: { href: string; label: string } }) {
  const Icon = ICONS[tone];
  return (
    <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20 text-center">
      <Icon className={cn("size-12", TONES[tone])} />
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      <p className="text-sm text-muted-foreground">{body}</p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <Link href={primary.href} className={buttonVariants({ size: "lg" })}>{primary.label}</Link>
        {secondary && <Link href={secondary.href} className={buttonVariants({ size: "lg", variant: "outline" })}>{secondary.label}</Link>}
      </div>
    </div>
  );
}
