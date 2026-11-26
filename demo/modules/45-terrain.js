/* Lot 45 · Terrain : prés et paddocks, vente de chevaux, cours en direct.
   Écrans : pres (gérant), emp-pres (employé), adh-pre (propriétaire), ventes et annonce (gérant),
   cours (gérant) et emp-cours (employé, moniteur).
   Données propres (préfixe tableau, objets avec id, synchronisables par le magasin générique records) :
   pastures, pastureMoves, pastureRules, horseCues, horseAds, horseLeads, horseTrials, lessonCalls, lessonCredits.
   Tout marche sans réseau : aucune requête, l'état d'une reprise en cours est gardé sur l'appareil. */
(function(){
var D=P.D,F=P.fmt,U=P.ui,E=F.esc,$=P.$,$$=P.$$;
var DEMO=!D.me||D.me.gerant==='s01'||!!(window.PL&&PL.sandbox);
var LIVE=!!(window.PL&&PL.live)&&!DEMO;
var NB='\u00a0';

/* ---------- Outils ---------- */
function p2(n){return (n<10?'0':'')+n}
function mm(s){return /^\d\d:\d\d$/.test(s||'')?(+s.slice(0,2))*60+(+s.slice(3)):null}
function fromMin(m){m=Math.max(0,Math.round(m));return p2(Math.floor(m/60)%24)+':'+p2(m%60)}
function hm(s){if(!/^\d\d:\d\d$/.test(s||''))return s||'';var h=+s.slice(0,2),m=s.slice(3);return h+NB+'h'+(m==='00'?'':NB+m)}
function nowD(){return DEMO?new Date(D.today):new Date()}
function nowHM(){var d=nowD();return p2(d.getHours())+':'+p2(d.getMinutes())}
function nowMin(){return mm(nowHM())}
function today(){return D.iso(nowD())}
function dayIso(o){var d=nowD();d.setHours(12,0,0,0);d.setDate(d.getDate()+o);return D.iso(d)}
function uid(p){return window.PL&&PL.uid?PL.uid(p):p+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function pl(n,s,p){return n+NB+(n>1?(p||s+'s'):s)}
function dehors(n){return n?pl(n,'cheval dehors','chevaux dehors'):'aucun cheval dehors'}
function fn(h){return h?String(h.name).split(' ')[0]:''}
function cap1(s){s=String(s||'');return s.charAt(0).toUpperCase()+s.slice(1)}
function on(root,sel,fn2,ev){root.addEventListener(ev||'click',function(e){var t=e.target.closest(sel);if(t&&root.contains(t))fn2(t,e)})}
function sexL(h){return h.sex==='Jument'?'J':h.sex==='Étalon'?'É':'H'}
function sexW(h){return h.sex==='Jument'?'jument':h.sex==='Étalon'?'étalon':'hongre'}
function list(a){a=a.filter(Boolean);return a.length<2?(a[0]||''):a.slice(0,-1).join(', ')+' et '+a[a.length-1]}
function arenaName(id){var a=(D.club.arenas||[]).find(function(x){return x.id===id});return a?a.name:''}
function dowToday(){return nowD().getDay()}
function vib(ms){try{if(navigator.vibrate)navigator.vibrate(ms)}catch(e){}}
function first(id){var p=D.person(id);return p?p.first:''}

/* ---------- Collections et persistance ---------- */
var COLLS=['pastures','pastureMoves','pastureRules','horseCues','horseAds','horseLeads','horseTrials','lessonCalls','lessonCredits'];
COLLS.forEach(function(k){if(!Array.isArray(D[k]))D[k]=D[k]||[]});
/* Dans l'appli, ces collections partent au serveur par le magasin générique. Tant que le serveur ne les connaît pas,
   une copie reste sur l'appareil pour ne rien perdre (hors connexion ou rechargement). */
function skey(){return 'terrain:'+((D.club&&D.club.id)||'local')}
function persist(){if(!LIVE)return;var o={};COLLS.forEach(function(k){o[k]=D[k]});P.store.set(skey(),o)}
var restored=false;
function ensure(){COLLS.forEach(function(k){if(!Array.isArray(D[k]))D[k]=[]});
  if(LIVE&&!restored){restored=true;var o=P.store.get(skey(),null);if(o)COLLS.forEach(function(k){if(Array.isArray(o[k])&&!D[k].length)o[k].forEach(function(x){D[k].push(x)})})}
  if(!D.pastures.length&&LIVE)(D.club.paddocks||[]).forEach(function(n,i){D.pastures.push({id:uid('pr'),n:i+1,name:n,ha:null,cap:6,grass:'bonne',cm:null,group:'Mixte',water:'',fence:'',grazed:0,rest:null})})}

/* ---------- Données de démonstration ---------- */
if(DEMO&&!D.pastures.length){
  var PN=D.club.paddocks||[];
  var pn=function(i,d){return PN[i]||d};
  D.pastures.push(
   {id:'pr1',n:1,name:pn(0,'Prairie du bas'),ha:2.4,cap:8,grass:'bonne',cm:9,group:'Hongres',water:'Abreuvoir automatique',fence:'Clôture électrique',grazed:12,rest:null,map:[2,52,34,44]},
   {id:'pr2',n:2,name:pn(1,'Paddock des poneys'),ha:.8,cap:6,grass:'moyenne',cm:6,group:'Poneys',water:'Abreuvoir automatique',fence:'Lisses en bois',grazed:5,rest:null,map:[64,64,34,32]},
   {id:'pr3',n:3,name:pn(2,'Paddock d’hiver'),ha:1.2,cap:8,grass:'rase',cm:3,group:'Mixte',water:'Bac rempli à la main',fence:'Lisses en bois',grazed:31,rest:null,note:'Sol stabilisé, praticable sous la pluie.',map:[38,64,24,32]},
   {id:'pr4',n:4,name:pn(3,'Prairie du haut'),ha:3.1,cap:10,grass:'bonne',cm:11,group:'Juments',water:'Abreuvoir automatique',fence:'Clôture électrique',grazed:2,rest:null,map:[2,4,34,44]},
   {id:'pr5',n:5,name:pn(4,'Paddock de soins'),ha:.15,cap:3,grass:'rase',cm:2,group:'Individuel',water:'Seau par enclos',fence:'Lisses en bois',grazed:0,rest:null,note:'Trois enclos individuels à côté des boxes.',map:[64,42,10,18]},
   {id:'pr6',n:6,name:pn(5,'Parcours de cross'),ha:4,cap:10,grass:'repos',cm:7,group:'Mixte',water:'Rivière',fence:'Clôture électrique',grazed:0,rest:'2027-03-15',note:'Au repos pour l’hiver, sursemé le 4 novembre.',map:[38,4,60,32]});
  var T=today(),mv=function(h,pr,slot,out,o){var x={id:'mv-'+slot+'-'+h,date:T,slot:slot,horse:h,pasture:pr,out:out||null,back:null,by:out?'s06':null};if(o)Object.keys(o).forEach(function(k){x[k]=o[k]});D.pastureMoves.push(x)};
  /* chaque cheval va dans le pré qui lui convient (sexe, poney, étalon) ; quelques placements imposés pour la démonstration */
  var seat=function(list,slot,force,outs){var n={};D.pastures.forEach(function(p){n[p.id]=0});D.pastureMoves.forEach(function(m){if(m.slot===slot&&m.date===T)n[m.pasture]++});
    list.forEach(function(hid,i){var h=D.horse(hid);if(!h)return;var to=force[hid];
      if(!to){var pref=h.sex==='Étalon'?['pr5','pr3']:h.pony?['pr2','pr3']:h.sex==='Jument'?['pr4','pr3']:['pr1','pr3'];to=pref.find(function(id){var p=D.pastures.find(function(x){return x.id===id});return p&&n[id]<p.cap})||'pr3'}
      n[to]++;mv(hid,to,slot,outs?outs[i%outs.length]:null)})};
  /* matin : sortis par Lucie entre 8 h 15 et 8 h 30 */
  mv('h01','pr1','am','08:30');
  seat(['h19','h14','h11','h07','h26','h34','h03','h39','h36','h15','h10','h20','h30'],'am',{},['08:15','08:20','08:25']);
  /* après-midi : prévu, pas encore sorti ; Quiétude et Sirius ensemble pour montrer l'alerte */
  seat(['h02','h05','h25','h35','h38','h21','h28','h42','h17','h12','h06','h09'],'pm',{h02:'pr3',h05:'pr3',h06:'pr5'});
  /* l'historique d'Ulysse, vu par sa propriétaire */
  [[-1,'08:30','10:40','pr1'],[-2,'08:30','11:55','pr1'],[-3,'13:00','16:30','pr4'],[-4,null,null,null],[-5,'08:30','11:50','pr1'],[-6,'08:30','12:00','pr1']].forEach(function(r){if(!r[1])return;
    D.pastureMoves.push({id:'mv-h01'+r[0],date:dayIso(r[0]),slot:mm(r[1])<720?'am':'pm',horse:'h01',pasture:r[3],out:r[1],back:r[2],by:'s06'})});
  D.pastureRules.push(
   {id:'ru1',a:'h02',b:'h05',k:'apart',why:'Se battent à l’abreuvoir'},
   {id:'ru2',a:'h01',b:'h19',k:'friends',why:'Ulysse se calme avec Saphir'},
   {id:'ru3',a:'h26',b:'h34',k:'friends',why:'Toujours ensemble depuis le poulinage'},
   {id:'ru4',a:'h21',b:'h44',k:'apart',why:'Uranus mord Talisman'});
  /* cohérence : les autres écrans lisent h.paddock (pré habituel) */
  D.pastureMoves.forEach(function(m){if(m.date!==T)return;var h=D.horse(m.horse),pr=D.pastures.find(function(p){return p.id===m.pasture});if(h&&pr)h.paddock=pr.name});
  D.horseCues.push(
   {id:'cu1',horse:'h13',text:'Sensible du dos : longue détente au pas, pas de trot assis',k:'warn'},
   {id:'cu2',horse:'h16',text:'Perd du poids : séance légère, pas plus de 45 min',k:'warn'},
   {id:'cu3',horse:'h19',text:'Tire au montoir : tenir la sangle, monter du montoir',k:''},
   {id:'cu4',horse:'h02',text:'Peur des bâches au fond de la carrière',k:''},
   {id:'cu5',horse:'h01',text:'Ferrure jeudi : pas de saut avant',k:'warn'},
   {id:'cu6',horse:'h17',text:'Déferré du postérieur droit : pas de galop sur le dur',k:'bad'});
}
if(DEMO&&!D.horseAds.length){
  D.horseAds.push(
   {id:'ad1',horse:'h17',price:6500,status:'en ligne',since:dayIso(-12),views:412,week:[38,42,51,47,66,72,96],seller:'club',health:true,results:true,vet:true,photos:[{t:'hz'},{t:'ex'},{t:'po'}],
    text:'Quartz est un hongre de 12 ans, très régulier, qui a fait toutes les reprises du club. Caractère volontaire, franc à l’abord des barres. Convient à un cavalier de niveau Galop 4 à 6. Vacciné, vermifugé et suivi par le même maréchal : carnet de santé à jour. Vendu par le club, qui renouvelle sa cavalerie. Essai possible sur place, visite vétérinaire d’achat à la charge de l’acheteur.'},
   {id:'ad2',horse:'h25',price:9800,status:'sous option',since:dayIso(-26),views:688,week:[61,58,70,64,59,77,88],seller:'m120',fee:5,health:true,results:true,vet:true,photos:[{t:'ex'},{t:'hz'}],
    text:'Yuma est un hongre de 14 ans, généreux et régulier au travail. Il a tourné en Club 1 et Amateur 3 avec sa propriétaire. Pour un cavalier de niveau Galop 6 à 7 qui veut sortir en concours. Carnet de santé à jour, visite d’achat récente disponible.'},
   {id:'ad3',horse:'h13',price:7200,status:'brouillon',since:dayIso(0),views:0,week:[0,0,0,0,0,0,0],seller:'club',health:true,results:false,vet:false,photos:[{t:'po'}],text:''});
  D.horseLeads.push(
   {id:'ld1',ad:'ad1',name:'Sophie Marchand',email:'sophie.marchand@exemple.fr',phone:'06 41 22 87 10',level:'Galop 5',budget:7000,at:dayIso(0)+'T08:12',status:'nouvelle',msg:'Bonjour, je cherche un cheval pour ma fille de 15 ans, Galop 5. Quartz est-il facile en extérieur ? Pourrions-nous l’essayer samedi matin ?'},
   {id:'ld2',ad:'ad1',name:'Julien Bertin',email:'julien.bertin@exemple.fr',phone:'06 72 15 44 03',level:'Amateur 3',budget:6500,at:dayIso(-1)+'T19:40',status:'répondue',msg:'Bonjour, a-t-il déjà tourné en concours ? Sur quelle hauteur ?'},
   {id:'ld3',ad:'ad2',name:'Camille Roy',email:'camille.roy@exemple.fr',phone:'06 18 90 32 57',level:'Galop 7',budget:10000,at:dayIso(-6)+'T10:05',status:'offre',offer:9500,msg:'Bonjour, Yuma correspond exactement à ce que je cherche pour passer en Amateur. Disponible pour un essai cette semaine.'},
   {id:'ld4',ad:'ad1',name:'Nadia Benali',email:'nadia.benali@exemple.fr',phone:'06 55 03 71 28',level:'Galop 4',budget:7000,at:dayIso(-2)+'T21:18',status:'essai prévu',msg:'Bonsoir, je reprends l’équitation après une pause. Quartz a l’air rassurant. Puis-je venir le voir ?'},
   {id:'ld5',ad:'ad2',name:'Pierre Lucas',email:'pierre.lucas@exemple.fr',phone:'06 09 66 14 92',level:'Galop 6',budget:9000,at:dayIso(0)+'T07:31',status:'nouvelle',msg:'Bonjour, le prix est-il discutable ? Je peux me déplacer dimanche.'});
  D.horseTrials.push(
   {id:'tr1',ad:'ad1',lead:'ld4',date:dayIso(1),time:'14:00',arena:'a2',with:'s02',status:'prévu'},
   {id:'tr2',ad:'ad2',lead:'ld3',date:dayIso(-3),time:'10:00',arena:'a1',with:'s04',status:'fait',note:'Très bon feeling, offre à 9 500 € le soir même.'});
}

/* =====================================================================
   Réseau : capsule « hors connexion » commune aux écrans de terrain
   ===================================================================== */
var NET={sim:false,q:0};
function isOff(){return NET.sim||navigator.onLine===false||!!(window.PL&&PL.sync&&PL.sync.state==='offline')}
function waiting(){return NET.q+(window.PL&&PL.sync&&PL.sync.pending?PL.sync.pending():0)}
function netHtml(){var off=isOff(),n=waiting();
  return '<button class="tr-net'+(off?' off':'')+'" data-net title="Fonctionnement sans réseau">'+ICON(off?'wifi':'checkc','sm')+'<span>'+(off?'Hors connexion'+(n?' · '+pl(n,'geste')+' gardé'+(n>1?'s':'')+' sur l’appareil':' · tout marche ici'):'À jour')+'</span></button>'}
function netRefresh(){$$('.tr-net').forEach(function(b){b.outerHTML=netHtml()})}
function saved(){if(isOff())NET.q++;persist();netRefresh()}
window.addEventListener('online',netRefresh);window.addEventListener('offline',netRefresh);
function netSheet(){var sh=P.sheet({title:'Sans réseau',icon:'wifi',body:function(b){
  b.innerHTML='<div class="stack" style="--g:16px"><p class="tr-p">Au fond des prés ou dans la carrière, le wifi ne passe pas toujours. Ces écrans continuent de marcher : chaque geste est gardé sur l’appareil, puis envoyé tout seul dès que le réseau revient.</p>'+
   '<div class="card flat"><div class="ch"><h3>Marche sans réseau</h3></div><div class="cb tr-wk">'+[['paddock','Sorties et rentrées au pré'],['check','Appel de la reprise'],['stopwatch','Chronomètre et minuteur'],['edit','Notes de fin de cours'],['info','Consignes des chevaux']].map(function(x){return '<span>'+ICON(x[0],'sm')+x[1]+'</span>'}).join('')+'</div></div>'+
   '<div class="card flat"><div class="ch"><h3>Attend le retour du réseau</h3></div><div class="cb tr-wk mut">'+[['mail','E-mails et SMS aux familles'],['card','Paiements en ligne'],['refresh','Ce que les autres appareils ont changé']].map(function(x){return '<span>'+ICON(x[0],'sm')+x[1]+'</span>'}).join('')+'</div></div>'+
   '<div class="note">'+ICON('info','sm')+'<span>Sur iPad ou iPhone, ajoutez Stabl à l’écran d’accueil : l’appli s’ouvre même sans réseau.</span></div></div>'},
  foot:'<button class="btn pri block" data-cut>'+ICON(NET.sim?'refresh':'wifi','sm')+(NET.sim?'Rétablir le réseau':'Tester une coupure')+'</button>'});
  $('[data-cut]',sh).onclick=function(){sh.close();NET.sim=!NET.sim;
    if(!NET.sim&&NET.q){var n=NET.q;P.toast('Réseau revenu : '+pl(n,'geste')+' envoyé'+(n>1?'s':''),{icon:'refresh'});NET.q=0}
    else P.toast(NET.sim?'Coupure simulée : continuez, tout est gardé sur l’appareil':'Réseau rétabli',{icon:'wifi'});netRefresh()}}
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-net]');if(b)netSheet()});

/* =====================================================================
   1 · PRÉS ET PADDOCKS
   ===================================================================== */
var SLOTS={am:{l:'Matin',from:'08:30',to:'12:00'},pm:{l:'Après-midi',from:'13:00',to:'16:30'}};
var GRASS={bonne:['Herbe bonne','ok'],moyenne:['Herbe moyenne','warn'],rase:['Herbe rase','bad'],repos:['Au repos','']};
var GROUPS=['Hongres','Juments','Mixte','Poneys','Individuel'];
function curSlot(){return nowMin()<12*60+30?'am':'pm'}
function pasture(id){return D.pastures.find(function(p){return p.id===id})}
function movesOf(slot,date){date=date||today();return D.pastureMoves.filter(function(m){return m.date===date&&m.slot===slot})}
function moveOf(hid,slot){return movesOf(slot).find(function(m){return m.horse===hid})}
function inP(pid,slot){return movesOf(slot).filter(function(m){return m.pasture===pid}).map(function(m){return D.horse(m.horse)}).filter(Boolean)}
function resting(p){return p.grass==='repos'||!!(p.rest&&p.rest>today())}
function rule(a,b){return D.pastureRules.find(function(r){return (r.a===a&&r.b===b)||(r.a===b&&r.b===a)})}
function friendsOf(hid){return D.pastureRules.filter(function(r){return r.k==='friends'&&(r.a===hid||r.b===hid)}).map(function(r){return r.a===hid?r.b:r.a})}
/* reprises du jour où travaille le cheval */
function works(hid){return (D.lessons||[]).filter(function(l){return l.dow===dowToday()&&l.horses&&Object.keys(l.horses).some(function(r){return l.horses[r]===hid})}).map(function(l){return {at:l.start,title:l.title}}).sort(function(a,b){return mm(a.at)-mm(b.at)})}
function clash(m){if(!m)return null;var s=SLOTS[m.slot],end=mm(m.back||m.plan||s.to),st=mm(m.out||s.from);
  return works(m.horse).filter(function(w){var t=mm(w.at);return t>=st&&t<end+15})[0]||null}
function fits(h,p){var g=p.group;if(g==='Juments')return h.sex==='Jument';if(g==='Hongres')return h.sex==='Hongre';if(g==='Poneys')return !!h.pony;return true}
/* tous les points à régler pour un créneau */
function conflicts(slot){var out=[],ms=movesOf(slot);
  D.pastures.forEach(function(p){var hs=inP(p.id,slot);if(!hs.length)return;
    if(resting(p))out.push({p:p.id,k:'bad',t:p.name+' est au repos'+(p.rest?' jusqu’au '+F.date(p.rest):'')+' : '+pl(hs.length,'cheval','chevaux')+' à déplacer',hs:hs.map(function(h){return h.id})});
    if(hs.length>p.cap)out.push({p:p.id,k:'bad',t:p.name+' : '+hs.length+' chevaux pour '+p.cap+' places',hs:[]});
    hs.forEach(function(h,i){
      if(!fits(h,p))out.push({p:p.id,k:'warn',t:fn(h)+' ('+sexW(h)+(h.pony?', poney':'')+') dans un pré « '+p.group.toLowerCase()+' »',hs:[h.id]});
      hs.slice(i+1).forEach(function(o){var r=rule(h.id,o.id);if(r&&r.k==='apart')out.push({p:p.id,k:'bad',t:fn(h)+' et '+fn(o)+' ensemble : '+r.why.charAt(0).toLowerCase()+r.why.slice(1),hs:[h.id,o.id]});
        if((h.sex==='Étalon'&&o.sex==='Jument')||(o.sex==='Étalon'&&h.sex==='Jument'))if(p.group!=='Individuel')out.push({p:p.id,k:'bad',t:'Étalon et jument ensemble : '+fn(h)+' et '+fn(o),hs:[h.id,o.id]})})});
  });
  ms.forEach(function(m){var h=D.horse(m.horse);if(!h)return;
    if(h.status==='bad')out.push({p:m.pasture,k:'bad',t:fn(h)+' doit rester au box : '+String(h.alerts[0]||'alerte en cours').toLowerCase(),hs:[h.id]});
    var w=clash(m);if(w&&!m.back)out.push({p:m.pasture,k:'warn',t:fn(h)+' travaille à '+hm(w.at)+' ('+w.title+') : à rentrer à '+hm(fromMin(mm(w.at)-15)),hs:[h.id],fix:{move:m.id,plan:fromMin(mm(w.at)-15)}})});
  return out}
function slotOut(slot){return movesOf(slot).filter(function(m){return m.out&&!m.back}).length}

/* ---------- Plan des parcelles (HTML, le texte reste lisible) ---------- */
function mapBox(p,i,n){if(Array.isArray(p.map))return p.map;var cols=Math.ceil(Math.sqrt(n)),r=Math.floor(i/cols),c=i%cols,rows=Math.ceil(n/cols);return [2+c*(96/cols),4+r*(92/rows),96/cols-3,92/rows-4]}
function mapHtml(slot,hi){var ps=D.pastures,demo=ps.some(function(p){return Array.isArray(p.map)});
  return '<div class="tr-map" role="img" aria-label="Plan des prés">'+(demo?'<div class="tr-bld" style="left:38%;top:40%;width:24%;height:20%">'+ICON('stable','sm')+'<span>Écuries</span></div><div class="tr-bld ar" style="left:76%;top:40%;width:22%;height:22%">'+ICON('arena','sm')+'<span>Carrière</span></div>':'')+
   ps.map(function(p,i){var b=mapBox(p,i,ps.length),hs=inP(p.id,slot),g=GRASS[resting(p)?'repos':p.grass]||GRASS.bonne,small=b[2]<14||b[3]<22;
    return '<button class="tr-plot'+(small?' sm':'')+' g-'+(resting(p)?'repos':p.grass)+(hi&&hi!==p.id?' dim':'')+(hi===p.id?' hi':'')+'" data-plot="'+p.id+'" style="left:'+b[0]+'%;top:'+b[1]+'%;width:'+b[2]+'%;height:'+b[3]+'%" title="'+E(p.name+' · '+g[0])+'">'+
     '<span class="tr-pn">'+p.n+'</span>'+(small?'':'<span class="tr-pl">'+E(p.name)+'</span>')+
     '<span class="tr-dots">'+hs.slice(0,10).map(function(h){return '<i style="--c:'+h.color+'" title="'+E(h.name)+'"></i>'}).join('')+'</span></button>'}).join('')+'</div>'}

/* ---------- Puce de cheval, déplaçable ---------- */
function hchip(h,slot,o){o=o||{};var m=moveOf(h.id,slot),bad=o.bad&&o.bad[h.id];
  return '<button class="tr-hc'+(bad?' '+bad:'')+(m&&m.out&&!m.back?' out':'')+'" data-hz="'+h.id+'" title="'+E(h.name+' · '+h.sex+(h.pony?', poney':'')+' · '+h.age+' ans')+'"><i style="--c:'+h.color+'"></i><span>'+E(fn(h))+'</span><small>'+sexL(h)+'</small></button>'}

/* ---------- Écran du gérant ---------- */
var PR={slot:null};
function badHorses(cs){var m={};cs.forEach(function(c){c.hs.forEach(function(h){if(!m[h]||c.k==='bad')m[h]=c.k})});return m}
function prRender(el,ctx){ensure();if(!PR.slot)PR.slot=curSlot();
  /* glisser-déposer : souris et stylet partout, doigt sur tablette ; au téléphone, un appui ouvre le choix du pré */
  var drag=null;
  function draw(flip){var before=flip?rects():null,slot=PR.slot,cs=conflicts(slot),bad=badHorses(cs),out=slotOut(slot),open=D.pastures.filter(function(p){return !resting(p)}).length,rest=D.pastures.length-open;
    var placed={};movesOf(slot).forEach(function(m){placed[m.horse]=1});
    var pool=D.horses.filter(function(h){return !placed[h.id]});
    el.innerHTML=U.ph('Prés et paddocks',cap1(dehors(out))+' en ce moment · '+pl(open,'pré ouvert','prés ouverts')+(rest?' · '+rest+' au repos':''),
      U.seg([['am','Matin'],['pm','Après-midi']],slot,'data-slot')+'<button class="btn" data-addp>'+ICON('plus','sm')+'Ajouter un pré</button><button class="btn pri" data-gen>'+ICON('spark','sm')+'Proposer avec Stabl AI</button>')+
     (cs.length?'<div class="tr-alerts rise">'+cs.slice(0,4).map(function(c,i){return '<div class="note '+(c.k==='bad'?'bad':'warn')+'">'+ICON('alert','sm')+'<span class="grow">'+E(c.t)+'</span>'+(c.fix?'<button class="btn sm" data-fix="'+i+'">Prévoir la rentrée à '+hm(c.fix.plan)+'</button>':'')+'</div>'}).join('')+(cs.length>4?'<div class="xs mut">Et '+pl(cs.length-4,'autre point')+' à régler, signalés sur les prés.</div>':'')+'</div>':
       '<div class="note ok tr-allok">'+ICON('checkc','sm')+'<span>'+SLOTS[slot].l+' : aucun conflit. Places, compatibilités et reprises du jour sont respectées.</span></div>')+
     '<div class="tr-top"><div class="card tr-mapc"><div class="ch"><h3>Plan</h3><span class="xs mut">'+SLOTS[slot].l+' · '+hm(SLOTS[slot].from)+' à '+hm(SLOTS[slot].to)+'</span></div><div class="cb">'+mapHtml(slot)+'<div class="tr-leg">'+['bonne','moyenne','rase','repos'].map(function(g){return '<span><i class="g-'+g+'"></i>'+GRASS[g][0]+'</span>'}).join('')+'</div></div></div>'+
      '<div class="card tr-rot"><div class="ch"><h3>Rotation et herbe</h3></div><div class="cb">'+rotHtml()+'</div></div></div>'+
     '<div class="tr-sech"><h2>Qui sort où</h2><span class="s mut">'+(ctx.mobile?'Touchez un cheval pour choisir son pré.':'Glissez un cheval d’un pré à l’autre, ou touchez-le pour choisir.')+'</span></div>'+
     '<div class="tr-board">'+D.pastures.map(function(p){var hs=inP(p.id,slot),r=resting(p),g=GRASS[r?'repos':p.grass]||GRASS.bonne,mine=cs.filter(function(c){return c.p===p.id}),pct=p.cap?Math.min(100,hs.length/p.cap*100):0;
        return '<section class="card tr-pc'+(r?' rest':'')+'" data-drop="'+p.id+'"><header><span class="tr-pn">'+p.n+'</span><div class="grow"><button class="tr-pt" data-pedit="'+p.id+'">'+E(p.name)+'</button><div class="xs mut">'+[p.ha?String(p.ha).replace('.',',')+NB+'ha':'',p.group].filter(Boolean).join(' · ')+'</div></div><button class="btn ghost icon sm" data-pedit="'+p.id+'" title="Modifier le pré">'+ICON('edit','sm')+'</button></header>'+
          '<div class="tr-cap"><span class="num"><b>'+hs.length+'</b> / '+p.cap+'</span>'+U.bar(pct,hs.length>p.cap?'var(--bad)':pct>=80?'var(--warn)':'var(--hz)')+U.chip(g[0],g[1],true)+'</div>'+
          '<div class="tr-hs">'+(hs.length?hs.map(function(h){return hchip(h,slot,{bad:bad})}).join(''):'<span class="tr-none">'+(r?'Au repos'+(p.rest?' jusqu’au '+F.date(p.rest):''):'Déposez un cheval ici')+'</span>')+'</div>'+
          (mine.length?'<div class="tr-pw">'+mine.slice(0,2).map(function(c){return '<span class="'+c.k+'">'+ICON('alert','sm')+E(c.t)+'</span>'}).join('')+'</div>':'')+'</section>'}).join('')+
       '<section class="card tr-pc pool" data-drop="box"><header><span class="tr-pn">'+ICON('stable','sm')+'</span><div class="grow"><b class="tr-pt0">Au box</b><div class="xs mut">'+pl(pool.length,'cheval','chevaux')+' sans sortie '+(slot==='am'?'ce matin':'cet après-midi')+'</div></div></header><div class="tr-hs">'+pool.map(function(h){return hchip(h,slot)}).join('')+'</div></section></div>'+
     '<div class="tr-sech"><h2>Qui s’entend avec qui</h2><button class="btn sm" data-addr>'+ICON('plus','sm')+'Ajouter une règle</button></div>'+
     '<div class="card list tr-rules">'+(D.pastureRules.length?D.pastureRules.map(function(r){var a=D.horse(r.a),b=D.horse(r.b);if(!a||!b)return '';
        return '<div class="li"><span class="ico sm '+(r.k==='apart'?'d-cr':'d-hz')+'">'+ICON(r.k==='apart'?'xc':'heart','sm')+'</span><div class="grow"><div class="t"><b>'+E(fn(a))+'</b> et <b>'+E(fn(b))+'</b> '+(r.k==='apart'?'à séparer':'s’entendent bien')+'</div><div class="s mut">'+E(r.why||'')+'</div></div><button class="btn ghost icon sm" data-delr="'+r.id+'" title="Supprimer la règle">'+ICON('trash','sm')+'</button></div>'}).join(''):U.empty('heart','Aucune règle','Notez les chevaux à séparer et ceux qui se calment ensemble.'))+
      '<div class="li tr-auto"><span class="ico sm d-acc">'+ICON('shield','sm')+'</span><div class="grow"><div class="t">Règles appliquées d’office</div><div class="s mut">Jamais d’étalon avec une jument, un cheval en alerte reste au box, un pré au repos reste fermé, chaque cheval rentre 15 minutes avant sa reprise.</div></div></div></div>';
    P.animate(el);if(before)flipFrom(before)}
  function rects(){var m={};$$('[data-hz]',el).forEach(function(b){m[b.getAttribute('data-hz')]=b.getBoundingClientRect()});return m}
  function flipFrom(b){if(P.RM)return;$$('[data-hz]',el).forEach(function(n){var r0=b[n.getAttribute('data-hz')];if(!r0)return;var r1=n.getBoundingClientRect(),dx=r0.left-r1.left,dy=r0.top-r1.top;if(!dx&&!dy)return;
    n.animate([{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'none'}],{duration:560,easing:'cubic-bezier(.3,1.2,.4,1)'})})}
  function place(hid,pid,quiet){var slot=PR.slot,m=moveOf(hid,slot),h=D.horse(hid),p=pasture(pid);
    if(pid==='box'){if(!m)return;var i=D.pastureMoves.indexOf(m);D.pastureMoves.splice(i,1);draw(true);saved();if(!quiet)P.toast(fn(h)+' reste au box '+(slot==='am'?'ce matin':'cet après-midi'),{icon:'stable',undo:function(){D.pastureMoves.splice(i,0,m);draw(true)}});return}
    if(m&&m.pasture===pid)return;
    var prev=m?m.pasture:null;
    if(m)m.pasture=pid;else{m={id:uid('mv'),date:today(),slot:slot,horse:hid,pasture:pid,out:null,back:null,by:null};D.pastureMoves.push(m)}
    draw(true);saved();
    if(!quiet){var c=conflicts(slot).filter(function(x){return x.hs.indexOf(hid)>=0})[0];
      P.toast(c?E(c.t):fn(h)+' ira au pré n°'+NB+p.n+', '+E(p.name),{icon:c?'alert':'paddock',undo:function(){if(prev)m.pasture=prev;else D.pastureMoves.splice(D.pastureMoves.indexOf(m),1);draw(true)}})}}
  function pick(hid){var h=D.horse(hid),slot=PR.slot,m=moveOf(hid,slot);
    var sh=P.sheet({title:'Où va '+E(fn(h))+' ?',icon:'paddock',body:'<div class="tr-who">'+U.hav(h)+'<div><b>'+E(h.name)+'</b><div class="s mut">'+E(h.sex+(h.pony?', poney':'')+' · '+h.age+' ans · '+(h.level||''))+'</div></div></div>'+
      (works(hid).length?'<div class="note warn" style="margin-bottom:12px">'+ICON('whistle','sm')+'<span>Travaille aujourd’hui à '+list(works(hid).map(function(w){return hm(w.at)}))+'.</span></div>':'')+
      '<div class="tr-opts">'+D.pastures.map(function(p){var n=inP(p.id,slot).filter(function(x){return x.id!==hid}).length,r=resting(p),why=r?'Au repos':!fits(h,p)?'Pré « '+p.group.toLowerCase()+' »':n>=p.cap?'Complet':'';
        var enemy=inP(p.id,slot).filter(function(x){var ru=rule(hid,x.id);return ru&&ru.k==='apart'})[0];if(enemy)why='Avec '+fn(enemy)+', à séparer';
        return '<button class="tr-opt'+(m&&m.pasture===p.id?' sel':'')+(why?' no':'')+'" data-to="'+p.id+'"><span class="tr-pn">'+p.n+'</span><span class="grow"><b>'+E(p.name)+'</b><small>'+n+' / '+p.cap+(why?' · '+why:'')+'</small></span>'+(m&&m.pasture===p.id?ICON('check'):'')+'</button>'}).join('')+
      '<button class="tr-opt" data-to="box"><span class="tr-pn">'+ICON('stable','sm')+'</span><span class="grow"><b>Reste au box</b><small>Pas de sortie '+(slot==='am'?'ce matin':'cet après-midi')+'</small></span>'+(!m?ICON('check'):'')+'</button></div>'});
    on(sh,'[data-to]',function(b){sh.close();place(hid,b.getAttribute('data-to'))})}
  /* ----- glisser-déposer ----- */
  el.addEventListener('pointerdown',function(e){var c=e.target.closest('[data-hz]');if(!c||!el.contains(c)||e.button>0)return;if(ctx.mobile&&e.pointerType==='touch')return;
    drag={c:c,id:c.getAttribute('data-hz'),x:e.clientX,y:e.clientY,on:false,pid:e.pointerId}});
  el.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-drag.x,dy=e.clientY-drag.y;
    if(!drag.on){if(Math.abs(dx)+Math.abs(dy)<6)return;drag.on=true;var r=drag.c.getBoundingClientRect();drag.ox=e.clientX-r.left;drag.oy=e.clientY-r.top;
      var g=drag.c.cloneNode(true);g.className+=' tr-ghost';g.style.width=r.width+'px';document.body.appendChild(g);drag.g=g;drag.c.classList.add('lift');try{drag.c.setPointerCapture(drag.pid)}catch(x){}}
    drag.g.style.transform='translate('+(e.clientX-drag.ox)+'px,'+(e.clientY-drag.oy)+'px) rotate(-3deg)';
    var t=document.elementFromPoint(e.clientX,e.clientY),z=t&&t.closest&&t.closest('[data-drop]');$$('.tr-over',el).forEach(function(x){if(x!==z)x.classList.remove('tr-over')});if(z&&el.contains(z))z.classList.add('tr-over');e.preventDefault()});
  function end(e){if(!drag)return;var d=drag;drag=null;if(!d.on)return;if(d.g)d.g.remove();d.c.classList.remove('lift');$$('.tr-over',el).forEach(function(x){x.classList.remove('tr-over')});
    var t=document.elementFromPoint(e.clientX,e.clientY),z=t&&t.closest&&t.closest('[data-drop]');d.moved=true;el._noclick=Date.now();if(z&&el.contains(z))place(d.id,z.getAttribute('data-drop'))}
  el.addEventListener('pointerup',end);el.addEventListener('pointercancel',function(){if(drag&&drag.g)drag.g.remove();if(drag)drag.c.classList.remove('lift');drag=null});
  /* ----- actions ----- */
  on(el,'[data-hz]',function(b){if(el._noclick&&Date.now()-el._noclick<300)return;pick(b.getAttribute('data-hz'))});
  on(el,'[data-slot]',function(b){PR.slot=b.getAttribute('data-slot');draw()});
  on(el,'[data-fix]',function(b){var c=conflicts(PR.slot)[+b.getAttribute('data-fix')];if(!c||!c.fix)return;var m=D.pastureMoves.find(function(x){return x.id===c.fix.move});if(!m)return;m.plan=c.fix.plan;draw();saved();
    P.toast('Rentrée de '+fn(D.horse(m.horse))+' prévue à '+hm(c.fix.plan)+' : l’équipe la voit sur son téléphone',{icon:'clock'})});
  on(el,'[data-plot]',function(b){var p=pasture(b.getAttribute('data-plot'));var s=$('[data-drop="'+p.id+'"]',el);if(s){s.scrollIntoView({behavior:P.RM?'auto':'smooth',block:'center'});s.classList.remove('tr-flash');void s.offsetWidth;s.classList.add('tr-flash')}});
  on(el,'[data-pedit]',function(b){editPasture(b.getAttribute('data-pedit'),draw)});
  on(el,'[data-addp]',function(){editPasture(null,draw)});
  on(el,'[data-addr]',function(){addRule(draw)});
  on(el,'[data-delr]',function(b){var id=b.getAttribute('data-delr'),i=D.pastureRules.findIndex(function(r){return r.id===id});if(i<0)return;var r=D.pastureRules.splice(i,1)[0];draw();saved();P.toast('Règle supprimée',{icon:'trash',undo:function(){D.pastureRules.splice(i,0,r);draw()}})});
  on(el,'[data-gen]',function(){aiPlan(PR.slot,function(changes){changes.forEach(function(c){var m=moveOf(c.h,PR.slot);if(m)m.pasture=c.to;else D.pastureMoves.push({id:uid('mv'),date:today(),slot:PR.slot,horse:c.h,pasture:c.to,out:null,back:null,by:null})});draw(true);saved()})});
  on(el,'[data-rot]',function(b){var p=pasture(b.getAttribute('data-rot'));if(!p)return;
    if(resting(p)){p.grass=p.cm>=8?'bonne':'moyenne';p.rest=null;P.toast(p.name+' rouvert',{icon:'paddock'})}else{p.grass='repos';p.rest=dayIso(21);P.toast(p.name+' au repos jusqu’au '+F.date(p.rest)+' : les chevaux prévus sont signalés',{icon:'paddock'})}draw();saved()});
  draw()}

