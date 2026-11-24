/* Outils de test du lot A (comptes et données). */
import { call, env } from "./helpers";
import { setMailer } from "../src/auth/mailer";
import type { MailInput } from "../src/mail/send";

export const mails: MailInput[] = [];
setMailer(async (_e, m) => { mails.push(m); return "test"; });
export function lastMail(template?: string, to?: string): MailInput | undefined {
  return [...mails].reverse().find((m) => (!template || m.template === template) && (!to || m.to === to));
}
export function tokenFrom(m: MailInput | undefined): string {
  const url = String(m?.data?.action_url || "");
  const q = /[?&]token=([^&]+)/.exec(url);
  if (q) return decodeURIComponent(q[1]);
  return url.split("/").pop() || "";
}

let n = 0;
export const uniq = (p = "u") => `${p}${Date.now().toString(36)}${(n++).toString(36)}@exemple.fr`;
/** Adresse IP différente par appel : les limites de débit ne se mélangent pas entre tests. */
export const ip = () => `10.0.${Math.floor(Math.random() * 250)}.${Math.floor(Math.random() * 250)}`;

type Init = RequestInit & { json?: unknown; token?: string; club?: string; cookie?: string; ip?: string; noCsrf?: boolean };
/** Appel « navigateur » : en-tête X-Requested-With: piaffe (sauf noCsrf), cookie éventuel. */
export function api(path: string, init: Init = {}) {
  const h = new Headers(init.headers);
  if (!init.noCsrf) h.set("x-requested-with", "piaffe");
  if (init.cookie) h.set("cookie", init.cookie);
  h.set("cf-connecting-ip", init.ip || ip());
  return call(path, { ...init, headers: h });
}
export const post = (path: string, json: unknown, o: Init = {}) => api(path, { method: "POST", json, ...o });

export function sessionCookie(r: Response): string {
  const all = r.headers.getSetCookie ? r.headers.getSetCookie() : [r.headers.get("set-cookie") || ""];
  const c = all.find((x) => x.startsWith("piaffe_s="));
  return c ? c.split(";")[0] : "";
}
export const PW = "Selle-francais-bai-2026";

export async function signup(email = uniq(), password = PW, first = "Léa", last = "Martin") {
  const r = await post("/auth/signup", { email, password, first, last });
  const cookie = sessionCookie(r);
  return { r, email, cookie, body: (await r.json()) as any };
}

/** Insère directement des objets dans records (préparation des tests). */
export async function putRecords(clubId: string, coll: string, rows: Record<string, unknown>[]) {
  for (const d of rows) {
    await env.DB.prepare("INSERT OR REPLACE INTO records (club_id, coll, id, data, version) VALUES (?,?,?,?,1)").bind(clubId, coll, d.id ?? "_", JSON.stringify(d)).run();
  }
}
export async function waitFor<T>(f: () => T | undefined | null | false, ms = 1500): Promise<T> {
  const t = Date.now();
  for (;;) {
    const v = f();
    if (v) return v;
    if (Date.now() - t > ms) throw new Error("waitFor: délai dépassé");
    await new Promise((r) => setTimeout(r, 20));
  }
}
export { call, env };
