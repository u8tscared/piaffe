import type { Env } from "../../env";
import type { PaProvider, PaAccount, LifecycleEvent, EreportingPayload, IncomingDoc } from "./types";
import { PaError } from "./types";

/**
 * Plateforme « sandbox » : simule une plateforme agréée sans aucun appel réseau, avec un état rangé dans R2
 * (préfixe sandbox-pa/) pour fonctionner d'une requête à l'autre. Utilisée par défaut et dans les tests.
 * Comportement : une facture déposée reçoit aussitôt 200 Déposée puis, au relevé suivant, 202 Reçue,
 * 203 Mise à disposition et 205 Approuvée. Un numéro de facture contenant « REJET » est rejeté (213),
 * un client dont le SIREN est 000000000 refuse la facture (210). Les factures reçues s'injectent avec inject().
 */
const P = "sandbox-pa/";
let seq = 0;
const stamp = () => `${Date.now().toString().padStart(15, "0")}-${String(++seq).padStart(6, "0")}`;

async function putJson(env: Env, key: string, v: unknown) { await env.FILES.put(key, JSON.stringify(v), { httpMetadata: { contentType: "application/json" } }); }
async function getJson<T>(env: Env, key: string): Promise<T | null> { const o = await env.FILES.get(key); return o ? (JSON.parse(await o.text()) as T) : null; }
async function list(env: Env, prefix: string): Promise<string[]> {
  const out: string[] = []; let cursor: string | undefined;
  do { const r = await env.FILES.list({ prefix, cursor }); out.push(...r.objects.map((o) => o.key)); cursor = r.truncated ? r.cursor : undefined; } while (cursor);
  return out.sort();
}
async function addEvent(env: Env, club: string, ev: Omit<LifecycleEvent, "provider_event_id">) {
  const id = stamp();
  await putJson(env, `${P}${club}/events/${id}.json`, { ...ev, provider_event_id: "sbe_" + id });
}

export const sandbox: PaProvider & {
  inject(env: Env, clubId: string, xml: string, ref?: string): Promise<string>;
  pushEvent(env: Env, clubId: string, invoiceRef: string, code: string, reason?: string): Promise<void>;
  reports(env: Env, clubId: string): Promise<EreportingPayload[]>;
} = {
  name: "sandbox",

  async connect(_env, club) {
    if (!club.siren) throw new PaError("rejected", "Renseignez le SIREN du club avant de le raccorder à la plateforme.");
    return { status: "connected", external_id: "sbx_" + club.siren, credentials: { mode: "sandbox" } };
  },

  async submitInvoice(env, acc, doc) {
    if (!doc.xml.includes("CrossIndustryInvoice")) throw new PaError("rejected", "Format de facture non reconnu.");
    const ref = "sbx_inv_" + doc.external_id;
    const existing = await getJson(env, `${P}${acc.club_id}/out/${ref}.json`);
    if (existing) return { ref, code: "200" }; // idempotent
    const rejected = /REJET/i.test(doc.number);
    const refused = /<ram:BuyerTradeParty>[\s\S]*?schemeID="0002">000000000</.test(doc.xml);
    await putJson(env, `${P}${acc.club_id}/out/${ref}.json`, { number: doc.number, at: new Date().toISOString(), rejected, refused, step: 0 });
    await addEvent(env, acc.club_id, { invoice_ref: ref, code: rejected ? "213" : "200", at: new Date().toISOString(), reason: rejected ? "Contrôle de format : facture rejetée (simulation)." : null });
    return { ref, code: rejected ? "213" : "200" };
  },

  async getStatus(env, acc, since) {
    // Fait avancer chaque facture d'une étape à chaque relevé.
    for (const key of await list(env, `${P}${acc.club_id}/out/`)) {
      const st = await getJson<any>(env, key); if (!st || st.rejected || st.step >= 1) continue;
      const ref = key.slice(key.lastIndexOf("/") + 1, -5);
      const at = new Date().toISOString();
      await addEvent(env, acc.club_id, { invoice_ref: ref, code: "202", at });
      await addEvent(env, acc.club_id, { invoice_ref: ref, code: "203", at });
      await addEvent(env, acc.club_id, st.refused ? { invoice_ref: ref, code: "210", at, reason: "Client inconnu (simulation)." } : { invoice_ref: ref, code: "205", at });
      st.step = 1; await putJson(env, key, st);
    }
    const keys = (await list(env, `${P}${acc.club_id}/events/`)).filter((k) => !since || k > since);
    const events: LifecycleEvent[] = [];
    for (const k of keys) { const e = await getJson<LifecycleEvent>(env, k); if (e) events.push(e); }
    return { events, cursor: keys.length ? keys[keys.length - 1] : since };
  },

  async sendStatus(env, acc, invoiceRef, code) {
    await putJson(env, `${P}${acc.club_id}/status/${stamp()}.json`, { invoice_ref: invoiceRef, code });
  },

  async submitEreporting(env, acc, payload) {
    if (!/^\d{9}$/.test(payload.seller_siren)) throw new PaError("rejected", "SIREN du déclarant invalide.");
    const ref = `sbx_rep_${payload.kind}_${payload.period_start}`;
    await putJson(env, `${P}${acc.club_id}/reports/${payload.kind}-${payload.period_start}.json`, payload);
    return { ref };
  },

  async listIncoming(env, acc, cursor) {
    const keys = (await list(env, `${P}${acc.club_id}/in/`)).filter((k) => !cursor || k > cursor);
    return { items: keys.map((k) => ({ ref: k.slice(k.lastIndexOf("/") + 1, -4), received_at: new Date().toISOString() })), cursor: keys.length ? keys[keys.length - 1] : cursor };
  },

  async fetchIncoming(env, acc, ref): Promise<IncomingDoc> {
    const o = await env.FILES.get(`${P}${acc.club_id}/in/${ref}.xml`);
    if (!o) throw new PaError("rejected", "Facture reçue introuvable.");
    const xml = await o.text();
    return { ref, format: xml.includes("urn:oasis:names:specification:ubl") ? "ubl" : "cii", xml, pdf: null };
  },

  async inject(env, clubId, xml, ref) {
    const r = ref || stamp();
    await env.FILES.put(`${P}${clubId}/in/${r}.xml`, xml);
    return r;
  },
  async pushEvent(env, clubId, invoiceRef, code, reason) {
    await addEvent(env, clubId, { invoice_ref: invoiceRef, code, at: new Date().toISOString(), reason: reason || null });
  },
  async reports(env, clubId) {
    const out: EreportingPayload[] = [];
    for (const k of await list(env, `${P}${clubId}/reports/`)) { const p = await getJson<EreportingPayload>(env, k); if (p) out.push(p); }
    return out;
  },
};
export type SandboxProvider = typeof sandbox;
