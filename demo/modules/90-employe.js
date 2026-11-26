/* Vue employé · toute la journée d'un soigneur (Antoine Leroy) et d'un moniteur (Hugo Lefèvre)
   Téléphone d'abord : gros boutons, forts contrastes, tout à portée de pouce. */
(function(){
var D=P.D,F=P.fmt,U=P.ui,$=P.$,$$=P.$$;
/* Club réel : la personne connectée n'est pas l'employée de démo (s05) → écrans branchés sur ses propres données. */
var DEMO=!D.me||D.me.employe==='s05'||!!(window.PL&&PL.sandbox);
function cap(x){x=String(x||'');return x.charAt(0).toUpperCase()+x.slice(1)}

/* =====================================================================
   Données propres à la vue employé
   ===================================================================== */
/* Le cheval en colique du box B23 s'appelle Xanthos partout dans la démo (caméras, accueil du gérant) :
   on remet les deux noms dans l'ordre attendu, une seule fois. */
(function(){var a=D.horse('h23'),b=D.horse('h24');if(a&&b&&a.name!=='Xanthos'&&b.name==='Xanthos'){b.name=a.name;a.name='Xanthos'}})();
D.empTasks=D.empTasks||[
 {id:'t1',t:'07:00',title:'Distribution du matin',zone:'Toutes les écuries',icon:'feed',done:true},
 {id:'e2',t:'08:15',title:'Sortir le groupe A au paddock',zone:'Avec Lucie · Prairie du bas',icon:'paddock',done:true},
 {id:'t3',t:'09:00',title:'Curer les boxes B01 à B16',zone:'Écurie principale',icon:'stable',tour:true},
 {id:'e4',t:'11:00',title:'Pailler les boxes B17 à B24',zone:'6 sacs de copeaux',icon:'shavings'},
 {id:'e5',t:'11:45',title:'Distribution de midi',zone:'Foin · 14 chevaux au box',icon:'hay'},
 {id:'e6',t:'14:00',title:'Réceptionner le foin',zone:'Hangar · 12 balles, Fourrages du Hurepoix',icon:'truck'},
 {id:'e7',t:'15:00',title:'Donner les soins du jour',zone:'4 soins à valider',icon:'care',go:'emp-soins'},
 {id:'e8',t:'16:30',title:'Rentrer les paddocks',zone:'Avec Lucie · tous les paddocks',icon:'paddock'},
 {id:'t10',t:'18:00',title:'Distribution du soir',zone:'Toutes les écuries',icon:'feed'},
 {id:'e10',t:'18:20',title:'Tournée du soir',zone:'Eau, couvertures, lumières',icon:'moon'}];
/* Le numéro du vétérinaire n'est celui de personne d'autre dans la démo. */
var VET='06 71 28 45 19';
D.empHugo=D.empHugo||[
 {id:'g1',t:'10:00',title:'Travailler Jazz à la longe',zone:'Rond de longe · 30 min',icon:'horse'},
 {id:'g3',t:'14:00',title:'Point pédagogique avec Claire',zone:'Bureau · 30 min',icon:'chat'},
 {id:'g4',t:'15:30',title:'Monter le parcours de la reprise CSO',zone:'Carrière d’honneur · avec Thomas',icon:'jump'},
 {id:'g2',t:'17:00',title:'Cours particulier',zone:'Petite carrière · 45 min',icon:'whistle',priv:true,rider:'m019',horse:'h01'},
 {id:'g5',t:'19:00',title:'Adultes Galop 4',zone:'Grand manège · 60 min',icon:'whistle',lesson:'l07'}];
D.empNotes=D.empNotes||{
 h01:'Sensible des postérieurs : curer le pied gauche en premier. Ferrure jeudi à 9 h.',
 h02:'Jument dominante : la sortir en dernier au paddock.',
 h04:'Boiterie de l’antérieur gauche. Reste au box, pas de paddock. Vétérinaire à 14 h.',
 h06:'Repos de 3 jours prescrit. Marche en main 15 min, aucun travail.',
 h08:'Vaccin grippe lundi. Mordille quand on la sangle.',
 h10:'Foin trempé 20 min avant chaque repas (emphysème).',
 h12:'Maréchal en retard de 9 jours : surveiller le pied antérieur droit.',
 h14:'Tique à l’appui : remettre le collier après le paddock.',
 h16:'A perdu 12 kg : ration augmentée, vérifier qu’il finit tout.',
 h23:'Colique légère cette nuit. Diète : foin mouillé seulement, pas de granulés. Contrôle toutes les 2 h.',
 h27:'Vermifuge à donner aujourd’hui.'};
D.empPresence=D.empPresence||[
 {id:'s01',st:'in',txt:'Bureau · depuis 8 h 15'},{id:'s05',st:'in',txt:'Écurie principale · depuis 6 h 56'},
 {id:'s06',st:'in',txt:'Paddocks · depuis 7 h 30'},{id:'s07',st:'in',txt:'Carrière d’honneur · depuis 9 h 00'},
 {id:'s04',st:'in',txt:'Carrière d’honneur · reprise à 10 h'},{id:'s09',st:'in',txt:'Accueil · depuis 9 h 00'},
 {id:'s02',st:'later',txt:'Arrive à 10 h 00'},{id:'s03',st:'later',txt:'Arrive à 16 h 00'},
 {id:'s08',st:'off',txt:'En formation au CFA'}];
D.empConsignes=D.empConsignes||[
 {id:'c1',from:'s01',when:'8 h 20',text:'Xanthos reste à la diète jusqu’au passage du Dr Leclerc. Foin mouillé seulement, et un contrôle toutes les 2 h noté dans Stabl.',urgent:true,read:['s06','s09']},
 {id:'c2',from:'s01',when:'7 h 45',text:'Pluie annoncée jeudi et vendredi : le groupe A ira au paddock d’hiver. Couvertures 150 g ce soir, il fera 3 °C cette nuit.',read:['s06','s07','s02','s09']},
 {id:'c3',from:'s01',when:'Hier, 18 h 30',text:'Livraison de foin à 14 h. Merci de compter les balles avant de signer le bon.',read:['s05','s06','s07'],mine:true}];
D.empCare=D.empCare||[
 {id:'q1',horse:'h27',kind:'Vermifuge',icon:'syringe',t:'08:00',late:true,prod:'Eqvalan Duo',poso:'1 seringue réglée sur 520 kg, par la bouche',why:'Ivermectine et praziquantel, vermifuge d’automne',lot:'EQD-4471',wait:'Aucun délai pour le cheval de sport'},
 {id:'q2',horse:'h23',kind:'Surveillance',icon:'pulse',t:'10:00',prod:'Marche en main',poso:'10 minutes au pas, puis foin mouillé 1 kg',why:'Colique légère, prescription du Dr Leclerc',lot:''},
 {id:'q3',horse:'h04',kind:'Pansement',icon:'care',t:'11:00',prod:'Argile verte et bande de repos',poso:'Antérieur gauche, du genou au boulet, à refaire chaque jour',why:'Boiterie, en attendant l’échographie de 14 h',lot:''},
 {id:'q4',horse:'h06',kind:'Traitement',icon:'pill',t:'12:00',prod:'Gel à l’arnica',poso:'Une noisette sur le dos, masser 2 minutes',why:'Repos prescrit, jour 2 sur 3',lot:'ARN-0932'},
 {id:'q5',horse:'h04',kind:'Traitement',icon:'pill',t:'07:00',done:'7 h 12',prod:'Equipalazone',poso:'1 sachet dans la ration, matin et soir',why:'Anti-inflammatoire, jour 3 sur 5',lot:'EQP-2208'},
 {id:'q6',horse:'h16',kind:'Pesée',icon:'weight',t:'07:30',done:'7 h 40',prod:'Ruban de pesée',poso:'412 kg, soit 2 kg repris en une semaine',why:'Suivi de la perte de poids',lot:''}];
D.empRegister=D.empRegister||[
 {n:'RS-2026-1183',d:'Auj. 7 h 40',horse:'h16',what:'Pesée au ruban : 412 kg',by:'s05'},
 {n:'RS-2026-1182',d:'Auj. 7 h 12',horse:'h04',what:'Equipalazone, 1 sachet (lot EQP-2208)',by:'s05'},
 {n:'RS-2026-1181',d:'Auj. 4 h 35',horse:'h23',what:'Calmagine 20 mL en intraveineuse, Dr Leclerc',by:'s05'},
 {n:'RS-2026-1180',d:'Hier 18 h 05',horse:'h04',what:'Equipalazone, 1 sachet (lot EQP-2208)',by:'s06'},
 {n:'RS-2026-1179',d:'Hier 11 h 20',horse:'h12',what:'Goudron de Norvège, antérieurs',by:'s05'}];
D.empShifts=D.empShifts||[
 {d:-1,l:'Lun',n:16,parts:[['07:00','12:00','Écurie'],['14:00','17:00','Écurie']],h:8,real:'8 h 05'},
 {d:0,l:'Mar',n:17,parts:[['07:00','12:00','Écurie'],['14:00','18:30','Écurie et soins']],h:9.5},
 {d:1,l:'Mer',n:18,parts:[['07:00','12:00','Écurie'],['14:00','17:00','Paddocks']],h:8},
 {d:2,l:'Jeu',n:19,parts:[['07:00','12:00','Écurie']],h:5,night:true},
 {d:3,l:'Ven',n:20,parts:[['13:00','18:30','Écurie']],h:5.5,note:'Matin de repos après l’astreinte'},
 {d:4,l:'Sam',n:21,parts:[['07:00','12:00','Écurie']],h:5,swap:true},
 {d:5,l:'Dim',n:22,parts:[],h:0}];
D.empNights=D.empNights||[['Lun','s05',true],['Mar','s06'],['Mer','s05'],['Jeu','s01'],['Ven','s05'],['Sam','s01'],['Dim','s01']];
/* La semaine de Antoine se lit dans le planning de l'équipe (écran Équipe du gérant, D.shifts et D.nights) :
   mêmes postes, mêmes astreintes, même total. Les données propres à l'employé ne servent que si ce planning manque. */
var SHC={E:[8,[['07:00','12:00'],['14:00','17:00']],'Écurie'],L:[9.5,[['07:00','12:00'],['14:00','18:30']],'Écurie et soins'],A:[5,[['07:00','12:00']],'Matinée d’écurie'],M:[5.5,[['07:00','12:30']],'Écurie, matin'],S:[5.5,[['13:30','19:00']],'Écurie, soir'],J:[8,[['08:30','12:30'],['13:30','17:30']],'Journée'],C:[7,[['07:00','11:00'],['16:00','19:00']],'Écurie'],K:[8,[['06:30','12:00'],['13:30','16:00']],'Concours'],F:[7,[['08:30','12:30'],['13:30','16:30']],'Formation'],P:[7,[],'Congé payé'],R:[0,[],'Repos']};
var WD=[['Lun',16],['Mar',17],['Mer',18],['Jeu',19],['Ven',20],['Sam',21],['Dim',22]];
function myWeek(){var K=D.shifts&&D.shifts.s05;if(!K)return D.empShifts;
  return K.map(function(k,i){var c=SHC[k]||SHC.R,o={d:i-1,l:WD[i][0],n:WD[i][1],k:k,h:c[0],night:!!(D.nights&&D.nights[i]==='s05'),
    parts:c[1].map(function(p,j){return [p[0],p[1],k==='C'?(j?'Écurie, soir':'Écurie, matin'):c[2]]})};
    if(i===0&&c[0]){o.real=hh(c[0]+1.25);o.realH=c[0]+1.25;o.note='Dont 1 h 15 d’intervention d’astreinte pour la colique de Xanthos, comptée et majorée.'}
    if(i===5)o.swap=true;return o})}
function myNights(){if(!D.nights)return D.empNights;return D.nights.map(function(id,i){return [WD[i][0],id,i===0&&id==='s05']})}
function nextNight(){var W=myWeek();for(var i=2;i<W.length;i++)if(W[i].night)return i;return -1}
function hrOf(){return (D.hr&&D.hr.s05)||{cp:[25,6],rec:7,ot:9.5}}
function weekTot(){return myWeek().reduce(function(a,s){return a+s.h},0)}
function monH(){var w=myWeek()[0];return w.realH||w.h||8}
D.empThreads=D.empThreads||[
 {id:'eq',title:'Équipe de l’écurie',grp:['s01','s06','s07','s02'],unread:2,msgs:[
   {w:'s06',t:'8 h 32',x:'Groupe A sorti. Volga a perdu un fer au postérieur droit, je l’ai mis de côté dans la sellerie.'},
   {w:'s01',t:'8 h 40',x:'Merci Lucie. J’ajoute Volga à la liste du maréchal de jeudi.'},
   {w:'s07',t:'9 h 15',x:'Je herse la carrière d’honneur à 13 h 30, évitez de traverser avec les brouettes.'},
   {w:'s01',t:'9 h 30',x:'Antoine, tu me dis comment va Xanthos après le contrôle de 10 h ?'}]},
 {id:'cl',title:'Claire Dumont',with:'s01',unread:0,msgs:[
   {w:'s05',t:'8 h 05',x:'Xanthos a recrotté, il mange un peu de foin mouillé.',read:true},
   {w:'s01',t:'8 h 09',x:'Très bonne nouvelle. On continue les contrôles toutes les 2 h jusqu’au véto.'}]},
 {id:'lu',title:'Lucie Petit',with:'s06',unread:1,msgs:[
   {w:'s06',t:'Hier',x:'Tu pourrais prendre mon samedi matin ? Je te rends ton dimanche 29.'}]},
 {id:'co',title:'Groupe Concours Rambouillet',grp:['s04','s01','s06'],unread:0,msgs:[
   {w:'s04',t:'8 h 47',x:'Départ dimanche à 6 h 45, soyez là à 6 h 30. Antoine, peux-tu préparer le foin du camion samedi soir ?'},
   {w:'s05',t:'8 h 52',x:'Oui, 4 filets prêts samedi à 18 h.',read:true}]}];
/* Les demandes en cours sont celles que voit la gérante (D.leaves, écran Équipe) ; ici seulement l'historique déjà pris. */
D.empLeaves=D.empLeaves||[
 {id:'v3',kind:'Congé payé',from:'2026-08-10',to:'2026-08-15',days:6,st:'validé',note:'Pris',past:true}];
var LST={attente:'en attente','validé':'validé','refusé':'refusé'};
function myLeaves(){if(!D.leaves)return D.empLeaves;
  return D.leaves.filter(function(l){return l.who==='s05'}).map(function(l){return {id:l.id,kind:l.kind.replace('Congés payés','Congé payé'),from:l.from,to:l.to,days:l.days,st:LST[l.state]||l.state,note:l.state==='attente'?'Demandée '+l.asked:l.state==='validé'?'Validée par Claire':'Refusée par Claire',fresh:l.fresh,src:l}}).concat(D.empLeaves)}
function addLeave(o){if(D.leaves){var l={id:'a'+Date.now(),who:'s05',kind:o.kind==='Congé payé'?'Congés payés':o.kind,from:o.from,to:o.to,days:o.days,state:'attente',asked:'à l’instant',impact:'ok',note:'Demande envoyée depuis l’application de Antoine.',fresh:true};D.leaves.unshift(l);return function(){var i=D.leaves.indexOf(l);if(i>=0)D.leaves.splice(i,1)}}
  var v={id:'v'+Date.now(),kind:o.kind,from:o.from,to:o.to,days:o.days,st:'en attente',note:'Demandée à l’instant',fresh:true};D.empLeaves.unshift(v);return function(){var i=D.empLeaves.indexOf(v);if(i>=0)D.empLeaves.splice(i,1)}}
function cpLeft(){var H=hrOf();return H.cp[0]-H.cp[1]}
D.empDocs=D.empDocs||[
 {id:'b10',t:'Bulletin de paie d’octobre 2026',s:'Net payé 1 742,18 € · 169 h dont 4 h supplémentaires',pay:{net:'1 742,18 €',brut:'2 236,40 €',h:'169 h',sup:'4 h à 125 %'}},
 {id:'b09',t:'Bulletin de paie de septembre 2026',s:'Net payé 1 698,52 € · 165 h',pay:{net:'1 698,52 €',brut:'2 180,10 €',h:'165 h',sup:'Aucune'}},
 {id:'b08',t:'Bulletin de paie d’août 2026',s:'Net payé 1 701,90 € · 12 jours de congés payés',pay:{net:'1 701,90 €',brut:'2 184,00 €',h:'91 h',sup:'Aucune'}},
 {id:'d1',t:'Contrat de travail CDI 39 h',s:'Signé le 13 juin 2016 · convention des centres équestres'},
 {id:'d2',t:'Attestation de mutuelle 2026',s:'Valable jusqu’au 31 décembre 2026'},
 {id:'d3',t:'Consignes de sécurité et document unique',s:'Mis à jour le 4 septembre 2026'}];
D.empIncidents=D.empIncidents||[
 {id:'i1',kind:'Abreuvoir en panne',where:'Box B23',when:'Ce matin, 6 h 15',sev:1,st:'Vu par Claire',txt:'Débit faible, je remplis un seau en attendant.'},
 {id:'i2',kind:'Clôture cassée',where:'Paddock d’hiver',when:'Hier, 16 h 40',sev:1,st:'Pris en charge par Kévin',txt:'Lisse du haut fendue côté chemin.'},
 {id:'i3',kind:'Stock bas',where:'Hangar',when:'Lundi, 11 h 05',sev:0,st:'Commande passée',txt:'Il reste 41 sacs de copeaux.'}];

/* =====================================================================
   État de la session (en mémoire)
   ===================================================================== */
var E={who:'s05',offline:false,queue:0,
 tour:null,cons:{},care:{},obs:{},clock:{state:'in',since:'6 h 56',base:2*3600+45*60,pause:0,log:[['6 h 56','Arrivée pointée','Sellerie, position vérifiée']]},
 ctl:[{t:'4 h',st:'bad',x:'Colique, Dr Leclerc appelé'},{t:'6 h',st:'warn',x:'Pas de crottins, marché 10 min'},{t:'8 h',st:'ok',x:'A recrotté, mange un peu'},{t:'10 h',st:null},{t:'12 h',st:null}],
 pres:{},assign:null,swap:null,pad:{},t0:Date.now()};
function me(){return D.staffer(E.who)}
function mon(){return E.who==='s02'}
function tasks(){return mon()?D.empHugo:D.empTasks}
function tasksLeft(){return tasks().filter(function(t){return !t.done}).length}
function hm(t){var p=t.split(':');return (+p[0])+' h'+(p[1]==='00'?'':' '+p[1])}
function sw(n){if(!n||P.RM)return;n.classList.toggle('em-sw',false);void n.offsetWidth;n.classList.add('em-sw')}
function swBody(el){[].slice.call(el.children).forEach(function(x){if(!x.classList.contains('em-hd'))sw(x)})}
function on(root,sel,fn){root.addEventListener('click',function(e){var t=e.target.closest(sel);if(t&&root.contains(t))fn(t,e)})}
function say(msg,o){if(E.offline){E.queue++;P.toast(msg+'. Envoi au retour du réseau',{icon:'wifi'});var b=$('.em-off b',P.app());if(b)b.textContent=E.queue}else P.toast(msg,o)}
function ico(n,k,c){return '<span class="em-ic '+(k||'')+'"'+(c?' style="--c:'+c+'"':'')+'>'+ICON(n)+'</span>'}
function offBar(){return E.offline?'<button class="em-off" data-online>'+ICON('wifi')+'<span class="grow">Hors ligne. <b>'+E.queue+'</b> action'+(E.queue>1?'s':'')+' gardée'+(E.queue>1?'s':'')+' sur le téléphone, envoi dès le retour du réseau.</span><span class="em-off-b">Reconnecter</span></button>':''}
function hd(title,sub,acts){return '<div class="ph em-hd"><div class="grow"><h1>'+title+'</h1><div class="sub">'+sub+'</div></div>'+(acts?'<div class="acts">'+acts+'</div>':'')+'</div>'+offBar()}
function unqueue(){D.empHugo.concat(D.empTasks).forEach(function(t){t.queued=false})}
function online(el,draw){on(el,'[data-online]',function(){var n=E.queue;E.offline=false;E.queue=0;unqueue();draw();P.toast(n?'Réseau retrouvé : '+n+' action'+(n>1?'s':'')+' synchronisée'+(n>1?'s':''):'Réseau retrouvé',{icon:'wifi'})})}
function ck(id,isOn,k){return '<button class="em-ck '+(k||'')+(isOn?' on':'')+'" data-ck="'+id+'" title="'+(isOn?'Décocher':'Cocher')+'" aria-pressed="'+(!!isOn)+'"><svg viewBox="0 0 24 24"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg></button>'}
function tri(k,opts,sel){return '<div class="em-3" data-k="'+k+'">'+opts.map(function(o,i){return '<button type="button" class="k'+i+'" data-v="'+i+'" aria-pressed="'+(i===sel)+'">'+o+'</button>'}).join('')+'</div>'}
function bindTri(root,fn){on(root,'.em-3 button',function(b){$$('button',b.parentNode).forEach(function(x){x.setAttribute('aria-pressed',x===b)});if(fn)fn(b.parentNode.getAttribute('data-k'),+b.getAttribute('data-v'))})}
function workToday(){var m={};D.lessons.filter(function(l){return l.dow===2}).forEach(function(l){Object.keys(l.horses).forEach(function(r){var h=l.horses[r],x=D.horse(h);if(x.status==='bad'||h==='h06')return;(m[h]=m[h]||[]).push(l.start)})});return m}
function blanket(h){var i=+h.id.slice(1);return h.status==='bad'?'Chemise d’écurie':['Sans couverture','Couverture 150 g','Couverture 300 g','Couverture 150 g'][i%4]}
function padOf(h){var i=+h.id.slice(1);if(h.status==='bad')return null;if(h.id==='h06')return {p:'Paddock de soins',g:'A'};return {p:h.paddock,g:i%2?'A':'B'}}
var PADT={A:'8 h 30 à 12 h',B:'13 h à 16 h 30'};
function ownerOf(h){return h.owner?D.name(h.owner):'Club'}
/* fausse photo : un cadre teinté avec la silhouette du cheval */
function shot(lbl){return '<span class="em-shot pop">'+HORSE_GLYPH()+'<small>'+(lbl||'Photo 1')+'</small></span>'}
/* dictée simulée : le texte s'écrit tout seul dans le champ */
function dictate(btn,ta,text){if(btn.classList.contains('rec'))return;btn.classList.add('rec');var lab=btn.querySelector('span');var old=lab?lab.textContent:'';if(lab)lab.textContent='J’écoute…';
  var i=0,base=ta.value?ta.value+' ':'';(function step(){if(!btn.isConnected)return;i+=P.RM?text.length:2;ta.value=base+text.slice(0,i);if(i<text.length)setTimeout(step,28);else{btn.classList.remove('rec');if(lab)lab.textContent=old}})()}
function vetSheet(h){var s=P.sheet({title:'Appeler le vétérinaire',icon:'phone',body:
  '<div class="stack" style="--g:14px"><div class="card flat hrow" style="padding:14px">'+ico('care','lg','var(--bad)')+'<div class="grow"><b class="l">Dr Antoine Leclerc</b><div class="s mut">Vétérinaire de l’écurie · de garde aujourd’hui</div><div class="num b" style="font-size:19px;margin-top:4px">'+VET+'</div></div></div>'+
  (h?'<div class="note">'+ICON('info','sm')+'<span>Stabl lui envoie la fiche de <b>'+h.name+'</b> ('+h.box+') avec les derniers contrôles pendant l’appel.</span></div>':'')+
  '<div class="list card flat"><button class="li click" data-alt="clinique" style="width:100%;text-align:left">'+ico('phone','','var(--acc)')+'<div class="grow"><div class="t">Clinique équine de Rambouillet</div><div class="s">Urgences jour et nuit · 01 30 00 00 00</div></div>'+ICON('right','sm')+'</button><button class="li click" data-alt="Claire" style="width:100%;text-align:left">'+U.av('s01')+'<div class="grow"><div class="t">Claire Dumont, gérante</div><div class="s">À prévenir avant tout appel non urgent</div></div>'+ICON('right','sm')+'</button></div></div>',
  foot:'<button class="btn em-b pri block" data-call>'+ICON('phone')+'Appeler le Dr Leclerc</button>'});
  s.querySelector('[data-call]').onclick=function(){s.close();P.toast('Appel du Dr Leclerc en cours'+(h?', fiche de '+h.name+' envoyée':''),{icon:'phone'});if(h)(E.obs[h.id]=E.obs[h.id]||[]).unshift({who:E.who,when:'À l’instant',text:'Appel au Dr Leclerc.',kind:'soin'})};
  on(s,'[data-alt]',function(b){s.close();P.toast('Appel en cours : '+(b.getAttribute('data-alt')==='Claire'?'Claire Dumont':'Clinique équine de Rambouillet'),{icon:'phone'})});return s}

/* =====================================================================
   Styles
   ===================================================================== */
P.css(`
.em-cl2{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden;line-height:1.35}
.em-sw{animation:em-sw 240ms var(--e-out) both}
@keyframes em-sw{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.em-sw{animation:none}}
.em-hd{align-items:center}
.app.mobile .em-hd{align-items:stretch}
.em-hd .acts{align-items:center}
.em-cols{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:16px;align-items:start}
.em-cols.eq{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
.em-b{height:52px;font-size:15.5px;border-radius:var(--r-md);padding:0 18px}
.em-b svg.i{width:20px;height:20px}
.em-off{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px 12px;border-radius:var(--r-md);background:var(--warn-pale);color:var(--ink);font-size:13px;margin-bottom:14px;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--warn) 30%,transparent)}
.em-off svg.i{color:var(--warn)}
.em-off-b{font-weight:700;color:var(--warn);white-space:nowrap}
.em-ic{width:40px;height:40px;border-radius:12px;display:grid;place-items:center;flex:none;background:color-mix(in srgb,var(--c,var(--acc)) 12%,transparent);color:var(--c,var(--acc))}
.em-ic.lg{width:48px;height:48px;border-radius:14px}.em-ic.lg svg.i{width:24px;height:24px}
.em-ic.sm{width:32px;height:32px;border-radius:10px}
.em-ck{width:36px;height:36px;border-radius:50%;box-shadow:inset 0 0 0 2px var(--line-2);display:grid;place-items:center;flex:none;position:relative;background:var(--surface);transition:background var(--t-2) var(--e-out),box-shadow var(--t-2),transform var(--t-1) var(--e-out)}
.em-ck:hover{box-shadow:inset 0 0 0 2px var(--ok)}
.em-ck:active{transform:scale(.9)}
.em-ck svg{width:56%;height:56%;fill:none;stroke:var(--surface);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:22;stroke-dashoffset:22;transition:stroke-dashoffset var(--t-3) var(--e-out) 60ms}
.em-ck.on{background:var(--ok);box-shadow:none}
.em-ck.on svg{stroke-dashoffset:0}
.em-ck.xl{width:60px;height:60px}
.em-ck::after{content:"";position:absolute;inset:0;border-radius:50%;box-shadow:0 0 0 2px var(--ok);opacity:0;pointer-events:none}
.em-ck.go{animation:em-bump .5s var(--e-spring)}
.em-ck.go::after{animation:em-burst .65s var(--e-out)}
@keyframes em-bump{35%{transform:scale(.84)}70%{transform:scale(1.14)}}
@keyframes em-burst{from{opacity:.8;transform:scale(1)}to{opacity:0;transform:scale(2)}}
.em-3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:4px;padding:3px;border-radius:11px;background:var(--bg-2)}
.em-3 button{height:38px;border-radius:8px;font-weight:600;font-size:13px;color:var(--mut);transition:background var(--t-2),color var(--t-2),transform var(--t-1);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;padding:0 4px}
.em-3 button:active{transform:scale(.96)}
.em-3 button[aria-pressed="true"]{background:var(--surface);color:var(--ink);box-shadow:var(--shadow-1),inset 0 0 0 1px var(--line)}
.em-3 button.k0[aria-pressed="true"]{color:var(--ok)}
.em-3 button.k1[aria-pressed="true"]{color:var(--warn)}
.em-3 button.k2[aria-pressed="true"]{color:var(--bad);background:var(--bad-pale);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--bad) 35%,transparent)}
.em-shot{width:76px;height:76px;border-radius:14px;flex:none;display:grid;place-items:center;position:relative;overflow:hidden;background:linear-gradient(160deg,var(--bg-2),var(--acc-pale));color:var(--ink-2);box-shadow:inset 0 0 0 1px var(--line-2)}
.em-shot svg{width:44px;height:44px;opacity:.75}
.em-shot small{position:absolute;left:0;right:0;bottom:0;font-size:13px;font-weight:600;text-align:center;padding:2px 0;background:color-mix(in srgb,var(--surface) 80%,transparent);color:var(--ink-2)}
.em-add{width:76px;height:76px;border-radius:14px;flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;font-size:13px;font-weight:600;color:var(--ink-2);box-shadow:inset 0 0 0 1.5px var(--line-2);background:var(--surface);transition:background var(--t-2),transform var(--t-1)}
.em-add:active{transform:scale(.95)}
.em-add:hover{background:var(--surface-2)}
.em-add.rec{color:var(--bad);box-shadow:inset 0 0 0 1.5px var(--bad);animation:pulse 1.2s infinite}
.em-row{display:flex;align-items:center;gap:12px;padding:12px 16px;min-width:0;position:relative;width:100%;text-align:left;transition:background var(--t-1)}
.em-row+.em-row::before{content:"";position:absolute;left:16px;right:16px;top:0;height:1px;background:var(--line)}
button.em-row:hover,.em-row.click:hover{background:var(--surface-2);cursor:pointer}
.em-row .t{font-weight:600;font-size:14.5px;line-height:1.3}
.em-row .s{font-size:13px;color:var(--mut);line-height:1.35}
.em-tm{font:600 13px var(--f-mono);color:var(--ink-2);width:44px;flex:none;font-variant-numeric:tabular-nums}
.em-st{width:9px;height:9px;border-radius:50%;flex:none;background:var(--c,var(--mut-2))}
.em-h2{font:650 15px var(--f-display);letter-spacing:-.015em}
.em-kv{display:flex;flex-direction:column;gap:2px;padding:10px 12px;border-radius:var(--r-md);background:var(--surface-2);min-width:0}
.em-kv small{font-size:13px;color:var(--mut);font-weight:600;display:flex;align-items:center;gap:5px}
.em-kv small svg.i{width:14px;height:14px}
.em-kv b{font-size:13.5px;line-height:1.3}
.em-lbl{font-size:13px;font-weight:600;color:var(--ink-2);margin-bottom:6px;display:block}
.em-sticky{position:sticky;bottom:-28px;margin:16px -16px -28px;padding:10px 16px 14px;display:flex;gap:8px;background:color-mix(in srgb,var(--bg) 88%,transparent);backdrop-filter:blur(12px);border-top:1px solid var(--line);z-index:3}
.em-sticky .btn{flex:1}
@container main (min-width:761px){.em-sticky{display:none}}
@container main (max-width:900px){.em-cols,.em-cols.eq{grid-template-columns:minmax(0,1fr)}}
@container main (max-width:520px){.em-row.w2>.grow{flex:1 1 calc(100% - 60px)}.em-hd{flex-direction:column;align-items:stretch;gap:10px}.em-hd .sub{margin-top:0;font-size:13.5px}.em-hd .acts{justify-content:space-between}.em-row.w2{flex-wrap:wrap}.em-row.w2>.chip{margin-left:52px}}
`);

/* =====================================================================
   1 · Ma journée
   ===================================================================== */
P.css(`
.em-urg{border-radius:var(--r-lg);padding:16px;background:var(--bad-pale);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--bad) 30%,transparent);display:flex;flex-direction:column;gap:14px;min-width:0}
.em-urg.warn{background:var(--warn-pale);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--warn) 30%,transparent)}
.em-urg .eyebrow{color:var(--bad)}.em-urg.warn .eyebrow{color:var(--warn)}
.em-urg .ti{font:700 19px/1.2 var(--f-display);letter-spacing:-.02em}
.em-ctl{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:6px}
.em-ctl div{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:var(--ink-2);font-variant-numeric:tabular-nums}
.em-ctl i{height:6px;border-radius:3px;background:color-mix(in srgb,var(--ink) 14%,transparent)}
.em-ctl .ok i{background:var(--ok)}.em-ctl .warn i{background:var(--warn)}.em-ctl .bad i{background:var(--bad)}
.em-ctl .next{color:var(--bad)}.em-ctl .next i{background:color-mix(in srgb,var(--bad) 35%,transparent);animation:pulse 1.4s infinite}
.em-now{padding:20px;display:flex;flex-direction:column;gap:16px;overflow:hidden}
.em-now .eyebrow{color:color-mix(in srgb,var(--navy-ink) 68%,transparent)}
.em-now h2{font-size:26px;line-height:1.1;color:var(--navy-ink);letter-spacing:-.03em;transition:opacity var(--t-3)}
.em-now .sb2{font-size:14px;color:color-mix(in srgb,var(--navy-ink) 72%,transparent);margin-top:6px}
.em-now .em-ck{background:transparent;box-shadow:inset 0 0 0 2.5px color-mix(in srgb,var(--navy-ink) 45%,transparent)}
.em-now .em-ck.on{background:var(--ok);box-shadow:none}
.em-now .bar{background:color-mix(in srgb,var(--navy-ink) 16%,transparent);height:8px}
.em-now.fin h2{opacity:.45;text-decoration:line-through;text-decoration-thickness:2px}
.em-nb{background:color-mix(in srgb,var(--navy-ink) 13%,transparent);color:var(--navy-ink);box-shadow:none}
.em-nb:hover{background:color-mix(in srgb,var(--navy-ink) 20%,transparent)}
.em-pill{display:inline-flex;align-items:center;gap:6px;height:26px;padding:0 10px;border-radius:99px;font-size:13px;font-weight:600;background:color-mix(in srgb,var(--navy-ink) 13%,transparent);color:var(--navy-ink);font-variant-numeric:tabular-nums}
.em-pill::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--ok);animation:pulse 1.6s infinite}
.em-qa{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.em-qa button{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:7px;height:84px;border-radius:var(--r-lg);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line),var(--shadow-1);font-size:13px;font-weight:600;color:var(--ink);position:relative;transition:transform var(--t-1) var(--e-out),background var(--t-2)}
.em-qa button:active{transform:scale(.96)}.em-qa button:hover{background:var(--surface-2)}
.em-qa button svg.i{width:24px;height:24px;color:var(--acc)}
.em-qa button.al svg.i{color:var(--bad)}
.em-qa .bd{position:absolute;top:8px;right:10px;min-width:18px;height:18px;border-radius:9px;padding:0 5px;background:var(--bad);color:var(--acc-ink);font-size:13px;font-weight:700;display:grid;place-items:center}
.em-task{transition:opacity var(--t-3)}
.em-task.fin .t{text-decoration:line-through;opacity:.5}
.em-task.done .t{color:var(--mut);text-decoration:line-through;font-weight:500}
.em-task.done .em-tm{color:var(--mut-2)}
.em-more{display:flex;align-items:center;gap:8px;width:100%;padding:12px 16px;font-size:13px;font-weight:600;color:var(--mut);border-top:1px solid var(--line)}
.em-more svg.i{transition:transform var(--t-2) var(--e-out)}
.em-more[aria-expanded="true"] svg.i{transform:rotate(180deg)}
.em-cons{padding:14px 16px;display:flex;flex-direction:column;gap:10px;position:relative}
.em-cons+.em-cons{border-top:1px solid var(--line)}
.em-cons p{font-size:14px;line-height:1.45;color:var(--ink)}
.em-wx{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;text-align:center}
.em-wx div{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 0;border-radius:10px;font-size:13px}
.em-wx div:first-child{background:var(--acc-pale)}
.em-wx b{font-size:14px}
.em-ap{padding:12px 0;display:flex;flex-direction:column;gap:10px}
.em-ap+.em-ap{border-top:1px solid var(--line)}
.em-hb{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 10px 0 6px;border-radius:99px;background:var(--bg-2);font-size:13px;font-weight:600;color:var(--ink);margin-top:5px;max-width:100%}
.em-hb svg{width:16px;height:16px;flex:none}
.em-hb.no{background:var(--warn-pale);color:var(--warn);padding-left:10px}
.em-pa{width:44px;height:44px;border-radius:50%;display:grid;place-items:center;flex:none;box-shadow:inset 0 0 0 1.5px var(--line-2);color:var(--mut);transition:all var(--t-2) var(--e-out)}
.em-pa[aria-pressed="true"].y{background:var(--ok);color:var(--surface);box-shadow:none}
.em-pa[aria-pressed="true"].n{background:var(--bad);color:var(--surface);box-shadow:none}
.em-pa:active{transform:scale(.9)}
.em-pick{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px 0 4px}
.em-pick button{flex:none;height:36px;padding:0 12px;border-radius:99px;font-size:13px;font-weight:600;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2);white-space:nowrap}
.em-pick button small{color:var(--mut);font-weight:500;margin-left:4px}
.em-pick button.hot small{color:var(--warn)}
@container main (max-width:520px){.em-now h2{font-size:24px}.em-qa button{height:78px;font-size:13px}}
`);

function finishTask(id,root,draw){var t=tasks().find(function(x){return x.id===id});if(!t)return;
  var row=root.querySelector('[data-task="'+id+'"]'),c=row&&row.querySelector('.em-ck');
  if(t.done){t.done=false;var dt0=D.tasks.find(function(x){return x.id===id});if(dt0)dt0.done=false;draw();return}
  if(c){c.classList.add('on','go')}if(row)row.classList.add('fin');
  setTimeout(function(){t.done=true;var dt=D.tasks.find(function(x){return x.id===id});if(dt)dt.done=true;if(root.isConnected)draw();
    say('Tâche terminée : '+t.title,{undo:function(){t.done=false;if(dt)dt.done=false;if(root.isConnected)draw()}})},P.RM?10:620)}

function controlSheet(draw){var h=D.horse('h23'),nx=E.ctl.find(function(c){return !c.st}),v={dung:1,eat:1,water:1,mood:0},temp=37.8;
  var s=P.sheet({title:'Contrôle de '+(nx?nx.t:'Xanthos'),icon:'pulse',body:
   '<div class="stack" style="--g:16px"><div class="hrow">'+U.hav(h,'lg')+'<div class="grow"><b class="l">Xanthos · box B23</b><div class="s mut">Colique légère cette nuit. Dernier contrôle à 8 h : a recrotté, mange un peu.</div></div></div>'+
   '<div><span class="em-lbl">Crottins depuis 8 h</span>'+tri('dung',['Normaux','Peu','Aucun'],1)+'</div>'+
   '<div><span class="em-lbl">Appétit</span>'+tri('eat',['Mange bien','Un peu','Refuse'],1)+'</div>'+
   '<div><span class="em-lbl">Eau bue (abreuvoir connecté : 3,1 L par heure)</span>'+tri('water',['Normale','Peu','Rien'],1)+'</div>'+
   '<div><span class="em-lbl">Attitude</span>'+tri('mood',['Calme','Agité','Se roule'],0)+'</div>'+
   '<div class="hrow sp card flat" style="padding:10px 14px"><div><b>Température</b><div class="xs mut">Normale : 37,2 à 38,2 °C</div></div><div class="hrow" style="--g:12px"><button class="btn icon em-b" style="width:52px" data-tm="-1" title="Baisser">'+ICON('minus')+'</button><b class="num disp" style="font-size:24px;min-width:64px;text-align:center" data-tv>37,8°</b><button class="btn icon em-b" style="width:52px" data-tm="1" title="Monter">'+ICON('plus')+'</button></div></div>'+
   '<div class="note bad" data-warn style="display:none">'+ICON('alert','sm')+'<span><b>Un cheval qui se roule ou refuse de manger doit voir le vétérinaire sans attendre.</b> Appelez le Dr Leclerc et marchez Xanthos en main.</span></div></div>',
   foot:'<button class="btn em-b" data-vet>'+ICON('phone')+'Véto</button><button class="btn em-b pri" style="flex:1" data-save>Enregistrer le contrôle</button>'});
  bindTri(s,function(k,val){v[k]=val;s.querySelector('[data-warn]').style.display=(v.mood===2||v.eat===2)?'':'none'});
  on(s,'[data-tm]',function(b){temp=Math.round((temp+(+b.getAttribute('data-tm'))*.1)*10)/10;s.querySelector('[data-tv]').textContent=String(temp.toFixed(1)).replace('.',',')+'°'});
  s.querySelector('[data-vet]').onclick=function(){vetSheet(h)};
  s.querySelector('[data-save]').onclick=function(){var worst=Math.max(v.dung,v.eat,v.water,v.mood),txt=['Crottins normaux','Peu de crottins','Aucun crottin'][v.dung]+', '+['mange bien','mange un peu','refuse de manger'][v.eat]+', '+['calme','agité, se regarde les flancs','se roule'][v.mood]+'. '+String(temp.toFixed(1)).replace('.',',')+' °C.';
    if(nx){nx.st=['ok','warn','bad'][worst];nx.x=txt}(E.obs.h23=E.obs.h23||[]).unshift({who:E.who,when:'À l’instant',text:'Contrôle : '+txt,kind:'soin'});
    s.close();draw();say('Contrôle enregistré, Claire et le Dr Leclerc sont prévenus')}}

function lessonItems(it){if(it.priv)return {title:'Cours particulier',sub:hm(it.t)+' · Petite carrière · 45 min',riders:[it.rider],one:true};
  var l=D.lessons.find(function(x){return x.id===it.lesson});return {title:l.title,sub:hm(l.start)+' · Grand manège · '+l.dur+' min',riders:l.riders,l:l}}
function assignOf(it){if(it.priv)return {m019:'h01'};if(!E.assign){var l=D.lessons.find(function(x){return x.id===it.lesson});E.assign={};l.riders.forEach(function(r,i){E.assign[r]=(i===2||i===5)?null:l.horses[r]})}return E.assign}
function missing(){var it=D.empHugo.find(function(x){return x.lesson}),a=assignOf(it);return Object.keys(a).filter(function(k){return !a[k]}).length}
function lessonSheet(it,draw){var L=lessonItems(it),A=assignOf(it),W=workToday(),open=null,pr=E.pres[it.id]=E.pres[it.id]||{};
  function cands(){var used=Object.keys(A).map(function(k){return A[k]});return D.horses.filter(function(h){return h.kind==='club'&&h.status!=='bad'&&h.id!=='h06'&&used.indexOf(h.id)<0}).sort(function(a,b){return (W[a.id]||[]).length-(W[b.id]||[]).length}).slice(0,8)}
  function body(){var n=L.riders.length,y=L.riders.filter(function(r){return pr[r]==='y'}).length,no=L.riders.filter(function(r){return pr[r]==='n'}).length,miss=L.riders.filter(function(r){return !A[r]}).length;
    return (E.offline?'<div class="em-off">'+ICON('wifi')+'<span class="grow">Hors ligne. L’appel et les chevaux attribués restent sur le téléphone et partent vers la feuille de monte dès le retour du réseau.</span></div>':'')+'<div class="hrow sp wrap" style="margin-bottom:6px"><div><b class="l">'+L.title+'</b><div class="s mut">'+L.sub+'</div></div><div class="hrow wrap" style="--g:6px">'+U.chip(y+' présent'+(y>1?'s':''),'ok',true)+(no?U.chip(no+' absent'+(no>1?'s':''),'bad',true):'')+(n-y-no?U.chip((n-y-no)+' à pointer','',true):'')+'</div></div>'+
     (miss?'<div class="note warn" style="margin:10px 0 2px">'+ICON('alert','sm')+'<span><b>'+miss+' cheva'+(miss>1?'ux':'l')+' à attribuer.</b> Tornado et Opale sont arrêtés. Touchez « Choisir un cheval » ou laissez Stabl proposer.</span></div>':'')+
     L.riders.map(function(r){var m=D.member(r),h=A[r]&&D.horse(A[r]),w=h?(W[h.id]||[]).length:0;
      return '<div class="em-ap"><div class="hrow">'+U.av(r,'lg')+'<div class="grow"><div class="b" style="font-size:15px">'+m.first+' '+m.last+'</div><div class="xs mut">Galop '+m.galop+(m.licence!=='2027'?' · licence à renouveler':'')+'</div>'+
       '<button class="em-hb'+(h?'':' no')+'" data-h="'+r+'">'+(h?HORSE_GLYPH()+'<span class="ellip">'+h.name+'</span><span class="mut" style="font-weight:500">· '+(w+1)+(w?'e':'re')+' heure du jour</span>':ICON('alert','sm')+'Choisir un cheval')+ICON('down','sm')+'</button></div>'+
       '<button class="em-pa y" data-pr="y" data-r="'+r+'" aria-pressed="'+(pr[r]==='y')+'" title="Présent">'+ICON('check')+'</button><button class="em-pa n" data-pr="n" data-r="'+r+'" aria-pressed="'+(pr[r]==='n')+'" title="Absent">'+ICON('x')+'</button></div>'+
       (open===r?'<div class="em-pick fade">'+cands().map(function(c){var k=(W[c.id]||[]).length;return '<button data-pk="'+c.id+'" data-r="'+r+'" class="'+(k>=2?'hot':'')+'">'+c.name+'<small>'+(k?k+' h déjà':'repos')+'</small></button>'}).join('')+'</div>':'')+'</div>'}).join('')}
  var s=P.sheet({title:'Appel et chevaux',icon:'whistle',body:function(b){b.innerHTML=body()},foot:(L.one?'':'<button class="btn em-b" data-auto>'+ICON('repeat')+'Proposer</button>')+'<button class="btn em-b pri" style="flex:1" data-close>Clôturer l’appel</button>'});
  var b=s.querySelector('.sb');function re(){var st=b.scrollTop;b.innerHTML=body();b.scrollTop=st}
  on(s,'[data-pr]',function(x){var r=x.getAttribute('data-r'),val=x.getAttribute('data-pr');pr[r]=pr[r]===val?null:val;re()});
  on(s,'[data-h]',function(x){if(L.one){P.toast('Ulysse est le cheval de sa demi-pensionnaire',{icon:'info'});return}var r=x.getAttribute('data-h');open=open===r?null:r;re()});
  on(s,'[data-pk]',function(x){A[x.getAttribute('data-r')]=x.getAttribute('data-pk');open=null;re();P.toast(D.horse(x.getAttribute('data-pk')).name+' attribué à '+D.member(x.getAttribute('data-r')).first)});
  var au=s.querySelector('[data-auto]');if(au)au.onclick=function(){var n=0;L.riders.forEach(function(r){if(!A[r]){var c=cands()[0];if(c){A[r]=c.id;n++}}});open=null;re();P.toast(n?n+' chevaux proposés selon leur charge de travail du jour':'Tous les cavaliers ont déjà un cheval',{icon:'assistant'})};
  s.querySelector('[data-close]').onclick=function(){var miss=L.riders.filter(function(r){return !A[r]}).length;if(miss){P.toast('Il reste '+miss+' cheva'+(miss>1?'ux':'l')+' à attribuer',{icon:'alert'});return}
    var y=0,no=0;L.riders.forEach(function(r){if(pr[r]==='n')no++;else{pr[r]='y';y++}});it.done=true;it.queued=E.offline;s.close();draw();say('Appel enregistré : '+y+' présent'+(y>1?'s':'')+(no?', '+no+' absent'+(no>1?'s':''):'')+'. Feuille de monte à jour')};
  return s}

function contactSheet(id){var p=D.staffer(id),s=P.sheet({title:p.first+' '+p.last,icon:'user',body:'<div class="stack" style="--g:12px"><div class="hrow">'+U.av(p,'xl')+'<div><b class="l">'+p.role+'</b><div class="s mut">'+(D.empPresence.find(function(x){return x.id===id})||{}).txt+'</div></div></div><div class="g2" style="--g:8px"><button class="btn em-b" data-c="call">'+ICON('phone')+'Appeler</button><button class="btn em-b pri" data-c="msg">'+ICON('chat')+'Écrire</button></div></div>'});
  on(s,'[data-c]',function(b){s.close();if(b.getAttribute('data-c')==='call')P.toast('Appel de '+p.first+' en cours',{icon:'phone'});else P.go('emp-messages',{id:id==='s01'?'cl':id==='s06'?'lu':'eq'})})}

/* ---------- Personnaliser la journée : raccourcis, blocs, apparence ---------- */
var QA={signaler:['alert','Signaler','Un problème, avec photo'],scan:['qr','Scanner','Le QR code d’un box'],puce:['scan','Lire la puce','Le transpondeur d’un cheval'],soins:['care','Soins','Soins du jour à valider'],pointage:['clockin','Pointage','Arrivée, pause, départ'],messages:['chat','Messages','Équipe et consignes'],tournee:['stable','Tournée','La tournée des boxes'],chevaux:['horse','Chevaux','Fiches et paddocks'],conges:['holiday','Congés','Demandes et soldes'],vet:['phone','Vétérinaire','Appeler le Dr Leclerc']};
var QA0=['signaler','scan','puce','soins'];
var QD={signaler:'em-dbad',scan:'d-chevaux',puce:'d-chevaux',tournee:'d-chevaux',chevaux:'d-chevaux',soins:'d-soins',vet:'d-soins',pointage:'d-equipe',conges:'d-equipe',messages:'d-cavaliers'};
var BLK=[['urg','Urgence du jour','alert','L','Colique de Xanthos, attributions manquantes'],['now','Tâche en cours','today','L','Ce que vous faites maintenant'],['sum','Ma journée en chiffres','gauge','R','Tâches, boxes et soins restants'],['qa','Raccourcis','grid','L','Vos quatre boutons'],['next','Ensuite','list','L','Le reste de la journée'],['cons','Consignes de Claire','chat','R','Les consignes à lire'],['wx','Météo de l’écurie','cloud','R','Pluie, froid, couvertures'],['pres','Présents aujourd’hui','members','R','Qui est où']];
function jourPrefs(){var p=P.prefs.get('emp:jour',null)||{};var qa=(p.qa||QA0).filter(function(k){return QA[k]}).slice(0,4);if(!qa.length)qa=QA0.slice();
  var bl=(p.blocks||[]).filter(function(b){return BLK.some(function(x){return x[0]===b.id})});BLK.forEach(function(x){if(!bl.some(function(b){return b.id===x[0]}))bl.push({id:x[0],on:true})});
  return {qa:qa,blocks:bl,big:!!p.big}}
function saveJour(o){P.prefs.set('emp:jour',o)}
function themeNow(){var t=document.documentElement.getAttribute('data-theme');return t==='dark'||t==='light'?t:'auto'}
function setTheme(v){var r=document.documentElement;if(v==='auto'){r.removeAttribute('data-theme');P.store.set('theme',null)}else{r.setAttribute('data-theme',v);P.store.set('theme',v)}}
P.css(`
.em-big{zoom:1.12}
.em-qs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.em-qs button{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--r-md);text-align:left;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2);min-width:0;transition:box-shadow var(--t-2),background var(--t-2)}
.em-qs button svg.i{color:var(--mut);flex:none}
.em-qs button b{display:block;font-size:13.5px}.em-qs button small{display:block;font-size:13px;color:var(--mut);line-height:1.3;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;overflow:hidden}
.em-qs button{align-items:flex-start}.em-qs button svg.i,.em-qs .n{margin-top:2px}
.em-qs button[aria-pressed="true"]{box-shadow:inset 0 0 0 2px var(--acc);background:var(--acc-pale)}
.em-qs button[aria-pressed="true"] svg.i{color:var(--acc)}
.em-qs .n{margin-left:auto;flex:none;width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:13px;font-weight:700;background:var(--acc);color:var(--acc-ink)}
.em-bl{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line);background:var(--surface);transition:opacity var(--t-2)}
.em-bl.off{opacity:.55}
.em-bl .mv{display:flex;gap:2px;flex:none}
.em-pu{position:relative;height:190px;border-radius:var(--r-lg);background:linear-gradient(160deg,var(--bg-2),var(--acc-pale));display:grid;place-items:center;overflow:hidden;box-shadow:inset 0 0 0 1px var(--line)}
.em-pu .pd{width:74px;height:120px;border-radius:16px;background:var(--surface);box-shadow:0 0 0 3px var(--ink),var(--shadow-2);display:grid;place-items:center;color:var(--acc);position:relative;z-index:1;margin:0}
.em-pu .pd svg.i{width:30px;height:30px}
.em-pu i{position:absolute;left:50%;top:50%;width:90px;height:90px;margin:-45px 0 0 -45px;border-radius:50%;box-shadow:0 0 0 2px var(--acc);opacity:0;animation:em-wave 1.8s var(--e-out) infinite}
.em-pu i:nth-of-type(2){animation-delay:.6s}.em-pu i:nth-of-type(3){animation-delay:1.2s}
.em-pu.ok i{animation:none;opacity:0}
.em-pu.ok .pd{color:var(--ok);box-shadow:0 0 0 3px var(--ok),var(--shadow-2)}
@keyframes em-wave{from{opacity:.7;transform:scale(.6)}to{opacity:0;transform:scale(2.2)}}
.em-chip{font:600 15px var(--f-mono);letter-spacing:.04em;font-variant-numeric:tabular-nums}
`);
function persoSheet(draw){var o=jourPrefs();
  function body(){var th=themeNow();
    return '<div class="stack" style="--g:18px"><div><span class="em-lbl">Mes quatre raccourcis · '+o.qa.length+' sur 4</span><div class="em-qs">'+Object.keys(QA).map(function(k){var q=QA[k],i=o.qa.indexOf(k);return '<button type="button" data-q="'+k+'" aria-pressed="'+(i>=0)+'">'+ICON(q[0])+'<span style="min-width:0"><b>'+q[1]+'</b><small>'+q[2]+'</small></span>'+(i>=0?'<span class="n">'+(i+1)+'</span>':'')+'</button>'}).join('')+'</div></div>'+
     '<div><span class="em-lbl">Blocs affichés et leur ordre</span><div class="stack" style="--g:6px">'+o.blocks.map(function(b,i){var x=BLK.find(function(y){return y[0]===b.id});return '<div class="em-bl'+(b.on?'':' off')+'">'+ico(x[2],'sm')+'<div class="grow" style="min-width:0"><div class="b s">'+x[1]+'</div><div class="xs mut ellip">'+x[4]+'</div></div><span class="mv"><button class="btn ghost icon sm" data-up="'+i+'" title="Monter"'+(i===0?' disabled':'')+'>'+ICON('up','sm')+'</button><button class="btn ghost icon sm" data-dn="'+i+'" title="Descendre"'+(i===o.blocks.length-1?' disabled':'')+'>'+ICON('down','sm')+'</button></span><button class="tog" role="switch" aria-checked="'+b.on+'" data-manual data-bt="'+i+'" title="Afficher ou masquer '+x[1]+'"></button></div>'}).join('')+'</div></div>'+
     '<div><span class="em-lbl">Apparence</span>'+U.seg([['auto','Automatique'],['light',ICON('sun','sm')+'Clair'],['dark',ICON('moon','sm')+'Sombre']],th,'data-th')+'</div>'+
     '<div class="card flat"><div class="li"><div class="grow"><div class="t">Texte plus grand</div><div class="s">Plus lisible au soleil ou avec des gants</div></div><button class="tog" role="switch" aria-checked="'+o.big+'" data-manual data-big title="Texte plus grand"></button></div></div></div>'}
  var s=P.sheet({title:'Personnaliser ma journée',icon:'sliders',body:function(b){b.innerHTML=body()},foot:'<button class="btn em-b ghost" data-reset>'+ICON('refresh')+'Rétablir</button><button class="btn em-b pri" style="flex:1" data-ok>Terminé</button>'});
  var b=s.querySelector('.sb');function re(){var st=b.scrollTop;b.innerHTML=body();b.scrollTop=st;saveJour(o);draw()}
  on(s,'[data-q]',function(x){var k=x.getAttribute('data-q'),i=o.qa.indexOf(k);if(i>=0){if(o.qa.length===1){P.toast('Gardez au moins un raccourci',{icon:'info'});return}o.qa.splice(i,1)}else{if(o.qa.length>=4){P.toast('Quatre raccourcis au plus : retirez-en un d’abord',{icon:'info'});return}o.qa.push(k)}re()});
  on(s,'[data-up]',function(x){var i=+x.getAttribute('data-up');o.blocks.splice(i-1,0,o.blocks.splice(i,1)[0]);re()});
  on(s,'[data-dn]',function(x){var i=+x.getAttribute('data-dn');o.blocks.splice(i+1,0,o.blocks.splice(i,1)[0]);re()});
  on(s,'[data-bt]',function(x){var bl=o.blocks[+x.getAttribute('data-bt')];bl.on=!bl.on;re()});
  on(s,'[data-th]',function(x){setTheme(x.getAttribute('data-th'));re()});
  on(s,'[data-big]',function(){o.big=!o.big;re()});
  s.querySelector('[data-reset]').onclick=function(){o={qa:QA0.slice(),blocks:BLK.map(function(x){return {id:x[0],on:true}}),big:false};re();P.toast('Disposition par défaut rétablie',{icon:'refresh'})};
  s.querySelector('[data-ok]').onclick=function(){s.close();P.toast('Ma journée est enregistrée sur ce téléphone',{icon:'sliders'})};
  return s}

/* ---------- Lire la puce : le transpondeur sous la crinière ---------- */
function chipFmt(c){return String(c).replace(/(\d{3})(?=\d)/g,'$1 ')}
function puceSheet(){var T=tourState(),order=[],c=tourCur();if(c>=0)order.push(T.boxes[c].h);['h12','h23','h04','h16'].forEach(function(id){if(order.indexOf(id)<0&&D.horse(id))order.push(id)});var k=0,tm=null;
  var s=P.sheet({title:'Lire la puce',icon:'scan',body:function(b){b.innerHTML='<div data-pz></div>'},foot:'<button class="btn em-b" data-again disabled>'+ICON('refresh')+'Autre puce</button><button class="btn em-b pri" style="flex:1" data-open disabled>'+ICON('horse')+'Ouvrir la fiche</button>'});
  var z=s.querySelector('[data-pz]'),bo=s.querySelector('[data-open]'),ba=s.querySelector('[data-again]');
  function read(){bo.disabled=ba.disabled=true;
    z.innerHTML='<div class="stack" style="--g:14px"><div class="em-pu"><i></i><i></i><i></i><span class="pd">'+ICON('scan')+'</span></div><div class="b" style="font-size:15px;text-align:center">Approchez le téléphone de l’encolure</div><div class="s mut" style="text-align:center">Côté gauche, sous la crinière, à mi-hauteur. Le lecteur répond en moins de deux secondes.</div></div>';
    clearTimeout(tm);tm=setTimeout(function(){if(!s.isConnected)return;var h=D.horse(order[k%order.length]),note=D.empNotes[h.id]||h.alerts[0];z.querySelector('.em-pu').classList.add('ok');
      z.innerHTML='<div class="stack pop" style="--g:14px"><div class="em-pu ok" style="height:110px"><span class="pd" style="width:56px;height:56px;border-radius:50%">'+ICON('check')+'</span></div><div class="hrow">'+U.hav(h,'lg')+'<div class="grow"><div class="b" style="font-size:17px">'+h.name+'</div><div class="s mut">Box '+h.box+' · '+h.breed+' · '+h.sex.toLowerCase()+' de '+h.age+' ans</div></div></div>'+
       '<div class="stack" style="--g:8px"><div class="em-kv"><small>'+ICON('scan')+'Puce</small><b class="em-chip">'+chipFmt(h.chip)+'</b></div><div class="em-kv"><small>'+ICON('doc')+'SIRE</small><b class="num">'+h.sire+'</b></div></div>'+
       (note?'<div class="note '+(h.status==='bad'?'bad':'warn')+'">'+ICON('alert','sm')+'<span><b>Consigne :</b> '+note+'</span></div>':'<div class="note ok">'+ICON('checkc','sm')+'<span>Identité confirmée. Aucune consigne particulière aujourd’hui.</span></div>')+'</div>';
      bo.disabled=ba.disabled=false;say('Puce lue : '+h.name+', box '+h.box,{icon:'scan'})},P.RM?60:1700)}
  bo.onclick=function(){var h=order[k%order.length];s.close();P.go('emp-cheval',{id:h})};
  ba.onclick=function(){k++;read()};read();return s}

P.mod({id:'emp-jour',role:'employe',group:'Ma journée',title:'Aujourd’hui',icon:'today',n:10,short:'Journée',phoneTitle:'Bonjour Antoine',
 badge:function(){var n=tasksLeft();return n?{v:n}:null},
 render:function(el,ctx){var first=true,showDone=false;
  function draw(){var p=me(),T=tasks(),mt=$('.mt',P.app()),O=jourPrefs();if(mt)mt.textContent='Bonjour '+p.first;
   var left=T.filter(function(t){return !t.done}),done=T.filter(function(t){return t.done}),now=mon()?left.filter(function(t){return t.priv||t.lesson})[0]:left[0],rest=left.filter(function(t){return t!==now});
   var who=U.seg([['s05',U.av('s05','sm')+'Antoine'],['s02',U.av('s02','sm')+'Hugo']],E.who,'data-who');
   var h=hd('Bonjour '+p.first,'Mardi 17 novembre · 9 h 41 · '+p.role+(mon()?' · arrivée à 10 h':''),
     who+'<span class="hrow" style="--g:6px"><button class="btn icon" data-perso title="Personnaliser ma journée">'+ICON('sliders')+'</button><button class="btn icon" data-net title="Simuler une coupure du réseau">'+ICON('wifi')+'</button></span>');
   var B={};
   /* urgence */
   if(!mon()){var nx=E.ctl.find(function(c){return !c.st});
    B.urg='<div class="em-urg"><div class="hrow" style="--g:12px;align-items:flex-start">'+U.hav('h23','lg')+'<div class="grow"><div class="eyebrow">Urgence · colique sous surveillance</div><div class="ti">Xanthos · box B23</div><div class="s" style="color:var(--ink-2);margin-top:3px">'+(nx&&nx.t==='10 h'?'Prochain contrôle à 10 h, dans 19 minutes. Il boit 40 % de moins depuis hier soir.':'Contrôle de 10 h noté. Prochain contrôle à 12 h, vétérinaire à 14 h.')+'</div></div></div>'+
     '<div class="em-ctl">'+E.ctl.map(function(c){return '<div class="'+(c.st||(c===nx?'next':''))+'" title="'+(c.x||'À faire')+'"><i></i>'+c.t+'</div>'}).join('')+'</div>'+
     '<div class="hrow" style="--g:8px"><button class="btn em-b dark grow" data-ctl>'+ICON('pulse')+'Noter le contrôle</button><button class="btn em-b icon" style="width:52px" data-vet title="Appeler le vétérinaire">'+ICON('phone')+'</button><button class="btn em-b icon" style="width:52px" data-go="emp-cheval" data-id="h23" title="Ouvrir la fiche de Xanthos">'+ICON('horse')+'</button></div></div>'}
   else if(missing()){B.urg='<div class="em-urg warn"><div class="hrow" style="--g:12px;align-items:flex-start">'+ico('alert','lg','var(--warn)')+'<div class="grow"><div class="eyebrow">À régler avant 19 h</div><div class="ti">'+missing()+' cavaliers sans cheval</div><div class="s" style="color:var(--ink-2);margin-top:3px">Tornado et Opale sont arrêtés. La reprise Adultes Galop 4 doit être réattribuée.</div></div></div><button class="btn em-b dark" data-les="g5">'+ICON('swap')+'Attribuer les chevaux</button></div>'}
   /* maintenant */
   if(now){var tp=E.tour?E.tour.boxes.filter(function(b){return b.st}).length:5,isL=now.priv||now.lesson,rd=isL&&lessonItems(now);
    B.now='<div class="card navy em-now'+(first?'':' pop')+'" data-task="'+now.id+'"><div class="hrow sp"><span class="eyebrow">'+(isL?'Prochaine reprise · '+hm(now.t):now.t<='09:41'?'Maintenant · depuis '+hm(now.t):'À suivre · à '+hm(now.t))+'</span>'+(isL?'<span class="em-pill">dans '+(function(t){var d=(+t.slice(0,2))*60+(+t.slice(3))-581;return Math.floor(d/60)+' h '+String(d%60).padStart(2,'0')})(now.t)+'</span>':now.t<='09:41'?'<span class="em-pill">41 min</span>':'')+'</div>'+
     '<div class="hrow" style="--g:14px;align-items:flex-start">'+(isL?'':ck(now.id,false,'xl'))+'<div class="grow"><h2>'+(now.priv?'Cours particulier de '+D.member(now.rider).first:now.title)+'</h2><div class="sb2">'+(now.priv?'Sur Ulysse de la Roche · '+now.zone:isL?now.zone+' · '+rd.riders.length+' cavaliers':now.zone)+'</div></div></div>'+
     (now.tour?'<div class="stack" style="--g:8px">'+U.bar(tp/16*100)+'<div class="hrow sp s" style="color:color-mix(in srgb,var(--navy-ink) 72%,transparent)"><span>Tournée en cours</span><b class="num" style="color:var(--navy-ink)">'+tp+' boxes sur 16</b></div></div>':'')+
     '<div class="hrow" style="--g:8px">'+(now.tour?'<button class="btn em-b pri grow" data-go="emp-tournee">Continuer la tournée'+ICON('arrow')+'</button>':isL?'<button class="btn em-b pri grow" data-les="'+now.id+'">'+ICON('check')+'Faire l’appel</button>'+(now.priv?'<button class="btn em-b em-nb" data-go="emp-cheval" data-id="h01">'+ICON('horse')+'Ulysse</button>':''):now.go?'<button class="btn em-b pri grow" data-go="'+now.go+'">Ouvrir les soins'+ICON('arrow')+'</button>':'<button class="btn em-b pri grow" data-fin="'+now.id+'">'+ICON('check')+'C’est fait</button>')+'</div></div>'}
   else B.now='<div class="card navy em-now pop"><div class="hrow"><span class="strass" style="background:var(--navy-ink)"></span><span class="eyebrow">Journée bouclée</span></div><h2>Tout est fait. Bonne soirée '+p.first+'.</h2><div class="sb2" style="margin-top:-8px">'+T.length+' tâches terminées. Pensez à pointer votre départ.</div><button class="btn em-b pri" data-go="emp-pointage">'+ICON('clockin')+'Pointer mon départ</button></div>';
   /* la journée en chiffres : trois tuiles teintées, chacune mène à son écran */
   var TT=tourState(),bxl=TT.boxes.filter(function(b){return !b.st}).length,cl=careLeft();
   var SUM=mon()?[['d-equipe','today',left.length,'tâche'+(left.length>1?'s':'')+' à faire','',''],['d-cavaliers','members',9,'cavaliers ce soir','',''],['d-chevaux','horse',missing(),missing()?'chevaux à attribuer':'chevaux attribués','data-les="g5"',missing()?'em-hot':'']]
     :[['d-equipe','today',left.length,'tâche'+(left.length>1?'s':'')+' à faire','',''],['d-chevaux','stable',bxl,'box'+(bxl>1?'es':'')+' à visiter','data-go="emp-tournee"',''],['d-soins','care',cl,'soin'+(cl>1?'s':'')+' à donner','data-go="emp-soins"',cl?'em-hot':'']];
   B.sum='<div class="em-sum">'+SUM.map(function(t){return '<'+(t[4]?'button '+t[4]:'div')+' class="card tint em-sm '+t[0]+' '+t[5]+'"><span class="ico sm">'+ICON(t[1])+'</span><b class="big num"'+(first?' data-count="'+t[2]+'"':'')+'>'+t[2]+'</b><span class="lb">'+t[3]+'</span>'+(t[4]?'<span class="go">'+ICON('arrow','sm')+'</span>':'')+'</'+(t[4]?'button':'div')+'>'}).join('')+'</div>';
   /* raccourcis choisis */
   B.qa='<div class="em-qa" style="grid-template-columns:repeat('+O.qa.length+',minmax(0,1fr))">'+O.qa.map(function(k){var q=QA[k],lb=k==='pointage'?(E.clock.state==='out'?'Pointer':'Pointé'):q[1],at={signaler:'data-go="emp-signaler"',scan:'data-scan',puce:'data-puce',soins:'data-go="emp-soins"',pointage:'data-go="emp-pointage"',messages:'data-go="emp-messages"',tournee:'data-go="emp-tournee"',chevaux:'data-go="emp-chevaux"',conges:'data-go="emp-conges"',vet:'data-vet'}[k];
     return '<button '+at+(k==='signaler'?' class="al"':'')+'><span class="ico '+(QD[k]||'')+'">'+ICON(q[0])+'</span>'+lb+(k==='soins'&&careLeft()?'<span class="bd">'+careLeft()+'</span>':'')+'</button>'}).join('')+'</div>';
   /* suite */
   B.next='<div class="card"><div class="ch" style="padding-bottom:8px"><h3>'+(mon()?'Ma journée':'Ensuite')+'</h3><div class="hrow" style="--g:8px"><span class="s mut num">'+done.length+' sur '+T.length+' faites</span>'+U.ring(done.length/T.length*100,done.length,'var(--ok)',34)+'</div></div><div>'+
     (rest.length?rest.map(taskRow).join(''):'<div class="empty" style="padding:22px">'+ICON('checkc')+'<span class="s">Plus rien après cette tâche.</span></div>')+'</div>'+
     (done.length?'<button class="em-more" data-done aria-expanded="'+showDone+'">'+ICON('down','sm')+done.length+' tâche'+(done.length>1?'s':'')+' faite'+(done.length>1?'s':'')+' ce matin</button>'+(showDone?'<div>'+done.map(taskRow).join('')+'</div>':''):'')+'</div>';
   /* consignes */
   B.cons='<div class="card"><div class="ch"><h3>Consignes de Claire</h3><button class="btn ghost sm" data-go="emp-messages">Tout voir'+ICON('arrow','sm')+'</button></div><div style="padding-top:4px">'+D.empConsignes.slice(0,2).map(consRow).join('')+'</div></div>';
   /* météo */
   B.wx='<div class="card"><div class="ch"><h3>Météo de l’écurie</h3><span class="xs mut">Saint-Arnoult</span></div><div class="cb stack" style="--g:14px"><div class="hrow" style="--g:14px">'+ico('cloud','lg')+'<div class="disp num" style="font-size:36px;font-weight:700;line-height:1">9°</div><div class="grow s mut">Couvert, vent d’ouest 15 km/h. Il fera 3 °C cette nuit.</div></div>'+
     '<div class="em-wx">'+D.weather.map(function(w){return '<div><span class="xs mut">'+w.d+'</span>'+ICON(w.i)+'<b class="num">'+w.t+'°</b><span class="xs num '+(w.r>50?'acc b':'mut')+'">'+w.r+' %</span></div>'}).join('')+'</div>'+
     '<div class="note warn">'+ICON('rain','sm')+'<span>Pluie jeudi et vendredi : prairie du bas fermée, le groupe A sort au paddock d’hiver.</span></div></div></div>';
   /* présents */
   var PR=D.empPresence,nin=PR.filter(function(x){return x.st==='in'}).length;
   B.pres='<div class="card"><div class="ch" style="padding-bottom:6px"><h3>Présents aujourd’hui</h3>'+U.chip(nin+' sur '+PR.length,'ok',true)+'</div><div>'+PR.filter(function(x){return x.id!==E.who}).map(function(x){var s=D.staffer(x.id);return '<button class="em-row" data-st="'+x.id+'">'+U.av(s)+'<div class="grow"><div class="t">'+s.first+' '+s.last+' <span class="mut" style="font-weight:500;font-size:13px">· '+s.role+'</span></div><div class="s">'+x.txt+'</div></div><span class="em-st" style="--c:var(--'+(x.st==='in'?'ok':x.st==='later'?'warn':'mut-2')+')"></span></button>'}).join('')+'</div></div>';
   /* mise en page : une colonne sur téléphone dans l'ordre choisi, deux colonnes sur grand écran */
   var on1=O.blocks.filter(function(b){return b.on&&B[b.id]}),col=function(c){return on1.filter(function(b){return BLK.find(function(x){return x[0]===b.id})[3]===c}).map(function(b){return B[b.id]}).join('')};
   if(!on1.length)h+='<div class="card">'+U.empty('sliders','Aucun bloc affiché','Choisissez ce que vous voulez voir sur votre journée.','<button class="btn pri" data-perso>'+ICON('sliders','sm')+'Personnaliser</button>')+'</div>';
   else if(P.isMobile())h+='<div class="stack'+(first?' rise':'')+'" style="--g:14px">'+on1.map(function(b){return B[b.id]}).join('')+'</div>';
   else h+='<div class="em-cols"><div class="stack'+(first?' rise':'')+'" style="--g:14px">'+col('L')+'</div><div class="stack'+(first?' rise':'')+'" style="--g:14px">'+col('R')+'</div></div>';
   el.innerHTML='<div class="'+(O.big?'em-big':'')+'">'+h+'</div>';if(first)P.animate(el);first=false}
  function taskRow(t){var isL=t.priv||t.lesson;return '<div class="em-row em-task'+(t.done?' done':'')+(isL||t.go?' click':'')+'" data-task="'+t.id+'"'+(isL?' data-les="'+t.id+'"':'')+'><span class="em-tm">'+t.t+'</span><div class="grow"><div class="t">'+t.title+(t.priv?' · '+D.member(t.rider).first:'')+'</div><div class="s">'+t.zone+(t.lesson?' · 8 cavaliers':'')+'</div>'+(t.lesson&&missing()&&!t.done?'<div style="margin-top:6px">'+U.chip(missing()+' chevaux à attribuer','warn',true)+'</div>':'')+(t.queued?'<div style="margin-top:6px">'+U.chip('Appel gardé sur le téléphone, envoi au retour du réseau','warn',true)+'</div>':'')+'</div>'+(isL&&!t.done?'<span class="btn sm">Appel</span>':ck(t.id,t.done))+'</div>'}
  function consRow(c){var r=E.cons[c.id]||c.mine,n=c.read.length+(r&&!c.mine?1:0);return '<div class="em-cons">'+(c.urgent?'<div>'+U.chip('Prioritaire','bad',true)+'</div>':'')+'<p>'+c.text+'</p><div class="hrow sp"><span class="xs mut">Claire · '+c.when+' · lu par '+n+' sur 8</span>'+(r?'<span class="chip ok">'+ICON('check','sm')+'Lu'+(E.cons[c.id]?' à 9 h 41':'')+'</span>':'<button class="btn sm dark" data-read="'+c.id+'">'+ICON('check','sm')+'J’ai lu</button>')+'</div></div>'}
  on(el,'[data-who]',function(b){E.who=b.getAttribute('data-who');first=true;draw();P.toast('Vous voyez la journée de '+me().first+' '+me().last+', '+me().role.toLowerCase(),{icon:'user'})});
  on(el,'[data-net]',function(){E.offline=!E.offline;if(E.offline){E.queue=E.queue||2;draw();P.toast('Réseau perdu. Stabl continue de fonctionner sur le téléphone',{icon:'wifi'})}else{var n=E.queue;E.queue=0;unqueue();draw();P.toast('Réseau retrouvé : '+n+' actions synchronisées',{icon:'wifi'})}});
  online(el,draw);
  on(el,'[data-perso]',function(){persoSheet(draw)});
  on(el,'[data-puce]',function(){puceSheet()});
  on(el,'[data-ck]',function(b,e){e.stopPropagation();finishTask(b.getAttribute('data-ck'),el,draw)});
  on(el,'[data-fin]',function(b){finishTask(b.getAttribute('data-fin'),el,draw)});
  on(el,'[data-ctl]',function(){controlSheet(draw)});
  on(el,'[data-vet]',function(){vetSheet(D.horse('h23'))});
  on(el,'[data-les]',function(b,e){if(e.target.closest('[data-ck]'))return;var it=D.empHugo.find(function(x){return x.id===b.getAttribute('data-les')});if(it)lessonSheet(it,draw)});
  on(el,'.em-task.click',function(b,e){if(e.target.closest('[data-ck]')||b.hasAttribute('data-les'))return;var t=tasks().find(function(x){return x.id===b.getAttribute('data-task')});if(t&&t.go)P.go(t.go)});
  on(el,'[data-done]',function(){showDone=!showDone;draw()});
  on(el,'[data-read]',function(b){E.cons[b.getAttribute('data-read')]=true;draw();say('Accusé de lecture envoyé à Claire')});
  on(el,'[data-st]',function(b){contactSheet(b.getAttribute('data-st'))});
  on(el,'[data-scan]',function(){scanSheet(function(i){P.go('emp-tournee',{jump:i})})});
  draw()}});
function careLeft(){return D.empCare.filter(function(c){return !c.done&&!E.care[c.id]}).length}

/* =====================================================================
   2 · Tournée des boxes (moment phare)
   ===================================================================== */
P.css(`
.em-tour{display:grid;grid-template-columns:minmax(0,430px) minmax(0,1fr);gap:28px;align-items:start}
.em-tcol{display:flex;flex-direction:column;gap:14px;min-width:0}
.em-prog{display:flex;flex-direction:column;gap:10px}
.em-prog .big{font:700 26px/1 var(--f-display);letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.em-prog .big small{font-size:15px;color:var(--mut);font-weight:600;letter-spacing:0}
.em-segs{display:grid;grid-auto-flow:column;grid-auto-columns:1fr;gap:3px}
.em-segs i{height:8px;border-radius:3px;background:var(--line-2);transition:background var(--t-3) var(--e-out),transform var(--t-3) var(--e-spring)}
.em-segs i.ok{background:var(--ok)}.em-segs i.warn{background:var(--warn)}.em-segs i.bad{background:var(--bad)}
.em-segs i.cur{background:var(--acc);transform:scaleY(1.5)}
.em-segs i.new{animation:em-seg .5s var(--e-spring)}
@keyframes em-seg{from{transform:scaleY(2.4)}}
.em-stack{position:relative;height:446px;touch-action:pan-y}
.em-card{position:absolute;inset:0;border-radius:var(--r-xl);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line),var(--shadow-2);padding:16px;display:flex;flex-direction:column;gap:12px;user-select:none;-webkit-user-select:none;touch-action:pan-y;will-change:transform;cursor:grab;overflow:hidden}
.em-card:active{cursor:grabbing}
.em-card.b1{transform-origin:50% 100%;transform:translateY(11px) scale(.95);box-shadow:inset 0 0 0 1px var(--line),var(--shadow-1);pointer-events:none;transition:transform var(--t-3) var(--e-out)}
.em-card.b2{transform-origin:50% 100%;transform:translateY(22px) scale(.9);box-shadow:inset 0 0 0 1px var(--line);pointer-events:none}
.em-card.b1>*,.em-card.b2>*{opacity:.35}
.em-card.em-new{animation:em-in var(--t-4) var(--e-spring) both}
@keyframes em-in{from{transform:translateY(11px) scale(.95)}}
.em-card .nm{font:700 21px/1.15 var(--f-display);letter-spacing:-.025em}
.em-bx{font:700 15px var(--f-mono);padding:6px 10px;border-radius:10px;background:var(--navy);color:var(--navy-ink);flex:none;letter-spacing:.02em}
.em-cn{display:flex;gap:8px;padding:9px 11px;border-radius:var(--r-md);background:var(--warn-pale);font-size:13px;line-height:1.35;color:var(--ink);font-weight:500}
.em-cn svg.i{color:var(--warn);margin-top:1px;width:16px;height:16px}
.em-cn.calm{background:var(--surface-2);color:var(--ink-2)}.em-cn.calm svg.i{color:var(--mut)}
.em-cn span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.em-q{display:grid;grid-template-columns:76px minmax(0,1fr);gap:8px;align-items:center;font-size:13px;font-weight:600;color:var(--ink-2)}
.em-stamp{position:absolute;top:18px;padding:6px 12px;border-radius:10px;font:800 15px var(--f-display);letter-spacing:.06em;text-transform:uppercase;opacity:0;pointer-events:none;z-index:2;background:var(--surface)}
.em-stamp.ok{left:16px;color:var(--ok);box-shadow:inset 0 0 0 3px var(--ok);transform:rotate(-8deg)}
.em-stamp.bad{right:16px;color:var(--bad);box-shadow:inset 0 0 0 3px var(--bad);transform:rotate(8deg)}
.em-acts{display:grid;grid-template-columns:minmax(0,1fr) 60px minmax(0,1.25fr);gap:8px;margin-top:22px}
.em-acts button{height:60px;border-radius:var(--r-lg);display:flex;align-items:center;justify-content:center;gap:8px;font-weight:700;font-size:15.5px;transition:transform var(--t-1) var(--e-out),background var(--t-2)}
.em-acts button:active{transform:scale(.95)}
.em-acts button svg.i{width:22px;height:22px}
.em-acts .no{background:var(--surface);color:var(--bad);box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--bad) 55%,transparent)}
.em-acts .sc{background:var(--surface);color:var(--ink);box-shadow:inset 0 0 0 1px var(--line-2),var(--shadow-1)}
.em-acts .yes{background:var(--ok);color:var(--surface);box-shadow:0 8px 18px -8px color-mix(in srgb,var(--ok) 70%,transparent)}
.em-hint{display:flex;justify-content:space-between;align-items:center;font-size:13px;color:var(--mut);font-weight:500;min-height:30px}
.em-fin{padding:28px 20px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;border-radius:var(--r-xl);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line),var(--shadow-2)}
.em-fin .rg{width:84px;height:84px;border-radius:50%;background:var(--acc);display:grid;place-items:center;position:relative;animation:pop var(--t-4) var(--e-spring) both}
.em-fin .rg svg{width:42px;height:42px;fill:none;stroke:var(--acc-ink);stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:22;stroke-dashoffset:22;animation:em-draw .5s var(--e-out) .25s forwards}
@keyframes em-draw{to{stroke-dashoffset:0}}
.em-fin .rg .strass{position:absolute;top:-4px;right:-6px;width:20px;height:20px}
.em-fin h2{font-size:24px}
.em-cam{position:relative;height:280px;border-radius:var(--r-lg);overflow:hidden;background:radial-gradient(120% 90% at 50% 20%,#3a2d22,#17110c 70%);display:grid;place-items:center}
.em-cam .door{width:150px;height:170px;border-radius:8px;background:linear-gradient(#e9e2d4,#d5cbb8);display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px;transform:perspective(500px) rotateY(-9deg) rotateX(3deg);box-shadow:0 20px 40px -10px #000}
.em-cam .door b{font:800 20px var(--f-display);color:#1b1408;letter-spacing:.02em}
.em-cam .door svg{width:100px;height:100px}
.em-cam .fr{position:absolute;width:190px;height:190px;border-radius:22px;box-shadow:0 0 0 2000px rgba(0,0,0,.42);transition:all var(--t-3) var(--e-spring)}
.em-cam .fr::before,.em-cam .fr::after{content:"";position:absolute;inset:-2px;border-radius:24px;border:3px solid #fff;clip-path:polygon(0 0,26% 0,26% 26%,0 26%,0 74%,26% 74%,26% 100%,0 100%,0 0,100% 0,100% 26%,74% 26%,74% 0,100% 0,100% 100%,74% 100%,74% 74%,100% 74%,100% 100%,0 100%);transition:border-color var(--t-2)}
.em-cam .ln{position:absolute;left:50%;top:50%;width:170px;height:2px;margin-left:-85px;background:#8ea4ff;box-shadow:0 0 14px 2px #6f8cff;animation:em-scan 1.5s var(--e-in-out) infinite alternate}
@keyframes em-scan{from{transform:translateY(-84px)}to{transform:translateY(84px)}}
.em-cam.found .ln{display:none}
.em-cam.found .fr{width:150px;height:150px}
.em-cam.found .fr::before,.em-cam.found .fr::after{border-color:#3ccf95}
.em-cam .tx{position:absolute;left:0;right:0;bottom:12px;text-align:center;color:#fff;font-size:13px;font-weight:600}
.em-cam .hit{position:absolute;top:14px;left:50%;transform:translateX(-50%);background:#0f9d6b;color:#fff;font-weight:700;font-size:14px;padding:8px 14px;border-radius:99px;white-space:nowrap;display:flex;gap:6px;align-items:center}
@container main (max-width:900px){.em-tour{grid-template-columns:minmax(0,1fr)}.em-tside{display:none}}
@container main (min-width:901px){.em-tlist{display:none}}
@container main (max-width:520px){.em-thd .ph{display:none}}
`);

function tourState(){if(!E.tour)E.tour={min:39,cur:null,hist:[],boxes:D.horses.slice(0,16).map(function(h,i){return {h:h.id,st:i<5?(i===3?'bad':'ok'):null,chk:{eat:0,dung:0,water:0},why:i===3?'N’a pas fini sa ration':''}})};return E.tour}
function tourCur(){var T=tourState();if(T.cur!=null&&!T.boxes[T.cur].st)return T.cur;for(var i=0;i<T.boxes.length;i++)if(!T.boxes[i].st)return i;return -1}
function qrSvg(seed){var s='',n=11,x=seed;for(var r=0;r<n;r++)for(var c=0;c<n;c++){x=(x*1103515245+12345)&0x7fffffff;var cr=(r<3&&c<3)||(r<3&&c>n-4)||(r>n-4&&c<3),gap=(r<4&&c<4)||(r<4&&c>n-5)||(r>n-5&&c<4);if(cr||(!gap&&x%7<3))s+='<rect x="'+c+'" y="'+r+'" width="1.05" height="1.05"/>'}return '<svg viewBox="0 0 '+n+' '+n+'" fill="#1b1408">'+s+'</svg>'}
function scanSheet(cb){var T=tourState(),pend=[];T.boxes.forEach(function(b,i){if(!b.st)pend.push(i)});var hit=pend.length>3?pend[3]:(pend[0]!=null?pend[0]:8),hh=D.horse(T.boxes[hit].h),done=false;
  var s=P.sheet({title:'Scanner un box',icon:'qr',body:'<div class="stack" style="--g:14px"><div class="em-cam"><div class="door"><b>'+hh.box+'</b>'+qrSvg(+hh.id.slice(1)*97)+'</div><div class="fr"></div><div class="ln"></div><div class="tx">Visez le QR code collé sur la porte du box</div></div>'+
    '<div><span class="em-lbl">Le code est abîmé ? Choisissez le box</span><div class="hrow wrap" style="--g:6px">'+(pend.length?pend:[0,1,2,3]).slice(0,5).map(function(i){return '<button class="btn em-b" style="padding:0 14px" data-bx="'+i+'">'+D.horse(T.boxes[i].h).box+'</button>'}).join('')+'</div></div>'+
    '<p class="xs mut">Chaque porte porte un QR code Stabl. Les propriétaires qui le scannent voient la ration et les contacts, jamais les données de l’équipe.</p></div>'});
  function go(i){if(done)return;done=true;s.close();cb(i);var x=D.horse(T.boxes[i].h);P.toast('Box '+x.box+' reconnu : '+x.name,{icon:'qr'})}
  on(s,'[data-bx]',function(b){go(+b.getAttribute('data-bx'))});
  setTimeout(function(){if(done||!s.isConnected)return;var c=s.querySelector('.em-cam');c.classList.add('found');c.insertAdjacentHTML('beforeend','<div class="hit pop">'+ICON('check','sm')+'Box '+hh.box+' · '+hh.name+'</div>');setTimeout(function(){if(s.isConnected)go(hit)},P.RM?200:850)},P.RM?300:1700)}

var WHY=['N’a pas fini sa ration','Crottins anormaux','Abreuvoir vide ou sale','Blessure ou plaie','Boiterie','Couverture abîmée','Autre'];
function signalBox(box,doneCb,cancelCb){var h=D.horse(box.h),pre=[],sent=false;if(box.chk.eat)pre.push(0);if(box.chk.dung)pre.push(1);if(box.chk.water)pre.push(2);
  var s=P.sheet({title:'Signaler · '+h.box,icon:'alert',onClose:function(){if(!sent&&cancelCb)cancelCb()},body:
   '<div class="stack" style="--g:16px"><div class="hrow">'+U.hav(h,'lg')+'<div class="grow"><b class="l">'+h.name+'</b><div class="s mut">'+h.box+' · '+ownerOf(h)+'</div></div></div>'+
   '<div><span class="em-lbl">Que se passe-t-il ?</span><div class="hrow wrap" style="--g:6px">'+WHY.map(function(w,i){return '<button class="tag" style="height:40px;padding:0 14px;font-size:13.5px" data-why="'+i+'" aria-pressed="'+(pre.indexOf(i)>=0)+'">'+w+'</button>'}).join('')+'</div></div>'+
   '<div><span class="em-lbl">Photo et note vocale</span><div class="hrow" style="--g:8px" data-ph><button class="em-add" data-photo>'+ICON('image')+'Photo</button><button class="em-add" data-mic>'+ICON('mic')+'<span>Dicter</span></button></div></div>'+
   '<textarea class="in" rows="2" placeholder="Ajoutez un mot pour Claire (facultatif)"></textarea>'+
   '<div><span class="em-lbl">Gravité</span>'+tri('sev',['Pour info','Aujourd’hui','Urgent'],1)+'</div></div>',
   foot:'<button class="btn em-b pri block" data-send>'+ICON('send')+'Envoyer à Claire</button>'});
  var sev=1;bindTri(s,function(k,v){sev=v});var ta=s.querySelector('textarea');
  s.querySelector('[data-photo]').onclick=function(){var n=$$('.em-shot',s).length+1;if(n>3)return;s.querySelector('[data-ph]').insertAdjacentHTML('afterbegin',shot('Photo '+n))};
  s.querySelector('[data-mic]').onclick=function(e){dictate(e.currentTarget,ta,'Il a laissé la moitié de ses granulés et il reste couché au fond du box.')};
  s.querySelector('[data-send]').onclick=function(){var w=$$('[data-why][aria-pressed="true"]',s).map(function(b){return WHY[+b.getAttribute('data-why')]});if(!w.length&&!ta.value){P.toast('Choisissez au moins un motif',{icon:'alert'});return}
    sent=true;box.st='bad';box.why=w.join(', ')||ta.value;D.empIncidents.unshift({id:'i'+Date.now(),kind:w[0]||'Autre',where:'Box '+h.box+' · '+h.name,when:'À l’instant',sev:sev,st:'Envoyé',txt:ta.value||w.join(', ')});
    (E.obs[h.id]=E.obs[h.id]||[]).unshift({who:E.who,when:'À l’instant',text:'Signalement pendant la tournée : '+(w.join(', ')||ta.value)+'.',kind:'alerte'});
    s.close();doneCb();say('Signalement envoyé à Claire : '+h.box+' '+h.name,{icon:'send'})};return s}

P.mod({id:'emp-tournee',role:'employe',group:'Ma journée',title:'Tournée des boxes',icon:'stable',n:20,short:'Tournée',phoneTitle:'Tournée',
 badge:function(){var T=tourState(),n=T.boxes.filter(function(b){return !b.st}).length;return n?{v:n}:null},
 render:function(el,ctx){var T=tourState(),first=true,flash=-1;if(ctx.params&&ctx.params.jump!=null)T.cur=+ctx.params.jump;
  function cardHtml(i,cls){var b=T.boxes[i],h=D.horse(b.h),note=D.empNotes[h.id]||h.alerts[0],hay=Math.round(h.ration.hay*.4*2)/2,pd=padOf(h),wk=workToday()[h.id];
   return '<div class="em-card '+(cls||'')+'" data-i="'+i+'">'+(cls&&cls.indexOf('b')===0?'':'<div class="em-stamp ok">Tout va bien</div><div class="em-stamp bad">Signaler</div>')+
    '<div class="em-ctop d-chevaux'+(h.status==='bad'?' bad':'')+'">'+U.hav(h,'xl')+'<div class="grow"><div class="nm ellip">'+h.name+'</div><div class="s em-cl2">'+h.breed+' · '+h.age+' ans · '+(h.owner?'propriétaire':'club')+'</div></div><span class="em-bx"><small>Box</small>'+h.box+'</span></div>'+
    '<div class="em-cn'+(note?'':' calm')+'">'+ICON(note?'alert':'check')+'<span>'+(note||'Aucune consigne particulière. Caractère : '+h.mood.toLowerCase()+'.')+'</span></div>'+
    '<div class="g2" style="--g:8px;grid-template-columns:1.25fr 1fr"><div class="em-kv"><small>'+ICON('feed')+'Ration du matin</small><b>'+(h.id==='h23'?'Foin mouillé 1 kg':String(hay).replace('.',',')+' kg de foin · '+String(h.ration.grain).replace('.',',')+' L')+'</b></div><div class="em-kv"><small>'+ICON('layers')+'Couverture</small><b>'+blanket(h)+'</b></div><div class="em-kv"><small>'+ICON('paddock')+(pd?'Paddock · '+(pd.g==='A'?'matin':'après-midi'):'Paddock')+'</small><b class="ellip">'+(pd?pd.p:'Reste au box')+'</b></div><div class="em-kv"><small>'+ICON('whistle')+'Travail</small><b>'+(wk?wk.map(hm).join(', '):pd&&h.id!=='h06'?'Repos':'Arrêté')+'</b></div></div>'+
    '<div class="stack" style="--g:6px;margin-top:auto"><div class="em-q"><span>A mangé</span>'+tri('eat',['Tout','Un peu','Rien'],b.chk.eat)+'</div><div class="em-q"><span>Crottins</span>'+tri('dung',['Normaux','Mous','Aucun'],b.chk.dung)+'</div><div class="em-q"><span>Eau</span>'+tri('water',['Propre','Sale','Vide'],b.chk.water)+'</div></div></div>'}
  function listHtml(){return T.boxes.map(function(b,i){var h=D.horse(b.h),cur=i===tourCur();return '<div class="em-row click" data-jump="'+i+'"'+(cur?' style="background:var(--acc-pale)"':'')+'><span class="em-tm">'+h.box+'</span>'+U.hav(h)+'<div class="grow"><div class="t ellip">'+h.name+'</div><div class="s ellip">'+(b.st==='bad'?b.why:b.st==='warn'?'Validé avec une remarque':b.st?'Tout va bien':(D.empNotes[h.id]||'Aucune consigne'))+'</div></div>'+(b.st?U.chip(b.st==='ok'?'Fait':b.st==='warn'?'Remarque':'Signalé',b.st,true)+'<button class="btn ghost icon sm" data-redo="'+i+'" title="Reprendre ce box">'+ICON('rotate','sm')+'</button>':cur?U.chip('En cours','acc',true):'')+'</div>'}).join('')}
  function draw(){var n=T.boxes.length,dn=T.boxes.filter(function(b){return b.st}).length,ci=tourCur(),bad=T.boxes.filter(function(b){return b.st==='bad'}).length,wr=T.boxes.filter(function(b){return b.st==='warn'}).length;
   var h='<div class="em-thd">'+hd('Tournée des boxes','Écurie principale · boxes B01 à B16 · commencée à 9 h 02','<button class="btn" data-scan>'+ICON('qr','sm')+'Scanner un box</button>')+'</div>';
   h+='<div class="em-tour"><div class="em-tcol">';
   h+='<div class="em-prog"><div class="hrow sp"><div class="big">'+dn+'<small> sur '+n+' boxes</small></div><div class="hrow" style="--g:8px"><span class="s mut num">'+T.min+' min'+(ci>=0?' · reste env. '+(n-dn)*3+' min':'')+'</span><button class="btn sm em-tlist" data-list>'+ICON('list','sm')+'Liste</button></div></div><div class="em-segs">'+T.boxes.map(function(b,i){return '<i class="'+(b.st||(i===ci?'cur':''))+(i===flash?' new':'')+'" title="'+D.horse(b.h).box+'"></i>'}).join('')+'</div></div>';
   if(ci<0){h+='<div class="em-fin"><div class="rg"><svg viewBox="0 0 24 24"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg><span class="strass"></span></div><h2>Tournée terminée en '+T.min+' minutes</h2><p class="mut" style="max-width:320px">'+(n-bad-wr)+' boxes sans problème'+(wr?', '+wr+' avec une remarque':'')+(bad?' et '+bad+' signalement'+(bad>1?'s':'')+' déjà chez Claire':'')+'. Le compte rendu part dans le journal de chaque cheval.</p>'+
     '<button class="btn em-b pri block" data-report>'+ICON('send')+'Envoyer le compte rendu</button><button class="btn em-b block ghost" data-reset>'+ICON('rotate')+'Refaire la tournée</button></div>'}
   else{var nx=[];for(var k=ci+1;k<n&&nx.length<2;k++)if(!T.boxes[k].st)nx.push(k);
    h+='<div class="em-stack">'+(nx[1]!=null?cardHtml(nx[1],'b2'):'')+(nx[0]!=null?cardHtml(nx[0],'b1'):'')+cardHtml(ci,first?'':'em-new')+'</div>';
    h+='<div class="em-acts"><button class="no" data-act="-1">'+ICON('alert')+'Signaler</button><button class="sc" data-scan title="Scanner le QR code du box">'+ICON('qr')+'</button><button class="yes" data-act="1">'+ICON('check')+'<span data-yl>Tout va bien</span></button></div>';
    h+='<div class="em-hint">'+(T.hist.length?'<button class="btn ghost sm" data-undo style="margin-left:-8px">'+ICON('rotate','sm')+'Annuler le dernier box</button>':'<span>'+ICON('left','sm')+' Glissez pour signaler</span>')+'<span>Glissez si tout va bien '+ICON('right','sm')+'</span></div>'}
   h+='</div><div class="em-tside stack" style="--g:14px"><div class="card"><div class="ch" style="padding-bottom:8px"><h3>Les '+n+' boxes de la tournée</h3><span class="s mut">Touchez un box pour y aller</span></div><div data-l>'+listHtml()+'</div></div>'+
     '<div class="note">'+ICON('wifi','sm')+'<span>La tournée fonctionne sans réseau : tout est gardé sur le téléphone et part chez Claire dès que la connexion revient.</span></div></div></div>';
   el.innerHTML=h;first=false;flash=-1;var c=el.querySelector('.em-stack .em-card:last-child');if(c)bindDrag(c,ci)}
  function anomalies(i){var c=T.boxes[i].chk;return c.eat||c.dung||c.water}
  function commit(i,dir){var b=T.boxes[i];if(dir>0){b.st=anomalies(i)?'warn':'ok';T.hist.push(i);T.min+=2;T.cur=null;flash=i;draw();if(tourCur()<0)closeTour()}
   else signalBox(b,function(){T.hist.push(i);T.min+=3;T.cur=null;flash=i;draw();if(tourCur()<0)closeTour()},function(){if(el.isConnected)draw()})}
  function closeTour(){var t=D.empTasks.find(function(x){return x.id==='t3'});if(t)t.done=true;var dt=D.tasks.find(function(x){return x.id==='t3'});if(dt)dt.done=true}
  function bindDrag(card,i){var sx=0,sy=0,dx=0,dy=0,drag=false,t0=0,W=card.offsetWidth||340,so=card.querySelector('.em-stamp.ok'),sb=card.querySelector('.em-stamp.bad'),nxt=el.querySelector('.em-card.b1');
   function paint(){card.style.transform='translate('+dx+'px,'+dy*.22+'px) rotate('+dx/24+'deg)';so.style.opacity=Math.max(0,Math.min(1,dx/80));sb.style.opacity=Math.max(0,Math.min(1,-dx/80));if(nxt)nxt.style.transform='translateY('+(11-11*Math.min(1,Math.abs(dx)/160))+'px) scale('+(.95+.05*Math.min(1,Math.abs(dx)/160))+')'}
   function back(){card.style.transition='transform 460ms var(--e-spring)';card.style.transform='';so.style.opacity=sb.style.opacity=0;if(nxt)nxt.style.transform=''}
   function fly(dir){card.style.transition='transform 340ms var(--e-out),opacity 300ms 60ms';card.style.transform='translate('+dir*(W+180)+'px,'+dy*.4+'px) rotate('+dir*20+'deg)';card.style.opacity='0';(dir>0?so:sb).style.opacity=1;if(nxt){nxt.style.transform='none'}setTimeout(function(){if(el.isConnected)commit(i,dir)},P.RM?10:260)}
   card.addEventListener('pointerdown',function(e){if(e.target.closest('button'))return;drag=true;sx=e.clientX;sy=e.clientY;dx=dy=0;t0=performance.now();card.style.transition='none';card.classList.remove('em-new');try{card.setPointerCapture(e.pointerId)}catch(x){}});
   card.addEventListener('pointermove',function(e){if(!drag)return;dx=e.clientX-sx;dy=e.clientY-sy;paint()});
   function end(){if(!drag)return;drag=false;var v=dx/Math.max(1,performance.now()-t0);if(Math.abs(dx)>W*.3||(Math.abs(v)>.5&&Math.abs(dx)>36))fly(dx>0?1:-1);else back()}
   card.addEventListener('pointerup',end);card.addEventListener('pointercancel',end);
   card._fly=function(dir){dx=0;dy=-10;card.classList.remove('em-new');card.style.transition='none';void card.offsetWidth;fly(dir)}}
  bindTri(el,function(k,v){var i=tourCur();if(i<0)return;T.boxes[i].chk[k]=v;var yl=el.querySelector('[data-yl]');if(yl)yl.textContent=anomalies(i)?'Valider la remarque':'Tout va bien'});
  on(el,'[data-act]',function(b){var c=el.querySelector('.em-stack .em-card:last-child');if(c&&c._fly)c._fly(+b.getAttribute('data-act'))});
  on(el,'[data-undo]',function(){var i=T.hist.pop();if(i==null)return;T.boxes[i].st=null;T.boxes[i].why='';T.cur=i;first=false;draw();P.toast('Box '+D.horse(T.boxes[i].h).box+' remis dans la tournée',{icon:'rotate'})});
  on(el,'[data-scan]',function(){scanSheet(function(i){T.cur=i;if(el.isConnected)draw()})});
  on(el,'[data-redo]',function(b,e){e.stopPropagation();var i=+b.getAttribute('data-redo');T.boxes[i].st=null;T.boxes[i].why='';T.cur=i;draw()});
  on(el,'[data-jump]',function(b,e){if(e.target.closest('[data-redo]'))return;var i=+b.getAttribute('data-jump');if(T.boxes[i].st){P.toast('Box déjà fait. Touchez la flèche pour le reprendre',{icon:'info'});return}T.cur=i;draw()});
  on(el,'[data-list]',function(){var s=P.sheet({title:'Les '+T.boxes.length+' boxes',icon:'list',body:'<div style="margin:-18px">'+listHtml()+'</div>'});
    on(s,'[data-redo]',function(b,e){e.stopPropagation();var i=+b.getAttribute('data-redo');T.boxes[i].st=null;T.cur=i;s.close();draw()});
    on(s,'[data-jump]',function(b,e){if(e.target.closest('[data-redo]'))return;var i=+b.getAttribute('data-jump');if(T.boxes[i].st)return;T.cur=i;s.close();draw()})});
  on(el,'[data-report]',function(b){b.disabled=true;b.innerHTML=ICON('check')+'Compte rendu envoyé';say('Compte rendu de tournée envoyé à Claire, journal des 16 chevaux mis à jour',{icon:'send'})});
  on(el,'[data-reset]',function(){E.tour=null;T=tourState();first=true;draw()});
  online(el,draw);
  draw()}});

/* =====================================================================
   3 · Chevaux (liste rapide) et 4 · fiche courte d'un cheval
   ===================================================================== */
P.css(`
.em-in{height:48px;font-size:15.5px;border-radius:var(--r-md)}
.em-tags{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px;margin:0 -2px}
.em-tags::-webkit-scrollbar{display:none}
.em-tags .tag{height:38px;padding:0 14px;flex:none;font-size:13px;font-weight:600}
.em-tags .tag b{font-weight:600;opacity:.6;font-variant-numeric:tabular-nums}
.em-hl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.em-hc{display:flex;gap:12px;align-items:flex-start;padding:14px;text-align:left;width:100%}
.em-hc .nm{font-weight:650;font-size:15px;line-height:1.25}
.em-meta{display:flex;flex-wrap:wrap;gap:3px 12px;font-size:13px;color:var(--mut);margin-top:4px}
.em-meta span{display:inline-flex;align-items:center;gap:5px;min-width:0}
.em-meta svg.i{width:14px;height:14px}
.em-meta .w{color:var(--ink-2);font-weight:600}
.em-cl{font-size:13px;color:var(--warn);font-weight:500;margin-top:5px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;line-height:1.35}
.em-cl.bad{color:var(--bad)}
.em-bxs{font:600 13px var(--f-mono);color:var(--mut);padding:2px 6px;border-radius:6px;background:var(--bg-2);margin-left:6px;vertical-align:1px}
.em-pg{display:flex;flex-direction:column;gap:10px;padding:14px 16px}
.em-pg+.em-pg{border-top:1px solid var(--line)}
.em-hp{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 12px 0 5px;border-radius:99px;background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);font-size:13px;font-weight:600}
.em-hero{padding:18px;display:flex;gap:16px;align-items:center}
.em-hero h2{font-size:26px;line-height:1.1}
.em-ev b{font-size:13.5px}
.em-ev p{font-size:14px;line-height:1.45;margin-top:2px;color:var(--ink)}
.em-ech{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
@container main (max-width:1040px){.em-hl{grid-template-columns:repeat(2,minmax(0,1fr))}}
@container main (max-width:640px){.em-hl{grid-template-columns:minmax(0,1fr)}.em-hero{padding:14px;gap:12px}.em-hero h2{font-size:22px}.em-ech{grid-template-columns:repeat(2,minmax(0,1fr))}}
`);

P.mod({id:'emp-chevaux',role:'employe',group:'Écurie',title:'Chevaux',icon:'horse',n:10,short:'Chevaux',
 render:function(el,ctx){var q='',f='all',view=P.prefs.get('emp:hview','list'),W=workToday();
  var norm=function(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')};
  var outNow=D.horses.filter(function(h){var p=padOf(h);return p&&p.g==='A'}).length,works=D.horses.filter(function(h){return W[h.id]}).length;
  var FL=[['all','Tous',D.horses.length],['out','Dehors',outNow],['work','Travaillent',works],['note','Consignes',D.horses.filter(function(h){return D.empNotes[h.id]}).length],['alert','À surveiller',D.horses.filter(function(h){return h.status!=='ok'}).length]];
  function match(h){if(q&&norm(h.name+' '+h.box+' '+h.breed).indexOf(norm(q))<0)return false;var p=padOf(h);
   return f==='all'||(f==='out'&&p&&p.g==='A')||(f==='work'&&W[h.id])||(f==='note'&&D.empNotes[h.id])||(f==='alert'&&h.status!=='ok')}
  function row(h){var p=padOf(h),w=W[h.id],note=D.empNotes[h.id]||h.alerts[0];
   return '<button class="card hover em-hc" data-go="emp-cheval" data-id="'+h.id+'">'+U.hav(h,'lg')+'<div class="grow"><div class="nm">'+h.name+'<span class="em-bxs">'+h.box+'</span></div>'+
    '<div class="em-meta"><span'+(p&&p.g==='A'?' class="w"':'')+'>'+ICON(p?'paddock':'stable')+(p?p.p+' · groupe '+p.g:'Reste au box')+'</span>'+(w?'<span>'+ICON('whistle')+w.length+' reprise'+(w.length>1?'s':'')+' : '+w.map(hm).join(', ')+'</span>':'')+'</div>'+
    (note?'<div class="em-cl'+(h.status==='bad'?' bad':'')+'">'+note+'</div>':'')+'</div>'+(h.status==='bad'?U.chip('Urgent','bad'):h.status==='warn'?U.chip('À voir','warn'):'')+'</button>'}
  function list(){var L=D.horses.filter(match);L.sort(function(a,b){var o={bad:0,warn:1,ok:2};return o[a.status]-o[b.status]||a.box.localeCompare(b.box)});
   return L.length?'<div class="em-hl">'+L.map(row).join('')+'</div>':U.empty('search','Aucun cheval ne correspond','Essayez un nom, un numéro de box ou une race.','<button class="btn sm" data-clear>Effacer la recherche</button>')}
  function pads(){var G={};D.horses.forEach(function(h){var p=padOf(h);if(p)((G[p.p]=G[p.p]||{A:[],B:[]})[p.g]).push(h)});var stay=D.horses.filter(function(h){return !padOf(h)});
   return '<div class="em-cols eq">'+Object.keys(G).map(function(n){return '<div class="card"><div class="ch" style="padding-bottom:4px"><h3>'+n+'</h3><span class="s mut num">'+(G[n].A.length+G[n].B.length)+' chevaux</span></div>'+['A','B'].filter(function(g){return G[n][g].length}).map(function(g){var k=n+g,st=E.pad[k]||(g==='A'?'out':'in');
     return '<div class="em-pg"><div class="hrow sp wrap"><div><b>Groupe '+g+'</b> <span class="s mut">· '+PADT[g]+'</span></div>'+U.chip(st==='out'?'Dehors':st==='back'?'Rentrés':'Au box',st==='out'?'ok':'',true)+'</div><div class="hrow wrap" style="--g:6px">'+G[n][g].map(function(h){return '<button class="em-hp" data-go="emp-cheval" data-id="'+h.id+'">'+U.hav(h,'sm')+h.name.split(' ')[0]+'</button>'}).join('')+'</div>'+
      '<button class="btn em-b" data-pad="'+k+'" data-st="'+st+'" data-n="'+G[n][g].length+'">'+ICON(st==='out'?'stable':'paddock')+(st==='out'?'Marquer le groupe rentré':st==='back'?'Ressortir le groupe':'Marquer le groupe sorti')+'</button></div>'}).join('')+'</div>'}).join('')+
    '<div class="card"><div class="ch" style="padding-bottom:4px"><h3>Restent au box</h3><span class="s mut num">'+stay.length+' chevaux</span></div>'+stay.map(function(h){return '<button class="em-row" data-go="emp-cheval" data-id="'+h.id+'">'+U.hav(h)+'<div class="grow"><div class="t">'+h.name+' <span class="em-bxs">'+h.box+'</span></div><div class="s">'+h.alerts[0]+'</div></div>'+ICON('right','sm')+'</button>'}).join('')+'</div></div>'}
  function draw(){el.innerHTML=hd('Chevaux',D.horses.length+' chevaux · '+outNow+' dehors en ce moment · '+works+' travaillent aujourd’hui',U.seg([['list',ICON('list','sm')+'Liste'],['pad',ICON('paddock','sm')+'Paddocks']],view,'data-view')+'<button class="btn icon" data-scan title="Scanner le QR code d’un box">'+ICON('qr')+'</button>')+
    (view==='list'?'<div class="stack" style="--g:12px"><div class="search">'+ICON('search')+'<input class="in em-in" type="search" placeholder="Nom, box ou race" value="'+F.esc(q)+'" aria-label="Chercher un cheval"></div><div class="em-tags scroll-x">'+FL.map(function(x){return '<button class="tag" data-manual data-f="'+x[0]+'" aria-pressed="'+(f===x[0])+'">'+x[1]+' <b>'+x[2]+'</b></button>'}).join('')+'</div><div data-list>'+list()+'</div></div>':pads())}
  el.addEventListener('input',function(e){if(e.target.matches('.em-in')){q=e.target.value;el.querySelector('[data-list]').innerHTML=list()}});
  on(el,'[data-f]',function(b){f=b.getAttribute('data-f');$$('[data-f]',el).forEach(function(x){x.setAttribute('aria-pressed',x===b)});var dl=el.querySelector('[data-list]');dl.innerHTML=list();sw(dl)});
  on(el,'[data-clear]',function(){q='';f='all';draw()});
  on(el,'[data-view]',function(b){if(view===b.getAttribute('data-view'))return;view=b.getAttribute('data-view');P.prefs.set('emp:hview',view);draw();swBody(el)});
  on(el,'[data-pad]',function(b){var k=b.getAttribute('data-pad'),st=b.getAttribute('data-st'),n=b.getAttribute('data-n');E.pad[k]=st==='out'?'back':'out';draw();say(n+' chevaux '+(st==='out'?'rentrés au box':'sortis au paddock')+', journal mis à jour')});
  on(el,'[data-scan]',function(){scanSheet(function(i){P.go('emp-cheval',{id:tourState().boxes[i].h})})});
  online(el,draw);draw()}});

/* ---------- Fiche courte ---------- */
function journalOf(h){var J=(E.obs[h.id]||[]).slice();
  if(h.id==='h23')J=J.concat([{who:'s05',when:'Auj. 8 h 05',text:'A recrotté, mange un peu de foin mouillé. Plus calme.',kind:'soin'},{who:'s05',when:'Auj. 6 h 10',text:'Pas de crottins depuis 4 h, se regarde les flancs. Marché 10 minutes en main.',kind:'alerte'},{who:'s01',when:'Auj. 4 h 35',text:'Colique légère pendant l’astreinte. Dr Leclerc sur place, Calmagine injectée. Diète.',kind:'alerte'},{who:'s06',when:'Hier 18 h 10',text:'Rentré du paddock, rien à signaler.',kind:'soin'}]);
  J=J.concat(D.journal.filter(function(j){return j.horse===h.id}));
  if(h.id!=='h23'&&h.id!=='h01')J=J.concat([{who:'s05',when:'Hier 18 h 20',text:'A tout mangé, crottins normaux. '+blanket(h)+' pour la nuit.',kind:'soin'},{who:'s06',when:'Hier 8 h 40',text:padOf(h)?'Sorti au paddock avec le groupe '+padOf(h).g+', calme.':'Resté au box, marché 10 minutes en main.',kind:'soin'},{who:'s02',when:'Sam. 14 nov.',text:'Reprise Galop 3-4, bon travail au trot enlevé.',kind:'travail'}]);
  return J}
function obsSheet(h,draw){var TG=['Appétit','Crottins','Boiterie','Plaie','Comportement','Poids','Pieds'];
  var s=P.sheet({title:'Nouvelle observation',icon:'edit',body:
   '<div class="stack" style="--g:16px"><div class="hrow">'+U.hav(h,'lg')+'<div class="grow"><b class="l">'+h.name+'</b><div class="s mut">'+h.box+' · mardi 17 novembre, 9 h 41</div></div></div>'+
   '<div><span class="em-lbl">Sujet</span><div class="hrow wrap" style="--g:6px">'+TG.map(function(t){return '<button class="tag" style="height:40px;padding:0 14px;font-size:13.5px" data-tg>'+t+'</button>'}).join('')+'</div></div>'+
   '<div><span class="em-lbl">Photo et dictée</span><div class="hrow" style="--g:8px" data-ph><button class="em-add" data-photo>'+ICON('image')+'Photo</button><button class="em-add" data-mic>'+ICON('mic')+'<span>Dicter</span></button></div></div>'+
   '<textarea class="in" rows="3" placeholder="Ce que vous avez vu"></textarea>'+
   '<div class="card flat">'+(h.owner?'<div class="li"><div class="grow"><div class="t">Prévenir '+D.name(h.owner)+'</div><div class="s">Propriétaire, dans « Nouvelles de mon cheval »</div></div>'+U.tog(false,'ob-own')+'</div>':'')+'<div class="li"><div class="grow"><div class="t">Prévenir Claire</div><div class="s">Notification immédiate à la gérante</div></div>'+U.tog(h.status!=='ok','ob-cl')+'</div></div></div>',
   foot:'<button class="btn em-b pri block" data-save>'+ICON('check')+'Ajouter au journal</button>'});
  var ta=s.querySelector('textarea'),ph=0;
  s.querySelector('[data-photo]').onclick=function(){if(ph>2)return;ph++;s.querySelector('[data-ph]').insertAdjacentHTML('afterbegin',shot('Photo '+ph))};
  s.querySelector('[data-mic]').onclick=function(e){dictate(e.currentTarget,ta,h.id==='h23'?'Xanthos a bu un demi-seau, il a fait deux crottins un peu secs et il reste calme.':'Rien d’anormal, il a fini son foin et il est venu au devant du box.')};
  s.querySelector('[data-save]').onclick=function(){var tg=$$('[data-tg][aria-pressed="true"]',s).map(function(b){return b.textContent});if(!ta.value.trim()&&!tg.length&&!ph){P.toast('Écrivez ou dictez votre observation',{icon:'alert'});return}
   var own=s.querySelector('#ob-own'),o={who:E.who,when:'À l’instant',text:(tg.length?tg.join(', ')+'. ':'')+(ta.value.trim()||'Photo ajoutée.'),kind:'soin',photos:ph};(E.obs[h.id]=E.obs[h.id]||[]).unshift(o);
   
   s.close();if(draw)draw();say('Observation ajoutée au journal de '+h.name+(own&&own.getAttribute('aria-checked')==='true'?', propriétaire prévenu':''))}}

P.mod({id:'emp-cheval',role:'employe',group:'Écurie',title:'Fiche cheval',icon:'horse',hidden:true,tab:'emp-chevaux',phoneTitle:'Fiche cheval',
 render:function(el,ctx){var h=D.horse(ctx.params.id||'h23')||D.horse('h23'),W=workToday(),first=true;
  function draw(){var mt=$('.mt',P.app());if(mt)mt.textContent=h.name;var p=padOf(h),w=W[h.id],note=D.empNotes[h.id]||h.alerts[0],care=D.empCare.filter(function(c){return c.horse===h.id}),J=journalOf(h),hay=h.ration.hay,isX=h.id==='h23';
   var rel=function(d,every){var n=F.days(d)+every;return n<0?'<span class="badc">en retard de '+(-n)+' j</span>':n<15?'<span class="warnc">dans '+n+' j</span>':'dans '+n+' j'};
   var x='<div class="stack'+(first?' rise':'')+'" style="--g:14px">';
   x+='<div class="card em-hero">'+U.hav(h,'xl')+'<div class="grow"><div class="hrow wrap" style="--g:8px"><h2>'+h.name+'</h2>'+(h.status==='bad'?U.chip('Urgent','bad',true):h.status==='warn'?U.chip('À surveiller','warn',true):U.chip('En forme','ok',true))+'</div><div class="s mut" style="margin-top:5px">Box '+h.box+' · '+h.breed+' · '+h.sex+' de '+h.age+' ans · '+(h.owner?'propriété de '+D.name(h.owner):'cheval de club')+'</div></div>'+
     '<div class="hrow hide-s" style="--g:8px"><button class="btn" data-vet>'+ICON('phone','sm')+'Vétérinaire</button><button class="btn pri" data-obs>'+ICON('plus','sm')+'Ajouter une observation</button></div></div>';
   x+='<div class="em-cols"><div class="stack" style="--g:14px">';
   if(note)x+='<div class="note '+(h.status==='bad'?'bad':'warn')+'" style="font-size:14.5px;padding:14px 16px">'+ICON('alert')+'<div><b>Consigne</b><div style="margin-top:2px;color:var(--ink)">'+note+'</div></div></div>';
   if(isX){var nx=E.ctl.find(function(c){return !c.st});x+='<div class="card"><div class="ch"><h3>Surveillance toutes les 2 heures</h3><span class="s mut">'+(nx?'Prochain : '+nx.t:'Terminée')+'</span></div><div class="cb stack" style="--g:14px"><div class="em-ctl">'+E.ctl.map(function(c){return '<div class="'+(c.st||(c===nx?'next':''))+'"><i></i>'+c.t+'</div>'}).join('')+'</div><div class="s mut">'+E.ctl.filter(function(c){return c.st}).slice(-1)[0].x+'. Abreuvoir connecté : 3,1 L par heure, en baisse de 40 %.</div><button class="btn em-b dark" data-ctl>'+ICON('pulse')+'Noter le contrôle</button></div></div>'}
   x+='<div class="card"><div class="ch" style="padding-bottom:6px"><h3>Soins du jour</h3><button class="btn ghost sm" data-go="emp-soins">Tous les soins'+ICON('arrow','sm')+'</button></div>'+(care.length?care.map(function(c){var dn=c.done||E.care[c.id];return '<div class="em-row">'+ico(c.icon,'',dn?'var(--ok)':'var(--acc)')+'<div class="grow"><div class="t">'+c.kind+' · '+c.prod+'</div><div class="s">'+c.poso+'</div></div>'+(dn?U.chip('Fait à '+dn,'ok',true):'<button class="btn sm pri" data-care="'+c.id+'">Valider</button>')+'</div>'}).join(''):'<div class="empty" style="padding:22px">'+ICON('checkc')+'<span class="s">Aucun soin prévu aujourd’hui pour '+h.name+'.</span></div>')+'</div>';
   x+='<div class="card"><div class="ch"><h3>Journal</h3><button class="btn sm" data-obs>'+ICON('plus','sm')+'Observation</button></div><div class="cb"><div class="tl">'+J.slice(0,7).map(function(j,i){var s=D.person(j.who);return '<div class="ev em-ev'+(i===0&&j.when==='À l’instant'?' fade':'')+'" style="--c:var(--'+(j.kind==='alerte'?'bad':j.kind==='travail'||j.kind==='balade'?'acc':'ok')+')"><div class="hrow sp"><b>'+(s?s.first+' '+s.last:'Équipe')+'</b><span class="xs mut">'+j.when+'</span></div><p>'+j.text+'</p>'+(j.photos?'<div class="hrow" style="--g:6px;margin-top:8px">'+Array.apply(null,Array(j.photos)).map(function(_,k){return shot('Photo '+(k+1))}).join('')+'</div>':'')+'</div>'}).join('')+'</div></div></div>';
   x+='</div><div class="stack" style="--g:14px">';
   x+='<div class="card"><div class="ch"><h3>Ration</h3><span class="s mut">'+h.weight+' kg · état corporel '+String(h.bcs).replace('.',',')+' sur 5</span></div><div class="cb stack" style="--g:10px">'+(isX?'<div class="note bad">'+ICON('alert','sm')+'<span><b>Diète jusqu’à nouvel ordre :</b> foin mouillé 1 kg par repas, pas de granulés.</span></div>':'')+'<div class="g3" style="--g:8px;grid-template-columns:repeat(3,minmax(0,1fr))">'+[['Matin','7 h',.4,.5],['Midi','11 h 45',.2,0],['Soir','18 h',.4,.5]].map(function(r){return '<div class="em-kv"><small>'+r[0]+' · '+r[1]+'</small><b>'+String(Math.round(hay*r[2]*2)/2).replace('.',',')+' kg de foin</b><span class="xs mut">'+(r[3]?String(Math.round(h.ration.grain*r[3]*10)/10).replace('.',',')+' L de granulés':'Pas de granulés')+'</span></div>'}).join('')+'</div><div class="hrow sp s"><span class="mut">Complément</span><b>'+h.ration.supp+(D.empNotes[h.id]&&/trempé/.test(D.empNotes[h.id])?' · foin trempé':'')+'</b></div></div></div>';
   x+='<div class="card"><div class="ch"><h3>Aujourd’hui</h3></div><div class="cb stack" style="--g:8px"><div class="em-kv"><small>'+ICON('paddock')+'Paddock</small><b>'+(p?p.p+' · groupe '+p.g+', '+PADT[p.g]:'Reste au box aujourd’hui')+'</b></div><div class="em-kv"><small>'+ICON('layers')+'Couverture</small><b>'+blanket(h)+(h.status==='bad'?'':' · 3 °C cette nuit')+'</b></div><div class="em-kv"><small>'+ICON('whistle')+'Travail</small><b>'+(w?w.length+' reprise'+(w.length>1?'s':'')+' : '+w.map(hm).join(', '):h.status==='bad'||h.id==='h06'?'Arrêté, aucun travail':'Repos, pas de reprise')+'</b></div></div></div>';
   x+='<div class="card"><div class="ch"><h3>Échéances</h3></div><div class="cb"><div class="em-ech">'+[['Vaccin','syringe',rel(h.vacc,365)],['Vermifuge','pill',rel(h.worm,120)],['Maréchal','hoof',rel(h.farrier,49)],['Dentiste','tooth',rel(h.dentist,365)]].map(function(e){return '<div class="em-kv"><small>'+ICON(e[1])+e[0]+'</small><b>'+e[2]+'</b></div>'}).join('')+'</div></div></div>';
   x+='<div class="card"><div class="ch" style="padding-bottom:6px"><h3>Contacts</h3></div>'+(h.owner?'<button class="em-row" data-call="'+D.name(h.owner)+'">'+U.av(h.owner)+'<div class="grow"><div class="t">'+D.name(h.owner)+'</div><div class="s">Propriétaire · '+D.member(h.owner).phone+'</div></div>'+ICON('phone')+'</button>':'')+'<button class="em-row" data-vet>'+ico('care','sm','var(--bad)')+'<div class="grow"><div class="t">Dr Antoine Leclerc</div><div class="s">Vétérinaire · '+VET+'</div></div>'+ICON('phone')+'</button><button class="em-row" data-call="Benoît Gautier">'+ico('hoof','sm')+'<div class="grow"><div class="t">Benoît Gautier</div><div class="s">Maréchal-ferrant · passe jeudi à 9 h</div></div>'+ICON('phone')+'</button></div>';
   x+='</div></div><div class="em-sticky"><button class="btn em-b" data-vet>'+ICON('phone')+'Véto</button><button class="btn em-b pri" style="flex:2" data-obs>'+ICON('plus')+'Observation</button></div></div>';
   el.innerHTML=x;if(first)P.animate(el);first=false}
  on(el,'[data-obs]',function(){obsSheet(h,draw)});
  on(el,'[data-vet]',function(){vetSheet(h)});
  on(el,'[data-ctl]',function(){controlSheet(draw)});
  on(el,'[data-care]',function(b){careSheet(D.empCare.find(function(c){return c.id===b.getAttribute('data-care')}),draw)});
  on(el,'[data-call]',function(b){P.toast('Appel de '+b.getAttribute('data-call')+' en cours',{icon:'phone'})});
  draw()}});

/* =====================================================================
   5 · Mon planning et 6 · Soins du jour
   ===================================================================== */
P.css(`
.em-wk{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}
.em-wk button{display:flex;flex-direction:column;align-items:center;gap:1px;padding:9px 0 8px;border-radius:14px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);position:relative;transition:background var(--t-2),color var(--t-2),transform var(--t-1)}
.em-wk button:active{transform:scale(.95)}
.em-wk button span{font-size:13px;font-weight:600;color:var(--mut)}
.em-wk button b{font:700 19px/1.2 var(--f-display);font-variant-numeric:tabular-nums}
.em-wk button small{font-size:13px;color:var(--mut);font-weight:600;font-variant-numeric:tabular-nums}
.em-wk button.td b{color:var(--acc)}
.em-wk button[aria-pressed="true"]{background:var(--navy);color:var(--navy-ink);box-shadow:none}
.em-wk button[aria-pressed="true"] b{color:var(--navy-ink)}
.em-wk button[aria-pressed="true"] span,.em-wk button[aria-pressed="true"] small{color:color-mix(in srgb,var(--navy-ink) 70%,transparent)}
.em-wk button .nt{position:absolute;top:6px;right:6px;width:7px;height:7px;border-radius:50%;background:var(--c5)}
.em-sh{display:flex;align-items:center;gap:14px;padding:14px 16px;position:relative}
.em-sh+.em-sh{border-top:1px solid var(--line)}
.em-sh .hh{font:700 17px/1.2 var(--f-display);letter-spacing:-.02em;font-variant-numeric:tabular-nums;white-space:nowrap}
.em-sh .br{width:4px;align-self:stretch;border-radius:2px;background:var(--c,var(--acc));flex:none}
.em-gt{display:grid;grid-template-columns:48px minmax(0,1fr) 52px;gap:10px;align-items:center;padding:6px 16px;font-size:13px;width:100%;text-align:left}
.em-gt.td{background:var(--acc-pale)}
.em-gt .dl{font-weight:600}
.em-gt .tr{position:relative;height:22px;border-radius:6px;background:var(--surface-2)}
.em-gt.td .tr{background:color-mix(in srgb,var(--surface) 60%,transparent)}
.em-gt .tr i{position:absolute;top:0;bottom:0;border-radius:6px;background:var(--acc);animation:em-gw .6s var(--e-out) both;transform-origin:left}
.em-gt .tr i.n{background:var(--c5)}
.em-gt .tr i.past{background:color-mix(in srgb,var(--acc) 45%,var(--surface))}
@keyframes em-gw{from{transform:scaleX(0)}}
.em-gt .tt{text-align:right;font-weight:600;font-variant-numeric:tabular-nums}
.em-ax{display:grid;grid-template-columns:48px minmax(0,1fr) 52px;gap:10px;padding:0 16px 4px;font-size:13px;color:var(--mut)}
.em-ax div{display:flex;justify-content:space-between;font-variant-numeric:tabular-nums}
.em-bigh{font:700 34px/1 var(--f-display);letter-spacing:-.035em;font-variant-numeric:tabular-nums}
.em-bigh small{font-size:15px;color:var(--mut);font-weight:600;letter-spacing:0}
.em-care{padding:16px;display:flex;flex-direction:column;gap:12px}
.em-care .pd{font:650 17px/1.25 var(--f-display);letter-spacing:-.015em}
.em-care.done{box-shadow:inset 0 0 0 1px var(--line)}
.em-reg{font:600 13px var(--f-mono);color:var(--mut)}
.em-cg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
@container main (max-width:820px){.em-cg{grid-template-columns:minmax(0,1fr)}}
`);

function toMin(t){var p=t.split(':');return +p[0]*60+ +p[1]}
function fromMin(m){return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
function hh(v){var h=Math.floor(v),m=Math.round((v-h)*60);return h+' h'+(m?' '+String(m).padStart(2,'0'):'')}
function weekOf(){if(!mon())return myWeek();return D.empShifts.map(function(s,i){var dow=(i+1)%7,L=D.lessons.filter(function(l){return l.coach==='s02'&&l.dow===dow}).sort(function(a,b){return a.start<b.start?-1:1});
  var parts=L.map(function(l){return [l.start,fromMin(toMin(l.start)+l.dur),l.title,l]});if(i===1)parts=[['10:00','10:30','Longe de Jazz'],['11:00','11:45','Cours particulier']].concat(parts);if(i===2)parts=[['09:30','12:00','Travail des chevaux du club']].concat(parts);if(i===5)parts=parts.concat([['14:00','17:00','Stage de préparation aux galops']]);
  var m=parts.reduce(function(a,p){return a+toMin(p[1])-toMin(p[0])},0);return {d:s.d,l:s.l,n:s.n,parts:parts,h:m/60}})}
var DL=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];

function nightSheet(){P.sheet({title:'Astreinte de nuit',icon:'moonstar',body:'<div class="stack" style="--g:14px"><div class="card flat" style="padding:14px"><div class="eyebrow">Votre prochaine astreinte</div><div class="em-h2" style="font-size:19px;margin-top:4px">'+(function(i){return i<0?'Aucune cette semaine':DL[i]+' '+myWeek()[i].n+' novembre, de 20 h à 7 h'})(nextNight())+'</div><div class="s mut" style="margin-top:4px">Prime de 18 € par nuit. Une intervention est comptée en heures et majorée.</div></div>'+
  '<div><span class="em-lbl">Votre tour de 22 h</span><div class="card flat">'+['Vérifier les 46 abreuvoirs et les portes des boxes','Regarder Xanthos (B23) et noter un contrôle','Fermer la sellerie et le portail, éteindre les lumières du manège'].map(function(t){return '<div class="li"><div class="grow s" style="color:var(--ink);font-weight:500">'+t+'</div>'+U.chk(false)+'</div>'}).join('')+'</div></div>'+
  '<div><span class="em-lbl">Qui appeler la nuit</span><div class="card flat">'+[['Dr Leclerc, vétérinaire de garde',VET],['Claire Dumont, gérante','06 45 12 78 30'],['Clinique équine de Rambouillet','01 30 00 00 00']].map(function(c){return '<button class="em-row" data-nc="'+c[0].split(',')[0]+'">'+ico('phone','sm')+'<div class="grow"><div class="t">'+c[0]+'</div><div class="s num">'+c[1]+'</div></div>'+ICON('right','sm')+'</button>'}).join('')+'</div></div>'+
  '<div class="note">'+ICON('camera','sm')+'<span>Les caméras des boxes B23 et B04 vous envoient une alerte si un cheval reste couché plus de 40 minutes.</span></div></div>',
  foot:'<button class="btn em-b block" data-go="emp-signaler">'+ICON('alert')+'Signaler un incident</button>'}).addEventListener('click',function(e){var b=e.target.closest('[data-nc]');if(b)P.toast('Appel en cours : '+b.getAttribute('data-nc'),{icon:'phone'})})}

function swapSheet(draw){var W=myWeek().filter(function(s){return s.parts.length&&s.d>0});
  var s=P.sheet({title:'Proposer un échange',icon:'swap',body:'<div class="stack" style="--g:14px"><label class="field"><span>Je donne ce créneau</span><select class="in em-in" id="sw-a">'+W.map(function(x){return x.parts.map(function(p){return '<option>'+DL[x.d+1]+' '+x.n+' · '+hm(p[0])+' à '+hm(p[1])+'</option>'}).join('')}).join('')+'</select></label>'+
   '<div><span class="em-lbl">À qui</span><div class="g2" style="--g:8px;grid-template-columns:1fr 1fr">'+[['s06','Peut samedi et dimanche'],['s07','Peut mercredi']].map(function(c,i){var p=D.staffer(c[0]);return '<button class="card flat hrow" style="padding:12px;text-align:left" data-col="'+c[0]+'" aria-pressed="'+(i===0)+'">'+U.av(p)+'<div class="grow"><div class="b s">'+p.first+'</div><div class="xs mut">'+c[1]+'</div></div></button>'}).join('')+'</div></div>'+
   '<label class="field"><span>Contre ce créneau</span><select class="in em-in" id="sw-b"><option>Dimanche 29 · 7 h à 12 h 30</option><option>Samedi 28 · 7 h à 12 h 30</option><option>Sans contrepartie, je rends service</option></select></label>'+
   '<label class="field"><span>Un mot (facultatif)</span><textarea class="in" rows="2" placeholder="Exemple : rendez-vous chez le dentiste"></textarea></label>'+
   '<div class="note">'+ICON('info','sm')+'<span>Votre collègue accepte, puis Claire valide. Stabl vérifie les 11 heures de repos entre deux journées.</span></div></div>',
   foot:'<button class="btn em-b pri block" data-send>'+ICON('send')+'Envoyer la proposition</button>'});var col='s06';
  var mark=function(){$$('[data-col]',s).forEach(function(b){var o=b.getAttribute('data-col')===col;b.setAttribute('aria-pressed',o);b.style.boxShadow=o?'inset 0 0 0 2px var(--acc)':''})};mark();
  on(s,'[data-col]',function(b){col=b.getAttribute('data-col');mark()});
  s.querySelector('[data-send]').onclick=function(){E.swap2={a:s.querySelector('#sw-a').value,b:s.querySelector('#sw-b').value,to:col};s.close();draw();say('Proposition envoyée à '+D.staffer(col).first,{icon:'send'})}}

P.mod({id:'emp-planning',role:'employe',group:'Ma journée',title:'Mon planning',icon:'planning',n:30,short:'Planning',phoneTitle:'Planning',
 render:function(el,ctx){var sel=1,first=true;
  function draw(){var Wk=weekOf(),tot=Wk.reduce(function(a,s){return a+s.h},0),p=me(),d=Wk[sel],m=mon();
   var x=hd('Mon planning','Semaine du 16 au 22 novembre · '+hh(tot)+(m?' de reprises et de travail des chevaux':' prévues pour '+p.hours+' h au contrat'),m?'':'<button class="btn" data-swapnew>'+ICON('swap','sm')+'Proposer un échange</button>');
   x+='<div class="em-cols"><div class="stack'+(first?' rise':'')+'" style="--g:14px">';
   x+='<div class="em-wk">'+Wk.map(function(s,i){return '<button data-day="'+i+'" class="'+(i===1?'td':'')+'" aria-pressed="'+(i===sel)+'" title="'+DL[i]+' '+s.n+' novembre"><span>'+s.l+'</span><b>'+s.n+'</b><small>'+(s.h?hh(s.h):'Repos')+'</small>'+(s.night&&!m?'<i class="nt"></i>':'')+'</button>'}).join('')+'</div>';
   x+='<div class="card"><div class="ch" style="padding-bottom:4px"><h3>'+DL[sel]+' '+d.n+' novembre</h3>'+(sel===1?U.chip('Aujourd’hui','acc',true):sel===0&&d.h?U.chip('Pointé : '+(d.real||hh(d.h)),'ok',true):d.swap&&E.swap==='ok'?U.chip('Échangé avec Lucie','warn',true):'')+'</div>'+
     (d.parts.length?d.parts.map(function(pt){var l=pt[3];return '<div class="em-sh"><span class="br"'+(l?' style="--c:'+p.color+'"':'')+'></span><div class="grow"><div class="hh">'+hm(pt[0])+' à '+hm(pt[1])+'</div><div class="s mut">'+pt[2]+(l?' · '+D.club.arenas.find(function(a){return a.id===l.arena}).name:'')+'</div></div>'+(l?'<div class="hrow" style="--g:8px">'+U.avs(l.riders,3)+(sel===1?'<button class="btn sm pri" data-les="g5">Appel</button>':'<span class="chip">'+l.riders.length+'/'+l.cap+'</span>')+'</div>':'<span class="chip">'+hh((toMin(pt[1])-toMin(pt[0]))/60)+'</span>')+'</div>'}).join(''):'<div class="empty">'+ICON('holiday')+'<b style="color:var(--ink)">Jour de repos</b><span class="s">'+(m?'Aucune reprise ce jour-là.':D.nights&&D.nights[sel]&&D.nights[sel]!=='s05'?'Astreinte de nuit assurée par '+D.staffer(D.nights[sel]).first+'.':'Profitez de votre journée.')+'</span></div>')+
     (d.night&&!m?'<div class="em-sh"><span class="br" style="--c:var(--c5)"></span><div class="grow"><div class="hh">Astreinte de 20 h à 7 h</div><div class="s mut">Vous dormez sur place. Prime de 18 €.</div></div><button class="btn sm" data-night>Consignes</button></div>':'')+
     (d.note&&!m?'<div class="cf s mut">'+ICON('info','sm')+d.note+'</div>':'')+(!m&&d.parts.length&&sel>1?'<div class="cf"><button class="btn sm" data-swapnew>'+ICON('swap','sm')+'Échanger ce jour</button><button class="btn sm ghost" data-go="emp-conges">'+ICON('holiday','sm')+'Poser un congé</button></div>':'')+'</div>';
   x+='<div class="card"><div class="ch" style="padding-bottom:10px"><h3>Ma semaine</h3><span class="s mut">'+(m?'Reprises et travail':'Écurie et astreinte')+'</span></div><div class="em-ax"><span></span><div><span>6 h</span><span>11 h</span><span>16 h</span><span>21 h</span></div><span></span></div>'+Wk.map(function(s,i){return '<button class="em-gt'+(i===1?' td':'')+'" data-day="'+i+'"><span class="dl">'+s.l+' '+s.n+'</span><span class="tr">'+s.parts.map(function(pt){var a=(toMin(pt[0])-360)/900*100,w=(toMin(pt[1])-toMin(pt[0]))/900*100;return '<i class="'+(i===0?'past':'')+'" style="left:'+a.toFixed(1)+'%;width:'+w.toFixed(1)+'%"></i>'}).join('')+(s.night&&!m?'<i class="n" style="left:93.3%;width:6.7%"></i>':'')+'</span><span class="tt">'+(s.h?hh(s.h):'Repos')+'</span></button>'}).join('')+'<div class="cf s mut" style="margin-top:8px">'+P.chart.legend(m?[['Reprises et travail','var(--acc)']]:[['Travail','var(--acc)'],['Astreinte de nuit','var(--c5)']])+'</div></div>';
   x+='</div><div class="stack'+(first?' rise':'')+'" style="--g:14px">';
   x+='<div class="card"><div class="ch"><h3>Mes heures</h3><button class="btn ghost sm" data-go="emp-pointage">Pointage'+ICON('arrow','sm')+'</button></div><div class="cb stack" style="--g:12px"><div class="em-bigh">'+(m?'8 h 00':hh(monH()+E.clock.base/3600))+'<small> faites sur '+hh(tot)+'</small></div>'+U.bar((m?8:monH()+E.clock.base/3600)/tot*100)+
     '<div class="stack" style="--g:8px">'+(m?[['Contrat','35 h par semaine'],['Reprises cette semaine',Wk.reduce(function(a,s){return a+s.parts.filter(function(q){return q[3]}).length},0)+' reprises'],['Cavaliers encadrés','58 cette semaine']]:[['Contrat','39 h par semaine'],['Heures supplémentaires',(tot>39?hh(tot-39):'Aucune')+', majorées de 25 %'],['Compteur de récupération',hh(hrOf().rec)+' à poser']]).map(function(r){return '<div class="hrow sp s"><span class="mut">'+r[0]+'</span><b class="num">'+r[1]+'</b></div>'}).join('')+'</div></div></div>';
   if(!m){x+='<div class="card"><div class="ch"><h3>Échanges de créneaux</h3>'+(E.swap?'':U.chip('1 demande','acc',true))+'</div><div class="cb stack" style="--g:12px"><div class="hrow" style="--g:12px;align-items:flex-start">'+U.av('s06','lg')+'<div class="grow"><div class="b">Lucie vous propose un échange</div><div class="s mut" style="margin-top:2px">Elle prend votre <b style="color:var(--ink)">samedi 21 '+(Wk[5].parts.length?'de '+hm(Wk[5].parts[0][0])+' à '+hm(Wk[5].parts[Wk[5].parts.length-1][1]):'')+'</b> et vous prenez son <b style="color:var(--ink)">dimanche 29 de 7 h à 12 h 30</b>.</div></div></div>'+
     (E.swap==='ok'?'<div class="note ok">'+ICON('checkc','sm')+'<span>Vous avez accepté. Claire doit encore valider l’échange.</span></div>':E.swap==='no'?'<div class="note">'+ICON('info','sm')+'<span>Vous avez refusé. Lucie est prévenue.</span></div>':'<div class="g2" style="--g:8px;grid-template-columns:1fr 1fr"><button class="btn em-b" data-sw="no">Refuser</button><button class="btn em-b pri" data-sw="ok">'+ICON('check')+'Accepter</button></div>')+
     (E.swap2?'<div class="hr"></div><div class="hrow" style="--g:12px">'+ico('send','','var(--acc)')+'<div class="grow"><div class="b s">Votre proposition à '+D.staffer(E.swap2.to).first+'</div><div class="xs mut">'+E.swap2.a+' contre '+E.swap2.b.toLowerCase()+'</div></div>'+U.chip('En attente','warn',true)+'</div>':'')+'</div></div>';
    x+='<div class="card"><div class="ch" style="padding-bottom:6px"><h3>Astreintes de nuit</h3><button class="btn ghost sm" data-night>Consignes'+ICON('arrow','sm')+'</button></div>'+myNights().map(function(n){var s=D.staffer(n[1]),mine=n[1]==='s05';return '<div class="em-row"'+(mine?' style="background:var(--acc-pale)"':'')+'><span class="em-tm" style="font-family:var(--f-text)">'+n[0]+'</span>'+U.av(s,'sm')+'<div class="grow t" style="font-size:13.5px">'+(mine?'Vous, de 20 h à 7 h':s.first+' '+s.last)+'</div>'+(n[2]?U.chip('Colique de Xanthos','bad'):mine?ICON('moonstar'):'')+'</div>'}).join('')+'</div>'}
   else x+='<div class="card"><div class="ch" style="padding-bottom:6px"><h3>Mes cavaliers à suivre</h3></div>'+[['m019','Prépare le Galop 7, travail du galop à faux'],['m003','Deux absences ce mois-ci'],['m011','Premier concours dimanche à Rambouillet']].map(function(r){return '<div class="em-row">'+U.av(r[0])+'<div class="grow"><div class="t">'+D.name(r[0])+'</div><div class="s">'+r[1]+'</div></div></div>'}).join('')+'</div>';
   x+='</div></div>';el.innerHTML=x;if(first)P.animate(el);first=false}
  on(el,'[data-day]',function(b){sel=+b.getAttribute('data-day');draw()});
  on(el,'[data-swapnew]',function(){swapSheet(draw)});
  on(el,'[data-night]',function(){nightSheet()});
  on(el,'[data-les]',function(){lessonSheet(D.empHugo.find(function(x){return x.id==='g5'}),draw)});
  on(el,'[data-sw]',function(b){E.swap=b.getAttribute('data-sw');draw();say(E.swap==='ok'?'Échange accepté, en attente de la validation de Claire':'Échange refusé, Lucie est prévenue')});
  online(el,draw);draw()}});

/* ---------- Soins ---------- */
function careSheet(c,draw){var h=D.horse(c.horse),dose=0;
  var s=P.sheet({title:'Valider le soin',icon:c.icon,body:'<div class="stack" style="--g:16px"><div class="hrow">'+U.hav(h,'lg')+'<div class="grow"><b class="l">'+h.name+' · '+h.box+'</b><div class="s mut">'+c.kind+' prévu à '+hm(c.t)+'</div></div></div>'+
   '<div class="card flat" style="padding:14px"><div class="em-h2" style="font-size:17px">'+c.prod+'</div><div style="margin-top:4px;font-size:14.5px">'+c.poso+'</div><div class="s mut" style="margin-top:6px">'+c.why+'</div></div>'+
   '<div><span class="em-lbl">Ce qui a été donné</span>'+tri('dose',['Tout','Une partie','Refusé'],0)+'</div>'+
   (c.lot?'<div><span class="em-lbl">Numéro de lot</span><div class="hrow" style="--g:8px"><input class="in em-in mono" id="cs-lot" value="'+c.lot+'" style="flex:1"><button class="btn em-b" data-lot>'+ICON('scan')+'Scanner la boîte</button></div></div>':'')+
   '<div><span class="em-lbl">Observation</span><div class="hrow" style="--g:8px;align-items:stretch"><textarea class="in" rows="2" style="min-height:76px" placeholder="Rien à signaler"></textarea><button class="em-add" data-mic>'+ICON('mic')+'<span>Dicter</span></button></div></div>'+
   '<div class="note">'+ICON('shield','sm')+'<span>Ce soin sera inscrit au <b>registre sanitaire</b> à votre nom, daté de 9 h 41. Une écriture validée ne peut plus être modifiée.</span></div></div>',
   foot:'<button class="btn em-b pri block" data-ok>'+ICON('check')+'Valider et inscrire au registre</button>'});
  bindTri(s,function(k,v){dose=v});var ta=s.querySelector('textarea');
  s.querySelector('[data-mic]').onclick=function(e){dictate(e.currentTarget,ta,'Pris sans difficulté, le cheval est calme.')};
  var lb=s.querySelector('[data-lot]');if(lb)lb.onclick=function(){var i=s.querySelector('#cs-lot');i.value='';lb.disabled=true;setTimeout(function(){i.value=c.lot;lb.disabled=false;lb.innerHTML=ICON('check')+'Lot reconnu';P.toast('Lot '+c.lot+' reconnu, périmé en mars 2028',{icon:'scan'})},P.RM?10:700)};
  s.querySelector('[data-ok]').onclick=function(){var n='RS-2026-'+(1184+Object.keys(E.care).length),lot=s.querySelector('#cs-lot');E.care[c.id]='9 h 41';c.reg=n;
   D.empRegister.unshift({n:n,d:'Auj. 9 h 41',horse:h.id,what:c.kind+' : '+c.prod+(lot&&lot.value?' (lot '+lot.value+')':'')+(dose?', '+['','une partie de la dose','refusé'][dose]:''),by:E.who,fresh:true});
   var dc=D.care.find(function(x){return x.horse===h.id&&x.kind===c.kind&&x.status!=='fait'});if(dc)dc.status='fait';if(c.kind==='Vermifuge'){h.worm=D.iso(D.day(0));h.alerts=h.alerts.filter(function(a){return !/ermifuge/.test(a)});if(!h.alerts.length)h.status='ok'}
   (E.obs[h.id]=E.obs[h.id]||[]).unshift({who:E.who,when:'À l’instant',text:c.kind+' : '+c.prod+'. '+(ta.value||'Rien à signaler.'),kind:'soin'});
   s.close();draw();say('Soin inscrit au registre sanitaire sous le numéro '+n)}}

P.mod({id:'emp-soins',role:'employe',group:'Écurie',title:'Soins du jour',icon:'care',n:20,phoneTitle:'Soins',
 badge:function(){var n=careLeft();return n?{v:n,hot:true}:null},
 render:function(el,ctx){var tab='todo',first=true;
  function card(c){var h=D.horse(c.horse),dn=c.done||E.care[c.id];
   return '<div class="card em-care'+(dn?' done':'')+'"><div class="hrow" style="--g:12px;align-items:flex-start">'+ico(c.icon,'lg',dn?'var(--ok)':c.late?'var(--bad)':'var(--acc)')+'<div class="grow"><div class="hrow wrap" style="--g:6px"><b style="font-size:15px">'+c.kind+'</b>'+(dn?U.chip('Fait à '+dn,'ok',true):c.late?U.chip('En retard, prévu à '+hm(c.t),'bad',true):U.chip('À '+hm(c.t),'',false))+'</div><button class="hrow s" style="--g:6px;margin-top:4px;color:var(--ink-2);font-weight:600" data-go="emp-cheval" data-id="'+h.id+'">'+U.hav(h,'sm')+h.name+'<span class="em-bxs" style="margin:0">'+h.box+'</span></button></div></div>'+
    '<div><div class="pd">'+c.prod+'</div><div style="font-size:14.5px;margin-top:3px">'+c.poso+'</div><div class="s mut" style="margin-top:4px">'+c.why+'</div></div>'+
    (dn?'<div class="hrow sp"><span class="hrow s" style="--g:6px;color:var(--ink-2)"><span class="strass"></span>Inscrit au registre sanitaire</span><span class="em-reg">'+(c.reg||'RS-2026-118'+(c.id==='q5'?2:3))+'</span></div>':'<div class="hrow" style="--g:8px"><button class="btn em-b pri grow" data-care="'+c.id+'">'+ICON('check')+'Valider le soin</button><button class="btn em-b" data-later="'+c.id+'" title="Reporter ce soin">'+ICON('clock')+'Reporter</button></div>')+'</div>'}
  function draw(){var todo=D.empCare.filter(function(c){return !c.done&&!E.care[c.id]}),done=D.empCare.filter(function(c){return c.done||E.care[c.id]});todo.sort(function(a,b){return a.t<b.t?-1:1});
   var x=hd('Soins du jour',todo.length+' soin'+(todo.length>1?'s':'')+' à donner · '+done.length+' fait'+(done.length>1?'s':'')+' · chaque validation alimente le registre sanitaire',U.seg([['todo','À donner <b class="num">'+todo.length+'</b>'],['done','Faits <b class="num">'+done.length+'</b>'],['reg','Registre']],tab,'data-tab'));
   if(tab==='reg')x+='<div class="card'+(first?' rise':'')+'"><div class="ch" style="padding-bottom:6px"><div><h3>Registre sanitaire</h3><div class="xs mut">Obligatoire pour tout détenteur d’équidés, conservé 5 ans</div></div><button class="btn sm" data-pdf>'+ICON('download','sm')+'Exporter en PDF</button></div>'+D.empRegister.map(function(r){var h=D.horse(r.horse),s=D.staffer(r.by);return '<div class="em-row'+(r.fresh?' fade':'')+'">'+U.hav(h)+'<div class="grow"><div class="t">'+h.name+' · '+r.what+'</div><div class="s">'+r.d+' · par '+s.first+' '+s.last+'</div></div><span class="em-reg hide-s">'+r.n+'</span>'+ICON('lock','sm')+'</div>'}).join('')+'</div>';
   else{var L=tab==='todo'?todo:done;x+=L.length?'<div class="em-cg'+(first?' rise':'')+'">'+L.map(card).join('')+'</div>':'<div class="card">'+U.empty('checkc','Tous les soins du jour sont donnés','Ils sont inscrits au registre sanitaire.','<button class="btn sm" data-tab="reg">Voir le registre</button>')+'</div>'}
   el.innerHTML=x;if(first)P.animate(el);first=false}
  on(el,'[data-tab]',function(b){if(tab===b.getAttribute('data-tab'))return;tab=b.getAttribute('data-tab');first=true;draw();swBody(el)});
  on(el,'[data-care]',function(b){careSheet(D.empCare.find(function(c){return c.id===b.getAttribute('data-care')}),draw)});
  on(el,'[data-later]',function(b){var c=D.empCare.find(function(q){return q.id===b.getAttribute('data-later')}),old=c.t,ol=c.late;c.t='14:00';c.late=false;draw();say('Soin reporté à 14 h, Claire est prévenue',{icon:'clock',undo:function(){c.t=old;c.late=ol;if(el.isConnected)draw()}})});
  on(el,'[data-pdf]',function(){P.toast('Registre sanitaire du 4e trimestre exporté en PDF',{icon:'download'})});
  online(el,draw);draw()}});

/* =====================================================================
   7 · Pointage et 8 · Signaler un incident
   ===================================================================== */
P.css(`
.em-plan{display:block;width:100%;max-width:460px;margin:0 auto;height:auto;border-radius:var(--r-md);background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line)}
.em-plan rect.z{fill:var(--surface);stroke:var(--line-2);stroke-width:1;transition:fill var(--t-2),stroke var(--t-2)}
.em-plan g.gr rect.z{fill:var(--ok-pale)}
.em-plan g[data-zone]{cursor:pointer}
.em-plan g[data-zone]:hover rect.z{stroke:var(--acc)}
.em-plan g.on rect.z{fill:var(--acc-pale);stroke:var(--acc);stroke-width:2}
.em-plan text{font:600 9.5px var(--f-text);fill:var(--ink-2);pointer-events:none}
.em-plan g.on text{fill:var(--acc)}
.em-plan .pin{transform-box:fill-box;transform-origin:50% 100%;animation:em-pin .5s var(--e-spring) both}
.em-plan .pin path{fill:var(--bad);stroke:var(--surface);stroke-width:1.5}
.em-plan .pin.me path{fill:var(--acc)}
.em-plan .pin circle{fill:var(--surface)}
.em-plan .halo{fill:var(--acc);opacity:.18;transform-box:fill-box;transform-origin:center;animation:em-halo 2s var(--e-out) infinite}
@keyframes em-pin{from{transform:translateY(-26px) scale(.6);opacity:0}}
@keyframes em-halo{from{transform:scale(.4);opacity:.4}to{transform:scale(1.6);opacity:0}}
.em-pt{padding:22px 18px;display:flex;flex-direction:column;align-items:center;gap:16px;text-align:center}
.em-hold{width:212px;height:212px;border-radius:50%;position:relative;display:grid;place-items:center;touch-action:none;user-select:none;-webkit-user-select:none;transition:transform var(--t-2) var(--e-out)}
.em-hold .dk{position:absolute;inset:14px;border-radius:50%;background:var(--navy);color:var(--navy-ink);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;box-shadow:var(--shadow-2);transition:background var(--t-3) var(--e-out),color var(--t-3),transform var(--t-2) var(--e-out)}
.em-hold.em-s-out .dk{background:var(--acc);color:var(--acc-ink)}
.em-hold.em-s-pause .dk{background:var(--surface);color:var(--ink);box-shadow:inset 0 0 0 2px var(--line-2)}
.em-hold.press .dk{transform:scale(.95)}
.em-hold svg.rg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}
.em-hold svg.rg circle{fill:none;stroke-width:6;stroke-linecap:round}
.em-hold svg.rg .bg{stroke:var(--line)}
.em-hold svg.rg .fg{stroke:var(--acc);stroke-dasharray:628.3;stroke-dashoffset:628.3}
.em-hold.rel svg.rg .fg{transition:stroke-dashoffset 180ms var(--e-out)}
.em-hold.done{animation:em-bump .5s var(--e-spring)}
.em-hold .lb{font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;opacity:.72}
.em-hold .tm{font:700 34px/1.05 var(--f-display);letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.em-hold .sb{font-size:13px;font-weight:600;opacity:.8;max-width:130px;line-height:1.25}
.em-hold.nudge .sb{animation:em-nudge .5s var(--e-out)}
@keyframes em-nudge{25%{transform:translateX(-5px)}60%{transform:translateX(5px)}}
.em-wb{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px;align-items:end;height:120px}
.em-wb div{display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:5px;height:100%;font-size:13px;color:var(--mut);font-weight:600}
.em-wb i{width:100%;max-width:34px;border-radius:7px 7px 3px 3px;background:var(--acc);height:var(--h);min-height:3px;animation:grow .7s var(--e-out) both;transform-origin:bottom}
.em-wb .pl i{background:transparent;box-shadow:inset 0 0 0 1.5px var(--line-2)}
.em-wb .td i{background:linear-gradient(to top,var(--acc) var(--d),transparent var(--d));box-shadow:inset 0 0 0 1.5px var(--acc)}
.em-wb .td{color:var(--acc)}
.em-wb b{font-size:13px;color:var(--ink);font-variant-numeric:tabular-nums}
.em-ty{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.em-ty button{height:86px;border-radius:var(--r-lg);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;font-size:13px;font-weight:600;line-height:1.15;text-align:center;padding:0 6px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2);transition:background var(--t-2),color var(--t-2),transform var(--t-1) var(--e-out)}
.em-ty button svg.i{width:24px;height:24px;color:var(--acc)}
.em-ty button:active{transform:scale(.96)}
.em-ty button[aria-pressed="true"]{background:var(--navy);color:var(--navy-ink);box-shadow:var(--shadow-2)}
.em-ty button[aria-pressed="true"] svg.i{color:var(--navy-ink)}
.em-step{display:flex;align-items:center;gap:8px;font:650 15px var(--f-display);letter-spacing:-.015em;margin-bottom:10px}
.em-step i{width:22px;height:22px;border-radius:50%;background:var(--bg-2);color:var(--ink-2);font:700 13px var(--f-text);display:grid;place-items:center;font-style:normal}
.em-form{padding:18px;display:flex;flex-direction:column;gap:22px}
@container main (max-width:520px){.em-form{padding:16px 14px;gap:20px}.em-hold{width:200px;height:200px}}
`);

var ZN=[['pad1','Paddock d’hiver',8,8,100,60,1],['pad2','Prairie du bas',116,8,110,60,1],['pad3','Paddock des poneys',234,8,98,60,1],['man','Grand manège',8,76,120,64],['car','Carrière d’honneur',136,76,196,64],['ecp','Écurie principale',8,148,150,40],['ecq','Écurie des poneys',8,194,150,38],['sel','Sellerie',166,148,60,40],['han','Hangar à foin',166,194,60,38],['pca','Petite carrière',234,148,98,40],['lon','Rond de longe',234,194,98,38]];
function planSvg(sel,meZone){var s='<svg class="em-plan" viewBox="0 0 340 240" role="img" aria-label="Plan de l’écurie">';
  ZN.forEach(function(z){s+='<g data-zone="'+z[0]+'" class="'+(z[6]?'gr ':'')+(sel===z[0]?'on':'')+'"><rect class="z" x="'+z[2]+'" y="'+z[3]+'" width="'+z[4]+'" height="'+z[5]+'" rx="7"/><text x="'+(z[2]+z[4]/2)+'" y="'+(z[3]+z[5]/2+3.5)+'" text-anchor="middle">'+z[1]+'</text></g>'});
  var p=ZN.find(function(z){return z[0]===(meZone||sel)});if(p){var cx=p[2]+p[4]/2,cy=p[3]-2;if(meZone)s+='<circle class="halo" cx="'+cx+'" cy="'+(cy+6)+'" r="14"/>';
   s+='<g class="pin'+(meZone?' me':'')+'"><path d="M'+cx+' '+(cy+8)+'c-5-6-8-9.500-8-13a8 8 0 0 1 16 0c0 3.500-3 7-8 13z"/><circle cx="'+cx+'" cy="'+(cy-5)+'" r="2.800"/></g>'}
  return s+'</svg>'}
function zoneName(z){var x=ZN.find(function(q){return q[0]===z});return x?x[1]:''}

P.mod({id:'emp-pointage',role:'employe',group:'Moi',title:'Pointage',icon:'clockin',n:10,
 render:function(el,ctx){var C=E.clock,first=true,iv=null;
  function secs(){return C.state==='in'?C.base+Math.floor((Date.now()-E.t0)/1000):C.base}
  function fmtT(s){var h=Math.floor(s/3600),m=Math.floor(s%3600/60),x=s%60;return h+':'+String(m).padStart(2,'0')+':'+String(x).padStart(2,'0')}
  function draw(){var st=C.state,wk=(Math.floor(secs()/60)+Math.round(monH()*60))/60,m=mon(),W=myWeek(),tot=W.reduce(function(a,q){return a+q.h},0),mx=Math.max.apply(null,W.map(function(q){return q.h}).concat([monH()]));
   var x=hd('Pointage','Mardi 17 novembre · '+(st==='out'?'vous n’êtes pas en service':st==='pause'?'en pause depuis '+C.pauseAt:'en service depuis '+C.since),'<button class="btn" data-fix>'+ICON('edit','sm')+'Corriger un pointage</button>');
   x+='<div class="em-cols eq"><div class="stack'+(first?' rise':'')+'" style="--g:14px"><div class="card em-pt">'+
     '<button class="em-hold em-s-'+st+'" data-hold aria-label="'+(st==='out'?'Maintenir pour pointer mon arrivée':st==='pause'?'Maintenir pour reprendre le travail':'Maintenir pour pointer mon départ')+'"><svg class="rg" viewBox="0 0 212 212"><circle class="bg" cx="106" cy="106" r="100"/><circle class="fg" cx="106" cy="106" r="100"/></svg>'+
     '<span class="dk"><span class="lb">'+(st==='out'?'Hors service':st==='pause'?'En pause':'En service')+'</span><span class="tm" data-tm>'+(st==='out'?(C.left||'9 h 41'):fmtT(secs()))+'</span><span class="sb">'+(st==='out'?'Maintenez pour pointer l’arrivée':st==='pause'?'Maintenez pour reprendre':'Maintenez pour pointer le départ')+'</span></span></button>'+
     '<div class="s mut" style="max-width:300px">Un appui long d’une seconde évite les pointages par erreur, même avec des gants.</div>'+
     (st==='in'?'<button class="btn em-b block" data-pause>'+ICON('pause')+'Prendre ma pause</button>':st==='out'?'<div class="note ok" style="text-align:left;width:100%">'+ICON('checkc','sm')+'<span>Départ pointé à '+(C.left||'9 h 41')+'. Journée de '+hh(C.base/3600)+' enregistrée.</span></div>':'<div class="note" style="text-align:left;width:100%">'+ICON('info','sm')+'<span>La pause de midi n’est pas comptée dans votre temps de travail.</span></div>')+'</div>'+
     '<div class="card"><div class="ch"><h3>Position vérifiée</h3>'+U.chip('À 12 m de la sellerie','ok',true)+'</div><div class="cb stack" style="--g:10px">'+planSvg(null,'sel')+'<div class="xs mut">Stabl vérifie seulement que vous êtes à l’écurie au moment du pointage. Votre position n’est pas suivie pendant la journée.</div></div></div></div>';
   x+='<div class="stack'+(first?' rise':'')+'" style="--g:14px"><div class="card"><div class="ch"><h3>Aujourd’hui</h3><span class="s mut">Prévu : '+W[1].parts.map(function(q){return hm(q[0])+' à '+hm(q[1])}).join(', ')+'</span></div><div class="cb"><div class="tl">'+C.log.slice().reverse().map(function(l,i){return '<div class="ev em-ev'+(l[3]&&i===0?' fade':'')+'" style="--c:var(--'+(/Départ/.test(l[1])?'bad':/ause/.test(l[1])?'warn':'ok')+')"><div class="hrow sp"><b>'+l[1]+'</b><span class="s num b">'+l[0]+'</span></div><div class="s mut">'+l[2]+'</div></div>'}).join('')+'</div></div></div>'+
     '<div class="card"><div class="ch"><h3>Ma semaine</h3><span class="s mut">Du 16 au 22 novembre</span></div><div class="cb stack" style="--g:14px"><div class="em-bigh"><span data-wk>'+hh(wk)+'</span><small> sur '+(m?'35 h':hh(tot))+' prévues</small></div>'+
     '<div class="em-wb">'+W.map(function(s,i){var v=i===0?monH():i===1?secs()/3600:s.h;return '<div class="'+(i===1?'td':i>1?'pl':'')+'"><b>'+(s.h?(i===0?hh(monH()):i===1?hh(Math.floor(v*60)/60):hh(s.h)):'')+'</b><i style="--h:'+(i===1?s.h:v)/mx*72+'%;--d:'+Math.min(100,v/s.h*100||0).toFixed(0)+'%"></i>'+s.l+'</div>'}).join('')+'</div>'+
     P.chart.legend([['Pointé','var(--acc)'],['Prévu','var(--line-2)']])+'<div class="hr"></div>'+[['Heures supplémentaires de la semaine',(tot>39?hh(tot-39):'Aucune')+' prévues'],['Retards ce mois-ci','Aucun'],['Compteur de récupération',hh(hrOf().rec)]].map(function(r){return '<div class="hrow sp s"><span class="mut">'+r[0]+'</span><b class="num">'+r[1]+'</b></div>'}).join('')+
     '<button class="btn em-b block" data-export>'+ICON('download')+'Recevoir ma feuille d’heures</button></div></div></div></div>';
   el.innerHTML=x;if(first)P.animate(el);first=false;bindHold()}
  function bindHold(){var b=el.querySelector('[data-hold]'),fg=b.querySelector('.fg'),raf=0,t0=0,down=false,DUR=P.RM?150:800,L=628.3;
   function stop(ok){down=false;cancelAnimationFrame(raf);b.classList.remove('press');if(!ok){b.classList.add('rel');fg.style.strokeDashoffset=L;setTimeout(function(){b.classList.remove('rel')},200)}}
   function step(t){if(!down)return;var k=Math.min(1,(t-t0)/DUR);fg.style.strokeDashoffset=L*(1-k);if(k<1)raf=requestAnimationFrame(step);else{stop(true);toggle()}}
   function start(){if(down)return;down=true;b.classList.remove('rel','nudge');b.classList.add('press');t0=performance.now();raf=requestAnimationFrame(step)}
   b.addEventListener('pointerdown',function(e){e.preventDefault();try{b.setPointerCapture(e.pointerId)}catch(x){}start()});
   function up(){if(!down)return;var short=performance.now()-t0<DUR;stop(false);if(short){b.classList.add('nudge');setTimeout(function(){b.classList.remove('nudge')},520)}}
   b.addEventListener('pointerup',up);b.addEventListener('pointercancel',up);b.addEventListener('pointerleave',up);
   b.addEventListener('keydown',function(e){if((e.key===' '||e.key==='Enter')&&!e.repeat){e.preventDefault();start()}});b.addEventListener('keyup',function(e){if(e.key===' '||e.key==='Enter')up()});
   b.addEventListener('contextmenu',function(e){e.preventDefault()})}
  function toggle(){var st=C.state;if(st==='in'){C.base=secs();C.state='out';C.left='9 h 41';C.log.push(['9 h 41','Départ pointé','Sellerie, position vérifiée · journée de '+hh(Math.floor(C.base/60)/60),1])}
   else if(st==='out'){E.t0=Date.now();C.state='in';C.since='9 h 41';C.log.push(['9 h 41','Arrivée pointée','Sellerie, position vérifiée',1])}
   else{E.t0=Date.now();C.state='in';C.log.push(['9 h 41','Reprise après la pause','Pause de '+Math.max(1,Math.round((Date.now()-C.p0)/60000))+' min, non comptée',1])}
   draw();var b=el.querySelector('[data-hold]');b.classList.add('done');say(st==='in'?'Départ pointé à 9 h 41. Bonne fin de journée':st==='out'?'Arrivée pointée à 9 h 41, position vérifiée':'Pause terminée, bon courage',{icon:'clockin'})}
  on(el,'[data-pause]',function(){C.base=secs();C.state='pause';C.pauseAt='9 h 41';C.p0=Date.now();C.log.push(['9 h 41','Début de pause','Maintenez le bouton pour reprendre',1]);draw();say('Pause commencée à 9 h 41',{icon:'pause'})});
  on(el,'[data-export]',function(){P.toast('Feuille d’heures de la semaine envoyée à antoine.leroy@exemple.fr',{icon:'mail'})});
  on(el,'[data-fix]',function(){var s=P.sheet({title:'Corriger un pointage',icon:'edit',body:'<div class="stack" style="--g:14px"><p class="s mut">Un oubli ou une erreur ? Claire reçoit votre demande et la valide. L’heure d’origine reste visible dans l’historique.</p><label class="field"><span>Jour</span><select class="in em-in"><option>Lundi 16 novembre</option><option>Mardi 17 novembre</option></select></label><div class="g2" style="--g:10px;grid-template-columns:1fr 1fr"><label class="field"><span>Arrivée</span><input class="in em-in num" type="time" value="07:02"></label><label class="field"><span>Départ</span><input class="in em-in num" type="time" value="17:01"></label></div><label class="field"><span>Motif</span><select class="in em-in"><option>J’ai oublié de pointer</option><option>Pas de réseau, pointage non parti</option><option>Je suis resté plus tard pour un cheval</option></select></label></div>',foot:'<button class="btn em-b pri block" data-send>'+ICON('send')+'Envoyer à Claire</button>'});s.querySelector('[data-send]').onclick=function(){s.close();say('Demande de correction envoyée à Claire',{icon:'send'})}});
  online(el,draw);draw();
  iv=setInterval(function(){if(!el.isConnected){clearInterval(iv);return}if(C.state==='out')return;var t=el.querySelector('[data-tm]');if(t)t.textContent=C.state==='pause'?fmtT(Math.floor((Date.now()-C.p0)/1000)):fmtT(secs())},1000)}});

/* ---------- Signaler ---------- */
var TY=[['cheval','Cheval blessé','care'],['cloture','Clôture cassée','paddock'],['eau','Abreuvoir en panne','drop'],['stock','Stock bas','stock'],['materiel','Matériel cassé','wrench'],['autre','Autre chose','more']];
P.mod({id:'emp-signaler',role:'employe',group:'Écurie',title:'Signaler',icon:'alert',n:30,phoneTitle:'Signaler',
 render:function(el,ctx){var S={type:ctx.params.type||null,sev:1,zone:'ecp',photos:0,note:'',horse:ctx.params.id||'h23',prod:'k2'},first=true,sending=false;
  function extra(){if(S.type==='cheval')return '<div class="stack fade" style="--g:8px;margin-top:10px"><select class="in em-in" data-horse aria-label="Cheval concerné">'+D.horses.map(function(h){return '<option value="'+h.id+'"'+(h.id===S.horse?' selected':'')+'>'+h.name+' · '+h.box+'</option>'}).join('')+'</select><button class="btn em-b" data-vet>'+ICON('phone')+'Appeler d’abord le vétérinaire</button></div>';
   if(S.type==='stock')return '<div class="hrow wrap fade" style="--g:6px;margin-top:10px">'+D.stock.map(function(k){return '<button class="tag" data-manual data-prod="'+k.id+'" aria-pressed="'+(S.prod===k.id)+'" style="height:40px;padding:0 14px">'+k.name+' <span class="num" style="opacity:.6">'+k.qty+'</span></button>'}).join('')+'</div>';return ''}
  function mine(){return D.empIncidents.slice(0,5).map(function(i,k){return '<div class="em-row'+(i.fresh&&k===0?' fade':'')+'" style="align-items:flex-start"><span class="em-st" style="margin-top:6px;--c:var(--'+(i.sev===2?'bad':i.sev===1?'warn':'mut-2')+')"></span><div class="grow"><div class="t">'+i.kind+' · '+i.where+'</div><div class="s">'+i.txt+'</div><div class="hrow wrap" style="--g:8px;margin-top:6px">'+U.chip(i.st,/Vu|Pris|Commande/.test(i.st)?'ok':'acc',true)+'<span class="xs mut">'+i.when+'</span></div></div></div>'}).join('')}
  function draw(){var x=hd('Signaler un incident','Dix secondes suffisent. Claire est prévenue tout de suite, avec la photo et le lieu.','<button class="btn" data-vet>'+ICON('phone','sm')+'Vétérinaire</button>');
   x+='<div class="em-cols"><div class="card em-form'+(first?' rise':'')+'">'+
    '<div><div class="em-step"><i>1</i>Que se passe-t-il ?</div><div class="em-ty">'+TY.map(function(t){return '<button data-ty="'+t[0]+'" aria-pressed="'+(S.type===t[0])+'">'+ICON(t[2])+t[1]+'</button>'}).join('')+'</div><div data-extra>'+extra()+'</div></div>'+
    '<div><div class="em-step"><i>2</i>Montrez et racontez</div><div class="hrow" style="--g:8px;align-items:stretch" data-ph>'+Array.apply(null,Array(S.photos)).map(function(_,k){return shot('Photo '+(k+1))}).join('')+'<button class="em-add" data-photo>'+ICON('image')+'Photo</button><button class="em-add" data-mic>'+ICON('mic')+'<span>Dicter</span></button></div><textarea class="in" rows="2" style="margin-top:8px" placeholder="Décrivez en quelques mots (facultatif)" data-note>'+F.esc(S.note)+'</textarea></div>'+
    '<div><div class="em-step"><i>3</i>Est-ce grave ?</div>'+tri('sev',['Pour info','Aujourd’hui','Urgent'],S.sev)+'</div>'+
    '<div><div class="em-step"><i>4</i>Où ? <span class="chip acc" style="margin-left:auto" data-zl>'+ICON('pin','sm')+zoneName(S.zone)+'</span></div><div data-plan>'+planSvg(S.zone)+'</div><div class="xs mut" style="margin-top:6px">Lieu proposé d’après votre position. Touchez le plan pour le changer.</div></div>'+
    '<button class="btn em-b pri block hide-s" data-send>'+ICON('send')+'Envoyer à Claire</button></div>';
   x+='<div class="stack'+(first?' rise':'')+'" style="--g:14px"><div class="card"><div class="ch" style="padding-bottom:6px"><h3>Mes signalements</h3><span class="s mut">Suivi en direct</span></div><div data-mine>'+mine()+'</div></div>'+
    '<div class="note">'+ICON('bell','sm')+'<span>Un signalement <b>urgent</b> fait sonner le téléphone de Claire et de la personne d’astreinte. Les autres arrivent dans sa liste « À traiter ».</span></div></div></div>'+
    '<div class="em-sticky"><button class="btn em-b pri" data-send>'+ICON('send')+'Envoyer à Claire</button></div>';
   el.innerHTML=x;if(first)P.animate(el);first=false}
  on(el,'[data-ty]',function(b){S.type=b.getAttribute('data-ty');$$('[data-ty]',el).forEach(function(q){q.setAttribute('aria-pressed',q===b)});el.querySelector('[data-extra]').innerHTML=extra();if(S.type==='stock'){S.zone='han';zone()}if(S.type==='cloture'){S.zone='pad1';zone()}});
  function zone(){el.querySelector('[data-plan]').innerHTML=planSvg(S.zone);el.querySelector('[data-zl]').innerHTML=ICON('pin','sm')+zoneName(S.zone)}
  on(el,'[data-zone]',function(g){S.zone=g.getAttribute('data-zone');zone()});
  on(el,'[data-prod]',function(b){S.prod=b.getAttribute('data-prod');$$('[data-prod]',el).forEach(function(q){q.setAttribute('aria-pressed',q===b)})});
  el.addEventListener('change',function(e){if(e.target.matches('[data-horse]'))S.horse=e.target.value});
  el.addEventListener('input',function(e){if(e.target.matches('[data-note]'))S.note=e.target.value});
  bindTri(el,function(k,v){S.sev=v});
  on(el,'[data-photo]',function(b){if(S.photos>2){P.toast('Trois photos au maximum',{icon:'info'});return}S.photos++;b.insertAdjacentHTML('beforebegin',shot('Photo '+S.photos))});
  on(el,'[data-mic]',function(b){var ta=el.querySelector('[data-note]');dictate(b,ta,S.type==='cloture'?'La lisse du haut est cassée côté chemin, deux chevaux peuvent passer.':S.type==='eau'?'L’abreuvoir ne se remplit plus, j’ai mis un seau en attendant.':'Je viens de le voir en passant, il faudrait venir regarder.');setTimeout(function(){S.note=ta.value},P.RM?50:2600)});
  on(el,'[data-vet]',function(){vetSheet(S.type==='cheval'?D.horse(S.horse):null)});
  on(el,'[data-send]',function(b){if(sending)return;var ta=el.querySelector('[data-note]');S.note=ta.value;if(!S.type){P.toast('Choisissez d’abord ce qui se passe',{icon:'alert'});var t=el.querySelector('.em-ty');t.scrollIntoView({block:'center',behavior:'smooth'});t.classList.remove('pop');void t.offsetWidth;t.classList.add('pop');return}
   sending=true;$$('[data-send]',el).forEach(function(q){q.innerHTML='Envoi en cours…';q.disabled=true});
   setTimeout(function(){var ty=TY.find(function(t){return t[0]===S.type}),h=D.horse(S.horse),it={id:'i'+Date.now(),kind:ty[1],where:S.type==='cheval'?h.name+' · '+h.box:zoneName(S.zone),when:'À l’instant',sev:S.sev,st:E.offline?'En attente du réseau':'Envoyé',txt:S.note||(S.type==='stock'?D.stock.find(function(k){return k.id===S.prod}).name+' bientôt épuisé.':'Sans commentaire.')+(S.photos?' '+S.photos+' photo'+(S.photos>1?'s':'')+'.':''),fresh:true};
    D.empIncidents.unshift(it);var sev=S.sev;S={type:null,sev:1,zone:'ecp',photos:0,note:'',horse:'h23',prod:'k2'};sending=false;if(!el.isConnected)return;draw();var mi=el.querySelector('[data-mine]');if(P.isMobile()&&mi)mi.scrollIntoView({block:'center',behavior:'smooth'});
    say(sev===2?'Signalement urgent envoyé. Le téléphone de Claire sonne':'Signalement envoyé à Claire',{icon:'send'});
    if(!E.offline)setTimeout(function(){it.st='Vu par Claire';it.fresh=false;var m=el.isConnected&&el.querySelector('[data-mine]');if(m){m.innerHTML=mine();var c=m.querySelector('.chip');if(c)c.classList.add('pop')}},P.RM?100:2600)},P.RM?10:650)});
  online(el,draw);draw()}});

/* =====================================================================
   9 · Messages et 10 · Congés et documents
   ===================================================================== */
P.css(`
.em-msgs{display:grid;grid-template-columns:minmax(0,400px) minmax(0,1fr);gap:16px;align-items:start}
.em-conv{display:flex;flex-direction:column;min-height:0}
.em-conv .bd{display:flex;flex-direction:column;gap:10px;padding:16px;overflow-y:auto}
.em-conv.pane .bd{height:min(52vh,440px)}
.em-conv .who{font-size:13px;font-weight:600;color:var(--mut);margin:0 0 -6px 4px}
.em-conv .rc{align-self:flex-end;font-size:13px;color:var(--mut);margin-top:-6px;display:flex;align-items:center;gap:4px}
.em-conv .rc svg.i{width:13px;height:13px}
.em-conv .rc.rd{color:var(--acc)}
.em-conv .msg{font-size:14.5px}
.em-qr{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:0 16px 10px}
.em-qr button{flex:none;height:38px;padding:0 14px;border-radius:99px;font-size:13.5px;font-weight:600;background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line)}
.em-comp{display:flex;gap:8px;align-items:center;padding:10px 12px;border-top:1px solid var(--line)}
.em-comp input{flex:1;min-width:0;height:46px;border:0;outline:0;border-radius:23px;padding:0 16px;background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);font-size:15px}
.em-comp .btn{width:46px;height:46px;border-radius:50%;padding:0}
.em-un{min-width:20px;height:20px;border-radius:10px;padding:0 6px;background:var(--acc);color:var(--acc-ink);font-size:13px;font-weight:700;display:grid;place-items:center}
.em-sol{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.em-sol .card{padding:14px;display:flex;flex-direction:column;gap:6px}
.em-sol .v{font:700 26px/1 var(--f-display);letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.em-sol .v small{font-size:13.5px;color:var(--mut);font-weight:600;letter-spacing:0}
.em-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;text-align:center}
.em-cal span{font-size:13px;font-weight:600;color:var(--mut);padding-bottom:4px}
.em-cal div{height:40px;border-radius:10px;display:grid;place-items:center;font-size:13px;font-weight:600;font-variant-numeric:tabular-nums;position:relative;justify-self:stretch}
.em-cal div.we{color:var(--mut-2)}
.em-cal div.pd{background:var(--acc-pale);color:var(--acc);box-shadow:inset 0 0 0 1.5px var(--acc-line)}
.em-cal div.ok{background:var(--ok-pale);color:var(--ok)}
.em-cal div.fe::after{content:"";position:absolute;bottom:5px;width:4px;height:4px;border-radius:50%;background:var(--bad)}
.em-cal div.ot::before{content:"";position:absolute;top:5px;right:5px;width:5px;height:5px;border-radius:50%;background:var(--c5)}
.em-pay{display:flex;justify-content:space-between;gap:12px;padding:11px 0;border-bottom:1px solid var(--line);font-size:14px}
@container main (max-width:900px){.em-msgs{grid-template-columns:minmax(0,1fr)}.em-msgs .em-conv.pane{display:none}}
@container main (max-width:520px){.em-sol{gap:8px}.em-sol .card{padding:12px 10px}.em-sol .v{font-size:22px}}
`);

function convHtml(th){var grp=!!th.grp,last=th.msgs[th.msgs.length-1];
  return '<div class="bd">'+th.msgs.map(function(m,i){var mine=m.w===E.who,p=D.staffer(m.w),prev=th.msgs[i-1];
    return (!mine&&grp&&(!prev||prev.w!==m.w)?'<div class="who">'+p.first+' · '+m.t+'</div>':'')+'<div class="msg '+(mine?'u':'a')+(m.fresh?'':'" style="animation:none')+'">'+F.esc(m.x)+'</div>'+
     (mine?'<div class="rc'+(m.read?' rd':'')+'">'+ICON(m.read?'checkc':'check')+(m.read?(grp?'Lu par '+(th.grp.length-1)+' sur '+th.grp.length:'Lu par '+D.staffer(th.with).first)+' · '+m.t:'Distribué · '+m.t)+'</div>':'')}).join('')+'</div>'+
   '<div class="em-qr">'+(last&&last.w!==E.who?['Bien reçu','C’est fait','J’arrive','Je regarde et je te dis']:['Merci','À tout à l’heure']).map(function(q){return '<button data-qr>'+q+'</button>'}).join('')+'</div>'+
   '<form class="em-comp"><button type="button" class="btn icon ghost" data-att title="Joindre une photo">'+ICON('image')+'</button><input placeholder="Écrire à '+(grp?'l’équipe':D.staffer(th.with).first)+'" aria-label="Votre message" autocomplete="off"><button class="btn pri" title="Envoyer">'+ICON('send')+'</button></form>'}
function bindConv(root,th,after){var box=root.querySelector('.em-conv')||root;
  function re(){box.innerHTML=convHtml(th);var bd=box.querySelector('.bd');bd.scrollTop=1e6;th.msgs.forEach(function(m){m.fresh=false})}
  function send(x){if(!x.trim())return;var m={w:E.who,t:'9 h 41',x:x.trim(),fresh:true};th.msgs.push(m);th.last=x;re();if(after)after();
   if(E.offline){E.queue++;return}setTimeout(function(){m.read=true;if(box.isConnected){var r=$$('.rc',box).pop();if(r){r.classList.add('rd');r.innerHTML=ICON('checkc')+(th.grp?'Lu par 2 sur '+th.grp.length:'Lu par '+D.staffer(th.with).first)+' · 9 h 42'}}},P.RM?100:1800)}
  box.addEventListener('submit',function(e){e.preventDefault();var i=box.querySelector('input');send(i.value)});
  on(box,'[data-qr]',function(b){send(b.textContent)});
  on(box,'[data-att]',function(){send('Photo envoyée depuis l’écurie.')});
  re()}

P.mod({id:'emp-messages',role:'employe',group:'Moi',title:'Messages',icon:'chat',n:20,
 badge:function(){var n=D.empThreads.reduce(function(a,t){return a+t.unread},0)+D.empConsignes.filter(function(c){return !c.mine&&!E.cons[c.id]}).length;return n?{v:n,hot:true}:null},
 render:function(el,ctx){var cur=ctx.params.id||'eq',first=true;
  function th(id){return D.empThreads.find(function(t){return t.id===id})}
  function threads(){return D.empThreads.map(function(t){var l=t.msgs[t.msgs.length-1],p=D.staffer(l.w);return '<button class="em-row" data-th="'+t.id+'"'+(t.id===cur&&!P.isMobile()?' style="background:var(--acc-pale)"':'')+'>'+(t.grp?'<span class="av" style="--c:var(--navy);color:var(--navy-ink)">'+ICON('members','sm')+'</span>':U.av(t.with))+'<div class="grow"><div class="hrow sp"><span class="t ellip">'+t.title+'</span><span class="xs mut" style="flex:none">'+l.t+'</span></div><div class="s ellip"'+(t.unread?' style="color:var(--ink);font-weight:600"':'')+'>'+(l.w===E.who?'Vous : ':t.grp?p.first+' : ':'')+F.esc(l.x)+'</div></div>'+(t.unread?'<span class="em-un">'+t.unread+'</span>':'')+'</button>'}).join('')}
  function cons(c){var r=E.cons[c.id]||c.mine,ids=c.read.concat(r&&!c.mine?['s05']:[]);return '<div class="em-cons">'+(c.urgent?'<div>'+U.chip('Prioritaire','bad',true)+'</div>':'')+'<p>'+c.text+'</p><div class="hrow sp wrap"><button class="hrow" style="--g:8px" data-who="'+c.id+'" title="Voir qui a lu">'+U.avs(ids,4)+'<span class="xs mut">Lu par '+ids.length+' sur 8 · '+c.when+'</span></button>'+(r?'<span class="chip ok">'+ICON('check','sm')+'Lu</span>':'<button class="btn em-b dark" style="height:44px" data-read="'+c.id+'">'+ICON('check')+'J’ai lu</button>')+'</div></div>'}
  function draw(){var t=th(cur),un=D.empConsignes.filter(function(c){return !c.mine&&!E.cons[c.id]}).length;
   var x=hd('Messages',(un?un+' consigne'+(un>1?'s':'')+' à lire':'Toutes les consignes sont lues')+' · '+D.empThreads.reduce(function(a,q){return a+q.unread},0)+' messages non lus','<button class="btn pri" data-new>'+ICON('edit','sm')+'Écrire à l’équipe</button>');
   x+='<div class="em-msgs"><div class="stack'+(first?' rise':'')+'" style="--g:14px"><div class="card"><div class="ch"><h3>Consignes de la gérante</h3>'+(un?U.chip(un+' à lire','bad',true):U.chip('À jour','ok',true))+'</div><div style="padding-top:4px">'+D.empConsignes.map(cons).join('')+'</div></div>'+
     '<div class="card"><div class="ch" style="padding-bottom:6px"><h3>Discussions</h3></div><div data-ths>'+threads()+'</div></div></div>'+
     '<div class="card em-conv pane"><div class="ch" style="padding-bottom:12px;border-bottom:1px solid var(--line)"><div><h3>'+t.title+'</h3><div class="xs mut">'+(t.grp?t.grp.length+1+' membres · '+t.grp.map(function(i){return D.staffer(i).first}).join(', ')+' et vous':D.staffer(t.with).role)+'</div></div>'+(t.grp?U.avs(t.grp,4):'<button class="btn icon" data-callw="'+D.staffer(t.with).first+'" title="Appeler">'+ICON('phone')+'</button>')+'</div><div class="em-conv" data-conv></div></div></div>';
   el.innerHTML=x;if(first)P.animate(el);first=false;var c=el.querySelector('[data-conv]');if(c&&!P.isMobile()&&c.offsetParent){t.unread=0;bindConv(c,t,function(){el.querySelector('[data-ths]').innerHTML=threads()});el.querySelector('[data-ths]').innerHTML=threads()}}
  function open(id){cur=id;var t=th(id);t.unread=0;var pane=el.querySelector('.em-conv.pane');if(pane&&pane.offsetParent){draw();return}
   var s=P.sheet({title:t.title,icon:'chat',body:function(b){b.style.padding='0';b.style.display='flex';b.style.flexDirection='column';b.innerHTML='<div class="em-conv" style="flex:1;min-height:0" data-conv></div>';b.querySelector('.em-conv').style.height='min(64vh,520px)'}});
   var c=s.querySelector('[data-conv]');bindConv(c,t,function(){});var bd=c.querySelector('.bd');if(bd)bd.style.flex='1';el.querySelector('[data-ths]').innerHTML=threads()}
  on(el,'[data-th]',function(b){open(b.getAttribute('data-th'))});
  on(el,'[data-read]',function(b){E.cons[b.getAttribute('data-read')]=true;draw();say('Accusé de lecture envoyé à Claire')});
  on(el,'[data-who]',function(b){var c=D.empConsignes.find(function(q){return q.id===b.getAttribute('data-who')}),rd=c.read.concat(E.cons[c.id]&&!c.mine?['s05']:[]);P.sheet({title:'Accusés de lecture',icon:'eye',body:'<p class="s mut" style="margin-bottom:12px">'+c.text+'</p><div class="card flat">'+D.staff.filter(function(s){return s.id!=='s01'}).map(function(s){var ok=rd.indexOf(s.id)>=0;return '<div class="li">'+U.av(s)+'<div class="grow"><div class="t">'+s.first+' '+s.last+'</div><div class="s">'+s.role+'</div></div>'+U.chip(ok?'Lu':'Pas encore lu',ok?'ok':'',true)+'</div>'}).join('')+'</div>'})});
  on(el,'[data-callw]',function(b){P.toast('Appel de '+b.getAttribute('data-callw')+' en cours',{icon:'phone'})});
  on(el,'[data-new]',function(){open('eq');var i=el.querySelector('.em-conv.pane input');if(i&&i.offsetParent)i.focus()});
  online(el,draw);draw();if(ctx.params.id&&P.isMobile())setTimeout(function(){if(el.isConnected)open(ctx.params.id)},350)}});

/* ---------- Congés et documents ---------- */
function workDays(a,b){var d=new Date(a+'T12:00:00'),e=new Date(b+'T12:00:00'),n=0;if(isNaN(d)||isNaN(e)||e<d)return 0;while(d<=e){var w=d.getDay();if(w!==0&&!(d.getMonth()===11&&d.getDate()===25))n++;d.setDate(d.getDate()+1)}return n}
function leaveSheet(draw){var kind='Congé payé',left=cpLeft()-myLeaves().filter(function(l){return l.st==='en attente'&&l.kind==='Congé payé'}).reduce(function(a,l){return a+l.days},0);
  var s=P.sheet({title:'Demander un congé',icon:'holiday',body:'<div class="stack" style="--g:16px"><div><span class="em-lbl">Type d’absence</span><div class="g2" style="--g:8px;grid-template-columns:1fr 1fr">'+[['Congé payé',String(left).replace('.',',')+' jours disponibles'],['Récupération',hh(hrOf().rec)+' à poser'],['Sans solde','Sur accord de Claire'],['Événement familial','Justificatif à joindre']].map(function(k,i){return '<button class="card flat" style="padding:12px;text-align:left" data-kind="'+k[0]+'"><div class="b s">'+k[0]+'</div><div class="xs mut">'+k[1]+'</div></button>'}).join('')+'</div></div>'+
   '<div class="g2" style="--g:10px;grid-template-columns:1fr 1fr"><label class="field"><span>Du</span><input class="in em-in num" type="date" id="lv-a" value="2026-12-07"></label><label class="field"><span>Au</span><input class="in em-in num" type="date" id="lv-b" value="2026-12-08"></label></div>'+
   '<div class="card flat"><div class="li"><div class="grow"><div class="t">Demi-journée</div><div class="s">Le matin seulement, de 7 h à 12 h</div></div>'+U.tog(false,'lv-half')+'</div></div>'+
   '<div class="card soft hrow sp" style="padding:14px"><div><div class="b" data-cnt></div><div class="xs mut" data-after></div></div>'+ico('holiday','','var(--acc)')+'</div>'+
   '<div class="note ok" data-cover>'+ICON('members','sm')+'<span>Lucie et Kévin travaillent ces jours-là : l’écurie reste couverte.</span></div>'+
   '<label class="field"><span>Un mot pour Claire (facultatif)</span><textarea class="in" rows="2"></textarea></label></div>',
   foot:'<button class="btn em-b pri block" data-send>'+ICON('send')+'Envoyer la demande</button>'});
  var a=s.querySelector('#lv-a'),b=s.querySelector('#lv-b'),hf=s.querySelector('#lv-half');
  function calc(){var n=workDays(a.value,b.value);if(hf.getAttribute('aria-checked')==='true')n=n?.5:0;var cp=kind==='Congé payé';s.querySelector('[data-cnt]').textContent=n?String(n).replace('.',',')+' jour'+(n>1?'s':'')+' ouvrable'+(n>1?'s':'')+' demandé'+(n>1?'s':''):'Choisissez des dates valides';s.querySelector('[data-after]').textContent=n?(cp?'Il vous restera '+String(left-n).replace('.',',')+' jours de congés payés':'Aucun jour de congé payé décompté'):'La date de fin doit suivre la date de début';
   $$('[data-kind]',s).forEach(function(q){q.style.boxShadow=q.getAttribute('data-kind')===kind?'inset 0 0 0 2px var(--acc)':''});return n}
  on(s,'[data-kind]',function(q){kind=q.getAttribute('data-kind');calc()});s.addEventListener('input',calc);s.addEventListener('click',function(e){if(e.target.closest('.tog'))setTimeout(calc,0)});calc();
  s.querySelector('[data-send]').onclick=function(){var n=calc();if(!n){P.toast('Vérifiez les dates de votre demande',{icon:'alert'});return}var undo=addLeave({kind:kind,from:a.value,to:b.value,days:n});s.close();draw();say('Demande envoyée à Claire. Réponse sous 48 heures',{icon:'send',undo:function(){undo();draw()}})}}
function paySheet(d){var p=d.pay,s=P.sheet({title:d.t,icon:'doc',body:p?'<div class="stack" style="--g:14px"><div class="card navy" style="padding:18px"><div class="eyebrow" style="color:color-mix(in srgb,var(--navy-ink) 68%,transparent)">Net payé</div><div class="disp num" style="font-size:34px;font-weight:700;color:var(--navy-ink);margin-top:4px">'+p.net+'</div><div class="s" style="color:color-mix(in srgb,var(--navy-ink) 72%,transparent);margin-top:4px">Viré le dernier jour ouvré du mois sur le compte se terminant par 4821</div></div>'+
   '<div>'+[['Salarié','Antoine Leroy · palefrenier soigneur'],['Convention','Centres équestres, coefficient 121'],['Heures payées',p.h],['Heures supplémentaires',p.sup],['Salaire brut',p.brut],['Net avant impôt',p.net]].map(function(r){return '<div class="em-pay"><span class="mut">'+r[0]+'</span><b class="num" style="text-align:right">'+r[1]+'</b></div>'}).join('')+'</div>'+
   '<div class="note">'+ICON('lock','sm')+'<span>Vos bulletins sont gardés 50 ans dans votre coffre personnel. Vous y gardez accès même après votre départ de l’écurie.</span></div></div>':
   '<div class="stack" style="--g:14px"><div class="card flat" style="padding:16px"><div class="hrow">'+ico('doc','lg')+'<div><b>'+d.t+'</b><div class="s mut">'+d.s+'</div></div></div></div><div class="note">'+ICON('shield','sm')+'<span>Document signé et archivé par l’Écurie des Tilleuls. Seuls vous et Claire pouvez le consulter.</span></div></div>',
   foot:(p?'<button class="btn em-b" data-err>Signaler une erreur</button>':'')+'<button class="btn em-b pri" style="flex:1" data-dl>'+ICON('download')+'Télécharger le PDF</button>'});
  s.querySelector('[data-dl]').onclick=function(){s.close();P.toast(d.t+' téléchargé',{icon:'download'})};var er=s.querySelector('[data-err]');if(er)er.onclick=function(){s.close();P.toast('Claire est prévenue, elle revient vers vous',{icon:'send'})}}

P.mod({id:'emp-conges',role:'employe',group:'Moi',title:'Congés et documents',icon:'holiday',n:30,phoneTitle:'Congés',
 render:function(el,ctx){var first=true;
  function span(l){var one=F.dateL(l.from);return l.from===l.to?one.charAt(0).toUpperCase()+one.slice(1):'Du '+F.date(l.from)+' au '+F.date(l.to)}
  function draw(){var LV=myLeaves(),H=hrOf(),left=cpLeft(),pend=LV.filter(function(l){return l.st==='en attente'}),pd=pend.reduce(function(a,l){return a+(l.kind==='Congé payé'?l.days:0)},0);
   var x=hd('Congés et documents','Période du 1er juin 2026 au 31 mai 2027 · '+pend.length+' demande'+(pend.length>1?'s':'')+' en attente','<button class="btn" data-wel>'+ICON('onboarding','sm')+'Revoir mon arrivée</button><button class="btn pri" data-ask>'+ICON('plus','sm')+'Demander un congé</button>');
   x+='<div class="em-cols"><div class="stack'+(first?' rise':'')+'" style="--g:14px">';
   x+='<div class="em-sol"><div class="card"><span class="xs mut b">Congés payés</span><div class="v"><span data-count="'+left+'">'+left+'</span><small> j</small></div>'+U.bar(H.cp[1]/H.cp[0]*100)+'<span class="xs mut">'+H.cp[1]+' pris sur '+H.cp[0]+'</span></div><div class="card"><span class="xs mut b">En attente</span><div class="v">'+String(pd).replace('.',',')+'<small> j</small></div>'+U.bar(pd/Math.max(1,left)*100,'var(--warn)')+'<span class="xs mut">Réponse de Claire</span></div><div class="card"><span class="xs mut b">Récupération</span><div class="v">'+hh(H.rec).replace(/ h.*$/,'')+'<small>'+hh(H.rec).replace(/^\d+/,'')+'</small></div>'+U.bar(H.rec/10*100,'var(--c5)')+'<span class="xs mut">À poser avant mars</span></div></div>';
   x+='<div class="card"><div class="ch" style="padding-bottom:6px"><h3>Mes demandes</h3></div>'+LV.map(function(l){var c=l.st==='validé'?'ok':l.st==='refusé'?'bad':'warn';return '<div class="em-row w2'+(l.fresh?' fade':'')+'">'+ico(l.kind==='Récupération'?'hourglass':'holiday','',c==='ok'?'var(--ok)':'var(--warn)')+'<div class="grow"><div class="t">'+span(l)+'</div><div class="s">'+l.kind+' · '+String(l.days).replace('.',',')+' jour'+(l.days>1?'s':'')+' · '+l.note+'</div></div>'+U.chip(l.st==='en attente'?'En attente':l.st==='validé'?'Validé':'Refusé',c,true)+(l.st==='en attente'?'<button class="btn ghost icon sm" data-cancel="'+l.id+'" title="Annuler cette demande">'+ICON('x','sm')+'</button>':'')+'</div>'}).join('')+'</div>';
   var cal='';['L','M','M','J','V','S','D'].forEach(function(d){cal+='<span>'+d+'</span>'});cal+='<div style="visibility:hidden"></div>';var OT=(D.leaves||[]).filter(function(l){return l.who!=='s05'&&l.state!=='refusé'&&l.to>='2026-12-01'&&l.from<='2026-12-31'}),cov=function(l,ds){return l.from<=ds&&l.to>=ds};for(var d=1;d<=31;d++){var wd=(d+1)%7,ds='2026-12-'+String(d).padStart(2,'0'),mine=pend.some(function(l){return cov(l,ds)}),ot=OT.some(function(l){return cov(l,ds)});cal+='<div class="'+(mine?'pd ':'')+(wd===0?'we ':'')+(d===25?'fe ':'')+(ot&&!mine?'ot':'')+'">'+d+'</div>'}
   x+='<div class="card"><div class="ch"><h3>Décembre 2026</h3><span class="s mut">Absences de l’équipe</span></div><div class="cb stack" style="--g:12px"><div class="em-cal">'+cal+'</div>'+P.chart.legend([['Ma demande en attente','var(--acc)'],['Collègue absent','var(--c5)'],['Jour férié','var(--bad)']])+(OT.length?'<div class="xs mut">'+OT.map(function(l){return D.staffer(l.who).first+' du '+F.date(l.from)+' au '+F.date(l.to)}).join(' · ')+'</div>':'')+'</div></div>';
   x+='</div><div class="stack'+(first?' rise':'')+'" style="--g:14px"><div class="card"><div class="ch" style="padding-bottom:6px"><h3>Bulletins de paie</h3><span class="s mut">Coffre personnel</span></div>'+D.empDocs.filter(function(d){return d.pay}).map(docRow).join('')+'</div><div class="card"><div class="ch" style="padding-bottom:6px"><h3>Mes documents</h3></div>'+D.empDocs.filter(function(d){return !d.pay}).map(docRow).join('')+'</div>'+
     '<div class="note">'+ICON('info','sm')+'<span>Stabl prépare vos heures pour la paie mais ne calcule pas le salaire : le bulletin vient du cabinet comptable de l’écurie.</span></div></div></div>'+
     '<div class="em-sticky"><button class="btn em-b pri" data-ask>'+ICON('plus')+'Demander un congé</button></div>';
   el.innerHTML=x;if(first)P.animate(el);first=false}
  function docRow(d){return '<button class="em-row" data-doc="'+d.id+'">'+ico(d.pay?'euro':'doc','',d.pay?'var(--ok)':'var(--acc)')+'<div class="grow"><div class="t">'+d.t+'</div><div class="s">'+d.s+'</div></div>'+ICON('download')+'</button>'}
  on(el,'[data-ask]',function(){leaveSheet(draw)});
  on(el,'[data-doc]',function(b){paySheet(D.empDocs.find(function(d){return d.id===b.getAttribute('data-doc')}))});
  on(el,'[data-cancel]',function(b){var id=b.getAttribute('data-cancel'),A=D.leaves&&D.leaves.some(function(l){return l.id===id})?D.leaves:D.empLeaves,i=A.findIndex(function(l){return l.id===id}),l=A[i];A.splice(i,1);draw();P.toast('Demande annulée, Claire est prévenue',{icon:'x',undo:function(){A.splice(i,0,l);if(el.isConnected)draw()}})});
  on(el,'[data-wel]',function(){P.go('emp-bienvenue')});
  online(el,draw);draw()}});

/* =====================================================================
   Mon arrivée : les six étapes du premier jour, à revoir
   ===================================================================== */
P.css(`
.ew-top{padding:16px;display:flex;flex-direction:column;gap:12px}
.ew-steps{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:6px}
.ew-steps button{display:flex;flex-direction:column;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--mut);padding:4px 0;min-width:0;text-align:center;line-height:1.2}
.ew-steps .c{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:13px;font-weight:700;box-shadow:inset 0 0 0 1.5px var(--line-2);background:var(--surface);color:var(--ink-2);transition:all var(--t-2) var(--e-out)}
.ew-steps .c svg.i{width:15px;height:15px;stroke-width:2.4}
.ew-steps .ok .c{background:var(--ok);color:var(--surface);box-shadow:none}
.ew-steps .on{color:var(--ink)}.ew-steps .on .c{background:var(--acc);color:var(--acc-ink);box-shadow:0 0 0 4px var(--acc-pale)}
.ew-steps span.l{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ew-card{padding:18px;display:flex;flex-direction:column;gap:14px}
.ew-card h2{font-size:21px;letter-spacing:-.025em;line-height:1.15}
.ew-mail{border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line);padding:14px;display:flex;flex-direction:column;gap:10px;background:var(--surface-2)}
.ew-doc{border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line);padding:14px 16px;background:var(--surface-2);font-size:13px;line-height:1.5;color:var(--ink-2);display:flex;flex-direction:column;gap:6px}
.ew-doc b{color:var(--ink)}
.ew-pad{position:relative;height:150px;border-radius:var(--r-md);background:var(--surface);box-shadow:inset 0 0 0 1.5px var(--line-2);touch-action:none;overflow:hidden}
.ew-pad canvas{position:absolute;inset:0;width:100%;height:100%;cursor:crosshair}
.ew-pad .hint{position:absolute;left:14px;right:14px;bottom:30px;border-top:1.5px dashed var(--line-2);pointer-events:none}
.ew-pad .hint span{position:absolute;left:0;top:6px;font-size:13px;color:var(--mut)}
.ew-pad.signed{box-shadow:inset 0 0 0 2px var(--ok)}
.ew-rule{display:flex;align-items:flex-start;gap:12px;padding:12px 14px;text-align:left;width:100%}
.ew-rule+.ew-rule{border-top:1px solid var(--line)}
.ew-rule .t{font-weight:600;font-size:14px;line-height:1.35}.ew-rule .s{font-size:13px;color:var(--mut);margin-top:2px;line-height:1.4}
.ew-hold{width:170px;height:170px;border-radius:50%;margin:4px auto 0;display:grid;place-items:center;position:relative;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line),var(--shadow-2);touch-action:none;user-select:none;-webkit-user-select:none}
.ew-hold svg.rg{position:absolute;inset:0;width:100%;height:100%;transform:rotate(-90deg)}
.ew-hold circle{fill:none;stroke-width:8}.ew-hold .bg{stroke:var(--bg-2)}.ew-hold .fg{stroke:var(--acc);stroke-linecap:round;stroke-dasharray:502;stroke-dashoffset:502}
.ew-hold.press .fg{stroke-dashoffset:0;transition:stroke-dashoffset .8s linear}
.ew-hold.done .fg{stroke:var(--ok);stroke-dashoffset:0}
.ew-hold .dk{display:flex;flex-direction:column;align-items:center;gap:4px;font-weight:600;font-size:13px;color:var(--ink-2);text-align:center}
.ew-hold .dk svg.i{width:30px;height:30px;color:var(--acc)}.ew-hold.done .dk svg.i{color:var(--ok)}
.ew-tabs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.ew-tabs button{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:14px;border-radius:var(--r-lg);text-align:left;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2);position:relative;transition:box-shadow var(--t-2),background var(--t-2)}
.ew-tabs button svg.i{color:var(--acc);width:24px;height:24px}
.ew-tabs button b{font-size:14.5px}.ew-tabs button small{font-size:13px;color:var(--mut);line-height:1.35}
.ew-tabs button[aria-pressed="true"]{box-shadow:inset 0 0 0 2px var(--ok);background:var(--ok-pale)}
.ew-tabs button .ck{position:absolute;top:12px;right:12px;width:22px;height:22px;border-radius:50%;background:var(--ok);color:var(--surface);display:none;place-items:center}
.ew-tabs button .ck svg.i{width:13px;height:13px;color:var(--surface);stroke-width:2.6}
.ew-tabs button[aria-pressed="true"] .ck{display:grid}
.ew-foot{display:flex;flex-wrap:wrap;gap:8px}.ew-foot .btn{flex:1 1 200px;min-width:0;white-space:normal;line-height:1.2;text-align:center}
@container main (max-width:520px){.ew-steps span.l{display:none}.ew-card{padding:16px}.ew-card h2{font-size:19px}}
`);
var EW={step:0,done:[],rules:{},tabs:{},signed:false,held:false};
var EWS=[['Invitation','mail'],['Rôle','shield'],['Contrat','sign'],['Sécurité','helmet'],['Pointage','clockin'],['Visite','grid']];
var RULES=[['Approcher un cheval par l’épaule, en lui parlant','Jamais par derrière, même un cheval que vous connaissez bien.'],['Chaussures de sécurité à l’écurie et au hangar','Le gilet haute visibilité est obligatoire pour le tracteur.'],['Attacher un cheval avec un nœud qui se défait d’un geste','Jamais à une porte, une barrière ou une partie mobile.'],['Savoir où sont les extincteurs','Sellerie, hangar à foin, manège et bureau. Aucune flamme près du foin.'],['En cas de blessure, prévenir puis soigner','Trousse de secours dans la sellerie. Appelez le 15 ou le 112, puis Claire.']];
var EWT=[['emp-jour','today','Journée','Ce que vous faites maintenant, les urgences et les consignes'],['emp-tournee','stable','Tournée','Un box après l’autre, un geste si tout va bien'],['emp-chevaux','horse','Chevaux','Les fiches, les rations et qui sort au paddock'],['emp-planning','planning','Planning','Vos horaires, vos astreintes et les échanges']];
function ewDone(i,msg){if(EW.done.indexOf(i)<0)EW.done.push(i);P.toast(msg,{icon:'checkc'});if(i<5)EW.step=i+1}
P.mod({id:'emp-bienvenue',role:'employe',group:'Moi',title:'Mon arrivée',icon:'onboarding',hidden:true,tab:'emp-jour',phoneTitle:'Mon arrivée',
 render:function(el,ctx){var p=me(),first=true;
  function stepHTML(){var i=EW.step;
   if(i===0)return '<div class="eyebrow">Étape 1 · Invitation</div><h2>Claire vous invite dans l’équipe des Tilleuls</h2><div class="ew-mail"><div class="hrow">'+U.av('s01')+'<div class="grow"><div class="b s">Claire Dumont, gérante</div><div class="xs mut">Reçu par SMS et par e-mail le 9 novembre à 18 h 02</div></div></div><p class="s" style="line-height:1.5;color:var(--ink)">Bonjour Antoine, l’écurie passe sur Stabl. Votre journée, les soins, la tournée et le pointage seront sur votre téléphone. Touchez le lien pour créer votre accès, cela prend deux minutes.</p><div class="hrow wrap" style="--g:6px">'+U.chip('Écurie des Tilleuls','acc',true)+U.chip('Lien valable 7 jours','',true)+'</div></div>'+
     '<div class="card flat" style="padding:4px 0"><div class="li"><div class="grow"><div class="t">Votre numéro</div><div class="s num">06 •• •• 41 27, vérifié par code SMS</div></div>'+U.chip('Vérifié','ok',true)+'</div><div class="li"><div class="grow"><div class="t">Votre code à 4 chiffres</div><div class="s">Pour ouvrir l’application, même avec des gants</div></div>'+U.chip('Choisi','ok',true)+'</div></div>'+
     '<div class="ew-foot"><button class="btn em-b pri" data-ok="0">'+ICON('check')+'Accepter l’invitation</button></div>';
   if(i===1)return '<div class="eyebrow">Étape 2 · Rôle attribué</div><h2>Vous êtes palefrenier soigneur</h2><p class="s mut">Claire a choisi ce rôle pour vous. Il décide de ce que vous voyez et de ce que vous pouvez modifier.</p>'+
     '<div class="card flat">'+[['ok','Vous pouvez','Faire la tournée, valider les soins, signaler un problème, pointer, écrire à l’équipe'],['acc','Vous voyez','Les fiches des chevaux, les rations, les stocks, votre planning et vos bulletins'],['','Vous ne voyez pas','Les factures des familles, la comptabilité et la paie de vos collègues']].map(function(r){return '<div class="li" style="align-items:flex-start">'+ico(r[0]==='ok'?'checkc':r[0]==='acc'?'eye':'eye_off','sm',r[0]==='ok'?'var(--ok)':r[0]==='acc'?'var(--acc)':'var(--mut)')+'<div class="grow"><div class="t">'+r[1]+'</div><div class="s">'+r[2]+'</div></div></div>'}).join('')+'</div>'+
     '<div class="ew-foot"><button class="btn em-b" data-err>Ce n’est pas mon rôle</button><button class="btn em-b pri" data-ok="1">'+ICON('check')+'C’est bien mon rôle</button></div>';
   if(i===2)return '<div class="eyebrow">Étape 3 · Contrat</div><h2>Signez l’avenant de votre contrat</h2><div class="ew-doc"><b>Avenant au contrat de travail de Antoine Leroy</b><span>CDI de 39 h, palefrenier soigneur, coefficient 121. Le contrat d’origine est inchangé.</span><span>Article 1. Le temps de travail est pointé sur le téléphone, à l’écurie seulement. La position n’est jamais suivie pendant la journée.</span><span>Article 2. Les bulletins de paie et les documents sont rangés dans un coffre personnel, gardé 50 ans.</span></div>'+
     '<div><span class="em-lbl">Signez avec le doigt</span><div class="ew-pad'+(EW.signed?' signed':'')+'"><div class="hint"><span>Antoine Leroy, le 17 novembre 2026</span></div><canvas data-pad aria-label="Zone de signature"></canvas></div></div>'+
     '<div class="ew-foot"><button class="btn em-b" data-clear>'+ICON('refresh')+'Effacer</button><button class="btn em-b pri" data-ok="2"'+(EW.signed?'':' disabled')+'>'+ICON('sign')+'Signer l’avenant</button></div>';
   if(i===3){var n=RULES.filter(function(_,k){return EW.rules[k]}).length;return '<div class="eyebrow">Étape 4 · Sécurité</div><h2>Les cinq consignes de sécurité</h2><p class="s mut">Lisez chaque consigne et cochez-la. Le document unique complet reste dans vos documents.</p><div class="card flat">'+RULES.map(function(r,k){return '<button class="ew-rule" data-rule="'+k+'" aria-pressed="'+!!EW.rules[k]+'">'+'<span class="em-ck'+(EW.rules[k]?' on':'')+'" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg></span>'+'<div class="grow"><div class="t">'+r[0]+'</div><div class="s">'+r[1]+'</div></div></button>'}).join('')+'</div>'+
     '<div class="ew-foot"><button class="btn em-b pri" data-ok="3"'+(n===RULES.length?'':' disabled')+'>'+ICON('check')+(n===RULES.length?'J’ai lu les consignes':'Encore '+(RULES.length-n)+' à lire')+'</button></div>'}
   if(i===4)return '<div class="eyebrow">Étape 5 · Pointage d’essai</div><h2>Faites votre premier pointage</h2><p class="s mut">Maintenez le bouton une seconde. Ce pointage d’essai n’est pas compté dans vos heures.</p>'+
     '<button class="ew-hold'+(EW.held?' done':'')+'" data-hold aria-label="Maintenir pour pointer"><svg class="rg" viewBox="0 0 170 170"><circle class="bg" cx="85" cy="85" r="80"/><circle class="fg" cx="85" cy="85" r="80"/></svg><span class="dk">'+ICON(EW.held?'checkc':'clockin')+(EW.held?'Pointé à 9 h 41':'Maintenez')+'</span></button>'+
     (EW.held?'<div class="note ok">'+ICON('checkc','sm')+'<span>Essai réussi, à 12 m de la sellerie. Vos vrais pointages commencent demain matin.</span></div>':'<div class="note">'+ICON('info','sm')+'<span>Un appui long évite les pointages par erreur dans la poche.</span></div>')+
     '<div class="ew-foot"><button class="btn em-b pri" data-ok="4"'+(EW.held?'':' disabled')+'>Continuer'+ICON('arrow')+'</button></div>';
   var nv=EWT.filter(function(t){return EW.tabs[t[0]]}).length;
   return '<div class="eyebrow">Étape 6 · Visite</div><h2>Vos quatre onglets</h2><p class="s mut">Touchez chaque onglet pour découvrir ce qu’il contient. Ils restent en bas de l’écran, à portée de pouce.</p><div class="ew-tabs">'+EWT.map(function(t){return '<button data-tab="'+t[0]+'" aria-pressed="'+!!EW.tabs[t[0]]+'"><span class="ck">'+ICON('check')+'</span>'+ICON(t[1])+'<b>'+t[2]+'</b><small>'+t[3]+'</small></button>'}).join('')+'</div>'+
     '<div class="ew-foot"><button class="btn em-b pri" data-ok="5"'+(nv===4?'':' disabled')+'>'+(nv===4?ICON('today')+'Commencer ma journée':nv+' onglet'+(nv>1?'s':'')+' sur 4 visité'+(nv>1?'s':''))+'</button></div>'}
  function draw(){var n=EW.done.length;
   var x=hd('Mon arrivée aux Tilleuls','Les six étapes de votre premier jour sur Stabl, à revoir quand vous voulez.','<button class="btn" data-restart>'+ICON('refresh','sm')+'Recommencer</button>');
   x+='<div class="stack'+(first?' rise':'')+'" style="--g:14px;max-width:720px"><div class="card ew-top"><div class="hrow sp"><b class="s">'+(n===6?'Arrivée terminée':'Étape '+(EW.step+1)+' sur 6')+'</b><span class="s mut num">'+n+' validée'+(n>1?'s':'')+' sur 6</span></div>'+U.bar(n/6*100,n===6?'var(--ok)':'')+
     '<div class="ew-steps">'+EWS.map(function(s,i){var ok=EW.done.indexOf(i)>=0;return '<button data-st="'+i+'" class="'+(i===EW.step?'on':ok?'ok':'')+'" title="'+s[0]+'"><span class="c">'+(ok&&i!==EW.step?ICON('check'):i+1)+'</span><span class="l">'+s[0]+'</span></button>'}).join('')+'</div></div>'+
     '<div class="card ew-card fade" data-body>'+stepHTML()+'</div></div>';
   el.innerHTML=x;if(first)P.animate(el);first=false;bind()}
  function bind(){var pad=el.querySelector('[data-pad]');if(pad)padInit(pad);var hb=el.querySelector('[data-hold]');if(hb&&!EW.held)holdInit(hb)}
  function padInit(cv){var r=cv.getBoundingClientRect(),dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Math.max(1,r.width*dpr);cv.height=Math.max(1,r.height*dpr);var c=cv.getContext('2d');c.scale(dpr,dpr);c.lineWidth=2.4;c.lineCap='round';c.lineJoin='round';c.strokeStyle=getComputedStyle(cv).color||'currentColor';var down=false,len=0,last=null;
   cv.style.color='var(--ink)';c.strokeStyle=getComputedStyle(cv).color;
   function pt(e){var b=cv.getBoundingClientRect();return [e.clientX-b.left,e.clientY-b.top]}
   cv.addEventListener('pointerdown',function(e){e.preventDefault();down=true;last=pt(e);try{cv.setPointerCapture(e.pointerId)}catch(x){}});
   cv.addEventListener('pointermove',function(e){if(!down)return;var q=pt(e);c.beginPath();c.moveTo(last[0],last[1]);c.lineTo(q[0],q[1]);c.stroke();len+=Math.hypot(q[0]-last[0],q[1]-last[1]);last=q;if(len>60&&!EW.signed){EW.signed=true;var b=el.querySelector('[data-ok="2"]');if(b)b.disabled=false;cv.parentNode.classList.add('signed')}});
   ['pointerup','pointercancel','pointerleave'].forEach(function(t){cv.addEventListener(t,function(){down=false})})}
  function holdInit(b){var tm=null;function start(e){if(e)e.preventDefault();if(EW.held)return;b.classList.add('press');tm=setTimeout(function(){EW.held=true;b.classList.remove('press');P.toast('Pointage d’essai enregistré à 9 h 41',{icon:'clockin'});draw()},P.RM?120:820)}
   function stop(){if(EW.held)return;clearTimeout(tm);b.classList.remove('press')}
   b.addEventListener('pointerdown',start);['pointerup','pointercancel','pointerleave'].forEach(function(t){b.addEventListener(t,stop)});
   b.addEventListener('keydown',function(e){if((e.key===' '||e.key==='Enter')&&!e.repeat)start(e)});b.addEventListener('keyup',stop);b.addEventListener('contextmenu',function(e){e.preventDefault()})}
  on(el,'[data-st]',function(b){var i=+b.getAttribute('data-st');if(i>EW.done.length&&EW.done.indexOf(i-1)<0){P.toast('Validez d’abord l’étape '+(i)+'',{icon:'info'});return}if(EW.step===i)return;EW.step=i;draw();sw(el.querySelector('.ew-card'))});
  on(el,'[data-restart]',function(){EW={step:0,done:[],rules:{},tabs:{},signed:false,held:false};draw();P.toast('Parcours d’arrivée remis au début',{icon:'refresh'})});
  on(el,'[data-err]',function(){P.toast('Claire est prévenue, elle corrige votre rôle',{icon:'send'})});
  on(el,'[data-clear]',function(){EW.signed=false;draw()});
  on(el,'[data-rule]',function(b){var k=+b.getAttribute('data-rule');EW.rules[k]=!EW.rules[k];draw()});
  on(el,'[data-tab]',function(b){var id=b.getAttribute('data-tab'),t=EWT.find(function(q){return q[0]===id});if(!EW.tabs[id]){EW.tabs[id]=true;P.toast('Onglet « '+t[2]+' » : '+t[3].charAt(0).toLowerCase()+t[3].slice(1),{icon:t[1]})}draw()});
  on(el,'[data-ok]',function(b){var i=+b.getAttribute('data-ok');
   if(i===0)ewDone(0,'Invitation acceptée, bienvenue '+p.first);
   else if(i===1)ewDone(1,'Rôle confirmé : palefrenier soigneur');
   else if(i===2)ewDone(2,'Avenant signé et rangé dans votre coffre');
   else if(i===3)ewDone(3,'Consignes de sécurité lues, Claire est prévenue');
   else if(i===4)ewDone(4,'Pointage d’essai validé');
   else{ewDone(5,'Arrivée terminée. Bonne journée '+p.first);EW={step:0,done:[0,1,2,3,4,5],rules:{},tabs:{},signed:false,held:false,fin:true};P.go('emp-jour');return}
   draw();sw(el.querySelector('.ew-card'));var v=el.closest('.view');if(v&&P.isMobile())v.scrollTop=0});
  if(EW.fin){EW={step:0,done:[],rules:{},tabs:{},signed:false,held:false}}
  draw()}});

/* =====================================================================
   Palette, assistant et visite guidée
   ===================================================================== */
P.actions.push(
 {role:'employe',label:'Signaler un incident',icon:'alert',run:function(){P.go('emp-signaler')}},
 {role:'employe',label:'Pointer mon arrivée ou mon départ',icon:'clockin',run:function(){P.go('emp-pointage')}},
 {role:'employe',label:'Scanner le QR code d’un box',icon:'qr',run:function(){scanSheet(function(i){P.go('emp-tournee',{jump:i})})}},
 {role:'employe',label:'Noter le contrôle de Xanthos',icon:'pulse',run:function(){P.go('emp-cheval',{id:'h23'})}},
 {role:'employe',label:'Demander un congé',icon:'holiday',run:function(){P.go('emp-conges')}},
 {role:'employe',label:'Lire la puce d’un cheval',icon:'scan',run:function(){puceSheet()}},
 {role:'employe',label:'Personnaliser ma journée',icon:'sliders',run:function(){P.go('emp-jour');setTimeout(function(){var b=$('[data-perso]',P.app());if(b)b.click()},350)}},
 {role:'employe',label:'Revoir mon arrivée',icon:'onboarding',run:function(){P.go('emp-bienvenue')}},
 {role:'employe',label:'Voir la journée de Hugo, moniteur',icon:'whistle',run:function(){E.who='s02';P.go('emp-jour');P.rerender()}});

P.brain.push({role:'employe',re:/signal|probl[eè]me|panne|cass[ée]|bless/i,reply:function(t){var m=/(?:box|b)\s*0?(\d{1,2})/i.exec(t),h=m&&D.horses.find(function(x){return +x.box.slice(1)===+m[1]});
  if(!h)return {text:'Je peux préparer le signalement. Dites-moi le box ou le lieu, ou ouvrez le formulaire : photo, gravité et lieu en dix secondes.',actions:[{label:'Ouvrir le formulaire',run:function(){P.go('emp-signaler');return 'Formulaire ouvert'}}]};
  return {text:'Je prépare un signalement pour le box <b>'+h.box+'</b>, où loge <b>'+h.name+'</b>. Voici ce que Claire recevra :',card:'<div class="hrow">'+U.hav(h)+'<div class="grow"><div class="b s">Problème au box '+h.box+' · '+h.name+'</div><div class="xs mut">Mardi 17 novembre, 9 h 41 · à voir aujourd’hui · par Antoine</div></div></div>'+(D.empNotes[h.id]?'<div class="xs mut">Consigne en cours : '+D.empNotes[h.id]+'</div>':''),
   actions:[{label:'Envoyer à Claire',run:function(){D.empIncidents.unshift({id:'i'+Date.now(),kind:'Problème signalé',where:'Box '+h.box+' · '+h.name,when:'À l’instant',sev:1,st:'Envoyé',txt:'Signalé depuis l’assistant.',fresh:true});P.toast('Signalement envoyé à Claire : box '+h.box,{icon:'send'});return 'Signalement envoyé'}},{label:'Ajouter une photo',run:function(){P.go('emp-signaler',{type:'cheval',id:h.id});return 'Formulaire ouvert'}}]}}});
P.brain.push({role:'employe',re:/paddock|sort|dehors|rentr/i,reply:function(){var G={},n=0;D.horses.forEach(function(h){var p=padOf(h);if(p&&p.g==='A'){(G[p.p]=G[p.p]||[]).push(h.name.split(' ')[0]);n++}});var stay=D.horses.filter(function(h){return !padOf(h)});
  return {text:'<b>'+n+' chevaux</b> sont dehors en ce moment avec le groupe A, jusqu’à 12 h. Le groupe B sort de 13 h à 16 h 30. '+stay.map(function(h){return h.name.split(' ')[0]}).join(' et ')+' restent au box.',card:Object.keys(G).map(function(k){return '<div class="hrow sp" style="align-items:flex-start"><span class="s b" style="flex:none">'+k+'</span><span class="xs mut" style="text-align:right">'+G[k].join(', ')+'</span></div>'}).join(''),
   actions:[{label:'Voir les paddocks',run:function(){P.prefs.set('emp:hview','pad');P.go('emp-chevaux');return 'Paddocks ouverts'}}]}}});
P.brain.push({role:'employe',re:/maintenant|quoi faire|que faire|je fais|t[aâ]che|journ[ée]e|ensuite/i,reply:function(){var L=tasks().filter(function(t){return !t.done}),now=L[0],T=tourState(),dn=T.boxes.filter(function(b){return b.st}).length;
  if(!now)return {text:'Tout est fait pour aujourd’hui. Il ne reste qu’à pointer votre départ.',actions:[{label:'Ouvrir le pointage',run:function(){P.go('emp-pointage');return 'Pointage ouvert'}}]};
  return {text:(mon()?'Votre prochaine tâche : ':'En ce moment : ')+'<b>'+now.title+'</b> ('+now.zone+')'+(now.tour?', '+dn+' boxes faits sur 16':'')+'. '+(mon()?'':'N’oubliez pas le contrôle de <b>Xanthos</b> à 10 h, dans 19 minutes. ')+'Ensuite :',card:L.slice(1,4).map(function(t){return '<div class="hrow sp"><span class="s"><b class="num">'+hm(t.t)+'</b> · '+t.title+'</span></div>'}).join(''),
   actions:mon()?[{label:'Ouvrir ma journée',run:function(){P.go('emp-jour');return 'Journée ouverte'}}]:[{label:'Continuer la tournée',run:function(){P.go('emp-tournee');return 'Tournée ouverte'}},{label:'Fiche de Xanthos',run:function(){P.go('emp-cheval',{id:'h23'});return 'Fiche ouverte'}}]}}});
P.brain.push({role:'employe',re:/soin|vermifuge|traitement|pansement/i,reply:function(){var L=D.empCare.filter(function(c){return !c.done&&!E.care[c.id]});return {text:L.length?'Il reste <b>'+L.length+' soins</b> à donner aujourd’hui :':'Tous les soins du jour sont donnés et inscrits au registre sanitaire.',card:L.map(function(c){return '<div class="hrow sp"><span class="s"><b>'+D.horse(c.horse).name.split(' ')[0]+'</b> · '+c.prod+'</span><span class="xs '+(c.late?'badc':'mut')+'">'+(c.late?'En retard':hm(c.t))+'</span></div>'}).join('')||null,actions:[{label:'Ouvrir les soins',run:function(){P.go('emp-soins');return 'Soins ouverts'}}]}}});
/* ---------- L'assistant de l'employé : planning, congés, stock, ration, pointage ---------- */
function nrm(s){return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
function horseIn(t){t=nrm(t);var m=/(?:box|b)\s*0?(\d{1,2})\b/i.exec(t);if(m){var hb=D.horses.find(function(x){return +x.box.slice(1)===+m[1]});if(hb)return hb}
  return D.horses.find(function(h){var w=nrm(h.name).split(' ')[0];return w.length>2&&new RegExp('\\b'+w+'\\b').test(t)})}
function kg(v){return String(Math.round(v*2)/2).replace('.',',')}
var EB=[];
/* ration d'un cheval */
EB.push({role:'employe',re:/ration|mange|manger|nourri|granul|repas|donne[rz]? (?:a|à)|combien de foin/i,reply:function(t){var h=horseIn(t)||D.horse('h23'),r=h.ration,isX=h.id==='h23',note=D.empNotes[h.id];
  return {text:isX?'<b>Xanthos</b> est à la diète jusqu’au passage du Dr Leclerc : <b>1 kg de foin mouillé</b> par repas, aucun granulé.':'Ration '+(/^[AEIOUÉÈYH]/i.test(h.name)?'d’':'de ')+'<b>'+h.name+'</b> (box '+h.box+', '+h.weight+' kg, état corporel '+String(h.bcs).replace('.',',')+' sur 5) :',
   card:isX?'<div class="xs mut">Contrôle toutes les 2 heures. Prochain contrôle à '+((E.ctl.find(function(c){return !c.st})||{t:'12 h'}).t)+'.</div>':[['Matin · 7 h',.4,.5],['Midi · 11 h 45',.2,0],['Soir · 18 h',.4,.5]].map(function(x){return '<div class="hrow sp"><span class="s">'+x[0]+'</span><span class="s b">'+kg(r.hay*x[1])+' kg de foin'+(x[2]?' · '+String(Math.round(r.grain*x[2]*10)/10).replace('.',',')+' L de granulés':'')+'</span></div>'}).join('')+'<div class="hrow sp"><span class="xs mut">Complément</span><span class="xs b">'+r.supp+'</span></div>'+(note?'<div class="xs mut">Consigne : '+note+'</div>':''),
   actions:[{label:'Ouvrir la fiche de '+h.name.split(' ')[0],run:function(){P.go('emp-cheval',{id:h.id});return 'Fiche ouverte'}}]}}});
/* congés */
EB.push({role:'employe',re:/cong[ée]|vacances|r[ée]cup|absence|poser un jour|jours? de repos/i,reply:function(){var H=hrOf(),L=myLeaves().filter(function(l){return l.st==='en attente'});
  return {text:'Il vous reste <b>'+cpLeft()+' jours de congés payés</b> sur '+H.cp[0]+' et <b>'+hh(H.rec)+'</b> de récupération à poser.'+(L.length?' Demande en attente de Claire :':' Aucune demande en attente.'),
   card:L.map(function(l){return '<div class="hrow sp"><span class="s">'+l.kind+' · '+(l.from===l.to?F.date(l.from):F.date(l.from)+' au '+F.date(l.to))+'</span>'+U.chip('En attente','warn',true)+'</div>'}).join('')||null,
   actions:[{label:'Demander un congé',run:function(){P.go('emp-conges');setTimeout(function(){var b=$('[data-ask]',P.app());if(b)b.click()},350);return 'Formulaire ouvert'}},{label:'Voir mes congés',run:function(){P.go('emp-conges');return 'Congés ouverts'}}]}}});
/* stock */
EB.push({role:'employe',re:/stock|copeau|sacs?\b|balles? de|commande|rupture|liti[eè]re/i,reply:function(){var L=(D.stock||[]).map(function(k){return {k:k,d:k.daily?Math.floor(k.qty/k.daily):99}}).sort(function(a,b){return a.d-b.d}),low=L.filter(function(x){return x.k.qty<x.k.min});
  return {text:low.length?'<b>'+low.length+' produit'+(low.length>1?'s':'')+'</b> sous le seuil. Le plus urgent : <b>'+low[0].k.name.toLowerCase()+'</b>, '+low[0].k.qty+' '+low[0].k.unit+', soit environ '+low[0].d+' jours.':'Tous les stocks sont au-dessus du seuil.',
   card:L.slice(0,4).map(function(x){return '<div class="hrow sp"><span class="s">'+x.k.name+'</span><span class="xs '+(x.k.qty<x.k.min?'badc b':'mut')+'">'+x.k.qty+' '+x.k.unit+' · '+x.d+' j</span></div>'}).join(''),
   actions:low.length?[{label:'Signaler le stock bas',run:function(){D.empIncidents.unshift({id:'i'+Date.now(),kind:'Stock bas',where:'Hangar',when:'À l’instant',sev:0,st:'Envoyé à Claire',txt:low.map(function(x){return x.k.name+' : '+x.k.qty+' '+x.k.unit}).join(', ')+'.',fresh:true});say('Stock bas signalé à Claire',{icon:'stock'});return 'Signalé à Claire'}},{label:'Voir mes signalements',run:function(){P.go('emp-signaler');return 'Signalements ouverts'}}]:null}}});
/* pointage */
EB.push({role:'employe',re:/point|mes heures|heures sup|combien d.?heures|arriv[ée]|d[ée]part|pause/i,reply:function(){var C=E.clock,done=C.base+(C.state==='in'?Math.floor((Date.now()-E.t0)/1000):0),tot=weekTot();
  return {text:C.state==='out'?'Votre départ est pointé. Journée de <b>'+hh(Math.floor(done/60)/60)+'</b>.':'Vous êtes '+(C.state==='pause'?'en pause':'en service depuis <b>'+C.since+'</b>')+', soit <b>'+hh(Math.floor(done/60)/60)+'</b> aujourd’hui.',
   card:'<div class="hrow sp"><span class="s">Cette semaine</span><b class="s num">'+hh(monH()+done/3600)+' sur '+hh(tot)+'</b></div><div class="hrow sp"><span class="s">Heures au-delà de 39 h</span><b class="s num">'+(tot>39?hh(tot-39):'Aucune')+'</b></div><div class="hrow sp"><span class="s">Compteur de récupération</span><b class="s num">'+hh(hrOf().rec)+'</b></div>',
   actions:[{label:'Ouvrir le pointage',run:function(){P.go('emp-pointage');return 'Pointage ouvert'}}]}}});
/* planning */
EB.push({role:'employe',re:/planning|horaire|semaine|demain|quand (?:est-ce que )?je travaille|astreinte|je commence|je finis|samedi|dimanche|lundi|mercredi|jeudi|vendredi/i,reply:function(t){var W=myWeek(),tot=weekTot(),k=/demain/i.test(t)?2:-1;['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'].forEach(function(d,i){if(nrm(t).indexOf(d)>=0)k=i});
  var d=k>=0?W[k]:null,ni=nextNight(),part=function(s){return s.parts.length?s.parts.map(function(q){return hm(q[0])+' à '+hm(q[1])}).join(' et '):'repos'};
  return {text:d?DL[k]+' '+d.n+' : <b>'+part(d)+'</b>'+(d.night?', puis astreinte de nuit de 20 h à 7 h':'')+'.':'Cette semaine : <b>'+hh(tot)+'</b> prévues pour 39 h au contrat.'+(ni>=0?' Prochaine astreinte de nuit <b>'+DL[ni].toLowerCase()+' '+W[ni].n+'</b>.':''),
   card:d?null:W.map(function(s,i){return '<div class="hrow sp"><span class="s'+(i===1?' b':'')+'">'+s.l+' '+s.n+'</span><span class="xs mut" style="text-align:right">'+part(s)+(s.night?' · nuit':'')+'</span></div>'}).join(''),
   actions:[{label:'Ouvrir mon planning',run:function(){P.go('emp-planning');return 'Planning ouvert'}},{label:'Proposer un échange',run:function(){P.go('emp-planning');setTimeout(function(){var b=$('[data-swapnew]',P.app());if(b)b.click()},350);return 'Échange préparé'}}]}}});
/* les questions précises passent avant les réponses générales de la journée */
for(var bi=EB.length-1;bi>=0;bi--)P.brain.unshift(EB[bi]);
P.suggestions.employe=['Qu’est-ce que je fais maintenant ?','Quelle ration pour Ulysse ?','Il reste combien de copeaux ?','Je travaille quand samedi ?','Combien de congés me reste-t-il ?','Mes heures cette semaine'];

/* ---------- Dictée dans le panneau de l'assistant (vue employé) ---------- */
var DICT=['Quelle ration pour Ulysse ?','Il reste combien de copeaux ?','Je travaille quand samedi ?','Signale un problème au box 12','Combien de congés me reste-t-il ?'],dk=0;
P.css(`.em-mic{flex:none}.em-mic.rec{background:var(--bad);color:var(--surface);box-shadow:none;animation:pulse 1.2s infinite}`);
function micInject(){if(P.state.role!=='employe')return;var w=$('.aip',P.app());if(!w||w.querySelector('.em-mic'))return;var f=w.querySelector('form.comp'),inp=f&&f.querySelector('input');if(!f||!inp)return;
  var b=document.createElement('button');b.type='button';b.className='btn icon sm em-mic';b.title='Dicter une question';b.setAttribute('aria-label','Dicter une question');b.innerHTML=ICON('mic','sm');f.insertBefore(b,f.lastElementChild);
  b.onclick=function(){if(b.classList.contains('rec'))return;var txt=DICT[dk++%DICT.length],i=0;b.classList.add('rec');inp.value='';inp.placeholder='J’écoute…';
    (function step(){if(!b.isConnected)return;i+=P.RM?txt.length:2;inp.value=txt.slice(0,i);if(i<txt.length)setTimeout(step,45);else setTimeout(function(){b.classList.remove('rec');inp.placeholder='Demandez n’importe quoi…';if(f.requestSubmit)f.requestSubmit();else f.dispatchEvent(new Event('submit',{cancelable:true}))},P.RM?0:380)})()}}
(function(){var a0=P.assistant;P.assistant=function(){var r=a0.apply(this,arguments);micInject();return r}})();

P.tourSteps.push({route:'emp-tournee',title:'La tournée des boxes, un geste par cheval',text:'Le soigneur fait défiler une carte par box : ration, couverture, consignes. Un glissement à droite si tout va bien, à gauche pour signaler avec photo. Sans réseau, tout part chez la gérante dès que la connexion revient.'});
/* Téléphone, avec des gants : toutes les cibles de la vue employé font au moins 40 px de haut. */
P.css(`
@container main (max-width:520px){
.app[data-role="employe"] .view .btn:not(.lg){min-height:44px}
.app[data-role="employe"] .view .btn.sm{min-height:40px;padding-inline:14px;font-size:13.5px}
.app[data-role="employe"] .view .btn.sm.icon{min-width:40px;padding-inline:0}
.app[data-role="employe"] .view .seg button{height:40px;padding:0 14px;font-size:13.5px}
.app[data-role="employe"] .view .tag{min-height:42px}
.app[data-role="employe"] .view .em-ck{width:44px;height:44px}
.app[data-role="employe"] .view .btn.sm.em-tlist{min-height:34px}
.app[data-role="employe"] .view .em-gt{padding-block:10px}
}
`);

/* =====================================================================
   Paddock · vue employé : dehors, avec des gants. Cibles énormes, contraste fort.
   ===================================================================== */
P.css(`
.em-dbad{--d:var(--bad);--d-bg:var(--bad-pale);--d-ink:var(--bad)}
.app[data-role="employe"] .view{--em-t:16px}
.em-b{height:56px;font-size:16.5px;border-radius:18px;padding:0 20px;font-weight:700}
.em-b svg.i{width:22px;height:22px}
.em-row{padding:15px 18px;min-height:68px;gap:14px}
.em-row+.em-row::before{left:18px;right:18px}
.em-row .t{font-size:16px;line-height:1.3}
.em-row .s{font-size:14px}
.em-tm{font:700 15px var(--f-mono);width:54px;color:var(--ink)}
.em-ck{width:44px;height:44px}
.em-ck.xl{width:68px;height:68px}
.em-ic{width:44px;height:44px;border-radius:14px}
.em-ic.lg{width:56px;height:56px;border-radius:18px}.em-ic.lg svg.i{width:26px;height:26px}
.em-ic.sm{width:38px;height:38px;border-radius:12px}
.em-lbl{font-size:14.5px;font-weight:700;color:var(--ink);margin-bottom:8px}
.em-3{gap:6px;padding:4px;border-radius:16px;background:var(--surface-3,var(--bg-2))}
.em-3 button{height:50px;border-radius:12px;font-size:15px;font-weight:700;color:var(--ink-2)}
.em-3 button[aria-pressed="true"]{box-shadow:var(--shadow-1),inset 0 0 0 2px var(--line-2)}
.em-3 button.k0[aria-pressed="true"]{color:var(--ok);background:var(--ok-pale);box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--ok) 55%,transparent)}
.em-3 button.k1[aria-pressed="true"]{color:var(--warn);background:var(--warn-pale);box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--warn) 55%,transparent)}
.em-3 button.k2[aria-pressed="true"]{box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--bad) 60%,transparent)}
.em-kv{padding:12px 14px;border-radius:16px;gap:4px}
.em-kv small{font-size:13px}.em-kv small svg.i{width:16px;height:16px}
.em-kv b{font-size:15.5px}
.em-h2{font:800 18px var(--f-display)}
.em-off{font-size:14.5px;padding:12px 14px;border-radius:16px}
.em-tags .tag{height:46px;padding:0 16px;font-size:15px}
.em-pick button{height:46px;padding:0 16px;font-size:15px}
.em-hb{height:38px;font-size:14px;padding:0 12px 0 8px}
.em-pa{width:52px;height:52px}
.em-add,.em-shot{width:84px;height:84px;border-radius:18px;font-size:13.5px}

/* Ma journée : en-tête de bienvenue, tuiles de chiffres, raccourcis en pastilles */
.em-sum{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.em-sm{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:16px 16px 14px;text-align:left;min-width:0;position:relative;overflow:hidden;transition:transform .4s var(--e-spring),box-shadow var(--t-2)}
.em-sm .ico{background:color-mix(in srgb,var(--surface) 72%,transparent);color:var(--d-ink)}
.em-sm .big{font-size:46px;margin-top:6px;color:var(--d-ink)}
.em-sm .lb{font-size:14px;font-weight:600;line-height:1.25;color:var(--d-ink)}
.em-sm .go{position:absolute;top:16px;right:14px;color:var(--d-ink);opacity:.55;transition:transform var(--t-2) var(--e-out),opacity var(--t-2)}
button.em-sm:hover{transform:translateY(-3px)}button.em-sm:hover .go{opacity:1;transform:translateX(3px)}
button.em-sm:active{transform:scale(.97)}
.em-sm.em-hot .big::after{content:"";display:inline-block;width:10px;height:10px;border-radius:50%;background:var(--bad);margin-left:6px;vertical-align:top;animation:pulse 1.6s infinite}
.em-qa{gap:10px}
.em-qa button{height:118px;border-radius:24px;font-size:15px;font-weight:700;gap:10px;box-shadow:inset 0 0 0 1px var(--line);background:var(--surface)}
.em-qa button .ico{width:52px;height:52px;border-radius:17px;transition:transform .45s var(--e-spring)}
.em-qa button .ico svg.i{width:26px;height:26px;color:inherit}
.em-qa button:hover .ico{transform:translateY(-3px) scale(1.06)}
.em-qa button.al{background:var(--bad-pale);box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--bad) 35%,transparent);color:var(--bad)}
.em-qa button.al .ico{background:var(--surface);color:var(--bad)}
.em-qa .bd{top:10px;right:12px;min-width:24px;height:24px;border-radius:12px;font-size:13px}
.em-urg{border-radius:24px;padding:20px;gap:16px}
.em-urg .ti{font:800 24px/1.12 var(--f-display);letter-spacing:-.03em}
.em-urg .s{font-size:15px!important;line-height:1.45}
.em-ctl{gap:8px}
.em-ctl div{font-size:14px;gap:8px}
.em-ctl i{height:10px;border-radius:5px}
.em-now{padding:24px;gap:18px;border-radius:28px}
.em-now h2{font-size:32px;line-height:1.05;letter-spacing:-.035em}
.em-now .sb2{font-size:15.5px}
.em-now .bar{height:12px}
.em-pill{height:32px;padding:0 12px;font-size:14px}
.em-more{font-size:14.5px;padding:16px 18px;min-height:56px}
.em-cons{padding:16px 18px;gap:12px}
.em-cons p{font-size:15.5px;line-height:1.5}
.em-wx div{font-size:13px;padding:10px 0;border-radius:14px}
.em-wx b{font-size:16px}

/* Tournée : une grande fiche par box, lisible à un mètre */
.em-prog .big{font:800 52px/1 var(--f-display);letter-spacing:-.045em}
.em-prog .big small{font:600 17px var(--f-text);color:var(--mut);letter-spacing:0;margin-left:2px}
.em-segs{gap:4px}
.em-segs i{height:12px;border-radius:6px}
.em-segs i.cur{transform:scaleY(1.35);box-shadow:0 0 0 3px color-mix(in srgb,var(--acc) 25%,transparent)}
.em-stack{height:572px}
.em-card{border-radius:30px;padding:0 18px 18px;gap:14px;box-shadow:inset 0 0 0 1px var(--line),var(--shadow-2)}
.em-ctop{display:flex;align-items:center;gap:14px;margin:0 -18px;padding:18px;background:var(--d-bg);color:var(--d-ink)}
.em-ctop.bad{--d-bg:var(--bad-pale);--d-ink:var(--bad)}
.em-ctop .av{box-shadow:0 0 0 4px var(--surface)}
.em-ctop .s{color:var(--d-ink);opacity:.8;font-size:14.5px;margin-top:3px}
.em-card .nm{font:800 28px/1.05 var(--f-display);letter-spacing:-.035em;color:var(--ink)}
.em-bx{display:flex;flex-direction:column;align-items:center;gap:1px;font:800 24px/1 var(--f-mono);padding:8px 12px 10px;border-radius:16px;letter-spacing:.01em}
.em-bx small{font:700 13px var(--f-text);letter-spacing:.06em;text-transform:uppercase;opacity:.7}
.em-cn{font-size:15px;line-height:1.4;padding:12px 14px;border-radius:16px;gap:10px;font-weight:600}
.em-cn svg.i{width:20px;height:20px}
.em-q{grid-template-columns:88px minmax(0,1fr);gap:10px;font-size:15px;font-weight:700;color:var(--ink)}
.em-stamp{font-size:20px;padding:8px 16px;top:26px;border-radius:14px}
.em-acts{grid-template-columns:minmax(0,1fr) 72px minmax(0,1.3fr);gap:10px;margin-top:22px}
.em-acts button{height:72px;border-radius:24px;font-size:17.5px;gap:10px}
.em-acts button svg.i{width:26px;height:26px}
.em-hint{font-size:14px;min-height:40px;margin-top:4px}
.em-fin{padding:36px 24px;gap:14px;border-radius:30px}
.em-fin h2{font-size:30px;letter-spacing:-.035em}
.em-fin .illu{margin:-6px 0 -4px}

/* Chevaux, fiche, soins, pointage */
.em-hc{padding:16px;gap:14px;border-radius:24px}
.em-hc .nm{font:800 19px/1.2 var(--f-display);letter-spacing:-.02em}
.em-meta{font-size:14px;gap:4px 14px;margin-top:6px}.em-meta svg.i{width:16px;height:16px}
.em-cl{font-size:14px;margin-top:8px}
.em-bxs{font:700 13.5px var(--f-mono);padding:3px 8px;border-radius:8px;background:var(--navy);color:var(--on-navy,var(--navy-ink))}
.em-hp{height:44px;font-size:14.5px;padding:0 14px 0 6px}
.em-hero{padding:22px;gap:18px;border-radius:28px;background:var(--hz-bg);box-shadow:none}
.em-hero h2{font-size:34px;letter-spacing:-.04em;color:var(--hz-ink)}
.em-hero .s.mut{color:var(--hz-ink);opacity:.8;font-size:15px}
.em-ev b{font-size:15px}.em-ev p{font-size:15px}
.em-hold{width:236px;height:236px}
.em-hold .tm{font-size:40px}
.em-hold .lb,.em-hold .sb{font-size:13px}
.em-ty button{height:104px;border-radius:24px;font-size:15px;gap:10px}
.em-ty button svg.i{width:28px;height:28px}
.em-step{font:800 18px var(--f-display);margin-bottom:12px}
.em-step i{width:28px;height:28px;font:800 14px var(--f-text)}
.em-wb div,.em-wb b{font-size:13px}

.em-sol .card{background:var(--d-bg);color:var(--d-ink);box-shadow:none;padding:16px;gap:8px;border-radius:24px}
.em-sol .card:nth-child(1){--d-bg:var(--tm-bg);--d-ink:var(--tm-ink)}
.em-sol .card:nth-child(2){--d-bg:var(--mo-bg);--d-ink:var(--mo-ink)}
.em-sol .card:nth-child(3){--d-bg:var(--rd-bg);--d-ink:var(--rd-ink)}
.em-sol .card .mut{color:var(--d-ink)!important;opacity:.85}
.em-sol .v{font:800 46px/1 var(--f-display)!important;letter-spacing:-.045em}
.em-sol .v small{color:var(--d-ink);opacity:.75;font-size:16px}
.em-sol .bar{background:color-mix(in srgb,var(--surface) 65%,transparent)}
.em-ty button:nth-child(1){--d:var(--hz);--d-bg:var(--hz-bg);--d-ink:var(--hz-ink)}
.em-ty button:nth-child(2){--d:var(--ex);--d-bg:var(--ex-bg);--d-ink:var(--ex-ink)}
.em-ty button:nth-child(3){--d:var(--cr);--d-bg:var(--cr-bg);--d-ink:var(--cr-ink)}
.em-ty button:nth-child(4){--d:var(--mo);--d-bg:var(--mo-bg);--d-ink:var(--mo-ink)}
.em-ty button:nth-child(5){--d:var(--tm);--d-bg:var(--tm-bg);--d-ink:var(--tm-ink)}
.em-ty button:nth-child(6){--d:var(--pf);--d-bg:var(--pf-bg);--d-ink:var(--pf-ink)}
.em-ty button{background:var(--d-bg);color:var(--d-ink);box-shadow:none}
.em-ty button svg.i{color:var(--d-ink)}
.em-ty button[aria-pressed="true"]{background:var(--navy);color:var(--navy-ink);box-shadow:0 0 0 3px var(--d),var(--shadow-2);transform:translateY(-2px)}
@container main (max-width:760px){
 .em-sol .v{font-size:36px!important}.em-sol .card{padding:14px 12px}
 .em-sum{gap:8px}
 .em-sm{padding:14px 12px 12px}
 .em-sm .big{font-size:40px}
 .em-sm .lb{font-size:13.5px}
 .em-sm .go{display:none}
 .em-now h2{font-size:28px}
}
@container main (max-width:520px){
 .em-b{height:60px}
 .em-qa{gap:8px}
 .em-qa button{height:110px;font-size:14px;border-radius:22px}
 .em-qa button .ico{width:48px;height:48px}
 .em-stack{height:676px}
 .em-card .g2{--g:6px!important;order:3}
 .em-card>.stack{order:2;margin-top:0!important}
 .em-card .em-kv{padding:10px 12px}
 .em-prog>.hrow{flex-wrap:wrap;row-gap:6px}
 .em-prog>.hrow>.hrow{flex:1 1 100%;justify-content:space-between}
 .em-prog .big{white-space:nowrap}
 .em-card .nm{font-size:26px}
 .em-q{grid-template-columns:minmax(0,1fr);gap:6px}
 .em-q>span{padding-left:4px}
 .em-3 button{height:54px}
 .em-acts{position:sticky;bottom:10px;z-index:6;margin:16px -6px 0;padding:6px;border-radius:30px;background:color-mix(in srgb,var(--bg) 82%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);box-shadow:var(--shadow-2)}
 .em-prog .big{font-size:46px}
 .em-hold{width:220px;height:220px}
 .em-hero h2{font-size:28px}
 .app[data-role="employe"] .view .em-sm{min-height:0}
}
`);
/* =====================================================================
   CLUB RÉEL : l'espace de l'employé connecté
   La démo suit Antoine Leroy (s05). Dans un vrai club, D.me.employe est la fiche du salarié connecté :
   ses tâches (D.tasks), les soins du jour (D.care), les chevaux, ses reprises et son pointage.
   ===================================================================== */
var LE={},LEB={};
function leMe(){var id=D.me&&D.me.employe;return D.staffer(id)||D.person(id)||{id:id||'me',first:'',last:'',role:''}}
function leFirst(){var m=leMe();return m.first||((window.PL&&PL.user&&PL.user.first)||'')}
function leT(){return D.iso(D.day(0))}
function leNowHM(){var d=new Date();return String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0')}
function leHh(s){return /^\d{1,2}:\d{2}$/.test(String(s||''))?hm(s):String(s||'')}
function leSave(){try{if(window.PL&&PL.sync)PL.sync.flush()}catch(e){}}
function leUid(p){return window.PL&&PL.uid?PL.uid(p):p+Date.now().toString(36)}
function leEsc(s){return F.esc(String(s==null?'':s))}
function leTasks(){var me=leMe(),t=leT();return (D.tasks||[]).filter(function(x){return (!x.who||x.who===me.id)&&(!x.date||x.date===t)}).sort(function(a,b){return String(a.time||'99').localeCompare(String(b.time||'99'))})}
function leCare(){var t=leT();return (D.care||[]).filter(function(c){return c.status!=='fait'&&c.date&&c.date<=t}).sort(function(a,b){return String(a.date+a.time).localeCompare(String(b.date+b.time))})}
function leCareDone(){var t=leT();return (D.care||[]).filter(function(c){return c.status==='fait'&&(c.doneAt||c.date||'').slice(0,10)===t})}
function leLessons(dow){var me=leMe();return (D.lessons||[]).filter(function(l){return l.dow===dow&&l.coach===me.id&&!/annul/i.test(l.status||'')}).sort(function(a,b){return String(a.start).localeCompare(String(b.start))})}
function leSafe(id,fn){return function(el,ctx){ctx=ctx||{params:{}};ctx.params=ctx.params||{};try{fn(el,ctx)}catch(e){console.warn('[employé] '+id,e);
  if(window.PL&&PL.renderEmpty){PL.renderErrors[id]=String(e&&e.message||e);PL.renderEmpty(el,P.mods[id],e)}else throw e}}}
function leTaskRow(t){return '<div class="em-row em-task'+(t.done?' done':'')+'" data-task="'+leEsc(t.id)+'"><span class="em-tm">'+leEsc(t.time||'')+'</span><div class="grow"><div class="t">'+leEsc(t.title)+'</div><div class="s">'+leEsc(t.zone||'')+(t.done&&t.doneBy&&t.doneBy!==leMe().id?' · fait par '+leEsc((D.person(t.doneBy)||{}).first||''):'')+'</div>'+(t.urgent&&!t.done?'<div style="margin-top:6px">'+U.chip('Prioritaire','bad',true)+'</div>':'')+'</div>'+ck(leEsc(t.id),t.done)+'</div>'}
function leToggle(id,el,draw){var t=(D.tasks||[]).filter(function(x){return String(x.id)===id})[0];if(!t)return;var me=leMe();
  if(t.done){t.done=false;delete t.doneBy;delete t.doneAt;leSave();draw();return}
  var row=el.querySelector('[data-task="'+id+'"]'),c=row&&row.querySelector('.em-ck');if(c)c.classList.add('on','go');if(row)row.classList.add('fin');
  setTimeout(function(){t.done=true;t.doneBy=me.id;t.doneAt=new Date().toISOString();leSave();if(el.isConnected)draw();
    P.toast('Tâche terminée : '+t.title,{icon:'checkc',undo:function(){t.done=false;delete t.doneBy;delete t.doneAt;leSave();if(el.isConnected)draw()}})},P.RM?10:520)}
function leCareCard(c){var h=D.horse(c.horse)||{name:'Cheval'},late=c.date<leT();
  return '<div class="card em-care"><div class="hrow" style="--g:12px;align-items:flex-start">'+ico('care','lg',late?'var(--bad)':'var(--acc)')+'<div class="grow"><div class="hrow wrap" style="--g:6px"><b style="font-size:15px">'+leEsc(c.kind)+'</b>'+(late?U.chip('En retard, prévu le '+F.date(c.date),'bad',true):U.chip(c.time?'À '+leEsc(leHh(c.time)):'Aujourd’hui',''))+'</div>'+
    '<button class="hrow s" style="--g:6px;margin-top:4px;color:var(--ink-2);font-weight:600" data-go="emp-cheval" data-id="'+leEsc(h.id)+'">'+U.hav(h,'sm')+leEsc(h.name)+(h.box?' · '+leEsc(h.box):'')+'</button></div></div>'+
    ((c.who||c.note)?'<div><div style="font-size:14.5px">'+leEsc(c.note||'')+'</div>'+(c.who?'<div class="s mut" style="margin-top:4px">Intervenant : '+leEsc(c.who)+'</div>':'')+'</div>':'')+
    '<div class="hrow" style="--g:8px"><button class="btn em-b pri grow" data-care="'+leEsc(c.id)+'">'+ICON('check')+'Valider le soin</button></div></div>'}
function leValidate(id,after){var c=(D.care||[]).filter(function(x){return String(x.id)===id})[0];if(!c)return;var me=leMe();c.status='fait';c.doneBy=me.id;c.doneAt=new Date().toISOString();
  var h=D.horse(c.horse);if(h){var k={Vermifuge:'worm',Vaccin:'vacc','Maréchal':'farrier',Dentiste:'dentist','Ostéopathe':'osteo'}[c.kind];if(k)h[k]=leT()}
  leSave();if(after)after();P.toast(c.kind+' validé'+(h?' pour '+h.name:''),{icon:'checkc',undo:function(){c.status='planifié';delete c.doneBy;delete c.doneAt;leSave();if(after)after()}})}

/* ---------- Ma journée ---------- */
LE['emp-jour']=function(el,ctx){var showDone=false,first=true;
  function draw(){var me=leMe(),T=leTasks(),left=T.filter(function(t){return !t.done}),done=T.filter(function(t){return t.done}),now=left[0],rest=left.slice(1),cr=leCare(),ls=leLessons(D.day(0).getDay());
   var h=hd('Bonjour'+(leFirst()?' '+leEsc(leFirst()):''),cap(F.dateL(D.day(0)))+(me.role?' · '+leEsc(me.role):''),'');
   var B=[];
   if(now)B.push('<div class="card navy em-now'+(first?'':' pop')+'" data-task="'+leEsc(now.id)+'"><div class="hrow sp"><span class="eyebrow">'+(now.time&&now.time<=leNowHM()?'Maintenant · depuis '+leEsc(leHh(now.time)):now.time?'À suivre · à '+leEsc(leHh(now.time)):'À faire')+'</span></div>'+
     '<div class="hrow" style="--g:14px;align-items:flex-start">'+ck(leEsc(now.id),false,'xl')+'<div class="grow"><h2>'+leEsc(now.title)+'</h2><div class="sb2">'+leEsc(now.zone||'')+'</div></div></div>'+
     '<div class="hrow" style="--g:8px"><button class="btn em-b pri grow" data-fin="'+leEsc(now.id)+'">'+ICON('check')+'C’est fait</button></div></div>');
   else B.push('<div class="card navy em-now"><div class="hrow"><span class="strass" style="background:var(--navy-ink)"></span><span class="eyebrow">'+(T.length?'Journée bouclée':'Aucune tâche')+'</span></div><h2>'+(T.length?'Tout est fait'+(leFirst()?', '+leEsc(leFirst()):'')+'.':'Rien de planifié pour vous aujourd’hui.')+'</h2><div class="sb2" style="margin-top:-8px">'+(T.length?T.length+' tâche'+(T.length>1?'s':'')+' terminée'+(T.length>1?'s':'')+'. Pensez à pointer votre départ.':'Votre gérant ajoute vos tâches dans Stabl : elles apparaîtront ici.')+'</div><button class="btn em-b pri" data-go="emp-pointage">'+ICON('clockin')+'Pointage</button></div>');
   B.push('<div class="em-sum">'+[['d-equipe','today',left.length,'tâche'+(left.length>1?'s':'')+' à faire',''],['d-soins','care',cr.length,'soin'+(cr.length>1?'s':'')+' à donner','data-go="emp-soins"'],['d-chevaux','horse',(D.horses||[]).length,'cheva'+((D.horses||[]).length>1?'ux':'l')+' à l’écurie','data-go="emp-chevaux"']].map(function(t){return '<'+(t[4]?'button '+t[4]:'div')+' class="card tint em-sm '+t[0]+(t[0]==='d-soins'&&t[2]?' em-hot':'')+'"><span class="ico sm">'+ICON(t[1])+'</span><b class="big num">'+t[2]+'</b><span class="lb">'+t[3]+'</span>'+(t[4]?'<span class="go">'+ICON('arrow','sm')+'</span>':'')+'</'+(t[4]?'button':'div')+'>'}).join('')+'</div>');
   B.push('<div class="em-qa" style="grid-template-columns:repeat(4,minmax(0,1fr))">'+[['emp-signaler','alert','Signaler','al','em-dbad'],['emp-soins','care','Soins','','d-soins'],['emp-pointage','clockin','Pointage','','d-equipe'],['emp-tournee','stable','Tournée','','d-chevaux']].map(function(q){return '<button data-go="'+q[0]+'"'+(q[3]?' class="'+q[3]+'"':'')+'><span class="ico '+q[4]+'">'+ICON(q[1])+'</span>'+q[2]+(q[0]==='emp-soins'&&cr.length?'<span class="bd">'+cr.length+'</span>':'')+'</button>'}).join('')+'</div>');
   B.push('<div class="card"><div class="ch" style="padding-bottom:8px"><h3>'+(now?'Ensuite':'Mes tâches')+'</h3>'+(T.length?'<div class="hrow" style="--g:8px"><span class="s mut num">'+done.length+' sur '+T.length+' faites</span>'+U.ring(done.length/T.length*100,done.length,'var(--ok)',34)+'</div>':'')+'</div><div>'+
     (rest.length?rest.map(leTaskRow).join(''):'<div class="empty" style="padding:22px">'+ICON('checkc')+'<span class="s">'+(T.length?'Plus rien après cette tâche.':'Aucune tâche ne vous est attribuée aujourd’hui.')+'</span></div>')+'</div>'+
     (done.length?'<button class="em-more" data-done aria-expanded="'+showDone+'">'+ICON('down','sm')+done.length+' tâche'+(done.length>1?'s':'')+' faite'+(done.length>1?'s':'')+'</button>'+(showDone?'<div>'+done.map(leTaskRow).join('')+'</div>':''):'')+'</div>');
   if(cr.length)B.push('<div class="card"><div class="ch"><h3>Soins à donner</h3><button class="btn ghost sm" data-go="emp-soins">Tout voir'+ICON('arrow','sm')+'</button></div><div>'+cr.slice(0,4).map(function(c){var hh=D.horse(c.horse)||{name:'Cheval'};return '<button class="em-row" data-go="emp-soins">'+U.hav(hh)+'<div class="grow"><div class="t">'+leEsc(c.kind)+' · '+leEsc(hh.name)+'</div><div class="s">'+(c.date<leT()?'En retard depuis le '+F.date(c.date):c.time?'À '+leEsc(leHh(c.time)):'Aujourd’hui')+'</div></div>'+ICON('right','sm')+'</button>'}).join('')+'</div></div>');
   if(ls.length)B.push('<div class="card"><div class="ch"><h3>Mes reprises du jour</h3></div><div>'+ls.map(function(l){return '<div class="em-row"><span class="em-tm">'+leEsc(l.start)+'</span><div class="grow"><div class="t">'+leEsc(l.title)+'</div><div class="s">'+(l.riders||[]).length+' cavalier'+((l.riders||[]).length>1?'s':'')+' sur '+l.cap+'</div></div></div>'}).join('')+'</div></div>');
   el.innerHTML=h+'<div class="stack'+(first?' rise':'')+'" style="--g:14px">'+B.join('')+'</div>';if(first)P.animate(el);first=false}
  on(el,'[data-ck]',function(b,e){e.stopPropagation();leToggle(b.getAttribute('data-ck'),el,draw)});
  on(el,'[data-fin]',function(b){leToggle(b.getAttribute('data-fin'),el,draw)});
  on(el,'[data-done]',function(){showDone=!showDone;draw()});
  draw()};

/* ---------- Tournée des boxes : un passage noté dans le carnet de chaque cheval ---------- */
LE['emp-tournee']=function(el,ctx){var t=leT(),me=leMe(),hs=(D.horses||[]).slice().sort(function(a,b){return String(a.box||'zz').localeCompare(String(b.box||'zz'),'fr',{numeric:true})});
  function seen(h){return (D.journal||[]).filter(function(j){return j.horse===h.id&&j.kind==='tournee'&&j.date===t})[0]}
  function draw(){var n=hs.filter(seen).length;
   el.innerHTML=hd('Tournée des boxes',hs.length?n+' box'+(n>1?'es':'')+' vu'+(n>1?'s':'')+' sur '+hs.length+' · chaque passage est noté dans le carnet du cheval':'Aucun cheval à l’écurie pour l’instant','')+
    (hs.length?'<div class="card" style="margin-bottom:14px;padding:16px">'+U.bar(n/hs.length*100,'var(--ok)')+'</div><div class="stack rise" style="--g:10px">'+hs.map(function(h){var s=seen(h),r=h.ration||{};
     return '<div class="card" style="padding:14px 16px"><div class="hrow" style="--g:12px">'+U.hav(h)+'<div class="grow" style="min-width:0"><div class="b">'+leEsc(h.name)+(h.box?' <span class="mut" style="font-weight:500">· '+leEsc(h.box)+'</span>':'')+'</div><div class="s mut ellip">'+(r.hay?r.hay+' kg de foin':'')+(r.grain?' · '+String(r.grain).replace('.',',')+' kg de granulés':'')+(r.supp&&r.supp!=='Aucun'?' · '+leEsc(r.supp):'')+'</div>'+(s?'<div class="s" style="margin-top:4px">'+U.chip(s.text==='Tournée : rien à signaler'?'RAS à '+leEsc(s.when):'Signalé à '+leEsc(s.when),s.text==='Tournée : rien à signaler'?'ok':'warn',true)+'</div>':'')+'</div>'+
      (s?'':'<button class="btn em-b" data-ras="'+leEsc(h.id)+'" title="Rien à signaler">'+ICON('check')+'RAS</button><button class="btn em-b" data-pb="'+leEsc(h.id)+'" title="Signaler un problème">'+ICON('alert')+'</button>')+'</div></div>'}).join('')+'</div>':'<div class="card">'+U.empty('stable','Aucun box à visiter','Les chevaux ajoutés par votre gérant apparaîtront ici avec leur ration.')+'</div>')}
  function note(h,text){D.journal.push({id:leUid('jr'),horse:h.id,who:me.id,role:me.role||'Équipe',when:leHh(leNowHM()),date:t,text:text,kind:'tournee',mood:text==='Tournée : rien à signaler'?5:2});leSave();draw()}
  on(el,'[data-ras]',function(b){var h=D.horse(b.getAttribute('data-ras'));note(h,'Tournée : rien à signaler');P.toast(h.name+' : rien à signaler',{icon:'checkc'})});
  on(el,'[data-pb]',function(b){var h=D.horse(b.getAttribute('data-pb'));var sh=P.sheet({title:h.name+(h.box?' · '+h.box:''),icon:'alert',body:'<label class="lv-fl"><span>Ce que vous avez constaté</span><textarea class="in" rows="4" data-tx style="height:auto;padding:12px" placeholder="N’a pas fini sa ration, boite, abreuvoir en panne…"></textarea></label>',foot:'<button class="btn em-b" data-x2>Annuler</button><button class="btn em-b pri" style="flex:1" data-ok>Enregistrer</button>'});
    sh.querySelector('[data-x2]').onclick=function(){sh.close()};sh.querySelector('[data-ok]').onclick=function(){var x=sh.querySelector('[data-tx]').value.trim();if(!x){P.toast('Décrivez ce que vous avez vu.',{icon:'alert'});return}note(h,'Tournée : '+x);sh.close();P.toast('Noté dans le carnet de '+h.name+', le gérant le voit',{icon:'alert'})}});
  draw()};

/* ---------- Fiche cheval ---------- */
LE['emp-cheval']=function(el,ctx){var hs=D.horses||[],h=D.horse(ctx.params.id)||hs[0],me=leMe();
  if(!h){el.innerHTML=hd('Fiche cheval','','')+'<div class="card">'+U.empty('horse','Aucun cheval','Les chevaux ajoutés par votre gérant apparaîtront ici.')+'</div>';return}
  var t=leT(),care=(D.care||[]).filter(function(c){return c.horse===h.id}).sort(function(a,b){return String(a.date).localeCompare(String(b.date))}),todo=care.filter(function(c){return c.status!=='fait'}),jr=(D.journal||[]).filter(function(j){return j.horse===h.id}).slice().reverse(),r=h.ration||{},note=D.empNotes&&D.empNotes[h.id];
  function draw(){var mt=$('.mt',P.app());if(mt)mt.textContent=h.name;el.innerHTML=hd(leEsc(h.name),leEsc([h.box?'Box '+h.box:'',h.breed,h.age?h.age+' ans':'',h.owner?'à '+D.name(h.owner):'cheval du club'].filter(Boolean).join(' · ')),'<button class="btn" data-obs>'+ICON('edit','sm')+'Observation</button>')+
   '<div class="stack rise" style="--g:14px">'+(note?'<div class="note warn">'+ICON('alert','sm')+'<span><b>Consigne :</b> '+leEsc(note)+'</span></div>':'')+
   '<div class="card pad"><div class="eyebrow">Ration du jour</div><div class="g3" style="margin-top:10px"><div><div class="big num" style="font-size:28px">'+(+r.hay||0)+' kg</div><div class="s mut">Foin</div></div><div><div class="big num" style="font-size:28px">'+String(+r.grain||0).replace('.',',')+' kg</div><div class="s mut">Granulés</div></div><div><div class="b">'+leEsc(r.supp||'Aucun')+'</div><div class="s mut">Complément</div></div></div>'+(h.paddock?'<div class="s mut" style="margin-top:10px">Paddock : '+leEsc(h.paddock)+'</div>':'')+'</div>'+
   '<div class="card"><div class="ch"><h3>Soins</h3>'+(todo.length?U.chip(todo.length+' à faire','warn',true):'')+'</div>'+(care.length?'<div>'+care.slice(-8).reverse().map(function(c){var dn=c.status==='fait';return '<div class="em-row"><div class="grow"><div class="t">'+leEsc(c.kind)+(c.who?' · '+leEsc(c.who):'')+'</div><div class="s">'+F.date(c.date)+(c.note?' · '+leEsc(c.note):'')+'</div></div>'+(dn?U.chip('Fait','ok',true):c.date<=t?'<button class="btn em-b sm pri" data-care="'+leEsc(c.id)+'">'+ICON('check','sm')+'Valider</button>':U.chip(cap(F.rel(c.date)),'acc',true))+'</div>'}).join('')+'</div>':U.empty('care','Aucun soin enregistré',''))+'</div>'+
   '<div class="card"><div class="ch"><h3>Carnet</h3></div>'+(jr.length?'<div>'+jr.slice(0,10).map(function(j){return '<div class="em-row">'+U.av(j.who)+'<div class="grow"><div class="t">'+leEsc(D.name(j.who)||j.role||'')+' <span class="mut" style="font-weight:500">· '+leEsc(j.when||'')+'</span></div><div class="s">'+leEsc(j.text)+'</div></div></div>'}).join('')+'</div>':U.empty('doc','Carnet vide','Notez une observation : le gérant et le propriétaire la voient.'))+'</div></div>'}
  on(el,'[data-care]',function(b){leValidate(b.getAttribute('data-care'),function(){care=(D.care||[]).filter(function(c){return c.horse===h.id});todo=care.filter(function(c){return c.status!=='fait'});draw()})});
  on(el,'[data-obs]',function(){var sh=P.sheet({title:'Observation · '+h.name,icon:'edit',body:'<label class="lv-fl"><span>Ce que vous avez constaté</span><textarea class="in" rows="4" data-tx style="height:auto;padding:12px"></textarea></label>',foot:'<button class="btn em-b pri block" data-ok>Enregistrer</button>'});
    sh.querySelector('[data-ok]').onclick=function(){var x=sh.querySelector('[data-tx]').value.trim();if(!x)return;D.journal.push({id:leUid('jr'),horse:h.id,who:me.id,role:me.role||'Équipe',when:'Aujourd’hui, '+leHh(leNowHM()),date:t,text:x,kind:'soin',mood:3});leSave();jr=(D.journal||[]).filter(function(j){return j.horse===h.id}).slice().reverse();sh.close();draw();P.toast('Observation enregistrée',{icon:'check'})}});
  draw()};

/* ---------- Mon planning ---------- */
LE['emp-planning']=function(el,ctx){var me=leMe(),days=Array.apply(null,Array(7)).map(function(_,o){return o}),any=days.some(function(o){return leLessons(D.day(o).getDay()).length});
  var tk=leTasks();
  el.innerHTML=hd('Mon planning','Vos reprises des 7 prochains jours'+(me.hours?' · contrat de '+me.hours+' h par semaine':''),'')+
   (any?'<div class="stack rise" style="--g:12px">'+days.map(function(o){var ls=leLessons(D.day(o).getDay());if(!ls.length)return '';return '<div class="card"><div class="ch"><h3>'+cap(o===0?'aujourd’hui':o===1?'demain':F.dateL(D.day(o)))+'</h3><span class="chip">'+ls.length+'</span></div><div>'+ls.map(function(l){return '<div class="em-row"><span class="em-tm">'+leEsc(l.start)+'</span><div class="grow"><div class="t">'+leEsc(l.title)+'</div><div class="s">'+l.dur+' min · '+(l.riders||[]).length+' cavalier'+((l.riders||[]).length>1?'s':'')+' sur '+l.cap+(D.club.arenas&&l.arena?' · '+leEsc((D.club.arenas.filter(function(a){return a.id===l.arena})[0]||{}).name||''):'')+'</div></div></div>'}).join('')+'</div></div>'}).join('')+'</div>':
    '<div class="card">'+U.empty('planning','Aucune reprise à votre nom','Vos horaires et vos reprises apparaîtront ici dès que votre gérant les aura saisis.'+(tk.length?' En attendant, vos tâches du jour sont sur « Aujourd’hui ».':''),tk.length?'<button class="btn pri" data-go="emp-jour">Voir mes tâches</button>':'')+'</div>')};

/* ---------- Soins du jour ---------- */
LE['emp-soins']=function(el,ctx){var tab='todo';
  function draw(){var todo=leCare(),done=leCareDone();
   var x=hd('Soins du jour',todo.length+' soin'+(todo.length>1?'s':'')+' à donner · '+done.length+' fait'+(done.length>1?'s':'')+' aujourd’hui',U.seg([['todo','À donner <b class="num">'+todo.length+'</b>'],['done','Faits <b class="num">'+done.length+'</b>']],tab,'data-tab'));
   var L=tab==='todo'?todo:done;
   x+=L.length?'<div class="em-cg rise">'+(tab==='todo'?L.map(leCareCard).join(''):L.map(function(c){var h=D.horse(c.horse)||{name:'Cheval'};return '<div class="card em-care done"><div class="hrow" style="--g:12px">'+ico('care','lg','var(--ok)')+'<div class="grow"><b>'+leEsc(c.kind)+'</b> · '+leEsc(h.name)+'<div class="s mut">'+(c.doneBy?'Par '+leEsc(D.name(c.doneBy)):'')+(c.doneAt?' à '+lvT(c.doneAt):'')+'</div></div>'+U.chip('Fait','ok',true)+'</div></div>'}).join(''))+'</div>':
     '<div class="card">'+U.empty('checkc',tab==='todo'?'Aucun soin à donner':'Aucun soin validé aujourd’hui',tab==='todo'?'Les soins planifiés par le club pour aujourd’hui apparaîtront ici.':'')+'</div>';
   el.innerHTML=x}
  function lvT(iso){var d=new Date(iso);return isNaN(d)?'':leHh(String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'))}
  on(el,'[data-tab]',function(b){tab=b.getAttribute('data-tab');draw()});
  on(el,'[data-care]',function(b){leValidate(b.getAttribute('data-care'),draw)});
  draw()};

/* ---------- Pointage ---------- */
LE['emp-pointage']=function(el,ctx){var me=leMe(),t=leT();
  function mine(){return (D.empPresence||[]).filter(function(p){return p.who===me.id})}
  function today(){return mine().filter(function(p){return p.date===t})}
  function mins(p){if(!p.in)return 0;var o=p.out||(p.date===t?leNowHM():p.in);var a=p.in.split(':'),b=o.split(':');return Math.max(0,(+b[0]*60+(+b[1]))-(+a[0]*60+(+a[1])))}
  function fmtM(m){return Math.floor(m/60)+' h '+String(m%60).padStart(2,'0')}
  function draw(){var td=today(),open=td.filter(function(p){return !p.out})[0],dm=td.reduce(function(a,p){return a+mins(p)},0),wk=[];for(var i=0;i<7;i++)wk.push(D.iso(D.day(-i)));var wm=mine().filter(function(p){return wk.indexOf(p.date)>=0}).reduce(function(a,p){return a+mins(p)},0);
   el.innerHTML=hd('Pointage',cap(F.dateL(D.day(0)))+(me.hours?' · contrat de '+me.hours+' h par semaine':''),'')+
    '<div class="stack rise" style="--g:14px"><div class="card navy em-now"><div class="hrow sp"><span class="eyebrow">'+(open?'Pointé depuis '+leEsc(leHh(open.in)):'Pas pointé')+'</span></div><h2 class="num">'+fmtM(dm)+'</h2><div class="sb2">travaillées aujourd’hui · '+fmtM(wm)+' sur 7 jours</div>'+
    '<button class="btn em-b pri block" data-clock>'+ICON('clockin')+(open?'Pointer mon départ':'Pointer mon arrivée')+'</button></div>'+
    '<div class="card"><div class="ch"><h3>Aujourd’hui</h3></div>'+(td.length?'<div>'+td.map(function(p){return '<div class="em-row"><span class="em-tm">'+leEsc(p.in)+'</span><div class="grow"><div class="t">'+(p.out?'De '+leEsc(leHh(p.in))+' à '+leEsc(leHh(p.out)):'Arrivée à '+leEsc(leHh(p.in)))+'</div><div class="s">'+fmtM(mins(p))+'</div></div></div>'}).join('')+'</div>':U.empty('clockin','Aucun pointage aujourd’hui','Pointez votre arrivée : votre gérant voit vos heures et le total de la semaine.'))+'</div></div>'}
  on(el,'[data-clock]',function(){var open=today().filter(function(p){return !p.out})[0],now=leNowHM();
    if(open){open.out=now;P.toast('Départ pointé à '+leHh(now),{icon:'clockin'})}else{D.empPresence.push({id:leUid('pt'),who:me.id,date:t,in:now,out:null,st:'in',txt:'Depuis '+leHh(now)});P.toast('Arrivée pointée à '+leHh(now),{icon:'clockin'})}leSave();draw()});
  draw()};

/* ---------- Signaler ---------- */
LE['emp-signaler']=function(el,ctx){var me=leMe(),K=[['Cheval blessé ou malade','horse'],['Matériel cassé','wrench'],['Clôture','paddock'],['Abreuvoir ou eau','drop'],['Stock bas','stock'],['Autre','alert']],sel=0,sev=1;
  function mine(){return (D.empIncidents||[]).filter(function(i){return i.by===me.id}).slice().reverse()}
  function draw(){var L=mine();el.innerHTML=hd('Signaler','Un problème à l’écurie : votre gérant est prévenu tout de suite.','')+
   '<div class="stack rise" style="--g:14px"><div class="card pad"><span class="em-lbl">Quoi</span><div class="hrow wrap" style="--g:6px">'+K.map(function(k,i){return '<button class="tag" data-k="'+i+'" aria-pressed="'+(i===sel)+'">'+ICON(k[1],'sm')+k[0]+'</button>'}).join('')+'</div>'+
    '<span class="em-lbl" style="margin-top:14px">Où</span><input class="in" data-where placeholder="Box, paddock, carrière…">'+
    '<span class="em-lbl" style="margin-top:14px">Urgence</span>'+tri('sev',['Peut attendre','Aujourd’hui','Tout de suite'],sev)+
    '<span class="em-lbl" style="margin-top:14px">Détails</span><textarea class="in" rows="3" data-tx style="height:auto;padding:12px"></textarea>'+
    '<button class="btn em-b pri block" style="margin-top:14px" data-send>'+ICON('send')+'Envoyer au gérant</button></div>'+
   '<div class="card"><div class="ch"><h3>Mes signalements</h3></div>'+(L.length?'<div>'+L.map(function(i){return '<div class="em-row"><div class="grow"><div class="t">'+leEsc(i.kind)+(i.where?' · '+leEsc(i.where):'')+'</div><div class="s">'+leEsc(i.when)+(i.txt?' · '+leEsc(i.txt):'')+'</div></div>'+U.chip(leEsc(i.st||'Envoyé'),i.sev>=2?'bad':'acc',true)+'</div>'}).join('')+'</div>':U.empty('alert','Aucun signalement','Ce que vous signalez ici reste dans l’historique.'))+'</div></div>';
   bindTri(el,function(k,v){sev=v})}
  on(el,'[data-k]',function(b){sel=+b.getAttribute('data-k');$$('[data-k]',el).forEach(function(x){x.setAttribute('aria-pressed',x===b)})});
  on(el,'[data-send]',function(){var w=el.querySelector('[data-where]').value.trim(),x=el.querySelector('[data-tx]').value.trim();
    D.empIncidents.push({id:leUid('inc'),kind:K[sel][0],where:w,when:'Aujourd’hui, '+leHh(leNowHM()),date:leT(),sev:sev,st:'Envoyé',txt:x,by:me.id});leSave();draw();P.toast('Signalement envoyé au gérant',{icon:'send'})});
  draw()};

/* ---------- Messages ---------- */
LE['emp-messages']=function(el,ctx){var me=leMe();
  function mine(){return (D.empThreads||[]).filter(function(t){return t.from===me.id||t.with===me.id||(Array.isArray(t.grp)&&t.grp.indexOf(me.id)>=0)})}
  function send(t,x){var m={w:me.id,t:leHh(leNowHM()),x:x,at:new Date().toISOString()};if(!t){t={id:leUid('et'),title:'Gérance',from:me.id,grp:[me.id],unread:1,msgs:[m]};D.empThreads.unshift(t)}else{t.msgs=(t.msgs||[]).concat([m]);t.unread=(+t.unread||0)+1}leSave();return t}
  function draw(){var L=mine();el.innerHTML=hd('Messages','Vos échanges avec la gérance et l’équipe.','<button class="btn pri" data-new>'+ICON('edit','sm')+'Écrire</button>')+
   '<div class="card">'+(L.length?'<div>'+L.map(function(t){var last=(t.msgs||[]).slice(-1)[0]||{};return '<button class="em-row" data-th="'+leEsc(t.id)+'" style="width:100%;text-align:left">'+ico('chat')+'<div class="grow" style="min-width:0"><div class="t">'+leEsc(t.from===me.id?'Gérance':t.title||'Équipe')+'</div><div class="s ellip">'+leEsc(last.x||'')+'</div></div><span class="xs mut">'+leEsc(last.t||'')+'</span></button>'}).join('')+'</div>':
    U.empty('chat','Aucun message','Une question, un imprévu ? Écrivez à la gérance, la réponse arrive ici.','<button class="btn pri" data-new2>'+ICON('edit','sm')+'Écrire à la gérance</button>'))+'</div>'}
  function write(t){var sh=P.sheet({title:t?(t.from===me.id?'Gérance':t.title):'Écrire à la gérance',icon:'chat',body:(t?'<div class="stack" style="--g:10px;margin-bottom:14px">'+(t.msgs||[]).map(function(m){var my=m.w===me.id;return '<div class="card '+(my?'tint d-acc':'soft')+'" style="padding:12px 14px;max-width:85%;'+(my?'margin-left:auto':'')+'"><div class="s">'+leEsc(m.x)+'</div><div class="xs mut" style="margin-top:4px">'+(my?'Vous':leEsc(D.name(m.w)||'Gérance'))+' · '+leEsc(m.t||'')+'</div></div>'}).join('')+'</div>':'')+'<textarea class="in" rows="3" data-tx style="height:auto;padding:12px" placeholder="Votre message"></textarea>',foot:'<button class="btn em-b pri block" data-ok>'+ICON('send')+'Envoyer</button>'});
    sh.querySelector('[data-ok]').onclick=function(){var x=sh.querySelector('[data-tx]').value.trim();if(!x)return;send(t,x);sh.close();draw();P.toast('Message envoyé',{icon:'send'})}}
  on(el,'[data-new],[data-new2]',function(){write(null)});
  on(el,'[data-th]',function(b){write(mine().filter(function(t){return String(t.id)===b.getAttribute('data-th')})[0])});
  draw()};

/* ---------- Congés et documents ---------- */
LE['emp-conges']=function(el,ctx){var me=leMe();
  function mine(){return (D.empLeaves||[]).filter(function(l){return l.who===me.id})}
  function draw(){var L=mine();el.innerHTML=hd('Congés et documents','Vos demandes d’absence, transmises à la gérance.','<button class="btn pri" data-ask>'+ICON('plus','sm')+'Demander un congé</button>')+
   '<div class="card">'+(L.length?'<div>'+L.map(function(l){return '<div class="em-row"><div class="grow"><div class="t">'+leEsc(l.kind)+' · '+l.days+' jour'+(l.days>1?'s':'')+'</div><div class="s">Du '+F.date(l.from)+' au '+F.date(l.to)+(l.note?' · '+leEsc(l.note):'')+'</div></div>'+U.chip(leEsc(l.st),l.st==='validé'?'ok':l.st==='refusé'?'bad':'acc',true)+'</div>'}).join('')+'</div>':U.empty('holiday','Aucune demande','Demandez un congé : la gérance le valide depuis son espace.'))+'</div>'+
   '<div class="card" style="margin-top:14px">'+U.empty('doc','Vos documents','Contrat, bulletins de paie et attestations sont remis par la gérance.')+'</div>'}
  on(el,'[data-ask]',function(){var sh=P.sheet({title:'Demander un congé',icon:'holiday',body:'<div class="lv-f"><label class="lv-fl"><span>Type</span><select class="in" data-k><option>Congé payé</option><option>Récupération</option><option>Congé sans solde</option><option>Absence exceptionnelle</option></select></label><div class="lv-row2"><label class="lv-fl"><span>Du</span><input class="in" type="date" data-f value="'+leT()+'"></label><label class="lv-fl"><span>Au</span><input class="in" type="date" data-t value="'+leT()+'"></label></div><label class="lv-fl"><span>Commentaire</span><input class="in" data-n></label></div>',foot:'<button class="btn em-b pri block" data-ok>'+ICON('send')+'Envoyer la demande</button>'});
    sh.querySelector('[data-ok]').onclick=function(){var f=sh.querySelector('[data-f]').value,to=sh.querySelector('[data-t]').value;if(!f||!to||to<f){P.toast('Vérifiez les dates.',{icon:'alert'});return}
      var days=Math.round((new Date(to+'T12:00:00')-new Date(f+'T12:00:00'))/864e5)+1;D.empLeaves.unshift({id:leUid('cg'),who:me.id,kind:sh.querySelector('[data-k]').value,from:f,to:to,days:days,st:'en attente',note:sh.querySelector('[data-n]').value.trim(),asked:new Date().toISOString()});leSave();sh.close();draw();P.toast('Demande envoyée à la gérance',{icon:'holiday'})}});
  draw()};

/* ---------- Mon arrivée ---------- */
LE['emp-bienvenue']=function(el,ctx){var me=leMe(),u=(window.PL&&PL.user)||{};
  var steps=[['today','Voir ma journée','Mes tâches et les soins du jour','emp-jour'],['horse','Découvrir les chevaux','Fiches, rations et consignes','emp-chevaux'],['clockin','Pointer mon arrivée','Mes heures, jour après jour','emp-pointage'],['alert','Savoir signaler un problème','Votre gérant est prévenu tout de suite','emp-signaler']];
  el.innerHTML=hd('Bienvenue'+(leFirst()?' '+leEsc(leFirst()):''),'Votre espace '+leEsc(D.club.name)+(me.role?' · '+leEsc(me.role):''),'')+
   '<div class="card"><div>'+steps.map(function(s){return '<button class="em-row" data-go="'+s[3]+'" style="width:100%;text-align:left">'+ico(s[0])+'<div class="grow"><div class="t">'+s[1]+'</div><div class="s">'+s[2]+'</div></div>'+ICON('right','sm')+'</button>'}).join('')+'</div></div>'};

/* ---------- Pastilles ---------- */
LEB['emp-jour']=function(){var n=leTasks().filter(function(t){return !t.done}).length;return n?{v:n}:null};
LEB['emp-soins']=function(){var n=leCare().length;return n?{v:n,hot:true}:null};
LEB['emp-tournee']=function(){return null};LEB['emp-messages']=function(){return null};

if(!DEMO){
  Object.keys(LE).forEach(function(id){var m=P.mods[id];if(!m)return;m.render=leSafe(id,LE[id]);m.__lv=true});
  Object.keys(LEB).forEach(function(id){var m=P.mods[id];if(m)m.badge=LEB[id]});
  if(P.mods['emp-jour'])P.mods['emp-jour'].phoneTitle='Bonjour';
  for(var ai=P.actions.length-1;ai>=0;ai--)if(P.actions[ai].role==='employe')P.actions.splice(ai,1);
  P.actions.push({role:'employe',label:'Voir mes tâches du jour',icon:'today',run:function(){P.go('emp-jour')}},{role:'employe',label:'Valider un soin',icon:'care',run:function(){P.go('emp-soins')}},
    {role:'employe',label:'Pointer',icon:'clockin',run:function(){P.go('emp-pointage')}},{role:'employe',label:'Signaler un problème',icon:'alert',run:function(){P.go('emp-signaler')}});
  for(var bi=P.brain.length-1;bi>=0;bi--)if(P.brain[bi].role==='employe')P.brain.splice(bi,1);
  for(var ti=P.tourSteps.length-1;ti>=0;ti--)if(/^emp-/.test(P.tourSteps[ti].route||''))P.tourSteps.splice(ti,1);
  if(P.suggestions&&P.suggestions.employe)P.suggestions.employe.length=0;
}

})();
