"use client";

import Link from "next/link";
import { useActionState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FormState } from "@/lib/validation";

type Mode = "login" | "register";

const COPY = {
  login: { title: "登录", submit: "登录", switchText: "还没有账号？", switchHref: "/register", switchLabel: "免费注册" },
  register: { title: "注册账号", submit: "注册并开始", switchText: "已有账号？", switchHref: "/login", switchLabel: "去登录" },
} as const;

export function AuthForm({
  mode,
  action,
  next,
}: {
  mode: Mode;
  action: (state: FormState, data: FormData) => Promise<FormState>;
  next?: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const copy = COPY[mode];
  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold">{copy.title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {mode === "login" ? "欢迎回来。在门店开通的账号也在这里登录。" : "用手机号注册，一分钟做出第一张宣传图。"}
        </p>
      </div>
      {next && <input type="hidden" name="next" value={next} />}
      <div className="flex flex-col gap-2">
        <Label htmlFor="phone">手机号</Label>
        <Input id="phone" name="phone" inputMode="numeric" autoComplete="tel" placeholder="11 位手机号" required className="h-10" />
      </div>
      {mode === "register" && (
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">店铺 / 品牌名称</Label>
          <Input id="name" name="name" placeholder="例如：小满咖啡" required className="h-10" />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete={mode === "login" ? "current-password" : "new-password"}
          placeholder={mode === "register" ? "至少 8 位" : ""}
          required
          className="h-10"
        />
      </div>
      {state?.error && <p className="rounded-md bg-destructive/15 px-3 py-2 text-sm text-destructive">{state.error}</p>}
      <Button type="submit" size="lg" className="h-10" disabled={pending}>
        {pending ? "请稍候…" : copy.submit}
      </Button>
      <p className="text-center text-sm text-muted-foreground">
        {copy.switchText}
        <Link href={copy.switchHref} className="ml-1 text-primary hover:underline">
          {copy.switchLabel}
        </Link>
      </p>
    </form>
  );
}