/* rotation : charge, jours de pâture, conseil */
function rotHtml(){var ps=D.pastures.slice().sort(function(a,b){return (b.grazed||0)-(a.grazed||0)});
  var tired=ps.filter(function(p){return !resting(p)&&(p.grazed||0)>=10&&p.grass!=='bonne'})[0]||ps.filter(function(p){return !resting(p)&&(p.grazed||0)>=10})[0],
      fresh=ps.filter(function(p){return !resting(p)&&p.grass==='bonne'&&(p.grazed||0)<6})[0];
  return '<div class="tr-rl">'+ps.map(function(p){var r=resting(p),g=GRASS[r?'repos':p.grass]||GRASS.bonne,load=p.ha?inP(p.id,PR.slot||'am').length/p.ha:0;
    return '<div class="tr-rr"><span class="tr-pn sm">'+p.n+'</span><div class="grow"><div class="b ellip">'+E(p.name)+'</div><div class="xs mut">'+(r?(p.rest?'Rouvre le '+F.date(p.rest):'Au repos'):(p.grazed?'Pâturé depuis '+pl(p.grazed,'jour'):'Repos terminé'))+(p.cm!=null?' · '+p.cm+NB+'cm':'')+(load?' · '+String(Math.round(load*10)/10).replace('.',',')+NB+(load>=2?'chevaux':'cheval')+'/ha':'')+'</div></div>'+
      '<span class="tr-grass g-'+(r?'repos':p.grass)+'" title="'+g[0]+'"><i style="--v:'+(r?100:p.grass==='bonne'?90:p.grass==='moyenne'?55:22)+'%"></i></span><button class="btn ghost sm" data-rot="'+p.id+'">'+(r?'Rouvrir':'Mettre au repos')+'</button></div>'}).join('')+'</div>'+
   (tired?'<div class="note tr-tip">'+ICON('spark','sm')+'<span><b>Stabl AI conseille</b> de mettre '+E(tired.name)+' au repos trois semaines ('+pl(tired.grazed,'jour')+' de pâture, herbe '+(GRASS[tired.grass]||GRASS.bonne)[0].replace('Herbe ','')+')'+(fresh?' et d’envoyer ses chevaux en '+E(fresh.name)+', qui a repoussé.':'.')+'</span></div>':'')}

