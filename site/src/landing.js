/* Piaffe · landing v4. Rendu des sections répétitives, onglets, chat Piaffe AI, apparitions. */
(function(){
'use strict';
var D=document,R=D.documentElement,$=function(s,c){return (c||D).querySelector(s)},$$=function(s,c){return [].slice.call((c||D).querySelectorAll(s))};
var RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
var I=function(n){return window.ICON(n)};
var SH='shots/';
var BASE=$('.pg').getAttribute('data-demo');
function demo(r){return 'href="'+BASE+'#'+r+'" target="_blank" rel="noopener"'}
/* espaces insécables, comme le build */
function nb(h){return ('>'+h+'<').replace(/>([^<]+)</g,function(m,t){return '>'+t.replace(/ ([:;?!%€»])/g,' $1').replace(/« /g,'« ')+'<'}).slice(1,-1)}
function put(el,h){el.innerHTML=nb(h)}
function fr(n){return n.toLocaleString('fr-FR')}
R.classList.add('js');

/* ---------- Thème ---------- */
(function(){var b=$('#theme'),t=null;try{t=localStorage.getItem('piaffe:landing:theme')}catch(e){}
  function sombre(){return R.getAttribute('data-theme')?R.getAttribute('data-theme')==='dark':matchMedia('(prefers-color-scheme:dark)').matches}
  function lab(){b.setAttribute('aria-label',sombre()?'Passer en thème clair':'Passer en thème sombre')}
  if(t==='dark'||t==='light')R.setAttribute('data-theme',t);lab();
  b.addEventListener('click',function(){var n=sombre()?'light':'dark';R.setAttribute('data-theme',n);try{localStorage.setItem('piaffe:landing:theme',n)}catch(e){}lab()})})();

/* ---------- Nav ---------- */
(function(){var n=$('#nav'),b=$('#burger');
  b.addEventListener('click',function(){var o=n.classList.toggle('ouvert');b.setAttribute('aria-expanded',o);b.setAttribute('aria-label',o?'Fermer le menu':'Ouvrir le menu')});
  $$('#navL a').forEach(function(a){a.addEventListener('click',function(){n.classList.remove('ouvert');b.setAttribute('aria-expanded','false')})})})();

/* ---------- Captures et appareils ---------- */
/* c : [x,y,l,h] en pixels de l’écran d’origine ; m : recadrage téléphone */
function cropStyle(c,m,iw){var s='--dx:'+c[0]+';--dy:'+c[1]+';--dw:'+c[2]+';--dh:'+c[3];if(m)s+=';--mx:'+m[0]+';--my:'+m[1]+';--mw:'+m[2]+';--mh:'+m[3];if(iw)s+=';--iw:'+iw;return s}
function img(n,alt,tab){return '<img src="'+SH+n+'.webp" width="'+(tab?1770:2160)+'" height="'+(tab?1230:1350)+'" loading="lazy" alt="'+(alt||'')+'">'}
function barre(){return '<div class="nf-bar"><i></i><i></i><i></i><span>'+I('lock')+'app.piaffe.fr/les-tilleuls</span></div>'}
/* iPhone : n = une capture ou une liste de captures empilées ; o.duo = capture sombre disponible */
var IOS='<svg viewBox="0 0 78 13" aria-hidden="true"><rect x="0" y="8" width="3.2" height="4.6" rx=".9"/><rect x="4.9" y="5.6" width="3.2" height="7" rx=".9"/><rect x="9.8" y="3" width="3.2" height="9.6" rx=".9"/><rect x="14.7" y=".4" width="3.2" height="12.2" rx=".9"/><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M24.4 4.7a11.2 11.2 0 0 1 15.6 0"/><path d="M27.4 7.7a7 7 0 0 1 9.6 0"/></g><circle cx="32.2" cy="10.8" r="1.6"/><rect x="48.5" y=".9" width="24.5" height="11.6" rx="3.6" fill="none" stroke="currentColor" stroke-opacity=".4"/><rect x="50.2" y="2.6" width="21.1" height="8.2" rx="2.2"/><path d="M74.6 4.8v3.8c.8-.3 1.4-1 1.4-1.9s-.6-1.6-1.4-1.9z" opacity=".45"/></svg>';
function tel(n,alt,o){o=o||{};var L=[].concat(n),ims=L.map(function(x,i){var lz=o.vite?'':' loading="lazy"';
    if(o.duo)return '<img class="only-l" src="'+SH+x+'.webp" width="786" height="1704" alt="'+(alt||'')+'"'+lz+'><img class="only-d" src="'+SH+x+'-dark.webp" width="786" height="1704" alt="" loading="lazy">';
    return '<img'+(L.length>1&&i===0?' class="on"':'')+' src="'+SH+x+'.webp" width="786" height="1704" alt="'+(i?'':(alt||''))+'"'+lz+'>'}).join('');
  return '<figure class="ip'+(o.duo?' duo':'')+(o.k?' '+o.k:'')+'"><i class="ip-b b1"></i><i class="ip-b b2"></i><i class="ip-b b3"></i><i class="ip-b b4"></i><div class="ip-c"><div class="ip-f"><div class="ip-s">'+ims+'<div class="ip-st"><span>9:41</span>'+IOS+'</div><i class="ip-di"></i><i class="ip-h"></i><i class="ip-gl"></i></div></div></div>'+(o.cap?'<figcaption>'+o.cap+'</figcaption>':'')+'</figure>'}
$$('[data-ip]').forEach(function(e){e.outerHTML=tel(e.dataset.ip,e.dataset.alt,{duo:e.dataset.duo,vite:e.dataset.vite,cap:e.dataset.cap})});

/* ---------- Bento des fonctions ---------- */
var ECG='<svg viewBox="0 0 200 38" preserveAspectRatio="none" aria-hidden="true"><polyline vector-effect="non-scaling-stroke" points="0,22 26,22 34,22 40,10 46,30 52,4 58,26 64,22 96,22 104,22 110,12 116,29 122,6 128,26 134,22 166,22 172,14 178,28 184,8 190,24 200,22"/></svg>';
var SPK='<svg viewBox="0 0 200 38" preserveAspectRatio="none" aria-hidden="true"><polyline vector-effect="non-scaling-stroke" points="0,31 22,27 44,29 66,21 88,23 110,15 132,17 154,9 176,11 200,4"/></svg>';
var BW={
 rep:'<div class="bw bw-rep">'+[['Galop 3-4',7,10],['Baby poney',6,8],['Galop 5-6',5,8]].map(function(r){return '<div><em>'+r[0]+'</em><span><i style="--v:'+(r[1]/r[2])+'"></i></span><b>'+r[1]+'/'+r[2]+'</b></div>'}).join('')+'</div>',
 ecg:'<div class="bw"><span class="vif"><i></i>En direct, box B23</span><span class="ecg">'+ECG+'<i></i></span></div>',
 fac:'<div class="bw bw-fac">'+[['Léa Martin','520 €'],['Chloé Roux','640 €']].map(function(r){return '<div><span>'+r[0]+' · '+r[1]+'</span><span class="etat"><em>En attente</em><em>Payée</em></span></div>'}).join('')+'</div>',
 pt:'<div class="bw bw-pt">'+['MD','HL','IG','KB'].map(function(a,k){return '<span class="av">'+a+'<i style="--k:'+(k+1)+'"></i></span>'}).join('')+'<small>6 sur 9 ont pointé ce matin</small></div>',
 sp:'<div class="bw bw-sp"><span><b data-n="86">86</b> % de remplissage</span><span class="ecg lent">'+SPK+'<i></i></span></div>',
 ia:'<div class="bw"><span class="mini-orb"></span><span>« Qui n’a pas payé ce mois-ci ? »</span><span class="pts-ia"><i></i><i></i><i></i></span></div>',
 pf:'<div class="bw bw-pf"><span class="nd">Banque</span><span class="fil"><i></i></span><span class="nd c">Piaffe</span><span class="fil"><i></i></span><span class="nd">Comptable</span></div>'};
var BENTO=[
 ['rd','members','Club','Reprises, cavaliers, familles, concours','#m-planning',7,[['planning','Planning'],['saddle','Montoir'],['members','Adhérents et familles'],['stable','Pensions'],['coach','Coachs'],['trophy','Compétitions'],['shop','Boutique et stages'],['chat','Communication']],'rep'],
 ['hz','horse','Écurie','Chaque cheval suivi, chaque box visible','#m-chevaux',5,[['horse','Chevaux'],['care','Soins'],['feed','Alimentation'],['cube','Plan 3D'],['camera','Caméras et capteurs'],['upkeep','Entretien et stocks']],'ecg'],
 ['mo','euro','Argent','De la facture à la TVA','#m-facturation',5,[['invoice','Facturation'],['doc','Devis'],['accounting','Comptabilité'],['percent','TVA'],['bank','Banque'],['sign','Contrats signés']],'fac'],
 ['tm','team','Équipe','Une vraie RH d’écurie','#m-equipe',3,[['team','Planning'],['clockin','Pointage'],['holiday','Congés'],['wallet','Paie']],'pt'],
 ['acc','today','Pilotage','Tout voir en un coup d’œil','#espaces',4,[['today','Tableau de bord du matin'],['report','Rapports'],['search','Recherche partout']],'sp'],
 ['ia','spark','Piaffe AI','Posez la question, il lit vos chiffres','#ai',7,[['chat','Questions en français'],['checkc','Actions validées par vous'],['sun','Point du matin'],['repeat','Automatisations'],['plug','Dans Claude et ChatGPT']],'ia'],
 ['pf','plug','Plateforme','Ouverte et sous contrôle','#connecteurs',5,[['plug','72 connecteurs'],['import','Reprise des données'],['api','API publique'],['wifi','Hors ligne'],['settings','Réglages']],'pf']
];
put($('#bento'),BENTO.map(function(b,i){return '<a class="bt '+(b[0]==='ia'?'ia':'d-'+b[0])+'" href="'+b[4]+'" style="--s:'+b[5]+';--i:'+(i%3)+'" data-r><div class="bt-h"><span class="bt-i">'+I(b[1])+'</span><div><h3>'+b[2]+'</h3><small>'+b[3]+'</small></div><span class="bt-go">'+I('arrow')+'</span></div><div class="pil">'+b[6].map(function(p){return '<span>'+I(p[0])+p[1]+'</span>'}).join('')+'</div>'+BW[b[7]]+'</a>'}).join(''));

/* ---------- Quatre espaces : section épinglée ---------- */
function vue(n,alt,c,iw){return '<div class="vue"><div class="crop" style="'+cropStyle(c,null,iw)+'">'+img(n,alt,iw)+'</div></div>'}
var ESP=[
 {id:'gerant',d:'acc',ic:'today',n:'Gérant',ap:'Ordinateur',qui:'Claire Dumont, gérante',t:'Toute l’écurie sous les yeux, chaque matin.',p:'Le tableau de bord dit ce qui demande une décision aujourd’hui. Les rapports répondent au reste : chiffre d’affaires, remplissage, rentabilité.',c:'Ce qui demande une décision aujourd’hui, et des rapports clairs pour le reste.',
  l:['Résumé du matin et actions en un geste','Planning, chevaux, adhérents, facturation, équipe','Rapports clairs sur 12 mois','Piaffe AI sur chaque écran'],r:'cockpit',cta:'Ouvrir l’espace gérant',tel:'p-g-cockpit',
  lab:['today','Le même tableau de bord, sur ordinateur'],v:vue('g-cockpit','Indicateurs du tableau de bord du gérant',[854,196,566,393])},
 {id:'employe',d:'hz',ic:'hay',n:'Employé',ap:'Téléphone et tablette',qui:'Antoine Leroy, palefrenier soigneur',t:'Sa journée, box après box.',p:'Palefreniers et moniteurs voient quoi faire maintenant, cochent les boxes d’un geste et signalent un souci avec une photo. Même sans réseau.',c:'Quoi faire maintenant, box après box. Même sans réseau.',
  l:['Tournée des boxes, soins et rations du jour','Consignes de la gérante, lues et confirmées','Pointage par appui maintenu','Fonctionne hors ligne, synchronise ensuite'],r:'emp-jour',cta:'Ouvrir l’espace employé',tel:'p-emp-tournee',
  lab:['alert','L’urgence du matin, sur la tablette de la sellerie'],v:vue('e-jour-tab','Urgence Xanthos, box B23, sur la tablette de l’équipe',[296,178,517,283],1180)},
 {id:'adherent',d:'rd',ic:'user',n:'Adhérent',ap:'Téléphone',qui:'Léa Martin, propriétaire d’Ulysse',t:'Le club dans la poche des cavaliers.',p:'Réserver, rattraper un cours, payer, signer. Les propriétaires suivent leur cheval, les parents paient pour toute la famille.',c:'Réserver, rattraper, payer, signer, et suivre son cheval.',
  l:['Réservations, rattrapages et liste d’attente','Fiche et journal de son cheval','Paiement en ligne, en une ou trois fois','Galops, progression et concours'],r:'adh-accueil',cta:'Ouvrir l’espace adhérent',tel:'p-adh-accueil',
  lab:['horse','La fiche de son cheval, Ulysse'],v:tel('p-adh-cheval','Fiche du cheval Ulysse de la Roche')},
 {id:'coach',d:'mo',ic:'coach',n:'Coach',ap:'Ordinateur et téléphone',qui:'Pauline Arnaud, coach CSO indépendante',t:'Un agenda qui se remplit tout seul.',p:'Les coachs indépendants publient leurs disponibilités. Les cavaliers réservent et paient en ligne, l’écurie perçoit sa part automatiquement.',c:'Les cavaliers réservent et paient en ligne, l’écurie perçoit sa part.',
  l:['Agenda sur plusieurs écuries, trajets compris','Réservation et paiement en ligne','Élèves, notes de séance, progression','Revenus et reversements clairs'],r:'coach-agenda',cta:'Ouvrir l’espace coach',tel:'p-coach-agenda',
  lab:['calendar_add','Sa journée en chiffres, sur ordinateur'],v:vue('c-agenda','Journée de la coach : 5 cours aujourd’hui, 46 km de route',[296,178,399,334])}
];
function coches(l,k){return '<ul class="coches'+(k?' '+k:'')+'">'+l.map(function(x,j){return '<li style="--k:'+j+'">'+I('check')+x+'</li>'}).join('')+'</ul>'}
put($('#esp'),'<div class="esp-tabs" role="tablist" aria-label="Les quatre espaces"><span class="esp-g"></span>'+ESP.map(function(e,i){return '<button type="button" role="tab" id="et-'+e.id+'" aria-controls="ep-'+e.id+'" aria-selected="'+(i===0)+'" tabindex="'+(i?-1:0)+'" class="d-'+e.d+'"><span class="et-i">'+I(e.ic)+'</span><span><b>'+e.n+'</b><small>'+e.ap+'</small></span></button>'}).join('')+'<span class="esp-pr"><i></i></span></div>'+
 '<div class="pin-p"><div class="pin-bg" aria-hidden="true">'+ESP.map(function(e,i){return '<i class="d-'+e.d+(i?'':' on')+'"></i>'}).join('')+'</div><div class="pin-g">'+
 '<div class="pin-tx">'+ESP.map(function(e,i){return '<div class="pin-t d-'+e.d+(i?'':' on')+'" role="tabpanel" id="ep-'+e.id+'" aria-labelledby="et-'+e.id+'"><span class="esp-qui">'+I(e.ic)+e.qui+'</span><h3>'+e.t+'</h3><p>'+e.p+'</p><p class="court">'+e.c+'</p>'+coches(e.l,'coches-m')+'<a class="btn pri" '+demo(e.r)+'>'+e.cta+I('arrow')+'</a></div>'}).join('')+'</div>'+
 '<div class="pin-ph">'+tel(ESP.map(function(e){return e.tel}),'Les quatre espaces de Piaffe sur téléphone')+'</div>'+
 '<div class="pin-dx">'+ESP.map(function(e,i){return '<div class="pin-d d-'+e.d+(i?'':' on')+'"'+(i?' aria-hidden="true"':'')+'><p class="pin-lab">'+I(e.lab[0])+e.lab[1]+'</p>'+e.v+coches(e.l)+'</div>'}).join('')+'</div></div></div>');
(function(){var pin=$('#pin'),st=$('.pin-st'),tabs=$$('.esp-tabs button'),g=$('.esp-g'),pr=$('.esp-pr i'),L=[$$('.pin-t'),$$('.pin-d'),$$('.pin-ph .ip-s img'),$$('.pin-bg i')],cur=0,tick=false;
  function set(i){if(i===cur)return;var dir=i>cur?1:-1;
    L.forEach(function(l){l[cur].style.setProperty('--dir',-dir);l[i].style.setProperty('--dir',dir);l[i].getBoundingClientRect();l.forEach(function(e,k){e.classList.toggle('on',k===i)})});
    L[1].forEach(function(e,k){if(k===i)e.removeAttribute('aria-hidden');else e.setAttribute('aria-hidden','true')});
    tabs.forEach(function(t,k){t.setAttribute('aria-selected',k===i);t.tabIndex=k===i?0:-1});
    g.style.transform='translateX(calc('+i+' * (100% + 4px)))';cur=i}
  function course(){return pin.offsetHeight-st.offsetHeight}
  function haut(){return parseFloat(getComputedStyle(st).top)||0}
  function maj(){tick=false;var c=course();if(c<80){pr.style.transform='scaleX('+((cur+1)/4)+')';return}
    var p=Math.max(0,Math.min(1,(haut()-pin.getBoundingClientRect().top)/c));pr.style.transform='scaleX('+p.toFixed(4)+')';set(Math.min(3,Math.floor(p*4)))}
  function va(i,focus){var c=course();if(c<80){set(i);maj()}else scrollTo({top:scrollY+pin.getBoundingClientRect().top-haut()+c*(i+.5)/4,behavior:RM?'auto':'smooth'});if(focus)tabs[i].focus({preventScroll:true})}
  tabs.forEach(function(t,i){t.addEventListener('click',function(){va(i)});
    t.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();va((i+1)%4,1)}else if(e.key==='ArrowLeft'){e.preventDefault();va((i+3)%4,1)}})});
  addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(maj)}},{passive:true});addEventListener('resize',maj);maj()})();

