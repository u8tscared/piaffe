/* =====================================================================
   PIAFFE · Landing · comportements et maquettes vivantes
   ===================================================================== */
(function(){
'use strict';
var D=document,R=D.documentElement;R.classList.add('js');
var RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
var $=function(s,r){return (r||D).querySelector(s)},$$=function(s,r){return [].slice.call((r||D).querySelectorAll(s))};
var I=function(n,k){return ICON(n,k)};
var HG=function(){return HORSE_GLYPH()};
var LG=function(s,c,e){return LOGO(s,c||'currentColor',e||'var(--acc)',true)};
var DEMO='https://claude.ai/artifact/Vdt6ti3FA1Nii45Y42nRKN';
var SCROLLERS=[];
/* espaces insécables : avant : ; ? ! % € » et après « */
function nb(s){return String(s).replace(/ ([:;?!%€»])/g,' $1').replace(/« /g,'« ')}
function nbTree(root){var tw=D.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:function(n){return n.parentNode.closest('pre,code,script,style')?2:1}}),n;while((n=tw.nextNode())){var v=nb(n.nodeValue);if(v!==n.nodeValue)n.nodeValue=v}}
function eur(n){return Math.round(n).toLocaleString('fr-FR')+' €'}
function fmt(n){return Math.round(n).toLocaleString('fr-FR')}
function av(t,c){return '<span class="u-av" style="--c:var(--c'+(c||1)+')">'+t+'</span>'}
function hav(){return '<span class="u-hav">'+HG()+'</span>'}
function chip(t,k,dot){return '<span class="u-chip'+(k?' '+k:'')+(dot?' dot':'')+'">'+t+'</span>'}

/* ---------- boucle vivante, active seulement à l'écran ---------- */
function live(el,run,th){if(!el)return;var tok=0,on=false;
  function start(){var my=++tok;var w=function(ms){return new Promise(function(res,rej){if(RM)return res();setTimeout(function(){if(tok===my&&on)res();else rej(0)},ms)})};
    (async function(){try{do{await run(w,el)}while(!RM&&on&&tok===my)}catch(e){if(e!==0)console.error(e)}})()}
  new IntersectionObserver(function(es){var e=es[es.length-1];if(e.isIntersecting&&!on){on=true;start()}else if(!e.isIntersecting&&on){on=false;tok++}},{threshold:th||.25}).observe(el)}
async function type(node,text,w,sp){text=nb(text);if(RM){node.textContent=text;return}for(var i=1;i<=text.length;i++){node.textContent=text.slice(0,i);await w(sp||34)}}
function countUp(el,to,dur,f){f=f||fmt;if(RM){el.textContent=f(to);return}var t0=performance.now(),from=0;dur=dur||1400;
  (function step(now){var p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,4);el.textContent=f(from+(to-from)*e);if(p<1)requestAnimationFrame(step)})(t0)}

/* ---------- thème ---------- */
(function(){var k='piaffe-landing-theme';try{var s=localStorage.getItem(k);if(s)R.setAttribute('data-theme',s)}catch(e){}
  $('#theme').addEventListener('click',function(){var dark=R.getAttribute('data-theme')?R.getAttribute('data-theme')==='dark':matchMedia('(prefers-color-scheme:dark)').matches;var n=dark?'light':'dark';R.setAttribute('data-theme',n);try{localStorage.setItem(k,n)}catch(e){}D.dispatchEvent(new Event('theme'))})})();
function isDark(){var t=R.getAttribute('data-theme');return t?t==='dark':matchMedia('(prefers-color-scheme:dark)').matches}

/* ---------- mise à l'échelle des maquettes ---------- */
var ro=new ResizeObserver(function(es){es.forEach(function(e){var el=e.target,w=+el.dataset.w,cw=el.clientWidth;if(cw)el.style.setProperty('--k',(cw/w).toFixed(5));var inn=el.firstElementChild;if(inn){inn.style.width=w+'px';inn.style.height=el.dataset.h+'px'}})});
function fits(root){$$('.fit',root).forEach(function(f){ro.observe(f)})}

/* =====================================================================
   1. HERO : interface du gérant synchronisée avec le mot qui tourne
   ===================================================================== */
var NAV=[['Pilotage',[['today','Aujourd’hui','cockpit',4],['report','Rapports']]],
  ['Écurie',[['horse','Chevaux','chev',2],['cube','Plan 3D'],['camera','Caméras et capteurs','cam',2],['care','Soins',0,3],['upkeep','Entretien et stocks','ent',2]]],
  ['Club',[['planning','Planning','plan',1],['members','Adhérents','adh',4],['compet','Compétitions','conc',1]]],
  ['Argent',[['invoice','Facturation','fact',7],['accounting','Comptabilité','compta',3],['contract','Contrats',0,3]]],
  ['Équipe',[['team','Équipe','equipe',2]]],
  ['Plateforme',[['assistant','Assistant'],['plug','Connecteurs']]]];
function side(active,glisse){var h='<aside class="u-side'+(glisse?'':' fixe')+'"><div class="u-club"><span class="lg">'+LG(22,'#fff','var(--strass)')+'</span><div><b>Écurie des Tilleuls</b><small>Club FFE · 46 boxes</small></div></div>'+(glisse?'<i class="u-sel"></i>':'');
  NAV.forEach(function(g){h+='<div class="u-g">'+g[0]+'</div>';g[1].forEach(function(it){h+='<div class="u-it'+(it[2]===active?' on':'')+'" data-k="'+(it[2]||'')+'">'+I(it[0])+'<span>'+it[1]+'</span>'+(it[3]?'<em>'+it[3]+'</em>':'')+'</div>'})});
  return h+'</aside>'}
function top(t,s,b){return '<div class="u-top"><div><h2>'+t+'</h2><p>'+s+'</p></div><div class="u-btns">'+(b||'')+'</div></div>'}
function kpi(ic,l,v,d,bad){return '<div class="u-card u-kpi"><div class="lb">'+I(ic)+l+'</div><div class="v">'+v+'</div>'+(d?'<div class="d'+(bad?' bad':'')+'">'+d+'</div>':'')+'</div>'}
function camFeed(lbl,t,alert){return '<div class="cam'+(alert?' al':'')+'"><div class="cam-h">'+LG(120,'rgba(255,255,255,.10)','rgba(255,255,255,.18)')+'</div><span class="cam-l">'+chip('En direct','bad',true)+'</span><span class="cam-n">'+lbl+'</span><span class="cam-t mono">'+t+'</span>'+(alert?'<span class="cam-a">'+I('alert')+alert+'</span>':'')+'</div>'}

var P={};
P.fact=function(){var rows=[['F-2026-1201','Famille Roux','Forfait annuel, 3e mensualité','186'],['F-2026-1202','Léa Martin','Pension Ulysse, novembre','520'],['F-2026-1203','Mairie de Saint-Arnoult','Séances scolaires, Chorus Pro','1 140'],['F-2026-1204','Hugo Garnier','Carte 10 séances','290'],['F-2026-1205','Famille Dubreuil','Stage de Noël, acompte','58'],['F-2026-1206','Inès Lambert','Pension et ferrure','612']];
  return top('Facturation','Novembre 2026 · 148 factures prêtes à partir','<span class="u-btn">'+I('download')+'Exporter</span><span class="u-btn pri" data-go>'+I('send')+'Émettre les 148 factures</span>')+
  '<div class="u-g4" style="margin-bottom:14px">'+kpi('euro','Facturé en novembre','49 600 €','+8,4 % sur un an')+kpi('wallet','Encaissé','41 280 €','20 paiements aujourd’hui')+kpi('alert','En retard','2 073 €','7 factures',1)+kpi('bank','Prélèvements du 5 décembre','18 420 €','96 mandats SEPA')+'</div>'+
  '<div class="u-card"><table class="u-tbl"><tr><th>Numéro</th><th>Client</th><th>Objet</th><th style="text-align:right">Montant</th><th>Statut</th></tr>'+rows.map(function(r){return '<tr><td class="mono">'+r[0]+'</td><td><b>'+r[1]+'</b></td><td>'+r[2]+'</td><td class="n">'+r[3]+' €</td><td data-st>'+chip('Brouillon','',true)+'</td></tr>'}).join('')+'</table></div>'};
P.plan=function(){var L=[['Grand manège',[[0,1.5,'Baby poney','Inès · 6/6',6],[2,3.5,'Galop 3','Hugo · 8/8',1],[5,6.2,'Longe','Jade',4],[8,9.5,'Galop 5','Thomas · 7/8',5]]],['Carrière d’honneur',[[1,2,'Travail Ulysse','Léa',3],[3.25,4.25,'Particulier CSO','Pauline · Léa',1],[4.25,5.5,'Collectif CSO','Pauline · 6/6',7],[9,10.5,'Galop 7','Thomas',6]]],['Petite carrière',[[0.5,2,'Galop 1','Inès · 5/6',7],[6,7.5,'Hersage','Kévin',4],[7.5,9,'Galop 2','Hugo · 8/8',3]]],['Rond de longe',[[2,3,'Débourrage','Sophie Lambert',5],[10,11,'Détente','Mamadou',3]]],['Extérieur',[[4,7,'Balade en forêt','Hugo · 9 cavaliers',7]]]];
  var h='<div class="u-card u-pad"><div class="mk-plan" style="grid-template-columns:120px 1fr">'+'<div class="h"></div><div class="h" style="display:flex;justify-content:space-between">'+['8 h','10 h','12 h','14 h','16 h','18 h','20 h'].map(function(x){return '<span>'+x+'</span>'}).join('')+'</div>';
  L.forEach(function(r,ri){h+='<div class="pi">'+r[0]+'</div><div class="cl" style="height:58px">'+r[1].map(function(b,bi){return '<div class="blk" style="--c:var(--c'+b[4]+');left:'+(b[0]/12*100)+'%;width:'+((b[1]-b[0])/12*100)+'%;--d:'+(ri*.08+bi*.05)+'s">'+b[2]+'<small>'+b[3]+'</small></div>'}).join('')+'</div>'});
  h+='<div class="now" style="left:calc(120px + (100% - 120px) * '+(1.68/12)+')"></div></div></div>';
  return top('Planning','Mardi 17 novembre · 14 reprises · 112 cavaliers','<span class="u-btn">'+I('waitlist')+'Liste d’attente · 6</span><span class="u-btn pri">'+I('plus')+'Créer une reprise</span>')+
   '<div class="u-g4" style="margin-bottom:14px">'+kpi('planning','Remplissage cette semaine','86 %','+3 points')+kpi('repeat','Rattrapages à placer','9')+kpi('horse','Chevaux au repos','4')+kpi('clock','Prochaine reprise','10 h')+'</div>'+h};
P.chev=function(){var H=[['Ulysse de la Roche','B01','Propriétaire','ok','Au paddock',44],['Tornado','B07','Club','warn','Boiterie, vétérinaire 14 h',80],['Quiétude','B02','Club','ok','Au box',56],['Xanthos','B23','Demi-pension','bad','Boit 40 % de moins',30],['Vanille','B03','Club','ok','Au travail',62],['Sirius du Moulin','B04','Propriétaire','ok','Au box',38],['Caramel','B28','Club','ok','Au paddock',50],['Opale','B05','Club','acc','Ferrure jeudi',66]];
  return top('Chevaux','44 chevaux · 46 boxes · 2 chevaux déclarés à valider','<span class="u-btn">'+I('qr')+'Scanner un box</span><span class="u-btn pri">'+I('plus')+'Ajouter avec le SIRE</span>')+
  '<div class="u-g4">'+H.map(function(x,i){return '<div class="u-card u-pad hv" style="display:grid;gap:10px;--d:'+(i*.05)+'s"><div style="display:flex;gap:10px;align-items:center">'+hav()+'<div class="gr"><div class="t" style="font-weight:600;font-size:13px">'+x[0]+'</div><div class="s" style="font-size:11px;color:var(--mut)">Box '+x[1]+' · '+x[2]+'</div></div></div>'+chip(x[4],x[3],true)+'<div><div style="display:flex;justify-content:space-between;font-size:10.5px;color:var(--mut);margin-bottom:4px"><span>Charge de la semaine</span><span>'+Math.round(x[5]/100*16)+' h / 16 h</span></div><div class="u-bar"><i style="--p:'+x[5]/100+';--c:'+(x[5]>75?'var(--warn)':'var(--acc)')+'"></i></div></div></div>'}).join('')+'</div>'};
P.adh=function(){var M=[['LM','Léa Martin','27 ans · Galop 7','Propriétaire','ok','À jour',3],['ER','Emma Moreau','14 ans · Galop 5','Demi-pension','ok','À jour',6],['LR','Lucas Roux','9 ans · Galop 2','Forfait annuel','ok','À jour',5],['HG','Hugo Garnier','16 ans · Galop 4','Carte 10 séances','warn','Certificat à fournir',7],['CB','Chloé Bernard','11 ans · Galop 3','Forfait annuel','ok','À jour',4],['TD','Tom Dubreuil','8 ans · Baby poney','Forfait trimestre','acc','Licence en cours',1],['NP','Nina Perrin','34 ans · Galop 6','Propriétaire','ok','À jour',2]];
  return top('Adhérents','148 cavaliers · 61 familles · 139 licences FFE 2027','<span class="u-btn">'+I('mail')+'Écrire</span><span class="u-btn pri">'+I('plus')+'Inscrire</span>')+
  '<div class="u-card">'+M.map(function(m){return '<div class="u-li">'+av(m[0],m[6])+'<div class="gr"><div class="t">'+m[1]+'</div><div class="s">'+m[2]+'</div></div><span style="width:150px;color:var(--mut);font-size:12px">'+m[3]+'</span><span style="width:170px">'+chip(m[5],m[4],true)+'</span>'+I('right')+'</div>'}).join('')+'</div>'};
P.compta=function(){return top('Comptabilité','Exercice 2026 · rapproché à 96 %','<span class="u-btn">'+I('download')+'Export FEC</span><span class="u-btn pri">'+I('user')+'Inviter le comptable</span>')+
  '<div class="u-g4" style="margin-bottom:14px">'+kpi('accounting','Résultat à date','+38 200 €','+12 % sur un an')+kpi('bank','Trésorerie','64 870 €')+kpi('percent','TVA à déclarer','3 412 €','avant le 24 novembre')+kpi('check','Rapprochement','96 %','4 lignes à voir')+'</div>'+
  '<div class="u-card"><div class="u-ch">Recettes et dépenses<small>12 derniers mois</small></div><svg class="mk-ch" viewBox="0 0 900 220" preserveAspectRatio="none" style="width:100%;height:240px;display:block"><g stroke="var(--line)" stroke-width="1">'+[40,90,140,190].map(function(y){return '<line x1="0" x2="900" y1="'+y+'" y2="'+y+'"/>'}).join('')+'</g><path class="ar" d="M0 150 C80 140 120 120 180 118 S300 96 360 100 S480 70 540 76 S660 44 720 50 S840 30 900 26 L900 220 L0 220Z" fill="color-mix(in srgb,var(--acc) 12%,transparent)"/><path class="dr" d="M0 150 C80 140 120 120 180 118 S300 96 360 100 S480 70 540 76 S660 44 720 50 S840 30 900 26" fill="none" stroke="var(--acc)" stroke-width="3"/><path class="dr" d="M0 176 C90 170 150 160 210 162 S330 150 390 152 S510 140 570 142 S690 130 750 128 S860 120 900 118" fill="none" stroke="var(--c4)" stroke-width="3" stroke-dasharray="1 0"/></svg></div>'};
