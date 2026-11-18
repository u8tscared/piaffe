/* Piaffe · landing v3. Rendu des sections répétitives, onglets, chat Piaffe AI, apparitions. */
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

/* ---------- Captures ---------- */
/* c : [x,y,l,h] en pixels de l’écran d’origine ; m : recadrage téléphone */
function cropStyle(c,m,iw){var s='--dx:'+c[0]+';--dy:'+c[1]+';--dw:'+c[2]+';--dh:'+c[3];if(m)s+=';--mx:'+m[0]+';--my:'+m[1]+';--mw:'+m[2]+';--mh:'+m[3];if(iw)s+=';--iw:'+iw;return s}
function img(n,alt,tab){return '<img src="'+SH+n+'.webp" width="'+(tab?1770:2160)+'" height="'+(tab?1230:1350)+'" loading="lazy" alt="'+(alt||'')+'">'}
function tel(n,alt,k){return '<figure class="tel'+(k?' '+k:'')+'"><img src="'+SH+n+'.webp" width="780" height="1688" loading="lazy" alt="'+(alt||'')+'"></figure>'}
function ecran(n,alt,c,m){return '<figure class="nav-frame"><div class="nf-bar"><i></i><i></i><i></i><span>'+I('lock')+'app.piaffe.fr/les-tilleuls</span></div><div class="crop" style="'+cropStyle(c||[0,0,1440,900],m)+'">'+img(n,alt)+'</div></figure>'}

/* ---------- Bento des fonctions ---------- */
var BENTO=[
 ['rd','members','Club','Reprises, cavaliers, familles, concours','#m-planning',7,[['planning','Planning'],['saddle','Montoir'],['members','Adhérents et familles'],['stable','Pensions'],['coach','Coachs'],['trophy','Compétitions'],['shop','Boutique et stages'],['chat','Communication']]],
 ['hz','horse','Écurie','Chaque cheval suivi, chaque box visible','#m-chevaux',5,[['horse','Chevaux'],['care','Soins'],['feed','Alimentation'],['cube','Plan 3D'],['camera','Caméras et capteurs'],['upkeep','Entretien et stocks']]],
 ['mo','euro','Argent','De la facture à la TVA','#m-facturation',5,[['invoice','Facturation'],['doc','Devis'],['accounting','Comptabilité'],['percent','TVA'],['bank','Banque'],['sign','Contrats signés']]],
 ['tm','team','Équipe','Une vraie RH d’écurie','#m-equipe',3,[['team','Planning'],['clockin','Pointage'],['holiday','Congés'],['wallet','Paie']]],
 ['acc','today','Pilotage','Tout voir en un coup d’œil','#espaces',4,[['today','Tableau de bord du matin'],['report','Rapports'],['search','Recherche partout']]],
 ['ia','spark','Piaffe AI','Posez la question, il lit vos chiffres','#ai',7,[['chat','Questions en français'],['checkc','Actions validées par vous'],['sun','Point du matin'],['repeat','Automatisations'],['plug','Dans Claude et ChatGPT']]],
 ['pf','plug','Plateforme','Ouverte et sous contrôle','#connecteurs',5,[['plug','72 connecteurs'],['import','Reprise des données'],['api','API publique'],['wifi','Hors ligne'],['settings','Réglages']]]
];
put($('#bento'),BENTO.map(function(b,i){return '<a class="bt '+(b[0]==='ia'?'ia':'d-'+b[0])+'" href="'+b[4]+'" style="--s:'+b[5]+';--i:'+(i%3)+'" data-r><div class="bt-h"><span class="bt-i">'+I(b[1])+'</span><div><h3>'+b[2]+'</h3><small>'+b[3]+'</small></div><span class="bt-go">'+I('arrow')+'</span></div><div class="pil">'+b[6].map(function(p){return '<span>'+I(p[0])+p[1]+'</span>'}).join('')+'</div></a>'}).join(''));

