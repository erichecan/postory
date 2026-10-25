"use client";

export function RestaurantRequestBackLink({ label }: { label: string }) {
  return <a href="/" onClick={(event) => {
    if (window.history.length > 1 && document.referrer.startsWith(window.location.origin)) {
      event.preventDefault();
      window.history.back();
    }
  }} className="inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-muted-foreground transition hover:border-primary/50 hover:text-foreground">
    <span aria-hidden="true">←</span>{label}
  </a>;
}
