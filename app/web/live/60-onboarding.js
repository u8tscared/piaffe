/* =====================================================================
   PIAFFE LIVE · Onboarding ultra-personnalisé
   Une question par écran, animée, barre de progression, clavier (Entrée) et pouce.
   Les réponses sont gardées localement, puis enregistrées sur le serveur dès que le club existe
   (PUT /api/onboarding). À la fin, POST /api/onboarding/complete configure le club.
   ===================================================================== */
(function(){
var P=window.P,PL=window.PL,esc=P.fmt.esc;
var LS='piaffe:live:onb';
var A={},stepIdx=0,dir='fwd',el=null;
function saveLocal(){try{localStorage.setItem(LS,JSON.stringify({a:A,s:stepIdx}))}catch(e){}}
function loadLocal(){try{var j=JSON.parse(localStorage.getItem(LS)||'null');if(j){A=j.a||{};stepIdx=j.s||0}}catch(e){}}
function tick(){return '<span class="lv-tick"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>'}
var KINDS=[['centre','Centre équestre','Cours, pensions, concours : un peu de tout.','stable','d-hz'],['poney_club','Poney-club','Les enfants d’abord, baby poney et galops.','child','d-rd'],
  ['ecurie_pension','Écurie de pension','Des chevaux de propriétaires en pension.','owner','d-mo'],['ecurie_proprietaires','Écurie de propriétaires','Installations partagées, travail et coaching.','horse','d-tm'],
  ['coach_independant','Coach indépendant','Vous enseignez dans une ou plusieurs écuries.','whistle','d-cr'],['association','Association','Un club associatif avec ses adhérents et bénévoles.','members','d-pf']];
var ACTS=[['cours','Cours collectifs','planning'],['particuliers','Cours particuliers','coach'],['pensions','Pensions','stable'],['demi_pensions','Demi-pensions','swap'],['concours','Concours','trophy'],['stages','Stages','ticket'],
  ['location_box','Location de box','key'],['balades','Balades','route'],['baby','Baby poney','child'],['anniversaires','Anniversaires','gift'],['vente','Vente de chevaux','tag'],['elevage','Élevage','heart']];
var DISC=['CSO','Dressage','CCE','Hunter','Endurance','Horse-ball','Pony-games','Voltige','Attelage','Équitation de travail','Éthologie','TREC et balade','Western'];
var coach=function(){return A.kind==='coach_independant'};
/* answers.migration = {uses, tools:[{id,name,action:'replace'|'integrate'}], other, adresse, when, job_id, etat, plan} */
function MG(){if(!A.migration||typeof A.migration!=='object')A.migration={tools:[]};if(!A.migration.tools)A.migration.tools=[];return A.migration}
function replacing(){return MG().tools.filter(function(t){return t.action==='replace'})}
function names(l){l=l.map(function(t){return t.name});return l.length<2?l.join(''):l.slice(0,-1).join(', ')+' et '+l[l.length-1]}

/* ---------- Les étapes ---------- */
var STEPS=[
 {id:'hello',render:function(){var f=(PL.user&&PL.user.first)||'';return '<div class="eyebrow">Bienvenue</div><h1>Bonjour'+(f?' '+esc(f):'')+', configurons votre espace.</h1><p class="lv-sub">Quelques questions, une par écran, pour que '+esc(PL.brandName())+' corresponde exactement à votre structure : modules utiles, tarifs types, installations et import de vos données. Comptez deux minutes.</p>'+
   '<div class="lv-opts two"><button class="lv-opt row" data-start style="--i:0"><span class="ico d-acc">'+ICON('spark')+'</span><span><b>Configurer mon club</b><br><small>Recommandé, deux minutes</small></span></button>'+
   '<button class="lv-opt row" data-sandbox style="--i:1"><span class="ico d-mo">'+ICON('eye')+'</span><span><b>Explorer avec des données d’exemple</b><br><small>Un club fictif, effaçable d’un clic</small></span></button></div>'},
   bind:function(q){q.querySelector('[data-start]').onclick=next;q.querySelector('[data-sandbox]').onclick=sandbox},noFoot:true},
 {id:'kind',render:function(){return '<div class="eyebrow">Votre structure</div><h1>Quel type de structure dirigez-vous ?</h1><p class="lv-sub">Nous adaptons les écrans, le vocabulaire et les forfaits proposés.</p>'+
   '<div class="lv-opts">'+KINDS.map(function(k,i){return '<button class="lv-opt" data-v="'+k[0]+'" aria-pressed="'+(A.kind===k[0])+'" style="--i:'+i+'"><span class="ico '+k[4]+'">'+ICON(k[3])+'</span><b>'+k[1]+'</b><small>'+k[2]+'</small>'+tick()+'</button>'}).join('')+'</div>'},
   bind:function(q){single(q,'kind',true)},ok:function(){return !!A.kind}},
 {id:'name',render:function(){var lab=coach()?'Comment s’appelle votre activité ?':'Comment s’appelle votre '+(A.kind==='association'?'association':A.kind==='poney_club'?'poney-club':A.kind&&A.kind.indexOf('ecurie')===0?'écurie':'centre équestre')+' ?';
   return '<div class="eyebrow">Identité</div><h1>'+lab+'</h1><p class="lv-sub">Recherchez votre structure par son nom ou son SIRET : nous préremplissons l’adresse et la forme juridique depuis le répertoire officiel des entreprises.</p>'+
   '<div class="lv-f" style="max-width:560px"><label class="lv-fl"><span>Nom affiché</span><input class="in" id="ob-name" value="'+esc(A.name||'')+'" placeholder="Écurie du Moulin" autocomplete="organization" maxlength="120"></label>'+
   '<label class="lv-fl"><span>SIRET <span class="lv-hint">facultatif, pour vos factures</span></span><div class="hrow"><input class="in" id="ob-siret" value="'+esc(A.siret||'')+'" inputmode="numeric" placeholder="14 chiffres, ou cherchez par nom" maxlength="20"><button class="btn" data-find type="button">'+ICON('search','sm')+'<span>Rechercher</span></button></div></label>'+
   '<div class="lv-sirets"></div><div class="lv-picked">'+(A.address&&A.address.city&&A.siren?picked():'')+'</div>'+
   '<label class="lv-fl"><span>Adresse <span class="lv-hint">pour vos factures et la météo</span></span><input class="in" id="ob-line1" value="'+esc((A.address||{}).line1||'')+'" placeholder="12 chemin des Prés" autocomplete="address-line1" maxlength="160"></label>'+
   '<div class="lv-row2"><label class="lv-fl"><span>Code postal</span><input class="in" id="ob-zip" value="'+esc((A.address||{}).zip||'')+'" inputmode="numeric" autocomplete="postal-code" maxlength="10"></label>'+
   '<label class="lv-fl"><span>Ville</span><input class="in" id="ob-city" value="'+esc((A.address||{}).city||'')+'" autocomplete="address-level2" maxlength="80"></label></div></div>'},
   bind:function(q){var n=q.querySelector('#ob-name'),s=q.querySelector('#ob-siret'),box=q.querySelector('.lv-sirets');
     n.oninput=function(){A.name=n.value.trim();saveLocal();foot()};s.oninput=function(){A.siret=s.value.replace(/\D/g,'');saveLocal()};
     /* adresse saisie à la main (la recherche officielle peut être indisponible ou ne pas trouver la structure) */
     var ad=function(k){return q.querySelector('#ob-'+k)};
     ['line1','zip','city'].forEach(function(k){ad(k).oninput=function(){A.address=A.address&&typeof A.address==='object'?A.address:{country:'FR'};A.address[k]=ad(k).value.trim();saveLocal()}});
     var fillAd=function(){var a=A.address||{};['line1','zip','city'].forEach(function(k){ad(k).value=a[k]||''})};
     function find(){var qq=(s.value.replace(/\s/g,'').length>=9?s.value:n.value).trim();if(qq.length<3){P.toast?void 0:0;box.innerHTML='<div class="lv-msg info">'+ICON('info','sm')+'<span>Saisissez au moins trois lettres du nom, ou le SIRET.</span></div>';return}
       box.innerHTML='<div class="lv-dots" style="padding:12px"><i></i><i></i><i></i></div>';
       PL.get('/api/onboarding/siret?q='+encodeURIComponent(qq)).then(function(j){var r=j.results||[];
         if(!r.length){box.innerHTML='<div class="lv-msg info">'+ICON('info','sm')+'<span>Aucune entreprise trouvée. Vous pouvez continuer et compléter plus tard.</span></div>';return}
         box.innerHTML=r.map(function(c,i){return '<button class="lv-siret" data-i="'+i+'" aria-pressed="'+(A.siren===c.siren)+'"><span class="ico">'+ICON(c.is_association?'members':'stable')+'</span><span class="grow"><b>'+esc(c.name)+'</b><small>'+esc([c.address.zip,c.address.city].filter(Boolean).join(' '))+' · SIRET '+esc(String(c.siret).replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/,'$1 $2 $3 $4'))+(c.active?'':' · fermée')+'</small></span></button>'}).join('');
         box.querySelectorAll('[data-i]').forEach(function(b){b.onclick=function(){var c=r[+b.getAttribute('data-i')];A.name=A.name||c.name;if(!n.value)n.value=c.name;A.siret=c.siret;A.siren=c.siren;A.legal_form=c.legal_form;A.naf=c.naf;A.address=c.address;if(c.lat){A.lat=c.lat;A.lon=c.lon}
           if(c.is_association&&!A.vat_regime)A.vat_regime='association_exoneree';s.value=String(c.siret).replace(/^(\d{3})(\d{3})(\d{3})(\d{5})$/,'$1 $2 $3 $4');saveLocal();fillAd();
           box.querySelectorAll('[data-i]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});q.querySelector('.lv-picked').innerHTML=picked();foot()}})},
       function(e){box.innerHTML='<div class="lv-msg info">'+ICON('info','sm')+'<span>'+(e.unavailable?'La recherche n’est pas encore disponible : saisissez simplement le nom.':esc(PL.msg(e)))+'</span></div>'})}
     q.querySelector('[data-find]').onclick=find;s.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();find()}}},
   ok:function(){return (A.name||'').trim().length>=2},leave:ensureClub},
 {id:'sizes',render:function(){var F=coach()?[['members','Élèves suivis','members'],['horses','Chevaux de vos élèves','horse']]:[['horses','Chevaux','horse'],['boxes','Boxes','stable'],['members','Adhérents et clients','members'],['staff','Salariés','team']];
   return '<div class="eyebrow">Votre taille</div><h1>Combien êtes-vous ?</h1><p class="lv-sub">Une estimation suffit. Elle sert à choisir la bonne offre et à préparer vos écrans.</p>'+
   '<div class="lv-nums">'+F.map(function(f,i){return '<div class="lv-num" style="--i:'+i+'"><label for="ob-'+f[0]+'">'+ICON(f[2],'sm')+f[1]+'</label><div class="lv-step"><button type="button" data-m="'+f[0]+'" aria-label="Moins">'+ICON('minus','sm')+'</button><input class="in num" id="ob-'+f[0]+'" inputmode="numeric" value="'+(A[f[0]]!=null?A[f[0]]:'')+'" placeholder="0"><button type="button" data-p="'+f[0]+'" aria-label="Plus">'+ICON('plus','sm')+'</button></div></div>'}).join('')+'</div>'},
   bind:function(q){bindNums(q)},ok:function(){return true}},
 {id:'disciplines',skip:function(){return false},render:function(){var sel=A.disciplines||[];return '<div class="eyebrow">Équitation</div><h1>Quelles disciplines pratiquez-vous ?</h1><p class="lv-sub">Plusieurs choix possibles. Elles servent au planning, aux concours et à la progression des cavaliers.</p>'+
   '<div class="hrow wrap" style="--g:10px">'+DISC.map(function(d,i){return '<button class="tag lv-tg" data-manual data-v="'+esc(d)+'" aria-pressed="'+(sel.indexOf(d)>=0)+'" style="height:44px;padding:0 18px;font-size:15px;animation:lvIn .45s var(--e-out) both;animation-delay:'+(i*30)+'ms">'+esc(d)+'</button>'}).join('')+'</div>'},
   bind:function(q){multi(q,'disciplines','.lv-tg')},ok:function(){return true}},
 {id:'installations',skip:coach,render:function(){var F=[['arenas_indoor','Manèges couverts','arena'],['arenas_outdoor','Carrières','sun'],['paddocks','Prés et paddocks','paddock']];
   return '<div class="eyebrow">Installations</div><h1>De quelles installations disposez-vous ?</h1><p class="lv-sub">Chaque piste apparaît dans le planning et peut être réservée par vos propriétaires.</p>'+
   '<div class="lv-nums">'+F.map(function(f,i){return '<div class="lv-num" style="--i:'+i+'"><label for="ob-'+f[0]+'">'+ICON(f[2],'sm')+f[1]+'</label><div class="lv-step"><button type="button" data-m="'+f[0]+'" aria-label="Moins">'+ICON('minus','sm')+'</button><input class="in num" id="ob-'+f[0]+'" inputmode="numeric" value="'+(A[f[0]]!=null?A[f[0]]:(f[0]==='paddocks'?2:1))+'"><button type="button" data-p="'+f[0]+'" aria-label="Plus">'+ICON('plus','sm')+'</button></div></div>'}).join('')+
   '<div class="lv-num" style="--i:3"><label>'+ICON('rotate','sm')+'Rond de longe</label><div class="hrow" style="justify-content:space-between"><span class="mut">Couvert ou non</span>'+P.ui.tog(!!A.round_pen,'ob-round')+'</div></div></div>'},
   bind:function(q){bindNums(q,{arenas_indoor:1,arenas_outdoor:1,paddocks:2});var t=q.querySelector('#ob-round');t.setAttribute('data-manual','');t.onclick=function(){A.round_pen=t.getAttribute('aria-checked')!=='true';t.setAttribute('aria-checked',A.round_pen);saveLocal()}},ok:function(){return true}},
 {id:'activities',render:function(){var sel=A.activities||null;if(!sel){sel=defAct();A.activities=sel}
   return '<div class="eyebrow">Activités</div><h1>Que proposez-vous ?</h1><p class="lv-sub">Nous activons les écrans utiles et masquons le reste. Vous pourrez tout changer dans les réglages.</p>'+
   '<div class="lv-opts">'+ACTS.map(function(a,i){return '<button class="lv-opt row" data-v="'+a[0]+'" aria-pressed="'+(sel.indexOf(a[0])>=0)+'" style="--i:'+i+'"><span class="ico">'+ICON(a[2])+'</span><b>'+a[1]+'</b>'+tick()+'</button>'}).join('')+'</div>'},
   bind:function(q){multi(q,'activities','.lv-opt')},ok:function(){return true}},
 {id:'uses',render:function(){var u=MG().uses;return '<div class="eyebrow">Vos outils</div><h1>Venez-vous d’un autre logiciel, ou en utilisez-vous déjà ?</h1><p class="lv-sub">Gestion du club, comptabilité, banque, encaissement, fédération, agenda : dites-nous ce que vous utilisez, nous reprenons vos données ou nous nous y connectons.</p>'+
   '<div class="lv-opts two">'+[[true,'Oui','J’utilise un ou plusieurs outils.','swap'],[false,'Non','Je pars de zéro, c’est parfait.','spark']].map(function(o,i){return '<button class="lv-opt row" data-b="'+o[0]+'" aria-pressed="'+(u===o[0])+'" style="--i:'+i+'"><span class="ico">'+ICON(o[3])+'</span><span><b>'+o[1]+'</b><br><small>'+o[2]+'</small></span>'+tick()+'</button>'}).join('')+'</div>'},
   bind:function(q){q.querySelectorAll('[data-b]').forEach(function(b){b.onclick=function(){var M=MG();M.uses=b.getAttribute('data-b')==='true';if(!M.uses){M.tools=[];M.other=''}q.querySelectorAll('[data-b]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});saveLocal();foot();setTimeout(next,280)}})},
   ok:function(){return typeof MG().uses==='boolean'}},
 {id:'tools',skip:function(){return MG().uses!==true},render:function(){var M=MG(),sel=M.tools.map(function(t){return t.id});
   return '<div class="eyebrow">Vos outils</div><h1>Lesquels utilisez-vous ?</h1><p class="lv-sub">Plusieurs choix possibles. Pour chacun, vous choisirez ensuite de le remplacer ou de le garder.</p>'+
   '<div class="lv-opts lv-tools">'+PL.mig.PICK.map(function(p,i){return '<button class="lv-opt row" data-t="'+p[0]+'" aria-pressed="'+(sel.indexOf(p[0])>=0)+'" style="--i:'+i+'"><span class="ico">'+PL.mig.icon(p[0])+'</span><b>'+esc(p[1])+'</b>'+tick()+'</button>'}).join('')+'</div>'+
   '<div class="lv-f" style="max-width:560px;margin-top:18px"><label class="lv-fl"><span>Autre <span class="lv-hint">facultatif, un ou plusieurs noms</span></span><input class="in" id="ob-other" value="'+esc(M.other||'')+'" placeholder="Nom du logiciel" maxlength="120" autocomplete="off"></label><div class="lv-sugg hrow wrap" style="--g:8px"></div></div>'},
   bind:function(q){var M=MG();q.querySelectorAll('[data-t]').forEach(function(b){b.onclick=function(){var id=b.getAttribute('data-t'),i=M.tools.map(function(t){return t.id}).indexOf(id);
       if(i<0)M.tools.push({id:id,name:PL.mig.nameOf(id),action:PL.mig.recommend(id)});else M.tools.splice(i,1);b.setAttribute('aria-pressed',i<0);saveLocal();foot()}});
     var o=q.querySelector('#ob-other'),sg=q.querySelector('.lv-sugg');
     function sync(){M.other=o.value.trim();M.tools=M.tools.filter(function(t){return !t.custom});
       if(M.other){var hits=PL.mig.search(M.other);var exact=hits.filter(function(h){return h.nom.toLowerCase()===M.other.toLowerCase()})[0];
         if(exact&&!M.tools.some(function(t){return t.id===exact.id}))M.tools.push({id:exact.id,name:exact.nom,action:PL.mig.recommend(exact.id),custom:true});
         else if(!exact)M.tools.push({id:'autre',name:M.other,action:'replace',custom:true});
         sg.innerHTML=hits.filter(function(h){return !exact||h.id!==exact.id}).map(function(h){return '<button class="tag" type="button" data-manual data-s="'+esc(h.nom)+'">'+esc(h.nom)+'</button>'}).join('');
         sg.querySelectorAll('[data-s]').forEach(function(b){b.onclick=function(){o.value=b.getAttribute('data-s');sync()}})}else sg.innerHTML='';saveLocal();foot()}
     o.oninput=sync},
   ok:function(){return MG().tools.length>0}},
 {id:'toolsplan',skip:function(){return MG().uses!==true||!MG().tools.length},render:function(){var M=MG();
   return '<div class="eyebrow">Vos outils</div><h1>Que faisons-nous de chacun ?</h1><p class="lv-sub">Nous avons présélectionné le choix le plus courant. Remplacer : nous récupérons vos données dans '+esc(PL.brandName())+'. Garder : '+esc(PL.brandName())+' s’y connecte et vous continuez à l’utiliser.</p>'+
   '<div class="lv-toolplan">'+M.tools.map(function(t,i){return '<div class="lv-tp" style="--i:'+i+'"><span class="ico">'+PL.mig.icon(t.id)+'</span><b class="grow">'+esc(t.name)+'</b>'+
     (function(){var ok=PL.mig.possible(t.id);if(ok.indexOf(t.action)<0)t.action=ok[0];var fx=PL.mig.effect(t.id,t.action);
       return (ok.length>1?'<div class="lv-seg" role="group" aria-label="'+esc(t.name)+'">'+[['replace','Le remplacer par '+esc(PL.brandName())],['integrate','Le garder et le connecter']].map(function(c){return '<button type="button" data-manual data-k="'+i+'" data-a="'+c[0]+'" aria-pressed="'+(t.action===c[0])+'">'+c[1]+'</button>'}).join('')+'</div>'
         :'<span class="lv-tp-only">'+(t.action==='replace'?'Remplacé par '+esc(PL.brandName()):'Gardé et connecté')+'</span>')+(fx?'<small class="lv-tp-fx" data-fx="'+i+'">'+esc(fx)+'</small>':'<small class="lv-tp-fx" data-fx="'+i+'"></small>')})()+'</div>'}).join('')+'</div>'},
   bind:function(q){var M=MG();q.querySelectorAll('[data-a]').forEach(function(b){b.onclick=function(){var t=M.tools[+b.getAttribute('data-k')];t.action=b.getAttribute('data-a');
     q.querySelectorAll('[data-k="'+b.getAttribute('data-k')+'"]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});var fx=q.querySelector('[data-fx="'+b.getAttribute('data-k')+'"]');if(fx)fx.textContent=PL.mig.effect(t.id,t.action);saveLocal();foot()}})},
   ok:function(){return true},leave:function(){var M=MG();M.plan=PL.mig.plan(M);saveLocal();return Promise.resolve()}},
 {id:'recuperer',skip:function(){return MG().uses!==true||!replacing().length},render:function(){var M=MG(),R=replacing(),web=R.some(function(t){return ['excel','papier','autre'].indexOf(t.id)<0});
   if(M.job_id&&M.etat==='termine')return '<div class="eyebrow">Vos données</div><h1>Récupération terminée.</h1><div class="lv-bilan-box" style="max-width:560px"><div class="lv-dots" style="padding:12px"><i></i><i></i><i></i></div></div>';
   return '<div class="eyebrow">Vos données</div><h1>Récupérons vos données de '+esc(names(R))+'.</h1><p class="lv-sub">Adhérents, familles, chevaux, forfaits, factures et planning : notre outil de migration récupère tout pour vous, avec un essai à blanc avant d’enregistrer. Rien n’est modifié dans votre ancien logiciel.</p>'+
   (web?'<div class="lv-f" style="max-width:560px;margin-bottom:18px"><label class="lv-fl"><span>Adresse de votre ancien logiciel <span class="lv-hint">facultatif</span></span><input class="in" id="ob-addr" value="'+esc(M.adresse||'')+'" placeholder="https://…" inputmode="url" maxlength="300"></label></div>':'')+
   '<div class="lv-opts two">'+[['now','Lancer la récupération maintenant','Comptez dix minutes, vous pouvez la reprendre plus tard.','import'],['later','Plus tard','Une étape de votre liste de démarrage.','clock']].map(function(o,i){return '<button class="lv-opt row" data-w="'+o[0]+'" aria-pressed="'+(M.when===o[0])+'" style="--i:'+i+'"><span class="ico">'+ICON(o[3])+'</span><span><b>'+o[1]+'</b><br><small>'+o[2]+'</small></span>'+tick()+'</button>'}).join('')+'</div>'},
   bind:function(q){var M=MG(),a=q.querySelector('#ob-addr');if(a)a.oninput=function(){M.adresse=a.value.trim();saveLocal()};
     var box=q.querySelector('.lv-bilan-box');if(box)PL.mig.job(M.job_id).then(function(j){box.innerHTML=PL.mig.bilanHTML(j)},function(){box.innerHTML='<div class="lv-msg ok">'+ICON('checkc','sm')+'<span>Vos données ont été envoyées. Le bilan détaillé sera dans votre liste de démarrage.</span></div>'});
     q.querySelectorAll('[data-w]').forEach(function(b){b.onclick=function(){M.when=b.getAttribute('data-w');q.querySelectorAll('[data-w]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});saveLocal();foot();
       if(M.when==='later'){setTimeout(next,280);return}
       var R=replacing();persist();PL.mig.open({source:R[0].id,adresse:M.adresse,outils:R.map(function(t){return t.id}),retour:location.origin+'/configuration',title:'Depuis '+names(R)}).then(function(v){
         M.etat=v.etat;if(v.job_id)M.job_id=v.job_id;saveLocal();persist();draw()},function(e){
         if(e&&e.unavailable){M.when='later';saveLocal();toastLocal('La récupération guidée arrive très bientôt : elle vous attend dans votre liste de démarrage.');draw();return}toastLocal(PL.msg(e))})}})},
   ok:function(){var M=MG();return !!M.when||M.etat==='termine'}},
 {id:'accountant',render:function(){return '<div class="eyebrow">Comptabilité</div><h1>Travaillez-vous avec un expert-comptable ?</h1><p class="lv-sub">Il peut accéder à vos factures, aux exports FEC et aux PDF, sans voir le reste. La facture électronique devient obligatoire : autant que tout soit prêt.</p>'+
   '<div class="lv-opts two">'+[[true,'Oui, j’ai un comptable','Je l’invite tout de suite.','accounting'],[false,'Non, je m’en occupe','Exports simples quand vous en avez besoin.','user']].map(function(o,i){return '<button class="lv-opt row" data-b="'+o[0]+'" aria-pressed="'+(A.accountant===o[0])+'" style="--i:'+i+'"><span class="ico">'+ICON(o[3])+'</span><span><b>'+o[1]+'</b><br><small>'+o[2]+'</small></span>'+tick()+'</button>'}).join('')+'</div>'+
   '<div class="lv-acc" style="margin-top:18px;max-width:560px;'+(A.accountant?'':'display:none')+'"><div class="lv-f"><label class="lv-fl"><span>E-mail de votre comptable <span class="lv-hint">il recevra une invitation</span></span><input class="in" type="email" id="ob-acc" value="'+esc(A.accountant_email||'')+'" placeholder="cabinet@exemple.fr" inputmode="email"></label>'+
   '<div class="lv-fl"><span>Gère-t-il déjà la facture électronique pour vous ?</span>'+P.ui.seg([['yes','Oui'],['no','Non'],['unknown','Je ne sais pas']],A.accountant_einvoice||'unknown','data-ei')+'</div></div></div>'},
   bind:function(q){q.querySelectorAll('[data-b]').forEach(function(b){b.onclick=function(){A.accountant=b.getAttribute('data-b')==='true';q.querySelectorAll('[data-b]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});q.querySelector('.lv-acc').style.display=A.accountant?'':'none';saveLocal();foot();if(A.accountant){var i=q.querySelector('#ob-acc');setTimeout(function(){i.focus()},50)}else setTimeout(next,260)}});
     var i=q.querySelector('#ob-acc');i.oninput=function(){A.accountant_email=i.value.trim();saveLocal()};q.querySelectorAll('[data-ei]').forEach(function(b){b.addEventListener('click',function(){A.accountant_einvoice=b.getAttribute('data-ei');saveLocal()})})},
   ok:function(){return A.accountant!==undefined&&(!A.accountant||!A.accountant_email||/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(A.accountant_email))}},
 {id:'payments',render:function(){var pm=A.pay_methods||[];var M=[['cheque','Chèques'],['especes','Espèces'],['virement','Virements'],['ancv','Chèques-vacances ANCV'],['cb','Carte sur place'],['prelevement','Prélèvements']];
   return '<div class="eyebrow">Encaissement</div><h1>Voulez-vous que vos cavaliers paient en ligne ?</h1><p class="lv-sub">Carte bancaire et prélèvement SEPA par Stripe : l’argent arrive directement sur le compte de votre structure, les relances partent toutes seules. Aucun abonnement, seulement les frais de Stripe par paiement.</p>'+
   '<div class="lv-opts two">'+[[true,'Oui, activer le paiement en ligne','Carte, SEPA, liens de paiement.','card'],[false,'Pas pour le moment','Vous gardez vos moyens actuels.','wallet']].map(function(o,i){return '<button class="lv-opt row" data-b="'+o[0]+'" aria-pressed="'+(A.online_payments===o[0])+'" style="--i:'+i+'"><span class="ico">'+ICON(o[3])+'</span><span><b>'+o[1]+'</b><br><small>'+o[2]+'</small></span>'+tick()+'</button>'}).join('')+'</div>'+
   '<div class="lv-fl" style="margin-top:22px"><span>Ce que vous acceptez aujourd’hui</span><div class="hrow wrap" style="--g:8px">'+M.map(function(m){return '<button class="tag lv-pm" data-manual data-v="'+m[0]+'" aria-pressed="'+(pm.indexOf(m[0])>=0)+'" style="height:42px;padding:0 16px;font-size:15px">'+m[1]+'</button>'}).join('')+'</div></div>'},
   bind:function(q){q.querySelectorAll('[data-b]').forEach(function(b){b.onclick=function(){A.online_payments=b.getAttribute('data-b')==='true';q.querySelectorAll('[data-b]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});saveLocal();foot()}});multi(q,'pay_methods','.lv-pm')},
   ok:function(){return A.online_payments!==undefined}},
 {id:'vat',render:function(){var def=A.vat_regime||(A.kind==='association'||A.legal_form==='association'?'association_exoneree':'');
   var V=[['normal','Assujetti à la TVA','5,5 % sur l’enseignement et les activités sportives, 20 % sur les pensions et la vente.','percent'],['franchise','Franchise en base','Pas de TVA facturée (article 293 B du CGI), mention ajoutée sur vos factures.','doc'],['association_exoneree','Association exonérée','Activités sportives exonérées (article 261-7-1° du CGI).','members']];
   return '<div class="eyebrow">Factures</div><h1>Quel est votre régime de TVA ?</h1><p class="lv-sub">Vos factures porteront les bons taux et les mentions obligatoires. En cas de doute, choisissez « Je ne sais pas » : vous ou votre comptable pourrez le corriger.</p>'+
   '<div class="lv-opts two">'+V.map(function(v,i){return '<button class="lv-opt" data-v="'+v[0]+'" aria-pressed="'+(def===v[0])+'" style="--i:'+i+'"><span class="ico">'+ICON(v[3])+'</span><b>'+v[1]+'</b><small>'+v[2]+'</small>'+tick()+'</button>'}).join('')+
   '<button class="lv-opt" data-v="" aria-pressed="'+(A.vat_regime==='')+'" style="--i:3"><span class="ico">'+ICON('info')+'</span><b>Je ne sais pas</b><small>Nous choisissons le régime le plus courant pour votre structure.</small>'+tick()+'</button></div>'},
   bind:function(q){single(q,'vat_regime',true)},ok:function(){return A.vat_regime!==undefined}},
 {id:'recap',render:function(){var acts=(A.activities||[]).map(function(a){return (ACTS.filter(function(x){return x[0]===a})[0]||[0,a])[1]});
   var k=(KINDS.filter(function(x){return x[0]===A.kind})[0]||[0,'Structure'])[1];
   var items=[['stable','Votre espace',[esc(A.name||''),k,A.address&&A.address.city?esc(A.address.city):null].filter(Boolean)],
     ['grid','Écrans activés',acts.length?acts.slice(0,6):['Les essentiels']],
     ['tag','Forfaits préparés',forfaitsPreview()],
     ['import','Vos outils',(function(){var M=MG(),R=replacing(),I=M.tools.filter(function(t){return t.action==='integrate'}),out=[];
       if(!M.uses||!M.tools.length)return ['Saisie guidée, chevaux et adhérents'];
       if(R.length)out.push((M.etat==='termine'?'Données reprises de ':'Reprise des données de ')+esc(names(R)));if(I.length)out.push('Connexion à '+esc(names(I)));return out})()],
     ['accounting','Comptabilité',[A.accountant?(A.accountant_email?'Invitation à '+esc(A.accountant_email):'Comptable à inviter'):'Exports FEC et CSV disponibles',A.online_payments?'Paiement en ligne à activer':'Encaissements manuels']]];
   return '<div class="eyebrow">C’est prêt</div><h1>Voici votre '+esc(PL.brandName())+' sur mesure.</h1><p class="lv-sub">Vérifiez d’un coup d’œil. Tout reste modifiable ensuite dans les réglages.</p>'+
   '<div class="lv-recap">'+items.map(function(it,i){return '<div class="card" style="--i:'+i+'"><span class="ico">'+ICON(it[0])+'</span><h3>'+it[1]+'</h3><ul>'+it[2].map(function(x){return '<li>'+x+'</li>'}).join('')+'</ul></div>'}).join('')+'</div>'},
   bind:function(){},ok:function(){return true},cta:'Créer mon espace'}
];
function defAct(){var m={ecurie_pension:['pensions','demi_pensions','location_box'],ecurie_proprietaires:['pensions','location_box','particuliers'],coach_independant:['particuliers','concours'],poney_club:['cours','baby','stages','anniversaires'],association:['cours','stages','concours']};return (m[A.kind]||['cours','particuliers','pensions','stages','concours']).slice()}
function forfaitsPreview(){var a=A.activities||[],out=[];if(a.indexOf('cours')>=0||coach())out.push('Carte 10 séances');if(a.indexOf('cours')>=0)out.push('Forfait annuel 1 h par semaine');if(a.indexOf('pensions')>=0||/ecurie/.test(A.kind||''))out.push('Pension box et pension pré');if(a.indexOf('demi_pensions')>=0)out.push('Demi-pension');if(a.indexOf('stages')>=0)out.push('Stage à la journée');return out.length?out:['Vos tarifs, à saisir']}
function picked(){var a=A.address||{};return '<div class="lv-msg ok" style="margin-top:4px">'+ICON('checkc','sm')+'<span><b>'+esc(A.name||'')+'</b>, '+esc([a.line1,[a.zip,a.city].filter(Boolean).join(' ')].filter(Boolean).join(', '))+(A.legal_form?' · '+esc(LF[A.legal_form]||A.legal_form):'')+'</span></div>'}
var LF={association:'Association',ei:'Entreprise individuelle',eurl:'EURL',sarl:'SARL',sas:'SAS',sasu:'SASU',earl:'EARL',gaec:'GAEC',scea:'SCEA',autre:'Autre forme'};

/* ---------- Comportements ---------- */
function single(q,key,auto){q.querySelectorAll('[data-v]').forEach(function(b){b.onclick=function(){A[key]=b.getAttribute('data-v');q.querySelectorAll('[data-v]').forEach(function(x){x.setAttribute('aria-pressed',x===b)});saveLocal();foot();if(auto)setTimeout(next,280)}})}
function multi(q,key,sel){q.querySelectorAll(sel).forEach(function(b){b.onclick=function(){var v=b.getAttribute('data-v'),l=(A[key]||[]).slice(),i=l.indexOf(v);if(i<0)l.push(v);else l.splice(i,1);A[key]=l;b.setAttribute('aria-pressed',i<0);saveLocal();foot()}})}
function bindNums(q,defs){defs=defs||{};q.querySelectorAll('.lv-num input').forEach(function(i){var k=i.id.slice(3);if(A[k]==null&&defs[k]!=null)A[k]=defs[k];
  i.oninput=function(){var v=parseInt(i.value.replace(/\D/g,''),10);A[k]=isNaN(v)?null:Math.min(v,99999);saveLocal()};i.onfocus=function(){i.select()}});
  q.querySelectorAll('[data-m],[data-p]').forEach(function(b){b.onclick=function(){var k=b.getAttribute('data-m')||b.getAttribute('data-p'),i=q.querySelector('#ob-'+k),v=(parseInt(i.value,10)||0)+(b.hasAttribute('data-p')?1:-1);v=Math.max(0,v);i.value=v;A[k]=v;saveLocal()}})}
function visible(){return STEPS.filter(function(s){return !(s.skip&&s.skip())})}
function cur(){var v=visible();if(stepIdx>=v.length)stepIdx=v.length-1;return v[stepIdx]}
function foot(){if(!el)return;var s=cur(),f=el.querySelector('.lv-ob-foot');if(!f)return;f.style.display=s.noFoot?'none':'';var b=f.querySelector('[data-next]');if(b){b.disabled=s.ok?!s.ok():false;b.querySelector('.lv-bt').textContent=s.cta||'Continuer'}
  var bk=f.querySelector('[data-back]');if(bk)bk.style.visibility=stepIdx>0?'visible':'hidden'}
function draw(){var v=visible(),s=cur(),pct=Math.round(stepIdx/(v.length-1)*100);
  el.querySelector('.lv-prog i').style.setProperty('--v',Math.max(4,pct)+'%');el.querySelector('.lv-ob-step').textContent=stepIdx?('Étape '+stepIdx+' sur '+(v.length-1)):'';
  var body=el.querySelector('.lv-ob-body');body.innerHTML='<div class="lv-q '+dir+'" data-step="'+s.id+'">'+s.render()+'</div>';body.scrollTop=0;
  var q=body.querySelector('.lv-q');if(s.bind)s.bind(q);foot();
  var first=q.querySelector('input.in');if(first&&!PL.isTouch())setTimeout(function(){var a=document.activeElement;if(!a||a===document.body||!q.contains(a))first.focus()},80)}
function persist(){if(!PL.clubId)return Promise.resolve();return PL.put('/api/onboarding',{answers:A,step:cur().id}).catch(function(){})}
function next(){var s=cur();if(s.ok&&!s.ok())return;var go=function(){var v=visible();if(stepIdx>=v.length-1){finish();return}stepIdx++;dir='fwd';saveLocal();persist();draw()};
  if(s.leave){var b=el.querySelector('[data-next]');if(b){b.classList.add('busy');b.disabled=true}s.leave().then(function(){if(b)b.classList.remove('busy');go()},function(e){if(b){b.classList.remove('busy');b.disabled=false}P.toast?toastLocal(PL.msg(e)):alert(PL.msg(e))})}else go()}
function back(){if(stepIdx>0){stepIdx--;dir='back';saveLocal();draw()}}
function toastLocal(m){var t=el.querySelector('.lv-ob-msg');if(!t){t=document.createElement('div');t.className='lv-ob-msg';t.style.cssText='position:fixed;left:50%;bottom:96px;transform:translateX(-50%);z-index:5;max-width:min(92vw,520px)';el.appendChild(t)}t.innerHTML='<div class="lv-msg">'+ICON('alert','sm')+'<span>'+esc(m)+'</span></div>';setTimeout(function(){t.innerHTML=''},6000)}

/* le club est créé dès que le nom est connu, pour enregistrer l'avancement côté serveur */
function ensureClub(){if(PL.clubId)return PL.patch('/api/onboarding/club',{name:A.name,siret:A.siret&&A.siret.length===14?A.siret:undefined,address:A.address}).catch(function(){}).then(function(){return persist()});
  return PL.post('/api/clubs',{name:A.name,kind:A.kind||'centre',siret:A.siret||undefined}).then(function(r){var c=r.club||r;PL.clubId=c.id||c.club_id;
    return PL.post('/api/me/club',{club_id:PL.clubId}).catch(function(){}).then(function(){return persist()})},
    function(e){if(e.unavailable)throw PL.err(0,'unavailable','La création de club n’est pas encore disponible sur ce serveur. Réessayez dans quelques minutes.');throw e})}

/* ---------- Fin : le serveur configure le club, on montre ce qui se prépare ---------- */
function finish(){var body=el.querySelector('.lv-ob-body');el.querySelector('.lv-ob-foot').style.display='none';el.querySelector('.lv-prog i').style.setProperty('--v','100%');
  var L=[['stable','Création de votre espace'],['grid','Activation des écrans utiles'],['tag','Préparation des forfaits types'],['arena','Ajout de vos installations'],['contract','Modèles de contrats'],['care','Rappels de soins'],['checkc','Liste de démarrage personnalisée']];
  body.innerHTML='<div class="lv-q fwd"><div class="eyebrow">Un instant</div><h1>Nous préparons '+esc(A.name||'votre club')+'.</h1><div class="lv-build" style="margin-top:24px">'+L.map(function(l,i){return '<div class="li" data-i="'+i+'"><span class="ico">'+ICON(l[0])+'</span><span>'+l[1]+'</span></div>'}).join('')+'</div></div>';
  var rows=body.querySelectorAll('.lv-build .li'),k=0,doneReq=false,failed=null;
  var iv=setInterval(function(){if(k<rows.length){rows[k].classList.add('on');if(k)rows[k-1].classList.add('done');k++}else if(doneReq){clearInterval(iv);rows[rows.length-1].classList.add('done');setTimeout(end,350)}},P.RM?40:380);
  var p=(PL.clubId?Promise.resolve():ensureClub()).then(function(){return PL.post('/api/onboarding/complete',{answers:A})}).then(function(r){PL.onbResult=r;
    var inv=A.accountant&&A.accountant_email?PL.post('/api/invitations',{email:A.accountant_email,role:'accountant'}).then(function(){PL.accountantInvited=true},function(){}):Promise.resolve();
    return inv}).then(function(){doneReq=true},function(e){failed=e;doneReq=true});
  function end(){if(failed){body.innerHTML='<div class="lv-q fwd"><div class="lv-big-ico" style="background:var(--bad-pale);color:var(--bad)">'+ICON('alert')+'</div><h1>La configuration n’a pas abouti.</h1><p class="lv-sub">'+esc(PL.msg(failed))+'</p><button class="btn pri lg" data-retry>'+ICON('refresh','sm')+'Réessayer</button></div>';body.querySelector('[data-retry]').onclick=finish;return}
    try{localStorage.removeItem(LS)}catch(e){}PL.freshOnboarding=true;PL.start()}}

function sandbox(){var b=el.querySelector('[data-sandbox]');b.disabled=true;b.querySelector('b').textContent='Préparation du club d’exemple…';
  PL.createSandbox().then(function(){try{localStorage.removeItem(LS)}catch(e){}PL.start()},function(e){b.disabled=false;b.querySelector('b').textContent='Explorer avec des données d’exemple';toastLocal(PL.msg(e))})}

/* ---------- Entrée ---------- */
PL.onboarding=function(o){o=o||{};loadLocal();if(o.answers&&Object.keys(o.answers).length)A=Object.assign({},A,o.answers);
  if(PL.migReturn){var M=MG();M.etat=PL.migReturn.etat;if(PL.migReturn.job)M.job_id=PL.migReturn.job;if(M.etat!=='termine'&&!M.when)M.when='later';o.step='recuperer';PL.migReturn=null;saveLocal()}
  if(o.answers&&o.answers.migration&&typeof o.answers.migration!=='object')delete A.migration;
  if(o.step){var v=visible(),i=v.map(function(s){return s.id}).indexOf(o.step);if(i>0)stepIdx=i}
  if(o.skipHello&&stepIdx===0)stepIdx=1;
  document.body.classList.add('lv-booting');document.title='Configuration · '+PL.brandName();
  var r=document.getElementById('lv-root');if(!r){r=document.createElement('div');r.id='lv-root';document.body.appendChild(r)}r.innerHTML='<div class="lv-ob"><header class="lv-ob-top">'+PL.brandHTML(26)+'<div class="lv-prog" role="progressbar" aria-label="Avancement"><i></i></div><span class="lv-ob-step"></span></header><main class="lv-ob-body"></main>'+
    '<footer class="lv-ob-foot"><button class="btn ghost" data-back>'+ICON('back','sm')+'Retour</button><span class="grow"></span><span class="lv-kbd">Appuyez sur Entrée</span><button class="btn pri" data-next><span class="lv-spin"></span><span class="lv-bt">Continuer</span></button></footer></div>';
  el=r.firstChild;el.querySelector('[data-next]').onclick=next;el.querySelector('[data-back]').onclick=back;
  el.addEventListener('keydown',function(e){if(e.key==='Enter'&&!e.target.closest('button,[data-find]')&&e.target.id!=='ob-siret'){e.preventDefault();next()}});
  draw()};
PL.onbAnswers=function(){return A};
})();
