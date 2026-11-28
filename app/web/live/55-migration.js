/* =====================================================================
   PIAFFE LIVE · Changer de logiciel ou le garder et le connecter
   Catalogue : window.PIAFFE_MIG (migration/core/logiciels.mjs et parcours.mjs, intégrés au build),
   sinon un catalogue de repli. La récupération des données est faite par la passerelle du fil
   migration, servie sur /migration/ et ouverte ici en plein écran (iframe) :
     /migration/?source=<id>&adresse=<url>&retour=<url>&outils=<ids>
   Fin : message {type:"piaffe-migration", etat:"termine"|"abandon", job_id, controle} de même origine,
   ou redirection vers retour?migration=termine&job=<id>. Bilan : GET /api/v1/import/jobs/:id.
   ===================================================================== */
(function(){
var P=window.P,PL=window.PL,esc=P.fmt.esc;
var MIG=function(){return window.PIAFFE_MIG||{}};

/* choix proposés à l'écran (demande de Marceau), dans cet ordre ; id = id du catalogue migration */
var PICK=[['kavalog','Kavalog'],['equimondo','Equimondo'],['pegase','Pégase'],['excel','Excel ou Google Sheets'],['papier','Papier'],
  ['pennylane','Pennylane'],['tiime','Tiime'],['indy','Indy'],['qonto','Qonto'],['sumup','SumUp'],['helloasso','HelloAsso'],
  ['ffe','FFE / FFE Club SIF'],['google-agenda','Google Agenda']];
/* famille de repli quand le catalogue ne connaît pas l'outil */
var FALLBACK={kavalog:'equestre',equimondo:'equestre',pegase:'equestre',excel:'tableurs','google-sheets':'tableurs',papier:'papier',
  pennylane:'compta',tiime:'compta',indy:'compta',qonto:'banque',sumup:'adhesions',helloasso:'adhesions',ffe:'federation','google-agenda':'agenda',autre:'equestre'};
var REPLACE_FAM={equestre:1,tableurs:1,papier:1};
var ICO={equestre:'stable',tableurs:'grid',papier:'doc',compta:'accounting',banque:'wallet',adhesions:'card',federation:'trophy',agenda:'calendar_add',rh:'team'};

function cat(){return MIG().LOGICIELS||{}}
function fam(id){var l=cat()[id];return (l&&l.famille)||FALLBACK[id]||'equestre'}
function nameOf(id,fb){var p=PICK.filter(function(x){return x[0]===id})[0];if(p)return p[1];var l=cat()[id];return (l&&l.nom)||fb||id}
/* recommandation : parcours.mjs (decisionRecommandee, selon la relation du catalogue), sinon règle par famille.
   Demande explicite de Marceau : un agenda, un outil de compta, de banque, d'encaissement ou la FFE se garde et se connecte. */
var KEEP_IDS={pennylane:1,tiime:1,indy:1,qonto:1,sumup:1,helloasso:1,ffe:1,'google-agenda':1};
function recommend(id){if(KEEP_IDS[id]&&possible(id).indexOf('integrate')>=0)return 'integrate';
  var f=MIG().decisionRecommandee;if(typeof f==='function'&&cat()[id]){try{var d=f(id);if(d==='changer')return 'replace';if(d==='integrer')return 'integrate'}catch(e){}}
  var l=cat()[id],r=l&&l.relation;if(r==='remplace')return 'replace';if(r==='branche')return 'integrate';
  return REPLACE_FAM[fam(id)]?'replace':'integrate'}
/* décisions permises pour un outil (un logiciel de gestion équestre ne se « connecte » pas) */
function possible(id){var f=MIG().decisionsPossibles;if(typeof f==='function'&&cat()[id]){try{var l=f(id).map(function(d){return d==='changer'?'replace':'integrate'});if(l.length)return l}catch(e){}}return ['replace','integrate']}
function effect(id,action){var f=MIG().effetPour;if(typeof f!=='function')return '';try{return f(id,action==='replace'?'changer':'integrer')||''}catch(e){return ''}}
function logo(id){var L=MIG().LOGOS;var v=L&&L[id];if(!v)return '';if(typeof v==='object')v=v.svg||v.src||v.data||'';if(!v)return '';
  if(/^\s*<svg/i.test(v))return '<span class="lv-logo" aria-hidden="true">'+v+'</span>';
  if(/^(data:|https?:|\/)/.test(v))return '<img class="lv-logo" alt="" src="'+esc(v)+'">';return ''}
/* pastilles maison quand l'éditeur n'a pas de logo dans le catalogue (couleur de la marque, initiales) */
var TILE={excel:['#1d6f42','grid'],'google-sheets':['#188038','grid'],papier:['#b08550','doc'],qonto:['#1d1d2b','Q'],pegase:['#8b1d2c','P'],ffe:['#0b3c8c','FFE'],
  'google-agenda':['#1a73e8','calendar_add'],autre:['#59627c','swap']};
function tile(id){var t=TILE[id];if(!t)return '';var inner=/^[A-Z]+$/.test(t[1])?'<b style="font:800 '+(t[1].length>2?'8.5':'12.5')+'px/1 var(--f-display);letter-spacing:-.02em;color:#fff">'+t[1]+'</b>':ICON(t[1],'sm').replace('class="i','style="width:15px;height:15px;color:#fff" class="i');
  return '<span class="lv-logo lv-tile" aria-hidden="true" style="background:'+t[0]+'">'+inner+'</span>'}
function icon(id){return logo(id)||tile(id)||ICON(ICO[fam(id)]||'swap')}

/* recherche dans le catalogue complet, pour « autre » */
function search(q){q=(q||'').trim().toLowerCase();if(q.length<2)return [];var out=[];
  Object.keys(cat()).forEach(function(id){var l=cat()[id];if((l.nom||'').toLowerCase().indexOf(q)>=0||id.indexOf(q)>=0)out.push({id:id,nom:l.nom,famille:l.famille})});return out.slice(0,6)}

/* réponses au format de migration/core/parcours.mjs :
   {depart:'oui'|'zero'|'tableur', principal, adresse, outils:[id], choix:{id:'changer'|'integrer'}} */
function reponses(M){var tools=(M&&M.tools)||[];if(!M||!M.uses||!tools.length)return {depart:'zero',outils:[],choix:{}};
  var known=tools.filter(function(t){return cat()[t.id]});
  var main=known.filter(function(t){return t.action==='replace'&&fam(t.id)==='equestre'})[0];
  var sheet=!main&&known.filter(function(t){return t.action==='replace'&&(fam(t.id)==='tableurs'||fam(t.id)==='papier')})[0];
  var r={depart:main?'oui':sheet?'tableur':'oui',principal:main?main.id:null,adresse:M.adresse||null,outils:[],choix:{}};
  if(!main&&!sheet&&tools.some(function(t){return t.id==='autre'&&t.action==='replace'})&&M.adresse)r.depart='oui';
  known.forEach(function(t){if(main&&t.id===main.id)return;r.outils.push(t.id);r.choix[t.id]=t.action==='replace'?'changer':'integrer'});
  return r}
/* plan de bascule : planDeBascule du fil migration s'il est livré, sinon calcul local ; ids pour le serveur, détail pour l'écran */
function plan(M){var tools=(M&&M.tools)||[],f=MIG().planDeBascule,ids=function(l){return (l||[]).map(function(x){return x&&typeof x==='object'?x.id:x}).filter(Boolean)};
  if(typeof f==='function'){try{var p=f(reponses(M));if(p&&typeof p==='object')return {recuperer:ids(p.recuperer),brancher:ids(p.brancher),resilier:ids(p.resilier),detail:p}}catch(e){console.warn('planDeBascule',e)}}
  var rec=tools.filter(function(t){return t.action==='replace'}),br=tools.filter(function(t){return t.action==='integrate'});
  return {recuperer:rec.map(function(t){return t.id}),brancher:br.map(function(t){return t.id}),
    resilier:rec.filter(function(t){return ['excel','google-sheets','papier'].indexOf(t.id)<0}).map(function(t){return t.id}),local:true}}

/* ---------- passerelle de migration ---------- */
var passOK=null;
function available(){if(passOK!==null)return Promise.resolve(passOK);
  return fetch('/migration/',{credentials:'same-origin'}).then(function(r){if(!r.ok)return false;return r.text().then(function(t){return !/name="piaffe-version"/.test(t)})}).catch(function(){return false}).then(function(v){passOK=v;return v})}
function url(o){var q=new URLSearchParams();q.set('source',o.source||'autre');if(o.adresse)q.set('adresse',o.adresse);
  q.set('retour',o.retour||location.origin+'/donnees-reprises');if(o.outils&&o.outils.length)q.set('outils',o.outils.join(','));return '/migration/?'+q.toString()}
/* ouvre la passerelle en plein écran ; résout {etat, job_id, controle} */
function open(o){o=o||{};return available().then(function(ok){
  if(!ok){var e=PL.err(404,'unavailable','',{unavailable:true});throw e}
  return new Promise(function(res){
    var w=document.createElement('div');w.className='lv-migframe';w.setAttribute('role','dialog');w.setAttribute('aria-label','Récupération de vos données');
    w.innerHTML='<div class="lv-migbar">'+PL.brandHTML(22)+'<span class="grow"><b>Récupération de vos données</b><small>'+esc(o.title||'Depuis votre ancien logiciel')+'</small></span><button class="btn ghost" data-close>'+ICON('x','sm')+'<span>Fermer</span></button></div><iframe title="Passerelle de migration" src="'+esc(url(o))+'"></iframe>';
    document.body.appendChild(w);document.documentElement.classList.add('lv-noscroll');
    var done=false;function end(v){if(done)return;done=true;window.removeEventListener('message',onMsg);document.removeEventListener('keydown',onKey);w.classList.add('out');setTimeout(function(){w.remove();document.documentElement.classList.remove('lv-noscroll')},260);res(v)}
    function onMsg(ev){if(ev.origin!==location.origin)return;var d=ev.data;if(!d||d.type!=='piaffe-migration')return;
      /* contrat : etat « fini » (valeur actuelle) ou « termine » (première version), ou « abandon » */
      if(d.etat==='fini'||d.etat==='termine')end({etat:'termine',job_id:d.job_id||null,controle:d.controle||null});else if(d.etat==='abandon')end({etat:'abandon',job_id:d.job_id||null})}
    function onKey(ev){if(ev.key==='Escape')end({etat:'abandon'})}
    window.addEventListener('message',onMsg);document.addEventListener('keydown',onKey);
    w.querySelector('[data-close]').onclick=function(){end({etat:'abandon'})};
    /* la passerelle peut aussi revenir par redirection dans l'iframe : on la repère */
    var f=w.querySelector('iframe');f.addEventListener('load',function(){try{var l=f.contentWindow.location;if(l.origin===location.origin&&/[?&]migration=/.test(l.search)){var p=new URLSearchParams(l.search);end({etat:/^(termine|fini)$/.test(p.get('migration'))?'termine':'abandon',job_id:p.get('job')})}}catch(x){}});
  })})}

function job(id){return PL.get('/api/v1/import/jobs/'+encodeURIComponent(id))}
var COLL={members:'adhérents',horses:'chevaux',forfaits:'forfaits',invoices:'factures',payments:'règlements',lessons:'reprises',care:'soins',staff:'membres de l’équipe',contracts:'contrats',families:'familles'};
function bilanHTML(j){var r=j&&(j.report||j)||{},c=r.counts||{},t=r.totals||{};
  var rows=Object.keys(c).filter(function(k){var x=c[k];return x&&(x.created||x.updated||x.merged)}).map(function(k){var x=c[k];var n=(x.created||0)+(x.updated||0)+(x.merged||0);
    return '<li><b>'+n+'</b> '+esc(COLL[k]||k)+(x.updated||x.merged?' <span class="mut">(dont '+((x.updated||0)+(x.merged||0))+' mis à jour)</span>':'')+'</li>'});
  var w=(r.warnings||[]).length;
  return '<div class="lv-msg ok">'+ICON('checkc','sm')+'<span>'+(j.status==='committed'?'Vos données sont dans '+esc(PL.brandName())+'.':j.status==='simulated'?'Essai à blanc terminé : rien n’est encore enregistré.':'Récupération en cours de traitement.')+'</span></div>'+
    (rows.length?'<ul class="lv-bilan">'+rows.join('')+'</ul>':'<p class="mut">Aucune donnée reprise pour le moment.</p>')+
    (w?'<p class="mut" style="margin-top:8px">'+w+' point'+(w>1?'s':'')+' à vérifier, listé'+(w>1?'s':'')+' dans votre liste de démarrage.</p>':'')+(t.errors?'<p class="mut">'+t.errors+' ligne'+(t.errors>1?'s':'')+' non reprise'+(t.errors>1?'s':'')+'.</p>':'')}

/* lancement depuis l'application (liste de démarrage, palette, écran Import) */
function launch(o){o=o||{};var M=(PL.onbData&&PL.onbData.answers&&PL.onbData.answers.migration)||{};
  var rec=(M.tools||[]).filter(function(t){return t.action==='replace'});var src=o.source||(rec[0]&&rec[0].id)||'autre';
  return open({source:src,adresse:o.adresse||M.adresse,outils:o.outils||rec.map(function(t){return t.id}),retour:location.origin+'/donnees-reprises',title:'Depuis '+nameOf(src,'votre ancien logiciel')}).then(function(v){
    if(v.etat==='termine'){if(PL.doneTask)try{PL.doneTask('migration')}catch(e){}return showBilan(v.job_id)}},
    function(e){if(e&&e.unavailable){try{P.toast('La récupération guidée arrive très bientôt : en attendant, déposez votre fichier d’export.',{icon:'info',ms:5200})}catch(x){}P.go('import');return}PL.fail(e,'Migration')})}
function showBilan(id){if(!id){if(PL.reloadData)PL.reloadData();return}
  return job(id).then(function(j){var sh=P.sheet({title:'Bilan de la récupération',icon:'import',body:bilanHTML(j),foot:(j&&j.status==='committed'&&PL.campaignSheet?'<button class="btn ghost" data-cp>Prévenir mes adhérents</button>':'')+'<button class="btn pri" data-ok>Voir mes données</button>'});var b=sh.querySelector('[data-ok]');if(b)b.onclick=function(){sh.close()};var cp=sh.querySelector('[data-cp]');if(cp)cp.onclick=function(){PL.campaignSheet({source:j.source})};if(PL.reloadData)PL.reloadData()},function(){if(PL.reloadData)PL.reloadData()})}

PL.mig={PICK:PICK,fam:fam,nameOf:nameOf,recommend:recommend,possible:possible,effect:effect,reponses:reponses,icon:icon,search:search,plan:plan,available:available,url:url,open:open,job:job,bilanHTML:bilanHTML,launch:launch,showBilan:showBilan,
  hasCatalogue:function(){return !!MIG().LOGICIELS}};
})();
/* campagne d'accueil des adhérents après une migration (lot D : POST/GET /api/migration/campagne) */
(function(){var P=window.P,PL=window.PL,esc=P.fmt.esc;
PL.campaignSheet=function(o){o=o||{};var d=new Date(Date.now()+864e5);var def=PL.isoDay(d);
  var sh=P.sheet({title:'Prévenir vos adhérents',icon:'mail',body:function(b){
    b.innerHTML='<p class="lv-sub" style="margin-top:0">Chaque adhérent ayant une adresse e-mail reçoit une annonce, puis son lien d’activation : il retrouve ses reprises, ses factures et son cheval sur son téléphone.</p>'+
      '<div class="lv-f"><label class="lv-fl"><span>Date d’envoi</span><input class="in" type="date" id="cp-d" value="'+def+'" min="'+PL.isoDay()+'"></label><div class="lv-msgs"></div></div><div class="lv-cp-state"></div>';
    PL.get('/api/migration/campagne').then(function(j){var c=(j.campagnes||[])[0];if(!c)return;var s=c.suivi||{};
      b.querySelector('.lv-cp-state').innerHTML='<div class="lv-msg info">'+ICON('info','sm')+'<span>Campagne du '+esc(String(c.date_envoi||'').slice(0,10).split('-').reverse().join('/'))+' : '+(s.cibles||0)+' adhérents, '+(s.envoyes||0)+' e-mails envoyés, '+(s.actives||0)+' accès activés.</span></div>'},function(){})},
    foot:'<button class="btn ghost" data-no>Plus tard</button><button class="btn pri" data-go>Programmer l’envoi</button>'});
  sh.querySelector('[data-no]').onclick=function(){sh.close()};
  sh.querySelector('[data-go]').onclick=function(){var btn=this,dv=sh.querySelector('#cp-d').value||def;btn.disabled=true;
    PL.post('/api/migration/campagne',{date_envoi:dv,cibles:'tous',logiciel_precedent:o.source||undefined}).then(function(r){var c=r.campagne||{};sh.close();
      P.toast((c.cibles||0)+' adhérent'+((c.cibles||0)>1?'s':'')+' seront prévenus le '+dv.split('-').reverse().join('/')+(c.sans_email?' ; '+c.sans_email+' sans adresse e-mail':'')+'.',{ms:6000});if(PL.doneTask)try{PL.doneTask('campaign')}catch(e){}},
      function(e){btn.disabled=false;var m=sh.querySelector('.lv-msgs');m.innerHTML='<div class="lv-msg">'+ICON('alert','sm')+'<span>'+esc(e.unavailable?'L’envoi groupé arrive très bientôt sur votre espace.':PL.msg(e))+'</span></div>'})}};
})();
