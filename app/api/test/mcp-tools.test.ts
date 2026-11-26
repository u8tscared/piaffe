import { describe, it, expect, beforeAll } from "vitest";
import { addDays, apiKey, call, connect, env, fillClub, get, mcp, put, seed, today, tool } from "./mcp-kit";

let owner: { token: string; clubId: string; userId: string };
let at: string;

beforeAll(async () => {
  owner = await seed("owner");
  await fillClub(owner.clubId);
  at = (await connect(owner)).access_token;
});

describe("MCP · outils de lecture (gérant)", () => {
  it("liste les outils en lecture seule par défaut", async () => {
    const r = await mcp(at, "tools/list");
    const names = r.body.result.tools.map((t: any) => t.name);
    expect(names).toEqual(["club", "chevaux", "soins_a_venir", "pensions", "adherents", "planning", "reservations", "facturation_impayes", "chiffre_affaires", "presences", "stocks", "equipe", "competitions", "contrats", "taches"]);
    expect(r.body.result.tools.every((t: any) => t.annotations.readOnlyHint === true)).toBe(true);
    expect(r.body.result.tools[0].description).toMatch(/^À appeler en premier/);
  });

  it("club : effectifs, alertes, impayés, donnees_du", async () => {
    const { data, isError } = await tool(at, "club");
    expect(isError).toBe(false);
    expect(data.club).toBe("Écurie Test");
    expect(data.chevaux.total).toBe(2);
    expect(data.chevaux.en_alerte[0].nom).toBe("Ulysse de la Roche");
    expect(data.soins.en_retard).toBe(1);
    expect(data.stocks_sous_le_minimum).toEqual(["Copeaux"]);
    expect(data.impayes).toEqual({ total: 520, nombre: 1 });
    expect(data.contrats_a_signer).toBe(1);
    expect(data.donnees_du).toMatch(/\(en direct\)$/);
    expect(data.derniere_saisie).toBeTruthy();
  });

  it("chevaux : liste, recherche sans accents, fiche complète", async () => {
    const l = (await tool(at, "chevaux", { recherche: "quietude" })).data;
    expect(l.total).toBe(1);
    const f = (await tool(at, "chevaux", { cheval: "Ulysse" })).data;
    expect(f.id).toBe("h01");
    expect(f.proprietaire_nom).toBe("Léa Martin");
    expect(f.costMonth).toBe(400); // le gérant voit le coût
    expect(f.soins_en_retard).toHaveLength(1);
  });

  it("soins_a_venir : planifiés, retards et échéances estimées", async () => {
    const d = (await tool(at, "soins_a_venir", { jours: 14 })).data;
    expect(d.a_venir.map((x: any) => x.cheval)).toContain("Quiétude");
    expect(d.en_retard[0].type).toBe("Maréchal");
    const est = d.echeances_estimees.map((x: any) => x.soin);
    expect(est.some((s: string) => s.startsWith("rappel de vaccin"))).toBe(true);
    expect(est.some((s: string) => s.startsWith("vermifuge"))).toBe(true);
    expect(est.some((s: string) => s.startsWith("maréchal"))).toBe(false); // un maréchal est déjà prévu
  });

  it("facturation_impayes et chiffre_affaires", async () => {
    const i = (await tool(at, "facturation_impayes")).data;
    expect(i.total).toBe(520);
    expect(i.factures[0].client).toBe("Léa Martin");
    expect(i.par_anciennete.de_31_a_60_jours).toBe(520);
    expect((await tool(at, "facturation_impayes", { anciennete_min_jours: 60 })).data.nombre).toBe(0);
    const ca = (await tool(at, "chiffre_affaires", { mois: today().slice(0, 7) })).data;
    expect(ca.douze_mois).toHaveLength(12);
    expect(ca.source).toContain("saisies");
  });

  it("planning, reservations, stocks, pensions, adherents, competitions, contrats, taches, equipe, presences", async () => {
    const t = today();
    const p = (await tool(at, "planning", { du: t, au: t })).data;
    expect(p.jours[0].reprises).toHaveLength(2);
    expect(p.jours[0].reprises[0].piste).toBe("Grand manège");
    expect(p.jours[0].reprises[0].cavaliers[0].nom).toBe("Zoé Laurent");
    const r = (await tool(at, "reservations", { du: t, au: t, niveau: "galop 3" })).data;
    expect(r.avec_places.map((x: any) => x.id)).toEqual(["l01"]);
    expect(r.completes.map((x: any) => x.id)).toEqual(["l02"]);
    const s = (await tool(at, "stocks")).data;
    expect(s.produits[0]).toMatchObject({ produit: "Copeaux", jours_restants: 5, a_commander_pour_30_jours: 70, cout_commande: 805 });
    const pe = (await tool(at, "pensions")).data;
    expect(pe.chevaux_en_pension[0]).toMatchObject({ cheval: "Ulysse de la Roche", formule: "Pension complète", tarif_mensuel: 520 });
    const ad = (await tool(at, "adherents", { filtre: "licence_a_renouveler" })).data;
    expect(ad.adherents.map((x: any) => x.nom)).toEqual(["Zoé Laurent"]);
    expect((await tool(at, "adherents", { filtre: "solde_negatif" })).data.total_du).toBe(410);
    const co = (await tool(at, "competitions")).data;
    expect(co.concours[0].engages[0]).toMatchObject({ cavalier: "Léa Martin", cheval: "Ulysse de la Roche", frais: 26 });
    expect((await tool(at, "contrats")).data.contrats[0].reste_a_signer).toEqual(["Léa Martin"]);
    expect((await tool(at, "taches")).data.a_faire[0].qui).toBe("Antoine Leroy");
    expect((await tool(at, "equipe")).data.salaries[0]).toMatchObject({ nom: "Claire Dumont", contrat: "CDI" });
    expect((await tool(at, "presences")).data.reprises).toHaveLength(2);
  });

  it("répond « vide » quand le club n'a rien", async () => {
    const s = await seed("owner");
    const t = (await connect(s)).access_token;
    const d = (await tool(t, "chevaux")).data;
    expect(d.vide).toBe(true);
    expect(d.conseil).toContain("Aucun cheval");
    expect(d.donnees_du).toBeTruthy();
  });

  it("journalise les appels pour l'écran Connecteurs", async () => {
    const r = (await (await call("/api/mcp/calls", { token: owner.token })).json()) as any;
    expect(r.calls.length).toBeGreaterThan(5);
    expect(r.calls.some((c: any) => c.tool === "club" && c.ok)).toBe(true);
    const tl = (await (await call("/api/mcp/tools", { token: owner.token })).json()) as any;
    expect(tl.server_url).toBe("http://piaffe.test/mcp");
    expect(tl.all_tools).toHaveLength(18);
  });
});