/* ---------- Tour des modules ---------- */
/* c : fenêtre montrée à l’ordinateur ; m : recadrage au téléphone ; mt : capture iPhone montrée à la place au téléphone ;
   an : [x, y, l, h, libellé] d’un élément de l’écran, entouré ; ch : chiffres clés [valeur, unité, libellé] */
var MODS=[
 {id:'planning',d:'rd',ic:'planning',n:'Planning et reprises',h:['Le planning se remplit,','et il ménage vos chevaux.'],
  p:'Reprises, stages, balades et cours particuliers sur toutes vos pistes. Piaffe attribue les chevaux selon le niveau et la charge de chacun, et gère absences, rattrapages et liste d’attente.',
  u:[['Le montoir se compose tout seul','Chaque cavalier reçoit un cheval à son niveau, sans dépasser la charge de la semaine.'],['Rattrapages et liste d’attente','Une place se libère, le premier de la liste est prévenu et réserve en un geste.'],['L’appel sur le téléphone','Le moniteur pointe les présents en carrière, les séances se décomptent seules.']],
  r:'planning',shot:'g-planning',alt:'Planning de la semaine du 16 au 22 novembre',c:[276,0,1164,900],f:1,m:[300,340,518,560],
  an:[[660,218,187,46,'Remplissage suivi en direct'],[521,646,147,84,'Léa et Ulysse, cours avec Pauline']],ch:[[23,'','reprises cette semaine'],[200,'','cavaliers en selle'],[85,' %','de remplissage']]},
 {id:'chevaux',d:'hz',ic:'horse',n:'Chevaux et soins',h:['Chaque cheval suivi,','rien n’est oublié.'],
  p:'Une fiche par cheval : identité SIRE, soins, ferrure, vermifuges, travail de la semaine, ration, coûts et journal partagé avec le propriétaire.',
  u:[['Rappels de soins automatiques','Vaccins, vermifuges, maréchal, dentiste : les échéances se regroupent en tournées.'],['Charge de travail surveillée','Piaffe signale les chevaux au-dessus de leur seuil, avant la blessure.'],['Le propriétaire voit tout','Journal, soins et factures de son cheval, depuis son téléphone.']],
  r:'chevaux',shot:'g-chevaux',alt:'Chevaux : 44 chevaux et poneys, 8 à surveiller',c:[276,0,1164,734],m:[854,178,566,559],
  an:[[866,190,263,279,'Tornado et Xanthos, à surveiller'],[1145,190,263,279,'Charge de travail par cheval']],ch:[[44,'','chevaux et poneys suivis'],[8,'','à surveiller cette semaine'],[415,' €','de coût moyen par mois']]},
 {id:'ecurie',d:'tm',ic:'camera',n:'Écurie connectée',h:['L’écurie en direct,','même la nuit.'],
  p:'Caméras de box, abreuvoirs, sondes et silo sont reliés. Piaffe croise les signaux et vous prévient quand quelque chose sort de l’habitude. Le plan 3D montre qui occupe chaque box.',
  u:[['Alerte avant la colique','Xanthos se couche souvent et boit 40 % de moins : l’équipe est prévenue aussitôt.'],['Rations et stocks reliés','44 rations individuelles, 16 jours de foin d’avance, la commande au bon moment.'],['Plan de l’écurie en 3D','Boxes occupés, paddocks, places libres : tout se lit d’un coup d’œil.']],
  r:'cameras',shot:'g-cameras',alt:'Caméras et capteurs : alerte sur Xanthos, box B23',c:[276,0,1164,892],m:[296,430,528,465],
  an:[[308,255,1100,113,'Caméra et abreuvoir, le même signal'],[567,442,245,138,'Box B23 en direct']],ch:[[8,'','caméras en ligne'],[6,'','capteurs reliés'],[16,' jours','de foin d’avance']]},
 {id:'adherents',d:'rd',ic:'members',n:'Adhérents, pensions et contrats',h:['Une famille, un payeur,','tous les cavaliers.'],
  p:'Fiches complètes, inscriptions en ligne, licences FFE en lot, pensions et demi-pensions. Les contrats se signent au doigt et se rangent tout seuls.',
  u:[['Inscriptions validées en un geste','Le dossier arrive complet : certificat, autorisation parentale, droit à l’image.'],['Pensions et demi-pensions','25 chevaux en pension, 4 formules, la facture du mois préparée d’avance.'],['Contrats signés sur le téléphone','Le modèle se remplit, la signature a valeur probante, l’archive est gardée 10 ans.']],
  r:'adherents',shot:'g-adherents',alt:'Adhérents : 148 cavaliers inscrits, inscriptions à valider, licences FFE',c:[276,0,1164,822],m:[296,399,638,428],
  an:[[308,411,614,404,'Inscriptions validées en un geste'],[936,411,472,404,'138 licences prêtes en un lot']],ch:[[148,'','adhérents'],[119,'','familles'],[25,'','chevaux en pension']]},
 {id:'facturation',d:'mo',ic:'invoice',n:'Facturation et comptabilité',h:['Les factures du mois,','en un seul geste.'],
  p:'Forfaits, pensions et prestations se facturent seuls, au bon taux de TVA. Carte, prélèvement SEPA, chèques-vacances, espèces : chaque paiement retrouve sa facture, puis sa ligne de banque.',
  u:[['Facturation préparée par Piaffe','69 factures prêtes pour décembre : vous vérifiez, vous envoyez.'],['Relances automatiques','7 factures en retard, 7 relances prêtes. Le lien de paiement est dans le message.'],['Comptabilité sans double saisie','Banque rapprochée, TVA préparée, export FEC, accès pour votre expert-comptable.']],
  r:'facturation',shot:'g-facturation',alt:'Facturation : 69 factures prêtes pour 18 292 €',c:[276,0,1164,662],m:[638,415,526,248],
  an:[[308,213,1100,200,'69 factures, un seul envoi'],[908,427,243,224,'Relances déjà parties']],ch:[[69,'','factures prêtes pour décembre'],[31846,' €','encaissés en novembre'],[93,' %','payés à l’échéance']]},
 {id:'equipe',d:'tm',ic:'team',n:'Équipe et pointage',h:['Plannings, pointage et paie,','enfin réunis.'],
  p:'Chacun pointe en maintenant le doigt sur son téléphone. Heures supplémentaires, congés, diplômes et convention collective des centres équestres sont suivis. La paie part vers votre logiciel.',
  u:[['Pointage au téléphone','Un appui long, la position est vérifiée. Fini les feuilles à recopier.'],['Échéances suivies','Carte professionnelle, PSC1, fin de CDD : Piaffe prévient et prépare la suite.'],['Export vers la paie','Les heures du mois partent vers PayFit ou Silae, sans ressaisie.']],
  r:'equipe',shot:'g-equipe',alt:'Équipe : 6 salariés sur 9 en poste ce matin, échéances à traiter',c:[276,0,1164,885],m:[296,201,609,251],
  an:[[308,213,328,227,'6 sur 9 en poste, pointés au téléphone'],[1181,608,205,38,'Renouvellement préparé']],ch:[[9,'','personnes dans l’équipe'],[262,' h 30','planifiées cette semaine'],[7,'','points à traiter']]},
 {id:'concours',d:'mo',ic:'trophy',n:'Compétitions et coachs',h:['Qui emmène qui ?','Réglé en glissant.'],
  p:'Engagements préparés pour FFE Compet, horaires de passage, vans et covoiturage. Les cavaliers voient leur heure, les coachs leur programme, l’écurie ses frais à refacturer.',
  u:[['Engagements en un envoi','9 cavaliers engagés à Rambouillet, la clôture est rappelée la veille.'],['Vans et places','Chaque cheval a sa place dans le camion, chaque famille son horaire de départ.'],['Coachs réservables en ligne','Un créneau, un paiement, c’est réservé. L’écurie perçoit sa part.']],
  r:'competitions',shot:'g-competitions',alt:'Compétitions : CSO Club et Poney à Rambouillet, 9 cavaliers engagés',c:[276,0,1164,826],mt:['p-adh-concours','Le concours vu par la cavalière : départ du van et heure de passage'],
  an:[[523,590,247,44,'Prêt pour FFE Compet'],[439,678,146,46,'Qui emmène qui']],ch:[[5,'','concours au calendrier'],[9,'','cavaliers engagés dimanche'],[24,' km','jusqu’à Rambouillet']]},
 {id:'communication',d:'rd',ic:'chat',n:'Communication',h:['Le bon message,','à la bonne famille.'],
  p:'Une messagerie par famille, des envois groupés par reprise, des annonces et des sondages. Notification, SMS, e-mail ou WhatsApp : vous savez qui a lu.',
  u:[['Un seul fil par famille','Fini les groupes de discussion qui débordent : chaque échange est rangé.'],['Envois groupés ciblés','La reprise de 17 h est annulée ? Seuls les cavaliers concernés sont prévenus.'],['Modèles et automatismes','Rappel de cours, facture échue, licence à renouveler : les messages partent seuls.']],
  r:'communication',shot:'g-communication',alt:'Communication : messagerie avec Léa Martin',c:[276,0,1164,900],f:1,m:[300,287,346,520],
  an:[[316,436,323,74,'Chaque famille, un seul fil'],[664,825,728,40,'Appli, SMS, e-mail ou WhatsApp']],ch:[[4,'','canaux au choix'],[71,' %','d’ouverture ce mois-ci'],[4,'','conversations non lues']]}
];
function dedans(a,m){return m&&a[0]>=m[0]&&a[1]>=m[1]&&a[0]+a[2]<=m[0]+m[2]&&a[1]+a[3]<=m[1]+m[3]}
put($('#ancIn'),MODS.map(function(m){return '<a href="#m-'+m.id+'" class="d-'+m.d+'" data-m="'+m.id+'">'+I(m.ic)+m.n.replace(/,? (et|pensions) .*/,'').replace('Chevaux','Chevaux et soins')+'</a>'}).join(''));
put($('#mods'),MODS.map(function(m,i){var n=('0'+(i+1)).slice(-2),
   ans=m.an.map(function(a,j){return '<div class="an'+(dedans(a,m.m)?'':' md')+'" style="--ax:'+a[0]+';--ay:'+a[1]+';--aw:'+a[2]+';--ah:'+a[3]+'"><i>'+(j+1)+'</i></div>'}).join(''),
   leg=m.an.map(function(a,j){return '<li'+(dedans(a,m.m)?'':' class="md"')+'><i>'+(j+1)+'</i>'+a[4]+'</li>'}).join('');
  return '<article class="mod d-'+m.d+(i%2?' inv':'')+(m.mt?' mt':'')+'" id="m-'+m.id+'"><div class="mod-t" data-r><p class="mod-n"><span>'+I(m.ic)+'</span>'+n+' · '+m.n+'</p><h3>'+m.h[0]+' <em>'+m.h[1]+'</em></h3><p>'+m.p+'</p><ul class="puces">'+m.u.map(function(u){return '<li>'+I('check')+'<div><b>'+u[0]+'</b><small>'+u[1]+'</small></div></li>'}).join('')+'</ul>'+
   '<ul class="chiffres">'+m.ch.map(function(c){return '<li><b><span data-n="'+c[0]+'">'+fr(c[0])+'</span>'+c[1]+'</b><small>'+c[2]+'</small></li>'}).join('')+'</ul>'+
   '<div class="mod-f"><a class="lien" '+demo(m.r)+'>Voir dans la démo'+I('arrow')+'</a></div></div>'+
   '<div class="mod-v"><div class="stage"><figure class="nav-frame">'+barre()+'<div class="shot" style="'+cropStyle(m.c,m.m)+'"><div class="crop'+(m.f?' fade':'')+'">'+img(m.shot,m.alt)+'</div>'+ans+'</div></figure>'+(m.mt?tel(m.mt[0],m.mt[1],{k:'mod-ip'}):'')+'</div><ul class="legendes">'+leg+'</ul></div></article>'}).join(''));

