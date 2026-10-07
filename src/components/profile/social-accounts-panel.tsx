"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check, Link2, Unlink } from "lucide-react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { connectSocialAction, disconnectSocialAction } from "@/lib/actions/social";
import { PUBLISH_PLATFORMS, publishPlatformLabel, requiresConnection } from "@/lib/platforms";

const CONNECTABLE = PUBLISH_PLATFORMS.filter(requiresConnection);

export function SocialAccountsPanel({ accounts }: { accounts: { platform: string; handle: string | null }[] }) {
  const t = useTranslations("profile.social");
  const tp = useTranslations("platforms");
  const router = useRouter();
  const [pending, start] = useTransition();
  const connected = new Map(accounts.map((a) => [a.platform, a.handle]));
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => {
    if (pollRef.current) clearInterval(pollRef.current);
  }, []);

  function connect(platform: string) {
    start(async () => {
      const res = await connectSocialAction(platform);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      const popup = window.open(res.url, "_blank", "width=520,height=680");
      if (!popup) return;
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(() => {
        if (!popup.closed) return;
        if (pollRef.current) clearInterval(pollRef.current);
        pollRef.current = null;
        router.refresh();
      }, 800);
    });
  }

  function disconnect(platform: string) {
    start(async () => {
      const res = await disconnectSocialAction(platform);
      if (!res.ok) toast.error(res.error);
    });
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <h2 className="text-lg font-semibold tracking-tight">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2">
        {CONNECTABLE.map((platform) => {
          const handle = connected.get(platform);
          const isConnected = handle !== undefined;
          return (
            <div key={platform} className="flex h-14 items-center justify-between rounded-lg border px-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium">{publishPlatformLabel(tp, platform)}</span>
                {isConnected && <span className="text-xs text-muted-foreground">{handle || t("connectedDemo")}</span>}
              </div>
              {isConnected ? (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="gap-1"><Check className="size-3" />{t("connected")}</Badge>
                  <Button type="button" size="sm" variant="ghost" disabled={pending} onClick={() => disconnect(platform)}>
                    <Unlink className="size-3.5" />
                  </Button>
                </div>
              ) : (
                <Button type="button" size="sm" variant="outline" disabled={pending} onClick={() => connect(platform)}>
                  <Link2 className="size-3.5" />
                  {t("connect")}
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
