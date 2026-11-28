/* Stabl · page d’accueil v5. Onglets des fonctionnalités, espaces, chat Stabl AI, tarifs, FAQ, formulaire de rappel, apparitions. */
(function(){
'use strict';
var D=document,R=D.documentElement,$=function(s,c){return (c||D).querySelector(s)},$$=function(s,c){return [].slice.call((c||D).querySelectorAll(s))};
var RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
var I=function(n){return window.ICON(n)};
var SH='shots/';
var BASE=$('.pg').getAttribute('data-demo'),APP=$('.pg').getAttribute('data-app');
var MAIL='contact@stablapp.fr';
function demo(r){return 'href="'+BASE+'#'+r+'" target="_blank" rel="noopener"'}
/* espaces insécables, comme le build */
function nb(h){return ('>'+h+'<').replace(/>([^<]+)</g,function(m,t){return '>'+t.replace(/(\d) (\d{3})(?!\d)/g,'$1\u202f$2').replace(/ ([:;?!%€»])/g,' $1').replace(/« /g,'« ')+'<'}).slice(1,-1)}
function put(el,h){el.innerHTML=nb(h)}
function fr(n){return n.toLocaleString('fr-FR')}
R.classList.add('js');

/* ---------- Thème ---------- */
(function(){var b=$('#theme'),t=null;try{t=localStorage.getItem('stabl:site:theme')}catch(e){}
  function sombre(){return R.getAttribute('data-theme')?R.getAttribute('data-theme')==='dark':matchMedia('(prefers-color-scheme:dark)').matches}
  function lab(){b.setAttribute('aria-label',sombre()?'Passer en thème clair':'Passer en thème sombre')}
  if(t==='dark'||t==='light')R.setAttribute('data-theme',t);lab();
  b.addEventListener('click',function(){var n=sombre()?'light':'dark';R.setAttribute('data-theme',n);try{localStorage.setItem('stabl:site:theme',n)}catch(e){}lab()})})();

/* ---------- Menu ---------- */
(function(){var n=$('#nav'),b=$('#burger');
  function ferme(){n.classList.remove('ouvert');b.setAttribute('aria-expanded','false');b.setAttribute('aria-label','Ouvrir le menu')}
  b.addEventListener('click',function(){var o=n.classList.toggle('ouvert');b.setAttribute('aria-expanded',o);b.setAttribute('aria-label',o?'Fermer le menu':'Ouvrir le menu')});
  $$('#navL a').forEach(function(a){a.addEventListener('click',ferme)});
  D.addEventListener('keydown',function(e){if(e.key==='Escape')ferme()});
  addEventListener('scroll',function(){n.classList.toggle('sc',scrollY>20)},{passive:true})})();

/* ---------- iPhone ---------- */
var IOS='<svg viewBox="0 0 78 13" aria-hidden="true"><rect x="0" y="8" width="3.2" height="4.6" rx=".9"/><rect x="4.9" y="5.6" width="3.2" height="7" rx=".9"/><rect x="9.8" y="3" width="3.2" height="9.6" rx=".9"/><rect x="14.7" y=".4" width="3.2" height="12.2" rx=".9"/><g fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M24.4 4.7a11.2 11.2 0 0 1 15.6 0"/><path d="M27.4 7.7a7 7 0 0 1 9.6 0"/></g><circle cx="32.2" cy="10.8" r="1.6"/><rect x="48.5" y=".9" width="24.5" height="11.6" rx="3.6" fill="none" stroke="currentColor" stroke-opacity=".4"/><rect x="50.2" y="2.6" width="21.1" height="8.2" rx="2.2"/><path d="M74.6 4.8v3.8c.8-.3 1.4-1 1.4-1.9s-.6-1.6-1.4-1.9z" opacity=".45"/></svg>';
function tel(n,alt,o){o=o||{};var lz=o.vite?'':' loading="lazy"',ims;
  if(o.duo)ims='<img class="only-l" src="'+SH+n+'.webp" width="786" height="1704" alt="'+(alt||'')+'"'+lz+'><img class="only-d" src="'+SH+n+'-dark.webp" width="786" height="1704" alt="" loading="lazy">';
  else ims='<img src="'+SH+n+'.webp" width="786" height="1704" alt="'+(alt||'')+'"'+lz+'>';
  return '<figure class="ip'+(o.duo?' duo':'')+(o.k?' '+o.k:'')+'"><i class="ip-b b1"></i><i class="ip-b b2"></i><i class="ip-b b3"></i><i class="ip-b b4"></i><div class="ip-c"><div class="ip-f"><div class="ip-s">'+ims+'<div class="ip-st"><span>9:41</span>'+IOS+'</div><i class="ip-di"></i><i class="ip-h"></i><i class="ip-gl"></i></div></div></div></figure>'}
$$('[data-ip]').forEach(function(e){e.outerHTML=tel(e.dataset.ip,e.dataset.alt,{duo:e.dataset.duo,vite:e.dataset.vite,k:e.dataset.k})});
function barre(){return '<div class="nf-bar"><i></i><i></i><i></i><span>'+I('lock')+'app.stablapp.fr</span></div>'}

/* ---------- Ce que fait Stabl : six blocs, on voit où l’on est en défilant ---------- */
/* f : ce que chaque formule apporte dans ce bloc ; v : capture ordinateur ; t : téléphone par-dessus (facultatif) */
var MODS=[
 {id:'planning',d:'rd',ic:'planning',n:'Planning',s:'Reprises, stages, réservations',h:['Le planning se remplit,','et il ménage vos chevaux.'],
  p:'Reprises, stages, balades et cours particuliers sur toutes vos pistes. Les cavaliers réservent et rattrapent leurs cours depuis leur téléphone.',
  u:[['Réservation en ligne','les cavaliers s’inscrivent, annulent et rattrapent seuls.'],['Montoir composé seul','chaque cavalier a un cheval à son niveau, sans surcharger personne.'],['Liste d’attente','une place se libère, le suivant est prévenu.'],['Agendas synchronisés','Google, Apple ou Outlook, pour chacun.']],
  f:[['Essentiel','planning, réservations, agendas'],['Club','montoir automatique, liste d’attente']],
  r:'planning',v:'g-planning',t:'p-adh-reserver',alt:'Planning de la semaine : reprises, cavaliers, taux de remplissage'},
 {id:'chevaux',d:'hz',ic:'horse',n:'Chevaux et soins',s:'Fiches, soins, véto, maréchal',h:['Chaque cheval suivi,','rien n’est oublié.'],
  p:'Une fiche par cheval : identité SIRE, soins, ferrure, travail de la semaine, ration et coûts. Le vétérinaire et le maréchal ont leur propre espace.',
  u:[['Fiche complète en un numéro','le SIRE remplit la race, la robe et les origines.'],['Rappels de soins','vaccins, vermifuges, maréchal, dentiste.'],['Charge de travail surveillée','Stabl signale les chevaux au-dessus de leur plafond.'],['Le propriétaire voit tout','journal, soins et factures de son cheval.']],
  f:[['Essentiel','fiches chevaux'],['Club','soins, rappels, véto et maréchal'],['Domaine','élevage, vente, caméras']],
  r:'chevaux',v:'g-chevaux',t:'p-emp-soins',alt:'Chevaux : liste des chevaux, chevaux à surveiller, coût moyen par cheval'},
 {id:'adherents',d:'acc',ic:'members',n:'Adhérents',s:'Familles, pensions, contrats',h:['Une famille, un payeur,','tous les cavaliers.'],
  p:'Fiches complètes, inscriptions en ligne, licences FFE en lot, pensions et demi-pensions. Chaque cavalier a son espace sur téléphone.',
  u:[['Inscriptions en ligne','certificat et autorisations déjà joints.'],['Licences FFE en lot','toutes les licences de la saison en un envoi.'],['Pensions et demi-pensions','le contrat, le cheval et la facture reliés.'],['Contrats signés sur téléphone','modèle rempli, signature, archive.']],
  f:[['Essentiel','fiches, familles, espace cavalier'],['Club','pensions, contrats, coachs et concours']],
  r:'adherents',v:'g-adherents',t:'p-adh-accueil',alt:'Adhérents : cavaliers, inscriptions à valider, licences FFE'},
 {id:'facturation',d:'mo',ic:'invoice',n:'Facturation',s:'Factures, paiements, relances',h:['Les factures du mois,','en un seul geste.'],
  p:'Forfaits, pensions et prestations se facturent seuls, au bon taux de TVA. Carte, prélèvement, chèques-vacances : chaque paiement retrouve sa facture.',
  u:[['Facture électronique prête','obligatoire pour les clubs en septembre 2027.'],['Prélèvement automatique','les pensions passent chaque mois, sans relance.'],['Relances en un clic','le lien de paiement est dans le message.'],['Comptabilité sans ressaisie','banque rapprochée, TVA, export FEC.']],
  f:[['Essentiel','factures, facture électronique, carte'],['Club','prélèvement, relances, compta'],['Domaine','comptes séparés par activité']],
  r:'facturation',v:'g-facturation',t:'p-adh-paiements',alt:'Facturation : factures prêtes, encaissements du mois'},
 {id:'equipe',d:'tm',ic:'team',n:'Équipe',s:'Pointage, tournée, congés',h:['Plannings, pointage et paie,','enfin réunis.'],
  p:'Chaque salarié a sa journée sur son téléphone : la tournée des boxes, les soins, les consignes. Même sans réseau au fond de l’écurie.',
  u:[['Pointage au téléphone','fini les feuilles à recopier.'],['Tournée et soins','box après box, coché sur place.'],['Échéances suivies','diplômes, PSC1, fin de CDD.'],['Export vers la paie','PayFit ou Silae, sans ressaisie.']],
  f:[['Club','appli équipe complète'],['Domaine','rôles et droits sur mesure']],
  r:'equipe',v:'g-equipe',t:'p-emp-pointage',alt:'Équipe : salariés en poste, échéances à traiter'},
 {id:'outils',d:'cr',ic:'plug',n:'Vos outils reliés',s:'Reprise, banque, compta, paie',h:['Vos anciens outils,','reliés ou repris.'],
  p:'Vous quittez votre ancien logiciel sans rien ressaisir, et Stabl se branche sur ce que vous gardez : banque, comptable, paie, agendas, FFE.',
  u:[['Reprise de l’ancien logiciel','Kavalog, Equimondo, Excel : le robot copie tout.'],['Banque et comptable reliés','Qonto, Pennylane, Tiime, export FEC.'],['Paie et signature','PayFit, Silae, Yousign.'],['Stabl dans Claude et ChatGPT','avec vos droits, pas plus.']],
  f:[['Essentiel','import Excel, agendas'],['Club','reprise faite avec vous, banque, compta, paie'],['Domaine','API, Claude et ChatGPT']],
  r:'connecteurs',v:'g-connecteurs',alt:'Connecteurs : banque, comptabilité, paie, agendas, FFE'}
];
(function(){var rail=$('#recRail'),ch=$('#recCh');if(!rail)return;
  put(rail,'<p class="rr-t">Les six blocs</p><ol>'+MODS.map(function(m,i){return '<li><a class="d-'+m.d+'" href="#b-'+m.id+'" data-i="'+i+'"><span class="rr-n">'+(i+1)+'</span><span class="rr-i">'+I(m.ic)+'</span><span class="rr-x"><b>'+m.n+'</b><small>'+m.s+'</small></span><i class="rr-p"></i></a></li>'}).join('')+'</ol><a class="rr-cta lien" '+demo('cockpit')+'>Tout voir dans la démo'+I('arrow')+'</a>');
  put(ch,MODS.map(function(m,i){return '<article class="rc d-'+m.d+'" id="b-'+m.id+'" data-i="'+i+'" aria-labelledby="bt-'+m.id+'">'+
    '<div class="rc-t"><p class="rc-k"><span class="rc-n">'+(i+1)+' / 6</span>'+I(m.ic)+m.n+'</p><h3 id="bt-'+m.id+'">'+m.h[0]+' <em>'+m.h[1]+'</em></h3><p class="rc-p">'+m.p+'</p>'+
    '<ul>'+m.u.map(function(u){return '<li>'+I('check')+'<span><b>'+u[0]+'</b> : '+u[1]+'</span></li>'}).join('')+'</ul>'+
    '<dl class="rc-f">'+m.f.map(function(f){return '<div><dt>'+f[0]+'</dt><dd>'+f[1]+'</dd></div>'}).join('')+'</dl>'+
    '<a class="lien" '+demo(m.r)+'>Voir dans la démo'+I('arrow')+'</a></div>'+
    '<div class="rc-v"><figure class="nav-frame">'+barre()+'<div class="crop" style="--dx:240;--dy:0;--dw:1200;--dh:780"><img src="'+SH+m.v+'.webp" width="2160" height="1350" loading="lazy" alt="'+m.alt+'"></div></figure>'+(m.t?tel(m.t,'',{k:'rc-ip'}):'')+'</div></article>'}).join(''));
  var as=$$('a[data-i]',rail),arts=$$('.rc',ch),cur=-1,sec=$('#fonctions');
  function set(i){if(i===cur)return;cur=i;as.forEach(function(a,k){a.classList.toggle('on',k===i);a.classList.toggle('vu',k<i);if(k===i)a.setAttribute('aria-current','step');else a.removeAttribute('aria-current')});
    sec.className='sec d-'+MODS[i].d+' rec-on';
    /* au téléphone, la barre suit le bloc en cours */
    var a=as[i],ol=a.closest('ol');if(ol&&ol.scrollWidth>ol.clientWidth+4){ol.scrollTo({left:a.parentNode.offsetLeft-16,behavior:RM?'auto':'smooth'})}}
  /* progression dans le bloc en cours */
  var raf=0;function suivi(){raf=0;var mid=innerHeight*.45,best=0;arts.forEach(function(a,k){var r=a.getBoundingClientRect();if(r.top<=mid)best=k});
    set(best);var r=arts[best].getBoundingClientRect(),pr=Math.max(0,Math.min(1,(mid-r.top)/Math.max(1,r.height)));as[best].style.setProperty('--pr',pr.toFixed(3));
    var rs=sec.getBoundingClientRect();sec.classList.toggle('rec-in',rs.top<innerHeight*.5&&rs.bottom>innerHeight*.5)}
  addEventListener('scroll',function(){if(!raf)raf=requestAnimationFrame(suivi)},{passive:true});addEventListener('resize',suivi);suivi();
  as.forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();var t=arts[+a.dataset.i],y=t.getBoundingClientRect().top+scrollY-(innerWidth<=1100?140:110);
    scrollTo({top:y,behavior:RM?'auto':'smooth'});history.replaceState(null,'','#b-'+MODS[+a.dataset.i].id)})})})();

