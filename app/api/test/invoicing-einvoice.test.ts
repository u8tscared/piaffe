import { describe, it, expect, afterEach } from "vitest";
import { env, call, setupClub, issued, lessonLines, SIREN_PRO, SIREN_CLUB } from "./invoicing.helpers";
import { connectClub, submitPending, pullStatuses, pullIncoming, runEreporting, periodOf, pushPaymentStatuses, splitByRate, seal, unseal } from "../src/invoicing/einvoice";
import { sandbox, superpdp, setProvider } from "../src/invoicing/pa";
import { setFetch } from "../src/invoicing/pa/types";
import { addDays, parisToday } from "../src/invoicing/invoices";

const pro = (extra: Record<string, unknown> = {}) => ({
  customer_type: "business", customer_name: "SARL Haras du Bocage", customer_siren: SIREN_PRO,
  customer_address: { line1: "1 route du Haras", zip: "61000", city: "Alençon" }, price_mode: "ht", lines: [lessonLines[0]], ...extra,
});

afterEach(() => { setProvider(null); setFetch(); });

describe("facture électronique (plateforme sandbox)", () => {
  it("raccorde le club, transmet la facture B2B et suit son cycle de vie jusqu'à « Approuvée »", async () => {
    const o = await setupClub();
    const inv = await issued(o.token, pro());
    expect(inv.einvoice.status).toBe("pending");
    await submitPending(env);
    expect((await env.DB.prepare("SELECT einvoice_status FROM invoices WHERE id = ?").bind(inv.id).first<any>()).einvoice_status).toBe("pending"); // pas encore raccordé
    const c = await call("/api/einvoicing/connect", { method: "POST", token: o.token });
    expect(c.status).toBe(200);
    expect(((await c.json()) as any).status).toBe("connected");
    await submitPending(env);
    let row = await env.DB.prepare("SELECT einvoice_status, einvoice_ref FROM invoices WHERE id = ?").bind(inv.id).first<any>();
    expect(row.einvoice_status).toBe("submitted");
    expect(row.einvoice_ref).toBe("sbx_inv_" + inv.id);
    await pullStatuses(env);
    row = await env.DB.prepare("SELECT einvoice_status FROM invoices WHERE id = ?").bind(inv.id).first<any>();
    expect(row.einvoice_status).toBe("205");
    const d = await (await call(`/api/invoices/${inv.id}`, { token: o.token })).json() as any;
    expect(d.invoice.einvoice_events.map((e: any) => e.code)).toEqual(["200", "202", "203", "205"]);
    await pullStatuses(env); // idempotent : pas de doublon
    const n = await env.DB.prepare("SELECT COUNT(*) AS n FROM einvoice_events WHERE invoice_id = ?").bind(inv.id).first<any>();
    expect(n.n).toBe(4);
  });

  it("une facture refusée par le client passe en « rejected » avec le motif", async () => {
    const o = await setupClub();
    await connectClub(env, o.clubId, "http://x");
    const inv = await issued(o.token, pro({ customer_siren: "000000000" }));
    await submitPending(env); await pullStatuses(env);
    const row = await env.DB.prepare("SELECT einvoice_status, einvoice_error FROM invoices WHERE id = ?").bind(inv.id).first<any>();
    expect(row.einvoice_status).toBe("rejected");
    expect(row.einvoice_error).toContain("Client inconnu");
  });

  it("encaissement B2B de services : statut 212 transmis une seule fois", async () => {
    const o = await setupClub();
    await connectClub(env, o.clubId, "http://x");
    const inv = await issued(o.token, pro());
    await submitPending(env);
    await call(`/api/invoices/${inv.id}/payments`, { method: "POST", token: o.token, json: { amount: inv.total_ttc, method: "transfer" } });
    expect(await pushPaymentStatuses(env)).toBeGreaterThanOrEqual(1);
    await pushPaymentStatuses(env);
    const ev = await env.DB.prepare("SELECT COUNT(*) AS n FROM einvoice_events WHERE invoice_id = ? AND code = '212'").bind(inv.id).first<any>();
    expect(ev.n).toBe(1);
  });

  it("e-reporting : ventes aux particuliers et encaissements agrégés par jour et par taux, sans doublon", async () => {
    const o = await setupClub();
    await connectClub(env, o.clubId, "http://x");
    await env.DB.prepare("UPDATE einvoice_accounts SET connected_at = '2020-01-01T00:00:00Z' WHERE club_id = ?").bind(o.clubId).run();
    const a = await issued(o.token, { customer_ref: "m001", lines: lessonLines });
    const b = await issued(o.token, { customer_ref: "m003", lines: [lessonLines[0]] });
    await issued(o.token, pro()); // B2B : pas dans l'e-reporting
    await call(`/api/invoices/${a.id}/payments`, { method: "POST", token: o.token, json: { amount: 14500, method: "card" } });
    await call(`/api/invoices/${b.id}/payments`, { method: "POST", token: o.token, json: { amount: 14500, method: "cash" } });
    const nextMonth = addDays(periodOf(parisToday(), "monthly").end, 1);
    expect(await runEreporting(env, nextMonth)).toBe(2);
    const reps = await sandbox.reports(env, o.clubId);
    const tr = reps.find((r) => r.kind === "transactions")!;
    expect(tr.seller_siren).toBe(SIREN_CLUB);
    const tps = tr.transactions!.find((t) => t.category === "TPS1" && t.rate_bp === 550)!;
    expect(tps.count).toBe(2);
    expect(tps.base + tps.vat).toBe(29000);
    expect(tr.transactions!.some((t) => t.category === "TLB1" && t.rate_bp === 2000)).toBe(true);
    expect(tr.transactions!.some((t) => t.category === "TNT1")).toBe(true);
    const pay = reps.find((r) => r.kind === "payments")!;
    expect(pay.payments!.reduce((x, p) => x + p.amount, 0)).toBeGreaterThan(0);
    expect(await runEreporting(env, nextMonth)).toBe(0);
    const st = await (await call("/api/einvoicing", { token: o.token })).json() as any;
    expect(st.reports.filter((r: any) => r.status === "submitted").length).toBe(2);
  });

  it("récupère les factures fournisseurs reçues et les montre au comptable", async () => {
    const o = await setupClub();
    await connectClub(env, o.clubId, "http://x");
    const r = await call("/api/einvoicing/sandbox/incoming", { method: "POST", token: o.token, json: {} });
    expect(r.status).toBe(201);
    expect(await pullIncoming(env)).toBeGreaterThanOrEqual(1);
    await pullIncoming(env);
    const acc = await (await import("./invoicing.helpers")).addUser(o.clubId, "accountant");
    const list = await (await call(`/api/accounting/purchases?year=${parisToday().slice(0, 4)}`, { token: acc.token })).json() as any;
    expect(list.purchases.length).toBe(1);
    expect(list.purchases[0]).toMatchObject({ supplier_siren: "552100554", total_ttc: 38400, total_vat: 6400, source: "pa" });
    expect((await call(`/api/accounting/purchases/${list.purchases[0].id}/xml`, { token: acc.token })).status).toBe(200);
    expect((await call(`/api/accounting/purchases/${list.purchases[0].id}`, { method: "PATCH", token: acc.token, json: { status: "approved" } })).status).toBe(403);
    expect((await call(`/api/accounting/purchases/${list.purchases[0].id}`, { method: "PATCH", token: o.token, json: { status: "approved", account: "604000" } })).status).toBe(200);
    const fec = await (await call(`/api/accounting/exports/fec?year=${parisToday().slice(0, 4)}&encoding=utf8`, { token: o.token })).text();
    expect(fec).toMatch(/(^|\n)AC\tAchats\t/);
    expect(fec).toContain("\t604000\t");
  });

  it("périodes d'e-reporting : décade, mois, bimestre ; ventilation d'un encaissement par taux", () => {
    expect(periodOf("2026-02-25", "decade")).toEqual({ start: "2026-02-21", end: "2026-02-28" });
    expect(periodOf("2026-11-11", "decade")).toEqual({ start: "2026-11-11", end: "2026-11-20" });
    expect(periodOf("2026-11-24", "monthly")).toEqual({ start: "2026-11-01", end: "2026-11-30" });
    expect(periodOf("2026-12-03", "bimonthly")).toEqual({ start: "2026-11-01", end: "2026-12-31" });
    const parts = splitByRate(10000, [{ rate_bp: 550, base: 4740, vat: 260, category: "S" }, { rate_bp: 2000, base: 4167, vat: 833, category: "S" }], 10000);
    expect(parts).toEqual([{ rate_bp: 550, amount: 4739 }, { rate_bp: 2000, amount: 4167 }]);
  });

  it("chiffre les jetons de la plateforme", async () => {
    const s = await seal(env, { access_token: "secret" });
    expect(s).not.toContain("secret");
    expect(await unseal(env, s)).toEqual({ access_token: "secret" });
  });
});

