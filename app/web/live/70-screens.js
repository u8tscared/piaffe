/* =====================================================================
   PIAFFE LIVE · Écrans branchés sur l'API (préfixe .lv-)
   Abonnement, Paiements en ligne, Accès et invitations, Comptable, Calendriers,
   Clés d'API, Factures, Import ; côté adhérent : Mes factures (bouton Payer) ;
   espace comptable.
   ===================================================================== */
(function(){
var P=window.P,D=window.DATA,PL=window.PL,F=P.fmt,esc=F.esc,U=P.ui;
var eur=function(c){return F.eur((+c||0)/100,(+c||0)%100!==0)};
function ph(t,s,a){return U.ph(t,s,a)}
function skel(){return '<div class="lv-grid">'+[0,1,2].map(function(){return '<div class="card pad" style="min-height:140px;opacity:.5"><div class="lv-dots"><i></i><i></i><i></i></div></div>'}).join('')+'</div>'}
function errCard(e,retry){var soon=e&&e.unavailable;return '<div class="lv-empty"><div class="lv-empty-illu">'+ICON(soon?'hourglass':'alert')+'</div><h2>'+(soon?'Bientôt disponible':'Chargement impossible')+'</h2><p>'+esc(soon?'Cette partie arrive très prochainement sur votre espace. Vos données sont en sécurité.':PL.msg(e))+'</p>'+(retry?'<button class="btn pri" data-lv-retry>'+ICON('refresh','sm')+'Réessayer</button>':'')+'</div>'}
/* écran asynchrone : en-tête, squelette, puis contenu ou erreur claire */
function screen(el,head,load,draw){el.innerHTML=head+'<div class="lv-body">'+skel()+'</div>';var body=el.querySelector('.lv-body');
  function run(){body.innerHTML=skel();load().then(function(d){if(!body.isConnected)return;body.innerHTML='';draw(body,d);P.animate(body)},function(e){if(!body.isConnected)return;body.innerHTML=errCard(e,true);var r=body.querySelector('[data-lv-retry]');if(r)r.onclick=run})}
  run();return run}
function opt(p){return p.then(function(x){return x},function(e){return {__err:e}})}
function copy(t,msg){try{navigator.clipboard.writeText(t)}catch(e){}P.toast(msg||'Copié',{icon:'copy'})}
function q(name){return new URLSearchParams(location.search).get(name)}
function cleanQuery(){try{history.replaceState(null,'',location.pathname.replace(/^\/(abonnement|paiements-en-ligne|mes-factures)$/,'/')+location.hash)}catch(e){}}
function btnBusy(b,on){if(!b)return;b.disabled=on;b.classList.toggle('busy',on)}
var ROLEFR={owner:'Gérant titulaire',manager:'Gérant',staff:'Équipe',coach:'Coach',member:'Adhérent',accountant:'Comptable'};

/* ---------- Abonnement ---------- */
function renderAbo(el){var interval=P.prefs.get('lv:interval','year');
  var run=screen(el,ph('Abonnement '+esc(PL.brandName()),'Votre offre, votre essai et vos factures d’abonnement.'),function(){return Promise.all([PL.get('/api/billing/plans'),opt(PL.get('/api/billing/subscription'))])},function(b,d){
    var plans=d[0],sub=d[1].__err?null:d[1];
    if(q('checkout')==='success'){P.toast('Merci, votre abonnement est en place.');PL.post('/api/billing/sync',{}).catch(function(){});cleanQuery()}else if(q('checkout')==='cancel'){P.toast('Paiement annulé : rien n’a été débité.',{icon:'info'});cleanQuery()}
    var left=sub&&sub.trial_ends_at?Math.max(0,Math.ceil((Date.parse(sub.trial_ends_at)-Date.now())/864e5)):null,owner=sub?sub.can_manage:PL.role==='owner';
    var st=sub?(sub.plan_status==='trialing'?U.chip('Essai · '+left+' jour'+(left>1?'s':'')+' restant'+(left>1?'s':''),'acc',true):sub.plan_status==='active'?U.chip('Actif','ok',true):sub.plan_status==='past_due'||sub.plan_status==='unpaid'?U.chip('Paiement en retard','bad',true):U.chip(sub.plan_status,'warn',true)):'';
    var h='<div class="card pad tint d-mo" style="margin-bottom:18px"><div class="hrow wrap sp"><div><div class="eyebrow">Offre actuelle</div><div class="big" style="margin:8px 0 6px">'+esc(sub?sub.plan_name:'Essai')+'</div>'+st+'</div>'+
      '<div class="hrow wrap">'+(owner&&sub&&sub.has_customer?'<button class="btn" data-portal>'+ICON('ext','sm')+'Factures et moyen de paiement</button>':'')+'</div></div>'+
      (sub&&sub.plan_status==='trialing'?'<p class="lv-note" style="margin-top:12px">Votre essai complet se termine le '+F.dateL(sub.trial_ends_at.slice(0,10))+'. Choisissez une offre avant cette date pour ne rien interrompre ; le paiement ne commence qu’à la fin de l’essai.</p>':'')+
      (sub&&sub.cancel_at_period_end?'<p class="lv-note" style="margin-top:12px">Votre abonnement s’arrête le '+F.dateL(String(sub.current_period_end).slice(0,10))+'.</p>':'')+'</div>';
    h+='<div class="hrow wrap sp" style="margin-bottom:14px"><h2 style="font-size:20px">Les offres</h2>'+U.seg([['month','Mensuel'],['year','Annuel · 2 mois offerts']],interval,'data-int')+'</div>';
    var list=plans.plans||[];if(plans.founder)list=list.map(function(p){return p.key===plans.founder.plan?Object.assign({},p,{name:plans.founder.name,month_cents:plans.founder.month_cents,year_cents:plans.founder.year_cents,founder:true}):p});
    h+='<div class="lv-grid rise">'+list.map(function(p){var cur=sub&&sub.plan===p.key&&sub.plan_status==='active';var price=interval==='year'?p.year_cents/12:p.month_cents;
      return '<div class="card lv-plan'+(cur?' cur':'')+'">'+(p.highlighted?'<span class="lv-tag">'+U.chip(p.founder?'Fondateur':'Le plus choisi','acc')+'</span>':'')+'<div><b style="font-size:19px">'+esc(p.name)+'</b><div class="mut" style="margin-top:4px">'+esc(p.tagline||'')+'</div></div>'+
        '<div class="lv-price">'+F.eur(Math.round(price/100))+'<small> HT par mois'+(interval==='year'?', soit '+eur(p.year_cents)+' par an':'')+'</small></div>'+
        '<ul>'+(p.features||[]).map(function(x){return '<li>'+ICON('check','sm')+'<span>'+esc(x)+'</span></li>'}).join('')+'</ul>'+
        (cur?'<button class="btn" disabled>Votre offre</button>':owner?'<button class="btn '+(p.highlighted?'pri':'')+'" data-plan="'+esc(p.key)+'"><span class="lv-spin" style="display:none"></span>Choisir '+esc(p.name)+'</button>':'<p class="lv-note">Seul le gérant titulaire peut changer d’offre.</p>')+'</div>'}).join('')+'</div>';
    h+='<p class="lv-note" style="margin-top:16px">'+esc((plans.vat&&plans.vat.note)||'')+' Paiement sécurisé par Stripe. Vendeur : '+esc(PL.vendor)+'. Résiliable à tout moment depuis le portail.</p>';
    b.innerHTML=h;
    b.querySelectorAll('[data-int]').forEach(function(x){x.addEventListener('click',function(){P.prefs.set('lv:interval',x.getAttribute('data-int'));interval=x.getAttribute('data-int');run()})});
    b.querySelectorAll('[data-plan]').forEach(function(x){x.onclick=function(){btnBusy(x,true);PL.post('/api/billing/checkout',{plan:x.getAttribute('data-plan'),interval:interval}).then(function(r){PL.openUrl(r.url)},function(e){btnBusy(x,false);PL.fail(e,'Abonnement')})}});
    var pt=b.querySelector('[data-portal]');if(pt)pt.onclick=function(){btnBusy(pt,true);PL.post('/api/billing/portal',{}).then(function(r){PL.openUrl(r.url)},function(e){btnBusy(pt,false);PL.fail(e,'Portail')})}})}
PL.vendor='Marceau Ruis, entreprise individuelle (SIREN 934 733 122)';

/* ---------- Paiements en ligne (Stripe Connect) ---------- */
function renderPay(el){screen(el,ph('Paiements en ligne','Carte bancaire et prélèvement SEPA : l’argent arrive directement sur le compte de votre structure.'),function(){return PL.get('/api/connect/status'+(q('stripe')?'?refresh=1':''))},function(b,s){
    if(q('stripe')==='retour'){P.toast(s.charges_enabled?'Paiements en ligne activés.':'Merci : Stripe vérifie vos informations.');cleanQuery()}else if(q('stripe')==='relancer'){P.toast('Le lien a expiré : reprenez l’activation.',{icon:'info'});cleanQuery()}
    var on=s.charges_enabled;
    var steps=[['Créer votre compte Stripe',s.connected],['Renseigner votre structure et votre IBAN',s.details_submitted],['Encaisser par carte',s.card||on],['Prélèvement SEPA',s.sepa],['Recevoir les virements',s.payouts_enabled]];
    b.innerHTML='<div class="g2" style="gap:16px"><div class="card pad '+(on?'tint d-hz':'')+'"><span class="ico">'+ICON(on?'checkc':'card')+'</span><h2 style="font-size:22px;margin:12px 0 6px">'+(on?'Les paiements en ligne sont actifs':s.connected?'Activation en cours':'Activez les paiements en ligne')+'</h2>'+
      '<p class="lv-note">'+(on?'Vos adhérents paient leurs factures en ligne, les relances incluent un lien de paiement.':'Comptez cinq minutes : Stripe vous demande l’identité du représentant, le SIRET et l’IBAN du compte qui reçoit les paiements.')+'</p>'+
      (s.requirements&&s.requirements.length?'<p class="lv-note" style="color:var(--warn);margin-top:8px">Stripe attend encore '+s.requirements.length+' information'+(s.requirements.length>1?'s':'')+'.</p>':'')+
      '<div class="hrow wrap" style="margin-top:16px">'+(PL.isManager()?'<button class="btn '+(on?'':'pri')+'" data-onb>'+ICON(on?'settings':'bolt','sm')+(on?'Mettre à jour mes informations':s.connected?'Reprendre l’activation':'Activer avec Stripe')+'</button>':'')+(on&&s.dashboard_url?'<a class="btn ghost" href="'+esc(s.dashboard_url)+'" target="_blank" rel="noopener">'+ICON('ext','sm')+'Tableau de bord Stripe</a>':'')+'</div></div>'+
      '<div class="card pad"><div class="eyebrow">Étapes</div><div class="lv-steps" style="margin-top:12px">'+steps.map(function(x){return '<div class="lv-stp'+(x[1]?' done':'')+'"><span class="ico">'+ICON(x[1]?'check':'dot')+'</span><span class="grow"><b>'+x[0]+'</b></span></div>'}).join('')+'</div></div></div>'+
      '<div class="card pad" style="margin-top:16px"><div class="eyebrow">Combien ça coûte</div><p class="lv-note" style="margin-top:8px">Aucun abonnement supplémentaire. Stripe prélève ses frais sur chaque paiement (environ 1,5 % + 0,25 € par carte européenne, 0,35 € par prélèvement SEPA)'+(s.application_fee_percent?', plus '+String(s.application_fee_percent).replace('.',',')+' % de frais de service':'')+'. Les tarifs à jour sont sur stripe.com/fr/pricing.</p></div>';
    var o=b.querySelector('[data-onb]');if(o)o.onclick=function(){btnBusy(o,true);PL.post('/api/connect/onboard',{}).then(function(r){PL.openUrl(r.url)},function(e){btnBusy(o,false);PL.fail(e,'Stripe')})}})}

/* ---------- Accès et invitations ---------- */
var INV_ROLES=[['member','Adhérent','members','Réserve, paie, signe, suit son cheval.'],['staff','Employé','upkeep','Sa journée, les soins, les chevaux.'],['coach','Coach','coach','Son agenda et ses élèves.'],['manager','Gérant','shield','Tout le club, sauf l’abonnement.'],['accountant','Comptable','accounting','Factures et exports, en lecture.']];
PL.inviteSheet=function(role,o){o=o||{};role=role||'member';var sh=P.sheet({title:'Inviter une personne',icon:'mail',body:function(b){
    b.innerHTML='<div class="lv-f"><div class="lv-fl"><span>Son accès</span><div class="lv-role">'+INV_ROLES.map(function(r){return '<button class="lv-opt" data-r="'+r[0]+'" aria-pressed="'+(r[0]===role)+'" style="min-height:0;padding:12px"><span class="ico sm">'+ICON(r[2],'sm')+'</span><b style="font-size:15px">'+r[1]+'</b><small>'+r[3]+'</small></button>'}).join('')+'</div></div>'+
      '<label class="lv-fl"><span>Adresse e-mail</span><input class="in" id="iv-email" type="email" inputmode="email" value="'+esc(o.email||'')+'"></label><div class="lv-row2"><label class="lv-fl"><span>Prénom</span><input class="in" id="iv-first" value="'+esc(o.first||'')+'"></label><label class="lv-fl"><span>Nom</span><input class="in" id="iv-last" value="'+esc(o.last||'')+'"></label></div>'+
      '<label class="lv-fl lv-iv-ref"><span>Fiche reliée <span class="lv-hint">facultatif</span></span><select class="in" id="iv-ref"></select></label><div class="lv-fmsg"></div></div>';
    function refs(){var r=role,l=r==='member'?(D.members||[]):r==='staff'||r==='manager'?(D.staff||[]):r==='coach'?(D.coaches||[]):[];var s=b.querySelector('#iv-ref');b.querySelector('.lv-iv-ref').style.display=l.length?'':'none';
      s.innerHTML='<option value="">Aucune</option>'+l.map(function(p){return '<option value="'+esc(p.id)+'"'+(p.id===o.person_ref?' selected':'')+'>'+esc((p.first+' '+p.last).trim())+'</option>'}).join('')}
    refs();b.querySelectorAll('[data-r]').forEach(function(x){x.onclick=function(){role=x.getAttribute('data-r');b.querySelectorAll('[data-r]').forEach(function(y){y.setAttribute('aria-pressed',y===x)});refs()}});
    b.querySelector('#iv-ref').onchange=function(){var id=this.value,p=D.person(id);if(p){var e=b.querySelector('#iv-email');if(!e.value&&p.email)e.value=p.email;if(!b.querySelector('#iv-first').value)b.querySelector('#iv-first').value=p.first||'';if(!b.querySelector('#iv-last').value)b.querySelector('#iv-last').value=p.last||''}}},
  foot:'<button class="btn ghost" data-c>Annuler</button><button class="btn pri" data-s>'+ICON('send','sm')+'Envoyer l’invitation</button>'});
  sh.querySelector('[data-c]').onclick=function(){sh.close()};
  sh.querySelector('[data-s]').onclick=function(){var x=this,em=sh.querySelector('#iv-email').value.trim();if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em)){sh.querySelector('.lv-fmsg').innerHTML='<div class="lv-msg">'+ICON('alert','sm')+'<span>Saisissez une adresse e-mail valide.</span></div>';return}
    btnBusy(x,true);PL.post('/api/invitations',{email:em,role:role,person_ref:sh.querySelector('#iv-ref').value||undefined,first:sh.querySelector('#iv-first').value.trim()||undefined,last:sh.querySelector('#iv-last').value.trim()||undefined})
      .then(function(){sh.close();P.toast('Invitation envoyée à '+em);if(role==='accountant')PL.accountantInvited=true;if(o.done)o.done();P.rerender()},function(e){btnBusy(x,false);sh.querySelector('.lv-fmsg').innerHTML='<div class="lv-msg">'+ICON('alert','sm')+'<span>'+esc(PL.msg(e))+'</span></div>'})}};
