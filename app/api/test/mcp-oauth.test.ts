import { describe, it, expect } from "vitest";
import { call, connect, env, form, pkce, REDIRECT, registerClient, seed, mcp } from "./mcp-kit";
import { setMcpFetch } from "../src/mcp/oauth";

describe("MCP · métadonnées OAuth", () => {
  it("décrit la ressource protégée et le serveur d'autorisation", async () => {
    for (const p of ["/.well-known/oauth-protected-resource", "/.well-known/oauth-protected-resource/mcp"]) {
      const r = await call(p);
      expect(r.status).toBe(200);
      const j = (await r.json()) as any;
      expect(j.resource).toBe("http://piaffe.test/mcp");
      expect(j.authorization_servers).toEqual(["http://piaffe.test"]);
    }
    const r = await call("/.well-known/oauth-authorization-server");
    const j = (await r.json()) as any;
    expect(j.code_challenge_methods_supported).toEqual(["S256"]);
    expect(j.registration_endpoint).toBe("http://piaffe.test/oauth/register");
    expect(j.token_endpoint_auth_methods_supported).toEqual(["none"]);
    expect(r.headers.get("access-control-allow-origin")).toBe("*");
  });

  it("répond 401 avec WWW-Authenticate sans jeton", async () => {
    const r = await call("/mcp", { method: "POST", json: { jsonrpc: "2.0", id: 1, method: "initialize", params: {} } });
    expect(r.status).toBe(401);
    expect(r.headers.get("www-authenticate")).toContain('resource_metadata="http://piaffe.test/.well-known/oauth-protected-resource/mcp"');
  });

  it("préflight CORS", async () => {
    const r = await call("/mcp", { method: "OPTIONS" });
    expect(r.status).toBe(204);
    expect(r.headers.get("access-control-allow-headers")).toContain("mcp-protocol-version");
  });
});

