/* =====================================================================
   PIAFFE · Données de démonstration (fictives, déterministes)
   Club : Écurie des Tilleuls. Date du jour de la démo : mardi 17 novembre 2026.
   ===================================================================== */
(function(){
var seed=20261117;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296}
function pick(a){return a[Math.floor(rnd()*a.length)]}
function int(a,b){return a+Math.floor(rnd()*(b-a+1))}
function id(p,i){return p+(i<10?'0':'')+i}
var TODAY=new Date(2026,10,17,9,41);
function day(o){var d=new Date(TODAY);d.setHours(0,0,0,0);d.setDate(d.getDate()+o);return d}
function iso(d){return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')}

var D={today:TODAY,iso:iso,day:day};
D.club={name:'Écurie des Tilleuls',short:'Les Tilleuls',city:'Saint-Arnoult-en-Yvelines',address:'12 chemin des Tilleuls, 78730 Saint-Arnoult-en-Yvelines',siret:'812 345 678 00021',ffe:'Club FFE n° 7812045',boxes:46,phone:'01 34 00 00 00',email:'contact@ecurie-tilleuls.example',
  arenas:[{id:'a1',name:'Grand manège',kind:'Couvert',size:'60 × 25 m'},{id:'a2',name:'Carrière d’honneur',kind:'Sable fibré',size:'70 × 40 m'},{id:'a3',name:'Petite carrière',kind:'Sable',size:'40 × 20 m'},{id:'a4',name:'Rond de longe',kind:'Couvert',size:'Ø 18 m'}],
  paddocks:['Prairie du bas','Paddock des poneys','Paddock d’hiver','Prairie du haut','Paddock de soins','Parcours de cross']};
D.me={gerant:'s01',employe:'s05',adherent:'m001',coach:'c01'};

/* ---------- Équipe ---------- */
D.staff=[
 {id:'s01',first:'Claire',last:'Dumont',role:'Gérante',dip:'DEJEPS, BPJEPS',contract:'Gérante associée',hours:45,color:'var(--c2)'},
 {id:'s02',first:'Hugo',last:'Lefèvre',role:'Moniteur',dip:'BPJEPS équitation',contract:'CDI 35 h',hours:35,color:'var(--c1)'},
 {id:'s03',first:'Inès',last:'Garnier',role:'Monitrice',dip:'BPJEPS, CQP ASA',contract:'CDI 35 h',hours:35,color:'var(--c6)'},
 {id:'s04',first:'Thomas',last:'Roux',role:'Moniteur',dip:'DEJEPS CSO',contract:'CDI 30 h',hours:30,color:'var(--c3)'},
 {id:'s05',first:'Antoine',last:'Leroy',role:'Palefrenier soigneur',dip:'CAPA soigneur',contract:'CDI 39 h',hours:39,color:'var(--c4)'},
 {id:'s06',first:'Lucie',last:'Petit',role:'Palefrenière soigneuse',dip:'Bac pro CGEH',contract:'CDI 35 h',hours:35,color:'var(--c5)'},
 {id:'s07',first:'Kévin',last:'Bernard',role:'Agent d’entretien',dip:'',contract:'CDD 24 h',hours:24,color:'var(--c7)'},
 {id:'s08',first:'Jade',last:'Fontaine',role:'Apprentie BPJEPS',dip:'En formation',contract:'Apprentissage',hours:35,color:'var(--c6)'},
 {id:'s09',first:'Manon',last:'Lemoine',role:'Secrétariat et accueil',dip:'',contract:'CDI 28 h',hours:28,color:'var(--c3)'}
];
/* ---------- Coachs (internes et extérieurs réservables) ---------- */
D.coaches=[
 {id:'c01',first:'Pauline',last:'Arnaud',spec:'CSO',level:'Pro 2 · coach de concours',rate:55,rating:4.9,reviews:128,ext:true,bio:'Cavalière Pro, forme des cavaliers Club au Amateur Élite.',slots:['Mar 14:00','Mer 10:00','Ven 16:30','Sam 09:00'],color:'var(--c1)'},
 {id:'c02',first:'Julien',last:'Mercier',spec:'Dressage',level:'Juge national, cavalier Grand Prix',rate:65,rating:4.8,reviews:74,ext:true,bio:'Travail sur le plat, piaffer et passage pour chevaux de propriétaires.',slots:['Mer 15:00','Jeu 11:00','Sam 14:00'],color:'var(--c5)'},
 {id:'c03',first:'Sophie',last:'Lambert',spec:'Éthologie',level:'Savoirs éthologiques 7',rate:45,rating:5.0,reviews:52,ext:true,bio:'Jeunes chevaux, débourrage, chevaux qui posent problème.',slots:['Lun 10:00','Jeu 14:30'],color:'var(--c7)'},
 {id:'c04',first:'Marc',last:'Dubois',spec:'Concours complet',level:'Ancien cavalier international',rate:60,rating:4.7,reviews:39,ext:true,bio:'Cross, gymnastique, préparation physique du couple.',slots:['Sam 10:30','Dim 09:30'],color:'var(--c4)'},
 {id:'c05',first:'Hugo',last:'Lefèvre',spec:'Enseignement',level:'Moniteur du club',rate:38,rating:4.8,reviews:210,ext:false,staff:'s02',slots:['Lun 18:00','Mar 17:00','Jeu 18:00'],color:'var(--c1)'},
 {id:'c06',first:'Thomas',last:'Roux',spec:'CSO',level:'Moniteur DEJEPS',rate:45,rating:4.9,reviews:97,ext:false,staff:'s04',slots:['Mer 18:00','Sam 16:00'],color:'var(--c3)'}
];

/* ---------- Chevaux ---------- */
var HN=['Ulysse de la Roche','Quiétude','Vanille','Tornado','Sirius du Moulin','Opale','Diablo','Câline','Hermès','Jazz','Kalinka','Lune d’Or','Macaron','Nuage','Orphée','Pistache','Quartz','Réglisse','Saphir','Tango','Uranus','Volga','Xanthos','Whisky','Yuma','Zéphyr','Bijou','Caramel','Domino','Étoile','Filou','Gribouille','Hirondelle','Iris','Joker','Kiwi','Lord Vitesse','Mistral','Noisette','Oural','Prélude','Rubis','Scala','Talisman'];
var BR=['Selle Français','Selle Français','Poney Français de Selle','KWPN','Connemara','Pur-sang','Anglo-arabe','Welsh','Shetland','Haflinger','Lusitanien','Frison','Trotteur Français','Holsteiner'];
var RO=['Bai','Bai brun','Alezan','Gris','Noir','Pie alezan','Palomino','Isabelle','Rouan','Alezan brûlé'];
D.horses=HN.map(function(n,i){
  var br=pick(BR),pony=/Poney|Connemara|Welsh|Shetland|Haflinger/.test(br),kind=i<20?'club':(i<32?'proprietaire':'demi');
  var age=int(4,21),h={id:id('h',i+1),name:n,breed:br,pony:pony,sex:pick(['Hongre','Hongre','Jument','Étalon']),age:age,born:2026-age,coat:pick(RO),
    height:pony?int(118,148):int(158,176),kind:kind,box:'B'+String(i+1).padStart(2,'0'),sire:'250259'+(600000+int(1000,99999))+String.fromCharCode(65+int(0,25)),
    chip:'250259'+(800000000+int(1000000,99999999)),level:pick(['Débutant','Galop 2-4','Galop 4-6','Galop 6-7','Confirmé']),
    work:int(4,16),workMax:pony?12:16,weight:pony?int(280,450):int(480,640),bcs:[2.5,3,3,3.5,3.5,4][int(0,5)],
    mood:pick(['Calme','Volontaire','Sensible','Joueur','Froid','Généreux']),
    ration:{hay:pony?int(5,8):int(8,12),grain:pony?int(0,1)+.5:int(1,3)+.5,supp:pick(['Huile de lin','Électrolytes','Ail','Aucun','Levures','Biotine'])},
    paddock:pick(D.club.paddocks),costMonth:int(310,520),
    vacc:iso(day(int(-300,-10))),worm:iso(day(int(-120,-5))),farrier:iso(day(int(-50,-3))),dentist:iso(day(int(-400,-30))),osteo:iso(day(int(-200,-20))),
    status:'ok',alerts:[],color:pick(['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)','var(--c7)'])};
  return h});
/* propriétaires */
var OWN=['m120','m014','m023','m031','m047','m052','m066','m078','m083','m091','m102','m117'];
D.horses.forEach(function(h,i){if(h.kind==='proprietaire'||h.kind==='demi'){h.owner=OWN[i%OWN.length]}});
D.horses[0].owner='m001';D.horses[0].kind='proprietaire';D.horses[0].breed='Selle Français';D.horses[0].pony=false;D.horses[0].height=168;D.horses[0].age=11;D.horses[0].sex='Hongre';D.horses[0].coat='Bai brun';D.horses[0].born=2015;D.horses[0].bcs=3;
/* alertes réalistes */
function al(i,st,txt){D.horses[i].status=st;D.horses[i].alerts.push(txt)}
al(3,'bad','Boiterie antérieur gauche, véto à 14 h');al(7,'warn','Vaccin grippe dans 6 jours');al(11,'warn','Maréchal en retard de 9 jours');al(15,'warn','Perte de 12 kg en 3 semaines');al(22,'bad','Colique légère cette nuit, surveillance');al(26,'warn','Vermifuge à faire');al(5,'warn','Repos 3 jours prescrit');al(0,'warn','Ferrure prévue jeudi');

/* ---------- Adhérents ---------- */
var FN=['Léa','Emma','Chloé','Manon','Camille','Inès','Louise','Jade','Zoé','Alice','Lina','Rose','Anna','Mila','Ambre','Juliette','Sarah','Clara','Lou','Romane','Lucas','Hugo','Louis','Arthur','Jules','Nathan','Tom','Paul','Gabriel','Raphaël','Sophie','Nathalie','Isabelle','Céline','Aurélie','Julie','Marion','Hélène','Valérie','Pierre'];
var LN=['Martin','Bernard','Dubois','Thomas','Robert','Richard','Petit','Durand','Leroy','Moreau','Simon','Laurent','Lefebvre','Michel','Colin','David','Bertrand','Roux','Vincent','Fournier','Chevalier','Girard','André','Mercier','Dupont','Lambert','Bonnet','François','Masson','Legrand','Garnier','Faure','Rousseau','Blanc','Guérin','Gauthier','Henry','Roussel','Nicolas','Perrin'];
var FORF=[{id:'f1',name:'Forfait annuel 1 h / semaine',price:780,kind:'annuel'},{id:'f2',name:'Forfait annuel 2 h / semaine',price:1390,kind:'annuel'},{id:'f3',name:'Carte 10 séances',price:290,kind:'carte'},{id:'f4',name:'Baby poney (trimestre)',price:195,kind:'trimestre'},{id:'f5',name:'Propriétaire, accès installations',price:0,kind:'proprio'},{id:'f6',name:'Demi-pension 2 jours',price:180,kind:'demi'}];
D.forfaits=FORF;
D.members=[];
for(var i=1;i<=148;i++){var age=i<=40?int(6,14):(i<=95?int(15,24):int(25,62)),ln=pick(LN),fam=i>1&&rnd()<.28?D.members[D.members.length-1].fam:'F'+i,
  m={id:'m'+String(i).padStart(3,'0'),first:pick(FN),last:ln,age:age,minor:age<18,galop:age<8?0:Math.min(7,int(0,age<12?3:7)),fam:fam,
    forfait:pick(age<8?['f4']:['f1','f1','f1','f2','f3','f3']),licence:rnd()<.93?'2027':'À renouveler',lic:'0'+int(1000000,9999999)+String.fromCharCode(65+int(0,25)),
    balance:rnd()<.16?-int(30,420):(rnd()<.1?int(20,120):0),since:2026-int(0,9),
    phone:'06 '+int(10,99)+' '+int(10,99)+' '+int(10,99)+' '+int(10,99),cert:rnd()<.9,photo:rnd()<.8,color:pick(['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)','var(--c7)'])};
  if(fam!=='F'+i){m.last=D.members[D.members.length-1].last}
  m.email=(m.first+'.'+m.last).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z.]/g,'')+'@exemple.fr';
  D.members.push(m)}
