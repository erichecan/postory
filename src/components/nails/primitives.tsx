import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

export function NailsCard({ children, className }: { children: ReactNode; className?: string }) {
  return <Card className={cn("gap-5 rounded-2xl border border-border bg-card p-6 shadow-none", className)}>{children}</Card>;
}

export function EmptyState({ icon, title, description, children }: { icon: ReactNode; title: string; description: string; children?: ReactNode }) {
  return (
    <NailsCard className="items-center py-12 text-center sm:py-16">
      <div className="flex size-16 items-center justify-center rounded-2xl bg-accent text-primary" aria-hidden="true">{icon}</div>
      <div className="max-w-sm space-y-3">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <p className="text-sm leading-7 text-muted-foreground">{description}</p>
      </div>
      {children}
    </NailsCard>
  );
}

export function PageHeading({ eyebrow, title, description }: { eyebrow?: string; title: string; description: string }) {
  return <div className="space-y-3 py-3 sm:py-5">
    {eyebrow && <p className="break-words text-xs font-semibold uppercase tracking-[0.15em] text-primary">{eyebrow}</p>}
    <h1 className="text-2xl font-semibold leading-tight tracking-tight sm:text-3xl">{title}</h1>
    <p className="max-w-lg text-sm leading-7 text-muted-foreground">{description}</p>
  </div>;
}
