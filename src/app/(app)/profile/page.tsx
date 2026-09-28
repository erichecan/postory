import { ProfileForm } from "@/components/profile/profile-form";
import { requireUser } from "@/lib/auth/session";
import { getBrandProfile } from "@/lib/db/profiles";

export default async function ProfilePage() {
  const user = await requireUser();
  const profile = await getBrandProfile(user.id);
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">商家资料</h1>
      <p className="mt-1 mb-8 text-sm text-muted-foreground">这里填的内容，在编辑器右侧「商家资料」里可以一键放进模板。</p>
      <ProfileForm initial={profile} />
    </div>
  );
}