/* l'adhérente de la démo : Léa Martin, propriétaire d'Ulysse */
Object.assign(D.members[0],{first:'Léa',last:'Martin',age:27,minor:false,galop:7,forfait:'f5',balance:-410,licence:'2027',since:2019,email:'lea.martin@exemple.fr'});
OWN.forEach(function(o){var m=D.members.find(function(x){return x.id===o});if(m){m.forfait='f5';m.minor=false;if(m.age<18)m.age=int(22,55)}});
/* personnes nommées dans les textes : identiques quel que soit le tirage */
function pinM(id,o){var m=D.members.find(function(x){return x.id===id});if(m)Object.assign(m,o)}
pinM('m019',{first:'Emma',last:'Moreau',age:24,minor:false,galop:6,since:2021,licence:'2027',cert:true,forfait:'f6',fam:'F19',email:'emma.moreau@exemple.fr'});
pinM('m078',{first:'Hélène',last:'Girard',age:50,minor:false,galop:7,email:'helene.girard@exemple.fr'});
pinM('m044',{first:'Alice',last:'Vincent',age:15,minor:true,galop:5,email:'alice.vincent@exemple.fr'});
/* pas d'homonyme de la demi-pensionnaire */
D.members.forEach(function(m){if(m.id!=='m019'&&m.first==='Emma'&&m.last==='Moreau'){m.first='Chloé';m.email=m.email.replace('emma','chloe')}});
/* demi-pensionnaires */
D.halfboard=[
 {id:'dp1',horse:'h01',rider:'m019',days:['Mar','Sam'],price:180,status:'Actif',since:'2026-09-01'},
 {id:'dp2',horse:'h21',rider:'m027',days:['Lun','Jeu'],price:160,status:'Actif',since:'2026-06-15'},
 {id:'dp3',horse:'h24',rider:'m044',days:['Mer'],price:95,status:'Essai',since:'2026-11-10'},
 {id:'dp4',horse:'h33',rider:'m058',days:['Ven','Dim'],price:170,status:'Actif',since:'2025-10-01'}];
