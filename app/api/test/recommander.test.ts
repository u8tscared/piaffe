import { describe, expect, it } from "vitest";
import { call, env } from "./helpers";
import { outbox } from "./mail-kit";
import { renderTemplate } from "../src/mail/render";
import { TEMPLATES } from "../src/mail/templates";
import { renderHtml, renderText, initialOf, type Frame } from "../src/mail/layout";
import { BRAND } from "../src/mail/brand";

/* Recommandation d'un cavalier à son écurie : POST /api/public/recommander + modèle club_referral. */
let n = 0;
const ip = () => "203.0.113." + (++n % 250);
const post = (json: unknown, o: { ip?: string; headers?: Record<string, string> } = {}) =>
  call("/api/public/recommander", { method: "POST", headers: { "x-requested-with": "piaffe", "cf-connecting-ip": o.ip || ip(), ...(o.headers || {}) }, json });
const uniq = () => `ecurie.${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}@exemple.fr`;
const lastFor = (to: string) => env.DB.prepare("SELECT * FROM email_outbox WHERE to_email = ? ORDER BY created_at DESC LIMIT 1").bind(to).first<any>();

describe("POST /api/public/recommander", () => {
  it("envoie la recommandation : expéditeur Stabl, réponse au cavalier, message échappé, lien de désinscription", async () => {
    const to = uniq();
    const r = await post({ to, club_name: "Écurie du Moulin", from_first: "Léa", from_last: "Martin", from_email: "Lea.Martin@Exemple.fr", message: "Essayez <b>Stabl</b> & dites-moi !" });
    expect(r.status).toBe(200);
    expect(await r.json()).toEqual({ ok: true });
    const row = await outbox((await lastFor(to)).id);
    expect(row.template).toBe("club_referral");
    expect(row.status).toBe("sent");
    expect(row.from_name).toBe("Stabl");
    expect(row.reply_to).toBe("lea.martin@exemple.fr");
    expect(row.category).toBe("referrals");
    expect(row.subject).toBe("Léa Martin vous recommande Stabl pour Écurie du Moulin");
    expect(row.html).toContain("Essayez &lt;b&gt;Stabl&lt;/b&gt; &amp; dites-moi");
    expect(row.html).not.toContain("<b>Stabl</b>");
    expect(row.html).toContain("https://stablapp.fr/?ref=cavalier");
    expect(row.html).toContain("Ne plus recevoir de recommandations");
    expect(row.html).toContain("/api/mail/unsubscribe?t=");
    expect(row.html).not.toContain("Gérer mes notifications");
    expect(JSON.parse(row.headers)["List-Unsubscribe"]).toContain("/api/mail/unsubscribe");
  });

  it("valide les champs", async () => {
    const ok = { to: uniq(), from_first: "Léa", from_email: "lea@exemple.fr" };
    for (const [body, field] of [
      [{ ...ok, to: "pas-une-adresse" }, "to"],
      [{ ...ok, from_email: "" }, "from_email"],
      [{ ...ok, from_first: "  " }, "from_first"],
      [{ ...ok, to: "lea@exemple.fr" }, "to"],
      [{ ...ok, message: "x".repeat(501) }, "message"],
      [{ ...ok, message: "Allez voir https://exemple.com" }, "message"],
    ] as [Record<string, unknown>, string][]) {
      const r = await post(body);
      expect(r.status, JSON.stringify(body).slice(0, 80)).toBe(400);
      expect(((await r.json()) as any).error.details.field).toBe(field);
    }
    expect((await lastFor(ok.to))).toBeNull();
    // un message de 500 caractères exactement passe
    expect((await post({ ...ok, message: "a".repeat(500) })).status).toBe(200);
  });

  it("champ piège : réponse normale, rien d'envoyé", async () => {
    const to = uniq();
    const r = await post({ to, from_first: "Bot", from_email: "bot@exemple.fr", site_web: "http://spam" });
    expect(r.status).toBe(200);
    expect(await lastFor(to)).toBeNull();
  });

  it("refuse une requête d'un autre site (CSRF)", async () => {
    const r = await call("/api/public/recommander", { method: "POST", headers: { origin: "https://pirate.example", "cf-connecting-ip": ip() }, json: { to: uniq(), from_first: "Léa", from_email: "lea@exemple.fr" } });
    expect(r.status).toBe(403);
  });

  it("CORS : le site stablapp.fr peut appeler la route", async () => {
    const r = await call("/api/public/recommander", { method: "OPTIONS", headers: { origin: "https://stablapp.fr" } });
    expect(r.status).toBe(204);
    expect(r.headers.get("access-control-allow-origin")).toBe("https://stablapp.fr");
    expect(r.headers.get("access-control-allow-headers")).toContain("x-requested-with");
  });

  it("limite : 1 par jour et par destinataire, 3 par heure et par IP", async () => {
    const to = uniq();
    const a = { to, from_first: "Léa", from_email: "lea@exemple.fr" };
    expect((await post(a)).status).toBe(200);
    const again = await post({ ...a, from_first: "Hugo", from_email: "hugo@exemple.fr" });
    expect(again.status).toBe(429);
    expect(((await again.json()) as any).error.code).toBe("rate_limited");

    const same = "198.18.0." + (Date.now() % 200);
    for (let i = 0; i < 3; i++) expect((await post({ to: uniq(), from_first: "Léa", from_email: "lea@exemple.fr" }, { ip: same })).status).toBe(200);
    expect((await post({ to: uniq(), from_first: "Léa", from_email: "lea@exemple.fr" }, { ip: same })).status).toBe(429);
  });
});

