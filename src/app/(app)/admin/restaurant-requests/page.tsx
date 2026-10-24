import Link from "next/link";
import { requireAdmin } from "@/lib/auth/session";
import { listRestaurantBriefs } from "@/lib/db/restaurant-campaigns";
import { AdminSubnav } from "@/components/admin/admin-subnav";

export default async function RestaurantRequestsPage() {
  await requireAdmin();
  const items = await listRestaurantBriefs();
  return <main className="mx-auto max-w-6xl px-4 py-10"><header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-semibold">Restaurant campaign requests</h1><p className="mt-1 text-sm text-muted-foreground">Customer briefs referred through the restaurant pilot.</p></div><AdminSubnav active="restaurantRequests" /></header>{items.length ? <div className="mt-6 overflow-x-auto rounded-xl border"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-muted/50"><tr>{["Restaurant", "Contact", "Referrer", "Status", "Submitted", ""].map((x) => <th key={x} className="px-4 py-3 font-medium">{x}</th>)}</tr></thead><tbody>{items.map((item) => <tr key={item.id} className="border-t"><td className="px-4 py-3 font-medium">{item.businessName}</td><td className="px-4 py-3">{item.contactName}<br/><span className="text-muted-foreground">{item.contactEmail}</span></td><td className="px-4 py-3">{item.referrer?.name ?? item.referrer?.email ?? "Direct"}</td><td className="px-4 py-3">{item.status}</td><td className="px-4 py-3">{item.createdAt.toLocaleDateString("en-IE")}</td><td className="px-4 py-3"><Link className="text-primary hover:underline" href={`/admin/restaurant-requests/${item.id}`}>Open</Link></td></tr>)}</tbody></table></div> : <p className="mt-8 text-sm text-muted-foreground">No requests yet.</p>}</main>;
}
