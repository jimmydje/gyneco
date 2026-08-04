import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { generateProgramPdf } from "@/lib/pdf";
import { existsSync, readFileSync, writeFileSync, unlinkSync, mkdirSync } from "fs";
import { join } from "path";

export const dynamic = "force-dynamic";

const PDF_PATH = join(process.cwd(), "public", "program.pdf");

const DEFAULT_DAYS = [
  {
    day: "3 Septembre 2026",
    subtitle: "Programme de la journée",
    sessions: [
      ["08:30", "Accueil & Café de bienvenue"],
      ["09:00", "Cérémonie d'ouverture"],
      ["09:30", "Conférences plénières"],
      ["10:30", "Pause-café"],
      ["11:00", "Ateliers & Sessions parallèles"],
      ["12:30", "Déjeuner"],
      ["14:00", "Communications orales"],
      ["16:00", "Table ronde & Clôture"],
    ],
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lang = searchParams.get("lang") || "fr";

  // If an uploaded PDF exists, serve it directly
  if (existsSync(PDF_PATH)) {
    const pdfBuffer = readFileSync(PDF_PATH);
    const filename = "programme-gynecologie-annaba-2026.pdf";
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
        "Content-Length": String(pdfBuffer.length),
      },
    });
  }

  // Otherwise, generate PDF from program data
  let program = await prisma.program.findFirst();

  const days = program ? JSON.parse(program.days) : DEFAULT_DAYS;
  const venue =
    program?.venue || "Hôtel Seybouse International — Annaba, Algérie";
  const phone = program?.phone || "038871324 / 038871678";
  const contact =
    program?.contact || "journees.gynea.annaba2026@gmail.com";

  const pdfBuffer = generateProgramPdf({
    days,
    venue,
    phone,
    contact,
    lang,
  });

  const filename =
    lang === "en"
      ? "program-annaba-gynecology-2026.pdf"
      : "programme-gynecologie-annaba-2026.pdf";

  return new NextResponse(new Uint8Array(pdfBuffer), {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${filename}"`,
      "Content-Length": String(pdfBuffer.length),
    },
  });
}

// ─── POST: admin-only — upload a PDF file ─────────────────
export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are allowed" }, { status: 400 });
    }

    // Ensure public directory exists
    const publicDir = join(process.cwd(), "public");
    if (!existsSync(publicDir)) {
      mkdirSync(publicDir, { recursive: true });
    }

    const arrayBuffer = await file.arrayBuffer();
    writeFileSync(PDF_PATH, Buffer.from(arrayBuffer));

    return NextResponse.json({ success: true, size: file.size });
  } catch (err) {
    console.error("[PDF UPLOAD] Error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

// ─── DELETE: admin-only — remove uploaded PDF ──────────────
export async function DELETE() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (existsSync(PDF_PATH)) {
      unlinkSync(PDF_PATH);
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PDF DELETE] Error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