/* ---------- Quatre espaces ---------- */
var ESP=[
 {id:'gerant',d:'acc',ic:'today',n:'Gérant',ap:'Ordinateur',qui:'Claire Morel, gérante',t:'Toute l’écurie sous les yeux, chaque matin.',p:'Le tableau de bord dit ce qui demande une décision aujourd’hui. Les rapports répondent au reste : chiffre d’affaires, remplissage, rentabilité.',
  l:['Résumé du matin et actions en un geste','Planning, chevaux, adhérents, facturation, équipe','Rapports clairs sur 12 mois','Piaffe AI sur chaque écran'],r:'cockpit',cta:'Ouvrir l’espace gérant dans la démo',
  v:'<div class="esp-v v-g">'+ecran('g-rapports','Rapports du gérant : chiffre d’affaires, résultat, remplissage',null,[290,60,640,470])+tel('p-g-cockpit','Tableau de bord du gérant sur téléphone')+'</div>'},
 {id:'employe',d:'hz',ic:'hay',n:'Employé',ap:'Téléphone et tablette',qui:'Mamadou Diallo, palefrenier soigneur',t:'Sa journée, box après box.',p:'Palefreniers et moniteurs voient quoi faire maintenant, cochent les boxes d’un geste et signalent un souci avec une photo. Même sans réseau.',
  l:['Tournée des boxes, soins et rations du jour','Consignes de la gérante, lues et confirmées','Pointage par appui maintenu','Fonctionne hors ligne, synchronise ensuite'],r:'emp-jour',cta:'Ouvrir l’espace employé dans la démo',
  v:'<div class="esp-v v-e"><figure class="tab"><div class="crop" style="'+cropStyle([0,0,1180,820],[240,56,700,500],1180)+'">'+img('e-jour-tab','Journée de Mamadou sur tablette : urgence Xanthos, tâches, consignes',1)+'</div></figure>'+tel('p-emp-tournee','Tournée des boxes sur téléphone')+'</div>'},
 {id:'adherent',d:'rd',ic:'user',n:'Adhérent',ap:'Téléphone',qui:'Léa Martin, propriétaire d’Ulysse',t:'Le club dans la poche des cavaliers.',p:'Réserver, rattraper un cours, payer, signer. Les propriétaires suivent leur cheval, les parents paient pour toute la famille.',
  l:['Réservations, rattrapages et liste d’attente','Fiche et journal de son cheval','Paiement en ligne, en une ou trois fois','Galops, progression et concours'],r:'adh-accueil',cta:'Ouvrir l’espace adhérent dans la démo',
  v:'<div class="esp-v v-a">'+tel('p-adh-accueil','Accueil de Léa : cours dans 25 minutes')+tel('p-adh-reserver','Réserver une reprise')+tel('p-adh-cheval','Fiche du cheval Ulysse de la Roche')+'</div>'},
 {id:'coach',d:'mo',ic:'coach',n:'Coach',ap:'Ordinateur et téléphone',qui:'Pauline Arnaud, coach CSO indépendante',t:'Un agenda qui se remplit tout seul.',p:'Les coachs indépendants publient leurs disponibilités. Les cavaliers réservent et paient en ligne, l’écurie perçoit sa part automatiquement.',
  l:['Agenda sur plusieurs écuries, trajets compris','Réservation et paiement en ligne','Élèves, notes de séance, progression','Revenus et reversements clairs'],r:'coach-agenda',cta:'Ouvrir l’espace coach dans la démo',
  v:'<div class="esp-v v-c">'+ecran('c-agenda','Agenda de Pauline : 5 cours dans 3 écuries',null,[290,60,640,470])+tel('p-coach-revenus','Revenus de la coach sur téléphone')+'</div>'}
];
put($('#esp'),'<div class="esp-tabs" role="tablist" aria-label="Les quatre espaces"><span class="esp-g"></span>'+ESP.map(function(e,i){return '<button type="button" role="tab" id="et-'+e.id+'" aria-controls="ep-'+e.id+'" aria-selected="'+(i===0)+'" tabindex="'+(i?-1:0)+'" class="d-'+e.d+'"><span class="et-i">'+I(e.ic)+'</span><span><b>'+e.n+'</b><small>'+e.ap+'</small></span></button>'}).join('')+'</div><div class="esp-ps">'+
 ESP.map(function(e,i){return '<div class="esp-p d-'+e.d+(i===0?' on':'')+'" role="tabpanel" id="ep-'+e.id+'" aria-labelledby="et-'+e.id+'"><div><span class="esp-qui">'+I(e.ic)+e.qui+'</span><h3>'+e.t+'</h3><p>'+e.p+'</p><ul class="coches">'+e.l.map(function(x){return '<li>'+I('check')+x+'</li>'}).join('')+'</ul><a class="btn pri" '+demo(e.r)+'>'+e.cta+I('arrow')+'</a></div>'+e.v+'</div>'}).join('')+'</div>');
