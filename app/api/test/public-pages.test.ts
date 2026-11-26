import { afterEach, describe, expect, it } from "vitest";
import { call, env, seed } from "./helpers";
import { fakeStripe, sendEvent, seedConnectedClub, mails } from "./billing-helpers";

/* Pages publiques du club (src/public) : carte cadeau, avis, sondage par lien, annonce ; liens du gérant. */
const batch = (token: string, ops: unknown[]) => call("/api/records/batch", { method: "POST", token, json: { ops } }).then(async (r: Response) => (await r.json()) as any);
const up = (coll: string, id: string, data: unknown) => ({ op: "upsert", coll, id, data });
const rows = async (club: string, coll: string) =>
  ((await env.DB.prepare("SELECT data FROM records WHERE club_id = ? AND coll = ? AND deleted = 0").bind(club, coll).all<any>()).results || []).map((r: any) => JSON.parse(r.data));
const rec = async (club: string, coll: string, id: string) => (await rows(club, coll)).find((x: any) => x.id === id);
let ipN = 0;
const post = (path: string, json: unknown, ip?: string) => call(path, { method: "POST", headers: { "x-requested-with": "piaffe", "cf-connecting-ip": ip || "198.51.100." + (++ipN % 250) }, json });
const slugOf = async (club: string) => (await env.DB.prepare("SELECT slug FROM clubs WHERE id = ?").bind(club).first<any>()).slug as string;
const t = () => Date.now() - 10_000;
let stripeMock: ReturnType<typeof fakeStripe> | null = null;
afterEach(() => { stripeMock?.restore(); stripeMock = null; });