P.equipe=function(){var S=[['CM','Claire Morel','Gérante',2,[[0,10],[1,10],[2,9],[3,10],[4,8]]],['HL','Hugo Lefèvre','Moniteur',1,[[0,7],[1,7],[3,7],[4,7],[5,5]]],['IG','Inès Garnier','Monitrice',6,[[1,7],[2,7],[3,7],[5,7],[6,5]]],['MD','Mamadou Diallo','Palefrenier soigneur',4,[[0,8],[1,8],[2,8],[4,8],[5,7]]],['LP','Lucie Petit','Palefrenière soigneuse',5,[[0,7],[2,7],[3,7],[5,7],[6,7]]],['KB','Kévin Bernard','Agent d’entretien',7,[[0,6],[1,6],[2,6],[3,6]]]];
  var j=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
  return top('Équipe','8 salariés et la gérante · semaine 47','<span class="u-btn">'+I('download')+'Export Silae</span><span class="u-btn pri">'+I('calendar_add')+'Publier le planning</span>')+
  '<div class="u-g4" style="margin-bottom:14px">'+kpi('clockin','Pointés ce matin','7 sur 8')+kpi('clock','Heures sup. du mois','14 h')+kpi('holiday','Congés à valider','2')+kpi('doc','Documents à signer','1')+'</div>'+
  '<div class="u-card"><div class="mk-eq"><span></span>'+j.map(function(x,i){return '<span class="jh'+(i===1?' auj':'')+'">'+x+'</span>'}).join('')+S.map(function(s){var cells='';for(var d=0;d<7;d++){var f=s[4].filter(function(x){return x[0]===d})[0];cells+='<span class="jc">'+(f?'<i style="--c:var(--c'+s[3]+');--w:'+(f[1]/10)+'"></i>':'')+'</span>'}return '<span class="pp">'+av(s[0],s[3])+'<span><b>'+s[1]+'</b><small>'+s[2]+'</small></span></span>'+cells}).join('')+'</div></div>'};
P.cam=function(){return top('Caméras et capteurs','8 caméras · 23 capteurs · tout va bien sauf une alerte','<span class="u-btn">'+I('sliders')+'Règles d’alerte</span><span class="u-btn pri">'+I('link')+'Partager un accès</span>')+
  '<div class="u-g3" style="margin-bottom:12px">'+camFeed('Box B23 · Xanthos','09:41:12','Boit peu depuis hier')+camFeed('Box B01 · Ulysse','09:41:12')+camFeed('Carrière d’honneur','09:41:12')+camFeed('Box B07 · Tornado','09:41:12')+camFeed('Paddock nord','09:41:12')+camFeed('Sellerie','09:41:12')+'</div>'+
  '<div style="display:flex;gap:8px;flex-wrap:wrap">'+chip('Abreuvoir B23 · 3,1 L/h','warn',true)+chip('Écurie principale · 7,4 °C','',true)+chip('Sellerie · 14,2 °C','',true)+chip('Silo à granulés · 38 %','',true)+chip('Portail · fermé','ok',true)+'</div>'};
P.conc=function(){var E=[['LM','Léa Martin','Ulysse de la Roche','Club Élite 115','11 h 42',3],['ER','Emma Moreau','Xanthos','Club 2 · 95','13 h 05',6],['CB','Chloé Bernard','Quiétude','Club 3 · 85','14 h 20',4],['NP','Nina Perrin','Sirius du Moulin','Amateur 3 · 105','15 h 10',2]];
  return top('Compétitions','Prochain concours : Rambouillet, dimanche 22 novembre','<span class="u-btn">'+I('van')+'Qui emmène qui</span><span class="u-btn pri">'+I('ext')+'Préparer pour FFE Compet</span>')+
  '<div class="u-g3" style="margin-bottom:14px">'+kpi('trophy','Engagés','9 couples')+kpi('van','Places dans les vans','6 sur 6')+kpi('euro','Frais refacturés','612 €')+'</div>'+
  '<div class="u-card"><table class="u-tbl"><tr><th>Cavalier</th><th>Cheval</th><th>Épreuve</th><th>Passage</th><th>Transport</th></tr>'+E.map(function(e,i){return '<tr><td><span style="display:inline-flex;align-items:center;gap:8px">'+av(e[0],e[5])+'<b>'+e[1]+'</b></span></td><td>'+e[2]+'</td><td>'+e[3]+'</td><td class="mono">'+e[4]+'</td><td>'+chip(i<3?'Van du club':'Covoiturage',i<3?'acc':'',true)+'</td></tr>'}).join('')+'</table></div>'};
P.ent=function(){var C=[['À faire',[['Clôture paddock nord','Signalé par Mamadou · photo','warn'],['Vidange du tracteur','Tous les 250 h · dans 12 h',''],['Copeaux : 4 jours de stock','Commande prête','bad']]],['En cours',[['Hersage carrière d’honneur','Kévin · 13 h 30','acc'],['Abreuvoir B23','Plombier jeudi','warn']]],['Fait',[['Éclairage du manège','Hier · 2 ampoules',''],['Contrôle extincteurs','Rapport joint','ok']]]];
  return top('Entretien et stocks','6 tâches ouvertes · 2 contrôles ce mois','<span class="u-btn">'+I('stock')+'Stocks</span><span class="u-btn pri">'+I('plus')+'Nouvelle tâche</span>')+
  '<div class="u-g3">'+C.map(function(c){return '<div class="kb"><div class="kb-h">'+c[0]+'<span>'+c[1].length+'</span></div>'+c[1].map(function(t){return '<div class="u-card u-pad kb-c"><b>'+t[0]+'</b><small>'+t[1]+'</small>'+(t[2]?chip(t[2]==='bad'?'Urgent':t[2]==='warn'?'À surveiller':t[2]==='ok'?'Conforme':'En cours',t[2],true):'')+'</div>'}).join('')+'</div>'}).join('')+'</div>'};

var WORDS=[['la facturation','fact'],['le planning','plan'],['les chevaux','chev'],['les adhérents','adh'],['la comptabilité','compta'],['l’équipe','equipe'],['les caméras','cam'],['les concours','conc'],['l’entretien','ent']];
var heroApp=$('#heroApp');
heroApp.innerHTML='<div class="u-app">'+side('fact',1)+'<main class="u-main">'+WORDS.map(function(w,i){return '<section class="u-panel'+(i===0?' on':'')+'" data-p="'+w[1]+'">'+P[w[1]]()+'</section>'}).join('')+'</main></div>';
function selTo(k){var it=$('.u-it[data-k="'+k+'"]',heroApp),sel=$('.u-sel',heroApp);$$('.u-it',heroApp).forEach(function(x){x.classList.toggle('on',x===it)});if(it&&sel)sel.style.transform='translateY('+(it.offsetTop)+'px)'}
var panelTimers=[];
function showPanel(k){$$('.u-panel',heroApp).forEach(function(p){p.classList.toggle('on',p.dataset.p===k)});selTo(k);panelTimers.forEach(clearTimeout);panelTimers=[];var p=$('.u-panel[data-p="'+k+'"]',heroApp);panelAnim(k,p)}
function later(f,ms){panelTimers.push(setTimeout(f,RM?0:ms))}
function panelAnim(k,p){if(!p)return;p.classList.remove('vu-on');void p.offsetWidth;p.classList.add('vu-on');
  $$('.u-bar i',p).forEach(function(b){b.style.transform='scaleX(0)';later(function(){b.style.transform=''},60)});
  $$('.dr',p).forEach(function(d){var L=d.getTotalLength?d.getTotalLength():1000;d.style.strokeDasharray=L;d.style.strokeDashoffset=L;d.getBoundingClientRect();d.style.transition=RM?'none':'stroke-dashoffset 1.8s cubic-bezier(.22,1,.36,1)';later(function(){d.style.strokeDashoffset=0},40)});
  if(k==='fact'){var b=$('[data-go]',p),st=$$('[data-st]',p);st.forEach(function(s){s.innerHTML=chip('Brouillon','',true)});b.className='u-btn pri';b.innerHTML=I('send')+'Émettre les 148 factures';
    later(function(){b.classList.add('press')},500);later(function(){b.classList.remove('press');b.className='u-btn ok';b.innerHTML=I('check')+'148 factures émises'},700);
    st.forEach(function(s,i){later(function(){s.innerHTML=chip(i===1||i===3?'Payée':'Émise',i===1||i===3?'ok':'acc',true)},800+i*180)})}
  if(k==='chev'){$$('.hv',p).forEach(function(c){c.animate&&!RM&&c.animate([{opacity:0,transform:'translateY(10px)'},{opacity:1,transform:'none'}],{duration:600,delay:parseFloat(c.style.getPropertyValue('--d'))*1000,easing:'cubic-bezier(.22,1,.36,1)',fill:'backwards'})})}
  if(k==='equipe'){$$('.jc i',p).forEach(function(x,i){x.style.transform='scaleX(0)';later(function(){x.style.transform=''},40+i*14)})}
  if(k==='cam'){/* rien : les flux bougent seuls */}
}
/* téléphone du hero : accueil adhérent */
function phoneShell(inner,tab,tabs){tabs=tabs||[['today','Accueil'],['calendar_add','Réserver'],['horse','Ulysse'],['wallet','Paiements']];
  return '<div class="u-ph"><div class="u-sb"><span>9:41</span><span>'+I('wifi')+'<i></i></span></div><div class="u-phc">'+inner+'</div><div class="u-tabs">'+tabs.map(function(t,i){return '<span'+(i===tab?' class="on"':'')+'>'+I(t[0])+t[1]+'</span>'}).join('')+'</div></div>'}
$('#heroTel').innerHTML=phoneShell('<div style="display:flex;justify-content:space-between;align-items:center;margin-top:6px"><div class="u-pht">Bonjour Léa</div><span class="u-av" style="--c:var(--c3);width:34px;height:34px">LM</span></div><p style="color:var(--mut);font-size:12.5px;margin-top:-4px">Ulysse va bien. Votre cours avec Pauline est à 11 h 15.</p>'+
  '<div class="u-card u-navy u-pad ht-cours"><div class="u-eb" style="color:rgba(255,255,255,.7)"><span class="strass" style="width:9px;height:9px"></span>Aujourd’hui</div><div style="font:700 19px/1.1 var(--f-d);letter-spacing:-.03em;margin:8px 0 4px">Cours particulier CSO</div><div class="mut" style="font-size:12px">11 h 15 · Carrière d’honneur · Ulysse</div><div class="ht-cd"><span class="mono" id="htCd">dans 1 h 34</span><div class="u-bar" style="background:rgba(255,255,255,.15)"><i style="--p:.62;--c:var(--strass)"></i></div></div></div>'+
  '<div class="ht-q">'+[['calendar_add','Réserver'],['repeat','Rattraper'],['card','Payer'],['chat','Messages']].map(function(q){return '<span><i>'+I(q[0])+'</i>'+q[1]+'</span>'}).join('')+'</div>'+
  '<div class="u-card"><div class="u-ch">Ulysse en direct<small>Box B01</small></div><div style="padding:10px 12px 12px">'+camFeed('Box B01','09:41:12').replace('class="cam"','class="cam petit"')+'</div></div>',0);

/* mot qui tourne */
(function(){var ro_=$('#roule'),mi=0;
  function mesure(t){var s=D.createElement('span');s.textContent=t;s.style.cssText='position:absolute;visibility:hidden;transform:none;white-space:nowrap';ro_.appendChild(s);var w=s.getBoundingClientRect().width;ro_.removeChild(s);return w}
  function largeur(){ro_.style.width=(mesure(WORDS[mi][0])+parseFloat(getComputedStyle(ro_).paddingLeft)*2)+'px'}
  function suivant(){var old=$('.in',ro_);mi=(mi+1)%WORDS.length;var n=D.createElement('span');n.textContent=WORDS[mi][0];ro_.appendChild(n);largeur();void n.offsetWidth;n.className='in';if(old){old.className='out';setTimeout(function(){old.remove()},800)}showPanel(WORDS[mi][1])}
  largeur();if(D.fonts&&D.fonts.ready)D.fonts.ready.then(function(){largeur();selTo('fact')});addEventListener('resize',largeur);
  var vis=true,timer=null;new IntersectionObserver(function(es){vis=es[0].isIntersecting},{}).observe($('.hero'));
  if(!RM)timer=setInterval(function(){if(vis&&!D.hidden)suivant()},2900);
  setTimeout(function(){showPanel('fact')},RM?0:900)})();

/* titre : apparition mot par mot */
(function(){var h=$('.h1');$$('.m,.roule',h).forEach(function(m,i){m.style.setProperty('--d',(.08+i*.07)+'s')});requestAnimationFrame(function(){requestAnimationFrame(function(){h.classList.add('vu')})})})();

/* =====================================================================
   2. CHIFFRES ET BANDE
   ===================================================================== */
var MODS=[['today','Cockpit du matin'],['assistant','Assistant IA'],['horse','Fiches chevaux 3D'],['cube','Écurie 3D'],['camera','Caméras'],['sensor','Capteurs'],['care','Soins et rappels'],['feed','Rations'],['planning','Planning'],['saddle','Montoir'],['members','Adhérents'],['family','Familles'],['swap','Demi-pensions'],['coach','Coachs'],['trophy','Compétitions'],['van','Qui emmène qui'],['shop','Boutique et stages'],['invoice','Facturation'],['doc','Devis'],['accounting','Comptabilité'],['percent','TVA'],['bank','Banque'],['sign','Signature au doigt'],['team','RH et paie'],['clockin','Pointage'],['upkeep','Entretien'],['stock','Stocks'],['chat','Messages'],['wifi','Hors ligne'],['mcp','Serveur MCP'],['api','API publique'],['import','Reprise des données']];
function bandeHTML(list){var h=list.map(function(m){return '<li>'+I(m[0])+m[1]+'</li>'}).join('');return h+h}
$('#bande1').innerHTML=bandeHTML(MODS.slice(0,16));$('#bande2').innerHTML=bandeHTML(MODS.slice(16));

/* =====================================================================
   3. QUATRE VUES
   ===================================================================== */
