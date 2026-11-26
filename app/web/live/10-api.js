/* =====================================================================
   PIAFFE LIVE · Accès à l'API (même origine, cookie de session)
   PL.api(méthode, chemin, corps?, options?) → Promise<json>
   Erreurs : {status, code, message, unavailable?, offline?}
   ===================================================================== */
(function(){
var PL=window.PL;
PL.clubId=null;
function err(status,code,message,extra){var e=new Error(message);e.status=status;e.code=code;if(extra)for(var k in extra)e[k]=extra[k];return e}
PL.err=err;
PL.api=function(method,path,body,o){o=o||{};
  var h={'accept':'application/json','x-requested-with':'piaffe'};if(body!==undefined&&!(body instanceof FormData))h['content-type']='application/json';
  if(PL.clubId&&!o.noClub)h['x-piaffe-club']=PL.clubId;
  var init={method:method,headers:h,credentials:'same-origin',keepalive:!!o.keepalive};
  if(body!==undefined)init.body=body instanceof FormData?body:JSON.stringify(body);
  return fetch(path,init).then(function(r){
    var ct=r.headers.get('content-type')||'';
    if(o.raw)return r;
    if(ct.indexOf('application/json')<0){
      if(r.ok)return r.text().then(function(t){return {text:t}});
      /* route pas encore livrée : le Worker sert la page (SPA) ou un 404 non JSON */
      throw err(r.status,'unavailable','Cette fonction n’est pas encore disponible sur ce serveur.',{unavailable:true});
    }
    return r.json().then(function(j){
      if(r.ok)return j;
      var e=j&&j.error||{};
      var unavailable=r.status===404&&e.code==='not_found'&&/Route d.API inconnue/.test(e.message||'');
      if(unavailable)throw err(404,'unavailable','Cette fonction n’est pas encore disponible sur ce serveur. Réessayez un peu plus tard.',{unavailable:true});
      throw err(r.status,e.code||('http_'+r.status),e.message||'Une erreur est survenue. Réessayez dans un instant.',{details:e.details});
    });
  },function(x){
    if(x&&x.status)throw x;
    throw err(0,'offline','Pas de connexion au serveur. Vérifiez votre réseau.',{offline:true});
  });
};
PL.get=function(p,o){return PL.api('GET',p,undefined,o)};
PL.post=function(p,b,o){return PL.api('POST',p,b===undefined?{}:b,o)};
PL.put=function(p,b,o){return PL.api('PUT',p,b,o)};
PL.patch=function(p,b,o){return PL.api('PATCH',p,b,o)};
PL.del=function(p,o){return PL.api('DELETE',p,undefined,o)};

/* message lisible pour un toast ou un formulaire */
/* hors ligne : les modifications des fiches partent toutes seules au retour du réseau (30-sync) ; ce qui passe
   par ici directement (paiement, e-mail, facture, invitation, migration) a vraiment besoin d'internet */
PL.msg=function(e){if(!e)return 'Une erreur est survenue.';if(e.offline)return 'Pas de connexion : cette action a besoin d’internet. Réessayez dès le retour du réseau.';return e.message||'Une erreur est survenue.'};
PL.online=function(){return navigator.onLine!==false&&!(PL.sync&&PL.sync.state==='offline')};
/* boutons qui exigent le réseau : grisés hors ligne (lv.css, body.lv-offline) et expliqués au lieu d'échouer */
PL.NET='[data-net],.lv-inv-act button';
document.addEventListener('click',function(e){if(!document.body.classList.contains('lv-offline'))return;var b=e.target.closest&&e.target.closest(PL.NET);if(!b||b.closest('.lv-auth,.lv-ob'))return;
  e.preventDefault();e.stopPropagation();try{P.toast('Hors ligne : cette action (paiement, e-mail, facture, invitation) a besoin d’internet. Le reste de l’appli marche normalement.',{icon:'wifi',ms:5200})}catch(x){}},true);
/* toast d'erreur uniforme (et message clair si la route n'existe pas encore) */
PL.fail=function(e,ctx){var m=PL.msg(e);if(e&&e.unavailable)m=(ctx?ctx+' : ':'')+'cette fonction arrive très bientôt sur votre espace.';try{P.toast(m,{icon:e&&e.offline?'wifi':'alert',ms:5200})}catch(x){alert(m)}};

/* ouvre une URL renvoyée par l'API (Stripe Checkout, portail…) */
PL.openUrl=function(u,newTab){if(!u)return;if(newTab){var w=window.open(u,'_blank','noopener');if(w)return}location.href=u};
/* téléchargement d'un fichier protégé par la session */
PL.download=function(path,name){return PL.api('GET',path,undefined,{raw:true}).then(function(r){
  if(!r.ok)return r.json().catch(function(){return {}}).then(function(j){var e=j&&j.error||{};if(r.status===404&&/Route d.API inconnue/.test(e.message||''))throw err(404,'unavailable','',{unavailable:true});throw err(r.status,e.code||'http',e.message||'Téléchargement impossible.')});
  var cd=r.headers.get('content-disposition')||'',m=/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i.exec(cd);
  return r.blob().then(function(b){var a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=(m&&decodeURIComponent(m[1]))||name||'piaffe';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500)})})};

/* petit utilitaire de dates */
PL.isoDay=function(d){d=d||new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
PL.uid=function(p){var a=new Uint8Array(8);(window.crypto||{}).getRandomValues?crypto.getRandomValues(a):a.forEach(function(_,i){a[i]=Math.random()*256});return (p||'x')+'_'+Date.now().toString(36)+Array.prototype.map.call(a,function(b){return (b%36).toString(36)}).join('')};
})();
