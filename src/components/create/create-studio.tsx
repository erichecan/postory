"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { InsufficientDialog } from "@/components/billing/insufficient-dialog";
import { TopupDialog } from "@/components/billing/topup-dialog";
import { createGenerationAction } from "@/lib/actions/generations";
import { CHARGE_CREDITS } from "@/lib/billing/plan-math";
import type { Currency } from "@/types/commerce";
import { StudioControls, type ControlsState } from "./studio-controls";
import type { Round } from "./studio-options";
import { StudioResult } from "./studio-result";

type RunResponse = { ok: true; id: string; url: string } | { ok: false; reason: "rejected" | "failed" | "notFound" | "alreadyStarted" | "unauthorized"; balance?: number };

async function runGeneration(id: string): Promise<RunResponse> {
  const res = await fetch(`/api/generations/${id}/run`, { method: "POST" });
  return (await res.json()) as RunResponse;
}

export function CreateStudio({
  shopName,
  initialBalance,
  aiBalance,
  isDemo,
  hasPlan,
  topup,
  initialRound,
}: {
  shopName: string | null;
  initialBalance: number;
  aiBalance: number;
  isDemo: boolean;
  hasPlan: boolean;
  topup: { currency: Currency; unitPrice: number } | null;
  initialRound: Round | null;
}) {
  const t = useTranslations("create");
  const router = useRouter();
  const [state, setState] = useState<ControlsState>({ mode: "photo", photo: null, scene: "dishCloseup", prompt: "", useBrand: true, ratio: initialRound?.ratio ?? "square", quality: initialRound?.quality ?? "standard" });
  const [rounds, setRounds] = useState<Round[]>(initialRound ? [initialRound] : []);
  const [activeId, setActiveId] = useState<string | null>(initialRound?.id ?? null);
  const [busy, setBusy] = useState(false);
  const [balance, setBalance] = useState(aiBalance);
  const [short, setShort] = useState<{ need: number; have: number } | null>(null);
  const [topupOpen, setTopupOpen] = useState(false);

  const cost = CHARGE_CREDITS[state.quality === "hd" ? "AI_HD" : "AI_STANDARD"];

  async function run(prompt: string, parent: Round | null) {
    if (cost > balance) return setShort({ need: cost, have: balance });
    setBusy(true);
    try {
      const created = await createGenerationAction({
        mode: state.mode,
        scene: parent ? null : state.scene,
        prompt,
        ratio: parent?.ratio ?? state.ratio,
        quality: state.quality,
        useBrand: state.useBrand && !!shopName,
        parentId: parent?.id ?? null,
        photo: parent || state.mode !== "photo" ? null : state.photo,
      });
      if (!created.ok) {
        if (created.code === "insufficient") setShort({ need: created.need ?? cost, have: created.have ?? 0 });
        else toast.error(created.error);
        return;
      }
      setBalance(created.balance);
      const result = await runGeneration(created.id);
      if (result.ok) {
        const round: Round = { id: result.id, url: result.url, prompt: prompt || t(`scenes.${state.scene ?? "dishCloseup"}`), quality: state.quality, ratio: parent?.ratio ?? state.ratio };
        setRounds((r) => [...r, round]);
        setActiveId(round.id);
      } else {
        if (typeof result.balance === "number") setBalance(result.balance);
        toast.error(t(result.reason === "rejected" ? "result.rejected" : "result.failed"));
      }
    } catch {
      toast.error(t("result.networkFailed"));
    } finally {
      setBusy(false);
      router.refresh();
    }
  }

  const active = rounds.find((r) => r.id === activeId) ?? rounds.at(-1) ?? null;

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <StudioControls
        state={state}
        onChange={(patch) => setState((s) => ({ ...s, ...patch }))}
        shopName={shopName}
        balance={balance}
        busy={busy}
        disabledReason={isDemo ? t("demoDisabled") : null}
        onGenerate={() => run(state.prompt.trim(), null)}
        onUploadError={(m) => toast.error(m)}
      />
      <StudioResult rounds={rounds} activeId={active?.id ?? null} onSelect={setActiveId} busy={busy} ratio={state.ratio} quality={state.quality} onRefine={(text) => run(text, active)} />
      <InsufficientDialog
        open={short !== null}
        onOpenChange={(open) => !open && setShort(null)}
        need={short?.need ?? cost}
        have={short?.have ?? balance}
        hasPlan={hasPlan}
        templateOnlyExcluded={initialBalance > aiBalance}
        onTopup={() => {
          setShort(null);
          setTopupOpen(true);
        }}
      />
      {topup && (
        <TopupDialog
          open={topupOpen}
          onOpenChange={setTopupOpen}
          currency={topup.currency}
          unitPrice={topup.unitPrice}
          onSubmit={(q) => {
            setTopupOpen(false);
            toast.info(`Stripe Checkout · ${q}`);
          }}
        />
      )}
    </div>
  );
}