describe("carte cadeau publique", () => {
  it("sans paiement en ligne : page lisible, demande enregistrée, gérant prévenu, puis carte envoyée par le gérant", async () => {
    const o = await seed("owner");
    await batch(o.token, [up("growthCfg", "cadeaux", { products: [["Balade d’une heure", 35]], validity: 6 }), up("members", "m1", { first: "Léa", last: "Martin" })]);
    const slug = await slugOf(o.clubId);
    const page = await call(`/c/${slug}/offrir`);
    expect(page.status).toBe(200);
    expect(page.headers.get("content-security-policy")).toContain("script-src 'nonce-");
    const h = await page.text();
    expect(h).toContain("Écurie Test"); expect(h).toContain("Balade d’une heure"); expect(h).toContain("Envoyer ma demande");
    expect(h).toContain("paiement en ligne n’est pas encore ouvert");
    expect((await call("/c/club-inconnu/offrir")).status).toBe(404);

    // robot (champ piège) : réponse normale, rien d'enregistré
    expect((await post(`/api/public/gifts/${slug}`, { product: 0, buyer: "Bot", email: "b@exemple.fr", site: "x", t: t() })).status).toBe(200);
    expect(await rows(o.clubId, "giftRequests")).toHaveLength(0);
    // validations
    expect((await post(`/api/public/gifts/${slug}`, { product: -1, amount: 5, buyer: "Sophie", email: "s@exemple.fr", t: t() })).status).toBe(400);
    expect((await post(`/api/public/gifts/${slug}`, { product: 0, buyer: "Sophie", email: "pas-un-email", t: t() })).status).toBe(400);
    // le prix vient du club, jamais du navigateur
    const r = await post(`/api/public/gifts/${slug}`, { product: 0, amount: 1, buyer: "Sophie Marchand", email: "sophie@exemple.fr", to: "Jules", msg: "Joyeux Noël", t: t() });
    expect(r.status).toBe(200);
    expect(((await r.json()) as any).mode).toBe("request");
    const [req] = await rows(o.clubId, "giftRequests");
    expect(req).toMatchObject({ amount: 35, label: "Balade d’une heure", buyer: "Sophie Marchand", email: "sophie@exemple.fr", to: "Jules", status: "demande", online: false });
    expect(await mails(o.email, "club_notice")).toHaveLength(1);

    // un adhérent ne voit pas les demandes ; le gérant, oui (synchro)
    const m = await seed("member", { clubId: o.clubId, personRef: "m1" });
    const bm = (await (await call("/api/club/bootstrap", { token: m.token })).json()) as any;
    expect(bm.data.giftRequests || []).toHaveLength(0);
    const bo = (await (await call("/api/club/bootstrap", { token: o.token })).json()) as any;
    expect(bo.data.giftRequests).toHaveLength(1);

    // le gérant a encaissé : la carte est créée et le code part à l'acheteuse (une seule fois)
    expect((await call(`/api/growth/gift-requests/${req.id}/issue`, { method: "POST", token: m.token, json: {} })).status).toBe(403);
    const is = await call(`/api/growth/gift-requests/${req.id}/issue`, { method: "POST", token: o.token, json: {} });
    expect(is.status).toBe(200);
    const ij = (await is.json()) as any;
    expect(ij.code).toMatch(/^[A-Z]{3}-[A-Z2-9]{4}-\d{2}$/);
    const cards = await rows(o.clubId, "giftcards");
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ code: ij.code, amount: 35, rest: 35, buyer: "Sophie Marchand", to: "Jules", online: false });
    expect((await rec(o.clubId, "giftRequests", req.id)).status).toBe("payée");
    expect(await mails("sophie@exemple.fr", "gift_card")).toHaveLength(1);
    const again = (await (await call(`/api/growth/gift-requests/${req.id}/issue`, { method: "POST", token: o.token, json: {} })).json()) as any;
    expect(again.already).toBe(true);
    expect(await rows(o.clubId, "giftcards")).toHaveLength(1);
    expect(await mails("sophie@exemple.fr", "gift_card")).toHaveLength(1);
  });

  it("avec Stripe Connect : paiement sur le compte du club, carte créée par le webhook, rejouable sans doublon", async () => {
    const o = await seedConnectedClub("owner");
    stripeMock = fakeStripe({ "POST /v1/checkout/sessions": () => ({ id: "cs_gift_1", url: "https://checkout.stripe.com/c/pay/cs_gift_1" }) });
    const slug = await slugOf(o.clubId);
    expect(await (await call(`/c/${slug}/offrir`)).text()).toContain(">Payer<");
    const r = await post(`/api/public/gifts/${slug}`, { product: -1, amount: 50, buyer: "Paul Leroy", email: "paul@exemple.fr", t: t() });
    const j = (await r.json()) as any;
    expect(j.url).toBe("https://checkout.stripe.com/c/pay/cs_gift_1");
    const c = stripeMock.find("POST", "/v1/checkout/sessions")[0];
    expect(c.headers["stripe-account"]).toBe(o.acct);
    expect(c.params["line_items[0][price_data][unit_amount]"]).toBe("5000");
    const [req] = await rows(o.clubId, "giftRequests");
    expect(req.status).toBe("paiement");
    expect(c.params["metadata[piaffe_gift_id]"]).toBe(req.id);
    const evt = (id: string) => ({ id, type: "checkout.session.completed", account: o.acct, data: { object: { id: "cs_gift_1", object: "checkout.session", mode: "payment", payment_status: "paid", metadata: { piaffe_club_id: o.clubId, piaffe_gift_id: req.id } } } });
    expect((await sendEvent(evt("evt_gift_1"), { connect: true })).status).toBe(200);
    expect((await sendEvent(evt("evt_gift_2"), { connect: true })).status).toBe(200);
    const cards = await rows(o.clubId, "giftcards");
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ amount: 50, online: true });
    expect((await rec(o.clubId, "giftRequests", req.id)).status).toBe("payée");
    expect(await mails("paul@exemple.fr", "gift_card")).toHaveLength(1);
  });
});

