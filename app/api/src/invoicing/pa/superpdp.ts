import type { Env } from "../../env";
import type { PaProvider, PaAccount, LifecycleEvent } from "./types";
import { PaError, paFetch } from "./types";

/**
 * Adaptateur SUPER PDP (plateforme agréée, https://www.superpdp.tech), choisi pour son coût quasi nul :
 * compte gratuit jusqu'à 1 000 factures par mois, API à 0,01 € HT par facture, e-reporting compté une facture
 * par jour, intégration « marque grise » prévue pour les éditeurs (voir REGLES.md).
 *
 * Sources de l'API : SDK public bluerock/superpdp-php-client (MIT), qui documente l'URL de base, OAuth2
 * (authorization code, jetons de rafraîchissement à rotation) et les routes /v1.beta/… utilisées ici. La
 * documentation officielle (superpdp.tech/documentation) n'était pas lisible depuis notre environnement :
 * les routes marquées « À CONFIRMER » sont à vérifier sur le compte éditeur avant la mise en production.
 *
 * Authentification : chaque club autorise Piaffe sur son propre compte SUPER PDP (OAuth2), Piaffe agit ensuite
 * pour son compte. EINVOICE_API_KEY = « client_id:client_secret » de l'application éditeur Piaffe.
 */
export const SUPERPDP_BASE = "https://api.superpdp.tech";
/** À CONFIRMER : route de dépôt des données d'e-reporting (non exposée par le SDK public). */
export const SUPERPDP_EREPORTING_PATH = "/v1.beta/e_reportings";

function client(env: Env) {
  const [id, secret] = String(env.EINVOICE_API_KEY || "").split(":");
  if (!id || !secret) throw new PaError("auth", "La clé EINVOICE_API_KEY (client_id:client_secret SUPER PDP) n'est pas configurée.");
  return { id, secret };
}

