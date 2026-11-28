import { describe, it, expect, beforeAll } from "vitest";
import { Hono } from "hono";
import { call, env, seed } from "./helpers";
import { apiKey } from "./mail-kit";
import { setMailer } from "../src/auth/mailer";
import { newId } from "../src/lib/ids";
import { loadAuth } from "../src/lib/auth";
import { errorHandler } from "../src/lib/http";
import { adminGuard } from "../src/admin/guard";
import { extendedTrialEnd, mailQuota, monthlyCents, parseProspectsCsv, clubState } from "../src/admin/metrics";
import type { AppEnv } from "../src/env";

const ADMIN = "admin.stabl@exemple.fr";
const mails: any[] = [];
setMailer(async (_e, m) => { mails.push(m); return "test"; });

let admin: Awaited<ReturnType<typeof seed>>;
const get = (path: string, token?: string) => call(path, { token });
const post = (path: string, token: string, json: unknown = {}) => call(path, { method: "POST", token, json });
const jsonOf = async (r: Response) => (await r.json()) as any;
const day = 864e5;
const iso = (ms: number) => new Date(ms).toISOString();

async function club(o: { name: string; plan?: string; status?: string; trialEnds?: number; billing?: Record<string, unknown> }) {
  const s = await seed("owner");
  await env.DB.prepare("UPDATE clubs SET name = ?, plan = ?, plan_status = ?, trial_ends_at = ?, address = ? WHERE id = ?")
    .bind(o.name, o.plan || "trial", o.status || "trialing", o.trialEnds ? iso(o.trialEnds) : null, JSON.stringify({ city: "Lyon" }), s.clubId).run();
  if (o.billing) {
    const k = Object.keys(o.billing);
    await env.DB.prepare(`INSERT INTO billing_subscriptions (club_id, ${k.join(", ")}) VALUES (?${",?".repeat(k.length)})`).bind(s.clubId, ...k.map((x) => o.billing![x])).run();
  }
  return s;
}

beforeAll(async () => {
  admin = await seed("owner", { email: ADMIN });
});