/* ---------- Piaffe AI : questions et réponses, chiffres de la démo ---------- */
function tb(h,rows,plus){return '<div class="b-carte"><table><thead><tr>'+h.map(function(x){return '<th>'+x+'</th>'}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+r.map(function(x){return '<td>'+x+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table>'+(plus?'<div class="plus">'+plus+'</div>':'')+'</div>'}
function bar(v,max){return '<span class="bar'+(v>max*.85?' h':'')+'"><i style="width:'+Math.min(100,Math.round(v/max*100))+'%"></i></span>'}
var QA=[
 {q:'Qui n’a pas payé ce mois-ci ?',ic:'invoice',d:'mo',re:/pay|impay|relan|retard|doit/i,lu:'Facturation</b> et <b>Adhérents',
  t:'<b>7 familles vous doivent 2 073 €</b>, sur 7 factures en retard. La plus ancienne a 57 jours. Voici le détail, du plus gros montant au plus petit.',
  c:tb(['Payeur','Retard','Dû'],[['Chloé Roux','26 j','640 €'],['Léa Martin','2 j','520 €'],['Juliette Bertrand','27 j','390 €']],'et 4 autres familles pour 523 €'),
  a:{t:'Relancer 7 familles pour 2 073 €',r:[['Destinataires','7 payeurs, 7 factures'],['Canal','E-mail, puis SMS après 45 jours de retard'],['Lien de paiement','Carte ou prélèvement SEPA, dans le message']],ok:'7 relances envoyées par e-mail et SMS'}},
 {q:'Quels chevaux ont trop travaillé cette semaine ?',ic:'gauge',d:'hz',re:/travaill|charge|fatigu|surmen|trop mont/i,lu:'Planning</b> et <b>Chevaux',
  t:'<b>2 chevaux de club dépassent leur plafond de la semaine.</b> Hermès est le plus sollicité, avec 14 h pour un plafond de 12 h. À l’inverse, Jazz et Lune d’Or ont de la marge.',
  c:tb(['Cheval','Semaine','Plafond'],[['Hermès',bar(14,12)+'14 h','12 h'],['Sirius du Moulin',bar(16,16)+'16 h','16 h'],['Quiétude',bar(14,16)+'14 h','16 h'],['Jazz',bar(4,16)+'4 h','16 h']]),
  a:{t:'Rééquilibrer le montoir jusqu’à dimanche',r:[['Allégés','Hermès, Sirius, Quiétude'],['Sollicités à la place','Quartz, Jazz, Lune d’Or'],['Reprises modifiées','6 attributions sur 4 reprises, niveaux respectés']],ok:'Montoir rééquilibré sur 4 reprises, moniteurs prévenus'}},
 {q:'Remplis les places libres de samedi',ic:'planning',d:'rd',re:/place|samedi|rempli|complet|attente/i,lu:'Planning',
  t:'Samedi, il reste <b>9 places sur 54</b>, réparties sur 4 reprises. Et 5 cavaliers attendent une place dans les reprises complètes : je peux leur proposer les créneaux libres.',
  c:tb(['Reprise','Inscrits','Libres'],[['10 h · Galop 3-4','7/10','3'],['11 h · Baby poney','6/8','2'],['14 h · Galop 5-6','5/8','3'],['15 h · Galop 2','7/10','1']]),
  a:{t:'Proposer 9 places aux listes d’attente',r:[['Message','Une place s’est libérée, réservez-la en un geste'],['Règle','Premier arrivé, premier servi, place tenue 2 h'],['Canal','Notification, puis SMS']],ok:'Places proposées à 5 cavaliers en liste d’attente'}},
 {q:'Prépare les factures de pension',ic:'euro',d:'tm',re:/factur|pension|brouillon/i,lu:'Pensions</b> et <b>Facturation',
  t:'J’ai préparé <b>25 factures de pension pour décembre</b>, une par cheval de propriétaire, pour un total de <b>13 000 € TTC</b>. Elles sont en brouillon : rien n’est émis ni envoyé.',
  c:tb(['Cheval','Payeur','Montant'],[['Ulysse de la Roche · B01','Léa Martin','520 €'],['Uranus · B21','Aurélie André','520 €'],['Volga · B22','Hugo Roux','520 €'],['Xanthos · B23','Hélène Bernard','520 €']],'et 21 autres factures identiques'),
  a:{t:'Émettre 25 factures pour 13 000 €',r:[['Numérotation','Définitive, à la suite des factures de novembre'],['Échéance','5 décembre, prélèvement SEPA pour 14 mandats'],['Envoi','Par e-mail au payeur, avec le lien de paiement']],ok:'25 factures émises et envoyées'}}
];
put($('#aiQs'),QA.map(function(x,i){return '<button type="button" data-q="'+i+'" aria-pressed="false"><span class="d-'+x.d+'">'+I(x.ic)+'</span><span>'+x.q+'</span>'+I('arrow')+'</button>'}).join(''));
(function(){var fil=$('#chatFil'),btns=$$('#aiQs button'),tok=0,joue=false;
  function w(ms,t){return new Promise(function(res,rej){setTimeout(function(){t===tok?res():rej()},RM?0:ms)})}
  function add(h){var d=D.createElement('div');d.innerHTML=nb(h);var e=d.firstChild;if(!RM)e.classList.add('pop');fil.appendChild(e);bas();return e}
  function bas(){fil.scrollTo({top:fil.scrollHeight,behavior:RM?'auto':'smooth'})}
  function mots(el,html){/* le texte arrive mot à mot, la mise en page ne bouge pas */
    var out='',gras=false;nb(html).split(/(<\/?b>)/).forEach(function(p){if(p==='<b>'){gras=true;return}if(p==='</b>'){gras=false;return}
      p.split(/( )/).forEach(function(m){if(m===' '){out+=' ';return}if(m)out+='<span class="mot">'+(gras?'<b>'+m+'</b>':m)+'</span>'})});
    el.innerHTML=out;return $$('.mot',el)}
  function carte(a){var c=add('<div class="b-act"><h4>'+I('checkc')+a.t+'</h4><dl>'+a.r.map(function(r){return '<dt>'+r[0]+'</dt><dd>'+r[1]+'</dd>'}).join('')+'</dl><div class="bts"><button type="button" class="btn pri sm" data-v>Valider</button><button type="button" class="btn sec sm" data-m>Modifier</button></div></div>');
    function attente(){$('[data-v]',c).addEventListener('click',function(){c.classList.add('fait');$('.bts',c).outerHTML=nb('<div class="b-fait"><span>'+a.ok+'. Noté au journal.</span><button type="button" data-u>Annuler</button></div>');var n=$('.note',c);if(n)n.remove();
        $('[data-u]',c).addEventListener('click',function(){c.classList.remove('fait');$('.b-fait',c).outerHTML='<div class="bts"><button type="button" class="btn pri sm" data-v>Valider</button><button type="button" class="btn sec sm" data-m>Modifier</button></div>';attente()});bas()});
      $('[data-m]',c).addEventListener('click',function(){if($('.note',c))return;c.insertAdjacentHTML('beforeend',nb('<p class="note">Dans Piaffe, vous modifiez le message, les destinataires ou le canal avant de valider. Rien ne part sans vous.</p>'));bas()})}
    attente()}
  function poser(i,texte){var x=QA[i],t=++tok;btns.forEach(function(b,k){b.setAttribute('aria-pressed',k===i)});fil.innerHTML='';
    (async function(){add('<div class="b-moi">'+(texte||x.q)+'</div>');await w(450,t);
      var o=add('<div class="b-outil"><span class="rond"></span><span>Piaffe AI lit vos données…</span></div>');await w(900,t);
      o.innerHTML=nb(I('check')+'<span>A lu <b>'+x.lu+'</b></span>');await w(250,t);
      var p=add('<div class="b-ia"></div>'),ms=mots(p,x.t);for(var k=0;k<ms.length;k++){ms[k].classList.add('v');if(!RM&&k%2)await w(34,t)}
      await w(250,t);add(x.c);await w(500,t);carte(x.a)})().catch(function(){})}
  function inconnu(texte){var t=++tok;btns.forEach(function(b){b.setAttribute('aria-pressed','false')});fil.innerHTML='';
    (async function(){add('<div class="b-moi"></div>').textContent=texte;await w(500,t);add('<div class="b-ia">Ici, je réponds aux quatre questions d’exemple. Dans la démo, je réponds à tout : impayés, soins, planning, stocks, paie, contrats.</div>');
      add('<div class="bts"><a class="btn pri sm" '+demo('assistant')+'>Poser cette question dans la démo'+I('arrow')+'</a></div>')})().catch(function(){})}
  btns.forEach(function(b,i){b.addEventListener('click',function(){joue=true;poser(i)})});
  $('#chatF').addEventListener('submit',function(e){e.preventDefault();var inp=$('#chatIn'),v=inp.value.trim();if(!v)return;inp.value='';joue=true;
    for(var i=0;i<QA.length;i++){if(QA[i].re.test(v)){poser(i,v.replace(/[<>&]/g,''));return}}inconnu(v)});
  /* première question jouée quand le chat entre à l’écran */
  if('IntersectionObserver' in window){new IntersectionObserver(function(es,o){if(es[0].isIntersecting){o.disconnect();if(!joue)poser(0)}},{threshold:.35}).observe($('#chat'))}else poser(0)})();

/* ---------- Piaffe AI : capacités 01 à 04, point du matin ---------- */
var CAPS=[
 ['mo','01 · Vos questions, vos chiffres','Demandez en français, il lit vos données.','Pas de menu à trouver ni de rapport à construire. Vous posez la question comme à un collègue.',
  [['chat','Combien me coûte Ulysse ?'],['chat','Où en sont les stocks de foin ?'],['chat','Quels adhérents n’ont pas leur licence 2027 ?']]],
 ['hz','02 · Il propose, vous décidez','Chaque action attend votre accord.','Piaffe AI prépare, vous montre l’aperçu, puis agit. Tout est noté au journal, avec le nom de qui a validé.',
  [['checkc','7 relances envoyées','9 h 32 · Claire'],['checkc','Montoir rééquilibré sur 4 reprises','Lundi · Claire'],['shield','Droits : gérante, rien de plus','']]],
 ['rd','03 · « Optimise ma semaine »','Les actions classées par gain.','En une demande, Piaffe AI cherche l’argent qui dort dans vos données et vous le présente du plus gros au plus petit.',
  [[1,'Refacturer 41 soins aux propriétaires','2 552 €'],[2,'Relancer 7 factures en retard','2 073 €'],[3,'Louer le box B45 qui est libre','520 € par mois'],[4,'Remplir 9 places de samedi','261 €']]],
 ['tm','04 · L’IA dans vos écrans','Elle travaille là où vous êtes.','Pas besoin d’ouvrir une conversation : Piaffe AI lit, écoute et prépare directement dans vos écrans.',
  [['scan','Factures et ordonnances lues en photo',''],['mic','Soins dictés à la voix, gants aux mains',''],['repeat','Le point sur les impayés, chaque lundi à 8 h','']]]
];
put($('#caps'),CAPS.map(function(c,i){return '<article class="cap d-'+c[0]+'" style="--i:'+(i%2)+'" data-r><div><p class="cap-n">'+c[1]+'</p><h4>'+c[2]+'</h4><p>'+c[3]+'</p></div><div class="mm">'+c[4].map(function(r){return '<div>'+(typeof r[0]==='number'?'<span class="rg">'+r[0]+'</span>':I(r[0]))+'<span>'+(i===0?'« '+r[1]+' »':r[1])+'</span>'+(r[2]?(i===2?'<em>+ '+r[2]+'</em>':'<small>'+r[2]+'</small>'):'')+'</div>'}).join('')+'</div></article>'}).join(''));
var MATIN=[['cr','heart','Attention','Tornado boite','Le Dr Leclerc passe à 14 h, Lucie le prépare à 13 h 45.'],['mo','alert','À surveiller','Xanthos boit 40 % de moins','Depuis hier soir, au box B23. Antoine le surveille toutes les deux heures.'],['hz','trend','Opportunité','7 relances sont prêtes','2 073 € à encaisser. Un geste suffit pour les envoyer.'],['tm','rain','Prévision','Pluie jeudi et vendredi','2 reprises en carrière peuvent passer au grand manège.']];
put($('#matin'),MATIN.map(function(m){return '<div class="mt-c d-'+m[0]+'"><span class="mt-tag">'+I(m[1])+m[2]+'</span><b>'+m[3]+'</b><small>'+m[4]+'</small></div>'}).join(''));
(function(){var b=$('#mcpCopy'),s=$('span',b);b.addEventListener('click',function(){var u=$('#mcpUrl').textContent,ok=function(){s.textContent='Copié';setTimeout(function(){s.textContent='Copier'},1800)};
  try{navigator.clipboard.writeText(u).then(ok,ok)}catch(e){ok()}})})();

/* ---------- Démo, connecteurs, mise en route ---------- */
var DEMO=[['acc','today','Gérant',[['cockpit','Tableau de bord'],['planning','Planning'],['chevaux','Chevaux'],['facturation','Facturation'],['cameras','Caméras']]],
 ['hz','hay','Employé',[['emp-jour','Ma journée'],['emp-tournee','Tournée des boxes'],['emp-soins','Soins'],['emp-pointage','Pointage']]],
 ['rd','user','Adhérent',[['adh-accueil','Accueil'],['adh-reserver','Réserver'],['adh-cheval','Mon cheval'],['adh-paiements','Paiements']]],
 ['mo','coach','Coach',[['coach-agenda','Agenda'],['coach-eleves','Élèves'],['coach-revenus','Revenus']]]];
put($('#demoL'),DEMO.map(function(d){return '<div class="dm d-'+d[0]+'"><div class="dm-q"><span>'+I(d[1])+'</span>'+d[2]+'</div><div class="dm-r">'+d[3].map(function(r){return '<a '+demo(r[0])+'>'+r[1]+I('arrow')+'</a>'}).join('')+'</div></div>'}).join(''));
var CONN=[['hz','En direct','Branché une fois, à jour tout seul',[['Paiement','Stripe, GoCardless, SumUp'],['Banque','Qonto, relevés bancaires'],['Comptabilité','Pennylane, export FEC'],['Signature','Yousign'],['Paie','PayFit, export de paie'],['Messages','Brevo, WhatsApp Business'],['Agenda','Google Agenda, Apple Calendrier'],['Écurie','Caméras ONVIF, capteurs, abreuvoirs'],['IA','Claude, ChatGPT, serveur MCP']]],
 ['mo','Par import ou export assisté','Piaffe prépare le fichier, vous validez',[['FFE','Club SIF, FFE Compet, déclaration de concours'],['Aides','Pass’Sport'],['Reprise','Kavalog, Equimondo, Equionline'],['Autres logiciels','GCE, Horse-Manager, AssoConnect, HelloAsso'],['Fichiers','Excel, CSV, photos et PDF'],['Public','SIRE, IFCE, registre d’élevage']]],
 ['pf','Au catalogue, à connecter','Prêts à être activés selon vos outils',[['Paiement','Mollie, Zettle, Alma'],['Banque','Bridge, Powens'],['Comptabilité','Tiime, Cegid, Sage, EBP, Isagri'],['Paie','Silae, Lucca, Combo, Skello'],['Capteurs','Seaver, Equisense, Arioneo'],['Facture publique','Chorus Pro'],['Automatisation','Zapier, Make, n8n']]]];
put($('#connG'),CONN.map(function(c,i){return '<div class="cn d-'+c[0]+'" style="--i:'+i+'" data-r><div class="cn-h"><i></i><h3>'+c[1]+'</h3></div><p style="color:var(--mut);font-size:14.5px;margin:10px 0 4px">'+c[2]+'</p><dl>'+c[3].map(function(r){return '<div><dt>'+r[0]+'</dt><dd>'+r[1]+'</dd></div>'}).join('')+'</dl></div>'}).join(''));
var ETAPES=[['acc','10 minutes','Créez votre écurie','Pistes, boxes, forfaits, tarifs : huit étapes guidées, et vos modules s’activent un par un.'],['hz','Une après‑midi','Reprenez vos données','Déposez vos exports tels quels. Piaffe relie les colonnes et repère les doublons, nous vérifions avec vous.'],['rd','Un lien','Invitez l’équipe et les cavaliers','Chacun reçoit son lien et son espace. Gérant, employé, adhérent, coach : tous sont guidés à la première ouverture.']];
put($('#etapes'),ETAPES.map(function(e,i){return '<li class="d-'+e[0]+'" style="--i:'+i+'" data-r><div class="et-n"><span class="et-d">'+I('clock')+e[1]+'</span></div><h3>'+e[2]+'</h3><p>'+e[3]+'</p></li>'}).join(''));
put($('#srcL'),['Kavalog','Equimondo','Equionline','GCE et Horse-Manager','AssoConnect et HelloAsso','FFE Club SIF','Excel ou CSV','Photo ou PDF'].map(function(s){return '<span>'+s+'</span>'}).join(''));
put($('#rempL'),[['doc','Cahier de monte'],['grid','Tableur des adhérents'],['chat','Groupes de discussion'],['folder','Classeur des contrats'],['invoice','Logiciel de facturation'],['calendar_add','Agenda papier'],['list','Tableau blanc'],['clockin','Feuilles de pointage'],['care','Carnet de soins'],['camera','Application caméra'],['flag','Sondage des concours'],['bank','Relevés à pointer']].map(function(o){return '<li>'+I(o[0])+o[1]+'</li>'}).join(''));

/* ---------- Tarifs ---------- */
var OFFRES=[['Essentiel','Pour démarrer : poney-club, petite écurie',59,49,['Planning, montoir et réservations','Adhérents, familles et licences FFE','Facturation, devis et paiements','Contrats signés au doigt','Espaces adhérent et employé'],0],
 ['Écurie','Pour le centre équestre complet',149,124,['Tout Essentiel, plus :','Chevaux, soins, plan 3D, entretien','Comptabilité, TVA, équipe et pointage','Compétitions, coachs et boutique','Piaffe AI et serveur MCP','8 caméras et capteurs inclus'],1],
 ['Réseau','Pour plusieurs sites ou un grand domaine',289,241,['Tout Écurie, plus :','Plusieurs sites, un seul compte','API sans limite d’appels','Accompagnement dédié','Caméras sans limite'],0]];
function offres(an){put($('#offres'),OFFRES.map(function(o,i){return '<article class="of'+(o[5]?' vedette':'')+'">'+(o[5]?'<span class="of-tag">La plus choisie</span>':'')+'<h3>'+o[0]+'</h3><p class="of-p">'+o[1]+'</p><div class="of-prix"><b>'+(an?o[3]:o[2])+'</b><span class="of-u">€ HT<br>par mois</span></div><p class="of-an">'+(an?'Soit '+(o[2]*10).toLocaleString('fr-FR')+' € HT par an, 2 mois offerts':'Sans engagement, résiliable en un clic')+'</p><a class="btn '+(o[5]?'blanc':'sec')+'" '+demo('cockpit')+'>Essayer la démo'+I('arrow')+'</a><ul>'+o[4].map(function(l,k){return k===0&&i?'<li class="t">'+l+'</li>':'<li>'+I('check')+'<span>'+l+'</span></li>'}).join('')+'</ul></article>'}).join(''))}
offres(false);
(function(){var b=$('#bascule');$$('button',b).forEach(function(x){x.addEventListener('click',function(){var an=x.dataset.p==='a';b.classList.toggle('annuel',an);$$('button',b).forEach(function(y){y.setAttribute('aria-pressed',y===x)});offres(an)})})})();

/* ---------- Comparatif ---------- */
var CMP=[['Prix public, sans engagement ni frais d’entrée','','Engagement de 24 mois et frais de mise à disposition chez certains acteurs installés',0],['Chevaux et utilisateurs illimités','','Tarifs par paliers de cavaliers, de chevaux ou de boxes',0],['Un espace pour chacun des quatre profils','Gérant, employé, adhérent, coach','Applications rares ; les plus diffusées sont notées 3,6 sur 5',0],['Fonctionne hors ligne','Tournée, soins, pointage','Non annoncé par les éditeurs étudiés',0],['Une vraie gestion de l’équipe','Pointage, congés, export de paie','Au mieux un planning du personnel',0],['Comptabilité au-delà de l’export','Banque, TVA, FEC, expert-comptable','Le plus souvent un simple export comptable',0],['Entretien des installations','Tâches, signalements, contrôles','Aucun éditeur ne le traite',0],['Concours organisés au club, qui emmène qui','','Rare : un seul éditeur va jusqu’aux résultats en direct',0],['Caméras et capteurs intégrés','','Annoncés par quelques nouveaux venus seulement',0],['Une IA qui agit, reliée à Claude et ChatGPT','','Assistants génériques ou analyse de photo',0],['API publique et export complet','','Aucune API publique trouvée',0],['Facturation électronique (Factur-X)','','Répandue : la plupart des éditeurs la proposent',1],['Planning, réservation en ligne, fiche cheval','','Proposés partout, c’est la base',1]];
put($('#cmp'),'<div class="cmp-l cmp-h"><div class="q"></div><div class="p">'+window.LOGO(22,'currentColor','var(--acc)')+'Piaffe</div><div class="m">Logiciels du marché</div></div>'+CMP.map(function(c){return '<div class="cmp-l"><div class="q">'+c[0]+(c[1]?'<small>'+c[1]+'</small>':'')+'</div><div class="p">'+I('check')+'<span>Inclus</span></div><div class="m'+(c[3]?' oui':'')+'">'+I(c[3]?'check':'minus')+'<span>'+c[2]+'</span></div></div>'}).join(''));

/* ---------- FAQ ---------- */
var FAQ=[['Combien de temps faut-il pour démarrer ?','Une après‑midi. La mise en route de l’écurie tient en 8 étapes, environ 10 minutes, et la reprise de vos données se fait en 5 étapes. Nous la faisons avec vous, gratuitement, depuis Kavalog, Equimondo, Excel, FFE Club SIF ou même une photo de votre cahier.'],
 ['Suis-je engagé ?','Non. L’abonnement se résilie en un clic. Vos données vous appartiennent : l’export complet est disponible à tout moment, dans des formats ouverts.'],
 ['Combien coûte vraiment Piaffe ?','Le prix affiché, rien de plus : 59, 149 ou 289 € HT par mois selon la formule, avec chevaux et utilisateurs illimités. Pas de frais d’entrée, pas de frais de reprise, 30 jours d’essai sans carte bancaire.'],
 ['La démo enregistre-t-elle quelque chose ?','Non. La démo ouvre une écurie d’exemple, l’Écurie des Tilleuls, déjà remplie. Vous pouvez cliquer partout, valider, envoyer : rien n’est enregistré et personne n’est contacté.'],
 ['Piaffe AI peut-il agir sans moi ?','Non. Il lit vos données pour répondre, et chaque action vous est montrée avant d’être faite. Il agit avec vos droits, pas plus, et tout est noté dans un journal. La plupart des actions s’annulent en un geste.'],
 ['Comment relier Piaffe à Claude ou ChatGPT ?','Vous collez une adresse dans votre assistant, c’est tout. Il interroge alors votre écurie en lecture seule, avec vos droits. Chaque écriture demande votre accord, et l’accès se coupe d’un bouton.'],
 ['Les cavaliers doivent-ils installer une application ?','Ils peuvent installer l’application sur leur téléphone ou simplement ouvrir un lien. Les enfants sans adresse e-mail ont leur espace dans le compte de la famille, et un seul parent paie pour tous.'],
 ['Et sans réseau au fond de l’écurie ?','La tournée des boxes, les soins, le pointage et l’appel fonctionnent hors ligne. Tout se synchronise dès que le téléphone retrouve le réseau.'],
 ['Comment Piaffe travaille-t-il avec la FFE ?','Les licences se prennent en lot, les fichiers de FFE Club SIF s’importent, les galops se suivent dans Piaffe. Les engagements en concours sont préparés dans Piaffe, puis validés sur FFE Compet.'],
 ['Mes données sont-elles en sécurité ?','Elles sont hébergées en France, sauvegardées chaque jour et chiffrées. Chaque rôle ne voit que ce qui le concerne, et Piaffe respecte le RGPD, avec l’export et l’effacement par adhérent.'],
 ['Êtes-vous prêts pour la facture électronique ?','Oui. Les factures partent au format Factur-X par une plateforme agréée, et les clients publics, comme une mairie ou une école, les reçoivent sur Chorus Pro. La TVA à taux multiples est gérée ligne par ligne.']];
put($('#faqL'),FAQ.map(function(f,i){return '<div class="qr'+(i===0?' ouvert':'')+'"><button type="button" aria-expanded="'+(i===0)+'" aria-controls="rep'+i+'" id="q'+i+'"><span>'+f[0]+'</span><span class="pm">'+I('plus')+'</span></button><div class="rep" id="rep'+i+'" role="region" aria-labelledby="q'+i+'"><div><p>'+f[1]+'</p></div></div></div>'}).join(''));
$$('.qr button').forEach(function(b){b.addEventListener('click',function(){var q=b.parentNode,o=!q.classList.contains('ouvert');q.classList.toggle('ouvert',o);b.setAttribute('aria-expanded',o)})});

/* ---------- Illustration finale ---------- */
if(window.ILLU&&window.ILLU.cheval)$('#finIllu').innerHTML=window.ILLU.cheval();

/* ---------- Apparitions, ancres actives ---------- */
(function(){var els=$$('[data-r],.mod-v,.rig,.vifs,.lineup');
  if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -10% 0px',threshold:.1});
  els.forEach(function(e){io.observe(e)});
  var liens=$$('#ancIn a'),box=$('#ancIn');
  var io2=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var id=e.target.id.slice(2);liens.forEach(function(a){var on=a.dataset.m===id;a.classList.toggle('on',on);
    if(on&&box.scrollWidth>box.clientWidth)box.scrollTo({left:a.offsetLeft-box.clientWidth/2+a.offsetWidth/2,behavior:RM?'auto':'smooth'})})})},{rootMargin:'-45% 0px -50% 0px'});
  $$('.mod').forEach(function(m){io2.observe(m)});
  /* les mini-scènes du bento ne tournent que lorsqu’elles sont à l’écran */
  var io3=new IntersectionObserver(function(es){es.forEach(function(e){e.target.classList.toggle('vu',e.isIntersecting)})},{threshold:.2});
  $$('.bt').forEach(function(b){io3.observe(b)})})();

