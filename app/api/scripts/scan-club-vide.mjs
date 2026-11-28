/* Scan d'un club vide : ouvre chaque écran du gérant et relève NaN, undefined et chiffres suspects.
   node scripts/scan-club-vide.mjs [--url=http://localhost:8787] [--out=fichier.json] */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
const require = createRequire(import.meta.url);
let playwright; try { playwright = require("playwright"); } catch { playwright = require("/opt/node-tools/node_modules/playwright"); }
const arg = (k, d) => (process.argv.find((a) => a.startsWith("--" + k + "=")) || "").split("=").slice(1).join("=") || d;
const URL0 = arg("url", "http://localhost:8787"); const OUT = arg("out", "");
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const RUN = Date.now().toString(36);
const browser = await playwright.chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const g = await ctx.newPage(); const errs = [];
g.on("pageerror", (e) => errs.push(String(e.message)));
g.on("console", (m) => { if (m.type() === "error" && !/fonts\.g|open-meteo|api-adresse|ERR_TUNNEL|ERR_NAME|ERR_FAILED/.test(m.text())) errs.push("console: " + m.text().slice(0, 300)); });
await g.goto(URL0 + "/"); await g.waitForSelector("#lv-email");
await g.click('[data-view="signup"]'); await g.waitForSelector('[data-as="club"]'); await g.click('[data-as="club"]');
await g.waitForSelector("#lv-first"); await g.fill("#lv-first", "Claire"); await g.fill("#lv-last", "Martin");
await g.fill("#lv-email", `scan.${RUN}@exemple.fr`); await g.fill("#lv-pass", "Cheval-Bai-2026!"); if (await g.$("#lv-cgu")) await g.check("#lv-cgu"); await g.click("button[type=submit]");
for (let i = 0; i < 40; i++) {
  if (await g.evaluate(() => window.PL && PL.ready === true && !document.querySelector("[data-step]"))) break;
  const id = await g.evaluate(() => { const s = document.querySelector("[data-step]"); return s && s.getAttribute("data-step"); });
  if (id === "name") { for (const [s, v] of [["#ob-name", "Écurie Scan " + RUN], ["#ob-line1", "1 rue"], ["#ob-zip", "69004"], ["#ob-city", "Lyon"]]) if (await g.$(s)) await g.fill(s, v); if (await g.$("#ob-cgv")) await g.check("#ob-cgv"); }
  if (process.env.DBG) console.log("step", i, id, await g.evaluate(() => [...document.querySelectorAll("button")].filter(b=>b.offsetParent).map(b=>b.outerHTML.slice(0,90)).slice(0,8).join(" | ")));
  await g.evaluate(() => { const o = [...document.querySelectorAll(".lv-opt[data-v]")].filter((b) => b.offsetParent); if (o.length && !o.some((b) => b.getAttribute("aria-pressed") === "true")) o[0].click(); const z = document.querySelector("[data-zero]"); if (z && z.offsetParent && z.getAttribute("aria-pressed") !== "true") z.click(); });
  await sleep(200);
  const btn = await g.$("[data-start], [data-next]:not([disabled]), [data-cont], [data-w=\"later\"], [data-finish], [data-done]");
  if (btn) { try { await btn.click({ timeout: 2000 }); } catch {} }
  await sleep(800);
}
await g.waitForFunction(() => window.PL && PL.ready === true, null, { timeout: 30000 }); await sleep(800);
const routes = await g.evaluate(() => Object.keys(P.mods));
const res = [];
for (const r of routes) {
  try { await g.evaluate((r) => P.go(r), r); await sleep(450); } catch (e) { res.push({ r, err: String(e) }); continue; }
  const t = await g.evaluate(() => (document.querySelector("#main, .main, main") || document.body).innerText);
  const bad = [...t.matchAll(/[^\n]{0,40}(NaN|undefined|Infinity|null €)[^\n]{0,40}/g)].map((m) => m[0]);
  const pct = [...t.matchAll(/[^\n]{0,50}\b\d{1,3}(,\d)?[\s  ]?%[^\n]{0,30}/g)].map((m) => m[0]).filter((s) => !/\b0[\s  ]?%/.test(s));
  const big = [...t.matchAll(/[^\n]{0,40}\b([1-9]\d{1,}|[2-9])(,\d+)?[\s  ](contrats|archivés|boxes|adhérents|chevaux|jours?|ouvertures|messages|commandes|€)[^\n]{0,30}/g)].map((m) => m[0]);
  res.push({ r, bad, pct, big, t });
}
const out = { errs, res, url: g.url(), title: await g.title() };
if (OUT) writeFileSync(OUT, JSON.stringify(out, null, 1));
for (const x of res) if ((x.bad && x.bad.length) || (x.pct && x.pct.length) || x.err) console.log("## " + x.r + "\n  " + [...(x.bad || []).map((s) => "BAD " + s), ...(x.pct || []).map((s) => "PCT " + s), x.err || ""].filter(Boolean).join("\n  "));
console.log("routes", routes.length, "erreurs", errs.length, errs.slice(0, 10));
await browser.close();