(function(){var tabs=$$('.esp-tabs button'),ps=$$('.esp-p'),g=$('.esp-g'),cur=0;
  function go(i,focus){if(i===cur)return;var dir=i>cur?1:-1;ps[cur].style.setProperty('--dir',-dir);ps[i].style.setProperty('--dir',dir);
    tabs.forEach(function(t,k){t.setAttribute('aria-selected',k===i);t.tabIndex=k===i?0:-1});
    /* le panneau entrant part du bon côté avant d’être affiché */
    ps[i].getBoundingClientRect();ps.forEach(function(p,k){p.classList.toggle('on',k===i)});
    g.style.transform='translateX(calc('+i+' * (100% + 4px)))';cur=i;if(focus)tabs[i].focus()}
  tabs.forEach(function(t,i){t.addEventListener('click',function(){go(i)});
    t.addEventListener('keydown',function(e){if(e.key==='ArrowRight'){e.preventDefault();go((i+1)%4,1)}else if(e.key==='ArrowLeft'){e.preventDefault();go((i+3)%4,1)}})})})();

/* ---------- Tour des modules ---------- */
/* an : [x, y, côté, libellé, visible au téléphone] dans les pixels de la capture */
var MODS=[
 {id:'planning',d:'rd',ic:'planning',n:'Planning et reprises',h:['Le planning se remplit,','et il ménage vos chevaux.'],
  p:'Reprises, stages, balades et cours particuliers sur toutes vos pistes. Piaffe attribue les chevaux selon le niveau et la charge de chacun, et gère absences, rattrapages et liste d’attente.',
  u:[['Le montoir se compose tout seul','Chaque cavalier reçoit un cheval à son niveau, sans dépasser la charge de la semaine.'],['Rattrapages et liste d’attente','Une place se libère, le premier de la liste est prévenu et réserve en un geste.'],['L’appel sur le téléphone','Le moniteur pointe les présents en carrière, les séances se décomptent seules.']],
  r:'planning',b:'23 reprises et 200 cavaliers cette semaine',shot:'g-planning',alt:'Planning de la semaine du 16 au 22 novembre',c:[288,130,1140,720],m:[296,222,610,500],
  an:[[840,224,'r','Remplissage suivi en direct',1],[528,668,'r','Léa et Ulysse, cours avec Pauline',1]],sup:['tel','p-adh-reserver','Le cavalier réserve depuis son téléphone']},
 {id:'chevaux',d:'hz',ic:'horse',n:'Chevaux et soins',h:['Chaque cheval suivi,','rien n’est oublié.'],
  p:'Une fiche par cheval : identité SIRE, soins, ferrure, vermifuges, travail de la semaine, ration, coûts et journal partagé avec le propriétaire.',
  u:[['Rappels de soins automatiques','Vaccins, vermifuges, maréchal, dentiste : les échéances se regroupent en tournées.'],['Charge de travail surveillée','Piaffe signale les chevaux au-dessus de leur seuil, avant la blessure.'],['Le propriétaire voit tout','Journal, soins et factures de son cheval, depuis son téléphone.']],
  r:'chevaux',b:'44 chevaux et poneys suivis',shot:'g-chevaux',alt:'Liste des chevaux : 44 chevaux et poneys, 8 à surveiller',c:[288,110,1140,640],m:[850,178,570,560],
  an:[[1010,428,'l','Xanthos, à surveiller',1],[1394,224,'l','Charge de travail par cheval',1]],sup:['tel','p-adh-cheval','La fiche d’Ulysse vue par sa propriétaire']},
 {id:'ecurie',d:'tm',ic:'camera',n:'Écurie connectée',h:['L’écurie en direct,','même la nuit.'],
  p:'Caméras de box, abreuvoirs, sondes et silo sont reliés. Piaffe croise les signaux et vous prévient quand quelque chose sort de l’habitude. Le plan 3D montre qui occupe chaque box.',
  u:[['Alerte avant la colique','Xanthos se couche souvent et boit 40 % de moins : l’équipe est prévenue aussitôt.'],['Rations et stocks reliés','44 rations individuelles, 16 jours de foin d’avance, la commande au bon moment.'],['Plan de l’écurie en 3D','Boxes occupés, paddocks, places libres : tout se lit d’un coup d’œil.']],
  r:'cameras',b:'8 caméras et 6 capteurs en ligne',shot:'g-cameras',alt:'Caméras et capteurs : alerte sur Xanthos, box B23',c:[288,236,1140,664],m:[300,250,700,560],
  an:[[345,300,'r','Caméra et abreuvoir, le même signal',1],[838,470,'r','Box B23 en direct',1]],sup:['inset','g-alimentation','Rations du jour : 374 kg de foin',[308,206,566,424]]},
 {id:'adherents',d:'rd',ic:'members',n:'Adhérents, pensions et contrats',h:['Une famille, un payeur,','tous les cavaliers.'],
  p:'Fiches complètes, inscriptions en ligne, licences FFE en lot, pensions et demi-pensions. Les contrats se signent au doigt et se rangent tout seuls.',
  u:[['Inscriptions validées en un geste','Le dossier arrive complet : certificat, autorisation parentale, droit à l’image.'],['Pensions et demi-pensions','25 chevaux en pension, 4 formules, la facture du mois préparée d’avance.'],['Contrats signés sur le téléphone','Le modèle se remplit, la signature a valeur probante, l’archive est gardée 10 ans.']],
  r:'adherents',b:'148 adhérents dans 119 familles',shot:'g-adherents',alt:'Adhérents : 148 cavaliers inscrits, inscriptions à valider, licences FFE',c:[288,176,1140,640],m:[318,400,580,400],
  an:[[1000,510,'l','138 licences prêtes en un lot',0],[700,447,'l','Inscriptions validées en un geste',1]],sup:['tel','p-adh-paiements','Léa règle la pension d’Ulysse depuis son téléphone']},
 {id:'facturation',d:'mo',ic:'invoice',n:'Facturation et comptabilité',h:['Les factures du mois,','en un seul geste.'],
  p:'Forfaits, pensions et prestations se facturent seuls, au bon taux de TVA. Carte, prélèvement SEPA, chèques-vacances, espèces : chaque paiement retrouve sa facture, puis sa ligne de banque.',
  u:[['Facturation préparée par Piaffe','69 factures prêtes pour décembre : vous vérifiez, vous envoyez.'],['Relances automatiques','7 factures en retard, 7 relances prêtes. Le lien de paiement est dans le message.'],['Comptabilité sans double saisie','Banque rapprochée, TVA préparée, export FEC, accès pour votre expert-comptable.']],
  r:'facturation',b:'31 846 € encaissés en novembre',shot:'g-facturation',alt:'Facturation : 69 factures prêtes pour 18 292 €',c:[288,196,1140,640],m:[300,205,600,460],
  an:[[610,368,'r','69 factures, un seul envoi',1],[1040,505,'l','Relances déjà parties',0]],sup:['inset','g-compta','Comptabilité : 3 opérations à rapprocher',[306,516,620,330]]},
 {id:'equipe',d:'tm',ic:'team',n:'Équipe et pointage',h:['Plannings, pointage et paie,','enfin réunis.'],
  p:'Chacun pointe en maintenant le doigt sur son téléphone. Heures supplémentaires, congés, diplômes et convention collective des centres équestres sont suivis. La paie part vers votre logiciel.',
  u:[['Pointage au téléphone','Un appui long, la position est vérifiée. Fini les feuilles à recopier.'],['Échéances suivies','Carte professionnelle, PSC1, fin de CDD : Piaffe prévient et prépare la suite.'],['Export vers la paie','Les heures du mois partent vers PayFit ou Silae, sans ressaisie.']],
  r:'equipe',b:'9 personnes, 262 h 30 planifiées',shot:'g-equipe',alt:'Équipe : 6 salariés sur 9 en poste ce matin, échéances à traiter',c:[288,196,1140,680],m:[300,205,600,440],
  an:[[420,300,'r','6 sur 9 en poste, pointés au téléphone',1],[1170,627,'l','Renouvellement préparé',0]],sup:['tel','p-emp-pointage','Le pointage par appui maintenu']},
 {id:'concours',d:'mo',ic:'trophy',n:'Compétitions et coachs',h:['Qui emmène qui ?','Réglé en glissant.'],
  p:'Engagements préparés pour FFE Compet, horaires de passage, vans et covoiturage. Les cavaliers voient leur heure, les coachs leur programme, l’écurie ses frais à refacturer.',
  u:[['Engagements en un envoi','9 cavaliers engagés à Rambouillet, la clôture est rappelée la veille.'],['Vans et places','Chaque cheval a sa place dans le camion, chaque famille son horaire de départ.'],['Coachs réservables en ligne','Un créneau, un paiement, c’est réservé. L’écurie perçoit sa part.']],
  r:'competitions',b:'5 concours au calendrier',shot:'g-competitions',alt:'Compétitions : CSO Club et Poney à Rambouillet, 9 cavaliers engagés',c:[288,196,1140,680],m:[300,352,610,380],
  an:[[772,594,'r','Prêt pour FFE Compet',1],[575,686,'r','Qui emmène qui',0]],sup:['tel','p-adh-concours','Le cavalier voit son heure de passage']},
 {id:'communication',d:'rd',ic:'chat',n:'Communication',h:['Le bon message,','à la bonne famille.'],
  p:'Une messagerie par famille, des envois groupés par reprise, des annonces et des sondages. Notification, SMS, e-mail ou WhatsApp : vous savez qui a lu.',
  u:[['Un seul fil par famille','Fini les groupes de discussion qui débordent : chaque échange est rangé.'],['Envois groupés ciblés','La reprise de 17 h est annulée ? Seuls les cavaliers concernés sont prévenus.'],['Modèles et automatismes','Rappel de cours, facture échue, licence à renouveler : les messages partent seuls.']],
  r:'communication',b:'71 % d’ouverture ce mois-ci',shot:'g-communication',alt:'Communication : messagerie avec Léa Martin',c:[288,236,1140,664],m:[680,400,640,500],
  an:[[440,470,'r','Chaque famille, un seul fil',0],[1010,828,'r','Appli, SMS, e-mail ou WhatsApp',1]]}
];
put($('#ancIn'),MODS.map(function(m){return '<a href="#m-'+m.id+'" class="d-'+m.d+'" data-m="'+m.id+'">'+I(m.ic)+m.n.replace(/,? (et|pensions) .*/,'').replace('Chevaux','Chevaux et soins').replace('Écurie connectée','Écurie connectée')+'</a>'}).join(''));
put($('#mods'),MODS.map(function(m,i){var n=('0'+(i+1)).slice(-2),k=0,ans=(m.an||[]).map(function(a){k++;return '<div class="an'+(a[4]?'':' md')+'" style="--ax:'+a[0]+';--ay:'+a[1]+'"><i>'+k+'</i></div>'}).join(''),
   leg=(m.an||[]).map(function(a,j){return '<li'+(a[4]?'':' class="md"')+'><i>'+(j+1)+'</i>'+a[3]+'</li>'}).join(''),
   sup=!m.sup?'':m.sup[0]==='tel'?tel(m.sup[1],m.sup[2],'sup'):'<figure class="inset"><div class="crop" style="'+cropStyle(m.sup[3])+'">'+img(m.sup[1],m.sup[2])+'</div></figure>';
  return '<article class="mod d-'+m.d+(i%2?' inv':'')+(m.sup?' avec-'+m.sup[0]:'')+'" id="m-'+m.id+'"><div class="mod-t" data-r><p class="mod-n"><span>'+I(m.ic)+'</span>'+n+' · '+m.n+'</p><h3>'+m.h[0]+' <em>'+m.h[1]+'</em></h3><p>'+m.p+'</p><ul class="puces">'+m.u.map(function(u){return '<li>'+I('check')+'<div><b>'+u[0]+'</b><small>'+u[1]+'</small></div></li>'}).join('')+'</ul><div class="mod-f"><a class="lien" '+demo(m.r)+'>Voir dans la démo'+I('arrow')+'</a><span class="badge"><i></i>'+m.b+'</span></div></div>'+
   '<div class="mod-v"><div class="stage"><div class="shot" style="'+cropStyle(m.c,m.m)+'"><div class="crop">'+img(m.shot,m.alt)+'</div>'+ans+'</div>'+sup+'</div><ul class="legendes">'+leg+'</ul></div></article>'}).join(''));

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
var MATIN=[['cr','heart','Attention','Tornado boite','Le Dr Leclerc passe à 14 h, Lucie le prépare à 13 h 45.'],['mo','alert','À surveiller','Xanthos boit 40 % de moins','Depuis hier soir, au box B23. Mamadou le surveille toutes les deux heures.'],['hz','trend','Opportunité','7 relances sont prêtes','2 073 € à encaisser. Un geste suffit pour les envoyer.'],['tm','rain','Prévision','Pluie jeudi et vendredi','2 reprises en carrière peuvent passer au grand manège.']];
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

