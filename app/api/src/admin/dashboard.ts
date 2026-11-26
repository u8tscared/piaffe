/* Espace admin · tableau de bord : GET /admin/api/dashboard */
import { Hono } from "hono";
import type { AppEnv } from "../env";
import { all, one } from "../lib/db";
import { clubState, mailQuota, monthlyCents } from "./metrics";

const app = new Hono<AppEnv>();
const DAY = 864e5;
const iso = (ms: number) => new Date(ms).toISOString();
const n = async (db: D1Database, sql: string, ...a: unknown[]) => (await one<{ n: number }>(db, sql, ...a))?.n ?? 0;

app.get("/admin/api/dashboard", async (c) => {
  const db = c.env.DB, now = Date.now();
  const today = new Date(now).toISOString().slice(0, 10), month = today.slice(0, 7);

  const clubs = await all<{ id: string; name: string; plan: string; plan_status: string; trial_ends_at: string | null; created_at: string; interval: string | null; founder: number | null; bplan: string | null; past_due_since: string | null; suspended_at: string | null }>(db,
    `SELECT c.id, c.name, c.plan, c.plan_status, c.trial_ends_at, c.created_at, b.interval, b.founder, b.plan AS bplan, b.past_due_since, f.suspended_at
     FROM clubs c LEFT JOIN billing_subscriptions b ON b.club_id = c.id LEFT JOIN admin_club_flags f ON f.club_id = c.id`);

  let mrr = 0;
  const counts = { total: clubs.length, essai: 0, payant: 0, impaye: 0, resilie: 0, suspendu: 0, fondateurs: 0 };
  const ending: any[] = [], unpaid: any[] = [];
  const signups: number[] = Array(30).fill(0);
  for (const cl of clubs) {
    const st = clubState(cl, now);
    if (st.key === "essai" || st.key === "essai_fini") counts.essai++;
    else if (st.key === "payant") counts.payant++;
    else if (st.key === "impaye") counts.impaye++;
    else if (st.key === "resilie") counts.resilie++;
    else if (st.key === "suspendu") counts.suspendu++;
    if (cl.founder) counts.fondateurs++;
    if (["active", "past_due"].includes(cl.plan_status) && !cl.suspended_at) mrr += monthlyCents({ plan: cl.bplan || cl.plan, interval: cl.interval, founder: cl.founder });
    if (cl.plan_status === "trialing" && cl.trial_ends_at && Date.parse(cl.trial_ends_at) <= now + 7 * DAY)
      ending.push({ id: cl.id, name: cl.name, trial_ends_at: cl.trial_ends_at, state: st });
    if (["past_due", "unpaid"].includes(cl.plan_status)) unpaid.push({ id: cl.id, name: cl.name, since: cl.past_due_since || cl.trial_ends_at, state: st });
    const age = Math.floor((now - Date.parse(cl.created_at)) / DAY);
    if (age >= 0 && age < 30) signups[29 - age]++;
  }
  ending.sort((a, b) => a.trial_ends_at.localeCompare(b.trial_ends_at));

  const since7 = iso(now - 7 * DAY), since1 = iso(now - DAY);
  const migrations = await all<any>(db,
    `SELECT j.id, j.club_id, c.name AS club_name, j.source, j.status, j.item_count, j.created_at FROM import_jobs j LEFT JOIN clubs c ON c.id = j.club_id
     WHERE j.status IN ('open','simulated','committing') AND j.created_at >= ? ORDER BY j.created_at DESC LIMIT 6`, iso(now - 30 * DAY));
  const migrationsOpen = await n(db, "SELECT COUNT(*) AS n FROM import_jobs WHERE status IN ('open','simulated','committing') AND created_at >= ?", iso(now - 30 * DAY));
  const robotsFailed = await n(db, "SELECT COUNT(*) AS n FROM migration_incidents WHERE created_at >= ?", since7)
    + await n(db, "SELECT COUNT(*) AS n FROM import_jobs WHERE status = 'failed' AND created_at >= ?", since7);

  const sentToday = await n(db, "SELECT COUNT(*) AS n FROM email_outbox WHERE status = 'sent' AND sent_at >= ?", today);
  const sentMonth = await n(db, "SELECT COUNT(*) AS n FROM email_outbox WHERE status = 'sent' AND sent_at >= ?", month + "-01");
  const mailFailed = await n(db, "SELECT COUNT(*) AS n FROM email_outbox WHERE status = 'failed' AND created_at >= ?", since7);
  const mailQueued = await n(db, "SELECT COUNT(*) AS n FROM email_outbox WHERE status IN ('queued','sending')");
  const bounced = await n(db, "SELECT COUNT(*) AS n FROM email_outbox WHERE delivery IN ('bounced','complained') AND created_at >= ?", since7);

  const errors24 = await n(db, "SELECT COUNT(*) AS n FROM admin_errors WHERE at >= ?", since1);
  const errors7 = await n(db, "SELECT COUNT(*) AS n FROM admin_errors WHERE at >= ?", since7);
  const lastErrors = await all<any>(db, "SELECT at, method, path, status, message FROM admin_errors ORDER BY at DESC LIMIT 5");
  const stripeFailed = await n(db, "SELECT COUNT(*) AS n FROM stripe_events WHERE status = 'failed' AND received_at >= ?", since7);
  const einvoiceErrors = await n(db, "SELECT COUNT(*) AS n FROM invoices WHERE einvoice_status = 'error'");
  const support = await n(db, "SELECT COUNT(*) AS n FROM support_messages WHERE status = 'nouveau'");
  const health = errors24 + stripeFailed + mailFailed + einvoiceErrors;

  return c.json({
    at: iso(now),
    clubs: counts,
    revenue: { mrr_cents: mrr, arr_cents: mrr * 12 },
    signups_30d: signups,
    trials_ending: ending.slice(0, 8), trials_ending_count: ending.length,
    unpaid: unpaid.slice(0, 8), unpaid_count: unpaid.length,
    migrations: { open: migrationsOpen, recent: migrations, robots_failed_7d: robotsFailed },
    mail: { ...mailQuota(c.env.MAIL_PROVIDER || "log", sentToday, sentMonth), failed_7d: mailFailed, queued: mailQueued, bounced_7d: bounced },
    health: { level: errors24 > 0 || stripeFailed > 0 ? "bad" : health > 0 ? "warn" : "ok", errors_24h: errors24, errors_7d: errors7, stripe_failed_7d: stripeFailed, mail_failed_7d: mailFailed, einvoice_errors: einvoiceErrors, last_errors: lastErrors },
    support_new: support,
  });
});

export default app;