function mockGerant(){return '<div class="u-app">'+side('cockpit')+'<main class="u-main"><div class="u-top"><div><h2 style="font-size:28px">Bonjour Claire</h2><p>Mardi 17 novembre · 4 reprises, 27 cavaliers et 2 rendez-vous de soins aujourd’hui</p></div><div class="u-btns"><span class="u-btn">'+I('sliders')+'Personnaliser</span><span class="u-btn pri">'+I('plus')+'Créer</span></div></div>'+
  '<div style="display:grid;grid-template-columns:1.55fr 1fr;gap:12px;margin-bottom:12px"><div class="u-card u-navy" style="padding:18px 20px"><div class="u-eb" style="color:rgba(255,255,255,.7)"><span class="strass" style="width:9px;height:9px"></span>Résumé du matin, préparé par l’assistant</div><div style="font:700 21px/1.12 var(--f-d);letter-spacing:-.03em;margin:10px 0 12px" class="g-t">Journée chargée mais sous contrôle. Deux chevaux demandent votre attention avant 14 h.</div><div class="g-l">'+
  [['horse','<b>Xanthos (B23)</b> boit 40 % de moins depuis hier soir.'],['care','<b>Tornado</b> voit le Dr Leclerc à 14 h pour sa boiterie.'],['invoice','<b>7 factures en retard</b> pour 2 073 €. Les relances sont prêtes.'],['stock','<b>Copeaux</b> : 4 jours de stock, commande prête.']].map(function(l){return '<div class="g-li">'+I(l[0])+'<span>'+l[1]+'</span></div>'}).join('')+'</div><div style="display:flex;gap:8px;margin-top:12px"><span class="u-btn pri g-b">'+I('send')+'Envoyer les relances</span><span class="u-btn" style="background:rgba(255,255,255,.1);color:#fff;box-shadow:none">Valider la commande</span></div></div>'+
  '<div class="u-card u-pad" style="display:grid;gap:12px;align-content:start"><div style="display:flex;justify-content:space-between;font-weight:600;font-size:13.5px">Écurie en direct<span style="color:var(--acc);font-size:12px">Plan 3D</span></div><div style="display:flex;gap:14px;align-items:center"><span class="u-ring g-r" style="--p:96;width:70px;height:70px"><b>44/46</b></span><div><b style="font-size:14px">44 boxes occupés</b><div style="color:var(--mut);font-size:11.5px">2 libres : B45, B46</div></div></div><div class="u-g3" style="gap:8px">'+[['Au box','27'],['Au paddock','13'],['Au travail','4']].map(function(x){return '<div style="background:var(--bg-2);border-radius:10px;padding:8px 10px"><div style="font-size:10.5px;color:var(--mut)">'+x[0]+'</div><b style="font:700 18px var(--f-d)">'+x[1]+'</b></div>'}).join('')+'</div><div style="display:flex;flex-wrap:wrap;gap:6px">'+chip('Abreuvoir B23 · 3,1 L/h','warn',true)+chip('Sellerie · 14,2 °C','',true)+'</div></div></div>'+
  '<div class="u-g4">'+kpi('euro','Chiffre d’affaires de novembre','<span data-c="49600" data-f="eur">49 600 €</span>','+8,4 % sur un an')+kpi('wallet','Encaissé aujourd’hui','<span data-c="5396" data-f="eur">5 396 €</span>','20 paiements')+kpi('planning','Remplissage des reprises','<span data-c="86">86</span> %','+3 points')+kpi('members','Adhérents actifs','<span data-c="148">148</span>','+3 cette semaine')+'</div></main></div>'}
function mockEmp(){var B=[['B01','Ulysse de la Roche','Foin, granulés 2 L'],['B02','Quiétude','Foin, curer les pieds'],['B03','Vanille','Pommade antérieur droit'],['B04','Sirius du Moulin','Foin, couverture'],['B05','Opale','Foin, granulés 1,5 L'],['B07','Tornado','Repos, pas de sortie'],['B08','Diablo','Foin, granulés 2 L']];
  return phoneShell('<div class="e-off">'+I('wifi')+'<span>Hors ligne : tout est enregistré sur le téléphone</span></div><div style="display:flex;justify-content:space-between;align-items:flex-end"><div class="u-pht">Tournée des boxes</div><span class="num e-cpt" style="font-size:12px;color:var(--mut);font-weight:600">12 sur 23</span></div><div class="u-bar"><i class="e-bar" style="--p:.52"></i></div><div class="u-card e-list">'+B.map(function(b){return '<div class="e-row"><span class="e-ok">'+I('check')+'Fait</span><div class="e-in"><span class="e-ck">'+I('check')+'</span><div class="gr"><b>'+b[0]+' · '+b[1]+'</b><small>'+b[2]+'</small></div></div></div>'}).join('')+'</div><p style="font-size:11px;color:var(--mut);text-align:center">Glissez vers la droite pour valider un box</p>',1,[['today','Journée'],['stable','Tournée'],['horse','Chevaux'],['planning','Planning']])}
function mockAdh(){return phoneShell('<div class="u-pht" style="margin-top:4px">Ulysse de la Roche</div><p style="color:var(--mut);font-size:12px;margin-top:-6px">Box B01 · Selle français · 11 ans</p>'+camFeed('Box B01 · en direct','09:41:12').replace('class="cam"','class="cam grand"')+
  '<div class="u-card u-pad"><div style="font-weight:600;font-size:13px;margin-bottom:10px">Santé</div><div style="display:flex;justify-content:space-between">'+[['Vermifuge',78,'ok'],['Ferrure',35,'warn'],['Vaccins',90,'ok']].map(function(r){return '<div style="display:grid;justify-items:center;gap:5px;font-size:10.5px;color:var(--mut)"><span class="u-ring a-r" style="--c:var(--'+r[2]+');--p:0" data-p="'+r[1]+'"><b>'+r[1]+' %</b></span>'+r[0]+'</div>'}).join('')+'</div></div>'+
  '<div class="u-card"><div class="u-ch">Journal<small>partagé avec le club</small></div><div style="padding:6px 0 4px">'+[['IG','Inès','Longe 30 min, très détendu',6],['MD','Mamadou','Mangé toute sa ration',4]].map(function(j){return '<div class="u-li">'+av(j[0],j[3])+'<div class="gr"><div class="t">'+j[1]+'</div><div class="s">'+j[2]+'</div></div></div>'}).join('')+'</div></div>',2)}
function mockCoach(){var J=['Lun 16','Mar 17','Mer 18','Jeu 19','Ven 20'],S=[[0,1,2,'Particulier','Nina Perrin',2],[1,3.25,1,'Particulier','Léa Martin',3],[1,4.25,1.25,'Collectif CSO','6 cavaliers',7],[2,0,1,'Particulier','Emma Moreau',6],[3,2,1,'Particulier','Hugo Garnier',1],[4,5,1.5,'Collectif','5 cavaliers',5],[4,1,1,'Particulier','Chloé Bernard',4]];
  return '<div class="c-app"><div class="u-top" style="margin-bottom:12px"><div><h2>Mon agenda</h2><p>Pauline Arnaud · coach CSO · 3 écuries</p></div><div class="u-btns"><span class="u-btn">'+I('link')+'Ma page publique</span><span class="u-btn pri">'+I('calendar_add')+'Ouvrir des créneaux</span></div></div>'+
  '<div class="u-g3" style="margin-bottom:12px">'+kpi('wallet','Revenus de novembre','<span data-c="2840" data-f="eur">2 840 €</span>','+18 %')+kpi('members','Élèves actifs','<span data-c="23">23</span>')+kpi('star','Note moyenne','4,9','128 avis')+'</div>'+
  '<div class="u-card c-cal"><div class="c-h"><span></span>'+J.map(function(j,i){return '<span'+(i===1?' class="auj"':'')+'>'+j+'</span>'}).join('')+'</div><div class="c-b"><div class="c-hr">'+['9 h','10 h','11 h','12 h','13 h','14 h','15 h'].map(function(h){return '<span>'+h+'</span>'}).join('')+'</div>'+J.map(function(j,d){return '<div class="c-col">'+S.filter(function(s){return s[0]===d}).map(function(s){return '<div class="c-ev" style="--c:var(--c'+s[5]+');top:'+(s[1]/7*100)+'%;height:'+(s[2]/7*100)+'%"><b>'+s[3]+'</b><small>'+s[4]+'</small></div>'}).join('')+(d===2?'<div class="c-ev c-new" style="--c:var(--ok);top:'+(1/7*100)+'%;height:'+(1/7*100)+'%"><b>Nouvelle réservation</b><small>Léa Martin · payée</small></div>':'')+'</div>'}).join('')+'</div></div></div>'}

$('#vGerant').innerHTML=mockGerant();
$('#vTel').innerHTML='<div class="ecr" data-e="1">'+mockEmp()+'</div><div class="ecr av" data-e="2">'+mockAdh()+'</div>';
$('#vCoach').innerHTML=mockCoach();
/* copies pour le téléphone et la tablette (pas d'épinglage) */
var INL=[['cadre','1180','760',mockGerant()],['tel','320','660',mockEmp()],['tel','320','660',mockAdh()],['tab','900','660',mockCoach()]];
$$('.v-inline').forEach(function(el,i){var c=INL[i];el.innerHTML='<div class="'+c[0]+'">'+(c[0]==='tel'?'<div class="ilot"></div>':'')+'<div class="fit" data-w="'+c[1]+'" data-h="'+c[2]+'" style="aspect-ratio:'+c[1]+'/'+c[2]+'"><div class="fit-in ui">'+c[3]+'</div></div></div>'});

/* animations des quatre écrans (fonctionnent pour l'épinglé et les copies) */
function animGerant(root){return async function(w){var lis=$$('.g-li',root),b=$('.g-b',root);lis.forEach(function(l){l.classList.remove('vu')});if(b){b.className='u-btn pri g-b';b.innerHTML=I('send')+'Envoyer les relances'}
  $$('[data-c]',root).forEach(function(c){countUp(c,+c.dataset.c,1600,c.dataset.f==='eur'?eur:fmt)});var r=$('.g-r',root);if(r){r.style.setProperty('--p',0);await w(80);r.style.transition='--p 1.4s';animRing(r,96)}
  for(var i=0;i<lis.length;i++){await w(380);lis[i].classList.add('vu')}
  await w(1100);if(b){b.classList.add('press');await w(180);b.className='u-btn ok g-b';b.innerHTML=I('check')+'7 relances envoyées'}await w(4200)}}
function animRing(r,to){var p=0,t0=performance.now();if(RM){r.style.setProperty('--p',to);return}(function s(n){var k=Math.min(1,(n-t0)/1300);p=to*(1-Math.pow(1-k,3));r.style.setProperty('--p',p.toFixed(1));if(k<1)requestAnimationFrame(s)})(t0)}
function animEmp(root){return async function(w){var rows=$$('.e-row',root),cpt=$('.e-cpt',root),bar=$('.e-bar',root),off=$('.e-off',root);rows.forEach(function(r){r.classList.remove('fait','glisse')});if(off){off.classList.remove('sync');off.lastChild.textContent=nb('Hors ligne : tout est enregistré sur le téléphone')}
  var n=12;if(cpt)cpt.textContent=n+' sur 23';if(bar)bar.style.setProperty('--p',n/23);
  for(var i=0;i<4;i++){await w(800);rows[i].classList.add('glisse');await w(420);rows[i].classList.remove('glisse');rows[i].classList.add('fait');n++;if(cpt)cpt.textContent=n+' sur 23';if(bar)bar.style.setProperty('--p',n/23)}
  await w(900);if(off){off.classList.add('sync');off.lastChild.textContent='Réseau retrouvé : 4 actions synchronisées'}await w(3200)}}
function animAdh(root){return async function(w){$$('.a-r',root).forEach(function(r){r.style.setProperty('--p',0)});await w(300);$$('.a-r',root).forEach(function(r){animRing(r,+r.dataset.p)});await w(6000)}}
function animCoach(root){return async function(w){var n=$('.c-new',root);if(n)n.classList.remove('vu');$$('[data-c]',root).forEach(function(c){countUp(c,+c.dataset.c,1400,c.dataset.f==='eur'?eur:fmt)});await w(1600);if(n)n.classList.add('vu');await w(5000)}}
var VA=[animGerant,animEmp,animAdh,animCoach];
$$('.v-inline').forEach(function(el,i){live(el,VA[i](el),.3)});

(function(){var steps=$$('.v-etape'),devs=$$('.v-dev'),rail=$$('.v-rail i'),cur=-1,tok=0,tel=$('#vTel');
  var roots=[$('#vGerant'),$('.ecr[data-e="1"]',tel),$('.ecr[data-e="2"]',tel),$('#vCoach')];
  function set(i){if(i===cur)return;var prev=cur;cur=i;steps.forEach(function(s,k){s.classList.toggle('on',k===i)});rail.forEach(function(r,k){r.classList.toggle('on',k===i)});
    var dv=i===0?0:i===3?3:1;devs.forEach(function(d){d.classList.toggle('on',+d.dataset.dev===dv)});
    if(i===1||i===2){var a=$('.ecr[data-e="1"]',tel),b=$('.ecr[data-e="2"]',tel);a.className='ecr'+(i===2?' ar':'');b.className='ecr'+(i===1?' av':'')}
    var my=++tok,w=function(ms){return new Promise(function(res,rej){if(RM)return res();setTimeout(function(){my===tok?res():rej(0)},ms)})};
    (async function(){try{await w(350);do{await VA[i](roots[i])(w)}while(!RM&&my===tok)}catch(e){if(e!==0)console.error(e)}})()}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting&&innerWidth>980)set(steps.indexOf(e.target))})},{rootMargin:'-45% 0px -45% 0px'});steps.forEach(function(s){io.observe(s)});
  new IntersectionObserver(function(es){if(!es[0].isIntersecting){tok++;cur=-1}},{}).observe($('.v-grille'));
  if(innerWidth<=980)steps.forEach(function(s){s.classList.add('on')})})();

/* =====================================================================
   4. FONCTIONS : maquettes vivantes
   ===================================================================== */
function fill(id,html){var el=D.getElementById(id);if(el){el.innerHTML='<div class="ui ui-f">'+html+'</div>'}return el}