describe("MCP · enregistrement et accord", () => {
  it("refuse une adresse de retour dangereuse", async () => {
    for (const u of ["javascript:alert(1)", "http://evil.example/cb", "https://x.example/cb#frag"]) {
      const r = await call("/oauth/register", { method: "POST", json: { client_name: "X", redirect_uris: [u] } });
      expect(r.status).toBe(400);
    }
  });

  it("parcours complet : accord du gérant, échange du code, renouvellement remplacé", async () => {
    const s = await seed("owner");
    const t = await connect(s);
    expect(t.back.searchParams.get("state")).toBe("etat123");
    expect(t.back.searchParams.get("iss")).toBe("http://piaffe.test");
    expect(t.access_token).toMatch(/^stm_at_/);
    expect(t.refresh_token).toMatch(/^stm_rt_/);
    expect(t.scope).toBe("lecture");
    const init = await mcp(t.access_token, "initialize", { protocolVersion: "2025-06-18" });
    expect(init.body.result.serverInfo.name).toBe("stabl");
    expect(init.body.result.protocolVersion).toBe("2025-06-18");
    expect(init.body.result.instructions).toContain("Commence par l'outil « club »");
    // renouvellement : le nouveau jeton marche, l'ancien jeton de renouvellement est consommé
    const r1 = await call("/oauth/token", form({ grant_type: "refresh_token", refresh_token: t.refresh_token, client_id: t.client_id }));
    expect(r1.status).toBe(200);
    const n = (await r1.json()) as any;
    expect(n.refresh_token).not.toBe(t.refresh_token);
    expect((await mcp(n.access_token, "ping")).status).toBe(200);
    const r2 = await call("/oauth/token", form({ grant_type: "refresh_token", refresh_token: t.refresh_token, client_id: t.client_id }));
    expect(r2.status).toBe(400);
    expect(((await r2.json()) as any).error).toBe("invalid_grant");
  });

  it("exige PKCE S256 et un code_verifier exact, code à usage unique", async () => {
    const s = await seed("manager");
    const cl = await registerClient();
    const bad = await call("/oauth/authorize?" + new URLSearchParams({ response_type: "code", client_id: cl.client_id, redirect_uri: REDIRECT, state: "s", code_challenge: "x".repeat(43), code_challenge_method: "plain" }), { redirect: "manual" });
    expect(bad.status).toBe(302);
    expect(new URL(bad.headers.get("location")!).searchParams.get("error")).toBe("invalid_request");
    const wrongUri = await call("/oauth/authorize?" + new URLSearchParams({ response_type: "code", client_id: cl.client_id, redirect_uri: "https://evil.example/cb", code_challenge: "x".repeat(43), code_challenge_method: "S256" }), { redirect: "manual" });
    expect(wrongUri.status).toBe(400);
    expect(await wrongUri.text()).toContain("Connexion impossible");

    const p = await pkce();
    const a = await call("/oauth/authorize?" + new URLSearchParams({ response_type: "code", client_id: cl.client_id, redirect_uri: REDIRECT, state: "s", code_challenge: p.challenge, code_challenge_method: "S256" }), { redirect: "manual" });
    const demande = new URL(a.headers.get("location")!, "http://piaffe.test").searchParams.get("demande")!;
    const page = await (await call("/oauth/authorize?demande=" + demande, { headers: { cookie: "piaffe_s=" + s.token } })).text();
    const jeton = /name="jeton" value="([^"]+)"/.exec(page)![1];
    const f = form({ demande, jeton, club: s.clubId, decision: "autoriser" });
    const d = await call("/oauth/authorize", { ...f, headers: { ...f.headers, cookie: "piaffe_s=" + s.token }, redirect: "manual" });
    const code = new URL(d.headers.get("location")!).searchParams.get("code")!;
    const wrong = await call("/oauth/token", form({ grant_type: "authorization_code", code, code_verifier: "y".repeat(50), client_id: cl.client_id }));
    expect(wrong.status).toBe(400);
    // le code est brûlé même après un essai raté
    const again = await call("/oauth/token", form({ grant_type: "authorization_code", code, code_verifier: p.verifier, client_id: cl.client_id }));
    expect(again.status).toBe(400);
  });

  it("montre la connexion si la personne n'est pas connectée, et refuse un jeton de formulaire faux", async () => {
    const s = await seed("owner");
    const cl = await registerClient("ChatGPT");
    const p = await pkce();
    const a = await call("/oauth/authorize?" + new URLSearchParams({ response_type: "code", client_id: cl.client_id, redirect_uri: REDIRECT, code_challenge: p.challenge, code_challenge_method: "S256" }), { redirect: "manual" });
    const demande = new URL(a.headers.get("location")!, "http://piaffe.test").searchParams.get("demande")!;
    const login = await call("/oauth/authorize?demande=" + demande);
    const txt = await login.text();
    expect(txt).toContain("Connectez-vous pour relier ChatGPT");
    expect(login.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    const f = form({ demande, jeton: "faux", club: s.clubId, decision: "autoriser" });
    const d = await call("/oauth/authorize", { ...f, headers: { ...f.headers, cookie: "piaffe_s=" + s.token }, redirect: "manual" });
    expect(d.status).toBe(403);
    // une autre origine est refusée
    const page = await (await call("/oauth/authorize?demande=" + demande, { headers: { cookie: "piaffe_s=" + s.token } })).text();
    const jeton = /name="jeton" value="([^"]+)"/.exec(page)![1];
    const f2 = form({ demande, jeton, club: s.clubId, decision: "autoriser" });
    const x = await call("/oauth/authorize", { ...f2, headers: { ...f2.headers, cookie: "piaffe_s=" + s.token, origin: "https://evil.example" }, redirect: "manual" });
    expect(x.status).toBe(403);
    // refus : retour vers l'assistant avec access_denied
    const f3 = form({ demande, jeton, decision: "refuser" });
    const no = await call("/oauth/authorize", { ...f3, headers: { ...f3.headers, cookie: "piaffe_s=" + s.token }, redirect: "manual" });
    expect(new URL(no.headers.get("location")!).searchParams.get("error")).toBe("access_denied");
  });

  it("un adhérent ne peut pas relier d'assistant", async () => {
    const s = await seed("member", { personRef: "m001" });
    const cl = await registerClient();
    const p = await pkce();
    const a = await call("/oauth/authorize?" + new URLSearchParams({ response_type: "code", client_id: cl.client_id, redirect_uri: REDIRECT, code_challenge: p.challenge, code_challenge_method: "S256" }), { redirect: "manual" });
    const demande = new URL(a.headers.get("location")!, "http://piaffe.test").searchParams.get("demande")!;
    const r = await call("/oauth/authorize?demande=" + demande, { headers: { cookie: "piaffe_s=" + s.token } });
    expect(r.status).toBe(403);
    expect(await r.text()).toContain("Aucun club à relier");
  });

  it("accepte un client décrit par un document de métadonnées (client_id = URL)", async () => {
    const url = "https://assistant.example/oauth/client.json";
    setMcpFetch(async (u) => new Response(JSON.stringify({ client_id: String(u), client_name: "Assistant Exemple", redirect_uris: [REDIRECT] }), { headers: { "content-type": "application/json" } }));
    const p = await pkce();
    const a = await call("/oauth/authorize?" + new URLSearchParams({ response_type: "code", client_id: url, redirect_uri: REDIRECT, code_challenge: p.challenge, code_challenge_method: "S256" }), { redirect: "manual" });
    expect(a.status).toBe(302);
    expect(a.headers.get("location")).toContain("/oauth/authorize?demande=");
    setMcpFetch((...x) => fetch(...x));
  });

  it("retirer l'accès coupe le jeton ; une personne suspendue perd l'accès", async () => {
    const s = await seed("owner");
    const t = await connect(s);
    expect((await mcp(t.access_token, "tools/list")).status).toBe(200);
    const list = (await (await call("/api/mcp/grants", { token: s.token })).json()) as any;
    expect(list.grants).toHaveLength(1);
    expect(list.grants[0].client_name).toBe("Claude");
    const del = await call("/api/mcp/grants/" + list.grants[0].id, { method: "DELETE", token: s.token });
    expect(del.status).toBe(200);
    expect((await mcp(t.access_token, "tools/list")).status).toBe(401);
    const rf = await call("/oauth/token", form({ grant_type: "refresh_token", refresh_token: t.refresh_token }));
    expect(rf.status).toBe(400);

    const s2 = await seed("manager");
    const t2 = await connect(s2);
    await env.DB.prepare("UPDATE memberships SET status = 'suspended' WHERE user_id = ?").bind(s2.userId).run();
    expect((await mcp(t2.access_token, "tools/list")).status).toBe(401);
  });
});
