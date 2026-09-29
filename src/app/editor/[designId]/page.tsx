import { notFound } from "next/navigation";
import { Editor } from "@/components/editor/editor";
import { requireUser } from "@/lib/auth/session";
import { getOwnDesign } from "@/lib/db/designs";
import { getEntitlements } from "@/lib/db/entitlements";
import { getBrandProfile } from "@/lib/db/profiles";

export default async function EditorPage({ params }: PageProps<"/editor/[designId]">) {
  const { designId } = await params;
  const user = await requireUser();
  const [design, brand, ent] = await Promise.all([getOwnDesign(user.id, designId), getBrandProfile(user.id), getEntitlements(user.id)]);
  if (!design) notFound();
  return (
    <Editor
      design={{ id: design.id, title: design.title, pages: design.pages, platforms: design.platforms, scheduledAt: design.scheduledAt?.toISOString() ?? null }}
      brand={brand}
      billing={{ hasPlan: ent.hasActivePlan, allowedPlatforms: ent.allowedPlatforms, topup: ent.topup, canClaimGift: !!user.email && !user.emailVerifiedAt }}
    />
  );
}