/* ---------- Un espace pour chacun ---------- */
/* v : écran sur ordinateur (ou tablette), t : écran sur téléphone ; les deux montrent les mêmes données */
var ESP=[
 {id:'gerant',d:'acc',ic:'today',n:'Gérant',ap:'Ordinateur et téléphone',t:'Toute l’écurie sous les yeux.',p:'Le matin, un écran dit ce qui demande une décision : chevaux à surveiller, impayés, cours à compléter. Le reste se règle en un geste.',
  u:['Tableau de bord du jour','Factures, relances, rapports','Réglages, rôles et droits'],r:'cockpit',v:'g-cockpit',tl:'p-g-cockpit'},
 {id:'employe',d:'hz',ic:'hay',n:'Employé',ap:'Téléphone et tablette',t:'Sa journée, box après box.',p:'La tournée, les soins à faire et les consignes du jour. Il coche sur place, même sans réseau au fond de l’écurie, et pointe ses heures.',
  u:['Tournée des boxes et soins','Pointage et congés','Signalement d’un souci en photo'],r:'emp-jour',v:'e-tournee-tab',tab:1,tl:'p-emp-tournee'},
 {id:'adherent',d:'rd',ic:'user',n:'Cavalier et famille',ap:'Téléphone',t:'Le club dans la poche.',p:'Réserver, rattraper un cours, payer, signer un contrat, suivre sa progression et son cheval. Un parent gère toute la famille. Rien à installer : un lien suffit.',
  u:['Réservation et rattrapages','Paiement et factures','Progression et concours'],r:'adh-accueil',tl:'p-adh-reserver',tl2:'p-adh-progression'},
 {id:'coach',d:'mo',ic:'coach',n:'Coach',ap:'Ordinateur et téléphone',t:'Un agenda qui se remplit seul.',p:'Les cavaliers réservent et paient en ligne, l’écurie perçoit sa part. Le coach suit ses élèves et ses concours, et voit ses revenus du mois.',
  u:['Agenda et disponibilités','Élèves et engagements en concours','Revenus et part de l’écurie'],r:'coach-agenda',v:'c-agenda',tl:'p-coach-agenda'},
 {id:'pro',d:'cr',ic:'care',n:'Véto et maréchal',ap:'Téléphone et ordinateur',t:'Sa tournée sur tous ses clubs.',p:'Les demandes de visite arrivent avec le cheval et le box. L’acte saisi part au carnet du cheval et au propriétaire, avec la facture à son nom.',
  u:['Demandes de visite','Actes reliés au carnet de santé','Factures et certificats'],r:'pro-jour',v:'g-pro-jour',tl:'p-pro-jour'}];
