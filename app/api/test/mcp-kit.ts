import { env, call, seed } from "./helpers";
import { b64url, randomToken, sha256 } from "../src/lib/crypto";
import { newId } from "../src/lib/ids";
import { dayIn, addDays } from "../src/mcp/data";

export const today = () => dayIn("Europe/Paris");
export { addDays };

export async function put(clubId: string, coll: string, id: string, data: Record<string, unknown>) {
  await env.DB.prepare("INSERT OR REPLACE INTO records (club_id, coll, id, data) VALUES (?,?,?,?)").bind(clubId, coll, id, JSON.stringify({ ...data, ...(id === "_" ? {} : { id }) })).run();
}
export async function get(clubId: string, coll: string, id: string) {
  const r = await env.DB.prepare("SELECT data, version FROM records WHERE club_id = ? AND coll = ? AND id = ?").bind(clubId, coll, id).first<{ data: string; version: number }>();
  return r ? { ...JSON.parse(r.data), _v: r.version } : null;
}

/** Un petit club réaliste, dates relatives à aujourd'hui. */
export async function fillClub(clubId: string) {
  const t = today();
  await put(clubId, "club", "_", { name: "Écurie Test", city: "Lyon", boxes: 10, arenas: [{ id: "a1", name: "Grand manège" }] });
  await put(clubId, "staff", "s01", { first: "Claire", last: "Dumont", role: "Gérante", contract: "CDI", hours: 45 });
  await put(clubId, "staff", "s05", { first: "Antoine", last: "Leroy", role: "Palefrenier", contract: "CDI 39 h", hours: 39 });
  await put(clubId, "members", "m001", { first: "Léa", last: "Martin", age: 27, galop: 7, fam: "F1", email: "lea@exemple.fr", phone: "06 00 00 00 01", balance: -410, licence: "2027", cert: true, forfait: "f1" });
  await put(clubId, "members", "m002", { first: "Zoé", last: "Laurent", age: 12, minor: true, galop: 3, fam: "F2", email: "zoe@exemple.fr", licence: "À renouveler", cert: false });
  await put(clubId, "members", "m003", { first: "Tom", last: "Petit", age: 14, minor: true, galop: 3, fam: "F3" });
  await put(clubId, "forfaits", "f1", { name: "Forfait annuel", price: 780 });
  await put(clubId, "horses", "h01", { name: "Ulysse de la Roche", box: "B01", kind: "proprietaire", owner: "m001", pension: "pc", status: "warn", alerts: ["Ferrure prévue jeudi"], costMonth: 400, vacc: addDays(t, -360), worm: addDays(t, -200), farrier: addDays(t, -10) });
  await put(clubId, "horses", "h02", { name: "Quiétude", box: "B02", kind: "club", status: "ok", alerts: [] });
  await put(clubId, "pensionPlans", "pc", { name: "Pension complète", price: 520, inc: ["Box", "Foin"] });
  await put(clubId, "care", "c1", { horse: "h02", kind: "Vétérinaire", who: "Dr Leclerc", date: t, time: "14:00", note: "Boiterie", status: "planifié" });
  await put(clubId, "care", "c2", { horse: "h01", kind: "Maréchal", who: "B. Gautier", date: addDays(t, -9), status: "en retard" });
  await put(clubId, "stock", "k1", { name: "Copeaux", unit: "sacs", qty: 10, min: 20, daily: 2, supplier: "Litière Pro", price: 11.5 });
  const dow = new Date(t + "T12:00:00Z").getUTCDay();
  await put(clubId, "lessons", "l01", { dow, start: "17:00", dur: 60, title: "Galop 3", coach: "s01", arena: "a1", cap: 2, riders: ["m002"], horses: {}, status: "prévue" });
  await put(clubId, "lessons", "l02", { dow, start: "18:00", dur: 60, title: "Galop 3", coach: "s01", arena: "a1", cap: 1, riders: ["m003"], horses: {}, status: "prévue" });
  await put(clubId, "invoices", "F-2026-0001", { member: "m001", label: "Pension novembre", amount: 520, vat: 20, date: addDays(t, -50), due: addDays(t, -40), status: "en retard" });
  await put(clubId, "invoices", "F-2026-0002", { member: "m002", label: "Carte 10 séances", amount: 290, vat: 20, date: addDays(t, -3), due: addDays(t, 10), status: "envoyée" });
  await put(clubId, "tasks", "t1", { title: "Curer les boxes", who: "s05", time: "09:00", done: false });
  await put(clubId, "competitions", "k1", { name: "CSO Club", place: "Rambouillet", date: addDays(t, 5), disc: "CSO" });
  await put(clubId, "entries", "e1", { comp: "k1", rider: "m001", horse: "h01", class: "Club Élite", fee: 26, coach: "s01" });
  await put(clubId, "contracts", "ct1", { title: "Contrat de pension complète", party: "m001", horse: "h01", status: "à signer", signers: ["m001", "s01"], signed: ["s01"] });
}