async function tokenRequest(env: Env, params: Record<string, string>) {
  const { id, secret } = client(env);
  const r = await paFetch(SUPERPDP_BASE + "/oauth2/token", {
    method: "POST", headers: { "content-type": "application/x-www-form-urlencoded", accept: "application/json" },
    body: new URLSearchParams({ ...params, client_id: id, client_secret: secret }).toString(),
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok || !j.access_token) throw new PaError("auth", "La plateforme a refusé l'authentification : reconnectez le compte de facture électronique.", r.status);
  return { access_token: j.access_token as string, refresh_token: (j.refresh_token as string) || params.refresh_token, expires_at: Date.now() + (Number(j.expires_in) || 3600) * 1000 - 60_000 };
}

async function token(env: Env, acc: PaAccount, self: PaProvider): Promise<string> {
  const c = acc.credentials;
  if (c.access_token && c.expires_at && c.expires_at > Date.now()) return c.access_token;
  if (!c.refresh_token) throw new PaError("auth", "Le compte de facture électronique doit être reconnecté.");
  const t = await tokenRequest(env, { grant_type: "refresh_token", refresh_token: c.refresh_token });
  Object.assign(acc.credentials, t);
  self.refreshed?.set(acc.club_id, { ...acc.credentials }); // rotation : l'ancien jeton de rafraîchissement est invalide
  return t.access_token;
}

async function api(env: Env, acc: PaAccount, self: PaProvider, path: string, init: RequestInit = {}): Promise<Response> {
  const t = await token(env, acc, self);
  const h = new Headers(init.headers); h.set("authorization", "Bearer " + t); if (!h.has("accept")) h.set("accept", "application/json");
  const r = await paFetch(SUPERPDP_BASE + path, { ...init, headers: h });
  if (r.status === 401) throw new PaError("auth", "Le compte de facture électronique doit être reconnecté.", 401);
  if (r.status === 404) throw new PaError("not_supported", "Service non disponible chez la plateforme.", 404);
  if (r.status === 400 || r.status === 422) {
    const j: any = await r.json().catch(() => ({}));
    throw new PaError("rejected", "Facture refusée par la plateforme : " + String(j.message || j.error || "format invalide").slice(0, 300), r.status);
  }
  if (!r.ok) throw new PaError("unavailable", "La plateforme ne répond pas, nouvel essai automatique plus tard.", r.status);
  return r;
}
const code = (s: string) => String(s || "").replace(/^fr:/, "");

export const superpdp: PaProvider = {
  name: "superpdp",
  refreshed: new Map(),

  async connect(env, club, redirectUri) {
    const { id } = client(env);
    const state = crypto.randomUUID();
    const u = new URL(SUPERPDP_BASE + "/oauth2/authorize");
    u.searchParams.set("response_type", "code"); u.searchParams.set("client_id", id);
    u.searchParams.set("redirect_uri", redirectUri); u.searchParams.set("state", state);
    return { status: "pending", authorize_url: u.toString(), credentials: { state, siren: club.siren } };
  },

  async completeConnect(env, code_, redirectUri) {
    const t = await tokenRequest(env, { grant_type: "authorization_code", code: code_, redirect_uri: redirectUri });
    const r = await paFetch(SUPERPDP_BASE + "/v1.beta/companies/me", { headers: { authorization: "Bearer " + t.access_token, accept: "application/json" } });
    const me: any = r.ok ? await r.json().catch(() => ({})) : {};
    return { external_id: me.id != null ? String(me.id) : me.number || null, credentials: { ...t, siren: me.number || null } };
  },

  async submitInvoice(env, acc, doc) {
    const r = await api(env, acc, this, `/v1.beta/invoices?external_id=${encodeURIComponent(doc.external_id)}`, {
      method: "POST", headers: { "content-type": "application/pdf" }, body: doc.pdf,
    });
    const j: any = await r.json();
    const last = Array.isArray(j.events) && j.events.length ? j.events[j.events.length - 1] : null;
    return { ref: String(j.id), code: last ? code(last.status_code) : "200" };
  },

  async getStatus(env, acc, since) {
    const events: LifecycleEvent[] = [];
    let cursor = since;
    for (let page = 0; page < 20; page++) {
      const q = new URLSearchParams({ limit: "100" }); if (cursor) q.set("starting_after_id", cursor);
      const j: any = await (await api(env, acc, this, "/v1.beta/invoice_events?" + q)).json();
      for (const e of j.data || []) {
        events.push({ provider_event_id: String(e.id), invoice_ref: String(e.invoice_id), code: code(e.status_code), at: e.created_at || new Date().toISOString(), reason: e.status_text || null });
        cursor = String(e.id);
      }
      if (!j.has_after) break;
    }
    return { events, cursor };
  },

  async sendStatus(env, acc, invoiceRef, statusCode, details) {
    await api(env, acc, this, "/v1.beta/invoice_events", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({
        invoice_id: Number(invoiceRef) || invoiceRef, status_code: "fr:" + statusCode,
        details: details?.map((d) => ({ vat_rate: (d.rate_bp / 100).toFixed(1), net_amount: (d.amount / 100).toFixed(2), currency_code: "EUR", type_code: "MEN" })),
      }),
    });
  },

  async submitEreporting(env, acc, payload) {
    const r = await api(env, acc, this, SUPERPDP_EREPORTING_PATH, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) });
    const j: any = await r.json().catch(() => ({}));
    return { ref: String(j.id ?? `${payload.kind}-${payload.period_start}`) };
  },

  async listIncoming(env, acc, cursor) {
    const items: { ref: string; received_at: string }[] = [];
    let c = cursor;
    for (let page = 0; page < 10; page++) {
      const q = new URLSearchParams({ direction: "in", limit: "100" }); if (c) q.set("starting_after_id", c);
      const j: any = await (await api(env, acc, this, "/v1.beta/invoices?" + q)).json();
      for (const i of j.data || []) { items.push({ ref: String(i.id), received_at: i.created_at || new Date().toISOString() }); c = String(i.id); }
      if (!j.has_after) break;
    }
    return { items, cursor: c };
  },

  async fetchIncoming(env, acc, ref) {
    const r = await api(env, acc, this, `/v1.beta/invoices/${encodeURIComponent(ref)}/download`, { headers: { accept: "*/*" } });
    const type = r.headers.get("content-type") || "";
    const buf = new Uint8Array(await r.arrayBuffer());
    if (/pdf/.test(type) || (buf[0] === 0x25 && buf[1] === 0x50)) return { ref, format: "facturx", xml: null, pdf: buf };
    const xml = new TextDecoder().decode(buf);
    return { ref, format: xml.includes("urn:oasis:names:specification:ubl") ? "ubl" : "cii", xml, pdf: null };
  },
};
