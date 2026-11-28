/* Stabl · page d’accueil v5. Onglets des fonctionnalités, espaces, chat Stabl AI, tarifs, FAQ, formulaire de rappel, apparitions. */
(function(){
'use strict';
var D=document,R=D.documentElement,$=function(s,c){return (c||D).querySelector(s)},$$=function(s,c){return [].slice.call((c||D).querySelectorAll(s))};
var RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
var I=function(n){return window.ICON(n)};
var SH='shots/';
var BASE=$('.pg').getAttribute('data-demo');
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

/* ---------- Fonctionnalités : onglets ---------- */
/* m : origine [x, y] du recadrage au téléphone (640 × 560 px de l’écran d’origine) */
var MODS=[
 {id:'planning',d:'rd',ic:'planning',n:'Planning',h:['Le planning se remplit,','et il ménage vos chevaux.'],
  p:'Reprises, stages, balades et cours particuliers sur toutes vos pistes.',
  u:[['Le montoir se compose seul','chaque cavalier a un cheval à son niveau, sans dépasser sa charge.'],['Rattrapages et liste d’attente','une place se libère, le suivant est prévenu.'],['L’appel sur le téléphone','les séances se décomptent toutes seules.']],
  r:'planning',shot:'g-planning',alt:'Planning de la semaine : 23 reprises, 200 cavaliers, 85 % de remplissage',m:[296,148]},
 {id:'chevaux',d:'hz',ic:'horse',n:'Chevaux et soins',h:['Chaque cheval suivi,','rien n’est oublié.'],
  p:'Une fiche par cheval : identité SIRE, soins, ferrure, travail de la semaine, ration et coûts.',
  u:[['Rappels de soins automatiques','vaccins, vermifuges, maréchal, dentiste.'],['Charge de travail surveillée','Stabl signale les chevaux au-dessus de leur seuil.'],['Le propriétaire voit tout','journal, soins et factures de son cheval.']],
  r:'chevaux',shot:'g-chevaux',alt:'Chevaux : 44 chevaux et poneys, 8 à surveiller, coût moyen de 415 € par cheval',m:[780,170]},
 {id:'adherents',d:'acc',ic:'members',n:'Adhérents',h:['Une famille, un payeur,','tous les cavaliers.'],
  p:'Fiches complètes, inscriptions en ligne, licences FFE en lot, pensions et demi-pensions.',
  u:[['Inscriptions validées en un geste','certificat et autorisations déjà joints.'],['Licences FFE en lot','toutes les licences de la saison en un envoi.'],['Contrats signés sur le téléphone','modèle rempli, signature, archive.']],
  r:'adherents',shot:'g-adherents',alt:'Adhérents : 148 cavaliers, inscriptions à valider, licences FFE',m:[296,300]},
 {id:'facturation',d:'mo',ic:'invoice',n:'Facturation',h:['Les factures du mois,','en un seul geste.'],
  p:'Forfaits, pensions et prestations se facturent seuls, au bon taux de TVA. Carte, SEPA, chèques-vacances : chaque paiement retrouve sa facture.',
  u:[['69 factures prêtes','vous vérifiez, vous envoyez.'],['Relances automatiques','le lien de paiement est dans le message.'],['Comptabilité sans ressaisie','banque rapprochée, TVA, export FEC.']],
  r:'facturation',shot:'g-facturation',alt:'Facturation : 69 factures prêtes pour 18 292 €, 31 846 € encaissés en novembre',m:[296,190]},
 {id:'equipe',d:'tm',ic:'team',n:'Équipe',h:['Plannings, pointage et paie,','enfin réunis.'],
  p:'Chacun pointe sur son téléphone. Heures, congés, diplômes et échéances sont suivis, la paie part vers votre logiciel.',
  u:[['Pointage au téléphone','fini les feuilles à recopier.'],['Échéances suivies','carte professionnelle, PSC1, fin de CDD.'],['Export vers la paie','PayFit ou Silae, sans ressaisie.']],
  r:'equipe',shot:'g-equipe',alt:'Équipe : 6 salariés sur 9 en poste ce matin, échéances à traiter',m:[296,190]},
 {id:'ecurie',d:'cr',ic:'camera',n:'Écurie connectée',h:['L’écurie en direct,','même la nuit.'],
  p:'Caméras de box, abreuvoirs et capteurs sont reliés. Stabl vous prévient quand quelque chose sort de l’habitude.',
  u:[['Alerte avant la colique','Xanthos boit 40 % de moins : l’équipe est prévenue.'],['Rations et stocks reliés','la commande de foin part au bon moment.'],['Plan de l’écurie en 3D','boxes, paddocks et places libres.']],
  r:'cameras',shot:'g-cameras',alt:'Caméras et capteurs : alerte sur Xanthos, box B23',m:[296,240]}
];
(function(){var el=$('#ong');
  put(el,'<div class="ong-tabs" role="tablist" aria-label="Fonctionnalités">'+MODS.map(function(m,i){return '<button type="button" role="tab" class="d-'+m.d+'" id="ot-'+m.id+'" aria-controls="op" aria-selected="'+(i===0)+'" tabindex="'+(i?-1:0)+'">'+I(m.ic)+m.n+'</button>'}).join('')+'</div>'+
   '<div class="ong-p d-'+MODS[0].d+'" id="op" role="tabpanel" aria-labelledby="ot-'+MODS[0].id+'"><div class="txt"></div><div class="ong-v"><figure class="nav-frame">'+barre()+'<div class="crop">'+MODS.map(function(m,i){return '<img'+(i?'':' class="on"')+' src="'+SH+m.shot+'.webp" width="2160" height="1350" loading="lazy" alt="'+(i?'':m.alt)+'" data-alt="'+m.alt+'" style="--m:'+i+'">'}).join('')+'</div></figure></div></div>');
  var tabs=$$('.ong-tabs button',el),p=$('#op'),txt=$('.txt',p),ims=$$('.crop img',p),crop=$('.crop',p),cur=-1,t=0;
  function texte(m){return '<p class="ong-k">'+I(m.ic)+m.n+'</p><h3>'+m.h[0]+' <em>'+m.h[1]+'</em></h3><p>'+m.p+'</p><ul>'+m.u.map(function(u){return '<li>'+I('check')+'<span><b>'+u[0]+'</b> : '+u[1]+'</span></li>'}).join('')+'</ul><a class="lien" '+demo(m.r)+'>Voir dans la démo'+I('arrow')+'</a>'}
  function set(i,focus){if(i===cur)return;var m=MODS[i],first=cur<0;cur=i;
    tabs.forEach(function(b,k){b.setAttribute('aria-selected',k===i);b.tabIndex=k===i?0:-1});p.setAttribute('aria-labelledby','ot-'+m.id);
    crop.style.setProperty('--mx',m.m[0]);crop.style.setProperty('--my',m.m[1]);
    ims.forEach(function(im,k){im.classList.toggle('on',k===i);im.alt=k===i?im.dataset.alt:'';if(k===i)im.loading='eager'});
    p.className='ong-p d-'+m.d;
    if(first||RM){put(txt,texte(m))}else{p.classList.add('chg');clearTimeout(t);t=setTimeout(function(){put(txt,texte(m));p.classList.remove('chg')},220)}
    if(focus)tabs[i].focus()}
  tabs.forEach(function(b,i){b.addEventListener('click',function(){set(i)});
    b.addEventListener('keydown',function(e){var n=MODS.length;if(e.key==='ArrowRight'){e.preventDefault();set((i+1)%n,1)}else if(e.key==='ArrowLeft'){e.preventDefault();set((i+n-1)%n,1)}})});
  set(0)})();
put($('#aussi'),[['','Aussi inclus'],['trophy','Concours'],['chat','Messagerie des familles'],['sign','Contrats signés'],['shop','Boutique et stages'],['accounting','Comptabilité et TVA'],['report','Rapports'],['wifi','Mode hors ligne'],['plug','72 connecteurs']].map(function(x){return '<li>'+(x[0]?I(x[0]):'')+x[1]+'</li>'}).join(''));

/* ---------- Quatre espaces ---------- */
var ESP=[
 {d:'acc',ic:'today',n:'Gérant',ap:'Ordinateur',t:'Toute l’écurie sous les yeux.',p:'Ce qui demande une décision aujourd’hui, et des rapports clairs pour le reste.',r:'cockpit',
  v:'<figure class="nav-frame">'+barre()+'<div class="crop" style="--dx:276;--dy:0;--dw:1164;--dh:720"><img src="'+SH+'g-cockpit.webp" width="2160" height="1350" loading="lazy" alt="Tableau de bord du gérant"></div></figure>'},
 {d:'hz',ic:'hay',n:'Employé',ap:'Téléphone et tablette',t:'Sa journée, box après box.',p:'La tournée, les soins et les consignes. Même sans réseau au fond de l’écurie.',r:'emp-jour',v:tel('p-emp-tournee','Tournée des boxes sur téléphone')},
 {d:'rd',ic:'user',n:'Adhérent',ap:'Téléphone',t:'Le club dans la poche.',p:'Réserver, rattraper un cours, payer, signer et suivre son cheval.',r:'adh-accueil',v:tel('p-adh-reserver','Réservation d’un cours sur téléphone')},
 {d:'mo',ic:'coach',n:'Coach',ap:'Ordinateur et téléphone',t:'Un agenda qui se remplit seul.',p:'Les cavaliers réservent et paient en ligne, l’écurie perçoit sa part.',r:'coach-agenda',v:tel('p-coach-agenda','Agenda de la coach sur téléphone')}];
put($('#esp'),ESP.map(function(e,i){return '<article class="ec d-'+e.d+'" data-r style="--i:'+i+'"><div class="ec-v">'+e.v+'</div><div class="ec-t"><p class="ec-q">'+I(e.ic)+e.n+' · '+e.ap+'</p><h3>'+e.t+'</h3><p>'+e.p+'</p><a class="lien" '+demo(e.r)+'>Ouvrir l’espace '+e.n.toLowerCase()+I('arrow')+'</a></div></article>'}).join(''));

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

/* ---------- Tarifs ---------- */
var OFFRES=[
 ['Essentiel','Poney-club et petite écurie',59,['Jusqu’à 30 chevaux','Adhérents, chevaux et planning','Facturation et facture électronique','Paiement en ligne des adhérents','Calendriers synchronisés'],0],
 ['Club','Le centre équestre complet',149,['Tout Essentiel, sans limite de chevaux','Pensions, soins et maréchalerie','Prélèvements SEPA automatiques','Accès comptable et exports FEC','Reprise des données offerte'],1],
 ['Domaine','Plusieurs sites, grandes structures',289,['Tout Club','Jusqu’à 10 sites','Accompagnement prioritaire','API et intégrations'],0]];
function virg(n){return n.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})}
function offres(an){put($('#offres'),OFFRES.map(function(o,i){return '<article class="of'+(o[4]?' vedette':'')+'" data-r style="--i:'+i+'">'+(o[4]?'<span class="of-tag">La plus choisie</span>':'')+'<h3>'+o[0]+'</h3><p class="of-p">'+o[1]+'</p><div class="of-prix"><b>'+fr(an?o[2]*10:o[2])+'</b><span class="of-u">€ HT<br>'+(an?'par an':'par mois')+'</span></div><p class="of-an">'+(an?'Soit '+virg(o[2]*10/12)+' € HT par mois, 2 mois offerts':'Sans engagement, résiliable en un clic')+'</p><a class="btn '+(o[4]?'blanc':'sec')+'" href="#contact" data-offre="'+o[0]+'">Démarrer l’essai gratuit'+I('arrow')+'</a><ul>'+o[3].map(function(l){return '<li>'+I('check')+'<span>'+l+'</span></li>'}).join('')+'</ul></article>'}).join(''));
  $$('#offres [data-r]').forEach(function(e){e.classList.add('in')})}
