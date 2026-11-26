/* =====================================================================
   STABL LIVE · Pages publiques du club (src/public côté serveur)
   Les écrans Cadeaux, Avis, Satisfaction et Annonce de la démo montrent des adresses d'exemple
   (sous-domaine stablapp.fr) : on les remplace par les vrais liens servis par le Worker
   (GET /api/growth/links) et on ajoute ce qui manque au gérant :
     · Cadeaux : les demandes de cartes arrivées sans paiement en ligne, « Réglée : envoyer la carte »
     · Avis : le lien à envoyer aux familles · Satisfaction : un lien de réponse par sondage
   ===================================================================== */
(function(){
var P=window.P,PL=window.PL;if(!P||!PL)return;
var F=P.fmt,esc=F.esc,LINKS=null,LT=0,LOADING=null;
function links(force){if(!force&&LINKS&&Date.now()-LT<300000)return Promise.resolve(LINKS);if(LOADING)return LOADING;
  LOADING=PL.get('/api/growth/links').then(function(j){LINKS=j;LT=Date.now();LOADING=null;return j},function(e){LOADING=null;throw e});return LOADING}
function bare(u){return String(u||'').replace(/^https?:\/\//,'')}
function copy(t,msg){try{var c=navigator.clipboard&&navigator.clipboard.writeText(t);if(c&&c.catch)c.catch(function(){})}catch(e){}P.toast(msg||'Lien copié',{icon:'link'})}
function mgr(){return PL.isManager&&PL.isManager()}
function route(){return P.state&&P.state.route}
function adId(){var a=P.state&&P.state.params&&P.state.params.id;if(a)return a;var l=(window.DATA&&DATA.horseAds||[]).filter(function(x){return x.status==='en ligne'})[0];return l&&l.id}
function adLink(id){var a=LINKS&&(LINKS.ads||[]).filter(function(x){return x.id===id})[0];return a&&a.url}

/* les boutons « copier » et « voir » des écrans de la démo pointent vers les vraies pages */
document.addEventListener('click',function(e){var r=route();if(!mgr()||(r!=='cadeaux'&&r!=='annonce'))return;
  var b=e.target.closest&&e.target.closest('[data-share],[data-see]');if(!b||!b.closest('.main'))return;
  e.preventDefault();e.stopImmediatePropagation();var see=b.hasAttribute('data-see');
  links().then(function(L){var u=r==='cadeaux'?L.offrir:adLink(adId());
    if(!u){P.toast('Publiez d’abord l’annonce pour obtenir son lien.',{icon:'info'});return}
    if(see)window.open(u,'_blank','noopener');else copy(u,r==='cadeaux'?'Lien « Offrir » copié':'Lien de l’annonce copié')},function(x){PL.fail(x,'Lien')})},true);

function card(html){var d=document.createElement('div');d.className='card pad lv-pub';d.innerHTML=html;return d}
function insertAfterHead(el,node){var ph=el.querySelector('.ph');if(ph&&ph.parentNode)ph.parentNode.insertBefore(node,ph.nextSibling);else el.insertBefore(node,el.firstChild)}
function linkRow(label,u,attr){return '<div class="lv-pub-row"><div class="grow"><div class="xs mut">'+esc(label)+'</div><span class="pf-mono lv-pub-url">'+esc(bare(u))+'</span></div><button class="btn sm" '+attr+'="'+esc(u)+'">'+ICON('copy','sm')+'Copier</button></div>'}
function bindCopies(root,msg){root.querySelectorAll('[data-lv-cp]').forEach(function(x){x.onclick=function(){copy(x.getAttribute('data-lv-cp'),msg)}})}

/* ---------- Cadeaux : vraie adresse + demandes à traiter ---------- */
function cadeaux(el){if(!mgr())return;
  links().then(function(L){if(!el.isConnected)return;el.querySelectorAll('.gr-url').forEach(function(u){u.innerHTML=ICON('globe','sm')+esc(bare(L.offrir))})}).catch(function(){});
  var R=(window.DATA&&DATA.giftRequests||[]).filter(function(r){return r.status==='demande'||r.status==='paiement'}).sort(function(a,b){return a.at<b.at?1:-1});
  if(!R.length)return;
  var n=R.length,html='<div class="hrow sp wrap" style="--g:10px;margin-bottom:6px"><div><h3 style="margin:0">'+(n>1?n+' demandes de cartes cadeaux':'Une demande de carte cadeau')+'</h3><div class="s mut">Arrivées par votre page « Offrir ». Encaissez le règlement, puis envoyez la carte : le code part tout seul par e-mail.</div></div></div><div class="list">'+
    R.map(function(r){var wait=r.status==='paiement';return '<div class="li lv-gr"><span class="ico sm d-mo">'+ICON('gift','sm')+'</span><div class="grow"><b>'+esc(r.buyer)+'</b> · '+esc(r.label||'Carte cadeau')+' · <b class="num">'+F.eur(+r.amount||0)+'</b>'+
      '<div class="xs mut">'+esc(r.email)+(r.phone?' · '+esc(r.phone):'')+(r.to?' · pour '+esc(r.to):'')+' · '+esc(String(r.at||'').slice(0,10).split('-').reverse().join('/'))+(wait?' · paiement en ligne non terminé':'')+'</div></div>'+
      '<div class="hrow" style="--g:6px"><a class="btn ghost sm" href="mailto:'+esc(r.email)+'?subject='+encodeURIComponent('Votre carte cadeau')+'">'+ICON('mail','sm')+'Écrire</a><button class="btn pri sm" data-gr-issue="'+esc(r.id)+'" data-needs-net>'+ICON('send','sm')+'Réglée : envoyer la carte</button><button class="btn ghost sm icon" data-gr-del="'+esc(r.id)+'" title="Supprimer la demande" aria-label="Supprimer la demande">'+ICON('trash','sm')+'</button></div></div>'}).join('')+'</div>';
  var c=card(html);c.classList.add('tint','d-mo');insertAfterHead(el,c);
  c.querySelectorAll('[data-gr-issue]').forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-gr-issue');b.disabled=true;
    PL.post('/api/growth/gift-requests/'+encodeURIComponent(id)+'/issue',{}).then(function(j){P.toast('Carte '+(j.code||'')+' envoyée par e-mail',{icon:'gift'});return PL.sync&&PL.sync.pull&&PL.sync.pull()}).then(function(){P.rerender&&P.rerender()},function(e){b.disabled=false;PL.fail(e,'Carte cadeau')})}});
  c.querySelectorAll('[data-gr-del]').forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-gr-del'),r=R.filter(function(x){return x.id===id})[0];
    if(!confirm('Supprimer la demande de '+(r?r.buyer:'cette personne')+' ? Rien ne lui sera envoyé.'))return;
    DATA.giftRequests=(DATA.giftRequests||[]).filter(function(x){return x.id!==id});P.rerender&&P.rerender();P.toast('Demande supprimée')}})}

