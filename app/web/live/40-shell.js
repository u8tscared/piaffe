/* =====================================================================
   PIAFFE LIVE · Coque de l'application vendue
   - une seule vue par rôle (pas de sélecteur de rôles libre)
   - bouton de compte (profil, club, thème, déconnexion) et pastille d'enregistrement
   - écrans masqués partagés par tout le club (réglages enregistrés sur le serveur)
   - liste de démarrage sur l'accueil, bandeau du club d'exemple
   ===================================================================== */
(function(){
var P=window.P,D=window.DATA,PL=window.PL,esc=P.fmt.esc;

/* ---------- Rôle → vue ---------- */
PL.VIEW={owner:'gerant',manager:'gerant',staff:'employe',coach:'coach',member:'adherent',accountant:'comptable',provider:'pro'};
P.roles.comptable={label:'Comptable',icon:'accounting',who:'me',home:'cpt-accueil',tabs:['cpt-accueil','cpt-factures','cpt-exports']};
P.groups.comptable=['Comptabilité','Compte'];
P.domGroups['Comptabilité']='mo';
PL.setView=function(role){PL.view=PL.VIEW[role]||'adherent';P.state.role=PL.view;P.state.route=null;
  var h=(location.hash||'').slice(1);if(h&&(!P.mods[h]||P.mods[h].role!==PL.view)){try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}}};

/* navigation : jamais vers un écran d'un autre rôle */
var go0=P.go;
P.go=function(route,params,opts){var m=P.mods[route];if(!m)return;
  if(PL.view&&m.role!==PL.view){var alt=PL.ALIAS[PL.view]&&PL.ALIAS[PL.view][route];if(alt&&P.mods[alt])return go0.call(P,alt,params,opts);
    P.toast('Cet écran n’est pas disponible avec votre accès.',{icon:'lock'});return}
  return go0.call(P,route,params,opts)};
/* équivalents d'un écran d'un autre rôle (lien croisé d'un module) */
PL.ALIAS={adherent:{cheval:'adh-cheval',planning:'adh-reserver',facturation:'adh-paiements',contrats:'adh-contrats'},employe:{cheval:'emp-cheval',planning:'emp-planning',soins:'emp-soins',chevaux:'emp-chevaux',connecteurs:'lv-connecteurs-emp'},coach:{planning:'coach-agenda'}};

/* ---------- Écrans masqués : partagés par le club ---------- */
var setOff0=P.prefs.setOff;
P.prefs.setOff=function(role,list){setOff0.call(P.prefs,role,list);
  if(PL.isManager()&&!PL.sandboxLocal){var o={};o[role]=list;PL.put('/api/onboarding/modules',{modulesOff:o}).catch(function(e){if(!e.offline)PL.fail(e,'Écrans masqués')})}};
PL.applyModulesOff=function(off){off=off||{};
  /* « Connecteurs » était masqué d'office tant que l'écran n'était qu'une simulation : il est désormais branché (MCP), on le remontre une fois par club */
  var g=off.gerant,mk='piaffe:live:cn-on:'+(PL.clubId||''),seen=true;try{seen=!!localStorage.getItem(mk)}catch(e){}
  if(!seen&&Array.isArray(g)&&g.indexOf('connecteurs')>=0){off.gerant=g.filter(function(x){return x!=='connecteurs'});if(PL.isManager()&&!PL.sandboxLocal)PL.put('/api/onboarding/modules',{modulesOff:{gerant:off.gerant}}).catch(function(){})}
  try{localStorage.setItem(mk,'1')}catch(e){}
  Object.keys(P.roles).forEach(function(r){if(Array.isArray(off[r]))P.store.set('off:'+r,off[r])})};
PL.isManager=function(){return PL.role==='owner'||PL.role==='manager'};

/* ---------- Écrans de la démo remplacés ou retouchés après chargement ---------- */
PL.patchModules=function(){
  /* palette : nos actions de secours s'effacent devant celles des modules qui portent le même nom */
  for(var ai=P.actions.length-1;ai>=0;ai--){var A0=P.actions[ai];if(A0.lv&&P.actions.some(function(x){return !x.lv&&x.role===A0.role&&x.label===A0.label}))P.actions.splice(ai,1)}
var first=(PL.user&&PL.user.first)||'';
  Object.keys(P.mods).forEach(function(id){var m=P.mods[id];if(m.phoneTitle&&/^Bonjour\b/.test(m.phoneTitle))m.phoneTitle=first?'Bonjour '+first:'Bonjour'});
  if(P.mods['adh-cheval']){var mine=(D.horses||[]).filter(function(h){return PL.personRef&&h.owner===PL.personRef})[0];P.mods['adh-cheval'].short=mine?mine.name.split(' ')[0]:'Mon cheval';P.mods['adh-cheval'].phoneTitle=mine?mine.name:'Mon cheval'}
  if(P.mods.assistant){P.mods.assistant.title='Assistant';P.mods.assistant.short='Assistant';P.mods.assistant.phoneTitle='Assistant'}
  /* écrans dont la version branchée remplace la simulation de la démo */
  (PL.replaced||[]).forEach(function(r){var m=P.mods[r.id];if(!m){P.mod(Object.assign({role:'gerant',group:r.group||'Plateforme',title:r.title,icon:r.icon,n:r.n||50},{id:r.id,render:r.render}));return}
    m.render=r.render;m.__lv=true;if(r.title)m.title=r.title;if(r.icon)m.icon=r.icon;m.badge=null});
  /* l'accueil du gérant affiche la liste de démarrage */
  var ck=P.mods.cockpit;if(ck&&!ck.__lvTodo){var r0=ck.render;ck.__lvTodo=true;ck.render=function(el,ctx){r0.call(this,el,ctx);try{PL.renderTodo(el)}catch(e){console.warn(e)}}}
  /* les modules ont souvent un bouton d'action principal : rien de plus à faire ici */
};

/* ---------- Liste de démarrage (accueil du gérant) ---------- */
PL.tasks=[];
function autoDone(t){if(t.done||t.dismissed)return true;
  if(t.id==='horses')return (D.horses||[]).length>0;if(t.id==='members')return (D.members||[]).length>0;if(t.id==='lessons')return (D.lessons||[]).length>0;
  if(t.id==='accountant')return !!PL.accountantInvited;return false}
PL.renderTodo=function(el){if(!PL.isManager()||!PL.tasks.length)return;var list=PL.tasks.filter(function(t){return !t.dismissed}),done=list.filter(autoDone).length;if(done>=list.length||P.prefs.get('todo:hide:'+PL.clubId,false))return;
  var pct=Math.round(done/list.length*100),box=document.createElement('div');box.className='lv-todo-wrap';
  box.innerHTML='<div class="card lv-todo d-acc"><div class="hrow sp"><div><div class="eyebrow">Pour bien démarrer</div><h2 style="font-size:22px;margin-top:6px">'+(done?'Encore '+(list.length-done)+' étape'+(list.length-done>1?'s':''):'Votre liste personnalisée')+'</h2></div><button class="btn ghost sm" data-todo-hide title="Masquer la liste">'+ICON('x','sm')+'</button></div>'+
    '<div class="lv-bar"><i style="--v:'+pct+'%"></i></div><div class="lv-steps rise">'+list.map(function(t){var d=autoDone(t);return '<button class="lv-stp'+(d?' done':'')+'" data-task="'+esc(t.id)+'"><span class="ico">'+ICON(d?'check':t.icon||'right')+'</span><span class="grow"><b>'+esc(t.title)+'</b><small>'+esc(t.sub||'')+'</small></span>'+ICON('right','sm')+'</button>'}).join('')+'</div></div>';
  var ph=el.querySelector('.ph');if(ph&&ph.parentNode===el)ph.after(box);else el.insertBefore(box,el.firstChild);
  box.querySelector('[data-todo-hide]').onclick=function(){P.prefs.set('todo:hide:'+PL.clubId,true);box.remove()};
  box.querySelectorAll('[data-task]').forEach(function(b){b.onclick=function(){var t=PL.tasks.filter(function(x){return x.id===b.getAttribute('data-task')})[0];if(!t)return;
    if(t.form&&PL.forms[t.form]){PL.forms[t.form]();return}
    if(t.go==='lv-migration'){PL.mig.launch(t.params||{});return}
    if(t.go&&P.mods[t.go]){P.go(t.go,t.params||{});if(['tarifs','calendar','plan'].indexOf(t.id)>=0)PL.doneTask(t.id)}}})};
PL.doneTask=function(id){var t=PL.tasks.filter(function(x){return x.id===id})[0];if(t)t.done=true;PL.post('/api/onboarding/tasks/'+encodeURIComponent(id),{done:true}).catch(function(){})};

/* ---------- En-tête : pastille d'état et bouton de compte ---------- */
var STL={ok:'Tout est à jour',saving:'Envoi en cours…',offline:'Hors ligne',error:'Non enregistré'};
function chg(n){return n+' changement'+(n>1?'s':'')+' en attente'}
function pill(){var st=PL.sync?PL.sync.state:'ok',n=PL.sync?PL.sync.pending():0;var t=st==='offline'?'Hors ligne'+(n?' · '+chg(n):''):st==='saving'&&n?'Envoi de '+n+' changement'+(n>1?'s':'')+'…':STL[st];
  return '<button class="lv-pill" data-lv-pill data-st="'+st+'" title="'+esc(st==='error'&&PL.sync.lastError?PL.sync.lastError:t)+'"><i></i><span class="lv-pt">'+t+'</span></button>'}
PL.decorate=function(){var app=P.app();if(!app)return;var tools=app.querySelector('.top .tools');if(!tools||tools.querySelector('[data-lv-me]'))return;
  tools.insertAdjacentHTML('afterbegin',pill());
  tools.insertAdjacentHTML('beforeend','<button class="btn ghost icon lv-meb" data-lv-me title="Mon compte" aria-label="Mon compte">'+P.ui.av(PL.mePerson||D.person(P.roles[PL.view].who))+'</button>');
  var me=app.querySelector('.side .me');if(me){me.setAttribute('role','button');me.setAttribute('tabindex','0');me.setAttribute('title','Mon compte');me.setAttribute('data-lv-me','')}
  if(PL.sandbox)PL.sandboxBanner()};
function refreshPill(){var b=document.querySelector('[data-lv-pill]');if(b)b.outerHTML=pill()}
document.addEventListener('click',function(e){
  if(e.target.closest('[data-lv-me]')){PL.account();return}
  if(e.target.closest('[data-lv-pill]')){var st=PL.sync.state,n=PL.sync.pending();P.toast(st==='ok'?'Tout est à jour : vos modifications sont enregistrées sur le serveur.':st==='offline'?(n?chg(n).charAt(0).toUpperCase()+chg(n).slice(1)+', enregistrés sur cet appareil. Ils partiront tout seuls au retour du réseau.':'Hors ligne : vous pouvez continuer à travailler, tout partira au retour du réseau.'):st==='error'?(PL.sync.lastError||'Une modification n’a pas pu être enregistrée.'):'Enregistrement en cours.',{icon:st==='ok'?'checkc':st==='offline'?'wifi':'info'});if(st!=='ok')PL.sync.flush({force:true})}
});
PL.onShell=function(){var rs0=P.renderShell;P.renderShell=function(){var r=rs0.apply(P,arguments);PL.decorate();return r};PL.sync.listeners.push(refreshPill)};

/* ---------- Mon compte ---------- */
var ROLEFR={owner:'Gérant titulaire',manager:'Gérant',staff:'Équipe',coach:'Coach',member:'Adhérent',accountant:'Comptable',provider:'Praticien'};
PL.account=function(){var u=PL.user||{},clubs=PL.clubs||[];
  var dk=document.documentElement.getAttribute('data-theme')||'auto';
  P.sheet({title:'Mon compte',icon:'user',body:function(b){
    b.innerHTML='<div class="lv-acct stack" style="--g:22px"><div class="lv-acc-h">'+P.ui.av(PL.mePerson)+'<div><b>'+esc(((u.first||'')+' '+(u.last||'')).trim()||u.email)+'</b><span class="mut">'+esc(u.email||'')+'</span>'+(u.email_verified_at?'':'<div style="margin-top:6px">'+P.ui.chip('Adresse à confirmer','warn',true)+'</div>')+'</div></div>'+
      '<div class="stack" style="--g:10px"><div class="eyebrow">Mon profil</div><div class="lv-row2"><label class="lv-fl"><span>Prénom</span><input class="in" id="ac-first" value="'+esc(u.first||'')+'"></label><label class="lv-fl"><span>Nom</span><input class="in" id="ac-last" value="'+esc(u.last||'')+'"></label></div>'+
      '<label class="lv-fl"><span>Téléphone</span><input class="in" id="ac-phone" value="'+esc(u.phone||'')+'" inputmode="tel"></label><button class="btn" data-ac-save data-needs-net>'+ICON('check','sm')+'Enregistrer mon profil</button></div>'+
      '<div class="stack" style="--g:10px"><div class="eyebrow">'+(clubs.length>1?'Mes clubs':'Mon club')+'</div><div class="lv-clubs">'+clubs.map(function(c){return '<button class="lv-club" data-needs-net data-club="'+esc(c.id)+'" aria-current="'+(c.id===PL.clubId)+'"><span class="ico">'+ICON('stable')+'</span><span class="grow"><b>'+esc(c.name)+'</b><small>'+esc(ROLEFR[c.role]||c.role||'')+'</small></span>'+(c.id===PL.clubId?P.ui.chip('Ouvert','acc'):ICON('right','sm'))+'</button>'}).join('')+'</div>'+
      (PL.isManager()||!clubs.length?'<button class="btn ghost" data-ac-newclub data-needs-net>'+ICON('plus','sm')+'Créer un autre club</button>':'')+'</div>'+
      '<div class="stack" style="--g:10px"><div class="eyebrow">Apparence</div>'+P.ui.seg([['auto','Automatique'],['light','Clair'],['dark','Sombre']],dk==='auto'?'auto':dk,'data-ac-theme')+'</div>'+
      '<div class="stack" style="--g:10px"><div class="eyebrow">Sécurité</div><button class="btn ghost" data-ac-pw data-needs-net>'+ICON('lock','sm')+'Changer mon mot de passe</button><button class="btn ghost" data-ac-np>'+ICON('bell','sm')+'E-mails et notifications</button></div>'+
      '<button class="btn" data-ac-out style="color:var(--bad)">'+ICON('logout','sm')+'Se déconnecter</button><p class="lv-note">'+esc(PL.brandName())+' · version '+esc(PL.version||'')+'</p><p class="lv-note lv-legal-links">'+[['cgu','Conditions d’utilisation'],['cgv','CGV'],['confidentialite','Confidentialité'],['sous-traitance','Contrat RGPD'],['mentions-legales','Mentions légales']].map(function(x){return '<a class="lv-a" target="_blank" rel="noopener" href="https://stablapp.fr/'+x[0]+'/">'+x[1]+'</a>'}).join(' · ')+'<br>Vos données : <a class="lv-a" href="mailto:contact@stablapp.fr">contact@stablapp.fr</a></p></div>';
    b.querySelector('[data-ac-save]').onclick=function(){var x=this;x.disabled=true;PL.patch('/api/me',{first:b.querySelector('#ac-first').value.trim(),last:b.querySelector('#ac-last').value.trim(),phone:b.querySelector('#ac-phone').value.trim()}).then(function(r){PL.user=r.user||PL.user;PL.setPeople({role:PL.role,person_ref:PL.personRef});P.toast('Profil enregistré');P.renderShell()},function(e){PL.fail(e,'Profil')}).then(function(){x.disabled=false})};
    b.querySelectorAll('[data-club]').forEach(function(x){x.onclick=function(){var id=x.getAttribute('data-club');if(id===PL.clubId)return;PL.switchClub(id)}});
    var nc=b.querySelector('[data-ac-newclub]');if(nc)nc.onclick=function(){PL.newClub()};
    b.querySelectorAll('[data-ac-theme]').forEach(function(x){x.addEventListener('click',function(){var v=x.getAttribute('data-ac-theme'),r=document.documentElement;if(v==='auto'){r.removeAttribute('data-theme');P.store.set('theme',null)}else{r.setAttribute('data-theme',v);P.store.set('theme',v)}})});
    b.querySelector('[data-ac-pw]').onclick=function(){PL.changePassword()};var np=b.querySelector('[data-ac-np]');if(np)np.onclick=function(){PL.notifPrefs()};
    b.querySelector('[data-ac-out]').onclick=PL.logout}})};
PL.changePassword=function(){var sh=P.sheet({title:'Changer de mot de passe',icon:'lock',body:'<div class="lv-f"><label class="lv-fl"><span>Mot de passe actuel</span><input class="in" type="password" id="pw0" autocomplete="current-password"></label><label class="lv-fl"><span>Nouveau mot de passe <span class="lv-hint">au moins 10 caractères</span></span><input class="in" type="password" id="pw1" autocomplete="new-password"></label></div>',
  foot:'<button class="btn ghost" data-x2>Annuler</button><button class="btn pri" data-ok>Enregistrer</button>'});
  sh.querySelector('[data-x2]').onclick=function(){sh.close()};
  sh.querySelector('[data-ok]').onclick=function(){var a=sh.querySelector('#pw0').value,n=sh.querySelector('#pw1').value;if(n.length<10){P.toast('Choisissez au moins 10 caractères.',{icon:'alert'});return}
    PL.patch('/api/me',{current_password:a,new_password:n}).then(function(){sh.close();P.toast('Mot de passe changé. Vos autres appareils ont été déconnectés.')},function(e){PL.fail(e,'Mot de passe')})}};
/* déconnexion : jamais de perte silencieuse des changements faits hors ligne */
PL.logout=function(force){var n=PL.sync?PL.sync.pending():0;
  if(n&&force!==true){var sh=P.sheet({title:'Changements pas encore envoyés',icon:'wifi',body:'<p>'+n+' changement'+(n>1?'s n’ont':' n’a')+' pas encore été envoyé'+(n>1?'s':'')+' au serveur (pas de réseau). Si vous vous déconnectez maintenant, '+(n>1?'ils seront perdus':'il sera perdu')+'.</p><p class="mut" style="margin-top:10px">Restez connecté : tout partira tout seul au retour du réseau.</p>',
      foot:'<button class="btn ghost" data-q style="color:var(--bad)">Me déconnecter quand même</button><button class="btn pri" data-k>Rester connecté</button>'});
    sh.querySelector('[data-k]').onclick=function(){sh.close();PL.sync.resume&&PL.sync.resume()};sh.querySelector('[data-q]').onclick=function(){sh.close();PL.logout(true)};return}
  var f=PL.sync?PL.sync.flush({keepalive:true}).catch(function(){}):Promise.resolve();
  f.then(function(){return PL.post('/auth/logout',{}).catch(function(){})}).then(function(){return PL.clearLocal()}).then(function(){location.href='/connexion'},function(){location.href='/connexion'})};
PL.clearLocal=function(){try{Object.keys(localStorage).forEach(function(k){if(/^piaffe:(live|wx)/.test(k))localStorage.removeItem(k)})}catch(e){}return PL.store?PL.store.clear():Promise.resolve()};
PL.switchClub=function(id){PL.sync.flush({keepalive:true});PL.post('/api/me/club',{club_id:id}).then(function(){location.href='/'},function(e){PL.fail(e,'Changement de club')})};
PL.newClub=function(){try{localStorage.setItem('piaffe:live:newclub','1')}catch(e){}location.href='/'};
/* session expirée (plus de 30 jours sans connexion) : la file reste sur l'appareil et part après la reconnexion */
PL.sessionLost=function(){if(PL._lost)return;PL._lost=true;try{PL.sync&&PL.sync.flush&&0}catch(e){}P.toast('Votre session a expiré. Reconnectez-vous : vos modifications en attente seront envoyées ensuite.',{icon:'lock',ms:8000});setTimeout(function(){location.href='/connexion'},2500)};

/* ---------- Club d'exemple ---------- */
PL.sandboxBanner=function(){var v=P.app()&&P.app().querySelector('.view');if(!v)return;if(document.querySelector('.lv-banner'))return;var b=document.createElement('div');b.className='lv-banner';
  b.innerHTML=ICON('eye','sm')+'<span class="grow"><b>Club d’exemple.</b> Les données sont fictives : modifiez tout librement.</span><button class="btn sm" data-sb-real>'+ICON('plus','sm')+'Créer mon vrai club</button>'+(PL.role==='owner'?'<button class="btn sm ghost" data-sb-wipe>'+ICON('trash','sm')+'Tout effacer</button>':'');
  var main=P.app().querySelector('.main');main.insertBefore(b,v);b.style.margin='10px 16px 0';
  b.querySelector('[data-sb-real]').onclick=PL.newClub;var w=b.querySelector('[data-sb-wipe]');if(w)w.onclick=function(){
    var sh=P.sheet({title:'Tout effacer',icon:'trash',body:'<p>Toutes les données d’exemple de ce club seront supprimées, puis vous pourrez le configurer comme votre vrai club.</p><label class="lv-fl" style="margin-top:14px"><span>Tapez EFFACER pour confirmer</span><input class="in" id="sb-c" autocomplete="off"></label>',foot:'<button class="btn ghost" data-x2>Annuler</button><button class="btn pri" data-ok style="background:var(--bad)">Tout effacer</button>'});
    sh.querySelector('[data-x2]').onclick=function(){sh.close()};
    sh.querySelector('[data-ok]').onclick=function(){if(sh.querySelector('#sb-c').value.trim().toUpperCase()!=='EFFACER'){P.toast('Tapez EFFACER pour confirmer.',{icon:'alert'});return}
      PL.readonly=true;PL.post('/api/onboarding/reset',{confirm:'EFFACER'}).then(function(){var k='sync:'+((PL.user||{}).id||'')+':'+PL.clubId;try{localStorage.removeItem('piaffe:live:queue:'+PL.clubId);localStorage.removeItem('stabl:bak:'+k)}catch(e){}PL.sync.queue.length=0;(PL.store?PL.store.del(k):Promise.resolve()).then(function(){location.href='/'})},function(e){PL.readonly=false;PL.fail(e,'Effacement')})}}};
/* crée un club séparé et y charge le jeu de démonstration */
PL.createSandbox=function(){var demo=PL.demoData;if(!demo)return Promise.reject(PL.err(0,'x','Le jeu d’exemple est indisponible.'));
  return PL.post('/api/clubs',{name:'Club d’exemple',kind:'centre'}).then(function(r){var c=r.club||r;PL.clubId=c.id;return PL.post('/api/me/club',{club_id:c.id}).catch(function(){})})
    .then(function(){return PL.post('/api/onboarding/sandbox',{})}).then(function(){
      var ops=[],skip=['today','me','invoices','bank','months','revenue','costs','occupancy','weather','notifs','facts','templates'];
      Object.keys(demo).forEach(function(k){var v=demo[k];if(skip.indexOf(k)>=0||!v||typeof v!=='object')return;
        if(k==='club'){ops.push({op:'upsert',coll:'club',id:'_',data:v});return}
        if(Array.isArray(v))v.forEach(function(o,i){if(o&&typeof o==='object'&&!Array.isArray(o)){if(!o.id)o.id=k.slice(0,3)+'_'+i;ops.push({op:'upsert',coll:k,id:String(o.id),data:o})}})});
      var chunks=[];for(var i=0;i<ops.length;i+=180)chunks.push(ops.slice(i,i+180));
      return chunks.reduce(function(p,ch){return p.then(function(){return PL.post('/api/records/batch',{ops:ch})})},Promise.resolve())})};
})();