export async function pkce() {
  const verifier = randomToken(40);
  const challenge = b64url(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier)));
  return { verifier, challenge };
}

export const REDIRECT = "https://claude.ai/api/mcp/auth_callback";

export async function registerClient(name = "Claude") {
  const r = await call("/oauth/register", { method: "POST", json: { client_name: name, redirect_uris: [REDIRECT], token_endpoint_auth_method: "none" } });
  return (await r.json()) as any;
}

const form = (o: Record<string, string>) => ({ method: "POST", body: new URLSearchParams(o).toString(), headers: { "content-type": "application/x-www-form-urlencoded" } });
export { form };

/** Parcours complet : enregistrement, accord par la personne (session), échange du code. Renvoie les jetons. */
export async function connect(session: { token: string; clubId: string }, o: { write?: boolean; scope?: string } = {}) {
  const cl = await registerClient();
  const p = await pkce();
  const q = new URLSearchParams({ response_type: "code", client_id: cl.client_id, redirect_uri: REDIRECT, state: "etat123", code_challenge: p.challenge, code_challenge_method: "S256", scope: o.scope || "lecture", resource: "http://piaffe.test/mcp" });
  const a = await call("/oauth/authorize?" + q, { redirect: "manual" });
  const loc = a.headers.get("location")!;
  const demande = new URL(loc, "http://piaffe.test").searchParams.get("demande")!;
  const page = await call("/oauth/authorize?demande=" + demande, { headers: { cookie: "piaffe_s=" + session.token } });
  const htmlTxt = await page.text();
  const jeton = /name="jeton" value="([^"]+)"/.exec(htmlTxt)![1];
  const fields: Record<string, string> = { demande, jeton, club: session.clubId, decision: "autoriser" };
  if (o.write) fields.ecriture = "1";
  const f = form(fields);
  const d = await call("/oauth/authorize", { ...f, headers: { ...f.headers, cookie: "piaffe_s=" + session.token }, redirect: "manual" });
  const back = new URL(d.headers.get("location")!);
  const code = back.searchParams.get("code")!;
  const t = await call("/oauth/token", form({ grant_type: "authorization_code", code, code_verifier: p.verifier, client_id: cl.client_id, redirect_uri: REDIRECT, resource: "http://piaffe.test/mcp" }));
  const tok = (await t.json()) as any;
  return { ...tok, client_id: cl.client_id, back };
}

let rid = 0;
export async function mcp(token: string, method: string, params: Record<string, unknown> = {}) {
  const r = await call("/mcp", { method: "POST", token, json: { jsonrpc: "2.0", id: ++rid, method, params }, headers: { accept: "application/json, text/event-stream" } });
  return { status: r.status, body: r.status === 200 ? ((await r.json()) as any) : await r.text(), headers: r.headers };
}
/** Appelle un outil et renvoie le JSON de sa réponse. */
export async function tool(token: string, name: string, args: Record<string, unknown> = {}) {
  const r = await mcp(token, "tools/call", { name, arguments: args });
  const res = r.body.result;
  return { isError: !!res.isError, data: JSON.parse(res.content[0].text), raw: res };
}

export async function apiKey(clubId: string, scopes: string[]) {
  const token = "pk_live_" + randomToken(8) + "_" + randomToken(24);
  await env.DB.prepare("INSERT INTO api_keys (id, club_id, name, prefix, hash, scopes) VALUES (?,?,?,?,?,?)").bind(newId("key"), clubId, "Test", token.slice(0, 16), await sha256(token), JSON.stringify(scopes)).run();
  return token;
}

export { env, call, seed };
