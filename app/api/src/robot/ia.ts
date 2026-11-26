/*
 * Pilote facultatif du robot : un modèle Claude regarde la page (vuePilote) et propose UNE action à la fois.
 * Sans la clé ANTHROPIC_API_KEY, rien n'est appelé et le robot fait sans. Ce que le modèle propose passe ensuite par
 * les garde-fous du code (migration/robot/garde-fous.mjs) : jamais le modèle ne décide seul d'un clic.
 * Le petit modèle d'abord ; le modèle au-dessus seulement si le premier n'y arrive pas (o.fort).
 * La vue envoyée ne contient ni mot de passe ni champ de saisie d'une ligne de données ; elle est coupée à 30 000 signes.
 */
import Anthropic from "@anthropic-ai/sdk";
import type { EnvRobot } from "./coffre";
import { CONSIGNE_PILOTE, SCHEMA_PILOTE } from "./migration";

export const MODELE_RAPIDE = "claude-haiku-5-5";
export const MODELE_FORT = "claude-sonnet-5-5";

export type Pilote = (vue: any, o?: { fort?: boolean }) => Promise<Record<string, unknown> | null>;

/** Raccourcit la page, jamais l'historique, pour tenir dans la limite. */
export function vueCompacte(vue: any, max = 30000): string {
  let v = vue, t = JSON.stringify(v);
  for (let n = 0; t.length > max && n < 6; n++) {
    const p = v.page || {};
    v = { ...v, page: { ...p, els: (p.els || []).slice(0, Math.max(40, Math.floor((p.els || []).length * 0.75))), listes: (p.listes || []).slice(0, Math.max(3, (p.listes || []).length - 1)), texte: String(p.texte || "").slice(0, 400) } };
    t = JSON.stringify(v);
  }
  return t.slice(0, max + 2000);
}

export function creerPilote(env: EnvRobot, fabrique?: (cle: string) => Pick<Anthropic, "messages">): Pilote | null {
  const cle = env.ANTHROPIC_API_KEY;
  if (!cle) return null;
  const client = fabrique ? fabrique(cle) : new Anthropic({ apiKey: cle, maxRetries: 1, timeout: 30000 });
  return async (vue, o = {}) => {
    const r = await client.messages.create({
      model: o.fort ? MODELE_FORT : MODELE_RAPIDE,
      max_tokens: 1500,
      system: [{ type: "text", text: CONSIGNE_PILOTE, cache_control: { type: "ephemeral" } }],
      output_config: { format: { type: "json_schema", schema: SCHEMA_PILOTE as Record<string, unknown> } },
      messages: [{ role: "user", content: vueCompacte(vue) }],
    });
    if (r.stop_reason === "refusal") return null;
    const bloc = r.content.find((b) => b.type === "text");
    if (!bloc || bloc.type !== "text") return null;
    try { return JSON.parse(bloc.text); } catch { return null; }
  };
}
