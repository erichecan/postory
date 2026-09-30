import { revalidatePath } from "next/cache";
import type { NextRequest } from "next/server";
import { getImageProvider, ProviderError } from "@/lib/ai/provider";
import type { Quality, RatioId } from "@/components/create/studio-options";
import { getCurrentUser } from "@/lib/auth/session";
import { getAiBalance } from "@/lib/db/credits";
import { claimGeneration, completeGeneration, failGeneration, GENERATION_STALE_MS, getGenerationPrompt } from "@/lib/db/generations";
import { deleteObject, getObject, keyFromMediaUrl, mediaKey, mediaUrl, putObject } from "@/lib/storage";

export const maxDuration = 300;

const ID_PATTERN = /^[a-z0-9]{10,40}$/;

export async function POST(_req: NextRequest, ctx: RouteContext<"/api/generations/[id]/run">) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ ok: false, reason: "unauthorized" }, { status: 401 });
  const { id } = await ctx.params;
  if (!ID_PATTERN.test(id)) return Response.json({ ok: false, reason: "notFound" }, { status: 404 });

  const claim = await claimGeneration(user.id, id);
  if (claim === "notFound") return Response.json({ ok: false, reason: "notFound" }, { status: 404 });
  if (claim === "alreadyStarted") return Response.json({ ok: false, reason: "alreadyStarted" }, { status: 409 });

  const gen = await getGenerationPrompt(id);
  let reason: "rejected" | "failed" = "failed";
  try {
    if (!gen?.finalPrompt) throw new Error("missing prompt");
    if (Date.now() - gen.createdAt.getTime() > GENERATION_STALE_MS) throw new Error("timeout");
    const inputKey = gen.inputUrl ? keyFromMediaUrl(gen.inputUrl) : null;
    const input = inputKey ? await getObject(inputKey) : null;
    if (gen.inputUrl && !input) throw new Error("input missing");
    const out = await getImageProvider().generate({ prompt: gen.finalPrompt, ratio: gen.size as RatioId, quality: gen.quality as Quality, input });
    const key = mediaKey(user.id, id, "out", out.mime);
    await putObject(key, out.bytes);
    if (!(await completeGeneration(id, mediaUrl(key), out.costMicros))) {
      await deleteObject(key);
      throw new Error("no longer pending");
    }
    return Response.json({ ok: true, id, url: mediaUrl(key) });
  } catch (err) {
    if (err instanceof ProviderError) reason = err.code;
    console.error(`[generation ${id}]`, err);
    await failGeneration(user.id, id, err instanceof Error ? err.message : "unknown");
    revalidatePath("/", "layout");
    return Response.json({ ok: false, reason, balance: await getAiBalance(user.id) });
  }
}
