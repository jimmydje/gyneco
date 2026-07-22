export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendConfirmationEmail } from "@/lib/email";

export async function POST(req: NextRequest) {
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

  // Send confirmation email (non-blocking)
  sendConfirmationEmail({ to: normalizedEmail, firstName, lastName, lang: lang || "fr" }).catch(
    () => {}
  );

  return NextResponse.json({ success: true }, { status: 201 });
}
