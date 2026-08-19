import PDFDocument from "pdfkit";

type ProgramDay = {
  day: string;
  subtitle: string;
  sessions: [string, string][];
};

export function generateProgramPdf({
  days,
  venue,
  phone,
  contact,
  lang,
}: {
  days: ProgramDay[];
  venue: string;
  phone: string;
  contact: string;
  lang?: string;
}): Buffer {
  const isFr = lang !== "en";

  const t = isFr
    ? {
        title: "Programme de la Journée",
        subtitle: "4ᵉ Journée de Gynécologie & Obstétrique d'Annaba",
        date: "03 Septembre 2026",
        venueLabel: "Lieu",
        contactLabel: "Contact",
        phoneLabel: "Tél",
        footer: "© 2026 Journées de Gynécologie & Obstétrique d'Annaba",
      }
    : {
        title: "Day Program",
        subtitle: "4th Annaba Gynecology & Obstetrics Day",
        date: "September 3, 2026",
        venueLabel: "Venue",
        contactLabel: "Contact",
        phoneLabel: "Phone",
        footer: "© 2026 Annaba Gynecology & Obstetrics Day",
      };

  const doc = new PDFDocument({
    size: "A4",
    margins: { top: 40, bottom: 40, left: 60, right: 60 },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  // ─── Header ────────────────────────────────────────────
  doc
    .fontSize(11)
    .fillColor("#99324d")
    .text("♀", { align: "center" });

  doc.moveDown(0.3);

  doc
    .font("Helvetica-Bold")
    .fontSize(20)
    .fillColor("#1a1a2e")
    .text(t.title, { align: "center" });

  doc.moveDown(0.2);

  doc
    .font("Helvetica")
    .fontSize(12)
    .fillColor("#5a5a72")
    .text(t.subtitle, { align: "center" });

  doc.moveDown(0.2);

  doc
    .fontSize(10)
    .fillColor("#8a8a9a")
    .text(t.date, { align: "center" });

  doc.moveDown(1.5);

  // ─── Venue info box ────────────────────────────────────
  const boxY = doc.y;
  doc
    .roundedRect(60, boxY, doc.page.width - 120, 50, 6)
    .fillAndStroke("#faf4f5", "#99324d");

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#99324d")
    .text(`${t.venueLabel} : `, 75, boxY + 12, { continued: true })
    .font("Helvetica")
    .fillColor("#1a1a2e")
    .text(venue);

  if (phone) {
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#99324d")
      .text(`${t.phoneLabel} : `, 75, boxY + 30, { continued: true })
      .font("Helvetica")
      .fillColor("#1a1a2e")
      .text(phone);
  }

  doc.moveDown(4);

  // ─── Program days ──────────────────────────────────────
  for (const day of days) {
    // Check if we need a new page
    if (doc.y > doc.page.height - 200) {
      doc.addPage();
    }

    // Day header
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .fillColor("#99324d")
      .text(day.day);

    if (day.subtitle) {
      doc.moveDown(0.1);
      doc
        .font("Helvetica-Oblique")
        .fontSize(10)
        .fillColor("#8a8a9a")
        .text(day.subtitle);
    }

    doc.moveDown(0.5);

    // Sessions table
    const tableTop = doc.y;
    const col1X = 60;
    const col2X = 130;
    const rowHeight = 24;
    const availableWidth = doc.page.width - 120;

    // Header row
    doc
      .rect(col1X, tableTop, 70, rowHeight)
      .fill("#99324d");
    doc
      .rect(col2X, tableTop, availableWidth - 70, rowHeight)
      .fill("#99324d");

    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#ffffff")
      .text(isFr ? "Heure" : "Time", col1X + 8, tableTop + 7, { width: 54, ellipsis: true });
    doc
      .font("Helvetica-Bold")
      .fontSize(9)
      .fillColor("#ffffff")
      .text(isFr ? "Session" : "Session", col2X + 8, tableTop + 7, {
        width: availableWidth - 86,
        ellipsis: true,
      });

    let yPos = tableTop + rowHeight;
    let alt = false;

    for (const [time, title] of day.sessions) {
      if (alt) {
        doc
          .rect(col1X, yPos, 70, rowHeight)
          .fill("#faf4f5");
        doc
          .rect(col2X, yPos, availableWidth - 70, rowHeight)
          .fill("#faf4f5");
      }
      alt = !alt;

      doc
        .font("Helvetica-Bold")
        .fontSize(10)
        .fillColor("#99324d")
        .text(time, col1X + 8, yPos + 6, { width: 54, ellipsis: true });

      doc
        .font("Helvetica")
        .fontSize(10)
        .fillColor("#1a1a2e")
        .text(title, col2X + 8, yPos + 6, {
          width: availableWidth - 86,
          ellipsis: true,
        });

      yPos += rowHeight;
    }

    doc.y = yPos + 16;
  }

  // ─── Footer ────────────────────────────────────────────
  const bottomY = doc.page.height - 60;
  doc
    .moveTo(60, bottomY)
    .lineTo(doc.page.width - 60, bottomY)
    .strokeColor("#e8dfe2")
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#8a8a9a")
    .text(t.footer, 60, bottomY + 12, {
      align: "center",
      width: doc.page.width - 120,
    });

  if (contact) {
    doc
      .fontSize(8)
      .fillColor("#8a8a9a")
      .text(`${t.contactLabel} : ${contact}`, 60, bottomY + 24, {
        align: "center",
        width: doc.page.width - 120,
      });
  }

  doc.end();

  return Buffer.concat(chunks);
}

// ─── Registrants list PDF ────────────────────────────────

export type Registrant = {
  firstName: string;
  lastName: string;
  email: string;
  grade: string;
  specialite: string;
  workplace: string;
  phone: string | null;
  registeredAt: Date | string;
};

function fmtDate(d: Date | string, withTime = false): string {
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "";
  const dd = String(date.getDate()).padStart(2, "0");
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yyyy = date.getFullYear();
  if (!withTime) return `${dd}/${mm}/${yyyy}`;
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
}

export function generateRegistrantsPdf({
  registrants,
  lang,
}: {
  registrants: Registrant[];
  lang?: string;
}): Promise<Buffer> {
  const isFr = lang !== "en";

  const t = isFr
    ? {
        title: "Liste des inscrits",
        subtitle: "4ᵉ Journée de Gynécologie & Obstétrique d'Annaba",
        date: "03 Septembre 2026",
        total: "Total",
        footer: "© 2026 Journées de Gynécologie & Obstétrique d'Annaba",
        cols: [
          "N°",
          "Nom & Prénom",
          "Email",
          "Grade",
          "Spécialité",
          "Établissement",
          "Téléphone",
          "Inscrit le",
        ],
      }
    : {
        title: "Registrants List",
        subtitle: "4th Annaba Gynecology & Obstetrics Day",
        date: "September 3, 2026",
        total: "Total",
        footer: "© 2026 Annaba Gynecology & Obstetrics Day",
        cols: [
          "#",
          "Full Name",
          "Email",
          "Grade",
          "Specialty",
          "Workplace",
          "Phone",
          "Registered",
        ],
      };

  const doc = new PDFDocument({
    size: "A4",
    layout: "landscape",
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk: Buffer) => chunks.push(chunk));

  const leftX = 40;
  const rightX = doc.page.width - 40;
  const tableWidth = rightX - leftX;

  // Column widths (sum = tableWidth)
  const colWidths = [28, 130, 155, 85, 90, 115, 72, 87];

  const colX: number[] = [];
  let cx = leftX;
  for (const w of colWidths) {
    colX.push(cx);
    cx += w;
  }

  // ─── Header ────────────────────────────────────────────
  doc
    .font("Helvetica-Bold")
    .fontSize(18)
    .fillColor("#1a1a2e")
    .text(t.title, { align: "center" });

  doc.moveDown(0.2);

  doc
    .font("Helvetica")
    .fontSize(11)
    .fillColor("#5a5a72")
    .text(t.subtitle, { align: "center" });

  doc.moveDown(0.2);

  doc
    .fontSize(9)
    .fillColor("#8a8a9a")
    .text(t.date, { align: "center" });

  doc.moveDown(1.2);

  doc
    .font("Helvetica-Bold")
    .fontSize(10)
    .fillColor("#99324d")
    .text(`${t.total} : ${registrants.length}`, { align: "right" });

  doc.moveDown(0.5);

  const headerRowHeight = 22;
  const rowHeight = 20;

  const drawHeader = (y: number) => {
    for (let i = 0; i < colWidths.length; i++) {
      doc
        .rect(colX[i], y, colWidths[i], headerRowHeight)
        .fill("#99324d");
      doc
        .font("Helvetica-Bold")
        .fontSize(8)
        .fillColor("#ffffff")
        .text(t.cols[i], colX[i] + 5, y + 7, {
          width: colWidths[i] - 10,
          ellipsis: true,
        });
    }
  };

  let y = doc.y;
  drawHeader(y);
  y += headerRowHeight;

  registrants.forEach((r, idx) => {
    if (y > doc.page.height - 70) {
      doc.addPage();
      y = doc.y;
      drawHeader(y);
      y += headerRowHeight;
    }

    if (idx % 2 === 1) {
      doc.rect(leftX, y, tableWidth, rowHeight).fill("#faf4f5");
    }

    const cells = [
      String(idx + 1),
      `${r.firstName} ${r.lastName}`,
      r.email,
      r.grade,
      r.specialite || "",
      r.workplace,
      r.phone || "",
      fmtDate(r.registeredAt),
    ];

    for (let i = 0; i < cells.length; i++) {
      doc
        .font(i === 1 ? "Helvetica-Bold" : "Helvetica")
        .fontSize(8)
        .fillColor("#1a1a2e")
        .text(cells[i], colX[i] + 5, y + 6, {
          width: colWidths[i] - 10,
          ellipsis: true,
        });
    }

    y += rowHeight;
  });

  // ─── Footer ────────────────────────────────────────────
  const bottomY = doc.page.height - 45;
  if (doc.y > bottomY - rowHeight) {
    doc.addPage();
  }

  doc
    .moveTo(leftX, bottomY)
    .lineTo(rightX, bottomY)
    .strokeColor("#e8dfe2")
    .stroke();

  doc
    .font("Helvetica")
    .fontSize(8)
    .fillColor("#8a8a9a")
    .text(t.footer, leftX, bottomY + 10, {
      align: "center",
      width: tableWidth,
    });

  const result = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.end();

  return result;
}
