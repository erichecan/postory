"use client";

import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { demoLoginAction } from "@/lib/actions/auth";
import { DEMO_PROFILE } from "@/lib/demo";

export function DemoLogin() {
  const [state, formAction, pending] = useActionState(demoLoginAction, undefined);
  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-2">
      <Button type="submit" size="lg" className="h-11 text-[15px]" disabled={pending}>
        {pending ? "正在进入…" : "用演示店铺一键登录"}
      </Button>
      <p className="text-center text-xs text-muted-foreground">{DEMO_PROFILE.shopName} · 资料已填好，所有人共用这个账号</p>
      {state?.error && <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-white/10" />
        或用手机号登录
        <span className="h-px flex-1 bg-white/10" />
      </div>
    </form>
  );
}
