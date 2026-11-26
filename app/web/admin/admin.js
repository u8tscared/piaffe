/* Stabl · espace admin (page autonome servie par le Worker sur /admin, API /admin/api/*) */
(function () {
  'use strict';
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var esc = function (v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var NB = ' ';

  /* ---------- Formats ---------- */
  function eur(c, cents) {
    var v = (c || 0) / 100;
    return v.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: cents || (v % 1) ? 2 : 0, maximumFractionDigits: cents || (v % 1) ? 2 : 0 });
  }
  function num(n) { return (n || 0).toLocaleString('fr-FR'); }
  function day(iso) { return iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'; }
  function dayShort(iso) { return iso ? new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) : '—'; }
  function dt(iso) { return iso ? new Date(iso).toLocaleString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) : '—'; }
  function ago(iso) {
    if (!iso) return 'jamais';
    var s = (Date.now() - Date.parse(iso)) / 1000;
    if (s < 0) return 'dans ' + until(iso);
    if (s < 90) return 'à l’instant';
    if (s < 3600) return 'il y a ' + Math.round(s / 60) + NB + 'min';
    if (s < 86400) return 'il y a ' + Math.round(s / 3600) + NB + 'h';
    var d = Math.round(s / 86400);
    return d < 45 ? 'il y a ' + d + NB + 'j' : day(iso);
  }
  function until(iso) {
    var d = Math.ceil((Date.parse(iso) - Date.now()) / 864e5);
    if (d <= 0) return 'terminé';
    return d === 1 ? '1 jour' : d + ' jours';
  }
  function plural(n, one, many) { return num(n) + NB + (n > 1 ? many : one); }

  /* ---------- Icônes (trait 1,8) ---------- */
  var P = {
    home: '<path d="M4 11.5 12 5l8 6.5V19a1 1 0 0 1-1 1h-4.5v-5h-5v5H5a1 1 0 0 1-1-1z"/>',
    clubs: '<path d="M3 20V9l9-5 9 5v11"/><path d="M9 20v-6h6v6"/><path d="M3 20h18"/>',
    migr: '<path d="M4 7h12l-3-3"/><path d="M20 17H8l3 3"/>',
    support: '<path d="M4 5h16v11H8l-4 4z"/><path d="M8 9h8M8 12h5"/>',
    prosp: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/><path d="M11 8v6M8 11h6"/>',
    settings: '<circle cx="12" cy="12" r="3"/><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M5.6 18.4l1.8-1.8M16.6 7.4l1.8-1.8"/>',
    journal: '<path d="M6 4h10l3 3v13H6z"/><path d="M9 10h7M9 13h7M9 16h4"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    out: '<path d="M14 4h5v16h-5"/><path d="M10 8l-4 4 4 4M6 12h10"/>'
  };
  function ico(n) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + P[n] + '</svg>'; }

  /* ---------- API ---------- */
  function api(path, opt) {
    opt = opt || {};
    var h = { 'x-requested-with': 'piaffe' };
    if (opt.json !== undefined) h['content-type'] = 'application/json';
    return fetch(path, { method: opt.method || (opt.json !== undefined ? 'POST' : 'GET'), headers: h, credentials: 'same-origin', body: opt.json !== undefined ? JSON.stringify(opt.json) : undefined })
      .then(function (r) {
        return r.json().catch(function () { return {}; }).then(function (b) {
          if (!r.ok) { var e = new Error((b.error && b.error.message) || 'Erreur ' + r.status); e.status = r.status; e.code = b.error && b.error.code; throw e; }
          return b;
        });
      });
  }

  /* ---------- Messages, confirmation, tiroir ---------- */
  var toastT;
  function toast(msg, bad) {
    var t = $('#toast'); t.textContent = msg; t.className = 'toast on' + (bad ? ' bad' : '');
    clearTimeout(toastT); toastT = setTimeout(function () { t.className = 'toast' + (bad ? ' bad' : ''); }, 3200);
  }
  function fail(e) { toast(e && e.message ? e.message : 'Une erreur est survenue.', true); }

  /** Fenêtre de confirmation. o = {title, text, ok, danger, input:{type,label,value,min,max,placeholder,required}} → Promise<valeur|true|null> */
  function confirmDlg(o) {
    return new Promise(function (res) {
      var d = $('#dlg');
      var inp = o.input ? '<label class="f" style="margin-top:4px">' + esc(o.input.label) + (o.input.type === 'textarea'
        ? '<textarea id="dlg-in" placeholder="' + esc(o.input.placeholder || '') + '">' + esc(o.input.value || '') + '</textarea>'
        : '<input id="dlg-in" type="' + (o.input.type || 'text') + '" value="' + esc(o.input.value == null ? '' : o.input.value) + '"' + (o.input.min != null ? ' min="' + o.input.min + '"' : '') + (o.input.max != null ? ' max="' + o.input.max + '"' : '') + ' placeholder="' + esc(o.input.placeholder || '') + '">') + '</label>' : '';
      d.innerHTML = '<form method="dialog"><h3>' + esc(o.title) + '</h3><p>' + o.text + '</p>' + inp +
        '<div class="end"><button class="btn" value="no" type="submit">Annuler</button><button class="btn ' + (o.danger ? 'danger' : 'pri') + '" value="ok" id="dlg-ok" type="submit">' + esc(o.ok || 'Confirmer') + '</button></div></form>';
      var input = $('#dlg-in', d);
      var okB = $('#dlg-ok', d);
      if (input && o.input.required) { var chk = function () { okB.disabled = !input.value.trim(); }; input.addEventListener('input', chk); chk(); }
      d.onclose = function () {
        if (d.returnValue !== 'ok') return res(null);
        res(input ? input.value.trim() : true);
      };
      d.returnValue = '';
      d.showModal();
      (input || okB).focus();
    });
  }

  var drawerBack = null;
  function openDrawer(html, back) {
    drawerBack = back || null;
    var dr = $('#drawer');
    dr.innerHTML = html;
    dr.classList.add('on'); $('#scrim').classList.add('on');
    dr.setAttribute('aria-hidden', 'false');
    var x = $('.x', dr); if (x) { x.onclick = closeDrawer; x.focus(); }
  }
  function closeDrawer() {
    var dr = $('#drawer');
    if (!dr.classList.contains('on')) return;
    dr.classList.remove('on'); $('#scrim').classList.remove('on'); dr.setAttribute('aria-hidden', 'true');
    if (drawerBack && location.hash !== drawerBack) history.replaceState(null, '', drawerBack);
    drawerBack = null;
  }
  function drawerHead(title, sub, tag) {
    return '<header><div style="min-width:0"><h2>' + esc(title) + '</h2><p>' + (tag || '') + (sub ? ' ' + sub : '') + '</p></div><button class="x" aria-label="Fermer">' + ico('x') + '</button></header>';
  }

  /* ---------- Coque ---------- */
  var NAV = [
    ['dashboard', 'Tableau de bord', 'home'], ['clubs', 'Clubs', 'clubs'], ['migrations', 'Migrations', 'migr'],
    ['support', 'Support', 'support'], ['prospection', 'Prospection', 'prosp'], ['reglages', 'Réglages', 'settings'], ['journal', 'Journal', 'journal']
  ];
  var state = { supportNew: 0 };
  function renderNav(cur) {
    $('#nav').innerHTML = NAV.map(function (n) {
      var pill = n[0] === 'support' && state.supportNew ? '<span class="pill">' + state.supportNew + '</span>' : '';
      return '<a href="#/' + n[0] + '"' + (n[0] === cur ? ' aria-current="page"' : '') + '>' + ico(n[2]) + '<span>' + n[1] + '</span>' + pill + '</a>';
    }).join('');
  }
  function head(title, sub, tools) {
    return '<div class="head"><div><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' + (tools ? '<div class="tools">' + tools + '</div>' : '') + '</div>';
  }
  function skeleton() { return '<div class="card"><div class="skel" style="width:40%"></div><div class="skel"></div><div class="skel" style="width:70%"></div></div>'; }
  function tag(st) { return '<span class="tag ' + esc(st.tone) + '">' + esc(st.label) + '</span>'; }
  var PLAN = { trial: 'Essai', essentiel: 'Essentiel', club: 'Club', domaine: 'Domaine' };
  var STRIPE = { active: 'Actif', trialing: 'En essai', past_due: 'Paiement en retard', unpaid: 'Impayé', canceled: 'Résilié', incomplete: 'Incomplet', paused: 'En pause' };

  /* ---------- Tableau de bord ---------- */
  function vDashboard() {
    return api('/admin/api/dashboard').then(function (d) {
      state.supportNew = d.support_new; renderNav('dashboard');
      var k = d.clubs, sign = d.signups_30d.reduce(function (a, b) { return a + b; }, 0);
      var max = Math.max.apply(null, d.signups_30d.concat([1]));
      var h = head('Tableau de bord', 'Mis à jour ' + dt(d.at).replace(',', ' à'), '<a class="btn" href="#/dashboard" data-reload>Actualiser</a>');
      h += '<div class="grid kpis fade">' +
        kpi('Clubs inscrits', num(k.total), '+' + num(sign) + ' sur 30' + NB + 'jours', 't-navy') +
        kpi('En essai', num(k.essai), plural(d.trials_ending_count, 'finit', 'finissent') + ' sous 7' + NB + 'jours', 't-tm') +
        kpi('Payants', num(k.payant), k.fondateurs ? 'dont ' + plural(k.fondateurs, 'fondateur', 'fondateurs') : 'aucun fondateur', 't-hz') +
        kpi('Revenu mensuel', eur(d.revenue.mrr_cents), 'soit ' + eur(d.revenue.arr_cents) + ' par an', 't-rd') +
        kpi('Impayés', num(d.unpaid_count), k.suspendu ? plural(k.suspendu, 'club suspendu', 'clubs suspendus') : 'aucun club suspendu', d.unpaid_count ? 't-mo' : '') +
        '</div>';
      h += '<div class="grid cols-3 fade" style="margin-top:14px">' +
        card('Essais qui finissent', '#/clubs?etat=essai', d.trials_ending.length ? '<ul class="rows">' + d.trials_ending.map(function (t) {
          return '<li><a class="nm" href="#/clubs/' + esc(t.id) + '">' + esc(t.name) + '</a><span class="r">' + tag(t.state) + '</span></li>';
        }).join('') + '</ul>' : '<p class="empty">Aucun essai ne finit dans les 7 prochains jours.</p>') +
        card('Impayés', '#/clubs?etat=impaye', d.unpaid.length ? '<ul class="rows">' + d.unpaid.map(function (t) {
          return '<li><a class="nm" href="#/clubs/' + esc(t.id) + '">' + esc(t.name) + '</a><span class="r">depuis le ' + dayShort(t.since) + '</span></li>';
        }).join('') + '</ul>' : '<p class="empty">Aucun impayé. Tout le monde est à jour.</p>') +
        card('Migrations en cours', '#/migrations', '<div class="stat-line"><span class="dot ' + (d.migrations.open ? 'warn' : 'ok') + '"></span>En cours<b>' + num(d.migrations.open) + '</b></div>' +
          '<div class="stat-line"><span class="dot ' + (d.migrations.robots_failed_7d ? 'bad' : 'ok') + '"></span>Robots en échec sur 7' + NB + 'jours<b>' + num(d.migrations.robots_failed_7d) + '</b></div>' +
          (d.migrations.recent.length ? '<ul class="rows" style="margin-top:4px">' + d.migrations.recent.slice(0, 3).map(function (m) {
            return '<li><a class="nm" href="#/migrations/' + esc(m.id) + '">' + esc(m.club_name || m.club_id) + '</a><span class="r">' + esc(soft(m.source)) + ' · ' + ago(m.created_at) + '</span></li>';
          }).join('') + '</ul>' : '')) +
        '</div>';
      var m = d.mail, hl = d.health;
      var quota = m.day_cap ? num(m.today) + ' sur ' + num(m.day_cap) + ' aujourd’hui' : num(m.today) + ' aujourd’hui';
      h += '<div class="grid cols-3 fade" style="margin-top:14px">' +
        card('E-mails envoyés', '', '<div class="kpi"><div class="val" style="font-size:26px">' + quota + '</div></div>' +
          (m.day_cap || m.month_cap ? '<div class="gauge ' + m.level + '"><i style="width:' + m.pct + '%"></i></div>' : '') +
          '<div class="stat-line" style="padding-top:2px">Ce mois-ci<b>' + num(m.month) + (m.month_cap ? ' / ' + num(m.month_cap) : '') + '</b></div>' +
          '<div class="stat-line">En attente<b>' + num(m.queued) + '</b></div>' +
          '<div class="stat-line">Échecs et rebonds sur 7' + NB + 'jours<b>' + num(m.failed_7d + m.bounced_7d) + '</b></div>' +
          '<p class="empty" style="font-size:13px;padding-top:2px">' + esc(m.label) + '</p>') +
        card('Santé du service', '', '<div class="stat-line"><span class="dot ' + hl.level + '"></span><b style="margin-left:0">' + (hl.level === 'ok' ? 'Tout fonctionne' : hl.level === 'warn' ? 'À surveiller' : 'Erreurs récentes') + '</b></div>' +
          '<div class="stat-line">Erreurs serveur sur 24' + NB + 'h<b>' + num(hl.errors_24h) + '</b></div>' +
          '<div class="stat-line">Webhooks Stripe en échec<b>' + num(hl.stripe_failed_7d) + '</b></div>' +
          '<div class="stat-line">E-mails en échec<b>' + num(hl.mail_failed_7d) + '</b></div>' +
          '<div class="stat-line">Factures électroniques en erreur<b>' + num(hl.einvoice_errors) + '</b></div>' +
          (hl.last_errors.length ? '<p class="empty mono" style="font-size:12px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="' + esc(hl.last_errors[0].message || '') + '">' + esc(hl.last_errors[0].method + ' ' + hl.last_errors[0].path + ' · ' + ago(hl.last_errors[0].at)) + '</p>' : '')) +
        card('Inscriptions sur 30 jours', '', '<div class="kpi"><div class="val" style="font-size:26px">' + plural(sign, 'nouveau club', 'nouveaux clubs') + '</div></div><div class="bars" role="img" aria-label="' + sign + ' inscriptions sur 30 jours">' +
          d.signups_30d.map(function (v, i) { return '<i class="' + (v ? 'on' : '') + '" style="height:' + Math.max(4, Math.round((v / max) * 100)) + '%" title="' + v + '"></i>'; }).join('') +
          '</div><div class="legend"><span>il y a 30' + NB + 'jours</span><span>aujourd’hui</span></div>') +
        '</div>';
      return h;
    });
  }
  function kpi(l, v, s, t) { return '<div class="card kpi ' + (t || '') + '"><div class="lbl">' + l + '</div><div class="val">' + v + '</div><div class="sub">' + s + '</div></div>'; }
  function card(t, more, body) { return '<section class="card"><h2>' + esc(t) + (more ? '<a class="more" href="' + more + '">Tout voir</a>' : '') + '</h2>' + body + '</section>'; }

  /* ---------- Clubs ---------- */
  var FILTERS = [['', 'Tous'], ['essai', 'En essai'], ['payant', 'Payants'], ['impaye', 'Impayés'], ['fondateur', 'Fondateurs'], ['suspendu', 'Suspendus'], ['resilie', 'Résiliés']];
  function vClubs(arg, query) {
    var etat = query.etat || '', q = query.q || '';
    return api('/admin/api/clubs?etat=' + encodeURIComponent(etat) + '&q=' + encodeURIComponent(q)).then(function (d) {
      var h = head('Clubs', plural(d.total, 'club', 'clubs') + (etat || q ? ' pour ce filtre' : ' inscrits'));
      h += '<div class="toolbar"><label class="search">' + ico('search') + '<span class="sr">Rechercher</span><input id="q" type="search" placeholder="Nom, ville, e-mail, identifiant" value="' + esc(q) + '"></label><div class="chips">' +
        FILTERS.map(function (f) { return '<button class="chip" data-etat="' + f[0] + '" aria-pressed="' + (f[0] === etat) + '">' + f[1] + '</button>'; }).join('') + '</div></div>';
      h += '<div class="tbl-wrap fade"><table><thead><tr><th>Club</th><th>État</th><th>Offre</th><th class="num">Adhérents</th><th class="num">Chevaux</th><th>Dernière connexion</th><th>Inscrit le</th><th class="num">Mensuel</th></tr></thead><tbody>' +
        (d.clubs.length ? d.clubs.map(function (c) {
          return '<tr class="clk" data-href="#/clubs/' + esc(c.id) + '"><td><b>' + esc(c.name) + '</b><span class="s">' + esc(c.city || c.owner_email || c.slug) + '</span></td><td>' + tag(c.state) + '</td><td>' + esc(PLAN[c.plan] || c.plan) + (c.founder ? ' <span class="tag gold">Fondateur</span>' : '') + '</td><td class="num">' + num(c.members) + '</td><td class="num">' + num(c.horses) + '</td><td>' + ago(c.last_login) + '</td><td>' + day(c.created_at) + '</td><td class="num">' + (c.mrr_cents ? eur(c.mrr_cents) : '—') + '</td></tr>';
        }).join('') : '<tr><td colspan="8" class="empty" style="padding:22px 14px">Aucun club ne correspond.</td></tr>') + '</tbody></table></div>';
      return { html: h, after: function () {
        var inp = $('#q'), t;
        inp.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { go('clubs', null, { etat: etat, q: inp.value.trim() }, true); }, 280); });
        if (q) { inp.focus(); inp.setSelectionRange(q.length, q.length); }
        $$('.chip[data-etat]').forEach(function (b) { b.onclick = function () { go('clubs', null, { etat: b.getAttribute('data-etat'), q: inp.value.trim() }); }; });
        if (arg) openClub(arg, '#/clubs' + qs({ etat: etat, q: q }));
      } };
    });
  }

  function openClub(id, back) {
    openDrawer(drawerHead('Chargement…', '') + '<div class="body">' + skeleton() + '</div>', back);
    api('/admin/api/clubs/' + encodeURIComponent(id)).then(function (d) {
      var c = d.club, b = d.billing || {};
      var trialing = c.plan_status !== 'active';
      var h = drawerHead(c.name, esc((c.city ? c.city + ' · ' : '') + c.id), tag(c.state) + (c.founder ? ' <span class="tag gold">Fondateur</span>' : ''));
      h += '<div class="body">';
      if (c.suspended) h += '<div class="msg" style="border-color:#f3b8ae;background:var(--bad-pale)"><b>Club suspendu.</b> ' + esc(c.suspended_reason || '') + '</div>';
      h += '<div class="facts">' +
        fact('Offre', (PLAN[c.plan] || c.plan) + (c.interval ? (c.interval === 'year' ? ', annuel' : ', mensuel') : '')) +
        fact('Stripe', b.status ? (STRIPE[b.status] || b.status) : 'Pas d’abonnement') +
        fact('Fin d’essai', c.plan_status === 'trialing' || c.plan_status === 'unpaid' ? (c.trial_ends_at ? day(c.trial_ends_at) : '—') : '—') +
        fact('Adhérents', num(c.members)) + fact('Chevaux', num(c.horses)) + fact('Dernière connexion', ago(c.last_login)) +
        '</div>';
      h += '<section class="card"><h2>Actions</h2><div class="actions">' +
        (trialing ? '<button class="btn" data-act="essai">Prolonger l’essai</button>' : '') +
        '<button class="btn" data-act="fondateur">' + (c.founder ? 'Retirer l’offre fondateurs' : 'Offrir l’offre fondateurs') + '</button>' +
        '<button class="btn" data-act="vue"' + (c.suspended ? ' disabled' : '') + '>Voir en tant que gérant</button>' +
        '<button class="btn" data-act="reset">Envoyer un lien de réinitialisation</button>' +
        (c.suspended ? '<button class="btn pri" data-act="reactiver">Réactiver le club</button>' : '<button class="btn danger" data-act="suspendre">Suspendre le club</button>') +
        '</div></section>';
      h += '<section class="card"><h2>Fiche</h2><dl class="kv">' +
        kv('Gérant', c.owner_email) + kv('E-mail du club', c.email) + kv('Téléphone', c.phone) + kv('SIRET', c.siret || c.siren) +
        kv('Inscrit le', day(c.created_at)) + kv('Logiciel précédent', c.software) + kv('Revenu mensuel', c.mrr_cents ? eur(c.mrr_cents) + ' HT' : '—') +
        kv('Factures du club', d.club_invoices.count ? plural(d.club_invoices.count, 'facture émise', 'factures émises') + ', ' + eur(d.club_invoices.ttc_cents) + ' TTC' : 'Aucune facture émise') +
        kv('Client Stripe', b.stripe_customer_id ? '<span class="mono">' + esc(b.stripe_customer_id) + '</span>' : '—', true) +
        kv('Parrainage', b.referral_code ? '<span class="mono">' + esc(b.referral_code) + '</span>' : '—', true) +
        '</dl></section>';
      h += '<section class="card"><h2>Accès <span class="tag mut">' + d.users.length + '</span></h2><ul class="rows">' + d.users.map(function (u) {
        return '<li><span class="nm">' + esc([u.first, u.last].filter(Boolean).join(' ') || u.email) + '<span class="s" style="display:block;font-weight:400;color:var(--mut);font-size:13px">' + esc(u.email) + '</span></span><span class="r">' + esc(ROLE[u.role] || u.role) + (u.status !== 'active' ? ' · <span class="tag bad">suspendu</span>' : '') + ' · ' + ago(u.last_login) + '</span></li>';
      }).join('') + '</ul></section>';
      h += '<section class="card"><h2>Migrations</h2>' + (d.migrations.length ? '<ul class="rows">' + d.migrations.map(function (m) {
        return '<li><a class="nm" href="#/migrations/' + esc(m.id) + '">' + esc(soft(m.source)) + '</a><span class="r">' + jobTag(m.status) + ' · ' + (m.totals ? num(m.totals.created + m.totals.updated) + ' lignes · ' : '') + day(m.created_at) + '</span></li>';
      }).join('') + '</ul>' : '<p class="empty">Aucune migration.</p>') +
        (d.incidents.length ? '<p class="empty" style="color:var(--bad)">' + plural(d.incidents.length, 'incident signalé', 'incidents signalés') + ', dernier : ' + esc(d.incidents[0].message) + '</p>' : '') + '</section>';
      h += '<section class="card"><h2>Factures Stabl</h2>' + (d.invoices.length ? '<ul class="rows">' + d.invoices.map(function (i) {
        return '<li><span class="nm">' + esc(i.number || 'Brouillon') + '</span><span class="r">' + eur(i.total_ttc, true) + ' · ' + esc(INV[i.status] || i.status) + ' · ' + day(i.issue_date) + '</span></li>';
      }).join('') + '</ul>' : '<p class="empty">Aucune facture Stabl pour l’instant.</p>') + (b.last_invoice_url ? '<a class="btn sm" target="_blank" rel="noopener" href="' + esc(b.last_invoice_url) + '">Dernière facture Stripe</a>' : '') + '</section>';
      if (d.journal.length) h += '<section class="card"><h2>Journal admin</h2><ul class="rows">' + d.journal.map(function (j) {
        return '<li><span class="nm">' + esc(ACTION[j.action] || j.action) + '</span><span class="r">' + esc(j.by || '') + ' · ' + dt(j.at) + '</span></li>';
      }).join('') + '</ul></section>';
      h += '</div>';
      openDrawer(h, back);
      $$('[data-act]', $('#drawer')).forEach(function (btn) { btn.onclick = function () { clubAction(btn.getAttribute('data-act'), c, back); }; });
    }).catch(function (e) { closeDrawer(); fail(e); });
  }
  function fact(l, v) { return '<div class="fact"><div class="lbl">' + esc(l) + '</div><div class="val" title="' + esc(v) + '">' + esc(v) + '</div></div>'; }
  function kv(k, v, raw) { return '<dt>' + esc(k) + '</dt><dd>' + (v == null || v === '' ? '—' : raw ? v : esc(v)) + '</dd>'; }
  var ROLE = { owner: 'Gérant titulaire', manager: 'Gérant', staff: 'Employé', coach: 'Coach', member: 'Adhérent', accountant: 'Comptable' };
  var INV = { draft: 'brouillon', issued: 'émise', sent: 'envoyée', partially_paid: 'en partie payée', paid: 'payée', overdue: 'en retard', cancelled: 'annulée' };

  function clubAction(act, c, back) {
    var p, done;
    var nm = '<b>' + esc(c.name) + '</b>';
    if (act === 'essai') {
      p = confirmDlg({ title: 'Prolonger l’essai', text: 'L’essai de ' + nm + ' sera prolongé à partir de sa fin actuelle (ou d’aujourd’hui s’il est fini). Les rappels de fin d’essai repartent de zéro.', ok: 'Prolonger', input: { type: 'number', label: 'Nombre de jours (1 à 90)', value: 14, min: 1, max: 90, required: true } })
        .then(function (v) { return v && api('/admin/api/clubs/' + c.id + '/essai', { json: { days: Number(v), confirm: true } }); });
      done = function (r) { return 'Essai prolongé jusqu’au ' + day(r.trial_ends_at) + '.'; };
    } else if (act === 'fondateur') {
      var on = !c.founder;
      p = confirmDlg({ title: on ? 'Offrir l’offre fondateurs' : 'Retirer l’offre fondateurs', text: on ? nm + ' aura le plan Club au prix fondateur (99' + NB + '€ HT par mois), garanti à vie, à son prochain passage en caisse.' : nm + ' perdra le prix fondateur pour ses prochains abonnements.', ok: on ? 'Offrir' : 'Retirer', danger: !on })
        .then(function (v) { return v && api('/admin/api/clubs/' + c.id + '/fondateur', { json: { founder: on, confirm: true } }); });
      done = function () { return on ? 'Offre fondateurs accordée.' : 'Offre fondateurs retirée.'; };
    } else if (act === 'vue') {
      p = confirmDlg({ title: 'Voir en tant que gérant', text: 'Vous allez ouvrir Stabl comme le gérant de ' + nm + ', en <b>lecture seule</b>, pendant une heure au plus. Un bandeau reste visible et l’accès est inscrit au journal. Votre session admin sera rouverte en quittant la vue.', ok: 'Ouvrir la vue' })
        .then(function (v) { return v && api('/admin/api/clubs/' + c.id + '/vue', { json: { confirm: true } }); });
      done = function (r) { location.href = r.url; return 'Ouverture…'; };
    } else if (act === 'reset') {
      p = confirmDlg({ title: 'Envoyer un lien de réinitialisation', text: 'Le gérant de ' + nm + ' (' + esc(c.owner_email || '') + ') recevra un e-mail pour choisir un nouveau mot de passe. Le lien est valable une heure.', ok: 'Envoyer' })
        .then(function (v) { return v && api('/admin/api/clubs/' + c.id + '/reinitialisation', { json: { confirm: true } }); });
      done = function (r) { return 'Lien envoyé à ' + r.email + '.'; };
    } else if (act === 'suspendre') {
      p = confirmDlg({ title: 'Suspendre le club', text: 'Plus personne ne pourra ouvrir ' + nm + ' (gérants, employés, adhérents), ni ses clés d’API. Les données sont gardées et tout revient à la réactivation.', ok: 'Suspendre', danger: true, input: { type: 'textarea', label: 'Raison (gardée dans le journal)', placeholder: 'Par exemple : impayé depuis 2 mois, demande du gérant…', required: true } })
        .then(function (v) { return v && api('/admin/api/clubs/' + c.id + '/suspendre', { json: { reason: v, confirm: true } }); });
      done = function (r) { return 'Club suspendu (' + plural(r.suspended_users, 'accès', 'accès') + ').'; };
    } else if (act === 'reactiver') {
      p = confirmDlg({ title: 'Réactiver le club', text: 'Les accès suspendus de ' + nm + ' seront rétablis.', ok: 'Réactiver' })
        .then(function (v) { return v && api('/admin/api/clubs/' + c.id + '/reactiver', { json: { confirm: true } }); });
      done = function (r) { return 'Club réactivé (' + plural(r.restored_users, 'accès rétabli', 'accès rétablis') + ').'; };
    }
    p.then(function (r) { if (!r) return; toast(done(r)); if (act !== 'vue') { openClub(c.id, back); refreshBehind(); } }).catch(fail);
  }

  /* ---------- Migrations ---------- */
  var JOB = { open: ['En cours', 'info'], simulated: ['Simulée, à confirmer', 'warn'], committing: ['Import en cours', 'info'], committed: ['Importée', 'ok'], failed: ['En échec', 'bad'], rolled_back: ['Annulée', 'mut'] };
  function jobTag(s) { var j = JOB[s] || [s, 'mut']; return '<span class="tag ' + j[1] + '">' + esc(j[0]) + '</span>'; }
  var migTab = 'sessions';
  function vMigrations(arg) {
    return api('/admin/api/migrations').then(function (d) {
      var failed = d.jobs.filter(function (j) { return j.status === 'failed'; }).length;
      var open = d.jobs.filter(function (j) { return ['open', 'simulated', 'committing'].indexOf(j.status) >= 0; }).length;
      var h = head('Migrations', plural(open, 'migration en cours', 'migrations en cours') + ' · ' + plural(failed, 'en échec', 'en échec') + ' · ' + plural(d.incidents.length, 'incident', 'incidents'));
      var T = [['sessions', 'Sessions', d.jobs.length], ['robot', 'Robot', d.robots.length], ['incidents', 'Incidents', d.incidents.length], ['recettes', 'Recettes par logiciel', d.recipes.length]];
      h += '<div class="tabs" role="tablist">' + T.map(function (t) { return '<button role="tab" data-tab="' + t[0] + '" aria-selected="' + (migTab === t[0]) + '">' + t[1] + ' <span class="tag mut">' + t[2] + '</span></button>'; }).join('') + '</div><div id="migpane" class="fade"></div>';
      return { html: h, after: function () {
        var pane = function () {
          var x = '';
          if (migTab === 'sessions') x = table(['Club', 'Logiciel', 'État', 'Jeux trouvés', 'Lignes trouvées', 'Importées', 'Erreurs', 'Date'], d.jobs.map(function (j) {
            var s = j.summary;
            return { href: '#/migrations/' + j.id, cells: ['<b>' + esc(j.club_name || j.club_id) + '</b>', esc(soft(j.source)), jobTag(j.status), num(s.sets), num(s.found || j.item_count), num(s.imported), s.errors || s.error ? '<span class="tag bad">' + (s.error ? 'échec' : num(s.errors)) + '</span>' : '0', dt(j.created_at)], num: [3, 4, 5, 6] };
          }), 'Aucune migration pour l’instant.');
          else if (migTab === 'robot') x = table(['Club', 'Logiciel', 'Adresse ouverte', 'Ouverte'], d.robots.map(function (r) {
            return { href: r.club_id ? '#/clubs/' + r.club_id : '', cells: ['<b>' + esc(r.club_name || r.club_id) + '</b>', esc(r.logiciel ? soft(r.logiciel) : '—'), '<span class="mono">' + esc(r.origine || '') + '</span>', dt(r.at)] };
          }), 'Aucune session du robot.');
          else if (migTab === 'incidents') x = table(['Club', 'Logiciel', 'Étape', 'Message', 'Capture', 'Date'], d.incidents.map(function (i) {
            return { href: i.club_id ? '#/clubs/' + i.club_id : '', cells: ['<b>' + esc(i.club_name || i.club_id || '—') + '</b>', esc(soft(i.software)), esc(i.step), esc(i.message), i.has_capture ? '<a class="btn sm" target="_blank" rel="noopener" href="/admin/api/incidents/' + esc(i.id) + '/capture">Voir</a>' : '—', dt(i.created_at)] };
          }), 'Aucun incident signalé.');
          else x = '<div class="grid cols-2"><section class="card"><h2>Recettes apprises</h2>' + (d.recipes.length ? '<ul class="rows">' + d.recipes.map(function (r) {
            return '<li><a class="nm" href="#" data-rcp="' + esc(r.software) + '">' + esc(soft(r.software)) + (r.name !== 'defaut' ? ' · ' + esc(r.name) : '') + '</a><span class="r">version ' + r.version + ' · ' + plural(r.clubs, 'club', 'clubs') + ' · ' + day(r.updated_at) + '</span></li>';
          }).join('') + '</ul>' : '<p class="empty">Aucune recette apprise pour l’instant.</p>') + '</section><section class="card"><h2>Par logiciel</h2>' + (d.by_software.length ? '<ul class="rows">' + d.by_software.map(function (s) {
            return '<li><span class="nm">' + esc(soft(s.source)) + '</span><span class="r">' + plural(s.jobs, 'migration', 'migrations') + ' · ' + num(s.committed) + ' importées · ' + num(s.failed) + ' en échec · ' + plural(s.incidents_30d, 'incident', 'incidents') + ' sur 30' + NB + 'j</span></li>';
          }).join('') + '</ul>' : '<p class="empty">Rien pour l’instant.</p>') + '</section></div>';
          $('#migpane').innerHTML = x;
          bindRows($('#migpane'));
          $$('[data-rcp]').forEach(function (a) { a.onclick = function (e) { e.preventDefault(); openRecipe(a.getAttribute('data-rcp')); }; });
        };
        $$('[data-tab]').forEach(function (b) { b.onclick = function () { migTab = b.getAttribute('data-tab'); $$('[data-tab]').forEach(function (x) { x.setAttribute('aria-selected', x === b); }); pane(); }; });
        pane();
        if (arg) openJob(arg, '#/migrations');
      } };
    });
  }
  function openJob(id, back) {
    openDrawer(drawerHead('Chargement…', '') + '<div class="body">' + skeleton() + '</div>', back);
    api('/admin/api/migrations/' + encodeURIComponent(id)).then(function (d) {
      var j = d.job, s = d.summary;
      var h = drawerHead((j.club_name || j.club_id) + ' · ' + soft(j.source), esc(j.id), jobTag(j.status));
      h += '<div class="body"><div class="facts">' + fact('Jeux trouvés', num(s.sets)) + fact('Lignes reçues', num(j.item_count)) + fact('Importées', num(s.imported)) +
        fact('Erreurs', num(s.errors)) + fact('Avertissements', num(s.warnings)) + fact('Commencée', dt(j.created_at)) + '</div>';
      var can = ['failed', 'open', 'simulated'].indexOf(j.status) >= 0 && j.item_count > 0;
      h += '<section class="card"><h2>Actions</h2><div class="actions"><button class="btn pri" id="relance"' + (can ? '' : ' disabled') + '>Relancer la simulation</button><a class="btn" href="#/clubs/' + esc(j.club_id) + '">Ouvrir le club</a></div>' +
        '<p class="empty" style="font-size:13px">La simulation recalcule le rapport sans rien écrire chez le club. Le gérant confirme ensuite l’import depuis son espace.</p></section>';
      if (d.error) h += '<section class="card"><h2>Diagnostic</h2><div class="msg mono">' + esc(d.error) + '</div></section>';
      var counts = Object.keys(d.counts);
      h += '<section class="card"><h2>Par jeu de données</h2>' + (counts.length ? '<ul class="rows">' + counts.map(function (k) {
        var c = d.counts[k]; return '<li><span class="nm">' + esc(COLL[k] || k) + '</span><span class="r">' + num(c.received) + ' reçues · ' + num(c.created) + ' créées · ' + num(c.updated) + ' mises à jour' + (c.errors ? ' · <span class="tag bad">' + plural(c.errors, 'erreur', 'erreurs') + '</span>' : '') + '</span></li>';
      }).join('') + '</ul>' : (Object.keys(d.items).length ? '<ul class="rows">' + Object.keys(d.items).map(function (k) { return '<li><span class="nm">' + esc(COLL[k] || k) + '</span><span class="r">' + num(d.items[k]) + ' lignes reçues</span></li>'; }).join('') + '</ul>' : '<p class="empty">Pas encore de données reçues.</p>')) + '</section>';
      if (d.errors.length || d.warnings.length) h += '<section class="card"><h2>Lignes à corriger</h2><ul class="rows">' + d.errors.concat(d.warnings).slice(0, 30).map(function (e) {
        return '<li><span class="nm" style="white-space:normal">' + esc(e.message) + '</span><span class="r mono">' + esc((COLL[e.coll] || e.coll) + ' ' + e.external_id) + '</span></li>';
      }).join('') + '</ul></section>';
      if (d.incidents.length) h += '<section class="card"><h2>Incidents du robot</h2><ul class="rows">' + d.incidents.map(function (i) {
        return '<li><span class="nm" style="white-space:normal">' + esc(i.step + ' : ' + i.message) + '</span><span class="r">' + (i.has_capture ? '<a target="_blank" rel="noopener" href="/admin/api/incidents/' + esc(i.id) + '/capture">capture</a> · ' : '') + dt(i.created_at) + '</span></li>';
      }).join('') + '</ul></section>';
      h += '</div>';
      openDrawer(h, back);
      var r = $('#relance');
      if (r) r.onclick = function () {
        confirmDlg({ title: 'Relancer la simulation', text: 'Le rapport de cette migration sera recalculé (rien n’est écrit chez le club). Elle passera à l’état « simulée, à confirmer ».', ok: 'Relancer' })
          .then(function (v) { return v && api('/admin/api/migrations/' + j.id + '/relancer', { json: { confirm: true } }); })
          .then(function (x) { if (!x) return; toast('Simulation relancée : ' + plural(x.summary.found, 'ligne', 'lignes') + ', ' + plural(x.summary.errors, 'erreur', 'erreurs') + '.'); openJob(j.id, back); refreshBehind(); })
          .catch(fail);
      };
    }).catch(function (e) { closeDrawer(); fail(e); });
  }
  function openRecipe(sw) {
    openDrawer(drawerHead(soft(sw), 'Recettes apprises') + '<div class="body">' + skeleton() + '</div>');
    api('/admin/api/recettes/' + encodeURIComponent(sw)).then(function (d) {
      openDrawer(drawerHead(soft(sw), plural(d.versions.length, 'version', 'versions')) + '<div class="body">' + d.versions.map(function (v) {
        return '<section class="card"><h2>' + esc(v.name) + ' <span class="tag mut">v' + v.version + '</span><span class="more" style="color:var(--mut)">' + day(v.created_at) + '</span></h2>' + (v.notes ? '<p>' + esc(v.notes) + '</p>' : '') + '<pre class="msg mono" style="max-height:260px;overflow:auto;margin:0">' + esc(JSON.stringify(v.recipe, null, 2)) + '</pre></section>';
      }).join('') + '</div>');
    }).catch(fail);
  }
  var SOFT = { csv: 'Fichier CSV', kavalog: 'Kavalog', equimondo: 'Equimondo', ffe: 'FFE' };
  function soft(s) { s = String(s || ''); return SOFT[s] || s.charAt(0).toUpperCase() + s.slice(1); }
  var COLL = { members: 'Adhérents', horses: 'Chevaux', staff: 'Équipe', coaches: 'Coachs', forfaits: 'Forfaits', lessons: 'Reprises', halfboard: 'Demi-pensions', care: 'Soins', contracts: 'Contrats', competitions: 'Concours', invoices: 'Factures', payments: 'Paiements', stock: 'Stock' };

  /* ---------- Support ---------- */
  var SUP = { nouveau: ['Nouveau', 'bad'], en_cours: ['En cours', 'warn'], traite: ['Traité', 'ok'] };
  function supTag(s) { var x = SUP[s] || [s, 'mut']; return '<span class="tag ' + x[1] + '">' + x[0] + '</span>'; }
  function vSupport(arg, query) {
    var etat = query.etat || '';
    return api('/admin/api/support?etat=' + encodeURIComponent(etat)).then(function (d) {
      state.supportNew = d.counts.nouveau || 0; renderNav('support');
      var all = (d.counts.nouveau || 0) + (d.counts.en_cours || 0) + (d.counts.traite || 0);
      var h = head('Support', 'Messages du formulaire de contact du site et de l’appli. Répondez depuis votre messagerie.');
      h += '<div class="toolbar"><div class="chips">' + [['', 'Tous', all], ['nouveau', 'Nouveaux', d.counts.nouveau], ['en_cours', 'En cours', d.counts.en_cours], ['traite', 'Traités', d.counts.traite]].map(function (f) {
        return '<button class="chip" data-etat="' + f[0] + '" aria-pressed="' + (f[0] === etat) + '">' + f[1] + '<b>' + num(f[2] || 0) + '</b></button>';
      }).join('') + '</div></div>';
      h += table(['De', 'Club', 'Message', 'Source', 'Reçu', 'Statut'], d.messages.map(function (m) {
        return { href: '#/support/' + m.id, cells: ['<b>' + esc(m.name || m.email) + '</b><span class="s">' + esc(m.email) + '</span>', esc(m.club_name || '—'), '<b>' + esc(m.subject || 'Sans objet') + '</b><span class="s" style="max-width:420px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + esc(m.message) + '</span>', m.source === 'app' ? 'Appli' : 'Site', ago(m.created_at), supTag(m.status)] };
      }), etat ? 'Aucun message dans cette catégorie.' : 'Aucun message pour l’instant. Le formulaire de contact envoie ses messages ici.');
      return { html: h, after: function () {
        $$('.chip[data-etat]').forEach(function (b) { b.onclick = function () { go('support', null, { etat: b.getAttribute('data-etat') }); }; });
        bindRows(document);
        if (arg) { var m = d.messages.filter(function (x) { return x.id === arg; })[0]; if (m) openMessage(m, '#/support' + qs({ etat: etat })); }
      } };
    });
  }
  function openMessage(m, back) {
    var subj = 'Re: ' + (m.subject || 'Votre message à Stabl');
    var h = drawerHead(m.subject || 'Sans objet', esc((m.name ? m.name + ' · ' : '') + m.email + ' · ' + dt(m.created_at)), supTag(m.status));
    h += '<div class="body"><div class="msg">' + esc(m.message) + '</div>' +
      '<dl class="kv">' + kv('Club', m.club_name) + kv('Téléphone', m.phone) + kv('Source', m.source === 'app' ? 'Appli (compte connecté)' : 'Site stablapp.fr') + '</dl>' +
      '<div class="actions"><a class="btn pri" href="mailto:' + esc(m.email) + '?subject=' + encodeURIComponent(subj) + '">Répondre par e-mail</a>' +
      (m.status !== 'en_cours' ? '<button class="btn" data-st="en_cours">Marquer en cours</button>' : '') + (m.status !== 'traite' ? '<button class="btn" data-st="traite">Marquer traité</button>' : '') + (m.status !== 'nouveau' ? '<button class="btn" data-st="nouveau">Remettre en nouveau</button>' : '') +
      (m.club_id ? '<a class="btn" href="#/clubs/' + esc(m.club_id) + '">Ouvrir le club</a>' : '') + '</div>' +
      '<label class="f">Note interne<textarea id="note" placeholder="Ce qui a été fait, à qui c’est confié…">' + esc(m.note || '') + '</textarea></label><div><button class="btn" id="savenote">Enregistrer la note</button></div></div>';
    openDrawer(h, back);
    var save = function (body, msg) { api('/admin/api/support/' + m.id, { method: 'PATCH', json: body }).then(function () { toast(msg); closeDrawer(); refreshBehind(); }).catch(fail); };
    $$('[data-st]', $('#drawer')).forEach(function (b) { b.onclick = function () { save({ status: b.getAttribute('data-st') }, 'Statut mis à jour.'); }; });
    $('#savenote').onclick = function () { save({ note: $('#note').value }, 'Note enregistrée.'); };
  }

  /* ---------- Prospection ---------- */
  var PST = [['a_contacter', 'À contacter', 'info'], ['contacte', 'Contacté', 'warn'], ['demo', 'Démo', 'gold'], ['client', 'Client', 'ok'], ['perdu', 'Pas intéressé', 'mut']];
  function pName(s) { var x = PST.filter(function (p) { return p[0] === s; })[0]; return x ? x[1] : s; }
  function vProspection(arg, query) {
    var st = query.statut || '', q = query.q || '';
    return api('/admin/api/prospects?statut=' + encodeURIComponent(st) + '&q=' + encodeURIComponent(q)).then(function (d) {
      var total = PST.reduce(function (a, p) { return a + (d.counts[p[0]] || 0); }, 0);
      var h = head('Prospection', 'Centres équestres à démarcher. Rien ne part tout seul : vous écrivez depuis votre messagerie.', '<button class="btn" id="imp">Importer un CSV</button><button class="btn pri" id="add">Ajouter un centre</button>');
      h += '<div class="toolbar"><label class="search">' + ico('search') + '<span class="sr">Rechercher</span><input id="q" type="search" placeholder="Nom, ville, e-mail" value="' + esc(q) + '"></label><div class="chips">' +
        [['', 'Tous', total]].concat(PST.map(function (p) { return [p[0], p[1], d.counts[p[0]] || 0]; })).map(function (f) {
          return '<button class="chip" data-st="' + f[0] + '" aria-pressed="' + (f[0] === st) + '">' + f[1] + '<b>' + num(f[2]) + '</b></button>';
        }).join('') + '</div></div>';
      h += table(['Centre', 'E-mail', 'Source', 'Statut', 'Dernier contact', 'Notes'], d.prospects.map(function (p) {
        return { href: '#/prospection/' + p.id, cells: ['<b>' + esc(p.name) + '</b><span class="s">' + esc(p.city || '') + '</span>', p.email ? '<span style="white-space:nowrap">' + esc(p.email) + '</span>' : '—', esc(p.source || '—'),
          '<select data-pst="' + esc(p.id) + '" aria-label="Statut de ' + esc(p.name) + '" style="width:auto;padding:5px 10px;font-size:14px">' + PST.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === p.status ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select>',
          p.last_contact_at ? ago(p.last_contact_at) : '—', '<span class="s" style="max-width:280px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--ink-2)">' + esc(p.notes || '') + '</span>'] };
      }), total ? 'Aucun centre ne correspond.' : 'Aucun prospect. Importez un fichier CSV (colonnes nom, ville, e-mail, source) ou ajoutez un centre.');
      return { html: h, after: function () {
        var inp = $('#q'), t;
        inp.addEventListener('input', function () { clearTimeout(t); t = setTimeout(function () { go('prospection', null, { statut: st, q: inp.value.trim() }, true); }, 280); });
        if (q) { inp.focus(); inp.setSelectionRange(q.length, q.length); }
        $$('.chip[data-st]').forEach(function (b) { b.onclick = function () { go('prospection', null, { statut: b.getAttribute('data-st'), q: inp.value.trim() }); }; });
        $$('select[data-pst]').forEach(function (s) {
          s.onclick = function (e) { e.stopPropagation(); };
          s.onchange = function () { api('/admin/api/prospects/' + s.getAttribute('data-pst'), { method: 'PATCH', json: { status: s.value } }).then(function () { toast('Statut : ' + pName(s.value) + '.'); refreshBehind(); }).catch(fail); };
        });
        bindRows(document);
        $('#add').onclick = function () { prospectForm(null); };
        $('#imp').onclick = importForm;
        var back = '#/prospection' + qs({ statut: st, q: q });
        if (arg) { var p = d.prospects.filter(function (x) { return x.id === arg; })[0]; if (p) prospectForm(p, back); }
      } };
    });
  }
  function prospectForm(p, back) {
    var v = p || {};
    var h = drawerHead(p ? p.name : 'Nouveau centre', p ? esc(p.city || '') : 'Une adresse e-mail professionnelle, avec son origine.', p ? '<span class="tag">' + esc(pName(p.status)) + '</span>' : '');
    h += '<div class="body"><form id="pf" class="grid" style="gap:10px">' +
      '<label class="f">Nom du centre<input type="text" name="name" required value="' + esc(v.name || '') + '"></label>' +
      '<div class="form-row"><label class="f">Ville<input type="text" name="city" value="' + esc(v.city || '') + '"></label><label class="f">Téléphone<input type="text" name="phone" value="' + esc(v.phone || '') + '"></label></div>' +
      '<div class="form-row"><label class="f">E-mail professionnel<input type="email" name="email" value="' + esc(v.email || '') + '"></label><label class="f">Origine de l’adresse<input type="text" name="source" placeholder="Annuaire FFE, salon, site du centre…" value="' + esc(v.source || '') + '"></label></div>' +
      (p ? '<label class="f">Statut<select name="status">' + PST.map(function (x) { return '<option value="' + x[0] + '"' + (x[0] === p.status ? ' selected' : '') + '>' + x[1] + '</option>'; }).join('') + '</select></label>' : '') +
      '<label class="f">Notes<textarea name="notes" placeholder="Qui appeler, ce qui a été dit, prochaine étape…">' + esc(v.notes || '') + '</textarea></label>' +
      '<div class="actions"><button class="btn pri" type="submit">' + (p ? 'Enregistrer' : 'Ajouter') + '</button>' +
      (p && p.email ? '<a class="btn" href="mailto:' + esc(p.email) + '">Écrire</a>' : '') +
      (p ? '<button class="btn danger" type="button" id="pdel">Supprimer</button>' : '') + '</div></form></div>';
    openDrawer(h, back);
    $('#pf').onsubmit = function (e) {
      e.preventDefault();
      var f = new FormData(e.target), b = {};
      f.forEach(function (val, key) { b[key] = String(val); });
      (p ? api('/admin/api/prospects/' + p.id, { method: 'PATCH', json: b }) : api('/admin/api/prospects', { json: b }))
        .then(function () { toast(p ? 'Centre enregistré.' : 'Centre ajouté.'); closeDrawer(); refreshBehind(); }).catch(fail);
    };
    var del = $('#pdel');
    if (del) del.onclick = function () {
      confirmDlg({ title: 'Supprimer ce centre', text: '<b>' + esc(p.name) + '</b> et ses notes seront effacés de la liste de prospection.', ok: 'Supprimer', danger: true })
        .then(function (x) { return x && api('/admin/api/prospects/' + p.id, { method: 'DELETE', json: { confirm: true } }); })
        .then(function (r) { if (r) { toast('Centre supprimé.'); closeDrawer(); refreshBehind(); } }).catch(fail);
    };
  }
  function importForm() {
    var h = drawerHead('Importer des centres', 'Fichier CSV avec une ligne d’en-tête : nom, ville, e-mail, source (téléphone et notes en option).');
    h += '<div class="body"><label class="f">Fichier CSV<input type="file" id="csvf" accept=".csv,text/csv,text/plain"></label>' +
      '<label class="f">ou collez le contenu<textarea id="csvt" style="min-height:140px" placeholder="nom;ville;email;source&#10;Écurie des Saules;Lyon;contact@ecurie-des-saules.exemple;Annuaire FFE"></textarea></label>' +
      '<label class="f">Origine des adresses (si le fichier n’a pas de colonne « source »)<input type="text" id="csvs" placeholder="Annuaire FFE 2026"></label>' +
      '<div class="actions"><button class="btn pri" id="csvgo">Vérifier le fichier</button></div><div id="csvres"></div></div>';
    openDrawer(h);
    $('#csvf').onchange = function (e) { var f = e.target.files[0]; if (!f) return; f.text().then(function (t) { $('#csvt').value = t; }); };
    $('#csvgo').onclick = function () {
      var csv = $('#csvt').value, src = $('#csvs').value;
      if (!csv.trim()) return toast('Choisissez ou collez un fichier CSV.', true);
      api('/admin/api/prospects/import', { json: { csv: csv, source: src } }).then(function (r) {
        var cols = Object.keys(r.columns).map(function (k) { return esc(r.columns[k]); }).join(', ');
        $('#csvres').innerHTML = '<section class="card"><h2>' + plural(r.rows, 'centre prêt', 'centres prêts') + ' à importer</h2><p class="empty">Colonnes reconnues : ' + (cols || 'aucune') + '.' + (r.rejected.length ? ' ' + plural(r.rejected.length, 'ligne refusée', 'lignes refusées') + '.' : '') + (r.missing_source ? ' <b style="color:var(--bad)">' + r.missing_source + ' adresse(s) sans origine : indiquez-la ci-dessus.</b>' : '') + '</p>' +
          (r.sample.length ? '<ul class="rows">' + r.sample.map(function (s) { return '<li><span class="nm">' + esc(s.name) + '</span><span class="r">' + esc([s.city, s.email].filter(Boolean).join(' · ')) + '</span></li>'; }).join('') + '</ul>' : '') +
          (r.rejected.length ? '<ul class="rows">' + r.rejected.slice(0, 5).map(function (x) { return '<li><span class="nm">Ligne ' + x.line + '</span><span class="r">' + esc(x.reason) + '</span></li>'; }).join('') + '</ul>' : '') +
          (r.rows ? '<div class="actions" style="margin-top:10px"><button class="btn pri" id="csvok"' + (r.missing_source ? ' disabled' : '') + '>Importer ' + plural(r.rows, 'centre', 'centres') + '</button></div>' : '') + '</section>';
        var ok = $('#csvok');
        if (ok) ok.onclick = function () {
          confirmDlg({ title: 'Importer les centres', text: plural(r.rows, 'centre sera ajouté', 'centres seront ajoutés') + ' à la liste (les doublons sont ignorés). Aucun e-mail n’est envoyé.', ok: 'Importer' })
            .then(function (x) { return x && api('/admin/api/prospects/import', { json: { csv: csv, source: src, confirm: true } }); })
            .then(function (x) { if (!x) return; toast(plural(x.created, 'centre ajouté', 'centres ajoutés') + (x.skipped ? ', ' + plural(x.skipped, 'doublon ignoré', 'doublons ignorés') : '') + '.'); closeDrawer(); refreshBehind(); })
            .catch(fail);
        };
      }).catch(fail);
    };
  }

  /* ---------- Réglages ---------- */
  var IST = { ok: ['Configuré', 'ok'], test: ['Mode test', 'warn'], missing: ['À configurer', 'bad'] };
  function vReglages() {
    return api('/admin/api/reglages').then(function (d) {
      var h = head('Réglages', 'Lecture seule. Les prix se changent dans app/api/src/billing/plans.ts, les secrets avec wrangler secret put.');
      h += '<div class="grid cols-3 fade">' + d.plans.map(function (p) {
        return '<section class="card plan"><h2>' + esc(p.name) + '</h2><div class="price">' + eur(p.month_cents) + ' <small>HT par mois</small></div><div class="empty">' + eur(p.year_cents) + ' HT par an · ' + esc(p.tagline) + ' · ' + (p.limits.horses ? p.limits.horses + ' chevaux' : 'chevaux illimités') + '</div></section>';
      }).join('') + '</div>';
      h += '<div class="grid cols-3 fade" style="margin-top:14px">' +
        '<section class="card span-2"><h2>Intégrations</h2><div class="integs">' + d.integrations.map(function (i) {
          var s = IST[i.status];
          return '<div class="integ"><div><div class="who">' + esc(i.name) + '</div><div class="det">' + esc(i.detail) + '</div><div class="chk">' + i.checks.map(function (c) { return '<span class="tag ' + (c.ok ? 'ok' : 'mut') + '">' + (c.ok ? '✓ ' : '') + esc(c.label) + '</span>'; }).join('') + '</div></div><span class="r tag ' + s[1] + '">' + s[0] + '</span></div>';
        }).join('') + '</div></section>' +
        card('Offres et codes', '', '<div class="stat-line"><span class="tag gold">Fondateurs</span>' + eur(d.founder.month_cents) + ' HT par mois, à vie<b>' + d.founder.used + ' / ' + d.founder.max_clubs + '</b></div>' +
          d.coupons.map(function (c) { return '<div class="stat-line"><span>' + esc(c.name) + '<span class="mono" style="display:block;color:var(--mut)">' + esc(c.id) + '</span></span><b style="white-space:nowrap">' + (c.percent_off ? '−' + c.percent_off + NB + '%' + (c.duration_in_months ? ' pendant ' + c.duration_in_months + NB + 'mois' : '') : '−' + eur(c.amount_off)) + '</b></div>'; }).join('') +
          '<div class="stat-line">Parrain : crédit offert<b>' + eur(d.referral.referrer_credit_cents) + '</b></div>' +
          '<div class="stat-line">Essai<b>' + d.rules.trial_days + NB + 'jours</b></div>' +
          '<div class="stat-line">Rappels avant la fin de l’essai<b>J−' + d.rules.trial_reminders.join(', J−') + '</b></div>' +
          '<div class="stat-line">Délai de grâce avant blocage<b>' + d.rules.write_grace_days + NB + 'jours</b></div>' +
          '<div class="stat-line">Commission sur les paiements des clubs<b>' + d.rules.application_fee_percent + NB + '%</b></div>') +
        '</div>';
      var pf = d.platform;
      h += '<section class="card fade" style="margin-top:14px"><h2>Plateforme</h2><div class="grid cols-2" style="gap:0 28px"><dl class="kv">' +
        kv('Adresse de l\u2019appli', pf.APP_URL) + kv('Expéditeur des e-mails', pf.MAIL_FROM) + kv('Fournisseur d\u2019e-mails', pf.MAIL_PROVIDER) + kv('Facture électronique', pf.EINVOICE_PROVIDER) + kv('Admins', plural(d.admins.count, 'adresse', 'adresses') + ' dans ADMIN_EMAILS') +
        '</dl><dl class="kv">' + kv('Vendeur', pf.PLATFORM_LEGAL_NAME) + kv('Nom commercial', pf.PLATFORM_TRADE_NAME) + kv('SIRET', pf.PLATFORM_SIRET) + kv('Adresse', pf.PLATFORM_ADDRESS) + kv('Régime de TVA', pf.PLATFORM_VAT_REGIME === 'franchise' ? 'Franchise en base (art. 293 B du CGI)' : pf.PLATFORM_VAT_REGIME) +
        '</dl></div></section>';
      return h;
    });
  }

  /* ---------- Journal ---------- */
  var ACTION = {
    'admin.club.trial_extend': 'Essai prolongé', 'admin.club.founder_grant': 'Offre fondateurs accordée', 'admin.club.founder_remove': 'Offre fondateurs retirée',
    'admin.club.password_reset_link': 'Lien de réinitialisation envoyé', 'admin.club.suspend': 'Club suspendu', 'admin.club.reactivate': 'Club réactivé',
    'admin.club.view_start': 'Vue « en tant que » ouverte', 'admin.club.view_end': 'Vue « en tant que » fermée', 'admin.migration.resimulate': 'Simulation relancée',
    'admin.support.update': 'Message de support traité', 'admin.prospect.create': 'Prospect ajouté', 'admin.prospect.import': 'Prospects importés',
    'admin.prospect.update': 'Prospect modifié', 'admin.prospect.delete': 'Prospect supprimé'
  };
  function detail(e) {
    var d = e.data || {};
    if (e.action === 'admin.club.trial_extend') return '+' + d.days + NB + 'jours, jusqu’au ' + day(d.to);
    if (e.action === 'admin.club.suspend') return d.reason || '';
    if (e.action === 'admin.club.view_start') return 'comme ' + (d.as || '');
    if (e.action === 'admin.club.password_reset_link') return d.email || '';
    if (e.action === 'admin.prospect.import') return d.created + ' ajoutés, ' + d.skipped + ' doublons';
    if (e.action === 'admin.prospect.create' || e.action === 'admin.prospect.delete') return d.name || '';
    if (e.action === 'admin.support.update') return d.status && SUP[d.status] ? SUP[d.status][0] : '';
    if (e.action === 'admin.prospect.update') return d.status ? pName(d.status) : '';
    return '';
  }
  function vJournal() {
    return api('/admin/api/journal').then(function (d) {
      return head('Journal', 'Chaque action faite dans l’espace admin, la plus récente en haut.') +
        table(['Date', 'Admin', 'Action', 'Club', 'Détail'], d.entries.map(function (e) {
          return { href: e.club_id ? '#/clubs/' + e.club_id : '', cells: [dt(e.at), esc(e.by || '—'), '<b>' + esc(ACTION[e.action] || e.action) + '</b>', esc(e.club_name || '—'), esc(detail(e))] };
        }), 'Aucune action pour l’instant.');
    });
  }

  /* ---------- Tableaux génériques ---------- */
  function table(cols, rows, empty) {
    var numCols = rows[0] && rows[0].num || [];
    return '<div class="tbl-wrap fade"><table><thead><tr>' + cols.map(function (c, i) { return '<th' + (numCols.indexOf(i) >= 0 ? ' class="num"' : '') + '>' + esc(c) + '</th>'; }).join('') + '</tr></thead><tbody>' +
      (rows.length ? rows.map(function (r) {
        return '<tr' + (r.href ? ' class="clk" data-href="' + esc(r.href) + '"' : '') + '>' + r.cells.map(function (c, i) { return '<td' + ((r.num || []).indexOf(i) >= 0 ? ' class="num"' : '') + '>' + c + '</td>'; }).join('') + '</tr>';
      }).join('') : '<tr><td colspan="' + cols.length + '" class="empty" style="padding:22px 14px">' + esc(empty) + '</td></tr>') + '</tbody></table></div>';
  }
  function bindRows(root) {
    $$('tr.clk', root).forEach(function (tr) {
      tr.onclick = function (e) { if (e.target.closest('a,button,select,input')) return; location.hash = tr.getAttribute('data-href'); };
    });
  }

  /* ---------- Routeur ---------- */
  var VIEWS = { dashboard: vDashboard, clubs: vClubs, migrations: vMigrations, support: vSupport, prospection: vProspection, reglages: vReglages, journal: vJournal };
  function qs(o) { var p = Object.keys(o).filter(function (k) { return o[k]; }).map(function (k) { return encodeURIComponent(k) + '=' + encodeURIComponent(o[k]); }); return p.length ? '?' + p.join('&') : ''; }
  function parse() {
    var h = (location.hash || '#/dashboard').slice(2), qi = h.indexOf('?'), query = {};
    if (qi >= 0) { h.slice(qi + 1).split('&').forEach(function (kv) { var p = kv.split('='); if (p[0]) query[decodeURIComponent(p[0])] = decodeURIComponent(p[1] || ''); }); h = h.slice(0, qi); }
    var parts = h.split('/');
    return { view: VIEWS[parts[0]] ? parts[0] : 'dashboard', arg: parts[1] ? decodeURIComponent(parts[1]) : null, query: query };
  }
  function go(view, arg, query, replace) {
    var h = '#/' + view + (arg ? '/' + encodeURIComponent(arg) : '') + qs(query || {});
    if (replace) { history.replaceState(null, '', h); render(); } else location.hash = h;
  }
  var last = { key: null }, seq = 0;
  function render() {
    var r = parse(), main = $('#main');
    var key = r.view + '?' + JSON.stringify(r.query);
    // Même liste, seule la fiche change : on garde la liste et on ouvre ou ferme le tiroir.
    if (last.key === key) {
      if (!r.arg) return closeDrawer();
      if (r.view === 'clubs') return openClub(r.arg, '#/clubs' + qs(r.query));
      if (r.view === 'migrations') return openJob(r.arg, '#/migrations');
    }
    if (!r.arg) closeDrawer();
    renderNav(r.view);
    if (last.key === null || last.key.split('?')[0] !== r.view) main.innerHTML = skeleton();
    last = { key: key };
    var my = ++seq;
    document.title = (NAV.filter(function (n) { return n[0] === r.view; })[0] || NAV[0])[1] + ' · Stabl admin';
    VIEWS[r.view](r.arg, r.query).then(function (out) {
      if (my !== seq) return;
      paint(out);
    }).catch(function (e) {
      if (my !== seq) return;
      main.innerHTML = head('Oups', '') + '<div class="card"><p>' + esc(e.message) + '</p><button class="btn" id="rl">Recharger</button></div>';
      $('#rl').onclick = function () { location.reload(); };
    });
  }
  function paint(out) {
    var o = typeof out === 'string' ? { html: out } : out, main = $('#main');
    main.innerHTML = o.html;
    bindRows(main);
    $$('[data-reload]', main).forEach(function (a) { a.onclick = function (e) { e.preventDefault(); refreshBehind(); }; });
    if (o.after) o.after();
  }
  /** Recharge la vue derrière le tiroir sans le fermer. */
  function refreshBehind() {
    var r = parse(), my = ++seq;
    VIEWS[r.view](null, r.query).then(function (out) { if (my === seq) paint(out); }).catch(fail);
  }

  /* ---------- Démarrage ---------- */
  window.addEventListener('hashchange', render);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !$('#dlg').open) closeDrawer(); });
  $('#scrim').onclick = closeDrawer;
  api('/admin/api/me').then(function (me) {
    $('#me').innerHTML = '<b>' + esc([me.first, me.last].filter(Boolean).join(' ') || me.email) + '</b><span>' + esc(me.email) + '</span>';
  }).catch(function () {});
  render();
})();