/* --- assistant --- */
var mkA=fill('mkAssistant','<div class="as"><div class="as-h"><span class="as-ic">'+I('assistant')+'</span><b>Assistant Stabl</b><span class="u-chip" style="background:rgba(255,255,255,.1);color:#fff">Connaît tout le club</span></div><div class="as-fil"></div><div class="as-in"><span class="as-txt">Demandez quelque chose…</span><span class="as-mic">'+I('mic')+'</span></div></div>');
live(mkA,async function(w,el){var fil=$('.as-fil',el),inp=$('.as-txt',el);fil.innerHTML='';inp.textContent=nb('Demandez quelque chose…');inp.classList.remove('tape');
  await w(500);inp.classList.add('tape');await type(inp,'Qui n’a pas réglé novembre ?',w,45);await w(350);
  fil.insertAdjacentHTML('beforeend','<div class="bul moi">'+nb('Qui n’a pas réglé novembre ?')+'</div>');inp.textContent=nb('Demandez quelque chose…');inp.classList.remove('tape');await w(500);
  fil.insertAdjacentHTML('beforeend','<div class="bul ia as-r"><span class="pts"><i></i><i></i><i></i></span></div>');await w(1100);
  var r=$('.as-r',fil);r.innerHTML=nb('<b>7 factures</b> sont en retard, pour <b>2 073 €</b>. Les trois plus anciennes :')+'<div class="as-card">'+[['Famille Dubreuil','34 jours','412 €'],['Hugo Garnier','21 jours','290 €'],['Nina Perrin','12 jours','386 €']].map(function(x){return '<div><span>'+x[0]+'<small>'+x[1]+'</small></span><b>'+nb(x[2])+'</b></div>'}).join('')+'</div><div class="mcp-act"><span class="as-go">'+I('send')+'Envoyer les 7 relances</span><span class="sec">Voir la liste</span></div>';
  await w(1600);var go=$('.as-go',fil);go.classList.add('press');await w(220);go.classList.remove('press');go.classList.add('fait');go.innerHTML=I('check')+'7 relances envoyées';
  fil.insertAdjacentHTML('beforeend','<div class="as-toast">'+I('checkc')+nb('Fait. Je vous préviens dès qu’un paiement arrive.')+'<span class="strass"></span></div>');await w(4200)},.3);

/* --- résumé du matin --- */
var mkM=fill('mkMatin','<div class="u-card u-navy mt"><div class="u-eb" style="color:rgba(255,255,255,.7)"><span class="strass" style="width:9px;height:9px"></span>Mardi 17 novembre</div><div class="mt-t">Deux chevaux demandent votre attention avant 14 h.</div>'+[['horse','Xanthos boit 40 % de moins'],['care','Tornado : vétérinaire à 14 h'],['invoice','7 factures en retard']].map(function(l){return '<div class="mt-l">'+I(l[0])+nb(l[1])+'</div>'}).join('')+'</div>');
live(mkM,async function(w,el){var L=$$('.mt-l',el);L.forEach(function(l){l.classList.remove('vu')});for(var i=0;i<L.length;i++){await w(450);L[i].classList.add('vu')}await w(4000)});
/* --- rapports --- */
var RB=[['Reprises',82],['Pensions',64],['Stages',40],['Cours part.',52],['Boutique',22],['Concours',30]];
var mkR=fill('mkRapports','<div class="u-card u-pad rp"><div style="display:flex;justify-content:space-between;align-items:baseline"><b style="font-size:13px">Chiffre d’affaires par activité</b><span class="u-chip ok">+8,4 %</span></div><div class="rp-b">'+RB.map(function(b,i){return '<div><i style="--h:'+b[1]+'%;--d:'+(i*.08)+'s;--c:var(--c'+(i===0?1:i===1?2:i+1)+')"></i><span>'+b[0]+'</span></div>'}).join('')+'</div></div>');
live(mkR,async function(w,el){var r=$('.rp',el);r.classList.remove('vu');await w(120);r.classList.add('vu');await w(5000)});
/* --- palette ⌘K --- */
var PAL=[['invoice','Émettre les factures du mois','Action'],['invoice','Facturation','Écran'],['members','Famille Roux : factures','Fiche'],['euro','Factures en retard','Filtre']];
var mkP=fill('mkPalette','<div class="u-card pal"><div class="pal-in">'+I('search')+'<span class="pal-q"></span><span class="u-dict"></span><span class="kbd mono">⌘K</span></div><div class="pal-l">'+PAL.map(function(p,i){return '<div class="pal-r'+(i===0?' on':'')+'">'+I(p[0])+'<span>'+p[1]+'</span><small>'+p[2]+'</small></div>'}).join('')+'</div></div>');
live(mkP,async function(w,el){var q=$('.pal-q',el),R_=$$('.pal-r',el);q.textContent='';R_.forEach(function(r,i){r.classList.toggle('on',i===0);r.style.opacity=.25});
  for(var s='fact',i=1;i<=4;i++){q.textContent=s.slice(0,i);R_.forEach(function(r,k){r.style.opacity=k<(i>=3?4:2+i)?1:.25});await w(200)}
  for(var k=0;k<3;k++){await w(700);R_.forEach(function(r,j){r.classList.toggle('on',j===k+1)})}await w(700);R_.forEach(function(r,j){r.classList.toggle('on',j===0)});await w(2600)});

/* --- fiche cheval 3D --- */
var mkC=fill('mkCheval','<div class="fc"><div class="fc-3d"><canvas class="fc-cv"></canvas><div class="fc-hs"></div><span class="fc-tip mono">'+I('rotate')+'Glissez pour tourner</span></div><div class="fc-info"><div style="display:flex;gap:10px;align-items:center">'+hav()+'<div><b style="font:700 18px/1.1 var(--f-d);letter-spacing:-.03em">Ulysse de la Roche</b><div style="font-size:11.5px;color:var(--mut)">Selle français · 11 ans · Box B01</div></div></div><div class="fc-id mono"><span>SIRE</span><b>250001J45213X</b><span>Propriétaire</span><b>Léa Martin</b></div>'+
  '<div><div style="display:flex;justify-content:space-between;font-size:11.5px;color:var(--mut);margin-bottom:5px"><span>Travail de la semaine</span><span class="num">7 h / 16 h</span></div><div class="u-bar"><i style="--p:.44"></i></div></div>'+
  '<div class="fc-tl">'+[['hoof','Maréchal','jeudi 19 novembre','warn'],['syringe','Vaccin grippe','15 décembre',''],['tooth','Dentiste','janvier','']].map(function(t){return '<div>'+I(t[0])+'<span><b>'+t[1]+'</b><small>'+t[2]+'</small></span>'+(t[3]?chip('Bientôt',t[3],true):'')+'</div>'}).join('')+'</div></div></div>');

/* --- écurie 3D (CSS) --- */
var ISO=(function(){var st=['o','o','o','o','o','w','o','o','o','o','o','o','o','o','o','o','a','o','f','f'],nm=['B01','B02','B03','B04','B05','B07','B08','B09','B10','B11','B20','B21','B22','B24','B25','B26','B23','B27','B45','B46'],h='';
  for(var i=0;i<20;i++){var row=i<10?0:1,col=i%10;h+='<div class="bx '+st[i]+'" style="--x:'+col+';--y:'+(row?2.15:0)+';--i:'+i+'"><div class="bx-t"><span>'+nm[i]+'</span></div><div class="bx-f"></div><div class="bx-s"></div></div>'}
  return h})();
var mkI=fill('mkIso','<div class="iso"><div class="iso-pl"><div class="iso-sol"></div><div class="iso-allee">Allée centrale</div>'+ISO+'<div class="iso-pad"><span>Paddock nord</span></div></div></div><div class="iso-leg"><span><i class="o"></i>Occupé · 44</span><span><i class="f"></i>Libre · 2</span><span><i class="a"></i>Alerte capteur</span><span><i class="w"></i>Soin en cours</span></div><div class="iso-pop u-card">'+hav()+'<div><b>B23 · Xanthos</b><small>Abreuvoir : 3,1 L par heure</small></div>'+chip('À vérifier','warn',true)+'</div>');
live(mkI,async function(w,el){var iso=$('.iso',el),pop=$('.iso-pop',el);iso.classList.remove('vu');pop.classList.remove('vu');await w(100);iso.classList.add('vu');await w(1700);pop.classList.add('vu');await w(4500)});

/* --- caméras et capteurs --- */
var mkCa=fill('mkCam','<div class="cs">'+camFeed('Box B23 · Xanthos','09:41:12','Boit peu').replace('class="cam al"','class="cam al cs-f"')+'<div class="cs-l">'+[['drop','Abreuvoir B23','3,1 L/h','warn'],['thermo','Écurie principale','7,4 °C',''],['gauge','Silo à granulés','38 %',''],['bolt','Clôture électrique','8,2 kV','ok']].map(function(s){return '<div class="u-card"><span class="cs-i '+s[3]+'">'+I(s[0])+'</span><span class="gr">'+s[1]+'</span><b class="num" data-v="'+s[2]+'">'+nb(s[2])+'</b></div>'}).join('')+'</div></div>');
live(mkCa,async function(w,el){var t=$('.cam-t',el),v=$$('[data-v]',el),s=41*60+12;for(var k=0;k<14;k++){s++;t.textContent='09:'+String(Math.floor(s/60)%60).padStart(2,'0')+':'+String(s%60).padStart(2,'0');if(k%3===0){var x=v[1];x.textContent=nb((7.2+Math.random()*.4).toFixed(1).replace('.',',')+' °C')}await w(1000)}});
/* --- soins --- */
var mkS=fill('mkSoins','<div class="u-card so">'+[['Aujourd’hui','Tornado','Vétérinaire, boiterie','bad'],['Jeudi','Opale, Ulysse','Maréchal, 2 chevaux','warn'],['Lundi','12 chevaux','Vermifuge d’automne','acc'],['15 déc.','Tout l’effectif','Rappel grippe','']].map(function(s,i){return '<div class="so-r" style="--d:'+(i*.12)+'s"><span class="so-d">'+s[0]+'</span><span class="so-p '+s[3]+'"></span><span class="gr"><b>'+s[1]+'</b><small>'+s[2]+'</small></span></div>'}).join('')+'</div>');
live(mkS,async function(w,el){var c=$('.so',el);c.classList.remove('vu');await w(80);c.classList.add('vu');await w(5000)});
/* --- entretien (kanban) --- */
var mkE=fill('mkEntretien','<div class="ke"><div class="u-card ke-k"><div class="ke-ph"><i></i><i></i><i></i><span>'+I('camera')+'</span></div><div class="gr"><b>Clôture du paddock nord</b><small>Signalée par Mamadou, avec une photo</small><div class="ke-st"><span class="on">Signalée</span><span>Kévin</span><span>Réparée</span></div></div></div><div class="u-card ke-s">'+I('stock')+'<span class="gr"><b>Copeaux</b><small>4 jours de stock</small></span><span class="u-btn pri ke-b">Commander</span></div></div>');
live(mkE,async function(w,el){var S=$$('.ke-st span',el),b=$('.ke-b',el);S.forEach(function(x,i){x.className=i===0?'on':''});b.className='u-btn pri ke-b';b.textContent='Commander';
  await w(1200);S[0].className='ok';S[1].className='on';await w(1300);S[1].className='ok';S[2].className='on ok';await w(700);b.classList.add('press');await w(180);b.className='u-btn ok ke-b';b.innerHTML=I('check')+'60 sacs commandés';await w(3200)});

/* --- planning et montoir --- */
var MT=[['ER','Emma Moreau','Galop 5',6,'Xanthos'],['CB','Chloé Bernard','Galop 4',4,'Quiétude'],['HG','Hugo Garnier','Galop 4',1,'Caramel'],['TD','Théo Dumas','Galop 3',5,'Vanille'],['MP','Manon Petit','Galop 4',2,'Opale'],['JL','Jules Leroy','Galop 3',7,'Diablo']];
var mkPl=fill('mkPlanning','<div class="pm"><div class="u-card pm-h"><div><b>Galop 4 · 10 h</b><small>Grand manège · Hugo Lefèvre · 6 sur 8</small></div><span class="u-btn pri pm-go">'+I('assistant')+'Attribuer automatiquement</span></div><div class="u-card pm-l">'+MT.map(function(m){return '<div class="u-li">'+av(m[0],m[3])+'<div class="gr"><div class="t">'+m[1]+'</div><div class="s">'+m[2]+'</div></div><span class="pm-c" data-h="'+m[4]+'"><span class="pm-v">Cheval à choisir</span></span></div>'}).join('')+'</div><div class="pm-w">'+I('alert')+'<span>Tornado est écarté : 3 reprises aujourd’hui, limite atteinte.</span></div></div>');
live(mkPl,async function(w,el){var go=$('.pm-go',el),C=$$('.pm-c',el),wa=$('.pm-w',el);wa.classList.remove('vu');go.className='u-btn pri pm-go';go.innerHTML=I('assistant')+'Attribuer automatiquement';C.forEach(function(c){c.classList.remove('vu');c.innerHTML='<span class="pm-v">Cheval à choisir</span>'});
  await w(1100);go.classList.add('press');await w(200);go.classList.remove('press');go.innerHTML='<span class="spin"></span>Composition…';
  for(var i=0;i<C.length;i++){await w(260);C[i].innerHTML='<span class="pm-hn">'+HG()+C[i].dataset.h+'</span>';C[i].classList.add('vu');if(i===2){wa.classList.add('vu')}}
  go.className='u-btn ok pm-go';go.innerHTML=I('check')+'Montoir prêt';await w(4200)});

/* --- famille --- */
var mkF=fill('mkFamille','<div class="fa"><svg class="fa-l" viewBox="0 0 400 300" preserveAspectRatio="none"><path d="M200 78 C200 130 90 120 90 176"/><path d="M200 78 C200 130 310 120 310 176"/><path d="M200 78 L200 176" class="tp"/></svg><div class="u-card fa-p fa-0">'+av('NR',6)+'<div><b>Nathalie Roux</b><small>Payeuse · prélèvement SEPA</small></div>'+chip('À jour','ok',true)+'</div>'+
  '<div class="fa-e">'+[['ER','Emma','14 ans · Galop 5','Demi-pension',6],['LR','Lucas','9 ans · Galop 2','Forfait annuel',5]].map(function(e,i){return '<div class="u-card fa-p fa-'+(i+1)+'">'+av(e[0],e[4])+'<div><b>'+e[1]+'</b><small>'+e[2]+'</small></div><div class="fa-d">'+chip('Licence 2027','ok',true)+chip(i?'Autorisation signée':'Certificat valide','acc',true)+'</div></div>'}).join('')+'</div><div class="u-card fa-p fa-3 fa-tiers">'+I('bank')+'<div><b>Tiers payeur</b><small>CSE de l’entreprise de Nathalie : 30 %</small></div></div></div>');
live(mkF,async function(w,el){var f=$('.fa',el);f.classList.remove('vu');await w(80);f.classList.add('vu');await w(6000)});

/* --- déclarer son cheval --- */
var mkD=fill('mkDeclarer','<div class="u-card dc"><div class="dc-s"><span class="on">1</span><i></i><span>2</span><i></i><span>3</span></div><label>Numéro SIRE ou UELN</label><div class="dc-in mono"><span class="dc-q"></span><span class="u-dict"></span></div><div class="dc-r">'+hav()+'<div><b>Quartz du Moulin</b><small>Selle français · né en 2015 · bai</small></div>'+chip('Trouvé','ok',true)+'</div><div class="dc-f">'+I('hourglass')+'Envoyé au club, en attente de validation</div></div>');
live(mkD,async function(w,el){var q=$('.dc-q',el),r=$('.dc-r',el),f=$('.dc-f',el),S=$$('.dc-s span',el);q.textContent='';r.classList.remove('vu');f.classList.remove('vu');S.forEach(function(s,i){s.className=i===0?'on':''});
  await w(600);await type(q,'25000115J402',w,90);await w(500);r.classList.add('vu');S[0].className='ok';S[1].className='on';await w(1500);f.classList.add('vu');S[1].className='ok';S[2].className='on';await w(3500)});
