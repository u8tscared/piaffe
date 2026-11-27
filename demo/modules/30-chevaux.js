/* Vue gérant · Lot B : Chevaux, fiche cheval 3D, soins, alimentation */
(function(){
var D=P.D,F=P.fmt,U=P.ui,C=P.chart,E=F.esc;
/* démo publique ou bac à sable : jeu d'exemple complet. Club réel : uniquement ses données (rien d'inventé). */
var DEMO=!D.me||D.me.gerant==='s01'||!!(window.PL&&PL.sandbox);
function gName(){var id=D.me&&D.me.gerant,p=id&&(D.staffer(id)||D.person(id));var n=p?((p.first||'')+' '+(p.last||'')).trim():'';return n||(window.PL&&PL.user?((PL.user.first||'')+' '+(PL.user.last||'')).trim():'')}
function gFirst(){return DEMO?'Claire':(gName().split(' ')[0]||'')}
function clubName(){return DEMO?'Écurie des Tilleuls':(D.club&&D.club.name)||'le club'}
function liveForm(k){if(window.PL&&PL.forms&&PL.forms[k]){PL.forms[k]();return true}return false}

/* =====================================================================
   1. Données propres au lot (déterministes) et mise en cohérence
   ===================================================================== */
function iso(o){return D.iso(D.day(o))}
function addDays(s,n){var d=new Date(s+'T12:00:00');d.setDate(d.getDate()+n);return D.iso(d)}
function rng(seed){var s=seed>>>0||1;return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296}}
function hi(h){return D.horses.indexOf(h)}
function plural(n,s,p){return n+' '+(n>1?(p||s+'s'):s)}

var RULES={
 vacc:{l:'Vaccin grippe',k:'Vaccin',every:365,soon:30,icon:'syringe',c:'var(--c7)',price:58,who:'p1',rule:'Rappel annuel. Obligatoire pour sortir en concours FFE.'},
 worm:{l:'Vermifuge',k:'Vermifuge',every:120,soon:14,icon:'pill',c:'var(--c5)',price:22,who:'eq',rule:'Selon la coproscopie : traitement ciblé des forts excréteurs.'},
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
function prat(id){return D.practitioners.find(function(p){return p.id===id})||{id:id,name:'Praticien à choisir',short:'',job:'',kinds:[],phone:'',trip:0,days:'',key:''}}
/* club réel : l'intervenant habituel d'un type de soin, tiré des soins déjà saisis */
function whoFor(h,kind){var c=D.care.filter(function(x){return x.kind===kind&&x.who&&(!h||x.horse===h.id)}).sort(function(a,b){return a.date<b.date?1:-1})[0];if(!c&&h)return whoFor(null,kind);return c?c.who:''}

/* Mise en cohérence unique des données de base avec les alertes, les soins planifiés et les autres écrans */
if(!D._lotB){D._lotB=true;
  var H=D.horses;
  /* Xanthos (h23, box B23) est à la diète depuis sa colique de la nuit : même ration que sur le téléphone de l’équipe */
  H[22].ration={hay:3,grain:0,supp:'Aucun'};
  var FEM=['Quiétude','Vanille','Opale','Câline','Kalinka','Lune d’Or','Étoile','Hirondelle','Iris','Noisette','Volga','Pistache','Réglisse','Gribouille'];
  H.forEach(function(h){h.sex=FEM.indexOf(h.name)>=0?'Jument':'Hongre'});H[19].sex='Étalon';
  H[0].vacc=iso(-140);H[0].worm=iso(-62);H[0].farrier=iso(-47);H[0].dentist=iso(-229);H[0].osteo=iso(-130);
  H[7].vacc=iso(-359);H[11].farrier=iso(-58);H[26].worm=iso(-120);H[5].osteo=iso(-174);H[15].dentist=iso(-350);
  H[3].work=3;H[5].work=4;H[22].work=5;H[0].level='Galop 6-7';H[0].mood='Sensible';
  /* un club bien tenu : seuls les retards annoncés par les alertes restent en retard */
  var LATE={'11:farrier':1,'26:worm':1,'18:dentist':1};H[18].dentist=iso(-377);
  H.forEach(function(h,i){RK.forEach(function(k,j){var n=F.days(addDays(h[k],RULES[k].every));
    if(n<0&&!LATE[i+':'+k]){h[k]=iso(-RULES[k].every+3+((i*7+j*5)%24))}})});
}

/* ---------- Alimentation ---------- */
var PRICE={hay:.21,club:.52,flake:.68};
var SUPP={'Huile de lin':{d:.35,dose:'50 ml',when:'soir'},'Électrolytes':{d:.42,dose:'1 dose',when:'soir'},'Ail':{d:.2,dose:'20 g',when:'matin'},'Levures':{d:.45,dose:'1 mesure',when:'matin'},'Biotine':{d:.6,dose:'1 mesure',when:'matin'},'Aucun':{d:0,dose:'',when:''}};
function grainType(h){return h.kind!=='club'?'Floconnés':'Granulés club'}
function r5(v){return Math.round(v*2)/2}
function meals(h){var hay=h.ration.hay,g=h.ration.grain,m=r5(hay*.4),s=r5(hay*.4),mi=Math.max(0,r5(hay-m-s)),gm=r5(g/2),gs=Math.max(0,r5(g-gm)),gmi=0;
  if(g>=3){gm=r5(g/3);gmi=r5(g/3);gs=r5(g-gm-gmi)}
  var sp=SUPP[h.ration.supp]||SUPP.Aucun;
  return {matin:{hay:m,grain:gm,supp:sp.when==='matin'?h.ration.supp:''},midi:{hay:mi,grain:gmi,supp:''},soir:{hay:s,grain:gs,supp:sp.when==='soir'?h.ration.supp:''}}}
function feedDay(h){var sp=SUPP[h.ration.supp]||SUPP.Aucun;return {hay:h.ration.hay*PRICE.hay,grain:h.ration.grain*(grainType(h)==='Floconnés'?PRICE.flake:PRICE.club),supp:sp.d}}
function feedDayTot(h){var f=feedDay(h);return f.hay+f.grain+f.supp}
/* h.bcs est noté sur 5 (échelle de l’IFCE, de 2,5 à 4 dans le cheptel) */
function nec(h){var v=+h.bcs;return v>0&&v<=5?v:3}
function necTxt(v){return v<=2?'Maigre':v<=2.5?'État de travail':v<=3?'Optimal':v<=3.5?'Bon état':'En surpoids'}
var CONS={h04:'Foin au sol, mouillé',h23:'Diète : foin mouillé par petites poignées',h16:'Ration augmentée, à peser lundi',h06:'Pas de granulés pendant le repos',h01:'Carottes autorisées, pas de pain',h08:'Granulés trempés (dents)',h11:'Filet à foin petites mailles',h32:'Filet à foin petites mailles',h34:'Pas d’herbe riche'};
var MEDS={h04:{matin:'Phénylbutazone, 1 sachet',soir:'Phénylbutazone, 1 sachet'},h23:{matin:'Diète : foin mouillé seulement, pas de granulés',midi:'Mash tiède, 1 litre',soir:'Mash tiède, 1 litre'}};

/* ---------- Données dérivées par cheval (mises en cache) ---------- */
var XC={};
var SIRES=['Diamant de Semilly','Kannan','Quidam de Revel','Mylord Carthago','Nabab de Rêve','Calvaro','Jaguar Mail','Linaro','Machno Carwyn','Dexter Leam Pondi','Ready Boy','Upsilon'];
var DAMS=['Bahia des Prés','Fleur de Mai','Java de Kerglenn','Idylle du Bois','Ondine du Lys','Élégie d’Ouilly','Tzigane du Val','Noisette de Brecey','Harmonie du Gué','Valse de Cléry'];
var BREED=['Élevage de la Roche','Haras du Moulin','Élevage des Prés','Écurie du Val','Haras de Kerglenn','EARL du Bois Joli'];
var INS=['Mutuelle Équine de France','Assurances du Galop','Cavalière Assurances'];
function X(h){if(XC[h.id])return XC[h.id];if(!DEMO)return XC[h.id]=XL(h);var i=hi(h),r=rng(7919*(i+3)),x={},k;
  x.ueln='250001'+h.sire.slice(6);x.sireNo=h.sire.slice(4);
  x.born=(2026-h.age)+'-'+String(3+i%4).padStart(2,'0')+'-'+String(1+(i*7)%27).padStart(2,'0');
  x.father=SIRES[i%SIRES.length];x.mother=DAMS[(i*3)%DAMS.length];x.breeder=BREED[i%BREED.length];
  x.arrival=(2026-1-(i%6))+'-'+String(1+(i*5)%12).padStart(2,'0')+'-01';if(i===0)x.arrival='2024-09-01';
  x.ins=h.owner?{co:INS[i%INS.length],no:'EQ-'+(48000+i*137),cover:'Responsabilité civile, mortalité, frais vétérinaires',until:iso(40+i*9)}:{co:'Contrat cavalerie du club',no:'CAV-7812045',cover:'Responsabilité civile, mortalité',until:'2027-08-31'};
  x.rider=(D.halfboard.find(function(d){return d.horse===h.id})||{}).rider;
  /* poids : 12 mois */
  var w=[],base=h.weight-6+Math.round(r()*12);for(k=0;k<12;k++)w.push(Math.round(base+Math.sin((k+i)/2)*6+(r()-.5)*5));w[11]=h.weight;w[10]=h.weight+(i===15?7:1);w[9]=h.weight+(i===15?12:-2);if(i===15)w[8]=h.weight+13;x.weights=w;
  x.nec=nec(h);
  /* travail : semaine en cours (lundi à dimanche) */
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
/* club réel : semaine en cours (lundi à dimanche) à la date du jour */
function monday(){var d=D.day(0),w=(d.getDay()+6)%7;d.setDate(d.getDate()-w);return d}
function todayIdx(){return DEMO?1:(D.day(0).getDay()+6)%7}
if(!DEMO){DAYSL=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'].map(function(n,k){var d=monday();d.setDate(d.getDate()+k);return n+' '+d.getDate()})}
function isoWeek(d){d=new Date(d);d.setHours(0,0,0,0);d.setDate(d.getDate()+3-(d.getDay()+6)%7);var w1=new Date(d.getFullYear(),0,4);return 1+Math.round(((d-w1)/864e5-3+(w1.getDay()+6)%7)/7)}
/* club réel : la semaine du cheval vient des reprises où il est monté et des soins planifiés */
function weekL(h){var out=[[],[],[],[],[],[],[]],t=todayIdx(),mon=monday();
  D.lessons.forEach(function(l){var hs=l.horses||{};if(!Object.keys(hs).some(function(k){return hs[k]===h.id}))return;var k=(+l.dow+6)%7,c=D.person(l.coach);
    out[k].push({t:l.start||'',d:+l.dur||60,k:l.title||'Reprise',w:c?((c.first||'')+' '+(c.last||'')).trim():'Reprise du club',in:/CSO|obstacle|perf/i.test(l.title||'')?3:2,done:k<t})});
  D.care.forEach(function(c){if(c.horse!==h.id||!c.date)return;var n=Math.round((new Date(c.date+'T12:00:00')-mon)/864e5);if(n<0||n>6)return;out[n].push({t:/^\d/.test(c.time||'')?c.time:'',d:0,k:c.kind,w:c.who||'',care:true,done:c.status==='fait'})});
  out.forEach(function(a){a.sort(function(p,q){return p.t<q.t?-1:1})});return out}
function XL(h){var x={},wk=weekL(h),hrs=0;wk.forEach(function(d){d.forEach(function(s){if(!s.care)hrs+=s.d/60})});
  x.ueln=h.ueln||'';x.sireNo=h.sire||'';x.born=h.born&&String(h.born).length>4?h.born:'';x.father=h.father||'';x.mother=h.mother||'';x.breeder=h.breeder||'';x.arrival=h.arrival||'';
  x.ins=h.ins&&typeof h.ins==='object'?h.ins:{co:'',no:'',cover:'',until:''};
  x.rider=(D.halfboard.find(function(d){return d.horse===h.id})||{}).rider;
  x.weights=Array.isArray(h.weights)&&h.weights.length?h.weights.slice(-12):(+h.weight?[+h.weight]:[]);x.nec=nec(h);x.week=wk;x.hist=[Math.round(hrs*2)/2];
  x.types=hrs?[{l:'Reprises',v:Math.round(hrs*2)/2,c:'var(--acc)'}]:[];x.sensor=false;
  /* coût estimé à partir de la ration saisie (prix de référence de l'aliment), sans main-d'œuvre ni frais inventés */
  var f=feedDay(h),c=[['Foin','hay',f.hay*30.4],['Granulés','feed',f.grain*30.4],['Compléments','pill',f.supp*30.4]].map(function(a){return {l:a[0],i:a[1],v:Math.round(a[2])}}).filter(function(a){return a.v>0});
  if(+h.costMonth>0&&h._costSet){c=[{l:'Coût saisi',i:'euro',v:+h.costMonth}]}
  x.costs=c;h.costMonth=c.reduce(function(a,b){return a+b.v},0);
  x.pension=+h.pension||0;x.income=x.pension;x.incomeL=h.owner?'Pension':'Recettes';x.est=true;
  x.trend=D.months.map(function(m,q){return q===D.months.length-1?h.costMonth:0});
  return x}
function week(h,i,r){if(!DEMO)return weekL(h);
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

/* ---------- Soins : historique, échéances, tournées ---------- */
function due(h,k){return h[k]?addDays(h[k],RULES[k].every):null}
function dueN(h,k){var d=due(h,k);return d?F.days(d):9999}
function dueSt(h,k){var n=dueN(h,k);return n<0?'bad':n<=RULES[k].soon?'warn':'ok'}
function dueTxt(n){return n>=9999?'non daté':n<0?'en retard de '+(-n)+' j':n===0?'aujourd’hui':n===1?'demain':n<60?'dans '+n+' j':'dans '+Math.round(n/30.4)+' mois'}
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
 {id:'ph7',name:'Chlorhexidine 0,5 %',form:'Solution, 1 litre',qty:3,unit:'flacons',min:2,lot:'CH-1190',exp:iso(540),rx:false,wait:'Aucun',use:'Désinfection'},
 {id:'ph8',name:'Détomidine en gel',form:'Seringue buccale',qty:2,unit:'seringues',min:1,lot:'DT-7745',exp:iso(160),rx:true,wait:'2 jours',use:'Sédation légère (tonte, dentiste)'},
 {id:'ph9',name:'Argile verte',form:'Seau de 4 kg',qty:2,unit:'seaux',min:1,lot:'AR-2201',exp:iso(700),rx:false,wait:'Aucun',use:'Tendons après l’effort'}];
function hname(id){var h=D.horse(id);return h?h.name:''}
D.register=D.register||[
 {id:'r1',date:iso(0),time:'03:40',horse:'h23',prod:'Flunixine méglumine 50 mg/ml',lot:'FX-88213',dose:'10 ml, voie intraveineuse',by:'Dr Leclerc',rx:'ORD-2026-0418',wait:'10 jours',why:'Colique légère'},
 {id:'r2',date:iso(0),time:'07:10',horse:'h04',prod:'Phénylbutazone 1 g',lot:'PB26-0912',dose:'1 sachet dans la ration',by:'Antoine Leroy',rx:'ORD-2026-0411',wait:'Exclusion définitive',why:'Boiterie antérieur gauche'},
 {id:'r3',date:iso(-1),time:'18:05',horse:'h04',prod:'Phénylbutazone 1 g',lot:'PB26-0912',dose:'1 sachet dans la ration',by:'Lucie Petit',rx:'ORD-2026-0411',wait:'Exclusion définitive',why:'Boiterie antérieur gauche'},
 {id:'r4',date:iso(-1),time:'07:12',horse:'h04',prod:'Phénylbutazone 1 g',lot:'PB26-0912',dose:'1 sachet dans la ration',by:'Antoine Leroy',rx:'ORD-2026-0411',wait:'Exclusion définitive',why:'Boiterie antérieur gauche'},
 {id:'r5',date:iso(-4),time:'08:30',horse:'h15',prod:'Ivermectine et praziquantel',lot:'IV-2607A',dose:'1 seringue, 350 kg',by:'Lucie Petit',rx:'ORD-2026-0397',wait:'35 jours',why:'Coproscopie à 650 œufs par gramme'},
 {id:'r6',date:iso(-7),time:'08:20',horse:'h17',prod:'Pyrantel',lot:'PY-5521',dose:'1 seringue, 500 kg',by:'Antoine Leroy',rx:'ORD-2026-0397',wait:'Aucun',why:'Coproscopie à 400 œufs par gramme'},
 {id:'r7',date:iso(-9),time:'11:15',horse:'h28',prod:'Collyre antibiotique',lot:'TB-3310',dose:'2 gouttes, œil droit, 3 fois par jour',by:'Lucie Petit',rx:'ORD-2026-0389',wait:'Aucun',why:'Conjonctivite'},
 {id:'r8',date:iso(-12),time:'10:00',horse:'h08',prod:'Détomidine en gel',lot:'DT-7745',dose:'1 ml sous la langue',by:'Claire Dumont',rx:'ORD-2026-0381',wait:'2 jours',why:'Tonte'}];

/* historique et échéances d'un cheval */
function careLog(h){var x=[],i=hi(h);
  if(!DEMO){D.care.filter(function(c){return c.horse===h.id}).forEach(function(c){var key=RK.find(function(k){return RULES[k].k===c.kind});
      x.push({id:c.id,date:c.date,time:c.time,kind:c.kind,key:key,who:c.who||'',note:c.note||'',price:+c.price||0,status:c.status==='fait'?'fait':c.status||'planifié',doc:c.doc,next:key&&c.status!=='fait'?true:undefined})});
    RK.forEach(function(k){var R=RULES[k];if(h[k]&&!x.some(function(e){return e.key===k&&e.date===h[k]}))x.push({id:h.id+k+'0',date:h[k],kind:R.k,key:k,who:whoFor(h,R.k),note:'Date notée sur la fiche du cheval',price:0,status:'fait'});
      if(x.some(function(e){return e.key===k&&e.status!=='fait'}))return;var t=tourOf(h,k),d=due(h,k);if(!d&&!t)return;
      x.push({id:h.id+k+'n',date:t?t.date:d,time:t?t.time:'',kind:R.k,key:k,who:t?prat(t.pr).short:whoFor(h,R.k),note:t?'Tournée groupée, '+t.horses.length+' chevaux':R.rule,price:0,status:t?'planifié':F.days(d)<0?'en retard':F.days(d)===0?'à faire':'à planifier',next:true})});
    return x.sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:0})}
  RK.forEach(function(k){var R=RULES[k],n=k==='farrier'?4:k==='worm'?3:2;for(var j=0;j<n;j++){var d=addDays(h[k],-R.every*j);
    x.push({id:h.id+k+j,date:d,kind:R.k,key:k,who:R.who==='eq'?'Équipe':prat(R.who).short,note:k==='farrier'?(h.pony?'Parage des quatre pieds':'Ferrure complète'+(i===0?', plaques aux antérieurs':'')):k==='vacc'?'Grippe et tétanos, lot VX-'+(4410+i+j):k==='worm'?(j%2?'Pyrantel':'Ivermectine et praziquantel')+', coproscopie '+(150+((i*37+j*90)%500))+' œufs par gramme':k==='dentist'?'Râpage, pas de surdent':'Séance complète, bassin et dorsales',price:carePrice(h,k),status:'fait'})}});
  D.care.filter(function(c){return c.horse===h.id}).forEach(function(c){if(RK.some(function(k){return RULES[k].k===c.kind}))return;
    x.push({id:c.id,date:c.date,time:c.time,kind:c.kind,who:c.who,note:c.note,price:c.kind==='Vétérinaire'?68:0,status:c.status})});
  if(i===0)x.push({id:'h01t1',date:'2026-03-12',kind:'Vétérinaire',who:'Dr Leclerc',note:'Tendinite du fléchisseur superficiel, antérieur gauche. Échographie, repos de 6 semaines.',price:186,status:'fait',doc:'Échographie et ordonnance'},{id:'h01t2',date:'2026-04-28',kind:'Vétérinaire',who:'Dr Leclerc',note:'Échographie de contrôle : tendon cicatrisé, reprise progressive du travail.',price:112,status:'fait',doc:'Compte rendu'});
  if(i===3)x.push({id:'h04a',date:iso(-2),kind:'Vétérinaire',who:'Dr Leclerc',note:'Boiterie de grade 2 sur 5 à l’antérieur gauche, chaleur au tendon. Anti-inflammatoire 5 jours, box.',price:92,status:'fait',doc:'Ordonnance ORD-2026-0411'});
  if(i===22)x.push({id:'h23a',date:iso(0),time:'03:40',kind:'Vétérinaire',who:'Dr Leclerc',note:'Colique légère sans déplacement. Injection de flunixine, diète, surveillance toutes les 2 heures.',price:148,status:'fait',doc:'Ordonnance ORD-2026-0418'});
  /* échéances */
  RK.forEach(function(k){var t=tourOf(h,k),R=RULES[k],d=due(h,k);
    x.push({id:h.id+k+'n',date:t?t.date:d,time:t?t.time:'',kind:R.k,key:k,who:R.who==='eq'?'Équipe':prat(R.who).short,note:t?'Tournée groupée, '+t.horses.length+' chevaux':R.rule,price:carePrice(h,k),status:t?'planifié':F.days(d)<0?'en retard':F.days(d)===0?'à faire':'à planifier',next:true})});
  return x.sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:0})}

function rx(h){var i=hi(h),o=[];if(!DEMO)return Array.isArray(h.rx)?h.rx:[];
  if(i===3)o.push({no:'ORD-2026-0411',d:iso(-2),who:'Dr Leclerc',med:'Phénylbutazone 1 g',pos:'1 sachet matin et soir dans la ration',dur:'5 jours, jusqu’à jeudi',wait:'Exclusion définitive de la consommation',on:true,given:[1,1,1,1,1,0,0,0,0,0]});
  if(i===22)o.push({no:'ORD-2026-0418',d:iso(0),who:'Dr Leclerc',med:'Flunixine méglumine 50 mg/ml',pos:'10 ml en intraveineuse, une fois. Diète puis mash tiède.',dur:'Surveillance 48 heures',wait:'10 jours',on:true,given:[1]});
  if(i===0)o.push({no:'ORD-2026-0102',d:'2026-03-12',who:'Dr Leclerc',med:'Méloxicam, suspension orale',pos:'30 ml par jour dans la ration',dur:'7 jours, terminé le 19 mars',wait:'3 jours',on:false});
  if(i===27)o.push({no:'ORD-2026-0389',d:iso(-9),who:'Dr Leclerc',med:'Collyre antibiotique',pos:'2 gouttes dans l’œil droit, 3 fois par jour',dur:'10 jours, jusqu’à demain',wait:'Aucun',on:true,given:[1,1,1]});
  return o}

/* zones du cheval 3D */
function zones(h){var i=hi(h),z;
  if(!DEMO){var Z={dents:['Dents',[.02,.64,.69],'dentist'],nuque:['Nuque et encolure',[.03,.84,.52]],dos:['Dos et garrot',[.04,.77,.02],'osteo'],ag:['Antérieur gauche',[.07,.2,.45]],sabots:['Sabots',[-.05,.06,.05],'farrier'],ventre:['Appareil digestif',[.1,.47,-.2],'worm'],jarret:['Jarrets et postérieurs',[.07,.25,-.64]]};z={};
    Object.keys(Z).forEach(function(id){var a=Z[id],k=a[2],R=k&&RULES[k],ev=R?D.care.filter(function(c){return c.horse===h.id&&c.kind===R.k&&c.status==='fait'}).sort(function(p,q){return p.date<q.date?1:-1}).map(function(c){return {d:c.date,t:c.note||c.kind,w:c.who||'Équipe'}}):[];
      if(R&&h[k]&&!ev.some(function(e){return e.d===h[k]}))ev.unshift({d:h[k],t:R.l,w:whoFor(h,R.k)||'Fiche du cheval'});
      z[id]={l:a[0],pos:a[1],k:k,st:k?dueSt(h,k):'ok',sum:k?(h[k]?R.l+' : dernier passage le '+F.dateY(h[k])+'. Prochain '+dueTxt(dueN(h,k))+'.':'Aucune date de '+R.l.toLowerCase()+' enregistrée pour l’instant.'):'Aucune observation enregistrée sur cette zone.',ev:ev}});
    return z}
  z={
  dents:{l:'Dents',pos:[.02,.64,.69],k:'dentist',st:dueSt(h,'dentist'),sum:'Dernier râpage le '+F.dateY(h.dentist)+'. Prochain contrôle '+dueTxt(dueN(h,'dentist'))+'.',ev:[{d:h.dentist,t:'Râpage complet',w:'Pierre Valat'},{d:addDays(h.dentist,-365),t:'Contrôle, extraction d’une dent de loup',w:'Pierre Valat'}]},
  nuque:{l:'Nuque et encolure',pos:[.03,.84,.52],st:'ok',sum:'Rien à signaler. Mobilité normale à gauche et à droite.',ev:[{d:h.osteo,t:'Cervicales libres après manipulation',w:'Camille Hervé'}]},
  dos:{l:'Dos et garrot',pos:[.04,.77,.02],k:'osteo',st:dueSt(h,'osteo'),sum:'Suivi par l’ostéopathe tous les 6 mois. Prochain bilan '+dueTxt(dueN(h,'osteo'))+'.',ev:[{d:h.osteo,t:'Séance complète, bassin et dorsales',w:'Camille Hervé'},{d:addDays(h.osteo,-182),t:'Contrôle de la selle, arçon adapté',w:'Camille Hervé'}]},
  ag:{l:'Antérieur gauche',pos:[.07,.2,.45],st:'ok',sum:'Membre sain. Tendons froids et secs.',ev:[{d:h.farrier,t:'Aplombs vérifiés à la ferrure',w:'Benoît Gautier'}]},
  sabots:{l:'Sabots',pos:[-.05,.06,.05],k:'farrier',st:dueSt(h,'farrier'),sum:(h.pony?'Parage':'Ferrure')+' toutes les 7 semaines. Prochain passage '+dueTxt(dueN(h,'farrier'))+'.',ev:[{d:h.farrier,t:h.pony?'Parage des quatre pieds':'Ferrure complète',w:'Benoît Gautier'},{d:addDays(h.farrier,-49),t:h.pony?'Parage':'Ferrure complète',w:'Benoît Gautier'},{d:addDays(h.farrier,-98),t:h.pony?'Parage':'Ferrure, un fer perdu remis',w:'Benoît Gautier'}]},
  ventre:{l:'Appareil digestif',pos:[.1,.47,-.2],k:'worm',st:dueSt(h,'worm'),sum:'Vermifuge ciblé selon la coproscopie. Prochain contrôle '+dueTxt(dueN(h,'worm'))+'.',ev:[{d:h.worm,t:'Vermifuge après coproscopie',w:'Équipe'},{d:addDays(h.worm,-120),t:'Coproscopie, faible excréteur',w:'Laboratoire'}]},
  jarret:{l:'Jarrets et postérieurs',pos:[.07,.25,-.64],st:'ok',sum:'Rien à signaler. Flexions négatives au dernier bilan.',ev:[{d:addDays(h.osteo,-20),t:'Flexions négatives',w:'Dr Leclerc'}]}};
  if(i===0){z.ag.st='warn';z.ag.sum='Ancienne tendinite du fléchisseur (mars 2026), guérie. Tendon contrôlé après chaque séance d’obstacle.';z.ag.ev=[{d:iso(-30),t:'Bilan locomoteur : rien à signaler',w:'Dr Leclerc'},{d:'2026-04-28',t:'Échographie de contrôle : tendon cicatrisé',w:'Dr Leclerc'},{d:'2026-03-12',t:'Boiterie, tendinite du fléchisseur superficiel. Repos 6 semaines',w:'Dr Leclerc'}];
    z.dos.st='warn';z.dos.sum='Un peu raide à main gauche en début de séance. À revoir avec l’ostéopathe.';z.dos.ev.unshift({d:iso(-1),t:'Raideur à main gauche notée par Emma Moreau',w:'Journal'});z.sabots.sum='Ferrure complète avec plaques aux antérieurs. Benoît Gautier passe jeudi à 9 h.'}
  if(i===3){z.ag.st='bad';z.ag.sum='Boiterie de grade 2 sur 5 depuis dimanche. Chaleur au tendon. Échographie aujourd’hui à 14 h avec le Dr Leclerc.';z.ag.ev=[{d:iso(0),t:'Échographie du tendon prévue à 14 h',w:'Dr Leclerc'},{d:iso(-2),t:'Boiterie de grade 2, anti-inflammatoire 5 jours',w:'Dr Leclerc'},{d:iso(-2),t:'Boiterie signalée après la reprise de 18 h',w:'Thomas Roux'}]}
  if(i===22){z.ventre.st='bad';z.ventre.sum='Colique légère cette nuit. Il boit 40 % de moins. Surveillance des crottins et de l’appétit toutes les 2 heures.';z.ventre.ev=[{d:iso(0),t:'08 h 05 : a recrotté, mange un peu',w:'Antoine Leroy'},{d:iso(0),t:'03 h 40 : injection de flunixine, diète',w:'Dr Leclerc'},{d:iso(0),t:'02 h 55 : la caméra du box détecte un cheval couché et agité',w:'Caméra B23'}]}
  if(i===5){z.dos.st='warn';z.dos.sum='Repos de 3 jours prescrit. Bilan du dos avec Camille Hervé le '+F.date(iso(8))+'.'}
  if(i===15){z.ventre.st='warn';z.ventre.sum='Perte de 12 kg en 3 semaines. Ration augmentée, coproscopie envoyée au laboratoire.'}
  return z}
var ZK=['dents','nuque','dos','ag','sabots','ventre','jarret'];

function journal(h){var j=D.journal.filter(function(e){return e.horse===h.id});if(j.length||!DEMO)return j;var x=X(h),o=[];
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
.lb-kpi .lab{font-size:13px;color:var(--mut);display:flex;align-items:center;gap:6px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lb-kpi .val{font:700 26px/1.05 var(--f-display);letter-spacing:-.035em;font-variant-numeric:tabular-nums;white-space:nowrap}
.lb-kpi .val small{font-size:14px;color:var(--mut);font-weight:600;letter-spacing:-.01em;margin-left:4px}
.lb-kpi .sub{font-size:13px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
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
.lb-dl dt{font-size:13px;color:var(--mut);margin-bottom:2px}
.lb-dl dd{margin:0;font-weight:600;font-size:13.5px;overflow-wrap:anywhere}
.lb-row{display:flex;align-items:center;gap:12px;padding:11px 16px;min-width:0;position:relative}
.lb-row+.lb-row{border-top:1px solid var(--line)}
.lb-row.click{cursor:pointer;transition:background var(--t-1)}.lb-row.click:hover{background:var(--surface-2)}
.lb-row .t{font-weight:600;font-size:13.5px}.lb-row .grow>.s{font-size:13px;color:var(--mut)}
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
@container main (max-width:520px){.lb-kpis{gap:10px}.lb-kpi{padding:12px}.lb-kpi .val{font-size:22px}.lb-kpi .val small{font-size:13px}.lb-tools .search{max-width:none;flex-basis:100%}.lb-dl{gap:10px 14px}}

/* ---- cheptel ---- */
.hx-tg{order:5;flex-basis:100%}
.hx-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(262px,1fr));gap:14px}
.hx-c{padding:14px 14px 0;display:flex;flex-direction:column;gap:11px;text-align:left;overflow:hidden}
.hx-top{display:flex;gap:12px;align-items:center;min-width:0}
.hx-top h3{font-size:15.5px;letter-spacing:-.02em}
.hx-chips{display:flex;gap:5px;flex-wrap:wrap;min-height:22px}
.hx-al{display:flex;gap:6px;align-items:flex-start;font-size:13px;line-height:1.35;color:var(--ink-2)}
.hx-al svg.i{width:14px;height:14px;margin-top:1px}
.hx-load{display:flex;flex-direction:column;gap:6px;margin-top:auto}
.hx-load .hrow{justify-content:space-between;font-size:13px;color:var(--mut)}
.hx-load b{color:var(--ink);font-variant-numeric:tabular-nums}
.hx-foot{display:flex;justify-content:space-between;align-items:center;gap:10px;margin:0 -14px;padding:9px 14px;border-top:1px solid var(--line);font-size:13px;color:var(--mut);background:var(--surface-2)}
.hx-foot>span{display:inline-flex;align-items:center;gap:6px;min-width:0;white-space:nowrap}
.hx-foot svg.i{width:14px;height:14px}
.hx-foot b{color:var(--ink);font-variant-numeric:tabular-nums}
.hx-ld{display:flex;align-items:center;gap:8px;min-width:128px}
.hx-ld .bar{flex:1;min-width:56px}
.hx-sire{display:flex;gap:8px}
.hx-sire .in{font-family:var(--f-mono);letter-spacing:.02em}
.hx-found{border-radius:var(--r-lg);box-shadow:inset 0 0 0 1px var(--acc-line);background:var(--acc-pale);padding:14px;display:flex;flex-direction:column;gap:12px}
.hx-map{display:grid;grid-template-columns:minmax(0,1fr) 16px minmax(0,1fr);gap:8px 10px;align-items:center;font-size:13px}
.hx-map .src{font-family:var(--f-mono);font-size:13px;padding:6px 9px;border-radius:7px;background:var(--bg-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
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
.fc-hint{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--mut);padding:5px 10px 5px 8px;border-radius:99px;background:color-mix(in srgb,var(--surface) 80%,transparent);box-shadow:inset 0 0 0 1px var(--line);min-width:0}
.fc-hint svg.i{width:14px;height:14px}
.fc-zones{position:absolute;left:0;right:0;bottom:0;padding:10px 28px 10px 12px;display:flex;gap:6px;z-index:3;background:linear-gradient(to top,color-mix(in srgb,var(--surface-2) 92%,transparent) 55%,transparent);-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 36px),transparent);mask-image:linear-gradient(to right,#000 calc(100% - 36px),transparent)}
.fc-z{flex:none;display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 11px 0 9px;border-radius:99px;font-size:13px;font-weight:600;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2),var(--shadow-1);white-space:nowrap;transition:transform var(--t-1) var(--e-out),box-shadow var(--t-2)}
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
.fc-ring b{font-size:13px;white-space:nowrap}
.fc-ring span.d{font-size:13px;color:var(--mut);white-space:nowrap}
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
.fc-tl .dte{font-size:13px;color:var(--mut);font-variant-numeric:tabular-nums}
.fc-wk{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
.fc-wd{border-radius:var(--r-md);background:var(--surface-2);padding:10px 8px 8px;display:flex;flex-direction:column;gap:6px;min-height:150px;min-width:0}
.fc-wd.today{background:var(--acc-pale);box-shadow:inset 0 0 0 1px var(--acc-line)}
.fc-wd .dn{display:flex;justify-content:space-between;align-items:baseline;font-size:13px;font-weight:600;color:var(--mut);white-space:nowrap}
.fc-wd .dn b{color:var(--ink);font-variant-numeric:tabular-nums}
.fc-ss{border-radius:8px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);padding:6px 7px 6px 12px;font-size:13px;line-height:1.3;min-width:0;position:relative;overflow:hidden}
.fc-ss::before{content:"";position:absolute;left:4px;top:6px;bottom:6px;width:3px;border-radius:2px;background:var(--c,var(--acc))}
.fc-ss b{display:block;font-size:13px;overflow-wrap:anywhere}
.fc-ss span{color:var(--mut);display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.fc-ss.done{opacity:.72}
.fc-wb{transform-box:fill-box;transform-origin:bottom;animation:grow .7s var(--e-out) both;animation-delay:calc(var(--i,0)*30ms)}
.fc-rest{margin:auto 0;text-align:center;font-size:13px;color:var(--mut-2);display:flex;flex-direction:column;align-items:center;gap:4px}
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
.fc-cam .hud{position:absolute;left:12px;right:12px;display:flex;justify-content:space-between;align-items:center;gap:8px;font:500 13px var(--f-mono);text-shadow:0 1px 2px rgba(0,0,0,.6)}
.fc-cam .hud.t{top:10px}.fc-cam .hud.b{bottom:10px}
.fc-cam .ai{position:absolute;left:22%;top:25%;width:52%;height:58%;pointer-events:none}
.fc-cam .ai::before,.fc-cam .ai::after{content:"";position:absolute;width:18px;height:18px;border:2px solid #8fa8ff}
.fc-cam .ai::before{left:0;top:0;border-right:0;border-bottom:0;border-radius:4px 0 0 0}
.fc-cam .ai::after{right:0;bottom:0;border-left:0;border-top:0;border-radius:0 0 4px 0}
.fc-cam .ai span{position:absolute;left:0;top:-24px;font:600 13px var(--f-text);background:#3d63f2;color:#fff;padding:2px 7px;border-radius:5px;white-space:nowrap}
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
 .fc-acts{flex-wrap:nowrap;gap:6px}.fc-acts .btn.pri{min-width:0;padding:0 8px;gap:0}.fc-acts .btn.pri svg{display:none}.fc-al{display:none}.fc-as{display:inline!important}.fc-acts .btn{flex:1 1 auto;height:44px}.fc-acts .btn.icon,.fc-acts .btn:not(.pri){flex:0 0 44px;padding:0;gap:0;font-size:0;justify-content:center}
 .app.mobile .fc-nm h1{display:none}.app.mobile .fc-nm>.mut{margin-top:0!important}
 .fc-st-top [data-move] span{display:none}
 .fc-gl{height:calc(100% + 64px);width:calc(100% + 100px);margin:-22px 0 0 -50px}
}
@container main (min-width:761px){.fc-wd .ss{display:contents}}
@container main (max-width:520px){.lb-ph>.grow{flex-basis:100%}.fc-cam .ai{top:36%;height:48%}.lb-ph>.acts{width:100%;flex-wrap:nowrap}.lb-ph>.acts .btn{flex:1 1 0;min-width:0;height:44px}}

/* ---- soins ---- */
.so-cal{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));border-top:1px solid var(--line)}
.so-cal .dh{padding:8px 10px;font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--mut);border-bottom:1px solid var(--line)}
.so-cd{min-height:112px;padding:7px 7px 9px;border-bottom:1px solid var(--line);border-right:1px solid var(--line);display:flex;flex-direction:column;gap:4px;min-width:0}
.so-cd:nth-child(7n){border-right:0}
.so-cd:nth-last-child(-n+7){border-bottom:0}
.so-cd .n{font-size:13px;font-weight:600;color:var(--mut);font-variant-numeric:tabular-nums;display:flex;justify-content:space-between;align-items:center;height:22px;padding:0 3px}
.so-cd.past{background:var(--surface-2)}.so-cd.past .n{color:var(--mut-2)}
.so-cd.today .n span{background:var(--acc);color:var(--acc-ink);border-radius:99px;padding:2px 8px;margin-left:-5px}
.so-ev{display:flex;align-items:center;gap:6px;height:24px;padding:0 7px;border-radius:7px;font-size:13px;font-weight:600;background:color-mix(in srgb,var(--c) 14%,var(--surface));color:var(--ink);min-width:0;width:100%;text-align:left;transition:transform var(--t-1) var(--e-out),background var(--t-2)}
.so-ev:hover{background:color-mix(in srgb,var(--c) 24%,var(--surface))}
.so-ev:active{transform:scale(.97)}
.so-ev i{width:7px;height:7px;border-radius:50%;background:var(--c);flex:none}
.so-ev span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.so-ev.todo{background:transparent;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 55%,var(--line));color:var(--ink-2);font-weight:500}
.so-ev.late{background:var(--bad-pale);color:var(--bad);box-shadow:none}.so-ev.late i{background:var(--bad)}
.so-ag{display:none}
.so-agd{padding:12px 16px 4px;font-size:13px;font-weight:600;color:var(--mut);text-transform:uppercase;letter-spacing:.05em;display:flex;justify-content:space-between;border-top:1px solid var(--line)}
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
.al-box .bx{font:700 13px var(--f-mono);padding:3px 6px;border-radius:6px;background:var(--navy);color:var(--navy-ink);letter-spacing:.02em;flex:none}
.al-box .qs{display:grid;grid-template-columns:1fr 1fr;gap:6px}
.al-q{border-radius:8px;background:var(--surface-2);padding:6px 8px;min-width:0}
.al-q small{display:block;font-size:13px;color:var(--mut);font-weight:600;letter-spacing:.04em;text-transform:uppercase}
.al-q b{font:700 17px/1.2 var(--f-display);letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.al-q b span{font:600 13px var(--f-text);color:var(--mut);margin-left:3px;letter-spacing:0}
.al-fl{display:flex;gap:6px;align-items:flex-start;font-size:13px;line-height:1.35;color:var(--ink-2)}
.al-fl svg.i{width:13px;height:13px;margin-top:1px;flex:none}
.al-fl.med{color:var(--bad);font-weight:600}
.al-box[aria-checked="true"]{background:var(--ok-pale);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ok) 35%,transparent)}
.al-box[aria-checked="true"] .al-q{background:color-mix(in srgb,var(--surface) 60%,transparent)}
.al-box .chk{margin-left:auto;pointer-events:none}
.al-box[aria-checked="true"] .chk{background:var(--ok);box-shadow:none}
.al-box[aria-checked="true"] .chk svg{stroke-dashoffset:0}
.al-paper{background:var(--surface);border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line-2),var(--shadow-2);padding:22px 22px 16px}
.al-paper table{width:100%;border-collapse:collapse;font-size:13px}
.al-paper th,.al-paper td{border:1px solid var(--line-2);padding:5px 7px;text-align:left;vertical-align:top}
.al-paper th{font-size:13px;text-transform:uppercase;letter-spacing:.05em;color:var(--mut);background:var(--surface-2);white-space:nowrap}
.al-paper td.c{text-align:center;font-variant-numeric:tabular-nums;font-weight:600;white-space:nowrap}
.al-paper td.bx{font:700 13px var(--f-mono)}
.al-paper td b{white-space:nowrap}.al-paper td:last-child{overflow-wrap:anywhere}.al-paper td:last-child b{white-space:normal}
.al-stock{padding:16px;display:flex;flex-direction:column;gap:12px;min-width:0}
.al-stock .big{font:700 30px/1 var(--f-display);letter-spacing:-.035em;font-variant-numeric:tabular-nums}
.al-stock .big small{font-size:13.5px;color:var(--mut);font-weight:600;margin-left:5px;letter-spacing:0}
@container main (max-width:520px){.al-board{grid-template-columns:minmax(0,1fr)}.al-box{padding:12px 14px}.al-paper{padding:12px}}
`);

/* ---------- petits composants ---------- */
function sq(icon,tone,cls){return '<span class="lb-sq '+(tone||'')+' '+(cls||'')+'">'+ICON(icon,cls==='sm'?'sm':'')+'</span>'}
function kpi(label,icon,val,sub,dom,tint){return '<div class="card lb-kpi'+(tint?' tint':'')+(dom?' d-'+dom:'')+'"><div class="lab"><span class="ico sm">'+ICON(icon,'sm')+'</span><span class="ellip">'+label+'</span></div><div class="val">'+val+'</div><div class="sub">'+sub+'</div></div>'}
/* tuile héros d'un écran : grand chiffre, sous-titre, illustration et actions */
function heroTile(o){return '<div class="card tint lb-hero d-'+(o.dom||'chevaux')+'"><div class="lb-hc"><div class="lb-eb">'+(o.icon?ICON(o.icon,'sm'):'')+o.eyebrow+'</div><div class="lb-hb"><span class="big">'+o.big+'</span><span class="lb-hu">'+o.unit+'</span></div>'+(o.sub?'<p class="lb-hs">'+o.sub+'</p>':'')+(o.stats?'<div class="lb-hst">'+o.stats.map(function(x){return '<div><b class="num">'+x[0]+'</b><span>'+x[1]+'</span></div>'}).join('')+'</div>':'')+(o.acts?'<div class="lb-ha">'+o.acts+'</div>':'')+'</div>'+(o.illu&&window.ILLU&&ILLU[o.illu]?'<div class="lb-hi lb-hi-'+o.illu+'">'+ILLU[o.illu]({size:null})+'</div>':'')+'</div>'}
/* robe du cheval : couleurs du portrait illustré */
var ROBE={'Alezan':'al','Alezan brûlé':'ab','Bai':'ba','Bai brun':'bb','Noir':'no','Gris':'gr','Palomino':'pa','Isabelle':'is','Rouan':'ro','Pie alezan':'pi'};
function portrait(h,cls){var ph=phMain(h);if(ph)return '<div class="hx-por ph '+(cls||'')+'"><img src="'+E(ph)+'" alt="'+E(h.name)+'" loading="lazy" decoding="async"></div>';var i=hi(h),nb=i%3===1&&h.coat!=='Pie alezan';return '<div class="hx-por r-'+(ROBE[h.coat]||'al')+(nb?' nb':'')+' '+(cls||'')+'">'+(window.ILLU?ILLU.cheval({size:null,cls:'hx-il'}):'')+'</div>'}
function cnt(n,fmt){return '<span data-count="'+n+'" data-fmt="'+(fmt||'')+'">'+(fmt==='eur'?F.eur(n):F.num(n))+'</span>'}
/* tableau maison : fusionne correctement les classes « n » et « hide-s » */
function T(cols,rows,o){o=o||{};function cl(c){var k=[c.n?'n':'',c.hide?'hide-s':''].join(' ').trim();return k?' class="'+k+'"':''}
  return '<div class="tw'+(o.card===false?'':' card')+'"><table class="tbl"><thead><tr>'+cols.map(function(c){return '<th'+cl(c)+(c.w?' style="width:'+c.w+'"':'')+'>'+c.l+'</th>'}).join('')+'</tr></thead><tbody>'+
   rows.map(function(r){return '<tr'+(o.click?' class="click" data-row="'+E(r[o.key||'id'])+'"':'')+'>'+cols.map(function(c){return '<td'+cl(c)+'>'+(c.f?c.f(r):E(r[c.k]))+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>'}
function LPH(a,b,c){return U.ph(a,b,c).replace('class="ph"','class="ph lb-ph"')}
var KL={club:'Club',proprietaire:'Propriétaire',demi:'Demi-pension'};
function kindChip(h){if(h.deal)return U.chip(h.deal==='pair'?'Mise au pair':'Commodat','navy');if(h.visitor)return U.chip('De passage','line');return U.chip(KL[h.kind],h.kind==='club'?'navy':h.kind==='demi'?'acc':'line')}
function stChip(h){return h.status==='bad'?U.chip('Urgent','bad',true):h.status==='warn'?U.chip('À surveiller','warn',true):U.chip('En forme','ok',true)}
function isRest(h){return h.status==='bad'||/repos/i.test(h.alerts.join(' '))}
function loadP(h){return Math.round(h.work/h.workMax*100)}
function loadC(h){var p=loadP(h);return p>100?'var(--bad)':p>=85?'var(--warn)':'var(--acc)'}
function hrs(v){var m=Math.round(v*60),hh=Math.floor(m/60),mm=m%60;return hh+' h'+(mm?' '+String(mm).padStart(2,'0'):'')}
function goOr(route,params,msg){if(P.mods[route])P.go(route,params);else P.toast(msg||'Cet écran arrive avec le reste de la démo',{icon:'info'})}
function norm(s){return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
/* transition douce d'un contenu qui change (onglet, segment) */
function swap(n){if(P.RM||!n)return;n.classList.remove('lb-sw');void n.offsetWidth;n.classList.add('lb-sw')}
function on(root,sel,fn){root.addEventListener('click',function(e){var t=e.target.closest(sel);if(t&&root.contains(t))fn(t,e)})}
function stepper(id,v,unit){return '<span class="lb-step" data-step="'+id+'"><button type="button" data-d="-1" title="Diminuer">'+ICON('minus','sm')+'</button><output data-v="'+v+'">'+String(v).replace('.',',')+' '+unit+'</output><button type="button" data-d="1" title="Augmenter">'+ICON('plus','sm')+'</button></span>'}
function bindSteppers(root,step,unit,cb){on(root,'[data-step] button',function(b){var o=b.parentNode.querySelector('output'),v=Math.max(0,Math.round((parseFloat(o.getAttribute('data-v'))+(+b.getAttribute('data-d'))*step)*10)/10);o.setAttribute('data-v',v);var u=b.parentNode.getAttribute('data-unit')||unit;o.textContent=String(v).replace('.',',')+' '+u;if(cb)cb(b.parentNode.getAttribute('data-step'),v)})}
function ownerLine(h){if(h.coowners&&h.coowners.length>1)return h.coowners.map(function(c){return D.name(c.id)+' ('+c.share+'\u00a0%)'}).join(', ');return h.owner?D.name(h.owner):h.coachOwner?D.name(h.coachOwner)+' (coach)':clubName()}

/* =====================================================================
   3. Cheptel
   ===================================================================== */
var LS={q:'',f:'all',sort:'box'};
var FILTERS=[['all','Tous',function(){return true}],['club','Club',function(h){return h.kind==='club'}],['proprietaire','Propriétaires',function(h){return h.kind==='proprietaire'}],['demi','Demi-pension',function(h){return h.kind==='demi'}],['poney','Poneys',function(h){return h.pony}],['repos','Au repos',isRest],['alerte','Alertes',function(h){return h.status!=='ok'||loadP(h)>100}]];
var SORTS={box:['Box',function(a,b){return a.box<b.box?-1:1}],name:['Nom',function(a,b){return a.name.localeCompare(b.name,'fr')}],load:['Charge de travail',function(a,b){return loadP(b)-loadP(a)}],cost:['Coût mensuel',function(a,b){return b.costMonth-a.costMonth}],care:['Prochain soin',function(a,b){return nextDue(a).n-nextDue(b).n}]};

function horseCard(h){var nd=nextDue(h),R=RULES[nd.k],p=loadP(h),over=p>100,nt=nd.n<0?'bad':nd.n<=RULES[nd.k].soon?'warn':'';
  return '<div class="card hx-c st-'+h.status+'" data-go="cheval" data-id="'+h.id+'" role="link" tabindex="0" aria-label="'+E(h.name)+', box '+h.box+'">'+
   '<div class="hx-top">'+portrait(h)+'<button class="hx-cam" data-phcap="'+h.id+'" title="Prendre '+E(h.name.split(' ')[0])+' en photo">'+ICON('photo','sm')+'</button><div class="hx-bx"><span class="num">'+h.box+'</span><small>'+(h.visitor?'De passage':h.deal?(h.deal==='pair'?'Mise au pair':'Commodat'):KL[h.kind])+'</small></div>'+pinBtn(h)+
    '<div class="hx-stt">'+stChip(h)+(isRest(h)&&h.status!=='bad'?U.chip('Au repos','line'):'')+(over?U.chip('Surcharge','bad'):'')+'</div></div>'+
   '<div class="hx-bd"><div><h3 class="ellip">'+E(h.name)+'</h3><div class="hx-sub ellip">'+h.breed+' · '+h.coat.toLowerCase()+' · '+h.age+' ans</div></div>'+
   (h.alerts.length?'<div class="hx-al '+(h.status==='bad'?'bad':'')+'">'+ICON('alert','sm')+'<span>'+E(h.alerts[0])+'</span></div>':'<div class="hx-al ok">'+ICON('checkc','sm')+'<span>'+E(h.mood)+', '+h.level.toLowerCase()+'</span></div>')+
   '<div class="hx-load"><div class="hrow"><span>Charge de la semaine</span><span><b>'+h.work+' h</b> sur '+h.workMax+' h</span></div>'+U.bar(Math.min(100,p),loadC(h))+'</div></div>'+
   '<div class="hx-foot"><span class="'+(nt?nt+'c':'')+'">'+ICON(R.icon,'sm')+'<span class="ellip">'+R.l+' '+dueTxt(nd.n)+'</span></span><span class="hx-cost" title="Coût de revient mensuel"><b>'+F.eur(h.costMonth)+'</b>/mois</span></div></div>'}

function horseTable(list){var cs=LS.cols||COLS.map(function(c){return c[0]});function has(k){return cs.indexOf(k)>=0}return T([
  {l:'Cheval',f:function(h){return '<div class="hrow">'+U.hav(h)+'<div style="min-width:0"><div class="b ellip">'+E(h.name)+'</div><div class="xs mut">'+h.breed+' · '+h.age+' ans</div></div></div>'}},
  has('box')&&{l:'Box',f:function(h){return '<span class="mono">'+h.box+'</span>'},hide:true},
  has('owner')&&{l:'Propriétaire',hide:true,f:function(h){return h.owner?'<span class="hrow" style="--g:8px">'+U.av(h.owner,'sm')+'<span>'+D.name(h.owner)+'</span></span>':kindChip(h)}},
  has('sante')&&{l:'Santé',f:function(h){return stChip(h)}},
  has('charge')&&{l:'Charge',f:function(h){return '<div class="hx-ld">'+U.bar(loadP(h),loadC(h))+'<span class="xs num"><b>'+h.work+'</b> / '+h.workMax+' h</span></div>'}},
  has('soin')&&{l:'Prochain soin',hide:true,f:function(h){var nd=nextDue(h);return '<span class="'+(nd.n<0?'badc b':nd.n<=RULES[nd.k].soon?'warnc b':'')+'">'+RULES[nd.k].l+' '+dueTxt(nd.n)+'</span>'}},
  has('cout')&&{l:'Coût par mois',n:true,hide:true,f:function(h){return '<b>'+F.eur(h.costMonth)+'</b>'}},
  {l:'<span class="hide-s">Épingle</span>',f:function(h){return pinBtn(h)}}].filter(Boolean),list,{click:true})}

var OWNOPT=DEMO?[['m031',D.name('m031')],['m047',D.name('m047')],['m052',D.name('m052')],['m066',D.name('m066')],['m078',D.name('m078')]]:[];
function ownOpts(){if(DEMO)return OWNOPT;return D.members.map(function(m){return [m.id,((m.first||'')+' '+(m.last||'')).trim()]})}
var KNOTE={proprietaire:'Le propriétaire paie la pension et garde l’usage de son cheval.',club:'Le cheval appartient au club et travaille en reprise.',demi:'Pension payée par le propriétaire, partagée avec un demi-pensionnaire.',pair:'Le cheval travaille en reprise en échange de sa pension, 12 h par semaine au plus. Le propriétaire garde ses créneaux.',commodat:'Prêt gratuit du cheval au club, qui l’entretient et l’utilise. Le propriétaire reste propriétaire et peut le reprendre avec préavis.'};
var KCON={proprietaire:['Envoyer le contrat de pension à signer','Modèle « Pension complète », 520 € par mois'],club:['Enregistrer la facture d’achat','Le cheval entre à l’inventaire du club'],demi:['Envoyer le contrat de pension à signer','Modèle « Pension complète » et annexe de demi-pension'],pair:['Envoyer le contrat de mise au pair à signer','Pension offerte contre 12 h de travail par semaine, assurance du club'],commodat:['Envoyer le contrat de commodat à signer','Prêt à usage gratuit, durée d’un an renouvelable, frais courants au club']};
function ownRow(id,share,i){return '<div class="cv-own" data-own><select class="in" data-ow title="Propriétaire">'+ownOpts().map(function(o){return '<option value="'+o[0]+'"'+(o[0]===id?' selected':'')+'>'+o[1]+'</option>'}).join('')+'</select><span class="hrow" style="--g:4px"><input class="in num" data-sh type="number" min="1" max="100" value="'+share+'" title="Part en pourcentage" style="text-align:right"><span class="s mut">%</span></span>'+(i?'<button type="button" class="btn ghost icon sm" data-delown title="Retirer ce copropriétaire">'+ICON('x','sm')+'</button>':'<span></span>')+'</div>'}
function addHorseSheet(){
  var found=null;
  var sh=P.sheet({title:'Ajouter un cheval',icon:'horse',body:function(b){
    b.innerHTML='<div class="stack" style="--g:16px"><div class="field"><span>Numéro SIRE ou UELN</span><div class="hx-sire"><input class="in" id="hx-sire" value="15 436 229 V" autocomplete="off" inputmode="text"><button class="btn dark" data-find>'+ICON('search','sm')+'Chercher</button></div>'+
      '<span class="xs mut" style="font-weight:400">Stabl interroge le fichier des équidés en open data de l’IFCE et remplit la fiche pour vous.</span></div>'+
      '<div id="hx-res"></div><div class="hr"></div>'+
      '<button class="btn ghost" data-manual-add style="justify-content:flex-start">'+ICON('edit','sm')+'Saisir la fiche à la main</button>'+
      '<button class="btn ghost" data-scan style="justify-content:flex-start">'+ICON('scan','sm')+'Lire le transpondeur avec le téléphone</button></div>'},
   foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-add disabled>'+ICON('plus','sm')+'Ajouter au cheptel</button>'});
  var res=sh.querySelector('#hx-res'),addB=sh.querySelector('[data-add]');
  function form(pre){found=pre;res.innerHTML='<div class="stack pop" style="--g:14px">'+(pre.src?'<div class="hx-found"><div class="hrow"><span class="strass"></span><b class="s">Fiche trouvée à l’IFCE</b><span class="chip acc" style="margin-left:auto">Open data</span></div>'+
      '<dl class="lb-dl" style="margin:0">'+[['Nom',pre.name],['Race',pre.breed],['Sexe et robe',pre.sex+', '+pre.coat.toLowerCase()],['Naissance','14 avril 2017 (9 ans)'],['Père','Kannan'],['Mère','Bohème de Brecey'],['UELN','<span class="mono">25000115436229V</span>'],['Naisseur','Haras du Verger, Calvados']].map(function(x){return '<div><dt>'+x[0]+'</dt><dd>'+x[1]+'</dd></div>'}).join('')+'</dl>'+
      '<span class="xs mut">La fiche en ligne de l’IFCE fait seule autorité. Aucune donnée personnelle du propriétaire n’est récupérée.</span></div>':
      '<div class="g2" style="--g:12px"><label class="field"><span>Nom</span><input class="in" id="hx-n" value="'+E(pre.name)+'"></label><label class="field"><span>Race</span><input class="in" value="'+E(pre.breed)+'"></label></div>')+
     '<div class="g2" style="--g:12px"><label class="field"><span>Statut</span><select class="in" id="hx-kind"><option value="proprietaire">Pension de propriétaire</option><option value="club">Cheval de club</option><option value="demi">Demi-pension</option><option value="pair">Mise au pair</option><option value="commodat">Commodat (prêt à usage)</option></select></label>'+
     '<label class="field"><span>Box</span><select class="in" id="hx-box">'+(freeBoxes().length?freeBoxes().map(function(b){return '<option>'+b+'</option>'}).join(''):'<option>Liste d’attente</option>')+'</select></label></div>'+
     '<div class="xs mut" id="hx-kn" style="margin-top:-6px">'+KNOTE.proprietaire+'</div>'+
     '<div class="field" id="hx-ownf"><span>Copropriétaires et parts</span><div class="stack" style="--g:8px" id="hx-owns">'+ownRow((ownOpts()[0]||[''])[0],100,0)+'</div>'+
     '<div class="hrow sp wrap" style="--g:8px"><button type="button" class="btn ghost sm" data-addown>'+ICON('plus','sm')+'Ajouter un copropriétaire</button><span class="xs b" id="hx-tot"></span></div></div>'+
     '<div class="g2" style="--g:12px">'+
     '<label class="field"><span>Arrivée</span><input class="in" type="date" value="'+iso(0)+'"></label></div>'+
     '<div class="card flat list"><div class="li"><div class="grow"><div class="t">Reprendre le calendrier de soins du carnet</div><div class="s">Vaccins, vermifuges et ferrure, rappels créés d’office</div></div>'+U.tog(true)+'</div>'+
     '<div class="li"><div class="grow"><div class="t" id="hx-ct">Envoyer le contrat de pension à signer</div><div class="s" id="hx-cs">Modèle « Pension complète », 520 € par mois</div></div>'+U.tog(true)+'</div></div>'+
     '<div class="note">'+ICON('info','sm')+'<span>Pensez à déclarer le nouveau lieu de détention au SIRE dans les 30 jours. Stabl vous le rappellera le '+F.dateL(iso(21))+'.</span></div></div>';
    addB.disabled=false;wireOwn()}
  function wireOwn(){var ks=sh.querySelector('#hx-kind');if(!ks)return;
    ks.onchange=function(){var k=ks.value,c=KCON[k];sh.querySelector('#hx-kn').textContent=KNOTE[k];sh.querySelector('#hx-ownf').style.display=k==='club'?'none':'';sh.querySelector('#hx-ct').textContent=c[0];sh.querySelector('#hx-cs').textContent=c[1];tot()};
    sh.querySelector('#hx-owns').addEventListener('input',tot);sh.querySelector('#hx-owns').addEventListener('change',tot);
    sh.querySelector('[data-addown]').onclick=function(){var rows=sh.querySelectorAll('[data-own]');if(rows.length>=4)return;var first=rows[0].querySelector('[data-sh]');if(rows.length===1&&+first.value===100)first.value=60;
      var used=P.$$('[data-ow]',sh).map(function(s){return s.value}),nx=ownOpts().find(function(o){return o[0]&&used.indexOf(o[0])<0});
      var d=document.createElement('div');d.innerHTML=ownRow(nx?nx[0]:'',Math.max(0,100-P.$$('[data-sh]',sh).reduce(function(a,x){return a+(+x.value||0)},0)),rows.length);sh.querySelector('#hx-owns').appendChild(d.firstChild);tot()};
    sh.querySelector('#hx-owns').addEventListener('click',function(e){var b=e.target.closest('[data-delown]');if(!b)return;b.closest('[data-own]').remove();var rows=sh.querySelectorAll('[data-own]');if(rows.length===1)rows[0].querySelector('[data-sh]').value=100;tot()});
    tot()}
  function tot(){var k=sh.querySelector('#hx-kind').value,s=P.$$('[data-sh]',sh).reduce(function(a,x){return a+(+x.value||0)},0),n=sh.querySelectorAll('[data-own]').length,el=sh.querySelector('#hx-tot');
    el.className='xs b '+(s===100?'okc':'badc');el.textContent=n>1?'Total '+s+'\u00a0%'+(s===100?', facture de pension répartie au prorata':', à ramener à 100\u00a0%'):'';addB.disabled=k!=='club'&&s!==100}
  function find(){res.innerHTML='<div class="card flat pad stack" style="--g:10px"><div class="hrow s mut">'+ICON('refresh','sm')+'Recherche dans le fichier des équidés…</div><div class="skel" style="height:14px;width:70%"></div><div class="skel" style="height:14px;width:48%"></div><div class="skel" style="height:14px;width:60%"></div></div>';
    setTimeout(function(){if(!sh.isConnected)return;form({src:true,name:'Bohème du Verger',breed:'Selle Français',sex:'Jument',coat:'Alezan'})},P.RM?60:800)}
  sh.querySelector('[data-find]').onclick=find;
  sh.querySelector('#hx-sire').onkeydown=function(e){if(e.key==='Enter')find()};
  sh.querySelector('[data-manual-add]').onclick=function(){form({name:'Nouveau cheval',breed:'Selle Français',sex:'Hongre',coat:'Bai'});var n=sh.querySelector('#hx-n');if(n){n.focus();n.select()}};
  sh.querySelector('[data-scan]').onclick=function(){P.toast('Puce 250259806114372 lue sur l’encolure gauche',{icon:'scan'});sh.querySelector('#hx-sire').value='15 436 229 V';find()};
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
  addB.onclick=function(){var n=sh.querySelector('#hx-n'),name=(n&&n.value.trim())||found.name,kv=sh.querySelector('#hx-kind').value,deal=kv==='pair'||kv==='commodat'?kv:null,kind=deal?'club':kv,box=sh.querySelector('#hx-box').value;
    var co=kv==='club'?[]:P.$$('[data-own]',sh).map(function(r){return {id:r.querySelector('[data-ow]').value,share:+r.querySelector('[data-sh]').value||0}}).filter(function(c){return c.id}),own=co.length?co[0].id:'';
    if(D.horses.some(function(h){return h.name===name})){P.toast(name+' est déjà dans le cheptel',{icon:'info'});return}
    var id='h'+(D.horses.length+1);
    D.horses.push({id:id,name:name,breed:found.breed,pony:false,sex:found.sex,age:9,born:2017,coat:found.coat,height:166,kind:kind,box:box,sire:'25025915436229V',chip:'250259806114372',level:'Galop 6-7',work:0,workMax:16,weight:545,bcs:3,mood:'Volontaire',
      ration:{hay:9,grain:2,supp:'Aucun'},paddock:'Prairie du bas',costMonth:410,vacc:iso(-96),worm:iso(-40),farrier:iso(-12),dentist:iso(-150),osteo:iso(-60),status:'ok',alerts:[],color:'var(--c1)',owner:own||undefined,deal:deal||undefined,coowners:co.length>1?co:undefined});
    sh.close();LS.f='all';LS.q='';LS.sort='box';P.rerender();
    P.toast(name+' est au box '+box+(deal?', '+(deal==='pair'?'en mise au pair':'en commodat'):'')+'. '+(co.length>1?'Pension répartie entre '+co.map(function(c){return D.name(c.id).split(' ')[0]+' ('+c.share+'\u00a0%)'}).join(' et ')+'. ':'')+'Sa fiche et ses rappels de soins sont prêts.',{icon:'checkc'});
    setTimeout(function(){var c=P.$('.hx-c[data-id="'+id+'"],[data-row="'+id+'"]',P.app());if(c){c.scrollIntoView({block:'center',behavior:P.RM?'auto':'smooth'});c.classList.add('pop')}},80)};
  return sh}

function importSheet(){
  var MAP=[['Nom du cheval','Nom'],['N° SIRE','Numéro SIRE'],['Puce','Transpondeur'],['Proprio','Propriétaire'],['Box','Box'],['Dernier vaccin','Vaccin grippe'],['Dernier ferrage','Maréchal'],['Foin kg','Ration, foin']];
  var sh=P.sheet({title:'Importer des chevaux en lot',icon:'upload',body:function(b){
    b.innerHTML='<div class="stack" style="--g:16px"><button class="lb-drop" data-file>'+ICON('upload','lg')+'<b>Déposez un fichier CSV ou Excel</b><span class="s mut">Export Kavalog, Equimondo, tableur maison ou liste FFE. Stabl reconnaît les colonnes tout seul.</span><span class="btn sm" style="margin-top:4px">Choisir un fichier</span></button><div id="hx-imp"></div></div>'},
   foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-run disabled>Importer</button>'});
  var z=sh.querySelector('#hx-imp'),run=sh.querySelector('[data-run]');
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
  sh.querySelector('[data-file]').onclick=function(){
    z.innerHTML='<div class="stack pop" style="--g:14px"><div class="lb-row card flat" style="padding:10px 14px">'+sq('doc')+'<div class="grow"><div class="t">cheptel-tilleuls-2026.xlsx</div><div class="s">14 lignes, 8 colonnes · lu en 0,4 seconde</div></div>'+U.chip('Prêt','ok',true)+'</div>'+
     '<div><div class="eyebrow" style="margin-bottom:8px">Colonnes reconnues</div><div class="hx-map">'+MAP.map(function(m){return '<span class="src">'+m[0]+'</span>'+ICON('arrow','sm')+'<span class="b">'+m[1]+'</span>'}).join('')+'</div></div>'+
     '<div class="card flat"><div class="lb-row">'+sq('checkc','ok','sm')+'<div class="grow"><div class="t">12 chevaux prêts à importer</div><div class="s">11 retrouvés à l’IFCE par leur numéro SIRE, identité complétée</div></div></div>'+
     '<div class="lb-row">'+sq('alert','warn','sm')+'<div class="grow"><div class="t">1 numéro SIRE à vérifier</div><div class="s">Ligne 9, « Havane » : un chiffre manque. Importée sans rapprochement.</div></div></div>'+
     '<div class="lb-row">'+sq('copy','mut','sm')+'<div class="grow"><div class="t">2 doublons ignorés</div><div class="s">Vanille et Tango existent déjà dans le cheptel</div></div></div></div></div>';
    run.disabled=false;run.innerHTML=ICON('upload','sm')+'Importer 12 chevaux'};
  run.onclick=function(){run.disabled=true;z.innerHTML='<div class="card flat pad stack" style="--g:10px"><div class="hrow sp"><b class="s">Import en cours</b><span class="s mut num" id="hx-pc">0 sur 12</span></div><div class="bar"><i id="hx-pb" style="--v:0%"></i></div></div>';
    var n=0,pb=z.querySelector('#hx-pb'),pc=z.querySelector('#hx-pc');(function tick(){n++;if(!sh.isConnected)return;pb.style.setProperty('--v',(n/12*100)+'%');pc.textContent=n+' sur 12';
      if(n<12)setTimeout(tick,P.RM?10:110);else setTimeout(function(){sh.close();P.toast('12 chevaux importés. Ils attendent un box dans « Import ».',{icon:'checkc',undo:function(){P.toast('Import annulé, rien n’a été ajouté',{icon:'refresh'})}})},350)})()};
  return sh}

/* =====================================================================
   Manche 2 : chevaux déclarés, vues enregistrées, épingles,
   écran de la sellerie, reproduction, lecture d'étiquette
   ===================================================================== */
P.css(`
.cv-ban{display:flex;align-items:center;gap:14px;padding:12px 14px 12px 16px;border-radius:var(--r-lg);background:var(--acc-pale);box-shadow:inset 0 0 0 1px var(--acc-line);text-align:left;width:100%;transition:box-shadow var(--t-2)}
.cv-ban:hover{box-shadow:inset 0 0 0 1.5px var(--acc)}
.cv-ban .grow{min-width:0}
.cv-ban b{display:block;font-size:14px}
.cv-dc{border-radius:var(--r-lg);box-shadow:inset 0 0 0 1px var(--line);padding:16px;display:flex;flex-direction:column;gap:14px;background:var(--surface)}
.cv-dc.done{background:var(--surface-2)}
.cv-dc h3{font-size:17px;letter-spacing:-.02em}
.cv-pin{position:absolute;top:10px;right:10px;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;color:var(--mut-2);transition:color var(--t-1),background var(--t-1)}
.cv-pin:hover{background:var(--bg-2);color:var(--ink)}
.cv-pin[aria-pressed="true"]{color:var(--warn)}
.cv-pin[aria-pressed="true"] svg.i{fill:currentColor}
.hx-c{position:relative}.hx-c .hx-top{padding-right:30px}
.tbl .cv-pin{position:static;margin:-4px 0}
.cv-pins{padding:12px 14px}
.cv-pins .hd{display:flex;align-items:center;gap:8px;margin-bottom:10px}
.cv-pl{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:2px}
.cv-pi{flex:none;display:flex;align-items:center;gap:10px;padding:8px 12px 8px 8px;border-radius:var(--r-md);background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);width:250px;max-width:78%;text-align:left;color:var(--ink);cursor:pointer;text-decoration:none}
.cv-pi:hover{box-shadow:inset 0 0 0 1px var(--line-2)}
.cv-pi .grow{min-width:0}
.cv-vw{display:flex;align-items:center;gap:8px;flex-wrap:nowrap;min-width:0}
.cv-vw .scroll-x{min-width:0}
.cv-vw .tag svg.i{width:14px;height:14px}
.cv-cols{display:flex;flex-wrap:wrap;gap:6px}
.cv-own{display:grid;grid-template-columns:minmax(0,1fr) 92px 34px;gap:8px;align-items:center}
.cv-hr{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;padding:14px 16px}
.cv-hr .fc-ring{width:100%}
.cv-rb{display:flex;flex-direction:column;gap:10px}
.cv-term{position:relative;height:12px;border-radius:99px;background:var(--bg-2);overflow:hidden}
.cv-term i{position:absolute;left:0;top:0;bottom:0;border-radius:99px;background:linear-gradient(90deg,var(--c5),var(--acc));transform-origin:left;animation:cvgrow .9s var(--e-out) both}
@keyframes cvgrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.cv-mk{display:flex;justify-content:space-between;font-size:13px;color:var(--mut)}
.cv-lbl{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.cv-lbl div{padding:10px 12px;border-radius:var(--r-md);background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line)}
.cv-lbl b{display:block;font:700 18px/1.15 var(--f-display);font-variant-numeric:tabular-nums}
.cv-lbl span{font-size:13px;color:var(--mut)}
.cv-lbl em{font-style:normal;font-size:13px;font-weight:600}
@container main (max-width:760px){.cv-hr{grid-template-columns:repeat(2,minmax(0,1fr))}}
@container main (max-width:520px){.cv-ban{flex-wrap:wrap}.cv-ban .btn{width:100%}.cv-lbl{grid-template-columns:repeat(2,minmax(0,1fr))}.cv-own{grid-template-columns:minmax(0,1fr) 80px 34px}}
`);

/* ---------- Chevaux déclarés par les adhérents et les coachs (D.declarations) ---------- */
function deN(n){return (/^[aeiouyhéèêâîô]/i.test(n)?'d’':'de ')+n}
function pendingDecl(){return (D.declarations||[]).filter(function(x){return x.status==='en attente'})}
function openDecl(){return (D.declarations||[]).filter(function(x){return x.status!=='refusée'})}
function freeBoxes(){var used={};D.horses.forEach(function(h){used[h.box]=1});var o=[];for(var i=1;i<=D.club.boxes;i++){var b='B'+String(i).padStart(2,'0');if(!used[b])o.push(b)}return o}
function declBanner(){var p=pendingDecl(),askL=(D.declarations||[]).filter(function(x){return x.status==='précision demandée'}),asked=askL.length;if(!p.length&&!asked)return '';
 var who=p.concat(askL).map(function(x){return x.by}).filter(function(v,i,a){return a.indexOf(v)===i});
 return '<button class="card tint d-cavaliers lb-kpi cv-ban" data-decl><div class="lab"><span class="ico sm">'+ICON('horse','sm')+'</span><span class="ellip">Chevaux déclarés</span></div>'+
  '<div class="val">'+(p.length||asked)+'<small>'+(p.length?(p.length>1?'à valider':'à valider'):'en attente')+'</small></div>'+
  '<div class="sub">'+(p.length?p.map(function(x){return E(x.name)}).join(' et ')+', par '+who.slice(0,p.length).map(function(id){return D.name(id).split(' ')[0]}).join(' et ')+(asked?' · '+plural(asked,'précision demandée','précisions demandées'):''):askL.map(function(x){return E(x.name)+', réponse attendue de '+D.name(x.by)}).join(' · '))+'</div>'+
  '<div class="cv-bf">'+U.avs(who,3)+'<span class="btn sm pri">Vérifier'+ICON('arrow','sm')+'</span></div></button>'}
function declSheet(after){var ask={};
 var sh=P.sheet({title:'Chevaux déclarés',icon:'horse',wide:true,body:function(b){paint(b)},onClose:function(){if(after)after()}});
 function paint(b){b=b||sh.querySelector('.sb');var L=openDecl(),fb=freeBoxes();
  if(!L.length){b.innerHTML=U.empty('checkc','Aucune déclaration en attente','Les chevaux déclarés depuis l’application des adhérents et des coachs arrivent ici.');return}
  b.innerHTML='<p class="s mut" style="margin-bottom:14px">Les adhérents et les coachs déclarent leur cheval depuis leur application. Relisez l’identité retrouvée à l’IFCE, choisissez le box, puis créez la fiche.</p><div class="stack" style="--g:14px">'+L.map(function(x){var p=D.person(x.by),done=x.status==='validée',stay=x.stay==='pension',bx=x.boxPick||(fb.indexOf(x.box)>=0?x.box:fb[0]);
   var st=done?U.chip('Fiche créée','ok',true):x.status==='précision demandée'?U.chip('Précision demandée','warn',true):U.chip('En attente de validation','acc',true);
   return '<div class="cv-dc'+(done?' done':'')+'" data-dc="'+x.id+'"><div class="hrow sp wrap" style="--g:8px"><div class="hrow" style="--g:10px;min-width:0">'+U.hav({name:x.name,color:'var(--c5)'})+'<div style="min-width:0"><h3 class="ellip">'+E(x.name)+'</h3><div class="xs mut">Déclaré '+(x.when?x.when.toLowerCase().replace(/^(\D+), /,'$1 à ').replace(/(\d{1,2}:\d{2})/,function(m){return hm(m)}):'')+'</div></div></div>'+st+'</div>'+
    '<div><div class="eyebrow" style="margin-bottom:8px">Identité relue à l’IFCE</div><dl class="lb-dl" style="margin:0;grid-template-columns:repeat(3,minmax(0,1fr))">'+[['Numéro SIRE','<span class="mono">'+x.sire+'</span>'],['Transpondeur','<span class="mono">'+x.chip+'</span>'],['Race',x.breed],['Robe',x.coat],['Naissance',x.born+' ('+(2026-x.born)+' ans)'],['Contrôle','<span class="okc">'+ICON('checkc','sm')+' Conforme</span>']].map(function(a){return '<div><dt>'+a[0]+'</dt><dd>'+a[1]+'</dd></div>'}).join('')+'</dl></div>'+
    '<div class="g2" style="--g:12px"><div><div class="eyebrow" style="margin-bottom:8px">Propriétaire</div><div class="hrow" style="--g:10px">'+U.av(x.by)+'<div style="min-width:0"><div class="b s ellip">'+(p?p.first+' '+p.last:'')+'</div><div class="xs mut ellip">'+x.link+(p&&p.phone?' · '+p.phone:'')+'</div></div></div></div>'+
     '<div><div class="eyebrow" style="margin-bottom:8px">Hébergement</div>'+(stay?(done?'<div class="s"><b>Box '+x.boxDone+'</b>, pension complète</div>':'<div class="hrow" style="--g:8px"><select class="in" data-bx="'+x.id+'" style="width:auto" title="Box proposé">'+fb.map(function(v){return '<option'+(v===bx?' selected':'')+'>'+v+'</option>'}).join('')+'</select><span class="xs mut">Pension complète, '+F.eur(520)+' par mois</span></div>'+(x.box&&fb.indexOf(x.box)<0?'<div class="xs mut" style="margin-top:6px">Le box '+x.box+' demandé est occupé : '+bx+' est proposé.</div>':'')):'<div class="s"><b>De passage</b>, hébergé dans une autre écurie</div><div class="xs mut">Accès aux pistes et aux cours, sans box</div>')+'</div></div>'+
    (ask[x.id]&&!done?'<div class="stack" style="--g:8px"><textarea class="in" data-askt="'+x.id+'" rows="3">Bonjour '+(p?p.first:'')+', pouvez-vous joindre la carte d’immatriculation de '+x.name+' et l’attestation d’assurance responsabilité civile ? Merci. Claire</textarea><div class="hrow" style="--g:8px;justify-content:flex-end"><button class="btn sm ghost" data-askx="'+x.id+'">Annuler</button><button class="btn sm pri" data-asks="'+x.id+'">'+ICON('send','sm')+'Envoyer la demande</button></div></div>':'')+
    (done?'<div class="hrow" style="--g:8px"><button class="btn sm" data-open="'+x.horse+'">Ouvrir la fiche'+ICON('arrow','sm')+'</button></div>':ask[x.id]?'':'<div class="hrow wrap" style="--g:8px;justify-content:flex-end"><button class="btn" data-ask="'+x.id+'">'+ICON('chat','sm')+'Demander une précision</button><button class="btn pri" data-ok="'+x.id+'">'+ICON('check','sm')+'Valider et créer la fiche</button></div>')+'</div>'}).join('')+'</div>'}
 function find(id){return (D.declarations||[]).find(function(x){return x.id===id})}
 sh.addEventListener('change',function(e){var s=e.target.closest('[data-bx]');if(s)find(s.getAttribute('data-bx')).boxPick=s.value});
 on(sh,'[data-ask]',function(b){ask[b.getAttribute('data-ask')]=1;paint()});
 on(sh,'[data-askx]',function(b){delete ask[b.getAttribute('data-askx')];paint()});
 on(sh,'[data-asks]',function(b){var x=find(b.getAttribute('data-asks'));delete ask[x.id];x.status='précision demandée';paint();P.toast('Demande envoyée à '+D.name(x.by)+' par notification et e-mail',{icon:'send'})});
 on(sh,'[data-open]',function(b){var id=b.getAttribute('data-open');sh.close();P.go('cheval',{id:id})});
 on(sh,'[data-ok]',function(b){var x=find(b.getAttribute('data-ok')),fb=freeBoxes(),stay=x.stay==='pension',bx=stay?(x.boxPick||(fb.indexOf(x.box)>=0?x.box:fb[0])):'Passage';
  if(stay&&!bx){P.toast('Plus aucun box libre : libérez un box ou choisissez « De passage »',{icon:'alert'});return}
  var n=1;D.horses.forEach(function(h){var k=+h.id.slice(1);if(k>=n)n=k+1});var id='h'+(n<10?'0':'')+n,coach=!D.member(x.by);
  D.horses.push({id:id,name:x.name,breed:x.breed,pony:/Poney|Connemara|Welsh|Shetland|Haflinger/.test(x.breed),sex:'Hongre',age:2026-x.born,born:x.born,coat:x.coat,height:166,kind:'proprietaire',box:bx,sire:x.sire,chip:x.chip,level:'Confirmé',work:0,workMax:16,weight:540,bcs:3,mood:'Volontaire',
   ration:{hay:9,grain:2,supp:'Aucun'},paddock:'Prairie du haut',costMonth:420,vacc:iso(-80),worm:iso(-35),farrier:iso(-20),dentist:iso(-160),osteo:iso(-70),status:'ok',alerts:[],color:'var(--c5)',owner:coach?undefined:x.by,coachOwner:coach?x.by:undefined,visitor:!stay,declared:x.id});
  x.status='validée';x.horse=id;x.boxDone=bx;paint();if(P.renderBadges)P.renderBadges();
  P.toast('Fiche de '+x.name+' créée'+(stay?' au box '+bx:', cheval de passage')+'. Notification envoyée à '+D.name(x.by),{icon:'checkc'})})}

/* ---------- Épingles et vues enregistrées ---------- */
function pins(){return P.prefs.get('chevaux:pins',DEMO?['h23','h04']:[])}
function isPinned(id){return pins().indexOf(id)>=0}
function togglePin(id){var p=pins().slice(),i=p.indexOf(id);if(i<0)p.unshift(id);else p.splice(i,1);P.prefs.set('chevaux:pins',p);return i<0}
function pinBtn(h){var on=isPinned(h.id);return '<button class="cv-pin" data-pin="'+h.id+'" aria-pressed="'+on+'" title="'+(on?'Retirer des épinglés':'Épingler '+E(h.name))+'">'+ICON('star','sm')+'</button>'}
function pinsCard(){var L=pins().map(function(id){return D.horse(id)}).filter(Boolean);if(!L.length)return '';
 return '<div class="card cv-pins"><div class="hd"><span class="ico sm d-mo">'+ICON('star','sm')+'</span><b class="s">Épinglés</b><span class="chip">'+L.length+'</span><span class="xs mut" style="margin-left:auto">Touchez l’étoile d’une fiche pour l’ajouter</span></div><div class="cv-pl scroll-x">'+L.map(function(h){var nd=nextDue(h);return '<a class="cv-pi" data-go="cheval" data-id="'+h.id+'">'+portrait(h)+'<span class="grow"><b class="s ellip" style="display:block">'+E(h.name)+'</b><span class="xs mut ellip" style="display:block">'+(h.alerts[0]?E(h.alerts[0]):h.box+' · '+RULES[nd.k].l.toLowerCase()+' '+dueTxt(nd.n))+'</span></span>'+(h.status!=='ok'?'<i class="dot" style="width:8px;height:8px;border-radius:50%;flex:none;background:'+(h.status==='bad'?'var(--bad)':'var(--warn)')+'"></i>':'')+'</a>'}).join('')+'</div></div>'}
var COLS=[['box','Box'],['owner','Propriétaire'],['sante','Santé'],['charge','Charge'],['soin','Prochain soin'],['cout','Coût par mois']];
function views(){return P.prefs.get('chevaux:views',[{id:'v1',name:'Poneys de club',f:'poney',sort:'load',view:'table',cols:['box','sante','charge','soin'],scope:'partagée'},{id:'v2',name:'Soins à prévoir',f:'all',sort:'care',view:'table',cols:['box','owner','soin'],scope:'personnelle'}])}
function viewSheet(after){var f=LS.f,s=LS.sort,v=P.prefs.get('chevaux:view','cards'),cols=(LS.cols||COLS.map(function(c){return c[0]})).slice(),scope='personnelle',fl=FILTERS.find(function(x){return x[0]===f});
 var sh=P.sheet({title:'Enregistrer cette vue',icon:'layers',body:'<div class="stack" style="--g:14px"><label class="field"><span>Nom de la vue</span><input class="in" id="cv-vn" value="'+E((fl?fl[1]:'Tous')+', par '+SORTS[s][0].toLowerCase())+'"></label>'+
   '<div class="g2" style="--g:12px"><label class="field"><span>Filtre</span><select class="in" id="cv-vf">'+FILTERS.map(function(x){return '<option value="'+x[0]+'"'+(x[0]===f?' selected':'')+'>'+x[1]+'</option>'}).join('')+'</select></label><label class="field"><span>Tri</span><select class="in" id="cv-vs">'+Object.keys(SORTS).map(function(k){return '<option value="'+k+'"'+(k===s?' selected':'')+'>'+SORTS[k][0]+'</option>'}).join('')+'</select></label></div>'+
   '<div class="field"><span>Affichage</span>'+U.seg([['cards','Cartes'],['table','Tableau']],v,'data-vv')+'</div>'+
   '<div class="field"><span>Colonnes du tableau</span><div class="cv-cols">'+COLS.map(function(c){return '<button class="tag" data-vc="'+c[0]+'" aria-pressed="'+(cols.indexOf(c[0])>=0)+'">'+c[1]+'</button>'}).join('')+'</div></div>'+
   (LS.q?'<div class="note">'+ICON('search','sm')+'<span>La recherche « '+E(LS.q)+'» est enregistrée avec la vue.</span></div>':'')+
   '<div class="field"><span>Visibilité</span>'+U.seg([['personnelle','Pour moi'],['partagée','Partagée avec l’équipe']],scope,'data-vsc')+'</div></div>',
  foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-save>'+ICON('check','sm')+'Enregistrer la vue</button>'});
 on(sh,'[data-vv]',function(b){v=b.getAttribute('data-vv')});on(sh,'[data-vsc]',function(b){scope=b.getAttribute('data-vsc')});
 sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
 sh.querySelector('[data-save]').onclick=function(){var name=sh.querySelector('#cv-vn').value.trim()||'Ma vue',cs=P.$$('[data-vc]',sh).filter(function(x){return x.getAttribute('aria-pressed')==='true'}).map(function(x){return x.getAttribute('data-vc')});
  var vw={id:'v'+Date.now().toString(36),name:name,f:sh.querySelector('#cv-vf').value,sort:sh.querySelector('#cv-vs').value,view:v,cols:cs,q:LS.q||'',scope:scope},L=views().slice();L.push(vw);P.prefs.set('chevaux:views',L);
  applyView(vw);sh.close();if(after)after();P.toast('Vue « '+name+' » enregistrée'+(scope==='partagée'?' et partagée avec l’équipe':', visible par vous seule'),{icon:'layers',undo:function(){P.prefs.set('chevaux:views',views().filter(function(x){return x.id!==vw.id}));LS.v='';P.rerender()}})}}
function applyView(vw){LS.v=vw.id;LS.f=vw.f;LS.sort=vw.sort;LS.q=vw.q||'';LS.cols=vw.cols&&vw.cols.length?vw.cols.slice():null;P.prefs.set('chevaux:view',vw.view)}

/* ---------- Écran de la sellerie : consignes et distribution (le cadre est dans le module planning) ---------- */
P.sellerieParts=P.sellerieParts||{};
P.sellerieParts.consignes=function(){var o=[];D.horses.filter(function(h){return h.status==='bad'}).forEach(function(h){o.push({i:'alert',c:'bad',t:'<b>'+E(h.name)+'</b> ('+h.box+') : '+E(h.alerts[0].charAt(0).toLowerCase()+h.alerts[0].slice(1))})});
 D.horses.filter(function(h){return h.status!=='bad'&&isRest(h)}).forEach(function(h){o.push({i:'horse',c:'warn',t:'<b>'+E(h.name)+'</b> reste au box : '+E((h.alerts.find(function(a){return /repos/i.test(a)})||'repos').toLowerCase())})});
 Object.keys(CONS).slice(0,3).forEach(function(id){var h=D.horse(id);if(h&&h.status==='ok')o.push({i:'feed',c:'',t:'<b>'+E(h.name)+'</b> : '+E(CONS[id].charAt(0).toLowerCase()+CONS[id].slice(1))})});
 return o};
P.sellerieParts.distribution=function(t){var meal=t<12*60?'midi':t<18*60?'soir':'matin',ml=MEALS.find(function(m){return m[0]===meal}),list=D.horses.slice().sort(function(a,b){return a.box<b.box?-1:1}),done=list.filter(function(h){return ST.fed[meal][h.id]}).length,tot=list.reduce(function(a,h){var m=meals(h)[meal];a.h+=m.hay;a.g+=m.grain;return a},{h:0,g:0});
 var spec=list.filter(function(h){return (MEDS[h.id]||{})[meal]||CONS[h.id]}).sort(function(a,b){return (((MEDS[b.id]||{})[meal])?1:0)-(((MEDS[a.id]||{})[meal])?1:0)}).slice(0,6);
 return {title:'Distribution du '+ml[1].toLowerCase()+', '+ml[2],sub:done+' sur '+list.length+' boxes',
  html:'<div class="sl-c">'+ICON('hay','sm')+'<span><b>'+kg(tot.h)+' kg de foin</b> et <b>'+kg(tot.g)+' kg de granulés</b> à préparer, environ '+Math.ceil(tot.h/12)+' brouettes</span></div>'+
   spec.map(function(h){var m=meals(h)[meal],md=(MEDS[h.id]||{})[meal];return '<div class="sl-c '+(md?'warn':'')+'">'+ICON(md?'pill':'info','sm')+'<span><b>'+h.box+' · '+E(h.name.split(' ')[0])+'</b> : '+kg(m.hay)+' kg de foin'+(m.grain?', '+kg(m.grain)+' kg':'')+'. '+E(md||CONS[h.id])+'</span></div>'}).join('')+
   '<div class="sl-c">'+ICON('check','sm')+'<span>Les '+(list.length-spec.length)+' autres boxes reçoivent leur ration habituelle, affichée sur l’étiquette de chaque porte.</span></div>'}};

/* ---------- Reproduction des juments ---------- */
D.breeding=D.breeding||{
 h22:{stage:'pleine',stallion:'Tenor du Bocage (Selle Français)',mode:'Insémination en semence congelée',cover:'2026-04-12',echo:[['2026-04-26','Échographie à 14 jours : gestation confirmée, un seul embryon'],['2026-05-10','Échographie à 28 jours : cœur fœtal visible'],['2026-06-29','Échographie à 78 jours : développement normal']],vacc:[['Rhinopneumonie, 5e mois','2026-09-09',true],['Rhinopneumonie, 7e mois','2026-11-08',true],['Rhinopneumonie, 9e mois','2027-01-07',false]],alert:false},
 h30:{stage:'chaleurs',heats:['2026-09-21','2026-10-12','2026-11-02'],plan:'Saillie au printemps 2027, étalon à choisir avec Marion',alert:false}};
function elevageOn(){return P.prefs.get('elevage',true)!==false&&P.prefs.off('gerant').indexOf('elevage')<0}
function tabsFor(h){var t=TABS.slice();if(h.sex==='Jument'&&elevageOn())t.splice(t.length-1,0,['repro','Reproduction']);return t}
function tabRepro(h){var b=D.breeding[h.id],cam=D.cameras.find(function(c){return c.box===h.box});
 var head='<div class="hrow sp wrap" style="--g:8px;margin-bottom:2px"><span class="xs mut">Module Élevage · se règle dans Réglages, rubrique Modules</span><button class="btn ghost sm" data-go="reglages">'+ICON('settings','sm')+'Réglages</button></div>';
 if(!b)return '<div class="stack rise" style="--g:14px">'+head+'<div class="card">'+U.empty('heart','Aucun suivi de reproduction',E(h.name.split(' ')[0])+' n’a pas de programme de saillie. Démarrez un suivi pour noter les chaleurs, la saillie et les échographies.','<button class="btn sm pri" data-act="rpstart">'+ICON('plus','sm')+'Démarrer un suivi</button>')+'</div></div>';
 if(b.stage==='pleine'){var day=-F.days(b.cover),term=addDays(b.cover,340),left=F.days(term),pct=Math.min(100,day/340*100);
  return '<div class="stack rise" style="--g:14px">'+head+'<div class="fc-cols"><div class="stack" style="--g:14px"><div class="card"><div class="ch"><div><h3>Gestation en cours</h3><div class="xs mut">'+E(b.mode)+' · '+E(b.stallion)+'</div></div>'+U.chip('Pleine','ok',true)+'</div><div class="cb cv-rb">'+
    '<div class="hrow sp" style="align-items:flex-end"><div><span class="disp bb" style="font-size:34px;line-height:1">'+day+'</span><span class="mut b" style="margin-left:6px">jours sur 340</span></div><div style="text-align:right"><div class="xs mut">Terme prévu</div><b>'+F.dateY(term)+'</b><div class="xs mut">dans '+left+' jours</div></div></div>'+
    '<div class="cv-term"><i style="width:'+pct.toFixed(1)+'%"></i></div><div class="cv-mk"><span>Saillie '+F.date(b.cover)+'</span><span>7e mois</span><span>Box de poulinage '+F.date(addDays(b.cover,310))+'</span><span>Terme</span></div></div></div>'+
   '<div class="card"><div class="ch"><h3>Échographies et saillie</h3><button class="btn sm" data-act="rpecho">'+ICON('plus','sm')+'Ajouter</button></div><div class="cb"><div class="tl">'+b.echo.slice().reverse().map(function(e){return '<div class="ev"><b class="s">'+F.dateY(e[0])+'</b><div class="s mut">'+E(e[1])+'</div></div>'}).join('')+'<div class="ev"><b class="s">'+F.dateY(b.cover)+'</b><div class="s mut">Saillie : '+E(b.mode.toLowerCase())+', '+E(b.stallion)+'</div></div></div></div></div></div>'+
   '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><div><h3>Alerte de poulinage</h3><div class="xs mut">'+(cam?E(cam.name):'Caméra du box '+h.box)+' et capteur de ceinture</div></div>'+(b.alert?U.chip('Active','ok',true):U.chip('À partir du 320e jour','line'))+'</div><div style="padding:6px 0 4px">'+
     '<div class="lb-row"><div class="grow"><div class="t">Surveiller la jument la nuit</div><div class="s">La caméra repère une jument couchée et agitée, la ceinture signale la sudation et les contractions.</div></div><button class="tog" role="switch" data-manual data-act="rpalert" aria-checked="'+!!b.alert+'"></button></div>'+
     '<div class="lb-row"><div class="grow"><div class="t">Prévenir</div><div class="s">'+(DEMO?'Claire Dumont, Antoine Leroy et le Dr Leclerc':'Le gérant et l’équipe d’astreinte')+', par appel puis SMS</div></div></div></div>'+
     '<div class="cf"><span class="xs mut grow">'+(b.alert?'Alerte active toutes les nuits jusqu’au poulinage.':'S’active seule le '+F.date(addDays(b.cover,320))+'.')+'</span><button class="btn sm" data-act="rptest">'+ICON('bell','sm')+'Tester l’alerte</button></div></div>'+
    '<div class="card"><div class="ch"><h3>Vaccins de la gestation</h3></div><div style="padding:6px 0 4px">'+b.vacc.map(function(v){return '<div class="lb-row">'+sq('syringe',v[2]?'ok':F.days(v[1])<=30?'warn':'mut','sm')+'<div class="grow"><div class="t">'+v[0]+'</div><div class="s">'+(v[2]?'Fait le ':'Prévu le ')+F.dateY(v[1])+'</div></div>'+(v[2]?U.chip('Fait','ok'):U.chip(dueTxt(F.days(v[1])),'line'))+'</div>'}).join('')+'</div></div></div></div></div>'}
 var hs=b.heats,next=addDays(hs[hs.length-1],21);
 return '<div class="stack rise" style="--g:14px">'+head+'<div class="fc-cols"><div class="card"><div class="ch"><div><h3>Suivi des chaleurs</h3><div class="xs mut">Cycle moyen de 21 jours · '+E(b.plan)+'</div></div>'+U.chip('En suivi','acc',true)+'</div><div class="cb cv-rb"><div class="hrow sp"><div><div class="xs mut">Prochaines chaleurs attendues</div><b class="disp" style="font-size:22px">'+cap(F.dateL(next))+'</b></div>'+U.chip(dueTxt(F.days(next)),F.days(next)<=7?'warn':'line')+'</div>'+
   '<div class="tl">'+hs.slice().reverse().map(function(d){return '<div class="ev"><b class="s">'+F.dateY(d)+'</b><div class="s mut">Chaleurs observées au paddock, jument réceptive</div></div>'}).join('')+'</div></div><div class="cf"><button class="btn sm" data-act="rpecho">'+ICON('calendar_add','sm')+'Planifier une échographie</button><button class="btn sm pri" data-act="rpheat">'+ICON('plus','sm')+'Noter des chaleurs aujourd’hui</button></div></div>'+
  '<div class="card"><div class="ch"><h3>Avant la saillie</h3></div><div style="padding:6px 0 4px">'+[['Prélèvement utérin et frottis','Exigé par la plupart des centres d’insémination','warn'],['Échographie de suivi folliculaire','À faire au début des prochaines chaleurs',''],['Contrat de saillie','Avec l’étalonnier, signé en ligne par la propriétaire','']].map(function(a){return '<div class="lb-row">'+sq('doc',a[2]||'mut','sm')+'<div class="grow"><div class="t">'+a[0]+'</div><div class="s">'+a[1]+'</div></div></div>'}).join('')+'</div></div></div></div>'}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}

/* ---------- Lecture d'une étiquette ou d'une analyse de fourrage ---------- */
var HAYV={ufc:.48,madc:38},GRV={ufc:.86,madc:85};
function labelSheet(after){var kind='foin',read=null;
 var sh=P.sheet({title:'Photographier une étiquette',icon:'image',body:'',foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-apply disabled>'+ICON('check','sm')+'Appliquer les valeurs</button>'});
 function sim(){var v=kind==='foin'?{ufc:.42,madc:31,ms:87,ndf:61,lot:'Foin de prairie 2e coupe, lot FH-2611, Fourrages du Hurepoix',ref:HAYV}:{ufc:.92,madc:92,ms:88,ndf:24,lot:'Granulés floconnés « Sport » 25 kg, lot AG-4471, Coopérative Agralys',ref:GRV};
  var tmpH=Object.assign({},HAYV),tmpG=Object.assign({},GRV);if(kind==='foin'){tmpH.ufc=v.ufc;tmpH.madc=v.madc}else{tmpG.ufc=v.ufc;tmpG.madc=v.madc}
  var ch=[];D.horses.forEach(function(h){var need=needs(h).need,u=h.ration.hay*tmpH.ufc+h.ration.grain*tmpG.ufc,r=u/need;if(r<.9)ch.push({h:h,from:h.ration.grain,to:h.ration.grain+.5,why:'Apport à '+Math.round(r*100)+' % des besoins'});else if(r>1.2&&h.ration.grain>=1&&h.bcs>=3.5)ch.push({h:h,from:h.ration.grain,to:h.ration.grain-.5,why:'Apport à '+Math.round(r*100)+' % des besoins, note d’état '+kg(h.bcs)})});
  v.changes=ch;return v}
 function paint(b){b=b||sh.querySelector('.sb');var h='<div class="stack" style="--g:14px"><div class="field"><span>Document</span>'+U.seg([['foin','Analyse de foin'],['gran','Étiquette d’aliment']],kind,'data-lk')+'</div>';
  if(!read)h+='<button class="lb-drop" data-shot>'+ICON('image','lg')+'<b>Prendre la photo</b><span class="s mut">'+(kind==='foin'?'Bulletin d’analyse du laboratoire ou étiquette de la balle':'Étiquette du sac : valeurs nutritionnelles et composition')+'</span><span class="btn sm" style="margin-top:4px">Ouvrir l’appareil photo</span></button>';
  else if(read==='wait')h+='<div class="card flat pad stack" style="--g:10px"><div class="hrow s mut">'+ICON('refresh','sm')+'Lecture des valeurs…</div><div class="skel" style="height:14px;width:72%"></div><div class="skel" style="height:14px;width:50%"></div><div class="skel" style="height:14px;width:62%"></div></div>';
  else{var v=read;h+='<div class="hx-found"><div class="hrow"><span class="strass"></span><b class="s">Valeurs lues</b><span class="chip acc" style="margin-left:auto">'+(kind==='foin'?'Analyse':'Étiquette')+'</span></div><div class="xs mut">'+E(v.lot)+'</div>'+
    '<div class="cv-lbl"><div><span>UFC par kg</span><b>'+v.ufc.toFixed(2).replace('.',',')+'</b><em class="'+(v.ufc<v.ref.ufc?'warnc':'okc')+'">'+(v.ufc<v.ref.ufc?'−':'+')+Math.abs(v.ufc-v.ref.ufc).toFixed(2).replace('.',',')+' sur la table</em></div><div><span>MADC, g par kg</span><b>'+v.madc+'</b><em class="'+(v.madc<v.ref.madc?'warnc':'okc')+'">'+(v.madc<v.ref.madc?'−':'+')+Math.abs(v.madc-v.ref.madc)+' sur la table</em></div><div><span>Matière sèche</span><b>'+v.ms+' %</b><em class="mut">NDF '+v.ndf+' %</em></div></div></div>'+
    '<div><div class="eyebrow" style="margin-bottom:8px">Rations recalculées</div>'+(v.changes.length?'<div class="card flat">'+v.changes.slice(0,6).map(function(c){return '<div class="lb-row">'+U.hav(c.h,'sm')+'<div class="grow"><div class="t ellip">'+E(c.h.name)+'</div><div class="s">'+c.why+'</div></div><span class="s num"><span class="mut">'+kg(c.from)+'</span> '+ICON('arrow','sm')+' <b>'+kg(c.to)+' kg</b></span></div>'}).join('')+(v.changes.length>6?'<div class="lb-row"><span class="s mut">Et '+plural(v.changes.length-6,'autre ration','autres rations')+'</span></div>':'')+'</div>':'<div class="note ok">'+ICON('checkc','sm')+'<span>Toutes les rations restent équilibrées avec ces valeurs.</span></div>')+'</div>'}
  b.innerHTML=h+'</div>';var ap=sh.querySelector('[data-apply]');ap.disabled=!(read&&read!=='wait');if(read&&read!=='wait')ap.innerHTML=ICON('check','sm')+(read.changes.length?'Appliquer et recalculer '+plural(read.changes.length,'ration'):'Enregistrer les valeurs')}
 paint();on(sh,'[data-lk]',function(b){kind=b.getAttribute('data-lk');read=null;paint()});
 on(sh,'[data-shot]',function(){read='wait';paint();setTimeout(function(){if(!sh.isConnected)return;read=sim();paint()},P.RM?60:900)});
 sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
 sh.querySelector('[data-apply]').onclick=function(){var v=read,prevH=Object.assign({},HAYV),prevG=Object.assign({},GRV),back=v.changes.map(function(c){return [c.h,c.from]});
  if(kind==='foin'){HAYV.ufc=v.ufc;HAYV.madc=v.madc}else{GRV.ufc=v.ufc;GRV.madc=v.madc}v.changes.forEach(function(c){c.h.ration.grain=c.to});sh.close();if(after)after();
  P.toast((kind==='foin'?'Analyse du foin':'Étiquette')+' enregistrée. '+(v.changes.length?plural(v.changes.length,'ration recalculée','rations recalculées')+', le tableau de distribution est à jour':'Aucune ration à changer'),{icon:'feed',ms:5200,undo:function(){HAYV.ufc=prevH.ufc;HAYV.madc=prevH.madc;GRV.ufc=prevG.ufc;GRV.madc=prevG.madc;back.forEach(function(x){x[0].ration.grain=x[1]});if(after)after()}})}}

P.mod({id:'chevaux',role:'gerant',group:'Écurie',title:'Chevaux',icon:'horse',n:10,short:'Chevaux',
 badge:function(){var n=D.horses.filter(function(h){return h.status==='bad'}).length;return n?{v:n,hot:true}:null},
 render:function(el,ctx){
  var all=D.horses;all.forEach(X);
  var view=P.prefs.get('chevaux:view','cards');
  var nb=all.filter(function(h){return h.status==='bad'}).length,nw=all.filter(function(h){return h.status==='warn'}).length,over=all.filter(function(h){return loadP(h)>100}),
      avg=all.reduce(function(a,h){return a+h.work},0)/all.length,tot=all.reduce(function(a,h){return a+h.costMonth},0);
  el.innerHTML=LPH('Chevaux',all.length+' chevaux et poneys suivis · '+all.filter(function(h){return h.kind==='club'}).length+' de club, '+all.filter(function(h){return h.kind!=='club'}).length+' en pension',
     '<button class="btn" data-imp>'+ICON('upload','sm')+'<span class="hide-s">Importer en lot</span><span class="only-s">Importer</span></button><button class="btn pri" data-add>'+ICON('plus','sm')+'Ajouter un cheval</button>')+
   '<div class="stack" style="--g:18px"><div class="lb-bento rise">'+
    heroTile({dom:'chevaux',icon:'horse',eyebrow:/Tilleuls/.test(D.club.name||'')?'Cheptel des Tilleuls':'Cheptel du club',big:cnt(all.length),unit:'chevaux et poneys',sub:all.filter(function(h){return h.status==='ok'}).length+' en forme aujourd’hui. '+plural(Math.max(0,D.club.boxes-all.filter(function(h){return !h.visitor}).length),'box libre','boxes libres')+' sur '+D.club.boxes+'.',
     stats:[[all.filter(function(h){return h.kind==='club'}).length,'de club'],[all.filter(function(h){return h.kind!=='club'}).length,'en pension'],[all.filter(function(h){return h.pony}).length,'poneys']],illu:'cheval'})+
    '<div class="card tint d-soins lb-kpi lb-watch"><div class="lab"><span class="ico sm">'+ICON('pulse','sm')+'</span><span class="ellip">À surveiller</span></div><div class="val">'+cnt(nb+nw)+'<small>chevaux</small></div><div class="sub"><b>'+nb+' urgents</b> · '+nw+' à voir cette semaine</div>'+
     '<div class="lb-wl">'+all.filter(function(h){return h.status==='bad'}).map(function(h){return '<button class="lb-wh" data-go="cheval" data-id="'+h.id+'" title="Ouvrir la fiche de '+E(h.name)+'">'+portrait(h,'sm')+'<span>'+E(h.name.split(' ')[0])+'</span></button>'}).join('')+'</div></div>'+
    kpi('Charge moyenne','gauge','<span data-count="'+avg.toFixed(1)+'" data-fmt="1">'+F.num(avg,1)+'</span><small>h par semaine</small>',over.length?'<b class="warnc">'+over.length+' au-dessus du seuil</b> : '+over.map(function(h){return h.name}).slice(0,2).join(', '):'Aucun cheval au-dessus du seuil','travail').replace(/<\/div>$/,'<div class="lb-dist" title="Charge de chaque cheval, du plus chargé au moins chargé">'+all.slice().sort(function(a,b){return loadP(b)-loadP(a)}).map(function(h,i){return '<i style="--h:'+Math.max(6,Math.min(100,loadP(h)))+'%;--c:'+loadC(h)+';--i:'+i+'" title="'+E(h.name)+' : '+h.work+' h sur '+h.workMax+' h"></i>'}).join('')+'</div></div>')+
    (function(){var cl=all.filter(function(h){return h.kind==='club'}).reduce(function(a,h){return a+h.costMonth},0),pe=tot-cl;
     return kpi('Coût de revient','euro',cnt(tot,'eur')+'<small>par mois</small>','Moyenne de '+F.eur(Math.round(tot/all.length))+' par cheval','argent').replace(/<\/div>$/,'<div class="lb-split"><i style="--c:var(--mo);width:'+(cl/tot*100).toFixed(1)+'%"></i><i style="--c:var(--rd);width:'+(pe/tot*100).toFixed(1)+'%"></i></div><div class="lb-lg"><span><i style="--c:var(--mo)"></i>Club '+F.eur(cl)+'</span><span><i style="--c:var(--rd)"></i>Pensions '+F.eur(pe)+'</span></div></div>')})()+declBanner()+'</div>'+
   '<div class="lb-tools"><div class="search">'+ICON('search','sm')+'<input class="in" id="hx-q" placeholder="Nom, box, race, propriétaire…" value="'+E(LS.q)+'" autocomplete="off"></div>'+
    '<div class="scroll-x grow hx-tg"><div class="lb-tags">'+FILTERS.map(function(f){return '<button class="tag" data-manual data-f="'+f[0]+'" aria-pressed="'+(LS.f===f[0])+'">'+f[1]+' <b>'+all.filter(f[2]).length+'</b></button>'}).join('')+'</div></div>'+
    '<select class="in hide-s" id="hx-sort" style="width:auto" title="Trier">'+Object.keys(SORTS).map(function(k){return '<option value="'+k+'"'+(LS.sort===k?' selected':'')+'>Trier par : '+SORTS[k][0].toLowerCase()+'</option>'}).join('')+'</select>'+
    U.seg([['cards',ICON('grid','sm')+'<span class="hide-s">Cartes</span>'],['table',ICON('list','sm')+'<span class="hide-s">Tableau</span>']],view,'data-view')+
    '<button class="btn icon hide-s" data-exp title="Exporter le cheptel">'+ICON('download','sm')+'</button></div>'+
   '<div class="cv-vw"><span class="xs mut" style="flex:none">Vues</span><div class="scroll-x grow"><div class="lb-tags">'+views().map(function(v){return '<button class="tag" data-manual data-vw="'+v.id+'" aria-pressed="'+(LS.v===v.id)+'" title="'+(v.scope==='partagée'?'Vue partagée avec l’équipe':'Vue personnelle')+'">'+ICON(v.scope==='partagée'?'members':'user','sm')+E(v.name)+'</button>'}).join('')+'</div></div><button class="btn sm" data-savev>'+ICON('plus','sm')+'<span class="hide-s">Enregistrer cette vue</span><span class="only-s">Enregistrer</span></button></div>'+
   '<div id="cv-pins">'+pinsCard()+'</div><div id="hx-list"></div></div>';
  var box=el.querySelector('#hx-list');
  function draw(anim){var f=FILTERS.find(function(x){return x[0]===LS.f}),q=norm(LS.q);
    var list=all.filter(f[2]).filter(function(h){return !q||norm([h.name,h.box,h.breed,ownerLine(h),h.sire,h.coat].join(' ')).indexOf(q)>=0}).sort(SORTS[LS.sort][1]);
    if(!list.length){box.innerHTML='<div class="card">'+U.empty('horse','Aucun cheval ne correspond','Essayez un autre nom ou retirez un filtre.','<button class="btn sm" data-reset>Tout afficher</button>')+'</div>';return}
    box.innerHTML=view==='cards'?'<div class="hx-grid'+(anim?' rise':'')+'">'+list.map(horseCard).join('')+'</div>':horseTable(list);
    if(anim)P.animate(box)}
  draw(true);
  el.querySelector('#hx-q').oninput=function(e){LS.q=e.target.value;draw()};
  el.querySelector('#hx-sort').onchange=function(e){LS.sort=e.target.value;LS.v='';draw()};
  on(el,'[data-pin]',function(b,e){e.preventDefault();e.stopPropagation();e.stopImmediatePropagation();var id=b.getAttribute('data-pin'),now=togglePin(id),h=D.horse(id);
   P.$$('[data-pin="'+id+'"]',el).forEach(function(x){x.setAttribute('aria-pressed',now);x.title=now?'Retirer des épinglés':'Épingler '+h.name});el.querySelector('#cv-pins').innerHTML=pinsCard();P.animate(el.querySelector('#cv-pins'));
   P.toast(now?h.name+' est épinglé en tête de liste':h.name+' retiré des épinglés',{icon:'star',undo:function(){togglePin(id);P.rerender()}})});
  on(el,'[data-decl]',function(){declSheet(function(){P.rerender()})});
  on(el,'[data-vw]',function(b){var vw=views().find(function(v){return v.id===b.getAttribute('data-vw')});if(!vw)return;if(LS.v===vw.id){LS.v='';LS.f='all';LS.sort='box';LS.cols=null;LS.q=''}else applyView(vw);P.rerender()});
  on(el,'[data-savev]',function(){viewSheet(function(){P.rerender()})});
  on(el,'[data-f]',function(b){LS.v='';LS.f=b.getAttribute('data-f');P.$$('[data-f]',el).forEach(function(x){x.setAttribute('aria-pressed',x===b)});draw(true)});
  on(el,'[data-view]',function(b){view=b.getAttribute('data-view');P.prefs.set('chevaux:view',view);draw(true)});
  on(el,'[data-row]',function(r){P.go('cheval',{id:r.getAttribute('data-row')})});
  on(el,'[data-reset]',function(){LS.q='';LS.f='all';P.rerender()});
  el.querySelector('[data-add]').onclick=addHorseSheet;
  el.querySelector('[data-imp]').onclick=importSheet;
  el.querySelector('[data-exp]').onclick=function(){herdCsv(all)};
  box.addEventListener('keydown',function(e){if(e.key==='Enter'){var c=e.target.closest('.hx-c');if(c)P.go('cheval',{id:c.getAttribute('data-id')})}});
 }});

/* =====================================================================
   4. Fiche cheval
   ===================================================================== */
var FS={tab:'vue',care:'all',jr:'all'},ST={extra:{},jr:{},rebill:{},fed:{matin:{},midi:{},soir:{}},orders:{}};
var TABS=[['vue','Vue d’ensemble'],['sante','Santé'],['travail','Travail'],['alim','Alimentation'],['journal','Journal partagé'],['couts','Coûts'],['camera','Caméra du box'],['photos','Photos']];
function tone(s){return s==='bad'?'var(--bad)':s==='warn'?'var(--warn)':'var(--ok)'}
function allCare(h){return careLog(h).concat(ST.extra[h.id]||[]).sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:0})}
function ringHtml(h,k){var R=RULES[k],n=dueN(h,k),st=dueSt(h,k),v=Math.max(4,Math.min(100,n/R.every*100));
  return '<button class="fc-ring '+st+'" data-ring="'+k+'" title="'+R.l+(h[k]?' : dernier le '+F.dateY(h[k]):' : date à renseigner')+'"><span class="ring" style="--v:'+v.toFixed(0)+';--c:'+(st==='ok'?'var(--acc)':tone(st))+'">'+ICON(R.icon)+'</span><b>'+R.l.replace('Vaccin grippe','Vaccin').replace('Ostéopathe','Ostéo')+'</b><span class="d">'+dueTxt(n).replace('en retard de','retard')+'</span></button>'}
function locNow(h){return h.status==='bad'?'Au box, sous surveillance':isRest(h)?'Au box, au repos':h.paddock?'Au paddock, '+h.paddock.toLowerCase():DEMO?'Au paddock':(h.box?'Box '+h.box:'Au club')}

function dayPlan(h,x){var m=meals(h),ev=[],bad=h.status==='bad',rest=isRest(h);
  if(!DEMO){var now=D.today||new Date(),hm0=String(now.getHours()).padStart(2,'0')+':'+String(now.getMinutes()).padStart(2,'0'),td=x.week[todayIdx()]||[];
    ev.push({t:'07:00',l:'Ration du matin',s:m.matin.hay+' kg de foin'+(m.matin.grain?', '+String(m.matin.grain).replace('.',',')+' kg de '+grainType(h).toLowerCase():'')});
    td.forEach(function(s){ev.push({t:s.t||'',l:s.k,s:(s.w||'')+(s.d?(s.w?' · ':'')+hrs(s.d/60):''),c:s.care?KINDC[s.k]:'var(--acc)'})});
    if(m.midi.hay||m.midi.grain)ev.push({t:'12:00',l:'Ration de midi',s:m.midi.hay+' kg de foin'+(m.midi.grain?', '+String(m.midi.grain).replace('.',',')+' kg de granulés':'')});
    ev.push({t:'18:00',l:'Ration du soir',s:m.soir.hay+' kg de foin'+(m.soir.grain?', '+String(m.soir.grain).replace('.',',')+' kg de granulés':'')+(m.soir.supp?', '+m.soir.supp.toLowerCase():'')});
    ev.forEach(function(e){e.done=e.t&&e.t<hm0});ev.sort(function(a,b){return a.t<b.t?-1:1});var k=0;while(k<ev.length&&ev[k].t<hm0)k++;
    ev.splice(k,0,{t:hm0,l:h.status==='bad'?'Au box, sous surveillance':isRest(h)?'Au repos':'En ce moment',s:h.mood?'Humeur : '+h.mood.toLowerCase():(h.box?'Box '+h.box:''),now:true});
    return '<div class="fc-day">'+ev.map(function(e){return '<div class="fc-ev'+(e.done?' done':'')+(e.now?' now':'')+'"'+(e.c?' style="--c:'+e.c+'"':'')+'><span class="tm">'+e.t+'</span><span class="dt"></span><div><div class="b">'+E(e.l)+'</div><div class="xs mut">'+E(e.s)+'</div></div></div>'}).join('')+'</div>'}
  ev.push({t:'07:00',l:'Ration du matin',s:m.matin.hay+' kg de foin'+(h.id==='h23'?' mouillé':'')+(m.matin.grain?', '+String(m.matin.grain).replace('.',',')+' kg de '+grainType(h).toLowerCase():'')+' · distribuée par Antoine',done:true});
  ev.push(rest?{t:'08:30',l:'Reste au box',s:bad?'Surveillance toutes les 2 heures':'Repos prescrit, marche en main 15 minutes',done:true}:{t:'08:30',l:'Sortie au paddock',s:h.paddock+' · sorti par Lucie',done:true});
  x.week[1].forEach(function(s){ev.push({t:s.t,l:s.k,s:s.w+(s.d?' · '+hrs(s.d/60):''),c:'var(--acc)'})});
  D.care.filter(function(c){return c.horse===h.id&&F.days(c.date)===0&&/^\d/.test(c.time)}).forEach(function(c){ev.push({t:c.time,l:c.kind+' · '+c.who,s:c.note,c:KINDC[c.kind],done:c.time<'09:41'})});
  if(m.midi.hay||m.midi.grain)ev.push({t:'12:00',l:'Ration de midi',s:m.midi.hay+' kg de foin'+(h.id==='h23'?' mouillé, mash tiède':'')+(m.midi.grain?', '+String(m.midi.grain).replace('.',',')+' kg de granulés':'')});
  if(!rest)ev.push({t:'16:30',l:'Rentrée du paddock',s:'Pieds curés, couverture selon la météo (9 °C)'});
  ev.push({t:x.week[1].some(function(s){return s.t>='17:30'})?'19:15':'18:00',l:'Ration du soir',s:m.soir.hay+' kg de foin'+(h.id==='h23'?' mouillé, mash tiède':'')+(m.soir.grain?', '+String(m.soir.grain).replace('.',',')+' kg de granulés':'')+(m.soir.supp?', '+m.soir.supp.toLowerCase():'')});
  ev.sort(function(a,b){return a.t<b.t?-1:1});var k=0;while(k<ev.length&&ev[k].t<'09:41')k++;
  ev.splice(k,0,{t:'09:41',l:locNow(h),s:'En ce moment'+(bad?'':' · humeur : '+h.mood.toLowerCase()),now:true});
  return '<div class="fc-day">'+ev.map(function(e){return '<div class="fc-ev'+(e.done?' done':'')+(e.now?' now':'')+'"'+(e.c?' style="--c:'+e.c+'"':'')+'><span class="tm">'+e.t+'</span><span class="dt"></span><div><div class="b">'+E(e.l)+'</div><div class="xs mut">'+E(e.s)+'</div></div></div>'}).join('')+'</div>'}

/* ---------- onglet : vue d'ensemble ---------- */
function tabVue(h,x){var own=h.owner?D.member(h.owner):null,nx=RK.map(function(k){return {k:k,n:dueN(h,k)}}).sort(function(a,b){return a.n-b.n}).slice(0,3),j=journal(h).concat(D.journalMore.filter(function(e){return e.horse===h.id})),cost=h.costMonth,mg=x.income-cost;
  if(!DEMO){var dash='<span class="mut">À renseigner</span>',pr=function(k){var n=whoFor(h,k);return n?E(n):dash};
    var idnL=[['Nom',E(h.name)],['Numéro SIRE',x.sireNo?'<span class="mono">'+E(x.sireNo)+'</span>':dash],['UELN',x.ueln?'<span class="mono">'+E(x.ueln)+'</span>':dash],['Transpondeur',h.chip?'<span class="mono">'+E(h.chip)+'</span>':dash],['Race',h.breed?E(h.breed):dash],['Robe',h.coat?E(h.coat):dash],['Sexe',E(h.sex||'')],
      ['Naissance',x.born?F.dateY(x.born)+(h.age?' ('+h.age+' ans)':''):h.born?E(String(h.born))+(h.age?' ('+h.age+' ans)':''):dash],['Taille',+h.height?(h.height/100).toFixed(2).replace('.',',')+' m':dash],['Origines',x.father||x.mother?E([x.father,x.mother].filter(Boolean).join(' et ')):dash],['Naisseur',x.breeder?E(x.breeder):dash],['Arrivée au club',x.arrival?F.dateY(x.arrival):dash],
      [h.coowners&&h.coowners.length>1?'Copropriétaires':'Propriétaire',h.coowners&&h.coowners.length>1||h.coachOwner?ownerLine(h):own?E(own.first+' '+own.last):E(clubName())],['Statut',h.deal==='pair'?'Mise au pair':h.deal==='commodat'?'Commodat, prêt à usage gratuit':h.visitor?'De passage':KL[h.kind]||''],['Demi-pensionnaire',x.rider?E(D.name(x.rider)):'Aucun'],['Box et paddock',[h.box,h.paddock].filter(Boolean).map(E).join(' · ')||dash],['Niveau et caractère',[h.level,h.mood&&h.mood.toLowerCase()].filter(Boolean).map(E).join(' · ')||dash],['Vétérinaire traitant',pr('Vétérinaire')],['Maréchal',pr('Maréchal')],
      ['Assurance',x.ins.co?E(x.ins.co):dash],['Contrat',x.ins.no?'<span class="mono">'+E(x.ins.no)+'</span>'+(x.ins.until?', jusqu’au '+F.dateY(x.ins.until):''):dash]];
    var docsL=Array.isArray(h.docs)?h.docs:[];
    return '<div class="fc-cols rise"><div class="stack" style="--g:14px">'+
     '<div class="card"><div class="ch"><h3>Sa journée</h3><span class="chip '+(h.status==='bad'?'bad':'acc')+' dot">'+locNow(h)+'</span></div><div class="cb">'+dayPlan(h,x)+'</div></div>'+
     '<div class="card"><div class="ch"><h3>Identité complète</h3><div class="hrow" style="--g:4px"><button class="btn ghost sm" data-act="editid">'+ICON('edit','sm')+'Modifier</button></div></div><div class="cb"><dl class="lb-dl fc-idl" style="margin:0">'+idnL.map(function(a){return '<div><dt>'+a[0]+'</dt><dd>'+a[1]+'</dd></div>'}).join('')+'</dl></div></div>'+
     '<div class="card"><div class="ch"><h3>Dernières nouvelles</h3><button class="btn ghost sm" data-tabgo="journal">Journal'+ICON('arrow','sm')+'</button></div>'+(j.length?j.slice(0,2).map(jEntry).join(''):U.empty('chat','Aucune nouvelle pour l’instant','Les notes de l’équipe et du propriétaire apparaîtront ici.'))+'</div>'+'</div>'+
     '<div class="stack" style="--g:14px">'+
     '<div class="card"><div class="ch"><h3>Prochains rappels</h3><button class="btn ghost sm" data-tabgo="sante">Carnet de santé'+ICON('arrow','sm')+'</button></div><div style="padding:6px 0 4px">'+nx.map(function(a){var R=RULES[a.k],st=dueSt(h,a.k),t=tourOf(h,a.k),d=due(h,a.k);
       return '<div class="lb-row">'+sq(R.icon,st==='ok'?'':st)+'<div class="grow"><div class="t">'+R.l+'</div><div class="s">'+(t?'Tournée du '+F.date(t.date)+' à '+hm(t.time):d?'Échéance le '+F.date(d):'Dernière date à renseigner')+'</div></div>'+(t?U.chip('Planifié','ok',true):U.chip(dueTxt(a.n),st==='ok'?'':st))+'</div>'}).join('')+'</div></div>'+
     '<div class="card"><div class="ch"><h3>Coût estimé du mois</h3><button class="btn ghost sm" data-tabgo="couts">Détail'+ICON('arrow','sm')+'</button></div><div class="cb stack" style="--g:10px"><div class="hrow sp"><div><div class="xs mut">Alimentation, selon la ration</div><div class="disp bb" style="font-size:22px">'+F.eur(cost)+'</div></div><div style="text-align:right"><div class="xs mut">'+x.incomeL+'</div><div class="disp bb" style="font-size:22px">'+(x.income?F.eur(x.income):'–')+'</div></div></div>'+
       '<div class="s mut">Ajoutez vos autres frais (litière, maréchal, soins) pour un coût de revient complet.</div></div></div>'+
     '<div class="card"><div class="ch"><h3>Documents</h3><button class="btn ghost sm" data-act="adddoc">'+ICON('plus','sm')+'Ajouter</button></div>'+(docsL.length?'<div style="padding:6px 0 4px">'+docsL.map(function(d,k){return '<div class="lb-row">'+sq('doc','mut','sm')+'<div class="grow"><div class="t ellip">'+E(d.name||d.title||'Document')+'</div><div class="s ellip">'+E(d.date?F.dateY(d.date):'')+'</div></div></div>'}).join('')+'</div>':U.empty('folder','Aucun document','Passeport, carnet de vaccination, assurance : gardez-les avec la fiche.'))+'</div>'+
     '</div></div>'}
  var idn=[['Nom',E(h.name)],['Numéro SIRE','<span class="mono">'+x.sireNo+'</span>'],['UELN','<span class="mono">'+x.ueln+'</span>'],['Transpondeur','<span class="mono">'+h.chip+'</span>'],['Race',h.breed],['Robe',h.coat],['Sexe',h.sex],['Naissance',F.dateY(x.born)+' ('+h.age+' ans)'],['Taille',(h.height/100).toFixed(2).replace('.',',')+' m'],['Origines',x.father+' et '+x.mother],['Naisseur',x.breeder],['Arrivée au club',F.dateY(x.arrival)],
    [h.coowners&&h.coowners.length>1?'Copropriétaires':'Propriétaire',h.coowners&&h.coowners.length>1||h.coachOwner?ownerLine(h):own?own.first+' '+own.last:clubName()],['Statut',h.deal==='pair'?'Mise au pair, 12 h par semaine au plus':h.deal==='commodat'?'Commodat, prêt à usage gratuit':h.visitor?'De passage, hébergé ailleurs':KL[h.kind]],['Demi-pensionnaire',x.rider?D.name(x.rider):'Aucun'],['Box et paddock',h.box+' · '+h.paddock],['Niveau et caractère',h.level+' · '+h.mood.toLowerCase()],['Vétérinaire traitant','Dr Antoine Leclerc'],['Maréchal','Benoît Gautier'],
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

/* ---------- onglet : santé ---------- */
function careEv(h,e){var c=KINDC[e.kind]||'var(--acc)',own=h.owner,past=!e.next&&e.status==='fait',rb=ST.rebill[e.id];
  var st=e.status==='fait'?'':e.status==='planifié'?U.chip('Planifié','acc',true):e.status==='en retard'?U.chip('En retard','bad',true):e.status==='à planifier'?U.chip('À planifier','line'):U.status(e.status);
  return '<div class="ev'+(e.next?' next':'')+'" style="--c:'+c+'"><div class="hd"><b class="s">'+e.kind+'</b><span class="s mut">'+E(e.who)+'</span>'+st+'<span class="dte" style="margin-left:auto">'+(F.days(e.date)>=-6&&F.days(e.date)<=6?F.rel(e.date):F.dateY(e.date))+(e.time&&/^\d/.test(e.time)?', '+e.time:'')+'</span></div>'+
   '<div class="s" style="color:var(--ink-2);margin-top:3px">'+E(e.note)+'</div>'+
   '<div class="hrow wrap" style="--g:6px;margin-top:7px">'+(e.price?'<span class="chip">'+F.eur(e.price)+'</span>':'')+(past&&own&&e.price?(rb||F.days(e.date)<-45?U.chip('Refacturé','ok'):'<span class="chip warn">À refacturer</span>'):'')+(e.doc?'<button class="chip line" data-act="opendoc" style="cursor:pointer">'+ICON('doc','sm')+E(e.doc)+'</button>':'')+
   (e.next&&e.status!=='planifié'?'<button class="btn sm" data-plan="'+(e.key||'')+'">'+ICON('calendar_add','sm')+'Planifier</button>':'')+(e.next&&e.status==='planifié'?'<button class="btn ghost sm" data-go="soins">Voir la tournée'+ICON('arrow','sm')+'</button>':'')+'</div></div>'}
function tabSante(h,x){var log=allCare(h),kinds=['all','Vétérinaire','Maréchal','Vaccin','Vermifuge','Dentiste','Ostéopathe'],f=FS.care;
  var show=log.filter(function(e){return f==='all'||e.kind===f}),up=show.filter(function(e){return e.next||F.days(e.date)>=0&&e.status!=='fait'}).reverse(),past=show.filter(function(e){return up.indexOf(e)<0});
  var R=rx(h),vac=log.filter(function(e){return e.kind==='Vaccin'&&!e.next&&(DEMO||e.status==='fait')}),late=['vacc','worm','farrier','dentist'].filter(function(k){return dueSt(h,k)!=='ok'}).length;
  return '<div class="card rise" style="margin-bottom:14px"><div class="ch"><div><h3>Échéances de santé</h3><div class="xs mut">Vaccin, vermifuge, maréchal et dentiste, comme dans l’application '+(h.owner?'de '+E(D.member(h.owner)?D.member(h.owner).first:'la propriétaire'):'des cavaliers')+'</div></div>'+(late?U.chip(plural(late,'échéance proche','échéances proches'),'warn',true):U.chip('Tout est à jour','ok',true))+'</div><div class="cv-hr">'+['vacc','worm','farrier','dentist'].map(function(k){return ringHtml(h,k)}).join('')+'</div></div>'+
   '<div class="fc-cols rise"><div class="card"><div class="ch"><h3>Frise des soins</h3><button class="btn sm" data-act="care">'+ICON('plus','sm')+'Ajouter un soin</button></div>'+
    '<div class="scroll-x" style="padding:12px 16px 0"><div class="lb-tags">'+kinds.map(function(k){return '<button class="tag" data-manual data-cf="'+k+'" aria-pressed="'+(f===k)+'">'+(k==='all'?'Tout':'<i style="width:7px;height:7px;border-radius:50%;background:'+KINDC[k]+'"></i>'+k)+'</button>'}).join('')+'</div></div>'+
    '<div class="cb">'+(up.length?'<div class="eyebrow" style="margin:4px 0 12px">À venir</div><div class="tl fc-tl">'+up.map(function(e){return careEv(h,e)}).join('')+'</div>':'')+
     (past.length?'<div class="eyebrow" style="margin:6px 0 12px">Historique</div><div class="tl fc-tl">'+past.map(function(e){return careEv(h,e)}).join('')+'</div>':'')+(!show.length?U.empty('care','Aucun soin de ce type','Ajoutez le premier pour démarrer le suivi.'):'')+'</div></div>'+
   '<div class="stack" style="--g:14px">'+
    '<div class="card"><div class="ch"><h3>Rappels automatiques</h3><span class="chip ok dot">Actifs</span></div><div style="padding:6px 0 4px">'+RK.map(function(k){var Rl=RULES[k],n=dueN(h,k),st=dueSt(h,k);
      return '<div class="lb-row">'+sq(Rl.icon,st==='ok'?'':st,'sm')+'<div class="grow"><div class="t">'+Rl.l+'</div><div class="s">'+(h[k]?'Dernier le '+F.dateY(h[k]):'Dernière date à renseigner')+'</div></div><div style="text-align:right"><div class="s b '+(st==='bad'?'badc':st==='warn'?'warnc':'')+'">'+(h[k]?F.date(due(h,k)):'–')+'</div><div class="xs mut">'+dueTxt(n)+'</div></div></div>'}).join('')+'</div>'+
      '<div class="cf"><span class="xs mut grow">'+(h.owner?ownerLine(h)+' reçoit chaque rappel 15 jours avant.':'Les rappels arrivent sur votre accueil 15 jours avant.')+'</span><button class="btn ghost sm" data-go="soins">Régler</button></div></div>'+
    '<div class="card"><div class="ch"><h3>Ordonnances et traitements</h3><button class="btn ghost sm" data-act="rxadd">'+ICON('image','sm')+'Photographier</button></div>'+(R.length?'<div style="padding:6px 0 4px">'+R.map(function(o){
      return '<div class="lb-row" style="align-items:flex-start">'+sq('pill',o.on?'warn':'mut','sm')+'<div class="grow"><div class="hrow wrap" style="--g:6px"><span class="t">'+o.med+'</span>'+(o.on?U.chip('En cours','warn',true):U.chip('Terminé',''))+'</div><div class="s" style="margin-top:2px">'+o.pos+'</div><div class="xs mut" style="margin-top:2px">'+o.dur+' · '+o.who+' · <span class="mono">'+o.no+'</span></div>'+
       (o.on&&o.given&&o.given.length>1?'<div class="hrow wrap" style="--g:5px;margin-top:8px">'+o.given.map(function(g,k){return '<button class="chk" role="checkbox" aria-checked="'+(g?'true':'false')+'" data-given="'+k+'" title="Prise '+(k+1)+'"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button>'}).join('')+'<span class="xs mut" data-givent>'+o.given.filter(Boolean).length+' prises sur '+o.given.length+'</span></div>':'')+
       '<div class="xs" style="margin-top:6px"><span class="mut">Délai d’attente :</span> <b>'+o.wait+'</b></div></div></div>'}).join('')+'</div>':U.empty('pill','Aucun traitement en cours','Photographiez une ordonnance : Stabl lit le médicament, la posologie et crée les prises à cocher.'))+'</div>'+
    '<div class="card"><div class="ch"><h3>Carnet de vaccination</h3>'+(DEMO||dueSt(h,'vacc')==='ok'&&h.vacc?U.chip('Valable en concours FFE','ok',true):h.vacc?U.chip('Rappel à faire','warn',true):U.chip('À renseigner','line'))+'</div>'+(vac.length||DEMO?'<div style="padding:6px 0 4px">'+vac.map(function(v){return '<div class="lb-row">'+sq('syringe','mut','sm')+'<div class="grow"><div class="t">Grippe et tétanos</div><div class="s">'+E(DEMO?(v.note.split(', ')[1]||''):v.note)+(v.who?' · '+E(v.who):'')+'</div></div><span class="s num">'+F.dateY(v.date)+'</span></div>'}).join('')+'</div>':U.empty('syringe','Aucun vaccin enregistré','Ajoutez le dernier vaccin pour programmer le rappel.'))+'</div>'+
    '<div class="card"><div class="ch"><h3>Registre d’élevage</h3>'+U.chip('À jour','ok',true)+'</div><div class="cb stack" style="--g:10px"><p class="s mut">Chaque soin, traitement et mouvement de '+E(h.name.split(' ')[0])+' est une écriture datée et signée'+(DEMO?'. Le registre du troisième trimestre est clos et archivé pour 5 ans.':', conservée 5 ans.')+'</p>'+
      '<div class="g2" style="--g:8px"><div class="card soft" style="padding:10px 12px"><div class="xs mut">Écritures en 2026</div><div class="disp bb" style="font-size:20px">'+(DEMO?log.length+9:log.filter(function(e){return e.status==='fait'}).length)+'</div></div><div class="card soft" style="padding:10px 12px"><div class="xs mut">Mouvements</div><div class="disp bb" style="font-size:20px">'+(DEMO?(h.kind==='club'?3:6):(Array.isArray(h.moves)?h.moves.length:0))+'</div></div></div>'+
      '<div class="hrow wrap" style="--g:8px"><button class="btn sm" data-act="regpdf">'+ICON('download','sm')+'Exporter le registre</button><button class="btn ghost sm" data-act="moves">Voir les mouvements</button></div></div></div>'+
   '</div></div>'}

/* ---------- onglet : travail ---------- */
function weeksChart(v,th){var w=P.isMobile&&P.isMobile()?360:640,hh=190,pl=40,pb=24,pt=12,mx=Math.max(th*1.15,Math.max.apply(null,v)*1.1),n=v.length,bw=(w-pl-8)/n,g='',Y=function(a){return pt+(1-a/mx)*(hh-pt-pb)};
  for(var k=0;k<=4;k++){var val=Math.round(mx*k/4);g+='<line class="grid" x1="'+pl+'" x2="'+(w-8)+'" y1="'+Y(val)+'" y2="'+Y(val)+'"/><text x="'+(pl-8)+'" y="'+(Y(val)+3.5)+'" text-anchor="end">'+val+' h</text>'}
  v.forEach(function(a,i){var x=pl+i*bw+bw*.2,c=a>th?'var(--bad)':a>=th*.85?'var(--warn)':'var(--acc)';g+='<rect class="fc-wb" style="--i:'+i+'" x="'+x+'" y="'+Y(a)+'" width="'+bw*.6+'" height="'+Math.max(0,Y(0)-Y(a))+'" rx="4" fill="'+c+'"'+(i===n-1?'':' opacity=".5"')+'/><text x="'+(x+bw*.3)+'" y="'+(hh-6)+'" text-anchor="middle">'+(w<400&&(n-1-i)%2?'':'S'+(DEMO?36+i:isoWeek(D.day(0))-(n-1-i)))+'</text>'});
  g+='<line x1="'+pl+'" x2="'+(w-8)+'" y1="'+Y(th)+'" y2="'+Y(th)+'" stroke="var(--ink)" stroke-width="1.5" stroke-dasharray="5 5" opacity=".6"/><text x="'+(w-10)+'" y="'+(Y(th)-6)+'" text-anchor="end" style="font-weight:600;fill:var(--ink)">Seuil '+th+' h</text>';
  return '<svg class="chart" data-vw="'+w+'" viewBox="0 0 '+w+' '+hh+'" role="img" aria-label="Heures de travail par semaine">'+g+'</svg>'}
function tabTravail(h,x){var p=loadP(h),wk=x.week,sess=[].concat.apply([],wk).filter(function(s){return !s.care}),restDays=wk.filter(function(d){return !d.some(function(s){return s.d>0})}).length,
   inten=sess.length?sess.reduce(function(a,s){return a+(s.in||1)},0)/sess.length:0,rest=isRest(h);
  var tot=x.types.reduce(function(a,t){return a+t.v},0);
  var sensor=x.sensor?'<div class="card"><div class="ch"><div><h3>Capteur de selle</h3><div class="xs mut">Séance d’hier, 17 h 45 · sangle connectée synchronisée à 18 h 42</div></div><span class="chip ok dot">Connecté</span></div><div class="cb stack" style="--g:14px">'+
     '<div class="fc-gait">'+[['Durée','52 min'],['Distance','6,4 km'],['Symétrie','96 %'],['Fréquence cardiaque','112 bpm']].map(function(a){return '<div><div class="xs mut ellip">'+a[0]+'</div><div class="v">'+a[1]+'</div></div>'}).join('')+'</div>'+
     '<div><div class="lb-bar2" style="height:14px"><i style="--c:var(--c3);width:34%"></i><i style="--c:var(--acc);width:28%"></i><i style="--c:var(--c2);width:38%"></i></div><div style="margin-top:8px">'+C.legend([['Pas, 34 %','var(--c3)'],['Trot, 28 %','var(--acc)'],['Galop, 38 %','var(--c2)']])+'</div></div>'+
     C.line([{v:[62,70,78,84,96,108,118,112,104,126,138,146,132,118,124,142,156,168,150,134,120,128,112,96,84,72,66],c:'var(--c6)',area:true}],['0','','4','','8','','12','','16','','20','','24','','28','','32','','36','','40','','44','','48','','52 min'],{h:150,min:40,max:190,fmt:function(v){return Math.round(v)}})+
     '<div class="note">'+ICON('pulse','sm')+'<span>Récupération en 2 min 40 après le galop, dans sa moyenne. Main gauche un peu moins engagée (symétrie 94 %) : cohérent avec la raideur notée au journal.</span></div></div></div>':
    '<div class="card">'+U.empty('sensor','Aucun capteur associé','Associez une sangle ou un capteur de selle pour suivre les allures, la symétrie et la fréquence cardiaque.','<button class="btn sm" data-act="pair">Associer un capteur</button>')+'</div>';
  return '<div class="stack rise" style="--g:14px"><div class="fc-cols eq">'+
   '<div class="card"><div class="ch"><h3>Charge de la semaine</h3><button class="btn ghost sm" data-act="thr">'+ICON('sliders','sm')+'Régler le seuil</button></div><div class="cb stack" style="--g:14px">'+
     '<div class="hrow sp" style="align-items:flex-end"><div><span class="disp bb" style="font-size:40px;line-height:1">'+h.work+' h</span><span class="mut b" style="margin-left:6px">sur '+h.workMax+' h</span></div>'+(p>100?U.chip('Seuil dépassé','bad',true):p>=85?U.chip('Proche du seuil','warn',true):rest?U.chip('Au repos','line'):U.chip('Charge saine','ok',true))+'</div>'+
     '<div class="lb-thr"><div class="bar" style="height:10px"><i style="--v:'+Math.min(100,p/1.2)+'%;--c:'+loadC(h)+'"></i></div><u style="left:'+(100/1.2)+'%"></u></div>'+
     '<div class="g3" style="--g:8px">'+[['Séances',sess.length],['Jours de repos',restDays],['Intensité',['Nulle','Légère','Modérée','Soutenue'][Math.round(inten)]||'Légère']].map(function(a){return '<div class="card soft" style="padding:10px 12px"><div class="xs mut">'+a[0]+'</div><div class="disp bb" style="font-size:19px">'+a[1]+'</div></div>'}).join('')+'</div>'+
     (p>100?'<div class="note bad">'+ICON('alert','sm')+'<span>'+E(h.name)+' dépasse son seuil de '+(h.work-h.workMax)+' h. Stabl le retire des propositions de montoir jusqu’à dimanche.</span></div>':
      '<div class="note">'+ICON('shield','sm')+'<span>Au-delà de '+h.workMax+' h, Stabl bloque l’attribution en reprise et vous prévient. Un jour de repos complet par semaine est garanti.</span></div>')+'</div></div>'+
   '<div class="card"><div class="ch"><div><h3>Heures par semaine</h3><div class="xs mut">'+(DEMO?'12 dernières semaines':'Semaine en cours, d’après les reprises')+'</div></div><span class="s mut">Moyenne <b style="color:var(--ink)">'+F.num(x.hist.reduce(function(a,b){return a+b},0)/x.hist.length,1)+' h</b></span></div><div class="cb">'+weeksChart(x.hist,h.workMax)+'</div></div></div>'+
   '<div class="card"><div class="ch"><h3>Planning de la semaine</h3><button class="btn ghost sm" data-act="plan">Ouvrir le planning'+ICON('arrow','sm')+'</button></div><div class="cb"><div class="fc-wk">'+wk.map(function(d,k){var tt=d.reduce(function(a,s){return a+s.d},0)/60;
     return '<div class="fc-wd'+(k===todayIdx()?' today':'')+'"><div class="dn"><span>'+DAYSL[k]+'</span><b>'+(tt?hrs(tt):'')+'</b></div><div class="ss">'+(d.length?d.map(function(s){return '<div class="fc-ss'+(s.done?' done':'')+'" style="--c:'+(s.care?'var(--c4)':s.in===3?'var(--c2)':s.in===1?'var(--c3)':'var(--acc)')+'"><b>'+s.t+' · '+E(s.k)+'</b><span>'+E(s.w)+'</span></div>'}).join(''):'<div class="fc-rest">'+ICON('paddock','sm')+'<span>'+(rest&&k>0?'Repos prescrit':'Repos au paddock')+'</span></div>')+'</div></div>'}).join('')+'</div>'+
     '<div style="margin-top:12px">'+C.legend([['Séance intense','var(--c2)'],['Séance modérée','var(--acc)'],['Longe, travail léger','var(--c3)'],['Soin','var(--c4)']])+'</div></div></div>'+
   '<div class="fc-cols">'+sensor+'<div class="card"><div class="ch"><div><h3>Séances par type</h3><div class="xs mut">'+(DEMO?'4 dernières semaines':'Semaine en cours')+'</div></div></div><div class="cb hrow wrap" style="--g:18px">'+(!x.types.length?'<span class="s mut">Aucune séance enregistrée cette semaine.</span>':'')+C.donut(x.types.map(function(t){return {v:t.v,c:t.c}}),{size:132,center:F.num(tot,0)+' h',w:14})+
     '<div class="stack grow" style="--g:8px;min-width:150px">'+x.types.map(function(t){return '<div class="hrow sp s"><span class="hrow" style="--g:8px"><i style="width:8px;height:8px;border-radius:2px;background:'+t.c+'"></i>'+t.l+'</span><b class="num">'+hrs(t.v)+'</b></div>'}).join('')+'</div></div></div></div></div>'}

/* ---------- onglet : alimentation ---------- */
function mealCards(h){var m=meals(h),md=MEDS[h.id]||{};return '<div class="fc-meal">'+[['matin','Matin','07:00','sun'],['midi','Midi','12:00','clock'],['soir','Soir','18:00','moon']].map(function(a){var q=m[a[0]];
  return '<div class="fc-ml"><div class="hrow sp"><b class="hrow" style="--g:6px">'+ICON(a[3],'sm')+a[1]+'</b><span class="xs mut num">'+a[2]+'</span></div><div class="q"><span>Foin</span><b>'+String(q.hay).replace('.',',')+' kg</b></div><div class="q"><span>'+grainType(h)+'</span><b>'+(q.grain?String(q.grain).replace('.',',')+' kg':'Aucun')+'</b></div>'+(q.supp?'<div class="q"><span>'+q.supp+'</span><b>'+SUPP[q.supp].dose+'</b></div>':'')+(md[a[0]]?'<div class="al-fl med">'+ICON('pill','sm')+'<span>'+md[a[0]]+'</span></div>':'')+'</div>'}).join('')+'</div>'}
function needs(h){var w=h.weight,ent=+(0.0373*Math.pow(w,.75)).toFixed(1),trav=+(h.work/7*.55).toFixed(1),ufc=+(h.ration.hay*HAYV.ufc+h.ration.grain*GRV.ufc).toFixed(1),madc=Math.round(h.ration.hay*HAYV.madc+h.ration.grain*GRV.madc),nm=Math.round(w*.6+h.work/7*70);return {need:+(ent+trav).toFixed(1),ufc:ufc,madc:madc,nm:nm,fib:+(h.ration.hay/w*100).toFixed(1)}}
function tabAlim(h,x){var f=feedDay(h),d=f.hay+f.grain+f.supp,w=x.weights.length?x.weights:[+h.weight||0],wl=w.length-1,dv=DEMO?w[11]-w[8]:w[wl]-w[Math.max(0,wl-3)],N=needs(h),sp=SUPP[h.ration.supp];
  var nidx=Math.round(x.nec*2);
  return '<div class="stack rise" style="--g:14px"><div class="fc-cols eq">'+
   '<div class="card"><div class="ch"><h3>Ration du jour</h3><button class="btn sm" data-act="ration">'+ICON('edit','sm')+'Modifier la ration</button></div><div class="cb stack" style="--g:12px">'+mealCards(h)+
     (CONS[h.id]?'<div class="note warn">'+ICON('info','sm')+'<span><b>Consigne :</b> '+CONS[h.id]+'.</span></div>':'')+
     '<div class="hrow sp wrap s"><span class="mut">Total par jour : <b style="color:var(--ink)">'+h.ration.hay+' kg de foin, '+String(h.ration.grain).replace('.',',')+' kg de '+grainType(h).toLowerCase()+'</b></span><span><b class="num">'+F.eur(d,true)+'</b> <span class="mut">par jour, '+F.eur(Math.round(d*30.4))+' par mois</span></span></div></div></div>'+
   '<div class="card"><div class="ch"><div><h3>Poids et état corporel</h3><div class="xs mut">'+(DEMO?'Pesée au ruban le '+F.date(iso(-3)):h.weighed?'Dernière pesée le '+F.date(h.weighed):'Aucune pesée enregistrée')+'</div></div><button class="btn sm" data-act="weigh">'+ICON('weight','sm')+'Enregistrer une pesée</button></div><div class="cb stack" style="--g:12px">'+
     '<div class="hrow sp fc-wt" style="align-items:flex-end"><div><span class="disp bb" style="font-size:34px;line-height:1">'+w[wl]+' kg</span> '+(DEMO||wl>0?'<span class="b s '+(dv<-8?'badc':dv>8?'warnc':'okc')+'" style="margin-left:6px">'+(dv>0?'+':dv<0?'−':'')+Math.abs(dv)+(DEMO?(hi(h)===15?' kg en 3 semaines':' kg en 3 mois'):' kg depuis la pesée précédente')+'</span>':'')+'</div><div style="text-align:right"><div class="xs mut">Note d’état corporel</div><b>'+String(x.nec).replace('.',',')+' sur 5 · '+necTxt(x.nec)+'</b></div></div>'+
     '<div class="fc-nec" title="Échelle de l’IFCE, de 0 à 5">'+[1,2,3,4,5,6,7,8,9,10].map(function(k){return '<i class="'+(k<nidx?'on':k===nidx?'cur':'')+'"></i>'}).join('')+'</div>'+
     (DEMO||w.length>1?C.line([{v:w,c:'var(--acc)',area:true}],DEMO?D.months:w.map(function(v,k){return k===wl?'Auj.':''}),{h:150,min:Math.min.apply(null,w)-18,max:Math.max.apply(null,w)+14,fmt:function(v){return Math.round(v)}}):'<div class="note">'+ICON('weight','sm')+'<span>Enregistrez une pesée par mois : la courbe de poids s’affichera ici.</span></div>')+'</div></div></div>'+
   '<div class="fc-cols eq"><div class="card"><div class="ch"><div><h3>Apports et besoins</h3><div class="xs mut">Estimation selon les tables de l’INRA, pour '+w[wl]+' kg et '+h.work+' h de travail</div></div></div><div class="cb stack" style="--g:14px">'+
     [['Énergie',N.ufc,N.need,'UFC',1],['Protéines',N.madc,N.nm,'g de MADC',0]].map(function(a){var r=a[1]/a[2]*100,c=r<90?'var(--warn)':r>120?'var(--warn)':'var(--ok)';return '<div class="stack" style="--g:6px"><div class="hrow sp s"><b>'+a[0]+'</b><span><b class="num">'+F.num(a[1],a[4])+'</b> <span class="mut">apportés pour '+F.num(a[2],a[4])+' '+a[3]+' de besoin</span></span></div><div class="lb-thr"><div class="bar" style="height:8px"><i style="--v:'+Math.min(100,r/1.4)+'%;--c:'+c+'"></i></div><u style="left:'+(100/1.4)+'%"></u></div></div>'}).join('')+
     '<div class="hrow sp s fc-fib"><span><b>Fourrage</b> <span class="mut">· minimum conseillé 1,5 kg pour 100 kg</span></span>'+U.chip(String(N.fib).replace('.',',')+' kg pour 100 kg',N.fib>=1.5?'ok':'warn',true)+'</div></div></div>'+
   '<div class="card"><div class="ch"><h3>Compléments et cures</h3><button class="btn ghost sm" data-go="alimentation">Tableau d’écurie'+ICON('arrow','sm')+'</button></div><div style="padding:6px 0 4px">'+
     (h.ration.supp!=='Aucun'?'<div class="lb-row">'+sq('drop','','sm')+'<div class="grow"><div class="t">'+h.ration.supp+'</div><div class="s">'+sp.dose+' le '+sp.when+' · en continu</div></div><span class="s num b">'+F.eur(sp.d*30.4,true)+'<span class="mut" style="font-weight:400"> par mois</span></span></div>':'')+
     (DEMO?'<div class="lb-row">'+sq('bucket','mut','sm')+'<div class="grow"><div class="t">Pierre à sel</div><div class="s">Dans le box, remplacée le '+F.date(iso(-19))+'</div></div>'+U.chip('En place','ok')+'</div>'+
     '<div class="lb-row">'+sq('drop','mut','sm')+'<div class="grow"><div class="t">Eau</div><div class="s">Abreuvoir automatique · '+(h.id==='h23'?'3,1 litres par heure, en baisse de 40 %':'consommation normale, 31 litres hier')+'</div></div>'+(h.id==='h23'?U.chip('En baisse','warn',true):U.chip('Normal','ok'))+'</div>':h.ration.supp==='Aucun'?'<div class="cb"><span class="s mut">Aucun complément ni cure en cours.</span></div>':'')+'</div>'+
     '<div class="cf"><button class="btn ghost sm" data-act="cure">'+ICON('plus','sm')+'Ajouter une cure</button></div></div></div></div>'}

/* ---------- onglet : journal ---------- */
var JK={travail:['saddle','Travail'],soin:['heart','Soin'],balade:['route','Balade']};
function jEntry(e){var p=D.person(e.who),k=JK[e.kind]||JK.soin;return '<div class="fc-j">'+U.av(e.who)+'<div><div class="hrow wrap" style="--g:6px"><b class="s">'+(p?p.first+' '+p.last:'')+'</b>'+U.chip(e.role,/Propri/.test(e.role)?'acc':/Demi/.test(e.role)?'navy':'')+'<span class="xs mut" style="margin-left:auto">'+e.when+'</span></div><p>'+E(e.text)+'</p><div class="hrow" style="--g:10px;margin-top:8px"><span class="xs mut hrow" style="--g:5px">'+ICON(k[0],'sm')+k[1]+'</span><span class="fc-mood" title="Forme du cheval : '+e.mood+' sur 5">'+[1,2,3,4,5].map(function(n){return '<i class="'+(n<=e.mood?'on':'')+'"></i>'}).join('')+'</span></div></div></div>'}
function tabJournal(h,x){var all=(ST.jr[h.id]||[]).concat(journal(h),D.journalMore.filter(function(e){return e.horse===h.id})),roles=['all','Propriétaire','Demi-pensionnaire','Palefrenier','Moniteur'],f=FS.jr,
   list=all.filter(function(e){return f==='all'||e.role.indexOf(f.slice(0,8))===0});
  var who=DEMO?[h.owner&&[h.owner,'Propriétaire','Lit et écrit'],x.rider&&[x.rider,'Demi-pensionnaire','Lit et écrit'],['s05','Palefrenier soigneur','Lit et écrit'],['s06','Palefrenière soigneuse','Lit et écrit'],['s02','Moniteur','Lit et écrit'],['s01','Gérante','Tout voir']].filter(Boolean):
    [h.owner&&[h.owner,'Propriétaire','Lit et écrit'],x.rider&&[x.rider,'Demi-pensionnaire','Lit et écrit']].filter(Boolean).concat(D.staff.filter(function(s){return s.id!==(D.me&&D.me.gerant)}).map(function(s){return [s.id,s.role||'Équipe','Lit et écrit']}));
  return '<div class="fc-cols rise"><div class="stack" style="--g:14px"><div class="card pad stack" style="--g:10px"><textarea class="in" id="fc-jt" placeholder="Écrire une nouvelle de '+E(h.name.split(' ')[0])+' : une séance, un soin, une observation…" style="min-height:70px"></textarea>'+
    '<div class="hrow wrap sp"><div class="hrow wrap" style="--g:6px">'+U.seg([['soin','Soin'],['travail','Travail'],['balade','Balade']],'soin','data-jk')+'<button class="btn ghost sm icon" data-act="jphoto" title="Joindre une photo ou une vidéo">'+ICON('image','sm')+'</button><button class="btn ghost sm icon" data-act="jmic" title="Dicter la note">'+ICON('mic','sm')+'</button></div><button class="btn pri" data-act="jpost">'+ICON('send','sm')+'Publier</button></div></div>'+
    '<div class="card"><div class="scroll-x" style="padding:12px 16px 4px"><div class="lb-tags">'+roles.map(function(r){return '<button class="tag" data-manual data-jf="'+r+'" aria-pressed="'+(f===r)+'">'+(r==='all'?'Tout le monde':r)+'</button>'}).join('')+'</div></div>'+
     (list.length?list.map(jEntry).join(''):U.empty('chat','Aucune nouvelle de ce côté','Les notes publiées apparaîtront ici.'))+'</div></div>'+
   '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>Qui partage ce journal</h3><button class="btn ghost sm" data-act="invite">'+ICON('plus','sm')+'Inviter</button></div><div style="padding:6px 0 4px">'+(who.length?'':'<div class="cb"><span class="s mut">Ajoutez le propriétaire ou votre équipe pour partager les nouvelles.</span></div>')+who.map(function(wv){return '<div class="lb-row">'+U.av(wv[0])+'<div class="grow"><div class="t ellip">'+D.name(wv[0])+'</div><div class="s">'+wv[1]+'</div></div><span class="xs mut">'+wv[2]+'</span></div>'}).join('')+'</div>'+
     '<div class="cf"><span class="xs mut grow">Le vétérinaire et le maréchal peuvent recevoir un accès invité, sans compte.</span></div></div>'+
    '<div class="card"><div class="ch"><h3>Notifications</h3></div><div class="list"><div class="li"><div class="grow"><div class="t">Résumé du soir au propriétaire</div><div class="s">Un message à 19 h avec les nouvelles du jour</div></div>'+U.tog(!!h.owner)+'</div><div class="li"><div class="grow"><div class="t">Alerte immédiate en cas de soin</div><div class="s">Notification et SMS</div></div>'+U.tog(true)+'</div></div></div></div></div>'}

/* ---------- onglet : coûts ---------- */
function rebillLines(h){var l=allCare(h).filter(function(e){return e.status==='fait'&&e.price&&F.days(e.date)>=-45}).map(function(e){return {id:e.id,d:e.date,l:e.kind+' · '+e.note.split(',')[0].split('.')[0],v:e.price}});
  if(!DEMO)return l.sort(function(a,b){return a.d<b.d?1:-1});
  if(hi(h)===0)l.push({id:'h01x1',d:iso(-12),l:'Tonte complète',v:60},{id:'h01x2',d:iso(-5),l:'Engagement Club Élite, Rambouillet',v:26},{id:'h01x3',d:iso(-5),l:'Transport en van, part d’Ulysse',v:35});
  else l.push({id:h.id+'x1',d:iso(-8-hi(h)%9),l:'Tonte complète',v:60});return l.sort(function(a,b){return a.d<b.d?1:-1})}
function tabCouts(h,x){if(!DEMO)return tabCoutsL(h,x);var cost=h.costMonth,mx=Math.max.apply(null,x.costs.map(function(c){return c.v})),own=h.owner,lines=own?rebillLines(h):[],todo=lines.filter(function(l){return !ST.rebill[l.id]}),sum=todo.reduce(function(a,l){return a+l.v},0),mg=x.income-cost,
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
     '<div class="card"><div class="ch"><h3>Rentabilité en reprise</h3></div><div class="cb stack" style="--g:8px"><div class="hrow sp s"><span class="mut">Recette par heure montée</span><b class="num">17 €</b></div><div class="hrow sp s"><span class="mut">Coût par heure montée</span><b class="num">'+F.eur(cost/Math.max(1,h.work*4.33),true)+'</b></div><div class="hrow sp s"><span class="mut">Point d’équilibre</span><b class="num">'+F.num(cost/17/4.33,1)+' h par semaine</b></div></div></div>')+
   '</div></div>'}

/* ---------- onglet : caméra ---------- */
/* club réel : coût estimé à partir de la ration, recettes saisies, refacturations des soins réellement payés par le club */
function tabCoutsL(h,x){var cost=h.costMonth,own=h.owner,lines=own?rebillLines(h):[],todo=lines.filter(function(l){return !ST.rebill[l.id]}),sum=todo.reduce(function(a,l){return a+l.v},0),mx=Math.max.apply(null,x.costs.map(function(c){return c.v}).concat([1])),
    mo=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'][D.day(0).getMonth()],m=own?D.member(own):null;
  return '<div class="fc-cols rise"><div class="stack" style="--g:14px"><div class="card"><div class="ch"><div><h3>Coût estimé de l’alimentation</h3><div class="xs mut">'+mo.charAt(0).toUpperCase()+mo.slice(1)+' '+D.day(0).getFullYear()+', calculé à partir de la ration saisie</div></div><span class="disp bb num" style="font-size:24px">'+F.eur(cost)+'</span></div><div class="cb">'+
    (x.costs.length?x.costs.map(function(c,k){return '<div class="fc-cost"><span class="lb-sq sm mut" style="color:var(--c'+(k%7+1)+')">'+ICON(c.i,'sm')+'</span><div style="min-width:0"><div class="b ellip">'+c.l+'</div></div>'+U.bar(c.v/mx*100,'var(--c'+(k%7+1)+')')+'<b class="num" style="text-align:right">'+F.eur(c.v)+'</b></div>'}).join(''):'<span class="s mut">Saisissez la ration du cheval pour estimer son coût d’alimentation.</span>')+
    '<div class="note" style="margin-top:12px">'+ICON('info','sm')+'<span>Estimation au prix de référence du foin et des granulés. Litière, maréchal, soins et main-d’œuvre ne sont pas comptés.</span></div></div></div></div>'+
   '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>Ce que '+E(h.name.split(' ')[0])+' rapporte</h3></div><div class="cb stack" style="--g:10px">'+
     (x.income?'<div class="hrow sp s"><span class="mut">'+x.incomeL+'</span><b class="num">'+F.eur(x.income)+'</b></div><div class="hrow sp s"><span class="mut">Alimentation estimée</span><b class="num">− '+F.eur(cost)+'</b></div>':'<span class="s mut">'+(own?'Le montant de la pension n’est pas encore renseigné sur la fiche.':'Les recettes des reprises ne sont pas encore rattachées à ce cheval.')+'</span>')+'</div></div>'+
   (own?'<div class="card"><div class="ch"><h3>Refacturations au propriétaire</h3>'+(todo.length?'<span class="chip warn">'+F.eur(sum)+' à refacturer</span>':U.chip('Rien à refacturer','ok',true))+'</div>'+(lines.length?'<div style="padding:6px 0 4px">'+lines.map(function(l){var done=ST.rebill[l.id];
     return '<div class="lb-row"><div class="grow"><div class="t ellip">'+E(l.l)+'</div><div class="s">'+F.date(l.d)+' · '+(done?'ajouté à la prochaine facture':'pas encore facturé')+'</div></div><b class="num s">'+F.eur(l.v)+'</b>'+(done?sq('check','ok','sm'):'')+'</div>'}).join('')+'</div>':'<div class="cb"><span class="s mut">Les soins avancés par le club et notés avec un coût apparaîtront ici.</span></div>')+
     (todo.length&&m?'<div class="cf"><span class="xs mut grow">À reporter sur la facture de '+E(m.first+' '+m.last)+'.</span><button class="btn pri sm" data-act="rebill">Refacturer '+todo.length+' ligne'+(todo.length>1?'s':'')+'</button></div>':'')+'</div>':'')+
   '</div></div>'}
function camScene(){return '<svg viewBox="0 0 640 360" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><radialGradient id="fcg" cx="50%" cy="38%" r="75%"><stop offset="0" stop-color="#3b4640"/><stop offset=".6" stop-color="#1c2420"/><stop offset="1" stop-color="#080b0a"/></radialGradient><filter id="fcb"><feGaussianBlur stdDeviation="1.6"/></filter><filter id="fcn"><feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 .09 0"/></filter></defs>'+
  '<rect width="640" height="360" fill="url(#fcg)"/><path d="M70 60h500l70 300H0z" fill="#2c3630"/><path d="M70 60h500v-60H70z" fill="#141a17"/><path d="M70 60L0 360M570 60l70 300" stroke="#0c100e" stroke-width="3"/><path d="M70 60h500" stroke="#465149" stroke-width="2"/>'+
  '<g stroke="#3a463f" stroke-width="1.4" opacity=".8">'+[[110,150,22,-8],[190,300,26,6],[420,120,24,9],[520,280,22,-7],[300,330,28,4],[90,270,20,10],[470,210,18,-10],[240,110,20,5],[560,160,18,8],[150,210,24,-4],[360,300,22,-9],[60,330,22,6]].map(function(s){return '<path d="M'+s[0]+' '+s[1]+'l'+s[2]+' '+s[3]+'"/>'}).join('')+'</g>'+
  '<rect x="470" y="0" width="100" height="60" fill="#0d1210"/><rect x="88" y="78" width="46" height="34" rx="6" fill="#515e56"/><ellipse cx="111" cy="80" rx="23" ry="6" fill="#6e7d73"/>'+
  '<g filter="url(#fcb)"><ellipse cx="335" cy="262" rx="150" ry="26" fill="#0a0e0c" opacity=".55"/>'+
  '<g class="bd"><path d="M228 208c-8-40 30-62 96-60 62 2 104 20 110 56 4 30-22 50-60 52-50 3-136 0-146-48z" fill="#cdd6d0"/><path d="M430 190c22 8 36 30 30 64" stroke="#aab5ae" stroke-width="9" stroke-linecap="round" fill="none"/></g>'+
  '<path d="M262 236l-8 44M300 246l-2 40M388 248l6 38M420 232l12 44" stroke="#b9c3bc" stroke-width="13" stroke-linecap="round"/>'+
  '<g class="hd"><path d="M248 196c-22-14-46-44-54-74 14-10 34-6 48 10 14 18 22 40 26 58z" fill="#d6ded8"/><path d="M196 124c-14 14-32 44-40 70 6 10 20 12 30 4 10-22 22-44 34-58z" fill="#dfe6e1"/><path d="M204 118l-4-20 14 12zM222 114l4-20 8 18z" fill="#dfe6e1"/><circle cx="196" cy="146" r="3.4" fill="#fff"/></g></g>'+
  '<rect width="640" height="360" filter="url(#fcn)"/></svg>'}
function tabPhotos(h){return '<div class="card pad"><div class="ch" style="padding:0 0 14px"><h3>Photos de '+E(h.name.split(' ')[0])+'</h3><span class="xs mut">Profil, marques et soins, datés</span></div><div data-phgal></div></div>'}
function tabCam(h,x){var cam=D.cameras.find(function(c){return c.box===h.box});
  if(!DEMO&&!cam)return '<div class="card rise">'+U.empty('camera','Aucune caméra dans ce box','Reliez une caméra depuis les connecteurs pour surveiller '+E(h.name.split(' ')[0])+' à distance.','<button class="btn sm" data-act="cams">Voir les caméras</button>')+'</div>';
  var bad=h.status==='bad',col=bad?[['Debout',52,'var(--acc)'],['Couché',31,'var(--warn)'],['Mange',17,'var(--c7)']]:[['Debout',58,'var(--acc)'],['Couché',14,'var(--c2)'],['Mange',28,'var(--c7)']];
  var seq=bad?[[30,0],[6,1],[4,0],[9,1],[5,0],[12,1],[6,2],[10,0],[4,1],[14,0]]:[[22,0],[8,1],[14,0],[6,1],[10,2],[18,0],[8,2],[14,0]];
  var clips=bad?[['02:55','Se couche et se relève 4 fois en 20 minutes','bad'],['03:38','Arrivée du Dr Leclerc dans le box',''],['06:12','Couché calme, 48 minutes',''],['08:03','Crottins, se remet à manger','ok']]:[['01:12','Se couche, sommeil profond 42 minutes',''],['04:40','Se couche, 36 minutes',''],['07:04','Ration du matin distribuée','ok'],['08:31','Sortie du box, départ au paddock','']];
  return '<div class="fc-cols rise"><div class="stack" style="--g:14px"><div class="card pad stack" style="--g:12px"><div class="fc-cam">'+camScene()+'<div class="scan"></div><div class="ai"><span>'+E(h.name.split(' ')[0])+' · debout, '+(bad?'agité':'calme')+'</span></div>'+
     '<div class="hud t"><span class="live">EN DIRECT</span><span>'+h.box+' · CAM '+(cam?cam.id.replace('cam','0'):'0'+(hi(h)%8+1))+'</span></div><div class="hud b"><span data-clock>'+(DEMO?'17/11/2026 09:41:07':'')+'</span><span>IR auto · 1080p</span></div></div>'+
     '<div class="hrow wrap sp fc-camb"><div class="hrow wrap" style="--g:8px"><button class="btn sm" data-act="camfull">'+ICON('expand','sm')+'Plein écran</button><button class="btn sm" data-act="camclip">'+ICON('rec','sm')+'Enregistrer un extrait</button><button class="btn sm" data-act="camtalk">'+ICON('mic','sm')+'Parler dans le box</button></div><button class="btn ghost sm" data-act="cams">Toutes les caméras'+ICON('arrow','sm')+'</button></div></div>'+
    '<div class="card"><div class="ch"><div><h3>Activité des dernières 24 heures</h3><div class="xs mut">Analyse automatique de l’image, de 9 h 41 hier à maintenant</div></div></div><div class="cb stack" style="--g:10px"><div class="fc-act">'+seq.map(function(s){return '<i style="--c:'+col[s[1]][2]+';width:'+s[0]+'%"></i>'}).join('')+'</div>'+
     '<div class="hrow sp xs mut num"><span>09:41</span><span>15:00</span><span>21:00</span><span>03:00</span><span>09:41</span></div>'+C.legend(col.map(function(c){return [c[0]+', '+c[1]+' %',c[2]]}))+'</div></div></div>'+
   '<div class="stack" style="--g:14px">'+(bad?'<div class="note bad">'+ICON('alert','sm')+'<span><b>Comportement inhabituel cette nuit.</b> Couché 3 fois plus que sa moyenne entre 2 h et 6 h. Antoine et le Dr Leclerc ont été prévenus à 2 h 57.</span></div>':'')+
    '<div class="card"><div class="ch"><h3>Moments repérés</h3></div><div style="padding:6px 0 4px">'+clips.map(function(c){return '<div class="lb-row click" data-act="clip">'+sq('play',c[2]||'mut','sm')+'<div class="grow"><div class="t">'+c[1]+'</div><div class="s num">'+(c[0]<'06:30'?'Cette nuit':'Ce matin')+', '+c[0]+'</div></div>'+ICON('right','sm')+'</div>'}).join('')+'</div></div>'+
    '<div class="card"><div class="ch"><h3>Alertes de la caméra</h3></div><div class="list"><div class="li"><div class="grow"><div class="t">Couché plus de 3 heures</div><div class="s">Notification et appel du palefrenier d’astreinte</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">Agitation la nuit</div><div class="s">Se couche et se relève à répétition</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">Partager le direct avec le propriétaire</div><div class="s">'+(h.owner?ownerLine(h)+' voit la caméra dans son espace':'Cheval de club, pas de partage')+'</div></div>'+U.tog(!!h.owner)+'</div></div></div></div></div>'}

/* ---------- feuilles de la fiche ---------- */
function zoneSheet(h,id){var z=zones(h)[id],R=z.k?RULES[z.k]:null;
  var sh=P.sheet({title:z.l,icon:R?R.icon:'pulse',body:'<div class="stack" style="--g:16px"><div class="hrow wrap" style="--g:8px">'+U.hav(h)+'<b>'+E(h.name)+'</b>'+U.chip(z.st==='bad'?'Urgent':z.st==='warn'?'À surveiller':'Rien à signaler',z.st,true)+'</div>'+
    '<div class="note '+(z.st==='ok'?'ok':z.st)+'">'+ICON(z.st==='ok'?'checkc':'alert','sm')+'<span>'+z.sum+'</span></div>'+
    (R?'<div class="g2" style="--g:10px"><div class="card soft" style="padding:12px"><div class="xs mut">Dernier passage</div><b>'+F.dateY(h[z.k])+'</b></div><div class="card soft" style="padding:12px"><div class="xs mut">Prochain</div><b>'+F.dateY(due(h,z.k))+'</b></div></div>':'')+
    '<div><div class="eyebrow" style="margin-bottom:12px">Historique de la zone</div><div class="tl">'+z.ev.map(function(e){return '<div class="ev" style="--c:'+tone(z.st)+'"><div class="hrow sp"><b class="s">'+E(e.t)+'</b></div><div class="xs mut">'+(F.days(e.d)===0?'Aujourd’hui':F.dateY(e.d))+' · '+E(e.w)+'</div></div>'}).join('')+'</div></div>'+
    '<div><div class="hrow sp" style="margin-bottom:10px"><div class="eyebrow">Photos de la zone</div><button class="btn sm" data-ph>'+ICON('camera','sm')+'Photographier</button></div><div data-phz></div></div></div>',
   foot:'<button class="btn ghost" data-all>Tout le carnet de santé</button><button class="btn pri" data-new>'+ICON('plus','sm')+'Noter une observation</button>'});
  phGallery(sh.querySelector('[data-phz]'),h,{zone:id,after:function(){zoneSheet(h,id)}});
  sh.querySelector('[data-ph]').onclick=function(){phCapture(h,{kind:'soin',zone:id,zoneLabel:z.l,done:function(){zoneSheet(h,id)}})};
  sh.querySelector('[data-all]').onclick=function(){sh.close();setTab('sante')};
  sh.querySelector('[data-new]').onclick=function(){careSheet(h,z.k?RULES[z.k].k:'Vétérinaire',z.l)};
  return sh}

function careSheet(h,kind,zone){var kinds=['Vétérinaire','Maréchal','Vaccin','Vermifuge','Dentiste','Ostéopathe'],sel=kind||'Vétérinaire',own=h.owner;
  var sh=P.sheet({title:'Ajouter un soin',icon:'care',body:'<div class="stack" style="--g:14px"><div class="hrow" style="--g:10px">'+U.hav(h)+'<div><b>'+E(h.name)+'</b><div class="xs mut">'+h.box+(zone?' · zone : '+zone.toLowerCase():'')+'</div></div></div>'+
    '<div class="field"><span>Type de soin</span><div class="scroll-x">'+U.seg(kinds.map(function(k){return [k,k]}),sel,'data-ck')+'</div></div>'+
    '<div class="g2" style="--g:12px"><label class="field"><span>Date</span><input class="in" type="date" id="fc-cd" value="'+iso(0)+'"></label>'+(DEMO?'<label class="field"><span>Praticien</span><select class="in" id="fc-cw">'+D.practitioners.map(function(p){return '<option>'+p.short+'</option>'}).join('')+'<option>Équipe</option></select></label>':'<label class="field"><span>Intervenant</span><input class="in" id="fc-cw" value="'+E(whoFor(h,sel))+'" placeholder="Nom du vétérinaire, du maréchal…"></label>')+'</div>'+
    '<label class="field"><span>Compte rendu</span><textarea class="in" id="fc-cn" placeholder="Ce qui a été fait, ce qu’il faut surveiller…">'+(zone?zone+' : ':'')+'</textarea></label>'+
    '<div class="g2" style="--g:12px"><label class="field"><span>Coût</span><input class="in num" id="fc-cp" value="'+(DEMO?68:'')+'" inputmode="decimal"'+(DEMO?'':' placeholder="0"')+'></label><label class="field"><span>Prochain rappel</span><select class="in"><option>Selon la règle du club</option><option>Dans 1 mois</option><option>Dans 6 mois</option><option>Aucun</option></select></label></div>'+
    '<button class="lb-drop" data-rx style="padding:16px">'+ICON('image')+'<b class="s">Photographier l’ordonnance ou la facture</b><span class="xs mut">Stabl lit le médicament, la posologie et le délai d’attente</span></button>'+
    '<div class="card flat list">'+(own?'<div class="li"><div class="grow"><div class="t">Refacturer à '+D.name(own)+'</div><div class="s">Ajouté à sa prochaine facture mensuelle</div></div>'+U.tog(true,'fc-crb')+'</div><div class="li"><div class="grow"><div class="t">Prévenir le propriétaire</div><div class="s">Notification avec le compte rendu</div></div>'+U.tog(true)+'</div>':'')+
     '<div class="li"><div class="grow"><div class="t">Inscrire au registre d’élevage</div><div class="s">Écriture datée et signée, non modifiable</div></div>'+U.tog(true)+'</div></div></div>',
   foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-save>'+ICON('check','sm')+'Enregistrer le soin</button>'});
  on(sh,'[data-ck]',function(b){sel=b.getAttribute('data-ck');if(!DEMO){sh.querySelector('#fc-cw').value=whoFor(h,sel)||(sel==='Vermifuge'?'Équipe':'');return}var pr=D.practitioners.find(function(p){return p.kinds.indexOf(sel)>=0});sh.querySelector('#fc-cw').value=sel==='Vermifuge'||!pr?'Équipe':pr.short;sh.querySelector('#fc-cp').value=({'Vétérinaire':68,'Maréchal':h.pony?45:95,'Vaccin':58,'Vermifuge':22,'Dentiste':70,'Ostéopathe':80})[sel]});
  if(DEMO){var pr0=D.practitioners.find(function(p){return p.kinds.indexOf(sel)>=0});sh.querySelector('#fc-cw').value=sel==='Vermifuge'||!pr0?'Équipe':pr0.short}
  sh.querySelector('[data-rx]').onclick=function(e){var b=e.currentTarget;if(!DEMO){P.toast('Joignez la photo depuis le journal du cheval : la lecture automatique des ordonnances arrive bientôt.',{icon:'image'});return}b.innerHTML=ICON('checkc')+'<b class="s">Ordonnance lue</b><span class="xs mut">Méloxicam, 30 ml par jour pendant 5 jours · délai d’attente 3 jours</span>';b.style.borderStyle='solid';var n=sh.querySelector('#fc-cn');if(!/Méloxicam/.test(n.value))n.value+='Méloxicam, 30 ml par jour pendant 5 jours.'};
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
  sh.querySelector('[data-save]').onclick=function(){var d=sh.querySelector('#fc-cd').value||iso(0),fut=F.days(d)>0,key=RK.find(function(k){return RULES[k].k===sel});
    if(!DEMO){var c0={id:'soin_'+Date.now().toString(36),horse:h.id,kind:sel,who:sh.querySelector('#fc-cw').value.trim(),date:d,time:'',note:sh.querySelector('#fc-cn').value.trim(),price:parseFloat(String(sh.querySelector('#fc-cp').value).replace(',','.'))||0,status:fut?'planifié':'fait'};D.care.push(window.PL&&PL.make?PL.make.care(c0):c0)}
    else if(!(key&&!fut))(ST.extra[h.id]=ST.extra[h.id]||[]).push({id:'x'+Date.now(),date:d,kind:sel,who:sh.querySelector('#fc-cw').value,note:sh.querySelector('#fc-cn').value.trim()||'Soin enregistré par Claire Dumont',price:parseFloat(sh.querySelector('#fc-cp').value)||0,status:fut?'planifié':'fait'});
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
  sh.querySelector('[data-a]').onclick=function(){P.toast('Lien de la fiche de box copié',{icon:'link'})};sh.querySelector('[data-b]').onclick=function(){sh.close();boxPdf(h)}}

function docSheet(h,d){var sh=P.sheet({title:d[0],icon:d[1],body:'<div class="stack" style="--g:14px"><div class="fc-doc"><div class="hrow sp"><b class="s">'+E(h.name)+'</b>'+U.chip(d[3],'line')+'</div><i style="width:70%"></i><i style="width:92%"></i><i style="width:84%"></i><i style="width:60%"></i><i style="width:88%;margin-top:8px"></i><i style="width:76%"></i><i style="width:40%"></i></div>'+
   '<dl class="lb-dl" style="margin:0"><div><dt>Ajouté par</dt><dd>'+E(DEMO?'Claire Dumont':gName())+'</dd></div><div><dt>Le</dt><dd>'+F.dateY(X(h).arrival)+'</dd></div><div><dt>Visible par</dt><dd>'+(h.owner?'Vous et '+D.member(h.owner).first:'L’équipe')+'</dd></div><div><dt>Format</dt><dd>PDF, 1,2 Mo</dd></div></dl></div>',
   foot:'<button class="btn" data-a>'+ICON('send','sm')+'Envoyer au vétérinaire</button><button class="btn pri" data-b>'+ICON('download','sm')+'Télécharger</button>'});
  sh.querySelector('[data-a]').onclick=function(){sh.close();P.toast('« '+d[0]+' » envoyé '+(DEMO?'au Dr Leclerc':'au vétérinaire')+' par lien sécurisé',{icon:'send'})};sh.querySelector('[data-b]').onclick=function(){docPdf(h,d)}}

function rationSheet(h,after){var sup=Object.keys(SUPP);
  var sh=P.sheet({title:'Ration de '+h.name.split(' ')[0],icon:'feed',body:'<div class="stack" style="--g:16px"><div class="hrow" style="--g:10px">'+U.hav(h)+'<div><b>'+E(h.name)+'</b><div class="xs mut">'+h.box+' · '+h.weight+' kg · note d’état '+String(nec(h)).replace('.',',')+' sur 5</div></div></div>'+
    '<div class="card flat list"><div class="li"><div class="grow"><div class="t">Foin de prairie</div><div class="s">Par jour, réparti sur 3 repas</div></div>'+stepper('hay',h.ration.hay,'kg')+'</div><div class="li"><div class="grow"><div class="t">'+grainType(h)+'</div><div class="s">Par jour, matin et soir</div></div>'+stepper('grain',h.ration.grain,'kg')+'</div></div>'+
    '<label class="field"><span>Complément</span><select class="in" id="al-sup">'+sup.map(function(s){return '<option'+(s===h.ration.supp?' selected':'')+'>'+s+'</option>'}).join('')+'</select></label>'+
    '<label class="field"><span>Consigne affichée sur le tableau d’écurie</span><input class="in" id="al-con" value="'+E(CONS[h.id]||'')+'" placeholder="Foin mouillé, pas de carottes…"></label>'+
    '<div class="card soft pad stack" style="--g:8px" id="al-sim"></div>'+
    '<div class="note">'+ICON('bulb','sm')+'<span>Repère : pour '+(+h.weight||(h.pony?380:550))+' kg et '+h.work+' h de travail par semaine, comptez '+Math.round(h.weight*.018)+' kg de foin et '+String(r5(Math.max(.5,h.work*.2))).replace('.',',')+' kg de granulés.</span></div></div>',
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
  var sh=P.sheet({title:'Enregistrer une pesée',icon:'weight',body:'<div class="stack" style="--g:16px"><div class="card flat list"><div class="li"><div class="grow"><div class="t">Poids</div><div class="s">Dernière pesée : '+h.weight+' kg</div></div><span class="lb-step" data-step="w" data-unit="kg"><button type="button" data-d="-1" title="Diminuer">'+ICON('minus','sm')+'</button><output data-v="'+w+'">'+w+' kg</output><button type="button" data-d="1" title="Augmenter">'+ICON('plus','sm')+'</button></span></div></div>'+
    '<div class="field"><span>Méthode</span>'+U.seg([['ruban','Ruban'],['bascule','Bascule'],['estim','Estimation']],'ruban','data-wm')+'</div>'+
    '<div class="field"><span>Note d’état corporel, de 0 à 5</span><div class="scroll-x">'+U.seg([1.5,2,2.5,3,3.5,4,4.5].map(function(v){return [String(v),String(v).replace('.',',')]}),String(n),'data-nec')+'</div><span class="xs mut" style="font-weight:400">Échelle de l’IFCE. On palpe les côtes, le garrot, l’arrière de l’épaule et l’attache de queue.</span></div></div>',
   foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-save>'+ICON('check','sm')+'Enregistrer</button>'});
  bindSteppers(sh,1,'kg',function(k,v){w=v});on(sh,'[data-nec]',function(b){n=parseFloat(b.getAttribute('data-nec'))});
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
  sh.querySelector('[data-save]').onclick=function(){h.weight=w;x.weights[11]=w;x.nec=n;h.bcs=n;sh.close();P.rerender();P.toast(h.name+' : '+w+' kg, note d’état '+String(n).replace('.',',')+'. La courbe est à jour.',{icon:'weight'})}}

function thrSheet(h){var v=h.workMax;
  var sh=P.sheet({title:'Seuil de charge',icon:'gauge',body:'<div class="stack" style="--g:16px"><p class="s mut">Au-delà du seuil, Stabl ne propose plus '+E(h.name)+' au montoir et prévient le moniteur qui compose la reprise.</p><div class="card flat list"><div class="li"><div class="grow"><div class="t">Heures de travail par semaine</div><div class="s">Recommandé : '+(h.pony?12:16)+' h pour un '+(h.pony?'poney':'cheval')+' de '+h.age+' ans</div></div><span class="lb-step" data-step="t" data-unit="h"><button type="button" data-d="-1" title="Diminuer">'+ICON('minus','sm')+'</button><output data-v="'+v+'">'+v+' h</output><button type="button" data-d="1" title="Augmenter">'+ICON('plus','sm')+'</button></span></div>'+
    '<div class="li"><div class="grow"><div class="t">Un jour de repos complet par semaine</div><div class="s">Paddock uniquement</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">Pas plus de 2 reprises à la suite</div><div class="s">Une heure de pause entre deux séances</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">Appliquer à tous les '+(h.pony?'poneys':'chevaux')+' de club</div></div>'+U.tog(false)+'</div></div></div>',
   foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-save>Enregistrer le seuil</button>'});
  bindSteppers(sh,1,'h',function(k,val){v=Math.max(1,val)});sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
  sh.querySelector('[data-save]').onclick=function(){h.workMax=v;sh.close();P.rerender();P.toast('Seuil de '+h.name+' réglé à '+v+' h par semaine',{icon:'gauge'})}}

function msgSheet(h){var own=h.owner?D.member(h.owner):null,to=own?own.first+' '+own.last:'Équipe d’écurie';
  var sh=P.sheet({title:'Écrire à '+to,icon:'chat',body:'<div class="stack" style="--g:14px"><div class="hrow" style="--g:10px">'+(own?U.av(own):sq('team'))+'<div><b>'+to+'</b><div class="xs mut">'+(own?'Propriétaire de '+E(h.name)+' · '+own.phone:'Palefreniers et moniteurs')+'</div></div></div>'+
    '<div class="field"><span>Canal</span>'+U.seg([['app','Notification'],['sms','SMS'],['mail','E-mail']],'app','data-ch')+'</div>'+
    '<label class="field"><span>Message</span><textarea class="in" id="fc-msg" style="min-height:130px">Bonjour '+(own?own.first:'à tous')+',\n\n'+(h.alerts[0]?h.name+' : '+h.alerts[0].charAt(0).toLowerCase()+h.alerts[0].slice(1)+'. ':'Des nouvelles de '+h.name+' : tout va bien ce matin. ')+'Je vous tiens au courant.\n\n'+E(gFirst())+'</textarea></label>'+
    '<div class="hrow wrap" style="--g:6px">'+['Joindre le compte rendu du vétérinaire','Proposer un rendez-vous','Joindre la facture'].map(function(t){return '<button class="tag" type="button">'+t+'</button>'}).join('')+'</div></div>',
   foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-send>'+ICON('send','sm')+'Envoyer le message</button>'});
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};sh.querySelector('[data-send]').onclick=function(){sh.close();P.toast('Message envoyé à '+to,{icon:'send',undo:function(){P.toast('Envoi annulé',{icon:'refresh'})}})}}

function moreSheet(h){var A=[['download','Exporter le carnet de santé en PDF','Carnet de santé de '+h.name+' exporté, 14 pages'],['doc','Imprimer la fiche complète','Fiche de '+h.name+' envoyée à l’imprimante du bureau'],['swap','Changer de box','Choisissez le nouveau box sur le plan de l’écurie'],['owner','Transférer la fiche à un nouveau propriétaire','Lien de transfert créé : le carnet de santé suit le cheval'],['link','Donner un accès invité au vétérinaire',DEMO?'Accès invité envoyé au Dr Leclerc, valable 30 jours':'Lien d’accès invité créé, valable 30 jours'],['folder','Archiver le cheval (départ du club)','Départ préparé : le registre des mouvements sera complété à la validation']];
  var sh=P.sheet({title:'Autres actions',icon:'more',body:'<div class="card flat">'+A.map(function(a,k){return '<div class="lb-row click" data-k="'+k+'">'+sq(a[0],'mut','sm')+'<div class="grow t">'+a[1]+'</div>'+ICON('right','sm')+'</div>'}).join('')+'</div>'});
  on(sh,'[data-k]',function(r){var a=A[+r.getAttribute('data-k')];sh.close();if(a[0]==='swap'&&P.mods.ecurie3d){P.go('ecurie3d',{id:h.id});return}if(a[0]==='download'){healthPdf(h);return}if(a[0]==='doc'){fichePdf(h);return}P.toast(a[2],{icon:a[0]})})}

/* ---------- l'écran ---------- */
var setTab=function(){};
P.mod({id:'cheval',role:'gerant',group:'Écurie',title:'Fiche cheval',icon:'horse',hidden:true,tab:'chevaux',phoneTitle:'Fiche cheval',
 render:function(el,ctx){
  var h=D.horse(ctx.params.id||'h01')||D.horses[0];
  /* club réel sans cheval : pas de fiche à montrer, on propose d'en ajouter un */
  if(!h){el.innerHTML='<div class="card">'+U.empty('horse','Aucun cheval pour l’instant','Ajoutez le premier cheval de l’écurie : sa fiche regroupera soins, travail, alimentation et coûts.','<button class="btn pri" data-addh>'+ICON('plus','sm')+'Ajouter un cheval</button>')+'</div>';var ab=el.querySelector('[data-addh]');if(ab)ab.onclick=function(){if(window.PL&&PL.forms&&PL.forms.horse)PL.forms.horse();else P.go('chevaux')};return}
  var x=X(h);if(P.setTitle)setTimeout(function(){if(P.route==='cheval'||!P.route)P.setTitle(h.name)},0);
  if(ctx.params.tab){FS.tab=ctx.params.tab;ctx.params.tab=null}
  if(!tabsFor(D.horse(ctx.params.id||'h01')||D.horses[0]).some(function(t){return t[0]===FS.tab}))FS.tab='vue';
  var z=zones(h),own=h.owner?D.member(h.owner):null,idx=hi(h),prev=D.horses[(idx+D.horses.length-1)%D.horses.length],next=D.horses[(idx+1)%D.horses.length];
  el.innerHTML='<div class="hrow sp" style="margin-bottom:12px"><a class="fc-back" data-go="chevaux" style="margin:0">'+ICON('back','sm')+'Tous les chevaux</a><div class="hrow" style="--g:4px"><button class="btn ghost icon sm" data-go="cheval" data-id="'+prev.id+'" title="Cheval précédent : '+E(prev.name)+'">'+ICON('left','sm')+'</button><span class="xs mut num">'+h.box+'</span><button class="btn ghost icon sm" data-go="cheval" data-id="'+next.id+'" title="Cheval suivant : '+E(next.name)+'">'+ICON('right','sm')+'</button></div></div>'+
   '<div class="card fc-hero"><div class="fc-stage"><div class="fc-gl"></div>'+
     '<div class="fc-st-top"><span class="fc-hint">'+ICON('rotate','sm')+'<span class="hide-s">Faites tourner '+E(h.name.split(' ')[0])+', touchez un point</span><span class="only-s">Touchez un point</span></span><button class="btn sm" data-move title="Voir le cheval en mouvement">'+ICON('play','sm')+'<span>En mouvement</span></button></div>'+
     '<div class="fc-zones scroll-x">'+ZK.map(function(k){return '<button class="fc-z" data-zone="'+k+'"><i style="--c:'+tone(z[k].st)+'"></i>'+z[k].l+'</button>'}).join('')+'</div></div>'+
    '<div class="fc-id"><div class="hrow wrap" style="--g:6px">'+stChip(h)+kindChip(h)+U.chip('Box '+h.box,'line')+(isRest(h)?U.chip('Au repos','line'):'')+'</div>'+
     '<div class="fc-nm">'+(function(){var u=phMain(h);return '<button class="fc-ph'+(u?'':' none')+'" data-fcph title="'+(u?'Voir les photos de '+E(h.name.split(' ')[0]):'Prendre '+E(h.name.split(' ')[0])+' en photo')+'">'+(u?'<img src="'+E(u)+'" alt="'+E(h.name)+'">':ICON('photo')+'<span>Photo</span>')+'</button>'})()+'<div class="fc-nmt"><h1>'+E(h.name)+'</h1><div class="mut" style="margin-top:6px">'+(DEMO?h.breed+' · '+h.sex.toLowerCase()+' '+h.coat.toLowerCase()+' · '+h.age+' ans · '+(h.height/100).toFixed(2).replace('.',',')+' m':[h.breed,((h.sex||'')+' '+(h.coat||'')).trim().toLowerCase(),h.age?h.age+' ans':'',+h.height?(h.height/100).toFixed(2).replace('.',',')+' m':''].filter(Boolean).map(E).join(' · '))+'</div></div></div>'+
     (h.alerts.length?'<div class="note '+(h.status==='bad'?'bad':'warn')+'">'+ICON('alert','sm')+'<span>'+h.alerts.map(E).join('. ')+'.</span></div>':'')+
     '<div class="fc-rings">'+RK.map(function(k){return ringHtml(h,k)}).join('')+'</div>'+
     '<dl class="lb-dl" style="margin:0"><div><dt>Propriétaire</dt><dd>'+(own?'<a data-own style="cursor:pointer" class="hrow" title="Ouvrir la fiche adhérent">'+U.av(own,'sm')+'<span class="ellip">'+E(own.first+' '+own.last)+'</span></a>':E(clubName()))+'</dd></div><div><dt>'+(x.rider?'Demi-pensionnaire':'Niveau')+'</dt><dd>'+(x.rider?'<span class="hrow">'+U.av(x.rider,'sm')+'<span class="ellip">'+D.name(x.rider)+'</span></span>':E(h.level||'–'))+'</dd></div>'+
      '<div><dt>Numéro SIRE</dt><dd>'+(x.sireNo?'<button class="mono" data-copy="'+E(x.sireNo)+'" title="Copier le numéro SIRE" style="font-weight:600">'+E(x.sireNo)+' '+ICON('copy','sm')+'</button>':'<span class="mut">À renseigner</span>')+'</dd></div><div><dt>Assurance</dt><dd class="ellip">'+(x.ins.co?E(x.ins.co):'<span class="mut">À renseigner</span>')+'</dd></div></dl>'+
     '<div class="fc-acts"><button class="btn pri" data-act="care">'+ICON('plus','sm')+'<span class="fc-al">Ajouter un soin</span><span class="fc-as">Nouveau soin</span></button><button class="btn icon" data-act="photo" title="Prendre une photo">'+ICON('photo','sm')+'</button><button class="btn" data-act="msg">'+ICON('chat','sm')+'Écrire</button><button class="btn icon" data-act="qr" title="Fiche de box et code à scanner">'+ICON('qr','sm')+'</button><button class="btn icon" data-act="more" title="Autres actions">'+ICON('more','sm')+'</button></div></div></div>'+
   (function(){var nd=nextDue(h),R=RULES[nd.k],p=loadP(h),st=dueSt(h,nd.k);
    return '<div class="fc-stats rise">'+
     '<button class="card fc-st d-travail" data-tabgo="travail"><span class="lab"><span class="ico sm">'+ICON('gauge','sm')+'</span>Travail cette semaine</span><span class="v num">'+h.work+'<small>h sur '+h.workMax+'</small></span>'+U.bar(Math.min(100,p),loadC(h))+'</button>'+
     '<button class="card fc-st d-chevaux" data-tabgo="alim"><span class="lab"><span class="ico sm">'+ICON('weight','sm')+'</span>Poids et état</span><span class="v num">'+(+h.weight||'–')+'<small>kg · '+necTxt(nec(h)).toLowerCase()+'</small></span><span class="fc-nec">'+[1,2,3,4,5].map(function(n){return '<i class="'+(n<nec(h)?'on':n===Math.round(nec(h))?'cur':'')+'"></i>'}).join('')+'</span></button>'+
     '<button class="card fc-st d-soins'+(st!=='ok'?' tint':'')+'" data-tabgo="sante"><span class="lab"><span class="ico sm">'+ICON(R.icon,'sm')+'</span>Prochain soin</span><span class="v">'+R.l+'</span><span class="s">'+cap(dueTxt(nd.n))+(tourOf(h,nd.k)?', tournée planifiée':'')+'</span></button>'+
     '<button class="card fc-st d-argent" data-tabgo="couts"><span class="lab"><span class="ico sm">'+ICON('euro','sm')+'</span>'+(DEMO?'Coût de revient':'Alimentation estimée')+'</span><span class="v num">'+F.eur(h.costMonth)+'<small>par mois</small></span><span class="s">'+(DEMO||x.income?(x.income-h.costMonth>=0?'Marge de '+F.eur(x.income-h.costMonth):'Perte de '+F.eur(h.costMonth-x.income))+' ce mois-ci':'Selon la ration saisie')+'</span></button></div>'})()+
   '<div class="fc-tabs">'+U.tabs(tabsFor(h),FS.tab,'data-ct')+'</div><div id="fc-body"></div>';

  /* 3D */
  var stage=el.querySelector('.fc-stage'),gl=el.querySelector('.fc-gl'),api=null,moving=false;
  function mount(){if(api)api.dispose();gl.innerHTML='';
    api=P.gl.horse(gl,{points:moving?[]:ZK.map(function(k){return {id:k,label:z[k].l,pos:z[k].pos,c:tone(z[k].st)}}),onPick:function(id){zoneSheet(h,id)},walk:moving,rot:-.78});
    if(!moving)ZK.forEach(function(k){if(z[k].st!=='ok'){var b=gl.querySelector('[data-hot="'+k+'"]');if(b)b.classList.add('show')}});
    P.$$('.h3d',gl).forEach(function(b){b.title='Ouvrir l’historique de la zone'})}
  mount();
  /* étiquettes des points 3D : on masque celle qui chevaucherait une autre (petits écrans surtout) */
  (function dec(){if(!gl.isConnected)return;var seen=[];P.$$('.h3d.show',gl).forEach(function(b){var sp=b.querySelector('span');if(!sp)return;var r=sp.getBoundingClientRect(),hit=seen.some(function(q){return r.left<q.right+4&&r.right>q.left-4&&r.top<q.bottom+4&&r.bottom>q.top-4});b.classList.toggle('fc-hide',hit);if(!hit)seen.push(r)});setTimeout(dec,400)})();
  el.querySelector('[data-move]').onclick=function(e){moving=!moving;stage.classList.toggle('moving',moving);e.currentTarget.innerHTML=ICON(moving?'pause':'play','sm')+'<span>'+(moving?'Revenir aux soins':'En mouvement')+'</span>';mount()};

  /* onglets */
  var body=el.querySelector('#fc-body'),clock=null;
  function draw(){var f={vue:tabVue,sante:tabSante,travail:tabTravail,alim:tabAlim,journal:tabJournal,couts:tabCouts,camera:tabCam,repro:tabRepro,photos:tabPhotos}[FS.tab]||tabVue;body.innerHTML=f(h,x);var pg=body.querySelector('[data-phgal]');if(pg)phGallery(pg,h,{after:function(){P.rerender()}});P.animate(body);swap(body);
    if(clock){clearInterval(clock);clock=null}var ck=body.querySelector('[data-clock]');
    if(ck){var s=7;clock=setInterval(function(){if(!ck.isConnected){clearInterval(clock);return}s++;ck.textContent=DEMO?'17/11/2026 09:'+String(41+Math.floor(s/60)).padStart(2,'0')+':'+String(s%60).padStart(2,'0'):new Date().toLocaleString('fr-FR')},1000)}}
  setTab=function(t){FS.tab=t;P.$$('[data-ct]',el).forEach(function(b){b.setAttribute('aria-selected',b.getAttribute('data-ct')===t)});draw();var tb=el.querySelector('.fc-tabs');if(tb&&tb.scrollIntoView)tb.scrollIntoView({block:'start',behavior:P.RM?'auto':'smooth'})};
  draw();
  on(el,'[data-ct]',function(b){FS.tab=b.getAttribute('data-ct');draw()});
  on(el,'[data-tabgo]',function(b){setTab(b.getAttribute('data-tabgo'))});
  on(el,'[data-ring]',function(b){var R=RULES[b.getAttribute('data-ring')];FS.care=R?R.k:'all';setTab('sante')});
  on(el,'[data-zone]',function(b){zoneSheet(h,b.getAttribute('data-zone'))});
  on(el,'[data-fcph]',function(){if(phMain(h))setTab('photos');else phCapture(h,{})});
  on(el,'[data-cf]',function(b){FS.care=b.getAttribute('data-cf');draw()});
  on(el,'[data-jf]',function(b){FS.jr=b.getAttribute('data-jf');draw()});
  on(el,'[data-doc]',function(r){var docs=DOCS.filter(function(d){return h.owner||(d[3]!=='Contrat'&&d[0]!=='Carte d’immatriculation')});docSheet(h,docs[+r.getAttribute('data-doc')])});
  on(el,'[data-plan]',function(b){var k=b.getAttribute('data-plan');careSheet(h,k?RULES[k].k:'Vétérinaire')});
  on(el,'[data-own]',function(){goOr('adherent',{id:h.owner},'La fiche de '+D.name(h.owner)+' s’ouvre dans l’écran Adhérents')});
  on(el,'[data-copy]',function(b){try{var cp=navigator.clipboard&&navigator.clipboard.writeText(b.getAttribute('data-copy'));if(cp&&cp.catch)cp.catch(function(){})}catch(e){}P.toast('Numéro SIRE copié',{icon:'copy'})});
  on(el,'[data-given]',function(b){var o=rx(h)[0],t=b.parentNode.querySelector('[data-givent]');setTimeout(function(){var n=P.$$('[data-given][aria-checked="true"]',b.parentNode).length;if(t)t.textContent=n+' prises sur '+o.given.length;P.toast(b.getAttribute('aria-checked')==='true'?'Prise notée au registre, signée '+(DEMO?'Claire Dumont':gName()):'Prise retirée du registre',{icon:'pill'})},0)});
  var ACT={
   care:function(){careSheet(h)},photo:function(){phCapture(h,{})},msg:function(){msgSheet(h)},qr:function(){qrSheet(h)},more:function(){moreSheet(h)},
    sire:function(){if(!DEMO){P.toast('La comparaison avec l’IFCE arrive bientôt.',{icon:'info'});return}P.toast('Identité conforme à la fiche de l’IFCE, vérifiée à l’instant',{icon:'checkc'})},
   editid:function(){P.sheet({title:'Modifier l’identité',icon:'edit',body:'<div class="stack" style="--g:12px"><div class="g2" style="--g:12px">'+[['Nom',h.name],['Box',h.box],['Paddock',h.paddock],['Niveau',h.level],['Taille (cm)',h.height],['Caractère',h.mood]].map(function(a){return '<label class="field"><span>'+a[0]+'</span><input class="in" value="'+E(a[1])+'"></label>'}).join('')+'</div><div class="note">'+ICON('lock','sm')+'<span>Le numéro SIRE, la robe et les origines viennent de l’IFCE et ne se modifient pas ici.</span></div></div>',foot:'<button class="btn pri" data-s>Enregistrer</button>'}).querySelector('[data-s]').onclick=function(){P.closeSheets();P.toast('Fiche de '+h.name+' mise à jour')}},
   adddoc:function(){P.toast('Document ajouté au dossier de '+h.name+' et classé dans ses documents',{icon:'folder'})},
   opendoc:function(){docSheet(h,['Ordonnance et compte rendu','doc','','Santé'])},
   rxadd:function(){careSheet(h,'Vétérinaire')},
   regpdf:function(){breedPdf(h)},
    moves:function(){if(!DEMO){P.sheet({title:'Mouvements de '+h.name.split(' ')[0],icon:'route',body:(Array.isArray(h.moves)&&h.moves.length?'<div class="tl">'+h.moves.map(function(m){return '<div class="ev"><b class="s">'+E(m.label||'')+'</b><div class="xs mut">'+F.dateY(m.date)+(m.note?' · '+E(m.note):'')+'</div></div>'}).join('')+'</div>':U.empty('route','Aucun mouvement enregistré','Les entrées, sorties et concours de '+E(h.name.split(' ')[0])+' s’afficheront ici.'))});return}P.sheet({title:'Mouvements de '+h.name.split(' ')[0],icon:'route',body:'<div class="tl">'+demoMoves(h).map(function(m){return '<div class="ev"><b class="s">'+m[1]+'</b><div class="xs mut">'+F.dateY(m[0])+' · '+m[2]+'</div></div>'}).join('')+'</div>'})},
   thr:function(){thrSheet(h)},plan:function(){goOr('planning',{horse:h.id},'Le planning de '+h.name+' s’ouvre dans l’écran Planning')},
   pair:function(){x.sensor=true;draw();P.toast('Capteur de selle associé à '+h.name,{icon:'sensor'})},
   ration:function(){rationSheet(h)},weigh:function(){weighSheet(h)},cure:function(){P.toast('Cure de 3 semaines ajoutée, la première dose part au tableau de ce soir',{icon:'drop'})},
   jphoto:function(){P.toast('Photo jointe à la note',{icon:'image'})},jmic:function(){var t=body.querySelector('#fc-jt');t.value='Marche en main 15 minutes dans l’allée, calme, bon appétit au retour.';P.toast('Dictée transcrite',{icon:'mic'})},
   jpost:function(){var t=body.querySelector('#fc-jt'),v=t.value.trim();if(!v){t.focus();P.toast('Écrivez d’abord quelques mots',{icon:'info'});return}var k=(body.querySelector('[data-jk][aria-selected="true"]')||{getAttribute:function(){return 'soin'}}).getAttribute('data-jk');
     if(DEMO)(ST.jr[h.id]=ST.jr[h.id]||[]).unshift({who:'s01',role:'Gérante',when:'À l’instant',text:v,kind:k,mood:4});
      else D.journal.unshift({id:'j_'+Date.now().toString(36),horse:h.id,who:(D.me&&D.me.gerant)||'me',role:'Gérant',when:'Le '+F.date(iso(0)),date:iso(0),text:v,kind:k,mood:4});FS.jr='all';draw();P.toast('Publié dans le journal'+(own?'. '+own.first+' est prévenue.':''),{icon:'send'})},
   invite:function(){P.toast('Invitation envoyée. L’accès se limite au journal et au carnet de santé.',{icon:'mail'})},
   relance:function(){P.toast('Relance envoyée à '+own.first+' par e-mail et SMS',{icon:'send'})},
   rebill:function(){var l=rebillLines(h).filter(function(q){return !ST.rebill[q.id]}),s=l.reduce(function(a,q){return a+q.v},0);l.forEach(function(q){ST.rebill[q.id]=1});draw();P.toast(F.eur(s)+' ajoutés à la facture de décembre de '+own.first,{icon:'invoice',undo:function(){l.forEach(function(q){delete ST.rebill[q.id]});draw()}})},
   camfull:function(){var c=body.querySelector('.fc-cam');if(c&&c.requestFullscreen){try{c.requestFullscreen()}catch(e){}}P.toast('Caméra du box '+h.box+' en plein écran',{icon:'expand'})},
   camclip:function(){P.toast('Extrait de 30 secondes enregistré dans le journal de '+h.name,{icon:'rec'})},camtalk:function(){P.toast('Micro ouvert sur le haut-parleur du box '+h.box,{icon:'mic'})},
   cams:function(){goOr('cameras',{},'Le mur de caméras s’ouvre dans l’écran Caméras')},
   rpstart:function(){D.breeding[h.id]={stage:'chaleurs',heats:[iso(0)],plan:'Programme de saillie à définir',alert:false};draw();P.toast('Suivi de reproduction '+deN(h.name)+' démarré, chaleurs notées aujourd’hui',{icon:'heart'})},
   rpheat:function(){var b=D.breeding[h.id];if(b.heats.indexOf(iso(0))<0)b.heats.push(iso(0));draw();P.toast('Chaleurs '+deN(h.name)+' notées aujourd’hui. Prochaines attendues le '+F.date(addDays(iso(0),21)),{icon:'heart'})},
   rpecho:function(){careSheet(h,'Vétérinaire')},
   rpalert:function(b){var br=D.breeding[h.id];br.alert=!br.alert;draw();P.toast(br.alert?'Alerte de poulinage activée : caméra du box '+h.box+' et ceinture surveillées chaque nuit':'Alerte de poulinage suspendue',{icon:'bell'})},
   rptest:function(){P.toast(DEMO?'Alerte de test : appel et SMS envoyés à Claire, Antoine et au Dr Leclerc avec l’image de la caméra du box '+h.box:'Alerte de test envoyée aux personnes prévenues',{icon:'bell',ms:5200})},clip:function(){P.toast('Lecture de l’extrait dans la vignette',{icon:'play'})}};
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
  D.care.forEach(function(c){if(DEMO&&RK.some(function(k){return RULES[k].k===c.kind})||c.status==='fait'||!c.date)return;ev.push({date:c.date,time:c.time,kind:c.kind,label:hname(c.horse)+(/^\d/.test(c.time)?' · '+hm(c.time):''),care:c.id})});
  D.horses.forEach(function(h){RK.forEach(function(k){if(tourOf(h,k))return;if(!DEMO&&D.care.some(function(c){return c.horse===h.id&&c.kind===RULES[k].k&&c.status!=='fait'}))return;var n=dueN(h,k);if(n>36)return;var d=n<0?iso(0):due(h,k),key=d+k;
    if(!grp[key]){grp[key]={date:d,kind:RULES[k].k,key:k,todo:true,horses:[],late:false};ev.push(grp[key])}grp[key].horses.push(h.id);if(n<0)grp[key].late=true})});
  ev.forEach(function(e){if(e.todo)e.label=e.kind+' · '+(e.horses.length>1?e.horses.length+' chevaux':hname(e.horses[0]))});
  return ev.sort(function(a,b){return a.date<b.date?-1:a.date>b.date?1:(a.time||'99')<(b.time||'99')?-1:1})}
/* abonnement iCalendar : lien webcal et vrai fichier .ics des soins */
function icsText(kinds){var L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Stabl//Soins//FR','CALSCALE:GREGORIAN','METHOD:PUBLISH','X-WR-CALNAME:Soins · '+clubName(),'X-WR-TIMEZONE:Europe/Paris'];
  function esc(t){return String(t).replace(/[\\;,]/g,function(c){return '\\'+c}).replace(/\n/g,'\\n')}
  function d8(d){return d.replace(/-/g,'')}
  calEvents().filter(function(e){return kinds[e.kind]!==false}).forEach(function(e,i){var t=/^\d{1,2}:\d{2}$/.test(e.time||'')?e.time.split(':'):null,uid='soin-'+d8(e.date)+'-'+i+'@stablapp.fr';
    L.push('BEGIN:VEVENT','UID:'+uid,'DTSTAMP:20261117T094100Z');
    if(t){var hh=('0'+t[0]).slice(-2),end=('0'+Math.min(23,+t[0]+1)).slice(-2);L.push('DTSTART;TZID=Europe/Paris:'+d8(e.date)+'T'+hh+t[1]+'00','DTEND;TZID=Europe/Paris:'+d8(e.date)+'T'+end+t[1]+'00')}
    else{var nx=new Date(e.date+'T12:00:00');nx.setDate(nx.getDate()+1);L.push('DTSTART;VALUE=DATE:'+d8(e.date),'DTEND;VALUE=DATE:'+d8(iso2(nx)))}
    L.push('SUMMARY:'+esc((e.todo?'À planifier : ':'')+e.label),'CATEGORIES:'+esc(e.kind),'DESCRIPTION:'+esc(e.horses?e.horses.map(hname).join(', '):clubName()),'END:VEVENT')});
  L.push('END:VCALENDAR');return L.join('\r\n')}
function iso2(d){return d.getFullYear()+'-'+('0'+(d.getMonth()+1)).slice(-2)+'-'+('0'+d.getDate()).slice(-2)}
function icsSheet(){if(!DEMO&&P.mods['lv-calendriers']){P.go('lv-calendriers');return}var kinds={},url='webcal://cal.piaffe.app/ecurie-des-tilleuls/soins-7f3k2q.ics';
  var sh=P.sheet({title:'S’abonner au calendrier des soins',icon:'calendar_add',body:function(b){
    function draw(){var n=calEvents().filter(function(e){return kinds[e.kind]!==false}).length;
     b.innerHTML='<div class="stack" style="--g:18px"><p class="s mut">Les rendez-vous et les échéances s’affichent dans votre agenda et se mettent à jour toutes les heures. Rien à recopier.</p>'+
      '<div><div class="eyebrow" style="margin-bottom:8px">Lien d’abonnement</div><div class="so-ics"><input class="in mono" readonly value="'+url+'" aria-label="Lien d’abonnement"><button class="btn" data-cp>'+ICON('copy','sm')+'Copier</button></div></div>'+
      '<div><div class="eyebrow" style="margin-bottom:8px">Ajouter en un clic</div><div class="so-icsg">'+[['Google Agenda','globe'],['Apple Calendrier','calendar_add'],['Outlook','mail']].map(function(a){return '<button class="btn" data-app="'+a[0]+'">'+ICON(a[1],'sm')+a[0]+'</button>'}).join('')+'</div></div>'+
      '<div><div class="hrow sp" style="margin-bottom:8px"><div class="eyebrow">Ce que le calendrier contient</div><span class="xs mut num">'+n+' événements</span></div><div class="lb-tags" style="flex-wrap:wrap">'+Object.keys(KINDC).map(function(k){return '<button class="tag" data-manual data-ik="'+k+'" aria-pressed="'+(kinds[k]!==false)+'"><i style="width:7px;height:7px;border-radius:50%;background:'+KINDC[k]+'"></i>'+k+'</button>'}).join('')+'</div></div>'+
      '<div class="note">'+ICON('shield','sm')+'<span>Chaque praticien peut recevoir son propre lien, limité à ses tournées. Le lien se révoque d’un clic.</span></div></div>'}
    draw();
    on(b,'[data-ik]',function(x){var k=x.getAttribute('data-ik');kinds[k]=kinds[k]===false;draw()});
    on(b,'[data-cp]',function(){try{navigator.clipboard&&navigator.clipboard.writeText(url)}catch(e){}P.toast('Lien d’abonnement copié',{icon:'copy'})});
    on(b,'[data-app]',function(x){P.toast('Abonnement ajouté à '+x.getAttribute('data-app')+' : les soins apparaissent sous « Soins · '+clubName()+' »',{icon:'calendar_add'})})},
   foot:'<button class="btn ghost" data-dl>'+ICON('download','sm')+'Télécharger le fichier .ics</button><button class="btn pri" data-sub>'+ICON('calendar_add','sm')+'Ouvrir dans mon agenda</button>'});
  sh.querySelector('[data-dl]').onclick=function(){var n='soins-'+fslug(clubName())+'.ics';P.download(n,icsText(kinds),null,{msg:'Fichier '+n+' téléchargé : ouvrez-le pour ajouter les soins à votre agenda'})};
  sh.querySelector('[data-sub]').onclick=function(){sh.close();P.toast('Votre agenda s’ouvre pour confirmer l’abonnement',{icon:'calendar_add'})};
  return sh}
function evBtn(e,i){var c=KINDC[e.kind]||'var(--acc)';return '<button class="so-ev'+(e.todo?' todo':'')+(e.late?' late':'')+'" style="--c:'+c+'" data-ev="'+i+'" title="'+E(e.label)+(e.todo?' (à planifier)':'')+'"><i></i><span>'+E(e.label).replace(' · ','</span><small>')+(e.label.indexOf(' · ')>=0?'</small>':'</span>')+'</button>'}

function tabCal(){var ev=calEvents().filter(function(e){return !SO.hide[e.kind]}),kinds=Object.keys(KINDC),h='';
  SO._ev=ev;
  h+='<div class="card"><div class="ch" style="padding-bottom:12px"><div><h3>'+(DEMO?'Novembre et décembre 2026':(function(){var M=['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'],a=D.day(-1),b=D.day(33);return a.getMonth()===b.getMonth()?M[a.getMonth()]+' '+a.getFullYear():M[a.getMonth()]+(a.getFullYear()!==b.getFullYear()?' '+a.getFullYear():'')+' et '+M[b.getMonth()].toLowerCase()+' '+b.getFullYear()})())+'</h3><div class="xs mut">Plein : rendez-vous pris. Contour : échéance à planifier.</div></div><button class="btn ghost sm" data-act="ics">'+ICON('calendar_add','sm')+'<span class="hide-s">S’abonner au calendrier</span><span class="only-s">S’abonner</span></button></div>'+
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
  return '<div class="fc-cols rise"><div class="stack" style="--g:14px">'+(D.tours.length?'':'<div class="card">'+U.empty('route','Aucune tournée prévue','Regroupez les chevaux qui ont la même échéance pour un seul passage du praticien.','<button class="btn pri sm" data-newtour="farrier">'+ICON('route','sm')+'Planifier une tournée</button>')+'</div>')+D.tours.slice().sort(function(a,b){return a.date<b.date?-1:1}).map(function(t){var p=prat(t.pr),c=KINDC[t.kind];
    return '<div class="card so-tour"><div class="hrow" style="align-items:flex-start"><span class="lb-sq" style="background:color-mix(in srgb,'+c+' 14%,var(--surface));color:'+c+'">'+ICON(KINDI[t.kind],'')+'</span><div class="grow"><div class="hrow wrap" style="--g:8px"><b class="l disp">'+t.kind+' · '+p.short+'</b>'+tourStatus(t)+'</div><div class="s mut" style="margin-top:2px">'+F.dateL(t.date).replace(/^./,function(c){return c.toUpperCase()})+' à '+hm(t.time)+' · '+E(t.note)+'</div></div></div>'+
      '<div class="hrow wrap" style="--g:6px">'+t.horses.map(function(id){var h=D.horse(id);return '<span class="chip lg" data-go="cheval" data-id="'+id+'" style="cursor:pointer;padding-left:4px">'+U.hav(h,'sm')+E(h.name)+'</span>'}).join('')+'</div>'+
      '<div class="hrow wrap sp"><span class="s mut">'+t.horses.length+' chevaux · estimation <b style="color:var(--ink)" class="num">'+F.eur(tourCost(t))+'</b>'+(p.trip?' dont '+F.eur(p.trip)+' de déplacement partagé':'')+'</span><div class="hrow" style="--g:6px">'+(t.status!=='confirmé'?'<button class="btn ghost sm" data-nudge="'+t.id+'">'+ICON('send','sm')+'Relancer</button>':'')+'<button class="btn sm" data-tour="'+t.id+'">Ouvrir la tournée</button></div></div></div>'}).join('')+'</div>'+
   '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>Regroupements proposés</h3>'+ICON('route')+'</div><div style="padding:6px 0 4px">'+(sg.length?sg.map(function(s){var R=RULES[s.k],p=R.who==='eq'?null:prat(R.who),save=p?p.trip*(s.l.length-1):0;
      return '<div class="lb-row" style="align-items:flex-start">'+sq(R.icon,'','sm')+'<div class="grow"><div class="t">'+R.l+' : '+s.l.length+' chevaux à regrouper</div><div class="s">'+s.l.slice(0,3).map(function(h){return h.name}).join(', ')+(s.l.length>3?' et '+(s.l.length-3)+' autres':'')+' · échéances du '+F.date(due(s.l[0],s.k))+' au '+F.date(due(s.l[s.l.length-1],s.k))+'</div>'+(save?'<div class="xs okc b" style="margin-top:3px">'+F.eur(save)+' de déplacements économisés</div>':'')+'<button class="btn sm" style="margin-top:8px" data-newtour="'+s.k+'">Préparer la demande</button></div></div>'}).join(''):U.empty('checkc','Tout est déjà regroupé','Aucun soin isolé dans les semaines qui viennent.'))+'</div></div>'+
    '<div class="card"><div class="ch"><h3>Praticiens</h3><button class="btn ghost sm" data-act="addprat">'+ICON('plus','sm')+'Ajouter</button></div><div style="padding:6px 0 4px">'+(D.practitioners.length?'':'<div class="cb"><span class="s mut">Ajoutez votre vétérinaire, votre maréchal et votre dentiste pour leur envoyer les tournées.</span></div>')+D.practitioners.map(function(p){return '<div class="lb-row">'+sq(KINDI[p.kinds[0]],'mut','sm')+'<div class="grow"><div class="t ellip">'+p.name+'</div><div class="s ellip">'+p.job+' · '+p.days.toLowerCase()+'</div></div><button class="btn ghost icon sm" data-call="'+p.id+'" title="Appeler '+p.name+'">'+ICON('phone','sm')+'</button></div>'}).join('')+'</div>'+
     '<div class="cf"><span class="xs mut">Chaque praticien reçoit un lien invité : il voit la liste, coche ses passages et dépose ses comptes rendus sans créer de compte.</span></div></div></div></div>'}

function expChip(p){var n=F.days(p.exp);return n<0?U.chip('Périmé depuis '+(-n)+' j','bad',true):n<=60?U.chip('Périme dans '+n+' j','warn',true):'<span class="num">'+F.dateY(p.exp)+'</span>'}
function tabPharma(){var s=tabPharma0();return DEMO?s:s.replace(/<!--d-->[\s\S]*$/,'')}
function tabPharma0(){var ph=D.pharmacy,exp=ph.filter(function(p){return F.days(p.exp)<0}).length,low=ph.filter(function(p){return p.qty<p.min}).length;
  return '<div class="fc-cols rise"><div class="stack" style="--g:14px">'+((exp||low)?'<div class="note warn">'+ICON('alert','sm')+'<span>'+(exp?'<b>'+exp+' produit périmé</b> à sortir de l’armoire. ':'')+(low?'<b>'+low+' produit sous le seuil</b> : les vermifuges manquent pour la prochaine série.':'')+'</span></div>':'')+
    '<div class="card"><div class="ch" style="padding-bottom:12px"><div><h3>Pharmacie de l’écurie</h3><div class="xs mut">'+(DEMO?'Armoire fermée à clé, sellerie · ':'')+ph.length+' produit'+(ph.length>1?'s':'')+' suivi'+(ph.length>1?'s':'')+' par lot</div></div><button class="btn sm" data-act="addmed">'+ICON('scan','sm')+'<span class="hide-s">Scanner une boîte</span></button></div>'+
    T([{l:'Médicament',f:function(p){return '<div style="max-width:clamp(180px,24cqw,300px)"><div class="b ellip">'+p.name+'</div><div class="xs mut ellip">'+p.form+' · '+p.use+'</div><div class="xs mut ellip" style="margin-top:2px">Lot <span class="mono" style="font-size:13px">'+p.lot+'</span> · '+(p.rx?'sur ordonnance':'vente libre')+(p.wait==='Aucun'?'':' · attente : '+p.wait.toLowerCase())+'</div></div>'}},
       {l:'Stock',f:function(p){return '<span class="num b '+(p.qty<p.min?'warnc':'')+'">'+p.qty+'</span> <span class="xs mut">'+p.unit+'</span>'}},
       {l:'Péremption',f:expChip},
       {l:'',f:function(p){return F.days(p.exp)<0?'<button class="btn sm danger" data-drop="'+p.id+'">Retirer</button>':'<button class="btn sm" data-give="'+p.id+'">Administrer</button>'}}],ph,{card:false})+(ph.length?'':U.empty('pill','Aucun médicament suivi','Notez les produits de l’armoire à pharmacie avec leur lot et leur date de péremption.'))+'</div></div>'+
   '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>Registre sanitaire</h3>'+(DEMO?U.chip('À jour','ok',true):'')+'</div><div style="padding:6px 0 4px">'+(D.register.length?'':'<div class="cb"><span class="s mut">Chaque médicament administré depuis la pharmacie s’inscrit ici, daté et signé.</span></div>')+D.register.slice(0,6).map(function(r){return '<div class="lb-row" style="align-items:flex-start">'+U.hav(r.horse,'sm')+'<div class="grow"><div class="t ellip">'+hname(r.horse)+' · '+r.prod+'</div><div class="s">'+r.dose+'</div><div class="xs mut" style="margin-top:2px">'+F.rel(r.date)+' à '+hm(r.time)+' · '+r.by+' · lot <span class="mono" style="font-size:13px">'+r.lot+'</span></div></div></div>'}).join('')+'</div>'+
     '<div class="cf" style="flex-wrap:wrap"><button class="btn sm" data-act="regexp">'+ICON('download','sm')+'Exporter le trimestre</button><button class="btn ghost sm" data-act="regall">Tout le registre</button></div></div>'+
    '<div class="card"><div class="ch"><h3>Obligations sanitaires</h3></div><div style="padding:6px 0 4px">'+(!DEMO?
     [['Vétérinaire sanitaire','Déclarez-le à la DDPP de votre département.'],['Registre d’élevage','Tenu à jour par Stabl à chaque soin, conservé 5 ans.'],['Visite sanitaire obligatoire','Tous les 2 ans, avec votre vétérinaire sanitaire.'],['Lieu de détention','Déclaré au SIRE, avec le nombre d’équidés présents.']].map(function(a){return '<div class="lb-row">'+sq('info','mut','sm')+'<div class="grow"><div class="t">'+a[0]+'</div><div class="s">'+a[1]+'</div></div></div>'}).join('')+'</div></div></div></div><!--d-->':'')+
     '<div class="lb-row">'+sq('checkc','ok','sm')+'<div class="grow"><div class="t">Vétérinaire sanitaire déclaré</div><div class="s">Dr Antoine Leclerc, déclaré à la DDPP des Yvelines</div></div></div>'+
     '<div class="lb-row">'+sq('checkc','ok','sm')+'<div class="grow"><div class="t">Registre du 3e trimestre clos</div><div class="s">Archivé le 30 septembre, conservé 5 ans, non modifiable</div></div></div>'+
     '<div class="lb-row">'+sq('clock','warn','sm')+'<div class="grow"><div class="t">Visite sanitaire obligatoire</div><div class="s">Tous les 2 ans. Prochaine avant le 14 mars 2027</div></div><button class="btn ghost sm" data-act="visit">Planifier</button></div>'+
     '<div class="lb-row">'+sq('checkc','ok','sm')+'<div class="grow"><div class="t">Lieu de détention déclaré au SIRE</div><div class="s">Détenteur n° 78 512 004, 40 équidés présents</div></div></div></div></div></div></div>'}

function allRebill(){var l=[];D.horses.filter(function(h){return h.owner}).forEach(function(h){rebillLines(h).forEach(function(q){if(F.days(q.d)>=-21&&!ST.rebill[q.id])l.push({id:q.id,h:h,d:q.d,l:q.l,v:q.v})})});return l.sort(function(a,b){return a.d<b.d?1:-1})}
function tabRebill(){var l=allRebill(),sum=l.reduce(function(a,q){return a+q.v},0),owners={};if(SO.rb0==null)SO.rb0=sum+(DEMO?84:0);l.forEach(function(q){owners[q.h.owner]=1});
  return '<div class="fc-cols rise"><div class="card">'+(l.length?'<div class="ch" style="padding-bottom:12px"><div><h3>Soins à refacturer</h3><div class="xs mut">'+l.length+' lignes pour '+Object.keys(owners).length+' propriétaires, sur les 3 dernières semaines</div></div><button class="btn pri sm" data-act="rball">'+ICON('invoice','sm')+'Tout refacturer, '+F.eur(sum)+'</button></div>'+
    T([{l:'Cheval',f:function(q){return '<div class="hrow">'+U.hav(q.h,'sm')+'<div style="min-width:0"><div class="b ellip">'+E(q.h.name)+'</div><div class="xs mut ellip">'+D.name(q.h.owner)+'</div></div></div>'}},
       {l:'Soin',hide:true,f:function(q){return '<div style="max-width:210px"><div class="ellip">'+E(q.l)+'</div><div class="xs mut num">'+F.date(q.d)+'</div></div>'}},
       {l:'Montant',n:true,f:function(q){return '<b>'+F.eur(q.v)+'</b>'}},
       {l:'',f:function(q){return '<button class="btn sm" data-rb="'+q.id+'">Refacturer</button>'}}],l.slice(0,14),{card:false})+(l.length>14?'<div class="cf"><span class="xs mut">Et '+(l.length-14)+' autres lignes, comprises dans le total.</span></div>':''):
    U.empty('checkc',DEMO?'Tout est refacturé':'Rien à refacturer','Les soins de propriétaires notés avec un coût arriveront ici dès qu’ils seront faits.'))+'</div>'+
   '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>Règles de refacturation</h3></div><div class="list"><div class="li"><div class="grow"><div class="t">Refacturation automatique</div><div class="s">Chaque soin validé part sur la facture mensuelle du propriétaire</div></div>'+U.tog(true)+'</div>'+
     '<div class="li"><div class="grow"><div class="t">Partager le déplacement</div><div class="s">Divisé entre les chevaux de la tournée</div></div>'+U.tog(true)+'</div>'+
     '<div class="li"><div class="grow"><div class="t">Frais de gestion</div><div class="s">Ajoutés à chaque soin avancé par le club</div></div><span class="lb-step" data-step="fee" data-unit="%"><button type="button" data-d="-1" title="Diminuer">'+ICON('minus','sm')+'</button><output data-v="5">5 %</output><button type="button" data-d="1" title="Augmenter">'+ICON('plus','sm')+'</button></span></div>'+
     '<div class="li"><div class="grow"><div class="t">Joindre la facture du praticien</div><div class="s">Le propriétaire voit le justificatif</div></div>'+U.tog(true)+'</div></div></div>'+
    '<div class="card pad stack" style="--g:8px"><div class="eyebrow">Ce mois-ci</div><div class="hrow sp s"><span class="mut">Soins avancés par le club</span><b class="num">'+F.eur(SO.rb0)+'</b></div><div class="hrow sp s"><span class="mut">Déjà refacturés</span><b class="num">'+F.eur(SO.rb0-sum)+'</b></div><div class="hrow sp s"><span class="mut">Restent à refacturer</span><b class="num '+(sum?'warnc':'okc')+'">'+F.eur(sum)+'</b></div></div></div></div>'}

/* ---------- feuilles ---------- */
function tourSheet(t){var p=prat(t.pr),c=KINDC[t.kind],done={};
  var sh=P.sheet({title:t.kind+' · '+F.date(t.date),icon:KINDI[t.kind],wide:true,body:function(b){
    b.innerHTML='<div class="stack" style="--g:16px"><div class="card flat lb-row">'+sq(KINDI[t.kind])+'<div class="grow"><div class="t">'+p.name+'</div><div class="s">'+p.job+' · '+p.phone+'</div></div>'+tourStatus(t)+'</div>'+
     '<div class="g3" style="--g:10px"><div class="card soft" style="padding:12px"><div class="xs mut">Rendez-vous</div><b>'+F.dateL(t.date)+', '+hm(t.time)+'</b></div><div class="card soft" style="padding:12px"><div class="xs mut">Chevaux</div><b>'+t.horses.length+'</b></div><div class="card soft" style="padding:12px"><div class="xs mut">Estimation</div><b class="num">'+F.eur(tourCost(t))+'</b></div></div>'+
     '<div><div class="hrow sp" style="margin-bottom:8px"><div class="eyebrow">Ordre de passage</div><span class="xs mut" id="so-td">0 fait sur '+t.horses.length+'</span></div><div class="card flat">'+t.horses.map(function(id){var h=D.horse(id),n=dueN(h,t.key);
       return '<div class="lb-row">'+U.chk(false,id)+U.hav(h,'sm')+'<div class="grow"><div class="t ellip">'+E(h.name)+' <span class="mut" style="font-weight:500">· '+h.box+'</span></div><div class="s ellip">'+(t.key==='farrier'?(h.pony?'Parage':'Ferrure complète'):RULES[t.key].l)+' · '+(h.owner?'refacturé à '+D.name(h.owner):'à la charge du club')+'</div></div><span class="xs '+(n<0?'badc b':'mut')+' hide-s">'+(n<0?'en retard de '+(-n)+' j':'échéance '+F.date(due(h,t.key)))+'</span><b class="num s">'+F.eur(carePrice(h,t.key))+'</b></div>'}).join('')+'</div></div>'+
     '<div class="note">'+ICON('link','sm')+'<span>'+p.short+' ouvre cette liste sur son téléphone avec un lien invité. Les palefreniers reçoivent la tâche « préparer les chevaux » 30 minutes avant.</span></div></div>'},
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
     '<div><div class="eyebrow" style="margin-bottom:8px">4. Le message envoyé</div><div class="so-msg">Bonjour'+(!DEMO?'':p.phone?' '+p.name.replace('Dr ','docteur ').split(' ')[0].replace('docteur','docteur Leclerc'):'')+',<br>Pouvez-vous passer '+(DEMO?'à l’Écurie des Tilleuls':'au club '+E(clubName()))+' le <b>'+F.dateL(sl[slot][0])+' à '+hm(sl[slot][1])+'</b> pour '+ids.length+' cheva'+(ids.length>1?'ux':'l')+' ('+R.l.toLowerCase()+') : '+ids.map(hname).join(', ')+' ? La liste détaillée et les carnets sont dans le lien ci-dessous. Merci, '+E(DEMO?'Claire Dumont':gName())+'.</div></div></div>';
    send.disabled=!ids.length;send.querySelector('span').textContent=ids.length?(p.short?'Envoyer à '+p.short:'Enregistrer la tournée'):'Choisissez au moins un cheval'}
  init();draw();
  on(sh,'[data-k]',function(b){k=b.getAttribute('data-k');pre=null;slot=0;init();draw()});
  on(sh,'[data-slot]',function(b){slot=+b.getAttribute('data-slot');draw()});
  on(sh,'[data-pick]',function(b){var id=b.getAttribute('data-pick');picked[id]=!picked[id];draw()});
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
  send.onclick=function(){var R=RULES[k],ids=Object.keys(picked).filter(function(i){return picked[i]}),p=R.who==='eq'?null:prat(R.who),sl=slots(p)[slot];
    var t={id:'t'+Date.now(),pr:p?p.id:'p1',kind:R.k,key:k,date:sl[0],time:sl[1],horses:ids,status:p&&(DEMO||p.phone)?'demande envoyée':DEMO?'confirmé':'en attente',note:DEMO?'Demande envoyée aujourd’hui à 9 h 41.':'Tournée créée le '+F.date(iso(0))+'.'};D.tours.push(t);SO.sel={};SO.tab='tours';
    sh.close();P.rerender();P.toast('Demande envoyée'+(p?' à '+p.short:' à l’équipe')+' pour '+ids.length+' chevaux, le '+F.date(sl[0]),{icon:'send',undo:function(){D.tours.splice(D.tours.indexOf(t),1);P.rerender()}})};
  return sh}

function ruleSheet(k){var R=RULES[k],wk=k==='farrier',v=wk?Math.round(R.every/7):Math.round(R.every/30.4),unit=wk?'sem.':'mois';
  var extra={vacc:['Bloquer l’engagement en concours','Si le vaccin grippe n’est plus valable le jour de l’épreuve'],worm:['Coproscopie avant chaque vermifuge','Pas de traitement sous 200 œufs par gramme'],farrier:['Tenir compte du type de ferrure','Parage des poneys toutes les 8 semaines'],dentist:['Contrôle deux fois par an après 18 ans','Chevaux âgés'],osteo:['Proposer un bilan après un arrêt','Dès 10 jours de repos prescrit']}[k];
  var sh=P.sheet({title:'Rappel · '+R.l,icon:R.icon,body:'<div class="stack" style="--g:16px"><p class="s mut">'+R.rule+'</p><div class="card flat list"><div class="li"><div class="grow"><div class="t">Fréquence</div><div class="s">Calculée depuis le dernier passage de chaque cheval</div></div><span class="lb-step" data-step="ev" data-unit="'+unit+'"><button type="button" data-d="-1" title="Diminuer">'+ICON('minus','sm')+'</button><output data-v="'+v+'">'+v+' '+unit+'</output><button type="button" data-d="1" title="Augmenter">'+ICON('plus','sm')+'</button></span></div>'+
    '<div class="li"><div class="grow"><div class="t">Prévenir à l’avance</div><div class="s">Rappel sur l’accueil et dans la tournée</div></div><span class="lb-step" data-step="so" data-unit="j"><button type="button" data-d="-1" title="Diminuer">'+ICON('minus','sm')+'</button><output data-v="'+R.soon+'">'+R.soon+' j</output><button type="button" data-d="1" title="Augmenter">'+ICON('plus','sm')+'</button></span></div>'+
    '<div class="li"><div class="grow"><div class="t">'+extra[0]+'</div><div class="s">'+extra[1]+'</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">Prévenir le propriétaire</div><div class="s">Notification, puis SMS 3 jours avant</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">Créer la tâche pour l’équipe</div><div class="s">« Préparer le cheval » le jour du passage</div></div>'+U.tog(true)+'</div></div></div>',
   foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-save>Enregistrer la règle</button>'});
  var soon=R.soon;bindSteppers(sh,1,unit,function(id,val){if(id==='ev')v=Math.max(1,val);else soon=val});
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
  sh.querySelector('[data-save]').onclick=function(){R.every=wk?v*7:Math.round(v*30.4);R.soon=soon;if(wk)R.rule='Toutes les 6 à 8 semaines, '+v+' semaines par défaut.';sh.close();P.rerender();P.toast('Règle « '+R.l+' » enregistrée. Les échéances des '+D.horses.length+' chevaux sont recalculées.',{icon:'checkc'})}}

function giveSheet(ph){var sick=D.horses.filter(function(h){return h.status!=='ok'}).concat(D.horses.filter(function(h){return h.status==='ok'}));
  var sh=P.sheet({title:'Administrer un médicament',icon:'pill',body:'<div class="stack" style="--g:14px"><div class="card flat lb-row">'+sq('pill')+'<div class="grow"><div class="t">'+ph.name+'</div><div class="s">Lot <span class="mono">'+ph.lot+'</span> · reste '+ph.qty+' '+ph.unit+'</div></div></div>'+
    '<label class="field"><span>Cheval</span><select class="in" id="so-gh">'+sick.map(function(h){return '<option value="'+h.id+'">'+E(h.name)+' · '+h.box+(h.alerts[0]?' · '+E(h.alerts[0]):'')+'</option>'}).join('')+'</select></label>'+
    '<div class="g2" style="--g:12px"><label class="field"><span>Dose</span><input class="in" id="so-gd" value="1 '+ph.unit.replace(/s$/,'')+'"></label><label class="field"><span>Administré par</span><select class="in" id="so-gb">'+(DEMO?'<option>Claire Dumont</option><option>Antoine Leroy</option><option>Lucie Petit</option>':[gName()].concat(D.staff.map(function(s){return ((s.first||'')+' '+(s.last||'')).trim()})).filter(function(n,i,a){return n&&a.indexOf(n)===i}).map(function(n){return '<option>'+E(n)+'</option>'}).join(''))+'</select></label></div>'+
    (ph.rx&&DEMO?'<label class="field"><span>Ordonnance</span><select class="in"><option>ORD-2026-0411 · Dr Leclerc, '+F.date(iso(-2))+'</option><option>ORD-2026-0418 · Dr Leclerc, aujourd’hui</option><option>Photographier une nouvelle ordonnance</option></select></label>':'')+
    '<div class="note '+(ph.wait==='Aucun'?'':'warn')+'">'+ICON('info','sm')+'<span>Délai d’attente : <b>'+ph.wait+'</b>. L’écriture est datée, signée et ne peut plus être modifiée.</span></div></div>',
   foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-save>'+ICON('check','sm')+'Inscrire au registre</button>'});
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
  sh.querySelector('[data-save]').onclick=function(){var id=sh.querySelector('#so-gh').value;ph.qty=Math.max(0,ph.qty-1);var nw=D.day(0);nw=DEMO?'09:41':String(new Date().getHours()).padStart(2,'0')+':'+String(new Date().getMinutes()).padStart(2,'0');D.register.unshift({id:'r'+Date.now(),date:iso(0),time:nw,horse:id,prod:ph.name,lot:ph.lot,dose:sh.querySelector('#so-gd').value,by:sh.querySelector('#so-gb').value,rx:DEMO?'ORD-2026-0411':'',wait:ph.wait,why:''});
    sh.close();P.rerender();P.toast(ph.name+' inscrit au registre pour '+hname(id)+'. Stock : '+ph.qty+' '+ph.unit+'.',{icon:'checkc'})}}

function careEvSheet(c){var h=D.horse(c.horse),sh=P.sheet({title:c.kind+' · '+h.name,icon:KINDI[c.kind]||'care',body:'<div class="stack" style="--g:14px"><div class="card flat lb-row click" data-open>'+U.hav(h)+'<div class="grow"><div class="t">'+E(h.name)+'</div><div class="s">'+h.box+' · '+(h.alerts[0]?E(h.alerts[0]):h.breed)+'</div></div>'+ICON('right','sm')+'</div>'+
   '<dl class="lb-dl" style="margin:0"><div><dt>Quand</dt><dd>'+F.rel(c.date)+', '+hm(c.time)+'</dd></div><div><dt>Avec</dt><dd>'+E(c.who)+'</dd></div><div><dt>État</dt><dd>'+U.status(c.status)+'</dd></div><div><dt>Propriétaire</dt><dd>'+ownerLine(h)+'</dd></div></dl><div class="note">'+ICON('info','sm')+'<span>'+E(c.note)+'.</span></div></div>',
   foot:'<button class="btn" data-open>Ouvrir la fiche</button><button class="btn pri" data-done>'+ICON('check','sm')+'Marquer comme fait</button>'});
  on(sh,'[data-open]',function(){P.go('cheval',{id:h.id,tab:'sante'})});
  sh.querySelector('[data-done]').onclick=function(){c.status='fait';sh.close();P.rerender();P.toast(c.kind+' de '+h.name+' noté comme fait et inscrit au registre',{icon:'checkc',undo:function(){c.status='planifié';P.rerender()}})}}

/* club réel : export du registre (soins faits) en CSV, ajout d'un praticien et d'un médicament */
/* ---------- Fichiers réels : cheptel (CSV), carnet de santé, fiche, registre, tableau d'écurie (PDF) ---------- */
function fslug(t){return String(t||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')||'fichier'}
var KINDL={club:'Cheval de club',proprietaire:'Pension propriétaire',demi:'Demi-pension'};
function stTxt(h){return h.status==='bad'?'Urgent':h.status==='warn'?'À surveiller':'En forme'}
function herdCsv(list){var rows=[['Box','Nom','Type','Race','Sexe','Âge','Robe','SIRE','Propriétaire','Paddock','État','Travail (h par semaine)','Foin (kg par jour)','Grain (kg par jour)','Complément','Coût par mois (€)']];
  list.forEach(function(h){var r=h.ration||{};rows.push([h.box||'',h.name,KINDL[h.kind]||h.kind||'',h.breed||'',h.sex||'',h.age||'',h.coat||'',h.sire||'',ownerLine(h),h.paddock||'',stTxt(h),h.work||'',r.hay!=null?kg(r.hay):'',r.grain!=null?kg(r.grain):'',r.supp&&r.supp!=='Aucun'?r.supp:'',h.costMonth||''])});
  P.download('cheptel-'+fslug(clubName())+'-'+iso(0)+'.csv',rows,null,{msg:'Cheptel exporté : '+list.length+' fiches, prêt pour Excel'})}
function idKv(h){var x=X(h);return [['Nom',h.name],['Race',h.breed||'Non renseignée'],['Sexe et âge',[h.sex,h.age?h.age+' ans':''].filter(Boolean).join(', ')||'Non renseigné'],['Robe',h.coat||'Non renseignée'],['SIRE',h.sire||'Non renseigné'],['Transpondeur',h.chip||'Non renseigné'],['Box',h.box||'Sans box'],['Propriétaire',ownerLine(h)],['Arrivée au club',x.arrival?F.dateY(x.arrival):'Non renseignée']]}
function careRows(h){return D.care.filter(function(c){return c.horse===h.id}).sort(function(a,b){return a.date<b.date?1:-1}).map(function(c){return [F.date(c.date),c.kind||'',c.who||'',c.note||'',c.status||'']})}
function regRows(list){return list.slice().sort(function(a,b){return (a.date+a.time)<(b.date+b.time)?1:-1}).map(function(r){return [F.date(r.date)+(r.time?', '+r.time:''),hname(r.horse),r.prod||'',r.dose||'',r.lot||'',r.rx||'',r.by||'',r.wait||'']})}
var REGC=['Date','Cheval','Médicament','Dose','Lot','Ordonnance','Par','Délai d’attente'],REGW=[1.3,1.2,1.8,1.6,1,1.2,1.1,1.1];
function healthPdf(h){var cr=careRows(h),rg=D.register.filter(function(r){return r.horse===h.id}),due=RK.map(function(k){var R=RULES[k],last=h[k];return [R.l,last?'Fait le '+F.dateY(last)+', prochain avant le '+F.dateY(addDays(last,R.every)):'Jamais enregistré']});
  P.download('carnet-de-sante-'+fslug(h.name)+'.pdf',{title:'Carnet de santé de '+h.name,sub:clubName()+' · édité le '+F.dateY(iso(0)),blocks:[{h:'Identité'},{kv:idKv(h)},{h:'Échéances'},{kv:due},{h:'Soins'},cr.length?{table:{cols:['Date','Soin','Intervenant','Compte rendu','État'],rows:cr,w:[1.1,1.1,1.4,3,1]}}:{p:'Aucun soin enregistré.'},{h:'Traitements'},rg.length?{table:{cols:REGC,rows:regRows(rg),w:REGW}}:{p:'Aucun traitement inscrit au registre.'}]},null,{msg:'Carnet de santé de '+h.name+' téléchargé en PDF'})}
function fichePdf(h){var r=h.ration||{},up=D.care.filter(function(c){return c.horse===h.id&&c.status!=='fait'&&c.date>=iso(0)}).sort(function(a,b){return a.date<b.date?-1:1});
  P.download('fiche-'+fslug(h.name)+'.pdf',{title:h.name,sub:'Fiche complète · '+clubName()+' · '+F.dateY(iso(0)),blocks:[{h:'Identité'},{kv:idKv(h)},{h:'Au quotidien'},{kv:[['État',stTxt(h)+(h.alerts&&h.alerts[0]?' : '+h.alerts[0]:'')],['Paddock',h.paddock||'Non renseigné'],['Travail',(h.work||0)+' h par semaine, '+(h.workMax||0)+' h au plus'],['Ration',(r.hay!=null?kg(r.hay)+' kg de foin':'')+(r.grain!=null?', '+kg(r.grain)+' kg de '+grainType(h).toLowerCase():'')+' par jour'],['Complément',r.supp&&r.supp!=='Aucun'?r.supp:'Aucun'],['Consignes',CONS[h.id]||'Aucune']]},{h:'Soins à venir'},up.length?{table:{cols:['Date','Soin','Intervenant','Note'],rows:up.map(function(c){return [F.date(c.date)+(c.time?', '+c.time:''),c.kind||'',c.who||'',c.note||'']}),w:[1.2,1.1,1.4,3]}}:{p:'Aucun soin planifié.'}]},null,{msg:'Fiche de '+h.name+' prête à imprimer (PDF)'})}
function boxPdf(h){var r=h.ration||{},md=MEDS[h.id],sp=r.supp&&r.supp!=='Aucun'&&SUPP[r.supp];
  P.download('fiche-de-box-'+fslug(h.box||h.name)+'.pdf',{title:'Box '+(h.box||'')+' · '+h.name,sub:clubName()+' · à coller sur la porte',blocks:[{kv:[['Cheval',h.name+(h.breed?', '+h.breed:'')],['Propriétaire',ownerLine(h)],['Foin',r.hay!=null?kg(r.hay)+' kg par jour, en 3 repas':'Non renseigné'],['Grain',r.grain!=null?kg(r.grain)+' kg par jour, matin et soir':'Non renseigné'],['Complément',sp?r.supp+' ('+sp.dose+', le '+sp.when+')':'Aucun'],['Consignes',CONS[h.id]||'Aucune'],['Traitement',md?[md.matin,md.midi,md.soir].filter(Boolean).join(' · '):'Aucun']]},{p:'Scannez le code de la porte avec un téléphone pour voir la version à jour : ration, soins du jour et contacts d’urgence.'}]},null,{msg:'Fiche de box de '+h.name+' prête à imprimer (PDF)'})}
function docPdf(h,d){P.download(fslug(d[0])+'-'+fslug(h.name)+'.pdf',{title:d[0],sub:h.name+' · '+clubName(),blocks:[{kv:[['Cheval',h.name],['SIRE',h.sire||'Non renseigné'],['Classé dans',d[3]],['Ajouté par',DEMO?'Claire Dumont':gName()],['Le',F.dateY(X(h).arrival||iso(0))]]},{p:'Copie du document conservé dans le dossier du cheval sur Stabl.'}]},null,{msg:'« '+d[0]+' » téléchargé en PDF'})}
function demoMoves(h){var x=X(h);return [[iso(-4),'Retour du concours de Chantilly','Camion 6 places, 88 km'],[iso(-4),'Sortie : concours CSO Amateur, Chantilly','Départ 6 h 30'],['2026-07-06','Retour de stage, Lamotte-Beuvron','162 km'],['2026-07-03','Sortie : stage d’été','Van 2 places'],[x.arrival,'Entrée au club','Lieu de détention déclaré au SIRE']].slice(h.kind==='club'?2:0)}
function movesOf(h){if(!DEMO)return (Array.isArray(h.moves)?h.moves:[]).map(function(m){return [m.date,m.label||'',m.note||'']});return demoMoves(h)}
function breedPdf(h){var mv=movesOf(h),rg=D.register.filter(function(r){return r.horse===h.id});
  P.download('registre-elevage-'+fslug(h.name)+'-'+iso(0)+'.pdf',{title:'Registre d’élevage · '+h.name,sub:clubName()+' · extrait horodaté du '+F.dateY(iso(0)),blocks:[{h:'Identité'},{kv:idKv(h)},{h:'Mouvements'},mv.length?{table:{cols:['Date','Mouvement','Détail'],rows:mv.map(function(m){return [m[0]?F.dateY(m[0]):'',m[1],m[2]]}),w:[1.2,2.6,2]}}:{p:'Aucun mouvement enregistré.'},{h:'Traitements'},rg.length?{table:{cols:REGC,rows:regRows(rg),w:REGW}}:{p:'Aucun traitement inscrit au registre.'}]},null,{msg:'Registre d’élevage de '+h.name+' téléchargé (PDF horodaté)'})}
function registerPdf(all){var lim=all?'':iso(-92),rows=D.register.filter(function(r){return !lim||r.date>=lim});
  P.download('registre-sanitaire-'+(all?'complet':'trimestre')+'-'+iso(0)+'.pdf',{title:'Registre sanitaire'+(all?'':' du trimestre'),sub:clubName()+' · extrait horodaté du '+F.dateY(iso(0)),blocks:[{p:rows.length+' administration'+(rows.length>1?'s':'')+' de médicaments, avec lot, ordonnance et délai d’attente.'},rows.length?{table:{cols:REGC,rows:regRows(rows),w:REGW}}:{p:'Aucune écriture sur la période.'}]},null,{msg:'Registre sanitaire téléchargé en PDF horodaté'})}
function rationPdf(fmt){var list=D.horses.slice().sort(function(a,b){return a.box<b.box?-1:1}),lab=fmt==='box';function q(v){return v?kg(v):''}
  var blocks=lab?[].concat.apply([],list.map(function(h){var m=meals(h);return [{h:'Box '+(h.box||'')+' · '+h.name},{kv:[['Matin, 7 h',q(m.matin.hay)+' kg de foin'+(m.matin.grain?', '+q(m.matin.grain)+' kg de grain':'')],['Midi, 12 h',m.midi.hay?q(m.midi.hay)+' kg de foin':'Rien'],['Soir, 18 h',q(m.soir.hay)+' kg de foin'+(m.soir.grain?', '+q(m.soir.grain)+' kg de grain':'')],['Consignes',CONS[h.id]||'Aucune']]}]})):
    [{p:'Quantités en kilos. Matin à 7 h, midi à 12 h, soir à 18 h.'},{table:{cols:['Box','Cheval','Matin foin','Matin grain','Midi foin','Midi grain','Soir foin','Soir grain','Compléments et consignes'],rows:list.map(function(h){var m=meals(h),md=MEDS[h.id],r=h.ration||{},sp=r.supp&&r.supp!=='Aucun'&&SUPP[r.supp]?r.supp+' ('+SUPP[r.supp].when+')':'';
      return [h.box||'',h.name,q(m.matin.hay),q(m.matin.grain),q(m.midi.hay),q(m.midi.grain),q(m.soir.hay),q(m.soir.grain),[md?(md.matin||md.midi):'',sp,CONS[h.id]||''].filter(Boolean).join(' · ')]}),w:[.8,2,.9,.9,.9,.9,.9,.9,3],num:[2,3,4,5,6,7]}}];
  P.download((lab?'etiquettes-de-box-':'tableau-ecurie-')+iso(0)+'.pdf',{title:lab?'Étiquettes de box':'Distribution des rations',sub:clubName()+' · semaine du '+F.dateY(D.iso(monday())),blocks:blocks},null,{msg:(lab?'Étiquettes de box':'Tableau d’écurie')+' prêt à imprimer (PDF)'})}
function careCsv(){var rows=[['Date','Cheval','Soin','Intervenant','Compte rendu','Coût']].concat(D.care.filter(function(c){return c.status==='fait'}).sort(function(a,b){return a.date<b.date?-1:1}).map(function(c){return [c.date,hname(c.horse),c.kind,c.who||'',c.note||'',String(c.price||0).replace('.',',')]}))
    .concat(D.register.map(function(x){return [x.date,hname(x.horse),x.prod,x.by||'',x.dose||'','']}));
  P.download('registre-sanitaire-'+iso(0)+'.csv',rows,null,{msg:'Registre sanitaire téléchargé, '+(rows.length-1)+' écriture'+(rows.length>2?'s':'')})}
function pratSheet(){var jobs=[['Vétérinaire','Vétérinaire',['Vétérinaire','Vaccin']],['Maréchal-ferrant','Maréchal',['Maréchal']],['Dentiste équin','Dentiste',['Dentiste']],['Ostéopathe équin','Ostéopathe',['Ostéopathe']]];
  var sh=P.sheet({title:'Ajouter un praticien',icon:'care',body:'<div class="stack" style="--g:12px"><label class="field"><span>Nom</span><input class="in" id="so-pn" placeholder="Dr Camille Martin"></label><label class="field"><span>Métier</span><select class="in" id="so-pj">'+jobs.map(function(j,i){return '<option value="'+i+'">'+j[0]+'</option>'}).join('')+'</select></label><label class="field"><span>Téléphone</span><input class="in" id="so-pp" inputmode="tel"></label></div>',
    foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-save>'+ICON('check','sm')+'Ajouter</button>'});
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
  sh.querySelector('[data-save]').onclick=function(){var n=sh.querySelector('#so-pn').value.trim();if(!n){sh.querySelector('#so-pn').focus();return}var j=jobs[+sh.querySelector('#so-pj').value];
    D.practitioners.push({id:'pr_'+Date.now().toString(36),name:n,short:n,job:j[0],kinds:j[2],phone:sh.querySelector('#so-pp').value.trim(),trip:0,days:'Sur rendez-vous',key:''});sh.close();P.rerender();P.toast(n+' ajouté aux praticiens',{icon:'checkc'})}}
function medSheet(){var sh=P.sheet({title:'Ajouter un médicament',icon:'pill',body:'<div class="stack" style="--g:12px"><label class="field"><span>Médicament</span><input class="in" id="so-mn"></label><div class="g2" style="--g:12px"><label class="field"><span>Quantité</span><input class="in num" id="so-mq" inputmode="decimal" value="1"></label><label class="field"><span>Unité</span><input class="in" id="so-mu" placeholder="boîtes"></label></div><div class="g2" style="--g:12px"><label class="field"><span>Lot</span><input class="in" id="so-ml"></label><label class="field"><span>Péremption</span><input class="in" type="date" id="so-me"></label></div></div>',
    foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-save>'+ICON('check','sm')+'Ajouter</button>'});
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};
  sh.querySelector('[data-save]').onclick=function(){var n=sh.querySelector('#so-mn').value.trim();if(!n){sh.querySelector('#so-mn').focus();return}
    D.pharmacy.push({id:'ph_'+Date.now().toString(36),name:n,form:'',qty:parseFloat(sh.querySelector('#so-mq').value.replace(',','.'))||0,unit:sh.querySelector('#so-mu').value.trim()||'unités',min:1,lot:sh.querySelector('#so-ml').value.trim()||'–',exp:sh.querySelector('#so-me').value||iso(365),rx:false,wait:'Aucun',use:''});sh.close();P.rerender();P.toast(n+' ajouté à la pharmacie',{icon:'checkc'})}}

P.mod({id:'soins',role:'gerant',group:'Écurie',title:'Soins',icon:'care',n:40,
 badge:function(){var n=D.care.filter(function(c){return F.days(c.date)===0&&c.status!=='fait'}).length;return n?{v:n}:null},
 render:function(el,ctx){
  if(ctx.params.tab){SO.tab=ctx.params.tab;ctx.params.tab=null}
  var today=D.care.filter(function(c){return F.days(c.date)===0&&c.status!=='fait'}),late=[];D.horses.forEach(function(h){RK.forEach(function(k){if(dueN(h,k)<0)late.push([h,k])})});
  var d30=reminderRows(),inT=d30.filter(function(r){return r.t}).length,rb=allRebill(),rbs=rb.reduce(function(a,q){return a+q.v},0),vet=today.find(function(c){return c.kind==='Vétérinaire'});
  el.innerHTML=LPH('Soins','Calendrier sanitaire des '+D.horses.length+' chevaux · rappels, tournées, pharmacie et registre',
     '<button class="btn" data-act="regexp">'+ICON('download','sm')+'<span class="hide-s">Registre sanitaire</span><span class="only-s">Registre</span></button><button class="btn pri" data-newtour="">'+ICON('route','sm')+'Planifier une tournée</button>')+
   '<div class="stack" style="--g:18px"><div class="lb-bento rise">'+
    heroTile({dom:'soins',icon:'care',eyebrow:DEMO?'Aujourd’hui, mardi 17':'Aujourd’hui, '+F.dateL(iso(0)).replace(/ (janvier|février|mars|avril|mai|juin|juillet|août|septembre|octobre|novembre|décembre)$/,''),big:cnt(today.length),unit:today.length>1?'soins à faire':'soin à faire',
     sub:vet?E(vet.who)+' passe à '+hm(vet.time)+' pour '+E(hname(vet.horse))+'.':'Aucun rendez-vous extérieur aujourd’hui.',
     acts:'<div class="so-today">'+today.slice().sort(function(a,b){return (a.time||'')<(b.time||'')?-1:1}).slice(0,3).map(function(c){var hh=D.horse(c.horse);return '<button class="so-tr" data-go="cheval" data-id="'+c.horse+'"><span class="tm num">'+(/^\d/.test(c.time||'')?hm(c.time):'Journée')+'</span><span class="grow ellip"><b>'+E(hh?hh.name:'')+'</b> · '+E(c.kind.toLowerCase())+'</span>'+ICON('right','sm')+'</button>'}).join('')+'</div>',illu:'fer'})+
    kpi('En retard','alert','<span class="'+(late.length?'badc':'')+'">'+cnt(late.length)+'</span><small>'+(late.length>1?'rappels':'rappel')+'</small>',late.length?late.map(function(a){return a[0].name}).filter(function(n,i,a){return a.indexOf(n)===i}).slice(0,4).join(', ')+(DEMO?', déjà en tournée':''):'Aucun soin en retard','soins')+
    (function(){var by={};d30.forEach(function(r){var l=RULES[r.k].l;by[l]=(by[l]||0)+1});var ks=Object.keys(by).sort(function(a,b){return by[b]-by[a]});
     return kpi('Dans les 30 jours','bell',cnt(d30.length)+'<small>rappels</small>',inT+' déjà regroupés en tournée','soins').replace(/<\/div>$/,'<div class="lb-split">'+ks.map(function(k){var kk=Object.keys(KINDC).find(function(q){return k.indexOf(q)===0||q.indexOf(k.split(' ')[0])===0})||'Vaccin';return '<i style="--c:'+KINDC[kk]+';width:'+(by[k]/d30.length*100).toFixed(1)+'%" title="'+k+' : '+by[k]+'"></i>'}).join('')+'</div><div class="lb-lg">'+ks.map(function(k){var kk=Object.keys(KINDC).find(function(q){return k.indexOf(q)===0||q.indexOf(k.split(' ')[0])===0})||'Vaccin';return '<span><i style="--c:'+KINDC[kk]+'"></i>'+k.replace('Vaccin grippe','Vaccin')+' '+by[k]+'</span>'}).join('')+'</div></div>')})()+
    kpi('À refacturer','euro',cnt(rbs,'eur'),rb.length+' soin'+(rb.length>1?'s':'')+' de propriétaires à reporter sur leur '+(DEMO?'facture de décembre':'prochaine facture'),'argent',true).replace(/<\/div>$/,'<div class="cv-bf"><span></span><button class="btn sm" data-stgo="rebill">'+ICON('invoice','sm')+'Préparer la refacturation</button></div></div>')+'</div>'+
   '<div class="scroll-x">'+U.seg([['cal','Calendrier'],['rem','Rappels'],['tours','Tournées'],['pharma','Pharmacie et registre'],['rebill','Refacturation']],SO.tab,'data-st')+'</div><div id="so-body"></div></div>';
  var body=el.querySelector('#so-body');
  function draw(){body.innerHTML=({cal:tabCal,rem:tabRem,tours:tabTours,pharma:tabPharma,rebill:tabRebill}[SO.tab]||tabCal)();P.animate(body);swap(body)}
  draw();
  on(el,'[data-st]',function(b){SO.tab=b.getAttribute('data-st');draw()});
  on(el,'[data-stgo]',function(b){var t=el.querySelector('.seg [data-st="'+b.getAttribute('data-stgo')+'"]');if(t){t.click();t.scrollIntoView({block:'start',behavior:P.RM?'auto':'smooth'})}});
  on(el,'[data-kf]',function(b){var k=b.getAttribute('data-kf');SO.hide[k]=!SO.hide[k];draw()});
  on(el,'[data-rf]',function(b){SO.rf=b.getAttribute('data-rf');draw()});
  on(el,'[data-ev]',function(b){var e=SO._ev[+b.getAttribute('data-ev')];if(!e)return;if(e.tour)tourSheet(D.tours.find(function(t){return t.id===e.tour}));else if(e.care)careEvSheet(D.care.find(function(c){return c.id===e.care}));else newTourSheet(e.key,e.horses)});
  on(el,'[data-more]',function(b){var d=b.getAttribute('data-more'),l=SO._ev.filter(function(e){return e.date===d});var sh=P.sheet({title:F.dateL(d).replace(/^./,function(c){return c.toUpperCase()}),icon:'planning',body:'<div class="card flat">'+l.map(function(e){return '<div class="lb-row click" data-ev2="'+SO._ev.indexOf(e)+'"><span class="lb-sq sm" style="background:color-mix(in srgb,'+KINDC[e.kind]+' 14%,var(--surface));color:'+KINDC[e.kind]+'">'+ICON(KINDI[e.kind],'sm')+'</span><div class="grow t ellip">'+E(e.label)+'</div>'+(e.todo?U.chip('À planifier','line'):U.chip('Planifié','ok',true))+'</div>'}).join('')+'</div>'});
    on(sh,'[data-ev2]',function(r){var e=SO._ev[+r.getAttribute('data-ev2')];if(e.tour)tourSheet(D.tours.find(function(t){return t.id===e.tour}));else if(e.care)careEvSheet(D.care.find(function(c){return c.id===e.care}));else newTourSheet(e.key,e.horses)})});
  on(el,'[data-sel]',function(b){var id=b.getAttribute('data-sel');SO.sel[id]=!SO.sel[id];draw()});
  on(el,'[data-rule]',function(b){ruleSheet(b.getAttribute('data-rule'))});
  on(el,'[id^="so-r-"]',function(b){var k=b.id.slice(5);setTimeout(function(){var onn=b.getAttribute('aria-checked')==='true';RULES[k].off=!onn;P.toast('Rappels « '+RULES[k].l+' » '+(onn?'réactivés':'mis en pause'),{icon:onn?'bell':'pause'})},0)});
  on(el,'[data-newtour]',function(b){newTourSheet(b.getAttribute('data-newtour')||'farrier')});
  on(el,'[data-tour]',function(b){tourSheet(D.tours.find(function(t){return t.id===b.getAttribute('data-tour')}))});
  on(el,'[data-nudge]',function(b){var t=D.tours.find(function(q){return q.id===b.getAttribute('data-nudge')});P.toast('Relance envoyée à '+prat(t.pr).short+' par SMS',{icon:'send'})});
  on(el,'[data-call]',function(b){var p=prat(b.getAttribute('data-call'));P.toast('Appel de '+p.name+' au '+p.phone,{icon:'phone'})});
  on(el,'[data-give]',function(b){giveSheet(D.pharmacy.find(function(p){return p.id===b.getAttribute('data-give')}))});
  on(el,'[data-drop]',function(b){var p=D.pharmacy.find(function(q){return q.id===b.getAttribute('data-drop')}),i=D.pharmacy.indexOf(p);D.pharmacy.splice(i,1);draw();P.toast(p.name+' retiré de la pharmacie, à rapporter au vétérinaire',{icon:'trash',undo:function(){D.pharmacy.splice(i,0,p);draw()}})});
  on(el,'[data-rb]',function(b){var id=b.getAttribute('data-rb'),q=allRebill().find(function(a){return a.id===id});ST.rebill[id]=1;draw();P.toast(F.eur(q.v)+' ajoutés à la '+(DEMO?'facture de décembre':'prochaine facture')+' de '+D.name(q.h.owner),{icon:'invoice',undo:function(){delete ST.rebill[id];draw()}})});
  bindSteppers(el,1,'%');
  var ACT={
   ics:function(){icsSheet()},
   unsel:function(){SO.sel={};draw()},
   seltour:function(){var ids=Object.keys(SO.sel).filter(function(k){return SO.sel[k]}),k=ids[0].split(':')[1];newTourSheet(k,ids.filter(function(i){return i.split(':')[1]===k}).map(function(i){return i.split(':')[0]}))},
   addprat:function(){if(!DEMO){pratSheet();return}P.toast('Invitation prête : envoyez le lien invité au praticien par SMS',{icon:'link'})},
   addmed:function(){if(!DEMO){medSheet();return}P.toast('Boîte reconnue : Phénylbutazone 1 g, lot PB26-1104, péremption 06/2028. Ajoutée au stock.',{icon:'scan'})},
   regexp:function(){if(!DEMO){careCsv();return}registerPdf(false)},
   regall:function(){P.sheet({title:'Registre sanitaire',icon:'doc',wide:true,body:T([{l:'Date',f:function(r){return '<span class="num">'+F.date(r.date)+', '+hm(r.time)+'</span>'}},{l:'Cheval',f:function(r){return '<b>'+hname(r.horse)+'</b>'}},{l:'Médicament',f:function(r){return r.prod+'<div class="xs mut">'+r.dose+'</div>'}},{l:'Lot',hide:true,f:function(r){return '<span class="mono">'+r.lot+'</span>'}},{l:'Ordonnance',hide:true,f:function(r){return '<span class="mono">'+r.rx+'</span>'}},{l:'Par',hide:true,k:'by'},{l:'Délai d’attente',hide:true,k:'wait'}],D.register,{card:false})})},
   visit:function(){if(!DEMO){liveForm('care');return}P.toast('Demande de visite sanitaire envoyée au Dr Leclerc pour février 2027',{icon:'send'})},
   rball:function(){var l=allRebill(),s=l.reduce(function(a,q){return a+q.v},0);l.forEach(function(q){ST.rebill[q.id]=1});P.rerender();P.toast(l.length+' soins refacturés pour '+F.eur(s)+', sur les '+(DEMO?'factures de décembre':'prochaines factures'),{icon:'invoice',undo:function(){l.forEach(function(q){delete ST.rebill[q.id]});P.rerender()}})}};
  on(el,'[data-act]',function(b){var f=ACT[b.getAttribute('data-act')];if(f)f(b)});
 }});

/* =====================================================================
   6. Alimentation
   ===================================================================== */
var AL={tab:'plan',meal:'midi',q:'',f:'all',init:false};
var MEALS=[['matin','Matin','7 h'],['midi','Midi','12 h'],['soir','Soir','18 h']];
function kg(v){return String(Math.round(v*10)/10).replace('.',',')}
function feedTotals(){var t={hay:0,club:0,flake:0,cost:0,sup:0,ch:0,cg:0};D.horses.forEach(function(h){var f=feedDay(h);t.hay+=h.ration.hay;if(grainType(h)==='Floconnés')t.flake+=h.ration.grain;else t.club+=h.ration.grain;t.cost+=f.hay+f.grain+f.supp;t.ch+=f.hay;t.cg+=f.grain;t.sup+=f.supp});return t}
/* club réel : les stocks d'aliments saisis dans Entretien et stocks (le premier « foin » sert de référence) */
var FEEDRE=/foin|fourrage|enrubann|paille|granul|floc|aliment|orge|avoine|luzerne|huile|mash|compl/i;
function stocksL(){var l=D.stock.filter(function(s){return FEEDRE.test(s.name||'')}).sort(function(a,b){return (/foin|fourrage/i.test(b.name)?1:0)-(/foin|fourrage/i.test(a.name)?1:0)});
  return l.map(function(s){return {id:s.id,name:s.name,icon:/foin|fourrage|paille|enrubann/i.test(s.name)?'hay':/huile/i.test(s.name)?'drop':'feed',qty:+s.qty||0,unit:s.unit||'',min:+s.min||0,daily:+s.daily||0,detail:(+s.daily?kg(+s.daily)+' '+(s.unit||'')+' consommés par jour':'Consommation par jour à renseigner')+(s.supplier?' · '+s.supplier:''),supplier:s.supplier||'votre fournisseur',order:+s.order||Math.max(1,Math.ceil((+s.daily||1)*14)),price:+s.price||0,lead:+s.lead||2,real:s}})}
function stocks(){if(!DEMO)return stocksL();var t=feedTotals(),s1=D.stock.find(function(s){return s.id==='k1'}),s3=D.stock.find(function(s){return s.id==='k3'}),s6=D.stock.find(function(s){return s.id==='k6'}),oil=D.horses.filter(function(h){return h.ration.supp==='Huile de lin'}).length;
  var siloKg=Math.round(t.club*11/10)*10;
  return [
   {id:'k1',name:'Foin de prairie',icon:'hay',qty:s1.qty,unit:'balles rondes',min:s1.min,daily:s1.daily,detail:kg(t.hay)+' kg de rations ('+kg(t.hay/250)+' balle) et '+kg(Math.max(0,s1.daily-t.hay/250))+' balle dans les râteliers des prairies',supplier:s1.supplier,order:20,price:s1.price,lead:2},
   {id:'silo',name:'Granulés club',icon:'feed',qty:38,unit:'% du silo',min:25,daily:38/11,kgs:siloKg,detail:kg(t.club)+' kg par jour pour '+D.horses.filter(function(h){return grainType(h)!=='Floconnés'&&h.ration.grain>0}).length+' chevaux · capteur de niveau du silo',supplier:'Coopérative Agralys',order:3,orderU:'tonnes en vrac',price:420,lead:4,pct:true},
   {id:'k3',name:'Floconnés',icon:'bag',qty:s3.qty,unit:'sacs de 25 kg',min:s3.min,daily:Math.round(t.flake/25*100)/100,detail:kg(t.flake)+' kg par jour pour les '+D.horses.filter(function(h){return grainType(h)==='Floconnés'}).length+' chevaux en pension',supplier:s3.supplier,order:30,price:s3.price,lead:3},
   {id:'k6',name:'Huile de lin',icon:'drop',qty:s6.qty,unit:'bidons de 5 litres',min:s6.min,daily:Math.round(oil*.05/5*100)/100,detail:oil+' chevaux à 50 ml par jour',supplier:s6.supplier,order:4,price:s6.price,lead:3}]}
function daysLeft(s){return s&&s.daily>0?Math.floor(s.qty/s.daily):999}

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
    {l:'Consigne',hide:true,f:function(h){return CONS[h.id]?'<span class="al-cons">'+E(CONS[h.id])+'</span>':'<span class="mut-2">Aucune</span>'}},
    {l:'Coût par jour',n:true,f:function(h){return '<b>'+F.eur(feedDayTot(h),true)+'</b>'}}],rows,{click:true}).replace('class="tw card"','class="tw card al-pt"')+
    '<div class="al-pc rise">'+rows.map(function(h){var n=nec(h);return '<button class="card al-pr" data-row="'+h.id+'">'+portrait(h)+'<span class="grow"><b class="ellip">'+E(h.name)+'</b><span class="ellip">'+h.box+' · '+h.weight+' kg · '+necTxt(n).toLowerCase()+'</span>'+(MEDS[h.id]?'<span class="badc b">Traitement en cours</span>':CONS[h.id]?'<span class="ellip">'+E(CONS[h.id])+'</span>':'')+'</span><span class="al-pq"><b class="num">'+kg(h.ration.hay)+'<small> kg</small></b><span>foin</span><b class="num">'+kg(h.ration.grain)+'<small> kg</small></b><span>grain</span></span></button>'}).join('')+'</div>':'<div class="card">'+U.empty('feed','Aucune ration ne correspond','Essayez un autre nom ou un autre filtre.')+'</div>')+'</div>'}

function boxCard(h,meal){var m=meals(h)[meal],md=(MEDS[h.id]||{})[meal],fed=!!ST.fed[meal][h.id],none=!m.hay&&!m.grain&&!md;
  return '<button class="al-box" role="checkbox" aria-checked="'+fed+'" data-fed="'+h.id+'"><div class="hd"><span class="bx">'+h.box+'</span><b class="ellip">'+E(h.name)+'</b><span class="chk" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span></div>'+
   '<div class="qs"><div class="al-q"><small>Foin</small><b>'+(m.hay?kg(m.hay)+'<span>kg</span>':'<span style="margin:0">Rien</span>')+'</b></div><div class="al-q"><small>'+(grainType(h)==='Floconnés'?'Floconnés':'Granulés')+'</small><b>'+(m.grain?kg(m.grain)+'<span>kg</span>':'<span style="margin:0">Rien</span>')+'</b></div></div>'+
   (md?'<div class="al-fl med">'+ICON('pill','sm')+'<span>'+md+'</span></div>':'')+(m.supp?'<div class="al-fl">'+ICON('drop','sm')+'<span>'+m.supp+', '+SUPP[m.supp].dose+'</span></div>':'')+(CONS[h.id]?'<div class="al-fl">'+ICON('info','sm')+'<span>'+E(CONS[h.id])+'</span></div>':'')+'</button>'}
function alBoard(){var meal=AL.meal,list=D.horses.slice().sort(function(a,b){return a.box<b.box?-1:1}),n=list.filter(function(h){return ST.fed[meal][h.id]}).length,ml=MEALS.find(function(m){return m[0]===meal}),tot=list.reduce(function(a,h){var m=meals(h)[meal];a.h+=m.hay;a.g+=m.grain;return a},{h:0,g:0});
  return '<div class="stack" style="--g:14px"><div class="card pad stack" style="--g:12px"><div class="hrow wrap sp"><div class="hrow wrap" style="--g:10px">'+U.seg(MEALS.map(function(m){return [m[0],m[1]+' · '+m[2]]}),meal,'data-meal')+'<span class="s mut">'+(DEMO?(meal==='matin'?'Distribué à 7 h 12 par Antoine':meal==='midi'?'Prochaine distribution, Lucie':'Ce soir, Antoine'):'')+'</span></div>'+
     '<div class="hrow wrap" style="--g:6px"><button class="btn sm" data-act="allfed">'+ICON('check','sm')+(n===list.length?'Tout décocher':'Tout cocher')+'</button><button class="btn sm" data-act="kiosk">'+ICON('expand','sm')+'<span class="hide-s">Écran de la sellerie</span></button><button class="btn sm dark" data-act="print">'+ICON('doc','sm')+'Imprimer</button></div></div>'+
    '<div class="hrow" style="--g:12px"><div class="grow">'+U.bar(n/list.length*100,n===list.length?'var(--ok)':'var(--acc)')+'</div><b class="s num" style="white-space:nowrap">'+n+' sur '+list.length+' boxes servis</b>'+(n===list.length?'<span class="strass" title="Distribution terminée"></span>':'')+'</div>'+
    '<div class="xs mut">À préparer pour ce repas : <b style="color:var(--ink)">'+kg(tot.h)+' kg de foin</b> (environ '+Math.ceil(tot.h/12)+' brouettes) et <b style="color:var(--ink)">'+kg(tot.g)+' kg de granulés</b>. Touchez un box quand il est servi.</div></div>'+
   '<div class="al-board">'+list.map(function(h){return boxCard(h,meal)}).join('')+'</div></div>'}

function stockChart(s,ordered){var v=[],lab=[],q=s.qty,minv=[];for(var d=0;d<=30;d+=2){var val=Math.max(0,s.qty-s.daily*d+(ordered&&d>=s.lead?(s.pct?45:s.order):0));v.push(Math.round(val*10)/10);minv.push(s.min);lab.push(d===0?'Auj.':d%6===0?F.date(iso(d)):'')}
  return C.line([{v:v,c:'var(--acc)',area:true},{v:minv,c:'var(--warn)',dash:true}],lab,{h:190,min:0,max:Math.max.apply(null,v)*1.15,fmt:function(x){return Math.round(x)}})}
function alStock(){var S=stocks(),t=feedTotals(),hay=S[0];
  if(!DEMO&&!S.length)return '<div class="card rise">'+U.empty('hay','Aucun stock d’aliment suivi','Ajoutez votre foin, vos granulés et vos compléments avec leur seuil d’alerte : Stabl calcule l’autonomie et vous prévient avant la rupture.','<button class="btn pri sm" data-act="addstock">'+ICON('plus','sm')+'Ajouter un stock</button>')+'</div>';
  var top=D.horses.slice().sort(function(a,b){return feedDayTot(b)-feedDayTot(a)}).slice(0,5),m=30.4;
  return '<div class="stack rise" style="--g:14px"><div class="g4">'+S.map(function(s){var dl=daysLeft(s),under=s.qty<s.min,soon=Math.max(0,Math.floor((s.qty-s.min)/s.daily)),ord=ST.orders[s.id],st=under?'bad':soon<=7?'warn':'ok';
    return '<div class="card al-stock"><div class="hrow sp"><span class="hrow" style="--g:8px">'+sq(s.icon,st==='ok'?'':st,'sm')+'<b>'+s.name+'</b></span>'+(ord?U.chip('Commandé','acc',true):st==='ok'?U.chip('Suffisant','ok',true):st==='warn'?U.chip('À commander','warn',true):U.chip('Sous le seuil','bad',true))+'</div>'+
     '<div><div class="big">'+kg(s.qty)+'<small>'+s.unit+'</small></div><div class="s mut" style="margin-top:4px">Environ <b style="color:var(--ink)">'+dl+' jours</b>, jusqu’au '+F.date(iso(dl))+'</div></div>'+
     '<div class="lb-thr"><div class="bar" style="height:8px"><i style="--v:'+Math.min(100,s.qty/(s.pct?100:s.min*2.4)*100)+'%;--c:'+tone(st).replace('var(--ok)','var(--acc)')+'"></i></div><u style="left:'+(s.pct?s.min:100/2.4)+'%" title="Seuil d’alerte"></u></div>'+
     '<div class="xs mut" style="min-height:48px">'+s.detail+'.</div>'+
     (ord?'<div class="xs b acc">Livraison prévue le '+F.date(iso(s.lead))+', '+s.supplier+'</div>':'<button class="btn sm '+(st!=='ok'?'pri':'')+'" data-order="'+s.id+'">Commander '+s.order+' '+(s.orderU||s.unit.split(' ')[0])+'</button>')+'</div>'}).join('')+'</div>'+
   '<div class="fc-cols"><div class="card"><div class="ch"><div><h3>Prévision du stock '+(DEMO||/foin|fourrage/i.test(hay.name)?'de foin':'de '+E(hay.name.toLowerCase()))+'</h3><div class="xs mut">30 prochains jours, à '+kg(hay.daily)+' '+(DEMO?'balles':E(hay.unit))+' par jour · seuil d’alerte à '+hay.min+' '+(DEMO?'balles':E(hay.unit))+'</div></div>'+C.legend([['Stock prévu','var(--acc)'],['Seuil','var(--warn)']])+'</div><div class="cb">'+stockChart(hay,DEMO?ST.orders.k1:ST.orders[hay.id])+
      '<div class="note '+((DEMO?ST.orders.k1:ST.orders[hay.id])?'ok':'warn')+'" style="margin-top:12px">'+ICON((DEMO?ST.orders.k1:ST.orders[hay.id])?'checkc':'alert','sm')+'<span>'+(!DEMO?(ST.orders[hay.id]?'Commande notée : pensez à la confirmer auprès de '+E(hay.supplier)+'.':!hay.daily?'Indiquez la consommation par jour pour prévoir la date de rupture.':hay.qty<=hay.min?'Le stock est déjà sous le seuil d’alerte : commandez dès que possible.':'Le stock passe sous le seuil le <b>'+F.dateL(iso(Math.floor((hay.qty-hay.min)/hay.daily)))+'</b>. Commandez quelques jours avant auprès de '+E(hay.supplier)+'.'):ST.orders.k1?'Commande de 20 balles en route : le stock repasse au-dessus du seuil jeudi.':'Le stock passe sous le seuil le <b>'+F.dateL(iso(Math.floor((hay.qty-hay.min)/hay.daily)))+'</b>. Fourrages du Hurepoix livre en 2 jours : commandez avant vendredi.')+'</span></div></div></div>'+
    '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><div><h3>Coût des rations</h3><div class="xs mut">Par mois, pour '+D.horses.length+' chevaux</div></div></div><div class="cb hrow wrap" style="--g:16px">'+C.donut([{v:t.ch,c:'var(--acc)'},{v:t.cg,c:'var(--c2)'},{v:t.sup,c:'var(--c3)'}],{size:128,center:F.num(t.cost*m/1000,1)+' k€',w:14})+
      '<div class="stack grow" style="--g:8px;min-width:140px">'+[['Foin',t.ch,'var(--acc)'],['Granulés',t.cg,'var(--c2)'],['Compléments',t.sup,'var(--c3)']].map(function(a){return '<div class="hrow sp s"><span class="hrow" style="--g:8px"><i style="width:8px;height:8px;border-radius:2px;background:'+a[2]+'"></i>'+a[0]+'</span><b class="num">'+F.eur(Math.round(a[1]*m))+'</b></div>'}).join('')+'</div></div></div>'+
     '<div class="card"><div class="ch"><h3>Rations les plus coûteuses</h3></div><div style="padding:6px 0 4px">'+top.map(function(h){return '<div class="lb-row click" data-ration="'+h.id+'">'+U.hav(h,'sm')+'<div class="grow"><div class="t ellip">'+E(h.name)+'</div><div class="s ellip">'+kg(h.ration.hay)+' kg de foin, '+kg(h.ration.grain)+' kg de '+grainType(h).toLowerCase()+'</div></div><b class="num s">'+F.eur(feedDayTot(h),true)+'</b></div>'}).join('')+'</div></div></div></div></div>'}

function printSheet(){var list=D.horses.slice().sort(function(a,b){return a.box<b.box?-1:1});
  function cell(m,md){return '<td class="c">'+(m.hay?kg(m.hay):'')+'</td><td class="c">'+(m.grain?kg(m.grain):'')+'</td>'}
  var sh=P.sheet({title:'Tableau d’écurie à imprimer',icon:'doc',wide:true,body:'<div class="stack" style="--g:14px"><div class="hrow wrap sp"><div class="scroll-x">'+U.seg([['a4','A4 paysage'],['a3','A3, à afficher'],['box','Étiquettes de box']],'a4','data-fmt')+'</div><span class="xs mut">'+(DEMO?'2 pages · mis à jour à 9 h 41':Math.max(1,Math.ceil(D.horses.length/25))+' page'+(D.horses.length>25?'s':''))+'</span></div>'+
    '<div class="al-paper"><div class="hrow sp" style="margin-bottom:12px"><div><b class="disp" style="font-size:18px">Distribution des rations</b><div class="xs mut">'+E(clubName())+' · semaine du '+(DEMO?'16 novembre 2026':F.dateL(D.iso(monday())).replace(/^\w+ /,'')+' '+monday().getFullYear())+'</div></div>'+LOGO(22,'var(--ink)','var(--acc)')+'</div>'+
    '<div class="tw" style="border-radius:0"><table><thead><tr><th rowspan="2">Box</th><th rowspan="2">Cheval</th><th colspan="2">Matin, 7 h</th><th colspan="2">Midi, 12 h</th><th colspan="2">Soir, 18 h</th><th rowspan="2">Compléments et consignes</th></tr><tr><th>Foin</th><th>Gran.</th><th>Foin</th><th>Gran.</th><th>Foin</th><th>Gran.</th></tr></thead><tbody>'+
     list.map(function(h){var m=meals(h),md=MEDS[h.id],sp=h.ration.supp!=='Aucun'?h.ration.supp+' ('+SUPP[h.ration.supp].when+')':'';return '<tr><td class="bx">'+h.box+'</td><td><b>'+E(h.name)+'</b></td>'+cell(m.matin)+cell(m.midi)+cell(m.soir)+'<td>'+[md?'<b class="badc">'+(md.matin||md.midi)+'</b>':'',sp,CONS[h.id]?E(CONS[h.id]):''].filter(Boolean).join(' · ')+'</td></tr>'}).join('')+'</tbody></table></div>'+
    '<div class="xs mut" style="margin-top:10px">Quantités en kilos. Un code à scanner en bas de page ouvre la version à jour sur le téléphone.</div></div></div>',
   foot:'<button class="btn ghost" data-pdf>'+ICON('download','sm')+'Télécharger le PDF</button><button class="btn pri" data-pr>'+ICON('doc','sm')+'Imprimer le tableau</button>'});
  function fmt(){var b=sh.querySelector('[data-fmt][aria-selected="true"]');return b?b.getAttribute('data-fmt'):'a4'}
  sh.querySelector('[data-pdf]').onclick=function(){rationPdf(fmt())};
  sh.querySelector('[data-pr]').onclick=function(){var f=fmt();sh.close();rationPdf(f)};
  return sh}

P.mod({id:'alimentation',role:'gerant',group:'Écurie',title:'Alimentation',icon:'feed',n:50,
 render:function(el,ctx){
  if(!AL.init){AL.init=true;if(DEMO)D.horses.forEach(function(h){ST.fed.matin[h.id]=1})}
  if(ctx.params.tab){AL.tab=ctx.params.tab;ctx.params.tab=null}
  D.horses.forEach(X);
  var body;
  function head(){var t=feedTotals(),S=stocks(),hay=S[0],dl=daysLeft(hay),lim=hay?Math.floor((hay.qty-hay.min)/(hay.daily||1)):0;
    if(!DEMO){var n=D.horses.length||1,ok=hay&&hay.daily>0,ord=hay&&ST.orders[hay.id];
      return '<div class="lb-bento al-bento rise">'+
      heroTile({dom:'chevaux',icon:'feed',eyebrow:'Rations du jour',big:t.hay%1?kg(t.hay):cnt(t.hay),unit:'kg de foin',sub:'et '+kg(t.club+t.flake)+' kg de granulés pour '+D.horses.length+' ration'+(D.horses.length>1?'s':'')+', soit environ '+F.eur(t.cost/n,true)+' par cheval et par jour.',
       stats:MEALS.map(function(m){var k=D.horses.filter(function(h){return ST.fed[m[0]][h.id]}).length;return [k+'<small>/'+D.horses.length+'</small>',m[1]+'<br>'+(k===D.horses.length&&k?'servi':k?'en cours':'à '+m[2])]}),illu:'foin'})+
      (hay?kpi('Autonomie en '+(/foin|fourrage/i.test(hay.name)?'foin':E(hay.name.toLowerCase())),'stock','<span class="'+(ok&&dl<=20&&!ord?'warnc':'')+'">'+(ok?dl:'–')+'</span><small>jours</small>',ord?'<b class="acc">Commande notée</b>':ok?(lim-hay.lead>0?'Commander avant le '+F.date(iso(Math.max(0,lim-hay.lead))):'<b class="warnc">À commander maintenant</b>')+', '+kg(hay.daily)+' '+E(hay.unit)+' par jour':'Consommation par jour à renseigner','argent',ok&&dl<=20&&!ord)
        :kpi('Autonomie en foin','stock','–<small>jours</small>','<button class="btn sm" data-act="addstock">'+ICON('plus','sm')+'Ajouter le stock de foin</button>','argent'))+
      kpi('Granulés par jour','feed',kg(t.club+t.flake)+'<small>kg</small>',kg(t.club)+' kg de granulés et '+kg(t.flake)+' kg de floconnés','chevaux')+
      kpi('Coût estimé','euro',F.eur(Math.round(t.cost*30.4))+'<small>par mois</small>','Au prix de référence : foin '+F.eur(Math.round(t.ch*30.4))+', grain '+F.eur(Math.round(t.cg*30.4))+', compléments '+F.eur(Math.round(t.sup*30.4)),'argent')+'</div>'}
    var served=MEALS.map(function(m){return [D.horses.filter(function(h){return ST.fed[m[0]][h.id]}).length,m[1]+' servi'+(m[0]==='midi'?'':'')]});
    return '<div class="lb-bento al-bento rise">'+
    heroTile({dom:'chevaux',icon:'feed',eyebrow:'Rations du jour',big:t.hay%1?kg(t.hay):cnt(t.hay),unit:'kg de foin',sub:'et '+kg(t.club+t.flake)+' kg de granulés pour '+D.horses.length+' rations, soit '+F.eur(t.cost/D.horses.length,true)+' par cheval et par jour.',
     stats:MEALS.map(function(m){var n=D.horses.filter(function(h){return ST.fed[m[0]][h.id]}).length;return [n+'<small>/'+D.horses.length+'</small>',m[1]+'<br>'+(n===D.horses.length?'servi':n?'en cours':'à '+m[2])]}),illu:'foin'})+
    kpi('Autonomie en foin','stock','<span class="'+(dl<=20&&!ST.orders.k1?'warnc':'')+'">'+dl+'</span><small>jours</small>',ST.orders.k1?'<b class="acc">20 balles commandées</b>, livrées jeudi':'<b class="warnc">Commander avant le '+F.date(iso(Math.max(0,lim-hay.lead)))+'</b>, '+kg(hay.daily)+' balles par jour','argent',dl<=20&&!ST.orders.k1).replace(/<\/div>$/,'<div class="al-gauge"><i style="width:'+Math.min(100,dl/45*100).toFixed(1)+'%"></i><u style="left:'+(Math.max(0,lim-hay.lead+0)/45*100).toFixed(1)+'%" title="Seuil de commande"></u></div><div class="lb-lg"><span>Aujourd’hui</span><span style="margin-left:auto">45 jours</span></div></div>')+
    kpi('Granulés par jour','feed',kg(t.club+t.flake)+'<small>kg</small>',kg(t.club)+' kg du silo et '+kg(t.flake)+' kg de floconnés','chevaux').replace(/<\/div>$/,'<div class="lb-split"><i style="--c:var(--hz);width:'+(t.club/(t.club+t.flake)*100).toFixed(1)+'%"></i><i style="--c:var(--hay-2);width:'+(t.flake/(t.club+t.flake)*100).toFixed(1)+'%"></i></div><div class="lb-lg"><span><i style="--c:var(--hz)"></i>Granulés club</span><span><i style="--c:var(--hay-2)"></i>Floconnés</span></div></div>')+
    kpi('Coût de l’alimentation','euro',F.eur(Math.round(t.cost*30.4))+'<small>par mois</small>','Ration moyenne à '+F.eur(t.cost/D.horses.length,true)+' par jour : foin '+F.eur(Math.round(t.ch*30.4))+', grain '+F.eur(Math.round(t.cg*30.4))+', compléments '+F.eur(Math.round(t.sup*30.4)),'argent')+'</div>'}
  el.innerHTML=LPH('Alimentation',D.horses.length+' rations individuelles · distribution matin, midi et soir, reliée aux stocks',
     '<button class="btn" data-act="label">'+ICON('image','sm')+'<span class="hide-s">Photographier une étiquette</span><span class="only-s">Étiquette</span></button><button class="btn" data-act="print">'+ICON('doc','sm')+'<span class="hide-s">Imprimer le tableau d’écurie</span><span class="only-s">Imprimer</span></button><button class="btn pri" data-act="assist">'+ICON('checkc','sm')+'Vérifier les rations</button>')+
   '<div class="stack" style="--g:14px"><div id="al-head">'+head()+'</div><div class="scroll-x">'+U.seg([['plan','Plan de rationnement'],['board','Tableau de distribution'],['stock','Stocks et prévisions']],AL.tab,'data-at')+'</div><div id="al-body"></div></div>';
  body=el.querySelector('#al-body');
  function draw(keep){var foc=keep&&document.activeElement&&document.activeElement.id==='al-q';body.innerHTML=({plan:alPlan,board:alBoard,stock:alStock}[AL.tab]||alPlan)();if(!keep){P.animate(body);swap(body)}
    var q=body.querySelector('#al-q');if(q){q.oninput=function(){AL.q=q.value;draw(true)};if(foc){q.focus();q.setSelectionRange(q.value.length,q.value.length)}}}
  function refresh(){el.querySelector('#al-head').innerHTML=head();draw(true)}
  draw();
  on(el,'[data-at]',function(b){AL.tab=b.getAttribute('data-at');draw()});
  on(el,'[data-af]',function(b){AL.f=b.getAttribute('data-af');draw(true)});
  on(el,'[data-row]',function(r){rationSheet(D.horse(r.getAttribute('data-row')),refresh)});
  on(el,'[data-ration]',function(r){rationSheet(D.horse(r.getAttribute('data-ration')),refresh)});
  on(el,'[data-meal]',function(b){AL.meal=b.getAttribute('data-meal');draw(true);swap(body.querySelector('.al-board'))});
  on(el,'[data-fed]',function(b){var id=b.getAttribute('data-fed'),m=ST.fed[AL.meal];m[id]=!m[id];var n=D.horses.filter(function(h){return m[h.id]}).length;draw(true);var nb=body.querySelector('[data-fed="'+id+'"]');if(nb&&!P.RM)nb.classList.add('al-just');if(n===D.horses.length)P.toast('Distribution du '+AL.meal+' terminée, '+D.horses.length+' boxes servis',{icon:'checkc'})});
  on(el,'[data-order]',function(b){var s=stocks().find(function(a){return a.id===b.getAttribute('data-order')});ST.orders[s.id]=1;refresh();
    if(!DEMO){P.toast('Commande de '+s.order+' '+(s.unit||'')+' notée. Confirmez-la auprès de '+s.supplier+'.',{icon:'truck',undo:function(){delete ST.orders[s.id];refresh()}});return}P.toast('Commande envoyée à '+s.supplier+' : '+s.order+' '+(s.orderU||s.unit.split(' ')[0])+', '+F.eur(s.order*s.price)+', livraison le '+F.date(iso(s.lead)),{icon:'truck',undo:function(){delete ST.orders[s.id];refresh()}})});
  var ACT={
   print:printSheet,addstock:function(){liveForm('stock')},
   kiosk:function(){if(P.sellerie)P.sellerie({focus:'distribution'});else P.toast('L’écran de la sellerie s’ouvre depuis le planning',{icon:'expand'})},
   label:function(){labelSheet(refresh)},
   allfed:function(){var m=ST.fed[AL.meal],all=D.horses.every(function(h){return m[h.id]});D.horses.forEach(function(h){m[h.id]=!all});draw(true);P.toast(all?'Distribution du '+AL.meal+' remise à zéro':'Distribution du '+AL.meal+' notée pour les '+D.horses.length+' boxes',{icon:all?'refresh':'checkc'})},
   assist:function(){var low=D.horses.filter(function(h){var N=needs(h);return N.ufc/N.need<.88}),hi2=D.horses.filter(function(h){return nec(h)>=4&&h.ration.grain>=2.5});
     var sh=P.sheet({title:'Vérification des rations',icon:'checkc',body:'<div class="stack" style="--g:14px"><p class="s mut">Stabl compare chaque ration au poids, à la note d’état et au travail de la semaine.</p>'+
       '<div class="card flat"><div class="lb-row">'+sq('checkc','ok','sm')+'<div class="grow"><div class="t">'+(D.horses.length-low.length-hi2.length)+' rations équilibrées</div><div class="s">Apports entre 90 et 120 % des besoins</div></div></div>'+
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
 DEMO&&{role:'gerant',label:'Ouvrir la fiche d’Ulysse de la Roche',icon:'horse',run:function(){P.go('cheval',{id:'h01'})}},
 {role:'gerant',label:'Planifier une tournée du maréchal',icon:'hoof',run:function(){P.go('soins',{tab:'tours'});setTimeout(function(){newTourSheet('farrier')},60)}},
 {role:'gerant',label:'Planifier les vaccins grippe',icon:'syringe',run:function(){P.go('soins',{tab:'tours'});setTimeout(function(){newTourSheet('vacc')},60)}},
 {role:'gerant',label:'Exporter le registre sanitaire',icon:'download',run:function(){P.go('soins',{tab:'pharma'});if(DEMO)registerPdf(false);else careCsv()}},
 {role:'gerant',label:'Imprimer le tableau de distribution',icon:'feed',run:function(){P.go('alimentation',{tab:'board'});setTimeout(printSheet,60)}},
 {role:'gerant',label:'Commander du foin',icon:'hay',run:function(){P.go('alimentation',{tab:'stock'})}},
 {role:'gerant',label:'Valider les chevaux déclarés',icon:'horse',run:function(){P.go('chevaux');setTimeout(function(){declSheet(function(){P.rerender()})},60)}},
 {role:'gerant',label:'Photographier une étiquette d’aliment ou une analyse de foin',icon:'image',run:function(){P.go('alimentation');setTimeout(function(){labelSheet(function(){P.rerender()})},60)}},
 {role:'gerant',label:'Enregistrer la vue du cheptel',icon:'layers',run:function(){P.go('chevaux');setTimeout(function(){viewSheet(function(){P.rerender()})},60)}});
for(var pa=P.actions.length-1;pa>=0;pa--)if(!P.actions[pa])P.actions.splice(pa,1);

function findHorse(t){var n=norm(t),best=null;D.horses.forEach(function(h){var first=norm(h.name.split(' ')[0]);if(n.indexOf(norm(h.name))>=0||new RegExp('(^|[^a-z])'+first.replace(/[^a-z]/g,'.')+'([^a-z]|$)').test(n)){if(!best||h.name.length>best.name.length)best=h}});return best}
/* complète l’alerte sans la répéter : retire les phrases de la zone déjà dites par l’alerte */
function zoneRest(sum,alerts){var al=norm(alerts.join(' '));return sum.split(/(?<=\.)\s+/).filter(function(p){var k=norm(p).replace(/[.,]/g,'').trim();return k&&al.indexOf(k)<0}).join(' ')}
function hCard(h){return '<div class="hrow" style="--g:10px">'+U.hav(h)+'<div class="grow"><b class="s">'+E(h.name)+'</b><div class="xs mut">'+h.box+' · '+ownerLine(h)+'</div></div>'+stChip(h)+'</div>'}
P.brain.unshift(
 {role:'gerant',re:/co[uû]t|revient|rapporte|rentab|marge/i,reply:function(t){var h=findHorse(t);
   if(!h){D.horses.forEach(X);var tot=D.horses.reduce(function(a,x){return a+x.costMonth},0),top=D.horses.slice().sort(function(a,b){return b.costMonth-a.costMonth}).slice(0,3);
     return {text:'Le cheptel coûte '+F.eur(tot)+' par mois, soit '+F.eur(Math.round(tot/D.horses.length))+' par cheval en moyenne. Les trois plus coûteux :',card:top.map(function(x){return '<div class="hrow sp"><span class="s">'+E(x.name)+'</span><b class="s num">'+F.eur(x.costMonth)+'</b></div>'}).join(''),actions:[{label:'Voir le cheptel par coût',run:function(){LS.sort='cost';P.prefs.set('chevaux:view','table');P.go('chevaux');return 'Ouvert'}}]}}
   var x=X(h),mg=x.income-h.costMonth;
   return {text:E(h.name)+' revient à <b>'+F.eur(h.costMonth)+' par mois</b>. '+(h.owner?'La pension facturée à '+D.name(h.owner)+' est de '+F.eur(x.pension)+', soit ':'Il rapporte environ '+F.eur(x.income)+' en reprises, soit ')+(mg>=0?F.eur(mg)+' de marge.':F.eur(-mg)+' de perte.'),
     card:x.costs.slice().sort(function(a,b){return b.v-a.v}).slice(0,5).map(function(c){return '<div class="hrow sp"><span class="s">'+c.l+'</span><b class="s num">'+F.eur(c.v)+'</b></div>'}).join(''),
     actions:[{label:'Ouvrir le détail des coûts',run:function(){P.go('cheval',{id:h.id,tab:'couts'});return 'Fiche ouverte'}}]}}},
 {role:'gerant',re:/ration|foin|granul|mange|aliment|nourri/i,reply:function(t){var h=findHorse(t);
   if(h){var m=meals(h);return {text:E(h.name)+' reçoit '+kg(h.ration.hay)+' kg de foin et '+kg(h.ration.grain)+' kg de '+grainType(h).toLowerCase()+' par jour'+(h.ration.supp!=='Aucun'?', avec '+h.ration.supp.toLowerCase():'')+'. Coût : '+F.eur(feedDayTot(h),true)+' par jour.'+(CONS[h.id]?' Consigne : '+CONS[h.id].toLowerCase()+'.':''),card:MEALS.map(function(a){return '<div class="hrow sp"><span class="s">'+a[1]+', '+a[2]+'</span><b class="s num">'+kg(m[a[0]].hay)+' kg de foin'+(m[a[0]].grain?', '+kg(m[a[0]].grain)+' kg':'')+'</b></div>'}).join(''),actions:[{label:'Modifier la ration',run:function(){P.go('cheval',{id:h.id,tab:'alim'});setTimeout(function(){rationSheet(h)},80);return 'Ration ouverte'}}]}}
   var tt=feedTotals(),s=stocks()[0];return {text:'Aujourd’hui le club distribue '+kg(tt.hay)+' kg de foin et '+kg(tt.club+tt.flake)+' kg de granulés. Il reste '+s.qty+' balles de foin, soit environ '+daysLeft(s)+' jours.',actions:[{label:'Commander 20 balles',run:function(){ST.orders.k1=1;P.toast('Commande de 20 balles envoyée à Fourrages du Hurepoix');return 'Commande envoyée'}},{label:'Voir les stocks',run:function(){P.go('alimentation',{tab:'stock'});return 'Ouvert'}}]}}},
 {role:'gerant',re:/rappel|vaccin|vermifug|mar[ée]chal|ferr|dentiste|ost[ée]o|tourn[ée]e|soins? [àa] venir|prochains? soins?/i,reply:function(t){var h=findHorse(t);
   if(h){return {text:'Les prochaines échéances de '+E(h.name)+' :',card:RK.map(function(k){return {k:k,n:dueN(h,k)}}).sort(function(a,b){return a.n-b.n}).map(function(a){var tr=tourOf(h,a.k);return '<div class="hrow sp"><span class="s">'+RULES[a.k].l+'</span><b class="s '+(a.n<0?'badc':a.n<=RULES[a.k].soon?'warnc':'')+'">'+(tr?'tournée du '+F.date(tr.date):dueTxt(a.n))+'</b></div>'}).join(''),actions:[{label:'Ouvrir son carnet de santé',run:function(){P.go('cheval',{id:h.id,tab:'sante'});return 'Fiche ouverte'}}]}}
   var k=/vaccin/i.test(t)?'vacc':/vermifug/i.test(t)?'worm':/dentiste/i.test(t)?'dentist':/ost[ée]o/i.test(t)?'osteo':/mar[ée]chal|ferr/i.test(t)?'farrier':null,rows=reminderRows().filter(function(r){return !k||r.k===k});
   return {text:rows.length+' rappels'+(k?' « '+RULES[k].l.toLowerCase()+' »':'')+' tombent dans les 30 jours, dont '+rows.filter(function(r){return r.t}).length+' déjà regroupés en tournée. Les plus proches :',card:rows.slice(0,4).map(function(r){return '<div class="hrow sp"><span class="s">'+E(r.h.name)+' · '+RULES[r.k].l.toLowerCase()+'</span><b class="s '+(r.n<0?'badc':r.n<=7?'warnc':'')+'">'+dueTxt(r.n)+'</b></div>'}).join(''),
     actions:[{label:'Préparer une tournée',run:function(){P.go('soins',{tab:'tours'});setTimeout(function(){newTourSheet(k||'farrier')},80);return 'Demande prête à envoyer'}},{label:'Voir les rappels',run:function(){P.go('soins',{tab:'rem'});return 'Ouvert'}}]}}},
 {role:'gerant',re:/sant[ée]|comment va|comment vont|malade|boit|boite|colique|surveill|qui (est|sont) au repos|chevaux? [àa] voir/i,reply:function(t){var h=findHorse(t);
   if(h){var z=zones(h),bad=ZK.filter(function(k){return z[k].st!=='ok'}),nd=nextDue(h);
     return {text:h.status==='ok'&&!bad.length?E(h.name)+' va bien : aucune alerte, '+h.work+' h de travail cette semaine sur '+h.workMax+'. Prochain soin : '+RULES[nd.k].l.toLowerCase()+' '+dueTxt(nd.n)+'.':E(h.name)+(h.alerts.length?' : '+E(h.alerts.join('. ').charAt(0).toLowerCase()+h.alerts.join('. ').slice(1))+'.':' est à surveiller.')+(bad.length?' '+zoneRest(z[bad[0]].sum,h.alerts):''),
       card:hCard(h),actions:[{label:'Ouvrir sa fiche',run:function(){P.go('cheval',{id:h.id,tab:'sante'});return 'Fiche ouverte'}}].concat(h.owner?[{label:'Prévenir '+D.member(h.owner).first,run:function(){P.toast('Message envoyé à '+D.name(h.owner));return 'Message envoyé'}}]:[])}}
   var l=D.horses.filter(function(x){return x.status!=='ok'}).sort(function(a,b){return a.status==='bad'?-1:1});
   return {text:l.filter(function(x){return x.status==='bad'}).length+' chevaux demandent une attention urgente et '+l.filter(function(x){return x.status==='warn'}).length+' sont à surveiller :',card:l.slice(0,5).map(function(x){return '<div class="hrow sp"><span class="s b">'+E(x.name)+'</span><span class="xs '+(x.status==='bad'?'badc':'mut')+'" style="text-align:right">'+E(x.alerts[0])+'</span></div>'}).join(''),actions:[{label:'Voir les chevaux en alerte',run:function(){LS.f='alerte';P.go('chevaux');return 'Liste filtrée'}}]}}});

P.tourSteps.push({route:'cheval',params:{id:'h01'},title:'Le cheval en 3D, son carnet de santé sous le doigt',text:'Faites tourner Ulysse et touchez un point : l’antérieur gauche raconte sa tendinite de mars, les sabots annoncent le maréchal de jeudi. Santé, travail, ration, journal partagé, coûts et caméra du box tiennent dans la même fiche.'});

/* =====================================================================
   Manche 3 : direction Paddock (surcharge du style du lot)
   ===================================================================== */
P.css(`
/* ---- tuiles ---- */
.lb-kpis{gap:16px}
.lb-kpi{padding:20px 22px 20px;gap:10px;transition:transform var(--t-2) var(--e-out),box-shadow var(--t-2)}
.lb-kpi .lab{font-size:14.5px;font-weight:600;color:var(--ink-2);gap:10px;overflow:visible}
.lb-kpi.tint .lab,.lb-kpi.tint .sub,.lb-kpi.tint .val small{color:inherit}
.lb-kpi.tint .sub{opacity:.84}
.lb-kpi .lab .ico{flex:none}
.lb-kpi .val{font:800 40px/1 var(--f-display);letter-spacing:-.045em;margin-top:2px}
.lb-kpi .val small{font:700 16px var(--f-display);letter-spacing:-.01em;margin-left:6px;color:var(--mut)}
.lb-kpi .sub{font-size:14px;line-height:1.4;white-space:normal;color:var(--mut);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.lb-kpi .sub b{font-weight:700}
.lb-bento{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}
.lb-bento>.lb-hero{grid-column:span 2;grid-row:span 2}
.lb-bento>.lb-kpi:last-child:nth-child(4){grid-column:span 2}
.lb-hero{position:relative;overflow:hidden;padding:26px 28px;display:flex;min-height:300px;isolation:isolate}
.lb-hc{position:relative;z-index:1;display:flex;flex-direction:column;gap:12px;min-width:0;max-width:62%}
.lb-eb{display:inline-flex;align-items:center;gap:8px;font-size:14.5px;font-weight:600;align-self:flex-start;padding:7px 14px 7px 11px;border-radius:99px;background:color-mix(in srgb,var(--surface) 70%,transparent)}
.lb-hb{display:flex;align-items:baseline;gap:12px;flex-wrap:wrap;margin-top:6px}
.lb-hb .big{font-size:96px;letter-spacing:-.06em;line-height:.9}
.lb-hu{font:800 24px/1.1 var(--f-display);letter-spacing:-.03em}
.lb-hs{font-size:16px;line-height:1.45;margin:0;opacity:.86;max-width:34ch}
.lb-hst{display:flex;gap:10px;flex-wrap:wrap;margin-top:auto}
.lb-hst>div{display:flex;flex-direction:column;gap:2px;padding:10px 16px;border-radius:16px;background:color-mix(in srgb,var(--surface) 62%,transparent);min-width:86px}
.lb-hst b{font:800 26px/1 var(--f-display);letter-spacing:-.04em}
.lb-hst span{font-size:13.5px;font-weight:600;opacity:.8}
.lb-ha{display:flex;gap:10px;flex-wrap:wrap;margin-top:auto}
.lb-hi{position:absolute;right:-30px;bottom:-34px;width:min(48%,330px);aspect-ratio:200/232;z-index:0;pointer-events:none}
.lb-hi svg.illu{width:100%;height:100%;display:block}
.lb-watch .lb-wl{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto}
.lb-wh{display:inline-flex;align-items:center;gap:8px;height:44px;padding:0 14px 0 4px;border-radius:99px;background:color-mix(in srgb,var(--surface) 72%,transparent);font-weight:700;font-size:14px;color:inherit;transition:background var(--t-2),transform var(--t-1) var(--e-out)}
.lb-wh:hover{background:var(--surface)}.lb-wh:active{transform:scale(.96)}
.lb-wh .hx-por{width:36px;height:36px;border-radius:50%}
.lb-kpi.cv-ban{text-align:left;cursor:pointer;width:auto;flex-direction:column;align-items:stretch;padding:20px 22px}
.lb-kpi.cv-ban:hover{box-shadow:inset 0 0 0 1.5px var(--d)}
.lb-kpi.cv-ban b{display:inline;font-size:inherit}
.cv-bf{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:auto}
.lb-sq{width:40px;height:40px;border-radius:13px}.lb-sq svg.i{width:20px;height:20px}
.lb-sq.sm{width:34px;height:34px;border-radius:11px}.lb-sq.sm svg.i{width:18px;height:18px}
.lb-row{padding:14px 20px;gap:14px}
.lb-row .t{font-size:15px}.lb-row .grow>.s{font-size:14px}
.lb-dl dt{font-size:13px}.lb-dl dd{font-size:15px}
@container main (max-width:1180px){.lb-hb .big{font-size:80px}}
@container main (min-width:1240px){.lb-bento{grid-template-columns:none;grid-auto-flow:column;grid-auto-columns:minmax(0,1fr)}.lb-bento>.lb-hero{grid-row:auto}.lb-bento>.lb-kpi:last-child:nth-child(4){grid-column:auto}.lb-bento>*{min-height:0}.lb-hero{min-height:0;padding:22px 24px}.lb-hb .big{font-size:72px}.lb-hu{font-size:21px}.lb-hc{gap:9px}.lb-hi{width:min(40%,220px)}.lb-bento .lb-kpi .val{white-space:normal}.lb-bento .lb-kpi .val small{white-space:nowrap}}
@container main (max-width:1080px){.lb-bento{grid-template-columns:repeat(2,minmax(0,1fr))}.lb-bento>.lb-hero{grid-row:auto}.lb-hero{min-height:260px}}
@container main (max-width:760px){.lb-kpi .val{font-size:34px}.lb-hc{max-width:66%}}
@container main (max-width:520px){.lb-bento{gap:10px}.lb-hero{padding:20px;min-height:250px}.lb-hb .big{font-size:68px}.lb-hu{font-size:19px}.lb-hs{font-size:15px}.lb-hi{width:52%;right:-34px;bottom:-30px}.lb-hc{max-width:72%}.lb-hst>div{padding:8px 12px;min-width:0}.lb-hst b{font-size:22px}
 .lb-kpi{padding:16px}.lb-kpi .val{font-size:30px}.lb-kpi .val small{font-size:14px}.lb-kpi .lab{font-size:14px;gap:8px}.lb-kpi .lab .ico{width:30px;height:30px}.lb-kpi .sub{font-size:13.5px}.lb-row{padding:13px 16px}}

/* ---- galerie de chevaux ---- */
.hx-grid{grid-template-columns:repeat(auto-fill,minmax(282px,1fr));gap:18px}
.hx-c{padding:0;gap:0;overflow:hidden;cursor:pointer;transition:transform var(--t-3) var(--e-out),box-shadow var(--t-3) var(--e-out)}
.hx-c:hover{transform:translateY(-4px);box-shadow:inset 0 0 0 1px var(--line),0 18px 40px -18px color-mix(in srgb,var(--ink) 38%,transparent)}
.hx-c:active{transform:translateY(-1px) scale(.99)}
.hx-c .hx-top{position:relative;overflow:hidden;height:178px;padding:0;display:block;--pb:var(--hz-bg);--pi:var(--hz-ink);background:radial-gradient(120% 90% at 85% 100%,color-mix(in srgb,var(--surface) 55%,transparent),transparent 60%),var(--pb);color:var(--pi)}
.hx-c.st-warn .hx-top{--pb:var(--mo-bg);--pi:var(--mo-ink)}
.hx-c.st-bad .hx-top{--pb:var(--cr-bg);--pi:var(--cr-ink)}
.hx-top .hx-por{position:absolute;right:-10px;bottom:-30px;width:164px;height:190px;background:none;transform-origin:70% 100%;transition:transform var(--t-3) var(--e-spring)}
.hx-c:hover .hx-top .hx-por{transform:scale(1.05) rotate(-2deg)}
.hx-bx{position:absolute;left:20px;top:18px;display:flex;flex-direction:column;gap:3px}
.hx-bx span{font:800 34px/1 var(--f-display);letter-spacing:-.045em}
.hx-bx small{font-size:13.5px;font-weight:700;opacity:.85}
.hx-stt{position:absolute;left:16px;bottom:14px;display:flex;gap:6px;flex-wrap:wrap;max-width:62%}
.hx-stt .chip{background:var(--surface);box-shadow:var(--shadow-1)}
.hx-stt .chip.bad{background:var(--bad);color:var(--on-acc)}
.hx-c .cv-pin{top:12px;right:12px;width:40px;height:40px;border-radius:13px;background:color-mix(in srgb,var(--surface) 78%,transparent);color:var(--pi);z-index:2}
.hx-c .cv-pin:hover{background:var(--surface)}
.hx-c .cv-pin[aria-pressed="true"]{color:var(--warn)}
.hx-bd{padding:18px 20px 16px;display:flex;flex-direction:column;gap:14px;flex:1}
.hx-bd h3{font:800 21px/1.1 var(--f-display);letter-spacing:-.03em}
.hx-sub{font-size:14.5px;color:var(--mut);margin-top:4px}
.hx-al{font-size:14px;line-height:1.4;gap:8px;color:var(--ink-2);display:flex;align-items:flex-start;min-height:40px}
.hx-al svg.i{width:18px;height:18px;margin-top:0;flex:none;color:var(--warn)}
.hx-al.bad svg.i{color:var(--bad)}.hx-al.ok svg.i{color:var(--ok)}
.hx-al.ok{color:var(--mut)}
.hx-load{gap:8px}.hx-load .hrow{font-size:13.5px}.hx-load b{font-size:14px}
.hx-load .bar{height:8px}
.hx-foot{margin:0;padding:13px 20px;font-size:13.5px;background:var(--surface-2)}
.hx-foot svg.i{width:18px;height:18px}
.hx-foot b{font-size:14.5px}
.hx-foot .hx-cost{gap:1px;flex:none;color:var(--mut)}
.hx-foot>span:first-child{flex:1 1 auto;min-width:0}
.lb-dist{display:flex;align-items:flex-end;gap:2px;height:46px;margin-top:auto}
.lb-dist i{flex:1;min-width:2px;border-radius:3px 3px 1px 1px;background:var(--c);height:var(--h);transform-origin:bottom;animation:grow .7s var(--e-out) both;animation-delay:calc(var(--i)*12ms)}
.lb-dist+.lb-dl2{display:flex;justify-content:space-between;font-size:13px;color:var(--mut);margin-top:-2px}
.lb-split{display:flex;height:12px;border-radius:99px;overflow:hidden;gap:3px;margin-top:auto}
.lb-split i{display:block;height:100%;border-radius:99px;background:var(--c);transform-origin:left;animation:cvgrow .9s var(--e-out) both}
.lb-lg{display:flex;gap:14px;flex-wrap:wrap;font-size:13.5px;color:var(--mut)}
.lb-lg span{display:inline-flex;align-items:center;gap:6px}.lb-lg i{width:9px;height:9px;border-radius:50%;background:var(--c)}
/* portrait illustré à la robe du cheval */
.hx-por{position:relative;overflow:hidden;flex:none;--r1:var(--coat);--r2:var(--coat-2);--r3:var(--mane);--r4:var(--blaze)}
.hx-por svg.illu{width:100%;height:100%;display:block;--coat:var(--r1);--coat-2:var(--r2);--mane:var(--r3);--blaze:var(--r4)}
.hx-por svg.illu>circle:first-child{display:none}
.hx-por .illu *{animation-play-state:paused}
.hx-c:hover .hx-por .illu *,.lb-wh:hover .hx-por .illu *{animation-play-state:running}
.hx-por.r-ab{--r1:color-mix(in srgb,var(--coat-2) 78%,var(--mane));--r2:color-mix(in srgb,var(--coat-2) 52%,var(--mane));--r3:color-mix(in srgb,var(--coat-2) 40%,var(--mane))}
.hx-por.r-ba{--r1:color-mix(in srgb,var(--leather) 80%,var(--coat));--r2:var(--leather-2);--r3:var(--mane)}
.hx-por.r-bb{--r1:color-mix(in srgb,var(--leather-2) 72%,var(--mane));--r2:color-mix(in srgb,var(--leather-2) 45%,var(--mane));--r3:var(--mane)}
.hx-por.r-no{--r1:color-mix(in srgb,var(--mane) 72%,var(--steel-2));--r2:color-mix(in srgb,var(--mane) 88%,var(--steel-2));--r3:color-mix(in srgb,var(--mane) 85%,var(--steel-2))}
.hx-por.r-gr{--r1:color-mix(in srgb,var(--steel) 42%,var(--blaze));--r2:color-mix(in srgb,var(--steel) 75%,var(--blaze));--r3:var(--steel-2)}
.hx-por.r-pa{--r1:var(--hay);--r2:var(--hay-2);--r3:var(--blaze)}
.hx-por.r-is{--r1:color-mix(in srgb,var(--hay) 58%,var(--coat));--r2:color-mix(in srgb,var(--hay-2) 60%,var(--coat-2));--r3:var(--mane)}
.hx-por.r-ro{--r1:color-mix(in srgb,var(--steel) 48%,var(--coat));--r2:color-mix(in srgb,var(--steel-2) 45%,var(--coat-2));--r3:color-mix(in srgb,var(--mane) 70%,var(--coat-2))}
.hx-por.r-pi{--r1:color-mix(in srgb,var(--coat) 85%,var(--blaze))}
.hx-por.nb{--r4:var(--r1)}
.hx-por.r-no.nb,.hx-por.r-bb.nb{--r4:var(--r2)}
.hx-por.sm{background:var(--surface)}
.hx-por.sm svg.illu{width:150%;height:150%;margin:-6% 0 0 -38%}
@container main (max-width:520px){.hx-grid{gap:14px}.hx-c .hx-top{height:156px}.hx-top .hx-por{width:166px;height:192px}}

/* ---- barre d'outils, vues, épinglés ---- */
.lb-tools{gap:12px}
.lb-tools .search{max-width:420px}
.lb-tags{gap:8px}
.cv-vw{gap:10px}.cv-vw>.xs{font-size:14px;font-weight:600}
.cv-pins{padding:16px 18px}
.cv-pins .hd{margin-bottom:12px;gap:10px}.cv-pins .hd b{font-size:15px}
.cv-pi{padding:8px 16px 8px 8px;gap:12px;width:290px;border-radius:18px}
.cv-pi .hx-por{width:48px;height:48px;border-radius:14px;background:var(--hz-bg)}
.cv-pi .hx-por svg.illu{width:150%;height:150%;margin:-8% 0 0 -40%}
.cv-pi b.s{font-size:15px}

/* ---- fiche cheval : profil ---- */
.fc-back{font-size:14.5px;height:40px}
.fc-hero{grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);background:var(--surface)}
.fc-stage{height:auto;min-height:540px;border-right:0;background:radial-gradient(70% 55% at 50% 92%,color-mix(in srgb,var(--hz) 30%,transparent),transparent 72%),radial-gradient(90% 80% at 30% 10%,color-mix(in srgb,var(--surface) 55%,transparent),transparent 70%),var(--hz-bg)}
.fc-stage .fc-gl{position:absolute!important;left:-80px;top:-44px;width:calc(100% + 160px);height:calc(100% + 110px);margin:0}
.fc-hint{font-size:13.5px;padding:8px 14px 8px 10px;background:color-mix(in srgb,var(--surface) 82%,transparent);box-shadow:none;color:var(--hz-ink)}
.fc-hint svg.i{width:18px;height:18px}
.fc-zones{padding:14px 32px 14px 16px;gap:8px;background:linear-gradient(to top,color-mix(in srgb,var(--hz-bg) 94%,transparent) 55%,transparent)}
.fc-z{height:40px;padding:0 15px 0 12px;font-size:14px;gap:8px;box-shadow:var(--shadow-1)}
.fc-z i{width:10px;height:10px}
.fc-id{padding:30px 32px 28px;gap:18px}
.fc-id h1{font-size:46px;letter-spacing:-.045em;line-height:1}
.fc-nm .mut{font-size:16px}
.fc-rings{gap:8px;padding:12px;border-radius:20px;background:var(--surface-2)}
.fc-ring{padding:10px 2px 8px;gap:6px;border-radius:16px}
.fc-ring:hover{background:var(--surface)}
.fc-ring .ring{--s:58px}
.fc-ring .ring svg.i{width:22px;height:22px}
.fc-ring b{font-size:14px}
.fc-ring span.d{font-size:13px}
.fc-acts .btn{height:48px}
.fc-as{display:none}
.fc-acts .btn.icon{width:48px}
.fc-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:16px}
.fc-st{display:flex;flex-direction:column;align-items:stretch;gap:10px;padding:18px 20px;text-align:left;cursor:pointer;transition:transform var(--t-2) var(--e-out),box-shadow var(--t-2)}
.fc-st:hover{transform:translateY(-2px);box-shadow:inset 0 0 0 1.5px var(--d),var(--shadow-1)}
.fc-st .lab{display:flex;align-items:center;gap:10px;font-size:14.5px;font-weight:600;color:var(--ink-2)}
.fc-st.tint .lab{color:inherit}
.fc-st .v{font:800 32px/1 var(--f-display);letter-spacing:-.04em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fc-st .v small{font:700 15px var(--f-display);letter-spacing:-.01em;margin-left:6px;color:var(--mut)}
.fc-st .s{font-size:14px;color:var(--mut);margin-top:auto}
.fc-st.tint .s{color:inherit;opacity:.85}
.fc-st .bar,.fc-st .fc-nec{margin-top:auto}
.fc-nec i{height:10px;border-radius:4px}
.fc-nec i.on,.fc-nec i.cur{background:var(--hz)}
.fc-nec i.cur{box-shadow:0 0 0 3px var(--hz-bg)}
.fc-tabs{margin:22px 0 18px}
.fc-ev{grid-template-columns:56px 22px minmax(0,1fr);font-size:15px;padding:9px 0}
.fc-ev .dt{width:11px;height:11px}
.fc-j{padding:18px 20px;grid-template-columns:44px minmax(0,1fr);gap:14px}
.fc-j p{font-size:15px}
.fc-wd .dn{font-size:13.5px}
.fc-ss{font-size:13px;padding:8px 9px 8px 14px}.fc-ss b{font-size:13.5px}
.fc-ml .q{font-size:14.5px}
.fc-cost{font-size:14.5px;padding:10px 0}
.fc-gait .v{font-size:24px}
@container main (max-width:1180px){.fc-id{padding:24px}.fc-id h1{font-size:38px}.fc-stage{min-height:480px}}
@container main (max-width:1080px){.fc-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.fc-hero{grid-template-columns:minmax(0,1fr)}.fc-stage{min-height:0;height:440px}.fc-id{padding:24px 26px}}
@container main (max-width:760px){.fc-stage{height:330px;min-height:0}.fc-id{padding:20px}.fc-id h1{font-size:32px}.fc-rings{padding:8px;gap:2px}.fc-ring .ring{--s:48px}.fc-ring .ring svg.i{width:19px;height:19px}.fc-ring b{font-size:13px}.fc-stats{gap:10px;margin-top:12px}.fc-st{padding:14px 16px;gap:8px}.fc-st .v{font-size:26px}.fc-st .lab{font-size:13.5px;gap:8px}.fc-st .lab .ico{width:28px;height:28px}.fc-st .s{font-size:13px}.fc-z{height:38px}}
@container main (max-width:520px){.fc-ring span.d{font-size:13px;white-space:normal;line-height:1.15}.fc-rings{grid-template-columns:repeat(5,minmax(0,1fr))}.fc-ring .ring{--s:44px}.fc-ring b{font-size:13px}.fc-st .v small{display:block;margin:4px 0 0;font-size:13px}}
.lb-hi svg.illu>circle:first-child{fill:var(--surface);opacity:.5}

/* ---- soins : tableau de bord ---- */
.so-today{display:flex;flex-direction:column;gap:8px;width:100%;max-width:440px;flex:1}
.so-tr{display:flex;align-items:center;gap:12px;min-height:48px;padding:0 14px;border-radius:16px;background:color-mix(in srgb,var(--surface) 74%,transparent);color:inherit;text-align:left;font-size:15px;transition:background var(--t-2),transform var(--t-1) var(--e-out)}
.so-tr:hover{background:var(--surface)}.so-tr:active{transform:scale(.98)}
.so-tr .tm{font:800 15px var(--f-display);width:64px;flex:none}
.lb-hi-fer{width:min(36%,230px);aspect-ratio:1;right:6px;bottom:auto;top:44px}
.lb-hi-foin{width:min(40%,260px);aspect-ratio:140/112;right:18px;bottom:22px}
.lb-hi-seau{width:min(34%,210px);aspect-ratio:1;right:14px;bottom:18px}
.so-tr b{font-weight:700}
.so-tr svg.i{width:18px;height:18px;opacity:.6}
.so-cal .dh{font-size:13px;padding:12px 14px}
.so-cd{min-height:128px;padding:10px 8px 10px;gap:6px}
.so-cd .n{font-size:14px;height:26px}
.so-cd.today{background:color-mix(in srgb,var(--cr-bg) 45%,transparent)}
.so-cd.today .n span{background:var(--cr);color:var(--on-acc);padding:3px 10px}
.so-ev{height:30px;font-size:13px;border-radius:9px;padding:0 9px;gap:7px}
.so-ev i{width:8px;height:8px}
.so-agd{font-size:13px;padding:16px 20px 6px}
.so-rule{padding:18px;gap:12px}
.so-tour{padding:20px;gap:14px}
.so-msg{font-size:14.5px}
@container main (max-width:520px){.so-today{max-width:none}.so-tr{min-height:46px;font-size:14px}}

/* ---- alimentation ---- */
.lb-hst b small{font-size:15px;opacity:.6;letter-spacing:0}
.al-gauge{position:relative;height:12px;border-radius:99px;background:color-mix(in srgb,currentColor 12%,transparent);margin-top:auto}
.al-gauge i{position:absolute;left:0;top:0;bottom:0;border-radius:99px;background:var(--d);transform-origin:left;animation:cvgrow .9s var(--e-out) both}
.al-gauge u{position:absolute;top:-4px;bottom:-4px;width:3px;border-radius:2px;background:var(--d-ink)}
.lb-kpi.tint .lb-lg{color:inherit;opacity:.8}
.al-box{padding:14px 16px;gap:10px;border-radius:18px}
.al-box .bx{font-size:13px;padding:4px 8px}
.al-q{padding:8px 10px;border-radius:12px}
.al-q small{font-size:13px;letter-spacing:.02em;text-transform:none}
.al-q b{font-size:20px}
.al-q b span{font-size:13px}
.al-fl{font-size:13.5px}.al-fl svg.i{width:16px;height:16px}
.al-paper table{font-size:13px}.al-paper th{font-size:13px;letter-spacing:.02em}.al-paper td.bx{font-size:13px}
.al-stock{padding:20px;gap:14px}
.al-stock .big{font-size:38px}

/* ---- téléphone : cartes et feuilles ---- */
.al-pc{display:none}
@container main (max-width:520px){
 .al-pt{display:none}.al-pc{display:flex;flex-direction:column;gap:10px}
 .al-pr{display:flex;align-items:center;gap:12px;padding:12px 14px 12px 12px;text-align:left;width:100%}
 .al-pr .hx-por{width:52px;height:52px;border-radius:16px;background:var(--hz-bg)}
 .al-pr .hx-por svg.illu{width:150%;height:150%;margin:-8% 0 0 -40%}
 .al-pr .grow{display:flex;flex-direction:column;gap:2px;min-width:0}
 .al-pr .grow b{font-size:15.5px}.al-pr .grow>span{font-size:13.5px;color:var(--mut)}
 .al-pq{display:grid;grid-template-columns:auto auto;gap:0 6px;align-items:baseline;flex:none;text-align:right}
 .al-pq b{font:800 18px var(--f-display);letter-spacing:-.02em}.al-pq b small{font:600 13px var(--f-text);color:var(--mut)}
 .al-pq span{font-size:13px;color:var(--mut);text-align:left}
 .lb-ph>.acts{flex-wrap:wrap}.app.mobile .lb-ph>.acts .btn.pri{flex:1 1 100%;order:-1}
 .lb-kpi .lab .ellip{white-space:normal;line-height:1.2}
 .lb-hc{max-width:none}.lb-hi{width:38%;top:12px;right:-14px;bottom:auto}.lb-hi-fer{width:30%;top:20px;right:8px}.lb-hi-foin{width:34%;top:16px;bottom:auto;right:10px}
 .lb-hb{max-width:64%}.lb-hs{max-width:62%}
 .lb-hst{gap:6px}.lb-hst>div{padding:8px 11px}
 .so-today{max-width:none}
 .lb-dist{gap:1px}.lb-dist i{min-width:0}
 .cv-bf{flex-wrap:wrap;gap:8px}.cv-bf .btn{flex:1}
 .cv-pins .hd .xs.mut:last-child{display:none}
 .fc-hero{grid-template-columns:minmax(0,1fr)}
}
@container main (max-width:760px){.fc-hero{grid-template-columns:minmax(0,1fr)}.fc-stage{min-height:0}.fc-stage .fc-gl{left:-50px;top:-22px;width:calc(100% + 100px);height:calc(100% + 64px)}}

/* ---- manche 4 : corrections d'affichage et mouvement ---- */
.lb-sw{animation:lbSw .24s var(--e-out) both}
@keyframes lbSw{from{opacity:0;transform:translateY(10px)}}
@keyframes lbPop{0%{transform:scale(.6)}55%{transform:scale(1.18)}100%{transform:none}}
@keyframes lbTap{40%{transform:scale(.97)}}
.al-box.al-just{animation:lbTap .3s var(--e-out)}
.al-box.al-just[aria-checked="true"] .chk{animation:lbPop .36s var(--e-spring)}
.lb-hi .il-tw{display:none}
.h3d.show.fc-hide span{opacity:0}
.lb-hst{flex-wrap:nowrap}
.lb-hst>div{flex:0 1 auto;min-width:0;padding:10px 14px}.lb-hst span{white-space:nowrap}
.al-cons{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-width:220px;white-space:normal;line-height:1.35}
.so-ev{display:grid;grid-template-columns:8px minmax(0,1fr);column-gap:7px;row-gap:1px;height:auto;min-height:30px;padding:6px 9px;align-items:center}
.so-ev small{grid-column:2;font-size:13px;font-weight:500;color:var(--mut);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;line-height:1.2}
.so-ev span{line-height:1.2}
.so-ev.late small{color:inherit;opacity:.8}
.so-ics{display:flex;gap:8px}.so-ics .in{flex:1;min-width:0;font-size:13.5px}
.so-icsg{display:flex;flex-wrap:wrap;gap:8px}
.lb-lg{flex-wrap:wrap;gap:4px 12px}
@container main (max-width:520px){
 .lb-kpi .val{white-space:normal}.lb-kpi .val small{white-space:nowrap;display:inline-block}
 .hx-c .hx-top{height:142px}.hx-top .hx-por{width:136px;height:158px;bottom:-26px}.hx-bx span{font-size:30px}
 .fc-rings{grid-template-columns:repeat(3,minmax(0,1fr));row-gap:6px}.fc-ring span.d{white-space:nowrap}
 .so-icsg .btn{flex:1 1 auto}
 .lb-lg span:nth-child(n+4){display:none}
 .fc-camb,.fc-camb>.hrow{display:grid;grid-template-columns:minmax(0,1fr);gap:8px;width:100%}.fc-camb .btn{justify-content:center}
 .fc-fib{flex-wrap:wrap;gap:8px}.fc-fib .chip{max-width:none}
 .fc-wt{flex-direction:column;align-items:flex-start!important;gap:10px}.fc-wt>div:last-child{text-align:left!important}
}
@media (prefers-reduced-motion:reduce){.lb-sw,.al-box.al-just,.al-box.al-just .chk{animation:none}}
`);

/* =====================================================================
   7. Photos du cheval : appareil photo, recadrage, compression, galerie
   Magasin : window.STABL_MEDIA (appli réelle, app/web/live/65-medias.js : R2 + file hors ligne)
   sinon magasin local de la démo (mémoire + vignettes en stockage local).
   Contrat d'un magasin : list(horseId) → Promise<[photo]>, add(horseId, o) → Promise<photo>,
   remove(horseId, id) → Promise, src(id, thumb) → url|null, onChange(fn).
   photo = {id, horse, kind:'profil'|'marques'|'soin', zone, note, url, thumb, date, author, pending?}
   ===================================================================== */
/* icône d'appareil photo (l'icône camera du jeu est une caméra vidéo) */
if(window.ICONS&&!ICONS.photo)ICONS.photo='<path d="M3.5 9a2.5 2.5 0 0 1 2.5-2.5h1.9l1.5-2.2h5.2l1.5 2.2H18A2.5 2.5 0 0 1 20.5 9v7.5A2.5 2.5 0 0 1 18 19H6a2.5 2.5 0 0 1-2.5-2.5z"/><circle cx="12" cy="12.6" r="3.4"/><circle cx="17.2" cy="9.6" r=".9" class="f"/>';
var PHK='stabl:demo:photos:v1',PHM='stabl:demo:photos:main:v1';
var PHL={profil:'Profil',marques:'Marques et robe',soin:'Soin'};
function phId(){var a=new Uint8Array(9);try{crypto.getRandomValues(a)}catch(e){for(var i=0;i<9;i++)a[i]=Math.random()*256}return 'med_'+Date.now().toString(36)+Array.prototype.map.call(a,function(b){return (b%36).toString(36)}).join('')}
function blobUrl(b){return new Promise(function(res){if(!b){res(null);return}var r=new FileReader();r.onload=function(){res(r.result)};r.onerror=function(){res(null)};r.readAsDataURL(b)})}
var PHD=(function(){var m={},subs=[];
  try{m=JSON.parse(localStorage.getItem(PHK)||'{}')||{}}catch(e){m={}}
  /* on garde la vignette seule dans le stockage local (quota de quelques Mo) ; la photo entière vit le temps de la visite */
  function save(){var c={};Object.keys(m).forEach(function(h){c[h]=m[h].slice(0,24).map(function(p){var q=Object.assign({},p);q.url=p.thumb;return q})});
    try{localStorage.setItem(PHK,JSON.stringify(c))}catch(e){try{Object.keys(c).forEach(function(h){c[h]=c[h].slice(0,4)});localStorage.setItem(PHK,JSON.stringify(c))}catch(e2){}}}
  function fire(h){subs.forEach(function(f){try{f(h)}catch(e){}})}
  return {
    list:function(h){return Promise.resolve((m[h]||[]).slice())},
    add:function(h,o){return Promise.all([blobUrl(o.blob),blobUrl(o.thumb)]).then(function(u){
      var p={id:o.id||phId(),horse:h,kind:o.kind||'profil',zone:o.zone||null,note:o.note||'',url:u[0],thumb:u[1]||u[0],date:new Date().toISOString(),author:o.author||'',w:o.w,h:o.h};
      (m[h]=m[h]||[]).unshift(p);save();fire(h);return p})},
    remove:function(h,id){m[h]=(m[h]||[]).filter(function(p){return p.id!==id});save();fire(h);return Promise.resolve()},
    src:function(id,thumb){for(var h in m)for(var i=0;i<m[h].length;i++)if(m[h][i].id===id)return thumb?m[h][i].thumb:m[h][i].url;return null},
    onChange:function(f){subs.push(f)}}})();
function PHS(){return window.STABL_MEDIA||PHD}
/* photo principale : champ photo du cheval (synchronisé dans l'appli) ; dans la démo, retenue dans le stockage local */
(function(){if(window.STABL_MEDIA)return;var mm={};try{mm=JSON.parse(localStorage.getItem(PHM)||'{}')||{}}catch(e){}
  Object.keys(mm).forEach(function(hid){var h=D.horse(hid);if(h&&PHD.src(mm[hid],true))h.photo=mm[hid]})})();
function phSetMain(h,id){h.photo=id||null;if(!window.STABL_MEDIA){var mm={};try{mm=JSON.parse(localStorage.getItem(PHM)||'{}')||{}}catch(e){}if(id)mm[h.id]=id;else delete mm[h.id];try{localStorage.setItem(PHM,JSON.stringify(mm))}catch(e){}}}
function phMain(h){if(!h||!h.photo)return null;var u=PHS().src(h.photo,true);return u||null}
function phAuthor(){return DEMO?'Claire Dumont':(gName()||'Vous')}

/* ---------- Image : chargement, recadrage, compression ---------- */
function phLoad(file){return new Promise(function(res,rej){var u=URL.createObjectURL(file),im=new Image();im.decoding='async';
  im.onload=function(){res({im:im,u:u,w:im.naturalWidth,h:im.naturalHeight})};im.onerror=function(){URL.revokeObjectURL(u);rej(new Error('image'))};im.src=u})}
function phBlob(cv,type,q){return new Promise(function(res){try{cv.toBlob(function(b){res(b)},type,q)}catch(e){res(null)}})}
/* WebP (ou JPEG si le navigateur ne sait pas l'écrire), 1600 px au plus, 400 Ko au plus */
function phEncode(src,sx,sy,sw,sh,maxSide,maxBytes){
  var sc=Math.min(1,maxSide/Math.max(sw,sh)),qs=[.84,.76,.68,.6,.5];
  function pass(scale){var cv=document.createElement('canvas');cv.width=Math.max(1,Math.round(sw*scale));cv.height=Math.max(1,Math.round(sh*scale));
    var g=cv.getContext('2d');g.imageSmoothingQuality='high';g.drawImage(src,sx,sy,sw,sh,0,0,cv.width,cv.height);
    var i=0,type='image/webp';
    function next(){return phBlob(cv,type,qs[i]).then(function(b){
      if(b&&type==='image/webp'&&b.type!=='image/webp'){type='image/jpeg';return next()}
      if(!b)return null;
      if(b.size<=maxBytes||i>=qs.length-1){if(b.size>maxBytes&&scale>.3)return pass(scale*.8);return {blob:b,w:cv.width,h:cv.height}}
      i++;return next()})}
    return next()}
  return pass(sc)}

/* ---------- Feuille : prendre ou choisir une photo, recadrer, enregistrer ---------- */
var PHF=[['sq','Carré',1],['pt','Portrait',3/4],['ls','Paysage',4/3]];
P.horsePhoto=function(h,o){if(typeof h==='string')h=D.horses.filter(function(x){return x.id===h})[0];if(h)phCapture(h,o)};
function phCapture(h,o){o=o||{};var kind=o.kind||'profil',zone=o.zone||null,zl=o.zoneLabel||'';
  var title=kind==='soin'?'Photo de soin'+(zl?' : '+zl.toLowerCase():''):kind==='marques'?'Photo des marques':'Photo de '+h.name.split(' ')[0];
  var canCam=!!(navigator.mediaDevices&&navigator.mediaDevices.getUserMedia);
  var sh=P.sheet({title:title,icon:'image',wide:true,body:function(b){
    b.innerHTML='<div class="phx-pick stack" style="--g:14px">'+
      '<div class="phx-hero">'+U.hav(h)+'<div class="grow"><b>'+E(h.name)+'</b><div class="xs mut">'+(kind==='soin'?'La photo rejoint le carnet de santé'+(zl?', zone '+E(zl.toLowerCase()):''):kind==='marques'?'Robe, balzanes, épis et marques : pour reconnaître le cheval d’un coup d’œil':'Mettez le cheval de profil, tout le corps dans le cadre, à la lumière du jour')+'</div></div></div>'+
      '<div class="phx-opts">'+
       '<label class="phx-opt pri"><input type="file" accept="image/*" capture="environment" data-phin hidden>'+ICON('photo')+'<span><b>Prendre une photo</b><small>Ouvre l’appareil photo du téléphone</small></span></label>'+
       '<label class="phx-opt"><input type="file" accept="image/jpeg,image/png,image/webp,image/heic,image/*" data-phin hidden>'+ICON('image')+'<span><b>Choisir dans la galerie</b><small>Une photo déjà prise</small></span></label>'+
       (canCam?'<button type="button" class="phx-opt" data-phcam>'+ICON('scan')+'<span><b>Viser avec le cadre</b><small>Un guide pour cadrer le cheval de profil</small></span></button>':'')+
      '</div>'+
      (kind!=='soin'?'<div class="field"><span>Type de photo</span>'+U.seg([['profil','Profil'],['marques','Marques et robe']],kind,'data-phk')+'</div>':'')+
     '</div><div class="phx-edit" hidden></div><div class="phx-live" hidden></div>';
    var pick=b.querySelector('.phx-pick'),ed=b.querySelector('.phx-edit'),lv=b.querySelector('.phx-live');
    P.$$('[data-phk]',b).forEach(function(x){x.onclick=function(){kind=x.getAttribute('data-phk');P.$$('[data-phk]',b).forEach(function(y){y.setAttribute('aria-pressed',y===x);y.setAttribute('aria-selected',y===x)})}});
    P.$$('[data-phin]',b).forEach(function(inp){inp.onchange=function(){var f=inp.files&&inp.files[0];inp.value='';if(f)open(f)}});
    var cb=b.querySelector('[data-phcam]');if(cb)cb.onclick=live;
    function open(f){if(!/^image\//.test(f.type||'image/')&&!/\.(jpe?g|png|webp|heic|heif)$/i.test(f.name||'')){P.toast('Ce fichier n’est pas une photo',{icon:'alert'});return}
      phLoad(f).then(function(x){editor(x)},function(){P.toast('Impossible de lire cette photo. Essayez une photo JPEG ou PNG.',{icon:'alert',ms:5000})})}
    /* appareil photo dans la page, avec un cadre-guide */
    function live(){pick.hidden=true;lv.hidden=false;
      lv.innerHTML='<div class="phx-cam"><video playsinline muted autoplay></video><div class="phx-guide" aria-hidden="true"><div class="phx-gf">'+(window.ILLU?ILLU.cheval({size:null,still:true,cls:'phx-gil'}):'')+'</div><span>Mettez le cheval de profil</span></div></div>'+
        '<div class="hrow sp" style="margin-top:12px"><button class="btn ghost" data-phback>'+ICON('back','sm')+'Retour</button><button class="btn pri lg" data-phshot>'+ICON('photo','sm')+'Prendre la photo</button></div>';
      var v=lv.querySelector('video'),stream=null;
      function stop(){if(stream){stream.getTracks().forEach(function(t){t.stop()});stream=null}}
      (function watch(){if(!v.isConnected||lv.hidden){stop();return}setTimeout(watch,500)})();
      navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:1920},height:{ideal:1080}},audio:false}).then(function(s){if(!v.isConnected){s.getTracks().forEach(function(t){t.stop()});return}stream=s;v.srcObject=s},function(){stop();lv.hidden=true;pick.hidden=false;P.toast('L’appareil photo n’est pas accessible. Autorisez-le ou choisissez une photo.',{icon:'camera',ms:5200})});
      lv.querySelector('[data-phback]').onclick=function(){stop();lv.hidden=true;pick.hidden=false};
      lv.querySelector('[data-phshot]').onclick=function(){if(!v.videoWidth){P.toast('L’image arrive, un instant',{icon:'camera'});return}
        var cv=document.createElement('canvas');cv.width=v.videoWidth;cv.height=v.videoHeight;cv.getContext('2d').drawImage(v,0,0);stop();lv.hidden=true;
        editor({im:cv,u:null,w:cv.width,h:cv.height})}}
    /* recadrage : faire glisser pour placer, molette ou deux doigts pour zoomer */
    function editor(x){pick.hidden=true;ed.hidden=false;var fmt=kind==='profil'?'ls':'sq',zoom=1,cx=x.w/2,cy=x.h/2,main=kind==='profil'&&(!h.photo||o.main);
      ed.innerHTML='<div class="phx-crop"><canvas></canvas><div class="phx-grid" aria-hidden="true"><i></i><i></i><i></i><i></i></div></div>'+
        '<div class="phx-tools"><div class="phx-fmt">'+U.seg(PHF.map(function(f){return [f[0],f[1]]}),fmt,'data-phf')+'</div>'+
        '<label class="phx-zoom" title="Zoom">'+ICON('minus','sm')+'<input type="range" min="1" max="3" step="0.01" value="1" data-phz aria-label="Zoom">'+ICON('plus','sm')+'</label></div>'+
        (kind==='profil'?'<label class="phx-main">'+U.chk(main,'phmain')+'<span>En faire la photo principale de '+E(h.name.split(' ')[0])+'</span></label>':'')+
        '<label class="field"><span>Légende (facultatif)</span><input class="in" data-phnote maxlength="200" placeholder="'+(kind==='soin'?'Ce qu’on voit, depuis quand…':kind==='marques'?'Balzane postérieur gauche, liste en tête…':'Au pré, après la tonte…')+'"></label>'+
        '<div class="phx-foot"><button class="btn ghost" data-phre>'+ICON('refresh','sm')+'Changer de photo</button><button class="btn pri" data-phok>'+ICON('check','sm')+'Enregistrer la photo</button></div>';
      var box=ed.querySelector('.phx-crop'),cv=box.querySelector('canvas'),g=cv.getContext('2d'),FW=0,FH=0,s=1;
      function ratio(){return PHF.filter(function(f){return f[0]===fmt})[0][2]}
      function layout(){var aw=Math.min(ed.clientWidth||520,560),r=ratio(),mh=Math.max(240,Math.min(460,window.innerHeight*.5));FW=aw;FH=aw/r;if(FH>mh){FH=mh;FW=FH*r}
        box.style.width=Math.round(FW)+'px';box.style.height=Math.round(FH)+'px';var dpr=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(FW*dpr);cv.height=Math.round(FH*dpr);draw()}
      function clamp(){s=Math.max(FW/x.w,FH/x.h)*zoom;var hw=FW/s/2,hh=FH/s/2;cx=Math.max(hw,Math.min(x.w-hw,cx));cy=Math.max(hh,Math.min(x.h-hh,cy))}
      function draw(){clamp();var k=cv.width/FW;g.setTransform(k,0,0,k,0,0);g.clearRect(0,0,FW,FH);g.imageSmoothingQuality='high';g.drawImage(x.im,FW/2-cx*s,FH/2-cy*s,x.w*s,x.h*s)}
      requestAnimationFrame(layout);
      var ptr=new Map(),last=null,pd=0;
      box.addEventListener('pointerdown',function(e){box.setPointerCapture(e.pointerId);ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});last={x:e.clientX,y:e.clientY};if(ptr.size===2){var a=Array.from(ptr.values());pd=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y)}});
      box.addEventListener('pointermove',function(e){if(!ptr.has(e.pointerId))return;ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});
        if(ptr.size>=2){var a=Array.from(ptr.values()),d=Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y);if(pd){zoom=Math.max(1,Math.min(3,zoom*d/pd));zr.value=zoom}pd=d;draw();return}
        cx-=(e.clientX-last.x)/s;cy-=(e.clientY-last.y)/s;last={x:e.clientX,y:e.clientY};draw()});
      function upp(e){ptr.delete(e.pointerId);pd=0;var a=Array.from(ptr.values());last=a[0]||null}
      box.addEventListener('pointerup',upp);box.addEventListener('pointercancel',upp);
      box.addEventListener('wheel',function(e){e.preventDefault();zoom=Math.max(1,Math.min(3,zoom*(e.deltaY<0?1.08:1/1.08)));zr.value=zoom;draw()},{passive:false});
      var zr=ed.querySelector('[data-phz]');zr.oninput=function(){zoom=+zr.value;draw()};
      P.$$('[data-phf]',ed).forEach(function(bt){bt.onclick=function(){fmt=bt.getAttribute('data-phf');P.$$('[data-phf]',ed).forEach(function(y){y.setAttribute('aria-pressed',y===bt);y.setAttribute('aria-selected',y===bt)});layout()}});
      var mk=ed.querySelector('[data-id="phmain"]');if(mk)mk.addEventListener('click',function(){setTimeout(function(){main=mk.getAttribute('aria-checked')==='true'},0)});
      ed.querySelector('[data-phre]').onclick=function(){if(x.u)URL.revokeObjectURL(x.u);ed.hidden=true;ed.innerHTML='';pick.hidden=false};
      var ok=ed.querySelector('[data-phok]');
      ok.onclick=function(){if(ok.disabled)return;ok.disabled=true;ok.innerHTML='<span class="phx-spin"></span>Compression…';clamp();
        var sw=FW/s,shh=FH/s,sx=cx-sw/2,sy=cy-shh/2,note=ed.querySelector('[data-phnote]').value.trim();
        phEncode(x.im,sx,sy,sw,shh,1600,400*1024).then(function(full){if(!full)throw new Error('encode');
          return phEncode(x.im,sx,sy,sw,shh,480,60*1024).then(function(th){return {full:full,th:th}})}).then(function(r){
          if(x.u)URL.revokeObjectURL(x.u);
          return PHS().add(h.id,{id:phId(),blob:r.full.blob,thumb:r.th&&r.th.blob,w:r.full.w,h:r.full.h,kind:kind,zone:zone,care:o.care||null,note:note,author:phAuthor()})}).then(function(p){
          if(main||kind==='profil'&&!h.photo)phSetMain(h,p.id);
          sh.close();P.toast(p.pending?'Photo enregistrée sur l’appareil, envoi au retour du réseau':'Photo ajoutée à la fiche de '+E(h.name.split(' ')[0]),{icon:p.pending?'wifi':'image'});
          if(o.done)o.done(p);else P.rerender()},function(e){ok.disabled=false;ok.innerHTML=ICON('check','sm')+'Enregistrer la photo';P.toast(e&&e.message&&e.message.length>12?e.message:'La photo n’a pas pu être enregistrée. Réessayez.',{icon:'alert',ms:5200})})};
    }
  }});
  return sh}

/* ---------- Visionneuse ---------- */
function phView(h,p,list,done){var i=list.indexOf(p);
  var sh=P.sheet({title:PHL[p.kind]||'Photo',icon:'image',wide:true,body:function(b){
    function draw(){p=list[i];var isMain=h.photo===p.id;
      b.innerHTML='<div class="phx-big"><img src="'+E(p.url||p.thumb)+'" alt="'+E(PHL[p.kind]+' de '+h.name)+'">'+(list.length>1?'<button class="phx-nav l" data-phv="-1" title="Photo précédente">'+ICON('left')+'</button><button class="phx-nav r" data-phv="1" title="Photo suivante">'+ICON('right')+'</button>':'')+'</div>'+
        '<div class="phx-meta"><div class="grow"><div class="hrow wrap" style="--g:6px">'+U.chip(PHL[p.kind]||'Photo','line')+(p.zone&&p.kind==='soin'?U.chip(zoneLabel(h,p.zone),'warn'):'')+(isMain?U.chip('Photo principale','acc',true):'')+(p.pending?U.chip('En attente d’envoi','warn',true):'')+'</div>'+
        (p.note?'<p class="s" style="margin-top:8px">'+E(p.note)+'</p>':'')+'<div class="xs mut" style="margin-top:6px">'+F.dateY(String(p.date||'').slice(0,10))+' à '+new Date(p.date).toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit'}).replace(':',' h ')+(p.author?' · par '+E(p.author):'')+'</div></div>'+
        '<span class="xs mut num">'+(i+1)+' / '+list.length+'</span></div>'+
        '<div class="phx-va">'+(p.kind==='profil'&&!isMain?'<button class="btn" data-phmain>'+ICON('star','sm')+'Définir comme photo principale</button>':'')+
        '<button class="btn ghost danger" data-phdel>'+ICON('trash','sm')+'Supprimer</button></div>';
      P.$$('[data-phv]',b).forEach(function(x){x.onclick=function(){i=(i+(+x.getAttribute('data-phv'))+list.length)%list.length;draw()}});
      var mb=b.querySelector('[data-phmain]');if(mb)mb.onclick=function(){phSetMain(h,p.id);draw();P.toast('Photo principale de '+E(h.name.split(' ')[0])+' changée',{icon:'star'});if(done)done()};
      var db=b.querySelector('[data-phdel]');db.onclick=function(){
        if(!db.classList.contains('cf')){db.classList.add('cf');db.classList.remove('ghost');db.innerHTML=ICON('trash','sm')+'Confirmer la suppression';var t=setTimeout(function(){if(db.isConnected){db.classList.remove('cf');db.classList.add('ghost');db.innerHTML=ICON('trash','sm')+'Supprimer'}},4000);return}
        db.disabled=true;PHS().remove(h.id,p.id).then(function(){if(h.photo===p.id){var nx=list.filter(function(q){return q.id!==p.id&&q.kind==='profil'})[0];phSetMain(h,nx?nx.id:null)}
          sh.close();P.toast('Photo supprimée',{icon:'trash'});if(done)done()},function(e){db.disabled=false;P.toast(e&&e.message||'Suppression impossible pour l’instant',{icon:'alert'})})}}
    draw()}});
  return sh}
function zoneLabel(h,z){try{var Z=zones(h);return Z[z]?Z[z].l:z}catch(e){return z}}

/* ---------- Galerie (onglet Photos de la fiche et feuille de zone) ---------- */
var PHG={f:'all'};
function phGallery(host,h,o){o=o||{};host.innerHTML='<div class="phx-gal"><div class="phx-sk"></div><div class="phx-sk"></div><div class="phx-sk"></div></div>';
  function render(list){if(!host.isConnected)return;var all=list;
    if(o.zone)list=list.filter(function(p){return p.zone===o.zone});
    else if(PHG.f!=='all')list=list.filter(function(p){return p.kind===PHG.f});
    var cnt={all:all.length};all.forEach(function(p){cnt[p.kind]=(cnt[p.kind]||0)+1});
    host.innerHTML=(o.zone?'':'<div class="hrow sp wrap phx-gh"><div class="scroll-x">'+U.seg([['all','Toutes ('+cnt.all+')'],['profil','Profil'+(cnt.profil?' ('+cnt.profil+')':'')],['marques','Marques'+(cnt.marques?' ('+cnt.marques+')':'')],['soin','Soins'+(cnt.soin?' ('+cnt.soin+')':'')]],PHG.f,'data-phgf')+'</div>'+
      '<button class="btn pri" data-phadd>'+ICON('photo','sm')+'Prendre une photo</button></div>')+
      (list.length?'<div class="phx-gal rise">'+list.map(function(p,k){return '<button class="phx-th" data-phi="'+k+'" title="Agrandir"><img src="'+E(p.thumb||p.url)+'" alt="'+E(PHL[p.kind]||'Photo')+'" loading="lazy">'+
        (h.photo===p.id?'<span class="phx-b acc">'+ICON('star','sm')+'Principale</span>':p.pending?'':'')+(p.pending?'<span class="phx-b warn">'+ICON('wifi','sm')+'En attente d’envoi</span>':'')+
        '<span class="phx-cap"><b>'+F.date(String(p.date||'').slice(0,10))+'</b>'+(p.author?'<span class="ellip">'+E(p.author)+'</span>':'')+'</span></button>'}).join('')+'</div>'
       :'<div class="phx-empty">'+(window.ILLU&&!o.zone?ILLU.cheval({size:88}):'')+'<b>'+(o.zone?'Aucune photo de cette zone':PHG.f==='all'?'Aucune photo de '+E(h.name.split(' ')[0])+' pour l’instant':'Aucune photo dans cette catégorie')+'</b><span class="s mut">'+(o.zone?'Une photo datée aide le vétérinaire à suivre l’évolution.':'Une photo de profil aide toute l’équipe à reconnaître le cheval au pré.')+'</span>'+(o.zone?'':'<button class="btn pri" data-phadd>'+ICON('photo','sm')+'Prendre une photo</button>')+'</div>');
    P.$$('[data-phgf]',host).forEach(function(x){x.onclick=function(){PHG.f=x.getAttribute('data-phgf');render(all)}});
    P.$$('[data-phadd]',host).forEach(function(x){x.onclick=function(){phCapture(h,{kind:PHG.f==='marques'?'marques':'profil',done:function(){if(o.after)o.after();else load()}})}});
    P.$$('[data-phi]',host).forEach(function(x){x.onclick=function(){phView(h,list[+x.getAttribute('data-phi')],list,function(){if(o.after)o.after();else load()})}});
    if(P.animate)P.animate(host)}
  function load(){PHS().list(h.id).then(render,function(e){if(!host.isConnected)return;host.innerHTML='<div class="phx-empty"><b>Photos indisponibles</b><span class="s mut">'+E(e&&e.message||'Réessayez dans un instant.')+'</span></div>'})}
  load();return load}


/* le bouton photo d'une carte ne doit pas ouvrir la fiche */
document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-phcap]');if(!b)return;e.preventDefault();e.stopPropagation();var h=D.horse(b.getAttribute('data-phcap'));if(h)phCapture(h,{done:function(){P.rerender()}})},true);
P.actions.push({role:'gerant',label:'Prendre un cheval en photo',icon:'camera',run:function(){var st=P.state||{},h=st.route==='cheval'&&st.params&&D.horse(st.params.id)||D.horses[0];if(h)phCapture(h,{});else P.toast('Ajoutez d’abord un cheval',{icon:'horse'})}});
P.css(`
.hx-por.ph{background:var(--surface-2)}
.hx-por.ph img{width:100%;height:100%;object-fit:cover;display:block}
.hx-top .hx-por.ph{inset:0;width:auto;height:auto;right:0;bottom:0;transform:none!important}
.hx-top .hx-por.ph::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,18,44,.42),rgba(8,18,44,0) 46%,rgba(8,18,44,0) 62%,rgba(8,18,44,.38))}
.hx-c .hx-top:has(.hx-por.ph){color:#fff}
.hx-c .hx-top:has(.hx-por.ph) .hx-bx{text-shadow:0 1px 8px rgba(0,0,0,.35)}
.hx-cam{position:absolute;top:12px;right:60px;width:40px;height:40px;border-radius:13px;display:grid;place-items:center;background:color-mix(in srgb,var(--surface) 78%,transparent);color:var(--pi);z-index:2;opacity:0;transition:opacity var(--t-1),background var(--t-1)}
.hx-c:hover .hx-cam,.hx-cam:focus-visible{opacity:1}.hx-cam:hover{background:var(--surface)}
@media (hover:none){.hx-cam{opacity:1}}
.app.mobile .hx-cam{opacity:1}
.fc-nm{display:flex;gap:16px;align-items:center;min-width:0}
.fc-nmt{min-width:0;flex:1}
.app.mobile .fc-nmt>.mut{margin-top:0!important}
.fc-ph{flex:none;width:84px;height:84px;border-radius:22px;overflow:hidden;display:grid;place-items:center;background:var(--hz-bg);color:var(--hz-ink);transition:transform var(--t-2) var(--e-spring)}
.fc-ph:hover{transform:scale(1.04)}
.fc-ph img{width:100%;height:100%;object-fit:cover;display:block}
.fc-ph.none{border:2px dashed color-mix(in srgb,var(--hz-ink) 35%,transparent);display:flex;flex-direction:column;justify-content:center;gap:2px;font-size:13px;font-weight:700}
@container main (max-width:760px){.fc-ph{width:64px;height:64px;border-radius:18px}.fc-ph.none span{display:none}}
.phx-hero{display:flex;gap:12px;align-items:center;padding:12px 14px;border-radius:var(--r-md);background:var(--hz-bg);color:var(--hz-ink)}
.phx-hero .xs{color:inherit;opacity:.85}
.phx-opts{display:grid;gap:10px}
.phx-opt{display:flex;align-items:center;gap:14px;padding:16px 18px;border-radius:18px;border:1px solid var(--line);background:var(--surface);cursor:pointer;text-align:left;width:100%;transition:border-color var(--t-1),background var(--t-1)}
.phx-opt:hover{border-color:var(--acc);background:var(--acc-bg)}
.phx-opt svg.i{width:26px;height:26px;flex:none;color:var(--acc)}
.phx-opt span{display:flex;flex-direction:column;gap:2px}.phx-opt b{font-size:16px}.phx-opt small{font-size:13.5px;color:var(--mut)}
.phx-opt.pri{background:var(--acc);border-color:var(--acc);color:var(--on-acc)}.phx-opt.pri svg.i,.phx-opt.pri small{color:var(--on-acc)}.phx-opt.pri small{opacity:.85}
.phx-opt.pri:hover{background:var(--acc-deep)}
.phx-opt:focus-within{outline:2px solid var(--acc);outline-offset:2px}
.phx-crop{position:relative;margin:0 auto;border-radius:18px;overflow:hidden;background:var(--surface-2);touch-action:none;cursor:grab;user-select:none}
.phx-crop:active{cursor:grabbing}
.phx-crop canvas{width:100%;height:100%;display:block}
.phx-grid{position:absolute;inset:0;pointer-events:none;box-shadow:inset 0 0 0 2px rgba(255,255,255,.75);border-radius:inherit}
.phx-grid i{position:absolute;background:rgba(255,255,255,.4)}
.phx-grid i:nth-child(1),.phx-grid i:nth-child(2){top:0;bottom:0;width:1px}.phx-grid i:nth-child(1){left:33.33%}.phx-grid i:nth-child(2){left:66.66%}
.phx-grid i:nth-child(3),.phx-grid i:nth-child(4){left:0;right:0;height:1px}.phx-grid i:nth-child(3){top:33.33%}.phx-grid i:nth-child(4){top:66.66%}
.phx-tools{display:flex;gap:12px;align-items:center;justify-content:space-between;flex-wrap:wrap;margin:14px 0 12px}
.phx-zoom{display:flex;align-items:center;gap:8px;color:var(--mut);flex:1 1 160px;max-width:260px}
.phx-zoom input{flex:1;accent-color:var(--acc)}
.phx-main{display:flex;align-items:center;gap:10px;margin:4px 0 12px;font-weight:600;cursor:pointer}
.phx-foot{display:flex;gap:10px;justify-content:space-between;flex-wrap:wrap;margin-top:14px}
.phx-foot .btn.pri{flex:1 1 220px;justify-content:center}
.phx-spin{width:16px;height:16px;border-radius:50%;border:2px solid currentColor;border-right-color:transparent;animation:phxSp .8s linear infinite}
@keyframes phxSp{to{transform:rotate(360deg)}}
.phx-cam{position:relative;border-radius:18px;overflow:hidden;background:#0b1220;aspect-ratio:4/3}
.phx-cam video{width:100%;height:100%;object-fit:cover;display:block}
.phx-guide{position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;pointer-events:none}
.phx-gf{width:78%;aspect-ratio:4/3;border:2px dashed rgba(255,255,255,.8);border-radius:22px;display:grid;place-items:center;overflow:hidden}
.phx-gf .illu{width:86%;height:86%;opacity:.32;filter:grayscale(1) brightness(3)}
.phx-guide span{font-weight:700;color:#fff;background:rgba(8,18,44,.55);padding:6px 12px;border-radius:999px;font-size:14px}
.phx-gh{margin-bottom:14px;gap:10px}
.phx-gal{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:12px}
.phx-sk{aspect-ratio:1;border-radius:16px;background:var(--surface-2);animation:phxPulse 1.2s ease-in-out infinite alternate}
@keyframes phxPulse{to{opacity:.5}}
.phx-th{position:relative;aspect-ratio:1;border-radius:16px;overflow:hidden;background:var(--surface-2);display:block;padding:0;transition:transform var(--t-2) var(--e-out)}
.phx-th:hover{transform:translateY(-2px)}
.phx-th img{width:100%;height:100%;object-fit:cover;display:block}
.phx-th .phx-cap{position:absolute;left:0;right:0;bottom:0;padding:22px 10px 8px;display:flex;flex-direction:column;align-items:flex-start;text-align:left;color:#fff;background:linear-gradient(180deg,rgba(8,18,44,0),rgba(8,18,44,.72));font-size:13px;line-height:1.25}
.phx-th .phx-cap b{font-size:13.5px}.phx-th .phx-cap span{max-width:100%;opacity:.9}
.phx-b{position:absolute;top:8px;left:8px;display:inline-flex;align-items:center;gap:4px;font-size:13px;font-weight:700;padding:3px 8px 3px 6px;border-radius:999px;background:var(--surface);color:var(--acc-deep)}
.phx-b svg.i{width:15px;height:15px}
.phx-b.warn{background:var(--warn-pale);color:var(--ink)}
.phx-b.acc+.phx-b.warn{top:38px}
.phx-empty{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:22px 12px}
.phx-empty .btn{margin-top:6px}
.phx-big{position:relative;border-radius:18px;overflow:hidden;background:var(--surface-2);display:grid;place-items:center;max-height:62vh}
.phx-big img{max-width:100%;max-height:62vh;display:block;object-fit:contain}
.phx-nav{position:absolute;top:50%;transform:translateY(-50%);width:44px;height:44px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--surface) 85%,transparent);color:var(--ink)}
.phx-nav.l{left:10px}.phx-nav.r{right:10px}
.phx-meta{display:flex;gap:12px;align-items:flex-start;margin:14px 0}
.phx-va{display:flex;gap:10px;flex-wrap:wrap;justify-content:space-between}
.phx-va .danger{color:var(--bad)}
.phx-va .danger.cf{background:var(--bad);border-color:var(--bad);color:#fff}
@container main (max-width:520px){.phx-gal{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.phx-gh .btn{width:100%;justify-content:center}}
@media (prefers-reduced-motion:reduce){.phx-sk,.phx-spin{animation:none}}
`);

})();
