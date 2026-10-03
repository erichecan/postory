import "server-only";
import { randomBytes } from "node:crypto";

export type WhatsAppGateway = {
  mode: "live" | "fake";
  sendApprovalRequest(input: { to: string; caption: string; imageUrl: string }): Promise<{ providerMessageId: string }>;
};

function liveGateway(accountSid: string, authToken: string, from: string): WhatsAppGateway {
  return {
    mode: "live",
    async sendApprovalRequest({ to, caption, imageUrl }) {
      const body = new URLSearchParams({
        To: `whatsapp:${to}`,
        From: `whatsapp:${from}`,
        Body: `${caption}\n\n回复 OK 确认发布，24 小时内无回复将自动发布。`,
        MediaUrl: imageUrl,
      });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body,
      });
      const json = (await res.json().catch(() => null)) as { sid?: string; message?: string } | null;
      if (!res.ok) throw new Error(`twilio whatsapp send failed: HTTP ${res.status} ${json?.message ?? ""}`);
      return { providerMessageId: json?.sid ?? "" };
    },
  };
}

function fakeGateway(): WhatsAppGateway {
  return {
    mode: "fake",
    async sendApprovalRequest({ to, caption, imageUrl }) {
      const id = `wa_fake_${randomBytes(6).toString("hex")}`;
      console.info(`[whatsapp:fake] to=${to} id=${id}\n${caption}\nimage=${imageUrl}`);
      return { providerMessageId: id };
    },
  };
}

export function getWhatsAppGateway(): WhatsAppGateway {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_WHATSAPP_FROM;
  if (!sid || !token || !from) return fakeGateway();
  return liveGateway(sid, token, from);
}
