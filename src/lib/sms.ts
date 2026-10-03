import "server-only";

export type SmsGateway = {
  mode: "live" | "fake";
  send(input: { to: string; body: string }): Promise<void>;
};

function liveGateway(accountSid: string, authToken: string, from: string): SmsGateway {
  return {
    mode: "live",
    async send({ to, body }) {
      const params = new URLSearchParams({ To: to, From: from, Body: body });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Messages.json`, {
        method: "POST",
        headers: {
          Authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString("base64")}`,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: params,
      });
      if (!res.ok) throw new Error(`twilio sms send failed: HTTP ${res.status} ${await res.text()}`);
    },
  };
}

function fakeGateway(): SmsGateway {
  return {
    mode: "fake",
    async send({ to, body }) {
      console.info(`[sms:fake] to=${to}\n${body}`);
    },
  };
}

export function getSmsGateway(): SmsGateway {
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const from = process.env.TWILIO_SMS_FROM;
  if (!sid || !token || !from) return fakeGateway();
  return liveGateway(sid, token, from);
}
