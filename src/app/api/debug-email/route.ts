export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
  const results: Record<string, unknown> = {};

  const apiKey = process.env.RESEND_API_KEY;
  results.apiKeyPresent = !!apiKey;
  results.apiKeyPreview = apiKey
    ? apiKey.slice(0, 6) + "..." + apiKey.slice(-4)
    : "NOT SET";

  if (!apiKey) {
    return NextResponse.json(
      { error: "RESEND_API_KEY is not set in environment", ...results },
      { status: 500 }
    );
  }

  const resend = new Resend(apiKey);

  // Try sending a test email
  try {
    const { data, error } = await resend.emails.send({
      from: "Gyneco Test <noreply@gynecoannaba.com>",
      to: ["omardjemil25@gmail.com"],
      subject: "Gyneco — Resend Diagnostic Test",
      html: "<p>If you received this, Resend is configured correctly.</p>",
    });

    results.sendResult = error
      ? { success: false, error }
      : { success: true, id: data?.id };
  } catch (err) {
    results.sendResult = {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // Check domain status
  try {
    const domains = await resend.domains.list();
    const raw = domains as unknown as {
      data?: { data?: Array<{ name: string; status: string }> };
    };
    const list = raw?.data?.data ?? [];
    const domain = list.find((d) => d.name === "gynecoannaba.com");
    results.domain = domain
      ? { found: true, status: domain.status }
      : { found: false, allDomains: list.map((d) => d.name) };
  } catch (err) {
    results.domain = {
      found: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return NextResponse.json(results);
}
