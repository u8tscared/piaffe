/* =====================================================================
   PIAFFE · Vue Adhérent (lot G) : accueil, réserver, mon cheval,
   demi-pension, coachs, concours, progression, paiements, contrats,
   messages, profil. Téléphone d'abord, belle aussi sur ordinateur.
   ===================================================================== */
(function(){
var D=P.D,F=P.fmt,U=P.ui,C=P.chart,$=P.$,$$=P.$$;
/* La démo suit Léa Martin (m001). Dans un vrai club, D.me.adherent est la fiche de la personne connectée : voir « Club réel » en fin de fichier. */
var DEMO=!D.me||D.me.adherent==='m001'||!!(window.PL&&PL.sandbox);
/* Manche 4 : fondu et léger glissement quand un onglet ou un filtre interne redessine un bloc (pas au premier rendu) */
function swIn(n){if(!n)return;if(n.__sw&&!P.RM){n.classList.remove('ad-sw');void n.offsetWidth;n.classList.add('ad-sw')}n.__sw=1}
P.css(`.ad-sw{animation:adsw .24s var(--e-out) backwards}@keyframes adsw{from{opacity:0;transform:translateY(10px)}}
.chk.ad-bnc{animation:adchk .34s var(--e-spring)}@keyframes adchk{40%{transform:scale(.8)}75%{transform:scale(1.1)}}
@media (prefers-reduced-motion:reduce){.ad-sw,.chk.ad-bnc{animation:none!important}}`);
/* petit rebond quand on coche une case dans la vue adhérent */
document.addEventListener('click',function(e){var c=e.target.closest&&e.target.closest('.chk');if(!c||P.RM||P.state.role!=='adherent')return;c.classList.remove('ad-bnc');void c.offsetWidth;c.classList.add('ad-bnc')});
var DW=['dim.','lun.','mar.','mer.','jeu.','ven.','sam.'],DWC=['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function dowOff(n){return (2+n)%7}
function dayL(n){return n===0?'Aujourd’hui':n===1?'Demain':cap(F.dateL(D.day(n)))}
function endT(l){var p=l.start.split(':'),m=+p[0]*60+ +p[1]+l.dur;return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
function sq(icon,k){k=k||'acc';return '<span class="av sq" style="--c:var(--'+k+'-pale);color:var(--'+k+')">'+ICON(icon)+'</span>'}
function arena(l){return (D.club.arenas.find(function(a){return a.id===l.arena})||{}).name}
function minsTo(t){var p=t.split(':');return (+p[0])*60+(+p[1])-(9*60+41)}
function dur(m){return m>=60?Math.floor(m/60)+' h '+String(m%60).padStart(2,'0'):m+' min'}
/* Contournement : la classe .bar du design system (height:6px) s'applique aussi aux <rect class="bar"> de P.chart.bars */
function bars(v,l,o){return C.bars(v,l,o).replace(/style="--i:(\d+)"([^>]*?) height="([\d.]+)"/g,'style="--i:$1;height:$3px"$2 height="$3"')}
var GRIP='<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><circle class="f" cx="9" cy="6" r="1.4"/><circle class="f" cx="15" cy="6" r="1.4"/><circle class="f" cx="9" cy="12" r="1.4"/><circle class="f" cx="15" cy="12" r="1.4"/><circle class="f" cx="9" cy="18" r="1.4"/><circle class="f" cx="15" cy="18" r="1.4"/></svg>';

/* ---------- Données propres à la vue adhérent ---------- */
/* Emma Moreau (m019), Hélène Girard (m078) et Alice Vincent (m044) sont fixées dans core/data.js. */
var ME=D.member('m001'),UL=D.horse('h01'),DP=D.halfboard.find(function(x){return x.id==='dp1'})||{},DPR=D.member(DP.rider);
var PONY=D.horse('h08');
/* Faits de référence partagés (core/data.js) : un seul chiffre partout */
var FX=D.facts||{},RB=FX.leaRambouillet||{passage:'11:42',order:'14e sur 32',bib:214,recon:'11:10',warmup:'11:20',paddock:'B',classe:'Club Élite · 115 cm'};
function hm(t){return t.replace(/^0/,'').replace(':00',' h').replace(':',' h ')}
var PAUL=(FX.paulineToday||[{at:'11:15',what:'Cours particulier Léa Martin et Ulysse',arena:'a2'}])[0];
var COURS={title:'Cours particulier CSO',start:PAUL.at,dur:60,arena:PAUL.arena||'a2',coach:'c01'};
function bcs(){return String(UL.bcs!=null?UL.bcs:(FX.ulysseBcs||3)).replace('.',',')}
D.adhFamily=D.adhFamily||[
 {id:'lea',ref:'m001',first:'Léa',last:'Martin',age:27,galop:7,color:ME.color,role:'Propriétaire d’Ulysse',lic:ME.lic,since:2019},
 {id:'jules',first:'Jules',last:'Martin',age:9,galop:2,color:'var(--c4)',role:'Votre fils, 9 ans',lic:'0458127K',since:2024,minor:true}];
D.adhNews=D.adhNews||[
 {id:'n1',tag:'Concours',icon:'trophy',title:'Rambouillet dimanche : les horaires de passage sont publiés',when:'Ce matin',text:'Les neuf cavaliers engagés trouvent leur horaire de passage et leur place dans le camion sur l’écran Concours. Rendez-vous à 6 h 30 dans la cour principale, chevaux nattés la veille.',go:'adh-concours',cta:'Voir mon horaire'},
 {id:'n2',tag:'Installations',icon:'rain',title:'Carrière d’honneur fermée jeudi et vendredi',when:'Hier',text:'La pluie annoncée nous oblige à fermer la carrière d’honneur. Les reprises concernées passent au Grand manège, vos réservations sont déjà mises à jour.',go:'adh-reserver',cta:'Voir mes réservations'},
 {id:'n3',tag:'Vie du club',icon:'gift',title:'Repas de Noël du club le samedi 12 décembre',when:'Lundi',text:'Carrousel des enfants à 17 h, puis repas au club-house à 19 h 30. Participation de 18 € par adulte et 10 € par enfant, ajoutée à votre prochaine facture.',cta:'Inscrire ma famille',toast:'Famille Martin inscrite au repas de Noël, 28 € ajoutés à la facture de décembre'}];
D.adhStages=D.adhStages||[
 {id:'st1',title:'Stage CSO perfectionnement',when:'Du 21 au 23 décembre',d:'21',m:'déc.',days:3,hours:'10:00 – 16:00',coach:'s04',level:'Galop 6 et plus',price:195,left:3,cap:8,fit:'lea',note:'Enchaînements à 1,10 m, travail des abords, vidéo de chaque parcours.'},
 {id:'st2',title:'Stage cross et extérieur',when:'Samedi 21 novembre',d:'21',m:'nov.',days:1,hours:'16:00 – 17:30',coach:'s04',level:'Galop 5 et plus',price:38,left:1,cap:8,fit:'lea',note:'Parcours de cross du club : gué, contre-haut, tronc.'},
 {id:'st3',title:'Stage dressage avec Julien Mercier',when:'Les 28 et 29 décembre',d:'28',m:'déc.',days:2,hours:'9:30 – 12:30',coach:'c02',level:'Galop 6 et plus',price:140,left:0,cap:6,wait:2,fit:'lea',note:'Juge national. Reprise Amateur 3 commentée et corrigée.'},
 {id:'st4',title:'Stage poney Galop 3',when:'Du 21 au 24 décembre',d:'21',m:'déc.',days:4,hours:'14:00 – 17:00',coach:'s03',level:'Galop 2 validé',price:160,left:4,cap:10,fit:'jules',note:'Préparation et passage du Galop 3 le dernier jour, goûter compris.'},
 {id:'st5',title:'Journée jeux à poney',when:'Mercredi 23 décembre',d:'23',m:'déc.',days:1,hours:'10:00 – 16:00',coach:'s08',level:'Galop 1 à 3',price:45,left:6,cap:12,fit:'jules',note:'Pony-games, voltige et balade en main. Pique-nique à prévoir.'}];
D.adhInvoices=D.adhInvoices||[
 {id:'F-2026-1173',label:'Pension complète de novembre, Ulysse de la Roche',amount:520,vat:20,date:D.iso(D.day(-16)),due:D.iso(D.day(-2)),status:'en retard',method:'Prélèvement SEPA',lines:[['Pension complète, box B01',480],['Sorties au paddock, 4 jours',24],['Couverture, pose et retrait',16]]},
 {id:'F-2026-1181',label:'Engagement CSO Rambouillet, Club Élite',amount:26,vat:20,date:D.iso(D.day(-3)),due:D.iso(D.day(5)),status:'envoyée',method:'Carte bancaire',lines:[['Engagement FFE, épreuve 7',26]]},
 {id:'F-2026-1184',label:'Transport Rambouillet, part de van',amount:44,vat:20,date:D.iso(D.day(-3)),due:D.iso(D.day(5)),status:'envoyée',method:'Carte bancaire',lines:[['Aller-retour 48 km, partagé à trois',44]]},
 {id:'AV-2026-0042',label:'Demi-pension de novembre, part d’'+DPR.first+' '+DPR.last,amount:-180,vat:20,date:D.iso(D.day(-12)),due:D.iso(D.day(-12)),status:'déduit',method:'Avoir',lines:[['Demi-pension 2 jours, mardi et samedi',-180]]},
 {id:'F-2026-1102',label:'Pension complète d’octobre, Ulysse de la Roche',amount:520,vat:20,date:D.iso(D.day(-47)),due:D.iso(D.day(-33)),status:'payée',method:'Prélèvement SEPA',lines:[['Pension complète, box B01',480],['Sorties au paddock, 5 jours',30],['Douche',10]]},
 {id:'F-2026-1088',label:'Ferrure complète (refacturation maréchal)',amount:95,vat:20,date:D.iso(D.day(-44)),due:D.iso(D.day(-30)),status:'payée',method:'Prélèvement SEPA',lines:[['Ferrure 4 pieds, Benoît Gautier',95]]},
 {id:'F-2026-1061',label:'Coaching CSO particulier, Pauline Arnaud',amount:55,vat:20,date:D.iso(D.day(-52)),due:D.iso(D.day(-52)),status:'payée',method:'Carte bancaire',lines:[['Séance de 60 min',55]]},
 {id:'F-2026-1040',label:'Forfait annuel 1 h par semaine, Jules (1 sur 3)',amount:260,vat:5.5,date:D.iso(D.day(-73)),due:D.iso(D.day(-73)),status:'payée',method:'Carte bancaire',lines:[['Forfait annuel, échéance 1 sur 3',260]]},
 {id:'F-2026-0987',label:'Licences FFE 2027, Léa et Jules',amount:65,vat:0,date:D.iso(D.day(-78)),due:D.iso(D.day(-78)),status:'payée',method:'Carte bancaire',lines:[['Licence pratiquant adulte',40],['Licence pratiquant enfant',25]]}];

/* ---------- État de la session (les écrans se répondent) ---------- */
var A={credits:2,card:{left:6,total:10},
 res:[{les:'l12',off:1,who:'lea',horse:'h01',pay:'Compris dans la préparation concours'},{les:'l15',off:2,who:'lea',horse:'h01',pay:'Carte de séances'},
      {les:'l10',off:1,who:'jules',horse:PONY.id,pay:'Forfait annuel'},{les:'l23',off:4,who:'jules',horse:null,pay:'Forfait annuel'}],
 wait:{},stages:{},extra:{},signed:{},paid:false,journal:[],asks:[],applied:{},engaged:{k1:true},likes:{},
 coachRes:[{name:'Pauline Arnaud',d:D.day(0).getDate(),w:'auj.',time:PAUL.at,dur:60,id:'c01'}],
 fav:{lea:'h02',jules:'h08'},quiz:{},myOffers:[],org:'til',orgRole:'owner'};
function prof(){var id=P.prefs.get('adh:profile','lea');return D.adhFamily.find(function(f){return f.id===id})||D.adhFamily[0]}
function isKid(){return prof().id==='jules'}
function count(l){return Math.min(l.cap,l.riders.length+(A.extra[l.id]||0))}
function waitN(l){return l.wait||(A.extra[l.id]?2:0)}
function fits(l,p){return p.id==='lea'?/6|7|Propriétaires|concours|Horse-ball|cross|Balade/i.test(l.title):/Galop (1-2|2)|Balade/i.test(l.title)}
function price(l,p){return l.dur>=120?35:l.dur>=90?32:(p.id==='lea'?16:24)}
function resFor(p){return A.res.filter(function(r){return r.who===p.id}).sort(function(a,b){return a.off-b.off})}
function lesson(id){return D.lessons.find(function(l){return l.id===id})}
function due(){return D.adhInvoices.filter(function(i){return i.status!=='payée'}).reduce(function(a,i){return a+i.amount},0)}
function toSign(){return CONTRACTS().filter(function(c){return c.status==='à signer'&&!A.signed[c.id]})}

/* ---------- Styles communs ---------- */
P.css(`
/* Pastille « 410 € » de l’onglet Paiements : elle reste dans son onglet au lieu de toucher le bouton « Tous les écrans » */
.app[data-role="adherent"] .tabbar button[data-go="adh-paiements"] .bdg{left:auto;right:2px;top:3px;max-width:calc(100% - 4px);overflow:hidden;text-overflow:ellipsis}
.ad-pill{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 10px 0 4px;border-radius:var(--r-pill);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2),var(--shadow-1);font-weight:600;font-size:13.5px;transition:background var(--t-2)}
.ad-pill:hover{background:var(--surface-2)}
.ad-pill .av{width:28px;height:28px;font-size:13px}
.ad-pill svg.i{width:14px;height:14px;color:var(--mut)}
.ad-b{display:flex;flex-direction:column}
.ad-b>.cb{flex:1;display:flex;flex-direction:column;gap:12px}
.ad-b .end{margin-top:auto}
.ad-big{font:800 34px/1 var(--f-display);letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.ad-big small{font-size:16px;color:var(--mut);font-weight:600;margin-left:4px;letter-spacing:-.01em}
.ad-row{display:flex;align-items:center;gap:12px;min-width:0}
.ad-row .t{font-weight:600;font-size:13.5px}
.ad-row .s{color:var(--mut)}
.ad-tap{min-height:52px;cursor:pointer;transition:background var(--t-1)}
.ad-tap:hover{background:var(--surface-2)}
.sheet .sf .ad-full{flex:1}
.ad-spinbtn{position:relative}
.ad-spinbtn.busy{color:transparent!important;pointer-events:none}
.ad-spinbtn.busy svg{opacity:0}
.ad-spinbtn.busy::after{content:"";position:absolute;inset:0;margin:auto;width:18px;height:18px;border-radius:50%;border:2px solid var(--acc-ink);border-top-color:transparent;animation:ad-spin .7s linear infinite}
.ad-spinbtn.done{background:var(--ok)!important;color:var(--acc-ink)!important;pointer-events:none;transition:background var(--t-2)}
.ad-spinbtn.done svg{width:20px;height:20px;stroke-width:2.4;stroke-dasharray:24;stroke-dashoffset:24;animation:ad-draw var(--t-3) var(--e-out) forwards}
@keyframes ad-spin{to{transform:rotate(360deg)}}
@keyframes ad-draw{to{stroke-dashoffset:0}}
/* confirmation animée */
.ad-ok{display:flex;flex-direction:column;align-items:center;text-align:center;gap:10px;padding:10px 0 4px}
.ad-okc{position:relative;width:96px;height:96px;margin-bottom:4px}
.ad-okc svg{width:96px;height:96px;display:block}
.ad-okc .r{fill:var(--ok-pale);stroke:var(--ok);stroke-width:3;stroke-dasharray:214;stroke-dashoffset:214;transform:rotate(-90deg);transform-origin:center;animation:ad-draw .5s var(--e-out) .05s forwards,ad-fill .4s var(--e-out) both}
.ad-okc .k{fill:none;stroke:var(--ok);stroke-width:5;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:46;stroke-dashoffset:46;animation:ad-draw .32s var(--e-out) .42s forwards}
@keyframes ad-fill{from{fill-opacity:0}}
.ad-okc .strass{position:absolute;animation:ad-spark .9s var(--e-out) .55s both}
.ad-okc .s1{top:2px;right:4px;width:14px;height:14px}.ad-okc .s2{bottom:12px;left:-4px;width:9px;height:9px;animation-delay:.68s}.ad-okc .s3{top:22px;left:2px;width:7px;height:7px;animation-delay:.8s}
@keyframes ad-spark{0%{opacity:0;transform:scale(0) rotate(-40deg)}60%{opacity:1;transform:scale(1.5) rotate(20deg)}100%{opacity:1;transform:scale(1) rotate(0)}}
.ad-ok h3{font-size:22px;animation:rise var(--t-4) var(--e-out) .5s both}
.ad-ok p{color:var(--mut);max-width:38ch;animation:rise var(--t-4) var(--e-out) .58s both}
.ad-ticket{width:100%;text-align:left;margin-top:10px;border-radius:var(--r-lg);background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);animation:ad-tk .6s var(--e-spring) .7s both;position:relative}
@keyframes ad-tk{from{opacity:0;transform:translateY(28px) scale(.96)}}
.ad-ticket .tk1{padding:16px 18px;display:flex;gap:12px;align-items:center}
.ad-ticket .tk2{padding:14px 18px 16px;border-top:1.5px dashed var(--line-2);display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 16px;position:relative}
.ad-ticket .tk2::before,.ad-ticket .tk2::after{content:"";position:absolute;top:-9px;width:18px;height:18px;border-radius:50%;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line)}
.ad-ticket .tk2::before{left:-9px;clip-path:inset(0 0 0 50%)}.ad-ticket .tk2::after{right:-9px;clip-path:inset(0 50% 0 0)}
.ad-ticket .k{font-size:13px;color:var(--mut);font-weight:600;letter-spacing:.04em;text-transform:uppercase}
.ad-ticket .v{font-weight:600;font-size:13.5px;margin-top:2px}
/* choix (radio en cartes) */
.ad-opt{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line-2);background:var(--surface);width:100%;text-align:left;min-height:56px;transition:box-shadow var(--t-2),background var(--t-2)}
.ad-opt[aria-checked="true"]{box-shadow:inset 0 0 0 2px var(--acc);background:var(--acc-pale)}
.ad-opt .rd{width:20px;height:20px;border-radius:50%;box-shadow:inset 0 0 0 1.6px var(--line-2);flex:none;display:grid;place-items:center;transition:all var(--t-2)}
.ad-opt[aria-checked="true"] .rd{box-shadow:inset 0 0 0 6px var(--acc)}
.ad-opt[disabled]{opacity:.5;pointer-events:none}
.ad-lbl{font-size:13px;font-weight:600;color:var(--ink-2);margin:16px 0 8px}
.ad-lbl:first-child{margin-top:0}
.ad-sum{display:flex;justify-content:space-between;gap:12px;padding:7px 0;font-size:13.5px}
.ad-sum+.ad-sum{border-top:1px solid var(--line)}
.ad-sum.tot{font-weight:700;font-size:15px}
/* caméra simulée */
.ad-cam{position:relative;border-radius:var(--r-md);overflow:hidden;background:#17120d;aspect-ratio:16/9;color:#fff;isolation:isolate}
.ad-cam canvas{display:block;width:100%;height:100%}
.ad-cam::after{content:"";position:absolute;inset:0;pointer-events:none;background:radial-gradient(ellipse at 50% 45%,transparent 55%,rgba(0,0,0,.5)),repeating-linear-gradient(0deg,rgba(255,255,255,.025) 0 1px,transparent 1px 3px);z-index:1}
.ad-cam .o{position:absolute;z-index:2;display:flex;align-items:center;gap:6px;font-size:13px;font-weight:600}
.ad-cam .c1{top:10px;left:10px}.ad-cam .c2{top:10px;right:10px;background:rgba(0,0,0,.45);padding:3px 8px;border-radius:5px;backdrop-filter:blur(6px)}
.ad-cam .c3{bottom:10px;left:10px;font:500 13px var(--f-mono);background:rgba(0,0,0,.45);padding:3px 7px;border-radius:5px}
.ad-cam .c4{bottom:8px;right:8px}
.ad-cam .c4 button{width:32px;height:32px;border-radius:8px;background:rgba(0,0,0,.45);display:grid;place-items:center;color:#fff;backdrop-filter:blur(6px)}
.ad-cam .fb{position:absolute;inset:0;display:grid;place-items:center;color:rgba(255,255,255,.5)}
.ad-cam .fb svg{width:64px;height:64px}
`);

/* ---------- Caméra de box simulée (scène three.js, couleurs libres) ---------- */
function boxCam(box,o){o=o||{};
  var stamp=function(){var t=new Date(),b=D.today;return '17/11/2026 '+String(b.getHours()).padStart(2,'0')+':'+String(b.getMinutes()).padStart(2,'0')+':'+String(t.getSeconds()).padStart(2,'0')};
  box.classList.add('ad-cam');
  box.innerHTML='<span class="o c1"><span class="live">EN DIRECT</span></span><span class="o c2">'+(o.label||'Box B01 · Ulysse')+'</span><span class="o c3 num">'+stamp()+'</span>'+(o.tools?'<span class="o c4"><button title="Prendre une photo" data-snap>'+ICON('image','sm')+'</button><button title="Agrandir" data-full>'+ICON('expand','sm')+'</button></span>':'');
  var st=$('.c3',box),iv=setInterval(function(){if(!box.isConnected){clearInterval(iv);return}st.textContent=stamp()},1000);
  if(!window.THREE||!window.HORSE){box.insertAdjacentHTML('afterbegin','<div class="fb">'+HORSE_GLYPH()+'</div>');return}
  var T=THREE,ren;try{ren=new T.WebGLRenderer({antialias:true})}catch(e){box.insertAdjacentHTML('afterbegin','<div class="fb">'+HORSE_GLYPH()+'</div>');return}
  var W=box.clientWidth||320,H=box.clientHeight||180;ren.setPixelRatio(Math.min(devicePixelRatio||1,1.5));ren.setSize(W,H,false);box.insertBefore(ren.domElement,box.firstChild);
  function tex(draw,rx,ry){var c=document.createElement('canvas');c.width=c.height=256;draw(c.getContext('2d'));var t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(rx||1,ry||1);return t}
  var s=7;function rnd(){s=(s*16807)%2147483647;return (s-1)/2147483646}
  var straw=tex(function(g){g.fillStyle='#b99a5c';g.fillRect(0,0,256,256);for(var i=0;i<1400;i++){var x=rnd()*256,y=rnd()*256,a=rnd()*6.28,l=6+rnd()*14;g.strokeStyle=['#d9c184','#a8864a','#c9ad6c','#8f7340','#e6d39a'][i%5];g.lineWidth=1+rnd();g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke()}},2,2);
  var wood=tex(function(g){g.fillStyle='#5a4130';g.fillRect(0,0,256,256);for(var i=0;i<8;i++){g.fillStyle=i%2?'#4d3728':'#624735';g.fillRect(0,i*32,256,30);g.fillStyle='#2e2018';g.fillRect(0,i*32+30,256,2)}for(var k=0;k<300;k++){g.fillStyle='rgba(0,0,0,.08)';g.fillRect(rnd()*256,rnd()*256,20+rnd()*40,1)}},2,1);
  var sc=new T.Scene();sc.background=new T.Color(0x17120d);
  var cam=new T.PerspectiveCamera(56,W/H,.05,30);cam.position.set(.98,1.5,1.12);cam.lookAt(-.14,.32,-.2);
  var S=1.25,floor=new T.Mesh(new T.PlaneGeometry(S*2,S*2),new T.MeshStandardMaterial({map:straw,roughness:1}));floor.rotation.x=-Math.PI/2;sc.add(floor);
  var wm=new T.MeshStandardMaterial({map:wood,roughness:.9});
  var w1=new T.Mesh(new T.PlaneGeometry(S*2,1.5),wm);w1.position.set(0,.75,-S);sc.add(w1);
  var w2=new T.Mesh(new T.PlaneGeometry(S*2,1.5),wm);w2.position.set(-S,.75,0);w2.rotation.y=Math.PI/2;sc.add(w2);
  var win=new T.Mesh(new T.PlaneGeometry(.5,.34),new T.MeshBasicMaterial({color:0xcfe0ff}));win.position.set(-S+.01,1.0,.1);win.rotation.y=Math.PI/2;sc.add(win);
  var bar=new T.Mesh(new T.BoxGeometry(.02,.36,.03),new T.MeshBasicMaterial({color:0x2e2018}));bar.position.set(-S+.02,1.0,.1);sc.add(bar);
  var bucket=new T.Mesh(new T.CylinderGeometry(.13,.1,.2,20),new T.MeshStandardMaterial({color:0x2f55c8,roughness:.5}));bucket.position.set(-S+.2,.1,-S+.2);sc.add(bucket);
  var water=new T.Mesh(new T.CircleGeometry(.12,20),new T.MeshStandardMaterial({color:0x9fc4e8,roughness:.1}));water.rotation.x=-Math.PI/2;water.position.set(-S+.2,.19,-S+.2);sc.add(water);
  var hay=new T.Mesh(new T.SphereGeometry(.26,10,6),new T.MeshStandardMaterial({color:0xcfb56e,roughness:1,flatShading:true}));hay.scale.y=.45;hay.position.set(S-.45,.06,-S+.4);sc.add(hay);
  var geo=new T.BufferGeometry(),V=new Float32Array(HORSE.n*3);HORSE.lerp(.99,V);geo.setAttribute('position',new T.BufferAttribute(V,3));geo.setIndex(Array.prototype.slice.call(HORSE.idx));geo.computeVertexNormals();
  var horse=new T.Mesh(geo,new T.MeshStandardMaterial({color:0x3b2415,roughness:.62,metalness:.05,side:T.DoubleSide}));var grp=new T.Group();grp.add(horse);
  var rug=null;grp.rotation.y=2.2;grp.position.set(-.12,0,-.18);sc.add(grp);
  var sh=new T.Mesh(new T.CircleGeometry(.5,32),new T.MeshBasicMaterial({color:0x000000,transparent:true,opacity:.32}));sh.rotation.x=-Math.PI/2;sh.position.set(-.12,.004,-.18);sh.scale.set(.7,1.25,1);sh.rotation.z=2.2;sc.add(sh);
  sc.add(new T.AmbientLight(0xffe6c4,.42));var lamp=new T.PointLight(0xffd29a,1.25,6,1.6);lamp.position.set(.3,1.7,.3);sc.add(lamp);
  var dl=new T.DirectionalLight(0xbfd4ff,.55);dl.position.set(-2,1.4,-.4);sc.add(dl);
  var alive=true,t0=performance.now(),n=0;
  var ro=new ResizeObserver(function(){W=box.clientWidth;H=box.clientHeight;if(!W||!H)return;ren.setSize(W,H,false);cam.aspect=W/H;cam.updateProjectionMatrix();ren.render(sc,cam)});ro.observe(box);
  function frame(now){if(!alive)return;if(!box.isConnected){alive=false;ro.disconnect();clearInterval(iv);geo.dispose();ren.dispose();try{ren.forceContextLoss()}catch(e){}return}
    n++;if(n%3===0||n<4){var t=(now-t0)/1000;if(!P.RM){HORSE.lerp(.99+Math.sin(t*.45)*.012,V);geo.attributes.position.needsUpdate=true;if(n%9===0)geo.computeVertexNormals();grp.rotation.y=2.2+Math.sin(t*.16)*.22;sh.rotation.z=grp.rotation.y;lamp.intensity=1.25+Math.sin(t*7)*.012}ren.render(sc,cam)}
    requestAnimationFrame(frame)}
  requestAnimationFrame(frame)}

/* ---------- Petites briques communes ---------- */
function spin(btn,done,label){btn.classList.add('ad-spinbtn','busy');setTimeout(function(){btn.classList.remove('busy');btn.classList.add('done');btn.innerHTML='<svg class="i" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>'+(label?'<span>'+label+'</span>':'');setTimeout(done,P.RM?50:520)},P.RM?50:720)}
function success(sh,o){var b=$('.sb',sh),f=$('.sf',sh);
  b.innerHTML='<div class="ad-ok"><div class="ad-okc"><svg viewBox="0 0 80 80"><circle class="r" cx="40" cy="40" r="34"/><path class="k" d="M26 41l10 10 19-21"/></svg><span class="strass s1"></span><span class="strass s2"></span><span class="strass s3"></span></div><h3>'+o.title+'</h3><p>'+o.text+'</p>'+
   (o.rows?'<div class="ad-ticket"><div class="tk1">'+(o.head||'')+'</div><div class="tk2">'+o.rows.map(function(r){return '<div><div class="k">'+r[0]+'</div><div class="v">'+r[1]+'</div></div>'}).join('')+'</div></div>':'')+'</div>';
  b.scrollTop=0;if(!f){f=document.createElement('div');f.className='sf';sh.appendChild(f)}
  f.innerHTML=(o.more?'<button class="btn ad-full" data-more2>'+o.more[0]+'</button>':'')+'<button class="btn pri ad-full" data-done>Terminé</button>';
  $('[data-done]',f).onclick=function(){sh.close()};if(o.more)$('[data-more2]',f).onclick=function(){o.more[1](sh)}}
function opts(list,sel,name){return '<div class="stack" style="--g:8px" role="radiogroup" data-rg="'+name+'">'+list.map(function(x){return '<button class="ad-opt" role="radio" aria-checked="'+(x[0]===sel)+'" data-v="'+x[0]+'"'+(x[4]?' disabled':'')+'><span class="rd"></span>'+(x[3]||'')+'<span class="grow"><span class="t b" style="display:block;font-size:13.5px">'+x[1]+'</span>'+(x[2]?'<span class="s mut" style="display:block">'+x[2]+'</span>':'')+'</span></button>'}).join('')+'</div>'}
function bindOpts(root,cb){$$('[data-rg]',root).forEach(function(g){g.onclick=function(e){var b=e.target.closest('.ad-opt');if(!b)return;$$('.ad-opt',g).forEach(function(x){x.setAttribute('aria-checked',x===b)});if(cb)cb(g.getAttribute('data-rg'),b.getAttribute('data-v'))}})}
function optVal(root,name){var b=$('[data-rg="'+name+'"] .ad-opt[aria-checked="true"]',root);return b?b.getAttribute('data-v'):null}
function DWL(i){return ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'][dowOff(i)]}
function ringSVG(pct,size,sw,col,center){var r=(size-sw)/2,c=2*Math.PI*r,o=c*(1-Math.min(100,pct)/100);
  return '<span class="ad-rg" style="width:'+size+'px;height:'+size+'px;color:'+col+'"><svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'" aria-hidden="true"><circle class="tr" cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" stroke-width="'+sw+'"/><circle class="vl" cx="'+size/2+'" cy="'+size/2+'" r="'+r+'" stroke-width="'+sw+'" stroke="'+col+'" stroke-dasharray="'+c.toFixed(1)+'" style="--o:'+o.toFixed(1)+';--c0:'+c.toFixed(1)+'"/></svg><span class="ct"><span>'+center+'</span></span></span>'}
function rings(list,size){var sw=Math.round(size*.085),gap=Math.round(sw*.35),c=size/2,out='';
  list.forEach(function(x,i){var r=c-sw/2-i*(sw+gap),L=2*Math.PI*r,o=L*(1-Math.min(100,x.p)/100);out+='<circle class="tr" cx="'+c+'" cy="'+c+'" r="'+r.toFixed(1)+'" stroke-width="'+sw+'" style="stroke:'+x.c+'"/><circle class="vl" cx="'+c+'" cy="'+c+'" r="'+r.toFixed(1)+'" stroke-width="'+sw+'" stroke="'+x.c+'" stroke-dasharray="'+L.toFixed(1)+'" style="--o:'+o.toFixed(1)+';--c0:'+L.toFixed(1)+';animation-delay:'+(.15+i*.15)+'s"/>'});
  return '<span class="ad-rg ad-rgs" style="width:'+size+'px;height:'+size+'px"><svg width="'+size+'" height="'+size+'" viewBox="0 0 '+size+' '+size+'" aria-hidden="true">'+out+'</svg></span>'}
function profPill(){var p=prof();return '<button class="ad-pill" data-prof title="Changer de profil familial">'+U.av(p)+'<span>'+p.first+'</span>'+ICON('down')+'</button>'}
function bindProf(el){var b=$('[data-prof]',el);if(!b)return;b.onclick=function(){var cur=prof().id;
  var sh=P.sheet({title:'Famille Martin',icon:'family',body:'<p class="s mut" style="margin-bottom:14px">Un seul compte pour toute la famille. Choisissez le cavalier dont vous voulez voir le planning, la progression et les documents.</p>'+
    opts(D.adhFamily.map(function(f){return [f.id,f.first+' '+f.last,(f.minor?f.role+' · ':'')+'Galop '+f.galop+' · licence '+f.lic,U.av(f)]}),cur,'prof')+
    '<button class="btn block" style="margin-top:12px" data-addf>'+ICON('plus','sm')+'Ajouter un membre de la famille</button>'});
  bindOpts(sh,function(n,v){P.prefs.set('adh:profile',v);sh.close();P.rerender();var f=prof();P.toast(f.minor?'Vous voyez l’espace de '+f.first+' en tant que parent':'Vous voyez votre espace',{icon:f.minor?'child':'user'})});
  $('[data-addf]',sh).onclick=function(){sh.close();P.go('adh-profil',{tab:'famille'})}}}
function payMethods(amount,extra){return (extra||[]).concat([['cb','Carte Visa se terminant par 4242','Paiement immédiat et sécurisé',sq('card')],['sepa','Prélèvement SEPA','Compte FR76 •••• 1234, débité sous 2 jours',sq('bank')]])}

/* =====================================================================
   1. ACCUEIL personnalisable
   ===================================================================== */
P.css(`
/* Accueil façon app premium : grille de tuiles (widgets) teintées par domaine */
.ad-home{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;grid-auto-flow:dense}
.ad-home>.w1{grid-column:span 1}.ad-home>.w2{grid-column:span 2}.ad-home>.w3,.ad-home>.w4{grid-column:1/-1}
@container main (max-width:1100px){.ad-home{grid-template-columns:repeat(2,minmax(0,1fr))}.ad-home>.w2{grid-column:1/-1}}
@container main (max-width:620px){.ad-home{gap:12px}.ad-home>.pw2{grid-column:1/-1}}
.ad-t{padding:20px;display:flex;flex-direction:column;gap:14px;min-width:0;position:relative;overflow:hidden;transition:transform var(--t-2) var(--e-out),box-shadow var(--t-2)}
.ad-t[data-go]{cursor:pointer}
.ad-t[data-go]:hover{transform:translateY(-3px);box-shadow:var(--shadow-2)}
.ad-t[data-go]:active{transform:scale(.98)}
.ad-tt{display:flex;align-items:center;gap:10px;min-width:0}
.ad-tt h3{font-size:17px;flex:1;min-width:0}
.ad-tt .lk{display:inline-flex;align-items:center;gap:4px;font-weight:600;font-size:14px;color:inherit;opacity:.8;height:40px;padding:0 4px;border-radius:12px}
.ad-tt .lk:hover{opacity:1}
.ad-t .sub{font-size:14.5px;line-height:1.45}
.ad-t .big{font-size:48px}
.ad-t .big small{font-size:22px;margin-left:4px;letter-spacing:-.02em;opacity:.75}
.ad-t .end{margin-top:auto}
.ad-t .illu.corner{position:absolute;right:-6px;top:-4px;width:108px;height:108px;pointer-events:none}
.ad-t.has-illu .ad-tt{padding-right:84px}
@container main (max-width:620px){.ad-t{padding:18px;gap:12px}.ad-t .big{font-size:42px}.ad-t .illu.corner{width:92px;height:92px}}
.ad-t.sq .big{font-size:40px}
.ad-t.tint .ico{background:color-mix(in srgb,var(--surface) 72%,transparent)}
.ad-t svg.spark{height:52px;width:100%;display:block}
.ad-ng .v{line-height:1.25}
@container main (max-width:620px){.ad-pgr{flex-direction:column;align-items:flex-start}.ad-pgr .ad-rg{width:72px!important;height:72px!important}.ad-pgr .ad-rg svg{width:72px;height:72px}}
@container main (max-width:620px){.ad-t.sq{min-height:196px}.ad-t.sq .big{font-size:34px}.ad-t.sq .ad-tt h3{font-size:15px}}
/* raccourcis : pastilles façon icônes d'app */
.ad-quick{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.ad-q{display:flex;align-items:center;gap:14px;padding:14px 16px;border-radius:var(--r-lg);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);text-align:left;transition:transform var(--t-2) var(--e-out),box-shadow var(--t-2);min-width:0;min-height:72px}
.ad-q:hover{transform:translateY(-2px);box-shadow:inset 0 0 0 1px var(--line-2),var(--shadow-2)}
.ad-q:active{transform:scale(.96)}
.ad-q .ico{width:46px;height:46px;border-radius:15px;position:relative}
.ad-q .ico em{position:absolute;top:-6px;right:-6px;min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:var(--bad);color:var(--on-acc);font:700 13px/22px var(--f-text);text-align:center;box-shadow:0 0 0 2.5px var(--surface)}
.ad-q b{display:block;font-size:15px}.ad-q small{display:block;font-size:13px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@container main (max-width:620px){.ad-quick{gap:4px}.ad-q{flex-direction:column;gap:8px;padding:2px 0;min-height:0;background:none;box-shadow:none;text-align:center}.ad-q:hover{transform:none;box-shadow:none}.ad-q .ico{width:62px;height:62px;border-radius:20px}.ad-q .ico svg.i{width:26px;height:26px}.ad-q small{display:none}.ad-q b{font-size:13px;font-weight:600}}
/* tuile « prochaine séance » (héros) */
.ad-next{padding:24px;overflow:hidden;display:flex;flex-direction:column;gap:16px}
.ad-next .glow{position:absolute;right:-70px;top:-80px;width:280px;height:280px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--acc) 55%,transparent),transparent 65%);pointer-events:none;animation:ad-glow 6s ease-in-out infinite alternate}
@keyframes ad-glow{to{transform:translate(-30px,24px) scale(1.15)}}
.ad-next .eyebrow{color:color-mix(in srgb,var(--navy-ink) 62%,var(--acc))}
.ad-next h2{font-size:34px;line-height:1.02;letter-spacing:-.04em;color:var(--navy-ink)}
.ad-next .wh{font-size:15.5px;font-weight:500;color:color-mix(in srgb,var(--navy-ink) 80%,transparent);margin-top:8px}
.ad-cd{white-space:nowrap;display:inline-flex;align-items:center;gap:6px;height:32px;padding:0 12px;border-radius:99px;background:color-mix(in srgb,var(--navy-ink) 14%,transparent);font-size:14px;font-weight:600;color:var(--navy-ink);position:relative}
.ad-cd svg.i{width:18px;height:18px}
.ad-ng{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.ad-ng>div{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:var(--r-md);background:color-mix(in srgb,var(--navy-ink) 8%,transparent);min-width:0}
.ad-ng .k{font-size:13px;color:color-mix(in srgb,var(--navy-ink) 64%,transparent);font-weight:600}
.ad-ng .v{font-weight:600;font-size:15px;color:var(--navy-ink)}
.ad-ng .wi{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:color-mix(in srgb,var(--navy-ink) 12%,transparent);color:color-mix(in srgb,var(--navy-ink) 62%,var(--acc));flex:none}
.ad-th{display:flex;flex-direction:column;gap:4px;font-size:15px;line-height:1.5;color:color-mix(in srgb,var(--navy-ink) 86%,transparent);max-width:62ch}
.ad-th .k{font-size:13px;color:color-mix(in srgb,var(--navy-ink) 62%,transparent);font-weight:600;letter-spacing:.04em;text-transform:uppercase}
.ad-next .avs .av{box-shadow:0 0 0 2px var(--navy)}
@container main (max-width:620px){.ad-ph.ad-ph .ph.ph{flex-direction:column;align-items:stretch;gap:12px}.ad-ph .ph .sub{margin-top:0}.ad-ph .ph .acts{justify-content:space-between}.ad-ph .ph .acts>:only-child{margin-right:auto}.ad-filt{flex-basis:100%}}
.ad-nb{background:color-mix(in srgb,var(--navy-ink) 12%,transparent)!important;color:var(--navy-ink)!important;box-shadow:none!important}
.ad-nb.on{background:var(--navy-ink)!important;color:var(--navy)!important}
@container main (max-width:620px){.ad-next{padding:20px}.ad-next h2{font-size:29px}.ad-ng{grid-template-columns:minmax(0,1fr);gap:0;border-radius:var(--r-md);background:color-mix(in srgb,var(--navy-ink) 8%,transparent)}.ad-ng>div{background:none;border-radius:0}.ad-ng>div+div{box-shadow:inset 0 1px 0 color-mix(in srgb,var(--navy-ink) 10%,transparent)}.ad-next .acts .btn{flex:1;height:46px}}
/* tuile cheval en direct */
.ad-t .ad-cam{border-radius:18px}
.ad-camw{position:relative}
.ad-camw .nm{position:absolute;left:12px;bottom:12px;z-index:3;color:#fff;font:800 22px/1 var(--f-display);letter-spacing:-.03em;text-shadow:0 2px 12px rgba(0,0,0,.5)}
/* tuile progression : anneau */
.ad-rg{position:relative;display:grid;place-items:center;flex:none}
.ad-rg svg{display:block;transform:rotate(-90deg)}
.ad-rg .tr{fill:none;stroke:color-mix(in srgb,currentColor 14%,transparent)}
.ad-rg .vl{fill:none;stroke-linecap:round;stroke-dashoffset:var(--o);animation:ad-ring 1.2s var(--e-out) .15s both}
@keyframes ad-ring{from{stroke-dashoffset:var(--c0)}}
.ad-rg .ct{position:absolute;inset:0;display:grid;place-items:center;text-align:center;line-height:1}
.ad-rg .ct b{font:800 26px/1 var(--f-display);letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.ad-rg .ct small{display:block;font-size:13px;font-weight:600;opacity:.75;margin-top:3px}
/* météo */
.ad-wx{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:4px;text-align:center}
.ad-wx div{display:flex;flex-direction:column;align-items:center;gap:6px;padding:10px 0;border-radius:14px;font-size:13px;font-weight:600;min-width:0}
.ad-wx div.on{background:color-mix(in srgb,var(--surface) 70%,transparent)}
.ad-wx div.rn{background:color-mix(in srgb,var(--d,var(--acc)) 18%,transparent)}
.ad-wx b{font-size:15px}
.ad-wx svg.i{width:22px;height:22px}
.ad-news{display:flex;gap:14px;align-items:flex-start;padding:14px 20px;cursor:pointer;transition:background var(--t-1);position:relative;min-height:64px}
.ad-news+.ad-news::before{content:"";position:absolute;left:20px;right:20px;top:0;height:1px;background:var(--line)}
.ad-news:hover{background:var(--surface-2)}
.ad-news .t{font-weight:600;font-size:15px;line-height:1.35}
.ad-signers{display:flex;flex-direction:column;gap:10px}
.ad-ed{display:flex;align-items:center;gap:10px;padding:10px 12px 10px 4px;background:var(--surface);border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line);min-height:64px;transition:box-shadow var(--t-2),opacity var(--t-2),transform var(--t-2) var(--e-out)}
.ad-ed.off .grow,.ad-ed.off .av,.ad-ed.off .ico{opacity:.45}
.ad-ed.drag{box-shadow:inset 0 0 0 2px var(--acc),var(--shadow-3);transform:scale(1.02);z-index:2;position:relative}
.ad-ed .grip{width:32px;height:44px;display:grid;place-items:center;color:var(--mut-2);cursor:grab;touch-action:none;flex:none}
.ad-ed .mv{display:flex;gap:2px}
.ad-ed .mv .btn{width:40px;height:40px}
`);

var BLOCKS=[
 ['quick','Raccourcis','Vos quatre actions les plus fréquentes','bolt'],
 ['next','Prochaine reprise','Heure, moniteur, cheval attribué et météo','planning'],
 ['horse','Mon cheval en direct','Caméra du box et nouvelles du jour','camera'],
 ['money','Solde et prochaine échéance','Ce qu’il reste à régler','wallet'],
 ['sign','Documents à signer','Contrats et autorisations en attente','sign'],
 ['compet','Mon prochain concours','Horaire de passage et transport','trophy'],
 ['progress','Ma progression','Heures en selle et objectifs','trend'],
 ['weather','Météo du club','Prévisions et état des carrières','sun'],
 ['news','Annonces du club','Les nouvelles de l’écurie','bell']];
function blocks(){var def=BLOCKS.map(function(b){return {id:b[0],on:true}}),sv=P.prefs.get('adh:blocks',null);if(!sv)return def;
  var out=sv.filter(function(s){return BLOCKS.some(function(b){return b[0]===s.id})});def.forEach(function(d){if(!out.some(function(s){return s.id===d.id}))out.push(d)});return out}

function absenceSheet(r){var l=lesson(r.les),p=prof();
  var sh=P.sheet({title:'Signaler une absence',icon:'calendar_add',body:'<div class="card soft" style="padding:14px"><div class="b">'+l.title+'</div><div class="s mut">'+dayL(r.off)+' · '+l.start+' – '+endT(l)+' · '+D.name(l.coach)+'</div></div>'+
    '<div class="ad-lbl">Motif (facultatif)</div><div class="hrow wrap" style="--g:6px">'+['Maladie','Empêchement','Cheval indisponible','Vacances'].map(function(t){return '<button class="tag" aria-pressed="false">'+t+'</button>'}).join('')+'</div>'+
    '<div class="note ok" style="margin-top:16px">'+ICON('ticket','sm')+'<span>Vous prévenez plus de 24 heures avant : <b>un crédit de rattrapage</b> est ajouté à votre compte, valable 60 jours. Votre place est proposée à la liste d’attente.</span></div>',
    foot:'<button class="btn ad-full" data-no>Garder ma place</button><button class="btn pri ad-full" data-yes>Confirmer mon absence</button>'});
  $('[data-no]',sh).onclick=function(){sh.close()};
  $('[data-yes]',sh).onclick=function(){var i=A.res.indexOf(r);A.res.splice(i,1);A.credits++;sh.close();P.rerender();P.toast('Absence enregistrée, 1 crédit de rattrapage ajouté',{icon:'ticket',undo:function(){A.res.splice(i,0,r);A.credits--;P.rerender()}})}}
function lessonSheet(r){var l=lesson(r.les),p=D.adhFamily.find(function(f){return f.id===r.who}),h=r.horse&&D.horse(r.horse),w=D.weather[Math.min(6,r.off)];
  var sh=P.sheet({title:l.title,icon:'planning',body:'<div class="stack" style="--g:14px"><div class="card soft" style="padding:14px"><div class="ad-sum"><span class="mut">Quand</span><b>'+dayL(r.off)+', '+l.start+' – '+endT(l)+'</b></div><div class="ad-sum"><span class="mut">Où</span><b>'+arena(l)+'</b></div><div class="ad-sum"><span class="mut">Avec</span><b>'+D.name(l.coach)+'</b></div><div class="ad-sum"><span class="mut">Cheval</span><b>'+(h?h.name:'Attribué la veille à 18 h')+'</b></div><div class="ad-sum"><span class="mut">Règlement</span><b>'+r.pay+'</b></div></div>'+
    '<div><div class="ad-lbl">Thème de la séance</div><p class="s" style="color:var(--ink-2)">'+(p.id==='lea'?'Enchaînement de huit obstacles à 1,10 m, travail des courbes et du contrat de foulées en vue de Rambouillet dimanche.':'Trot enlevé sur le bon diagonal, premiers départs au galop sur le cercle, slalom entre les cônes.')+'</p></div>'+
    '<div><div class="ad-lbl">Avec vous dans la reprise</div><div class="hrow" style="--g:10px">'+U.avs(l.riders,6)+'<span class="s mut">'+count(l)+' cavaliers sur '+l.cap+'</span></div></div>'+
    '<div class="note">'+ICON(w.i,'sm')+'<span>'+w.t+' °C prévus, '+(w.r>50?'pluie probable : la séance passe au Grand manège.':'terrain souple. Pensez aux guêtres.')+'</span></div></div>',
    foot:'<button class="btn ad-full" data-abs>Signaler une absence</button><button class="btn pri ad-full" data-cal>'+ICON('calendar_add','sm')+'Ajouter à mon agenda</button>'});
  $('[data-abs]',sh).onclick=function(){absenceSheet(r)};$('[data-cal]',sh).onclick=function(){sh.close();P.toast('Séance ajoutée à votre agenda')}}

function editHome(){var list=blocks();
  var sh=P.sheet({title:'Personnaliser l’accueil',icon:'sliders',body:function(b){
    b.innerHTML='<p class="s mut" style="margin-bottom:14px">Activez les blocs qui vous servent et glissez-les dans l’ordre que vous préférez. Les changements s’appliquent tout de suite, sur tous vos appareils.</p><div class="stack ad-edl" style="--g:8px"></div>';draw()},
    foot:'<button class="btn ghost" data-reset>'+ICON('refresh','sm')+'Rétablir</button><button class="btn pri ad-full" data-done>Terminé</button>'});
  function save(msg){P.prefs.set('adh:blocks',list);P.rerender()}
  function draw(){var box=$('.ad-edl',sh);box.innerHTML=list.map(function(s,i){var b=BLOCKS.find(function(x){return x[0]===s.id});
    return '<div class="ad-ed'+(s.on?'':' off')+'" data-b="'+s.id+'"><span class="grip" title="Glisser pour déplacer">'+GRIP+'</span>'+sq(b[3])+'<div class="grow"><div class="b s">'+b[1]+'</div><div class="xs mut ellip">'+b[2]+'</div></div><span class="mv"><button class="btn ghost icon sm" data-up title="Monter"'+(i===0?' disabled':'')+'>'+ICON('up','sm')+'</button><button class="btn ghost icon sm" data-dn title="Descendre"'+(i===list.length-1?' disabled':'')+'>'+ICON('down','sm')+'</button></span>'+U.tog(s.on)+'</div>'}).join('');
    $$('.ad-ed',box).forEach(function(row,i){
      $('.tog',row).addEventListener('click',function(){list[i].on=!list[i].on;row.classList.toggle('off',!list[i].on);save()});
      $('[data-up]',row).onclick=function(){list.splice(i-1,0,list.splice(i,1)[0]);draw();save()};
      $('[data-dn]',row).onclick=function(){list.splice(i+1,0,list.splice(i,1)[0]);draw();save()};
      var g=$('.grip',row);g.onpointerdown=function(e){e.preventDefault();g.setPointerCapture(e.pointerId);row.classList.add('drag');
        g.onpointermove=function(ev){var rows=$$('.ad-ed',box),me=rows.indexOf(row);for(var k=0;k<rows.length;k++){if(rows[k]===row)continue;var rc=rows[k].getBoundingClientRect(),mid=rc.top+rc.height/2;
          if(k<me&&ev.clientY<mid){box.insertBefore(row,rows[k]);break}if(k>me&&ev.clientY>mid){box.insertBefore(row,rows[k].nextSibling)}}};
        g.onpointerup=function(){g.onpointermove=g.onpointerup=null;row.classList.remove('drag');var ids=$$('.ad-ed',box).map(function(x){return x.getAttribute('data-b')});list.sort(function(a,b){return ids.indexOf(a.id)-ids.indexOf(b.id)});draw();save()}}})}
  $('[data-done]',sh).onclick=function(){sh.close();P.toast('Accueil enregistré')};
  $('[data-reset]',sh).onclick=function(){list=BLOCKS.map(function(b){return {id:b[0],on:true}});draw();save();P.toast('Disposition par défaut rétablie',{icon:'refresh'})}}

P.mod({id:'adh-accueil',role:'adherent',group:'Moi',title:'Accueil',icon:'today',n:10,short:'Accueil',phoneTitle:'Bonjour Léa',
 render:function(el,ctx){var p=prof(),kid=isKid(),rs=resFor(p),r=rs[0],l=r&&lesson(r.les),h=r&&r.horse&&D.horse(r.horse),ts=toSign(),dueV=due(),k1=D.competitions[0];
  var B={};
  function ico(i,d){return '<span class="ico d-'+d+'">'+ICON(i)+'</span>'}
  function lk(go,txt,extra){return '<button class="lk" data-go="'+go+'"'+(extra||'')+'>'+(txt||'')+ICON('arrow','sm')+'</button>'}
  B.quick='<div class="ad-quick w4" data-b="quick">'+[['adh-reserver','calendar_add','Réserver','Reprise, stage, cours',0,'','cavaliers'],['adh-reserver','ticket','Rattraper',A.credits+' crédit'+(A.credits>1?'s':'')+' à utiliser',0,'rattrapage','acc'],['adh-paiements','card','Payer',dueV?F.eur(dueV)+' à régler':'Tout est réglé',0,'','argent'],['adh-messages','chat','Messages','2 conversations non lues',2,'','equipe']].map(function(q){
    return '<button class="ad-q" data-go="'+q[0]+'"'+(q[5]?' data-p-mode="'+q[5]+'"':'')+'><span class="ico d-'+q[6]+'">'+ICON(q[1])+(q[4]?'<em>'+q[4]+'</em>':'')+'</span><span class="grow" style="min-width:0"><b>'+q[2]+'</b><small>'+q[3]+'</small></span></button>'}).join('')+'</div>';
  var cToday=!kid&&A.coachRes.some(function(c){return c.id==='c01'&&c.w==='auj.'});
  if(cToday){var w0=D.weather[0],mn=minsTo(COURS.start);
   B.next='<div class="card navy ad-next w2" data-b="next"><div class="glow"></div><div class="hrow sp" style="position:relative"><span class="eyebrow">Aujourd’hui</span><span class="ad-cd">'+ICON('clock','sm')+'Dans '+dur(mn)+'</span></div>'+
    '<div style="position:relative"><h2>'+COURS.title+'</h2><div class="wh">'+COURS.start.replace(':',' h ')+' à '+hm(endT(COURS))+' · '+arena(COURS)+'</div></div>'+
    '<div class="ad-ng"><div>'+U.hav(UL)+'<div class="grow" style="min-width:0"><div class="k">Cheval</div><div class="v">'+UL.name+'</div></div></div>'+
    '<div>'+U.av('c01')+'<div class="grow" style="min-width:0"><div class="k">Coach CSO</div><div class="v">Pauline Arnaud</div></div></div>'+
    '<div><span class="wi">'+ICON(w0.i)+'</span><div class="grow" style="min-width:0"><div class="k">Météo</div><div class="v">'+w0.t+' °C, '+(w0.r>50?'pluie':w0.r>15?'nuageux':'temps sec')+'</div></div></div></div>'+
    '<div class="ad-th"><span class="k">Objectif de la séance</span><span>Abords et contrat de foulées en ligne courbe, puis le triple de Rambouillet monté à 1,10 m. La carrière d’honneur vous est réservée jusqu’à '+hm(endT(COURS))+'.</span></div>'+
    '<div class="hrow wrap acts" style="--g:8px;margin-top:auto"><button class="btn ad-nb on" data-coursc>Voir la séance</button><button class="btn ad-nb" data-go="adh-messages" data-id="t-coach">'+ICON('chat','sm')+'Écrire à Pauline</button>'+(l?'<button class="btn ad-nb hide-s" data-les>Reprise suivante : '+dayL(r.off).toLowerCase()+' à '+hm(l.start)+'</button>':'')+'</div></div>'}
  else if(l){var w=D.weather[Math.min(6,r.off)],hrs=Math.round(r.off*24+(+l.start.slice(0,2))+(+l.start.slice(3,5))/60-9.68);
   B.next='<div class="card navy ad-next w2" data-b="next"><div class="glow"></div><div class="hrow sp" style="position:relative"><span class="eyebrow">Prochaine reprise'+(kid?' de '+p.first:'')+'</span><span class="ad-cd">'+ICON('clock','sm')+(r.off===0?'Dans '+hrs+' h':r.off===1?'Demain, dans '+hrs+' h':'Dans '+r.off+' jours')+'</span></div>'+
    '<div style="position:relative"><h2>'+l.title+'</h2><div class="wh">'+cap(F.dateL(D.day(r.off)))+' · '+hm(l.start)+' à '+hm(endT(l))+' · '+arena(l)+'</div></div>'+
    '<div class="ad-ng"><div>'+(h?U.hav(h):'<span class="wi">'+ICON('horse')+'</span>')+'<div class="grow" style="min-width:0"><div class="k">'+(kid?'Poney attribué':'Cheval')+'</div><div class="v ellip">'+(h?h.name:'Attribué la veille')+'</div></div>'+(kid&&h?'<span class="chip acc">Nouveau</span>':'')+'</div>'+
    '<div>'+U.av(l.coach)+'<div class="grow" style="min-width:0"><div class="k">'+(D.staffer(l.coach).role)+'</div><div class="v ellip">'+D.name(l.coach)+'</div></div></div>'+
    '<div><span class="wi">'+ICON(w.i)+'</span><div class="grow" style="min-width:0"><div class="k">Météo</div><div class="v">'+w.t+' °C, '+(w.r>50?'pluie':w.r>15?'nuageux':'temps sec')+'</div></div></div></div>'+
    '<div class="ad-th"><span class="k">Thème de la séance</span><span>'+(kid?'Trot enlevé sur le bon diagonal et premiers départs au galop sur le cercle.':'Enchaînement de huit obstacles à 1,10 m et contrat de foulées, en vue de Rambouillet dimanche.')+'</span><span class="hrow" style="--g:8px;margin-top:8px">'+U.avs(l.riders,5)+'<span class="s" style="opacity:.8">'+count(l)+' cavaliers sur '+l.cap+'</span></span></div>'+
    '<div class="hrow wrap acts" style="--g:8px;margin-top:auto"><button class="btn ad-nb on" data-les>Voir la séance</button><button class="btn ad-nb" data-abs>Signaler une absence</button><button class="btn ad-nb hide-s" data-go="adh-reserver">Toutes mes réservations'+ICON('arrow','sm')+'</button></div></div>'}
  else B.next='<div class="card w2" data-b="next">'+U.empty('planning','Aucune reprise réservée','Choisissez un créneau, il reste des places cette semaine.','<button class="btn pri" data-go="adh-reserver">Réserver une reprise</button>')+'</div>';
  if(!kid)B.horse='<div class="card tint d-chevaux ad-t w2" data-b="horse"><div class="ad-tt">'+ico('horse','chevaux')+'<h3>'+UL.name.split(' ')[0]+' en direct</h3>'+lk('adh-cheval','Sa fiche')+'</div><div class="ad-camw"><div data-cam data-go="adh-cheval" style="cursor:pointer"></div></div>'+
    '<div class="ad-row"><span class="sub grow"><b>Au box B01, calme.</b> A tout mangé ce matin, cours avec Pauline à '+hm(COURS.start)+'.</span></div>'+
    '<div class="hrow wrap end" style="--g:8px">'+U.chip(ICON('hoof','sm')+'Ferrure jeudi à 9 h','warn')+U.chip(ICON('layers','sm')+'Couverture 150 g','d')+U.chip(ICON('heart','sm')+'En forme','ok')+'</div></div>';
  B.money='<div class="card tint d-argent ad-t has-illu w1 pw2" data-b="money">'+ILLU.pieces({size:null,cls:'corner'})+'<div class="ad-tt">'+ico('wallet','argent')+'<h3>'+(dueV?'À régler':'Solde')+'</h3></div>'+
    (dueV?'<div><div class="big num"><span data-count="'+dueV+'" data-fmt="eur">'+F.eur(dueV)+'</span></div><div class="sub" style="margin-top:8px">dont la pension de novembre, échue depuis 2 jours. Les 180 € de demi-pension sont déjà déduits.</div></div>':
     '<div><div class="big num">0 €</div><div class="sub" style="margin-top:8px">Tout est réglé. Merci Léa.</div></div>')+
    '<div class="hrow s" style="--g:8px;opacity:.85">'+ICON('calendar_add','sm')+'<span>1er décembre : 340 € prélevés</span></div>'+
    (dueV?'<div class="hrow end" style="--g:8px"><button class="btn pri grow" data-go="adh-paiements" data-p-pay="1">'+ICON('card','sm')+'Payer '+F.eur(dueV)+'</button><button class="btn icon" data-go="adh-paiements" title="Voir le détail des factures">'+ICON('arrow','sm')+'</button></div>':'<button class="btn block end" data-go="adh-paiements">Voir mes factures</button>')+'</div>';
  B.sign='<div class="card ad-t w1 pw2" data-b="sign"><div class="ad-tt">'+ico('sign','plateforme')+'<h3>À signer</h3>'+(ts.length?'<span class="chip acc lg">'+ts.length+'</span>':'<span class="chip ok dot">À jour</span>')+'</div>'+
    (ts.length?'<div><div class="b" style="font-size:15.5px;line-height:1.3">'+ts[0].title+'</div><div class="s mut" style="margin-top:4px">'+ts[0].sub+'</div></div>'+
     '<div class="ad-signers">'+ts[0].signers.map(function(s){var ok=ts[0].signed.indexOf(s)>=0,me=s==='m001';return '<div class="hrow" style="--g:10px">'+U.av(s,'sm')+'<span class="grow ellip s b">'+(me?'Vous':D.name(s).split(' ')[0])+'</span>'+(ok?'<span class="chip ok">'+ICON('check','sm')+'Signé</span>':'<span class="chip line">En attente</span>')+'</div>'}).join('')+'</div>'+
     (ts.length>1?'<div class="s mut">et '+(ts.length-1)+' autre'+(ts.length>2?'s':'')+' document'+(ts.length>2?'s':'')+' en attente</div>':'')+
     '<button class="btn dark block end" data-go="adh-contrats" data-id="'+ts[0].id+'">'+ICON('sign','sm')+'Signer au doigt</button>':
     '<div class="ad-row">'+sq('checkc','ok')+'<div class="grow"><div class="t">Tous vos documents sont signés</div><div class="s">Retrouvez-les dans Contrats.</div></div></div><button class="btn block end" data-go="adh-contrats">Voir mes documents</button>')+'</div>';
  if(!kid)B.compet='<div class="card tint d-cavaliers ad-t sq w1" data-b="compet" data-go="adh-concours"><div class="ad-tt">'+ico('trophy','cavaliers')+'<h3>Dimanche</h3></div>'+
    '<div><div class="big num">'+RB.passage.replace(':',' h ')+'</div><div class="sub" style="margin-top:6px">Votre passage à Rambouillet, dans 5 jours</div><div class="hrow wrap" style="--g:6px;margin-top:10px"><span class="chip d">Dossard '+RB.bib+'</span><span class="chip d hide-s">'+RB.order+'</span></div></div>'+
    '<div class="hrow end s" style="--g:8px;opacity:.85">'+ICON('van','sm')+'<span>Départ du van à 7 h 15</span></div></div>';
  var pg=kid?{pct:68,l:'68 %',t:'Galop 3 en préparation',s:'11 compétences sur 16',sp:[1,1,2,1,1,2,1,1]}:{pct:73,l:'73 %',t:'8 h 45 en selle',s:'sur 12 heures en novembre',sp:[2.5,3,2,3.5,3,4,3.5,2.75]};
  B.progress='<div class="card tint d-acc ad-t sq w1" data-b="progress" data-go="adh-progression"><div class="ad-tt">'+ico('trend','acc')+'<h3>Progression</h3></div>'+
    '<div class="hrow ad-pgr" style="--g:14px">'+ringSVG(pg.pct,84,10,'var(--acc)','<b>'+pg.pct+'</b><small>%</small>')+'<div class="grow" style="min-width:0"><div class="b" style="font-size:16px;line-height:1.25">'+pg.t+'</div><div class="s mut" style="margin-top:4px">'+pg.s+'</div></div></div>'+
    '<div class="end">'+C.spark(pg.sp,'var(--acc)')+'<div class="s mut" style="margin-top:2px">'+(kid?'1 séance par semaine':'9 semaines d’affilée')+'</div></div></div>';
  var rainD=D.weather.findIndex(function(w,i){return i>0&&w.r>50});
  B.weather='<div class="card tint d-equipe ad-t w2" data-b="weather"><div class="ad-tt">'+ico(D.weather[0].i,'equipe')+'<h3>Météo du club</h3><span class="s" style="opacity:.8">Saint-Arnoult</span></div>'+
    '<div class="hrow" style="--g:14px;align-items:flex-end"><div class="big num">'+D.weather[0].t+'<small>°C</small></div><div class="sub" style="padding-bottom:6px">'+(D.weather[0].r>50?'Pluie attendue aujourd’hui':'Temps sec ce matin')+', '+D.weather[0].r+' % de risque de pluie</div></div>'+
    '<div class="ad-wx">'+D.weather.map(function(w,i){return '<div class="'+(i===0?'on':w.r>50?'rn':'')+'"><span>'+(i===0?'Auj.':w.d)+'</span>'+ICON(w.i)+'<b class="num">'+w.t+'°</b><span class="num" style="opacity:.75">'+w.r+' %</span></div>'}).join('')+'</div>'+
    '<div class="note end" style="background:color-mix(in srgb,var(--surface) 70%,transparent)">'+ICON('rain','sm')+'<span>Pluie '+(rainD>0?DWL(rainD):'jeudi')+' : '+(kid?'les reprises de poney restent au manège, rien ne change pour '+p.first+'.':'votre reprise de dressage passe au Grand manège. Rien à faire de votre côté.')+'</span></div></div>';
  B.news='<div class="card ad-t w2" data-b="news" style="padding:20px 0 8px"><div class="ad-tt" style="padding:0 20px">'+ico('bell','acc')+'<h3>Annonces du club</h3><span class="s mut">'+D.club.short+'</span></div><div>'+D.adhNews.map(function(n){return '<div class="ad-news" data-news="'+n.id+'"><span class="ico">'+ICON(n.icon)+'</span><div class="grow"><div class="t">'+n.title+'</div><div class="s mut" style="margin-top:4px">'+n.tag+' · '+n.when+'</div></div>'+ICON('right','sm')+'</div>'}).join('')+'</div></div>';

  var list=blocks().filter(function(s){return s.on&&B[s.id]});
  el.innerHTML='<div class="ad-ph">'+U.ph('Bonjour Léa',kid?'Vous suivez '+p.first+', 9 ans, Galop 2. Sa prochaine reprise est demain à 14 h.':'Mardi 17 novembre · Ulysse va bien, votre cours avec Pauline est aujourd’hui à '+hm(COURS.start)+'.',profPill()+'<button class="btn" data-edit>'+ICON('sliders','sm')+'Personnaliser</button>')+'</div>'+orgBanner()+(ctx.mobile&&!kid?lockHTML():'')+
   '<div class="ad-home rise">'+list.map(function(s){return B[s.id]}).join('')+'</div>'+
   (list.length<BLOCKS.length-(kid?2:0)?'<div class="hrow" style="justify-content:center;margin-top:18px"><button class="btn ghost sm" data-edit>'+ICON('plus','sm')+'Ajouter des blocs à mon accueil</button></div>':'');
  bindProf(el);bindOrg(el);$$('[data-edit]',el).forEach(function(b){b.onclick=editHome});
  var lv=$('#ad-live',el);if(lv)lv.addEventListener('click',function(){setTimeout(function(){var on=lv.getAttribute('aria-checked')==='true';P.prefs.set('adh:live',on);P.toast(on?'Activité en direct activée : le compte à rebours s’affichera sur votre écran verrouillé':'Activité en direct désactivée',{icon:'phone'})},0)});
  var cm=$('[data-cam]',el);if(cm)boxCam(cm);
  var bl=$('[data-les]',el);if(bl)bl.onclick=function(){lessonSheet(r)};var bc=$('[data-coursc]',el);if(bc)bc.onclick=coursSheet;var ba=$('[data-abs]',el);if(ba)ba.onclick=function(){absenceSheet(r)};
  $$('[data-news]',el).forEach(function(n){n.onclick=function(){var x=D.adhNews.find(function(y){return y.id===n.getAttribute('data-news')});
    var sh=P.sheet({title:x.tag,icon:x.icon,body:'<h3 style="font-size:20px;line-height:1.2;margin-bottom:8px">'+x.title+'</h3><div class="xs mut" style="margin-bottom:14px">Publié par Claire Dumont · '+x.when+'</div><p style="color:var(--ink-2);line-height:1.6">'+x.text+'</p>',foot:'<button class="btn pri ad-full" data-cta>'+x.cta+'</button>'});
    $('[data-cta]',sh).onclick=function(){sh.close();if(x.go)P.go(x.go);else P.toast(x.toast)}}});
 }});

/* =====================================================================
   2. RÉSERVER : reprises, rattrapages, stages, cours particuliers
   ===================================================================== */
P.css(`
.ad-rsv{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:18px;align-items:start}
@container main (max-width:980px){.ad-rsv{grid-template-columns:minmax(0,1fr)}}
.ad-wal{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:16px}
.ad-wt{display:flex;align-items:flex-start;gap:14px;padding:18px 20px;min-width:0;text-align:left;transition:transform var(--t-2) var(--e-out),box-shadow var(--t-2)}
.ad-wt:hover{transform:translateY(-2px);box-shadow:var(--shadow-2)}
.ad-wt:active{transform:scale(.97)}
.ad-wt .ico{background:color-mix(in srgb,var(--surface) 72%,transparent)}
.ad-wt .k{display:block;font-size:14px;font-weight:600;opacity:.8}
.ad-wt .n{display:block;font:800 40px/1 var(--f-display);letter-spacing:-.04em;margin-top:6px}
.ad-wt .n small{font-size:20px;opacity:.65;letter-spacing:-.02em}
.ad-wt .u{display:block;font-size:13.5px;opacity:.75;margin-top:4px}
.ad-punch{display:flex;gap:4px;margin-top:8px}
.ad-punch i{width:12px;height:12px;border-radius:50%;background:var(--d)}
.ad-punch i.u{background:transparent;box-shadow:inset 0 0 0 1.6px color-mix(in srgb,var(--d) 50%,transparent)}
@container main (max-width:620px){.ad-wal{display:flex;overflow-x:auto;scrollbar-width:none;margin:0 -16px 14px;padding:2px 16px;gap:10px;scroll-snap-type:x mandatory;scroll-padding-inline:16px}.ad-wal::-webkit-scrollbar{display:none}.ad-wt{flex:none;width:236px;scroll-snap-align:start;padding:16px 18px}.ad-wt .n{font-size:34px}}
.ad-day{width:60px!important;height:78px!important;border-radius:18px!important}
.ad-day .d{font-size:22px!important}
.ad-slot .ti{font-size:16px!important}
.ad-slot .tm{font-size:19px!important}
.ad-days{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px;margin:14px -2px 4px;scroll-snap-type:x proximity}
.ad-days::-webkit-scrollbar{display:none}
.ad-day{flex:none;width:54px;height:72px;border-radius:14px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);position:relative;scroll-snap-align:start;transition:background var(--t-2),color var(--t-2),transform var(--t-1) var(--e-out)}
.ad-day:active{transform:scale(.95)}
.ad-day .w{font-size:13px;font-weight:600;color:var(--mut);text-transform:capitalize}
.ad-day .d{font:800 19px/1 var(--f-display);letter-spacing:-.03em}
.ad-day .c{font-size:13px;color:var(--mut);font-weight:600}
.ad-day[aria-selected="true"]{background:var(--navy);box-shadow:var(--shadow-2);color:var(--navy-ink)}
.ad-day[aria-selected="true"] .w,.ad-day[aria-selected="true"] .c{color:color-mix(in srgb,var(--navy-ink) 65%,transparent)}
.ad-day.mine::after{content:"";position:absolute;top:6px;right:7px;width:7px;height:7px;border-radius:50%;background:var(--acc);box-shadow:0 0 0 2px var(--surface)}
.ad-day[aria-selected="true"].mine::after{box-shadow:0 0 0 2px var(--navy);background:var(--strass)}
.ad-slot{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:14px;align-items:center;padding:14px 16px;position:relative;animation:rise var(--t-3) var(--e-out) both;animation-delay:calc(var(--i,0)*35ms)}
.ad-slot+.ad-slot::before{content:"";position:absolute;left:16px;right:16px;top:0;height:1px;background:var(--line)}
.ad-slot .tm{font:800 16px/1.1 var(--f-display);letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.ad-slot .tm small{display:block;font:500 13px var(--f-text);color:var(--mut);margin-top:3px;letter-spacing:0}
.ad-slot .ti{font-weight:600;font-size:14.5px}
.ad-slot .me{display:flex;flex-wrap:wrap;gap:6px;margin-top:7px;align-items:center}
.ad-slot .rt{display:flex;flex-direction:column;align-items:flex-end;gap:6px}
.ad-slot .pr{font-weight:700;font-size:13.5px;font-variant-numeric:tabular-nums}
.ad-slot.dim{opacity:.5}
.ad-slot.mine{background:color-mix(in srgb,var(--ok-pale) 55%,transparent)}
.ad-slot .btn{min-width:104px;height:38px}
@container main (max-width:620px){.ad-slot{grid-template-columns:46px minmax(0,1fr);gap:10px 12px;padding:14px}.ad-slot .rt{grid-column:1/-1;flex-direction:row;align-items:center;justify-content:space-between;padding-left:58px}.ad-slot .btn{height:42px;min-width:132px}}
.ad-stg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
@container main (max-width:760px){.ad-stg{grid-template-columns:minmax(0,1fr)}}
.ad-st{padding:16px;display:flex;flex-direction:column;gap:12px}
.ad-date{width:52px;height:56px;border-radius:12px;background:var(--acc-pale);color:var(--acc);display:flex;flex-direction:column;align-items:center;justify-content:center;flex:none}
.ad-date b{font:800 20px/1 var(--f-display);letter-spacing:-.03em}
.ad-date span{font-size:13px;font-weight:600;margin-top:2px}
.ad-date.g{background:var(--bg-2);color:var(--ink)}
.ad-mine{display:flex;align-items:center;gap:12px;padding:12px 16px;cursor:pointer;position:relative;transition:background var(--t-1)}
.ad-mine:hover{background:var(--surface-2)}
.ad-mine+.ad-mine::before{content:"";position:absolute;left:16px;right:16px;top:0;height:1px;background:var(--line)}
`);
var RS={mode:'reprise',day:0,fit:true,last:null};
function hasRes(l,off,p){return A.res.find(function(r){return r.les===l.id&&r.off===off&&r.who===p.id})}
function dpDay(off){return ['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'][dowOff(off)]}
function bookSheet(l,off,mode,after){var p=prof(),kid=p.minor,pr=price(l,p),emma=DP.days.indexOf(dpDay(off))>=0;
  var horseOpts=kid?'<div class="note">'+ICON('horse','sm')+'<span>Le poney de '+p.first+' est attribué par '+D.staffer(l.coach).first+' la veille à 18 h. Vous recevez une notification.'+(D.horse(A.fav.jules)?' Son poney préféré, '+D.horse(A.fav.jules).name+', est signalé au moniteur.':'')+'</span></div>':
    opts([['own','Avec Ulysse de la Roche',emma?'Indisponible : c’est le jour d’'+DPR.first+' (demi-pension)':'Votre cheval, tarif propriétaire',U.hav(UL),emma],['club','Avec un cheval du club',(D.horse(A.fav.lea)?'Préférence : '+D.horse(A.fav.lea).name+', transmise au moniteur · ':'Attribué par le moniteur · ')+'supplément de 8 €',sq('horse')]],emma?'club':'own','horse');
  var payL=[];if(A.credits>0)payL.push(['credit','1 crédit de rattrapage','Il vous en reste '+A.credits+', valables jusqu’au 15 janvier',sq('ticket')]);
  if(!kid)payL.push(['carte','1 séance de votre carte','Carte 10 séances, '+A.card.left+' restantes',sq('wallet')]);payL=payL.concat(wallets(pr));payL.push(['cb','Carte Visa se terminant par 4242','Paiement immédiat de '+F.eur(pr),sq('card')]);
  var def=mode==='rattrapage'&&A.credits>0?'credit':(kid?'cb':'carte');
  var sh=P.sheet({title:'Réserver la reprise',icon:'calendar_add',body:'<div class="card soft" style="padding:14px 16px"><div class="hrow" style="--g:12px"><div class="ad-date"><b>'+D.day(off).getDate()+'</b><span>'+DW[dowOff(off)]+'</span></div><div class="grow"><div class="b" style="font-size:15.5px">'+l.title+'</div><div class="s mut">'+l.start+' – '+endT(l)+' · '+arena(l)+'</div><div class="s mut">'+D.name(l.coach)+' · '+(l.cap-count(l))+' place'+(l.cap-count(l)>1?'s':'')+' restante'+(l.cap-count(l)>1?'s':'')+'</div></div></div></div>'+
    '<div class="ad-lbl">Cavalier</div><div class="ad-row">'+U.av(p)+'<div class="grow"><div class="t">'+p.first+' '+p.last+'</div><div class="s">Galop '+p.galop+' · licence FFE 2027 valide</div></div>'+U.chip('Niveau conforme','ok',true)+'</div>'+
    '<div class="ad-lbl">Monture</div>'+horseOpts+'<div class="ad-lbl">Règlement</div>'+opts(payL,def,'pay')+
    '<p class="xs mut" style="margin-top:14px">Annulation gratuite jusqu’à 24 heures avant : la séance vous est rendue en crédit de rattrapage.</p>',
    foot:'<button class="btn pri lg ad-full" data-ok></button>'});
  var ok=$('[data-ok]',sh);function lab(){var v=optVal(sh,'pay'),sup=optVal(sh,'horse')==='club'?8:0;ok.innerHTML=payBtn(v,pr+sup)?payBtn(v,pr+sup)+'':v==='credit'?ICON('ticket','sm')+'Réserver avec 1 crédit'+(sup?' et '+F.eur(sup):''):v==='carte'?ICON('wallet','sm')+'Réserver avec ma carte'+(sup?' et '+F.eur(sup):''):ICON('lock','sm')+'Payer '+F.eur(pr+sup)+' et réserver'}
  lab();bindOpts(sh,lab);
  ok.onclick=function(){var v=optVal(sh,'pay'),hs=kid?null:(optVal(sh,'horse')==='own'?'h01':null);spin(ok,function(){
    if(v==='credit')A.credits--;else if(v==='carte')A.card.left--;
    var r={les:l.id,off:off,who:p.id,horse:hs,pay:v==='credit'?'Crédit de rattrapage':v==='carte'?'Carte de séances':(v==='apple'||v==='gpay'?payName(v):'Carte Visa')+', '+F.eur(pr)};A.res.push(r);A.extra[l.id]=(A.extra[l.id]||0)+1;
    success(sh,{title:kid?p.first+' est inscrit':'C’est réservé, Léa',text:'Votre place est confirmée. '+D.staffer(l.coach).first+' est prévenu'+(D.staffer(l.coach).first==='Inès'?'e':'')+' et un rappel vous sera envoyé la veille à 18 h.',
      head:'<div class="ad-date"><b>'+D.day(off).getDate()+'</b><span>'+DW[dowOff(off)]+'</span></div><div class="grow"><div class="b" style="font-size:15.5px">'+l.title+'</div><div class="s mut">'+cap(F.dateL(D.day(off)))+'</div></div>'+U.av(l.coach),
      rows:[['Horaire',l.start+' – '+endT(l)],['Lieu',arena(l)],['Monture',hs?'Ulysse de la Roche':'Attribuée la veille'],['Règlement',r.pay]],more:['Ajouter à mon agenda',function(s2){s2.close();P.toast('Séance ajoutée à votre agenda')}]});
    if(after)after()})}}
function waitSheet(l,off,after){var k=l.id+'@'+off,n=waitN(l)+1;
  var sh=P.sheet({title:'Liste d’attente',icon:'waitlist',body:'<div class="card soft" style="padding:14px 16px"><div class="b">'+l.title+'</div><div class="s mut">'+dayL(off)+' · '+l.start+' – '+endT(l)+' · '+D.name(l.coach)+'</div></div>'+
    '<div class="hrow" style="--g:16px;margin:18px 0"><div class="ad-big">'+n+'<small>e</small></div><div class="grow"><div class="b">Votre position si vous rejoignez la liste</div><div class="s mut">En moyenne, une place se libère dans 6 reprises sur 10 à ce créneau.</div></div></div>'+
    '<div class="card list"><div class="li"><div class="grow"><div class="t">M’inscrire dès qu’une place se libère</div><div class="s">Sans avoir à confirmer, réglé avec votre carte de séances</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">Me prévenir par notification et SMS</div><div class="s">Vous avez 2 heures pour refuser la place</div></div>'+U.tog(true)+'</div></div>',
    foot:'<button class="btn pri lg ad-full" data-ok>'+ICON('waitlist','sm')+'Rejoindre la liste d’attente</button>'});
  $('[data-ok]',sh).onclick=function(){A.wait[k]=n;sh.close();if(after)after();P.toast('Vous êtes '+n+'e sur la liste d’attente',{icon:'waitlist',undo:function(){delete A.wait[k];if(after)after()}})}}
function stageSheet(s,after){var p=prof(),three=s.price>=120;
  var sh=P.sheet({title:'Réserver le stage',icon:'calendar_add',body:'<div class="card soft" style="padding:14px 16px"><div class="hrow" style="--g:12px"><div class="ad-date"><b>'+s.d+'</b><span>'+s.m+'</span></div><div class="grow"><div class="b" style="font-size:15.5px">'+s.title+'</div><div class="s mut">'+s.when+' · '+s.hours+'</div><div class="s mut">'+D.name(s.coach)+' · '+s.level+'</div></div></div></div>'+
    '<p class="s" style="margin-top:12px;color:var(--ink-2)">'+s.note+'</p><div class="ad-lbl">Cavalier</div><div class="ad-row">'+U.av(p)+'<div class="grow"><div class="t">'+p.first+' '+p.last+'</div><div class="s">Galop '+p.galop+'</div></div>'+U.chip('Niveau conforme','ok',true)+'</div>'+
    '<div class="ad-lbl">Règlement</div>'+opts([['cb','Carte Visa se terminant par 4242','Paiement immédiat de '+F.eur(s.price),sq('card')]].concat(three?[['x3','En 3 fois sans frais','3 mensualités de '+F.eur(s.price/3,true),sq('repeat')]]:[]).concat([['sepa','Prélèvement SEPA','Ajouté à votre prochaine facture',sq('bank')]]),'cb','pay')+
    '<div style="margin-top:16px"><div class="ad-sum"><span class="mut">'+s.title+', '+s.days+' jour'+(s.days>1?'s':'')+'</span><span class="num">'+F.eur(s.price)+'</span></div>'+(p.id==='lea'?'<div class="ad-sum"><span class="mut">Avec votre cheval, Ulysse</span><span class="num">Compris</span></div>':'<div class="ad-sum"><span class="mut">Poney du club</span><span class="num">Compris</span></div>')+'<div class="ad-sum tot"><span>Total</span><span class="num">'+F.eur(s.price)+'</span></div></div>',
    foot:'<button class="btn pri lg ad-full" data-ok>'+ICON('lock','sm')+'Payer '+F.eur(s.price)+' et réserver</button>'});
  var ok=$('[data-ok]',sh);bindOpts(sh,function(n,v){ok.innerHTML=ICON('lock','sm')+(v==='x3'?'Payer '+F.eur(s.price/3,true)+' aujourd’hui':v==='sepa'?'Réserver, prélevé le 1er décembre':'Payer '+F.eur(s.price)+' et réserver')});
  ok.onclick=function(){var v=optVal(sh,'pay');spin(ok,function(){A.stages[s.id]=p.id;s.left=Math.max(0,s.left-1);success(sh,{title:'Stage réservé',text:'La place de '+p.first+' est confirmée. La facture est disponible dans Paiements.',
    head:'<div class="ad-date"><b>'+s.d+'</b><span>'+s.m+'</span></div><div class="grow"><div class="b" style="font-size:15.5px">'+s.title+'</div><div class="s mut">'+s.when+'</div></div>'+U.av(s.coach),
    rows:[['Horaires',s.hours],['Cavalier',p.first+' '+p.last],['Règlement',v==='x3'?'3 × '+F.eur(s.price/3,true):v==='sepa'?'Prélèvement SEPA':'Carte Visa'],['Montant',F.eur(s.price)]]});if(after)after()})}}

P.mod({id:'adh-reserver',role:'adherent',group:'Équitation',title:'Réserver',icon:'calendar_add',n:10,short:'Réserver',
 render:function(el,ctx){var p=prof(),kid=p.minor;
  if(ctx.params.mode&&RS.last!==ctx.params){RS.mode=ctx.params.mode;RS.last=ctx.params}
  el.innerHTML='<div class="ad-ph">'+U.ph('Réserver',kid?'Vous réservez pour '+p.first+', Galop 2. Les créneaux affichés correspondent à son niveau.':'Reprises, rattrapages, stages et cours particuliers. Les créneaux affichés correspondent à votre niveau.',profPill())+'</div><div data-wal></div>'+
   U.seg([['reprise','Reprises'],['rattrapage','Rattrapage'],['stage','Stages'],['coach','Cours particuliers']].concat(kid?[]:[['pistes','Installations']]),RS.mode,'data-mode')+
   '<div class="ad-rsv" style="margin-top:4px"><div data-main style="min-width:0"></div><div data-side class="stack" style="--g:14px;margin-top:14px"></div></div>';
  if(kid&&RS.mode==='pistes')RS.mode='reprise';
  bindProf(el);
  function wal(){$('[data-wal]',el).innerHTML='<div class="ad-wal scroll-x">'+
    '<button class="card tint d-acc ad-wt" data-wm="rattrapage"><span class="ico">'+ICON('ticket')+'</span><span class="grow"><span class="k">Crédits de rattrapage</span><span class="n num">'+A.credits+'</span><span class="u">à utiliser avant le 15 janvier</span></span></button>'+
    '<button class="card tint d-argent ad-wt" data-go="adh-paiements"><span class="ico">'+ICON('wallet')+'</span><span class="grow"><span class="k">Carte 10 séances</span><span class="n num">'+A.card.left+'<small> / '+A.card.total+'</small></span><span class="ad-punch">'+Array.apply(null,Array(A.card.total)).map(function(_,i){return '<i class="'+(i<A.card.total-A.card.left?'u':'')+'"></i>'}).join('')+'</span></span></button>'+
    '<button class="card tint d-cavaliers ad-wt" data-wm="reprise"><span class="ico">'+ICON('planning')+'</span><span class="grow"><span class="k">'+(kid?'Forfait de '+p.first:'Vos réservations')+'</span><span class="n num">'+(kid?'1 h':resFor(p).length)+'</span><span class="u">'+(kid?'par semaine':'à venir')+'</span></span></button></div>';
    $$('[data-wm]',el).forEach(function(b){b.onclick=function(){if(RS.mode===b.getAttribute('data-wm')){var sd=$('[data-side] .card',el);if(sd)sd.scrollIntoView({behavior:'smooth',block:'center'});P.toast(RS.mode==='reprise'?'Vos réservations sont listées dans « Mes réservations »':'Les créneaux de rattrapage sont affichés',{icon:'check'});return}RS.mode=b.getAttribute('data-wm');$$('[data-mode]',el).forEach(function(x){x.setAttribute('aria-selected',x.getAttribute('data-mode')===RS.mode)});main()}})}
  function side(){var rs=resFor(p),st=D.adhStages.filter(function(s){return A.stages[s.id]===p.id}),cr=A.coachRes;
   $('[data-side]',el).innerHTML='<div class="card"><div class="ch"><h3>'+(kid?'Réservations de '+p.first:'Mes réservations')+'</h3><span class="chip">'+(rs.length+st.length+(kid?0:cr.length))+'</span></div><div style="padding:8px 0">'+
    (rs.length+st.length?'':U.empty('planning','Rien de prévu','Choisissez un créneau dans le calendrier.'))+
    rs.map(function(r,i){var l=lesson(r.les),h=r.horse&&D.horse(r.horse);return '<div class="ad-mine" data-r="'+i+'"><div class="ad-date g"><b>'+D.day(r.off).getDate()+'</b><span>'+DW[dowOff(r.off)]+'</span></div><div class="grow"><div class="b s ellip">'+l.title+'</div><div class="xs mut ellip">'+l.start+' · '+D.staffer(l.coach).first+' · '+(h?h.name.split(' ')[0]:'monture la veille')+'</div></div>'+ICON('right','sm')+'</div>'}).join('')+
    st.map(function(s){return '<div class="ad-mine" data-toastst><div class="ad-date g"><b>'+s.d+'</b><span>'+s.m+'</span></div><div class="grow"><div class="b s ellip">'+s.title+'</div><div class="xs mut ellip">'+s.hours+' · '+D.name(s.coach)+'</div></div>'+U.chip('Payé','ok')+'</div>'}).join('')+
    (kid?'':cr.map(function(c){return '<div class="ad-mine"><div class="ad-date g"><b>'+c.d+'</b><span>'+c.w+'</span></div><div class="grow"><div class="b s ellip">Cours particulier, '+c.name+'</div><div class="xs mut ellip">'+c.time+' · '+c.dur+' min · Ulysse</div></div>'+U.chip('Payé','ok')+'</div>'}).join(''))+
    '</div><div class="cf"><button class="btn sm grow" data-sync>'+ICON('refresh','sm')+'Synchroniser avec mon agenda</button></div></div>'+
    (RS.mode==='pistes'?trackSide():favCard())+'<div class="note">'+ICON('info','sm')+'<span>'+(RS.mode==='pistes'?'Les créneaux pris par les reprises, les cours et l’entretien sont grisés. Touchez une case libre : la piste est réservée pour une heure.':'Annulation gratuite jusqu’à 24 heures avant. Passé ce délai, la séance est décomptée sauf certificat médical.')+'</span></div>';
   var fv=$('[data-fav2]',el);if(fv)fv.onclick=function(){favSheet(side)};$$('[data-tbm]',el).forEach(function(x){x.onclick=function(){trackMine(D.trackBookings.find(function(b){return b.id===x.getAttribute('data-tbm')}),upd)}});
   $$('[data-r]',el).forEach(function(x){x.onclick=function(){lessonSheet(rs[+x.getAttribute('data-r')])}});
   $('[data-sync]',el).onclick=function(){P.toast('Agenda synchronisé : '+rs.length+' séances envoyées vers Google Agenda')}}
  function upd(){wal();side();main()}
  function main(){var m=$('[data-main]',el),h='';
   if(RS.mode==='reprise'||RS.mode==='rattrapage'){var rat=RS.mode==='rattrapage';
    if(rat)h+='<div class="note'+(A.credits?' ok':' warn')+'" style="margin-top:14px">'+ICON('ticket','sm')+'<span>'+(A.credits?'<b>'+A.credits+' crédit'+(A.credits>1?'s':'')+' de rattrapage</b> à utiliser avant le 15 janvier. Choisissez n’importe quelle reprise de votre niveau où il reste une place.':'Vous n’avez plus de crédit de rattrapage. Signalez une absence 24 heures avant pour en recevoir un.')+'</span></div>';
    h+='<div class="ad-days scroll-x">'+Array.apply(null,Array(14)).map(function(_,o){var ls=D.lessons.filter(function(l){return l.dow===dowOff(o)&&fits(l,p)}),mine=A.res.some(function(r){return r.off===o&&r.who===p.id});
      return '<button class="ad-day'+(mine?' mine':'')+'" data-day="'+o+'" aria-selected="'+(o===RS.day)+'" title="'+dayL(o)+'"><span class="w">'+(o===0?'auj.':DW[dowOff(o)])+'</span><span class="d">'+D.day(o).getDate()+'</span><span class="c">'+(ls.length?ls.length+' cr.':'·')+'</span></button>'}).join('')+'</div>';
    var all=D.lessons.filter(function(l){return l.dow===dowOff(RS.day)}).sort(function(a,b){return a.start<b.start?-1:1}),list=RS.fit?all.filter(function(l){return fits(l,p)}):all;
    if(rat)list=list.filter(function(l){return fits(l,p)&&(count(l)<l.cap||hasRes(l,RS.day,p))});
    h+='<div class="hrow sp" style="margin:12px 0 10px"><h3 style="font-size:17px">'+dayL(RS.day)+'</h3>'+(rat?'<span class="s mut">'+list.length+' créneau'+(list.length>1?'x':'')+' avec de la place</span>':'<button class="tag" data-manual data-fit aria-pressed="'+RS.fit+'">'+ICON('filter','sm')+'Mon niveau seulement</button>')+'</div>';
    h+='<div class="card">'+(list.length?list.map(function(l,i){var n=count(l),left=l.cap-n,mine=hasRes(l,RS.day,p),ok=fits(l,p),w=A.wait[l.id+'@'+RS.day],pr=price(l,p);
      return '<div class="ad-slot'+(ok?'':' dim')+(mine?' mine':'')+'" style="--i:'+i+'"><div class="tm">'+l.start+'<small>'+l.dur+' min</small></div><div style="min-width:0"><div class="ti ellip">'+l.title+'</div><div class="s mut ellip">'+D.name(l.coach)+' · '+arena(l)+'</div><div class="me">'+
        (mine?U.chip('Réservé','ok',true):left<=0?U.chip('Complet · '+waitN(l)+' en attente','bad',true):left===1?U.chip('Dernière place','warn',true):U.chip(left+' places','ok',true))+'<span style="width:64px">'+U.bar(n/l.cap*100,left<=0?'var(--bad)':left===1?'var(--warn)':'var(--ok)')+'</span><span class="xs mut num">'+n+'/'+l.cap+'</span></div></div>'+
        '<div class="rt"><span class="pr">'+(mine?'':rat?'1 crédit':F.eur(pr))+'</span>'+(!ok?'<span class="xs mut">Autre niveau</span>':mine?'<button class="btn" data-see="'+l.id+'">Voir</button>':w?'<button class="btn" data-unw="'+l.id+'">'+w+'e en attente</button>':left<=0?'<button class="btn" data-wait="'+l.id+'">'+ICON('waitlist','sm')+'Liste d’attente</button>':'<button class="btn dark" data-book="'+l.id+'">Réserver</button>')+'</div></div>'}).join(''):
      U.empty('planning',rat?'Aucune place ce jour-là':'Aucune reprise de votre niveau ce jour-là','Essayez un autre jour ou affichez toutes les reprises.'))+'</div>'}
   else if(RS.mode==='pistes'){h+='<div class="ad-days scroll-x">'+Array.apply(null,Array(7)).map(function(_,o){var mine=(D.trackBookings||[]).some(function(b){return b.who==='m001'&&b.date===D.iso(D.day(o))});return '<button class="ad-day'+(mine?' mine':'')+'" data-tday="'+o+'" aria-selected="'+(o===TS.day)+'" title="'+dayL(o)+'"><span class="w">'+(o===0?'auj.':DW[dowOff(o)])+'</span><span class="d">'+D.day(o).getDate()+'</span></button>'}).join('')+'</div>'+
     '<div class="hrow sp wrap" style="margin:12px 0 10px;--g:8px"><h3 style="font-size:17px">'+dayL(TS.day)+'</h3><span class="hrow wrap xs mut" style="--g:10px"><span class="hrow" style="--g:5px"><i style="width:10px;height:10px;border-radius:3px;background:var(--acc)"></i>Vous</span><span class="hrow" style="--g:5px"><i style="width:10px;height:10px;border-radius:3px;background:color-mix(in srgb,var(--c4) 30%,var(--surface))"></i>Partagée</span><span class="hrow" style="--g:5px"><i style="width:10px;height:10px;border-radius:3px;background:var(--bg-2)"></i>Reprise ou entretien</span></span></div>'+
     '<div class="note" style="margin-bottom:12px">'+ICON('arena','sm')+'<span><b>Règle du club</b> : 1 heure par jour et par propriétaire, piste partagée à 4 cavaliers au plus, le rond de longe à 1 cheval.</span></div><div class="card" style="padding:12px">'+trackHTML()+'</div>'}
   else if(RS.mode==='stage'){var ss=D.adhStages.filter(function(s){return s.fit===p.id});
    h+='<div class="ad-stg rise" style="margin-top:14px">'+ss.map(function(s){var mine=A.stages[s.id]===p.id;return '<div class="card ad-st"><div class="hrow" style="--g:12px;align-items:flex-start"><div class="ad-date"><b>'+s.d+'</b><span>'+s.m+'</span></div><div class="grow"><div class="b" style="font-size:15.5px;line-height:1.25">'+s.title+'</div><div class="s mut" style="margin-top:2px">'+s.when+' · '+s.hours+'</div></div></div>'+
      '<p class="s" style="color:var(--ink-2)">'+s.note+'</p><div class="hrow wrap" style="--g:6px">'+U.av(s.coach,'sm')+'<span class="s b">'+D.name(s.coach)+'</span>'+U.chip(s.level,'line')+(mine?U.chip('Réservé','ok',true):s.left<=0?U.chip('Complet','bad',true):s.left===1?U.chip('Dernière place','warn',true):U.chip(s.left+' places sur '+s.cap,'ok',true))+'</div>'+
      '<div class="hrow sp" style="margin-top:auto;padding-top:4px"><div><span class="ad-big" style="font-size:24px">'+F.eur(s.price)+'</span>'+(s.price>=120?'<div class="xs mut">ou 3 × '+F.eur(s.price/3,true)+'</div>':'')+'</div>'+(mine?'<button class="btn" disabled>'+ICON('check','sm')+'Réservé</button>':s.left<=0?'<button class="btn" data-stw="'+s.id+'">'+ICON('waitlist','sm')+'Liste d’attente</button>':'<button class="btn dark" data-stg="'+s.id+'">Réserver</button>')+'</div></div>'}).join('')+'</div>'}
   else{h+='<div class="card" style="margin-top:14px">'+D.coaches.slice(0,kid?2:6).map(function(c,i){return '<div class="ad-slot" style="--i:'+i+';grid-template-columns:auto minmax(0,1fr)">'+U.av(c,'lg')+'<div style="min-width:0"><div class="hrow sp"><div class="ti ellip">'+c.first+' '+c.last+'</div><span class="pr">'+F.eur(c.rate)+' <span class="mut" style="font-weight:500">/ h</span></span></div><div class="s mut ellip">'+c.spec+' · '+c.level+'</div><div class="me">'+c.slots.map(function(s){return '<button class="tag" data-manual data-cs="'+c.id+'|'+s+'">'+s+'</button>'}).join('')+'</div></div></div>'}).join('')+'</div><div class="hrow" style="justify-content:center;margin-top:14px"><button class="btn" data-go="adh-coachs">Voir tous les coachs, leurs avis et leurs disponibilités'+ICON('arrow','sm')+'</button></div>'}
   m.innerHTML=h;P.animate(m);swIn(m);
   $$('[data-tday]',m).forEach(function(b){b.onclick=function(){TS.day=+b.getAttribute('data-tday');var sl=$('.ad-days',m).scrollLeft;main();$('.ad-days',m).scrollLeft=sl}});
   $$('[data-cell]',m).forEach(function(b){b.onclick=function(){var x=b.getAttribute('data-cell').split('|'),c=cellAt(x[0],TS.day,+x[1]);if(c.k==='mine')trackMine(c.b,upd);else trackBook(x[0],+x[1],upd)}});
   $$('[data-day]',m).forEach(function(b){b.onclick=function(){RS.day=+b.getAttribute('data-day');var sl=$('.ad-days',m).scrollLeft;main();$('.ad-days',m).scrollLeft=sl}});
   var ft=$('[data-fit]',m);if(ft)ft.onclick=function(){RS.fit=!RS.fit;var sl=$('.ad-days',m).scrollLeft;main();$('.ad-days',m).scrollLeft=sl};
   $$('[data-book]',m).forEach(function(b){b.onclick=function(){bookSheet(lesson(b.getAttribute('data-book')),RS.day,RS.mode,upd)}});
   $$('[data-wait]',m).forEach(function(b){b.onclick=function(){waitSheet(lesson(b.getAttribute('data-wait')),RS.day,upd)}});
   $$('[data-unw]',m).forEach(function(b){b.onclick=function(){delete A.wait[b.getAttribute('data-unw')+'@'+RS.day];upd();P.toast('Vous avez quitté la liste d’attente',{icon:'waitlist'})}});
   $$('[data-see]',m).forEach(function(b){b.onclick=function(){lessonSheet(hasRes(lesson(b.getAttribute('data-see')),RS.day,p))}});
   $$('[data-stg]',m).forEach(function(b){b.onclick=function(){stageSheet(D.adhStages.find(function(s){return s.id===b.getAttribute('data-stg')}),upd)}});
   $$('[data-stw]',m).forEach(function(b){b.onclick=function(){b.innerHTML=ICON('check','sm')+'3e en attente';b.disabled=true;P.toast('Vous êtes 3e sur la liste d’attente du stage',{icon:'waitlist'})}});
   $$('[data-cs]',m).forEach(function(b){b.onclick=function(){var x=b.getAttribute('data-cs').split('|');coachBook(D.coach(x[0]),x[1],upd)}})}
  $$('[data-mode]',el).forEach(function(b){b.addEventListener('click',function(){RS.mode=b.getAttribute('data-mode');main();side()})});
  upd();
 }});

/* =====================================================================
   3. COACHS : trouver et réserver en trois gestes
   ===================================================================== */
P.css(`
.ad-cg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
@container main (max-width:860px){.ad-cg{grid-template-columns:minmax(0,1fr)}}
.ad-co{padding:0 20px 20px;display:flex;flex-direction:column;gap:16px;overflow:hidden;transition:transform var(--t-2) var(--e-out),box-shadow var(--t-2)}
.ad-co:hover{transform:translateY(-3px);box-shadow:var(--shadow-2)}
.ad-co .nm{font:800 18px/1.15 var(--f-display);letter-spacing:-.02em}
.ad-cob{margin:0 -20px;height:96px;background:radial-gradient(120% 140% at 80% 0%,color-mix(in srgb,var(--d) 30%,var(--d-bg)),var(--d-bg));display:flex;align-items:flex-start;justify-content:space-between;padding:14px 14px 0 20px;flex-direction:row-reverse}
.ad-cob .chip{background:color-mix(in srgb,var(--surface) 72%,transparent)}
.ad-cob .ad-fav{background:color-mix(in srgb,var(--surface) 72%,transparent);width:40px;height:40px}
.ad-coa{margin:-62px auto 0;border-radius:50%;box-shadow:0 0 0 5px var(--surface);line-height:0}
.ad-coa .av{width:96px;height:96px;font-size:30px}
.ad-coh{text-align:center;margin-top:-4px}
.ad-coh .nm{font-size:23px;letter-spacing:-.03em}
.ad-coh .s{margin-top:4px}
.ad-cok{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.ad-cok>div{padding:12px 10px;border-radius:16px;background:var(--surface-2);text-align:center}
.ad-cok b{display:block;font:800 20px/1.1 var(--f-display);letter-spacing:-.02em}
.ad-cok span{font-size:13px;color:var(--mut)}
.ad-quote{margin:0;padding:14px 16px;border-radius:16px;background:var(--d-bg);color:var(--d-ink)}
.ad-quote blockquote{margin:0;font-size:14.5px;line-height:1.5}
.ad-quote figcaption{display:flex;align-items:center;gap:8px;margin-top:10px;font-size:13.5px;font-weight:600}
.ad-quote figcaption .ad-rate{margin-left:auto}
.ad-co .ad-slots{margin:0 -20px;padding:2px 20px}
.ad-co .ad-sl{min-width:84px;height:58px;border-radius:16px}
.ad-co .ad-sl b{font-size:16px}
.ad-rate{display:inline-flex;align-items:center;gap:4px;font-weight:700;font-size:13px}
.ad-rate svg.i{width:14px;height:14px;color:var(--c4);fill:var(--c4)}
.ad-slots{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 -18px;padding:2px 18px}
.ad-slots::-webkit-scrollbar{display:none}
.ad-sl{flex:none;display:flex;flex-direction:column;align-items:center;justify-content:center;min-width:76px;height:52px;border-radius:12px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2);font-size:13px;color:var(--mut);font-weight:600;transition:all var(--t-2) var(--e-out)}
.ad-sl b{font:800 15px/1.1 var(--f-display);color:var(--ink);font-variant-numeric:tabular-nums}
.ad-sl:hover{box-shadow:inset 0 0 0 2px var(--acc);background:var(--acc-pale)}
.ad-sl:active{transform:scale(.95)}
.ad-sl[aria-pressed="true"]{background:var(--navy);box-shadow:none;color:color-mix(in srgb,var(--navy-ink) 70%,transparent)}
.ad-sl[aria-pressed="true"] b{color:var(--navy-ink)}
.ad-fav{width:36px;height:36px;border-radius:50%;display:grid;place-items:center;color:var(--mut);transition:transform var(--t-3) var(--e-spring),color var(--t-2)}
.ad-fav[aria-pressed="true"]{color:var(--c6)}.ad-fav[aria-pressed="true"] svg{fill:currentColor}
.ad-fav:active{transform:scale(1.3)}
.ad-steps{display:flex;align-items:center;gap:8px;margin-bottom:16px;font-size:13px;font-weight:600;color:var(--mut)}
.ad-steps span{display:inline-flex;align-items:center;gap:6px}
.ad-steps i{width:20px;height:20px;border-radius:50%;display:grid;place-items:center;background:var(--bg-2);font-style:normal;font-size:13px}
.ad-steps .on{color:var(--ink)}.ad-steps .on i{background:var(--acc);color:var(--acc-ink)}
.ad-steps .ok i{background:var(--ok-pale);color:var(--ok)}
.ad-steps hr{flex:1;border:0;height:1px;background:var(--line-2);margin:0}
.ad-rev{padding:12px 0}.ad-rev+.ad-rev{border-top:1px solid var(--line)}
.ad-filt{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:0 -16px;padding:2px 16px}
.ad-filt::-webkit-scrollbar{display:none}.ad-filt .tag{flex:none;height:34px}
`);
D.adhReviews=D.adhReviews||[
 {who:'m078',n:5,when:'Il y a 2 semaines',text:'Des consignes simples et efficaces. En trois séances, mon cheval ne se précipite plus sur les oxers.'},
 {who:'m044',n:5,when:'Il y a 1 mois',text:'Très pédagogue, elle filme les parcours et on débriefe ensemble. Je recommande pour préparer un concours.'},
 {who:'m052',n:4,when:'Il y a 2 mois',text:'Séance exigeante mais on repart avec des exercices clairs à refaire seul dans la semaine.'}];
var CS={disc:'Tous',sort:'note'};
function coDom(c){return {CSO:'cavaliers','Dressage':'acc','Éthologie':'chevaux','Concours complet':'argent'}[c.spec]||'equipe'}
function slotDate(s){var idx=DWC.indexOf(s.split(' ')[0]),off=(idx-2+7)%7;return {off:off,d:D.day(off).getDate(),w:DW[idx],time:s.split(' ')[1]}}
function slotBtns(c,sel){return c.slots.slice().sort(function(a,b){return slotDate(a).off-slotDate(b).off}).map(function(s){var x=slotDate(s);return '<button class="ad-sl" data-slot="'+c.id+'|'+s+'" aria-pressed="'+(s===sel)+'"><span>'+x.w+' '+x.d+'</span><b>'+x.time.replace(/^0/,'').replace(':00',' h').replace(':',' h ')+'</b></button>'}).join('')}
function stars(n){var h='<span class="ad-rate">';for(var i=0;i<5;i++)h+='<svg class="i" viewBox="0 0 24 24" style="'+(i<n?'':'fill:none;color:var(--line-2)')+'"><path d="M12 3.5l2.6 5.4 5.9.8-4.3 4.1 1 5.9L12 16.9 6.8 19.7l1-5.9L3.5 9.700l5.9-.8z"/></svg>';return h+'</span>'}
function coachBook(c,slot,after){var dur=60,sl=slot||c.slots[0];
  var sh=P.sheet({title:'Réserver '+c.first,icon:'coach',body:function(b){
   b.innerHTML='<div class="ad-steps"><span class="ok"><i>'+ICON('check','sm')+'</i>Créneau</span><hr><span class="on"><i>2</i>Séance</span><hr><span><i>3</i>Paiement</span></div>'+
    '<div class="ad-row">'+U.av(c,'lg')+'<div class="grow"><div class="b" style="font-size:15.5px">'+c.first+' '+c.last+'</div><div class="s mut">'+c.spec+' · '+c.level+'</div></div><span class="ad-rate">'+ICON('star')+String(c.rating.toFixed(1)).replace('.',',')+'</span></div>'+
    '<div class="ad-lbl">Créneau</div><div class="ad-slots scroll-x" style="margin:0 -18px">'+slotBtns(c,sl)+'</div>'+
    '<div class="ad-lbl">Durée</div>'+U.seg([['30','30 min'],['45','45 min'],['60','1 heure']],'60','data-dur')+
    '<div class="ad-lbl">Objectif de la séance</div><div class="hrow wrap" style="--g:6px">'+(c.spec==='Dressage'?['Reprise Amateur 3','Cession à la jambe','Transitions','Position']:c.spec==='Éthologie'?['Travail à pied','Embarquement dans le van','Confiance','Longues rênes']:['Préparer Rambouillet','Abords et contrat de foulées','Lignes courbes','Position à l’obstacle']).map(function(t,i){return '<button class="tag" aria-pressed="'+(i===0)+'">'+t+'</button>'}).join('')+'</div>'+
    '<div class="ad-lbl">Cheval et lieu</div><div class="card list"><div class="li">'+U.hav(UL)+'<div class="grow"><div class="t">Ulysse de la Roche</div><div class="s">Votre cheval, disponible sur ce créneau</div></div>'+ICON('check','sm')+'</div><div class="li">'+sq('arena')+'<div class="grow"><div class="t">Carrière d’honneur</div><div class="s">Réservée automatiquement pour votre séance</div></div>'+ICON('check','sm')+'</div></div>'+
    '<div class="ad-lbl">Règlement</div>'+opts([['cb','Carte Visa se terminant par 4242','Débitée après la séance',sq('card')],['sepa','Sur ma prochaine facture','Prélèvement SEPA le 1er décembre',sq('bank')]],'cb','pay')+
    '<div style="margin-top:16px" data-tot></div>'},
   foot:'<button class="btn pri lg ad-full" data-ok></button>'});
  var ok=$('[data-ok]',sh);function pr(){return Math.round(c.rate*dur/60)}
  function tot(){$('[data-tot]',sh).innerHTML='<div class="ad-sum"><span class="mut">Cours particulier, '+dur+' min</span><span class="num">'+F.eur(pr())+'</span></div><div class="ad-sum"><span class="mut">Carrière et frais de service</span><span class="num">Compris</span></div><div class="ad-sum tot"><span>Total</span><span class="num">'+F.eur(pr())+'</span></div>';ok.innerHTML=ICON('lock','sm')+'Payer '+F.eur(pr())+' et réserver'}
  tot();bindOpts(sh);
  $$('[data-dur]',sh).forEach(function(x){x.addEventListener('click',function(){dur=+x.getAttribute('data-dur');tot()})});
  $$('[data-slot]',sh).forEach(function(x){x.onclick=function(){sl=x.getAttribute('data-slot').split('|')[1];$$('[data-slot]',sh).forEach(function(y){y.setAttribute('aria-pressed',y===x)})}});
  ok.onclick=function(){var x=slotDate(sl);spin(ok,function(){A.coachRes.push({name:c.first+' '+c.last,d:x.d,w:x.w,time:x.time,dur:dur,id:c.id});
   success(sh,{title:'Séance réservée avec '+c.first,text:c.first+' reçoit votre demande avec votre objectif et les dernières notes de séance d’Ulysse.',
    head:U.av(c,'lg')+'<div class="grow"><div class="b" style="font-size:15.5px">'+c.first+' '+c.last+'</div><div class="s mut">Cours particulier, '+c.spec+'</div></div>',
    rows:[['Date',cap(F.dateL(D.day(x.off)))],['Heure',x.time+', '+dur+' min'],['Lieu','Carrière d’honneur'],['Montant',F.eur(pr())]],more:['Écrire à '+c.first,function(s2){s2.close();P.go('adh-messages',{id:'t-coach'})}]});if(after)after()})}}
function coachProfile(c,after){var sh=P.sheet({title:c.first+' '+c.last,icon:'coach',wide:true,body:'<div class="hrow" style="--g:16px;align-items:flex-start">'+U.av(c,'xl')+'<div class="grow"><div class="hrow wrap" style="--g:6px">'+U.chip(c.spec,'acc')+U.chip(c.ext?'Coach indépendant':'Moniteur du club','line')+'</div><div class="b" style="margin-top:8px">'+c.level+'</div><p class="s mut" style="margin-top:4px">'+(c.bio||'Enseigne au club depuis plusieurs saisons, du Galop 1 à la compétition.')+'</p></div></div>'+
   '<div class="g3" style="--g:10px;margin-top:16px;grid-template-columns:repeat(3,minmax(0,1fr))">'+[[String(c.rating.toFixed(1)).replace('.',','),'Note moyenne'],[c.reviews,'Avis vérifiés'],[F.eur(c.rate),'Par heure']].map(function(x){return '<div class="card soft" style="padding:12px"><div class="disp bb num" style="font-size:20px">'+x[0]+'</div><div class="xs mut">'+x[1]+'</div></div>'}).join('')+'</div>'+
   '<div class="ad-lbl">Diplômes et assurances vérifiés par le club</div><div class="hrow wrap" style="--g:6px">'+['Carte professionnelle à jour','Responsabilité civile professionnelle','Diplôme d’État'].map(function(t){return U.chip(t,'ok',true)}).join('')+'</div>'+
   '<div class="ad-lbl">Prochaines disponibilités</div><div class="ad-slots scroll-x" style="margin:0 -18px">'+slotBtns(c)+'</div>'+
   '<div class="ad-lbl">Avis des cavaliers du club</div>'+D.adhReviews.map(function(r){return '<div class="ad-rev"><div class="hrow" style="--g:8px">'+U.av(r.who,'sm')+'<b class="s grow">'+D.member(r.who).first+' '+D.member(r.who).last.charAt(0)+'.</b>'+stars(r.n)+'</div><p class="s" style="margin-top:6px;color:var(--ink-2)">'+r.text+'</p><div class="xs mut" style="margin-top:4px">'+r.when+' · séance vérifiée</div></div>'}).join(''),
   foot:'<button class="btn ad-full" data-msg>'+ICON('chat','sm')+'Écrire</button><button class="btn pri ad-full" data-bk>Réserver une séance</button>'});
  $$('[data-slot]',sh).forEach(function(x){x.onclick=function(){coachBook(c,x.getAttribute('data-slot').split('|')[1],after)}});
  $('[data-bk]',sh).onclick=function(){coachBook(c,null,after)};$('[data-msg]',sh).onclick=function(){sh.close();P.go('adh-messages',{id:'t-coach'})}}

P.mod({id:'adh-coachs',role:'adherent',group:'Équitation',title:'Coachs',icon:'coach',n:20,
 render:function(el){
  el.innerHTML=U.ph('Coachs','Moniteurs du club et coachs indépendants vérifiés. Touchez un créneau pour réserver : séance, paiement, c’est fait.','')+
   '<div class="card tint d-cavaliers ad-cobn" style="padding:20px 22px;margin-bottom:18px"><div class="hrow" style="--g:14px">'+U.av('c01','lg')+'<div class="grow"><div class="eyebrow" style="color:color-mix(in srgb,var(--navy-ink) 62%,var(--acc))">Votre coach de concours</div><div class="b" style="color:var(--navy-ink);font-size:15px;margin-top:2px">Pauline Arnaud vous accompagne dimanche à Rambouillet</div><div class="s mut">Reconnaissance du parcours à '+hm(RB.recon)+', détente à '+hm(RB.warmup)+'</div></div><button class="btn sm ad-nb hide-s" data-go="adh-concours">Voir le concours</button></div></div>'+
   '<div class="hrow sp wrap" style="--g:10px;margin-bottom:14px"><div class="ad-filt scroll-x grow">'+['Tous','CSO','Dressage','Éthologie','Concours complet','Enseignement'].map(function(t){return '<button class="tag" data-manual data-disc="'+t+'" aria-pressed="'+(t===CS.disc)+'">'+t+'</button>'}).join('')+'</div>'+U.seg([['note','Mieux notés'],['prix','Moins chers']],CS.sort,'data-sort')+'</div><div data-list></div>';
  function draw(){var ls=D.coaches.filter(function(c){return CS.disc==='Tous'||c.spec===CS.disc}).sort(function(a,b){return CS.sort==='prix'?a.rate-b.rate:b.rating-a.rating});
   var box=$('[data-list]',el);box.innerHTML='<div class="ad-cg rise">'+ls.map(function(c,ci){var dm=coDom(c),rv=D.adhReviews[ci%D.adhReviews.length],rm=D.member(rv.who);return '<div class="card ad-co d-'+dm+'"><div class="ad-cob"><button class="ad-fav" data-manual data-fav="'+c.id+'" aria-pressed="'+(!!A.likes[c.id]||c.id==='c01')+'" title="Ajouter à mes coachs favoris">'+ICON('heart')+'</button><span class="chip d">'+c.spec+'</span></div>'+
     '<div class="ad-coa">'+U.av(c,'xl')+'</div><div class="ad-coh"><div class="nm">'+c.first+' '+c.last+'</div><div class="s mut">'+c.level+'</div><div class="hrow" style="--g:8px;justify-content:center;margin-top:8px">'+stars(Math.round(c.rating))+'<b class="s num">'+String(c.rating.toFixed(1)).replace('.',',')+'</b><span class="s mut">'+c.reviews+' avis</span></div></div>'+
     '<div class="ad-cok"><div><b class="num">'+F.eur(c.rate)+'</b><span>l’heure</span></div><div><b class="num">'+c.slots.length+'</b><span>créneaux</span></div><div><b>'+(c.ext?'Indép.':'Club')+'</b><span>'+(c.ext?'vérifié':'moniteur')+'</span></div></div>'+
     '<div><div class="ad-lbl" style="margin:0 0 8px">Prochains créneaux</div><div class="ad-slots scroll-x">'+slotBtns(c)+'</div></div>'+
     '<figure class="ad-quote"><blockquote>« '+rv.text+' »</blockquote><figcaption>'+U.av(rv.who,'sm')+'<span>'+rm.first+' '+rm.last.charAt(0)+'.</span>'+stars(rv.n)+'</figcaption></figure>'+
     '<div class="hrow" style="--g:8px;margin-top:auto"><button class="btn grow" data-prof2="'+c.id+'">Profil et avis</button><button class="btn dark grow" data-bk="'+c.id+'">Réserver</button></div></div>'}).join('')+'</div>';
   P.animate(box);swIn(box);
   $$('[data-slot]',box).forEach(function(b){b.onclick=function(){var x=b.getAttribute('data-slot').split('|');coachBook(D.coach(x[0]),x[1])}});
   $$('[data-bk]',box).forEach(function(b){b.onclick=function(){coachBook(D.coach(b.getAttribute('data-bk')))}});
   $$('[data-prof2]',box).forEach(function(b){b.onclick=function(){coachProfile(D.coach(b.getAttribute('data-prof2')))}});
   $$('[data-fav]',box).forEach(function(b){b.onclick=function(){var on=b.getAttribute('aria-pressed')!=='true';b.setAttribute('aria-pressed',on);A.likes[b.getAttribute('data-fav')]=on;P.toast(on?'Ajouté à vos coachs favoris':'Retiré de vos favoris',{icon:'heart'})}})}
  $$('[data-disc]',el).forEach(function(b){b.onclick=function(){CS.disc=b.getAttribute('data-disc');$$('[data-disc]',el).forEach(function(x){x.setAttribute('aria-pressed',x===b)});draw()}});
  $$('[data-sort]',el).forEach(function(b){b.addEventListener('click',function(){CS.sort=b.getAttribute('data-sort');draw()})});
  draw();
 }});

/* =====================================================================
   4. MON CHEVAL : 3D, caméra, journal, soins, ration, prestations, partage
   ===================================================================== */
P.css(`
.ad-hh{display:grid;grid-template-columns:200px minmax(0,1fr) auto;gap:8px 28px;align-items:center;padding:24px 28px;margin-bottom:16px;overflow:hidden;position:relative}
.ad-hhi{width:200px;height:200px;margin:-10px 0 -24px -12px;align-self:end}
.ad-hhi .illu{width:100%;height:100%}
.ad-hht{display:flex;flex-direction:column;gap:12px;min-width:0}
.ad-hn{font:800 46px/1 var(--f-display);letter-spacing:-.045em;color:var(--d-ink)}
.ad-hh .sub{font-size:15.5px;opacity:.85}
.ad-hh .acts{margin-top:4px}
.ad-hh .chip{background:color-mix(in srgb,var(--surface) 72%,transparent)}
.ad-hh .chip.warn{background:var(--warn-pale);color:var(--warn)}
.ad-hhr{display:flex;align-items:center;gap:22px;padding:18px 20px;border-radius:22px;background:color-mix(in srgb,var(--surface) 62%,transparent)}
.ad-rgs .tr{stroke-opacity:.18}
.ad-hhl{display:flex;flex-direction:column;gap:12px;min-width:0}
.ad-hhl>div{display:flex;gap:10px;align-items:flex-start}
.ad-hhl i{width:10px;height:10px;border-radius:50%;margin-top:6px;flex:none}
.ad-hhl .k{display:block;font-size:13px;font-weight:600;opacity:.75}
.ad-hhl b{font:800 24px/1.1 var(--f-display);letter-spacing:-.03em}
.ad-hhl .u{display:block;font-size:13.5px;opacity:.75}
@container main (max-width:1180px){.ad-hh{grid-template-columns:160px minmax(0,1fr)}.ad-hhi{width:160px;height:160px}.ad-hhr{grid-column:1/-1}}
@container main (max-width:620px){.ad-hh{grid-template-columns:minmax(0,1fr);padding:20px;gap:14px}.ad-hhi{position:absolute;right:-18px;top:-6px;width:150px;height:150px;margin:0;opacity:.95}.ad-hht{padding-right:0}.ad-hht .eyebrow,.ad-hn,.ad-hh .sub{padding-right:110px}.ad-hn{font-size:36px}.ad-hh .acts .btn{flex:1 1 40%;padding:0 12px}.ad-hh .acts .btn.pri{flex-basis:100%}.ad-hhr{padding:16px;gap:16px}.ad-hhr .ad-rgs{width:120px!important;height:120px!important}.ad-hhr .ad-rgs svg{width:120px;height:120px}.ad-hhl b{font-size:21px}}
.ad-hv{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:14px}
.ad-3d{height:100%;min-height:360px;border-radius:var(--r-lg);overflow:hidden;background:radial-gradient(120% 90% at 50% 100%,var(--acc-pale),var(--surface) 70%);position:relative}
.ad-3d .gl{position:absolute!important;inset:0}
.ad-3d .tp{position:absolute;top:14px;left:14px;right:14px;display:flex;gap:6px;flex-wrap:wrap;z-index:3;pointer-events:none}
.ad-3d .hint{position:absolute;right:14px;bottom:76px;z-index:3;font-size:13px;color:var(--mut);display:flex;align-items:center;gap:5px;pointer-events:none}
.ad-3d .st{position:absolute;left:14px;right:14px;bottom:14px;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;z-index:3}
.ad-3d .st div{padding:8px 10px;border-radius:10px;background:color-mix(in srgb,var(--surface) 82%,transparent);backdrop-filter:blur(8px);box-shadow:inset 0 0 0 1px var(--line)}
.ad-3d .st b{display:block;font:800 15px/1.2 var(--f-display);letter-spacing:-.02em}
.ad-3d .st span{font-size:13px;color:var(--mut)}
.ad-live{display:flex;flex-direction:column}
.ad-live .ad-cam{border-radius:var(--r-lg) var(--r-lg) 0 0;aspect-ratio:16/9}
.ad-dayl{display:flex;flex-direction:column;padding:6px 0}
.ad-dayl>div{display:grid;grid-template-columns:44px 20px minmax(0,1fr);gap:8px;align-items:center;padding:7px 16px;font-size:13px}
.ad-dayl .h{font-weight:600;font-variant-numeric:tabular-nums;color:var(--mut)}
.ad-dayl .d{width:9px;height:9px;border-radius:50%;margin:auto;background:var(--ok)}
.ad-dayl .nx .d{background:transparent;box-shadow:inset 0 0 0 2px var(--acc)}
.ad-hvseg{display:none;margin-bottom:10px}
@container main (max-width:860px){.ad-hv{grid-template-columns:minmax(0,1fr)}.ad-hvseg{display:flex}.ad-hvseg .seg{width:100%}.ad-hvseg .seg button{flex:1;justify-content:center;height:36px}.ad-hv[data-v="cam"] .ad-hv3{display:none}.ad-hv[data-v="3d"] .ad-live{display:none}.ad-3d{height:340px;min-height:0}}
@container main (max-width:620px){.ad-3d .st{gap:5px;left:10px;right:10px;bottom:10px}.ad-3d .st div{padding:7px 8px}.ad-3d .st b{font-size:13.5px}.ad-3d .st span{font-size:13px}.ad-3d .hint{bottom:66px}}
.ad-ps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px;margin:14px 0 18px}
.ad-pb{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--r-md);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line),var(--shadow-1);text-align:left;min-width:0;transition:transform var(--t-2) var(--e-out),box-shadow var(--t-2)}
.ad-pb:hover{transform:translateY(-2px);box-shadow:inset 0 0 0 1px var(--acc-line),var(--shadow-2)}
.ad-pb:active{transform:scale(.97)}
.ad-pb b{display:block;font-size:13px}.ad-pb small{display:block;font-size:13px;color:var(--mut)}
@container main (max-width:620px){.ad-ps{gap:6px}.ad-pb{flex-direction:column;text-align:center;gap:6px;padding:10px 2px;box-shadow:none;background:none}.ad-pb .av{width:52px;height:52px;border-radius:17px;background:var(--surface)!important;box-shadow:inset 0 0 0 1px var(--line),var(--shadow-1)}.ad-pb b{font-size:13px;font-weight:600}.ad-pb:hover{transform:none;box-shadow:none}}
.ad-j{padding:16px;display:flex;gap:12px;position:relative}
.ad-j+.ad-j::before{content:"";position:absolute;left:16px;right:16px;top:0;height:1px;background:var(--line)}
.ad-j.new{animation:rise var(--t-4) var(--e-out) both}
.ad-j p{color:var(--ink-2);margin-top:6px;line-height:1.5}
.ad-photo{margin-top:10px;height:150px;border-radius:var(--r-md);background:linear-gradient(160deg,color-mix(in srgb,var(--c4) 45%,var(--surface)),color-mix(in srgb,var(--acc) 35%,var(--surface)));display:grid;place-items:center;color:color-mix(in srgb,var(--ink) 55%,transparent);position:relative;overflow:hidden}
.ad-photo svg{width:72px;height:72px}
.ad-photo span{position:absolute;left:10px;bottom:8px;font-size:13px;font-weight:600;background:color-mix(in srgb,var(--surface) 80%,transparent);padding:2px 7px;border-radius:5px;color:var(--ink)}
.ad-mood{display:inline-flex;gap:2px}
.ad-mood button,.ad-mood span{width:30px;height:30px;display:grid;place-items:center;color:var(--line-2);transition:transform var(--t-2) var(--e-spring),color var(--t-2)}
.ad-mood .on{color:var(--c6)}.ad-mood .on svg{fill:currentColor}
.ad-mood button:active{transform:scale(1.3)}
.ad-mood.ro span{width:16px;height:16px}.ad-mood.ro svg{width:13px;height:13px}
.ad-j .chip{flex:none}
.ad-like{white-space:nowrap;flex:none;display:inline-flex;align-items:center;gap:5px;font-size:13px;font-weight:600;color:var(--mut);height:30px;padding:0 8px;margin-left:-8px;border-radius:8px}
.ad-like[aria-pressed="true"]{color:var(--c6)}.ad-like[aria-pressed="true"] svg{fill:currentColor}
.ad-care{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:13px 16px;position:relative}
.ad-care+.ad-care::before{content:"";position:absolute;left:16px;right:16px;top:0;height:1px;background:var(--line)}
.ad-meal{display:grid;grid-template-columns:64px minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 16px;position:relative}
.ad-meal+.ad-meal::before{content:"";position:absolute;left:16px;right:16px;top:0;height:1px;background:var(--line)}
.ad-svc{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
@container main (max-width:900px){.ad-svc{grid-template-columns:repeat(2,minmax(0,1fr))}}
.ad-sv{padding:14px;display:flex;flex-direction:column;gap:8px;text-align:left;min-height:118px}
.ad-sv .p{margin-top:auto;font-weight:700;font-variant-numeric:tabular-nums}
.ad-wk{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
.ad-wd{display:flex;flex-direction:column;align-items:center;gap:8px;padding:12px 4px;border-radius:var(--r-md);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);min-width:0;transition:transform var(--t-2) var(--e-out),box-shadow var(--t-2)}
.ad-wd:hover{box-shadow:inset 0 0 0 1px var(--acc-line),var(--shadow-2);transform:translateY(-2px)}
.ad-wd .w{font-size:13px;font-weight:600;color:var(--mut)}
.ad-wd .n{font-size:13px;font-weight:600;max-width:100%}
.ad-wd.dp{background:color-mix(in srgb,var(--c4) 12%,var(--surface))}
.ad-wd.today{box-shadow:inset 0 0 0 2px var(--acc)}
.ad-wd .rest{width:32px;height:32px;border-radius:50%;display:grid;place-items:center;background:var(--bg-2);color:var(--mut)}
@container main (max-width:620px){.ad-wk{gap:4px}.ad-wd{padding:10px 0}.ad-wd .n{font-size:13px}.ad-wd .av,.ad-wd .rest{width:30px;height:30px}}
`);
var SERVICES=[['paddock','paddock','Sortie au paddock','2 heures en Prairie du bas, avec ses copains',6],['couverture','layers','Couverture','Pose le soir et retrait le matin selon la météo',2],['travail','whistle','Travail par un moniteur','45 minutes montées ou à la longe, compte rendu dans le journal',35],['douche','drop','Douche','Douche tiède et séchage au solarium',10],
 ['marcheur','rotate','Marcheur','30 minutes au pas, idéal les jours de repos',5],['pansage','brush','Pansage complet','Brossage, pieds graissés, crins démêlés',12],['tonte','bolt','Tonte','Tonte de chasse ou complète, couverture adaptée ensuite',70],['soins','care','Soin quotidien','Application d’un traitement prescrit, matin et soir',4]];
A.asks=[{name:'Sortie au paddock',when:'Tous les jours à 8 h 30',price:6,status:'Chaque jour',k:'ok'},{name:'Couverture',when:'Automatique sous 8 °C la nuit',price:2,status:'Selon la météo',k:'ok'}];
A.week=['lea','dp','lea','lea','rest','dp','lea'];/* lundi à dimanche */
var CH={tab:'journal',view:'cam',last:null};
function moodRO(n){var h='<span class="ad-mood ro" title="Ressenti '+n+' sur 5">';for(var i=1;i<=5;i++)h+='<span class="'+(i<=n?'on':'')+'">'+ICON('heart','sm')+'</span>';return h+'</span>'}
function prestaSheet(k,after){var s=SERVICES.find(function(x){return x[0]===k}),rep=1;
  var sh=P.sheet({title:s[2],icon:s[1],body:'<p class="s mut">'+s[3]+'. Antoine reçoit la tâche sur son téléphone et coche quand c’est fait.</p>'+
    '<div class="ad-lbl">Quel jour ?</div><div class="ad-days scroll-x" style="margin-top:0">'+Array.apply(null,Array(7)).map(function(_,o){return '<button class="ad-day" data-pd="'+o+'" aria-selected="'+(o===1)+'"><span class="w">'+(o===0?'auj.':DW[dowOff(o)])+'</span><span class="d">'+D.day(o).getDate()+'</span></button>'}).join('')+'</div>'+
    '<div class="ad-lbl">À quel moment ?</div>'+U.seg([['m','Matin'],['a','Après-midi'],['s','Soir']],'m')+
    '<div class="ad-lbl">Répéter</div>'+U.seg([['1','Une fois'],['5','5 jours'],['30','Chaque jour']],'1','data-rep')+
    '<div class="ad-lbl">Consigne pour l’équipe (facultatif)</div><textarea class="in" id="ad-pnote" placeholder="Par exemple : cloches aux antérieurs, pas avec Tornado"></textarea>'+
    '<div style="margin-top:16px" data-tot></div><div class="note" style="margin-top:12px">'+ICON('invoice','sm')+'<span>Le montant est ajouté automatiquement à votre facture de pension de novembre. Rien à payer maintenant.</span></div>',
    foot:'<button class="btn pri lg ad-full" data-ok></button>'});
  function tot(){var t=s[4]*rep;$('[data-tot]',sh).innerHTML='<div class="ad-sum"><span class="mut">'+s[2]+(rep>1?', '+rep+' fois':'')+'</span><span class="num">'+F.eur(s[4])+(rep>1?' × '+rep:'')+'</span></div><div class="ad-sum tot"><span>Ajouté à la facture</span><span class="num">'+F.eur(t)+'</span></div>';$('[data-ok]',sh).innerHTML='Demander · '+F.eur(t)}
  tot();$$('[data-rep]',sh).forEach(function(b){b.addEventListener('click',function(){rep=+b.getAttribute('data-rep');tot()})});
  var day=1;$$('[data-pd]',sh).forEach(function(b){b.onclick=function(){day=+b.getAttribute('data-pd');$$('[data-pd]',sh).forEach(function(x){x.setAttribute('aria-selected',x===b)})}});
  $('[data-ok]',sh).onclick=function(){var it={name:s[2],when:(rep>1?(rep===30?'Chaque jour dès ':'5 jours dès '):'')+dayL(day).toLowerCase(),price:s[4]*rep,status:'Demandée',k:'acc'};A.asks.unshift(it);sh.close();if(after)after();
    P.toast(s[2]+' demandée pour '+dayL(day).toLowerCase()+', '+F.eur(s[4]*rep)+' ajoutés à votre facture',{undo:function(){A.asks.splice(A.asks.indexOf(it),1);if(after)after()}});
    setTimeout(function(){if(A.asks.indexOf(it)>=0){it.status='Confirmée par Antoine';it.k='ok';if(after)after()}},4200)}}
function camSheet(){var act=[2,1,0,0,0,1,0,0,3,1,0,0,0,0,2,0,0,1,4,6,5,3,2,4];
  var sh=P.sheet({title:'Caméra du box B01',icon:'camera',wide:true,body:function(b){b.innerHTML='<div data-bigcam></div><div class="hrow sp" style="margin:16px 0 8px"><div><div class="b">Activité des 12 dernières heures</div><div class="xs mut">Mouvements détectés par la caméra, par demi-heure</div></div>'+U.chip('Nuit calme','ok',true)+'</div>'+
    bars(act,act.map(function(_,i){return i%4===0?String((22+i/2)%24).padStart(2,'0')+' h':''}),{h:120,hi:null})+
    '<div class="card list" style="margin-top:14px">'+[['23:10','Se couche','Couché 3 h 20 au total, deux cycles de sommeil','moon'],['03:40','Se relève et boit','Abreuvoir : 4 litres','drop'],['07:10','Repas du matin','A tout mangé en 35 minutes','hay'],['08:30','Sortie au paddock','Prairie du bas, retour à 10 h 30','paddock']].map(function(e){return '<div class="li click" data-clip><span class="mono" style="width:44px">'+e[0]+'</span>'+sq(e[3])+'<div class="grow"><div class="t">'+e[1]+'</div><div class="s">'+e[2]+'</div></div>'+ICON('play','sm')+'</div>'}).join('')+'</div>';
    boxCam($('[data-bigcam]',b),{tools:false});$$('[data-clip]',b).forEach(function(c){c.onclick=function(){P.toast('Lecture de l’extrait de '+$('.mono',c).textContent,{icon:'play'})}})},
   foot:'<button class="btn ad-full" data-al>'+ICON('bell','sm')+'Régler mes alertes</button><button class="btn pri ad-full" data-sn>'+ICON('image','sm')+'Prendre une photo</button>'});
  $('[data-sn]',sh).onclick=function(){P.toast('Photo enregistrée dans le journal d’Ulysse',{icon:'image'})};$('[data-al]',sh).onclick=function(){sh.close();P.go('adh-profil',{tab:'notifs'})}}

P.mod({id:'adh-cheval',role:'adherent',group:'Cheval',title:'Mon cheval',icon:'horse',n:10,short:'Ulysse',phoneTitle:'Ulysse',
 render:function(el,ctx){
  if(ctx.params.tab&&CH.last!==ctx.params){CH.tab=ctx.params.tab;CH.last=ctx.params}
  var pts=[{id:'pied',label:'Ferrure jeudi à 9 h',pos:[.09,.05,.33],c:'var(--warn)'},{id:'dos',label:'Dos : ostéopathe en janvier',pos:[0,.74,-.1],c:'var(--acc)'},{id:'vacc',label:'Vaccins à jour',pos:[0,.74,.4],c:'var(--ok)'},{id:'dent',label:'Dents : contrôle en avril',pos:[0,.68,.72],c:'var(--ok)'}];
  var wp=Math.round(UL.work/UL.workMax*100),bc=parseFloat(bcs().replace(',','.'));
  el.innerHTML=hselHTML()+'<div class="card tint d-chevaux ad-hh rise"><div class="ad-hhi">'+ILLU.cheval({size:null})+'</div><div class="ad-hht"><span class="eyebrow">Votre cheval · box '+UL.box+'</span><h1 class="ad-hn">'+UL.name+'</h1><div class="sub">'+UL.breed+' · '+UL.sex.toLowerCase()+' '+UL.coat.toLowerCase()+' · '+UL.age+' ans · 1,68 m</div>'+
   '<div class="hrow wrap" style="--g:8px">'+U.chip(ICON('heart','sm')+'En forme','ok')+U.chip(ICON('pulse','sm')+'Humeur : '+UL.mood.toLowerCase(),'d')+U.chip(ICON('hoof','sm')+'Maréchal jeudi','warn')+'</div>'+
   '<div class="hrow wrap acts" style="--g:8px"><button class="btn pri" data-allp>'+ICON('plus','sm')+'Demander une prestation</button><button class="btn" data-ride>'+ICON('route','sm')+'Partir en balade</button><button class="btn" data-share>'+ICON('link','sm')+'Inviter un proche</button></div></div>'+
   '<div class="ad-hhr">'+rings([{p:wp,c:'var(--hz)'},{p:80,c:'var(--acc)'},{p:bc/5*100,c:'var(--rd)'}],164)+'<div class="ad-hhl">'+
    [['var(--hz)','Travail sur 7 jours',UL.work+' h','sur '+UL.workMax+' h conseillées'],['var(--acc)','Soins à jour','4','sur 5 rendez-vous'],['var(--rd)','État corporel',bcs(),'sur 5, idéal']].map(function(x){return '<div><i style="background:'+x[0]+'"></i><span class="grow"><span class="k">'+x[1]+'</span><b class="num">'+x[2]+'</b> <span class="u">'+x[3]+'</span></span></div>'}).join('')+'</div></div></div>'+
   '<div class="ad-hvseg">'+U.seg([['cam',ICON('camera','sm')+'Caméra du box'],['3d',ICON('cube','sm')+'Vue 3D et santé']],CH.view,'data-hv')+'</div>'+
   '<div class="ad-hv" data-v="'+CH.view+'"><div class="card ad-hv3"><div class="ad-3d"><div class="gl"></div><div class="tp"></div><div class="hint">'+ICON('rotate','sm')+'Faites tourner, touchez un point</div>'+
    '<div class="st"><div><b class="num">'+UL.weight+' kg</b><span>Poids</span></div><div><b class="num">'+bcs()+' / 5</b><span>État</span></div><div><b class="num">'+UL.work+' h</b><span>Sur 7 jours</span></div><div><b class="num">38 bpm</b><span>Au repos</span></div></div></div></div>'+
   '<div class="card ad-live"><div data-cam></div><div class="ch" style="padding-top:12px"><h3>Sa journée</h3><span class="chip ok dot">Au box, calme</span></div><div class="ad-dayl">'+
    [['07:10','A tout mangé, crottins normaux',0],['08:30','Paddock, Prairie du bas, 2 heures',0],[COURS.start,'Cours avec Pauline, '+arena(COURS).toLowerCase(),1],['17:00','Pansage et marcheur avec '+DPR.first,1]].map(function(e){return '<div class="'+(e[2]?'nx':'')+'"><span class="h">'+e[0]+'</span><span class="d"></span><span class="ellip'+(e[2]?' mut':'')+'">'+e[1]+'</span></div>'}).join('')+'</div></div></div>'+
   '<div class="ad-ps">'+SERVICES.slice(0,4).map(function(s){return '<button class="ad-pb" data-ps="'+s[0]+'">'+sq(s[1])+'<span class="grow" style="min-width:0"><b class="ellip">'+s[2].replace(' par un moniteur','').replace('Sortie au p','P')+'</b><small class="num">'+F.eur(s[4])+'</small></span></button>'}).join('')+'</div>'+
   U.tabs([['journal','Journal'],['soins','Soins'],['ration','Ration et travail'],['presta','Prestations'],['partage','Partage']],CH.tab,'data-ct')+'<div data-body style="margin-top:16px"></div>';
  var g=P.gl.horse($('.ad-3d .gl',el),{points:pts,walk:false,rot:-.9,onPick:function(id){if(id==='pied')careSheet(0);else{CH.tab='soins';$$('[data-ct]',el).forEach(function(x){x.setAttribute('aria-selected',x.getAttribute('data-ct')==='soins')});body();P.toast(pts.find(function(x){return x.id===id}).label,{icon:'care'})}}});
  var h0=$('.h3d',el);if(h0)h0.classList.add('show');
  boxCam($('[data-cam]',el),{tools:true});
  $('[data-full]',el).onclick=camSheet;$('[data-snap]',el).onclick=function(){P.toast('Photo enregistrée dans le journal d’Ulysse',{icon:'image'})};
  $$('[data-hv]',el).forEach(function(b){b.addEventListener('click',function(){CH.view=b.getAttribute('data-hv');$('.ad-hv',el).setAttribute('data-v',CH.view)})});
  $$('[data-ps]',el).forEach(function(b){b.onclick=function(){prestaSheet(b.getAttribute('data-ps'),function(){if(CH.tab==='presta')body()})}});
  $('[data-allp]',el).onclick=function(){CH.tab='presta';$$('[data-ct]',el).forEach(function(x){x.setAttribute('aria-selected',x.getAttribute('data-ct')==='presta')});body();$('[data-body]',el).scrollIntoView({behavior:'smooth',block:'start'})};
  var share=function(){var sh=P.sheet({title:'Inviter un proche',icon:'link',body:'<p class="s mut">Donnez accès au journal et à la caméra d’Ulysse à un proche, à votre vétérinaire ou à votre maréchal. Vous choisissez ce qu’il voit et vous pouvez retirer l’accès à tout moment.</p><div class="ad-lbl">Adresse e-mail ou numéro de téléphone</div><input class="in" placeholder="prenom@exemple.fr"><div class="ad-lbl">Ce qu’il pourra voir</div><div class="card list">'+[['Journal et photos',1],['Caméra du box',1],['Carnet de santé',0],['Factures',0]].map(function(x){return '<div class="li"><div class="grow t">'+x[0]+'</div>'+U.tog(!!x[1])+'</div>'}).join('')+'</div>',foot:'<button class="btn pri ad-full" data-ok>Envoyer l’invitation</button>'});$('[data-ok]',sh).onclick=function(){sh.close();P.toast('Invitation envoyée, valable 7 jours')}};
  $('[data-share]',el).onclick=share;bindHsel(el,P.rerender);$('[data-ride]',el).onclick=rideSheet;
  $$('[data-ct]',el).forEach(function(b){b.addEventListener('click',function(){CH.tab=b.getAttribute('data-ct');body()})});
  var CARE=[{k:'Maréchal',i:'hoof',who:'Benoît Gautier',when:'Jeudi 19 novembre à 9 h',note:'Ferrure complète, plaques aux antérieurs',pct:96,c:'warn',chip:'Dans 2 jours',price:95},
   {k:'Vermifuge',i:'pill',who:'Équipe du club',when:'Avant le 16 décembre',note:'Coproscopie d’abord, vermifuge seulement si besoin',pct:68,c:'acc',chip:'Dans 4 semaines',price:14},
   {k:'Ostéopathe',i:'bone',who:'Camille Hervé',when:'Conseillé en janvier',note:'Bilan tous les 6 mois, dernier le 10 juillet',pct:70,c:'acc',chip:'À prévoir',price:80},
   {k:'Dentiste',i:'tooth',who:'Pierre Valat',when:'Avril 2027',note:'Râpage annuel, dernier le 2 avril',pct:62,c:'ok',chip:'À jour'},
   {k:'Vaccins',i:'syringe',who:'Dr Leclerc',when:'Rappel avant le 30 juin 2027',note:'Grippe et rhinopneumonie, valables pour les concours FFE',pct:38,c:'ok',chip:'À jour'}];
  function careSheet(i){var c=CARE[i];var sh=P.sheet({title:c.k,icon:c.i,body:'<div class="card soft" style="padding:14px 16px"><div class="ad-sum"><span class="mut">Quand</span><b>'+c.when+'</b></div><div class="ad-sum"><span class="mut">Avec</span><b>'+c.who+'</b></div><div class="ad-sum"><span class="mut">Détail</span><b style="text-align:right">'+c.note+'</b></div>'+(c.price?'<div class="ad-sum"><span class="mut">Coût estimé</span><b class="num">'+F.eur(c.price)+', refacturé sans frais</b></div>':'')+'</div>'+
    (i===0?'<div class="ad-lbl">Qui tient Ulysse ?</div>'+opts([['club','L’équipe du club s’en occupe','Antoine le prépare et le tient, 8 €',sq('team')],['moi','Je serai présente','Vous recevez un rappel la veille',sq('user')]],'club','hold'):'')+
    '<div class="ad-lbl">Rappels</div><div class="card list"><div class="li"><div class="grow t">Me prévenir une semaine avant</div>'+U.tog(true)+'</div><div class="li"><div class="grow t">Me prévenir la veille</div>'+U.tog(true)+'</div><div class="li"><div class="grow t">Recevoir le compte rendu du praticien</div>'+U.tog(true)+'</div></div>',
    foot:'<button class="btn ad-full" data-mv>Déplacer</button><button class="btn pri ad-full" data-ok>'+(i===0?'Confirmer le rendez-vous':'Demander un rendez-vous')+'</button>'});bindOpts(sh);
   $('[data-mv]',sh).onclick=function(){sh.close();P.toast('Demande de report envoyée à '+c.who,{icon:'calendar_add'})};$('[data-ok]',sh).onclick=function(){sh.close();P.toast(i===0?'Rendez-vous confirmé, Antoine tiendra Ulysse jeudi à 9 h':'Demande envoyée, le club vous propose une date sous 24 heures')}}
  function body(){var b=$('[data-body]',el),h='';
   if(CH.tab==='journal'){var all=A.journal.concat(D.journal.filter(function(j){return j.horse==='h01'}));
    h='<div class="g3" style="--g:16px"><div class="span2 stack" style="--g:14px"><div class="card" style="padding:16px"><div class="hrow" style="--g:12px;align-items:flex-start">'+U.av('m001')+'<div class="grow"><textarea class="in" id="ad-jt" placeholder="Racontez la séance, laissez une consigne ou une observation…" style="min-height:74px"></textarea>'+
      '<div data-jph></div><div class="hrow wrap" style="--g:6px;margin-top:10px">'+['Travail','Balade','Soin','Consigne'].map(function(t,i){return '<button class="tag" data-manual data-jk="'+t.toLowerCase()+'" aria-pressed="'+(i===0)+'">'+t+'</button>'}).join('')+'</div>'+
      '<div class="hrow sp wrap" style="margin-top:12px;--g:10px"><div class="hrow" style="--g:8px"><span class="s mut">Ressenti</span><span class="ad-mood" data-mood>'+[1,2,3,4,5].map(function(i){return '<button class="'+(i<=4?'on':'')+'" data-m="'+i+'" title="'+i+' sur 5">'+ICON('heart')+'</button>'}).join('')+'</span></div><div class="hrow" style="--g:8px"><button class="btn" data-jp title="Ajouter une photo">'+ICON('image','sm')+'Photo</button><button class="btn pri" data-jpub>'+ICON('send','sm')+'Publier</button></div></div>'+
      '<div class="xs mut" style="margin-top:10px">'+ICON('eye','sm')+' Visible par vous, '+DPR.first+' et l’équipe du club</div></div></div></div>'+
     '<div class="card" data-jl>'+all.map(function(j,i){var who=D.person(j.who);return '<div class="ad-j'+(j.isNew?' new':'')+'">'+U.av(j.who)+'<div class="grow"><div class="hrow wrap" style="--g:6px"><b class="s">'+who.first+' '+who.last+'</b>'+U.chip(j.role,j.who==='m001'?'acc':'line')+'<span class="xs mut" style="margin-left:auto">'+j.when+'</span></div><p>'+F.esc(j.text)+'</p>'+(j.photo?'<div class="ad-photo">'+HORSE_GLYPH()+'<span>Photo ajoutée à 9 h 41</span></div>':'')+
       '<div class="hrow" style="--g:12px;margin-top:8px">'+moodRO(j.mood)+'<span class="chip">'+cap(j.kind)+'</span><button class="ad-like" data-manual data-like="'+i+'" aria-pressed="'+(!!j.liked)+'" style="margin-left:auto">'+ICON('heart','sm')+'<span>'+(j.liked?'Merci envoyé':'Dire merci')+'</span></button></div></div></div>'}).join('')+'</div></div>'+
     '<div class="stack" style="--g:14px"><div class="card ad-b"><div class="ch"><h3>Cette semaine</h3><span class="xs mut">4 séances</span></div><div class="cb"><div class="hrow" style="--g:14px">'+U.ring(Math.round(UL.work/UL.workMax*100),UL.work+' h','var(--acc)',64)+'<div class="grow"><div class="b">Charge de travail équilibrée</div><div class="s mut">'+UL.work+' heures sur '+UL.workMax+' recommandées au maximum</div></div></div><div class="note">'+ICON('sensor','sm')+'<span>Capteur de selle hier : 52 minutes, dont 38 % au galop.</span></div></div></div>'+
      '<div class="card ad-b"><div class="ch"><h3>Prochain soin</h3><button class="btn ghost sm" data-tosoins>Tous'+ICON('arrow','sm')+'</button></div><div class="cb"><div class="ad-row">'+sq('hoof','warn')+'<div class="grow"><div class="t">Maréchal, jeudi à 9 h</div><div class="s">Benoît Gautier · ferrure complète</div></div></div></div></div></div></div>'}
   else if(CH.tab==='soins'){h='<div class="g2" style="--g:16px"><div class="card"><div class="ch"><h3>À venir</h3><button class="btn sm" data-rdv>'+ICON('plus','sm')+'Demander un rendez-vous</button></div><div style="padding:8px 0">'+CARE.map(function(c,i){return '<div class="ad-care ad-tap" data-care="'+i+'">'+sq(c.i,c.c)+'<div style="min-width:0"><div class="hrow" style="--g:8px"><b class="s">'+c.k+'</b><span class="xs mut ellip">'+c.who+'</span></div><div class="s" style="color:var(--ink-2)">'+c.when+'</div><div style="margin-top:6px;max-width:220px">'+U.bar(c.pct,'var(--'+c.c+')')+'</div></div>'+U.chip(c.chip,c.c==='acc'?'':c.c,true)+'</div>'}).join('')+'</div></div>'+
     '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>Carnet de santé</h3><button class="btn ghost sm" data-dl="Carnet de santé d’Ulysse">'+ICON('download','sm')+'PDF</button></div><div class="cb"><div class="tl">'+D.care.filter(function(c){return c.horse==='h01'&&c.status==='fait'}).map(function(c){return '<div class="ev" style="--c:var(--ok)"><div class="hrow sp"><b class="s">'+c.kind+' · '+c.who+'</b><span class="xs mut">'+F.dateY(c.date)+'</span></div><div class="s mut">'+c.note+'</div></div>'}).join('')+
      '<div class="ev" style="--c:var(--ok);padding-bottom:0"><div class="hrow sp"><b class="s">Dentiste · Pierre Valat</b><span class="xs mut">2 avr. 2026</span></div><div class="s mut">Râpage annuel, une surdent retirée</div></div></div></div></div>'+
      '<div class="card"><div class="ch"><h3>Documents</h3></div><div class="list" style="padding:6px 0">'+[['Livret SIRE et carte d’immatriculation','N° '+UL.sire],['Compte rendu du bilan locomoteur','Dr Leclerc, 18 octobre'],['Radios des antérieurs','4 clichés, mars 2025'],['Attestation d’assurance','Responsabilité civile et mortalité']].map(function(d){return '<div class="li click" data-dl="'+d[0]+'">'+sq('doc')+'<div class="grow"><div class="t ellip">'+d[0]+'</div><div class="s ellip">'+d[1]+'</div></div>'+ICON('download','sm')+'</div>'}).join('')+'</div></div></div></div>'}
   else if(CH.tab==='ration'){var wk=[[45,0,0],[60,0,0],[0,0,0],[0,50,0],[90,0,0],[0,45,0],[0,0,45]],wl=['Mer','Jeu','Ven','Sam','Dim','Lun','Mar'];
    h='<div class="g2" style="--g:16px"><div class="card"><div class="ch"><div><h3>Ration du jour</h3><div class="xs mut">'+UL.ration.hay+' kg de foin et '+String(UL.ration.grain).replace('.',',')+' L de granulés par jour</div></div><button class="btn sm" data-rat>'+ICON('edit','sm')+'Demander un changement</button></div><div style="padding:8px 0">'+
      [['Matin','07:00','3 kg de foin, 1 L de granulés floconnés','Tout mangé','ok'],['Midi','12:00','2 kg de foin','Dans 2 h','' ],['Soir','18:00','3 kg de foin, 1,5 L de granulés, '+UL.ration.supp.toLowerCase(),'Prévu','']].map(function(m){return '<div class="ad-meal"><div><div class="b s">'+m[0]+'</div><div class="xs mut num">'+m[1]+'</div></div><div class="s" style="color:var(--ink-2)">'+m[2]+'</div>'+U.chip(m[3],m[4],!!m[4])+'</div>'}).join('')+'</div>'+
      '<div class="cf" style="flex-wrap:wrap"><span class="chip">'+ICON('drop','sm')+' 28 L bus hier, normal</span><span class="chip">'+ICON('hay','sm')+' Foin de prairie, analyse du 3 nov.</span></div></div>'+
     '<div class="card"><div class="ch"><div><h3>Travail des 7 derniers jours</h3><div class="xs mut">Minutes par jour, selon qui monte</div></div>'+U.ring(Math.round(UL.work/UL.workMax*100),UL.work+' h','var(--acc)',48)+'</div><div class="cb">'+bars(wk,wl,{h:170,colors:['var(--acc)','var(--c4)','var(--c3)'],fmt:function(v){return Math.round(v)+''}})+
      '<div class="hrow sp wrap" style="margin-top:10px;--g:8px">'+C.legend([['Vous','var(--acc)'],[DPR.first,'var(--c4)'],['Moniteur','var(--c3)']])+'<span class="s mut">Vendredi : repos au paddock</span></div>'+
      '<div class="g3" style="--g:8px;margin-top:14px;grid-template-columns:repeat(3,minmax(0,1fr))">'+[['34 %','Au pas'],['28 %','Au trot'],['38 %','Au galop']].map(function(x){return '<div class="card soft" style="padding:10px 12px"><div class="disp bb num" style="font-size:18px">'+x[0]+'</div><div class="xs mut">'+x[1]+'</div></div>'}).join('')+'</div></div></div></div>'}
   else if(CH.tab==='presta'){h='<div class="g3" style="--g:16px"><div class="span2"><div class="ad-svc">'+SERVICES.map(function(s){return '<button class="card hover ad-sv" data-ps2="'+s[0]+'">'+sq(s[1])+'<b class="s">'+s[2]+'</b><span class="xs mut">'+s[3]+'</span><span class="p s">'+F.eur(s[4])+'</span></button>'}).join('')+'</div></div>'+
     '<div class="card ad-b"><div class="ch"><h3>Mes demandes</h3><span class="chip">'+A.asks.length+'</span></div><div style="padding:8px 0">'+A.asks.map(function(a){return '<div class="li"><div class="grow"><div class="t ellip">'+a.name+'</div><div class="s ellip">'+a.when+' · '+F.eur(a.price)+'</div></div>'+U.chip(a.status,a.k,true)+'</div>'}).join('')+'</div><div class="cf"><span class="s mut">Facturées avec la pension, détail dans Paiements.</span></div></div></div>'}
   else{var names={lea:'Vous',dp:DPR.first,rest:'Repos'},wd=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'];
    h='<div class="g3" style="--g:16px"><div class="span2 stack" style="--g:14px"><div class="card"><div class="ch"><div><h3>Qui monte Ulysse cette semaine</h3><div class="xs mut">Touchez un jour pour le céder, l’échanger ou mettre Ulysse au repos</div></div></div><div class="cb"><div class="ad-wk">'+A.week.map(function(w,i){return '<button class="ad-wd'+(w==='dp'?' dp':'')+(i===1?' today':'')+'" data-wd="'+i+'"><span class="w">'+wd[i]+' '+D.day(i-1).getDate()+'</span>'+(w==='rest'?'<span class="rest">'+ICON('moon','sm')+'</span>':U.av(w==='lea'?'m001':DP.rider))+'<span class="n ellip">'+names[w]+'</span></button>'}).join('')+'</div></div></div>'+
     (A.swap===undefined?'<div class="card" style="padding:16px"><div class="hrow" style="--g:12px;align-items:flex-start">'+U.av(DP.rider)+'<div class="grow"><div class="b">'+DPR.first+' propose un échange</div><div class="s mut">Elle voudrait monter dimanche 29 au lieu de samedi 28, pour un stage de dressage.</div><div class="hrow" style="--g:8px;margin-top:12px"><button class="btn" data-sw="0">Refuser</button><button class="btn dark" data-sw="1">Accepter l’échange</button></div></div></div></div>':'<div class="note '+(A.swap?'ok':'')+'">'+ICON(A.swap?'checkc':'info','sm')+'<span>'+(A.swap?'Échange accepté : '+DPR.first+' montera dimanche 29, vous récupérez samedi 28.':'Échange refusé. '+DPR.first+' est prévenue.')+'</span></div>')+
     '<div class="card"><div class="ch"><h3>Ce que '+DPR.first+' peut faire</h3></div><div class="list" style="padding:6px 0">'+[['Sauter jusqu’à 90 cm','Uniquement en reprise encadrée',1],['Sortir en extérieur','Accompagnée, au pas et au trot',1],['Engager Ulysse en concours','Avec votre accord à chaque fois',0],['Demander des prestations','Elles sont facturées sur son compte',1]].map(function(x){return '<div class="li"><div class="grow"><div class="t">'+x[0]+'</div><div class="s">'+x[1]+'</div></div>'+U.tog(!!x[2])+'</div>'}).join('')+'</div></div></div>'+
     '<div class="stack" style="--g:14px"><div class="card ad-b"><div class="ch"><h3>Demi-pension</h3>'+U.chip('Active','ok',true)+'</div><div class="cb"><div class="ad-row">'+U.av(DP.rider,'lg')+'<div class="grow"><div class="t">'+DPR.first+' '+DPR.last+'</div><div class="s">Galop '+DPR.galop+' · depuis le 1er septembre</div></div></div><div><div class="ad-sum"><span class="mut">Jours</span><b>Mardi et samedi</b></div><div class="ad-sum"><span class="mut">Participation</span><b class="num">180 € par mois</b></div><div class="ad-sum"><span class="mut">Déduits de votre pension</span><b class="okc">Automatique</b></div></div>'+
      '<div class="hrow" style="--g:8px"><button class="btn grow" data-go="adh-messages" data-id="t-dp">'+ICON('chat','sm')+'Écrire</button><button class="btn grow" data-go="adh-demipension">Gérer</button></div></div></div>'+
      '<button class="btn block" data-share>'+ICON('link','sm')+'Inviter un proche ou un praticien</button>'+
      (toSign().length?'<div class="note warn">'+ICON('sign','sm')+'<span>L’avenant de renouvellement de la demi-pension attend votre signature. <a href="#adh-contrats" data-go="adh-contrats" data-id="ct2" class="b">Signer maintenant</a></span></div>':'')+'</div></div>'}
   b.innerHTML=h;P.animate(b);swIn(b);$$('[data-share]',b).forEach(function(x){x.onclick=share});
   $$('[data-care]',b).forEach(function(x){x.onclick=function(){careSheet(+x.getAttribute('data-care'))}});
   $$('[data-dl]',b).forEach(function(x){x.onclick=function(){P.toast(x.getAttribute('data-dl')+' téléchargé',{icon:'download'})}});
   $$('[data-ps2]',b).forEach(function(x){x.onclick=function(){prestaSheet(x.getAttribute('data-ps2'),body)}});
   var ts=$('[data-tosoins]',b);if(ts)ts.onclick=function(){CH.tab='soins';$$('[data-ct]',el).forEach(function(x){x.setAttribute('aria-selected',x.getAttribute('data-ct')==='soins')});body()};
   var rd=$('[data-rdv]',b);if(rd)rd.onclick=function(){var sh=P.sheet({title:'Demander un rendez-vous',icon:'care',body:'<div class="ad-lbl">Pour quel soin ?</div><div class="hrow wrap" style="--g:6px">'+['Vétérinaire','Maréchal','Ostéopathe','Dentiste','Vaccin','Autre'].map(function(t,i){return '<button class="tag" aria-pressed="'+(i===0)+'">'+t+'</button>'}).join('')+'</div><div class="ad-lbl">Praticien</div><select class="in"><option>Dr Leclerc, vétérinaire du club</option><option>Mon propre praticien</option></select><div class="ad-lbl">Ce que vous avez remarqué</div><textarea class="in" placeholder="Par exemple : raide à main gauche depuis trois jours"></textarea><div class="ad-lbl">Urgence</div>'+U.seg([['n','Cette semaine'],['u','Sous 48 heures'],['uu','Aujourd’hui']],'n'),foot:'<button class="btn pri ad-full" data-ok>Envoyer la demande au club</button>'});$('[data-ok]',sh).onclick=function(){sh.close();P.toast('Demande envoyée, Claire vous propose un créneau sous 24 heures')}};
   var rt=$('[data-rat]',b);if(rt)rt.onclick=function(){var sh=P.sheet({title:'Changer la ration',icon:'feed',body:'<p class="s mut">Votre demande est validée par Claire avant d’être appliquée à la distribution.</p><div class="g2" style="--g:12px;margin-top:14px;grid-template-columns:repeat(2,minmax(0,1fr))"><label class="field"><span>Foin par jour (kg)</span><input class="in num" value="'+UL.ration.hay+'"></label><label class="field"><span>Granulés par jour (L)</span><input class="in num" value="2,5"></label></div><div class="ad-lbl">Complément</div><div class="hrow wrap" style="--g:6px">'+['Ail','Huile de lin','Électrolytes','Biotine','Levures'].map(function(t,i){return '<button class="tag" aria-pressed="'+(i===0)+'">'+t+'</button>'}).join('')+'</div><div class="ad-lbl">Raison</div><textarea class="in" placeholder="Par exemple : plus de travail avant le concours"></textarea>',foot:'<button class="btn pri ad-full" data-ok>Envoyer la demande</button>'});$('[data-ok]',sh).onclick=function(){sh.close();P.toast('Demande de ration envoyée à Claire Dumont')}};
   $$('[data-sw]',b).forEach(function(x){x.onclick=function(){A.swap=x.getAttribute('data-sw')==='1';body();P.toast(A.swap?'Échange accepté, les deux agendas sont à jour':'Échange refusé',{icon:'swap'})}});
   $$('[data-wd]',b).forEach(function(x){x.onclick=function(){var i=+x.getAttribute('data-wd'),wd2=['Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi','Dimanche'];
     var sh=P.sheet({title:wd2[i]+' '+F.date(D.day(i-1)),icon:'swap',body:opts([['lea','Je monte Ulysse','Le créneau vous est réservé',U.av('m001')],['dp',DPR.first+' monte Ulysse','Elle reçoit une proposition à accepter',U.av(DP.rider)],['rest','Jour de repos','Paddock le matin, pas de travail',sq('moon')]],A.week[i],'who'),foot:'<button class="btn pri ad-full" data-ok>Enregistrer</button>'});bindOpts(sh);
     $('[data-ok]',sh).onclick=function(){var v=optVal(sh,'who'),ch=v!==A.week[i];A.week[i]=v;sh.close();body();P.toast(!ch?'Rien n’a changé':v==='dp'?'Proposition envoyée à '+DPR.first:v==='rest'?'Jour de repos noté, l’équipe est prévenue':'Créneau repris, '+DPR.first+' est prévenue',{icon:'swap'})}}});
   /* journal */
   var pub=$('[data-jpub]',b);if(pub){var mood=4,photo=false;
    $$('[data-m]',b).forEach(function(m){m.onclick=function(){mood=+m.getAttribute('data-m');$$('[data-m]',b).forEach(function(y){y.classList.toggle('on',+y.getAttribute('data-m')<=mood)})}});
    $$('[data-jk]',b).forEach(function(t){t.onclick=function(){$$('[data-jk]',b).forEach(function(y){y.setAttribute('aria-pressed',y===t)})}});
    $('[data-jp]',b).onclick=function(){photo=!photo;$('[data-jph]',b).innerHTML=photo?'<div class="ad-photo pop" style="height:110px">'+HORSE_GLYPH()+'<span>IMG_2026-11-17.jpg</span></div>':'';P.toast(photo?'Photo ajoutée':'Photo retirée',{icon:'image'})};
    pub.onclick=function(){var ta=$('#ad-jt',b),tx=ta.value.trim();if(!tx){ta.focus();ta.value='';ta.placeholder='Écrivez quelques mots avant de publier.';return}
      A.journal.unshift({horse:'h01',who:'m001',role:'Propriétaire',when:'À l’instant',text:tx,kind:$('[data-jk][aria-pressed="true"]',b).getAttribute('data-jk'),mood:mood,photo:photo,isNew:true});body();A.journal[0].isNew=false;P.toast('Publié dans le journal, '+DPR.first+' et l’équipe sont prévenus')};
    $$('[data-like]',b).forEach(function(x){x.onclick=function(){var j=all[+x.getAttribute('data-like')];j.liked=!j.liked;x.setAttribute('aria-pressed',j.liked);$('span',x).textContent=j.liked?'Merci envoyé':'Dire merci'}})}
  }
  body();
 }});
P.tourSteps.push({route:'adh-cheval',title:'Son cheval dans la poche',text:'Léa voit Ulysse en direct dans son box, lit le journal partagé avec sa demi-pensionnaire et l’équipe, et commande une sortie au paddock ou une douche en deux gestes. La prestation part sur le téléphone du palefrenier et s’ajoute seule à la facture.'});

/* =====================================================================
   5. DEMI-PENSION : côté propriétaire et côté cavalier
   ===================================================================== */
P.css(`
.ad-an{padding:24px;display:flex;flex-direction:column;gap:16px}
.ad-an .hd{display:flex;gap:16px;align-items:flex-start}
.ad-an h3{font-size:26px;line-height:1.1;letter-spacing:-.03em;color:var(--d-ink)}
@container main (max-width:620px){.ad-an{padding:20px}.ad-an .hd{flex-wrap:wrap;gap:12px 14px;justify-content:space-between}.ad-an .hd>.grow{order:3;flex-basis:100%}.ad-an h3{font-size:24px}.ad-anb .btn{flex:1 1 auto}.ad-kv>div{padding:12px}.ad-kv b{font-size:26px}}
.ad-an .chip{background:color-mix(in srgb,var(--surface) 72%,transparent)}
.ad-an .chip.ok{background:var(--ok-pale)}
.ad-an p{color:inherit!important;opacity:.9}
.ad-kv{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.ad-kv>div{padding:14px 16px;border-radius:18px;background:var(--surface-2)}
.ad-an .ad-kv>div{background:color-mix(in srgb,var(--surface) 66%,transparent)}
.ad-kv b{display:block;font:800 30px/1.1 var(--f-display);letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.ad-kv span{font-size:13.5px!important}
.ad-kv span{font-size:13px;color:var(--mut)}
.ad-cand{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;padding:16px;position:relative;cursor:pointer;transition:background var(--t-1)}
.ad-cand:hover{background:var(--surface-2)}
.ad-cand+.ad-cand::before{content:"";position:absolute;left:16px;right:16px;top:0;height:1px;background:var(--line)}
.ad-earn{position:relative;overflow:hidden}
.ad-earn .illu.corner{position:absolute;right:4px;top:4px;width:100px;height:92px;pointer-events:none}
.ad-earn .ch{padding-right:100px}
.ad-earn .sub{font-size:14.5px;line-height:1.45;opacity:.85}
.ad-stars{display:inline-flex}
.ad-stars button{width:30px;height:30px;display:grid;place-items:center;color:var(--line-2);transition:transform var(--t-2) var(--e-spring)}
.ad-stars button.on{color:var(--c4)}.ad-stars button.on svg{fill:currentColor}
.ad-stars button:active{transform:scale(1.3)}
.ad-of{padding:16px;display:flex;flex-direction:column;gap:12px}
.ad-rng{width:100%;accent-color:var(--acc);height:28px}
.ad-wkm{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;font-size:13px;color:var(--mut);font-weight:600}
.ad-wkm i{display:block;height:28px;border-radius:8px;background:color-mix(in srgb,var(--acc) 30%,var(--surface));margin-bottom:4px}
.ad-wkm i.dp{background:color-mix(in srgb,var(--c4) 55%,var(--surface))}.ad-wkm i.rest{background:var(--bg-2)}
`);
D.adhOffers=D.adhOffers||[
 {id:'o4',horse:'h25',days:'Lundi et jeudi',level:'Galop 6',price:190,note:'Cheval de dressage niveau Amateur 2, travaillé avec Julien Mercier une fois par mois.',applicants:2,disc:'Dressage'},
 {id:'o5',horse:'h30',days:'Mercredi et dimanche',level:'Galop 5',price:160,note:'Franc et généreux à l’obstacle. Concours Club possibles au printemps.',applicants:4,disc:'CSO'},
 {id:'o6',horse:'h38',days:'3 jours au choix',level:'Galop 7',price:240,note:'Cheval de complet, demande un cavalier confirmé et disponible en semaine.',applicants:0,disc:'Concours complet'}];
var CANDS=[{id:'m019',st:'Retenue',k:'ok',info:'Galop 6 · au club depuis 2021',msg:'En place depuis le 1er septembre. Thomas la suit en reprise le mardi.',rate:5,avis:'Main douce, régulière, très à l’écoute du cheval.'},
 {id:'m078',st:'Nouvelle',k:'acc',info:'Galop 7 · 50 ans · cavalière de dressage',msg:'Je cherche deux jours par semaine pour travailler sur le plat. Disponible en journée, je connais bien les chevaux sensibles.',rate:0,avis:'Très bon niveau sur le plat, peu d’expérience à l’obstacle.'},
 {id:'m044',st:'Nouvelle',k:'acc',info:'Galop 5 · 15 ans · équipe concours',msg:'J’adore Ulysse, je le vois tous les mercredis. Mes parents sont d’accord pour 180 €.',rate:0,avis:'Motivée, encore un peu juste pour un cheval sensible.',low:true}];
var DS={side:'owner',disc:'Tous',max:250,mine:false,online:true};
function candSheet(c,after){var m=D.member(c.id);
  var sh=P.sheet({title:m.first+' '+m.last,icon:'user',body:'<div class="hrow" style="--g:14px">'+U.av(c.id,'xl')+'<div class="grow"><div class="hrow wrap" style="--g:6px">'+U.chip(c.st,c.k,true)+(c.low?U.chip('Sous le niveau demandé','warn'):U.chip('Niveau conforme','ok'))+'</div><div class="s mut" style="margin-top:6px">'+c.info+'</div></div></div>'+
    '<div class="ad-lbl">Son message</div><p class="s" style="color:var(--ink-2);line-height:1.55">'+c.msg+'</p>'+
    '<div class="ad-lbl">Ce que Piaffe sait d’elle</div><div class="card list"><div class="li">'+sq('trend')+'<div class="grow"><div class="t">'+(c.low?'34':'61')+' heures en selle depuis septembre</div><div class="s">'+(c.low?'2 reprises par semaine':'3 séances par semaine en moyenne')+'</div></div></div><div class="li">'+sq('whistle')+'<div class="grow"><div class="t">Avis de Thomas Roux, moniteur</div><div class="s">'+c.avis+'</div></div></div><div class="li">'+sq('checkc','ok')+'<div class="grow"><div class="t">Licence et assurance à jour</div><div class="s">Aucun impayé au club</div></div></div></div>'+
    '<div class="ad-lbl">Votre note (visible de vous seule)</div><span class="ad-stars" data-st>'+[1,2,3,4,5].map(function(i){return '<button class="'+(i<=c.rate?'on':'')+'" data-s="'+i+'" title="'+i+' sur 5">'+ICON('star')+'</button>'}).join('')+'</span>',
    foot:c.st==='Retenue'?'<button class="btn ad-full" data-go="adh-messages" data-id="t-dp">'+ICON('chat','sm')+'Écrire</button><button class="btn pri ad-full" data-go="adh-contrats" data-id="ct2">Signer l’avenant</button>':'<button class="btn ad-full" data-no>Refuser poliment</button><button class="btn pri ad-full" data-try>Proposer un essai</button>'});
  $$('[data-s]',sh).forEach(function(b){b.onclick=function(){c.rate=+b.getAttribute('data-s');$$('[data-s]',sh).forEach(function(x){x.classList.toggle('on',+x.getAttribute('data-s')<=c.rate)});if(after)after()}});
  var t=$('[data-try]',sh);if(t){t.onclick=function(){c.st='Essai proposé';c.k='warn';sh.close();if(after)after();P.toast('Essai proposé à '+m.first+' samedi à 14 h, avec Thomas')};
   $('[data-no]',sh).onclick=function(){c.st='Refusée';c.k='';sh.close();if(after)after();P.toast('Réponse envoyée à '+m.first+', avec un mot gentil',{undo:function(){c.st='Nouvelle';c.k='acc';if(after)after()}})}}}
function applySheet(o,after){var h=D.horse(o.horse),p=prof();
  var sh=P.sheet({title:'Postuler pour '+h.name.split(' ')[0],icon:'send',body:'<div class="card soft" style="padding:14px 16px"><div class="hrow" style="--g:12px">'+U.hav(h,'lg')+'<div class="grow"><div class="b">'+h.name+'</div><div class="s mut">'+o.days+' · '+F.eur(o.price)+' par mois</div></div></div></div>'+
    '<div class="ad-lbl">Votre profil, joint automatiquement</div><div class="card list"><div class="li">'+U.av(p)+'<div class="grow"><div class="t">'+p.first+' '+p.last+', Galop '+p.galop+'</div><div class="s">Au club depuis '+p.since+' · licence 2027 · avis de vos moniteurs</div></div>'+U.chip(p.galop>=parseInt(o.level.replace(/\D/g,''),10)?'Niveau conforme':'Sous le niveau','ok',true)+'</div></div>'+
    '<div class="ad-lbl">Jours souhaités</div><div class="hrow wrap" style="--g:6px">'+['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(function(d,i){return '<button class="tag" aria-pressed="'+(i===2||i===6)+'">'+d+'</button>'}).join('')+'</div>'+
    '<div class="ad-lbl">Votre message au propriétaire</div><textarea class="in" style="min-height:110px">Bonjour, je monte au club depuis '+p.since+' et je cherche une demi-pension pour progresser régulièrement. Je serais ravie de faire un essai quand cela vous arrange.</textarea>'+
    '<div class="note" style="margin-top:14px">'+ICON('shield','sm')+'<span>Si vous êtes retenue, le contrat et l’assurance se signent dans Piaffe et la participation est prélevée avec vos autres factures.</span></div>',
    foot:'<button class="btn pri lg ad-full" data-ok>'+ICON('send','sm')+'Envoyer ma candidature</button>'});
  $('[data-ok]',sh).onclick=function(){spin($('[data-ok]',sh),function(){A.applied[o.id]=true;success(sh,{title:'Candidature envoyée',text:'Le propriétaire de '+h.name.split(' ')[0]+' reçoit votre profil et votre message. Vous serez prévenue dès sa réponse.'});if(after)after()})}}

P.mod({id:'adh-demipension',role:'adherent',group:'Cheval',title:'Demi-pension',icon:'swap',n:20,
 badge:function(){return {v:2}},
 render:function(el){
  el.innerHTML=U.ph('Demi-pension','Partagez Ulysse en toute confiance, ou trouvez un cheval à monter deux jours par semaine.','<button class="btn pri" data-newo>'+ICON('plus','sm')+'Nouvelle annonce</button>')+U.seg([['owner','Mon annonce'],['rider','Chercher une demi-pension']],DS.side,'data-side')+'<div data-body style="margin-top:16px"></div>';
  $$('[data-side]',el).forEach(function(b){b.addEventListener('click',function(){DS.side=b.getAttribute('data-side');body()})});
  function body(){var b=$('[data-body]',el),h='',o=D.halfboardOffers[0];
   if(DS.side==='owner'){
    h='<div class="g3" style="--g:16px"><div class="span2 stack" style="--g:14px">'+A.myOffers.map(function(x){return offerCard(x)}).join('')+'<div class="card tint d-chevaux ad-an"><div class="hd">'+U.hav(UL,'xl')+'<div class="grow"><div class="hrow wrap" style="--g:6px;margin-bottom:6px">'+U.chip(DS.online?'En ligne':'Suspendue',DS.online?'ok':'',true)+'<span class="xs mut">Publiée il y a 12 jours, visible des adhérents du club</span></div><h3>Ulysse de la Roche cherche son cavalier</h3></div><div class="hrow" style="--g:8px"><span class="xs mut hide-s">'+(DS.online?'Visible':'Masquée')+'</span>'+U.tog(DS.online,'ad-online')+'</div></div>'+
      '<div class="hrow wrap" style="--g:6px">'+U.chip(ICON('planning','sm')+' '+o.days,'lg')+U.chip(ICON('medal','sm')+' '+o.level,'lg')+U.chip(ICON('euro','sm')+' '+F.eur(o.price)+' par mois','lg')+U.chip(ICON('jump','sm')+' CSO et plat','lg')+'</div>'+
      '<p style="color:var(--ink-2);line-height:1.55">'+o.note+' Hongre Selle Français de 11 ans, 1,68 m, sorti en Club Élite. Reprises encadrées le mardi, travail libre le samedi.</p>'+
      '<div class="ad-kv"><div><b data-count="124">124</b><span>vues de l’annonce</span></div><div><b>'+CANDS.length+'</b><span>candidatures</span></div><div><b>'+CANDS.filter(function(c){return c.st==='Nouvelle'}).length+'</b><span>à étudier</span></div></div>'+
      '<div class="hrow wrap ad-anb" style="--g:8px"><button class="btn" data-edit>'+ICON('edit','sm')+'Modifier l’annonce</button><button class="btn" data-copy>'+ICON('link','sm')+'Copier le lien</button><button class="btn" data-boost>'+ICON('globe','sm')+'Publier hors du club</button></div></div>'+
     '<div class="card"><div class="ch"><h3>Candidats</h3><span class="xs mut">Classés par compatibilité</span></div><div style="padding:6px 0">'+CANDS.map(function(c,i){var m=D.member(c.id);return '<div class="ad-cand" data-cand="'+i+'">'+U.av(c.id,'lg')+'<div style="min-width:0"><div class="hrow wrap" style="--g:6px"><b>'+m.first+' '+m.last+'</b>'+U.chip(c.st,c.k,true)+(c.low?U.chip('Sous le niveau','warn'):'')+'<span style="margin-left:auto" class="ad-rate">'+(c.rate?ICON('star')+c.rate+',0':'<span class="xs mut" style="font-weight:500">À noter</span>')+'</span></div><div class="s mut">'+c.info+'</div><p class="s ellip" style="color:var(--ink-2);margin-top:4px">'+c.msg+'</p></div></div>'}).join('')+'</div></div></div>'+
     '<div class="stack" style="--g:14px"><div class="card ad-b"><div class="ch"><h3>Avenant de renouvellement</h3>'+(toSign().length?U.chip('À signer','acc',true):U.chip('Signé','ok',true))+'</div><div class="cb"><div class="ad-row">'+U.av(DP.rider)+'<div class="grow"><div class="t">'+DPR.first+' '+DPR.last+'</div><div class="s">Mardi et samedi · 180 € par mois</div></div></div>'+
       '<div class="s mut">Demi-pension en place depuis le 1er septembre. L’avenant la renouvelle aux mêmes conditions : assurance, frais vétérinaires, préavis d’un mois.</div><button class="btn block end" data-go="adh-contrats" data-id="ct2">'+ICON('sign','sm')+(toSign().length?'Signer l’avenant':'Voir l’avenant signé')+'</button></div></div>'+
      '<div class="card ad-b"><div class="ch"><h3>Planning partagé</h3><span class="xs mut">Cette semaine</span></div><div class="cb"><div class="ad-wkm">'+A.week.map(function(w,i){return '<div><i class="'+(w==='dp'?'dp':w==='rest'?'rest':'')+'"></i>'+'LMMJVSD'.charAt(i)+'</div>'}).join('')+'</div>'+C.legend([['Vous','var(--acc-pale)'],[DPR.first,'color-mix(in srgb,var(--c4) 55%,var(--surface))'],['Repos','var(--bg-2)']])+'<button class="btn block end" data-go="adh-cheval" data-p-tab="partage">Ouvrir le planning partagé</button></div></div>'+
      '<div class="card tint d-argent ad-b ad-earn">'+ILLU.selle({size:null,cls:'corner'})+'<div class="ch"><h3>Ce que ça vous rapporte</h3></div><div class="cb"><div><div class="big num" data-count="540" data-fmt="eur">540 €</div><div class="sub" style="margin-top:8px">déduits de votre pension depuis septembre, soit 180 € par mois sans rien avoir à réclamer.</div></div></div></div></div></div>'}
   else{var all=D.halfboardOffers.slice(1).map(function(x,i){return Object.assign({disc:i?'Balade':'CSO'},x)}).concat(D.adhOffers),ls=all.filter(function(x){return (DS.disc==='Tous'||x.disc===DS.disc)&&x.price<=DS.max&&(!DS.mine||parseInt(x.level.replace(/\D/g,''),10)<=prof().galop)});
    h='<div class="card" style="padding:14px 16px;margin-bottom:14px"><div class="hrow wrap" style="--g:12px 20px"><div class="ad-filt scroll-x grow" style="margin:0;padding:2px">'+['Tous','CSO','Dressage','Balade','Concours complet'].map(function(t){return '<button class="tag" data-manual data-dd="'+t+'" aria-pressed="'+(t===DS.disc)+'">'+t+'</button>'}).join('')+'</div>'+
      '<label class="hrow" style="--g:10px;min-width:220px;flex:1"><span class="s mut" style="white-space:nowrap">Budget max</span><input type="range" class="ad-rng" min="100" max="250" step="10" value="'+DS.max+'" data-max><b class="s num" data-maxv style="width:48px;text-align:right">'+F.eur(DS.max)+'</b></label>'+
      '<label class="hrow" style="--g:8px"><span class="s">À mon niveau</span>'+U.tog(DS.mine,'ad-mine')+'</label></div></div><div data-of></div>';
    }
   b.innerHTML=h;P.animate(b);swIn(b);
   if(DS.side==='owner'){
    $$('[data-mot]',b).forEach(function(x){x.onclick=function(){var o=A.myOffers.find(function(y){return y.id===x.getAttribute('data-mot')});o.online=!o.online;body();P.toast(o.online?'Annonce remise en ligne':'Annonce suspendue',{icon:o.online?'eye':'eye_off'})}});
    $$('[data-mod2]',b).forEach(function(x){x.onclick=function(){var i=A.myOffers.findIndex(function(y){return y.id===x.getAttribute('data-mod2')}),o=A.myOffers.splice(i,1)[0];body();P.toast('Annonce supprimée',{icon:'trash',undo:function(){A.myOffers.splice(i,0,o);body()}})}});
    $('#ad-online',b).addEventListener('click',function(){DS.online=!DS.online;body();P.toast(DS.online?'Annonce remise en ligne':'Annonce suspendue, les candidats sont prévenus',{icon:DS.online?'eye':'eye_off'})});
    $$('[data-cand]',b).forEach(function(x){x.onclick=function(){candSheet(CANDS[+x.getAttribute('data-cand')],body)}});
    $('[data-copy]',b).onclick=function(){P.toast('Lien de l’annonce copié',{icon:'link'})};
    $('[data-boost]',b).onclick=function(e){e.target.closest('button').innerHTML=ICON('check','sm')+'Visible sur Piaffe Annonces';P.toast('Annonce visible par les cavaliers des clubs voisins',{icon:'globe'})};
    $('[data-edit]',b).onclick=function(){var sh=P.sheet({title:'Modifier l’annonce',icon:'edit',body:'<div class="ad-lbl">Jours proposés</div><div class="hrow wrap" style="--g:6px">'+['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(function(d,i){return '<button class="tag" aria-pressed="'+(i===1||i===5)+'">'+d+'</button>'}).join('')+'</div><div class="g2" style="--g:12px;margin-top:16px;grid-template-columns:repeat(2,minmax(0,1fr))"><label class="field"><span>Niveau minimum</span><select class="in"><option>Galop 5</option><option selected>Galop 6</option><option>Galop 7</option></select></label><label class="field"><span>Participation par mois</span><input class="in num" value="180 €"></label></div><div class="ad-lbl">Activités autorisées</div><div class="hrow wrap" style="--g:6px">'+['Plat','Obstacle','Extérieur','Concours','Travail à pied'].map(function(d,i){return '<button class="tag" aria-pressed="'+(i<3)+'">'+d+'</button>'}).join('')+'</div><div class="ad-lbl">Présentation</div><textarea class="in" style="min-height:110px">'+o.note+' Hongre Selle Français de 11 ans, 1,68 m, sorti en Club Élite.</textarea><div class="ad-lbl">Qui peut voir l’annonce</div>'+opts([['club','Les adhérents du club','148 cavaliers, niveau vérifié par Piaffe',sq('members')],['all','Tous les cavaliers Piaffe à moins de 20 km','Les candidats extérieurs s’inscrivent au club',sq('globe')]],'club','vis'),foot:'<button class="btn pri ad-full" data-ok>Enregistrer l’annonce</button>'});bindOpts(sh);$('[data-ok]',sh).onclick=function(){sh.close();P.toast('Annonce mise à jour')}}}
   else{var of=$('[data-of]',b);var drawO=function(){ls=all.filter(function(x){return (DS.disc==='Tous'||x.disc===DS.disc)&&x.price<=DS.max&&(!DS.mine||parseInt(x.level.replace(/\D/g,''),10)<=prof().galop)});
     of.innerHTML=ls.length?'<div class="ad-cg rise">'+ls.map(function(x){var hh=D.horse(x.horse),ow=hh.owner&&D.member(hh.owner),ap=A.applied[x.id];return '<div class="card ad-of"><div class="hrow" style="--g:14px;align-items:flex-start">'+U.hav(hh,'xl')+'<div class="grow"><div class="nm disp bb" style="font-size:18px;letter-spacing:-.02em">'+hh.name+'</div><div class="s mut">'+hh.breed+' · '+hh.sex.toLowerCase()+' · '+hh.age+' ans · '+String(hh.height/100).replace('.',',')+' m</div><div class="hrow wrap" style="--g:6px;margin-top:8px">'+U.chip(x.disc,'acc')+U.chip(x.level+' minimum','line')+'</div></div><button class="ad-fav" data-manual data-fav aria-pressed="false" title="Garder cette annonce">'+ICON('heart')+'</button></div>'+
       '<p class="s" style="color:var(--ink-2)">'+x.note+'</p><div class="ad-kv"><div><b style="font-size:14px;font-family:var(--f-text);letter-spacing:0">'+x.days+'</b><span>Jours</span></div><div><b>'+F.eur(x.price)+'</b><span>par mois</span></div><div><b>'+x.applicants+'</b><span>candidature'+(x.applicants>1?'s':'')+'</span></div></div>'+
       '<div class="hrow sp" style="margin-top:auto"><span class="hrow s" style="--g:8px">'+(ow?U.av(ow,'sm')+'<span class="mut">Propriétaire : '+ow.first+' '+ow.last.charAt(0)+'.</span>':'')+'</span>'+(ap?'<button class="btn" disabled>'+ICON('check','sm')+'Candidature envoyée</button>':'<button class="btn dark" data-ap="'+x.id+'">Postuler</button>')+'</div></div>'}).join('')+'</div>':'<div class="card">'+U.empty('search','Aucune annonce avec ces critères','Augmentez le budget ou retirez un filtre.','<button class="btn" data-rst>Réinitialiser les filtres</button>')+'</div>';
     P.animate(of);swIn(of);
     $$('[data-ap]',of).forEach(function(x){x.onclick=function(){applySheet(all.find(function(y){return y.id===x.getAttribute('data-ap')}),drawO)}});
     $$('[data-fav]',of).forEach(function(x){x.onclick=function(){var on=x.getAttribute('aria-pressed')!=='true';x.setAttribute('aria-pressed',on);P.toast(on?'Annonce gardée dans vos favoris':'Annonce retirée de vos favoris',{icon:'heart'})}});
     var rs=$('[data-rst]',of);if(rs)rs.onclick=function(){DS.disc='Tous';DS.max=250;DS.mine=false;body()}};
    drawO();
    $$('[data-dd]',b).forEach(function(x){x.onclick=function(){DS.disc=x.getAttribute('data-dd');$$('[data-dd]',b).forEach(function(y){y.setAttribute('aria-pressed',y===x)});drawO()}});
    $('[data-max]',b).oninput=function(e){DS.max=+e.target.value;$('[data-maxv]',b).textContent=F.eur(DS.max);drawO()};
    $('#ad-mine',b).addEventListener('click',function(){DS.mine=!DS.mine;drawO()})}}
  $('[data-newo]',el).onclick=function(){if(DS.side!=='owner'){DS.side='owner';$$('[data-side]',el).forEach(function(x){x.setAttribute('aria-selected',x.getAttribute('data-side')==='owner')});body()}offerSheet(body)};
  body();
 }});

/* =====================================================================
   6. CONCOURS : engagements, transport, horaires, résultats
   ===================================================================== */
P.css(`
.ad-kh{--navy-ink:var(--d-ink);--navy:var(--d-bg);padding:28px;overflow:hidden;display:flex;flex-direction:column;gap:18px;position:relative}
.ad-kh .illu.corner{position:absolute;right:10px;top:8px;width:128px;height:128px;pointer-events:none}
.ad-kh h2{font-size:38px;line-height:1.05;color:var(--navy-ink);letter-spacing:-.04em;padding-right:120px}
.ad-kt{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}
.ad-kt>div{padding:16px 18px;border-radius:20px;background:color-mix(in srgb,var(--surface) 66%,transparent)}
.ad-kt b{display:block;white-space:nowrap;font:800 34px/1.05 var(--f-display);letter-spacing:-.04em;color:var(--navy-ink);font-variant-numeric:tabular-nums;margin-bottom:4px}
.ad-kt span{font-size:14px!important}
.ad-kt .hi{background:var(--d)!important}.ad-kt .hi b,.ad-kt .hi span{color:var(--on-acc)!important}
.ad-kt span{font-size:13px;color:color-mix(in srgb,var(--navy-ink) 62%,transparent)}

@container main (max-width:620px){.ad-kh{padding:20px}.ad-kt{grid-template-columns:repeat(2,minmax(0,1fr))}.ad-kh h2{font-size:29px;padding-right:72px}.ad-kh .illu.corner{width:92px;height:92px;right:0;top:0}.ad-kha .btn{flex:1 1 auto}.ad-kh>.hrow:first-of-type{padding-right:76px!important}.ad-kt b{font-size:28px}}
.ad-van{border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line);overflow:hidden}
.ad-van+.ad-van{margin-top:12px}
.ad-van .vh{display:flex;align-items:center;gap:12px;padding:12px 14px;background:var(--surface-2)}
.ad-van .vs{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:8px;padding:12px 14px}
.ad-seat{display:flex;align-items:center;gap:8px;padding:8px 10px;border-radius:10px;box-shadow:inset 0 0 0 1px var(--line);min-width:0;font-size:13px}
.ad-seat.me{box-shadow:inset 0 0 0 2px var(--acc);background:var(--acc-pale)}
.ad-seat.free{box-shadow:inset 0 0 0 1.5px var(--line-2);border-style:dashed;color:var(--mut);justify-content:center;min-height:48px;background:none;width:100%}
.ad-cp{display:grid;grid-template-columns:54px minmax(0,1fr) auto;gap:14px;align-items:center;padding:16px;position:relative}
.ad-cp+.ad-cp::before{content:"";position:absolute;left:16px;right:16px;top:0;height:1px;background:var(--line)}
@container main (max-width:620px){.ad-cp{grid-template-columns:52px minmax(0,1fr)}.ad-cp .cta{grid-column:1/-1}.ad-cp .cta .btn{width:100%;height:42px}}
.ad-res{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:14px 16px;position:relative}
.ad-res+.ad-res::before{content:"";position:absolute;left:16px;right:16px;top:0;height:1px;background:var(--line)}
.ad-rk{width:44px;height:44px;border-radius:12px;display:grid;place-items:center;background:var(--bg-2);font:800 16px var(--f-display);position:relative}
.ad-rk.top{background:var(--acc-pale);color:var(--acc)}
.ad-rk .strass{position:absolute;top:-3px;right:-3px}
`);
D.adhResults=D.adhResults||[
 {comp:'CSO Amateur, Chantilly',date:D.iso(D.day(-4)),cls:'Amateur 2 · 110 cm',rank:3,of:28,pen:0,time:'62,41 s',note:'Sans-faute, classée'},
 {comp:'CSO Club, Le Pin',date:'2026-10-25',cls:'Club Élite · 115 cm',rank:9,of:31,pen:4,time:'68,10 s',note:'Une barre à l’oxer 7'},
 {comp:'CSO Club, Rambouillet',date:'2026-10-04',cls:'Club Élite · 115 cm',rank:2,of:26,pen:0,time:'59,87 s',note:'Sans-faute, classée'},
 {comp:'CSO Club, Les Bréviaires',date:'2026-09-13',cls:'Club 1 · 105 cm',rank:1,of:22,pen:0,time:'57,02 s',note:'Sans-faute, victoire'},
 {comp:'CSO Club, Jardy',date:'2026-06-21',cls:'Club 1 · 105 cm',rank:14,of:35,pen:8,time:'71,55 s',note:'Deux barres'}];
var KS={tab:'mine'};
function engageSheet(k,after){var cls=k.disc==='Dressage'?[['a','Amateur 3 Préliminaire',28],['b','Amateur 3 Grand Prix',28]]:k.disc==='Hunter'?[['a','Club 2 · 85 cm',20],['b','Club 1 · 95 cm',20]]:[['a','Club 1 · 105 cm',24],['b','Club Élite · 115 cm',26]];
  var sh=P.sheet({title:'S’engager',icon:'trophy',body:'<div class="card soft" style="padding:14px 16px"><div class="hrow" style="--g:12px"><div class="ad-date"><b>'+new Date(k.date+'T12:00').getDate()+'</b><span>'+F.date(k.date).split(' ')[1]+'</span></div><div class="grow"><div class="b" style="font-size:15.5px">'+k.name+'</div><div class="s mut">'+k.place+(k.km?' · '+k.km+' km':'')+'</div><div class="s mut">Clôture des engagements '+F.rel(k.closes)+'</div></div></div></div>'+
    '<div class="ad-lbl">Épreuve</div>'+opts(cls.map(function(c){return [c[0],c[1],'Engagement FFE de '+F.eur(c[2])]}),'b','cls')+
    '<div class="ad-lbl">Couple</div><div class="card list"><div class="li">'+U.hav(UL)+'<div class="grow"><div class="t">Léa Martin et Ulysse de la Roche</div><div class="s">Licence compétition Club valide · vaccins à jour</div></div>'+ICON('check','sm')+'</div></div>'+
    '<div class="ad-lbl">Transport d’Ulysse</div>'+opts(k.km?[['club','Camion du club','2 places restantes, part partagée de 38 €',sq('truck')],['own','Mon van','Je propose 1 place pour un autre cheval',sq('van')]]:[['dom','Concours à domicile','Aucun transport nécessaire',sq('stable')]],k.km?'club':'dom','tr')+
    '<div class="ad-lbl">Coach sur place</div>'+opts([['club','Thomas Roux, moniteur du club','Compris dans l’encadrement du club',U.av('s04')],['c01','Pauline Arnaud, votre coach','Reconnaissance et détente, 35 €',U.av('c01')]],'club','co')+'<div style="margin-top:16px" data-tot></div>',
    foot:'<button class="btn pri lg ad-full" data-ok></button>'});
  function tot(){var c=cls.find(function(x){return x[0]===optVal(sh,'cls')}),tr=optVal(sh,'tr')==='club'?38:0,co=optVal(sh,'co')==='c01'?35:0,t=c[2]+tr+co;
   $('[data-tot]',sh).innerHTML='<div class="ad-sum"><span class="mut">Engagement, '+c[1]+'</span><span class="num">'+F.eur(c[2])+'</span></div>'+(tr?'<div class="ad-sum"><span class="mut">Transport, camion du club</span><span class="num">'+F.eur(tr)+'</span></div>':'')+(co?'<div class="ad-sum"><span class="mut">Coaching sur place</span><span class="num">'+F.eur(co)+'</span></div>':'')+'<div class="ad-sum tot"><span>Total</span><span class="num">'+F.eur(t)+'</span></div>';
   $('[data-ok]',sh).innerHTML=ICON('lock','sm')+'S’engager et payer '+F.eur(t);return {c:c,t:t}}
  tot();bindOpts(sh,tot);
  $('[data-ok]',sh).onclick=function(){var r=tot();spin($('[data-ok]',sh),function(){A.engaged[k.id]=r.c[1];success(sh,{title:'Vous êtes engagée',text:'Le club saisit votre engagement sur FFE Compet. L’horaire de passage arrive ici dès sa publication, la veille du concours.',
    head:sq('trophy')+'<div class="grow"><div class="b" style="font-size:15.5px">'+k.name+'</div><div class="s mut">'+cap(F.dateL(k.date))+'</div></div>',rows:[['Épreuve',r.c[1]],['Cheval','Ulysse de la Roche'],['Transport',optVal(sh,'tr')==='club'?'Camion du club':optVal(sh,'tr')==='own'?'Mon van':'À domicile'],['Réglé',F.eur(r.t)]]});if(after)after()})}}

P.mod({id:'adh-concours',role:'adherent',group:'Équitation',title:'Concours',icon:'trophy',n:30,
 badge:function(){return {v:'J-5'}},
 render:function(el){var k1=D.competitions[0];
  el.innerHTML=U.ph('Concours','Vos engagements, votre place dans le camion et votre horaire de passage, au même endroit.','')+U.seg([['mine','Dimanche à Rambouillet'],['cal','Calendrier'],['res','Résultats']],KS.tab,'data-kt')+'<div data-body style="margin-top:16px"></div>';
  $$('[data-kt]',el).forEach(function(b){b.addEventListener('click',function(){KS.tab=b.getAttribute('data-kt');body()})});
  function body(){var b=$('[data-body]',el),h='';
   if(KS.tab==='mine'){if(!A.engaged.k1){h='<div class="card">'+U.empty('trophy','Vous n’êtes plus engagée à Rambouillet','Votre place dans le van a été libérée et l’engagement remboursé.','<button class="btn pri" data-re>Me réengager</button>')+'</div>'}else{
    var vans=D.vans.map(function(v){var es=D.entries.filter(function(e){return e.comp==='k1'&&e.transport===v.id});return {v:v,es:es.slice(0,v.horses),free:Math.max(0,(v.id==='v1'?v.seats:v.horses)-Math.min(es.length,v.horses))}});
    h='<div class="stack" style="--g:16px"><div class="card tint d-cavaliers ad-kh">'+ILLU.trophee({size:null,cls:'corner'})+'<div class="hrow wrap" style="--g:8px;padding-right:120px"><span class="eyebrow" style="color:inherit;opacity:.8">Dimanche 22 novembre · dans 5 jours</span><span class="ad-cd">'+ICON('checkc','sm')+'Engagement saisi par le club</span></div>'+
      '<div><h2>'+k1.name+', Rambouillet</h2><div class="wh" style="font-size:14.5px;margin-top:6px;color:color-mix(in srgb,var(--navy-ink) 80%,transparent)">Épreuve 7 · '+RB.classe.replace(' · ',' ')+' · avec Ulysse de la Roche · coachée par Pauline Arnaud</div></div>'+
      '<div class="ad-kt"><div><b>7 h 15</b><span>Départ du van, cour principale</span></div><div><b>'+hm(RB.recon)+'</b><span>Reconnaissance du parcours</span></div><div class="hi"><b>'+hm(RB.passage)+'</b><span>Votre passage, '+RB.order+'</span></div><div><b>'+RB.bib+'</b><span>Numéro de dossard</span></div></div>'+
      '<div class="hrow wrap ad-kha" style="--g:8px"><button class="btn sm ad-nb on" data-route>'+ICON('route','sm')+'Itinéraire, 24 km</button><button class="btn sm ad-nb" data-go="adh-messages" data-id="t-grp">'+ICON('chat','sm')+'Groupe concours</button><button class="btn sm ad-nb" data-out>Me désengager</button></div></div>'+
     '<div class="g3" style="--g:16px"><div class="span2 card"><div class="ch"><div><h3>Qui emmène qui</h3><div class="xs mut">9 chevaux, 2 véhicules du club et 2 covoiturages</div></div><span class="chip ok dot">Ulysse a sa place</span></div><div class="cb">'+
      vans.map(function(x){var v=x.v,mine=v.id==='v2';return '<div class="ad-van"><div class="vh">'+sq(v.id==='v1'?'truck':'van')+'<div class="grow"><div class="b s">'+v.name+' <span class="mono mut" style="font-weight:500;white-space:nowrap">'+v.plate+'</span></div><div class="xs mut">Conduit par '+(mine?'vous':D.name(v.driver))+' · départ '+hm(v.leave)+' · '+v.from+'</div></div>'+(mine?U.chip('Votre van','acc'):'')+'</div><div class="vs">'+
        x.es.map(function(e){var me=e.rider==='m001';return '<div class="ad-seat'+(me?' me':'')+'">'+U.hav(e.horse,'sm')+'<div class="grow"><div class="b ellip">'+D.horse(e.horse).name.split(' ')[0]+'</div><div class="xs mut ellip">'+(me?'Vous':D.name(e.rider))+'</div></div></div>'}).join('')+
        (x.free&&!mine?'<button class="ad-seat free" data-free>'+ICON('plus','sm')+x.free+' place'+(x.free>1?'s':'')+' libre'+(x.free>1?'s':'')+'</button>':'')+'</div></div>'}).join('')+
      '<div class="ad-lbl" style="margin-top:18px">Covoiturage des cavaliers et des familles</div><div class="card list flat">'+
       '<div class="li">'+U.av('m001')+'<div class="grow"><div class="t">Vous, avec le van</div><div class="s">2 passagers : '+D.member('m022').first+' et '+D.member('m029').first+' · départ de la cour à 7 h 15</div></div><span data-seatlab class="xs mut hide-s">Proposer mes places</span>'+U.tog(true,'ad-seats')+'</div>'+
       D.carpool.map(function(c,i){var left=c.seats-c.taken.length;return '<div class="li">'+U.av(c.driver)+'<div class="grow"><div class="t">'+D.name(c.driver)+'</div><div class="s ellip">Part '+(/^Les /.test(c.from)?'des '+c.from.slice(4):'de '+c.from)+' · '+c.taken.map(function(t){return D.member(t).first}).join(', ')+' à bord</div></div><button class="btn sm" data-cp="'+i+'">'+left+' place'+(left>1?'s':'')+'</button></div>'}).join('')+'</div></div></div>'+
      '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>Déroulé de la journée</h3></div><div class="cb"><div class="tl">'+[['06:30','Rendez-vous à l’écurie','Chevaux nattés la veille, protections de transport'],['07:15','Départ','Vous conduisez le van 2 places'],['08:00','Arrivée à la Bergerie nationale','Boxes démontables 12 et 13'],[RB.recon,'Reconnaissance avec Pauline','8 obstacles, 1 double, 1 triple'],[RB.warmup,'Détente avec Pauline','Paddock '+RB.paddock],[RB.passage,'Votre parcours','Dossard '+RB.bib+', '+RB.order],['13:30','Remise des prix','Puis retour vers 15 h']].map(function(e,i){return '<div class="ev" style="--c:'+(i===4?'var(--acc)':'var(--line-2)')+(i===6?';padding-bottom:0':'')+'"><div class="hrow" style="--g:8px"><b class="s num">'+e[0]+'</b><b class="s">'+e[1]+'</b></div><div class="xs mut">'+e[2]+'</div></div>'}).join('')+'</div></div></div>'+
       '<div class="card"><div class="ch"><h3>Avant de partir</h3><span class="xs mut" data-ckn></span></div><div class="list" style="padding:6px 0">'+[['Licence compétition Club validée',1],['Vaccins d’Ulysse à jour',1],['Livret et carte d’immatriculation dans le van',0],['Engagement de 26 € réglé',D.adhInvoices[1].status==='payée'?1:0],['Protections de transport et filet à foin',0]].map(function(c){return '<label class="li" style="cursor:pointer">'+U.chk(!!c[1])+'<span class="grow s" style="font-weight:500">'+c[0]+'</span></label>'}).join('')+'</div></div></div></div></div>'}}
   else if(KS.tab==='cal'){h='<div class="card">'+D.competitions.filter(function(k){return F.days(k.date)>=0}).map(function(k){var en=A.engaged[k.id],cl=F.days(k.closes),dt=new Date(k.date+'T12:00');
     return '<div class="ad-cp"><div class="ad-date'+(en?'':' g')+'"><b>'+dt.getDate()+'</b><span>'+F.date(k.date).split(' ')[1]+'</span></div><div style="min-width:0"><div class="hrow wrap" style="--g:6px"><b style="font-size:14.5px">'+k.name+'</b>'+(en?U.chip('Engagée','ok',true):'')+'</div><div class="s mut ellip">'+k.place+(k.km?' · '+k.km+' km':'')+'</div><div class="hrow wrap" style="--g:6px;margin-top:7px">'+U.chip(k.disc,'acc')+U.chip(k.level,'line')+U.chip(cl<=1?'Clôture '+F.rel(k.closes):'Clôture le '+F.date(k.closes),cl<=1?'warn':'',cl<=1)+'<span class="xs mut">'+k.entries+' cavaliers du club</span></div></div>'+
      '<div class="cta">'+(en?'<button class="btn" data-see="'+k.id+'">Voir mon engagement</button>':'<button class="btn dark" data-eng="'+k.id+'">S’engager</button>')+'</div></div>'}).join('')+'</div><div class="note" style="margin-top:14px">'+ICON('info','sm')+'<span>Les engagements passent par le compte FFE du club : pas de ressaisie, la facture arrive dans Paiements et votre place de transport est réservée en même temps.</span></div>'}
   else{var R=D.adhResults,sf=R.filter(function(r){return r.pen===0}).length;
    h='<div class="g4" style="margin-bottom:16px">'+U.kpi({label:'Parcours cette saison',count:R.length,icon:'jump',dom:'cavaliers',tint:true})+U.kpi({label:'Sans-faute',count:sf,unit:'sur '+R.length,icon:'checkc',dom:'chevaux',tint:true})+U.kpi({label:'Classements',count:3,icon:'medal',dom:'argent',tint:true})+U.kpi({label:'Meilleure place',value:'1<small>re</small>',icon:'trophy',dom:'acc',tint:true})+'</div>'+
     '<div class="g3" style="--g:16px"><div class="span2 card"><div class="ch"><h3>Mes parcours avec Ulysse</h3><button class="btn ghost sm" data-ffe>Fiche FFE'+ICON('ext','sm')+'</button></div><div style="padding:6px 0">'+R.map(function(r,i){return '<div class="ad-res ad-tap" data-rr="'+i+'"><div class="ad-rk'+(r.rank<=3?' top':'')+'"><span class="num">'+r.rank+'<small style="font-size:13px">'+(r.rank===1?'re':'e')+'</small></span>'+(r.rank<=3?'<span class="strass"></span>':'')+'</div><div style="min-width:0"><div class="b s ellip">'+r.comp+'</div><div class="xs mut ellip">'+F.dateY(r.date)+' · '+r.cls+' · '+r.of+' partants</div></div><div style="text-align:right">'+U.chip(r.pen===0?'Sans-faute':r.pen+' points',r.pen===0?'ok':'warn',true)+'<div class="xs mut num" style="margin-top:4px">'+r.time+'</div></div></div>'}).join('')+'</div></div>'+
     '<div class="card ad-b"><div class="ch"><h3>Points de pénalité</h3><span class="xs mut">5 derniers parcours</span></div><div class="cb">'+bars(R.slice().reverse().map(function(r){return r.pen+.4}),['Juin','Sept','Oct','Oct','Nov'],{h:150,max:10,fmt:function(v){return Math.round(v)+''}})+'<div class="note ok end">'+ICON('trend','sm')+'<span>Trois sans-faute sur vos quatre derniers parcours. Pauline note des abords plus réguliers depuis octobre.</span></div></div></div></div>'}
   b.innerHTML=h;P.animate(b);swIn(b);
   var re=$('[data-re]',b);if(re)re.onclick=function(){A.engaged.k1=true;body();P.toast('Vous êtes de nouveau engagée à Rambouillet')};
   var rt=$('[data-route]',b);if(rt)rt.onclick=function(){P.toast('Itinéraire envoyé vers votre application de navigation',{icon:'route'})};
   var out=$('[data-out]',b);if(out)out.onclick=function(){var sh=P.sheet({title:'Me désengager',icon:'alert',body:'<p style="color:var(--ink-2);line-height:1.55">La clôture des engagements est demain. En vous désengageant aujourd’hui, les 26 € d’engagement et les 44 € de transport vous sont remboursés. '+D.member('m022').first+' et '+D.member('m029').first+', qui voyagent dans votre van, seront prévenus pour trouver une autre place.</p>',foot:'<button class="btn ad-full" data-no>Rester engagée</button><button class="btn danger ad-full" data-yes>Me désengager</button>'});$('[data-no]',sh).onclick=function(){sh.close()};$('[data-yes]',sh).onclick=function(){A.engaged.k1=false;sh.close();body();P.toast('Engagement annulé, 70 € remboursés',{undo:function(){A.engaged.k1=true;body()}})}};
   var fr=$('[data-free]',b);if(fr)fr.onclick=function(){P.toast('Places libres signalées au groupe concours',{icon:'truck'})};
   var st=$('#ad-seats',b);if(st)st.addEventListener('click',function(){var on=st.getAttribute('aria-checked')!=='true';P.toast(on?'Vos places passagers sont proposées au groupe':'Vos places ne sont plus proposées',{icon:'car'})});
   $$('[data-cp]',b).forEach(function(x){x.onclick=function(){x.innerHTML=ICON('check','sm')+'Demandé';x.disabled=true;P.toast('Demande de place envoyée à '+D.name(D.carpool[+x.getAttribute('data-cp')].driver),{icon:'car'})}});
   var ck=$('[data-ckn]',b);if(ck){var upd=function(){setTimeout(function(){var n=$$('.chk[aria-checked="true"]',b).length;ck.textContent=n+' sur 5';if(n===5&&!ck.done){ck.done=true;P.toast('Tout est prêt pour dimanche',{icon:'trophy'})}},0)};upd();$$('.chk',b).forEach(function(c){c.addEventListener('click',upd)})}
   $$('[data-eng]',b).forEach(function(x){x.onclick=function(){engageSheet(D.competitions.find(function(k){return k.id===x.getAttribute('data-eng')}),body)}});
   $$('[data-see]',b).forEach(function(x){x.onclick=function(){if(x.getAttribute('data-see')==='k1'){KS.tab='mine';$$('[data-kt]',el).forEach(function(y){y.setAttribute('aria-selected',y.getAttribute('data-kt')==='mine')});body()}else P.toast('Engagement confirmé, horaire publié la veille du concours',{icon:'trophy'})}});
   var ff=$('[data-ffe]',b);if(ff)ff.onclick=function(){P.toast('Ouverture de votre fiche de performances FFE',{icon:'ext'})};
   $$('[data-rr]',b).forEach(function(x){x.onclick=function(){var r=D.adhResults[+x.getAttribute('data-rr')];var sh=P.sheet({title:r.comp,icon:'trophy',body:'<div class="hrow" style="--g:16px;margin-bottom:16px"><div class="ad-big">'+r.rank+'<small>'+(r.rank===1?'re':'e')+' sur '+r.of+'</small></div>'+(r.pen===0?'<span class="strass" style="width:16px;height:16px"></span>':'')+'</div><div class="card soft" style="padding:14px 16px"><div class="ad-sum"><span class="mut">Épreuve</span><b>'+r.cls+'</b></div><div class="ad-sum"><span class="mut">Date</span><b>'+F.dateY(r.date)+'</b></div><div class="ad-sum"><span class="mut">Pénalités</span><b>'+(r.pen?r.pen+' points':'Aucune')+'</b></div><div class="ad-sum"><span class="mut">Temps</span><b class="num">'+r.time+'</b></div></div><div class="ad-lbl">Le mot de Pauline</div><p class="s" style="color:var(--ink-2);line-height:1.55">'+(r.pen?'Bon rythme, mais tu as repris trop tard avant l’oxer. On retravaille les contrats de foulées en ligne courbe mercredi.':'Parcours fluide du début à la fin. Tu as laissé Ulysse venir aux barres sans le déranger, c’est exactement ce qu’on cherchait.')+'</p>',foot:'<button class="btn pri ad-full" data-v>'+ICON('play','sm')+'Revoir la vidéo du parcours</button>'});$('[data-v]',sh).onclick=function(){P.toast('Lecture de la vidéo du parcours',{icon:'play'})}}})}
  body();
 }});

/* =====================================================================
   7. PROGRESSION : galops, compétences, objectifs, statistiques
   ===================================================================== */
P.css(`
.ad-pg{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:16px}
@container main (max-width:900px){.ad-pg{grid-template-columns:minmax(0,1fr)}}
.ad-gal{padding:26px;display:grid;grid-template-columns:auto minmax(0,1fr);gap:24px;align-items:center;position:relative;overflow:hidden}
.ad-gal .illu.corner{position:absolute;right:6px;top:6px;width:110px;height:110px;pointer-events:none}
.ad-gal .big{font-size:52px;padding-right:100px}
.ad-gal .sub{font-size:15px;line-height:1.5;opacity:.85}
.ad-gal .ad-rg .ct b{font-size:36px}
.ad-gs i{background:color-mix(in srgb,var(--d) 18%,transparent)!important}
.ad-gs i.on{background:var(--d)!important}
.ad-gs i.cur{background:linear-gradient(90deg,var(--d) var(--p),color-mix(in srgb,var(--d) 18%,transparent) var(--p))!important}
@container main (max-width:620px){.ad-gal{grid-template-columns:minmax(0,1fr);padding:20px;gap:16px}.ad-gal .big{font-size:44px}.ad-gal .illu.corner{width:96px;height:96px}}
.ad-gal .ring::after{font:800 26px var(--f-display);letter-spacing:-.03em}
.ad-gs{display:flex;gap:4px;margin-top:12px}
.ad-gs i{flex:1;height:6px;border-radius:3px;background:var(--bg-2)}
.ad-gs i.on{background:var(--acc)}.ad-gs i.cur{background:linear-gradient(90deg,var(--acc) var(--p),var(--bg-2) var(--p))}
.ad-radar{width:100%;max-width:330px;display:block;margin:0 auto;overflow:visible}
.ad-radar .gr{fill:none;stroke:var(--line);stroke-width:1}
.ad-radar .ax{stroke:var(--line);stroke-width:1}
.ad-radar .ar{fill:var(--acc);fill-opacity:.16;stroke:var(--acc);stroke-width:2;stroke-linejoin:round;transform-origin:150px 130px;animation:ad-rad .8s var(--e-out) both}
.ad-radar .pt{fill:var(--surface);stroke:var(--acc);stroke-width:2;animation:fade .4s var(--e-out) .5s both}
.ad-radar text{font:600 14.5px var(--f-text);fill:var(--mut)}
.ad-radar text.v{fill:var(--ink);font-weight:700}
@keyframes ad-rad{from{transform:scale(.2);opacity:0}}
.ad-skill{display:grid;grid-template-columns:minmax(0,1fr) 44px;gap:4px 12px;align-items:center;padding:11px 16px;position:relative}
.ad-skill+.ad-skill::before{content:"";position:absolute;left:16px;right:16px;top:0;height:1px;background:var(--line)}
.ad-skill .bar{grid-column:1}
.ad-ses{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 16px;position:relative}
.ad-ses+.ad-ses::before{content:"";position:absolute;left:16px;right:16px;top:0;height:1px;background:var(--line)}
.ad-q2{padding:16px;display:flex;flex-direction:column;gap:10px}
.ad-q2 p{color:var(--ink-2);line-height:1.55;font-size:13.5px}
.ad-bdg{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:var(--r-md);background:var(--surface-2);min-width:0}
`);
var PG={lea:{g:7,pct:100,next:'Degré 1',np:40,sub:'Galop 7 obtenu en juin 2024. Prochaine étape : le Degré 1, premier diplôme de compétition.',
  kp:[['Heures en selle en novembre','8 h 45','+1 h 30',[2.5,3,2,3.5,3,4,3.5,2.75],'stopwatch'],['Séances ce mois-ci','11','+2',[8,9,10,9,12,11,13,11],'planning'],['Semaines d’affilée','9','+1',[1,2,3,4,5,6,7,8,9],'trend'],['Obstacles sautés','312','cette saison',[20,45,60,90,150,210,260,312],'jump']],
  weeks:[2.5,3,2,3.5,3,4,3.5,2.75,3.25,3.5,2,1.5],disc:[['CSO',38,'var(--acc)'],['Dressage et plat',34,'var(--c5)'],['Extérieur',18,'var(--c7)'],['Travail à pied',10,'var(--c4)']],
  skills:[['Position et équilibre',88,'Thomas'],['Obstacle',81,'Pauline'],['Dressage',72,'Inès'],['Extérieur et cross',64,'Thomas'],['Soins et connaissances',90,'Claire'],['Travail à pied',58,'Sophie']],
  goals:[['Deux classements en Club Élite avant janvier',50,'1 sur 2, prochain essai dimanche'],['Passer le Degré 1 au printemps',40,'Pratique validée, théorie à réviser'],['Monter 12 heures en novembre',73,'8 h 45 sur 12'],['Changement de pied en l’air à main gauche',25,'Travail engagé avec Inès']],
  ses:[['Hier','Dressage Galop 6+','h01','s03',60,4,'Cessions à la jambe réussies aux deux mains. Le galop à gauche reste un peu précipité.'],['Dim. 15 nov.','Balade en forêt','h01',null,90,5,''],['Sam. 14 nov.','Gymnastique à l’obstacle','h01','s02',60,5,'Ligne de cinq sauts de puce : Ulysse très respectueux, ton regard part enfin loin.'],['Mer. 11 nov.','Équipe concours','h01','s04',90,4,'Enchaînement à 1,10 m. Attention à ne pas reprendre dans la dernière foulée.'],['Mar. 10 nov.','Coaching CSO','h01','c01',60,5,'Très bon travail sur les courbes. Contrat de 6 foulées tenu trois fois sur quatre.'],['Sam. 7 nov.','Travail sur le plat','h01',null,45,3,''],['Jeu. 5 nov.','Dressage Galop 6+','h01','s03',60,4,'Épaule en dedans au pas bien comprise. On la demande au trot la semaine prochaine.'],['Mar. 3 nov.','Coaching CSO','h01','c01',60,4,'Premier oxer à 1,15 m. Ulysse saute dans la force, garde tes mains basses.']],
  notes:[['c01','Pauline Arnaud','Coach CSO','Mardi 10 novembre','Léa a passé un cap sur les abords : elle attend le saut au lieu d’aller le chercher. Objectif de dimanche, un tour propre sans regarder le chrono.'],['s03','Inès Garnier','Monitrice','Hier','Belle évolution du contact. Travail à poursuivre sur le galop à gauche, avec des transitions galop-trot sur le cercle de 20 m.']],
  badges:[['Sans-faute à Chantilly','Amateur 2, 3e sur 28'],['9 semaines d’affilée','Record personnel'],['100 heures avec Ulysse','Depuis septembre']]},
 jules:{g:2,pct:68,next:'Galop 3',np:68,sub:'Galop 2 obtenu en juin 2026. Inès prévoit le passage du Galop 3 pendant le stage de Noël.',
  kp:[['Heures en selle en novembre','3 h','régulier',[1,1,2,1,1,2,1,1],'stopwatch'],['Séances ce mois-ci','3','sur 4 prévues',[4,4,3,4,4,5,4,3],'planning'],['Semaines d’affilée','6','bravo',[1,2,3,4,5,6],'trend'],['Poneys montés','5','cette saison',[1,2,2,3,4,5],'horse']],
  weeks:[1,1,2,1,1,2,1,0,1,1,1,1],disc:[['Reprise',62,'var(--acc)'],['Jeux à poney',20,'var(--c4)'],['Balade',10,'var(--c7)'],['Soins',8,'var(--c5)']],
  skills:[['Position et équilibre',70,'Inès'],['Trot enlevé',85,'Inès'],['Galop',45,'Inès'],['Diriger son poney',75,'Hugo'],['Soins et connaissances',80,'Jade'],['Sauter un petit obstacle',40,'Inès']],
  goals:[['Passer le Galop 3 au stage de Noël',68,'11 compétences sur 16'],['Partir au galop sur le bon pied',45,'Réussi une fois sur deux'],['Seller et brider son poney tout seul',90,'Reste le montant de filet']],
  ses:[['Mer. 11 nov.','Galop 2-3','h08','s02',60,4,'Jules trotte enlevé sur le bon diagonal sans regarder. Premier galop sur le cercle, grand sourire.'],['Mer. 4 nov.','Galop 2-3','h07','s02',60,4,'Bon slalom au trot. À retravailler : les talons qui remontent.'],['Sam. 31 oct.','Jeux à poney','h11','s08',60,5,''],['Mer. 21 oct.','Galop 2-3','h08','s02',60,3,'Séance agitée, Câline était distraite. Jules est resté calme, bravo.']],
  notes:[['s02','Hugo Lefèvre','Moniteur','Mercredi 11 novembre','Jules est appliqué et gentil avec son poney. Il est prêt à préparer le Galop 3, il manque surtout de la pratique au galop.']],
  badges:[['Premier galop','Mercredi 11 novembre'],['6 semaines d’affilée','Sans une absence'],['Galop 2','Obtenu en juin 2026']]}};
function radar(sk){var cx=150,cy=130,R=92,n=sk.length,pt=function(i,v){var a=-Math.PI/2+i*2*Math.PI/n;return [cx+Math.cos(a)*R*v,cy+Math.sin(a)*R*v]};
  var g='';[.25,.5,.75,1].forEach(function(k){g+='<polygon class="gr" points="'+sk.map(function(_,i){return pt(i,k).map(function(x){return x.toFixed(1)}).join(',')}).join(' ')+'"/>'});
  sk.forEach(function(s,i){var e=pt(i,1),l=pt(i,1.2);g+='<line class="ax" x1="'+cx+'" y1="'+cy+'" x2="'+e[0].toFixed(1)+'" y2="'+e[1].toFixed(1)+'"/><text x="'+l[0].toFixed(1)+'" y="'+(l[1]+2).toFixed(1)+'" text-anchor="'+(Math.abs(l[0]-cx)<8?'middle':l[0]>cx?'start':'end')+'">'+s[0].split(' ')[0].replace('Soins','Soins').replace('Diriger','Direction').replace('Sauter','Saut')+'</text><text class="v" x="'+l[0].toFixed(1)+'" y="'+(l[1]+15).toFixed(1)+'" text-anchor="'+(Math.abs(l[0]-cx)<8?'middle':l[0]>cx?'start':'end')+'">'+s[1]+'</text>'});
  g+='<polygon class="ar" points="'+sk.map(function(s,i){return pt(i,s[1]/100).map(function(x){return x.toFixed(1)}).join(',')}).join(' ')+'"/>';
  sk.forEach(function(s,i){var p=pt(i,s[1]/100);g+='<circle class="pt" cx="'+p[0].toFixed(1)+'" cy="'+p[1].toFixed(1)+'" r="3.5"/>'});
  return '<svg class="ad-radar" viewBox="-30 0 360 270" role="img" aria-label="Compétences">'+g+'</svg>'}

P.mod({id:'adh-progression',role:'adherent',group:'Équitation',title:'Progression',icon:'trend',n:40,
 render:function(el){var p=prof(),kid=p.minor,G=PG[p.id];
  var h='<div class="ad-ph">'+U.ph('Progression',kid?'Le parcours de '+p.first+' : galops, compétences validées par ses moniteurs et séances.':'Vos galops, vos compétences validées par les moniteurs et vos statistiques en selle.',profPill())+'</div>';
  h+='<div class="stack rise" style="--g:16px"><div class="ad-pg"><div class="card tint d-cavaliers ad-gal">'+ILLU.bombe({size:null,cls:'corner'})+'<div>'+ringSVG(G.np,132,14,'var(--rd)','<b>'+G.np+'</b><small>%</small>')+'</div><div style="min-width:0"><div class="eyebrow" style="color:inherit;opacity:.8">Niveau fédéral</div><h2 class="big" style="margin-top:6px;color:var(--d-ink)">Galop '+G.g+''+'</h2><p class="sub" style="margin-top:8px">'+G.sub+'</p>'+
     '<div class="ad-gs">'+[1,2,3,4,5,6,7].map(function(i){return '<i class="'+(i<=G.g?'on':i===G.g+1?'cur':'')+'" style="--p:'+G.np+'%" title="Galop '+i+'"></i>'}).join('')+'</div><div class="hrow sp xs mut" style="margin-top:6px"><span>Galop 1</span><span class="b" style="color:var(--ink)">'+G.next+' : '+G.np+' %</span><span>Galop 7</span></div>'+
     '<div class="hrow wrap" style="--g:8px;margin-top:14px"><button class="btn sm pri" data-quiz>'+ICON('bulb','sm')+'Réviser la théorie</button>'+(A.quiz[p.id]!=null?U.chip('Meilleur score : '+A.quiz[p.id]+' sur 10',A.quiz[p.id]===10?'ok':'',true):'')+'<button class="btn sm" data-prog>'+ICON('list','sm')+'Programme du '+G.next+'</button><button class="btn sm" data-dip>'+ICON('download','sm')+'Mes diplômes</button></div></div></div>'+
    '<div class="g2" style="--g:12px;grid-template-columns:repeat(2,minmax(0,1fr))">'+G.kp.map(function(k){return U.kpi({label:k[0],value:k[1],delta:k[2],spark:k[3],icon:k[4]})}).join('')+'</div></div>';
  h+='<div class="g3" style="--g:16px"><div class="card span2"><div class="ch"><div><h3>Heures en selle</h3><div class="xs mut">12 dernières semaines, toutes montures confondues</div></div><span class="chip acc">'+String(G.weeks.reduce(function(a,b){return a+b},0)).replace('.',',')+' h au total</span></div><div class="cb">'+bars(G.weeks,['S36','','S38','','S40','','S42','','S44','','S46',''],{h:190,hi:null,fmt:function(v){return String(Math.round(v*10)/10).replace('.',',')+' h'}})+'</div></div>'+
   '<div class="card ad-b"><div class="ch"><h3>Par discipline</h3><span class="xs mut">Cette saison</span></div><div class="cb" style="align-items:center">'+C.donut(G.disc.map(function(d){return {v:d[1],c:d[2]}}),{size:150,center:(kid?'21':'47'),sub:'séances'})+'<div class="stack end" style="--g:6px;width:100%">'+G.disc.map(function(d){return '<div class="hrow sp s"><span class="hrow" style="--g:8px"><i style="width:8px;height:8px;border-radius:2px;background:'+d[2]+'"></i>'+d[0]+'</span><b class="num">'+d[1]+' %</b></div>'}).join('')+'</div></div></div></div>';
  h+='<div class="g3" style="--g:16px"><div class="card ad-b"><div class="ch"><h3>Compétences</h3><span class="xs mut">Validées en séance</span></div><div class="cb" style="justify-content:center">'+radar(G.skills)+'</div></div>'+
   '<div class="card"><div class="ch"><h3>Détail par domaine</h3></div><div style="padding:6px 0">'+G.skills.map(function(s,i){return '<div class="ad-skill ad-tap" data-sk="'+i+'"><div class="hrow sp"><b class="s">'+s[0]+'</b><span class="xs mut">'+s[2]+'</span></div><b class="num s" style="text-align:right;grid-row:span 2">'+s[1]+' %</b>'+U.bar(s[1],s[1]<60?'var(--c4)':'var(--acc)')+'</div>'}).join('')+'</div></div>'+
   '<div class="card ad-b"><div class="ch"><h3>Objectifs</h3><button class="btn ghost sm" data-addg>'+ICON('plus','sm')+'Ajouter</button></div><div style="padding:6px 0" data-goals></div></div></div>';
  h+='<div class="g3" style="--g:16px"><div class="card span2"><div class="ch"><h3>Historique des séances</h3><button class="btn ghost sm" data-exp title="Exporter l’historique">'+ICON('download','sm')+'<span class="hide-s">Exporter</span></button></div><div style="padding:6px 0">'+G.ses.map(function(s,i){var hh=D.horse(s[2]);return '<div class="ad-ses ad-tap" data-ses="'+i+'">'+(s[3]?U.av(s[3]):sq('user'))+'<div style="min-width:0"><div class="b s ellip">'+s[1]+'</div><div class="xs mut ellip">'+s[0]+' · '+hh.name.split(' ')[0]+' · '+s[4]+' min'+(s[3]?' · '+D.person(s[3]).first:' · en autonomie')+'</div></div><div class="hrow" style="--g:8px">'+(s[6]?'<span class="chip hide-s">'+ICON('chat','sm')+' Note</span>':'')+stars(s[5])+'</div></div>'}).join('')+'</div></div>'+
   '<div class="stack" style="--g:14px">'+G.notes.map(function(n){return '<div class="card ad-q2"><div class="hrow" style="--g:10px">'+U.av(n[0])+'<div class="grow"><div class="b s">'+n[1]+'</div><div class="xs mut">'+n[2]+' · '+n[3]+'</div></div></div><p>'+n[4]+'</p></div>'}).join('')+
    '<div class="card ad-b"><div class="ch"><h3>Réussites</h3></div><div class="cb" style="gap:8px">'+G.badges.map(function(b){return '<div class="ad-bdg"><span class="strass" style="width:14px;height:14px"></span><div class="grow"><div class="b s ellip">'+b[0]+'</div><div class="xs mut ellip">'+b[1]+'</div></div></div>'}).join('')+'</div></div></div></div></div>';
  el.innerHTML=h;bindProf(el);
  function goals(){$('[data-goals]',el).innerHTML=G.goals.map(function(g,i){return '<div class="ad-skill"><div class="hrow" style="--g:10px">'+U.chk(g[1]>=100,'g'+i)+'<b class="s grow" style="line-height:1.3">'+g[0]+'</b></div><b class="num s" style="text-align:right;grid-row:span 2">'+g[1]+' %</b><div style="padding-left:30px">'+U.bar(g[1])+'<div class="xs mut" style="margin-top:5px">'+g[2]+'</div></div></div>'}).join('');
   $$('[data-goals] .chk',el).forEach(function(c,i){c.setAttribute('data-manual','');c.onclick=function(){var done=G.goals[i][1]<100;G.goals[i]=[G.goals[i][0],done?100:50,done?'Atteint le 17 novembre':'Repris'];goals();if(done)P.toast('Objectif atteint, bravo',{icon:'trophy'})}})}
  goals();
  $('[data-addg]',el).onclick=function(){var sh=P.sheet({title:'Nouvel objectif',icon:'flag',body:'<label class="field"><span>Votre objectif</span><input class="in" id="ad-gn" placeholder="Par exemple : un tour à 1,20 m sans faute"></label><div class="ad-lbl">Échéance</div>'+U.seg([['1','Dans un mois'],['3','Dans trois mois'],['s','Fin de saison']],'3')+'<div class="ad-lbl">Partager avec</div><div class="card list"><div class="li">'+U.av('c01')+'<div class="grow t">Pauline Arnaud, coach</div>'+U.tog(true)+'</div><div class="li">'+U.av('s04')+'<div class="grow t">Thomas Roux, moniteur</div>'+U.tog(true)+'</div></div><div class="ad-lbl">Idées proposées par vos moniteurs</div><div class="hrow wrap" style="--g:6px">'+['Épaule en dedans au trot','Un sans-faute en Amateur 3','Monter sans étriers 10 min'].map(function(t){return '<button class="tag" data-manual data-idea>'+t+'</button>'}).join('')+'</div>',foot:'<button class="btn pri ad-full" data-ok>Ajouter cet objectif</button>'});
   $$('[data-idea]',sh).forEach(function(t){t.onclick=function(){$('#ad-gn',sh).value=t.textContent}});
   $('[data-ok]',sh).onclick=function(){var v=$('#ad-gn',sh).value.trim();if(!v){$('#ad-gn',sh).focus();return}G.goals.unshift([F.esc(v),0,'Ajouté aujourd’hui, partagé avec vos moniteurs']);sh.close();goals();P.toast('Objectif ajouté et partagé avec vos moniteurs',{icon:'flag'})}};
  $$('[data-sk]',el).forEach(function(x){x.onclick=function(){var s=G.skills[+x.getAttribute('data-sk')],items=kid?['Tenir ses rênes ajustées','Trotter enlevé sur le bon diagonal','S’arrêter sur une ligne','Partir au galop dans un coin','Garder ses talons bas']:['Fixité des mains au trot assis','Équilibre sur les étriers au galop','Regard porté loin dans les courbes','Indépendance des aides','Stabilité à la réception du saut'],n=Math.round(s[1]/20);
    P.sheet({title:s[0],icon:'trend',body:'<div class="hrow" style="--g:16px;margin-bottom:16px">'+U.ring(s[1],s[1]+' %','var(--acc)',72)+'<div class="grow"><div class="b">'+n+' points validés sur 5</div><div class="s mut">Dernière évaluation par '+s[2]+', en séance</div></div></div><div class="card list">'+items.map(function(t,i){return '<div class="li">'+(i<n?sq('check','ok'):'<span class="av sq" style="--c:var(--bg-2);color:var(--mut)">'+ICON('hourglass')+'</span>')+'<div class="grow"><div class="t">'+t+'</div><div class="s">'+(i<n?'Validé par '+s[2]:'En cours de travail')+'</div></div></div>'}).join('')+'</div>'})}});
  $$('[data-ses]',el).forEach(function(x){x.onclick=function(){var s=G.ses[+x.getAttribute('data-ses')],hh=D.horse(s[2]);
    P.sheet({title:s[1],icon:'planning',body:'<div class="card soft" style="padding:14px 16px"><div class="ad-sum"><span class="mut">Date</span><b>'+s[0]+'</b></div><div class="ad-sum"><span class="mut">Monture</span><b>'+hh.name+'</b></div><div class="ad-sum"><span class="mut">Durée</span><b>'+s[4]+' minutes</b></div><div class="ad-sum"><span class="mut">Encadrement</span><b>'+(s[3]?D.name(s[3]):'En autonomie')+'</b></div><div class="ad-sum"><span class="mut">Ressenti</span>'+stars(s[5])+'</div></div>'+
     (s[6]?'<div class="ad-lbl">Note de '+D.person(s[3]).first+'</div><p class="s" style="color:var(--ink-2);line-height:1.55">'+s[6]+'</p>':'')+
     (kid?'':'<div class="ad-lbl">Capteur de selle</div><div class="g3" style="--g:8px;grid-template-columns:repeat(3,minmax(0,1fr))">'+[['34 %','Au pas'],['31 %','Au trot'],['35 %','Au galop']].map(function(v){return '<div class="card soft" style="padding:10px 12px"><div class="disp bb num" style="font-size:18px">'+v[0]+'</div><div class="xs mut">'+v[1]+'</div></div>'}).join('')+'</div>')})}});
  $('[data-prog]',el).onclick=function(){P.sheet({title:'Programme du '+G.next,icon:'list',body:'<p class="s mut" style="margin-bottom:14px">Le programme officiel de la FFE, coché au fil des séances par vos moniteurs.</p><div class="card list">'+(kid?[['Trotter enlevé en changeant de diagonal',1],['Galoper en équilibre sur ses étriers',1],['Partir au galop sur le bon pied',0],['Sauter un petit obstacle isolé au trot',0],['Connaître les robes et les marques',1],['Entretenir son matériel',1]]:[['Enchaîner un parcours de 1 m',1],['Présenter une reprise de niveau Amateur 3',1],['Longer un cheval aux trois allures',0],['Théorie : règlement de compétition',0],['Soins : reconnaître une boiterie',1]]).map(function(t){return '<div class="li">'+(t[1]?sq('check','ok'):'<span class="av sq" style="--c:var(--bg-2);color:var(--mut)">'+ICON('hourglass')+'</span>')+'<div class="grow t">'+t[0]+'</div>'+U.chip(t[1]?'Validé':'À travailler',t[1]?'ok':'')+'</div>'}).join('')+'</div>'})};
  $('[data-dip]',el).onclick=function(){P.toast('Diplômes de Galop 1 à '+G.g+' téléchargés depuis la FFE',{icon:'download'})};
  $('[data-quiz]',el).onclick=function(){quizSheet(P.rerender)};
  $('[data-exp]',el).onclick=function(){P.toast('Historique des séances exporté',{icon:'download'})};
 }});

/* =====================================================================
   8. PAIEMENTS : solde, factures, payer, moyens de paiement, attestations
   ===================================================================== */
P.css(`
.ad-pay{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:16px;margin-bottom:18px}
@container main (max-width:900px){.ad-pay{grid-template-columns:minmax(0,1fr)}}
.ad-bal{--navy-ink:var(--d-ink);--navy:var(--d-bg);padding:28px;overflow:hidden;display:flex;flex-direction:column;gap:18px;position:relative}
.ad-bal .illu.corner{position:absolute;right:8px;top:6px;width:140px;height:140px;pointer-events:none}
.ad-bal .amt{font:800 80px/.95 var(--f-display);letter-spacing:-.05em;color:var(--navy-ink);font-variant-numeric:tabular-nums}
.ad-bal .ln .chip.bad{background:var(--bad);color:var(--on-acc)}
.ad-bal .ln{display:flex;justify-content:space-between;gap:12px;padding:8px 0;font-size:13.5px;color:color-mix(in srgb,var(--navy-ink) 82%,transparent)}
.ad-bal .ln+.ln{box-shadow:inset 0 1px 0 color-mix(in srgb,var(--navy-ink) 12%,transparent)}
.ad-bal .ln b{color:var(--navy-ink);font-variant-numeric:tabular-nums}
.ad-bal .btn.go{background:var(--acc);color:var(--acc-ink);box-shadow:none;height:44px;padding:0 18px;font-size:14.5px}
@container main (max-width:620px){.ad-bal{padding:20px}.ad-bal .amt{font-size:60px}.ad-bal .btn{flex:1}.ad-bal .illu.corner{width:104px;height:104px;right:0;top:0}.ad-bal>.hrow:first-of-type{padding-right:96px!important}}
.ad-pass{padding:20px 22px!important}
.ad-pass .disp{font-size:26px!important;line-height:1.1}.ad-pass .num{white-space:nowrap}
@container main (max-width:620px){.ad-pass .disp{font-size:22px!important}}
.ad-pass{padding:16px 18px;border-radius:var(--r-lg);background:linear-gradient(135deg,var(--acc),var(--acc-2));color:var(--acc-ink);position:relative;overflow:hidden;display:flex;flex-direction:column;gap:14px;box-shadow:var(--shadow-2)}
.ad-pass::after{content:"";position:absolute;right:-40px;bottom:-60px;width:180px;height:180px;border-radius:50%;background:color-mix(in srgb,var(--acc-ink) 10%,transparent)}
.ad-pass .pn{display:grid;grid-template-columns:repeat(10,1fr);gap:6px;position:relative;z-index:1}
.ad-pass .pn i{aspect-ratio:1;border-radius:50%;background:color-mix(in srgb,var(--acc-ink) 95%,transparent);display:grid;place-items:center;color:var(--acc)}
.ad-pass .pn i.u{background:transparent;box-shadow:inset 0 0 0 1.5px color-mix(in srgb,currentColor 50%,transparent);color:color-mix(in srgb,currentColor 70%,transparent)}
.ad-pass .pn svg{width:60%;height:60%}
.ad-inv{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;gap:14px;align-items:center;padding:16px 20px;min-height:72px;position:relative;cursor:pointer;transition:background var(--t-1)}
.ad-inv:hover{background:var(--surface-2)}
.ad-inv+.ad-inv::before{content:"";position:absolute;left:16px;right:16px;top:0;height:1px;background:var(--line)}
.ad-inv .am{text-align:right;font:800 18px/1.1 var(--f-display);letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.ad-inv .am .chip{font-family:var(--f-text);letter-spacing:0}
@container main (max-width:620px){.ad-inv>div>.b.ellip,.ad-pay .li .t.ellip{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.3}}
@container main (max-width:620px){.ad-inv{grid-template-columns:auto minmax(0,1fr) auto}.ad-inv .dl{display:none}}
.ad-pm{display:flex;align-items:center;gap:14px;padding:14px 16px;position:relative}
.ad-pm+.ad-pm::before{content:"";position:absolute;left:16px;right:16px;top:0;height:1px;background:var(--line)}
.ad-cardv{width:54px;height:36px;border-radius:7px;background:var(--navy);color:var(--navy-ink);display:grid;place-items:center;font:700 13px var(--f-text);letter-spacing:.04em;flex:none}
.ad-cardv.b{background:var(--acc-pale);color:var(--acc)}
`);
var PS={tab:'fact',filt:'all',last:null,methods:[['cb','VISA','Carte Visa se terminant par 4242','Expire en août 2028 · paiements en ligne'],['sepa','SEPA','Mandat de prélèvement SEPA','FR76 •••• •••• 1234 · pension et forfaits'],['ancv','ANCV','Chèques-vacances Connect','120 € disponibles jusqu’en décembre 2027']],def:'sepa'};
function invSheet(inv,after){var open=inv.status!=='payée'&&inv.amount>0,ht=inv.amount/(1+inv.vat/100);
  var sh=P.sheet({title:inv.amount<0?'Avoir '+inv.id:'Facture '+inv.id,icon:'invoice',body:'<div class="hrow sp" style="margin-bottom:14px"><div><div class="b" style="font-size:15.5px;line-height:1.3">'+inv.label+'</div><div class="s mut" style="margin-top:2px">Émise le '+F.dateY(inv.date)+' · échéance le '+F.dateY(inv.due)+'</div></div>'+U.status(inv.status)+'</div>'+
    '<div class="card soft" style="padding:6px 16px">'+inv.lines.map(function(l){return '<div class="ad-sum"><span>'+l[0]+'</span><span class="num">'+F.eur(l[1])+'</span></div>'}).join('')+'<div class="ad-sum"><span class="mut">Total hors taxes</span><span class="num mut">'+F.eur(ht,true)+'</span></div><div class="ad-sum"><span class="mut">TVA à '+String(inv.vat).replace('.',',')+' %</span><span class="num mut">'+F.eur(inv.amount-ht,true)+'</span></div><div class="ad-sum tot"><span>Total TTC</span><span class="num">'+F.eur(inv.amount)+'</span></div></div>'+
    '<div class="ad-row" style="margin-top:14px">'+sq(inv.method==='Carte bancaire'?'card':'bank')+'<div class="grow"><div class="t">'+inv.method+'</div><div class="s">'+(inv.status==='payée'?'Réglée le '+F.dateY(inv.due):inv.status==='en retard'?'Prélèvement du 15 novembre rejeté par votre banque':inv.status==='déduit'?'Déduit automatiquement de votre pension':'À régler avant le '+F.date(inv.due))+'</div></div></div>'+
    '<p class="xs mut" style="margin-top:14px">'+D.club.name+' · SIRET '+D.club.siret+' · facture électronique conforme Factur-X</p>',
    foot:'<button class="btn ad-full" data-dl>'+ICON('download','sm')+'Télécharger le PDF</button>'+(open?'<button class="btn pri ad-full" data-pay>Payer '+F.eur(inv.amount)+'</button>':'')});
  $('[data-dl]',sh).onclick=function(){P.toast(inv.id+'.pdf téléchargé',{icon:'download'})};var pb=$('[data-pay]',sh);if(pb)pb.onclick=function(){paySheet(after,[inv.id])}}
function paySheet(after,only){var av=D.adhInvoices.find(function(i){return i.status==='déduit'}),open=D.adhInvoices.filter(function(i){return i.status!=='payée'&&i.amount>0});
  if(!open.length){P.toast('Tout est déjà réglé');return}
  var net=function(i){return i.amount+(av&&i.id==='F-2026-1173'?av.amount:0)};
  var sh=P.sheet({title:'Payer',icon:'card',body:'<div class="ad-lbl">Factures à régler</div><div class="card list">'+open.map(function(i){var on=!only||only.indexOf(i.id)>=0;return '<label class="li" style="cursor:pointer">'+U.chk(on,i.id)+'<span class="grow" style="min-width:0"><span class="t ellip" style="display:block">'+i.label.split(',')[0]+'</span><span class="s" style="display:block">'+(i.id==='F-2026-1173'&&av?'520 € moins 180 € de demi-pension':'Échéance '+F.rel(i.due))+'</span></span><b class="num s">'+F.eur(net(i))+'</b></label>'}).join('')+'</div>'+
    '<div class="ad-lbl">Moyen de paiement</div>'+opts(wallets().concat([['cb','Carte Visa se terminant par 4242','Paiement immédiat',sq('card')],['sepa','Prélèvement SEPA','Compte FR76 •••• 1234, débité sous 2 jours',sq('bank')],['x3','En 3 fois sans frais','Aujourd’hui, puis le 17 décembre et le 17 janvier',sq('repeat')],['ancv','Chèques-vacances Connect','120 € disponibles, le reste par carte',sq('gift')]]),'apple','pay')+
    '<div style="margin-top:16px" data-tot></div><p class="xs mut hrow" style="--g:6px;margin-top:12px">'+ICON('lock','sm')+'Paiement chiffré, opéré par Stripe. Piaffe ne conserve pas votre numéro de carte.</p>',
    foot:'<button class="btn pri lg ad-full" data-ok></button>'});
  var ok=$('[data-ok]',sh);
  function sel(){return open.filter(function(i){return $('.chk[data-id="'+i.id+'"]',sh).getAttribute('aria-checked')==='true'})}
  function tot(){var t=sel().reduce(function(a,i){return a+net(i)},0),m=optVal(sh,'pay');
   $('[data-tot]',sh).innerHTML=(m==='x3'?'<div class="ad-sum"><span class="mut">3 mensualités de</span><span class="num">'+F.eur(t/3,true)+'</span></div>':m==='ancv'?'<div class="ad-sum"><span class="mut">Chèques-vacances</span><span class="num">'+F.eur(Math.min(120,t))+'</span></div><div class="ad-sum"><span class="mut">Carte Visa</span><span class="num">'+F.eur(Math.max(0,t-120))+'</span></div>':'')+'<div class="ad-sum tot"><span>Total à régler</span><span class="num">'+F.eur(t)+'</span></div>';
   ok.innerHTML=payBtn(m,t)||ICON('lock','sm')+(m==='x3'?'Payer '+F.eur(t/3,true)+' aujourd’hui':'Payer '+F.eur(t));ok.disabled=!t;return t}
  tot();bindOpts(sh,tot);$$('.chk',sh).forEach(function(c){c.addEventListener('click',function(){setTimeout(tot,0)})});
  ok.onclick=function(){var t=tot(),ss=sel(),m=optVal(sh,'pay');spin(ok,function(){ss.forEach(function(i){i.status='payée';i.due=D.iso(D.day(0));i.method=m==='sepa'?'Prélèvement SEPA':'Carte bancaire';if(i.id==='F-2026-1173'&&av)av.status='payée'});
    success(sh,{title:'Paiement reçu, merci Léa',text:'Votre reçu est envoyé à '+ME.email+'. '+(due()?'Il reste '+F.eur(due())+' à régler.':'Votre compte est à jour.'),
     head:sq('checkc','ok')+'<div class="grow"><div class="b" style="font-size:15.5px">'+F.eur(m==='x3'?t/3:t,m==='x3')+' réglés</div><div class="s mut">'+D.club.name+'</div></div>',
     rows:[['Date','17 nov. 2026, 9 h 41'],['Moyen',m==='apple'||m==='gpay'?payName(m):m==='sepa'?'Prélèvement SEPA':m==='x3'?'Carte Visa, 3 fois':m==='ancv'?'ANCV et carte Visa':'Carte Visa •••• 4242'],['Factures',ss.length+' réglée'+(ss.length>1?'s':'')],['Reçu','R-2026-0931']],more:['Télécharger le reçu',function(){P.toast('Reçu R-2026-0931 téléchargé',{icon:'download'})}]});
    if(after)after(t)})}}

P.mod({id:'adh-paiements',role:'adherent',group:'Compte',title:'Paiements',icon:'wallet',n:10,short:'Paiements',
 badge:function(){var d=due();return d>0?{v:F.eur(d),hot:true}:null},
 render:function(el,ctx){
  el.innerHTML=U.ph('Paiements','Le compte de la famille Martin : Léa, Jules et Ulysse. Tout se règle ici, en une fois ou en plusieurs.','')+'<div data-top></div>'+U.tabs([['fact','Factures'],['moy','Moyens de paiement'],['att','Attestations']],PS.tab,'data-pt')+'<div data-body style="margin-top:16px"></div>';
  $$('[data-pt]',el).forEach(function(b){b.addEventListener('click',function(){PS.tab=b.getAttribute('data-pt');body()})});
  function refresh(prev){top(prev);body();P.renderBadges&&P.renderBadges()}
  function top(prev){var d=due(),open=D.adhInvoices.filter(function(i){return i.status!=='payée'}),t=$('[data-top]',el);
   t.innerHTML='<div class="ad-pay"><div class="card tint d-argent ad-bal">'+ILLU.pieces({size:null,cls:'corner'})+'<div class="hrow sp wrap" style="--g:8px;padding-right:120px"><span class="eyebrow" style="color:inherit;opacity:.8">'+(d?'À régler':'Solde du compte')+'</span>'+(d?'<span class="ad-cd">'+ICON('alert','sm')+'Pension échue depuis 2 jours</span>':'<span class="ad-cd">'+ICON('checkc','sm')+'Compte à jour</span>')+'</div>'+
     '<div class="hrow" style="--g:12px;align-items:baseline"><div class="amt" data-amt>'+F.eur(d)+'</div>'+(d?'':'<span class="strass" style="background:var(--strass);width:16px;height:16px"></span>')+'</div>'+
     (d?'<div>'+open.map(function(i){return '<div class="ln"><span class="ellip">'+i.label.split(',')[0]+(i.status==='en retard'?' <span class="chip bad" style="margin-left:6px">Échue</span>':'')+'</span><b>'+F.eur(i.amount)+'</b></div>'}).join('')+'</div><div class="hrow wrap" style="--g:8px;margin-top:auto"><button class="btn go" data-payall>'+ICON('card','sm')+'Payer '+F.eur(d)+'</button><button class="btn ad-nb" style="height:44px" data-pay3>En 3 fois sans frais</button></div>':
      '<p style="color:color-mix(in srgb,var(--navy-ink) 80%,transparent);max-width:46ch">Toutes vos factures sont réglées. La pension de décembre sera prélevée le 1er décembre, demi-pension déduite.</p><div class="hrow wrap" style="--g:8px"><button class="btn ad-nb" style="height:44px" data-rc>'+ICON('download','sm')+'Télécharger le reçu</button></div>')+'</div>'+
    '<div class="stack" style="--g:14px"><div class="ad-pass"><div class="hrow sp" style="position:relative;z-index:1"><div><div class="xs" style="opacity:.8;font-weight:600;letter-spacing:.06em;text-transform:uppercase">Carte 10 séances</div><div class="disp bb" style="font-size:22px;margin-top:2px">'+A.card.left+' séances restantes</div></div><button class="btn sm" style="background:color-mix(in srgb,var(--acc-ink) 18%,transparent);color:var(--acc-ink);box-shadow:none" data-buy>Recharger</button></div>'+
      '<div class="pn">'+Array.apply(null,Array(A.card.total)).map(function(_,i){var u=i<A.card.total-A.card.left;return '<i class="'+(u?'u':'')+'">'+(u?'<svg class="i" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>':HORSE_GLYPH())+'</i>'}).join('')+'</div><div class="hrow sp wrap xs" style="--g:4px 12px;opacity:.85;position:relative;z-index:1"><span>Léa Martin · valable jusqu’au 30 juin 2027</span><span class="num">N° 2026-0412</span></div></div>'+
     '<div class="card"><div class="ch"><h3>Prochaines échéances</h3><span class="xs mut hide-s">Prélevées automatiquement</span></div><div class="list" style="padding:6px 0">'+[['1','déc.','Pension de décembre, Ulysse','520 € moins 180 € de demi-pension · SEPA',340],['5','déc.','Forfait annuel de Jules, 2 sur 3','Carte Visa •••• 4242',260],['5','janv.','Forfait annuel de Jules, 3 sur 3','Carte Visa •••• 4242',260]].map(function(e){return '<div class="li"><div class="ad-date g" style="width:44px;height:46px"><b style="font-size:17px">'+e[0]+'</b><span>'+e[1]+'</span></div><div class="grow"><div class="t ellip">'+e[2]+'</div><div class="s ellip">'+e[3]+'</div></div><b class="num s">'+F.eur(e[4])+'</b></div>'}).join('')+'</div></div></div></div>';
   if(prev&&!P.RM){var a=$('[data-amt]',t),t0=performance.now();(function st(now){var k=Math.min(1,(now-t0)/900),e=1-Math.pow(1-k,4);a.textContent=F.eur(Math.round(prev+(d-prev)*e));if(k<1)requestAnimationFrame(st)})(t0)}
   var pa=$('[data-payall]',t);if(pa){pa.onclick=function(){var d0=due();paySheet(function(){refresh(d0)})};$('[data-pay3]',t).onclick=function(){var d0=due();paySheet(function(){refresh(d0)});var o=$('.ad-opt[data-v="x3"]',P.app());if(o)o.click()}}
   var rc=$('[data-rc]',t);if(rc)rc.onclick=function(){P.toast('Reçu R-2026-0931 téléchargé',{icon:'download'})};
   $('[data-buy]',t).onclick=function(){var sh=P.sheet({title:'Recharger ma carte',icon:'wallet',body:opts([['10','Carte 10 séances','290 €, soit 29 € la séance',sq('ticket')],['20','Carte 20 séances','540 €, soit 27 € la séance',sq('ticket')],['5','Carte 5 séances','155 €, soit 31 € la séance',sq('ticket')]],'10','card')+'<div class="ad-lbl">Pour qui ?</div>'+opts(D.adhFamily.map(function(f){return [f.id,f.first+' '+f.last,'Galop '+f.galop,U.av(f)]}),'lea','who')+'<p class="xs mut" style="margin-top:14px">Valable 12 mois, utilisable par toute la famille. Les séances non utilisées sont reportées sur la carte suivante.</p>',foot:'<button class="btn pri lg ad-full" data-ok>'+ICON('lock','sm')+'Payer 290 €</button>'});
     var ok=$('[data-ok]',sh);bindOpts(sh,function(){ok.innerHTML=ICON('lock','sm')+'Payer '+F.eur({5:155,10:290,20:540}[optVal(sh,'card')])});
     ok.onclick=function(){var n=+optVal(sh,'card');spin(ok,function(){A.card.left+=n;A.card.total=Math.max(10,Math.ceil(A.card.left/10)*10);success(sh,{title:'Carte rechargée',text:n+' séances ajoutées. Vous pouvez réserver tout de suite.'});top()})}}}
  function body(){var b=$('[data-body]',el),h='';
   if(PS.tab==='fact'){var ls=D.adhInvoices.filter(function(i){return PS.filt==='all'||(PS.filt==='open'?i.status!=='payée':i.status==='payée')});
    h='<div class="hrow sp wrap" style="--g:10px;margin-bottom:12px">'+U.seg([['all','Toutes'],['open','À régler'],['paid','Payées']],PS.filt,'data-pf')+'<button class="btn sm" data-exp>'+ICON('download','sm')+'Tout télécharger, année 2026</button></div><div class="card">'+(ls.length?ls.map(function(i){return '<div class="ad-inv" data-inv="'+i.id+'">'+sq(i.amount<0?'swap':/Pension/.test(i.label)?'stable':/Licence/.test(i.label)?'medal':/Coaching/.test(i.label)?'coach':/Ferrure/.test(i.label)?'hoof':/Transport/.test(i.label)?'van':/Engagement/.test(i.label)?'trophy':'invoice',i.status==='en retard'?'bad':'acc')+'<div style="min-width:0"><div class="b s ellip">'+i.label+'</div><div class="xs mut ellip"><span class="mono" style="font-size:13px">'+i.id+'</span> · '+F.dateY(i.date)+' · '+i.method+'</div></div><div class="am"><div>'+F.eur(i.amount)+'</div><div style="margin-top:3px">'+U.status(i.status)+'</div></div><button class="btn ghost icon sm dl" data-dl="'+i.id+'" title="Télécharger le PDF">'+ICON('download','sm')+'</button></div>'}).join(''):U.empty('checkc','Rien à régler','Toutes vos factures sont payées.'))+'</div>'}
   else if(PS.tab==='moy'){h='<div class="g3" style="--g:16px"><div class="span2 card"><div class="ch"><h3>Moyens enregistrés</h3><button class="btn sm" data-addm>'+ICON('plus','sm')+'Ajouter</button></div><div style="padding:6px 0">'+PS.methods.map(function(m){return '<div class="ad-pm"><span class="ad-cardv'+(m[0]==='cb'?'':' b')+'">'+m[1]+'</span><div class="grow"><div class="b s">'+m[2]+'</div><div class="xs mut">'+m[3]+'</div></div>'+(PS.def===m[0]?U.chip('Par défaut','acc'):'<button class="btn ghost sm hide-s" data-def="'+m[0]+'">Utiliser par défaut</button>')+'<button class="btn ghost icon sm" data-rm="'+m[0]+'" title="Retirer ce moyen de paiement">'+ICON('trash','sm')+'</button></div>'}).join('')+'</div></div>'+
     '<div class="card"><div class="ch"><h3>Préférences</h3></div><div class="list" style="padding:6px 0">'+[['Prélèvement automatique','Pension et forfaits, le 1er du mois',1],['Reçu par e-mail','Après chaque paiement',1],['Rappel 3 jours avant','Notification avant chaque échéance',1],['Paiement en un geste','Sans ressaisir la carte, avec Face ID',0]].map(function(x){return '<div class="li"><div class="grow"><div class="t">'+x[0]+'</div><div class="s">'+x[1]+'</div></div>'+U.tog(!!x[2])+'</div>'}).join('')+'</div></div></div>'}
   else{h='<div class="g2" style="--g:14px">'+[['doc','Attestation de paiement pour votre CSE','Forfait de Jules et licences, saison 2026-2027, tamponnée par le club','CSE'],['family','Attestation d’inscription de Jules','Pour la CAF, la mairie ou le Pass’Sport','Inscription'],['report','Récapitulatif annuel 2026','Toutes vos dépenses par mois et par catégorie, pour votre déclaration ou votre comptable','Annuel'],['invoice','Factures acquittées','Un PDF par facture, avec la mention « acquittée »','Acquittées'],['medal','Attestation de licence FFE 2027','Léa et Jules, avec numéro de licence et assurance','Licence'],['shield','Attestation d’assurance du cheval','Responsabilité civile d’Ulysse, exigée en concours','Assurance']].map(function(a){return '<div class="card" style="padding:16px"><div class="hrow" style="--g:12px;align-items:flex-start">'+sq(a[0])+'<div class="grow"><div class="b">'+a[1]+'</div><div class="s mut" style="margin-top:2px">'+a[2]+'</div><div class="hrow" style="--g:8px;margin-top:12px"><button class="btn sm" data-att="'+a[3]+'">'+ICON('download','sm')+'Télécharger</button><button class="btn ghost sm" data-attm="'+a[3]+'">'+ICON('mail','sm')+'Recevoir par e-mail</button></div></div></div></div>'}).join('')+'</div>'}
   b.innerHTML=h;P.animate(b);swIn(b);
   $$('[data-pf]',b).forEach(function(x){x.addEventListener('click',function(){PS.filt=x.getAttribute('data-pf');body()})});
   $$('[data-inv]',b).forEach(function(x){x.onclick=function(e){if(e.target.closest('[data-dl]')){P.toast(x.getAttribute('data-inv')+'.pdf téléchargé',{icon:'download'});return}var d0=due();invSheet(D.adhInvoices.find(function(i){return i.id===x.getAttribute('data-inv')}),function(){refresh(d0)})}});
   var ex=$('[data-exp]',b);if(ex)ex.onclick=function(){P.toast(D.adhInvoices.length+' factures de 2026 téléchargées dans une archive',{icon:'download'})};
   $$('[data-def]',b).forEach(function(x){x.onclick=function(){PS.def=x.getAttribute('data-def');body();P.toast('Moyen de paiement par défaut modifié')}});
   $$('[data-rm]',b).forEach(function(x){x.onclick=function(){var id=x.getAttribute('data-rm');if(id===PS.def){P.toast('Choisissez d’abord un autre moyen par défaut',{icon:'alert'});return}var i=PS.methods.findIndex(function(m){return m[0]===id}),m=PS.methods.splice(i,1)[0];body();P.toast(m[2]+' retiré',{undo:function(){PS.methods.splice(i,0,m);body()}})}});
   var am=$('[data-addm]',b);if(am)am.onclick=function(){var sh=P.sheet({title:'Ajouter un moyen de paiement',icon:'card',body:U.seg([['c','Carte bancaire'],['s','Compte bancaire']],'c')+'<div class="stack" style="--g:12px;margin-top:16px"><label class="field"><span>Numéro de carte</span><input class="in num" inputmode="numeric" placeholder="1234 5678 9012 3456"></label><div class="g2" style="--g:12px;grid-template-columns:repeat(2,minmax(0,1fr))"><label class="field"><span>Expiration</span><input class="in num" placeholder="MM / AA"></label><label class="field"><span>Cryptogramme</span><input class="in num" placeholder="123"></label></div><label class="field"><span>Nom sur la carte</span><input class="in" value="Léa Martin"></label></div><p class="xs mut hrow" style="--g:6px;margin-top:14px">'+ICON('lock','sm')+'Vos données sont chiffrées et conservées par Stripe.</p>',foot:'<button class="btn pri ad-full" data-ok>Enregistrer la carte</button>'});
     $('[data-ok]',sh).onclick=function(){PS.methods.push(['cb2','MC','Carte Mastercard se terminant par 8830','Ajoutée aujourd’hui']);sh.close();body();P.toast('Carte enregistrée')}};
   $$('[data-att]',b).forEach(function(x){x.onclick=function(){P.toast('Attestation « '+x.getAttribute('data-att')+' » générée et téléchargée',{icon:'download'})}});
   $$('[data-attm]',b).forEach(function(x){x.onclick=function(){x.innerHTML=ICON('check','sm')+'Envoyée';P.toast('Attestation envoyée à '+ME.email,{icon:'mail'})}})}
  top();body();
  if(ctx.params.pay&&PS.last!==ctx.params){PS.last=ctx.params;var d0=due();if(d0)setTimeout(function(){paySheet(function(){refresh(d0)})},350)}
 }});

/* =====================================================================
   9. CONTRATS : lire et signer au doigt
   ===================================================================== */
P.css(`
.ad-cth{position:relative;overflow:hidden;padding:26px 28px;display:flex;flex-direction:column;gap:10px;margin-bottom:16px}
.ad-cth .illu.corner{position:absolute;right:12px;top:8px;width:132px;height:132px;pointer-events:none}
.ad-cth .big{font-size:60px}.ad-cth .sub{font-size:15px;opacity:.85;margin-top:4px}
@container main (max-width:620px){.ad-cth{padding:20px}.ad-cth .illu.corner{width:96px;height:96px;right:0;top:0}.ad-cth .big{font-size:48px}.ad-cthn{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px!important;align-items:start!important}.ad-cthn .sub{font-size:14px}}
.ad-doc{padding:22px;display:flex;gap:22px;align-items:flex-start}
.ad-doc .t2{font-size:20px;line-height:1.2;letter-spacing:-.02em;margin:8px 0 4px}
.ad-doc>.grow{display:flex;flex-direction:column;gap:12px}
@container main (max-width:620px){.ad-doc{flex-direction:column;padding:20px 18px 18px;gap:14px}.ad-doc .ad-pth{width:72px;height:92px;padding:18px 9px 0;gap:6px}.ad-doc .btn{flex:1}}
.ad-pth{position:relative;flex:none;width:96px;height:124px;border-radius:10px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2),0 10px 24px -12px rgba(10,22,54,.35);padding:22px 12px 0;display:flex;flex-direction:column;gap:7px;transform:rotate(-3deg);transition:transform var(--t-3) var(--e-spring)}
.ad-doc:hover .ad-pth,.ad-dt:hover .ad-pth{transform:rotate(0) translateY(-3px)}
.ad-pth i{display:block;height:5px;border-radius:3px;background:var(--line-2)}
.ad-pth i.h{width:62%}
.ad-pth .pi{position:absolute;left:10px;top:-10px;width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:var(--pf-bg);color:var(--pf-ink)}
.ad-pth .pi svg.i{width:17px;height:17px}
.ad-pth .sg{position:absolute;left:10px;right:10px;bottom:10px;height:24px;border-bottom:1.5px dashed var(--acc);color:var(--acc);display:flex;align-items:center}
.ad-pth .sg svg.i{width:18px;height:18px}
.ad-pth .seal{position:absolute;right:-10px;bottom:-8px;width:40px;height:40px;border-radius:50%;background:var(--ok);color:var(--on-acc);display:grid;place-items:center;box-shadow:0 0 0 3px var(--surface);animation:ad-st .4s var(--e-spring) both}
.ad-pth .seal svg.i{width:22px;height:22px;stroke-width:2.6}
.ad-trk2{display:flex;align-items:flex-start;margin-top:2px}
.ad-trk2 .sg{display:flex;flex-direction:column;align-items:center;gap:6px;position:relative;flex:none;width:72px;text-align:center;font-size:13px;font-weight:600;color:var(--mut)}
.ad-trk2 .sg .av{width:40px;height:40px;opacity:.55}
.ad-trk2 .sg.on{color:var(--ink)}.ad-trk2 .sg.on .av{opacity:1}
.ad-trk2 .sg em{position:absolute;top:24px;left:calc(50% + 8px);width:22px;height:22px;border-radius:50%;display:grid;place-items:center;background:var(--surface-3);color:var(--mut);box-shadow:0 0 0 2.5px var(--surface)}
.ad-trk2 .sg.on em{background:var(--ok);color:var(--on-acc)}
.ad-trk2 em svg.i{width:13px;height:13px;stroke-width:2.6}
.ad-trk2 .ln{flex:1;min-width:12px;height:3px;border-radius:2px;margin-top:19px;background:var(--line-2)}
.ad-trk2 .ln.on{background:var(--ok)}
.ad-dts{display:grid;grid-template-columns:repeat(auto-fill,minmax(190px,1fr));gap:14px}
.ad-dt{padding:22px 16px 16px;display:flex;flex-direction:column;align-items:flex-start;gap:8px;text-align:left;transition:transform var(--t-2) var(--e-out),box-shadow var(--t-2)}
.ad-dt:hover{transform:translateY(-3px);box-shadow:var(--shadow-2)}
.ad-dt .ad-pth{width:70px;height:90px;padding:18px 9px 0;gap:6px;margin-bottom:8px}
.ad-dt .ad-pth .seal{width:32px;height:32px}.ad-dt .ad-pth .seal svg.i{width:18px;height:18px}
.ad-dt .t3{font-weight:600;font-size:15px;line-height:1.3}
@container main (max-width:620px){.ad-dts{grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.ad-dt{padding:18px 12px 12px}}
.ad-cobn{--navy-ink:var(--d-ink);--navy:var(--d-bg)}
.ad-ct{padding:18px;display:flex;gap:14px;align-items:flex-start}
.ad-ct+.ad-ct{border-top:1px solid var(--line)}
.ad-paper{background:var(--surface-2);border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line);padding:20px;font-size:13px;line-height:1.6;color:var(--ink-2);max-height:260px;overflow-y:auto}
.ad-paper h4{font-size:15px;margin-bottom:4px}
.ad-paper h5{font:700 13px var(--f-text);color:var(--ink);margin:14px 0 2px}
.ad-pad{position:relative;height:170px;border-radius:var(--r-md);background:var(--surface);box-shadow:inset 0 0 0 1.5px var(--line-2);overflow:hidden;touch-action:none;transition:box-shadow var(--t-2)}
.ad-pad.act{box-shadow:inset 0 0 0 2px var(--acc)}
.ad-pad canvas{position:absolute;inset:0;width:100%;height:100%;cursor:crosshair}
.ad-pad .bs{position:absolute;left:18px;right:18px;bottom:44px;border-bottom:1.5px dashed var(--line-2);pointer-events:none}
.ad-pad .bs::before{content:"×";position:absolute;left:0;bottom:4px;font:500 18px var(--f-text);color:var(--mut-2)}
.ad-pad .hl{position:absolute;inset:0;display:grid;place-items:center;color:var(--mut-2);font-weight:600;pointer-events:none;transition:opacity var(--t-1)}
.ad-pad.ink .hl{opacity:0}
.ad-pad .ul{position:absolute;left:18px;bottom:43px;height:2.5px;border-radius:2px;background:var(--acc);width:0;pointer-events:none}
.ad-pad.done .ul{width:calc(100% - 36px);transition:width var(--t-3) var(--e-out)}
.ad-pad.done canvas{pointer-events:none}
.ad-stamp{position:absolute;right:12px;bottom:8px;display:flex;align-items:center;gap:8px;padding:6px 10px;border-radius:9px;background:var(--ok-pale);color:var(--ok);font-size:13px;font-weight:700;animation:ad-st .24s var(--e-spring) both}
.ad-stamp .strass{background:var(--acc);animation:ad-spark .6s var(--e-out) .15s both}
@keyframes ad-st{from{opacity:0;transform:scale(1.15)}}
`);
function CONTRACTS(){var kid=isKid(),s=function(id,list){return list.concat(A.signed[id]?['m001']:[])};
  var L=[{id:'ct2',title:'Avenant de renouvellement de la demi-pension',sub:'Ulysse de la Roche · '+DPR.first+' '+DPR.last+' · en place depuis le 1er septembre',icon:'swap',status:'à signer',signers:['s01','m019','m001'],signed:s('ct2',['s01']),date:D.iso(D.day(-1)),
    arts:[['Objet','Le présent avenant renouvelle la demi-pension en place depuis le 1er septembre 2026. La propriétaire met toujours Ulysse de la Roche, hongre Selle Français né en 2015, à disposition de la demi-pensionnaire deux jours par semaine, le mardi et le samedi. Les autres clauses du contrat initial restent inchangées.'],['Participation','La demi-pensionnaire verse 180 € par mois au club, déduits de la pension de la propriétaire. Les prestations qu’elle demande sont facturées sur son propre compte.'],['Utilisation','Travail sur le plat et saut jusqu’à 90 cm en reprise encadrée. Les sorties en extérieur se font accompagnée. Toute sortie en concours demande l’accord écrit de la propriétaire.'],['Santé et assurance','Les frais vétérinaires courants restent à la charge de la propriétaire. La demi-pensionnaire est couverte par sa licence FFE et s’engage à signaler tout incident dans le journal du cheval.'],['Durée et préavis','La demi-pension renouvelée court jusqu’au 31 août 2027. Chaque partie peut y mettre fin avec un préavis d’un mois.']]},
   {id:'ct9',title:'Autorisation de transport et décharge',sub:'Concours de Rambouillet, dimanche 22 novembre',icon:'van',status:'à signer',signers:['s01','m001'],signed:s('ct9',['s01']),date:D.iso(D.day(-2)),
    arts:[['Transport','J’autorise le transport d’Ulysse de la Roche dans le van du club immatriculé FN-208-LB, que je conduis, entre l’Écurie des Tilleuls et la Bergerie nationale.'],['Responsabilité','Je certifie que les vaccins d’Ulysse sont à jour et que son livret l’accompagne. Le club n’est pas responsable des blessures survenues pendant le transport, hors faute de sa part.'],['Passagers','Je transporte deux cavaliers mineurs avec l’accord écrit de leurs parents, joint à ce document.']]}];
  if(kid)L.unshift({id:'ct10',title:'Autorisation parentale et droit à l’image',sub:'Jules Martin · stage de Noël et saison 2026-2027',icon:'child',status:'à signer',signers:['s01','m001'],signed:s('ct10',['s01']),date:D.iso(D.day(0)),
    arts:[['Autorisation','J’autorise mon fils Jules Martin, né en 2017, à participer aux activités du club, y compris les sorties en extérieur encadrées.'],['Soins','En cas d’urgence, j’autorise l’équipe à faire pratiquer les soins nécessaires et à me prévenir au '+ME.phone+'.'],['Droit à l’image','J’autorise le club à publier des photos de Jules sur son site et dans l’application, sans mention de son nom de famille.']]});
  L.forEach(function(c){if(A.signed[c.id]&&c.signed.length===c.signers.length)c.status='signé';else if(A.signed[c.id])c.status='à signer'});
  return L}
var SIGNED=[['ct1','Contrat de pension complète','Ulysse de la Roche · 520 € par mois','2024-09-01','stable'],['dp0','Contrat de demi-pension initial','Ulysse de la Roche · '+DPR.first+' '+DPR.last+' · 180 € par mois','2026-09-01','swap'],['ri','Règlement intérieur 2026-2027','Lu et accepté pour Léa et Jules','2026-09-02','doc'],['sepa','Mandat de prélèvement SEPA','Compte FR76 •••• 1234','2024-09-01','bank'],['img','Droit à l’image','Léa Martin, saison 2026-2027','2026-09-02','image']];
function signPad(box,onInk){var cv=$('canvas',box),g=cv.getContext('2d'),dpr=Math.min(devicePixelRatio||1,2),ink=false,last=null,lw=2.4,col=getComputedStyle(document.documentElement).getPropertyValue('--ink').trim()||getComputedStyle(document.body).color;
  function size(){var r=box.getBoundingClientRect();cv.width=r.width*dpr;cv.height=r.height*dpr;g.setTransform(dpr,0,0,dpr,0,0);g.lineCap=g.lineJoin='round';g.strokeStyle=col}
  size();
  function pos(e){var r=cv.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top,t:performance.now()}}
  function seg(a,b){var d=Math.hypot(b.x-a.x,b.y-a.y),v=d/Math.max(1,b.t-a.t),w=Math.max(1.5,Math.min(3.5,3.6-v*1.4));lw+=(w-lw)*.35;g.lineWidth=lw;g.beginPath();g.moveTo(a.x,a.y);g.quadraticCurveTo(a.x,a.y,(a.x+b.x)/2,(a.y+b.y)/2);g.lineTo(b.x,b.y);g.stroke()}
  function mark(){if(!ink){ink=true;box.classList.add('ink');onInk(true)}}
  cv.onpointerdown=function(e){e.preventDefault();cv.setPointerCapture(e.pointerId);last=pos(e);box.classList.add('act');mark();g.beginPath();g.arc(last.x,last.y,1.2,0,6.3);g.fillStyle=col;g.fill()};
  cv.onpointermove=function(e){if(!last)return;var p=pos(e);seg(last,p);last=p};
  cv.onpointerup=cv.onpointercancel=function(){last=null;box.classList.remove('act')};
  return {clear:function(){g.clearRect(0,0,cv.width,cv.height);ink=false;box.classList.remove('ink');onInk(false)},
   auto:function(){this.clear();mark();var r=box.getBoundingClientRect(),w=r.width,h=r.height,pts=[],x0=w*.2,y0=h-58;
    for(var i=0;i<=90;i++){var t=i/90,x=x0+t*w*.56,y=y0-Math.sin(t*Math.PI*5.2)*(26-t*14)-Math.sin(t*Math.PI*1.3)*14+(t>.82?(t-.82)*-90:0);pts.push({x:x,y:y,t:i*(4+Math.abs(Math.cos(t*16))*9)})}
    var k=1;(function step(){for(var n=0;n<(P.RM?90:3)&&k<pts.length;n++,k++)seg(pts[k-1],pts[k]);if(k<pts.length)requestAnimationFrame(step)})()}}}
function signSheet(c,after){var done=!!A.signed[c.id]||c.status==='signé';
  var sh=P.sheet({title:c.title,icon:'sign',wide:true,body:function(b){
   b.innerHTML='<div class="ad-paper"><h4>'+c.title+'</h4><div class="xs mut">'+D.club.name+' · '+c.sub+' · modèle validé par le club</div>'+c.arts.map(function(a,i){return '<h5>Article '+(i+1)+'. '+a[0]+'</h5><p>'+a[1]+'</p>'}).join('')+'</div>'+
    '<div class="ad-lbl">Signataires</div><div class="card list" data-sg></div>'+
    (done?'':'<label class="hrow" style="--g:10px;margin:16px 0 12px;cursor:pointer">'+U.chk(false,'read')+'<span class="s">J’ai lu le document en entier et j’en accepte les termes.</span></label>')+
    '<div class="hrow sp" style="margin:'+(done?'16px':'0')+' 0 8px"><span class="ad-lbl" style="margin:0">Votre signature</span>'+(done?'':'<span class="hrow" style="--g:4px"><button class="btn ghost sm" data-auto>'+ICON('sign','sm')+'Utiliser ma signature enregistrée</button><button class="btn ghost sm" data-clr>Effacer</button></span>')+'</div>'+
    '<div class="ad-pad'+(done?' ink done':'')+'"><canvas></canvas><span class="bs"></span><span class="ul"></span><span class="hl">Signez ici, au doigt ou à la souris</span></div>'+
    '<p class="xs mut hrow" style="--g:6px;margin-top:10px">'+ICON('shield','sm')+'Signature électronique horodatée, de même valeur qu’une signature manuscrite (règlement eIDAS).</p>'},
   foot:done?'<button class="btn pri ad-full" data-dl>'+ICON('download','sm')+'Télécharger le PDF signé</button>':'<button class="btn pri lg ad-full" data-ok disabled>'+ICON('sign','sm')+'Signer le document</button>'});
  var pad=$('.ad-pad',sh),ok=$('[data-ok]',sh),inked=false;
  function signers(){$('[data-sg]',sh).innerHTML=c.signers.map(function(s){var y=c.signed.indexOf(s)>=0||(s==='m001'&&A.signed[c.id]);return '<div class="li">'+U.av(s)+'<div class="grow"><div class="t">'+(s==='m001'?'Vous, Léa Martin':D.name(s))+'</div><div class="s">'+(s==='s01'?'Gérante du club':s==='m001'?(c.id==='ct10'?'Représentante légale':'Propriétaire'):(DPR.minor?'Demi-pensionnaire, signature de son représentant légal':'Demi-pensionnaire'))+'</div></div>'+(y?U.chip('Signé','ok',true):U.chip('En attente',''))+'</div>'}).join('')}
  signers();
  function stamp(){pad.classList.add('done');pad.insertAdjacentHTML('beforeend','<span class="ad-stamp"><span class="strass"></span>Signé le 17 nov. 2026 à 9 h 41</span>')}
  if(done){var api0=signPad(pad,function(){});setTimeout(function(){api0.auto();stamp()},350);$('[data-dl]',sh).onclick=function(){P.toast(c.title+' téléchargé',{icon:'download'})};return}
  var api=signPad(pad,function(v){inked=v;chk()});
  function chk(){setTimeout(function(){ok.disabled=!(inked&&$('.chk[data-id="read"]',sh).getAttribute('aria-checked')==='true')},0)}
  $('.chk[data-id="read"]',sh).addEventListener('click',chk);$('.chk[data-id="read"]',sh).parentNode.addEventListener('click',chk);
  $('[data-clr]',sh).onclick=function(){api.clear()};$('[data-auto]',sh).onclick=function(){api.auto()};
  ok.onclick=function(){A.signed[c.id]=true;stamp();signers();var f=$('.sf',sh),wait=c.signers.length-c.signed.length-1;
   f.innerHTML='<button class="btn ad-full" data-dl>'+ICON('download','sm')+'Télécharger le PDF</button><button class="btn pri ad-full" data-done>Terminé</button>';
   $$('[data-auto],[data-clr]',sh).forEach(function(x){x.remove()});
   $('[data-dl]',f).onclick=function(){P.toast(c.title+' téléchargé',{icon:'download'})};$('[data-done]',f).onclick=function(){sh.close()};
   P.toast(wait>0?'Document signé. '+DPR.first+' est relancée pour sa signature.':'Document signé par toutes les parties, copie envoyée par e-mail',{icon:'sign'});if(after)after()}}

P.mod({id:'adh-contrats',role:'adherent',group:'Compte',title:'Contrats',icon:'contract',n:20,
 badge:function(){var n=toSign().length;return n?{v:n,hot:true}:null},
 render:function(el,ctx){
  el.innerHTML='<div class="ad-ph">'+U.ph('Contrats et documents','Lisez, signez au doigt et retrouvez tous vos documents signés. Plus rien à imprimer ni à rapporter à l’accueil.',profPill())+'</div><div data-body></div>';bindProf(el);
  function body(){var L=CONTRACTS(),todo=L.filter(function(c){return !A.signed[c.id]}),mine=L.filter(function(c){return A.signed[c.id]});
   function paper(ic,ok){return '<span class="ad-pth'+(ok?' ok':'')+'"><i></i><i></i><i></i><i class="h"></i><i></i><i class="h"></i><span class="pi">'+ICON(ic)+'</span>'+(ok?'<span class="seal">'+ICON('check')+'</span>':'<span class="sg">'+ICON('sign')+'</span>')+'</span>'}
   function track(c){return '<div class="ad-trk2">'+c.signers.map(function(sg,i){var y=c.signed.indexOf(sg)>=0;return (i?'<span class="ln'+(y?' on':'')+'"></span>':'')+'<span class="sg'+(y?' on':'')+'">'+U.av(sg,'sm')+'<em>'+ICON(y?'check':'clock')+'</em><span>'+(sg==='m001'?'Vous':D.person(sg).first)+'</span></span>'}).join('')+'</div>'}
   var all=mine.length+SIGNED.length;
   $('[data-body]',el).innerHTML='<div class="card tint d-plateforme ad-cth">'+ILLU.contrat({size:null,cls:'corner'})+'<span class="eyebrow" style="color:inherit;opacity:.8">Vos documents</span><div class="hrow wrap ad-cthn" style="--g:28px;align-items:flex-end">'+
     '<div><div class="big num" data-count="'+todo.length+'">'+todo.length+'</div><div class="sub">'+(todo.length?'document'+(todo.length>1?'s':'')+' à signer':'rien à signer, tout est à jour')+'</div></div><div><div class="big num" style="opacity:.55" data-count="'+all+'">'+all+'</div><div class="sub">documents signés et archivés</div></div></div></div>'+
    '<div class="g3" style="--g:16px"><div class="span2 stack" style="--g:16px">'+
     (todo.length?todo.map(function(c){var n=c.signed.length;return '<div class="card ad-doc">'+paper(c.icon)+'<div class="grow" style="min-width:0"><div class="hrow wrap" style="--g:8px">'+U.chip('À signer','acc',true)+'<span class="s mut">reçu '+F.rel(c.date)+'</span></div><h3 class="t2">'+c.title+'</h3><div class="s mut">'+c.sub+'</div>'+
       track(c)+'<div class="hrow" style="--g:10px;margin-top:2px"><span class="grow">'+U.bar(n/c.signers.length*100,'var(--ok)')+'</span><span class="s b num">'+n+' sur '+c.signers.length+'</span></div>'+
       '<div class="hrow wrap" style="--g:8px"><button class="btn dark" data-sign="'+c.id+'">'+ICON('sign','sm')+'Lire et signer</button><button class="btn ghost" data-later>'+ICON('bell','sm')+'Me le rappeler demain</button></div></div></div>'}).join(''):
      '<div class="card">'+U.empty('checkc','Vous êtes à jour','Tous vos documents sont signés et rangés ci-dessous.')+'</div>')+
    '<div><div class="hrow sp" style="margin:6px 0 12px"><h3 style="font-size:19px">Documents signés</h3><span class="s mut">'+all+' documents</span></div><div class="ad-dts">'+
     mine.map(function(c){var pend=c.signed.length<c.signers.length;return '<button class="card ad-dt" data-sign="'+c.id+'">'+paper(c.icon,!pend)+'<span class="t3">'+c.title+'</span><span class="s mut">Signé aujourd’hui à 9 h 41</span>'+U.chip(pend?'En attente de '+(c.signers.length-c.signed.length):'Signé par tous',pend?'warn':'ok',true)+'</button>'}).join('')+
     SIGNED.map(function(d){return '<button class="card ad-dt" data-doc="'+d[1]+'">'+paper(d[4],true)+'<span class="t3">'+d[1]+'</span><span class="s mut">'+d[2]+'</span><span class="hrow s" style="--g:6px;color:var(--ok);font-weight:600">'+ICON('download','sm')+'Signé le '+F.dateY(d[3])+'</span></button>'}).join('')+'</div></div></div>'+
    '<div class="stack" style="--g:14px"><div class="card ad-b"><div class="ch"><h3>Comment ça marche</h3></div><div class="cb">'+[['eye','Lisez','Le document s’ouvre en entier, article par article.','acc'],['sign','Signez au doigt','Sur votre téléphone, ou à la souris sur ordinateur.','plateforme'],['lock','C’est archivé','Chaque partie reçoit sa copie, horodatée et infalsifiable.','chevaux']].map(function(x,i){return '<div class="ad-row" style="align-items:flex-start"><span class="ico d-'+x[3]+'">'+ICON(x[0])+'</span><div class="grow"><div class="t" style="font-size:15px">'+(i+1)+'. '+x[1]+'</div><div class="s mut">'+x[2]+'</div></div></div>'}).join('')+'</div></div>'+
     '<div class="card ad-b"><div class="ch"><h3>Mes pièces</h3></div><div class="list" style="padding:6px 0"><div class="li">'+sq('checkc','ok')+'<div class="grow"><div class="t">Certificat médical</div><div class="s">Valable jusqu’en septembre 2027</div></div></div><div class="li">'+sq('checkc','ok')+'<div class="grow"><div class="t">Assurance d’Ulysse</div><div class="s">Responsabilité civile, échéance en mars</div></div></div></div><div class="cf"><button class="btn grow" data-up>'+ICON('upload','sm')+'Déposer un document</button></div></div></div></div>';
   $$('[data-sign]',el).forEach(function(x){x.onclick=function(){signSheet(CONTRACTS().find(function(c){return c.id===x.getAttribute('data-sign')}),body)}});
   $$('[data-later]',el).forEach(function(x){x.onclick=function(){x.innerHTML=ICON('check','sm')+'Rappel demain à 9 h';x.disabled=true;P.toast('Rappel programmé demain à 9 h',{icon:'bell'})}});
   $$('[data-doc]',el).forEach(function(x){x.onclick=function(){P.toast(x.getAttribute('data-doc')+' téléchargé',{icon:'download'})}});
   $('[data-up]',el).onclick=function(){P.toast('Document déposé, l’accueil le vérifie sous 24 heures',{icon:'upload'})}}
  body();
  if(ctx.params.id&&el._p!==ctx.params){var c=CONTRACTS().find(function(x){return x.id===ctx.params.id});if(c&&PS.lastC!==ctx.params){PS.lastC=ctx.params;setTimeout(function(){signSheet(c,body)},350)}}
 }});

/* =====================================================================
   10. MESSAGES : club, moniteurs, coach, groupe concours
   ===================================================================== */
P.css(`
.ad-msg{display:grid;grid-template-columns:340px minmax(0,1fr);height:min(660px,calc(100vh - 260px));min-height:440px;overflow:hidden}
.ad-tl{border-right:1px solid var(--line);display:flex;flex-direction:column;min-height:0}
.ad-tl .hd{padding:12px;display:flex;flex-direction:column;gap:10px;border-bottom:1px solid var(--line)}
.ad-tls{overflow-y:auto;flex:1}
.ad-th2{display:flex;gap:12px;align-items:center;padding:12px 14px;cursor:pointer;position:relative;transition:background var(--t-1);width:100%;text-align:left;min-height:64px}
.ad-th2:hover{background:var(--surface-2)}
.ad-th2[aria-current="true"]{background:var(--acc-pale)}
.ad-th2 .un{min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:var(--acc);color:var(--acc-ink);font:700 13px/18px var(--f-text);text-align:center}
.ad-gav{width:44px;height:44px;border-radius:50%;background:var(--navy);color:var(--navy-ink);display:grid;place-items:center;flex:none}
.ad-cv{display:flex;flex-direction:column;min-height:0;min-width:0}
.ad-cvh{display:flex;align-items:center;gap:12px;padding:12px 16px;border-bottom:1px solid var(--line)}
.ad-cvb{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:10px;min-height:0;background:var(--surface-2)}
.ad-cvb .msg.a{background:var(--surface)}
.ad-cvb .who{font-size:13px;font-weight:600;color:var(--mut);margin:4px 0 -6px 4px}
.ad-cvb .dv{align-self:center;font-size:13px;color:var(--mut);font-weight:600;padding:2px 10px;border-radius:99px;background:var(--bg-2)}
.ad-cvf{padding:10px 12px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:8px}
.ad-comp{display:flex;gap:6px;align-items:center;padding:4px 4px 4px 6px;border-radius:14px;box-shadow:inset 0 0 0 1px var(--line-2);background:var(--surface)}
.ad-comp input{flex:1;border:0;outline:0;background:none;min-width:0;height:38px}
.ad-qr{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}
.ad-qr button{flex:none;font-size:13px;padding:6px 10px;border-radius:99px;background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);white-space:nowrap}
@container main (max-width:760px){.ad-msg{grid-template-columns:minmax(0,1fr);height:auto;min-height:0}.ad-msg .ad-cv{display:none}.ad-tl{border-right:0}.ad-th2[aria-current="true"]{background:none}}
.sheet .ad-cvb{margin:-18px;padding:16px;min-height:100%;background:var(--surface-2)}
.sheet .sf.ad-cvf{flex-direction:column;gap:8px}
/* Messages façon iMessage */
.ad-msg{border-radius:28px}
.ad-tl .hd{padding:16px}
.ad-pin{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:4px;padding:14px 10px 10px;border-bottom:1px solid var(--line)}
.ad-pin button{display:flex;flex-direction:column;align-items:center;gap:6px;padding:6px 2px;border-radius:16px;font-size:13px;font-weight:600;position:relative;min-width:0;transition:background var(--t-1),transform var(--t-2) var(--e-spring)}
.ad-pin button:hover{background:var(--surface-2)}.ad-pin button:active{transform:scale(.94)}
.ad-pin button>span:last-child{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ad-pin .av,.ad-pin .ad-gav{width:60px;height:60px;font-size:19px}
.ad-pin em{position:absolute;top:2px;right:calc(50% - 34px);min-width:22px;height:22px;padding:0 6px;border-radius:11px;background:var(--acc);color:var(--on-acc);font:700 13px/22px var(--f-text);box-shadow:0 0 0 2.5px var(--surface)}
.ad-th2{padding:12px 16px 12px 22px;min-height:76px;gap:14px}
.ad-th2 .av,.ad-th2 .ad-gav{width:52px;height:52px}
.ad-th2 b.s{font-size:15.5px}
.ad-th2 .ud{position:absolute;left:7px;top:50%;width:10px;height:10px;margin-top:-5px;border-radius:50%;background:var(--acc)}
.ad-th2+.ad-th2::before{content:"";position:absolute;left:88px;right:0;top:0;height:1px;background:var(--line)}
.ad-th2 .un{min-width:22px;height:22px;border-radius:11px;font:700 13px/22px var(--f-text);padding:0 6px}
.ad-cvh{flex-direction:column;gap:6px;padding:14px 16px 12px;position:relative;text-align:center;background:color-mix(in srgb,var(--surface) 88%,transparent);backdrop-filter:blur(12px)}
.ad-cvh .av,.ad-cvh .ad-gav{width:52px;height:52px}
.ad-cvh .acts{position:absolute;right:12px;top:14px;display:flex;gap:4px}
.ad-cvb{background:var(--surface);gap:4px;padding:18px 18px 12px}
.ad-cvb .msg{position:relative;max-width:min(78%,520px);padding:10px 15px;border-radius:21px;font-size:15.5px;line-height:1.4;margin-top:2px}
.ad-cvb .msg.u{background:var(--acc);color:var(--on-acc);border-bottom-right-radius:21px;margin-right:6px}
.ad-cvb .msg.a{background:var(--surface-3);color:var(--ink);border-bottom-left-radius:21px;margin-left:6px}
.ad-cvb .msg.u::before,.ad-cvb .msg.a::before{content:"";position:absolute;bottom:0;width:18px;height:20px}
.ad-cvb .msg.u::before{right:-7px;background:var(--acc);border-bottom-left-radius:16px 14px}
.ad-cvb .msg.a::before{left:-7px;background:var(--surface-3);border-bottom-right-radius:16px 14px}
.ad-cvb .msg.u::after,.ad-cvb .msg.a::after{content:"";position:absolute;bottom:0;width:26px;height:20px;background:var(--surface)}
.ad-cvb .msg.u::after{right:-26px;border-bottom-left-radius:10px}
.ad-cvb .msg.a::after{left:-26px;border-bottom-right-radius:10px}
.ad-cvb .msg.typing::before,.ad-cvb .msg.typing::after{display:none}
.ad-cvb .who{margin:10px 0 0 22px;font-size:13px}
.ad-cvb .dv{background:none;padding:6px 10px 10px;text-align:center;max-width:36ch;line-height:1.4}
.ad-cvb .msg.u+.msg.u,.ad-cvb .msg.a+.msg.a{margin-top:0}
.ad-cvb .msg.u+.msg.a,.ad-cvb .msg.a+.msg.u{margin-top:10px}
.ad-cvb .msg b{font-weight:700}
.ad-cvf{padding:10px 14px 14px;border-top:0;background:var(--surface)}
.ad-comp{border-radius:24px;padding:4px 4px 4px 6px;min-height:48px}
.ad-comp .btn.icon.sm{width:40px;height:40px;border-radius:50%}
.ad-comp .btn{flex:none!important;width:40px!important;min-width:40px;height:40px!important;padding:0!important}
.ad-comp .btn.pri{border-radius:50%}
.ad-qr button{font-size:14px;padding:8px 14px;border-radius:99px;background:var(--acc-bg);color:var(--acc-deep);box-shadow:none;font-weight:600;min-height:38px}
.sheet .ad-cvb{background:var(--surface)}
`);
var TH=[
 {id:'t-grp',grp:true,cat:'groupe',title:'Groupe Concours Rambouillet',sub:'9 cavaliers, Thomas et Pauline',when:'08:47',un:4,qr:['Je serai là à 6 h 30','J’ai une place pour une selle','Merci Thomas'],
  m:[['s04','Les horaires de passage sont publiés, regardez l’écran Concours. Léa, tu passes à '+hm(RB.passage)+'.','Hier 19:02'],['m008','Qui a de la place pour une selle en plus dans le camion ?','08:12'],['c01','Reconnaissance du parcours à '+hm(RB.recon)+' pour les Club Élite, je vous attends à l’entrée de piste.','08:30'],['s04','Départ du camion à 6 h 45, soyez là à 6 h 30. Chevaux nattés la veille.','08:47']],
  re:['s04','Parfait, c’est noté. À dimanche tout le monde.']},
 {id:'t-club',cat:'club',who:'s09',title:'Écurie des Tilleuls',sub:'Manon, à l’accueil',when:'08:31',un:0,qr:['Merci Manon','Je règle en ligne aujourd’hui','Pouvez-vous me rappeler ?'],
  m:[['s09','Bonjour Léa, le prélèvement de la pension de novembre a été rejeté par votre banque. Vous pouvez régler en ligne depuis Paiements, sans frais.','08:14'],['s09','L’avenant de renouvellement de la demi-pension d’Ulysse vous attend aussi dans Contrats.','08:15'],['me','Merci ! Je passe signer ce soir.','08:31']],re:['s09','Très bien, bonne journée Léa.']},
 {id:'t-coach',cat:'moniteur',who:'c01',title:'Pauline Arnaud',sub:'Coach CSO',when:'Hier',un:1,qr:['D’accord pour '+hm(RB.recon),'Je t’envoie la vidéo','On peut faire une séance vendredi ?'],
  m:[['me','Le parcours de Chantilly m’a rassurée, mais j’appréhende le triple de dimanche.','Hier 17:40'],['c01','Normal. Mercredi avec Thomas, demande une ligne à deux foulées puis une. Dimanche on marche le parcours ensemble à '+hm(RB.recon)+'.','Hier 18:05']],re:['c01','Parfait. Dors bien samedi, c’est le plus important.']},
 {id:'t-dp',cat:'cavalier',who:'m019',title:DPR.first+' '+DPR.last,sub:'Demi-pensionnaire d’Ulysse',when:'Hier',un:0,qr:['Oui pour l’échange','Merci pour la séance','Pense aux cloches'],
  m:[['m019','Séance super hier, il était très bien dans le rond. Un peu raide à gauche au début.','Hier 18:42'],['m019','Est-ce qu’on peut échanger samedi 28 contre dimanche 29 ? J’ai un stage de dressage.','Hier 18:43']],re:['m019','Merci beaucoup ! Je mets tout dans le journal.']},
 {id:'t-thomas',cat:'moniteur',who:'s04',title:'Thomas Roux',sub:'Moniteur, équipe concours',when:'Lun.',un:0,qr:['Compris','À demain'],
  m:[['s04','Demain on monte à 1,10 m sur l’enchaînement complet. Guêtres ouvertes devant, protège-boulets derrière.','Lun. 20:15'],['me','Compris, merci Thomas.','Lun. 20:31']],re:['s04','À demain 16 h.']},
 {id:'t-news',cat:'club',ro:true,title:'Annonces du club',sub:'Lecture seule',when:'Ce matin',un:0,qr:[],m:D.adhNews.map(function(n){return ['s01','<b>'+n.title+'</b><br>'+n.text,n.when]}).reverse()}];
var MS={cur:'t-grp',cat:'all',q:''};
function unread(){return TH.reduce(function(a,t){return a+t.un},0)}
function thAv(t){return t.grp?'<span class="ad-gav">'+ICON('trophy')+'</span>':t.ro?'<span class="ad-gav" style="background:var(--acc)">'+ICON('bell')+'</span>':U.av(t.who,'lg')}
function convHTML(t){return '<span class="dv">'+(t.id==='t-news'?'Cette semaine':'Conversation chiffrée, visible de vous et de vos interlocuteurs')+'</span>'+t.m.map(function(m){var me=m[0]==='me';return (t.grp&&!me?'<span class="who">'+D.name(m[0])+' · '+m[2]+'</span>':'')+'<div class="msg '+(me?'u':'a')+'" style="animation:none" title="'+m[2]+'">'+m[1]+'</div>'}).join('')}
function send(t,txt,box,after){txt=txt.trim();if(!txt){P.toast('Écrivez votre message avant d’envoyer',{icon:'chat'});return}t.m.push(['me',F.esc(txt),'09:41']);t.when='09:41';
  var d=document.createElement('div');d.className='msg u';d.textContent=txt;box.appendChild(d);box.scrollTop=1e6;if(box.closest('.sb'))box.closest('.sb').scrollTop=1e6;if(after)after();
  if(t.re&&!t.replied){t.replied=true;var ty=document.createElement('div');ty.className='msg a typing';ty.innerHTML='<i></i><i></i><i></i>';setTimeout(function(){if(!box.isConnected)return;box.appendChild(ty);box.scrollTop=1e6},500);
   setTimeout(function(){t.m.push([t.re[0],t.re[1],'09:42']);if(!box.isConnected)return;ty.remove();if(t.grp)box.insertAdjacentHTML('beforeend','<span class="who">'+D.name(t.re[0])+' · 09:42</span>');var a=document.createElement('div');a.className='msg a';a.textContent=t.re[1];box.appendChild(a);box.scrollTop=1e6;if(box.closest('.sb'))box.closest('.sb').scrollTop=1e6;if(after)after()},P.RM?80:1900)}}
function compHTML(t){return t.ro?'<div class="s mut" style="text-align:center;padding:6px">Seul le club publie ici. Répondez depuis la conversation « Écurie des Tilleuls ».</div>':'<div class="ad-qr scroll-x">'+t.qr.map(function(q){return '<button data-qr>'+q+'</button>'}).join('')+'</div><form class="ad-comp"><button type="button" class="btn ghost icon sm" data-att title="Joindre une photo ou un document">'+ICON('attach','sm')+'</button><button type="button" class="btn ghost icon sm ad-mic" data-mic title="Dicter">'+ICON('mic','sm')+'</button><input placeholder="Écrire à '+(t.grp?'tout le groupe':t.title.split(' ')[0])+'…" autocomplete="off"><button class="btn icon sm pri" title="Envoyer">'+ICON('send','sm')+'</button></form>'}
function bindComp(root,t,box,after){var f=$('form',root);if(!f)return;var inp=$('input',f);f.onsubmit=function(e){e.preventDefault();send(t,inp.value,box,after);inp.value=''};
  $$('[data-qr]',root).forEach(function(q){q.onclick=function(){send(t,q.textContent,box,after);q.remove()}});$('[data-att]',root).onclick=function(){send(t,'Photo envoyée : IMG_2026-11-17.jpg',box,after)};
  var mc=$('[data-mic]',root);if(mc)mc.onclick=function(){dictate(mc,inp,t.qr&&t.qr.length?t.qr[t.qr.length-1]+', merci beaucoup.':'Merci, à bientôt.',function(){P.toast('Dictée terminée, relisez puis envoyez',{icon:'mic'})})}}

P.mod({id:'adh-messages',role:'adherent',group:'Compte',title:'Messages',icon:'chat',n:30,
 badge:function(){var n=unread();return n?{v:n,hot:true}:null},
 render:function(el,ctx){
  if(ctx.params.id&&MS.last!==ctx.params){MS.last=ctx.params;MS.cur=ctx.params.id;MS.auto=true}
  el.innerHTML='<div class="ad-ph">'+U.ph('Messages','Le club, vos moniteurs, votre coach et le groupe concours, au même endroit.','<button class="btn pri" data-new>'+ICON('edit','sm')+'Nouveau message</button>')+'</div>'+'<div class="card ad-msg"><div class="ad-tl"><div class="hd"><div class="search">'+ICON('search','sm')+'<input class="in" placeholder="Chercher une conversation" data-q></div>'+U.seg([['all','Tout'],['club','Club'],['moniteur','Moniteurs'],['groupe','Groupes']],MS.cat,'data-mc')+'</div><div class="ad-tls" data-tls></div></div><div class="ad-cv" data-cv></div></div>';
  function list(){var ls=TH.filter(function(t){return (MS.cat==='all'||t.cat===MS.cat)&&(!MS.q||(t.title+' '+t.m.map(function(m){return m[1]}).join(' ')).toLowerCase().indexOf(MS.q)>=0)});
   var pin=(MS.cat==='all'&&!MS.q)?'<div class="ad-pin">'+['t-coach','t-grp','t-dp','t-club'].map(function(id){var t=TH.find(function(x){return x.id===id});return '<button data-th="'+id+'" title="'+t.title+'">'+thAv(t)+(t.un?'<em>'+t.un+'</em>':'')+'<span>'+(t.grp?'Concours':t.title.split(' ')[0].replace('Écurie','Le club'))+'</span></button>'}).join('')+'</div>':'';
   $('[data-tls]',el).innerHTML=pin+(ls.length?ls.map(function(t){var last=t.m[t.m.length-1];return '<button class="ad-th2" data-th="'+t.id+'" aria-current="'+(t.id===MS.cur)+'">'+(t.un?'<span class="ud"></span>':'')+thAv(t)+'<span class="grow" style="min-width:0"><span class="hrow sp" style="--g:8px"><b class="s ellip">'+t.title+'</b><span class="xs mut" style="flex:none">'+t.when+'</span></span><span class="hrow sp" style="--g:8px;margin-top:2px"><span class="s ellip '+(t.un?'b':'mut')+'">'+(last[0]==='me'?'Vous : ':t.grp?D.person(last[0]).first+' : ':'')+last[1].replace(/<[^>]+>/g,' ')+'</span>'+(t.un?'<span class="un">'+t.un+'</span>':'')+'</span></span></button>'}).join(''):U.empty('search','Aucune conversation','Essayez un autre mot.'));
   $$('[data-th]',el).forEach(function(b){b.onclick=function(){openT(b.getAttribute('data-th'),true)}})}
  function conv(){var t=TH.find(function(x){return x.id===MS.cur}),cv=$('[data-cv]',el);t.un=0;
   cv.innerHTML='<div class="ad-cvh">'+thAv(t)+'<div><div class="b" style="font-size:16px">'+t.title+'</div><div class="s mut">'+t.sub+'</div></div><span class="acts">'+(t.ro?'':'<button class="btn ghost icon" data-call title="Appeler">'+ICON('phone')+'</button>')+'<button class="btn ghost icon tog2" data-mute title="Couper les notifications de cette conversation">'+ICON('bell')+'</button></span></div><div class="ad-cvb">'+convHTML(t)+'</div><div class="ad-cvf">'+compHTML(t)+'</div>';
   var box=$('.ad-cvb',cv);box.scrollTop=1e6;bindComp(cv,t,box,list);
   var c=$('[data-call]',cv);if(c)c.onclick=function(){P.toast('Appel vers '+t.title+'…',{icon:'phone'})};
   $('[data-mute]',cv).onclick=function(e){t.mute=!t.mute;e.target.closest('button').innerHTML=ICON(t.mute?'eye_off':'bell','sm');P.toast(t.mute?'Notifications coupées pour cette conversation':'Notifications réactivées',{icon:'bell'})}}
  function openT(id,user){MS.cur=id;var t=TH.find(function(x){return x.id===id});
   if(P.isMobile()||el.getBoundingClientRect().width<=760){t.un=0;list();
    var sh=P.sheet({title:t.title,body:function(b){b.innerHTML='<div class="ad-cvb">'+convHTML(t)+'</div>';setTimeout(function(){b.scrollTop=1e6},30)},foot:compHTML(t)});
    $('.sf',sh).classList.add('ad-cvf');bindComp($('.sf',sh),t,$('.ad-cvb',sh),list)}
   else{list();conv()}}
  list();if(!(P.isMobile()))conv();
  if(MS.auto){MS.auto=false;setTimeout(function(){openT(MS.cur)},P.isMobile()?350:0)}
  $('[data-q]',el).oninput=function(e){MS.q=e.target.value.toLowerCase();list()};
  $$('[data-mc]',el).forEach(function(b){b.addEventListener('click',function(){MS.cat=b.getAttribute('data-mc');list()})});
  $('[data-new]',el).onclick=function(){var sh=P.sheet({title:'Nouveau message',icon:'edit',body:'<div class="ad-lbl">À qui voulez-vous écrire ?</div><div class="card list">'+[['t-club','s09','L’accueil du club','Manon répond en moins d’une heure en journée'],['t-thomas','s04','Thomas Roux','Moniteur, équipe concours'],['t-club','s03','Inès Garnier','Monitrice, dressage'],['t-club','s05','Antoine Leroy','Palefrenier d’Ulysse'],['t-coach','c01','Pauline Arnaud','Coach CSO'],['t-dp','m019',DPR.first+' '+DPR.last,'Demi-pensionnaire d’Ulysse'],['t-club','s01','Claire Dumont','Gérante']].map(function(x){return '<div class="li click" data-to="'+x[0]+'">'+U.av(x[1])+'<div class="grow"><div class="t">'+x[2]+'</div><div class="s">'+x[3]+'</div></div>'+ICON('right','sm')+'</div>'}).join('')+'</div>'});
   $$('[data-to]',sh).forEach(function(x){x.onclick=function(){sh.close();setTimeout(function(){openT(x.getAttribute('data-to'))},P.isMobile()?300:0)}})};
 }});

/* =====================================================================
   11. PROFIL : identité, famille, licence, notifications, personnalisation
   ===================================================================== */
P.css(`
.ad-id{padding:20px;display:flex;gap:16px;align-items:center}
/* Profil façon réglages iOS */
.ad-pfh{padding:26px 28px;margin-bottom:18px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:20px 32px;align-items:center;background:radial-gradient(120% 140% at 0% 0%,var(--rd-bg),var(--surface) 60%)}
.ad-pfm{display:flex;gap:20px;align-items:center;min-width:0}
.ad-pfa{position:relative;flex:none}
.ad-pfa .av{width:104px;height:104px;font-size:34px;box-shadow:0 0 0 5px var(--surface),0 14px 30px -14px rgba(10,22,54,.4)}
.ad-pfc{position:absolute;right:-2px;bottom:-2px;width:40px;height:40px;border-radius:50%;background:var(--navy);color:var(--navy-ink);display:grid;place-items:center;box-shadow:0 0 0 3px var(--surface);transition:transform var(--t-2) var(--e-spring)}
.ad-pfc:hover{transform:scale(1.1)}
.ad-pfn{font:800 40px/1.02 var(--f-display);letter-spacing:-.04em;margin:6px 0 6px}
.ad-pfh .sub{font-size:15px;color:var(--mut)}
.ad-fam{display:flex;flex-direction:column;gap:10px}
.ad-famr{display:flex;gap:10px;overflow-x:auto;scrollbar-width:none;padding:4px}
.ad-famr::-webkit-scrollbar{display:none}
.ad-fm{flex:none;display:flex;flex-direction:column;align-items:center;gap:4px;width:84px;padding:10px 4px;border-radius:20px;transition:background var(--t-2),transform var(--t-2) var(--e-spring)}
.ad-fm:hover{background:var(--surface-2)}.ad-fm:active{transform:scale(.94)}
.ad-fm .av{width:60px;height:60px;font-size:20px;transition:box-shadow var(--t-2)}
.ad-fm.on .av{box-shadow:0 0 0 3px var(--surface),0 0 0 5.5px var(--acc)}
.ad-fm b{font-size:14.5px;margin-top:4px}.ad-fm span:last-child{font-size:13px;color:var(--mut)}
.ad-fm.add .av{background:none;box-shadow:inset 0 0 0 2px var(--line-2);color:var(--acc);border:0}
.ad-fm.add .av svg.i{width:26px;height:26px}
@container main (max-width:900px){.ad-pfh{grid-template-columns:minmax(0,1fr)}}
@container main (max-width:620px){.ad-pfh{padding:22px 18px;text-align:center}.ad-pfm{flex-direction:column;gap:12px}.ad-pfm .hrow{justify-content:center}.ad-pfn{font-size:32px}.ad-fam{align-items:center}.ad-fam .eyebrow{align-self:center}.ad-famr{justify-content:center;max-width:100%}}
.ad-prf .card .list .li,.ad-prf .card>.li{min-height:62px;padding:10px 20px}
.ad-prf .li .av.sq{--rc:var(--acc);width:36px;height:36px;border-radius:11px;background:var(--rc)!important}
.ad-prf .li .av.sq svg.i{color:var(--on-acc);width:20px;height:20px}
.ad-prf .list .li:nth-child(6n+2) .av.sq{--rc:var(--hz)}.ad-prf .list .li:nth-child(6n+3) .av.sq{--rc:var(--mo)}.ad-prf .list .li:nth-child(6n+4) .av.sq{--rc:var(--rd)}.ad-prf .list .li:nth-child(6n+5) .av.sq{--rc:var(--tm)}.ad-prf .list .li:nth-child(6n) .av.sq{--rc:var(--cr)}
.ad-prf .li .av.sq[style*="ok-pale"]{--rc:var(--ok)!important}
.ad-prf .li.click::after{content:"";width:9px;height:9px;border-right:2px solid var(--mut-2);border-top:2px solid var(--mut-2);transform:rotate(45deg);margin-left:4px;flex:none}
.ad-prf .li.click>svg.i:last-child{display:none}
.ad-prf .card>.ch h3{font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);font-family:var(--f-text);font-weight:700}
.ad-prf .li .t{font-size:15.5px}
.ad-lic{padding:20px;overflow:hidden;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:16px;align-items:center}
.ad-lic .ln{font:800 22px/1.1 var(--f-display);letter-spacing:-.02em;color:var(--navy-ink)}
.ad-lic .kv{display:grid;grid-template-columns:repeat(3,auto);gap:4px 22px;justify-content:start;margin-top:14px}
.ad-lic .kv span{font-size:13px;letter-spacing:.06em;text-transform:uppercase;font-weight:600;color:color-mix(in srgb,var(--navy-ink) 58%,transparent)}
.ad-lic .kv b{font-size:13.5px;color:var(--navy-ink);font-variant-numeric:tabular-nums}
.ad-qrc{width:96px;height:96px;border-radius:12px;background:var(--navy-ink);padding:8px}
.ad-qrc svg{width:100%;height:100%;display:block}
.ad-qrc rect{fill:var(--navy)}
@container main (max-width:520px){.ad-lic .kv{grid-template-columns:repeat(2,auto)}.ad-qrc{width:76px;height:76px}}
.ad-nt{display:grid;grid-template-columns:minmax(0,1fr) repeat(3,56px);align-items:center;padding:10px 16px;position:relative;min-height:54px}
.ad-nt+.ad-nt::before{content:"";position:absolute;left:16px;right:16px;top:0;height:1px;background:var(--line)}
.ad-nt>span{display:grid;place-items:center}
.ad-nt.hd{min-height:0;padding:10px 16px 4px;font-size:13px;font-weight:600;letter-spacing:.05em;text-transform:uppercase;color:var(--mut)}
@container main (max-width:520px){.ad-nt{grid-template-columns:minmax(0,1fr) repeat(3,48px)}}
.ad-mod{display:flex;align-items:center;gap:12px;padding:10px 16px;position:relative;min-height:56px}
.ad-mod+.ad-mod::before{content:"";position:absolute;left:16px;right:16px;top:0;height:1px;background:var(--line)}
.ad-thm{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.ad-thm button{padding:10px;border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line-2);display:flex;flex-direction:column;gap:8px;align-items:center;font-size:13px;font-weight:600;transition:box-shadow var(--t-2)}
.ad-thm button[aria-pressed="true"]{box-shadow:inset 0 0 0 2px var(--acc)}
.ad-thm i{display:block;width:100%;height:44px;border-radius:8px;box-shadow:inset 0 0 0 1px var(--line);--tl:var(--navy-ink);--td:var(--navy)}\n:root[data-theme="dark"] .ad-thm i{--tl:var(--navy);--td:var(--navy-ink)}\n@media (prefers-color-scheme:dark){:root:not([data-theme="light"]) .ad-thm i{--tl:var(--navy);--td:var(--navy-ink)}}\n.ad-thm i.l{background:var(--tl)}.ad-thm i.d{background:var(--td)}.ad-thm i.s{background:linear-gradient(90deg,var(--tl) 50%,var(--td) 50%)}
`);
var PF={tab:'profil',last:null,fields:[['mail','Adresse e-mail',ME.email],['phone','Téléphone',ME.phone],['pin','Adresse','8 rue des Écoles, 78730 Saint-Arnoult-en-Yvelines'],['calendar_add','Date de naissance','14 mars 1999'],['heart','Personne à prévenir','Marc Martin, 06 98 76 54 32']],extra:[]};
var NOTIFS=[['Rappel de reprise','La veille à 18 h',[1,0,0]],['Cheval ou poney attribué','Dès que le moniteur a choisi',[1,0,0]],['Place libérée en liste d’attente','Vous avez 2 heures pour répondre',[1,0,1]],['Journal d’Ulysse','Nouvelles entrées et photos',[1,0,0]],['Soins et rendez-vous','Maréchal, vétérinaire, vaccins',[1,1,0]],['Alertes de la caméra','Agitation inhabituelle dans le box',[1,0,1]],['Factures et échéances','3 jours avant chaque prélèvement',[1,1,0]],['Messages','Club, moniteurs, groupes',[1,0,0]],['Annonces du club','Vie du club et installations',[0,1,0]],['Concours','Horaires, transport, résultats',[1,1,0]]];
function qr(){var s=41,g='';function r(){s=(s*16807)%2147483647;return s/2147483647}for(var y=0;y<21;y++)for(var x=0;x<21;x++){var f=(x<7&&y<7)||(x>13&&y<7)||(x<7&&y>13),on=f?((x%14===0||x%14===6||y%14===0||y%14===6||(x%14>1&&x%14<5&&y%14>1&&y%14<5))&&!(x===7||y===7)):r()>.52;if(on)g+='<rect x="'+x+'" y="'+y+'" width="1.02" height="1.02"/>'}return '<svg viewBox="0 0 21 21" aria-label="Code de la licence">'+g+'</svg>'}
P.mod({id:'adh-profil',role:'adherent',group:'Compte',title:'Profil',icon:'user',n:40,
 render:function(el,ctx){
  if(ctx.params.tab&&PF.last!==ctx.params){PF.last=ctx.params;PF.tab=ctx.params.tab}
  var pp=prof();
  el.innerHTML='<div class="card ad-pfh"><div class="ad-pfm"><span class="ad-pfa">'+U.av(pp.ref||pp,'xl')+'<button class="ad-pfc" data-photo title="Changer la photo">'+ICON('image','sm')+'</button></span><div style="min-width:0"><span class="eyebrow">Profil et réglages</span><h1 class="ad-pfn">'+pp.first+' '+pp.last+'</h1><div class="sub">'+(pp.minor?pp.role+' · Galop '+pp.galop+' · forfait 1 h par semaine':'Propriétaire d’Ulysse de la Roche · au club depuis '+pp.since)+'</div><div class="hrow wrap" style="--g:6px;margin-top:10px">'+U.chip('Galop '+pp.galop,'acc')+U.chip('Licence FFE 2027','ok',true)+(pp.minor?'':U.chip('Compétition Club','line'))+'</div></div></div>'+
   '<div class="ad-fam"><span class="eyebrow">Famille Martin</span><div class="ad-famr">'+D.adhFamily.map(function(f){return '<button class="ad-fm'+(f.id===pp.id?' on':'')+'" data-famsel="'+f.id+'" title="Voir l’espace de '+f.first+'">'+U.av(f,'lg')+'<b>'+f.first+'</b><span>'+(f.minor?f.age+' ans':'Vous')+'</span></button>'}).join('')+
   PF.extra.map(function(x){return '<button class="ad-fm" data-famx><span class="av lg" style="--c:var(--surface-3);color:var(--mut)">'+F.esc(x.charAt(0).toUpperCase())+'</span><b>'+F.esc(x)+'</b><span>À compléter</span></button>'}).join('')+
   '<button class="ad-fm add" data-famadd title="Ajouter un membre de la famille"><span class="av lg">'+ICON('plus')+'</span><b>Ajouter</b><span>un membre</span></button></div></div></div>'+U.tabs([['profil','Profil'],['famille','Famille'],['docs','Licence et santé'],['notifs','Notifications'],['perso','Personnalisation'],['conf','Confidentialité']],PF.tab,'data-ft')+'<div data-body class="ad-prf" style="margin-top:16px"></div>';
  $$('[data-ft]',el).forEach(function(b){b.addEventListener('click',function(){PF.tab=b.getAttribute('data-ft');body()})});
  $('[data-photo]',el).onclick=function(){P.toast('Photo de profil mise à jour',{icon:'image'})};
  $$('[data-famsel]',el).forEach(function(x){x.onclick=function(){var id=x.getAttribute('data-famsel');if(id===prof().id){PF.tab='famille';P.rerender();return}P.prefs.set('adh:profile',id);P.rerender();P.toast(prof().minor?'Vous voyez l’espace de '+prof().first+' en tant que parent':'Vous voyez votre espace',{icon:prof().minor?'child':'user'})}});
  function famTab(){PF.tab='famille';$$('[data-ft]',el).forEach(function(y){y.setAttribute('aria-selected',y.getAttribute('data-ft')==='famille')});body()}
  $$('[data-famx]',el).forEach(function(x){x.onclick=famTab});
  $('[data-famadd]',el).onclick=function(){famTab();var a=$('[data-addf]',el);if(a)a.click()};
  function body(){var b=$('[data-body]',el),h='',p=prof();
   if(PF.tab==='profil'){h='<div class="g3" style="--g:16px"><div class="span2 stack" style="--g:14px">'+
     '<div class="card"><div class="ch"><h3>Coordonnées</h3></div><div class="list" style="padding:6px 0">'+PF.fields.map(function(f,i){return '<div class="li click" data-fld="'+i+'">'+sq(f[0])+'<div class="grow"><div class="s">'+f[1]+'</div><div class="t ellip">'+F.esc(f[2])+'</div></div>'+ICON('edit','sm')+'</div>'}).join('')+'</div></div>'+
     '<div class="card"><div class="ch"><h3>Mes chevaux</h3><span class="chip">'+(1+myDecl().length)+'</span></div><div class="list" style="padding:6px 0"><div class="li click" data-go="adh-cheval">'+U.hav(UL)+'<div class="grow"><div class="t">'+UL.name+'</div><div class="s">Propriétaire · box '+UL.box+' · demi-pension avec '+DPR.first+'</div></div>'+U.chip('Validé','ok',true)+'</div>'+myDecl().map(function(d){return '<div class="li click" data-dec="'+d.id+'">'+U.hav(dHorse(d))+'<div class="grow"><div class="t">'+F.esc(d.name)+'</div><div class="s">'+d.link+' · '+(d.stay==='pension'?'pension demandée':'de passage')+'</div></div>'+U.chip('En attente de validation','warn',true)+'</div>'}).join('')+'</div><div class="cf"><button class="btn sm grow" data-decl>'+ICON('plus','sm')+'Déclarer un cheval</button></div></div></div>'+
     '<div class="stack" style="--g:14px">'+orgCard()+'<div class="card ad-b"><div class="ch"><h3>Mon arrivée au club</h3>'+U.chip('Terminée','ok',true)+'</div><div class="cb"><p class="s mut">Invitation, compte, famille, cheval, licence, mandat SEPA, règlement et préférences : revoyez les sept étapes.</p><button class="btn" data-go="adh-bienvenue">'+ICON('onboarding','sm')+'Revoir mon arrivée</button></div></div><div class="card"><div class="ch"><h3>Sécurité</h3></div><div class="list" style="padding:6px 0"><div class="li"><div class="grow"><div class="t">Déverrouiller avec Face ID</div><div class="s">Sur ce téléphone</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">Validation en deux étapes</div><div class="s">Code par SMS à chaque nouvel appareil</div></div>'+U.tog(false)+'</div><div class="li click" data-pw><div class="grow"><div class="t">Changer mon mot de passe</div><div class="s">Modifié il y a 4 mois</div></div>'+ICON('right','sm')+'</div></div></div>'+
      '<div class="card"><div class="ch"><h3>Appareils connectés</h3></div><div class="list" style="padding:6px 0"><div class="li">'+sq('phone')+'<div class="grow"><div class="t">iPhone de Léa</div><div class="s">Cet appareil · actif maintenant</div></div></div><div class="li">'+sq('grid')+'<div class="grow"><div class="t">MacBook, Safari</div><div class="s">Dernière connexion dimanche</div></div><button class="btn ghost sm" data-out1>Déconnecter</button></div></div></div>'+
      '<button class="btn block danger" data-logout>'+ICON('logout','sm')+'Me déconnecter</button></div></div>'}
   else if(PF.tab==='famille'){h='<div class="g3" style="--g:16px"><div class="span2 stack" style="--g:14px">'+D.adhFamily.map(function(f){var cur=f.id===p.id;return '<div class="card" style="padding:18px"><div class="hrow" style="--g:14px;align-items:flex-start">'+U.av(f,'xl')+'<div class="grow"><div class="hrow wrap" style="--g:8px"><h3 style="font-size:18px">'+f.first+' '+f.last+'</h3>'+(cur?U.chip('Profil affiché','acc',true):'')+'</div><div class="s mut">'+(f.minor?f.age+' ans · votre fils':f.age+' ans · titulaire du compte et payeuse')+'</div><div class="ad-kv" style="margin-top:12px"><div><b>Galop '+f.galop+'</b><span>Niveau</span></div><div><b style="font-size:14px;font-family:var(--f-text);letter-spacing:0">'+(f.minor?'Forfait 1 h':'Propriétaire')+'</b><span>Formule</span></div><div><b style="font-size:14px;font-family:var(--f-text);letter-spacing:0">2027</b><span>Licence FFE</span></div></div>'+
      '<div class="hrow wrap" style="--g:8px;margin-top:12px">'+(cur?'':'<button class="btn dark" data-see="'+f.id+'">'+ICON('eye','sm')+'Voir son espace</button>')+'<button class="btn" data-edf="'+f.first+'">'+ICON('edit','sm')+'Modifier</button></div></div></div></div>'}).join('')+
     PF.extra.map(function(x){return '<div class="card" style="padding:18px"><div class="hrow" style="--g:14px"><span class="av xl" style="--c:var(--bg-2);color:var(--mut)">'+F.esc(x.charAt(0).toUpperCase())+'</span><div class="grow"><h3 style="font-size:18px">'+F.esc(x)+' Martin</h3><div class="s mut">Inscription à compléter : licence et certificat médical</div></div>'+U.chip('À compléter','warn',true)+'</div></div>'}).join('')+
     '<button class="btn block" style="height:46px" data-addf>'+ICON('plus','sm')+'Ajouter un membre de la famille</button></div>'+
     '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>Qui paie ?</h3></div><div class="cb stack" style="--g:10px"><div class="ad-row">'+U.av('m001')+'<div class="grow"><div class="t">Léa Martin règle pour toute la famille</div><div class="s">Une seule facture par mois, un seul prélèvement</div></div></div><button class="btn sm" data-tiers>'+ICON('plus','sm')+'Ajouter un tiers payeur (CSE, grand-parent)</button></div></div>'+
      '<div class="card"><div class="ch"><h3>Qui peut venir chercher Jules</h3></div><div class="list" style="padding:6px 0"><div class="li">'+U.av('m001')+'<div class="grow t">Léa Martin, sa mère</div>'+U.tog(true)+'</div><div class="li"><span class="av" style="--c:var(--c3)">MM</span><div class="grow t">Marc Martin, son père</div>'+U.tog(true)+'</div><div class="li"><span class="av" style="--c:var(--c5)">FM</span><div class="grow t">Françoise Martin, sa grand-mère</div>'+U.tog(false)+'</div></div></div></div></div>'}
   else if(PF.tab==='docs'){h='<div class="g3" style="--g:16px"><div class="span2 stack" style="--g:14px"><div class="card navy ad-lic"><div><div class="eyebrow" style="color:color-mix(in srgb,var(--navy-ink) 62%,var(--acc))">Licence fédérale de pratiquant 2027</div><div class="ln" style="margin-top:6px">'+p.first+' '+p.last+'</div><div class="kv"><span>Numéro</span><span>Niveau</span><span class="hide-s">Club</span><b>'+p.lic+'</b><b>Galop '+p.galop+'</b><b class="hide-s">'+D.club.ffe.replace('Club FFE ','')+'</b></div><div class="hrow wrap" style="--g:8px;margin-top:16px"><button class="btn sm ad-nb on" data-wallet>'+ICON('wallet','sm')+'Ajouter à Cartes</button><button class="btn sm ad-nb" data-lpdf>'+ICON('download','sm')+'PDF</button></div></div><div class="ad-qrc">'+qr()+'</div></div>'+
     '<div class="card"><div class="ch"><h3>Santé et assurance de '+p.first+'</h3></div><div class="list" style="padding:6px 0">'+[['checkc','ok','Certificat médical','Sans contre-indication, valable jusqu’en septembre 2027','Remplacer'],['doc','acc','Questionnaire de santé annuel',p.minor?'Rempli par vous le 2 septembre 2026':'Rempli le 2 septembre 2026','Revoir'],['shield','ok','Assurance de la licence','Responsabilité civile et individuelle accident comprises','Attestation'],[p.minor?'child':'trophy',p.minor?'ok':'acc',p.minor?'Autorisation de soins':'Licence de compétition',p.minor?'Signée, valable toute la saison':'Club, validée par votre médecin','Voir']].map(function(x){return '<div class="li">'+sq(x[0],x[1])+'<div class="grow"><div class="t">'+x[2]+'</div><div class="s">'+x[3]+'</div></div><button class="btn ghost sm" data-doc2="'+x[2]+'">'+x[4]+'</button></div>'}).join('')+'</div></div></div>'+
     '<div class="stack" style="--g:14px"><div class="card ad-b"><div class="ch"><h3>Renouvellement</h3>'+U.chip('À jour','ok',true)+'</div><div class="cb"><p class="s mut">La licence 2027 est valable jusqu’au 31 décembre 2027. Piaffe la renouvelle avec votre accord dès septembre, sans formulaire.</p><div class="ad-row"><div class="grow"><div class="t">Renouveler automatiquement</div><div class="s">Léa et Jules, 65 € par an</div></div>'+U.tog(true)+'</div></div></div>'+
      '<div class="card ad-b"><div class="ch"><h3>Diplômes</h3></div><div class="cb"><div class="hrow wrap" style="--g:6px">'+Array.apply(null,Array(p.galop)).map(function(_,i){return U.chip('Galop '+(i+1),i===p.galop-1?'acc':'')}).join('')+'</div><button class="btn sm end" data-dip>'+ICON('download','sm')+'Télécharger mes diplômes</button></div></div></div></div>'}
   else if(PF.tab==='notifs'){var nv=P.prefs.get('adh:notifs',null)||NOTIFS.map(function(n){return n[2].slice()});
    h='<div class="g3" style="--g:16px"><div class="span2 card"><div class="ad-nt hd"><span style="place-items:start">Me prévenir pour</span><span>Push</span><span>E-mail</span><span>SMS</span></div>'+NOTIFS.map(function(n,i){return '<div class="ad-nt"><div style="min-width:0"><div class="b s">'+n[0]+'</div><div class="xs mut ellip">'+n[1]+'</div></div>'+[0,1,2].map(function(k){return '<span>'+U.tog(!!nv[i][k]).replace('class="tog"','class="tog" data-n="'+i+'-'+k+'"')+'</span>'}).join('')+'</div>'}).join('')+'</div>'+
     '<div class="stack" style="--g:14px"><div class="card ad-b"><div class="ch"><h3>Ne pas déranger</h3></div><div class="cb">'+U.seg([['n','Jamais'],['22','De 22 h à 7 h'],['20','De 20 h à 8 h']],'22')+'<p class="s mut">Les alertes de santé d’Ulysse passent toujours, même la nuit.</p></div></div>'+
      '<div class="card ad-b"><div class="ch"><h3>En un geste</h3></div><div class="cb"><button class="btn" data-ness>Garder seulement l’essentiel</button><button class="btn" data-nall>Tout réactiver</button><p class="xs mut">L’essentiel : reprises, santé d’Ulysse, factures et liste d’attente.</p></div></div></div></div>'}
   else if(PF.tab==='perso'){var off=P.prefs.off('adherent'),mods=P.modsFor('adherent',true),th=document.documentElement.getAttribute('data-theme')||'sys';
    h='<div class="g3" style="--g:16px"><div class="span2 card"><div class="ch"><div><h3>Écrans affichés dans mon espace</h3><div class="xs mut">Masquez ce qui ne vous sert pas. Un écran masqué disparaît du menu et de la barre d’onglets.</div></div></div><div style="padding:8px 0">'+mods.map(function(m){var lock=m.id==='adh-accueil'||m.id==='adh-profil';return '<div class="ad-mod">'+sq(m.icon)+'<div class="grow"><div class="b s">'+m.title+'</div><div class="xs mut">'+m.group+(lock?' · toujours affiché':'')+'</div></div>'+(lock?ICON('lock','sm'):U.tog(off.indexOf(m.id)<0).replace('class="tog"','class="tog" data-mod="'+m.id+'"'))+'</div>'}).join('')+'</div></div>'+
     '<div class="stack" style="--g:14px"><div class="card ad-b"><div class="ch"><h3>Mon accueil</h3></div><div class="cb"><p class="s mut">Choisissez les blocs de votre page d’accueil et leur ordre.</p><button class="btn" data-home>'+ICON('sliders','sm')+'Personnaliser l’accueil</button></div></div>'+
      '<div class="card ad-b"><div class="ch"><h3>Apparence</h3></div><div class="cb"><div class="ad-thm">'+[['light','Clair','l'],['dark','Sombre','d'],['sys','Système','s']].map(function(t){return '<button data-thm="'+t[0]+'" aria-pressed="'+(th===t[0])+'"><i class="'+t[2]+'"></i>'+t[1]+'</button>'}).join('')+'</div><div class="ad-row"><div class="grow"><div class="t">Texte plus grand</div><div class="s">Pour lire au soleil, au bord de la carrière</div></div>'+U.tog(false)+'</div></div></div>'+
      '<div class="card ad-b"><div class="ch"><h3>Profil affiché à l’ouverture</h3></div><div class="cb">'+opts(D.adhFamily.map(function(f){return [f.id,f.first,f.minor?'Vue parent':'Votre espace',U.av(f)]}),p.id,'defp')+'</div></div></div></div>'}
   else{var cs=P.prefs.get('adh:consent',[1,1,0,1,0]);
    h='<div class="g3" style="--g:16px"><div class="span2 card"><div class="ch"><h3>Mes consentements</h3><span class="xs mut">Modifiables à tout moment</span></div><div class="list" style="padding:6px 0">'+[['Droit à l’image','Le club peut publier des photos de vous et de Jules, sans nom de famille'],['Partager le journal d’Ulysse','Avec '+DPR.first+', votre demi-pensionnaire, et l’équipe du club'],['Apparaître dans l’annuaire des cavaliers','Les autres adhérents peuvent vous écrire'],['Partager ma progression avec mes coachs','Notes de séance, objectifs et statistiques'],['Recevoir les offres des partenaires','Selleries et assureurs partenaires du club']].map(function(c,i){return '<div class="li"><div class="grow"><div class="t">'+c[0]+'</div><div class="s">'+c[1]+'</div></div>'+U.tog(!!cs[i]).replace('class="tog"','class="tog" data-cs="'+i+'"')+'</div>'}).join('')+'</div></div>'+
     '<div class="stack" style="--g:14px"><div class="card ad-b"><div class="ch"><h3>Mes données</h3></div><div class="cb"><p class="s mut">Vos données restent hébergées en France. Vous pouvez les récupérer ou les effacer quand vous voulez.</p><button class="btn" data-exp>'+ICON('download','sm')+'Télécharger toutes mes données</button><button class="btn" data-acc>'+ICON('eye','sm')+'Voir qui a accès à mon compte</button><button class="btn danger" data-del>'+ICON('trash','sm')+'Supprimer mon compte</button></div></div></div></div>'}
   b.innerHTML=h;P.animate(b);swIn(b);var q=function(s){return $(s,b)},on=function(s,f){var x=q(s);if(x)x.onclick=f};

   if(PF.tab==='profil'){bindHsel(b,body);bindOrgCard(b,body)}
   $$('[data-fld]',b).forEach(function(x){x.onclick=function(){var f=PF.fields[+x.getAttribute('data-fld')];var sh=P.sheet({title:f[1],icon:f[0],body:'<label class="field"><span>'+f[1]+'</span><input class="in" id="ad-fv" value="'+F.esc(f[2])+'"></label><p class="xs mut" style="margin-top:10px">Le club est prévenu du changement. Vos factures et vos rappels utilisent cette information.</p>',foot:'<button class="btn pri ad-full" data-ok>Enregistrer</button>'});$('[data-ok]',sh).onclick=function(){f[2]=$('#ad-fv',sh).value;sh.close();body();P.toast(f[1]+' mise à jour')}}});
   on('[data-pw]',function(){var sh=P.sheet({title:'Changer mon mot de passe',icon:'key',body:'<div class="stack" style="--g:12px"><label class="field"><span>Mot de passe actuel</span><input class="in" type="password" value="motdepasse"></label><label class="field"><span>Nouveau mot de passe</span><input class="in" type="password" placeholder="12 caractères au minimum"></label></div>',foot:'<button class="btn pri ad-full" data-ok>Changer le mot de passe</button>'});$('[data-ok]',sh).onclick=function(){sh.close();P.toast('Mot de passe modifié, les autres appareils sont déconnectés',{icon:'key'})}});
   on('[data-out1]',function(e){e.target.closest('.li').remove();P.toast('MacBook déconnecté',{icon:'logout'})});
   on('[data-logout]',function(){var sh=P.sheet({title:'Me déconnecter',icon:'logout',body:'<p style="color:var(--ink-2)">Vous devrez saisir votre mot de passe à la prochaine ouverture. Vos réglages restent enregistrés.</p>',foot:'<button class="btn ad-full" data-no>Rester connectée</button><button class="btn danger ad-full" data-yes>Me déconnecter</button>'});$('[data-no]',sh).onclick=function(){sh.close()};$('[data-yes]',sh).onclick=function(){sh.close();P.toast('Dans la démo, vous restez connectée',{icon:'info'})}});
   $$('[data-see]',b).forEach(function(x){x.onclick=function(){P.prefs.set('adh:profile',x.getAttribute('data-see'));P.go('adh-accueil');P.toast('Vous voyez l’espace de '+prof().first,{icon:'eye'})}});
   $$('[data-edf]',b).forEach(function(x){x.onclick=function(){var n=x.getAttribute('data-edf');var sh=P.sheet({title:'Modifier '+n,icon:'edit',body:'<div class="stack" style="--g:12px"><label class="field"><span>Prénom</span><input class="in" value="'+n+'"></label><label class="field"><span>Taille (pour le choix du poney ou du cheval)</span><input class="in" value="'+(n==='Jules'?'1,34 m':'1,68 m')+'"></label><label class="field"><span>Poids</span><input class="in" value="'+(n==='Jules'?'29 kg':'58 kg')+'"></label><label class="field"><span>Allergies ou informations utiles au moniteur</span><textarea class="in" placeholder="Asthme, lunettes, appréhension…"></textarea></label></div>',foot:'<button class="btn pri ad-full" data-ok>Enregistrer</button>'});$('[data-ok]',sh).onclick=function(){sh.close();P.toast('Fiche de '+n+' mise à jour')}}});
   on('[data-addf]',function(){var sh=P.sheet({title:'Ajouter un membre',icon:'family',body:'<div class="stack" style="--g:12px"><label class="field"><span>Prénom</span><input class="in" id="ad-fn" placeholder="Prénom"></label><label class="field"><span>Date de naissance</span><input class="in" placeholder="JJ / MM / AAAA"></label><div><div class="ad-lbl" style="margin-top:0">Lien avec vous</div><div class="hrow wrap" style="--g:6px">'+['Enfant','Conjoint','Autre'].map(function(t,i){return '<button class="tag" aria-pressed="'+(i===0)+'">'+t+'</button>'}).join('')+'</div></div><div class="note">'+ICON('family','sm')+'<span>Il utilisera votre compte et vos moyens de paiement. Vous gardez la main sur ses réservations.</span></div></div>',foot:'<button class="btn pri ad-full" data-ok>Ajouter à la famille</button>'});
     $('[data-ok]',sh).onclick=function(){var v=$('#ad-fn',sh).value.trim();if(!v){$('#ad-fn',sh).focus();return}PF.extra.push(v);sh.close();body();P.toast(F.esc(v)+' ajouté à la famille Martin',{icon:'family'})}});
   on('[data-tiers]',function(){P.toast('Invitation de tiers payeur envoyée par e-mail',{icon:'mail'})});
   on('[data-wallet]',function(){P.toast('Licence ajoutée à l’application Cartes',{icon:'wallet'})});on('[data-lpdf]',function(){P.toast('Licence 2027 téléchargée',{icon:'download'})});on('[data-dip]',function(){P.toast('Diplômes téléchargés depuis la FFE',{icon:'download'})});
   $$('[data-doc2]',b).forEach(function(x){x.onclick=function(){P.toast(x.getAttribute('data-doc2')+' : document ouvert',{icon:'doc'})}});
   $$('[data-n]',b).forEach(function(x){x.addEventListener('click',function(){setTimeout(function(){var v=NOTIFS.map(function(_,i){return [0,1,2].map(function(k){return $('[data-n="'+i+'-'+k+'"]',b).getAttribute('aria-checked')==='true'?1:0})});P.prefs.set('adh:notifs',v)},0)})});
   on('[data-ness]',function(){P.prefs.set('adh:notifs',NOTIFS.map(function(n,i){return [[0,2,4,6].indexOf(i)>=0?1:0,0,0]}));body();P.toast('Seules les notifications essentielles sont actives',{icon:'bell'})});
   on('[data-nall]',function(){P.prefs.set('adh:notifs',null);body();P.toast('Notifications par défaut rétablies',{icon:'bell'})});
   $$('[data-mod]',b).forEach(function(x){x.addEventListener('click',function(){var id=x.getAttribute('data-mod'),o=P.prefs.off('adherent'),i=o.indexOf(id);if(i>=0)o.splice(i,1);else o.push(id);var st=P.$('.view',P.app()).scrollTop;P.prefs.setOff('adherent',o);P.$('.view',P.app()).scrollTop=st;P.toast(i>=0?P.mods[id].title+' réaffiché dans votre menu':P.mods[id].title+' masqué de votre menu',{icon:i>=0?'eye':'eye_off'})})});
   on('[data-home]',function(){P.go('adh-accueil');setTimeout(editHome,350)});
   $$('[data-thm]',b).forEach(function(x){x.onclick=function(){var v=x.getAttribute('data-thm');if(v==='sys')document.documentElement.removeAttribute('data-theme');else document.documentElement.setAttribute('data-theme',v);P.store.set('theme',v==='sys'?null:v);$$('[data-thm]',b).forEach(function(y){y.setAttribute('aria-pressed',y===x)});P.toast('Apparence : '+x.textContent.toLowerCase(),{icon:'palette'})}});
   if(PF.tab==='perso')bindOpts(b,function(n,v){P.prefs.set('adh:profile',v);P.toast('Piaffe s’ouvrira sur l’espace de '+prof().first)});
   $$('[data-cs]',b).forEach(function(x){x.addEventListener('click',function(){setTimeout(function(){P.prefs.set('adh:consent',$$('[data-cs]',b).map(function(y){return y.getAttribute('aria-checked')==='true'?1:0}));P.toast('Consentement enregistré')},0)})});
   on('[data-exp]',function(){P.toast('Export en préparation, vous le recevrez par e-mail dans quelques minutes',{icon:'download'})});
   on('[data-acc]',function(){P.sheet({title:'Accès à mon compte',icon:'eye',body:'<div class="card list">'+[['m001','Vous','Accès complet'],['s01','Claire Dumont, gérante','Fiche, factures, contrats'],['s04','Thomas Roux, moniteur','Planning et progression'],['c01','Pauline Arnaud, coach','Progression et notes de séance'],['m019',DPR.first+' '+DPR.last,'Journal et planning d’Ulysse seulement']].map(function(x){return '<div class="li">'+U.av(x[0])+'<div class="grow"><div class="t">'+x[1]+'</div><div class="s">'+x[2]+'</div></div></div>'}).join('')+'</div>'})});
   on('[data-del]',function(){var sh=P.sheet({title:'Supprimer mon compte',icon:'alert',body:'<p style="color:var(--ink-2);line-height:1.55">Votre compte et celui de Jules seront fermés à la fin du mois. Les factures sont conservées dix ans, comme la loi l’exige. Le contrat de pension d’Ulysse doit être résilié auprès du club.</p>',foot:'<button class="btn ad-full" data-no>Garder mon compte</button><button class="btn danger ad-full" data-yes>Demander la suppression</button>'});$('[data-no]',sh).onclick=function(){sh.close()};$('[data-yes]',sh).onclick=function(){sh.close();P.toast('Dans la démo, votre compte est conservé',{icon:'info'})}})}
  body();
 }});

/* =====================================================================
   Palette ⌘K, assistant
   ===================================================================== */
P.actions.push(
 {role:'adherent',label:'Réserver une reprise',icon:'calendar_add',run:function(){P.go('adh-reserver',{mode:'reprise'})}},
 {role:'adherent',label:'Utiliser un crédit de rattrapage',icon:'ticket',run:function(){P.go('adh-reserver',{mode:'rattrapage'})}},
 {role:'adherent',label:'Payer mon solde',icon:'card',run:function(){P.go('adh-paiements',{pay:1})}},
 {role:'adherent',label:'Voir la caméra du box d’Ulysse',icon:'camera',run:function(){P.go('adh-cheval');setTimeout(camSheet,400)}},
 {role:'adherent',label:'Demander une sortie au paddock',icon:'paddock',run:function(){P.go('adh-cheval',{tab:'presta'});setTimeout(function(){prestaSheet('paddock',P.rerender)},400)}},
 {role:'adherent',label:'Signer mes documents',icon:'sign',run:function(){P.go('adh-contrats')}},
 {role:'adherent',label:'Personnaliser mon accueil',icon:'sliders',run:function(){P.go('adh-accueil');setTimeout(editHome,400)}},
 {role:'adherent',label:'Changer de profil familial',icon:'family',run:function(){P.go('adh-profil',{tab:'famille'})}});
P.brain.push(
 {role:'adherent',re:/coach|cso|dressage|particulier/i,reply:function(t){var jeu=/jeudi/i.test(t),cso=D.coaches.filter(function(c){return c.spec==='CSO'});
   return {text:(jeu?'Aucun coach de CSO n’est libre jeudi. ':'')+'Les créneaux de CSO les plus proches, avec Ulysse disponible :',card:cso.map(function(c){var x=slotDate(c.slots[c.id==='c01'?1:0]);return '<div class="hrow sp"><span class="s"><b>'+c.first+' '+c.last+'</b> · '+x.w+' '+x.d+' à '+x.time.replace(/^0/,'').replace(':00',' h').replace(':',' h ')+'</span><b class="s num">'+F.eur(c.rate)+'</b></div>'}).join(''),
    actions:[{label:'Réserver Pauline mercredi',run:function(){P.go('adh-coachs');setTimeout(function(){coachBook(D.coach('c01'),'Mer 10:00')},400);return 'Réservation ouverte'}},{label:'Voir tous les coachs',run:function(){P.go('adh-coachs');return 'Ouvert'}}]}}},
 {role:'adherent',re:/réserv|reserv|rattrap|reprise|stage|inscri/i,reply:function(){var me=D.adhFamily[0],DN=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
   function offOf(l){return (l.dow-2+7)%7}function hh(l){return l.start.replace(':00','').replace(':',' h ').replace(/^0/,'')+(l.start.slice(3)==='00'?' h':'')}
   function mine(l){return A.res.some(function(r){return r.les===l.id&&r.who==='lea'})}
   function book(l){return function(){if(A.credits<1)return 'Plus de crédit disponible';A.credits--;A.res.push({les:l.id,off:offOf(l),who:'lea',horse:l.dow===6?null:'h01',pay:'Crédit de rattrapage'});A.extra[l.id]=(A.extra[l.id]||0)+1;P.toast('Rattrapage réservé '+DN[l.dow]+' à '+hh(l),{icon:'ticket'});if(P.state.route==='adh-reserver'||P.state.route==='adh-accueil')P.rerender();return 'Réservé '+DN[l.dow]+' à '+hh(l)}}
   function row(l,chip){return '<div class="hrow sp"><span class="s"><b>'+l.title+'</b> · '+DN[l.dow].slice(0,3)+'. '+D.day(offOf(l)).getDate()+' à '+hh(l)+'</span>'+chip+'</div><div class="xs mut">'+D.name(l.coach)+' · '+arena(l)+' · '+(l.dur||60)+' min</div>'}
   var cr='Vous avez '+A.credits+' crédit'+(A.credits>1?'s':'')+' de rattrapage.',cal={label:'Voir le calendrier',run:function(){RS.day=4;P.go('adh-reserver',{mode:'rattrapage'});return 'Calendrier ouvert'}};
   var sat=D.lessons.filter(function(l){return l.dow===6&&fits(l,me)&&!mine(l)}),open=sat.filter(function(l){return l.cap-count(l)>0})[0];
   if(open){var left=open.cap-count(open);return {text:'Samedi 21 novembre, il reste '+left+' place'+(left>1?'s':'')+' dans une reprise de votre niveau. '+cr+' Samedi est le jour d’'+DPR.first+' avec Ulysse : je vous inscris avec un cheval du club.',card:row(open,'<span class="chip ok">'+left+' place'+(left>1?'s':'')+'</span>'),actions:[{label:'Réserver avec 1 crédit',run:book(open)},cal]}}
   var full=sat[0]||lesson('l22'),alt=D.lessons.filter(function(l){var o=offOf(l);return o>=1&&o<=3&&fits(l,me)&&!mine(l)&&l.cap-count(l)>0}).sort(function(a,b){return offOf(b)-offOf(a)})[0];
   if(A.wait[full.id+'@4'])return {text:'Vous êtes déjà sur la liste d’attente de la reprise '+full.title+' de samedi à '+hh(full)+'. Je vous préviens dès qu’une place se libère. '+cr,actions:[cal]};
   var acts=[{label:'M’inscrire en liste d’attente',run:function(){A.wait[full.id+'@4']=waitN(full)+1;P.toast('Vous êtes '+(waitN(full)+1)+'e sur la liste d’attente de samedi',{icon:'waitlist'});if(P.state.route==='adh-reserver')P.rerender();return 'Inscrite en liste d’attente'}}];
   if(alt)acts.unshift({label:'Réserver '+DN[alt.dow]+' avec 1 crédit',run:book(alt)});acts.push(cal);
   return {text:'Samedi 21 novembre, la reprise '+full.title+' de '+hh(full)+' est complète ('+count(full)+' sur '+full.cap+', '+waitN(full)+' cavalier'+(waitN(full)>1?'s':'')+' en attente) et le stage de cross aussi. '+cr+(alt?' La place la plus proche à votre niveau est '+DN[alt.dow]+' à '+hh(alt)+' : '+alt.title+' avec '+D.staffer(alt.coach).first+'.':''),
    card:row(full,'<span class="chip bad">Complet</span>')+(alt?'<div style="height:8px"></div>'+row(alt,'<span class="chip ok">'+(alt.cap-count(alt))+' places</span>'):''),actions:acts}}},
 {role:'adherent',re:/ulysse|cheval|box|cam[ée]ra|paddock|va-t-il|comment va/i,reply:function(){
   return {text:'Ulysse va bien. Il a tout mangé à 7 h 10, il est sorti deux heures en Prairie du bas et il est au box, calme. '+DPR.first+' le monte à 17 h. Le maréchal passe jeudi à 9 h.',
    card:'<div class="hrow sp"><span class="s">Poids</span><b class="s num">'+UL.weight+' kg, stable</b></div><div class="hrow sp"><span class="s">Travail sur 7 jours</span><b class="s num">'+UL.work+' h sur '+UL.workMax+'</b></div><div class="hrow sp"><span class="s">Eau bue hier</span><b class="s num">28 L, normal</b></div>',
    actions:[{label:'Voir la caméra',run:function(){P.go('adh-cheval');setTimeout(camSheet,400);return 'Caméra ouverte'}},{label:'Paddock demain matin, 6 €',run:function(){A.asks.unshift({name:'Sortie au paddock',when:'demain matin',price:6,status:'Demandée',k:'acc'});P.toast('Sortie au paddock demandée pour demain, 6 € ajoutés à votre facture');return 'Demandé à Antoine'}}]}}},
 {role:'adherent',re:/pay|solde|factur|dois|éché|eche|argent|pension/i,reply:function(){var d=due(),o=D.adhInvoices.filter(function(i){return i.status!=='payée'});
   if(!d)return {text:'Votre compte est à jour. La prochaine échéance est la pension de décembre, 340 € prélevés le 1er décembre, demi-pension déduite.',actions:[{label:'Voir mes factures',run:function(){P.go('adh-paiements');return 'Ouvert'}}]};
   return {text:'Il vous reste '+F.eur(d)+' à régler. Le prélèvement de la pension de novembre a été rejeté le 15 novembre ; les 180 € de demi-pension d’'+DPR.first+' sont déjà déduits.',card:o.map(function(i){return '<div class="hrow sp"><span class="s ellip">'+i.label.split(',')[0]+'</span><b class="s num">'+F.eur(i.amount)+'</b></div>'}).join(''),
    actions:[{label:'Payer '+F.eur(d),run:function(){P.go('adh-paiements',{pay:1});return 'Paiement ouvert'}},{label:'Payer en 3 fois',run:function(){P.go('adh-paiements',{pay:1});setTimeout(function(){var x=P.$('.ad-opt[data-v="x3"]',P.app());if(x)x.click()},800);return 'Paiement en 3 fois ouvert'}}]}}},
 {role:'adherent',re:/concours|rambouillet|passage|camion|van|dimanche/i,reply:function(){return {text:'Dimanche à Rambouillet, vous passez à '+hm(RB.passage)+' en '+RB.classe.replace(' · ',' ')+', '+RB.order+', dossard '+RB.bib+'. Vous conduisez le van 2 places avec Ulysse et Nuage : départ à 7 h 15 de la cour principale. Pauline vous attend à '+hm(RB.recon)+' pour la reconnaissance, détente à '+hm(RB.warmup)+' au paddock '+RB.paddock+'.',actions:[{label:'Voir le transport',run:function(){P.go('adh-concours');return 'Ouvert'}}]}}},
 {role:'adherent',re:/sign|contrat|document/i,reply:function(){var n=toSign();return {text:n.length?n.length+' document'+(n.length>1?'s attendent':' attend')+' votre signature : '+n.map(function(c){return c.title.toLowerCase()}).join(', ')+'.':'Tous vos documents sont signés.',actions:n.length?[{label:'Signer maintenant',run:function(){P.go('adh-contrats',{id:n[0].id});return 'Document ouvert'}}]:null}}});



/* =====================================================================
   12. MANCHE 2 : déclarer un cheval, arrivée, boutique, pistes, quiz,
       balade, établissements, assistant et dictée
   ===================================================================== */
P.css(`
.ad-hsel{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;margin:0 0 14px;padding:2px}
.ad-hsel::-webkit-scrollbar{display:none}
.ad-hp{flex:none;display:inline-flex;align-items:center;gap:10px;height:48px;padding:0 14px 0 6px;border-radius:var(--r-pill);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2);font-weight:600;font-size:13.5px;transition:box-shadow var(--t-2),background var(--t-2)}
.ad-hp .av{width:36px;height:36px}
.ad-hp[aria-pressed="true"]{box-shadow:inset 0 0 0 2px var(--acc);background:var(--acc-pale)}
.ad-hp.add{padding:0 16px;color:var(--acc);box-shadow:inset 0 0 0 1.5px var(--acc-line);border-style:dashed}
.ad-hp .chip{height:22px;font-size:13px}
.ad-wzp{display:flex;align-items:center;gap:10px;margin-bottom:16px;font-size:13px;font-weight:600;color:var(--mut)}
.ad-wzp .bar{flex:1}
.ad-ifce{border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--ok-line,var(--line));background:color-mix(in srgb,var(--ok-pale) 45%,var(--surface));padding:14px;margin-top:14px;animation:rise var(--t-3) var(--e-out) both}
.ad-fg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}
.ad-fg .field span{font-size:13px}
@container main (max-width:420px){.ad-fg{grid-template-columns:minmax(0,1fr)}}
.ad-srch{display:flex;gap:8px}.ad-srch .in{flex:1;min-width:0}
/* pistes */
.ad-trk{display:grid;grid-template-columns:48px repeat(4,minmax(0,1fr));gap:3px;font-size:13px}
.ad-trk .hd{font-weight:700;font-size:13px;text-align:center;padding:6px 2px;color:var(--ink-2);position:sticky;top:0;background:var(--surface);z-index:1;line-height:1.2}
.ad-trk .hd small{display:block;font-weight:500;color:var(--mut);font-size:13px}
.ad-trk .tm{font:600 13px var(--f-text);color:var(--mut);font-variant-numeric:tabular-nums;display:flex;align-items:center;justify-content:flex-end;padding-right:6px;height:30px}
.ad-trk .tm.h{color:var(--ink-2)}
.ad-c{height:30px;border-radius:6px;background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);display:flex;align-items:center;justify-content:center;gap:4px;color:var(--mut);font-weight:600;min-width:0;overflow:hidden;white-space:nowrap;text-overflow:ellipsis;padding:0 4px;transition:background var(--t-1),box-shadow var(--t-1)}
.ad-c.free:hover{background:var(--acc-pale);box-shadow:inset 0 0 0 1.5px var(--acc);color:var(--acc)}
.ad-c.free:hover::before{content:"+";font-size:14px}
.ad-c.sh{background:color-mix(in srgb,var(--c4) 16%,var(--surface));color:var(--ink-2)}
.ad-c.les,.ad-c.cours{justify-content:flex-start}
.ad-c .ellip{min-width:0;font-size:13px}
.ad-c.les{background:var(--bg-2);box-shadow:none;color:var(--mut);cursor:not-allowed;background-image:repeating-linear-gradient(135deg,transparent 0 6px,color-mix(in srgb,var(--line-2) 60%,transparent) 6px 7px)}
.ad-c.mine{background:var(--acc);color:var(--acc-ink);box-shadow:none}
.ad-c.cours{background:var(--navy);color:var(--navy-ink);box-shadow:none}
.ad-c.full{background:color-mix(in srgb,var(--bad-pale) 70%,var(--surface));color:var(--bad);cursor:not-allowed}
.ad-c.past{opacity:.45;pointer-events:none}
.ad-c.pop2{animation:ad-pop2 .45s var(--e-spring)}
@keyframes ad-pop2{0%{transform:scale(.7)}100%{transform:scale(1)}}
/* écran verrouillé */
.ad-lock{--navy:var(--hero);--navy-ink:var(--hero-ink);border-radius:28px;padding:20px 16px 16px;background:radial-gradient(120% 90% at 30% 0%,color-mix(in srgb,var(--strass) 34%,var(--hero)),var(--hero) 72%);color:var(--hero-ink);box-shadow:var(--shadow-2);display:flex;flex-direction:column;gap:12px;margin-bottom:14px;position:relative;overflow:hidden}
.ad-lock .lt{text-align:center;font:600 14px var(--f-text);color:color-mix(in srgb,var(--navy-ink) 75%,transparent)}
.ad-lock .lc{text-align:center;font:800 64px/1 var(--f-display);letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.ad-la{border-radius:18px;background:color-mix(in srgb,var(--navy-ink) 14%,transparent);backdrop-filter:blur(10px);padding:12px 14px;display:flex;flex-direction:column;gap:10px}
.ad-la .r{display:flex;align-items:center;gap:10px}
.ad-la .lg{width:36px;height:36px;border-radius:10px;background:var(--acc);color:var(--acc-ink);display:grid;place-items:center;flex:none}
.ad-la .lg svg{width:22px;height:22px}
.ad-la b{font-size:14.5px;display:block}.ad-la small{font-size:13px;color:color-mix(in srgb,var(--navy-ink) 70%,transparent)}
.ad-la .pb{height:5px;border-radius:3px;background:color-mix(in srgb,var(--navy-ink) 18%,transparent);overflow:hidden}
.ad-la .pb i{display:block;height:100%;width:72%;background:var(--strass);border-radius:3px}
.ad-lock .ft{display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:13px;color:color-mix(in srgb,var(--navy-ink) 78%,transparent)}
/* boutique */
.ad-shop{display:grid;grid-template-columns:minmax(0,1fr) 330px;gap:18px;align-items:start}
@container main (max-width:980px){.ad-shop{grid-template-columns:minmax(0,1fr)}}
.ad-items{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
@container main (max-width:1180px){.ad-items{grid-template-columns:repeat(2,minmax(0,1fr))}}
@container main (max-width:430px){.ad-items{gap:10px}}
.ad-it{padding:14px 14px 16px;display:flex;flex-direction:column;gap:10px;min-width:0;transition:transform var(--t-2) var(--e-out),box-shadow var(--t-2)}
.ad-it:hover{transform:translateY(-3px);box-shadow:var(--shadow-2)}
.ad-it .ph2{height:116px;border-radius:18px;background:radial-gradient(120% 100% at 30% 20%,color-mix(in srgb,var(--surface) 55%,var(--d-bg,var(--acc-bg))),var(--d-bg,var(--acc-bg)));display:grid;place-items:center;color:var(--d-ink,var(--acc-deep))}
.ad-it .ph2 svg{width:44px;height:44px;transition:transform .5s var(--e-spring)}
.ad-it:hover .ph2 svg{transform:scale(1.15) rotate(-6deg)}
.ad-it .nm{font-weight:600;font-size:15px;line-height:1.3}
.ad-it .pr{font:800 22px var(--f-display);letter-spacing:-.03em;font-variant-numeric:tabular-nums}
@container main (max-width:430px){.ad-it .ph2{height:92px}.ad-it .btn{padding:0 10px}}
.ad-it .btn{margin-top:auto}
.ad-cl{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:10px;align-items:center;padding:10px 16px;position:relative}
.ad-cl+.ad-cl::before{content:"";position:absolute;left:16px;right:16px;top:0;height:1px;background:var(--line)}
.ad-qty{display:inline-flex;align-items:center;gap:2px;border-radius:var(--r-pill);box-shadow:inset 0 0 0 1px var(--line-2)}
.ad-qty .btn{width:28px;height:28px;padding:0}
.ad-qty b{min-width:18px;text-align:center;font-size:13px;font-variant-numeric:tabular-nums}
.ad-cbar{position:sticky;bottom:0;z-index:3;margin:14px -16px 0;padding:10px 16px calc(10px + env(safe-area-inset-bottom));background:color-mix(in srgb,var(--surface) 92%,transparent);backdrop-filter:blur(10px);box-shadow:0 -1px 0 var(--line);display:none;align-items:center;gap:12px}
@container main (max-width:980px){.ad-cbar.on{display:flex}}
.ad-gift{border-radius:var(--r-lg);padding:18px;background:linear-gradient(135deg,var(--navy),color-mix(in srgb,var(--acc) 45%,var(--navy)));color:var(--navy-ink);display:flex;flex-direction:column;gap:8px;min-height:150px;position:relative;overflow:hidden}
.ad-gift{--navy:var(--hero);--navy-ink:var(--hero-ink);background:linear-gradient(135deg,var(--hero),color-mix(in srgb,var(--strass) 40%,var(--hero)))!important;color:var(--hero-ink)!important}
.ad-gift .am{font:800 44px/1 var(--f-display);letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.ad-gift .strass{position:absolute;right:18px;top:18px}
/* quiz */
.ad-qz .q{font:800 19px/1.3 var(--f-display);letter-spacing:-.02em;margin:6px 0 14px}
.ad-qa{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:12px 14px;border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line-2);background:var(--surface);min-height:52px;font-weight:500;transition:box-shadow var(--t-2),background var(--t-2)}
.ad-qa+.ad-qa{margin-top:8px}
.ad-qa .l{width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--bg-2);font-weight:700;font-size:13px;flex:none}
.ad-qa.ok{box-shadow:inset 0 0 0 2px var(--ok);background:var(--ok-pale)}.ad-qa.ok .l{background:var(--ok);color:var(--acc-ink)}
.ad-qa.ko{box-shadow:inset 0 0 0 2px var(--bad);background:var(--bad-pale)}.ad-qa.ko .l{background:var(--bad);color:var(--acc-ink)}
.ad-qa[disabled]{cursor:default}
.ad-qx{margin-top:14px;animation:rise var(--t-3) var(--e-out) both}
/* balade */
.ad-map{position:relative;border-radius:var(--r-lg);overflow:hidden;background:color-mix(in srgb,var(--ok) 10%,var(--surface-2));box-shadow:inset 0 0 0 1px var(--line);aspect-ratio:16/10}
.ad-map svg{display:block;width:100%;height:100%}
.ad-map .wood{fill:color-mix(in srgb,var(--ok) 22%,var(--surface))}
.ad-map .lake{fill:color-mix(in srgb,var(--c1) 30%,var(--surface))}
.ad-map .road{fill:none;stroke:var(--line-2);stroke-width:5;stroke-linecap:round}
.ad-map .rt{fill:none;stroke:color-mix(in srgb,var(--acc) 35%,transparent);stroke-width:4;stroke-linecap:round;stroke-dasharray:2 7}
.ad-map .done{fill:none;stroke:var(--acc);stroke-width:4.5;stroke-linecap:round}
.ad-map .me{fill:var(--acc);stroke:var(--surface);stroke-width:3}
.ad-map .halo{fill:var(--acc);opacity:.25;transform-box:fill-box;transform-origin:center;animation:ad-halo 1.6s var(--e-out) infinite}
.ad-map.alert .me,.ad-map.alert .halo{fill:var(--bad)}
@keyframes ad-halo{from{transform:scale(.6);opacity:.45}to{transform:scale(2.4);opacity:0}}
.ad-map .lb{position:absolute;left:10px;top:10px;font-size:13px;font-weight:600;padding:3px 8px;border-radius:6px;background:color-mix(in srgb,var(--surface) 85%,transparent)}
.ad-rst{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:12px}
.ad-rst>div{padding:10px 12px;border-radius:var(--r-md);background:var(--surface-2);min-width:0}
.ad-rst b{display:block;font:800 18px/1.15 var(--f-display);letter-spacing:-.02em;font-variant-numeric:tabular-nums}
.ad-rst span{font-size:13px;color:var(--mut)}
@container main (max-width:520px){.ad-rst{grid-template-columns:repeat(2,minmax(0,1fr))}}
/* arrivée */
.ad-wb{display:grid;grid-template-columns:280px minmax(0,1fr);gap:18px;align-items:start}
@container main (max-width:860px){.ad-wb{grid-template-columns:minmax(0,1fr)}.ad-wbl{display:none}}
.ad-wbs{display:flex;align-items:center;gap:12px;padding:10px 14px;width:100%;text-align:left;position:relative;transition:background var(--t-1)}
.ad-wbs:hover{background:var(--surface-2)}
.ad-wbs .n{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--bg-2);font-weight:700;font-size:13px;flex:none;color:var(--mut)}
.ad-wbs.ok .n{background:var(--ok-pale);color:var(--ok)}
.ad-wbs[aria-current="true"]{background:var(--acc-pale)}.ad-wbs[aria-current="true"] .n{background:var(--acc);color:var(--acc-ink)}
.ad-wbc{padding:34px 36px;display:flex;flex-direction:column;gap:16px;min-width:0;animation:ad-wzin var(--t-4) var(--e-out) both}
@keyframes ad-wzin{from{opacity:0;transform:translateX(24px)}}
.ad-wbc h2{font-size:32px;line-height:1.1;letter-spacing:-.04em}
.ad-wbc>.av.sq:first-child{display:none}
.ad-wbc .btn.lg{align-self:flex-start;min-height:52px;height:auto;white-space:normal;line-height:1.3;padding-top:12px;padding-bottom:12px}
@container main (max-width:620px){.ad-wsd{width:40px!important}.ad-wst .ln{min-width:6px}}
/* parcours d'arrivée illustré */
.ad-wst{display:flex;align-items:flex-start;margin:0 0 18px;overflow-x:auto;scrollbar-width:none;padding:4px 2px}
.ad-wst::-webkit-scrollbar{display:none}
.ad-wsd{flex:none;display:flex;flex-direction:column;align-items:center;gap:8px;width:96px;text-align:center;border-radius:16px;padding:4px 0}
.ad-wsd .n{width:40px;height:40px;border-radius:50%;display:grid;place-items:center;background:var(--surface);box-shadow:inset 0 0 0 2px var(--line-2);font:800 16px var(--f-display);color:var(--mut);transition:all var(--t-3) var(--e-spring)}
.ad-wsd .l{font-size:13px;font-weight:600;color:var(--mut);line-height:1.25}
.ad-wsd.ok .n{background:var(--ok);color:var(--on-acc);box-shadow:none}
.ad-wsd[aria-current="true"] .n{background:var(--acc);color:var(--on-acc);box-shadow:0 0 0 5px var(--acc-bg);transform:scale(1.08)}
.ad-wsd[aria-current="true"] .l{color:var(--ink)}
.ad-wst .ln{flex:1;min-width:14px;height:3px;border-radius:2px;background:var(--line-2);margin-top:23px}
.ad-wst .ln.on{background:var(--ok)}
.ad-wz{display:grid;grid-template-columns:minmax(260px,.85fr) minmax(0,1.15fr);overflow:hidden;min-height:560px}
.ad-wzi{background:radial-gradient(120% 100% at 30% 20%,color-mix(in srgb,var(--surface) 40%,var(--d-bg)),var(--d-bg));color:var(--d-ink);display:flex;flex-direction:column;justify-content:space-between;padding:30px;gap:20px;position:relative}
.ad-wzi .illu{width:100%;max-width:300px;height:auto;aspect-ratio:1;align-self:center;margin-top:10px}
.ad-wzt{display:flex;flex-direction:column;gap:6px}
.ad-wzt .eyebrow{color:inherit;opacity:.75}
.ad-wzt b{font:800 30px/1.05 var(--f-display);letter-spacing:-.035em}
.ad-wzt .s{opacity:.8}
.ad-wzb{display:block;height:8px;border-radius:4px;background:color-mix(in srgb,var(--d) 22%,transparent);overflow:hidden;margin-top:8px}
.ad-wzb i{display:block;height:100%;border-radius:4px;background:var(--d);transition:width var(--t-4) var(--e-out)}
@container main (max-width:860px){.ad-wz{grid-template-columns:minmax(0,1fr);min-height:0}.ad-wzi{flex-direction:row;align-items:center;padding:20px}.ad-wzi .illu{width:120px;max-width:none;flex:none;order:2;margin:0}.ad-wzt b{font-size:24px}.ad-wbc{padding:22px 20px}.ad-wbc h2{font-size:26px}.ad-wsd{width:56px}.ad-wsd .l{display:none}.ad-wsd[aria-current="true"] .l{display:none}.ad-wbc .btn.lg{align-self:stretch}}
.ad-mail{border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line);overflow:hidden}
.ad-mail .mh{padding:10px 14px;background:var(--surface-2);font-size:13px;color:var(--mut);display:flex;gap:10px;align-items:center}
.ad-mail .mb{padding:14px;font-size:13.5px;line-height:1.55;color:var(--ink-2)}
.ad-mic.on{background:var(--bad)!important;color:var(--acc-ink)!important;animation:ad-mic 1s var(--e-out) infinite}
@keyframes ad-mic{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--bad) 50%,transparent)}100%{box-shadow:0 0 0 10px transparent}}
.ad-org{display:flex;flex-direction:column;gap:8px}
`);

/* ---------- Petites briques ---------- */
function wallets(amount){return [['apple','Apple Pay','Validez avec Face ID, sans saisir votre carte',sq('phone')],['gpay','Google Pay','Validez avec l’empreinte de votre téléphone',sq('wallet')]]}
function payName(v){return v==='apple'?'Apple Pay':v==='gpay'?'Google Pay':v==='sepa'?'Prélèvement SEPA':'Carte Visa •••• 4242'}
function payBtn(v,amount){return v==='apple'?ICON('phone','sm')+'Payer '+F.eur(amount)+' avec Apple Pay':v==='gpay'?ICON('wallet','sm')+'Payer '+F.eur(amount)+' avec Google Pay':null}
function myDecl(){return D.declarations?D.declarations.filter(function(x){return x.by==='m001'}):[]}
function dHorse(d){return {name:d.name,color:'var(--c3)'}}
function freeBoxes(){var used={};D.horses.forEach(function(h){used[h.box]=1});(D.declarations||[]).forEach(function(d){if(d.box)used[d.box]=1});var out=[];for(var i=1;i<=D.club.boxes;i++){var b='B'+String(i).padStart(2,'0');if(!used[b])out.push(b)}return out}
/* Assistant d’étapes dans une feuille : 3 étapes en pastilles, au-delà une barre */
function wizard(o){var st=o.state||{},i=0,N=o.steps.length;
  var sh=P.sheet({title:o.title,icon:o.icon,wide:o.wide,body:'<div data-wz></div>',foot:'<button class="btn ad-full" data-wb></button><button class="btn pri ad-full" data-wn></button>'});
  var nb=$('[data-wn]',sh),bb=$('[data-wb]',sh);
  function draw(){var s=o.steps[i],b=$('[data-wz]',sh);
   var head=N<=3?'<div class="ad-steps">'+o.steps.map(function(x,k){return '<span class="'+(k<i?'ok':k===i?'on':'')+'"><i>'+(k<i?ICON('check','sm'):k+1)+'</i>'+x.label+'</span>'+(k<N-1?'<hr>':'')}).join('')+'</div>':
     '<div class="ad-wzp"><span>Étape '+(i+1)+' sur '+N+'</span>'+U.bar((i+1)/N*100)+'<span style="color:var(--ink)">'+s.label+'</span></div>';
   b.innerHTML=head+s.html(st);P.animate(b);swIn(b);if(s.bind)s.bind(b,st,draw);
   bb.textContent=i?'Retour':'Annuler';nb.innerHTML=s.next||(i===N-1?o.done:'Continuer'+ICON('arrow','sm'));var sb=$('.sb',sh);if(sb)sb.scrollTop=0}
  bb.onclick=function(){if(i){i--;draw()}else sh.close()};
  nb.onclick=function(){var s=o.steps[i],b=$('[data-wz]',sh);if(s.read)s.read(b,st);var err=s.valid&&s.valid(st);if(err){P.toast(err,{icon:'alert'});return}
   if(i<N-1){i++;draw()}else spin(nb,function(){bb.remove();o.finish(sh,st)})};
  draw();return sh}

/* ---------- 1. Déclarer un cheval (fiche IFCE préremplie) ---------- */
var IFCE=[{sire:'20018437F',name:'Tsar des Ormes',breed:'Selle Français',coat:'Gris',born:2019,chip:'250259600184372',sex:'Hongre'},
 {sire:'22104519M',name:'Bambou du Lac',breed:'Connemara',coat:'Isabelle',born:2016,chip:'372141405119823',sex:'Hongre'},
 {sire:'19035207C',name:'Perle de Lune',breed:'Anglo-arabe',coat:'Alezan',born:2015,chip:'250259600352071',sex:'Jument'}];
function ifceFind(q){q=(q||'').trim().toLowerCase().replace(/\s/g,'');if(!q)return null;return IFCE.find(function(h){return h.sire.toLowerCase().indexOf(q)>=0||h.name.toLowerCase().replace(/\s/g,'').indexOf(q)>=0})||null}
function declareSheet(after){var free=freeBoxes();
  return wizard({title:'Déclarer un cheval',icon:'horse',state:{q:'',h:null,link:'proprio',part:50,stay:'pension',box:free[0]||'',arr:'dec'},done:ICON('send','sm')+'Envoyer la déclaration',
   steps:[
    {label:'Identité',html:function(st){return '<p class="s mut" style="margin-bottom:12px">Saisissez le numéro SIRE ou le nom du cheval. Piaffe interroge le fichier de l’IFCE et préremplit sa fiche.</p>'+
      '<label class="field"><span>Numéro SIRE ou nom du cheval</span></label><div class="ad-srch"><input class="in" id="ad-dq" value="'+F.esc(st.q)+'" placeholder="Par exemple : 20018437F" autocomplete="off"><button class="btn dark" data-ds>'+ICON('search','sm')+'Rechercher</button></div>'+
      '<div class="hrow wrap" style="--g:6px;margin-top:10px"><span class="xs mut">Essayez :</span>'+IFCE.map(function(h){return '<button class="tag" data-manual data-dsug="'+h.sire+'">'+h.name+'</button>'}).join('')+'</div><div data-dres></div>'},
     bind:function(b,st,redraw){var res=$('[data-dres]',b),inp=$('#ad-dq',b);
      function show(){if(!st.h){res.innerHTML='';return}var h=st.h;
       res.innerHTML='<div class="ad-ifce"><div class="hrow" style="--g:10px">'+sq('checkc','ok')+'<div class="grow"><div class="b s">Fiche trouvée dans le fichier IFCE</div><div class="xs mut">SIRE '+h.sire+' · vérifiez et corrigez si besoin</div></div></div><div class="ad-fg">'+
        [['name','Nom',h.name],['breed','Race',h.breed],['coat','Robe',h.coat],['born','Année de naissance',h.born],['chip','Numéro de puce',h.chip],['sex','Sexe',h.sex]].map(function(f){return '<label class="field"><span>'+f[1]+'</span><input class="in'+(f[0]==='chip'||f[0]==='born'?' num':'')+'" data-f="'+f[0]+'" value="'+F.esc(String(f[2]))+'"></label>'}).join('')+'</div></div>'}
      function go(){st.q=inp.value;var h=ifceFind(st.q);if(!h){st.h=null;res.innerHTML='<div class="note warn" style="margin-top:14px">'+ICON('alert','sm')+'<span>Aucun cheval trouvé pour « '+F.esc(st.q)+' ». Vérifiez le numéro SIRE inscrit sur le livret, ou saisissez la fiche à la main. <button class="btn sm" data-man style="margin-top:8px">Saisir la fiche à la main</button></span></div>';
        $('[data-man]',res).onclick=function(){st.h={sire:'',name:st.q,breed:'',coat:'',born:'',chip:'',sex:''};show()};return}
       st.h=Object.assign({},h);show();P.toast('Fiche de '+h.name+' préremplie depuis l’IFCE',{icon:'checkc'})}
      $('[data-ds]',b).onclick=go;inp.onkeydown=function(e){if(e.key==='Enter'){e.preventDefault();go()}};
      $$('[data-dsug]',b).forEach(function(t){t.onclick=function(){inp.value=t.getAttribute('data-dsug');go()}});show()},
     read:function(b,st){if(st.h)$$('[data-f]',b).forEach(function(x){st.h[x.getAttribute('data-f')]=x.value.trim()})},
     valid:function(st){return !st.h?'Recherchez d’abord le cheval dans le fichier IFCE':!st.h.name?'Indiquez au moins le nom du cheval':null}},
    {label:'Lien',html:function(st){return '<div class="card soft" style="padding:12px 14px;margin-bottom:14px"><div class="hrow" style="--g:12px">'+U.hav(dHorse(st.h))+'<div class="grow"><div class="b">'+F.esc(st.h.name)+'</div><div class="xs mut">'+[st.h.breed,st.h.coat,st.h.born].filter(Boolean).join(' · ')+'</div></div></div></div>'+
      '<div class="ad-lbl">Quel est votre lien avec ce cheval ?</div>'+opts([['proprio','Propriétaire','Vous figurez comme propriétaire sur le livret SIRE',sq('owner')],['copro','Copropriétaire','Indiquez votre part, l’autre copropriétaire est invité',sq('members')],['dp','Demi-pensionnaire','Le propriétaire confirme depuis son compte',sq('swap')],['club','Cavalière habituelle d’un cheval du club','Il reste au club, vous le suivez dans votre espace',sq('stable')]],st.link,'link')+
      '<div data-copro style="margin-top:12px'+(st.link==='copro'?'':';display:none')+'"><div class="ad-fg"><label class="field"><span>Votre part (en %)</span><input class="in num" id="ad-dpart" value="'+st.part+'"></label><label class="field"><span>Autre copropriétaire (e-mail)</span><input class="in" id="ad-dmail" placeholder="prenom@exemple.fr"></label></div></div>'},
     bind:function(b,st){bindOpts(b,function(n,v){st.link=v;$('[data-copro]',b).style.display=v==='copro'?'':'none'})},
     read:function(b,st){st.link=optVal(b,'link');var p=$('#ad-dpart',b);if(p)st.part=parseInt(p.value,10)||50},
     valid:function(st){return st.link==='copro'&&(st.part<1||st.part>99)?'Votre part doit être comprise entre 1 et 99 %':null}},
    {label:'Hébergement',html:function(st){return '<div class="ad-lbl" style="margin-top:0">Où vit-il ?</div>'+opts([['pension','En pension aux Tilleuls','Demande de box, pension complète à 520 € par mois',sq('stable')],['passage','Hébergé ailleurs, de passage','Pour les cours, les concours et les installations',sq('van')]],st.stay,'stay')+
      '<div data-pens style="'+(st.stay==='pension'?'':'display:none')+'"><div class="ad-lbl">Box souhaité</div><div class="hrow wrap" style="--g:6px">'+(free.length?free.map(function(x){return '<button class="tag" data-manual data-box="'+x+'" aria-pressed="'+(x===st.box)+'">Box '+x+'</button>'}).join(''):'<span class="s mut">Aucun box libre, Claire vous propose la liste d’attente.</span>')+'</div>'+
      '<div class="ad-lbl">Arrivée souhaitée</div>'+U.seg([['week','Cette semaine'],['dec','Début décembre'],['jan','En janvier']],st.arr,'data-arr')+'</div>'+
      '<div data-pass style="'+(st.stay==='passage'?'':'display:none')+'"><label class="field" style="margin-top:14px"><span>Écurie où il est hébergé</span><input class="in" id="ad-dfrom" placeholder="Par exemple : Haras de la Vallée"></label></div>'+
      '<div class="note" style="margin-top:16px">'+ICON('info','sm')+'<span>Claire Dumont, la gérante, relit la déclaration et crée la fiche du cheval. Vous êtes prévenue dès qu’elle est validée.</span></div>'},
     bind:function(b,st){bindOpts(b,function(n,v){st.stay=v;$('[data-pens]',b).style.display=v==='pension'?'':'none';$('[data-pass]',b).style.display=v==='passage'?'':'none'});
      $$('[data-box]',b).forEach(function(t){t.onclick=function(){st.box=t.getAttribute('data-box');$$('[data-box]',b).forEach(function(y){y.setAttribute('aria-pressed',y===t)})}});
      $$('[data-arr]',b).forEach(function(t){t.addEventListener('click',function(){st.arr=t.getAttribute('data-arr')})})},
     read:function(b,st){st.stay=optVal(b,'stay');var f=$('#ad-dfrom',b);if(f)st.from=f.value.trim()}}],
   finish:function(sh,st){var L={proprio:'Propriétaire',copro:'Copropriétaire ('+st.part+' %)',dp:'Demi-pensionnaire',club:'Cavalière habituelle'}[st.link];
    var d={id:'dc'+((D.declarations||[]).length+1)+'-'+Date.now()%1000,by:'m001',link:L,name:st.h.name,sire:st.h.sire,breed:st.h.breed,coat:st.h.coat,born:+st.h.born||st.h.born,chip:st.h.chip,stay:st.stay,box:st.stay==='pension'?st.box||null:null,when:'Aujourd’hui, 09:41',status:'en attente'};
    (D.declarations=D.declarations||[]).push(d);
    success(sh,{title:'Déclaration envoyée',text:'Claire Dumont relit la fiche de '+F.esc(d.name)+'. En attendant, il apparaît dans votre espace avec la mention « En attente de validation ».',
     head:U.hav(dHorse(d),'lg')+'<div class="grow"><div class="b" style="font-size:15.5px">'+F.esc(d.name)+'</div><div class="s mut">'+(d.sire?'SIRE '+d.sire:'Fiche saisie à la main')+'</div></div>'+U.chip('En attente','warn',true),
     rows:[['Lien',L],['Hébergement',d.stay==='pension'?'Pension, box '+(d.box||'à attribuer'):'De passage'],['Race',d.breed||'À compléter'],['Envoyée à','Claire Dumont']]});
    P.toast('Déclaration envoyée à Claire',{icon:'send'});P.renderBadges&&P.renderBadges();if(after)after(d)}})}
function declSheet(d,after){var sh=P.sheet({title:d.name,icon:'horse',body:'<div class="hrow" style="--g:14px;margin-bottom:14px">'+U.hav(dHorse(d),'xl')+'<div class="grow"><div class="hrow wrap" style="--g:6px">'+U.chip('En attente de validation','warn',true)+'</div><div class="s mut" style="margin-top:6px">Envoyée '+d.when.toLowerCase().replace(', ',' à ').replace(/0?(\d+):(\d+)/,'$1 h $2')+' à Claire Dumont</div></div></div>'+
   '<div class="card soft" style="padding:6px 16px">'+[['SIRE',d.sire||'À compléter'],['Race',d.breed||'À compléter'],['Robe',d.coat||'À compléter'],['Né en',d.born||'À compléter'],['Puce',d.chip||'À compléter'],['Lien',d.link],['Hébergement',d.stay==='pension'?'Pension aux Tilleuls, box '+(d.box||'à attribuer'):'Hébergé ailleurs, de passage']].map(function(r){return '<div class="ad-sum"><span class="mut">'+r[0]+'</span><b class="num" style="text-align:right">'+F.esc(String(r[1]))+'</b></div>'}).join('')+'</div>'+
   '<div class="note" style="margin-top:14px">'+ICON('hourglass','sm')+'<span>La gérante valide en général sous 24 heures. Sa fiche, son carnet de santé et sa caméra de box s’ouvrent ensuite ici.</span></div>',
  foot:'<button class="btn ad-full" data-rm>'+ICON('trash','sm')+'Retirer</button><button class="btn pri ad-full" data-rel>'+ICON('bell','sm')+'Relancer Claire</button>'});
  $('[data-rel]',sh).onclick=function(){sh.close();P.toast('Claire est relancée pour '+d.name,{icon:'bell'})};
  $('[data-rm]',sh).onclick=function(){var i=D.declarations.indexOf(d);D.declarations.splice(i,1);sh.close();if(after)after();P.toast('Déclaration de '+d.name+' retirée',{icon:'trash',undo:function(){D.declarations.splice(i,0,d);if(after)after()}})}}
function hselHTML(){return '<div class="ad-hsel scroll-x"><button class="ad-hp" aria-pressed="true" title="Ulysse de la Roche">'+U.hav(UL)+'<span>Ulysse</span></button>'+
  myDecl().map(function(d){return '<button class="ad-hp" data-dec="'+d.id+'" aria-pressed="false" title="'+F.esc(d.name)+'">'+U.hav(dHorse(d))+'<span>'+F.esc(d.name)+'</span>'+U.chip('En attente de validation','warn',true)+'</button>'}).join('')+
  '<button class="ad-hp add" data-decl>'+ICON('plus','sm')+'Déclarer un cheval</button></div>'}
function bindHsel(root,after){var a=$('[data-decl]',root);if(a)a.onclick=function(){declareSheet(after)};
  $$('[data-dec]',root).forEach(function(x){x.onclick=function(){declSheet(D.declarations.find(function(d){return d.id===x.getAttribute('data-dec')}),after)}})}

/* ---------- 27. Partir en balade, alerte d’immobilité ---------- */
var RIDES=[['etangs','Boucle des étangs de Hollande','7,5 km · environ 1 h · chemins sablés',60,7.5],['foret','Forêt de Rambouillet, route du Coin du Bois','12 km · environ 1 h 30 · un gué',90,12],['court','Tour du domaine','3 km · 30 minutes · idéal en récupération',30,3]];
function rideSheet(){var R=RIDES[0],run=null;
  var sh=P.sheet({title:'Partir en balade',icon:'route',wide:true,body:'<div data-rb></div>',foot:'<div data-rf style="display:flex;gap:10px;flex:1"></div>',onClose:function(){if(run)clearInterval(run)}});
  var rb=$('[data-rb]',sh),rf=$('[data-rf]',sh);
  function setup(){rb.innerHTML='<p class="s mut" style="margin-bottom:4px">Piaffe suit votre position pendant la balade. Si vous restez immobile plus de 5 minutes hors d’une pause, une alerte part vers vos proches et l’accueil du club, avec votre position.</p>'+
    '<div class="ad-lbl">Itinéraire</div>'+opts(RIDES.map(function(r){return [r[0],r[1],r[2],sq('route')]}),R[0],'ride')+
    '<div class="ad-lbl">Prévenir en cas d’alerte</div><div class="card list"><div class="li"><span class="av" style="--c:var(--c3)">MM</span><div class="grow"><div class="t">Marc Martin</div><div class="s">Personne à prévenir · SMS et appel</div></div>'+U.tog(true)+'</div><div class="li">'+U.av('s09')+'<div class="grow"><div class="t">Accueil du club</div><div class="s">Manon, '+D.club.phone+'</div></div>'+U.tog(true)+'</div><div class="li">'+U.av(DP.rider)+'<div class="grow"><div class="t">'+DPR.first+' '+DPR.last+'</div><div class="s">Votre demi-pensionnaire</div></div>'+U.tog(false)+'</div></div>'+
    '<div class="ad-lbl">Avec qui partez-vous ?</div>'+U.seg([['seule','Seule'],['deux','À deux'],['groupe','En groupe']],'deux')+
    '<div class="note" style="margin-top:14px">'+ICON('info','sm')+'<span>Le club conseille de ne jamais partir seule en forêt. Casque et gilet fluorescent obligatoires sur les routes.</span></div>';
   bindOpts(rb,function(n,v){R=RIDES.find(function(r){return r[0]===v})});
   rf.innerHTML='<button class="btn pri lg ad-full" data-go2>'+ICON('play','sm')+'Démarrer la balade</button>';$('[data-go2]',rf).onclick=live}
  function live(){var t=0,dist=0,still=0,stop=false,alerted=false,warned=false,pts=[];
   rb.innerHTML='<div class="ad-map" data-map><svg viewBox="0 0 320 200" aria-label="Carte de la balade"><path class="wood" d="M0 0h140c-10 40 20 60 0 90S60 140 0 130z"/><path class="wood" d="M220 0h100v120c-40 10-60-20-90-10s-30-60-10-110z"/><ellipse class="lake" cx="240" cy="160" rx="48" ry="22"/><path class="road" d="M0 175 C90 165 140 190 320 178"/>'+
     '<path class="rt" id="ad-rt" d="M40 168 C40 120 70 100 110 92 S170 40 210 52 S280 100 250 130 S170 150 150 128 S90 150 40 168"/><path class="done" id="ad-rd" d=""/><circle class="halo" r="8" cx="40" cy="168"/><circle class="me" r="7" cx="40" cy="168"/></svg><span class="lb">'+R[1]+'</span></div>'+
     '<div class="ad-rst"><div><b data-rt>0 min</b><span>Durée</span></div><div><b data-rk>0,0 km</b><span>Distance</span></div><div><b data-ra>Pas</b><span>Allure</span></div><div><b data-rs>0 min</b><span>Immobile depuis</span></div></div><div data-ral style="margin-top:12px"></div>';
   var path=$('#ad-rt',rb),done=$('#ad-rd',rb),me=$('.me',rb),halo=$('.halo',rb),L=path.getTotalLength(),map=$('[data-map]',rb),total=R[3]*60;
   rf.innerHTML='<button class="btn ad-full" data-still>'+ICON('pause','sm')+'Simuler une chute</button><button class="btn pri ad-full" data-end>'+ICON('check','sm')+'Terminer la balade</button>';
   function alerts(){var al=$('[data-ral]',rb);
    if(alerted)al.innerHTML='<div class="note bad">'+ICON('alert','sm')+'<span><b>Alerte envoyée</b> à Marc Martin et à l’accueil du club, avec votre position GPS. Manon vous appelle. <button class="btn sm" data-ok2 style="margin-top:8px">Je vais bien, lever l’alerte</button></span></div>';
    else if(still>=120)al.innerHTML='<div class="note warn">'+ICON('hourglass','sm')+'<span>Pas de mouvement depuis '+Math.floor(still/60)+' min. L’alerte part dans '+Math.max(0,Math.ceil((300-still)/60))+' min si vous ne répondez pas. <button class="btn sm" data-ok2 style="margin-top:8px">Je vais bien</button></span></div>';
    else al.innerHTML='';
    var o=$('[data-ok2]',al);if(o)o.onclick=function(){var was=alerted;stop=false;still=0;alerted=false;warned=false;map.classList.remove('alert');$('[data-still]',rf).disabled=false;alerts();P.toast(was?'Alerte levée, vos proches sont rassurés':'Merci, le suivi continue',{icon:'checkc'})}}
   function tick(){if(!sh.isConnected){clearInterval(run);return}
    t+=20;if(stop){still+=30}else{var k=Math.min(1,t/total),al=k<.15||k>.85?'Pas':k<.35||(k>.6&&k<.7)?'Trot':k<.55?'Galop':'Trot',v={Pas:6,Trot:13,Galop:22}[al];dist+=v*20/3600;
     var p=path.getPointAtLength(k*L);pts.push(p.x.toFixed(1)+' '+p.y.toFixed(1));done.setAttribute('d','M'+pts.join(' L'));me.setAttribute('cx',p.x);me.setAttribute('cy',p.y);halo.setAttribute('cx',p.x);halo.setAttribute('cy',p.y);$('[data-ra]',rb).textContent=al}
    $('[data-rt]',rb).textContent=dur(Math.round(t/60));$('[data-rk]',rb).textContent=String(dist.toFixed(1)).replace('.',',')+' km';$('[data-rs]',rb).textContent=!stop?'0 min':still<60?still+' s':Math.floor(still/60)+' min'+(still%60?' '+still%60+' s':'');
    if(stop&&still>=120&&!warned){warned=true;alerts()}
    if(stop&&still>=300&&!alerted){alerted=true;map.classList.add('alert');alerts();P.toast('Alerte d’immobilité envoyée à Marc et au club',{icon:'alert'})}
    if(t>=total&&!stop)finish()}
   $('[data-still]',rf).onclick=function(){stop=true;still=0;this.disabled=true;$('[data-ra]',rb).textContent='Arrêt';P.toast('Arrêt simulé : 1 seconde vaut 30 secondes',{icon:'pause'})};
   $('[data-end]',rf).onclick=finish;
   run=setInterval(tick,P.RM?250:1000);tick()
   function finish(){clearInterval(run);run=null;var km=String(dist.toFixed(1)).replace('.',','),mn=Math.max(1,Math.round(t/60));
    A.journal.unshift({horse:'h01',who:'m001',role:'Propriétaire',when:'À l’instant',text:'Balade '+R[1].toLowerCase().replace('boucle','sur la boucle')+' : '+km+' km en '+dur(mn)+', Ulysse calme et en avant.',kind:'balade',mood:5});
    success(sh,{title:'Bonne balade, Léa',text:'Le suivi est arrêté et vos proches ne recevront plus d’alerte. La sortie est ajoutée au journal d’Ulysse.',head:sq('route')+'<div class="grow"><div class="b" style="font-size:15.5px">'+R[1]+'</div><div class="s mut">Aujourd’hui</div></div>',
     rows:[['Durée',dur(mn)],['Distance',km+' km'],['Allures','Pas, trot et galop'],['Alertes',alerted?'1 alerte levée':'Aucune']]});if(P.state.route==='adh-cheval')P.rerender()}}
  setup();return sh}

/* ---------- 21. Réviser la théorie : 10 questions ---------- */
var QUIZ={lea:{t:'Degré 1',q:[
 ['En CSO, combien de temps avez-vous pour franchir la ligne de départ après la cloche ?',['30 secondes','45 secondes','60 secondes'],1,'Le cavalier dispose de 45 secondes après la cloche, en CSO Club comme en Amateur.'],
 ['Combien de points coûte une barre tombée au barème A ?',['2 points','3 points','4 points'],2,'Chaque barre tombée ou refus coûte 4 points au barème A.'],
 ['Que coûte le dépassement du temps accordé ?',['1 point par seconde commencée','4 points par seconde','Élimination'],0,'Chaque seconde commencée au-delà du temps accordé coûte 1 point.'],
 ['Quelle est la fréquence cardiaque d’un cheval adulte au repos ?',['28 à 40 battements par minute','60 à 80 battements par minute','90 à 110 battements par minute'],0,'Au repos, le cœur d’un cheval adulte bat entre 28 et 40 fois par minute.'],
 ['Quelle est la température normale d’un cheval ?',['36 à 37 °C','37,5 à 38,5 °C','39 à 40 °C'],1,'Au-delà de 38,5 °C, on parle de fièvre : prévenez le vétérinaire.'],
 ['Combien de mouvements respiratoires par minute au repos ?',['8 à 16','20 à 30','35 à 45'],0,'Une respiration plus rapide au repos peut signaler une douleur ou une fièvre.'],
 ['Quel vaccin est obligatoire pour courir en compétition FFE ?',['Rage','Grippe équine','Tétanos'],1,'La grippe équine est obligatoire ; le tétanos et la rhinopneumonie sont vivement conseillés.'],
 ['Sur combien de pistes se déplace un cheval à l’épaule en dedans ?',['Deux pistes','Trois pistes','Quatre pistes'],1,'Les épaules entrent d’environ 30 degrés : le cheval marche sur trois pistes.'],
 ['Combien de temps dure la gestation d’une jument ?',['Environ 9 mois','Environ 11 mois','Environ 14 mois'],1,'Elle dure en moyenne 335 à 345 jours.'],
 ['Où se trouvent les châtaignes ?',['Sur la face interne des membres','Derrière le boulet','Sur le chanfrein'],0,'Ce sont des plaques cornées sur la face interne des avant-bras et des jarrets.']]},
 jules:{t:'Galop 3',q:[
 ['Le pas est une allure à combien de temps ?',['2 temps','3 temps','4 temps'],2,'Au pas, on entend les quatre pieds se poser l’un après l’autre.'],
 ['Le trot est une allure à combien de temps ?',['2 temps','3 temps','4 temps'],0,'Au trot, les membres bougent par paires en diagonale.'],
 ['Le galop est une allure à combien de temps ?',['2 temps','3 temps','4 temps'],1,'Le galop a trois temps, suivis d’un temps de suspension.'],
 ['Un cheval au corps brun et aux crins noirs est :',['Alezan','Bai','Gris'],1,'Le bai a le corps brun et les crins et le bas des membres noirs.'],
 ['Comment s’appelle la tache blanche sur le front ?',['Une étoile','Une balzane','Un ladre'],0,'L’étoile est sur le front ; la balzane est une marque blanche en bas d’un membre.'],
 ['De quel côté monte-t-on à cheval ?',['À droite','À gauche','Des deux côtés'],1,'On se met en selle par la gauche, comme on le mène en main.'],
 ['Dans quel sens cure-t-on un pied ?',['Du talon vers la pince','De la pince vers le talon','En tournant'],0,'On cure du talon vers la pince, sans appuyer dans la fourchette.'],
 ['Quelle distance garder derrière un autre cheval en reprise ?',['Un mètre','Une longueur de cheval','Aucune'],1,'Au moins une longueur de cheval, pour éviter les coups de pied.'],
 ['Où se place-t-on pour mener son poney en main ?',['Devant sa tête','À sa gauche, à hauteur de l’épaule','Derrière lui'],1,'À gauche, à hauteur de l’épaule, les rênes passées au-dessus de l’encolure.'],
 ['Comment s’appelle la pièce du filet qui va dans la bouche ?',['Le mors','La muserolle','La têtière'],0,'Le mors repose sur les barres, l’espace sans dents de la bouche.']]}};
function quizSheet(after){var p=prof(),Q=QUIZ[p.id]||QUIZ.lea,i=0,score=0;
  var sh=P.sheet({title:'Réviser la théorie',icon:'bulb',body:'<div class="ad-qz" data-qz></div>',foot:'<button class="btn pri lg ad-full" data-qn disabled>Question suivante'+ICON('arrow','sm')+'</button>'});
  var box=$('[data-qz]',sh),nb=$('[data-qn]',sh);
  function draw(){var q=Q.q[i];box.innerHTML='<div class="ad-wzp"><span>Question '+(i+1)+' sur '+Q.q.length+'</span>'+U.bar(i/Q.q.length*100)+'<span class="num" style="color:var(--ink)">'+score+' bonne'+(score>1?'s':'')+'</span></div><div class="eyebrow">Théorie du '+Q.t+'</div><div class="q">'+q[0]+'</div>'+
    q[1].map(function(a,k){return '<button class="ad-qa" data-a="'+k+'"><span class="l">'+'ABC'.charAt(k)+'</span><span class="grow">'+a+'</span></button>'}).join('')+'<div data-x></div>';
   nb.disabled=true;nb.innerHTML=(i===Q.q.length-1?'Voir mon score':'Question suivante')+ICON('arrow','sm');
   $$('[data-a]',box).forEach(function(b){b.onclick=function(){var k=+b.getAttribute('data-a'),good=k===q[2];if(good)score++;
     $$('[data-a]',box).forEach(function(x){x.disabled=true;var kk=+x.getAttribute('data-a');if(kk===q[2])x.classList.add('ok');else if(x===b)x.classList.add('ko')});
     $('[data-x]',box).innerHTML='<div class="note '+(good?'ok':'warn')+' ad-qx">'+ICON(good?'checkc':'info','sm')+'<span><b>'+(good?'Bonne réponse.':'Pas tout à fait.')+'</b> '+q[3]+'</span></div>';nb.disabled=false;
     $('.ad-wzp .num',box).textContent='Score : '+score}})}
  nb.onclick=function(){if(i<Q.q.length-1){i++;draw();$('.sb',sh).scrollTop=0;return}
   var best=Math.max(A.quiz[p.id]||0,score),pct=score*10;A.quiz[p.id]=best;
   if(score===Q.q.length)success(sh,{title:'Sans-faute, '+p.first+' !',text:'10 bonnes réponses sur 10. Vos moniteurs voient que la théorie du '+Q.t+' est prête.',more:['Recommencer',function(){quizSheet(after)}]});
   else{$('.sb',sh).innerHTML='<div class="ad-ok"><div style="margin-bottom:6px">'+U.ring(pct,score+' / 10','var(--acc)',110)+'</div><h3>'+(score>=7?'Très bien, '+p.first:'Encore un effort')+'</h3><p>'+score+' bonnes réponses sur 10. '+(score>=7?'Refaites le quiz pour viser le sans-faute.':'Relisez les explications et retentez votre chance.')+'</p></div>';
    var f=$('.sf',sh);f.innerHTML='<button class="btn ad-full" data-re>'+ICON('refresh','sm')+'Recommencer</button><button class="btn pri ad-full" data-done>Terminé</button>';$('[data-re]',f).onclick=function(){quizSheet(after)};$('[data-done]',f).onclick=function(){sh.close()}}
   P.toast('Score enregistré : '+score+' sur 10',{icon:score===Q.q.length?'trophy':'bulb'});if(after)after()};
  draw();return sh}

/* ---------- 14. Boutique ---------- */
var BQ={tab:'cartes',cart:[],seq:518};
var SHOP0=[{id:'p01',name:'Séance à l’unité',cat:'Séances',price:32,vat:5.5,stock:null,icon:'ticket'},{id:'p02',name:'Carte 10 séances',cat:'Séances',price:290,vat:5.5,stock:null,icon:'ticket'},{id:'p04',name:'Balade d’une heure',cat:'Séances',price:35,vat:5.5,stock:null,icon:'route'},{id:'p05',name:'Polo du club',cat:'Sellerie',price:29,vat:20,stock:14,min:6,icon:'bag'},{id:'p07',name:'Tapis de selle brodé',cat:'Sellerie',price:39,vat:20,stock:8,min:4,icon:'saddle'},{id:'p08',name:'Casque réglable enfant',cat:'Sellerie',price:59,vat:20,stock:5,min:3,icon:'helmet'},{id:'p09',name:'Gants d’équitation',cat:'Sellerie',price:14,vat:20,stock:2,min:6,icon:'bag'},{id:'p11',name:'Friandises pomme, 1 kg',cat:'Sellerie',price:6,vat:20,stock:31,min:10,icon:'feed'},{id:'p16',name:'Carte cadeau 50 €',cat:'Séances',price:50,vat:0,stock:null,icon:'gift'}];
function shopItems(){return D.shopItems&&D.shopItems.length?D.shopItems:SHOP0}
function itemOf(id){return shopItems().find(function(x){return x.id===id})}
function forfaits(){return (D.forfaits||[]).filter(function(f){return /annuel|trimestre/.test(f.kind)}).map(function(f){var pro=f.kind==='annuel'?Math.round(f.price*7/12):f.price;return {id:'F'+f.id,name:f.name,cat:'Forfaits',price:pro,full:f.price,vat:5.5,icon:f.kind==='trimestre'?'child':'repeat',note:f.kind==='annuel'?'De décembre à juin, au prorata : 7 mois sur 12':'Trimestre de janvier à mars'}})}
function cartN(){return BQ.cart.reduce(function(a,l){return a+l.q},0)}
function cartT(){return BQ.cart.reduce(function(a,l){return a+l.price*l.q},0)}
function addCart(it,meta){var ex=!meta&&BQ.cart.find(function(l){return l.id===it.id});if(ex)ex.q++;else BQ.cart.push({id:it.id+(meta?'-'+Date.now()%10000:''),name:it.name,price:it.price,q:1,icon:it.icon,meta:meta||null,digital:/Séances|Forfaits/.test(it.cat)||it.gift,gift:it.gift});P.renderBadges&&P.renderBadges()}
function giftSheet(after){var amt=50;
  var sh=P.sheet({title:'Offrir une carte cadeau',icon:'gift',body:function(b){b.innerHTML='<div class="ad-gift"><span class="strass"></span><span class="eyebrow" style="color:color-mix(in srgb,var(--navy-ink) 70%,var(--acc))">Carte cadeau · '+D.club.name+'</span><span class="am" data-gam>'+F.eur(amt)+'</span><span class="s" data-gto style="color:color-mix(in srgb,var(--navy-ink) 80%,transparent)">Pour la personne de votre choix</span></div>'+
    '<div class="ad-lbl">Montant</div>'+U.seg([['30','30 €'],['50','50 €'],['100','100 €'],['150','150 €']],'50','data-gm')+
    '<div class="ad-fg"><label class="field"><span>Pour</span><input class="in" id="ad-gto" placeholder="Prénom et nom"></label><label class="field"><span>Son e-mail</span><input class="in" id="ad-gmail" placeholder="prenom@exemple.fr"></label></div>'+
    '<label class="field" style="margin-top:10px"><span>Votre message</span><textarea class="in" id="ad-gmsg" placeholder="Joyeux anniversaire, à bientôt au club !"></textarea></label>'+
    '<div class="ad-lbl">Remise</div>'+opts([['mail','Par e-mail, le jour choisi','La carte arrive avec votre message et un code à présenter',sq('mail')],['print','Imprimée, à retirer à l’accueil','Dans une enveloppe au nom du destinataire',sq('gift')]],'mail','gdel')+
    '<p class="xs mut" style="margin-top:12px">Valable un an sur les séances, les stages et la boutique du club.</p>'},
   foot:'<button class="btn pri lg ad-full" data-ok>'+ICON('bag','sm')+'Ajouter au panier</button>'});
  bindOpts(sh);var to=$('#ad-gto',sh);to.oninput=function(){$('[data-gto]',sh).textContent=to.value.trim()?'Pour '+to.value.trim():'Pour la personne de votre choix'};
  $$('[data-gm]',sh).forEach(function(x){x.addEventListener('click',function(){amt=+x.getAttribute('data-gm');$('[data-gam]',sh).textContent=F.eur(amt)})});
  $('[data-ok]',sh).onclick=function(){var who=to.value.trim();if(!who){to.focus();P.toast('Indiquez à qui vous offrez la carte',{icon:'gift'});return}
   addCart({id:'gift',name:'Carte cadeau '+F.eur(amt),price:amt,icon:'gift',cat:'Cadeau',gift:true},'Pour '+F.esc(who)+(optVal(sh,'gdel')==='print'?', imprimée à l’accueil':', par e-mail'));sh.close();if(after)after();P.toast('Carte cadeau ajoutée au panier',{icon:'gift'})}}
function checkout(after){if(!BQ.cart.length){P.toast('Votre panier est vide',{icon:'bag'});return}
  var phys=BQ.cart.some(function(l){return !l.digital}),t=cartT();
  var sh=P.sheet({title:'Mon panier',icon:'bag',body:'<div class="card soft" style="padding:6px 16px">'+BQ.cart.map(function(l){return '<div class="ad-sum"><span>'+l.name+(l.q>1?' × '+l.q:'')+(l.meta?'<span class="xs mut" style="display:block">'+l.meta+'</span>':'')+'</span><span class="num">'+F.eur(l.price*l.q)+'</span></div>'}).join('')+'<div class="ad-sum tot"><span>Total TTC</span><span class="num">'+F.eur(t)+'</span></div></div>'+
    (phys?'<div class="ad-lbl">Retrait</div>'+opts([['accueil','Retrait à l’accueil','Prêt demain dès 9 h, Manon vous prévient',sq('shop')],['casier','Dans votre casier de la sellerie','Déposé par l’équipe avant votre cours de '+hm(COURS.start),sq('saddle')]],'accueil','pick'):'<div class="note ok" style="margin-top:14px">'+ICON('checkc','sm')+'<span>Rien à retirer : vos séances et cartes sont créditées dès le paiement.</span></div>')+
    '<div class="ad-lbl">Paiement</div>'+opts(wallets(t).concat([['cb','Carte Visa se terminant par 4242','Paiement immédiat',sq('card')],['sepa','Sur ma facture de décembre','Prélevée le 1er décembre',sq('bank')]]),'apple','pay'),
   foot:'<button class="btn pri lg ad-full" data-ok></button>'});
  var ok=$('[data-ok]',sh);function lab(){var v=optVal(sh,'pay');ok.innerHTML=payBtn(v,t)||(v==='sepa'?ICON('bank','sm')+'Ajouter '+F.eur(t)+' à ma facture':ICON('lock','sm')+'Payer '+F.eur(t))}
  lab();bindOpts(sh,lab);
  ok.onclick=function(){var v=optVal(sh,'pay'),pk=optVal(sh,'pick'),n='C-2026-0'+(BQ.seq++),lines=BQ.cart.slice();spin(ok,function(){
   lines.forEach(function(l){if(/^p02/.test(l.id))A.card.left+=10*l.q});BQ.cart=[];P.renderBadges&&P.renderBadges();
   success(sh,{title:'Commande réglée',text:(phys?(pk==='casier'?'L’équipe dépose vos articles dans votre casier avant votre cours.':'Vos articles vous attendent à l’accueil dès demain 9 h.'):'Tout est crédité sur votre compte.')+(lines.some(function(l){return l.gift})?' La carte cadeau part avec votre message.':''),
    head:sq('bag')+'<div class="grow"><div class="b" style="font-size:15.5px">Commande '+n+'</div><div class="s mut">'+lines.length+' article'+(lines.length>1?'s':'')+'</div></div>',rows:[['Montant',F.eur(t)],['Paiement',payName(v)],['Retrait',phys?(pk==='casier'?'Casier de la sellerie':'Accueil, demain 9 h'):'Crédité'],['Reçu','Envoyé par e-mail']]});
   P.toast('Commande '+n+' réglée',{icon:'bag'});if(after)after()})}}

/* ---------- 15. Installations : grille des pistes ---------- */
var TS={day:0};
var ARS={a1:'Manège',a2:'Honneur',a3:'Petite',a4:'Rond'};
function tmin(s){var p=s.split(':');return +p[0]*60+ +p[1]}
function tstr(m){return String(Math.floor(m/60)).padStart(2,'0')+':'+String(m%60).padStart(2,'0')}
function capOf(a){return a==='a4'?1:4}
function cellAt(a,off,m){var dw=dowOff(off),iso=D.iso(D.day(off));
  var les=D.lessons.find(function(l){return l.dow===dw&&l.arena===a&&tmin(l.start)<m+30&&tmin(l.start)+l.dur>m});if(les)return {k:'les',l:les.title,s:les.start};
  if(off===0){var pt=(FX.paulineToday||[]).find(function(x){return x.arena===a&&tmin(x.at)<m+30&&tmin(x.at)+60>m});if(pt)return /Léa/.test(pt.what)?{k:'cours',l:'Votre cours',s:pt.at}:{k:'les',l:'Pauline, collectif',s:pt.at};
   var hs=FX.hersage;if(hs&&hs.arena===a&&tmin(hs.at)<=m&&tmin(hs.at)+30>m)return {k:'les',l:'Hersage',s:hs.at}}
  var bs=(D.trackBookings||[]).filter(function(b){return b.arena===a&&b.date===iso&&tmin(b.from)<m+30&&tmin(b.to)>m}),mine=bs.find(function(b){return b.who==='m001'});
  if(mine)return {k:'mine',b:mine,n:bs.length};if(bs.length>=capOf(a))return {k:'full',n:bs.length};return {k:bs.length?'sh':'free',n:bs.length}}
function trackHTML(){var off=TS.day,now=off===0?9*60+41:0,rows='',prev={};
  rows+='<span></span>'+D.club.arenas.map(function(a){return '<span class="hd">'+ARS[a.id]+'<small>'+(a.id==='a4'?'1 cheval':'4 cavaliers')+'</small></span>'}).join('');
  for(var m=8*60;m<21*60;m+=30){rows+='<span class="tm'+(m%60?'':' h')+'">'+(m%60?'':hm(tstr(m)))+'</span>';
   D.club.arenas.forEach(function(a){var c=cellAt(a.id,off,m),past=m+30<=now,first=c.l&&c.l!==prev[a.id];prev[a.id]=c.l||null;
    var lab=c.k==='les'||c.k==='cours'?(first?c.l:''):c.k==='mine'?(c.b.from===tstr(m)?'Vous':''):c.k==='sh'||c.k==='full'?c.n+'/'+capOf(a.id):'';
    rows+='<button class="ad-c '+c.k+(past?' past':'')+'" data-cell="'+a.id+'|'+m+'" title="'+(D.club.arenas.find(function(x){return x.id===a.id}).name)+', '+hm(tstr(m))+(c.k==='les'?' · '+c.l:c.k==='mine'?' · votre réservation':c.k==='free'?' · libre':'')+'"'+(c.k==='les'||c.k==='full'||c.k==='cours'?' disabled':'')+'>'+(lab?'<span class="ellip">'+lab+'</span>':'')+'</button>'})}
  return '<div class="ad-trk">'+rows+'</div>'}
function trackBook(a,m,after){var off=TS.day,iso=D.iso(D.day(off)),ar=D.club.arenas.find(function(x){return x.id===a});
  var c2=cellAt(a,off,m+30);if(m+60>21*60||c2.k==='les'||c2.k==='cours'||c2.k==='full'){P.toast('Il faut une heure libre d’affilée sur cette piste',{icon:'alert'});return}
  var prev=(D.trackBookings||[]).find(function(b){return b.who==='m001'&&b.date===iso}),idx=prev?D.trackBookings.indexOf(prev):-1;
  if(prev)D.trackBookings.splice(idx,1);
  var nb={id:'tb'+Date.now()%100000,who:'m001',horse:'h01',arena:a,date:iso,from:tstr(m),to:tstr(m+60)};D.trackBookings.push(nb);after();
  var cell=P.$('[data-cell="'+a+'|'+m+'"]',P.app());if(cell)cell.classList.add('pop2');
  P.toast((prev?'Une heure par jour : réservation déplacée à ':'Piste réservée à ')+hm(nb.from)+', '+ar.name.toLowerCase(),{icon:'arena',undo:function(){D.trackBookings.splice(D.trackBookings.indexOf(nb),1);if(prev)D.trackBookings.splice(idx,0,prev);after()}})}
function trackMine(b,after){var ar=D.club.arenas.find(function(x){return x.id===b.arena}),off=Math.floor((new Date(b.date+'T12:00')-D.day(0))/864e5);
  var sh=P.sheet({title:ar.name,icon:'arena',body:'<div class="card soft" style="padding:6px 16px"><div class="ad-sum"><span class="mut">Quand</span><b>'+dayL(off)+', '+hm(b.from)+' à '+hm(b.to)+'</b></div><div class="ad-sum"><span class="mut">Cheval</span><b>'+D.horse(b.horse).name+'</b></div><div class="ad-sum"><span class="mut">Piste</span><b>'+ar.name+' · '+ar.kind.toLowerCase()+'</b></div><div class="ad-sum"><span class="mut">Partagée avec</span><b>'+((D.trackBookings||[]).filter(function(x){return x!==b&&x.arena===b.arena&&x.date===b.date&&x.from<b.to&&x.to>b.from}).length||'Personne')+'</b></div></div>'+
   '<div class="note" style="margin-top:14px">'+ICON('info','sm')+'<span>Les propriétaires réservent 1 heure par jour au maximum. La piste reste partagée à 4 cavaliers, sauf le rond de longe.</span></div>',
   foot:'<button class="btn ad-full" data-x2>Garder</button><button class="btn danger ad-full" data-del>Annuler la réservation</button>'});
  $('[data-x2]',sh).onclick=function(){sh.close()};$('[data-del]',sh).onclick=function(){var i=D.trackBookings.indexOf(b);D.trackBookings.splice(i,1);sh.close();after();P.toast('Réservation de piste annulée',{icon:'arena',undo:function(){D.trackBookings.splice(i,0,b);after()}})}}

/* ---------- 29. Cheval préféré ---------- */
function favSheet(after){var p=prof(),kid=p.minor,ls=D.horses.filter(function(h){return h.kind==='club'&&(kid?h.pony:!h.pony)}).slice(0,6);
  var sh=P.sheet({title:kid?'Le poney préféré de '+p.first:'Mon cheval préféré',icon:'heart',body:'<p class="s mut" style="margin-bottom:14px">Quand '+(kid?p.first+' monte':'vous montez')+' un '+(kid?'poney':'cheval')+' du club, le moniteur voit cette préférence au moment d’attribuer les montures. Elle est respectée dès que le '+(kid?'poney':'cheval')+' est disponible.</p>'+
   opts(ls.map(function(h){return [h.id,h.name,h.breed+' · '+h.level+' · '+String(h.height/100).replace('.',',')+' m',U.hav(h)]}),A.fav[p.id],'fav'),foot:'<button class="btn pri ad-full" data-ok>'+ICON('heart','sm')+'Enregistrer ma préférence</button>'});
  bindOpts(sh);$('[data-ok]',sh).onclick=function(){A.fav[p.id]=optVal(sh,'fav');sh.close();if(after)after();P.toast(D.horse(A.fav[p.id]).name+' est '+(kid?'le poney préféré de '+p.first:'votre cheval préféré')+', le moniteur est prévenu',{icon:'heart'})}}
function favCard(){var p=prof(),h=D.horse(A.fav[p.id]);if(!h)return '';return '<div class="card ad-b"><div class="ch"><h3>'+(p.minor?'Poney préféré':'Mon cheval préféré')+'</h3><button class="btn ghost sm" data-fav2>Changer</button></div><div class="cb"><div class="ad-row">'+U.hav(h,'lg')+'<div class="grow"><div class="t">'+h.name+'</div><div class="s">'+h.breed+' · '+h.level+'</div></div><span class="ad-fav" aria-pressed="true" style="pointer-events:none">'+ICON('heart')+'</span></div><div class="xs mut">'+(p.minor?'Demandé':'Demandé quand vous montez un cheval du club')+', le moniteur le voit au montoir.</div></div></div>'}

function trackSide(){var mine=(D.trackBookings||[]).filter(function(b){return b.who==='m001'&&b.date>=D.iso(D.day(0))}).sort(function(a,b){return (a.date+a.from)<(b.date+b.from)?-1:1});
  return '<div class="card"><div class="ch"><h3>Mes créneaux de piste</h3><span class="chip">'+mine.length+'</span></div><div style="padding:8px 0">'+(mine.length?mine.map(function(b){var d=new Date(b.date+'T12:00'),off=Math.floor((d-D.day(0))/864e5),ar=D.club.arenas.find(function(x){return x.id===b.arena});
   return '<div class="ad-mine" data-tbm="'+b.id+'"><div class="ad-date g"><b>'+d.getDate()+'</b><span>'+DW[d.getDay()]+'</span></div><div class="grow"><div class="b s ellip">'+ar.name+'</div><div class="xs mut ellip">'+dayL(off)+' · '+hm(b.from)+' à '+hm(b.to)+' · '+D.horse(b.horse).name.split(' ')[0]+'</div></div>'+ICON('right','sm')+'</div>'}).join(''):U.empty('arena','Aucune piste réservée','Touchez une case libre dans la grille.'))+'</div></div>'}
/* ---------- 34. Aperçu de l’écran verrouillé ---------- */
function lockHTML(){var at=tstr(tmin(COURS.start)-25),on=P.prefs.get('adh:live',true);
  return '<div class="ad-lock" data-b="lock"><div class="lt">Aperçu de votre écran verrouillé à '+hm(at)+'</div><div class="lc">'+at.replace(/^0/,'')+'</div><div class="lt" style="margin-top:-8px">Mardi 17 novembre</div>'+
   '<div class="ad-la"><div class="r"><span class="lg">'+HORSE_GLYPH()+'</span><div class="grow" style="min-width:0"><b>Cours dans 25 min</b><small class="ellip" style="display:block">Ulysse · '+arena(COURS).toLowerCase()+' · Pauline Arnaud</small></div><b class="num" style="font-size:15px">'+COURS.start+'</b></div><div class="pb"><i></i></div></div>'+
   '<div class="ft"><span>Activité en direct sur l’écran verrouillé</span>'+U.tog(on,'ad-live')+'</div></div>'}

/* ---------- 20. Établissements et rôles ---------- */
var ORGS=[['til',D.club.name,'Propriétaire d’Ulysse et bénévole en concours',sq('stable')],['hv','Haras de la Vallée','Cavalière de passage, stage de dressage les 28 et 29 décembre',sq('globe')]];
function orgBanner(){if(A.org==='hv')return '<div class="note" style="margin-bottom:14px">'+ICON('globe','sm')+'<span>Vous êtes dans votre espace du <b>Haras de la Vallée</b> : 1 stage réservé, aucune facture en attente. <button class="btn sm" data-org0 style="margin-left:6px">Revenir aux Tilleuls</button></span></div>';
  if(A.orgRole==='benevole')return '<div class="note" style="margin-bottom:14px">'+ICON('members','sm')+'<span><b>Espace bénévole</b> : 2 missions dimanche à Rambouillet, accueil des cavaliers à 8 h et paddock de détente à 10 h 30. <button class="btn sm" data-org0 style="margin-left:6px">Revenir à mon espace propriétaire</button></span></div>';return ''}
function bindOrg(root){var b=$('[data-org0]',root);if(b)b.onclick=function(){A.org='til';A.orgRole='owner';P.rerender();P.toast('Vous êtes de retour aux Tilleuls, espace propriétaire',{icon:'stable'})}}
function orgCard(){return '<div class="card ad-b"><div class="ch"><h3>Établissement et rôle</h3></div><div class="cb"><div class="ad-org">'+opts(ORGS,A.org,'org')+'</div>'+
  (A.org==='til'?'<div><div class="ad-lbl" style="margin-top:4px">Mon rôle aux Tilleuls</div>'+U.seg([['owner','Propriétaire'],['benevole','Bénévole']],A.orgRole,'data-orl')+'</div>':'')+'<div class="xs mut">Un seul compte, un seul mot de passe : vos factures et vos documents restent séparés par établissement.</div></div></div>'}
function bindOrgCard(root,redraw){bindOpts(root,function(n,v){if(n!=='org')return;A.org=v;if(v==='hv')A.orgRole='owner';redraw();P.toast(v==='hv'?'Vous voyez votre espace du Haras de la Vallée':'Vous voyez votre espace des Tilleuls',{icon:v==='hv'?'globe':'stable'})});
  $$('[data-orl]',root).forEach(function(x){x.addEventListener('click',function(){A.orgRole=x.getAttribute('data-orl');P.toast(A.orgRole==='benevole'?'Rôle bénévole : vos missions de concours s’affichent sur l’accueil':'Rôle propriétaire : votre espace habituel',{icon:A.orgRole==='benevole'?'members':'owner'})})})}

/* ---------- 8. Nouvelle annonce de demi-pension ---------- */
function offerSheet(after){var taken=DP.days.map(function(d){return d.slice(0,3)});
  return wizard({title:'Nouvelle annonce',icon:'swap',state:{horse:'h01',type:'quart',days:['Mer'],level:'Galop 5',price:120,disc:['Plat','Extérieur'],vis:'club',text:'Ulysse cherche un cavalier régulier le mercredi pour du plat et des balades. Cheval sensible mais très gentil, idéal pour progresser sur le plat.'},done:ICON('send','sm')+'Publier l’annonce',
   steps:[
    {label:'Cheval',html:function(st){return '<div class="ad-lbl" style="margin-top:0">Quel cheval ?</div>'+opts([['h01','Ulysse de la Roche',DPR.first+' le monte déjà le mardi et le samedi',U.hav(UL)]].concat(myDecl().map(function(d){return ['d'+d.id,d.name,'Disponible après validation par Claire',U.hav(dHorse(d)),true]})),st.horse,'oh')+
      '<div class="ad-lbl">Formule</div>'+opts([['quart','Quart de pension','1 jour par semaine, en plus de la demi-pension d’'+DPR.first,sq('planning')],['demi','Demi-pension','2 jours par semaine',sq('swap')]],st.type,'ot')},
     bind:function(b){bindOpts(b)},read:function(b,st){st.horse=optVal(b,'oh')||'h01';st.type=optVal(b,'ot');if(st.type==='demi'&&st.price<160)st.price=180}},
    {label:'Jours',html:function(st){return '<div class="ad-lbl" style="margin-top:0">Jours proposés</div><div class="hrow wrap" style="--g:6px">'+['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'].map(function(d){var t=taken.indexOf(d)>=0;return '<button class="tag" data-manual data-od="'+d+'" aria-pressed="'+(st.days.indexOf(d)>=0)+'"'+(t?' disabled title="Jour de '+DPR.first+'"':'')+'>'+d+(t?' · '+DPR.first:'')+'</button>'}).join('')+'</div>'+
      '<p class="xs mut" style="margin-top:10px">'+(st.type==='quart'?'Choisissez 1 jour.':'Choisissez 2 jours.')+' Le mardi et le samedi restent à '+DPR.first+'.</p>'},
     bind:function(b,st){$$('[data-od]',b).forEach(function(t){t.onclick=function(){var d=t.getAttribute('data-od'),i=st.days.indexOf(d);if(i>=0)st.days.splice(i,1);else st.days.push(d);t.setAttribute('aria-pressed',i<0)}})},
     valid:function(st){var n=st.type==='quart'?1:2;return st.days.length<1?'Choisissez au moins un jour':st.days.length>n?(st.type==='quart'?'Un quart de pension compte 1 jour':'Une demi-pension compte 2 jours')+' au maximum':null}},
    {label:'Niveau et prix',html:function(st){return '<div class="ad-fg" style="margin-top:0"><label class="field"><span>Niveau minimum</span><select class="in" id="ad-olv">'+['Galop 4','Galop 5','Galop 6','Galop 7'].map(function(g){return '<option'+(g===st.level?' selected':'')+'>'+g+'</option>'}).join('')+'</select></label><div class="field"><span>Participation par mois</span><div class="hrow" style="--g:10px"><input type="range" class="ad-rng" min="60" max="300" step="10" value="'+st.price+'" id="ad-opr"><b class="num" id="ad-opv" style="width:56px;text-align:right">'+F.eur(st.price)+'</b></div></div></div>'+
      '<div class="ad-lbl">Disciplines autorisées</div><div class="hrow wrap" style="--g:6px">'+['Plat','Obstacle','Extérieur','Travail à pied','Concours'].map(function(d){return '<button class="tag" data-manual data-odi="'+d+'" aria-pressed="'+(st.disc.indexOf(d)>=0)+'">'+d+'</button>'}).join('')+'</div>'+
      '<div class="note" style="margin-top:14px">'+ICON('euro','sm')+'<span>La participation est versée au club et déduite de votre pension, comme pour '+DPR.first+'.</span></div>'},
     bind:function(b,st){var r=$('#ad-opr',b);r.oninput=function(){st.price=+r.value;$('#ad-opv',b).textContent=F.eur(st.price)};
      $$('[data-odi]',b).forEach(function(t){t.onclick=function(){var d=t.getAttribute('data-odi'),i=st.disc.indexOf(d);if(i>=0)st.disc.splice(i,1);else st.disc.push(d);t.setAttribute('aria-pressed',i<0)}})},
     read:function(b,st){st.level=$('#ad-olv',b).value},valid:function(st){return st.disc.length?null:'Choisissez au moins une discipline'}},
    {label:'Visibilité',html:function(st){return '<div class="ad-lbl" style="margin-top:0">Qui peut voir l’annonce ?</div>'+opts([['club','Les adhérents du club',D.members.length+' cavaliers, niveau vérifié par Piaffe',sq('members')],['public','Tous les cavaliers Piaffe à moins de 20 km','Les candidats extérieurs s’inscrivent au club',sq('globe')]],st.vis,'ov')+
      '<label class="field" style="margin-top:14px"><span>Présentation</span><textarea class="in" id="ad-otx" style="min-height:110px">'+F.esc(st.text)+'</textarea></label>'},
     bind:function(b){bindOpts(b)},read:function(b,st){st.vis=optVal(b,'ov');st.text=$('#ad-otx',b).value.trim()},valid:function(st){return st.text.length<20?'Présentez Ulysse en quelques phrases':null}},
    {label:'Aperçu',html:function(st){return '<p class="s mut" style="margin-bottom:12px">Voici ce que verront les cavaliers.</p>'+offerCard(st,true)}}],
   finish:function(sh,st){var o=Object.assign({id:'mo'+(A.myOffers.length+1),online:true,views:0},st,{days:st.days.slice(),disc:st.disc.slice()});A.myOffers.unshift(o);
    success(sh,{title:'Annonce publiée',text:'Elle est visible '+(st.vis==='club'?'des adhérents du club':'des cavaliers à moins de 20 km')+'. Vous recevez chaque candidature avec le profil et l’avis des moniteurs.',head:U.hav(UL,'lg')+'<div class="grow"><div class="b" style="font-size:15.5px">'+(st.type==='quart'?'Quart de pension':'Demi-pension')+' d’Ulysse</div><div class="s mut">'+st.days.join(', ')+' · '+F.eur(st.price)+' par mois</div></div>',
     rows:[['Niveau',st.level+' minimum'],['Disciplines',st.disc.join(', ')],['Visibilité',st.vis==='club'?'Club':'Public, 20 km'],['Statut','En ligne']]});P.toast('Annonce publiée',{icon:'send'});if(after)after()}})}
function offerCard(o,preview){var WD={Lun:'lundi',Mar:'mardi',Mer:'mercredi',Jeu:'jeudi',Ven:'vendredi',Sam:'samedi',Dim:'dimanche'};
  return '<div class="card ad-of"'+(preview?'':' data-mo="'+o.id+'"')+'><div class="hrow" style="--g:14px;align-items:flex-start">'+U.hav(UL,'xl')+'<div class="grow"><div class="hrow wrap" style="--g:6px;margin-bottom:4px">'+(preview?U.chip('Aperçu','acc'):U.chip(o.online?'En ligne':'Suspendue',o.online?'ok':'',true))+'<span class="xs mut">'+(preview?'':'Publiée à l’instant · '+o.views+' vue')+'</span></div><div class="disp bb" style="font-size:18px;letter-spacing:-.02em">'+(o.type==='quart'?'Quart de pension':'Demi-pension')+' sur Ulysse</div><div class="s mut">Selle Français · hongre · '+UL.age+' ans · 1,68 m</div></div></div>'+
   '<div class="hrow wrap" style="--g:6px">'+U.chip(ICON('planning','sm')+' '+o.days.map(function(d){return WD[d]}).join(' et '),'lg')+U.chip(ICON('medal','sm')+' '+o.level+' minimum','lg')+U.chip(ICON('euro','sm')+' '+F.eur(o.price)+' par mois','lg')+o.disc.map(function(d){return U.chip(d,'line')}).join('')+'</div>'+
   '<p class="s" style="color:var(--ink-2);line-height:1.55">'+F.esc(o.text)+'</p>'+(preview?'<div class="hrow sp"><span class="hrow s" style="--g:8px">'+U.av('m001','sm')+'<span class="mut">Propriétaire : Léa M.</span></span><button class="btn dark" disabled>Postuler</button></div>':'<div class="hrow wrap" style="--g:8px"><button class="btn sm" data-mot="'+o.id+'">'+ICON(o.online?'eye_off':'eye','sm')+(o.online?'Suspendre':'Remettre en ligne')+'</button><button class="btn ghost sm" data-mod2="'+o.id+'">'+ICON('trash','sm')+'Supprimer</button></div>')+'</div>'}

/* ---------- 4. Écran caché : mon arrivée au club en 7 étapes ---------- */
var WB={i:0,done:[],kid:false,lic:false,cert:false};
var WILL=[['contrat','acc'],['selle','cavaliers'],['cheval','chevaux'],['bombe','acc'],['pieces','argent'],['contrat','plateforme'],['seau','equipe']];
var WSTEPS=[['mail','Invitation et compte'],['family','Famille'],['horse','Cheval'],['medal','Licence et certificat'],['bank','Mandat SEPA'],['sign','Règlement intérieur'],['bell','Écrans et notifications']];
P.mod({id:'adh-bienvenue',role:'adherent',group:'Compte',title:'Mon arrivée',icon:'onboarding',n:90,hidden:true,tab:'adh-accueil',phoneTitle:'Mon arrivée',
 render:function(el,ctx){var n=WB.done.filter(Boolean).length,fin=WB.i<0,i=fin?6:WB.i;
  el.innerHTML=U.ph('Mon arrivée aux Tilleuls','Revivez votre inscription comme la vit un nouvel adhérent : sept étapes, tout depuis le téléphone, sans papier.','<button class="btn" data-go="adh-profil">'+ICON('back','sm')+'Mon profil</button><button class="btn ghost" data-wr>'+ICON('refresh','sm')+'Recommencer</button>')+
   '<div class="ad-wst scroll-x" role="list">'+WSTEPS.map(function(s,k){return (k?'<span class="ln'+(WB.done[k-1]?' on':'')+'"></span>':'')+'<button class="ad-wsd'+(WB.done[k]?' ok':'')+'" role="listitem" data-ws="'+k+'" aria-current="'+(k===i&&!fin)+'" title="'+s[1]+'"><span class="n">'+(WB.done[k]?ICON('check','sm'):k+1)+'</span><span class="l">'+s[1]+'</span></button>'}).join('')+'</div>'+
   '<div class="card ad-wz"><div class="ad-wzi d-'+(fin?'cavaliers':WILL[i][1])+'">'+ILLU[fin?'trophee':WILL[i][0]]({size:null})+'<div class="ad-wzt"><span class="eyebrow">'+(fin?'Arrivée terminée':'Étape '+(i+1)+' sur 7')+'</span><b>'+(fin?'Bienvenue aux Tilleuls':WSTEPS[i][1])+'</b><span class="s">'+n+' étape'+(n>1?'s':'')+' validée'+(n>1?'s':'')+' sur 7</span><span class="ad-wzb"><i style="width:'+Math.round(n/7*100)+'%"></i></span></div></div><div class="ad-wbc" data-wc></div></div>';
  var c=$('[data-wc]',el);
  function ok(msg,icon){WB.done[i]=true;var nx=-1;for(var k=0;k<7;k++)if(!WB.done[k]){nx=k;break}WB.i=nx;P.toast(msg,{icon:icon||'checkc'});P.rerender();var v=P.$('.view',P.app());if(v)v.scrollTop=0}
  if(fin){c.innerHTML='<div class="ad-ok" style="padding:20px 0"><div class="ad-okc"><svg viewBox="0 0 80 80"><circle class="r" cx="40" cy="40" r="34"/><path class="k" d="M26 41l10 10 19-21"/></svg><span class="strass s1"></span><span class="strass s2"></span><span class="strass s3"></span></div><h3>Bienvenue aux Tilleuls, Léa</h3><p>Compte créé, famille ajoutée, documents signés et prélèvement en place. Claire a reçu votre dossier complet.</p></div><div class="hrow wrap" style="--g:8px;justify-content:center"><button class="btn pri" data-go="adh-accueil">Ouvrir mon accueil</button><button class="btn" data-wr2>'+ICON('refresh','sm')+'Revoir depuis le début</button></div>';
   $('[data-wr2]',c).onclick=reset}
  else if(i===0){c.innerHTML=sq('mail')+'<h2>Vous êtes invitée par votre club</h2><div class="ad-mail"><div class="mh">'+U.av('s01','sm')+'<span class="grow"><b style="color:var(--ink)">Claire Dumont</b> · '+D.club.name+'</span><span>Aujourd’hui</span></div><div class="mb">Bonjour Léa, bienvenue aux Tilleuls ! Créez votre compte Piaffe pour réserver vos reprises, suivre Ulysse et régler vos factures. Votre fiche est déjà préremplie.</div></div>'+
    '<div class="ad-fg"><label class="field"><span>Adresse e-mail</span><input class="in" value="'+ME.email+'" readonly></label><label class="field"><span>Mot de passe</span><input class="in" type="password" id="ad-wpw" value="ulysse-2015"></label></div><div class="ad-row"><div class="grow"><div class="t">Déverrouiller avec Face ID</div><div class="s">Plus besoin de mot de passe sur ce téléphone</div></div>'+U.tog(true)+'</div>'+
    '<button class="btn pri lg" data-wok>'+ICON('check','sm')+'Accepter l’invitation et créer mon compte</button>';
   $('[data-wok]',c).onclick=function(){if($('#ad-wpw',c).value.length<8){P.toast('Choisissez un mot de passe de 8 caractères au moins',{icon:'key'});return}ok('Compte créé, bienvenue Léa','user')}}
  else if(i===1){c.innerHTML=sq('family')+'<h2>Votre famille</h2><p class="s mut">Ajoutez vos enfants : ils n’ont pas besoin d’adresse e-mail, vous réservez et payez pour eux.</p><div class="card list">'+'<div class="li">'+U.av('m001')+'<div class="grow"><div class="t">Léa Martin</div><div class="s">Titulaire du compte et payeuse</div></div>'+U.chip('Vous','acc')+'</div>'+(WB.kid?'<div class="li">'+U.av(D.adhFamily[1])+'<div class="grow"><div class="t">Jules Martin</div><div class="s">9 ans · sans e-mail</div></div>'+U.chip('Ajouté','ok',true)+'</div>':'')+'</div>'+
    (WB.kid?'':'<div class="ad-fg"><label class="field"><span>Prénom de l’enfant</span><input class="in" id="ad-wkn" value="Jules"></label><label class="field"><span>Date de naissance</span><input class="in num" value="12/05/2017"></label></div>')+
    '<button class="btn pri lg" data-wok>'+ICON(WB.kid?'arrow':'plus','sm')+(WB.kid?'Continuer':'Ajouter cet enfant à ma famille')+'</button>';
   $('[data-wok]',c).onclick=function(){if(!WB.kid){var v=$('#ad-wkn',c).value.trim();if(!v){P.toast('Indiquez le prénom de l’enfant',{icon:'child'});return}WB.kid=true;ok(F.esc(v)+' ajouté à votre famille, sans e-mail','child')}else ok('Famille enregistrée','family')}}
  else if(i===2){var ds=myDecl();c.innerHTML=sq('horse')+'<h2>Votre cheval</h2><p class="s mut">Vous avez un cheval en pension ou de passage ? Déclarez-le : la fiche se remplit depuis l’IFCE et Claire la valide.</p><div class="card list"><div class="li">'+U.hav(UL)+'<div class="grow"><div class="t">Ulysse de la Roche</div><div class="s">Déjà relié à votre compte · box B01</div></div>'+U.chip('Validé','ok',true)+'</div>'+ds.map(function(d){return '<div class="li">'+U.hav(dHorse(d))+'<div class="grow"><div class="t">'+F.esc(d.name)+'</div><div class="s">'+d.link+'</div></div>'+U.chip('En attente de validation','warn',true)+'</div>'}).join('')+'</div>'+
    '<div class="hrow wrap" style="--g:8px"><button class="btn pri lg" data-wdecl>'+ICON('plus','sm')+'Déclarer un autre cheval</button><button class="btn lg" data-wok>Je n’ai pas d’autre cheval</button></div>';
   $('[data-wdecl]',c).onclick=function(){declareSheet(function(){WB.done[2]=true;var nx=-1;for(var k=0;k<7;k++)if(!WB.done[k]){nx=k;break}WB.i=nx;P.rerender()})};$('[data-wok]',c).onclick=function(){ok('Étape cheval validée','horse')}}
  else if(i===3){c.innerHTML=sq('medal')+'<h2>Licence et certificat</h2><div class="ad-fg"><label class="field"><span>Numéro de licence FFE</span><input class="in num" value="'+ME.lic+'"></label><label class="field"><span>Date de naissance</span><input class="in num" value="14/03/1999"></label></div>'+
    '<div class="card list"><div class="li">'+sq(WB.lic?'checkc':'medal',WB.lic?'ok':'acc')+'<div class="grow"><div class="t">Licence 2027</div><div class="s">'+(WB.lic?'Valide, Galop 7, compétition Club':'À vérifier auprès de la FFE')+'</div></div>'+(WB.lic?U.chip('Vérifiée','ok',true):'<button class="btn sm" data-wlic>Vérifier</button>')+'</div><div class="li">'+sq(WB.cert?'checkc':'doc',WB.cert?'ok':'acc')+'<div class="grow"><div class="t">Certificat médical</div><div class="s">'+(WB.cert?'certificat-lea-2026.pdf, valable jusqu’en septembre 2027':'Photo ou PDF, de moins d’un an')+'</div></div>'+(WB.cert?U.chip('Déposé','ok',true):'<button class="btn sm" data-wcert>'+ICON('upload','sm')+'Déposer</button>')+'</div></div>'+
    '<button class="btn pri lg" data-wok'+(WB.lic&&WB.cert?'':' disabled')+'>'+ICON('check','sm')+'Valider ces documents</button>';
   var wl=$('[data-wlic]',c);if(wl)wl.onclick=function(){spin(wl,function(){WB.lic=true;P.rerender();P.toast('Licence vérifiée auprès de la FFE',{icon:'medal'})})};
   var wc=$('[data-wcert]',c);if(wc)wc.onclick=function(){spin(wc,function(){WB.cert=true;P.rerender();P.toast('Certificat médical déposé',{icon:'upload'})})};
   $('[data-wok]',c).onclick=function(){ok('Licence et certificat validés','medal')}}
  else if(i===4){c.innerHTML=sq('bank')+'<h2>Mandat de prélèvement SEPA</h2><p class="s mut">La pension et les forfaits sont prélevés le 1er du mois. Vous êtes prévenue 3 jours avant, et vous pouvez toujours payer par carte.</p><div class="ad-fg"><label class="field"><span>Titulaire du compte</span><input class="in" value="Léa Martin"></label><label class="field"><span>IBAN</span><input class="in num" value="FR76 3000 4000 0312 3456 7890 143"></label></div>'+
    '<label class="hrow" style="--g:10px;cursor:pointer">'+U.chk(true,'sepa')+'<span class="s">J’autorise '+D.club.name+' à prélever mon compte selon ce mandat.</span></label><button class="btn pri lg" data-wok>'+ICON('sign','sm')+'Signer le mandat SEPA</button>';
   $('[data-wok]',c).onclick=function(){if($('.chk[data-id="sepa"]',c).getAttribute('aria-checked')!=='true'){P.toast('Cochez l’autorisation de prélèvement',{icon:'bank'});return}ok('Mandat SEPA signé','bank')}}
  else if(i===5){c.innerHTML=sq('sign')+'<h2>Règlement intérieur 2026-2027</h2><div class="ad-paper" style="max-height:150px"><h5 style="margin-top:0">Article 1. Sécurité</h5><p>Casque aux normes obligatoire à cheval, gilet de protection en cross et pour les mineurs à l’obstacle.</p><h5>Article 2. Réservations</h5><p>Toute séance annulée moins de 24 heures avant est due, sauf certificat médical.</p><h5>Article 3. Installations</h5><p>Les propriétaires réservent les pistes 1 heure par jour au maximum, partagées à 4 cavaliers.</p></div>'+
    '<div class="ad-pad"><canvas></canvas><span class="bs"></span><span class="ul"></span><span class="hl">Signez ici, au doigt ou à la souris</span></div><div class="hrow wrap" style="--g:8px"><button class="btn ghost sm" data-wauto>'+ICON('sign','sm')+'Utiliser ma signature enregistrée</button></div><button class="btn pri lg" data-wok disabled>'+ICON('sign','sm')+'Signer le règlement</button>';
   var bt=$('[data-wok]',c),api=signPad($('.ad-pad',c),function(v){bt.disabled=!v});$('[data-wauto]',c).onclick=function(){api.auto()};
   bt.onclick=function(){ok('Règlement signé au doigt','sign')}}
  else{var mods=['adh-coachs','adh-concours','adh-demipension','adh-boutique'].filter(function(id){return P.mods[id]});
   c.innerHTML=sq('bell')+'<h2>Vos écrans et vos notifications</h2><p class="s mut">Gardez seulement ce qui vous sert. Vous pourrez tout changer dans Profil.</p><div class="card list">'+mods.map(function(id){var m=P.mods[id];return '<div class="li">'+sq(m.icon)+'<div class="grow"><div class="t">'+m.title+'</div><div class="s">'+m.group+'</div></div>'+U.tog(P.prefs.off('adherent').indexOf(id)<0).replace('class="tog"','class="tog" data-wm="'+id+'"')+'</div>'}).join('')+'</div>'+
    '<div class="ad-lbl" style="margin:4px 0 0">Me prévenir par</div><div class="hrow wrap" style="--g:6px">'+['Notification','E-mail','SMS'].map(function(t,k){return '<button class="tag" aria-pressed="'+(k<2)+'">'+t+'</button>'}).join('')+'</div><button class="btn pri lg" data-wok>'+ICON('checkc','sm')+'Terminer mon arrivée</button>';
   $('[data-wok]',c).onclick=function(){var off=P.prefs.off('adherent').filter(function(id){return mods.indexOf(id)<0});$$('[data-wm]',c).forEach(function(t){if(t.getAttribute('aria-checked')!=='true')off.push(t.getAttribute('data-wm'))});P.prefs.setOff('adherent',off);WB.done[6]=true;var nx=-1;for(var k=0;k<7;k++)if(!WB.done[k]){nx=k;break}WB.i=nx;P.rerender();P.toast('Arrivée terminée, votre espace est prêt',{icon:'checkc'})}}
  function reset(){WB.i=0;WB.done=[];WB.kid=false;WB.lic=false;WB.cert=false;P.rerender()}
  $('[data-wr]',el).onclick=function(){reset();P.toast('Parcours d’arrivée remis à zéro',{icon:'refresh'})};
  $$('[data-ws]',el).forEach(function(b){b.onclick=function(){WB.i=+b.getAttribute('data-ws');P.rerender()}});
 }});

/* ---------- 14. Écran Boutique ---------- */
P.mod({id:'adh-boutique',role:'adherent',group:'Compte',title:'Boutique',icon:'shop',n:15,
 badge:function(){var n=cartN();return n?{v:n}:null},
 render:function(el,ctx){
  el.innerHTML=U.ph('Boutique du club','Forfaits, cartes de séances, cartes cadeaux et sellerie du club. Payez en un geste, retirez à l’accueil.','<button class="btn pri" data-gift>'+ICON('gift','sm')+'Offrir une carte cadeau</button>')+
   U.seg([['cartes','Forfaits et cartes'],['cadeaux','Cartes cadeaux'],['sellerie','Sellerie du club']],BQ.tab,'data-bt')+'<div class="ad-shop" style="margin-top:14px"><div data-items style="min-width:0"></div><div data-cart></div></div><div class="ad-cbar" data-cbar></div>';
  function itemCard(it){var low=it.stock!=null&&it.stock<(it.min||0),out=it.stock===0;
   return '<div class="card ad-it d-'+(it.cat==='Sellerie'?'chevaux':/forfait|annuel|trimestre/i.test(it.name)?'cavaliers':'acc')+'"><div class="ph2">'+ICON(it.icon||'bag')+'</div><div class="nm">'+it.name+'</div>'+(it.note?'<div class="xs mut">'+it.note+'</div>':'')+
    '<div class="hrow sp"><span class="pr">'+F.eur(it.price)+'</span>'+(it.full&&it.full!==it.price?'<span class="xs mut" style="text-decoration:line-through">'+F.eur(it.full)+'</span>':low?U.chip('Plus que '+it.stock,'warn'):'')+'</div><button class="btn'+(out?'':' dark')+'" data-add="'+it.id+'"'+(out?' disabled':'')+'>'+(out?'Épuisé':ICON('plus','sm')+'Ajouter')+'</button></div>'}
  function items(){var b=$('[data-items]',el),h='';
   if(BQ.tab==='cartes'){var S=shopItems().filter(function(x){return x.cat==='Séances'&&!/cadeau/i.test(x.name)});
    h='<div class="ad-lbl" style="margin-top:0">Cartes et séances</div><div class="ad-items rise">'+S.map(itemCard).join('')+'</div><div class="ad-lbl">Forfaits pour la fin de saison</div><div class="ad-items rise">'+forfaits().map(itemCard).join('')+'</div>'}
   else if(BQ.tab==='cadeaux'){var g=shopItems().filter(function(x){return /cadeau/i.test(x.name)});
    h='<div class="g2" style="--g:12px"><button class="ad-gift" data-gift style="text-align:left"><span class="strass"></span><span class="eyebrow" style="color:color-mix(in srgb,var(--navy-ink) 70%,var(--acc))">Montant libre</span><span class="am">30 à 150 €</span><span class="s" style="color:color-mix(in srgb,var(--navy-ink) 80%,transparent)">Avec votre message, par e-mail ou imprimée</span></button>'+
     g.map(function(it){return '<div class="card ad-it d-argent"><div class="ph2">'+ICON('gift')+'</div><div class="nm">'+it.name+'</div><div class="xs mut">Prête à offrir, valable un an</div><div class="hrow sp"><span class="pr">'+F.eur(it.price)+'</span></div><button class="btn dark" data-giftq="'+it.id+'">'+ICON('gift','sm')+'Choisir le destinataire</button></div>'}).join('')+'</div>'+
     '<div class="note" style="margin-top:14px">'+ICON('info','sm')+'<span>Les cartes cadeaux se règlent sur les séances, les stages, les cours particuliers et la boutique. Le destinataire n’a pas besoin d’être adhérent.</span></div>'}
   else{var Se=shopItems().filter(function(x){return x.cat==='Sellerie'});h='<div class="ad-items rise">'+Se.map(itemCard).join('')+'</div>'}
   b.innerHTML=h;P.animate(b);swIn(b);
   $$('[data-add]',b).forEach(function(x){x.onclick=function(){var id=x.getAttribute('data-add'),it=itemOf(id)||forfaits().find(function(f){return f.id===id});addCart(it);cart();P.toast(it.name+' ajouté au panier',{icon:'bag'})}});
   $$('[data-gift],[data-giftq]',b).forEach(function(x){x.onclick=function(){giftSheet(cart)}})}
  function cart(){var c=$('[data-cart]',el),n=cartN(),t=cartT();
   c.innerHTML='<div class="card"><div class="ch"><h3>Panier</h3>'+(n?'<span class="chip acc">'+n+'</span>':'')+'</div>'+(n?'<div style="padding:6px 0">'+BQ.cart.map(function(l,i){return '<div class="ad-cl"><div style="min-width:0"><div class="b s ellip">'+l.name+'</div>'+(l.meta?'<div class="xs mut ellip">'+l.meta+'</div>':'<div class="xs mut">'+F.eur(l.price)+' l’unité</div>')+'</div><span class="ad-qty"><button class="btn ghost icon sm" data-qm="'+i+'" title="Retirer un">'+ICON('minus','sm')+'</button><b>'+l.q+'</b><button class="btn ghost icon sm" data-qp="'+i+'" title="Ajouter un"'+(l.meta?' disabled':'')+'>'+ICON('plus','sm')+'</button></span><b class="num s">'+F.eur(l.price*l.q)+'</b></div>'}).join('')+'</div>'+
    '<div class="cf" style="flex-direction:column;align-items:stretch;gap:10px"><div class="hrow sp"><span class="mut">Total</span><b class="num" style="font-size:17px">'+F.eur(t)+'</b></div><button class="btn pri lg" data-pay>'+ICON('lock','sm')+'Payer '+F.eur(t)+'</button><span class="xs mut">Apple Pay, Google Pay, carte ou sur votre prochaine facture.</span></div>':
    '<div style="padding:4px 0 12px">'+U.empty('bag','Votre panier est vide','Ajoutez une carte de séances, un cadeau ou un article de sellerie.')+'</div>')+'</div>'+
    '<div class="card ad-b" style="margin-top:14px"><div class="ch"><h3>Retrait à l’accueil</h3></div><div class="cb"><div class="ad-row">'+U.av('s09')+'<div class="grow"><div class="t">Manon vous prépare la commande</div><div class="s">Du mardi au samedi, de 9 h à 19 h</div></div></div></div></div>';
   var bar=$('[data-cbar]',el);bar.classList.toggle('on',!!n);bar.innerHTML=n?'<div class="grow"><div class="b s">'+n+' article'+(n>1?'s':'')+'</div><div class="xs mut">Retrait à l’accueil</div></div><button class="btn pri" data-pay>'+ICON('lock','sm')+'Payer '+F.eur(t)+'</button>':'';
   $$('[data-pay]',el).forEach(function(x){x.onclick=function(){checkout(cart)}});
   $$('[data-qm]',c).forEach(function(x){x.onclick=function(){var l=BQ.cart[+x.getAttribute('data-qm')];l.q--;if(!l.q)BQ.cart.splice(BQ.cart.indexOf(l),1);P.renderBadges&&P.renderBadges();cart()}});
   $$('[data-qp]',c).forEach(function(x){x.onclick=function(){BQ.cart[+x.getAttribute('data-qp')].q++;cart()}})}
  $$('[data-bt]',el).forEach(function(b){b.addEventListener('click',function(){BQ.tab=b.getAttribute('data-bt');items()})});
  $('[data-gift]',el).onclick=function(){giftSheet(function(){if(BQ.tab!=='cadeaux'){BQ.tab='cadeaux';$$('[data-bt]',el).forEach(function(x){x.setAttribute('aria-selected',x.getAttribute('data-bt')==='cadeaux')});items()}cart()})};
  items();cart();
 }});

/* ---------- Cours du jour avec Pauline (incohérence 5) ---------- */
function coursSheet(){var sh=P.sheet({title:COURS.title,icon:'coach',body:'<div class="card soft" style="padding:6px 16px"><div class="ad-sum"><span class="mut">Quand</span><b>Aujourd’hui, '+COURS.start+' – '+endT(COURS)+'</b></div><div class="ad-sum"><span class="mut">Où</span><b>'+arena(COURS)+'</b></div><div class="ad-sum"><span class="mut">Avec</span><b>Pauline Arnaud, coach CSO</b></div><div class="ad-sum"><span class="mut">Cheval</span><b>'+UL.name+'</b></div><div class="ad-sum"><span class="mut">Règlement</span><b>'+F.eur(55)+', carte Visa après la séance</b></div></div>'+
  '<div class="ad-lbl">Ce que Pauline a prévu</div><p class="s" style="color:var(--ink-2);line-height:1.55">Détente sur le plat, puis abords et contrat de foulées en ligne courbe. Fin de séance sur le triple de Rambouillet monté à 1,10 m.</p>'+
  '<div class="note">'+ICON('arena','sm')+'<span>La carrière d’honneur est réservée pour vous jusqu’à '+hm(endT(COURS))+'. Pauline enchaîne avec son collectif de CSO.</span></div>',
  foot:'<button class="btn ad-full" data-go="adh-messages" data-id="t-coach">'+ICON('chat','sm')+'Écrire à Pauline</button><button class="btn pri ad-full" data-cal>'+ICON('calendar_add','sm')+'Ajouter à mon agenda</button>'});
 $('[data-cal]',sh).onclick=function(){sh.close();P.toast('Cours ajouté à votre agenda')}}

/* ---------- Dictée (messages et assistant) ---------- */
function dictate(btn,inp,text,done){if(btn.classList.contains('on'))return;btn.classList.add('on');btn.title='J’écoute…';inp.value='';inp.placeholder='J’écoute…';var k=0,words=text.split(' ');
  setTimeout(function(){var iv=setInterval(function(){if(!inp.isConnected){clearInterval(iv);return}k++;inp.value=words.slice(0,k).join(' ');if(k>=words.length){clearInterval(iv);btn.classList.remove('on');btn.title='Dicter';inp.focus();if(done)done()}},P.RM?10:110)},P.RM?10:600)}
(function(){var base=P.assistant;P.assistant=function(first){base.apply(this,arguments);var w=P.$('.aip',P.app());if(!w||P.ctx().role!=='adherent'||P.$('[data-dict]',w))return;var f=P.$('.aip form',P.app()),inp=f&&P.$('input',f);if(!inp)return;
  var b=document.createElement('button');b.type='button';b.className='btn ghost icon sm ad-mic';b.setAttribute('data-dict','');b.title='Dicter';b.innerHTML=ICON('mic','sm');f.insertBefore(b,inp);
  b.onclick=function(){dictate(b,inp,'Combien de rattrapages me reste-t-il ?'.replace(' ?',' ?'),function(){P.toast('Dictée terminée, relisez puis envoyez',{icon:'mic'})})}}})();

/* ---------- Palette et assistant ---------- */
P.actions.push(
 {role:'adherent',label:'Déclarer un cheval',icon:'horse',run:function(){P.go('adh-cheval');setTimeout(function(){declareSheet(P.rerender)},400)}},
 {role:'adherent',label:'Réserver une piste',icon:'arena',run:function(){P.go('adh-reserver',{mode:'pistes'})}},
 {role:'adherent',label:'Partir en balade avec Ulysse',icon:'route',run:function(){P.go('adh-cheval');setTimeout(rideSheet,400)}},
 {role:'adherent',label:'Réviser la théorie du galop',icon:'bulb',run:function(){P.go('adh-progression');setTimeout(function(){quizSheet(P.rerender)},400)}},
 {role:'adherent',label:'Ouvrir la boutique du club',icon:'shop',run:function(){P.go('adh-boutique')}},
 {role:'adherent',label:'Offrir une carte cadeau',icon:'gift',run:function(){BQ.tab='cadeaux';P.go('adh-boutique');setTimeout(function(){giftSheet(P.rerender)},400)}},
 {role:'adherent',label:'Créer une annonce de demi-pension',icon:'swap',run:function(){DS.side='owner';P.go('adh-demipension');setTimeout(function(){offerSheet(P.rerender)},400)}},
 {role:'adherent',label:'Revoir mon arrivée au club',icon:'onboarding',run:function(){P.go('adh-bienvenue')}},
 {role:'adherent',label:'Changer d’établissement ou de rôle',icon:'swap',run:function(){P.go('adh-profil',{tab:'profil'})}});
if(P.suggestions&&P.suggestions.adherent&&P.suggestions.adherent.indexOf('Combien de rattrapages me reste-t-il ?')<0)P.suggestions.adherent.push('Combien de rattrapages me reste-t-il ?');
P.brain.unshift(
 {role:'adherent',re:/combien.*rattrap|rattrapages?.*(reste|restant)|crédits?\b/i,reply:function(){var ex=new Date(2027,0,15);
   return {text:'Il vous reste '+A.credits+' crédit'+(A.credits>1?'s':'')+' de rattrapage, valables jusqu’au 15 janvier, soit encore '+Math.round((ex-D.day(0))/864e5)+' jours. Votre carte de séances compte aussi '+A.card.left+' séances sur '+A.card.total+'.',
    card:'<div class="hrow sp"><span class="s">Crédits de rattrapage</span><b class="s num">'+A.credits+'</b></div><div class="hrow sp"><span class="s">Carte 10 séances</span><b class="s num">'+A.card.left+' sur '+A.card.total+'</b></div>',
    actions:[{label:'Utiliser un crédit',run:function(){P.go('adh-reserver',{mode:'rattrapage'});return 'Rattrapages ouverts'}}]}}},
 {role:'adherent',re:/déclar|nouveau cheval|sire|ifce/i,reply:function(){var ds=myDecl();
   return {text:(ds.length?ds.length+' cheval'+(ds.length>1?'aux':'')+' déclaré'+(ds.length>1?'s':'')+' attend'+(ds.length>1?'ent':'')+' la validation de Claire : '+ds.map(function(d){return d.name}).join(', ')+'. ':'')+'Pour déclarer un cheval, saisissez son numéro SIRE : la fiche se remplit depuis l’IFCE, puis vous indiquez votre lien avec lui et son hébergement.',
    actions:[{label:'Déclarer un cheval',run:function(){P.go('adh-cheval');setTimeout(function(){declareSheet(P.rerender)},400);return 'Déclaration ouverte'}}]}}},
 {role:'adherent',re:/progress|degré|galop \d|niveau|compétence|théorie|quiz/i,reply:function(){var p=prof(),G=PG[p.id],q=A.quiz[p.id];
   return {text:p.first+' est Galop '+G.g+'. Le '+G.next+' est avancé à '+G.np+' %. '+(p.id==='lea'?'Vous avez 8 h 45 en selle en novembre, sur un objectif de 12 heures. ':'')+(q!=null?'Meilleur score au quiz de théorie : '+q+' sur 10.':'Le quiz de théorie n’a pas encore été tenté.'),
    card:G.skills.slice(0,3).map(function(s){return '<div class="hrow sp"><span class="s">'+s[0]+'</span><b class="s num">'+s[1]+' %</b></div>'}).join(''),
    actions:[{label:'Réviser la théorie',run:function(){P.go('adh-progression');setTimeout(function(){quizSheet(P.rerender)},400);return 'Quiz ouvert'}},{label:'Voir ma progression',run:function(){P.go('adh-progression');return 'Ouvert'}}]}}},
 {role:'adherent',re:/licence|certificat|assurance/i,reply:function(){return {text:'Votre licence FFE 2027 (n° '+ME.lic+') est valide jusqu’au 31 décembre 2027, avec la compétition Club. Le certificat médical est valable jusqu’en septembre 2027. Celle de Jules est aussi à jour.',
   actions:[{label:'Ajouter ma licence à Cartes',run:function(){P.toast('Licence ajoutée à l’application Cartes',{icon:'wallet'});return 'Ajoutée'}},{label:'Voir mes documents',run:function(){P.go('adh-profil',{tab:'docs'});return 'Ouvert'}}]}}},
 {role:'adherent',re:/demi[- ]pension|emma|annonce|candidat/i,reply:function(){var nv=CANDS.filter(function(c){return c.st==='Nouvelle'}).length,ts=toSign().some(function(c){return c.id==='ct2'});
   return {text:DPR.first+' '+DPR.last+' monte Ulysse le mardi et le samedi depuis le 1er septembre, pour 180 € par mois déduits de votre pension : 540 € depuis septembre. '+(ts?'L’avenant de renouvellement attend votre signature. ':'')+nv+' nouvelle'+(nv>1?'s':'')+' candidature'+(nv>1?'s':'')+' à étudier.',
    actions:[ts?{label:'Signer l’avenant',run:function(){P.go('adh-contrats',{id:'ct2'});return 'Avenant ouvert'}}:{label:'Voir les candidats',run:function(){P.go('adh-demipension');return 'Ouvert'}},{label:'Nouvelle annonce',run:function(){DS.side='owner';P.go('adh-demipension');setTimeout(function(){offerSheet(P.rerender)},400);return 'Annonce ouverte'}}]}}},
 {role:'adherent',re:/message|non lu|m’a écrit|m'a écrit|répon/i,reply:function(){var u=TH.filter(function(t){return t.un});
   return {text:u.length?'Vous avez '+unread()+' message'+(unread()>1?'s':'')+' non lu'+(unread()>1?'s':'')+' dans '+u.length+' conversation'+(u.length>1?'s':'')+'.':'Aucun message non lu.',card:u.map(function(t){var m=t.m[t.m.length-1];return '<div class="hrow sp"><span class="s ellip"><b>'+t.title+'</b> · '+m[1].replace(/<[^>]+>/g,' ').slice(0,60)+'</span><b class="s num">'+t.un+'</b></div>'}).join(''),
    actions:u.length?[{label:'Lire '+u[0].title,run:function(){P.go('adh-messages',{id:u[0].id});return 'Conversation ouverte'}}]:null}}},
 {role:'adherent',re:/piste|carrière|manège|installation/i,reply:function(){var off=1,frees=[];D.club.arenas.slice(0,3).forEach(function(a){for(var m=9*60;m<12*60&&frees.length<3;m+=30){if(cellAt(a.id,off,m).k==='free'&&cellAt(a.id,off,m+30).k==='free'){frees.push([a,m]);break}}});
   return {text:'Demain, voici les créneaux d’une heure encore libres le matin. Règle du club : 1 heure par jour, piste partagée à 4 cavaliers.',card:frees.map(function(f){return '<div class="hrow sp"><span class="s"><b>'+f[0].name+'</b></span><b class="s num">'+hm(tstr(f[1]))+'</b></div>'}).join(''),
    actions:[{label:'Ouvrir la grille des pistes',run:function(){TS.day=1;P.go('adh-reserver',{mode:'pistes'});return 'Grille ouverte'}}]}}},
 {role:'adherent',re:/boutique|acheter|cadeau|polo|gants|sweat/i,reply:function(){return {text:'La boutique du club propose les cartes de séances, les forfaits, les cartes cadeaux et la sellerie. Retrait à l’accueil dès le lendemain, paiement par Apple Pay, Google Pay ou carte.',
   actions:[{label:'Ouvrir la boutique',run:function(){P.go('adh-boutique');return 'Ouvert'}},{label:'Offrir une carte cadeau',run:function(){BQ.tab='cadeaux';P.go('adh-boutique');setTimeout(function(){giftSheet(P.rerender)},400);return 'Carte cadeau ouverte'}}]}}},
 {role:'adherent',re:/balade|extérieur|forêt|foret/i,reply:function(){return {text:'Pour une balade avec Ulysse, Piaffe suit votre trajet et prévient Marc Martin et l’accueil si vous restez immobile plus de 5 minutes. Météo du jour : '+D.weather[0].t+' °C.',
   actions:[{label:'Partir en balade',run:function(){P.go('adh-cheval');setTimeout(rideSheet,400);return 'Suivi prêt'}}]}}});


/* Manche 4 : segments trop longs pour le téléphone. Un fondu sur le bord indique qu'ils défilent et disparaît en bout de course. */
P.css(`.seg.ad-sf{-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 36px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 36px),transparent)}
.seg.ad-sf.l{-webkit-mask-image:linear-gradient(90deg,transparent,#000 36px,#000 calc(100% - 36px),transparent);mask-image:linear-gradient(90deg,transparent,#000 36px,#000 calc(100% - 36px),transparent)}
.seg.ad-sf.e{-webkit-mask-image:linear-gradient(90deg,transparent,#000 36px);mask-image:linear-gradient(90deg,transparent,#000 36px)}`);
function adSegs(root){P.$$('.seg',root).forEach(function(g){if(g.__sf)return;g.__sf=1;function up(){var over=g.scrollWidth>g.clientWidth+2,x=g.scrollLeft,end=x+g.clientWidth>=g.scrollWidth-2;g.classList.toggle('ad-sf',over);g.classList.toggle('l',over&&x>2&&!end);g.classList.toggle('e',over&&end)}g.addEventListener('scroll',up,{passive:true});requestAnimationFrame(up)})}
/* =====================================================================
   CLUB RÉEL : l'espace adhérent de la personne connectée
   La démo garde Léa Martin (m001) et son jeu d'exemple. Dans un vrai club (D.me.adherent est la fiche
   de la personne connectée), chaque écran se construit à partir de sa fiche, de sa famille (même fam)
   et des collections du club ; les modifications passent par DATA et sont enregistrées par la synchro.
   ===================================================================== */
var LV={},LVB={};
function lvMe(){var id=D.me&&D.me.adherent,m=id&&D.member(id);return m||D.person(id)||{id:id||'me',first:'',last:'',galop:0}}
function lvIds(){var me=lvMe(),ids=[me.id];(D.members||[]).forEach(function(m){if(m.fam&&me.fam&&m.fam===me.fam&&ids.indexOf(m.id)<0)ids.push(m.id)});
  ((window.PL&&PL.personIds)||[]).forEach(function(i){if(ids.indexOf(i)<0&&D.member(i))ids.push(i)});return ids}
function lvPeople(){var L=lvIds().map(function(i){return D.member(i)}).filter(Boolean);return L.length?L:[lvMe()]}
function lvFirst(){var me=lvMe();return me.first||((window.PL&&PL.user&&PL.user.first)||'')}
function lvNm(p){return ((p&&p.first||'')+' '+(p&&p.last||'')).trim()}
function lvNow(){var t=D.today||new Date();return t.getHours()*60+t.getMinutes()}
function lvMin(s){var p=String(s||'0:0').split(':');return (+p[0]||0)*60+(+p[1]||0)}
function lvOff(l){var t=D.today||new Date(),o=(l.dow-t.getDay()+7)%7;if(o===0&&lvMin(l.start)+(+l.dur||60)<=lvNow())o=7;return o}
function lvWhen(o){return o===0?'aujourd’hui':o===1?'demain':DWL7(o)}
function DWL7(o){return ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'][D.day(o).getDay()]}
function lvMine(){var ids=lvIds();return (D.lessons||[]).filter(function(l){return (l.riders||[]).some(function(r){return ids.indexOf(r)>=0})&&!/annul/i.test(l.status||'')})
  .map(function(l){return {l:l,off:lvOff(l),who:(l.riders||[]).filter(function(r){return ids.indexOf(r)>=0})}}).sort(function(a,b){return a.off-b.off||lvMin(a.l.start)-lvMin(b.l.start)})}
function lvHorses(){var ids=lvIds(),hb=(D.halfboard||[]).filter(function(d){return ids.indexOf(d.rider)>=0&&!/termin|annul/i.test(d.status||'')}).map(function(d){return d.horse});
  return (D.horses||[]).filter(function(h){return ids.indexOf(h.owner)>=0||hb.indexOf(h.id)>=0})}
function lvInv(){var ids=lvIds();return (D.invoices||[]).filter(function(i){return i.status!=='brouillon'&&(!i.member||ids.indexOf(i.member)>=0)})}
function lvDueL(){return lvInv().filter(function(i){return +i.left>0&&['payée','annulée','avoir'].indexOf(i.status)<0})}
function lvDue(){return lvDueL().reduce(function(a,i){return a+(+i.left||0)},0)}
function lvSigners(c){return Array.isArray(c.signers)&&c.signers.length?c.signers:[c.party].filter(Boolean)}
function lvContracts(){var ids=lvIds();return (D.contracts||[]).filter(function(c){return c.status!=='brouillon'&&(ids.indexOf(c.party)>=0||lvSigners(c).some(function(s){return ids.indexOf(s)>=0}))})}
function lvToSign(c){var ids=lvIds(),sg=c.signed||[];return lvSigners(c).filter(function(s){return ids.indexOf(s)>=0&&sg.indexOf(s)<0})}
function lvMustSign(c){return c.status==='à signer'&&lvToSign(c).length>0}
function lvWx(){var w=D.weather||[];return w.length&&!w[0].none?w:null}
function lvSave(){try{if(window.PL&&PL.sync)PL.sync.flush()}catch(e){}}
function lvHM(d){d=d||new Date();return String(d.getHours()).padStart(2,'0')+' h '+String(d.getMinutes()).padStart(2,'0')}
function lvUid(p){return window.PL&&PL.uid?PL.uid(p):p+Date.now().toString(36)}
function lvIco(i,d){return '<span class="ico d-'+d+'">'+ICON(i)+'</span>'}
function lvLk(go,txt){return '<button class="lk" data-go="'+go+'">'+(txt||'')+ICON('arrow','sm')+'</button>'}
function lvRidersTxt(l){var n=(l.riders||[]).length;return n+' cavalier'+(n>1?'s':'')+' sur '+l.cap}
function lvCareOf(h){var t=D.iso(D.day(0));return (D.care||[]).filter(function(c){return c.horse===h.id}).sort(function(a,b){return String(a.date).localeCompare(String(b.date))})}
function lvNextCare(h){var t=D.iso(D.day(0));return lvCareOf(h).filter(function(c){return c.status!=='fait'&&String(c.date)>=t})[0]}
function lvEsc(s){return F.esc?F.esc(String(s==null?'':s)):String(s==null?'':s)}
/* écrit au club : un fil de messages avec la personne, créé au besoin */
function lvThread(){var me=lvMe();return (D.threads||[]).filter(function(t){return t.with===me.id})[0]}
function lvSend(text){var me=lvMe(),t=lvThread(),m={w:me.id,t:lvHM(),x:text,at:new Date().toISOString()};
  if(!t){t={id:lvUid('th'),with:me.id,title:lvNm(me)||'Adhérent',last:text,when:lvHM(),unread:1,msgs:[m]};D.threads.unshift(t)}
  else{t.msgs=(t.msgs||[]).concat([m]);t.last=text;t.when=lvHM();t.unread=(+t.unread||0)+1}
  lvSave();return t}
function lvSafe(id,fn){return function(el,ctx){ctx=ctx||{params:{}};ctx.params=ctx.params||{};try{fn(el,ctx)}catch(e){console.warn('[adhérent] '+id,e);
  if(window.PL&&PL.renderEmpty){PL.renderErrors[id]=String(e&&e.message||e);PL.renderEmpty(el,P.mods[id],e)}else throw e}}}

/* ---------- Feuilles communes ---------- */
function lvLessonSheet(l,off){var ids=lvIds(),who=(l.riders||[]).filter(function(r){return ids.indexOf(r)>=0}),h=who[0]&&l.horses&&l.horses[who[0]]&&D.horse(l.horses[who[0]]);
  var sh=P.sheet({title:l.title,icon:'planning',body:'<div class="stack" style="--g:14px"><div class="card soft" style="padding:14px"><div class="ad-sum"><span class="mut">Quand</span><b>'+cap(lvWhen(off))+', '+l.start+' – '+endT(l)+'</b></div><div class="ad-sum"><span class="mut">Où</span><b>'+(arena(l)||'Au club')+'</b></div>'+(l.coach?'<div class="ad-sum"><span class="mut">Avec</span><b>'+lvEsc(D.name(l.coach))+'</b></div>':'')+'<div class="ad-sum"><span class="mut">Monture</span><b>'+(h?lvEsc(h.name):'Attribuée par le club')+'</b></div></div>'+
    '<div><div class="ad-lbl">Inscrits</div><div class="hrow wrap" style="--g:10px">'+who.map(function(r){return U.chip(lvEsc(D.name(r)),'ok',true)}).join('')+'<span class="s mut">'+lvRidersTxt(l)+'</span></div></div>'+
    '<div class="note">'+ICON('info','sm')+'<span>Vous ne pouvez plus venir ? Libérez votre place : elle est aussitôt proposée aux autres cavaliers.</span></div></div>',
    foot:'<button class="btn ad-full" data-abs>Libérer ma place</button><button class="btn pri ad-full" data-x2>Fermer</button>'});
  $('[data-x2]',sh).onclick=function(){sh.close()};
  $('[data-abs]',sh).onclick=function(){l.riders=(l.riders||[]).filter(function(r){return ids.indexOf(r)<0});who.forEach(function(r){if(l.horses)delete l.horses[r]});lvSave();sh.close();P.rerender();
    P.toast('Place libérée pour la reprise « '+l.title+' »',{icon:'calendar_add',undo:function(){who.forEach(function(r){if(l.riders.indexOf(r)<0)l.riders.push(r)});lvSave();P.rerender()}})}}
function lvBookSheet(l,off,who,after){var p=D.member(who)||lvMe(),left=l.cap-(l.riders||[]).length;
  var sh=P.sheet({title:'Réserver la reprise',icon:'calendar_add',body:'<div class="card soft" style="padding:14px 16px"><div class="hrow" style="--g:12px"><div class="ad-date"><b>'+D.day(off).getDate()+'</b><span>'+DW[D.day(off).getDay()]+'</span></div><div class="grow"><div class="b" style="font-size:15.5px">'+lvEsc(l.title)+'</div><div class="s mut">'+l.start+' – '+endT(l)+(arena(l)?' · '+lvEsc(arena(l)):'')+'</div><div class="s mut">'+(l.coach?lvEsc(D.name(l.coach))+' · ':'')+left+' place'+(left>1?'s':'')+' restante'+(left>1?'s':'')+'</div></div></div></div>'+
    '<div class="ad-lbl">Cavalier</div><div class="ad-row">'+U.av(p)+'<div class="grow"><div class="t">'+lvEsc(lvNm(p))+'</div><div class="s">'+(p.galop?'Galop '+p.galop:'Cavalier du club')+'</div></div></div>'+
    '<p class="xs mut" style="margin-top:14px">Votre inscription est envoyée au club, qui la voit aussitôt dans son planning. Vous pouvez libérer votre place depuis cet écran.</p>',
    foot:'<button class="btn pri lg ad-full" data-ok>'+ICON('calendar_add','sm')+'Réserver ma place</button>'});
  var ok=$('[data-ok]',sh);ok.onclick=function(){spin(ok,function(){if((l.riders||[]).indexOf(who)<0){l.riders=(l.riders||[]).concat([who])}
    if(Array.isArray(l.waitlist))l.waitlist=l.waitlist.filter(function(x){return x!==who});lvSave();
    success(sh,{title:'C’est réservé',text:'Votre place est enregistrée. Le club la voit dans son planning.',head:'<div class="ad-date"><b>'+D.day(off).getDate()+'</b><span>'+DW[D.day(off).getDay()]+'</span></div><div class="grow"><div class="b" style="font-size:15.5px">'+lvEsc(l.title)+'</div><div class="s mut">'+cap(F.dateL(D.day(off)))+'</div></div>'+(l.coach?U.av(l.coach):''),
      rows:[['Horaire',l.start+' – '+endT(l)],['Lieu',lvEsc(arena(l)||'Au club')],['Cavalier',lvEsc(lvNm(p))],['Avec',lvEsc(l.coach?D.name(l.coach):'Le club')]]});if(after)after()})}}
function lvSignSheet(c,after){var me=lvMe(),must=lvToSign(c),done=!must.length;
  var sh=P.sheet({title:c.title||'Document',icon:'sign',wide:true,body:function(b){
   b.innerHTML='<div class="ad-paper"><h4>'+lvEsc(c.title||'Document')+'</h4><div class="xs mut">'+lvEsc(D.club.name)+(c.date?' · '+F.date(c.date):'')+(c.horse&&D.horse(c.horse)?' · '+lvEsc(D.horse(c.horse).name):'')+(c.amount?' · '+F.eur(c.amount):'')+'</div>'+
     (c.text?'<p>'+lvEsc(c.text)+'</p>':Array.isArray(c.arts)&&c.arts.length?c.arts.map(function(a,i){return '<h5>Article '+(i+1)+'. '+lvEsc(a[0])+'</h5><p>'+lvEsc(a[1])+'</p>'}).join(''):'<p>Le texte complet de ce document vous est remis par le club. En signant, vous confirmez l’avoir lu et en accepter les termes.</p>')+'</div>'+
    '<div class="ad-lbl">Signataires</div><div class="card list" data-sg></div>'+
    (done?'':'<label class="hrow" style="--g:10px;margin:16px 0 12px;cursor:pointer">'+U.chk(false,'read')+'<span class="s">J’ai lu le document en entier et j’en accepte les termes.</span></label>')+
    (done?'':'<div class="hrow sp" style="margin:0 0 8px"><span class="ad-lbl" style="margin:0">Votre signature</span><button class="btn ghost sm" data-clr>Effacer</button></div><div class="ad-pad"><canvas></canvas><span class="bs"></span><span class="ul"></span><span class="hl">Signez ici, au doigt ou à la souris</span></div>')+
    '<p class="xs mut hrow" style="--g:6px;margin-top:10px">'+ICON('shield','sm')+'Signature électronique horodatée, enregistrée par le club.</p>'},
   foot:done?'<button class="btn pri ad-full" data-x2>Fermer</button>':'<button class="btn pri lg ad-full" data-ok disabled>'+ICON('sign','sm')+'Signer le document</button>'});
  function signers(){$('[data-sg]',sh).innerHTML=lvSigners(c).map(function(s){var y=(c.signed||[]).indexOf(s)>=0;return '<div class="li">'+U.av(s)+'<div class="grow"><div class="t">'+(s===me.id?'Vous, '+lvEsc(lvNm(me)):lvEsc(D.name(s)||'Le club'))+'</div></div>'+(y?U.chip('Signé','ok',true):U.chip('En attente',''))+'</div>'}).join('')}
  signers();
  if(done){$('[data-x2]',sh).onclick=function(){sh.close()};return}
  var pad=$('.ad-pad',sh),ok=$('[data-ok]',sh),inked=false,api=signPad(pad,function(v){inked=v;chk()});
  function chk(){setTimeout(function(){ok.disabled=!(inked&&$('.chk[data-id="read"]',sh).getAttribute('aria-checked')==='true')},0)}
  $('.chk[data-id="read"]',sh).addEventListener('click',chk);$('.chk[data-id="read"]',sh).parentNode.addEventListener('click',chk);$('[data-clr]',sh).onclick=function(){api.clear()};
  ok.onclick=function(){c.signed=(c.signed||[]).concat(must.filter(function(s){return (c.signed||[]).indexOf(s)<0}));c.signedAt=c.signedAt||{};must.forEach(function(s){c.signedAt[s]=new Date().toISOString()});
   if(lvSigners(c).every(function(s){return c.signed.indexOf(s)>=0}))c.status='signé';lvSave();
   pad.classList.add('done');pad.insertAdjacentHTML('beforeend','<span class="ad-stamp"><span class="strass"></span>Signé le '+F.date(D.iso(new Date()))+' à '+lvHM()+'</span>');signers();
   var f=$('.sf',sh);f.innerHTML='<button class="btn pri ad-full" data-done>Terminé</button>';$('[data-clr]',sh)&&$('[data-clr]',sh).remove();$('[data-done]',f).onclick=function(){sh.close()};
   P.toast(c.status==='signé'?'Document signé, le club en reçoit une copie':'Document signé. Les autres signataires sont prévenus.',{icon:'sign'});if(after)after()}}
function lvWriteSheet(title,ph,send){var sh=P.sheet({title:title,icon:'chat',body:'<label class="lv-fl"><span>Votre message</span><textarea class="in" rows="5" data-tx placeholder="'+lvEsc(ph||'')+'" style="height:auto;padding:12px"></textarea></label>',foot:'<button class="btn ghost" data-x2>Annuler</button><button class="btn pri" data-ok>'+ICON('send','sm')+'Envoyer</button>'});
  $('[data-x2]',sh).onclick=function(){sh.close()};$('[data-ok]',sh).onclick=function(){var t=$('[data-tx]',sh).value.trim();if(!t){P.toast('Écrivez votre message.',{icon:'alert'});return}send(t);sh.close()};return sh}

/* ---------- 1. Accueil ---------- */
LV['adh-accueil']=function(el,ctx){var me=lvMe(),first=lvFirst(),mine=lvMine(),n=mine[0],hs=lvHorses(),h0=hs[0],dueV=lvDue(),ts=lvContracts().filter(lvMustSign),wx=lvWx(),B=[];
  B.push('<div class="ad-quick w4" data-b="quick">'+[['adh-reserver','calendar_add','Réserver',mine.length?mine.length+' reprise'+(mine.length>1?'s':'')+' par semaine':'Choisir une reprise',0,'cavaliers'],['adh-paiements','card','Payer',dueV?F.eur(dueV)+' à régler':'Tout est réglé',0,'argent'],['adh-contrats','sign','Signer',ts.length?ts.length+' document'+(ts.length>1?'s':'')+' en attente':'Tout est signé',ts.length,'plateforme'],['adh-messages','chat','Messages','Écrire au club',0,'equipe']].map(function(q){
    return '<button class="ad-q" data-go="'+q[0]+'"><span class="ico d-'+q[5]+'">'+ICON(q[1])+(q[4]?'<em>'+q[4]+'</em>':'')+'</span><span class="grow" style="min-width:0"><b>'+q[2]+'</b><small>'+q[3]+'</small></span></button>'}).join('')+'</div>');
  if(n){var l=n.l,who=n.who[0],h=l.horses&&l.horses[who]&&D.horse(l.horses[who]),w=wx&&wx[Math.min(6,n.off)],kid=who!==me.id,mn=n.off*1440+lvMin(l.start)-lvNow();
   B.push('<div class="card navy ad-next w2" data-b="next"><div class="glow"></div><div class="hrow sp" style="position:relative"><span class="eyebrow">Prochaine reprise'+(kid?' de '+lvEsc((D.member(who)||{}).first||''):'')+'</span><span class="ad-cd">'+ICON('clock','sm')+(n.off===0?'Dans '+dur(Math.max(1,mn)):n.off===1?'Demain':'Dans '+n.off+' jours')+'</span></div>'+
    '<div style="position:relative"><h2>'+lvEsc(l.title)+'</h2><div class="wh">'+cap(F.dateL(D.day(n.off)))+' · '+hm(l.start)+' à '+hm(endT(l))+(arena(l)?' · '+lvEsc(arena(l)):'')+'</div></div>'+
    '<div class="ad-ng"><div>'+(h?U.hav(h):'<span class="wi">'+ICON('horse')+'</span>')+'<div class="grow" style="min-width:0"><div class="k">Monture</div><div class="v ellip">'+(h?lvEsc(h.name):'Attribuée par le club')+'</div></div></div>'+
    (l.coach?'<div>'+U.av(l.coach)+'<div class="grow" style="min-width:0"><div class="k">'+lvEsc(((D.staffer(l.coach)||D.coach(l.coach)||{}).role)||'Enseignant')+'</div><div class="v ellip">'+lvEsc(D.name(l.coach))+'</div></div></div>':'')+
    (w?'<div><span class="wi">'+ICON(w.i)+'</span><div class="grow" style="min-width:0"><div class="k">Météo</div><div class="v">'+w.t+' °C, '+(w.r>50?'pluie':w.r>15?'nuageux':'temps sec')+'</div></div></div>':'<div><span class="wi">'+ICON('members')+'</span><div class="grow" style="min-width:0"><div class="k">Reprise</div><div class="v">'+lvRidersTxt(l)+'</div></div></div>')+'</div>'+
    '<div class="hrow wrap acts" style="--g:8px;margin-top:auto"><button class="btn ad-nb on" data-les>Voir la séance</button><button class="btn ad-nb" data-go="adh-reserver">Toutes mes réservations'+ICON('arrow','sm')+'</button></div></div>')}
  else B.push('<div class="card w2" data-b="next">'+U.empty('planning','Aucune reprise réservée','Choisissez un créneau : votre place est enregistrée tout de suite auprès du club.','<button class="btn pri" data-go="adh-reserver">Réserver une reprise</button>')+'</div>');
  if(h0){var nc=lvNextCare(h0);
   B.push('<div class="card tint d-chevaux ad-t w2" data-b="horse"><div class="ad-tt">'+lvIco('horse','chevaux')+'<h3>'+lvEsc(h0.name)+'</h3>'+lvLk('adh-cheval','Sa fiche')+'</div>'+
    '<div class="ad-row"><span class="sub grow"><b>'+(h0.box?'Au box '+lvEsc(h0.box)+'.':'Au club.')+'</b> '+(nc?'Prochain soin : '+lvEsc(nc.kind).toLowerCase()+' '+F.rel(nc.date)+'.':'Aucun soin prévu pour l’instant.')+'</span></div>'+
    '<div class="hrow wrap end" style="--g:8px">'+(nc?U.chip(ICON('care','sm')+lvEsc(nc.kind)+' · '+F.date(nc.date),'warn'):'')+(h0.status==='ok'||!h0.status?U.chip(ICON('heart','sm')+'En forme','ok'):U.chip(ICON('alert','sm')+'À surveiller','bad'))+(hs.length>1?U.chip('+'+(hs.length-1)+' autre'+(hs.length>2?'s':''),'d'):'')+'</div></div>')}
  var dl=lvDueL();
  B.push('<div class="card tint d-argent ad-t has-illu w1 pw2" data-b="money">'+ILLU.pieces({size:null,cls:'corner'})+'<div class="ad-tt">'+lvIco('wallet','argent')+'<h3>'+(dueV?'À régler':'Solde')+'</h3></div>'+
    (dueV?'<div><div class="big num"><span data-count="'+dueV+'" data-fmt="eur">'+F.eur(dueV)+'</span></div><div class="sub" style="margin-top:8px">'+dl.length+' facture'+(dl.length>1?'s':'')+' en attente'+(dl[0]&&dl[0].due?', échéance le '+F.date(dl[0].due):'')+'.</div></div>':'<div><div class="big num">0 €</div><div class="sub" style="margin-top:8px">Tout est réglé'+(first?'. Merci '+lvEsc(first)+'.':'.')+'</div></div>')+
    (dueV?'<div class="hrow end" style="--g:8px"><button class="btn pri grow" data-go="adh-paiements">'+ICON('card','sm')+'Payer '+F.eur(dueV)+'</button></div>':'<button class="btn block end" data-go="adh-paiements">Voir mes factures</button>')+'</div>');
  B.push('<div class="card ad-t w1 pw2" data-b="sign"><div class="ad-tt">'+lvIco('sign','plateforme')+'<h3>À signer</h3>'+(ts.length?'<span class="chip acc lg">'+ts.length+'</span>':'<span class="chip ok dot">À jour</span>')+'</div>'+
    (ts.length?'<div><div class="b" style="font-size:15.5px;line-height:1.3">'+lvEsc(ts[0].title)+'</div><div class="s mut" style="margin-top:4px">'+(ts[0].date?'Envoyé le '+F.date(ts[0].date):'')+'</div></div><button class="btn dark block end" data-sign="'+lvEsc(ts[0].id)+'">'+ICON('sign','sm')+'Signer au doigt</button>':
     '<div class="ad-row">'+sq('checkc','ok')+'<div class="grow"><div class="t">Aucun document en attente</div><div class="s">Retrouvez vos documents dans Contrats.</div></div></div><button class="btn block end" data-go="adh-contrats">Voir mes documents</button>')+'</div>');
  if(wx)B.push('<div class="card tint d-equipe ad-t w2" data-b="weather"><div class="ad-tt">'+lvIco(wx[0].i,'equipe')+'<h3>Météo du club</h3>'+(D.club.city?'<span class="s" style="opacity:.8">'+lvEsc(D.club.city)+'</span>':'')+'</div>'+
    '<div class="hrow" style="--g:14px;align-items:flex-end"><div class="big num">'+wx[0].t+'<small>°C</small></div><div class="sub" style="padding-bottom:6px">'+wx[0].r+' % de risque de pluie aujourd’hui</div></div>'+
    '<div class="ad-wx">'+wx.map(function(w,i){return '<div class="'+(i===0?'on':w.r>50?'rn':'')+'"><span>'+(i===0?'Auj.':w.d)+'</span>'+ICON(w.i)+'<b class="num">'+w.t+'°</b><span class="num" style="opacity:.75">'+w.r+' %</span></div>'}).join('')+'</div></div>');
  el.innerHTML='<div class="ad-ph">'+U.ph('Bonjour'+(first?' '+lvEsc(first):''),cap(F.dateL(D.day(0)))+' · '+(n?'prochaine reprise '+lvWhen(n.off)+' à '+hm(n.l.start)+'.':'bienvenue dans votre espace '+lvEsc(D.club.name)+'.'),'')+'</div><div class="ad-home rise">'+B.join('')+'</div>';
  var bl=$('[data-les]',el);if(bl)bl.onclick=function(){lvLessonSheet(n.l,n.off)};
  $$('[data-sign]',el).forEach(function(b){b.onclick=function(){var c=ts.filter(function(x){return String(x.id)===b.getAttribute('data-sign')})[0];if(c)lvSignSheet(c,P.rerender)}})};

/* ---------- 2. Réserver ---------- */
var LRS={day:0,who:null};
LV['adh-reserver']=function(el,ctx){var people=lvPeople(),who=LRS.who&&people.some(function(p){return p.id===LRS.who})?LRS.who:people[0].id,me=D.member(who)||lvMe();
  function dayLs(o){var d=D.day(o).getDay();return (D.lessons||[]).filter(function(l){return l.dow===d&&!/annul/i.test(l.status||'')&&!(o===0&&lvMin(l.start)+(+l.dur||60)<=lvNow())})}
  el.innerHTML='<div class="ad-ph">'+U.ph('Réserver',people.length>1?'Choisissez le cavalier, puis une reprise : la place est enregistrée tout de suite auprès du club.':'Choisissez une reprise : votre place est enregistrée tout de suite auprès du club.','')+'</div>'+
   (people.length>1?U.seg(people.map(function(p){return [p.id,lvEsc(p.first||lvNm(p))]}),who,'data-who'):'')+
   '<div class="ad-rsv" style="margin-top:4px"><div data-main style="min-width:0"></div><div data-side class="stack" style="--g:14px;margin-top:14px"></div></div>';
  $$('[data-who]',el).forEach(function(b){b.addEventListener('click',function(){LRS.who=b.getAttribute('data-who');P.rerender()})});
  function side(){var rs=lvMine();$('[data-side]',el).innerHTML='<div class="card"><div class="ch"><h3>Mes réservations</h3><span class="chip">'+rs.length+'</span></div><div style="padding:8px 0">'+
    (rs.length?rs.map(function(r,i){var l=r.l;return '<div class="ad-mine" data-r="'+i+'"><div class="ad-date g"><b>'+D.day(r.off).getDate()+'</b><span>'+DW[D.day(r.off).getDay()]+'</span></div><div class="grow"><div class="b s ellip">'+lvEsc(l.title)+'</div><div class="xs mut ellip">'+l.start+' · chaque '+DWL7(r.off)+(l.coach?' · '+lvEsc((D.person(l.coach)||{}).first||''):'')+'</div></div>'+ICON('right','sm')+'</div>'}).join(''):U.empty('planning','Rien de prévu','Choisissez un créneau dans le calendrier.'))+
    '</div><div class="cf"><button class="btn sm grow" data-go="lv-cal-adh">'+ICON('calendar_add','sm')+'Ajouter à mon agenda</button></div></div>'+
    '<div class="note">'+ICON('info','sm')+'<span>Une reprise réservée revient chaque semaine. Prévenez le club le plus tôt possible si vous ne pouvez pas venir : libérez votre place depuis « Mes réservations ».</span></div>';
   $$('[data-r]',el).forEach(function(x){x.onclick=function(){var r=rs[+x.getAttribute('data-r')];lvLessonSheet(r.l,r.off)}})}
  function main(){var m=$('[data-main]',el),h='<div class="ad-days scroll-x">'+Array.apply(null,Array(14)).map(function(_,o){var ls=dayLs(o),mine=ls.some(function(l){return (l.riders||[]).indexOf(who)>=0});
      return '<button class="ad-day'+(mine?' mine':'')+'" data-day="'+o+'" aria-selected="'+(o===LRS.day)+'" title="'+cap(lvWhen(o))+'"><span class="w">'+(o===0?'auj.':DW[D.day(o).getDay()])+'</span><span class="d">'+D.day(o).getDate()+'</span><span class="c">'+(ls.length?ls.length+' cr.':'·')+'</span></button>'}).join('')+'</div>';
    var list=dayLs(LRS.day).sort(function(a,b){return lvMin(a.start)-lvMin(b.start)});
    h+='<div class="hrow sp" style="margin:12px 0 10px"><h3 style="font-size:17px">'+cap(dayL(LRS.day))+'</h3><span class="s mut">'+list.length+' reprise'+(list.length>1?'s':'')+'</span></div>';
    h+='<div class="card">'+(list.length?list.map(function(l,i){var n=(l.riders||[]).length,left=l.cap-n,mine=(l.riders||[]).indexOf(who)>=0,w=Array.isArray(l.waitlist)&&l.waitlist.indexOf(who)>=0;
      return '<div class="ad-slot'+(mine?' mine':'')+'" style="--i:'+i+'"><div class="tm">'+l.start+'<small>'+l.dur+' min</small></div><div style="min-width:0"><div class="ti ellip">'+lvEsc(l.title)+'</div><div class="s mut ellip">'+[l.coach?lvEsc(D.name(l.coach)):'',lvEsc(arena(l)||'')].filter(Boolean).join(' · ')+'</div><div class="me">'+
        (mine?U.chip('Réservé','ok',true):left<=0?U.chip('Complet'+(Array.isArray(l.waitlist)&&l.waitlist.length?' · '+l.waitlist.length+' en attente':''),'bad',true):left===1?U.chip('Dernière place','warn',true):U.chip(left+' places','ok',true))+'<span style="width:64px">'+U.bar(l.cap?n/l.cap*100:0,left<=0?'var(--bad)':left===1?'var(--warn)':'var(--ok)')+'</span><span class="xs mut num">'+n+'/'+l.cap+'</span></div></div>'+
        '<div class="rt"><span class="pr"></span>'+(mine?'<button class="btn" data-see="'+lvEsc(l.id)+'">Voir</button>':w?'<button class="btn" data-unw="'+lvEsc(l.id)+'">En attente</button>':left<=0?'<button class="btn" data-wait="'+lvEsc(l.id)+'">'+ICON('waitlist','sm')+'Liste d’attente</button>':'<button class="btn dark" data-book="'+lvEsc(l.id)+'">Réserver</button>')+'</div></div>'}).join(''):
      U.empty('planning','Aucune reprise ce jour-là','Essayez un autre jour : les reprises du club apparaissent ici dès qu’elles sont au planning.'))+'</div>';
    m.innerHTML=h;
    $$('[data-day]',m).forEach(function(b){b.onclick=function(){LRS.day=+b.getAttribute('data-day');main()}});
    function L(id){return (D.lessons||[]).filter(function(l){return String(l.id)===id})[0]}
    $$('[data-book]',m).forEach(function(b){b.onclick=function(){lvBookSheet(L(b.getAttribute('data-book')),LRS.day,who,upd)}});
    $$('[data-see]',m).forEach(function(b){b.onclick=function(){lvLessonSheet(L(b.getAttribute('data-see')),LRS.day)}});
    $$('[data-wait]',m).forEach(function(b){b.onclick=function(){var l=L(b.getAttribute('data-wait'));l.waitlist=(Array.isArray(l.waitlist)?l.waitlist:[]).concat([who]);lvSave();upd();P.toast('Vous êtes '+l.waitlist.length+(l.waitlist.length>1?'e':'er')+' sur la liste d’attente. Le club vous prévient si une place se libère.',{icon:'waitlist'})}});
    $$('[data-unw]',m).forEach(function(b){b.onclick=function(){var l=L(b.getAttribute('data-unw'));l.waitlist=(l.waitlist||[]).filter(function(x){return x!==who});lvSave();upd();P.toast('Vous avez quitté la liste d’attente',{icon:'waitlist'})}})}
  function upd(){side();main()}
  upd()};

/* ---------- 3. Coachs ---------- */
LV['adh-coachs']=function(el,ctx){var me=lvMe(),cs=(D.coaches||[]),mineB=(D.coachBookings||[]).filter(function(b){return lvIds().indexOf(b.member)>=0||(b.riders||[]).some(function(r){return lvIds().indexOf(r)>=0})});
  el.innerHTML=U.ph('Coachs','Les coachs du club et les intervenants que vous pouvez réserver.','')+
   (mineB.length?'<div class="card" style="margin-bottom:16px"><div class="ch"><h3>Mes demandes</h3><span class="chip">'+mineB.length+'</span></div><div class="list">'+mineB.map(function(b){return '<div class="li">'+U.av(b.coach)+'<div class="grow"><div class="t">'+lvEsc(b.type||'Cours particulier')+' avec '+lvEsc(D.name(b.coach))+'</div><div class="s">'+lvEsc(b.slot||b.t||'')+'</div></div>'+U.chip(lvEsc(b.status||'demandée'),b.status==='confirmée'?'ok':'acc',true)+'</div>'}).join('')+'</div></div>':'')+
   (cs.length?'<div class="g3 rise">'+cs.map(function(c){return '<div class="card pad"><div class="hrow" style="--g:12px">'+U.av(c)+'<div class="grow" style="min-width:0"><div class="b ellip">'+lvEsc(lvNm(c))+'</div><div class="s mut ellip">'+lvEsc([c.spec,c.level].filter(Boolean).join(' · '))+'</div></div></div>'+
      (c.bio?'<p class="s" style="margin-top:12px;color:var(--ink-2)">'+lvEsc(c.bio)+'</p>':'')+'<div class="hrow sp" style="margin-top:14px">'+(c.rate?'<span class="b num">'+F.eur(c.rate)+' <span class="s mut">la séance</span></span>':'<span></span>')+'<button class="btn dark sm" data-cb="'+lvEsc(c.id)+'">Demander un cours</button></div></div>'}).join('')+'</div>':
    '<div class="card">'+U.empty('coach','Aucun coach pour l’instant','Le club n’a pas encore ajouté de coach réservable. Les moniteurs du club vous accueillent dans vos reprises.')+'</div>');
  $$('[data-cb]',el).forEach(function(b){b.onclick=function(){var c=D.coach(b.getAttribute('data-cb'))||cs.filter(function(x){return x.id===b.getAttribute('data-cb')})[0],slots=(c.slots||[]).filter(Boolean);
    var sh=P.sheet({title:'Cours avec '+lvNm(c),icon:'coach',body:(slots.length?'<div class="ad-lbl">Créneau souhaité</div>'+opts(slots.map(function(s){return [s,s,'Proposé par '+(c.first||'le coach')]}),slots[0],'slot'):'<p class="s mut">Ce coach n’a pas encore publié ses disponibilités : il vous propose un créneau en retour.</p>')+
      '<label class="lv-fl" style="margin-top:14px"><span>Précisions (facultatif)</span><input class="in" data-nt placeholder="Votre niveau, votre objectif, votre cheval"></label>',foot:'<button class="btn pri lg ad-full" data-ok>'+ICON('send','sm')+'Envoyer la demande</button>'});
    bindOpts(sh);$('[data-ok]',sh).onclick=function(){var s=slots.length?optVal(sh,'slot'):'',h=lvHorses()[0];
      D.coachBookings.push({id:lvUid('cb'),coach:c.id,member:me.id,who:lvNm(me),riders:[me.id],horse:h?h.id:null,horseName:h?h.name:'',slot:s,type:'Cours particulier',note:$('[data-nt]',sh).value.trim(),price:c.rate||0,status:'demandée',at:new Date().toISOString()});lvSave();
      sh.close();P.rerender();P.toast('Demande envoyée à '+(c.first||'votre coach')+'. Vous serez prévenu de sa réponse.',{icon:'send'})}}})};

/* ---------- 4. Mon cheval ---------- */
var LCH={id:null};
LV['adh-cheval']=function(el,ctx){var hs=lvHorses(),me=lvMe();
  if(!hs.length){el.innerHTML=U.ph('Mon cheval','Le suivi de votre cheval au quotidien.','')+'<div class="card">'+U.empty('horse','Aucun cheval relié à votre fiche','Propriétaire ou demi-pensionnaire ? Demandez au club de relier votre cheval à votre fiche : vous suivrez ici ses soins, sa ration et son carnet.','<button class="btn pri" data-wr>'+ICON('chat','sm')+'Écrire au club</button>')+'</div>';
   var w=$('[data-wr]',el);if(w)w.onclick=function(){lvWriteSheet('Écrire au club','Bonjour, pouvez-vous relier mon cheval à ma fiche ?',function(t){lvSend(t);P.toast('Message envoyé au club',{icon:'send'})})};return}
  var h=hs.filter(function(x){return x.id===(ctx.params.id||LCH.id)})[0]||hs[0];LCH.id=h.id;
  var t=D.iso(D.day(0)),care=lvCareOf(h),next=care.filter(function(c){return c.status!=='fait'&&String(c.date)>=t}),late=care.filter(function(c){return c.status!=='fait'&&String(c.date)<t}),past=care.filter(function(c){return c.status==='fait'}).reverse();
  var dueK=[['vacc','Vaccin',365],['worm','Vermifuge',90],['farrier','Maréchal',49]].map(function(k){var d=h[k[0]];if(!d)return null;var age=Math.round((D.day(0)-new Date(d+'T12:00:00'))/864e5);return {k:k[1],d:d,ok:age<=k[2]}}).filter(Boolean);
  var okN=dueK.filter(function(x){return x.ok}).length,wp=h.workMax?Math.round((+h.work||0)/h.workMax*100):0,jr=(D.journal||[]).filter(function(j){return j.horse===h.id}).slice().reverse();
  var role=h.owner&&lvIds().indexOf(h.owner)>=0?'Votre cheval':'En demi-pension';
  el.innerHTML=(hs.length>1?'<div style="margin-bottom:12px">'+U.seg(hs.map(function(x){return [x.id,lvEsc(x.name)]}),h.id,'data-hs')+'</div>':'')+
   '<div class="card tint d-chevaux ad-hh rise"><div class="ad-hhi">'+ILLU.cheval({size:null})+'</div><div class="ad-hht"><span class="eyebrow">'+role+(h.box?' · box '+lvEsc(h.box):'')+'</span><h1 class="ad-hn">'+lvEsc(h.name)+'</h1><div class="sub">'+lvEsc([h.breed,(h.sex||'').toLowerCase(),(h.coat||'').toLowerCase(),h.age?h.age+' ans':''].filter(Boolean).join(' · '))+'</div>'+
    '<div class="hrow wrap" style="--g:8px">'+(h.status==='ok'||!h.status?U.chip(ICON('heart','sm')+'En forme','ok'):U.chip(ICON('alert','sm')+'À surveiller','bad'))+(h.mood?U.chip(ICON('pulse','sm')+'Humeur : '+lvEsc(h.mood).toLowerCase(),'d'):'')+(next[0]?U.chip(ICON('care','sm')+lvEsc(next[0].kind)+' '+F.rel(next[0].date),'warn'):'')+'</div>'+
    '<div class="hrow wrap acts" style="--g:8px"><button class="btn pri" data-jr>'+ICON('edit','sm')+'Écrire dans son carnet</button><button class="btn" data-ask>'+ICON('chat','sm')+'Demander une prestation</button></div></div>'+
   '<div class="ad-hhr">'+rings([{p:wp,c:'var(--hz)'},{p:dueK.length?okN/dueK.length*100:0,c:'var(--acc)'},{p:(+h.bcs||0)/5*100,c:'var(--rd)'}],164)+'<div class="ad-hhl">'+
    [['var(--hz)','Travail sur 7 jours',(+h.work||0)+' h','sur '+(h.workMax||0)+' h conseillées'],['var(--acc)','Soins à jour',dueK.length?String(okN):'–',dueK.length?'sur '+dueK.length+' suivis':'dates à renseigner'],['var(--rd)','État corporel',h.bcs?String(h.bcs).replace('.',','):'–','sur 5']].map(function(x){return '<div><i style="background:'+x[0]+'"></i><span class="grow"><span class="k">'+x[1]+'</span><b class="num">'+x[2]+'</b> <span class="u">'+x[3]+'</span></span></div>'}).join('')+'</div></div></div>'+
   '<div class="g2" style="margin-top:16px;align-items:start"><div class="stack" style="--g:16px">'+
    '<div class="card"><div class="ch"><h3>Prochains soins</h3>'+(late.length?U.chip(late.length+' en retard','bad',true):'')+'</div>'+((late.concat(next)).length?'<div class="list">'+late.concat(next).map(function(c){return '<div class="li"><span class="ico sm">'+ICON('care','sm')+'</span><div class="grow"><div class="t">'+lvEsc(c.kind)+(c.who?' · '+lvEsc(c.who):'')+'</div><div class="s">'+F.date(c.date)+(c.time?' à '+lvEsc(c.time):'')+(c.note?' · '+lvEsc(c.note):'')+'</div></div>'+U.chip(String(c.date)<t?'En retard':cap(F.rel(c.date)),String(c.date)<t?'bad':'acc',true)+'</div>'}).join('')+'</div>':U.empty('care','Aucun soin prévu','Le club planifie ici le maréchal, les vaccins et les visites.'))+'</div>'+
    (dueK.length?'<div class="card"><div class="ch"><h3>Derniers soins connus</h3></div><div class="list">'+dueK.map(function(x){return '<div class="li"><div class="grow"><div class="t">'+x.k+'</div><div class="s">'+F.date(x.d)+' · '+F.rel(x.d)+'</div></div>'+U.chip(x.ok?'À jour':'À prévoir',x.ok?'ok':'warn',true)+'</div>'}).join('')+'</div></div>':'')+
    (h.ration?'<div class="card pad"><div class="eyebrow">Sa ration</div><div class="g3" style="margin-top:10px"><div><div class="big num" style="font-size:28px">'+(+h.ration.hay||0)+' kg</div><div class="s mut">Foin par jour</div></div><div><div class="big num" style="font-size:28px">'+String(+h.ration.grain||0).replace('.',',')+' kg</div><div class="s mut">Granulés</div></div><div><div class="b">'+lvEsc(h.ration.supp||'Aucun')+'</div><div class="s mut">Complément</div></div></div></div>':'')+
   '</div><div class="card"><div class="ch"><h3>Son carnet</h3><button class="btn sm" data-jr>'+ICON('plus','sm')+'Écrire</button></div>'+(jr.length?'<div class="list">'+jr.slice(0,12).map(function(j){return '<div class="li" style="align-items:flex-start">'+U.av(j.who)+'<div class="grow"><div class="t">'+lvEsc(D.name(j.who)||j.role||'Le club')+'<span class="s mut" style="font-weight:400"> · '+lvEsc(j.when||'')+'</span></div><div class="s" style="color:var(--ink-2);margin-top:2px">'+lvEsc(j.text)+'</div></div></div>'}).join('')+'</div>':U.empty('doc','Le carnet est vide','Notez une séance, une balade ou une observation : le club et l’équipe la lisent.'))+'</div></div>';
  $$('[data-hs]',el).forEach(function(b){b.addEventListener('click',function(){LCH.id=b.getAttribute('data-hs');P.rerender()})});
  $$('[data-jr]',el).forEach(function(b){b.onclick=function(){var sh=P.sheet({title:'Carnet de '+h.name,icon:'edit',body:'<div class="ad-lbl">Type</div>'+opts([['travail','Séance de travail','Plat, obstacle, longe'],['balade','Balade','Extérieur'],['soin','Observation','Santé, comportement, alimentation']],'travail','kind')+
      '<label class="lv-fl" style="margin-top:14px"><span>Ce qu’il faut retenir</span><textarea class="in" rows="4" data-tx style="height:auto;padding:12px" placeholder="Durée, exercices, ressenti"></textarea></label>',foot:'<button class="btn ghost" data-x2>Annuler</button><button class="btn pri" data-ok>'+ICON('check','sm')+'Enregistrer</button>'});
    bindOpts(sh);$('[data-x2]',sh).onclick=function(){sh.close()};
    $('[data-ok]',sh).onclick=function(){var tx=$('[data-tx]',sh).value.trim();if(!tx){P.toast('Écrivez quelques mots.',{icon:'alert'});return}
      D.journal.push({id:lvUid('jr'),horse:h.id,who:me.id,role:h.owner===me.id?'Propriétaire':'Demi-pensionnaire',when:'Aujourd’hui, '+lvHM(),date:D.iso(new Date()),text:tx,kind:optVal(sh,'kind')||'travail',mood:4});lvSave();sh.close();P.rerender();P.toast('Ajouté au carnet de '+h.name,{icon:'check'})}}});
  var ak=$('[data-ask]',el);if(ak)ak.onclick=function(){lvWriteSheet('Demander une prestation','Par exemple : une sortie au paddock, une couverture, une douche…',function(tx){lvSend('Pour '+h.name+' : '+tx);P.toast('Demande envoyée au club',{icon:'send'})})}};

/* ---------- 5. Demi-pension ---------- */
LV['adh-demipension']=function(el,ctx){var ids=lvIds(),mine=(D.halfboard||[]).filter(function(d){return ids.indexOf(d.rider)>=0||lvHorses().some(function(h){return h.id===d.horse})}),offers=(D.halfboardOffers||[]);
  el.innerHTML=U.ph('Demi-pension','Partager un cheval quelques jours par semaine, encadré par le club.','')+
   (mine.length?'<div class="g2 rise" style="margin-bottom:16px">'+mine.map(function(d){var h=D.horse(d.horse)||{name:'Cheval'};return '<div class="card tint d-chevaux pad"><div class="hrow" style="--g:12px">'+U.hav(h)+'<div class="grow"><div class="b">'+lvEsc(h.name)+'</div><div class="s mut">'+(ids.indexOf(d.rider)>=0?'Votre demi-pension':'Demi-pensionnaire : '+lvEsc(D.name(d.rider)))+'</div></div>'+U.chip(lvEsc(d.status||'Actif'),'ok',true)+'</div>'+
     '<div class="hrow wrap" style="--g:8px;margin-top:12px">'+(Array.isArray(d.days)&&d.days.length?U.chip(ICON('calendar_add','sm')+lvEsc(d.days.join(', ')),'d'):'')+(d.price?U.chip(F.eur(d.price)+' par mois','line'):'')+(d.since?U.chip('Depuis le '+F.date(d.since),'line'):'')+'</div></div>'}).join('')+'</div>':'')+
   '<div class="card"><div class="ch"><h3>Chevaux proposés en demi-pension</h3><span class="chip">'+offers.length+'</span></div>'+(offers.length?'<div class="list">'+offers.map(function(o){var h=D.horse(o.horse)||{name:o.name||'Cheval'};return '<div class="li">'+U.hav(h)+'<div class="grow"><div class="t">'+lvEsc(h.name)+'</div><div class="s">'+lvEsc([o.days,o.level,o.price?F.eur(o.price)+' par mois':''].filter(Boolean).join(' · '))+'</div>'+(o.note?'<div class="xs mut" style="margin-top:2px">'+lvEsc(o.note)+'</div>':'')+'</div><button class="btn sm dark" data-of="'+lvEsc(o.id)+'">Je suis intéressé</button></div>'}).join('')+'</div>':
    U.empty('swap','Aucune demi-pension proposée en ce moment','Le club publie ici les chevaux disponibles. Vous pouvez aussi lui écrire pour signaler votre intérêt.','<button class="btn" data-wr>'+ICON('chat','sm')+'Écrire au club</button>'))+'</div>';
  $$('[data-of]',el).forEach(function(b){b.onclick=function(){var o=offers.filter(function(x){return String(x.id)===b.getAttribute('data-of')})[0],h=D.horse(o.horse)||{name:'ce cheval'};lvSend('Je suis intéressé par la demi-pension de '+h.name+'.');b.disabled=true;b.textContent='Demande envoyée';P.toast('Le club a reçu votre demande pour '+h.name,{icon:'send'})}});
  var w=$('[data-wr]',el);if(w)w.onclick=function(){lvWriteSheet('Écrire au club','Je cherche une demi-pension…',function(t){lvSend(t);P.toast('Message envoyé au club',{icon:'send'})})}};

/* ---------- 6. Concours ---------- */
LV['adh-concours']=function(el,ctx){var ids=lvIds(),t=D.iso(D.day(0)),comps=(D.competitions||[]).filter(function(c){return String(c.date)>=t}).sort(function(a,b){return String(a.date).localeCompare(String(b.date))}),ent=(D.entries||[]).filter(function(e){return ids.indexOf(e.rider)>=0});
  el.innerHTML=U.ph('Concours','Les concours du club et vos engagements.','')+
   (comps.length?'<div class="stack rise" style="--g:14px">'+comps.map(function(c){var my=ent.filter(function(e){return e.comp===c.id}),open=!c.closes||String(c.closes)>=t;
    return '<div class="card pad"><div class="hrow" style="--g:14px;align-items:flex-start"><div class="ad-date"><b>'+new Date(c.date+'T12:00:00').getDate()+'</b><span>'+F.date(c.date).split(' ')[1]+'</span></div><div class="grow" style="min-width:0"><div class="b" style="font-size:16px">'+lvEsc(c.name)+'</div><div class="s mut">'+lvEsc([c.place,c.disc,c.level].filter(Boolean).join(' · '))+'</div>'+
     '<div class="hrow wrap" style="--g:6px;margin-top:8px">'+(my.length?my.map(function(e){return U.chip(lvEsc(D.name(e.rider)||'')+(e.status&&e.status!=='confirmé'?' · '+lvEsc(e.status):' · engagé'),e.status==='demandé'?'acc':'ok',true)}).join(''):'')+(c.closes?U.chip('Clôture '+F.rel(c.closes),open?'line':'bad'):'')+'</div></div>'+
     (open?'<button class="btn '+(my.length?'':'dark')+' sm" data-en="'+lvEsc(c.id)+'">'+(my.length?'Ajouter':'Demander un engagement')+'</button>':'')+'</div></div>'}).join('')+'</div>':
    '<div class="card">'+U.empty('trophy','Aucun concours prévu','Le club publie ici ses sorties en concours. Vous pourrez demander votre engagement en un geste.')+'</div>');
  $$('[data-en]',el).forEach(function(b){b.onclick=function(){var c=comps.filter(function(x){return String(x.id)===b.getAttribute('data-en')})[0],people=lvPeople(),hs=lvHorses();
    var sh=P.sheet({title:'Demander un engagement',icon:'trophy',body:'<div class="card soft" style="padding:14px"><div class="b">'+lvEsc(c.name)+'</div><div class="s mut">'+F.dateL(c.date)+(c.place?' · '+lvEsc(c.place):'')+'</div></div>'+
      '<div class="ad-lbl">Cavalier</div>'+opts(people.map(function(p){return [p.id,lvEsc(lvNm(p)),p.galop?'Galop '+p.galop:'',U.av(p)]}),people[0].id,'who')+
      '<div class="ad-lbl">Monture</div>'+opts(hs.map(function(h){return [h.id,lvEsc(h.name),'Votre cheval',U.hav(h)]}).concat([['club','Un cheval du club','Proposé par le moniteur',sq('horse')]]),hs[0]?hs[0].id:'club','horse')+
      '<label class="lv-fl" style="margin-top:14px"><span>Épreuve souhaitée</span><input class="in" data-cl placeholder="'+lvEsc(c.level||'Club 2')+'"></label>',foot:'<button class="btn pri lg ad-full" data-ok>'+ICON('send','sm')+'Envoyer la demande</button>'});
    bindOpts(sh);$('[data-ok]',sh).onclick=function(){var hv=optVal(sh,'horse');D.entries.push({id:lvUid('en'),comp:c.id,rider:optVal(sh,'who'),horse:hv==='club'?null:hv,class:$('[data-cl]',sh).value.trim(),status:'demandé',at:new Date().toISOString()});lvSave();sh.close();P.rerender();P.toast('Demande d’engagement envoyée au club',{icon:'trophy'})}}})};

/* ---------- 7. Progression ---------- */
LV['adh-progression']=function(el,ctx){var people=lvPeople(),mine=lvMine();
  el.innerHTML=U.ph('Progression','Votre galop et votre rythme de pratique, d’après vos reprises au club.','')+
   '<div class="g2 rise">'+people.map(function(p){var ls=mine.filter(function(r){return r.who.indexOf(p.id)>=0}),hrs=ls.reduce(function(a,r){return a+(+r.l.dur||60)},0)/60,g=+p.galop||0;
    return '<div class="card tint d-acc ad-t"><div class="ad-tt">'+lvIco('trend','acc')+'<h3>'+lvEsc(lvNm(p))+'</h3></div><div class="hrow ad-pgr" style="--g:14px">'+ringSVG(g/7*100,84,10,'var(--acc)','<b>'+g+'</b><small>/7</small>')+'<div class="grow" style="min-width:0"><div class="b" style="font-size:16px;line-height:1.25">'+(g?'Galop '+g+' validé':'Premiers pas à cheval')+'</div><div class="s mut" style="margin-top:4px">'+(g<7?'Prochain objectif : Galop '+(g+1):'Dernier galop fédéral atteint')+'</div></div></div>'+
     '<div class="end"><div class="s">'+(ls.length?ls.length+' reprise'+(ls.length>1?'s':'')+' par semaine, soit '+String(Math.round(hrs*10)/10).replace('.',',')+' h en selle':'Aucune reprise réservée pour l’instant')+'</div>'+(p.licence||p.lic?'<div class="xs mut" style="margin-top:4px">Licence FFE '+lvEsc(p.licence||p.lic)+'</div>':'')+'</div></div>'}).join('')+'</div>'+
   (mine.length?'':'<div class="hrow" style="justify-content:center;margin-top:18px"><button class="btn pri" data-go="adh-reserver">'+ICON('calendar_add','sm')+'Réserver une reprise</button></div>')};

/* ---------- 9. Contrats ---------- */
LV['adh-contrats']=function(el,ctx){var all=lvContracts(),todo=all.filter(lvMustSign),rest=all.filter(function(c){return !lvMustSign(c)});
  el.innerHTML=U.ph('Contrats','Vos contrats et autorisations, à signer au doigt depuis votre téléphone.','')+
   (todo.length?'<div class="card" style="margin-bottom:16px"><div class="ch"><h3>À signer</h3><span class="chip acc">'+todo.length+'</span></div><div class="list">'+todo.map(function(c){return '<div class="li ad-tap" data-ct="'+lvEsc(c.id)+'">'+sq('sign','acc')+'<div class="grow"><div class="t">'+lvEsc(c.title)+'</div><div class="s">'+lvEsc([c.horse&&D.horse(c.horse)?D.horse(c.horse).name:'',c.date?'Envoyé le '+F.date(c.date):''].filter(Boolean).join(' · '))+'</div></div><button class="btn dark sm">'+ICON('sign','sm')+'Signer</button></div>'}).join('')+'</div></div>':'')+
   '<div class="card"><div class="ch"><h3>Mes documents</h3></div>'+(rest.length?'<div class="list">'+rest.map(function(c){return '<div class="li ad-tap" data-ct="'+lvEsc(c.id)+'">'+sq('doc')+'<div class="grow"><div class="t">'+lvEsc(c.title)+'</div><div class="s">'+lvEsc([c.date?F.date(c.date):'',c.amount?F.eur(c.amount):''].filter(Boolean).join(' · '))+'</div></div>'+U.status(c.status||'signé')+'</div>'}).join('')+'</div>':U.empty('contract',todo.length?'Aucun autre document':'Aucun document pour l’instant','Les contrats et autorisations que le club vous envoie apparaîtront ici.'))+'</div>';
  $$('[data-ct]',el).forEach(function(r){r.onclick=function(){var c=all.filter(function(x){return String(x.id)===r.getAttribute('data-ct')})[0];if(c)lvSignSheet(c,P.rerender)}})};

/* ---------- 10. Messages ---------- */
LV['adh-messages']=function(el,ctx){var me=lvMe(),th=(D.threads||[]);
  el.innerHTML=U.ph('Messages','Vos échanges avec le club.','<button class="btn pri" data-new>'+ICON('edit','sm')+'Écrire au club</button>')+
   '<div class="card">'+(th.length?'<div class="list">'+th.map(function(t){return '<div class="li ad-tap" data-th="'+lvEsc(t.id)+'">'+sq('chat','acc')+'<div class="grow" style="min-width:0"><div class="t">'+lvEsc(t.with===me.id?D.club.name:(t.title||D.club.name))+'</div><div class="s ellip">'+lvEsc(t.last||'')+'</div></div><span class="xs mut">'+lvEsc(t.when||'')+'</span></div>'}).join('')+'</div>':
    U.empty('chat','Aucun message','Une question sur une reprise, une facture ou votre cheval ? Écrivez au club, la réponse arrive ici.','<button class="btn pri" data-new2>'+ICON('edit','sm')+'Écrire au club</button>'))+'</div>';
  function write(){lvWriteSheet('Écrire au club','Bonjour,',function(t){lvSend(t);P.rerender();P.toast('Message envoyé au club',{icon:'send'})})}
  $$('[data-new],[data-new2]',el).forEach(function(b){b.onclick=write});
  $$('[data-th]',el).forEach(function(r){r.onclick=function(){var t=th.filter(function(x){return String(x.id)===r.getAttribute('data-th')})[0];if(!t)return;var ms=Array.isArray(t.msgs)?t.msgs:[{w:'club',t:t.when,x:t.last}];
    var sh=P.sheet({title:t.with===me.id?D.club.name:t.title,icon:'chat',body:'<div class="stack" style="--g:10px">'+ms.map(function(m){var mine=m.w===me.id;return '<div class="card '+(mine?'tint d-acc':'soft')+'" style="padding:12px 14px;max-width:85%;'+(mine?'margin-left:auto':'')+'"><div class="s">'+lvEsc(m.x)+'</div><div class="xs mut" style="margin-top:4px">'+(mine?'Vous':lvEsc(D.name(m.w)||'Le club'))+(m.t?' · '+lvEsc(m.t):'')+'</div></div>'}).join('')+'</div>',
      foot:'<input class="in" data-rp placeholder="Votre réponse" style="flex:1"><button class="btn pri" data-ok>'+ICON('send','sm')+'Envoyer</button>'});
    $('[data-ok]',sh).onclick=function(){var x=$('[data-rp]',sh).value.trim();if(!x)return;lvSend(x);sh.close();P.rerender();P.toast('Message envoyé',{icon:'send'})}}})};

/* ---------- 11. Profil ---------- */
LV['adh-profil']=function(el,ctx){var me=lvMe(),people=lvPeople(),u=(window.PL&&PL.user)||{},isM=!!D.member(me.id);
  el.innerHTML=U.ph('Profil','Vos coordonnées et votre famille au club.','')+
   '<div class="g2 rise" style="align-items:start"><div class="card pad"><div class="hrow" style="--g:14px">'+U.av(me)+'<div class="grow"><div class="b" style="font-size:18px">'+lvEsc(lvNm(me)||u.email||'')+'</div><div class="s mut">'+lvEsc([me.galop?'Galop '+me.galop:'',me.licence||me.lic?'Licence '+(me.licence||me.lic):''].filter(Boolean).join(' · ')||D.club.name)+'</div></div></div>'+
    (isM?'<div class="lv-f" style="margin-top:16px"><label class="lv-fl"><span>Téléphone</span><input class="in" data-f="phone" inputmode="tel" value="'+lvEsc(me.phone||'')+'"></label><label class="lv-fl"><span>Adresse e-mail</span><input class="in" data-f="email" type="email" value="'+lvEsc(me.email||u.email||'')+'"></label>'+
     '<label class="lv-fl"><span>Personne à prévenir en cas d’urgence</span><input class="in" data-f="emergency" value="'+lvEsc(me.emergency||'')+'"></label><label class="lv-fl"><span>Son téléphone</span><input class="in" data-f="emergencyPhone" inputmode="tel" value="'+lvEsc(me.emergencyPhone||'')+'"></label>'+
     '<label class="lv-fl"><span>Allergies ou informations médicales utiles</span><input class="in" data-f="allergies" value="'+lvEsc(me.allergies||'')+'"></label></div><button class="btn pri" data-save style="margin-top:14px">'+ICON('check','sm')+'Enregistrer</button>':'<p class="lv-note" style="margin-top:14px">Votre fiche n’est pas encore reliée par le club : vos coordonnées s’afficheront ici.</p>')+'</div>'+
    '<div class="stack" style="--g:16px"><div class="card"><div class="ch"><h3>Ma famille au club</h3></div><div class="list">'+people.map(function(p){return '<div class="li">'+U.av(p)+'<div class="grow"><div class="t">'+lvEsc(lvNm(p))+(p.id===me.id?' <span class="s mut">(vous)</span>':'')+'</div><div class="s">'+lvEsc([p.age?p.age+' ans':'',p.galop?'Galop '+p.galop:''].filter(Boolean).join(' · '))+'</div></div></div>'}).join('')+'</div></div>'+
    '<div class="card"><div class="list"><button class="li ad-tap" data-acct style="width:100%;text-align:left">'+sq('user')+'<div class="grow"><div class="t">Mon compte</div><div class="s">Mot de passe, apparence, déconnexion</div></div>'+ICON('right','sm')+'</button><button class="li ad-tap" data-go="lv-cal-adh" style="width:100%;text-align:left">'+sq('calendar_add')+'<div class="grow"><div class="t">Mes reprises dans mon agenda</div><div class="s">Google Agenda, Apple Calendrier, Outlook</div></div>'+ICON('right','sm')+'</button></div></div></div></div>';
  var s=$('[data-save]',el);if(s)s.onclick=function(){var m=D.member(me.id);$$('[data-f]',el).forEach(function(i){m[i.getAttribute('data-f')]=i.value.trim()});lvSave();P.toast('Coordonnées enregistrées',{icon:'check'})};
  var a=$('[data-acct]',el);if(a)a.onclick=function(){if(window.PL&&PL.account)PL.account()}};

/* ---------- Mon arrivée ---------- */
LV['adh-bienvenue']=function(el,ctx){var me=lvMe(),first=lvFirst(),ts=lvContracts().filter(lvMustSign),mine=lvMine(),cal=P.mods['lv-cal-adh'];
  var steps=[['user','Vérifier mes coordonnées','Téléphone et personne à prévenir','adh-profil',!!(me.phone&&me.emergency)],['sign','Signer mes documents',ts.length?ts.length+' en attente':'Rien à signer','adh-contrats',!ts.length],['calendar_add','Réserver ma première reprise',mine.length?'C’est fait':'Choisir un créneau','adh-reserver',!!mine.length],['card','Consulter mes factures','Payer en ligne ou à l’accueil','adh-paiements',!lvDue()]];
  if(cal)steps.push(['calendar_add','Ajouter mes reprises à mon agenda','Google Agenda, Apple, Outlook','lv-cal-adh',false]);
  var done=steps.filter(function(s){return s[4]}).length;
  el.innerHTML=U.ph('Bienvenue'+(first?' '+lvEsc(first):''),'Votre espace '+lvEsc(D.club.name)+' : réservations, factures, documents et messages au même endroit.','')+
   '<div class="card tint d-acc pad" style="margin-bottom:16px"><div class="eyebrow">Pour bien démarrer</div><div class="big num" style="margin:8px 0">'+done+'<small> / '+steps.length+'</small></div>'+U.bar(done/steps.length*100,'var(--acc)')+'</div>'+
   '<div class="card"><div class="list">'+steps.map(function(s){return '<button class="li ad-tap" data-go="'+s[3]+'" style="width:100%;text-align:left">'+sq(s[4]?'checkc':s[0],s[4]?'ok':'acc')+'<div class="grow"><div class="t">'+s[1]+'</div><div class="s">'+s[2]+'</div></div>'+ICON('right','sm')+'</button>'}).join('')+'</div></div>'};

/* ---------- Boutique ---------- */
LV['adh-boutique']=function(el,ctx){var it=(D.shopItems||[]).filter(function(x){return x&&x.name&&x.active!==false});
  el.innerHTML=U.ph('Boutique','Les cartes, stages et articles proposés par le club.','')+
   (it.length?'<div class="g3 rise">'+it.map(function(x){return '<div class="card pad"><div class="hrow" style="--g:12px">'+sq(x.icon||'bag','acc')+'<div class="grow" style="min-width:0"><div class="b ellip">'+lvEsc(x.name)+'</div><div class="s mut">'+lvEsc(x.cat||'')+'</div></div></div><div class="hrow sp" style="margin-top:14px"><span class="b num">'+F.eur(+x.price||0)+'</span><button class="btn dark sm" data-bq="'+lvEsc(x.id)+'">Commander</button></div></div>'}).join('')+'</div>':
    '<div class="card">'+U.empty('shop','La boutique du club est vide','Le club n’a pas encore mis d’article en vente. Les cartes de séances et les stages apparaîtront ici.')+'</div>');
  $$('[data-bq]',el).forEach(function(b){b.onclick=function(){var x=it.filter(function(y){return String(y.id)===b.getAttribute('data-bq')})[0];lvSend('Je souhaite commander : '+x.name+' ('+F.eur(+x.price||0)+').');b.disabled=true;b.textContent='Demande envoyée';P.toast('Commande transmise au club : la facture suivra',{icon:'bag'})}})};

/* ---------- Pastilles du menu ---------- */
LVB['adh-paiements']=function(){var d=lvDue();return d>0?{v:F.eur(d),hot:true}:null};
LVB['adh-contrats']=function(){var n=lvContracts().filter(lvMustSign).length;return n?{v:n,hot:true}:null};
['adh-demipension','adh-concours','adh-messages','adh-boutique','adh-reserver','adh-coachs','adh-cheval','adh-accueil','adh-progression','adh-profil'].forEach(function(k){LVB[k]=function(){return null}});

if(!DEMO){
  Object.keys(LV).forEach(function(id){var m=P.mods[id];if(!m)return;m.render=lvSafe(id,LV[id]);m.__lv=true});
  Object.keys(LVB).forEach(function(id){var m=P.mods[id];if(m)m.badge=LVB[id]});
  if(P.mods['adh-cheval']){P.mods['adh-cheval'].short='Cheval';P.mods['adh-cheval'].phoneTitle='Mon cheval'}
  if(P.mods['adh-accueil'])P.mods['adh-accueil'].phoneTitle='Bonjour';
  /* palette ⌘K, assistant et visite : seulement ce qui marche avec les vraies données */
  for(var ai=P.actions.length-1;ai>=0;ai--)if(P.actions[ai].role==='adherent')P.actions.splice(ai,1);
  P.actions.push({role:'adherent',label:'Réserver une reprise',icon:'calendar_add',run:function(){P.go('adh-reserver')}},{role:'adherent',label:'Payer mes factures',icon:'card',run:function(){P.go('adh-paiements')}},
    {role:'adherent',label:'Signer mes documents',icon:'sign',run:function(){P.go('adh-contrats')}},{role:'adherent',label:'Écrire au club',icon:'chat',run:function(){P.go('adh-messages')}});
  for(var bi=P.brain.length-1;bi>=0;bi--)if(P.brain[bi].role==='adherent')P.brain.splice(bi,1);
  for(var ti=P.tourSteps.length-1;ti>=0;ti--)if(/^adh-/.test(P.tourSteps[ti].route||''))P.tourSteps.splice(ti,1);
  if(P.suggestions&&P.suggestions.adherent)P.suggestions.adherent.length=0;
}

Object.keys(P.mods).forEach(function(k){var m=P.mods[k];if(!(m.role==='adherent')||m.__sf)return;m.__sf=1;var r=m.render;m.render=function(el,ctx){var o=r.apply(this,arguments);try{adSegs(el)}catch(e){}return o}});

})();