(function(){var el=$('#esp');if(!el)return;
  function vue(e){var dsk=e.v?(e.tab?'<figure class="tab es-d"><div class="tab-c"><div class="crop" style="--dx:0;--dy:0;--dw:1180;--dh:820"><img src="'+SH+e.v+'.webp" width="1770" height="1230" loading="lazy" alt="Espace '+e.n.toLowerCase()+' sur tablette" style="--iw:1180"></div></div></figure>':
      '<figure class="nav-frame es-d">'+barre()+'<div class="crop" style="--dx:0;--dy:0;--dw:1440;--dh:860"><img src="'+SH+e.v+'.webp" width="2160" height="1350" loading="lazy" alt="Espace '+e.n.toLowerCase()+' sur ordinateur"></div></figure>'):'';
    return '<div class="es-scene'+(e.v?'':' solo')+'">'+dsk+tel(e.tl,'Espace '+e.n.toLowerCase()+' sur téléphone',{k:'es-ip'})+(e.tl2?tel(e.tl2,'',{k:'es-ip es-ip2'}):'')+'</div>'}
  put(el,'<div class="es-tabs" role="tablist" aria-label="Espaces">'+ESP.map(function(e,i){return '<button type="button" role="tab" class="d-'+e.d+'" id="et-'+e.id+'" aria-controls="ep-'+e.id+'" aria-selected="'+(i===0)+'" tabindex="'+(i?-1:0)+'"><span class="es-ti">'+I(e.ic)+'</span><span><b>'+e.n+'</b><small>'+e.ap+'</small></span></button>'}).join('')+'</div>'+
    ESP.map(function(e,i){return '<div class="es-p d-'+e.d+'" role="tabpanel" id="ep-'+e.id+'" aria-labelledby="et-'+e.id+'"'+(i?' hidden':'')+'><div class="es-t"><p class="es-k">'+I(e.ic)+e.n+' · '+e.ap+'</p><h3>'+e.t+'</h3><p>'+e.p+'</p><ul>'+e.u.map(function(u){return '<li>'+I('check')+u+'</li>'}).join('')+'</ul><a class="lien" '+demo(e.r)+'>Ouvrir l’espace dans la démo'+I('arrow')+'</a></div>'+vue(e)+'</div>'}).join('')+
    '<p class="es-same">'+I('refresh')+'<span><b>Les mêmes données partout.</b> Le soin coché par l’employé apparaît chez le gérant et chez le propriétaire. Le cours réservé par un cavalier remplit l’agenda du coach.</span></p>');
  var tabs=$$('.es-tabs button',el),ps=$$('.es-p',el);
  function set(i,f){tabs.forEach(function(b,k){b.setAttribute('aria-selected',k===i);b.tabIndex=k===i?0:-1});ps.forEach(function(p,k){p.hidden=k!==i;if(k===i){p.classList.remove('entre');void p.offsetWidth;p.classList.add('entre')}});if(f)tabs[i].focus()}
  tabs.forEach(function(b,i){b.addEventListener('click',function(){set(i)});b.addEventListener('keydown',function(e){var n=tabs.length;if(e.key==='ArrowRight'){e.preventDefault();set((i+1)%n,1)}else if(e.key==='ArrowLeft'){e.preventDefault();set((i+n-1)%n,1)}})})})();

