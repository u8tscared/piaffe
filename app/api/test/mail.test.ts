import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { call, env, seed } from "./helpers";
import { outbox, putRecord, setClub } from "./mail-kit";
import { sendMail } from "../src/mail/send";
import { enqueue, processQueue, BACKOFF_MIN, MAX_ATTEMPTS } from "../src/mail/outbox";
import { logSent, setFetch } from "../src/mail/providers";
import { renderTemplate, loadClub, withAliases } from "../src/mail/render";
import { TEMPLATES } from "../src/mail/templates";
import { esc, typo } from "../src/mail/layout";
import { dateLong, euros, parisOffsetMin } from "../src/mail/fmt";
import { runDailyReminders, parisDay } from "../src/mail/reminders";
import type { Env } from "../src/env";

const mk = (o: Partial<Env> & Record<string, unknown>): Env => ({ ...env, DB: env.DB, FILES: env.FILES, SESSION_SECRET: env.SESSION_SECRET, APP_URL: env.APP_URL, MAIL_FROM: env.MAIL_FROM || "Stabl <bonjour@stablapp.fr>", ...o } as Env);
let calls: { url: string; init: RequestInit }[] = [];
const respond = (status: number, body: unknown) => { setFetch((async (url: any, init: any) => { calls.push({ url: String(url), init }); return new Response(JSON.stringify(body), { status }); }) as any); };
beforeEach(() => { calls = []; });
afterEach(() => setFetch(null));

describe("modèles d'e-mails", () => {
  it("chaque modèle se rend en HTML et en texte, sans valeur manquante", async () => {
    const { clubId } = await seed("owner");
    await setClub(clubId, { email: "contact@tilleuls.example", address: JSON.stringify({ line1: "12 chemin des Tilleuls", zip: "78730", city: "Saint-Arnoult" }) });
    const club = await loadClub(env, clubId);
    expect(Object.keys(TEMPLATES).length).toBeGreaterThanOrEqual(23);
    for (const [k, t] of Object.entries(TEMPLATES)) {
      const r = await renderTemplate(env, k, t.sample, club, "lea@exemple.fr");
      expect(r.subject.length, k).toBeGreaterThan(5);
      for (const bad of ["undefined", "NaN", "[object Object]", "null"]) { expect(r.html, k + " " + bad).not.toContain(bad); expect(r.text, k + " " + bad).not.toContain(bad); }
      expect(r.html).toContain('<html lang="fr"');
      expect(r.html).toContain("prefers-color-scheme:dark");
      expect(r.html).toContain("Écurie Test");
      expect(r.text.length).toBeGreaterThan(40);
      expect(r.html).not.toMatch(/—/);
    }
  });
  it("échappe les données et refuse les liens dangereux", async () => {
    const r = await renderTemplate(env, "booking_confirmed", { first: "<script>alert(1)</script>", title: "Galop \"3\" & 4", date: "2026-11-25", time: "17:00", manage_url: "javascript:alert(1)", ics_url: "javascript:x" }, null, "a@b.fr");
    expect(r.html).not.toContain("<script>alert");
    expect(r.html).toContain("&lt;script&gt;");
    expect(r.html).toContain("Galop &quot;3&quot; &amp; 4");
    expect(r.html).not.toContain('href="javascript:');
    expect(esc(`<a href="x">'`)).toBe("&lt;a href=&quot;x&quot;&gt;&#39;");
  });
  it("applique la typographie française et les formats", () => {
    expect(typo("Montant : 520 € ? Oui !")).toBe("Montant : 520 € ? Oui !");
    expect(euros(123456)).toBe("1 234,56 €");
    expect(euros(52000)).toBe("520 €");
    expect(dateLong("2026-12-01")).toBe("mardi 1er décembre 2026");
    expect(parisOffsetMin(new Date("2026-07-01T12:00:00Z"))).toBe(120);
    expect(parisOffsetMin(new Date("2026-11-24T12:00:00Z"))).toBe(60);
  });
  it("relance de paiement : trois niveaux de ton distincts", async () => {
    const s = await Promise.all([1, 2, 3].map((level) => renderTemplate(env, "payment_reminder", { ...TEMPLATES.payment_reminder.sample, level }, null)));
    expect(new Set(s.map((x) => x.subject)).size).toBe(3);
    expect(s[2].text).toContain("suspendre");
  });
  it("accepte les noms de champs des autres lots (action_url, expires_in_minutes, lesson_title…)", async () => {
    const r = await renderTemplate(env, "reset_password", { first: "Léa", action_url: "https://app.stablapp.fr/reset?token=abc", expires_in_minutes: 30 }, null);
    expect(r.html).toContain("https://app.stablapp.fr/reset?token=abc");
    expect(r.text).toContain("30 minutes");
    const b = withAliases("booking_confirmed", { lesson_title: "Galop 3", day: "mercredi", start: "17:00", coach_name: "Hugo", arena_name: "Grand manège" });
    expect(b).toMatchObject({ title: "Galop 3", time: "17:00", coach: "Hugo", arena: "Grand manège" });
    const r2 = await renderTemplate(env, "booking_confirmed", b, null);
    expect(r2.subject).toContain("mercredi");
    const inv = await renderTemplate(env, "invitation", { role: "accountant", action_url: "https://x.fr/i", club_name: "X" }, null);
    expect(inv.text).toContain("FEC");
  });
});

