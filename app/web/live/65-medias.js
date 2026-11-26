/* =====================================================================
   PIAFFE LIVE · Photos des chevaux (profil, marques, soins) sur R2
   Branche window.STABL_MEDIA, le magasin de photos lu par demo/modules/30-chevaux.js :
     list(horseId) · add(horseId, {id, blob, thumb, kind, zone, care, note, w, h, author}) · remove(horseId, id)
     src(id, thumb) · onChange(fn)
   Hors ligne (fond de l'écurie, tablette sans wifi) : la photo compressée est rangée sur l'appareil
   (PL.store, IndexedDB : clé « media:<id> »), affichée tout de suite avec le badge « En attente d'envoi »,
   et son envoi passe par la file générique PL.queue (type « media ») : même indicateur « N changements
   en attente » que le reste, reprise au retour du réseau, au premier plan, au démarrage et par minuterie.
   L'identifiant (med_…) est créé sur l'appareil : un envoi rejoué ne crée jamais de doublon (POST /api/media idempotent).
   Les photos restées dans l'ancienne file (base IndexedDB « stabl-media ») sont reprises au démarrage.
   ===================================================================== */
(function(){
var PL=window.PL;if(!PL||!PL.queue||!PL.store)return;
var T='media',blobs={},meta={},urls={},cache={},subs=[],direct={},loaded=null;

function fire(h){subs.forEach(function(f){try{f(h)}catch(e){}})}
function bkey(id){return 'media:'+id}
function objUrl(id,thumb){var k=id+(thumb?':t':'');if(!urls[k]){var b=blobs[id];if(!b)return null;b=thumb?(b.thumb||b.blob):b.blob;if(!b)return null;urls[k]=URL.createObjectURL(b)}return urls[k]}
function pendingPhoto(m){return {id:m.id,horse:m.horse,kind:m.kind,zone:m.zone,note:m.note,url:objUrl(m.id,false),thumb:objUrl(m.id,true),date:m.date,author:m.author,pending:true}}
function fromServer(m){return {id:m.id,horse:m.horse,kind:m.kind,zone:m.zone,care:m.care,note:m.note||'',url:urls[m.id]||m.url,thumb:urls[m.id+':t']||m.thumb,date:m.created_at,author:m.author&&m.author.name||'',w:m.w,h:m.h}}
function pendList(h){return Object.keys(meta).map(function(k){return meta[k]}).filter(function(m){return m.horse===h&&(!m.club||m.club===PL.clubId)})}
/* le fichier est gardé dans IndexedDB (accepte les Blob) ; sans IndexedDB, il ne vit que le temps de la visite */
function keepBlob(id,b){blobs[id]=b;return PL.store.mode()==='idb'?PL.store.set(bkey(id),b).catch(function(){}):Promise.resolve()}
function dropLocal(id){delete meta[id];delete blobs[id];return PL.store.del(bkey(id)).catch(function(){})}
function horseName(id){var h=(window.DATA&&DATA.horses||[]).filter(function(x){return x.id===id})[0];return h&&h.name||'votre cheval'}

/* ---------- Envoi ---------- */
function upload(m,b){var f=new FormData();f.append('id',m.id);f.append('horse',m.horse);f.append('kind',m.kind||'profil');
  ['zone','care','note'].forEach(function(k){if(m[k])f.append(k,m[k])});if(m.w)f.append('w',String(m.w));if(m.h)f.append('h',String(m.h));f.append('taken_at',m.date);
  f.append('file',b.blob,m.id+(b.blob.type==='image/webp'?'.webp':'.jpg'));if(b.thumb)f.append('thumb',b.thumb,m.id+'_t'+(b.thumb.type==='image/webp'?'.webp':'.jpg'));
  return PL.api('POST','/api/media',f).then(function(j){return j.media})}
/* même règle que PL.queue : une photo refusée pour de bon (fichier, droits) sort de la file ; une coupure la laisse pour plus tard */
function fatal(e){return !!(e&&!e.offline&&e.status&&e.status!==401&&e.status!==429&&e.status<500&&!e.unavailable)}
/* pour PL.queue : tout ce qui n'est pas un refus définitif doit être réessayé (route pas encore livrée comprise) */
function later(e){if(fatal(e))return e;var x=new Error(e&&e.message||'réseau');x.status=e&&e.status>=500?e.status:503;x.offline=!!(e&&e.offline);return x}
function sent(m,server){var h=m.horse;dropLocal(m.id);(cache[h]||[]).forEach(function(p,i,a){if(p.id===m.id)a[i]=fromServer(server)});fire(h)}
function refused(m){var h=m.horse;dropLocal(m.id);cache[h]=(cache[h]||[]).filter(function(p){return p.id!==m.id});fire(h)}
function load(id){if(blobs[id])return Promise.resolve(blobs[id]);return PL.store.get(bkey(id)).then(function(b){if(b&&b.blob)blobs[id]=b;return blobs[id]||null},function(){return null})}

PL.queue.register(T,{
  label:function(it){return 'Photo de '+horseName(it.data&&it.data.horse)},
  send:function(it){var m=it.data;meta[m.id]=meta[m.id]||m;
    /* envoi déjà lancé par add() (en ligne) : on le réutilise au lieu d'en refaire un */
    if(direct[m.id]){var p=direct[m.id];delete direct[m.id];return p.then(function(){},function(e){if(fatal(e))return;throw later(e)})}
    return load(m.id).then(function(b){
      if(!b){refused(m);var e=new Error('la photo n’est plus sur cet appareil. Reprenez-la.');e.status=410;throw e}
      return upload(m,b).then(function(server){sent(m,server);announce()},function(e){if(fatal(e))refused(m);throw later(e)})})}
});
/* un seul message après une rafale d'envois au retour du réseau */
var annT=0,annN=0;function announce(){annN++;clearTimeout(annT);annT=setTimeout(function(){var n=annN;annN=0;try{P.toast(n>1?n+' photos envoyées':'Photo envoyée',{icon:'checkc'})}catch(x){}},900)}

/* ---------- Démarrage : photos en attente (et reprise de l'ancienne file) ---------- */
function ready(){if(loaded)return loaded;
  loaded=migrate().then(function(){return PL.queue.list(T)}).then(function(items){
    return Promise.all(items.map(function(it){var m=it.data||{};if(!m.id)return null;meta[m.id]=m;if(!m.club)m.club=it.club;return load(m.id)}))}).catch(function(){});
  return loaded}
/* ancienne file locale (avant PL.queue) : base « stabl-media », magasin « queue », objets {id, club, horse, blob, thumb, …} */
function oldDb(){return new Promise(function(res){var t=setTimeout(function(){res(null)},3000);try{if(!window.indexedDB)return res(null);
  var fresh=false,r=indexedDB.open('stabl-media',1);r.onupgradeneeded=function(){fresh=true;r.result.createObjectStore('queue',{keyPath:'id'})};
  r.onsuccess=function(){clearTimeout(t);var d=r.result;if(fresh){d.close();try{indexedDB.deleteDatabase('stabl-media')}catch(e){}return res(null)}res(d)};
  r.onerror=r.onblocked=function(){clearTimeout(t);res(null)}}catch(e){clearTimeout(t);res(null)}})}
function oldTx(d,mode,fn){return new Promise(function(res,rej){try{var t=d.transaction('queue',mode),out=fn(t.objectStore('queue'));t.oncomplete=function(){res(out&&out.result)};t.onerror=t.onabort=function(){rej(t.error)}}catch(e){rej(e)}})}
function migrate(){if(!PL.clubId)return Promise.resolve();
  return oldDb().then(function(d){if(!d)return;
    return oldTx(d,'readonly',function(s){return s.getAll()}).then(function(items){
      /* seulement les photos du club ouvert : celles d'un autre club attendent qu'on l'ouvre */
      var mine=(items||[]).filter(function(it){return it&&it.id&&it.blob&&(!it.club||it.club===PL.clubId)}),left=(items||[]).length-mine.length;
      return mine.reduce(function(p,it){return p.then(function(){
        var m={id:it.id,club:PL.clubId,horse:it.horse,kind:it.kind||'profil',zone:it.zone||null,care:it.care||null,note:it.note||'',w:it.w,h:it.h,author:it.author||'',date:it.date||new Date().toISOString()};
        meta[m.id]=m;
        return keepBlob(m.id,{blob:it.blob,thumb:it.thumb||null}).then(function(){return PL.queue.add(T,m,{id:m.id})})
          .then(function(){return oldTx(d,'readwrite',function(s){s.delete(it.id)})})})},Promise.resolve())
      .then(function(){d.close();if(!left)try{indexedDB.deleteDatabase('stabl-media')}catch(e){}})})
    .catch(function(){try{d.close()}catch(e){}})})}

window.STABL_MEDIA={
  list:function(h){return ready().then(function(){var pend=pendList(h);
    return PL.get('/api/media?horse='+encodeURIComponent(h)).then(function(j){var server=(j.media||[]).map(fromServer),ids={};server.forEach(function(p){ids[p.id]=1});
      var out=pend.filter(function(m){return !ids[m.id]}).map(pendingPhoto).concat(server);cache[h]=out;return out.slice()},
      function(e){if(e.offline||e.unavailable){var c=(cache[h]||[]).filter(function(p){return !p.pending});return pend.map(pendingPhoto).concat(c)}throw e})})},
  add:function(h,o){var m={id:o.id||PL.uid('med'),club:PL.clubId,horse:h,kind:o.kind||'profil',zone:o.zone||null,care:o.care||null,note:o.note||'',w:o.w,h:o.h,author:o.author||'',date:new Date().toISOString()},
      b={blob:o.blob,thumb:o.thumb||null};
    meta[m.id]=m;
    return keepBlob(m.id,b).then(function(){var p=pendingPhoto(m);(cache[h]=cache[h]||[]).unshift(p);
      var online=navigator.onLine!==false;
      /* en ligne : on lance l'envoi tout de suite (la file le réutilise) pour signaler un refus à l'écran */
      var d=online?direct[m.id]=upload(m,b):null;
      return PL.queue.add(T,m,{id:m.id}).then(function(){
        if(!d)return p;
        return new Promise(function(res,rej){var done=false,t=setTimeout(function(){if(!done){done=true;res(p)}},15000);
          d.then(function(server){sent(m,server);if(done)return;done=true;clearTimeout(t);res(cache[h].filter(function(x){return x.id===m.id})[0]||fromServer(server))},
            function(e){if(fatal(e)){refused(m);PL.queue.remove(m.id)}if(done)return;done=true;clearTimeout(t);if(fatal(e))rej(new Error(PL.msg(e)));else res(p)})})})})},
  remove:function(h,id){if(meta[id]){delete direct[id];return PL.queue.remove(id).then(function(){return dropLocal(id)}).then(function(){cache[h]=(cache[h]||[]).filter(function(p){return p.id!==id});fire(h)})}
    return PL.del('/api/media/'+encodeURIComponent(id)).then(function(){cache[h]=(cache[h]||[]).filter(function(p){return p.id!==id});fire(h)},
      function(e){throw new Error(e.offline?'Pas de réseau : la photo sera supprimable dès le retour de la connexion.':PL.msg(e))})},
  src:function(id,thumb){if(!id||typeof id!=='string')return null;var k=id+(thumb?':t':'');if(urls[k])return urls[k];if(blobs[id])return objUrl(id,thumb);
    if(!/^med_[A-Za-z0-9_-]+$/.test(id))return null;return '/api/media/'+encodeURIComponent(id)+'/file'+(thumb?'?v=thumb':'')},
  onChange:function(f){subs.push(f)},
  flush:function(){return ready().then(function(){return PL.queue.run()})},
  pending:function(){return Object.keys(meta).filter(function(k){return !meta[k].club||meta[k].club===PL.clubId}).length},
  ready:ready
};

/* dès que le club est connu : reprise des photos en attente (et de l'ancienne file), puis envoi */
(function wait(n){if(PL.clubId&&PL.ready)return ready().then(function(){PL.queue.run()});if(n<240)setTimeout(function(){wait(n+1)},500)})(0);
})();
