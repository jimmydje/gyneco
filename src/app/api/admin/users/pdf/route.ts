import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { generateRegistrantsPdf } from "@/lib/pdf";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang") || "fr";

  const users = await prisma.user.findMany({
    orderBy: { registeredAt: "asc" },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      grade: true,
      specialite: true,
      workplace: true,
      phone: true,
      registeredAt: true,
    },
  });

  const pdfBuffer = await generateRegistrantsPdf({ registrants: users, lang });

  const filename = "inscrits-gynecologie-annaba-2026.pdf";

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
}
