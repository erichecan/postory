import { getNailsWorkspace } from "@/lib/nails/workspace";
import { BottomNavigation } from "@/components/nails/navigation";

export default async function WorkspaceLayout({ children }: { children: React.ReactNode }) {
  await getNailsWorkspace();
  return <><main className="nails-main">{children}</main><BottomNavigation /></>;
}