describe("mise en page des e-mails", () => {
  it("club_referral se rend sans club, avec et sans message ni nom d'écurie", async () => {
    const r = await renderTemplate(env, "club_referral", TEMPLATES.club_referral.sample, null, "contact@moulin.example");
    expect(r.category).toBe("referrals");
    expect(r.text).toContain("« Bonjour Claire");
    expect(r.text).toContain("Ne plus recevoir de recommandations");
    const bare = await renderTemplate(env, "club_referral", { from_first: "Léa", url: "https://stablapp.fr/?ref=cavalier" }, null, "x@exemple.fr");
    expect(bare.subject).toBe("Léa vous recommande Stabl");
    expect(bare.html).not.toContain("&#8220;"); // pas de citation vide
  });

  it("bandeau marine : logo Stabl pour la plateforme, pastille du club sinon ; signature Stabl en pied", () => {
    const base: Frame = { subject: "Test", preheader: "Pré", headerName: "Stabl", footer: [], blocks: [{ t: "h", text: "Titre promu" }, { t: "p", text: "Corps" }] };
    const p = renderHtml({ ...base, logoUrl: BRAND.logoUrl });
    expect(p).toContain(BRAND.img.logoWhite);
    expect(p).toContain('class="hero-title"');
    expect(p).toContain("Titre promu");
    expect(p).toContain(BRAND.img.logoSapphire);
    expect(p).toContain(BRAND.legal);
    const c = renderHtml({ ...base, headerName: "Écurie du Moulin", isClub: true, footer: ["Écurie du Moulin", "Lozanne"] });
    expect(c).toContain("via Stabl");
    expect(c).toMatch(/>M<\/td>/);
    expect(c).not.toContain(BRAND.img.logoWhite);
    const t = renderText({ ...base, footer: ["Écurie du Moulin"] });
    expect(t.startsWith("Titre promu\n")).toBe(true);
    expect(t).toContain("Envoyé avec Stabl");
    expect(t).toContain(BRAND.legal);
  });

  it("nouveaux blocs : étapes, carte, coches, pastille, citation (HTML et texte)", () => {
    const f: Frame = { subject: "S", preheader: "P", headerName: "Stabl", footer: [], blocks: [
      { t: "hero", title: "Héros", text: "Sous-titre", badge: "Étiquette", icon: "calendar" },
      { t: "steps", items: [{ title: "Importer", text: "vos données" }, { title: "Inviter" }] },
      { t: "card", kicker: "Réservation", title: "Galop 3", date: { weekday: "mer.", day: "25", month: "nov." }, amount: "52 €", rows: [["Avec", "Hugo"]], status: { text: "Confirmé", tone: "ok" } },
      { t: "checks", items: ["réserver"] },
      { t: "badge", text: "Nouveau" },
      { t: "quote", text: "<script>alert(1)</script>", by: "Léa" },
      { t: "button", label: "Secondaire", url: "javascript:alert(1)", variant: "secondary" },
    ] };
    const h = renderHtml(f);
    expect(h).toContain("icone-calendar@2x.png");
    expect(h).toContain("Étiquette");
    expect(h).toContain(">25<");
    expect(h).toContain("Confirmé");
    expect(h).toContain("&lt;script&gt;");
    expect(h).not.toContain("<script>alert");
    expect(h).not.toContain('href="javascript:');
    expect(h).toContain("v:roundrect");
    const t = renderText(f);
    expect(t).toContain("1. Importer\n   vos données");
    expect(t).toContain("2. Inviter");
    expect(t).toContain("Avec : Hugo");
    expect(t).toContain("- réserver");
    expect(t).toContain("« <script>alert(1)</script> »\nLéa");
  });

  it("initiale du club sans les mots génériques", () => {
    expect(initialOf("Écurie du Moulin")).toBe("M");
    expect(initialOf("Centre équestre de la Plaine")).toBe("P");
    expect(initialOf("Haras")).toBe("H");
    expect(initialOf("")).toBe("S");
  });
});
