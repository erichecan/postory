import { notFound, redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ industry: string }> }) {
  const { industry } = await params;
  if (industry !== "nails" && industry !== "sushi") notFound();
  redirect(`/demo/${industry}/export`);
}
