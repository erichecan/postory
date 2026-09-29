import "server-only";

export type Mail = { to: string; subject: string; text: string };

export async function sendMail(mail: Mail): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM ?? "Postory <no-reply@postory.app>";
  if (!key) {
    console.info(`[mail:dev] to=${mail.to} subject=${mail.subject}\n${mail.text}`);
    return;
  }
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [mail.to], subject: mail.subject, text: mail.text }),
  });
  if (!res.ok) throw new Error(`mail send failed: ${res.status} ${await res.text()}`);
}