D.halfboardOffers=[
 {id:'o1',horse:'h01',days:'Mardi et samedi',level:'Galop 6 minimum',price:180,note:'Cheval sensible, cavalier patient et régulier.',applicants:3},
 {id:'o2',horse:'h29',days:'2 jours au choix',level:'Galop 4',price:150,note:'Ponette de CSO, sorties en concours possibles.',applicants:5},
 {id:'o3',horse:'h35',days:'Week-end',level:'Galop 5',price:130,note:'Balades et plat, idéal pour reprendre.',applicants:1}];

/* ---------- Reprises de la semaine ---------- */
var DAYS=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
var TPL=[
 [1,'17:00',60,'Galop 3-4','s02','a1',10],[1,'18:00',60,'Galop 5-6','s04','a2',8],[1,'19:00',60,'Adultes débutants','s03','a1',8],
 [2,'10:00',60,'Propriétaires plat','s04','a2',6],[2,'17:00',60,'Galop 1-2','s03','a1',10],[2,'18:00',60,'Galop 6-7 CSO','s04','a2',8],[2,'19:00',60,'Adultes Galop 4','s02','a1',8],
 [3,'10:00',45,'Baby poney','s08','a3',8],[3,'11:00',60,'Poney Galop 1','s03','a3',10],[3,'14:00',60,'Galop 2-3','s02','a1',10],[3,'15:00',60,'Galop 4-5','s03','a1',10],[3,'16:00',90,'Équipe concours','s04','a2',6],[3,'17:30',60,'Galop 5','s02','a1',10],
 [4,'17:00',60,'Galop 3','s02','a1',10],[4,'18:00',60,'Dressage Galop 6+','s03','a2',8],[4,'19:00',60,'Adultes Galop 2','s02','a1',8],
 [5,'17:00',60,'Galop 4','s03','a1',10],[5,'18:00',60,'Horse-ball','s04','a2',10],
 [6,'09:00',60,'Galop 1-2','s03','a1',10],[6,'10:00',60,'Galop 3-4','s02','a1',10],[6,'11:00',45,'Baby poney','s08','a3',8],[6,'14:00',60,'Galop 5-6','s04','a2',8],[6,'15:00',60,'Galop 2','s03','a1',10],[6,'16:00',90,'Stage cross','s04','a2',8],
 [0,'10:00',120,'Balade en forêt','s02','a1',8]];