function renderAccess(el){var run=screen(el,ph('Accès et invitations','Qui accède à '+esc(D.club.name)+', avec quels droits.','<button class="btn pri" data-inv>'+ICON('plus','sm')+'Inviter</button>'),function(){return Promise.all([PL.get('/api/club/users'),opt(PL.get('/api/invitations'))])},function(b,d){
    var users=d[0].users||d[0].members||d[0]||[],inv=d[1].__err?[]:(d[1].invitations||d[1]||[]);inv=inv.filter(function(i){return !i.accepted_at&&!i.revoked_at&&i.status!=='accepted'&&i.status!=='revoked'});
    var h='<div class="g4 rise" style="margin-bottom:18px">'+INV_ROLES.slice(0,4).map(function(r){var n=users.filter(function(u){return u.role===r[0]||(r[0]==='manager'&&u.role==='owner')}).length;return U.kpi({label:r[1]+'s',value:n,icon:r[2]})}).join('')+'</div>';
    h+='<div class="card"><div class="ch"><h3>Personnes ayant accès</h3></div><div class="list">'+users.map(function(u){var me=PL.user&&u.id===PL.user.id||u.user_id===(PL.user||{}).id;return '<div class="li">'+U.av({first:u.first||u.email,last:u.last||'',color:PL.colorOf(u.id||u.user_id)})+'<div class="grow"><b>'+esc(((u.first||'')+' '+(u.last||'')).trim()||u.email)+(me?' <span class="mut">(vous)</span>':'')+'</b><div class="xs mut">'+esc(u.email||'')+'</div></div>'+U.chip(ROLEFR[u.role]||u.role,u.role==='owner'?'acc':'')+(u.status==='suspended'?U.chip('Suspendu','warn'):'')+
      (!me&&u.role!=='owner'?'<button class="btn ghost icon sm" data-u="'+esc(u.id||u.user_id)+'" title="Gérer l’accès">'+ICON('more','sm')+'</button>':'')+'</div>'}).join('')+'</div></div>';
    h+='<div class="card" style="margin-top:16px"><div class="ch"><h3>Invitations en attente</h3></div>'+(inv.length?'<div class="list">'+inv.map(function(i){return '<div class="li"><span class="ico sm">'+ICON('mail','sm')+'</span><div class="grow"><b>'+esc(i.email)+'</b><div class="xs mut">'+esc(ROLEFR[i.role]||i.role)+(i.expires_at?' · expire '+F.rel(String(i.expires_at).slice(0,10)):'')+'</div></div><button class="btn ghost sm" data-rs="'+esc(i.id)+'">Renvoyer</button><button class="btn ghost icon sm" data-rv="'+esc(i.id)+'" title="Annuler l’invitation">'+ICON('x','sm')+'</button></div>'}).join('')+'</div>':'<div class="cb"><p class="lv-note">Aucune invitation en attente.</p></div>')+'</div>';
    b.innerHTML=h;
    b.querySelectorAll('[data-rs]').forEach(function(x){x.onclick=function(){PL.post('/api/invitations/'+x.getAttribute('data-rs')+'/resend',{}).then(function(){P.toast('Invitation renvoyée')},function(e){PL.fail(e)})}});
    b.querySelectorAll('[data-rv]').forEach(function(x){x.onclick=function(){PL.del('/api/invitations/'+x.getAttribute('data-rv')).then(function(){P.toast('Invitation annulée');run()},function(e){PL.fail(e)})}});
    b.querySelectorAll('[data-u]').forEach(function(x){x.onclick=function(){var u=users.filter(function(y){return (y.id||y.user_id)===x.getAttribute('data-u')})[0];var sh=P.sheet({title:'Accès de '+esc(((u.first||'')+' '+(u.last||'')).trim()||u.email),icon:'shield',body:'<div class="lv-f"><label class="lv-fl"><span>Rôle</span><select class="in" id="ur">'+INV_ROLES.map(function(r){return '<option value="'+r[0]+'"'+(r[0]===u.role?' selected':'')+'>'+r[1]+'</option>'}).join('')+'</select></label></div>',
      foot:'<button class="btn ghost" data-del style="color:var(--bad)">'+ICON('trash','sm')+'Retirer l’accès</button><button class="btn" data-sus>'+(u.status==='suspended'?'Réactiver':'Suspendre')+'</button><button class="btn pri" data-ok>Enregistrer</button>'});
      var id=x.getAttribute('data-u');
      sh.querySelector('[data-ok]').onclick=function(){PL.patch('/api/club/users/'+id,{role:sh.querySelector('#ur').value}).then(function(){sh.close();P.toast('Accès mis à jour');run()},function(e){PL.fail(e)})};
      sh.querySelector('[data-sus]').onclick=function(){PL.patch('/api/club/users/'+id,{status:u.status==='suspended'?'active':'suspended'}).then(function(){sh.close();P.toast(u.status==='suspended'?'Accès réactivé':'Accès suspendu');run()},function(e){PL.fail(e)})};
      sh.querySelector('[data-del]').onclick=function(){PL.del('/api/club/users/'+id).then(function(){sh.close();P.toast('Accès retiré');run()},function(e){PL.fail(e)})}}})});
  el.querySelector('[data-inv]').onclick=function(){PL.inviteSheet('member',{done:run})}}

