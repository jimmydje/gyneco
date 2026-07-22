import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ─── Default program (used if none exists yet) ─────────────
const DEFAULT_DAYS = JSON.stringify([
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
]);

const DEFAULT_VENUE = "Hôtel Seybouse International — Annaba, Algérie";
const DEFAULT_CONTACT = "journees.gynea.annaba2026@gmail.com";
const DEFAULT_PHONE = "038871324 / 038871678";

// ─── GET: public — return the current program ──────────────
export async function GET() {
  let program = await prisma.program.findFirst();

  // Auto-create default program if none exists
  if (!program) {
    program = await prisma.program.create({
      data: {
        days: DEFAULT_DAYS,
        venue: DEFAULT_VENUE,
        contact: DEFAULT_CONTACT,
      },
    });
  }

  return NextResponse.json({
    days: JSON.parse(program.days),
    venue: program.venue,
    contact: program.contact,
    phone: program.phone || DEFAULT_PHONE,
  });
}

// ─── PUT: admin-only — update the program ─────────────────
export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { days, venue, contact, phone, _reset } = body;

  // Reset to defaults
  if (_reset) {
    let program = await prisma.program.findFirst();
    if (program) {
      program = await prisma.program.update({
        where: { id: program.id },
        data: {
          days: DEFAULT_DAYS,
          venue: DEFAULT_VENUE,
          contact: DEFAULT_CONTACT,
          phone: DEFAULT_PHONE,
        },
      });
    } else {
      program = await prisma.program.create({
        data: {
          days: DEFAULT_DAYS,
          venue: DEFAULT_VENUE,
          contact: DEFAULT_CONTACT,
          phone: DEFAULT_PHONE,
        },
      });
    }
    return NextResponse.json({
      days: JSON.parse(program.days),
      venue: program.venue,
      contact: program.contact,
      phone: program.phone || DEFAULT_PHONE,
    });
  }

  if (!Array.isArray(days)) {
    return NextResponse.json({ error: "Invalid days array." }, { status: 400 });
  }

  let program = await prisma.program.findFirst();

  if (program) {
    program = await prisma.program.update({
      where: { id: program.id },
      data: {
        days: JSON.stringify(days),
        venue: venue ?? "",
        contact: contact ?? "",
        phone: phone ?? "",
      },
    });
  } else {
    program = await prisma.program.create({
      data: {
        days: JSON.stringify(days),
        venue: venue || DEFAULT_VENUE,
        contact: contact || DEFAULT_CONTACT,
        phone: phone || DEFAULT_PHONE,
      },
    });
  }

  return NextResponse.json({
    days: JSON.parse(program.days),
    venue: program.venue,
    contact: program.contact,
    phone: program.phone || DEFAULT_PHONE,
  });
}