describe("MCP · isolation et rôles", () => {
  it("un jeton ne voit que son club", async () => {
    const other = await seed("owner");
    await put(other.clubId, "horses", "hX", { name: "Cheval Secret", box: "Z9" });
    const d = (await tool(at, "chevaux", { recherche: "secret" })).data;
    expect(d.total).toBe(0);
    const t2 = (await connect(other)).access_token;
    expect((await tool(t2, "chevaux")).data.chevaux.map((h: any) => h.nom)).toEqual(["Cheval Secret"]);
  });

  it("un employé n'a ni les finances ni les coordonnées complètes", async () => {
    const staff = await seed("staff", { clubId: owner.clubId, personRef: "s05" });
    const t = (await connect(staff)).access_token;
    const names = (await mcp(t, "tools/list")).body.result.tools.map((x: any) => x.name);
    expect(names).not.toContain("facturation_impayes");
    expect(names).not.toContain("chiffre_affaires");
    expect(names).not.toContain("pensions");
    expect(names).toContain("soins_a_venir");
    const forbidden = await tool(t, "facturation_impayes");
    expect(forbidden.isError).toBe(true);
    const ad = (await tool(t, "adherents", { recherche: "Léa" })).data;
    expect(ad.adherents[0].email).toBeUndefined();
    expect(ad.adherents[0].solde).toBeUndefined();
    const h = (await tool(t, "chevaux", { cheval: "h01" })).data;
    expect(h.costMonth).toBeUndefined();
    expect((await tool(t, "club")).data.impayes).toBeUndefined();
  });

  it("clé d'API du club : droit read obligatoire", async () => {
    const k = await apiKey(owner.clubId, ["read"]);
    const list = (await mcp(k, "tools/list")).body.result.tools.map((x: any) => x.name);
    expect(list).toContain("facturation_impayes");
    expect(list).not.toContain("ajouter_soin");
    expect((await tool(k, "club")).data.club).toBe("Écurie Test");
    const imp = await apiKey(owner.clubId, ["import"]);
    expect((await mcp(imp, "tools/list")).status).toBe(401);
  });
});