/* ---------- Comptable et exports ---------- */
var YEAR=new Date().getFullYear();
function exportsCard(){var m=PL.isoDay().slice(0,7),prev=new Date();prev.setMonth(prev.getMonth()-1);var pm=PL.isoDay(prev).slice(0,7);
  return '<div class="card pad"><div class="eyebrow">Exports comptables</div><div class="lv-steps" style="margin-top:12px">'+
    [['fec','Fichier des écritures comptables (FEC) '+YEAR,'Format légal pour votre expert-comptable et l’administration fiscale.','accounting','/api/accounting/exports/fec?year='+YEAR],
     ['fec1','FEC '+(YEAR-1),'Exercice précédent.','accounting','/api/accounting/exports/fec?year='+(YEAR-1)],
     ['csv','Journal des ventes (CSV)','Toutes les factures et avoirs, ouvrable dans Excel.','grid','/api/accounting/exports/sales.csv'],
     ['zip','Factures PDF de '+F.dateL(pm+'-15').split(' ').slice(2).join(' '),'Archive ZIP des factures du mois dernier.','download','/api/accounting/exports/pdfs.zip?month='+pm],
     ['zip2','Factures PDF du mois en cours','Archive ZIP, mois de '+F.dateL(m+'-15').split(' ').slice(2).join(' ')+'.','download','/api/accounting/exports/pdfs.zip?month='+m]]
    .map(function(x){return '<button class="lv-stp" data-dl="'+esc(x[4])+'"><span class="ico">'+ICON(x[3])+'</span><span class="grow"><b>'+x[1]+'</b><small>'+x[2]+'</small></span>'+ICON('download','sm')+'</button>'}).join('')+'</div></div>'}
function bindExports(root){root.querySelectorAll('[data-dl]').forEach(function(x){x.onclick=function(){x.disabled=true;PL.download(x.getAttribute('data-dl')).then(function(){P.toast('Téléchargement lancé',{icon:'download'})},function(e){PL.fail(e,'Export')}).then(function(){x.disabled=false})}})}
function renderAccountant(el){screen(el,ph('Votre comptable','Factures électroniques, exports FEC et pièces : tout ce dont votre cabinet a besoin.'),function(){return opt(PL.get('/api/club/users'))},function(b,d){
    var acc=d.__err?[]:(d.users||d||[]).filter(function(u){return u.role==='accountant'});
    b.innerHTML='<div class="g2" style="gap:16px"><div class="card pad tint d-mo"><span class="ico">'+ICON('accounting')+'</span><h2 style="font-size:22px;margin:12px 0 6px">'+(acc.length?'Votre comptable a son accès':'Invitez votre comptable')+'</h2>'+
      '<p class="lv-note">Il consulte les factures, les encaissements et télécharge les exports, sans accès aux fiches de vos cavaliers ni à vos réglages.</p>'+
      (acc.length?'<div class="list" style="margin-top:12px">'+acc.map(function(u){return '<div class="li">'+U.av({first:u.first||u.email,last:u.last||'',color:'var(--c4)'})+'<div class="grow"><b>'+esc(((u.first||'')+' '+(u.last||'')).trim()||u.email)+'</b><div class="xs mut">'+esc(u.email)+'</div></div></div>'}).join('')+'</div>':'')+
      '<button class="btn '+(acc.length?'':'pri')+'" data-ia style="margin-top:14px">'+ICON('mail','sm')+(acc.length?'Inviter un autre comptable':'Inviter mon comptable')+'</button></div>'+
      '<div class="card pad"><div class="eyebrow">Facture électronique</div><h3 style="margin:10px 0 6px">Prêt pour la réforme</h3><p class="lv-note">Vos factures sont émises au format Factur-X (PDF lisible et données structurées). Les factures aux professionnels sont transmises par une plateforme agréée, les ventes aux particuliers font l’objet de l’e-reporting. Si votre comptable gère déjà votre plateforme, il récupère tout depuis ses exports.</p></div></div>'+
      '<div style="margin-top:16px">'+exportsCard()+'</div>';
    b.querySelector('[data-ia]').onclick=function(){PL.inviteSheet('accountant',{done:function(){P.rerender()}})};bindExports(b)})}

