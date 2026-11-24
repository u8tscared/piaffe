/* Réactions du lot e-mail aux événements des autres lots. */
import { on } from "../lib/events";
import { one } from "../lib/db";
import { enqueue } from "./outbox";

/** Après la création d'un club : e-mail de bienvenue au gérant (une seule fois par club). */
on("club.created", async (env, e) => {
  const club = await one<{ id: string; name: string; trial_ends_at: string | null }>(env.DB, "SELECT id, name, trial_ends_at FROM clubs WHERE id = ?", e.club_id);
  const user = await one<{ email: string; first: string | null }>(env.DB, "SELECT email, first FROM users WHERE id = ?", e.user_id);
  if (!club || !user) return;
  const app = (env.APP_URL || "").replace(/\/$/, "");
  await enqueue(env, { to: user.email, template: "welcome_owner", data: {
    first: user.first, club_name: club.name, dashboard_url: app + "/", trial_ends_at: club.trial_ends_at, import_url: app + "/reglages/import",
  } }, { dedupe_key: "welcome_owner:" + club.id });
});