describe("adaptateur SUPER PDP (appels simulés)", () => {
  it("dépose le PDF Factur-X avec le jeton, renouvelle le jeton expiré et lit les statuts", async () => {
    const o = await setupClub();
    const calls: { url: string; init?: RequestInit }[] = [];
    setFetch((async (url: any, init?: RequestInit) => {
      const u = String(url); calls.push({ url: u, init });
      if (u.endsWith("/oauth2/token")) return Response.json({ access_token: "at_new", refresh_token: "rt_new", expires_in: 3600 });
      if (u.includes("/v1.beta/invoices?external_id=")) return Response.json({ id: 4242, events: [{ status_code: "fr:200" }] }, { status: 201 });
      if (u.includes("/v1.beta/invoice_events")) return Response.json({ data: [{ id: 9, invoice_id: 4242, status_code: "fr:205", created_at: "2026-11-24T10:00:00Z" }], has_after: false });
      return new Response("not found", { status: 404 });
    }) as any);
    setProvider(superpdp);
    const e2 = { ...env, EINVOICE_PROVIDER: "superpdp", EINVOICE_API_KEY: "cid:csecret" } as any;
    await env.DB.prepare("INSERT INTO einvoice_accounts (club_id, provider, status, credentials, connected_at) VALUES (?, 'superpdp', 'connected', ?, ?)")
      .bind(o.clubId, await seal(env, { access_token: "old", refresh_token: "rt_old", expires_at: 0 }), new Date().toISOString()).run();
    const inv = await issued(o.token, pro());
    await submitPending(e2);
    const dep = calls.find((c) => c.url.includes("/v1.beta/invoices?external_id="))!;
    expect(new Headers(dep.init!.headers).get("authorization")).toBe("Bearer at_new");
    expect(new Headers(dep.init!.headers).get("content-type")).toBe("application/pdf");
    const tok = calls.find((c) => c.url.endsWith("/oauth2/token"))!;
    expect(String(tok.init!.body)).toContain("grant_type=refresh_token");
    expect(String(tok.init!.body)).toContain("refresh_token=rt_old");
    const row = await env.DB.prepare("SELECT einvoice_status, einvoice_ref FROM invoices WHERE id = ?").bind(inv.id).first<any>();
    expect(row).toEqual({ einvoice_status: "submitted", einvoice_ref: "4242" });
    const acc = await env.DB.prepare("SELECT credentials FROM einvoice_accounts WHERE club_id = ?").bind(o.clubId).first<any>();
    expect((await unseal(env, acc.credentials)).refresh_token).toBe("rt_new"); // rotation enregistrée
    await pullStatuses(e2);
    expect((await env.DB.prepare("SELECT einvoice_status FROM invoices WHERE id = ?").bind(inv.id).first<any>()).einvoice_status).toBe("205");
  });

  it("une erreur d'authentification met le raccordement en erreur sans perdre la facture", async () => {
    const o = await setupClub();
    setFetch((async () => new Response("{}", { status: 401 })) as any);
    setProvider(superpdp);
    const e2 = { ...env, EINVOICE_API_KEY: "cid:csecret" } as any;
    await env.DB.prepare("INSERT INTO einvoice_accounts (club_id, provider, status, credentials, connected_at) VALUES (?, 'superpdp', 'connected', ?, ?)")
      .bind(o.clubId, await seal(env, { access_token: "x", refresh_token: "y", expires_at: Date.now() + 1e6 }), new Date().toISOString()).run();
    const inv = await issued(o.token, pro());
    await submitPending(e2);
    expect((await env.DB.prepare("SELECT einvoice_status FROM invoices WHERE id = ?").bind(inv.id).first<any>()).einvoice_status).toBe("error");
    expect((await env.DB.prepare("SELECT status FROM einvoice_accounts WHERE club_id = ?").bind(o.clubId).first<any>()).status).toBe("error");
  });
});

describe("tâches planifiées", () => {
  it("les deux crons du lot tournent sans erreur", async () => {
    const { cron } = await import("../src/invoicing/routes");
    await setupClub();
    await expect(cron(env, "*/10 * * * *")).resolves.toBeUndefined();
    await expect(cron(env, "0 6 * * *")).resolves.toBeUndefined();
  });
});
