import "server-only";
import { prisma } from "./client";
import { sendMail } from "@/lib/mail";
import { getSmsGateway } from "@/lib/sms";
import type { Industry, OutreachType } from "@/generated/prisma/client";

// 手册第八章"召回时间点"：行业不同，三封间隔不同。手机维修没有标准三连召回，
// 复用"以旧换新"(30天)作为唯一一步，后两步留很长间隔实质上不触发。
const WINBACK_DAYS: Record<Industry, [number, number, number]> = {
  FOOD_TAKEAWAY: [30, 60, 90],
  BEAUTY_HAIR: [60, 75, 90],
  FITNESS: [14, 30, 75],
  PHONE_REPAIR: [30, 36500, 36500],
  OTHER: [30, 60, 90],
};

// 到期提醒：美发按"上次到店后约6-8周"，取中间值49天；其余行业暂不触发到期提醒
// （健身的"卡到期前14天"需要会员到期日，当前 EndCustomer 没有这个字段，留到以后接会员系统）。
const RENEWAL_REMINDER_DAYS: Partial<Record<Industry, number>> = { BEAUTY_HAIR: 49 };

const DAY_MS = 86400000;
function daysSince(d: Date) {
  return Math.floor((Date.now() - d.getTime()) / DAY_MS);
}

async function alreadySentSince(endCustomerId: string, type: OutreachType, since: Date) {
  const row = await prisma.outreachAutomation.findFirst({
    where: { endCustomerId, type, createdAt: { gte: since }, status: "SENT" },
    select: { id: true },
  });
  return !!row;
}

async function sendOutreach(input: { userId: string; endCustomerId: string; type: OutreachType; channel: "EMAIL" | "SMS"; to: string; subject: string; body: string }) {
  const record = await prisma.outreachAutomation.create({
    data: {
      userId: input.userId,
      endCustomerId: input.endCustomerId,
      type: input.type,
      channel: input.channel,
      triggerAt: new Date(),
      status: "SCHEDULED",
      payload: { to: input.to, subject: input.subject, body: input.body },
    },
  });
  try {
    if (input.channel === "EMAIL") await sendMail({ to: input.to, subject: input.subject, text: input.body });
    else await getSmsGateway().send({ to: input.to, body: input.body });
    await prisma.outreachAutomation.update({ where: { id: record.id }, data: { status: "SENT" } });
  } catch {
    await prisma.outreachAutomation.update({ where: { id: record.id }, data: { status: "SKIPPED" } });
  }
}

export async function sendWelcomeOutreach(endCustomerId: string) {
  const c = await prisma.endCustomer.findUniqueOrThrow({
    where: { id: endCustomerId },
    select: { userId: true, name: true, email: true, phone: true, user: { select: { profile: { select: { shopName: true, marketingEmailOptIn: true, marketingSmsOptIn: true } } } } },
  });
  const shop = c.user.profile?.shopName ?? "";
  const greeting = c.name ? `Hi ${c.name}` : "Hi";
  const body = `${greeting}, thanks for visiting ${shop}! Here's a small thank-you: show this message within 14 days for a free treat on us.`;
  if (c.email && c.user.profile?.marketingEmailOptIn) await sendOutreach({ userId: c.userId, endCustomerId, type: "WELCOME", channel: "EMAIL", to: c.email, subject: `Welcome to ${shop}`, body });
  else if (c.phone && c.user.profile?.marketingSmsOptIn) await sendOutreach({ userId: c.userId, endCustomerId, type: "WELCOME", channel: "SMS", to: c.phone, subject: "", body });
}

// 每天跑一次：消费后感谢 / 生日 / 到期提醒 / 召回三连。欢迎流程不在这里，
// 它是 EndCustomer 创建时立即触发的事件，见 sendWelcomeOutreach。
export async function runDailyOutreachScan(): Promise<{ scanned: number; sent: number }> {
  const customers = await prisma.endCustomer.findMany({
    include: { user: { select: { profile: { select: { industry: true, shopName: true, marketingEmailOptIn: true, marketingSmsOptIn: true } } } } },
  });
  let sent = 0;
  for (const c of customers) {
    const profile = c.user.profile;
    if (!profile || (!profile.marketingEmailOptIn && !profile.marketingSmsOptIn)) continue;
    const channel: "EMAIL" | "SMS" | null = c.email && profile.marketingEmailOptIn ? "EMAIL" : c.phone && profile.marketingSmsOptIn ? "SMS" : null;
    const to = channel === "EMAIL" ? c.email : channel === "SMS" ? c.phone : null;
    if (!channel || !to) continue;
    const shop = profile.shopName ?? "";
    const greeting = c.name ? `Hi ${c.name}` : "Hi";

    if (c.lastVisitAt) {
      const sinceVisit = daysSince(c.lastVisitAt);

      if (sinceVisit >= 1 && sinceVisit <= 2 && !(await alreadySentSince(c.id, "THANK_YOU", c.lastVisitAt))) {
        await sendOutreach({ userId: c.userId, endCustomerId: c.id, type: "THANK_YOU", channel, to, subject: `${shop}: thanks for coming in`, body: `${greeting}, thanks for your visit! Mind leaving us a quick Google review?` });
        sent++;
      }

      const renewalDays = profile.industry ? RENEWAL_REMINDER_DAYS[profile.industry] : undefined;
      if (renewalDays && sinceVisit >= renewalDays && sinceVisit < renewalDays + 7 && !(await alreadySentSince(c.id, "RENEWAL_REMINDER", c.lastVisitAt))) {
        await sendOutreach({ userId: c.userId, endCustomerId: c.id, type: "RENEWAL_REMINDER", channel, to, subject: `${shop}: time for a refresh?`, body: `${greeting}, it's been a while since your last visit — want us to hold your usual slot?` });
        sent++;
      }

      const [d1, d2, d3] = WINBACK_DAYS[profile.industry ?? "OTHER"];
      const steps: [number, "WINBACK_1" | "WINBACK_2" | "WINBACK_3"][] = [
        [d1, "WINBACK_1"],
        [d2, "WINBACK_2"],
        [d3, "WINBACK_3"],
      ];
      for (const [threshold, type] of steps) {
        if (sinceVisit >= threshold && sinceVisit < threshold + 7 && !(await alreadySentSince(c.id, type, c.lastVisitAt))) {
          await sendOutreach({ userId: c.userId, endCustomerId: c.id, type, channel, to, subject: `${shop}: we've missed you`, body: `${greeting}, we've missed you at ${shop} — come back and say hi.` });
          sent++;
        }
      }
    }

    if (c.birthday) {
      const today = new Date();
      const bday = new Date(Date.UTC(today.getUTCFullYear(), c.birthday.getUTCMonth(), c.birthday.getUTCDate()));
      const daysUntil = Math.floor((bday.getTime() - today.getTime()) / DAY_MS);
      const yearStart = new Date(Date.UTC(today.getUTCFullYear(), 0, 1));
      if (daysUntil >= 0 && daysUntil <= 7 && !(await alreadySentSince(c.id, "BIRTHDAY", yearStart))) {
        await sendOutreach({ userId: c.userId, endCustomerId: c.id, type: "BIRTHDAY", channel, to, subject: `${shop}: happy birthday month!`, body: `${greeting}, happy birthday month! Enjoy a treat on us this month at ${shop}.` });
        sent++;
      }
    }
  }
  return { scanned: customers.length, sent };
}
