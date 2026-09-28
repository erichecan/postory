"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTimeZone } from "next-intl";
import { TIME_ZONE_COOKIE } from "@/i18n/config";

export function TimeZoneSync() {
  const current = useTimeZone();
  const router = useRouter();
  useEffect(() => {
    const browser = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!browser || browser === current) return;
    document.cookie = `${TIME_ZONE_COOKIE}=${encodeURIComponent(browser)}; path=/; max-age=31536000; samesite=lax`;
    router.refresh();
  }, [current, router]);
  return null;
}