offres(false);
(function(){var b=$('#bascule');$$('button',b).forEach(function(x){x.addEventListener('click',function(){var an=x.dataset.p==='a';b.classList.toggle('annuel',an);$$('button',b).forEach(function(y){y.setAttribute('aria-pressed',y===x)});offres(an)})})})();

/* ---------- FAQ ---------- */
var FAQ=[['Combien de temps faut-il pour démarrer ?','Une après‑midi. La création de l’écurie prend une dizaine de minutes, puis la passerelle reprend vos données. Nous pouvons le faire avec vous, gratuitement.'],
 ['Comment reprendre les données de mon ancien logiciel ?','Avec la passerelle : choisissez Kavalog, Equimondo, votre tableur Excel ou votre logiciel de compta, connectez-vous comme d’habitude, et le robot copie tout en lecture seule. Un simple export CSV ou Excel fonctionne aussi. Rien n’est importé avant que vous ayez vérifié les totaux.'],
 ['Suis-je engagé ?','Non. L’abonnement mensuel se résilie en un clic. Vos données vous appartiennent : l’export complet est disponible à tout moment.'],
 ['Que se passe-t-il après les 30 jours d’essai ?','Vous choisissez une formule. Sinon, rien n’est perdu : vos données restent consultables et exportables.'],
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
    /* envoi direct à Stabl ; sans e-mail valide ou si l'envoi échoue, on repasse par la messagerie */
    if(!window.fetch||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mail)){messagerie();return}
    if(bt)bt.disabled=true;n.className='ct-n';n.textContent='Envoi en cours…';
    fetch('https://app.stablapp.fr/api/contact',{method:'POST',headers:{'content-type':'application/json'},
      body:JSON.stringify({name:el.nom.value.trim(),email:mail,phone:el.tel.value.trim(),subject:sujet,message:corps.join('\n'),source:'site',site_web:''})})
      .then(function(r){if(!r.ok)throw r;n.className='ct-n ok';n.textContent='Merci, votre demande est bien arrivée. Nous vous rappelons très vite.';f.reset()})
      .catch(messagerie).then(function(){if(bt)bt.disabled=false})})})();

/* ---------- Mentions légales : ouvertes par le lien ---------- */
(function(){var d=$('#mentions');function ouvre(){if(location.hash==='#mentions')d.open=true}
  $('#mlLien').addEventListener('click',function(){d.open=true});addEventListener('hashchange',ouvre);ouvre()})();

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
