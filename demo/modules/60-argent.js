/* Vue gérant · Argent et équipe : facturation, comptabilité, équipe et RH (lot E) */
(function(){
var D=P.D,F=P.fmt,U=P.ui,C=P.chart,E=F.esc;
function iso(o){return D.iso(D.day(o))}

/* =====================================================================
   Données propres au lot (ajoutées sans toucher à core/)
   ===================================================================== */
var F3=D.members.filter(function(m){return m.forfait==='f3'}),F12=D.members.filter(function(m){return m.forfait==='f1'||m.forfait==='f2'});
D.creditNotes=D.creditNotes||[
 {id:'AV-2026-0014',member:F12[4].id,label:'Avoir, stage de la Toussaint (2 jours annulés)',amount:-130,date:iso(-11),due:iso(-11),status:'avoir',method:'Déduit de la prochaine facture',ref:'F-2026-1121'},
 {id:'AV-2026-0013',member:F3[7].id,label:'Avoir, carte 10 séances (3 séances reportées, certificat médical)',amount:-87,date:iso(-19),due:iso(-19),status:'avoir',method:'Remboursé par virement',ref:'F-2026-1117'},
 {id:'AV-2026-0012',member:'m047',label:'Avoir, pension d’octobre (départ en concours 6 jours)',amount:-104,date:iso(-27),due:iso(-27),status:'avoir',method:'Déduit de la prochaine facture',ref:'F-2026-1109'}];
D.schedules=D.schedules||[
 {id:'e1',member:F12[1].id,label:'Forfait annuel 2 h par semaine',total:1390,n:10,paid:3,next:'2026-12-05',mode:'Prélèvement SEPA',state:'ok'},
 {id:'e2',member:F12[6].id,label:'Forfait annuel 1 h par semaine',total:780,n:10,paid:3,next:'2026-12-05',mode:'Prélèvement SEPA',state:'ok'},
 {id:'e3',member:F12[9].id,label:'Forfait annuel 1 h par semaine',total:780,n:3,paid:1,next:'2026-12-01',mode:'Carte bancaire',state:'ok'},
 {id:'e4',member:F12[14].id,label:'Forfait annuel 2 h par semaine',total:1390,n:10,paid:2,next:'2026-11-20',mode:'Prélèvement SEPA',state:'rejet'},
 {id:'e5',member:F12[22].id,label:'Stage de Noël, 5 jours',total:325,n:3,paid:1,next:'2026-12-10',mode:'Chèques différés',state:'ok'},
 {id:'e6',member:'m052',label:'Pension, arriéré d’octobre (plan d’apurement)',total:640,n:4,paid:2,next:'2026-11-30',mode:'Virement',state:'ok'}];
D.cards=D.cards||F3.slice(0,7).map(function(m,i){var left=[7,2,9,1,5,0,4][i];return {id:'k'+i,member:m.id,label:i===4?'Carte 5 cours particuliers':'Carte 10 séances',total:i===4?5:10,left:Math.min(left,i===4?5:10),until:['2027-06-30','2027-01-31','2027-08-31','2026-12-20','2027-03-31','2026-11-30','2027-06-30'][i],last:iso(-[2,6,1,4,9,13,3][i])}});
D.cheques=D.cheques||[
 {id:'q1',member:F12[3].id,bank:'Crédit Agricole',num:'4410233',amount:290,cash:iso(0)},
 {id:'q2',member:F3[2].id,bank:'La Banque Postale',num:'8830127',amount:145,cash:iso(0)},
 {id:'q3',member:F12[11].id,bank:'BNP Paribas',num:'2207418',amount:260,cash:iso(0)},
 {id:'q4',member:F12[11].id,bank:'BNP Paribas',num:'2207419',amount:260,cash:iso(18),later:true},
 {id:'q5',member:F3[9].id,bank:'Caisse d’Épargne',num:'0915562',amount:95,cash:iso(0)},
 {id:'q6',member:'m023',bank:'Société Générale',num:'5501984',amount:520,cash:iso(0)}];
D.bankSuggest=D.bankSuggest||{
 'SARL FOURRAGES DU HUREPOIX':{doc:'Facture FH-2611 du 12 novembre',src:'Reçue en facture électronique',conf:99,acc:'601200 Fourrages et litière',icon:'doc'},
 'SELLERIE DU PARC · facture 2211':{doc:'Facture 2211 du 14 novembre',src:'Photographiée par Nadia, lue par l’assistant',conf:96,acc:'606300 Petit équipement',icon:'scan'},
 'REMISE CHÈQUES ANCV':{doc:'Bordereau ANCV n° 2026-11',src:'5 règlements de forfaits regroupés',conf:100,acc:'411000 Clients',icon:'ticket'}};
D.receipts=D.receipts||[
 {id:'j1',who:'Sellerie du Parc',label:'Licols et longes, 6 pièces',amount:412.5,vat:20,date:iso(-3),by:'s09',src:'Photo',state:'À rapprocher'},
 {id:'j2',who:'Fourrages du Hurepoix',label:'Foin de prairie, 48 balles rondes',amount:3840,vat:10,date:iso(-5),by:null,src:'Facture électronique',state:'À rapprocher'},
 {id:'j3',who:'Dr Leclerc, vétérinaire',label:'Visite d’écurie et vaccins',amount:268,vat:20,date:iso(-2),by:'s01',src:'PDF par e-mail',state:'Rapproché'},
 {id:'j4',who:'EDF Pro',label:'Électricité, octobre',amount:638.4,vat:20,date:iso(-4),by:null,src:'Facture électronique',state:'Rapproché'},
 {id:'j5',who:'Benoît Gautier, maréchal',label:'Ferrures et parages, 12 chevaux',amount:960,vat:20,date:iso(-6),by:'s05',src:'Photo',state:'Rapproché'},
 {id:'j6',who:'Coopérative Agralys',label:'Granulés floconnés, 40 sacs',amount:676,vat:10,date:iso(-9),by:'s06',src:'Photo',state:'Rapproché'},
 {id:'j7',who:'Litière Pro',label:'Copeaux dépoussiérés, 60 sacs',amount:690,vat:20,date:iso(-12),by:null,src:'Facture électronique',state:'Rapproché'}];
/* Fiches RH : contrat, classification, diplômes et échéances, compteurs */
D.hr=D.hr||{
 s01:{since:'2014-03-01',cls:'Dirigeante, hors grille',gross:0,cp:[25,12],rec:0,ot:0,dip:[['DEJEPS perfectionnement sportif','ok','Carte professionnelle valable jusqu’au 8 mars 2029'],['PSC1','ok','Recyclage fait le 14 février 2026']]},
 s02:{since:'2019-09-02',cls:'Enseignant, coefficient 150',gross:2180,cp:[25,9],rec:3.5,ot:4.5,dip:[['BPJEPS activités équestres','warn','Carte professionnelle à renouveler avant le 12 janvier 2027'],['PSC1','ok','Recyclage fait le 14 février 2026']]},
 s03:{since:'2021-01-11',cls:'Enseignante, coefficient 150',gross:2140,cp:[25,14],rec:0,ot:6,dip:[['BPJEPS activités équestres','ok','Carte professionnelle valable jusqu’au 2 septembre 2028'],['CQP animateur soigneur assistant','ok','Acquis en 2018'],['PSC1','bad','Recyclage dépassé depuis le 3 novembre 2026']]},
 s04:{since:'2017-04-03',cls:'Enseignant responsable pédagogique, coefficient 167',gross:2090,cp:[25,11],rec:8,ot:2.5,dip:[['DEJEPS CSO','ok','Carte professionnelle valable jusqu’au 20 juin 2030'],['CAPTAV, transport d’animaux vivants','ok','Sans limite de validité'],['Permis C','ok','Visite médicale valable jusqu’en mai 2029'],['PSC1','ok','Recyclage fait le 14 février 2026']]},
 s05:{since:'2016-06-13',cls:'Soigneur responsable d’écurie, coefficient 121',gross:2210,cp:[25,6],rec:7,ot:9.5,dip:[['CAPA soigneur d’équidés','ok','Acquis en 2012'],['PSC1','ok','Recyclage fait le 14 février 2026'],['Visite médicale du travail','acc','Rendez-vous le 9 décembre 2026 à 9 h']]},
 s06:{since:'2022-08-29',cls:'Soigneuse, coefficient 109',gross:1905,cp:[25,15],rec:0,ot:1,dip:[['Bac pro conduite et gestion de l’entreprise hippique','ok','Acquis en 2022'],['PSC1','ok','Recyclage fait le 14 février 2026']]},
 s07:{since:'2026-09-01',until:'2027-02-28',cls:'Agent d’entretien, coefficient 103',gross:1262,cp:[6.5,0],rec:0,ot:0,dip:[['Autorisation de conduite du tracteur','ok','Délivrée le 4 septembre 2026'],['PSC1','warn','Jamais passé : session proposée le 12 décembre']]},
 s08:{since:'2026-09-01',until:'2027-08-31',cls:'Apprentie, 2e année',gross:1098,cp:[6.5,2],rec:0,ot:0,dip:[['BPJEPS activités équestres','acc','En formation au CFA de Rambouillet, examen en juin 2027'],['Galop 7','ok','Acquis en 2024'],['PSC1','ok','Passé le 20 octobre 2026']]},
 s09:{since:'2020-02-17',cls:'Secrétaire d’accueil, coefficient 111',gross:1540,cp:[25,10],rec:1.5,ot:0,dip:[['PSC1','ok','Recyclage fait le 14 février 2026']]}};
/* Planning de la semaine du 16 au 22 novembre (lundi à dimanche) et astreintes de nuit */
D.shifts=D.shifts||{s01:['J','J','J','J','J','M','R'],s02:['S','S','J','S','R','M','M'],s03:['S','S','J','S','S','J','R'],s04:['R','J','S','R','S','S','K'],s05:['C','C','C','C','C','M','R'],s06:['S','J','R','J','R','C','M'],s07:['M','J','M','R','R','R','R'],s08:['F','F','J','J','R','M','R'],s09:['R','J','J','R','M','M','R']};
D.nights=D.nights||['s05','s06','s05','s01','s05','s01','s01'];
D.leaves=D.leaves||[
 {id:'a1',who:'s03',kind:'Congés payés',from:'2026-12-24',to:'2026-12-28',days:3,state:'attente',asked:'hier à 18 h 12',impact:'ok',note:'Stage de Noël couvert par Hugo et Thomas. 2 enseignants présents sur 3.'},
 {id:'a2',who:'s05',kind:'Récupération',from:'2026-11-27',to:'2026-11-27',days:1,state:'attente',asked:'lundi à 7 h 05',impact:'warn',note:'Lucie est de repos ce jour-là : personne à l’écurie le matin. Le samedi 28 est couvert.'},
 {id:'a3',who:'s04',kind:'Congés payés',from:'2026-12-21',to:'2026-12-23',days:3,state:'validé',asked:'le 2 novembre'},
 {id:'a4',who:'s07',kind:'Arrêt maladie',from:'2026-11-12',to:'2026-11-13',days:2,state:'validé',asked:'arrêt reçu le 12 novembre'},
 {id:'a5',who:'s09',kind:'Congés payés',from:'2026-12-28',to:'2027-01-02',days:5,state:'validé',asked:'le 20 octobre'},
 {id:'a6',who:'s08',kind:'Formation au CFA',from:'2026-11-23',to:'2026-11-24',days:2,state:'validé',asked:'calendrier d’alternance'}];
D.reviews=D.reviews||[['s02','2025-12-04','2026-12-03','planifié'],['s03','2025-12-09','2026-12-08','planifié'],['s04','2025-11-20','2026-11-19','planifié'],['s05','2025-12-11',null,'à planifier'],['s06','2026-01-15',null,'à planifier'],['s09','2026-02-05','2027-02-04','planifié'],['s07',null,'2026-12-01','bilan de période'],['s08','2026-10-06',null,'fait']];

/* =====================================================================
   Styles
   ===================================================================== */
P.css(`
/* ---- partagé par les trois écrans ---- */
.ar-k4{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.ar-c{opacity:.55;font-size:.86em}
.ar-tabs{margin:20px 0 16px}
.ar-tb{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;min-width:0}
.ar-tb .search{flex:1 1 220px;max-width:340px}
.ar-tb .seg{flex:0 1 auto}
.ar-end{margin-left:auto;display:flex;gap:8px;align-items:center}
.ar-cta{display:none}
.ar-sh{container:arsh/inline-size;display:flex;flex-direction:column;gap:16px}
.ar-foot{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end;width:100%}
.ar-dl{display:grid;grid-template-columns:auto minmax(0,1fr);gap:9px 16px;font-size:13px;margin:0}
.ar-dl dt{color:var(--mut)}
.ar-dl dd{margin:0;text-align:right;font-weight:600;min-width:0}
.ar-sec{display:flex;flex-direction:column;gap:10px}
.ar-sec>.eyebrow{display:flex;align-items:center;justify-content:space-between;gap:8px}
.ar-box{border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line);background:var(--surface)}
.ar-soft{border-radius:var(--r-md);background:var(--surface-2);padding:12px 14px}
.ar-g2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.ar-g3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.ar-cols{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,1fr);gap:14px;align-items:start}
.ar-stat{display:flex;flex-direction:column;gap:2px;min-width:0}
.ar-stat b{font:700 20px/1.15 var(--f-display);letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.ar-stat>span{font-size:12px;color:var(--mut)}
.ar-pay{min-width:190px;transition:background var(--t-2),transform var(--t-1) var(--e-out)}
.ar-pay.done{background:var(--ok)}
.ar-spin{width:16px;height:16px;border-radius:50%;border:2px solid color-mix(in srgb,currentColor 30%,transparent);border-top-color:currentColor;animation:arSpin .7s linear infinite;flex:none}
@keyframes arSpin{to{transform:rotate(360deg)}}
.ar-tick{width:20px;height:20px;border-radius:50%;background:var(--ok);display:inline-grid;place-items:center;flex:none}
.ar-tick svg{width:12px;height:12px;fill:none;stroke:var(--surface);stroke-width:3;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:22;stroke-dashoffset:22;animation:arDraw .32s var(--e-out) .08s forwards}
@keyframes arDraw{to{stroke-dashoffset:0}}
.ar-done{display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;padding:26px 16px}
.ar-done .orb{width:64px;height:64px;border-radius:50%;background:var(--ok-pale);display:grid;place-items:center;position:relative;animation:pop var(--t-4) var(--e-spring) both}
.ar-done .orb .ar-tick{width:36px;height:36px}.ar-done .orb .ar-tick svg{width:20px;height:20px}
.ar-done .orb .strass{position:absolute;right:-4px;top:-2px;width:14px;height:14px}
.ar-done h3{font-size:21px}
.ar-tbl td .s2{display:block;font-size:12px;color:var(--mut);max-width:300px;overflow:hidden;text-overflow:ellipsis}
.ar-who{display:flex;align-items:center;gap:10px;min-width:0}
.ar-pips{display:flex;gap:3px}
.ar-pips i{width:14px;height:6px;border-radius:3px;background:var(--bg-2)}
.ar-pips i.on{background:var(--acc)}
.ar-pips i.bad{background:var(--bad)}
.ar-range{width:100%;accent-color:var(--acc);height:24px;margin:0}
.ar-lk{color:var(--acc);font-weight:600;font-size:12.5px;display:inline-flex;align-items:center;gap:4px}
.ar-m{display:none}
.tbl td.ar-wr{white-space:normal;min-width:120px;line-height:1.3}
@container main (max-width:1080px){.ar-h1{display:none}.ar-cols{grid-template-columns:minmax(0,1fr)}}
@container main (max-width:860px){.ar-k4{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}}
.ar-ps{display:none}
@container main (max-width:760px){.ar-ps{display:inline}}
@container main (max-width:620px){.ar-t{display:none}.ar-m{display:block}.ar-g3{grid-template-columns:minmax(0,1fr)}.ar-g3.ar-k3m{grid-template-columns:repeat(3,minmax(0,1fr))}.ar-tbl .tbl th,.ar-tbl .tbl td{padding-left:7px;padding-right:7px}.ar-tbl .tbl th:first-child,.ar-tbl .tbl td:first-child{padding-left:14px}.ar-tbl .tbl th:last-child,.ar-tbl .tbl td:last-child{padding-right:14px}.ar-chw{flex-wrap:wrap;gap:8px}.ar-k3m .ar-stat b{font-size:16px}.ar-k3m .ar-stat>span{font-size:11px;line-height:1.3}}
@container main (max-width:520px){
 .ar-k4 .kpi{padding:12px 12px 11px;gap:5px}.ar-k4 .kpi .val{font-size:21px}.ar-k4 .kpi svg.spark{display:none}.ar-k4 .kpi .lab{font-size:11.5px}.ar-k4 .kpi .del{font-size:11.5px}
 .ar-tabs{margin:14px -16px 12px;padding:0 12px}
 .ar-g2{grid-template-columns:minmax(0,1fr)}
 .ar-tb .search{max-width:none;flex-basis:100%}
 .ar-cta{display:flex;gap:8px;position:sticky;bottom:6px;margin-top:18px;z-index:4;padding:8px;border-radius:var(--r-lg);background:color-mix(in srgb,var(--surface) 88%,transparent);backdrop-filter:blur(14px);box-shadow:inset 0 0 0 1px var(--line),var(--shadow-2)}
 .ar-cta .btn{height:46px;flex:1;font-size:14.5px;border-radius:var(--r-md)}.ar-cta .btn.icon{flex:none;width:46px}
 .ar-hd .acts{display:none}
}
@container arsh (max-width:440px){.ar-hx{display:none}.ar-g2.shx{grid-template-columns:minmax(0,1fr)}.ar-g3.shx{grid-template-columns:minmax(0,1fr)}.ar-g3.shx.ar-k3{grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}.ar-k3 .ar-stat b{font-size:17px}.ar-k3 .ar-stat>span{font-size:11px;line-height:1.3}}
.sheet.bottom .ar-foot .btn{height:44px}
.sheet.bottom .ar-foot .btn.pri{flex:1}

/* ---- facturation ---- */
.fa-hero{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:28px;padding:20px 22px;align-items:center;overflow:hidden;margin-bottom:14px}
.fa-hero::before{content:"";position:absolute;inset:0;border-radius:inherit;background:radial-gradient(560px 240px at 0 0,color-mix(in srgb,var(--acc) 10%,transparent),transparent 70%);pointer-events:none}
.fa-hero>*{position:relative;min-width:0}
.fa-hero h2{font-size:23px;line-height:1.15;letter-spacing:-.03em;margin:8px 0 6px}
.fa-hero.ok::before{background:radial-gradient(560px 240px at 0 0,color-mix(in srgb,var(--ok) 12%,transparent),transparent 70%)}
.fa-split{display:flex;height:10px;border-radius:99px;overflow:hidden;gap:2px}
.fa-split i{display:block;height:100%;background:var(--c);flex:var(--v) 0 0;min-width:5px;transform-origin:left;animation:faGrow .8s var(--e-out) both;animation-delay:calc(var(--i)*90ms)}
@keyframes faGrow{from{transform:scaleX(0)}}
.fa-cats{display:grid;gap:7px;margin-top:12px}
.fa-cat{display:flex;align-items:center;gap:8px;font-size:12.5px;min-width:0}
.fa-cat i{width:8px;height:8px;border-radius:2px;background:var(--c);flex:none}
.fa-cat .n{color:var(--mut)}
.fa-cat b{margin-left:auto;font-variant-numeric:tabular-nums}
.fa-mi{display:flex;align-items:center;gap:12px;padding:12px 14px;width:100%;text-align:left;position:relative}
.fa-mi+.fa-mi::before{content:"";position:absolute;left:14px;right:14px;top:0;height:1px;background:var(--line)}
.fa-mi .r{margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;gap:4px;flex:none}
.fa-paper{background:var(--surface);border-radius:var(--r-lg);box-shadow:inset 0 0 0 1px var(--line),var(--shadow-2);padding:26px 28px;position:relative}
.fa-paper .hd{display:flex;justify-content:space-between;gap:16px;align-items:flex-start}
.fa-paper .brand{display:flex;gap:12px;align-items:center;min-width:0}
.fa-paper .brand .lg{width:42px;height:42px;border-radius:12px;background:var(--navy);display:grid;place-items:center;flex:none}
.fa-paper .ttl{text-align:right;flex:none}
.fa-paper .ttl h3{font-size:25px;letter-spacing:-.035em;line-height:1}
.fa-meta{display:grid;grid-template-columns:minmax(0,1.3fr) repeat(3,minmax(0,.8fr));gap:14px;margin:22px 0 18px;padding:14px 0;border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.fa-meta .k{font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--mut);font-weight:600;margin-bottom:4px}
.fa-meta b{font-size:13.5px}
.fa-lines{width:100%;border-collapse:collapse;font-size:13px}
.fa-lines th{font-size:10.5px;letter-spacing:.07em;text-transform:uppercase;color:var(--mut);font-weight:600;text-align:left;padding:0 0 8px}
.fa-lines td{padding:11px 0;border-top:1px solid var(--line);vertical-align:top}
.fa-lines .n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;padding-left:14px}
.fa-lines td small{display:block;color:var(--mut);font-size:12px;margin-top:2px}
.fa-sum{display:flex;justify-content:space-between;gap:20px;align-items:flex-end;margin-top:16px;flex-wrap:wrap}
.fa-tot{margin-left:auto;width:min(290px,100%);display:grid;gap:7px;font-size:13px}
.fa-tot div{display:flex;justify-content:space-between;gap:12px}
.fa-tot .big{font:700 22px var(--f-display);letter-spacing:-.03em;padding-top:11px;margin-top:4px;border-top:1.5px solid var(--ink);align-items:baseline}
.fa-stamp{display:inline-flex;align-items:center;gap:8px;padding:7px 12px;border-radius:10px;font-weight:700;font-size:12px;letter-spacing:.07em;text-transform:uppercase;box-shadow:inset 0 0 0 1.5px currentColor;transform:rotate(-4deg);animation:pop var(--t-4) var(--e-spring) .25s both}
.fa-legal{margin-top:20px;padding-top:14px;border-top:1px dashed var(--line-2);font-size:11.5px;color:var(--mut);display:grid;gap:4px}
.fa-big{font:700 46px/1 var(--f-display);letter-spacing:-.045em;font-variant-numeric:tabular-nums}
.fa-stages{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.fa-stage{padding:10px 12px;border-radius:var(--r-md);background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);display:flex;flex-direction:column;gap:2px;transition:background var(--t-3),box-shadow var(--t-3)}
.fa-stage b{font:700 19px var(--f-display);letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.fa-stage span{font-size:11.5px;color:var(--mut);line-height:1.25}
.fa-stage.on{background:var(--acc-pale);box-shadow:inset 0 0 0 1px var(--acc-line)}
.fa-stage.done{background:var(--ok-pale);box-shadow:none}.fa-stage.done b{color:var(--ok)}
.fa-feed{height:clamp(228px,44vh,410px);overflow:hidden;position:relative;border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line)}
.fa-feed::after{content:"";position:absolute;left:1px;right:1px;bottom:1px;height:70px;background:linear-gradient(transparent,var(--surface));pointer-events:none;border-radius:0 0 var(--r-md) var(--r-md)}
.fa-fi{display:flex;align-items:center;gap:10px;height:44px;padding:0 14px;border-bottom:1px solid var(--line);font-size:13px;animation:faIn .3s var(--e-out) both}
@keyframes faIn{from{opacity:0;transform:translateY(-12px)}}
.fa-pv{display:flex;align-items:center;gap:12px;padding:10px 14px;width:100%;text-align:left;position:relative;transition:background var(--t-1)}
.fa-pv:hover{background:var(--surface-2)}
.fa-pv+.fa-pv{border-top:1px solid var(--line)}
.fa-meths{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.fa-meth{display:flex;flex-direction:column;gap:5px;align-items:flex-start;padding:11px 12px;border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line-2);text-align:left;font-weight:600;font-size:12.5px;line-height:1.25;transition:box-shadow var(--t-2),background var(--t-2);min-height:78px;background:var(--surface)}
.fa-meth small{font-weight:500;color:var(--mut);font-size:11.5px}
.fa-meth svg.i{color:var(--mut)}
.fa-meth[aria-pressed="true"]{box-shadow:inset 0 0 0 2px var(--acc);background:var(--acc-pale)}
.fa-meth[aria-pressed="true"] svg.i{color:var(--acc)}
.fa-amt{display:flex;align-items:baseline;justify-content:center;gap:6px;padding:6px 0 2px}
.fa-amt input{font:700 44px/1.1 var(--f-display);letter-spacing:-.04em;border:0;background:none;outline:none;text-align:right;width:190px;font-variant-numeric:tabular-nums;color:var(--ink)}
.fa-amt span{font:700 26px var(--f-display);color:var(--mut)}
.fa-steps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.fa-step{padding:14px;border-radius:var(--r-md);background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);display:flex;flex-direction:column;gap:7px;text-align:left;position:relative;min-width:0;transition:box-shadow var(--t-2),transform var(--t-2) var(--e-out)}
.fa-step:hover{box-shadow:inset 0 0 0 1px var(--acc-line);transform:translateY(-1px)}
.fa-step .j{font:600 12px var(--f-mono);color:var(--acc)}
.fa-step .t{font-weight:650;font-size:13.5px}
.fa-step p{font-size:12px;color:var(--mut);line-height:1.35}
.fa-rate{display:grid;grid-template-columns:minmax(0,1fr) 108px;gap:12px;align-items:center;padding:10px 0}
.fa-rate+.fa-rate{border-top:1px solid var(--line)}
.fa-rate .in{height:34px}
.fa-ex{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.fa-nl{display:grid;grid-template-columns:minmax(0,1fr) 64px 84px 30px;gap:8px;align-items:center}
@container main (max-width:860px){.fa-hero{grid-template-columns:minmax(0,1fr);gap:16px;padding:16px}.fa-hero h2{font-size:20px}}
@container main (max-width:620px){.fa-steps{grid-template-columns:repeat(2,minmax(0,1fr))}.ar-ck{flex-wrap:wrap}.ar-ck>.r{width:100%;padding-left:46px}.ar-ck>.r:empty{display:none}.ar-ck>.r .btn{width:100%;justify-content:center}}
@container arsh (max-width:440px){
 .fa-paper{padding:18px 16px}.fa-paper .ttl h3{font-size:20px}.fa-paper .brand .xs{display:none}
 .fa-meta{grid-template-columns:repeat(2,minmax(0,1fr))}.fa-lines .x{display:none}
 .fa-stages{grid-template-columns:repeat(2,minmax(0,1fr))}.fa-big{font-size:38px}.fa-feed{height:228px}
 .fa-meths{grid-template-columns:repeat(2,minmax(0,1fr))}
}
`);

/* =====================================================================
   Outils communs
   ===================================================================== */
function on(root,map){root.addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(!b||!root.contains(b))return;var f=map[b.getAttribute('data-a')];if(f)f(b,e)})}
function eu2(v){var n=Math.abs(v),p=n.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2}).split(',');return '<span class="num">'+(v<0?'−':'')+p[0]+'<span class="ar-c">,'+p[1]+' €</span></span>'}
function sq(icon,tone,cls){var t=tone||'acc';return '<span class="av sq '+(cls||'')+'" style="--c:'+(t==='mut'?'var(--bg-2)':'var(--'+t+'-pale)')+';color:'+(t==='mut'?'var(--ink-2)':'var(--'+t+')')+'">'+ICON(icon,cls==='sm'?'sm':'')+'</span>'}
function tick(){return '<span class="ar-tick"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span>'}
function norm(s){return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
function sum(a,f){return a.reduce(function(t,x){return t+(f?f(x):x)},0)}
function hm(h){var m=Math.round(Math.abs(h)*60),s=(h<0?'−':'')+Math.floor(m/60)+' h';return m%60?s+' '+String(m%60).padStart(2,'0'):s}
/* Tableau : cols [{l,f,n,c}] (c = classes, ex. « ar-h1 » masqué sur tablette, « hide-s » sur téléphone) */
function tbl(cols,rows,o){o=o||{};return '<div class="tw'+(o.card===false?'':' card')+' ar-tbl"><table class="tbl"><thead><tr>'+cols.map(function(c){return '<th class="'+(c.n?'n ':'')+(c.c||'')+'">'+c.l+'</th>'}).join('')+'</tr></thead><tbody>'+
  rows.map(function(r,i){return '<tr'+(o.act?' class="click" data-a="'+o.act+'" data-id="'+E(r.id!=null?r.id:i)+'"':'')+'>'+cols.map(function(c){return '<td class="'+(c.n?'n ':'')+(c.c||'')+'">'+c.f(r,i)+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>'}
/* Feuille : corps dans un conteneur mesurable, pied qui passe à la ligne, clics délégués */
function sheet(o,map){var sh=P.sheet({title:o.title,icon:o.icon,wide:o.wide,body:function(b){b.innerHTML='<div class="ar-sh">'+(typeof o.body==='string'?o.body:'')+'</div>';if(typeof o.body==='function')o.body(b.firstChild)},foot:o.foot?'<div class="ar-foot">'+o.foot+'</div>':null});if(map)on(sh,map);return sh}
/* Bouton de paiement : attente perçue, puis coche, puis suite */
function payBtn(b,label,cb){if(b.classList.contains('busy'))return;b.classList.add('busy');var w=b.offsetWidth;b.style.minWidth=w+'px';b.innerHTML='<span class="ar-spin"></span>';
  setTimeout(function(){b.classList.add('done');b.innerHTML=tick()+'<span>'+label+'</span>';setTimeout(cb,P.RM?60:720)},P.RM?60:820)}
function tabsBar(items,sel,attr){return '<div class="ar-tabs">'+U.tabs(items,sel,attr)+'</div>'}
function head(k,v){return '<div class="ar-stat"><b>'+v+'</b><span>'+k+'</span></div>'}

/* =====================================================================
   FACTURATION
   ===================================================================== */
var SF={tab:'factures',f:'all',q:'',n:12,cash:0,batch:null,rel:{},chq:{},remis:false,fixed:{}};
var EXTRA=[];/* factures créées pendant la démo */
var METH={'Prélèvement SEPA':'bank','Carte bancaire':'card','Virement':'swap','Chèque':'sign','Espèces':'wallet','Chèques-vacances ANCV':'ticket','Pass’Sport':'medal','Déduit de la prochaine facture':'repeat','Remboursé par virement':'swap','Lien de paiement':'link'};
function allInv(){return EXTRA.concat(D.invoices,D.creditNotes).slice().sort(function(a,b){return a.date<b.date?1:a.date>b.date?-1:(a.id<b.id?1:-1)})}
function inv(id){return allInv().find(function(i){return i.id===id})}
function fst(s){return s==='avoir'?'<span class="chip line">Avoir</span>':s==='nouvelle'?'<span class="chip acc dot">envoyée</span>':U.status(s)}
function late(){return D.invoices.filter(function(i){return i.status==='en retard'})}
function lateDays(i){return -F.days(i.due)}

/* TVA portée par chaque ligne, clé de ventilation de la pension paramétrable */
function vatRule(l){return /Pension/i.test(l)&&!/Demi/i.test(l)?'pension':/Licence/i.test(l)?0:/Forfait|Carte|Stage|Coaching|Baby|Cours/i.test(l)?5.5:20}
function invLines(v){var key=P.prefs.get('fa:cle',30)/100,r=vatRule(v.label),a=v.amount,L=[];
  function ln(lab,sub,ttc,rate){var ht=ttc/(1+rate/100);L.push({lab:lab,sub:sub,rate:rate,ht:ht,tva:ttc-ht,ttc:ttc})}
  var base=a-sum(v.pre||[],function(p){return p[1]});
  if(r==='pension'){ln(v.label,'Hébergement, nourriture et soins courants',base*(1-key),20);ln('Accès aux installations sportives','Manège, carrières et marcheur · '+Math.round(key*100)+' % de la pension',base*key,5.5)}
  else if(/Concours/.test(v.label)){var en=a<0?0:Math.min(26,a*.2);ln('Engagement au concours','Débours refacturé à l’euro près, hors TVA',en,0);ln('Transport aller-retour en camion','Rambouillet, 24 km, part d’un cheval',a-en,20)}
  else if(r===0)ln(v.label,'Débours reversé à la FFE, hors TVA',a,0);
  else ln(v.label,r===5.5?'Enseignement et pratique de l’équitation':/refact/i.test(v.label)?'Prestation refacturée sans marge':'Prestation de service',base,r);
  (v.pre||[]).forEach(function(p){ln(p[0],'Prestation de novembre refacturée',p[1],20)});
  return L}
function invTotals(L){var by={};L.forEach(function(l){by[l.rate]=by[l.rate]||{ht:0,tva:0};by[l.rate].ht+=l.ht;by[l.rate].tva+=l.tva});return {by:by,ht:sum(L,function(l){return l.ht}),ttc:sum(L,function(l){return l.ttc})}}

/* Lot de facturation de décembre, calculé à partir des pensions, forfaits et demi-pensions */
var BATCH=(function(){var L=[],own={},PRE={h01:['Ferrure complète du 19 novembre',95],h23:['Visite vétérinaire du 17 novembre',134],h21:['Parage du 19 novembre',45],h26:['Vermifuge et vaccin grippe',78],h29:['Ostéopathe du 10 novembre',80],h30:['Tonte complète',70],h27:['Vermifuge',24],h32:['Ferrure des antérieurs',62],h22:['Transport au concours de Chantilly',88]};
  D.horses.forEach(function(h){if(h.owner)(own[h.owner]=own[h.owner]||[]).push(h)});
  Object.keys(own).forEach(function(o,i){var hs=own[o],pre=[];hs.forEach(function(h){if(PRE[h.id])pre.push([PRE[h.id][0]+', '+h.name,PRE[h.id][1]])});
    L.push({cat:'pension',member:o,label:'Pension complète de décembre, '+hs.map(function(h){return h.name}).join(' et '),amount:sum(hs,function(h){return h.kind==='demi'?440:520})+sum(pre,function(p){return p[1]}),pre:pre,method:i%5===4?'Virement':'Prélèvement SEPA'})});
  D.halfboard.forEach(function(d){L.push({cat:'demi',member:d.rider,label:'Demi-pension de décembre, '+D.horse(d.horse).name,amount:d.price,method:'Prélèvement SEPA'})});
  F12.forEach(function(m,i){if(i%8<5)L.push({cat:'forfait',member:m.id,label:'Forfait annuel '+(m.forfait==='f2'?'2 h':'1 h')+' par semaine, mensualité 4 sur 10',amount:m.forfait==='f2'?139:78,method:i%9===8?'Carte bancaire':'Prélèvement SEPA'})});
  L.forEach(function(x,i){x.id='F-2026-'+(1174+i);x.vat=20;x.date=iso(0);x.due='2026-12-05';x.status='à venir'});return L})();
var CATS=[['forfait','Forfaits mensualisés','var(--c1)','members'],['pension','Pensions','var(--c2)','stable'],['presta','Prestations refacturées','var(--c4)','care'],['demi','Demi-pensions','var(--c3)','horse']];
function batchStats(){var s={n:BATCH.length,ttc:sum(BATCH,function(x){return x.amount}),cat:{}};
  CATS.forEach(function(c){s.cat[c[0]]={n:0,ttc:0}});
  BATCH.forEach(function(x){var pre=sum(x.pre||[],function(p){return p[1]});s.cat[x.cat].n++;s.cat[x.cat].ttc+=x.amount-pre;if(pre){s.cat.presta.n+=x.pre.length;s.cat.presta.ttc+=pre}});
  s.sepa=BATCH.filter(function(x){return /SEPA/.test(x.method)});s.sepaSum=sum(s.sepa,function(x){return x.amount});return s}
var CHECKS=[
 {id:'c1',tone:'warn',icon:'bank',t:'Mandat SEPA non signé',s:D.name(F12[2].id)+' : le mandat envoyé le 9 novembre n’est pas signé.',b:'Passer en lien de paiement',done:'La facture partira avec un lien de paiement par carte.'},
 {id:'c2',tone:'acc',icon:'percent',t:'Prorata à confirmer',s:'Étoile est arrivée le 8 novembre : 23 jours de pension sur 30 à régulariser.',b:'Appliquer le prorata',done:'Régularisation de 121 € ajoutée à la facture.'},
 {id:'c3',tone:'bad',icon:'alert',t:'Facture précédente impayée',s:'Léa Martin doit encore 520 € sur novembre (prélèvement rejeté).',b:'Ajouter le rappel sur la facture',done:'Le solde de novembre figure sur la facture de décembre.'}];

function openInvoice(id,o){o=o||{};var v=typeof id==='string'?inv(id):id;if(!v)return;var m=D.member(v.member),L=invLines(v),T=invTotals(L),av=v.status==='avoir',paid=v.status==='payée',lt=v.status==='en retard';
  var rates=Object.keys(T.by).map(Number).sort(function(a,b){return a-b});
  var stamp=paid?'<span class="fa-stamp okc">'+ICON('checkc','sm')+'Payée le '+F.date(D.iso(new Date(new Date(v.due).getTime()-864e5*2)))+'</span>':lt?'<span class="fa-stamp badc">'+ICON('clock','sm')+'En retard de '+lateDays(v)+' j</span>':av?'<span class="fa-stamp mut">'+ICON('repeat','sm')+'Avoir sur '+v.ref+'</span>':'<span class="fa-stamp acc">'+ICON('send','sm')+(v.preview?'Aperçu avant envoi':'Échéance le '+F.date(v.due))+'</span>';
  var paper='<div class="fa-paper"><div class="hd"><div class="brand"><span class="lg">'+LOGO(22,'var(--navy-ink)','var(--strass)')+'</span><div style="min-width:0"><b class="disp" style="font-size:16px">'+D.club.name+'</b><div class="xs mut">'+D.club.address+'</div><div class="xs mut">SIRET '+D.club.siret+' · TVA FR 41 812 345 678</div></div></div>'+
    '<div class="ttl"><h3>'+(av?'Avoir':'Facture')+'</h3><div class="mono mut" style="margin-top:6px">'+v.id+'</div></div></div>'+
    '<div class="fa-meta"><div><div class="k">'+(av?'Avoir émis pour':'Facturé à')+'</div><b>'+m.first+' '+m.last+'</b><div class="xs mut">'+m.email+'</div></div><div><div class="k">Émise le</div><b>'+F.dateY(v.date)+'</b></div><div><div class="k">'+(av?'Facture d’origine':'Échéance')+'</div><b>'+(av?v.ref:F.dateY(v.due))+'</b></div><div><div class="k">Règlement</div><b>'+v.method+'</b></div></div>'+
    '<table class="fa-lines"><thead><tr><th>Désignation</th><th class="n x">HT</th><th class="n">TVA</th><th class="n">TTC</th></tr></thead><tbody>'+L.map(function(l){return '<tr><td><b>'+E(l.lab)+'</b><small>'+l.sub+'</small></td><td class="n x">'+F.eur(l.ht,true)+'</td><td class="n mut">'+(l.rate?String(l.rate).replace('.',',')+' %':'0 %')+'</td><td class="n b">'+F.eur(l.ttc,true)+'</td></tr>'}).join('')+'</tbody></table>'+
    '<div class="fa-sum"><div>'+stamp+'</div><div class="fa-tot"><div><span class="mut">Total hors taxes</span><span class="num">'+F.eur(T.ht,true)+'</span></div>'+rates.filter(function(r){return r>0}).map(function(r){return '<div><span class="mut">TVA '+String(r).replace('.',',')+' % sur '+F.eur(T.by[r].ht,true)+'</span><span class="num">'+F.eur(T.by[r].tva,true)+'</span></div>'}).join('')+
    '<div class="big"><span>'+(av?'Total de l’avoir':'Total à payer')+'</span><span class="num">'+F.eur(T.ttc,true)+'</span></div></div></div>'+
    '<div class="fa-legal"><span>Paiement par prélèvement, carte, virement (IBAN FR76 1820 6002 1065 0142 3378 912), chèque, espèces, chèques-vacances ANCV ou Pass’Sport.</span><span>Pénalités de retard : trois fois le taux d’intérêt légal. Indemnité forfaitaire de recouvrement pour les professionnels : 40 €.</span><span class="hrow" style="--g:6px">'+ICON('shield','sm')+'Facture électronique au format Factur-X, numérotation continue et archivage dix ans.</span></div></div>';
  var ev=[['acc','Créée automatiquement par Piaffe',F.dateY(v.date)]];
  if(!v.preview){ev.push(['acc','Envoyée par e-mail et déposée dans l’espace adhérent',F.date(v.date)+' à 8 h 02']);
   if(v.status!=='à venir'&&!av)ev.push(['acc','Ouverte par '+m.first,F.date(v.date)+' à 12 h 15']);
   if(paid){ev.push(['ok','Payée par '+v.method.toLowerCase(),F.date(v.due)]);ev.push(['ok','Rapprochée avec la banque et passée en comptabilité','automatique'])}
   if(lt){if(/SEPA/.test(v.method))ev.push(['bad','Prélèvement rejeté : provision insuffisante',F.date(v.due)]);var d=lateDays(v);if(d>=3)ev.push(['warn','Relance 1 envoyée par e-mail','3 jours après l’échéance']);if(d>=10)ev.push(['warn','Relance 2 envoyée par e-mail et SMS, avec le lien de paiement','10 jours après l’échéance']);if(d>=20)ev.push(['warn','Appel de Nadia, message laissé sur le répondeur','20 jours après l’échéance']);if(d<3)ev.push(['mut','Relance 1 programmée','demain à 9 h'])}
   if(av)ev.push(['ok',v.method,F.date(v.date)])}
  var body=paper+(v.preview?'':'<div class="ar-sec"><div class="eyebrow">Suivi de la facture</div><div class="tl">'+ev.map(function(e){return '<div class="ev" style="--c:var(--'+(e[0]==='mut'?'mut-2':e[0])+')"><div class="s b">'+e[1]+'</div><div class="xs mut">'+e[2]+'</div></div>'}).join('')+'</div></div>');
  var foot=v.preview?'<button class="btn" data-a="back">'+ICON('back','sm')+'Revenir au lot</button>':
    '<button class="btn icon" data-a="pdf" title="Télécharger le PDF Factur-X">'+ICON('download')+'</button>'+(av?'':'<button class="btn" data-a="avoir">Créer un avoir</button>')+(lt?'<button class="btn" data-a="relance">'+ICON('send','sm')+'Relancer</button>':'')+(paid||av?'<button class="btn pri" data-a="mail">'+ICON('mail','sm')+'Renvoyer par e-mail</button>':'<button class="btn pri" data-a="pay">'+ICON('card','sm')+'Encaisser</button>');
  var sh=sheet({title:(av?'Avoir ':'Facture ')+v.id,icon:'invoice',wide:true,body:body,foot:foot},{
    back:function(){openBatch()},
    pdf:function(){P.toast(v.id+'.pdf téléchargé au format Factur-X',{icon:'download'})},
    mail:function(){P.toast('Facture renvoyée à '+m.email,{icon:'mail'})},
    relance:function(){SF.rel[v.id]=1;sh.close();P.toast('Relance envoyée à '+m.first+' par e-mail et SMS',{icon:'send'});re()},
    avoir:function(){openAvoir(v)},
    pay:function(){openPay(v)}});
  return sh}

function openAvoir(v){var m=D.member(v.member);
  var sh=sheet({title:'Créer un avoir',icon:'repeat',body:'<div class="note">'+ICON('info','sm')+'<span>Un avoir annule tout ou partie de la facture '+v.id+' sans la modifier. La numérotation reste continue.</span></div>'+
    '<label class="field"><span>Montant de l’avoir, toutes taxes comprises</span><input class="in num" id="av-amt" value="'+v.amount+'" inputmode="decimal"></label>'+
    '<label class="field"><span>Motif</span><select class="in" id="av-why"><option>Séances annulées par le club</option><option>Absence justifiée par un certificat médical</option><option>Erreur de facturation</option><option>Geste commercial</option></select></label>'+
    '<div class="field"><span>Que faire du montant ?</span>'+U.seg([['d','Déduire de la prochaine facture'],['r','Rembourser']],'d','data-av')+'</div>',
    foot:'<button class="btn pri" data-a="ok">Créer l’avoir de '+m.first+'</button>'},{ok:function(){
      var a=Math.min(v.amount,Math.abs(parseFloat(String(sh.querySelector('#av-amt').value).replace(',','.'))||0))||v.amount,r=sh.querySelector('[data-av="r"]').getAttribute('aria-selected')==='true';
      D.creditNotes.unshift({id:'AV-2026-00'+(15+D.creditNotes.length-3),member:v.member,label:'Avoir, '+v.label.toLowerCase(),amount:-a,date:iso(0),due:iso(0),status:'avoir',method:r?'Remboursé par virement':'Déduit de la prochaine facture',ref:v.id});
      sh.close();SF.f='avoir';SF.tab='factures';re();P.toast('Avoir de '+F.eur(a)+' créé pour '+m.first+' '+m.last)}});}

var PAYM=[['Carte bancaire','card','Terminal ou lien de paiement'],['Prélèvement SEPA','bank','Mandat signé en ligne'],['En 3 fois','repeat','Sans frais, par carte'],['En 10 fois','calendar_add','Mensualités par prélèvement'],['Chèques-vacances ANCV','ticket','Papier ou Connect'],['Pass’Sport','medal','50 € déduits, 6 à 17 ans'],['Espèces','wallet','Journal de caisse'],['Chèque','sign','Bordereau de remise'],['Virement','swap','Rapproché tout seul']];
function payDetail(k,amt,m){var a=F.eur(amt,true);
  if(k==='Carte bancaire')return '<div class="ar-soft stack" style="--g:8px"><b class="s">Comment '+m.first+' paie-t-il ?</b>'+U.seg([['t','Sur le terminal de l’accueil'],['l','Par lien envoyé par SMS']],'t','data-cb')+'<span class="xs mut">Piaffe ne voit jamais le numéro de carte : le prestataire de paiement porte la conformité.</span></div>';
  if(k==='Prélèvement SEPA')return '<div class="ar-soft hrow">'+sq('shield','ok')+'<div class="grow"><b class="s">Mandat actif, signé le 3 septembre 2025</b><div class="xs mut">RUM PIAFFE-'+m.id.toUpperCase()+' · IBAN FR76 •••• •••• 4521 · prélèvement présenté le 20 novembre</div></div></div>';
  if(k==='En 3 fois'||k==='En 10 fois'){var n=k==='En 3 fois'?3:10,part=Math.floor(amt/n*100)/100,first=Math.round((amt-part*(n-1))*100)/100,MO=['17 nov.','17 déc.','17 janv.','17 févr.','17 mars','17 avr.','17 mai','17 juin','17 juil.','17 août'];
    return '<div class="ar-soft stack" style="--g:8px"><div class="hrow sp"><b class="s">Échéancier en '+n+' fois sans frais</b><span class="xs mut">'+(n===3?'Carte enregistrée':'Mandat SEPA')+'</span></div><div class="hrow wrap" style="--g:6px">'+MO.slice(0,n).map(function(d,i){return '<span class="chip '+(i?'line':'acc')+'">'+d+' · '+F.eur(i?part:first,true)+'</span>'}).join('')+'</div></div>'}
  if(k==='Chèques-vacances ANCV')return '<div class="ar-g2 shx"><label class="field"><span>Nombre de chèques</span><input class="in num" value="'+Math.max(1,Math.round(amt/20))+'"></label><label class="field"><span>Valeur faciale</span><select class="in"><option>20 €</option><option>10 €</option><option>25 €</option><option>50 €</option></select></label></div><span class="xs mut">Les chèques rejoignent le bordereau de remise ANCV du mois. Le complément éventuel se règle par un autre moyen.</span>';
  if(k==='Pass’Sport')return '<label class="field"><span>Code Pass’Sport du jeune</span><input class="in mono" value="26-KQ4T-8MVD"></label><div class="note ok">'+ICON('checkc','sm')+'<span>50 € déduits. Reste à payer : <b>'+F.eur(Math.max(0,amt-50),true)+'</b>. Le code est ajouté à la liste à déclarer sur Le Compte Asso avant le 31 décembre 2026.</span></div>';
  if(k==='Espèces')return '<div class="ar-g2 shx"><label class="field"><span>Montant reçu</span><input class="in num" value="'+(Math.ceil(amt/10)*10)+'"></label><div class="field"><span>À rendre</span><div class="in hrow b num">'+F.eur(Math.ceil(amt/10)*10-amt,true)+'</div></div></div><span class="xs mut">Le mouvement est inscrit au journal de caisse, horodaté et non modifiable.</span>';
  if(k==='Chèque')return '<div class="ar-g2 shx"><label class="field"><span>Banque</span><input class="in" value="Crédit Agricole"></label><label class="field"><span>Numéro du chèque</span><input class="in mono" value="4410240"></label></div><label class="field"><span>Date d’encaissement</span><select class="in"><option>Tout de suite, prochaine remise en banque</option><option>Différé au 5 décembre</option><option>Différé au 5 janvier</option></select></label>';
  return '<div class="ar-soft hrow">'+sq('swap','acc')+'<div class="grow"><b class="s">En attente du virement de '+a+'</b><div class="xs mut">Référence à rappeler : '+m.last.toUpperCase()+' '+m.id.toUpperCase()+'. Piaffe rapprochera le virement dès qu’il arrive en banque.</div></div></div>'}
function openPay(v){var list=late().concat(D.invoices.filter(function(i){return i.status==='envoyée'}));if(!v)v=list[0];var m=D.member(v.member),sel=/SEPA/.test(v.method)&&v.status!=='en retard'?'Prélèvement SEPA':'Carte bancaire';
  var sh=sheet({title:'Encaisser un paiement',icon:'card',body:function(b){
    function draw(){m=D.member(v.member);b.innerHTML='<label class="field"><span>Facture à régler</span><select class="in" id="pay-inv">'+list.map(function(i){return '<option value="'+i.id+'"'+(i.id===v.id?' selected':'')+'>'+D.name(i.member)+' · '+i.id+' · '+F.eur(i.amount)+(i.status==='en retard'?' · en retard':'')+'</option>'}).join('')+(list.indexOf(v)<0?'<option selected>'+D.name(v.member)+' · '+v.id+' · '+F.eur(v.amount)+'</option>':'')+'</select></label>'+
      '<div class="stack" style="--g:2px"><div class="fa-amt"><input id="pay-amt" class="num" value="'+String(v.amount.toFixed(2)).replace('.',',')+'" inputmode="decimal" aria-label="Montant"><span>€</span></div><div class="xs mut" style="text-align:center">'+E(v.label)+'</div></div>'+
      '<div class="ar-sec"><div class="eyebrow">Moyen de paiement</div><div class="fa-meths">'+PAYM.map(function(p){return '<button class="fa-meth" data-a="meth" data-k="'+p[0]+'" aria-pressed="'+(p[0]===sel)+'">'+ICON(p[1])+'<span>'+p[0]+'</span><small>'+p[2]+'</small></button>'}).join('')+'</div></div><div id="pay-det" class="stack fade">'+payDetail(sel,v.amount,m)+'</div>';
      b.querySelector('#pay-inv').onchange=function(e){var n=inv(e.target.value);if(n){v=n;draw();lab()}}}
    draw()},foot:'<button class="btn pri lg ar-pay" data-a="go"></button>'},{
    meth:function(x){sel=x.getAttribute('data-k');P.$$('.fa-meth',sh).forEach(function(y){y.setAttribute('aria-pressed',y===x)});var d=sh.querySelector('#pay-det');d.innerHTML=payDetail(sel,v.amount,m);d.classList.remove('fade');void d.offsetWidth;d.classList.add('fade');lab()},
    go:function(b){var wait=sel==='Virement'||sel==='Prélèvement SEPA';payBtn(b,wait?'Programmé':'Paiement reçu',function(){
      if(!wait){if(v.status==='en retard'||v.status==='envoyée'||v.status==='à venir'||v.status==='nouvelle'){v.status='payée';v.method=sel.indexOf('fois')>0?'Carte bancaire':sel;SF.cash+=v.amount}}
      sh.close();re();P.toast(wait?(sel==='Virement'?'Virement attendu, rapprochement automatique à réception':'Prélèvement de '+F.eur(v.amount)+' programmé le 20 novembre'):F.eur(v.amount,true)+' encaissés, reçu envoyé à '+m.first,{icon:'checkc'})})}});
  function lab(){var b=sh.querySelector('.ar-pay');if(b&&!b.classList.contains('busy'))b.innerHTML=(sel==='Virement'?'Attendre le virement':sel==='Prélèvement SEPA'?'Programmer le prélèvement':sel==='Carte bancaire'?'Encaisser '+F.eur(v.amount,true)+' par carte':'Encaisser '+F.eur(sel==='Pass’Sport'?Math.max(0,v.amount-50):v.amount,true))}
  lab();return sh}

var CATALOG=[['Cours particulier, 1 heure',45,5.5],['Carte 10 séances',290,5.5],['Stage de Noël, 1 journée',65,5.5],['Pension complète, 1 mois',520,'pension'],['Demi-pension, 1 mois',180,20],['Tonte complète',70,20],['Transport en concours',60,20],['Licence FFE 2027',36,0]];
function openNew(){var lines=[{k:0,q:2}],who=F12[5].id;
  var sh=sheet({title:'Nouvelle facture',icon:'plus',body:function(b){
    function draw(){var tot=0,by={};lines.forEach(function(l){var c=CATALOG[l.k],ttc=c[1]*l.q,r=c[2]==='pension'?20:c[2];tot+=ttc;by[r]=(by[r]||0)+ttc-ttc/(1+r/100)});
      b.innerHTML='<label class="field"><span>Client</span><select class="in" id="nw-who">'+D.members.slice(0,40).map(function(m){return '<option value="'+m.id+'"'+(m.id===who?' selected':'')+'>'+m.first+' '+m.last+'</option>'}).join('')+'</select></label>'+
       '<div class="ar-sec"><div class="eyebrow">Prestations</div>'+lines.map(function(l,i){return '<div class="fa-nl"><select class="in" data-nl="'+i+'">'+CATALOG.map(function(c,k){return '<option value="'+k+'"'+(k===l.k?' selected':'')+'>'+c[0]+'</option>'}).join('')+'</select><input class="in num" data-nq="'+i+'" value="'+l.q+'" inputmode="numeric" aria-label="Quantité"><b class="num" style="text-align:right">'+F.eur(CATALOG[l.k][1]*l.q)+'</b><button class="btn ghost icon sm" data-a="del" data-i="'+i+'" title="Retirer la ligne">'+ICON('x','sm')+'</button></div>'}).join('')+
       '<button class="btn sm" data-a="add" style="align-self:flex-start">'+ICON('plus','sm')+'Ajouter une ligne</button></div>'+
       '<div class="ar-soft"><dl class="ar-dl">'+Object.keys(by).map(function(r){return '<dt>TVA '+String(r).replace('.',',')+' %</dt><dd class="num">'+F.eur(by[r],true)+'</dd>'}).join('')+'<dt class="b" style="color:var(--ink)">Total à payer</dt><dd class="num disp" style="font-size:20px">'+F.eur(tot,true)+'</dd></dl></div>'+
       '<div class="ar-box list"><div class="li"><div class="grow"><div class="t">Joindre un lien de paiement</div><div class="s">Carte, prélèvement ou paiement en 3 fois</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">Relancer automatiquement</div><div class="s">Scénario gradué du club</div></div>'+U.tog(true)+'</div></div>';
      b.querySelector('#nw-who').onchange=function(e){who=e.target.value};
      P.$$('[data-nl]',b).forEach(function(s){s.onchange=function(){lines[+s.getAttribute('data-nl')].k=+s.value;draw()}});
      P.$$('[data-nq]',b).forEach(function(s){s.onchange=function(){lines[+s.getAttribute('data-nq')].q=Math.max(1,parseInt(s.value,10)||1);draw()}});
      var f=sh&&sh.querySelector('[data-a="send"]');if(f)f.innerHTML=ICON('send','sm')+'Créer et envoyer '+F.eur(tot)}
    b._draw=draw;draw()},foot:'<button class="btn" data-a="draft">Enregistrer le brouillon</button><button class="btn pri" data-a="send">'+ICON('send','sm')+'Créer et envoyer</button>'},{
    add:function(){lines.push({k:Math.min(lines.length,CATALOG.length-1),q:1});sh.querySelector('.ar-sh')._draw()},
    del:function(b){if(lines.length>1){lines.splice(+b.getAttribute('data-i'),1);sh.querySelector('.ar-sh')._draw()}else P.toast('Une facture contient au moins une ligne',{icon:'info'})},
    draft:function(){sh.close();P.toast('Brouillon enregistré')},
    send:function(){var tot=sum(lines,function(l){return CATALOG[l.k][1]*l.q}),c=CATALOG[lines[0].k],n={id:'F-2026-'+(1174+BATCH.length+EXTRA.length),member:who,label:c[0]+(lines.length>1?' et '+(lines.length-1)+' autre'+(lines.length>2?'s':'')+' prestation'+(lines.length>2?'s':''):''),amount:tot,vat:20,date:iso(0),due:iso(14),status:'envoyée',method:'Lien de paiement',isNew:true};
      EXTRA.unshift(n);sh.close();SF.tab='factures';SF.f='all';SF.q='';re();P.toast('Facture '+n.id+' envoyée à '+D.name(who)+' avec son lien de paiement',{icon:'send'})}});
  sh.querySelector('.ar-sh')._draw();return sh}

/* Moment phare : aperçu puis génération en lot animée */
function openBatch(){var S=batchStats();
  if(SF.batch){return sheet({title:'Facturation de décembre',icon:'invoice',wide:true,body:doneHtml(S),foot:'<button class="btn pri" data-a="see">Voir les factures</button>'},{see:function(b){b.closest('.sheet').close();SF.tab='factures';SF.f='à venir';re()}})}
  var sh=sheet({title:'Facturation de décembre',icon:'invoice',wide:true,body:'<div class="ar-g3 shx ar-k3">'+head('factures prêtes',S.n)+head('toutes taxes comprises',F.eur(S.ttc))+head('prélevés le 5 décembre',F.eur(S.sepaSum))+'</div>'+
    '<div class="note">'+ICON('eye','sm')+'<span>Vérifiez quelques factures avant l’envoi. Rien ne part tant que vous n’avez pas confirmé, et l’envoi reste annulable pendant dix minutes.</span></div>'+
    '<div class="ar-sec"><div class="eyebrow"><span>Aperçu des factures</span><span class="mut" style="text-transform:none;letter-spacing:0">'+S.n+' au total</span></div><div class="ar-box">'+BATCH.slice(0,3).concat(BATCH.filter(function(x){return x.cat==='demi'}).slice(0,1),BATCH.filter(function(x){return x.cat==='forfait'}).slice(0,3)).map(function(x){var c=CATS.find(function(c){return c[0]===x.cat});
      return '<button class="fa-pv" data-a="pv" data-id="'+x.id+'">'+U.av(x.member)+'<span class="grow" style="min-width:0"><span class="b s ellip" style="display:block">'+D.name(x.member)+'</span><span class="xs mut ellip" style="display:block">'+E(x.label)+(x.pre&&x.pre.length?' · '+x.pre.length+' prestation'+(x.pre.length>1?'s':'')+' refacturée'+(x.pre.length>1?'s':''):'')+'</span></span><span class="chip ar-hx" style="color:'+c[2]+'">'+c[1].split(' ')[0]+'</span><b class="num s">'+F.eur(x.amount)+'</b>'+ICON('right','sm')+'</button>'}).join('')+'</div></div>',
    foot:'<button class="btn" data-a="later">Laisser l’envoi au 25 novembre</button><button class="btn pri" data-a="run">'+ICON('bolt','sm')+'Générer et envoyer les '+S.n+' factures</button>'},{
    pv:function(b){var x=BATCH.find(function(i){return i.id===b.getAttribute('data-id')});openInvoice(Object.assign({},x,{preview:true}))},
    later:function(){sh.close();P.toast('Envoi automatique conservé au 25 novembre à 8 h',{icon:'clock'})},
    run:function(){runBatch(sh,S)}});
  return sh}
function doneHtml(S){return '<div class="ar-done"><span class="orb">'+tick()+'<span class="strass"></span></span><h3>'+S.n+' factures envoyées pour '+F.eur(S.ttc)+'</h3><p class="mut s" style="max-width:440px">Chaque adhérent a reçu sa facture par e-mail et la retrouve dans son espace. Les écritures de vente sont déjà dans le journal.</p></div>'+
  '<div class="ar-g3 shx">'+[['bank',S.sepa.length+' prélèvements','programmés le 5 décembre, '+F.eur(S.sepaSum)],['link',(S.n-S.sepa.length)+' liens de paiement','carte, virement ou paiement en 3 fois'],['shield','Factur-X','numérotation continue de F-2026-1174 à F-2026-'+(1173+S.n)]].map(function(x){return '<div class="ar-soft stack" style="--g:6px">'+sq(x[0],'ok','sm')+'<b class="s">'+x[1]+'</b><span class="xs mut">'+x[2]+'</span></div>'}).join('')+'</div>'}
function runBatch(sh,S){var body=sh.querySelector('.ar-sh'),foot=sh.querySelector('.ar-foot'),n=S.n,i=0,amt=0;
  var ST=[['Lignes et TVA calculées',0],['Numéros attribués',3],['PDF Factur-X créés',6],['E-mails envoyés',9]];
  body.innerHTML='<div class="hrow sp" style="align-items:flex-end"><div><div class="eyebrow">Génération en cours</div><div class="fa-big"><span id="fb-n">0</span><span class="mut" style="font-size:.5em"> sur '+n+'</span></div></div><div style="text-align:right"><div class="xs mut">Montant facturé</div><b class="disp num" style="font-size:22px" id="fb-a">0 €</b></div></div>'+
    '<div class="bar" style="height:8px"><i id="fb-bar" style="--v:0%;transition:width .1s linear"></i></div>'+
    '<div class="fa-stages">'+ST.map(function(s,k){return '<div class="fa-stage" data-k="'+k+'"><b>0</b><span>'+s[0]+'</span></div>'}).join('')+'</div><div class="fa-feed" id="fb-feed"></div>';
  foot.innerHTML='<span class="xs mut" style="margin-right:auto;align-self:center">Vous pouvez fermer cette fenêtre, l’envoi continue.</span>';
  var feed=body.querySelector('#fb-feed'),stg=P.$$('.fa-stage',body);
  function finish(){SF.batch={at:'9 h 41'};BATCH.forEach(function(x){if(EXTRA.indexOf(x)<0)EXTRA.push(x)});if(!sh.isConnected){P.toast(n+' factures de décembre envoyées');return}
    body.innerHTML=doneHtml(S);P.animate(body);foot.innerHTML='<button class="btn" data-a="undo">Annuler l’envoi</button><button class="btn pri" data-a="see">Voir les factures</button>';
    on(foot,{undo:function(){SF.batch=null;EXTRA=EXTRA.filter(function(x){return BATCH.indexOf(x)<0});sh.close();re();P.toast('Envoi annulé, les '+n+' factures repassent en préparation',{icon:'refresh'})},see:function(){sh.close();SF.tab='factures';SF.f='à venir';SF.n=12;re()}})}
  if(P.RM){finish();return}
  function step(){if(i>=n+10){stg.forEach(function(s){s.className='fa-stage done'});setTimeout(finish,420);return}
    if(i<n){var x=BATCH[i];amt+=x.amount;var r=document.createElement('div');r.className='fa-fi';r.innerHTML=tick()+'<span class="mono mut">'+x.id+'</span><b class="ellip grow">'+D.name(x.member)+'</b><span class="chip ar-hx">'+ICON(METH[x.method]||'card','sm')+x.method.replace('Prélèvement ','')+'</span><b class="num">'+F.eur(x.amount)+'</b>';feed.insertBefore(r,feed.firstChild);if(feed.children.length>7)feed.removeChild(feed.lastChild);
      body.querySelector('#fb-n').textContent=i+1;body.querySelector('#fb-a').textContent=F.eur(amt);body.querySelector('#fb-bar').style.setProperty('--v',((i+1)/n*100)+'%')}
    stg.forEach(function(s,k){var c=Math.max(0,Math.min(n,i+1-ST[k][1]));s.firstChild.textContent=c;s.className='fa-stage'+(c>=n?' done':c>0?' on':'')});
    i++;setTimeout(step,i<6?150:i<14?90:52)}
  step()}

function openMandates(){var rows=D.invoices.filter(function(i){return /SEPA/.test(i.method)}).slice(0,9).map(function(i,k){return {id:k,m:i.member,st:k===2?'à signer':k===6?'rejet':'actif',d:['3 sept. 2025','12 sept. 2025','envoyé le 9 nov.','28 août 2026','1 sept. 2026','5 sept. 2024','15 janv. 2026','2 sept. 2026','19 sept. 2025'][k]}});
  sheet({title:'Mandats de prélèvement SEPA',icon:'bank',wide:true,body:'<div class="ar-g3 shx ar-k3">'+head('mandats actifs',61)+head('en attente de signature',2)+head('rejets en novembre',2)+'</div>'+
    '<div class="ar-box list">'+rows.map(function(r){var m=D.member(r.m);return '<div class="li">'+U.av(m)+'<div class="grow"><div class="t">'+m.first+' '+m.last+'</div><div class="s mono">RUM PIAFFE-'+m.id.toUpperCase()+' · FR76 •••• '+(4000+parseInt(m.id.slice(1),10)*37%6000)+'</div></div><div class="r"><span class="xs mut ar-hx">'+r.d+'</span>'+(r.st==='actif'?U.chip('actif','ok',true):r.st==='rejet'?U.chip('1 rejet','bad',true):'<button class="btn sm" data-a="send">Renvoyer</button>')+'</div></div>'}).join('')+'</div>'+
    '<div class="note">'+ICON('shield','sm')+'<span>Le mandat se signe en ligne en deux minutes. Un prélèvement rejeté est représenté automatiquement dix jours plus tard, puis la facture rejoint le scénario de relance.</span></div>',
    foot:'<button class="btn pri" data-a="new">'+ICON('send','sm')+'Envoyer un mandat à signer</button>'},{send:function(b){b.outerHTML=U.chip('renvoyé','acc',true);P.toast('Mandat renvoyé par e-mail et SMS',{icon:'send'})},new:function(){P.toast('Lien de signature du mandat copié et envoyé',{icon:'link'})}})}

function openBordereau(){var sel=D.cheques.filter(function(q){return !q.later&&SF.chq[q.id]!==false}),tot=sum(sel,function(q){return q.amount});
  var sh=sheet({title:'Bordereau de remise de chèques',icon:'sign',wide:true,body:'<div class="fa-paper"><div class="hd"><div class="brand"><span class="lg">'+LOGO(22,'var(--navy-ink)','var(--strass)')+'</span><div><b class="disp" style="font-size:16px">'+D.club.name+'</b><div class="xs mut">Compte courant · FR76 1820 6002 1065 0142 3378 912</div></div></div><div class="ttl"><h3>Remise n° 47</h3><div class="mono mut" style="margin-top:6px">17 novembre 2026</div></div></div>'+
    '<table class="fa-lines" style="margin-top:20px"><thead><tr><th>Émetteur</th><th class="x">Banque</th><th>Chèque n°</th><th class="n">Montant</th></tr></thead><tbody>'+sel.map(function(q){return '<tr><td><b>'+D.name(q.member)+'</b></td><td class="x mut">'+q.bank+'</td><td class="mono">'+q.num+'</td><td class="n b">'+F.eur(q.amount,true)+'</td></tr>'}).join('')+'</tbody></table>'+
    '<div class="fa-sum"><div class="xs mut">'+sel.length+' chèques à déposer à l’agence de Rambouillet</div><div class="fa-tot"><div class="big"><span>Total remis</span><span class="num">'+F.eur(tot,true)+'</span></div></div></div></div>',
    foot:'<button class="btn" data-a="pdf">'+ICON('download','sm')+'Télécharger</button><button class="btn pri" data-a="ok">Imprimer et marquer comme remis</button>'},{pdf:function(){P.toast('Bordereau n° 47 téléchargé',{icon:'download'})},ok:function(){SF.remis=true;sh.close();re();P.toast(sel.length+' chèques remis en banque, '+F.eur(tot)+' attendus sous 2 jours')}})}

function openSchedule(){var tot=780,n=10;
  var sh=sheet({title:'Créer un échéancier',icon:'calendar_add',body:function(b){
    function draw(){var part=Math.floor(tot/n*100)/100,first=Math.round((tot-part*(n-1))*100)/100,MO=['5 déc.','5 janv.','5 févr.','5 mars','5 avr.','5 mai','5 juin','5 juil.','5 août','5 sept.'];
      b.innerHTML='<label class="field"><span>Adhérent</span><select class="in">'+F12.slice(10,22).map(function(m){return '<option>'+m.first+' '+m.last+'</option>'}).join('')+'</select></label>'+
      '<label class="field"><span>Montant total à étaler</span><input class="in num" id="ec-t" value="'+tot+'" inputmode="decimal"></label>'+
      '<div class="field"><span>Nombre d’échéances</span>'+U.seg([['3','3 fois'],['4','4 fois'],['10','10 fois']],String(n),'data-ec')+'</div>'+
      '<div class="ar-box list">'+MO.slice(0,n).map(function(d,i){return '<div class="li" style="padding:8px 14px"><span class="mono mut" style="width:22px">'+(i+1)+'</span><div class="grow s b">'+d+(i>0&&i>=1&&d.indexOf('janv')>=0?' 2027':'')+'</div><b class="num s">'+F.eur(i?part:first,true)+'</b></div>'}).join('')+'</div>'+
      '<div class="note">'+ICON('info','sm')+'<span>Sans frais et sans crédit : l’échéancier s’appuie sur le mandat SEPA ou la carte enregistrée. Un rejet décale l’échéance de dix jours et prévient le secrétariat.</span></div>';
      b.querySelector('#ec-t').onchange=function(e){tot=Math.max(30,parseFloat(String(e.target.value).replace(',','.'))||tot);draw()};
      P.$$('[data-ec]',b).forEach(function(x){x.onclick=function(){n=+x.getAttribute('data-ec');draw()}})}
    draw()},foot:'<button class="btn pri" data-a="ok">Créer l’échéancier et envoyer le mandat</button>'},{ok:function(){sh.close();P.toast('Échéancier en '+n+' fois créé, mandat envoyé pour signature')}})}

function openStep(k){var R=REL[k];
  var sh=sheet({title:R.t,icon:R.i,body:'<div class="hrow wrap" style="--g:6px"><span class="chip acc">'+R.j+' jours après l’échéance</span><span class="chip">'+R.c+'</span></div>'+
    '<label class="field"><span>Objet</span><input class="in" value="'+E(R.o)+'"></label><label class="field"><span>Message</span><textarea class="in" rows="9">'+E(R.m)+'</textarea></label>'+
    '<div class="hrow wrap" style="--g:6px"><span class="xs mut">Champs automatiques :</span>'+['prénom','montant','numéro de facture','lien de paiement'].map(function(x){return '<span class="chip line">'+x+'</span>'}).join('')+'</div>'+
    '<div class="ar-box list"><div class="li"><div class="grow"><div class="t">Étape active</div><div class="s">Elle s’arrête dès que la facture est payée</div></div>'+U.tog(true)+'</div>'+(k===3?'<div class="li"><div class="grow"><div class="t">Suspendre les réservations en ligne</div><div class="s">Jusqu’au règlement complet</div></div>'+U.tog(true)+'</div>':'')+'</div>',
    foot:'<button class="btn" data-a="test">Recevoir un essai</button><button class="btn pri" data-a="ok">Enregistrer le message</button>'},{test:function(){P.toast('Essai envoyé à claire@ecurie-tilleuls.example',{icon:'mail'})},ok:function(){sh.close();P.toast('Message de l’étape « '+R.t+' » enregistré')}})}
var REL=[
 {j:3,t:'Rappel aimable',c:'E-mail',i:'mail',d:'Un message courtois avec le lien de paiement.',o:'Petit rappel : votre facture des Tilleuls',m:'Bonjour {prénom},\n\nSauf erreur de notre part, la facture {numéro de facture} de {montant} est arrivée à échéance.\n\nVous pouvez la régler en un geste ici : {lien de paiement}\n\nSi le paiement est déjà parti, ne tenez pas compte de ce message.\n\nÀ bientôt aux écuries,\nClaire Morel'},
 {j:10,t:'Deuxième rappel',c:'E-mail et SMS',i:'sms',d:'Le ton reste cordial, le SMS contient le lien.',o:'Votre facture est toujours en attente',m:'Bonjour {prénom},\n\nVotre facture {numéro de facture} de {montant} reste impayée depuis dix jours.\n\nRéglez-la en ligne, ou étalez-la en 3 fois sans frais : {lien de paiement}\n\nUne difficulté ? Répondez à ce message, nous trouverons une solution.\n\nClaire Morel'},
 {j:20,t:'Appel du secrétariat',c:'Tâche pour Nadia',i:'phone',d:'Piaffe crée la tâche et prépare la fiche d’appel.',o:'Appeler {prénom} pour la facture {numéro de facture}',m:'Fiche d’appel préparée pour Nadia :\n\n• Facture {numéro de facture}, {montant}, deux rappels envoyés et ouverts.\n• Proposer le règlement par carte au téléphone ou un échéancier en 3 fois.\n• Noter la réponse dans la fiche de l’adhérent.'},
 {j:30,t:'Mise en demeure',c:'Lettre recommandée électronique',i:'doc',d:'Les réservations en ligne sont suspendues.',o:'Mise en demeure de payer',m:'Madame, Monsieur,\n\nMalgré nos rappels, la facture {numéro de facture} de {montant} reste impayée.\n\nNous vous mettons en demeure de la régler sous huit jours. Passé ce délai, les réservations en ligne seront suspendues.\n\nRèglement immédiat : {lien de paiement}\n\nClaire Morel, gérante'}];
function stage(i){var d=lateDays(i);return d>=30?3:d>=20?2:d>=10?1:d>=3?0:-1}

/* ---------- Onglets de la facturation ---------- */
var FT=[['factures','Factures'],['lot','Facturation du mois'],['encaisser','Encaissements'],['relances','Relances'],['cartes','Échéanciers et cartes'],['tva','TVA et facture électronique']];
function faFactures(){var all=allInv(),q=norm(SF.q),cnt={all:all.length};all.forEach(function(i){var s=i.status==='nouvelle'?'envoyée':i.status;cnt[s]=(cnt[s]||0)+1});
  var rows=all.filter(function(i){return (SF.f==='all'||i.status===SF.f)&&(!q||norm(D.name(i.member)+' '+i.id+' '+i.label).indexOf(q)>=0)}),shown=rows.slice(0,SF.n),lt=late();
  var h='<div class="ar-tb"><div class="search">'+ICON('search','sm')+'<input class="in" id="fa-q" placeholder="Chercher un nom, un numéro…" value="'+E(SF.q)+'" autocomplete="off"></div>'+
    U.seg([['all','Toutes <span class="mut">'+cnt.all+'</span>'],['payée','Payées <span class="mut">'+(cnt['payée']||0)+'</span>'],['envoyée','Envoyées <span class="mut">'+(cnt['envoyée']||0)+'</span>'],['à venir','À venir <span class="mut">'+(cnt['à venir']||0)+'</span>'],['en retard','En retard <span class="mut">'+(cnt['en retard']||0)+'</span>'],['avoir','Avoirs <span class="mut">'+(cnt.avoir||0)+'</span>']],SF.f,'data-ff')+
    '<div class="ar-end hide-s"><button class="btn sm ghost" data-a="export">'+ICON('download','sm')+'Exporter</button></div></div>';
  if(SF.f==='en retard'&&lt.length)h+='<div class="note bad ar-nb" style="margin-bottom:12px;align-items:center">'+ICON('alert','sm')+'<span class="grow">'+lt.length+' factures en retard pour <b>'+F.eur(sum(lt,function(i){return i.amount}))+'</b>. Le scénario de relance s’en occupe, vous pouvez aussi relancer tout de suite.</span><button class="btn sm" data-a="tab" data-k="relances">Voir les relances</button></div>';
  if(!rows.length)return h+'<div class="card">'+U.empty('search','Aucune facture ne correspond','Essayez un autre nom ou retirez le filtre.','<button class="btn sm" data-a="reset">Tout afficher</button>')+'</div>';
  h+='<div class="ar-t">'+tbl([
    {l:'Client',f:function(r){var m=D.member(r.member);return '<div class="ar-who">'+U.av(m)+'<div style="min-width:0"><b>'+m.first+' '+m.last+'</b><span class="s2">'+E(r.label)+'</span></div></div>'}},
    {l:'Numéro',f:function(r){return '<span class="mono">'+r.id+'</span>'}},
    {l:'Émise',c:'ar-h1',f:function(r){return '<span class="mut">'+F.date(r.date)+'</span>'}},
    {l:'Échéance',f:function(r){return r.status==='en retard'?'<span class="badc b">'+lateDays(r)+' j de retard</span>':r.status==='avoir'?'<span class="mut">'+r.ref+'</span>':F.date(r.due)}},
    {l:'Règlement',c:'ar-h1',f:function(r){return '<span class="hrow mut" style="--g:6px">'+ICON(METH[r.method]||'card','sm')+r.method+'</span>'}},
    {l:'Montant',n:1,f:function(r){return '<b>'+eu2(r.amount)+'</b>'}},
    {l:'Statut',f:function(r){return fst(r.status)}}],shown,{act:'inv'})+'</div>';
  h+='<div class="ar-m card">'+shown.map(function(r){var m=D.member(r.member);return '<button class="fa-mi" data-a="inv" data-id="'+r.id+'">'+U.av(m)+'<span class="grow" style="min-width:0"><span class="b s ellip" style="display:block">'+m.first+' '+m.last+'</span><span class="xs mut ellip" style="display:block">'+E(r.label)+'</span></span><span class="r"><b class="s">'+eu2(r.amount)+'</b>'+(r.status==='en retard'?'<span class="chip bad dot">'+lateDays(r)+' j de retard</span>':fst(r.status))+'</span></button>'}).join('')+'</div>';
  h+='<div class="hrow sp" style="margin-top:12px"><span class="xs mut">'+shown.length+' sur '+rows.length+' factures</span>'+(rows.length>shown.length?'<button class="btn sm" data-a="more">Afficher 12 de plus</button>':'')+'</div>';
  return h}
function faLot(){var S=batchStats(),done=SF.batch;
  var h='<div class="ar-cols"><div class="stack" style="--g:14px"><div class="card"><div class="ch"><div><h3>Ce que Piaffe facture pour décembre</h3><div class="xs mut">Calculé à partir des contrats, des forfaits et des prestations saisies en novembre</div></div></div><div class="list" style="padding:6px 0">'+
    [['forfait','Une mensualité par forfait payé en 10 fois','5,5 %'],['pension','Une facture par propriétaire, tous ses chevaux regroupés','20 % et 5,5 %'],['presta','Ferrures, soins, tontes et transports saisis par l’équipe','20 %'],['demi','Part du demi-pensionnaire, reversée au propriétaire','20 %']].map(function(x){var c=CATS.find(function(c){return c[0]===x[0]}),s=S.cat[x[0]];
      return '<div class="li">'+sq(c[3],'acc')+'<div class="grow"><div class="t">'+c[1]+' <span class="mut" style="font-weight:500">· '+s.n+(x[0]==='presta'?' lignes':' factures')+'</span></div><div class="s">'+x[1]+'</div></div><div class="r"><span class="chip line hide-s">TVA '+x[2]+'</span><b class="num">'+F.eur(s.ttc)+'</b>'+U.tog(true)+'</div></div>'}).join('')+'</div>'+
    '<div class="cf"><span class="s mut grow">'+S.n+' factures, <b style="color:var(--ink)">'+F.eur(S.ttc)+'</b> toutes taxes comprises</span>'+(done?'<span class="chip ok dot">Envoyées aujourd’hui à '+done.at+'</span>':'<button class="btn pri" data-a="batch">'+ICON('eye','sm')+'Voir l’aperçu avant envoi</button>')+'</div></div>'+
    '<div class="card"><div class="ch"><h3>À vérifier avant l’envoi</h3><span class="chip '+(CHECKS.every(function(c){return SF.fixed[c.id]})?'ok':'warn')+'">'+CHECKS.filter(function(c){return !SF.fixed[c.id]}).length+' point'+(CHECKS.filter(function(c){return !SF.fixed[c.id]}).length>1?'s':'')+'</span></div><div class="list" style="padding:6px 0">'+
    CHECKS.map(function(c){var ok=SF.fixed[c.id];return '<div class="li ar-ck">'+(ok?sq('check','ok'):sq(c.icon,c.tone))+'<div class="grow"><div class="t">'+c.t+'</div><div class="s">'+(ok?c.done:c.s)+'</div></div><div class="r">'+(ok?'':'<button class="btn sm" data-a="fix" data-id="'+c.id+'">'+c.b+'</button>')+'</div></div>'}).join('')+'</div></div></div>'+
    '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>Réglages de l’envoi</h3></div><div class="list" style="padding:6px 0">'+
    [['Envoi automatique le 25 du mois','À 8 h, pour le mois suivant',1],['Prélèvement le 5','Préavis envoyé avec la facture',1],['Regrouper par famille','Une seule facture pour les frères et sœurs',1],['Prorata des arrivées et des départs','Au jour près pour les pensions',1],['M’envoyer l’aperçu avant chaque lot','Par e-mail, trois jours avant',0]].map(function(x){return '<div class="li"><div class="grow"><div class="t">'+x[0]+'</div><div class="s">'+x[1]+'</div></div>'+U.tog(x[2])+'</div>'}).join('')+'</div></div>'+
    '<div class="card pad stack" style="--g:10px"><div class="hrow">'+sq('trend','ok')+'<div><b class="s">Trois heures gagnées chaque mois</b><div class="xs mut">Durée moyenne d’une facturation manuelle pour 60 factures</div></div></div>'+
    '<div class="hrow sp s"><span class="mut">Lot de novembre</span><b>61 factures, 14 720 €</b></div><div class="hrow sp s"><span class="mut">Payées à l’échéance</span><b class="okc">93 %</b></div></div></div></div>';
  return h}
function faEncaisser(){var M=[['Prélèvement SEPA','bank',19840,212],['Carte bancaire en ligne','card',7120,96],['Carte au terminal de l’accueil','card',2380,41],['Virement','swap',4350,17],['Chèque','sign',3215,24],['Chèques-vacances ANCV','ticket',1020,13],['Espèces','wallet',486,19],['Pass’Sport','medal',700,14]],tot=sum(M,function(m){return m[2]}),cq=D.cheques.filter(function(q){return !q.later}),selq=cq.filter(function(q){return SF.chq[q.id]!==false});
  return '<div class="ar-cols"><div class="card"><div class="ch"><div><h3>Moyens de paiement en novembre</h3><div class="xs mut">'+F.eur(tot)+' encaissés en '+sum(M,function(m){return m[3]})+' paiements</div></div><button class="btn sm" data-a="pay">'+ICON('card','sm')+'Encaisser</button></div><div class="list" style="padding:6px 0">'+
    M.map(function(m){return '<div class="li">'+sq(m[1],'mut')+'<div class="grow stack" style="--g:6px"><div class="hrow sp"><span class="t">'+m[0]+'</span><span class="s"><b class="num">'+F.eur(m[2])+'</b> <span class="mut hide-s">· '+m[3]+' paiements</span></span></div>'+U.bar(m[2]/M[0][2]*100)+'</div></div>'}).join('')+'</div></div>'+
   '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>Prélèvements SEPA</h3>'+U.chip('61 mandats actifs','ok',true)+'</div><div class="cb stack" style="--g:12px"><div class="ar-g2">'+head('prochain prélèvement, le 20 novembre','3 480 €')+head('rejets représentés le 20','2')+'</div>'+
     '<div class="note warn">'+ICON('alert','sm')+'<span>2 mandats attendent une signature. Sans mandat, la facture part avec un lien de paiement.</span></div><div class="hrow wrap"><button class="btn sm" data-a="mandates">Voir les mandats</button><button class="btn sm ghost" data-a="mandate">'+ICON('send','sm')+'Envoyer un mandat</button></div></div></div>'+
   '<div class="card"><div class="ch"><h3>Aides et titres</h3></div><div class="list" style="padding:6px 0"><div class="li">'+sq('medal','acc')+'<div class="grow"><div class="t">Pass’Sport, saison 2026-2027</div><div class="s">14 codes enregistrés, 700 € à se faire rembourser avant le 31 décembre</div></div><div class="r"><button class="btn sm" data-a="pass">Exporter</button></div></div>'+
     '<div class="li">'+sq('ticket','acc')+'<div class="grow"><div class="t">Chèques-vacances ANCV</div><div class="s">640 € remis le 13 novembre, 380 € à envoyer</div></div><div class="r"><button class="btn sm" data-a="ancv">Bordereau</button></div></div></div></div></div></div>'+
   '<div class="ar-g2" style="margin-top:14px"><div class="card"><div class="ch"><div><h3>Chèques à remettre en banque</h3><div class="xs mut">'+(SF.remis?'Remise n° 47 déposée aujourd’hui':'Cochez les chèques de la prochaine remise')+'</div></div></div><div class="list" style="padding:6px 0">'+
     (SF.remis?'':cq.map(function(q){return '<div class="li click" data-a="chq" data-id="'+q.id+'">'+'<button class="chk" role="checkbox" data-manual aria-checked="'+(SF.chq[q.id]!==false)+'"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></button><div class="grow"><div class="t">'+D.name(q.member)+'</div><div class="s">'+q.bank+' · n° '+q.num+'</div></div><b class="num s">'+F.eur(q.amount)+'</b></div>'}).join(''))+
     D.cheques.filter(function(q){return q.later}).map(function(q){return '<div class="li">'+sq('hourglass','mut','sm')+'<div class="grow"><div class="t">'+D.name(q.member)+'</div><div class="s">Chèque différé, à encaisser le '+F.date(q.cash)+'</div></div><b class="num s mut">'+F.eur(q.amount)+'</b></div>'}).join('')+'</div>'+
     (SF.remis?'':'<div class="cf"><span class="s grow"><b class="num">'+F.eur(sum(selq,function(q){return q.amount}))+'</b> <span class="mut">en '+selq.length+' chèques</span></span><button class="btn sm pri" data-a="bord"'+(selq.length?'':' disabled')+'>Générer le bordereau</button></div>')+'</div>'+
   '<div class="card"><div class="ch"><div><h3>Caisse en espèces</h3><div class="xs mut">Journal horodaté et non modifiable</div></div><b class="disp num" style="font-size:20px">312,50 €</b></div><div class="list" style="padding:6px 0">'+
     [['Carte 10 séances, '+D.name(F3[3].id),'aujourd’hui à 9 h 12',145],['Boutique, bombe et gants','hier à 17 h 40',64],['Dépôt en banque','hier à 12 h 05',-400],['Balade en forêt, 3 cavaliers','dimanche à 10 h 02',105]].map(function(x){return '<div class="li"><div class="grow"><div class="t">'+x[0]+'</div><div class="s">'+x[1]+'</div></div><b class="num s '+(x[2]<0?'':'okc')+'">'+(x[2]>0?'+':'')+F.eur(x[2])+'</b></div>'}).join('')+'</div>'+
     '<div class="cf"><span class="s mut grow">Dernière clôture hier à 19 h 10</span><button class="btn sm" data-a="caisse">Clôturer la caisse du jour</button></div></div></div>'}
function faRelances(){var lt=late(),by=[0,0,0,0],wait=0;lt.forEach(function(i){var s=stage(i);if(s<0)wait++;else by[s]++});var todo=lt.filter(function(i){return stage(i)>=0&&!SF.rel[i.id]});
  return '<div class="card" style="margin-bottom:14px"><div class="ch"><div><h3>Scénario de relance gradué</h3><div class="xs mut">Il démarre seul après l’échéance et s’arrête dès que la facture est payée</div></div>'+U.tog(true)+'</div><div class="cb"><div class="fa-steps">'+
    REL.map(function(r,k){return '<button class="fa-step" data-a="step" data-k="'+k+'"><span class="hrow sp"><span class="j">J+'+r.j+'</span>'+(by[k]?'<span class="chip '+(k>1?'bad':'warn')+'">'+by[k]+' en cours</span>':'<span class="chip line">aucune</span>')+'</span><span class="t">'+r.t+'</span><p>'+r.d+'</p><span class="hrow xs mut" style="--g:6px;margin-top:auto">'+ICON(r.i,'sm')+r.c+'</span></button>'}).join('')+'</div></div></div>'+
   '<div class="ar-cols"><div class="card"><div class="ch"><div><h3>Factures en retard</h3><div class="xs mut">'+lt.length+' factures, '+F.eur(sum(lt,function(i){return i.amount}))+'</div></div>'+(todo.length?'<button class="btn sm pri" data-a="relall">'+ICON('send','sm')+'Envoyer les '+todo.length+' relances<span class="hide-s">&nbsp;du jour</span></button>':'<span class="chip ok dot">Relances du jour envoyées</span>')+'</div><div class="list" style="padding:6px 0">'+
    lt.slice().sort(function(a,b){return lateDays(b)-lateDays(a)}).map(function(i){var s=stage(i),m=D.member(i.member);return '<div class="li click" data-a="inv" data-id="'+i.id+'">'+U.av(m)+'<div class="grow"><div class="t">'+m.first+' '+m.last+' <span class="mut" style="font-weight:500">· '+F.eur(i.amount)+'</span></div><div class="s ellip">'+(s<0?'Relance 1 programmée demain à 9 h':lateDays(i)+' j de retard · '+REL[s].t)+'</div></div><div class="r">'+(SF.rel[i.id]?U.chip('relancée aujourd’hui','ok',true):s<0?U.chip('J+'+lateDays(i),'',false):'<button class="btn sm" data-a="rel1" data-id="'+i.id+'">'+(s===2?'Appeler':'Relancer')+'</button>')+'</div></div>'}).join('')+'</div></div>'+
   '<div class="stack" style="--g:14px"><div class="card pad stack" style="--g:14px"><h3 style="font-size:15px">Ce que les relances rapportent</h3><div class="ar-g2">'+head('payées après le premier rappel','71 %')+head('délai moyen de paiement','6,2 jours')+'</div>'+C.bars([2,5,9,6,3,1],['J+3','J+6','J+10','J+15','J+20','J+30'],{h:120,hi:2})+'<div class="xs mut">Factures réglées selon le nombre de jours après l’échéance, sur les trois derniers mois.</div></div>'+
   '<div class="card"><div class="list" style="padding:6px 0"><div class="li"><div class="grow"><div class="t">Épargner les plans d’apurement</div><div class="s">1 famille suit un échéancier, elle n’est pas relancée</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">Prévenir le propriétaire avant la mise en demeure</div><div class="s">Un appel de la gérante trois jours avant</div></div>'+U.tog(true)+'</div></div></div></div></div>'}
function faCartes(){return '<div class="ar-g2"><div class="card"><div class="ch"><div><h3>Échéanciers</h3><div class="xs mut">Paiement en 3, 4 ou 10 fois sans frais</div></div><button class="btn sm" data-a="sched">'+ICON('plus','sm')+'Créer</button></div><div class="list" style="padding:6px 0">'+
    D.schedules.map(function(s){var m=D.member(s.member),pips='';for(var i=0;i<s.n;i++)pips+='<i class="'+(i<s.paid?'on':i===s.paid&&s.state==='rejet'?'bad':'')+'"></i>';
      return '<div class="li">'+U.av(m)+'<div class="grow stack" style="--g:6px"><div class="hrow sp"><span class="t ellip">'+m.first+' '+m.last+'</span><b class="num s">'+F.eur(s.total)+'</b></div><div class="s ellip">'+s.label+' · '+s.mode+'</div><div class="hrow sp wrap" style="--g:8px"><span class="ar-pips">'+pips+'</span><span class="xs '+(s.state==='rejet'?'badc b':'mut')+'">'+(s.state==='rejet'?'Rejet le 5 novembre, représenté le 20':s.paid+' sur '+s.n+' · prochaine le '+F.date(s.next))+'</span></div></div></div>'}).join('')+'</div></div>'+
   '<div class="card"><div class="ch"><div><h3>Cartes de séances prépayées</h3><div class="xs mut">Débitées à la présence, pointée par le moniteur</div></div><button class="btn sm" data-a="card">'+ICON('plus','sm')+'Vendre</button></div><div class="list" style="padding:6px 0">'+
    D.cards.map(function(c){var m=D.member(c.member),low=c.left<=2;return '<div class="li">'+U.ring(c.left/c.total*100,String(c.left),low?'var(--warn)':'var(--acc)',40)+'<div class="grow"><div class="t ellip">'+m.first+' '+m.last+'</div><div class="s ellip">'+c.label+' · '+(c.left?'valable jusqu’au '+F.date(c.until):'épuisée le '+F.date(c.last))+'</div></div><div class="r">'+(low?'<button class="btn sm" data-a="renew" data-id="'+c.id+'"><span class="hide-s">Proposer le renouvellement</span><span class="ar-ps">Renouveler</span></button>':'<span class="xs mut">'+c.left+' séances restantes</span>')+'</div></div>'}).join('')+'</div>'+
    '<div class="cf"><div class="grow"><div class="s b">Proposer le renouvellement à 2 séances restantes</div><div class="xs mut">Notification avec paiement en un geste</div></div>'+U.tog(true)+'</div></div></div>'}
function faTva(){var key=P.prefs.get('fa:cle',30),R=[['Enseignement et pratique de l’équitation','Reprises, forfaits, cartes, stages, cours particuliers','5,5'],['Accès aux installations sportives','Manège, carrières, marcheur, propriétaires extérieurs','5,5'],['Pension, hébergement et soins','Box, nourriture, litière, soins courants','20'],['Prestations refacturées et boutique','Ferrures, transports, tontes, vente de matériel','20'],['Licences FFE et engagements','Débours reversés à l’euro près','0']];
  return '<div class="ar-g2"><div class="card"><div class="ch"><div><h3>TVA ventilée par prestation</h3><div class="xs mut">Le taux est porté par chaque ligne de facture</div></div></div><div class="cb" style="padding-top:6px">'+
    R.map(function(r){return '<div class="fa-rate"><div style="min-width:0"><div class="b s">'+r[0]+'</div><div class="xs mut">'+r[1]+'</div></div><select class="in num" aria-label="Taux de TVA">'+['5,5','10','20','0'].map(function(t){return '<option'+(t===r[2]?' selected':'')+'>'+t+' %</option>'}).join('')+'</select></div>'}).join('')+
    '<div class="ar-soft stack" style="--g:10px;margin-top:12px"><div class="hrow sp"><b class="s">Part « accès aux installations » dans la pension</b><b class="num acc" id="tv-k" style="white-space:nowrap;flex:none">'+key+' %</b></div><input type="range" class="ar-range" id="tv-r" min="0" max="50" step="5" value="'+key+'" aria-label="Clé de ventilation de la pension"><div class="fa-ex" id="tv-ex"></div></div>'+
    '<div class="note warn" style="margin-top:12px">'+ICON('info','sm')+'<span>Ces taux sont un paramétrage proposé, à valider avec votre expert-comptable. Un changement ne réécrit jamais les factures déjà émises.</span></div></div></div>'+
   '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>Facture électronique</h3>'+U.chip('Conforme','ok',true)+'</div><div class="cb"><div class="tl">'+
     '<div class="ev" style="--c:var(--ok)"><div class="s b">Réception obligatoire depuis le 1er septembre 2026</div><div class="xs mut">Active. 14 factures de fournisseurs reçues et rangées dans les justificatifs.</div></div>'+
     '<div class="ev" style="--c:var(--acc)"><div class="s b">Émission obligatoire le 1er septembre 2027</div><div class="xs mut">Prête. Vos factures sortent déjà au format Factur-X et partiront par une plateforme agréée.</div></div>'+
     '<div class="ev" style="--c:var(--acc);padding-bottom:0"><div class="s b">Ventes aux particuliers</div><div class="xs mut">Piaffe transmettra les montants globalisés à la même date, sans nom de client.</div></div></div>'+
     '<div class="hrow wrap" style="--g:6px;margin-top:14px">'+['Factur-X','UBL','CII','Numérotation continue','Archivage dix ans'].map(function(x){return '<span class="chip line">'+x+'</span>'}).join('')+'</div></div>'+
     '<div class="cf">'+sq('plug','ok','sm')+'<span class="s grow"><b>Plateforme agréée connectée</b> <span class="mut">· synchronisée il y a 12 min</span></span><button class="btn sm ghost" data-go="connecteurs">Gérer'+ICON('arrow','sm')+'</button></div></div>'+
   '<div class="card"><div class="ch"><div><h3>TVA collectée en novembre</h3><div class="xs mut">Du 1er au 17, sur les factures émises</div></div><button class="btn sm ghost" data-go="compta" data-p-tab="tva">Déclaration'+ICON('arrow','sm')+'</button></div><div class="cb stack" style="--g:12px">'+
     [['5,5 %','Enseignement et installations',18420,1013,'var(--c1)'],['20 %','Pensions et prestations',11260,2252,'var(--c2)']].map(function(x){return '<div class="stack" style="--g:6px"><div class="hrow sp s"><span><b>'+x[0]+'</b> <span class="mut">· '+x[1]+'</span></span><span class="num"><span class="mut hide-s">base '+F.eur(x[2])+' · </span><b>'+F.eur(x[3])+'</b></span></div>'+U.bar(x[3]/2252*100,x[4])+'</div>'}).join('')+'</div></div></div></div>'}

P.mod({id:'facturation',role:'gerant',group:'Argent',title:'Facturation',icon:'invoice',n:10,phoneTitle:'Facturation',
 badge:function(){var n=late().length;return n?{v:n,hot:true}:null},
 render:function(el,ctx){syncB();
  if(ctx.params.tab){SF.tab=ctx.params.tab;ctx.params.tab=null}
  var S=batchStats(),lt=late(),ltS=sum(lt,function(i){return i.amount}),due=allInv().filter(function(i){return i.status==='envoyée'||i.status==='à venir'}),dueS=sum(due,function(i){return i.amount}),cash=31846+SF.cash;
  var hero=SF.batch?'<div class="card fa-hero ok"><div><div class="hrow"><span class="strass"></span><span class="eyebrow">Facturation de décembre</span></div><h2>Décembre est facturé : '+S.n+' factures envoyées pour '+F.eur(S.ttc)+'.</h2><p class="s mut">Envoyées aujourd’hui à '+SF.batch.at+'. '+S.sepa.length+' prélèvements partiront le 5 décembre.</p><div class="hrow wrap" style="margin-top:14px"><button class="btn" data-a="batch">Voir le récapitulatif</button><button class="btn ghost" data-a="tab" data-k="lot">Réglages du lot'+ICON('arrow','sm')+'</button></div></div>':
   '<div class="card fa-hero"><div><div class="hrow"><span class="strass"></span><span class="eyebrow">Facturation de décembre, préparée par Piaffe</span></div><h2>'+S.n+' factures sont prêtes pour '+F.eur(S.ttc)+'.</h2><p class="s mut">Forfaits, pensions, demi-pensions et prestations de novembre refacturées. Envoi automatique le 25 novembre, prélèvement le 5 décembre.</p><div class="hrow wrap" style="margin-top:14px"><button class="btn pri" data-a="batch">'+ICON('eye','sm')+'Vérifier et envoyer</button><button class="btn ghost" data-a="tab" data-k="lot">'+CHECKS.filter(function(c){return !SF.fixed[c.id]}).length+' points à vérifier'+ICON('arrow','sm')+'</button></div></div>';
  hero+='<div><div class="fa-split">'+CATS.map(function(c,i){return '<i style="--c:'+c[2]+';--v:'+Math.round(S.cat[c[0]].ttc)+';--i:'+i+'"></i>'}).join('')+'</div><div class="fa-cats">'+CATS.map(function(c){var s=S.cat[c[0]];return '<div class="fa-cat"><i style="--c:'+c[2]+'"></i><span class="ellip">'+c[1]+'</span><span class="n">'+s.n+'</span><b>'+F.eur(s.ttc)+'</b></div>'}).join('')+'</div></div></div>';
  el.innerHTML='<div class="ar-hd">'+U.ph('Facturation','Novembre 2026 · '+F.eur(cash)+' encaissés, '+F.eur(dueS)+' à venir, '+F.eur(ltS)+' en retard',
    '<button class="btn" data-a="pay">'+ICON('card','sm')+'Encaisser un paiement</button><button class="btn" data-a="new">'+ICON('plus','sm')+'Nouvelle facture</button>')+'</div>'+hero+
   '<div class="ar-k4 rise">'+K({label:'Encaissé en novembre',count:cash,fmt:'eur',value:F.eur(cash),delta:'+6,2 %',dsub:' vs octobre',spark:[21,24,22,27,26,30,29,32],icon:'checkc'})+
    K({label:'À venir',count:dueS,fmt:'eur',value:F.eur(dueS),delta:due.length+' factures',tone:'acc',di:'clock',dsub:' non échues',spark:[5,6,4,7,6,8,7,9],icon:'clock'})+
    K({label:'En retard',count:ltS,fmt:'eur',value:F.eur(ltS),delta:lt.length+' factures',up:false,dsub:' relancées',spark:[9,8,9,7,8,6,7,6],color:'var(--bad)',icon:'alert'})+
    K({label:'Payé à l’échéance',count:93,unit:'%',delta:'+4 pts',dsub:' depuis le prélèvement',spark:[84,85,88,87,90,91,92,93],color:'var(--ok)',icon:'trend'})+'</div>'+
   tabsBar(FT,SF.tab,'data-ft')+'<div id="fa-body"></div>'+
   '<div class="ar-cta"><button class="btn pri" data-a="pay">'+ICON('card')+'Encaisser un paiement</button><button class="btn icon" data-a="new" title="Nouvelle facture">'+ICON('plus')+'</button></div>';
  var body=el.querySelector('#fa-body');
  function draw(anim){var f={factures:faFactures,lot:faLot,encaisser:faEncaisser,relances:faRelances,cartes:faCartes,tva:faTva}[SF.tab]||faFactures;body.innerHTML=f();body.className=anim?'fade':'';P.animate(body);syncB();
    var q=body.querySelector('#fa-q');if(q)q.oninput=function(){SF.q=q.value;SF.n=12;var p=q.selectionStart;draw();var n=body.querySelector('#fa-q');n.focus();n.setSelectionRange(p,p)};
    var r=body.querySelector('#tv-r');if(r){var ex=function(){var k=+r.value,a=520*k/100,b=520-a,tva=a-a/1.055+b-b/1.2;body.querySelector('#tv-k').textContent=k+' %';body.querySelector('#tv-ex').innerHTML=head('TVA sur une pension de 520 €',F.eur(tva,true))+head('de TVA en moins qu’à 20 % partout',F.eur(520-520/1.2-tva,true))};ex();r.oninput=function(){P.prefs.set('fa:cle',+r.value);ex()}}}
  function setTab(k){SF.tab=k;P.$$('[data-ft]',el).forEach(function(b){b.setAttribute('aria-selected',b.getAttribute('data-ft')===k)});draw(true)}
  draw();
  el.addEventListener('click',function(e){var t=e.target.closest('[data-ft]');if(t){SF.tab=t.getAttribute('data-ft');draw(true);return}var f=e.target.closest('[data-ff]');if(f){SF.f=f.getAttribute('data-ff');SF.n=12;draw()}});
  on(el,{
   tab:function(b){setTab(b.getAttribute('data-k'));el.querySelector('.ar-tabs').scrollIntoView({block:'start',behavior:P.RM?'auto':'smooth'})},
   batch:function(){openBatch()},pay:function(){openPay()},new:function(){openNew()},
   inv:function(b,e){if(e.target.closest('[data-a="rel1"]'))return;openInvoice(b.getAttribute('data-id'))},
   more:function(){SF.n+=12;draw()},reset:function(){SF.q='';SF.f='all';draw()},
   export:function(){P.toast('Export des factures prêt : factures-novembre-2026.csv',{icon:'download'})},
   fix:function(b){SF.fixed[b.getAttribute('data-id')]=1;draw();P.toast('Point réglé, la facture est mise à jour')},
   mandates:function(){openMandates()},mandate:function(){P.toast('Lien de signature du mandat envoyé par e-mail et SMS',{icon:'send'})},
   pass:function(){P.toast('Liste des 14 codes Pass’Sport exportée pour Le Compte Asso',{icon:'download'})},ancv:function(){P.toast('Bordereau ANCV de 380 € prêt à imprimer',{icon:'download'})},
   chq:function(b){var id=b.getAttribute('data-id');SF.chq[id]=SF.chq[id]===false;draw()},bord:function(){openBordereau()},
   caisse:function(b){b.outerHTML=U.chip('Caisse clôturée à 9 h 41','ok',true);P.toast('Caisse clôturée : 312,50 € comptés, aucun écart')},
   step:function(b){openStep(+b.getAttribute('data-k'))},
   rel1:function(b){var i=inv(b.getAttribute('data-id'));SF.rel[i.id]=1;draw();P.toast(stage(i)===2?'Tâche d’appel créée pour Nadia':'Relance envoyée à '+D.member(i.member).first,{icon:'send'})},
   relall:function(){var l=late().filter(function(i){return stage(i)>=0&&!SF.rel[i.id]});l.forEach(function(i){SF.rel[i.id]=1});draw();P.toast(l.length+' relances parties : e-mails, SMS et tâches d’appel pour Nadia',{icon:'send',undo:function(){l.forEach(function(i){delete SF.rel[i.id]});draw()}})},
   sched:function(){openSchedule()},card:function(){openNew()},
   renew:function(b){b.outerHTML=U.chip('proposition envoyée','ok',true);P.toast('Proposition de renouvellement envoyée avec paiement en un geste',{icon:'send'})}
  });
 }});

/* =====================================================================
   COMPTABILITÉ
   ===================================================================== */
P.css(`
.cp-rw{display:grid;grid-template-rows:1fr;transition:grid-template-rows .36s var(--e-in-out),opacity .3s}
.cp-rw.gone{grid-template-rows:0fr;opacity:0}
.cp-rw>div{overflow:hidden;min-height:0}
.cp-rc{display:grid;grid-template-columns:minmax(0,1fr) 54px minmax(0,1.2fr) auto;gap:12px;align-items:center;padding:14px 16px;border-top:1px solid var(--line);transition:background var(--t-3)}
.cp-rw:first-child .cp-rc{border-top:0}
.cp-rc.ok{background:var(--ok-pale)}
.cp-b{display:flex;flex-direction:column;gap:2px;min-width:0}
.cp-s{padding:9px 12px;border-radius:var(--r-md);background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);display:flex;gap:10px;align-items:center;min-width:0}
.cp-rc.ok .cp-s{background:var(--surface)}
.cp-lnk{display:flex;flex-direction:column;align-items:center;gap:3px;color:var(--acc);font:600 11px var(--f-mono)}
.cp-act{display:flex;gap:6px}
.cp-op{display:grid;grid-template-columns:minmax(0,1fr) auto 22px 108px;gap:12px;align-items:center;padding:10px 16px;width:100%;text-align:left;transition:background var(--t-1)}
.cp-op:hover{background:var(--surface-2)}
.cp-op+.cp-op{border-top:1px solid var(--line)}
.cp-op.new{animation:cpFlash 1.6s var(--e-out)}
@keyframes cpFlash{from{background:var(--ok-pale)}}
.cp-acc{display:flex;align-items:center;gap:12px;padding:12px 16px}
.cp-acc+.cp-acc{border-top:1px solid var(--line)}
.cp-ch{position:relative;height:280px;touch-action:pan-y}
.cp-ch svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible}
.cp-ch text{font:500 10.5px var(--f-text);fill:var(--mut)}
.cp-ch .fc{animation:fade .9s var(--e-out) .5s both}
.cp-tip{position:absolute;top:0;left:0;pointer-events:none;padding:6px 10px;border-radius:9px;background:var(--navy);color:var(--navy-ink);font-size:12px;line-height:1.3;white-space:nowrap;opacity:0;transition:opacity var(--t-1);z-index:2;box-shadow:var(--shadow-2)}
.cp-tip b{display:block;font-variant-numeric:tabular-nums;font-size:13px}
.cp-pr{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(50px,1fr) 96px 64px;gap:12px;align-items:center;padding:8px 0;font-size:13px}
.cp-pr.h{padding:14px 0 4px}
.cp-pr.tot{border-top:1.5px solid var(--ink);font-weight:700;margin-top:6px;padding-top:11px}
.cp-pr .n{text-align:right;font-variant-numeric:tabular-nums}
.cp-bil{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px}
.cp-bl{display:flex;justify-content:space-between;gap:10px;padding:7px 0;font-size:13px}
.cp-bl+.cp-bl{border-top:1px solid var(--line)}
.cp-bl.tot{border-top:1.5px solid var(--ink);font-weight:700;margin-top:4px;padding-top:10px}
.cp-bd{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(80px,1.4fr) 150px 74px;gap:14px;align-items:center;padding:10px 0;font-size:13px}
.cp-bd+.cp-bd{border-top:1px solid var(--line)}
.cp-trk{position:relative;height:8px;border-radius:99px;background:var(--bg-2)}
.cp-trk i{position:absolute;left:0;top:0;bottom:0;border-radius:inherit;background:var(--c);width:var(--v);transition:width .8s var(--e-out)}
.cp-trk::after{content:"";position:absolute;left:76.9%;top:-4px;bottom:-4px;width:2px;background:var(--ink);border-radius:1px}
.cp-tv{display:flex;justify-content:space-between;gap:12px;padding:9px 0;font-size:13px;align-items:baseline}
.cp-tv+.cp-tv{border-top:1px solid var(--line)}
.cp-tv.tot{border-top:1.5px solid var(--ink);margin-top:4px;padding-top:12px;font-weight:700}
.cp-jg{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.cp-j{display:flex;flex-direction:column;text-align:left;overflow:hidden;width:100%}
.cp-th{height:100px;background:var(--bg-2);display:grid;place-items:start center;position:relative;overflow:hidden;border-radius:var(--r-lg) var(--r-lg) 0 0}
.cp-tk{width:78px;height:120px;margin-top:22px;background:var(--surface);border-radius:4px;box-shadow:var(--shadow-2);padding:10px 9px;display:flex;flex-direction:column;gap:5px;transform:rotate(-3deg)}
.cp-tk i{height:3px;border-radius:2px;background:var(--line-2);display:block}
.cp-tk b{height:5px;width:62%;background:var(--ink-2);border-radius:2px;display:block;margin-bottom:3px}
.cp-drop{border-radius:var(--r-lg);box-shadow:inset 0 0 0 1.5px var(--acc-line);background:var(--acc-pale);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;text-align:center;padding:18px 14px;min-height:178px;transition:transform var(--t-2) var(--e-out);width:100%}
.cp-drop:hover{transform:translateY(-2px)}
.cp-scan{position:relative;background:var(--bg-2);border-radius:var(--r-lg);padding:22px 14px;display:grid;place-items:center;overflow:hidden;min-height:330px}
.cp-rcpt{width:206px;background:var(--surface);border-radius:6px;box-shadow:var(--shadow-3);padding:16px 14px;font:500 10.5px/1.55 var(--f-mono);color:var(--ink-2);transform:rotate(-2deg)}
.cp-rcpt .r{display:flex;justify-content:space-between;gap:8px}
.cp-rcpt hr{border:0;border-top:1px dashed var(--line-2);margin:7px 0}
.cp-beam{position:absolute;left:0;right:0;height:60px;top:-62px;background:linear-gradient(transparent,color-mix(in srgb,var(--acc) 28%,transparent));border-bottom:2px solid var(--acc);animation:cpBeam 1.3s var(--e-in-out) 2 both}
@keyframes cpBeam{to{top:100%}}
.cp-sc{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:18px;align-items:start}
.cp-fd{display:flex;justify-content:space-between;gap:12px;align-items:center;padding:10px 0;font-size:13px;opacity:0;transform:translateY(6px);transition:opacity var(--t-3) var(--e-out),transform var(--t-3) var(--e-out)}
.cp-fd+.cp-fd{border-top:1px solid var(--line)}
.cp-fd.on{opacity:1;transform:none}
.cp-fd b{text-align:right}
.cp-cn{display:flex;align-items:center;gap:12px;padding:12px 16px}
.cp-cn+.cp-cn{border-top:1px solid var(--line)}
.cp-lg{width:36px;height:36px;border-radius:10px;display:grid;place-items:center;font:700 13px var(--f-display);background:var(--bg-2);color:var(--ink-2);flex:none}
@container main (max-width:1080px){.cp-jg{grid-template-columns:repeat(3,minmax(0,1fr))}}
@container main (max-width:760px){
 .cp-rc{grid-template-columns:minmax(0,1fr);gap:10px}.cp-lnk{flex-direction:row;gap:8px}.cp-act .btn.pri{flex:1;height:40px}.cp-act .btn.icon{height:40px;width:40px}
 .cp-jg{grid-template-columns:repeat(2,minmax(0,1fr))}.cp-bil{grid-template-columns:minmax(0,1fr);gap:18px}
 .cp-bd{grid-template-columns:minmax(0,1fr) auto;gap:6px 12px}.cp-bd .cp-trk{grid-column:1/-1;order:3}
 .cp-ch{height:230px}
}
.cp-op.cp-ev{grid-template-columns:54px minmax(0,1fr) auto 100px}
@container main (max-width:620px){.cp-op.cp-ev{grid-template-columns:50px minmax(0,1fr) auto}.cp-op{grid-template-columns:minmax(0,1fr) auto}.cp-op .x{display:none}.cp-pr{grid-template-columns:minmax(0,1fr) 92px 58px}.cp-pr .bx{display:none}}
@container arsh (max-width:560px){.cp-sc{grid-template-columns:minmax(0,1fr)}.cp-scan{min-height:250px;padding:14px}.cp-rcpt{width:190px;font-size:10px}}
`);
var SC={tab:'banque',done:{},just:null,scen:'prevu',per:'m',jr:'VT',cat:{},q:{},fec:false,cnx:{Pennylane:1},tvaSent:false,scanned:false};
var BANK=D.bank.concat([
 {d:iso(-6),label:'VIR SALAIRES OCTOBRE · 8 bénéficiaires',amount:-14180,cat:'Salaires',matched:true},
 {d:iso(-7),label:'LOYER SCI DES TILLEULS',amount:-2400,cat:'Loyer',matched:true},
 {d:iso(-7),label:'PRLV ÉCHÉANCE PRÊT MANÈGE',amount:-1850,cat:'Emprunt',matched:true},
 {d:iso(-8),label:'CB STATION DU ROND-POINT RAMBOUILLET',amount:-86.4,cat:'Carburant',matched:true,nojust:true}]);
var BCATS=['Forfaits','Pensions','Ventes en ligne','Foin et paille','Litière','Sellerie','Vétérinaire','Maréchalerie','Salaires','Charges sociales','Énergie','Carburant','Loyer','Emprunt','Entretien','Divers'];
function unmatched(){return BANK.filter(function(b){return !b.matched})}
function bkey(b){return BANK.indexOf(b)}
function bal(){return 48320.18}

/* Trésorerie : flux datés, du passé récent à 90 jours */
function flow(o,sc){var d=D.day(o),dom=d.getDate(),dow=d.getDay(),mo=d.getMonth(),last=D.day(o+1).getDate()===1,i=0,x=0,S=batchStats();
  var hol=(mo===11&&dom>=19)||(mo===0&&dom<=3);
  i+=(dow===0?260:dow===6?1150:720)*(hol?.45:1)*(1+.18*Math.sin(o*1.7));
  if(dom===5)i+=Math.round(S.sepaSum/10)*10;if(dom===20)i+=3480;if(dom===1)i+=6800;
  x+=95;if(last)x+=14200;if(dom===15)x+=5120;if(dom===1)x+=2400;if(dom===10)x+=1850;if(dom===24)x+=mo===10?2890:mo===11?2610:3050;
  if(((o+8)%21+21)%21===0)x+=3840;if(dom===8)x+=960;if(dom===12)x+=640;if(dom===18)x+=1380;if(mo===0&&dom===2)x+=4600;
  if(sc==='prudent'&&o>0){i*=.9;x*=1.05}
  if(sc==='herse'&&mo===11&&dom===15)x+=5400;
  return i-x}
function tseries(sc){var a=[],b=bal(),o;for(o=1;o<=90;o++){b+=flow(o,sc);a.push({o:o,v:b})}var p=[],c=bal();p.push({o:0,v:c});for(o=0;o>-30;o--){c-=flow(o,'prevu');p.unshift({o:o-1,v:c})}return p.concat(a)}
function drawTreso(box){var W=box.clientWidth||600,H=box.clientHeight||280,S=tseries(SC.scen),pl=40,pr=10,pt=18,pb=24,mx=Math.ceil(Math.max.apply(null,S.map(function(s){return s.v}))*1.12/10000)*10000,n=S.length;
  var X=function(o){return pl+(o+30)/120*(W-pl-pr)},Y=function(v){return pt+(1-v/mx)*(H-pt-pb)},g='',k;
  for(k=0;k<=4;k++){var v=mx*k/4;g+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(v)+'" y2="'+Y(v)+'" stroke="var(--line)"/><text x="'+(pl-8)+'" y="'+(Y(v)+3.5)+'" text-anchor="end">'+Math.round(v/1000)+' k</text>'}
  S.forEach(function(s){var d=D.day(s.o);if(d.getDate()===1)g+='<text x="'+X(s.o)+'" y="'+(H-6)+'" text-anchor="middle">1er '+['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'][d.getMonth()]+'</text><line x1="'+X(s.o)+'" x2="'+X(s.o)+'" y1="'+(H-pb)+'" y2="'+(H-pb+4)+'" stroke="var(--line-2)"/>'});
  var past=S.filter(function(s){return s.o<=0}),fut=S.filter(function(s){return s.o>=0}),P1=function(a){return 'M'+a.map(function(s){return X(s.o).toFixed(1)+' '+Y(s.v).toFixed(1)}).join('L')};
  var band='M'+fut.map(function(s){return X(s.o).toFixed(1)+' '+Y(s.v*(1+.0012*s.o)).toFixed(1)}).join('L')+'L'+fut.slice().reverse().map(function(s){return X(s.o).toFixed(1)+' '+Y(s.v*(1-.0018*s.o)).toFixed(1)}).join('L')+'Z';
  var low=fut.slice(1).reduce(function(a,s){return s.v<a.v?s:a},fut[1]),thr=20000;
  g+='<line x1="'+pl+'" x2="'+(W-pr)+'" y1="'+Y(thr)+'" y2="'+Y(thr)+'" stroke="var(--warn)" stroke-dasharray="3 4" stroke-width="1.2"/><text x="'+(W-pr)+'" y="'+(Y(thr)+13)+'" text-anchor="end" style="fill:var(--warn)">Seuil d’alerte 20 000 €</text>';
  g+='<path d="'+P1(past)+'L'+X(0)+' '+Y(0)+'L'+X(-30)+' '+Y(0)+'Z" fill="var(--acc)" opacity=".12"/><path class="fc" d="'+band+'" fill="var(--acc)" opacity=".1"/>';
  g+='<path class="ln draw" d="'+P1(past)+'" stroke="var(--acc)" style="--len:900"/><path class="fc" d="'+P1(fut)+'" fill="none" stroke="var(--acc)" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/>';
  g+='<line x1="'+X(0)+'" x2="'+X(0)+'" y1="'+pt+'" y2="'+(H-pb)+'" stroke="var(--ink)" stroke-width="1" opacity=".35"/><circle cx="'+X(0)+'" cy="'+Y(bal())+'" r="4.5" fill="var(--surface)" stroke="var(--acc)" stroke-width="2"/><text x="'+(X(0)+7)+'" y="'+(pt-5)+'" style="fill:var(--ink);font-weight:600">Aujourd’hui</text>';
  var lx=X(low.o),anc=lx>W-130?'end':'start';
  g+='<g class="fc"><circle cx="'+lx+'" cy="'+Y(low.v)+'" r="4.5" fill="var(--surface)" stroke="var(--warn)" stroke-width="2"/><text x="'+(lx+(anc==='end'?-9:9))+'" y="'+(Y(low.v)+16)+'" text-anchor="'+anc+'" style="fill:var(--ink);font-weight:600">Point bas '+F.eur(Math.round(low.v/10)*10)+'</text></g>';
  g+='<g id="cp-x" style="display:none"><line y1="'+pt+'" y2="'+(H-pb)+'" stroke="var(--ink)" stroke-width="1" stroke-dasharray="2 3"/><circle r="4.5" fill="var(--acc)" stroke="var(--surface)" stroke-width="2"/></g>';
  box.innerHTML='<svg class="chart" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Trésorerie prévisionnelle à 90 jours">'+g+'</svg><div class="cp-tip"></div>';
  var cx=box.querySelector('#cp-x'),tip=box.querySelector('.cp-tip');
  function mv(e){var r=box.getBoundingClientRect(),px=(e.clientX-r.left)*W/r.width,o=Math.round((px-pl)/(W-pl-pr)*120-30);o=Math.max(-30,Math.min(90,o));var s=S[o+30];if(!s)return;cx.style.display='';cx.setAttribute('transform','translate('+X(s.o)+',0)');cx.querySelector('circle').setAttribute('cy',Y(s.v));
    tip.innerHTML=F.dateL(D.iso(D.day(s.o)))+(s.o>0?' · prévision':'')+'<b>'+F.eur(Math.round(s.v))+'</b>';tip.style.opacity=1;var tx=Math.max(70,Math.min(r.width-70,X(s.o)*r.width/W));tip.style.transform='translate(calc('+tx+'px - 50%),'+Math.max(0,Y(s.v)*r.height/H-58)+'px)'}
  box.onpointermove=mv;box.onpointerdown=mv;box.onpointerleave=function(){cx.style.display='none';tip.style.opacity=0};
  return {low:low,end:S[n-1].v}}

var PNL={pr:[['Enseignement, forfaits et cartes',21300,8.1],['Pensions et demi-pensions',15240,2.4],['Stages et concours',6480,21.5],['Coaching et prestations',3900,-3.2],['Boutique et divers',2680,5.0]],
         ch:[['Salaires et charges sociales',19320,3.1],['Alimentation et litière',6840,9.4],['Soins, vétérinaire et maréchal',2710,-6.0],['Énergie, eau et carburant',1930,-8.2],['Loyer, assurances et entretien',3950,1.5],['Amortissements et intérêts',2650,0]]};
var BUD=[['Enseignement',20500,21300,1],['Pensions',15600,15240,1],['Stages et concours',5000,6480,1],['Salaires et charges',19500,19320,0],['Alimentation et litière',6200,6840,0],['Soins',2400,2710,0],['Énergie et carburant',2100,1930,0]];
var ACC={'411000':'Clients','401000':'Fournisseurs','512000':'Banque, compte courant','530000':'Caisse','706100':'Enseignement','706200':'Pensions','706300':'Accès aux installations','708000':'Prestations annexes','467000':'Débours à reverser','445711':'TVA collectée 5,5 %','445712':'TVA collectée 20 %','445660':'TVA déductible','601200':'Fourrages et litière','606300':'Petit équipement','622600':'Honoraires vétérinaires','606100':'Électricité','615000':'Entretien, maréchalerie','431000':'Organismes sociaux','421000':'Salaires à payer','613200':'Loyer','164000':'Emprunts'};
function journal(k){var R=[];function w(d,p,c,l,db,cr){R.push({d:d,p:p,c:c,l:l,db:db,cr:cr})}
  if(k==='VT')D.invoices.slice().sort(function(a,b){return a.date<b.date?1:-1}).slice(0,5).forEach(function(v){var L=invLines(v);w(v.date,v.id,'411000',D.name(v.member),v.amount,0);
    L.forEach(function(l){var c=l.rate===0?'467000':/Accès/.test(l.lab)?'706300':/Pension/.test(l.lab)?'706200':l.rate===5.5?'706100':'708000';w(v.date,v.id,c,l.lab.split(',')[0],0,l.ht);if(l.rate)w(v.date,v.id,l.rate===5.5?'445711':'445712','TVA '+String(l.rate).replace('.',',')+' %',0,l.tva)})});
  if(k==='AC')D.receipts.slice(0,5).forEach(function(r,i){var ht=r.amount/(1+r.vat/100),c=['606300','601200','622600','606100','615000'][i],p='FA-'+(2611-i*7);w(r.date,p,c,r.label,ht,0);w(r.date,p,'445660','TVA déductible '+r.vat+' %',r.amount-ht,0);w(r.date,p,'401000',r.who,0,r.amount)});
  if(k==='BQ')BANK.filter(function(b){return b.matched}).slice(0,7).forEach(function(b,i){var a=Math.abs(b.amount),c=b.amount>0?'411000':/URSSAF/.test(b.label)?'431000':/SALAIRES/.test(b.label)?'421000':/LOYER/.test(b.label)?'613200':/PRÊT/.test(b.label)?'164000':'401000',p='BQ-11-'+String(42-i).padStart(3,'0');
    w(b.d,p,'512000',b.label,b.amount>0?a:0,b.amount>0?0:a);w(b.d,p,c,ACC[c],b.amount>0?0:a,b.amount>0?a:0)});
  if(k==='CA')[[0,'Carte 10 séances',145,'706100',5.5],[-1,'Vente boutique',64,'708000',20],[-5,'Balade en forêt',105,'706100',5.5]].forEach(function(x,i){var ht=x[2]/(1+x[4]/100),p='CA-11-0'+(18-i);w(iso(x[0]),p,'530000',x[1],x[2],0);w(iso(x[0]),p,x[3],ACC[x[3]],0,ht);w(iso(x[0]),p,x[4]===5.5?'445711':'445712','TVA '+String(x[4]).replace('.',',')+' %',0,x[2]-ht)});
  return R}
var GL=[['411000',52840,46086],['401000',21310,36230],['512000',61420,13100],['530000',1214,902],['706100',0,20190],['706200',0,9930],['706300',0,3110],['708000',0,3696],['445711',0,1282],['445712',0,2725],['445660',2384,0],['601200',6484,0],['622600',2258,0],['606100',1608,0]];

function cpBanque(){var un=unmatched(),h='<div class="ar-cols"><div class="stack" style="--g:14px">';
  if(un.length)h+='<div class="card"><div class="ch"><div><h3>'+un.length+' opération'+(un.length>1?'s':'')+' à rapprocher</h3><div class="xs mut">Piaffe a trouvé la pièce qui correspond. Un geste suffit pour valider.</div></div><button class="btn sm pri" data-a="matchall">'+ICON('check','sm')+'Tout valider</button></div><div style="padding-top:12px" id="cp-un">'+
    un.map(function(b){var s=D.bankSuggest[b.label]||{doc:'Aucune pièce trouvée',src:'Ajoutez un justificatif',conf:0,acc:'',icon:'doc'};
      return '<div class="cp-rw" data-k="'+bkey(b)+'"><div><div class="cp-rc"><div class="cp-b"><span class="xs mut">Banque · '+F.rel(b.d)+'</span><b class="ellip">'+E(b.label)+'</b><span class="b num '+(b.amount>0?'okc':'')+'">'+(b.amount>0?'+':'')+F.eur(b.amount,true)+'</span></div>'+
       '<div class="cp-lnk">'+ICON('link')+'<span>'+s.conf+' %</span></div><div class="cp-s">'+sq(s.icon,'acc','sm')+'<div style="min-width:0"><b class="s ellip" style="display:block">'+s.doc+'</b><span class="xs mut ellip" style="display:block">'+s.src+'</span><span class="xs mut2 mono ellip" style="display:block;font-size:11px">'+s.acc+'</span></div></div>'+
       '<div class="cp-act"><button class="btn sm pri" data-a="match">Valider</button><button class="btn sm icon" data-a="other" title="Choisir une autre pièce">'+ICON('more','sm')+'</button></div></div></div></div>'}).join('')+'</div></div>';
  else h+='<div class="card"><div class="ar-done"><span class="orb">'+tick()+'<span class="strass"></span></span><h3>Tout est rapproché</h3><p class="s mut" style="max-width:420px">Chaque opération de novembre a sa pièce et sa catégorie. Votre comptabilité est à jour au 17 novembre, 9 h 41.</p><button class="btn sm" data-a="tab" data-k="ecritures">Voir les écritures'+ICON('arrow','sm')+'</button></div></div>';
  var ok=BANK.filter(function(b){return b.matched});
  h+='<div class="card"><div class="ch"><div><h3>Opérations rapprochées</h3><div class="xs mut">Touchez une opération pour changer sa catégorie : Piaffe retient la règle</div></div><span class="chip ok dot hide-s">'+(124-unmatched().length)+' ce mois-ci</span></div><div style="padding:8px 0 4px">'+
    ok.sort(function(a,b){return (b.at||0)-(a.at||0)||(a.d<b.d?1:a.d>b.d?-1:0)}).map(function(b){var k=bkey(b),cat=SC.cat[k]||b.cat;return '<button class="cp-op'+(b.at&&Date.now()-b.at<2500?' new':'')+'" data-a="cat" data-k="'+k+'"><span style="min-width:0"><b class="s ellip" style="display:block">'+E(b.label)+'</b><span class="xs mut">'+F.date(b.d)+' · '+cat+(b.nojust&&!SC.scanned?' · <span class="warnc b">justificatif manquant</span>':'')+'</span></span><span class="chip x">'+cat+'</span><span class="x '+(b.nojust&&!SC.scanned?'warnc':'mut')+'" title="'+(b.nojust&&!SC.scanned?'Justificatif manquant':'Justificatif joint')+'">'+ICON(b.nojust&&!SC.scanned?'alert':'attach','sm')+'</span><b class="num s '+(b.amount>0?'okc':'')+'" style="text-align:right">'+(b.amount>0?'+':'')+F.eur(b.amount,true)+'</b></button>'}).join('')+'</div></div></div>';
  h+='<div class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>Comptes</h3><span class="xs mut hrow" style="--g:5px">'+ICON('refresh','sm')+'il y a 4 min</span></div><div style="padding-top:8px">'+
    [['bank','Compte courant','Crédit Agricole · FR76 •••• 8912',48320.18],['shield','Livret professionnel','Crédit Agricole · réserve de sécurité',25000],['wallet','Caisse en espèces','Clôturée hier à 19 h 10',312.5]].map(function(a){return '<div class="cp-acc">'+sq(a[0],'mut')+'<div class="grow"><div class="b s">'+a[1]+'</div><div class="xs mut ellip">'+a[2]+'</div></div><b>'+eu2(a[3])+'</b></div>'}).join('')+'</div>'+
    '<div class="cf"><span class="s mut grow">Synchronisation bancaire sécurisée, en lecture seule</span><button class="btn sm ghost" data-a="sync">'+ICON('refresh','sm')+'Actualiser</button></div></div>'+
   '<div class="card"><div class="ch"><div><h3>Dépenses de novembre</h3><div class="xs mut">Classées automatiquement par catégorie</div></div></div><div class="cb hrow" style="--g:18px">'+C.donut([{v:19320,c:'var(--c2)'},{v:6840,c:'var(--c1)'},{v:2710,c:'var(--c3)'},{v:1930,c:'var(--c4)'},{v:6600,c:'var(--c5)'}],{size:128,center:'37,4 k',w:14})+
    '<div class="stack grow" style="--g:7px">'+[['Salaires et charges',19320,'var(--c2)'],['Alimentation, litière',6840,'var(--c1)'],['Soins',2710,'var(--c3)'],['Énergie',1930,'var(--c4)'],['Loyer et autres',6600,'var(--c5)']].map(function(x){return '<div class="fa-cat"><i style="--c:'+x[2]+'"></i><span class="ellip">'+x[0]+'</span><b>'+F.eur(x[1])+'</b></div>'}).join('')+'</div></div></div></div></div>';
  return h}
function cpTreso(){var EV=[['2026-11-20','Prélèvements du 20 et rejets représentés',3480,1],['2026-11-24','TVA d’octobre',-2890,1],['2026-11-30','Salaires de novembre',-14200,1],['2026-11-30','Fourrages du Hurepoix, livraison de foin',-3840,0],['2026-12-01','Loyer, SCI des Tilleuls',-2400,1],['2026-12-01','Virements et chèques de pensions',6800,0],['2026-12-05','Prélèvements de décembre',Math.round(batchStats().sepaSum/10)*10,1],['2026-12-10','Échéance du prêt du manège',-1850,1],['2026-12-15','Cotisations sociales',-5120,1]];
  return '<div class="card" style="margin-bottom:14px"><div class="ch" style="flex-wrap:wrap"><div><h3>Trésorerie prévisionnelle à 90 jours</h3><div class="xs mut">Solde du compte courant, calculé avec vos factures, vos échéanciers et vos charges récurrentes</div></div>'+U.seg([['prevu','Prévu'],['prudent','Prudent'],['herse','Avec l’achat de la herse']],SC.scen,'data-sc')+'</div>'+
    '<div class="cb"><div class="ar-g3 ar-k3m" style="margin-bottom:14px" id="cp-ts"></div><div class="cp-ch" id="cp-chart"></div><div class="hrow sp wrap" style="margin-top:10px">'+C.legend([['Réalisé','var(--acc)'],['Prévision et marge d’incertitude','var(--acc-line)'],['Seuil d’alerte','var(--warn)']])+'<span class="xs mut">Passez sur la courbe pour lire un jour précis</span></div></div></div>'+
   '<div class="ar-cols"><div class="card"><div class="ch"><div><h3>Mouvements attendus</h3><div class="xs mut">Les 30 prochains jours</div></div></div><div style="padding:8px 0 4px">'+EV.map(function(e){return '<div class="cp-op cp-ev"><span class="xs mut num">'+F.date(e[0])+'</span><b class="s ellip">'+e[1]+'</b><span class="chip x '+(e[3]?'':'line')+'">'+(e[3]?'certain':'probable')+'</span><b class="num s '+(e[2]>0?'okc':'')+'" style="text-align:right">'+(e[2]>0?'+':'')+F.eur(e[2])+'</b></div>'}).join('')+'</div></div>'+
   '<div class="stack" style="--g:14px"><div class="card pad stack" style="--g:10px"><div class="hrow"><span class="strass"></span><span class="eyebrow">Lecture de l’assistant</span></div><p class="s" id="cp-read"></p><button class="btn sm" data-a="thr" style="align-self:flex-start">'+ICON('bell','sm')+'M’alerter sous 20 000 €</button></div>'+
   '<div class="card"><div class="list" style="padding:6px 0"><div class="li"><div class="grow"><div class="t">Placer l’excédent sur le livret</div><div class="s">Au-dessus de 60 000 €, proposer un virement</div></div>'+U.tog(false)+'</div><div class="li"><div class="grow"><div class="t">Résumé de trésorerie le lundi</div><div class="s">Par e-mail, à 7 h</div></div>'+U.tog(true)+'</div></div></div></div></div>'}
function cpResult(){var k=SC.per==='m'?1:564900/49600,kc=SC.per==='m'?1:437800/37400,tp=0,tc=0,mx=PNL.pr[0][1]*k;
  function row(x,kk,cost){var v=Math.round(x[1]*kk/10)*10,d=x[2],good=cost?d<=0:d>=0;if(cost)tc+=v;else tp+=v;return '<div class="cp-pr"><span class="ellip">'+x[0]+'</span><span class="bx">'+U.bar(v/mx*100,cost?'var(--c2)':'var(--acc)')+'</span><b class="n">'+F.eur(v)+'</b><span class="n xs b '+(d===0?'mut':good?'okc':'badc')+'">'+(d>0?'+':d<0?'−':'')+String(Math.abs(d)).replace('.',',')+' %</span></div>'}
  var pr=PNL.pr.map(function(x){return row(x,k,0)}).join(''),ch=PNL.ch.map(function(x){return row(x,kc,1)}).join('');if(SC.per!=='m'){tp=564900;tc=437800}
  return '<div class="ar-tb"><div class="grow">'+U.seg([['m','Novembre 2026'],['y','12 mois glissants']],SC.per,'data-per')+'</div><button class="btn sm ghost hide-s" data-a="pdf">'+ICON('download','sm')+'Télécharger en PDF</button></div>'+
   '<div class="ar-g2"><div class="card"><div class="ch"><div><h3>Compte de résultat simplifié</h3><div class="xs mut">Comparé à la même période un an plus tôt</div></div></div><div class="cb" style="padding-top:2px">'+
    '<div class="cp-pr h"><span class="eyebrow">Produits</span></div>'+pr+'<div class="cp-pr h"><span class="eyebrow">Charges</span></div>'+ch+
    '<div class="cp-pr tot"><span>Résultat et marge</span><span class="bx"></span><span class="n okc">+'+F.eur(tp-tc)+'</span><span class="n xs okc">'+Math.round((tp-tc)/tp*100)+' %</span></div></div></div>'+
   '<div class="card"><div class="ch"><div><h3>Bilan simplifié</h3><div class="xs mut">Situation au 17 novembre 2026</div></div>'+U.chip('Équilibré','ok',true)+'</div><div class="cb cp-bil">'+
    [['Ce que le club possède',[['Installations, matériel et cavalerie',312400],['Stocks de fourrage et de boutique',9860],['Factures clients à encaisser',6754],['Trésorerie',73632]]],['Ce que le club doit',[['Capital et réserves',142000],['Résultat de l’exercice',98400],['Emprunts bancaires',118600],['Fournisseurs',14920],['TVA et cotisations sociales',21480],['Forfaits encaissés d’avance',7246]]]].map(function(s){return '<div><div class="eyebrow" style="margin-bottom:6px">'+s[0]+'</div>'+s[1].map(function(l){return '<div class="cp-bl"><span>'+l[0]+'</span><b class="num">'+F.eur(l[1])+'</b></div>'}).join('')+'<div class="cp-bl tot"><span>Total</span><span class="num">'+F.eur(sum(s[1],function(l){return l[1]}))+'</span></div></div>'}).join('')+'</div></div></div>'+
   '<div class="card" style="margin-top:14px"><div class="ch"><div><h3>Budget et réel, novembre</h3><div class="xs mut">Le trait marque le budget. Une recette au-dessus est une bonne nouvelle, une charge au-dessus demande un regard.</div></div><button class="btn sm hide-s" data-a="budget">Modifier le budget</button></div><div class="cb" style="padding-top:4px">'+
    BUD.map(function(b){var r=b[2]/b[1],over=r>1,good=b[3]?over:!over,d=b[2]-b[1];return '<div class="cp-bd"><span class="b ellip">'+b[0]+'</span><span class="cp-trk"><i style="--v:'+Math.min(100,r/1.3*100)+'%;--c:'+(good?'var(--ok)':'var(--warn)')+'"></i></span><span class="num mut hide-s" style="text-align:right"><b style="color:var(--ink)">'+F.eur(b[2])+'</b> sur '+F.eur(b[1])+'</span><span class="chip '+(good?'ok':'warn')+'" style="justify-self:end">'+(d>0?'+':'−')+F.eur(Math.abs(d))+'</span></div>'}).join('')+
    '<div class="note warn" style="margin-top:12px">'+ICON('feed','sm')+'<span>Alimentation et litière dépassent le budget de 640 € : le foin a augmenté de 9 % depuis septembre. Un devis groupé avec deux écuries voisines est possible.</span></div></div></div>'}
function cpTva(){var L=[['TVA collectée à 5,5 %','base '+F.eur(31240),1718],['TVA collectée à 20 %','base '+F.eur(17780),3556],['TVA déductible sur les achats','foin, litière, soins, énergie',-2384],['TVA déductible sur les immobilisations','aucun investissement en octobre',0]];
  return '<div class="ar-g2"><div class="card"><div class="ch ar-chw"><div><h3>Déclaration d’octobre</h3><div class="xs mut">Régime réel normal, déclaration mensuelle</div></div>'+(SC.tvaSent?U.chip('Transmise à l’expert-comptable','ok',true):U.chip('À déposer avant le 24 novembre','warn',true))+'</div><div class="cb" style="padding-top:6px">'+
    L.map(function(l){return '<div class="cp-tv"><span><b>'+l[0]+'</b><span class="xs mut" style="display:block">'+l[1]+'</span></span><b class="num">'+(l[2]<0?'−':'')+F.eur(Math.abs(l[2]))+'</b></div>'}).join('')+
    '<div class="cp-tv tot"><span>TVA à payer</span><span class="disp num" style="font-size:22px">'+F.eur(2890)+'</span></div>'+
    '<div class="hrow wrap" style="margin-top:14px"><button class="btn pri" data-a="tvasend"'+(SC.tvaSent?' disabled':'')+'>'+ICON('send','sm')+'Transmettre à l’expert-comptable</button><button class="btn" data-a="tvadet">Voir le détail des écritures</button></div></div></div>'+
   '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><div><h3>TVA nette, six derniers mois</h3><div class="xs mut">Novembre est une estimation au 17</div></div></div><div class="cb">'+C.bars([2410,3120,3350,1280,3040,2890,2610],['Mai','Juin','Juil','Août','Sept','Oct','Nov'],{h:150,hi:5,fmt:function(v){return (v/1000).toFixed(1).replace('.',',')+' k'}})+'</div></div>'+
   '<div class="note ar-nb" style="align-items:center">'+ICON('bulb','sm')+'<span class="grow">Si de l’enseignement a été facturé à 20 % depuis 2024, la régularisation reste possible jusqu’au 31 décembre 2026. Piaffe peut lister les factures concernées pour votre expert-comptable.</span><button class="btn sm" data-a="regul">Lister</button></div>'+
   '<div class="card"><div class="list" style="padding:6px 0"><div class="li">'+sq('percent','acc')+'<div class="grow"><div class="t">Taux par prestation</div><div class="s">5,5 % pour l’enseignement, pension ventilée</div></div><div class="r"><button class="btn sm ghost" data-go="facturation" data-p-tab="tva">Régler'+ICON('arrow','sm')+'</button></div></div></div></div></div></div>'}
function cpEcr(){var gl=SC.jr==='GL',R=gl?[]:journal(SC.jr),td=sum(R,function(r){return r.db}),tc=sum(R,function(r){return r.cr});
  var h='<div class="ar-tb">'+U.seg([['VT','Ventes'],['AC','Achats'],['BQ','Banque'],['CA','Caisse'],['GL','Grand livre']],SC.jr,'data-jr')+'<div class="ar-end hide-s"><span class="chip ok dot">'+(gl?'Balance équilibrée':'Journal équilibré')+'</span><button class="btn sm ghost" data-a="fec">'+ICON('download','sm')+'Exporter</button></div></div>';
  if(gl)return h+tbl([{l:'Compte',f:function(r){return '<span class="mono">'+r[0]+'</span>'}},{l:'Intitulé',f:function(r){return '<b>'+ACC[r[0]]+'</b>'}},{l:'Débit',n:1,c:'hide-s',f:function(r){return r[1]?F.eur(r[1],true):'<span class="mut2">—</span>'}},{l:'Crédit',n:1,c:'hide-s',f:function(r){return r[2]?F.eur(r[2],true):'<span class="mut2">—</span>'}},{l:'Solde',n:1,f:function(r){var s=r[1]-r[2];return '<b>'+F.eur(Math.abs(s),true)+'</b> <span class="xs mut">'+(s>=0?'débiteur':'créditeur')+'</span>'}}],GL.map(function(g){return {id:g[0],0:g[0],1:g[1],2:g[2]}}),{act:'acc'});
  return h+tbl([{l:'Date',f:function(r){return '<span class="mut">'+F.date(r.d)+'</span>'}},{l:'Pièce',c:'hide-s',f:function(r){return '<span class="mono">'+r.p+'</span>'}},{l:'Compte',f:function(r){return '<span class="mono">'+r.c+'</span><span class="s2">'+ACC[r.c]+'</span>'}},{l:'Libellé',c:'hide-s',f:function(r){return '<span class="ellip" style="display:block;max-width:300px">'+E(r.l)+'</span>'}},{l:'Débit',n:1,f:function(r){return r.db?F.eur(r.db,true):''}},{l:'Crédit',n:1,f:function(r){return r.cr?F.eur(r.cr,true):''}}],R)+
   '<div class="hrow sp wrap" style="margin-top:12px"><span class="xs mut">'+R.length+' lignes affichées · écritures créées par Piaffe à chaque facture, encaissement et rapprochement</span><span class="s">Débit <b class="num">'+F.eur(td,true)+'</b> · Crédit <b class="num">'+F.eur(tc,true)+'</b></span></div>'}
function cpJust(){var miss=BANK.filter(function(b){return b.nojust&&!SC.scanned});
  return (miss.length?'<div class="note warn ar-nb" style="margin-bottom:12px;align-items:center">'+ICON('alert','sm')+'<span class="grow">1 opération n’a pas de justificatif : carte du 9 novembre, station du Rond-Point, 86,40 €.</span><button class="btn sm" data-a="scan">Photographier le ticket</button></div>':'')+
   '<div class="cp-jg"><button class="cp-drop" data-a="scan">'+sq('scan','acc')+'<b class="s">Photographier ou déposer un justificatif</b><span class="xs mut">L’assistant lit le ticket, propose la catégorie et le rapproche de la banque</span></button>'+
   (SC.scanned?[{id:'j0',who:'Station du Rond-Point',label:'Gazole du camion',amount:86.4,vat:20,date:iso(-8),src:'Photo',state:'Rapproché',fresh:1}]:[]).concat(D.receipts).map(function(r){var done=r.state==='Rapproché'||SC.done[r.who];return '<button class="card hover cp-j" data-a="just" data-id="'+r.id+'"><span class="cp-th"><span class="cp-tk"><b></b><i style="width:90%"></i><i style="width:70%"></i><i style="width:84%"></i><i style="width:50%"></i><i style="width:76%"></i><i style="width:40%"></i></span><span class="chip '+(r.src==='Photo'?'':'acc')+'" style="position:absolute;left:8px;top:8px">'+ICON(r.src==='Photo'?'image':r.src==='PDF par e-mail'?'mail':'bolt','sm')+r.src+'</span></span>'+
     '<span class="stack" style="--g:3px;padding:10px 12px 12px"><span class="hrow sp"><b class="s ellip">'+r.who+'</b><b class="s num">'+F.eur(r.amount,r.amount%1>0)+'</b></span><span class="xs mut ellip">'+r.label+'</span><span class="hrow sp" style="margin-top:5px"><span class="xs mut">'+F.date(r.date)+'</span>'+U.chip(done?'rapproché':'à rapprocher',done?'ok':'warn',true)+'</span></span></button>'}).join('')+'</div>'}
function cpExport(){var CN=[['Pennylane','Pe','Factures, clients et encaissements poussés en continu'],['Tiime','Ti','Export des ventes et de la banque, chaque nuit'],['Cegid Loop et Quadra','Ce','Fichier d’écritures au format du cabinet'],['Sage','Sa','Fichier d’import des journaux de ventes et de banque'],['EBP','EB','Fichier d’import comptable']];
  return '<div class="ar-g2"><div class="stack" style="--g:14px"><div class="card"><div class="ch"><div><h3>Export des écritures au format FEC</h3><div class="xs mut">Journaux de ventes, d’achats, de banque et de caisse</div></div>'+sq('download','acc','sm')+'</div><div class="cb stack" style="--g:12px"><div class="ar-g2"><label class="field"><span>Du</span><input class="in" value="1er janvier 2026"></label><label class="field"><span>Au</span><input class="in" value="17 novembre 2026"></label></div>'+
     '<div class="hrow wrap" style="--g:6px">'+['Ventes','Achats','Banque','Caisse'].map(function(j){return '<span class="tag" aria-pressed="true">'+j+'</span>'}).join('')+'</div>'+
     '<div class="hrow wrap"><button class="btn pri" data-a="fec">'+ICON('download','sm')+'Exporter le FEC</button><button class="btn" data-a="csv">Exporter en CSV</button></div>'+(SC.fec?'<div class="note ok">'+ICON('checkc','sm')+'<span>Fichier <span class="mono">812345678FEC20261117.txt</span> créé : 4 812 écritures, débit et crédit égaux.</span></div>':'<span class="xs mut">Le fichier reprend les écritures tenues dans Piaffe. Le FEC légal de l’entreprise reste celui du logiciel de votre cabinet.</span>')+'</div></div>'+
    '<div class="card"><div class="ch"><div><h3>Expert-comptable invité</h3><div class="xs mut">Lecture des pièces et des écritures, commentaires, aucun accès aux adhérents</div></div><button class="btn sm" data-a="invite">'+ICON('plus','sm')+'Inviter</button></div><div style="padding-top:8px">'+
     '<div class="cp-cn"><span class="av" style="--c:var(--c5)">SC</span><div class="grow"><div class="b s">Stéphanie Collet</div><div class="xs mut">Cabinet Fidéa Conseil, Rambouillet · connectée hier à 16 h 20</div></div>'+U.chip('accès actif','ok',true)+'</div>'+
     [['q1','À quoi correspond le virement de 1 250 € du 3 novembre, « CSE Hexa Industrie » ?','Stage de la Toussaint pour 5 enfants du comité d’entreprise, facture F-2026-1098.'],['q2','Pouvez-vous joindre le ticket de carburant du 9 novembre ?','']].map(function(q){var a=SC.q[q[0]];return '<div class="cp-cn" style="align-items:flex-start">'+sq('chat',a?'ok':'warn','sm')+'<div class="grow stack" style="--g:6px"><div class="s"><b>Question de Stéphanie</b> · '+q[1]+'</div>'+(a?'<div class="xs okc b">Répondu : '+a+'</div>':'<div class="hrow wrap" style="--g:6px">'+(q[2]?'<button class="btn sm" data-a="answer" data-id="'+q[0]+'">Envoyer la réponse proposée</button>':'<button class="btn sm" data-a="scan">Photographier le ticket</button>')+'</div>'+(q[2]?'<div class="xs mut">Réponse proposée par l’assistant : '+q[2]+'</div>':''))+'</div></div>'}).join('')+'</div></div></div>'+
   '<div class="card"><div class="ch"><div><h3>Connecteurs comptables</h3><div class="xs mut">Vos écritures arrivent chez votre comptable sans ressaisie</div></div></div><div style="padding-top:8px">'+
    CN.map(function(c){var on=SC.cnx[c[0]];return '<div class="cp-cn"><span class="cp-lg">'+c[1]+'</span><div class="grow"><div class="b s">'+c[0]+'</div><div class="xs mut">'+(on?(c[0]==='Pennylane'?'Synchronisé il y a 12 min · 1 284 factures poussées':'Connecté à l’instant · premier envoi cette nuit'):c[2])+'</div></div>'+(on?U.chip('connecté','ok',true):'<button class="btn sm" data-a="cnx" data-id="'+c[0]+'">Connecter</button>')+'</div>'}).join('')+
    '<div class="cp-cn"><span class="cp-lg">'+ICON('doc','sm')+'</span><div class="grow"><div class="b s">Autre logiciel ou cabinet</div><div class="xs mut">Plan comptable, journaux et codes analytiques modifiables</div></div><button class="btn sm ghost" data-go="connecteurs">Tous les connecteurs'+ICON('arrow','sm')+'</button></div></div></div></div>'}

function openScan(){var FD=[['Fournisseur','Station du Rond-Point, Rambouillet'],['Date','9 novembre 2026 à 7 h 52'],['Montant hors taxes','72,00 €'],['TVA à 20 %','14,40 €'],['Total payé par carte','86,40 €'],['Catégorie','Carburant · 606140'],['Véhicule','Camion 6 places, GH-512-KT'],['Opération bancaire','CB du 9 novembre, −86,40 €']];
  var sh=sheet({title:'Justificatif lu par l’assistant',icon:'scan',wide:true,body:'<div class="cp-sc"><div class="cp-scan"><div class="cp-rcpt"><div style="text-align:center;font-weight:700;color:var(--ink)">STATION DU ROND-POINT<br>RAMBOUILLET</div><hr><div class="r"><span>09/11/2026</span><span>07:52</span></div><div class="r"><span>POMPE 04</span><span>GAZOLE</span></div><hr><div class="r"><span>48,27 L x 1,790</span><span>86,40</span></div><div class="r"><span>DONT TVA 20%</span><span>14,40</span></div><hr><div class="r" style="font-weight:700;color:var(--ink)"><span>TOTAL EUR</span><span>86,40</span></div><div class="r"><span>CB ****4417</span><span>ACCEPTE</span></div><hr><div style="text-align:center">MERCI ET BONNE ROUTE</div></div><div class="cp-beam"></div></div>'+
    '<div><div class="hrow" style="margin-bottom:6px"><span class="strass"></span><span class="eyebrow" id="sc-st">Lecture du ticket en cours</span></div><div id="sc-f">'+FD.map(function(f){return '<div class="cp-fd"><span class="mut">'+f[0]+'</span><b>'+f[1]+'</b></div>'}).join('')+'</div></div></div>',
   foot:'<button class="btn" data-a="edit">Corriger un champ</button><button class="btn pri" data-a="ok" disabled>Enregistrer et rapprocher</button>'},{
   edit:function(){P.toast('Touchez un champ pour le corriger : l’assistant apprend de vos corrections',{icon:'edit'})},
   ok:function(){SC.scanned=true;SC.q.q2='ticket joint à l’opération du 9 novembre.';sh.close();SC.tab='justifs';re();P.toast('Ticket rangé, rapproché de la banque et transmis à l’expert-comptable')}});
  var fs=P.$$('.cp-fd',sh),i=0;(function nx(){if(!sh.isConnected)return;if(i>=fs.length){sh.querySelector('#sc-st').textContent='8 champs lus, confiance de 98 %';sh.querySelector('[data-a="ok"]').disabled=false;return}fs[i++].classList.add('on');setTimeout(nx,P.RM?10:i===1?1100:260)})();return sh}
function openCat(k){var b=BANK[k],cur=SC.cat[k]||b.cat;
  var sh=sheet({title:'Catégorie de l’opération',icon:'tag',body:'<div class="ar-soft"><div class="hrow sp"><b class="s ellip">'+E(b.label)+'</b><b class="num">'+F.eur(b.amount,true)+'</b></div><div class="xs mut">'+F.dateL(b.d)+'</div></div><div class="hrow wrap" style="--g:8px">'+BCATS.map(function(c){return '<button class="tag" data-manual data-a="pick" data-c="'+c+'" aria-pressed="'+(c===cur)+'">'+c+'</button>'}).join('')+'</div>'+
   '<div class="ar-box list"><div class="li"><div class="grow"><div class="t">Retenir pour les prochaines opérations</div><div class="s">Même libellé, même catégorie</div></div>'+U.tog(true)+'</div></div>'},{pick:function(x){SC.cat[k]=x.getAttribute('data-c');sh.close();re();P.toast('Classée en « '+SC.cat[k]+' ». Piaffe appliquera la règle aux prochaines opérations.')}})}
function openOther(k){var b=BANK[k];
  var sh=sheet({title:'Choisir une autre pièce',icon:'link',body:'<div class="ar-soft"><div class="hrow sp"><b class="s ellip">'+E(b.label)+'</b><b class="num">'+F.eur(b.amount,true)+'</b></div><div class="xs mut">'+F.dateL(b.d)+'</div></div><div class="ar-box list">'+
   D.receipts.slice(0,4).map(function(r){return '<div class="li click" data-a="use">'+sq('doc','mut','sm')+'<div class="grow"><div class="t">'+r.who+'</div><div class="s">'+r.label+' · '+F.date(r.date)+'</div></div><b class="num s">'+F.eur(r.amount,true)+'</b></div>'}).join('')+'</div>'+
   '<button class="btn" data-a="scan">'+ICON('scan','sm')+'Ajouter un justificatif</button><button class="btn ghost" data-a="ask">'+ICON('chat','sm')+'Demander la pièce à Nadia</button>'},{use:function(){sh.close();P.toast('Pièce associée à l’opération')},scan:function(){openScan()},ask:function(){sh.close();P.toast('Demande envoyée à Nadia dans la messagerie',{icon:'send'})}})}
function openInvite(){var sh=sheet({title:'Inviter un expert-comptable',icon:'user',body:'<label class="field"><span>Adresse e-mail</span><input class="in" value="contact@cabinet-fidea.example"></label><div class="ar-box list">'+[['Pièces et justificatifs','Lecture et téléchargement',1],['Écritures, journaux et grand livre','Lecture et export',1],['Commentaires et questions','Il vous écrit directement sur une opération',1],['Déclarations de TVA','Préparation et validation',1],['Adhérents, chevaux et planning','Aucun accès',0]].map(function(x){return '<div class="li"><div class="grow"><div class="t">'+x[0]+'</div><div class="s">'+x[1]+'</div></div>'+U.tog(x[2])+'</div>'}).join('')+'</div><div class="note">'+ICON('shield','sm')+'<span>L’accès est gratuit, nominatif et révocable à tout moment. Chaque consultation est tracée.</span></div>',foot:'<button class="btn pri" data-a="ok">'+ICON('send','sm')+'Envoyer l’invitation</button>'},{ok:function(){sh.close();P.toast('Invitation envoyée, valable 7 jours',{icon:'send'})}})}
function openAcc(c){var all=['VT','AC','BQ','CA'].reduce(function(a,j){return a.concat(journal(j))},[]).filter(function(r){return r.c===c}).slice(0,8);
  sheet({title:c+' · '+ACC[c],icon:'accounting',wide:true,body:all.length?tbl([{l:'Date',f:function(r){return '<span class="mut">'+F.date(r.d)+'</span>'}},{l:'Pièce',f:function(r){return '<span class="mono">'+r.p+'</span>'}},{l:'Libellé',c:'ar-hx',f:function(r){return '<span class="ellip" style="display:block;max-width:240px">'+E(r.l)+'</span>'}},{l:'Débit',n:1,f:function(r){return r.db?F.eur(r.db,true):''}},{l:'Crédit',n:1,f:function(r){return r.cr?F.eur(r.cr,true):''}}],all,{card:false})+'<span class="xs mut">Derniers mouvements du compte. Chaque ligne renvoie à sa pièce.</span>':U.empty('accounting','Aucun mouvement récent','Ce compte n’a pas bougé depuis le 1er novembre.')})}

P.mod({id:'compta',role:'gerant',group:'Argent',title:'Comptabilité',icon:'accounting',n:20,phoneTitle:'Comptabilité',
 badge:function(){var n=unmatched().length;return n?{v:n}:null},
 render:function(el,ctx){syncB();
  if(ctx.params.tab){SC.tab=ctx.params.tab;ctx.params.tab=null}
  var CT=[['banque','Banque'],['treso','Trésorerie'],['resultat','Résultat et bilan'],['tva','TVA'],['ecritures','Écritures'],['justifs','Justificatifs'],['exports','Exports et expert-comptable']];
  function kpis(anim){var n=unmatched().length,tot=BANK.length;return K({label:'Solde du compte courant',count:anim?48320:null,fmt:'eur',value:F.eur(48320),delta:'+4 210 €',dsub:' ce matin',spark:tseries('prevu').slice(0,31).map(function(s){return s.v}),icon:'bank'})+
    K({label:'Résultat de novembre',count:anim?12200:null,fmt:'eur',value:F.eur(12200),delta:'+14 %',dsub:' vs nov. 2025',spark:D.revenue.map(function(r,i){return r-D.costs[i]}),color:'var(--ok)',icon:'trend'})+
    K({label:'TVA d’octobre à payer',count:anim?2890:null,fmt:'eur',value:F.eur(2890),delta:SC.tvaSent?'Transmise à l’expert-comptable':'À déposer avant le 24 novembre',tone:SC.tvaSent?'ok':'warn',di:SC.tvaSent?'check':'clock',spark:[2410,3120,3350,1280,3040,2890],color:'var(--c4)',icon:'percent'})+
    K({label:'Opérations à rapprocher',value:String(n),delta:Math.round((124-n)/124*100)+' % rapproché',tone:n?'acc':'ok',di:n?'spark':'check',dsub:n?' · suggestions prêtes':' · tout est à jour',bar:(124-n)/124*100,color:n?'var(--acc)':'var(--ok)',icon:'link'})}
  var n0=unmatched().length;
  el.innerHTML='<div class="ar-hd">'+U.ph('Comptabilité','Compte courant à '+F.eur(48320)+' · '+(n0?n0+' opération'+(n0>1?'s':'')+' à rapprocher':'tout est rapproché')+' · TVA d’octobre à déposer avant le 24 novembre',
    '<button class="btn" data-a="invite">'+ICON('user','sm')+'Inviter l’expert-comptable</button><button class="btn pri" data-a="scan">'+ICON('scan','sm')+'Ajouter un justificatif</button>')+'</div>'+
   '<div class="ar-k4 rise" id="cp-k">'+kpis(true)+'</div>'+tabsBar(CT,SC.tab,'data-ct')+'<div id="cp-body"></div>'+
   '<div class="ar-cta"><button class="btn pri" data-a="scan">'+ICON('scan')+'Photographier un justificatif</button><button class="btn icon" data-a="fec" title="Exporter le FEC">'+ICON('download')+'</button></div>';
  var body=el.querySelector('#cp-body');
  function draw(anim){var f={banque:cpBanque,treso:cpTreso,resultat:cpResult,tva:cpTva,ecritures:cpEcr,justifs:cpJust,exports:cpExport}[SC.tab]||cpBanque;body.innerHTML=f();body.className=anim?'fade':'';P.animate(body);syncB();
    var ch=body.querySelector('#cp-chart');if(ch){var r=drawTreso(ch),d=D.day(r.low.o),lv=Math.round(r.low.v/10)*10;
      body.querySelector('#cp-ts').innerHTML=head('aujourd’hui',F.eur(48320))+head('point bas, le '+F.date(D.iso(d)),'<span class="'+(lv<20000?'badc':'')+'">'+F.eur(lv)+'</span>')+head('dans 90 jours, le 15 février',F.eur(Math.round(r.end/10)*10));
      body.querySelector('#cp-read').innerHTML=lv<20000?'Le solde passe sous votre seuil d’alerte le <b>'+F.date(D.iso(d))+'</b>, à '+F.eur(lv)+'. Décaler l’achat de la herse après le prélèvement du 5 janvier suffit à rester au-dessus.':'Le point le plus bas arrive le <b>'+F.date(D.iso(d))+'</b>, juste après les salaires : '+F.eur(lv)+'. Vous restez '+F.eur(lv-20000)+' au-dessus de votre seuil d’alerte'+(SC.scen==='herse'?', même avec l’achat de la herse le 15 décembre.':SC.scen==='prudent'?', même avec 10 % d’encaissements en moins.':'. Les prélèvements du 5 décembre remontent le solde aussitôt.')}}
  function upd(){el.querySelector('#cp-k').innerHTML=kpis(false);var n=unmatched().length,s=el.querySelector('.ph .sub');if(s)s.textContent='Compte courant à '+F.eur(48320)+' · '+(n?n+' opération'+(n>1?'s':'')+' à rapprocher':'tout est rapproché')+' · TVA d’octobre à déposer avant le 24 novembre'}
  function match(rw,then){var b=BANK[+rw.getAttribute('data-k')];if(!b||b.matched)return;var rc=rw.querySelector('.cp-rc');rc.classList.add('ok');rc.querySelector('.cp-lnk').innerHTML=tick();rc.querySelector('.cp-act').innerHTML='<span class="chip ok dot">Rapprochée</span>';
    b.matched=true;b.at=Date.now();SC.done[(D.receipts.find(function(r){return norm(b.label).indexOf(norm(r.who).split(',')[0].split(' ')[0])>=0})||{}).who]=1;upd();
    setTimeout(function(){rw.classList.add('gone');setTimeout(then,P.RM?10:380)},P.RM?10:620)}
  draw();
  el.addEventListener('click',function(e){var t=e.target.closest('[data-ct]');if(t){SC.tab=t.getAttribute('data-ct');draw(true);return}
    var s=e.target.closest('[data-sc]');if(s){SC.scen=s.getAttribute('data-sc');draw();return}var p=e.target.closest('[data-per]');if(p){SC.per=p.getAttribute('data-per');draw();return}var j=e.target.closest('[data-jr]');if(j){SC.jr=j.getAttribute('data-jr');draw()}});
  on(el,{
   tab:function(b){SC.tab=b.getAttribute('data-k');P.$$('[data-ct]',el).forEach(function(x){x.setAttribute('aria-selected',x.getAttribute('data-ct')===SC.tab)});draw(true)},
   match:function(b){var rw=b.closest('.cp-rw');match(rw,function(){if(SC.tab==='banque')draw();P.toast('Opération rapprochée et écriture passée',{icon:'checkc'})})},
   matchall:function(b){b.disabled=true;var rs=P.$$('.cp-rw',body),n=rs.length,left=n;rs.forEach(function(rw,i){setTimeout(function(){match(rw,function(){if(--left===0){if(SC.tab==='banque')draw(true);P.toast(n+' opérations rapprochées, la comptabilité est à jour',{icon:'checkc'})}})},P.RM?0:i*260)})},
   other:function(b){openOther(+b.closest('.cp-rw').getAttribute('data-k'))},cat:function(b){openCat(+b.getAttribute('data-k'))},
   sync:function(){P.toast('Comptes actualisés : aucune nouvelle opération',{icon:'refresh'})},
   thr:function(b){b.outerHTML=U.chip('Alerte active sous 20 000 €','ok',true);P.toast('Vous serez prévenue 10 jours avant un passage sous 20 000 €',{icon:'bell'})},
   pdf:function(){P.toast('Compte de résultat et bilan téléchargés en PDF',{icon:'download'})},budget:function(){P.toast('Budget 2026 ouvert en modification : les montants se saisissent ligne par ligne',{icon:'edit'})},
   tvasend:function(b){payBtn(b,'Transmise',function(){SC.tvaSent=true;upd();draw();P.toast('Déclaration d’octobre transmise à Stéphanie Collet',{icon:'send'})})},
   tvadet:function(){SC.tab='ecritures';SC.jr='GL';P.$$('[data-ct]',el).forEach(function(x){x.setAttribute('aria-selected',x.getAttribute('data-ct')===SC.tab)});draw(true)},
   regul:function(b){b.outerHTML=U.chip('liste envoyée','ok',true);P.toast('37 factures listées et envoyées à votre expert-comptable',{icon:'send'})},
   fec:function(){SC.fec=true;if(SC.tab==='exports')draw();P.toast('Fichier FEC exporté : 4 812 écritures équilibrées',{icon:'download'})},csv:function(){P.toast('Export CSV des journaux téléchargé',{icon:'download'})},
   acc:function(b){openAcc(b.getAttribute('data-id'))},
   scan:function(){openScan()},just:function(b){var r=D.receipts.find(function(x){return x.id===b.getAttribute('data-id')});if(!r){P.toast('Ticket de carburant rapproché de l’opération du 9 novembre');return}
     sheet({title:r.who,icon:'doc',body:'<div class="cp-scan" style="min-height:220px"><div class="cp-rcpt"><div style="text-align:center;font-weight:700;color:var(--ink)">'+r.who.toUpperCase()+'</div><hr><div class="r"><span>'+F.dateY(r.date)+'</span></div><div>'+r.label+'</div><hr><div class="r"><span>HT</span><span>'+F.eur(r.amount/(1+r.vat/100),true)+'</span></div><div class="r"><span>TVA '+r.vat+' %</span><span>'+F.eur(r.amount-r.amount/(1+r.vat/100),true)+'</span></div><div class="r" style="font-weight:700;color:var(--ink)"><span>TOTAL</span><span>'+F.eur(r.amount,true)+'</span></div></div></div>'+
      '<dl class="ar-dl"><dt>Origine</dt><dd>'+r.src+(r.by?' par '+D.staffer(r.by).first:'')+'</dd><dt>Lu par l’assistant</dt><dd>Fournisseur, date, montants et TVA</dd><dt>État</dt><dd>'+(r.state==='Rapproché'||SC.done[r.who]?'Rapproché avec la banque':'En attente de l’opération bancaire')+'</dd></dl>',foot:'<button class="btn" data-a="dl">'+ICON('download','sm')+'Télécharger</button>'},{dl:function(){P.toast('Justificatif téléchargé',{icon:'download'})}})},
   invite:function(){openInvite()},answer:function(b){SC.q[b.getAttribute('data-id')]='stage de la Toussaint, facture F-2026-1098.';draw();P.toast('Réponse envoyée à Stéphanie Collet',{icon:'send'})},
   cnx:function(b){var id=b.getAttribute('data-id');payBtnLite(b,function(){SC.cnx[id]=1;draw();P.toast(id+' connecté : premier envoi cette nuit',{icon:'plug'})})}
  });
 }});
function payBtnLite(b,cb){b.disabled=true;b.innerHTML='<span class="ar-spin"></span>';setTimeout(cb,P.RM?30:700)}

/* Indicateur : même gabarit que P.ui.kpi, avec un ton libre et sans compteur lors d'un simple rafraîchissement */
function syncB(){['facturation','compta','equipe'].forEach(function(id){var m=P.mods[id],a=document.querySelector('.side .nv[data-go="'+id+'"]');if(!m||!a)return;var b=typeof m.badge==='function'?m.badge():m.badge,e=a.querySelector('.bdg');if(!b){if(e)e.remove();return}if(!e){e=document.createElement('span');a.appendChild(e)}e.className='bdg'+(b.hot?' hot':'');e.textContent=b.v})}
var REDRAW=false;
function re(){REDRAW=true;try{P.rerender()}finally{REDRAW=false}}
function K(o){var tone=o.tone||(o.up===false?'bad':'ok'),di=o.di!==undefined?o.di:(o.up===false?'down':'up');
  return '<div class="card kpi"><div class="lab">'+(o.icon?ICON(o.icon,'sm'):'')+o.label+'</div><div class="val num">'+(o.count!=null&&!REDRAW?'<span data-count="'+o.count+'" data-fmt="'+(o.fmt||'')+'">'+o.value+'</span>':o.value)+(o.unit?'<small>'+o.unit+'</small>':'')+'</div>'+
   '<div class="del" style="color:var(--'+tone+')">'+(di?ICON(di,'sm'):'')+'<span>'+o.delta+(o.dsub?'<span class="mut" style="font-weight:500">'+o.dsub+'</span>':'')+'</span></div>'+(o.spark?C.spark(o.spark,o.color):o.bar!=null?'<div style="margin-top:auto;padding:14px 0 12px">'+U.bar(o.bar,o.color)+'</div>':'')+'</div>'}

/* =====================================================================
   ÉQUIPE ET RH
   ===================================================================== */
P.css(`
.eq-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.eq-card{padding:14px 14px 12px;display:flex;flex-direction:column;gap:12px;text-align:left;width:100%}
.eq-wk{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:3px}
.eq-wk i{height:22px;border-radius:5px;background:color-mix(in srgb,var(--c) 22%,var(--surface));display:grid;place-items:center;font:600 10px var(--f-text);font-style:normal;color:var(--ink-2)}
.eq-wk i.r{background:var(--bg-2);color:var(--mut-2)}
.eq-wk i.t{box-shadow:0 0 0 1.5px var(--ink)}
.eq-dot{width:8px;height:8px;border-radius:50%;background:var(--c);flex:none;box-shadow:0 0 0 3px color-mix(in srgb,var(--c) 20%,transparent)}
.eq-pl{display:grid;grid-template-columns:186px repeat(7,minmax(0,1fr));min-width:0}
.eq-pl>*{border-top:1px solid var(--line);min-width:0}
.eq-hd{padding:9px 8px;font-size:11.5px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--mut);border-top:0;border-left:1px solid var(--line);text-align:center}
.eq-hd.t{color:var(--acc);background:var(--acc-pale)}
.eq-hd:first-child{border-left:0;text-align:left;padding-left:16px}
.eq-nm{display:flex;align-items:center;gap:10px;padding:8px 10px 8px 16px}
.eq-cell{padding:4px;border-left:1px solid var(--line);display:flex;flex-direction:column;gap:3px;justify-content:center;min-height:54px;width:100%;transition:background var(--t-1)}
.eq-cell:hover{background:var(--surface-2)}
.eq-cell.t{background:color-mix(in srgb,var(--acc-pale) 55%,transparent)}
.eq-sh{display:flex;flex-direction:column;justify-content:center;gap:1px;min-height:36px;padding:3px 7px 3px 10px;border-radius:7px;background:color-mix(in srgb,var(--c) 15%,var(--surface));box-shadow:inset 3px 0 0 var(--c);text-align:left;overflow:hidden;white-space:nowrap;min-width:0}
.eq-sh b{font-size:12px;font-weight:650;line-height:1.2}
.eq-sh small{font-size:10.5px;color:var(--mut);line-height:1.2;overflow:hidden;text-overflow:ellipsis}
.eq-sh.r{background:none;box-shadow:none;align-items:center;padding:0}.eq-sh.r b{font-weight:500;color:var(--mut-2)}
.eq-ng{display:flex;align-items:center;gap:4px;height:20px;padding:0 6px;border-radius:6px;background:var(--navy);color:var(--navy-ink);font-size:10.5px;font-weight:600;white-space:nowrap;overflow:hidden}
.eq-ng svg.i{width:12px;height:12px}
.eq-cv{padding:8px 4px;border-left:1px solid var(--line);display:grid;place-items:center}
.eq-day{display:none}
.eq-gt{display:grid;grid-template-columns:128px minmax(0,1fr);align-items:center;gap:0 10px}
.eq-gt .wk{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));font-size:10.5px;color:var(--mut);padding-bottom:6px}
.eq-trk{position:relative;height:30px;border-top:1px solid var(--line);background:repeating-linear-gradient(90deg,transparent 0,transparent calc(100%/7 - 1px),var(--line) calc(100%/7 - 1px),var(--line) calc(100%/7))}
.eq-bar{position:absolute;top:6px;height:18px;border-radius:6px;background:var(--c);min-width:8px;left:var(--l);width:var(--w)}
.eq-bar.p{background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--c) 55%,transparent) 0 4px,color-mix(in srgb,var(--c) 22%,transparent) 4px 8px);box-shadow:inset 0 0 0 1.5px var(--c)}
.eq-now{position:absolute;top:0;bottom:0;width:2px;background:var(--bad);left:var(--l);border-radius:1px}
.eq-rq{padding:16px;display:flex;flex-direction:column;gap:12px}
.eq-rq+.eq-rq{border-top:1px solid var(--line)}
.eq-role{display:flex;align-items:center;gap:12px;padding:12px 14px;width:100%;text-align:left;border-radius:var(--r-md);transition:background var(--t-2),box-shadow var(--t-2)}
.eq-role[aria-pressed="true"]{background:var(--acc-pale);box-shadow:inset 0 0 0 1.5px var(--acc-line)}
.eq-pm{display:flex;align-items:center;gap:12px;padding:10px 16px}
.eq-pm+.eq-pm{border-top:1px solid var(--line)}
.eq-rs{display:none}
.eq-ob{display:flex;align-items:center;gap:12px;padding:10px 16px;width:100%;text-align:left}
.eq-ob+.eq-ob{border-top:1px solid var(--line)}
.eq-ob[aria-checked="true"] .t{color:var(--mut);text-decoration:line-through;text-decoration-color:var(--line-2)}
.eq-ts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.eq-tile{display:flex;flex-direction:column;gap:3px;padding:11px 12px;border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line-2);text-align:left;background:var(--surface);transition:box-shadow var(--t-2),background var(--t-2)}
.eq-tile b{font-size:13px}.eq-tile small{font-size:11px;color:var(--mut);line-height:1.3}
.eq-tile i{width:22px;height:5px;border-radius:3px;background:var(--c);margin-bottom:4px}
.eq-tile[aria-pressed="true"]{box-shadow:inset 0 0 0 2px var(--acc);background:var(--acc-pale)}
@container main (max-width:1080px){.eq-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.eq-pl{grid-template-columns:150px repeat(7,minmax(0,1fr))}.eq-nm{padding-left:12px}.eq-nm .av{display:none}.eq-sh small{display:none}.eq-sh{min-height:28px}.eq-ng span{display:none}.eq-ng{justify-content:center}}
@container main (min-width:1081px){.ar-cols.eq-dc{grid-template-columns:minmax(0,1fr) minmax(0,1.7fr)}}
@container main (max-width:760px){.eq-pl{display:none}.eq-day{display:block}.eq-rl{display:none}.eq-rs{display:block;margin-bottom:12px}.eq-gt{grid-template-columns:84px minmax(0,1fr)}.eq-day .seg{display:flex;width:100%}.eq-day .seg button{flex:1;padding-left:2px;padding-right:2px;justify-content:center;min-width:0}.ar-nb{flex-wrap:wrap}.ar-nb>.btn{width:calc(100% - 28px);margin-left:28px;justify-content:center}}
@container main (max-width:620px){.eq-grid{grid-template-columns:minmax(0,1fr)}.eq-pm{flex-wrap:wrap}.eq-pm .seg{width:100%}.eq-pm .seg button{flex:1;justify-content:center}}
@container arsh (max-width:440px){.eq-ts{grid-template-columns:repeat(2,minmax(0,1fr))}}
`);
var SE={tab:'salaries',grp:'all',day:1,leave:{},punch:false,week:false,exp:null,onb:{0:1,1:1,2:1,8:1,9:1},role:'Moniteur',perm:{},gap:false,dip:{},pub:false};
var SH={M:{l:'Matin',t:'7 h – 12 h 30',h:5.5,c:'var(--c4)'},S:{l:'Soir',t:'13 h 30 – 19 h',h:5.5,c:'var(--c5)'},J:{l:'Journée',t:'8 h 30 – 17 h 30',h:8,c:'var(--c1)'},C:{l:'Coupé',t:'7 h – 11 h, 16 h – 19 h',h:7,c:'var(--c3)'},K:{l:'Concours',t:'6 h 30 – 16 h',h:8,c:'var(--c6)'},F:{l:'Formation',t:'CFA de Rambouillet',h:7,c:'var(--c7)'},P:{l:'Congé',t:'Congés payés',h:7,c:'var(--mut-2)'},R:{l:'Repos',t:'',h:0,c:'var(--line-2)'}};
var DAYS=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'],DAYL=['lundi 16','mardi 17','mercredi 18','jeudi 19','vendredi 20','samedi 21','dimanche 22'];
var FEM={s01:1,s03:1,s06:1,s08:1,s09:1},PUNCH={s01:'8 h 24',s04:'8 h 52',s05:'6 h 56',s06:'8 h 27',s07:'8 h 31',s09:'8 h 58'},PDEC={s01:8.4,s04:8.87,s05:6.93,s06:8.45,s07:8.52,s09:8.97};
var STABLE=['s05','s06','s07'],GRP={all:null,ens:['s02','s03','s04','s08'],ecu:STABLE,adm:['s01','s09']};
function planned(id){return sum(D.shifts[id],function(k){return SH[k].h})}
function stNow(id){var k=D.shifts[id][1],e=FEM[id]?'e':'';if(PUNCH[id]&&'JCM'.indexOf(k)>=0)return ['ok','Présent'+e+' depuis '+PUNCH[id]];if(k==='S')return ['acc','Attendu'+e+' à 13 h 30'];if(k==='F')return ['warn','En formation au CFA'];if(k==='P')return ['mut','En congé'];if(k==='R')return ['mut','De repos aujourd’hui'];return ['acc','Attendu'+e+' ce matin']}
function tone(t){return t==='mut'?'var(--mut-2)':'var(--'+t+')'}
function worst(id){var d=D.hr[id].dip.filter(function(x){return (x[1]==='bad'||x[1]==='warn')&&!SE.dip[id+x[0]]});return d.sort(function(a,b){return a[1]==='bad'?-1:1})[0]}
function gaps(){var g=[];DAYS.forEach(function(_,i){var m=STABLE.some(function(s){return 'MJC'.indexOf(D.shifts[s][i])>=0}),e=STABLE.some(function(s){return 'SJC'.indexOf(D.shifts[s][i])>=0});if(!m)g.push([i,'matin']);if(!e)g.push([i,'soir'])});return g}
function streak(id){var mx=0,c=0;D.shifts[id].forEach(function(k){if(k!=='R'&&k!=='P'){c++;mx=Math.max(mx,c)}else c=0});return mx}
function pointed(id){var k0=D.shifts[id][0],h=SH[k0].h+({s02:.25,s05:1.25,s06:.5}[id]||0);if(id==='s07'&&!SE.punch)h=0;if(PDEC[id])h+=Math.max(0,9.68-PDEC[id]);if(D.shifts[id][1]==='F')h+=1.7;return h}
function wkMini(id){return '<span class="eq-wk">'+D.shifts[id].map(function(k,i){return '<i class="'+(k==='R'?'r':'')+(i===1?' t':'')+'" style="--c:'+SH[k].c+'" title="'+DAYL[i]+' : '+SH[k].l+'">'+'LMMJVSD'[i]+'</i>'}).join('')+'</span>'}

function openStaff(id){var s=D.staffer(id),H=D.hr[id],st=stNow(id),pl=planned(id),show=false;
  var sh=sheet({title:s.first+' '+s.last,icon:'user',wide:true,body:function(b){
    function draw(){b.innerHTML='<div class="hrow" style="--g:14px">'+U.av(s,'xl')+'<div class="grow"><div class="disp" style="font-size:21px;font-weight:700">'+s.first+' '+s.last+'</div><div class="s mut">'+(s.contract.indexOf(s.role)===0?s.contract:s.role+' · '+s.contract)+'</div><div class="hrow s" style="--g:8px;margin-top:6px"><span class="eq-dot" style="--c:'+tone(st[0])+'"></span>'+st[1]+'</div></div></div>'+
     '<div class="ar-g3 shx ar-k3">'+head('planifiées cette semaine pour '+s.hours+' h',hm(pl))+head('jours de congés restants',String(H.cp[0]-H.cp[1]).replace('.',','))+head('heures supplémentaires en novembre',hm(H.ot))+'</div>'+
     '<div class="ar-sec"><div class="eyebrow">Contrat</div><div class="ar-soft"><dl class="ar-dl"><dt>Type de contrat</dt><dd>'+s.contract+'</dd><dt>Entrée dans l’entreprise</dt><dd>'+F.dateY(H.since)+'</dd>'+(H.until?'<dt>Fin de contrat</dt><dd class="warnc">'+F.dateY(H.until)+'</dd>':'')+'<dt>Classification</dt><dd>'+H.cls+'</dd><dt>Convention collective</dt><dd>IDCC 7026, activités hippiques</dd>'+(H.gross?'<dt>Salaire brut mensuel</dt><dd><button class="ar-lk" data-a="eye">'+(show?F.eur(H.gross)+ICON('eye_off','sm'):'•••• €'+ICON('eye','sm'))+'</button></dd>':'')+'</dl></div></div>'+
     '<div class="ar-sec"><div class="eyebrow">Diplômes et échéances</div><div class="ar-box list">'+H.dip.map(function(d){var done=SE.dip[id+d[0]],t=done?'ok':d[1];return '<div class="li">'+sq(t==='ok'?'checkc':t==='acc'?'clock':'alert',t,'sm')+'<div class="grow"><div class="t">'+d[0]+'</div><div class="s">'+(done?'Inscription faite, attestation attendue':d[2])+'</div></div>'+(!done&&(d[1]==='bad'||d[1]==='warn')?'<div class="r"><button class="btn sm" data-a="dip" data-k="'+E(d[0])+'">'+(/PSC1/.test(d[0])?'Inscrire':'Renouveler')+'</button></div>':'')+'</div>'}).join('')+'</div></div>'+
     '<div class="ar-sec"><div class="eyebrow">Semaine du 16 au 22 novembre</div>'+wkMini(id)+'<div class="hrow wrap" style="--g:6px">'+D.shifts[id].map(function(k,i){return k==='R'?'':'<span class="chip line">'+DAYS[i]+' · '+SH[k].l+'</span>'}).join('')+(D.nights.indexOf(id)>=0?'<span class="chip navy">'+D.nights.filter(function(n){return n===id}).length+' astreintes de nuit</span>':'')+'</div></div>'+
     '<div class="ar-sec"><div class="eyebrow">Documents</div><div class="ar-box list">'+[['Contrat de travail signé',F.dateY(H.since)],['Fiche de poste','mise à jour le 2 septembre 2026'],['Bulletin de paie d’octobre','déposé par le logiciel de paie']].map(function(d){return '<div class="li click" data-a="doc">'+sq('doc','mut','sm')+'<div class="grow"><div class="t">'+d[0]+'</div><div class="s">'+d[1]+'</div></div>'+ICON('download','sm')+'</div>'}).join('')+'</div></div>'+
     '<div class="ar-sec"><div class="eyebrow">Accès à Piaffe</div><div class="ar-soft hrow">'+sq('key','acc','sm')+'<div class="grow"><b class="s">Rôle « '+(ROLES.find(function(r){return r[2].indexOf(id)>=0})||ROLES[0])[0]+' »</b><div class="xs mut">Dernière connexion ce matin · double authentification active</div></div><button class="btn sm ghost" data-a="rights">Modifier</button></div></div>'}
    b._d=draw;draw()},foot:'<button class="btn" data-a="msg">'+ICON('chat','sm')+'Écrire</button><button class="btn" data-a="plan">'+ICON('calendar_add','sm')+'Planifier l’entretien</button><button class="btn pri" data-a="edit">'+ICON('edit','sm')+'Modifier la fiche</button>'},{
    eye:function(){show=!show;sh.querySelector('.ar-sh')._d()},
    dip:function(x){SE.dip[id+x.getAttribute('data-k')]=1;sh.querySelector('.ar-sh')._d();P.toast(/PSC1/.test(x.getAttribute('data-k'))?s.first+' est inscrit'+(FEM[id]?'e':'')+' à la session PSC1 du 12 décembre':'Demande de renouvellement préparée pour '+s.first,{icon:'checkc'})},
    doc:function(){P.toast('Document téléchargé',{icon:'download'})},rights:function(){sh.close();SE.tab='droits';re()},
    msg:function(){sh.close();P.toast('Conversation ouverte avec '+s.first,{icon:'chat'})},plan:function(){sh.close();P.toast('Entretien annuel proposé à '+s.first+' le jeudi 3 décembre à 14 h',{icon:'calendar_add'})},edit:function(){P.toast('Fiche en modification : chaque champ s’enregistre tout seul',{icon:'edit'})}});
  return sh}
function openCell(id,d){var s=D.staffer(id),cur=D.shifts[id][d],night=D.nights[d]===id,pick=cur;
  var sh=sheet({title:s.first+' · '+DAYL[d]+' novembre',icon:'planning',body:function(b){
    function draw(){var tot=planned(id)-SH[cur].h+SH[pick].h;b.innerHTML='<div class="eq-ts">'+['M','S','J','C','K','F','P','R'].map(function(k){return '<button class="eq-tile" data-a="pick" data-k="'+k+'" aria-pressed="'+(k===pick)+'" style="--c:'+SH[k].c+'"><i></i><b>'+SH[k].l+'</b><small>'+(SH[k].t||'Jour non travaillé').replace(/ h/g,'\u00a0h')+'</small></button>'}).join('')+'</div>'+
      '<div class="ar-box list"><div class="li">'+sq('moonstar','mut','sm')+'<div class="grow"><div class="t">Astreinte de nuit</div><div class="s">De 19 h à 7 h, joignable et sur place en 15 minutes</div></div>'+U.tog(night,'eq-night')+'</div></div>'+
      '<div class="note '+(tot>s.hours+4?'warn':'')+'">'+ICON('clock','sm')+'<span>Avec ce poste, '+s.first+' est à <b>'+hm(tot)+'</b> cette semaine'+(id==='s01'?', hors décompte horaire.':' pour un contrat de '+s.hours+' h.')+(id!=='s01'&&tot>s.hours?' Les '+hm(tot-s.hours)+' en plus seront comptées en heures '+(s.hours<35?'complémentaires':'supplémentaires')+'.':'')+'</span></div>'}
    b._d=draw;draw()},foot:'<button class="btn pri" data-a="ok">Enregistrer le poste</button>'},{
    pick:function(x){pick=x.getAttribute('data-k');sh.querySelector('.ar-sh')._d()},
    ok:function(){var prev=cur,pn=D.nights[d],nt=sh.querySelector('#eq-night').getAttribute('aria-checked')==='true';D.shifts[id][d]=pick;if(nt)D.nights[d]=id;else if(night)D.nights[d]=null;sh.close();re();
      P.toast(s.first+' : '+SH[pick].l.toLowerCase()+' le '+DAYL[d]+', notification envoyée',{undo:function(){D.shifts[id][d]=prev;D.nights[d]=pn;re()}})}});
  return sh}
function openNewStaff(){var sh=sheet({title:'Ajouter un salarié',icon:'plus',body:'<div class="ar-g2 shx"><label class="field"><span>Prénom</span><input class="in" value="Élise"></label><label class="field"><span>Nom</span><input class="in" value="Marchand"></label></div>'+
   '<label class="field"><span>Poste</span><select class="in"><option>Palefrenière soigneuse</option><option>Enseignant</option><option>Agent d’entretien</option><option>Secrétariat et accueil</option><option>Apprenti</option></select></label>'+
   '<div class="ar-g2 shx"><label class="field"><span>Contrat</span><select class="in"><option>CDI 35 h</option><option>CDD</option><option>Apprentissage</option><option>Temps partiel</option></select></label><label class="field"><span>Date d’arrivée</span><input class="in" value="1er décembre 2026"></label></div>'+
   '<div class="ar-box list">'+[['Préparer la déclaration préalable à l’embauche','À transmettre avant le premier jour'],['Créer le contrat depuis le modèle','Signature électronique'],['Lancer la checklist d’accueil','10 étapes, suivies dans Documents'],['Créer son compte Piaffe','Rôle « Palefrenier »']].map(function(x){return '<div class="li"><div class="grow"><div class="t">'+x[0]+'</div><div class="s">'+x[1]+'</div></div>'+U.tog(true)+'</div>'}).join('')+'</div>',
   foot:'<button class="btn pri" data-a="ok">Créer la fiche et lancer l’accueil</button>'},{ok:function(){sh.close();SE.tab='docs';re();P.toast('Fiche d’Élise Marchand créée, checklist d’accueil lancée')}})}
function openSheetTime(id){var s=D.staffer(id),R=D.shifts[id].map(function(k,i){var past=i<1,now=i===1;return {id:i,d:DAYL[i],k:k,in_:past&&k!=='R'?({M:'6 h 58',S:'13 h 27',J:'8 h 26',C:'6 h 55',F:'8 h 30'}[k]||'8 h 30'):now&&PUNCH[id]?PUNCH[id]:'',out:past&&k!=='R'?(id==='s07'&&!SE.punch?'':({M:'12 h 34',S:'19 h 12',J:'17 h 41',C:'19 h 08',F:'16 h 30'}[k]||'17 h 30')):'',h:past?SH[k].h+({s02:.25,s05:1.25,s06:.5}[id]||0):null}});
  sheet({title:'Feuille de temps de '+s.first,icon:'clockin',wide:true,body:tbl([{l:'Jour',f:function(r){return '<b>'+r.d+'</b>'}},{l:'Poste prévu',f:function(r){return r.k==='R'?'<span class="mut">Repos</span>':SH[r.k].l+' <span class="xs mut ar-hx">· '+SH[r.k].t+'</span>'}},{l:'Arrivée',c:'ar-hx',f:function(r){return r.in_||'<span class="mut2">—</span>'}},{l:'Départ',c:'ar-hx',f:function(r){return r.out||(r.in_&&r.id===1?'<span class="chip ok dot">en poste</span>':r.in_?'<span class="chip bad dot">non pointé</span>':'<span class="mut2">—</span>')}},{l:'Heures',n:1,f:function(r){return r.h!=null&&r.k!=='R'?'<b>'+hm(r.h)+'</b>':'<span class="mut2">—</span>'}}],R,{card:false})+
   (id==='s05'?'<div class="note">'+ICON('moonstar','sm')+'<span>Nuit de lundi à mardi : intervention d’astreinte de 1 h 15 pour la colique du box B23, comptée et majorée.</span></div>':'')+
   '<span class="xs mut">Le pointage se fait sur le téléphone du salarié ou sur la tablette de l’écurie. Chaque correction est tracée et visible par le salarié.</span>',foot:'<button class="btn" data-a="x">'+ICON('download','sm')+'Télécharger</button>'},{x:function(){P.toast('Feuille de temps téléchargée',{icon:'download'})}})}

var ROLES=[['Gérant','Tout Piaffe, y compris la paie et les réglages',['s01']],['Moniteur','Planning, cavaliers, chevaux et progression',['s02','s03','s04','s08']],['Palefrenier','Tournées, soins, stocks et signalements',['s05','s06','s07']],['Accueil','Adhérents, facturation et encaissements',['s09']],['Expert-comptable','Comptabilité en lecture, invité extérieur',[]]];
var PMODS=[['Planning et reprises','planning'],['Chevaux, soins et alimentation','horse'],['Adhérents et familles','members'],['Facturation et encaissements','invoice'],['Comptabilité et banque','accounting'],['Équipe, heures et paie','team'],['Caméras et capteurs','camera'],['Réglages et connecteurs','settings']];
var PDEF={'Gérant':[2,2,2,2,2,2,2,2],'Moniteur':[2,1,1,0,0,0,1,0],'Palefrenier':[1,2,0,0,0,0,2,0],'Accueil':[2,1,2,2,0,0,0,0],'Expert-comptable':[0,0,0,1,1,0,0,0]};
var VARS=[['s02',80.5,4.5,0,5.5,0,'','',1],['s03',80.5,6,0,0,0,'','',1],['s04',69,2.5,0,0,0,'','Prime de concours, 60 €',2],['s05',89.5,8,1.5,7,5,'','5 astreintes, 90 €',1],['s06',80.5,1,0,5.5,4,'','4 astreintes, 72 €',1],['s07',41.5,0,0,0,0,'2 jours de maladie','',0],['s08',80.5,0,0,0,0,'4 jours de CFA','',1],['s09',64.5,0,0,0,0,'','',1]];
var ONB=['Déclaration préalable à l’embauche transmise','Contrat signé électroniquement','Pièce d’identité et relevé bancaire reçus','Affiliation à la mutuelle et à la prévoyance','Visite d’information et de prévention planifiée','Compte Piaffe créé avec le rôle « Palefrenier »','Chaussures de sécurité et gilet remis','Consignes de sécurité et document unique lus','Fiche de poste remise','Première semaine en binôme avec Mamadou planifiée'];

function eqSalaries(){var al=[];D.staff.forEach(function(s){var w=worst(s.id);if(w)al.push([s,w])});
  var ids=GRP[SE.grp],list=D.staff.filter(function(s){return !ids||ids.indexOf(s.id)>=0});
  var h=(al.length||!SE.dip.cdd?'<div class="card" style="margin-bottom:14px"><div class="ch"><div><h3>Échéances à traiter</h3><div class="xs mut">Diplômes, cartes professionnelles et fins de contrat dans les 100 prochains jours</div></div><span class="chip warn">'+(al.length+(SE.dip.cdd?0:1))+'</span></div><div class="list" style="padding:6px 0">'+
    al.map(function(a){var s=a[0],d=a[1];return '<div class="li ar-ck">'+U.av(s)+'<div class="grow"><div class="t">'+s.first+' '+s.last+' · '+d[0]+'</div><div class="s">'+d[2]+'</div></div><div class="r"><button class="btn sm" data-a="dip" data-id="'+s.id+'" data-k="'+E(d[0])+'">'+(/PSC1/.test(d[0])?'Inscrire à la session du 12 décembre':'Préparer le renouvellement')+'</button></div></div>'}).join('')+
    (SE.dip.cdd?'':'<div class="li ar-ck">'+U.av('s07')+'<div class="grow"><div class="t">Kévin Bernard · fin du CDD</div><div class="s">Le contrat se termine le 28 février 2027, dans 103 jours</div></div><div class="r"><button class="btn sm" data-a="cdd">Préparer la suite</button></div></div>')+'</div></div>':'');
  h+='<div class="ar-tb">'+U.seg([['all','Tous <span class="mut">9</span>'],['ens','Enseignants <span class="mut">4</span>'],['ecu','Écurie <span class="mut">3</span>'],['adm','Direction et accueil <span class="mut">2</span>']],SE.grp,'data-grp')+'</div><div class="eq-grid">'+
   list.map(function(s){var st=stNow(s.id),pl=planned(s.id),w=worst(s.id),H=D.hr[s.id];return '<button class="card hover eq-card" data-a="staff" data-id="'+s.id+'"><span class="hrow">'+U.av(s,'lg')+'<span class="grow" style="min-width:0"><b class="ellip" style="display:block">'+s.first+' '+s.last+'</b><span class="s mut ellip" style="display:block">'+s.role+'</span></span>'+ICON('right','sm')+'</span>'+
    '<span class="hrow s" style="--g:8px"><span class="eq-dot" style="--c:'+tone(st[0])+'"></span><span class="ellip">'+st[1]+'</span></span>'+wkMini(s.id)+
    '<span class="hrow sp wrap" style="--g:6px"><span class="xs mut">'+s.contract+' · <b style="color:var(--ink)">'+hm(pl)+'</b> cette semaine</span>'+(w?'<span class="chip '+w[1]+' dot">'+w[0].split(' ')[0].replace(',','')+(/Jamais/.test(w[2])?' à passer':w[1]==='bad'?' dépassé':' à renouveler')+'</span>':H.until&&s.id==='s07'?'<span class="chip line">CDD jusqu’au 28 févr.</span>':'<span class="chip ok dot">à jour</span>')+'</span></button>'}).join('')+'</div>';
  return h}
function eqPlanning(){var g=gaps(),over=D.staff.filter(function(s){return s.id!=='s01'&&planned(s.id)-s.hours>=1}),six=D.staff.filter(function(s){return s.id!=='s01'&&streak(s.id)>=6});
  var h='<div class="ar-tb"><div class="hrow" style="--g:6px"><button class="btn icon sm" data-a="wk" title="Semaine précédente">'+ICON('left','sm')+'</button><b class="s">Semaine du 16 au 22 novembre</b><button class="btn icon sm" data-a="wk" title="Semaine suivante">'+ICON('right','sm')+'</button></div><div class="ar-end"><button class="btn sm hide-s" data-a="copy">'+ICON('copy','sm')+'Copier la semaine dernière</button>'+(SE.pub?'<span class="chip ok dot">Planning publié</span>':'<button class="btn sm pri" data-a="pub">'+ICON('send','sm')+'Publier le planning</button>')+'</div></div>';
  if(g.length)h+='<div class="note bad ar-nb" style="margin-bottom:12px;align-items:center">'+ICON('alert','sm')+'<span class="grow"><b>'+DAYL[g[0][0]].replace(/^./,function(c){return c.toUpperCase()})+' au '+g[0][1]+' : personne à l’écurie pour la distribution.</b> Kévin est à '+hm(planned('s07'))+' sur 24 h cette semaine et il sait distribuer.</span><button class="btn sm" data-a="gap">Affecter Kévin</button></div>';
  h+='<div class="card" style="overflow:hidden"><div class="eq-pl"><div class="eq-hd">Salarié</div>'+DAYS.map(function(d,i){return '<div class="eq-hd'+(i===1?' t':'')+'">'+d+' '+(16+i)+'</div>'}).join('')+
   D.staff.map(function(s){var pl=planned(s.id),ov=pl-s.hours;return '<div class="eq-nm">'+U.av(s)+'<div style="min-width:0"><div class="b s ellip">'+s.first+' '+s.last+'</div><div class="xs '+(s.id!=='s01'&&ov>0?'warnc b':'mut')+'">'+hm(pl)+(s.id==='s01'?' · forfait':' sur '+s.hours+' h')+'</div></div></div>'+
     D.shifts[s.id].map(function(k,i){var x=SH[k];return '<button class="eq-cell'+(i===1?' t':'')+'" data-a="cell" data-id="'+s.id+'" data-d="'+i+'" title="'+s.first+', '+DAYL[i]+' : '+x.l+(x.t?', '+x.t:'')+'">'+(k==='R'?'<span class="eq-sh r"><b>Repos</b></span>':'<span class="eq-sh" style="--c:'+x.c+'"><b>'+x.l+'</b><small>'+x.t+'</small></span>')+(D.nights[i]===s.id?'<span class="eq-ng">'+ICON('moonstar')+'<span>Astreinte</span></span>':'')+'</button>'}).join('')}).join('')+
   '<div class="eq-nm"><div><div class="b s">Écurie couverte</div><div class="xs mut">Matin, soir et nuit</div></div></div>'+DAYS.map(function(_,i){var gg=g.filter(function(x){return x[0]===i}),nt=D.nights[i];return '<div class="eq-cv">'+(gg.length||!nt?'<span class="chip bad dot">'+(gg.length?gg[0][1]:'nuit')+'</span>':'<span class="chip ok">'+ICON('check','sm')+'</span>')+'</div>'}).join('')+'</div>';
  /* téléphone : un jour à la fois */
  h+='<div class="eq-day"><div style="padding:12px 12px 4px">'+U.seg(DAYS.map(function(d,i){return [String(i),'<span class="hide-s">'+d+'</span><span class="ar-ps">'+d.charAt(0)+'</span> '+(16+i)]}),String(SE.day),'data-day')+'</div><div class="list">'+
   D.staff.slice().sort(function(a,b){return (D.shifts[a.id][SE.day]==='R')-(D.shifts[b.id][SE.day]==='R')}).map(function(s){var k=D.shifts[s.id][SE.day],x=SH[k];return '<div class="li click" data-a="cell" data-id="'+s.id+'" data-d="'+SE.day+'">'+U.av(s)+'<div class="grow"><div class="t">'+s.first+' '+s.last+'</div><div class="s">'+(k==='R'?'Repos':x.t)+'</div></div><div class="r">'+(D.nights[SE.day]===s.id?'<span class="eq-ng">'+ICON('moonstar')+'</span>':'')+(k==='R'?'<span class="chip line">Repos</span>':'<span class="chip" style="background:color-mix(in srgb,'+x.c+' 16%,var(--surface));color:var(--ink)">'+x.l+'</span>')+'</div></div>'}).join('')+'</div></div></div>';
  h+='<div class="ar-g2" style="margin-top:14px"><div class="card"><div class="ch"><div><h3>Règles vérifiées en continu</h3><div class="xs mut">Convention collective IDCC 7026, activités hippiques, annexe des centres équestres</div></div></div><div class="list" style="padding:6px 0">'+
    [['ok','Repos quotidien de 11 heures','Respecté pour les 9 salariés, astreintes comprises'],['ok','Repos hebdomadaire','Au moins un jour complet pour chacun'],[six.length?'warn':'ok','Six jours de travail consécutifs au plus',six.length?six.map(function(s){return s.first}).join(' et ')+' : le maximum est atteint cette semaine':'Personne n’atteint le maximum'],[over.length?'acc':'ok','Heures au-delà du contrat',over.length?over.map(function(s){return s.first+' '+hm(planned(s.id)-s.hours)}).join(', ')+'. Elles iront en préparation de paie.':'Aucune cette semaine']].map(function(r){return '<div class="li">'+sq(r[0]==='ok'?'checkc':r[0]==='warn'?'alert':'clock',r[0],'sm')+'<div class="grow"><div class="t">'+r[1]+'</div><div class="s">'+r[2]+'</div></div></div>'}).join('')+'</div></div>'+
   '<div class="card"><div class="ch"><div><h3>Postes du club</h3><div class="xs mut">Touchez une case du planning pour changer un poste</div></div><button class="btn sm ghost" data-a="types">'+ICON('sliders','sm')+'Modifier</button></div><div class="list" style="padding:6px 0">'+['M','S','J','C'].map(function(k){return '<div class="li" style="padding:8px 16px"><span style="width:4px;height:28px;border-radius:2px;background:'+SH[k].c+'"></span><div class="grow"><div class="t">'+SH[k].l+'</div><div class="s">'+SH[k].t+'</div></div><span class="xs mut num">'+hm(SH[k].h)+'</span></div>'}).join('')+
    '<div class="li" style="padding:8px 16px"><span class="eq-ng">'+ICON('moonstar')+'</span><div class="grow"><div class="t">Astreinte de nuit</div><div class="s">19 h – 7 h, prime de 18 € et intervention majorée</div></div><span class="xs mut">7 nuits</span></div></div></div></div>';
  return h}
function eqHeures(){var rows=D.staff.filter(function(s){return s.id!=='s01'});
  var h=(SE.punch?'':'<div class="note warn ar-nb" style="margin-bottom:12px;align-items:center">'+ICON('clockin','sm')+'<span class="grow"><b>Kévin n’a pas pointé son départ lundi.</b> Son poste du matin finissait à 12 h 30 et la tablette de l’écurie l’a vu partir à 12 h 34.</span><button class="btn sm" data-a="punch">Corriger à 12 h 34</button></div>')+
   '<div class="ar-cols"><div class="stack" style="--g:14px"><div class="ar-t">'+tbl([
    {l:'Salarié',f:function(s){return '<div class="ar-who">'+U.av(s)+'<div><b>'+s.first+' '+s.last+'</b><span class="s2">'+s.contract+'</span></div></div>'}},
    {l:'Planifié',n:1,f:function(s){var p=planned(s.id);return '<b>'+hm(p)+'</b><span class="s2">sur '+s.hours+' h</span>'}},
    {l:'Pointé à ce jour',n:1,f:function(s){return s.id==='s07'&&!SE.punch?'<span class="chip bad dot">1 pointage manquant</span>':'<b>'+hm(pointed(s.id))+'</b>'}},
    {l:'Avancement',c:'ar-h1',f:function(s){return '<div style="width:110px">'+U.bar(pointed(s.id)/planned(s.id)*100)+'</div>'}},
    {l:'Sup. de novembre',n:1,f:function(s){var o=D.hr[s.id].ot;return o?'<b class="warnc">'+hm(o)+'</b>':'<span class="mut2">—</span>'}}],rows,{act:'time'})+'</div>'+
    '<div class="ar-m card">'+rows.map(function(s){var miss=s.id==='s07'&&!SE.punch;return '<button class="fa-mi" data-a="time" data-id="'+s.id+'">'+U.av(s)+'<span class="grow stack" style="--g:5px;min-width:0"><span class="hrow sp"><b class="s ellip">'+s.first+' '+s.last+'</b><span class="xs '+(miss?'badc b':'mut')+'">'+(miss?'pointage manquant':hm(pointed(s.id))+' sur '+hm(planned(s.id)))+'</span></span>'+U.bar(pointed(s.id)/planned(s.id)*100,miss?'var(--bad)':'')+'</span></button>'}).join('')+'</div>'+
    '<div class="card"><div class="ch"><div><h3>Feuilles de temps du 9 au 15 novembre</h3><div class="xs mut">8 salariés sur 8 ont relu et signé leurs heures</div></div>'+(SE.week?'<span class="hrow" style="--g:6px"><span class="strass"></span><span class="chip ok">Semaine validée</span></span>':'<button class="btn sm pri" data-a="week">'+ICON('check','sm')+'Valider la semaine</button>')+'</div><div class="cb ar-g3 ar-k3m">'+head('heures travaillées','259 h')+head('heures supplémentaires','11 h 30')+head('écart avec le planning','+2 h 15')+'</div></div></div>'+
   '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>En direct</h3><span class="chip ok dot">'+Object.keys(PUNCH).length+' en poste</span></div><div class="list" style="padding:6px 0">'+D.staff.map(function(s){var st=stNow(s.id);return '<div class="li" style="padding:8px 16px"><span class="eq-dot" style="--c:'+tone(st[0])+'"></span><div class="grow"><div class="t">'+s.first+' '+s.last+'</div><div class="s">'+st[1]+'</div></div></div>'}).join('')+'</div></div>'+
   '<div class="card"><div class="list" style="padding:6px 0"><div class="li"><div class="grow"><div class="t">Heures supplémentaires</div><div class="s">Majorées à 25 % puis 50 %, selon la convention</div></div>'+U.seg([['p','Payées'],['r','Récupérées']],'p','data-ot')+'</div><div class="li"><div class="grow"><div class="t">Pointage par zone</div><div class="s">Possible seulement sur le site du club</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">Rappel en cas d’oubli</div><div class="s">Notification 15 minutes après la fin du poste</div></div>'+U.tog(true)+'</div></div></div></div></div>';
  return h}
function eqConges(){var pend=D.leaves.filter(function(l){return l.state==='attente'&&!SE.leave[l.id]}),T0=new Date('2026-11-16T12:00:00').getTime(),N=49,KC={'Congés payés':'var(--c1)','Récupération':'var(--c3)','Arrêt maladie':'var(--bad)','Formation au CFA':'var(--c7)'};
  function pos(d){return Math.max(0,Math.min(N,(new Date(d+'T12:00:00').getTime()-T0)/864e5))}
  var who=[];D.leaves.forEach(function(l){if(who.indexOf(l.who)<0&&SE.leave[l.id]!=='no')who.push(l.who)});
  var h='<div class="ar-cols"><div class="stack" style="--g:14px"><div class="card"><div class="ch"><div><h3>Demandes à valider</h3><div class="xs mut">Piaffe vérifie le planning avant de vous proposer une réponse</div></div><span class="chip '+(pend.length?'warn':'ok')+'">'+pend.length+'</span></div>'+
   (pend.length?pend.map(function(l){var s=D.staffer(l.who),H=D.hr[l.who];return '<div class="eq-rq"><div class="hrow">'+U.av(s,'lg')+'<div class="grow"><div class="b">'+s.first+' '+s.last+' · '+l.kind.toLowerCase()+'</div><div class="s mut">'+(l.from===l.to?'Le '+F.dateL(l.from):'Du '+F.date(l.from)+' au '+F.date(l.to))+' · '+l.days+' jour'+(l.days>1?'s':'')+' · demandé '+l.asked+'</div></div><span class="xs mut hide-s">Solde : '+String(l.kind==='Récupération'?H.rec+' h':(H.cp[0]-H.cp[1])+' j').replace('.',',')+'</span></div>'+
     '<div class="note '+(l.impact==='ok'?'ok':'warn')+'">'+ICON(l.impact==='ok'?'checkc':'alert','sm')+'<span>'+l.note+'</span></div><div class="hrow wrap"><button class="btn sm pri" data-a="lv" data-id="'+l.id+'" data-v="ok">'+ICON('check','sm')+'Valider</button>'+(l.impact==='warn'?'<button class="btn sm" data-a="lv" data-id="'+l.id+'" data-v="alt">Proposer le samedi 28</button>':'')+'<button class="btn sm ghost" data-a="lv" data-id="'+l.id+'" data-v="no">Refuser</button></div></div>'}).join(''):'<div class="ar-done" style="padding:20px 16px"><span class="orb" style="width:48px;height:48px">'+tick()+'</span><b>Aucune demande en attente</b><span class="s mut">Les salariés ont reçu votre réponse sur leur téléphone.</span></div>')+'</div>'+
   '<div class="card"><div class="ch"><div><h3>Absences des sept prochaines semaines</h3><div class="xs mut">Du 16 novembre au 3 janvier</div></div></div><div class="cb"><div class="eq-gt"><span></span><div class="wk">'+['16 nov.','23 nov.','30 nov.','7 déc.','14 déc.','21 déc.','28 déc.'].map(function(w){return '<span>'+w.replace(' ',' ').replace(/(\D+)$/,'<i class="hide-s" style="font-style:normal">$1</i>')+'</span>'}).join('')+'</div>'+
    who.map(function(id){var s=D.staffer(id);return '<div class="hrow s" style="--g:8px;height:30px;border-top:1px solid var(--line)">'+U.av(s,'sm')+'<span class="ellip b">'+s.first+'</span></div><div class="eq-trk"><span class="eq-now" style="--l:'+(1.4/N*100)+'%"></span>'+D.leaves.filter(function(l){return l.who===id&&SE.leave[l.id]!=='no'}).map(function(l){var a=pos(l.from),b=pos(l.to)+1,p=l.state==='attente'&&SE.leave[l.id]!=='ok';return '<span class="eq-bar'+(p?' p':'')+'" style="--c:'+KC[l.kind]+';--l:'+(a/N*100)+'%;--w:'+((b-a)/N*100)+'%" title="'+l.kind+', du '+F.date(l.from)+' au '+F.date(l.to)+'"></span>'}).join('')+'</div>'}).join('')+'</div>'+
    '<div style="margin-top:12px">'+C.legend([['Congés payés','var(--c1)'],['Récupération','var(--c3)'],['Arrêt maladie','var(--bad)'],['Formation','var(--c7)'],['Hachuré : en attente','var(--line-2)']])+'</div></div></div></div>'+
   '<div class="card"><div class="ch"><div><h3>Soldes</h3><div class="xs mut">Période du 1er juin 2026 au 31 mai 2027</div></div></div><div class="list" style="padding:6px 0">'+D.staff.filter(function(s){return s.id!=='s01'}).map(function(s){var H=D.hr[s.id],left=H.cp[0]-H.cp[1];return '<div class="li" style="padding:9px 16px">'+U.av(s,'sm')+'<div class="grow stack" style="--g:5px"><div class="hrow sp"><span class="t ellip">'+s.first+' '+s.last+'</span><span class="xs"><b class="num">'+String(left).replace('.',',')+' j</b> <span class="mut">sur '+String(H.cp[0]).replace('.',',')+(H.rec?' · '+hm(H.rec)+' à récupérer':'')+'</span></span></div>'+U.bar(left/H.cp[0]*100,left<8?'var(--warn)':'')+'</div></div>'}).join('')+'</div>'+
   '<div class="cf"><span class="s mut grow">2,08 jours acquis par mois travaillé</span><button class="btn sm ghost" data-a="lvx">'+ICON('download','sm')+'Exporter</button></div></div></div>';
  return h}
function eqPaie(){var miss=!SE.punch,ck=[['Heures validées jusqu’au 15 novembre',SE.week],['Pointages complets',!miss],['Absences et arrêts de travail saisis',true],['Primes du mois confirmées',!!SE.prime]],ready=ck.every(function(c){return c[1]});
  var h='<div class="stack" style="--g:14px"><div><div class="card"><div class="ch"><div><h3>Variables de paie de novembre</h3><div class="xs mut">Arrêtées au 16 novembre. Piaffe prépare les variables, votre logiciel de paie calcule les bulletins.</div></div></div><div style="padding-top:8px">'+
   tbl([{l:'Salarié',f:function(v){var s=D.staffer(v[0]);return '<div class="ar-who">'+U.av(s,'sm')+'<b>'+s.first+' '+s.last+'</b></div>'}},
    {l:'Normales',n:1,c:'hide-s',f:function(v){return hm(v[1])}},{l:'Sup. 25 %',n:1,f:function(v){return v[2]?'<b>'+hm(v[2])+'</b>':'<span class="mut2">—</span>'}},{l:'Sup. 50 %',n:1,c:'hide-s',f:function(v){return v[3]?'<b>'+hm(v[3])+'</b>':'<span class="mut2">—</span>'}},
    {l:'Dim. et fériés',n:1,c:'hide-s',f:function(v){return v[4]?hm(v[4]):'<span class="mut2">—</span>'}},
    {l:'Absences et primes',c:'hide-s ar-wr',f:function(v){return [v[6],v[7]].filter(Boolean).join(' · ')||'<span class="mut2">—</span>'}},
    {l:'État',f:function(v){return v[8]===0&&miss?U.chip('pointage manquant','bad',true):v[8]===2&&!SE.prime?'<button class="btn sm" data-a="prime">Confirmer la prime</button>':U.chip('complet','ok',true)}}],VARS.map(function(v,i){v.id=i;return v}),{card:false})+'</div></div></div>'+
   '<div class="ar-g2" style="align-items:start"><div class="card"><div class="ch"><h3>Avant l’export</h3><span class="chip '+(ready?'ok':'warn')+'">'+ck.filter(function(c){return c[1]}).length+' sur 4</span></div><div class="list" style="padding:6px 0">'+ck.map(function(c){return '<div class="li" style="padding:8px 16px">'+(c[1]?tick():'<span class="chk"></span>')+'<div class="grow s '+(c[1]?'':'b')+'">'+c[0]+'</div></div>'}).join('')+'</div>'+
    '<div class="cb stack" style="--g:8px;padding-top:4px">'+(SE.exp?'<div class="note ok">'+ICON('checkc','sm')+'<span>Variables de 8 salariés envoyées à '+SE.exp+' aujourd’hui à 9 h 41. Les bulletins seront disponibles le 27 novembre.</span></div>':'<button class="btn pri block ar-pay" data-a="exp" data-k="Payfit">'+ICON('send','sm')+'Envoyer les variables à Payfit</button>')+'<div class="hrow"><button class="btn sm grow" data-a="exp2" data-k="Silae">Fichier pour Silae</button><button class="btn sm grow" data-a="exp2" data-k="CSV">Fichier CSV</button></div></div></div>'+
   '<div class="card"><div class="ch"><h3>Déclaration sociale nominative</h3>'+U.chip('À jour','ok',true)+'</div><div class="cb"><div class="tl"><div class="ev" style="--c:var(--ok)"><div class="s b">DSN d’octobre déposée le 5 novembre</div><div class="xs mut">Par votre logiciel de paie, accusé de réception reçu</div></div><div class="ev" style="--c:var(--ok)"><div class="s b">Arrêt de travail de Kévin signalé</div><div class="xs mut">Événement transmis le 12 novembre, reprise le 16</div></div><div class="ev" style="--c:var(--acc);padding-bottom:0"><div class="s b">DSN de novembre attendue le 5 décembre</div><div class="xs mut">Piaffe fournit les heures, les absences et les primes</div></div></div></div></div></div></div>';
  return h}
function eqDocs(){var done=ONB.filter(function(_,i){return SE.onb[i]}).length,all=done===ONB.length;
  return '<div class="ar-g2"><div class="stack" style="--g:14px"><div class="card"><div class="ch"><div><h3>Accueil d’Élise Marchand</h3><div class="xs mut">Palefrenière soigneuse, arrivée le mardi 1er décembre</div></div>'+(all?'<span class="hrow" style="--g:6px"><span class="strass"></span><span class="chip ok">Prête pour son premier jour</span></span>':'<span class="chip acc">'+done+' sur '+ONB.length+'</span>')+'</div><div style="padding:12px 16px 4px">'+U.bar(done/ONB.length*100,all?'var(--ok)':'')+'</div><div style="padding:4px 0">'+
    ONB.map(function(o,i){return '<button class="eq-ob" role="checkbox" data-a="onb" data-i="'+i+'" aria-checked="'+!!SE.onb[i]+'"><span class="chk" data-manual aria-checked="'+!!SE.onb[i]+'"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></span><span class="t s grow">'+o+'</span></button>'}).join('')+'</div></div></div>'+
   '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><div><h3>Entretiens annuels</h3><div class="xs mut">Trame du club : bilan, objectifs, formation, conditions de travail</div></div><button class="btn sm ghost" data-a="trame">Voir la trame</button></div><div class="list" style="padding:6px 0">'+
    D.reviews.map(function(r){var s=D.staffer(r[0]);return '<div class="li" style="padding:9px 16px">'+U.av(s,'sm')+'<div class="grow"><div class="t">'+s.first+' '+s.last+'</div><div class="s">'+(r[3]==='fait'?'Fait le '+F.date(r[1]):r[3]==='bilan de période'?'Bilan de fin de période d’essai le '+F.date(r[2]):r[2]?'Prévu le '+F.dateY(r[2]):'Dernier entretien le '+F.dateY(r[1]))+'</div></div><div class="r">'+(r[3]==='à planifier'&&!SE['rv'+r[0]]?'<button class="btn sm" data-a="rv" data-id="'+r[0]+'">Planifier</button>':U.chip(r[3]==='à planifier'?'planifié':r[3],r[3]==='fait'?'ok':'acc',true))+'</div></div>'}).join('')+'</div></div>'+
   '<div class="card"><div class="ch"><h3>Documents RH</h3><button class="btn sm ghost" data-a="updoc">'+ICON('upload','sm')+'Déposer</button></div><div class="list" style="padding:6px 0">'+
    [['contract','Contrats et avenants','11 documents signés électroniquement'],['doc','Fiches de poste','9 fiches, mises à jour en septembre'],['folder','Registre unique du personnel','Tenu automatiquement, à jour'],['shield','Document unique d’évaluation des risques','Mis à jour le 4 septembre 2026'],['medal','Diplômes et attestations','17 pièces, 3 échéances suivies'],['euro','Bulletins de paie','Déposés chaque mois par le logiciel de paie']].map(function(d){return '<div class="li click" data-a="folder" data-k="'+d[1]+'" style="padding:9px 16px">'+sq(d[0],'mut','sm')+'<div class="grow"><div class="t">'+d[1]+'</div><div class="s">'+d[2]+'</div></div>'+ICON('right','sm')+'</div>'}).join('')+'</div></div></div></div>'}
function eqDroits(){var r=ROLES.find(function(x){return x[0]===SE.role}),lv=SE.perm[SE.role]||(SE.perm[SE.role]=PDEF[SE.role].slice());
  return '<div class="eq-rs">'+U.seg(ROLES.map(function(x){return [x[0],x[0]]}),SE.role,'data-role2')+'</div><div class="ar-cols eq-dc"><div class="card eq-rl" style="padding:8px"><div class="stack" style="--g:2px">'+
   ROLES.map(function(x){return '<button class="eq-role" data-a="role" data-k="'+x[0]+'" aria-pressed="'+(x[0]===SE.role)+'"><div class="grow" style="min-width:0"><div class="b s">'+x[0]+'</div><div class="xs mut">'+x[1]+'</div></div>'+(x[2].length?U.avs(x[2],3):'<span class="chip line">invité</span>')+'</button>'}).join('')+'</div><div style="padding:8px 6px 4px"><button class="btn sm block" data-a="newrole">'+ICON('plus','sm')+'Créer un rôle</button></div></div>'+
   '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><div><h3>Ce que voit le rôle « '+r[0]+' »</h3><div class="xs mut">'+(r[2].length?r[2].map(function(i){return D.staffer(i).first}).join(', '):'Stéphanie Collet, cabinet Fidéa Conseil')+'</div></div></div><div style="padding-top:8px">'+
   PMODS.map(function(m,i){return '<div class="eq-pm">'+sq(m[1],lv[i]?'acc':'mut','sm')+'<div class="grow b s" style="min-width:120px">'+m[0]+'</div>'+U.seg([['0','Aucun accès'],['1','Lecture'],['2','Complet']],String(lv[i]),'data-pm="'+i+'" data-lv')+'</div>'}).join('')+'</div></div>'+
   '<div class="card"><div class="list" style="padding:6px 0"><div class="li"><div class="grow"><div class="t">Chacun ne voit que ses propres heures et ses congés</div><div class="s">Les salaires restent visibles de la gérante seule</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">Double authentification obligatoire</div><div class="s">Pour tous les rôles qui voient de l’argent</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">Journal des actions</div><div class="s">Qui a modifié quoi, consultable pendant trois ans</div></div><button class="btn sm ghost" data-a="log">Ouvrir'+ICON('arrow','sm')+'</button></div></div></div></div></div>'}

P.mod({id:'equipe',role:'gerant',group:'Équipe',title:'Équipe',icon:'team',n:10,phoneTitle:'Équipe',
 badge:function(){var n=D.leaves.filter(function(l){return l.state==='attente'&&!SE.leave[l.id]}).length;return n?{v:n}:null},
 render:function(el,ctx){syncB();
  if(ctx.params.tab){SE.tab=ctx.params.tab;ctx.params.tab=null}
  var ET=[['salaries','Salariés'],['planning','Planning'],['heures','Heures et pointage'],['conges','Congés et absences'],['paie','Paie'],['docs','Documents et entretiens'],['droits','Droits d’accès']];
  var pres=Object.keys(PUNCH).length,pend=D.leaves.filter(function(l){return l.state==='attente'&&!SE.leave[l.id]}).length,tot=sum(D.staff.filter(function(s){return s.id!=='s01'}),function(s){return planned(s.id)}),ctr=sum(D.staff.filter(function(s){return s.id!=='s01'}),function(s){return s.hours}),ot=sum(D.staff,function(s){return D.hr[s.id].ot}),due=D.staff.filter(function(s){return worst(s.id)}).length+(SE.dip.cdd?0:1);
  el.innerHTML='<div class="ar-hd">'+U.ph('Équipe','9 salariés · '+pres+' en poste ce matin, 2 attendus à 13 h 30 · '+(pend?pend+' demande'+(pend>1?'s':'')+' de congé à valider':'aucune demande en attente'),
    '<button class="btn" data-a="tab" data-k="paie">'+ICON('euro','sm')+'Préparer la paie</button><button class="btn pri" data-a="newstaff">'+ICON('plus','sm')+'Ajouter un salarié</button>')+'</div>'+
   '<div class="ar-k4 '+(REDRAW?'':'rise')+'">'+K({label:'En poste ce matin',value:pres+'<small> sur 9</small>',delta:'2 attendus à 13 h 30',tone:'acc',di:'clock',bar:pres/9*100,icon:'clockin'})+
    K({label:'Heures planifiées cette semaine',value:hm(tot),delta:tot>ctr?'+'+hm(tot-ctr):hm(ctr-tot)+' de marge',tone:tot>ctr+8?'warn':'ok',di:tot>ctr?'up':'check',dsub:' pour '+ctr+' h de contrats',bar:Math.min(100,tot/ctr*100),color:tot>ctr+8?'var(--warn)':'var(--ok)',icon:'planning'})+
    K({label:'Heures supplémentaires de novembre',value:hm(ot),delta:'−3 h',tone:'ok',di:'down',dsub:' vs octobre',spark:[31,28,35,30,26.5,23.5],color:'var(--c4)',icon:'hourglass'})+
    K({label:'À traiter',value:String(pend+due+(SE.punch?0:1)),delta:pend+' congé'+(pend>1?'s':''),tone:pend+due?'warn':'ok',di:pend+due?'alert':'check',dsub:' · '+due+' échéance'+(due>1?'s':'')+(SE.punch?'':' · 1 pointage'),bar:100-(pend+due)*12,color:'var(--warn)',icon:'bell'})+'</div>'+
   tabsBar(ET,SE.tab,'data-et')+'<div id="eq-body"></div>'+
   '<div class="ar-cta"><button class="btn pri" data-a="tab" data-k="conges">'+ICON('holiday')+(pend?'Valider '+pend+' congé'+(pend>1?'s':''):'Voir les congés')+'</button><button class="btn icon" data-a="newstaff" title="Ajouter un salarié">'+ICON('plus')+'</button></div>';
  var body=el.querySelector('#eq-body');
  function draw(anim){var f={salaries:eqSalaries,planning:eqPlanning,heures:eqHeures,conges:eqConges,paie:eqPaie,docs:eqDocs,droits:eqDroits}[SE.tab]||eqSalaries;body.innerHTML=f();body.className=anim?'fade':'';P.animate(body);syncB();
    var dy=body.querySelector('.eq-day .seg [aria-selected="true"]');if(dy&&dy.scrollIntoView&&SE.day>3)dy.parentNode.scrollLeft=dy.offsetLeft-40}
  draw();
  el.addEventListener('click',function(e){var t=e.target.closest('[data-et]');if(t){SE.tab=t.getAttribute('data-et');draw(true);return}
    var g=e.target.closest('[data-grp]');if(g){SE.grp=g.getAttribute('data-grp');draw();return}var d=e.target.closest('[data-day]');if(d){SE.day=+d.getAttribute('data-day');draw();return}
    var r=e.target.closest('[data-role2]');if(r){SE.role=r.getAttribute('data-role2');draw();return}
    var pm=e.target.closest('[data-lv]');if(pm){var i=+pm.getAttribute('data-pm'),v=+pm.getAttribute('data-lv');if(SE.role==='Gérant'&&v<2){P.toast('Le rôle Gérant garde toujours un accès complet',{icon:'lock'});draw();return}SE.perm[SE.role][i]=v;draw();P.toast('Droits du rôle « '+SE.role+' » mis à jour : '+PMODS[i][0].toLowerCase()+', '+['aucun accès','lecture','accès complet'][v])}});
  on(el,{
   tab:function(b){SE.tab=b.getAttribute('data-k');P.$$('[data-et]',el).forEach(function(x){x.setAttribute('aria-selected',x.getAttribute('data-et')===SE.tab)});draw(true);el.querySelector('.ar-tabs').scrollIntoView({block:'start',behavior:P.RM?'auto':'smooth'})},
   newstaff:function(){openNewStaff()},staff:function(b){openStaff(b.getAttribute('data-id'))},
   dip:function(b){var id=b.getAttribute('data-id'),k=b.getAttribute('data-k'),s=D.staffer(id);SE.dip[id+k]=1;re();P.toast(/PSC1/.test(k)?s.first+' est inscrit'+(FEM[id]?'e':'')+' à la session PSC1 du 12 décembre':'Dossier de renouvellement préparé pour '+s.first,{icon:'checkc'})},
   cdd:function(){SE.dip.cdd=1;re();P.toast('Rappel posé au 15 janvier : renouvellement ou CDI à décider avec Kévin',{icon:'calendar_add'})},
   cell:function(b){openCell(b.getAttribute('data-id'),+b.getAttribute('data-d'))},
   gap:function(){var p=D.shifts.s07[6];D.shifts.s07[6]='S';re();P.toast('Kévin assure la distribution de dimanche soir, il est prévenu',{undo:function(){D.shifts.s07[6]=p;re()}})},
   pub:function(){SE.pub=true;draw();P.toast('Planning publié : 9 salariés prévenus sur leur téléphone',{icon:'send'})},copy:function(){P.toast('Semaine du 9 au 15 novembre recopiée, 2 postes adaptés aux congés',{icon:'copy'})},wk:function(){P.toast('Seule la semaine en cours est chargée dans la démonstration',{icon:'info'})},
   types:function(){P.toast('Les postes se règlent dans Réglages, rubrique Équipe',{icon:'sliders'})},
   punch:function(){SE.punch=true;re();P.toast('Départ de Kévin corrigé à 12 h 34, il en est informé',{undo:function(){SE.punch=false;re()}})},
   time:function(b){openSheetTime(b.getAttribute('data-id'))},week:function(){SE.week=true;draw();P.toast('Semaine du 9 au 15 novembre validée : 259 heures envoyées en préparation de paie')},
   lv:function(b){var id=b.getAttribute('data-id'),v=b.getAttribute('data-v'),l=D.leaves.find(function(x){return x.id===id}),s=D.staffer(l.who);if(v==='alt'){l.from=l.to='2026-11-28';l.impact='ok';l.note='Le samedi 28, Lucie et Kévin sont à l’écurie : la journée est couverte.';draw();P.toast('Proposition envoyée à '+s.first+' : le samedi 28 novembre',{icon:'send'});return}
     SE.leave[id]=v;re();P.toast(v==='ok'?'Congé de '+s.first+' validé, planning mis à jour':'Demande de '+s.first+' refusée, un message lui est proposé',{undo:function(){delete SE.leave[id];re()}})},
   lvx:function(){P.toast('Soldes de congés exportés',{icon:'download'})},
   prime:function(){SE.prime=1;draw();P.toast('Prime de concours de Thomas confirmée')},
   exp:function(b){payBtn(b,'Variables envoyées',function(){SE.exp='Payfit';draw();P.toast('Variables de novembre envoyées à Payfit',{icon:'send'})})},
   exp2:function(b){var k=b.getAttribute('data-k');P.toast(k==='CSV'?'variables-paie-2026-11.csv téléchargé':'Fichier d’import Silae téléchargé',{icon:'download'})},
   onb:function(b){var i=+b.getAttribute('data-i');SE.onb[i]=!SE.onb[i];draw();if(ONB.every(function(_,k){return SE.onb[k]}))P.toast('Tout est prêt pour l’arrivée d’Élise le 1er décembre',{icon:'spark'})},
   trame:function(){sheet({title:'Trame de l’entretien annuel',icon:'doc',body:'<div class="ar-box list">'+[['Bilan de l’année','Réussites, difficultés, cavalerie et clientèle'],['Objectifs de l’année à venir','Trois objectifs au plus, mesurables'],['Formation','Diplômes visés, recyclages, envies'],['Conditions de travail','Charge, horaires, matériel, sécurité'],['Rémunération et évolution','Classification et perspectives']].map(function(x,i){return '<div class="li"><span class="mono mut">'+(i+1)+'</span><div class="grow"><div class="t">'+x[0]+'</div><div class="s">'+x[1]+'</div></div></div>'}).join('')+'</div><div class="note">'+ICON('sign','sm')+'<span>Le compte rendu se signe à deux sur la tablette et se range dans le dossier du salarié.</span></div>',foot:'<button class="btn pri" data-a="x">Utiliser cette trame</button>'},{x:function(b){b.closest('.sheet').close();P.toast('Trame appliquée aux entretiens de décembre')}})},
   rv:function(b){SE['rv'+b.getAttribute('data-id')]=1;draw();P.toast('Entretien proposé à '+D.staffer(b.getAttribute('data-id')).first+' le mardi 8 décembre à 14 h',{icon:'calendar_add'})},
   updoc:function(){P.toast('Déposez un PDF ou photographiez le document : il est classé tout seul',{icon:'upload'})},folder:function(b){P.toast('Dossier « '+b.getAttribute('data-k')+' » ouvert',{icon:'folder'})},
   role:function(b){SE.role=b.getAttribute('data-k');draw()},newrole:function(){P.toast('Nouveau rôle créé à partir de « '+SE.role+' » : nommez-le et ajustez ses droits',{icon:'plus'})},log:function(){P.toast('Journal ouvert : 214 actions cette semaine, aucune anomalie',{icon:'shield'})}
  });
 }});

/* =====================================================================
   Palette, assistant et visite guidée
   ===================================================================== */
function goTab(route,tab){return function(){P.go(route,{tab:tab})}}
P.actions.push(
 {role:'gerant',label:'Lancer la facturation de décembre',icon:'invoice',run:function(){P.go('facturation');setTimeout(openBatch,350)}},
 {role:'gerant',label:'Encaisser un paiement',icon:'card',run:function(){P.go('facturation');setTimeout(function(){openPay()},350)}},
 {role:'gerant',label:'Créer une facture',icon:'plus',run:function(){P.go('facturation');setTimeout(openNew,350)}},
 {role:'gerant',label:'Générer le bordereau de remise de chèques',icon:'sign',run:goTab('facturation','encaisser')},
 {role:'gerant',label:'Rapprocher la banque',icon:'bank',run:goTab('compta','banque')},
 {role:'gerant',label:'Voir la trésorerie à 90 jours',icon:'trend',run:goTab('compta','treso')},
 {role:'gerant',label:'Photographier un justificatif',icon:'scan',run:function(){P.go('compta',{tab:'justifs'});setTimeout(openScan,350)}},
 {role:'gerant',label:'Exporter le FEC',icon:'download',run:goTab('compta','exports')},
 {role:'gerant',label:'Ouvrir le planning de l’équipe',icon:'team',run:goTab('equipe','planning')},
 {role:'gerant',label:'Valider les congés',icon:'holiday',run:goTab('equipe','conges')},
 {role:'gerant',label:'Préparer la paie de novembre',icon:'euro',run:goTab('equipe','paie')},
 {role:'gerant',label:'Ajouter un salarié',icon:'user',run:function(){P.go('equipe');setTimeout(openNewStaff,350)}});
function line(a,b){return '<div class="hrow sp"><span class="s">'+a+'</span><b class="s num">'+b+'</b></div>'}
P.brain.push(
 {role:'gerant',re:/tr[ée]so|solde|banque|cash|rapproch/i,reply:function(){var S=tseries('prevu'),fut=S.filter(function(s){return s.o>0}),low=fut.reduce(function(a,s){return s.v<a.v?s:a},fut[0]),n=unmatched().length;
   return {text:'Le compte courant est à <b>'+F.eur(48320)+'</b> ce matin, plus 25 000 € sur le livret. Sur 90 jours, le point bas arrive le '+F.date(D.iso(D.day(low.o)))+' à '+F.eur(Math.round(low.v/10)*10)+', au-dessus de votre seuil de 20 000 €.',card:line('Aujourd’hui',F.eur(48320))+line('Point bas, '+F.date(D.iso(D.day(low.o))),F.eur(Math.round(low.v/10)*10))+line('Dans 90 jours',F.eur(Math.round(S[S.length-1].v/10)*10))+line('À rapprocher',n+' opération'+(n>1?'s':'')),
    actions:[{label:'Voir la courbe',run:function(){P.go('compta',{tab:'treso'});return 'Trésorerie ouverte'}},{label:'Rapprocher la banque',run:function(){P.go('compta',{tab:'banque'});return 'Banque ouverte'}}]}}},
 {role:'gerant',re:/tva|taxe|d[ée]clar/i,reply:function(){return {text:'La TVA d’octobre s’élève à <b>'+F.eur(2890)+'</b>, à déposer avant le 24 novembre. Novembre est estimé à 2 610 € au 17. Les taux sont ventilés par prestation : 5,5 % pour l’enseignement et l’accès aux installations, 20 % pour la pension et le reste, à valider avec votre expert-comptable.',card:line('Collectée à 5,5 %',F.eur(1718))+line('Collectée à 20 %',F.eur(3556))+line('Déductible','−'+F.eur(2384))+line('À payer',F.eur(2890)),
    actions:[{label:'Transmettre à l’expert-comptable',run:function(){SC.tvaSent=true;P.toast('Déclaration d’octobre transmise à Stéphanie Collet',{icon:'send'});return 'Déclaration transmise'}},{label:'Voir le détail',run:function(){P.go('compta',{tab:'tva'});return 'TVA ouverte'}}]}}},
 {role:'gerant',re:/heure|pointage|suppl|paie|salaire|planning de l.[ée]quipe|astreinte/i,reply:function(){var top=D.staff.filter(function(s){return D.hr[s.id].ot>0}).sort(function(a,b){return D.hr[b.id].ot-D.hr[a.id].ot});
   return {text:'L’équipe cumule <b>'+hm(sum(D.staff,function(s){return D.hr[s.id].ot}))+'</b> supplémentaires en novembre, 3 h de moins qu’en octobre. '+(SE.punch?'Tous les pointages sont complets.':'Il manque un pointage : Kévin n’a pas badgé son départ lundi.'),card:top.slice(0,4).map(function(s){return line(s.first+' '+s.last,hm(D.hr[s.id].ot))}).join(''),
    actions:[{label:'Ouvrir les heures',run:function(){P.go('equipe',{tab:'heures'});return 'Heures ouvertes'}},{label:'Préparer la paie',run:function(){P.go('equipe',{tab:'paie'});return 'Paie ouverte'}}]}}},
 {role:'gerant',re:/cong[ée]|absen|vacances|repos|arr[êe]t/i,reply:function(){var p=D.leaves.filter(function(l){return l.state==='attente'&&!SE.leave[l.id]});
   return {text:p.length?p.length+' demande'+(p.length>1?'s attendent':' attend')+' votre réponse. J’ai vérifié le planning pour chacune.':'Aucune demande de congé n’attend de réponse. Prochaines absences : Thomas du 21 au 23 décembre, Nadia du 28 décembre au 2 janvier.',card:p.map(function(l){return line(D.name(l.who)+', '+l.kind.toLowerCase(),F.date(l.from)+(l.from!==l.to?' au '+F.date(l.to):''))}).join('')||null,
    actions:[{label:p.length?'Voir les demandes':'Voir le calendrier',run:function(){P.go('equipe',{tab:'conges'});return 'Congés ouverts'}}]}}},
 {role:'gerant',re:/factur|pr[ée]l[èe]vement|sepa|avoir|[ée]ch[ée]ancier/i,reply:function(){var S=batchStats();return {text:SF.batch?'La facturation de décembre est partie : '+S.n+' factures pour '+F.eur(S.ttc)+'.':'La facturation de décembre est prête : <b>'+S.n+' factures</b> pour '+F.eur(S.ttc)+', dont '+S.sepa.length+' prélèvements le 5 décembre. Trois points sont à vérifier avant l’envoi.',card:CATS.map(function(c){return line(c[1],F.eur(S.cat[c[0]].ttc))}).join(''),
    actions:[{label:SF.batch?'Voir le récapitulatif':'Ouvrir l’aperçu',run:function(){P.go('facturation');setTimeout(openBatch,350);return 'Aperçu ouvert'}}]}}});
P.tourSteps.push({route:'facturation',title:'Un mois de facturation en un geste',text:'Piaffe prépare les forfaits, les pensions, les demi-pensions et les prestations refacturées. Le gérant vérifie l’aperçu, lance la génération, et les prélèvements partent tout seuls. La TVA est ventilée ligne par ligne.'});
})();
