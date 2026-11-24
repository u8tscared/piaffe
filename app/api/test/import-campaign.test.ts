import { describe, it, expect } from "vitest";
import { call, env, seed } from "./helpers";
import { apiKey, outbox, putRecord } from "./mail-kit";
import { runCampaigns } from "../src/import/campaign";
import { logSent } from "../src/mail/providers";

async function clubForCampaign() {
  const o = await seed("owner");
  await putRecord(o.clubId, "forfaits", "f1", { name: "Forfait annuel 1 h / semaine", price: 780 });
  await putRecord(o.clubId, "members", "m001", { first: "Léa", last: "Martin", email: "lea.campagne@exemple.fr", forfait: "f1", balance: -195 });
  await putRecord(o.clubId, "members", "m002", { first: "Zoé", last: "Martin" });
  await putRecord(o.clubId, "members", "m003", { first: "Tom", last: "Durand", email: "tom.campagne@exemple.fr", balance: 0 });
  await putRecord(o.clubId, "horses", "h01", { name: "Ulysse de la Roche", owner: "m001" });
  await putRecord(o.clubId, "lessons", "l01", { dow: 3, start: "17:00", title: "Galop 3-4", riders: ["m001"] });
  return o;
}

describe("campagne d'accueil après migration", () => {
  it("programme, envoie l'annonce avec le récapitulatif, suit ouvertures et activations, relance à J+3 et J+7", async () => {
    const o = await clubForCampaign();
    const r = await call("/api/migration/campagne", { method: "POST", token: o.token, json: { date_envoi: new Date(Date.now() - 60000).toISOString(), cibles: "tous", logiciel_precedent: "Kavalog" } });
    expect(r.status).toBe(201);
    const { campagne } = (await r.json()) as any;
    expect(campagne).toMatchObject({ cibles: 2, sans_email: 1 });
    await runCampaigns(env);
    const rec = await env.DB.prepare("SELECT * FROM migration_recipients WHERE campaign_id = ? ORDER BY email").bind(campagne.id).all<any>();
    const lea = rec.results.find((x: any) => x.member_id === "m001");
    const mail = logSent.find((m) => m.id === lea.announce_mail)!;
    expect(mail.subject).toContain("change d'application");
    expect(mail.text).toContain("Forfait annuel 1 h / semaine");
    expect(mail.text).toContain("195");
    expect(mail.text).toContain("mercredi 17 h, Galop 3-4");
    expect(mail.text).toContain("Ulysse de la Roche");
    expect(mail.html).toContain(`/api/migration/o/${lea.id}.gif`);
    // Ouverture
    const px = await call(`/api/migration/o/${lea.id}.gif`);
    expect(px.headers.get("content-type")).toBe("image/gif");
    // Activation : le GET n'active rien, le POST connecte et rattache la fiche.
    const link = /(\/api\/migration\/activer\/act_[A-Za-z0-9_-]+)/.exec(mail.text)![1];
    const page = await call(link);
    expect(page.status).toBe(200);
    expect(await page.text()).toContain("<form method=\"post\"");
    expect((await env.DB.prepare("SELECT activated_at FROM migration_recipients WHERE id = ?").bind(lea.id).first<any>()).activated_at).toBeNull();
    const act = await call(link, { method: "POST", headers: { origin: "http://piaffe.test" }, redirect: "manual" });
    expect(act.status).toBe(303);
    expect(act.headers.get("location")).toContain("/bienvenue?migration=1");
    expect(act.headers.get("set-cookie")).toContain("piaffe_s=");
    const u = await env.DB.prepare("SELECT u.id, u.email_verified_at, m.role, m.person_ref FROM users u JOIN memberships m ON m.user_id = u.id WHERE u.email = ? AND m.club_id = ?").bind("lea.campagne@exemple.fr", o.clubId).first<any>();
    expect(u).toMatchObject({ role: "member", person_ref: "m001" });
    expect(u.email_verified_at).toBeTruthy();
    const reuse = await call(link, { method: "POST", headers: { origin: "http://piaffe.test" }, redirect: "manual" });
    expect(reuse.headers.get("location")).toContain("activation=deja");
    // Relances : seul Tom, qui n'a pas activé, est relancé ; une seule fois par niveau.
    await runCampaigns(env, new Date(Date.now() + 3.2 * 864e5));
    await runCampaigns(env, new Date(Date.now() + 3.3 * 864e5));
    await runCampaigns(env, new Date(Date.now() + 7.5 * 864e5));
    const after = await env.DB.prepare("SELECT member_id, reminder1_mail, reminder2_mail FROM migration_recipients WHERE campaign_id = ?").bind(campagne.id).all<any>();
    const tom = after.results.find((x: any) => x.member_id === "m003"), lea2 = after.results.find((x: any) => x.member_id === "m001");
    expect(tom.reminder1_mail).toBeTruthy();
    expect(tom.reminder2_mail).toBeTruthy();
    expect(lea2.reminder1_mail).toBeNull();
    expect((await outbox(tom.reminder2_mail)).subject).toContain("Dernier rappel");
    const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM email_outbox WHERE to_email = 'tom.campagne@exemple.fr' AND template = 'migration_reminder'").first<any>();
    expect(n.n).toBe(2);
    const s: any = await (await call("/api/migration/campagne", { token: o.token })).json();
    expect(s.campagnes[0].suivi).toMatchObject({ cibles: 2, envoyes: 2, ouverts: 1, actives: 1, rebonds: 0 });
  });
  it("réservée au gérant, limitée à son club", async () => {
    const o = await clubForCampaign();
    const m = await seed("member", { clubId: o.clubId });
    expect((await call("/api/migration/campagne", { method: "POST", token: m.token, json: { cibles: "tous" } })).status).toBe(403);
    const other = await seed("owner");
    expect((await call("/api/migration/campagne", { method: "POST", token: other.token, json: { cibles: "tous" } })).status).toBe(400);
    expect((await call("/api/migration/campagne", { method: "POST", token: o.token, json: { date_envoi: "demain" } })).status).toBe(400);
    expect((await call("/api/migration/activer/act_faux", { method: "POST", headers: { origin: "http://piaffe.test" }, redirect: "manual" })).headers.get("location")).toContain("activation=invalide");
  });
});