/* ---------- Apparitions, ancres actives, profondeur ---------- */
(function(){var els=$$('[data-r],.mod,.collage');
  if(!('IntersectionObserver' in window)){els.forEach(function(e){e.classList.add('in')});return}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
  els.forEach(function(e){io.observe(e)});
  var liens=$$('#ancIn a'),box=$('#ancIn');
  var io2=new IntersectionObserver(function(es){es.forEach(function(e){if(!e.isIntersecting)return;var id=e.target.id.slice(2);liens.forEach(function(a){var on=a.dataset.m===id;a.classList.toggle('on',on);
    if(on&&box.scrollWidth>box.clientWidth)box.scrollTo({left:a.offsetLeft-box.clientWidth/2+a.offsetWidth/2,behavior:RM?'auto':'smooth'})})})},{rootMargin:'-45% 0px -50% 0px'});
  $$('.mod').forEach(function(m){io2.observe(m)})})();
(function(){var nav=$('#nav'),col=$('.col-tilt'),shots=$$('.stage>.tel,.stage>.inset'),tick=false;
  function maj(){tick=false;var y=scrollY,H=innerHeight;nav.classList.toggle('sc',y>40);if(RM)return;
    var r=col.getBoundingClientRect();col.style.setProperty('--p',Math.max(0,Math.min(1,1-(r.top-H*.28)/(H*.6))).toFixed(3));
    shots.forEach(function(s){var b=s.parentNode.getBoundingClientRect();if(b.bottom<-80||b.top>H+80)return;var k=(b.top+b.height/2-H/2)/H;s.style.setProperty('--py',(k*-34).toFixed(1))})}
  addEventListener('scroll',function(){if(!tick){tick=true;requestAnimationFrame(maj)}},{passive:true});addEventListener('resize',maj);maj()})();
})();
