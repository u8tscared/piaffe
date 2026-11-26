import type { Env } from "../env";
import { run } from "../lib/db";
import { newId, nowIso } from "../lib/ids";
import { ClubData, longTime, type Caller } from "./data";
import { listTools, toolsFor, ToolError } from "./tools";

/** MCP en JSON-RPC 2.0 sur HTTP « streamable » (réponses JSON, sans flux d'événements). */
export const VERSIONS = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
export const SERVER_INFO = { name: "stabl", title: "Stabl", version: "1.0.0" };

export const INSTRUCTIONS = [
  "Tu es relié à Stabl, le logiciel de gestion du centre équestre ou de l'écurie de la personne. Ces outils lisent les vraies données de son club, en direct.",
  "Commence par l'outil « club » : il donne la date du jour, ce qui demande de l'attention et la liste des outils permis à cette personne.",
  "Appuie chaque conseil sur les chiffres lus et cite-les. Les montants sont en euros TTC sauf mention HT.",
  "Les outils de lecture ne modifient rien. Les outils d'écriture (ajouter_soin, reserver_place, cocher_tache) ne servent qu'à la demande explicite de la personne : récapitule d'abord ce qui sera enregistré, attends son « oui », puis appelle l'outil avec confirme: true. Un seul enregistrement à la fois.",
  "Chaque réponse porte « donnees_du » (heure de lecture) et « derniere_saisie » (dernière modification dans Stabl) : si rien n'a été saisi depuis plus de 7 jours, dis-le, les chiffres peuvent être en retard sur la réalité.",
  "Si un outil répond « vide », dis ce qu'il manque dans Stabl plutôt que d'inventer. Ne communique pas les coordonnées des adhérents en dehors de l'équipe du club.",
].join(" ");

export const RATE_PER_MIN = 60;

type Msg = { jsonrpc?: unknown; id?: unknown; method?: unknown; params?: any };

export async function rpc(env: Env, caller: Caller, m: Msg, ctx: { waitUntil(p: Promise<unknown>): void } | null) {
  const id = m && (m as any).id;
  const ok = (result: unknown) => ({ jsonrpc: "2.0", id, result });
  const ko = (code: number, message: string) => ({ jsonrpc: "2.0", id: id === undefined ? null : id, error: { code, message } });
  if (!m || typeof m !== "object" || m.jsonrpc !== "2.0" || typeof m.method !== "string") return ko(-32600, "Invalid Request");
  if (id === undefined || id === null) return null; // notification : rien à répondre
  const p = m.params && typeof m.params === "object" ? m.params : {};
  switch (m.method) {
    case "initialize":
      return ok({ protocolVersion: VERSIONS.includes(p.protocolVersion) ? p.protocolVersion : VERSIONS[1], capabilities: { tools: { listChanged: false } }, serverInfo: SERVER_INFO, instructions: INSTRUCTIONS });
    case "ping": return ok({});
    case "tools/list": return ok({ tools: listTools(caller.role, caller.scopes) });
    case "tools/call":
      if (typeof p.name !== "string") return ko(-32602, "Paramètre « name » attendu.");
      return ok(await callTool(env, caller, p.name, p.arguments && typeof p.arguments === "object" ? p.arguments : {}, ctx));
    case "resources/list": return ok({ resources: [] });
    case "resources/templates/list": return ok({ resourceTemplates: [] });
    case "prompts/list": return ok({ prompts: [] });
    case "logging/setLevel": return ok({});
  }
  return ko(-32601, "Method not found");
}

export async function callTool(env: Env, caller: Caller, name: string, args: Record<string, unknown>, ctx: { waitUntil(p: Promise<unknown>): void } | null) {
  const say = (o: unknown, isError = false) => ({ ...(isError ? { isError: true } : {}), content: [{ type: "text", text: typeof o === "string" ? o : JSON.stringify(o) }], ...(o && typeof o === "object" ? { structuredContent: o } : {}) });
  const tool = toolsFor(caller.role, caller.scopes).find((t) => t.name === name);
  if (!tool) {
    const exists = toolsFor("owner", ["lecture", "ecriture"]).some((t) => t.name === name);
    return say({ erreur: exists ? `L'outil « ${name} » n'est pas permis à cette connexion (rôle ou droits). Pour les ajouts, reconnectez Stabl en cochant « Permettre aussi les ajouts ».` : `Outil inconnu : ${name}` }, true);
  }
  const t0 = Date.now();
  let out: Record<string, unknown>, okRun = true;
  try {
    const d = await new ClubData(env, caller).init();
    if (!d.club) return say("Ce club n'existe plus dans Stabl.", true);
    const res = await tool.run(d, args);
    const last = await d.lastWrite();
    out = { ...res, donnees_du: longTime(d.tz) + " (en direct)", derniere_saisie: last ? longTime(d.tz, Date.parse(last)) : null };
  } catch (e) {
    okRun = false;
    out = { erreur: e instanceof ToolError ? e.message : "La lecture a échoué. Réessayez dans un instant." };
    if (!(e instanceof ToolError)) console.error("mcp tool", name, e);
  }
  const ms = Date.now() - t0;
  const summary = summarize(out);
  const log = (async () => {
    await run(env.DB, "INSERT INTO mcp_calls (id, club_id, grant_id, api_key_id, client_name, user_id, tool, args, ok, summary, ms, at) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)",
      newId("mcl"), caller.clubId, caller.grantId, caller.apiKeyId, caller.clientName, caller.userId, name, JSON.stringify(args).slice(0, 300), okRun ? 1 : 0, summary, ms, nowIso());
    if (caller.grantId) await run(env.DB, "UPDATE mcp_grants SET calls = calls + 1, last_used_at = ? WHERE id = ?", nowIso(), caller.grantId);
  })().catch((e) => console.error("mcp log", e));
  if (ctx) ctx.waitUntil(log); else await log;
  return okRun ? say(out) : say(out, true);
}

/** Résumé d'une ligne pour le journal de l'écran Connecteurs. */
function summarize(o: Record<string, unknown>): string {
  if (o.erreur) return String(o.erreur).slice(0, 140);
  if (o.vide) return "Rien dans Stabl";
  if (o.enregistre) return "Enregistré";
  for (const [k, v] of Object.entries(o)) if (Array.isArray(v)) return `${v.length} ${k.replace(/_/g, " ")}`;
  return "Lu";
}
