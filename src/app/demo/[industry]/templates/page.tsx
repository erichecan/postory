import { notFound, redirect } from "next/navigation";

export default async function Page({ params, searchParams }: { params: Promise<{ industry: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { industry } = await params;
  if (industry !== "nails" && industry !== "sushi") notFound();
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(await searchParams)) {
    if (typeof value === "string") query.set(key, value);
    else value?.forEach((entry) => query.append(key, entry));
  }
  redirect(`/demo/${industry}/edit${query.size ? `?${query.toString()}` : ""}`);
}
