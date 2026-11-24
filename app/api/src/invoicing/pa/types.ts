import type { Env } from "../../env";

/**
 * Contrat d'une plateforme agréée (PA, ex-PDP). Un adaptateur par plateforme ; le choix se fait par
 * EINVOICE_PROVIDER (sandbox par défaut). Chaque appel reçoit le compte du club (jetons déchiffrés).
 * Les adaptateurs n'écrivent jamais en base : c'est einvoice.ts qui enregistre les résultats.
 */
export interface PaAccount {
  club_id: string;
  external_id: string | null;
  credentials: Record<string, any>;   // déchiffré (jetons OAuth, identifiant d'entreprise…)
}

export interface LifecycleEvent {
  provider_event_id: string;
  invoice_ref: string;      // référence de la facture chez la plateforme
  code: string;             // statut normé : 200 à 213
  at: string;               // ISO
  reason?: string | null;
}

export interface EreportingPayload {
  kind: "transactions" | "payments";
  period_start: string; period_end: string;      // AAAA-MM-JJ inclus
  seller_siren: string;
  currency: "EUR";
  /** transactions : ventes aux particuliers (et à l'étranger) agrégées par jour, catégorie et taux. */
  transactions?: { date: string; category: "TLB1" | "TPS1" | "TNT1" | "TMA1"; rate_bp: number; base: number; vat: number; count: number }[];
  /** payments : encaissements des prestations de services (TVA à l'encaissement), par jour et par taux. */
  payments?: { date: string; rate_bp: number; amount: number; invoice_ref?: string | null }[];
}

export interface IncomingRef { ref: string; received_at: string }
export interface IncomingDoc { ref: string; format: "cii" | "ubl" | "facturx"; xml: string | null; pdf: Uint8Array | null }

export interface PaProvider {
  readonly name: string;
  /** Raccordement d'un club : renvoie l'état et, pour OAuth, l'URL à ouvrir. */
  connect(env: Env, club: { id: string; siren: string | null; name: string }, redirectUri: string): Promise<{ status: "connected" | "pending"; authorize_url?: string; external_id?: string; credentials?: Record<string, any> }>;
  /** Fin du parcours OAuth (code reçu sur le callback). */
  completeConnect?(env: Env, code: string, redirectUri: string): Promise<{ external_id: string | null; credentials: Record<string, any> }>;
  submitInvoice(env: Env, acc: PaAccount, doc: { number: string; xml: string; pdf: Uint8Array; external_id: string }): Promise<{ ref: string; code: string }>;
  getStatus(env: Env, acc: PaAccount, since: string | null): Promise<{ events: LifecycleEvent[]; cursor: string | null }>;
  /** Statut émis par le club lui-même (ex. 212 « Encaissée » pour une facture B2B de services). */
  sendStatus?(env: Env, acc: PaAccount, invoiceRef: string, code: string, details?: { rate_bp: number; amount: number }[]): Promise<void>;
  submitEreporting(env: Env, acc: PaAccount, payload: EreportingPayload): Promise<{ ref: string }>;
  listIncoming(env: Env, acc: PaAccount, cursor: string | null): Promise<{ items: IncomingRef[]; cursor: string | null }>;
  fetchIncoming(env: Env, acc: PaAccount, ref: string): Promise<IncomingDoc>;
  /** Credentials renouvelés pendant un appel (rotation des jetons) : einvoice.ts les réenregistre. */
  refreshed?: Map<string, Record<string, any>>;
}

export class PaError extends Error {
  constructor(public code: "auth" | "rejected" | "unavailable" | "not_supported", message: string, public status?: number) { super(message); }
}

/** fetch injectable (tests). */
let _fetch: typeof fetch = (...a) => fetch(...a);
export function setFetch(f?: typeof fetch) { _fetch = f || ((...a) => fetch(...a)); }
export function paFetch(input: RequestInfo | URL, init?: RequestInit) { return _fetch(input, init); }