D.lessons=TPL.map(function(t,i){var cap=t[6],n=Math.min(cap,int(cap-3,cap+1));
  var riders=D.members.filter(function(m){return m.forfait!=='f5'}).slice(int(0,100),200);riders=riders.slice(0,n);
  return {id:id('l',i+1),dow:t[0],day:DAYS[(t[0]+6)%7],start:t[1],dur:t[2],title:t[3],coach:t[4],arena:t[5],cap:cap,riders:riders.map(function(r){return r.id}),
    horses:{},wait:n>=cap?int(1,4):0,status:'prévue'}});
/* attribution des chevaux du jour */
D.lessons.forEach(function(l){l.riders.forEach(function(r,k){l.horses[r]=D.horses[(k*3+l.id.charCodeAt(2))%20].id})});

/* ---------- Factures ---------- */
var LIB=['Forfait annuel, échéance de novembre','Pension complète novembre','Carte 10 séances','Demi-pension novembre','Stage de la Toussaint','Licence FFE 2027','Ferrure (refacturation)','Coaching CSO particulier','Concours Rambouillet, engagement + transport','Visite vétérinaire (refacturation)'];
D.invoices=[];
for(var k=1;k<=72;k++){var m=D.members[int(0,147)],amt=pick([65,95,145,180,290,390,520,640,780,48,120]),dd=int(-60,10),st=dd>0?'à venir':(rnd()<.78?'payée':(dd<-25?'en retard':'envoyée'));
  D.invoices.push({id:'F-2026-'+String(1100+k),member:m.id,label:pick(LIB),amount:amt,vat:pick([5.5,20,20,5.5]),date:iso(day(dd-20)),due:iso(day(dd)),status:st,method:pick(['Prélèvement SEPA','Carte bancaire','Virement','Chèque','Espèces','Chèques-vacances ANCV'])})}
D.invoices.unshift({id:'F-2026-1173',member:'m001',label:'Pension complète novembre, Ulysse de la Roche',amount:520,vat:20,date:iso(day(-16)),due:iso(day(-2)),status:'en retard',method:'Prélèvement SEPA'});

