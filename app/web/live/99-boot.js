/* =====================================================================
   PIAFFE LIVE · Démarrage
   GET /api/me → authentification, onboarding, choix du club, ou application.
   Les modules de la démo ne tournent qu'une fois (P.start aussi) : un changement de club recharge la page.
   ===================================================================== */
var D=window.DATA;
PL.runModules=function(){
  /* pendant l'exécution des modules seulement : une fiche absente (identifiant de la démo) donne une fiche vide
     au lieu d'arrêter le module entier ; le comportement normal revient ensuite */
  var ghost=!PL.sandbox&&PL.make&&!/probe=demo/.test(location.search),saved={};
  if(ghost)[['member','member'],['horse','horse'],['staffer','staff'],['coach','coach']].forEach(function(x){var f=D[x[0]];saved[x[0]]=f;
    D[x[0]]=function(i){var r=f.apply(D,arguments);if(r)return r;try{return PL.make[x[1]]({id:String(i==null?"":i),first:'',last:'',name:''})}catch(e){return {id:String(i),first:'',last:'',name:''}}}});
  PL.modq.forEach(function(m){try{m.run()}catch(e){console.error('module',m.file,e)}});PL.modq=[];
  Object.keys(saved).forEach(function(k){D[k]=saved[k]})};
if(/probe=demo/.test(location.search)){PL.keysBefore=Object.keys(DATA);PL.runModules();PL.keysAfter=Object.keys(DATA);P.start()}
else (function(){
var P=window.P,PL=window.PL,esc=P.fmt.esc;
var root=function(){var r=document.getElementById('lv-root');if(!r){r=document.createElement('div');r.id='lv-root';r.setAttribute('aria-live','polite');document.body.appendChild(r)}return r};
var started=false,routed=false;
PL.version=(window.PIAFFE_LIVE||{}).version;

function loading(text){document.body.classList.add('lv-booting');var r=root();if(r.querySelector('.lv-load')&&!text)return;
  r.innerHTML='<div class="lv-load"><div class="lv-lg">'+PL.brandLogo(64)+'<div class="lv-dots"><i></i><i></i><i></i></div>'+(text?'<p class="mut">'+esc(text)+'</p>':'')+'</div></div>'}
function fatal(title,text,retry){document.body.classList.add('lv-booting');var r=root();
  r.innerHTML='<div class="lv-load"><div class="lv-lg" style="max-width:420px;text-align:center;padding:0 16px">'+PL.brandLogo(56)+'<h2 style="margin:8px 0 0">'+esc(title)+'</h2><p class="mut">'+esc(text)+'</p><button class="btn pri" data-retry>'+ICON('refresh','sm')+'Réessayer</button></div></div>';
  r.querySelector('[data-retry]').onclick=retry||function(){location.reload()}}

var Q=new URLSearchParams(location.search),PATH=location.pathname.replace(/\/+$/,'')||'/';
function clean(path){try{history.replaceState(null,'',(path||'/')+location.hash)}catch(e){}}
var CACHE='piaffe:live:boot:';
function cacheBoot(b){try{localStorage.setItem(CACHE+PL.clubId,JSON.stringify(b))}catch(e){}}
function cachedBoot(id){try{return JSON.parse(localStorage.getItem(CACHE+id)||'null')}catch(e){return null}}

/* chemins à traiter avant tout : jetons, retours de migration, messages de connexion */
function special(){if(routed)return null;routed=true;
  var m;
  if((m=/^\/invitation\/([^/]+)$/.exec(PATH)))return {auth:'invite',o:{token:decodeURIComponent(m[1])},always:true};
  if(PATH==='/nouveau-mot-de-passe'&&Q.get('token'))return {auth:'reset',o:{token:Q.get('token')},always:true};
  if((m=/^\/reset\/([^/]+)$/.exec(PATH)))return {auth:'reset',o:{token:decodeURIComponent(m[1])},always:true};
  if((PATH==='/verifier-email'||PATH==='/verify')&&Q.get('token'))return {auth:'verifyToken',o:{token:Q.get('token')},always:true};
  if((m=/^\/verify\/([^/]+)$/.exec(PATH)))return {auth:'verifyToken',o:{token:decodeURIComponent(m[1])},always:true};
  if(Q.get('migration')&&Q.get('migration')!=='1'){PL.migReturn={etat:/^(termine|fini)$/.test(Q.get('migration'))?'termine':'abandon',job:Q.get('job')||null};clean(PATH==='/configuration'?'/':PATH)}
  var e=Q.get('erreur'),a=Q.get('activation');
  if(e||a){var t=a?PL.AUTH_ERR['activation:'+a]:PL.AUTH_ERR[e];PL.authMsg=t||'La connexion n’a pas abouti. Réessayez.';PL.authMsgKind=a==='deja'?'info':'';}
  if(PATH==='/bienvenue'&&Q.get('migration')==='1')PL.welcomeMigrated=true;
  return null}

PL.start=function(o){o=o||{};if(started){location.reload();return}
  loading();
  var sp=special();
  if(sp&&sp.always){return PL.get('/api/me').then(function(me){PL.user=me.user;PL.clubs=me.clubs||[]},function(){PL.user=null}).then(function(){PL.auth(sp.auth,sp.o)})}
  PL.get('/api/me').then(function(me){afterMe(me,o)},function(e){
    if(e.status===401){PL.user=null;var v={'/inscription':'signup','/mot-de-passe-oublie':'forgot','/lien-magique':'magic'}[PATH]||'login';
      if(v==='login'&&PATH!=='/connexion'&&PATH!=='/'&&!/^\/(inscription)/.test(PATH))PL.authNext=PATH+location.search;
      var opt={};if(PL.authMsg){opt[PL.authMsgKind==='info'?'info':'error']=PL.authMsg;PL.authMsg=null}if(o.info)opt.info=o.info;
      PL.auth(v,opt);return}
    if(e.offline){var last=null;try{last=localStorage.getItem('piaffe:live:club')}catch(x){}var b=last&&cachedBoot(last);
      if(b){PL.clubId=last;PL.offlineBoot=true;PL.user=(b.me&&b.me.user)||{};launch(b,b.me&&b.me.role||'member');return}
      fatal('Pas de connexion','Impossible de joindre '+PL.brandName()+'. Vérifiez votre réseau, puis réessayez.',function(){started=false;routed=true;PL.start(o)});return}
    fatal('Service momentanément indisponible',PL.msg(e))})};

function afterMe(me,o){PL.user=me.user||{};PL.clubs=me.clubs||[];
  if(PL.authMsg){try{setTimeout(function(){P.toast(esc(PL.authMsg),{icon:'info',ms:5200})},1500)}catch(e){}PL.authMsg=null}
  if(/^\/(connexion|inscription|mot-de-passe-oublie|lien-magique)$/.test(PATH))clean('/');
  if(PL.justSignedUp&&PL.user&&PL.user.email_verified===false&&!PL.verifySeen){PL.verifySeen=true;PL.auth('verify',{});return}
  var newclub=false;try{newclub=localStorage.getItem('piaffe:live:newclub')==='1'}catch(e){}
  if(!PL.clubs.length||newclub){try{localStorage.removeItem('piaffe:live:newclub')}catch(e){}PL.clubId=null;PL.onboarding({});return}
  var want=PL.wantClub||me.current_club_id;var known=PL.clubs.filter(function(c){return c.id===want})[0];
  if(!known&&PL.clubs.length===1)known=PL.clubs[0];
  if(!known){chooseClub();return}
  PL.clubId=known.id;try{localStorage.setItem('piaffe:live:club',known.id)}catch(e){}
  var sw=known.id!==me.current_club_id?PL.post('/api/me/club',{club_id:known.id}).catch(function(){}):Promise.resolve();
  var role=known.role||me.role||'member';PL.role=role;
  sw.then(function(){return PL.isManager&&isMgr(role)?PL.get('/api/onboarding').catch(function(e){return null}):null}).then(function(onb){
    PL.onbData=onb||null;PL.tasks=(onb&&onb.tasks)||[];
    if(onb&&isMgr(role)&&!onb.completed&&!onb.sandbox){var a=onb.answers||{};PL.onboarding({answers:a,step:onb.step,skipHello:!!a.name});return}
    if(PL.migReturn&&onb&&!onb.completed){PL.onboarding({answers:onb.answers||{},step:'recuperer'});return}
    return PL.get('/api/club/bootstrap').then(function(b){cacheBoot(b);launch(b,(b.me&&b.me.role)||role)},function(e){
      if(e.status===402){PL.planInactive=true}
      var c=cachedBoot(PL.clubId);if(c&&(e.offline||e.status>=500)){PL.offlineBoot=!!e.offline;launch(c,role);return}
      fatal('Impossible de charger votre club',PL.msg(e))})}).catch(function(e){console.error(e);fatal('Une erreur est survenue',PL.msg(e))})}
function isMgr(r){return r==='owner'||r==='manager'}

function chooseClub(){document.body.classList.add('lv-booting');var r=root();
  r.innerHTML='<div class="lv-load"><div class="lv-card" style="max-width:480px;width:calc(100% - 32px)"><div style="margin-bottom:14px">'+PL.brandHTML(26)+'</div><h2>Choisissez un club</h2><p class="lv-sub">Votre compte a accès à plusieurs structures.</p><div class="lv-opts" style="grid-template-columns:1fr">'+
    PL.clubs.map(function(c,i){return '<button class="lv-opt row" data-c="'+esc(c.id)+'" style="--i:'+i+'"><span class="ico">'+ICON('stable')+'</span><span><b>'+esc(c.name)+'</b><br><small>'+esc(({owner:'Gérant',manager:'Gérant',staff:'Équipe',coach:'Coach',member:'Adhérent',accountant:'Comptable'})[c.role]||c.role||'')+'</small></span></button>'}).join('')+
    '</div><p class="lv-foot"><button class="lv-a" data-new type="button">Créer un nouveau club</button></p></div></div>';
  r.querySelectorAll('[data-c]').forEach(function(b){b.onclick=function(){PL.wantClub=b.getAttribute('data-c');started=false;PL.start()}});
  r.querySelector('[data-new]').onclick=function(){PL.clubId=null;PL.onboarding({skipHello:false})}}

/* données à jour sans recharger la page (après un import, une migration) */
PL.reloadData=function(){var f=PL.sync&&PL.sync.flush?PL.sync.flush().catch(function(){}):Promise.resolve();return f.then(function(){return PL.get('/api/club/bootstrap')}).then(function(b){cacheBoot(b);PL.server=b.data||{};PL.versions=b.versions||{};
  Object.keys(PL.server).forEach(function(k){if(k==='club')return;PL.setColl(k,PL.server[k])});PL.derive();
  if(PL.sync&&PL.sync.takeSnapshot&&!PL.sync.pending())PL.sync.takeSnapshot();try{P.rerender()}catch(e){}return b})};
/* fiche légale du club (Réglages) → colonnes du club côté serveur */
PL.saveClubLegal=function(c){c=c||D.club||{};if(!PL.isManager||!PL.isManager())return Promise.resolve();
  var siret=String(c.siret||'').replace(/\D/g,''),body={name:c.name||undefined,email:c.email||undefined,phone:c.phone||undefined,ffe:c.ffe||undefined};
  if(siret.length===14)body.siret=siret;if(c.tva)body.vat_number=c.tva;
  if(c.addr||c.address){var a=typeof c.address==='object'&&c.address?c.address:{line1:c.addr||c.address};body.address=a}
  return PL.patch('/api/onboarding/club',body).catch(function(e){if(e&&e.status===400)try{P.toast(esc(PL.msg(e)),{icon:'alert'})}catch(x){}})};

/* lancement de l'application */
function launch(b,role){
  var st=(b.club&&b.club.settings)||{};PL.sandbox=!!st.sandbox;
  PL.applyBoot(b);
  if(PL.sandbox&&PL.demoToday){try{D.today=new Date(PL.demoToday)}catch(e){}}
  PL.applyModulesOff(st.modulesOff||{});
  var view=PL.VIEW[role]||'adherent';
  var inv=(view==='gerant'||view==='comptable'||view==='adherent')&&PL.loadInvoices?PL.loadInvoices().catch(function(){}):Promise.resolve();
  PL.runModules();
  if(!PL.sandbox)PL.afterModules();else PL.derive();
  PL.patchModules();
  PL.setView(role);
  /* chemin d'arrivée → écran */
  var path=PATH,go=PL.PATHS&&PL.PATHS[path];
  var SPEC={'/reglages/import':{gerant:'import'},'/reservations':{adherent:'adh-reserver',coach:'coach-agenda',gerant:'planning',employe:'emp-planning'},'/bienvenue':{adherent:'adh-bienvenue',employe:'emp-bienvenue'},'/reglages':{gerant:'reglages'}};
  if(!go&&SPEC[path])go=SPEC[path][PL.view];
  if(go&&P.mods[go]&&P.mods[go].role===PL.view){P.state.route=go;try{history.replaceState(null,'','/#'+go)}catch(e){}}
  else if(path!=='/'&&!/^\/(configuration|reglages\/notifications|migration|donnees-reprises)$/.test(path))clean('/');
  PL.onShell();
  var ready=function(){
    PL.ready=true;started=true;
    try{P.start()}catch(e){console.error('P.start',e)}
    document.body.classList.remove('lv-booting');var rt=root();if(rt)rt.innerHTML='';
    PL.decorate();
    try{PL.sync.start()}catch(e){console.error('sync',e)}
    try{if('serviceWorker' in navigator&&(location.protocol==='https:'||location.hostname==='localhost'))navigator.serviceWorker.register('/sw.js').catch(function(){})}catch(e){}
    if(PL.sandbox&&PL.sandboxBanner)PL.sandboxBanner();
    if(PL.planInactive&&PL.planBanner)PL.planBanner();
    if(PL.offlineBoot)try{P.toast('Hors ligne : vous consultez la dernière version enregistrée.',{icon:'wifi',ms:5200})}catch(e){}
    if(!PL.sandbox)setTimeout(function(){try{PL.loadWeather()}catch(e){}},1200);
    inv.then(function(){try{P.rerender()}catch(e){}});
    after(path)};
  /* three.js arrive par le CDN (defer) : on attend un peu, sans bloquer au-delà de 3 s */
  var t0=Date.now();(function wait(){if(window.THREE||Date.now()-t0>3000||document.readyState==='complete'&&Date.now()-t0>400)ready();else setTimeout(wait,60)})();
}
function after(path){
  var M=PL.onbData&&PL.onbData.answers&&PL.onbData.answers.migration;
  if(path==='/reglages/notifications')setTimeout(function(){PL.notifPrefs()},400);
  if(path==='/migration'&&PL.isManager())setTimeout(function(){PL.mig.launch({})},400);
  if(PL.migReturn){var r=PL.migReturn;PL.migReturn=null;if(r.etat==='termine')setTimeout(function(){PL.mig.showBilan(r.job)},500)}
  if(PL.freshOnboarding){PL.freshOnboarding=false;setTimeout(function(){try{P.toast('Votre espace est prêt. Suivez la liste de démarrage pour bien commencer.',{ms:5200})}catch(e){}
    if(M&&M.etat==='termine'&&PL.campaignSheet)setTimeout(function(){PL.campaignSheet({source:(M.tools||[]).filter(function(t){return t.action==='replace'}).map(function(t){return t.id})[0]})},1200)},900)}
  if(PL.welcomeMigrated)setTimeout(function(){try{P.toast('Bienvenue ! Vos reprises, vos factures et votre cheval vous attendent ici.',{ms:5200})}catch(e){}},900);
}

/* retour navigateur sur les écrans d'authentification gérés par 50-auth ; démarrage */
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){PL.start()});else PL.start();
})();
