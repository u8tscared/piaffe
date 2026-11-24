import { describe, it, expect } from "vitest";
import { call, env } from "./helpers";
import { outbox } from "./mail-kit";
import { handleMailWebhook, verifySvix } from "../src/mail/webhook";
import { sendMail } from "../src/mail/send";
import { TEMPLATES } from "../src/mail/templates";
import type { Env } from "../src/env";

const SECRET = "whsec_" + btoa("cle-secrete-de-test-0123456789");
const e = { ...env, DB: env.DB, MAIL_WEBHOOK_SECRET: SECRET } as unknown as Env;

async function svixSign(id: string, ts: string, payload: string) {
  const key = await crypto.subtle.importKey("raw", Uint8Array.from(atob(SECRET.slice(6)), (c) => c.charCodeAt(0)), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(`${id}.${ts}.${payload}`)));
  return "v1," + btoa(String.fromCharCode(...mac));
}
function req(body: string, headers: Record<string, string>, url = "http://piaffe.test/webhooks/mail") {
  return new Request(url, { method: "POST", body, headers: { "content-type": "application/json", ...headers } });
}

describe("webhook des fournisseurs d'e-mail", () => {
  it("refuse tout tant que le secret n'est pas configuré", async () => {
    const r = await call("/webhooks/mail", { method: "POST", json: { type: "email.bounced" } });
    expect(r.status).toBe(503);
  });
  it("Resend (Svix) : signature vérifiée, rebond définitif → adresse bloquée, rejeu sans effet", async () => {
    const id = await sendMail(env, { to: "rebond@exemple.fr", template: "payment_receipt", data: TEMPLATES.payment_receipt.sample });
    const row = await outbox(id);
    await env.DB.prepare("UPDATE email_outbox SET provider_id = 're_abc' WHERE id = ?").bind(id).run();
    const payload = JSON.stringify({ type: "email.bounced", data: { email_id: "re_abc", to: ["rebond@exemple.fr"], bounce: { type: "Permanent" } } });
    const ts = String(Math.floor(Date.now() / 1000));
    const sig = await svixSign("msg_1", ts, payload);
    const r1 = await handleMailWebhook(e, req(payload, { "svix-id": "msg_1", "svix-timestamp": ts, "svix-signature": sig }));
    expect(r1.handled).toBe(1);
    const r2 = await handleMailWebhook(e, req(payload, { "svix-id": "msg_1", "svix-timestamp": ts, "svix-signature": sig }));
    expect(r2.handled).toBe(0);
    expect((await outbox(row.id)).delivery).toBe("bounced");
    const s = await env.DB.prepare("SELECT reason FROM email_suppressions WHERE email = 'rebond@exemple.fr'").first<any>();
    expect(s.reason).toBe("hard_bounce");
    const next = await sendMail(env, { to: "rebond@exemple.fr", template: "reset_password", data: { reset_url: "https://x.fr" } });
    expect((await outbox(next)).status).toBe("suppressed");
  });
  it("Resend : signature fausse ou horodatage trop ancien → 401", async () => {
    const payload = JSON.stringify({ type: "email.complained", data: { to: ["x@exemple.fr"] } });
    const ts = String(Math.floor(Date.now() / 1000));
    await expect(handleMailWebhook(e, req(payload, { "svix-id": "m2", "svix-timestamp": ts, "svix-signature": "v1,AAAA" }))).rejects.toMatchObject({ status: 401 });
    const old = String(Math.floor(Date.now() / 1000) - 3600);
    expect(await verifySvix(SECRET, "m3", old, await svixSign("m3", old, payload), payload)).toBe(false);
  });
  it("Brevo : jeton Bearer, plainte → seuls les e-mails non essentiels sont bloqués", async () => {
    const body = JSON.stringify({ event: "spam", email: "plainte@exemple.fr", "message-id": "<m@relay>", id: 1, ts_event: 1 });
    await expect(handleMailWebhook(e, req(body, { authorization: "Bearer mauvais" }))).rejects.toMatchObject({ status: 401 });
    const r = await handleMailWebhook(e, req(body, { authorization: "Bearer " + SECRET }));
    expect(r.handled).toBe(1);
    const a = await sendMail(env, { to: "plainte@exemple.fr", template: "booking_confirmed", data: TEMPLATES.booking_confirmed.sample });
    const b = await sendMail(env, { to: "plainte@exemple.fr", template: "invoice_issued", data: TEMPLATES.invoice_issued.sample });
    expect((await outbox(a)).status).toBe("suppressed");
    expect((await outbox(b)).status).toBe("sent");
    const viaQuery = await handleMailWebhook(e, req(JSON.stringify({ event: "hard_bounce", email: "q@exemple.fr", id: 2 }), {}, "http://piaffe.test/webhooks/mail?token=" + encodeURIComponent(SECRET)));
    expect(viaQuery.handled).toBe(1);
  });
});
