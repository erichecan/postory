import type { ReactNode } from "react";
import { AppFooter } from "@/components/shell/app-footer";
import { PublicHeader } from "@/components/shell/public-header";
import { getCurrentUser } from "@/lib/auth/session";

export default async function RestaurantRequestLayout({ children }: { children: ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="ds-document flex min-h-screen flex-col">
      <PublicHeader signedIn={user !== null} />
      <div className="flex w-full flex-1 flex-col">{children}</div>
      <AppFooter />
    </div>
  );
}