/* ---------- Banque et compta ---------- */
D.bank=[
 {d:iso(day(0)),label:'PRLV SEPA GROUPE 2 · 14 mandats',amount:4210,cat:'Forfaits',matched:true},
 {d:iso(day(0)),label:'CB PAIEMENT EN LIGNE PIAFFE · 6 opérations',amount:1186,cat:'Ventes en ligne',matched:true},
 {d:iso(day(-1)),label:'SARL FOURRAGES DU HUREPOIX',amount:-3840,cat:'Foin et paille',matched:false},
 {d:iso(day(-1)),label:'VIR M. ET MME DUBOIS',amount:780,cat:'Forfaits',matched:true},
 {d:iso(day(-2)),label:'SELLERIE DU PARC · facture 2211',amount:-412.5,cat:'Sellerie',matched:false},
 {d:iso(day(-2)),label:'DR. VÉTO LECLERC · visite écurie',amount:-268,cat:'Vétérinaire',matched:true},
 {d:iso(day(-3)),label:'URSSAF',amount:-5120,cat:'Charges sociales',matched:true},
 {d:iso(day(-3)),label:'EDF PRO',amount:-638.4,cat:'Énergie',matched:true},
 {d:iso(day(-4)),label:'REMISE CHÈQUES ANCV',amount:640,cat:'Forfaits',matched:false},
 {d:iso(day(-5)),label:'MARÉCHAL B. GAUTIER',amount:-960,cat:'Maréchalerie',matched:true}];
D.months=['Déc','Janv','Févr','Mars','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov'];
D.revenue=[38200,41800,40100,43900,45200,47800,52100,58900,31200,61800,54300,49600];
D.costs=[33100,34200,33900,35100,36800,37200,38100,41200,30100,40900,39800,37400];
D.occupancy=[82,86,88,90,91,93,93,95,74,96,95,94];

/* ---------- Concours ---------- */
D.competitions=[
 {id:'k1',name:'CSO Club et Poney',place:'Rambouillet, Bergerie nationale',km:24,date:iso(day(5)),disc:'CSO',level:'Club 2 à Club Élite',entries:9,closes:iso(day(1)),vans:2,status:'Engagements ouverts'},
 {id:'k2',name:'Dressage Amateur',place:'Saint-Germain-en-Laye',km:46,date:iso(day(12)),disc:'Dressage',level:'Amateur 3 à 1',entries:3,closes:iso(day(6)),vans:1,status:'Engagements ouverts'},
 {id:'k3',name:'Hunter Club',place:'Écurie des Tilleuls (à domicile)',km:0,date:iso(day(19)),disc:'Hunter',level:'Club 4 à Club 1',entries:22,closes:iso(day(14)),vans:0,status:'Organisation'},
 {id:'k4',name:'CCE Poney',place:'Lamotte-Beuvron, Parc fédéral',km:162,date:iso(day(26)),disc:'CCE',level:'Poney 2 à Poney Élite',entries:5,closes:iso(day(16)),vans:2,status:'Préparation'},
 {id:'k5',name:'CSO Amateur',place:'Chantilly, Grand Parquet',km:88,date:iso(day(-4)),disc:'CSO',level:'Club Élite et Amateur 3',entries:6,closes:iso(day(-10)),vans:1,status:'Terminé',results:'2 sans-faute, 1 classement (3e)'}];
D.entries=[
 {comp:'k1',rider:'m003',horse:'h12',class:'Club 2 · 95 cm',fee:22,transport:'v1',coach:'c06'},{comp:'k1',rider:'m008',horse:'h05',class:'Club 1 · 105 cm',fee:24,transport:'v1',coach:'c06'},
 {comp:'k1',rider:'m011',horse:'h18',class:'Poney 2 · 85 cm',fee:18,transport:'v1',coach:'c06'},{comp:'k1',rider:'m016',horse:'h09',class:'Club 3 · 85 cm',fee:22,transport:'v1',coach:'c06'},
 {comp:'k1',rider:'m001',horse:'h01',class:'Club Élite · 115 cm',fee:26,transport:'v2',coach:'c01'},{comp:'k1',rider:'m022',horse:'h14',class:'Club 2 · 95 cm',fee:22,transport:'v2',coach:'c06'},
 {comp:'k1',rider:'m029',horse:'h20',class:'Poney 1 · 95 cm',fee:18,transport:'proprio',coach:'c06'},{comp:'k1',rider:'m034',horse:'h07',class:'Club 3 · 85 cm',fee:22,transport:'car',coach:'c06'},
 {comp:'k1',rider:'m040',horse:'h16',class:'Club 2 · 95 cm',fee:22,transport:'proprio',coach:'c06'}];
/* engagés : âge et galop cohérents avec l'épreuve (Club 1 ≥ Galop 5, Club 2 / Poney 1 ≥ Galop 4, Club 3 / Poney 2 ≥ Galop 3) */
(function(){var need={'Club Élite':7,'Club 1':5,'Club 2':4,'Club 3':3,'Poney 1':4,'Poney 2':3};
 D.entries.forEach(function(e){var m=D.members.find(function(x){return x.id===e.rider});if(!m)return;var k=e.class.split(' · ')[0],g=need[k]||3,pony=/^Poney/.test(k);
  if(m.galop<g)m.galop=g;if(pony){if(m.age<10||m.age>16)m.age=10+(parseInt(m.id.slice(1),10)%5)}else if(m.age<12)m.age=12+(parseInt(m.id.slice(1),10)%6);m.minor=m.age<18;if(m.galop>0&&m.forfait==='f4')m.forfait='f1'})})();
