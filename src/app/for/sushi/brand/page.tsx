import { redirect } from "next/navigation";

/** Brand Profile intake now happens inside the anonymous Sushi upload step. */
export default function SushiBrandPage() {
  redirect("/demo/sushi/upload");
}
