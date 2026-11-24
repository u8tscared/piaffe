/** Liaisons et variables du Worker (voir wrangler.jsonc). */
export interface Env {
  DB: D1Database;
  FILES: R2Bucket;
  ASSETS: Fetcher;
  APP_URL: string;
  MAIL_FROM: string;
  MAIL_PROVIDER: string; // log | resend | brevo
  MAIL_API_KEY?: string;
  EINVOICE_PROVIDER: string; // sandbox | <plateforme agréée>
  EINVOICE_API_KEY?: string;
  PLATFORM_LEGAL_NAME: string;
  PLATFORM_TRADE_NAME: string;
  PLATFORM_SIREN: string;
  PLATFORM_SIRET: string;
  PLATFORM_ADDRESS: string;
  /** franchise (TVA non applicable, art. 293 B du CGI) | normal */
  PLATFORM_VAT_REGIME: string;
  PLATFORM_LEGAL_NOTE: string;
  SESSION_SECRET: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  STRIPE_SECRET_KEY?: string;
  STRIPE_WEBHOOK_SECRET?: string;
  STRIPE_CONNECT_WEBHOOK_SECRET?: string;
}

export type Role = "owner" | "manager" | "staff" | "coach" | "member" | "accountant";

export interface AuthUser { id: string; email: string; first: string | null; last: string | null; email_verified_at: string | null }
export interface AuthClub { id: string; name: string; slug: string; plan: string; plan_status: string }
export interface AuthMembership { role: Role; person_ref: string | null }

/** Variables Hono posées par le middleware d'authentification. */
export interface Vars {
  user: AuthUser | null;
  sessionId: string | null;
  club: AuthClub | null;
  membership: AuthMembership | null;
  apiKey: { id: string; club_id: string; scopes: string[] } | null;
}

export type AppEnv = { Bindings: Env; Variables: Vars };