/* ---------- Calendriers (ICS) ---------- */
var SCOPES={gerant:[['club','Planning du club','Reprises, stages, concours et soins']],employe:[['club','Planning du club','Reprises, soins et tâches de la journée']],coach:[['coach','Mon agenda de coach','Cours et réservations']],adherent:[['member','Mes reprises','Reprises réservées, rendez-vous et concours']],comptable:[]};
function calButtons(L){var url=L.url||'',web=L.webcal||url.replace(/^https?:/,'webcal:');
  return '<a class="btn sm" href="'+esc(L.google||'https://calendar.google.com/calendar/r?cid='+encodeURIComponent(web))+'" target="_blank" rel="noopener">Google Agenda</a><a class="btn sm" href="'+esc(L.apple||web)+'">Apple Calendrier</a><a class="btn sm" href="'+esc(L.outlook||'https://outlook.live.com/calendar/0/addfromweb?url='+encodeURIComponent(url))+'" target="_blank" rel="noopener">Outlook</a><button class="btn ghost sm" data-cp="'+esc(url)+'">'+ICON('copy','sm')+'Copier le lien</button>'}
function renderCal(el){var view=PL.view;var run=screen(el,ph('Calendriers','Retrouvez le planning dans l’agenda de votre téléphone : il se met à jour tout seul.'),function(){return PL.get('/api/calendars')},function(b,d){
    var list=d.calendars||d.feeds||d||[];var sc=SCOPES[view]||[['me','Mon agenda','']];
    b.innerHTML='<div class="lv-cal rise">'+sc.map(function(s){var c=list.filter(function(x){return x.scope===s[0]})[0],L=c&&(c.links||(c.url?{url:c.url}:null));
      return '<div class="lv-calrow"><span class="ico">'+ICON(s[0]==='care'?'care':'calendar_add')+'</span><div class="grow"><b>'+s[1]+'</b><div class="xs mut">'+s[2]+'</div>'+(L?'<span class="lv-url">'+esc(L.url)+'</span>':'')+'</div><div class="hrow wrap">'+(L?calButtons(L)+'<button class="btn ghost sm" data-rm="'+esc(c.id)+'" style="color:var(--bad)">Supprimer</button>':'<button class="btn pri sm" data-mk="'+s[0]+'">'+ICON('plus','sm')+'Créer le lien</button>')+'</div></div>'}).join('')+'</div>'+
      '<p class="lv-note" style="margin-top:14px">Ce lien est personnel : toute personne qui le possède voit ce calendrier. En cas de doute, supprimez-le et créez-en un nouveau.</p>';
    b.querySelectorAll('[data-mk]').forEach(function(x){x.onclick=function(){btnBusy(x,true);PL.post('/api/calendars',{scope:x.getAttribute('data-mk')}).then(function(){P.toast('Lien de calendrier créé');run()},function(e){btnBusy(x,false);PL.fail(e,'Calendrier')})}});
    b.querySelectorAll('[data-cp]').forEach(function(x){x.onclick=function(){copy(x.getAttribute('data-cp'),'Lien du calendrier copié')}});
    b.querySelectorAll('[data-rm]').forEach(function(x){x.onclick=function(){if(!confirm('Supprimer ce lien ? Les agendas abonnés ne recevront plus le planning.'))return;btnBusy(x,true);PL.del('/api/calendars/'+encodeURIComponent(x.getAttribute('data-rm'))).then(function(){P.toast('Lien supprimé');run()},function(e){btnBusy(x,false);PL.fail(e,'Calendrier')})}})})}

/* ---------- Clés d'API et outil de migration ---------- */
function renderKeys(el){var run=screen(el,ph('Clés d’API','Pour l’outil de migration et vos intégrations. Une clé n’est affichée qu’une seule fois.','<button class="btn pri" data-nk>'+ICON('plus','sm')+'Créer une clé</button>'),function(){return PL.get('/api/api-keys')},function(b,d){
    var keys=(d.api_keys||[]).filter(function(k){return !k.revoked_at});
    b.innerHTML='<div class="card">'+(keys.length?'<div class="list">'+keys.map(function(k){return '<div class="li"><span class="ico sm">'+ICON('key','sm')+'</span><div class="grow"><b>'+esc(k.name)+'</b><div class="xs mut"><span class="pf-mono">pk_live_'+esc(k.prefix)+'_…</span> · '+esc((k.scopes||[]).join(', '))+' · '+(k.last_used_at?'utilisée '+F.rel(k.last_used_at.slice(0,10)):'jamais utilisée')+'</div></div><button class="btn ghost sm" data-rk="'+esc(k.id)+'" style="color:var(--bad)">Révoquer</button></div>'}).join('')+'</div>':'<div class="cb"><p class="lv-note">Aucune clé active.</p></div>')+'</div>';
    b.querySelectorAll('[data-rk]').forEach(function(x){x.onclick=function(){PL.del('/api/api-keys/'+x.getAttribute('data-rk')).then(function(){P.toast('Clé révoquée');run()},function(e){PL.fail(e)})}})});
  el.querySelector('[data-nk]').onclick=function(){PL.newKeySheet({done:run})}}
PL.newKeySheet=function(o){o=o||{};var sh=P.sheet({title:'Créer une clé d’API',icon:'key',body:'<div class="lv-f"><label class="lv-fl"><span>Nom</span><input class="in" id="k-n" value="'+esc(o.name||'Outil de migration')+'"></label><div class="lv-fl"><span>Droits</span><div class="hrow wrap">'+[['import','Import'],['read','Lecture'],['write','Écriture'],['invoices','Factures'],['ics','Calendriers']].map(function(s){return '<button class="tag" data-sc="'+s[0]+'" aria-pressed="'+(s[0]==='import')+'">'+s[1]+'</button>'}).join('')+'</div></div><div class="lv-kres"></div></div>',
  foot:'<button class="btn ghost" data-c>Fermer</button><button class="btn pri" data-ok>'+ICON('key','sm')+'Créer la clé</button>'});
  sh.querySelector('[data-c]').onclick=function(){sh.close()};
  sh.querySelector('[data-ok]').onclick=function(){var x=this,sc=Array.prototype.map.call(sh.querySelectorAll('[data-sc][aria-pressed="true"]'),function(t){return t.getAttribute('data-sc')});btnBusy(x,true);
    PL.post('/api/api-keys',{name:sh.querySelector('#k-n').value.trim()||'Clé',scopes:sc.length?sc:['import']}).then(function(r){x.style.display='none';
      sh.querySelector('.lv-kres').innerHTML='<div class="lv-msg ok">'+ICON('checkc','sm')+'<span>Copiez cette clé maintenant : elle ne sera plus jamais affichée.</span></div><div class="lv-secret">'+esc(r.token)+'</div><button class="btn" data-cpk>'+ICON('copy','sm')+'Copier la clé</button>';
      sh.querySelector('[data-cpk]').onclick=function(){copy(r.token,'Clé copiée')};if(o.done)o.done()},function(e){btnBusy(x,false);PL.fail(e,'Clé d’API')})}};