/* --- demi-pension --- */
var mkDP=fill('mkDP','<div class="u-card dp"><div class="dp-h">'+hav()+'<div><b>Demi-pension d’Ulysse</b><small>2 jours par semaine · 160 € par mois</small></div></div><div class="dp-j">'+['L','M','M','J','V','S','D'].map(function(j,i){return '<span class="'+(i===1||i===4?'p':i===2||i===5?'d':'')+'">'+j+'</span>'}).join('')+'</div><div class="dp-c">'+[['ER','Emma Moreau','Galop 5',6],['CB','Chloé Bernard','Galop 4',4],['NP','Nina Perrin','Galop 6',2]].map(function(c,i){return '<div class="dp-r" style="--d:'+(i*.15)+'s">'+av(c[0],c[3])+'<span class="gr"><b>'+c[1]+'</b><small>'+c[2]+'</small></span>'+(i===0?'<span class="u-chip acc dp-ch">Choisie</span>':'')+'</div>'}).join('')+'</div></div>');
live(mkDP,async function(w,el){var d=$('.dp',el);d.classList.remove('vu');await w(80);d.classList.add('vu');await w(6000)});
/* --- coach réservable --- */
var mkCR=fill('mkCoachRes','<div class="u-card cr"><div class="cr-h">'+av('PA',1)+'<div><b>Pauline Arnaud</b><small>Coach CSO · 4,9 sur 5 · 55 € l’heure</small></div></div><div class="cr-s">'+['Mar 14:00','Mer 10:00','Ven 16:30','Sam 09:00'].map(function(s){return '<span>'+s.replace(':',' h ').replace(' h 00',' h')+'</span>'}).join('')+'</div><div class="cr-ok">'+I('checkc')+'<span><b>Mercredi 10 h, réservé</b><small>55 € payés · carrière d’honneur bloquée</small></span></div></div>');
live(mkCR,async function(w,el){var S=$$('.cr-s span',el),ok=$('.cr-ok',el);S.forEach(function(s){s.className=''});ok.classList.remove('vu');await w(900);S[1].className='sel';await w(900);ok.classList.add('vu');await w(4000)});

/* --- compétitions : qui emmène qui --- */
var mkCo=fill('mkCompet','<div class="co"><div class="u-card co-h"><span class="co-d"><b>22</b><small>nov.</small></span><div class="gr"><b>Concours CSO de Rambouillet</b><small>9 couples engagés · reconnaissance 11 h 10</small></div>'+chip('Engagements prêts','ok',true)+'</div><div class="co-v">'+[['Van du club','Thomas conduit',[['LM',3],['ER',6],['CB',4]]],['Camion de Nina','Covoiturage',[['NP',2],['HG',1],['']]]].map(function(v){return '<div class="u-card co-van"><div class="co-vh">'+I('van')+'<span class="gr"><b>'+v[0]+'</b><small>'+v[1]+'</small></span></div><div class="co-pl">'+v[2].map(function(p){return '<span class="co-s">'+(p[0]?'<span class="co-a">'+av(p[0],p[1])+'</span>':'<em>Place libre</em>')+'</span>'}).join('')+'</div></div>'}).join('')+'</div><div class="u-card co-t">'+[['LM','Léa · Ulysse','Club Élite 115','11 h 42',3],['ER','Emma · Xanthos','Club 2','13 h 05',6]].map(function(x){return '<div class="u-li">'+av(x[0],x[4])+'<div class="gr"><div class="t">'+x[1]+'</div><div class="s">'+x[2]+'</div></div><span class="r">'+x[3]+'</span></div>'}).join('')+'</div></div>');
live(mkCo,async function(w,el){var A=$$('.co-a',el);A.forEach(function(a){a.classList.remove('vu')});for(var i=0;i<A.length;i++){await w(380);A[i].classList.add('vu')}await w(5000)});
/* --- boutique --- */
var mkB=fill('mkBoutique','<div class="bq"><div class="u-card bq-st"><div class="bq-im">'+I('star')+'</div><div class="gr"><b>Stage de Noël</b><small>21 au 23 décembre · Galop 2 à 4</small><div class="u-bar" style="margin-top:8px"><i class="bq-b" style="--p:.75"></i></div><small class="bq-n">12 places sur 16</small></div><b class="num">195 €</b></div><div class="u-card bq-pa"><div class="u-li">'+I('gift')+'<span class="gr">Carte cadeau, 10 séances</span><b class="r">290 €</b></div><div class="u-li">'+I('bag')+'<span class="gr">Tapis de selle aux couleurs du club</span><b class="r">39 €</b></div><div class="u-li bq-tot"><span class="gr">Acompte de 30 % en ligne</span><b class="r">88 €</b></div></div></div>');
live(mkB,async function(w,el){var b=$('.bq-b',el),n=$('.bq-n',el),k=12;b.style.setProperty('--p',k/16);n.textContent='12 places sur 16';for(var i=0;i<3;i++){await w(1100);k++;b.style.setProperty('--p',k/16);n.textContent=k+' places sur 16'}await w(3000)});
/* --- communication --- */
var mkCm=fill('mkCom','<div class="cm"><div class="u-card cm-m"><div class="cm-to">'+chip('Familles du Galop 1 à 3','acc')+chip('Notification','')+chip('SMS','')+chip('E-mail','')+'</div><p class="cm-t">La reprise de samedi 10 h est déplacée au manège à cause de la pluie. À samedi !</p></div><div class="u-card cm-lu"><div style="display:flex;justify-content:space-between;font-size:12px"><b>Lu par</b><span class="num cm-n">0 sur 61</span></div><div class="u-bar"><i class="cm-b" style="--p:0;--c:var(--ok)"></i></div><div class="cm-av">'+[1,2,3,4,5,6,7].map(function(c,i){return av(['ER','LR','CB','HG','TD','MP','JL'][i],c)}).join('')+'</div></div></div>');
live(mkCm,async function(w,el){var n=$('.cm-n',el),b=$('.cm-b',el),k=0;b.style.setProperty('--p',0);n.textContent=nb('0 sur 61');await w(400);while(k<58){k=Math.min(58,k+Math.ceil(Math.random()*7));n.textContent=k+' sur 61';b.style.setProperty('--p',k/61);await w(220)}await w(3500)});

/* --- facturation --- */
var mkFa=fill('mkFact','<div class="fx"><div class="u-card fx-a"><div class="fx-h"><div><b>Facturation de novembre</b><small>Forfaits, pensions et prestations</small></div><span class="u-btn pri fx-go">'+I('send')+'Émettre les 148 factures</span></div><div class="fx-p"><div class="u-bar"><i class="fx-b" style="--p:0"></i></div><span class="num fx-n">0 sur 148</span></div><div class="fx-l">'+[['Famille Roux','186 €'],['Léa Martin','520 €'],['Mairie de Saint-Arnoult','1 140 €'],['Hugo Garnier','290 €']].map(function(r){return '<div class="u-li"><span class="gr t">'+r[0]+'</span><span class="r">'+nb(r[1])+'</span><span class="fx-s">'+chip('Brouillon','',true)+'</span></div>'}).join('')+'</div></div>'+
  '<div class="u-card fx-doc"><div class="fx-dh"><span class="fx-lg">'+LG(18,'#fff','var(--strass)')+'</span><div><b>Facture F-2026-1202</b><small>Léa Martin · 17 novembre</small></div></div>'+[['Pension box, novembre','20 %','430,00 €'],['Ferrure 4 fers','20 %','90,00 €']].map(function(l){return '<div class="fx-dl"><span>'+l[0]+'</span><small>'+nb(l[1])+'</small><b>'+nb(l[2])+'</b></div>'}).join('')+'<div class="fx-dl fx-tt"><span>Total TTC</span><b>'+nb('520,00 €')+'</b></div><div class="fx-pay"><span>'+I('card')+'Carte</span><span>'+I('bank')+'SEPA</span><span>'+I('ticket')+'Chèques-vacances</span></div><span class="fx-stamp">Payée</span></div></div>');
live(mkFa,async function(w,el){var go=$('.fx-go',el),b=$('.fx-b',el),n=$('.fx-n',el),S=$$('.fx-s',el),st=$('.fx-stamp',el);go.className='u-btn pri fx-go';go.innerHTML=I('send')+'Émettre les 148 factures';b.style.transition='none';b.style.setProperty('--p',0);n.textContent='0 sur 148';S.forEach(function(s){s.innerHTML=chip('Brouillon','',true)});st.classList.remove('vu');
  await w(1000);go.classList.add('press');await w(200);go.classList.remove('press');go.innerHTML='<span class="spin"></span>Émission…';b.style.transition='transform 1.6s cubic-bezier(.25,1,.5,1)';b.getBoundingClientRect();b.style.setProperty('--p',1);countUp(n,148,1600,function(x){return Math.round(x)+' sur 148'});
  for(var i=0;i<S.length;i++){await w(380);S[i].innerHTML=chip('Émise','acc',true)}go.className='u-btn ok fx-go';go.innerHTML=I('check')+'148 factures émises';
  await w(800);S[1].innerHTML=chip('Payée','ok',true);st.classList.add('vu');await w(500);S[3].innerHTML=chip('Payée','ok',true);await w(3600)});
/* --- comptabilité et banque --- */
var mkCp=fill('mkCompta','<div class="bk">'+[['VIR SEPA ROUX NATHALIE','+186,00 €','F-2026-1201'],['CB FOURRAGES DU HUREPOIX','−1 284,00 €','Facture fournisseur lue par l’IA'],['VIR MAIRIE ST ARNOULT','+1 140,00 €','F-2026-1203 · Chorus Pro'],['PRLV EDF','−412,50 €','Énergie, novembre']].map(function(r){return '<div class="u-card bk-r"><span class="bk-ic">'+I('bank')+'</span><span class="gr"><b class="mono">'+r[0]+'</b><small>'+r[2]+'</small></span><b class="num '+(r[1][0]==='+'?'okc':'')+'">'+nb(r[1])+'</b><span class="bk-ok">'+I('check')+'</span></div>'}).join('')+'<div class="bk-f"><span>Rapproché automatiquement</span><b class="num bk-p">0 %</b></div></div>');
live(mkCp,async function(w,el){var R_=$$('.bk-r',el),p=$('.bk-p',el);R_.forEach(function(r){r.classList.remove('vu')});p.textContent=nb('0 %');for(var i=0;i<R_.length;i++){await w(600);R_[i].classList.add('vu');p.textContent=nb(Math.round((i+1)/R_.length*96)+' %')}await w(3500)});
/* --- TVA --- */
function arc(r,a0,a1){var p=function(a){return [60+r*Math.cos(a),60+r*Math.sin(a)]},s=p(a0),e=p(a1);return 'M'+s[0].toFixed(2)+' '+s[1].toFixed(2)+'A'+r+' '+r+' 0 '+(a1-a0>Math.PI?1:0)+' 1 '+e[0].toFixed(2)+' '+e[1].toFixed(2)}
var TV=[['5,5 %',.58,'var(--c1)','Enseignement, installations'],['20 %',.34,'var(--c2)','Pensions, boutique'],['10 %',.08,'var(--c3)','Buvette des concours']],a=-Math.PI/2,dn='';
TV.forEach(function(t){var a1=a+t[1]*Math.PI*2-.04;dn+='<path d="'+arc(46,a,a1)+'" stroke="'+t[2]+'" pathLength="100"/>';a=a1+.04});
var mkT=fill('mkTVA','<div class="u-card tv"><svg viewBox="0 0 120 120" class="tv-d">'+dn+'</svg><div class="tv-c"><b class="num">3 412 €</b><small>à déclarer</small></div><div class="tv-l">'+TV.map(function(t){return '<div><i style="background:'+t[2]+'"></i><b>'+nb(t[0])+'</b><small>'+t[3]+'</small></div>'}).join('')+'</div></div>');
live(mkT,async function(w,el){var t=$('.tv',el);t.classList.remove('vu');await w(80);t.classList.add('vu');await w(5000)});
/* --- Chorus Pro --- */
var mkCh=fill('mkChorus','<div class="chx">'+[['invoice','Facture'],['doc','Factur-X'],['shield','Plateforme agréée'],['globe','Chorus Pro']].map(function(s,i){return '<div class="chx-s" style="--i:'+i+'"><span>'+I(s[0])+'</span><b>'+s[1]+'</b></div>'}).join('')+'<div class="chx-ok u-card">'+I('checkc')+'<span><b>Mairie de Saint-Arnoult</b><small>Facture reçue, mise en paiement</small></span></div></div>');
live(mkCh,async function(w,el){var c=$('.chx',el);c.classList.remove('vu');await w(80);c.classList.add('vu');await w(5200)});

/* --- contrat signé au doigt --- */
var SIG='M20 62 C 34 30, 46 26, 50 52 S 58 84, 70 50 S 86 18, 94 46 S 104 70, 116 48 C 124 36, 132 38, 136 52 S 150 64, 162 40 C 168 30, 176 34, 178 46 L 196 44';
var mkCt=fill('mkContrat','<div class="ct"><div class="tel ct-tel"><div class="ilot"></div><div class="ct-ecr">'+phoneShell('<div class="u-pht" style="font-size:20px;margin-top:4px">Contrat de demi-pension</div><div class="ct-doc"><div class="ct-l" style="width:92%"></div><div class="ct-l" style="width:80%"></div><div class="ct-l" style="width:88%"></div><div class="ct-l" style="width:60%"></div><div class="ct-kv"><span>Cheval</span><b>Ulysse de la Roche</b><span>Jours</span><b>Mardi, vendredi</b><span>Participation</span><b>'+nb('160 € par mois')+'</b></div></div><div class="ct-sig"><small>Signez avec le doigt</small><svg viewBox="0 0 216 90"><path class="ct-p" d="'+SIG+'"/></svg><span class="ct-dot"></span></div><span class="u-btn pri ct-b">'+I('sign')+'Signer le contrat</span>',2,[['today','Accueil'],['calendar_add','Réserver'],['contract','Contrats'],['wallet','Paiements']])+'</div></div><div class="u-card ct-ok"><span class="strass"></span><div><b>Contrat signé</b><small>Emma Moreau · 17 novembre, 9 h 41 · rangé dans « Contrats »</small></div></div></div>');
live(mkCt,async function(w,el){var p=$('.ct-p',el),d=$('.ct-dot',el),b=$('.ct-b',el),ok=$('.ct-ok',el),L=p.getTotalLength();p.style.strokeDasharray=L;p.style.strokeDashoffset=L;ok.classList.remove('vu');b.className='u-btn pri ct-b';b.innerHTML=I('sign')+'Signer le contrat';d.style.opacity=0;
  await w(700);if(RM){p.style.strokeDashoffset=0}else{d.style.opacity=1;var t0=performance.now(),dur=1700,svg=p.ownerSVGElement;await new Promise(function(res){(function s(n){var k=Math.min(1,(n-t0)/dur),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2,pt=p.getPointAtLength(L*e);p.style.strokeDashoffset=L*(1-e);var r=svg.getBoundingClientRect(),vb=svg.viewBox.baseVal;d.style.transform='translate('+(pt.x/vb.width*r.width)+'px,'+(pt.y/vb.height*r.height)+'px)';if(k<1)requestAnimationFrame(s);else res()})(t0)});d.style.opacity=0}
  await w(400);b.classList.add('press');await w(180);b.className='u-btn ok ct-b';b.innerHTML=I('check')+'Signé';await w(300);ok.classList.add('vu');await w(3800)},.3);

