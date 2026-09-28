"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { adminCreateUserAction } from "@/lib/actions/admin";

export function CreateAccountForm() {
  const [state, action, pending] = useActionState(adminCreateUserAction, undefined);
  const formRef = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) {
      toast.success(state.message ?? "已开通");
      formRef.current?.reset();
    }
  }, [state]);
  return (
    <form ref={formRef} action={action} className="flex flex-col gap-4 rounded-xl border bg-card p-5">
      <div>
        <h2 className="font-semibold">线下开通账号</h2>
        <p className="mt-1 text-xs text-muted-foreground">客户在门店消费后，在这里给他建账号，把手机号和初始密码告诉他。</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-1.5"><Label htmlFor="a-phone">手机号</Label><Input id="a-phone" name="phone" inputMode="numeric" required className="h-9" /></div>
        <div className="flex flex-col gap-1.5"><Label htmlFor="a-name">店铺 / 客户名称</Label><Input id="a-name" name="name" required className="h-9" /></div>
        <div className="flex flex-col gap-1.5"><Label htmlFor="a-pass">初始密码</Label><Input id="a-pass" name="password" placeholder="至少 8 位" required className="h-9" /></div>
      </div>
      {state?.error && <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <div><Button type="submit" disabled={pending}>{pending ? "开通中…" : "开通账号"}</Button></div>
    </form>
  );
}
