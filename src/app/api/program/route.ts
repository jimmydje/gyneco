import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

// ─── Default program (used if none exists yet) ─────────────
const DEFAULT_DAYS = JSON.stringify([
  {
    day: "Day 1 — October 15, 2026",
    subtitle: "Opening & Keynotes",
    sessions: [
      ["08:30", "Registration & Welcome Coffee"],
      ["09:30", "Opening Ceremony"],
      ["10:30", "Keynote: Future of Maternal Healthcare"],
      ["14:00", "Parallel Sessions: Oncology & Endocrinology"],
      ["17:00", "Welcome Reception"],
    ],
  },
  {
    day: "Day 2 — October 16, 2026",
    subtitle: "Scientific Sessions",
    sessions: [
      ["09:00", "Plenary: Minimally Invasive Surgery"],
      ["11:00", "Workshop: Laparoscopic Suturing"],
      ["14:00", "Panel: Urogynecology Controversies"],
      ["16:30", "Oral & Poster Presentations"],
    ],
  },
  {
    day: "Day 3 — October 17, 2026",
    subtitle: "Workshops & Closing",
    sessions: [
      ["09:00", "Masterclass: Emergency Obstetrics"],
      ["11:00", "Roundtable: Global Women's Health"],
      ["14:00", "Free Communications"],
      ["16:00", "Awards & Closing Ceremony"],
    ],
  },
]);

const DEFAULT_VENUE = "Sheraton Annaba Hotel — Boulevard Che Guevara, Annaba 23000, Algeria";
const DEFAULT_CONTACT = "contact@annabagyneco2026.dz";

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
  });
}

// ─── PUT: admin-only — update the program ─────────────────
export async function PUT(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { days, venue, contact, _reset } = body;

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
        },
      });
    } else {
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
      },
    });
  } else {
    program = await prisma.program.create({
      data: {
        days: JSON.stringify(days),
        venue: venue || DEFAULT_VENUE,
        contact: contact || DEFAULT_CONTACT,
      },
    });
  }

  return NextResponse.json({
    days: JSON.parse(program.days),
    venue: program.venue,
    contact: program.contact,
  });
}
