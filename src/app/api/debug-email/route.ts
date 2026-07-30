export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1. Check if API key is set
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

  // 2. Try sending a test email
  try {
    const { data, error } = await resend.emails.send({
      from: "Gyneco Test <noreply@gynecoannaba.com>",
      to: [apiKey.startsWith("re_") ? "omardjemil25@gmail.com" : "test@example.com"],
      subject: "Gyneco — Resend Diagnostic Test",
      html: "<p>If you received this, Resend is configured correctly.</p>",
    });

    results.sendResult = error
      ? { success: false, error: error }
      : { success: true, id: data?.id };
  } catch (err) {
    results.sendResult = {
      success: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  // 3. Check domain status
  try {
    const domains = await resend.domains.list();
    const domain = domains.data?.find(
      (d: { name: string }) => d.name === "gynecoannaba.com"
    );
    results.domain = domain
      ? { found: true, status: (domain as Record<string, unknown>).status }
      : { found: false, allDomains: domains.data?.map((d: { name: string }) => d.name) };
  } catch (err) {
    results.domain = {
      found: false,
      error: err instanceof Error ? err.message : String(err),
    };
  }

  return NextResponse.json(results);
}
