import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: { name?: string; email?: string; message?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const { name, email, message } = body;
  if (!email || !message) {
    return NextResponse.json({ ok: false, error: "email and message are required" }, { status: 422 });
  }

  const { RESEND_API_KEY, CONTACT_TO_EMAIL } = process.env;

  // Without a provider configured, accept + log (no-op delivery) so local dev works.
  if (!RESEND_API_KEY || !CONTACT_TO_EMAIL) {
    console.log("[contact] (no provider configured):", { name, email, message });
    return NextResponse.json({ ok: true, delivered: false });
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "portfolio@iamashutosh.com",
        to: CONTACT_TO_EMAIL,
        reply_to: email,
        subject: `Portfolio message from ${name || email}`,
        text: `From: ${name || "—"} <${email}>\n\n${message}`,
      }),
    });
    if (!res.ok) {
      return NextResponse.json({ ok: false, error: "delivery failed" }, { status: 502 });
    }
    return NextResponse.json({ ok: true, delivered: true });
  } catch {
    return NextResponse.json({ ok: false, error: "delivery failed" }, { status: 502 });
  }
}
