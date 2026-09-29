"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { InsufficientDialog } from "@/components/billing/insufficient-dialog";
import { TopupDialog } from "@/components/billing/topup-dialog";
import { CHARGE_CREDITS } from "@/lib/billing/plan-math";
import type { Currency } from "@/types/commerce";
import { StudioControls, type ControlsState } from "./studio-controls";
import type { Round } from "./studio-options";
import { StudioResult } from "./studio-result";

const SAMPLE_RESULTS = [
  "/assets/templates/orshot-assets/6aaffaed46f795d6.jpg",
  "/assets/templates/orshot-assets/de2aae1a89776307.jpg",
  "/assets/templates/orshot-assets/066535b8606ace58.jpg",
  "/assets/templates/orshot-assets/9decac8e138dce86.jpg",
];

export function CreateStudio({
  shopName,
  initialBalance,
  aiBalance,
  isDemo,
  topup,
}: {
  shopName: string | null;
  initialBalance: number;
  aiBalance: number;
  isDemo: boolean;
  topup: { currency: Currency; unitPrice: number } | null;
}) {
  const t = useTranslations("create");
  const [state, setState] = useState<ControlsState>({ mode: "photo", photo: null, scene: "dishCloseup", prompt: "", useBrand: true, ratio: "square", quality: "standard" });
  const [rounds, setRounds] = useState<Round[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [balance, setBalance] = useState(aiBalance);
  const [short, setShort] = useState(false);
  const [topupOpen, setTopupOpen] = useState(false);

  const cost = CHARGE_CREDITS[state.quality === "hd" ? "AI_HD" : "AI_STANDARD"];

  function run(prompt: string) {
    if (cost > balance) {
      setShort(true);
      return;
    }
    setBusy(true);
    setBalance((b) => b - cost);
    setTimeout(() => {
      const round: Round = { id: crypto.randomUUID(), url: SAMPLE_RESULTS[rounds.length % SAMPLE_RESULTS.length], prompt, quality: state.quality, ratio: state.ratio };
      setRounds((r) => [...r, round]);
      setActiveId(round.id);
      setBusy(false);
    }, 1400);
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[340px_1fr]">
      <StudioControls
        state={state}
        onChange={(patch) => setState((s) => ({ ...s, ...patch }))}
        shopName={shopName}
        balance={balance}
        busy={busy}
        disabledReason={isDemo ? t("demoDisabled") : null}
        onGenerate={() => run(state.prompt || t(`scenes.${state.scene ?? "dishCloseup"}`))}
        onUploadError={(m) => toast.error(m)}
      />
      <StudioResult
        rounds={rounds}
        activeId={activeId}
        onSelect={setActiveId}
        busy={busy}
        ratio={state.ratio}
        quality={state.quality}
        onRefine={run}
        onToEditor={() => toast.info(t("result.toEditor"))}
      />
      <InsufficientDialog
        open={short}
        onOpenChange={setShort}
        need={cost}
        have={balance}
        hasPlan={topup !== null}
        templateOnlyExcluded={initialBalance > aiBalance}
        onTopup={() => {
          setShort(false);
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