/* ---------- Import (fichier ou outil de migration) ---------- */
function renderImport(el){var A=(PL.onbData&&PL.onbData.answers)||{},sw=A.software||'',legacy=['kavalog','equimondo','pegase'].indexOf(sw)>=0,name={kavalog:'Kavalog',equimondo:'Equimondo',pegase:'Pégase'}[sw]||'votre ancien logiciel';
  el.innerHTML=ph('Importer vos données','Adhérents, chevaux, forfaits : reprenez tout sans ressaisie.')+
    '<div class="g2" style="gap:16px"><div class="card pad"><span class="ico">'+ICON('upload')+'</span><h3 style="margin:12px 0 6px">Depuis un fichier Excel ou CSV</h3><p class="lv-note">Nous reconnaissons les colonnes et vous montrons un aperçu : rien n’est enregistré avant votre accord.</p>'+
      '<div class="lv-drop" style="margin-top:14px" tabindex="0">'+ICON('upload')+'<b>Déposez votre fichier ici</b><span>ou cliquez pour le choisir (CSV, 10 Mo au plus)</span><input type="file" accept=".csv,text/csv,.txt" hidden></div><div class="lv-imp"></div></div>'+
    '<div class="card pad '+(legacy?'tint d-pf':'')+'"><span class="ico">'+ICON('robot')+'</span><h3 style="margin:12px 0 6px">Outil de migration'+(legacy?' depuis '+esc(name):'')+'</h3><p class="lv-note">Un petit programme gratuit s’installe sur l’ordinateur où '+esc(name)+' est ouvert. Il lit vos adhérents, chevaux, forfaits et factures et les envoie ici avec une clé réservée à l’import. Un essai à blanc vous montre le résultat avant validation, et tout import peut être annulé.</p>'+
      '<ol class="lv-note" style="padding-left:18px;margin:10px 0 0;line-height:1.8"><li>Créez une clé d’import.</li><li>Lancez l’outil et collez la clé.</li><li>Vérifiez l’essai à blanc, puis validez.</li></ol><button class="btn pri" data-key style="margin-top:14px">'+ICON('key','sm')+'Créer ma clé d’import</button></div></div>';
  var drop=el.querySelector('.lv-drop'),file=drop.querySelector('input'),out=el.querySelector('.lv-imp');
  el.querySelector('[data-key]').onclick=function(){PL.newKeySheet({name:'Outil de migration '+(legacy?name:'')})};
  drop.onclick=function(){file.click()};drop.onkeydown=function(e){if(e.key==='Enter')file.click()};
  ['dragover','dragenter'].forEach(function(t){drop.addEventListener(t,function(e){e.preventDefault();drop.classList.add('over')})});['dragleave','drop'].forEach(function(t){drop.addEventListener(t,function(){drop.classList.remove('over')})});
  drop.addEventListener('drop',function(e){e.preventDefault();if(e.dataTransfer.files[0])send(e.dataTransfer.files[0],'preview')});file.onchange=function(){if(file.files[0])send(file.files[0],'preview')};
  var last=null;
  function send(f,action,dry){last=f;var fd=new FormData();fd.append('file',f);fd.append('action',action);if(dry)fd.append('dry_run','true');fd.append('source',sw||'csv');
    out.innerHTML='<div class="lv-dots" style="padding:16px"><i></i><i></i><i></i></div>';
    PL.api('POST','/api/v1/import/csv',fd).then(function(r){
      if(r.action==='preview'){var n=(r.counts&&(r.counts.members||0)+(r.counts.horses||0))||r.rows||'';out.innerHTML='<div class="lv-msg info" style="margin-top:14px">'+ICON('info','sm')+'<span>'+esc(f.name)+' : '+(r.coll==='horses'?'chevaux':'adhérents')+' détectés'+(n?' ('+n+' lignes)':'')+'. Colonnes reconnues : '+esc(Object.keys(r.mapping||{}).filter(function(k){return r.mapping[k]}).slice(0,8).join(', ')||'aucune')+'.</span></div>'+
        '<div class="hrow wrap" style="margin-top:12px"><button class="btn" data-dry>'+ICON('eye','sm')+'Essai à blanc</button><button class="btn pri" data-go>'+ICON('check','sm')+'Importer</button></div>';
        out.querySelector('[data-dry]').onclick=function(){send(last,'commit',true)};out.querySelector('[data-go]').onclick=function(){send(last,'commit',false)};return}
      var rep=r.report||{},c=rep.counts||rep.created||{};var txt=Object.keys(c).map(function(k){var v=c[k];return (typeof v==='object'?(v.created||0)+(v.updated||0):v)+' '+({members:'adhérents',horses:'chevaux'}[k]||k)}).join(', ');
      out.innerHTML='<div class="lv-msg ok" style="margin-top:14px">'+ICON('checkc','sm')+'<span>'+(rep.dry_run||r.dry_run?'Essai à blanc : ':'Import terminé : ')+esc(txt||'aucune ligne')+'.'+(rep.warnings&&rep.warnings.length?' '+rep.warnings.length+' avertissement'+(rep.warnings.length>1?'s':'')+'.':'')+'</span></div>';
      if(!(rep.dry_run||r.dry_run)){PL.reloadData()}},function(e){out.innerHTML='<div class="lv-msg" style="margin-top:14px">'+ICON('alert','sm')+'<span>'+esc(e.unavailable?'L’import de fichiers arrive très bientôt sur votre espace.':PL.msg(e))+'</span></div>'})}}

/* ---------- Factures (API du lot C) ---------- */
PL.invoiceToDemo=function(x){var c=x.customer||{},tot=x.total_ttc!=null?x.total_ttc:(x.total_cents||0),due=x.amount_due!=null?x.amount_due:tot-(x.paid_amount||0);
  var MAP={draft:'brouillon',issued:'envoyée',sent:'envoyée',partially_paid:'envoyée',paid:'payée',overdue:'en retard',cancelled:'annulée'};var st=x.kind==='credit_note'?'avoir':MAP[x.status]||x.status_label||x.status;
  if((st==='envoyée')&&x.due_date&&x.due_date<PL.isoDay()&&due>0)st='en retard';
  return {id:x.number||x.id,_id:x.id,member:c.ref||'',label:x.label||'Facture',amount:tot/100,left:Math.max(0,due)/100,vat:0,date:(x.issue_date||x.created_at||'').slice(0,10),due:(x.due_date||'').slice(0,10),status:st,method:x.payment_method||'',live:x}};
PL.loadInvoices=function(){return PL.get('/api/invoices').then(function(j){var l=j.invoices||j.items||(Array.isArray(j)?j:[]);PL.invoices=l;PL.setColl('invoices',l.map(PL.invoiceToDemo));PL.derive();return l})};
var IST={draft:['Brouillon',''],issued:['Émise','acc'],sent:['Envoyée','acc'],partially_paid:['Partiellement payée','warn'],paid:['Payée','ok'],overdue:['En retard','bad'],cancelled:['Annulée','']};
function invChip(x){var s=IST[x.status]||[x.status_label||x.status,''];if(x.kind==='credit_note')s=['Avoir',''];var d=PL.invoiceToDemo(x);if(d.status==='en retard')s=['En retard','bad'];return U.chip(s[0],s[1],true)}
function who(x){var c=x.customer||{};return c.name||D.name(c.ref)||c.email||'Client de passage'}
function renderInvoices(el){var filter=P.prefs.get('lv:invf','all');
  var run=screen(el,ph('Facturation','Factures conformes, numérotées et au format Factur-X, prêtes pour la facture électronique.','<button class="btn pri" data-new>'+ICON('plus','sm')+'Nouvelle facture</button>'),PL.loadInvoices,function(b,list){
    var due=list.filter(function(x){return x.kind!=='credit_note'&&x.status!=='draft'&&x.status!=='cancelled'}).reduce(function(s,x){return s+(x.amount_due||0)},0);
    var late=list.filter(function(x){return PL.invoiceToDemo(x).status==='en retard'});
    var month=PL.isoDay().slice(0,7),billed=list.filter(function(x){return x.kind!=='credit_note'&&x.status!=='draft'&&String(x.issue_date||'').slice(0,7)===month}).reduce(function(s,x){return s+(x.total_ttc||0)},0);
    var h='<div class="g3 rise" style="margin-bottom:18px">'+U.kpi({label:'Facturé ce mois-ci',count:Math.round(billed/100),fmt:'eur',icon:'invoice',dom:'argent'})+U.kpi({label:'Reste à encaisser',count:Math.round(due/100),fmt:'eur',icon:'wallet'})+U.kpi({label:'En retard',value:late.length,icon:'alert'})+'</div>';
    var rows=list.filter(function(x){return filter==='all'||(filter==='draft'?x.status==='draft':filter==='late'?late.indexOf(x)>=0:filter==='due'?(x.amount_due>0&&x.status!=='draft'):true)});
    h+='<div class="hrow wrap sp" style="margin-bottom:12px">'+U.seg([['all','Toutes'],['due','À encaisser'],['late','En retard'],['draft','Brouillons']],filter,'data-f')+'</div>';
    h+=rows.length?U.table([{k:'number',l:'Numéro',f:function(x){return '<b class="num">'+esc(x.number||'Brouillon')+'</b>'}},{k:'c',l:'Client',f:function(x){return esc(who(x))}},{k:'label',l:'Objet',hide:true,f:function(x){return esc(x.label||'')}},
      {k:'d',l:'Date',hide:true,f:function(x){return x.issue_date?F.date(x.issue_date):'–'}},{k:'t',l:'Montant',n:true,f:function(x){return '<span class="num">'+eur(x.total_ttc)+'</span>'}},{k:'s',l:'État',f:invChip}],rows,{click:true,key:'id'})
      :U.empty('invoice','Aucune facture ici','Créez une facture : elle est numérotée à l’émission et envoyée par e-mail.','<button class="btn pri" data-new2>'+ICON('plus','sm')+'Nouvelle facture</button>');
    b.innerHTML=h;
    b.querySelectorAll('[data-f]').forEach(function(x){x.addEventListener('click',function(){filter=x.getAttribute('data-f');P.prefs.set('lv:invf',filter);run()})});
    b.querySelectorAll('[data-row]').forEach(function(r){r.onclick=function(){var x=list.filter(function(y){return y.id===r.getAttribute('data-row')})[0];if(x)PL.invoiceSheet(x,run)}});
    var n2=b.querySelector('[data-new2]');if(n2)n2.onclick=function(){PL.invoiceForm(run)}});
  el.querySelector('[data-new]').onclick=function(){PL.invoiceForm(run)}}
