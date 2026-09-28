import type messages from "@/i18n/messages/zh";
import type { Locale } from "@/i18n/config";

declare module "next-intl" {
  interface AppConfig {
    Locale: Locale;
    Messages: typeof messages;
  }
}