describe("outil de migration : recettes et incidents", () => {
  it("recettes partagées et versionnées, écriture réservée au scope migration", async () => {
    const o = await seed("owner");
    const imp = await apiKey(o.clubId, ["import"]), mig = await apiKey(o.clubId, ["migration"]);
    expect((await call("/api/v1/migration/recettes", { method: "POST", token: imp, json: { logiciel: "kavalog", recette: { a: 1 } } })).status).toBe(403);
    const a = await call("/api/v1/migration/recettes", { method: "POST", token: mig, json: { logiciel: "kavalog", recette: { etapes: ["export"] } } });
    expect(a.status).toBe(201);
    const b: any = await (await call("/api/v1/migration/recettes", { method: "POST", token: mig, json: { logiciel: "kavalog", recette: { etapes: ["export", "factures"] } } })).json();
    expect(b.version).toBe(2);
    const other = await seed("owner");
    const l: any = await (await call("/api/v1/migration/recettes?logiciel=kavalog", { token: await apiKey(other.clubId) })).json();
    expect(l.recettes).toHaveLength(1);
    expect(l.recettes[0]).toMatchObject({ version: 2, recette: { etapes: ["export", "factures"] } });
  });
  it("signalement d'un robot cassé avec capture PNG rangée dans R2", async () => {
    const o = await seed("owner");
    const key = await apiKey(o.clubId);
    const png = btoa(String.fromCharCode(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3));
    const r = await call("/api/v1/migration/incidents", { method: "POST", token: key, json: { logiciel: "kavalog", etape: "export cavaliers", message: "Bouton introuvable", capture_b64: png } });
    expect(r.status).toBe(201);
    const { id } = (await r.json()) as any;
    const row = await env.DB.prepare("SELECT screenshot_key FROM migration_incidents WHERE id = ?").bind(id).first<any>();
    expect(await env.FILES.get(row.screenshot_key)).not.toBeNull();
    expect((await call("/api/v1/migration/incidents", { method: "POST", token: key, json: { logiciel: "kavalog" } })).status).toBe(400);
    expect((await call("/api/v1/migration/incidents", { method: "POST", token: key, json: { logiciel: "k", etape: "e", message: "m", capture_b64: btoa("pas une image") } })).status).toBe(400);
  });
});
