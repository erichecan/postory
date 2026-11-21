import { redirect } from "next/navigation";

/** Avoid exposing the separate self-service approval dashboard to merchants. */
export default function SushiContentPage() {
  redirect("/demo/sushi");
}
