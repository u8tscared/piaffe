/* =====================================================================
   PIAFFE LIVE · Synchronisation de window.DATA avec le serveur
   Les écrans de la démo modifient DATA en place. Après chaque interaction (anti-rebond 400 ms),
   on compare à l'instantané et on envoie le diff à POST /api/records/batch, avec les versions.
   Hors ligne : file en localStorage, renvoi au retour du réseau. Toutes les 60 s : /api/records/changes.
   ===================================================================== */
(function(){
var P=window.P,D=window.DATA,PL=window.PL;
var S=PL.sync={snap:{},queue:[],state:'ok',refused:{},lastPull:null,timer:0,busy:false,listeners:[]};
var CHUNK=100;

function plain(o){return o&&typeof o==='object'&&!Array.isArray(o)&&!(o instanceof Date)}
function ser(v){try{return JSON.stringify(v,function(k,x){return typeof x==='function'?undefined:x})}catch(e){return null}}
function qkey(){return 'piaffe:live:queue:'+(PL.clubId||'')}
function saveQueue(){try{localStorage.setItem(qkey(),JSON.stringify(S.queue))}catch(e){}}
function loadQueue(){try{S.queue=JSON.parse(localStorage.getItem(qkey())||'[]')||[]}catch(e){S.queue=[]}}

/* collections suivies et leur forme : 'rows' (objets avec id) ou 'blob' (un seul enregistrement) */
S.tracked=function(){var out=[];Object.keys(D).forEach(function(k){if(!PL.isColl(k)||PL.NOSYNC.indexOf(k)>=0||k.charAt(0)==='_'||k==='club')return;if(S.refused[k])return;out.push(k)});return out};
function shape(v){if(!Array.isArray(v))return 'blob';for(var i=0;i<v.length;i++)if(!plain(v[i]))return 'blob';return 'rows'}
/* vue « enregistrements » d'une collection : {id: json} */
function rowsOf(k){var v=D[k],m={};
  if(S.isSingleton(k)){m._=ser(v);return m}
  if(shape(v)==='blob')return m;
  v.forEach(function(o){if(o.id==null||o.id==='')o.id=PL.uid('r');m[String(o.id)]=ser(o)});return m}
S.SINGLE=['club','facts','coachDeals','coachRules','shifts','empNotes','hr','bankSuggest','breeding','homeShow','pfAge'];
S.isSingleton=function(k){return (PL.boot&&PL.boot.singletons||S.SINGLE).indexOf(k)>=0};
function current(){var c={};S.tracked().forEach(function(k){c[k]=rowsOf(k)});if(PL.isManager&&PL.isManager())c.club=rowsOf('club');return c}
S.takeSnapshot=function(){S.snap=current()};

/* ---------- Diff ---------- */
function diff(){var cur=current(),ops=[];
  Object.keys(cur).forEach(function(k){var a=S.snap[k]||{},b=cur[k];
    Object.keys(b).forEach(function(id){if(a[id]!==b[id]){ops.push({op:'upsert',coll:k,id:id,data:JSON.parse(b[id])})}});
    Object.keys(a).forEach(function(id){if(!(id in b))ops.push({op:'delete',coll:k,id:id})});
  });
  S.snap=cur;return ops}
/* fusion dans la file : la dernière opération sur un objet l'emporte */
function enqueue(ops){ops.forEach(function(o){for(var i=S.queue.length-1;i>=0;i--){var q=S.queue[i];if(q.coll===o.coll&&q.id===o.id&&!q.inflight){S.queue.splice(i,1)}}
  var v=PL.versions[o.coll+'/'+o.id];if(v!=null)o.version=v;S.queue.push(o)});saveQueue()}

/* ---------- État affiché ---------- */
S.setState=function(st){if(S.state===st&&st!=='offline')return;S.state=st;S.listeners.forEach(function(f){try{f(st)}catch(e){}})};
S.pending=function(){return S.queue.length};

/* ---------- Envoi ---------- */
S.flush=function(o){o=o||{};if(!PL.clubId||PL.readonly)return Promise.resolve();
  var ops=diff();if(ops.length)enqueue(ops);
  if(ops.some(function(o){return o.coll==='club'}))PL.saveClubLegal&&PL.saveClubLegal();
  if(!S.queue.length){if(S.state!=='offline')S.setState('ok');return Promise.resolve()}
  if(S.busy&&!o.keepalive)return S.busyP||Promise.resolve();
  if(!navigator.onLine&&!o.force){S.setState('offline');return Promise.resolve()}
  var batch=S.queue.filter(function(q){return !q.inflight}).slice(0,CHUNK);if(!batch.length)return Promise.resolve();
  batch.forEach(function(q){q.inflight=true});S.busy=true;S.setState('saving');
  var body={ops:batch.map(function(q){var x={op:q.op,coll:q.coll,id:q.id};if(q.data)x.data=q.data;if(q.version!=null)x.version=q.version;return x})};
  S.busyP=PL.api('POST','/api/records/batch',body,{keepalive:!!o.keepalive}).then(function(j){
    var res=(j&&j.results)||[],conflicts=[],refused=[];
    batch.forEach(function(q,i){var r=res.filter(function(x){return x.coll===q.coll&&String(x.id)===String(q.id)})[0]||res[i]||{ok:false};
      var idx=S.queue.indexOf(q);if(idx>=0)S.queue.splice(idx,1);
      if(r.ok){if(r.version!=null)PL.versions[q.coll+'/'+q.id]=r.version;if(q.op==='delete')delete PL.versions[q.coll+'/'+q.id];return}
      if(r.conflict){conflicts.push({q:q,r:r});return}
      refused.push({q:q,r:r})});
    saveQueue();S.busy=false;
    if(conflicts.length)resolveConflicts(conflicts);
    if(refused.length)handleRefused(refused);
    S.setState(S.queue.length?'saving':'ok');
    if(S.queue.length)return S.flush();
  },function(e){batch.forEach(function(q){q.inflight=false});S.busy=false;saveQueue();
    if(e.offline){S.setState('offline');return}
    if(e.status===401){PL.sessionLost&&PL.sessionLost();return}
    if(e.status===402){S.setState('error');S.lastError=e.message;PL.planBanner&&PL.planBanner(e.message);return}
    if(e.unavailable){S.setState('error');S.lastError='L’enregistrement n’est pas encore disponible sur ce serveur.';return}
    if(e.status===413||e.status===400){/* un objet invalide ne doit pas bloquer la file */S.queue=S.queue.filter(function(q){return batch.indexOf(q)<0});saveQueue();P.toast('Une modification n’a pas pu être enregistrée : '+PL.msg(e),{icon:'alert',ms:6000})}
    S.setState('error');S.lastError=PL.msg(e)});
  return S.busyP};

/* ---------- Conflits : la version du serveur est rechargée et l'utilisateur prévenu ---------- */
function label(coll,data){data=data||{};var n=data.name||data.title||((data.first||'')+' '+(data.last||'')).trim();return n?'« '+n+' »':'Un élément'}
function applyServerObject(coll,id,data,version,deleted){
  if(version!=null)PL.versions[coll+'/'+id]=version;
  if(coll==='club'){if(data){PL.applyClub(PL.boot&&PL.boot.club,data)}S.snap.club=rowsOf('club');return true}
  var arr=D[coll];
  if(S.isSingleton(coll)){if(deleted||!data)return false;PL.setColl(coll,data);(S.snap[coll]=S.snap[coll]||{})._=ser(D[coll]);return true}
  if(!Array.isArray(arr)){D[coll]=arr=[]}
  var i=-1;for(var k=0;k<arr.length;k++)if(String(arr[k].id)===String(id)){i=k;break}
  S.snap[coll]=S.snap[coll]||{};
  if(deleted){if(i>=0)arr.splice(i,1);delete S.snap[coll][id];return i>=0}
  if(!data)return false;data=PL.normalize(coll,data);
  if(i>=0){var o=arr[i];Object.keys(o).forEach(function(x){if(!(x in data))delete o[x]});Object.assign(o,data)}else arr.push(data);
  S.snap[coll][id]=ser(i>=0?arr[i]:data);return true}
S.applyServerObject=applyServerObject;
function resolveConflicts(list){
  var withData=list.filter(function(c){return c.r.data||c.r.deleted}),without=list.filter(function(c){return !c.r.data&&!c.r.deleted});
  withData.forEach(function(c){applyServerObject(c.q.coll,c.q.id,c.r.data,c.r.version,c.r.deleted)});
  var p=without.length?PL.get('/api/club/bootstrap').then(function(b){var d=b.data||{};without.forEach(function(c){var arr=PL.unblob(d[c.q.coll]);var o=Array.isArray(arr)?arr.filter(function(x){return String(x.id)===String(c.q.id)})[0]:null;
      applyServerObject(c.q.coll,c.q.id,c.q.id==='_'?arr:o,(b.versions||{})[c.q.coll+'/'+c.q.id],!o&&c.q.id!=='_')});PL.derive()}).catch(function(){}):Promise.resolve();
  p.then(function(){var c=list[0];
    P.toast(list.length>1?list.length+' éléments ont été modifiés sur un autre appareil : les versions les plus récentes sont affichées.':label(c.q.coll,c.r.data||c.q.data)+' a été modifié sur un autre appareil entre-temps : la version la plus récente est affichée, refaites votre changement si besoin.',{icon:'refresh',ms:7000});
    S.softRerender(true)})}
function handleRefused(list){
  /* collection inconnue du serveur : on cesse simplement de l'envoyer ; droit refusé : on remet l'état du serveur et on prévient */
  var shown=[];
  list.forEach(function(x){var e=x.r.error||{},code=e.code||x.r.code||'';
    if(code==='unknown_collection'||code==='invalid_id'&&x.q.coll.charAt(0)==='_'){S.refused[x.q.coll]=true;console.info('[live] collection non synchronisée :',x.q.coll);return}
    if(x.r.data!==undefined||x.r.version!=null)applyServerObject(x.q.coll,x.q.id,x.r.data||null,x.r.version,!x.r.data);
    else if(x.q.op==='upsert'&&PL.versions[x.q.coll+'/'+x.q.id]==null){/* création refusée : on retire l'objet ajouté localement */applyServerObject(x.q.coll,x.q.id,null,null,true)}
    var m=e.message||(code==='forbidden'?'vous n’avez pas le droit de modifier cet élément.':code==='too_large'?'cet élément est trop volumineux.':code==='lesson_full'?'cette reprise est complète.':'');
    if(m&&shown.indexOf(m)<0)shown.push(m)});
  if(shown.length){P.toast('Modification non enregistrée : '+shown[0].charAt(0).toLowerCase()+shown[0].slice(1),{icon:'lock',ms:6500});S.softRerender(true)}}

/* ---------- Réception des changements des autres appareils ---------- */
S.pull=function(){if(!PL.clubId||S.busy||!navigator.onLine||S.pulling)return Promise.resolve();S.pulling=true;var n=0;
  function page(since){return PL.get('/api/records/changes?since='+encodeURIComponent(since)).then(function(j){
    (j.changes||[]).forEach(function(c){var coll=c.coll,id=String(c.id);if(!coll||coll==='invoices')return;
      if(S.queue.some(function(q){return q.coll===coll&&String(q.id)===id}))return;
      var known=PL.versions[coll+'/'+id];if(known!=null&&c.version!=null&&c.version<=known)return;
      if(applyServerObject(coll,id,c.data,c.version,c.deleted))n++});
    S.lastPull=j.next_since||j.server_time||since;if(j.more)return page(S.lastPull)})}
  return page(S.lastPull||PL.serverTime).then(function(){S.pulling=false;if(n){PL.derive();S.softRerender()}},function(e){S.pulling=false;if(e.status===401)PL.sessionLost&&PL.sessionLost()})};

/* ne redessine pas sous les doigts de l'utilisateur */
S.softRerender=function(force){var a=document.activeElement;if(!force&&a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))return;if(!force&&document.querySelector('.app .sheet'))return;try{P.rerender();P.renderBadges()}catch(e){}};

/* ---------- Déclencheurs ---------- */
S.schedule=function(){clearTimeout(S.timer);S.timer=setTimeout(function(){S.flush()},400)};
S.start=function(){loadQueue();
  /* les modifications faites hors ligne avant le rechargement sont réappliquées par-dessus les données du serveur */
  S.queue.forEach(function(q){q.inflight=false;if(q.op==='upsert')applyServerObject(q.coll,q.id,q.data,null,false);else applyServerObject(q.coll,q.id,null,null,true)});
  S.takeSnapshot();
  ['click','change','submit'].forEach(function(ev){document.addEventListener(ev,function(){S.schedule()},false)});
  document.addEventListener('keyup',function(e){if(e.key==='Enter')S.schedule()});
  document.addEventListener('pointerup',function(){S.schedule()});
  var t0=P.toast;P.toast=function(){S.schedule();return t0.apply(P,arguments)};
  var r0=P.rerender;P.rerender=function(){S.schedule();return r0.apply(P,arguments)};
  window.addEventListener('online',function(){S.setState('saving');S.flush({force:true}).then(S.pull)});
  window.addEventListener('offline',function(){S.setState('offline')});
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden')S.flush({keepalive:true});else S.pull()});
  window.addEventListener('pagehide',function(){S.flush({keepalive:true})});
  window.addEventListener('beforeunload',function(e){S.flush({keepalive:true});if(S.queue.length&&navigator.onLine){e.preventDefault();e.returnValue=''}});
  setInterval(function(){if(document.visibilityState!=='hidden')S.pull()},60000);
  setInterval(function(){if(S.queue.length)S.flush()},15000);
  if(S.queue.length)S.flush();
  if(!navigator.onLine)S.setState('offline');
};
})();
