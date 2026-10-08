import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/session";
import { findStudioForOwner } from "@/lib/db/studios";
import { nailsReturnPath } from "./validation";

export async function requireNailsUser(next = "/nails") {
  const user = await getCurrentUser();
  if (!user) redirect(`/nails/login?next=${encodeURIComponent(nailsReturnPath(next))}`);
  return user;
}

export const getNailsWorkspace = cache(async () => {
  const user = await requireNailsUser();
  const studio = await findStudioForOwner(user.id);
  if (!studio) redirect("/nails/onboarding");
  return { user, studio };
});
