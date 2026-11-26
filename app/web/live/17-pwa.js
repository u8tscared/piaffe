/* =====================================================================
   STABL LIVE · Appli installée (PWA) : service worker, mises à jour, écran d'accueil
   - le service worker garde l'appli complète sur l'appareil : elle s'ouvre sans réseau (sw.js) ;
   - une nouvelle version s'installe en arrière-plan, puis un bandeau propose « Recharger » (jamais de
     rechargement surprise pendant une saisie) ;
   - invitation discrète à « Ajouter à l'écran d'accueil », expliquée pas à pas sur iPhone et iPad
     (Safari n'a pas de bouton d'installation), bouton « Installer » sur Android et ordinateur ;
   - ce qui exige vraiment le réseau (migration…) est arrêté avec une explication.
   ===================================================================== */
(function(){
var PL=window.PL,P=window.P,esc=P.fmt.esc;
var W=PL.pwa={reg:null,deferred:null};
function lsGet(k){try{return localStorage.getItem(k)}catch(e){return null}}
function lsSet(k,v){try{localStorage.setItem(k,v)}catch(e){}}
W.standalone=function(){try{return matchMedia('(display-mode: standalone)').matches||matchMedia('(display-mode: fullscreen)').matches||navigator.standalone===true}catch(e){return false}};
W.ios=function(){var u=navigator.userAgent||'';return /iPad|iPhone|iPod/.test(u)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1)};
try{document.documentElement.classList.toggle('lv-standalone',W.standalone())}catch(e){}

/* ---------- Service worker ---------- */
var wantReload=false;
W.register=function(){if(!('serviceWorker' in navigator))return;if(location.protocol!=='https:'&&!/^(localhost|127\.0\.0\.1)$/.test(location.hostname))return;
  if(/probe=/.test(location.search))return;
  navigator.serviceWorker.register('/sw.js',{scope:'/'}).then(function(reg){W.reg=reg;
    if(reg.waiting&&navigator.serviceWorker.controller)W.updateReady(reg.waiting);
    reg.addEventListener('updatefound',function(){var w=reg.installing;if(!w)return;w.addEventListener('statechange',function(){if(w.state==='installed'&&navigator.serviceWorker.controller)W.updateReady(w)})});
  }).catch(function(e){console.info('[pwa] service worker non enregistré',e&&e.message)});
  navigator.serviceWorker.addEventListener('controllerchange',function(){if(wantReload){wantReload=false;location.reload()}});
  /* vérifier les mises à jour : au retour au premier plan et toutes les 30 minutes (une tablette reste ouverte des jours) */
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible'&&W.reg&&navigator.onLine!==false)W.reg.update().catch(function(){})});
  setInterval(function(){if(W.reg&&navigator.onLine!==false)W.reg.update().catch(function(){})},30*60e3)};
W.updateReady=function(worker){W.waiting=worker;
  /* pas encore dans l'appli (connexion, onboarding) : on applique tout de suite, rien n'est en cours */
  if(!PL.ready){wantReload=true;worker.postMessage({type:'SKIP_WAITING'});return}
  if(document.querySelector('.lv-update'))return;
  var b=document.createElement('div');b.className='lv-update';b.setAttribute('role','status');
  b.innerHTML=ICON('spark','sm')+'<span class="grow"><b>Nouvelle version de '+esc(PL.brandName())+'.</b> Rechargez quand vous voulez : rien ne sera perdu.</span><button class="btn sm pri" data-up>Recharger</button><button class="btn sm ghost icon" data-upx aria-label="Plus tard" title="Plus tard">'+ICON('x','sm')+'</button>';
  document.body.appendChild(b);
  b.querySelector('[data-up]').onclick=function(){var x=this;x.disabled=true;
    var f=PL.sync&&PL.sync.flush?PL.sync.flush({keepalive:true}).catch(function(){}):Promise.resolve();
    f.then(function(){wantReload=true;worker.postMessage({type:'SKIP_WAITING'});setTimeout(function(){if(wantReload)location.reload()},3000)})};
  b.querySelector('[data-upx]').onclick=function(){b.remove()}};
if(document.readyState==='complete')W.register();else window.addEventListener('load',function(){W.register()});

/* ---------- Ajouter à l'écran d'accueil ---------- */
window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();W.deferred=e});
window.addEventListener('appinstalled',function(){W.deferred=null;lsSet('stabl:a2hs','installed');var c=document.querySelector('.lv-a2hs');if(c)c.remove()});
var SHARE='<svg class="i sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>';
W.invite=function(force){if(W.standalone())return;var seen=+lsGet('stabl:a2hs')||0;if(!force&&(lsGet('stabl:a2hs')==='installed'||Date.now()-seen<30*864e5))return;
  var touch=false;try{touch=matchMedia('(pointer:coarse)').matches}catch(e){}
  if(!force&&!touch&&!W.deferred)return;
  if(!W.ios()&&!W.deferred)return;
  if(document.querySelector('.lv-a2hs'))return;
  var ipad=/iPad/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
  var c=document.createElement('div');c.className='lv-a2hs';c.setAttribute('role','dialog');c.setAttribute('aria-label','Installer l’appli');
  c.innerHTML='<div class="hrow" style="--g:12px;align-items:flex-start"><span class="lv-a2hs-ico">'+PL.brandLogo(26,'#fff')+'</span><div class="grow"><b>Installez '+esc(PL.brandName())+' sur l’écran d’accueil</b>'+
    '<p>Elle s’ouvre en plein écran et marche même sans réseau, au fond de l’écurie.</p>'+
    (W.deferred?'':'<ol><li>Touchez '+SHARE+' <b>Partager</b>, '+(ipad?'en haut à droite':'en bas de l’écran')+'.</li><li>Choisissez <b>Sur l’écran d’accueil</b>.</li><li>Touchez <b>Ajouter</b>.</li></ol>')+
    '</div><button class="btn ghost icon sm" data-ax aria-label="Fermer" title="Fermer">'+ICON('x','sm')+'</button></div>'+(W.deferred?'<button class="btn pri" data-ai style="width:100%;margin-top:10px">'+ICON('download','sm')+'Installer l’appli</button>':'');
  document.body.appendChild(c);
  c.querySelector('[data-ax]').onclick=function(){lsSet('stabl:a2hs',String(Date.now()));c.remove()};
  var ai=c.querySelector('[data-ai]');if(ai)ai.onclick=function(){var d=W.deferred;if(!d)return;d.prompt();(d.userChoice||Promise.resolve({})).then(function(r){if(r&&r.outcome==='accepted')lsSet('stabl:a2hs','installed');else lsSet('stabl:a2hs',String(Date.now()));W.deferred=null;c.remove()})}};

/* ---------- Après le lancement de l'appli ---------- */
W.afterLaunch=function(){
  /* la migration a besoin du réseau : explication au lieu d'une erreur */
  var guard=function(o,k){if(!o||typeof o[k]!=='function'||o[k].__net)return;var f=o[k];o[k]=function(){if(!PL.online()){P.toast('Hors ligne : la récupération de vos données a besoin d’internet. Elle sera possible dès le retour du réseau.',{icon:'wifi',ms:5200});return new Promise(function(){})}return f.apply(this,arguments)};o[k].__net=true};
  guard(PL.mig,'launch');guard(PL.mig,'open');guard(PL,'campaignSheet');
  setTimeout(function(){try{W.invite()}catch(e){}},25000)};
})();
