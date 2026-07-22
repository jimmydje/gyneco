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
        ? "Journées de Gynécologie d'Annaba <noreply@annabagyneco2026.dz>"
        : "Annaba Gynecology Conference <noreply@annabagyneco2026.dz>",
      to: [to],
      subject: isFr
        ? "Inscription confirmée — Journées de Gynécologie & Obstétrique d'Annaba"
        : "Registration Confirmed — Annaba Gynecology & Obstetrics Conference",
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
        subtitle: "Journées de Gynécologie & Obstétrique d'Annaba",
        dear: `Cher/Chère <strong>${firstName} ${lastName}</strong>`,
        body: "Nous vous remercions de votre inscription aux <strong>Journées de Gynécologie & Obstétrique d'Annaba</strong>. Votre inscription a bien été reçue et confirmée.",
        eventDetails: "Détails de l'événement",
        dates: "Date",
        venue: "Lieu",
        location: "Adresse",
        start: "Début",
        datesValue: "03 septembre 2026",
        venueValue: "Hôtel Seybouse International",
        locationValue: "Annaba, Algérie",
        startValue: "8h30",
        program: "Programme",
        day1: "03 septembre 2026",
        contact: "Pour plus d'info :",
        phone: "Tél : 038871324 / 038871678",
        closing: "Nous avons hâte de vous accueillir à Annaba !",
        footer: "© 2026 Journées de Gynécologie & Obstétrique d'Annaba",
      }
    : {
        title: "Registration Confirmed",
        subtitle: "Annaba Gynecology & Obstetrics Conference",
        dear: `Dear <strong>${firstName} ${lastName}</strong>`,
        body: "Thank you for registering for the <strong>Annaba Gynecology & Obstetrics Conference</strong>. Your registration has been successfully received and confirmed.",
        eventDetails: "Event Details",
        dates: "Date",
        venue: "Venue",
        location: "Location",
        start: "Start",
        datesValue: "September 3, 2026",
        venueValue: "Hôtel Seybouse International",
        locationValue: "Annaba, Algeria",
        startValue: "8:30 AM",
        program: "Program",
        day1: "September 3, 2026",
        contact: "For more info:",
        phone: "Phone: 038871324 / 038871678",
        closing: "We look forward to welcoming you to Annaba!",
        footer: "© 2026 Annaba Gynecology & Obstetrics Conference",
      };

  const sessions = [
    {
      day: t.day1,
      rows: isFr
        ? [
            ["08:30", "Accueil & Café de bienvenue"],
            ["09:00", "Cérémonie d'ouverture"],
            ["09:30", "Conférences plénières"],
            ["10:30", "Pause-café"],
            ["11:00", "Ateliers & Sessions parallèles"],
            ["12:30", "Déjeuner"],
            ["14:00", "Communications orales"],
            ["16:00", "Table ronde & Clôture"],
          ]
        : [
            ["08:30", "Registration & Welcome Coffee"],
            ["09:00", "Opening Ceremony"],
            ["09:30", "Plenary Lectures"],
            ["10:30", "Coffee Break"],
            ["11:00", "Workshops & Parallel Sessions"],
            ["12:30", "Lunch"],
            ["14:00", "Oral Communications"],
            ["16:00", "Round Table & Closing"],
          ],
    },
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

<p style="font-size:13px;color:#8a8a9a;line-height:1.6;margin:0 0 4px;">
${t.phone}
</p>
<p style="font-size:13px;color:#8a8a9a;line-height:1.6;margin:0 0 8px;">
${t.contact} <a href="mailto:journees.gynea.annaba2026@gmail.com" style="color:#99324d;">journees.gynea.annaba2026@gmail.com</a>
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