var CATS=[['lesson','Cours et enseignement'],['boarding','Pension'],['boarding_std','Pension, hébergement et soins (taux normal)'],['course','Stage, animation, randonnée'],['competition','Concours et engagements'],['facilities','Accès aux installations'],['horse_lease','Demi-pension, mise à disposition'],['transport','Transport'],['service','Autre prestation'],['goods','Vente de marchandises']];
PL.invoiceForm=function(done){var lines=[{label:'',qty:1,price:'',cat:'lesson'}];
  var sh=P.sheet({title:'Nouvelle facture',icon:'invoice',wide:true,body:function(b){
    function draw(){b.innerHTML='<div class="lv-f"><label class="lv-fl"><span>Client</span><select class="in" id="iv-c"><option value="">Choisir un adhérent</option>'+(D.members||[]).map(function(m){return '<option value="'+esc(m.id)+'">'+esc((m.first+' '+m.last).trim())+'</option>'}).join('')+'</select></label>'+
      '<div class="lv-row2"><label class="lv-fl"><span>Objet</span><input class="in" id="iv-l" placeholder="Forfait de décembre"></label><label class="lv-fl"><span>Échéance</span><input class="in" type="date" id="iv-d" value="'+PL.isoDay(new Date(Date.now()+15*864e5))+'"></label></div>'+
      '<div class="eyebrow">Lignes</div><div class="lv-lines">'+lines.map(function(l,i){return '<div class="lv-line"><input class="in" data-l="label" data-i="'+i+'" value="'+esc(l.label)+'" placeholder="Désignation"><input class="in num" data-l="price" data-i="'+i+'" value="'+esc(l.price)+'" inputmode="decimal" placeholder="Prix TTC €"><select class="in lv-vat" data-l="cat" data-i="'+i+'">'+CATS.map(function(c){return '<option value="'+c[0]+'"'+(c[0]===l.cat?' selected':'')+'>'+c[1]+'</option>'}).join('')+'</select><button class="btn ghost icon sm" data-rm="'+i+'" title="Retirer la ligne">'+ICON('x','sm')+'</button></div>'}).join('')+'</div>'+
      '<button class="btn ghost sm" data-add>'+ICON('plus','sm')+'Ajouter une ligne</button><div class="lv-total"><span>Total TTC</span><span class="num">'+F.eur(lines.reduce(function(s,l){return s+(parseFloat(String(l.price).replace(',','.'))||0)},0),true)+'</span></div><p class="lv-note">Le taux de TVA suit la nature de chaque ligne et votre régime ; la facture est numérotée à l’émission.</p><div class="lv-fmsg"></div></div>';
      b.querySelectorAll('[data-l]').forEach(function(x){x.addEventListener('change',function(){lines[+x.getAttribute('data-i')][x.getAttribute('data-l')]=x.value;if(x.getAttribute('data-l')==='price')draw()})});
      b.querySelector('[data-add]').onclick=function(){keep();lines.push({label:'',qty:1,price:'',cat:lines[lines.length-1].cat});draw()};
      b.querySelectorAll('[data-rm]').forEach(function(x){x.onclick=function(){keep();if(lines.length>1)lines.splice(+x.getAttribute('data-rm'),1);draw()}})}
    function keep(){b.querySelectorAll('[data-l]').forEach(function(x){lines[+x.getAttribute('data-i')][x.getAttribute('data-l')]=x.value})}
    sh0.keep=keep;draw()},foot:'<button class="btn ghost" data-dr>Enregistrer le brouillon</button><button class="btn pri" data-is>'+ICON('send','sm')+'Émettre et envoyer</button>'});
  var sh0=sh;
  function payload(){sh.keep&&sh.keep();var c=sh.querySelector('#iv-c').value,ls=lines.filter(function(l){return l.label||l.price}).map(function(l){var p=Math.round((parseFloat(String(l.price).replace(',','.'))||0)*100);return {label:l.label||'Prestation',quantity:1,unit_price:p,category:l.cat}});
    if(!c)throw new Error('Choisissez le client.');if(!ls.length)throw new Error('Ajoutez au moins une ligne.');if(ls.some(function(l){return l.unit_price<=0}))throw new Error('Chaque ligne doit avoir un prix.');
    return {customer_ref:c,label:sh.querySelector('#iv-l').value.trim()||ls[0].label,due_date:sh.querySelector('#iv-d').value||undefined,price_mode:'ttc',lines:ls}}
  function go(issue,btn){var p;try{p=payload()}catch(e){sh.querySelector('.lv-fmsg').innerHTML='<div class="lv-msg">'+ICON('alert','sm')+'<span>'+esc(e.message)+'</span></div>';return}
    btnBusy(btn,true);PL.post('/api/invoices',p).then(function(r){var inv=r.invoice||r;return issue?PL.post('/api/invoices/'+inv.id+'/issue',{send:true}).then(function(x){return x.invoice||x}):inv}).then(function(inv){sh.close();P.toast(issue?'Facture '+(inv.number||'')+' émise et envoyée':'Brouillon enregistré');(done||P.rerender)()},function(e){btnBusy(btn,false);sh.querySelector('.lv-fmsg').innerHTML='<div class="lv-msg">'+ICON('alert','sm')+'<span>'+esc(e.unavailable?'La facturation arrive très bientôt sur votre espace.':PL.msg(e))+'</span></div>'})}
  sh.querySelector('[data-dr]').onclick=function(){go(false,this)};sh.querySelector('[data-is]').onclick=function(){go(true,this)}};