D.vans=[{id:'v1',name:'Camion 6 places',plate:'GH-512-KT',driver:'s04',seats:6,horses:4,leave:'06:45',from:'Cour principale'},{id:'v2',name:'Van 2 places',plate:'FN-208-LB',driver:'m001',seats:3,horses:2,leave:'07:15',from:'Cour principale'}];
D.carpool=[{driver:'m052',seats:3,from:'Rambouillet centre',taken:['m011','m016']},{driver:'m014',seats:2,from:'Les Essarts-le-Roi',taken:['m029']}];

/* ---------- Soins ---------- */
D.care=[
 {id:'s1',horse:'h04',kind:'Vétérinaire',who:'Dr Leclerc',date:iso(day(0)),time:'14:00',note:'Boiterie AG, échographie tendon',status:'planifié'},
 {id:'s2',horse:'h01',kind:'Maréchal',who:'Benoît Gautier',date:iso(day(2)),time:'09:00',note:'Ferrure complète, plaques antérieurs',status:'planifié'},
 {id:'s3',horse:'h08',kind:'Vaccin',who:'Dr Leclerc',date:iso(day(6)),time:'10:00',note:'Grippe + tétanos, rappel annuel',status:'planifié'},
 {id:'s4',horse:'h12',kind:'Maréchal',who:'Benoît Gautier',date:iso(day(-9)),time:'09:00',note:'Parage, en retard',status:'en retard'},
 {id:'s5',horse:'h27',kind:'Vermifuge',who:'Équipe',date:iso(day(0)),time:'08:00',note:'Ivermectine + praziquantel',status:'à faire'},
 {id:'s6',horse:'h23',kind:'Surveillance',who:'Antoine',date:iso(day(0)),time:'Toutes les 2 h',note:'Colique légère, crottins et appétit',status:'en cours'},
 {id:'s7',horse:'h06',kind:'Ostéopathe',who:'Camille Hervé',date:iso(day(8)),time:'15:00',note:'Bilan dos après repos',status:'planifié'},
 {id:'s8',horse:'h16',kind:'Dentiste',who:'Pierre Valat',date:iso(day(15)),time:'10:00',note:'Râpage annuel, 6 chevaux',status:'planifié'},
 {id:'s9',horse:'h01',kind:'Vétérinaire',who:'Dr Leclerc',date:iso(day(-30)),time:'11:00',note:'Bilan locomoteur, RAS',status:'fait'},
 {id:'s10',horse:'h01',kind:'Vermifuge',who:'Équipe',date:iso(day(-62)),time:'08:00',note:'Pyrantel',status:'fait'},
 {id:'s11',horse:'h01',kind:'Vaccin',who:'Dr Leclerc',date:iso(day(-140)),time:'10:00',note:'Grippe + rhino',status:'fait'}];
D.journal=[
 {horse:'h01',who:'m019',role:'Demi-pensionnaire',when:'Hier, 18:40',text:'Séance sur le plat 45 min, très bien dans le rond. Un peu raide à main gauche au début.',kind:'travail',mood:4},
 {horse:'h01',who:'s05',role:'Palefrenier',when:'Hier, 07:10',text:'A tout mangé, crottins normaux. Couverture 150 g mise pour la nuit.',kind:'soin',mood:5},
 {horse:'h01',who:'m001',role:'Propriétaire',when:'Dim. 15 nov.',text:'Balade en forêt 1 h 30 avec Quiétude, super sage.',kind:'balade',mood:5},
 {horse:'h01',who:'s02',role:'Moniteur',when:'Sam. 14 nov.',text:'Travail à l’obstacle, gymnastique sur 5 éléments. Cheval très respectueux.',kind:'travail',mood:5}];

/* ---------- Tâches et entretien ---------- */
D.tasks=[
 {id:'t1',title:'Distribution du matin',zone:'Toutes les écuries',who:'s05',time:'07:00',done:true,kind:'routine'},
 {id:'t2',title:'Sortie au paddock, groupe A',zone:'Prairie du bas',who:'s06',time:'08:30',done:true,kind:'routine'},
 {id:'t3',title:'Curer les boxes B01 à B16',zone:'Écurie principale',who:'s05',time:'09:00',done:false,kind:'routine'},
 {id:'t4',title:'Vermifuger Bijou',zone:'B27',who:'s06',time:'10:00',done:false,kind:'soin'},
 {id:'t5',title:'Surveiller Xanthos (colique)',zone:'B23',who:'s05',time:'Toutes les 2 h',done:false,kind:'soin',urgent:true},
 {id:'t6',title:'Herser la carrière d’honneur',zone:'Carrière d’honneur',who:'s07',time:'13:30',done:false,kind:'entretien'},
 {id:'t7',title:'Préparer Tornado pour le véto',zone:'B04',who:'s06',time:'13:45',done:false,kind:'soin'},
 {id:'t8',title:'Réparer la lisse du paddock d’hiver',zone:'Paddock d’hiver',who:'s07',time:'14:00',done:false,kind:'entretien'},
 {id:'t9',title:'Rentrée des paddocks',zone:'Tous les paddocks',who:'s06',time:'16:30',done:false,kind:'routine'},
 {id:'t10',title:'Distribution du soir',zone:'Toutes les écuries',who:'s05',time:'18:00',done:false,kind:'routine'}];