/* ---------- Stabl AI : questions et réponses, chiffres de la démo ---------- */
function tb(h,rows,plus){return '<div class="b-carte"><table><thead><tr>'+h.map(function(x){return '<th>'+x+'</th>'}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+r.map(function(x){return '<td>'+x+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table>'+(plus?'<div class="plus">'+plus+'</div>':'')+'</div>'}
function bar(v,max){return '<span class="bar'+(v>max*.85?' h':'')+'"><i style="width:'+Math.min(100,Math.round(v/max*100))+'%"></i></span>'}
var QA=[
 {q:'Qui n’a pas payé ce mois-ci ?',ic:'invoice',d:'mo',re:/pay|impay|relan|retard|doit/i,lu:'Facturation</b> et <b>Adhérents',
  t:'<b>7 familles vous doivent 2 073 €</b>, sur 7 factures en retard. La plus ancienne a 57 jours.',
  c:tb(['Payeur','Retard','Dû'],[['Chloé Roux','26 j','640 €'],['Juliette Bertrand','27 j','390 €'],['Léa Martin','2 j','520 €']],'et 4 autres familles pour 523 €'),
  a:{t:'Relancer 7 familles pour 2 073 €',r:[['Canal','E-mail, puis SMS'],['Paiement','Lien carte ou SEPA dans le message']],ok:'7 relances envoyées'}},
 {q:'Quels chevaux ont trop travaillé ?',ic:'gauge',d:'hz',re:/travaill|charge|fatigu|cheva/i,lu:'Planning</b> et <b>Chevaux',
  t:'<b>2 chevaux de club dépassent leur plafond de la semaine.</b> Hermès est le plus sollicité : 14 h pour un plafond de 12 h.',
  c:tb(['Cheval','Semaine','Plafond'],[['Hermès',bar(14,12)+'14 h','12 h'],['Sirius du Moulin',bar(16,16)+'16 h','16 h'],['Jazz',bar(4,16)+'4 h','16 h']]),
  a:{t:'Rééquilibrer le montoir jusqu’à dimanche',r:[['Allégés','Hermès, Sirius'],['À la place','Jazz, Lune d’Or']],ok:'Montoir rééquilibré, moniteurs prévenus'}},
 {q:'Remplis les places libres de samedi',ic:'planning',d:'rd',re:/place|samedi|rempli|complet|attente/i,lu:'Planning',
  t:'Samedi, il reste <b>9 places sur 54</b>, sur 4 reprises. 5 cavaliers attendent une place : je peux leur proposer les créneaux libres.',
  c:tb(['Reprise','Inscrits','Libres'],[['10 h · Galop 3-4','7/10','3'],['11 h · Baby poney','6/8','2'],['14 h · Galop 5-6','5/8','3'],['15 h · Galop 2','9/10','1']]),
  a:{t:'Proposer 9 places aux listes d’attente',r:[['Règle','Premier arrivé, place tenue 2 h'],['Canal','Notification, puis SMS']],ok:'Places proposées à 5 cavaliers'}},
 {q:'Prépare les factures de pension',ic:'euro',d:'tm',re:/factur|pension|brouillon/i,lu:'Pensions</b> et <b>Facturation',
  t:'J’ai préparé <b>25 factures de pension pour décembre</b>, pour <b>13 000 € TTC</b>. Elles sont en brouillon : rien n’est envoyé.',
  c:tb(['Cheval','Payeur','Montant'],[['Ulysse de la Roche','Léa Martin','520 €'],['Uranus','Aurélie André','520 €'],['Xanthos','Hélène Bernard','520 €']],'et 22 autres factures'),
  a:{t:'Émettre 25 factures pour 13 000 €',r:[['Échéance','5 décembre, prélèvement SEPA'],['Envoi','Par e-mail, lien de paiement compris']],ok:'25 factures émises et envoyées'}}
];
put($('#aiQs'),QA.map(function(x,i){return '<button type="button" data-q="'+i+'" aria-pressed="false"><span class="d-'+x.d+'">'+I(x.ic)+'</span>'+x.q+'</button>'}).join(''));
(function(){var fil=$('#chatFil'),btns=$$('#aiQs button'),tok=0,joue=false;
  function w(ms,t){return new Promise(function(res,rej){setTimeout(function(){t===tok?res():rej()},RM?0:ms)})}
  function add(h){var d=D.createElement('div');d.innerHTML=nb(h);var e=d.firstChild;if(!RM)e.classList.add('pop');fil.appendChild(e);bas();return e}
  function bas(){var l=fil.lastElementChild,max=fil.scrollHeight-fil.clientHeight,t=l?Math.min(max,l.offsetTop-12):max;if(t>fil.scrollTop)fil.scrollTo({top:t,behavior:RM?'auto':'smooth'})}
  function mots(el,html){var out='',gras=false;nb(html).split(/(<\/?b>)/).forEach(function(p){if(p==='<b>'){gras=true;return}if(p==='</b>'){gras=false;return}
      p.split(/( )/).forEach(function(m){if(m===' '){out+=' ';return}if(m)out+='<span class="mot">'+(gras?'<b>'+m+'</b>':m)+'</span>'})});
    el.innerHTML=out;return $$('.mot',el)}
  var BTS='<div class="bts"><button type="button" class="btn pri sm" data-v>Valider</button><button type="button" class="btn sec sm" data-m>Modifier</button></div>';
  function carte(a){var c=add('<div class="b-act"><h4>'+I('checkc')+a.t+'</h4><p class="dt">'+a.r.map(function(r){return r[1]}).join(' · ')+'</p>'+BTS+'</div>');
    function attente(){$('[data-v]',c).addEventListener('click',function(){c.classList.add('fait');$('.bts',c).outerHTML=nb('<div class="b-fait"><span>'+a.ok+'. Noté au journal.</span><button type="button" data-u>Annuler</button></div>');var n=$('.note',c);if(n)n.remove();
        $('[data-u]',c).addEventListener('click',function(){c.classList.remove('fait');$('.b-fait',c).outerHTML=BTS;attente()});bas()});
      $('[data-m]',c).addEventListener('click',function(){if($('.note',c))return;c.insertAdjacentHTML('beforeend',nb('<p class="note">Dans Stabl, vous modifiez le message, les destinataires ou le canal avant de valider.</p>'));bas()})}
    attente()}
  function poser(i,texte){var x=QA[i],t=++tok;btns.forEach(function(b,k){b.setAttribute('aria-pressed',k===i)});fil.innerHTML='';
    (async function(){var q=add('<div class="b-moi"></div>');q.textContent=texte||x.q;q.innerHTML=nb(q.innerHTML);await w(400,t);
      var o=add('<div class="b-outil"><span class="rond"></span><span>Stabl AI lit vos données…</span></div>');await w(800,t);
      o.innerHTML=nb(I('check')+'<span>A lu <b>'+x.lu+'</b></span>');await w(200,t);
      var p=add('<div class="b-ia"></div>'),ms=mots(p,x.t);for(var k=0;k<ms.length;k++){ms[k].classList.add('v');if(!RM&&k%2)await w(30,t)}
      await w(200,t);add(x.c);await w(400,t);carte(x.a)})().catch(function(){})}
  function inconnu(texte){var t=++tok;btns.forEach(function(b){b.setAttribute('aria-pressed','false')});fil.innerHTML='';
    (async function(){add('<div class="b-moi"></div>').textContent=texte;await w(450,t);add('<div class="b-ia">Ici, je réponds aux quatre questions d’exemple. Dans la démo, je réponds à tout : impayés, soins, planning, stocks, contrats.</div>');
      add('<div class="bts"><a class="btn pri sm" '+demo('assistant')+'>Poser cette question dans la démo'+I('arrow')+'</a></div>')})().catch(function(){})}
  btns.forEach(function(b,i){b.addEventListener('click',function(){joue=true;poser(i)})});
  $('#chatF').addEventListener('submit',function(e){e.preventDefault();var inp=$('#chatIn'),v=inp.value.trim();if(!v)return;inp.value='';joue=true;
    for(var i=0;i<QA.length;i++){if(QA[i].re.test(v)){poser(i,v);return}}inconnu(v)});
  if('IntersectionObserver' in window){new IntersectionObserver(function(es,o){if(es[0].isIntersecting){o.disconnect();if(!joue)poser(0)}},{threshold:.35}).observe($('#chat'))}else poser(0)})();

/* ---------- Tarifs : trois cartes, puis le détail complet de chaque formule ---------- */
/* Même grille que app/api/src/billing/plans.ts (prix HT par mois, annuel = 10 mois). */
var OFFRES=[
 {n:'Essentiel',p:59,pour:'Pour démarrer',qui:'Petite écurie ou poney-club, jusqu’à 25 chevaux, géré à deux.',
  base:'L’essentiel pour tenir le club',l:['25 chevaux, 2 comptes','Planning et réservation en ligne','Fiches chevaux et adhérents','Factures, facture électronique et paiement par carte','Espace cavalier sur téléphone']},
 {n:'Club',p:149,v:1,pour:'Le centre équestre complet',qui:'Centre équestre avec enseignement, pensions et une équipe.',
  base:'Tout Essentiel, sans limite, et en plus',l:['Chevaux et équipe illimités','Pensions et demi-pensions facturées seules','Prélèvement automatique et relances','Soins, véto et maréchal','Appli équipe : pointage, tournée, congés','Stabl AI, site du club, compta','Reprise de vos données faite avec vous']},
 {n:'Domaine',p:289,pour:'Grandes structures',qui:'Plus de 60 chevaux, plusieurs activités (club, pension, élevage, commerce) ou une annexe.',
  base:'Tout Club, et en plus',l:['Jusqu’à 3 sites ou activités, comptes séparés','Élevage et vente de chevaux','8 caméras d’écurie incluses','Rapports par activité et budget','Rôles et droits sur mesure','API, Claude et ChatGPT','Interlocuteur dédié, formation sur place']}];
/* détail : [libellé, Essentiel, Club, Domaine] ; 1 = inclus, 0 = non, texte = valeur */
var DETAIL=[
 ['Votre écurie',null,[['Chevaux','25','Illimités','Illimités'],['Comptes pour l’équipe','2','Illimités','Illimités'],['Cavaliers et familles','Illimités','Illimités','Illimités'],['Sites ou activités séparées','1','1','Jusqu’à 3']]],
 ['Planning','planning',[['Reprises, stages, balades, cours particuliers',1,1,1],['Réservation et annulation en ligne par les cavaliers',1,1,1],['Agendas synchronisés (Google, Apple, Outlook)',1,1,1],['Montoir composé automatiquement',0,1,1],['Rattrapages et liste d’attente',0,1,1]]],
 ['Chevaux et soins','horse',[['Fiches chevaux avec numéro SIRE',1,1,1],['Soins, ferrure, vermifuges, vaccins, avec rappels',0,1,1],['Espace vétérinaire et maréchal',0,1,1],['Charge de travail et alimentation',0,1,1],['Certificat d’engagement et de connaissance',0,1,1],['Élevage et vente de chevaux',0,0,1],['Caméras d’écurie','En option','En option','8 incluses']]],
 ['Adhérents','members',[['Fiches cavaliers et familles, un payeur par famille',1,1,1],['Espace cavalier sur téléphone',1,1,1],['Inscriptions en ligne et licences FFE en lot',1,1,1],['Pensions et demi-pensions',0,1,1],['Contrats signés en ligne',0,1,1],['Espace coach et concours',0,1,1],['Messagerie, SMS, e-mails et sondages',0,1,1],['Organisation de concours avec bénévoles',0,0,1]]],
 ['Facturation','invoice',[['Factures et facture électronique (obligatoire en 2027)',1,1,1],['Paiement en ligne par carte',1,1,1],['Facturation automatique des pensions et forfaits',0,1,1],['Prélèvement SEPA automatique',0,1,1],['Relance des impayés',0,1,1],['Accès comptable, TVA et export FEC',0,1,1],['Boutique et site internet du club',0,1,1],['Comptes et factures séparés par activité',0,0,1],['Rapports par activité et budget',0,0,1]]],
 ['Équipe','team',[['Appli équipe : tournée, soins, consignes',0,1,1],['Pointage, plannings et congés',0,1,1],['Échéances des diplômes et export vers la paie',0,1,1],['Rôles et droits sur mesure',0,0,1]]],
 ['Outils et accompagnement','plug',[['Import de vos fichiers Excel ou CSV',1,1,1],['Reprise de l’ancien logiciel, faite avec vous',0,1,1],['Stabl AI, l’assistant de l’écurie',0,1,1],['Banque, comptable et paie reliés',0,1,1],['API, Claude et ChatGPT',0,0,1],['Aide','Par e-mail','Par téléphone','Interlocuteur dédié'],['Formation de l’équipe sur place',0,0,1]]]];
function virg(n){return n.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})}
function offres(an){put($('#offres'),OFFRES.map(function(o,i){return '<article class="of'+(o.v?' vedette':'')+'" data-r style="--i:'+i+'">'+(o.v?'<span class="of-tag">La plus choisie</span>':'')+
    '<p class="of-pour">'+o.pour+'</p><h3>'+o.n+'</h3><p class="of-p">'+o.qui+'</p><div class="of-prix"><b>'+fr(an?o.p*10:o.p)+'</b><span class="of-u">€ HT<br>'+(an?'par an':'par mois')+'</span></div><p class="of-an">'+(an?'Soit '+virg(o.p*10/12)+' € HT par mois, 2 mois offerts':'Sans engagement, résiliable en un clic')+'</p>'+
    '<a class="btn '+(o.v?'blanc':'sec')+'" href="'+APP+'?formule='+o.n.toLowerCase()+'">Essayer 30 jours gratuits'+I('arrow')+'</a><ul><li class="t">'+o.base+'</li>'+o.l.map(function(l){return '<li>'+I('check')+'<span>'+l+'</span></li>'}).join('')+'</ul><a class="of-det" href="#cmp">Voir tout le détail'+I('down')+'</a></article>'}).join(''));
  $$('#offres [data-r]').forEach(function(e){e.classList.add('in')})}
offres(false);
(function(){var b=$('#bascule');$$('button',b).forEach(function(x){x.addEventListener('click',function(){var an=x.dataset.p==='a';b.classList.toggle('annuel',an);$$('button',b).forEach(function(y){y.setAttribute('aria-pressed',y===x)});offres(an)})})})();
(function(){var el=$('#cmpT');if(!el)return;
  function cell(v){if(v===1)return '<td class="oui">'+I('check')+'<span class="sr">Inclus</span></td>';if(v===0)return '<td class="non"><span aria-hidden="true">–</span><span class="sr">Non inclus</span></td>';return '<td class="val">'+v+'</td>'}
  put(el,'<table><caption class="sr">Détail des formules Essentiel, Club et Domaine</caption><thead><tr><th scope="col"><span class="sr">Fonction</span></th>'+OFFRES.map(function(o){return '<th scope="col"'+(o.v?' class="v"':'')+'><b>'+o.n+'</b><small>'+o.p+' € HT/mois</small></th>'}).join('')+'</tr></thead>'+
    DETAIL.map(function(g){return '<tbody><tr class="g"><th colspan="4" scope="colgroup"><span>'+(g[1]?I(g[1]):'')+g[0]+'</span></th></tr>'+g[2].map(function(r){return '<tr><th scope="row">'+r[0]+'</th>'+cell(r[1])+cell(r[2])+cell(r[3])+'</tr>'}).join('')+'</tbody>'}).join('')+'</table>')})();

/* ---------- FAQ ---------- */
var FAQ=[['Combien de temps faut-il pour démarrer ?','Une après‑midi. La création de l’écurie prend une dizaine de minutes, puis la passerelle reprend vos données. Nous pouvons le faire avec vous, gratuitement.'],
 ['Comment reprendre les données de mon ancien logiciel ?','Avec la passerelle : choisissez Kavalog, Equimondo, votre tableur Excel ou votre logiciel de compta, connectez-vous comme d’habitude, et le robot copie tout en lecture seule. Un simple export CSV ou Excel fonctionne aussi. Rien n’est importé avant que vous ayez vérifié les totaux.'],
 ['Quelle formule choisir ?','Essentiel pour une petite écurie gérée à deux, jusqu’à 25 chevaux. Club dès que vous avez des pensions, une équipe ou plus de 25 chevaux : c’est la formule de la plupart des centres. Domaine au-delà de 60 chevaux, avec plusieurs activités (club, pension, élevage, commerce) ou une annexe. Vous changez de formule quand vous voulez.'],
 ['Suis-je engagé ?','Non. L’abonnement mensuel se résilie en un clic. Vos données vous appartiennent : l’export complet est disponible à tout moment.'],
 ['Que se passe-t-il après les 30 jours d’essai ?','Pendant l’essai, vous avez tout Club. Ensuite, vous choisissez une formule. Sinon, rien n’est perdu : vos données restent consultables et exportables.'],
 ['Les cavaliers doivent-ils installer une application ?','Non, un lien suffit. Ils peuvent aussi ajouter Stabl à l’écran d’accueil de leur téléphone en un geste. Un parent paie pour toute la famille.'],
 ['Stabl AI peut-il agir sans moi ?','Non. Il lit vos données pour répondre et vous montre chaque action avant de la faire. Il agit avec vos droits, pas plus, et tout est noté dans un journal.'],
 ['Mes données sont-elles en sécurité ?','Elles sont chiffrées et sauvegardées automatiquement. Chaque rôle ne voit que ce qui le concerne, et Stabl respecte le RGPD, avec l’export et l’effacement par adhérent.']];
put($('#faqL'),FAQ.map(function(f,i){return '<div class="qr'+(i===0?' ouvert':'')+'"><button type="button" aria-expanded="'+(i===0)+'" aria-controls="rep'+i+'" id="q'+i+'"><span>'+f[0]+'</span><span class="pm">'+I('plus')+'</span></button><div class="rep" id="rep'+i+'" role="region" aria-labelledby="q'+i+'"><div><p>'+f[1]+'</p></div></div></div>'}).join(''));
$$('.qr button').forEach(function(b){b.addEventListener('click',function(){var q=b.parentNode,o=!q.classList.contains('ouvert');q.classList.toggle('ouvert',o);b.setAttribute('aria-expanded',o)})});

/* ---------- Formulaire de rappel : envoi à Stabl, la messagerie en secours ---------- */
(function(){var f=$('#ctF'),n=$('#ctN');
  D.addEventListener('click',function(e){var a=e.target.closest&&e.target.closest('[data-offre]');if(!a)return;var m=f.elements.msg;if(!m.value.trim())m.value='Je souhaite démarrer l’essai gratuit de la formule '+a.dataset.offre+'.'});
  f.addEventListener('submit',function(e){e.preventDefault();var el=f.elements,ko=[];
    ['nom','tel'].forEach(function(k){var v=el[k].value.trim(),bon=k==='tel'?/\d{2}.*\d{2}.*\d{2}/.test(v):v.length>1;el[k].parentNode.classList.toggle('err',!bon);if(!bon)ko.push(el[k])});
    if(ko.length){n.className='ct-n ko';n.textContent='Indiquez au moins votre nom et votre numéro de téléphone.';ko[0].focus();return}
    var club=el.club.value.trim(),corps=['Bonjour,','','Je souhaite être rappelé au sujet de Stabl.','','Nom : '+el.nom.value.trim(),'Établissement : '+(club||'non précisé'),'Téléphone : '+el.tel.value.trim(),'E-mail : '+(el.mail.value.trim()||'non précisé'),'Moment préféré : '+el.quand.value];
    if(el.msg.value.trim())corps.push('','Message :',el.msg.value.trim());
    var sujet='Demande de rappel'+(club?' : '+club:''),mail=el.mail.value.trim(),bt=f.querySelector('[type=submit]');
    function messagerie(){location.href='mailto:'+MAIL+'?subject='+encodeURIComponent(sujet)+'&body='+encodeURIComponent(corps.join('\n'));
      n.className='ct-n ok';n.textContent='Votre messagerie s’ouvre : il ne reste qu’à envoyer. Sinon, écrivez-nous à '+MAIL+'.'}
    /* envoi direct à Stabl (le téléphone suffit) ; e-mail mal saisi ou envoi impossible : on repasse par la messagerie */
    if(!window.fetch||mail&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)){messagerie();return}
    if(bt)bt.disabled=true;n.className='ct-n';n.textContent='Envoi en cours…';
    fetch('https://app.stablapp.fr/api/contact',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({name:el.nom.value.trim(),email:mail,phone:el.tel.value.trim(),subject:sujet,message:corps.join('\n'),source:'site',site_web:''})})
      .then(function(r){if(!r.ok)throw r;n.className='ct-n ok';n.textContent='Merci, votre demande est bien arrivée. Nous vous rappelons très vite.';f.reset()})
      .catch(messagerie).then(function(){if(bt)bt.disabled=false})})})();

