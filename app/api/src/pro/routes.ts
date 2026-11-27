/**
 * Espace des praticiens (vétérinaire, maréchal-ferrant, dentiste, ostéopathe) · rôle « provider ».
 * Un praticien suit des chevaux dans plusieurs écuries : chaque club l'invite (rôle provider, person_ref = sa fiche
 * dans la collection practitioners du club). Les données de chaque club passent par records/policy.ts ;
 * cette route ajoute la seule vue qui traverse les clubs : sa tournée.
 *
 *   GET /api/pro/tournee?days=14  visites prévues et demandes de visite, dans toutes ses écuries, triées par date
 */
import { Hono } from "hono";
import type { AppEnv } from "../env";
import { requireUser } from "../lib/auth";
import { all } from "../lib/db";

const app = new Hono<AppEnv>();

type Row = Record<string, any>;
const parse = (s: string): Row => { try { return JSON.parse(s) || {}; } catch { return {}; } };
const addr = (a: string | null): string => {
  if (!a) return "";
  try { const o = JSON.parse(a); if (o && typeof o === "object") return [o.line1, [o.zip, o.city].filter(Boolean).join(" ")].filter(Boolean).join(", "); } catch { /* texte libre */ }
  return a;
};

app.get("/api/pro/tournee", requireUser, async (c) => {
  const user = c.get("user")!;
  const days = Math.min(60, Math.max(1, Number(c.req.query("days")) || 14));
  const today = new Date().toISOString().slice(0, 10);
  const until = new Date(Date.now() + days * 864e5).toISOString().slice(0, 10);
  const ms = await all<{ club_id: string; person_ref: string | null; name: string; address: string | null; phone: string | null }>(c.env.DB,
    `SELECT m.club_id, m.person_ref, cl.name, cl.address, cl.phone FROM memberships m JOIN clubs cl ON cl.id = m.club_id
     WHERE m.user_id = ? AND m.role = 'provider' AND m.status = 'active' ORDER BY cl.name`, user.id);
  const clubs: Row[] = [], visits: Row[] = [], requests: Row[] = [];
  for (const m of ms) {
    const me = new Set((m.person_ref || "").split(",").map((s) => s.trim()).filter(Boolean));
    const rows = await all<{ coll: string; id: string; data: string }>(c.env.DB,
      "SELECT coll, id, data FROM records WHERE club_id = ? AND deleted = 0 AND coll IN ('practitioners','care','horses','proRequests')", m.club_id);
    const by = (k: string) => rows.filter((r) => r.coll === k).map((r) => ({ ...parse(r.data), id: r.id }));
    const prats = by("practitioners").filter((p) => me.has(p.id));
    const names = new Set(prats.flatMap((p) => [p.short, p.name]).filter(Boolean).map((s: string) => s.toLowerCase()));
    const horses = new Map(by("horses").map((h) => [h.id, h]));
    const hz = (id: string) => { const h = horses.get(id); return h ? { id: h.id, name: h.name, box: h.box || "" } : { id, name: "Cheval", box: "" }; };
    clubs.push({ id: m.club_id, name: m.name, address: addr(m.address), phone: m.phone || "" });
    for (const s of by("care")) {
      const mine = (s.pro && me.has(s.pro)) || (typeof s.who === "string" && names.has(s.who.toLowerCase()));
      if (!mine || s.status === "fait" || s.status === "annulé") continue;
      const d = String(s.date || "");
      if (d > until || (d < today && s.status !== "en retard")) continue;
      visits.push({ club: m.club_id, club_name: m.name, id: s.id, date: d, time: s.time || "", kind: s.kind || "", note: s.note || "", status: s.status || "planifié", horse: hz(s.horse) });
    }
    for (const r of by("proRequests")) {
      if (!me.has(r.pro) || (r.status && r.status !== "nouvelle")) continue;
      requests.push({ club: m.club_id, club_name: m.name, id: r.id, date: r.date || "", motive: r.motive || "", urgent: !!r.urgent, horse: hz(r.horse) });
    }
  }
  visits.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  requests.sort((a, b) => Number(b.urgent) - Number(a.urgent) || String(a.date).localeCompare(String(b.date)));
  return c.json({ clubs, visits, requests, from: today, until });
});

export default app;