D.stock=[
 {id:'k1',name:'Foin de prairie',unit:'balles rondes',qty:34,min:20,daily:2.1,supplier:'Fourrages du Hurepoix',price:62},
 {id:'k2',name:'Copeaux dépoussiérés',unit:'sacs',qty:41,min:60,daily:9,supplier:'Litière Pro',price:11.5},
 {id:'k3',name:'Granulés floconnés',unit:'sacs 25 kg',qty:18,min:12,daily:1.4,supplier:'Coopérative Agralys',price:16.9},
 {id:'k4',name:'Paille de blé',unit:'balles',qty:12,min:10,daily:.8,supplier:'Fourrages du Hurepoix',price:38},
 {id:'k5',name:'Vermifuges',unit:'seringues',qty:7,min:10,daily:0,supplier:'Centrale véto',price:14},
 {id:'k6',name:'Huile de lin',unit:'bidons 5 L',qty:6,min:3,daily:.1,supplier:'Coopérative Agralys',price:21}];
D.equipment=[
 {name:'Tracteur Kubota L1361',next:'Vidange dans 22 h moteur',status:'ok'},{name:'Herse carrière',next:'Dents à changer',status:'warn'},
 {name:'Marcheur 6 chevaux',next:'Contrôle annuel le 3 décembre',status:'ok'},{name:'Solarium',next:'2 lampes HS',status:'warn'},
 {name:'Abreuvoirs automatiques',next:'Antigel vérifié le 12 novembre',status:'ok'},{name:'Camion 6 places',next:'Contrôle technique dans 41 jours',status:'ok'}];

/* ---------- Capteurs et caméras ---------- */
D.cameras=[{id:'cam1',name:'Écurie principale, allée',box:null},{id:'cam2',name:'Box B23 · Xanthos',box:'B23',alert:'Se couche souvent'},{id:'cam3',name:'Box B04 · Tornado',box:'B04'},{id:'cam4',name:'Box B01 · Ulysse',box:'B01'},{id:'cam5',name:'Grand manège',box:null},{id:'cam6',name:'Paddock des poneys',box:null},{id:'cam7',name:'Sellerie',box:null},{id:'cam8',name:'Portail et parking',box:null}];
D.sensors=[
 {id:'z1',name:'Abreuvoir B23',kind:'eau',val:'3,1 L / h',state:'warn',note:'Consommation en baisse de 40 %'},
 {id:'z2',name:'Écurie principale',kind:'temp',val:'7,4 °C',state:'ok',note:'Humidité 71 %'},
 {id:'z3',name:'Sellerie',kind:'temp',val:'14,2 °C',state:'ok',note:'Humidité 52 %'},
 {id:'z4',name:'Silo à granulés',kind:'niveau',val:'38 %',state:'ok',note:'Environ 11 jours'},
 {id:'z5',name:'Clôture électrique prairie',kind:'elec',val:'6,8 kV',state:'ok',note:'Aucune fuite'},
 {id:'z6',name:'Ulysse · capteur de selle',kind:'travail',val:'52 min',state:'ok',note:'Séance d’hier, 38 % au galop'}];
D.weather=[{d:'Auj.',t:9,i:'cloud',r:10},{d:'Mer',t:11,i:'sun',r:0},{d:'Jeu',t:8,i:'rain',r:80},{d:'Ven',t:7,i:'rain',r:60},{d:'Sam',t:10,i:'sun',r:5},{d:'Dim',t:12,i:'cloud',r:20},{d:'Lun',t:9,i:'cloud',r:30}];

/* ---------- Contrats ---------- */
D.contracts=[
 {id:'ct1',title:'Contrat de pension complète',party:'m001',horse:'h01',status:'signé',date:'2024-09-01',amount:520},
 {id:'ct2',title:'Contrat de demi-pension',party:'m019',horse:'h01',status:'à signer',date:iso(day(-1)),amount:180,signers:['m001','m019','s01'],signed:['s01']},
 {id:'ct3',title:'Inscription saison 2026-2027 et règlement intérieur',party:'m044',status:'à signer',date:iso(day(-3)),amount:780},
 {id:'ct4',title:'Autorisation parentale et droit à l’image',party:'m012',status:'signé',date:iso(day(-40))},
 {id:'ct5',title:'Contrat de travail CDD, Kévin Bernard',party:'s07',status:'signé',date:'2026-09-01'},
 {id:'ct6',title:'Convention de stage BPJEPS',party:'s08',status:'signé',date:'2026-09-01'},
 {id:'ct7',title:'Mise à disposition d’un cheval, Pistache',party:'m066',horse:'h16',status:'brouillon',date:iso(day(0))},
 {id:'ct8',title:'Décharge balade extérieure',party:'m091',status:'à signer',date:iso(day(0))}];
