import { isRestaurantCampaignMediaServable } from "@/lib/db/restaurant-campaigns";
import { getObject, isRestaurantCampaignMediaKey } from "@/lib/storage";

export async function GET(_req: Request, ctx: { params: Promise<{ key: string[] }> }) {
  const key = (await ctx.params).key.join("/");
  if (!isRestaurantCampaignMediaKey(key) || !(await isRestaurantCampaignMediaServable(key))) return new Response(null, { status: 404 });
  const object = await getObject(key);
  if (!object) return new Response(null, { status: 404 });
  return new Response(new Uint8Array(object.bytes), {
    headers: {
      "Content-Type": object.mime,
      "Cache-Control": "private, max-age=3600",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy": "default-src 'none'; img-src data:; style-src 'unsafe-inline'; sandbox",
    },
  });
}