/* ---------- Chiffres qui comptent ---------- */
(function(){var ns=$$('[data-n]');if(RM||!('IntersectionObserver' in window))return;
  function joue(el){var v=+el.dataset.n,t0=0,d=Math.min(1700,700+Math.log(v+1)*110);
    function pas(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,4);el.textContent=fr(Math.round(v*e));if(k<1)requestAnimationFrame(pas)}
    el.textContent='0';requestAnimationFrame(pas)}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){io.unobserve(e.target);joue(e.target)}})},{rootMargin:'0px 0px -12% 0px',threshold:.6});
  ns.forEach(function(n){io.observe(n)})})();

/* ---------- Défilement : barre de lecture, appareils du hero, entrées de section ---------- */
(function(){var nav=$('#nav'),prog=$('#prog'),rig=$('.rig-in'),hz=$('#hz3'),ai=$('#ai'),fin=$('.fin-c'),tick=false;
  function k(el,H){var r=el.getBoundingClientRect();return Math.max(0,Math.min(1,(H-r.top)/(H*.55)))}
  function maj(){tick=false;var y=scrollY,H=innerHeight,T=R.scrollHeight-H;nav.classList.toggle('sc',y>40);
    prog.style.setProperty('--sp',(T>0?Math.min(1,y/T):0).toFixed(4));if(RM)return;
    var r=rig.parentNode.getBoundingClientRect();rig.style.setProperty('--p',Math.max(0,Math.min(1,(H*.96-r.top)/(H*.5))).toFixed(3));
    if(y<H*1.4)hz.style.setProperty('--hs',(y*.1).toFixed(1));
    ai.style.setProperty('--k',k(ai,H).toFixed(3));fin.style.setProperty('--k',k(fin,H).toFixed(3))}
  addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(maj)}},{passive:true});addEventListener('resize',maj);maj()})();