D.templates=['Pension complète','Pension pré','Demi-pension','Inscription et règlement intérieur','Autorisation parentale et droit à l’image','Mise à disposition d’un cheval','Vente de cheval','Location de box','Contrat de travail','Décharge de responsabilité'];

/* ---------- Messages et notifications ---------- */
D.threads=[
 {id:'th1',with:'m001',title:'Léa Martin',last:'Merci ! Je passe signer ce soir.',when:'09:12',unread:1},
 {id:'th2',with:'grp',title:'Groupe Concours Rambouillet',last:'Thomas : départ 6 h 45, soyez là à 6 h 30',when:'08:47',unread:4},
 {id:'th3',with:'m142',title:'Famille Laurent',last:'Est-ce que Chloé peut rattraper samedi ?',when:'Hier',unread:0},
 {id:'th4',with:'s05',title:'Antoine Leroy',last:'Xanthos a recrotté, il mange un peu',when:'08:05',unread:0}];
D.notifs=[
 {i:'alert',c:'bad',t:'Xanthos (B23) : consommation d’eau en baisse de 40 %',w:'il y a 12 min'},
 {i:'invoice',c:'warn',t:'7 factures en retard pour 2 340 €',w:'ce matin'},
 {i:'contract',c:'acc',t:'Contrat de demi-pension d’Ulysse en attente de 2 signatures',w:'hier'},
 {i:'stock',c:'warn',t:'Copeaux sous le seuil : 41 sacs, environ 4 jours',w:'ce matin'},
 {i:'members',c:'ok',t:'3 nouvelles inscriptions en ligne cette semaine',w:'lun.'}];

/* ---------- Outils ---------- */
/* ---------- Données partagées entre lots (manches 2) ---------- */
/* chevaux déclarés par des adhérents ou des coachs, en attente de validation par la gérante. Un ajout côté adhérent fait push ici. */
D.declarations=[
 {id:'dc1',by:'m083',link:'Propriétaire',name:'Quartz du Moulin',sire:'25041873K',breed:'Selle Français',coat:'Alezan',born:2019,chip:'250259600418731',stay:'pension',box:'B45',when:'Hier, 21:12',status:'en attente'},
 {id:'dc2',by:'c01',link:'Propriétaire (coach)',name:'Vigo des Bruyères',sire:'21008342T',breed:'KWPN',coat:'Bai',born:2017,chip:'528210004183427',stay:'passage',box:null,when:'Lundi, 08:30',status:'en attente'}];
/* réservations de pistes par les propriétaires (onglet Installations côté adhérent, Jour par piste côté planning) */
D.trackBookings=[
 {id:'tb1',who:'m014',horse:'h26',arena:'a3',date:iso(day(0)),from:'12:30',to:'13:30'},
 {id:'tb2',who:'m052',horse:'h06',arena:'a2',date:iso(day(0)),from:'15:00',to:'16:00'},
 {id:'tb3',who:'m001',horse:'h01',arena:'a2',date:iso(day(1)),from:'09:00',to:'10:00'}];
/* faits de référence partagés : un seul chiffre partout */
D.facts={leaRambouillet:{passage:'11:42',order:'14e sur 32',bib:214,recon:'11:10',warmup:'11:20',paddock:'B',classe:'Club Élite · 115 cm'},
 leaBalance:410,leaInvoice:{id:'F-2026-1173',total:520,left:410},
 paulineToday:[{at:'11:15',what:'Cours particulier Léa Martin et Ulysse',arena:'a2'},{at:'12:15',what:'Cours collectif CSO',arena:'a2'},{at:'14:00',what:'Créneau libre'}],
 hersage:{at:'13:30',arena:'a2'},staff:'8 salariés et la gérante',bcsScale:'sur 5',ulysseBcs:3,
 emmaContract:'Avenant de renouvellement de la demi-pension (en place depuis le 1er septembre)'};
D.find=function(col,idv){return (D[col]||[]).find(function(x){return x.id===idv})};
D.member=function(i){return D.find('members',i)};D.horse=function(i){return D.find('horses',i)};D.staffer=function(i){return D.find('staff',i)};D.coach=function(i){return D.find('coaches',i)};
D.person=function(i){return D.member(i)||D.staffer(i)||D.coach(i)};
D.name=function(i){var p=D.person(i);return p?p.first+' '+p.last:''};
window.DATA=D;
})();
