import type { Env } from "../../env";
import type { PaProvider } from "./types";
import { sandbox } from "./sandbox";
import { superpdp } from "./superpdp";

const PROVIDERS: Record<string, PaProvider> = { sandbox, superpdp };
let override: PaProvider | null = null;
/** Tests : force un fournisseur. */
export function setProvider(p: PaProvider | null) { override = p; }
export function provider(env: Env): PaProvider {
  if (override) return override;
  return PROVIDERS[String(env.EINVOICE_PROVIDER || "sandbox").toLowerCase()] || sandbox;
}
export { sandbox, superpdp };