/* --- RH et pointage --- */
var mkRH=fill('mkRH','<div class="rh"><div class="tel rh-tel"><div class="ilot"></div><div class="ct-ecr">'+phoneShell('<div class="u-pht" style="font-size:20px;margin-top:4px">Pointage</div><p style="font-size:12px;color:var(--mut);margin-top:-6px">Mamadou Diallo · mardi 17 novembre</p><div class="rh-btn"><svg viewBox="0 0 120 120"><circle cx="60" cy="60" r="54" class="rh-bg"/><circle cx="60" cy="60" r="54" class="rh-pr" pathLength="100"/></svg><span class="rh-in">'+I('clockin')+'<b class="rh-t">Maintenir pour pointer</b></span></div><div class="u-card rh-res"><div class="u-li">'+I('check')+'<span class="gr t">Arrivée enregistrée</span><b class="r">7 h 02</b></div></div><div class="u-card"><div class="u-li">'+I('clock')+'<span class="gr">Cette semaine</span><b class="r">31 h 30</b></div><div class="u-li">'+I('holiday')+'<span class="gr">Congés restants</span><b class="r">18 j</b></div></div>',0,[['today','Journée'],['stable','Tournée'],['clockin','Pointage'],['holiday','Congés']])+'</div></div><div class="rh-side"><div class="u-card rh-pl"><div class="u-ch">Planning de la semaine<small>publié</small></div><div class="rh-w">'+[['MD',4,[1,1,1,0,1,1,0]],['LP',5,[1,0,1,1,0,1,1]],['HL',1,[1,1,0,1,1,1,0]],['IG',6,[0,1,1,1,0,1,1]],['KB',7,[1,1,1,1,0,0,0]]].map(function(s){return '<div class="rh-r">'+av(s[0],s[1])+s[2].map(function(x,i){return '<span'+(x?' style="--c:var(--c'+s[1]+');--i:'+i+'" class="on"':'')+'></span>'}).join('')+'</div>'}).join('')+'</div></div><div class="u-card rh-ex">'+I('download')+'<span class="gr"><b>Variables de paie de novembre</b><small>Heures, absences, primes</small></span><span class="rh-x">Silae</span><span class="rh-x">PayFit</span></div></div></div>');
live(mkRH,async function(w,el){var pr=$('.rh-pr',el),t=$('.rh-t',el),res=$('.rh-res',el),btn=$('.rh-btn',el);pr.style.transition='none';pr.style.strokeDashoffset=100;t.textContent='Maintenir pour pointer';res.classList.remove('vu');btn.classList.remove('ok','hold');$$('.rh-r span.on',el).forEach(function(s){s.classList.remove('vu')});
  await w(200);$$('.rh-r span.on',el).forEach(function(s){s.classList.add('vu')});await w(900);btn.classList.add('hold');pr.getBoundingClientRect();pr.style.transition='stroke-dashoffset 1.3s linear';pr.style.strokeDashoffset=0;await w(1350);btn.classList.remove('hold');btn.classList.add('ok');t.textContent='Bonne journée !';res.classList.add('vu');await w(3800)},.3);

/* --- hors ligne --- */
var mkO=fill('mkOffline','<div class="u-card of"><div class="of-b">'+I('wifi')+'<span class="of-t">Hors ligne · 3 actions en attente</span></div>'+[['B12 · Kalinka','Foin donné'],['B14 · Macaron','Pommade appliquée'],['B15 · Nuage','Box curé']].map(function(r){return '<div class="u-li of-r">'+I('check')+'<span class="gr t">'+r[0]+'</span><span class="s">'+r[1]+'</span><span class="of-s">'+I('refresh')+'</span></div>'}).join('')+'</div>');
live(mkO,async function(w,el){var b=$('.of-b',el),t=$('.of-t',el),R_=$$('.of-r',el);b.classList.remove('ok');t.textContent='Hors ligne · 3 actions en attente';R_.forEach(function(r){r.classList.remove('sync')});await w(2200);t.textContent='Réseau retrouvé, synchronisation…';for(var i=0;i<3;i++){await w(450);R_[i].classList.add('sync')}b.classList.add('ok');t.textContent='Tout est synchronisé';await w(3000)});
/* --- arrivée de chaque profil --- */
var AR=[['today','Gérant','Importer, inviter l’équipe, ouvrir'],['hay','Employé','Lien reçu, code, première tournée'],['user','Adhérent','Profil, famille, premier cours'],['coach','Coach','Créneaux, tarif, page publique']];
var mkAr=fill('mkArrivee','<div class="ar">'+AR.map(function(a){return '<div class="u-card ar-r">'+'<span class="ar-i">'+I(a[0])+'</span><span class="gr"><b>'+a[1]+'</b><small>'+a[2]+'</small></span><span class="ar-p"><i></i><i></i><i></i></span></div>'}).join('')+'</div>');
live(mkAr,async function(w,el){var R_=$$('.ar-r',el);R_.forEach(function(r){r.dataset.n=0;$$('.ar-p i',r).forEach(function(i){i.className=''})});for(var s=0;s<3;s++){for(var k=0;k<R_.length;k++){await w(170);$$('.ar-p i',R_[k])[s].className='on'}}await w(3200)});
/* --- personnalisation --- */
var SW=['#3d63f2','#0f9d6b','#ef5d8c','#f2a33d','#9a6bff','#0a1636'];
var mkPe=fill('mkPerso','<div class="u-card pe"><div class="pe-p" style="--t:#3d63f2"><div class="pe-h"><span class="pe-lg">'+HG()+'</span><b>Les Tilleuls</b></div><div class="pe-btn">Réserver un cours</div><div class="pe-cards"><i></i><i></i></div></div><div class="pe-r"><div class="pe-sw">'+SW.map(function(c,i){return '<span style="--s:'+c+'" class="'+(i===0?'on':'')+'"></span>'}).join('')+'</div><div class="pe-m">'+[['Caméras',1],['Concours',1],['Boutique',0],['Coachs',1]].map(function(m){return '<div><span>'+m[0]+'</span><i class="pe-tg'+(m[1]?' on':'')+'"></i></div>'}).join('')+'</div></div></div>');
live(mkPe,async function(w,el){var p=$('.pe-p',el),S=$$('.pe-sw span',el),T=$$('.pe-tg',el);for(var i=1;i<=SW.length;i++){await w(900);var k=i%SW.length;S.forEach(function(s,j){s.classList.toggle('on',j===k)});p.style.setProperty('--t',SW[k]);if(i===2)T[2].classList.add('on');if(i===4)T[2].classList.remove('on')}});

/* --- spotlight sur les cartes --- */
$$('.bt').forEach(function(b){b.addEventListener('pointermove',function(e){var r=b.getBoundingClientRect();b.style.setProperty('--mx',(e.clientX-r.left)+'px');b.style.setProperty('--my',(e.clientY-r.top)+'px')})});

/* --- navigation des familles : pastille qui glisse --- */
(function(){var nav=$('#cnPill'),links=$$('.cn-in a'),cur=-1;
  function set(i){if(i===cur)return;cur=i;links.forEach(function(l,k){l.classList.toggle('on',k===i)});var l=links[i];if(!l){nav.style.width=0;return}nav.style.width=l.offsetWidth+'px';nav.style.transform='translateX('+l.offsetLeft+'px)';var c=l.parentNode;if(c.scrollWidth>c.clientWidth)c.scrollTo({left:l.offsetLeft-c.clientWidth/2+l.offsetWidth/2,behavior:RM?'auto':'smooth'})}
  var chaps=$$('.chap');var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting)set(+e.target.dataset.c)})},{rootMargin:'-40% 0px -55% 0px'});chaps.forEach(function(c){io.observe(c)});
  addEventListener('resize',function(){var c=cur;cur=-1;set(c)})})();

/* =====================================================================
   5. TOUT REMPLACER
   ===================================================================== */
var OUT=[['doc','Cahier de monte'],['grid','Tableur des adhérents'],['chat','Groupes de discussion'],['folder','Classeur des contrats'],['invoice','Logiciel de facturation'],['calendar_add','Agenda papier'],['list','Tableau blanc'],['clockin','Feuilles de pointage'],['care','Carnet de soins'],['camera','Application caméra'],['flag','Sondage des concours'],['bank','Relevés à pointer']];
(function(){var sc=$('#remScene'),N=OUT.length,els=[];
  OUT.forEach(function(o,i){var e=D.createElement('div');e.className='outil';e.innerHTML=I(o[0])+'<s>'+o[1]+'</s>';sc.appendChild(e);els.push(e)});
  var pos=[];function layout(){var W=sc.clientWidth,H=sc.clientHeight,sm=W<640;pos=els.map(function(e,i){var cx,cy;
    if(sm){var col=i%2,row=Math.floor(i/2),ys=[-.46,-.35,-.24,.24,.35,.46];cx=(col?.25:-.25)*W+(row%2?8:-8);cy=ys[row]*H}
    else{var c=i%4,r=Math.floor(i/4),xs=[-.41,-.19,.19,.41],sh=[[.02,-.02,.03,-.01],[-.03,.02,-.02,.04],[.01,-.03,.02,-.02]];cx=(xs[c]+sh[r][c])*W;cy=([-.36,0,.36][r]+(c%2?.06:-.05))*H}
    var x=cx-e.offsetWidth/2,y=cy-e.offsetHeight/2;x=Math.max(-W/2,Math.min(W/2-e.offsetWidth,x));if(sm){var w=e.offsetWidth;x=(i%2)?Math.max(4,Math.min(W/2-w,x)):Math.min(-4-w,Math.max(-W/2,x))}return [x,y]})}
  var logo=$('.rem-logo'),num=$('#remN');
  function draw(p){els.forEach(function(e,i){var st=i/N*.55,k=Math.max(0,Math.min(1,(p-st)/.35)),cut=Math.max(0,Math.min(1,k*2.2)),fly=Math.max(0,Math.min(1,(k-.4)/.6)),ee=fly*fly*(3-2*fly),x=pos[i][0]*(1-ee),y=pos[i][1]*(1-ee);
    e.style.setProperty('--barre',cut);e.style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px) scale('+(1-ee*.7).toFixed(3)+')';e.style.opacity=(1-ee*ee).toFixed(3)});
    var gone=els.filter(function(e,i){return p>i/N*.55+.35}).length;num.textContent=gone;logo.style.setProperty('--halo',Math.min(1,p*1.1).toFixed(3))}
  layout();addEventListener('resize',function(){layout();tick()});
  var sect=$('#remplacer'),pinned=function(){return getComputedStyle($('.rem-pin')).position==='sticky'};
  function tick(){if(RM){draw(1);return}if(pinned()){var r=sect.getBoundingClientRect(),tot=r.height-innerHeight,p=Math.max(0,Math.min(1,-r.top/tot*1.15));draw(p)}}
  SCROLLERS.push(tick);
  if(!RM){var t0=0,run=false;new IntersectionObserver(function(es){if(pinned())return;if(es[0].isIntersecting&&!run){run=true;t0=performance.now();(function f(n){var p=Math.min(1,(n-t0)/3200);draw(p);if(p<1&&run)requestAnimationFrame(f)})(t0)}else if(!es[0].isIntersecting){run=false;draw(0)}},{threshold:.45}).observe(sc)}
  draw(RM?1:0)})();

/* =====================================================================
   6. CONNECTEURS : Claude + MCP, orbite, API
   ===================================================================== */
var mcpFil=$('#mcpFil'),mcpIn=$('#mcpSaisie');
function bul(k,h){mcpFil.insertAdjacentHTML('beforeend','<div class="bul '+k+'">'+nb(h)+'</div>');while(mcpFil.children.length>9)mcpFil.removeChild(mcpFil.firstChild)}
function tool(name,args){mcpFil.insertAdjacentHTML('beforeend','<div class="outil-mcp">'+I('mcp')+'<code>'+name+'('+args+')</code><span class="ok2">…</span></div>');return mcpFil.lastChild}
var MCPH='<div class="bul moi">'+nb('Quels chevaux sont au repos aujourd’hui ?')+'</div><div class="outil-mcp">'+I('mcp')+'<code>ecurie_apercu()</code><span class="ok2">4 chevaux</span></div><div class="bul ia">'+nb('<b>4 chevaux</b> sont au repos : Tornado (boiterie), Câline, Hermès et Jazz. Le montoir de 10 h en tient déjà compte.')+'</div>';
live($('.con-mcp'),async function(w){mcpFil.innerHTML=MCPH;mcpIn.textContent=nb('Écrivez à Claude…');mcpIn.parentNode.classList.remove('tape');
  await w(600);mcpIn.parentNode.classList.add('tape');await type(mcpIn,'Fais-moi le point sur l’écurie et relance les impayés de novembre.',w,28);await w(300);
  bul('moi','Fais-moi le point sur l’écurie et relance les impayés de novembre.');mcpIn.textContent=nb('Écrivez à Claude…');mcpIn.parentNode.classList.remove('tape');await w(600);
  var t1=tool('ecurie_apercu','');await w(700);t1.lastChild.textContent='44 boxes';var t2=tool('factures_rechercher','statut: "en retard"');await w(800);t2.lastChild.textContent='7 factures';await w(400);
  bul('ia','<b>44 boxes occupés sur 46.</b> Xanthos (B23) boit moins depuis hier soir : Mamadou le surveille. <b>7 factures</b> sont en retard, pour <b>2 073 €</b>.<div class="mcp-carte"><div><span>Famille Dubreuil</span><b>412 €</b></div><div><span>Nina Perrin</span><b>386 €</b></div><div><span>Hugo Garnier et 4 autres</span><b>1 275 €</b></div></div>Je prépare les 7 relances ? Vous les validerez dans Stabl.');
  await w(2600);bul('moi','Oui, envoie-les.');await w(500);var t3=tool('relance_preparer','factures: 7');await w(700);t3.lastChild.textContent='validé par Claire';var t4=tool('message_envoyer','canal: "e-mail et SMS"');await w(700);t4.lastChild.textContent='7 envoyés';await w(300);
  bul('ia','C’est fait : <b>7 relances envoyées</b>. Chaque action est notée dans le journal de Stabl, et vous pouvez l’annuler.');await w(5200)},.3);

var ORB=[['Qonto',1,'var(--c1)'],['Pennylane',1,'var(--c7)'],['FFE Club SIF',1,'var(--c2)'],['Claude',1,'#d97757'],['SIRE et IFCE',1,'var(--c4)'],['Stripe',1,'var(--c5)'],['ChatGPT',1,'var(--c7)'],['Google Agenda',1,'var(--c1)'],['Yousign',1,'var(--c6)']];
(function(){var o=$('#orbite'),out=ORB.filter(function(x){return x[1]}),inn=ORB.filter(function(x){return !x[1]});
  var nodes=ORB.map(function(n,i){var r=n[1]?40:24,list=n[1]?out:inn,k=list.indexOf(n);return {r:r,a0:k/list.length*Math.PI*2-Math.PI/2,v:n[1]?1:-1.4,n:n}});
  o.insertAdjacentHTML('beforeend','<svg class="lignes" viewBox="0 0 100 100" preserveAspectRatio="none">'+nodes.map(function(x){return '<line'+(x.n[1]?'':' class="in"')+' x1="50" y1="50" x2="50" y2="50"/>'}).join('')+'</svg>'+nodes.map(function(x){return '<div class="orb-n'+(x.n[1]?'':' in')+'"><span><i style="--c:'+x.n[2]+'"></i>'+x.n[0]+'</span></div>'}).join(''));
  var L=$$('line',o),Nn=$$('.orb-n',o);
  function place(t){nodes.forEach(function(x,i){var a=x.a0+t*x.v*.05,px=50+Math.cos(a)*x.r,py=50+Math.sin(a)*x.r;Nn[i].style.left=px.toFixed(2)+'%';Nn[i].style.top=py.toFixed(2)+'%';L[i].setAttribute('x2',px.toFixed(2));L[i].setAttribute('y2',py.toFixed(2));x.px=px;x.py=py});
    var S=o.clientWidth/100;if(!S)return;nodes.forEach(function(x,i){if(x.n[1])return;var sp=Nn[i].firstChild,w=x.w||(x.w=sp.offsetWidth),h=sp.offsetHeight,hit=nodes.some(function(y,j){if(!y.n[1])return false;var wy=y.w||(y.w=Nn[j].firstChild.offsetWidth);return Math.abs(x.px-y.px)*S<(w+wy)/2+2&&Math.abs(x.py-y.py)*S<h+1});Nn[i].classList.toggle('cache',hit)})}
  place(0);var vis=false,run=false;new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis&&!run&&!RM){run=true;requestAnimationFrame(function f(now){place(now/1000);if(vis)requestAnimationFrame(f);else run=false})}}).observe(o);
  $('#conCats').innerHTML=['Paiement','Banque','Comptabilité','Facture électronique','Signature','RH et paie','Communication','Calendrier','Caméras et capteurs','FFE et SIRE','Reprise de données','IA et plateforme'].map(function(c){return '<span>'+c+'</span>'}).join('')})();

