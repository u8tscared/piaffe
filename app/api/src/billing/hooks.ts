import { on } from "../lib/events";
import { scheduleAutopay } from "./connect";

/** Réactions du lot B aux événements des autres lots. */
let installed = false;
export function installBillingHooks() {
  if (installed) return;
  installed = true;
  // Facture émise (lot C) : si le payeur a un mandat SEPA actif avec prélèvement automatique,
  // une échéance est programmée (pré-notification, puis prélèvement par le cron).
  on("invoice.issued", async (env, e) => {
    if (typeof e.club_id === "string" && typeof e.invoice_id === "string") await scheduleAutopay(env, e.club_id, e.invoice_id);
  });
}
