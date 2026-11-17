/* Vue gérant · Lot B : Chevaux, fiche cheval 3D, soins, alimentation */
(function(){
var D=P.D,F=P.fmt,U=P.ui,C=P.chart,E=F.esc;

/* =====================================================================
   1. Données propres au lot (déterministes) et mise en cohérence
   ===================================================================== */
function iso(o){return D.iso(D.day(o))}
function addDays(s,n){var d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return D.iso(d)}
function rng(seed){var s=seed>>>0||1;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function hi(h){return D.horses.indexOf(h)}

var RULES={
 vacc:{l:'Vaccin grippe',k:'Vaccin',every:365,soon:30,icon:'syringe',c:'var(--c7)',price:58,who:'p1',rule:'Rappel annuel. Obligatoire pour sortir en concours FFE.'},
 worm:{l:'Vermifuge',k:'Vermifuge',every:120,soon:14,icon:'pill',c:'var(--c5)',price:22,who:'eq',rule:'Selon la coproscopie : traitement ciblé des forts excréteurs.'},
 farrier:{l:'Maréchal',k:'Maréchal',every:49,soon:10,icon:'hoof',c:'var(--c4)',price:95,who:'p2',rule:'Toutes les 6 à 8 semaines, 7 semaines par défaut.'},
 dentist:{l:'Dentiste',k:'Dentiste',every:365,soon:30,icon:'tooth',c:'var(--c3)',price:70,who:'p3',rule:'Contrôle et râpage une fois par an.'},
 osteo:{l:'Ostéopathe',k:'Ostéopathe',every:182,soon:21,icon:'bone',c:'var(--c6)',price:80,who:'p4',rule:'Bilan tous les 6 mois, ou après un arrêt.'}};
var RK=['vacc','worm','farrier','dentist','osteo'];
var KINDC={'Vétérinaire':'var(--c1)','Maréchal':'var(--c4)','Vaccin':'var(--c7)','Vermifuge':'var(--c5)','Dentiste':'var(--c3)','Ostéopathe':'var(--c6)','Surveillance':'var(--c2)'};
var KINDI={'Vétérinaire':'care','Maréchal':'hoof','Vaccin':'syringe','Vermifuge':'pill','Dentiste':'tooth','Ostéopathe':'bone','Surveillance':'eye'};
D.practitioners=D.practitioners||[
 {id:'p1',name:'Dr Antoine Leclerc',short:'Dr Leclerc',job:'Vétérinaire sanitaire',kinds:['Vaccin','Vétérinaire'],phone:'06 12 45 78 01',trip:45,days:'Lundi et jeudi',key:'vacc'},
 {id:'p2',name:'Benoît Gautier',short:'Benoît Gautier',job:'Maréchal-ferrant',kinds:['Maréchal'],phone:'06 23 56 89 12',trip:0,days:'Jeudi',key:'farrier'},
 {id:'p3',name:'Pierre Valat',short:'Pierre Valat',job:'Dentiste équin',kinds:['Dentiste'],phone:'06 34 67 90 23',trip:30,days:'Sur rendez-vous',key:'dentist'},
 {id:'p4',name:'Camille Hervé',short:'Camille Hervé',job:'Ostéopathe équin',kinds:['Ostéopathe'],phone:'06 45 78 01 34',trip:25,days:'Mercredi',key:'osteo'}];
function prat(id){return D.practitioners.find(function(p){return p.id===id})}

/* Mise en cohérence unique des données de base avec les alertes, les soins planifiés et les autres écrans */
if(!D._lotB){D._lotB=true;
  var H=D.horses;
  /* la colique de la nuit concerne Xanthos au box B23 (tâches, caméras et accueil le nomment ainsi) */
  if(H[22].name!=='Xanthos'){var n22=H[22].name;H[22].name=H[23].name;H[23].name=n22}
  var FEM=['Quiétude','Vanille','Opale','Câline','Kalinka','Lune d’Or','Étoile','Hirondelle','Iris','Noisette','Volga','Pistache','Réglisse','Gribouille'];
  H.forEach(function(h){h.sex=FEM.indexOf(h.name)>=0?'Jument':'Hongre'});H[19].sex='Étalon';
  H[0].vacc=iso(-140);H[0].worm=iso(-62);H[0].farrier=iso(-47);H[0].dentist=iso(-229);H[0].osteo=iso(-130);
  H[7].vacc=iso(-359);H[11].farrier=iso(-58);H[26].worm=iso(-120);H[5].osteo=iso(-174);H[15].dentist=iso(-350);
  H[3].work=3;H[5].work=4;H[22].work=5;H[0].level='Galop 6-7';H[0].mood='Sensible';
  /* un club bien tenu : seuls les retards annoncés par les alertes restent en retard */
  var LATE={'11:farrier':1,'26:worm':1,'18:dentist':1};H[18].dentist=iso(-377);
  H.forEach(function(h,i){RK.forEach(function(k,j){var n=F.days(addDays(h[k],RULES[k].every));
    if(n<0&&!LATE[i+':'+k]){h[k]=iso(-RULES[k].every+3+((i*7+j*5)%24))}})});
}

/* ---------- Alimentation ---------- */
var PRICE={hay:.21,club:.52,flake:.68};
var SUPP={'Huile de lin':{d:.35,dose:'50 ml',when:'soir'},'Électrolytes':{d:.42,dose:'1 dose',when:'soir'},'Ail':{d:.2,dose:'20 g',when:'matin'},'Levures':{d:.45,dose:'1 mesure',when:'matin'},'Biotine':{d:.6,dose:'1 mesure',when:'matin'},'Aucun':{d:0,dose:'',when:''}};
function grainType(h){return h.kind==='proprietaire'?'Floconnés':'Granulés club'}
function r5(v){return Math.round(v*2)/2}
function meals(h){var hay=h.ration.hay,g=h.ration.grain,m=r5(hay*.4),s=r5(hay*.4),mi=Math.max(0,r5(hay-m-s)),gm=r5(g/2),gs=Math.max(0,r5(g-gm)),gmi=0;
  if(g>=3){gm=r5(g/3);gmi=r5(g/3);gs=r5(g-gm-gmi)}
  var sp=SUPP[h.ration.supp]||SUPP.Aucun;
  return {matin:{hay:m,grain:gm,supp:sp.when==='matin'?h.ration.supp:''},midi:{hay:mi,grain:gmi,supp:''},soir:{hay:s,grain:gs,supp:sp.when==='soir'?h.ration.supp:''}}}
function feedDay(h){var sp=SUPP[h.ration.supp]||SUPP.Aucun;return {hay:h.ration.hay*PRICE.hay,grain:h.ration.grain*(grainType(h)==='Floconnés'?PRICE.flake:PRICE.club),supp:sp.d}}
function feedDayTot(h){var f=feedDay(h);return f.hay+f.grain+f.supp}
function nec(h){var i=+h.id.slice(1);return {4:2.5,5:3,6:i%2?3:3.5,7:i%4===1?4:3.5}[h.bcs]||3}
function necTxt(v){return v<=2?'Maigre':v<=2.5?'État de travail':v<=3?'Optimal':v<=3.5?'Bon état':'En surpoids'}
var CONS={h04:'Foin au sol, mouillé',h23:'Diète : foin mouillé par petites poignées',h16:'Ration augmentée, à peser lundi',h06:'Pas de granulés pendant le repos',h01:'Carottes autorisées, pas de pain',h08:'Granulés trempés (dents)',h11:'Filet à foin petites mailles',h32:'Filet à foin petites mailles',h34:'Pas d’herbe riche'};
var MEDS={h04:{matin:'Phénylbutazone, 1 sachet',soir:'Phénylbutazone, 1 sachet'},h23:{matin:'Rien par la bouche avant le passage du vétérinaire',midi:'Mash tiède, 1 litre',soir:'Mash tiède, 1 litre'}};

/* ---------- Données dérivées par cheval (mises en cache) ---------- */
var XC={};
var SIRES=['Diamant de Semilly','Kannan','Quidam de Revel','Mylord Carthago','Nabab de Rêve','Calvaro','Jaguar Mail','Linaro','Machno Carwyn','Dexter Leam Pondi','Ready Boy','Upsilon'];
var DAMS=['Bahia des Prés','Fleur de Mai','Java de Kerglenn','Idylle du Bois','Ondine du Lys','Élégie d’Ouilly','Tzigane du Val','Noisette de Brecey','Harmonie du Gué','Valse de Cléry'];
var BREED=['Élevage de la Roche','Haras du Moulin','Élevage des Prés','Écurie du Val','Haras de Kerglenn','EARL du Bois Joli'];
var INS=['Mutuelle Équine de France','Assurances du Galop','Cavalière Assurances'];
function X(h){if(XC[h.id])return XC[h.id];var i=hi(h),r=rng(7919*(i+3)),x={},k;
  x.ueln='250001'+h.sire.slice(6);x.sireNo=h.sire.slice(4);
  x.born=(2026-h.age)+'-'+String(3+i%4).padStart(2,'0')+'-'+String(1+(i*7)%27).padStart(2,'0');
  x.father=SIRES[i%SIRES.length];x.mother=DAMS[(i*3)%DAMS.length];x.breeder=BREED[i%BREED.length];
  x.arrival=(2026-1-(i%6))+'-'+String(1+(i*5)%12).padStart(2,'0')+'-01';if(i===0)x.arrival='2024-09-01';
  x.ins=h.owner?{co:INS[i%INS.length],no:'EQ-'+(48000+i*137),cover:'Responsabilité civile, mortalité, frais vétérinaires',until:iso(40+i*9)}:{co:'Contrat cavalerie du club',no:'CAV-7812045',cover:'Responsabilité civile, mortalité',until:'2027-08-31'};
  x.rider=(D.halfboard.find(function(d){return d.horse===h.id})||{}).rider;
  /* poids : 12 mois */
  var w=[],base=h.weight-6+Math.round(r()*12);for(k=0;k<12;k++)w.push(Math.round(base+Math.sin((k+i)/2)*6+(r()-.5)*5));w[11]=h.weight;w[10]=h.weight+(i===15?7:1);w[9]=h.weight+(i===15?12:-2);if(i===15)w[8]=h.weight+13;x.weights=w;
  x.nec=nec(h);
  /* travail : semaine en cours (lundi à dimanche) */
  x.week=week(h,i,r);
  var hist=[];for(k=0;k<11;k++)hist.push(Math.max(0,Math.round((h.work+(r()-.5)*5+(i===3||i===22?4:0))*2)/2));hist.push(h.work);x.hist=hist;
  var club=h.kind==='club',T=club?[['Reprises',.74,'var(--acc)'],['Longe',.08,'var(--c3)'],['Balades',.12,'var(--c7)'],['Stages',.06,'var(--c4)']]:[['Plat et dressage',.42,'var(--acc)'],['Obstacle',.24,'var(--c4)'],['Balades',.18,'var(--c7)'],['Longe',.1,'var(--c3)'],['Coaching',.06,'var(--c5)']];
  var mh=hist.slice(8).reduce(function(a,b){return a+b},0);x.types=T.map(function(t){return {l:t[0],v:Math.max(.5,Math.round(mh*t[1]*2)/2),c:t[2]}});
  x.sensor=(i===0||i%7===3)&&h.status!=='bad';
  /* coûts mensuels */
  var f=feedDay(h),far=h.pony?45:95,c=[['Foin','hay',f.hay*30.4],['Granulés','feed',f.grain*30.4],['Compléments','pill',f.supp*30.4],['Litière','shavings',h.pony?48:62],['Maréchalerie','hoof',far*30.4/49],['Vétérinaire et soins','care',h.age>15?41:29]].map(function(a){return {l:a[0],i:a[1],v:Math.round(a[2])}}).filter(function(a){return a.v>0});
  var sum=c.reduce(function(a,b){return a+b.v},0),base0=h._cost0||(h._cost0=h.costMonth),rest=Math.max(64,base0-sum),lab=Math.round(rest*.62);
  c.push({l:'Main-d’œuvre',i:'team',v:lab,s:String(Math.round(lab/15.2*10)/10).replace('.',',')+' h de soins, sorties et curage'});c.push({l:'Box, eau, électricité',i:'stable',v:rest-lab});
  x.costs=c;h.costMonth=sum+rest;
  x.pension=h.owner?(h.pony?440:520):0;
  x.income=h.owner?x.pension:Math.round(h.work*4.33*17);
  x.incomeL=h.owner?'Pension complète':'Recettes des reprises';
  x.trend=D.months.map(function(m,q){return Math.round(h.costMonth*(.93+((q*5+i)%7)*.02))});x.trend[11]=h.costMonth;
  XC[h.id]=x;return x}

var DAYSL=['Lundi 16','Mardi 17','Mercredi 18','Jeudi 19','Vendredi 20','Samedi 21','Dimanche 22'];
function week(h,i,r){
  if(i===0)return [
   [{t:'17:45',d:60,k:'Plat',w:'Emma Moreau, demi-pensionnaire',in:2,done:true}],
   [{t:'18:00',d:60,k:'Reprise Galop 6-7 CSO',w:'Thomas Roux, avec Léa Martin',in:3}],
   [],
   [{t:'09:00',d:0,k:'Maréchal',w:'Benoît Gautier, ferrure complète',care:true},{t:'17:00',d:30,k:'Longe',w:'Lucie Petit',in:1}],
   [{t:'16:30',d:60,k:'Coaching CSO',w:'Pauline Arnaud, avec Léa Martin',in:3}],
   [{t:'10:30',d:90,k:'Plat et barres au sol',w:'Emma Moreau, demi-pensionnaire',in:2}],
   [{t:'11:20',d:120,k:'Concours Rambouillet',w:'Club Élite 115 cm, Léa Martin',in:3}]];
  var out=[[],[],[],[],[],[],[]],left=h.work,club=h.kind==='club',rest=(i*3)%7,order=[5,2,1,3,0,4,6],guard=0;
  var KC=['Reprise Galop 3-4','Reprise Galop 5-6','Reprise Galop 1-2','Balade en forêt','Longe'],KO=['Plat','Obstacle','Balade','Longe','Coaching dressage'],TM=['10:00','14:00','17:00','18:00','19:00'];
  var st=['Hugo Lefèvre','Inès Garnier','Thomas Roux'],own=h.owner?D.name(h.owner):'';
  while(left>0&&guard<60){var d=order[guard%7];guard++;if(d===rest||out[d].length>=3)continue;if(h.status==='bad'&&d>0)continue;
    var dur=left>=1?60:30,kk=(club?KC:KO)[(i+guard)%5],lon=kk==='Longe',tm=TM[(out[d].length*2+i+d)%5];
    if(out[d].some(function(s){return s.t===tm}))tm=TM[(TM.indexOf(tm)+1)%5];
    out[d].push({t:tm,d:dur,k:kk,w:club?(lon?'Lucie Petit':st[(i+d)%3]):(lon?'Lucie Petit':own),in:lon?1:/CSO|Obstacle|5-6/.test(kk)?3:2,done:d===0});left-=dur/60}
  out.forEach(function(a){a.sort(function(p,q){return p.t<q.t?-1:1})});
  return out}

/* ---------- Soins : historique, échéances, tournées ---------- */
function due(h,k){return addDays(h[k],RULES[k].every)}
function dueN(h,k){return F.days(due(h,k))}
function dueSt(h,k){var n=dueN(h,k);return n<0?'bad':n<=RULES[k].soon?'warn':'ok'}
function dueTxt(n){return n<0?'en retard de '+(-n)+' j':n===0?'aujourd’hui':n===1?'demain':n<60?'dans '+n+' j':'dans '+Math.round(n/30.4)+' mois'}
function nextDue(h){var b=null;RK.forEach(function(k){var n=dueN(h,k);if(!b||n<b.n)b={k:k,n:n}});return b}
function carePrice(h,k){return k==='farrier'&&h.pony?45:RULES[k].price}

D.tours=D.tours||(function(){
  function pickH(k,max,lim,must){var l=D.horses.filter(function(h){return dueN(h,k)<=max}).sort(function(a,b){return dueN(a,k)-dueN(b,k)}).map(function(h){return h.id});
    if(must&&l.indexOf(must)<0)l.unshift(must);return l.slice(0,lim)}
  return [
   {id:'t1',pr:'p2',kind:'Maréchal',key:'farrier',date:iso(2),time:'09:00',horses:pickH('farrier',9,8,'h01'),status:'confirmé',note:'Ferrures et parages, forge installée dans la cour.'},
   {id:'t2',pr:'p1',kind:'Vaccin',key:'vacc',date:iso(6),time:'10:00',horses:pickH('vacc',95,7,'h08'),status:'confirmé',note:'Rappels grippe et tétanos, signature des carnets.'},
   {id:'t3',pr:'p3',kind:'Dentiste',key:'dentist',date:iso(15),time:'10:00',horses:pickH('dentist',45,6,'h16'),status:'confirmé',note:'Râpage annuel. Prévoir le box de soins.'},
   {id:'t4',pr:'p4',kind:'Ostéopathe',key:'osteo',date:iso(8),time:'15:00',horses:pickH('osteo',12,3,'h06'),status:'en attente',note:'Bilan du dos d’Opale après son repos.'}]})();
function tourOf(h,k){return D.tours.find(function(t){return t.key===k&&t.horses.indexOf(h.id)>=0})}

D.pharmacy=D.pharmacy||[
 {id:'ph1',name:'Phénylbutazone 1 g',form:'Sachets, voie orale',qty:18,unit:'sachets',min:10,lot:'PB26-0912',exp:iso(212),rx:true,wait:'Exclusion définitive',use:'Anti-inflammatoire'},
 {id:'ph2',name:'Flunixine méglumine 50 mg/ml',form:'Injectable, flacon de 100 ml',qty:1,unit:'flacon',min:1,lot:'FX-88213',exp:iso(38),rx:true,wait:'10 jours',use:'Colique, douleur'},
 {id:'ph3',name:'Ivermectine et praziquantel',form:'Seringue orale',qty:7,unit:'seringues',min:10,lot:'IV-2607A',exp:iso(420),rx:true,wait:'35 jours',use:'Vermifuge'},
 {id:'ph4',name:'Pyrantel',form:'Seringue orale',qty:5,unit:'seringues',min:4,lot:'PY-5521',exp:iso(300),rx:true,wait:'Aucun',use:'Vermifuge'},
 {id:'ph5',name:'Collyre antibiotique',form:'Flacon de 5 ml',qty:2,unit:'flacons',min:1,lot:'TB-3310',exp:iso(21),rx:true,wait:'Aucun',use:'Soins des yeux'},
 {id:'ph6',name:'Pommade cicatrisante au miel',form:'Pot de 250 g',qty:1,unit:'pot',min:1,lot:'MI-0448',exp:iso(-12),rx:false,wait:'Aucun',use:'Plaies'},
 {id:'ph7',name:'Chlorhexidine 0,5 %',form:'Solution, 1 litre',qty:3,unit:'flacons',min:2,lot:'CH-1190',exp:iso(540),rx:false,wait:'Aucun',use:'Désinfection'},
 {id:'ph8',name:'Détomidine en gel',form:'Seringue buccale',qty:2,unit:'seringues',min:1,lot:'DT-7745',exp:iso(160),rx:true,wait:'2 jours',use:'Sédation légère (tonte, dentiste)'},
 {id:'ph9',name:'Argile verte',form:'Seau de 4 kg',qty:2,unit:'seaux',min:1,lot:'AR-2201',exp:iso(700),rx:false,wait:'Aucun',use:'Tendons après l’effort'}];
function hname(id){var h=D.horse(id);return h?h.name:''}
D.register=D.register||[
 {id:'r1',date:iso(0),time:'03:40',horse:'h23',prod:'Flunixine méglumine 50 mg/ml',lot:'FX-88213',dose:'10 ml, voie intraveineuse',by:'Dr Leclerc',rx:'ORD-2026-0418',wait:'10 jours',why:'Colique légère'},
 {id:'r2',date:iso(0),time:'07:10',horse:'h04',prod:'Phénylbutazone 1 g',lot:'PB26-0912',dose:'1 sachet dans la ration',by:'Mamadou Diallo',rx:'ORD-2026-0411',wait:'Exclusion définitive',why:'Boiterie antérieur gauche'},
 {id:'r3',date:iso(-1),time:'18:05',horse:'h04',prod:'Phénylbutazone 1 g',lot:'PB26-0912',dose:'1 sachet dans la ration',by:'Lucie Petit',rx:'ORD-2026-0411',wait:'Exclusion définitive',why:'Boiterie antérieur gauche'},
 {id:'r4',date:iso(-1),time:'07:12',horse:'h04',prod:'Phénylbutazone 1 g',lot:'PB26-0912',dose:'1 sachet dans la ration',by:'Mamadou Diallo',rx:'ORD-2026-0411',wait:'Exclusion définitive',why:'Boiterie antérieur gauche'},
 {id:'r5',date:iso(-4),time:'08:30',horse:'h15',prod:'Ivermectine et praziquantel',lot:'IV-2607A',dose:'1 seringue, 350 kg',by:'Lucie Petit',rx:'ORD-2026-0397',wait:'35 jours',why:'Coproscopie à 650 œufs par gramme'},
 {id:'r6',date:iso(-7),time:'08:20',horse:'h17',prod:'Pyrantel',lot:'PY-5521',dose:'1 seringue, 500 kg',by:'Mamadou Diallo',rx:'ORD-2026-0397',wait:'Aucun',why:'Coproscopie à 400 œufs par gramme'},
 {id:'r7',date:iso(-9),time:'11:15',horse:'h28',prod:'Collyre antibiotique',lot:'TB-3310',dose:'2 gouttes, œil droit, 3 fois par jour',by:'Lucie Petit',rx:'ORD-2026-0389',wait:'Aucun',why:'Conjonctivite'},
 {id:'r8',date:iso(-12),time:'10:00',horse:'h08',prod:'Détomidine en gel',lot:'DT-7745',dose:'1 ml sous la langue',by:'Claire Morel',rx:'ORD-2026-0381',wait:'2 jours',why:'Tonte'}];

/* historique et échéances d'un cheval */
function careLog(h){var x=[],i=hi(h);
  RK.forEach(function(k){var R=RULES[k],n=k==='farrier'?4:k==='worm'?3:2;for(var j=0;j<n;j++){var d=addDays(h[k],-R.every*j);
    x.push({id:h.id+k+j,date:d,kind:R.k,key:k,who:R.who==='eq'?'Équipe':prat(R.who).short,note:k==='farrier'?(h.pony?'Parage des quatre pieds':'Ferrure complète'+(i===0?', plaques aux antérieurs':'')):k==='vacc'?'Grippe et tétanos, lot VX-'+(4410+i+j):k==='worm'?(j%2?'Pyrantel':'Ivermectine et praziquantel')+', coproscopie '+(150+((i*37+j*90)%500))+' œufs par gramme':k==='dentist'?'Râpage, pas de surdent':'Séance complète, bassin et dorsales',price:carePrice(h,k),status:'fait'})}});
  D.care.filter(function(c){return c.horse===h.id}).forEach(function(c){if(RK.some(function(k){return RULES[k].k===c.kind}))return;
    x.push({id:c.id,date:c.date,time:c.time,kind:c.kind,who:c.who,note:c.note,price:c.kind==='Vétérinaire'?68:0,status:c.status})});
  if(i===0)x.push({id:'h01t1',date:'2026-03-12',kind:'Vétérinaire',who:'Dr Leclerc',note:'Tendinite du fléchisseur superficiel, antérieur gauche. Échographie, repos de 6 semaines.',price:186,status:'fait',doc:'Échographie et ordonnance'},{id:'h01t2',date:'2026-04-28',kind:'Vétérinaire',who:'Dr Leclerc',note:'Échographie de contrôle : tendon cicatrisé, reprise progressive du travail.',price:112,status:'fait',doc:'Compte rendu'});
  if(i===3)x.push({id:'h04a',date:iso(-2),kind:'Vétérinaire',who:'Dr Leclerc',note:'Boiterie de grade 2 sur 5 à l’antérieur gauche, chaleur au tendon. Anti-inflammatoire 5 jours, box.',price:92,status:'fait',doc:'Ordonnance ORD-2026-0411'});
  if(i===22)x.push({id:'h23a',date:iso(0),time:'03:40',kind:'Vétérinaire',who:'Dr Leclerc',note:'Colique légère sans déplacement. Injection de flunixine, diète, surveillance toutes les 2 heures.',price:148,status:'fait',doc:'Ordonnance ORD-2026-0418'});
  /* échéances */
  RK.forEach(function(k){var t=tourOf(h,k),R=RULES[k],d=due(h,k);
    x.push({id:h.id+k+'n',date:t?t.date:d,time:t?t.time:'',kind:R.k,key:k,who:R.who==='eq'?'Équipe':prat(R.who).short,note:t?'Tournée groupée, '+t.horses.length+' chevaux':R.rule,price:carePrice(h,k),status:t?'planifié':F.days(d)<0?'en retard':F.days(d)===0?'à faire':'à planifier',next:true})});
  return x.sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:0})}

function rx(h){var i=hi(h),o=[];
  if(i===3)o.push({no:'ORD-2026-0411',d:iso(-2),who:'Dr Leclerc',med:'Phénylbutazone 1 g',pos:'1 sachet matin et soir dans la ration',dur:'5 jours, jusqu’à jeudi',wait:'Exclusion définitive de la consommation',on:true,given:[1,1,1,1,1,0,0,0,0,0]});
  if(i===22)o.push({no:'ORD-2026-0418',d:iso(0),who:'Dr Leclerc',med:'Flunixine méglumine 50 mg/ml',pos:'10 ml en intraveineuse, une fois. Diète puis mash tiède.',dur:'Surveillance 48 heures',wait:'10 jours',on:true,given:[1]});
  if(i===0)o.push({no:'ORD-2026-0102',d:'2026-03-12',who:'Dr Leclerc',med:'Méloxicam, suspension orale',pos:'30 ml par jour dans la ration',dur:'7 jours, terminé le 19 mars',wait:'3 jours',on:false});
  if(i===27)o.push({no:'ORD-2026-0389',d:iso(-9),who:'Dr Leclerc',med:'Collyre antibiotique',pos:'2 gouttes dans l’œil droit, 3 fois par jour',dur:'10 jours, jusqu’à demain',wait:'Aucun',on:true,given:[1,1,1]});
  return o}

/* zones du cheval 3D */
function zones(h){var i=hi(h),z={
  dents:{l:'Dents',pos:[.02,.64,.69],k:'dentist',st:dueSt(h,'dentist'),sum:'Dernier râpage le '+F.dateY(h.dentist)+'. Prochain contrôle '+dueTxt(dueN(h,'dentist'))+'.',ev:[{d:h.dentist,t:'Râpage complet',w:'Pierre Valat'},{d:addDays(h.dentist,-365),t:'Contrôle, extraction d’une dent de loup',w:'Pierre Valat'}]},
  nuque:{l:'Nuque et encolure',pos:[.03,.84,.52],st:'ok',sum:'Rien à signaler. Mobilité normale à gauche et à droite.',ev:[{d:h.osteo,t:'Cervicales libres après manipulation',w:'Camille Hervé'}]},
  dos:{l:'Dos et garrot',pos:[.04,.77,.02],k:'osteo',st:dueSt(h,'osteo'),sum:'Suivi par l’ostéopathe tous les 6 mois. Prochain bilan '+dueTxt(dueN(h,'osteo'))+'.',ev:[{d:h.osteo,t:'Séance complète, bassin et dorsales',w:'Camille Hervé'},{d:addDays(h.osteo,-182),t:'Contrôle de la selle, arçon adapté',w:'Camille Hervé'}]},
  ag:{l:'Antérieur gauche',pos:[.07,.2,.45],st:'ok',sum:'Membre sain. Tendons froids et secs.',ev:[{d:h.farrier,t:'Aplombs vérifiés à la ferrure',w:'Benoît Gautier'}]},
  sabots:{l:'Sabots',pos:[-.05,.06,.05],k:'farrier',st:dueSt(h,'farrier'),sum:(h.pony?'Parage':'Ferrure')+' toutes les 7 semaines. Prochain passage '+dueTxt(dueN(h,'farrier'))+'.',ev:[{d:h.farrier,t:h.pony?'Parage des quatre pieds':'Ferrure complète',w:'Benoît Gautier'},{d:addDays(h.farrier,-49),t:h.pony?'Parage':'Ferrure complète',w:'Benoît Gautier'},{d:addDays(h.farrier,-98),t:h.pony?'Parage':'Ferrure, un fer perdu remis',w:'Benoît Gautier'}]},
  ventre:{l:'Appareil digestif',pos:[.1,.47,-.2],k:'worm',st:dueSt(h,'worm'),sum:'Vermifuge ciblé selon la coproscopie. Prochain contrôle '+dueTxt(dueN(h,'worm'))+'.',ev:[{d:h.worm,t:'Vermifuge après coproscopie',w:'Équipe'},{d:addDays(h.worm,-120),t:'Coproscopie, faible excréteur',w:'Laboratoire'}]},
  jarret:{l:'Jarrets et postérieurs',pos:[.07,.25,-.64],st:'ok',sum:'Rien à signaler. Flexions négatives au dernier bilan.',ev:[{d:addDays(h.osteo,-20),t:'Flexions négatives',w:'Dr Leclerc'}]}};
  if(i===0){z.ag.st='warn';z.ag.sum='Ancienne tendinite du fléchisseur (mars 2026), guérie. Tendon contrôlé après chaque séance d’obstacle.';z.ag.ev=[{d:iso(-30),t:'Bilan locomoteur : rien à signaler',w:'Dr Leclerc'},{d:'2026-04-28',t:'Échographie de contrôle : tendon cicatrisé',w:'Dr Leclerc'},{d:'2026-03-12',t:'Boiterie, tendinite du fléchisseur superficiel. Repos 6 semaines',w:'Dr Leclerc'}];
    z.dos.st='warn';z.dos.sum='Un peu raide à main gauche en début de séance. À revoir avec l’ostéopathe.';z.dos.ev.unshift({d:iso(-1),t:'Raideur à main gauche notée par Emma Moreau',w:'Journal'});z.sabots.sum='Ferrure complète avec plaques aux antérieurs. Benoît Gautier passe jeudi à 9 h.'}
  if(i===3){z.ag.st='bad';z.ag.sum='Boiterie de grade 2 sur 5 depuis dimanche. Chaleur au tendon. Échographie aujourd’hui à 14 h avec le Dr Leclerc.';z.ag.ev=[{d:iso(0),t:'Échographie du tendon prévue à 14 h',w:'Dr Leclerc'},{d:iso(-2),t:'Boiterie de grade 2, anti-inflammatoire 5 jours',w:'Dr Leclerc'},{d:iso(-2),t:'Boiterie signalée après la reprise de 18 h',w:'Thomas Roux'}]}
  if(i===22){z.ventre.st='bad';z.ventre.sum='Colique légère cette nuit. Il boit 40 % de moins. Surveillance des crottins et de l’appétit toutes les 2 heures.';z.ventre.ev=[{d:iso(0),t:'08 h 05 : a recrotté, mange un peu',w:'Mamadou Diallo'},{d:iso(0),t:'03 h 40 : injection de flunixine, diète',w:'Dr Leclerc'},{d:iso(0),t:'02 h 55 : la caméra du box détecte un cheval couché et agité',w:'Caméra B23'}]}
  if(i===5){z.dos.st='warn';z.dos.sum='Repos de 3 jours prescrit. Bilan du dos avec Camille Hervé le '+F.date(iso(8))+'.'}
  if(i===15){z.ventre.st='warn';z.ventre.sum='Perte de 12 kg en 3 semaines. Ration augmentée, coproscopie envoyée au laboratoire.'}
  return z}
var ZK=['dents','nuque','dos','ag','sabots','ventre','jarret'];

function journal(h){var j=D.journal.filter(function(e){return e.horse===h.id});if(j.length)return j;var x=X(h),o=[];
  o.push({who:'s05',role:'Palefrenier',when:'Ce matin, 07:15',text:h.status==='bad'?h.alerts[0]+'. Je repasse le voir dans deux heures.':'A tout mangé, crottins normaux. Sorti au '+h.paddock.toLowerCase()+' à 8 h 30.',kind:'soin',mood:h.status==='bad'?2:5});
  o.push({who:h.kind==='club'?'s02':(h.owner||'s02'),role:h.kind==='club'?'Moniteur':'Propriétaire',when:'Hier, 18:10',text:h.kind==='club'?'Très appliqué en reprise, un peu sur l’œil près du pare-bottes.':'Séance de plat, 50 minutes. Bien dans la main, belles transitions.',kind:'travail',mood:4});
  if(x.rider)o.push({who:x.rider,role:'Demi-pensionnaire',when:'Sam. 14 nov.',text:'Balade d’une heure, calme et en avant. Douche aux membres au retour.',kind:'balade',mood:5});
  o.push({who:'s06',role:'Palefrenière',when:'Ven. 13 nov.',text:'Couverture d’hiver mise, 200 g. Pansage complet.',kind:'soin',mood:4});
  return o}
D.journalMore=D.journalMore||[
 {horse:'h01',who:'s06',role:'Palefrenière',when:'Ven. 13 nov.',text:'Douche des membres et argile après la séance de gymnastique. Tendons froids ce matin.',kind:'soin',mood:5},
 {horse:'h01',who:'s01',role:'Gérante',when:'Mer. 11 nov.',text:'Benoît Gautier confirme la ferrure jeudi 19 à 9 h, plaques aux antérieurs comme la dernière fois.',kind:'soin',mood:4}];

var DOCS=[['Livret d’identification (passeport)','doc','PDF, 14 pages','SIRE'],['Carnet de vaccination','syringe','Mis à jour le ','Santé'],['Carte d’immatriculation','owner','Propriétaire enregistré au SIRE','SIRE'],['Contrat de pension','sign','Signé en ligne','Contrat'],['Attestation d’assurance','shield','Valable jusqu’au ','Assurance'],['Radios de la visite d’achat','image','18 clichés','Santé'],['Factures de soins','invoice','12 derniers mois','Factures']];

/* =====================================================================
   2. Styles et composants partagés du lot
   ===================================================================== */
P.css(`
/* ---- communs ---- */
.lb-kpis{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.lb-kpi{padding:14px 16px;display:flex;flex-direction:column;gap:5px;min-width:0}
.lb-kpi .lab{font-size:12.5px;color:var(--mut);display:flex;align-items:center;gap:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lb-kpi .val{font:700 26px/1.05 var(--f-display);letter-spacing:-.035em;font-variant-numeric:tabular-nums;white-space:nowrap}
.lb-kpi .val small{font-size:14px;color:var(--mut);font-weight:600;letter-spacing:-.01em;margin-left:4px}
.lb-kpi .sub{font-size:12px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lb-tools{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
.lb-tools .search{flex:1 1 220px;max-width:360px;margin-right:auto}
.lb-tags{display:flex;gap:6px;flex-wrap:nowrap;padding:2px}
.lb-tags .tag{flex:none;white-space:nowrap}
.lb-tags .tag b{font-weight:600;color:var(--mut);font-variant-numeric:tabular-nums}
.lb-tags .tag[aria-pressed="true"] b{color:inherit;opacity:.7}
.lb-sq{width:32px;height:32px;border-radius:10px;display:inline-grid;place-items:center;flex:none;background:var(--acc-pale);color:var(--acc)}
.lb-sq.ok{background:var(--ok-pale);color:var(--ok)}.lb-sq.warn{background:var(--warn-pale);color:var(--warn)}.lb-sq.bad{background:var(--bad-pale);color:var(--bad)}.lb-sq.mut{background:var(--bg-2);color:var(--mut)}
.lb-sq.sm{width:26px;height:26px;border-radius:8px}
.lb-dl{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:12px 18px}
.lb-dl>div{min-width:0}
.lb-dl dt{font-size:11.5px;color:var(--mut);margin-bottom:2px}
.lb-dl dd{margin:0;font-weight:600;font-size:13.5px;overflow-wrap:anywhere}
.lb-row{display:flex;align-items:center;gap:12px;padding:11px 16px;min-width:0;position:relative}
.lb-row+.lb-row{border-top:1px solid var(--line)}
.lb-row.click{cursor:pointer;transition:background var(--t-1)}.lb-row.click:hover{background:var(--surface-2)}
.lb-row .t{font-weight:600;font-size:13.5px}.lb-row .grow>.s{font-size:12.5px;color:var(--mut)}
.lb-step{display:inline-flex;align-items:center;gap:0;border-radius:var(--r-sm);box-shadow:inset 0 0 0 1px var(--line-2);background:var(--surface);flex:none}
.lb-step button{width:38px;height:38px;display:grid;place-items:center;color:var(--ink-2)}
.lb-step button:active{transform:scale(.92)}
.lb-step output{min-width:60px;text-align:center;font-weight:700;font-variant-numeric:tabular-nums;white-space:nowrap}
.lb-bar2{height:10px;border-radius:99px;background:var(--bg-2);display:flex;overflow:hidden}
.lb-bar2 i{display:block;height:100%;background:var(--c)}
.lb-bar2 i+i{box-shadow:-1.5px 0 0 var(--surface)}
.lb-drop{border-radius:var(--r-lg);border:1.5px dashed var(--line-2);padding:26px 18px;text-align:center;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;transition:border-color var(--t-2),background var(--t-2);width:100%}
.lb-drop:hover{border-color:var(--acc);background:var(--acc-pale)}
.lb-sel{position:sticky;bottom:12px;z-index:4;display:flex;align-items:center;gap:12px;padding:10px 12px 10px 16px;border-radius:var(--r-lg);background:var(--navy);color:var(--navy-ink);box-shadow:var(--shadow-3);animation:pop var(--t-3) var(--e-spring) both}
.lb-sel .btn{box-shadow:none}
.lb-thr{position:relative}
.lb-thr u{position:absolute;top:-3px;bottom:-3px;width:2px;border-radius:2px;background:var(--ink);opacity:.55}
@container main (max-width:1080px){.lb-kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}
@container main (max-width:520px){.lb-kpis{gap:10px}.lb-kpi{padding:12px}.lb-kpi .val{font-size:22px}.lb-kpi .val small{font-size:12.5px}.lb-tools .search{max-width:none;flex-basis:100%}.lb-dl{gap:10px 14px}}

/* ---- cheptel ---- */
.hx-tg{order:5;flex-basis:100%}
.hx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(262px,1fr));gap:14px}
.hx-c{padding:14px 14px 0;display:flex;flex-direction:column;gap:11px;text-align:left;overflow:hidden}
.hx-top{display:flex;gap:12px;align-items:center;min-width:0}
.hx-top h3{font-size:15.5px;letter-spacing:-.02em}
.hx-chips{display:flex;gap:5px;flex-wrap:wrap;min-height:22px}
.hx-al{display:flex;gap:6px;align-items:flex-start;font-size:12px;line-height:1.35;color:var(--ink-2)}
.hx-al svg.i{width:14px;height:14px;margin-top:1px}
.hx-load{display:flex;flex-direction:column;gap:6px;margin-top:auto}
.hx-load .hrow{justify-content:space-between;font-size:12px;color:var(--mut)}
.hx-load b{color:var(--ink);font-variant-numeric:tabular-nums}
.hx-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:0 -14px;padding:9px 14px;border-top:1px solid var(--line);font-size:12px;color:var(--mut);background:var(--surface-2)}
.hx-foot>span{display:inline-flex;align-items:center;gap:6px;min-width:0;white-space:nowrap}
.hx-foot svg.i{width:14px;height:14px}
.hx-foot b{color:var(--ink);font-variant-numeric:tabular-nums}
.hx-ld{display:flex;align-items:center;gap:8px;min-width:128px}
.hx-ld .bar{flex:1;min-width:56px}
.hx-sire{display:flex;gap:8px}
.hx-sire .in{font-family:var(--f-mono);letter-spacing:.02em}
.hx-found{border-radius:var(--r-lg);box-shadow:inset 0 0 0 1px var(--acc-line);background:var(--acc-pale);padding:14px;display:flex;flex-direction:column;gap:12px}
.hx-map{display:grid;grid-template-columns:minmax(0,1fr) 16px minmax(0,1fr);gap:8px 10px;align-items:center;font-size:13px}
.hx-map .src{font-family:var(--f-mono);font-size:12px;padding:6px 9px;border-radius:7px;background:var(--bg-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.hx-map svg.i{width:14px;height:14px;color:var(--mut-2)}
@container main (max-width:520px){.hx-grid{grid-template-columns:minmax(0,1fr);gap:10px}.hx-c{gap:9px}}

/* ---- fiche cheval ---- */
.fc-back{display:inline-flex;align-items:center;gap:6px;color:var(--mut);font-weight:600;font-size:13px;cursor:pointer}
.fc-back:hover{color:var(--ink)}
.fc-hero{display:grid;grid-template-columns:minmax(0,1.22fr) minmax(0,1fr);overflow:hidden}
.fc-stage{position:relative;height:452px;min-width:0;overflow:hidden;border-right:1px solid var(--line);background:radial-gradient(90% 70% at 50% 96%,color-mix(in srgb,var(--acc) 16%,transparent),transparent 70%),var(--surface-2)}
.fc-gl{height:calc(100% + 110px);width:calc(100% + 160px);margin:-44px 0 0 -80px}
.fc-stage.moving .h3d{opacity:0!important;pointer-events:none}
.fc-st-top{position:absolute;left:14px;right:14px;top:12px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;z-index:3;pointer-events:none}
.fc-st-top>*{pointer-events:auto}
.fc-hint{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:600;color:var(--mut);padding:5px 10px 5px 8px;border-radius:99px;background:color-mix(in srgb,var(--surface) 80%,transparent);box-shadow:inset 0 0 0 1px var(--line);min-width:0}
.fc-hint svg.i{width:14px;height:14px}
.fc-zones{position:absolute;left:0;right:0;bottom:0;padding:10px 12px;display:flex;gap:6px;z-index:3;background:linear-gradient(to top,color-mix(in srgb,var(--surface-2) 92%,transparent) 55%,transparent)}
.fc-z{flex:none;display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 11px 0 9px;border-radius:99px;font-size:12.5px;font-weight:600;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2),var(--shadow-1);white-space:nowrap;transition:transform var(--t-1) var(--e-out),box-shadow var(--t-2)}
.fc-z:hover{box-shadow:inset 0 0 0 1px var(--acc),var(--shadow-1)}
.fc-z:active{transform:scale(.96)}
.fc-z i{width:8px;height:8px;border-radius:50%;background:var(--c)}
.fc-id{padding:20px 22px;display:flex;flex-direction:column;gap:14px;min-width:0}
.fc-id h1{font-size:30px;line-height:1.05;letter-spacing:-.035em}
.fc-rings{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:4px}
.fc-ring{display:flex;flex-direction:column;align-items:center;gap:5px;padding:8px 2px 7px;border-radius:var(--r-md);text-align:center;min-width:0;transition:background var(--t-2)}
.fc-ring:hover{background:var(--surface-2)}
.fc-ring .ring{--s:46px;position:relative}
.fc-ring .ring::after{content:"";background:var(--surface)}
.fc-ring .ring svg.i{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:17px;height:17px;z-index:1;color:var(--ink-2)}
.fc-ring b{font-size:12px;white-space:nowrap}
.fc-ring span.d{font-size:11px;color:var(--mut);white-space:nowrap}
.fc-ring.warn span.d{color:var(--warn);font-weight:600}.fc-ring.bad span.d{color:var(--bad);font-weight:600}
.fc-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto}
.fc-tabs{margin:16px 0 16px;position:sticky;top:-26px;z-index:4;background:var(--bg);padding-top:6px}
.fc-cols{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:14px;align-items:start}
.fc-cols.eq{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
.fc-idl{grid-template-columns:repeat(3,minmax(0,1fr))}
.fc-day{display:flex;flex-direction:column}
.fc-ev{display:grid;grid-template-columns:48px 20px minmax(0,1fr);gap:8px;align-items:start;padding:7px 0;font-size:13px}
.fc-ev .tm{font-weight:600;font-variant-numeric:tabular-nums;color:var(--ink-2)}
.fc-ev .dt{width:9px;height:9px;border-radius:50%;margin:5px auto 0;box-shadow:inset 0 0 0 2px var(--c,var(--line-2));background:var(--surface)}
.fc-ev.done .dt{background:var(--c,var(--ok));box-shadow:none}
.fc-ev.now .dt{background:var(--acc);box-shadow:0 0 0 4px var(--acc-pale)}
.fc-ev.done{color:var(--mut)}
.fc-tl .ev{padding-bottom:18px}
.fc-tl .ev.next::before{background:var(--c,var(--acc))}
.fc-tl .hd{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.fc-tl .dte{font-size:12px;color:var(--mut);font-variant-numeric:tabular-nums}
.fc-wk{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
.fc-wd{border-radius:var(--r-md);background:var(--surface-2);padding:10px 8px 8px;display:flex;flex-direction:column;gap:6px;min-height:150px;min-width:0}
.fc-wd.today{background:var(--acc-pale);box-shadow:inset 0 0 0 1px var(--acc-line)}
.fc-wd .dn{display:flex;justify-content:space-between;align-items:baseline;font-size:12px;font-weight:600;color:var(--mut);white-space:nowrap}
.fc-wd .dn b{color:var(--ink);font-variant-numeric:tabular-nums}
.fc-ss{border-radius:8px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);padding:6px 7px 6px 12px;font-size:11.5px;line-height:1.3;min-width:0;position:relative;overflow:hidden}
.fc-ss::before{content:"";position:absolute;left:4px;top:6px;bottom:6px;width:3px;border-radius:2px;background:var(--c,var(--acc))}
.fc-ss b{display:block;font-size:12px;overflow-wrap:anywhere}
.fc-ss span{color:var(--mut);display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fc-ss.done{opacity:.72}
.fc-wb{transform-box:fill-box;transform-origin:bottom;animation:grow .7s var(--e-out) both;animation-delay:calc(var(--i,0)*30ms)}
.fc-rest{margin:auto 0;text-align:center;font-size:11.5px;color:var(--mut-2);display:flex;flex-direction:column;align-items:center;gap:4px}
.fc-meal{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.fc-ml{border-radius:var(--r-md);background:var(--surface-2);padding:12px;display:flex;flex-direction:column;gap:8px;min-width:0}
.fc-ml .q{display:flex;justify-content:space-between;gap:8px;font-size:13px}
.fc-ml .q b{font-variant-numeric:tabular-nums;white-space:nowrap}
.fc-nec{display:flex;gap:4px}
.fc-nec i{flex:1;height:8px;border-radius:3px;background:var(--bg-2)}
.fc-nec i.on{background:var(--acc)}
.fc-nec i.cur{background:var(--acc);box-shadow:0 0 0 3px var(--acc-pale)}
.fc-j{display:grid;grid-template-columns:36px minmax(0,1fr);gap:12px;padding:14px 16px}
.fc-j+.fc-j{border-top:1px solid var(--line)}
.fc-j p{font-size:13.5px;line-height:1.5;margin-top:4px;color:var(--ink-2)}
.fc-mood{display:inline-flex;gap:3px;align-items:center}
.fc-mood i{width:6px;height:6px;border-radius:50%;background:var(--line-2)}
.fc-mood i.on{background:var(--ok)}
.fc-cost{display:grid;grid-template-columns:26px minmax(0,1.1fr) minmax(0,1fr) 64px;gap:10px;align-items:center;padding:8px 0;font-size:13px}
.fc-cost+.fc-cost{border-top:1px solid var(--line)}
.fc-cam{position:relative;border-radius:var(--r-lg);overflow:hidden;background:#0b0f12;aspect-ratio:16/9;color:#fff}
.fc-cam svg{display:block;width:100%;height:100%}
.fc-cam .scan{position:absolute;inset:0;background:repeating-linear-gradient(to bottom,rgba(255,255,255,.035) 0 1px,transparent 1px 3px);pointer-events:none;mix-blend-mode:screen}
.fc-cam .hud{position:absolute;left:12px;right:12px;display:flex;justify-content:space-between;align-items:center;gap:8px;font:500 11.5px var(--f-mono);text-shadow:0 1px 2px rgba(0,0,0,.6)}
.fc-cam .hud.t{top:10px}.fc-cam .hud.b{bottom:10px}
.fc-cam .ai{position:absolute;left:22%;top:25%;width:52%;height:58%;pointer-events:none}
.fc-cam .ai::before,.fc-cam .ai::after{content:"";position:absolute;width:18px;height:18px;border:2px solid #8fa8ff}
.fc-cam .ai::before{left:0;top:0;border-right:0;border-bottom:0;border-radius:4px 0 0 0}
.fc-cam .ai::after{right:0;bottom:0;border-left:0;border-top:0;border-radius:0 0 4px 0}
.fc-cam .ai span{position:absolute;left:0;top:-24px;font:600 11px var(--f-text);background:#3d63f2;color:#fff;padding:2px 7px;border-radius:5px;white-space:nowrap}
.fc-cam .hd{transform-box:fill-box;transform-origin:90% 90%;animation:fcHead 6s var(--e-in-out) infinite}
.fc-cam .bd{transform-box:fill-box;transform-origin:center;animation:fcBreath 3.6s var(--e-in-out) infinite}
@keyframes fcHead{0%,100%{transform:rotate(0)}40%{transform:rotate(-6deg)}70%{transform:rotate(-2deg)}}
@keyframes fcBreath{50%{transform:scale(1.012,1.03)}}
.fc-act{display:flex;height:22px;border-radius:6px;overflow:hidden;background:var(--bg-2)}
.fc-act i{display:block;height:100%;background:var(--c)}
.fc-qr{width:188px;height:188px;padding:12px;border-radius:var(--r-lg);background:#fff;box-shadow:inset 0 0 0 1px var(--line);margin:0 auto}
.fc-qr svg{width:100%;height:100%;display:block}
.fc-doc{aspect-ratio:210/140;border-radius:var(--r-md);background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);padding:18px;display:flex;flex-direction:column;gap:9px}
.fc-doc i{display:block;height:7px;border-radius:4px;background:var(--bg-2)}
.fc-gait{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.fc-gait>div{min-width:0}
.fc-gait .v{font:700 20px/1.1 var(--f-display);letter-spacing:-.03em;font-variant-numeric:tabular-nums;white-space:nowrap}
@container main (max-width:1080px){.fc-hero{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.fc-id{padding:18px}.fc-id h1{font-size:26px}}
@container main (max-width:900px){.fc-cols,.fc-cols.eq{grid-template-columns:minmax(0,1fr)}}
@container main (max-width:760px){
 .fc-hero{grid-template-columns:minmax(0,1fr)}.fc-stage{height:300px;border-right:0;border-bottom:1px solid var(--line)}
 .fc-id{padding:16px;gap:14px}.fc-id h1{font-size:24px}.fc-tabs{top:-6px;margin:12px -16px 14px;padding:4px 12px 0}
 .fc-idl{grid-template-columns:repeat(2,minmax(0,1fr))}
 .fc-wk{grid-template-columns:minmax(0,1fr)}.fc-wd{min-height:0;display:grid;grid-template-columns:84px minmax(0,1fr);gap:8px;align-items:start;padding:10px}
 .fc-wd .dn{flex-direction:column;gap:2px}.fc-wd .ss{display:flex;flex-direction:column;gap:6px;min-width:0}.fc-rest{flex-direction:row;margin:0;justify-content:flex-start;padding:4px 0}
 .fc-meal{grid-template-columns:minmax(0,1fr)}.fc-gait{grid-template-columns:repeat(2,minmax(0,1fr))}
 .fc-cost{grid-template-columns:26px minmax(0,1fr) 64px}.fc-cost .bar{display:none}
 .fc-acts{flex-wrap:nowrap}.fc-acts .btn{flex:1 1 auto;height:44px}.fc-acts .btn.icon,.fc-acts .btn:not(.pri){flex:0 0 44px;padding:0;gap:0;font-size:0;justify-content:center}
 .app.mobile .fc-nm h1{display:none}.app.mobile .fc-nm>.mut{margin-top:0!important}
 .fc-st-top [data-move] span{display:none}
 .fc-gl{height:calc(100% + 64px);width:calc(100% + 100px);margin:-22px 0 0 -50px}
}
@container main (min-width:761px){.fc-wd .ss{display:contents}}
@container main (max-width:520px){.lb-ph>.grow{flex-basis:100%}.fc-cam .ai{top:36%;height:48%}.lb-ph>.acts{width:100%;flex-wrap:nowrap}.lb-ph>.acts .btn{flex:1 1 0;min-width:0;height:44px}}

/* ---- soins ---- */
.so-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border-top:1px solid var(--line)}
.so-cal .dh{padding:8px 10px;font-size:11.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--mut);border-bottom:1px solid var(--line)}
.so-cd{min-height:112px;padding:7px 7px 9px;border-bottom:1px solid var(--line);border-right:1px solid var(--line);display:flex;flex-direction:column;gap:4px;min-width:0}
.so-cd:nth-child(7n){border-right:0}
.so-cd:nth-last-child(-n+7){border-bottom:0}
.so-cd .n{font-size:12px;font-weight:600;color:var(--mut);font-variant-numeric:tabular-nums;display:flex;justify-content:space-between;align-items:center;height:22px;padding:0 3px}
.so-cd.past{background:var(--surface-2)}.so-cd.past .n{color:var(--mut-2)}
.so-cd.today .n span{background:var(--acc);color:var(--acc-ink);border-radius:99px;padding:2px 8px;margin-left:-5px}
.so-ev{display:flex;align-items:center;gap:6px;height:24px;padding:0 7px;border-radius:7px;font-size:11.5px;font-weight:600;background:color-mix(in srgb,var(--c) 14%,var(--surface));color:var(--ink);min-width:0;width:100%;text-align:left;transition:transform var(--t-1) var(--e-out),background var(--t-2)}
.so-ev:hover{background:color-mix(in srgb,var(--c) 24%,var(--surface))}
.so-ev:active{transform:scale(.97)}
.so-ev i{width:7px;height:7px;border-radius:50%;background:var(--c);flex:none}
.so-ev span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.so-ev.todo{background:transparent;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 55%,var(--line));color:var(--ink-2);font-weight:500}
.so-ev.late{background:var(--bad-pale);color:var(--bad);box-shadow:none}.so-ev.late i{background:var(--bad)}
.so-ag{display:none}
.so-agd{padding:12px 16px 4px;font-size:12px;font-weight:600;color:var(--mut);text-transform:uppercase;letter-spacing:.05em;display:flex;justify-content:space-between;border-top:1px solid var(--line)}
.so-agd+.lb-row{border-top:0}
.so-rules{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px}
.so-rule{padding:14px;display:grid;grid-template-columns:32px minmax(0,1fr) auto;gap:10px;align-items:center;min-width:0}
.so-rule p,.so-rule .ft{grid-column:1/-1}
.so-rule p{min-height:54px}
.so-tour{padding:16px;display:flex;flex-direction:column;gap:12px}
.so-msg{border-radius:var(--r-md);background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);padding:12px 14px;font-size:13px;line-height:1.5;color:var(--ink-2)}
.so-pick{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:var(--r-md);cursor:pointer;transition:background var(--t-1)}
.so-pick:hover{background:var(--surface-2)}
.so-pick[aria-checked="true"]{background:var(--acc-pale)}
.so-prs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.so-pr{padding:10px 12px;border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line-2);display:flex;gap:10px;align-items:center;text-align:left;min-width:0;transition:box-shadow var(--t-2),background var(--t-2)}
.so-pr[aria-pressed="true"]{box-shadow:inset 0 0 0 1.5px var(--acc);background:var(--acc-pale)}
@container main (max-width:1180px){.so-rules{grid-template-columns:repeat(3,minmax(0,1fr))}}
@container main (max-width:760px){.so-cal{display:none}.so-ag{display:block}.so-rules{grid-template-columns:minmax(0,1fr)}.so-rule p{min-height:0}}

/* ---- alimentation ---- */
.al-board{display:grid;grid-template-columns:repeat(auto-fill,minmax(212px,1fr));gap:10px}
.al-box{border-radius:var(--r-md);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line),var(--shadow-1);padding:10px 12px 11px;display:flex;flex-direction:column;gap:8px;text-align:left;min-width:0;position:relative;transition:transform var(--t-1) var(--e-out),background var(--t-2),box-shadow var(--t-2)}
.al-box:active{transform:scale(.98)}
.al-box .hd{display:flex;align-items:center;gap:8px;min-width:0}
.al-box .bx{font:700 12px var(--f-mono);padding:3px 6px;border-radius:6px;background:var(--navy);color:var(--navy-ink);letter-spacing:.02em;flex:none}
.al-box .qs{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.al-q{border-radius:8px;background:var(--surface-2);padding:6px 8px;min-width:0}
.al-q small{display:block;font-size:10.5px;color:var(--mut);font-weight:600;letter-spacing:.04em;text-transform:uppercase}
.al-q b{font:700 17px/1.2 var(--f-display);letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.al-q b span{font:600 11.5px var(--f-text);color:var(--mut);margin-left:3px;letter-spacing:0}
.al-fl{display:flex;gap:6px;align-items:flex-start;font-size:11.5px;line-height:1.35;color:var(--ink-2)}
.al-fl svg.i{width:13px;height:13px;margin-top:1px;flex:none}
.al-fl.med{color:var(--bad);font-weight:600}
.al-box[aria-checked="true"]{background:var(--ok-pale);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ok) 35%,transparent)}
.al-box[aria-checked="true"] .al-q{background:color-mix(in srgb,var(--surface) 60%,transparent)}
.al-box .chk{margin-left:auto;pointer-events:none}
.al-box[aria-checked="true"] .chk{background:var(--ok);box-shadow:none}
.al-box[aria-checked="true"] .chk svg{stroke-dashoffset:0}
.al-paper{background:var(--surface);border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line-2),var(--shadow-2);padding:22px 22px 16px}
.al-paper table{width:100%;border-collapse:collapse;font-size:11.5px}
.al-paper th,.al-paper td{border:1px solid var(--line-2);padding:5px 7px;text-align:left;vertical-align:top}
.al-paper th{font-size:10.5px;text-transform:uppercase;letter-spacing:.05em;color:var(--mut);background:var(--surface-2);white-space:nowrap}
.al-paper td.c{text-align:center;font-variant-numeric:tabular-nums;font-weight:600;white-space:nowrap}
.al-paper td.bx{font:700 11.5px var(--f-mono)}
.al-paper td b{white-space:nowrap}.al-paper td:last-child{overflow-wrap:anywhere}.al-paper td:last-child b{white-space:normal}
.al-stock{padding:16px;display:flex;flex-direction:column;gap:12px;min-width:0}
.al-stock .big{font:700 30px/1 var(--f-display);letter-spacing:-.035em;font-variant-numeric:tabular-nums}
.al-stock .big small{font-size:13.5px;color:var(--mut);font-weight:600;margin-left:5px;letter-spacing:0}
@container main (max-width:520px){.al-board{grid-template-columns:minmax(0,1fr)}.al-box{padding:12px 14px}.al-paper{padding:12px}}
`);

/* ---------- petits composants ---------- */
function sq(icon,tone,cls){return '<span class="lb-sq '+(tone||'')+' '+(cls||'')+'">'+ICON(icon,cls==='sm'?'sm':'')+'</span>'}
function kpi(label,icon,val,sub){return '<div class="card lb-kpi"><div class="lab">'+ICON(icon,'sm')+'<span class="ellip">'+label+'</span></div><div class="val">'+val+'</div><div class="sub">'+sub+'</div></div>'}
function cnt(n,fmt){return '<span data-count="'+n+'" data-fmt="'+(fmt||'')+'">'+(fmt==='eur'?F.eur(n):F.num(n))+'</span>'}
/* tableau maison : fusionne correctement les classes « n » et « hide-s » */
function T(cols,rows,o){o=o||{};function cl(c){var k=[c.n?'n':'',c.hide?'hide-s':''].join(' ').trim();return k?' class="'+k+'"':''}
  return '<div class="tw'+(o.card===false?'':' card')+'"><table class="tbl"><thead><tr>'+cols.map(function(c){return '<th'+cl(c)+(c.w?' style="width:'+c.w+'"':'')+'>'+c.l+'</th>'}).join('')+'</tr></thead><tbody>'+
   rows.map(function(r){return '<tr'+(o.click?' class="click" data-row="'+E(r[o.key||'id'])+'"':'')+'>'+cols.map(function(c){return '<td'+cl(c)+'>'+(c.f?c.f(r):E(r[c.k]))+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>'}
function LPH(a,b,c){return U.ph(a,b,c).replace('class="ph"','class="ph lb-ph"')}
var KL={club:'Club',proprietaire:'Propriétaire',demi:'Demi-pension'};
function kindChip(h){return U.chip(KL[h.kind],h.kind==='club'?'navy':h.kind==='demi'?'acc':'line')}
function stChip(h){return h.status==='bad'?U.chip('Urgent','bad',true):h.status==='warn'?U.chip('À surveiller','warn',true):U.chip('En forme','ok',true)}
function isRest(h){return h.status==='bad'||/repos/i.test(h.alerts.join(' '))}
function loadP(h){return Math.round(h.work/h.workMax*100)}
function loadC(h){var p=loadP(h);return p>100?'var(--bad)':p>=85?'var(--warn)':'var(--acc)'}
function hrs(v){var m=Math.round(v*60),hh=Math.floor(m/60),mm=m%60;return hh+' h'+(mm?' '+String(mm).padStart(2,'0'):'')}
function goOr(route,params,msg){if(P.mods[route])P.go(route,params);else P.toast(msg||'Cet écran arrive avec le reste de la démo',{icon:'info'})}
function norm(s){return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
function on(root,sel,fn){root.addEventListener('click',function(e){var t=e.target.closest(sel);if(t&&root.contains(t))fn(t,e)})}
function stepper(id,v,unit){return '<span class="lb-step" data-step="'+id+'"><button type="button" data-d="-1" title="Diminuer">'+ICON('minus','sm')+'</button><output data-v="'+v+'">'+String(v).replace('.',',')+' '+unit+'</output><button type="button" data-d="1" title="Augmenter">'+ICON('plus','sm')+'</button></span>'}
function bindSteppers(root,step,unit,cb){on(root,'[data-step] button',function(b){var o=b.parentNode.querySelector('output'),v=Math.max(0,Math.round((parseFloat(o.getAttribute('data-v'))+(+b.getAttribute('data-d'))*step)*10)/10);o.setAttribute('data-v',v);var u=b.parentNode.getAttribute('data-unit')||unit;o.textContent=String(v).replace('.',',')+' '+u;if(cb)cb(b.parentNode.getAttribute('data-step'),v)})}
function ownerLine(h){return h.owner?D.name(h.owner):'Écurie des Tilleuls'}

/* =====================================================================
   3. Cheptel
   ===================================================================== */
var LS={q:'',f:'all',sort:'box'};
var FILTERS=[['all','Tous',function(){return true}],['club','Club',function(h){return h.kind==='club'}],['proprietaire','Propriétaires',function(h){return h.kind==='proprietaire'}],['demi','Demi-pension',function(h){return h.kind==='demi'}],['poney','Poneys',function(h){return h.pony}],['repos','Au repos',isRest],['alerte','Alertes',function(h){return h.status!=='ok'||loadP(h)>100}]];
var SORTS={box:['Box',function(a,b){return a.box<b.box?-1:1}],name:['Nom',function(a,b){return a.name.localeCompare(b.name,'fr')}],load:['Charge de travail',function(a,b){return loadP(b)-loadP(a)}],cost:['Coût mensuel',function(a,b){return b.costMonth-a.costMonth}],care:['Prochain soin',function(a,b){return nextDue(a).n-nextDue(b).n}]};

function horseCard(h){var nd=nextDue(h),R=RULES[nd.k],p=loadP(h),over=p>100;
  return '<div class="card hover hx-c" data-go="cheval" data-id="'+h.id+'" role="link" tabindex="0"><div class="hx-top">'+U.hav(h,'lg')+'<div class="grow"><h3 class="ellip">'+E(h.name)+'</h3><div class="s mut ellip">'+h.box+' · '+h.breed+' · '+h.age+' ans</div></div></div>'+
   '<div class="hx-chips">'+stChip(h)+kindChip(h)+(isRest(h)?U.chip('Au repos','line'):'')+(over?U.chip('Surcharge','bad'):'')+'</div>'+
   (h.alerts.length?'<div class="hx-al">'+ICON('alert','sm')+'<span>'+E(h.alerts[0])+'</span></div>':'')+
   '<div class="hx-load"><div class="hrow"><span>Charge de la semaine</span><span><b>'+h.work+' h</b> sur '+h.workMax+' h</span></div>'+U.bar(p,loadC(h))+'</div>'+
   '<div class="hx-foot"><span class="'+(nd.n<0?'badc':nd.n<=RULES[nd.k].soon?'warnc':'')+'">'+ICON(R.icon,'sm')+'<span class="ellip">'+R.l+' '+dueTxt(nd.n)+'</span></span><span><b>'+F.eur(h.costMonth)+'</b>par mois</span></div></div>'}

function horseTable(list){return T([
  {l:'Cheval',f:function(h){return '<div class="hrow">'+U.hav(h)+'<div style="min-width:0"><div class="b ellip">'+E(h.name)+'</div><div class="xs mut">'+h.breed+' · '+h.age+' ans</div></div></div>'}},
  {l:'Box',f:function(h){return '<span class="mono">'+h.box+'</span>'},hide:true},
  {l:'Propriétaire',hide:true,f:function(h){return h.owner?'<span class="hrow" style="--g:8px">'+U.av(h.owner,'sm')+'<span>'+D.name(h.owner)+'</span></span>':kindChip(h)}},
  {l:'Santé',f:function(h){return stChip(h)}},
  {l:'Charge',f:function(h){return '<div class="hx-ld">'+U.bar(loadP(h),loadC(h))+'<span class="xs num"><b>'+h.work+'</b> / '+h.workMax+' h</span></div>'}},
  {l:'Prochain soin',hide:true,f:function(h){var nd=nextDue(h);return '<span class="'+(nd.n<0?'badc b':nd.n<=RULES[nd.k].soon?'warnc b':'')+'">'+RULES[nd.k].l+' '+dueTxt(nd.n)+'</span>'}},
  {l:'Coût par mois',n:true,hide:true,f:function(h){return '<b>'+F.eur(h.costMonth)+'</b>'}}],list,{click:true})}

function addHorseSheet(){
  var found=null;
  var sh=P.sheet({title:'Ajouter un cheval',icon:'horse',body:function(b){
    b.innerHTML='<div class="stack" style="--g:16px"><div class="field"><span>Numéro SIRE ou UELN</span><div class="hx-sire"><input class="in" id="hx-sire" value="15 436 229 V" autocomplete="off" inputmode="text"><button class="btn dark" data-find>'+ICON('search','sm')+'Chercher</button></div>'+
      '<span class="xs mut" style="font-weight:400">Piaffe interroge le fichier des équidés en open data de l’IFCE et remplit la fiche pour vous.</span></div>'+
      '<div id="hx-res"></div><div class="hr"></div>'+
      '<button class="btn ghost" data-manual-add style="justify-content:flex-start">'+ICON('edit','sm')+'Saisir la fiche à la main</button>'+
      '<button class="btn ghost" data-scan style="justify-content:flex-start">'+ICON('scan','sm')+'Lire le transpondeur avec le téléphone</button></div>'},
   foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-add disabled>'+ICON('plus','sm')+'Ajouter au cheptel</button>'});
  var res=sh.querySelector('#hx-res'),addB=sh.querySelector('[data-add]');
  function form(pre){found=pre;res.innerHTML='<div class="stack pop" style="--g:14px">'+(pre.src?'<div class="hx-found"><div class="hrow"><span class="strass"></span><b class="s">Fiche trouvée à l’IFCE</b><span class="chip acc" style="margin-left:auto">Open data</span></div>'+
      '<dl class="lb-dl" style="margin:0">'+[['Nom',pre.name],['Race',pre.breed],['Sexe et robe',pre.sex+', '+pre.coat.toLowerCase()],['Naissance','14 avril 2017 (9 ans)'],['Père','Kannan'],['Mère','Bohème de Brecey'],['UELN','<span class="mono">25000115436229V</span>'],['Naisseur','Haras du Verger, Calvados']].map(function(x){return '<div><dt>'+x[0]+'</dt><dd>'+x[1]+'</dd></div>'}).join('')+'</dl>'+
      '<span class="xs mut">La fiche en ligne de l’IFCE fait seule autorité. Aucune donnée personnelle du propriétaire n’est récupérée.</span></div>':
      '<div class="g2" style="--g:12px"><label class="field"><span>Nom</span><input class="in" id="hx-n" value="'+E(pre.name)+'"></label><label class="field"><span>Race</span><input class="in" value="'+E(pre.breed)+'"></label></div>')+
     '<div class="g2" style="--g:12px"><label class="field"><span>Statut</span><select class="in" id="hx-kind"><option value="proprietaire">Pension de propriétaire</option><option value="club">Cheval de club</option><option value="demi">Demi-pension</option></select></label>'+
     '<label class="field"><span>Propriétaire</span><select class="in" id="hx-own"><option value="m031">'+D.name('m031')+'</option><option value="m047">'+D.name('m047')+'</option><option value="m052">'+D.name('m052')+'</option><option value="">Écurie des Tilleuls</option></select></label>'+
     '<label class="field"><span>Box</span><select class="in" id="hx-box"><option>B45</option><option>B46</option></select></label>'+
     '<label class="field"><span>Arrivée</span><input class="in" type="date" value="'+iso(0)+'"></label></div>'+
     '<div class="card flat list"><div class="li"><div class="grow"><div class="t">Reprendre le calendrier de soins du carnet</div><div class="s">Vaccins, vermifuges et ferrure, rappels créés d’office</div></div>'+U.tog(true)+'</div>'+
     '<div class="li"><div class="grow"><div class="t">Envoyer le contrat de pension à signer</div><div class="s">Modèle « Pension complète », 520 € par mois</div></div>'+U.tog(true)+'</div></div>'+
     '<div class="note">'+ICON('info','sm')+'<span>Pensez à déclarer le nouveau lieu de détention au SIRE dans les 30 jours. Piaffe vous le rappellera le '+F.date(iso(21))+'.</span></div></div>';
    addB.disabled=false}
  function find(){res.innerHTML='<div class="card flat pad stack" style="--g:10px"><div class="hrow s mut">'+ICON('refresh','sm')+'Recherche dans le fichier des équidés…</div><div class="skel" style="height:14px;width:70%"></div><div class="skel" style="height:14px;width:48%"></div><div class="skel" style="height:14px;width:60%"></div></div>';
    setTimeout(function(){if(!sh.isConnected)return;form({src:true,name:'Bohème du Verger',breed:'Selle Français',sex:'Jument',coat:'Alezan'})},P.RM?60:800)}
  sh.querySelector('[data-find]').onclick=find;
  sh.querySelector('#hx-sire').onkeydown=function(e){if(e.key==='Enter')find()};
  sh.querySelector('[data-manual-add]').onclick=function(){form({name:'Nouveau cheval',breed:'Selle Français',sex:'Hongre',coat:'Bai'});var n=sh.querySelector('#hx-n');if(n){n.focus();n.select()}};
  sh.querySelector('[data-scan]').onclick=function(){P.toast('Puce 250259806114372 lue sur l’encolure gauche',{icon:'scan'});sh.querySelector('#hx-sire').value='15 436 229 V';find()};
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
  addB.onclick=function(){var n=sh.querySelector('#hx-n'),name=(n&&n.value.trim())||found.name,kind=sh.querySelector('#hx-kind').value,own=sh.querySelector('#hx-own').value,box=sh.querySelector('#hx-box').value;
    if(D.horses.some(function(h){return h.name===name})){P.toast(name+' est déjà dans le cheptel',{icon:'info'});return}
    var id='h'+(D.horses.length+1);
    D.horses.push({id:id,name:name,breed:found.breed,pony:false,sex:found.sex,age:9,born:2017,coat:found.coat,height:166,kind:kind,box:box,sire:'25025915436229V',chip:'250259806114372',level:'Galop 6-7',work:0,workMax:16,weight:545,bcs:5,mood:'Volontaire',
      ration:{hay:9,grain:2,supp:'Aucun'},paddock:'Prairie du bas',costMonth:410,vacc:iso(-96),worm:iso(-40),farrier:iso(-12),dentist:iso(-150),osteo:iso(-60),status:'ok',alerts:[],color:'var(--c1)',owner:kind==='club'?undefined:(own||undefined)});
    sh.close();LS.f='all';LS.q='';LS.sort='box';P.rerender();
    P.toast(name+' est au box '+box+'. Sa fiche et ses rappels de soins sont prêts.',{icon:'checkc'});
    setTimeout(function(){var c=P.$('.hx-c[data-id="'+id+'"],[data-row="'+id+'"]',P.app());if(c){c.scrollIntoView({block:'center',behavior:P.RM?'auto':'smooth'});c.classList.add('pop')}},80)};
  return sh}

function importSheet(){
  var MAP=[['Nom du cheval','Nom'],['N° SIRE','Numéro SIRE'],['Puce','Transpondeur'],['Proprio','Propriétaire'],['Box','Box'],['Dernier vaccin','Vaccin grippe'],['Dernier ferrage','Maréchal'],['Foin kg','Ration, foin']];
  var sh=P.sheet({title:'Importer des chevaux en lot',icon:'upload',body:function(b){
    b.innerHTML='<div class="stack" style="--g:16px"><button class="lb-drop" data-file>'+ICON('upload','lg')+'<b>Déposez un fichier CSV ou Excel</b><span class="s mut">Export Kavalog, Equimondo, tableur maison ou liste FFE. Piaffe reconnaît les colonnes tout seul.</span><span class="btn sm" style="margin-top:4px">Choisir un fichier</span></button><div id="hx-imp"></div></div>'},
   foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-run disabled>Importer</button>'});
  var z=sh.querySelector('#hx-imp'),run=sh.querySelector('[data-run]');
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
  sh.querySelector('[data-file]').onclick=function(){
    z.innerHTML='<div class="stack pop" style="--g:14px"><div class="lb-row card flat" style="padding:10px 14px">'+sq('doc')+'<div class="grow"><div class="t">cheptel-tilleuls-2026.xlsx</div><div class="s">14 lignes, 8 colonnes · lu en 0,4 seconde</div></div>'+U.chip('Prêt','ok',true)+'</div>'+
     '<div><div class="eyebrow" style="margin-bottom:8px">Colonnes reconnues</div><div class="hx-map">'+MAP.map(function(m){return '<span class="src">'+m[0]+'</span>'+ICON('arrow','sm')+'<span class="b">'+m[1]+'</span>'}).join('')+'</div></div>'+
     '<div class="card flat"><div class="lb-row">'+sq('checkc','ok','sm')+'<div class="grow"><div class="t">12 chevaux prêts à importer</div><div class="s">11 retrouvés à l’IFCE par leur numéro SIRE, identité complétée</div></div></div>'+
     '<div class="lb-row">'+sq('alert','warn','sm')+'<div class="grow"><div class="t">1 numéro SIRE à vérifier</div><div class="s">Ligne 9, « Havane » : un chiffre manque. Importée sans rapprochement.</div></div></div>'+
     '<div class="lb-row">'+sq('copy','mut','sm')+'<div class="grow"><div class="t">2 doublons ignorés</div><div class="s">Vanille et Tango existent déjà dans le cheptel</div></div></div></div></div>';
    run.disabled=false;run.innerHTML=ICON('upload','sm')+'Importer 12 chevaux'};
  run.onclick=function(){run.disabled=true;z.innerHTML='<div class="card flat pad stack" style="--g:10px"><div class="hrow sp"><b class="s">Import en cours</b><span class="s mut num" id="hx-pc">0 sur 12</span></div><div class="bar"><i id="hx-pb" style="--v:0%"></i></div></div>';
    var n=0,pb=z.querySelector('#hx-pb'),pc=z.querySelector('#hx-pc');(function tick(){n++;if(!sh.isConnected)return;pb.style.setProperty('--v',(n/12*100)+'%');pc.textContent=n+' sur 12';
      if(n<12)setTimeout(tick,P.RM?10:110);else setTimeout(function(){sh.close();P.toast('12 chevaux importés. Ils attendent un box dans « Import ».',{icon:'checkc',undo:function(){P.toast('Import annulé, rien n’a été ajouté',{icon:'refresh'})}})},350)})()};
  return sh}

P.mod({id:'chevaux',role:'gerant',group:'Écurie',title:'Chevaux',icon:'horse',n:10,short:'Chevaux',
 badge:function(){var n=D.horses.filter(function(h){return h.status==='bad'}).length;return n?{v:n,hot:true}:null},
 render:function(el,ctx){
  var all=D.horses;all.forEach(X);
  var view=P.prefs.get('chevaux:view','cards');
  var nb=all.filter(function(h){return h.status==='bad'}).length,nw=all.filter(function(h){return h.status==='warn'}).length,over=all.filter(function(h){return loadP(h)>100}),
      avg=all.reduce(function(a,h){return a+h.work},0)/all.length,tot=all.reduce(function(a,h){return a+h.costMonth},0);
  el.innerHTML=LPH('Chevaux',all.length+' chevaux et poneys suivis · '+all.filter(function(h){return h.kind==='club'}).length+' de club, '+all.filter(function(h){return h.kind!=='club'}).length+' en pension',
     '<button class="btn" data-imp>'+ICON('upload','sm')+'<span class="hide-s">Importer en lot</span><span class="only-s">Importer</span></button><button class="btn pri" data-add>'+ICON('plus','sm')+'Ajouter un cheval</button>')+
   '<div class="stack" style="--g:14px"><div class="lb-kpis rise">'+
    kpi('Cheptel','horse',cnt(all.length),all.filter(function(h){return h.pony}).length+' poneys · 2 boxes libres')+
    kpi('À surveiller','pulse',cnt(nb+nw),'<span class="badc b">'+nb+' urgents</span> · '+nw+' à voir cette semaine')+
    kpi('Charge moyenne','gauge','<span data-count="'+avg.toFixed(1)+'" data-fmt="1">'+F.num(avg,1)+'</span><small>h par semaine</small>',over.length?'<span class="warnc b">'+over.length+' au-dessus du seuil</span> : '+over.map(function(h){return h.name}).slice(0,2).join(', '):'Aucun cheval au-dessus du seuil')+
    kpi('Coût de revient','euro',cnt(tot,'eur')+'<small>par mois</small>','Moyenne de '+F.eur(Math.round(tot/all.length))+' par cheval')+'</div>'+
   '<div class="lb-tools"><div class="search">'+ICON('search','sm')+'<input class="in" id="hx-q" placeholder="Nom, box, race, propriétaire…" value="'+E(LS.q)+'" autocomplete="off"></div>'+
    '<div class="scroll-x grow hx-tg"><div class="lb-tags">'+FILTERS.map(function(f){return '<button class="tag" data-manual data-f="'+f[0]+'" aria-pressed="'+(LS.f===f[0])+'">'+f[1]+' <b>'+all.filter(f[2]).length+'</b></button>'}).join('')+'</div></div>'+
    '<select class="in hide-s" id="hx-sort" style="width:auto" title="Trier">'+Object.keys(SORTS).map(function(k){return '<option value="'+k+'"'+(LS.sort===k?' selected':'')+'>Trier par : '+SORTS[k][0].toLowerCase()+'</option>'}).join('')+'</select>'+
    U.seg([['cards',ICON('grid','sm')+'<span class="hide-s">Cartes</span>'],['table',ICON('list','sm')+'<span class="hide-s">Tableau</span>']],view,'data-view')+
    '<button class="btn icon hide-s" data-exp title="Exporter le cheptel">'+ICON('download','sm')+'</button></div>'+
   '<div id="hx-list"></div></div>';
  var box=el.querySelector('#hx-list');
  function draw(anim){var f=FILTERS.find(function(x){return x[0]===LS.f}),q=norm(LS.q);
    var list=all.filter(f[2]).filter(function(h){return !q||norm([h.name,h.box,h.breed,ownerLine(h),h.sire,h.coat].join(' ')).indexOf(q)>=0}).sort(SORTS[LS.sort][1]);
    if(!list.length){box.innerHTML='<div class="card">'+U.empty('horse','Aucun cheval ne correspond','Essayez un autre nom ou retirez un filtre.','<button class="btn sm" data-reset>Tout afficher</button>')+'</div>';return}
    box.innerHTML=view==='cards'?'<div class="hx-grid'+(anim?' rise':'')+'">'+list.map(horseCard).join('')+'</div>':horseTable(list);
    if(anim)P.animate(box)}
  draw(true);
  el.querySelector('#hx-q').oninput=function(e){LS.q=e.target.value;draw()};
  el.querySelector('#hx-sort').onchange=function(e){LS.sort=e.target.value;draw()};
  on(el,'[data-f]',function(b){LS.f=b.getAttribute('data-f');P.$$('[data-f]',el).forEach(function(x){x.setAttribute('aria-pressed',x===b)});draw(true)});
  on(el,'[data-view]',function(b){view=b.getAttribute('data-view');P.prefs.set('chevaux:view',view);draw(true)});
  on(el,'[data-row]',function(r){P.go('cheval',{id:r.getAttribute('data-row')})});
  on(el,'[data-reset]',function(){LS.q='';LS.f='all';P.rerender()});
  el.querySelector('[data-add]').onclick=addHorseSheet;
  el.querySelector('[data-imp]').onclick=importSheet;
  el.querySelector('[data-exp]').onclick=function(){P.toast('Export du cheptel téléchargé : '+all.length+' fiches, soins et rations compris',{icon:'download'})};
  box.addEventListener('keydown',function(e){if(e.key==='Enter'){var c=e.target.closest('.hx-c');if(c)P.go('cheval',{id:c.getAttribute('data-id')})}});
 }});

/* =====================================================================
   4. Fiche cheval
   ===================================================================== */
var FS={tab:'vue',care:'all',jr:'all'},ST={extra:{},jr:{},rebill:{},fed:{matin:{},midi:{},soir:{}},orders:{}};
var TABS=[['vue','Vue d’ensemble'],['sante','Santé'],['travail','Travail'],['alim','Alimentation'],['journal','Journal partagé'],['couts','Coûts'],['camera','Caméra du box']];
function tone(s){return s==='bad'?'var(--bad)':s==='warn'?'var(--warn)':'var(--ok)'}
function allCare(h){return careLog(h).concat(ST.extra[h.id]||[]).sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:0})}
function ringHtml(h,k){var R=RULES[k],n=dueN(h,k),st=dueSt(h,k),v=Math.max(4,Math.min(100,n/R.every*100));
  return '<button class="fc-ring '+st+'" data-ring="'+k+'" title="'+R.l+' : dernier le '+F.dateY(h[k])+'"><span class="ring" style="--v:'+v.toFixed(0)+';--c:'+(st==='ok'?'var(--acc)':tone(st))+'">'+ICON(R.icon)+'</span><b>'+R.l.replace('Vaccin grippe','Vaccin').replace('Ostéopathe','Ostéo')+'</b><span class="d">'+dueTxt(n).replace('en retard de','retard')+'</span></button>'}
function locNow(h){return h.status==='bad'?'Au box, sous surveillance':isRest(h)?'Au box, au repos':'Au paddock, '+h.paddock.toLowerCase()}

function dayPlan(h,x){var m=meals(h),ev=[],bad=h.status==='bad',rest=isRest(h);
  ev.push({t:'07:00',l:'Ration du matin',s:m.matin.hay+' kg de foin'+(m.matin.grain?', '+String(m.matin.grain).replace('.',',')+' kg de '+grainType(h).toLowerCase():'')+' · distribuée par Mamadou',done:true});
  ev.push(rest?{t:'08:30',l:'Reste au box',s:bad?'Surveillance toutes les 2 heures':'Repos prescrit, marche en main 15 minutes',done:true}:{t:'08:30',l:'Sortie au paddock',s:h.paddock+' · sorti par Lucie',done:true});
  x.week[1].forEach(function(s){ev.push({t:s.t,l:s.k,s:s.w+(s.d?' · '+hrs(s.d/60):''),c:'var(--acc)'})});
  D.care.filter(function(c){return c.horse===h.id&&F.days(c.date)===0&&/^\d/.test(c.time)}).forEach(function(c){ev.push({t:c.time,l:c.kind+' · '+c.who,s:c.note,c:KINDC[c.kind],done:c.time<'09:41'})});
  if(m.midi.hay||m.midi.grain)ev.push({t:'12:00',l:'Ration de midi',s:m.midi.hay+' kg de foin'+(m.midi.grain?', '+String(m.midi.grain).replace('.',',')+' kg de granulés':'')});
  if(!rest)ev.push({t:'16:30',l:'Rentrée du paddock',s:'Pieds curés, couverture selon la météo (9 °C)'});
  ev.push({t:x.week[1].some(function(s){return s.t>='17:30'})?'19:15':'18:00',l:'Ration du soir',s:m.soir.hay+' kg de foin'+(m.soir.grain?', '+String(m.soir.grain).replace('.',',')+' kg de granulés':'')+(m.soir.supp?', '+m.soir.supp.toLowerCase():'')});
  ev.sort(function(a,b){return a.t<b.t?-1:1});var k=0;while(k<ev.length&&ev[k].t<'09:41')k++;
  ev.splice(k,0,{t:'09:41',l:locNow(h),s:'En ce moment'+(bad?'':' · humeur : '+h.mood.toLowerCase()),now:true});
  return '<div class="fc-day">'+ev.map(function(e){return '<div class="fc-ev'+(e.done?' done':'')+(e.now?' now':'')+'"'+(e.c?' style="--c:'+e.c+'"':'')+'><span class="tm">'+e.t+'</span><span class="dt"></span><div><div class="b">'+E(e.l)+'</div><div class="xs mut">'+E(e.s)+'</div></div></div>'}).join('')+'</div>'}

/* ---------- onglet : vue d'ensemble ---------- */
function tabVue(h,x){var own=h.owner?D.member(h.owner):null,nx=RK.map(function(k){return {k:k,n:dueN(h,k)}}).sort(function(a,b){return a.n-b.n}).slice(0,3),j=journal(h).concat(D.journalMore.filter(function(e){return e.horse===h.id})),cost=h.costMonth,mg=x.income-cost;
  var idn=[['Nom',E(h.name)],['Numéro SIRE','<span class="mono">'+x.sireNo+'</span>'],['UELN','<span class="mono">'+x.ueln+'</span>'],['Transpondeur','<span class="mono">'+h.chip+'</span>'],['Race',h.breed],['Robe',h.coat],['Sexe',h.sex],['Naissance',F.dateY(x.born)+' ('+h.age+' ans)'],['Taille',(h.height/100).toFixed(2).replace('.',',')+' m'],['Origines',x.father+' et '+x.mother],['Naisseur',x.breeder],['Arrivée au club',F.dateY(x.arrival)],
    ['Propriétaire',own?own.first+' '+own.last:'Écurie des Tilleuls'],['Demi-pensionnaire',x.rider?D.name(x.rider):'Aucun'],['Box et paddock',h.box+' · '+h.paddock],['Niveau et caractère',h.level+' · '+h.mood.toLowerCase()],['Vétérinaire traitant','Dr Antoine Leclerc'],['Maréchal','Benoît Gautier'],
    ['Assurance',x.ins.co],['Contrat','<span class="mono">'+x.ins.no+'</span>, jusqu’au '+F.dateY(x.ins.until)],['Garanties',x.ins.cover],['Consommation humaine','Exclu, enregistré au SIRE']];
  var docs=DOCS.filter(function(d){return h.owner||(d[3]!=='Contrat'&&d[0]!=='Carte d’immatriculation')});
  return '<div class="fc-cols rise"><div class="stack" style="--g:14px">'+
   '<div class="card"><div class="ch"><h3>Sa journée</h3><span class="chip '+(h.status==='bad'?'bad':'acc')+' dot">'+locNow(h)+'</span></div><div class="cb">'+dayPlan(h,x)+'</div></div>'+
   '<div class="card"><div class="ch"><h3>Identité complète</h3><div class="hrow" style="--g:4px"><button class="btn ghost sm" data-act="sire">'+ICON('refresh','sm')+'<span class="hide-s">Comparer avec l’IFCE</span></button><button class="btn ghost sm" data-act="editid">'+ICON('edit','sm')+'Modifier</button></div></div><div class="cb"><dl class="lb-dl fc-idl" style="margin:0">'+idn.map(function(a){return '<div><dt>'+a[0]+'</dt><dd>'+a[1]+'</dd></div>'}).join('')+'</dl></div></div>'+
   '<div class="card"><div class="ch"><h3>Dernières nouvelles</h3><button class="btn ghost sm" data-tabgo="journal">Journal'+ICON('arrow','sm')+'</button></div>'+j.slice(0,2).map(jEntry).join('')+'</div>'+'</div>'+
   '<div class="stack" style="--g:14px">'+
   '<div class="card"><div class="ch"><h3>Prochains rappels</h3><button class="btn ghost sm" data-tabgo="sante">Carnet de santé'+ICON('arrow','sm')+'</button></div><div style="padding:6px 0 4px">'+nx.map(function(a){var R=RULES[a.k],st=dueSt(h,a.k),t=tourOf(h,a.k);
     return '<div class="lb-row">'+sq(R.icon,st==='ok'?'':st)+'<div class="grow"><div class="t">'+R.l+'</div><div class="s">'+(t?'Tournée du '+F.date(t.date)+' à '+hm(t.time)+', '+prat(t.pr).short:'Échéance le '+F.date(due(h,a.k)))+'</div></div>'+(t?U.chip('Planifié','ok',true):U.chip(dueTxt(a.n),st==='ok'?'':st))+'</div>'}).join('')+'</div></div>'+
   '<div class="card"><div class="ch"><h3>Coût et recettes du mois</h3><button class="btn ghost sm" data-tabgo="couts">Détail'+ICON('arrow','sm')+'</button></div><div class="cb stack" style="--g:10px"><div class="hrow sp"><div><div class="xs mut">Coût de revient</div><div class="disp bb" style="font-size:22px">'+F.eur(cost)+'</div></div><div style="text-align:right"><div class="xs mut">'+x.incomeL+'</div><div class="disp bb" style="font-size:22px">'+F.eur(x.income)+'</div></div></div>'+
     '<div class="lb-bar2"><i style="--c:var(--c2);width:'+Math.min(100,cost/Math.max(cost,x.income)*100)+'%"></i></div><div class="lb-bar2"><i style="--c:var(--acc);width:'+Math.min(100,x.income/Math.max(cost,x.income)*100)+'%"></i></div>'+
     '<div class="s">'+(mg>=0?'<b class="okc">'+F.eur(mg)+' de marge</b>':'<b class="badc">'+F.eur(-mg)+' de perte</b>')+' <span class="mut">ce mois-ci'+(h.owner?', hors refacturations':'')+'</span></div></div></div>'+
   '<div class="card"><div class="ch"><h3>Documents</h3><button class="btn ghost sm" data-act="adddoc">'+ICON('plus','sm')+'Ajouter</button></div><div style="padding:6px 0 4px">'+docs.map(function(d,k){var s=d[2];if(d[1]==='syringe')s+=F.dateY(h.vacc);if(d[1]==='shield')s+=F.dateY(x.ins.until);
     return '<div class="lb-row click" data-doc="'+k+'">'+sq(d[1],'mut','sm')+'<div class="grow"><div class="t ellip">'+d[0]+'</div><div class="s ellip">'+s+'</div></div>'+ICON('right','sm')+'</div>'}).join('')+'</div></div>'+
   '</div></div>'}

/* ---------- onglet : santé ---------- */
function careEv(h,e){var c=KINDC[e.kind]||'var(--acc)',own=h.owner,past=!e.next&&e.status==='fait',rb=ST.rebill[e.id];
  var st=e.status==='fait'?'':e.status==='planifié'?U.chip('Planifié','acc',true):e.status==='en retard'?U.chip('En retard','bad',true):e.status==='à planifier'?U.chip('À planifier','line'):U.status(e.status);
  return '<div class="ev'+(e.next?' next':'')+'" style="--c:'+c+'"><div class="hd"><b class="s">'+e.kind+'</b><span class="s mut">'+E(e.who)+'</span>'+st+'<span class="dte" style="margin-left:auto">'+(F.days(e.date)>=-6&&F.days(e.date)<=6?F.rel(e.date):F.dateY(e.date))+(e.time&&/^\d/.test(e.time)?', '+e.time:'')+'</span></div>'+
   '<div class="s" style="color:var(--ink-2);margin-top:3px">'+E(e.note)+'</div>'+
   '<div class="hrow wrap" style="--g:6px;margin-top:7px">'+(e.price?'<span class="chip">'+F.eur(e.price)+'</span>':'')+(past&&own&&e.price?(rb||F.days(e.date)<-45?U.chip('Refacturé','ok'):'<span class="chip warn">À refacturer</span>'):'')+(e.doc?'<button class="chip line" data-act="opendoc" style="cursor:pointer">'+ICON('doc','sm')+E(e.doc)+'</button>':'')+
   (e.next&&e.status!=='planifié'?'<button class="btn sm" data-plan="'+(e.key||'')+'">'+ICON('calendar_add','sm')+'Planifier</button>':'')+(e.next&&e.status==='planifié'?'<button class="btn ghost sm" data-go="soins">Voir la tournée'+ICON('arrow','sm')+'</button>':'')+'</div></div>'}
function tabSante(h,x){var log=allCare(h),kinds=['all','Vétérinaire','Maréchal','Vaccin','Vermifuge','Dentiste','Ostéopathe'],f=FS.care;
  var show=log.filter(function(e){return f==='all'||e.kind===f}),up=show.filter(function(e){return e.next||F.days(e.date)>=0&&e.status!=='fait'}).reverse(),past=show.filter(function(e){return up.indexOf(e)<0});
  var R=rx(h),vac=log.filter(function(e){return e.kind==='Vaccin'&&!e.next});
  return '<div class="fc-cols rise"><div class="card"><div class="ch"><h3>Frise des soins</h3><button class="btn sm" data-act="care">'+ICON('plus','sm')+'Ajouter un soin</button></div>'+
    '<div class="scroll-x" style="padding:12px 16px 0"><div class="lb-tags">'+kinds.map(function(k){return '<button class="tag" data-manual data-cf="'+k+'" aria-pressed="'+(f===k)+'">'+(k==='all'?'Tout':'<i style="width:7px;height:7px;border-radius:50%;background:'+KINDC[k]+'"></i>'+k)+'</button>'}).join('')+'</div></div>'+
    '<div class="cb">'+(up.length?'<div class="eyebrow" style="margin:4px 0 12px">À venir</div><div class="tl fc-tl">'+up.map(function(e){return careEv(h,e)}).join('')+'</div>':'')+
     (past.length?'<div class="eyebrow" style="margin:6px 0 12px">Historique</div><div class="tl fc-tl">'+past.map(function(e){return careEv(h,e)}).join('')+'</div>':'')+(!show.length?U.empty('care','Aucun soin de ce type','Ajoutez le premier pour démarrer le suivi.'):'')+'</div></div>'+
   '<div class="stack" style="--g:14px">'+
    '<div class="card"><div class="ch"><h3>Rappels automatiques</h3><span class="chip ok dot">Actifs</span></div><div style="padding:6px 0 4px">'+RK.map(function(k){var Rl=RULES[k],n=dueN(h,k),st=dueSt(h,k);
      return '<div class="lb-row">'+sq(Rl.icon,st==='ok'?'':st,'sm')+'<div class="grow"><div class="t">'+Rl.l+'</div><div class="s">Dernier le '+F.dateY(h[k])+'</div></div><div style="text-align:right"><div class="s b '+(st==='bad'?'badc':st==='warn'?'warnc':'')+'">'+F.date(due(h,k))+'</div><div class="xs mut">'+dueTxt(n)+'</div></div></div>'}).join('')+'</div>'+
      '<div class="cf"><span class="xs mut grow">'+(h.owner?ownerLine(h)+' reçoit chaque rappel 15 jours avant.':'Les rappels arrivent sur votre accueil 15 jours avant.')+'</span><button class="btn ghost sm" data-go="soins">Régler</button></div></div>'+
    '<div class="card"><div class="ch"><h3>Ordonnances et traitements</h3><button class="btn ghost sm" data-act="rxadd">'+ICON('image','sm')+'Photographier</button></div>'+(R.length?'<div style="padding:6px 0 4px">'+R.map(function(o){
      return '<div class="lb-row" style="align-items:flex-start">'+sq('pill',o.on?'warn':'mut','sm')+'<div class="grow"><div class="hrow wrap" style="--g:6px"><span class="t">'+o.med+'</span>'+(o.on?U.chip('En cours','warn',true):U.chip('Terminé',''))+'</div><div class="s" style="margin-top:2px">'+o.pos+'</div><div class="xs mut" style="margin-top:2px">'+o.dur+' · '+o.who+' · <span class="mono">'+o.no+'</span></div>'+
       (o.on&&o.given&&o.given.length>1?'<div class="hrow wrap" style="--g:5px;margin-top:8px">'+o.given.map(function(g,k){return '<button class="chk" role="checkbox" aria-checked="'+(g?'true':'false')+'" data-given="'+k+'" title="Prise '+(k+1)+'"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>'}).join('')+'<span class="xs mut" data-givent>'+o.given.filter(Boolean).length+' prises sur '+o.given.length+'</span></div>':'')+
       '<div class="xs" style="margin-top:6px"><span class="mut">Délai d’attente :</span> <b>'+o.wait+'</b></div></div></div>'}).join('')+'</div>':U.empty('pill','Aucun traitement en cours','Photographiez une ordonnance : Piaffe lit le médicament, la posologie et crée les prises à cocher.'))+'</div>'+
    '<div class="card"><div class="ch"><h3>Carnet de vaccination</h3>'+U.chip('Valable en concours FFE','ok',true)+'</div><div style="padding:6px 0 4px">'+vac.map(function(v){return '<div class="lb-row">'+sq('syringe','mut','sm')+'<div class="grow"><div class="t">Grippe et tétanos</div><div class="s">'+E(v.note.split(', ')[1]||'')+' · '+v.who+'</div></div><span class="s num">'+F.dateY(v.date)+'</span></div>'}).join('')+'</div></div>'+
    '<div class="card"><div class="ch"><h3>Registre d’élevage</h3>'+U.chip('À jour','ok',true)+'</div><div class="cb stack" style="--g:10px"><p class="s mut">Chaque soin, traitement et mouvement de '+E(h.name.split(' ')[0])+' est une écriture datée et signée. Le registre du troisième trimestre est clos et archivé pour 5 ans.</p>'+
      '<div class="g2" style="--g:8px"><div class="card soft" style="padding:10px 12px"><div class="xs mut">Écritures en 2026</div><div class="disp bb" style="font-size:20px">'+(log.length+9)+'</div></div><div class="card soft" style="padding:10px 12px"><div class="xs mut">Mouvements</div><div class="disp bb" style="font-size:20px">'+(h.kind==='club'?3:6)+'</div></div></div>'+
      '<div class="hrow wrap" style="--g:8px"><button class="btn sm" data-act="regpdf">'+ICON('download','sm')+'Exporter le registre</button><button class="btn ghost sm" data-act="moves">Voir les mouvements</button></div></div></div>'+
   '</div></div>'}

/* ---------- onglet : travail ---------- */
function weeksChart(v,th){var w=640,hh=190,pl=34,pb=24,pt=12,mx=Math.max(th*1.15,Math.max.apply(null,v)*1.1),n=v.length,bw=(w-pl-8)/n,g='',Y=function(a){return pt+(1-a/mx)*(hh-pt-pb)};
  for(var k=0;k<=4;k++){var val=Math.round(mx*k/4);g+='<line class="grid" x1="'+pl+'" x2="'+(w-8)+'" y1="'+Y(val)+'" y2="'+Y(val)+'"/><text x="'+(pl-8)+'" y="'+(Y(val)+3.5)+'" text-anchor="end">'+val+' h</text>'}
  v.forEach(function(a,i){var x=pl+i*bw+bw*.2,c=a>th?'var(--bad)':a>=th*.85?'var(--warn)':'var(--acc)';g+='<rect class="fc-wb" style="--i:'+i+'" x="'+x+'" y="'+Y(a)+'" width="'+bw*.6+'" height="'+Math.max(0,Y(0)-Y(a))+'" rx="4" fill="'+c+'"'+(i===n-1?'':' opacity=".5"')+'/><text x="'+(x+bw*.3)+'" y="'+(hh-6)+'" text-anchor="middle">S'+(36+i)+'</text>'});
  g+='<line x1="'+pl+'" x2="'+(w-8)+'" y1="'+Y(th)+'" y2="'+Y(th)+'" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="5 5" opacity=".6"/><text x="'+(w-10)+'" y="'+(Y(th)-6)+'" text-anchor="end" style="font-weight:600;fill:var(--ink)">Seuil '+th+' h</text>';
  return '<svg class="chart" viewBox="0 0 '+w+' '+hh+'" role="img" aria-label="Heures de travail par semaine">'+g+'</svg>'}
function tabTravail(h,x){var p=loadP(h),wk=x.week,sess=[].concat.apply([],wk).filter(function(s){return !s.care}),restDays=wk.filter(function(d){return !d.some(function(s){return s.d>0})}).length,
   inten=sess.length?sess.reduce(function(a,s){return a+(s.in||1)},0)/sess.length:0,rest=isRest(h);
  var tot=x.types.reduce(function(a,t){return a+t.v},0);
  var sensor=x.sensor?'<div class="card"><div class="ch"><div><h3>Capteur de selle</h3><div class="xs mut">Séance d’hier, 17 h 45 · sangle connectée synchronisée à 18 h 42</div></div><span class="chip ok dot">Connecté</span></div><div class="cb stack" style="--g:14px">'+
     '<div class="fc-gait">'+[['Durée','52 min'],['Distance','6,4 km'],['Symétrie','96 %'],['Fréquence cardiaque','112 bpm']].map(function(a){return '<div><div class="xs mut ellip">'+a[0]+'</div><div class="v">'+a[1]+'</div></div>'}).join('')+'</div>'+
     '<div><div class="lb-bar2" style="height:14px"><i style="--c:var(--c3);width:34%"></i><i style="--c:var(--acc);width:28%"></i><i style="--c:var(--c2);width:38%"></i></div><div style="margin-top:8px">'+C.legend([['Pas, 34 %','var(--c3)'],['Trot, 28 %','var(--acc)'],['Galop, 38 %','var(--c2)']])+'</div></div>'+
     C.line([{v:[62,70,78,84,96,108,118,112,104,126,138,146,132,118,124,142,156,168,150,134,120,128,112,96,84,72,66],c:'var(--c6)',area:true}],['0','','4','','8','','12','','16','','20','','24','','28','','32','','36','','40','','44','','48','','52 min'],{h:150,min:40,max:190,fmt:function(v){return Math.round(v)}})+
     '<div class="note">'+ICON('pulse','sm')+'<span>Récupération en 2 min 40 après le galop, dans sa moyenne. Main gauche un peu moins engagée (symétrie 94 %) : cohérent avec la raideur notée au journal.</span></div></div></div>':
    '<div class="card">'+U.empty('sensor','Aucun capteur associé','Associez une sangle ou un capteur de selle pour suivre les allures, la symétrie et la fréquence cardiaque.','<button class="btn sm" data-act="pair">Associer un capteur</button>')+'</div>';
  return '<div class="stack rise" style="--g:14px"><div class="fc-cols eq">'+
   '<div class="card"><div class="ch"><h3>Charge de la semaine</h3><button class="btn ghost sm" data-act="thr">'+ICON('sliders','sm')+'Régler le seuil</button></div><div class="cb stack" style="--g:14px">'+
     '<div class="hrow sp" style="align-items:flex-end"><div><span class="disp bb" style="font-size:40px;line-height:1">'+h.work+' h</span><span class="mut b" style="margin-left:6px">sur '+h.workMax+' h</span></div>'+(p>100?U.chip('Seuil dépassé','bad',true):p>=85?U.chip('Proche du seuil','warn',true):rest?U.chip('Au repos','line'):U.chip('Charge saine','ok',true))+'</div>'+
     '<div class="lb-thr"><div class="bar" style="height:10px"><i style="--v:'+Math.min(100,p/1.2)+'%;--c:'+loadC(h)+'"></i></div><u style="left:'+(100/1.2)+'%"></u></div>'+
     '<div class="g3" style="--g:8px">'+[['Séances',sess.length],['Jours de repos',restDays],['Intensité',['Nulle','Légère','Modérée','Soutenue'][Math.round(inten)]||'Légère']].map(function(a){return '<div class="card soft" style="padding:10px 12px"><div class="xs mut">'+a[0]+'</div><div class="disp bb" style="font-size:19px">'+a[1]+'</div></div>'}).join('')+'</div>'+
     (p>100?'<div class="note bad">'+ICON('alert','sm')+'<span>'+E(h.name)+' dépasse son seuil de '+(h.work-h.workMax)+' h. Piaffe le retire des propositions de montoir jusqu’à dimanche.</span></div>':
      '<div class="note">'+ICON('shield','sm')+'<span>Au-delà de '+h.workMax+' h, Piaffe bloque l’attribution en reprise et vous prévient. Un jour de repos complet par semaine est garanti.</span></div>')+'</div></div>'+
   '<div class="card"><div class="ch"><div><h3>Heures par semaine</h3><div class="xs mut">12 dernières semaines</div></div><span class="s mut">Moyenne <b style="color:var(--ink)">'+F.num(x.hist.reduce(function(a,b){return a+b},0)/12,1)+' h</b></span></div><div class="cb">'+weeksChart(x.hist,h.workMax)+'</div></div></div>'+
   '<div class="card"><div class="ch"><h3>Planning de la semaine</h3><button class="btn ghost sm" data-act="plan">Ouvrir le planning'+ICON('arrow','sm')+'</button></div><div class="cb"><div class="fc-wk">'+wk.map(function(d,k){var tt=d.reduce(function(a,s){return a+s.d},0)/60;
     return '<div class="fc-wd'+(k===1?' today':'')+'"><div class="dn"><span>'+DAYSL[k]+'</span><b>'+(tt?hrs(tt):'')+'</b></div><div class="ss">'+(d.length?d.map(function(s){return '<div class="fc-ss'+(s.done?' done':'')+'" style="--c:'+(s.care?'var(--c4)':s.in===3?'var(--c2)':s.in===1?'var(--c3)':'var(--acc)')+'"><b>'+s.t+' · '+E(s.k)+'</b><span>'+E(s.w)+'</span></div>'}).join(''):'<div class="fc-rest">'+ICON('paddock','sm')+'<span>'+(rest&&k>0?'Repos prescrit':'Repos au paddock')+'</span></div>')+'</div></div>'}).join('')+'</div>'+
     '<div style="margin-top:12px">'+C.legend([['Séance intense','var(--c2)'],['Séance modérée','var(--acc)'],['Longe, travail léger','var(--c3)'],['Soin','var(--c4)']])+'</div></div></div>'+
   '<div class="fc-cols">'+sensor+'<div class="card"><div class="ch"><div><h3>Séances par type</h3><div class="xs mut">4 dernières semaines</div></div></div><div class="cb hrow wrap" style="--g:18px">'+C.donut(x.types.map(function(t){return {v:t.v,c:t.c}}),{size:132,center:F.num(tot,0)+' h',w:14})+
     '<div class="stack grow" style="--g:8px;min-width:150px">'+x.types.map(function(t){return '<div class="hrow sp s"><span class="hrow" style="--g:8px"><i style="width:8px;height:8px;border-radius:2px;background:'+t.c+'"></i>'+t.l+'</span><b class="num">'+hrs(t.v)+'</b></div>'}).join('')+'</div></div></div></div></div>'}

/* ---------- onglet : alimentation ---------- */
function mealCards(h){var m=meals(h),md=MEDS[h.id]||{};return '<div class="fc-meal">'+[['matin','Matin','07:00','sun'],['midi','Midi','12:00','clock'],['soir','Soir','18:00','moon']].map(function(a){var q=m[a[0]];
  return '<div class="fc-ml"><div class="hrow sp"><b class="hrow" style="--g:6px">'+ICON(a[3],'sm')+a[1]+'</b><span class="xs mut num">'+a[2]+'</span></div><div class="q"><span>Foin</span><b>'+String(q.hay).replace('.',',')+' kg</b></div><div class="q"><span>'+grainType(h)+'</span><b>'+(q.grain?String(q.grain).replace('.',',')+' kg':'Aucun')+'</b></div>'+(q.supp?'<div class="q"><span>'+q.supp+'</span><b>'+SUPP[q.supp].dose+'</b></div>':'')+(md[a[0]]?'<div class="al-fl med">'+ICON('pill','sm')+'<span>'+md[a[0]]+'</span></div>':'')+'</div>'}).join('')+'</div>'}
function needs(h){var w=h.weight,ent=+(0.0373*Math.pow(w,.75)).toFixed(1),trav=+(h.work/7*.55).toFixed(1),ufc=+(h.ration.hay*.48+h.ration.grain*.86).toFixed(1),madc=Math.round(h.ration.hay*38+h.ration.grain*85),nm=Math.round(w*.6+h.work/7*70);return {need:+(ent+trav).toFixed(1),ufc:ufc,madc:madc,nm:nm,fib:+(h.ration.hay/w*100).toFixed(1)}}
function tabAlim(h,x){var f=feedDay(h),d=f.hay+f.grain+f.supp,w=x.weights,dv=w[11]-w[8],N=needs(h),sp=SUPP[h.ration.supp];
  var nidx=Math.round(x.nec*2);
  return '<div class="stack rise" style="--g:14px"><div class="fc-cols eq">'+
   '<div class="card"><div class="ch"><h3>Ration du jour</h3><button class="btn sm" data-act="ration">'+ICON('edit','sm')+'Modifier la ration</button></div><div class="cb stack" style="--g:12px">'+mealCards(h)+
     (CONS[h.id]?'<div class="note warn">'+ICON('info','sm')+'<span><b>Consigne :</b> '+CONS[h.id]+'.</span></div>':'')+
     '<div class="hrow sp wrap s"><span class="mut">Total par jour : <b style="color:var(--ink)">'+h.ration.hay+' kg de foin, '+String(h.ration.grain).replace('.',',')+' kg de '+grainType(h).toLowerCase()+'</b></span><span><b class="num">'+F.eur(d,true)+'</b> <span class="mut">par jour, '+F.eur(Math.round(d*30.4))+' par mois</span></span></div></div></div>'+
   '<div class="card"><div class="ch"><div><h3>Poids et état corporel</h3><div class="xs mut">Pesée au ruban le '+F.date(iso(-3))+'</div></div><button class="btn sm" data-act="weigh">'+ICON('weight','sm')+'Enregistrer une pesée</button></div><div class="cb stack" style="--g:12px">'+
     '<div class="hrow sp" style="align-items:flex-end"><div><span class="disp bb" style="font-size:34px;line-height:1">'+w[11]+' kg</span> <span class="b s '+(dv<-8?'badc':dv>8?'warnc':'okc')+'" style="margin-left:6px">'+(dv>0?'+':dv<0?'−':'')+Math.abs(dv)+(hi(h)===15?' kg en 3 semaines':' kg en 3 mois')+'</span></div><div style="text-align:right"><div class="xs mut">Note d’état corporel</div><b>'+String(x.nec).replace('.',',')+' sur 5 · '+necTxt(x.nec)+'</b></div></div>'+
     '<div class="fc-nec" title="Échelle de l’IFCE, de 0 à 5">'+[1,2,3,4,5,6,7,8,9,10].map(function(k){return '<i class="'+(k<nidx?'on':k===nidx?'cur':'')+'"></i>'}).join('')+'</div>'+
     C.line([{v:w,c:'var(--acc)',area:true}],D.months,{h:150,min:Math.min.apply(null,w)-18,max:Math.max.apply(null,w)+14,fmt:function(v){return Math.round(v)}})+'</div></div></div>'+
   '<div class="fc-cols eq"><div class="card"><div class="ch"><div><h3>Apports et besoins</h3><div class="xs mut">Estimation selon les tables de l’INRA, pour '+w[11]+' kg et '+h.work+' h de travail</div></div></div><div class="cb stack" style="--g:14px">'+
     [['Énergie',N.ufc,N.need,'UFC',1],['Protéines',N.madc,N.nm,'g de MADC',0]].map(function(a){var r=a[1]/a[2]*100,c=r<90?'var(--warn)':r>120?'var(--warn)':'var(--ok)';return '<div class="stack" style="--g:6px"><div class="hrow sp s"><b>'+a[0]+'</b><span><b class="num">'+F.num(a[1],a[4])+'</b> <span class="mut">apportés pour '+F.num(a[2],a[4])+' '+a[3]+' de besoin</span></span></div><div class="lb-thr"><div class="bar" style="height:8px"><i style="--v:'+Math.min(100,r/1.4)+'%;--c:'+c+'"></i></div><u style="left:'+(100/1.4)+'%"></u></div></div>'}).join('')+
     '<div class="hrow sp s"><span><b>Fourrage</b> <span class="mut">· minimum conseillé 1,5 kg pour 100 kg</span></span>'+U.chip(String(N.fib).replace('.',',')+' kg pour 100 kg',N.fib>=1.5?'ok':'warn',true)+'</div></div></div>'+
   '<div class="card"><div class="ch"><h3>Compléments et cures</h3><button class="btn ghost sm" data-go="alimentation">Tableau d’écurie'+ICON('arrow','sm')+'</button></div><div style="padding:6px 0 4px">'+
     (h.ration.supp!=='Aucun'?'<div class="lb-row">'+sq('drop','','sm')+'<div class="grow"><div class="t">'+h.ration.supp+'</div><div class="s">'+sp.dose+' le '+sp.when+' · en continu</div></div><span class="s num b">'+F.eur(sp.d*30.4,true)+'<span class="mut" style="font-weight:400"> par mois</span></span></div>':'')+
     '<div class="lb-row">'+sq('bucket','mut','sm')+'<div class="grow"><div class="t">Pierre à sel</div><div class="s">Dans le box, remplacée le '+F.date(iso(-19))+'</div></div>'+U.chip('En place','ok')+'</div>'+
     '<div class="lb-row">'+sq('drop','mut','sm')+'<div class="grow"><div class="t">Eau</div><div class="s">Abreuvoir automatique · '+(h.id==='h23'?'3,1 litres par heure, en baisse de 40 %':'consommation normale, 31 litres hier')+'</div></div>'+(h.id==='h23'?U.chip('En baisse','warn',true):U.chip('Normal','ok'))+'</div></div>'+
     '<div class="cf"><button class="btn ghost sm" data-act="cure">'+ICON('plus','sm')+'Ajouter une cure</button></div></div></div></div>'}

/* ---------- onglet : journal ---------- */
var JK={travail:['saddle','Travail'],soin:['heart','Soin'],balade:['route','Balade']};
function jEntry(e){var p=D.person(e.who),k=JK[e.kind]||JK.soin;return '<div class="fc-j">'+U.av(e.who)+'<div><div class="hrow wrap" style="--g:6px"><b class="s">'+(p?p.first+' '+p.last:'')+'</b>'+U.chip(e.role,/Propri/.test(e.role)?'acc':/Demi/.test(e.role)?'navy':'')+'<span class="xs mut" style="margin-left:auto">'+e.when+'</span></div><p>'+E(e.text)+'</p><div class="hrow" style="--g:10px;margin-top:8px"><span class="xs mut hrow" style="--g:5px">'+ICON(k[0],'sm')+k[1]+'</span><span class="fc-mood" title="Forme du cheval : '+e.mood+' sur 5">'+[1,2,3,4,5].map(function(n){return '<i class="'+(n<=e.mood?'on':'')+'"></i>'}).join('')+'</span></div></div></div>'}
function tabJournal(h,x){var all=(ST.jr[h.id]||[]).concat(journal(h),D.journalMore.filter(function(e){return e.horse===h.id})),roles=['all','Propriétaire','Demi-pensionnaire','Palefrenier','Moniteur'],f=FS.jr,
   list=all.filter(function(e){return f==='all'||e.role.indexOf(f.slice(0,8))===0});
  var who=[h.owner&&[h.owner,'Propriétaire','Lit et écrit'],x.rider&&[x.rider,'Demi-pensionnaire','Lit et écrit'],['s05','Palefrenier soigneur','Lit et écrit'],['s06','Palefrenière soigneuse','Lit et écrit'],['s02','Moniteur','Lit et écrit'],['s01','Gérante','Tout voir']].filter(Boolean);
  return '<div class="fc-cols rise"><div class="stack" style="--g:14px"><div class="card pad stack" style="--g:10px"><textarea class="in" id="fc-jt" placeholder="Écrire une nouvelle de '+E(h.name.split(' ')[0])+' : une séance, un soin, une observation…" style="min-height:70px"></textarea>'+
    '<div class="hrow wrap sp"><div class="hrow wrap" style="--g:6px">'+U.seg([['soin','Soin'],['travail','Travail'],['balade','Balade']],'soin','data-jk')+'<button class="btn ghost sm icon" data-act="jphoto" title="Joindre une photo ou une vidéo">'+ICON('image','sm')+'</button><button class="btn ghost sm icon" data-act="jmic" title="Dicter la note">'+ICON('mic','sm')+'</button></div><button class="btn pri" data-act="jpost">'+ICON('send','sm')+'Publier</button></div></div>'+
    '<div class="card"><div class="scroll-x" style="padding:12px 16px 4px"><div class="lb-tags">'+roles.map(function(r){return '<button class="tag" data-manual data-jf="'+r+'" aria-pressed="'+(f===r)+'">'+(r==='all'?'Tout le monde':r)+'</button>'}).join('')+'</div></div>'+
     (list.length?list.map(jEntry).join(''):U.empty('chat','Aucune nouvelle de ce côté','Les notes publiées apparaîtront ici.'))+'</div></div>'+
   '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>Qui partage ce journal</h3><button class="btn ghost sm" data-act="invite">'+ICON('plus','sm')+'Inviter</button></div><div style="padding:6px 0 4px">'+who.map(function(wv){return '<div class="lb-row">'+U.av(wv[0])+'<div class="grow"><div class="t ellip">'+D.name(wv[0])+'</div><div class="s">'+wv[1]+'</div></div><span class="xs mut">'+wv[2]+'</span></div>'}).join('')+'</div>'+
     '<div class="cf"><span class="xs mut grow">Le vétérinaire et le maréchal peuvent recevoir un accès invité, sans compte.</span></div></div>'+
    '<div class="card"><div class="ch"><h3>Notifications</h3></div><div class="list"><div class="li"><div class="grow"><div class="t">Résumé du soir au propriétaire</div><div class="s">Un message à 19 h avec les nouvelles du jour</div></div>'+U.tog(!!h.owner)+'</div><div class="li"><div class="grow"><div class="t">Alerte immédiate en cas de soin</div><div class="s">Notification et SMS</div></div>'+U.tog(true)+'</div></div></div></div></div>'}

/* ---------- onglet : coûts ---------- */
function rebillLines(h){var l=allCare(h).filter(function(e){return e.status==='fait'&&e.price&&F.days(e.date)>=-45}).map(function(e){return {id:e.id,d:e.date,l:e.kind+' · '+e.note.split(',')[0].split('.')[0],v:e.price}});
  if(hi(h)===0)l.push({id:'h01x1',d:iso(-12),l:'Tonte complète',v:60},{id:'h01x2',d:iso(-5),l:'Engagement Club Élite, Rambouillet',v:26},{id:'h01x3',d:iso(-5),l:'Transport en van, part d’Ulysse',v:35});
  else l.push({id:h.id+'x1',d:iso(-8-hi(h)%9),l:'Tonte complète',v:60});return l.sort(function(a,b){return a.d<b.d?1:-1})}
function tabCouts(h,x){var cost=h.costMonth,mx=Math.max.apply(null,x.costs.map(function(c){return c.v})),own=h.owner,lines=own?rebillLines(h):[],todo=lines.filter(function(l){return !ST.rebill[l.id]}),sum=todo.reduce(function(a,l){return a+l.v},0),mg=x.income-cost,
   inv=own?D.invoices.find(function(i){return i.member===own&&i.status==='en retard'&&hi(h)===0}):null;
  return '<div class="fc-cols rise"><div class="stack" style="--g:14px"><div class="card"><div class="ch"><div><h3>Coût de revient mensuel</h3><div class="xs mut">Novembre 2026, calculé à partir de la ration, des soins et du temps passé</div></div><span class="disp bb num" style="font-size:24px">'+F.eur(cost)+'</span></div><div class="cb">'+
     '<div class="lb-bar2" style="height:12px;margin-bottom:12px">'+x.costs.map(function(c,k){return '<i title="'+c.l+'" style="--c:var(--c'+(k%7+1)+');width:'+(c.v/cost*100)+'%"></i>'}).join('')+'</div>'+
     x.costs.map(function(c,k){return '<div class="fc-cost"><span class="lb-sq sm mut" style="color:var(--c'+(k%7+1)+')">'+ICON(c.i,'sm')+'</span><div style="min-width:0"><div class="b ellip">'+c.l+'</div>'+(c.s?'<div class="xs mut ellip">'+c.s+'</div>':'')+'</div>'+U.bar(c.v/mx*100,'var(--c'+(k%7+1)+')')+'<b class="num" style="text-align:right">'+F.eur(c.v)+'</b></div>'}).join('')+'</div></div>'+
    '<div class="card"><div class="ch"><div><h3>Coût et recettes sur 12 mois</h3></div>'+C.legend([[x.incomeL,'var(--acc)'],['Coût de revient','var(--c2)']])+'</div><div class="cb">'+C.line([{v:x.trend.map(function(v,k){return own?x.pension:Math.round(x.income*(.82+((k*3)%6)*.05))}),c:'var(--acc)',area:true},{v:x.trend,c:'var(--c2)'}],D.months,{h:180,fmt:function(v){return Math.round(v)+' €'}})+'</div></div></div>'+
   '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>Ce que '+E(h.name.split(' ')[0])+' rapporte</h3></div><div class="cb stack" style="--g:10px">'+
     '<div class="hrow sp s"><span class="mut">'+x.incomeL+(own?'':' ('+h.work+' h par semaine)')+'</span><b class="num">'+F.eur(x.income)+'</b></div><div class="hrow sp s"><span class="mut">Coût de revient</span><b class="num">− '+F.eur(cost)+'</b></div><div class="hr"></div>'+
     '<div class="hrow sp"><b>Marge du mois</b><b class="disp num '+(mg>=0?'okc':'badc')+'" style="font-size:22px">'+(mg>=0?'+ ':'− ')+F.eur(Math.abs(mg))+'</b></div>'+
     (mg<0?'<div class="note warn">'+ICON('trend','sm')+'<span>'+(own?'La pension ne couvre pas le coût de revient. Une hausse de '+F.eur(Math.ceil(-mg/10)*10)+' équilibrerait ce box.':'À '+h.work+' h par semaine, ce cheval coûte plus qu’il ne rapporte. Deux reprises de plus l’équilibrent.')+'</span></div>':'')+
     (inv?'<div class="note bad">'+ICON('invoice','sm')+'<span>La facture <span class="mono">'+inv.id+'</span> de '+F.eur(inv.amount)+' est en retard de '+(-F.days(inv.due))+' jours.</span></div><button class="btn sm" data-act="relance">'+ICON('send','sm')+'Relancer '+D.member(own).first+'</button>':'')+'</div></div>'+
    (own?'<div class="card"><div class="ch"><h3>Refacturations au propriétaire</h3>'+(todo.length?'<span class="chip warn">'+F.eur(sum)+' à refacturer</span>':U.chip('Tout est refacturé','ok',true))+'</div><div style="padding:6px 0 4px">'+lines.map(function(l){var done=ST.rebill[l.id];
      return '<div class="lb-row">'+'<div class="grow"><div class="t ellip">'+E(l.l)+'</div><div class="s">'+F.date(l.d)+' · '+(done?'sur la facture de décembre':'pas encore facturé')+'</div></div><b class="num s">'+F.eur(l.v)+'</b>'+(done?sq('check','ok','sm'):'')+'</div>'}).join('')+'</div>'+
      '<div class="cf"><span class="xs mut grow">Les soins partent d’office sur la facture mensuelle de '+D.member(own).first+' '+D.member(own).last+'.</span>'+(todo.length?'<button class="btn pri sm" data-act="rebill">Refacturer '+todo.length+' lignes</button>':'')+'</div></div>':
     '<div class="card"><div class="ch"><h3>Rentabilité en reprise</h3></div><div class="cb stack" style="--g:8px"><div class="hrow sp s"><span class="mut">Recette par heure montée</span><b class="num">17 €</b></div><div class="hrow sp s"><span class="mut">Coût par heure montée</span><b class="num">'+F.eur(cost/Math.max(1,h.work*4.33),true)+'</b></div><div class="hrow sp s"><span class="mut">Point d’équilibre</span><b class="num">'+F.num(cost/17/4.33,1)+' h par semaine</b></div></div></div>')+
   '</div></div>'}

/* ---------- onglet : caméra ---------- */
function camScene(){return '<svg viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="fcg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#3b4640"/><stop offset=".6" stop-color="#1c2420"/><stop offset="1" stop-color="#080b0a"/></radialGradient><filter id="fcb"><feGaussianBlur stdDeviation="1.6"/></filter><filter id="fcn"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .09 0"/></filter></defs>'+
  '<rect width="640" height="360" fill="url(#fcg)"/><path d="M70 60h500l70 300H0z" fill="#2c3630"/><path d="M70 60h500v-60H70z" fill="#141a17"/><path d="M70 60L0 360M570 60l70 300" stroke="#0c100e" stroke-width="3"/><path d="M70 60h500" stroke="#465149" stroke-width="2"/>'+
  '<g stroke="#3a463f" stroke-width="1.4" opacity=".8">'+[[110,150,22,-8],[190,300,26,6],[420,120,24,9],[520,280,22,-7],[300,330,28,4],[90,270,20,10],[470,210,18,-10],[240,110,20,5],[560,160,18,8],[150,210,24,-4],[360,300,22,-9],[60,330,22,6]].map(function(s){return '<path d="M'+s[0]+' '+s[1]+'l'+s[2]+' '+s[3]+'"/>'}).join('')+'</g>'+
  '<rect x="470" y="0" width="100" height="60" fill="#0d1210"/><rect x="88" y="78" width="46" height="34" rx="6" fill="#515e56"/><ellipse cx="111" cy="80" rx="23" ry="6" fill="#6e7d73"/>'+
  '<g filter="url(#fcb)"><ellipse cx="335" cy="262" rx="150" ry="26" fill="#0a0e0c" opacity=".55"/>'+
  '<g class="bd"><path d="M228 208c-8-40 30-62 96-60 62 2 104 20 110 56 4 30-22 50-60 52-50 3-136 0-146-48z" fill="#cdd6d0"/><path d="M430 190c22 8 36 30 30 64" stroke="#aab5ae" stroke-width="9" stroke-linecap="round" fill="none"/></g>'+
  '<path d="M262 236l-8 44M300 246l-2 40M388 248l6 38M420 232l12 44" stroke="#b9c3bc" stroke-width="13" stroke-linecap="round"/>'+
  '<g class="hd"><path d="M248 196c-22-14-46-44-54-74 14-10 34-6 48 10 14 18 22 40 26 58z" fill="#d6ded8"/><path d="M196 124c-14 14-32 44-40 70 6 10 20 12 30 4 10-22 22-44 34-58z" fill="#dfe6e1"/><path d="M204 118l-4-20 14 12zM222 114l4-20 8 18z" fill="#dfe6e1"/><circle cx="196" cy="146" r="3.4" fill="#fff"/></g></g>'+
  '<rect width="640" height="360" filter="url(#fcn)"/></svg>'}
function tabCam(h,x){var cam=D.cameras.find(function(c){return c.box===h.box}),bad=h.status==='bad',col=bad?[['Debout',52,'var(--acc)'],['Couché',31,'var(--warn)'],['Mange',17,'var(--c7)']]:[['Debout',58,'var(--acc)'],['Couché',14,'var(--c2)'],['Mange',28,'var(--c7)']];
  var seq=bad?[[30,0],[6,1],[4,0],[9,1],[5,0],[12,1],[6,2],[10,0],[4,1],[14,0]]:[[22,0],[8,1],[14,0],[6,1],[10,2],[18,0],[8,2],[14,0]];
  var clips=bad?[['02:55','Se couche et se relève 4 fois en 20 minutes','bad'],['03:38','Arrivée du Dr Leclerc dans le box',''],['06:12','Couché calme, 48 minutes',''],['08:03','Crottins, se remet à manger','ok']]:[['01:12','Se couche, sommeil profond 42 minutes',''],['04:40','Se couche, 36 minutes',''],['07:04','Ration du matin distribuée','ok'],['08:31','Sortie du box, départ au paddock','']];
  return '<div class="fc-cols rise"><div class="stack" style="--g:14px"><div class="card pad stack" style="--g:12px"><div class="fc-cam">'+camScene()+'<div class="scan"></div><div class="ai"><span>'+E(h.name.split(' ')[0])+' · debout, '+(bad?'agité':'calme')+'</span></div>'+
     '<div class="hud t"><span class="live">EN DIRECT</span><span>'+h.box+' · CAM '+(cam?cam.id.replace('cam','0'):'0'+(hi(h)%8+1))+'</span></div><div class="hud b"><span data-clock>17/11/2026 09:41:07</span><span>IR auto · 1080p</span></div></div>'+
     '<div class="hrow wrap sp"><div class="hrow wrap" style="--g:8px"><button class="btn sm" data-act="camfull">'+ICON('expand','sm')+'Plein écran</button><button class="btn sm" data-act="camclip">'+ICON('rec','sm')+'Enregistrer un extrait</button><button class="btn sm" data-act="camtalk">'+ICON('mic','sm')+'Parler dans le box</button></div><button class="btn ghost sm" data-act="cams">Toutes les caméras'+ICON('arrow','sm')+'</button></div></div>'+
    '<div class="card"><div class="ch"><div><h3>Activité des dernières 24 heures</h3><div class="xs mut">Analyse automatique de l’image, de 9 h 41 hier à maintenant</div></div></div><div class="cb stack" style="--g:10px"><div class="fc-act">'+seq.map(function(s){return '<i style="--c:'+col[s[1]][2]+';width:'+s[0]+'%"></i>'}).join('')+'</div>'+
     '<div class="hrow sp xs mut num"><span>09:41</span><span>15:00</span><span>21:00</span><span>03:00</span><span>09:41</span></div>'+C.legend(col.map(function(c){return [c[0]+', '+c[1]+' %',c[2]]}))+'</div></div></div>'+
   '<div class="stack" style="--g:14px">'+(bad?'<div class="note bad">'+ICON('alert','sm')+'<span><b>Comportement inhabituel cette nuit.</b> Couché 3 fois plus que sa moyenne entre 2 h et 6 h. Mamadou et le Dr Leclerc ont été prévenus à 2 h 57.</span></div>':'')+
    '<div class="card"><div class="ch"><h3>Moments repérés</h3></div><div style="padding:6px 0 4px">'+clips.map(function(c){return '<div class="lb-row click" data-act="clip">'+sq('play',c[2]||'mut','sm')+'<div class="grow"><div class="t">'+c[1]+'</div><div class="s num">'+(c[0]<'06:30'?'Cette nuit':'Ce matin')+', '+c[0]+'</div></div>'+ICON('right','sm')+'</div>'}).join('')+'</div></div>'+
    '<div class="card"><div class="ch"><h3>Alertes de la caméra</h3></div><div class="list"><div class="li"><div class="grow"><div class="t">Couché plus de 3 heures</div><div class="s">Notification et appel du palefrenier d’astreinte</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">Agitation la nuit</div><div class="s">Se couche et se relève à répétition</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">Partager le direct avec le propriétaire</div><div class="s">'+(h.owner?ownerLine(h)+' voit la caméra dans son espace':'Cheval de club, pas de partage')+'</div></div>'+U.tog(!!h.owner)+'</div></div></div></div></div>'}

/* ---------- feuilles de la fiche ---------- */
function zoneSheet(h,id){var z=zones(h)[id],R=z.k?RULES[z.k]:null;
  var sh=P.sheet({title:z.l,icon:R?R.icon:'pulse',body:'<div class="stack" style="--g:16px"><div class="hrow wrap" style="--g:8px">'+U.hav(h)+'<b>'+E(h.name)+'</b>'+U.chip(z.st==='bad'?'Urgent':z.st==='warn'?'À surveiller':'Rien à signaler',z.st,true)+'</div>'+
    '<div class="note '+(z.st==='ok'?'ok':z.st)+'">'+ICON(z.st==='ok'?'checkc':'alert','sm')+'<span>'+z.sum+'</span></div>'+
    (R?'<div class="g2" style="--g:10px"><div class="card soft" style="padding:12px"><div class="xs mut">Dernier passage</div><b>'+F.dateY(h[z.k])+'</b></div><div class="card soft" style="padding:12px"><div class="xs mut">Prochain</div><b>'+F.dateY(due(h,z.k))+'</b></div></div>':'')+
    '<div><div class="eyebrow" style="margin-bottom:12px">Historique de la zone</div><div class="tl">'+z.ev.map(function(e){return '<div class="ev" style="--c:'+tone(z.st)+'"><div class="hrow sp"><b class="s">'+E(e.t)+'</b></div><div class="xs mut">'+(F.days(e.d)===0?'Aujourd’hui':F.dateY(e.d))+' · '+E(e.w)+'</div></div>'}).join('')+'</div></div>'+
    '<button class="btn ghost" data-ph style="justify-content:flex-start">'+ICON('image','sm')+'Ajouter une photo de la zone</button></div>',
   foot:'<button class="btn ghost" data-all>Tout le carnet de santé</button><button class="btn pri" data-new>'+ICON('plus','sm')+'Noter une observation</button>'});
  sh.querySelector('[data-ph]').onclick=function(){P.toast('Photo ajoutée au dossier « '+z.l+' »',{icon:'image'})};
  sh.querySelector('[data-all]').onclick=function(){sh.close();setTab('sante')};
  sh.querySelector('[data-new]').onclick=function(){careSheet(h,z.k?RULES[z.k].k:'Vétérinaire',z.l)};
  return sh}

function careSheet(h,kind,zone){var kinds=['Vétérinaire','Maréchal','Vaccin','Vermifuge','Dentiste','Ostéopathe'],sel=kind||'Vétérinaire',own=h.owner;
  var sh=P.sheet({title:'Ajouter un soin',icon:'care',body:'<div class="stack" style="--g:14px"><div class="hrow" style="--g:10px">'+U.hav(h)+'<div><b>'+E(h.name)+'</b><div class="xs mut">'+h.box+(zone?' · zone : '+zone.toLowerCase():'')+'</div></div></div>'+
    '<div class="field"><span>Type de soin</span><div class="scroll-x">'+U.seg(kinds.map(function(k){return [k,k]}),sel,'data-ck')+'</div></div>'+
    '<div class="g2" style="--g:12px"><label class="field"><span>Date</span><input class="in" type="date" id="fc-cd" value="'+iso(0)+'"></label><label class="field"><span>Praticien</span><select class="in" id="fc-cw">'+D.practitioners.map(function(p){return '<option>'+p.short+'</option>'}).join('')+'<option>Équipe</option></select></label></div>'+
    '<label class="field"><span>Compte rendu</span><textarea class="in" id="fc-cn" placeholder="Ce qui a été fait, ce qu’il faut surveiller…">'+(zone?zone+' : ':'')+'</textarea></label>'+
    '<div class="g2" style="--g:12px"><label class="field"><span>Coût</span><input class="in num" id="fc-cp" value="68" inputmode="decimal"></label><label class="field"><span>Prochain rappel</span><select class="in"><option>Selon la règle du club</option><option>Dans 1 mois</option><option>Dans 6 mois</option><option>Aucun</option></select></label></div>'+
    '<button class="lb-drop" data-rx style="padding:16px">'+ICON('image')+'<b class="s">Photographier l’ordonnance ou la facture</b><span class="xs mut">Piaffe lit le médicament, la posologie et le délai d’attente</span></button>'+
    '<div class="card flat list">'+(own?'<div class="li"><div class="grow"><div class="t">Refacturer à '+D.name(own)+'</div><div class="s">Ajouté à sa prochaine facture mensuelle</div></div>'+U.tog(true,'fc-crb')+'</div><div class="li"><div class="grow"><div class="t">Prévenir le propriétaire</div><div class="s">Notification avec le compte rendu</div></div>'+U.tog(true)+'</div>':'')+
     '<div class="li"><div class="grow"><div class="t">Inscrire au registre d’élevage</div><div class="s">Écriture datée et signée, non modifiable</div></div>'+U.tog(true)+'</div></div></div>',
   foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-save>'+ICON('check','sm')+'Enregistrer le soin</button>'});
  on(sh,'[data-ck]',function(b){sel=b.getAttribute('data-ck');var pr=D.practitioners.find(function(p){return p.kinds.indexOf(sel)>=0});sh.querySelector('#fc-cw').value=sel==='Vermifuge'?'Équipe':pr.short;sh.querySelector('#fc-cp').value=({'Vétérinaire':68,'Maréchal':h.pony?45:95,'Vaccin':58,'Vermifuge':22,'Dentiste':70,'Ostéopathe':80})[sel]});
  var pr0=D.practitioners.find(function(p){return p.kinds.indexOf(sel)>=0});sh.querySelector('#fc-cw').value=sel==='Vermifuge'?'Équipe':pr0.short;
  sh.querySelector('[data-rx]').onclick=function(e){var b=e.currentTarget;b.innerHTML=ICON('checkc')+'<b class="s">Ordonnance lue</b><span class="xs mut">Méloxicam, 30 ml par jour pendant 5 jours · délai d’attente 3 jours</span>';b.style.borderStyle='solid';var n=sh.querySelector('#fc-cn');if(!/Méloxicam/.test(n.value))n.value+='Méloxicam, 30 ml par jour pendant 5 jours.'};
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
  sh.querySelector('[data-save]').onclick=function(){var d=sh.querySelector('#fc-cd').value||iso(0),fut=F.days(d)>0,key=RK.find(function(k){return RULES[k].k===sel});
    if(!(key&&!fut))(ST.extra[h.id]=ST.extra[h.id]||[]).push({id:'x'+Date.now(),date:d,kind:sel,who:sh.querySelector('#fc-cw').value,note:sh.querySelector('#fc-cn').value.trim()||'Soin enregistré par Claire Morel',price:parseFloat(sh.querySelector('#fc-cp').value)||0,status:fut?'planifié':'fait'});
    if(key&&!fut){h[key]=d;delete XC[h.id]}
    sh.close();FS.tab='sante';FS.care='all';P.rerender();P.toast(sel+(fut?' planifié le '+F.date(d):' enregistré')+' pour '+h.name+(own&&!fut?', refacturé à '+D.member(own).first:''),{icon:'checkc'})};
  return sh}

function qrSvg(seed){var r=rng(seed),n=25,s='';function fin(x,y){s+='<rect x="'+x+'" y="'+y+'" width="7" height="7"/><rect x="'+(x+1)+'" y="'+(y+1)+'" width="5" height="5" fill="#fff"/><rect x="'+(x+2)+'" y="'+(y+2)+'" width="3" height="3"/>'}
  for(var y=0;y<n;y++)for(var x=0;x<n;x++){if((x<8&&y<8)||(x>n-9&&y<8)||(x<8&&y>n-9))continue;if(r()>.52)s+='<rect x="'+x+'" y="'+y+'" width="1" height="1"/>'}
  fin(0,0);fin(n-7,0);fin(0,n-7);return '<svg viewBox="-1 -1 '+(n+2)+' '+(n+2)+'" fill="#0a1636" shape-rendering="crispEdges">'+s+'</svg>'}
function qrSheet(h){var sh=P.sheet({title:'Fiche de box',icon:'qr',body:'<div class="stack" style="--g:16px;text-align:center"><div class="fc-qr">'+qrSvg(hi(h)*97+11)+'</div><div><b class="disp" style="font-size:20px">'+E(h.name)+'</b><div class="s mut">Box '+h.box+' · à coller sur la porte</div></div>'+
   '<p class="s mut" style="text-align:left">Un palefrenier, le vétérinaire ou le maréchal scanne le code et voit la ration, les soins du jour, les consignes et les contacts d’urgence, sans compte ni mot de passe. Vous choisissez ce qui s’affiche.</p>'+
   '<div class="card flat list" style="text-align:left"><div class="li"><div class="grow t">Ration et consignes</div>'+U.tog(true)+'</div><div class="li"><div class="grow t">Soins du jour et traitements</div>'+U.tog(true)+'</div><div class="li"><div class="grow t">Téléphone du propriétaire</div>'+U.tog(false)+'</div></div></div>',
   foot:'<button class="btn" data-a>'+ICON('link','sm')+'Copier le lien</button><button class="btn pri" data-b>'+ICON('download','sm')+'Imprimer la fiche de box</button>'});
  sh.querySelector('[data-a]').onclick=function(){P.toast('Lien de la fiche de box copié',{icon:'link'})};sh.querySelector('[data-b]').onclick=function(){sh.close();P.toast('Fiche de box de '+h.name+' envoyée à l’imprimante du bureau',{icon:'download'})}}

function docSheet(h,d){var sh=P.sheet({title:d[0],icon:d[1],body:'<div class="stack" style="--g:14px"><div class="fc-doc"><div class="hrow sp"><b class="s">'+E(h.name)+'</b>'+U.chip(d[3],'line')+'</div><i style="width:70%"></i><i style="width:92%"></i><i style="width:84%"></i><i style="width:60%"></i><i style="width:88%;margin-top:8px"></i><i style="width:76%"></i><i style="width:40%"></i></div>'+
   '<dl class="lb-dl" style="margin:0"><div><dt>Ajouté par</dt><dd>Claire Morel</dd></div><div><dt>Le</dt><dd>'+F.dateY(X(h).arrival)+'</dd></div><div><dt>Visible par</dt><dd>'+(h.owner?'Vous et '+D.member(h.owner).first:'L’équipe')+'</dd></div><div><dt>Format</dt><dd>PDF, 1,2 Mo</dd></div></dl></div>',
   foot:'<button class="btn" data-a>'+ICON('send','sm')+'Envoyer au vétérinaire</button><button class="btn pri" data-b>'+ICON('download','sm')+'Télécharger</button>'});
  sh.querySelector('[data-a]').onclick=function(){sh.close();P.toast('« '+d[0]+' » envoyé au Dr Leclerc par lien sécurisé',{icon:'send'})};sh.querySelector('[data-b]').onclick=function(){P.toast('« '+d[0]+' » téléchargé',{icon:'download'})}}

function rationSheet(h,after){var sup=Object.keys(SUPP);
  var sh=P.sheet({title:'Ration de '+h.name.split(' ')[0],icon:'feed',body:'<div class="stack" style="--g:16px"><div class="hrow" style="--g:10px">'+U.hav(h)+'<div><b>'+E(h.name)+'</b><div class="xs mut">'+h.box+' · '+h.weight+' kg · note d’état '+String(nec(h)).replace('.',',')+' sur 5</div></div></div>'+
    '<div class="card flat list"><div class="li"><div class="grow"><div class="t">Foin de prairie</div><div class="s">Par jour, réparti sur 3 repas</div></div>'+stepper('hay',h.ration.hay,'kg')+'</div><div class="li"><div class="grow"><div class="t">'+grainType(h)+'</div><div class="s">Par jour, matin et soir</div></div>'+stepper('grain',h.ration.grain,'kg')+'</div></div>'+
    '<label class="field"><span>Complément</span><select class="in" id="al-sup">'+sup.map(function(s){return '<option'+(s===h.ration.supp?' selected':'')+'>'+s+'</option>'}).join('')+'</select></label>'+
    '<label class="field"><span>Consigne affichée sur le tableau d’écurie</span><input class="in" id="al-con" value="'+E(CONS[h.id]||'')+'" placeholder="Foin mouillé, pas de carottes…"></label>'+
    '<div class="card soft pad stack" style="--g:8px" id="al-sim"></div>'+
    '<div class="note">'+ICON('assistant','sm')+'<span>Pour '+h.weight+' kg et '+h.work+' h de travail par semaine, l’assistant conseille '+Math.round(h.weight*.018)+' kg de foin et '+String(r5(Math.max(.5,h.work*.2))).replace('.',',')+' kg de granulés.</span></div></div>',
   foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-save>'+ICON('check','sm')+'Enregistrer la ration</button>'});
  var cur={hay:h.ration.hay,grain:h.ration.grain};
  function sim(){var t={ration:{hay:cur.hay,grain:cur.grain,supp:sh.querySelector('#al-sup').value},kind:h.kind,weight:h.weight,work:h.work},N=needs(t),d=feedDayTot(t),r=N.ufc/N.need*100;
    sh.querySelector('#al-sim').innerHTML='<div class="hrow sp s"><span class="mut">Énergie apportée</span><b class="num '+(r<90||r>125?'warnc':'okc')+'">'+F.num(N.ufc,1)+' UFC pour '+F.num(N.need,1)+' de besoin</b></div><div class="hrow sp s"><span class="mut">Fourrage</span><b class="num '+(N.fib<1.5?'warnc':'okc')+'">'+String(N.fib).replace('.',',')+' kg pour 100 kg</b></div><div class="hrow sp s"><span class="mut">Coût de la ration</span><b class="num">'+F.eur(d,true)+' par jour, '+F.eur(Math.round(d*30.4))+' par mois</b></div>'}
  sim();bindSteppers(sh,.5,'kg',function(k,v){cur[k]=v;sim()});sh.querySelector('#al-sup').onchange=sim;
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
  sh.querySelector('[data-save]').onclick=function(){var old={hay:h.ration.hay,grain:h.ration.grain,supp:h.ration.supp,c:CONS[h.id]};h.ration.hay=cur.hay;h.ration.grain=cur.grain;h.ration.supp=sh.querySelector('#al-sup').value;var c=sh.querySelector('#al-con').value.trim();if(c)CONS[h.id]=c.replace(/\.$/,'');else delete CONS[h.id];delete XC[h.id];X(h);
    sh.close();if(after)after();else P.rerender();P.toast('Ration de '+h.name+' mise à jour. Le tableau d’écurie est à jour pour ce soir.',{icon:'checkc',undo:function(){h.ration.hay=old.hay;h.ration.grain=old.grain;h.ration.supp=old.supp;if(old.c)CONS[h.id]=old.c;else delete CONS[h.id];delete XC[h.id];X(h);P.rerender()}})};
  return sh}

function weighSheet(h){var x=X(h),w=h.weight,n=nec(h);
  var sh=P.sheet({title:'Enregistrer une pesée',icon:'weight',body:'<div class="stack" style="--g:16px"><div class="card flat list"><div class="li"><div class="grow"><div class="t">Poids</div><div class="s">Dernière pesée : '+h.weight+' kg</div></div><span class="lb-step" data-step="w" data-unit="kg"><button type="button" data-d="-1" title="Diminuer">'+ICON('minus','sm')+'</button><output data-v="'+w+'">'+w+' kg</output><button type="button" data-d="1" title="Augmenter">'+ICON('plus','sm')+'</button></span></div></div>'+
    '<div class="field"><span>Méthode</span>'+U.seg([['ruban','Ruban'],['bascule','Bascule'],['estim','Estimation']],'ruban','data-wm')+'</div>'+
    '<div class="field"><span>Note d’état corporel, de 0 à 5</span><div class="scroll-x">'+U.seg([1.5,2,2.5,3,3.5,4,4.5].map(function(v){return [String(v),String(v).replace('.',',')]}),String(n),'data-nec')+'</div><span class="xs mut" style="font-weight:400">Échelle de l’IFCE. On palpe les côtes, le garrot, l’arrière de l’épaule et l’attache de queue.</span></div></div>',
   foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-save>'+ICON('check','sm')+'Enregistrer</button>'});
  bindSteppers(sh,1,'kg',function(k,v){w=v});on(sh,'[data-nec]',function(b){n=parseFloat(b.getAttribute('data-nec'))});
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
  sh.querySelector('[data-save]').onclick=function(){h.weight=w;x.weights[11]=w;x.nec=n;h.bcs=({2.5:4,3:5,3.5:6,4:7})[n]||h.bcs;sh.close();P.rerender();P.toast(h.name+' : '+w+' kg, note d’état '+String(n).replace('.',',')+'. La courbe est à jour.',{icon:'weight'})}}

function thrSheet(h){var v=h.workMax;
  var sh=P.sheet({title:'Seuil de charge',icon:'gauge',body:'<div class="stack" style="--g:16px"><p class="s mut">Au-delà du seuil, Piaffe ne propose plus '+E(h.name)+' au montoir et prévient le moniteur qui compose la reprise.</p><div class="card flat list"><div class="li"><div class="grow"><div class="t">Heures de travail par semaine</div><div class="s">Recommandé : '+(h.pony?12:16)+' h pour un '+(h.pony?'poney':'cheval')+' de '+h.age+' ans</div></div><span class="lb-step" data-step="t" data-unit="h"><button type="button" data-d="-1" title="Diminuer">'+ICON('minus','sm')+'</button><output data-v="'+v+'">'+v+' h</output><button type="button" data-d="1" title="Augmenter">'+ICON('plus','sm')+'</button></span></div>'+
    '<div class="li"><div class="grow"><div class="t">Un jour de repos complet par semaine</div><div class="s">Paddock uniquement</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">Pas plus de 2 reprises à la suite</div><div class="s">Une heure de pause entre deux séances</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">Appliquer à tous les '+(h.pony?'poneys':'chevaux')+' de club</div></div>'+U.tog(false)+'</div></div></div>',
   foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-save>Enregistrer le seuil</button>'});
  bindSteppers(sh,1,'h',function(k,val){v=Math.max(1,val)});sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
  sh.querySelector('[data-save]').onclick=function(){h.workMax=v;sh.close();P.rerender();P.toast('Seuil de '+h.name+' réglé à '+v+' h par semaine',{icon:'gauge'})}}

function msgSheet(h){var own=h.owner?D.member(h.owner):null,to=own?own.first+' '+own.last:'Équipe d’écurie';
  var sh=P.sheet({title:'Écrire à '+to,icon:'chat',body:'<div class="stack" style="--g:14px"><div class="hrow" style="--g:10px">'+(own?U.av(own):sq('team'))+'<div><b>'+to+'</b><div class="xs mut">'+(own?'Propriétaire de '+E(h.name)+' · '+own.phone:'Palefreniers et moniteurs')+'</div></div></div>'+
    '<div class="field"><span>Canal</span>'+U.seg([['app','Notification'],['sms','SMS'],['mail','E-mail']],'app','data-ch')+'</div>'+
    '<label class="field"><span>Message</span><textarea class="in" id="fc-msg" style="min-height:130px">Bonjour '+(own?own.first:'à tous')+',\n\n'+(h.alerts[0]?h.name+' : '+h.alerts[0].charAt(0).toLowerCase()+h.alerts[0].slice(1)+'. ':'Des nouvelles de '+h.name+' : tout va bien ce matin. ')+'Je vous tiens au courant.\n\nClaire</textarea></label>'+
    '<div class="hrow wrap" style="--g:6px">'+['Joindre le compte rendu du vétérinaire','Proposer un rendez-vous','Joindre la facture'].map(function(t){return '<button class="tag" type="button">'+t+'</button>'}).join('')+'</div></div>',
   foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-send>'+ICON('send','sm')+'Envoyer le message</button>'});
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};sh.querySelector('[data-send]').onclick=function(){sh.close();P.toast('Message envoyé à '+to,{icon:'send',undo:function(){P.toast('Envoi annulé',{icon:'refresh'})}})}}

function moreSheet(h){var A=[['download','Exporter le carnet de santé en PDF','Carnet de santé de '+h.name+' exporté, 14 pages'],['doc','Imprimer la fiche complète','Fiche de '+h.name+' envoyée à l’imprimante du bureau'],['swap','Changer de box','Choisissez le nouveau box sur le plan de l’écurie'],['owner','Transférer la fiche à un nouveau propriétaire','Lien de transfert créé : le carnet de santé suit le cheval'],['link','Donner un accès invité au vétérinaire','Accès invité envoyé au Dr Leclerc, valable 30 jours'],['folder','Archiver le cheval (départ du club)','Départ préparé : le registre des mouvements sera complété à la validation']];
  var sh=P.sheet({title:'Autres actions',icon:'more',body:'<div class="card flat">'+A.map(function(a,k){return '<div class="lb-row click" data-k="'+k+'">'+sq(a[0],'mut','sm')+'<div class="grow t">'+a[1]+'</div>'+ICON('right','sm')+'</div>'}).join('')+'</div>'});
  on(sh,'[data-k]',function(r){var a=A[+r.getAttribute('data-k')];sh.close();if(a[0]==='swap'&&P.mods.ecurie3d){P.go('ecurie3d',{id:h.id});return}P.toast(a[2],{icon:a[0]})})}

/* ---------- l'écran ---------- */
var setTab=function(){};
P.mod({id:'cheval',role:'gerant',group:'Écurie',title:'Fiche cheval',icon:'horse',hidden:true,tab:'chevaux',phoneTitle:'Fiche cheval',
 render:function(el,ctx){
  var h=D.horse(ctx.params.id||'h01')||D.horses[0],x=X(h);if(P.setTitle)setTimeout(function(){if(P.route==='cheval'||!P.route)P.setTitle(h.name)},0);
  if(ctx.params.tab){FS.tab=ctx.params.tab;ctx.params.tab=null}
  var z=zones(h),own=h.owner?D.member(h.owner):null,idx=hi(h),prev=D.horses[(idx+D.horses.length-1)%D.horses.length],next=D.horses[(idx+1)%D.horses.length];
  el.innerHTML='<div class="hrow sp" style="margin-bottom:12px"><a class="fc-back" data-go="chevaux" style="margin:0">'+ICON('back','sm')+'Tous les chevaux</a><div class="hrow" style="--g:4px"><button class="btn ghost icon sm" data-go="cheval" data-id="'+prev.id+'" title="Cheval précédent : '+E(prev.name)+'">'+ICON('left','sm')+'</button><span class="xs mut num">'+h.box+'</span><button class="btn ghost icon sm" data-go="cheval" data-id="'+next.id+'" title="Cheval suivant : '+E(next.name)+'">'+ICON('right','sm')+'</button></div></div>'+
   '<div class="card fc-hero"><div class="fc-stage"><div class="fc-gl"></div>'+
     '<div class="fc-st-top"><span class="fc-hint">'+ICON('rotate','sm')+'<span>Faites tourner '+E(h.name.split(' ')[0])+', touchez un point</span></span><button class="btn sm" data-move title="Voir le cheval en mouvement">'+ICON('play','sm')+'<span>En mouvement</span></button></div>'+
     '<div class="fc-zones scroll-x">'+ZK.map(function(k){return '<button class="fc-z" data-zone="'+k+'"><i style="--c:'+tone(z[k].st)+'"></i>'+z[k].l+'</button>'}).join('')+'</div></div>'+
    '<div class="fc-id"><div class="hrow wrap" style="--g:6px">'+stChip(h)+kindChip(h)+U.chip('Box '+h.box,'line')+(isRest(h)?U.chip('Au repos','line'):'')+'</div>'+
     '<div class="fc-nm"><h1>'+E(h.name)+'</h1><div class="mut" style="margin-top:6px">'+h.breed+' · '+h.sex.toLowerCase()+' '+h.coat.toLowerCase()+' · '+h.age+' ans · '+(h.height/100).toFixed(2).replace('.',',')+' m</div></div>'+
     (h.alerts.length?'<div class="note '+(h.status==='bad'?'bad':'warn')+'">'+ICON('alert','sm')+'<span>'+h.alerts.map(E).join('. ')+'.</span></div>':'')+
     '<div class="fc-rings">'+RK.map(function(k){return ringHtml(h,k)}).join('')+'</div>'+
     '<dl class="lb-dl" style="margin:0"><div><dt>Propriétaire</dt><dd>'+(own?'<a data-own style="cursor:pointer" class="hrow" title="Ouvrir la fiche adhérent">'+U.av(own,'sm')+'<span class="ellip">'+own.first+' '+own.last+'</span></a>':'Écurie des Tilleuls')+'</dd></div><div><dt>'+(x.rider?'Demi-pensionnaire':'Niveau')+'</dt><dd>'+(x.rider?'<span class="hrow">'+U.av(x.rider,'sm')+'<span class="ellip">'+D.name(x.rider)+'</span></span>':h.level)+'</dd></div>'+
      '<div><dt>Numéro SIRE</dt><dd><button class="mono" data-copy="'+x.sireNo+'" title="Copier le numéro SIRE" style="font-weight:600">'+x.sireNo+' '+ICON('copy','sm')+'</button></dd></div><div><dt>Assurance</dt><dd class="ellip">'+x.ins.co+'</dd></div></dl>'+
     '<div class="fc-acts"><button class="btn pri" data-act="care">'+ICON('plus','sm')+'Ajouter un soin</button><button class="btn" data-act="msg">'+ICON('chat','sm')+'Écrire</button><button class="btn icon" data-act="qr" title="Fiche de box et code à scanner">'+ICON('qr','sm')+'</button><button class="btn icon" data-act="more" title="Autres actions">'+ICON('more','sm')+'</button></div></div></div>'+
   '<div class="fc-tabs">'+U.tabs(TABS,FS.tab,'data-ct')+'</div><div id="fc-body"></div>';

  /* 3D */
  var stage=el.querySelector('.fc-stage'),gl=el.querySelector('.fc-gl'),api=null,moving=false;
  function mount(){if(api)api.dispose();gl.innerHTML='';
    api=P.gl.horse(gl,{points:moving?[]:ZK.map(function(k){return {id:k,label:z[k].l,pos:z[k].pos,c:tone(z[k].st)}}),onPick:function(id){zoneSheet(h,id)},walk:moving,rot:-.78});
    if(!moving)ZK.forEach(function(k){if(z[k].st!=='ok'){var b=gl.querySelector('[data-hot="'+k+'"]');if(b)b.classList.add('show')}});
    P.$$('.h3d',gl).forEach(function(b){b.title='Ouvrir l’historique de la zone'})}
  mount();
  el.querySelector('[data-move]').onclick=function(e){moving=!moving;stage.classList.toggle('moving',moving);e.currentTarget.innerHTML=ICON(moving?'pause':'play','sm')+'<span>'+(moving?'Revenir aux soins':'En mouvement')+'</span>';mount()};

  /* onglets */
  var body=el.querySelector('#fc-body'),clock=null;
  function draw(){var f={vue:tabVue,sante:tabSante,travail:tabTravail,alim:tabAlim,journal:tabJournal,couts:tabCouts,camera:tabCam}[FS.tab]||tabVue;body.innerHTML=f(h,x);P.animate(body);
    if(clock){clearInterval(clock);clock=null}var ck=body.querySelector('[data-clock]');
    if(ck){var s=7;clock=setInterval(function(){if(!ck.isConnected){clearInterval(clock);return}s++;ck.textContent='17/11/2026 09:'+String(41+Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0')},1000)}}
  setTab=function(t){FS.tab=t;P.$$('[data-ct]',el).forEach(function(b){b.setAttribute('aria-selected',b.getAttribute('data-ct')===t)});draw();var tb=el.querySelector('.fc-tabs');if(tb&&tb.scrollIntoView)tb.scrollIntoView({block:'start',behavior:P.RM?'auto':'smooth'})};
  draw();
  on(el,'[data-ct]',function(b){FS.tab=b.getAttribute('data-ct');draw()});
  on(el,'[data-tabgo]',function(b){setTab(b.getAttribute('data-tabgo'))});
  on(el,'[data-ring]',function(b){var R=RULES[b.getAttribute('data-ring')];FS.care=R?R.k:'all';setTab('sante')});
  on(el,'[data-zone]',function(b){zoneSheet(h,b.getAttribute('data-zone'))});
  on(el,'[data-cf]',function(b){FS.care=b.getAttribute('data-cf');draw()});
  on(el,'[data-jf]',function(b){FS.jr=b.getAttribute('data-jf');draw()});
  on(el,'[data-doc]',function(r){var docs=DOCS.filter(function(d){return h.owner||(d[3]!=='Contrat'&&d[0]!=='Carte d’immatriculation')});docSheet(h,docs[+r.getAttribute('data-doc')])});
  on(el,'[data-plan]',function(b){var k=b.getAttribute('data-plan');careSheet(h,k?RULES[k].k:'Vétérinaire')});
  on(el,'[data-own]',function(){goOr('adherent',{id:h.owner},'La fiche de '+D.name(h.owner)+' s’ouvre dans l’écran Adhérents')});
  on(el,'[data-copy]',function(b){try{var cp=navigator.clipboard&&navigator.clipboard.writeText(b.getAttribute('data-copy'));if(cp&&cp.catch)cp.catch(function(){})}catch(e){}P.toast('Numéro SIRE copié',{icon:'copy'})});
  on(el,'[data-given]',function(b){var o=rx(h)[0],t=b.parentNode.querySelector('[data-givent]');setTimeout(function(){var n=P.$$('[data-given][aria-checked="true"]',b.parentNode).length;if(t)t.textContent=n+' prises sur '+o.given.length;P.toast(b.getAttribute('aria-checked')==='true'?'Prise notée au registre, signée Claire Morel':'Prise retirée du registre',{icon:'pill'})},0)});
  var ACT={
   care:function(){careSheet(h)},msg:function(){msgSheet(h)},qr:function(){qrSheet(h)},more:function(){moreSheet(h)},
   sire:function(){P.toast('Identité conforme à la fiche de l’IFCE, vérifiée à l’instant',{icon:'checkc'})},
   editid:function(){P.sheet({title:'Modifier l’identité',icon:'edit',body:'<div class="stack" style="--g:12px"><div class="g2" style="--g:12px">'+[['Nom',h.name],['Box',h.box],['Paddock',h.paddock],['Niveau',h.level],['Taille (cm)',h.height],['Caractère',h.mood]].map(function(a){return '<label class="field"><span>'+a[0]+'</span><input class="in" value="'+E(a[1])+'"></label>'}).join('')+'</div><div class="note">'+ICON('lock','sm')+'<span>Le numéro SIRE, la robe et les origines viennent de l’IFCE et ne se modifient pas ici.</span></div></div>',foot:'<button class="btn pri" data-s>Enregistrer</button>'}).querySelector('[data-s]').onclick=function(){P.closeSheets();P.toast('Fiche de '+h.name+' mise à jour')}},
   adddoc:function(){P.toast('Document ajouté au dossier de '+h.name+' et classé par l’assistant',{icon:'folder'})},
   opendoc:function(){docSheet(h,['Ordonnance et compte rendu','doc','','Santé'])},
   rxadd:function(){careSheet(h,'Vétérinaire')},
   regpdf:function(){P.toast('Registre d’élevage de '+h.name+' exporté en PDF horodaté',{icon:'download'})},
   moves:function(){P.sheet({title:'Mouvements de '+h.name.split(' ')[0],icon:'route',body:'<div class="tl">'+[[iso(-4),'Retour du concours de Chantilly','Camion 6 places, 88 km'],[iso(-4),'Sortie : concours CSO Amateur, Chantilly','Départ 6 h 30'],['2026-07-06','Retour de stage, Lamotte-Beuvron','162 km'],['2026-07-03','Sortie : stage d’été','Van 2 places'],[x.arrival,'Entrée au club','Lieu de détention déclaré au SIRE']].slice(h.kind==='club'?2:0).map(function(m){return '<div class="ev"><b class="s">'+m[1]+'</b><div class="xs mut">'+F.dateY(m[0])+' · '+m[2]+'</div></div>'}).join('')+'</div>'})},
   thr:function(){thrSheet(h)},plan:function(){goOr('planning',{horse:h.id},'Le planning de '+h.name+' s’ouvre dans l’écran Planning')},
   pair:function(){x.sensor=true;draw();P.toast('Capteur de selle associé à '+h.name,{icon:'sensor'})},
   ration:function(){rationSheet(h)},weigh:function(){weighSheet(h)},cure:function(){P.toast('Cure de 3 semaines ajoutée, la première dose part au tableau de ce soir',{icon:'drop'})},
   jphoto:function(){P.toast('Photo jointe à la note',{icon:'image'})},jmic:function(){var t=body.querySelector('#fc-jt');t.value='Marche en main 15 minutes dans l’allée, calme, bon appétit au retour.';P.toast('Dictée transcrite',{icon:'mic'})},
   jpost:function(){var t=body.querySelector('#fc-jt'),v=t.value.trim();if(!v){t.focus();P.toast('Écrivez d’abord quelques mots',{icon:'info'});return}var k=(body.querySelector('[data-jk][aria-selected="true"]')||{getAttribute:function(){return 'soin'}}).getAttribute('data-jk');
     (ST.jr[h.id]=ST.jr[h.id]||[]).unshift({who:'s01',role:'Gérante',when:'À l’instant',text:v,kind:k,mood:4});FS.jr='all';draw();P.toast('Publié dans le journal'+(own?'. '+own.first+' est prévenue.':''),{icon:'send'})},
   invite:function(){P.toast('Invitation envoyée. L’accès se limite au journal et au carnet de santé.',{icon:'mail'})},
   relance:function(){P.toast('Relance envoyée à '+own.first+' par e-mail et SMS',{icon:'send'})},
   rebill:function(){var l=rebillLines(h).filter(function(q){return !ST.rebill[q.id]}),s=l.reduce(function(a,q){return a+q.v},0);l.forEach(function(q){ST.rebill[q.id]=1});draw();P.toast(F.eur(s)+' ajoutés à la facture de décembre de '+own.first,{icon:'invoice',undo:function(){l.forEach(function(q){delete ST.rebill[q.id]});draw()}})},
   camfull:function(){var c=body.querySelector('.fc-cam');if(c&&c.requestFullscreen){try{c.requestFullscreen()}catch(e){}}P.toast('Caméra du box '+h.box+' en plein écran',{icon:'expand'})},
   camclip:function(){P.toast('Extrait de 30 secondes enregistré dans le journal de '+h.name,{icon:'rec'})},camtalk:function(){P.toast('Micro ouvert sur le haut-parleur du box '+h.box,{icon:'mic'})},
   cams:function(){goOr('cameras',{},'Le mur de caméras s’ouvre dans l’écran Caméras')},clip:function(){P.toast('Lecture de l’extrait dans la vignette',{icon:'play'})}};
  on(el,'[data-act]',function(b){var f=ACT[b.getAttribute('data-act')];if(f)f(b)});
 }});

/* =====================================================================
   5. Soins du cheptel
   ===================================================================== */
var SO={tab:'cal',hide:{},sel:{},rf:'all'};
function hm(t){if(!/^\d/.test(t||''))return t||'';var p=t.split(':');return (+p[0])+' h'+(p[1]!=='00'?' '+p[1]:'')}
function tourCost(t){var p=prat(t.pr);return t.horses.reduce(function(a,id){var h=D.horse(id);return a+(h?carePrice(h,t.key):0)},0)+p.trip}
function tourStatus(t){return t.status==='confirmé'?U.chip('Confirmé','ok',true):t.status==='en attente'?U.chip('En attente de réponse','warn',true):U.chip('Demande envoyée','acc',true)}
function calEvents(){var ev=[],grp={};
  D.tours.forEach(function(t){ev.push({date:t.date,time:t.time,kind:t.kind,label:t.kind+' · '+t.horses.length+' chevaux',tour:t.id})});
  D.care.forEach(function(c){if(RK.some(function(k){return RULES[k].k===c.kind})||c.status==='fait')return;ev.push({date:c.date,time:c.time,kind:c.kind,label:hname(c.horse)+(/^\d/.test(c.time)?' · '+hm(c.time):''),care:c.id})});
  D.horses.forEach(function(h){RK.forEach(function(k){if(tourOf(h,k))return;var n=dueN(h,k);if(n>36)return;var d=n<0?iso(0):due(h,k),key=d+k;
    if(!grp[key]){grp[key]={date:d,kind:RULES[k].k,key:k,todo:true,horses:[],late:false};ev.push(grp[key])}grp[key].horses.push(h.id);if(n<0)grp[key].late=true})});
  ev.forEach(function(e){if(e.todo)e.label=e.kind+' · '+(e.horses.length>1?e.horses.length+' chevaux':hname(e.horses[0]))});
  return ev.sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:(a.time||'99')<(b.time||'99')?-1:1})}
function evBtn(e,i){var c=KINDC[e.kind]||'var(--acc)';return '<button class="so-ev'+(e.todo?' todo':'')+(e.late?' late':'')+'" style="--c:'+c+'" data-ev="'+i+'" title="'+E(e.label)+(e.todo?' (à planifier)':'')+'"><i></i><span>'+E(e.label)+'</span></button>'}

function tabCal(){var ev=calEvents().filter(function(e){return !SO.hide[e.kind]}),kinds=Object.keys(KINDC),h='';
  SO._ev=ev;
  h+='<div class="card"><div class="ch" style="padding-bottom:12px"><div><h3>Novembre et décembre 2026</h3><div class="xs mut">Plein : rendez-vous pris. Contour : échéance à planifier.</div></div><button class="btn ghost sm" data-act="ics">'+ICON('link','sm')+'<span class="hide-s">S’abonner au calendrier</span></button></div>'+
    '<div class="scroll-x" style="padding:0 16px 12px"><div class="lb-tags">'+kinds.map(function(k){return '<button class="tag" data-manual data-kf="'+k+'" aria-pressed="'+(!SO.hide[k])+'"><i style="width:7px;height:7px;border-radius:50%;background:'+KINDC[k]+'"></i>'+k+'</button>'}).join('')+'</div></div>';
  h+='<div class="so-cal">'+['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(function(d){return '<div class="dh">'+d+'</div>'}).join('');
  for(var i=-1;i<34;i++){var d=iso(i),dt=D.day(i),l=ev.map(function(e,k){return [e,k]}).filter(function(p){return p[0].date===d});
    h+='<div class="so-cd'+(i<0?' past':'')+(i===0?' today':'')+'"><div class="n"><span>'+dt.getDate()+(dt.getDate()===1||i===-1?' '+['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'][dt.getMonth()]:'')+'</span></div>'+l.slice(0,3).map(function(p){return evBtn(p[0],p[1])}).join('')+(l.length>3?'<button class="so-ev todo" style="--c:var(--mut)" data-more="'+d+'"><span>'+(l.length-3)+' de plus</span></button>':'')+'</div>'}
  h+='</div><div class="so-ag">';
  var last='';ev.filter(function(e){return F.days(e.date)<34}).forEach(function(e){var k=ev.indexOf(e);if(e.date!==last){last=e.date;h+='<div class="so-agd"><span>'+(F.days(e.date)===0?'Aujourd’hui':F.dateL(e.date))+'</span></div>'}
    h+='<div class="lb-row click" data-ev="'+k+'">'+'<span class="lb-sq sm" style="background:color-mix(in srgb,'+KINDC[e.kind]+' 14%,var(--surface));color:'+KINDC[e.kind]+'">'+ICON(KINDI[e.kind]||'care','sm')+'</span><div class="grow"><div class="t ellip">'+E(e.label)+'</div><div class="s">'+(e.todo?(e.late?'En retard, à planifier':'Échéance à planifier'):e.tour?hm(e.time)+' · '+prat(D.tours.find(function(t){return t.id===e.tour}).pr).short:'Rendez-vous pris')+'</div></div>'+(e.todo?U.chip(e.late?'En retard':'À planifier',e.late?'bad':'line'):U.chip('Planifié','ok',true))+'</div>'});
  return h+'</div></div>'}

function reminderRows(){var rows=[];D.horses.forEach(function(h){RK.forEach(function(k){var n=dueN(h,k);if(n<=30)rows.push({id:h.id+':'+k,h:h,k:k,n:n,t:tourOf(h,k)})})});return rows.sort(function(a,b){return a.n-b.n})}
function tabRem(){var rows=reminderRows().filter(function(r){return SO.rf==='all'||r.k===SO.rf}),nsel=Object.keys(SO.sel).filter(function(k){return SO.sel[k]}).length;
  var h='<div class="stack" style="--g:14px"><div class="so-rules rise">'+RK.map(function(k){var R=RULES[k],n=D.horses.filter(function(x){return dueN(x,k)<=30}).length;
    return '<div class="card so-rule">'+sq(R.icon)+'<b class="grow">'+R.l+'</b>'+U.tog(R.off!==true,'so-r-'+k)+'<p class="s mut" style="grid-column:1/-1;min-height:54px">'+R.rule+'</p><div class="hrow sp ft" style="width:100%"><span class="xs mut"><b style="color:var(--ink)">'+n+'</b> dans les 30 jours</span><button class="btn ghost sm" data-rule="'+k+'">Régler</button></div></div>'}).join('')+'</div>';
  h+='<div class="card"><div class="ch" style="padding-bottom:12px"><div><h3>Rappels des 30 prochains jours</h3><div class="xs mut">Cochez des chevaux pour les regrouper dans une même tournée.</div></div><span class="chip">'+rows.length+' rappels</span></div>'+
    '<div class="scroll-x" style="padding:0 16px 10px"><div class="lb-tags"><button class="tag" data-manual data-rf="all" aria-pressed="'+(SO.rf==='all')+'">Tous</button>'+RK.map(function(k){return '<button class="tag" data-manual data-rf="'+k+'" aria-pressed="'+(SO.rf===k)+'">'+RULES[k].l+'</button>'}).join('')+'</div></div>'+
    T([{l:'',w:'36px',f:function(r){return r.t?'<span class="lb-sq sm ok" title="Déjà en tournée">'+ICON('check','sm')+'</span>':'<button class="chk" role="checkbox" data-manual aria-checked="'+(SO.sel[r.id]?'true':'false')+'" data-sel="'+r.id+'" title="Sélectionner"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>'}},
      {l:'Cheval',f:function(r){return '<div class="hrow" data-go="cheval" data-id="'+r.h.id+'" data-p-tab="sante" style="cursor:pointer">'+U.hav(r.h,'sm')+'<div style="min-width:0"><div class="b ellip">'+E(r.h.name)+'</div><div class="xs mut only-s">'+RULES[r.k].l+'</div></div></div>'}},
      {l:'Soin',hide:true,f:function(r){return '<span class="hrow" style="--g:7px"><i style="width:7px;height:7px;border-radius:50%;background:'+RULES[r.k].c+'"></i>'+RULES[r.k].l+'</span>'}},
      {l:'Dernier',hide:true,f:function(r){return '<span class="num mut">'+F.dateY(r.h[r.k])+'</span>'}},
      {l:'Échéance',f:function(r){return '<span class="num b '+(r.n<0?'badc':r.n<=7?'warnc':'')+'">'+F.date(due(r.h,r.k))+'</span><div class="xs mut">'+dueTxt(r.n)+'</div>'}},
      {l:'Suite',f:function(r){return r.t?'<span class="chip ok dot">Tournée du '+F.date(r.t.date)+'</span>':r.n<=0?U.chip('À faire','warn',true):U.chip('À planifier','line')}},
      {l:'Propriétaire',hide:true,f:function(r){return r.h.owner?'<span class="hrow" style="--g:7px">'+U.av(r.h.owner,'sm')+'<span class="xs mut">prévenu'+(D.member(r.h.owner).first.slice(-1)==='e'?'e':'')+' par notification</span></span>':'<span class="xs mut">Cheval de club</span>'}}],rows,{card:false})+'</div>';
  if(nsel)h+='<div class="lb-sel"><b class="grow">'+nsel+' cheva'+(nsel>1?'ux sélectionnés':'l sélectionné')+'</b><button class="btn ghost sm" style="color:var(--navy-ink)" data-act="unsel">Tout décocher</button><button class="btn sm pri" data-act="seltour">'+ICON('route','sm')+'Créer une tournée</button></div>';
  return h+'</div>'}

function suggestions(){var o=[];RK.forEach(function(k){var l=D.horses.filter(function(h){var n=dueN(h,k);return !tourOf(h,k)&&n<=RULES[k].soon+16}).sort(function(a,b){return dueN(a,k)-dueN(b,k)});if(l.length>=2)o.push({k:k,l:l})});return o}
function tabTours(){var sg=suggestions();
  return '<div class="fc-cols rise"><div class="stack" style="--g:14px">'+D.tours.slice().sort(function(a,b){return a.date<b.date?-1:1}).map(function(t){var p=prat(t.pr),c=KINDC[t.kind];
    return '<div class="card so-tour"><div class="hrow" style="align-items:flex-start"><span class="lb-sq" style="background:color-mix(in srgb,'+c+' 14%,var(--surface));color:'+c+'">'+ICON(KINDI[t.kind],'')+'</span><div class="grow"><div class="hrow wrap" style="--g:8px"><b class="l disp">'+t.kind+' · '+p.short+'</b>'+tourStatus(t)+'</div><div class="s mut" style="margin-top:2px">'+F.dateL(t.date).replace(/^./,function(c){return c.toUpperCase()})+' à '+hm(t.time)+' · '+E(t.note)+'</div></div></div>'+
      '<div class="hrow wrap" style="--g:6px">'+t.horses.map(function(id){var h=D.horse(id);return '<span class="chip lg" data-go="cheval" data-id="'+id+'" style="cursor:pointer;padding-left:4px">'+U.hav(h,'sm')+E(h.name)+'</span>'}).join('')+'</div>'+
      '<div class="hrow wrap sp"><span class="s mut">'+t.horses.length+' chevaux · estimation <b style="color:var(--ink)" class="num">'+F.eur(tourCost(t))+'</b>'+(p.trip?' dont '+F.eur(p.trip)+' de déplacement partagé':'')+'</span><div class="hrow" style="--g:6px">'+(t.status!=='confirmé'?'<button class="btn ghost sm" data-nudge="'+t.id+'">'+ICON('send','sm')+'Relancer</button>':'')+'<button class="btn sm" data-tour="'+t.id+'">Ouvrir la tournée</button></div></div></div>'}).join('')+'</div>'+
   '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>Regroupements proposés</h3>'+ICON('assistant')+'</div><div style="padding:6px 0 4px">'+(sg.length?sg.map(function(s){var R=RULES[s.k],p=R.who==='eq'?null:prat(R.who),save=p?p.trip*(s.l.length-1):0;
      return '<div class="lb-row" style="align-items:flex-start">'+sq(R.icon,'','sm')+'<div class="grow"><div class="t">'+R.l+' : '+s.l.length+' chevaux à regrouper</div><div class="s">'+s.l.slice(0,3).map(function(h){return h.name}).join(', ')+(s.l.length>3?' et '+(s.l.length-3)+' autres':'')+' · échéances du '+F.date(due(s.l[0],s.k))+' au '+F.date(due(s.l[s.l.length-1],s.k))+'</div>'+(save?'<div class="xs okc b" style="margin-top:3px">'+F.eur(save)+' de déplacements économisés</div>':'')+'<button class="btn sm" style="margin-top:8px" data-newtour="'+s.k+'">Préparer la demande</button></div></div>'}).join(''):U.empty('checkc','Tout est déjà regroupé','Aucun soin isolé dans les semaines qui viennent.'))+'</div></div>'+
    '<div class="card"><div class="ch"><h3>Praticiens</h3><button class="btn ghost sm" data-act="addprat">'+ICON('plus','sm')+'Ajouter</button></div><div style="padding:6px 0 4px">'+D.practitioners.map(function(p){return '<div class="lb-row">'+sq(KINDI[p.kinds[0]],'mut','sm')+'<div class="grow"><div class="t ellip">'+p.name+'</div><div class="s ellip">'+p.job+' · '+p.days.toLowerCase()+'</div></div><button class="btn ghost icon sm" data-call="'+p.id+'" title="Appeler '+p.name+'">'+ICON('phone','sm')+'</button></div>'}).join('')+'</div>'+
     '<div class="cf"><span class="xs mut">Chaque praticien reçoit un lien invité : il voit la liste, coche ses passages et dépose ses comptes rendus sans créer de compte.</span></div></div></div></div>'}

function expChip(p){var n=F.days(p.exp);return n<0?U.chip('Périmé depuis '+(-n)+' j','bad',true):n<=60?U.chip('Périme dans '+n+' j','warn',true):'<span class="num">'+F.dateY(p.exp)+'</span>'}
function tabPharma(){var ph=D.pharmacy,exp=ph.filter(function(p){return F.days(p.exp)<0}).length,low=ph.filter(function(p){return p.qty<p.min}).length;
  return '<div class="fc-cols rise"><div class="stack" style="--g:14px">'+((exp||low)?'<div class="note warn">'+ICON('alert','sm')+'<span>'+(exp?'<b>'+exp+' produit périmé</b> à sortir de l’armoire. ':'')+(low?'<b>'+low+' produit sous le seuil</b> : les vermifuges manquent pour la prochaine série.':'')+'</span></div>':'')+
    '<div class="card"><div class="ch" style="padding-bottom:12px"><div><h3>Pharmacie de l’écurie</h3><div class="xs mut">Armoire fermée à clé, sellerie · '+ph.length+' produits suivis par lot</div></div><button class="btn sm" data-act="addmed">'+ICON('scan','sm')+'<span class="hide-s">Scanner une boîte</span></button></div>'+
    T([{l:'Médicament',f:function(p){return '<div style="max-width:clamp(180px,24cqw,300px)"><div class="b ellip">'+p.name+'</div><div class="xs mut ellip">'+p.form+' · '+p.use+'</div><div class="xs mut ellip" style="margin-top:2px">Lot <span class="mono" style="font-size:11px">'+p.lot+'</span> · '+(p.rx?'sur ordonnance':'vente libre')+(p.wait==='Aucun'?'':' · attente : '+p.wait.toLowerCase())+'</div></div>'}},
       {l:'Stock',f:function(p){return '<span class="num b '+(p.qty<p.min?'warnc':'')+'">'+p.qty+'</span> <span class="xs mut">'+p.unit+'</span>'}},
       {l:'Péremption',f:expChip},
       {l:'',f:function(p){return F.days(p.exp)<0?'<button class="btn sm danger" data-drop="'+p.id+'">Retirer</button>':'<button class="btn sm" data-give="'+p.id+'">Administrer</button>'}}],ph,{card:false})+'</div></div>'+
   '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>Registre sanitaire</h3>'+U.chip('À jour','ok',true)+'</div><div style="padding:6px 0 4px">'+D.register.slice(0,6).map(function(r){return '<div class="lb-row" style="align-items:flex-start">'+U.hav(r.horse,'sm')+'<div class="grow"><div class="t ellip">'+hname(r.horse)+' · '+r.prod+'</div><div class="s">'+r.dose+'</div><div class="xs mut" style="margin-top:2px">'+F.rel(r.date)+' à '+hm(r.time)+' · '+r.by+' · lot <span class="mono" style="font-size:11px">'+r.lot+'</span></div></div></div>'}).join('')+'</div>'+
     '<div class="cf" style="flex-wrap:wrap"><button class="btn sm" data-act="regexp">'+ICON('download','sm')+'Exporter le trimestre</button><button class="btn ghost sm" data-act="regall">Tout le registre</button></div></div>'+
    '<div class="card"><div class="ch"><h3>Obligations sanitaires</h3></div><div style="padding:6px 0 4px">'+
     '<div class="lb-row">'+sq('checkc','ok','sm')+'<div class="grow"><div class="t">Vétérinaire sanitaire déclaré</div><div class="s">Dr Antoine Leclerc, déclaré à la DDPP des Yvelines</div></div></div>'+
     '<div class="lb-row">'+sq('checkc','ok','sm')+'<div class="grow"><div class="t">Registre du 3e trimestre clos</div><div class="s">Archivé le 30 septembre, conservé 5 ans, non modifiable</div></div></div>'+
     '<div class="lb-row">'+sq('clock','warn','sm')+'<div class="grow"><div class="t">Visite sanitaire obligatoire</div><div class="s">Tous les 2 ans. Prochaine avant le 14 mars 2027</div></div><button class="btn ghost sm" data-act="visit">Planifier</button></div>'+
     '<div class="lb-row">'+sq('checkc','ok','sm')+'<div class="grow"><div class="t">Lieu de détention déclaré au SIRE</div><div class="s">Détenteur n° 78 512 004, 40 équidés présents</div></div></div></div></div></div></div>'}

function allRebill(){var l=[];D.horses.filter(function(h){return h.owner}).forEach(function(h){rebillLines(h).forEach(function(q){if(F.days(q.d)>=-21&&!ST.rebill[q.id])l.push({id:q.id,h:h,d:q.d,l:q.l,v:q.v})})});return l.sort(function(a,b){return a.d<b.d?1:-1})}
function tabRebill(){var l=allRebill(),sum=l.reduce(function(a,q){return a+q.v},0),owners={};if(SO.rb0==null)SO.rb0=sum+84;l.forEach(function(q){owners[q.h.owner]=1});
  return '<div class="fc-cols rise"><div class="card">'+(l.length?'<div class="ch" style="padding-bottom:12px"><div><h3>Soins à refacturer</h3><div class="xs mut">'+l.length+' lignes pour '+Object.keys(owners).length+' propriétaires, sur les 3 dernières semaines</div></div><button class="btn pri sm" data-act="rball">'+ICON('invoice','sm')+'Tout refacturer, '+F.eur(sum)+'</button></div>'+
    T([{l:'Cheval',f:function(q){return '<div class="hrow">'+U.hav(q.h,'sm')+'<div style="min-width:0"><div class="b ellip">'+E(q.h.name)+'</div><div class="xs mut ellip">'+D.name(q.h.owner)+'</div></div></div>'}},
       {l:'Soin',hide:true,f:function(q){return '<div style="max-width:210px"><div class="ellip">'+E(q.l)+'</div><div class="xs mut num">'+F.date(q.d)+'</div></div>'}},
       {l:'Montant',n:true,f:function(q){return '<b>'+F.eur(q.v)+'</b>'}},
       {l:'',f:function(q){return '<button class="btn sm" data-rb="'+q.id+'">Refacturer</button>'}}],l.slice(0,14),{card:false})+(l.length>14?'<div class="cf"><span class="xs mut">Et '+(l.length-14)+' autres lignes, comprises dans le total.</span></div>':''):
    U.empty('checkc','Tout est refacturé','Les prochains soins de propriétaires arriveront ici dès qu’ils seront validés.'))+'</div>'+
   '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>Règles de refacturation</h3></div><div class="list"><div class="li"><div class="grow"><div class="t">Refacturation automatique</div><div class="s">Chaque soin validé part sur la facture mensuelle du propriétaire</div></div>'+U.tog(true)+'</div>'+
     '<div class="li"><div class="grow"><div class="t">Partager le déplacement</div><div class="s">Divisé entre les chevaux de la tournée</div></div>'+U.tog(true)+'</div>'+
     '<div class="li"><div class="grow"><div class="t">Frais de gestion</div><div class="s">Ajoutés à chaque soin avancé par le club</div></div><span class="lb-step" data-step="fee" data-unit="%"><button type="button" data-d="-1" title="Diminuer">'+ICON('minus','sm')+'</button><output data-v="5">5 %</output><button type="button" data-d="1" title="Augmenter">'+ICON('plus','sm')+'</button></span></div>'+
     '<div class="li"><div class="grow"><div class="t">Joindre la facture du praticien</div><div class="s">Le propriétaire voit le justificatif</div></div>'+U.tog(true)+'</div></div></div>'+
    '<div class="card pad stack" style="--g:8px"><div class="eyebrow">Ce mois-ci</div><div class="hrow sp s"><span class="mut">Soins avancés par le club</span><b class="num">'+F.eur(SO.rb0)+'</b></div><div class="hrow sp s"><span class="mut">Déjà refacturés</span><b class="num">'+F.eur(SO.rb0-sum)+'</b></div><div class="hrow sp s"><span class="mut">Restent à refacturer</span><b class="num '+(sum?'warnc':'okc')+'">'+F.eur(sum)+'</b></div></div></div></div>'}

/* ---------- feuilles ---------- */
function tourSheet(t){var p=prat(t.pr),c=KINDC[t.kind],done={};
  var sh=P.sheet({title:t.kind+' · '+F.date(t.date),icon:KINDI[t.kind],wide:true,body:function(b){
    b.innerHTML='<div class="stack" style="--g:16px"><div class="card flat lb-row">'+sq(KINDI[t.kind])+'<div class="grow"><div class="t">'+p.name+'</div><div class="s">'+p.job+' · '+p.phone+'</div></div>'+tourStatus(t)+'</div>'+
     '<div class="g3" style="--g:10px"><div class="card soft" style="padding:12px"><div class="xs mut">Rendez-vous</div><b>'+F.dateL(t.date)+', '+hm(t.time)+'</b></div><div class="card soft" style="padding:12px"><div class="xs mut">Chevaux</div><b>'+t.horses.length+'</b></div><div class="card soft" style="padding:12px"><div class="xs mut">Estimation</div><b class="num">'+F.eur(tourCost(t))+'</b></div></div>'+
     '<div><div class="hrow sp" style="margin-bottom:8px"><div class="eyebrow">Ordre de passage</div><span class="xs mut" id="so-td">0 fait sur '+t.horses.length+'</span></div><div class="card flat">'+t.horses.map(function(id){var h=D.horse(id),n=dueN(h,t.key);
       return '<div class="lb-row">'+U.chk(false,id)+U.hav(h,'sm')+'<div class="grow"><div class="t ellip">'+E(h.name)+' <span class="mut" style="font-weight:500">· '+h.box+'</span></div><div class="s ellip">'+(t.key==='farrier'?(h.pony?'Parage':'Ferrure complète'):RULES[t.key].l)+' · '+(h.owner?'refacturé à '+D.name(h.owner):'à la charge du club')+'</div></div><span class="xs '+(n<0?'badc b':'mut')+' hide-s">'+(n<0?'en retard de '+(-n)+' j':'échéance '+F.date(due(h,t.key)))+'</span><b class="num s">'+F.eur(carePrice(h,t.key))+'</b></div>'}).join('')+'</div></div>'+
     '<div class="note">'+ICON('link','sm')+'<span>'+p.short+' ouvre cette liste sur son téléphone avec un lien invité. Les palefreniers reçoivent la tâche « préparer les chevaux » 30 minutes avant.</span></div></div>'},
   foot:'<button class="btn ghost" data-move>Reporter</button><button class="btn" data-remind>'+ICON('send','sm')+'Envoyer un rappel</button><button class="btn pri" data-done>'+ICON('check','sm')+'Valider la tournée</button>'});
  on(sh,'.chk',function(){setTimeout(function(){var n=P.$$('.chk[aria-checked="true"]',sh).length;sh.querySelector('#so-td').textContent=n+' fait'+(n>1?'s':'')+' sur '+t.horses.length},0)});
  sh.querySelector('[data-move]').onclick=function(){t.date=addDays(t.date,7);t.status='en attente';sh.close();P.rerender();P.toast('Tournée reportée au '+F.date(t.date)+'. '+p.short+' doit confirmer.',{icon:'calendar_add',undo:function(){t.date=addDays(t.date,-7);t.status='confirmé';P.rerender()}})};
  sh.querySelector('[data-remind]').onclick=function(){P.toast('Rappel envoyé à '+p.short+' par SMS avec la liste des '+t.horses.length+' chevaux',{icon:'send'})};
  sh.querySelector('[data-done]').onclick=function(){var ids=P.$$('.chk[aria-checked="true"]',sh).map(function(c){return c.getAttribute('data-id')});if(!ids.length)ids=t.horses.slice();
    var own=0;ids.forEach(function(id){var h=D.horse(id);h[t.key]=F.days(t.date)>0?iso(0):t.date;if(h.owner)own+=carePrice(h,t.key);delete XC[id]});
    t.horses=t.horses.filter(function(id){return ids.indexOf(id)<0});if(!t.horses.length)D.tours.splice(D.tours.indexOf(t),1);
    sh.close();P.rerender();P.toast(ids.length+' soins inscrits au registre'+(own?', '+F.eur(own)+' refacturés aux propriétaires':''),{icon:'checkc'})};
  return sh}

function newTourSheet(key,pre){var k=key||'farrier',picked={};
  function cands(){return D.horses.filter(function(h){return !tourOf(h,k)&&dueN(h,k)<=RULES[k].soon+30}).sort(function(a,b){return dueN(a,k)-dueN(b,k)}).slice(0,12)}
  var slot=0;
  var sh=P.sheet({title:'Planifier une tournée',icon:'route',wide:true,body:function(b){b.innerHTML='<div id="so-nt"></div>'},
   foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-send>'+ICON('send','sm')+'<span>Envoyer la demande</span></button>'});
  var box=sh.querySelector('#so-nt'),send=sh.querySelector('[data-send]');
  function slots(p){var base=k==='farrier'?[16,23]:k==='vacc'?[13,20]:k==='dentist'?[22,29]:k==='osteo'?[15,22]:[6,13];return [[iso(base[0]),'09:00'],[iso(base[1]),'09:00'],[iso(base[0]+1),'14:00']]}
  function init(){picked={};cands().forEach(function(h){if(pre?pre.indexOf(h.id)>=0:dueN(h,k)<=RULES[k].soon+14)picked[h.id]=1});if(pre)pre.forEach(function(id){picked[id]=1})}
  function draw(){var R=RULES[k],p=R.who==='eq'?{name:'Équipe d’écurie',short:'l’équipe',job:'Palefreniers soigneurs',trip:0,phone:''}:prat(R.who),l=cands();if(pre)pre.forEach(function(id){var h=D.horse(id);if(l.indexOf(h)<0)l.unshift(h)});
    var ids=Object.keys(picked).filter(function(i){return picked[i]}),sl=slots(p),cost=ids.reduce(function(a,id){return a+carePrice(D.horse(id),k)},0),own=ids.filter(function(id){return D.horse(id).owner}).length;
    box.innerHTML='<div class="stack" style="--g:18px"><div><div class="eyebrow" style="margin-bottom:8px">1. Le soin et le praticien</div><div class="so-prs">'+RK.map(function(q){var Rq=RULES[q],pq=Rq.who==='eq'?null:prat(Rq.who);return '<button class="so-pr" data-k="'+q+'" aria-pressed="'+(q===k)+'">'+sq(Rq.icon,q===k?'':'mut','sm')+'<span style="min-width:0"><b class="s ellip" style="display:block">'+Rq.l+'</b><span class="xs mut ellip" style="display:block">'+(pq?pq.name:'Équipe d’écurie')+'</span></span></button>'}).join('')+'</div></div>'+
     '<div><div class="eyebrow" style="margin-bottom:8px">2. Le créneau proposé</div><div class="scroll-x">'+U.seg(sl.map(function(s,i){return [String(i),F.dateL(s[0]).replace(/^(\w{3})\w*/,'$1.')+', '+hm(s[1])]}),String(slot),'data-slot')+'</div></div>'+
     '<div><div class="hrow sp" style="margin-bottom:6px"><div class="eyebrow">3. Les chevaux</div><span class="xs mut">'+ids.length+' sélectionnés sur '+l.length+' proposés</span></div><div class="card flat" style="padding:4px">'+(l.length?l.map(function(h){var n=dueN(h,k);
        return '<div class="so-pick" role="checkbox" aria-checked="'+(picked[h.id]?'true':'false')+'" data-pick="'+h.id+'"><span class="chk" aria-checked="'+(picked[h.id]?'true':'false')+'" style="pointer-events:none"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>'+U.hav(h,'sm')+'<div class="grow"><div class="b s ellip">'+E(h.name)+' <span class="mut" style="font-weight:500">· '+h.box+'</span></div><div class="xs mut ellip">'+(h.owner?D.name(h.owner):'Cheval de club')+'</div></div><span class="xs '+(n<0?'badc b':n<=RULES[k].soon?'warnc b':'mut')+'">'+dueTxt(n)+'</span></div>'}).join(''):U.empty('checkc','Aucun cheval à proposer','Tous les '+R.l.toLowerCase()+'s à venir sont déjà dans une tournée.'))+'</div></div>'+
     '<div class="g3" style="--g:10px"><div class="card soft" style="padding:12px"><div class="xs mut">Estimation</div><b class="num">'+F.eur(cost+(ids.length?p.trip:0))+'</b></div><div class="card soft" style="padding:12px"><div class="xs mut">Refacturé aux propriétaires</div><b class="num">'+own+' cheva'+(own>1?'ux':'l')+'</b></div><div class="card soft" style="padding:12px"><div class="xs mut">Déplacements économisés</div><b class="num okc">'+F.eur(p.trip*Math.max(0,ids.length-1))+'</b></div></div>'+
     '<div><div class="eyebrow" style="margin-bottom:8px">4. Le message envoyé</div><div class="so-msg">Bonjour'+(p.phone?' '+p.name.replace('Dr ','docteur ').split(' ')[0].replace('docteur','docteur Leclerc'):'')+',<br>Pouvez-vous passer à l’Écurie des Tilleuls le <b>'+F.dateL(sl[slot][0])+' à '+hm(sl[slot][1])+'</b> pour '+ids.length+' cheva'+(ids.length>1?'ux':'l')+' ('+R.l.toLowerCase()+') : '+ids.map(hname).join(', ')+' ? La liste détaillée et les carnets sont dans le lien ci-dessous. Merci, Claire Morel.</div></div></div>';
    send.disabled=!ids.length;send.querySelector('span').textContent=ids.length?'Envoyer la demande à '+p.short:'Choisissez au moins un cheval'}
  init();draw();
  on(sh,'[data-k]',function(b){k=b.getAttribute('data-k');pre=null;slot=0;init();draw()});
  on(sh,'[data-slot]',function(b){slot=+b.getAttribute('data-slot');draw()});
  on(sh,'[data-pick]',function(b){var id=b.getAttribute('data-pick');picked[id]=!picked[id];draw()});
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
  send.onclick=function(){var R=RULES[k],ids=Object.keys(picked).filter(function(i){return picked[i]}),p=R.who==='eq'?null:prat(R.who),sl=slots(p)[slot];
    var t={id:'t'+Date.now(),pr:p?p.id:'p1',kind:R.k,key:k,date:sl[0],time:sl[1],horses:ids,status:p?'demande envoyée':'confirmé',note:'Demande envoyée aujourd’hui à 9 h 41.'};D.tours.push(t);SO.sel={};SO.tab='tours';
    sh.close();P.rerender();P.toast('Demande envoyée'+(p?' à '+p.short:' à l’équipe')+' pour '+ids.length+' chevaux, le '+F.date(sl[0]),{icon:'send',undo:function(){D.tours.splice(D.tours.indexOf(t),1);P.rerender()}})};
  return sh}

function ruleSheet(k){var R=RULES[k],wk=k==='farrier',v=wk?Math.round(R.every/7):Math.round(R.every/30.4),unit=wk?'sem.':'mois';
  var extra={vacc:['Bloquer l’engagement en concours','Si le vaccin grippe n’est plus valable le jour de l’épreuve'],worm:['Coproscopie avant chaque vermifuge','Pas de traitement sous 200 œufs par gramme'],farrier:['Tenir compte du type de ferrure','Parage des poneys toutes les 8 semaines'],dentist:['Contrôle deux fois par an après 18 ans','Chevaux âgés'],osteo:['Proposer un bilan après un arrêt','Dès 10 jours de repos prescrit']}[k];
  var sh=P.sheet({title:'Rappel · '+R.l,icon:R.icon,body:'<div class="stack" style="--g:16px"><p class="s mut">'+R.rule+'</p><div class="card flat list"><div class="li"><div class="grow"><div class="t">Fréquence</div><div class="s">Calculée depuis le dernier passage de chaque cheval</div></div><span class="lb-step" data-step="ev" data-unit="'+unit+'"><button type="button" data-d="-1" title="Diminuer">'+ICON('minus','sm')+'</button><output data-v="'+v+'">'+v+' '+unit+'</output><button type="button" data-d="1" title="Augmenter">'+ICON('plus','sm')+'</button></span></div>'+
    '<div class="li"><div class="grow"><div class="t">Prévenir à l’avance</div><div class="s">Rappel sur l’accueil et dans la tournée</div></div><span class="lb-step" data-step="so" data-unit="j"><button type="button" data-d="-1" title="Diminuer">'+ICON('minus','sm')+'</button><output data-v="'+R.soon+'">'+R.soon+' j</output><button type="button" data-d="1" title="Augmenter">'+ICON('plus','sm')+'</button></span></div>'+
    '<div class="li"><div class="grow"><div class="t">'+extra[0]+'</div><div class="s">'+extra[1]+'</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">Prévenir le propriétaire</div><div class="s">Notification, puis SMS 3 jours avant</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">Créer la tâche pour l’équipe</div><div class="s">« Préparer le cheval » le jour du passage</div></div>'+U.tog(true)+'</div></div></div>',
   foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-save>Enregistrer la règle</button>'});
  var soon=R.soon;bindSteppers(sh,1,unit,function(id,val){if(id==='ev')v=Math.max(1,val);else soon=val});
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
  sh.querySelector('[data-save]').onclick=function(){R.every=wk?v*7:Math.round(v*30.4);R.soon=soon;if(wk)R.rule='Toutes les 6 à 8 semaines, '+v+' semaines par défaut.';sh.close();P.rerender();P.toast('Règle « '+R.l+' » enregistrée. Les échéances des 40 chevaux sont recalculées.',{icon:'checkc'})}}

function giveSheet(ph){var sick=D.horses.filter(function(h){return h.status!=='ok'}).concat(D.horses.filter(function(h){return h.status==='ok'}));
  var sh=P.sheet({title:'Administrer un médicament',icon:'pill',body:'<div class="stack" style="--g:14px"><div class="card flat lb-row">'+sq('pill')+'<div class="grow"><div class="t">'+ph.name+'</div><div class="s">Lot <span class="mono">'+ph.lot+'</span> · reste '+ph.qty+' '+ph.unit+'</div></div></div>'+
    '<label class="field"><span>Cheval</span><select class="in" id="so-gh">'+sick.map(function(h){return '<option value="'+h.id+'">'+E(h.name)+' · '+h.box+(h.alerts[0]?' · '+E(h.alerts[0]):'')+'</option>'}).join('')+'</select></label>'+
    '<div class="g2" style="--g:12px"><label class="field"><span>Dose</span><input class="in" id="so-gd" value="1 '+ph.unit.replace(/s$/,'')+'"></label><label class="field"><span>Administré par</span><select class="in" id="so-gb"><option>Claire Morel</option><option>Mamadou Diallo</option><option>Lucie Petit</option></select></label></div>'+
    (ph.rx?'<label class="field"><span>Ordonnance</span><select class="in"><option>ORD-2026-0411 · Dr Leclerc, '+F.date(iso(-2))+'</option><option>ORD-2026-0418 · Dr Leclerc, aujourd’hui</option><option>Photographier une nouvelle ordonnance</option></select></label>':'')+
    '<div class="note '+(ph.wait==='Aucun'?'':'warn')+'">'+ICON('info','sm')+'<span>Délai d’attente : <b>'+ph.wait+'</b>. L’écriture est datée, signée et ne peut plus être modifiée.</span></div></div>',
   foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-save>'+ICON('check','sm')+'Inscrire au registre</button>'});
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
  sh.querySelector('[data-save]').onclick=function(){var id=sh.querySelector('#so-gh').value;ph.qty=Math.max(0,ph.qty-1);D.register.unshift({id:'r'+Date.now(),date:iso(0),time:'09:41',horse:id,prod:ph.name,lot:ph.lot,dose:sh.querySelector('#so-gd').value,by:sh.querySelector('#so-gb').value,rx:'ORD-2026-0411',wait:ph.wait,why:''});
    sh.close();P.rerender();P.toast(ph.name+' inscrit au registre pour '+hname(id)+'. Stock : '+ph.qty+' '+ph.unit+'.',{icon:'checkc'})}}

function careEvSheet(c){var h=D.horse(c.horse),sh=P.sheet({title:c.kind+' · '+h.name,icon:KINDI[c.kind]||'care',body:'<div class="stack" style="--g:14px"><div class="card flat lb-row click" data-open>'+U.hav(h)+'<div class="grow"><div class="t">'+E(h.name)+'</div><div class="s">'+h.box+' · '+(h.alerts[0]?E(h.alerts[0]):h.breed)+'</div></div>'+ICON('right','sm')+'</div>'+
   '<dl class="lb-dl" style="margin:0"><div><dt>Quand</dt><dd>'+F.rel(c.date)+', '+hm(c.time)+'</dd></div><div><dt>Avec</dt><dd>'+E(c.who)+'</dd></div><div><dt>État</dt><dd>'+U.status(c.status)+'</dd></div><div><dt>Propriétaire</dt><dd>'+ownerLine(h)+'</dd></div></dl><div class="note">'+ICON('info','sm')+'<span>'+E(c.note)+'.</span></div></div>',
   foot:'<button class="btn" data-open>Ouvrir la fiche</button><button class="btn pri" data-done>'+ICON('check','sm')+'Marquer comme fait</button>'});
  on(sh,'[data-open]',function(){P.go('cheval',{id:h.id,tab:'sante'})});
  sh.querySelector('[data-done]').onclick=function(){c.status='fait';sh.close();P.rerender();P.toast(c.kind+' de '+h.name+' noté comme fait et inscrit au registre',{icon:'checkc',undo:function(){c.status='planifié';P.rerender()}})}}

P.mod({id:'soins',role:'gerant',group:'Écurie',title:'Soins',icon:'care',n:40,
 badge:function(){var n=D.care.filter(function(c){return F.days(c.date)===0&&c.status!=='fait'}).length;return n?{v:n}:null},
 render:function(el,ctx){
  if(ctx.params.tab){SO.tab=ctx.params.tab;ctx.params.tab=null}
  var today=D.care.filter(function(c){return F.days(c.date)===0&&c.status!=='fait'}),late=[];D.horses.forEach(function(h){RK.forEach(function(k){if(dueN(h,k)<0)late.push([h,k])})});
  var d30=reminderRows(),inT=d30.filter(function(r){return r.t}).length,rb=allRebill(),rbs=rb.reduce(function(a,q){return a+q.v},0),vet=today.find(function(c){return c.kind==='Vétérinaire'});
  el.innerHTML=LPH('Soins','Calendrier sanitaire des '+D.horses.length+' chevaux · rappels, tournées, pharmacie et registre',
     '<button class="btn" data-act="regexp">'+ICON('download','sm')+'<span class="hide-s">Registre sanitaire</span><span class="only-s">Registre</span></button><button class="btn pri" data-newtour="">'+ICON('route','sm')+'Planifier une tournée</button>')+
   '<div class="stack" style="--g:14px"><div class="lb-kpis rise">'+
    kpi('Aujourd’hui','calendar_add',cnt(today.length)+'<small>soins</small>',vet?vet.who+' à '+hm(vet.time)+' pour '+hname(vet.horse):'Aucun rendez-vous extérieur')+
    kpi('En retard','alert',cnt(late.length),late.length?late.map(function(a){return a[0].name}).join(', ')+' · déjà en tournée':'Aucun soin en retard')+
    kpi('Dans les 30 jours','bell',cnt(d30.length)+'<small>rappels</small>',inT+' déjà regroupés en tournée')+
    kpi('À refacturer','euro',cnt(rbs,'eur'),rb.length+' soins de propriétaires')+'</div>'+
   '<div class="scroll-x">'+U.seg([['cal','Calendrier'],['rem','Rappels'],['tours','Tournées'],['pharma','Pharmacie et registre'],['rebill','Refacturation']],SO.tab,'data-st')+'</div><div id="so-body"></div></div>';
  var body=el.querySelector('#so-body');
  function draw(){body.innerHTML=({cal:tabCal,rem:tabRem,tours:tabTours,pharma:tabPharma,rebill:tabRebill}[SO.tab]||tabCal)();P.animate(body)}
  draw();
  on(el,'[data-st]',function(b){SO.tab=b.getAttribute('data-st');draw()});
  on(el,'[data-kf]',function(b){var k=b.getAttribute('data-kf');SO.hide[k]=!SO.hide[k];draw()});
  on(el,'[data-rf]',function(b){SO.rf=b.getAttribute('data-rf');draw()});
  on(el,'[data-ev]',function(b){var e=SO._ev[+b.getAttribute('data-ev')];if(!e)return;if(e.tour)tourSheet(D.tours.find(function(t){return t.id===e.tour}));else if(e.care)careEvSheet(D.care.find(function(c){return c.id===e.care}));else newTourSheet(e.key,e.horses)});
  on(el,'[data-more]',function(b){var d=b.getAttribute('data-more'),l=SO._ev.filter(function(e){return e.date===d});var sh=P.sheet({title:F.dateL(d).replace(/^./,function(c){return c.toUpperCase()}),icon:'planning',body:'<div class="card flat">'+l.map(function(e){return '<div class="lb-row click" data-ev2="'+SO._ev.indexOf(e)+'"><span class="lb-sq sm" style="background:color-mix(in srgb,'+KINDC[e.kind]+' 14%,var(--surface));color:'+KINDC[e.kind]+'">'+ICON(KINDI[e.kind],'sm')+'</span><div class="grow t ellip">'+E(e.label)+'</div>'+(e.todo?U.chip('À planifier','line'):U.chip('Planifié','ok',true))+'</div>'}).join('')+'</div>'});
    on(sh,'[data-ev2]',function(r){var e=SO._ev[+r.getAttribute('data-ev2')];if(e.tour)tourSheet(D.tours.find(function(t){return t.id===e.tour}));else if(e.care)careEvSheet(D.care.find(function(c){return c.id===e.care}));else newTourSheet(e.key,e.horses)})});
  on(el,'[data-sel]',function(b){var id=b.getAttribute('data-sel');SO.sel[id]=!SO.sel[id];draw()});
  on(el,'[data-rule]',function(b){ruleSheet(b.getAttribute('data-rule'))});
  on(el,'[id^="so-r-"]',function(b){var k=b.id.slice(5);setTimeout(function(){var onn=b.getAttribute('aria-checked')==='true';RULES[k].off=!onn;P.toast('Rappels « '+RULES[k].l+' » '+(onn?'réactivés':'mis en pause'),{icon:onn?'bell':'pause'})},0)});
  on(el,'[data-newtour]',function(b){newTourSheet(b.getAttribute('data-newtour')||'farrier')});
  on(el,'[data-tour]',function(b){tourSheet(D.tours.find(function(t){return t.id===b.getAttribute('data-tour')}))});
  on(el,'[data-nudge]',function(b){var t=D.tours.find(function(q){return q.id===b.getAttribute('data-nudge')});P.toast('Relance envoyée à '+prat(t.pr).short+' par SMS',{icon:'send'})});
  on(el,'[data-call]',function(b){var p=prat(b.getAttribute('data-call'));P.toast('Appel de '+p.name+' au '+p.phone,{icon:'phone'})});
  on(el,'[data-give]',function(b){giveSheet(D.pharmacy.find(function(p){return p.id===b.getAttribute('data-give')}))});
  on(el,'[data-drop]',function(b){var p=D.pharmacy.find(function(q){return q.id===b.getAttribute('data-drop')}),i=D.pharmacy.indexOf(p);D.pharmacy.splice(i,1);draw();P.toast(p.name+' retiré de la pharmacie, à rapporter au vétérinaire',{icon:'trash',undo:function(){D.pharmacy.splice(i,0,p);draw()}})});
  on(el,'[data-rb]',function(b){var id=b.getAttribute('data-rb'),q=allRebill().find(function(a){return a.id===id});ST.rebill[id]=1;draw();P.toast(F.eur(q.v)+' ajoutés à la facture de décembre de '+D.name(q.h.owner),{icon:'invoice',undo:function(){delete ST.rebill[id];draw()}})});
  bindSteppers(el,1,'%');
  var ACT={
   ics:function(){P.toast('Lien du calendrier copié : les soins s’affichent dans votre agenda',{icon:'link'})},
   unsel:function(){SO.sel={};draw()},
   seltour:function(){var ids=Object.keys(SO.sel).filter(function(k){return SO.sel[k]}),k=ids[0].split(':')[1];newTourSheet(k,ids.filter(function(i){return i.split(':')[1]===k}).map(function(i){return i.split(':')[0]}))},
   addprat:function(){P.toast('Invitation prête : envoyez le lien invité au praticien par SMS',{icon:'link'})},
   addmed:function(){P.toast('Boîte reconnue : Phénylbutazone 1 g, lot PB26-1104, péremption 06/2028. Ajoutée au stock.',{icon:'scan'})},
   regexp:function(){P.toast('Registre sanitaire du 4e trimestre exporté en PDF horodaté',{icon:'download'})},
   regall:function(){P.sheet({title:'Registre sanitaire',icon:'doc',wide:true,body:T([{l:'Date',f:function(r){return '<span class="num">'+F.date(r.date)+', '+hm(r.time)+'</span>'}},{l:'Cheval',f:function(r){return '<b>'+hname(r.horse)+'</b>'}},{l:'Médicament',f:function(r){return r.prod+'<div class="xs mut">'+r.dose+'</div>'}},{l:'Lot',hide:true,f:function(r){return '<span class="mono">'+r.lot+'</span>'}},{l:'Ordonnance',hide:true,f:function(r){return '<span class="mono">'+r.rx+'</span>'}},{l:'Par',hide:true,k:'by'},{l:'Délai d’attente',hide:true,k:'wait'}],D.register,{card:false})})},
   visit:function(){P.toast('Demande de visite sanitaire envoyée au Dr Leclerc pour février 2027',{icon:'send'})},
   rball:function(){var l=allRebill(),s=l.reduce(function(a,q){return a+q.v},0);l.forEach(function(q){ST.rebill[q.id]=1});P.rerender();P.toast(l.length+' soins refacturés pour '+F.eur(s)+', sur les factures de décembre',{icon:'invoice',undo:function(){l.forEach(function(q){delete ST.rebill[q.id]});P.rerender()}})}};
  on(el,'[data-act]',function(b){var f=ACT[b.getAttribute('data-act')];if(f)f(b)});
 }});

/* =====================================================================
   6. Alimentation
   ===================================================================== */
var AL={tab:'plan',meal:'midi',q:'',f:'all',init:false};
var MEALS=[['matin','Matin','7 h'],['midi','Midi','12 h'],['soir','Soir','18 h']];
function kg(v){return String(Math.round(v*10)/10).replace('.',',')}
function feedTotals(){var t={hay:0,club:0,flake:0,cost:0,sup:0,ch:0,cg:0};D.horses.forEach(function(h){var f=feedDay(h);t.hay+=h.ration.hay;if(grainType(h)==='Floconnés')t.flake+=h.ration.grain;else t.club+=h.ration.grain;t.cost+=f.hay+f.grain+f.supp;t.ch+=f.hay;t.cg+=f.grain;t.sup+=f.supp});return t}
function stocks(){var t=feedTotals(),s1=D.stock.find(function(s){return s.id==='k1'}),s3=D.stock.find(function(s){return s.id==='k3'}),s6=D.stock.find(function(s){return s.id==='k6'}),oil=D.horses.filter(function(h){return h.ration.supp==='Huile de lin'}).length;
  var siloKg=Math.round(t.club*11/10)*10;
  return [
   {id:'k1',name:'Foin de prairie',icon:'hay',qty:s1.qty,unit:'balles rondes',min:s1.min,daily:s1.daily,detail:kg(t.hay)+' kg de rations ('+kg(t.hay/250)+' balle) et '+kg(Math.max(0,s1.daily-t.hay/250))+' balle dans les râteliers des prairies',supplier:s1.supplier,order:20,price:s1.price,lead:2},
   {id:'silo',name:'Granulés club',icon:'feed',qty:38,unit:'% du silo',min:25,daily:38/11,kgs:siloKg,detail:kg(t.club)+' kg par jour pour '+D.horses.filter(function(h){return grainType(h)!=='Floconnés'&&h.ration.grain>0}).length+' chevaux · capteur de niveau du silo',supplier:'Coopérative Agralys',order:3,orderU:'tonnes en vrac',price:420,lead:4,pct:true},
   {id:'k3',name:'Floconnés',icon:'bag',qty:s3.qty,unit:'sacs de 25 kg',min:s3.min,daily:Math.round(t.flake/25*100)/100,detail:kg(t.flake)+' kg par jour pour les '+D.horses.filter(function(h){return grainType(h)==='Floconnés'}).length+' chevaux de propriétaires',supplier:s3.supplier,order:30,price:s3.price,lead:3},
   {id:'k6',name:'Huile de lin',icon:'drop',qty:s6.qty,unit:'bidons de 5 litres',min:s6.min,daily:Math.round(oil*.05/5*100)/100,detail:oil+' chevaux à 50 ml par jour',supplier:s6.supplier,order:4,price:s6.price,lead:3}]}
function daysLeft(s){return s.daily>0?Math.floor(s.qty/s.daily):999}

function alPlan(){var q=norm(AL.q),FL=[['all','Tous',function(){return true}],['cheval','Chevaux',function(h){return !h.pony}],['poney','Poneys',function(h){return h.pony}],['cons','Avec consigne',function(h){return !!CONS[h.id]}],['med','Avec traitement',function(h){return !!MEDS[h.id]}]];
  var f=FL.find(function(a){return a[0]===AL.f})||FL[0],rows=D.horses.filter(f[2]).filter(function(h){return !q||norm(h.name+' '+h.box).indexOf(q)>=0});
  return '<div class="stack" style="--g:14px"><div class="lb-tools"><div class="search">'+ICON('search','sm')+'<input class="in" id="al-q" placeholder="Cheval ou box…" value="'+E(AL.q)+'" autocomplete="off"></div><div class="scroll-x grow"><div class="lb-tags">'+FL.map(function(a){return '<button class="tag" data-manual data-af="'+a[0]+'" aria-pressed="'+(AL.f===a[0])+'">'+a[1]+' <b>'+D.horses.filter(a[2]).length+'</b></button>'}).join('')+'</div></div></div>'+
   (rows.length?T([
    {l:'Cheval',f:function(h){return '<div class="hrow">'+U.hav(h,'sm')+'<div style="min-width:0"><div class="b ellip">'+E(h.name)+'</div><div class="xs mut">'+h.box+(MEDS[h.id]?' · <span class="badc b">traitement en cours</span>':'')+'</div></div></div>'}},
    {l:'Poids',hide:true,f:function(h){return '<span class="num">'+h.weight+' kg</span>'}},
    {l:'État',hide:true,f:function(h){var n=nec(h);return U.chip(kg(n)+' · '+necTxt(n),n<=2||n>=4?'warn':'')}},
    {l:'Foin',n:true,f:function(h){return '<b>'+kg(h.ration.hay)+'</b> <span class="xs mut">kg</span>'}},
    {l:'Granulés',n:true,f:function(h){return '<b>'+kg(h.ration.grain)+'</b> <span class="xs mut">kg</span><div class="xs mut hide-s">'+grainType(h)+'</div>'}},
    {l:'Complément',hide:true,f:function(h){return h.ration.supp==='Aucun'?'<span class="mut">Aucun</span>':h.ration.supp}},
    {l:'Consigne',hide:true,f:function(h){return CONS[h.id]?'<span class="ellip" style="display:inline-block;max-width:230px;vertical-align:bottom">'+E(CONS[h.id])+'</span>':'<span class="mut-2">Aucune</span>'}},
    {l:'Coût par jour',n:true,f:function(h){return '<b>'+F.eur(feedDayTot(h),true)+'</b>'}}],rows,{click:true}):'<div class="card">'+U.empty('feed','Aucune ration ne correspond','Essayez un autre nom ou un autre filtre.')+'</div>')+'</div>'}

function boxCard(h,meal){var m=meals(h)[meal],md=(MEDS[h.id]||{})[meal],fed=!!ST.fed[meal][h.id],none=!m.hay&&!m.grain&&!md;
  return '<button class="al-box" role="checkbox" aria-checked="'+fed+'" data-fed="'+h.id+'"><div class="hd"><span class="bx">'+h.box+'</span><b class="ellip">'+E(h.name)+'</b><span class="chk" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span></div>'+
   '<div class="qs"><div class="al-q"><small>Foin</small><b>'+(m.hay?kg(m.hay)+'<span>kg</span>':'<span style="margin:0">Rien</span>')+'</b></div><div class="al-q"><small>'+(grainType(h)==='Floconnés'?'Floconnés':'Granulés')+'</small><b>'+(m.grain?kg(m.grain)+'<span>kg</span>':'<span style="margin:0">Rien</span>')+'</b></div></div>'+
   (md?'<div class="al-fl med">'+ICON('pill','sm')+'<span>'+md+'</span></div>':'')+(m.supp?'<div class="al-fl">'+ICON('drop','sm')+'<span>'+m.supp+', '+SUPP[m.supp].dose+'</span></div>':'')+(CONS[h.id]?'<div class="al-fl">'+ICON('info','sm')+'<span>'+E(CONS[h.id])+'</span></div>':'')+'</button>'}
function alBoard(){var meal=AL.meal,list=D.horses.slice().sort(function(a,b){return a.box<b.box?-1:1}),n=list.filter(function(h){return ST.fed[meal][h.id]}).length,ml=MEALS.find(function(m){return m[0]===meal}),tot=list.reduce(function(a,h){var m=meals(h)[meal];a.h+=m.hay;a.g+=m.grain;return a},{h:0,g:0});
  return '<div class="stack" style="--g:14px"><div class="card pad stack" style="--g:12px"><div class="hrow wrap sp"><div class="hrow wrap" style="--g:10px">'+U.seg(MEALS.map(function(m){return [m[0],m[1]+' · '+m[2]]}),meal,'data-meal')+'<span class="s mut">'+(meal==='matin'?'Distribué à 7 h 12 par Mamadou':meal==='midi'?'Prochaine distribution, Lucie':'Ce soir, Mamadou')+'</span></div>'+
     '<div class="hrow wrap" style="--g:6px"><button class="btn sm" data-act="allfed">'+ICON('check','sm')+(n===list.length?'Tout décocher':'Tout cocher')+'</button><button class="btn sm" data-act="kiosk">'+ICON('expand','sm')+'<span class="hide-s">Écran de la sellerie</span></button><button class="btn sm dark" data-act="print">'+ICON('doc','sm')+'Imprimer</button></div></div>'+
    '<div class="hrow" style="--g:12px"><div class="grow">'+U.bar(n/list.length*100,n===list.length?'var(--ok)':'var(--acc)')+'</div><b class="s num" style="white-space:nowrap">'+n+' sur '+list.length+' boxes servis</b>'+(n===list.length?'<span class="strass" title="Distribution terminée"></span>':'')+'</div>'+
    '<div class="xs mut">À préparer pour ce repas : <b style="color:var(--ink)">'+kg(tot.h)+' kg de foin</b> (environ '+Math.ceil(tot.h/12)+' brouettes) et <b style="color:var(--ink)">'+kg(tot.g)+' kg de granulés</b>. Touchez un box quand il est servi.</div></div>'+
   '<div class="al-board">'+list.map(function(h){return boxCard(h,meal)}).join('')+'</div></div>'}

function stockChart(s,ordered){var v=[],lab=[],q=s.qty,minv=[];for(var d=0;d<=30;d+=2){var val=Math.max(0,s.qty-s.daily*d+(ordered&&d>=s.lead?(s.pct?45:s.order):0));v.push(Math.round(val*10)/10);minv.push(s.min);lab.push(d===0?'Auj.':d%6===0?F.date(iso(d)):'')}
  return C.line([{v:v,c:'var(--acc)',area:true},{v:minv,c:'var(--warn)',dash:true}],lab,{h:190,min:0,max:Math.max.apply(null,v)*1.15,fmt:function(x){return Math.round(x)}})}
function alStock(){var S=stocks(),t=feedTotals(),hay=S[0],top=D.horses.slice().sort(function(a,b){return feedDayTot(b)-feedDayTot(a)}).slice(0,5),m=30.4;
  return '<div class="stack rise" style="--g:14px"><div class="g4">'+S.map(function(s){var dl=daysLeft(s),under=s.qty<s.min,soon=Math.max(0,Math.floor((s.qty-s.min)/s.daily)),ord=ST.orders[s.id],st=under?'bad':soon<=7?'warn':'ok';
    return '<div class="card al-stock"><div class="hrow sp"><span class="hrow" style="--g:8px">'+sq(s.icon,st==='ok'?'':st,'sm')+'<b>'+s.name+'</b></span>'+(ord?U.chip('Commandé','acc',true):st==='ok'?U.chip('Suffisant','ok',true):st==='warn'?U.chip('À commander','warn',true):U.chip('Sous le seuil','bad',true))+'</div>'+
     '<div><div class="big">'+kg(s.qty)+'<small>'+s.unit+'</small></div><div class="s mut" style="margin-top:4px">Environ <b style="color:var(--ink)">'+dl+' jours</b>, jusqu’au '+F.date(iso(dl))+'</div></div>'+
     '<div class="lb-thr"><div class="bar" style="height:8px"><i style="--v:'+Math.min(100,s.qty/(s.pct?100:s.min*2.4)*100)+'%;--c:'+tone(st).replace('var(--ok)','var(--acc)')+'"></i></div><u style="left:'+(s.pct?s.min:100/2.4)+'%" title="Seuil d’alerte"></u></div>'+
     '<div class="xs mut" style="min-height:48px">'+s.detail+'.</div>'+
     (ord?'<div class="xs b acc">Livraison prévue le '+F.date(iso(s.lead))+', '+s.supplier+'</div>':'<button class="btn sm '+(st!=='ok'?'pri':'')+'" data-order="'+s.id+'">Commander '+s.order+' '+(s.orderU||s.unit.split(' ')[0])+'</button>')+'</div>'}).join('')+'</div>'+
   '<div class="fc-cols"><div class="card"><div class="ch"><div><h3>Prévision du stock de foin</h3><div class="xs mut">30 prochains jours, à '+kg(hay.daily)+' balles par jour · seuil d’alerte à '+hay.min+' balles</div></div>'+C.legend([['Stock prévu','var(--acc)'],['Seuil','var(--warn)']])+'</div><div class="cb">'+stockChart(hay,ST.orders.k1)+
      '<div class="note '+(ST.orders.k1?'ok':'warn')+'" style="margin-top:12px">'+ICON(ST.orders.k1?'checkc':'alert','sm')+'<span>'+(ST.orders.k1?'Commande de 20 balles en route : le stock repasse au-dessus du seuil jeudi.':'Le stock passe sous le seuil le <b>'+F.dateL(iso(Math.floor((hay.qty-hay.min)/hay.daily)))+'</b>. Fourrages du Hurepoix livre en 2 jours : commandez avant vendredi.')+'</span></div></div></div>'+
    '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><div><h3>Coût des rations</h3><div class="xs mut">Par mois, pour '+D.horses.length+' chevaux</div></div></div><div class="cb hrow wrap" style="--g:16px">'+C.donut([{v:t.ch,c:'var(--acc)'},{v:t.cg,c:'var(--c2)'},{v:t.sup,c:'var(--c3)'}],{size:128,center:F.num(t.cost*m/1000,1)+' k€',w:14})+
      '<div class="stack grow" style="--g:8px;min-width:140px">'+[['Foin',t.ch,'var(--acc)'],['Granulés',t.cg,'var(--c2)'],['Compléments',t.sup,'var(--c3)']].map(function(a){return '<div class="hrow sp s"><span class="hrow" style="--g:8px"><i style="width:8px;height:8px;border-radius:2px;background:'+a[2]+'"></i>'+a[0]+'</span><b class="num">'+F.eur(Math.round(a[1]*m))+'</b></div>'}).join('')+'</div></div></div>'+
     '<div class="card"><div class="ch"><h3>Rations les plus coûteuses</h3></div><div style="padding:6px 0 4px">'+top.map(function(h){return '<div class="lb-row click" data-ration="'+h.id+'">'+U.hav(h,'sm')+'<div class="grow"><div class="t ellip">'+E(h.name)+'</div><div class="s ellip">'+kg(h.ration.hay)+' kg de foin, '+kg(h.ration.grain)+' kg de '+grainType(h).toLowerCase()+'</div></div><b class="num s">'+F.eur(feedDayTot(h),true)+'</b></div>'}).join('')+'</div></div></div></div></div>'}

function printSheet(){var list=D.horses.slice().sort(function(a,b){return a.box<b.box?-1:1});
  function cell(m,md){return '<td class="c">'+(m.hay?kg(m.hay):'')+'</td><td class="c">'+(m.grain?kg(m.grain):'')+'</td>'}
  var sh=P.sheet({title:'Tableau d’écurie à imprimer',icon:'doc',wide:true,body:'<div class="stack" style="--g:14px"><div class="hrow wrap sp"><div class="scroll-x">'+U.seg([['a4','A4 paysage'],['a3','A3, à afficher'],['box','Étiquettes de box']],'a4','data-fmt')+'</div><span class="xs mut">2 pages · mis à jour à 9 h 41</span></div>'+
    '<div class="al-paper"><div class="hrow sp" style="margin-bottom:12px"><div><b class="disp" style="font-size:18px">Distribution des rations</b><div class="xs mut">Écurie des Tilleuls · semaine du 16 novembre 2026</div></div>'+LOGO(22,'var(--ink)','var(--acc)')+'</div>'+
    '<div class="tw" style="border-radius:0"><table><thead><tr><th rowspan="2">Box</th><th rowspan="2">Cheval</th><th colspan="2">Matin, 7 h</th><th colspan="2">Midi, 12 h</th><th colspan="2">Soir, 18 h</th><th rowspan="2">Compléments et consignes</th></tr><tr><th>Foin</th><th>Gran.</th><th>Foin</th><th>Gran.</th><th>Foin</th><th>Gran.</th></tr></thead><tbody>'+
     list.map(function(h){var m=meals(h),md=MEDS[h.id],sp=h.ration.supp!=='Aucun'?h.ration.supp+' ('+SUPP[h.ration.supp].when+')':'';return '<tr><td class="bx">'+h.box+'</td><td><b>'+E(h.name)+'</b></td>'+cell(m.matin)+cell(m.midi)+cell(m.soir)+'<td>'+[md?'<b class="badc">'+(md.matin||md.midi)+'</b>':'',sp,CONS[h.id]?E(CONS[h.id]):''].filter(Boolean).join(' · ')+'</td></tr>'}).join('')+'</tbody></table></div>'+
    '<div class="xs mut" style="margin-top:10px">Quantités en kilos. Un code à scanner en bas de page ouvre la version à jour sur le téléphone.</div></div></div>',
   foot:'<button class="btn ghost" data-pdf>'+ICON('download','sm')+'Télécharger le PDF</button><button class="btn pri" data-pr>'+ICON('doc','sm')+'Imprimer le tableau</button>'});
  sh.querySelector('[data-pdf]').onclick=function(){P.toast('Tableau d’écurie téléchargé en PDF',{icon:'download'})};
  sh.querySelector('[data-pr]').onclick=function(){var f=(sh.querySelector('[data-fmt][aria-selected="true"]')||{textContent:'A4 paysage'}).textContent;sh.close();P.toast('Tableau d’écurie envoyé à l’imprimante du bureau, format '+f,{icon:'checkc'})};
  return sh}

P.mod({id:'alimentation',role:'gerant',group:'Écurie',title:'Alimentation',icon:'feed',n:50,
 render:function(el,ctx){
  if(!AL.init){AL.init=true;D.horses.forEach(function(h){ST.fed.matin[h.id]=1})}
  if(ctx.params.tab){AL.tab=ctx.params.tab;ctx.params.tab=null}
  D.horses.forEach(X);
  var body;
  function head(){var t=feedTotals(),S=stocks(),hay=S[0],dl=daysLeft(hay),lim=Math.floor((hay.qty-hay.min)/hay.daily);
    return '<div class="lb-kpis rise">'+
    kpi('Foin par jour','hay',kg(t.hay)+'<small>kg</small>',kg(hay.daily)+' balles avec les râteliers des prairies')+
    kpi('Granulés par jour','feed',kg(t.club+t.flake)+'<small>kg</small>',kg(t.club)+' kg du silo · '+kg(t.flake)+' kg de floconnés')+
    kpi('Coût moyen d’une ration','euro',F.eur(t.cost/D.horses.length,true)+'<small>par jour</small>',F.eur(Math.round(t.cost*30.4))+' par mois pour le cheptel')+
    kpi('Autonomie en foin','stock',dl+'<small>jours</small>',ST.orders.k1?'<span class="acc b">20 balles commandées</span>, livrées jeudi':'<span class="warnc b">Commander avant le '+F.date(iso(Math.max(0,lim-hay.lead)))+'</span>')+'</div>'}
  el.innerHTML=LPH('Alimentation',D.horses.length+' rations individuelles · distribution matin, midi et soir, reliée aux stocks',
     '<button class="btn" data-act="print">'+ICON('doc','sm')+'<span class="hide-s">Imprimer le tableau d’écurie</span><span class="only-s">Imprimer</span></button><button class="btn pri" data-act="assist">'+ICON('assistant','sm')+'Vérifier les rations</button>')+
   '<div class="stack" style="--g:14px"><div id="al-head">'+head()+'</div><div class="scroll-x">'+U.seg([['plan','Plan de rationnement'],['board','Tableau de distribution'],['stock','Stocks et prévisions']],AL.tab,'data-at')+'</div><div id="al-body"></div></div>';
  body=el.querySelector('#al-body');
  function draw(keep){var foc=keep&&document.activeElement&&document.activeElement.id==='al-q';body.innerHTML=({plan:alPlan,board:alBoard,stock:alStock}[AL.tab]||alPlan)();if(!keep)P.animate(body);
    var q=body.querySelector('#al-q');if(q){q.oninput=function(){AL.q=q.value;draw(true)};if(foc){q.focus();q.setSelectionRange(q.value.length,q.value.length)}}}
  function refresh(){el.querySelector('#al-head').innerHTML=head();draw(true)}
  draw();
  on(el,'[data-at]',function(b){AL.tab=b.getAttribute('data-at');draw()});
  on(el,'[data-af]',function(b){AL.f=b.getAttribute('data-af');draw(true)});
  on(el,'[data-row]',function(r){rationSheet(D.horse(r.getAttribute('data-row')),refresh)});
  on(el,'[data-ration]',function(r){rationSheet(D.horse(r.getAttribute('data-ration')),refresh)});
  on(el,'[data-meal]',function(b){AL.meal=b.getAttribute('data-meal');draw(true)});
  on(el,'[data-fed]',function(b){var id=b.getAttribute('data-fed'),m=ST.fed[AL.meal];m[id]=!m[id];var n=D.horses.filter(function(h){return m[h.id]}).length;draw(true);if(n===D.horses.length)P.toast('Distribution du '+AL.meal+' terminée, 40 boxes servis',{icon:'checkc'})});
  on(el,'[data-order]',function(b){var s=stocks().find(function(a){return a.id===b.getAttribute('data-order')});ST.orders[s.id]=1;refresh();P.toast('Commande envoyée à '+s.supplier+' : '+s.order+' '+(s.orderU||s.unit.split(' ')[0])+', '+F.eur(s.order*s.price)+', livraison le '+F.date(iso(s.lead)),{icon:'truck',undo:function(){delete ST.orders[s.id];refresh()}})});
  var ACT={
   print:printSheet,
   kiosk:function(){P.toast('Tableau affiché sur l’écran de la sellerie, mis à jour en direct',{icon:'expand'})},
   allfed:function(){var m=ST.fed[AL.meal],all=D.horses.every(function(h){return m[h.id]});D.horses.forEach(function(h){m[h.id]=!all});draw(true);P.toast(all?'Distribution du '+AL.meal+' remise à zéro':'Distribution du '+AL.meal+' notée pour les 40 boxes',{icon:all?'refresh':'checkc'})},
   assist:function(){var low=D.horses.filter(function(h){var N=needs(h);return N.ufc/N.need<.88}),hi2=D.horses.filter(function(h){return nec(h)>=4&&h.ration.grain>=2.5});
     var sh=P.sheet({title:'Vérification des rations',icon:'assistant',body:'<div class="stack" style="--g:14px"><p class="s mut">L’assistant compare chaque ration au poids, à la note d’état et au travail de la semaine.</p>'+
       '<div class="card flat"><div class="lb-row">'+sq('checkc','ok','sm')+'<div class="grow"><div class="t">'+(D.horses.length-low.length-hi2.length)+' rations équilibrées</div><div class="s">Apports entre 90 et 120 % des besoins</div></div></div>'+
       low.slice(0,3).map(function(h){var N=needs(h);return '<div class="lb-row click" data-ration="'+h.id+'">'+sq('trend','warn','sm')+'<div class="grow"><div class="t">'+E(h.name)+' : ration un peu juste</div><div class="s">'+F.num(N.ufc,1)+' UFC pour '+F.num(N.need,1)+' de besoin, '+h.work+' h de travail</div></div>'+ICON('right','sm')+'</div>'}).join('')+
       hi2.slice(0,3).map(function(h){return '<div class="lb-row click" data-ration="'+h.id+'">'+sq('weight','warn','sm')+'<div class="grow"><div class="t">'+E(h.name)+' : en surpoids</div><div class="s">Note d’état '+kg(nec(h))+' sur 5 avec '+kg(h.ration.grain)+' kg de granulés</div></div>'+ICON('right','sm')+'</div>'}).join('')+'</div></div>',
       foot:'<button class="btn pri" data-ok>J’ai compris</button>'});
     sh.querySelector('[data-ok]').onclick=function(){sh.close()};on(sh,'[data-ration]',function(r){rationSheet(D.horse(r.getAttribute('data-ration')),function(){P.rerender()})})}};
  on(el,'[data-act]',function(b){var f=ACT[b.getAttribute('data-act')];if(f)f(b)});
 }});

/* =====================================================================
   7. Palette, assistant, visite guidée
   ===================================================================== */
P.actions.push(
 {role:'gerant',label:'Ajouter un cheval avec son numéro SIRE',icon:'horse',run:function(){P.go('chevaux');setTimeout(addHorseSheet,60)}},
 {role:'gerant',label:'Importer des chevaux en lot',icon:'upload',run:function(){P.go('chevaux');setTimeout(importSheet,60)}},
 {role:'gerant',label:'Ouvrir la fiche d’Ulysse de la Roche',icon:'horse',run:function(){P.go('cheval',{id:'h01'})}},
 {role:'gerant',label:'Planifier une tournée du maréchal',icon:'hoof',run:function(){P.go('soins',{tab:'tours'});setTimeout(function(){newTourSheet('farrier')},60)}},
 {role:'gerant',label:'Planifier les vaccins grippe',icon:'syringe',run:function(){P.go('soins',{tab:'tours'});setTimeout(function(){newTourSheet('vacc')},60)}},
 {role:'gerant',label:'Exporter le registre sanitaire',icon:'download',run:function(){P.go('soins',{tab:'pharma'});P.toast('Registre sanitaire du 4e trimestre exporté en PDF horodaté',{icon:'download'})}},
 {role:'gerant',label:'Imprimer le tableau de distribution',icon:'feed',run:function(){P.go('alimentation',{tab:'board'});setTimeout(printSheet,60)}},
 {role:'gerant',label:'Commander du foin',icon:'hay',run:function(){P.go('alimentation',{tab:'stock'})}});

function findHorse(t){var n=norm(t),best=null;D.horses.forEach(function(h){var first=norm(h.name.split(' ')[0]);if(n.indexOf(norm(h.name))>=0||new RegExp('(^|[^a-z])'+first.replace(/[^a-z]/g,'.')+'([^a-z]|$)').test(n)){if(!best||h.name.length>best.name.length)best=h}});return best}
function hCard(h){return '<div class="hrow" style="--g:10px">'+U.hav(h)+'<div class="grow"><b class="s">'+E(h.name)+'</b><div class="xs mut">'+h.box+' · '+ownerLine(h)+'</div></div>'+stChip(h)+'</div>'}
P.brain.unshift(
 {role:'gerant',re:/co[uû]t|revient|rapporte|rentab|marge/i,reply:function(t){var h=findHorse(t);
   if(!h){D.horses.forEach(X);var tot=D.horses.reduce(function(a,x){return a+x.costMonth},0),top=D.horses.slice().sort(function(a,b){return b.costMonth-a.costMonth}).slice(0,3);
     return {text:'Le cheptel coûte '+F.eur(tot)+' par mois, soit '+F.eur(Math.round(tot/D.horses.length))+' par cheval en moyenne. Les trois plus coûteux :',card:top.map(function(x){return '<div class="hrow sp"><span class="s">'+E(x.name)+'</span><b class="s num">'+F.eur(x.costMonth)+'</b></div>'}).join(''),actions:[{label:'Voir le cheptel par coût',run:function(){LS.sort='cost';P.prefs.set('chevaux:view','table');P.go('chevaux');return 'Ouvert'}}]}}
   var x=X(h),mg=x.income-h.costMonth;
   return {text:E(h.name)+' revient à <b>'+F.eur(h.costMonth)+' par mois</b>. '+(h.owner?'La pension facturée à '+D.name(h.owner)+' est de '+F.eur(x.pension)+', soit ':'Il rapporte environ '+F.eur(x.income)+' en reprises, soit ')+(mg>=0?F.eur(mg)+' de marge.':F.eur(-mg)+' de perte.'),
     card:x.costs.slice().sort(function(a,b){return b.v-a.v}).slice(0,5).map(function(c){return '<div class="hrow sp"><span class="s">'+c.l+'</span><b class="s num">'+F.eur(c.v)+'</b></div>'}).join(''),
     actions:[{label:'Ouvrir le détail des coûts',run:function(){P.go('cheval',{id:h.id,tab:'couts'});return 'Fiche ouverte'}}]}}},
 {role:'gerant',re:/ration|foin|granul|mange|aliment|nourri/i,reply:function(t){var h=findHorse(t);
   if(h){var m=meals(h);return {text:E(h.name)+' reçoit '+kg(h.ration.hay)+' kg de foin et '+kg(h.ration.grain)+' kg de '+grainType(h).toLowerCase()+' par jour'+(h.ration.supp!=='Aucun'?', avec '+h.ration.supp.toLowerCase():'')+'. Coût : '+F.eur(feedDayTot(h),true)+' par jour.'+(CONS[h.id]?' Consigne : '+CONS[h.id].toLowerCase()+'.':''),card:MEALS.map(function(a){return '<div class="hrow sp"><span class="s">'+a[1]+', '+a[2]+'</span><b class="s num">'+kg(m[a[0]].hay)+' kg de foin'+(m[a[0]].grain?', '+kg(m[a[0]].grain)+' kg':'')+'</b></div>'}).join(''),actions:[{label:'Modifier la ration',run:function(){P.go('cheval',{id:h.id,tab:'alim'});setTimeout(function(){rationSheet(h)},80);return 'Ration ouverte'}}]}}
   var tt=feedTotals(),s=stocks()[0];return {text:'Aujourd’hui le club distribue '+kg(tt.hay)+' kg de foin et '+kg(tt.club+tt.flake)+' kg de granulés. Il reste '+s.qty+' balles de foin, soit environ '+daysLeft(s)+' jours.',actions:[{label:'Commander 20 balles',run:function(){ST.orders.k1=1;P.toast('Commande de 20 balles envoyée à Fourrages du Hurepoix');return 'Commande envoyée'}},{label:'Voir les stocks',run:function(){P.go('alimentation',{tab:'stock'});return 'Ouvert'}}]}}},
 {role:'gerant',re:/rappel|vaccin|vermifug|mar[ée]chal|ferr|dentiste|ost[ée]o|tourn[ée]e|soins? [àa] venir|prochains? soins?/i,reply:function(t){var h=findHorse(t);
   if(h){return {text:'Les prochaines échéances de '+E(h.name)+' :',card:RK.map(function(k){return {k:k,n:dueN(h,k)}}).sort(function(a,b){return a.n-b.n}).map(function(a){var tr=tourOf(h,a.k);return '<div class="hrow sp"><span class="s">'+RULES[a.k].l+'</span><b class="s '+(a.n<0?'badc':a.n<=RULES[a.k].soon?'warnc':'')+'">'+(tr?'tournée du '+F.date(tr.date):dueTxt(a.n))+'</b></div>'}).join(''),actions:[{label:'Ouvrir son carnet de santé',run:function(){P.go('cheval',{id:h.id,tab:'sante'});return 'Fiche ouverte'}}]}}
   var k=/vaccin/i.test(t)?'vacc':/vermifug/i.test(t)?'worm':/dentiste/i.test(t)?'dentist':/ost[ée]o/i.test(t)?'osteo':/mar[ée]chal|ferr/i.test(t)?'farrier':null,rows=reminderRows().filter(function(r){return !k||r.k===k});
   return {text:rows.length+' rappels'+(k?' « '+RULES[k].l.toLowerCase()+' »':'')+' tombent dans les 30 jours, dont '+rows.filter(function(r){return r.t}).length+' déjà regroupés en tournée. Les plus proches :',card:rows.slice(0,4).map(function(r){return '<div class="hrow sp"><span class="s">'+E(r.h.name)+' · '+RULES[r.k].l.toLowerCase()+'</span><b class="s '+(r.n<0?'badc':r.n<=7?'warnc':'')+'">'+dueTxt(r.n)+'</b></div>'}).join(''),
     actions:[{label:'Préparer une tournée',run:function(){P.go('soins',{tab:'tours'});setTimeout(function(){newTourSheet(k||'farrier')},80);return 'Demande prête à envoyer'}},{label:'Voir les rappels',run:function(){P.go('soins',{tab:'rem'});return 'Ouvert'}}]}}},
 {role:'gerant',re:/sant[ée]|comment va|comment vont|malade|boit|boite|colique|surveill|qui (est|sont) au repos|chevaux? [àa] voir/i,reply:function(t){var h=findHorse(t);
   if(h){var z=zones(h),bad=ZK.filter(function(k){return z[k].st!=='ok'}),nd=nextDue(h);
     return {text:h.status==='ok'&&!bad.length?E(h.name)+' va bien : aucune alerte, '+h.work+' h de travail cette semaine sur '+h.workMax+'. Prochain soin : '+RULES[nd.k].l.toLowerCase()+' '+dueTxt(nd.n)+'.':E(h.name)+(h.alerts.length?' : '+E(h.alerts.join('. ').charAt(0).toLowerCase()+h.alerts.join('. ').slice(1))+'.':' est à surveiller.')+(bad.length?' '+z[bad[0]].sum:''),
       card:hCard(h),actions:[{label:'Ouvrir sa fiche',run:function(){P.go('cheval',{id:h.id,tab:'sante'});return 'Fiche ouverte'}}].concat(h.owner?[{label:'Prévenir '+D.member(h.owner).first,run:function(){P.toast('Message envoyé à '+D.name(h.owner));return 'Message envoyé'}}]:[])}}
   var l=D.horses.filter(function(x){return x.status!=='ok'}).sort(function(a,b){return a.status==='bad'?-1:1});
   return {text:l.filter(function(x){return x.status==='bad'}).length+' chevaux demandent une attention urgente et '+l.filter(function(x){return x.status==='warn'}).length+' sont à surveiller :',card:l.slice(0,5).map(function(x){return '<div class="hrow sp"><span class="s b">'+E(x.name)+'</span><span class="xs '+(x.status==='bad'?'badc':'mut')+'" style="text-align:right">'+E(x.alerts[0])+'</span></div>'}).join(''),actions:[{label:'Voir les chevaux en alerte',run:function(){LS.f='alerte';P.go('chevaux');return 'Liste filtrée'}}]}}});

P.tourSteps.push({route:'cheval',params:{id:'h01'},title:'Le cheval en 3D, son carnet de santé sous le doigt',text:'Faites tourner Ulysse et touchez un point : l’antérieur gauche raconte sa tendinite de mars, les sabots annoncent le maréchal de jeudi. Santé, travail, ration, journal partagé, coûts et caméra du box tiennent dans la même fiche.'});
})();
