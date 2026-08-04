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
