import { describe, it, expect } from "vitest";
import { api, post, signup, uniq, PW, lastMail, tokenFrom, sessionCookie, env } from "./auth-kit";
import { seed } from "./helpers";
import { on } from "../src/lib/events";

const events: any[] = [];
on("club.created", (_e, ev) => { events.push(ev); });

describe("création de club", () => {
  it("crée le club avec un slug unique, l'appelant owner, 30 jours d'essai, et émet club.created", async () => {
    const { cookie, body } = await signup();
    const r = await post("/api/clubs", { name: "Écurie des Lilas", kind: "ecurie_pension", siren: "934 733 122" }, { cookie });
    expect(r.status).toBe(201);
    const { club, role } = (await r.json()) as any;
    expect(role).toBe("owner");
    expect(club).toMatchObject({ name: "Écurie des Lilas", slug: "ecurie-des-lilas", kind: "ecurie_pension", plan: "trial", plan_status: "trialing", siren: "934733122" });
    const days = (Date.parse(club.trial_ends_at) - Date.now()) / 864e5;
    expect(days).toBeGreaterThan(29.9);
    expect(days).toBeLessThan(30.1);
    expect(events.some((e) => e.club_id === club.id && e.user_id === body.user.id)).toBe(true);
    const me = (await (await api("/api/me", { cookie })).json()) as any;
    expect(me.current_club_id).toBe(club.id);
    expect(me.role).toBe("owner");
    const r2 = await post("/api/clubs", { name: "Écurie des Lilas" }, { cookie });
    expect(((await r2.json()) as any).club.slug).toMatch(/^ecurie-des-lilas-[0-9a-f]{6}$/);
  });
  it("valide les champs et exige une connexion", async () => {
    const { cookie } = await signup();
    expect((await post("/api/clubs", { name: "X" }, { cookie })).status).toBe(400);
    expect((await post("/api/clubs", { name: "Club", kind: "fusée" }, { cookie })).status).toBe(400);
    expect((await post("/api/clubs", { name: "Club", siren: "123" }, { cookie })).status).toBe(400);
    expect((await post("/api/clubs", { name: "Club" })).status).toBe(401);
  });
});

