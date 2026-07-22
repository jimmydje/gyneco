import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { sendConfirmationEmail } from "@/lib/email";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const users = await prisma.user.findMany({
    orderBy: { registeredAt: "desc" },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      grade: true,
      specialite: true,
      workplace: true,
      phone: true,
      dateOfBirth: true,
      registeredAt: true,
    },
  });

  return NextResponse.json({ users });
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { email, firstName, lastName, dateOfBirth, grade, specialite, workplace, phone, sendEmail } = body;

  if (!email || !firstName || !lastName || !grade || !workplace || !dateOfBirth) {
    return NextResponse.json(
      { error: "All required fields must be filled." },
      { status: 400 }
    );
  }

  const normalizedEmail = email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    return NextResponse.json(
      { error: "A user with this email already exists." },
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

  if (sendEmail) {
    sendConfirmationEmail({ to: normalizedEmail, firstName, lastName }).catch(() => {});
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
