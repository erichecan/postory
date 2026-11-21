import { redirect } from "next/navigation";

/** Public Sushi entry uses the original six-step mobile demo, without login. */
export default function SushiIndustryPage() {
  redirect("/demo/sushi");
}
