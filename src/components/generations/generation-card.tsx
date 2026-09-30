import Link from "next/link";
import { AlertTriangle, Download, Loader2, Wand2 } from "lucide-react";
import { getFormatter, getTranslations } from "next-intl/server";
import { SendToEditorButton } from "@/components/create/send-to-editor-button";
import { RATIOS, SCENES, type SceneId } from "@/components/create/studio-options";
import type { GenerationView } from "@/lib/db/generations";

const isScene = (v: string): v is SceneId => (SCENES as readonly string[]).includes(v);

export async function GenerationCard({ gen }: { gen: GenerationView }) {
  const [t, tc, format] = await Promise.all([getTranslations("generations"), getTranslations("create.scenes"), getFormatter()]);
  const shape = RATIOS.find((r) => r.id === gen.size) ?? RATIOS[0];
  const prompt = isScene(gen.userPrompt) ? tc(gen.userPrompt) : gen.userPrompt;
  const done = gen.status === "SUCCEEDED" && gen.outputUrl;

  return (
    <article className="flex flex-col overflow-hidden rounded-xl border bg-card">
      <div className="relative bg-muted/40" style={{ aspectRatio: `${shape.w} / ${shape.h}` }}>
        {done ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={gen.outputUrl!} alt={prompt} loading="lazy" className="absolute inset-0 size-full object-cover" />
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-4 text-center text-xs text-muted-foreground">
            {gen.status === "PENDING" ? <Loader2 className="size-6 animate-spin" /> : <AlertTriangle className="size-6 text-destructive" />}
            {gen.status === "FAILED" ? t("refunded", { count: gen.credits }) : t("status.PENDING")}
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <p className="line-clamp-2 text-sm">{prompt}</p>
        <p className="text-xs text-muted-foreground">
          {t(`mode.${gen.mode}`)} · {t("credits", { count: gen.credits })} · {format.dateTime(gen.createdAt, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
        </p>
        {done && (
          <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
            <Link href={`/create?from=${gen.id}`} className="inline-flex h-7 items-center gap-1 rounded-lg border px-2.5 text-[0.8rem] hover:bg-muted">
              <Wand2 className="size-3.5" /> {t("continue")}
            </Link>
            <SendToEditorButton generationId={gen.id} label={t("toEditor")} size="sm" />
            <a href={gen.outputUrl!} download className="inline-flex h-7 items-center gap-1 rounded-lg border px-2.5 text-[0.8rem] hover:bg-muted" aria-label={t("download")}>
              <Download className="size-3.5" />
            </a>
          </div>
        )}
      </div>
    </article>
  );
}
