"use client";

import { useState, useTransition } from "react";
import { issueDemoTrialOverrideAction } from "@/lib/actions/demo-trial";

export function DemoTrialOverrideForm() {
  const [reason, setReason] = useState("");
  const [token, setToken] = useState("");
  const [expiry, setExpiry] = useState("");
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  function issue() {
    setToken(""); setExpiry(""); setError("");
    startTransition(async () => {
      const result = await issueDemoTrialOverrideAction(reason);
      if (!result.ok) { setError(result.error); return; }
      setToken(result.token);
      setExpiry(new Date(result.expiresAt).toLocaleTimeString());
    });
  }

  return <section className="space-y-4 rounded-xl border p-5">
    <div><h2 className="text-lg font-semibold">单次试用放行码</h2><p className="mt-1 text-sm text-muted-foreground">顾客电话联系并被误拦时使用。放行码 15 分钟有效、仅能生成一张图片、使用一次，仍受每日总量限制。</p></div>
    <label className="block text-sm">处理说明（可选）<input value={reason} onChange={e => setReason(e.target.value)} maxLength={255} className="mt-1 w-full rounded-md border px-3 py-2" /></label>
    <button type="button" onClick={issue} disabled={pending} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{pending ? "生成中…" : "生成一次性放行码"}</button>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    {token && <div className="rounded-md bg-muted p-3"><p className="text-xs">仅显示这一次，请电话告知顾客。有效至 {expiry}。</p><code className="mt-2 block break-all text-lg font-semibold">{token}</code></div>}
  </section>;
}
