"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { Platform } from "@/components/visual/primitives";
import { connectSocialAction } from "@/lib/actions/social";

const socialPlatforms = [
  { id: "instagram", label: "Instagram" },
  { id: "facebook", label: "Facebook" },
  { id: "tiktok", label: "TikTok" },
] as const;

export function RestaurantSocialAccountsStep({ signedIn, connectedPlatforms }: { signedIn: boolean; connectedPlatforms: string[] }) {
  const t = useTranslations("restaurantRequest.form.social");
  const router = useRouter();
  const [pendingPlatform, setPendingPlatform] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [refreshing, startRefresh] = useTransition();
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    function handleAuthReturn(event: MessageEvent) {
      if (event.origin !== window.location.origin || event.data?.type !== "postory:restaurant-request-auth") return;
      router.refresh();
    }
    window.addEventListener("message", handleAuthReturn);
    return () => window.removeEventListener("message", handleAuthReturn);
  }, [router]);

  function connect(platform: string) {
    setError("");
    const popup = window.open("about:blank", "_blank", "width=520,height=680");
    if (!popup) {
      setError(t("popupBlocked"));
      return;
    }
    setPendingPlatform(platform);
    void connectSocialAction(platform).then((result) => {
      if (!result.ok) {
        popup.close();
        setError(result.error);
        setPendingPlatform(null);
        return;
      }
      popup.location.href = result.url;
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        if (!popup.closed) return;
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        setPendingPlatform(null);
        router.refresh();
      }, 800);
    }).catch(() => {
      popup.close();
      setError(t("connectionFailed"));
      setPendingPlatform(null);
    });
  }

  function authHref(mode: "login" | "register") {
    return `/${mode}?next=${encodeURIComponent("/restaurant/request")}`;
  }

  return <section className="rounded-xl border bg-card p-4 sm:p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><h3 className="font-semibold">{t("title")}</h3><p className="mt-1 text-sm text-muted-foreground">{t("description")}</p></div>
      {signedIn && <button type="button" onClick={() => startRefresh(() => router.refresh())} disabled={refreshing} className="rounded-lg border px-3 py-2 text-xs font-medium disabled:opacity-60">{refreshing ? t("refreshing") : t("refresh")}</button>}
    </div>
    {!signedIn && <p className="mt-3 rounded-lg bg-muted/60 p-3 text-sm text-muted-foreground">{t("signInHint")} <a href={authHref("login")} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-4">{t("signIn")}</a> · <a href={authHref("register")} target="_blank" rel="noreferrer" className="font-medium text-primary underline underline-offset-4">{t("createAccount")}</a></p>}
    <div className="mt-4 divide-y rounded-xl border">
      {socialPlatforms.map(({ id, label }) => {
        const connected = connectedPlatforms.includes(id);
        return <div key={id} className="flex min-h-16 items-center gap-3 px-3 py-3 sm:px-4">
          <Platform name={id} size={30}/>
          <span className="min-w-0 flex-1 text-sm font-medium">{label}</span>
          {connected ? <span className="inline-flex items-center gap-1.5 text-sm font-medium text-emerald-700"><span aria-hidden="true">✓</span>{t("connected")}</span>
            : signedIn ? <button type="button" onClick={() => connect(id)} disabled={pendingPlatform !== null} className="rounded-lg border border-primary/30 px-3 py-2 text-sm font-medium text-primary hover:bg-primary/5 disabled:opacity-60">{pendingPlatform === id ? t("connecting") : t("connect")}</button>
              : <span className="text-xs text-muted-foreground">{t("notConnected")}</span>}
        </div>;
      })}
    </div>
    {error && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
    <p className="mt-3 text-xs text-muted-foreground">{t("optionalHint")}</p>
  </section>;
}
