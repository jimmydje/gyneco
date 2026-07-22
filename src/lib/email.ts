import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

interface SendConfirmationParams {
  to: string;
  firstName: string;
  lastName: string;
  lang?: string;
}

export async function sendConfirmationEmail({
  to,
  firstName,
  lastName,
  lang,
}: SendConfirmationParams) {
  if (!resend) {
    console.log(
      `[EMAIL] Would send confirmation to ${to} (RESEND_API_KEY not configured)`
    );
    return { success: false, reason: "RESEND_API_KEY not configured" };
  }

  try {
    const isFr = lang === "fr";
    const { data, error } = await resend.emails.send({
      from: isFr
        ? "4ᵉ Congrès de Gynécologie d'Annaba <noreply@annabagyneco2026.dz>"
        : "4th Annaba Gynecology Conference <noreply@annabagyneco2026.dz>",
      to: [to],
      subject: isFr
        ? "Inscription confirmée — 4ᵉ Congrès de Gynécologie & Obstétrique d'Annaba"
        : "Registration Confirmed — 4th Annaba Gynecology & Obstetrics Conference",
      html: isFr ? templateFr({ firstName, lastName }) : templateEn({ firstName, lastName }),
    });

    if (error) {
      console.error("[EMAIL] Failed to send:", error);
      return { success: false, error };
    }

    console.log(`[EMAIL] Confirmation sent to ${to}`);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error("[EMAIL] Error:", err);
    return { success: false, error: err };
  }
}

function templateEn({
  firstName,
  lastName,
}: {
  firstName: string;
  lastName: string;
}) {
  const label = (key: string) => key;
  return buildTemplate({ firstName, lastName, isFr: false });
}

function templateFr({
  firstName,
  lastName,
}: {
  firstName: string;
  lastName: string;
}) {
  return buildTemplate({ firstName, lastName, isFr: true });
}