/* ---------- Avis : le lien à envoyer ---------- */
function avis(el){if(!mgr())return;var c=card('<div class="lv-dots"><i></i><i></i><i></i></div>');insertAfterHead(el,c);
  links().then(function(L){if(!c.isConnected)return;c.innerHTML='<h3 style="margin:0 0 4px">Votre lien d’avis</h3><p class="s mut" style="margin:0 0 12px">Envoyez-le après une première séance : 4 ou 5 étoiles mènent à Google, une note plus basse vous arrive en privé.</p>'+linkRow('Lien à partager',L.avis,'data-lv-cp');bindCopies(c,'Lien d’avis copié')},
    function(){c.remove()})}
/* ---------- Satisfaction : un lien de réponse par sondage ---------- */
function sondages(el){if(!mgr())return;var c=card('<div class="lv-dots"><i></i><i></i><i></i></div>');insertAfterHead(el,c);
  links().then(function(L){if(!c.isConnected)return;var S=(L.surveys||[]).slice(0,6);
    if(!S.length){c.remove();return}
    c.innerHTML='<h3 style="margin:0 0 4px">Liens de réponse</h3><p class="s mut" style="margin:0 0 12px">Collez-le dans un e-mail, un SMS ou le groupe des familles : trois questions, une minute, sans compte.</p>'+S.map(function(s){return linkRow(s.title||'Sondage',s.url,'data-lv-cp')}).join('');bindCopies(c,'Lien du sondage copié')},
    function(){c.remove()})}
/* ---------- Annonce : la vraie adresse ---------- */
function annonce(el){if(!mgr())return;links().then(function(L){var u=adLink(adId());if(!u||!el.isConnected)return;el.querySelectorAll('.tr-url .ellip').forEach(function(x){x.textContent=bare(u)})}).catch(function(){})}

function patch(id,fn){var m=P.mods[id];if(!m||m.__lvPub)return;var r0=m.render;m.__lvPub=true;
  m.render=function(el){var out=r0.apply(this,arguments);try{fn(el)}catch(e){console.warn('pages publiques',e)}return out}}
var p0=PL.patchModules;
PL.patchModules=function(){var r=p0&&p0.apply(this,arguments);patch('cadeaux',cadeaux);patch('avis',avis);patch('sondages',sondages);patch('annonce',annonce);return r};
/* une demande arrivée ou un sondage créé : on relit les liens à la prochaine ouverture */
if(PL.sync&&PL.sync.on)try{PL.sync.on(function(){LT=0})}catch(e){}
})();
