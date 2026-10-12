import { notFound, redirect } from "next/navigation";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ industry: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [{ industry }, query] = await Promise.all([params, searchParams]);
  if (industry !== "nails" && industry !== "sushi") notFound();

  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (Array.isArray(value)) value.forEach((item) => search.append(key, item));
    else if (value !== undefined) search.set(key, value);
  }
  redirect(`/demo/${industry}/export${search.size ? `?${search}` : ""}`);
}