var API=['<span class="c"># Les reprises de demain et leurs places, en une requête</span>','<span class="k">curl</span> https://api.stabl.fr/v1/cours?date=<span class="n">2026-11-18</span> \\','  -H <span class="s">"Authorization: Bearer pk_live_••••"</span>','','{','  <span class="k">"donnees"</span>: [','    { <span class="k">"reprise"</span>: <span class="s">"Galop 4"</span>, <span class="k">"heure"</span>: <span class="s">"10:00"</span>,','      <span class="k">"piste"</span>: <span class="s">"Grand manège"</span>, <span class="k">"places"</span>: <span class="n">8</span>, <span class="k">"inscrits"</span>: <span class="n">6</span> },','    { <span class="k">"reprise"</span>: <span class="s">"Collectif CSO"</span>, <span class="k">"heure"</span>: <span class="s">"12:15"</span>,','      <span class="k">"piste"</span>: <span class="s">"Carrière d’honneur"</span>, <span class="k">"places"</span>: <span class="n">6</span>, <span class="k">"inscrits"</span>: <span class="n">6</span> }','  ],','  <span class="k">"curseur_suivant"</span>: <span class="s">"c_8f2a"</span>','}'];
var API_JS=['<span class="c">// Les reprises de demain et leurs places</span>','<span class="k">const</span> r = <span class="k">await</span> fetch<span>(</span><span class="s">"https://api.stabl.fr/v1/cours?date=2026-11-18"</span>, {','  headers: { Authorization: <span class="s">"Bearer pk_live_••••"</span> }','});','<span class="k">const</span> { donnees } = <span class="k">await</span> r.json();','','donnees.forEach(c => console.log(c.reprise, c.heure, c.inscrits + <span class="s">"/"</span> + c.places));','<span class="c">// Galop 4 10:00 6/8</span>','<span class="c">// Collectif CSO 12:15 6/6</span>'];
var API_PY=['<span class="c"># Les reprises de demain et leurs places</span>','<span class="k">import</span> requests','','r = requests.get(<span class="s">"https://api.stabl.fr/v1/cours"</span>,','    params={<span class="s">"date"</span>: <span class="s">"2026-11-18"</span>},','    headers={<span class="s">"Authorization"</span>: <span class="s">"Bearer pk_live_••••"</span>})','','<span class="k">for</span> c <span class="k">in</span> r.json()[<span class="s">"donnees"</span>]:','    print(c[<span class="s">"reprise"</span>], c[<span class="s">"heure"</span>], c[<span class="s">"inscrits"</span>], <span class="s">"sur"</span>, c[<span class="s">"places"</span>])'];
var API_ALL=[API,API_JS,API_PY],apiTab=0,apiEl=$('#apiCode');
$$('.api-onglets>*').forEach(function(t,i){t.setAttribute('role','button');t.tabIndex=0;var go=function(){apiTab=i;$$('.api-onglets>*').forEach(function(x,k){x.classList.toggle('on',k===i)});apiEl.innerHTML=API_ALL[i].map(function(l){return '<span class="ln">'+l+'</span>'}).join('\n')+'<span class="caret"></span>'};t.addEventListener('click',go);t.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})});
live(apiEl,async function(w){var A=API_ALL[apiTab];apiEl.innerHTML='';for(var i=0;i<A.length;i++){apiEl.insertAdjacentHTML('beforeend','<span class="ln">'+A[i]+'</span>\n');await w(i===3?500:160)}apiEl.insertAdjacentHTML('beforeend','<span class="caret"></span>');await w(7000)},.3);

/* =====================================================================
   7. IMPORT EN CINQ ÉTAPES
   ===================================================================== */
var SRC=[['Ka','Kavalog','var(--c5)'],['Em','Equimondo','var(--c3)'],['Xl','Excel ou CSV','var(--c7)'],['FFE','FFE Club SIF','var(--c1)'],['Au','Autre logiciel','var(--c4)'],['Ph','Photo ou PDF','var(--c6)']];
$('#impSources').innerHTML=SRC.map(function(s){return '<span><b style="--c:'+s[2]+'">'+s[0]+'</b>'+s[1]+'</span>'}).join('');
var ET=[['Source','Choisissez votre ancien logiciel'],['Fichiers','Déposez vos exports, tels quels'],['Correspondance','L’IA relie chaque colonne'],['Doublons','Vous décidez, rien n’est écrasé'],['Import','Tout est en place, vérifiable']];
$('#impEtapes').innerHTML=ET.map(function(e,i){return '<li tabindex="0" role="button" data-i="'+i+'"><b><i>'+(i+1)+'</i>'+e[0]+'</b><small>'+nb(e[1])+'</small></li>'}).join('');
var MAP=[['NOM_PRENOM','Nom et prénom',99],['DATE_NAISS','Date de naissance',99],['TEL_PORT','Téléphone mobile',98],['NUM_LIC','Numéro de licence FFE',97],['NIV','Galop',96],['FORMULE','Forfait',71]];
$('#impScene').innerHTML=
 '<div class="imp-p" data-p="0"><div class="ip-src">'+SRC.map(function(s,i){return '<div class="ip-s'+(i===0?' sel':'')+'"><b style="--c:'+s[2]+'">'+s[0]+'</b><span>'+s[1]+'</span>'+(i===0?'<em>'+I('check')+'</em>':'')+'</div>'}).join('')+'</div><p class="ip-note">'+I('assistant')+nb('Kavalog : la correspondance des colonnes est déjà connue.')+'</p></div>'+
 '<div class="imp-p" data-p="1"><div class="ip-files">'+[['adherents_kavalog.xlsx','148 lignes','members'],['chevaux_kavalog.csv','44 lignes','horse'],['factures_2026.csv','1 240 lignes','invoice']].map(function(f){return '<div class="ip-f"><span class="ip-fi">'+I(f[2])+'</span><span class="gr"><b class="mono">'+f[0]+'</b><small>'+nb(f[1])+'</small><span class="u-bar"><i></i></span></span><span class="ip-ok">'+I('check')+'</span></div>'}).join('')+'</div></div>'+
 '<div class="imp-p" data-p="2"><div class="ip-map">'+MAP.map(function(m,i){return '<div class="ip-m" style="--i:'+i+'"><span class="mono ip-c">'+m[0]+'</span><span class="ip-ln"><i></i></span><span class="ip-t">'+m[1]+'</span>'+chip(m[2]+' %',m[2]<80?'warn':'ok',true)+'</div>'}).join('')+'</div></div>'+
 '<div class="imp-p" data-p="3"><div class="ip-dup">'+[['Même numéro de licence FFE','Téléphone plus récent dans le fichier','Fusionner','ok'],['Même e-mail','Adresse complétée par le fichier','Fusionner','ok'],['Nom proche, même date de naissance','« Lefebvre » ou « Lefèbvre » ?','À vérifier','warn'],['Même nom, même famille','Sans doute un frère ou une sœur','Garder les deux','acc']].map(function(d,i){return '<div class="ip-d" style="--i:'+i+'"><span class="ip-di">'+I('members')+'</span><span class="gr"><b>'+d[0]+'</b><small>'+nb(d[1])+'</small></span>'+chip(d[2],d[3],true)+'</div>'}).join('')+'</div></div>'+
 '<div class="imp-p" data-p="4"><div class="ip-fin">'+[[148,'adhérents'],[61,'familles regroupées'],[44,'chevaux'],[1240,'factures reprises']].map(function(k){return '<div><b class="num" data-to="'+k[0]+'">0</b><span>'+k[1]+'</span></div>'}).join('')+'</div><p class="ip-done"><span class="strass"></span>Import terminé. Annulable pendant 30 jours.</p></div>';
(function(){var lis=$$('#impEtapes li'),ps=$$('#impScene .imp-p'),cur=0,pause=0,tok=0;
  function show(i){cur=i;lis.forEach(function(l,k){l.classList.toggle('on',k===i);l.classList.toggle('ok',k<i);var b=$('b i',l);b.innerHTML=k<i?I('check'):String(k+1)});ps.forEach(function(p,k){p.classList.toggle('on',k===i)});
    var p=ps[i];if(i===1){$$('.ip-f',p).forEach(function(f,k){f.classList.remove('vu');setTimeout(function(){f.classList.add('vu')},RM?0:200+k*450)})}
    if(i===2||i===3){$$('.ip-m,.ip-d',p).forEach(function(m){m.classList.remove('vu')});setTimeout(function(){$$('.ip-m,.ip-d',p).forEach(function(m){m.classList.add('vu')})},RM?0:60)}
    if(i===4){$$('[data-to]',p).forEach(function(b){countUp(b,+b.dataset.to,1500)})}}
  lis.forEach(function(l,i){var go=function(){pause=Date.now()+9000;show(i)};l.addEventListener('click',go);l.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();go()}})});
  show(0);live($('.imp'),async function(w){if(RM)return;for(;;){await w(3200);if(Date.now()>pause)show((cur+1)%5)}},.3)})();

/* =====================================================================
   8. COMPARATIF
   ===================================================================== */
var CMP=[['Prix public, sans engagement ni frais d’entrée','','Engagement de 24 mois et frais de mise à disposition chez certains acteurs installés',0],
 ['Chevaux et utilisateurs illimités','','Tarifs par paliers de cavaliers, de chevaux ou de boxes',0],
 ['Applications pour les quatre profils','Gérant, employé, adhérent, coach','Applications rares ; les plus diffusées sont notées 3,6 sur 5',0],
 ['Fonctionne hors ligne','Tournée, soins, pointage','Non annoncé par les éditeurs étudiés',0],
 ['Une vraie RH','Pointage, congés, export de paie','Au mieux un planning du personnel',0],
 ['Comptabilité au-delà de l’export','Banque, TVA, FEC, expert-comptable','Le plus souvent un simple export comptable',0],
 ['Entretien des installations','Tâches, signalements, contrôles','Aucun éditeur ne le traite',0],
 ['Concours organisés au club, qui emmène qui','','Rare : un seul éditeur va jusqu’aux résultats en direct',0],
 ['Caméras et capteurs intégrés','','Annoncés par quelques nouveaux venus seulement',0],
 ['Assistant IA qui agit, serveur MCP','','Assistants génériques ou analyse de photo',0],
 ['API publique et export complet','','Aucune API publique trouvée',0],
 ['Facturation électronique (Factur-X)','','Répandue : la plupart des éditeurs la proposent',1],
 ['Planning, réservation en ligne, fiche cheval','','Proposés partout, c’est la base',1]];
$('#cmpLignes').innerHTML=CMP.map(function(c,i){return '<div class="cmp-l"><div class="q">'+c[0]+(c[1]?'<small>'+c[1]+'</small>':'')+'</div><div class="p"><span class="coche" style="--d:'+(i*.06)+'s">'+I('check')+'</span><span>Inclus</span></div><div class="m"><span class="pas'+(c[3]?' oui':'')+'">'+I(c[3]?'check':'minus')+'</span><span>'+c[2]+'</span></div></div>'}).join('');
new IntersectionObserver(function(es,o){if(es[0].isIntersecting){$('.cmp').classList.add('vu');o.disconnect()}},{threshold:.15}).observe($('.cmp'));

/* =====================================================================
   9. FAQ
   ===================================================================== */