describe("avis par lien", () => {
  it("4–5 étoiles : lien Google du club ; 1–3 : message privé au club ; lien personnel reconnu", async () => {
    const o = await seed("owner");
    await batch(o.token, [up("growthCfg", "avis", { url: "https://g.page/r/exemple/review" }), up("members", "m1", { first: "Léa", last: "Martin" })]);
    const slug = await slugOf(o.clubId);
    const links = (await (await call("/api/growth/links?member=m1", { token: o.token })).json()) as any;
    expect(links.avis).toBe(`http://piaffe.test/c/${slug}/avis`);
    expect(links.offrir).toBe(`http://piaffe.test/c/${slug}/offrir`);
    const tok = new URL(links.avis_member).searchParams.get("t")!;
    const pg = await (await call(`/c/${slug}/avis?t=${encodeURIComponent(tok)}`)).text();
    expect(pg).toContain("Léa, comment");

    const good = (await (await post(`/api/public/reviews/${slug}`, { rating: 5, text: "Super accueil", t: tok, shown: t() })).json()) as any;
    expect(good.google_url).toBe("https://g.page/r/exemple/review");
    const bad = await post(`/api/public/reviews/${slug}`, { rating: 2, text: "Cours commencé en retard", shown: t() });
    expect(bad.status).toBe(200);
    expect(((await bad.json()) as any).google_url).toBeUndefined();
    const rv = await rows(o.clubId, "gReviews");
    expect(rv).toHaveLength(2);
    expect(rv.find((r: any) => r.rating === 5)).toMatchObject({ member: "m1", status: "ok", google: false });
    expect(rv.find((r: any) => r.rating === 2)).toMatchObject({ member: null, status: "a_traiter", text: "Cours commencé en retard" });
    expect(await mails(o.email, "club_notice")).toHaveLength(1);
    // l'avis passe « publié sur Google » quand la famille clique ; un accusé falsifié est refusé
    expect((await post(`/api/public/reviews/${slug}/google`, { ack: good.ack })).status).toBe(200);
    expect(rv.find((r: any) => r.rating === 5) && (await rows(o.clubId, "gReviews")).find((r: any) => r.rating === 5).google).toBe(true);
    expect((await post(`/api/public/reviews/${slug}/google`, { ack: good.ack.slice(0, -2) + "xx" })).status).toBe(400);
    // note invalide, robot, et protection CSRF
    expect((await post(`/api/public/reviews/${slug}`, { rating: 9, shown: t() })).status).toBe(400);
    await post(`/api/public/reviews/${slug}`, { rating: 1, shown: Date.now() });
    expect(await rows(o.clubId, "gReviews")).toHaveLength(2);
    expect((await call(`/api/public/reviews/${slug}`, { method: "POST", headers: { origin: "https://pirate.example" }, json: { rating: 5, shown: t() } })).status).toBe(403);
  });
});

