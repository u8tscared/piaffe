import { Hono } from "hono";
import type { AppEnv } from "../env";
import account from "./account";
import club from "./club";
import { purgeSessions } from "./session";
import { purgeTokens } from "./tokens";

/* Lot A · comptes : inscription, connexion, Google, vérification, mot de passe, lien magique, compte,
   clubs, invitations, équipe d'accès, clés d'API. Le middleware CSRF est exporté par ./csrf. */
const app = new Hono<AppEnv>();
app.route("/", account);
app.route("/", club);
export default app;
export { csrf } from "./csrf";

/** Purge des sessions, jetons, états OAuth et invitations expirés (cron toutes les 10 minutes et quotidien). */
export async function cron(env: AppEnv["Bindings"], _cron: string): Promise<void> {
  await purgeSessions(env);
  await purgeTokens(env);
}
