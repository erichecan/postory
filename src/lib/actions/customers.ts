"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { assertUser } from "@/lib/auth/session";
import { createEndCustomer, deleteEndCustomer } from "@/lib/db/end-customers";
import type { FormState } from "@/lib/validation";

const emailField = z.union([z.literal(""), z.string().trim().toLowerCase().max(254).pipe(z.email())]);
const phoneField = z.union([z.literal(""), z.string().trim().max(20).regex(/^[+0-9 ()-]{6,20}$/)]);
const birthdayField = z.union([z.literal(""), z.string().regex(/^\d{4}-\d{2}-\d{2}$/)]);

export async function createCustomerAction(_: FormState, formData: FormData): Promise<FormState> {
  const user = await assertUser();
  const t = await getTranslations("customers.errors");

  const name = (formData.get("name") as string | null)?.trim().slice(0, 64) || null;
  const emailRaw = ((formData.get("email") as string | null) ?? "").trim();
  const phoneRaw = ((formData.get("phone") as string | null) ?? "").trim();
  const birthdayRaw = ((formData.get("birthday") as string | null) ?? "").trim();

  const email = emailField.safeParse(emailRaw);
  if (!email.success) return { error: t("emailInvalid") };
  const phone = phoneField.safeParse(phoneRaw);
  if (!phone.success) return { error: t("phoneInvalid") };
  const birthday = birthdayField.safeParse(birthdayRaw);
  if (!birthday.success) return { error: t("birthdayInvalid") };
  if (!email.data && !phone.data) return { error: t("needContact") };

  await createEndCustomer(user.id, {
    name,
    email: email.data ? email.data.toLowerCase() : null,
    phone: phone.data || null,
    birthday: birthday.data ? new Date(birthday.data) : null,
  });
  revalidatePath("/profile/customers");
  return { ok: true };
}

export async function deleteCustomerAction(id: string): Promise<{ ok: boolean; error?: string }> {
  const user = await assertUser();
  const parsed = z.string().max(40).safeParse(id);
  if (!parsed.success) return { ok: false, error: "invalid" };
  const deleted = await deleteEndCustomer(user.id, parsed.data);
  if (!deleted) return { ok: false, error: "notFound" };
  revalidatePath("/profile/customers");
  return { ok: true };
}
