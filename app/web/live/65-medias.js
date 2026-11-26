/* =====================================================================
   PIAFFE LIVE · Photos des chevaux (profil, marques, soins) sur R2
   Branche window.STABL_MEDIA, le magasin de photos lu par demo/modules/30-chevaux.js :
     list(horseId) · add(horseId, {id, blob, thumb, kind, zone, care, note, w, h, author}) · remove(horseId, id)
     src(id, thumb) · onChange(fn)
   Hors ligne (fond de l'écurie, tablette sans wifi) : la photo compressée est rangée dans IndexedDB,
   affichée tout de suite avec le badge « En attente d'envoi », puis envoyée au retour du réseau.
   L'identifiant (med_…) est créé sur l'appareil : un envoi rejoué ne crée jamais de doublon (POST /api/media idempotent).
   ===================================================================== */
(function(){
var PL=window.PL;if(!PL)return;
var DBN='stabl-media',ST='queue',dbp=null,mem={},urls={},cache={},subs=[],busy=false;

/* ---------- IndexedDB (repli en mémoire si indisponible : navigation privée…) ---------- */
function db(){if(dbp)return dbp;dbp=new Promise(function(res){try{var r=indexedDB.open(DBN,1);
  r.onupgradeneeded=function(){r.result.createObjectStore(ST,{keyPath:'id'})};r.onsuccess=function(){res(r.result)};r.onerror=function(){res(null)};r.onblocked=function(){res(null)}}catch(e){res(null)}});return dbp}
function tx(mode,fn){return db().then(function(d){if(!d)return fn(null);return new Promise(function(res,rej){var t=d.transaction(ST,mode),s=t.objectStore(ST),out=fn(s);t.oncomplete=function(){res(out&&out.result!==undefined?out.result:out)};t.onerror=function(){rej(t.error)};t.onabort=function(){rej(t.error)}})})}
function qPut(it){mem[it.id]=it;return tx('readwrite',function(s){if(s)s.put(it)}).catch(function(){})}
function qDel(id){delete mem[id];return tx('readwrite',function(s){if(s)s.delete(id)}).catch(function(){})}
function qAll(){return tx('readonly',function(s){return s?s.getAll():null}).then(function(r){(r||[]).forEach(function(it){if(!mem[it.id])mem[it.id]=it});return Object.keys(mem).map(function(k){return mem[k]})},function(){return Object.keys(mem).map(function(k){return mem[k]})})}

function fire(h){subs.forEach(function(f){try{f(h)}catch(e){}})}
function objUrl(it,thumb){var k=it.id+(thumb?':t':'');if(!urls[k]){var b=thumb?(it.thumb||it.blob):it.blob;if(!b)return null;urls[k]=URL.createObjectURL(b)}return urls[k]}
function pendingPhoto(it){return {id:it.id,horse:it.horse,kind:it.kind,zone:it.zone,note:it.note,url:objUrl(it,false),thumb:objUrl(it,true),date:it.date,author:it.author,pending:true}}
function fromServer(m){return {id:m.id,horse:m.horse,kind:m.kind,zone:m.zone,care:m.care,note:m.note||'',url:urls[m.id]||m.url,thumb:urls[m.id+':t']||m.thumb,date:m.created_at,author:m.author&&m.author.name||'',w:m.w,h:m.h}}

/* ---------- Envoi ---------- */
function upload(it){var f=new FormData();f.append('id',it.id);f.append('horse',it.horse);f.append('kind',it.kind||'profil');
  ['zone','care','note'].forEach(function(k){if(it[k])f.append(k,it[k])});if(it.w)f.append('w',String(it.w));if(it.h)f.append('h',String(it.h));f.append('taken_at',it.date);
  f.append('file',it.blob,it.id+(it.blob.type==='image/webp'?'.webp':'.jpg'));if(it.thumb)f.append('thumb',it.thumb,it.id+'_t'+(it.thumb.type==='image/webp'?'.webp':'.jpg'));
  return PL.api('POST','/api/media',f).then(function(j){return j.media})}
/* une photo refusée pour de bon (fichier, droits) sort de la file ; une coupure la laisse pour plus tard */
function fatal(e){return e&&!e.offline&&e.status&&e.status!==401&&e.status!==429&&e.status<500&&!e.unavailable}
function flush(){if(busy||!PL.clubId||!navigator.onLine)return Promise.resolve();busy=true;
  return qAll().then(function(items){items=items.filter(function(it){return it.club===PL.clubId}).sort(function(a,b){return a.date<b.date?-1:1});
    var sent=0;
    function next(){var it=items.shift();if(!it)return;
      return upload(it).then(function(m){sent++;qDel(it.id);it.done=m;(cache[it.horse]||[]).forEach(function(p,i,a){if(p.id===it.id)a[i]=fromServer(m)});fire(it.horse);return next()},
        function(e){if(fatal(e)){qDel(it.id);(cache[it.horse]=(cache[it.horse]||[]).filter(function(p){return p.id!==it.id}));fire(it.horse);
            try{P.toast('Une photo n’a pas pu être envoyée : '+PL.msg(e).charAt(0).toLowerCase()+PL.msg(e).slice(1),{icon:'alert',ms:6500})}catch(x){}return next()}
          throw e})}
    return next().then(function(){if(sent)try{P.toast(sent>1?sent+' photos envoyées':'Photo envoyée',{icon:'checkc'})}catch(x){}})})
  .catch(function(){}).then(function(){busy=false})}

window.STABL_MEDIA={
  list:function(h){var pend=Object.keys(mem).map(function(k){return mem[k]}).filter(function(it){return it.horse===h&&it.club===PL.clubId});
    return PL.get('/api/media?horse='+encodeURIComponent(h)).then(function(j){var server=(j.media||[]).map(fromServer),ids={};server.forEach(function(p){ids[p.id]=1});
      var out=pend.filter(function(it){return !ids[it.id]}).map(pendingPhoto).concat(server);cache[h]=out;return out.slice()},
      function(e){if(e.offline||e.unavailable){var c=(cache[h]||[]).filter(function(p){return !p.pending});return pend.map(pendingPhoto).concat(c)}throw e})},
  add:function(h,o){var it={id:o.id,club:PL.clubId,horse:h,kind:o.kind||'profil',zone:o.zone||null,care:o.care||null,note:o.note||'',w:o.w,h:o.h,author:o.author||'',date:new Date().toISOString(),blob:o.blob,thumb:o.thumb||null};
    return qPut(it).then(function(){var p=pendingPhoto(it);(cache[h]=cache[h]||[]).unshift(p);
      if(!navigator.onLine)return p;
      /* en ligne : on attend l'envoi (15 s au plus) pour signaler tout de suite un refus */
      return new Promise(function(res,rej){var done=false,t=setTimeout(function(){if(!done){done=true;res(p);flush()}},15000);
        upload(it).then(function(m){qDel(it.id);if(done)return fire(h);done=true;clearTimeout(t);var q=fromServer(m);cache[h][0]=q;res(q)},
          function(e){if(done)return;done=true;clearTimeout(t);if(fatal(e)){qDel(it.id);cache[h]=cache[h].filter(function(x){return x.id!==it.id});rej(new Error(PL.msg(e)))}else res(p)})})})},
  remove:function(h,id){if(mem[id]){return qDel(id).then(function(){cache[h]=(cache[h]||[]).filter(function(p){return p.id!==id});fire(h)})}
    return PL.del('/api/media/'+encodeURIComponent(id)).then(function(){cache[h]=(cache[h]||[]).filter(function(p){return p.id!==id});fire(h)},
      function(e){throw new Error(e.offline?'Pas de réseau : la photo sera supprimable dès le retour de la connexion.':PL.msg(e))})},
  src:function(id,thumb){if(!id||typeof id!=='string')return null;var k=id+(thumb?':t':'');if(urls[k])return urls[k];if(mem[id])return objUrl(mem[id],thumb);
    if(!/^med_[A-Za-z0-9_-]+$/.test(id))return null;return '/api/media/'+encodeURIComponent(id)+'/file'+(thumb?'?v=thumb':'')},
  onChange:function(f){subs.push(f)},
  flush:flush,pending:function(){return Object.keys(mem).length}
};

/* reprise : retour du réseau, retour sur l'onglet, et toutes les 30 s tant qu'il reste des photos à envoyer */
qAll().then(function(){if(Object.keys(mem).length)setTimeout(flush,4000)});
window.addEventListener('online',function(){setTimeout(flush,800)});
document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')flush()});
setInterval(function(){if(Object.keys(mem).length)flush()},30000);
})();
