// Robot SANS recette, injecté au début de chaque page de l'ancien logiciel (addInitScript / evaluateOnNewDocument).
// Il voit ce que la page charge, sur n'importe quel logiciel en ligne :
//   1. écoute : chaque réponse JSON (fetch, XHR) est fouillée ; chaque liste d'objets devient un « jeu » aplati
//      (une ligne par objet, une colonne par champ : « owner.lastName » -> « owner last name »), jamais les champs secrets ;
//   2. relit : les lectures faites avant son arrivée (performance.getEntries) sont redemandées une fois ;
//   3. tourne les pages : page=, offset=, skip=, curseur, lien « next », puis les listes par dates (planning, réservations,
//      factures du mois) redemandées de 24 mois en arrière à 12 mois devant ;
//   4. lit l'écran : les fiches répétées (cartes) ; les tableaux et grilles sont lus par extension/extraire.js ;
//   5. le contrat : fin d'engagement et prix par mois (pages « Abonnement », « Mon offre »), pour l'offre de reprise.
// Rien ne part ailleurs que vers le robot Stabl qui l'interroge (window.__stablMx.collect()). Lecture seule : il ne
// refait que des LECTURES (GET, ou POST de recherche déjà faits par la page) à la même adresse.
// Cette fonction doit rester autonome (aucune variable extérieure) : elle est envoyée au navigateur sous forme de texte.