function buildTemplate({
  firstName,
  lastName,
  isFr,
}: {
  firstName: string;
  lastName: string;
  isFr: boolean;
}) {
  const t = isFr
    ? {
        title: "Inscription confirmée",
        subtitle: "4ᵉ Congrès de Gynécologie & Obstétrique d'Annaba",
        dear: `Cher/Chère <strong>${firstName} ${lastName}</strong>`,
        body: "Nous vous remercions de votre inscription au <strong>4ᵉ Congrès de Gynécologie & Obstétrique d'Annaba</strong>. Votre inscription a bien été reçue et confirmée.",
        eventDetails: "Détails de l'événement",
        dates: "Dates",
        venue: "Lieu",
        location: "Adresse",
        start: "Début",
        datesValue: "15–17 octobre 2026",
        venueValue: "Hôtel Sheraton Annaba",
        locationValue: "Boulevard Che Guevara, Annaba 23000, Algérie",
        startValue: "8h30 tous les jours",
        program: "Programme du Congrès",
        day1: "Jour 1 — 15 octobre 2026",
        day2: "Jour 2 — 16 octobre 2026",
        day3: "Jour 3 — 17 octobre 2026",
        contact: "Pour toute question, contactez",
        closing: "Nous avons hâte de vous accueillir à Annaba !",
        footer: "© 2026 4ᵉ Congrès de Gynécologie & Obstétrique d'Annaba",
      }
    : {
        title: "Registration Confirmed",
        subtitle: "4th Annaba Gynecology & Obstetrics Conference",
        dear: `Dear <strong>${firstName} ${lastName}</strong>`,
        body: "Thank you for registering for the <strong>4th Annaba Gynecology & Obstetrics Conference</strong>. Your registration has been successfully received and confirmed.",
        eventDetails: "Event Details",
        dates: "Dates",
        venue: "Venue",
        location: "Location",
        start: "Start",
        datesValue: "October 15–17, 2026",
        venueValue: "Sheraton Annaba Hotel",
        locationValue: "Boulevard Che Guevara, Annaba 23000, Algeria",
        startValue: "8:30 AM daily",
        program: "Conference Program",
        day1: "Day 1 — October 15, 2026",
        day2: "Day 2 — October 16, 2026",
        day3: "Day 3 — October 17, 2026",
        contact: "For questions, contact",
        closing: "We look forward to welcoming you to Annaba!",
        footer: "© 2026 4th Annaba Gynecology & Obstetrics Conference",
      };

  const sessions = [
    { day: t.day1, rows: [["08:30", isFr ? "Accueil & Café de bienvenue" : "Registration & Welcome Coffee"], ["09:30", isFr ? "Cérémonie d'ouverture" : "Opening Ceremony"], ["10:30", isFr ? "Conférence : L'avenir de la santé maternelle" : "Keynote: Future of Maternal Healthcare"], ["14:00", isFr ? "Sessions parallèles : Oncologie & Endocrinologie" : "Parallel Sessions: Oncology & Endocrinology"], ["17:00", isFr ? "Réception de bienvenue" : "Welcome Reception"]] },
    { day: t.day2, rows: [["09:00", isFr ? "Plénière : Chirurgie mini-invasive" : "Plenary: Minimally Invasive Surgery"], ["11:00", isFr ? "Atelier : Sutures laparoscopiques" : "Workshop: Laparoscopic Suturing"], ["14:00", isFr ? "Panel : Controverses en urogynécologie" : "Panel: Urogynecology Controversies"], ["16:30", isFr ? "Présentations orales & Posters" : "Oral & Poster Presentations"]] },
    { day: t.day3, rows: [["09:00", isFr ? "Masterclass : Urgences obstétricales" : "Masterclass: Emergency Obstetrics"], ["11:00", isFr ? "Table ronde : Santé des femmes dans le monde" : "Roundtable: Global Women's Health"], ["14:00", isFr ? "Communications libres" : "Free Communications"], ["16:00", isFr ? "Remise des prix & Clôture" : "Awards & Closing Ceremony"]] },
  ];

  return `<!DOCTYPE html>
<html lang="${isFr ? "fr" : "en"}">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#faf8f9;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#faf8f9;padding:40px 0;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.06);">

<tr><td style="background:linear-gradient(135deg,#99324d,#5a1e30);padding:40px;text-align:center;">
<div style="font-size:32px;color:rgba(255,255,255,0.9);">♀</div>
<h1 style="font-family:Georgia,serif;color:#ffffff;font-size:24px;margin:8px 0 4px;">${t.title}</h1>
<p style="color:rgba(255,255,255,0.85);font-size:15px;margin:0;">${t.subtitle}</p>
</td></tr>

<tr><td style="padding:36px 40px;">
<p style="font-size:16px;color:#1a1a2e;margin:0 0 12px;">${t.dear},</p>
<p style="font-size:15px;color:#5a5a72;line-height:1.7;margin:0 0 24px;">
${t.body}
</p>

<table cellpadding="0" cellspacing="0" style="background:#faf4f5;border-radius:10px;width:100%;margin-bottom:24px;">
<tr><td style="padding:24px;">
<p style="font-size:14px;font-weight:700;color:#99324d;margin:0 0 16px;text-transform:uppercase;letter-spacing:1px;">${t.eventDetails}</p>
<table cellpadding="0" cellspacing="0" style="width:100%;">
<tr><td style="font-size:14px;color:#5a5a72;padding-bottom:10px;width:120px;">${t.dates}</td><td style="font-size:14px;color:#1a1a2e;font-weight:600;padding-bottom:10px;">${t.datesValue}</td></tr>
<tr><td style="font-size:14px;color:#5a5a72;padding-bottom:10px;">${t.venue}</td><td style="font-size:14px;color:#1a1a2e;font-weight:600;padding-bottom:10px;">${t.venueValue}</td></tr>
<tr><td style="font-size:14px;color:#5a5a72;padding-bottom:10px;">${t.location}</td><td style="font-size:14px;color:#1a1a2e;font-weight:600;padding-bottom:10px;">${t.locationValue}</td></tr>
<tr><td style="font-size:14px;color:#5a5a72;">${t.start}</td><td style="font-size:14px;color:#1a1a2e;font-weight:600;">${t.startValue}</td></tr>
</table>
</td></tr>
</table>

<h2 style="font-family:Georgia,serif;color:#1a1a2e;font-size:18px;margin:0 0 12px;">${t.program}</h2>
${sessions
  .map(
    (d) => `<h3 style="font-size:14px;color:#99324d;margin:0 0 8px;text-transform:uppercase;letter-spacing:0.5px;">${d.day}</h3>
<table cellpadding="4" cellspacing="0" style="width:100%;margin-bottom:16px;">
${d.rows.map(([time, title]) => `<tr><td style="font-size:13px;color:#5a5a72;width:60px;">${time}</td><td style="font-size:13px;color:#1a1a2e;">${title}</td></tr>`).join("")}
</table>`
  )
  .join("")}

<p style="font-size:13px;color:#8a8a9a;line-height:1.6;margin:0 0 8px;">
${t.contact} <a href="mailto:contact@annabagyneco2026.dz" style="color:#99324d;">contact@annabagyneco2026.dz</a>
</p>
<p style="font-size:13px;color:#8a8a9a;line-height:1.6;margin:0;">
${t.closing}
</p>
</td></tr>

<tr><td style="background:#f3eff0;padding:24px 40px;text-align:center;">
<p style="font-size:12px;color:#8a8a9a;margin:0;">${t.footer}</p>
</td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}