describe("invitations", () => {
  it("le gérant invite : e-mail invitation avec URL absolue, aperçu public, acceptation avec création de compte", async () => {
    const o = await seed("owner");
    const email = uniq("inv");
    const r = await post("/api/invitations", { email, role: "member", person_ref: "m012", first: "Emma", last: "Moreau" }, { token: o.token });
    expect(r.status).toBe(201);
    const j = (await r.json()) as any;
    expect(j.invitation).toMatchObject({ email, role: "member", person_ref: "m012", status: "pending" });
    expect(j.invitation).not.toHaveProperty("token_hash");
    const m = lastMail("invitation", email)!;
    expect(m.data).toMatchObject({ first: "Emma", club_name: "Écurie Test", role_label: "adhérent", inviter_name: "Léa Test" });
    expect(String(m.data.action_url)).toMatch(/^http:\/\/piaffe\.test\/invitation\/[A-Za-z0-9_-]{43}$/);
    const token = tokenFrom(m);
    const view = (await (await api("/auth/invitations/" + token)).json()) as any;
    expect(view.invitation).toMatchObject({ email, role: "member", status: "pending", account_exists: false, club: { name: "Écurie Test" } });
    expect((await post(`/auth/invitations/${token}/accept`, { password: "court" })).status).toBe(400);
    const acc = await post(`/auth/invitations/${token}/accept`, { password: PW, first: "Emma" });
    expect(acc.status).toBe(200);
    const a = (await acc.json()) as any;
    expect(a).toMatchObject({ current_club_id: o.clubId, role: "member", person_ref: "m012" });
    expect(a.user.email_verified).toBe(true);
    const me = (await (await api("/api/me", { cookie: sessionCookie(acc) })).json()) as any;
    expect(me.role).toBe("member");
    expect((await post(`/auth/invitations/${token}/accept`, { password: PW })).status).toBe(409);
  });

  it("un utilisateur connecté accepte ; un compte existant non connecté est renvoyé vers la connexion", async () => {
    const o = await seed("owner");
    const { email, cookie } = await signup();
    await post("/api/invitations", { email, role: "coach", person_ref: "c01" }, { token: o.token });
    const token = tokenFrom(lastMail("invitation", email));
    const anon = await post(`/auth/invitations/${token}/accept`, { password: PW });
    expect(((await anon.json()) as any).error.code).toBe("account_exists");
    const r = await post(`/auth/invitations/${token}/accept`, {}, { cookie });
    expect(((await r.json()) as any).role).toBe("coach");
  });

  it("parent de plusieurs enfants : les fiches s'additionnent dans une seule invitation valide", async () => {
    const o = await seed("owner");
    const email = uniq("parent");
    await post("/api/invitations", { email, role: "member", person_ref: "m020" }, { token: o.token });
    const first = tokenFrom(lastMail("invitation", email));
    await post("/api/invitations", { email, role: "member", person_ref: ["m021"] }, { token: o.token });
    const second = tokenFrom(lastMail("invitation", email));
    expect(((await (await api("/auth/invitations/" + first)).json()) as any).invitation.status).toBe("revoked");
    const acc = (await (await post(`/auth/invitations/${second}/accept`, { password: PW })).json()) as any;
    expect(acc.person_ref).toBe("m020,m021");
  });

  it("liste, révoque et renvoie ; un employé ne peut pas inviter ; validation du rôle", async () => {
    const o = await seed("owner");
    const st = await seed("staff", { clubId: o.clubId });
    const email = uniq();
    const j = (await (await post("/api/invitations", { email, role: "staff" }, { token: o.token })).json()) as any;
    expect((await post("/api/invitations", { email: uniq(), role: "staff" }, { token: st.token })).status).toBe(403);
    expect((await post("/api/invitations", { email: uniq(), role: "owner" }, { token: o.token })).status).toBe(400);
    expect((await post("/api/invitations", { email: uniq(), role: "member", person_ref: "m 1;drop" }, { token: o.token })).status).toBe(400);
    const list = (await (await api("/api/invitations?status=pending", { token: o.token })).json()) as any;
    expect(list.invitations.map((i: any) => i.id)).toContain(j.invitation.id);
    const rs = await post(`/api/invitations/${j.invitation.id}/resend`, {}, { token: o.token });
    expect(rs.status).toBe(200);
    const newId = ((await rs.json()) as any).invitation.id;
    expect((await api("/api/invitations/" + newId, { method: "DELETE", token: o.token })).status).toBe(200);
    const tok = tokenFrom(lastMail("invitation", email));
    expect(((await (await post(`/auth/invitations/${tok}/accept`, { password: PW })).json()) as any).error.code).toBe("invitation_revoked");
  });

  it("isolation : un gérant ne voit ni ne révoque les invitations d'un autre club", async () => {
    const a = await seed("owner"), b = await seed("owner");
    const j = (await (await post("/api/invitations", { email: uniq(), role: "member" }, { token: a.token })).json()) as any;
    const lb = (await (await api("/api/invitations", { token: b.token })).json()) as any;
    expect(lb.invitations.find((i: any) => i.id === j.invitation.id)).toBeUndefined();
    expect((await api("/api/invitations/" + j.invitation.id, { method: "DELETE", token: b.token })).status).toBe(404);
  });

  it("une invitation expirée est refusée", async () => {
    const o = await seed("owner");
    const email = uniq();
    await post("/api/invitations", { email, role: "member" }, { token: o.token });
    await env.DB.prepare("UPDATE invitations SET expires_at = '2000-01-01T00:00:00.000Z' WHERE email = ?").bind(email).run();
    const r = await post(`/auth/invitations/${tokenFrom(lastMail("invitation", email))}/accept`, { password: PW });
    expect(((await r.json()) as any).error.code).toBe("invitation_expired");
  });
});