describe("MCP · écriture sûre", () => {
  it("les outils d'écriture n'existent qu'avec l'accord « ajouts »", async () => {
    const t = (await connect(owner, { write: true })).access_token;
    const tools = (await mcp(t, "tools/list")).body.result.tools;
    const w = tools.filter((x: any) => !x.annotations.readOnlyHint).map((x: any) => x.name);
    expect(w).toEqual(["ajouter_soin", "reserver_place", "cocher_tache"]);
    expect(tools.find((x: any) => x.name === "ajouter_soin").description).toContain("confirme: true");
    expect((await tool(at, "ajouter_soin", { cheval: "h01", type: "Vaccin", confirme: true })).isError).toBe(true);
  });

  it("ajouter_soin exige confirme: true puis enregistre", async () => {
    const t = (await connect(owner, { write: true })).access_token;
    const no = await tool(t, "ajouter_soin", { cheval: "Quiétude", type: "Vermifuge" });
    expect(no.isError).toBe(true);
    expect(no.data.erreur).toContain("Rien n'a été enregistré");
    const ok = await tool(t, "ajouter_soin", { cheval: "Quiétude", type: "Vermifuge", date: addDays(today(), 3), intervenant: "Équipe", note: "Ivermectine", confirme: true });
    expect(ok.isError).toBe(false);
    expect(ok.data.soin).toMatchObject({ cheval: "Quiétude", type: "Vermifuge", statut: "planifié" });
    const rec = await get(owner.clubId, "care", ok.data.soin.id);
    expect(rec).toMatchObject({ horse: "h02", kind: "Vermifuge", note: "Ivermectine", source: "assistant" });
    const audit = await env.DB.prepare("SELECT data FROM audit_log WHERE club_id = ? AND action = 'records.batch' ORDER BY at DESC LIMIT 1").bind(owner.clubId).first<{ data: string }>();
    expect(audit!.data).toContain("mcp:Claude");
  });

  it("reserver_place : place libre, complet avec alternative, liste d'attente", async () => {
    const t = (await connect(owner, { write: true })).access_token;
    const ok = await tool(t, "reserver_place", { reprise: "l01", adherent: "Tom Petit", confirme: true });
    expect(ok.data).toMatchObject({ enregistre: true, inscrit_sur: "reprise", places_restantes: 0 });
    expect((await get(owner.clubId, "lessons", "l01")).riders).toEqual(["m002", "m003"]);
    const again = await tool(t, "reserver_place", { reprise: "l01", adherent: "m003", confirme: true });
    expect(again.data.deja_inscrit).toBe(true);
    const full = await tool(t, "reserver_place", { reprise: "l02", adherent: "Léa Martin", confirme: true });
    expect(full.isError).toBe(true);
    expect(full.data.erreur).toContain("complète");
    const wl = await tool(t, "reserver_place", { reprise: "l02", adherent: "Léa Martin", liste_attente: true, confirme: true });
    expect(wl.data).toMatchObject({ inscrit_sur: "liste_attente", rang_liste_attente: 1 });
  });

  it("cocher_tache", async () => {
    const t = (await connect(owner, { write: true })).access_token;
    const r = await tool(t, "cocher_tache", { tache: "Curer", confirme: true });
    expect(r.data).toMatchObject({ enregistre: true, faite: true });
    expect((await get(owner.clubId, "tasks", "t1")).done).toBe(true);
  });

  it("écriture bloquée quand l'abonnement ne le permet plus", async () => {
    const s = await seed("owner");
    await fillClub(s.clubId);
    await env.DB.prepare("UPDATE clubs SET plan_status = 'canceled' WHERE id = ?").bind(s.clubId).run();
    const t = (await connect(s, { write: true })).access_token;
    const r = await tool(t, "ajouter_soin", { cheval: "h01", type: "Vaccin", confirme: true });
    expect(r.isError).toBe(true);
    expect(r.data.erreur).toContain("abonnement");
    expect((await tool(t, "club")).isError).toBe(false); // la lecture reste permise
  });
});

describe("MCP · protocole", () => {
  it("notifications 202, lot JSON-RPC, méthode inconnue, GET 405", async () => {
    const n = await call("/mcp", { method: "POST", token: at, json: { jsonrpc: "2.0", method: "notifications/initialized" } });
    expect(n.status).toBe(202);
    const b = await call("/mcp", { method: "POST", token: at, json: [{ jsonrpc: "2.0", id: 1, method: "ping" }, { jsonrpc: "2.0", id: 2, method: "nope" }] });
    const j = (await b.json()) as any[];
    expect(j[0].result).toEqual({});
    expect(j[1].error.code).toBe(-32601);
    expect((await call("/mcp", { token: at })).status).toBe(405);
    const bad = await call("/mcp", { method: "POST", token: at, body: "{", headers: { "content-type": "application/json" } });
    expect(bad.status).toBe(400);
  });
});
