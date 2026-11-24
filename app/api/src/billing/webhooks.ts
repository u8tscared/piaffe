import { Hono } from "hono";
import type { AppEnv, Env } from "../env";
import { one, run } from "../lib/db";
import { nowIso } from "../lib/ids";
import { verifyStripeSignature } from "./stripe";
import { handlePlatformEvent } from "./subscription";
import { handleConnectEvent } from "./connect";

type Source = "platform" | "connect";
type Ctx = { waitUntil(p: Promise<unknown>): void } | null;

/** Événements à cocher dans Stripe pour chaque point de terminaison (voir le rapport du lot B). */
export const PLATFORM_EVENTS = [
  "checkout.session.completed", "customer.subscription.created", "customer.subscription.updated", "customer.subscription.deleted",
  "customer.subscription.trial_will_end", "invoice.paid", "invoice.payment_failed",
];
export const CONNECT_EVENTS = [
  "account.updated", "checkout.session.completed", "checkout.session.async_payment_failed", "checkout.session.expired",
  "payment_intent.processing", "payment_intent.succeeded", "payment_intent.payment_failed", "charge.refunded",
  "setup_intent.succeeded", "mandate.updated",
];

/**
 * Traitement d'un webhook : signature, puis idempotence par stripe_events. Un événement déjà traité
 * (ou en cours depuis moins de 2 minutes) répond 200 sans rien refaire ; un échec répond 500 pour
 * que Stripe réessaie, et la nouvelle tentative le retraite.
 */
export async function processWebhook(env: Env, ctx: Ctx, source: Source, raw: string, sig: string | undefined) {
  const secret = source === "platform" ? env.STRIPE_WEBHOOK_SECRET : env.STRIPE_CONNECT_WEBHOOK_SECRET;
  if (!(await verifyStripeSignature(raw, sig, secret))) return { status: 400 as const, body: { error: { code: "invalid_signature", message: "Signature invalide." } } };
  let evt: any;
  try { evt = JSON.parse(raw); } catch { return { status: 400 as const, body: { error: { code: "invalid_json", message: "Corps invalide." } } }; }
  if (!evt || typeof evt.id !== "string" || typeof evt.type !== "string") return { status: 400 as const, body: { error: { code: "invalid_event", message: "Événement invalide." } } };
  if (source === "connect" && !evt.account) return { status: 200 as const, body: { received: true, ignored: true } };

  const db = env.DB;
  const ins = await run(db, "INSERT OR IGNORE INTO stripe_events (id, source, account, type) VALUES (?,?,?,?)", evt.id, source, evt.account || null, evt.type);
  if (!ins.meta.changes) {
    const ex = await one<{ status: string; received_at: string }>(db, "SELECT status, received_at FROM stripe_events WHERE id = ?", evt.id);
    if (ex && (ex.status === "processed" || ex.status === "ignored")) return { status: 200 as const, body: { received: true, duplicate: true } };
    if (ex && ex.status === "processing" && Date.now() - Date.parse(ex.received_at) < 120e3) return { status: 200 as const, body: { received: true, duplicate: true } };
    await run(db, "UPDATE stripe_events SET status = 'processing', attempts = attempts + 1, received_at = ? WHERE id = ?", nowIso(), evt.id);
  }
  try {
    const r = source === "platform" ? await handlePlatformEvent(env, ctx, evt) : await handleConnectEvent(env, ctx, evt);
    await run(db, "UPDATE stripe_events SET status = ?, processed_at = ?, error = NULL WHERE id = ?", r === "ok" ? "processed" : "ignored", nowIso(), evt.id);
    return { status: 200 as const, body: { received: true, result: r } };
  } catch (e) {
    console.error("webhook stripe", source, evt.type, (e as Error)?.message);
    await run(db, "UPDATE stripe_events SET status = 'failed', error = ? WHERE id = ?", String((e as Error)?.message || e).slice(0, 300), evt.id);
    return { status: 500 as const, body: { error: { code: "processing_failed", message: "Traitement impossible, Stripe réessaiera." } } };
  }
}

const app = new Hono<AppEnv>();
for (const [path, source] of [["/webhooks/stripe", "platform"], ["/webhooks/stripe-connect", "connect"]] as const) {
  app.post(path, async (c) => {
    const raw = await c.req.text();
    if (raw.length > 512 * 1024) return c.json({ error: { code: "too_large", message: "Corps trop volumineux." } }, 400);
    const r = await processWebhook(c.env, c.executionCtx, source, raw, c.req.header("stripe-signature"));
    return c.json(r.body, r.status);
  });
}
export default app;
