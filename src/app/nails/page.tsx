import { redirect } from "next/navigation";
import { getNailsWorkspace } from "@/lib/nails/workspace";

export default async function NailsPage() {
  await getNailsWorkspace();
  redirect("/nails/create");
}
