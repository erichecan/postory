import { requireAdmin } from "@/lib/auth/session";
import { ContentStudio } from "@/components/internal-studio/content-studio";

export default async function InternalContentStudioPage() {
  await requireAdmin();
  return <ContentStudio />;
}