/* ---------- Mentions légales : ouvertes par le lien ---------- */
(function(){var d=$('#mentions');function ouvre(){if(location.hash==='#mentions')d.open=true}
  $('#mlLien').addEventListener('click',function(){d.open=true});addEventListener('hashchange',ouvre);ouvre()})();

/* ---------- Pied : le logo géant monte, et s’éclaire sous le curseur ---------- */
(function(){var g=$('#pdGeant');if(!g)return;var l=$('.pd-g-lum',g),f=$('#pied');
  if(RM||!('IntersectionObserver' in window))g.classList.add('in');
  else new IntersectionObserver(function(es,o){if(es[0].isIntersecting){g.classList.add('in');o.disconnect()}},{threshold:.2}).observe(g);
  if(RM||!matchMedia('(hover:hover)').matches)return;var raf=0,x=0,y=0;
  f.addEventListener('pointermove',function(e){x=e.clientX;y=e.clientY;if(raf)return;raf=requestAnimationFrame(function(){raf=0;var r=l.getBoundingClientRect();
    l.style.setProperty('--mx',((x-r.left)/r.width*100).toFixed(1)+'%');l.style.setProperty('--my',((y-r.top)/r.height*100).toFixed(1)+'%')})})})();

/* ---------- Chiffres qui comptent ---------- */
function compte(el){var v=+el.dataset.c,u=(el.dataset.u||'').replace(' ','\u00a0');if(RM||!v){el.textContent=fr(v)+u;return}var t0=0,d=1100;
  function pas(t){if(!t0)t0=t;var k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,4);el.textContent=fr(Math.round(v*e))+u;if(k<1)requestAnimationFrame(pas)}
  el.textContent='0'+u;requestAnimationFrame(pas)}

/* ---------- Passerelle : la source change, les chiffres se recomptent ---------- */
(function(){var fx=$('#flux');if(!fx)return;var s=$$('.fx-s',fx),i=0,iv=0;
  function tour(){s[i].classList.remove('on');i=(i+1)%s.length;s[i].classList.add('on');$$('[data-c]',fx).forEach(compte)}
  if(RM||!('IntersectionObserver' in window))return;
  new IntersectionObserver(function(es){if(es[0].isIntersecting){if(!iv){$$('[data-c]',fx).forEach(compte);iv=setInterval(tour,2600)}}else{clearInterval(iv);iv=0}},{threshold:.3}).observe(fx)})();

/* ---------- Apparitions ---------- */
(function(){var els=$$('[data-r],.scene');
  if(!('IntersectionObserver' in window)||RM){els.forEach(function(e){e.classList.add('in')});return}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target);if(e.target.id==='scene')$$('[data-c]',e.target).forEach(compte)}})},{rootMargin:'0px 0px -8% 0px',threshold:.08});
  els.forEach(function(e){io.observe(e)})})();
})();
