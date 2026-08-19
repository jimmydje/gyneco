export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail } from "@/lib/email";
import { REGISTRATIONS_CLOSED } from "@/lib/config";

export async function POST(req: NextRequest) {
  // Hard stop: close registrations without touching the DB or existing users.
  if (REGISTRATIONS_CLOSED) {
    return NextResponse.json(
      { error: "Les inscriptions sont clôturées. / Registrations are closed." },
      { status: 403 }
    );
  }

  const { email, firstName, lastName, dateOfBirth, grade, specialite, workplace, phone, lang } =
    await req.json();

  if (!email || !firstName || !lastName || !grade || !workplace || !dateOfBirth) {
    return NextResponse.json(
      { error: "All required fields must be filled." },
      { status: 400 }
    );
  }

  const normalizedEmail = (email as string).toLowerCase().trim();

  const existing = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existing) {
    return NextResponse.json(
      { error: "An account with this email already exists." },
      { status: 409 }
    );
  }

  await prisma.user.create({
    data: {
      email: normalizedEmail,
      firstName,
      lastName,
      dateOfBirth: new Date(dateOfBirth),
      grade,
      specialite: specialite || "",
      workplace,
      phone: phone || null,
    },
  });

  // Send confirmation email
  const emailResult = await sendConfirmationEmail({
    to: normalizedEmail,
    firstName,
    lastName,
    lang: lang || "fr",
  });

  if (!emailResult.success) {
    console.error("[EMAIL] Registration email failed:", emailResult.error);
    return NextResponse.json(
      {
        success: true,
        warning: "Registered but confirmation email could not be sent",
        emailError: typeof emailResult.error === "object"
          ? JSON.stringify(emailResult.error)
          : String(emailResult.error),
      },
      { status: 201 }
    );
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
