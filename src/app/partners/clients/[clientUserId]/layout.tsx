import { requireClientAccess } from "@/lib/auth/agency-access";

export default async function Layout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ clientUserId: string }>;
}) {
  const { clientUserId } = await params;
  await requireClientAccess(clientUserId);
  return children;
}
