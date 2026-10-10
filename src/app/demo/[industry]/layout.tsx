import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { getIndustryConfig } from "@/lib/demo/industries";

export default async function DemoIndustryLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ industry: string }>;
}) {
  const { industry } = await params;
  if (!getIndustryConfig(industry)) notFound();
  return children;
}
