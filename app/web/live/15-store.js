/* =====================================================================
   STABL LIVE · Stockage local hors connexion (IndexedDB)
   PL.store : petit magasin clé → valeur, asynchrone, qui survit à la fermeture de l'appli.
     PL.store.get(clé) → Promise<valeur|undefined>   PL.store.set(clé, valeur) → Promise
     PL.store.del(clé) → Promise                      PL.store.keys(préfixe) → Promise<clés>
   IndexedDB d'abord (des centaines de Mo, contrairement aux 5 Mo de localStorage) ; si le navigateur le
   refuse (navigation privée ancienne, stockage bloqué), repli sur localStorage puis sur la mémoire.
   Chaque accès est protégé : une erreur de stockage ne casse jamais l'appli.

   PL.queue : file d'attente générique, persistante et ordonnée, pour tout ce qui doit partir au serveur
   (voir ARCHITECTURE.md, « File hors connexion »). Utilisée par l'équipe média (photos) ; la synchro des
   données du club (30-sync.js) a sa propre file fusionnée, stockée ici aussi.
   ===================================================================== */
(function(){
var PL=window.PL;
var DBN='stabl',VER=1,ST='kv',QS='queue',dbp=null,mem={},mode='idb';
function lsGet(k){try{var v=localStorage.getItem('stabl:'+k);return v==null?undefined:JSON.parse(v)}catch(e){return mem[k]}}
function lsSet(k,v){try{localStorage.setItem('stabl:'+k,JSON.stringify(v))}catch(e){mem[k]=v}}
function lsDel(k){try{localStorage.removeItem('stabl:'+k)}catch(e){}delete mem[k]}
function open(){if(dbp)return dbp;
  dbp=new Promise(function(res,rej){var t=setTimeout(function(){rej(new Error('idb-timeout'))},4000);
    try{if(!window.indexedDB)throw new Error('no-idb');var r=indexedDB.open(DBN,VER);
      r.onupgradeneeded=function(){var d=r.result;if(!d.objectStoreNames.contains(ST))d.createObjectStore(ST);if(!d.objectStoreNames.contains(QS))d.createObjectStore(QS,{keyPath:'seq',autoIncrement:true})};
      r.onsuccess=function(){clearTimeout(t);var d=r.result;d.onversionchange=function(){try{d.close()}catch(e){}dbp=null};res(d)};
      r.onerror=function(){clearTimeout(t);rej(r.error||new Error('idb'))};r.onblocked=function(){clearTimeout(t);rej(new Error('idb-blocked'))}}catch(e){clearTimeout(t);rej(e)}});
  dbp.catch(function(){mode='ls';dbp=null});
  return dbp}
function tx(store,rw,fn){return open().then(function(d){return new Promise(function(res,rej){var t,out;
  try{t=d.transaction(store,rw?'readwrite':'readonly');out=fn(t.objectStore(store))}catch(e){rej(e);return}
  t.oncomplete=function(){res(out&&'result' in out?out.result:out)};t.onerror=function(){rej(t.error)};t.onabort=function(){rej(t.error||new Error('abort'))}})})}

PL.store={
  mode:function(){return mode},
  get:function(k){if(mode!=='idb')return Promise.resolve(lsGet(k));return tx(ST,false,function(s){return s.get(k)}).catch(function(){mode='ls';return lsGet(k)})},
  set:function(k,v){if(mode!=='idb'){lsSet(k,v);return Promise.resolve()}return tx(ST,true,function(s){s.put(v,k)}).then(function(){},function(){mode='ls';lsSet(k,v)})},
  del:function(k){lsDel(k);if(mode!=='idb')return Promise.resolve();return tx(ST,true,function(s){s.delete(k)}).then(function(){},function(){})},
  keys:function(prefix){prefix=prefix||'';if(mode!=='idb'){var out=[];try{for(var i=0;i<localStorage.length;i++){var k=localStorage.key(i);if(k&&k.indexOf('stabl:'+prefix)===0)out.push(k.slice(6))}}catch(e){}return Promise.resolve(out)}
    return tx(ST,false,function(s){return s.getAllKeys()}).then(function(ks){return (ks||[]).filter(function(k){return String(k).indexOf(prefix)===0})},function(){return []})},
  /* efface tout ce qui concerne un utilisateur (déconnexion) */
  clear:function(){try{Object.keys(localStorage).forEach(function(k){if(k.indexOf('stabl:')===0)localStorage.removeItem(k)})}catch(e){}mem={};
    if(mode!=='idb')return Promise.resolve();return Promise.all([tx(ST,true,function(s){s.clear()}),tx(QS,true,function(s){s.clear()})]).then(function(){},function(){})}
};
/* le navigateur peut effacer le stockage d'un site peu utilisé (Safari : après 7 jours sans ouverture) ; on demande à le garder */
try{if(navigator.storage&&navigator.storage.persist)navigator.storage.persisted().then(function(p){if(!p)return navigator.storage.persist()}).catch(function(){})}catch(e){}

/* ---------------------------------------------------------------------
   File générique : PL.queue
   PL.queue.register(type, {send:function(item) → Promise, label?:function(item) → texte})
     send renvoie une promesse : résolue = c'est parti, l'élément est retiré ; rejetée avec
     e.offline ou e.status ≥ 500 ou 429 = on réessaiera plus tard ; toute autre erreur (4xx) =
     refus définitif : l'élément est retiré et signalé (PL.queue.failed).
   PL.queue.add(type, data, {id?}) → Promise<élément>  (id unique ; ajouter deux fois le même id ne crée pas de doublon)
   PL.queue.list(type?) → Promise<éléments>     PL.queue.remove(id) → Promise
   PL.queue.count() → nombre en attente (synchrone, tous types)   PL.queue.run() → Promise
   PL.queue.on(fonction(n)) : appelée quand le nombre en attente change.
   Les éléments sont rejoués dans l'ordre d'ajout, un type à la fois, au retour du réseau, au retour
   au premier plan, au démarrage et toutes les 20 secondes. Chaque élément porte item.id (identifiant
   unique à transmettre au serveur pour qu'un renvoi ne crée jamais de doublon) et item.tries.
   --------------------------------------------------------------------- */
var Q=PL.queue={types:{},n:0,busy:false,listeners:[],failed:[]};
var memQ=[],seq=0;
function qAll(){if(mode!=='idb')return Promise.resolve((lsGet('queue')||memQ).slice());
  return tx(QS,false,function(s){return s.getAll()}).catch(function(){mode='ls';return (lsGet('queue')||memQ).slice()})}
function qPut(it){if(mode!=='idb'){var l=lsGet('queue')||memQ;var i=l.findIndex(function(x){return x.id===it.id});if(i>=0)l[i]=it;else{it.seq=++seq+Date.now();l.push(it)}lsSet('queue',l);memQ=l;return Promise.resolve(it)}
  return tx(QS,true,function(s){return s.put(it)}).then(function(k){it.seq=it.seq||k;return it},function(){mode='ls';return qPut(it)})}
function qDel(it){if(mode!=='idb'){var l=(lsGet('queue')||memQ).filter(function(x){return x.id!==it.id});lsSet('queue',l);memQ=l;return Promise.resolve()}
  return tx(QS,true,function(s){s.delete(it.seq)}).then(function(){},function(){})}
function emit(){var n=Q.n;Q.listeners.forEach(function(f){try{f(n)}catch(e){}})}
function recount(){return qAll().then(function(l){Q.n=l.length;emit();return l})}
Q.register=function(type,h){Q.types[type]=h;setTimeout(Q.run,50)};
Q.add=function(type,data,o){o=o||{};var id=o.id||PL.uid('op');
  return qAll().then(function(l){var dup=l.filter(function(x){return x.id===id})[0];if(dup)return dup;
    var it={id:id,type:type,data:data,at:new Date().toISOString(),tries:0,club:PL.clubId||null,user:(PL.user||{}).id||null};
    return qPut(it).then(function(x){Q.n++;emit();setTimeout(Q.run,0);return x})})};
Q.list=function(type){return qAll().then(function(l){return l.filter(function(x){return !type||x.type===type}).sort(function(a,b){return a.seq-b.seq})})};
Q.remove=function(id){return qAll().then(function(l){var it=l.filter(function(x){return x.id===id})[0];return it?qDel(it).then(recount):null})};
Q.count=function(){return Q.n};
Q.on=function(f){Q.listeners.push(f)};
function retryable(e){return !e||e.offline||e.status===0||e.status===429||e.status>=500||e.status===401}
Q.run=function(){if(Q.busy)return Q.busyP;if(navigator.onLine===false)return Promise.resolve();
  Q.busy=true;
  Q.busyP=qAll().then(function(l){
    /* ordre d'ajout ; seulement ce qui appartient à l'utilisateur et au club ouverts */
    l=l.filter(function(x){return (!x.club||x.club===PL.clubId)&&(!x.user||!PL.user||x.user===PL.user.id)}).sort(function(a,b){return a.seq-b.seq});
    var blocked={};
    return l.reduce(function(p,it){return p.then(function(){var h=Q.types[it.type];if(!h||blocked[it.type])return;
      return Promise.resolve().then(function(){return h.send(it)}).then(function(){return qDel(it)},function(e){
        if(retryable(e)){blocked[it.type]=true;it.tries++;it.lastError=e&&e.message||'';return qPut(it)}
        Q.failed.push({item:it,error:e});try{P.toast((h.label?h.label(it)+' : ':'')+PL.msg(e),{icon:'alert',ms:6500})}catch(x){}return qDel(it)})})},Promise.resolve())})
  .catch(function(){}).then(function(){Q.busy=false;return recount()});
  return Q.busyP};
/* rejeu : démarrage, retour du réseau, retour au premier plan, minuterie (iOS n'a pas de synchro en arrière-plan) */
window.addEventListener('online',function(){setTimeout(Q.run,300)});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')Q.run()});
setInterval(function(){if(Q.n&&document.visibilityState!=='hidden')Q.run()},20000);
recount().catch(function(){});
})();