var FAQ=[['Combien de temps faut-il pour démarrer ?','Une après-midi. La mise en route du club tient en 8 étapes, environ 10 minutes, et la reprise de vos données se fait en 5 étapes. Nous la faisons avec vous, gratuitement, depuis Kavalog, Equimondo, Excel, FFE Club SIF ou même une photo de votre cahier.'],
 ['Suis-je engagé ?','Non. L’abonnement est mensuel et se résilie en un clic. Vos données vous appartiennent : l’export complet est disponible à tout moment, dans des formats ouverts.'],
 ['Les cavaliers doivent-ils installer une application ?','Ils peuvent installer l’application sur leur téléphone ou simplement ouvrir un lien. Les enfants sans adresse e-mail ont leur espace dans le compte de la famille, et un seul parent paie pour tous.'],
 ['Et sans réseau au fond de l’écurie ?','La tournée des boxes, les soins, le pointage et l’appel fonctionnent hors ligne. Tout se synchronise dès que le téléphone retrouve le réseau.'],
 ['Comment Stabl travaille-t-il avec la FFE ?','Les licences se prennent en lot, les fichiers de FFE Club SIF s’importent, les galops se suivent dans Stabl. Les engagements en concours sont préparés dans Stabl, puis validés sur FFE Compet.'],
 ['Qu’est-ce que le serveur MCP ?','C’est une porte sécurisée qui permet à Claude, ChatGPT ou un autre assistant d’interroger votre club avec vos droits. Il lit par défaut, chaque écriture vous est montrée avant d’être faite et tout est noté dans un journal.'],
 ['Mes données sont-elles en sécurité ?','Elles sont hébergées en France, sauvegardées chaque jour et chiffrées. Chaque rôle ne voit que ce qui le concerne, et Stabl respecte le RGPD, avec l’export et l’effacement par adhérent.'],
 ['Êtes-vous prêts pour la facture électronique ?','Oui. Les factures partent au format Factur-X par une plateforme agréée, et les clients publics, comme une mairie ou une école, les reçoivent sur Chorus Pro. La TVA à taux multiples est gérée ligne par ligne.'],
 ['Combien coûte vraiment Stabl ?','Le prix affiché, rien de plus : 59, 149 ou 289 € HT par mois selon la formule, avec chevaux et utilisateurs illimités. Pas de frais d’entrée, pas de frais de reprise, 30 jours d’essai sans carte bancaire.']];
$('#faqListe').innerHTML=FAQ.map(function(f,i){return '<div class="qr'+(i===0?' ouvert':'')+'" data-r><button type="button" aria-expanded="'+(i===0)+'" aria-controls="rep'+i+'" id="q'+i+'"><span>'+f[0]+'</span><span class="pm">'+I('plus')+'</span></button><div class="rep" id="rep'+i+'" role="region" aria-labelledby="q'+i+'"><div><p>'+f[1]+'</p></div></div></div>'}).join('');
$$('.qr button').forEach(function(b){b.addEventListener('click',function(){var q=b.parentNode,o=!q.classList.contains('ouvert');q.classList.toggle('ouvert',o);b.setAttribute('aria-expanded',o)})});

/* =====================================================================
   10. CHEVAL 3D (hero) et FICHE 3D
   ===================================================================== */
var HAS3D=typeof THREE!=='undefined'&&typeof HORSE!=='undefined';
function themeCols(){return isDark()?{ink:[.93,.95,1],acc:[.44,.55,1],acc2:[.79,.84,1]}:{ink:[.04,.086,.21],acc:[.24,.39,.95],acc2:[.62,.72,1]}}
var VS='attribute float aSeed;attribute vec3 aDir;uniform float uT,uPx,uH,uB,uS;varying float vS,vF;void main(){vS=aSeed;float f=pow(.5+.5*sin(uT*(1.2+aSeed*3.)+aSeed*90.),10.);vF=f;vec3 p=position+aDir*uB*(.2+aSeed);vec4 mv=modelViewMatrix*vec4(p,1.);gl_PointSize=uPx*uH*uS*(.0042+.006*f+step(.9,aSeed)*(.006+.012*f))/-mv.z;gl_Position=projectionMatrix*mv;}';
var FS='uniform float uB;uniform vec3 uInk,uAcc,uAcc2;varying float vS,vF;void main(){float d=length(gl_PointCoord-.5);float a=smoothstep(.5,.36,d);vec3 c=mix(uInk,mix(uAcc,uAcc2,fract(vS*37.)),step(.9,vS));gl_FragColor=vec4(c,a*(.55+vF*.45)*(1.-uB*.8));if(gl_FragColor.a<.02)discard;}';
function horseScene(cv,o){var renderer;try{renderer=new THREE.WebGLRenderer({canvas:cv,antialias:false,alpha:true,powerPreference:'low-power'})}catch(e){return null}
  var DPR=Math.min(devicePixelRatio||1,2);renderer.setPixelRatio(DPR);
  var scene=new THREE.Scene(),cam=new THREE.PerspectiveCamera(30,1,.1,50),N=o.n,S=HORSE.sample(N,o.seed||11),verts=new Float32Array(HORSE.n*3),pos=new Float32Array(N*3),seed=new Float32Array(N),dir=new Float32Array(N*3);
  for(var k=0;k<N;k++){seed[k]=Math.random();var th=Math.random()*6.283,ph=Math.acos(2*Math.random()-1),rr=.5+Math.random()*1.8;dir[k*3]=Math.sin(ph)*Math.cos(th)*rr;dir[k*3+1]=Math.cos(ph)*rr*.7;dir[k*3+2]=Math.sin(ph)*Math.sin(th)*rr-1.2}
  var geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(pos,3));geo.setAttribute('aSeed',new THREE.BufferAttribute(seed,1));geo.setAttribute('aDir',new THREE.BufferAttribute(dir,3));
  var c=themeCols(),mat=new THREE.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{uT:{value:0},uPx:{value:DPR},uH:{value:1},uB:{value:0},uS:{value:o.size||1},uInk:{value:new THREE.Vector3().fromArray(c.ink)},uAcc:{value:new THREE.Vector3().fromArray(c.acc)},uAcc2:{value:new THREE.Vector3().fromArray(c.acc2)}},vertexShader:VS,fragmentShader:FS});
  D.addEventListener('theme',function(){var c=themeCols();mat.uniforms.uInk.value.fromArray(c.ink);mat.uniforms.uAcc.value.fromArray(c.acc);mat.uniforms.uAcc2.value.fromArray(c.acc2)});
  matchMedia('(prefers-color-scheme:dark)').addEventListener&&matchMedia('(prefers-color-scheme:dark)').addEventListener('change',function(){D.dispatchEvent(new Event('theme'))});
  var pts=new THREE.Points(geo,mat);pts.frustumCulled=false;scene.add(pts);
  var W=0,H=0;function size(){W=cv.clientWidth;H=cv.clientHeight;if(!W||!H)return;renderer.setSize(W,H,false);cam.aspect=W/H;cam.updateProjectionMatrix();mat.uniforms.uH.value=H}
  addEventListener('resize',size);size();
  return {r:renderer,scene:scene,cam:cam,mat:mat,geo:geo,S:S,verts:verts,pos:pos,size:size,W:function(){return W},H:function(){return H},render:function(){renderer.render(scene,cam)}}}
function pose(h,t){HORSE.lerp(t,h.verts);HORSE.points(h.S,h.verts,h.pos);h.geo.attributes.position.needsUpdate=true}

if(HAS3D){
  /* hero */
  (function(){var cv=$('#scene'),h=horseScene(cv,{n:innerWidth<700?9000:20000,seed:11});if(!h){cv.parentNode.hidden=true;return}
    var mx=0,my=0,burst=0,vis=true,run=false;addEventListener('pointermove',function(e){mx=e.clientX/innerWidth-.5;my=e.clientY/innerHeight-.5},{passive:true});
    new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis&&!run&&!RM){run=true;requestAnimationFrame(frame)}}).observe(cv);
    function frame(now){var t=now/1000,tb=Math.min(1,Math.max(0,scrollY/(innerHeight*.9)));burst+=(tb-burst)*.08;
      if(!h.W())h.size();pose(h,t*.6);var ang=Math.PI*.5+.32+mx*.3+burst*.8,dist=h.W()<500?3.3:2.55;h.cam.position.set(Math.sin(ang)*dist,.6-my*.2,Math.cos(ang)*dist);h.cam.lookAt(0,.46,0);
      h.mat.uniforms.uT.value=t;h.mat.uniforms.uB.value=burst;h.render();if(vis&&!RM)requestAnimationFrame(frame);else run=false}
    if(RM)frame(1200);})();
  /* fiche cheval */
  (function(){var box=$('#mkCheval .fc-3d'),cv=$('.fc-cv',box),hs=$('.fc-hs',box);var h=horseScene(cv,{n:innerWidth<700?6000:11000,seed:5,size:1.15});if(!h){box.classList.add('sans3d');return}
    var SP=[['Antérieur gauche','Ferrure jeudi',[.075,.25,.33],'warn'],['Dos','Ostéopathe le 12 décembre',[0,.66,-.02],''],['Bouche','Dentiste en janvier',[0,.8,.6],'']];
    hs.innerHTML=SP.map(function(s){return '<div class="fc-p '+s[3]+'"><i></i><span><b>'+s[0]+'</b><small>'+nb(s[1])+'</small></span></div>'}).join('');var HP=$$('.fc-p',hs),v=new THREE.Vector3();
    var drag=0,dx=0,ang=.9,vis=false,run=false,last=0;
    box.addEventListener('pointerdown',function(e){drag=1;dx=e.clientX;box.setPointerCapture(e.pointerId)});box.addEventListener('pointermove',function(e){if(drag){ang-=(e.clientX-dx)*.01;dx=e.clientX}});box.addEventListener('pointerup',function(){drag=0});
    new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis&&!run){run=true;last=performance.now();requestAnimationFrame(frame)}}).observe(box);
    pose(h,.12);
    function frame(now){var dt=Math.min(.05,(now-last)/1000);last=now;if(!drag&&!RM)ang+=dt*.22;if(!h.W())h.size();var dist=h.W()<420?3.1:2.6;h.cam.position.set(Math.sin(ang)*dist,.75,Math.cos(ang)*dist);h.cam.lookAt(0,.5,0);h.cam.updateMatrixWorld();h.mat.uniforms.uT.value=now/1000;h.render();
      SP.forEach(function(s,i){v.set(s[2][0],s[2][1],s[2][2]).project(h.cam);var x=(v.x*.5+.5)*h.W(),y=(-v.y*.5+.5)*h.H(),camDir=new THREE.Vector3(Math.sin(ang),0,Math.cos(ang)),front=(s[2][0]*camDir.x+s[2][2]*camDir.z)>-.12||Math.abs(s[2][0])<.01;
        HP[i].style.transform='translate('+x.toFixed(1)+'px,'+y.toFixed(1)+'px)';HP[i].classList.toggle('cache',!front&&i===0)});
      if(vis&&!RM)requestAnimationFrame(frame);else run=false}})();
}else{$('.hero-cheval').hidden=true;var fb=$('#mkCheval .fc-3d');if(fb)fb.classList.add('sans3d')}

/* cheval en points 2D (appel final) */
(function(){var cv=$('#cvFinal');if(typeof HORSE==='undefined'){cv.hidden=true;return}var ctx=cv.getContext('2d'),N=innerWidth<700?1400:2600,S=HORSE.sample(N,9),P=new Float32Array(N*3),V=new Float32Array(HORSE.n*3),W=0,H=0,DP=Math.min(devicePixelRatio||1,2),vis=false,run=false;
  function size(){W=cv.clientWidth;H=cv.clientHeight;cv.width=W*DP;cv.height=H*DP}
  new IntersectionObserver(function(es){vis=es[0].isIntersecting;if(vis&&!run){run=true;requestAnimationFrame(draw)}}).observe(cv);
  function draw(now){if(cv.clientWidth!==W||cv.clientHeight!==H)size();var t=now/1000,dk=isDark(),col=dk?'#c3cae0':'#0a1636',acc=dk?'#8aa1ff':'#3d63f2';HORSE.lerp(RM?.3:t*.42,V);HORSE.points(S,V,P);ctx.setTransform(DP,0,0,DP,0,0);ctx.clearRect(0,0,W,H);
    var a=1.5+(RM?0:Math.sin(t*.3)*.16),ca=Math.cos(a),sa=Math.sin(a),sc=Math.min(W/1.9,H/1.15)*(W<700?1.05:1.25);
    for(var k=0;k<N;k++){var X=P[k*3],Y=P[k*3+1]-.42,Z=P[k*3+2],x=X*ca+Z*sa,z=-X*sa+Z*ca,pp=1/(1+z*.18),tw=RM?0:Math.pow(.5+.5*Math.sin(t*(1.5+(k%7)*.4)+k),6);
      ctx.globalAlpha=Math.min(1,.4+tw*.8);ctx.fillStyle=(k%23===0)?acc:col;ctx.beginPath();ctx.arc(W/2-x*sc*pp,H/2-Y*sc*pp,((k%13===0?1.6:.8)+tw*1.3)*1.1,0,6.283);ctx.fill()}
    if(vis&&!RM)requestAnimationFrame(draw);else run=false}})();

/* =====================================================================
   11. DÉFILEMENT : progression, nav, inclinaison, parallaxe
   ===================================================================== */
var prog=$('#prog'),nav=$('#nav'),lap=$('#vLap'),PAR=$$('[data-par]'),navL=$$('.nav-l a'),secs=navL.map(function(a){return $(a.getAttribute('href'))}),ticking=false;
function onScroll(){ticking=false;var y=scrollY,H=D.documentElement.scrollHeight-innerHeight;prog.style.transform='scaleX('+(H>0?y/H:0).toFixed(4)+')';nav.classList.toggle('ombre',y>8);
  if(!RM){var r=lap.getBoundingClientRect(),p=Math.max(0,Math.min(1,(r.top-innerHeight*.18)/(innerHeight*.6)));lap.style.setProperty('--rx',(p*16).toFixed(2)+'deg');lap.style.setProperty('--sc',(1-p*.06).toFixed(3));
    PAR.forEach(function(e){var b=e.getBoundingClientRect(),c=(b.top+b.height/2-innerHeight/2)*(+e.dataset.par);if(e.classList.contains('flotte'))e.style.setProperty('--py',c.toFixed(1)+'px');else e.style.transform='translateY('+c.toFixed(1)+'px)'})}
  var on=-1;secs.forEach(function(s,i){if(s&&s.getBoundingClientRect().top<innerHeight*.4)on=i});navL.forEach(function(a,i){a.classList.toggle('on',i===on&&secs[i].getBoundingClientRect().bottom>innerHeight*.4)});
  SCROLLERS.forEach(function(f){f()})}
addEventListener('scroll',function(){if(!ticking){ticking=true;requestAnimationFrame(onScroll)}},{passive:true});addEventListener('resize',onScroll);
setTimeout(function(){$$('.flotte').forEach(function(f,i){setTimeout(function(){f.classList.add('vu')},RM?0:i*260)})},RM?0:1300);

/* révélations au défilement */
(function(){var T=$$('[data-r]');var groups=new Map();T.forEach(function(t){var p=t.parentNode,n=groups.get(p)||0;groups.set(p,n+1);if(!t.style.getPropertyValue('--d'))t.style.setProperty('--d',(Math.min(n,6)*.07)+'s')});
  if(RM||!('IntersectionObserver' in window)){T.forEach(function(t){t.classList.add('vu')});return}
  var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){e.target.classList.add('vu');io.unobserve(e.target)}})},{rootMargin:'0px 0px -8% 0px'});T.forEach(function(t){io.observe(t)})})();
/* compteurs */
(function(){var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){var el=e.target;countUp(el,+el.dataset.count,1600);io.unobserve(el)}})},{threshold:.6});$$('[data-count]').forEach(function(c){c.textContent='0';io.observe(c)})})();

fits(D);nbTree(D.body);onScroll();

})();