export function robotDansLaPage() {
  'use strict';
  if (window.__stablMx) return;
  const MX = (window.__stablMx = { v: '2.0.0', contrat: null, sets: new Map(), reqs: [], busy: false, st: '', pages: 0, seen: new Set() });
  const MAXR = 20000, MAXSETS = 80;
  const SECRET = /pass(word)?|pwd|mot.?de.?passe|mdp|token|secret|jwt|bearer|session|cookie|csrf|xsrf|api.?key|apikey|iban|bic|card.?number|cvv|cvc|^pan$|ssn|securite.?sociale|social.?security|^nir$|otp|totp|salt|hash/i;
  const nk = k => String(k).replace(/([a-z])([A-Z])/g, '$1 $2').replace(/[_\-.]+/g, ' ').trim().toLowerCase();
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const tot = () => { let n = 0; for (const s of MX.sets.values()) n += s.rows.length; return n; };
  const state = st => { MX.st = st; };

  /* un objet -> une ligne à plat ; les champs secrets et les longues chaînes opaques (jetons, images) sont ignorés */
  function flat(o, pre, out, d) {
    for (const [k, v] of Object.entries(o || {})) {
      if (k === '__proto__' || SECRET.test(k)) continue;
      const key = nk(k); const full = pre ? pre + ' ' + key : key;
      if (v == null) { const kk = pre ? full : key; if (!(kk in out)) out[kk] = ''; continue; }
      if (Array.isArray(v)) {
        if (v.every(x => x == null || typeof x !== 'object')) out[key in out ? full : key] = v.filter(x => x != null).join(', ').slice(0, 500);
        else if (d < 3) { const nm = v.map(x => x && (x.name || x.label || x.title || x.nom || x.libelle)).filter(Boolean); if (nm.length) out[key in out ? full : key] = nm.join(', ').slice(0, 500); else out[(key in out ? full : key) + ' nb'] = v.length; }
        continue;
      }
      if (typeof v === 'object') { if (d < 4) flat(v, key, out, d + 1); continue; }
      if (typeof v === 'string' && (v.length > 2000 || /^(ey[\w-]{10,}\.){2}|^[A-Za-z0-9+/]{120,}={0,2}$|^data:/.test(v))) continue;
      out[pre ? full : key] = v; // « owner.lastName » -> « owner last name » : le nom du parent dit ce qu'est le champ
    }
    return out;
  }
  const objRows = arr => arr.filter(x => x && typeof x === 'object' && !Array.isArray(x)).map(x => flat(x, '', {}, 0));
  /* les listes d'une réponse JSON : tableaux d'objets d'au moins 2 champs */
  function lists(j, path, out, d) {
    if (!j || typeof j !== 'object' || d > 6 || out.length > 12) return out;
    if (Array.isArray(j)) {
      const objs = j.filter(x => x && typeof x === 'object' && !Array.isArray(x));
      if (objs.length >= 1 && objs.length >= j.length * 0.8 && objs.some(o => Object.keys(o).length >= 2)) { out.push({ path, arr: objs }); return out; }
      j.slice(0, 3).forEach((x, i) => lists(x, path + '[' + i + ']', out, d + 1)); return out;
    }
    for (const [k, v] of Object.entries(j)) if (v && typeof v === 'object' && !SECRET.test(k)) lists(v, path ? path + '.' + k : k, out, d + 1);
    return out;
  }
  const title = () => { const h = document.querySelector("h1, [role=heading][aria-level='1'], header h2"); return String((h && h.textContent) || document.title || '').replace(/\s+/g, ' ').trim().slice(0, 80); };
  const sigOf = r => { const id = r.id ?? r.uuid ?? r.reference ?? r.ref ?? r.code ?? r.numero; return id != null && id !== '' ? '#' + id : JSON.stringify(r).slice(0, 400); };
  function addSet(key, src, rows, where, label) {
    if (!rows.length) return 0;
    let S = MX.sets.get(key);
    if (!S) { if (MX.sets.size >= MAXSETS) return 0; S = { key, src, where: String(where || '').slice(0, 200), label: label || title(), page: location.pathname.slice(0, 160), rows: [], sig: new Set(), fields: [], at: Date.now() }; MX.sets.set(key, S); }
    let added = 0;
    for (const r of rows) { if (S.rows.length >= MAXR) break; const g = sigOf(r); if (S.sig.has(g)) continue; S.sig.add(g); S.rows.push(r); added++; for (const f of Object.keys(r)) if (!S.fields.includes(f) && S.fields.length < 120) S.fields.push(f); }
    return added;
  }
  const keyOf = (url, path) => { try { const u = new URL(url, location.href); return 'api:' + u.host + u.pathname.replace(/\/\d+(?=\/|$)/g, '/:id').replace(/\/[0-9a-f-]{20,}(?=\/|$)/gi, '/:id') + '#' + path.replace(/\[\d+\]/g, '[]'); } catch (e) { return 'api:' + url + '#' + path; } };
  function onJson(url, j, req) {
    try { contractJson(url, j); } catch (e) { /* rien */ }
    const L = lists(j, '', [], 0); let n = 0;
    for (const l of L) {
      const rows = objRows(l.arr); if (!rows.length) continue;
      const k = keyOf(url, l.path); n += addSet(k, 'api', rows, url.split('?')[0] + ' ' + l.path);
      if (req) { req.key = req.key || k; }
    }
    if (req && L.length) { req.json = j; req.n = L.reduce((a, l) => a + l.arr.length, 0); }
    return n;
  }
  /* une liste vide (« aucune reprise ce jour ») est quand même une liste : la lecture est retenue pour d'autres dates */
  const LISTY = /cavalier|rider|member|adherent|client|customer|contact|horse|cheval|chevaux|equid|pension|board|forfait|package|carte|reprise|lesson|cours|planning|agenda|calend|event|seance|booking|reserv|factur|invoice|paiement|payment|reglement|licen|soin|care|vet|stock|supplier|fournisseur|staff|employ|ecriture|journal|account|compte/i;
  const DATED = /reprise|lesson|cours|planning|agenda|calend|event|seance|booking|reserv|factur|invoice|paiement|payment|reglement|soin|care|ecriture|journal|entries|transactions/i;
  const emptyList = (url, j) => { try { if (MX.reqs.length > 150 || !LISTY.test(new URL(url, location.href).pathname)) return false; if (Array.isArray(j)) return !j.length; if (!j || typeof j !== 'object') return false; return Object.values(j).some(v => Array.isArray(v) && !v.length); } catch (e) { return false; } };
  const keep = (req, n, j) => { if (!(n || req.n || emptyList(req.url, j)) || MX.reqs.length > 200 || MX.reqs.some(r => r.url === req.url && r.method === req.method && (r.body || '') === (req.body || ''))) return; MX.reqs.push(req); };
  const isJson = (ct, t) => /json/i.test(ct || '') || /^\s*[[{]/.test(t || '');
  /* jamais une écriture : seulement GET, ou un POST dont le corps JSON ressemble à une recherche */
  const lecture = (method, url, body) => method === 'GET' || (method === 'POST' && body && /^\s*[{]/.test(body) && /search|recherch|query|filter|filtre|list|liste|find|graphql|report|export/i.test(url + ' ' + body.slice(0, 300)) && !/mutation\s|delete|supprim|update|create|insert/i.test(body.slice(0, 300)));

  /* 1. écoute : fetch et XHR (la page continue exactement comme avant) */
  const of = window.fetch;
  if (of) window.fetch = async function (input, init) {
    const res = await of.apply(this, arguments);
    try {
      const url = typeof input === 'string' ? input : input && input.url; const method = String((init && init.method) || (input && input.method) || 'GET').toUpperCase();
      const ct = res.headers.get('content-type') || '';
      const body = init && typeof init.body === 'string' ? init.body.slice(0, 4000) : null;
      if (url && res.ok && /json|text\/plain/i.test(ct) && lecture(method, String(url), body)) {
        const hd = {}; const h = (init && init.headers) || (input && input.headers); if (h) { try { new Headers(h).forEach((v, k) => { hd[k] = v; }); } catch (e) { /* rien */ } }
        const req = { url: new URL(url, location.href).href, method, headers: hd, body };
        res.clone().text().then(t => { if (isJson(ct, t)) { try { const j = JSON.parse(t); keep(req, onJson(req.url, j, req), j); } catch (e) { /* rien */ } } }).catch(() => {});
      }
    } catch (e) { /* rien */ }
    return res;
  };
  const XO = XMLHttpRequest.prototype.open, XS = XMLHttpRequest.prototype.send, XH = XMLHttpRequest.prototype.setRequestHeader;
  XMLHttpRequest.prototype.open = function (m, u) { this.__st = { method: String(m || 'GET').toUpperCase(), url: u, headers: {} }; return XO.apply(this, arguments); };
  XMLHttpRequest.prototype.setRequestHeader = function (k, v) { try { if (this.__st) this.__st.headers[k] = v; } catch (e) { /* rien */ } return XH.apply(this, arguments); };
  XMLHttpRequest.prototype.send = function (body) {
    try {
      const g = this.__st;
      if (g) {
        g.body = typeof body === 'string' ? body.slice(0, 4000) : null;
        this.addEventListener('load', () => {
          try {
            if (this.status >= 200 && this.status < 300 && (this.responseType === '' || this.responseType === 'text' || this.responseType === 'json') && lecture(g.method, String(g.url), g.body)) {
              const ct = this.getResponseHeader('content-type') || ''; const raw = this.responseType === 'json' ? this.response : this.responseText;
              const t = typeof raw === 'string' ? raw : null;
              if (raw && (typeof raw === 'object' || isJson(ct, t))) { const req = { ...g, url: new URL(g.url, location.href).href }; const j = typeof raw === 'object' ? raw : JSON.parse(t); keep(req, onJson(req.url, j, req), j); }
            }
          } catch (e) { /* rien */ }
        });
      }
    } catch (e) { /* rien */ }
    return XS.apply(this, arguments);
  };

  /* 2. relit ce qui était chargé avant l'arrivée du robot */
  async function reread() {
    const E = (performance.getEntriesByType ? performance.getEntriesByType('resource') : []).filter(e => /fetch|xmlhttprequest/.test(e.initiatorType)).map(e => e.name);
    const urls = [...new Set(E)].filter(u => { try { const x = new URL(u); return /^https?:$/.test(x.protocol) && x.origin === location.origin && !/\.(js|css|png|jpe?g|svg|woff2?|gif|webp|ico)(\?|$)/i.test(x.pathname) && !MX.reqs.some(r => r.url === u); } catch (e) { return false; } }).slice(0, 40);
    for (const u of urls) {
      try {
        const r = await of.call(window, u, { credentials: 'same-origin' }); if (!r.ok) continue;
        const ct = r.headers.get('content-type') || ''; const t = await r.text(); if (!isJson(ct, t)) continue;
        const req = { url: u, method: 'GET', headers: {} }; const j = JSON.parse(t); keep(req, onJson(u, j, req), j);
      } catch (e) { /* rien */ }
    }
  }

  /* 3a. listes paginées côté serveur */
  const PAGE_K = /^(page|p|pagenumber|page_number|pageindex|pageno|current_page|currentpage|numpage)$/i, OFF_K = /^(offset|skip|start|from|startindex|first|debut)$/i, LIM_K = /^(limit|per_page|perpage|pagesize|page_size|size|count|take|rows|max|maxresults|num|nb|parpage)$/i;
  const nextOf = j => { if (!j || typeof j !== 'object') return null; const c = [j.next, j.nextPage, j.next_page_url, j.links && j.links.next, j._links && j._links.next && j._links.next.href, j.paging && j.paging.next, j.meta && j.meta.next, j.pagination && (j.pagination.next || j.pagination.next_url), j['hydra:view'] && j['hydra:view']['hydra:next']]; for (const x of c) if (typeof x === 'string' && /^(https?:|\/|\?)/.test(x)) return x; return null; };
  const cursorOf = j => { if (!j || typeof j !== 'object') return null; const c = [j.cursor, j.nextCursor, j.next_cursor, j.after, j.meta && (j.meta.next_cursor || j.meta.cursor), j.pagination && (j.pagination.cursor || j.pagination.next_cursor), j.page_info && j.page_info.end_cursor, j.paging && j.paging.cursors && j.paging.cursors.after]; for (const x of c) if (x && (typeof x === 'string' || typeof x === 'number')) return String(x); return null; };
  const cursorKey = j => { if (!j || typeof j !== 'object') return ''; for (const k of ['next_cursor', 'nextCursor', 'cursor', 'after']) if (j[k] && typeof j[k] !== 'object') return k; return ''; };
  async function getJson(req, url, body) {
    if (!lecture(req.method || 'GET', url, body)) return null;
    const u = new URL(url, location.href); if (u.origin !== location.origin && u.origin !== new URL(req.url).origin) return null;
    const h = { ...(req.headers || {}) }; delete h['content-length'];
    const r = await of.call(window, u.href, { method: req.method || 'GET', headers: h, body: req.method && req.method !== 'GET' ? body : undefined, credentials: 'include' });
    if (!r.ok) return null; const t = await r.text(); try { return JSON.parse(t); } catch (e) { return null; }
  }
  async function walkReq(req, maxPages) {
    if (!req || req.walked) return; req.walked = true; if (!lecture(req.method, req.url, req.body)) return;
    let u; try { u = new URL(req.url); } catch (e) { return; }
    let pk = null, ok = null, lk = null; for (const k of u.searchParams.keys()) { if (PAGE_K.test(k)) pk = k; else if (OFF_K.test(k)) ok = k; else if (LIM_K.test(k)) lk = k; }
    let B = null; if (req.body) { try { B = JSON.parse(req.body); } catch (e) { /* rien */ } }
    if (B && typeof B === 'object') for (const k of Object.keys(B)) { if (PAGE_K.test(k)) pk = pk || 'b:' + k; else if (OFF_K.test(k)) ok = ok || 'b:' + k; else if (LIM_K.test(k)) lk = lk || 'b:' + k; }
    const val = k => (k.startsWith('b:') ? B[k.slice(2)] : u.searchParams.get(k));
    const first = req.n || 0; let j = req.json, page = 1, guard = 0, nextU = nextOf(j), cur = cursorOf(j);
    const lim = (lk && +val(lk)) || first || 20, p0 = pk ? +val(pk) || 1 : 1, o0 = ok ? +val(ok) || 0 : 0;
    while (guard++ < maxPages) {
      let url = null, body = req.body;
      const set = (k, v) => { if (k.startsWith('b:')) { B[k.slice(2)] = v; body = JSON.stringify(B); } else { const x = new URL(url || u.href); x.searchParams.set(k, String(v)); url = x.href; } };
      if (nextU) url = new URL(nextU, u).href;
      else if (pk || ok) { page++; url = u.href; if (pk) set(pk, p0 + page - 1); else set(ok, o0 + (page - 1) * lim); }
      else if (cur) { const x = new URL(u); const ck = [...x.searchParams.keys()].find(k => /cursor|after|page_token|pagetoken|continuation/i.test(k)) || cursorKey(j) || 'cursor'; x.searchParams.set(ck, cur); url = x.href; }
      else break;
      if (!url || MX.seen.has(url + (body || ''))) break; MX.seen.add(url + (body || ''));
      let jj = null; try { jj = await getJson(req, url, body); } catch (e) { break; } if (!jj) break;
      const before = tot(); onJson(url, jj, null); const after = tot();
      MX.pages++; state('pages'); if (after === before) break; nextU = nextOf(jj); cur = cursorOf(jj); j = jj; if (!nextU && !pk && !ok && !cur) break;
      await sleep(120);
    }
  }

  /* 3b. listes par dates : la même lecture refaite fenêtre après fenêtre, de 24 mois en arrière à 12 mois devant */
  const DATE_V = /^(\d{4})-(\d{2})-(\d{2})(?=$|T|\s)/;
  const ymd = t => new Date(t).toISOString().slice(0, 10);
  const HIST = () => { const h = +window.__stablMxHist; return window.__stablMxHist != null && h >= 0 && h <= 3650 ? h : 730; };
  async function walkDates(req) {
    if (!req || req.dated || !lecture(req.method, req.url, req.body)) return; req.dated = true;
    if (!DATED.test(req.url + ' ' + (req.key || ''))) return;
    let u; try { u = new URL(req.url); } catch (e) { return; }
    let B = null; if (req.body) { try { B = JSON.parse(req.body); } catch (e) { /* rien */ } }
    const D = []; for (const [k, v] of u.searchParams) if (DATE_V.test(v)) D.push({ k, v });
    if (B && typeof B === 'object') for (const [k, v] of Object.entries(B)) if (typeof v === 'string' && DATE_V.test(v)) D.push({ k: 'b:' + k, v });
    if (!D.length || D.length > 2) return;
    const t0 = v => { const m = DATE_V.exec(v); return Date.UTC(+m[1], +m[2] - 1, +m[3]); };
    const put = (v, t) => ymd(t) + v.slice(10);
    const today = t0(ymd(Date.now())), DAY = 864e5; let wins = [];
    if (D.length === 2) {
      D.sort((a, b) => t0(a.v) - t0(b.v)); let span = Math.max(1, Math.min(31, Math.round((t0(D[1].v) - t0(D[0].v)) / DAY) || 1));
      if (span < 31) {
        const x = new URL(u.href), B2 = B ? { ...B } : null;
        [today, today + 31 * DAY].forEach((t, i) => { const d = D[i], nv = put(d.v, t); if (d.k.startsWith('b:')) B2[d.k.slice(2)] = nv; else x.searchParams.set(d.k, nv); });
        let jj = null; try { jj = await getJson(req, x.href, B2 ? JSON.stringify(B2) : req.body); } catch (e) { /* rien */ } if (jj) span = 31;
      }
      for (let t = today; t <= today + 365 * DAY; t += span * DAY) wins.push([t, t + span * DAY]);
      for (let t = today - span * DAY; t >= today - HIST() * DAY - span * DAY; t -= span * DAY) wins.push([t, t + span * DAY]);
    } else {
      if (!/date|day|jour|semaine|week|mois|month/i.test(D[0].k)) return;
      for (let t = today; t <= today + 120 * DAY; t += DAY) wins.push([t]);
      for (let t = today - DAY; t >= today - 14 * DAY; t -= DAY) wins.push([t]);
    }
    wins = wins.slice(0, 160);
    for (const w of wins) {
      let body = req.body; const B2 = B ? { ...B } : null; const x = new URL(u.href);
      D.forEach((d, i) => { const nv = put(d.v, w[i] != null ? w[i] : w[0]); if (d.k.startsWith('b:')) B2[d.k.slice(2)] = nv; else x.searchParams.set(d.k, nv); });
      if (B2) body = JSON.stringify(B2);
      if (MX.seen.has(x.href + (body || ''))) continue; MX.seen.add(x.href + (body || ''));
      let jj = null; try { jj = await getJson(req, x.href, body); } catch (e) { continue; } if (!jj) continue;
      onJson(x.href, jj, null); MX.pages++; state('dates'); await sleep(60);
    }
  }

  /* 4. l'écran : fiches répétées (une carte par cheval, par cavalier…) */
  const vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  function scanCards() {
    let n = 0; const seenP = new Set();
    for (const p of document.querySelectorAll('main ul, main ol, main div, [role=list], [role=main] div, #content div, .content div')) {
      if (seenP.size > 30 || seenP.has(p) || p.closest('table,[role=grid],nav,header,footer,aside')) continue;
      const kids = [...p.children]; if (kids.length < 4) continue;
      const sig = e => e.tagName + '.' + [...e.classList].filter(c => !/active|selected|hover|odd|even|first|last/.test(c)).slice(0, 2).join('.');
      const s0 = sig(kids[0]); const same = kids.filter(k => sig(k) === s0); if (same.length < Math.max(4, kids.length * 0.7) || !vis(p)) continue;
      const lines = e => String(e.innerText || '').split(/\n+/).map(x => x.trim()).filter(Boolean).slice(0, 12);
      const L = same.map(lines).filter(l => l.length >= 2 && l.length <= 12 && l.every(x => x.length < 140)); if (L.length < 4) continue;
      seenP.add(p);
      // libellé « Race : Connemara » -> colonne « race »
      const rows = L.map(l => { const o = {}; l.forEach((x, i) => { const m = /^([^:]{2,30})\s*:\s*(.+)$/.exec(x); if (m && !SECRET.test(m[1])) o[nk(m[1])] = m[2]; else o['champ ' + (i + 1)] = x; }); return o; });
      n += addSet('dom:cards:' + location.pathname + ':' + s0, 'ecran', rows, location.pathname + ' fiches');
    }
    return n;
  }

  /* 5. le contrat : fin d'engagement et prix par mois. Seulement une date, un prix et une courte phrase comme preuve. */
  const MOIS = { janvier: 0, janv: 0, jan: 0, january: 0, fevrier: 1, fev: 1, feb: 1, february: 1, mars: 2, mar: 2, march: 2, avril: 3, avr: 3, apr: 3, april: 3, mai: 4, may: 4, juin: 5, jun: 5, june: 5, juillet: 6, juil: 6, jul: 6, july: 6, aout: 7, aug: 7, august: 7, septembre: 8, sept: 8, sep: 8, september: 8, octobre: 9, oct: 9, october: 9, novembre: 10, nov: 10, november: 10, decembre: 11, dec: 11, december: 11 };
  const deacc = x => String(x).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  function dateIn(v) {
    if (v == null || v === '') return 0;
    if (typeof v === 'number') return v > 1e12 ? v : v > 1e9 ? v * 1000 : 0;
    const s = deacc(v).trim(); let m;
    if ((m = /(\d{4})-(\d{2})-(\d{2})/.exec(s))) return Date.UTC(+m[1], +m[2] - 1, +m[3]);
    if ((m = /\b(\d{1,2})[/.](\d{1,2})[/.](\d{2,4})\b/.exec(s))) { const y = +m[3] < 100 ? 2000 + +m[3] : +m[3]; return Date.UTC(y, +m[2] - 1, +m[1]); }
    if ((m = /\b(\d{1,2})(?:er)? ([a-z]{3,9})\.? (\d{4})\b/.exec(s)) && MOIS[m[2]] != null) return Date.UTC(+m[3], MOIS[m[2]], +m[1]);
    return 0;
  }
  const C_KEY = /(commit|engag|contract|contrat|minimum.?term|term).{0,24}(end|fin|until|jusqu|expir)|(end|fin).{0,12}(commit|engag|contract|contrat)|cancel.?at|ends?.?at|end.?date|expir/i;
  const R_KEY = /renew|renouvel|period.?end|next.?(billing|payment|invoice)|prochain.?(prelevement|paiement)|echeance/i;
  const P_KEY = /^(amount|price|prix|montant|unit amount|unit price|total|mrr|monthly price|prix mensuel|tarif|price ht|prix ht|subtotal)$/;
  const BILLCTX = /abonnement|subscription|billing|facturation|mon.?offre|offer|forfait.?(stabl|logiciel)|plan|contrat|contract|licence.?logiciel/i;
  const soon = t => t > Date.now() + 864e5 && t < Date.now() + 5 * 365 * 864e5;
  function contractSet(c) {
    const o = MX.contrat; const better = !o || c.score > o.score || (c.score === o.score && (c.until || 0) > (o.until || 0));
    if (c.until && better) MX.contrat = { ...(o || {}), until: c.until, score: c.score, ev: c.ev, src: c.src, page: location.pathname.slice(0, 120) };
    if (c.monthly > 0 && (!MX.contrat || !MX.contrat.monthly || c.pscore > (MX.contrat.pscore || 0))) MX.contrat = { ...(MX.contrat || { score: 0 }), monthly: Math.round(c.monthly * 100) / 100, pscore: c.pscore || 1, pev: c.pev || '' };
  }
  function contractJson(url, j) {
    if (!BILLCTX.test(url)) return;
    const walk = (o, d, ctx) => {
      if (!o || typeof o !== 'object' || d > 6) return; if (Array.isArray(o)) { o.slice(0, 20).forEach(x => walk(x, d + 1, ctx)); return; }
      let interval = ''; for (const [k, v] of Object.entries(o)) if (/^(interval|billing.?period|periodicity|periodicite|frequency|recurring)$/i.test(k) && typeof v === 'string') interval = v.toLowerCase();
      for (const [k, v] of Object.entries(o)) {
        if (SECRET.test(k)) continue; const key = nk(k);
        if (v && typeof v === 'object') { walk(v, d + 1, ctx + ' ' + key); continue; }
        const isC = C_KEY.test(key), isR = R_KEY.test(key);
        if (isC || isR) { const t = dateIn(v); if (soon(t)) contractSet({ until: t, score: isC ? 3 : 1, ev: (ctx + ' ' + key).trim().slice(-60), src: 'api' }); }
        if (P_KEY.test(key) && (typeof v === 'number' || /^\d+([.,]\d+)?$/.test(String(v)))) {
          let n = parseFloat(String(v).replace(',', '.')); if (/cents?|amount$/.test(key) && Number.isInteger(n) && n >= 1000) n = n / 100;
          if (/year|annu|an$/.test(interval)) n = n / 12; if (n > 2 && n < 3000) contractSet({ monthly: n, pscore: 2, pev: (ctx + ' ' + key).trim().slice(-60) });
        }
      }
    };
    walk(j, 0, '');
  }
  const T_C = /engag|fin de (votre |du )?(contrat|engagement|periode)|duree minimale|commitment|minimum term|contract (ends|end date)|valable jusqu|jusqu.au/i;
  const T_R = /renouvel|prochain (prelevement|paiement)|echeance|renews|next (billing|payment|invoice)|expire/i;
  const T_P = /(\d{1,4}(?:[ .]\d{3})*(?:[.,]\d{1,2})?)\s*(?:€|eur)\s*(ht|ttc)?\s*(?:\/|par)\s*(mois|month|an|annee|year)/i;
  function contractDom() {
    const billPage = BILLCTX.test(location.pathname + location.hash + ' ' + title());
    if (!billPage) return;
    const lines = String(document.body.innerText || '').split(/\n+/).map(x => x.replace(/\s+/g, ' ').trim()).filter(x => x && x.length < 220).slice(0, 4000);
    lines.forEach((l, i) => {
      const a = deacc(l); const isC = T_C.test(a), isR = T_R.test(a);
      if (isC || isR) { const t = dateIn(a) || dateIn(deacc(lines[i + 1] || '')); if (soon(t)) contractSet({ until: t, score: (isC ? 3 : 1) + 1, ev: l.slice(0, 140), src: 'ecran' }); }
      const m = T_P.exec(a); if (m) { let n = parseFloat(m[1].replace(/[ .](?=\d{3})/g, '').replace(',', '.')); if (/an|year/.test(m[3])) n = n / 12; if (m[2] === 'ttc') n = n / 1.2; if (n > 2 && n < 3000) contractSet({ monthly: n, pscore: 3, pev: l.slice(0, 140) }); }
    });
  }

  async function settle(ms = 700, max = 6000) {
    let last = Date.now(); const ob = new MutationObserver(() => { last = Date.now(); });
    try { ob.observe(document.documentElement, { subtree: true, childList: true, characterData: true }); } catch (e) { /* rien */ }
    const n0 = MX.reqs.length; const t0 = Date.now();
    while (Date.now() - t0 < max) { await sleep(150); if (MX.reqs.length !== n0) last = Math.max(last, Date.now() - 200); if (Date.now() - last > ms) break; }
    ob.disconnect();
  }
  function collect() {
    return [...MX.sets.values()].filter(s => s.rows.length).map(s => ({ key: s.key, src: s.src, where: s.where, label: s.label, page: s.page, fields: s.fields, rows: s.rows, n: s.rows.length, host: location.host }));
  }

  /* ce que le logiciel a demandé à son serveur pour remplir ses listes : le pilote peut refaire une de ces lectures avec d'autres filtres */
  const maskV = v => { v = String(v); return v.length > 24 && !/\s/.test(v) && !DATE_V.test(v) ? '…' : v.slice(0, 40); };
  const maskP = p => p.split('/').map(x => (x.length > 24 || (/^[\w-]{16,}$/.test(x) && /\d/.test(x) && /[a-zA-Z]/.test(x)) ? '…' : x)).join('/').slice(-70);
  MX.apis = function () {
    const out = []; MX.reqs.forEach((r, k) => {
      if (r.method !== 'GET') return; let u; try { u = new URL(r.url); } catch (e) { return; }
      const S = r.key && MX.sets.get(r.key); const p = {};
      for (const [a, v] of u.searchParams) { if (SECRET.test(a) || /token|key|auth|secret|sig/i.test(a)) continue; p[a.slice(0, 40)] = p[a] != null ? p[a] + ',' + maskV(v) : maskV(v); }
      out.push({ k, adresse: maskP(u.pathname), params: p, lignes: S ? S.rows.length : 0, w: (LISTY.test(u.pathname) ? 2 : 0) + (S ? 1 : 0) });
    });
    const seen = new Set();
    return out.sort((a, b) => b.w - a.w || b.k - a.k).filter(x => { const g = x.adresse + JSON.stringify(x.params); if (seen.has(g)) return false; seen.add(g); return true; }).slice(0, 8).map(({ w, ...x }) => x);
  };
  MX.apiFind = function (path) { for (let k = MX.reqs.length - 1; k >= 0; k--) { const r = MX.reqs[k]; try { if (r.method === 'GET' && !r.asked && maskP(new URL(r.url).pathname) === path) return k; } catch (e) { /* rien */ } } return -1; };
  MX.ask = async function (k, params) {
    const r = MX.reqs[k]; if (!r || r.method !== 'GET' || !Array.isArray(params)) return null; const u = new URL(r.url);
    const P = params.filter(p => p && /^[\w.\-[\]]{1,40}$/.test(String(p.n || '')) && !/token|key|auth|secret|sig|pass/i.test(p.n)).slice(0, 10).map(p => ({ n: String(p.n), v: String(p.v == null ? '' : p.v).slice(0, 80) }));
    for (const n of new Set(P.map(p => p.n))) u.searchParams.delete(n); for (const p of P) if (p.v !== '') u.searchParams.append(p.n, p.v);
    let j = null; try { j = await getJson(r, u.href); } catch (e) { /* rien */ } if (!j) return { ok: false };
    const before = tot();
    const req = { url: u.href, method: 'GET', headers: r.headers, asked: true, dated: true }; onJson(u.href, j, req); MX.seen.add(u.href); MX.reqs.push(req);
    try { await walkReq(req, 60); } catch (e) { /* rien */ }
    const S = (req.key && MX.sets.get(req.key)) || (r.key && MX.sets.get(r.key));
    return { ok: true, plus: tot() - before, lignes: S ? S.rows.length : 0, key: S ? S.key : '', champs: S ? S.fields.slice(0, 14) : [] };
  };
  MX.collect = collect;
  MX.contratLu = () => (MX.contrat ? { until: MX.contrat.until || 0, monthly: MX.contrat.monthly || 0, ev: String(MX.contrat.ev || MX.contrat.pev || '').slice(0, 140), page: MX.contrat.page || '' } : null);
  /* lit la page où l'on est : relit, tourne les pages, refait les dates, lit les cartes, cherche le contrat */
  MX.run = async function ({ maxPages = 60 } = {}) {
    if (MX.busy) return { n: tot() }; MX.busy = true; state('lit');
    try {
      await settle(900, 8000); await reread(); scanCards();
      for (const r of MX.reqs.slice()) await walkReq(r, maxPages);
      for (const r of MX.reqs.slice()) await walkDates(r);
      try { contractDom(); } catch (e) { /* rien */ }
    } catch (e) { /* rien */ }
    MX.busy = false; state('fini'); return { n: tot() };
  };
}

/** Texte à injecter au début de chaque page (Playwright addInitScript, Puppeteer evaluateOnNewDocument). */
export function scriptRobot({ historiqueJours = 730 } = {}) {
  const h = Math.max(0, Math.min(3650, Math.round(+historiqueJours || 0)));
  // __name : l'empaqueteur de Wrangler (keepNames) peut en insérer dans le texte des fonctions.
  return `(function(){var __name=function(f){return f};window.__stablMxHist=${h};try{(${robotDansLaPage.toString()})();}catch(e){}})();`;
}