var METH=[['transfer','Virement'],['check','Chèque'],['cash','Espèces'],['card','Carte sur place'],['ancv','Chèques-vacances ANCV'],['pass_sport','Pass’Sport'],['sepa','Prélèvement'],['other','Autre']];
PL.invoiceSheet=function(x,done){var manager=PL.isManager();var sh=P.sheet({title:esc(x.number||'Brouillon'),icon:'invoice',body:function(b){
    b.innerHTML='<div class="stack" style="--g:16px"><div class="hrow sp"><div><div class="big num">'+eur(x.total_ttc)+'</div><div class="mut">'+esc(who(x))+' · '+esc(x.label||'')+'</div></div>'+invChip(x)+'</div>'+
      '<dl class="lv-kv"><dt>Date</dt><dd>'+(x.issue_date?F.dateY(x.issue_date):'Non émise')+'</dd><dt>Échéance</dt><dd>'+(x.due_date?F.dateY(x.due_date):'–')+'</dd><dt>Reste dû</dt><dd>'+eur(x.amount_due)+'</dd>'+(x.einvoice&&x.einvoice.channel&&x.einvoice.channel!=='none'?'<dt>Facture électronique</dt><dd>'+esc(x.einvoice.channel==='b2b'?'Transmise par la plateforme agréée':'E-reporting')+(x.einvoice.status?' · '+esc(x.einvoice.status):'')+'</dd>':'')+'</dl>'+
      '<div class="lv-inv-act">'+(x.has_pdf?'<button class="btn" data-pdf>'+ICON('download','sm')+'PDF Factur-X</button>':'')+
      (manager&&x.status==='draft'?'<button class="btn pri" data-iss>'+ICON('send','sm')+'Émettre et envoyer</button><button class="btn ghost" data-deld style="color:var(--bad)">'+ICON('trash','sm')+'Supprimer</button>':'')+
      (manager&&x.status!=='draft'&&x.amount_due>0?'<button class="btn pri" data-cash>'+ICON('wallet','sm')+'Encaisser</button><button class="btn" data-link>'+ICON('link','sm')+'Lien de paiement</button>':'')+
      (manager&&x.status!=='draft'&&x.kind!=='credit_note'&&x.status!=='cancelled'?'<button class="btn ghost" data-cn>'+ICON('swap','sm')+'Établir un avoir</button>':'')+'</div><div class="lv-x"></div></div>'},
    foot:''});
  var X=sh.querySelector('.lv-x');function bad(e){X.innerHTML='<div class="lv-msg">'+ICON('alert','sm')+'<span>'+esc(e.unavailable?'Cette action arrive très bientôt.':PL.msg(e))+'</span></div>'}
  function after(msg){sh.close();P.toast(msg);(done||P.rerender)()}
  var on=function(s,f){var e=sh.querySelector(s);if(e)e.onclick=function(){f(e)}};
  on('[data-pdf]',function(e){btnBusy(e,true);PL.download('/api/invoices/'+x.id+'/pdf',(x.number||'facture')+'.pdf').catch(bad).then(function(){btnBusy(e,false)})});
  on('[data-iss]',function(e){btnBusy(e,true);PL.post('/api/invoices/'+x.id+'/issue',{send:true}).then(function(r){after('Facture '+((r.invoice||r).number||'')+' émise')},function(er){btnBusy(e,false);bad(er)})});
  on('[data-deld]',function(e){PL.del('/api/invoices/'+x.id).then(function(){after('Brouillon supprimé')},bad)});
  on('[data-link]',function(e){btnBusy(e,true);PL.post('/api/pay/link',{invoice_id:x.id,send:true}).then(function(r){btnBusy(e,false);X.innerHTML='<div class="lv-msg ok">'+ICON('checkc','sm')+'<span>'+(r.sent?'Lien envoyé par e-mail. ':'')+'Valable jusqu’au '+F.dateL(String(r.expires_at).slice(0,10))+'.</span></div><div class="lv-secret" style="margin-top:8px">'+esc(r.url)+'</div>';copy(r.url,'Lien de paiement copié')},function(er){btnBusy(e,false);bad(er)})});
  on('[data-cn]',function(e){btnBusy(e,true);PL.post('/api/invoices/'+x.id+'/credit-note',{}).then(function(){after('Avoir établi')},function(er){btnBusy(e,false);bad(er)})});
  on('[data-cash]',function(){X.innerHTML='<div class="lv-f" style="margin-top:6px"><div class="lv-row2"><label class="lv-fl"><span>Montant (€)</span><input class="in num" id="cs-a" inputmode="decimal" value="'+((x.amount_due||0)/100).toFixed(2).replace('.',',')+'"></label><label class="lv-fl"><span>Moyen</span><select class="in" id="cs-m">'+METH.map(function(m){return '<option value="'+m[0]+'">'+m[1]+'</option>'}).join('')+'</select></label></div><label class="lv-fl"><span>Date</span><input class="in" type="date" id="cs-d" value="'+PL.isoDay()+'"></label><button class="btn pri" data-cs>'+ICON('check','sm')+'Enregistrer le paiement</button></div>';
    X.querySelector('[data-cs]').onclick=function(){var a=Math.round(parseFloat(X.querySelector('#cs-a').value.replace(',','.'))*100);if(!(a>0))return bad({message:'Indiquez un montant.'});var me=X.querySelector('#cs-m').value;
      PL.post('/api/invoices/'+x.id+'/payments',{amount:a,amount_cents:a,method:me,paid_at:X.querySelector('#cs-d').value}).then(function(){after('Paiement de '+eur(a)+' enregistré')},bad)}})};

/* ---------- Côté adhérent : Mes factures, bouton Payer ---------- */
function renderMyInvoices(el){var run=screen(el,ph('Mes factures','Payez en ligne par carte ou prélèvement, téléchargez vos factures.'),function(){return Promise.all([PL.get('/api/invoices'),opt(PL.get('/api/pay/options'))])},function(b,d){
    var list=(d[0].invoices||d[0].items||d[0]||[]).filter(function(x){return x.status!=='draft'}),po=d[1].__err?{}:d[1];
    if(q('paiement')==='succes'){P.toast('Merci, votre paiement est enregistré.');cleanQuery()}else if(q('paiement')==='annule'){P.toast('Paiement annulé : rien n’a été débité.',{icon:'info'});cleanQuery()}else if(q('prelevement')==='succes'){P.toast('Prélèvement SEPA mis en place.');cleanQuery()}
    var due=list.filter(function(x){return x.amount_due>0&&x.kind!=='credit_note'}),total=due.reduce(function(s,x){return s+x.amount_due},0);
    var h='<div class="card pad '+(total?'tint d-mo':'tint d-hz')+'" style="margin-bottom:16px"><div class="eyebrow">'+(total?'À régler':'Tout est réglé')+'</div><div class="big num" style="margin:8px 0">'+eur(total)+'</div>'+
      (total?'<button class="btn pri lg" data-payall>'+ICON('card','sm')+'Payer '+(due.length>1?'la plus ancienne':'maintenant')+'</button>'+(po.enabled?'':'<p class="lv-note" style="margin-top:10px">Le paiement en ligne n’est peut-être pas encore activé par votre club : vous pouvez aussi régler à l’accueil.</p>'):'<p class="lv-note">Merci, aucune facture en attente.</p>')+
      (po.mandate?'<button class="btn ghost" data-sepa style="margin-left:8px">'+ICON('bank','sm')+'Mettre en place le prélèvement</button>':'')+'</div>';
    h+=list.length?'<div class="list card">'+list.map(function(x){return '<div class="li"><span class="ico sm">'+ICON('invoice','sm')+'</span><div class="grow"><b>'+esc(x.label||x.number)+'</b><div class="xs mut">'+esc(x.number||'')+(x.issue_date?' · '+F.date(x.issue_date):'')+'</div></div><span class="num">'+eur(x.total_ttc)+'</span>'+invChip(x)+
      (x.amount_due>0&&x.kind!=='credit_note'?'<button class="btn pri sm" data-pay="'+esc(x.id)+'">Payer</button>':'')+(x.has_pdf?'<button class="btn ghost icon sm" data-pdf="'+esc(x.id)+'" title="Télécharger le PDF">'+ICON('download','sm')+'</button>':'')+'</div>'}).join('')+'</div>':U.empty('invoice','Aucune facture','Vos factures apparaîtront ici dès leur émission.');
    b.innerHTML=h;
    function pay(id,btn){btnBusy(btn,true);PL.post('/api/pay/invoice/'+encodeURIComponent(id),{}).then(function(r){if(r&&r.url)PL.openUrl(r.url);else{btnBusy(btn,false);P.toast('Le paiement n’a pas pu démarrer. Réessayez dans un instant.',{icon:'alert'})}},function(e){btnBusy(btn,false);
      /* paiement en ligne non activé (Stripe Connect absent ou incomplet) : message clair et solution */
      if(e&&(e.code==='connect_not_ready'||e.code==='stripe_not_configured'||e.status===409||e.status===503||e.unavailable)){var sh=P.sheet({title:'Paiement en ligne',icon:'card',body:'<p>'+esc(e.code==='nothing_due'?e.message:'Votre club n’a pas encore activé le paiement en ligne.')+'</p><p class="lv-note" style="margin-top:12px">'+esc(e.code==='nothing_due'?'Rechargez la page pour voir l’état à jour.':'Vous pouvez régler cette facture à l’accueil (chèque, espèces, carte ou virement). Elle passera en « Payée » dès que le club aura enregistré votre règlement.')+'</p>',foot:'<button class="btn pri" data-x2>J’ai compris</button>'});sh.querySelector('[data-x2]').onclick=function(){sh.close()};return}
      PL.fail(e,'Paiement')})}
    b.querySelectorAll('[data-pay]').forEach(function(x){x.onclick=function(){pay(x.getAttribute('data-pay'),x)}});
    var pa=b.querySelector('[data-payall]');if(pa)pa.onclick=function(){var o=due.sort(function(a,c){return String(a.due_date).localeCompare(String(c.due_date))})[0];pay(o.id,pa)};
    var sp=b.querySelector('[data-sepa]');if(sp)sp.onclick=function(){btnBusy(sp,true);PL.post('/api/pay/mandate',{}).then(function(r){PL.openUrl(r.url)},function(e){btnBusy(sp,false);PL.fail(e,'Prélèvement')})};
    b.querySelectorAll('[data-pdf]').forEach(function(x){x.onclick=function(){PL.download('/api/invoices/'+x.getAttribute('data-pdf')+'/pdf').catch(function(e){PL.fail(e,'PDF')})}})})}

