/* =====================================================================
   STABL LIVE · Synchronisation de window.DATA avec le serveur, y compris hors connexion
   Les écrans de la démo modifient DATA en place. Après chaque interaction (anti-rebond 400 ms), on compare
   à l'instantané et on met en file les objets changés. La file est enregistrée dans IndexedDB (PL.store) :
   elle survit à la fermeture de l'appli, au redémarrage de la tablette et aux coupures de réseau.
   Chaque opération porte :
     op_id  identifiant unique : rejouée deux fois, elle n'est appliquée qu'une fois (pas de doublon) ;
     base   l'objet avant modification : si quelqu'un l'a changé entre-temps, le serveur fusionne champ par champ ;
     at     l'heure de la modification : pour un même champ changé des deux côtés, la plus récente gagne.
   Envoi dans l'ordre, par lots de 100, au retour du réseau, au retour au premier plan, au démarrage et
   toutes les 15 s tant qu'il reste quelque chose. Réception des changements des autres appareils : toutes
   les 60 s et au retour au premier plan (/api/records/changes).
   ===================================================================== */
(function(){
var P=window.P,D=window.DATA,PL=window.PL;
var S=PL.sync={snap:{},queue:[],state:'ok',refused:{},lastPull:null,timer:0,busy:false,listeners:[],loaded:false};
var CHUNK=100;

function plain(o){return o&&typeof o==='object'&&!Array.isArray(o)&&!(o instanceof Date)}
function ser(v){try{return JSON.stringify(v,function(k,x){return typeof x==='function'?undefined:x})}catch(e){return null}}
function parse(s){try{return s==null?null:JSON.parse(s)}catch(e){return null}}
/* une file par utilisateur et par club : un autre compte sur la même tablette ne voit pas la file du précédent */
function qkey(){return 'sync:'+((PL.user||{}).id||'')+':'+(PL.clubId||'')}
var saveT=0;
function saveQueue(now){clearTimeout(saveT);var k=qkey(),v={at:Date.now(),queue:S.queue.map(function(q){var x={};for(var i in q)if(i!=='inflight')x[i]=q[i];return x}),lastPull:S.lastPull};
  var go=function(){PL.store.set(k,v).catch(function(){});
    /* copie de secours synchrone (fermeture brutale de l'onglet pendant l'écriture IndexedDB) */
    try{var js=JSON.stringify(v);if(js.length<1.5e6)localStorage.setItem('stabl:bak:'+k,js);else localStorage.removeItem('stabl:bak:'+k)}catch(e){}};
  if(now)go();else saveT=setTimeout(go,120)}
function loadQueue(){var k=qkey(),bak=null;try{bak=JSON.parse(localStorage.getItem('stabl:bak:'+k)||'null')}catch(e){}
  /* ancienne file (localStorage, version précédente de l'appli) : reprise une fois */
  var old=null;try{old=JSON.parse(localStorage.getItem('piaffe:live:queue:'+(PL.clubId||''))||'null');if(old)localStorage.removeItem('piaffe:live:queue:'+(PL.clubId||''))}catch(e){}
  return PL.store.get(k).catch(function(){return null}).then(function(v){
    var best=v&&bak?(bak.at>v.at?bak:v):(v||bak);
    S.queue=best&&Array.isArray(best.queue)?best.queue:[];
    if(best&&best.lastPull&&(!S.lastPull||best.lastPull>S.lastPull))S.lastPull=best.lastPull;
    if(Array.isArray(old))old.forEach(function(q){if(q&&q.coll&&q.id){q.opId=q.opId||PL.uid('op');S.queue.push(q)}});
    S.queue.forEach(function(q){q.inflight=false;if(!q.opId)q.opId=PL.uid('op')});S.loaded=true;emit()})}

/* collections suivies et leur forme : 'rows' (objets avec id) ou 'blob' (un seul enregistrement) */
S.tracked=function(){var out=[];Object.keys(D).forEach(function(k){if(!PL.isColl(k)||PL.NOSYNC.indexOf(k)>=0||k.charAt(0)==='_'||k==='club')return;if(S.refused[k])return;out.push(k)});return out};
function shape(v){if(!Array.isArray(v))return 'blob';for(var i=0;i<v.length;i++)if(!plain(v[i]))return 'blob';return 'rows'}
function rowsOf(k){var v=D[k],m={};
  if(S.isSingleton(k)){m._=ser(v);return m}
  if(shape(v)==='blob')return m;
  v.forEach(function(o){if(o.id==null||o.id==='')o.id=PL.uid('r');m[String(o.id)]=ser(o)});return m}
S.SINGLE=['club','facts','coachDeals','coachRules','shifts','empNotes','hr','bankSuggest','breeding','homeShow','pfAge'];
S.isSingleton=function(k){return (PL.boot&&PL.boot.singletons||S.SINGLE).indexOf(k)>=0};
function current(){var c={};S.tracked().forEach(function(k){c[k]=rowsOf(k)});if(PL.isManager&&PL.isManager())c.club=rowsOf('club');return c}
S.takeSnapshot=function(){S.snap=current()};

/* ---------- Diff ---------- */
function diff(){var cur=current(),ops=[],at=new Date().toISOString();
  Object.keys(cur).forEach(function(k){var a=S.snap[k]||{},b=cur[k];
    Object.keys(b).forEach(function(id){if(a[id]!==b[id])ops.push({op:'upsert',coll:k,id:id,data:parse(b[id]),base:id in a?parse(a[id]):null,at:at})});
    Object.keys(a).forEach(function(id){if(!(id in b))ops.push({op:'delete',coll:k,id:id,base:parse(a[id]),at:at})});
  });
  S.snap=cur;return ops}
/* mise en file : la dernière modification d'un objet remplace celle qui attend encore, en gardant la version
   et la base de départ (ce que le serveur connaissait) ; derrière un envoi en cours, on ajoute à la suite */
function enqueue(ops){ops.forEach(function(o){var key=o.coll+'/'+o.id,prev=null,inflight=null;
    for(var i=S.queue.length-1;i>=0;i--){var q=S.queue[i];if(q.coll!==o.coll||q.id!==o.id)continue;if(q.inflight){inflight=inflight||q;continue}prev=q;S.queue.splice(i,1)}
    if(prev){o.base=prev.base;o.version=prev.version;if(prev.created&&o.op==='delete'){/* créé puis supprimé avant tout envoi : rien à envoyer */return}o.created=prev.created}
    else if(inflight){o.version=inflight.op==='delete'?null:(inflight.version!=null?inflight.version+1:1);o.base=inflight.op==='delete'?null:inflight.data}
    else{var v=PL.versions[key];if(v!=null)o.version=v;else if(o.op==='upsert'){o.version=0;o.created=true}}
    o.opId=PL.uid('op');S.queue.push(o)});
  saveQueue();emit()}

/* ---------- État affiché ---------- */
function emit(){S.listeners.forEach(function(f){try{f(S.state)}catch(e){}})}
S.setState=function(st){var ch=S.state!==st;S.state=st;try{document.body.classList.toggle('lv-offline',st==='offline')}catch(e){}if(ch||st==='offline'||st==='saving')emit()};
/* changements en attente : données du club + file générique (photos…) */
S.pending=function(){return S.queue.length+(PL.queue?PL.queue.count():0)};
if(PL.queue)PL.queue.on(function(){emit()});

/* ---------- Envoi ---------- */
S.flush=function(o){o=o||{};if(!PL.clubId||PL.readonly||!S.loaded)return Promise.resolve();
  var ops=diff();if(ops.length)enqueue(ops);
  if(ops.some(function(o){return o.coll==='club'})&&navigator.onLine!==false)PL.saveClubLegal&&PL.saveClubLegal();
  if(!S.queue.length){if(S.state!=='offline'||navigator.onLine!==false)S.setState('ok');return Promise.resolve()}
  if(S.busy)return S.busyP||Promise.resolve();
  if(navigator.onLine===false&&!o.force){S.setState('offline');return Promise.resolve()}
  /* un objet en cours d'envoi bloque ses suivants (ordre garanti par objet) */
  var sending={},batch=[];
  /* lots de 100 opérations et d'environ 700 Ko au plus */
  for(var i=0,size=0;i<S.queue.length&&batch.length<CHUNK;i++){var q=S.queue[i],key=q.coll+'/'+q.id;if(sending[key])continue;var sz=(ser(q.data)||'').length+(ser(q.base)||'').length+200;if(batch.length&&size+sz>7e5)break;size+=sz;sending[key]=1;batch.push(q)}
  if(!batch.length)return Promise.resolve();
  batch.forEach(function(q){q.inflight=true});S.busy=true;S.setState('saving');
  var body={ops:batch.map(function(q){var x={op:q.op,coll:q.coll,id:q.id,op_id:q.opId,at:q.at};if(q.data)x.data=q.data;if(q.version!=null)x.version=q.version;if(q.base!==undefined)x.base=q.base;return x})};
  S.busyP=PL.api('POST','/api/records/batch',body,{keepalive:!!o.keepalive&&JSON.stringify(body).length<60000}).then(function(j){
    var res=(j&&j.results)||[],conflicts=[],refused=[],merged=[];
    batch.forEach(function(q,i){var r=res[i]&&res[i].coll===q.coll&&String(res[i].id)===String(q.id)?res[i]:res.filter(function(x){return x.coll===q.coll&&String(x.id)===String(q.id)})[0]||{ok:false};
      var idx=S.queue.indexOf(q);if(idx>=0)S.queue.splice(idx,1);
      if(r.ok){var key=q.coll+'/'+q.id;
        if(q.op==='delete'||r.deleted)delete PL.versions[key];else if(r.version!=null)PL.versions[key]=r.version;
        /* les modifications suivantes du même objet partent de cette version */
        S.queue.forEach(function(n){if(n.coll===q.coll&&n.id===q.id&&!n.inflight&&r.version!=null&&q.op!=='delete')n.version=r.version});
        if(r.merged&&r.data){merged.push({q:q,r:r})}
        return}
      if(r.conflict){conflicts.push({q:q,r:r});return}
      refused.push({q:q,r:r})});
    saveQueue();S.busy=false;S.lastOk=Date.now();
    if(merged.length)applyMerged(merged);
    if(conflicts.length)resolveConflicts(conflicts);
    if(refused.length)handleRefused(refused);
    S.setState(S.queue.length?'saving':'ok');PL.saveBootSoon&&PL.saveBootSoon();
    if(S.queue.length)return S.flush();
  },function(e){batch.forEach(function(q){q.inflight=false});S.busy=false;saveQueue();
    if(e.offline){S.setState('offline');return}
    if(e.status===401){S.setState('offline');PL.sessionLost&&PL.sessionLost();return}
    if(e.status===402){S.setState('error');S.lastError=e.message;PL.planBanner&&PL.planBanner(e.message);return}
    if(e.unavailable){S.setState('error');S.lastError='L’enregistrement n’est pas encore disponible sur ce serveur.';return}
    if(e.status===413||e.status===400){/* un objet invalide ne doit pas bloquer la file */S.queue=S.queue.filter(function(q){return batch.indexOf(q)<0});saveQueue();P.toast('Une modification n’a pas pu être enregistrée : '+PL.msg(e),{icon:'alert',ms:6000})}
    S.setState('error');S.lastError=PL.msg(e)});
  return S.busyP};

/* ---------- Fusions et conflits ---------- */
function label(coll,data){data=data||{};var n=data.name||data.title||((data.first||'')+' '+(data.last||'')).trim();return n?'« '+n+' »':'Un élément'}
var FIELD={name:'le nom',title:'l’intitulé',box:'le box',paddock:'le paddock',note:'la note',status:'l’état',date:'la date',time:'l’heure',start:'l’horaire',cap:'le nombre de places',coach:'le moniteur',
  riders:'les cavaliers',horses:'les chevaux',email:'l’e-mail',phone:'le téléphone',qty:'la quantité',done:'la case « fait »',who:'l’intervenant',kind:'le type',forfait:'le forfait',balance:'le solde'};
function fieldFr(f){var k=String(f||'').split(/[.\[]/)[0];return FIELD[k]||'« '+k+' »'}
function applyMerged(list){var msgs=[];
  list.forEach(function(m){var q=m.q,r=m.r,later=S.queue.some(function(n){return n.coll===q.coll&&n.id===q.id});
    /* le résultat fusionné devient la version locale (sauf si l'utilisateur a déjà refait une modification) */
    if(!later)applyServerObject(q.coll,q.id,r.data,r.version,false);
    (r.conflicts||[]).forEach(function(c){msgs.push(label(q.coll,r.data)+' : '+fieldFr(c.field)+' avait aussi été changé par une autre personne. '+(c.kept==='yours'?'Votre modification, la plus récente, a été gardée.':'La sienne, plus récente, a été gardée.'))})});
  PL.derive&&PL.derive();S.softRerender(true);
  if(msgs.length)P.toast(msgs.length>1?msgs.length+' éléments avaient aussi été modifiés par d’autres personnes : pour chaque champ, la modification la plus récente a été gardée.':msgs[0],{icon:'refresh',ms:8000})}
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
  p.then(function(){var c=list[0],gone=c.r.deleted&&c.q.op==='upsert';
    P.toast(list.length>1?list.length+' éléments ont été modifiés ou supprimés sur un autre appareil pendant ce temps : leur version la plus récente est affichée.':
      label(c.q.coll,c.r.data||c.q.data)+(gone?' a été supprimé par une autre personne pendant ce temps : votre modification n’a pas pu être enregistrée.':' a été modifié par une autre personne pendant ce temps : la version la plus récente est affichée, refaites votre changement si besoin.'),{icon:'refresh',ms:8000});
    S.softRerender(true)})}
function handleRefused(list){
  /* collection inconnue du serveur : on cesse simplement de l'envoyer ; droit refusé : on remet l'état du serveur et on prévient */
  var shown=[];
  list.forEach(function(x){var e=x.r.error||{},code=e.code||x.r.code||'';
    if(code==='unknown_collection'||code==='invalid_id'&&x.q.coll.charAt(0)==='_'){S.refused[x.q.coll]=true;console.info('[live] collection non synchronisée :',x.q.coll);return}
    if(x.r.data!==undefined||x.r.version!=null)applyServerObject(x.q.coll,x.q.id,x.r.data||null,x.r.version,!x.r.data);
    else if(x.q.op==='upsert'&&PL.versions[x.q.coll+'/'+x.q.id]==null){/* création refusée : on retire l'objet ajouté localement */applyServerObject(x.q.coll,x.q.id,null,null,true)}
    else if(x.q.base){applyServerObject(x.q.coll,x.q.id,x.q.base,null,false)}
    var m=e.message||(code==='forbidden'?'vous n’avez pas le droit de modifier cet élément.':code==='too_large'?'cet élément est trop volumineux.':code==='lesson_full'?'cette reprise est complète.':'');
    if(m&&shown.indexOf(m)<0)shown.push(m)});
  if(shown.length){P.toast('Modification non enregistrée : '+shown[0].charAt(0).toLowerCase()+shown[0].slice(1),{icon:'lock',ms:6500});S.softRerender(true)}}

/* ---------- Réception des changements des autres appareils ---------- */
S.pull=function(){if(!PL.clubId||S.busy||navigator.onLine===false||S.pulling||!S.loaded)return Promise.resolve();S.pulling=true;var n=0;
  function page(since){return PL.get('/api/records/changes?since='+encodeURIComponent(since)).then(function(j){
    (j.changes||[]).forEach(function(c){var coll=c.coll,id=String(c.id);if(!coll||coll==='invoices')return;
      /* un objet que l'on est en train de modifier : notre envoi fusionnera avec la version du serveur */
      if(S.queue.some(function(q){return q.coll===coll&&String(q.id)===id}))return;
      var known=PL.versions[coll+'/'+id];if(known!=null&&c.version!=null&&c.version<=known)return;
      if(applyServerObject(coll,id,c.data,c.version,c.deleted))n++});
    S.lastPull=j.next_since||j.server_time||since;if(j.more)return page(S.lastPull)})}
  return page(S.lastPull||PL.serverTime).then(function(){S.pulling=false;if(S.state==='offline')S.setState(S.queue.length?'saving':'ok');
    if(n){PL.derive();S.softRerender();PL.saveBootSoon&&PL.saveBootSoon()}saveQueue()},
    function(e){S.pulling=false;if(e.offline)S.setState('offline');else if(e.status===401)PL.sessionLost&&PL.sessionLost()})};

/* ne redessine pas sous les doigts de l'utilisateur */
S.softRerender=function(force){var a=document.activeElement;if(!force&&a&&/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName))return;if(!force&&document.querySelector('.app .sheet'))return;try{P.rerender();P.renderBadges()}catch(e){}};

/* ---------- Déclencheurs ---------- */
S.schedule=function(){clearTimeout(S.timer);S.timer=setTimeout(function(){S.flush()},400)};
/* retour du réseau : on envoie d'abord, on reçoit ensuite */
S.resume=function(){if(!PL.clubId)return Promise.resolve();return S.flush({force:true}).then(function(){return S.pull()}).then(function(){PL.queue&&PL.queue.run()})};
S.start=function(){
  S.takeSnapshot();
  ['click','change','submit'].forEach(function(ev){document.addEventListener(ev,function(){S.schedule()},false)});
  document.addEventListener('keyup',function(e){if(e.key==='Enter')S.schedule()});
  document.addEventListener('pointerup',function(){S.schedule()});
  var t0=P.toast;P.toast=function(){S.schedule();return t0.apply(P,arguments)};
  var r0=P.rerender;P.rerender=function(){S.schedule();return r0.apply(P,arguments)};
  window.addEventListener('online',function(){S.setState(S.queue.length?'saving':'ok');S.resume()});
  window.addEventListener('offline',function(){S.setState('offline')});
  document.addEventListener('visibilitychange',function(){if(document.visibilityState==='hidden'){S.flush({keepalive:true});saveQueue(true)}else S.resume()});
  window.addEventListener('pagehide',function(){var ops=diff();if(ops.length)enqueue(ops);saveQueue(true);S.flush({keepalive:true})});
  window.addEventListener('focus',function(){if(S.queue.length||S.state==='offline')S.resume()});
  setInterval(function(){if(document.visibilityState!=='hidden')S.pull()},60000);
  /* iOS n'a pas de synchro en arrière-plan : on retente régulièrement tant qu'il reste des changements */
  setInterval(function(){if(S.queue.length)S.flush({force:S.state==='offline'})},15000);
  if(navigator.onLine===false)S.setState('offline');
  /* les modifications faites hors ligne avant la fermeture sont réappliquées par-dessus les données du serveur */
  return loadQueue().then(function(){
    S.queue.forEach(function(q){if(q.op==='upsert')applyServerObject(q.coll,q.id,q.data,null,false);else applyServerObject(q.coll,q.id,null,null,true)});
    /* l'instantané redevient celui du serveur pour les objets en file : la base de la prochaine modification reste la bonne */
    S.queue.forEach(function(q){if(!S.snap[q.coll])S.snap[q.coll]={};if(q.op==='upsert')S.snap[q.coll][q.id]=ser(PL.normalize(q.coll,JSON.parse(JSON.stringify(q.data))))});
    if(S.queue.length){PL.derive&&PL.derive();S.softRerender(true);S.flush()}else if(navigator.onLine!==false)S.pull();
    emit()});
};
})();
