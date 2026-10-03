import { createHmac } from "node:crypto";
import type { NextRequest } from "next/server";
import { approveByReply } from "@/lib/db/approval";
import { appUrl } from "@/lib/app-url";

// Twilio 签名校验算法：HMAC-SHA1(authToken, 完整URL + 按key排序拼接的 "key"+"value")，
// base64 后与请求头 X-Twilio-Signature 比对。见 Twilio 官方文档 Security 一节。
function verifyTwilioSignature(url: string, params: Record<string, string>, signature: string, authToken: string): boolean {
  const sorted = Object.keys(params)
    .sort()
    .reduce((acc, k) => acc + k + params[k], url);
  const expected = createHmac("sha1", authToken).update(sorted, "utf8").digest("base64");
  return expected === signature;
}

export async function POST(req: NextRequest) {
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const formData = await req.formData();
  const params: Record<string, string> = {};
  for (const [k, v] of formData.entries()) params[k] = String(v);

  if (authToken) {
    const signature = req.headers.get("X-Twilio-Signature");
    if (!signature || !verifyTwilioSignature(`${appUrl()}/api/whatsapp/webhook`, params, signature, authToken)) {
      return new Response("invalid signature", { status: 403 });
    }
  }

  const from = (params.From ?? "").replace(/^whatsapp:/, "");
  const body = (params.Body ?? "").trim().toUpperCase();
  if (from && body === "OK") await approveByReply(from);

  return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
}