/* proposition de Stabl AI : régler les conflits, puis sortir les chevaux disponibles */
function aiPlan(slot,apply){var ms=movesOf(slot),where={},count={};D.pastures.forEach(function(p){count[p.id]=0});ms.forEach(function(m){where[m.horse]=m.pasture;count[m.pasture]=(count[m.pasture]||0)+1});
  var changes=[];
  function ok(h,p){if(resting(p)||!fits(h,p)||count[p.id]>=p.cap)return false;var others=Object.keys(where).filter(function(x){return where[x]===p.id&&x!==h.id}).map(D.horse).filter(Boolean);
    return !others.some(function(o){var r=rule(h.id,o.id);if(r&&r.k==='apart')return true;if(p.group==='Individuel')return false;return (h.sex==='Étalon'&&o.sex==='Jument')||(o.sex==='Étalon'&&h.sex==='Jument')})}
  function score(h,p){var s=0;friendsOf(h.id).forEach(function(f){if(where[f]===p.id)s+=10});if(p.group==='Individuel')s+=h.sex==='Étalon'?8:-6;if(p.grass==='bonne')s+=3;if(p.grass==='rase')s-=2;if(p.group===(h.sex==='Jument'?'Juments':h.sex==='Hongre'?'Hongres':''))s+=4;if(h.pony&&p.group==='Poneys')s+=5;return s-count[p.id]*.3}
  function best(h){var c=D.pastures.filter(function(p){return ok(h,p)}).sort(function(a,b){return score(h,b)-score(h,a)});return c[0]||null}
  /* 1. ce qui pose problème */
  var cs=conflicts(slot),fixH=[];cs.forEach(function(c){if(c.fix)return;c.hs.slice(-1).forEach(function(h){if(fixH.indexOf(h)<0)fixH.push(h)})});
  fixH.forEach(function(hid){var h=D.horse(hid);if(!h)return;var from=where[hid];delete where[hid];if(from)count[from]--;
    if(h.status==='bad'){changes.push({h:hid,to:'box',why:'reste au box (alerte en cours)'});return}
    var p=best(h);if(p){where[hid]=p.id;count[p.id]++;changes.push({h:hid,to:p.id,why:'pour éviter le conflit'})}else{changes.push({h:hid,to:'box',why:'aucun pré compatible'})}});
  /* 2. les chevaux disponibles qui ne sortent pas */
  var other=slot==='am'?'pm':'am';D.horses.filter(function(h){return !where[h.id]&&!moveOf(h.id,other)&&fixH.indexOf(h.id)<0&&h.status!=='bad'&&!works(h.id).some(function(w){var t=mm(w.at);return t>=mm(SLOTS[slot].from)&&t<mm(SLOTS[slot].to)+15})})
   .sort(function(a,b){return friendsOf(b.id).length-friendsOf(a.id).length}).forEach(function(h){var p=best(h);if(p){where[h.id]=p.id;count[p.id]++;changes.push({h:h.id,to:p.id,why:friendsOf(h.id).some(function(f){return where[f]===p.id})?'avec '+list(friendsOf(h.id).filter(function(f){return where[f]===p.id}).map(function(f){return fn(D.horse(f))})):'ne sortait pas aujourd’hui'})}});
  var real=changes.filter(function(c){var m=moveOf(c.h,slot);return c.to==='box'?!!m:!(m&&m.pasture===c.to)});
  var sh=P.sheet({title:'Proposition de Stabl AI',icon:'spark',body:function(b){
    b.innerHTML=real.length?'<p class="tr-p">'+SLOTS[slot].l+' : '+pl(real.length,'changement')+' pour régler les conflits et sortir tous les chevaux disponibles, en respectant les places, les compatibilités et les reprises du jour.</p><div class="card list" style="margin-top:14px">'+real.map(function(c){var h=D.horse(c.h),p=pasture(c.to);
      return '<div class="li">'+U.hav(h)+'<div class="grow"><div class="t"><b>'+E(fn(h))+'</b> '+ICON('arrow','sm')+' '+(p?'Pré n°'+NB+p.n+', '+E(p.name):'Au box')+'</div>'+(c.why?'<div class="s mut">'+E(cap1(c.why))+'</div>':'')+'</div></div>'}).join('')+'</div>':
      U.empty('checkc','Rien à changer','Les sorties de '+(slot==='am'?'ce matin':'cet après-midi')+' sont déjà au mieux.')},
    foot:real.length?'<button class="btn ghost" data-x2>Garder mon plan</button><button class="btn pri" data-ok>'+ICON('check','sm')+'Appliquer les '+real.length+' changements</button>':''});
  var x2=$('[data-x2]',sh);if(x2)x2.onclick=function(){sh.close()};
  var okb=$('[data-ok]',sh);if(okb)okb.onclick=function(){sh.close();var undo=real.map(function(c){var m=moveOf(c.h,slot);return {h:c.h,m:m,was:m?m.pasture:null}});
    real.filter(function(c){return c.to==='box'}).forEach(function(c){var m=moveOf(c.h,slot);if(m)D.pastureMoves.splice(D.pastureMoves.indexOf(m),1)});
    apply(real.filter(function(c){return c.to!=='box'}));
    P.toast(pl(real.length,'changement')+' appliqué'+(real.length>1?'s':''),{icon:'spark',undo:function(){undo.forEach(function(u){var m=moveOf(u.h,slot);if(u.m){if(m)m.pasture=u.was;else D.pastureMoves.push(u.m)}else if(m)D.pastureMoves.splice(D.pastureMoves.indexOf(m),1)});P.rerender()}})}}

function editPasture(id,done){var p=id?pasture(id):null,isNew=!p;p=p||{id:uid('pr'),n:D.pastures.reduce(function(a,x){return Math.max(a,x.n||0)},0)+1,name:'',ha:null,cap:6,grass:'bonne',cm:null,group:'Mixte',water:'',fence:'',grazed:0,rest:null};
  var sh=P.sheet({title:isNew?'Ajouter un pré':E(p.name),icon:'paddock',body:'<div class="stack" style="--g:14px">'+
    '<div class="g2" style="--g:12px"><label class="field"><span>Nom</span><input class="in" data-f="name" value="'+E(p.name)+'" placeholder="Prairie du moulin"></label><label class="field"><span>Numéro</span><input class="in" data-f="n" type="number" min="1" value="'+(p.n||'')+'"></label></div>'+
    '<div class="g2" style="--g:12px"><label class="field"><span>Surface (ha)</span><input class="in" data-f="ha" inputmode="decimal" value="'+(p.ha!=null?String(p.ha).replace('.',','):'')+'"></label><label class="field"><span>Places</span><input class="in" data-f="cap" type="number" min="0" value="'+p.cap+'"></label></div>'+
    '<div class="field"><span>Qui y va</span>'+U.seg(GROUPS.map(function(g){return [g,g]}),p.group,'data-grp')+'</div>'+
    '<div class="field"><span>État de l’herbe</span>'+U.seg([['bonne','Bonne'],['moyenne','Moyenne'],['rase','Rase'],['repos','Au repos']],p.grass,'data-gr')+'</div>'+
    '<div class="g2" style="--g:12px"><label class="field"><span>Hauteur d’herbe (cm)</span><input class="in" data-f="cm" type="number" min="0" value="'+(p.cm!=null?p.cm:'')+'"></label><label class="field"><span>Eau</span><input class="in" data-f="water" value="'+E(p.water||'')+'" placeholder="Abreuvoir automatique"></label></div>'+
    '<label class="field"><span>Remarque</span><input class="in" data-f="note" value="'+E(p.note||'')+'" placeholder="Clôture à vérifier côté route"></label></div>',
    foot:(isNew?'':'<button class="btn ghost" data-del>'+ICON('trash','sm')+'Supprimer</button>')+'<button class="btn pri" data-save>'+ICON('check','sm')+(isNew?'Ajouter le pré':'Enregistrer')+'</button>'});
  var grp=p.group,gr=p.grass;on(sh,'[data-grp]',function(b){grp=b.getAttribute('data-grp')});on(sh,'[data-gr]',function(b){gr=b.getAttribute('data-gr')});
  $('[data-save]',sh).onclick=function(){var v=function(k){return $('[data-f="'+k+'"]',sh).value.trim()};if(!v('name')){$('[data-f="name"]',sh).focus();P.toast('Donnez un nom au pré',{icon:'info'});return}
    p.name=v('name');p.n=+v('n')||p.n;p.ha=v('ha')?+v('ha').replace(',','.')||null:null;p.cap=Math.max(0,+v('cap')||0);p.cm=v('cm')!==''?+v('cm'):null;p.water=v('water');p.note=v('note');p.group=grp;
    if(gr==='repos'&&p.grass!=='repos')p.rest=dayIso(21);if(gr!=='repos')p.rest=null;p.grass=gr;
    if(isNew)D.pastures.push(p);sh.close();done();saved();P.toast(isNew?'Pré ajouté : '+p.name:'Pré enregistré',{icon:'paddock'})};
  var dl=$('[data-del]',sh);if(dl)dl.onclick=function(){var i=D.pastures.indexOf(p),moved=D.pastureMoves.filter(function(m){return m.pasture===p.id&&m.date>=today()});D.pastures.splice(i,1);moved.forEach(function(m){D.pastureMoves.splice(D.pastureMoves.indexOf(m),1)});sh.close();done();saved();
    P.toast(p.name+' supprimé'+(moved.length?', '+pl(moved.length,'sortie')+' retirée'+(moved.length>1?'s':''):''),{icon:'trash',undo:function(){D.pastures.splice(i,0,p);moved.forEach(function(m){D.pastureMoves.push(m)});done()}})}}

function horseOptions(sel){return D.horses.slice().sort(function(a,b){return a.name.localeCompare(b.name,'fr')}).map(function(h){return '<option value="'+h.id+'"'+(h.id===sel?' selected':'')+'>'+E(h.name)+'</option>'}).join('')}
function addRule(done){var k='apart';
  var sh=P.sheet({title:'Ajouter une règle',icon:'heart',body:'<div class="stack" style="--g:14px"><div class="g2" style="--g:12px"><label class="field"><span>Premier cheval</span><select class="in" data-a>'+horseOptions('h01')+'</select></label><label class="field"><span>Second cheval</span><select class="in" data-b>'+horseOptions('h02')+'</select></label></div>'+
    '<div class="field"><span>Ensemble au pré</span>'+U.seg([['apart','À séparer'],['friends','S’entendent bien']],k,'data-k')+'</div><label class="field"><span>Pourquoi</span><input class="in" data-why placeholder="Se battent pour le foin"></label></div>',
    foot:'<button class="btn pri block" data-ok>'+ICON('check','sm')+'Ajouter la règle</button>'});
  on(sh,'[data-k]',function(b){k=b.getAttribute('data-k')});
  $('[data-ok]',sh).onclick=function(){var a=$('[data-a]',sh).value,b=$('[data-b]',sh).value;if(a===b){P.toast('Choisissez deux chevaux différents',{icon:'info'});return}
    var ex=rule(a,b);if(ex){ex.k=k;ex.why=$('[data-why]',sh).value.trim()}else D.pastureRules.push({id:uid('ru'),a:a,b:b,k:k,why:$('[data-why]',sh).value.trim()});
    sh.close();done();saved();P.toast('Règle ajoutée : Stabl AI la respecte dans ses propositions',{icon:'heart'})}}

/* ---------- Écran de l'employé : un geste par cheval ---------- */
var EP={slot:null};
function epRender(el,ctx){ensure();if(!EP.slot)EP.slot=curSlot();
  function state(m){var h=D.horse(m.horse),w=clash(m),t=nowMin();
    if(m.back)return {k:'back',t:'Rentré à '+hm(m.back)};
    if(m.out){var due=m.plan||(w?fromMin(mm(w.at)-15):null),late=due&&t>=mm(due)-5;return {k:'out',t:'Dehors depuis '+hm(m.out)+(due?' · rentrée à '+hm(due):''),late:late,due:due,why:m.why||(w?'Travaille à '+hm(w.at):'')}}
    if(h&&h.status==='bad')return {k:'stay',t:'Reste au box'};
    return {k:'todo',t:'À sortir à '+hm(SLOTS[m.slot].from)}}
  function draw(){var slot=EP.slot,ms=movesOf(slot),out=ms.filter(function(m){return m.out&&!m.back}).length,urg=ms.filter(function(m){var s=state(m);return s.late}),todo=ms.filter(function(m){return state(m).k==='todo'}).length;
    el.innerHTML='<div class="tr-eh">'+U.ph('Sorties au pré',cap1(dehors(out))+(todo?' · '+todo+' à sortir':'')+' · '+SLOTS[slot].l.toLowerCase()+' jusqu’à '+hm(SLOTS[slot].to))+netHtml()+'</div>'+
      '<div class="tr-eseg">'+U.seg([['am','Matin'],['pm','Après-midi']],slot,'data-slot')+'</div>'+
      (urg.length?'<div class="tr-urg rise">'+urg.map(function(m){var h=D.horse(m.horse),s=state(m);return '<button class="tr-ur" data-tog="'+m.id+'"><span class="tr-urb">'+ICON('alert')+'</span><span class="grow"><b>Rentrer '+E(fn(h))+' maintenant</b><small>'+E(s.why||'Rentrée prévue')+' · pré n°'+NB+(pasture(m.pasture)||{}).n+'</small></span><span class="tr-go">'+ICON('stable')+'</span></button>'}).join('')+'</div>':'')+
      D.pastures.map(function(p){var pm=ms.filter(function(m){return m.pasture===p.id});if(!pm.length)return '';var allOut=pm.every(function(m){return m.out&&!m.back}),anyOut=pm.some(function(m){return m.out&&!m.back});
        return '<section class="tr-es"><header><span class="tr-pn">'+p.n+'</span><div class="grow"><b>'+E(p.name)+'</b><small>'+pm.filter(function(m){return m.out&&!m.back}).length+' / '+pm.length+' dehors · '+(GRASS[resting(p)?'repos':p.grass]||GRASS.bonne)[0].toLowerCase()+(p.water?' · '+E(p.water.toLowerCase()):'')+'</small></div>'+
          '<button class="btn sm '+(anyOut?'':'pri')+'" data-all="'+p.id+'" data-dir="'+(anyOut?'in':'out')+'">'+ICON(anyOut?'stable':'paddock','sm')+(anyOut?'Tout rentrer':'Tout sortir')+'</button></header>'+
          pm.map(function(m){var h=D.horse(m.horse);if(!h)return '';var s=state(m);
            return '<button class="tr-er k-'+s.k+(s.late?' late':'')+'" data-tog="'+m.id+'"'+(s.k==='stay'?' disabled':'')+' aria-label="'+E(h.name+' : '+s.t)+'">'+U.hav(h)+'<span class="grow"><b>'+E(h.name)+'</b><small>'+E(s.t)+'</small></span><span class="tr-big">'+ICON(s.k==='out'?'paddock':s.k==='back'?'check':s.k==='stay'?'lock':'right')+'</span></button>'}).join('')+'</section>'}).join('')+
      (ms.length?'':U.empty('paddock','Aucune sortie prévue','Le gérant prépare les sorties dans Prés et paddocks.'))+
      '<div class="tr-ehelp">'+ICON('info','sm')+'<span>Un appui sur un cheval le sort, un second le rentre. L’heure est notée toute seule, même sans réseau.</span></div>'+
      '<div class="hrow wrap tr-eacts"><button class="btn" data-go="emp-signaler">'+ICON('alert','sm')+'Signaler une clôture ou un abreuvoir</button></div>';
    P.animate(el)}
  function toggle(id){var m=D.pastureMoves.find(function(x){return x.id===id});if(!m)return;var h=D.horse(m.horse),prev={out:m.out,back:m.back,by:m.by},t=nowHM();
    if(!m.out){m.out=t;m.by=D.me.employe;m.back=null}else if(!m.back){m.back=t}else{m.out=t;m.back=null;m.by=D.me.employe}
    vib(18);draw();saved();var row=$('[data-tog="'+id+'"]',el);if(row&&!P.RM)row.animate([{transform:'scale(.97)'},{transform:'none'}],{duration:320,easing:'cubic-bezier(.3,1.4,.5,1)'});
    P.toast(fn(h)+(m.back?' rentré à ':' sorti à ')+hm(t)+(isOff()?' · gardé sur l’appareil':''),{icon:m.back?'stable':'paddock',undo:function(){m.out=prev.out;m.back=prev.back;m.by=prev.by;draw()}})}
  on(el,'[data-tog]',function(b){toggle(b.getAttribute('data-tog'))});
  on(el,'[data-slot]',function(b){EP.slot=b.getAttribute('data-slot');draw()});
  on(el,'[data-all]',function(b){var pid=b.getAttribute('data-all'),dir=b.getAttribute('data-dir'),t=nowHM(),ms=movesOf(EP.slot).filter(function(m){return m.pasture===pid&&D.horse(m.horse)&&D.horse(m.horse).status!=='bad'}),snap=ms.map(function(m){return {m:m,out:m.out,back:m.back}});
    ms.forEach(function(m){if(dir==='out'){if(!m.out||m.back){m.out=t;m.back=null;m.by=D.me.employe}}else if(m.out&&!m.back)m.back=t});vib(30);draw();saved();
    P.toast(pl(ms.length,'cheval','chevaux')+(dir==='out'?' sortis':' rentrés')+' à '+hm(t),{icon:dir==='out'?'paddock':'stable',undo:function(){snap.forEach(function(s){s.m.out=s.out;s.m.back=s.back});draw()}})});
  draw()}