describe("file d'envoi", () => {
  it("envoie avec le nom du club et Reply-To vers le club", async () => {
    const { clubId } = await seed("owner");
    await setClub(clubId, { email: "contact@club.example" });
    const id = await sendMail(env, { to: "Lea@Exemple.fr", template: "invoice_issued", data: TEMPLATES.invoice_issued.sample, club_id: clubId });
    const row = await outbox(id);
    expect(row.status).toBe("sent");
    expect(row.from_name).toBe("Écurie Test via Stabl");
    expect(row.reply_to).toBe("contact@club.example");
    expect(row.to_email).toBe("lea@exemple.fr");
    expect(logSent.find((m) => m.id === id)?.headers["List-Unsubscribe"]).toBeUndefined();
  });
  it("efface le corps des e-mails sensibles dès l'envoi", async () => {
    const id = await sendMail(env, { to: "a@exemple.fr", template: "magic_link", data: { login_url: "https://x.fr/m?t=secret" } });
    const row = await outbox(id);
    expect(row.status).toBe("sent");
    expect(row.html).toBeNull();
  });
  it("ne lève jamais : modèle inconnu ou adresse invalide → échec enregistré", async () => {
    const a = await sendMail(env, { to: "a@exemple.fr", template: "nope", data: {} });
    const b = await sendMail(env, { to: "pas-une-adresse", template: "welcome_member", data: {} });
    expect((await outbox(a)).status).toBe("failed");
    expect((await outbox(b)).status).toBe("failed");
  });
  it("Resend : erreur 500 → reprise différée, puis envoi par le cron avec la même clé d'idempotence", async () => {
    const e = mk({ MAIL_PROVIDER: "resend", MAIL_API_KEY: "re_test" });
    respond(500, { message: "panne" });
    const id = await sendMail(e, { to: "b@exemple.fr", template: "payment_receipt", data: TEMPLATES.payment_receipt.sample });
    let row = await outbox(id);
    expect(row.status).toBe("queued");
    expect(row.attempts).toBe(1);
    expect(Date.parse(row.next_attempt_at) - Date.now()).toBeGreaterThan(BACKOFF_MIN[0] * 60000 - 5000);
    expect(calls[0].url).toBe("https://api.resend.com/emails");
    const h = new Headers(calls[0].init.headers);
    expect(h.get("authorization")).toBe("Bearer re_test");
    expect(h.get("idempotency-key")).toBe(id);
    const sent = JSON.parse(String(calls[0].init.body));
    expect(sent).toMatchObject({ to: ["b@exemple.fr"], subject: expect.stringContaining("Paiement reçu") });
    expect(sent.from).toContain("<bonjour@stablapp.fr>");
    await env.DB.prepare("UPDATE email_outbox SET next_attempt_at = ? WHERE id = ?").bind("2000-01-01T00:00:00Z", id).run();
    respond(200, { id: "re_123" });
    await processQueue(e);
    row = await outbox(id);
    expect(row.status).toBe("sent");
    expect(row.provider_id).toBe("re_123");
    expect(new Headers(calls[0].init.headers).get("idempotency-key")).toBe(id);
  });
  it("erreur 4xx du fournisseur : échec définitif, sans reprise", async () => {
    const e = mk({ MAIL_PROVIDER: "resend", MAIL_API_KEY: "re_test" });
    respond(422, { message: "domaine non vérifié" });
    const id = await sendMail(e, { to: "c@exemple.fr", template: "payment_receipt", data: TEMPLATES.payment_receipt.sample });
    expect((await outbox(id)).status).toBe("failed");
  });
  it("abandonne après le nombre maximal de tentatives", async () => {
    const e = mk({ MAIL_PROVIDER: "resend", MAIL_API_KEY: "re_test" });
    respond(503, {});
    const id = await sendMail(e, { to: "d@exemple.fr", template: "payment_receipt", data: TEMPLATES.payment_receipt.sample });
    for (let i = 1; i < MAX_ATTEMPTS; i++) {
      await env.DB.prepare("UPDATE email_outbox SET next_attempt_at = ? WHERE id = ?").bind("2000-01-01T00:00:00Z", id).run();
      await processQueue(e);
    }
    const row = await outbox(id);
    expect(row.attempts).toBe(MAX_ATTEMPTS);
    expect(row.status).toBe("failed");
  });
  it("Brevo : format sender / to / htmlContent et pièce jointe", async () => {
    const e = mk({ MAIL_PROVIDER: "brevo", MAIL_API_KEY: "xkeysib" });
    respond(201, { messageId: "<abc@relay>" });
    const pdf = btoa("%PDF-1.7 facture");
    const id = await sendMail(e, { to: "e@exemple.fr", template: "invoice_issued", data: TEMPLATES.invoice_issued.sample, attachments: [{ filename: "F-2026-1173.pdf", content_b64: pdf, type: "application/pdf" }] });
    expect(calls[0].url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(new Headers(calls[0].init.headers).get("api-key")).toBe("xkeysib");
    const b = JSON.parse(String(calls[0].init.body));
    expect(b.sender).toEqual({ name: "Stabl", email: "bonjour@stablapp.fr" });
    expect(b.to).toEqual([{ email: "e@exemple.fr" }]);
    expect(b.htmlContent).toContain("F-2026-1173");
    expect(b.attachment).toEqual([{ name: "F-2026-1173.pdf", content: pdf }]);
    expect((await outbox(id)).provider_id).toBe("<abc@relay>");
  });
  it("déduplication : la même clé ne crée qu'un e-mail", async () => {
    const a = await enqueue(env, { to: "f@exemple.fr", template: "welcome_owner", data: TEMPLATES.welcome_owner.sample }, { dedupe_key: "test:dedupe" });
    const b = await enqueue(env, { to: "f@exemple.fr", template: "welcome_owner", data: TEMPLATES.welcome_owner.sample }, { dedupe_key: "test:dedupe" });
    expect(a).toBe(b);
  });
});

describe("désinscription et préférences", () => {
  it("List-Unsubscribe sur les e-mails non essentiels, désinscription en deux temps, l'essentiel continue", async () => {
    const { clubId } = await seed("owner");
    const id = await sendMail(env, { to: "g@exemple.fr", template: "booking_confirmed", data: TEMPLATES.booking_confirmed.sample, club_id: clubId });
    const m = logSent.find((x) => x.id === id)!;
    expect(m.headers["List-Unsubscribe-Post"]).toBe("List-Unsubscribe=One-Click");
    const url = /<([^>]+)>/.exec(m.headers["List-Unsubscribe"])![1].replace("http://piaffe.test", "");
    expect((await call(url)).status).toBe(200);
    const g = await env.DB.prepare("SELECT COUNT(*) AS n FROM notification_prefs WHERE email = 'g@exemple.fr'").first<any>();
    expect(g.n).toBe(0); // le GET seul ne désinscrit pas (antivirus de messagerie)
    expect((await call(url, { method: "POST", body: "List-Unsubscribe=One-Click", headers: { "content-type": "application/x-www-form-urlencoded" } })).status).toBe(200);
    const again = await sendMail(env, { to: "g@exemple.fr", template: "booking_confirmed", data: TEMPLATES.booking_confirmed.sample, club_id: clubId });
    expect((await outbox(again)).status).toBe("skipped");
    const inv = await sendMail(env, { to: "g@exemple.fr", template: "invoice_issued", data: TEMPLATES.invoice_issued.sample, club_id: clubId });
    expect((await outbox(inv)).status).toBe("sent");
  });
  it("refuse un lien de désinscription falsifié", async () => {
    expect((await call("/api/mail/unsubscribe?t=abc.def")).status).toBe(400);
  });
  it("préférences de l'utilisateur connecté", async () => {
    const s = await seed("member", { email: "h@exemple.fr" });
    let r = await call("/api/mail/preferences", { method: "PUT", token: s.token, json: { categories: { reminders: false } } });
    expect(r.status).toBe(200);
    r = await call("/api/mail/preferences", { token: s.token });
    const j: any = await r.json();
    expect(j.categories.find((c: any) => c.key === "reminders").enabled).toBe(false);
    expect(j.categories.find((c: any) => c.key === "bookings").enabled).toBe(true);
    const id = await sendMail(env, { to: "h@exemple.fr", template: "lesson_reminder", data: TEMPLATES.lesson_reminder.sample, club_id: s.clubId });
    expect((await outbox(id)).status).toBe("skipped");
    expect((await call("/api/mail/preferences", { method: "PUT", token: s.token, json: { categories: { spam: true } } })).status).toBe(400);
  });
});

describe("aperçu des modèles", () => {
  it("le gérant voit la liste et l'aperçu ; un adhérent reçoit 403", async () => {
    const o = await seed("owner");
    const l: any = await (await call("/api/mail/templates", { token: o.token })).json();
    expect(l.templates.map((t: any) => t.key)).toContain("horse_care_reminder");
    const p = await call("/api/mail/preview/welcome_member", { token: o.token });
    expect(p.status).toBe(200);
    expect(p.headers.get("content-type")).toContain("text/html");
    expect(await p.text()).toContain("Activer mon espace");
    expect((await call("/api/mail/preview/welcome_member?format=text", { token: o.token })).status).toBe(200);
    expect((await call("/api/mail/preview/inconnu", { token: o.token })).status).toBe(404);
    const m = await seed("member", { clubId: o.clubId });
    expect((await call("/api/mail/preview/welcome_member", { token: m.token })).status).toBe(403);
    expect((await call("/api/mail/templates")).status).toBe(401);
  });
  it("journal d'envoi limité au club du gérant", async () => {
    const a = await seed("owner"), b = await seed("owner");
    await sendMail(env, { to: "i@exemple.fr", template: "payment_receipt", data: TEMPLATES.payment_receipt.sample, club_id: a.clubId });
    const ja: any = await (await call("/api/mail/outbox", { token: a.token })).json();
    const jb: any = await (await call("/api/mail/outbox", { token: b.token })).json();
    expect(ja.emails.length).toBe(1);
    expect(jb.emails.length).toBe(0);
  });
});

describe("rappels automatiques", () => {
  it("rappel de soin au propriétaire, sans doublon au second passage", async () => {
    const { clubId } = await seed("owner");
    const day = parisDay(2).iso;
    await putRecord(clubId, "members", "m001", { first: "Léa", last: "Martin", email: "lea.martin@exemple.fr" });
    await putRecord(clubId, "horses", "h01", { name: "Ulysse de la Roche", owner: "m001" });
    await putRecord(clubId, "care", "s2", { horse: "h01", kind: "Maréchal", who: "Benoît Gautier", date: day, time: "09:00", status: "planifié" });
    await putRecord(clubId, "care", "s3", { horse: "h01", kind: "Vétérinaire", date: day, time: "10:00", status: "planifié" });
    const r1 = await runDailyReminders(env);
    const r2 = await runDailyReminders(env);
    expect(r1.care).toBeGreaterThanOrEqual(1);
    const rows = await env.DB.prepare("SELECT subject FROM email_outbox WHERE template = 'horse_care_reminder' AND club_id = ?").bind(clubId).all<any>();
    expect(rows.results.length).toBe(1);
    expect(rows.results[0].subject).toContain("Ulysse de la Roche");
    expect(r2.care).toBeGreaterThanOrEqual(1);
  });
  it("rappel de reprise la veille, seulement si le club l'active", async () => {
    const { clubId } = await seed("owner");
    const t = parisDay(1);
    await putRecord(clubId, "members", "m002", { first: "Emma", last: "Moreau", email: "emma.moreau@exemple.fr" });
    await putRecord(clubId, "staff", "s02", { first: "Hugo", last: "Lefèvre" });
    await putRecord(clubId, "lessons", "l01", { dow: t.dow, start: "17:00", dur: 60, title: "Galop 3-4", coach: "s02", riders: ["m002"], horses: {} });
    await runDailyReminders(env);
    let n = await env.DB.prepare("SELECT COUNT(*) AS n FROM email_outbox WHERE template = 'lesson_reminder' AND club_id = ?").bind(clubId).first<any>();
    expect(n.n).toBe(0);
    await setClub(clubId, { settings: JSON.stringify({ mail: { lesson_reminder: true } }) });
    await runDailyReminders(env);
    n = await env.DB.prepare("SELECT COUNT(*) AS n FROM email_outbox WHERE template = 'lesson_reminder' AND club_id = ?").bind(clubId).first<any>();
    expect(n.n).toBe(1);
  });
});