describe("équipe d'accès", () => {
  it("liste, change de rôle, suspend (la session ne donne plus accès au club), retire", async () => {
    const o = await seed("owner");
    const s = await seed("staff", { clubId: o.clubId });
    const list = (await (await api("/api/club/users", { token: o.token })).json()) as any;
    expect(list.users.length).toBe(2);
    expect(list.users[0]).not.toHaveProperty("password_hash");
    expect((await api(`/api/club/users/${s.userId}`, { method: "PATCH", json: { role: "coach", person_ref: "c02" }, token: o.token })).status).toBe(200);
    expect(((await (await api("/api/me", { token: s.token })).json()) as any).role).toBe("coach");
    await api(`/api/club/users/${s.userId}`, { method: "PATCH", json: { status: "suspended" }, token: o.token });
    expect((await api("/api/club/bootstrap", { token: s.token })).status).toBe(403);
    expect((await api(`/api/club/users/${s.userId}`, { method: "DELETE", token: o.token })).status).toBe(200);
    expect(((await (await api("/api/club/users", { token: o.token })).json()) as any).users.length).toBe(1);
  });

  it("garde au moins un titulaire ; un gérant ne touche pas au titulaire ni à son propre rôle", async () => {
    const o = await seed("owner");
    const m = await seed("manager", { clubId: o.clubId });
    expect((await api(`/api/club/users/${o.userId}`, { method: "PATCH", json: { role: "manager" }, token: o.token })).status).toBe(409);
    expect((await api(`/api/club/users/${o.userId}`, { method: "PATCH", json: { status: "suspended" }, token: m.token })).status).toBe(403);
    expect((await api(`/api/club/users/${m.userId}`, { method: "PATCH", json: { role: "owner" }, token: m.token })).status).toBe(403);
    expect((await api(`/api/club/users/${o.userId}`, { method: "DELETE", token: o.token })).status).toBe(409);
    expect((await api("/api/club/users", { token: (await seed("member", { clubId: o.clubId })).token })).status).toBe(403);
  });

  it("isolation : impossible de modifier un utilisateur d'un autre club", async () => {
    const a = await seed("owner"), b = await seed("staff");
    expect((await api(`/api/club/users/${b.userId}`, { method: "PATCH", json: { role: "manager" }, token: a.token })).status).toBe(404);
  });
});

describe("clés d'API", () => {
  it("crée une clé montrée une seule fois, utilisable en Bearer, puis révoquée", async () => {
    const o = await seed("owner");
    const r = await post("/api/api-keys", { name: "Migration Kavalog", scopes: ["import", "read"] }, { token: o.token });
    expect(r.status).toBe(201);
    const j = (await r.json()) as any;
    expect(j.token).toMatch(/^pk_live_[0-9a-f]{8}_[A-Za-z0-9_-]{43}$/);
    expect(j.token.slice(8, 16)).toBe(j.api_key.prefix);
    const row = await env.DB.prepare("SELECT hash FROM api_keys WHERE id = ?").bind(j.api_key.id).first<any>();
    expect(row.hash).not.toContain(j.token);
    const list = (await (await api("/api/api-keys", { token: o.token })).json()) as any;
    expect(JSON.stringify(list)).not.toContain(j.token.slice(17));
    expect(list.api_keys[0].scopes).toEqual(["import", "read"]);
    expect((await api("/api/club/bootstrap", { token: j.token })).status).toBe(200);
    expect((await post("/api/records/batch", { ops: [] }, { token: j.token })).status).toBe(403); // pas le droit write
    expect((await api("/api/api-keys/" + j.api_key.id, { method: "DELETE", token: o.token })).status).toBe(200);
    expect((await api("/api/club/bootstrap", { token: j.token })).status).toBe(401);
  });
  it("refuse un droit inconnu, un rôle non gérant, et les clés d'un autre club", async () => {
    const o = await seed("owner"), other = await seed("owner");
    expect((await post("/api/api-keys", { name: "x", scopes: ["root"] }, { token: o.token })).status).toBe(400);
    expect((await post("/api/api-keys", { name: "x" }, { token: (await seed("coach", { clubId: o.clubId })).token })).status).toBe(403);
    const j = (await (await post("/api/api-keys", { name: "x" }, { token: o.token })).json()) as any;
    expect((await api("/api/api-keys/" + j.api_key.id, { method: "DELETE", token: other.token })).status).toBe(404);
  });
});