/* ---------- Écran du propriétaire ---------- */
function myHorses(){var me=D.me&&D.me.adherent,fam=(D.member(me)||{}).fam;return D.horses.filter(function(h){if(!h.owner)return false;if(h.owner===me)return true;var o=D.member(h.owner);return fam&&o&&o.fam===fam})}
var AP={h:null};
function apRender(el,ctx){ensure();var hs=myHorses();if(!hs.length){el.innerHTML=U.ph('Au pré')+U.empty('paddock','Aucun cheval à votre nom','Les sorties au pré de votre cheval s’afficheront ici dès que le club l’aura relié à votre fiche.');return}
  var h=hs.find(function(x){return x.id===AP.h})||hs[0],slot=curSlot(),m=moveOf(h.id,slot),p=m?pasture(m.pasture):null,isOut=m&&m.out&&!m.back,w=works(h.id);
  var mates=p?inP(p.id,slot).filter(function(x){var mm2=moveOf(x.id,slot);return x.id!==h.id&&mm2&&mm2.out&&!mm2.back}):[];
  var next=!isOut?(function(){var a=moveOf(h.id,'am'),b=moveOf(h.id,'pm');if(slot==='am'&&a&&!a.out)return 'ce matin à '+hm(SLOTS.am.from);if(b&&!b.out)return 'cet après-midi à '+hm(SLOTS.pm.from);return 'demain matin'})():'';
  var hist=[];for(var i=-6;i<=0;i++){var d=dayIso(i),tot=D.pastureMoves.filter(function(x){return x.horse===h.id&&x.date===d&&x.out}).reduce(function(s,x){var b=x.back||(d===today()?nowHM():SLOTS[x.slot].to);return s+Math.max(0,mm(b)-mm(x.out))},0);hist.push(Math.round(tot/6)/10)}
  var lab=[];for(var j=-6;j<=0;j++){var dd=new Date(nowD());dd.setDate(dd.getDate()+j);lab.push(j?['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][dd.getDay()]:'Auj.')}
  var wx=(D.weather||[])[0];
  el.innerHTML=U.ph('Au pré',hs.length>1?'':E(h.name),hs.length>1?U.seg(hs.map(function(x){return [x.id,E(fn(x))]}),h.id,'data-h'):'')+
   '<div class="tr-ah card tint d-hz"><div class="tr-ahl"><span class="tr-live'+(isOut?'':' in')+'"><i></i>'+(isOut?'Dehors en ce moment':'Au box')+'</span>'+
     '<h2>'+(isOut?E(fn(h))+' est au pré n°'+NB+p.n+', '+E(p.name)+', depuis '+hm(m.out)+'.':E(fn(h))+' est au box. Prochaine sortie '+next+'.')+'</h2>'+
     '<p>'+(isOut?(mates.length?'Avec '+E(list(mates.map(fn)))+'. ':'Seul dans son enclos. ')+(function(){var cw=clash(m),due=m.plan||(cw?fromMin(mm(cw.at)-15):null);return due?'Rentrée prévue à '+hm(due)+(cw?', avant sa reprise de '+hm(cw.at)+'.':'.'):'Rentrée vers '+hm(SLOTS[slot].to)+'.'})():(w.length?E(fn(h))+' travaille aujourd’hui à '+list(w.map(function(x){return hm(x.at)}))+'.':'L’équipe vous prévient à chaque sortie si vous le souhaitez.'))+'</p>'+
     '<div class="hrow wrap" style="--g:8px;margin-top:auto">'+(p?U.chip((GRASS[resting(p)?'repos':p.grass]||GRASS.bonne)[0]+(p.cm!=null?' · '+p.cm+NB+'cm':''),'',true):'')+(p&&p.water?U.chip(E(p.water),'',false):'')+(wx&&!wx.none?U.chip(wx.t+NB+'°C · pluie '+wx.r+NB+'%','',false):'')+'</div></div>'+
     '<div class="tr-ahm">'+mapHtml(slot,p?p.id:'__')+'</div></div>'+
   '<div class="g2 tr-ag"><div class="card"><div class="ch"><div><h3>Sa semaine au pré</h3><div class="xs mut">Heures dehors par jour</div></div><span class="chip num">'+String(Math.round(hist.reduce(function(a,b){return a+b},0)*10)/10).replace('.',',')+NB+'h</span></div><div class="cb">'+P.chart.bars(hist,lab,{h:170,hi:6,colors:['var(--hz)'],fmt:function(v){return String(Math.round(v*10)/10).replace('.',',')+' h'}})+'</div></div>'+
    '<div class="card"><div class="ch"><h3>Ses copains de pré</h3></div><div class="cb stack" style="--g:4px">'+(function(){var f=friendsOf(h.id).map(D.horse).filter(Boolean),seen={};D.pastureMoves.forEach(function(x){if(x.horse!==h.id||!x.out)return;D.pastureMoves.forEach(function(y){if(y.date===x.date&&y.slot===x.slot&&y.pasture===x.pasture&&y.horse!==h.id&&y.out)seen[y.horse]=(seen[y.horse]||0)+1})});
      var top=Object.keys(seen).sort(function(a,b){return seen[b]-seen[a]}).slice(0,3).map(D.horse).filter(Boolean);var all=f.concat(top.filter(function(x){return f.indexOf(x)<0})).slice(0,4);
      return all.length?all.map(function(x){var r=rule(h.id,x.id);return '<div class="tr-mate">'+U.hav(x)+'<div class="grow"><b>'+E(x.name)+'</b><div class="xs mut">'+E(r&&r.k==='friends'?r.why:'Souvent au même pré')+'</div></div>'+(r&&r.k==='friends'?ICON('heart','sm'):'')+'</div>'}).join(''):'<p class="s mut">Pas encore de copain attitré.</p>'})()+
     '<div class="tr-notif"><span class="grow"><b>Me prévenir à chaque sortie</b><small>Une notification quand il sort et quand il rentre</small></span>'+U.tog(P.prefs.get('tr:notif',false),'tr-notif')+'</div></div></div></div>'+
   '<div class="hrow wrap tr-aacts"><button class="btn" data-go="adh-cheval">'+ICON('horse','sm')+'Voir sa fiche et son journal</button><button class="btn" data-ask>'+ICON('chat','sm')+'Demander une sortie en plus</button></div>';
  on(el,'[data-h]',function(b){AP.h=b.getAttribute('data-h');apRender(el,ctx);P.animate(el)});
  on(el,'#tr-notif',function(b){setTimeout(function(){var v=b.getAttribute('aria-checked')==='true';P.prefs.set('tr:notif',v);P.toast(v?'Vous serez prévenue à chaque sortie de '+fn(h):'Notifications de sortie coupées',{icon:'bell'})},0)});
  on(el,'[data-ask]',function(){var sh=P.sheet({title:'Une sortie en plus',icon:'paddock',body:'<div class="stack" style="--g:14px"><div class="field"><span>Quand</span>'+U.seg([['am','Demain matin'],['pm','Demain après-midi'],['we','Samedi']],'pm','data-w')+'</div><label class="field"><span>Un mot pour l’équipe</span><input class="in" data-msg placeholder="Avec Saphir si possible"></label><div class="note">'+ICON('euro','sm')+'<span>Sortie au pré en plus : 6 € la demi-journée, ajoutée à la facture de pension.</span></div></div>',foot:'<button class="btn pri block" data-ok>'+ICON('send','sm')+'Envoyer la demande</button>'});
    $('[data-ok]',sh).onclick=function(){sh.close();P.toast('Demande envoyée à l’écurie : vous recevrez la réponse ici',{icon:'send'})}})}

/* =====================================================================
   2 · VENTE DE CHEVAUX
   ===================================================================== */
var ADST={brouillon:['Brouillon',''],'en ligne':['En ligne','ok'],'sous option':['Sous option','warn'],vendu:['Vendu','acc'],retirée:['Retirée','']};
var LDST={nouvelle:'acc',répondue:'',"essai prévu":'warn',offre:'ok',déclinée:'',vendu:'ok'};
function ad(id){return D.horseAds.find(function(a){return a.id===id})}
function lead(id){return D.horseLeads.find(function(l){return l.id===id})}
function adOf(hid){return D.horseAds.find(function(a){return a.horse===hid&&a.status!=='retirée'&&a.status!=='vendu'})}
function slug(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')}
function adUrl(a){var h=D.horse(a.horse);return 'stablapp.fr/c/'+slug(D.club.short||D.club.name)+'/'+slug(h?h.name:a.id)}
function newLeads(){return D.horseLeads.filter(function(l){return l.status==='nouvelle'}).length}
function photoHtml(ph,h,cls){if(ph&&ph.src)return '<span class="tr-ph '+(cls||'')+'"><img src="'+ph.src+'" alt="Photo de '+E(h?h.name:'')+'"></span>';
  var t=(ph&&ph.t)||'hz';return '<span class="tr-ph fake d-'+t+' '+(cls||'')+'" role="img" aria-label="Photo de '+E(h?h.name:'')+'"><i class="hz1"></i><i class="hz2"></i>'+HORSE_GLYPH()+'</span>'}
function sellerTxt(a){return a.seller&&a.seller!=='club'?'Pour le compte de '+E(D.name(a.seller))+(a.fee?' · commission '+a.fee+NB+'%':''):'Cheval du club'}
/* description rédigée par Stabl AI à partir de la fiche */
var MOOD={Calme:'Caractère calme, facile au box comme en extérieur.',Volontaire:'Caractère volontaire, franc à l’abord des barres.',Sensible:'Caractère sensible : répond à des aides légères, idéal pour une main douce.',Joueur:'Caractère joueur et curieux, aime le travail varié.',Froid:'Un peu froid aux jambes en début de séance, se chauffe bien après la détente.',Généreux:'Caractère généreux et régulier au travail.'};
function lvTxt(l){if(!l)return '';if(/Débutant/.test(l))return 'Convient à un cavalier débutant, accompagné de son moniteur.';if(/Confirmé/.test(l))return 'Pour un cavalier confirmé.';var m=/Galop (\d)-(\d)/.exec(l);return m?'Convient à un cavalier de niveau Galop '+m[1]+' à '+m[2]+'.':''}
function aiText(h,a){var art=h.sex==='Jument'?'une jument':h.sex==='Étalon'?'un étalon':'un hongre',age=h.age||(h.born?new Date().getFullYear()-h.born:null);
  var s=[h.name+' est '+art+(h.breed?' '+h.breed:'')+(age?' de '+age+' ans':'')+(h.coat?', '+h.coat.toLowerCase():'')+(h.height?', '+h.height+NB+'cm':'')+'.'];
  if(MOOD[h.mood])s.push(MOOD[h.mood]);var lv=lvTxt(h.level);if(lv)s.push(lv);
  var dts=[h.vacc?'vacciné le '+F.date(h.vacc):'',h.worm?'vermifugé le '+F.date(h.worm):'',h.farrier?'maréchal le '+F.date(h.farrier):''].filter(Boolean);if(dts.length)s.push(cap1(list(dts))+' : carnet de santé à jour.');
  s.push(a&&a.seller&&a.seller!=='club'?'Vendu par sa propriétaire, en pension à '+D.club.name+'.':'Vendu par le club, qui renouvelle sa cavalerie.');
  s.push('Essai possible sur place à '+(D.club.city||'l’écurie')+(a&&a.vet?', visite vétérinaire d’achat à la charge de l’acheteur.':'.'));return s.join(' ')}
function typeInto(ta,txt,done){if(P.RM){ta.value=txt;if(done)done();return}var i=0;ta.value='';ta.classList.add('tr-typing');(function st(){i=Math.min(txt.length,i+Math.max(2,Math.round(txt.length/90)));ta.value=txt.slice(0,i);ta.scrollTop=ta.scrollHeight;if(i<txt.length&&ta.isConnected)setTimeout(st,16);else{ta.classList.remove('tr-typing');if(done)done()}})()}
/* photo envoyée : réduite sur l'appareil (aucun envoi réseau ici) */
function readPhoto(file,cb){var r=new FileReader();r.onload=function(){var img=new Image();img.onload=function(){var k=Math.min(1,640/Math.max(img.width,img.height)),c=document.createElement('canvas');c.width=Math.round(img.width*k);c.height=Math.round(img.height*k);c.getContext('2d').drawImage(img,0,0,c.width,c.height);try{cb(c.toDataURL('image/jpeg',.72))}catch(e){cb(r.result)}};img.onerror=function(){P.toast('Cette image ne s’ouvre pas',{icon:'alert'})};img.src=r.result};r.readAsDataURL(file)}

function veRender(el,ctx){ensure();
  function draw(){var ads=D.horseAds.filter(function(a){return a.status!=='retirée'}),live=ads.filter(function(a){return a.status==='en ligne'||a.status==='sous option'}),nl=newLeads(),
      trials=D.horseTrials.filter(function(t){return t.status==='prévu'}).sort(function(a,b){return (a.date+a.time).localeCompare(b.date+b.time)}),views=live.reduce(function(s,a){return s+(a.week||[]).reduce(function(x,y){return x+y},0)},0);
    el.innerHTML=U.ph('Vente de chevaux',pl(live.length,'annonce en ligne','annonces en ligne')+' · '+pl(nl,'demande nouvelle','demandes nouvelles')+(trials.length?' · prochain essai '+F.rel(trials[0].date)+' à '+hm(trials[0].time):''),'<button class="btn pri" data-new>'+ICON('plus','sm')+'Mettre un cheval en vente</button>')+
     '<div class="g4 rise tr-kpis">'+U.kpi({label:'Annonces en ligne',count:live.length,icon:'tag',dom:'hz'})+U.kpi({label:'Vues sur 7 jours',count:views,icon:'eye',dom:'acc',spark:live.length?live[0].week.map(function(v,i){return live.reduce(function(s,a){return s+((a.week||[])[i]||0)},0)}):null})+U.kpi({label:'Demandes à traiter',count:nl,icon:'mail',dom:'rd'})+U.kpi({label:'Essais prévus',count:trials.length,icon:'calendar_add',dom:'mo'})+'</div>'+
     '<div class="tr-vg"><div class="stack" style="--g:14px">'+(ads.length?ads.map(function(a){var h=D.horse(a.horse);if(!h)return '';var st=ADST[a.status]||ADST.brouillon,nld=D.horseLeads.filter(function(l){return l.ad===a.id}).length;
        return '<article class="card tr-ad'+(a.status==='vendu'?' sold':'')+'" data-ad="'+a.id+'">'+photoHtml(a.photos&&a.photos[0],h,'th')+'<div class="tr-adb"><div class="hrow sp" style="--g:10px;align-items:flex-start"><div class="grow" style="min-width:0"><h3>'+E(h.name)+'</h3><div class="s mut ellip">'+E([h.breed,h.sex,h.age?h.age+' ans':'',h.height?h.height+NB+'cm':''].filter(Boolean).join(' · '))+'</div></div>'+U.chip(st[0],st[1],true)+'</div>'+
          '<div class="tr-price num">'+F.eur(a.price)+'</div><div class="xs mut">'+sellerTxt(a)+'</div>'+
          '<div class="tr-adm"><span>'+ICON('eye','sm')+F.num(a.views||0)+' vues</span><span>'+ICON('mail','sm')+pl(nld,'demande')+'</span><span>'+ICON('clock','sm')+(a.status==='brouillon'?'Pas encore publiée':'En ligne depuis '+F.date(a.since))+'</span></div>'+
          '<div class="hrow wrap tr-adacts" style="--g:8px">'+(a.status==='brouillon'?'<button class="btn sm pri" data-manage="'+a.id+'">'+ICON('spark','sm')+'Terminer et publier</button>':'<button class="btn sm" data-public="'+a.id+'">'+ICON('ext','sm')+'Voir la page publique</button><button class="btn sm" data-manage="'+a.id+'">'+ICON('edit','sm')+'Gérer l’annonce</button>')+
          (a.status==='sous option'?'<button class="btn sm pri" data-sell="'+a.id+'">'+ICON('sign','sm')+'Conclure la vente</button>':'')+'</div></div></article>'}).join(''):'<div class="card">'+U.empty('tag','Aucun cheval en vente','Créez une annonce depuis la fiche : Stabl AI rédige la description, vous ajoutez les photos et le prix.','<button class="btn pri" data-new>'+ICON('plus','sm')+'Mettre un cheval en vente</button>')+'</div>')+'</div>'+
      '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>Demandes reçues</h3>'+(nl?'<span class="chip acc">'+nl+' nouvelle'+(nl>1?'s':'')+'</span>':'')+'</div><div class="list">'+(D.horseLeads.length?D.horseLeads.slice().sort(function(a,b){return String(b.at).localeCompare(String(a.at))}).map(function(l){var a=ad(l.ad),h=a&&D.horse(a.horse);
          return '<button class="li click tr-ld" data-lead="'+l.id+'"><span class="av" style="--c:var(--c'+(1+(l.name.length%7))+')">'+E(l.name.split(' ').map(function(x){return x[0]}).join('').slice(0,2))+'</span><div class="grow" style="min-width:0"><div class="t ellip"><b>'+E(l.name)+'</b> · '+E(h?fn(h):'')+'</div><div class="s mut ellip">'+E(l.msg)+'</div></div><div class="tr-ldr">'+U.chip(cap1(l.status),LDST[l.status]||'',l.status==='nouvelle')+'<span class="xs mut">'+F.rel(String(l.at).slice(0,10))+'</span></div></button>'}).join(''):U.empty('mail','Pas encore de demande','Les demandes envoyées depuis vos annonces arrivent ici.'))+'</div></div>'+
       '<div class="card"><div class="ch"><h3>Essais</h3></div><div class="cb">'+(D.horseTrials.length?'<div class="tl">'+D.horseTrials.slice().sort(function(a,b){return (b.date+b.time).localeCompare(a.date+a.time)}).map(function(t){var l=lead(t.lead),a=ad(t.ad),h=a&&D.horse(a.horse);
          return '<button class="ev tr-tri" data-trial="'+t.id+'"><b>'+cap1(F.rel(t.date))+' à '+hm(t.time)+' · '+E(h?fn(h):'')+'</b><span class="s mut">'+E(l?l.name:'')+' · '+E(arenaName(t.arena))+(t.with?' · avec '+E(first(t.with)):'')+'</span>'+(t.status==='fait'?'<span class="s" style="color:var(--ok)">Fait'+(t.note?' : '+E(t.note):'')+'</span>':'')+'</button>'}).join('')+'</div>':'<p class="s mut">Proposez un essai depuis une demande : il s’ajoute au planning des pistes.</p>')+'</div></div></div></div>';
    P.animate(el)}
  on(el,'[data-new]',function(){newAd(null,draw)});
  on(el,'[data-manage]',function(b){manageAd(b.getAttribute('data-manage'),draw)});
  on(el,'[data-public]',function(b){P.go('annonce',{id:b.getAttribute('data-public')})});
  on(el,'[data-sell]',function(b){var a=ad(b.getAttribute('data-sell')),l=D.horseLeads.filter(function(x){return x.ad===a.id&&x.status==='offre'})[0];transfer(a.id,l?l.id:null,draw)});
  on(el,'[data-lead]',function(b){leadSheet(b.getAttribute('data-lead'),draw)});
  on(el,'[data-trial]',function(b){trialSheet(b.getAttribute('data-trial'),draw)});
  on(el,'.tr-ad',function(b,e){if(e.target.closest('button'))return;manageAd(b.getAttribute('data-ad'),draw)});
  draw()}

function newAd(hid,done){var cands=D.horses.filter(function(h){return !adOf(h.id)&&h.status!=='bad'}).sort(function(a,b){return a.name.localeCompare(b.name,'fr')});
  if(!cands.length){P.toast('Tous les chevaux disponibles sont déjà en vente',{icon:'info'});return}
  var h=D.horse(hid)||cands[0],photos=[{t:'hz'}];
  var sh=P.sheet({title:'Mettre un cheval en vente',icon:'tag',wide:true,body:function(b){
    b.innerHTML='<div class="stack" style="--g:16px"><div class="g2" style="--g:12px"><label class="field"><span>Cheval</span><select class="in" data-h>'+cands.map(function(x){return '<option value="'+x.id+'"'+(x.id===h.id?' selected':'')+'>'+E(x.name)+'</option>'}).join('')+'</select></label><label class="field"><span>Prix demandé (€)</span><input class="in num" data-price inputmode="numeric" value="6500"></label></div>'+
     '<div class="tr-facts" data-facts></div><div class="field"><span>Photos</span><div class="tr-phs" data-phs></div></div>'+
     '<div class="field"><div class="hrow sp"><span>Description</span><button class="btn sm tint d-acc" data-gen>'+ICON('spark','sm')+'Rédiger avec Stabl AI</button></div><textarea class="in tr-ta" data-text rows="6" placeholder="Stabl AI rédige la description à partir de la fiche du cheval."></textarea></div>'+
     '<div class="tr-incl">'+[['health','Joindre le carnet de santé',true],['results','Afficher ses résultats en concours',true],['vet','Visite vétérinaire d’achat possible',true]].map(function(x){return '<label class="tr-tg"><span>'+x[1]+'</span>'+U.tog(x[2]).replace('<button','<button data-inc="'+x[0]+'"')+'</label>'}).join('')+'</div></div>';
    function facts(){h=D.horse($('[data-h]',b).value);$('[data-facts]',b).innerHTML=[['Race',h.breed],['Sexe',h.sex],['Âge',h.age?h.age+' ans':''],['Taille',h.height?h.height+NB+'cm':''],['Robe',h.coat],['Niveau',h.level]].filter(function(x){return x[1]}).map(function(x){return '<div><small>'+x[0]+'</small><b>'+E(x[1])+'</b></div>'}).join('');phs()}
    function phs(){$('[data-phs]',b).innerHTML=photos.map(function(p,i){return '<span class="tr-phw">'+photoHtml(p,h)+'<button class="tr-phx" data-rmph="'+i+'" title="Retirer la photo">'+ICON('x','sm')+'</button></span>'}).join('')+'<label class="tr-phadd">'+ICON('image')+'<span>Ajouter</span><input type="file" accept="image/*" multiple data-file></label>'}
    facts();$('[data-h]',b).onchange=function(){facts();$('[data-text]',b).value=''};
    on(b,'[data-gen]',function(btn){btn.disabled=true;typeInto($('[data-text]',b),aiText(h,{vet:true}),function(){btn.disabled=false})});
    on(b,'[data-rmph]',function(x){photos.splice(+x.getAttribute('data-rmph'),1);phs()});
    b.addEventListener('change',function(e){if(!e.target.matches('[data-file]'))return;Array.prototype.slice.call(e.target.files||[],0,6).forEach(function(f){readPhoto(f,function(src){photos.push({src:src});phs()})})})},
    foot:'<button class="btn ghost" data-draft>Enregistrer en brouillon</button><button class="btn pri" data-pub>'+ICON('send','sm')+'Publier l’annonce</button>'});
  function make(st){var price=+String($('[data-price]',sh).value).replace(/\D/g,'')||0,txt=$('[data-text]',sh).value.trim()||aiText(h,{vet:true}),inc={};$$('[data-inc]',sh).forEach(function(t){inc[t.getAttribute('data-inc')]=t.getAttribute('aria-checked')==='true'});
    var a={id:uid('ad'),horse:h.id,price:price,status:st,since:today(),views:0,week:[0,0,0,0,0,0,0],seller:h.owner||'club',fee:h.owner?5:0,health:inc.health,results:inc.results,vet:inc.vet,photos:photos.slice(),text:txt};
    D.horseAds.unshift(a);sh.close();if(done)done();saved();return a}
  $('[data-draft]',sh).onclick=function(){var a=make('brouillon');P.toast('Brouillon enregistré pour '+fn(D.horse(a.horse)),{icon:'doc'})};
  $('[data-pub]',sh).onclick=function(){var a=make('en ligne');P.toast('Annonce de '+fn(D.horse(a.horse))+' publiée sur la page du club',{icon:'send'})}}

function manageAd(id,done){var a=ad(id),h=a&&D.horse(a.horse);if(!h)return;
  var sh=P.sheet({title:E(h.name),icon:'tag',wide:true,body:function(b){
    b.innerHTML='<div class="tr-gal">'+(a.photos||[]).slice(0,3).map(function(p,i){return photoHtml(p,h,i?'':'main')}).join('')+'</div>'+
     '<div class="stack" style="--g:16px;margin-top:16px"><div class="hrow sp wrap" style="--g:10px"><div>'+U.chip((ADST[a.status]||ADST.brouillon)[0],(ADST[a.status]||ADST.brouillon)[1],true)+' <span class="s mut">'+sellerTxt(a)+'</span></div><span class="mono xs mut">'+E(adUrl(a))+'</span></div>'+
     '<div class="g2" style="--g:12px"><label class="field"><span>Prix demandé (€)</span><input class="in num" data-price inputmode="numeric" value="'+a.price+'"></label><div class="field"><span>Vues sur 7 jours</span><div class="tr-vw">'+P.chart.spark((a.week||[0,0]).length>1?a.week:[0,0],'var(--acc)')+'<b class="num">'+F.num((a.week||[]).reduce(function(s,v){return s+v},0))+'</b></div></div></div>'+
     '<div class="field"><div class="hrow sp"><span>Description</span><button class="btn sm tint d-acc" data-gen>'+ICON('spark','sm')+(a.text?'Réécrire avec Stabl AI':'Rédiger avec Stabl AI')+'</button></div><textarea class="in tr-ta" data-text rows="6">'+E(a.text||'')+'</textarea></div></div>';
    on(b,'[data-gen]',function(btn){btn.disabled=true;typeInto($('[data-text]',b),aiText(h,a),function(){btn.disabled=false})})},
    foot:(a.status==='brouillon'?'<button class="btn ghost" data-rm>'+ICON('trash','sm')+'Supprimer</button><button class="btn pri" data-pub>'+ICON('send','sm')+'Publier</button>':
      '<button class="btn ghost" data-rm>Retirer</button>'+(a.status==='en ligne'?'<button class="btn" data-opt>Passer sous option</button>':'<button class="btn" data-opt>Remettre en ligne</button>')+'<button class="btn" data-save>Enregistrer</button><button class="btn pri" data-sell>'+ICON('sign','sm')+'Conclure la vente</button>')});
  function keep(){a.price=+String($('[data-price]',sh).value).replace(/\D/g,'')||a.price;a.text=$('[data-text]',sh).value.trim()}
  var q=function(s){return $(s,sh)};
  if(q('[data-pub]'))q('[data-pub]').onclick=function(){keep();if(!a.text)a.text=aiText(h,a);a.status='en ligne';a.since=today();sh.close();done();saved();P.toast('Annonce de '+fn(h)+' publiée',{icon:'send'})};
  if(q('[data-save]'))q('[data-save]').onclick=function(){keep();sh.close();done();saved();P.toast('Annonce enregistrée',{icon:'checkc'})};
  if(q('[data-opt]'))q('[data-opt]').onclick=function(){keep();a.status=a.status==='en ligne'?'sous option':'en ligne';sh.close();done();saved();P.toast(fn(h)+(a.status==='sous option'?' est sous option : l’annonce le signale':' est de nouveau disponible'),{icon:'tag'})};
  if(q('[data-sell]'))q('[data-sell]').onclick=function(){keep();sh.close();var l=D.horseLeads.filter(function(x){return x.ad===a.id&&x.status==='offre'})[0];transfer(a.id,l?l.id:null,done)};
  q('[data-rm]').onclick=function(){var was=a.status;sh.close();if(was==='brouillon'){var i=D.horseAds.indexOf(a);D.horseAds.splice(i,1);done();saved();P.toast('Brouillon supprimé',{icon:'trash',undo:function(){D.horseAds.splice(i,0,a);done()}})}else{a.status='retirée';done();saved();P.toast('Annonce retirée',{icon:'tag',undo:function(){a.status=was;done()}})}}}

function leadSheet(id,done){var l=lead(id),a=l&&ad(l.ad),h=a&&D.horse(a.horse);if(!h)return;
  var sh=P.sheet({title:E(l.name),icon:'mail',body:'<div class="stack" style="--g:14px"><div class="tr-who">'+photoHtml(a.photos&&a.photos[0],h,'xs')+'<div><b>'+E(h.name)+' · '+F.eur(a.price)+'</b><div class="s mut">Demande '+F.rel(String(l.at).slice(0,10))+' à '+hm(String(l.at).slice(11,16))+'</div></div></div>'+
    '<div class="tr-msg">'+E(l.msg)+'</div><div class="tr-facts">'+[['Niveau',l.level],['Budget',l.budget?F.eur(l.budget):''],['Téléphone',l.phone],['E-mail',l.email]].filter(function(x){return x[1]}).map(function(x){return '<div><small>'+x[0]+'</small><b>'+E(x[1])+'</b></div>'}).join('')+'</div>'+
    (l.offer?'<div class="note ok">'+ICON('euro','sm')+'<span>Offre reçue : <b>'+F.eur(l.offer)+'</b> pour '+F.eur(a.price)+' demandés.</span></div>':'')+
    '<div class="field"><span>Votre réponse</span><textarea class="in tr-ta" data-rep rows="4">Bonjour '+E(l.name.split(' ')[0])+', merci pour votre message. '+E(fn(h))+' est visible à '+E(D.club.city||'l’écurie')+' du mardi au dimanche. Je vous propose un essai '+F.dateL(dayIso(4))+' à 10 h, avec son moniteur. '+E(first(D.me.gerant)||'')+', '+E(D.club.name)+'</textarea></div></div>',
    foot:'<button class="btn ghost" data-dec>Décliner</button><button class="btn" data-send>'+ICON('send','sm')+'Répondre</button><button class="btn pri" data-try>'+ICON('calendar_add','sm')+'Proposer un essai</button>'+(l.status==='offre'?'<button class="btn pri" data-sell>'+ICON('sign','sm')+'Accepter l’offre</button>':'')});
  $('[data-send]',sh).onclick=function(){if(l.status==='nouvelle')l.status='répondue';sh.close();done();saved();P.toast('Réponse envoyée à '+l.name.split(' ')[0]+(isOff()?' dès le retour du réseau':''),{icon:'send'})};
  $('[data-dec]',sh).onclick=function(){var was=l.status;l.status='déclinée';sh.close();done();saved();P.toast('Demande déclinée, un message poli part à '+l.name.split(' ')[0],{icon:'mail',undo:function(){l.status=was;done()}})};
  $('[data-try]',sh).onclick=function(){sh.close();trialNew(l,done)};
  var sl=$('[data-sell]',sh);if(sl)sl.onclick=function(){sh.close();transfer(a.id,l.id,done)}}
function trialNew(l,done){var a=ad(l.ad),h=D.horse(a.horse),days=[1,2,4,5].map(dayIso),d=days[0],t='10:00',ar=(D.club.arenas[1]||D.club.arenas[0]||{}).id;
  var sh=P.sheet({title:'Essai de '+E(fn(h)),icon:'calendar_add',body:'<div class="stack" style="--g:14px"><div class="field"><span>Jour</span>'+U.seg(days.map(function(x){return [x,cap1(F.rel(x))]}),d,'data-d')+'</div><div class="field"><span>Heure</span>'+U.seg(['10:00','11:30','14:00','16:00'].map(function(x){return [x,hm(x)]}),t,'data-t')+'</div>'+
    '<label class="field"><span>Piste</span><select class="in" data-ar>'+(D.club.arenas||[]).map(function(x){return '<option value="'+x.id+'"'+(x.id===ar?' selected':'')+'>'+E(x.name)+'</option>'}).join('')+'</select></label><div class="note">'+ICON('info','sm')+'<span>La piste est réservée au planning et '+E(l.name.split(' ')[0])+' reçoit la confirmation avec l’adresse.</span></div></div>',
    foot:'<button class="btn pri block" data-ok>'+ICON('check','sm')+'Proposer cet essai</button>'});
  on(sh,'[data-d]',function(b){d=b.getAttribute('data-d')});on(sh,'[data-t]',function(b){t=b.getAttribute('data-t')});
  $('[data-ok]',sh).onclick=function(){var tr={id:uid('tr'),ad:a.id,lead:l.id,date:d,time:t,arena:$('[data-ar]',sh).value,with:null,status:'prévu'};D.horseTrials.push(tr);
    if(Array.isArray(D.trackBookings))D.trackBookings.push({id:uid('tb'),who:D.me.gerant,horse:h.id,arena:tr.arena,date:d,from:t,to:fromMin(mm(t)+60),note:'Essai de vente'});
    l.status='essai prévu';sh.close();done();saved();P.toast('Essai proposé '+F.rel(d)+' à '+hm(t)+' : piste réservée',{icon:'calendar_add'})}}
function trialSheet(id,done){var t=D.horseTrials.find(function(x){return x.id===id}),l=t&&lead(t.lead),a=t&&ad(t.ad),h=a&&D.horse(a.horse);if(!h)return;
  var sh=P.sheet({title:'Essai de '+E(fn(h)),icon:'calendar_add',body:'<div class="stack" style="--g:12px"><div class="tr-facts">'+[['Quand',cap1(F.dateL(t.date))+' à '+hm(t.time)],['Piste',arenaName(t.arena)],['Cavalier',l?l.name+' · '+l.level:''],['Téléphone',l?l.phone:'']].filter(function(x){return x[1]}).map(function(x){return '<div><small>'+x[0]+'</small><b>'+E(x[1])+'</b></div>'}).join('')+'</div>'+
    (t.status==='fait'?'<div class="note ok">'+ICON('checkc','sm')+'<span>'+E(t.note||'Essai fait.')+'</span></div>':'<label class="field"><span>Comment s’est passé l’essai</span><input class="in" data-note placeholder="Bon feeling, revient samedi avec sa monitrice"></label>')+'</div>',
    foot:t.status==='fait'?'<button class="btn pri block" data-sell>'+ICON('sign','sm')+'Passer à la vente</button>':'<button class="btn ghost" data-no>Sans suite</button><button class="btn pri" data-yes>'+ICON('check','sm')+'Essai fait, il fait une offre</button>'});
  var q=function(s){return $(s,sh)};
  if(q('[data-no]'))q('[data-no]').onclick=function(){t.status='fait';t.note=(q('[data-note]').value||'Sans suite').trim();if(l)l.status='déclinée';sh.close();done();saved();P.toast('Essai noté sans suite',{icon:'check'})};
  if(q('[data-yes]'))q('[data-yes]').onclick=function(){t.status='fait';t.note=(q('[data-note]').value||'Essai concluant').trim();if(l){l.status='offre';l.offer=l.offer||a.price}a.status='sous option';sh.close();done();saved();P.toast(fn(h)+' passe sous option',{icon:'tag'})};
  if(q('[data-sell]'))q('[data-sell]').onclick=function(){sh.close();transfer(a.id,l?l.id:null,done)}}

/* vente conclue : contrat, visite, paiement, SIRE, départ */
function transfer(adId,leadId,done){var a=ad(adId),h=a&&D.horse(a.horse),l=leadId?lead(leadId):null;if(!h)return;
  var st=a.steps=a.steps||{},price=l&&l.offer||a.price,sire=h.sire||'';
  var S=[['contract','Contrat de vente signé','Le modèle « Vente de cheval » reprend le cheval, le prix et les deux parties.','<button class="btn sm" data-go="contrats">'+ICON('contract','sm')+'Préparer le contrat</button>'],
    ['vet','Visite vétérinaire d’achat','Faite par le vétérinaire de l’acheteur, compte rendu joint au dossier.',''],
    ['pay','Paiement reçu','<b class="num">'+F.eur(price)+'</b>'+(a.seller&&a.seller!=='club'?', dont '+F.eur(Math.round(price*(a.fee||0)/100))+' de commission pour le club':'')+'.',''],
    ['sire','Changement de propriétaire au SIRE','Le vendeur déclare la vente sur le site de l’IFCE avec le code de la carte d’immatriculation, puis l’acheteur confirme de son côté.','<button class="btn sm" data-copy>'+ICON('copy','sm')+'Copier le n° SIRE</button><a class="btn sm" href="https://www.ifce.fr" target="_blank" rel="noopener">'+ICON('ext','sm')+'Ouvrir le site de l’IFCE</a>'],
    ['leave','Départ de l’écurie','Le box se libère et le lieu de détention de '+E(fn(h))+' change au registre.','']];
  var sh=P.sheet({title:'Vente de '+E(fn(h)),icon:'sign',wide:true,body:function(b){
    function draw(){var n=S.filter(function(s){return st[s[0]]}).length;
      b.innerHTML='<div class="tr-buyer">'+photoHtml(a.photos&&a.photos[0],h,'xs')+'<div class="grow"><b>'+E(h.name)+'</b><div class="s mut">'+(l?'Vendu à '+E(l.name)+' · '+E(l.phone||''):'Acheteur à renseigner')+'</div></div><div class="tr-price num">'+F.eur(price)+'</div></div>'+
       '<div class="tr-prog"><span>'+n+' étape'+(n>1?'s':'')+' sur '+S.length+'</span>'+U.bar(n/S.length*100,'var(--hz)')+'</div>'+
       '<ol class="tr-steps">'+S.map(function(s,i){var ok=!!st[s[0]];return '<li class="'+(ok?'ok':'')+'"><button class="tr-sk" data-st="'+s[0]+'" role="checkbox" aria-checked="'+ok+'" title="'+(ok?'Marquer à faire':'Marquer comme fait')+'">'+(ok?ICON('check'):'<span class="num">'+(i+1)+'</span>')+'</button><div class="grow"><b>'+s[1]+'</b><p>'+s[2]+'</p>'+(s[3]?'<div class="hrow wrap" style="--g:8px;margin-top:8px">'+s[3]+(s[0]==='sire'&&sire?'<span class="mono xs mut">'+E(sire)+'</span>':'')+'</div>':'')+'</div></li>'}).join('')+'</ol>';
      var fin=$('[data-fin]',sh);if(fin)fin.disabled=n<S.length}
    draw();on(b,'[data-st]',function(x){var k=x.getAttribute('data-st');st[k]=st[k]?null:today();draw();saved()});
    on(b,'[data-copy]',function(){try{var c=navigator.clipboard&&navigator.clipboard.writeText(sire);if(c&&c.catch)c.catch(function(){})}catch(e){}P.toast('Numéro SIRE copié : '+sire,{icon:'copy'})});
    on(b,'[data-go]',function(){sh.close()})},
    foot:'<button class="btn ghost" data-later>Continuer plus tard</button><button class="btn pri" data-fin>'+ICON('checkc','sm')+'Finaliser la vente</button>'});
  $('[data-later]',sh).onclick=function(){sh.close();done();P.toast('Dossier de vente enregistré, vous le reprenez quand vous voulez',{icon:'doc'})};
  var fin=$('[data-fin]',sh);fin.disabled=S.some(function(s){return !st[s[0]]});
  fin.onclick=function(){a.status='vendu';a.soldAt=today();a.soldPrice=price;a.buyer=l?l.name:'';if(l)l.status='vendu';h.sold={date:today(),price:price,to:l?l.name:''};sh.close();done();saved();
    P.toast('Vente de '+fn(h)+' conclue pour '+F.eur(price)+'. Bonne route, '+fn(h)+' !',{icon:'checkc',ms:5200})}}

/* page publique d'une annonce, telle que la voit un acheteur */
function anRender(el,ctx){ensure();var a=ad(ctx.params.id)||D.horseAds.find(function(x){return x.status==='en ligne'}),h=a&&D.horse(a.horse);
  if(!h){el.innerHTML=U.ph('Annonce')+U.empty('tag','Cette annonce n’existe plus','Elle a peut-être été retirée.','<button class="btn" data-go="ventes">Voir les annonces</button>');return}
  P.setTitle('Annonce · '+fn(h));var st=ADST[a.status]||ADST.brouillon;
  el.innerHTML='<div class="tr-pub"><div class="tr-pubbar"><button class="btn ghost sm" data-go="ventes">'+ICON('back','sm')+'Mes annonces</button><span class="tr-url">'+ICON('lock','sm')+'<span class="ellip">'+E(adUrl(a))+'</span></span><button class="btn sm" data-share>'+ICON('link','sm')+'Copier le lien</button></div>'+
   '<div class="tr-pubc"><div class="tr-pubh"><div class="tr-pubg">'+(a.photos||[{t:'hz'}]).slice(0,3).map(function(p,i){return photoHtml(p,h,i?'':'main')}).join('')+'</div>'+
    '<div class="tr-pubi"><div class="tr-club">'+LOGO(22,'var(--ink)','var(--strass)')+'<span>'+E(D.club.name)+' · '+E(D.club.city||'')+'</span></div><h1>'+E(h.name)+'</h1><div class="s mut">'+E([h.breed,h.sex,h.age?h.age+' ans':''].filter(Boolean).join(' · '))+'</div>'+
     '<div class="tr-pp num">'+F.eur(a.price)+'</div>'+(a.status!=='en ligne'?U.chip(st[0],st[1],true):'')+
     '<div class="tr-facts">'+[['Taille',h.height?h.height+NB+'cm':''],['Robe',h.coat],['Niveau',h.level],['Caractère',h.mood]].filter(function(x){return x[1]}).map(function(x){return '<div><small>'+x[0]+'</small><b>'+E(x[1])+'</b></div>'}).join('')+'</div>'+
     '<div class="tr-inc">'+[a.health?'Carnet de santé à jour, consultable':'',a.vet?'Visite vétérinaire d’achat possible':'',a.results?'Résultats en concours sur demande':''].filter(Boolean).map(function(x){return '<span>'+ICON('checkc','sm')+x+'</span>'}).join('')+'</div></div></div>'+
   '<div class="tr-pubb"><div class="card pad"><h3 class="tr-h3">Présentation</h3><p class="tr-desc">'+E(a.text||aiText(h,a))+'</p></div>'+
    '<form class="card pad tr-form" data-form><h3 class="tr-h3">Demander un essai</h3><div class="g2" style="--g:12px"><label class="field"><span>Nom</span><input class="in" name="name" required autocomplete="name"></label><label class="field"><span>Téléphone</span><input class="in" name="phone" type="tel" autocomplete="tel"></label></div>'+
     '<div class="g2" style="--g:12px"><label class="field"><span>E-mail</span><input class="in" name="email" type="email" autocomplete="email"></label><label class="field"><span>Niveau</span><select class="in" name="level">'+['Galop 2-3','Galop 4-5','Galop 6-7','Amateur','Pro'].map(function(x){return '<option>'+x+'</option>'}).join('')+'</select></label></div>'+
     '<label class="field"><span>Message</span><textarea class="in" name="msg" rows="3">Bonjour, '+E(fn(h))+' m’intéresse. Quand pourrais-je venir l’essayer ?</textarea></label>'+
     '<button class="btn pri lg block" type="submit">'+ICON('send','sm')+'Envoyer ma demande</button><p class="xs mut" style="margin:10px 0 0">Vos coordonnées vont seulement à '+E(D.club.name)+'.</p></form></div></div></div>';
  on(el,'[data-share]',function(){try{var c=navigator.clipboard&&navigator.clipboard.writeText('https://'+adUrl(a));if(c&&c.catch)c.catch(function(){})}catch(e){}P.toast('Lien de l’annonce copié',{icon:'link'})});
  var fm=$('[data-form]',el);fm.addEventListener('submit',function(e){e.preventDefault();var f=new FormData(fm),name=String(f.get('name')||'').trim();if(!name){fm.querySelector('[name=name]').focus();P.toast('Indiquez votre nom',{icon:'info'});return}
    D.horseLeads.push({id:uid('ld'),ad:a.id,name:name,email:String(f.get('email')||''),phone:String(f.get('phone')||''),level:String(f.get('level')||''),budget:null,at:today()+'T'+nowHM(),status:'nouvelle',msg:String(f.get('msg')||'')});
    saved();P.renderBadges();fm.innerHTML='<div class="tr-sent"><span class="ico lg d-hz">'+ICON('checkc','lg')+'</span><h3 class="tr-h3">Demande envoyée</h3><p class="s mut">L’écurie vous répond en général dans la journée.</p><button class="btn" type="button" data-go="ventes">Voir la demande côté écurie</button></div>'})}

/* =====================================================================
   3 · COURS EN DIRECT (moniteur, plein écran, gros boutons)
   ===================================================================== */
var PHASES=[['Détente',15],['Travail',35],['Retour au calme',10]];
var TAGS=['Position','Mains','Équilibre','Confiance','Tracé','Abord','Transitions'];
var MOODS=[['dur','À revoir','alert'],['bien','Bien','check'],['top','Très bien','star']];
function todays(){return (D.lessons||[]).filter(function(l){return l.dow===dowToday()}).sort(function(a,b){return mm(a.start)-mm(b.start)})}
function cuesOf(hid){var h=D.horse(hid);if(!h)return [];var c=D.horseCues.filter(function(x){return x.horse===hid}).map(function(x){return {t:x.text,k:x.k}});
  (h.alerts||[]).forEach(function(a){var w=a.split(' ')[0].toLowerCase();if(!c.some(function(x){return x.t.indexOf(a)>=0||x.t.toLowerCase().split(' ')[0]===w}))c.push({t:a,k:h.status==='bad'?'bad':'warn'})});
  if(!c.length&&h.mood==='Sensible')c.push({t:'Sensible : aides légères',k:''});if(!c.length&&h.mood==='Froid')c.push({t:'Froid aux jambes : détente active',k:''});return c}
function callOf(lid){return D.lessonCalls.find(function(c){return c.lesson===lid&&c.date===today()})}
function runKey(){return 'ce:run:'+today()}
function getRun(){var r=P.store.get(runKey(),null);return r&&r.lesson?r:null}
function setRun(r){P.store.set(runKey(),r)}
function creditKind(m){var f=(D.forfaits||[]).find(function(x){return x.id===m.forfait});if(!f)return ['rattrapage','1 rattrapage à réserver sous 30 jours'];if(f.kind==='carte')return ['carte','1 séance recréditée sur sa carte'];return ['rattrapage','1 rattrapage à réserver sous 30 jours']}
var CE={};
function ceRender(el,ctx){ensure();var ls=todays(),me=ctx.role==='employe'?D.me.employe:D.me.gerant,mine=ls.filter(function(l){return l.coach===me}),show=mine.length?mine:ls,t=nowMin();
  var next=show.find(function(l){return mm(l.start)+l.dur>t&&!(callOf(l.id)&&callOf(l.id).done)})||null,run=getRun();
  if(run&&!ls.some(function(l){return l.id===run.lesson})){P.store.set(runKey(),null);run=null}
  el.innerHTML='<div class="tr-eh">'+U.ph('Cours en direct',(mine.length?'Vos reprises':'Reprises du club')+' aujourd’hui · '+pl(show.length,'reprise'),'')+netHtml()+'</div>'+
   (run?'<button class="card tint d-cr tr-resume" data-open="'+run.lesson+'"><span class="tr-live"><i></i>En cours</span><b>Reprendre '+E((D.lessons.find(function(l){return l.id===run.lesson})||{}).title||'la reprise')+'</b><span class="s">L’appel et le chronomètre sont gardés sur cet appareil.</span>'+ICON('right')+'</button>':'')+
   (next?(function(l){var n=l.riders.length;return '<div class="card tr-next"><div class="tr-nl"><div class="eyebrow">'+(mm(l.start)<=t?'En ce moment':'Prochaine reprise')+'</div><h2>'+hm(l.start)+' · '+E(l.title)+'</h2><p>'+E(arenaName(l.arena))+' · '+pl(n,'cavalier')+' · avec '+E(D.name(l.coach))+'</p>'+
     '<div class="tr-cues">'+l.riders.map(function(r){return l.horses[r]}).filter(function(x,i,a){return x&&a.indexOf(x)===i}).map(function(hid){var c=cuesOf(hid)[0];return c?'<span class="'+c.k+'"><b>'+E(fn(D.horse(hid)))+'</b> '+E(c.t)+'</span>':''}).filter(Boolean).slice(0,3).join('')+'</div>'+
     '<button class="btn pri lg tr-start" data-open="'+l.id+'">'+ICON('play')+'Démarrer le cours en direct</button></div>'+
     '<ul class="tr-how"><li>'+ICON('right','sm')+'<span><b>Glissez à droite</b> : présent</span></li><li>'+ICON('left','sm')+'<span><b>Glissez à gauche</b> : absent, sa séance lui est rendue</span></li><li>'+ICON('stopwatch','sm')+'<span><b>Chronomètre</b> et minuteur d’exercice</span></li><li>'+ICON('edit','sm')+'<span><b>Une note par cavalier</b> à la fin</span></li></ul></div>'})(next):'')+
   '<div class="tr-sech"><h2>Aujourd’hui</h2></div><div class="card list">'+(show.length?show.map(function(l){var c=callOf(l.id),past=mm(l.start)+l.dur<=t;
      return '<button class="li click tr-lr'+(past&&!c?' past':'')+'" data-open="'+l.id+'"><span class="tr-lt num">'+hm(l.start)+'</span><div class="grow" style="min-width:0"><div class="t ellip"><b>'+E(l.title)+'</b></div><div class="s mut ellip">'+E(arenaName(l.arena))+' · '+pl(l.riders.length,'cavalier')+' · '+E(D.name(l.coach))+'</div></div>'+
       (c&&c.done?U.chip(c.present.length+' présents · '+c.absent.length+' absent'+(c.absent.length>1?'s':''),'ok',true):U.chip(past?'Terminée':mm(l.start)<=t?'En cours':'À venir',past?'':mm(l.start)<=t?'warn':'',true))+'</button>'}).join(''):U.empty('whistle','Aucune reprise aujourd’hui','Les reprises du planning s’affichent ici le jour même.'))+'</div>';
  on(el,'[data-open]',function(b){ceOpen(b.getAttribute('data-open'),el,ctx)});
  if(run&&run.open&&!(CE.el&&CE.el.isConnected&&CE.page&&CE.page.isConnected))ceOpen(run.lesson,el,ctx,true)}

function ceOpen(lid,page,ctx,quiet){var l=D.lessons.find(function(x){return x.id===lid});if(!l)return;var app=P.app();
  var run=getRun();if(!run||run.lesson!==lid){var c=callOf(lid);run={lesson:lid,start:null,paused:0,pausedAt:null,step:c&&c.done?'bilan':'appel',att:{},notes:{},timer:null,open:true};
    if(c){c.present.forEach(function(r){run.att[r]='p'});c.absent.forEach(function(r){run.att[r]='a'});Object.keys(c.notes||{}).forEach(function(r){run.notes[r]=c.notes[r]})}}
  run.open=true;setRun(run);
  var ov=document.createElement('div');ov.className='tr-full';ov.setAttribute('role','dialog');ov.setAttribute('aria-label','Cours en direct');app.appendChild(ov);CE.el=ov;CE.page=page;
  if(!quiet&&!P.RM&&ov.animate)ov.animate([{opacity:0,transform:'scale(.98)'},{opacity:1,transform:'none'}],{duration:280,easing:'cubic-bezier(.2,.8,.2,1)'});
  var wake=null;function wakeOn(){try{if(navigator.wakeLock&&navigator.wakeLock.request)navigator.wakeLock.request('screen').then(function(w){wake=w}).catch(function(){})}catch(e){}}wakeOn();
  var vis=function(){if(document.visibilityState==='visible'&&ov.isConnected)wakeOn()};document.addEventListener('visibilitychange',vis);
  var tick=setInterval(paint,1000);
  /* fermé tout seul si l'écran change (navigation, changement d'espace) */
  var mo=new MutationObserver(function(){if(!page.isConnected||!ov.isConnected)close(true)});mo.observe(app,{childList:true,subtree:true});
  function close(silent){clearInterval(tick);mo.disconnect();document.removeEventListener('visibilitychange',vis);try{if(wake)wake.release()}catch(e){}wake=null;
    if(!silent)try{if(document.fullscreenElement&&document.exitFullscreen)document.exitFullscreen().catch(function(){})}catch(e){}
    if(ov.isConnected)ov.remove();if(CE.el===ov){CE.el=null;CE.page=null}var r=getRun();if(r&&!silent){r.open=false;setRun(r)}if(!silent&&page.isConnected){P.rerender()}}
  function el0(){return run.start?Math.max(0,((run.pausedAt||Date.now())-run.start-run.paused)/1000):0}
  function clock(s){s=Math.floor(s);return p2(Math.floor(s/60))+':'+p2(s%60)}
  function phase(s){var m=s/60,acc=0;for(var i=0;i<PHASES.length;i++){acc+=PHASES[i][1];if(m<acc)return i}return PHASES.length-1}
  function riders(){return l.riders.map(function(r){return {r:r,m:D.member(r)||D.person(r)||{first:'Cavalier',last:''},h:D.horse(l.horses[r])}})}
  function counts(){var p=0,a=0;l.riders.forEach(function(r){if(run.att[r]==='p')p++;else if(run.att[r]==='a')a++});return {p:p,a:a,todo:l.riders.length-p-a}}
  function save(){setRun(run)}
  function setAtt(r,v){var was=run.att[r];if(was===v)return;run.att[r]=v;save();var m=D.member(r);
    var cr=D.lessonCredits.find(function(x){return x.member===r&&x.lesson===lid&&x.date===today()});
    if(v==='a'&&!cr&&m){var k=creditKind(m);D.lessonCredits.push({id:uid('cr'),member:r,lesson:lid,date:today(),kind:k[0],by:ctx.role==='employe'?D.me.employe:D.me.gerant,reason:'Absence à la reprise de '+hm(l.start)});saved();P.toast('Crédit rendu à '+E(m.first)+' : '+k[1],{icon:'gift'})}
    if(v!=='a'&&cr){D.lessonCredits.splice(D.lessonCredits.indexOf(cr),1);saved()}vib(v==='a'?[20,40,20]:18)}
  function header(){var s=el0(),rem=Math.max(0,(l.dur+(run.ext||0))*60-s),c=counts();
    return '<header class="tr-fh"><button class="tr-x" data-close title="Quitter le plein écran">'+ICON('x')+'</button><div class="grow tr-ft"><b>'+hm(l.start)+' · '+E(l.title)+'</b><small>'+E(arenaName(l.arena))+' · '+c.p+' présent'+(c.p>1?'s':'')+(c.a?' · '+c.a+' absent'+(c.a>1?'s':''):'')+'</small></div>'+netHtml()+
     '<button class="tr-x fs" data-fs title="Plein écran">'+ICON('expand')+'</button><div class="tr-clk'+(run.start?'':' idle')+(run.pausedAt?' pz':'')+'" data-clk><span class="num">'+clock(s)+'</span><small>'+(run.start?(rem?Math.ceil(rem/60)+NB+'min restantes':'Temps écoulé'):'Pas démarré')+'</small></div></header>'+
     '<nav class="tr-tabs">'+[['appel','Appel',c.todo?c.todo+' à pointer':'Fait'],['seance','Séance',run.start?PHASES[phase(s)][0]:'À lancer'],['bilan','Bilan','Notes']].map(function(x,i){return '<button data-step="'+x[0]+'" aria-pressed="'+(run.step===x[0])+'"><i>'+(i+1)+'</i><span><b>'+x[1]+'</b><small>'+x[2]+'</small></span></button>'}).join('')+'</nav>'}
  function bodyAppel(){var c=counts();return '<div class="tr-fb"><div class="tr-hint">'+ICON('swap','sm')+'<span>Glissez un cavalier à droite s’il est là, à gauche s’il est absent. Ou touchez les gros boutons.</span></div>'+
     riders().map(function(x){var a=run.att[x.r],cu=x.h?cuesOf(x.h.id)[0]:null,cr=a==='a'&&x.m?creditKind(x.m)[1]:'';
      return '<div class="tr-rc'+(a==='p'?' p':a==='a'?' a':'')+'" data-rc="'+x.r+'"><div class="tr-rci">'+U.av(x.m)+'<div class="grow"><b>'+E(x.m.first+' '+x.m.last)+'</b><small>'+(x.h?E(x.h.name):'Cheval à attribuer')+(cu?' · <span class="'+cu.k+'">'+E(cu.t)+'</span>':'')+'</small>'+(cr?'<em>'+ICON('gift','sm')+'Crédit rendu : '+cr+'</em>':'')+'</div>'+
       '<button class="tr-yn n" data-att="a" title="Absent" aria-pressed="'+(a==='a')+'">'+ICON('x')+'</button><button class="tr-yn y" data-att="p" title="Présent" aria-pressed="'+(a==='p')+'">'+ICON('check')+'</button></div></div>'}).join('')+'</div>'+
     '<footer class="tr-ff">'+(c.todo?'<button class="tr-bb ghost" data-allp>'+ICON('checkc')+'Tous les autres présents</button>':'')+'<button class="tr-bb pri" data-step="seance" data-start>'+ICON('play')+(run.start?'Revenir à la séance':'Lancer la séance')+'</button></footer>'}
  function bodySeance(){var s=el0(),ph=phase(s),tm=run.timer,left=tm?Math.max(0,tm.end-(run.pausedAt||Date.now()))/1000:0;
    return '<div class="tr-fb"><div class="tr-phs2">'+PHASES.map(function(p,i){var st=PHASES.slice(0,i).reduce(function(a,x){return a+x[1]},0)*60,pct=run.start?Math.max(0,Math.min(100,(s-st)/(p[1]*60)*100)):0;
       return '<div class="tr-pz'+(i===ph&&run.start?' on':'')+'" style="flex:'+p[1]+'"><span><b>'+p[0]+'</b><small>'+p[1]+NB+'min</small></span><i><i style="width:'+pct+'%"></i></i></div>'}).join('')+'</div>'+
     '<div class="tr-tmr'+(tm&&left<=0?' done':'')+'"><div class="tr-tmrv"><small>'+(tm?E(tm.l):'Minuteur d’exercice')+'</small><b class="num">'+(tm?clock(left):'--:--')+'</b></div><div class="tr-pre">'+[['Pas',5],['Trot',3],['Galop',2],['Pause',1]].map(function(x){return '<button data-tm="'+x[1]+'" data-tl="'+x[0]+' '+x[1]+NB+'min">'+x[0]+'<small>'+x[1]+NB+'min</small></button>'}).join('')+'</div></div>'+
     '<div class="tr-sl">'+riders().filter(function(x){return run.att[x.r]!=='a'}).map(function(x){var cs=x.h?cuesOf(x.h.id):[];
       return '<div class="tr-sr"><div class="grow"><b>'+(x.h?E(x.h.name):'Cheval à attribuer')+'</b><small>'+E(x.m.first+' '+x.m.last)+'</small></div><div class="tr-cl">'+(cs.length?cs.slice(0,2).map(function(c){return '<span class="'+c.k+'">'+E(c.t)+'</span>'}).join(''):'<span class="ok">Aucune consigne</span>')+'</div></div>'}).join('')+'</div></div>'+
     '<footer class="tr-ff">'+(run.start?'<button class="tr-bb ghost" data-pause>'+ICON(run.pausedAt?'play':'pause')+(run.pausedAt?'Reprendre':'Pause')+'</button><button class="tr-bb ghost" data-plus>'+ICON('plus')+'5 min</button>':'')+
      (run.start?'<button class="tr-bb pri" data-step="bilan">'+ICON('edit')+'Finir et noter</button>':'<button class="tr-bb pri" data-go2>'+ICON('play')+'Démarrer le chronomètre</button>')+'</footer>'}
  function bodyBilan(){var pres=riders().filter(function(x){return run.att[x.r]==='p'||!run.att[x.r]});
    return '<div class="tr-fb">'+(pres.length?pres.map(function(x){var n=run.notes[x.r]||{};
      return '<div class="tr-br" data-br="'+x.r+'"><div class="tr-bh">'+U.av(x.m)+'<div class="grow"><b>'+E(x.m.first+' '+x.m.last)+'</b><small>'+(x.h?E(x.h.name):'')+'</small></div></div>'+
       '<div class="tr-moods">'+MOODS.map(function(m){return '<button data-mood="'+m[0]+'" aria-pressed="'+(n.mood===m[0])+'" class="k-'+m[0]+'">'+ICON(m[2])+m[1]+'</button>'}).join('')+'</div>'+
       '<div class="tr-tags">'+TAGS.map(function(t){return '<button data-tag="'+E(t)+'" aria-pressed="'+((n.tags||[]).indexOf(t)>=0)+'">'+t+'</button>'}).join('')+'</div>'+
       '<input class="in tr-word" data-word placeholder="Un mot pour '+(x.m.minor?'la famille':'le cavalier')+' (facultatif)" value="'+E(n.word||'')+'"></div>'}).join(''):U.empty('members','Personne n’est présent','Pointez l’appel pour noter les cavaliers.'))+'</div>'+
     '<footer class="tr-ff"><button class="tr-bb pri" data-finish>'+ICON('checkc')+'Enregistrer le bilan et terminer</button></footer>'}
  function paint(full){if(!ov.isConnected)return;var st=run.step,s=el0();
    /* le minuteur sonne une fois à la fin */
    if(run.timer&&!run.timer.rung&&!run.pausedAt&&Date.now()>=run.timer.end){run.timer.rung=true;save();vib([120,60,120]);P.toast(E(run.timer.l)+' : terminé',{icon:'stopwatch'})}
    var ph=run.start?phase(s):-1;if(run.start&&run.ph!=null&&ph!==run.ph){vib(60);P.toast('Place '+['à la détente','au travail','au retour au calme'][ph]+' ('+PHASES[ph][1]+NB+'min)',{icon:'stopwatch'})}run.ph=ph;
    if(full==null&&ov.firstChild){var h=$('.tr-fh',ov),nv=$('.tr-tabs',ov);if(h){var tmp=document.createElement('div');tmp.innerHTML=header();h.replaceWith(tmp.firstChild);nv.replaceWith(tmp.firstChild)}
      if(st==='seance'){var tv=$('.tr-tmr',ov),pz=$('.tr-phs2',ov);if(tv){var t2=document.createElement('div');t2.innerHTML=bodySeance();tv.replaceWith($('.tr-tmr',t2));pz.replaceWith($('.tr-phs2',t2))}}return}
    var y=($('.tr-fb',ov)||{}).scrollTop||0;
    ov.innerHTML=header()+(st==='appel'?bodyAppel():st==='seance'?bodySeance():bodyBilan());var fb=$('.tr-fb',ov);if(fb&&full!=='top')fb.scrollTop=y;
    if(fb&&!P.RM)$$('.tr-rc,.tr-sr,.tr-br',fb).forEach(function(x,i){x.style.setProperty('--i',Math.min(i,8))})}
  paint(true);
  /* ----- gestes ----- */
  on(ov,'[data-close]',function(){close()});
  on(ov,'[data-fs]',function(){var de=document.documentElement;try{if(document.fullscreenElement){document.exitFullscreen()}else if(de.requestFullscreen){var p=de.requestFullscreen({navigationUI:'hide'});if(p&&p.catch)p.catch(function(){P.toast('Votre navigateur garde ses barres : ajoutez Stabl à l’écran d’accueil pour un vrai plein écran',{icon:'expand'})})}else P.toast('Sur iPhone, ajoutez Stabl à l’écran d’accueil : l’appli s’ouvre alors en plein écran',{icon:'expand',ms:5000})}catch(e){}});
  on(ov,'[data-step]',function(b){run.step=b.getAttribute('data-step');if(b.hasAttribute('data-start')&&!run.start){run.start=Date.now();run.paused=0;run.pausedAt=null;vib(40)}save();paint('top');var fb=$('.tr-fb',ov);if(fb)fb.scrollTop=0});
  on(ov,'[data-att]',function(b){var r=b.closest('[data-rc]').getAttribute('data-rc'),v=b.getAttribute('data-att');setAtt(r,run.att[r]===v?null:v);paint(true)});
  on(ov,'[data-allp]',function(){l.riders.forEach(function(r){if(!run.att[r])run.att[r]='p'});save();vib(30);paint(true);P.toast('Tout le monde est là',{icon:'checkc'})});
  on(ov,'[data-go2]',function(){run.start=Date.now();run.paused=0;run.pausedAt=null;save();vib(40);paint(true);P.toast('Chronomètre lancé : '+PHASES[0][0].toLowerCase()+' '+PHASES[0][1]+NB+'min',{icon:'stopwatch'})});
  on(ov,'[data-pause]',function(){if(run.pausedAt){var d=Date.now()-run.pausedAt;run.paused+=d;if(run.timer)run.timer.end+=d;run.pausedAt=null}else run.pausedAt=Date.now();save();paint(true)});
  on(ov,'[data-plus]',function(){run.ext=(run.ext||0)+5;save();paint(true);P.toast('5 minutes de plus : fin à '+hm(fromMin(mm(l.start)+l.dur+run.ext)),{icon:'plus'})});
  on(ov,'[data-tm]',function(b){var mn=+b.getAttribute('data-tm');if(!run.start){run.start=Date.now();run.paused=0}run.timer={l:b.getAttribute('data-tl'),end:Date.now()+mn*60000,rung:false};save();vib(20);paint(true)});
  on(ov,'[data-mood]',function(b){var r=b.closest('[data-br]').getAttribute('data-br'),n=run.notes[r]=run.notes[r]||{};n.mood=n.mood===b.getAttribute('data-mood')?null:b.getAttribute('data-mood');save();$$('[data-mood]',b.parentNode).forEach(function(x){x.setAttribute('aria-pressed',x.getAttribute('data-mood')===n.mood)})});
  on(ov,'[data-tag]',function(b){var r=b.closest('[data-br]').getAttribute('data-br'),n=run.notes[r]=run.notes[r]||{},t=b.getAttribute('data-tag');n.tags=n.tags||[];var i=n.tags.indexOf(t);if(i<0)n.tags.push(t);else n.tags.splice(i,1);save();b.setAttribute('aria-pressed',i<0)});
  ov.addEventListener('input',function(e){var w=e.target.closest('[data-word]');if(!w)return;var r=w.closest('[data-br]').getAttribute('data-br');(run.notes[r]=run.notes[r]||{}).word=w.value;save()});
  on(ov,'[data-finish]',function(){var c=callOf(lid);if(!c){c={id:uid('lc'),lesson:lid,date:today()};D.lessonCalls.push(c)}
    c.present=l.riders.filter(function(r){return run.att[r]!=='a'});c.absent=l.riders.filter(function(r){return run.att[r]==='a'});c.notes=run.notes;c.dur=Math.round(el0()/60);c.by=ctx.role==='employe'?D.me.employe:D.me.gerant;c.done=true;
    var nn=Object.keys(run.notes).filter(function(r){var n=run.notes[r];return n&&(n.mood||(n.tags&&n.tags.length)||n.word)}).length;
    P.store.set(runKey(),null);saved();close(true);P.rerender();P.toast('<span class="strass"></span>Reprise terminée : '+c.present.length+' présents, '+pl(nn,'note')+' envoyée'+(nn>1?'s':'')+' aux cavaliers'+(isOff()?' au retour du réseau':''),{icon:'checkc',ms:4800})});
  /* glisser une carte d'appel : à droite présent, à gauche absent (le défilement vertical reste libre) */
  var sw=null;
  ov.addEventListener('pointerdown',function(e){var c=e.target.closest('.tr-rc');if(!c||e.target.closest('button'))return;sw={c:c,x:e.clientX,y:e.clientY,dx:0,on:false}});
  ov.addEventListener('pointermove',function(e){if(!sw)return;var dx=e.clientX-sw.x,dy=e.clientY-sw.y;if(!sw.on){if(Math.abs(dy)>12&&Math.abs(dy)>Math.abs(dx)){sw=null;return}if(Math.abs(dx)<10)return;sw.on=true;sw.c.classList.add('drag')}
    sw.dx=dx;sw.c.style.transform='translateX('+dx+'px)';sw.c.classList.toggle('to-p',dx>60);sw.c.classList.toggle('to-a',dx<-60)});
  function swEnd(){if(!sw)return;var s=sw;sw=null;s.c.classList.remove('drag','to-p','to-a');s.c.style.transform='';if(!s.on)return;if(Math.abs(s.dx)>60){setAtt(s.c.getAttribute('data-rc'),s.dx>0?'p':'a');paint(true)}}
  ov.addEventListener('pointerup',swEnd);ov.addEventListener('pointercancel',swEnd);
  /* toucher la carte (pas les boutons) : présent, puis absent */
  on(ov,'.tr-rci',function(b,e){if(e.target.closest('button'))return;var r=b.closest('[data-rc]').getAttribute('data-rc');setAtt(r,run.att[r]==='p'?'a':'p');paint(true)})}

/* =====================================================================
   Styles (préfixe tr-)
   ===================================================================== */
P.css(`
.tr-p{font-size:15.5px;line-height:1.55;color:var(--ink-2);margin:0}
.tr-net{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 14px 0 11px;border-radius:999px;background:var(--ok-pale);color:var(--ok);font:600 14px var(--f-text);white-space:nowrap;max-width:100%;transition:background var(--t-2),color var(--t-2)}
.tr-net span{overflow:hidden;text-overflow:ellipsis}
.tr-net.off{background:var(--warn-pale);color:var(--warn)}
.tr-net.off svg.i{animation:tr-blink 1.6s infinite}
@keyframes tr-blink{50%{opacity:.35}}
.tr-wk{display:grid;gap:10px;font-size:15px}.tr-wk span{display:flex;align-items:center;gap:10px}
.tr-eh{display:flex;align-items:flex-start;gap:12px;justify-content:space-between}.tr-eh>.ph{flex:1;min-width:0}.tr-eh>.tr-net{margin-top:14px;flex:none}
@container main (max-width:760px){.tr-eh{flex-direction:column;gap:0}.tr-eh>.tr-net{margin:-8px 0 14px}}

/* gérant : plan, tableau des prés */
.tr-alerts{display:grid;gap:8px;margin-bottom:16px}.tr-alerts .note{align-items:center}.tr-alerts .note .btn{flex:none}
.tr-allok{margin-bottom:16px}
.tr-top{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:16px;margin-bottom:8px}
@container main (max-width:1000px){.tr-top{grid-template-columns:minmax(0,1fr)}}
.tr-map{position:relative;aspect-ratio:16/9;border-radius:20px;background:color-mix(in srgb,var(--hz-bg) 45%,var(--surface-2));overflow:hidden}
.tr-bld{position:absolute;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;border-radius:12px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2);font:600 13px var(--f-text);color:var(--mut)}
.tr-bld.ar{background:var(--surface-3,var(--bg-2))}
.tr-plot{position:absolute;border-radius:16px;padding:8px 10px;display:flex;flex-direction:column;align-items:flex-start;gap:4px;text-align:left;background:var(--g-bg);box-shadow:inset 0 0 0 1.5px var(--g-l);color:var(--ink);transition:transform .35s var(--e-spring),opacity var(--t-2),box-shadow var(--t-2);overflow:hidden;min-width:0}
.tr-plot:hover{transform:scale(1.015);box-shadow:inset 0 0 0 2px var(--g-c)}
.tr-plot.dim{opacity:.45}.tr-plot.hi{box-shadow:inset 0 0 0 3px var(--hz);z-index:1}
.tr-plot.sm{flex-direction:row;flex-wrap:wrap;align-content:flex-start;padding:6px}.tr-plot.sm .tr-dots{margin-top:0}.tr-plot.sm .tr-dots i{width:11px;height:11px}
.tr-plot .tr-pl{font:600 13px/1.2 var(--f-text);max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.tr-dots{display:flex;flex-wrap:wrap;gap:4px;margin-top:auto}.tr-dots i{width:13px;height:13px;border-radius:50%;background:var(--c);box-shadow:0 0 0 2px var(--surface)}
.g-bonne{--g-bg:color-mix(in srgb,var(--ok-pale) 80%,var(--surface));--g-l:color-mix(in srgb,var(--ok) 30%,transparent);--g-c:var(--ok)}
.g-moyenne{--g-bg:color-mix(in srgb,var(--warn-pale) 75%,var(--surface));--g-l:color-mix(in srgb,var(--warn) 30%,transparent);--g-c:var(--warn)}
.g-rase{--g-bg:color-mix(in srgb,var(--bad-pale) 70%,var(--surface));--g-l:color-mix(in srgb,var(--bad) 28%,transparent);--g-c:var(--bad)}
.g-repos{--g-bg:repeating-linear-gradient(135deg,var(--surface-2) 0 10px,var(--surface) 10px 20px);--g-l:var(--line-2);--g-c:var(--mut)}
.tr-plot.g-repos{background:var(--g-bg)}
.tr-leg{display:flex;flex-wrap:wrap;gap:14px;margin-top:12px;font:500 13.5px var(--f-text);color:var(--mut)}.tr-leg span{display:inline-flex;align-items:center;gap:7px}
.tr-leg i{width:14px;height:14px;border-radius:5px;background:var(--g-bg);box-shadow:inset 0 0 0 1.5px var(--g-l)}
.tr-pn{flex:none;min-width:30px;height:30px;padding:0 6px;border-radius:10px;display:inline-grid;place-items:center;background:var(--navy);color:var(--on-navy);font:800 15px var(--f-display);font-variant-numeric:tabular-nums}
.tr-pn.sm{min-width:26px;height:26px;font-size:14px;border-radius:9px}.tr-pn svg.i{width:18px;height:18px}
.tr-rl{display:grid;gap:4px}
.tr-rr{display:flex;align-items:center;gap:10px;padding:7px 0}.tr-rr+.tr-rr{border-top:1px solid var(--line)}.tr-rr .grow{min-width:0}.tr-rr .btn{flex:none}
@container main (max-width:600px){.tr-rr{flex-wrap:wrap;row-gap:4px}.tr-rr .grow{flex:1 1 calc(100% - 44px)}.tr-rr .tr-grass{margin-left:34px}.tr-rr .btn{margin-left:auto}}
.tr-grass{flex:none;width:44px;height:8px;border-radius:4px;background:var(--surface-3,var(--bg-2));overflow:hidden}.tr-grass i{display:block;height:100%;width:var(--v);background:var(--g-c);border-radius:4px}
.tr-tip{margin-top:12px}
.tr-sech{display:flex;align-items:baseline;gap:12px 16px;flex-wrap:wrap;justify-content:space-between;margin:26px 0 12px}
.tr-sech h2{font:800 24px/1.1 var(--f-display);letter-spacing:-.02em;margin:0}
.tr-board{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;align-items:start}
.tr-pc{padding:16px;display:flex;flex-direction:column;gap:12px;transition:box-shadow var(--t-2),background var(--t-2),transform .35s var(--e-spring)}
.tr-pc header{display:flex;align-items:flex-start;gap:10px}.tr-pc header .tr-pn{margin-top:2px}.tr-pc header .btn.icon{flex:none;margin:-6px -6px 0 0}.tr-pc header .grow{min-width:0}.tr-pc header .chip{flex:none}
.tr-pt{font:700 16px/1.25 var(--f-text);color:var(--ink);text-align:left;max-width:100%;display:block}.tr-pt:hover{color:var(--acc)}
.tr-pt0{font:700 16px/1.2 var(--f-text)}
.tr-cap{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;font-size:14px;color:var(--mut)}.tr-cap b{color:var(--ink);font-size:16px}
.tr-hs{display:flex;flex-wrap:wrap;gap:8px;min-height:44px;align-content:flex-start;border-radius:14px;padding:2px}
.tr-pc.tr-over{box-shadow:inset 0 0 0 2px var(--acc),var(--shadow-2);background:color-mix(in srgb,var(--acc-bg) 40%,var(--surface));transform:scale(1.01)}
.tr-pc.rest{background:repeating-linear-gradient(135deg,var(--surface) 0 14px,var(--surface-2) 14px 28px)}
.tr-pc.pool{grid-column:1/-1;background:var(--surface-2)}
.tr-pc.tr-flash{animation:tr-flash 1.2s var(--e-out)}
@keyframes tr-flash{20%{box-shadow:inset 0 0 0 3px var(--acc),var(--shadow-2)}}
.tr-none{font-size:14px;color:var(--mut-2);display:flex;align-items:center;min-height:40px;padding:0 4px}
.tr-hc{height:40px;padding:0 10px 0 7px;border-radius:12px;display:inline-flex;align-items:center;gap:7px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2),var(--shadow-1);font:600 14.5px var(--f-text);color:var(--ink);cursor:grab;touch-action:none;user-select:none;transition:transform .3s var(--e-spring),box-shadow var(--t-2),opacity var(--t-2)}
.app.mobile .tr-hc{touch-action:auto;height:44px}
.tr-hc:hover{box-shadow:inset 0 0 0 1px var(--acc-line,var(--acc)),var(--shadow-2)}
.tr-hc:active{transform:scale(.95)}
.tr-hc i{width:22px;height:22px;border-radius:7px;background:var(--c)}
.tr-hc small{font:700 13px var(--f-text);color:var(--mut);min-width:14px}
.tr-hc.out i{box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--ok)}
.tr-hc.warn{box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--warn) 70%,transparent)}
.tr-hc.bad{box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--bad) 75%,transparent);background:var(--bad-pale)}
.tr-hc.lift{opacity:.35}
.tr-ghost{position:fixed;left:0;top:0;z-index:999;pointer-events:none;box-shadow:var(--shadow-3);opacity:.96}
.tr-pw{display:grid;gap:6px;font-size:13.5px;line-height:1.4}.tr-pw span{display:flex;gap:6px;align-items:flex-start}.tr-pw svg.i{flex:none;width:16px;height:16px;margin-top:1px}
.tr-pw .bad{color:var(--bad)}.tr-pw .warn{color:var(--warn)}
.tr-rules .li .grow{min-width:0}.tr-auto{background:var(--surface-2)}
.tr-who{display:flex;align-items:center;gap:12px;margin-bottom:14px}.tr-who b{font-size:16px}
.tr-opts{display:grid;gap:8px}
.tr-opt{display:flex;align-items:center;gap:12px;min-height:58px;padding:8px 14px;border-radius:16px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2);text-align:left;transition:background var(--t-2),transform .3s var(--e-spring)}
.tr-opt:active{transform:scale(.98)}.tr-opt:hover{background:var(--surface-2)}
.tr-opt b{display:block;font-size:15.5px}.tr-opt small{display:block;font-size:13.5px;color:var(--mut);margin-top:2px}
.tr-opt.sel{box-shadow:inset 0 0 0 2px var(--acc);background:var(--acc-bg)}.tr-opt.no small{color:var(--warn)}

/* employé : sorties au pré */
.tr-eseg{margin:-6px 0 16px}
.tr-urg{display:grid;gap:10px;margin-bottom:18px}
.tr-ur{display:flex;align-items:center;gap:14px;min-height:76px;padding:12px 16px;border-radius:22px;background:var(--bad-pale);color:var(--bad);text-align:left;width:100%;animation:tr-pulse 2.4s infinite}
.tr-ur b{display:block;font:700 17px/1.25 var(--f-text);color:var(--ink)}.tr-ur small{display:block;font-size:14px;color:var(--ink-2);margin-top:3px}
.tr-urb{flex:none;width:48px;height:48px;border-radius:16px;display:grid;place-items:center;background:var(--bad);color:var(--surface)}
.tr-go{flex:none;width:52px;height:52px;border-radius:50%;display:grid;place-items:center;background:var(--surface);color:var(--bad)}
@keyframes tr-pulse{0%,100%{box-shadow:0 0 0 0 color-mix(in srgb,var(--bad) 35%,transparent)}60%{box-shadow:0 0 0 8px transparent}}
.tr-es{margin-bottom:18px}
.tr-es header{display:flex;align-items:center;gap:12px;margin-bottom:8px}.tr-es header .grow{min-width:0}.tr-es header b{display:block;font-size:16.5px}.tr-es header small{display:block;font-size:13.5px;color:var(--mut);margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tr-es header .btn{flex:none}
.tr-er{display:flex;align-items:center;gap:14px;width:100%;min-height:72px;padding:10px 12px 10px 14px;border-radius:20px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);text-align:left;margin-bottom:8px;transition:transform .3s var(--e-spring),background var(--t-2),box-shadow var(--t-2)}
.tr-er:active{transform:scale(.97)}
.tr-er .grow{min-width:0}.tr-er b{display:block;font:700 16.5px/1.25 var(--f-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tr-er small{display:block;font-size:14px;color:var(--mut);margin-top:3px}
.tr-er .av{width:44px;height:44px}
.tr-big{flex:none;width:56px;height:56px;border-radius:18px;display:grid;place-items:center;background:var(--surface-3,var(--bg-2));color:var(--ink-2)}
.tr-big svg.i{width:26px;height:26px}
.tr-er.k-out{background:color-mix(in srgb,var(--ok-pale) 70%,var(--surface));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ok) 30%,transparent)}.tr-er.k-out .tr-big{background:var(--ok);color:var(--surface)}.tr-er.k-out small{color:var(--ok)}
.tr-er.k-back{opacity:.7}.tr-er.k-back .tr-big{background:var(--surface-2);color:var(--ok)}
.tr-er.k-todo .tr-big{background:var(--navy);color:var(--on-navy)}
.tr-er.k-stay{opacity:.55}
.tr-er.late{box-shadow:inset 0 0 0 2px var(--bad)}.tr-er.late small{color:var(--bad)}
.tr-ehelp{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.45;color:var(--mut);margin:6px 2px 16px}.tr-ehelp svg.i{flex:none;margin-top:1px}
.tr-eacts .btn{white-space:normal;height:auto;min-height:46px;padding:10px 16px;text-align:left}

/* propriétaire */
.tr-ah{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.1fr);gap:20px;padding:24px;border-radius:28px;margin-bottom:16px}
@container main (max-width:860px){.tr-ah{grid-template-columns:minmax(0,1fr);padding:20px}}
.tr-ahl{display:flex;flex-direction:column;gap:12px;min-width:0}
.tr-ah h2{font:800 28px/1.12 var(--f-display);letter-spacing:-.025em;margin:0;color:var(--ink)}
.tr-ah p{margin:0;font-size:15.5px;line-height:1.5;color:var(--ink-2)}
.tr-ahm .tr-map{background:color-mix(in srgb,var(--surface) 55%,transparent)}
.tr-live{display:inline-flex;align-items:center;gap:8px;height:32px;padding:0 13px;border-radius:999px;background:var(--surface);color:var(--hz-ink);font:700 13.5px var(--f-text);align-self:flex-start}
.tr-live i{width:9px;height:9px;border-radius:50%;background:var(--ok);animation:tr-dot 2s infinite}
.tr-live.in i{background:var(--mut);animation:none}
@keyframes tr-dot{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--ok) 55%,transparent)}100%{box-shadow:0 0 0 9px transparent}}
.tr-ag{--g:16px}
.tr-mate{display:flex;align-items:center;gap:12px;padding:8px 0}.tr-mate .grow{min-width:0}.tr-mate b{font-size:15px}.tr-mate>svg.i{color:var(--cr)}
.tr-notif{display:flex;align-items:center;gap:14px;padding-top:14px;margin-top:8px;border-top:1px solid var(--line)}.tr-notif b{display:block;font-size:15px}.tr-notif small{display:block;font-size:13.5px;color:var(--mut);margin-top:2px}
.tr-aacts{margin-top:16px;--g:10px}

/* ventes */
.tr-kpis{margin-bottom:18px}
.tr-vg{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:16px;align-items:start}
@container main (max-width:1000px){.tr-vg{grid-template-columns:minmax(0,1fr)}}
.tr-ad{display:grid;grid-template-columns:180px minmax(0,1fr);gap:18px;padding:14px;cursor:pointer;transition:box-shadow var(--t-2),transform .35s var(--e-spring)}
.tr-ad:hover{box-shadow:inset 0 0 0 1px var(--line-2),var(--shadow-2)}
.tr-ad.sold{opacity:.7}
@container main (max-width:560px){.tr-ad{grid-template-columns:minmax(0,1fr)}.tr-ad .tr-ph.th{aspect-ratio:16/9;height:auto}}
.tr-adb{display:flex;flex-direction:column;gap:6px;min-width:0;padding:4px 4px 2px 0}
.tr-adb h3{font:800 22px/1.15 var(--f-display);letter-spacing:-.02em;margin:0}
.tr-price{font:800 30px/1.05 var(--f-display);letter-spacing:-.03em;margin-top:6px}
.tr-adm{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:14px;color:var(--mut);margin-top:6px}.tr-adm span{display:inline-flex;align-items:center;gap:6px}
.tr-adacts{margin-top:10px}
.tr-ph{display:block;position:relative;border-radius:18px;overflow:hidden;background:var(--d-bg,var(--surface-2))}
.tr-ph img{display:block;width:100%;height:100%;object-fit:cover}
.tr-ph.th{width:100%;height:100%;min-height:150px}
.tr-ph.fake{color:var(--d-ink)}
.tr-ph.fake .hz1{position:absolute;left:0;right:0;bottom:0;height:34%;background:color-mix(in srgb,var(--d) 28%,var(--d-bg))}
.tr-ph.fake .hz2{position:absolute;right:12%;top:14%;width:18%;aspect-ratio:1;border-radius:50%;background:color-mix(in srgb,var(--surface) 70%,transparent)}
.tr-ph.fake svg{position:absolute;left:50%;bottom:16%;width:46%;height:auto;max-height:70%;transform:translateX(-50%)}
.tr-ph.xs{width:64px;height:64px;flex:none;border-radius:14px}
.tr-ld{width:100%;text-align:left;align-items:center}.tr-ldr{display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex:none}
.tr-tri{display:block;text-align:left;width:100%}.tr-tri b{display:block;font-size:15px}.tr-tri span{display:block;margin-top:2px}
.tr-facts{display:grid;grid-template-columns:repeat(auto-fill,minmax(120px,1fr));gap:8px}
.tr-facts>div{padding:10px 12px;border-radius:14px;background:var(--surface-2);min-width:0}.tr-facts small{display:block;font-size:13px;color:var(--mut)}.tr-facts b{display:block;font-size:15px;margin-top:2px;overflow:hidden;text-overflow:ellipsis}
.tr-phs{display:flex;flex-wrap:wrap;gap:10px}
.tr-phw{position:relative;width:110px;height:82px}.tr-phw .tr-ph{width:100%;height:100%}
.tr-phx{position:absolute;top:4px;right:4px;width:30px;height:30px;border-radius:10px;display:grid;place-items:center;background:color-mix(in srgb,var(--surface) 88%,transparent);color:var(--ink)}
.tr-phadd{width:110px;height:82px;border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:4px;box-shadow:inset 0 0 0 1.5px var(--line-2);color:var(--mut);font:600 14px var(--f-text);cursor:pointer;position:relative}
.tr-phadd:hover{color:var(--acc);box-shadow:inset 0 0 0 1.5px var(--acc)}
.tr-phadd input{position:absolute;inset:0;opacity:0;cursor:pointer}
.tr-ta{height:auto;min-height:140px;padding:12px 14px;line-height:1.5;resize:vertical;font:400 15px/1.5 var(--f-text)}
.tr-ta.tr-typing{box-shadow:inset 0 0 0 2px var(--strass)}
.tr-incl{display:grid;gap:4px}.tr-tg{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:48px;font-size:15px;border-top:1px solid var(--line)}
.tr-gal{display:grid;grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr;gap:8px;height:260px}.tr-gal .tr-ph{height:100%}.tr-gal .tr-ph.main{grid-row:span 2}
.tr-gal .tr-ph:only-child{grid-column:1/-1}
.tr-vw{display:flex;align-items:center;gap:12px;height:46px}.tr-vw svg{width:120px;height:40px}.tr-vw b{font:800 22px var(--f-display)}
.tr-msg{padding:14px 16px;border-radius:16px;background:var(--surface-2);font-size:15.5px;line-height:1.55;color:var(--ink-2)}
.tr-buyer{display:flex;align-items:center;gap:14px;margin-bottom:16px}.tr-buyer .grow{min-width:0}.tr-buyer b{font-size:17px}
.tr-prog{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;align-items:center;font-size:14px;color:var(--mut);margin-bottom:12px}
.tr-steps{list-style:none;margin:0;padding:0;display:grid;gap:4px}
.tr-steps li{display:flex;gap:14px;padding:14px 0;border-top:1px solid var(--line)}.tr-steps li .grow{min-width:0}
.tr-steps b{font-size:16px}.tr-steps p{margin:4px 0 0;font-size:14.5px;line-height:1.5;color:var(--mut)}
.tr-sk{flex:none;width:40px;height:40px;border-radius:13px;display:grid;place-items:center;box-shadow:inset 0 0 0 2px var(--line-2);font:700 15px var(--f-text);color:var(--mut);transition:background var(--t-2),transform .35s var(--e-spring)}
.tr-sk:active{transform:scale(.9)}
.tr-steps li.ok .tr-sk{background:var(--ok);color:var(--surface);box-shadow:none}.tr-steps li.ok b{color:var(--ok)}
/* page publique */
.tr-pub{max-width:1080px;margin:0 auto}
.tr-pubbar{display:flex;align-items:center;gap:10px;margin:4px 0 18px}
.tr-url{flex:1;min-width:0;height:40px;border-radius:999px;background:var(--surface-2);display:flex;align-items:center;gap:8px;padding:0 16px;font:500 14px var(--f-mono);color:var(--mut)}
.tr-url svg.i{flex:none;color:var(--ok)}
.tr-pubh{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:24px;align-items:start}
@container main (max-width:860px){.tr-pubh{grid-template-columns:minmax(0,1fr)}.tr-pubbar .btn:last-child span{display:none}}
.tr-pubg{display:grid;grid-template-columns:2fr 1fr;grid-template-rows:1fr 1fr;gap:8px;aspect-ratio:4/3}.tr-pubg .tr-ph{height:100%}.tr-pubg .tr-ph.main{grid-row:span 2}.tr-pubg .tr-ph:only-child{grid-column:1/-1}
.tr-pubi{display:flex;flex-direction:column;gap:10px}
.tr-club{display:flex;align-items:center;gap:8px;font:600 14px var(--f-text);color:var(--mut)}
.tr-pubi h1{font:800 44px/1 var(--f-display);letter-spacing:-.035em;margin:6px 0 0}
.tr-pp{font:800 34px/1 var(--f-display);letter-spacing:-.03em;color:var(--acc-deep);margin:6px 0}
.tr-inc{display:grid;gap:8px;font-size:15px;color:var(--ink-2);margin-top:6px}.tr-inc span{display:flex;gap:9px;align-items:center}.tr-inc svg.i{color:var(--ok);flex:none}
.tr-pubb{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:16px;margin-top:22px;align-items:start}
@container main (max-width:860px){.tr-pubb{grid-template-columns:minmax(0,1fr)}}
.tr-h3{font:800 20px/1.2 var(--f-display);letter-spacing:-.015em;margin:0 0 12px}
.tr-desc{font-size:16px;line-height:1.65;color:var(--ink-2);margin:0}
.tr-form{display:grid;gap:12px}.tr-form textarea.in{height:auto;padding:12px 14px;line-height:1.5}
.tr-sent{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:20px 0}

/* cours en direct : page */
.tr-resume{display:grid;grid-template-columns:auto minmax(0,1fr) auto;grid-template-rows:auto auto;gap:4px 14px;align-items:center;width:100%;text-align:left;padding:16px 18px;margin-bottom:16px;border-radius:22px}
.tr-resume .tr-live{grid-row:span 2}.tr-resume b{font-size:17px}.tr-resume>svg.i{grid-row:1/3;grid-column:3}
.tr-next{display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:24px;padding:24px;border-radius:28px;background:linear-gradient(150deg,var(--rd-bg),color-mix(in srgb,var(--rd-bg) 30%,var(--surface)));box-shadow:none}
@container main (max-width:860px){.tr-next{grid-template-columns:minmax(0,1fr);padding:20px}}
.tr-nl{display:flex;flex-direction:column;gap:8px;min-width:0}
.tr-next h2{font:800 32px/1.08 var(--f-display);letter-spacing:-.03em;margin:4px 0 0;color:var(--ink)}
.tr-next p{margin:0;font-size:15.5px;color:var(--ink-2)}
.tr-cues{display:flex;flex-wrap:wrap;gap:8px;margin:6px 0 4px}
.tr-cues span{padding:8px 12px;border-radius:12px;background:var(--surface);font-size:14px;line-height:1.35;color:var(--ink-2)}.tr-cues span.warn{box-shadow:inset 3px 0 0 var(--warn)}.tr-cues span.bad{box-shadow:inset 3px 0 0 var(--bad)}
.tr-start{height:64px;font-size:17px;border-radius:20px;margin-top:10px;align-self:flex-start;padding:0 26px}
.app.mobile .tr-start{width:100%;height:64px}
.tr-how{list-style:none;margin:0;padding:0;display:grid;gap:12px;align-content:center}
.tr-how li{display:flex;gap:12px;align-items:center;font-size:15px;color:var(--ink-2)}.tr-how li svg.i{flex:none;width:34px;height:34px;padding:7px;border-radius:11px;background:var(--surface);color:var(--rd-ink)}
.tr-lr{width:100%;text-align:left;align-items:center}.tr-lr.past{opacity:.6}
.tr-lt{flex:none;width:64px;font:700 16px var(--f-display)}

/* cours en direct : plein écran, gros boutons, utilisable avec des gants */
.tr-full{position:absolute;inset:0;z-index:35;background:var(--bg);display:flex;flex-direction:column;container:ce/inline-size;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)}
.stage:not(.full)[data-dev="phone"] .tr-full{padding-top:54px;padding-bottom:26px}
.app:has(.tr-full) .toasts{bottom:auto;top:168px}.app.mobile:has(.tr-full) .toasts{top:196px}
.tr-fh{display:flex;align-items:center;gap:12px;padding:14px 18px;background:var(--navy);color:var(--on-navy)}
.tr-x{flex:none;width:56px;height:56px;border-radius:18px;display:grid;place-items:center;background:color-mix(in srgb,var(--on-navy) 14%,transparent);color:var(--on-navy)}
.tr-x svg.i{width:26px;height:26px}
.tr-ft{min-width:0}.tr-ft b{display:block;font:700 18px/1.2 var(--f-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tr-ft small{display:block;font-size:14px;opacity:.8;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tr-clk{flex:none;text-align:right}.tr-clk span{display:block;font:800 44px/1 var(--f-display);letter-spacing:-.03em}.tr-clk small{display:block;font-size:13.5px;opacity:.8;margin-top:3px}
.tr-clk.idle span{opacity:.5}.tr-clk.pz span{animation:tr-blink 1.2s infinite}
.tr-fh .tr-net{background:color-mix(in srgb,var(--on-navy) 14%,transparent);color:var(--on-navy)}.tr-fh .tr-net.off{background:var(--warn);color:var(--surface)}
.tr-tabs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;padding:10px 18px;background:var(--surface);box-shadow:0 1px 0 var(--line)}
.tr-tabs button{display:flex;align-items:center;gap:10px;min-height:60px;padding:6px 12px;border-radius:16px;text-align:left;color:var(--ink-2);transition:background var(--t-2)}
.tr-tabs button i{flex:none;width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:var(--surface-2);font:800 15px var(--f-display);font-style:normal}
.tr-tabs button span{min-width:0}.tr-tabs b{display:block;font-size:16px}.tr-tabs small{display:block;font-size:13px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.tr-tabs button[aria-pressed="true"]{background:var(--rd-bg);color:var(--rd-ink)}.tr-tabs button[aria-pressed="true"] i{background:var(--rd);color:var(--surface)}
.tr-fb{flex:1;min-height:0;overflow-y:auto;overscroll-behavior:contain;padding:16px 18px 24px;display:flex;flex-direction:column;gap:12px}
.tr-hint{display:flex;gap:10px;align-items:center;font-size:14.5px;color:var(--mut);padding:0 2px}.tr-hint svg.i{flex:none}
.tr-rc{border-radius:24px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);touch-action:pan-y;transition:transform .35s var(--e-spring),background var(--t-2),box-shadow var(--t-2);animation:tr-in .4s var(--e-out) both;animation-delay:calc(var(--i,0)*40ms)}
@keyframes tr-in{from{opacity:0;transform:translateY(10px)}}
.tr-rc.drag{transition:none}
.tr-rc.p{background:color-mix(in srgb,var(--ok-pale) 80%,var(--surface));box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--ok) 40%,transparent)}
.tr-rc.a{background:color-mix(in srgb,var(--bad-pale) 75%,var(--surface));box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--bad) 35%,transparent)}
.tr-rc.to-p{box-shadow:inset 0 0 0 3px var(--ok)}.tr-rc.to-a{box-shadow:inset 0 0 0 3px var(--bad)}
.tr-rci{display:flex;align-items:center;gap:14px;padding:14px 14px 14px 16px;min-height:96px;cursor:pointer}
.tr-rci .av{width:52px;height:52px;font-size:17px}
.tr-rci .grow{min-width:0}.tr-rci b{display:block;font:700 19px/1.2 var(--f-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tr-rci small{display:block;font-size:15px;color:var(--mut);margin-top:4px;line-height:1.35}
.tr-rci small .warn{color:var(--warn);font-weight:600}.tr-rci small .bad{color:var(--bad);font-weight:600}
.tr-rci em{display:flex;align-items:center;gap:6px;font-style:normal;font-size:14px;font-weight:600;color:var(--bad);margin-top:6px}
.tr-yn{flex:none;width:68px;height:68px;border-radius:22px;display:grid;place-items:center;background:var(--surface-2);color:var(--ink-2);box-shadow:inset 0 0 0 1px var(--line-2);transition:transform .3s var(--e-spring),background var(--t-2),color var(--t-2)}
.tr-yn svg.i{width:30px;height:30px;stroke-width:2.4}
.tr-yn:active{transform:scale(.9)}
.tr-yn.y[aria-pressed="true"]{background:var(--ok);color:var(--surface);box-shadow:none}.tr-yn.n[aria-pressed="true"]{background:var(--bad);color:var(--surface);box-shadow:none}
.tr-ff{display:flex;gap:10px;padding:12px 18px 16px;background:var(--surface);box-shadow:0 -1px 0 var(--line)}
.tr-bb{flex:1;min-width:0;height:68px;border-radius:22px;display:inline-flex;align-items:center;justify-content:center;gap:10px;font:700 17px var(--f-text);background:var(--surface-2);color:var(--ink);box-shadow:inset 0 0 0 1px var(--line-2);transition:transform .3s var(--e-spring)}
.tr-bb:active{transform:scale(.96)}.tr-bb svg.i{width:26px;height:26px}
.tr-bb.pri{background:var(--acc);color:var(--on-acc);box-shadow:none;flex:1.4}
.tr-phs2{display:flex;gap:8px}
.tr-pz{min-width:0;display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:18px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line)}
.tr-pz span{display:flex;flex-direction:column}.tr-pz b{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.tr-pz small{font-size:13px;color:var(--mut)}
.tr-pz>i{display:block;height:8px;border-radius:4px;background:var(--surface-2);overflow:hidden}.tr-pz>i>i{display:block;height:100%;background:var(--rd);border-radius:4px;transition:width 1s linear}
.tr-pz.on{background:var(--rd-bg);box-shadow:inset 0 0 0 2px var(--rd)}
.tr-tmr{display:grid;grid-template-columns:auto minmax(0,1fr);gap:16px;align-items:center;padding:16px;border-radius:24px;background:var(--navy);color:var(--on-navy)}
.tr-tmr.done{animation:tr-ring .8s 3}
@keyframes tr-ring{50%{background:var(--warn)}}
.tr-tmrv small{display:block;font-size:14px;opacity:.8}.tr-tmrv b{display:block;font:800 52px/1 var(--f-display);letter-spacing:-.03em;margin-top:4px}
.tr-pre{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.tr-pre button{min-height:68px;border-radius:18px;background:color-mix(in srgb,var(--on-navy) 14%,transparent);color:var(--on-navy);font:700 16px var(--f-text);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transition:transform .3s var(--e-spring)}
.tr-pre button:active{transform:scale(.92)}.tr-pre small{font-size:13px;font-weight:500;opacity:.8}
.tr-sl{display:grid;gap:8px}
.tr-sr{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:20px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);animation:tr-in .4s var(--e-out) both;animation-delay:calc(var(--i,0)*40ms)}
.tr-sr .grow{min-width:0;flex:0 1 34%}.tr-sr b{display:block;font:700 18px/1.2 var(--f-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.tr-sr small{display:block;font-size:14px;color:var(--mut);margin-top:2px}
.tr-cl{flex:1;min-width:0;display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end}
.tr-cl span{padding:8px 12px;border-radius:12px;background:var(--surface-2);font:600 14.5px/1.3 var(--f-text);color:var(--ink-2)}
.tr-cl span.warn{background:var(--warn-pale);color:var(--warn)}.tr-cl span.bad{background:var(--bad-pale);color:var(--bad)}.tr-cl span.ok{background:transparent;color:var(--mut);font-weight:500}
.tr-br{padding:16px;border-radius:24px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);display:grid;gap:12px;animation:tr-in .4s var(--e-out) both;animation-delay:calc(var(--i,0)*40ms)}
.tr-bh{display:flex;align-items:center;gap:12px}.tr-bh .av{width:46px;height:46px}.tr-bh b{display:block;font:700 18px var(--f-text)}.tr-bh small{display:block;font-size:14px;color:var(--mut)}
.tr-moods{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.tr-moods button{min-height:60px;border-radius:18px;display:flex;align-items:center;justify-content:center;gap:8px;font:700 16px var(--f-text);background:var(--surface-2);color:var(--ink-2);box-shadow:inset 0 0 0 1px var(--line-2);transition:transform .3s var(--e-spring),background var(--t-2)}
.tr-moods button:active{transform:scale(.94)}
.tr-moods .k-dur[aria-pressed="true"]{background:var(--warn-pale);color:var(--warn);box-shadow:inset 0 0 0 2px var(--warn)}
.tr-moods .k-bien[aria-pressed="true"]{background:var(--ok-pale);color:var(--ok);box-shadow:inset 0 0 0 2px var(--ok)}
.tr-moods .k-top[aria-pressed="true"]{background:var(--acc-bg);color:var(--acc-deep);box-shadow:inset 0 0 0 2px var(--strass)}
.tr-tags{display:flex;flex-wrap:wrap;gap:8px}
.tr-tags button{min-height:48px;padding:0 16px;border-radius:14px;font:600 15px var(--f-text);background:var(--surface);color:var(--ink-2);box-shadow:inset 0 0 0 1px var(--line-2)}
.tr-tags button[aria-pressed="true"]{background:var(--navy);color:var(--on-navy);box-shadow:none}
.tr-word{height:52px}
@container ce (max-width:620px){
 .tr-fh{padding:10px 12px;gap:8px;flex-wrap:wrap}.tr-fh .tr-net{order:5;width:100%;justify-content:center;height:32px}.tr-x{width:50px;height:50px}.tr-x.fs{display:none}.tr-clk span{font-size:36px}.tr-ft b{font-size:16.5px}
 .tr-tabs{padding:8px 10px;gap:6px}.tr-tabs button{padding:6px 8px;gap:8px;min-height:56px}.tr-tabs button i{display:none}
 .tr-fb{padding:12px 12px 20px}.tr-ff{padding:10px 12px 12px}.tr-bb{height:64px;font-size:16px}
 .tr-rci{gap:10px;padding:12px;min-height:88px}.tr-rci .av{display:none}.tr-yn{width:62px;height:62px}
 .tr-tmr{grid-template-columns:minmax(0,1fr)}.tr-tmrv b{font-size:46px}.tr-phs2{flex-direction:column;gap:6px}.tr-pz{flex-direction:row;align-items:center;padding:10px 12px}.tr-pz span{flex:0 0 46%}.tr-pz>i{flex:1}
 .tr-sr{flex-direction:column;align-items:stretch;gap:8px}.tr-sr .grow{flex:none}.tr-cl{justify-content:flex-start}
 .tr-moods button{flex-direction:column;gap:2px;font-size:15px}
}
@media (prefers-reduced-motion:reduce){.tr-ur,.tr-live i,.tr-net.off svg.i,.tr-clk.pz span{animation:none}.tr-rc,.tr-sr,.tr-br{animation:none}}
`);

/* =====================================================================
   Enregistrement des écrans
   ===================================================================== */
function confCount(){try{ensure();return conflicts(curSlot()).length}catch(e){return 0}}
P.mod({id:'pres',role:'gerant',group:'Écurie',title:'Prés et paddocks',icon:'paddock',n:45,phoneTitle:'Prés',short:'Prés',
  badge:function(){var n=confCount();return n?{v:n,hot:true}:null},render:prRender});
P.mod({id:'ventes',role:'gerant',group:'Écurie',title:'Vente de chevaux',icon:'tag',n:85,phoneTitle:'Ventes',short:'Ventes',
  badge:function(){ensure();var n=newLeads();return n?{v:n}:null},render:veRender});
P.mod({id:'annonce',role:'gerant',group:'Écurie',title:'Annonce',icon:'tag',hidden:true,tab:'ventes',phoneTitle:'Annonce',render:anRender});
P.mod({id:'cours',role:'gerant',group:'Club',title:'Cours en direct',icon:'stopwatch',n:12,phoneTitle:'Cours en direct',short:'Cours',render:ceRender});
P.mod({id:'emp-pres',role:'employe',group:'Écurie',title:'Sorties au pré',icon:'paddock',n:15,phoneTitle:'Sorties au pré',short:'Prés',
  badge:function(){try{ensure();var t=nowMin(),n=movesOf(curSlot()).filter(function(m){if(!m.out||m.back)return false;var w=clash(m),due=m.plan||(w?fromMin(mm(w.at)-15):null);return due&&t>=mm(due)-5}).length;return n?{v:n,hot:true}:null}catch(e){return null}},render:epRender});
P.mod({id:'emp-cours',role:'employe',group:'Ma journée',title:'Cours en direct',icon:'stopwatch',n:25,phoneTitle:'Cours en direct',short:'Cours',render:ceRender});
P.mod({id:'adh-pre',role:'adherent',group:'Cheval',title:'Au pré',icon:'paddock',n:15,phoneTitle:'Au pré',short:'Au pré',render:apRender});

/* ---------- Palette ⌘K ---------- */
P.actions.push(
 {role:'gerant',label:'Préparer les sorties au pré',icon:'paddock',run:function(){P.go('pres')}},
 {role:'gerant',label:'Mettre un cheval en vente',icon:'tag',run:function(){P.go('ventes');setTimeout(function(){newAd(null,function(){P.rerender()})},80)}},
 {role:'gerant',label:'Lancer le cours en direct',icon:'stopwatch',run:function(){P.go('cours')}},
 {role:'employe',label:'Sortir ou rentrer un cheval',icon:'paddock',run:function(){P.go('emp-pres')}},
 {role:'employe',label:'Faire l’appel de la reprise',icon:'stopwatch',run:function(){P.go('emp-cours')}},
 {role:'adherent',label:'Où est mon cheval ?',icon:'paddock',run:function(){P.go('adh-pre')}});

/* ---------- Stabl AI ---------- */
P.brain.push(
 {role:'gerant',re:/\bpr[ée]s?(?![a-zà-ÿ])|p[âa]tur|rotation|qui sort/i,reply:function(){ensure();var s=curSlot(),cs=conflicts(s),out=slotOut(s);
   return {text:cap1(dehors(out))+' '+(s==='am'?'ce matin':'cet après-midi')+'. '+(cs.length?pl(cs.length,'point')+' à régler : '+E(cs[0].t)+'.':'Aucun conflit : places, compatibilités et reprises sont respectées.'),
     actions:[{label:'Ouvrir les prés',run:function(){P.go('pres');return 'Prés ouverts'}}]}}},
 {role:'gerant',re:/vend|annonce|acheteur|essai d[e’']/i,reply:function(){ensure();var live=D.horseAds.filter(function(a){return a.status==='en ligne'||a.status==='sous option'}),nl=newLeads();
   return {text:live.length+(live.length>1?' chevaux sont':' cheval est')+' en vente : '+E(list(live.map(function(a){return fn(D.horse(a.horse))+' ('+F.eur(a.price)+')'})))+'. '+(nl?pl(nl,'demande attend','demandes attendent')+' une réponse.':'Toutes les demandes ont une réponse.'),
     actions:[{label:'Voir les ventes',run:function(){P.go('ventes');return 'Ventes ouvertes'}}]}}},
 {role:'employe',re:/\bpr[ée]s?(?![a-zà-ÿ])|rentrer|sortir/i,reply:function(){ensure();var s=curSlot(),ms=movesOf(s),late=ms.filter(function(m){var w=clash(m);return m.out&&!m.back&&(m.plan||w)});
   return {text:cap1(dehors(slotOut(s)))+'. '+(late.length?'À rentrer en priorité : '+E(list(late.map(function(m){var w=clash(m);return fn(D.horse(m.horse))+' à '+hm(m.plan||fromMin(mm(w.at)-15))})))+'.':'Rien d’urgent.'),
     actions:[{label:'Ouvrir les sorties',run:function(){P.go('emp-pres');return 'Sorties ouvertes'}}]}}},
 {role:'employe',re:/appel|absent|reprise en cours|cours en direct/i,reply:function(){var l=todays().find(function(x){return mm(x.start)+x.dur>nowMin()});
   return {text:l?'Prochaine reprise : '+hm(l.start)+', '+E(l.title)+', '+pl(l.riders.length,'cavalier')+'. Le mode cours en direct fait l’appel d’un geste et rend la séance aux absents.':'Plus de reprise aujourd’hui.',
     actions:l?[{label:'Lancer le cours',run:function(){P.go('emp-cours');return 'Cours ouvert'}}]:[]}}},
 {role:'adherent',re:/au pr[ée]|où est|dehors|sorti/i,reply:function(){ensure();var h=myHorses()[0];if(!h)return null;var m=moveOf(h.id,curSlot()),p=m&&pasture(m.pasture);
   return {text:m&&m.out&&!m.back?fn(h)+' est au pré n°'+NB+p.n+', '+E(p.name)+', depuis '+hm(m.out)+'.':fn(h)+' est au box en ce moment.',actions:[{label:'Voir où il est',run:function(){P.go('adh-pre');return 'Ouvert'}}]}}});

P.tourSteps.push({route:'pres',title:'Les prés, sans tableau blanc',text:'Qui sort où, la place qui reste, l’herbe et les chevaux à séparer. Glissez un cheval d’un pré à l’autre : Stabl signale tout de suite un étalon avec une jument ou un cheval qui travaille à 10 h. L’équipe coche les sorties d’un geste sur son téléphone, même sans réseau.'});
})();