describe("sondage par lien à jeton", () => {
  it("lien commun et lien par famille : réponse enregistrée une fois, jeton falsifié refusé", async () => {
    const o = await seed("owner");
    await batch(o.token, [up("members", "m1", { first: "Léa", last: "Martin" }),
      up("surveys", "sv1", { title: "Stage de la Toussaint", coach: "c1", answers: [{ member: "m1", pending: true }] })]);
    const L = (await (await call("/api/growth/links?member=m1&survey=sv1", { token: o.token })).json()) as any;
    const common = L.surveys.find((s: any) => s.id === "sv1").url as string;
    const mine = L.survey_member as string;
    const pg = await call(new URL(mine).pathname);
    expect(pg.status).toBe(200);
    const h = await pg.text();
    expect(h).toContain("Stage de la Toussaint"); expect(h).toContain("Léa, trois"); expect(h).toContain("Et de l’encadrement");
    const ptok = new URL(mine).pathname.slice(3);
    expect((await post(`/api/public/surveys/${ptok}`, { global: 0, shown: t() })).status).toBe(400);
    expect((await post(`/api/public/surveys/${ptok}`, { global: 5, coach: 4, again: true, text: "Super", shown: t() })).status).toBe(200);
    expect((await post(`/api/public/surveys/${ptok}`, { global: 3, shown: t() })).status).toBe(409);
    expect(await (await call(new URL(mine).pathname)).text()).toContain("Déjà répondu");
    const ctok = new URL(common).pathname.slice(3);
    expect((await post(`/api/public/surveys/${ctok}`, { global: 2, again: false, text: "Trop de pluie", shown: t() })).status).toBe(200);
    const sv = await rec(o.clubId, "surveys", "sv1");
    expect(sv.answers).toHaveLength(2);
    expect(sv.answers[0]).toMatchObject({ member: "m1", global: 5, coach: 4, again: true, text: "Super" });
    expect(sv.answers[0].pending).toBeUndefined();
    expect(sv.answers[1]).toMatchObject({ member: null, global: 2, again: false });
    expect(await mails(o.email, "club_notice")).toHaveLength(1);
    // jeton falsifié ou d'un autre type
    expect((await call("/s/" + ctok.slice(0, -3) + "abc")).status).toBe(404);
    expect((await post(`/api/public/surveys/${ctok.slice(0, -3)}abc`, { global: 4, shown: t() })).status).toBe(404);
    const avTok = new URL(L.avis_member).searchParams.get("t")!;
    expect((await call("/s/" + avTok)).status).toBe(404);
  });
});

describe("annonce publique et liens", () => {
  it("page de l'annonce servie par le Worker, photo seulement pour une annonce en ligne, liens réservés au gérant", async () => {
    const o = await seed("owner");
    await batch(o.token, [up("horses", "h1", { name: "Quartz", photo: "med_inexistante" }), up("horseAds", "ad1", { horse: "h1", price: 6500, status: "en ligne" }), up("horseAds", "ad2", { horse: "h1", status: "brouillon" })]);
    const slug = await slugOf(o.clubId);
    const pg = await call(`/c/${slug}/cheval/ad1`);
    expect(pg.status).toBe(200);
    expect(await pg.text()).toContain(`/api/public/horse-ads/'+encodeURIComponent("${o.clubId}")`);
    expect((await call(`/api/public/horse-ads/${slug}/ad1/photo`)).status).toBe(404);
    expect((await call(`/api/public/horse-ads/${slug}/ad2/photo`)).status).toBe(404);
    const L = (await (await call("/api/growth/links", { token: o.token })).json()) as any;
    expect(L.ads.find((a: any) => a.id === "ad1").url).toBe(`http://piaffe.test/c/${slug}/cheval/ad1`);
    const st = await seed("staff", { clubId: o.clubId });
    expect((await call("/api/growth/links", { token: st.token })).status).toBe(403);
    expect((await call("/api/growth/links")).status).toBe(401);
  });

  it("le nom du club ne peut pas injecter de script dans la page", async () => {
    const o = await seed("owner");
    await env.DB.prepare("UPDATE clubs SET name = ? WHERE id = ?").bind('Écurie </script><script>alert(1)</script>', o.clubId).run();
    await batch(o.token, [up("horses", "h1", { name: "Quartz" }), up("horseAds", "ad1", { horse: "h1", status: "en ligne" })]);
    const h = await (await call(`/c/${await slugOf(o.clubId)}/cheval/ad1`)).text();
    expect(h).not.toContain("<script>alert(1)");
    expect(h).toContain("\\u003c/script>");
  });
});

describe("onboarding : l'écran Connecteurs n'est plus masqué d'office", () => {
  it("le plan du club ne cache pas « connecteurs »", async () => {
    const { buildPlan } = await import("../src/onboarding/plan") as any;
    if (typeof buildPlan !== "function") return;
    const p = buildPlan({ kind: "centre" });
    expect(JSON.stringify(p.modulesOff || {})).not.toContain("connecteurs");
  });
});