/* ---------- Boutons aimantés, tuiles qui s’inclinent ---------- */
(function(){if(RM||!matchMedia('(hover:hover) and (pointer:fine)').matches)return;
  $$('.mag').forEach(function(b){
    b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();b.classList.add('suit');b.style.setProperty('--gx',((e.clientX-r.left-r.width/2)*.22).toFixed(1));b.style.setProperty('--gy',((e.clientY-r.top-r.height/2)*.3).toFixed(1))});
    b.addEventListener('pointerleave',function(){b.classList.remove('suit');b.style.setProperty('--gx',0);b.style.setProperty('--gy',0)})});
  $$('.bt').forEach(function(b){
    b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;b.classList.add('tl');b.style.setProperty('--ry',(x*5).toFixed(2)+'deg');b.style.setProperty('--rx',(-y*5).toFixed(2)+'deg')});
    b.addEventListener('pointerleave',function(){b.classList.remove('tl');b.style.setProperty('--rx','0deg');b.style.setProperty('--ry','0deg')})})})();

/* ---------- Le cheval du hero : maillage low-poly au galop (three.js r128) ---------- */
(function(){var box=$('#hz3'),cv=$('canvas',box);
  function repli(){box.classList.add('sans3d');if(window.ILLU&&window.ILLU.cheval)$('.hz3-fb',box).innerHTML=window.ILLU.cheval()}
  if(typeof THREE==='undefined'||typeof HORSE==='undefined'){repli();return}
  var rd;try{rd=new THREE.WebGLRenderer({canvas:cv,antialias:true,alpha:true})}catch(e){repli();return}
  if(!rd.getContext()){repli();return}
  var T=THREE,scene=new T.Scene(),cam=new T.PerspectiveCamera(27,1,.1,40),N=HORSE.n,V=new Float32Array(N*3);
  function sombre(){return R.getAttribute('data-theme')?R.getAttribute('data-theme')==='dark':matchMedia('(prefers-color-scheme:dark)').matches}
  /* le cheval : facettes navy, arêtes et sommets strass */
  var pos=new T.BufferAttribute(V,3);pos.setUsage(T.DynamicDrawUsage);
  var geo=new T.BufferGeometry();geo.setAttribute('position',pos);geo.setIndex(new T.BufferAttribute(HORSE.idx,1));
  var vu={},ar=[],ix=HORSE.idx;for(var i=0;i<ix.length;i+=3)for(var j=0;j<3;j++){var a=ix[i+j],b=ix[i+(j+1)%3],key=a<b?a*65536+b:b*65536+a;if(!vu[key]){vu[key]=1;ar.push(a,b)}}
  var geoA=new T.BufferGeometry();geoA.setAttribute('position',pos);geoA.setIndex(new T.BufferAttribute(new Uint16Array(ar),1));
  var geoP=new T.BufferGeometry();geoP.setAttribute('position',pos);
  var mCorps=new T.MeshPhongMaterial({flatShading:true,side:T.DoubleSide,shininess:70,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1}),
      mAr=new T.LineBasicMaterial({transparent:true}),mPt=new T.PointsMaterial({size:.016,sizeAttenuation:true,transparent:true,depthWrite:false}),
      mRef=new T.MeshPhongMaterial({flatShading:true,side:T.DoubleSide,transparent:true,depthWrite:false,shininess:30}),mRefA=new T.LineBasicMaterial({transparent:true,depthWrite:false});
  var corps=new T.Mesh(geo,mCorps),aretes=new T.LineSegments(geoA,mAr),strass=new T.Points(geoP,mPt),
      reflet=new T.Group(),rC=new T.Mesh(geo,mRef),rA=new T.LineSegments(geoA,mRefA);
  reflet.add(rC,rA);reflet.scale.y=-1;reflet.position.y=-.012;
  [corps,aretes,strass,rC,rA].forEach(function(o){o.frustumCulled=false});
  /* le sol : halo et anneaux */
  function texSol(c){var s=256,k=document.createElement('canvas');k.width=k.height=s;var x=k.getContext('2d'),g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
    g.addColorStop(0,'rgba('+c+',.55)');g.addColorStop(.35,'rgba('+c+',.22)');g.addColorStop(1,'rgba('+c+',0)');x.fillStyle=g;x.fillRect(0,0,s,s);
    x.strokeStyle='rgba('+c+',.4)';x.lineWidth=1;[.2,.31,.42].forEach(function(r,n){x.globalAlpha=1-n*.3;x.beginPath();x.arc(s/2,s/2,s*r,0,7);x.stroke()});return new T.CanvasTexture(k)}
  var mSol=new T.MeshBasicMaterial({transparent:true,depthWrite:false}),sol=new T.Mesh(new T.CircleGeometry(1.75,64),mSol);sol.rotation.x=-Math.PI/2;sol.scale.set(.8,1.25,1);
  reflet.renderOrder=0;rC.renderOrder=0;rA.renderOrder=0;sol.renderOrder=1;corps.renderOrder=2;aretes.renderOrder=3;strass.renderOrder=4;
  /* poussière soulevée, étincelles et filets de vitesse */
  var VS='attribute float aA;attribute float aS;uniform float uPx;varying float vA;void main(){vA=aA;vec4 mv=modelViewMatrix*vec4(position,1.);gl_PointSize=aS*uPx/-mv.z;gl_Position=projectionMatrix*mv;}',
      FS='uniform vec3 uC;varying float vA;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.05,d);gl_FragColor=vec4(uC,a*vA);}',
      FL='uniform vec3 uC;varying float vA;void main(){gl_FragColor=vec4(uC,vA);}';
  var NP=260,pp=new Float32Array(NP*3),pa=new Float32Array(NP),ps=new Float32Array(NP),pv=new Float32Array(NP*3),pl=new Float32Array(NP),pd=new Float32Array(NP),seed=7;
  function rnd(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}
  function nait(i,pre){var sab=i<170;/* sabots ou air */
    if(sab){pp[i*3]=(rnd()-.5)*.3;pp[i*3+1]=rnd()*.05;pp[i*3+2]=(rnd()-.5)*1.1;pv[i*3]=(rnd()-.5)*.35;pv[i*3+1]=.12+rnd()*.5;pv[i*3+2]=-(.7+rnd()*1.3);pd[i]=.7+rnd()*1.1;ps[i]=.02+rnd()*.05}
    else{pp[i*3]=(rnd()-.5)*1.5;pp[i*3+1]=.05+rnd()*1.25;pp[i*3+2]=1.4+rnd()*.5;pv[i*3]=0;pv[i*3+1]=(rnd()-.5)*.05;pv[i*3+2]=-(.55+rnd()*.7);pd[i]=3.2+rnd()*2;ps[i]=.012+rnd()*.03}
    pl[i]=pre?rnd():0}
  for(i=0;i<NP;i++)nait(i,1);
  var gP=new T.BufferGeometry();gP.setAttribute('position',new T.BufferAttribute(pp,3));gP.setAttribute('aA',new T.BufferAttribute(pa,1));gP.setAttribute('aS',new T.BufferAttribute(ps,1));
  var mP=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uC:{value:new T.Color()},uPx:{value:600}},vertexShader:VS,fragmentShader:FS}),pous=new T.Points(gP,mP);pous.frustumCulled=false;pous.renderOrder=5;
  var NF=16,fp=new Float32Array(NF*6),fa=new Float32Array(NF*2),fx=[],fz=[],fl=[],fv=[];
  for(i=0;i<NF;i++){var cote=i%2?1:-1;fx.push(cote*(.22+rnd()*.85));fz.push(-1.6+rnd()*3.2);fl.push(.18+rnd()*.4);fv.push(1.6+rnd()*1.2)}
  var gF=new T.BufferGeometry();gF.setAttribute('position',new T.BufferAttribute(fp,3));gF.setAttribute('aA',new T.BufferAttribute(fa,1));gF.setAttribute('aS',new T.BufferAttribute(new Float32Array(NF*2),1));
  var mF=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uC:{value:new T.Color()},uPx:{value:1}},vertexShader:VS,fragmentShader:FL}),filets=new T.LineSegments(gF,mF);filets.frustumCulled=false;filets.renderOrder=1;
  /* lumières */
  var hemi=new T.HemisphereLight(0xffffff,0x0a1636,.85),cle=new T.DirectionalLight(0xffffff,.85),contre=new T.DirectionalLight(0x6d8bff,1.5),sabot=new T.PointLight(0x6d8bff,1.1,3.2);
  cle.position.set(2.2,3,1.4);contre.position.set(-2.4,1.4,-1.8);sabot.position.set(.9,.25,.5);
  scene.add(reflet,sol,filets,corps,aretes,strass,pous,hemi,cle,contre,sabot);
  function couleurs(){var d=sombre();
    mCorps.color.set(d?0x26357a:0x0c1a45);mCorps.specular.set(d?0xc4d0ff:0x8fa6ff);mCorps.emissive.set(d?0x0b1238:0x02040c);
    mAr.color.set(d?0xa9bcff:0x6d8bff);mAr.opacity=d?.6:.55;mPt.color.set(d?0xdfe6ff:0x9db2ff);mPt.opacity=d?.95:.9;
    mRef.color.set(d?0x26357a:0x0c1a45);mRef.specular.set(0x6d8bff);mRef.opacity=d?.2:.1;mRefA.color.set(d?0xa9bcff:0x6d8bff);mRefA.opacity=d?.16:.1;
    var c=d?'169,188,255':'36,72,216';if(mSol.map)mSol.map.dispose();mSol.map=texSol(c);mSol.opacity=d?.55:.5;mSol.needsUpdate=true;
    mP.uniforms.uC.value.set(d?0xcfd9ff:0x2448d8);mF.uniforms.uC.value.set(d?0xa9bcff:0x2448d8);contre.intensity=d?1.8:1.5}
  couleurs();function theme(){couleurs();if(RM&&W)image(0)}
  try{new MutationObserver(theme).observe(R,{attributes:true,attributeFilter:['data-theme']});matchMedia('(prefers-color-scheme:dark)').addEventListener('change',theme)}catch(e){}
  var W=0,Hh=0;function taille(){var w=cv.clientWidth,h=cv.clientHeight;if(!w||!h||(w===W&&h===Hh))return;W=w;Hh=h;var dpr=Math.min(2,window.devicePixelRatio||1);rd.setPixelRatio(dpr);rd.setSize(w,h,false);cam.aspect=w/h;
    /* cadrage : un écran étroit recule la caméra pour garder le cheval entier */
    cam.fov=27;cam.updateProjectionMatrix();mP.uniforms.uPx.value=h*dpr*1.05}
  var mx=0,my=0,sx=0,sy=0,t=0,dernier=0,vuH=true,actif=false;
  addEventListener('pointermove',function(e){mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5},{passive:true});
  function image(dt){t+=dt;HORSE.lerp(t*1.18,V);pos.needsUpdate=true;
    for(var i=0;i<NP;i++){pl[i]+=dt/pd[i];if(pl[i]>=1)nait(i,0);var q=i*3;pp[q]+=pv[q]*dt;pp[q+1]+=pv[q+1]*dt;pp[q+2]+=pv[q+2]*dt;if(i<170)pv[q+1]-=.5*dt;if(pp[q+1]<0)pp[q+1]=0;
      pa[i]=Math.sin(Math.PI*pl[i])*(i<170?.5:.8)}
    gP.attributes.position.needsUpdate=true;gP.attributes.aA.needsUpdate=true;
    for(i=0;i<NF;i++){fz[i]-=fv[i]*dt;if(fz[i]<-1.9){fz[i]=1.7;fx[i]=(i%2?1:-1)*(.22+rnd()*.85)}var o=i*6,al=Math.max(0,1-Math.abs(fz[i])/1.7)*.5;
      fp[o]=fx[i];fp[o+1]=.004;fp[o+2]=fz[i];fp[o+3]=fx[i];fp[o+4]=.004;fp[o+5]=fz[i]+fl[i];fa[i*2]=0;fa[i*2+1]=al}
    gF.attributes.position.needsUpdate=true;gF.attributes.aA.needsUpdate=true;
    sx+=(mx-sx)*Math.min(1,dt*3);sy+=(my-sy)*Math.min(1,dt*3);
    var ang=Math.PI*.5+.4+sx*.34,dist=cam.aspect<1.05?4.3:3.35;cam.position.set(Math.sin(ang)*dist,.62-sy*.22,Math.cos(ang)*dist);cam.lookAt(0,.5,-.02);
    strass.material.size=.015+Math.sin(t*3)*.003;rd.render(scene,cam)}
  function boucle(ts){if(!actif)return;var dt=Math.min(.05,(ts-dernier)/1000||.016);dernier=ts;taille();image(dt);requestAnimationFrame(boucle)}
  function etat(){var go=vuH&&!document.hidden&&!RM;if(go&&!actif){actif=true;dernier=performance.now();requestAnimationFrame(boucle)}else if(!go)actif=false}
  taille();for(i=0;i<40;i++)image(.03);box.classList.add('pret');
  if(RM){t=.31;image(0);addEventListener('resize',function(){taille();image(0)});return}
  if('IntersectionObserver' in window)new IntersectionObserver(function(es){vuH=es[0].isIntersecting;etat()},{rootMargin:'80px'}).observe(box);
  document.addEventListener('visibilitychange',etat);
  cv.addEventListener('webglcontextlost',function(e){e.preventDefault();actif=false;repli()});
  etat()})();
})();
