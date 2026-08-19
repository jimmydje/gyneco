// ═══════════════════════════════════════════════════════════════
//  EVENT REGISTRATION SWITCH
// ═══════════════════════════════════════════════════════════════
//  Set to `true` to CLOSE public registration:
//    • Visitors see "Inscriptions clôturées" instead of the form.
//    • The /api/register endpoint rejects new sign-ups (HTTP 403).
//
//  This does NOT touch the database or any existing registrant.
//  Admins can still add / remove registrants from /admin.
//
//  To reopen registration: set to `false` and redeploy.
// ═══════════════════════════════════════════════════════════════
export const REGISTRATIONS_CLOSED = true;