/* ---------- Espace comptable ---------- */
function renderCptHome(el){screen(el,ph('Bonjour'+(PL.user&&PL.user.first?' '+esc(PL.user.first):''),'Espace comptable de '+esc(D.club.name)+'.'),function(){return PL.get('/api/invoices')},function(b,d){var list=d.invoices||d.items||d||[];
    var y=String(YEAR),inY=list.filter(function(x){return String(x.issue_date||'').slice(0,4)===y&&x.status!=='draft'}),ca=inY.filter(function(x){return x.kind!=='credit_note'}).reduce(function(s,x){return s+(x.total_ttc||0)},0),due=inY.reduce(function(s,x){return s+(x.amount_due||0)},0);
    b.innerHTML='<div class="g3 rise" style="margin-bottom:16px">'+U.kpi({label:'Facturé en '+y,count:Math.round(ca/100),fmt:'eur',icon:'invoice',dom:'argent'})+U.kpi({label:'Factures émises',value:inY.length,icon:'doc'})+U.kpi({label:'Reste à encaisser',count:Math.round(due/100),fmt:'eur',icon:'wallet'})+'</div>'+exportsCard();bindExports(b)})}
function renderCptInv(el){screen(el,ph('Factures','Lecture seule : les factures émises et leurs encaissements.'),function(){return PL.get('/api/invoices')},function(b,d){var list=(d.invoices||d.items||d||[]).filter(function(x){return x.status!=='draft'});
    b.innerHTML=list.length?U.table([{k:'n',l:'Numéro',f:function(x){return '<b class="num">'+esc(x.number)+'</b>'}},{k:'c',l:'Client',f:function(x){return esc(who(x))}},{k:'d',l:'Date',f:function(x){return x.issue_date?F.date(x.issue_date):''}},{k:'t',l:'TTC',n:true,f:function(x){return eur(x.total_ttc)}},{k:'s',l:'État',f:invChip}],list,{click:true,key:'id'}):U.empty('invoice','Aucune facture émise','');
    b.querySelectorAll('[data-row]').forEach(function(r){r.onclick=function(){var x=list.filter(function(y){return y.id===r.getAttribute('data-row')})[0];if(x)PL.invoiceSheet(x)}})})}
function renderCptExp(el){el.innerHTML=ph('Exports','FEC, journal des ventes et archives PDF.')+exportsCard();bindExports(el)}

/* ---------- Enregistrement ---------- */
P.mod({id:'lv-abonnement',role:'gerant',group:'Plateforme',title:'Abonnement',icon:'card',n:45,phoneTitle:'Abonnement',render:renderAbo});
P.mod({id:'lv-paiements',role:'gerant',group:'Argent',title:'Paiements en ligne',icon:'card',n:35,phoneTitle:'Paiements',render:renderPay});
P.mod({id:'lv-acces',role:'gerant',group:'Équipe',title:'Accès et invitations',icon:'shield',n:20,phoneTitle:'Accès',render:renderAccess});
P.mod({id:'lv-comptable',role:'gerant',group:'Argent',title:'Comptable',icon:'accounting',n:25,phoneTitle:'Comptable',render:renderAccountant});
P.mod({id:'lv-calendriers',role:'gerant',group:'Plateforme',title:'Calendriers',icon:'calendar_add',n:47,phoneTitle:'Calendriers',render:renderCal});
P.mod({id:'lv-cles',role:'gerant',group:'Plateforme',title:'Clés d’API',icon:'key',n:48,phoneTitle:'Clés d’API',render:renderKeys});
P.mod({id:'lv-cal-emp',role:'employe',group:'Moi',title:'Calendrier',icon:'calendar_add',n:60,render:renderCal});
P.mod({id:'lv-cal-coach',role:'coach',group:'Compte',title:'Calendrier',icon:'calendar_add',n:60,render:renderCal});
P.mod({id:'lv-cal-adh',role:'adherent',group:'Compte',title:'Calendrier',icon:'calendar_add',n:60,render:renderCal});
P.mod({id:'cpt-accueil',role:'comptable',group:'Comptabilité',title:'Accueil',icon:'today',n:10,short:'Accueil',render:renderCptHome});
P.mod({id:'cpt-factures',role:'comptable',group:'Comptabilité',title:'Factures',icon:'invoice',n:20,short:'Factures',render:renderCptInv});
P.mod({id:'cpt-exports',role:'comptable',group:'Comptabilité',title:'Exports',icon:'download',n:30,short:'Exports',render:renderCptExp});
P.mod({id:'cpt-cal',role:'comptable',group:'Compte',title:'Abonnement du club',icon:'card',n:40,render:renderAbo});
/* écrans de la démo remplacés par leur version branchée (même identifiant : les liens croisés continuent de marcher) */
/* Comptabilité : la démo affiche un compte bancaire fictif ; tant qu'aucune banque n'est reliée, on montre l'espace comptable réel */
function renderCompta(el,ctx){el.innerHTML='<div class="lv-msg info" style="margin-bottom:16px">'+ICON('info','sm')+'<span>Le rapprochement bancaire automatique arrive bientôt : aucun compte n’est encore relié à '+esc(PL.brandName())+'. Vos factures, encaissements et exports comptables sont ci-dessous.</span></div><div data-cpt></div>';renderAccountant(el.querySelector('[data-cpt]'),ctx)}
PL.replaced=[{id:'compta',render:renderCompta},{id:'facturation',render:renderInvoices},{id:'import',render:renderImport,title:'Importer'},{id:'adh-paiements',render:renderMyInvoices}];
/* chemins de retour de Stripe et liens directs */
PL.PATHS={'/abonnement':'lv-abonnement','/paiements-en-ligne':'lv-paiements','/mes-factures':'adh-paiements','/factures':'facturation','/calendriers':'lv-calendriers'};
PL.planBanner=function(m){if(document.querySelector('.lv-planbar'))return;var v=P.app()&&P.app().querySelector('.main .view');if(!v)return;var b=document.createElement('div');b.className='lv-banner lv-planbar';b.style.margin='10px 16px 0';b.style.background='var(--bad-pale)';b.style.color='var(--bad)';
  b.innerHTML=ICON('alert','sm')+'<span class="grow">'+esc(m||'Votre abonnement est en attente de paiement : les modifications sont suspendues.')+'</span>'+(PL.isManager()?'<button class="btn sm" data-go="lv-abonnement">Régulariser</button>':'');v.parentNode.insertBefore(b,v)};
})();
/* préférences d'e-mail (lot D : GET/PUT /api/mail/preferences), ouvertes par /reglages/notifications et le menu du compte */
(function(){var P=window.P,PL=window.PL,esc=P.fmt.esc;
PL.notifPrefs=function(){var sh=P.sheet({title:'E-mails et notifications',icon:'bell',body:function(b){b.innerHTML='<div class="lv-dots" style="padding:16px"><i></i><i></i><i></i></div>';
  PL.get('/api/mail/preferences').then(function(j){var cats=j.categories||[];
    b.innerHTML='<p class="lv-sub" style="margin-top:0">Envoyés à <b>'+esc(j.email||'')+'</b>.</p>'+(j.blocked?'<div class="lv-msg">'+ICON('alert','sm')+'<span>Les e-mails vers cette adresse sont bloqués (rebond ou signalement). <button class="lv-a" data-res type="button">Les réactiver</button></span></div>':'')+
      '<div class="list">'+cats.map(function(c){return '<div class="li"><div class="grow"><b>'+esc(c.label||c.key)+'</b></div>'+P.ui.tog(!!c.enabled,'np-'+c.key)+'</div>'}).join('')+'</div>'+
      (j.essential?'<p class="lv-note" style="margin-top:12px">Toujours envoyés : '+esc(String(j.essential).toLowerCase())+'.</p>':'');
    b.querySelectorAll('[id^="np-"]').forEach(function(t){t.setAttribute('data-manual','');t.onclick=function(){var on=t.getAttribute('aria-checked')!=='true';t.setAttribute('aria-checked',on);var o={};o[t.id.slice(3)]=on;
      PL.put('/api/mail/preferences',{categories:o}).then(function(){P.toast('Préférence enregistrée')},function(e){t.setAttribute('aria-checked',!on);PL.fail(e,'Notifications')})}});
    var r=b.querySelector('[data-res]');if(r)r.onclick=function(){PL.put('/api/mail/preferences',{resubscribe:true}).then(function(){P.toast('E-mails réactivés');sh.close()},function(e){PL.fail(e)})}},
    function(e){b.innerHTML='<div class="lv-msg">'+ICON('alert','sm')+'<span>'+esc(e.unavailable?'Les préférences d’e-mail arrivent très bientôt.':PL.msg(e))+'</span></div>'})}})};
})();
