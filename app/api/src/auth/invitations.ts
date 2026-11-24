import type { Env, Role } from "../env";
import { emit } from "../lib/events";
import { all, one, run } from "../lib/db";
import { randomToken, sha256 } from "../lib/crypto";
import { newId, nowIso } from "../lib/ids";
import { INVITATION_DAYS } from "./tokens";
import { appUrl, mail, ROLE_LABEL, WEB } from "./mailer";
import { mergeRefs } from "./users";

export const INVITABLE_ROLES: Role[] = ["manager", "staff", "coach", "member", "accountant"];

export interface InvitationRow {
  id: string; club_id: string; email: string; role: Role; person_ref: string | null; first: string | null; last: string | null;
  token_hash: string; invited_by: string | null; source: string; expires_at: string; accepted_at: string | null; accepted_by: string | null; revoked_at: string | null; created_at: string;
}

export function invitationStatus(i: InvitationRow): "pending" | "accepted" | "revoked" | "expired" {
  if (i.accepted_at) return "accepted";
  if (i.revoked_at) return "revoked";
  if (i.expires_at < nowIso()) return "expired";
  return "pending";
}
export function publicInvitation(i: InvitationRow) {
  return { id: i.id, email: i.email, role: i.role, person_ref: i.person_ref, first: i.first, last: i.last, source: i.source,
    status: invitationStatus(i), expires_at: i.expires_at, accepted_at: i.accepted_at, created_at: i.created_at };
}

/**
 * Crée (ou remplace) une invitation et envoie l'e-mail. Une invitation en attente pour la même adresse dans ce club
 * est révoquée et ses fiches (person_ref) sont reprises si le rôle est le même : un parent invité pour deux enfants
 * reçoit une seule invitation valable pour les deux fiches.
 * template : « invitation » (invitation manuelle) ou « welcome_member » (nouvel adhérent).
 */
export async function createInvitation(env: Env, o: {
  club_id: string; email: string; role: Role; person_ref?: string | null; first?: string | null; last?: string | null;
  invited_by?: string | null; source?: "manual" | "auto"; template?: "invitation" | "welcome_member"; send?: boolean; extra?: Record<string, unknown>;
}) {
  const db = env.DB;
  const club = await one<{ name: string }>(db, "SELECT name FROM clubs WHERE id = ?", o.club_id);
  let personRef = o.person_ref ?? null;
  const prev = await all<InvitationRow>(db,
    "SELECT * FROM invitations WHERE club_id = ? AND email = ? COLLATE NOCASE AND accepted_at IS NULL AND revoked_at IS NULL AND expires_at > ?", o.club_id, o.email, nowIso());
  for (const p of prev) if (p.role === o.role) personRef = mergeRefs(p.person_ref, personRef);
  if (prev.length) await run(db, "UPDATE invitations SET revoked_at = ? WHERE club_id = ? AND email = ? COLLATE NOCASE AND accepted_at IS NULL AND revoked_at IS NULL", nowIso(), o.club_id, o.email);
  const token = randomToken(32);
  const id = newId("inv");
  const expires = new Date(Date.now() + INVITATION_DAYS * 864e5).toISOString();
  await run(db, `INSERT INTO invitations (id, club_id, email, role, person_ref, first, last, token_hash, invited_by, source, expires_at)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`, id, o.club_id, o.email.trim(), o.role, personRef, o.first ?? null, o.last ?? null, await sha256(token), o.invited_by ?? null, o.source || "manual", expires);
  const url = appUrl(env, WEB.invitation + token);
  let inviterName = "";
  if (o.invited_by) {
    const u = await one<{ first: string | null; last: string | null }>(db, "SELECT first, last FROM users WHERE id = ?", o.invited_by);
    inviterName = [u?.first, u?.last].filter(Boolean).join(" ");
  }
  if (o.send !== false) {
    await mail(env, {
      to: o.email, club_id: o.club_id, template: o.template || "invitation",
      data: { first: o.first || "", last: o.last || "", club_name: club?.name || "", role: o.role, role_label: ROLE_LABEL[o.role] || o.role,
        inviter_name: inviterName, action_url: url, invitation_url: url, expires_in_days: INVITATION_DAYS, ...(o.extra || {}) },
    });
  }
  await emit(env, null, { type: "member.invited", club_id: o.club_id, email: o.email, role: o.role, invitation_url: url, inviter_name: inviterName });
  const row = (await one<InvitationRow>(db, "SELECT * FROM invitations WHERE id = ?", id))!;
  return { invitation: row, token, url };
}

/** Crée ou met à jour l'appartenance (fusion des fiches, rôle de l'invitation sauf si l'utilisateur est déjà titulaire). */
export async function upsertMembership(env: Env, userId: string, clubId: string, role: Role, personRef: string | null) {
  const cur = await one<{ role: Role; person_ref: string | null; status: string }>(env.DB, "SELECT role, person_ref, status FROM memberships WHERE user_id = ? AND club_id = ?", userId, clubId);
  if (!cur) {
    await run(env.DB, "INSERT INTO memberships (user_id, club_id, role, person_ref, status) VALUES (?,?,?,?, 'active')", userId, clubId, role, personRef);
    return;
  }
  // Un gérant qui accepte une invitation d'adhérent (parent d'un cavalier) reste gérant : on ajoute seulement les fiches.
  const newRole = cur.role === "owner" || (cur.role === "manager" && role !== "owner") ? cur.role : role;
  await run(env.DB, "UPDATE memberships SET role = ?, person_ref = ?, status = 'active' WHERE user_id = ? AND club_id = ?",
    newRole, mergeRefs(cur.person_ref, personRef), userId, clubId);
}