describe("accès réservé", () => {
  it("404 pour les visiteurs, les gérants, les clés d'API et un admin non vérifié", async () => {
    expect((await get("/admin")).status).toBe(404);
    expect((await get("/admin/api/dashboard")).status).toBe(404);
    const owner = await seed("owner");
    expect((await get("/admin", owner.token)).status).toBe(404);
    expect((await get("/admin/api/clubs", owner.token)).status).toBe(404);
    const key = await apiKey(owner.clubId, ["*"]);
    expect((await get("/admin/api/clubs", key)).status).toBe(404);
    const unverified = await seed("owner", { email: "seconde.admin@exemple.fr" });
    await env.DB.prepare("UPDATE users SET email_verified_at = NULL WHERE id = ?").bind(unverified.userId).run();
    expect((await get("/admin/api/me", unverified.token)).status).toBe(404);
  });

  it("la page et l'API s'ouvrent pour un admin", async () => {
    const r = await get("/admin", admin.token);
    expect(r.status).toBe(200);
    expect(r.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    const html = await r.text();
    expect(html).toContain("<title>Stabl admin</title>");
    expect(html).not.toContain("Piaffe");
    const me = await jsonOf(await get("/admin/api/me", admin.token));
    expect(me.email).toBe(ADMIN);
    expect((await get("/admin/api/inconnu", admin.token)).status).toBe(404);
  });

  it("refuse une écriture par cookie sans en-tête anti-CSRF", async () => {
    const r = await call("/admin/api/prospects", { method: "POST", headers: { cookie: "piaffe_s=x" }, json: { name: "X" } });
    expect(r.status).toBe(404); // cookie invalide : pas admin
    const ok = await call("/admin/api/prospects", { method: "POST", token: admin.token, json: { name: "Centre CSRF" } });
    expect(ok.status).toBe(201);
  });
});

describe("tableau de bord", () => {
  it("compte les clubs, le revenu mensuel, les essais qui finissent et les impayés", async () => {
    const before = await jsonOf(await get("/admin/api/dashboard", admin.token));
    await club({ name: "Écurie qui finit", trialEnds: Date.now() + 3 * day });
    await club({ name: "Centre payant", plan: "club", status: "active", billing: { plan: "club", interval: "month", status: "active" } });
    await club({ name: "Fondateur annuel", plan: "club", status: "active", billing: { plan: "club", interval: "year", status: "active", founder: 1 } });
    await club({ name: "Poney-club en retard", plan: "essentiel", status: "past_due", billing: { plan: "essentiel", interval: "month", status: "past_due", past_due_since: iso(Date.now() - 2 * day) } });
    const d = await jsonOf(await get("/admin/api/dashboard", admin.token));
    expect(d.clubs.total - before.clubs.total).toBe(4);
    expect(d.clubs.payant - before.clubs.payant).toBe(2);
    expect(d.revenue.mrr_cents - before.revenue.mrr_cents).toBe(14900 + 8250 + 5900);
    expect(d.revenue.arr_cents).toBe(d.revenue.mrr_cents * 12);
    expect(d.trials_ending.map((x: any) => x.name)).toContain("Écurie qui finit");
    expect(d.unpaid.map((x: any) => x.name)).toContain("Poney-club en retard");
    expect(d.mail.provider).toBe("log");
    expect(d.health.level).toMatch(/ok|warn|bad/);
    expect(d.signups_30d).toHaveLength(30);
  });
});

describe("clubs", () => {
  it("liste, recherche, filtre et fiche", async () => {
    const c = await club({ name: "Haras des Cèdres", trialEnds: Date.now() + 20 * day });
    await env.DB.prepare("INSERT INTO records (club_id, coll, id, data) VALUES (?,?,?,?), (?,?,?,?), (?,?,?,?)")
      .bind(c.clubId, "members", "m1", "{}", c.clubId, "members", "m2", "{}", c.clubId, "horses", "h1", "{}").run();
    const l = await jsonOf(await get("/admin/api/clubs?q=cèdres", admin.token));
    expect(l.clubs).toHaveLength(1);
    expect(l.clubs[0]).toMatchObject({ name: "Haras des Cèdres", members: 2, horses: 1, city: "Lyon" });
    expect(l.clubs[0].state.key).toBe("essai");
    const f = await jsonOf(await get("/admin/api/clubs?etat=impaye", admin.token));
    expect(f.clubs.every((x: any) => x.state.key === "impaye")).toBe(true);
    const d = await jsonOf(await get("/admin/api/clubs/" + c.clubId, admin.token));
    expect(d.club.name).toBe("Haras des Cèdres");
    expect(d.users[0].email).toBe(c.email);
    expect(d.records.members).toBe(2);
    expect((await get("/admin/api/clubs/clb_inconnu", admin.token)).status).toBe(404);
  });

  it("prolonge l'essai, avec confirmation obligatoire et journal", async () => {
    const c = await club({ name: "Essai court", trialEnds: Date.now() + 2 * day });
    expect((await post(`/admin/api/clubs/${c.clubId}/essai`, admin.token, { days: 14 })).status).toBe(409);
    const r = await jsonOf(await post(`/admin/api/clubs/${c.clubId}/essai`, admin.token, { days: 14, confirm: true }));
    expect(Date.parse(r.trial_ends_at) - Date.now()).toBeGreaterThan(15.9 * day);
    const a = await env.DB.prepare("SELECT user_id, data FROM audit_log WHERE action = 'admin.club.trial_extend' AND club_id = ?").bind(c.clubId).first<any>();
    expect(a.user_id).toBe(admin.userId);
    expect(JSON.parse(a.data).days).toBe(14);
    // Essai fini et passé en « unpaid » par le cron : la prolongation le remet en essai.
    const old = await club({ name: "Essai fini", status: "unpaid", trialEnds: Date.now() - 5 * day });
    await post(`/admin/api/clubs/${old.clubId}/essai`, admin.token, { days: 7, confirm: true });
    const row = await env.DB.prepare("SELECT plan_status, trial_ends_at FROM clubs WHERE id = ?").bind(old.clubId).first<any>();
    expect(row.plan_status).toBe("trialing");
    expect(Date.parse(row.trial_ends_at)).toBeGreaterThan(Date.now() + 6.9 * day);
    const paying = await club({ name: "Déjà payant", plan: "club", status: "active" });
    expect((await post(`/admin/api/clubs/${paying.clubId}/essai`, admin.token, { days: 7, confirm: true })).status).toBe(409);
  });

  it("offre fondateurs et lien de réinitialisation", async () => {
    const c = await club({ name: "Futur fondateur" });
    await post(`/admin/api/clubs/${c.clubId}/fondateur`, admin.token, { founder: true, confirm: true });
    expect((await env.DB.prepare("SELECT founder FROM billing_subscriptions WHERE club_id = ?").bind(c.clubId).first<any>()).founder).toBe(1);
    mails.length = 0;
    const r = await jsonOf(await post(`/admin/api/clubs/${c.clubId}/reinitialisation`, admin.token, { confirm: true }));
    expect(r.email).toBe(c.email);
    expect(mails[0]).toMatchObject({ to: c.email, template: "reset_password" });
    expect(mails[0].data.action_url).toContain("/nouveau-mot-de-passe?token=");
  });

  it("suspend puis réactive un club (sessions et clés d'API)", async () => {
    const c = await club({ name: "Club à suspendre" });
    const staff = await seed("staff", { clubId: c.clubId });
    await env.DB.prepare("UPDATE memberships SET status = 'suspended' WHERE user_id = ?").bind(staff.userId).run(); // déjà suspendu par le gérant
    const key = await apiKey(c.clubId, ["import"]);
    expect((await get("/api/club/bootstrap", c.token)).status).toBe(200);
    expect((await post(`/admin/api/clubs/${c.clubId}/suspendre`, admin.token, { confirm: true })).status).toBe(400); // raison obligatoire
    const s = await jsonOf(await post(`/admin/api/clubs/${c.clubId}/suspendre`, admin.token, { confirm: true, reason: "Demande du gérant" }));
    expect(s.suspended_users).toBe(1);
    expect((await get("/api/club/bootstrap", c.token)).status).toBe(403);
    expect((await get("/api/v1/import/jobs", key)).status).toBe(403);
    const l = await jsonOf(await get("/admin/api/clubs?etat=suspendu", admin.token));
    expect(l.clubs.map((x: any) => x.id)).toContain(c.clubId);
    await post(`/admin/api/clubs/${c.clubId}/reactiver`, admin.token, { confirm: true });
    expect((await get("/api/club/bootstrap", c.token)).status).toBe(200);
    expect((await get("/api/v1/import/jobs", key)).status).toBe(200);
    const st = await env.DB.prepare("SELECT status FROM memberships WHERE user_id = ?").bind(staff.userId).first<any>();
    expect(st.status).toBe("suspended"); // l'accès suspendu par le club le reste
  });
});

describe("vue « en tant que »", () => {
  const cookieOf = (r: Response, name: string) => {
    const all = (r.headers as any).getSetCookie ? (r.headers as any).getSetCookie() as string[] : [r.headers.get("set-cookie") || ""];
    const m = all.join("\n").match(new RegExp("(?:^|\\n|, )" + name + "=([^;]*)"));
    return m ? m[1] : null;
  };

  it("lecture seule, bandeau, journal, retour à la session admin", async () => {
    const c = await club({ name: "Club vu par l'admin" });
    const r = await post(`/admin/api/clubs/${c.clubId}/vue`, admin.token, { confirm: true });
    expect(r.status).toBe(200);
    const view = cookieOf(r, "piaffe_s")!, vue = cookieOf(r, "stabl_vue")!, back = cookieOf(r, "stabl_admin_retour")!;
    expect(view && vue && back).toBeTruthy();
    expect(back).toBe(admin.token);
    // Lecture : le gérant du club
    const me = await jsonOf(await get("/api/me", view));
    expect(me.user.email).toBe(c.email);
    expect((await get("/api/club/bootstrap", view)).status).toBe(200);
    // Écriture : refusée
    const w = await post("/api/records/batch", view, { ops: [{ op: "upsert", coll: "horses", id: "h9", data: { name: "Interdit" } }] });
    expect(w.status).toBe(403);
    expect((await jsonOf(w)).error.code).toBe("admin_view_readonly");
    // La session de vue ne glisse pas
    const sess = await env.DB.prepare("SELECT expires_at FROM sessions WHERE user_agent = 'stabl-admin-vue' AND user_id = ?").bind(c.userId).first<any>();
    expect(Date.parse(sess.expires_at) - Date.now()).toBeLessThan(61 * 60e3);
    // Bandeau
    const cookies = `piaffe_s=${view}; stabl_vue=${vue}; stabl_admin_retour=${back}`;
    const b = await call("/admin/bandeau.js", { headers: { cookie: cookies } });
    const js = await b.text();
    expect(js).toContain("Vue admin, lecture seule");
    expect(js).toContain("Club vu par l");
    expect(await (await call("/admin/bandeau.js", { headers: { cookie: `piaffe_s=${admin.token}` } })).text()).not.toContain("lecture seule");
    // /admin pendant la vue : page de retour, pas l'espace admin
    const pg = await call("/admin", { headers: { cookie: cookies } });
    expect(await pg.text()).toContain("Vue admin en cours");
    // Sortie
    const fin = await call("/admin/vue/fin", { method: "POST", headers: { cookie: cookies, "x-requested-with": "piaffe" } });
    expect((await jsonOf(fin)).url).toBe("/admin");
    expect(cookieOf(fin, "piaffe_s")).toBe(admin.token);
    expect((await get("/api/me", view)).status).toBe(401);
    const log = await env.DB.prepare("SELECT action FROM audit_log WHERE club_id = ? AND action LIKE 'admin.club.view_%' ORDER BY at").bind(c.clubId).all<any>();
    expect(log.results.map((x: any) => x.action)).toEqual(["admin.club.view_start", "admin.club.view_end"]);
    // La dernière connexion du club ignore la session de vue
    const d = await jsonOf(await get("/admin/api/clubs/" + c.clubId, admin.token));
    expect(d.club.last_login).not.toBeNull();
  });

  it("expire seule après l'heure", async () => {
    const c = await club({ name: "Club vue expirée" });
    const r = await post(`/admin/api/clubs/${c.clubId}/vue`, admin.token, { confirm: true });
    const view = cookieOf(r, "piaffe_s")!, vue = cookieOf(r, "stabl_vue")!;
    await env.DB.prepare("UPDATE admin_impersonations SET expires_at = ? WHERE id = ?").bind(iso(Date.now() - 1000), vue).run();
    const me = await call("/api/me", { headers: { cookie: `piaffe_s=${view}; stabl_vue=${vue}` } });
    expect(me.status).toBe(401);
    expect((await env.DB.prepare("SELECT ended_at FROM admin_impersonations WHERE id = ?").bind(vue).first<any>()).ended_at).not.toBeNull();
  });
});

describe("migrations", () => {
  it("liste les sessions et relance la simulation d'une migration en échec", async () => {
    const c = await club({ name: "Club en migration" });
    const j = await jsonOf(await post("/api/v1/import/jobs", c.token, { source: "kavalog", dry_run: true }));
    await post(`/api/v1/import/jobs/${j.job_id}/items`, c.token, { coll: "members", items: [{ external_id: "K1", data: { first: "Léa", last: "Martin" } }, { external_id: "K2", data: { first: "Hugo", last: "Petit" } }] });
    await env.DB.prepare("UPDATE import_jobs SET status = 'failed', report = ? WHERE id = ?").bind(JSON.stringify({ error: "Délai dépassé" }), j.job_id).run();
    await env.DB.prepare("INSERT INTO migration_incidents (id, club_id, software, step, message) VALUES (?,?,?,?,?)").bind(newId("inc"), c.clubId, "kavalog", "adhérents", "Page vide").run();
    const l = await jsonOf(await get("/admin/api/migrations", admin.token));
    const row = l.jobs.find((x: any) => x.id === j.job_id);
    expect(row.status).toBe("failed");
    expect(row.summary.error).toBe("Délai dépassé");
    expect(l.incidents.some((i: any) => i.message === "Page vide")).toBe(true);
    const diag = await jsonOf(await get("/admin/api/migrations/" + j.job_id, admin.token));
    expect(diag.items.members).toBe(2);
    expect(diag.incidents).toHaveLength(1);
    expect((await post(`/admin/api/migrations/${j.job_id}/relancer`, admin.token, {})).status).toBe(409);
    const re = await jsonOf(await post(`/admin/api/migrations/${j.job_id}/relancer`, admin.token, { confirm: true }));
    expect(re.status).toBe("simulated");
    expect(re.summary.found).toBe(2);
    // Rien n'est écrit chez le club
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM records WHERE club_id = ? AND coll = 'members'").bind(c.clubId).first<any>()).n).toBe(0);
    // Le gérant peut maintenant confirmer
    const commit = await post(`/api/v1/import/jobs/${j.job_id}/commit`, c.token, { dry_run: false });
    expect(commit.status).toBe(200);
  });
});

describe("support", () => {
  it("formulaire public, robot piégé, rattachement au compte, traitement", async () => {
    const r = await call("/api/contact", { method: "POST", headers: { origin: "https://stablapp.fr" }, json: { name: "Claire", email: "claire@centre-exemple.fr", subject: "Démo", message: "Bonjour, une démo est-elle possible ?" } });
    expect(r.status).toBe(201);
    expect(r.headers.get("access-control-allow-origin")).toBe("https://stablapp.fr");
    expect((await call("/api/contact", { method: "POST", json: { email: "pas-un-email", message: "Bonjour" } })).status).toBe(400);
    expect((await call("/api/contact", { method: "POST", headers: { origin: "https://pirate.example" }, json: { email: "a@b.fr", message: "Bonjour" } })).status).toBe(403);
    const bot = await call("/api/contact", { method: "POST", json: { email: "bot@spam.fr", message: "Achetez", site_web: "http://spam" } });
    expect(bot.status).toBe(201);
    const form = await call("/api/contact", { method: "POST", headers: { "content-type": "application/x-www-form-urlencoded" }, body: "email=form%40exemple.fr&message=Message+par+formulaire" });
    expect(form.status).toBe(201);
    const c = await club({ name: "Club qui écrit" });
    await call("/api/contact", { method: "POST", token: c.token, json: { email: c.email, message: "Je n'arrive pas à importer mes chevaux." } });
    const l = await jsonOf(await get("/admin/api/support?etat=nouveau", admin.token));
    expect(l.messages.some((m: any) => m.email === "bot@spam.fr")).toBe(false);
    const mine = l.messages.find((m: any) => m.email === c.email);
    expect(mine).toMatchObject({ source: "app", club_name: "Club qui écrit" });
    await call("/admin/api/support/" + mine.id, { method: "PATCH", token: admin.token, json: { status: "traite", note: "Rappelé" } });
    const done = await jsonOf(await get("/admin/api/support?etat=traite", admin.token));
    expect(done.messages.find((m: any) => m.id === mine.id).note).toBe("Rappelé");
  });
  it("une demande de rappel du site prévient l'équipe Stabl par e-mail (réponse directe au visiteur)", async () => {
    const r = await call("/api/contact", { method: "POST", headers: { origin: "https://stablapp.fr" }, json: { name: "Paul Rappel", email: "paul.rappel@centre-exemple.fr", phone: "06 12 34 56 78", message: "Rappelez-moi pour une démo." } });
    expect(r.status).toBe(201);
    const mails = (await env.DB.prepare("SELECT to_email, subject, reply_to, template FROM email_outbox WHERE reply_to = ?").bind("paul.rappel@centre-exemple.fr").all<any>()).results;
    expect(mails.map((m) => m.to_email).sort()).toEqual(["admin.stabl@exemple.fr", "seconde.admin@exemple.fr"]);
    expect(mails[0].template).toBe("club_notice");
    expect(mails[0].subject).toContain("Demande de rappel");
    const tel = await call("/api/contact", { method: "POST", headers: { origin: "https://stablapp.fr" }, json: { name: "Sans Mail", email: "", phone: "07 11 22 33 44", message: "Rappel svp, le matin." } });
    expect(tel.status).toBe(201);
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM email_outbox WHERE subject LIKE ?").bind("%Sans Mail%").first<any>()).n).toBe(2);
    expect((await call("/api/contact", { method: "POST", json: { email: "", phone: "12", message: "Bonjour" } })).status).toBe(400);
    const bot = await call("/api/contact", { method: "POST", json: { email: "robot.rappel@spam.fr", phone: "0600000000", message: "Achetez", site_web: "x" } });
    expect(bot.status).toBe(201);
    expect((await env.DB.prepare("SELECT COUNT(*) AS n FROM email_outbox WHERE reply_to = ?").bind("robot.rappel@spam.fr").first<any>()).n).toBe(0);
  });
});

describe("prospection", () => {
  it("import CSV en deux temps, doublons ignorés, statut, suppression confirmée", async () => {
    const csv = "﻿Nom;Ville;E-mail pro;Source\nÉcurie des Saules;Lyon;contact@saules.fr;Annuaire FFE\n\"Centre \"\"Le Galop\"\"\";Annecy;bonjour@galop.fr;Salon\n;Vide;x@y.fr;\nMauvais;Paris;pas-un-mail;\n";
    const pre = await jsonOf(await post("/admin/api/prospects/import", admin.token, { csv }));
    expect(pre.preview).toBe(true);
    expect(pre.rows).toBe(2);
    expect(pre.rejected).toHaveLength(2);
    expect((await jsonOf(await get("/admin/api/prospects", admin.token))).prospects.some((p: any) => p.email === "contact@saules.fr")).toBe(false);
    const ok = await jsonOf(await post("/admin/api/prospects/import", admin.token, { csv, confirm: true }));
    expect(ok).toMatchObject({ created: 2, skipped: 0 });
    const again = await jsonOf(await post("/admin/api/prospects/import", admin.token, { csv, confirm: true }));
    expect(again).toMatchObject({ created: 0, skipped: 2 });
    const l = await jsonOf(await get("/admin/api/prospects?q=galop", admin.token));
    expect(l.prospects[0].name).toBe('Centre "Le Galop"');
    const id = l.prospects[0].id;
    await call("/admin/api/prospects/" + id, { method: "PATCH", token: admin.token, json: { status: "demo", notes: "Démo jeudi" } });
    const d = await jsonOf(await get("/admin/api/prospects?statut=demo", admin.token));
    expect(d.prospects[0]).toMatchObject({ id, status: "demo", notes: "Démo jeudi" });
    expect(d.prospects[0].last_contact_at).not.toBeNull();
    expect((await call("/admin/api/prospects/" + id, { method: "DELETE", token: admin.token, json: {} })).status).toBe(409);
    expect((await call("/admin/api/prospects/" + id, { method: "DELETE", token: admin.token, json: { confirm: true } })).status).toBe(200);
    // Une adresse sans origine est refusée
    expect((await post("/admin/api/prospects", admin.token, { name: "Sans source", email: "a@centre.fr" })).status).toBe(400);
    expect((await post("/admin/api/prospects/import", admin.token, { csv: "nom;email\nX;x@centre.fr\n", confirm: true })).status).toBe(400);
  });
});

describe("réglages et journal", () => {
  it("affiche les prix et l'état des intégrations sans aucun secret", async () => {
    const r = await get("/admin/api/reglages", admin.token);
    const txt = await r.clone().text();
    expect(txt).not.toContain("sk_test_fake");
    expect(txt).not.toContain("google-secret-test");
    expect(txt).not.toContain(ADMIN);
    const d = await jsonOf(r);
    expect(d.plans.map((p: any) => p.key)).toEqual(["essentiel", "club", "domaine"]);
    const st = Object.fromEntries(d.integrations.map((i: any) => [i.key, i.status]));
    expect(st).toMatchObject({ stripe: "test", mail: "test", google: "ok", einvoice: "test" });
    expect(d.admins.count).toBe(2);
    const j = await jsonOf(await get("/admin/api/journal", admin.token));
    expect(j.entries.length).toBeGreaterThan(3);
    expect(j.entries.every((e: any) => e.action.startsWith("admin."))).toBe(true);
  });
});

describe("garde globale", () => {
  it("note les erreurs 5xx dans admin_errors", async () => {
    const t = new Hono<AppEnv>();
    t.onError(errorHandler);
    t.use("*", loadAuth);
    t.use("*", adminGuard);
    t.get("/api/boum", () => { throw new Error("Panne simulée"); });
    const waits: Promise<unknown>[] = [];
    const ctx = { waitUntil: (p: Promise<unknown>) => waits.push(p), passThroughOnException() {}, props: {} } as unknown as ExecutionContext;
    const r = await t.fetch(new Request("http://piaffe.test/api/boum?token=secret"), env, ctx);
    expect(r.status).toBe(500);
    await Promise.all(waits);
    const e = await env.DB.prepare("SELECT * FROM admin_errors WHERE path = '/api/boum'").first<any>();
    expect(e).toMatchObject({ method: "GET", status: 500, message: "Panne simulée" });
    const d = await jsonOf(await get("/admin/api/dashboard", admin.token));
    expect(d.health.errors_24h).toBeGreaterThan(0);
    expect(d.health.level).toBe("bad");
  });
});

describe("calculs", () => {
  it("revenu mensuel, quota d'e-mails, état, fin d'essai, CSV", () => {
    expect(monthlyCents({ plan: "club", interval: "month", founder: 0 })).toBe(14900);
    expect(monthlyCents({ plan: "domaine", interval: "year", founder: 0 })).toBe(Math.round(289000 / 12));
    expect(monthlyCents({ plan: "essentiel", interval: "month", founder: 1 })).toBe(9900);
    expect(monthlyCents({ plan: null, interval: null, founder: 0 })).toBe(0);
    expect(mailQuota("brevo", 280, 2000)).toMatchObject({ day_cap: 300, pct: 93, level: "bad" });
    expect(mailQuota("resend", 10, 2400)).toMatchObject({ pct: 80, level: "warn" });
    expect(mailQuota("log", 5, 5).level).toBe("ok");
    const now = Date.parse("2026-11-26T12:00:00Z");
    expect(clubState({ plan_status: "trialing", trial_ends_at: "2026-11-27T12:00:00Z" }, now).label).toBe("Essai, dernier jour");
    expect(clubState({ plan_status: "active", trial_ends_at: null, suspended_at: "x" }, now).key).toBe("suspendu");
    expect(extendedTrialEnd("2026-11-30T12:00:00Z", 10, now)).toBe("2026-12-10T12:00:00.000Z");
    expect(extendedTrialEnd("2026-11-01T12:00:00Z", 10, now)).toBe("2026-12-06T12:00:00.000Z");
    const p = parseProspectsCsv("name,city,email\r\nA,\"Saint-Martin, Ré\",a@b.fr\r\n");
    expect(p.rows[0]).toMatchObject({ name: "A", city: "Saint-Martin, Ré", email: "a@b.fr" });
    expect(parseProspectsCsv("ville;email\nLyon;a@b.fr").rejected[0].reason).toContain("nom");
  });
});
