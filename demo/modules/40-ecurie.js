/* =====================================================================
   PIAFFE · Lot C · Vue gérant : plan 3D de l'écurie, caméras et capteurs,
   entretien et stocks. Écrans : ecurie3d, cameras, entretien.
   ===================================================================== */
(function(){
var D=P.D,F=P.fmt,U=P.ui,C=P.chart,E=F.esc;
function pad(n){return (n<10?'0':'')+n}
function svg(d,k){return '<svg class="i'+(k?' '+k:'')+'" viewBox="0 0 24 24" aria-hidden="true">'+d+'</svg>'}
/* icônes absentes du jeu commun, même grille 24 et même trait */
var IC={
 target:function(k){return svg('<circle cx="12" cy="12" r="6.500"/><circle cx="12" cy="12" r="1.500" class="f"/><path d="M12 2.500v3M12 18.500v3M2.500 12h3M18.500 12h3"/>',k)},
 top:function(k){return svg('<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M4 10h16M10 10v10"/>',k)},
 persp:function(k){return svg('<path d="M12 3.500l8 4.200v8.600l-8 4.200-8-4.200V7.700z"/><path d="M4 7.700l8 4.300 8-4.300M12 12v8.500"/>',k)},
 move:function(k){return svg('<path d="M12 3v18M3 12h18M12 3l-2.500 2.500M12 3l2.500 2.500M12 21l-2.500-2.500M12 21l2.500-2.500M3 12l2.500-2.500M3 12l2.500 2.500M21 12l-2.500-2.500M21 12l-2.500 2.500"/>',k)},
 door:function(k){return svg('<path d="M6 21V5.500A1.500 1.500 0 0 1 7.500 4h9A1.500 1.500 0 0 1 18 5.500V21M3.500 21h17"/><circle cx="14.500" cy="12.500" r=".9" class="f"/>',k)},
 night:function(k){return svg('<circle cx="12" cy="12" r="3.200"/><path d="M2.500 12c2.400-4.300 5.600-6.500 9.500-6.500s7.100 2.200 9.500 6.500c-2.400 4.300-5.600 6.500-9.500 6.500S4.900 16.300 2.500 12z"/>',k)},
 sprinkler:function(k){return svg('<path d="M12 21v-7M9 21h6M12 14c0-3 2-5 5-5.500M12 14c0-3-2-5-5-5.500M12 13V6.500"/><path d="M5 5.500h.01M8.500 3.500h.01M12 3h.01M15.500 3.500h.01M19 5.500h.01" class="a"/>',k)},
 harrow:function(k){return svg('<path d="M3.500 8h17M5 8v3.500M9.700 8v3.500M14.300 8v3.500M19 8v3.500M12 8V4"/><path d="M3.500 16c2-1.300 3.700-1.300 5.700 0s3.700 1.300 5.600 0 3.700-1.300 5.700 0M3.500 20c2-1.300 3.700-1.300 5.700 0s3.700 1.300 5.600 0 3.700-1.300 5.700 0" class="a"/>',k)}
};

/* ---------- Cohérence des données ---------- */
/* Le cheval du box B23 (h23) s’appelle Xanthos dans les données de base : aucun échange de noms ici. */

/* ---------- Données propres au lot ---------- */
/* 44 chevaux dans D.horses (B01 à B44) : plus de pensionnaires de passage fictifs, les boxes B45 et B46 sont libres.
   Un cheval de passage s’ajoute ici quand une demande de pension est installée dans un box libre. */
D.boxGuests=D.boxGuests||[];
D.boxRequests=D.boxRequests||[
 {id:'r1',name:'Kenzo du Lys',breed:'KWPN, hongre de 9 ans',owner:'Antoine Delmas',kind:'Pension travail',from:D.iso(D.day(1)),price:690},
 {id:'r2',name:'Indigo de Brière',breed:'Selle Français, jument de 7 ans',owner:'Camille Tessier',kind:'Pension complète',from:D.iso(D.day(4)),price:520},
 {id:'r3',name:'Jolie Môme',breed:'Connemara, jument de 12 ans',owner:'Famille Aubert',kind:'Pension pré et box',from:D.iso(D.day(14)),price:390}];

/* Caméras : scène simulée, type de zone (RGPD), partage */
var CAMX={
 cam1:{sc:'aisle',zone:'Écurie principale',kind:'Lieu de travail',mask:'Poste de pansage masqué',pos:[-10,0],dir:0,rng:21,fov:.5,hy:4.7},
 cam2:{sc:'box',horse:'h23',lying:true,zone:'Écurie principale',kind:'Box',yaw:1.95,pos:[6,4],dir:2.4,rng:5,fov:1.6,share:['Propriétaire prévenu par SMS']},
 cam3:{sc:'box',horse:'h04',zone:'Écurie principale',kind:'Box',yaw:1.15,pos:[-22,-4],dir:.8,rng:5,fov:1.6},
 cam4:{sc:'box',horse:'h01',zone:'Écurie principale',kind:'Box',yaw:-1.25,pos:[-34,-4],dir:.8,rng:5,fov:1.6,owner:'m001'},
 cam5:{sc:'arena',zone:'Grand manège',kind:'Lieu de pratique',pos:[-21,-43],dir:.55,rng:34,fov:1.1},
 cam6:{sc:'paddock',zone:'Paddock des poneys',kind:'Extérieur',pos:[-43,-17],dir:2.5,rng:24,fov:1.2},
 cam7:{sc:'tack',zone:'Sellerie',kind:'Lieu de travail',mask:'Aucun poste fixe dans le champ',pos:[23,-5],dir:2.9,rng:12,fov:1.3},
 cam8:{sc:'gate',zone:'Portail et parking',kind:'Lieu ouvert au public',mask:'Voie publique masquée',pos:[31.4,47.6],dir:-.36,rng:26,fov:1.1}};
function camOf(id){var c=D.cameras.find(function(x){return x.id===id})||D.cameras[0];return Object.assign({n:D.cameras.indexOf(c)+1},c,CAMX[c.id]||{sc:'box'})}

D.camEvents=D.camEvents||[
 {id:'e1',cam:'cam2',t:'09:27',h:23.45,kind:'couche',sev:'bad',title:'Xanthos se couche pour la 4e fois depuis 6 h',sub:'Habituellement une fois par matinée. Risque de colique.',clip:'0 min 48',st:'à voir'},
 {id:'e2',cam:'cam2',t:'08:52',h:22.87,kind:'roule',sev:'bad',title:'Xanthos se roule 3 fois en 20 minutes',sub:'SMS envoyé à Antoine, qui a répondu en 2 minutes.',clip:'1 min 12',st:'traité'},
 {id:'e3',cam:'cam1',t:'07:05',h:21.08,kind:'routine',sev:'ok',title:'Distribution du matin terminée',sub:'24 boxes servis en 31 minutes.',clip:'0 min 30',st:'info'},
 {id:'e4',cam:'cam2',t:'03:40',h:17.67,kind:'agite',sev:'warn',title:'Agitation nocturne dans le box B23',sub:'47 minutes de mouvement entre 3 h et 4 h.',clip:'2 min 05',st:'à voir'},
 {id:'e5',cam:'cam3',t:'02:14',h:16.23,kind:'couche',sev:'ok',title:'Tornado couché 1 h 52, relevé sans difficulté',sub:'Sommeil normal malgré la boiterie.',clip:'0 min 40',st:'info'},
 {id:'e6',cam:'cam8',t:'23:48',h:13.8,kind:'porte',sev:'warn',title:'Portail resté ouvert 4 minutes après 23 h',sub:'Refermé à 23 h 52. Aucun passage détecté.',clip:'0 min 22',st:'traité'},
 {id:'e7',cam:'cam1',t:'22:31',h:12.52,kind:'porte',sev:'warn',title:'Porte du box B17 ouverte',sub:'Lucie l’a refermée à 22 h 36.',clip:'0 min 35',st:'traité'},
 {id:'e8',cam:'cam5',t:'Hier 18:40',h:8.67,kind:'seance',sev:'ok',title:'Séance d’Ulysse filmée, 45 minutes',sub:'Extrait partagé avec Léa Martin dans sa fiche.',clip:'3 min 00',st:'info'}];
var EVK={couche:['Couché longtemps','moon'],roule:['Se roule','rotate'],agite:['Agitation','pulse'],porte:['Porte ouverte','lock'],routine:['Routine','check'],seance:['Séance','video']};

D.alertRules=D.alertRules||[
 {id:'a1',name:'Cheval couché trop longtemps',src:'Caméras de box',icon:'moon',val:45,unit:'min',min:15,max:120,step:5,who:['s05','s01'],ch:['Notification','SMS la nuit'],on:true,last:'Déclenchée ce matin à 9 h 27 (B23)'},
 {id:'a2',name:'Roulades répétées, risque de colique',src:'Caméras de box',icon:'rotate',val:3,unit:'roulades en 30 min',min:2,max:6,step:1,who:['s05','s01'],ch:['Notification','SMS','Appel'],on:true,last:'Déclenchée ce matin à 8 h 52 (B23)'},
 {id:'a3',name:'Agitation nocturne',src:'Caméras de box',icon:'pulse',val:30,unit:'min entre 22 h et 6 h',min:10,max:90,step:5,who:['s01'],ch:['Résumé du matin'],on:true,last:'Déclenchée cette nuit à 3 h 40 (B23)'},
 {id:'a4',name:'Porte ou portail ouvert hors horaires',src:'Caméras et contacts de porte',icon:'lock',val:3,unit:'min après 22 h',min:1,max:15,step:1,who:['s06','s01'],ch:['Notification','SMS la nuit'],on:true,last:'Déclenchée hier à 23 h 48'},
 {id:'a5',name:'Baisse de consommation d’eau',src:'Abreuvoirs connectés',icon:'drop',val:30,unit:'% sur 12 h',min:10,max:60,step:5,who:['s05','s01'],ch:['Notification'],on:true,last:'Déclenchée hier à 21 h 10 (B23)'},
 {id:'a6',name:'Risque de gel des abreuvoirs',src:'Sondes de température',icon:'thermo',val:2,unit:'°C dans l’écurie',min:-2,max:6,step:1,who:['s05','s07'],ch:['Notification','SMS la nuit'],on:true,last:'Jamais déclenchée cet automne'},
 {id:'a7',name:'Silo à granulés bas',src:'Sonde de niveau',icon:'gauge',val:20,unit:'% restants',min:10,max:40,step:5,who:['s01'],ch:['Notification','Commande proposée'],on:true,last:'Jamais déclenchée ce mois-ci'},
 {id:'a8',name:'Clôture électrique faible',src:'Électrificateur connecté',icon:'bolt',val:4,unit:'kV',min:2,max:6,step:.5,who:['s07','s06'],ch:['Notification','SMS'],on:true,last:'Déclenchée le 2 novembre (branche tombée)'},
 {id:'a9',name:'Présence sur le parking la nuit',src:'Caméra du portail',icon:'car',val:22,unit:'h, jusqu’à 6 h',min:20,max:24,step:1,who:['s01'],ch:['SMS'],on:false,last:'En attente de l’autorisation préfectorale'}];

/* Capteurs : courbes sur 24 h (une mesure par heure, déterministe) */
function rng(seed){return function(){seed=(seed*16807)%2147483647;return (seed-1)/2147483646}}
function serie(fn,seed,nz,last){var r=rng(seed),a=[];for(var i=0;i<25;i++)a.push(+(fn(i/24)+(r()-.5)*nz).toFixed(2));if(last!=null)a[24]=last;return a}
var SENSX={
 z1:{icon:'drop',unit:'L / h',lab:'Débit moyen',v:serie(function(x){return x<.5?5.3+.4*Math.sin(x*16):5.3-(x-.5)*4.4},11,.3,3.1),thr:4,thrL:'Seuil bas',bat:82,where:'Box B23 · Xanthos',horse:'h23',rule:'a5',nf:1},
 z2:{icon:'thermo',unit:'°C',lab:'Température',v:serie(function(x){return 7.6+2.4*Math.sin((x-.05)*6.283)-1.2*x},23,.3,7.4),thr:2,thrL:'Risque de gel',bat:64,where:'Allée, à 2,20 m du sol',rule:'a6',nf:1},
 z3:{icon:'thermo',unit:'°C',lab:'Température',v:serie(function(x){return 14+.9*Math.sin((x-.1)*6.283)},37,.2,14.2),thr:8,thrL:'Cuirs en danger',bat:91,where:'Mur nord',nf:1},
 z4:{icon:'gauge',unit:'%',lab:'Niveau',v:serie(function(x){return 41.6-3.6*(x<.3?x*.6:x<.42?.18+(x-.3)*4:x<.85?.66+(x-.42)*.2:.75+(x-.85)*1.7)},5,.1,38),thr:20,thrL:'Commander',bat:77,where:'Silo de 6 tonnes',rule:'a7',nf:0},
 z5:{icon:'bolt',unit:'kV',lab:'Tension',v:serie(function(x){return 6.8+.15*Math.sin(x*20)},53,.18,6.8),thr:4,thrL:'Seuil bas',bat:100,where:'Prairie du bas, 640 m de ruban',rule:'a8',nf:1},
 z6:{icon:'pulse',unit:'bpm',lab:'Fréquence cardiaque',v:serie(function(x){return x<.12?48+x*260:x<.4?92+30*Math.sin(x*30):x<.7?128+34*Math.sin(x*26):x<.86?104-(x-.7)*180:64-(x-.86)*90},71,6,52),thr:null,bat:58,where:'Séance d’hier avec Maëlle, 52 min',horse:'h01',nf:0,labels:'seance'}};
function sensOf(id){var s=D.sensors.find(function(x){return x.id===id});return Object.assign({},s,SENSX[s.id]||{v:[1,1],icon:'sensor'})}
var H24=(function(){var a=[];for(var i=0;i<25;i++){var h=(10+i)%24;a.push(i%6===0?h+' h':'')}return a})();
/* petite courbe avec seuil */
function mini(v,o){o=o||{};var w=300,h=o.h||56,mx=Math.max.apply(null,v),mn=Math.min.apply(null,v);if(o.thr!=null){mn=Math.min(mn,o.thr);mx=Math.max(mx,o.thr)}var rg=(mx-mn)||1;mn-=rg*.12;mx+=rg*.12;rg=mx-mn;
  var X=function(i){return i/(v.length-1)*w},Y=function(y){return h-(y-mn)/rg*h};
  var d='M'+v.map(function(y,i){return X(i).toFixed(1)+' '+Y(y).toFixed(1)}).join('L'),c=o.c||'var(--acc)';
  return '<svg class="chart ec-mini" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none" style="height:'+h+'px">'+
   (o.thr!=null?'<line x1="0" x2="'+w+'" y1="'+Y(o.thr).toFixed(1)+'" y2="'+Y(o.thr).toFixed(1)+'" stroke="var(--mut-2)" stroke-dasharray="3 4" vector-effect="non-scaling-stroke"/>':'')+
   '<path d="'+d+'L'+w+' '+h+'L0 '+h+'Z" class="area" fill="'+c+'"/><path d="'+d+'" class="ln draw" stroke="'+c+'" style="--len:900" vector-effect="non-scaling-stroke"/></svg>'}

P.css(`
.ec-mini{display:block;width:100%}
.ec-kv{display:grid;grid-template-columns:auto minmax(0,1fr);gap:8px 16px;font-size:13px;align-items:baseline}
.ec-kv dt{color:var(--mut)}.ec-kv dd{margin:0;font-weight:600;text-align:right;min-width:0}
.ec-sec{font:650 13px var(--f-text);letter-spacing:-.005em;margin:20px 0 8px;display:flex;align-items:center;justify-content:space-between;gap:8px}
.ec-sec:first-child{margin-top:0}
.ec-ico{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;flex:none;background:var(--bg-2);color:var(--ink-2)}
.ec-ico.warn{background:var(--warn-pale);color:var(--warn)}.ec-ico.bad{background:var(--bad-pale);color:var(--bad)}.ec-ico.ok{background:var(--ok-pale);color:var(--ok)}.ec-ico.acc{background:var(--acc-pale);color:var(--acc)}
.ec-step{display:inline-flex;align-items:center;gap:2px;border-radius:var(--r-sm);box-shadow:inset 0 0 0 1px var(--line-2);background:var(--surface)}
.ec-step button{width:34px;height:34px;display:grid;place-items:center;color:var(--ink-2);border-radius:var(--r-sm)}
.ec-step button:hover{background:var(--bg-2)}
.ec-step b{min-width:44px;text-align:center;font-variant-numeric:tabular-nums}
.ec-range{appearance:none;-webkit-appearance:none;width:100%;height:22px;background:transparent;margin:0}
.ec-range::-webkit-slider-runnable-track{height:6px;border-radius:3px;background:linear-gradient(to right,var(--acc) var(--p,50%),var(--bg-2) var(--p,50%))}
.ec-range::-moz-range-track{height:6px;border-radius:3px;background:var(--bg-2)}
.ec-range::-moz-range-progress{height:6px;border-radius:3px;background:var(--acc)}
.ec-range::-webkit-slider-thumb{-webkit-appearance:none;width:20px;height:20px;border-radius:50%;background:var(--surface);box-shadow:0 0 0 1.5px var(--acc),var(--shadow-2);margin-top:-7px;cursor:grab}
.ec-range::-moz-range-thumb{width:18px;height:18px;border-radius:50%;background:var(--surface);border:1.5px solid var(--acc);cursor:grab}
.ec-tabs{margin-bottom:18px}
@container main (max-width:760px){.ec-tabs{margin:0 -16px 14px;padding:0 12px}}
`);
function bindRange(root){P.$$('.ec-range',root).forEach(function(r){var f=function(){r.style.setProperty('--p',((r.value-r.min)/(r.max-r.min)*100)+'%');var o=root.querySelector('[data-out="'+r.id+'"]');if(o)o.textContent=String(r.value).replace('.',',')};r.oninput=f;f()})}

/* =====================================================================
   Flux vidéo simulés (canvas 2D). Les couleurs en dur restent à l'intérieur de l'image.
   ===================================================================== */
var SPR={};
function sprite(yaw,f,tone){
  var key=yaw.toFixed(2)+'|'+f.toFixed(3)+'|'+tone.join();if(SPR[key])return SPR[key];
  var w=300,h=200,cv=document.createElement('canvas');cv.width=w;cv.height=h;var g=cv.getContext('2d');
  if(!window.HORSE){g.fillStyle='rgb('+tone.join()+')';g.beginPath();g.ellipse(150,110,90,45,0,0,7);g.fill();return SPR[key]=cv}
  var n=HORSE.n,V=new Float32Array(n*3);HORSE.lerp(f,V);var idx=HORSE.idx,c=Math.cos(yaw),s=Math.sin(yaw),S=150;
  var X=new Float32Array(n),Y=new Float32Array(n),Z=new Float32Array(n),i;
  for(i=0;i<n;i++){var x=V[i*3],y=V[i*3+1],z=V[i*3+2];X[i]=z*s+x*c;Y[i]=y;Z[i]=z*c-x*s}
  var tr=[];for(i=0;i<idx.length;i+=3){var a=idx[i],b=idx[i+1],d=idx[i+2];tr.push([a,b,d,Z[a]+Z[b]+Z[d]])}
  tr.sort(function(p,q){return p[3]-q[3]});
  g.lineJoin='round';g.lineWidth=.7;
  tr.forEach(function(t){var a=t[0],b=t[1],d=t[2],ux=X[b]-X[a],uy=Y[b]-Y[a],uz=Z[b]-Z[a],vx=X[d]-X[a],vy=Y[d]-Y[a],vz=Z[d]-Z[a];
    var nx=uy*vz-uz*vy,ny=uz*vx-ux*vz,nz=ux*vy-uy*vx,l=Math.sqrt(nx*nx+ny*ny+nz*nz)||1;if(nz<0){nx=-nx;ny=-ny;nz=-nz}
    var sh=Math.max(0,(nx*-.35+ny*.8+nz*.5)/l),k=.42+.75*sh,col='rgb('+Math.min(255,tone[0]*k|0)+','+Math.min(255,tone[1]*k|0)+','+Math.min(255,tone[2]*k|0)+')';
    g.fillStyle=col;g.strokeStyle=col;g.beginPath();g.moveTo(w/2+X[a]*S,h-10-Y[a]*S);g.lineTo(w/2+X[b]*S,h-10-Y[b]*S);g.lineTo(w/2+X[d]*S,h-10-Y[d]*S);g.closePath();g.fill();g.stroke()});
  return SPR[key]=cv}
var NOISE=null;
function noise(){if(NOISE)return NOISE;var cv=document.createElement('canvas');cv.width=240;cv.height=136;var g=cv.getContext('2d'),im=g.createImageData(240,136),r=rng(99);
  for(var i=0;i<im.data.length;i+=4){var v=r()*255|0;im.data[i]=im.data[i+1]=im.data[i+2]=v;im.data[i+3]=38}g.putImageData(im,0,0);return NOISE=cv}
function lg(g,x0,y0,x1,y1,st){var gr=g.createLinearGradient(x0,y0,x1,y1);st.forEach(function(s,i){gr.addColorStop(i/(st.length-1),s)});return gr}
function poly(g,pts,fill){g.beginPath();pts.forEach(function(p,i){i?g.lineTo(p[0],p[1]):g.moveTo(p[0],p[1])});g.closePath();g.fillStyle=fill;g.fill()}
function vign(g,W,H,a){var gr=g.createRadialGradient(W/2,H/2,H*.35,W/2,H/2,H*.95);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,'+a+')');g.fillStyle=gr;g.fillRect(0,0,W,H)}

function feedBg(c,W,H){var cv=document.createElement('canvas');cv.width=W;cv.height=H;var g=cv.getContext('2d'),r=rng(c.n*131+7),i,k;
  if(c.sc==='box'){
    g.fillStyle=lg(g,0,0,0,H,['#2a2d35','#1a1c22']);g.fillRect(0,0,W,H);
    for(i=0;i<W;i+=30){g.fillStyle='rgba(0,0,0,'+(.14+r()*.12)+')';g.fillRect(i,0,1.5,H*.7)}
    g.fillStyle='rgba(0,0,0,.28)';g.fillRect(0,H*.34,W,5);g.fillStyle='rgba(255,255,255,.04)';g.fillRect(0,H*.34+5,W,1);
    var wx=c.yaw<0?W*.12:W*.7;g.fillStyle='#8b97a8';g.fillRect(wx,H*.08,W*.17,H*.2);g.fillStyle='#1b1d23';for(i=1;i<4;i++)g.fillRect(wx+i*W*.0425-1,H*.08,2.5,H*.2);g.fillRect(wx,H*.175,W*.17,2.5);
    poly(g,[[wx,H*.28],[wx+W*.17,H*.28],[wx+W*.3,H],[wx-W*.2,H]],lg(g,0,H*.28,0,H,['rgba(190,205,235,.16)','rgba(190,205,235,.02)']));
    g.fillStyle=lg(g,0,H*.68,0,H,['#3a342a','#231f19']);g.fillRect(0,H*.68,W,H*.32);
    for(i=0;i<620;i++){var x=r()*W,y=H*.69+r()*H*.31,a=r()*3.14;g.strokeStyle='rgba('+(190+r()*40|0)+','+(165+r()*30|0)+',110,'+(.05+r()*.13)+')';g.lineWidth=1;g.beginPath();g.moveTo(x,y);g.lineTo(x+Math.cos(a)*7,y+Math.sin(a)*2.5);g.stroke()}
    var bx=c.yaw<0?W*.84:W*.1;g.fillStyle='#252a36';poly(g,[[bx-20,H*.56],[bx+20,H*.56],[bx+16,H*.7],[bx-16,H*.7]],'#2b3242');g.fillStyle='rgba(140,170,220,.25)';g.fillRect(bx-18,H*.565,36,3);
    vign(g,W,H,.62)}
  else if(c.sc==='aisle'){
    var vx=W*.5,vy=H*.4;g.fillStyle='#16181d';g.fillRect(0,0,W,H);
    poly(g,[[0,H],[W,H],[vx+26,vy+20],[vx-26,vy+20]],lg(g,0,vy,0,H,['#545962','#2c2f36']));
    poly(g,[[0,0],[vx-26,vy-22],[vx-26,vy+20],[0,H]],lg(g,0,0,vx,0,['#2b2f37','#1d2026']));
    poly(g,[[W,0],[vx+26,vy-22],[vx+26,vy+20],[W,H]],lg(g,W,0,vx,0,['#262a32','#1b1e24']));
    g.fillStyle='#b7c4d6';g.fillRect(vx-26,vy-22,52,42);g.fillStyle='rgba(183,196,214,.25)';g.fillRect(vx-34,vy-28,68,54);
    for(k=0;k<6;k++){var t0=1-Math.pow(.62,k),t1=1-Math.pow(.62,k+.82);[0,1].forEach(function(sd){var ex=sd?W:0,X0=ex+(vx+(sd?26:-26)-ex)*t0,X1=ex+(vx+(sd?26:-26)-ex)*t1,yb0=H+(vy+20-H)*t0,yb1=H+(vy+20-H)*t1,yt0=(vy-22)*t0,yt1=(vy-22)*t1,m0=yt0+(yb0-yt0)*.42,m1=yt1+(yb1-yt1)*.42;
      poly(g,[[X0,m0],[X1,m1],[X1,yb1],[X0,yb0]],sd?'#3a3229':'#40372d');
      g.strokeStyle='rgba(170,180,195,.35)';g.lineWidth=1;for(var q=0;q<=6;q++){var xx=X0+(X1-X0)*q/6,ya=yt0+(yt1-yt0)*q/6+ (m0-yt0)*.3,ybm=m0+(m1-m0)*q/6;g.beginPath();g.moveTo(xx,ya+ (yb0-yt0)*.02);g.lineTo(xx,ybm);g.stroke()}
      g.strokeStyle='rgba(0,0,0,.5)';g.lineWidth=2;g.beginPath();g.moveTo(X0,m0);g.lineTo(X1,m1);g.stroke()})}
    for(k=0;k<4;k++){var t=1-Math.pow(.6,k+.3),ly=(vy-22)*t+2,lw=40*(1-t);g.fillStyle='rgba(255,244,214,.85)';g.fillRect(vx-lw/2,ly,lw,3*(1-t)+1);g.fillStyle='rgba(255,244,214,.07)';g.beginPath();g.ellipse(vx,ly+30*(1-t),lw*2.2,40*(1-t),0,0,7);g.fill()}
    g.fillStyle='rgba(255,255,255,.05)';poly(g,[[vx-10,vy+20],[vx+10,vy+20],[W*.62,H],[W*.38,H]],'rgba(255,255,255,.05)');
    vign(g,W,H,.55)}
  else if(c.sc==='arena'){
    g.fillStyle=lg(g,0,0,0,H*.5,['#22262e','#3d4450']);g.fillRect(0,0,W,H*.5);
    g.fillStyle='rgba(176,192,214,.55)';g.fillRect(0,H*.2,W,H*.13);for(i=0;i<W;i+=48){g.fillStyle='#2a2f38';g.fillRect(i,H*.06,4,H*.4)}
    g.strokeStyle='rgba(20,22,28,.9)';g.lineWidth=3;for(i=-1;i<6;i++){g.beginPath();g.moveTo(i*96,H*.2);g.lineTo(i*96+48,H*.02);g.lineTo(i*96+96,H*.2);g.stroke()}
    g.fillStyle='#4a3b2c';g.fillRect(0,H*.4,W,H*.1);g.fillStyle='rgba(0,0,0,.25)';for(i=0;i<W;i+=22)g.fillRect(i,H*.4,1.5,H*.1);
    g.fillStyle=lg(g,0,H*.5,0,H,['#8a7c66','#5d5243']);g.fillRect(0,H*.5,W,H*.5);
    for(i=0;i<900;i++){g.fillStyle='rgba('+(r()<.5?'40,32,24':'220,205,175')+','+(.03+r()*.07)+')';g.fillRect(r()*W,H*.5+r()*H*.5,2+r()*3,1)}
    g.strokeStyle='rgba(52,43,33,.33)';g.lineWidth=9;g.beginPath();g.ellipse(W/2,H*.71,W*.31,H*.135,0,0,7);g.stroke();
    vign(g,W,H,.45)}
  else if(c.sc==='paddock'){
    g.fillStyle=lg(g,0,0,0,H*.45,['#aab4be','#d3d8dc']);g.fillRect(0,0,W,H*.45);
    for(i=0;i<16;i++){var tx=i*34-10+r()*14,tw=22+r()*20;g.fillStyle='rgba('+(52+r()*18|0)+','+(66+r()*16|0)+','+(52+r()*10|0)+',.95)';g.beginPath();g.ellipse(tx,H*.41-r()*8,tw,16+r()*14,0,0,7);g.fill()}
    g.fillStyle=lg(g,0,H*.42,0,H,['#6c8259','#44583a']);g.fillRect(0,H*.42,W,H*.58);
    for(i=0;i<700;i++){var gy=H*.43+r()*H*.57;g.strokeStyle='rgba('+(r()<.5?'30,45,24':'150,175,110')+','+(.05+r()*.1)+')';g.lineWidth=1;g.beginPath();g.moveTo(r()*W,gy);g.lineTo(r()*W*.02+r()*W,gy-2-r()*3);g.stroke()}
    g.strokeStyle='rgba(232,236,240,.85)';g.lineWidth=2;[H*.5,H*.535].forEach(function(y){g.beginPath();g.moveTo(0,y);g.lineTo(W,y-6);g.stroke()});
    for(i=0;i<9;i++){g.fillStyle='rgba(232,236,240,.9)';g.fillRect(i*60+12,H*.48-i*.8,3,H*.09)}
    g.fillStyle='#515a4a';poly(g,[[W*.74,H*.36],[W*.96,H*.34],[W*.96,H*.47],[W*.74,H*.48]],'#3b3f38');poly(g,[[W*.72,H*.36],[W*.98,H*.335],[W*.98,H*.31],[W*.72,H*.335]],'#5f6660');
    vign(g,W,H,.3)}
  else if(c.sc==='tack'){
    g.fillStyle=lg(g,0,0,W,0,['#2a231d','#3a3027','#4a3d31']);g.fillRect(0,0,W,H);
    for(i=0;i<H*.74;i+=17){g.fillStyle='rgba(0,0,0,.2)';g.fillRect(0,i,W,1.5)}
    g.fillStyle=lg(g,0,H*.74,0,H,['#3b3a3c','#232325']);g.fillRect(0,H*.74,W,H*.26);for(i=0;i<W;i+=40){g.fillStyle='rgba(0,0,0,.25)';g.fillRect(i,H*.74,1.5,H*.26)}
    for(k=0;k<2;k++)for(i=0;i<5;i++){var sx=46+i*82+k*18,sy=H*(.3+k*.26);g.fillStyle='#16130f';g.fillRect(sx-4,sy+8,46,5);
      g.fillStyle=['#3b2a1f','#2c211a','#4a3323','#241c17','#3a2c22'][(i+k*2)%5];g.beginPath();g.moveTo(sx-8,sy+6);g.quadraticCurveTo(sx-4,sy-14,sx+14,sy-9);g.quadraticCurveTo(sx+34,sy-4,sx+46,sy-13);g.quadraticCurveTo(sx+52,sy+2,sx+42,sy+9);g.lineTo(sx+36,sy+34);g.quadraticCurveTo(sx+18,sy+40,sx+6,sy+32);g.closePath();g.fill();
      g.strokeStyle='rgba(255,230,200,.16)';g.lineWidth=1.5;g.beginPath();g.moveTo(sx-4,sy-2);g.quadraticCurveTo(sx+14,sy-12,sx+44,sy-10);g.stroke();
      g.strokeStyle='rgba(190,195,205,.5)';g.lineWidth=1.2;g.beginPath();g.moveTo(sx+22,sy+30);g.lineTo(sx+22,sy+50);g.stroke();g.beginPath();g.ellipse(sx+22,sy+54,5,4,0,0,7);g.stroke()}
    for(i=0;i<7;i++){var hx=30+i*62;g.fillStyle='#8a8f98';g.fillRect(hx-2,H*.07,4,4);g.strokeStyle='rgba(30,22,16,.95)';g.lineWidth=2.2;g.beginPath();g.ellipse(hx,H*.07+20,7+(i%2)*2,18,0,0,7);g.stroke();g.beginPath();g.moveTo(hx-5,H*.07+12);g.lineTo(hx+6,H*.07+14);g.stroke()}
    g.fillStyle='#1f1a16';g.fillRect(W*.06,H*.8,W*.26,H*.12);g.fillStyle='rgba(255,255,255,.05)';g.fillRect(W*.06,H*.8,W*.26,2);
    poly(g,[[W,H*.1],[W,H],[W*.6,H],[W*.86,H*.1]],'rgba(215,225,240,.06)');
    vign(g,W,H,.6)}
  else{
    g.fillStyle=lg(g,0,0,0,H,['#565a60','#3f4247']);g.fillRect(0,0,W,H);
    g.fillStyle='#3d4a3a';g.fillRect(0,0,W,H*.12);for(i=0;i<W;i+=14){g.fillStyle='rgba('+(50+r()*20|0)+','+(70+r()*22|0)+',52,1)';g.beginPath();g.ellipse(i,H*.1,12,9+r()*5,0,0,7);g.fill()}
    g.fillStyle='#6b6f76';g.fillRect(0,H*.13,W,H*.1);
    g.fillStyle='#d8dbe0';g.fillRect(W*.3,H*.1,7,H*.16);g.fillRect(W*.62,H*.1,7,H*.16);g.fillStyle='#22252b';g.fillRect(W*.3+7,H*.16,W*.32-7,4);g.fillRect(W*.3+7,H*.21,W*.32-7,3);
    g.strokeStyle='rgba(235,238,242,.5)';g.lineWidth=2;for(i=0;i<6;i++){g.beginPath();g.moveTo(40+i*78,H*.5);g.lineTo(26+i*84,H*.96);g.stroke()}
    var cars=[[52,'#cfd3d8',0],[134,'#27364f',0],[296,'#8d2f33',0],[378,'#e7e9ec',1]];cars.forEach(function(cr){var x=cr[0],yy=H*.56,w=cr[2]?64:54,h=cr[2]?112:92;g.fillStyle='rgba(0,0,0,.28)';g.beginPath();g.ellipse(x+w/2+4,yy+h/2+5,w*.58,h*.54,0,0,7);g.fill();
      g.fillStyle=cr[1];g.beginPath();g.moveTo(x+8,yy);g.lineTo(x+w-8,yy);g.quadraticCurveTo(x+w,yy,x+w+1,yy+12);g.lineTo(x+w+4,yy+h-10);g.quadraticCurveTo(x+w+4,yy+h,x+w-6,yy+h);g.lineTo(x+4,yy+h);g.quadraticCurveTo(x-6,yy+h,x-5,yy+h-10);g.lineTo(x-1,yy+12);g.quadraticCurveTo(x,yy,x+8,yy);g.fill();
      g.fillStyle='rgba(18,22,30,.82)';g.fillRect(x+5,yy+h*(cr[2]?.08:.2),w-8,h*.16);if(!cr[2])g.fillRect(x+3,yy+h*.68,w-4,h*.12);g.fillStyle='rgba(255,255,255,.14)';g.fillRect(x+6,yy+h*(cr[2]?.3:.4),w-10,h*(cr[2]?.62:.24))});
    g.fillStyle='rgba(255,255,255,.035)';for(i=0;i<50;i++)g.fillRect(r()*W,H*.25+r()*H*.75,30+r()*60,1);
    vign(g,W,H,.42)}
  return cv}

var FEEDS=[],feedRaf=0,feedLast=0;
function drawFeed(f,t){var g=f.g,c=f.cam,W=f.cv.width,H=f.cv.height,o=f.o;
  if(!f.bg)f.bg=feedBg(c,W,H);g.setTransform(1,0,0,1,0,0);g.globalAlpha=1;g.drawImage(f.bg,0,0);
  var tt=t+c.n*3.7,box=null;
  if(c.sc==='box'){var tone=o.ir?[150,160,150]:[124,112,100],yaw=c.yaw||1.2,fr=Math.round((.12+.012*Math.sin(tt*.5))/.004)*.004,sp=sprite(yaw,fr,tone),sc=H*.66/150,sw=sp.width*sc,sh=sp.height*sc;
    var x=W*.5+9*Math.sin(tt*.21)-sw/2,by=H*.9,br=1+.005*Math.sin(tt*1.7);
    if(c.lying&&!o.standing){g.save();g.beginPath();g.rect(0,0,W,H*.83);g.clip();g.translate(x+sw/2,by+sh*.4);g.rotate(-.05);g.scale(1.04,br);g.drawImage(sp,-sw/2,-sh,sw,sh);g.restore();
      g.fillStyle='rgba(58,50,38,.96)';g.beginPath();g.ellipse(W*.5,H*.855,sw*.5,H*.05,0,0,7);g.fill();var r2=rng(5);for(var i=0;i<90;i++){g.strokeStyle='rgba(205,180,120,'+(.08+r2()*.14)+')';g.lineWidth=1;var sx=W*.5+(r2()-.5)*sw*.95,sy=H*.82+r2()*H*.07;g.beginPath();g.moveTo(sx,sy);g.lineTo(sx+6*(r2()-.5)*2,sy-2);g.stroke()}
      box=[x+sw*.1,by-sh*.52,sw*.8,sh*.5,'COUCHÉ · '+(14+Math.floor(t/60))+' MIN','#ff6b72']}
    else{g.fillStyle='rgba(0,0,0,.35)';g.beginPath();g.ellipse(x+sw/2,by-2,sw*.36,H*.022,0,0,7);g.fill();g.save();g.translate(x+sw/2,by);g.scale(1,br);g.drawImage(sp,-sw/2,-sh,sw,sh);g.restore();
      box=[x+sw*.08,by-sh*.98,sw*.84,sh*.98,'CHEVAL · DEBOUT','#7dffb5']}}
  else if(c.sc==='arena'){var a=tt*.32,cx=W/2+Math.cos(a)*W*.31,cy=H*.71+Math.sin(a)*H*.135,dir=-Math.sin(a)>0?1:-1,dp=.5+.5*Math.sin(a),s2=(.3+.2*dp)*H/150,spa=sprite(1.5708,Math.round(((tt*.55)%1)*24)/24,[78,62,50]),w2=spa.width*s2,h2=spa.height*s2;
    g.fillStyle='rgba(30,24,18,.35)';g.beginPath();g.ellipse(cx,cy,w2*.3,h2*.07,0,0,7);g.fill();g.save();g.translate(cx,cy+h2*.03);g.scale(dir,1);g.drawImage(spa,-w2/2,-h2,w2,h2);g.restore();
    box=[cx-w2*.36,cy-h2*.95,w2*.72,h2*.95,'CHEVAL · AU PAS','#7dffb5']}
  else if(c.sc==='paddock'){[[.22,.74,.44,1,[70,52,40]],[.52,.66,.34,-1,[150,145,138]],[.68,.8,.5,1,[40,36,34]]].forEach(function(p,i){var s3=p[2]*H/150,sp3=sprite(1.5708,.1+i*.3+Math.round(Math.sin(tt*.2+i)*2)*.004,p[4]),w3=sp3.width*s3,h3=sp3.height*s3,px=W*p[0]+(i===1?Math.sin(tt*.07)*26:Math.sin(tt*.13+i)*4),py=H*p[1];
      g.fillStyle='rgba(20,30,16,.3)';g.beginPath();g.ellipse(px,py,w3*.3,h3*.06,0,0,7);g.fill();g.save();g.translate(px,py+h3*.03);g.scale(p[3],1);g.drawImage(sp3,-w3/2,-h3,w3,h3);g.restore()});
    box=null}
  else if(c.sc==='aisle'){g.fillStyle='rgba(255,244,214,'+(.015+.012*Math.sin(tt*2.3))+')';g.fillRect(0,0,W,H)}
  else if(c.sc==='gate'){g.fillStyle=Math.floor(tt)%2?'#ff5a5f':'#5a1d20';g.beginPath();g.arc(W*.3+3.5,H*.1-4,2.6,0,7);g.fill()}
  if(o.ir){g.globalCompositeOperation='color';g.fillStyle='#8fae9a';g.fillRect(0,0,W,H);g.globalCompositeOperation='source-over';g.fillStyle='rgba(120,255,190,.05)';g.fillRect(0,0,W,H)}
  if(box&&o.ai!==false){g.strokeStyle=box[5];g.lineWidth=1.6;var bx=box[0],bY=box[1],bw=box[2],bh=box[3],L=12;[[bx,bY,1,1],[bx+bw,bY,-1,1],[bx,bY+bh,1,-1],[bx+bw,bY+bh,-1,-1]].forEach(function(q){g.beginPath();g.moveTo(q[0]+L*q[2],q[1]);g.lineTo(q[0],q[1]);g.lineTo(q[0],q[1]+L*q[3]);g.stroke()});
    g.font='600 '+Math.round(H*.036)+'px ui-monospace,Menlo,monospace';var tw=g.measureText(box[4]).width+10;g.fillStyle='rgba(8,10,16,.72)';g.fillRect(bx,bY-H*.062,tw,H*.052);g.fillStyle=box[5];g.textBaseline='middle';g.fillText(box[4],bx+5,bY-H*.035)}
  var nz=noise();g.globalAlpha=o.ir?.9:.55;g.drawImage(nz,-((tt*997)%60),-((tt*613)%40),W+80,H+60);g.globalAlpha=1;
  g.fillStyle='rgba(255,255,255,.035)';g.fillRect(0,((tt*26)%(H+40))-40,W,26);
  if(o.osd!==false){var sec=Math.floor(t)%60,base=o.replay||'09:41',ts='17/11/2026  '+base+':'+pad(o.replay?(sec+7)%60:sec);g.font='500 '+Math.round(H*.04)+'px ui-monospace,Menlo,monospace';g.textBaseline='alphabetic';g.fillStyle='rgba(0,0,0,.55)';g.fillText(ts,W*.03+1,H*.94+1);g.fillStyle='rgba(255,255,255,.88)';g.fillText(ts,W*.03,H*.94);
    var cc='CAM '+pad(c.n)+(o.ir?' · IR':'');g.textAlign='right';g.fillStyle='rgba(0,0,0,.55)';g.fillText(cc,W*.97+1,H*.94+1);g.fillStyle='rgba(255,255,255,.7)';g.fillText(cc,W*.97,H*.94);g.textAlign='left'}
}
function feedLoop(now){FEEDS=FEEDS.filter(function(f){return f.cv.isConnected});if(!FEEDS.length){feedRaf=0;return}feedRaf=requestAnimationFrame(feedLoop);
  if(now-feedLast<(P.RM?1000:84))return;feedLast=now;FEEDS.forEach(function(f){if(!f.o.paused)drawFeed(f,(now-f.t0)/1000)})}
function feedAdd(cv,camId,o){var f={cv:cv,g:cv.getContext('2d'),cam:camOf(camId),o:o||{},t0:performance.now()-((camId.charCodeAt(3)||1)*900),bg:null};
  try{drawFeed(f,0)}catch(e){}FEEDS.push(f);if(!feedRaf)feedRaf=requestAnimationFrame(feedLoop);
  f.redraw=function(){try{drawFeed(f,(performance.now()-f.t0)/1000)}catch(e){}};return f}
function feedHtml(camId,cls){return '<canvas class="ec-feed '+(cls||'')+'" data-feed="'+camId+'" width="480" height="270"></canvas>'}
P.css(`.ec-feed{display:block;width:100%;aspect-ratio:16/9;background:#101216;border-radius:inherit}`);

/* =====================================================================
   1 · PLAN 3D DE L'ÉCURIE
   ===================================================================== */
var BLD={A:'Écurie principale',B:'Petite écurie',C:'Boxes de cour'};
var AT_WORK=['h21','h25','h28','h31'],AT_PAD=['h03','h07','h10','h11','h14','h15','h19','h20','h26','h30','h34','h36','h39'];
/* emplacement de chaque cheval à 9 h 41, partagé avec le cockpit : un cheval en alerte urgente reste au box */
D.horseWhere=function(id){var h=D.horse(id);if(!h)return 'box';if(h.status==='bad')return 'box';return AT_WORK.indexOf(id)>=0?'work':AT_PAD.indexOf(id)>=0?'pad':'box'};
var BX=null;
function boxes(){if(BX)return BX;BX=[];
  for(var i=0;i<46;i++){var b={id:'B'+pad(i+1),name:'B'+pad(i+1),rot:0};
    if(i<12){b.bld='A';b.x=-34+i*4;b.z=-4}else if(i<24){b.bld='A';b.x=-34+(i-12)*4;b.z=4;b.rot=2}
    else if(i<32){b.bld='B';b.x=-34+(i-24)*4;b.z=18}else if(i<40){b.bld='B';b.x=-34+(i-32)*4;b.z=26;b.rot=2}
    else{b.bld='C';b.x=4+(i-40)*4;b.z=26;b.rot=2}
    var h=D.horses.find(function(x){return x.box===b.id});if(h){b.horse=h.id;b.where=D.horseWhere(h.id)}
    var g=!h&&D.boxGuests.find(function(x){return x.box===b.id});if(g){b.guest=g;b.where='box'}
    var c=D.cameras.find(function(x){return x.box===b.id});if(c)b.cam=c.id;
    BX.push(b)}
  return BX}
function boxById(id){return boxes().find(function(b){return b.id===id})}
function occ(b){
  if(b.horse){var h=D.horse(b.horse);return {name:h.name,id:h.id,h:h,owner:h.owner?D.name(h.owner):'Cheval du club',kind:h.kind,status:h.status,alert:h.alerts[0],sub:h.breed+' · '+h.age+' ans'}}
  if(b.guest)return {name:b.guest.name,owner:b.guest.owner,kind:b.guest.kind||'passage',status:'ok',sub:b.guest.breed,note:b.guest.note};
  return null}
var MODES={
 occ:['Occupation',[['box','Au box','acc'],['pad','Au paddock','c3'],['work','Au travail','c5'],['alert','Alerte santé','bad'],['free','Libre','line-2']]],
 sante:['Santé',[['ok','Rien à signaler','ok'],['warn','À surveiller','warn'],['bad','Urgent','bad'],['free','Libre','line-2']]],
 pens:['Pensions',[['club','Chevaux du club','c2'],['prop','Propriétaires','acc'],['demi','Demi-pension','c5'],['pass','De passage','c4'],['free','Libre','line-2']]],
 cam:['Caméras',[['cam','Box filmé','acc'],['nocam','Sans caméra','line-2']]]};
function catOf(b,mode){var o=occ(b);if(mode==='cam')return b.cam?'cam':'nocam';if(!o)return 'free';
  if(mode==='occ')return o.status==='bad'?'alert':b.where;if(mode==='sante')return o.status;
  return {club:'club',proprietaire:'prop',demi:'demi',passage:'pass'}[o.kind]||'pass'}
function catDef(mode,k){return MODES[mode][1].find(function(c){return c[0]===k})||['', '', 'line-2']}
var WHERE={box:'Au box',pad:'Au paddock',work:'Au travail'};

/* ---------- Scène three.js ---------- */
function scene3d(host,o){
  if(!window.THREE)return null;var T=THREE,ren;
  try{ren=new T.WebGLRenderer({antialias:true,alpha:true})}catch(e){return null}
  var W=host.clientWidth||800,H=host.clientHeight||520,alive=true,RM=P.RM,mob=!!o.mobile;
  ren.setPixelRatio(Math.min(window.devicePixelRatio||1,2));ren.setSize(W,H,false);ren.outputEncoding=T.sRGBEncoding;
  ren.shadowMap.enabled=true;ren.shadowMap.type=T.PCFSoftShadowMap;ren.shadowMap.autoUpdate=false;
  var cv=ren.domElement;cv.className='e3-cv';host.appendChild(cv);
  var ov=document.createElement('div');ov.className='e3-ov';host.appendChild(ov);
  var sc=new T.Scene(),cam=new T.PerspectiveCamera(30,W/H,2,3000),root=new T.Group();sc.add(root);
  var cs=getComputedStyle(document.documentElement),dark=false;
  function tok(n){return cs.getPropertyValue('--'+n).trim()||'#888888'}
  function col(n){return new T.Color(tok(n)).convertSRGBToLinear()}
  function mix(a,b,k){return col(a).lerp(col(b),k)}
  function chk(){var c=new T.Color(tok('bg'));dark=(c.r+c.g+c.b)/3<.4}chk();

  /* matières : toutes les couleurs viennent des jetons et suivent le thème */
  var mats=[];
  function M(fn,p,Cl){var m=new (Cl||T.MeshLambertMaterial)(p||{});m.userData.fn=fn;m.color.copy(fn());mats.push(m);return m}
  var mGround=M(function(){return mix('bg-2','surface',dark?.3:.6)}),
      mGrass=M(function(){return mix('surface','ok',dark?.13:.14)}),mSand=M(function(){return mix('surface','c4',dark?.11:.2)}),
      mPath=M(function(){return mix('bg-2','line-2',dark?.5:.3)}),mConc=M(function(){return mix('bg-2','line-2',dark?.8:.65)}),
      mWall=M(function(){return dark?mix('raise','ink',.2):col('surface')}),mWall2=M(function(){return dark?mix('raise','ink',.2):col('surface')},{side:T.DoubleSide}),
      mAlt=M(function(){return dark?mix('raise','ink',.1):mix('surface','line-2',.5)}),
      mFence=M(function(){return dark?mix('line-2','ink',.3):col('surface')}),mTree=M(function(){return mix('ok','surface',dark?.42:.5)}),mTrunk=M(function(){return col('mut-2')}),
      mHorse=M(function(){return dark?mix('ink','acc',.15):col('ink')},{side:T.DoubleSide}),
      mAcc=M(function(){return col('acc')}),mWin=M(function(){return mix('acc','surface',dark?.5:.68)}),mCar=M(function(){return mix('mut-2','surface',dark?.15:.45)}),
      mHay=M(function(){return mix('c4','surface',dark?.5:.45)}),
      mLine=M(function(){return col(dark?'mut':'mut-2')},{transparent:true,opacity:.85},T.LineBasicMaterial),
      mGlass=M(function(){return col('line-2')},{transparent:true,opacity:.2,side:T.DoubleSide,depthWrite:false},T.MeshBasicMaterial),
      mGrid=M(function(){return col('acc')},{transparent:true,opacity:.22},T.LineBasicMaterial),
      mSel=M(function(){return col('acc')},{transparent:true,opacity:.16,depthWrite:false},T.MeshBasicMaterial),mSelL=M(function(){return col('acc')},{},T.LineBasicMaterial),
      mHov=M(function(){return col('ink')},{transparent:true,opacity:.55},T.LineBasicMaterial),
      mPick=M(function(){return col('ok')},{transparent:true,opacity:.3,depthWrite:false},T.MeshBasicMaterial),
      mCone=M(function(){return col('acc')},{transparent:true,opacity:.2,depthWrite:false,side:T.DoubleSide},T.MeshBasicMaterial);

  var unit=new T.BoxGeometry(1,1,1),bins=new Map(),dm=new T.Object3D();
  function blk(m,x,y,z,w,h,d,ry,noSh){var k=m.uuid+(noSh?'n':'');if(!bins.has(k))bins.set(k,{m:m,a:[],sh:!noSh});bins.get(k).a.push([x,y+h/2,z,w,h,d,ry||0])}
  function flush(){bins.forEach(function(b){var im=new T.InstancedMesh(unit,b.m,b.a.length);b.a.forEach(function(q,i){dm.position.set(q[0],q[1],q[2]);dm.scale.set(q[3],q[4],q[5]);dm.rotation.set(0,q[6],0);dm.updateMatrix();im.setMatrixAt(i,dm.matrix)});im.castShadow=b.sh;im.receiveShadow=true;root.add(im)});bins.clear()}
  function slab(m,r,h){blk(m,(r[0]+r[2])/2,0,(r[1]+r[3])/2,r[2]-r[0],h||.1,r[3]-r[1],0,true)}
  function fence(r){var x0=r[0],z0=r[1],x1=r[2],z1=r[3],i;[.55,1.05].forEach(function(y){blk(mFence,(x0+x1)/2,y,z0,x1-x0,.09,.09);blk(mFence,(x0+x1)/2,y,z1,x1-x0,.09,.09);blk(mFence,x0,y,(z0+z1)/2,.09,.09,z1-z0);blk(mFence,x1,y,(z0+z1)/2,.09,.09,z1-z0)});
    var nx=Math.round((x1-x0)/4),nz=Math.round((z1-z0)/4);for(i=0;i<=nx;i++){var x=x0+(x1-x0)*i/nx;blk(mFence,x,0,z0,.17,1.3,.17);blk(mFence,x,0,z1,.17,1.3,.17)}for(i=1;i<nz;i++){var z=z0+(z1-z0)*i/nz;blk(mFence,x0,0,z,.17,1.3,.17);blk(mFence,x1,0,z,.17,1.3,.17)}}
  var LP=[],GP=[];
  function ln(a,b,c,d,e,f){LP.push(a,b,c,d,e,f)}
  function quad(p,q,r,s){GP.push(p[0],p[1],p[2],q[0],q[1],q[2],r[0],r[1],r[2],p[0],p[1],p[2],r[0],r[1],r[2],s[0],s[1],s[2])}
  function gable(x0,x1,zc,hw,eave,ridge,step,wt){ln(x0,eave,zc-hw,x1,eave,zc-hw);ln(x0,eave,zc+hw,x1,eave,zc+hw);ln(x0,ridge,zc,x1,ridge,zc);
    for(var x=x0;x<=x1+.01;x+=step){ln(x,eave,zc-hw,x,ridge,zc);ln(x,ridge,zc,x,eave,zc+hw);if(wt<eave){ln(x,wt,zc-hw,x,eave,zc-hw);ln(x,wt,zc+hw,x,eave,zc+hw)}}
    quad([x0,eave,zc-hw],[x1,eave,zc-hw],[x1,ridge,zc],[x0,ridge,zc]);quad([x0,eave,zc+hw],[x1,eave,zc+hw],[x1,ridge,zc],[x0,ridge,zc])}
  function solo(geo,m,x,y,z,sh){var me=new T.Mesh(geo,m);me.position.set(x,y,z);me.castShadow=sh!==false;me.receiveShadow=true;root.add(me);return me}

  /* socle de la maquette */
  (function(){var s=new T.Shape(),bw=70,bd=52,r=7;s.moveTo(-bw+r,-bd);s.lineTo(bw-r,-bd);s.quadraticCurveTo(bw,-bd,bw,-bd+r);s.lineTo(bw,bd-r);s.quadraticCurveTo(bw,bd,bw-r,bd);s.lineTo(-bw+r,bd);s.quadraticCurveTo(-bw,bd,-bw,bd-r);s.lineTo(-bw,-bd+r);s.quadraticCurveTo(-bw,-bd,-bw+r,-bd);
    var g=new T.ExtrudeGeometry(s,{depth:2.6,bevelEnabled:false,curveSegments:10});g.rotateX(Math.PI/2);var me=new T.Mesh(g,mGround);me.receiveShadow=true;root.add(me)})();

  /* zones : paddocks, carrières, allées, parking */
  var Z={manege:[-22,-44,20,-22],honneur:[26,-44,64,-16],petite:[32,-8,60,8],haut:[-64,-46,-28,-24],poneys:[-64,-18,-42,2],hiver:[-64,6,-42,24],bas:[-64,32,-8,46],soins:[2,32,13,44],parking:[34,32,64,46]};
  ['haut','poneys','hiver','bas','soins'].forEach(function(k){slab(mGrass,Z[k]);fence(Z[k])});
  slab(mSand,Z.manege,.12);slab(mSand,Z.honneur,.12);fence(Z.honneur);slab(mSand,Z.petite,.12);fence(Z.petite);slab(mPath,Z.parking,.06);
  [[-41,-17,25,-12],[21,-46,25,-17],[26,-12,30,50],[-41,9,26,14],[-41,-12,-38,30],[-38,-6,-36,6]].forEach(function(r){slab(mPath,r,.05)});
  /* écurie principale, petite écurie, boxes de cour : allées et charpentes */
  slab(mConc,[-36,-2,12,2],.09);gable(-36,12,0,6.15,2.7,5,4,1.9);
  slab(mConc,[-36,20,-4,24],.09);gable(-36,-4,22,6.15,2.7,4.8,4,1.9);
  (function(){for(var x=2;x<=26.01;x+=4){ln(x,3.1,28.1,x,2.5,21.6);ln(x,0,21.6,x,2.5,21.6)}ln(2,3.1,28.1,26,3.1,28.1);ln(2,2.5,21.6,26,2.5,21.6);quad([2,3.1,28.1],[26,3.1,28.1],[26,2.5,21.6],[2,2.5,21.6]);slab(mConc,[2,21.4,26,24],.07)})();
  /* sellerie et club-house */
  blk(mWall,18,0,-3,12,3.7,6);blk(mAlt,18,3.7,-3,12.7,.26,6.7);blk(mWall,18,0,3,12,3,6);blk(mAlt,18,3,3.3,12.7,.26,7.2);
  blk(mWin,18,1.1,6.03,5.4,1.5,.08,0,true);blk(mWin,24.03,1.4,-3,.08,1.2,3.4,0,true);blk(mWin,21.6,0,6.03,1.2,2.2,.08,0,true);blk(mWin,24.03,1.2,3,.08,1.4,2.6,0,true);
  /* grand manège : pare-bottes, poteaux, charpente, toit coupé */
  (function(){var r=Z.manege,x;blk(mWall,-1,0,r[1],42,1.5,.28);blk(mWall,-1,0,r[3],42,1.5,.28);blk(mWall,r[0],0,-33,.28,1.5,22);blk(mWall,r[2],0,-33,.28,1.5,22);
    for(x=r[0];x<=r[2]+.01;x+=7){blk(mWall,x,0,r[1],.42,5,.42);blk(mWall,x,0,r[3],.42,5,.42)}
    gable(r[0],r[2],-33,11,5,8.2,7,5);var a=Math.atan(3.2/11),len=Math.sqrt(121+3.2*3.2);
    [[-1,-a],[1,a]].forEach(function(q){var me=new T.Mesh(unit,mWall2);me.scale.set(14.4,.2,len+.5);me.position.set(-15,6.62,-33+q[0]*5.5);me.rotation.x=q[1];me.castShadow=true;me.receiveShadow=true;root.add(me)})})();
  /* rond de longe */
  (function(){var cx=46,cz=20,R=7,i;solo(new T.CylinderGeometry(R,R,.12,48),mSand,cx,.06,cz,false);solo(new T.CylinderGeometry(R,R,1.5,48,1,true),mWall2,cx,.75,cz);
    for(i=0;i<12;i++){var a=i/12*6.283,b=(i+1)/12*6.283,x=cx+Math.cos(a)*R,z=cz+Math.sin(a)*R;ln(x,1.5,z,x,3.7,z);ln(x,3.7,z,cx,5.5,cz);ln(x,3.7,z,cx+Math.cos(b)*R,3.7,cz+Math.sin(b)*R)}})();
  /* hangar à foin, silo */
  (function(){var x,z;for(x=15.5;x<=24.6;x+=4.5)for(z=35.5;z<=43.6;z+=8)blk(mWall,x,0,z,.32,4.1,.32);blk(mAlt,20,4.1,39.5,10.6,.24,9.6);
    var bg=new T.CylinderGeometry(.78,.78,1.25,14);bg.rotateZ(Math.PI/2);[[17,.78,37.4],[18.5,.78,37.4],[20,.78,37.4],[17,.78,39.2],[18.5,.78,39.2],[20,.78,39.2],[17.7,2.1,38.3],[19.3,2.1,38.3],[22.4,.78,41.6],[22.4,.78,39.8]].forEach(function(p){solo(bg,mHay,p[0],p[1],p[2])});
    solo(new T.CylinderGeometry(1.7,1.7,5.4,24),mAlt,21.5,4,31);solo(new T.ConeGeometry(1.74,1.3,24),mWall,21.5,7.35,31);[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(q){blk(mTrunk,21.5+q[0]*1.1,0,31+q[1]*1.1,.16,1.4,.16)})})();
  /* obstacles, lettres de dressage, parking, portail */
  function jump(x,z,ry,w){w=w||3.4;var c=Math.cos(ry),s=Math.sin(ry);[-1,1].forEach(function(k){blk(mWall,x+c*k*w/2,0,z-s*k*w/2,.3,1.7,.3,ry)});blk(mAcc,x,.55,z,w,.14,.14,ry);blk(mWall,x,.98,z,w,.14,.14,ry)}
  jump(45,-30,.4);jump(39.5,-27,1.3);jump(50.5,-33,-.6);jump(46,-25.5,0,2.6);
  [[32.6,0],[46,-7.4],[59.4,0],[46,7.4],[39,-7.4],[53,-7.4],[39,7.4],[53,7.4]].forEach(function(p){blk(mWall,p[0],0,p[1],.5,.6,.5)});
  (function(){var i;for(i=0;i<8;i++)blk(mFence,36.5+i*3.4,.06,35.6,.12,.02,5,0,true);
    [[38.2,35.6,0],[45,35.4,0],[48.4,35.8,0],[55.2,35.5,0]].forEach(function(c){blk(mCar,c[0],.32,c[1],1.9,.8,4.3,c[2]);blk(mWin,c[0],1.12,c[1]+.25,1.72,.62,2.2,c[2])});
    blk(mWall,58.5,.5,41.6,2.5,2.7,6.6);blk(mAlt,58.5,.5,37.2,2.4,2.1,1.9);blk(mWin,58.5,1.7,36.24,2,.8,.06,0,true);blk(mAlt,52.6,.4,41.8,2.1,2,4.6);blk(mCar,52.6,.4,38.9,1.9,1.4,1);
    blk(mWall,25.3,0,50.4,.9,2.5,.9);blk(mWall,30.7,0,50.4,.9,2.5,.9);blk(mAlt,28,1.1,50.4,4.5,.12,.12);blk(mAlt,28,1.7,50.4,4.5,.12,.12)})();
  /* tilleuls */
  var trees=[[-30,11.5],[-18,11.5],[-6,11.5],[6,11.5],[18,11.5],[36,49.3],[42,49.3],[48,49.3],[54,49.3],[60,49.3],[-67,-40],[-67,-28],[-67,-12],[-67,2],[-67,16],[-67,30],[-67,44],[57,24],[61,16],[-3,39],[-25,-48.6],[-12,-48.6],[2,-48.6],[16,-48.6],[66,-8],[66,4]];
  (function(){var g=new T.IcosahedronGeometry(1,0),im=new T.InstancedMesh(g,mTree,trees.length),r=rng(77);trees.forEach(function(t,i){var s=.85+r()*.4;blk(mTrunk,t[0],0,t[1],.36,2.4,.36);dm.position.set(t[0],2.2+2.3*s,t[1]);dm.scale.set(2.2*s,2.7*s,2.2*s);dm.rotation.set(0,r()*6,0);dm.updateMatrix();im.setMatrixAt(i,dm.matrix)});im.castShadow=true;im.receiveShadow=true;root.add(im)})();
  /* caméras : boîtier, champ de vision, pastille cliquable */
  var cones=new T.Group();cones.visible=false;root.add(cones);var labs=[];
  function lab(cls,html,x,y,z,tag){var e=document.createElement(tag||'span');e.className=cls;e.innerHTML=html;ov.appendChild(e);var L={e:e,v:new T.Vector3(x,y,z),z:/e3-zl/.test(cls),bd:/ bd/.test(cls),s2:/ s2/.test(cls)};labs.push(L);return L}
  D.cameras.forEach(function(c0){var c=camOf(c0.id),x=c.pos[0],z=c.pos[1],full=c.sc==='box';
    var hy=c.hy||(full?2.3:3.3);if(!full&&!c.hy)blk(mTrunk,x,0,z,.14,3.3,.14);blk(mAcc,x,hy,z,.46,.36,.86,Math.PI/2-c.dir);
    var cg=full?new T.CircleGeometry(2.7,28):new T.CircleGeometry(c.rng,24,-c.dir-c.fov/2,c.fov);cg.rotateX(-Math.PI/2);var cm=new T.Mesh(cg,mCone);cm.position.set(x,full?.34:.2,z);cones.add(cm);
    var L=lab('e3-camb'+(c.alert?' al':''),ICON('camera'),x,hy+1,z,'button');L.e.title=c.name;L.e.setAttribute('data-cam',c.id);L.e.onclick=function(){o.onCam&&o.onCam(c.id,L.e)}});
  flush();
  /* charpentes filaires et verrières */
  (function(){var g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(LP,3));root.add(new T.LineSegments(g,mLine));
    var q=new T.BufferGeometry();q.setAttribute('position',new T.Float32BufferAttribute(GP,3));var me=new T.Mesh(q,mGlass);me.renderOrder=2;root.add(me)})();
  var grid=(function(){var p=[],i;for(i=-68;i<=68;i+=2)p.push(i,.16,-50,i,.16,50);for(i=-50;i<=50;i+=2)p.push(-68,.16,i,68,.16,i);var g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));var l=new T.LineSegments(g,mGrid);l.visible=false;root.add(l);return l})();
  [['Grand manège',-1,9,-33],['Carrière d’honneur',45,2.5,-41],['Petite carrière',46,2.5,-5],['Rond de longe',46,6.3,20,2],['Écurie principale',-12,6,0,1],['Petite écurie',-20,5.8,22,1],['Boxes de cour',14,4,26,3],['Sellerie',17,4.4,3,2],['Prairie du haut',-46,2.2,-42],['Paddock des poneys',-53,2.2,-14],['Paddock d’hiver',-53,2.2,10],['Prairie du bas',-36,2.2,42],['Paddock de soins',7.5,2.2,41,2],['Hangar à foin',20,5.2,40,2],['Parking',52,1.5,44.5]].forEach(function(z){lab('e3-zl'+(z[4]&1?' bd':'')+(z[4]&2?' s2':''),z[0],z[1],z[2],z[3])});

  /* boxes : coque partagée, sol coloré selon l'état */
  function merge(parts){var pos=[],nor=[],idx=[],base=0;parts.forEach(function(p){var g=new T.BoxGeometry(p[0],p[1],p[2]);g.translate(p[3],p[4],p[5]);var a=g.attributes.position.array,n=g.attributes.normal.array,ix=g.index.array,i;for(i=0;i<a.length;i++){pos.push(a[i]);nor.push(n[i])}for(i=0;i<ix.length;i++)idx.push(ix[i]+base);base+=a.length/3;g.dispose()});
    var G=new T.BufferGeometry();G.setAttribute('position',new T.Float32BufferAttribute(pos,3));G.setAttribute('normal',new T.Float32BufferAttribute(nor,3));G.setIndex(idx);return G}
  var shellGeo=merge([[4,1.9,.16,0,.95,-1.92],[.16,1.35,3.84,-1.92,.675,0],[.16,1.35,3.84,1.92,.675,0],[1.3,1.15,.16,-1.35,.575,1.92],[1.3,1.15,.16,1.35,.575,1.92],[1.42,1,.09,0,.5,1.85],[.2,1.9,.2,-.72,.95,1.92],[.2,1.9,.2,.72,.95,1.92]]);
  var floorGeo=new T.BoxGeometry(3.7,.16,3.7);floorGeo.translate(0,.17,0);
  var bobj={},pick=[],mode=o.mode||'occ',iso=null,t0=performance.now(),intro=!RM;
  function addObj(b,fresh){var g=new T.Group();g.position.set(b.x,0,b.z);g.rotation.y=b.rot*Math.PI/2;
    var s=new T.Mesh(shellGeo,mWall);s.castShadow=true;s.receiveShadow=true;var fm=new T.MeshLambertMaterial(),f=new T.Mesh(floorGeo,fm);f.receiveShadow=true;
    s.userData.box=f.userData.box=b.id;g.add(s);g.add(f);root.add(g);pick.push(s,f);
    var L=lab('e3-bl',E(b.name),b.x,2.9,b.z);
    bobj[b.id]={g:g,fm:fm,s:s,f:f,to:new T.Color(),em:new T.Color(),L:L,delay:fresh?0:(.55+Math.hypot(b.x+36,b.z+6)/85),pop:fresh?0:1};
    fm.color.copy(neutral());if(fresh)g.scale.setScalar(.01)}
  function neutral(){return mix('surface','line-2',dark?.55:.5)}
  function paint(){boxes().forEach(function(b){var ob=bobj[b.id];if(!ob)return;var k=catOf(b,mode),tk=catDef(mode,k)[2],c=tk==='line-2'?neutral():col(tk),dim=iso&&k!==iso;
      if(dim)c.lerp(neutral(),.86);ob.to.copy(c);ob.em.copy(c).multiplyScalar(tk==='line-2'||dim?0:(dark?.32:.06))});anim=1;dirty=true}
  boxes().forEach(function(b){addObj(b)});

  /* chevaux : un seul maillage instancié, quatre chevaux au travail animés */
  var hMesh=null,wMesh=null,wGeo=null,wV=null,HS=1.75,workers=[],PADK=['bas','poneys','hiver','haut','soins','haut'];
  if(window.HORSE){(function(){var V=new Float32Array(HORSE.n*3);HORSE.lerp(.15,V);var g0=new T.BufferGeometry();g0.setAttribute('position',new T.BufferAttribute(V,3));g0.setIndex(Array.prototype.slice.call(HORSE.idx));
    var hg=g0.toNonIndexed();hg.computeVertexNormals();hMesh=new T.InstancedMesh(hg,mHorse,72);hMesh.castShadow=true;hMesh.frustumCulled=false;root.add(hMesh);
    wGeo=hg.clone();wMesh=new T.InstancedMesh(wGeo,mHorse,12);wMesh.frustumCulled=false;root.add(wMesh);wV=new Float32Array(HORSE.n*3)})()}
  function syncHorses(){if(!hMesh)return;var n=0;workers=[];
    boxes().forEach(function(b,i){var oc=occ(b);if(!oc||n>=72)return;var r=rng(i*97+13),a=r()*6.283;
      if(b.where==='pad'){var R=Z[PADK[Math.max(0,D.club.paddocks.indexOf(oc.h?oc.h.paddock:''))]]||Z.haut;dm.position.set(R[0]+3+r()*(R[2]-R[0]-6),.1,R[1]+3+r()*(R[3]-R[1]-6))}
      else if(b.where==='work'){if(workers.length<12)workers.push(b);return}
      else dm.position.set(b.x+(r()-.5)*.5,.25,b.z+(r()-.5)*.5);
      dm.rotation.set(0,a,0);dm.scale.setScalar(HS);dm.updateMatrix();hMesh.setMatrixAt(n++,dm.matrix)});
    hMesh.count=n;hMesh.instanceMatrix.needsUpdate=true;wMesh.count=workers.length;moveWorkers(0);shadowDirty=true;dirty=true}
  function moveWorkers(t){if(!wMesh||!workers.length)return;workers.forEach(function(b,i){var a=t*.09+i*6.283/workers.length;dm.position.set(45+Math.cos(a)*15,.12,-30+Math.sin(a)*10);dm.rotation.set(0,Math.atan2(-Math.sin(a)*15,Math.cos(a)*10),0);dm.scale.setScalar(HS);dm.updateMatrix();wMesh.setMatrixAt(i,dm.matrix)});wMesh.instanceMatrix.needsUpdate=true}
  function gait(t){if(!wGeo)return;HORSE.lerp(t*.55,wV);var p=wGeo.attributes.position.array,ix=HORSE.idx;for(var k=0;k<ix.length;k++){var s=ix[k]*3,d=k*3;p[d]=wV[s];p[d+1]=wV[s+1];p[d+2]=wV[s+2]}wGeo.attributes.position.needsUpdate=true;wGeo.computeVertexNormals()}

  /* lumière douce de maquette */
  var hemi=new T.HemisphereLight(0xffffff,0xffffff,.62);sc.add(hemi);
  var sun=new T.DirectionalLight(0xffffff,.46);sun.position.set(64,120,58);sun.castShadow=true;(function(s){var m=mob?1024:2048;s.mapSize.set(m,m);s.camera.left=-96;s.camera.right=96;s.camera.top=84;s.camera.bottom=-84;s.camera.near=20;s.camera.far=340;s.bias=-.0005;s.normalBias=.06})(sun.shadow);sc.add(sun);sc.add(sun.target);
  function lights(){hemi.groundColor.copy(mGround.color);hemi.intensity=dark?.7:.62;sun.intensity=dark?.55:.46}lights();

  /* sélection, survol, cibles */
  var selG=new T.BoxGeometry(4.2,2.5,4.2);selG.translate(0,1.3,0);var edg=new T.EdgesGeometry(selG);
  var selM=new T.Mesh(selG,mSel);selM.add(new T.LineSegments(edg,mSelL));selM.visible=false;selM.renderOrder=3;root.add(selM);
  var hovL=new T.LineSegments(edg,mHov);hovL.visible=false;root.add(hovL);
  var targets=new T.Group();root.add(targets);
  var sel=null,hover=null,builder=false,pickFrom=null;

  /* caméra orbitale */
  var view='persp',K=Math.tan(15*Math.PI/180);
  function camSet(s){var r=s.rp*K/Math.tan(s.fov*Math.PI/360),sp=Math.sin(s.ph);cam.fov=s.fov;cam.aspect=W/H;cam.updateProjectionMatrix();cam.position.set(s.tx+r*sp*Math.sin(s.th),r*Math.cos(s.ph),s.tz+r*sp*Math.cos(s.th));cam.lookAt(s.tx,0,s.tz);cam.updateMatrixWorld()}
  /* cadre une zone [x0,z0,x1,z1] en tenant compte des barres d'outils posées sur la scène */
  function frameOn(bb,th,ph,fov){var s={th:th,ph:ph,rp:220,tx:(bb[0]+bb[2])/2,tz:(bb[1]+bb[3])/2,fov:fov||30},v=new T.Vector3(),xr=1-2*(mob?10:18)/W,yM=1-2*(mob?112:66)/H,ym=-1+2*(mob?150:60)/H;
    for(var it=0;it<7;it++){camSet(s);var x0=9,x1=-9,y0=9,y1=-9;[[bb[0],bb[1]],[bb[2],bb[1]],[bb[0],bb[3]],[bb[2],bb[3]]].forEach(function(c){[0,5].forEach(function(y){v.set(c[0],y,c[1]).project(cam);x0=Math.min(x0,v.x);x1=Math.max(x1,v.x);y0=Math.min(y0,v.y);y1=Math.max(y1,v.y)})});
      var dx=((x0+x1)/2)*s.rp*K*(W/H),dy=((y0+y1)/2-(yM+ym)/2)*s.rp*K/Math.max(.3,Math.cos(s.ph));
      s.tx+=Math.cos(s.th)*dx-Math.sin(s.th)*dy;s.tz+=-Math.sin(s.th)*dx-Math.cos(s.th)*dy;s.rp*=Math.max((x1-x0)/(2*xr),(y1-y0)/(yM-ym))}
    return s}
  var ALL=[-70,-52,70,52],BARNS=[-40,-10,30,31];
  function home(){return mob?frameOn(BARNS,-1.32,.74):frameOn(ALL,-.2,.76)}
  var goal=home(),cur={th:goal.th-1.15,ph:.16,rp:goal.rp*1.9,tx:goal.tx,tz:goal.tz,fov:30},touched=false;if(RM)cur=home();
  var RMIN=24,RMAX=520;
  function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
  function applyCam(){camSet(cur)}
  function pan(dx,dy){var s=2*goal.rp*K/H,c=Math.cos(goal.th),sn=Math.sin(goal.th),f=dy*s/Math.max(.4,Math.cos(goal.ph));
    goal.tx=clamp(goal.tx-c*dx*s-sn*f,-70,70);goal.tz=clamp(goal.tz+sn*dx*s-c*f,-54,54)}

  var ptr=new Map(),drag=null,moved=0,ray=new T.Raycaster(),ndc=new T.Vector2(),plane=new T.Plane(new T.Vector3(0,1,0),0),tmp=new T.Vector3(),lastMove=null;
  function setNdc(e){var r=cv.getBoundingClientRect();ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height)*2+1)}
  function hit(e){setNdc(e);ray.setFromCamera(ndc,cam);var h=ray.intersectObjects(pick,false);return h.length?h[0].object.userData.box:null}
  function ground(e){setNdc(e);ray.setFromCamera(ndc,cam);return ray.ray.intersectPlane(plane,tmp)?tmp.clone():null}
  function pdist(){var a=Array.from(ptr.values());return {d:Math.hypot(a[0].x-a[1].x,a[0].y-a[1].y),x:(a[0].x+a[1].x)/2,y:(a[0].y+a[1].y)/2}}
  function collide(b){return boxes().some(function(q){return q!==b&&Math.abs(q.x-b.x)<3.95&&Math.abs(q.z-b.z)<3.95})}
  function place(b){var ob=bobj[b.id];if(!ob)return;ob.g.position.set(b.x,0,b.z);ob.g.rotation.y=b.rot*Math.PI/2;ob.L.v.set(b.x,2.9,b.z);if(sel===b.id)selM.position.set(b.x,0,b.z);shadowDirty=true;dirty=true;camMoved=true}
  cv.addEventListener('pointerdown',function(e){try{cv.setPointerCapture(e.pointerId)}catch(x){}ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=0;intro=false;touched=true;
    if(ptr.size===1){var id=builder?hit(e):null;if(id){var b=boxById(id),gp=ground(e);drag={t:'box',b:b,ox:b.x,oz:b.z,dx:gp?gp.x-b.x:0,dz:gp?gp.z-b.z:0};if(o.onPick)o.onPick(id)}
      else drag={t:(e.button===2||e.shiftKey||view==='top')?'pan':'rot'}}
    else if(ptr.size===2){var q=pdist();drag={t:'pinch',d:q.d,x:q.x,y:q.y}}
    if(o.onDown)o.onDown()});
  cv.addEventListener('pointermove',function(e){var p=ptr.get(e.pointerId);if(!p){lastMove=e;return}
    var dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;moved+=Math.abs(dx)+Math.abs(dy);if(!drag)return;
    if(drag.t==='rot'){goal.th-=dx*.0062;goal.ph=clamp(goal.ph-dy*.005,.06,1.38)}
    else if(drag.t==='pan')pan(dx,dy);
    else if(drag.t==='pinch'&&ptr.size>1){var q=pdist();goal.rp=clamp(goal.rp*drag.d/Math.max(1,q.d),RMIN,RMAX);pan(q.x-drag.x,q.y-drag.y);drag.d=q.d;drag.x=q.x;drag.y=q.y}
    else if(drag.t==='box'){var gp=ground(e);if(gp&&moved>4){var b=drag.b;b.x=clamp(Math.round(gp.x-drag.dx),-66,66);b.z=clamp(Math.round(gp.z-drag.dz),-48,48);place(b);syncHorses();drag.bad=collide(b);mSel.color.copy(col(drag.bad?'bad':'acc'));mSelL.color.copy(mSel.color)}}});
  function up(e){ptr.delete(e.pointerId);var d=drag;if(!d)return;
    if(d.t==='box'){mSel.color.copy(col('acc'));mSelL.color.copy(mSel.color);var b=d.b,ch=b.x!==d.ox||b.z!==d.oz;
      if(d.bad){b.x=d.ox;b.z=d.oz;place(b);syncHorses();if(o.onMove)o.onMove(b,false)}else if(ch&&o.onMove)o.onMove(b,true,d.ox,d.oz)}
    else if(moved<7&&d.t!=='pinch'){var id=hit(e);if(o.onPick)o.onPick(id)}
    drag=ptr.size?{t:'rot'}:null}
  cv.addEventListener('pointerup',up);cv.addEventListener('pointercancel',up);
  cv.addEventListener('pointerleave',function(){lastMove=null;setHover(null)});
  cv.addEventListener('wheel',function(e){e.preventDefault();intro=false;touched=true;goal.rp=clamp(goal.rp*Math.exp(e.deltaY*.0013),RMIN,RMAX)},{passive:false});
  cv.addEventListener('contextmenu',function(e){e.preventDefault()});
  function setHover(id){if(hover===id)return;hover=id;var b=id&&boxById(id);hovL.visible=!!b&&id!==sel;if(b)hovL.position.set(b.x,0,b.z);cv.style.cursor=b?'pointer':'';dirty=true;if(o.onHover)o.onHover(id)}

  var ro=new ResizeObserver(function(){var w=host.clientWidth,h=host.clientHeight;if(!w||!h||(w===W&&h===H))return;W=w;H=h;ren.setSize(W,H,false);if(!touched&&view==='persp'){var hh=home();Object.keys(hh).forEach(function(p){goal[p]=hh[p]})}applyCam();dirty=true;camMoved=true});ro.observe(host);
  function retheme(){chk();mats.forEach(function(m){m.color.copy(m.userData.fn())});lights();boxes().forEach(function(b){var ob=bobj[b.id];if(ob)ob.fm.color.copy(neutral())});paint();shadowDirty=true;dirty=true}
  var mo=new MutationObserver(retheme);mo.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});
  var mq=matchMedia('(prefers-color-scheme:dark)');if(mq.addEventListener)mq.addEventListener('change',retheme);

  var dirty=true,camMoved=true,shadowDirty=true,shN=0,anim=1,last=performance.now(),pv=new T.Vector3();
  function overlays(){var near=H/(2*cur.rp*K)>5.4;ov.classList.toggle('near',near);ov.classList.toggle('far',H/(2*cur.rp*K)<4.7);
    labs.forEach(function(L){pv.copy(L.v).project(cam);var vis=pv.z<1&&pv.x>-1.1&&pv.x<1.1&&pv.y>-1.1&&pv.y<1.1;if(!vis){if(L.e.style.display!=='none')L.e.style.display='none';return}if(L.e.style.display)L.e.style.display='';
      L.px=(pv.x*.5+.5)*W;L.py=(-pv.y*.5+.5)*H;L.e.style.translate=L.px.toFixed(1)+'px '+L.py.toFixed(1)+'px'});
    /* étiquettes de zones : on masque celles qui se chevauchent ou sortent du cadre (priorité à l'ordre de déclaration) */
    var far=ov.classList.contains('far'),cm=ov.classList.contains('cams'),placed=[];
    labs.forEach(function(L){if(!L.z)return;if(L.e.style.display==='none'||(near&&L.bd)||(far&&L.s2)){L.e.classList.remove('e3-hid');return}
      if(!L.w){L.w=L.e.offsetWidth;L.h=L.e.offsetHeight}if(!L.w)return;
      var x0=L.px-L.w/2-3,y0=L.py-10-(cm&&L.bd?34:0)-3,r={a:x0,b:y0,c:x0+L.w+6,d:y0+L.h+6},bad=r.a<2||r.c>W-(W<560?56:2)||placed.some(function(q){return r.a<q.c&&r.c>q.a&&r.b<q.d&&r.d>q.b});
      L.e.classList.toggle('e3-hid',bad);if(!bad)placed.push(r)})}
  function frame(now){if(!alive)return;if(!host.isConnected){api.dispose();return}requestAnimationFrame(frame);
    var dt=Math.min(.1,(now-last)/1000),t=(now-t0)/1000;last=now;if(W<2||H<2)return;
    if(lastMove&&!drag&&!ptr.size){var id=hit(lastMove);lastMove=null;setHover(id)}
    var k=RM?1:1-Math.exp(-dt/(intro&&t<3?.42:.11)),mv=false;
    ['th','ph','rp','tx','tz','fov'].forEach(function(p){var d=goal[p]-cur[p];if(Math.abs(d)>1e-4){cur[p]+=d*k;mv=true}});
    if(mv){applyCam();camMoved=true}
    if(anim>0){var busy=false,kc=RM?1:1-Math.exp(-dt/.16);boxes().forEach(function(b){var ob=bobj[b.id];if(!ob)return;
        if(ob.pop<1){ob.pop=Math.min(1,ob.pop+dt*3.2);var e=1-Math.pow(1-ob.pop,3);ob.g.scale.setScalar(.01+.99*(e+.18*Math.sin(ob.pop*3.1416)));busy=true;shadowDirty=true}
        if(intro&&t<ob.delay){busy=true;return}
        var c=ob.fm.color,to=ob.to;if(Math.abs(c.r-to.r)+Math.abs(c.g-to.g)+Math.abs(c.b-to.b)>.004){c.lerp(to,kc);ob.fm.emissive.lerp(ob.em,kc);busy=true}else{c.copy(to);ob.fm.emissive.copy(ob.em)}});
      anim=busy?1:0;dirty=true}
    var live=!RM&&workers.length>0;if(live){moveWorkers(t);gait(t)}
    if(pickFrom){mPick.opacity=.22+.2*Math.sin(t*5);dirty=true}
    if(!(dirty||mv||live))return;
    if(shadowDirty){shN=3;shadowDirty=false}if(shN>0){ren.shadowMap.needsUpdate=true;shN--;dirty=true}
    ren.render(sc,cam);dirty=shN>0;
    if(camMoved){overlays();camMoved=false;if(o.onFrame)o.onFrame()}}

  var api={
    select:function(id,quiet){sel=id||null;var b=sel&&boxById(sel);selM.visible=!!b;if(b){selM.position.set(b.x,0,b.z);hovL.visible=false;if(!quiet&&!builder){goal.tx=b.x;goal.tz=b.z;goal.rp=Math.min(goal.rp,mob?92:128)}}dirty=true;camMoved=true},
    hover:function(id){var b=id&&boxById(id);hovL.visible=!!b&&id!==sel;if(b)hovL.position.set(b.x,0,b.z);dirty=true},
    setMode:function(m){mode=m;iso=null;cones.visible=m==='cam';ov.classList.toggle('cams',m==='cam');paint()},
    setIso:function(k){iso=k;paint()},
    setView:function(v){view=v;intro=false;var h=v==='top'?frameOn(mob?BARNS:ALL,mob?-Math.PI/2:0,.02,13):home();Object.keys(h).forEach(function(p){goal[p]=h[p]});applyCam()},
    zoom:function(f){intro=false;touched=true;goal.rp=clamp(goal.rp*f,RMIN,RMAX)},
    recenter:function(){intro=false;touched=false;if(view==='top'){api.setView('top');return}var h=home();Object.keys(h).forEach(function(p){goal[p]=h[p]});cur.th=((cur.th+Math.PI)%(2*Math.PI)+2*Math.PI)%(2*Math.PI)-Math.PI;applyCam()},
    setBuilder:function(on){builder=on;grid.visible=on;intro=false;if(on){touched=true;var h=frameOn(BARNS,goal.th,Math.min(goal.ph,.66),goal.fov);Object.keys(h).forEach(function(p){goal[p]=h[p]});applyCam()}dirty=true;camMoved=true},
    setPick:function(from){pickFrom=from;while(targets.children.length)targets.remove(targets.children[0]);if(from)boxes().forEach(function(b){if(b.id===from)return;var free=!occ(b);if(!free)return;var m=new T.Mesh(selG,mPick);m.position.set(b.x,0,b.z);targets.add(m)});dirty=true},
    addBox:function(b){addObj(b,true);paint();anim=1;shadowDirty=true;camMoved=true},
    removeBox:function(id){var ob=bobj[id];if(!ob)return;root.remove(ob.g);pick=pick.filter(function(m){return m.userData.box!==id});ob.L.e.remove();labs.splice(labs.indexOf(ob.L),1);ob.fm.dispose();delete bobj[id];if(sel===id)api.select(null);shadowDirty=true;dirty=true},
    place:place,
    rename:function(b){var ob=bobj[b.id];if(ob)ob.L.e.textContent=b.name},
    refresh:function(){paint();syncHorses()},
    project:function(x,y,z){pv.set(x,y,z).project(cam);return {x:(pv.x*.5+.5)*W,y:(-pv.y*.5+.5)*H,ok:pv.z<1}},
    size:function(){return {w:W,h:H}},
    dispose:function(){if(!alive)return;alive=false;ro.disconnect();mo.disconnect();if(mq.removeEventListener)mq.removeEventListener('change',retheme);
      sc.traverse(function(x){if(x.geometry)x.geometry.dispose()});mats.forEach(function(m){m.dispose()});Object.keys(bobj).forEach(function(k){bobj[k].fm.dispose()});ren.dispose();try{ren.forceContextLoss()}catch(e){}}
  };
  paint();syncHorses();applyCam();requestAnimationFrame(frame);
  return api}

/* ---------- Écran ---------- */
P.css(`
.e3-wrap{display:grid;grid-template-columns:minmax(0,1fr) 316px;gap:14px;align-items:start}
.e3-stage{position:relative;overflow:hidden;min-height:380px;background:linear-gradient(180deg,var(--surface) 0%,var(--bg-2) 100%);container:e3/inline-size;user-select:none;-webkit-user-select:none}
.e3-gl{position:absolute;inset:0}
.e3-cv{display:block;width:100%;height:100%;touch-action:none;cursor:grab;outline:none}
.e3-cv:active{cursor:grabbing}
.e3-ov{position:absolute;inset:0;pointer-events:none;overflow:hidden}
.e3-zl,.e3-bl,.e3-camb{position:absolute;left:0;top:0;will-change:translate}
.e3-zl{margin:-10px 0 0 0;transform:translateX(-50%);font:600 13px var(--f-text);letter-spacing:.07em;text-transform:uppercase;color:var(--ink-2);background:color-mix(in srgb,var(--surface) 74%,transparent);padding:3px 7px;border-radius:6px;white-space:nowrap}
.e3-bl{transform:translate(-50%,-50%);font:600 13px var(--f-mono);color:var(--ink);background:color-mix(in srgb,var(--surface) 88%,transparent);padding:1px 4px;border-radius:4px;opacity:0;transition:opacity var(--t-2);white-space:nowrap}
.e3-ov.near .e3-bl{opacity:1}
.e3-zl.bd,.e3-zl.s2{transition:opacity var(--t-2)}.e3-ov.near .e3-zl.bd,.e3-ov.far .e3-zl.s2{opacity:0}
/* les pastilles de caméra appartiennent au calque Caméras : ailleurs, seule la caméra en alerte reste visible, pour ne pas masquer les noms des bâtiments */
.e3-ov.far .e3-camb{scale:.82}.e3-ov:not(.cams) .e3-camb:not(.al){opacity:0;pointer-events:none}.e3-ov.cams .e3-zl.bd{margin-top:-44px}.e3-zl{transition:margin var(--t-3) var(--e-out),opacity var(--t-2)}.e3-camb{transition:opacity var(--t-2),scale var(--t-1)}
.e3-camb{z-index:2;margin:-13px 0 0 -13px;width:26px;height:26px;border-radius:50%;background:var(--navy);color:var(--navy-ink);display:grid;place-items:center;pointer-events:auto;box-shadow:0 0 0 3px color-mix(in srgb,var(--surface) 82%,transparent),var(--shadow-2);transition:scale var(--t-2) var(--e-spring),background var(--t-2)}
.e3-camb svg.i{width:14px;height:14px}
.e3-camb:hover{scale:1.14}
.e3-camb.al::after{content:"";position:absolute;right:-2px;top:-2px;width:9px;height:9px;border-radius:50%;background:var(--bad);box-shadow:0 0 0 2px var(--surface);animation:pulse 1.4s infinite}
.e3-ov.cams .e3-camb{background:var(--acc);color:var(--acc-ink);scale:1.12}
.e3-top{position:absolute;left:12px;right:12px;top:12px;display:flex;justify-content:space-between;align-items:flex-start;gap:8px;pointer-events:none;z-index:3}
.e3-top>*{pointer-events:auto}
.e3-glass{background:color-mix(in srgb,var(--surface) 88%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:inset 0 0 0 1px var(--line),var(--shadow-2);border-radius:var(--r-md);padding:3px;display:flex;align-items:center;gap:2px;min-width:0}
.e3-glass .seg{background:transparent;padding:0}
.e3-glass .btn{box-shadow:none;background:transparent}
.e3-glass .btn:hover{background:var(--bg-2)}
.e3-glass .sep{width:1px;height:18px;background:var(--line-2);margin:0 3px;flex:none}
.e3-leg{position:absolute;left:12px;bottom:12px;display:flex;gap:6px;flex-wrap:wrap;z-index:3;max-width:calc(100% - 24px)}
.e3-lg{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 10px;border-radius:var(--r-pill);font-size:13px;font-weight:600;color:var(--ink-2);background:color-mix(in srgb,var(--surface) 88%,transparent);backdrop-filter:blur(12px);-webkit-backdrop-filter:blur(12px);box-shadow:inset 0 0 0 1px var(--line),var(--shadow-1);transition:background var(--t-2),color var(--t-2);white-space:nowrap}
.e3-lg b{font-variant-numeric:tabular-nums;color:var(--mut);font-weight:600}
.e3-lg[aria-pressed="true"]{background:var(--navy);color:var(--navy-ink);box-shadow:var(--shadow-2)}
.e3-lg[aria-pressed="true"] b{color:inherit;opacity:.7}
.e3-st i,.e3-lg i{width:8px;height:8px;border-radius:3px;background:var(--c);flex:none;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--ink) 14%,transparent)}
.e3-tip{position:absolute;left:0;top:0;z-index:4;pointer-events:none;transform:translate(-50%,-100%);margin-top:-14px;background:var(--navy);color:var(--navy-ink);font-size:13px;font-weight:600;padding:5px 9px;border-radius:8px;white-space:nowrap;box-shadow:var(--shadow-2);display:none}
.e3-tip.on{display:block}
.e3-tip span{opacity:.7;font-weight:500}
.e3-card{position:absolute;left:0;top:0;width:296px;z-index:5;background:var(--raise);border-radius:var(--r-lg);box-shadow:var(--shadow-3),inset 0 0 0 1px var(--line);padding:14px;display:none}
.e3-card.on{display:block;animation:pop var(--t-3) var(--e-spring) both}
.e3-card h3{font-size:16px;line-height:1.2}
.e3-card .acts{display:flex;gap:6px;margin-top:12px;flex-wrap:wrap}
.e3-card .acts .btn{flex:1}
.e3-pip{position:absolute;right:12px;bottom:12px;width:min(340px,calc(100% - 24px));z-index:6;background:var(--raise);border-radius:var(--r-lg);box-shadow:var(--shadow-3),inset 0 0 0 1px var(--line);overflow:hidden;display:none}
.e3-pip.on{display:block;animation:e3pip var(--t-4) var(--e-out) both}
@keyframes e3pip{from{opacity:0;transform:translate(var(--ox,0),var(--oy,0)) scale(.12)}}
.e3-pip .vid{position:relative;border-radius:0}
.e3-pip .vid .live{position:absolute;left:8px;top:8px}
.e3-pip .ph2{display:flex;align-items:center;gap:8px;padding:8px 8px 8px 12px}
.e3-build{position:absolute;left:50%;bottom:12px;transform:translateX(-50%);z-index:6;display:none;max-width:calc(100% - 24px)}
.e3-building .e3-build{display:flex;animation:rise var(--t-3) var(--e-out) both}
.e3-building .e3-leg,.e3-building .e3-hint{display:none}
.e3-build .btn.pri{background:var(--acc);color:var(--acc-ink)}
.e3-build .btn.pri:hover{background:var(--acc-2)}
.e3-banner{position:absolute;left:50%;top:60px;transform:translateX(-50%);z-index:6;display:none;align-items:center;gap:10px;padding:8px 8px 8px 14px;border-radius:var(--r-pill);background:var(--navy);color:var(--navy-ink);font-size:13px;font-weight:600;box-shadow:var(--shadow-3);white-space:nowrap;max-width:calc(100% - 24px)}
.e3-banner.on{display:flex;animation:rise var(--t-3) var(--e-out) both}
.e3-banner .btn{background:color-mix(in srgb,var(--navy-ink) 14%,transparent);color:var(--navy-ink);box-shadow:none}
.e3-banner span{overflow:hidden;text-overflow:ellipsis}
.e3-hint{position:absolute;right:16px;top:62px;font-size:13px;color:var(--mut);z-index:2;pointer-events:none;transition:opacity var(--t-4)}
.e3-hint.off{opacity:0}
.e3-list{display:flex;flex-direction:column;min-height:0;overflow:hidden}
.e3-lh{padding:12px 12px 10px;border-bottom:1px solid var(--line);display:flex;flex-direction:column;gap:8px;flex:none}
.e3-lb{overflow-y:auto;flex:1;min-height:0;padding:0 6px 10px;scrollbar-width:thin}
.e3-gh{position:sticky;top:0;background:var(--surface);z-index:1;font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);padding:12px 8px 6px;display:flex;justify-content:space-between}
.e3-row{display:grid;grid-template-columns:38px minmax(0,1fr) auto;gap:10px;align-items:center;width:100%;text-align:left;padding:7px 8px;border-radius:var(--r-sm);transition:background var(--t-1)}
.e3-row:hover,.e3-row.hov{background:var(--surface-2)}
.e3-row[aria-current="true"]{background:var(--acc-pale)}
.e3-row b{display:block;font-size:13px;font-weight:600}
.e3-row .xs{display:block}
.e3-bn{font:600 13px var(--f-mono);height:24px;border-radius:6px;display:grid;place-items:center;background:var(--bg-2);color:var(--ink-2)}
.e3-st{display:inline-flex;align-items:center;gap:6px;font-size:13px;color:var(--mut);white-space:nowrap}
.sheet .e3-lb{padding:0;overflow:visible}
.sheet .e3-row{padding:10px 6px;min-height:52px}
.sheet .e3-gh{background:var(--surface)}
.e3-bar{display:none}
.ph [data-build][aria-pressed="true"]{background:var(--navy);color:var(--navy-ink);box-shadow:none}
.e3-opt{display:flex;align-items:center;gap:12px;width:100%;text-align:left;padding:10px 12px;border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line);transition:box-shadow var(--t-2),background var(--t-2)}
.e3-opt[aria-checked="true"]{box-shadow:inset 0 0 0 1.5px var(--acc);background:var(--acc-pale)}
.e3-opt .rd{width:18px;height:18px;border-radius:50%;box-shadow:inset 0 0 0 1.6px var(--line-2);flex:none;display:grid;place-items:center}
.e3-opt[aria-checked="true"] .rd{box-shadow:inset 0 0 0 5px var(--acc)}
@container main (max-width:1080px){.e3-wrap{grid-template-columns:minmax(0,1fr) 272px}}
@container e3 (max-width:780px){.e3-top [data-view] span{display:none}.e3-hint{display:none}}
@container main (max-width:760px){
 .e3-wrap{display:block}.e3-wrap>.e3-list{display:none}
 .e3-stage{border-radius:0;box-shadow:none}
 .e3-top{flex-direction:column;align-items:stretch;top:8px}
 .e3-top .e3-glass:first-child{overflow-x:auto;scrollbar-width:none}
 .e3-top .e3-glass:last-child{align-self:flex-end;flex-direction:column;padding:4px}
 .e3-top .e3-glass:last-child .seg{flex-direction:column}
 .e3-top .e3-glass:last-child .sep,.e3-top [data-zoom]{display:none}
 .e3-top .e3-glass .btn.icon.sm,.e3-top .e3-glass:last-child .seg button{width:40px;height:40px;padding:0;justify-content:center}
 .e3-leg{left:0;right:0;bottom:84px;max-width:none;flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;padding:0 12px}
 .e3-bar{display:flex;gap:8px;position:absolute;left:12px;right:12px;bottom:16px;z-index:4}
 .e3-bar .btn.lg{flex:1;box-shadow:var(--shadow-2),inset 0 0 0 1px var(--line)}
 .e3-bar .btn.icon{width:46px;flex:none}
 .e3-card{translate:none!important;left:12px;right:12px;top:auto;bottom:16px;width:auto;z-index:7}
 .e3-card .acts .btn{height:44px}
 .e3-pip{left:12px;right:12px;width:auto;bottom:auto;top:64px}
 .e3-build{bottom:16px;overflow-x:auto;scrollbar-width:none}
 .e3-build .btn span.t{display:none}
 .e3-building .e3-bar{display:none}
 .e3-banner{top:112px}
}
`);

var S3={mode:'occ',iso:null,sel:null,q:'',view:'persp',builder:false};
function requests(){return D.boxRequests.filter(function(r){return !r.done})}

P.mod({id:'ecurie3d',role:'gerant',group:'Écurie',title:'Plan 3D',icon:'cube',n:20,phoneTitle:'Plan de l’écurie',
 render:function(el,ctx){
  var mobile=ctx.mobile,api=null,pick=null;S3.builder=false;S3.iso=null;S3.sel=null;
  var all=boxes();
  function counts(){var c={};all.forEach(function(b){var k=catOf(b,S3.mode);c[k]=(c[k]||0)+1});return c}
  function subTxt(){var o=all.filter(occ).length,bad=all.filter(function(b){var x=occ(b);return x&&x.status==='bad'});
    return o+' boxes occupés sur '+all.length+'. '+(bad.length?(bad.length>1?bad.length+' chevaux demandent':'Un cheval demande')+' votre attention : '+bad.map(function(b){return occ(b).name+' ('+b.name+')'}).join(' et ')+'.':'Aucune alerte santé ce matin.')}
  var top='<div class="e3-top"><div class="e3-glass">'+U.seg(Object.keys(MODES).map(function(k){return [k,MODES[k][0]]}),S3.mode,'data-mode')+'</div>'+
    '<div class="e3-glass">'+U.seg([['persp',IC.persp('sm')+'<span>Perspective</span>'],['top',IC.top('sm')+'<span>Dessus</span>']],'persp','data-view')+'<span class="sep"></span>'+
    '<button class="btn icon sm" data-zoom="1.3" title="Dézoomer">'+ICON('minus','sm')+'</button><button class="btn icon sm" data-zoom=".72" title="Zoomer">'+ICON('plus','sm')+'</button><button class="btn icon sm" data-center title="Recentrer la vue">'+IC.target('sm')+'</button></div></div>';
  var stage='<div class="card e3-stage"><div class="e3-gl"></div>'+top+'<div class="e3-banner"></div><div class="e3-tip"></div><div class="e3-card"></div><div class="e3-pip"></div><div class="e3-leg"></div>'+
    '<div class="e3-hint">'+(mobile?'':'Glissez pour tourner, molette pour zoomer, clic droit pour déplacer')+'</div>'+
    '<div class="e3-build e3-glass"><button class="btn sm" data-b="add" title="Ajouter un box">'+ICON('plus','sm')+'<span class="t">Ajouter un box</span></button><button class="btn sm" data-b="rot" title="Pivoter le box">'+ICON('rotate','sm')+'<span class="t">Pivoter</span></button><button class="btn sm" data-b="ren" title="Renommer le box">'+ICON('edit','sm')+'<span class="t">Renommer</span></button><button class="btn sm" data-b="ass" title="Assigner un cheval">'+ICON('horse','sm')+'<span class="t">Assigner</span></button><button class="btn sm danger" data-b="del" title="Supprimer le box">'+ICON('trash','sm')+'</button><span class="sep"></span><button class="btn sm pri" data-b="done">'+ICON('check','sm')+'Enregistrer le plan</button></div>'+
    '<div class="e3-bar"><button class="btn lg" data-list>'+ICON('list')+'Liste des boxes<span class="chip acc">'+all.length+'</span></button><button class="btn lg icon" data-build title="Mode constructeur">'+ICON('wrench')+'</button></div></div>';
  el.innerHTML=(mobile?'':U.ph('Plan de l’écurie','<span data-sub>'+subTxt()+'</span>','<button class="btn" data-go="centre3d">'+ICON('map','sm')+'Construire mon centre</button><button class="btn" data-build>'+ICON('wrench','sm')+'Mode constructeur</button><button class="btn pri" data-assign>'+ICON('plus','sm')+'Assigner un cheval</button>'))+
    '<div class="e3-wrap">'+stage+'<aside class="card e3-list"><div class="e3-lh"><div class="search">'+ICON('search','sm')+'<input class="in" data-q placeholder="Box, cheval, propriétaire" autocomplete="off"></div></div><div class="e3-lb"></div></aside></div>';
  var $=function(s){return el.querySelector(s)},stageEl=$('.e3-stage'),gl=$('.e3-gl'),cardEl=$('.e3-card'),tipEl=$('.e3-tip'),legEl=$('.e3-leg'),pipEl=$('.e3-pip'),banEl=$('.e3-banner'),listEl=$('.e3-list .e3-lb'),view=el.closest('.view');

  /* hauteur : la maquette occupe tout l'écran disponible */
  function size(){if(!view||!el.isConnected)return;var vh=view.clientHeight;
    if(mobile){stageEl.style.margin='-6px -16px -28px';stageEl.style.height=Math.max(360,vh)+'px'}
    else{var h=Math.max(440,vh-$('.e3-wrap').offsetTop-24);stageEl.style.height=h+'px';$('.e3-list').style.height=h+'px';el.style.marginBottom='-36px'}}
  size();var vro=new ResizeObserver(function(){if(!el.isConnected){vro.disconnect();return}size()});if(view)vro.observe(view);

  function rowHtml(b){var o=occ(b),k=catOf(b,S3.mode),d=catDef(S3.mode,k);
    return '<button class="e3-row" data-box="'+b.id+'"'+(S3.sel===b.id?' aria-current="true"':'')+'><span class="e3-bn">'+E(b.name)+'</span><span style="min-width:0"><b class="ellip'+(o?'':' mut')+'">'+(o?E(o.name):'Libre')+'</b><span class="xs mut ellip">'+(o?E(o.owner):(requests().length+' demandes de pension en attente'))+'</span></span><span class="e3-st"><i style="--c:var(--'+d[2]+')"></i>'+d[1]+'</span></button>'}
  function listHtml(){var q=S3.q.toLowerCase(),h='',n=0;Object.keys(BLD).concat(['X']).forEach(function(bl){var rows=all.filter(function(b){if((b.bld||'X')!==bl)return false;if(S3.iso&&catOf(b,S3.mode)!==S3.iso)return false;if(!q)return true;var o=occ(b);return (b.name+' '+(o?o.name+' '+o.owner:'libre')).toLowerCase().indexOf(q)>=0});
      if(!rows.length)return;n+=rows.length;h+='<div class="e3-gh"><span>'+(BLD[bl]||'Nouveaux boxes')+'</span><span class="num">'+rows.length+'</span></div>'+rows.map(rowHtml).join('')});
    return h||U.empty('search','Aucun box ne correspond','Essayez un nom de cheval ou un numéro de box.')}
  function drawList(){listEl.innerHTML=listHtml();var sl=P.$('.sheet .e3-lb',P.app());if(sl)sl.innerHTML=listHtml()}
  function drawLegend(){var c=counts();legEl.innerHTML=MODES[S3.mode][1].map(function(d){return '<button class="e3-lg" data-iso="'+d[0]+'" aria-pressed="'+(S3.iso===d[0])+'" title="Afficher seulement : '+d[1]+'"><i style="--c:var(--'+d[2]+')"></i>'+d[1]+'<b>'+(c[d[0]]||0)+'</b></button>'}).join('')+(S3.mode==='cam'?'<span class="e3-lg" style="pointer-events:none">'+ICON('camera','sm')+D.cameras.length+' caméras en ligne</span>':'')}
  function refresh(){if(api)api.refresh();drawList();drawLegend();var s=$('[data-sub]');if(s)s.textContent=subTxt()}

  /* carte du box sélectionné */
  function cardHtml(b){var o=occ(b),cam=b.cam,h='';
    if(!o)return '<div class="hrow" style="--g:10px"><span class="ec-ico">'+IC.door()+'</span><div class="grow"><h3>'+E(b.name)+' est libre</h3><div class="xs mut">'+(BLD[b.bld]||'Nouveau box')+' · 3,50 × 3,50 m</div></div><button class="btn ghost icon sm" data-cx title="Fermer">'+ICON('x','sm')+'</button></div>'+
      '<p class="s mut" style="margin-top:10px">'+requests().length+' demandes de pension attendent une place.</p><div class="acts"><button class="btn sm pri" data-c="assign">'+ICON('plus','sm')+'Assigner un cheval</button></div>';
    var st=o.status==='bad'?U.chip('Urgent','bad',true):o.status==='warn'?U.chip('À surveiller','warn',true):U.chip('Rien à signaler','ok',true);
    h='<div class="hrow" style="--g:10px">'+(o.h?U.hav(o.h,'lg'):'<span class="av horse lg">'+HORSE_GLYPH()+'</span>')+'<div class="grow"><h3 class="ellip">'+E(o.name)+'</h3><div class="xs mut ellip">'+E(b.name)+' · '+(BLD[b.bld]||'Nouveau box')+'</div></div><button class="btn ghost icon sm" data-cx title="Fermer">'+ICON('x','sm')+'</button></div>'+
      '<div class="hrow wrap" style="--g:6px;margin:10px 0">'+U.chip(WHERE[b.where],b.where==='box'?'acc':'',true)+st+'</div>'+
      '<dl class="ec-kv"><dt>Propriétaire</dt><dd class="ellip">'+E(o.owner)+'</dd><dt>'+(o.h?'Race':'Séjour')+'</dt><dd class="ellip">'+E(o.h?o.sub:o.note)+'</dd>'+(b.where==='pad'&&o.h?'<dt>Paddock</dt><dd class="ellip">'+E(o.h.paddock)+'</dd>':'')+(b.where==='work'?'<dt>Reprise</dt><dd class="ellip">Propriétaires plat, 10 h</dd>':'')+'</dl>'+
      (o.alert?'<div class="note '+(o.status==='bad'?'bad':'warn')+'" style="margin-top:10px;padding:8px 10px">'+ICON('alert','sm')+'<span>'+E(o.alert)+'</span></div>':'')+
      '<div class="acts">'+(o.id?'<button class="btn sm pri" data-go="cheval" data-id="'+o.id+'">Ouvrir la fiche'+ICON('arrow','sm')+'</button>':'<button class="btn sm pri" data-go="pensions">Voir la pension'+ICON('arrow','sm')+'</button>')+
      (cam?'<button class="btn sm" data-c="cam" title="Voir la caméra du box">'+ICON('camera','sm')+'Caméra</button>':'')+'<button class="btn sm" data-c="move" title="Changer ce cheval de box">'+ICON('swap','sm')+'Déplacer</button></div>';
    return h}
  function posCard(){if(!api||!S3.sel||mobile)return;var b=boxById(S3.sel);if(!b)return;var p=api.project(b.x,2.8,b.z),s=api.size(),w=cardEl.offsetWidth,h=cardEl.offsetHeight;
    var x=p.x+46;if(x+w>s.w-12)x=p.x-w-46;x=Math.max(12,Math.min(s.w-w-12,x));var y=Math.max(62,Math.min(s.h-h-56,p.y-h*.42));cardEl.style.translate=x.toFixed(0)+'px '+y.toFixed(0)+'px'}
  function select(id,quiet){S3.sel=id||null;var hi=$('.e3-hint');if(hi)hi.classList.add('off');if(api)api.select(S3.sel,quiet);tipEl.classList.remove('on');
    var b=id&&boxById(id);cardEl.classList.remove('on');if(b&&!S3.builder){cardEl.innerHTML=cardHtml(b);void cardEl.offsetWidth;cardEl.classList.add('on');posCard()}
    stageEl.classList.toggle('e3-has',!!b);
    P.$$('.e3-row',P.app()).forEach(function(r){var on=r.getAttribute('data-box')===id;if(on){r.setAttribute('aria-current','true');if(r.closest('.e3-list'))r.scrollIntoView({block:'nearest'})}else r.removeAttribute('aria-current')});
    updBuild()}
  function updBuild(){var b=S3.sel&&boxById(S3.sel);P.$$('.e3-build [data-b]',el).forEach(function(x){var k=x.getAttribute('data-b');if(k==='rot'||k==='ren'||k==='ass'||k==='del')x.disabled=!b})}

  /* déplacer un cheval : on choisit le box d'arrivée dans la maquette */
  function startMove(id){var o=occ(boxById(id));if(!o)return;pick=id;api.setPick(id);cardEl.classList.remove('on');banEl.innerHTML='<span>Choisissez le box d’arrivée de '+E(o.name)+'</span><button class="btn sm" data-cancel>Annuler</button>';banEl.classList.add('on');banEl.querySelector('[data-cancel]').onclick=endMove}
  function endMove(){pick=null;if(api)api.setPick(null);banEl.classList.remove('on')}
  function swap(a,b){var k=['horse','guest','where'];k.forEach(function(p){var t=a[p];a[p]=b[p];b[p]=t});[a,b].forEach(function(x){if(!x.horse&&!x.guest)delete x.where})}
  function doMove(toId){var a=boxById(pick),b=boxById(toId);if(!a||!b||a===b){endMove();return}var o=occ(a),ob=occ(b);swap(a,b);endMove();refresh();select(b.id);
    P.toast(ob?E(o.name)+' et '+E(ob.name)+' ont échangé leurs boxes':E(o.name)+' est maintenant en '+E(b.name)+'. L’équipe est prévenue.',{icon:'swap',undo:function(){swap(a,b);refresh();select(a.id)}})}

  /* assigner un cheval à un box libre */
  function assign(boxId){var free=all.filter(function(b){return !occ(b)});
    if(!free.length){P.toast('Aucun box libre. Ajoutez un box en mode constructeur.',{icon:'info'});return}
    var bsel=boxId&&free.some(function(b){return b.id===boxId})?boxId:free[0].id,rq=requests(),csel=rq.length?'r:'+rq[0].id:'';
    var sh=P.sheet({title:'Assigner un cheval',icon:'horse',body:function(body){
      function draw(){body.innerHTML='<div class="ec-sec">Box d’arrivée</div><div class="hrow wrap" style="--g:6px">'+free.map(function(b){return '<button class="tag" data-manual data-bx="'+b.id+'" aria-pressed="'+(b.id===bsel)+'">'+E(b.name)+' · '+(BLD[b.bld]||'Nouveau box')+'</button>'}).join('')+'</div>'+
        '<div class="ec-sec">Demandes de pension en attente<span class="chip">'+rq.length+'</span></div><div class="stack" style="--g:8px">'+(rq.length?rq.map(function(r){return '<button class="e3-opt" role="radio" data-c="r:'+r.id+'" aria-checked="'+(csel==='r:'+r.id)+'"><span class="rd"></span><span class="av horse">'+HORSE_GLYPH()+'</span><span class="grow" style="min-width:0"><b class="s ellip" style="display:block">'+E(r.name)+'</b><span class="xs mut ellip" style="display:block">'+E(r.owner)+' · '+E(r.kind)+'</span></span><span style="text-align:right"><b class="s num">'+F.eur(r.price)+'</b><span class="xs mut" style="display:block">'+F.rel(r.from)+'</span></span></button>'}).join(''):'<p class="s mut">Aucune demande en attente.</p>')+'</div>'+
        '<div class="ec-sec">Ou déplacer un cheval déjà installé</div><select class="in" data-mv><option value="">Choisir un cheval</option>'+all.filter(occ).map(function(b){var o=occ(b);return '<option value="'+b.id+'"'+(csel==='m:'+b.id?' selected':'')+'>'+E(o.name)+' ('+E(b.name)+')</option>'}).join('')+'</select>'+
        '<div class="note" style="margin-top:16px">'+ICON('contract','sm')+'<span>Pour une nouvelle pension, Stabl prépare le contrat et la première facture en brouillon. Rien ne part sans votre accord.</span></div>';
        P.$$('[data-bx]',body).forEach(function(t){t.onclick=function(){bsel=t.getAttribute('data-bx');draw()}});
        P.$$('[data-c]',body).forEach(function(t){t.onclick=function(){csel=t.getAttribute('data-c');draw()}});
        body.querySelector('[data-mv]').onchange=function(e){csel=e.target.value?'m:'+e.target.value:'';draw()};lab()}
      function lab(){var bt=P.$('.sheet [data-ok]',P.app());if(!bt)return;var nm=csel.indexOf('r:')===0?(rq.find(function(r){return 'r:'+r.id===csel})||{}).name:csel?occ(boxById(csel.slice(2))).name:null;bt.disabled=!nm;bt.innerHTML=nm?'Installer '+E(nm)+' en '+E(boxById(bsel).name):'Choisissez un cheval'}
      draw();setTimeout(lab,0)},
      foot:'<button class="btn ghost" data-no>Annuler</button><button class="btn pri" data-ok>Installer</button>'});
    sh.querySelector('[data-no]').onclick=function(){sh.close()};
    sh.querySelector('[data-ok]').onclick=function(){var b=boxById(bsel);sh.close();
      if(csel.indexOf('r:')===0){var r=D.boxRequests.find(function(x){return 'r:'+x.id===csel});b.guest={name:r.name,breed:r.breed,owner:r.owner,kind:'proprietaire',note:r.kind+', '+F.eur(r.price)+' par mois'};b.where='box';r.done=true;refresh();select(b.id);
        P.toast(E(r.name)+' est installé en '+E(b.name)+'. Contrat de pension prêt à signer.',{undo:function(){delete b.guest;delete b.where;r.done=false;refresh();select(b.id)}})}
      else{pick=csel.slice(2);doMove(b.id)}}}

  /* mode constructeur */
  function setBuilder(on){S3.builder=on;stageEl.classList.toggle('e3-building',on);if(api)api.setBuilder(on);endMove();cardEl.classList.remove('on');if(!on&&S3.sel)select(S3.sel,true);updBuild();
    P.$$('[data-build]',el).forEach(function(b){b.setAttribute('aria-pressed',on)});
    if(on)P.toast('Mode constructeur : glissez un box pour le déplacer sur la grille',{icon:'wrench',ms:3600})}
  function nextName(){var n=all.length+1;while(all.some(function(b){return b.name==='B'+pad(n)}))n++;return 'B'+pad(n)}
  function freeSpot(){for(var z=26;z>=18;z-=4)for(var x=28;x<=36;x+=4){var t={x:x,z:z};if(!all.some(function(q){return Math.abs(q.x-t.x)<3.95&&Math.abs(q.z-t.z)<3.95}))return t}return {x:0,z:-9}}
  function build(k){var b=S3.sel&&boxById(S3.sel);
    if(k==='add'){var s=freeSpot(),nb={id:'N'+Date.now(),name:nextName(),rot:2,x:s.x,z:s.z,bld:'X'};all.push(nb);api.addBox(nb);refresh();select(nb.id,true);
      P.toast('Box '+nb.name+' ajouté. Glissez-le à sa place.',{undo:function(){all.splice(all.indexOf(nb),1);api.removeBox(nb.id);select(null);refresh()}})}
    else if(k==='rot'&&b){b.rot=(b.rot+1)%4;api.place(b);P.toast('Porte du box '+E(b.name)+' tournée d’un quart de tour',{icon:'rotate'})}
    else if(k==='ren'&&b){var sh=P.sheet({title:'Renommer le box',icon:'edit',body:'<label class="field"><span>Nom affiché sur le plan et dans les tournées</span><input class="in" data-nm maxlength="10" value="'+E(b.name)+'"></label><p class="xs mut" style="margin-top:10px">Le nom apparaît sur les étiquettes de porte et dans les feuilles de distribution.</p>',foot:'<button class="btn pri" data-ok>Renommer le box</button>'});
      var inp=sh.querySelector('[data-nm]');setTimeout(function(){inp.focus();inp.select()},60);sh.querySelector('[data-ok]').onclick=function(){var v=inp.value.trim();if(!v)return;var old=b.name;b.name=v;api.rename(b);drawList();sh.close();P.toast('Box '+E(old)+' renommé '+E(v))}}
    else if(k==='ass'&&b){if(occ(b)){P.toast(E(b.name)+' est déjà occupé par '+E(occ(b).name),{icon:'info'})}else assign(b.id)}
    else if(k==='del'&&b){if(occ(b)){P.toast('Déplacez d’abord '+E(occ(b).name)+' avant de supprimer ce box',{icon:'alert'});return}var i=all.indexOf(b);all.splice(i,1);api.removeBox(b.id);select(null);refresh();
      P.toast('Box '+E(b.name)+' supprimé du plan',{icon:'trash',undo:function(){all.splice(i,0,b);api.addBox(b);refresh()}})}
    else if(k==='done'){setBuilder(false);P.toast('Plan enregistré : '+all.length+' boxes, tournées et étiquettes mises à jour')}}

  /* caméra en incrustation, ouverte depuis sa position dans la maquette */
  function openCam(id,from){var c=camOf(id),r=stageEl.getBoundingClientRect();pipEl.classList.remove('on');
    pipEl.innerHTML='<div class="ph2"><div class="grow" style="min-width:0"><b class="s ellip" style="display:block">'+E(c.name)+'</b><span class="xs mut">'+(c.alert?E(c.alert):'Rien à signaler')+'</span></div><button class="btn sm" data-go="cameras" data-p-cam="'+c.id+'">'+ICON('expand','sm')+'Agrandir</button><button class="btn ghost icon sm" data-px title="Fermer">'+ICON('x','sm')+'</button></div><div class="vid">'+feedHtml(c.id)+'<span class="live">DIRECT</span></div>';
    void pipEl.offsetWidth;pipEl.classList.add('on');var pr=pipEl.getBoundingClientRect();
    if(from){var fr=from.getBoundingClientRect();pipEl.style.setProperty('--ox',(fr.left+14-(pr.left+pr.width/2)).toFixed(0)+'px');pipEl.style.setProperty('--oy',(fr.top+14-(pr.top+pr.height/2)).toFixed(0)+'px')}else{pipEl.style.setProperty('--ox','0px');pipEl.style.setProperty('--oy','40px')}
    pipEl.classList.remove('on');void pipEl.offsetWidth;pipEl.classList.add('on');
    feedAdd(pipEl.querySelector('canvas'),c.id);pipEl.querySelector('[data-px]').onclick=function(){pipEl.classList.remove('on');pipEl.innerHTML=''}}

  /* liste en feuille sur téléphone */
  function listSheet(){P.sheet({title:'Boxes',icon:'list',body:function(b){b.innerHTML='<div class="search" style="margin-bottom:6px">'+ICON('search','sm')+'<input class="in" data-q placeholder="Box, cheval, propriétaire" autocomplete="off"></div><div class="e3-lb">'+listHtml()+'</div>';
      b.querySelector('[data-q]').oninput=function(e){S3.q=e.target.value;b.querySelector('.e3-lb').innerHTML=listHtml()};
      b.onclick=function(e){var r=e.target.closest('.e3-row');if(r){var id=r.getAttribute('data-box');P.closeSheets();select(id)}}},
      foot:'<button class="btn pri block lg" data-as>'+ICON('plus','sm')+'Assigner un cheval</button>',onClose:function(){S3.q=''}}).querySelector('[data-as]').onclick=function(){P.closeSheets();assign()}}

  /* démarrage de la scène, après la transition d'entrée de la page pour qu'elle reste fluide */
  function start(){if(!el.isConnected||api)return;api=scene3d(gl,{mode:S3.mode,mobile:mobile,
    onPick:function(id){if(pick){if(id)doMove(id);return}select(id)},
    onHover:function(id){P.$$('.e3-row.hov',el).forEach(function(r){r.classList.remove('hov')});tipEl.classList.remove('on');if(!id||id===S3.sel)return;var b=boxById(id),o=occ(b),r=listEl.querySelector('[data-box="'+id+'"]');if(r)r.classList.add('hov');
      var p=api.project(b.x,2.8,b.z);tipEl.innerHTML=E(b.name)+' <span>· '+(o?E(o.name)+' · '+catDef(S3.mode,catOf(b,S3.mode))[1]:'Libre')+'</span>';tipEl.style.translate=p.x.toFixed(0)+'px '+p.y.toFixed(0)+'px';tipEl.classList.add('on')},
    onFrame:function(){posCard();tipEl.classList.remove('on')},
    onDown:function(){var h=$('.e3-hint');if(h)h.classList.add('off')},
    onCam:openCam,
    onMove:function(b,ok,ox,oz){if(!ok){P.toast('Cet emplacement est déjà pris par un autre box',{icon:'alert'});return}P.toast('Box '+E(b.name)+' déplacé',{icon:'check',undo:function(){b.x=ox;b.z=oz;api.place(b);api.refresh()}})}});
  if(!api){gl.innerHTML=U.empty('cube','La vue 3D n’est pas disponible sur cet appareil','La liste des boxes reste complète et à jour.');}
  else{var keep=api,chk=setInterval(function(){if(!el.isConnected){clearInterval(chk);keep.dispose()}},1500);if(S3.sel)api.select(S3.sel,true)}}
  setTimeout(start,P.RM?0:420);
  drawList();drawLegend();updBuild();

  /* événements */
  el.addEventListener('click',function(e){var t=e.target,x,hi=$('.e3-hint');if(hi&&t.closest('.e3-stage,.e3-list'))hi.classList.add('off');
    if((x=t.closest('[data-mode]'))){S3.mode=x.getAttribute('data-mode');S3.iso=null;if(api)api.setMode(S3.mode);drawList();drawLegend();return}
    if((x=t.closest('[data-view]'))){S3.view=x.getAttribute('data-view');if(api)api.setView(S3.view);return}
    if((x=t.closest('[data-zoom]'))){if(api)api.zoom(parseFloat(x.getAttribute('data-zoom')));return}
    if(t.closest('[data-center]')){if(api)api.recenter();return}
    if((x=t.closest('[data-iso]'))){var k=x.getAttribute('data-iso');S3.iso=S3.iso===k?null:k;if(api)api.setIso(S3.iso);drawList();drawLegend();return}
    if((x=t.closest('.e3-row'))){select(x.getAttribute('data-box'));return}
    if(t.closest('[data-cx]')){select(null);return}
    if((x=t.closest('[data-c]'))){var c=x.getAttribute('data-c'),b=boxById(S3.sel);if(c==='assign')assign(S3.sel);else if(c==='cam'&&b)openCam(b.cam,null);else if(c==='move')startMove(S3.sel);return}
    if((x=t.closest('.e3-build [data-b]'))){build(x.getAttribute('data-b'));return}
    if(t.closest('[data-build]')){setBuilder(!S3.builder);return}
    if(t.closest('[data-assign]')){assign(S3.sel);return}
    if(t.closest('[data-list]')){listSheet();return}});
  el.addEventListener('mouseover',function(e){var r=e.target.closest('.e3-list .e3-row');if(r&&api)api.hover(r.getAttribute('data-box'))});
  $('.e3-list').addEventListener('mouseleave',function(){if(api)api.hover(null)});
  $('.e3-list [data-q]').oninput=function(e){S3.q=e.target.value;drawList()};
  /* ouverture ciblée depuis un autre écran : data-go="ecurie3d" data-p-box="B23" ou data-id="h23" */
  var want=ctx.params.box||(ctx.params.id&&(all.find(function(b){return b.horse===ctx.params.id})||{}).id);
  if(want&&boxById(want))setTimeout(function(){if(el.isConnected)select(want)},P.RM?0:1500);
 }});

/* =====================================================================
   2 · CAMÉRAS ET CAPTEURS
   ===================================================================== */
P.css(`
.cm-lay{display:grid;grid-template-columns:minmax(0,1fr) 332px;gap:14px;align-items:start}
.cm-wall{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.cm-wall.focus{grid-template-columns:repeat(4,minmax(0,1fr))}
.cm-wall.focus .cm-tile.f{grid-column:span 3;grid-row:span 3}
.cm-tile{position:relative;display:block;border-radius:var(--r-md);overflow:hidden;background:#101216;text-align:left;box-shadow:var(--shadow-1);transition:transform var(--t-2) var(--e-out),box-shadow var(--t-2);min-width:0}
.cm-tile:hover{transform:translateY(-2px);box-shadow:var(--shadow-2)}
.cm-tile.al{box-shadow:0 0 0 2px var(--bad),var(--shadow-2)}
.cm-tile .live,.cm-player .live{position:absolute;left:8px;top:8px}
.cm-tile .cm-al{position:absolute;right:8px;bottom:26px;display:inline-flex;align-items:center;gap:5px;font-size:13px;font-weight:700;color:#fff;background:rgba(10,12,18,.72);padding:3px 8px 3px 6px;border-radius:6px;backdrop-filter:blur(6px)}
.cm-tile .cm-al svg.i{width:13px;height:13px;color:#ff8088}
.cm-name{position:absolute;left:0;right:0;top:0;padding:10px 10px 20px 82px;background:linear-gradient(to bottom,rgba(6,8,12,.62),rgba(6,8,12,0));color:#fff;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none}
.cm-ev{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;padding:11px 16px;align-items:start;cursor:pointer;transition:background var(--t-1);width:100%;text-align:left}
.cm-ev:hover{background:var(--surface-2)}
.cm-ev+.cm-ev{border-top:1px solid var(--line)}
.cm-ev .t{font-size:13px;font-weight:600;line-height:1.3}
.cm-evc{display:grid;grid-template-columns:168px minmax(0,1fr) auto;gap:14px;align-items:center;padding:12px}
.cm-evc+.cm-evc{border-top:1px solid var(--line)}
.cm-th{position:relative;border-radius:var(--r-sm);overflow:hidden;background:#101216}
.cm-th .d{position:absolute;right:5px;bottom:5px;font:500 13px var(--f-mono);color:#fff;background:rgba(8,10,16,.7);padding:1px 5px;border-radius:4px}
.cm-th .pl{position:absolute;inset:0;display:grid;place-items:center;color:#fff;opacity:0;transition:opacity var(--t-2);background:rgba(8,10,16,.35)}
.cm-evc:hover .cm-th .pl{opacity:1}
.cm-player{position:relative;border-radius:var(--r-md);overflow:hidden;background:#101216}
.cm-player .cm-rp{position:absolute;left:8px;top:8px;font-size:13px;font-weight:700;letter-spacing:.06em;color:#fff;background:var(--acc);padding:3px 7px;border-radius:5px}
.cm-ctl [hidden],.cm-player [hidden]{display:none!important}
.cm-player .fl{position:absolute;inset:0;background:#fff;opacity:0;pointer-events:none}
.cm-player .fl.go{animation:cmfl .5s var(--e-out)}
@keyframes cmfl{from{opacity:.85}to{opacity:0}}
.cm-ctl{display:flex;gap:6px;flex-wrap:wrap;margin-top:10px}
.cm-ctl .btn[aria-pressed="true"]{background:var(--navy);color:var(--navy-ink);box-shadow:none}
.cm-tl{position:relative;height:34px;border-radius:8px;background:var(--bg-2);margin-top:8px}
.cm-tl .seg2{position:absolute;top:0;bottom:0;background:color-mix(in srgb,var(--c) 26%,transparent);border-radius:4px}
.cm-tl .now{position:absolute;right:0;top:-3px;bottom:-3px;width:2px;background:var(--acc);border-radius:2px}
.cm-tl button{position:absolute;top:50%;width:22px;height:22px;margin:-11px 0 0 -11px;border-radius:50%;background:var(--surface);box-shadow:inset 0 0 0 2px var(--c),var(--shadow-1);display:grid;place-items:center;transition:scale var(--t-2) var(--e-spring)}
.cm-tl button::after{content:"";width:8px;height:8px;border-radius:50%;background:var(--c)}
.cm-tl button:hover,.cm-tl button[aria-pressed="true"]{scale:1.25}
.cm-tlx{display:flex;justify-content:space-between;font-size:13px;color:var(--mut);margin-top:5px;font-variant-numeric:tabular-nums}
.cm-act{display:flex;height:10px;border-radius:5px;overflow:hidden;gap:2px}
.cm-act i{display:block;height:100%;background:var(--c);border-radius:2px}
.cm-sens{padding:16px;display:flex;flex-direction:column;gap:10px;cursor:pointer;text-align:left;transition:transform var(--t-2) var(--e-out),box-shadow var(--t-2)}
.cm-sens:hover{transform:translateY(-2px);box-shadow:inset 0 0 0 1px var(--line-2),var(--shadow-2)}
.cm-sens .v{font:700 26px/1 var(--f-display);letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.cm-rule{display:grid;grid-template-columns:auto minmax(0,1.5fr) minmax(0,1fr) auto auto;gap:14px;align-items:center;padding:12px 16px;cursor:pointer;transition:background var(--t-1)}
.cm-rule:hover{background:var(--surface-2)}
.cm-rule+.cm-rule{border-top:1px solid var(--line)}
.cm-rule.off .cm-rn,.cm-rule.off .ec-ico{opacity:.5}
.cm-ok{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:11px 16px}
.cm-ok+.cm-ok{border-top:1px solid var(--line)}
@container main (max-width:560px){.cm-ok.w{grid-template-columns:auto minmax(0,1fr)}.cm-ok.w>.btn{grid-column:2;justify-self:start;margin:-4px 0 0 -10px}}
.cm-hero{display:flex;gap:14px;align-items:center;padding:14px 16px;margin-bottom:14px}
.cm-hero .tx{flex:1;min-width:0}
@container main (max-width:1080px){.cm-lay{grid-template-columns:minmax(0,1fr)}.cm-rule{grid-template-columns:auto minmax(0,1fr) auto}.cm-rule .hide-t{display:none}}
@container main (max-width:760px){
 .cm-wall,.cm-wall.focus{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
 .cm-wall .cm-tile.f,.cm-wall.focus .cm-tile.f{grid-column:span 2;grid-row:auto}
 .cm-name{font-size:13px;padding-left:10px;padding-top:30px;background:none;top:auto;bottom:18px;text-shadow:0 1px 3px rgba(0,0,0,.8)}
 .cm-tile.f .cm-name{font-size:13px}
 .cm-tile:not(.f) .cm-al span{display:none}
 .cm-hero{flex-direction:column;align-items:stretch}.cm-hero .hrow .btn{flex:1;height:44px}
 .cm-evc{grid-template-columns:112px minmax(0,1fr);padding:12px 0}.cm-evc .acts{grid-column:1/-1;display:flex;gap:8px}.cm-evc .acts .btn{flex:1;height:40px}
 .cm-ctl .btn{flex:1 1 40%;height:42px}
}
`);
/* ---------- Mosaïque sans case vide et surveillance de poulinage ---------- */
P.css(`
.cm-wall{grid-template-columns:repeat(var(--cols,3),minmax(0,1fr))}
.cm-wall .cm-tile.wide{grid-column:1/-1}
.cm-tile.fo{box-shadow:0 0 0 2px var(--warn),var(--shadow-2)}
.cm-tile.fo .cm-al svg.i{color:#ffc76a}
.cm-opt{display:flex;flex-direction:column;justify-content:center;align-items:flex-start;gap:6px;padding:14px;aspect-ratio:16/9;background:var(--surface);border:1.5px dashed var(--line-2);box-shadow:none;color:var(--ink);cursor:pointer}
.cm-opt:hover{border-color:var(--acc-line);box-shadow:var(--shadow-1)}
.cm-opt .ot{display:flex;align-items:center;gap:8px;font:600 13.5px var(--f-text)}
.cm-opt .ot .ec-ico{width:28px;height:28px;border-radius:8px}
.cm-opt .od{font-size:13px;color:var(--mut);line-height:1.35}
.cm-opt .oa{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--acc)}
.cm-opt .tog{pointer-events:none;transform:scale(.85);transform-origin:left center}
.cm-foal{display:flex;gap:14px;align-items:center;padding:14px 16px;margin:-2px 0 14px;border-left:3px solid var(--warn)}
.cm-foal .tx{flex:1;min-width:0}
.cm-fsig{display:grid;gap:6px}
@container main (min-width:761px) and (max-width:1180px){.cm-opt .od{display:none}}
@container main (max-width:760px){
 .cm-wall,.cm-wall.focus{grid-template-columns:repeat(2,minmax(0,1fr))}
 .cm-wall .cm-tile.wide{grid-column:auto}
 .cm-wall .cm-tile.pwide{grid-column:1/-1;order:-1}
 .cm-opt{aspect-ratio:auto;min-height:150px}
 .cm-foal{flex-direction:column;align-items:stretch}.cm-foal .hrow .btn{flex:1;height:44px}
}
`);
/* une jument est suivie dès que D.horses en contient une marquée foaling (par ce lot ou par la fiche Reproduction) */
function foalMare(){return D.horses.find(function(h){return h.foaling})}
function foalDue(m){var f=m.foaling,d=f&&typeof f==='object'&&(f.due||f.term)||m.due;return d||D.iso(D.day(12))}
function foalCam(m){var c=D.cameras.find(function(x){return x.box===m.box});
  if(!c){var b=boxById(m.box)||{x:0,z:0,rot:0};c={id:'cam'+(D.cameras.length+1),name:'Box '+m.box+' · '+m.name.split(' ')[0],box:m.box,mobile:true};D.cameras.push(c);
    CAMX[c.id]={sc:'box',horse:m.id,zone:BLD[b.bld]||'Écurie principale',kind:'Box',yaw:1.4,pos:[b.x,b.z],dir:b.rot?2.4:.8,rng:5,fov:1.6,mask:'Caméra mobile posée sur la porte du box'};if(b)b.cam=c.id}
  else if(CAMX[c.id])CAMX[c.id].horse=m.id;
  c.alert='Poulinage';c.foal=m.id;
  if(!D.alertRules.some(function(r){return r.id==='afoal'}))D.alertRules.unshift({id:'afoal',name:'Signes de poulinage, '+m.name,src:'Caméra du box '+m.box,icon:'heart',val:3,unit:'couchers en 1 h',min:2,max:6,step:1,who:['s05','s01'],ch:['Notification','SMS','Appel'],on:true,last:'Active depuis aujourd’hui, aucun signe pour l’instant'});
  return c}
function foalOff(m){var c=D.cameras.find(function(x){return x.foal===m.id});if(c){if(c.mobile){D.cameras.splice(D.cameras.indexOf(c),1);delete CAMX[c.id];var b=boxById(m.box);if(b)delete b.cam}else{delete c.alert;delete c.foal}}
  D.alertRules=D.alertRules.filter(function(r){return r.id!=='afoal'});delete m.foaling}
function foalSheet(done){var mares=D.horses.filter(function(h){return h.sex==='Jument'}),def=mares.find(function(h){return h.status==='ok'})||mares[0];
  var sh=P.sheet({title:'Surveillance de poulinage',icon:'heart',body:'<p class="s mut" style="margin-bottom:14px">La caméra du box repère les signes qui précèdent le poulinage et prévient l’équipe d’astreinte, de jour comme de nuit.</p>'+
    '<div class="stack" style="--g:12px"><label class="field"><span>Jument suivie</span><select class="in" data-f="mare">'+mares.map(function(h){return '<option value="'+h.id+'"'+(h===def?' selected':'')+'>'+E(h.name)+' · box '+h.box+'</option>'}).join('')+'</select></label>'+
    '<label class="field"><span>Terme prévu</span><input class="in" type="date" data-f="due" value="'+D.iso(D.day(12))+'"></label>'+
    '<div class="ec-sec" style="margin-top:4px">Signes surveillés</div><div class="card flat list">'+[['Couchers répétés','Plus de 3 couchers en une heure',true],['Agitation','Tourne dans le box, gratte le sol, regarde ses flancs',true],['Perte des eaux','Détectée par la caméra, alerte immédiate',true]].map(function(x,i){return '<div class="li"><div class="grow"><div class="b s">'+x[0]+'</div><div class="xs mut">'+x[1]+'</div></div>'+U.tog(x[2],'fs-'+i)+'</div>'}).join('')+'</div>'+
    '<div class="note">'+ICON('phone','sm')+'<span>Astreinte de nuit : <b>Antoine Leroy</b> par SMS puis appel, et vous-même si personne ne répond en 5 minutes. Si le box n’a pas de caméra, la caméra mobile de l’écurie est posée sur la porte.</span></div></div>',
    foot:'<button class="btn" data-x>Annuler</button><button class="btn pri" data-ok>'+ICON('bell','sm')+'Activer la surveillance</button>'});
  sh.querySelector('[data-x]').onclick=function(){sh.close()};
  sh.querySelector('[data-ok]').onclick=function(){var m=D.horse(sh.querySelector('[data-f="mare"]').value),due=sh.querySelector('[data-f="due"]').value||D.iso(D.day(12));
    m.foaling={due:due,since:D.iso(D.today),by:'cameras'};var c=foalCam(m);sh.close();done&&done();
    P.toast('Surveillance de poulinage activée pour '+m.name+' ('+m.box+'). Antoine est prévenu par SMS et appel.',{icon:'bell',ms:4600,undo:function(){foalOff(m);done&&done();P.toast('Surveillance désactivée',{icon:'eye_off'})}});void c}}
var SC={tab:'direct',f:'all',lay:'grid',focus:'cam2',evf:'all'};
var ACT={cam2:[52,34,14,'Couché 3 h 10 sur 24 h, contre 1 h 40 d’habitude'],cam3:[68,12,20,'Couché 1 h 52, dans ses habitudes'],cam4:[70,8,22,'Couché 1 h 05, dans ses habitudes']};
var ACCESS=[['m001','a regardé le box B01 pendant 3 minutes','Hier, 21:14'],['s05','a ouvert le box B23 depuis une alerte SMS','Aujourd’hui, 08:53'],['s01','a exporté un extrait de 1 min 12 (box B23)','Aujourd’hui, 09:02'],['vet','Dr Leclerc a consulté le box B23 avec un lien valable 24 heures','Aujourd’hui, 09:20'],['m001','a regardé le box B01 pendant 6 minutes','Dim. 15 nov., 13:40']];
var RGPD=[['ok','Panneaux d’information affichés','Aux trois entrées, avec la durée de conservation et le contact.','Télécharger le modèle'],['ok','Équipe informée par écrit','Note signée par les '+(D.facts&&D.facts.staff||'8 salariés et la gérante')+' le 3 septembre 2026.','Voir la note'],['ok','Aucun poste de travail filmé en continu','Masques actifs sur l’allée et la sellerie. Les boxes ne sont pas des postes.','Régler les masques'],['ok','Vestiaire, salle de pause et sanitaires non filmés','Aucune caméra dans ces zones.',''],['warn','Parking ouvert au public','Demande d’autorisation préfectorale déposée le 4 novembre. Alertes de nuit désactivées en attendant.','Suivre la demande'],['ok','Registre des traitements à jour','Finalité : sécurité des chevaux et des biens. Dernière revue le 2 novembre.','Ouvrir le registre']];

function stillFeed(cv,camId,o,t){var f={cv:cv,g:cv.getContext('2d'),cam:camOf(camId),o:o||{},bg:null};try{drawFeed(f,t||3)}catch(e){}}
function evIcon(e){return '<span class="ec-ico '+(e.sev==='ok'?'':e.sev)+'">'+ICON(EVK[e.kind][1],'sm')+'</span>'}
function ruleTxt(r){return (r.id==='a6'?'En dessous de ':r.id==='a7'||r.id==='a8'?'Sous ':r.id==='a9'?'À partir de ':'Dès ')+String(r.val).replace('.',',')+' '+r.unit}

/* fiche d'une caméra : direct, relecture, événements, partage */
function camSheet(id,ev){var c=camOf(id),h=c.horse&&D.horse(c.horse),evs=D.camEvents.filter(function(e){return e.cam===id}),feed=null,act=ACT[id],own=h&&h.owner&&D.member(h.owner);
  var sh=P.sheet({title:c.name,icon:'camera',wide:true,body:function(b){
    b.innerHTML='<div class="cm-player">'+feedHtml(id)+'<span class="live" data-lv>DIRECT</span><span class="cm-rp" data-rp hidden></span><span class="fl"></span></div>'+
     '<div class="cm-ctl"><button class="btn sm" data-k="pause">'+ICON('pause','sm')+'<span>Mettre en pause</span></button><button class="btn sm" data-k="ir" aria-pressed="false">'+IC.night('sm')+'Vision de nuit</button><button class="btn sm" data-k="ai" aria-pressed="true">'+ICON('scan','sm')+'Détection IA</button><button class="btn sm" data-k="snap">'+ICON('image','sm')+'Capturer une image</button><button class="btn sm pri" data-k="live" hidden>'+ICON('play','sm')+'Revenir au direct</button></div>'+
     '<div class="ec-sec">Dernières 24 heures<span class="xs mut" style="font-weight:500">'+evs.length+' événement'+(evs.length>1?'s':'')+' détecté'+(evs.length>1?'s':'')+'</span></div>'+
     '<div class="cm-tl">'+(act?[[.52,.6],[.64,.72],[.9,.93],[.96,.985]].slice(id==='cam2'?0:1,id==='cam2'?4:2).map(function(s){return '<span class="seg2" style="--c:var(--'+(id==='cam2'?'bad':'c5')+');left:'+s[0]*100+'%;width:'+(s[1]-s[0])*100+'%" title="Couché"></span>'}).join(''):'')+
       evs.map(function(e){return '<button data-e="'+e.id+'" style="--c:var(--'+(e.sev==='ok'?'ok':e.sev)+');left:'+(e.h/24*100).toFixed(1)+'%" title="'+E(e.t+' · '+e.title)+'"></button>'}).join('')+'<span class="now"></span></div>'+
     '<div class="cm-tlx"><span>Hier 10 h</span><span>16 h</span><span>22 h</span><span>4 h</span><span>Maintenant</span></div>'+
     (act?'<div class="ec-sec">Activité de '+E(h.name)+'</div><div class="cm-act"><i style="--c:var(--acc);width:'+act[0]+'%"></i><i style="--c:var(--'+(id==='cam2'?'bad':'c5')+');width:'+act[1]+'%"></i><i style="--c:var(--c3);width:'+act[2]+'%"></i></div><div class="hrow sp wrap" style="margin-top:8px">'+C.legend([['Debout '+act[0]+' %','var(--acc)'],['Couché '+act[1]+' %','var(--'+(id==='cam2'?'bad':'c5')+')'],['Mange ou boit '+act[2]+' %','var(--c3)']])+'</div><p class="s '+(id==='cam2'?'badc':'mut')+'" style="margin-top:8px">'+act[3]+'.</p>':'')+
     '<div class="ec-sec">Événements détectés</div>'+(evs.length?'<div class="card flat">'+evs.map(function(e){return '<button class="cm-ev" data-e="'+e.id+'">'+evIcon(e)+'<span><span class="t" style="display:block">'+E(e.title)+'</span><span class="xs mut" style="display:block">'+E(e.t)+' · '+E(e.sub)+'</span></span></button>'}).join('')+'</div>':'<p class="s mut">Aucun événement sur cette caméra depuis 24 heures.</p>')+
     '<div class="ec-sec">Accès et confidentialité</div><div class="card flat">'+
      (own?'<div class="cm-ok">'+U.av(own)+'<div><div class="b s">'+E(own.first+' '+own.last)+' peut voir ce box</div><div class="xs mut">Propriétaire. Accès limité à ce box, de 7 h à 22 h.</div></div>'+U.tog(id==='cam4','sh-own')+'</div>':'')+
      '<div class="cm-ok"><span class="ec-ico">'+ICON('shield','sm')+'</span><div><div class="b s">'+E(c.kind)+(c.mask?' · '+E(c.mask):'')+'</div><div class="xs mut">Images supprimées après 30 jours. Chaque consultation est inscrite au journal.</div></div><button class="btn sm" data-k="link">'+ICON('link','sm')+'Lien temporaire</button></div></div>';
    feed=feedAdd(b.querySelector('canvas'),id);
    function replay(e){feed.o.replay=e?e.t.replace('Hier ',''):null;feed.o.standing=e?e.kind!=='couche':false;feed.o.ir=e?(e.h>11&&e.h<21):b.querySelector('[data-k="ir"]').getAttribute('aria-pressed')==='true';feed.o.paused=false;feed.redraw();
      b.querySelector('[data-lv]').hidden=!!e;var rp=b.querySelector('[data-rp]');rp.hidden=!e;rp.textContent=e?'EXTRAIT · '+e.t.toUpperCase():'';b.querySelector('[data-k="live"]').hidden=!e;
      P.$$('.cm-tl button',b).forEach(function(x){x.setAttribute('aria-pressed',!!e&&x.getAttribute('data-e')===e.id)});b.querySelector('[data-k="pause"] span').textContent='Mettre en pause';if(e)b.parentNode.querySelector('.sb').scrollTop=0}
    b.onclick=function(x){var t=x.target.closest('[data-k]'),e=x.target.closest('[data-e]');
      if(e){replay(D.camEvents.find(function(q){return q.id===e.getAttribute('data-e')}));return}
      if(!t)return;var k=t.getAttribute('data-k');
      if(k==='pause'){feed.o.paused=!feed.o.paused;t.querySelector('span').textContent=feed.o.paused?'Reprendre la lecture':'Mettre en pause'}
      else if(k==='ir'||k==='ai'){var on=t.getAttribute('aria-pressed')!=='true';t.setAttribute('aria-pressed',on);if(k==='ir')feed.o.ir=on;else feed.o.ai=on;feed.redraw()}
      else if(k==='snap'){var fl=b.querySelector('.fl');fl.classList.remove('go');void fl.offsetWidth;fl.classList.add('go');P.toast('Image enregistrée'+(h?' dans la fiche de '+E(h.name):' dans le journal de l’écurie'),{icon:'image'})}
      else if(k==='live')replay(null);
      else if(k==='link'){t.innerHTML=ICON('check','sm')+'Lien copié';P.toast('Lien de consultation copié, valable 24 heures et limité à cette caméra',{icon:'link'})}};
    if(ev)replay(ev)},
   foot:(c.box?'<button class="btn ghost" data-go="ecurie3d" data-p-box="'+c.box+'">'+ICON('cube','sm')+'Voir dans le plan 3D</button>':'')+'<button class="btn" data-task>'+ICON('upkeep','sm')+'Créer une tâche</button><button class="btn pri" data-warn>'+ICON('sms','sm')+(c.alert?'Prévenir Antoine':'Partager un extrait')+'</button>'});
  sh.querySelector('[data-task]').onclick=function(e){e.currentTarget.disabled=true;e.currentTarget.innerHTML=ICON('check','sm')+'Tâche créée';addTask({title:(h?'Surveiller '+h.name:'Vérifier '+c.zone.toLowerCase()),zone:c.box||c.zone,who:'s05',time:'Dès que possible',kind:h?'soin':'entretien',from:'Caméra '+c.name});P.toast('Tâche ajoutée à la tournée de Antoine')};
  sh.querySelector('[data-warn]').onclick=function(e){e.currentTarget.disabled=true;e.currentTarget.innerHTML=ICON('check','sm')+(c.alert?'Antoine prévenu':'Extrait partagé');P.toast(c.alert?'SMS envoyé à Antoine avec le lien de la caméra':'Extrait de 30 secondes envoyé dans la messagerie de l’équipe')};
  return sh}

function sensSheet(id){var s=sensOf(id),v=s.v,mn=Math.min.apply(null,v),mx=Math.max.apply(null,v),av=v.reduce(function(a,b){return a+b},0)/v.length,rule=s.rule&&D.alertRules.find(function(r){return r.id===s.rule}),fx=function(x){return x.toFixed(s.nf).replace('.',',')};
  var labels=s.labels==='seance'?v.map(function(_,i){return i%6===0?Math.round(i/24*52)+' min':''}):H24;
  var sh=P.sheet({title:s.name,icon:s.icon,body:function(b){
    b.innerHTML='<div class="hrow sp" style="align-items:flex-end;margin-bottom:8px"><div><div class="eyebrow">'+E(s.lab)+(s.labels?'':' · 24 heures')+'</div><div class="disp num" style="font-size:34px;font-weight:700;line-height:1.1">'+E(s.val)+'</div></div>'+U.chip(s.state==='ok'?'Normal':'À surveiller',s.state==='ok'?'ok':'warn',true)+'</div>'+
     C.line([{v:v,c:s.state==='ok'?'var(--acc)':'var(--warn)',area:true}].concat(s.thr!=null?[{v:v.map(function(){return s.thr}),c:'var(--mut-2)',dash:true}]:[]),labels,{h:200,min:Math.floor(Math.min(mn,s.thr!=null?s.thr:mn)*.9),fmt:function(x){return fx(x)}})+
     (s.thr!=null?'<div class="xs mut" style="margin-top:4px">Ligne pointillée : '+E(s.thrL.toLowerCase())+', '+fx(s.thr)+' '+s.unit+'</div>':'')+
     '<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin-top:14px">'+[['Minimum',fx(mn)],['Moyenne',fx(av)],['Maximum',fx(mx)]].map(function(x){return '<div class="card soft" style="padding:10px 12px"><div class="xs mut">'+x[0]+'</div><div class="b num">'+x[1]+' <span class="xs mut">'+s.unit+'</span></div></div>'}).join('')+'</div>'+
     '<div class="note '+(s.state==='ok'?'':'warn')+'" style="margin-top:14px">'+ICON(s.state==='ok'?'info':'alert','sm')+'<span>'+E(s.note)+'.'+(s.id==='z1'?' Une baisse de la boisson précède souvent une colique : la caméra du box confirme un comportement inhabituel.':'')+'</span></div>'+
     (rule?'<div class="ec-sec">Règle d’alerte liée</div><div class="card flat" style="padding:14px"><div class="hrow sp"><div><div class="b s">'+E(rule.name)+'</div><div class="xs mut">'+ruleTxt(rule)+' · '+rule.ch.join(', ')+'</div></div>'+U.tog(rule.on)+'</div><div style="margin-top:12px"><div class="hrow sp xs mut"><span>Seuil</span><b class="num" style="color:var(--ink)"><span data-out="rg-s">'+rule.val+'</span> '+E(rule.unit)+'</b></div><input type="range" class="ec-range" id="rg-s" min="'+rule.min+'" max="'+rule.max+'" step="'+rule.step+'" value="'+rule.val+'"></div></div>':'')+
     '<div class="ec-sec">Appareil</div><dl class="ec-kv"><dt>Emplacement</dt><dd>'+E(s.where)+'</dd><dt>Batterie</dt><dd>'+s.bat+' %</dd><dt>Dernière mesure</dt><dd>il y a 2 minutes</dd><dt>Liaison</dt><dd>LoRa, signal fort</dd></dl>';
    bindRange(b);var rg=b.querySelector('#rg-s');if(rg)rg.onchange=function(){rule.val=+rg.value;P.toast('Seuil de la règle mis à jour : '+ruleTxt(rule).toLowerCase())}},
   foot:(s.horse?'<button class="btn ghost" data-go="cheval" data-id="'+s.horse+'">Ouvrir la fiche de '+E(D.horse(s.horse).name.split(' ')[0])+'</button>':'')+'<button class="btn" data-exp>'+ICON('download','sm')+'Exporter les mesures</button>'});
  sh.querySelector('[data-exp]').onclick=function(){P.toast('Mesures des 30 derniers jours exportées en CSV',{icon:'download'})}}

function ruleSheet(r,done){var nw=!r;r=r||{id:'n'+Date.now(),name:'',src:'Caméras de box',icon:'bell',val:30,unit:'min',min:5,max:120,step:5,who:['s01'],ch:['Notification'],on:true,last:'Jamais déclenchée'};var who=r.who.slice(),ch=r.ch.slice(),CH=['Notification','SMS','SMS la nuit','Appel','Résumé du matin'];
  var sh=P.sheet({title:nw?'Nouvelle règle d’alerte':r.name,icon:r.icon,body:function(b){
    b.innerHTML=(nw?'<label class="field" style="margin-bottom:14px"><span>Nom de la règle</span><input class="in" data-n placeholder="Exemple : cheval immobile trop longtemps"></label><label class="field" style="margin-bottom:14px"><span>Source</span><select class="in" data-s><option>Caméras de box</option><option>Abreuvoirs connectés</option><option>Sondes de température</option><option>Clôture électrique</option><option>Capteur de selle</option></select></label>':'<p class="s mut" style="margin-bottom:14px">Source : '+E(r.src)+'. '+E(r.last)+'.</p>')+
     '<div class="card flat" style="padding:14px"><div class="hrow sp"><span class="b s">Seuil de déclenchement</span><b class="num"><span data-out="rg-r">'+r.val+'</span> '+E(r.unit)+'</b></div><input type="range" class="ec-range" id="rg-r" min="'+r.min+'" max="'+r.max+'" step="'+r.step+'" value="'+r.val+'" style="margin-top:8px"><div class="hrow sp xs mut"><span>'+r.min+'</span><span>'+r.max+'</span></div></div>'+
     '<div class="ec-sec">Qui est prévenu</div><div class="card flat list">'+['s01','s05','s06','s07'].map(function(i){var p=D.staffer(i);return '<div class="li">'+U.av(p)+'<div class="grow"><div class="t">'+p.first+' '+p.last+'</div><div class="s">'+p.role+(i==='s05'?' · d’astreinte cette nuit':'')+'</div></div>'+U.chk(who.indexOf(i)>=0,i)+'</div>'}).join('')+'</div>'+
     '<div class="ec-sec">Par quel canal</div><div class="hrow wrap" style="--g:6px">'+CH.map(function(x){return '<button class="tag" data-ch="'+x+'" aria-pressed="'+(ch.indexOf(x)>=0)+'">'+ICON(x==='Appel'?'phone':x.indexOf('SMS')===0?'sms':x==='Notification'?'bell':'mail','sm')+x+'</button>'}).join('')+'</div>'+
     '<div class="card flat list" style="margin-top:16px"><div class="li"><div class="grow"><div class="t">SMS seulement la nuit</div><div class="s">De 22 h à 6 h. Le jour, une notification suffit.</div></div>'+U.tog(ch.indexOf('SMS la nuit')>=0)+'</div><div class="li"><div class="grow"><div class="t">Appeler si personne ne répond</div><div class="s">Après 5 minutes sans accusé de lecture, Stabl appelle l’astreinte.</div></div>'+U.tog(r.id==='a2')+'</div></div>';
    bindRange(b)},
   foot:(nw?'':'<button class="btn ghost" data-test>'+ICON('send','sm')+'Tester l’alerte</button>')+'<button class="btn pri" data-ok>'+(nw?'Créer la règle':'Enregistrer la règle')+'</button>'});
  var tb=sh.querySelector('[data-test]');if(tb)tb.onclick=function(){P.toast('Alerte de test envoyée à '+who.map(function(i){return D.staffer(i).first}).join(' et '),{icon:'send'})};
  sh.querySelector('[data-ok]').onclick=function(){r.val=+sh.querySelector('#rg-r').value;r.who=P.$$('.chk[aria-checked="true"]',sh).map(function(x){return x.getAttribute('data-id')});r.ch=P.$$('[data-ch][aria-pressed="true"]',sh).map(function(x){return x.getAttribute('data-ch')});if(!r.ch.length)r.ch=['Notification'];
    if(nw){r.name=(sh.querySelector('[data-n]').value.trim()||'Nouvelle règle');r.src=sh.querySelector('[data-s]').value;D.alertRules.unshift(r)}sh.close();P.toast(nw?'Règle créée et active':'Règle enregistrée');done&&done()}}

function addDevice(){var sh=P.sheet({title:'Ajouter un appareil',icon:'plus',body:'<p class="s mut" style="margin-bottom:14px">Stabl lit toute caméra IP compatible ONVIF ou RTSP et les capteurs LoRa, sans ouvrir de port sur votre réseau.</p><div class="stack rise" style="--g:8px">'+[['camera','Caméra de box','Détection du coucher, des roulades et de l’agitation','Box'],['video','Caméra d’installation','Manège, carrière, allée, portail','Lieu de travail ou ouvert au public'],['drop','Abreuvoir connecté','Consommation d’eau par cheval','Capteur'],['thermo','Sonde de température et d’humidité','Écurie, sellerie, réserve','Capteur'],['bolt','Électrificateur de clôture','Tension et fuites','Capteur'],['saddle','Capteur de selle','Durée, allures, fréquence cardiaque','Capteur']].map(function(x,i){return '<button class="e3-opt" role="radio" data-d="'+i+'" aria-checked="'+(i===0)+'"><span class="rd"></span><span class="ec-ico">'+ICON(x[0],'sm')+'</span><span class="grow" style="min-width:0"><b class="s" style="display:block">'+x[1]+'</b><span class="xs mut" style="display:block">'+x[2]+'</span></span></button>'}).join('')+'</div>'+
    '<div class="note" style="margin-top:16px">'+ICON('shield','sm')+'<span>Pour une caméra, Stabl demande le type de zone filmée et vérifie les règles : pas de salarié filmé en continu, panneau d’information, conservation de 30 jours au plus.</span></div>',foot:'<button class="btn pri" data-ok>'+ICON('qr','sm')+'Scanner le code de l’appareil</button>'});
  P.$$('[data-d]',sh).forEach(function(x){x.onclick=function(){P.$$('[data-d]',sh).forEach(function(y){y.setAttribute('aria-checked',y===x)})}});
  sh.querySelector('[data-ok]').onclick=function(){sh.close();P.toast('Recherche de l’appareil sur le réseau de l’écurie. Vous recevrez une notification dès qu’il répond.',{icon:'wifi',ms:4200})}}

P.mod({id:'cameras',role:'gerant',group:'Écurie',title:'Caméras et capteurs',icon:'camera',n:30,phoneTitle:'Caméras',
 badge:function(){return {v:D.camEvents.filter(function(e){return e.st==='à voir'}).length,hot:true}},
 render:function(el,ctx){
  if(ctx.params.cam){SC.tab='direct';SC.focus=ctx.params.cam}
  var cams=D.cameras.map(function(c){return camOf(c.id)}),todo=function(){return D.camEvents.filter(function(e){return e.st==='à voir'}).length};
  function evRow(e){var c=camOf(e.cam);return '<button class="cm-ev" data-ev="'+e.id+'">'+evIcon(e)+'<span><span class="t" style="display:block">'+E(e.title)+'</span><span class="xs mut" style="display:block">'+E(e.t)+' · '+E(c.name)+'</span></span></button>'}
  function tile(c,x){var f=SC.lay==='focus'&&c.id===SC.focus;return '<button class="cm-tile'+(c.alert?(c.foal?' fo':' al'):'')+(f?' f':'')+(x||'')+'" data-cam="'+c.id+'" title="'+E(c.name)+'">'+feedHtml(c.id)+'<span class="cm-tb"><span class="live">DIRECT</span><span class="cm-name">'+E(c.name)+'</span></span><span class="cm-zoom">'+ICON('expand','sm')+'</span>'+(c.alert?'<span class="cm-al">'+ICON('alert')+'<span>'+E(c.alert)+'</span></span>':'')+'</button>'}
  /* mosaïque : nombre de colonnes choisi pour ne laisser aucune case vide ; la carte d'option compte comme une tuile */
  function optTile(x){return '<button class="cm-tile cm-opt'+(x||'')+'" data-foal title="Activer la surveillance de poulinage"><span class="ot"><span class="ec-ico">'+ICON('heart','sm')+'</span>Surveillance de poulinage</span><span class="od">Option désactivée. La caméra du box prévient l’équipe aux premiers signes.</span><span class="oa"><span class="tog" aria-hidden="true"></span>Activer</span></button>'}
  function wall(list){var opt=SC.lay!=='focus'&&!foalMare()&&(SC.f==='all'||SC.f==='box'),n=list.length+(opt?1:0);
    if(SC.lay==='focus')return '<div class="cm-wall focus">'+list.map(function(c){return tile(c)}).join('')+'</div>';
    var cols=n%3===0?3:(n%4===0&&n>4?4:2),wideFirst=cols===2&&n%2===1,pw=n%2===1;
    /* la tuile qui s'élargit : l'option, sinon l'alerte, sinon la première */
    var items=list.map(function(c){return {c:c}});if(opt)items.push({opt:true});
    var wi=pw||wideFirst?(opt?items.length-1:Math.max(0,items.findIndex(function(it){return it.c&&it.c.alert}))):-1;
    if(wideFirst&&wi>0){items.unshift(items.splice(wi,1)[0]);wi=0}
    return '<div class="cm-wall" style="--cols:'+cols+'">'+items.map(function(it,i){var x=(i===wi&&wideFirst?' wide':'')+(i===wi&&pw?' pwide':'');return it.opt?optTile(x):tile(it.c,x)}).join('')+'</div>'}
  function foalCard(){var m=foalMare();if(!m)return '';var c=foalCam(m),due=foalDue(m),dd=Math.round((new Date(due)-new Date(D.iso(D.today)))/864e5);
    return '<div class="card cm-foal">'+U.hav(m)+'<div class="tx"><div class="hrow wrap" style="--g:8px;margin-bottom:2px">'+U.chip('Poulinage','warn',true)+'<b style="font-size:15px">'+E(m.name)+' ('+m.box+')</b></div><div class="s mut">Terme prévu '+(dd>0?'le '+F.date(due)+', dans '+dd+' jour'+(dd>1?'s':''):dd===0?'aujourd’hui':'dépassé de '+(-dd)+' jour'+(dd<-1?'s':''))+'. La caméra du box surveille les couchers répétés, l’agitation et la perte des eaux. Aucun signe depuis l’activation.</div></div>'+
      '<div class="hrow" style="--g:8px"><button class="btn" data-cam="'+c.id+'">'+ICON('camera','sm')+'Voir le box</button><button class="btn ghost" data-foaloff>'+ICON('eye_off','sm')+'Arrêter</button></div></div>'}
  function direct(){var list=cams.filter(function(c){return SC.f==='all'||(SC.f==='box'?c.box:SC.f==='inst'?!c.box:c.alert)});
    if(SC.lay==='focus'&&!list.some(function(c){return c.id===SC.focus}))SC.focus=(list[0]||{}).id;
    if(SC.lay==='focus')list=list.slice().sort(function(a,b){return (b.id===SC.focus)-(a.id===SC.focus)});
    /* l'alerte de démo (Xanthos, box B23) ne s'affiche que si la caméra de ce box existe */
    return (!cams.some(function(c){return /Xanthos/.test(c.name||'')})?'':'<div class="card tint d-soins cm-hero"><span class="ico lg">'+ICON('alert','lg')+'</span><div class="tx"><div class="b" style="font-size:15px;letter-spacing:-.01em">Xanthos (B23) s’est couché 4 fois depuis 6 h et boit 40 % de moins.</div><div class="s mut">La caméra et l’abreuvoir donnent le même signal : risque de colique. Antoine passe toutes les deux heures.</div></div><div class="hrow cm-ha" style="--g:8px"><button class="btn" data-cam="cam2">'+ICON('camera','sm')+'Voir le box</button><button class="btn pri" data-vet>'+ICON('phone','sm')+'Appeler le Dr Leclerc</button></div></div>')+
     foalCard()+'<div class="cm-lay"><div class="stack" style="--g:12px"><div class="hrow sp wrap">'+U.seg([['all','Toutes · '+cams.length],['box','Boxes · '+cams.filter(function(c){return c.box}).length],['inst','Installations · '+cams.filter(function(c){return !c.box}).length],['al','Alertes · '+cams.filter(function(c){return c.alert}).length]],SC.f,'data-f')+U.seg([['grid',ICON('grid','sm')+'Mosaïque'],['focus',ICON('expand','sm')+'Focus']],SC.lay,'data-lay')+'</div>'+
      wall(list)+
      '<div class="xs mut hrow" style="--g:6px">'+ICON('shield','sm')+'<span>Images conservées 30 jours au plus. Aucun poste de travail n’est filmé en continu.</span></div></div>'+
     '<aside class="stack" style="--g:14px"><div class="card"><div class="ch"><h3>Détections des caméras</h3><button class="btn ghost sm" data-tab="events">Tout voir'+ICON('arrow','sm')+'</button></div><div style="padding:8px 0 4px">'+D.camEvents.slice(0,5).map(evRow).join('')+'</div></div>'+
      '<div class="card"><div class="ch"><h3>Capteurs</h3><button class="btn ghost sm" data-tab="sensors">Courbes'+ICON('arrow','sm')+'</button></div><div class="list" style="padding:6px 0">'+D.sensors.map(function(s0){var s=sensOf(s0.id);return '<div class="li click" data-sens="'+s.id+'"><span class="ec-ico '+(s.state==='ok'?'':'warn')+'">'+ICON(s.icon,'sm')+'</span><div class="grow"><div class="t ellip">'+E(s.name)+'</div><div class="s ellip">'+E(s.note)+'</div></div><b class="s num '+(s.state==='ok'?'':'warnc')+'">'+E(s.val)+'</b></div>'}).join('')+'</div></div></aside></div>'}
  function events(){var kinds=[['all','Tous']].concat(['couche','roule','agite','porte'].map(function(k){return [k,EVK[k][0]]})),list=D.camEvents.filter(function(e){return SC.evf==='all'||e.kind===SC.evf});
    return '<div class="hrow sp wrap" style="margin-bottom:12px">'+U.seg(kinds,SC.evf,'data-evf')+'<span class="s mut">'+todo()+' à voir sur '+D.camEvents.length+' depuis hier 10 h</span></div>'+
     '<div class="card" style="padding:0 16px">'+(list.length?list.map(function(e){var c=camOf(e.cam);return '<div class="cm-evc" data-evc="'+e.id+'"><button class="cm-th" data-ev="'+e.id+'" title="Voir l’extrait"><canvas width="240" height="135" data-still="'+e.id+'" class="ec-feed"></canvas><span class="pl">'+ICON('play','lg')+'</span><span class="d">'+E(e.clip)+'</span></button><div style="min-width:0"><div class="hrow wrap" style="--g:6px;margin-bottom:4px">'+U.chip(EVK[e.kind][0],e.sev==='ok'?'':e.sev)+'<span class="xs mut num">'+E(e.t)+' · '+E(c.name)+'</span></div><div class="b">'+E(e.title)+'</div><div class="s mut">'+E(e.sub)+'</div></div><div class="acts hrow" style="--g:6px">'+(e.st==='à voir'?'<button class="btn sm" data-done="'+e.id+'">'+ICON('check','sm')+'Marquer comme vu</button>':e.st==='traité'?U.chip('Traité','ok',true):'')+'<button class="btn sm ghost" data-ev="'+e.id+'">Voir l’extrait</button></div></div>'}).join(''):U.empty('camera','Aucun événement de ce type','Les détections des 30 derniers jours restent consultables.'))+'</div>'}
  function sensors(){return '<div class="g3 rise">'+D.sensors.map(function(s0){var s=sensOf(s0.id),c=s.state==='ok'?'var(--acc)':'var(--warn)';return '<button class="card cm-sens" data-sens="'+s.id+'"><div class="hrow sp"><div class="hrow" style="--g:10px;min-width:0"><span class="ec-ico '+(s.state==='ok'?'':'warn')+'">'+ICON(s.icon,'sm')+'</span><div style="min-width:0"><div class="b s ellip">'+E(s.name)+'</div><div class="xs mut ellip">'+E(s.where)+'</div></div></div>'+U.chip(s.state==='ok'?'Normal':'À surveiller',s.state==='ok'?'ok':'warn',true)+'</div><div class="hrow sp" style="align-items:flex-end"><span class="v">'+E(s.val)+'</span><span class="xs mut">'+(s.labels?'séance d’hier':'sur 24 h')+'</span></div>'+mini(s.v,{c:c,thr:s.thr})+'<div class="hrow sp xs mut"><span class="ellip">'+E(s.note)+'</span><span class="hrow" style="--g:4px;flex:none">'+ICON('battery','sm')+s.bat+' %</span></div></button>'}).join('')+'</div>'+
     '<div class="note" style="margin-top:14px">'+ICON('plug','sm')+'<span>Les mesures arrivent dans la fiche de chaque cheval et alimentent les règles d’alerte. Seaver, Equisense et les abreuvoirs connectés se branchent depuis l’écran Connecteurs.</span></div>'}
  function rules(){var on=D.alertRules.filter(function(r){return r.on}).length;return '<div class="hrow sp wrap" style="margin-bottom:12px"><span class="s mut">'+on+' règles actives sur '+D.alertRules.length+'. Astreinte de cette nuit : <b style="color:var(--ink)">Antoine Leroy</b>, SMS de 22 h à 6 h.</span><button class="btn" data-newrule>'+ICON('plus','sm')+'Créer une règle</button></div>'+
     '<div class="card">'+D.alertRules.map(function(r){return '<div class="cm-rule'+(r.on?'':' off')+'" data-rule="'+r.id+'"><span class="ec-ico">'+ICON(r.icon,'sm')+'</span><div class="cm-rn" style="min-width:0"><div class="b s ellip">'+E(r.name)+'</div><div class="xs mut ellip">'+ruleTxt(r)+' · '+E(r.src)+'</div></div><div class="hrow wrap hide-t" style="--g:5px">'+r.ch.map(function(x){return U.chip(x,x==='Appel'?'acc':'')}).join('')+'</div><span class="hide-t">'+U.avs(r.who,3)+'</span><button class="tog" role="switch" data-manual data-rt="'+r.id+'" aria-checked="'+r.on+'" title="Activer ou désactiver la règle"></button></div>'}).join('')+'</div>'+
     '<p class="xs mut" style="margin-top:10px">Une alerte signale un comportement inhabituel. Elle ne remplace pas l’avis du vétérinaire.</p>'}
  function privacy(){var ret=P.prefs.get('cam:ret',30);return '<div class="g2">'+
     '<div class="stack" style="--g:14px"><div class="card"><div class="ch"><div><h3>Accès des propriétaires</h3><div class="xs mut">Chacun ne voit que le box de son cheval</div></div></div><div style="padding:8px 0 4px">'+cams.filter(function(c){return c.box}).map(function(c){var h=D.horse(c.horse),o=h.owner&&D.member(h.owner);return '<div class="cm-ok">'+U.hav(h)+'<div style="min-width:0"><div class="b s ellip">'+E(c.name)+'</div><div class="xs mut ellip">'+(o?E(o.first+' '+o.last)+' · de 7 h à 22 h':'Cheval du club, réservé à l’équipe')+'</div></div>'+(o?U.tog(c.id==='cam4'):U.chip('Équipe',''))+'</div>'}).join('')+
       '<div class="cm-ok"><span class="ec-ico">'+ICON('link','sm')+'</span><div><div class="b s">Lien temporaire pour le vétérinaire</div><div class="xs mut">Une caméra, 24 heures, sans compte à créer.</div></div><button class="btn sm" data-vlink>Créer un lien</button></div></div></div>'+
      '<div class="card"><div class="ch"><h3>Journal des accès</h3><button class="btn ghost sm" data-log>'+ICON('download','sm')+'Exporter</button></div><div class="list" style="padding:6px 0">'+ACCESS.map(function(a){var p=D.person(a[0]);return '<div class="li">'+(p?U.av(p):'<span class="av" style="--c:var(--c3)">DL</span>')+'<div class="grow"><div class="s" style="color:var(--ink)">'+(p?'<b>'+p.first+' '+p.last+'</b> ':'')+E(a[1])+'</div><div class="xs mut">'+a[2]+'</div></div></div>'}).join('')+'</div></div></div>'+
     '<div class="stack" style="--g:14px"><div class="card pad"><div class="hrow sp"><h3 style="font-size:15px">Durée de conservation</h3><b class="num"><span data-out="rg-ret">'+ret+'</span> jours</b></div><input type="range" class="ec-range" id="rg-ret" min="7" max="30" step="1" value="'+ret+'" style="margin-top:10px"><div class="hrow sp xs mut"><span>7 jours</span><span>30 jours, maximum recommandé par la CNIL</span></div><p class="s mut" style="margin-top:10px">Passé ce délai, les images sont supprimées automatiquement. Un extrait lié à un incident reste dans la fiche du cheval.</p></div>'+
      '<div class="card"><div class="ch"><h3>Conformité RGPD</h3>'+U.chip('5 points sur 6','ok',true)+'</div><div style="padding:8px 0 4px">'+RGPD.map(function(r,i){return '<div class="cm-ok w"><span class="ec-ico '+r[0]+'">'+ICON(r[0]==='ok'?'check':'hourglass','sm')+'</span><div><div class="b s">'+r[1]+'</div><div class="xs mut">'+r[2]+'</div></div>'+(r[3]?'<button class="btn ghost sm" data-rg="'+i+'">'+r[3]+'</button>':'')+'</div>'}).join('')+'</div></div>'+
      '<div class="card"><div class="ch"><h3>Zones filmées</h3></div><div style="padding:6px 0 0">'+U.table([{k:'name',l:'Caméra',f:function(c){return '<b>'+E(c.name)+'</b>'}},{k:'kind',l:'Type de zone'},{k:'mask',l:'Masque',hide:true,f:function(c){return c.mask?E(c.mask):'<span class="mut">Aucun</span>'}}],cams,{card:false})+'</div></div></div></div>'}
  var cmN=0,cmSw=false,TABS=[['direct','Direct'],['events','Événements'],['sensors','Capteurs'],['rules','Règles d’alerte'],['privacy','Partage et RGPD']];
  function draw(){var fm=foalMare();if(fm)foalCam(fm);cams=D.cameras.map(function(c){return camOf(c.id)});var body={direct:direct,events:events,sensors:sensors,rules:rules,privacy:privacy}[SC.tab]();
    el.innerHTML=U.ph('Caméras et capteurs',(ctx.mobile?cams.length+' caméras, '+D.sensors.length+' capteurs · '+todo()+' à voir':cams.length+' caméras et '+D.sensors.length+' capteurs en ligne · '+todo()+' détections à voir'),'<button class="btn pri" data-add>'+ICON('plus','sm')+'Ajouter un appareil</button>')+
      '<div class="ec-tabs">'+U.tabs(TABS.map(function(t){return [t[0],t[1]+(t[0]==='events'&&todo()?' <span class="chip bad" style="margin-left:4px">'+todo()+'</span>':'')]}),SC.tab,'data-tab')+'</div><div class="'+(cmN?(cmSw?'ec-sw':''):'fade')+'">'+body+'</div>';
    P.$$('canvas[data-feed]',el).forEach(function(cv){feedAdd(cv,cv.getAttribute('data-feed'))});
    P.$$('canvas[data-still]',el).forEach(function(cv){var e=D.camEvents.find(function(x){return x.id===cv.getAttribute('data-still')});stillFeed(cv,e.cam,{replay:e.t.replace('Hier ',''),standing:e.kind!=='couche',ir:e.h>11&&e.h<21,osd:true},e.h*7)});
    bindRange(el);var rr=el.querySelector('#rg-ret');if(rr)rr.onchange=function(){P.prefs.set('cam:ret',+rr.value);P.toast('Conservation réglée sur '+rr.value+' jours pour les '+cams.length+' caméras')};
    if(!cmN||cmSw)P.animate(el);cmN++;cmSw=false}
  draw();
  el.onclick=function(e){var t=e.target,x;
    if((x=t.closest('[data-tab]'))){SC.tab=x.getAttribute('data-tab');cmSw=true;draw();return}
    if((x=t.closest('[data-f]'))){SC.f=x.getAttribute('data-f');cmSw=true;draw();return}
    if((x=t.closest('[data-lay]'))){SC.lay=x.getAttribute('data-lay');cmSw=true;draw();return}
    if((x=t.closest('[data-evf]'))){SC.evf=x.getAttribute('data-evf');draw();return}
    if((x=t.closest('[data-done]'))){var ev=D.camEvents.find(function(q){return q.id===x.getAttribute('data-done')});ev.st='traité';draw();P.toast('Événement marqué comme vu',{undo:function(){ev.st='à voir';draw()}});return}
    if((x=t.closest('[data-ev]'))){var e2=D.camEvents.find(function(q){return q.id===x.getAttribute('data-ev')});camSheet(e2.cam,e2);return}
    if((x=t.closest('[data-cam]'))){var id=x.getAttribute('data-cam');if(SC.lay==='focus'&&SC.tab==='direct'&&x.classList.contains('cm-tile')&&!x.classList.contains('f')){SC.focus=id;draw()}else camSheet(id);return}
    if((x=t.closest('[data-sens]'))){sensSheet(x.getAttribute('data-sens'));return}
    if((x=t.closest('[data-rt]'))){var r=D.alertRules.find(function(q){return q.id===x.getAttribute('data-rt')});r.on=!r.on;x.setAttribute('aria-checked',r.on);x.closest('.cm-rule').classList.toggle('off',!r.on);P.toast(r.on?'Règle activée : '+E(r.name.toLowerCase()):'Règle désactivée : '+E(r.name.toLowerCase()),{icon:r.on?'bell':'eye_off'});return}
    if((x=t.closest('[data-rule]'))){ruleSheet(D.alertRules.find(function(q){return q.id===x.getAttribute('data-rule')}),draw);return}
    if(t.closest('[data-newrule]')){ruleSheet(null,draw);return}
    if(t.closest('[data-add]')){addDevice();return}
    if(t.closest('[data-foal]')){foalSheet(function(){cams=D.cameras.map(function(c){return camOf(c.id)});draw()});return}
    if(t.closest('[data-foaloff]')){var fm=foalMare();if(fm){var due0=fm.foaling;foalOff(fm);cams=D.cameras.map(function(c){return camOf(c.id)});draw();P.toast('Surveillance de poulinage arrêtée pour '+fm.name,{icon:'eye_off',undo:function(){fm.foaling=due0;foalCam(fm);cams=D.cameras.map(function(c){return camOf(c.id)});draw()}})}return}
    if((x=t.closest('[data-vet]'))){x.innerHTML=ICON('check','sm')+'Appel lancé';x.disabled=true;P.toast('Appel du Dr Leclerc au 06 12 48 30 17. La fiche de Xanthos lui est envoyée par SMS.',{icon:'phone',ms:4200});return}
    if((x=t.closest('[data-vlink]'))){x.innerHTML=ICON('check','sm')+'Lien copié';P.toast('Lien copié : box B23, valable jusqu’à demain 9 h 41',{icon:'link'});return}
    if(t.closest('[data-log]')){P.toast('Journal des accès exporté en PDF',{icon:'download'});return}
    if((x=t.closest('[data-rg]'))){var g=RGPD[+x.getAttribute('data-rg')];P.toast(g[3]==='Télécharger le modèle'?'Modèle de panneau téléchargé, prêt à imprimer en A4':g[3]==='Voir la note'?'Note d’information ouverte dans Contrats':g[3]==='Régler les masques'?'Ouvrez une caméra pour dessiner la zone masquée':g[3]==='Suivre la demande'?'Demande n° 78-2026-1104 en cours d’instruction en préfecture':'Registre des traitements ouvert',{icon:'doc'});return}};
  if(ctx.params.cam&&D.cameras.some(function(c){return c.id===ctx.params.cam}))setTimeout(function(){if(el.isConnected)camSheet(ctx.params.cam)},350);
 }});

/* =====================================================================
   3 · ENTRETIEN ET STOCKS
   ===================================================================== */
var KIND={routine:['Routine','d d-chevaux'],soin:['Soin','d d-soins'],entretien:['Entretien','d d-travail']};
var COLS=[['todo','À faire'],['cours','En cours'],['fait','Fait']];
var RECS=['Une seule fois','Tous les jours','Mardi, jeudi et samedi','Chaque semaine','Chaque mois'];
var TK=null;
function tasks(){if(TK)return TK;var rec={t1:1,t2:1,t3:1,t9:1,t10:1,t6:2};
  TK=D.tasks.map(function(t){return Object.assign({st:t.done?'fait':(t.id==='t3'||t.id==='t5')?'cours':'todo',rec:rec[t.id]?RECS[rec[t.id]]:''},t)});
  try{TK.find(function(t){return t.id==='t8'}).photos=1;TK.find(function(t){return t.id==='t8'}).from='Signalé par Lucie Petit hier à 17 h 20';TK.find(function(t){return t.id==='t2'}).photos=2;}catch(e){}/* exemples absents d'un vrai club */
  if(TK.some(function(t){return t.id==='t1'}))TK.push({id:'t11',title:'Changer deux lampes du solarium',zone:'Solarium',who:'s07',time:'15:00',kind:'entretien',st:'todo',from:'Signalé par Inès Garnier lundi',photos:1,rec:''},
          {id:'t12',title:'Arroser le grand manège',zone:'Grand manège',who:'s07',time:'12:30',kind:'entretien',st:'todo',rec:RECS[1]},
          {id:'t13',title:'Nettoyer les abreuvoirs de la prairie du bas',zone:'Prairie du bas',who:null,time:'Cette semaine',kind:'entretien',st:'todo',rec:RECS[3]});
  /* ordre chronologique dans chaque colonne ; les tâches sans heure précise passent à la fin */
  var tk=function(t){return /^\d\d:\d\d$/.test(t.time)?t.time:'99'};TK.sort(function(a,b){return tk(a)<tk(b)?-1:tk(a)>tk(b)?1:0});
  return TK}
function addTask(o){var t=Object.assign({id:'n'+Date.now(),st:'todo',kind:'entretien',rec:'',time:'Aujourd’hui',who:null,zone:''},o);tasks().push(t);if(D.tasks.indexOf(t)<0)D.tasks.push(t);return t}
/* heure du hersage : celle des faits partagés (13 h 30), la carrière d’honneur sert aux cours de Pauline à 11 h 15 et 12 h 15 */
var HZ=(function(){var a=(D.facts&&D.facts.hersage&&D.facts.hersage.at)||'13:30',m=a.slice(3);return (+a.slice(0,2))+'\u00a0h'+(m==='00'?'':'\u00a0'+m)})();
D.recurring=D.recurring||[
 ['Distribution du matin et du soir','Tous les jours, 7 h et 18 h','s05',true],['Curer les boxes','Tous les jours, 9 h','s05',true],['Sorties et rentrées des paddocks','Tous les jours, 8 h 30 et 16 h 30','s06',true],
 ['Herser la carrière d’honneur','Mardi, jeudi et samedi, '+HZ,'s07',true],['Arroser le grand manège','Tous les jours, 12 h 30, sauf jour de pluie','s07',true],['Nettoyer les abreuvoirs des prairies','Chaque lundi','s07',true],
 ['Contrôler les clôtures et la tension','Chaque vendredi','s07',true],['Désinfecter les boxes vides','Le premier lundi du mois','s06',true],['Vérifier les extincteurs et la trousse de secours','Le premier lundi du mois','s01',false]];
var EQX=[
 {kind:'Véhicule agricole',icon:'tractor',meter:'1 478 h moteur',pct:92,dueT:'Vidange à 1 500 h',dueD:null,cost:1240,log:[['2026-09-22','Graissage complet et filtre à air','Kévin Bernard',38],['2026-05-11','Vidange moteur et filtres (1 250 h)','Agri Service Rambouillet',312],['2026-02-03','Remplacement de la batterie','Agri Service Rambouillet',189],['2025-11-18','Révision annuelle, pneus avant','Agri Service Rambouillet',701]],docs:['Carte grise','Assurance jusqu’au 12 janvier 2027','Carnet du constructeur']},
 {kind:'Outil attelé',icon:'harrow',meter:'184 passages cette saison',pct:100,dueT:'8 dents à changer',dueD:null,cost:260,log:[['2026-10-02','Réglage de la profondeur à 4 cm','Kévin Bernard',0],['2026-04-14','Jeu de 12 dents remplacé','Sellerie du Parc',260]],docs:['Notice de réglage']},
 {kind:'Installation',icon:'rotate',meter:'5 h 40 par jour en moyenne',pct:78,dueT:'Contrôle annuel',dueD:D.iso(D.day(16)),cost:420,log:[['2026-08-30','Courroie retendue, capteur de porte changé','Équi-Tech',160],['2025-12-04','Contrôle annuel sans réserve','Équi-Tech',260]],docs:['Rapport de contrôle 2025','Notice de sécurité']},
 {kind:'Installation',icon:'sun',meter:'12 lampes, 310 h',pct:100,dueT:'2 lampes à remplacer',dueD:null,cost:95,log:[['2026-11-16','Deux lampes hors service signalées','Inès Garnier',0],['2026-03-09','4 lampes infrarouges remplacées','Kévin Bernard',95]],docs:['Notice']},
 {kind:'Installation',icon:'drop',meter:'46 abreuvoirs, 3 connectés',pct:24,dueT:'Purge de printemps',dueD:D.iso(D.day(120)),cost:140,log:[['2026-11-12','Antigel et cordons chauffants vérifiés','Kévin Bernard',0],['2026-06-20','Deux flotteurs remplacés (B07, B31)','Kévin Bernard',46],['2026-03-28','Purge et détartrage','Kévin Bernard',94]],docs:['Plan du réseau d’eau']},
 {kind:'Véhicule · GH-512-KT',icon:'truck',meter:'148 200 km',pct:89,dueT:'Contrôle technique',dueD:D.iso(D.day(41)),cost:2180,log:[['2026-10-08','Vidange et plaquettes avant','Garage Poids Lourds 78',486],['2026-06-02','Plancher et pont vérifiés avant la saison','Thomas Roux',0],['2026-01-15','Contrôle technique favorable','Autovision PL',148],['2025-12-10','4 pneus neufs','Garage Poids Lourds 78',1546]],docs:['Carte grise','Assurance jusqu’au 31 mars 2027','Certificat d’aptitude au transport']}];
function equip(){return D.equipment.map(function(e,i){return Object.assign({i:i},e,EQX[i]||{kind:'Matériel',icon:'wrench',pct:50,log:[],docs:[]})})}
var DUES=[['Marcheur 6 chevaux','Contrôle annuel',16,2],['Camion 6 places','Contrôle technique',41,5],['Extincteurs (6)','Vérification annuelle',23,null],['Tracteur Kubota L1361','Assurance à renouveler',56,0],['Van 2 places','Contrôle technique',97,null],['Installation électrique','Contrôle périodique',134,null]];
var STX={
 k1:{pack:20,lead:3,auto:false,hist:[54,54,55,56,56,58,58,60,61,61,62,62],order:{qty:20,eta:'jeudi',auto:false},mv:[['Sortie','−2','hier'],['Sortie','−2','dimanche'],['Livraison','+24','le 2 novembre']]},
 k2:{pack:60,lead:2,auto:false,hist:[10.2,10.2,10.5,10.5,10.8,10.8,10.9,11.2,11.2,11.5,11.5,11.5],mv:[['Sortie','−9','hier'],['Sortie','−10','dimanche'],['Livraison','+80','le 4 novembre']]},
 k3:{pack:24,lead:4,auto:true,hist:[15.9,15.9,16.2,16.2,16.4,16.4,16.4,16.9,16.9,16.9,16.9,16.9],mv:[['Sortie','−1','hier'],['Sortie','−2','samedi'],['Livraison','+24','le 28 octobre']]},
 k4:{pack:16,lead:3,auto:false,hist:[32,32,33,34,34,35,36,36,38,38,38,38],mv:[['Sortie','−1','hier'],['Livraison','+16','le 2 novembre']]},
 k5:{pack:40,lead:2,auto:false,hist:[13.2,13.2,13.2,13.5,13.5,13.5,13.8,13.8,14,14,14,14],need:'40 doses pour la campagne du 1er décembre',mv:[['Sortie','−1','aujourd’hui (Réglisse)'],['Sortie','−33','le 1er septembre']]},
 k6:{pack:6,lead:5,auto:true,hist:[19,19,19.5,19.5,20,20,20,20.5,21,21,21,21],mv:[['Sortie','−1','le 9 novembre'],['Livraison','+6','le 12 octobre']]}};
function stock(){return D.stock.map(function(s){var x=STX[s.id]||{pack:10,lead:3,hist:[s.price,s.price],mv:[]};return Object.assign(s,{x:x,days:s.daily>0?s.qty/s.daily:null,low:s.qty<s.min})})}
var ARX={a1:{sol:'Souple',st:'ok',hum:18,herse:'hier à 20 h 10',eau:'ce matin à 6 h 30',use:5,spr:true,next:'Arrosage à 12 h 30'},
 a2:{sol:'Sec en surface',st:'warn',hum:9,herse:'il y a 2 jours',eau:'il y a 3 jours',use:4.5,spr:true,next:'Hersage à '+HZ+' par Kévin'},
 a3:{sol:'Bon',st:'ok',hum:14,herse:'hier à 12 h',eau:'à la tonne, samedi',use:2,spr:false,next:'Hersage jeudi'},
 a4:{sol:'Profond par endroits',st:'warn',hum:16,herse:'il y a 5 jours',eau:'non arrosé',use:1.5,spr:false,next:'Nivelage à planifier'}};
var WEEK={a1:['HA','A','HA','A','HA','A','H'],a2:['','HA','A','H','','HA',''],a3:['H','','H','','','H',''],a4:['','','','','H','','']};

P.css(`
.en-kan{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;align-items:start}
.en-col{background:var(--bg-2);border-radius:var(--r-lg);padding:10px;display:flex;flex-direction:column;gap:8px;min-height:220px;transition:box-shadow var(--t-2),background var(--t-2)}
.en-col.over{box-shadow:inset 0 0 0 2px var(--acc);background:var(--acc-pale)}
.en-colh{display:flex;align-items:center;justify-content:space-between;padding:2px 6px 4px;font-size:13px;font-weight:650}
.en-colh .n{font-variant-numeric:tabular-nums;color:var(--mut);font-weight:600}
.en-card{background:var(--surface);border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line),var(--shadow-1);padding:11px 12px;display:flex;flex-direction:column;gap:8px;cursor:grab;transition:transform var(--t-2) var(--e-out),box-shadow var(--t-2),opacity var(--t-2);min-width:0}
.en-card:hover{transform:translateY(-1px);box-shadow:inset 0 0 0 1px var(--line-2),var(--shadow-2)}
.en-card.drag{opacity:.35}
.en-card.done .en-tt{color:var(--mut);text-decoration:line-through;text-decoration-color:var(--mut-2)}
.en-tt{font-size:13.5px;font-weight:600;line-height:1.3}
.en-row{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;gap:12px;align-items:center;padding:10px 16px;cursor:pointer;transition:background var(--t-1)}
.en-row:hover{background:var(--surface-2)}
.en-row+.en-row{border-top:1px solid var(--line)}
.en-row.done .en-tt{color:var(--mut);text-decoration:line-through;text-decoration-color:var(--mut-2)}
.en-gh{font-size:13px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);padding:14px 16px 6px}
.en-photo{aspect-ratio:4/3;border-radius:var(--r-md);background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:var(--mut);font-size:13px;position:relative;overflow:hidden;width:100%}
.en-photo canvas{position:absolute;inset:0;width:100%;height:100%}
.en-photo .cap{position:absolute;left:8px;bottom:8px;font-size:13px;font-weight:600;color:#fff;background:rgba(8,10,16,.66);padding:2px 7px;border-radius:5px}
.en-photo.add{background:transparent;box-shadow:none;border:1.5px dashed var(--line-2);cursor:pointer;transition:border-color var(--t-2),color var(--t-2)}
.en-photo.add:hover{border-color:var(--acc);color:var(--acc)}
.en-eq{padding:16px;display:flex;flex-direction:column;gap:12px}
.en-due{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 16px}
.en-due+.en-due{border-top:1px solid var(--line)}
.en-due .dd{width:44px;height:44px;border-radius:12px;background:var(--bg-2);display:flex;flex-direction:column;align-items:center;justify-content:center;font:700 15px/1 var(--f-display);font-variant-numeric:tabular-nums}
.en-due .dd small{font:600 13px var(--f-text);color:var(--mut);letter-spacing:.04em;margin-top:2px}
.en-due .dd.soon{background:var(--warn-pale);color:var(--warn)}
.en-sk{display:grid;grid-template-columns:minmax(0,1.7fr) minmax(0,.8fr) minmax(0,1.3fr) minmax(0,.7fr) auto;gap:16px;align-items:center;padding:12px 16px;cursor:pointer;transition:background var(--t-1)}
.en-sk:hover{background:var(--surface-2)}
.en-sk+.en-sk{border-top:1px solid var(--line)}
.en-skh{font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--mut);cursor:default;padding-top:10px;padding-bottom:10px}
.en-skh:hover{background:none}
.en-sk .act{width:176px;display:flex;justify-content:flex-end}
.en-ar{padding:16px;display:flex;flex-direction:column;gap:14px}
.en-met{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.en-met>div{background:var(--surface-2);border-radius:var(--r-sm);padding:9px 10px;min-width:0}
.en-met b{display:block;font-size:13px}.en-met span{display:block}
.en-act{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.en-act .en-spr{flex:1 1 100%;min-width:0}.en-act .en-spr .grow{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.en-act .nx{flex:1 1 120px;text-align:right}
@container main (max-width:560px){.en-met{gap:6px}.en-met>div{padding:8px}.en-act>.btn{flex:1 1 0;justify-content:center;min-height:40px;white-space:nowrap}.en-act .nx{flex:1 1 100%;text-align:left}}
.en-spr{height:36px;border-radius:var(--r-sm);background:var(--acc-pale);position:relative;overflow:hidden;display:flex;align-items:center;gap:8px;padding:0 4px 0 12px;font-size:13px;font-weight:600;color:var(--acc);flex:1}
.en-spr::before{content:"";position:absolute;inset:0;width:38%;background:color-mix(in srgb,var(--acc) 18%,transparent);animation:enspr 18s linear forwards}
@keyframes enspr{from{width:4%}to{width:100%}}
.en-spr>*{position:relative}
.en-wk{display:grid;grid-template-columns:minmax(120px,1.4fr) repeat(7,minmax(0,1fr));gap:4px;align-items:center;font-size:13px}
.en-wk .h{text-align:center;color:var(--mut);font-size:13px;padding:4px 0}
.en-wk .h.t{color:var(--acc);font-weight:700}
.en-wk .c{height:34px;border-radius:8px;background:var(--surface-2);display:flex;align-items:center;justify-content:center;gap:3px;color:var(--ink-2)}
.en-wk .c.t{box-shadow:inset 0 0 0 1.5px var(--acc-line)}
.en-wk .c.rain{background:repeating-linear-gradient(135deg,var(--surface-2) 0 5px,var(--bg-2) 5px 10px)}
.en-wk .c svg.i{width:15px;height:15px}
.en-wk .c svg.i.w{color:var(--acc)}
.en-pp{display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.en-msec{margin-bottom:12px}.en-msec .btn{width:100%;justify-content:center;min-height:44px}
@container main (max-width:560px){.en-k4{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:10px}.en-k4 .kpi{padding:12px}.en-k4 .kpi .lab{font-size:13px}}
@container main (max-width:1080px){.en-sk{grid-template-columns:minmax(0,1.5fr) minmax(0,.8fr) minmax(0,1.2fr) auto}.en-sk .hide-t{display:none}.en-sk .act{width:auto}}
@container main (max-width:760px){
 .en-kan{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;margin:0 -16px;padding:0 16px 6px;scrollbar-width:none}
 .en-col{flex:0 0 84%;scroll-snap-align:center}
 .en-row{grid-template-columns:auto minmax(0,1fr) auto;padding:12px 14px;min-height:60px}.en-row .hide-p{display:none}
 .en-row .chk{width:26px;height:26px;border-radius:8px}
 .en-sk{grid-template-columns:minmax(0,1fr) auto;gap:8px 12px;padding:14px}.en-sk .q{display:none}.en-sk .dl{grid-column:1/-1;grid-row:2}.en-sk .act{grid-column:1/-1;width:auto}.en-sk .act .btn{flex:1;height:42px}.en-skh{display:none}
 .en-wk{grid-template-columns:minmax(86px,1.1fr) repeat(7,minmax(0,1fr));font-size:13px}
 .en-wk .c{height:30px}.en-wk .c svg.i{width:13px;height:13px}
 .en-pp{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none;margin:0 -16px;padding:0 16px}
 .en-pp .tag{white-space:nowrap;flex:none;min-height:36px}
}
`);
var SE={tab:'tasks',view:null,who:'all'};
function kp(label,icon,val,sub,cls){return '<div class="card kpi"><div class="lab">'+ICON(icon,'sm')+label+'</div><div class="val num">'+val+'</div><div class="del '+cls+'" style="font-weight:500"><span class="ellip">'+sub+'</span></div></div>'}
/* photo simulée d'un signalement : petite scène dessinée, couleurs internes à l'image */
function photo(cv,kind,after){var g=cv.getContext('2d'),W=cv.width,H=cv.height,r=rng(kind.length*31+(after?7:3)),i;
  g.fillStyle=lg(g,0,0,0,H*.5,['#b9c3cc','#dfe3e6']);g.fillRect(0,0,W,H*.5);g.fillStyle=lg(g,0,H*.45,0,H,['#6f8459','#4b5f3f']);g.fillRect(0,H*.45,W,H*.55);
  for(i=0;i<260;i++){g.strokeStyle='rgba('+(r()<.5?'34,48,26':'160,182,118')+','+(.06+r()*.12)+')';var x=r()*W,y=H*.46+r()*H*.54;g.beginPath();g.moveTo(x,y);g.lineTo(x+2,y-4-r()*4);g.stroke()}
  g.fillStyle='#e9e6df';[W*.12,W*.5,W*.88].forEach(function(x){g.fillRect(x-5,H*.3,10,H*.5)});g.fillRect(W*.12,H*.36,W*.76,8);
  if(after)g.fillRect(W*.12,H*.56,W*.76,8);else{g.save();g.translate(W*.12,H*.58);g.rotate(.2);g.fillRect(0,0,W*.4,8);g.restore();g.save();g.translate(W*.56,H*.72);g.rotate(-.12);g.fillRect(0,0,W*.3,8);g.restore()}
  vign(g,W,H,.3);g.globalAlpha=.5;g.drawImage(noise(),0,0,W,H);g.globalAlpha=1}
function photoTile(cap,after){return '<div class="en-photo"><canvas width="240" height="180" data-photo="'+(after?1:0)+'"></canvas><span class="cap">'+cap+'</span></div>'}

function taskSheet(t,redraw){var nw=!t;t=t||{id:'n'+Date.now(),title:'',zone:'',who:'s07',time:'14:00',kind:'entretien',st:'todo',rec:RECS[0]};var p=t.who&&D.staffer(t.who),after=!!t.after;
  var sh=P.sheet({title:nw?'Nouvelle tâche':t.title,icon:'upkeep',body:function(b){
    function draw(){b.innerHTML=(nw?'<label class="field" style="margin-bottom:14px"><span>Que faut-il faire ?</span><input class="in" data-f="title" placeholder="Exemple : réparer la porte du box B12" value="'+E(t.title)+'"></label>':
       '<div class="hrow wrap" style="--g:6px;margin-bottom:14px">'+U.chip(KIND[t.kind][0],KIND[t.kind][1])+(t.urgent?U.chip('Urgent','bad',true):'')+(t.rec&&t.rec!==RECS[0]?'<span class="chip">'+ICON('repeat','sm')+t.rec+'</span>':'')+'</div>'+(t.from?'<div class="note" style="margin-bottom:14px">'+ICON('flag','sm')+'<span>'+E(t.from)+'.</span></div>':'')+
       '<div class="field" style="margin-bottom:14px"><span>Avancement</span>'+U.seg(COLS,t.st,'data-st')+'</div>')+
      '<div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px"><label class="field"><span>Affectée à</span><select class="in" data-f="who"><option value="">Personne pour l’instant</option>'+D.staff.filter(function(s){return /Pale|entretien|Appren/.test(s.role)||s.id===t.who}).map(function(s){return '<option value="'+s.id+'"'+(s.id===t.who?' selected':'')+'>'+s.first+' '+s.last+'</option>'}).join('')+'</select></label>'+
      '<label class="field"><span>Quand</span><input class="in" data-f="time" value="'+E(t.time)+'"></label>'+
      '<label class="field"><span>Lieu</span><input class="in" data-f="zone" placeholder="Box, paddock, carrière…" value="'+E(t.zone)+'"></label>'+
      '<label class="field"><span>Répétition</span><select class="in" data-f="rec">'+RECS.map(function(r){return '<option'+(r===(t.rec||RECS[0])?' selected':'')+'>'+r+'</option>'}).join('')+'</select></label></div>'+
      (nw?'<div class="field" style="margin-top:12px"><span>Type</span>'+U.seg([['entretien','Entretien'],['soin','Soin'],['routine','Routine']],t.kind,'data-kd')+'</div>':'')+
      '<div class="ec-sec">Photos avant et après</div><div style="display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px">'+(t.photos||nw?(nw?'<button class="en-photo add" data-ph="0">'+ICON('camera')+'Photo avant</button>':photoTile('Avant · '+(t.id==='t2'?'8 h 31':'hier 17 h 20'),false)):'<button class="en-photo add" data-ph="0">'+ICON('camera')+'Photo avant</button>')+
        (after||t.photos>1?photoTile('Après · '+(t.id==='t2'?'8 h 52':'à l’instant'),true):'<button class="en-photo add" data-ph="1">'+ICON('camera')+'Photo après</button>')+'</div>'+
      (nw?'':'<div class="ec-sec">Historique</div><div class="tl"><div class="ev" style="--c:var(--mut-2)"><div class="s b">Créée par Claire Dumont</div><div class="xs mut">Aujourd’hui à 7 h 02'+(t.rec&&t.rec!==RECS[0]?', automatiquement':'')+'</div></div>'+(t.st!=='todo'&&p?'<div class="ev"><div class="s b">Commencée par '+p.first+' '+p.last+'</div><div class="xs mut">Aujourd’hui à '+(t.id==='t5'?'6 h 10':'9 h 05')+', depuis son téléphone</div></div>':'')+(t.st==='fait'&&p?'<div class="ev" style="--c:var(--ok)"><div class="s b">Terminée par '+p.first+' '+p.last+'</div><div class="xs mut">Aujourd’hui à '+(t.id==='t1'?'7 h 38':'8 h 52')+'</div></div>':'')+'</div>');
      P.$$('canvas[data-photo]',b).forEach(function(c){photo(c,t.id,c.getAttribute('data-photo')==='1')})}
    draw();
    b.onclick=function(e){var s=e.target.closest('[data-st]'),ph=e.target.closest('[data-ph]'),kd=e.target.closest('[data-kd]');
      if(s){t.st=s.getAttribute('data-st');upd();redraw()}if(kd)t.kind=kd.getAttribute('data-kd');
      if(ph){read();if(ph.getAttribute('data-ph')==='1'){after=true;t.after=true}else t.photos=Math.max(1,t.photos||0);draw();P.toast('Photo ajoutée depuis l’appareil',{icon:'image'})}};
    function read(){P.$$('[data-f]',b).forEach(function(i){t[i.getAttribute('data-f')]=i.value})}
    b.addEventListener('change',read)},
   foot:nw?'<button class="btn pri" data-ok>'+ICON('plus','sm')+'Créer la tâche</button>':'<button class="btn ghost danger" data-del>'+ICON('trash','sm')+'Supprimer</button><button class="btn pri" data-ok></button>'});
  function upd(){var o=sh.querySelector('[data-ok]');if(!nw&&o)o.innerHTML=t.st==='fait'?ICON('refresh','sm')+'Rouvrir la tâche':ICON('check','sm')+'Marquer comme faite'}upd();
  sh.querySelector('[data-ok]').onclick=function(){P.$$('[data-f]',sh).forEach(function(i){t[i.getAttribute('data-f')]=i.value});t.who=t.who||null;if(t.rec===RECS[0])t.rec='';
    if(nw){if(!t.title.trim()){sh.querySelector('[data-f="title"]').focus();return}tasks().push(t);sh.close();redraw();P.toast('Tâche créée'+(t.who?' et envoyée à '+D.staffer(t.who).first:''))}
    else{t.st=t.st==='fait'?'todo':'fait';sh.close();redraw();P.toast(t.st==='fait'?'Tâche terminée':'Tâche rouverte')}};
  var del=sh.querySelector('[data-del]');if(del)del.onclick=function(){var a=tasks(),i=a.indexOf(t);a.splice(i,1);sh.close();redraw();P.toast('Tâche supprimée',{icon:'trash',undo:function(){a.splice(i,0,t);redraw()}})};
  sh.addEventListener('change',function(){if(!nw)redraw()})}

function recSheet(){P.sheet({title:'Tâches récurrentes',icon:'repeat',body:'<p class="s mut" style="margin-bottom:14px">Stabl crée ces tâches toutes seules et les envoie sur le téléphone de la personne affectée.</p><div class="card flat list">'+D.recurring.map(function(r){return '<div class="li">'+U.av(r[2])+'<div class="grow"><div class="t">'+r[0]+'</div><div class="s">'+r[1]+'</div></div>'+U.tog(r[3])+'</div>'}).join('')+'</div>',foot:'<button class="btn pri" data-ok>'+ICON('plus','sm')+'Ajouter une tâche récurrente</button>'}).querySelector('[data-ok]').onclick=function(){P.closeSheets();taskSheet(null,P.rerender)}}

function equipSheet(e,redraw){var sum=e.log.reduce(function(a,l){return a+l[3]},0);
  var sh=P.sheet({title:e.name,icon:e.icon==='harrow'?'wrench':e.icon,body:'<div style="display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px">'+[['Compteur',e.meter],['Coût sur 12 mois',F.eur(sum)],['Interventions',e.log.length+' en 12 mois']].map(function(x){return '<div class="card soft" style="padding:10px 12px"><div class="xs mut">'+x[0]+'</div><div class="b s">'+x[1]+'</div></div>'}).join('')+'</div>'+
    '<div class="ec-sec">Prochaine échéance</div><div class="card flat" style="padding:14px"><div class="hrow sp"><div><div class="b s">'+E(e.dueT)+'</div><div class="xs mut">'+E(e.next)+(e.dueD?' · '+F.dateY(e.dueD):'')+'</div></div>'+U.chip(e.status==='ok'?'Dans les temps':'À faire',e.status==='ok'?'ok':'warn',true)+'</div><div style="margin-top:10px">'+U.bar(e.pct,e.status==='ok'?'var(--acc)':'var(--warn)')+'</div></div>'+
    '<div class="ec-sec">Carnet d’entretien</div><div class="tl">'+e.log.map(function(l){return '<div class="ev" style="--c:var(--'+(l[3]?'acc':'mut-2')+')"><div class="hrow sp"><span class="s b">'+E(l[1])+'</span><span class="s num '+(l[3]?'':'mut')+'">'+(l[3]?F.eur(l[3]):'En interne')+'</span></div><div class="xs mut">'+F.dateY(l[0])+' · '+E(l[2])+'</div></div>'}).join('')+'</div>'+
    '<div class="ec-sec">Documents</div><div class="card flat list">'+e.docs.map(function(d){return '<div class="li click" data-doc>'+ICON('doc')+'<div class="grow t">'+E(d)+'</div>'+ICON('download','sm')+'</div>'}).join('')+'</div>',
   foot:'<button class="btn" data-log>'+ICON('plus','sm')+'Noter une intervention</button><button class="btn pri" data-plan>'+ICON('calendar_add','sm')+'Planifier l’échéance</button>'});
  sh.querySelector('[data-plan]').onclick=function(){addTask({title:e.dueT+' : '+e.name,zone:'Atelier',who:'s07',time:'Cette semaine',from:'Créée depuis le carnet d’entretien'});sh.close();redraw();P.toast('Tâche créée pour Kévin : '+E(e.dueT.toLowerCase()))};
  sh.querySelector('[data-log]').onclick=function(){e.log.unshift([D.iso(D.today),'Contrôle visuel, rien à signaler','Claire Dumont',0]);(EQX[e.i]||{}).log=e.log;equipSheet(e,redraw);P.toast('Intervention ajoutée au carnet')};
  P.$$('[data-doc]',sh).forEach(function(d){d.onclick=function(){P.toast('Document ouvert : '+d.querySelector('.t').textContent,{icon:'doc'})}})}

function orderTxt(s){return 'Commander '+s.x.pack+' '+s.unit.split(' ')[0]}
function order(s,redraw){s.x.order={qty:s.x.pack,eta:s.x.lead<=2?'jeudi':'vendredi'};redraw();
  P.toast('Commande de '+s.x.pack+' '+E(s.unit)+' envoyée à '+E(s.supplier)+' pour '+F.eur(s.x.pack*s.price)+'. Livraison '+s.x.order.eta+'.',{ms:4600,undo:function(){s.x.order=null;redraw();P.toast('Commande annulée',{icon:'refresh'})}})}
function stockSheet(s,redraw){var x=s.x,n=22,proj=[],lab=[],q=s.qty,rupt=null;
  for(var i=0;i<n;i++){proj.push(Math.max(0,+q.toFixed(1)));lab.push(i%3===0?F.date(D.day(i)):'');if(q<=0&&rupt==null)rupt=i;q-=s.daily;if(x.order&&i===x.lead)q+=x.order.qty}
  var dp=(x.hist[11]-x.hist[0])/x.hist[0]*100;
  var sh=P.sheet({title:s.name,icon:'stock',body:function(b){b.innerHTML='<div class="hrow sp" style="align-items:flex-end"><div><div class="eyebrow">En stock</div><div class="disp num" style="font-size:34px;font-weight:700;line-height:1.1">'+F.num(s.qty)+' <span class="l mut" style="font-weight:600">'+E(s.unit)+'</span></div></div>'+(s.low?U.chip('Sous le seuil de '+s.min,'warn',true):U.chip('Stock suffisant','ok',true))+'</div>'+
     (x.order?'<div class="note ok" style="margin-top:12px">'+ICON('truck','sm')+'<span>Commande de '+x.order.qty+' '+E(s.unit)+' en cours chez '+E(s.supplier)+'. Livraison '+x.order.eta+'.</span></div>':'')+
     '<div class="ec-sec">Prévision sur trois semaines<span class="xs mut" style="font-weight:500">'+(s.daily?String(s.daily).replace('.',',')+' par jour':E(x.need||''))+'</span></div>'+
     (s.daily?C.line([{v:proj,c:s.low&&!x.order?'var(--warn)':'var(--acc)',area:true},{v:proj.map(function(){return s.min}),c:'var(--mut-2)',dash:true}],lab,{h:180,min:0})+'<p class="s '+(rupt!=null?'badc':'mut')+'" style="margin-top:6px">'+(rupt!=null?'Rupture prévue '+F.dateL(D.day(rupt))+' sans nouvelle commande.':'Le stock reste au-dessus de zéro sur toute la période. La ligne pointillée marque le seuil d’alerte.')+'</p>':'<div class="note warn">'+ICON('syringe','sm')+'<span>Consommation par campagne : '+E(x.need)+'. Il en reste '+s.qty+'.</span></div>')+
     '<div class="ec-sec">Prix unitaire sur 12 mois<span class="xs '+(dp>0?'warnc':'okc')+'" style="font-weight:600">'+(dp>0?'+':'')+dp.toFixed(1).replace('.',',')+' % en un an</span></div>'+C.line([{v:x.hist,c:'var(--c2)'}],D.months,{h:130,min:Math.floor(x.hist[0]*.9),fmt:function(v){return v.toFixed(0)+' €'}})+
     '<div class="ec-sec">Réapprovisionnement</div><div class="card flat list"><div class="li"><div class="grow"><div class="t">Seuil d’alerte</div><div class="s">Alerte quand le stock passe dessous</div></div><span class="ec-step"><button data-th="-1" title="Baisser le seuil">'+ICON('minus','sm')+'</button><b data-thv>'+s.min+'</b><button data-th="1" title="Monter le seuil">'+ICON('plus','sm')+'</button></span></div>'+
      '<div class="li"><div class="grow"><div class="t">Commande automatique</div><div class="s">'+x.pack+' '+E(s.unit)+' chez '+E(s.supplier)+', livrés en '+x.lead+' jours</div></div>'+U.tog(x.auto,'st-auto')+'</div></div>'+
     '<div class="ec-sec">Derniers mouvements</div><div class="card flat list">'+x.mv.map(function(m){return '<div class="li"><span class="ec-ico '+(m[0]==='Livraison'?'ok':'')+'">'+ICON(m[0]==='Livraison'?'truck':'up','sm')+'</span><div class="grow"><div class="t">'+m[0]+'</div><div class="s">'+m[2]+'</div></div><b class="num s">'+m[1]+'</b></div>'}).join('')+'</div>';
     b.onclick=function(e){var t=e.target.closest('[data-th]');if(t){s.min=Math.max(0,s.min+(+t.getAttribute('data-th'))*(s.min>=20?5:1));b.querySelector('[data-thv]').textContent=s.min;redraw()}var a=e.target.closest('#st-auto');if(a){x.auto=a.getAttribute('aria-checked')!=='true';P.toast(x.auto?'Commande automatique activée pour '+E(s.name.toLowerCase()):'Commande automatique désactivée',{icon:'repeat'})}}},
   foot:'<button class="btn" data-fix>'+ICON('edit','sm')+'Corriger le stock</button><button class="btn pri" data-ord'+(x.order?' disabled':'')+'>'+(x.order?ICON('check','sm')+'Commande en cours':ICON('truck','sm')+orderTxt(s)+' · '+F.eur(x.pack*s.price))+'</button>'});
  sh.querySelector('[data-ord]').onclick=function(){sh.close();order(s,redraw)};sh.querySelector('[data-fix]').onclick=function(){invSheet(redraw)}}
function invSheet(redraw){var L=stock(),q={};L.forEach(function(s){q[s.id]=s.qty});
  var sh=P.sheet({title:'Inventaire',icon:'stock',body:'<p class="s mut" style="margin-bottom:14px">Comptez ce qu’il reste et corrigez. Stabl recalcule les jours restants et les commandes à passer.</p><div class="card flat list">'+L.map(function(s){return '<div class="li"><div class="grow"><div class="t">'+E(s.name)+'</div><div class="s">'+E(s.unit)+'</div></div><span class="ec-step"><button data-q="'+s.id+'" data-d="-1" title="Retirer une unité">'+ICON('minus','sm')+'</button><b data-qv="'+s.id+'">'+s.qty+'</b><button data-q="'+s.id+'" data-d="1" title="Ajouter une unité">'+ICON('plus','sm')+'</button></span></div>'}).join('')+'</div>',foot:'<button class="btn pri" data-ok>Enregistrer l’inventaire</button>'});
  sh.onclick=function(e){var t=e.target.closest('[data-q]');if(!t)return;var id=t.getAttribute('data-q');q[id]=Math.max(0,q[id]+(+t.getAttribute('data-d')));sh.querySelector('[data-qv="'+id+'"]').textContent=q[id]};
  sh.querySelector('[data-ok]').onclick=function(){var n=0;L.forEach(function(s){if(s.qty!==q[s.id]){s.qty=q[s.id];n++}});sh.close();redraw();P.toast(n?'Inventaire enregistré : '+n+' article'+(n>1?'s corrigés':' corrigé'):'Inventaire enregistré, aucun écart')}}

P.mod({id:'entretien',role:'gerant',group:'Écurie',title:'Entretien et stocks',icon:'upkeep',n:60,phoneTitle:'Entretien',
 badge:function(){return {v:stock().filter(function(s){return s.low&&!s.x.order}).length}},
 render:function(el,ctx){
  if(ctx.params.tab)SE.tab=ctx.params.tab;if(!SE.view)SE.view=ctx.mobile?'list':'kanban';
  var T=tasks(),spr={},enN=0,enSw=false;
  function vis(){return T.filter(function(t){return SE.who==='all'||t.who===SE.who})}
  function tcard(t){var p=t.who&&D.staffer(t.who);return '<div class="en-card en-k-'+t.kind+(t.st==='fait'?' done':'')+(t.urgent?' urg':'')+'" draggable="true" data-task="'+t.id+'" tabindex="0"><div class="hrow sp"><div class="hrow" style="--g:6px">'+U.chip(KIND[t.kind][0],KIND[t.kind][1])+(t.urgent?U.chip('Urgent','bad',true):'')+'</div><span class="en-tm num">'+ICON('clock','sm')+E(t.time)+'</span></div><div class="en-tt">'+E(t.title)+'</div><div class="hrow sp en-cf"><span class="mut hrow" style="--g:6px;min-width:0">'+ICON('pin','sm')+'<span class="ellip">'+E(t.zone)+'</span></span><span class="hrow" style="--g:8px;flex:none">'+(t.rec?'<span class="mut" title="'+E(t.rec)+'">'+ICON('repeat','sm')+'</span>':'')+(t.photos?'<span class="mut hrow" style="--g:4px" title="Photos jointes">'+ICON('image','sm')+t.photos+'</span>':'')+(p?U.av(p,'sm'):'<span class="av sm" style="--c:var(--line-2);color:var(--ink-2)" title="Non affectée">?</span>')+'</span></div></div>'}
  function trow(t){var p=t.who&&D.staffer(t.who);return '<div class="en-row'+(t.st==='fait'?' done':'')+'" data-task="'+t.id+'">'+'<button class="chk" role="checkbox" data-manual data-chk="'+t.id+'" aria-checked="'+(t.st==='fait')+'" title="Marquer comme faite"><svg viewBox="0 0 24 24"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg></button><div style="min-width:0"><div class="en-tt ellip">'+E(t.title)+'</div><div class="xs mut ellip">'+E(t.time)+' · '+E(t.zone)+(t.rec?' · '+E(t.rec.toLowerCase()):'')+'</div></div><span class="hrow hide-p" style="--g:5px">'+(t.urgent?U.chip('Urgent','bad',true):'')+U.chip(KIND[t.kind][0],KIND[t.kind][1])+'</span>'+(p?U.av(p,'sm'):'<span class="av sm" style="--c:var(--line-2);color:var(--ink-2)" title="Non affectée">?</span>')+'</div>'}
  function tabTasks(){var v=vis(),done=T.filter(function(t){return t.st==='fait'}).length,team=['s05','s06','s07'].filter(function(i){return D.staffer(i)});
    var h='<div class="hrow sp wrap" style="margin-bottom:12px;--g:10px"><div class="en-pp"><button class="tag" data-manual data-who="all" aria-pressed="'+(SE.who==='all')+'">Toute l’équipe</button>'+team.map(function(i){var p=D.staffer(i),n=T.filter(function(t){return t.who===i&&t.st!=='fait'}).length;return '<button class="tag" data-manual data-who="'+i+'" aria-pressed="'+(SE.who===i)+'">'+U.av(p,'sm')+p.first+'<b class="num mut" style="font-weight:600">'+n+'</b></button>'}).join('')+'</div>'+
      '<div class="hrow" style="--g:10px"><span class="s mut hide-s">'+done+' faites sur '+T.length+'</span>'+U.seg([['kanban',ICON('kanban','sm')+'Tableau'],['list',ICON('list','sm')+'Liste']],SE.view,'data-view')+'</div></div>';
    if(SE.view==='kanban')h+='<div class="en-kan">'+COLS.map(function(c){var l=v.filter(function(t){return t.st===c[0]});return '<div class="en-col en-c-'+c[0]+'" data-col="'+c[0]+'"><div class="en-colh"><span class="hrow" style="--g:10px"><i class="en-cd"></i>'+c[1]+'</span><span class="n">'+l.length+'</span></div><div class="en-cl rise">'+l.map(tcard).join('')+'</div>'+(l.length?'':'<div class="en-empty">'+ICON(c[0]==='fait'?'checkc':'kanban')+'<span>'+(c[0]==='fait'?'Les tâches terminées arrivent ici':'Glissez une tâche ici')+'</span></div>')+(c[0]==='todo'?'<button class="en-add" data-new>'+ICON('plus','sm')+'Ajouter une tâche</button>':'')+'</div>'}).join('')+'</div>';
    else h+='<div class="card">'+COLS.map(function(c){var l=v.filter(function(t){return t.st===c[0]});return l.length?'<div class="en-gh">'+c[1]+' · '+l.length+'</div>'+l.map(trow).join(''):''}).join('')+'</div>';
    return h+'<div class="hrow wrap" style="margin-top:14px;--g:8px"><button class="btn sm" data-rec>'+ICON('repeat','sm')+D.recurring.filter(function(r){return r[3]}).length+' tâches récurrentes actives</button><span class="xs mut">Les palefreniers cochent depuis leur téléphone, avec une photo si besoin.</span></div>'}
  function tabEquip(){var L=equip();return '<div class="g3" style="align-items:start"><div class="span2 g2">'+L.map(function(e){return '<div class="card en-eq" data-eq="'+e.i+'"><div class="hrow sp"><div class="hrow" style="--g:10px;min-width:0"><span class="ec-ico '+(e.status==='ok'?'':'warn')+'">'+(e.icon==='harrow'?IC.harrow('sm'):ICON(e.icon,'sm'))+'</span><div style="min-width:0"><div class="b s ellip">'+E(e.name)+'</div><div class="xs mut ellip">'+E(e.kind)+'</div></div></div>'+U.chip(e.status==='ok'?'En état':'À réviser',e.status==='ok'?'ok':'warn',true)+'</div><div><div class="hrow sp xs" style="margin-bottom:6px"><span class="b">'+E(e.next)+'</span><span class="mut num">'+E(e.meter)+'</span></div>'+U.bar(e.pct,e.status==='ok'?'var(--acc)':'var(--warn)')+'</div><div class="hrow" style="--g:6px"><button class="btn sm" data-book="'+e.i+'">'+ICON('doc','sm')+'Carnet d’entretien</button><button class="btn sm ghost" data-plan="'+e.i+'">Planifier</button></div></div>'}).join('')+'</div>'+
     '<div class="card"><div class="ch"><h3>Échéances à venir</h3><span class="xs mut">6 mois</span></div><div style="padding:8px 0 4px">'+DUES.map(function(d,i){return '<div class="en-due"><div class="dd'+(d[2]<30?' soon':'')+'">'+d[2]+'<small>JOURS</small></div><div style="min-width:0"><div class="b s ellip">'+d[1]+'</div><div class="xs mut ellip">'+d[0]+' · '+F.date(D.day(d[2]))+'</div></div><button class="btn sm ghost" data-due="'+i+'">Planifier</button></div>'}).join('')+'</div><div class="cf"><span class="xs mut">Rappel envoyé 30 jours, 7 jours et la veille.</span></div></div></div>'}
  function tabStock(){var L=stock(),val=L.reduce(function(a,s){return a+s.qty*s.price},0),low=L.filter(function(s){return s.low}),soon=L.filter(function(s){return s.days!=null}).sort(function(a,b){return a.days-b.days})[0],ord=L.filter(function(s){return s.x.order});
    return '<div class="g4 en-k4" style="margin-bottom:14px">'+kp('Valeur du stock','euro','<span data-count="'+Math.round(val)+'" data-fmt="eur">'+F.eur(val)+'</span>',L.length+' articles suivis','mut')+kp('Articles sous le seuil','alert','<span data-count="'+low.length+'">'+low.length+'</span>',low.map(function(s){return s.name.split(' ')[0]}).join(' et ')||'Aucun',low.length?'warnc':'okc')+kp('Rupture la plus proche','hourglass',Math.floor(soon.days)+'<small style="margin-left:5px">jours</small>',soon.name,soon.days<7?'warnc':'mut')+kp('Commandes en cours','truck','<span data-count="'+ord.length+'">'+ord.length+'</span>',ord.length?ord.map(function(s){return s.name.split(' ')[0]+', livraison '+s.x.order.eta}).join(' · '):'Aucune','mut')+'</div>'+
     '<div class="card"><div class="en-sk en-skh"><span>Article</span><span>En stock</span><span>Jours restants</span><span class="hide-t">Prix unitaire</span><span class="act"></span></div>'+L.map(function(s){var d=s.days,pc=d==null?(s.qty/s.min*50):Math.min(100,d/30*100),col=s.low||(d!=null&&d<7)?'var(--warn)':'var(--ok)',dp=s.x.hist[11]-s.x.hist[8];
       return '<div class="en-sk" data-sk="'+s.id+'"><div style="min-width:0"><div class="b s ellip">'+E(s.name)+'</div><div class="xs mut ellip">'+E(s.supplier)+'</div></div><div class="q"><b class="num">'+F.num(s.qty)+'</b> <span class="xs mut">'+E(s.unit)+'</span><div class="xs '+(s.low?'warnc':'mut')+'">seuil '+s.min+'</div></div><div class="dl"><div class="hrow sp xs" style="margin-bottom:5px"><b class="num '+(s.low||(d!=null&&d<7)?'warnc':'')+'">'+(d==null?'Par campagne':Math.floor(d)+' jours')+'</b><span class="mut num">'+(d==null?s.qty+' sur '+s.min:F.num(s.qty)+' '+E(s.unit.split(' ')[0])+' · '+String(s.daily).replace('.',',')+' par jour')+'</span></div>'+U.bar(pc,col)+'</div><div class="hide-t"><b class="num s">'+F.eur(s.price,true)+'</b><div class="xs '+(dp>0?'warnc':'mut')+'">'+(dp>0?'+'+F.eur(dp,true)+' en 3 mois':'stable')+'</div></div><div class="act">'+(s.x.order?'<span class="chip ok dot">Livraison '+s.x.order.eta+'</span>':'<button class="btn sm'+(s.low?' pri':'')+'" data-ord="'+s.id+'">'+ICON('truck','sm')+orderTxt(s)+'</button>')+'</div></div>'}).join('')+'</div>'+
     '<div class="note" style="margin-top:14px">'+ICON('trend','sm')+'<span>La prévision tient compte des '+D.horses.length+' chevaux présents, des rations et de la météo. Les sorties de stock viennent des distributions cochées par l’équipe.</span></div>'}
  function tabArena(){var day=['Mar','Mer','Jeu','Ven','Sam','Dim','Lun'];return '<div class="note warn" style="margin-bottom:14px">'+ICON('rain','sm')+'<span>Pluie annoncée jeudi et vendredi : l’arrosage est suspendu ces deux jours et la carrière d’honneur sera hersée samedi matin avant le stage.</span></div>'+
     '<div class="g2">'+D.club.arenas.map(function(a){var x=ARX[a.id],on=spr[a.id];return '<div class="card en-ar"><div class="hrow sp"><div class="hrow" style="--g:10px;min-width:0"><span class="ec-ico '+(x.st==='ok'?'':'warn')+'">'+ICON('arena','sm')+'</span><div style="min-width:0"><div class="b ellip">'+E(a.name)+'</div><div class="xs mut ellip">'+E(a.kind)+' · '+E(a.size)+'</div></div></div>'+U.chip(x.sol,x.st==='ok'?'ok':'warn',true)+'</div>'+
       '<div class="en-met"><div><span class="xs mut">'+(ctx.mobile?'Humidité':'Humidité du sol')+'</span><b class="num">'+x.hum+' %</b></div><div><span class="xs mut">'+(ctx.mobile?'Hersage':'Dernier hersage')+'</span><b>'+x.herse+'</b></div><div><span class="xs mut">'+(ctx.mobile?'Arrosage':'Dernier arrosage')+'</span><b>'+x.eau+'</b></div></div>'+
       '<div><div class="hrow sp xs" style="margin-bottom:5px"><span class="mut">Utilisation aujourd’hui</span><b class="num">'+String(x.use).replace('.',',')+' h de reprises</b></div>'+U.bar(x.use/8*100,'var(--c2)')+'</div>'+
       '<div class="en-act">'+(on?'<div class="en-spr">'+IC.sprinkler('sm')+'<span class="grow">Arrosage en cours, 12 minutes</span><button class="btn sm ghost" data-stop="'+a.id+'">Arrêter</button></div>':(x.spr?'<button class="btn sm" data-spr="'+a.id+'">'+IC.sprinkler('sm')+'Lancer l’arrosage</button>':'')+'<button class="btn sm" data-hrs="'+a.id+'">'+IC.harrow('sm')+'Planifier un hersage</button><span class="xs mut nx">'+(ctx.mobile?'Prochain : ':'')+E(x.next)+'</span>')+'</div></div>'}).join('')+'</div>'+
     '<div class="card" style="margin-top:14px"><div class="ch"><h3>Programme de la semaine</h3>'+C.legend([['Hersage','var(--ink-2)'],['Arrosage','var(--acc)'],['Pluie annoncée','var(--line-2)']])+'</div><div class="cb"><div class="en-wk"><span></span>'+day.map(function(d,i){return '<span class="h'+(i?'':' t')+'">'+d+'</span>'}).join('')+
       D.club.arenas.map(function(a){return '<span class="b ellip">'+E(a.name)+'</span>'+WEEK[a.id].map(function(c,i){var rain=(i===2||i===3)&&a.kind.indexOf('Couvert')<0;return '<span class="c'+(i?'':' t')+(rain?' rain':'')+'" title="'+(rain?'Pluie : pas d’arrosage':'')+'">'+(c.indexOf('H')>=0?IC.harrow():'')+(c.indexOf('A')>=0&&!rain?IC.sprinkler('w'):'')+'</span>'}).join('')}).join('')+'</div></div></div>'}
  var TABS=[['tasks','Tâches'],['equip','Matériel et véhicules'],['stock','Stocks'],['arena','Carrières et sols']];
  function draw(){var L=stock(),low=L.filter(function(s){return s.low&&!s.x.order}),done=T.filter(function(t){return t.st==='fait'}).length;
    var sec={tasks:'<button class="btn" data-rec>'+ICON('repeat','sm')+'Tâches récurrentes</button>',equip:'<button class="btn" data-neweq>'+ICON('plus','sm')+'Ajouter un matériel</button>',stock:'<button class="btn" data-inv>'+ICON('scan','sm')+'Faire l’inventaire</button>',arena:''}[SE.tab];
    var mob=ctx.mobile;el.innerHTML=U.ph('Entretien et stocks',mob?done+' faites sur '+T.length+' · '+low.length+' stocks bas':done+' tâches faites sur '+T.length+' aujourd’hui · '+(low.length?low.map(function(s){return s.name.split(' ')[0].toLowerCase()}).join(' et ')+' sous le seuil':'stocks suffisants')+(D.facts&&D.facts.hersage?' · herse et solarium à réviser':''),(mob?'':sec)+'<button class="btn pri" data-new>'+ICON('plus','sm')+'Nouvelle tâche</button>')+
      summary(L,low,done)+'<div class="ec-tabs">'+U.tabs(TABS.map(function(t){return [t[0],t[1]+(t[0]==='stock'&&low.length?' <span class="chip warn" style="margin-left:4px">'+low.length+'</span>':'')]}),SE.tab,'data-tab')+'</div><div class="'+(enN?(enSw?'ec-sw':''):'fade')+'">'+(mob&&sec&&SE.tab!=='tasks'?'<div class="en-msec">'+sec+'</div>':'')+{tasks:tabTasks,equip:tabEquip,stock:tabStock,arena:tabArena}[SE.tab]()+'</div>';
    if(!enN||enSw)P.animate(el);enN++;enSw=false;dnd()}
  function summary(L,low,done){var eq=equip().filter(function(e){return e.status!=='ok'}),cur=T.filter(function(t){return t.st==='cours'}).length,urg=T.filter(function(t){return t.urgent&&t.st!=='fait'}),pc=Math.round(done/T.length*100),team=['s05','s06','s07'].filter(function(i){return D.staffer(i)});
    return '<div class="en-bento'+(enN?'':' rise')+'">'+
     '<div class="card tint d-equipe en-hero"><div class="en-hc"><div class="en-eb">'+ICON('upkeep','sm')+'Journée de l’équipe</div><div class="en-hb"><span class="big num">'+done+'</span><span class="en-hu">faites sur '+T.length+'</span></div>'+
      '<div class="en-prog" title="'+done+' faites, '+cur+' en cours, '+(T.length-done-cur)+' à faire"><i style="--w:'+(done/T.length*100).toFixed(1)+'%;--c:var(--d)"></i><i style="--w:'+(cur/T.length*100).toFixed(1)+'%;--c:color-mix(in srgb,var(--d) 45%,transparent)"></i></div>'+
      '<div class="en-team">'+team.map(function(i){var p=D.staffer(i),n=T.filter(function(t){return t.who===i&&t.st!=='fait'}).length;return '<button class="en-tp" data-who="'+i+'" title="Voir les tâches de '+p.first+'">'+U.av(p,'sm')+'<span><b>'+p.first+'</b><small>'+plural(n,'tâche')+' à faire</small></span></button>'}).join('')+'</div></div>'+
      '<div class="en-hi">'+(window.ILLU?ILLU.seau({size:null}):'')+'</div></div>'+
     '<button class="card en-t'+(low.length?' tint d-argent':'')+'" data-tab="stock"><span class="lab"><span class="ico sm d-argent">'+ICON('stock','sm')+'</span>Stocks à commander</span><span class="v num">'+low.length+'</span><span class="s">'+(low.length?low.map(function(s,i){var w=s.name.split(' ')[0];return E(i?w.toLowerCase():w)}).join(' et ')+' sous le seuil':'Tous les stocks sont suffisants')+'</span></button>'+
     '<button class="card en-t" data-tab="equip"><span class="lab"><span class="ico sm d-travail">'+ICON('wrench','sm')+'</span>Matériel à réviser</span><span class="v num">'+eq.length+'</span><span class="s">'+(eq.length?eq.map(function(e){return E(e.name.split(' ')[0].toLowerCase())}).join(' et '):'Tout le parc est en état')+'</span></button>'+
     '<button class="card en-t'+(urg.length?' tint d-soins':'')+'" data-tab="tasks"><span class="lab"><span class="ico sm d-soins">'+ICON('alert','sm')+'</span>Urgent</span><span class="v num">'+urg.length+'</span><span class="s">'+(urg.length?urg.map(function(t){return E(t.title)}).join(', '):'Rien d’urgent')+'</span></button>'+
     '<button class="card en-t" data-tab="arena"><span class="lab"><span class="ico sm d-exterieur">'+ICON('arena','sm')+'</span>Carrières et sols</span><span class="v num">'+D.club.arenas.length+'</span><span class="s">Pluie jeudi et vendredi, hersage samedi matin</span></button></div>'}
  function plural(n,s){return n+' '+s+(n>1?'s':'')}
  function move(t,st){var old=t.st;if(old===st)return;t.st=st;draw();P.toast('« '+E(t.title)+' » : '+COLS.find(function(c){return c[0]===st})[1].toLowerCase(),{undo:function(){t.st=old;draw()}})}
  function dnd(){P.$$('.en-card',el).forEach(function(c){c.addEventListener('dragstart',function(e){e.dataTransfer.setData('text/plain',c.getAttribute('data-task'));e.dataTransfer.effectAllowed='move';setTimeout(function(){c.classList.add('drag')},0)});c.addEventListener('dragend',function(){c.classList.remove('drag');P.$$('.en-col',el).forEach(function(x){x.classList.remove('over')})})});
    P.$$('.en-col',el).forEach(function(col){col.addEventListener('dragover',function(e){e.preventDefault();col.classList.add('over')});col.addEventListener('dragleave',function(e){if(!col.contains(e.relatedTarget))col.classList.remove('over')});
      col.addEventListener('drop',function(e){e.preventDefault();var t=T.find(function(q){return q.id===e.dataTransfer.getData('text/plain')});if(t)move(t,col.getAttribute('data-col'))})})}
  draw();
  el.onclick=function(e){var t=e.target,x;
    if((x=t.closest('[data-tab]'))){SE.tab=x.getAttribute('data-tab');enSw=true;draw();return}
    if((x=t.closest('[data-view]'))){SE.view=x.getAttribute('data-view');enSw=true;draw();return}
    if((x=t.closest('[data-who]'))){SE.who=x.getAttribute('data-who');enSw=true;draw();return}
    if((x=t.closest('[data-chk]'))){var tk=T.find(function(q){return q.id===x.getAttribute('data-chk')}),rw=x.closest('.en-row');x.setAttribute('aria-checked',tk.st!=='fait');if(rw&&!P.RM)rw.classList.add('en-go');setTimeout(function(){move(tk,tk.st==='fait'?'todo':'fait')},260);return}
    if((x=t.closest('[data-task]'))){taskSheet(T.find(function(q){return q.id===x.getAttribute('data-task')}),draw);return}
    if(t.closest('[data-new]')){taskSheet(null,function(){SE.tab='tasks';draw()});return}
    if(t.closest('[data-rec]')){recSheet();return}
    if(t.closest('[data-inv]')){invSheet(draw);return}
    if(t.closest('[data-neweq]')){P.sheet({title:'Ajouter un matériel',icon:'wrench',body:'<div class="stack" style="--g:12px"><label class="field"><span>Nom</span><input class="in" placeholder="Exemple : quad Yamaha, épandeur, van 2 places"></label><label class="field"><span>Type</span><select class="in"><option>Véhicule</option><option>Outil attelé</option><option>Installation</option><option>Petit matériel</option></select></label><label class="field"><span>Prochaine échéance</span><input class="in" placeholder="Exemple : contrôle technique le 12 mars"></label><div class="note">'+ICON('scan','sm')+'<span>Photographiez la carte grise ou la facture : Stabl remplit la fiche et crée les rappels.</span></div></div>',foot:'<button class="btn pri" data-ok>Ajouter au parc</button>'}).querySelector('[data-ok]').onclick=function(){P.closeSheets();P.toast('Matériel ajouté, carnet d’entretien créé')};return}
    if((x=t.closest('[data-plan]'))){var eq=equip()[+x.getAttribute('data-plan')];addTask({title:eq.dueT+' : '+eq.name,zone:'Atelier',who:'s07',time:'Cette semaine',from:'Créée depuis le carnet d’entretien'});x.innerHTML=ICON('check','sm')+'Tâche créée';x.disabled=true;P.toast('Tâche créée pour Kévin : '+E(eq.dueT.toLowerCase()));return}
    if((x=t.closest('[data-book]'))||(x=t.closest('[data-eq]'))){equipSheet(equip()[+(x.getAttribute('data-book')||x.getAttribute('data-eq'))],draw);return}
    if((x=t.closest('[data-due]'))){var d=DUES[+x.getAttribute('data-due')];x.innerHTML=ICON('check','sm')+'Planifié';x.disabled=true;addTask({title:d[1]+' : '+d[0],zone:'Atelier',who:'s07',time:F.date(D.day(d[2]-7)),from:'Échéance réglementaire'});P.toast('Rendez-vous à prendre ajouté aux tâches de Kévin pour le '+F.date(D.day(d[2]-7)));return}
    if((x=t.closest('[data-ord]'))){order(stock().find(function(s){return s.id===x.getAttribute('data-ord')}),draw);return}
    if((x=t.closest('[data-sk]'))){stockSheet(stock().find(function(s){return s.id===x.getAttribute('data-sk')}),draw);return}
    if((x=t.closest('[data-spr]'))){var id=x.getAttribute('data-spr');spr[id]=1;draw();ARX[id].eau='à l’instant';P.toast('Arrosage lancé pour 12 minutes. Les reprises de 12 h sont prévenues.',{icon:'drop',undo:function(){delete spr[id];draw()}});return}
    if((x=t.closest('[data-stop]'))){delete spr[x.getAttribute('data-stop')];draw();P.toast('Arrosage arrêté',{icon:'pause'});return}
    if((x=t.closest('[data-hrs]'))){var ar=D.club.arenas.find(function(a){return a.id===x.getAttribute('data-hrs')});addTask({title:'Hersage, '+ar.name.toLowerCase(),zone:ar.name,who:'s07',time:'Demain '+((D.facts&&D.facts.hersage&&D.facts.hersage.at)||'13:30')});x.innerHTML=ICON('check','sm')+'Hersage planifié';x.disabled=true;P.toast('Hersage ajouté aux tâches de Kévin, demain à '+HZ);return}};
 }});

/* =====================================================================
   Palette, assistant, visite guidée
   ===================================================================== */
P.actions.push(
 {role:'gerant',label:'Ouvrir le plan 3D de l’écurie',icon:'cube',run:function(){P.go('ecurie3d')}},
 {role:'gerant',label:'Assigner un cheval à un box libre',icon:'stable',run:function(){var f=boxes().find(function(b){return !occ(b)});P.go('ecurie3d',f?{box:f.id}:{})}},
 {role:'gerant',label:'Voir la caméra du box B23 (Xanthos)',icon:'camera',run:function(){P.go('cameras',{cam:'cam2'})}},
 {role:'gerant',label:'Régler les règles d’alerte',icon:'bell',run:function(){SC.tab='rules';P.go('cameras')}},
 {role:'gerant',label:'Créer une tâche d’entretien',icon:'upkeep',run:function(){SE.tab='tasks';P.go('entretien');setTimeout(function(){taskSheet(null,P.rerender)},320)}},
 {role:'gerant',label:'Commander des copeaux',icon:'truck',run:function(){SE.tab='stock';P.go('entretien');var s=stock().find(function(q){return q.id==='k2'});if(!s.x.order)setTimeout(function(){order(s,P.rerender)},320)}},
 {role:'gerant',label:'Faire l’inventaire des stocks',icon:'stock',run:function(){SE.tab='stock';P.go('entretien');setTimeout(function(){invSheet(P.rerender)},320)}});

P.brain.push(
 {role:'gerant',re:/box(es)?\s.*libre|libre.*box|place.*(pension|box)|occupation|combien de box/i,reply:function(){var all=boxes(),free=all.filter(function(b){return !occ(b)}),rq=requests();
   return {text:free.length?free.length+' box'+(free.length>1?'es sont libres':' est libre')+' sur '+all.length+' : '+free.map(function(b){return b.name}).join(' et ')+' ('+(BLD[free[0].bld]||'nouveaux boxes')+'). '+rq.length+' demandes de pension attendent une place :':'Les '+all.length+' boxes sont occupés. '+rq.length+' demandes de pension sont en attente.',
     card:rq.map(function(r){return '<div class="hrow sp"><span class="s"><b>'+E(r.name)+'</b> · '+E(r.owner)+'</span><span class="s num mut">'+F.eur(r.price)+' / mois</span></div>'}).join(''),
     actions:[{label:'Ouvrir le plan 3D',run:function(){P.go('ecurie3d',free[0]?{box:free[0].id}:{});return 'Plan ouvert'}}].concat(free.length&&rq.length?[{label:'Installer '+rq[0].name.split(' ')[0]+' en '+free[0].name,run:function(){var b=free[0],r=rq[0];b.guest={name:r.name,breed:r.breed,owner:r.owner,kind:'proprietaire',note:r.kind+', '+F.eur(r.price)+' par mois'};b.where='box';r.done=true;P.toast(E(r.name)+' est installé en '+b.name+'. Contrat prêt à signer.');return r.name+' installé en '+b.name}}]:[])}}},
 {role:'gerant',re:/capteur|cam[ée]ra|abreuvoir|xanthos|colique|alerte|surveill/i,reply:function(){var w=D.sensors.filter(function(s){return s.state!=='ok'}),ev=D.camEvents.filter(function(e){return e.st==='à voir'});
   return {text:w.length+' capteur sur '+D.sensors.length+' sort de la normale et '+ev.length+' détections vidéo restent à voir. Le point sensible est Xanthos (B23) : il boit 40 % de moins et s’est couché 4 fois depuis 6 h.',
     card:w.map(function(s){return '<div class="hrow sp"><span class="s">'+E(s.name)+'</span><b class="s num warnc">'+E(s.val)+'</b></div>'}).concat(ev.slice(0,2).map(function(e){return '<div class="hrow sp"><span class="s ellip">'+E(e.title)+'</span><span class="xs mut num" style="flex:none">'+E(e.t)+'</span></div>'})).join(''),
     actions:[{label:'Voir la caméra du B23',run:function(){P.go('cameras',{cam:'cam2'});return 'Caméra ouverte'}},{label:'Prévenir Antoine',run:function(){P.toast('SMS envoyé à Antoine avec le lien de la caméra');return 'Antoine prévenu par SMS'}}]}}},
 {role:'gerant',re:/stock|copeaux|foin|paille|granul|commande|rupture|vermifuge/i,reply:function(){var L=stock(),low=L.filter(function(s){return s.low}),k2=L.find(function(s){return s.id==='k2'});
   return {text:low.length?low.length+' articles sont sous leur seuil. Les copeaux tiennent encore '+Math.floor(k2.days)+' jours à 9 sacs par jour. Le foin couvre '+Math.floor(L[0].days)+' jours.':'Tous les stocks sont au-dessus de leur seuil.',
     card:L.map(function(s){return '<div class="hrow sp"><span class="s">'+E(s.name)+'</span><b class="s num '+(s.low?'warnc':'')+'">'+(s.days==null?s.qty+' '+E(s.unit):Math.floor(s.days)+' jours')+'</b></div>'}).join(''),
     actions:(k2.x.order?[]:[{label:'Commander 60 sacs de copeaux',run:function(){k2.x.order={qty:60,eta:'jeudi'};P.toast('Commande de 60 sacs envoyée à Litière Pro pour '+F.eur(690)+'. Livraison jeudi.');return 'Commande envoyée, livraison jeudi'}}]).concat([{label:'Voir les stocks',run:function(){SE.tab='stock';P.go('entretien');return 'Stocks ouverts'}}])}}},
 {role:'gerant',re:/t[âa]che|entretien|herse|tracteur|contr[ôo]le technique|vidange|mat[ée]riel|carri[èe]re/i,reply:function(){var T=tasks(),todo=T.filter(function(t){return t.st!=='fait'}),urg=todo.filter(function(t){return t.urgent});
   return {text:todo.length+' tâches restent à faire aujourd’hui, dont '+urg.length+' urgente. Côté matériel, la herse et le solarium sont à réviser, et le contrôle annuel du marcheur tombe dans 16 jours.',
     card:todo.slice(0,4).map(function(t){return '<div class="hrow sp"><span class="s ellip">'+E(t.title)+'</span><span class="xs mut num" style="flex:none">'+E(t.time)+'</span></div>'}).join(''),
     actions:[{label:'Ouvrir les tâches',run:function(){SE.tab='tasks';P.go('entretien');return 'Tâches ouvertes'}},{label:'Voir les échéances',run:function(){SE.tab='equip';P.go('entretien');return 'Échéances ouvertes'}}]}}});

P.tourSteps.push({route:'ecurie3d',title:'L’écurie en maquette vivante',text:'Les 46 boxes, les carrières et les paddocks en 3D. Chaque box prend la couleur de son état, les caméras s’ouvrent depuis leur emplacement, et le mode constructeur redessine le plan en glissant les boxes.'});

/* =====================================================================
   Manche 3 : entretien en direction Paddock
   ===================================================================== */
P.css(`
.en-bento{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-bottom:22px}
.en-hero{grid-column:span 2;grid-row:span 2;position:relative;overflow:hidden;padding:24px 26px;display:flex;min-height:280px}
.en-hc{position:relative;z-index:1;display:flex;flex-direction:column;gap:14px;min-width:0;flex:1}
.en-eb{display:inline-flex;align-items:center;gap:8px;font-size:14.5px;font-weight:600;align-self:flex-start;padding:7px 14px 7px 11px;border-radius:99px;background:color-mix(in srgb,var(--surface) 70%,transparent)}
.en-hb{display:flex;align-items:baseline;gap:12px}
.en-hb .big{font-size:84px;letter-spacing:-.06em;line-height:.9}
.en-hu{font:800 22px var(--f-display);letter-spacing:-.03em}
.en-prog{display:flex;height:14px;border-radius:99px;background:color-mix(in srgb,var(--surface) 70%,transparent);overflow:hidden;max-width:62%}
.en-prog i{width:var(--w);background:var(--c);transform-origin:left;animation:enGrow .9s var(--e-out) both}
@keyframes enGrow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.en-team{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto;max-width:calc(100% - 170px)}
.en-tp{display:flex;align-items:center;gap:10px;padding:6px 14px 6px 6px;border-radius:16px;background:color-mix(in srgb,var(--surface) 72%,transparent);color:inherit;text-align:left;transition:background var(--t-2),transform var(--t-1) var(--e-out)}
.en-tp:hover{background:var(--surface)}.en-tp:active{transform:scale(.97)}
.en-tp .av{width:36px;height:36px}
.en-tp b{display:block;font-size:14.5px}.en-tp small{display:block;font-size:13px;opacity:.8}
.en-hi{position:absolute;right:-6px;bottom:-4px;width:min(32%,190px);aspect-ratio:1;pointer-events:none}
.en-hi svg.illu{width:100%;height:100%;display:block}
.en-t{display:flex;flex-direction:column;align-items:stretch;gap:8px;padding:18px 20px;text-align:left;cursor:pointer;transition:transform var(--t-2) var(--e-out),box-shadow var(--t-2)}
.en-t:hover{transform:translateY(-2px);box-shadow:inset 0 0 0 1.5px var(--d,var(--line-2)),var(--shadow-1)}
.en-t .lab{display:flex;align-items:center;gap:10px;font-size:14.5px;font-weight:600;color:var(--ink-2)}
.en-t.tint .lab{color:inherit}
.en-t .v{font:800 38px/1 var(--f-display);letter-spacing:-.045em}
.en-t .s{font-size:14px;line-height:1.4;color:var(--mut);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}
.en-t.tint .s{color:inherit;opacity:.85}
.en-kan{gap:16px}
.en-col{padding:14px;gap:10px;border-radius:24px;background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);min-height:300px}
.en-c-cours{background:color-mix(in srgb,var(--acc-bg) 55%,var(--surface))}
.en-c-fait{background:color-mix(in srgb,var(--hz-bg) 50%,var(--surface))}
.en-colh{padding:4px 6px 6px;font:800 17px var(--f-display);letter-spacing:-.02em}
.en-cd{width:10px;height:10px;border-radius:50%;background:var(--mut-2);display:inline-block}
.en-c-cours .en-cd{background:var(--acc);box-shadow:0 0 0 4px color-mix(in srgb,var(--acc) 22%,transparent)}
.en-c-fait .en-cd{background:var(--ok)}
.en-colh .n{font:700 14px var(--f-text);min-width:30px;height:30px;padding:0 9px;border-radius:99px;background:var(--surface);display:grid;place-items:center;color:var(--ink-2)}
.en-cl{display:flex;flex-direction:column;gap:10px}
.en-card{padding:16px;gap:12px;border-radius:18px;box-shadow:inset 0 0 0 1px var(--line);position:relative;overflow:hidden}
.en-card::before{content:"";position:absolute;left:0;top:14px;bottom:14px;width:4px;border-radius:0 4px 4px 0;background:var(--line-2)}
.en-k-soin::before{background:var(--cr)}.en-k-entretien::before{background:var(--wk)}.en-k-routine::before{background:var(--hz)}
.en-card.urg{box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--bad) 55%,transparent)}
.en-card:hover{transform:translateY(-3px);box-shadow:inset 0 0 0 1px var(--line-2),0 14px 30px -14px color-mix(in srgb,var(--ink) 35%,transparent)}
.en-card:active{cursor:grabbing}
.en-card.done{background:color-mix(in srgb,var(--surface) 70%,transparent)}
.en-card.done::before{background:var(--ok)}
.en-tt{font-size:15.5px;line-height:1.35}
.en-tm{display:inline-flex;align-items:center;gap:5px;font-size:13.5px;font-weight:600;color:var(--mut)}
.en-tm svg.i{width:16px;height:16px}
.en-cf{font-size:13.5px}.en-cf svg.i{width:17px;height:17px}
.en-empty{display:flex;flex-direction:column;align-items:center;gap:8px;padding:28px 12px;border-radius:18px;border:1.5px dashed var(--line-2);color:var(--mut);font-size:14px;text-align:center}
.en-add{display:flex;align-items:center;justify-content:center;gap:8px;min-height:46px;border-radius:16px;border:1.5px dashed var(--line-2);color:var(--mut);font-weight:600;font-size:14.5px;transition:border-color var(--t-2),color var(--t-2),background var(--t-2)}
.en-add:hover{border-color:var(--acc);color:var(--acc);background:var(--surface)}
.en-row{padding:14px 20px;gap:14px}
.en-gh{font-size:13px;padding:18px 20px 8px}
.en-eq{padding:20px;gap:14px}
.en-due{padding:12px 20px}
.en-due .dd{width:52px;height:52px;border-radius:15px;font-size:18px}
.en-sk{padding:16px 20px}
.en-ar{padding:20px;gap:16px}
.en-met>div{padding:12px 14px;border-radius:14px}
.en-met b{font-size:16px}
.en-wk .c{height:40px;border-radius:10px}
.en-wk .c svg.i{width:18px;height:18px}
@container main (max-width:1080px){.en-bento{grid-template-columns:repeat(2,minmax(0,1fr))}.en-hero{grid-row:auto}}
@container main (max-width:760px){.en-col{flex-basis:86%;min-height:0}.en-hero{min-height:250px}.en-hb .big{font-size:68px}.en-prog{max-width:100%}}
@container main (max-width:520px){.en-bento{gap:10px;margin-bottom:16px}.en-hero{padding:20px}.en-team{max-width:none}.en-hi{width:34%;top:16px;bottom:auto;right:6px}.en-t{padding:14px 16px}.en-t .v{font-size:30px}.en-t .lab{font-size:13.5px;gap:8px}.en-t .lab .ico{width:28px;height:28px}.en-t .s{font-size:13px}}
`);

/* ---- caméras : mosaïque premium ---- */
P.css(`
.cm-hero{padding:20px 22px;gap:18px;margin-bottom:18px;border-radius:24px}
.cm-hero .tx .b{font:800 19px/1.25 var(--f-display)!important;letter-spacing:-.02em!important}
.cm-hero .tx .s{color:inherit;opacity:.85;font-size:15px;margin-top:4px}
.cm-hero .btn:not(.pri){background:var(--surface)}
.cm-hero>.ico{background:var(--surface);color:var(--bad)}
.cm-lay{grid-template-columns:minmax(0,1fr) 360px;gap:18px}
.cm-wall{gap:14px}
.cm-tile{border-radius:20px;box-shadow:0 1px 2px color-mix(in srgb,var(--ink) 14%,transparent);isolation:isolate}
.cm-tile .ec-feed{transition:transform .6s var(--e-out)}
.cm-tile:hover{transform:translateY(-3px);box-shadow:0 18px 36px -16px color-mix(in srgb,var(--ink) 50%,transparent)}
.cm-tile:hover .ec-feed{transform:scale(1.04)}
.cm-tile.al{box-shadow:0 0 0 3px var(--bad),0 18px 36px -18px color-mix(in srgb,var(--bad) 60%,transparent)}
.cm-tb{position:absolute;left:0;right:0;top:0;display:flex;align-items:center;gap:10px;padding:12px 12px 28px 12px;background:linear-gradient(to bottom,rgba(6,8,12,.7),rgba(6,8,12,0));pointer-events:none;z-index:1}
.cm-tb .live{position:static;flex:none}
.cm-tb .cm-name{position:static;padding:0;background:none;font-size:14.5px;font-weight:700;letter-spacing:-.005em;text-shadow:0 1px 2px rgba(0,0,0,.5);min-width:0;flex:1}
.cm-zoom{position:absolute;left:50%;top:50%;margin:-24px 0 0 -24px;width:48px;height:48px;border-radius:50%;display:grid;place-items:center;color:#fff;background:rgba(10,12,18,.55);backdrop-filter:blur(8px);opacity:0;transform:scale(.85);transition:opacity var(--t-2),transform var(--t-2) var(--e-spring);z-index:2}
.cm-tile:hover .cm-zoom,.cm-tile:focus-visible .cm-zoom{opacity:1;transform:none}
.cm-tile .cm-al{right:12px;bottom:34px;font-size:13.5px;padding:6px 11px 6px 9px;border-radius:10px;gap:6px}
.cm-tile .cm-al svg.i{width:16px;height:16px}
.cm-opt{border-radius:20px}
.cm-ev{padding:14px 20px;gap:14px}
.cm-ev .t{font-size:14.5px}
.cm-evc{grid-template-columns:200px minmax(0,1fr) auto;gap:18px;padding:16px 4px}
.cm-th{border-radius:14px}
.cm-sens{padding:20px;gap:12px}
.cm-sens .v{font:800 34px/1 var(--f-display);letter-spacing:-.04em}
.cm-rule{padding:16px 20px}
.cm-ok{padding:14px 20px}
@container main (max-width:1180px){.cm-lay{grid-template-columns:minmax(0,1fr) 320px}}
@container main (max-width:1080px){.cm-lay{grid-template-columns:minmax(0,1fr)}}
@container main (max-width:760px){.cm-wall{gap:10px}.cm-tile{border-radius:16px}.cm-tb{padding:9px 9px 22px;gap:7px;flex-direction:column;align-items:flex-start}.cm-tb .cm-name{font-size:13px;width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.cm-tb .live{font-size:13px;padding:4px 7px}.cm-zoom{display:none}.cm-hero{padding:16px}.cm-hero .tx .b{font-size:17px!important}.cm-evc{grid-template-columns:120px minmax(0,1fr);gap:12px}}
`);

/* ---- manche 4 : transitions et corrections ---- */
P.css(`
.ec-sw{animation:ecSw .24s var(--e-out) both}
@keyframes ecSw{from{opacity:0;transform:translateY(10px)}}
.en-row.en-go{transition:opacity .26s var(--e-out),transform .26s var(--e-out);opacity:.4;transform:translateX(14px)}
.en-hi .il-tw{display:none}
.cm-ha{flex-wrap:wrap;justify-content:flex-end}
.cm-tb{flex-direction:column;align-items:flex-start;gap:8px}
.cm-tb .cm-name{width:100%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;flex:none}
.e3-zl.e3-hid{opacity:0!important;pointer-events:none}
@container main (max-width:520px){.cm-ha .btn{flex:1 1 auto}}
@media (prefers-reduced-motion:reduce){.ec-sw{animation:none}}
`);

/* ---- plan 3D : finitions Paddock ---- */
P.css(`
.e3-wrap{grid-template-columns:minmax(0,1fr) 340px;gap:18px}
.e3-stage{border-radius:24px;background:radial-gradient(80% 70% at 50% 40%,var(--surface) 0%,transparent 75%),linear-gradient(180deg,color-mix(in srgb,var(--hz-bg) 40%,var(--surface)) 0%,color-mix(in srgb,var(--hz-bg) 70%,var(--bg-2)) 100%)}
.e3-glass{border-radius:16px;padding:4px}
.e3-lg{height:40px;padding:0 14px;font-size:14px;gap:8px}
.e3-lg i,.e3-st i{width:10px;height:10px;border-radius:4px}
.e3-hint{font-size:13.5px;top:70px}
.e3-card{width:320px;padding:18px;border-radius:22px}
.e3-card h3{font:800 20px/1.15 var(--f-display);letter-spacing:-.02em}
.e3-tip{font-size:13.5px;padding:7px 11px;border-radius:10px}
.e3-list{border-radius:24px}
.e3-lh{padding:14px}
.e3-gh{font-size:13px;padding:14px 10px 8px}
.e3-row{grid-template-columns:48px minmax(0,1fr) auto;gap:12px;padding:10px;border-radius:14px}
.e3-row b{font-size:15px}
.e3-row .xs{font-size:13.5px}
.e3-bn{height:32px;border-radius:10px;font:800 14px var(--f-display);letter-spacing:-.01em;background:var(--hz-bg);color:var(--hz-ink)}
.e3-st{font-size:13.5px}
.e3-camb{width:32px;height:32px;margin:-16px 0 0 -16px}.e3-camb svg.i{width:17px;height:17px}
.e3-banner{font-size:14px;padding:10px 10px 10px 18px}
`);

/* =====================================================================
   6 · CONSTRUIRE SON CENTRE EN 3D
   Un plan simple : poser des éléments sur une grille (boxes, carrière, manège, rond, paddocks dessinés au doigt,
   bâtiments, parking, marcheur), les déplacer, tourner, dupliquer, supprimer, annuler et rétablir ; vue de dessus
   et vue 3D avec transition ; boxes reliés aux vrais chevaux (champ box du cheval).
   Enregistrement : démo → stockage local ; appli → collection sitePlan (un objet par élément), synchronisée
   comme les autres données (et donc aussi hors ligne, par la file de app/web/live/30-sync.js).
   ===================================================================== */
var KBW=3.6,KBD=6.2;
var KT={
  boxes:{l:'Barre de boxes',s:'Boxes',icon:'stable',w:36,d:KBD},
  carriere:{l:'Carrière',s:'Carrière',icon:'arena',w:60,d:30,sizes:[[40,20],[60,20],[60,30],[80,40]]},
  manege:{l:'Manège couvert',s:'Manège',icon:'arena',w:40,d:20,sizes:[[30,15],[40,20],[60,25]]},
  rond:{l:'Rond de longe',s:'Rond',icon:'repeat',w:18,d:18,round:true,sizes:[[15,15],[18,18],[20,20]]},
  paddock:{l:'Paddock ou pré',s:'Paddock',icon:'paddock',w:30,d:24},
  sellerie:{l:'Sellerie',s:'Sellerie',icon:'saddle',w:9,d:6},
  club:{l:'Club-house',s:'Club-house',icon:'members',w:14,d:9},
  fumiere:{l:'Fumière',s:'Fumière',icon:'shavings',w:10,d:7},
  foin:{l:'Stockage du foin',s:'Foin',icon:'hay',w:14,d:9},
  parking:{l:'Parking',s:'Parking',icon:'car',w:24,d:14,sizes:[[16,12],[24,14],[36,18]]},
  marcheur:{l:'Marcheur',s:'Marcheur',icon:'rotate',w:16,d:16,round:true}};
var KORDER=['boxes','carriere','manege','rond','paddock','marcheur','sellerie','club','foin','fumiere','parking'];
var KS={view:'3d',sel:null,undo:[],redo:[],side:'add',armed:null};
var KKEY='stabl:demo:centre3d:v1';
function kLive(){return !!(window.PL&&PL.clubId&&!PL.sandbox)}
function kId(){return 'sp_'+Date.now().toString(36)+Math.random().toString(36).slice(2,7)}
function kClone(o){return JSON.parse(JSON.stringify(o))}
function kLoad(){var a=null;
  if(kLive()){a=(Array.isArray(D.sitePlan)?D.sitePlan:[]).filter(function(x){return x&&x.t&&KT[x.t]})}
  else{try{a=JSON.parse(localStorage.getItem(KKEY)||'null')}catch(e){a=null}}
  return Array.isArray(a)?kClone(a):[]}
function kSave(items){
  if(kLive()){if(!Array.isArray(D.sitePlan))D.sitePlan=[];var arr=D.sitePlan;arr.length=0;items.forEach(function(it){arr.push(kClone(it))});try{PL.sync&&PL.sync.schedule()}catch(e){}return}
  try{localStorage.setItem(KKEY,JSON.stringify(items))}catch(e){}}
/* étiquettes de box : B01, B02… (compatibles avec la fiche des chevaux) */
function kLabels(items){var s={};items.forEach(function(it){(it.labels||[]).forEach(function(l){s[l]=1})});return s}
function kNextLabel(used){var n=1;while(used['B'+pad(n)])n++;used['B'+pad(n)]=1;return 'B'+pad(n)}
function kFit(it,items){if(it.t!=='boxes')return;var used=kLabels(items.filter(function(x){return x!==it})),l=(it.labels||[]).filter(function(x){return !used[x]}).slice(0,it.n);
  l.forEach(function(x){used[x]=1});while(l.length<it.n)l.push(kNextLabel(used));it.labels=l;it.w=it.n*KBW;it.d=KBD}
function kFp(it){if(it.t==='paddock'&&it.pts&&it.pts.length>2){var xs=it.pts.map(function(p){return p[0]}),zs=it.pts.map(function(p){return p[1]});return [Math.max.apply(null,xs)-Math.min.apply(null,xs),Math.max.apply(null,zs)-Math.min.apply(null,zs)]}return [it.w,it.d]}
function kName(t,items){var b=KT[t].s,n=items.filter(function(x){return x.t===t}).length;
  if(t==='boxes')return 'Écurie '+('ABCDEFGHIJKLMNOP'.charAt(n)||(n+1));if(t==='paddock')return 'Paddock '+(n+1);return n?b+' '+(n+1):KT[t].l}
function kMake(t,items,o){var k=KT[t],it=Object.assign({id:kId(),t:t,x:0,z:0,r:0,w:k.w,d:k.d,name:kName(t,items)},o||{});
  if(t==='boxes'){it.n=it.n||10;kFit(it,items)}
  if(t==='paddock'&&!it.pts){var w=it.w/2,d=it.d/2;it.pts=[[-w,-d],[w,-d],[w,d],[-w,d]]}
  return it}
function kHorseIn(label){if(!label)return null;return D.horses.find(function(h){return h.box===label})||null}

/* ---------- Générateur : un plan propre à partir de quelques réponses ---------- */
function kGen(o){var items=[],r=function(t,x,z,ex){var it=kMake(t,items,Object.assign({x:x,z:z},ex||{}));items.push(it);return it};
  var nb=Math.max(0,Math.min(120,o.boxes|0)),rows=nb?Math.ceil(nb/12):0,per=rows?Math.ceil(nb/rows):0,left=nb,maxW=0,zb=0;
  for(var i=0;i<rows;i++){var n=Math.min(per,left);left-=n;var w=n*KBW;maxW=Math.max(maxW,w);var pair=Math.floor(i/2),z=pair*24+(i%2?KBD+3.4:0);
    r('boxes',w/2,z,{n:n,r:i%2?180:0,name:rows>1?'Écurie '+'ABCDEFGHIJ'.charAt(i):'Écurie'});zb=z}
  if(!rows)maxW=20;
  var sx=maxW+10;
  r('sellerie',sx+4.5,0,{});r('foin',sx+7,12,{});r('fumiere',sx+5,24+Math.max(0,zb-6),{});
  var ax=sx+22,az=-4,ex=ax;
  if(o.carr>=1){r('carriere',ax+30,az,{});ex=ax+60}
  if(o.carr>=2){r('carriere',ax+30,az+38,{name:'Carrière 2',w:60,d:30})}
  if(o.manege){r('manege',ex+8+20,az-5,{});ex=ex+8+40}
  var ry=o.carr>=2?az+38:az+28;
  if(o.rond!==false&&nb>=8)r('rond',ax+(o.carr>=2?72:10),ry,{});
  if(o.marcheur)r('marcheur',ax+(o.carr>=2?92:32),ry,{});
  var np=o.paddocks!=null?o.paddocks:Math.max(2,Math.min(10,Math.round(nb/5)));
  var pc=Math.max(1,Math.min(5,Math.ceil(np/2)));for(var p=0;p<np;p++){var pw=28,pd=22;r('paddock',(p%pc)*(pw+4)+pw/2-4,-30-Math.floor(p/pc)*(pd+4),{w:pw,d:pd,name:'Paddock '+(p+1)})}
  var south=Math.max(zb+KBD+14,30);r('club',8,south,{});r('parking',32,south+1,{});
  /* recentrage */
  var bx=[1e9,1e9,-1e9,-1e9];items.forEach(function(it){var f=kFp(it);bx[0]=Math.min(bx[0],it.x-f[0]/2);bx[1]=Math.min(bx[1],it.z-f[1]/2);bx[2]=Math.max(bx[2],it.x+f[0]/2);bx[3]=Math.max(bx[3],it.z+f[1]/2)});
  var cx=Math.round((bx[0]+bx[2])/2),cz=Math.round((bx[1]+bx[3])/2);items.forEach(function(it){it.x-=cx;it.z-=cz});
  return items}
var KTPL=[
  {k:'petit',l:'Petit club',s:'12 boxes, une carrière, un rond de longe, trois paddocks',o:{boxes:12,carr:1,manege:false,paddocks:3}},
  {k:'pension',l:'Écurie de pension',s:'30 boxes, carrière, manège, marcheur, six prés',o:{boxes:30,carr:1,manege:true,marcheur:true,paddocks:6}},
  {k:'grand',l:'Grand centre',s:'46 boxes, deux carrières, manège, rond, marcheur, huit paddocks',o:{boxes:46,carr:2,manege:true,marcheur:true,paddocks:8}}];

/* ---------- Petite géométrie ---------- */
function kMerge(T,parts){var pos=[],nor=[],idx=[],base=0;parts.forEach(function(p){var g=new T.BoxGeometry(p[0],p[1],p[2]);if(p[6])g.rotateY(p[6]);g.translate(p[3],p[4],p[5]);var a=g.attributes.position.array,n=g.attributes.normal.array,ix=g.index.array,i;for(i=0;i<a.length;i++){pos.push(a[i]);nor.push(n[i])}for(i=0;i<ix.length;i++)idx.push(ix[i]+base);base+=a.length/3;g.dispose()});
  var G=new T.BufferGeometry();G.setAttribute('position',new T.Float32BufferAttribute(pos,3));G.setAttribute('normal',new T.Float32BufferAttribute(nor,3));G.setIndex(idx);return G}
function kRdp(pts,eps){if(pts.length<3)return pts;var a=pts[0],b=pts[pts.length-1],dm=0,ix=0;for(var i=1;i<pts.length-1;i++){var p=pts[i],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz)||1,d=Math.abs(dz*p[0]-dx*p[1]+b[0]*a[1]-b[1]*a[0])/L;if(d>dm){dm=d;ix=i}}
  if(dm>eps){var l=kRdp(pts.slice(0,ix+1),eps),r=kRdp(pts.slice(ix),eps);return l.slice(0,-1).concat(r)}return [a,b]}
function kArea(pts){var s=0;for(var i=0;i<pts.length;i++){var p=pts[i],q=pts[(i+1)%pts.length];s+=p[0]*q[1]-q[0]*p[1]}return Math.abs(s)/2}

/* ---------- Scène three.js du constructeur ---------- */
function kScene(host,o){
  if(!window.THREE)return null;var T=THREE,ren;
  try{ren=new T.WebGLRenderer({antialias:!o.mobile,alpha:true,powerPreference:'high-performance'})}catch(e){return null}
  var W=host.clientWidth||800,H=host.clientHeight||520,alive=true,RM=P.RM,mob=!!o.mobile,dpr=Math.min(window.devicePixelRatio||1,2);
  ren.setPixelRatio(mob?1:dpr);ren.setSize(W,H,false);ren.outputEncoding=T.sRGBEncoding;
  ren.shadowMap.enabled=true;ren.shadowMap.type=T.PCFSoftShadowMap;ren.shadowMap.autoUpdate=false;
  var cv=ren.domElement;cv.className='kc-cv';host.appendChild(cv);
  var ov=document.createElement('div');ov.className='kc-ov';host.appendChild(ov);
  var sc=new T.Scene(),cam=new T.PerspectiveCamera(32,W/H,1,4000),root=new T.Group();sc.add(root);
  var cs=getComputedStyle(document.documentElement),dark=false;
  function tok(n){return cs.getPropertyValue('--'+n).trim()||'#888888'}
  function col(n){return new T.Color(tok(n)).convertSRGBToLinear()}
  function mix(a,b,k){return col(a).lerp(col(b),k)}
  function chk(){var c=new T.Color(tok('bg'));dark=(c.r+c.g+c.b)/3<.4}chk();
  var mats=[];function M(fn,p,Cl){var m=new (Cl||T.MeshLambertMaterial)(p||{});m.userData.fn=fn;m.color.copy(fn());mats.push(m);return m}
  var MT={
    ground:M(function(){return mix('surface','ok',dark?.07:.13)}),grass:M(function(){return mix('surface','ok',dark?.2:.3)}),
    sand:M(function(){return mix('surface','hay',dark?.3:.55)}),conc:M(function(){return mix('bg-2','line-2',dark?.7:.55)}),
    wall:M(function(){return dark?mix('raise','ink',.18):col('surface')}),wall2:M(function(){return dark?mix('raise','ink',.08):mix('surface','line-2',.35)}),
    wood:M(function(){return mix('c4','ink',dark?.55:.42)}),door:M(function(){return mix('acc','surface',dark?.35:.25)}),
    roofH:M(function(){return mix('hz','surface',dark?.3:.42)}),roofA:M(function(){return mix('acc','surface',dark?.42:.55)}),roofM:M(function(){return mix('mo','surface',dark?.32:.42)}),
    roofC:M(function(){return mix('c5','surface',dark?.4:.5)}),roofT:M(function(){return mix('tm','surface',dark?.35:.45)}),
    fence:M(function(){return dark?mix('line-2','ink',.3):col('surface')}),asph:M(function(){return mix('ink','bg-2',dark?.6:.72)}),
    paint:M(function(){return col('surface')}),hay:M(function(){return mix('c4','surface',dark?.35:.3)}),dung:M(function(){return mix('c4','ink',.68)}),
    horse:M(function(){return dark?mix('ink','acc',.15):col('ink')},{side:T.DoubleSide}),car:M(function(){return mix('acc','surface',.3)}),car2:M(function(){return mix('c6','surface',.35)}),
    tree:M(function(){return mix('ok','surface',dark?.42:.4)}),trunk:M(function(){return col('mut-2')}),
    sel:M(function(){return col('acc')},{transparent:true,opacity:.95},T.LineBasicMaterial),
    selF:M(function(){return col('acc')},{transparent:true,opacity:.14,depthWrite:false},T.MeshBasicMaterial),
    hit:M(function(){return col('acc')},{transparent:true,opacity:0,depthWrite:false},T.MeshBasicMaterial),
    hov:M(function(){return col('acc')},{transparent:true,opacity:.22,depthWrite:false},T.MeshBasicMaterial),
    draw:M(function(){return col('acc')},{},T.LineBasicMaterial),
    grid:M(function(){return mix('bg-2','ink',dark?.2:.12)},{transparent:true,opacity:.5},T.LineBasicMaterial)};
  /* sol, grille, arbres décoratifs */
  var ground=new T.Mesh(new T.PlaneGeometry(900,900),MT.ground);ground.rotation.x=-Math.PI/2;ground.receiveShadow=true;sc.add(ground);
  var grid=(function(){var p=[],S=200;for(var i=-S;i<=S;i+=5){p.push(-S,.02,i,S,.02,i,i,.02,-S,i,.02,S)}var g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(p,3));return new T.LineSegments(g,MT.grid)})();sc.add(grid);
  var hemi=new T.HemisphereLight(0xffffff,0xffffff,.62),sun=new T.DirectionalLight(0xffffff,.5);sun.position.set(-80,140,90);sun.castShadow=true;
  var sm=mob?1024:2048;sun.shadow.mapSize.set(sm,sm);sun.shadow.camera.left=-170;sun.shadow.camera.right=170;sun.shadow.camera.top=170;sun.shadow.camera.bottom=-170;sun.shadow.camera.far=500;sun.shadow.bias=-.0006;sun.shadow.radius=4;
  sc.add(hemi,sun,sun.target);
  function lights(){hemi.groundColor.copy(MT.ground.color);hemi.intensity=dark?.72:.6;sun.intensity=dark?.55:.62}lights();
  var objs={},horseMesh=null,HS=1.7;
  if(window.HORSE){(function(){var V=new Float32Array(HORSE.n*3);HORSE.lerp(.15,V);var g0=new T.BufferGeometry();g0.setAttribute('position',new T.BufferAttribute(V,3));g0.setIndex(Array.prototype.slice.call(HORSE.idx));
    var hg=g0.toNonIndexed();g0.dispose();hg.computeVertexNormals();horseMesh=new T.InstancedMesh(hg,MT.horse,240);horseMesh.castShadow=true;horseMesh.frustumCulled=false;horseMesh.count=0;root.add(horseMesh)})()}
  var selLine=null,selFill=null,hy=o.view==='top'?.04:1,drawLine=null,hovMesh=null;
  var dm=new T.Object3D(),ray=new T.Raycaster(),ndc=new T.Vector2(),plane=new T.Plane(new T.Vector3(0,1,0),0),tmp=new T.Vector3();
  /* --- fabrication d'un élément --- */
  function mesh(g,m,sh){var me=new T.Mesh(g,m);me.castShadow=sh!==false;me.receiveShadow=true;return me}
  function gable(w,d,h0,h1,m){var s=new T.Shape();s.moveTo(-d/2,0);s.lineTo(d/2,0);s.lineTo(0,h1-h0);s.lineTo(-d/2,0);var g=new T.ExtrudeGeometry(s,{depth:w,bevelEnabled:false});g.rotateY(Math.PI/2);g.translate(-w/2,h0,0);return mesh(g,m)}
  function fenceParts(pts,closed,y0,gap){var parts=[];var n=pts.length,lim=closed?n:n-1;
    for(var i=0;i<lim;i++){var a=pts[i],b=pts[(i+1)%n],dx=b[0]-a[0],dz=b[1]-a[1],L=Math.hypot(dx,dz);if(L<.2)continue;var ang=-Math.atan2(dz,dx);
      [.55,1.1].forEach(function(y){parts.push([L,.09,.09,(a[0]+b[0])/2,y,(a[1]+b[1])/2,ang])});
      var k=Math.max(1,Math.round(L/(gap||3)));for(var j=0;j<k;j++){var t=j/k;parts.push([.14,1.3,.14,a[0]+dx*t,.65,a[1]+dz*t])}}
    if(!closed){var e=pts[n-1];parts.push([.14,1.3,.14,e[0],.65,e[1]])}
    return parts}
  function rectPts(w,d){return [[-w/2,-d/2],[w/2,-d/2],[w/2,d/2],[-w/2,d/2]]}
  function circPts(r,n){var o2=[];for(var i=0;i<n;i++){var a=i/n*Math.PI*2;o2.push([Math.cos(a)*r,Math.sin(a)*r])}return o2}
  function build(it){var g=new T.Group(),bld=new T.Group(),flat=new T.Group(),w=it.w,d=it.d;g.add(flat);g.add(bld);g.userData.id=it.id;var picks=[];
    function slab(m,ww,dd,y,hh){var me=mesh(new T.BoxGeometry(ww,hh||.12,dd),m,false);me.position.y=(y||0)+(hh||.12)/2;flat.add(me);return me}
    function pick(ww,dd,hh,x,z,box){var me=new T.Mesh(new T.BoxGeometry(ww,hh,dd),MT.hit);me.position.set(x||0,hh/2,z||0);me.userData={id:it.id,box:box||null};g.add(me);picks.push(me);return me}
    var t=it.t;
    if(t==='boxes'){var n=it.n,L=n*KBW,z0=-KBD/2,zf=z0+4.2,parts=[],doors=[],tops=[];
      slab(MT.conc,L+.4,KBD,0,.14);
      parts.push([L+.2,2.6,.2,0,1.3,z0+.1]);
      for(var i=0;i<=n;i++)parts.push([.16,2.2,4.2,-L/2+i*KBW,1.1,z0+2.1]);
      for(var j=0;j<n;j++){var cx=-L/2+KBW/2+j*KBW;parts.push([1.05,1.3,.16,cx-1.27,.65,zf],[1.05,1.3,.16,cx+1.27,.65,zf]);doors.push([1.4,1.15,.1,cx,.6,zf]);tops.push([KBW-.1,.1,4.1,cx,.16,z0+2.1]);
        pick(KBW-.2,4.1,2.4,cx,z0+2.1,it.labels[j])}
      bld.add(mesh(kMerge(T,parts),MT.wall));bld.add(mesh(kMerge(T,doors),MT.door));flat.add(mesh(kMerge(T,tops),MT.hay,false));
      /* auvent sur l'allée, posé sur des poteaux */
      var cp=[];for(var k2=0;k2<=n;k2+=2)cp.push([.14,2.6,.14,-L/2+k2*KBW,1.3,KBD/2-.2]);bld.add(mesh(kMerge(T,cp),MT.wood));
      var roof=mesh(new T.BoxGeometry(L+.6,.14,2.4),MT.roofH);roof.position.set(0,2.75,zf+1.05);roof.rotation.x=.12;bld.add(roof);
      pick(L,1.9,1,0,zf+1);}
    else if(t==='carriere'||t==='manege'){slab(MT.sand,w,d,0,.1);var fp=fenceParts(rectPts(w-.4,d-.4),true,0,t==='manege'?5:3);
      if(t==='carriere'){bld.add(mesh(kMerge(T,fp),MT.fence));
        var lt=[];[[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(c){lt.push([.25,7,.25,c[0]*(w/2-.3),3.5,c[1]*(d/2-.3)],[1.1,.35,.5,c[0]*(w/2-.3),7,c[1]*(d/2-.3)])});bld.add(mesh(kMerge(T,lt),MT.wall2))}
      else{var ps=[],wl=[];for(var a=0;a<=Math.round(w/5);a++){var x=-w/2+a*(w/Math.round(w/5));ps.push([.3,6,.3,x,3,-d/2],[.3,6,.3,x,3,d/2])}
        wl.push([w,1.6,.18,0,.8,-d/2],[w,1.6,.18,0,.8,d/2],[.18,1.6,d,-w/2,.8,0],[.18,1.6,d,w/2,.8,0]);bld.add(mesh(kMerge(T,ps),MT.wall));bld.add(mesh(kMerge(T,wl),MT.wood));
        var rf=gable(w+1,d+1.4,6,9.2,MT.roofA);bld.add(rf)}
      pick(w,d,t==='manege'?9:1.2)}
    else if(t==='rond'||t==='marcheur'){var R=w/2,disc=mesh(new T.CircleGeometry(R,48),t==='rond'?MT.sand:MT.conc,false);disc.rotation.x=-Math.PI/2;disc.position.y=.08;flat.add(disc);
      if(t==='rond'){bld.add(mesh(kMerge(T,fenceParts(circPts(R-.2,28),true,0,2.4)),MT.fence))}
      else{var ring=mesh(new T.RingGeometry(R-2.6,R-.4,48),MT.sand,false);ring.rotation.x=-Math.PI/2;ring.position.y=.1;flat.add(ring);
        var mp=[[.5,3.4,.5,0,1.7,0]];for(var q=0;q<6;q++){var an=q/6*Math.PI*2;mp.push([R-.6,.14,.14,Math.cos(an)*(R-.6)/2,3,Math.sin(an)*(R-.6)/2,-an])}bld.add(mesh(kMerge(T,mp),MT.wall2));
        var cone=mesh(new T.ConeGeometry(R+.3,2.2,32,1,true),MT.roofT);cone.position.y=4.6;bld.add(cone);
        bld.add(mesh(kMerge(T,fenceParts(circPts(R-.2,28),true,0,2.4)),MT.fence))}
      pick(w,w,t==='marcheur'?5:1.2)}
    else if(t==='paddock'){var pts=it.pts||rectPts(w,d),sh=new T.Shape();pts.forEach(function(p,i){if(i)sh.lineTo(p[0],-p[1]);else sh.moveTo(p[0],-p[1])});
      var gg=mesh(new T.ShapeGeometry(sh),MT.grass,false);gg.rotation.x=-Math.PI/2;gg.position.y=.05;flat.add(gg);
      bld.add(mesh(kMerge(T,fenceParts(pts,true,0,3.2)),MT.wood));
      var f=kFp(it),seed=0;for(var c=0;c<it.id.length;c++)seed+=it.id.charCodeAt(c);var tr=[],tc=[];
      for(var u=0;u<Math.min(3,Math.floor(kArea(pts)/220));u++){var p0=pts[(seed+u*2)%pts.length],tx=p0[0]*.75,tz=p0[1]*.75;tr.push([.35,2.2,.35,tx,1.1,tz]);tc.push([2.8,2.6,2.8,tx,3.4,tz])}
      if(tr.length){bld.add(mesh(kMerge(T,tr),MT.trunk));bld.add(mesh(kMerge(T,tc),MT.tree))}
      var hit=mesh(new T.ShapeGeometry(sh),MT.hit,false);hit.rotation.x=-Math.PI/2;hit.position.y=.3;hit.userData={id:it.id};g.add(hit);picks.push(hit);pick(f[0]*.25,f[1]*.25,1.2,0,0)}
    else if(t==='parking'){slab(MT.asph,w,d,0,.08);var st=[],nc=Math.floor(w/2.6);for(var s=0;s<=nc;s++){st.push([.12,.02,5,-w/2+1+s*2.5,.1,-d/2+3],[.12,.02,5,-w/2+1+s*2.5,.1,d/2-3])}flat.add(mesh(kMerge(T,st),MT.paint,false));
      var cars=[],cars2=[];for(var v=0;v<Math.min(4,nc);v+=1){var arr=v%2?cars2:cars;var cxp=-w/2+2.25+v*2.5*1.7;if(cxp>w/2-2)break;arr.push([1.8,.9,4.2,cxp,.55,-d/2+3],[1.6,.6,2.2,cxp,1.25,-d/2+3.2])}
      if(cars.length)bld.add(mesh(kMerge(T,cars),MT.car));if(cars2.length)bld.add(mesh(kMerge(T,cars2),MT.car2));pick(w,d,1.2)}
    else if(t==='fumiere'){slab(MT.conc,w,d,0,.12);bld.add(mesh(kMerge(T,[[w,1.8,.3,0,.9,-d/2+.15],[.3,1.8,d,-w/2+.15,.9,0],[.3,1.8,d,w/2-.15,.9,0]]),MT.wall2));
      var pile=mesh(new T.SphereGeometry(1,16,10),MT.dung);pile.scale.set(w*.36,1.5,d*.36);pile.position.set(0,.2,-.4);bld.add(pile);pick(w,d,2)}
    else if(t==='foin'){slab(MT.conc,w,d,0,.12);var po=[];[[-1,-1],[1,-1],[-1,1],[1,1],[0,-1],[0,1]].forEach(function(c){po.push([.3,5,.3,c[0]*(w/2-.2),2.5,c[1]*(d/2-.2)])});bld.add(mesh(kMerge(T,po),MT.wood));
      bld.add(gable(w+.6,d+1,5,6.8,MT.roofM));var bl=[];for(var bx2=0;bx2<4;bx2++)for(var by=0;by<3;by++)bl.push([2.2,1.1,1.3,-w/2+2+bx2*2.4,.6+by*1.15,-d/2+1.6],[2.2,1.1,1.3,-w/2+2+bx2*2.4,.6+by*1.15,-d/2+3]);bld.add(mesh(kMerge(T,bl),MT.hay));pick(w,d,6.8)}
    else{/* bâtiment : sellerie, club-house */var hh=t==='club'?3.4:2.8;slab(MT.conc,w+1.6,d+1.6,0,.1);
      bld.add(mesh(kMerge(T,[[w,hh,d,0,hh/2,0]]),MT.wall));
      var wins=[];for(var wi=0;wi<Math.floor(w/3);wi++)wins.push([1.4,1.1,.08,-w/2+1.8+wi*3,hh*.58,d/2+.02]);if(t==='club')bld.add(mesh(kMerge(T,wins),MT.door,false));
      bld.add(mesh(kMerge(T,[[1.2,2.1,.08,w/2-1.6,1.05,d/2+.03]]),MT.wood,false));
      bld.add(gable(w+.8,d+1.2,hh,hh+(t==='club'?2.4:1.8),t==='club'?MT.roofC:MT.roofM));pick(w,d,hh+2)}
    g.userData.bld=bld;g.userData.picks=picks;bld.scale.y=hy;return g}
  function disposeObj(g){g.traverse(function(x){if(x.geometry)x.geometry.dispose()})}
  function place(it){var ob=objs[it.id];if(!ob)return;ob.position.set(it.x,0,it.z);ob.rotation.y=-(it.r||0)*Math.PI/180}
  function setItem(it,rebuild){var ob=objs[it.id];if(ob&&rebuild){root.remove(ob);disposeObj(ob);ob=null;delete objs[it.id]}
    if(!ob){ob=build(it);objs[it.id]=ob;root.add(ob)}place(it);dirtyShadow()}
  function removeItem(id){var ob=objs[id];if(!ob)return;root.remove(ob);disposeObj(ob);delete objs[id];dirtyShadow()}
  /* --- chevaux dans les boxes --- */
  function syncHorses(items){if(!horseMesh)return;var n=0;
    items.forEach(function(it){if(it.t!=='boxes')return;var a=-(it.r||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
      (it.labels||[]).forEach(function(l,j){var h=kHorseIn(l);if(!h||n>=240)return;var lx=-it.n*KBW/2+KBW/2+j*KBW,lz=-KBD/2+2.1;
        dm.position.set(it.x+lx*c+lz*s,.18,it.z-lx*s+lz*c);dm.rotation.set(0,a+(j%2?.5:-.4)+Math.PI/2,0);dm.scale.set(HS*.9,HS*.9,HS*.9);dm.updateMatrix();horseMesh.setMatrixAt(n++,dm.matrix)})});
    horseMesh.count=n;horseMesh.instanceMatrix.needsUpdate=true;dirtyShadow()}
  /* --- sélection --- */
  function selectBox(it){if(selLine){sc.remove(selLine);selLine.geometry.dispose();selLine=null}if(selFill){sc.remove(selFill);selFill.geometry.dispose();selFill=null}
    if(!it){kick();return}var f=kFp(it),pts=it.t==='paddock'&&it.pts?it.pts:KT[it.t].round?circPts(f[0]/2+.8,40):rectPts(f[0]+1.6,f[1]+1.6),arr=[];
    pts.forEach(function(p){arr.push(p[0],.25,p[1])});arr.push(pts[0][0],.25,pts[0][1]);var gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(arr,3));selLine=new T.Line(gg,MT.sel);
    var sh=new T.Shape();pts.forEach(function(p,i){if(i)sh.lineTo(p[0],-p[1]);else sh.moveTo(p[0],-p[1])});selFill=new T.Mesh(new T.ShapeGeometry(sh),MT.selF);selFill.rotation.x=-Math.PI/2;
    var holder=new T.Group();sc.add(selLine);sc.add(selFill);followSel(it);kick()}
  function followSel(it){if(!it)return;var a=-(it.r||0)*Math.PI/180;if(selLine){selLine.position.set(it.x,0,it.z);selLine.rotation.y=a}if(selFill){selFill.position.set(it.x,.2,it.z);selFill.rotation.z=a}}
  function hover(box){if(hovMesh){sc.remove(hovMesh);hovMesh.geometry.dispose();hovMesh=null}if(box){hovMesh=new T.Mesh(new T.BoxGeometry(KBW-.3,2.6,4.1),MT.hov);box.getWorldPosition(hovMesh.position);var q=new T.Quaternion();box.getWorldQuaternion(q);hovMesh.quaternion.copy(q);sc.add(hovMesh)}kick()}
  function setDraw(pts){if(drawLine){sc.remove(drawLine);drawLine.geometry.dispose();drawLine=null}if(!pts||pts.length<2){kick();return}var arr=[];pts.forEach(function(p){arr.push(p[0],.4,p[1])});var gg=new T.BufferGeometry();gg.setAttribute('position',new T.Float32BufferAttribute(arr,3));drawLine=new T.Line(gg,MT.draw);sc.add(drawLine);kick()}
  /* --- caméra : orbite autour d'une cible ; « dessus » = vue verticale --- */
  var cur={th:-.62,ph:.86,r:260,tx:0,tz:0},goal=Object.assign({},cur),anim=null;
  if(o.view==='top'){cur.th=goal.th=0;cur.ph=goal.ph=.001}
  function camApply(){var sp=Math.sin(cur.ph);cam.position.set(cur.tx+cur.r*sp*Math.sin(cur.th),cur.r*Math.cos(cur.ph),cur.tz+cur.r*sp*Math.cos(cur.th));cam.up.set(0,1,0);if(cur.ph<.01){cam.up.set(-Math.sin(cur.th),0,-Math.cos(cur.th))}cam.lookAt(cur.tx,0,cur.tz)}
  function frameAll(items,view){var bx=[1e9,1e9,-1e9,-1e9];items.forEach(function(it){var f=kFp(it),m=Math.max(f[0],f[1])/2;bx[0]=Math.min(bx[0],it.x-m);bx[1]=Math.min(bx[1],it.z-m);bx[2]=Math.max(bx[2],it.x+m);bx[3]=Math.max(bx[3],it.z+m)});
    if(!items.length)bx=[-40,-30,40,30];var sx=bx[2]-bx[0]+16,sz=bx[3]-bx[1]+16,asp=W/H,f=cam.fov*Math.PI/180,need=Math.max(sz,sx/asp)/2/Math.tan(f/2);
    return {tx:(bx[0]+bx[2])/2,tz:(bx[1]+bx[3])/2,r:Math.max(40,Math.min(900,need*(view==='top'?1.02:.98))),th:view==='top'?0:-.62,ph:view==='top'?.001:.86}}
  function ease(t){return t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2}
  function go(g2,ms,tv){var from=Object.assign({},cur),h0=hy,h1=tv==null?hy:tv;if(RM||!ms){Object.assign(cur,g2);Object.assign(goal,cur);hy=h1;applyHy();kick();return}
    anim={t0:performance.now(),ms:ms,from:from,to:Object.assign({},from,g2),h0:h0,h1:h1};Object.assign(goal,anim.to);kick()}
  function applyHy(){Object.keys(objs).forEach(function(k){var b=objs[k].userData.bld;if(b){b.scale.y=Math.max(.04,hy);b.visible=hy>.05}});if(horseMesh)horseMesh.visible=hy>.5;grid.material.opacity=.15+.45*(1-hy);dirtyShadow()}
  /* --- rendu à la demande --- */
  var raf=0,shDirty=true,lastInteract=0,hiRes=!mob;
  function dirtyShadow(){shDirty=true;kick()}
  function kick(){if(!raf&&alive)raf=requestAnimationFrame(frame)}
  function frame(now){raf=0;if(!alive)return;if(!host.isConnected){api.dispose();return}
    if(anim){var k=Math.min(1,(now-anim.t0)/anim.ms),e=ease(k);['th','ph','r','tx','tz'].forEach(function(q){cur[q]=anim.from[q]+(anim.to[q]-anim.from[q])*e});hy=anim.h0+(anim.h1-anim.h0)*e;applyHy();if(k>=1)anim=null}
    camApply();if(shDirty){ren.shadowMap.needsUpdate=true;shDirty=false}ren.render(sc,cam);labels();
    if(anim)kick();else if(o.onIdle)o.onIdle()}
  /* rendu progressif au téléphone : d'abord en basse définition, puis en définition pleine au repos */
  var hiT=setInterval(function(){if(!alive){clearInterval(hiT);return}if(!host.isConnected){api.dispose();return}if(!hiRes&&performance.now()-lastInteract>700&&!anim){hiRes=true;ren.setPixelRatio(dpr);ren.setSize(W,H,false);kick()}},400);
  function interacting(){lastInteract=performance.now();if(mob&&hiRes&&dpr>1){hiRes=false;ren.setPixelRatio(1);ren.setSize(W,H,false)}}
  /* --- étiquettes HTML --- */
  var L={};
  function labels(){var items=o.items(),seen={},v=new T.Vector3(),zoomed=H/(cur.r*Math.tan(cam.fov*Math.PI/360)*2);
    items.forEach(function(it){var e=L[it.id];if(!e){e=L[it.id]={el:document.createElement('span'),sub:[]};e.el.className='kc-lab';ov.appendChild(e.el)}seen[it.id]=1;
      var txt=it.name||KT[it.t].l;if(e.txt!==txt){e.txt=txt;e.el.textContent=txt}
      var hgt=(it.t==='manege'?9.5:it.t==='foin'?7:it.t==='club'?6.2:it.t==='boxes'?3.4:2)*Math.max(.04,hy)+.5,f=kFp(it);
      v.set(it.x,hgt,it.z+(it.t==='boxes'?0:0));v.project(cam);var on=v.z<1&&Math.abs(v.x)<1.1&&Math.abs(v.y)<1.1;
      e.el.style.transform='translate('+((v.x+1)/2*W).toFixed(1)+'px,'+((1-v.y)/2*H).toFixed(1)+'px) translate(-50%,-100%)';e.el.classList.toggle('off',!on);e.el.classList.toggle('sel',KS.sel===it.id);
      /* boxes : numéro et cheval, quand on est assez près */
      if(it.t==='boxes'){var show=zoomed>7.5&&on,a=-(it.r||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
        (it.labels||[]).forEach(function(l,j){var b=e.sub[j];if(!b){b=e.sub[j]=document.createElement('span');b.className='kc-bl';ov.appendChild(b)}
          var h=kHorseIn(l),t2=l+(h?' · '+h.name.split(' ')[0]:'');if(b.txt!==t2){b.txt=t2;b.innerHTML='<b>'+E(l)+'</b>'+(h?'<span>'+E(h.name.split(' ')[0])+'</span>':'');b.classList.toggle('free',!h)}
          var lx=-it.n*KBW/2+KBW/2+j*KBW,lz=-KBD/2+2.1;v.set(it.x+lx*c+lz*s,2.9*Math.max(.04,hy),it.z-lx*s+lz*c);v.project(cam);
          b.style.transform='translate('+((v.x+1)/2*W).toFixed(1)+'px,'+((1-v.y)/2*H).toFixed(1)+'px) translate(-50%,-50%)';b.classList.toggle('off',!show||v.z>=1)});
        for(var j2=(it.labels||[]).length;j2<e.sub.length;j2++){e.sub[j2].remove()}e.sub.length=(it.labels||[]).length}});
    Object.keys(L).forEach(function(k){if(!seen[k]){L[k].el.remove();L[k].sub.forEach(function(b){b.remove()});delete L[k]}});
    declutter();if(o.onFrame)o.onFrame()}
  var decT=0;function declutter(){var shown=[],list=Object.keys(L).map(function(k){return {k:k,e:L[k].el}}).filter(function(x){return !x.e.classList.contains('off')});
    list.sort(function(a,b){return (b.k===KS.sel)-(a.k===KS.sel)});list.forEach(function(x){x.e.classList.remove('hid');var r=x.e.getBoundingClientRect();var hit=shown.some(function(q){return r.left<q.right+2&&r.right>q.left-2&&r.top<q.bottom+2&&r.bottom>q.top-2});if(hit)x.e.classList.add('hid');else shown.push(r)})}
  /* --- conversions écran ↔ sol --- */
  function setNdc(cx,cy){var r=cv.getBoundingClientRect();ndc.set((cx-r.left)/r.width*2-1,-((cy-r.top)/r.height)*2+1)}
  function groundAt(cx,cy){setNdc(cx,cy);ray.setFromCamera(ndc,cam);return ray.ray.intersectPlane(plane,tmp)?tmp.clone():null}
  function pickAt(cx,cy,boxOnly){setNdc(cx,cy);ray.setFromCamera(ndc,cam);var list=[];Object.keys(objs).forEach(function(k){(objs[k].userData.picks||[]).forEach(function(m){if(!boxOnly||m.userData.box)list.push(m)})});
    var h=ray.intersectObjects(list,false);if(!h.length)return null;
    /* en vue de dessus les volumes sont aplatis : on préfère le plus petit élément sous le doigt */
    var best=h[0].object;if(boxOnly){var bb=h.filter(function(x){return x.object.userData.box})[0];return bb?bb.object:null}
    var bx=h.filter(function(x){return x.object.userData.box})[0];return bx?bx.object:best}
  function project(x,y,z){var v=new T.Vector3(x,y*Math.max(.04,hy),z).project(cam);return {x:(v.x+1)/2*W,y:(1-v.y)/2*H,on:v.z<1}}
  function resize(){var w=host.clientWidth,h=host.clientHeight;if(!w||!h||(w===W&&h===H))return;W=w;H=h;cam.aspect=W/H;cam.updateProjectionMatrix();ren.setSize(W,H,false);kick()}
  var ro=new ResizeObserver(resize);ro.observe(host);
  function retheme(){chk();mats.forEach(function(m){m.color.copy(m.userData.fn())});lights();dirtyShadow()}
  var mo=new MutationObserver(function(){setTimeout(retheme,30)});mo.observe(document.documentElement,{attributes:true,attributeFilter:['class','data-theme','style']});
  var mq=window.matchMedia&&matchMedia('(prefers-color-scheme: dark)'),mqf=function(){setTimeout(retheme,30)};if(mq&&mq.addEventListener)mq.addEventListener('change',mqf);
  var api={canvas:cv,ov:ov,cam:cur,goal:goal,
    setItem:setItem,removeItem:removeItem,place:function(it){place(it);followSel(it);dirtyShadow()},syncHorses:syncHorses,select:selectBox,follow:followSel,hover:hover,setDraw:setDraw,
    groundAt:groundAt,pickAt:pickAt,project:project,frameAll:frameAll,go:go,kick:kick,interacting:interacting,
    view:function(v,ms){var items=o.items(),f=frameAll(items,v);if(v==='top'){f.tx=goal.tx;f.tz=goal.tz;f.r=goal.r}else{f.tx=goal.tx;f.tz=goal.tz;f.r=goal.r}go({th:v==='top'?0:-.62,ph:v==='top'?.001:.86},ms==null?900:ms,v==='top'?.04:1)},
    orbit:function(dth,dph){interacting();if(cur.ph<.02&&KS.view==='top'){return}cur.th+=dth;cur.ph=Math.max(.32,Math.min(1.22,cur.ph+dph));Object.assign(goal,cur);kick()},
    pan:function(dx,dy){interacting();var s=2*cur.r*Math.tan(cam.fov*Math.PI/360)/H,c=Math.cos(cur.th),sn=Math.sin(cur.th),f=1/Math.max(.45,Math.cos(cur.ph));
      cur.tx-=(dx*c+dy*sn*f)*s;cur.tz-=(-dx*sn+dy*c*f)*s;cur.tx=Math.max(-260,Math.min(260,cur.tx));cur.tz=Math.max(-260,Math.min(260,cur.tz));Object.assign(goal,cur);kick()},
    zoom:function(k){interacting();cur.r=Math.max(25,Math.min(950,cur.r*k));Object.assign(goal,cur);kick()},
    size:function(){return {w:W,h:H}},isTop:function(){return hy<.5},
    dispose:function(){if(!alive)return;alive=false;cancelAnimationFrame(raf);clearInterval(hiT);ro.disconnect();mo.disconnect();if(mq&&mq.removeEventListener)mq.removeEventListener('change',mqf);
      Object.keys(objs).forEach(function(k){disposeObj(objs[k])});objs={};
      sc.traverse(function(x){if(x.geometry)x.geometry.dispose()});mats.forEach(function(m){m.dispose()});
      ren.dispose();try{ren.forceContextLoss()}catch(e){}cv.remove();ov.remove()}};
  return api}

/* ---------- L'écran ---------- */
P.mod({id:'centre3d',role:'gerant',group:'Écurie',title:'Mon centre en 3D',icon:'map',n:21,phoneTitle:'Mon centre',short:'Mon centre',
 render:function(el,ctx){
  var mobile=ctx.mobile,api=null,items=kLoad(),dirtySave=0;KS.sel=null;KS.armed=null;KS.undo=[];KS.redo=[];
  if(!items.length&&!kLive()&&DEMO_PLAN())items=kGen(KTPL[2].o);
  function snapshot(){var hb={};D.horses.forEach(function(h){hb[h.id]=h.box||''});return JSON.stringify({i:items,h:hb})}
  function restore(s){var o=JSON.parse(s);items=o.i;Object.keys(o.h).forEach(function(id){var h=D.horse(id);if(h)h.box=o.h[id]})}
  function push(){KS.undo.push(snapshot());if(KS.undo.length>60)KS.undo.shift();KS.redo=[]}
  function commit(msg,rebuildIds){save();if(api){(rebuildIds||[]).forEach(function(id){var it=byId(id);if(it)api.setItem(it,true)});api.syncHorses(items)}drawSide();drawTop();if(msg)P.toast(msg.t||msg,{icon:msg.i||'checkc'})}
  function save(){kSave(items);var st=el.querySelector('[data-kst]');if(st){st.classList.add('on');clearTimeout(dirtySave);dirtySave=setTimeout(function(){if(st.isConnected)st.classList.remove('on')},1600)}}
  function noSide(){var a=el.querySelector('.kc-side');return !a||!a.offsetWidth}
  function byId(id){return items.find(function(x){return x.id===id})}
  function full(){if(!api)return;Object.keys(items).length;items.forEach(function(it){api.setItem(it,true)});api.syncHorses(items);api.select(byId(KS.sel))}
  function undo(){if(!KS.undo.length)return;KS.redo.push(snapshot());var s=KS.undo.pop();var old=items.map(function(x){return x.id});restore(s);old.forEach(function(id){if(!byId(id)&&api)api.removeItem(id)});if(KS.sel&&!byId(KS.sel))KS.sel=null;full();save();drawSide();drawTop();P.toast('Action annulée',{icon:'back'})}
  function redo(){if(!KS.redo.length)return;KS.undo.push(snapshot());var s=KS.redo.pop();var old=items.map(function(x){return x.id});restore(s);old.forEach(function(id){if(!byId(id)&&api)api.removeItem(id)});if(KS.sel&&!byId(KS.sel))KS.sel=null;full();save();drawSide();drawTop();P.toast('Action rétablie',{icon:'refresh'})}

  var palette='<div class="kc-pal">'+KORDER.map(function(t){return '<button class="kc-pi" data-kadd="'+t+'" title="'+(t==='paddock'?'Glissez sur le plan, ou dessinez le contour':'Glissez sur le plan ou touchez pour ajouter')+'"><span class="kc-pic">'+ICON(KT[t].icon,'sm')+'</span><span>'+KT[t].s+'</span></button>'}).join('')+'</div>';
  el.innerHTML=(mobile?'':U.ph('Mon centre en 3D','Posez vos boxes, carrières et paddocks, puis placez vos chevaux dans leurs boxes.','<button class="btn" data-ktpl>'+ICON('grid','sm')+'Modèles</button><button class="btn pri" data-kwiz>'+ICON('spark','sm')+'Créer en 3 questions</button>'))+
    '<div class="kc-wrap"><div class="card kc-stage"><div class="kc-gl"></div>'+
      '<div class="kc-top"><div class="e3-glass kc-g">'+U.seg([['top',ICON('grid','sm')+'<span>Dessus</span>'],['3d',ICON('cube','sm')+'<span>3D</span>']],KS.view,'data-kview')+'</div>'+
        '<div class="e3-glass kc-g"><button class="btn icon sm" data-kundo title="Annuler">'+KIC.undo()+'</button><button class="btn icon sm" data-kredo title="Rétablir">'+KIC.redo()+'</button><span class="kc-sep"></span><button class="btn icon sm" data-kzoom="1.25" title="Dézoomer">'+ICON('minus','sm')+'</button><button class="btn icon sm" data-kzoom=".8" title="Zoomer">'+ICON('plus','sm')+'</button><button class="btn icon sm" data-kfit title="Tout voir">'+ICON('expand','sm')+'</button></div>'+
        '<span class="kc-st" data-kst>'+ICON('checkc','sm')+'Enregistré</span></div>'+
      '<div class="kc-sel"></div><div class="kc-ban"></div><div class="kc-rot" title="Faites glisser pour tourner">'+ICON('rotate','sm')+'</div>'+
      '<div class="kc-welcome"></div>'+
      ('<div class="kc-mb"><button class="btn lg" data-kadds>'+ICON('plus')+'Ajouter</button><button class="btn lg" data-khs>'+ICON('horse')+'Chevaux</button><button class="btn lg icon" data-kwiz title="Créer en 3 questions">'+ICON('spark')+'</button></div>')+
    '</div>'+
    (mobile?'':'<aside class="card kc-side"><div class="kc-tabs">'+U.tabs([['add','Ajouter'],['horses','Chevaux']],KS.side==='edit'?'add':KS.side,'data-kside')+'</div><div class="kc-sb"></div></aside>')+'</div>';
  var $=function(s){return el.querySelector(s)},stage=$('.kc-stage'),gl=$('.kc-gl'),selEl=$('.kc-sel'),banEl=$('.kc-ban'),rotEl=$('.kc-rot'),welEl=$('.kc-welcome'),side=$('.kc-sb'),view=el.closest('.view');
  /* hauteur : tout l'écran disponible, calculée sur la fenêtre (pas sur la vue, qui grandit avec son contenu) */
  var lastH=0;
  function size(){if(!view||!el.isConnected){window.removeEventListener('resize',size);return}
    var app=el.closest('.app')||document.body,ar=app.getBoundingClientRect(),bottom=Math.min(window.innerHeight,ar.bottom),tb=app.querySelector('.tabbar'),h,top=$('.kc-wrap').getBoundingClientRect().top+view.scrollTop;
    if(tb&&tb.offsetHeight)bottom=Math.min(bottom,tb.getBoundingClientRect().top-10);
    if(mobile){stage.style.margin='-6px -16px 0';h=Math.max(420,Math.round(bottom-top+6))}
    else{h=Math.max(460,Math.round(bottom-top-24));el.style.marginBottom='-36px'}
    if(Math.abs(h-lastH)<3)return;lastH=h;stage.style.height=h+'px';var sd=$('.kc-side');if(sd)sd.style.height=h+'px'}
  size();window.addEventListener('resize',size);
  stage.addEventListener('scroll',function(){if(stage.scrollLeft||stage.scrollTop){stage.scrollLeft=0;stage.scrollTop=0}});

  /* ---------- panneau latéral : palette, chevaux, réglages de l'élément ---------- */
  function horsesHtml(){var free=D.horses.filter(function(h){return !h.box||!boxLabelExists(h.box)}),placed=D.horses.filter(function(h){return h.box&&boxLabelExists(h.box)});
    if(!D.horses.length)return '<div class="kc-empty">'+ICON('horse')+'<b>Aucun cheval pour l’instant</b><span class="s mut">Ajoutez vos chevaux dans l’écran Chevaux, puis placez-les ici dans leur box.</span><button class="btn" data-go="chevaux">Ouvrir les chevaux</button></div>';
    function row(h){return '<button class="kc-h" data-khorse="'+h.id+'" title="Glissez '+E(h.name)+' dans un box">'+U.hav(h)+'<span class="grow ellip"><b class="ellip">'+E(h.name)+'</b><small class="ellip">'+(h.box&&boxLabelExists(h.box)?'Box '+E(h.box):'Sans box')+'</small></span>'+ICON('right','sm')+'</button>'}
    return '<p class="s mut kc-tip">Glissez un cheval dans un box, ou touchez un cheval puis un box.</p>'+(free.length?'<div class="kc-sec">Sans box <span class="chip">'+free.length+'</span></div>'+free.map(row).join(''):'')+(placed.length?'<div class="kc-sec">Dans un box <span class="chip">'+placed.length+'</span></div>'+placed.map(row).join(''):'')}
  function boxLabelExists(l){return items.some(function(it){return it.t==='boxes'&&(it.labels||[]).indexOf(l)>=0})}
  function editHtml(it){var k=KT[it.t],h='<div class="kc-eh"><span class="kc-pic lg">'+ICON(k.icon)+'</span><div class="grow"><div class="xs mut">'+k.l+'</div><input class="in kc-name" data-kname value="'+E(it.name||'')+'" maxlength="40" aria-label="Nom de l’élément"></div></div>';
    if(it.t==='boxes'){var occ=(it.labels||[]).filter(kHorseIn).length;h+='<div class="kc-row"><span>Nombre de boxes</span><span class="kc-step"><button data-kn="-1" title="Un box de moins">'+ICON('minus','sm')+'</button><output class="num">'+it.n+'</output><button data-kn="1" title="Un box de plus">'+ICON('plus','sm')+'</button></span></div>'+
      '<div class="kc-row"><span>Occupés</span><b class="num">'+occ+' sur '+it.n+'</b></div><div class="kc-bxs">'+(it.labels||[]).map(function(l){var hh=kHorseIn(l);return '<button class="kc-bx'+(hh?' on':'')+'" data-kbox="'+E(l)+'" title="'+(hh?E(hh.name):'Box libre : placer un cheval')+'"><b>'+E(l)+'</b><span class="ellip">'+(hh?E(hh.name.split(' ')[0]):'Libre')+'</span></button>'}).join('')+'</div>'}
    if(k.sizes)h+='<div class="kc-row col"><span>Dimensions</span>'+U.seg(k.sizes.map(function(s){return [s.join('x'),k.round?s[0]+' m':s[0]+' × '+s[1]+' m']}),it.w+'x'+it.d,'data-ksz')+'</div>';
    if(it.t==='paddock'){var a=Math.round(kArea(it.pts||[]));h+='<div class="kc-row"><span>Surface</span><b class="num">'+(a>=10000?(a/10000).toFixed(2).replace('.',',')+' ha':F.num(a)+' m²')+'</b></div><button class="btn block" data-kredraw>'+ICON('edit','sm')+'Redessiner le contour</button>'}
    h+='<div class="kc-row"><span>Orientation</span><b class="num">'+(((Math.round(it.r||0)%360)+360)%360)+'°</b></div>'+
      '<div class="kc-acts"><button class="btn" data-kact="rot" title="Tourner d’un quart de tour">'+ICON('rotate','sm')+'Tourner</button><button class="btn" data-kact="dup">'+ICON('copy','sm')+'Dupliquer</button><button class="btn danger" data-kact="del">'+ICON('trash','sm')+'Supprimer</button></div>';
    return h}
  function drawSide(){var host=side;if(!host)return;var it=byId(KS.sel);
    if(it){host.innerHTML='<button class="kc-back" data-kdesel>'+ICON('back','sm')+'Retour</button>'+editHtml(it);wireEdit(host,it);return}
    host.innerHTML=KS.side==='horses'?horsesHtml():'<p class="s mut kc-tip">Glissez un élément sur le plan, ou touchez-le pour l’ajouter au centre de la vue.</p>'+palette+'<div class="kc-draw"><button class="btn block" data-kdraw>'+ICON('edit','sm')+'Dessiner un paddock au doigt</button></div><div class="kc-foot"><button class="btn ghost block" data-kclear>'+ICON('trash','sm')+'Tout effacer</button></div>';
    wireSide(host)}
  function wireSide(host){P.$$('[data-kadd]',host).forEach(function(b){dragSource(b,'add',b.getAttribute('data-kadd'))});
    P.$$('[data-khorse]',host).forEach(function(b){dragSource(b,'horse',b.getAttribute('data-khorse'))});
    var dr=host.querySelector('[data-kdraw]');if(dr)dr.onclick=function(){P.closeSheets();startDraw(null)};
    var cl=host.querySelector('[data-kclear]');if(cl)cl.onclick=function(){if(!items.length)return;if(!cl.classList.contains('cf')){cl.classList.add('cf');cl.innerHTML=ICON('trash','sm')+'Confirmer : tout effacer';setTimeout(function(){if(cl.isConnected){cl.classList.remove('cf');cl.innerHTML=ICON('trash','sm')+'Tout effacer'}},4000);return}
      push();items.forEach(function(it){api&&api.removeItem(it.id)});items=[];KS.sel=null;if(api)api.select(null);commit({t:'Plan effacé',i:'trash'});welcome()}}
  function wireEdit(host,it){var nm=host.querySelector('[data-kname]');if(nm){nm.onfocus=function(){nm._s=snapshot()};nm.oninput=function(){it.name=nm.value;api&&api.kick();drawTop()};nm.onchange=function(){if(nm._s){KS.undo.push(nm._s);KS.redo=[]}it.name=nm.value.trim()||KT[it.t].l;save()}}
    P.$$('[data-kn]',host).forEach(function(b){b.onclick=function(){var n=Math.max(1,Math.min(30,it.n+(+b.getAttribute('data-kn'))));if(n===it.n)return;push();
      var gone=it.n>n?(it.labels||[]).slice(n):[];gone.forEach(function(l){var h=kHorseIn(l);if(h)h.box=''});it.n=n;kFit(it,items);commit(null,[it.id]);if(api)api.select(it)}});
    P.$$('[data-ksz]',host).forEach(function(b){b.onclick=function(){var s=b.getAttribute('data-ksz').split('x');push();it.w=+s[0];it.d=+s[1];commit(null,[it.id]);if(api)api.select(it)}});
    P.$$('[data-kbox]',host).forEach(function(b){b.onclick=function(){boxSheet(b.getAttribute('data-kbox'))}});
    var rd=host.querySelector('[data-kredraw]');if(rd)rd.onclick=function(){P.closeSheets();startDraw(it)};
    P.$$('[data-kact]',host).forEach(function(b){b.onclick=function(){act(b.getAttribute('data-kact'),b)}});
    var bk=host.querySelector('[data-kdesel]');if(bk)bk.onclick=function(){select(null)}}
  function act(k,b){var it=byId(KS.sel);if(!it)return;
    if(k==='rot'){push();it.r=((it.r||0)+90)%360;api.place(it);commit()}
    else if(k==='dup'){push();var c=kClone(it);c.id=kId();c.x+=8;c.z+=8;c.name=kName(c.t,items);if(c.t==='boxes'){c.labels=[];kFit(c,items.concat([c]))}var sp=freeSpot(c,c.x,c.z);c.x=sp[0];c.z=sp[1];items.push(c);api.setItem(c,true);select(c.id);commit({t:(c.name||KT[c.t].l)+' ajouté',i:'copy'})}
    else if(k==='del'){if(b&&!b.classList.contains('cf')){b.classList.add('cf');b.innerHTML=ICON('trash','sm')+'Confirmer';setTimeout(function(){if(b.isConnected){b.classList.remove('cf');b.innerHTML=ICON('trash','sm')+'Supprimer'}},4000);return}
      push();var nh=0;(it.labels||[]).forEach(function(l){var h=kHorseIn(l);if(h){h.box='';nh++}});items=items.filter(function(x){return x!==it});api.removeItem(it.id);select(null);
      commit();P.toast((it.name||KT[it.t].l)+' supprimé'+(nh?', '+nh+' cheva'+(nh>1?'ux':'l')+' sans box':''),{icon:'trash',undo:undo})}}
  /* barre d'actions flottante au-dessus de l'élément choisi */
  function drawTop(){var it=byId(KS.sel);if(!it){selEl.classList.remove('on');rotEl.classList.remove('on');return}
    selEl.innerHTML='<b class="ellip">'+E(it.name||KT[it.t].l)+'</b>'+(it.t==='boxes'?'<span class="kc-step sm"><button data-kn="-1" title="Un box de moins">'+ICON('minus','sm')+'</button><output class="num">'+it.n+'</output><button data-kn="1" title="Un box de plus">'+ICON('plus','sm')+'</button></span>':'')+
      (noSide()?'<button class="btn icon sm" data-kset title="Réglages">'+ICON('sliders','sm')+'</button>':'')+'<button class="btn icon sm" data-kfocus title="Voir de près">'+ICON('search','sm')+'</button><button class="btn icon sm" data-kact="rot" title="Tourner d’un quart de tour">'+ICON('rotate','sm')+'</button><button class="btn icon sm" data-kact="dup" title="Dupliquer">'+ICON('copy','sm')+'</button><button class="btn icon sm" data-kren title="Renommer">'+ICON('edit','sm')+'</button><button class="btn icon sm danger" data-kact="del" title="Supprimer">'+ICON('trash','sm')+'</button>';
    P.$$('[data-kact]',selEl).forEach(function(b){b.onclick=function(){act(b.getAttribute('data-kact'),b)}});
    P.$$('[data-kn]',selEl).forEach(function(b){b.onclick=function(){var n=Math.max(1,Math.min(30,it.n+(+b.getAttribute('data-kn'))));if(n===it.n)return;push();var gone=it.n>n?(it.labels||[]).slice(n):[];gone.forEach(function(l){var h=kHorseIn(l);if(h)h.box=''});it.n=n;kFit(it,items);commit(null,[it.id]);api.select(it)}});
    selEl.querySelector('[data-kren]').onclick=function(){renameSheet(it)};
    selEl.querySelector('[data-kfocus]').onclick=function(){focusOn(it)};
    var ks=selEl.querySelector('[data-kset]');if(ks)ks.onclick=function(){P.sheet({title:it.name||KT[it.t].l,icon:KT[it.t].icon,body:function(b){function d(){b.innerHTML=editHtml(it);wireEdit(b,it);P.$$('[data-kn],[data-ksz]',b).forEach(function(x){x.addEventListener('click',function(){setTimeout(function(){if(b.isConnected)d()},0)})})}d()}})};
    selEl.classList.add('on');rotEl.classList.add('on');posTop()}
  function posTop(){var it=byId(KS.sel);if(!it||!api)return;var f=kFp(it),s=api.size(),p=api.project(it.x,(it.t==='manege'?9.5:4),it.z),w=selEl.offsetWidth,hh=selEl.offsetHeight;
    var x=Math.max(8,Math.min(s.w-w-8,p.x-w/2)),y=Math.max(mobile?64:62,p.y-hh-34);if(noSide()){x=Math.max(8,(s.w-w)/2);y=s.h-hh-92}selEl.style.transform='translate('+x+'px,'+y+'px)';
    var a=-(it.r||0)*Math.PI/180,rr=Math.max(f[0],f[1])/2+(KT[it.t].round?1.5:2.5),ex=it.t==='boxes'||!KT[it.t].round?f[0]/2+2.5:rr,q=api.project(it.x+Math.cos(a)*ex,0,it.z-Math.sin(a)*ex);
    rotEl.style.transform='translate('+(q.x-20)+'px,'+(q.y-20)+'px)';rotEl.classList.toggle('off',!q.on)}
  function boxAt(cx,cy){if(!api)return null;var r=api.canvas.getBoundingClientRect(),x=cx-r.left,y=cy-r.top,best=null,bd=28;
    items.forEach(function(it){if(it.t!=='boxes')return;var a=-(it.r||0)*Math.PI/180,c=Math.cos(a),s=Math.sin(a);
      (it.labels||[]).forEach(function(l,j){var lx=-it.n*KBW/2+KBW/2+j*KBW,lz=-KBD/2+2.1,wx=it.x+lx*c+lz*s,wz=it.z-lx*s+lz*c;[2.9,1.2].forEach(function(hh){var q=api.project(wx,hh,wz),d=Math.hypot(q.x-x,q.y-y);if(q.on&&d<bd){bd=d;best=l}})})});
    if(best)return best;var h=api.pickAt(cx,cy,true);return h&&h.userData.box||null}
  function focusOn(it){if(!api||!it)return;var f=kFp(it),sz=Math.max(f[0],f[1]);api.go({tx:it.x,tz:it.z,r:Math.max(28,sz*(KS.view==='top'?1.5:1.25))},700)}
  function select(id){KS.sel=id||null;if(api)api.select(byId(KS.sel));drawTop();drawSide();if(mobile&&id)banEl.classList.remove('on')}
  function renameSheet(it){var sh=P.sheet({title:'Renommer',icon:'edit',body:'<label class="field"><span>Nom de l’élément</span><input class="in" data-n value="'+E(it.name||'')+'" maxlength="40"></label>',foot:'<button class="btn pri" data-ok>Enregistrer</button>'});
    var inp=sh.querySelector('[data-n]');setTimeout(function(){try{inp.focus();inp.select()}catch(e){}},60);
    function ok(){var v=inp.value.trim();if(v&&v!==it.name){push();it.name=v;commit({t:'Renommé en « '+E(v)+' »',i:'edit'});api.kick()}sh.close()}
    sh.querySelector('[data-ok]').onclick=ok;inp.onkeydown=function(e){if(e.key==='Enter')ok()}}
  /* un cheval dans un box */
  function assign(hid,label){var h=D.horse(hid);if(!h)return;var prev=kHorseIn(label);if(prev===h)return;push();var from=h.box;
    if(prev){prev.box=from&&boxLabelExists(from)?from:''}h.box=label;commit({t:E(h.name)+' est au box '+E(label)+(prev?'. '+E(prev.name)+(prev.box?' passe au box '+E(prev.box):' n’a plus de box'):''),i:'horse'});if(api)api.kick()}
  function boxSheet(label){var cur=kHorseIn(label),list=D.horses.slice().sort(function(a,b){var fa=a.box&&boxLabelExists(a.box)?1:0,fb=b.box&&boxLabelExists(b.box)?1:0;return fa-fb||a.name.localeCompare(b.name)});
    var sh=P.sheet({title:'Box '+label,icon:'stable',body:'<div class="stack" style="--g:10px">'+(cur?'<div class="kc-cur">'+U.hav(cur)+'<div class="grow"><b>'+E(cur.name)+'</b><div class="xs mut">Dans ce box</div></div><button class="btn sm" data-out>Libérer le box</button></div>':'<p class="s mut">Choisissez le cheval qui occupe ce box.</p>')+
      (list.length?'<div class="search">'+ICON('search','sm')+'<input class="in" data-q placeholder="Nom du cheval" autocomplete="off"></div><div class="kc-hl">'+list.filter(function(h){return h!==cur}).map(function(h){return '<button class="kc-h" data-pick="'+h.id+'" data-n="'+E(h.name.toLowerCase())+'">'+U.hav(h)+'<span class="grow ellip"><b class="ellip">'+E(h.name)+'</b><small>'+(h.box&&boxLabelExists(h.box)?'Actuellement au box '+E(h.box):'Sans box')+'</small></span></button>'}).join('')+'</div>':'<div class="kc-empty"><b>Aucun cheval</b><span class="s mut">Ajoutez d’abord vos chevaux.</span></div>')+'</div>'});
    P.$$('[data-pick]',sh).forEach(function(b){b.onclick=function(){sh.close();assign(b.getAttribute('data-pick'),label)}});
    var q=sh.querySelector('[data-q]');if(q)q.oninput=function(){var v=q.value.toLowerCase().trim();P.$$('[data-pick]',sh).forEach(function(b){b.style.display=!v||b.getAttribute('data-n').indexOf(v)>=0?'':'none'})};
    var out=sh.querySelector('[data-out]');if(out)out.onclick=function(){push();cur.box='';sh.close();commit({t:'Box '+label+' libéré',i:'stable'});api.kick()}}
  /* emplacement libre près du centre de la vue */
  function overl(a,ax,az,b){var fa=kFp(a),fb=kFp(b),ra=(a.r||0)%180===90,rb=(b.r||0)%180===90,wa=ra?fa[1]:fa[0],da=ra?fa[0]:fa[1],wb=rb?fb[1]:fb[0],db=rb?fb[0]:fb[1];return Math.abs(ax-b.x)<(wa+wb)/2+2&&Math.abs(az-b.z)<(da+db)/2+2}
  function freeSpot(it,x0,z0){for(var r=0;r<40;r++){for(var k=0;k<Math.max(1,r*8);k++){var a=k/Math.max(1,r*8)*Math.PI*2,x=Math.round(x0+Math.cos(a)*r*6),z=Math.round(z0+Math.sin(a)*r*6);
    if(!items.some(function(b){return b!==it&&overl(it,x,z,b)}))return [x,z]}}return [x0,z0]}
  function addItem(t,x,z,exact){var it=kMake(t,items,{});if(x==null){x=api?api.cam.tx:0;z=api?api.cam.tz:0}
    if(!exact){var sp=freeSpot(it,x,z);x=sp[0];z=sp[1]}it.x=Math.round(x);it.z=Math.round(z);push();items.push(it);if(api)api.setItem(it,true);welEl.classList.remove('on');select(it.id);commit({t:(it.name||KT[t].l)+' ajouté'+(t==='boxes'?' : '+it.n+' boxes, '+it.labels[0]+' à '+it.labels[it.labels.length-1]:''),i:'plus'});
    if(mobile)P.closeSheets()}

  /* ---------- glisser depuis la palette ou la liste des chevaux ---------- */
  function dragSource(b,kind,val){b.addEventListener('pointerdown',function(e){if(e.button>0)return;var sx=e.clientX,sy=e.clientY,moved=false,ghost=null,hovered=null;
    function mv(ev){if(!moved&&Math.hypot(ev.clientX-sx,ev.clientY-sy)<8)return;if(!moved){moved=true;ghost=document.createElement('div');ghost.className='kc-ghost';ghost.innerHTML=kind==='add'?ICON(KT[val].icon,'sm')+'<span>'+KT[val].s+'</span>':U.hav(D.horse(val))+'<span>'+E(D.horse(val).name)+'</span>';document.body.appendChild(ghost);if(mobile)P.closeSheets()}
      ghost.style.transform='translate('+(ev.clientX+12)+'px,'+(ev.clientY+12)+'px)';
      if(kind==='horse'&&api){var r=api.canvas.getBoundingClientRect(),inside=ev.clientX>r.left&&ev.clientX<r.right&&ev.clientY>r.top&&ev.clientY<r.bottom,hb=inside?api.pickAt(ev.clientX,ev.clientY,true):null;if(hb!==hovered){hovered=hb;api.hover(hb)}}
      ev.preventDefault()}
    function up(ev){document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);document.removeEventListener('pointercancel',up);if(ghost)ghost.remove();if(api)api.hover(null);
      if(!moved){if(kind==='add'){if(val==='paddock'&&false)return;addItem(val)}else{KS.armed=val;var h=D.horse(val);banEl.innerHTML='<span>Touchez le box de '+E(h.name)+'</span><button class="btn sm" data-kcan>Annuler</button>';banEl.classList.add('on');banEl.querySelector('[data-kcan]').onclick=function(){KS.armed=null;banEl.classList.remove('on')};if(mobile)P.closeSheets()}return}
      if(!api)return;var r=api.canvas.getBoundingClientRect();if(ev.clientX<r.left||ev.clientX>r.right||ev.clientY<r.top||ev.clientY>r.bottom)return;
      if(kind==='add'){var g=api.groundAt(ev.clientX,ev.clientY);if(g)addItem(val,g.x,g.z,true)}
      else{var bn=boxAt(ev.clientX,ev.clientY);if(bn)assign(val,bn);else P.toast('Lâchez le cheval sur un box',{icon:'info'})}}
    document.addEventListener('pointermove',mv,{passive:false});document.addEventListener('pointerup',up);document.addEventListener('pointercancel',up)})}

  /* ---------- tracer un paddock au doigt ---------- */
  var drawing=null;
  function startDraw(target){drawing={target:target,pts:[]};if(KS.view!=='top')setView('top');banEl.innerHTML='<span>Tracez le contour du paddock avec le doigt ou la souris</span><button class="btn sm" data-kcan>Annuler</button>';banEl.classList.add('on');stage.classList.add('kc-drawing');
    banEl.querySelector('[data-kcan]').onclick=function(){endDraw()}}
  function endDraw(){drawing=null;banEl.classList.remove('on');stage.classList.remove('kc-drawing');if(api)api.setDraw(null)}
  function finishDraw(){var d=drawing,pts=d.pts;if(pts.length<6){P.toast('Tracez un contour plus grand',{icon:'info'});d.pts=[];api.setDraw(null);return}
    var s=kRdp(pts.concat([pts[0]]),1.2);s.pop();if(s.length<3||kArea(s)<60){P.toast('Contour trop petit : tracez au moins 8 m de côté',{icon:'info'});d.pts=[];api.setDraw(null);return}
    var cx=0,cz=0;s.forEach(function(p){cx+=p[0];cz+=p[1]});cx/=s.length;cz/=s.length;cx=Math.round(cx);cz=Math.round(cz);
    var rel=s.map(function(p){return [Math.round((p[0]-cx)*2)/2,Math.round((p[1]-cz)*2)/2]});push();
    if(d.target){var it=d.target;it.x=cx;it.z=cz;it.r=0;it.pts=rel;var f=kFp(it);it.w=Math.round(f[0]);it.d=Math.round(f[1]);api.setItem(it,true);endDraw();select(it.id);commit({t:'Contour de '+E(it.name)+' redessiné',i:'paddock'})}
    else{var n=kMake('paddock',items,{x:cx,z:cz,pts:rel});var f2=kFp(n);n.w=Math.round(f2[0]);n.d=Math.round(f2[1]);items.push(n);api.setItem(n,true);endDraw();welEl.classList.remove('on');select(n.id);commit({t:E(n.name)+' ajouté : '+F.num(Math.round(kArea(rel)))+' m²',i:'paddock'})}}

  /* ---------- vue ---------- */
  function setView(v){KS.view=v;P.$$('[data-kview]',el).forEach(function(b){b.setAttribute('aria-selected',b.getAttribute('data-kview')===v)});if(api)api.view(v)}

  /* ---------- assistant en 3 questions ---------- */
  function wizard(){var a={boxes:Math.max(4,Math.min(80,+D.club.boxes||D.horses.length||16)),carr:1,manege:false},step=0;
    var sh=P.sheet({title:'Créer mon centre',icon:'spark',body:function(b){
      function draw(){var Q=[['Combien de boxes ?','Toutes écuries confondues. Vous pourrez en ajouter ou en retirer ensuite.'],['Une carrière ?','Une piste extérieure en sable.'],['Un manège couvert ?','Pour monter par tous les temps.']][step];
        b.innerHTML='<div class="kc-wz"><div class="kc-wst">'+[0,1,2].map(function(i){return '<i class="'+(i<step?'done':i===step?'on':'')+'"></i>'}).join('')+'<span class="xs mut">Question '+(step+1)+' sur 3</span></div><h3>'+Q[0]+'</h3><p class="s mut">'+Q[1]+'</p>'+
          (step===0?'<div class="kc-wnum"><button data-bd="-1" title="Moins">'+ICON('minus')+'</button><output class="num">'+a.boxes+'</output><button data-bd="1" title="Plus">'+ICON('plus')+'</button></div><div class="kc-wq">'+[8,12,20,30,46,60].map(function(n){return '<button class="tag" data-bq="'+n+'" aria-pressed="'+(a.boxes===n)+'">'+n+'</button>'}).join('')+'</div>'
          :step===1?'<div class="kc-wc">'+[[0,'Aucune','Pas de piste extérieure'],[1,'Une carrière','60 × 30 m'],[2,'Deux carrières','Une pour les cours, une pour le travail']].map(function(c){return '<button class="kc-wch" data-c="'+c[0]+'" aria-pressed="'+(a.carr===c[0])+'"><b>'+c[1]+'</b><span>'+c[2]+'</span></button>'}).join('')+'</div>'
          :'<div class="kc-wc">'+[[true,'Oui','Manège de 40 × 20 m'],[false,'Non','Pas de piste couverte']].map(function(c){return '<button class="kc-wch" data-m="'+c[0]+'" aria-pressed="'+(a.manege===c[0])+'"><b>'+c[1]+'</b><span>'+c[2]+'</span></button>'}).join('')+'</div>')+'</div>';
        var sf=sh.querySelector('.sf');sf.innerHTML=(step?'<button class="btn ghost" data-prev>'+ICON('back','sm')+'Précédent</button>':'<span></span>')+'<button class="btn pri" data-next>'+(step<2?'Suivant':ICON('spark','sm')+'Créer mon plan')+'</button>';
        P.$$('[data-bd]',b).forEach(function(x){x.onclick=function(){a.boxes=Math.max(1,Math.min(120,a.boxes+(+x.getAttribute('data-bd'))));draw()}});
        P.$$('[data-bq]',b).forEach(function(x){x.onclick=function(){a.boxes=+x.getAttribute('data-bq');draw()}});
        P.$$('[data-c]',b).forEach(function(x){x.onclick=function(){a.carr=+x.getAttribute('data-c');draw()}});
        P.$$('[data-m]',b).forEach(function(x){x.onclick=function(){a.manege=x.getAttribute('data-m')==='true';draw()}});
        var pv=sf.querySelector('[data-prev]');if(pv)pv.onclick=function(){step--;draw()};
        sf.querySelector('[data-next]').onclick=function(){if(step<2){step++;draw();return}sh.close();apply(kGen({boxes:a.boxes,carr:a.carr,manege:a.manege,marcheur:a.manege&&a.boxes>=20}),'Votre centre est prêt : '+a.boxes+' boxes'+(a.carr?', '+(a.carr>1?'deux carrières':'une carrière'):'')+(a.manege?', un manège':'')+'.')}}
      setTimeout(draw,0)},foot:'<span></span>'})}
  function apply(next,msg){push();items.forEach(function(it){if(api)api.removeItem(it.id)});items=next;KS.sel=null;if(api){items.forEach(function(it){api.setItem(it,true)});api.select(null);var f=api.frameAll(items,KS.view);api.go(f,900)}
    welEl.classList.remove('on');commit({t:msg,i:'spark'});drawTop()}
  function tplSheet(){var sh=P.sheet({title:'Partir d’un modèle',icon:'grid',body:'<div class="kc-tpls">'+KTPL.map(function(t,i){return '<button class="kc-tpl" data-t="'+i+'"><span class="kc-pic lg">'+ICON(i===0?'stable':i===1?'horse':'trophy')+'</span><span class="grow"><b>'+t.l+'</b><small>'+t.s+'</small></span>'+ICON('right','sm')+'</button>'}).join('')+'<button class="kc-tpl" data-t="z"><span class="kc-pic lg">'+ICON('plus')+'</span><span class="grow"><b>Partir de zéro</b><small>Un terrain vide, vous posez chaque élément</small></span>'+ICON('right','sm')+'</button></div>'+(items.length?'<p class="xs mut" style="margin-top:12px">Le plan actuel sera remplacé. Vous pourrez revenir en arrière avec Annuler.</p>':'')});
    P.$$('[data-t]',sh).forEach(function(b){b.onclick=function(){var k=b.getAttribute('data-t');sh.close();if(k==='z'){apply([],'Terrain vide : ajoutez vos premiers éléments');welcome(true);return}var t=KTPL[+k];apply(kGen(t.o),'Modèle « '+t.l+' » posé')}})}
  function welcome(soft){if(items.length&&!soft){welEl.classList.remove('on');return}if(items.length){welEl.classList.remove('on');return}
    welEl.innerHTML='<div class="kc-wcard"><span class="kc-pic xl">'+ICON('map')+'</span><h2>Construisez votre centre en 3D</h2><p class="s mut">Répondez à trois questions : le plan se dessine tout seul. Vous le retouchez ensuite du bout du doigt.</p>'+
      '<button class="btn pri lg block" data-kwiz>'+ICON('spark','sm')+'Créer en 3 questions</button><div class="kc-wt">'+KTPL.map(function(t,i){return '<button class="kc-wtp" data-t="'+i+'"><b>'+t.l+'</b><span>'+t.o.boxes+' boxes</span></button>'}).join('')+'</div><button class="btn ghost block" data-kzero>Partir de zéro</button></div>';
    welEl.classList.add('on');P.$$('[data-t]',welEl).forEach(function(b){b.onclick=function(){var t=KTPL[+b.getAttribute('data-t')];apply(kGen(t.o),'Modèle « '+t.l+' » posé')}});
    welEl.querySelector('[data-kwiz]').onclick=wizard;welEl.querySelector('[data-kzero]').onclick=function(){welEl.classList.remove('on');P.toast('Glissez vos premiers éléments sur le terrain',{icon:'plus'})}}

  /* ---------- interactions sur le plan ---------- */
  function startScene(){if(api||!el.isConnected)return;
    api=kScene(gl,{mobile:mobile,view:KS.view,items:function(){return items},onFrame:posTop});
    if(!api){gl.innerHTML='<div class="kc-nogl">'+U.empty('cube','La 3D n’est pas disponible sur cet appareil','Activez l’accélération graphique du navigateur pour construire votre plan.')+'</div>';return}
    /* rendu progressif : quelques éléments par image */
    var q=items.slice();(function batch(){if(!api||!el.isConnected)return;q.splice(0,mobile?4:12).forEach(function(it){api.setItem(it,true)});api.syncHorses(items);if(q.length)requestAnimationFrame(batch);else{api.select(byId(KS.sel))}})();
    api.go(api.frameAll(items,KS.view),0,KS.view==='top'?.04:1);
    var cvs=api.canvas,ptr=new Map(),drag=null,bsT=0;
    cvs.addEventListener('contextmenu',function(e){e.preventDefault()});
    cvs.addEventListener('pointerdown',function(e){try{cvs.setPointerCapture(e.pointerId)}catch(x){}ptr.set(e.pointerId,{x:e.clientX,y:e.clientY});api.interacting();
      if(ptr.size===1){
        if(drawing){drawing.pts=[];var g0=api.groundAt(e.clientX,e.clientY);if(g0)drawing.pts.push([g0.x,g0.z]);drag={k:'draw'};return}
        var hit=api.pickAt(e.clientX,e.clientY);
        var ab=KS.armed&&boxAt(e.clientX,e.clientY);if(ab){assign(KS.armed,ab);KS.armed=null;banEl.classList.remove('on');drag=null;return}
        if(hit&&e.button===0){var it=byId(hit.userData.id),g=api.groundAt(e.clientX,e.clientY);if(it&&g)drag={k:'move',it:it,gx:g.x,gz:g.z,ox:it.x,oz:it.z,box:hit.userData.box,wasSel:KS.sel===it.id,snap:snapshot(),moved:false,x:e.clientX,y:e.clientY}}
        else drag={k:e.button===2||e.shiftKey||KS.view==='top'?'pan':'orbit',x:e.clientX,y:e.clientY,moved:false}}
      else if(ptr.size===2){var a=Array.from(ptr.values()),ang=Math.atan2(a[1].y-a[0].y,a[1].x-a[0].x),dd=Math.hypot(a[1].x-a[0].x,a[1].y-a[0].y),cx=(a[0].x+a[1].x)/2,cy=(a[0].y+a[1].y)/2;
        var sit=byId(KS.sel);if(drag&&drag.k==='move'&&drag.moved&&drag.snap){/* le geste devient une rotation */}
        drag=sit?{k:'twist',it:sit,a0:ang,r0:sit.r||0,d0:dd,cx:cx,cy:cy,snap:snapshot(),moved:false}:{k:'pinch',d0:dd,cx:cx,cy:cy}}});
    cvs.addEventListener('pointermove',function(e){var p=ptr.get(e.pointerId);
      if(!p){if(!drawing&&!mobile){var hb=api.pickAt(e.clientX,e.clientY);cvs.style.cursor=hb?(hb.userData.box&&KS.armed?'copy':'grab'):''}return}
      var dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;if(!drag)return;api.interacting();
      if(drag.k==='draw'){var g=api.groundAt(e.clientX,e.clientY);if(g){var l=drawing.pts[drawing.pts.length-1];if(!l||Math.hypot(g.x-l[0],g.z-l[1])>.8){drawing.pts.push([g.x,g.z]);api.setDraw(drawing.pts.concat(drawing.pts.length>2?[drawing.pts[0]]:[]))}}return}
      if(drag.k==='move'){if(!drag.moved&&Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<6)return;var g2=api.groundAt(e.clientX,e.clientY);if(!g2)return;
        if(!drag.moved){drag.moved=true;if(KS.sel!==drag.it.id)select(drag.it.id);cvs.style.cursor='grabbing'}
        drag.it.x=Math.round(drag.ox+g2.x-drag.gx);drag.it.z=Math.round(drag.oz+g2.z-drag.gz);drag.it.x=Math.max(-220,Math.min(220,drag.it.x));drag.it.z=Math.max(-220,Math.min(220,drag.it.z));api.place(drag.it);api.syncHorses(items);return}
      if(drag.k==='orbit'){drag.moved=drag.moved||Math.abs(dx)+Math.abs(dy)>3;api.orbit(-dx*.006,-dy*.004);return}
      if(drag.k==='pan'){drag.moved=drag.moved||Math.abs(dx)+Math.abs(dy)>3;api.pan(dx,dy);return}
      if(ptr.size>=2){var a=Array.from(ptr.values()),ang=Math.atan2(a[1].y-a[0].y,a[1].x-a[0].x),dd=Math.hypot(a[1].x-a[0].x,a[1].y-a[0].y);
        if(drag.k==='twist'){var deg=(ang-drag.a0)*180/Math.PI;if(Math.abs(deg)>4||drag.moved){drag.moved=true;var rv=drag.r0-deg;drag.it.r=Math.round(rv/15)*15;api.place(drag.it);api.syncHorses(items)}
          else if(Math.abs(dd-drag.d0)>30){drag={k:'pinch',d0:dd}}}
        else if(drag.k==='pinch'){api.zoom(drag.d0/Math.max(10,dd));drag.d0=dd}}});
    function up(e){if(!ptr.has(e.pointerId))return;ptr.delete(e.pointerId);var d=drag;
      if(d&&d.k==='draw'&&drawing){finishDraw();drag=null;return}
      if(ptr.size>0){if(d&&d.k==='twist'&&d.moved){KS.undo.push(d.snap);KS.redo=[];save();drawTop();drawSide()}drag=null;return}
      drag=null;cvs.style.cursor='';if(!d)return;
      if(d.k==='move'){if(d.moved){KS.undo.push(d.snap);KS.redo=[];save();drawSide();posTop()}
        else if(d.box&&d.wasSel){var bb=boxAt(e.clientX,e.clientY)||d.box;d.box=bb;clearTimeout(bsT);bsT=setTimeout(function(){if(el.isConnected)boxSheet(d.box)},280)}else select(d.it.id)}
      else if(d.k==='twist'&&d.moved){KS.undo.push(d.snap);KS.redo=[];save();drawTop();drawSide()}
      else if((d.k==='orbit'||d.k==='pan')&&!d.moved){if(KS.sel)select(null)}}
    cvs.addEventListener('pointerup',up);cvs.addEventListener('pointercancel',up);
    cvs.addEventListener('dblclick',function(e){clearTimeout(bsT);var h=api.pickAt(e.clientX,e.clientY);if(h){var it=byId(h.userData.id);if(it){select(it.id);focusOn(it)}}});
    cvs.addEventListener('wheel',function(e){e.preventDefault();api.zoom(e.deltaY>0?1.1:1/1.1)},{passive:false});
    /* poignée de rotation */
    rotEl.addEventListener('pointerdown',function(e){var it=byId(KS.sel);if(!it)return;e.preventDefault();try{rotEl.setPointerCapture(e.pointerId)}catch(x){}var c=api.project(it.x,0,it.z),r=api.canvas.getBoundingClientRect(),s=snapshot(),r0=it.r||0,a0=Math.atan2(e.clientY-r.top-c.y,e.clientX-r.left-c.x),moved=false;
      function mv(ev){var a=Math.atan2(ev.clientY-r.top-c.y,ev.clientX-r.left-c.x),deg=(a-a0)*180/Math.PI;if(!moved&&Math.abs(deg)<2)return;moved=true;var v=r0-deg;it.r=ev.shiftKey?Math.round(v):Math.round(v/15)*15;it.r=((it.r%360)+360)%360;api.place(it);api.syncHorses(items)}
      function upp(){rotEl.removeEventListener('pointermove',mv);rotEl.removeEventListener('pointerup',upp);rotEl.removeEventListener('pointercancel',upp);if(moved){KS.undo.push(s);KS.redo=[];save();drawSide();drawTop()}}
      rotEl.addEventListener('pointermove',mv);rotEl.addEventListener('pointerup',upp);rotEl.addEventListener('pointercancel',upp)});
    welcome()}
  /* clavier : annuler, rétablir, supprimer, tourner, flèches */
  function key(e){if(!el.isConnected){document.removeEventListener('keydown',key);return}var t=e.target;if(t&&/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))return;if(document.querySelector('.app .sheet'))return;
    var m=e.metaKey||e.ctrlKey;if(m&&e.key.toLowerCase()==='z'){e.preventDefault();if(e.shiftKey)redo();else undo();return}if(m&&e.key.toLowerCase()==='y'){e.preventDefault();redo();return}
    var it=byId(KS.sel);if(!it)return;
    if(e.key==='Delete'||e.key==='Backspace'){e.preventDefault();push();(it.labels||[]).forEach(function(l){var h=kHorseIn(l);if(h)h.box=''});items=items.filter(function(x){return x!==it});api.removeItem(it.id);select(null);commit();P.toast((it.name||KT[it.t].l)+' supprimé',{icon:'trash',undo:undo});return}
    if(e.key==='r'||e.key==='R'){push();it.r=((it.r||0)+(e.shiftKey?-15:15)+360)%360;api.place(it);api.syncHorses(items);commit();return}
    if(m&&e.key.toLowerCase()==='d'){e.preventDefault();act('dup');return}
    var mv={ArrowLeft:[-1,0],ArrowRight:[1,0],ArrowUp:[0,-1],ArrowDown:[0,1]}[e.key];if(mv){e.preventDefault();push();it.x+=mv[0]*(e.shiftKey?5:1);it.z+=mv[1]*(e.shiftKey?5:1);api.place(it);api.syncHorses(items);save()}
    if(e.key==='Escape')select(null)}
  document.addEventListener('keydown',key);

  /* boutons */
  P.$$('[data-kview]',el).forEach(function(b){b.onclick=function(){if(drawing&&b.getAttribute('data-kview')==='3d')endDraw();setView(b.getAttribute('data-kview'))}});
  P.$$('[data-kzoom]',el).forEach(function(b){b.onclick=function(){if(api)api.zoom(+b.getAttribute('data-kzoom'))}});
  $('[data-kfit]').onclick=function(){if(api)api.go(api.frameAll(items,KS.view),700)};
  $('[data-kundo]').onclick=undo;$('[data-kredo]').onclick=redo;
  P.$$('[data-kwiz]',el).forEach(function(b){b.onclick=wizard});var tp=$('[data-ktpl]');if(tp)tp.onclick=tplSheet;
  P.$$('[data-kside]',el).forEach(function(b){b.onclick=function(){KS.side=b.getAttribute('data-kside');if(KS.sel){KS.sel=null;if(api)api.select(null);drawTop()}drawSide()}});
  var adds=$('[data-kadds]');if(adds)adds.onclick=function(){P.sheet({title:'Ajouter au plan',icon:'plus',body:function(b){b.innerHTML='<p class="s mut kc-tip">Touchez un élément pour l’ajouter, ou glissez-le sur le plan.</p>'+palette+'<div class="kc-draw"><button class="btn block" data-kdraw>'+ICON('edit','sm')+'Dessiner un paddock au doigt</button></div><div class="kc-acts" style="margin-top:12px"><button class="btn block" data-ktpl2>'+ICON('grid','sm')+'Partir d’un modèle</button></div>';wireSide(b);b.querySelector('[data-ktpl2]').onclick=tplSheet}})};
  var hs=$('[data-khs]');if(hs)hs.onclick=function(){P.sheet({title:'Placer les chevaux',icon:'horse',body:function(b){b.innerHTML=horsesHtml();wireSide(b)}})};
  drawSide();
  /* la scène démarre après la mise en page (et se libère seule en quittant l'écran) */
  requestAnimationFrame(function(){requestAnimationFrame(startScene)});
 }});
function DEMO_PLAN(){return !window.PL}
/* deux petites icônes propres à l'écran */
var KIC={undo:function(){return '<svg class="i sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 7.5L4.5 12 9 16.5"/><path d="M4.8 12H14a5.5 5.5 0 0 1 0 11h-2.5" transform="translate(0 -4)"/></svg>'},
  redo:function(){return '<svg class="i sm" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 7.5l4.5 4.5-4.5 4.5"/><path d="M19.2 12H10a5.5 5.5 0 0 0 0 11h2.5" transform="translate(0 -4)"/></svg>'}};
P.actions.push({role:'gerant',label:'Construire mon centre en 3D',icon:'map',run:function(){P.go('centre3d')}});
P.tourSteps.push({route:'centre3d',title:'Votre centre en 3D, en trois questions',text:'Le gérant répond à trois questions, le plan se dessine tout seul : écuries, carrière, manège, paddocks. Il déplace, tourne ou duplique chaque élément du bout du doigt, puis glisse chaque cheval dans son box.'});
P.css(`
.kc-wrap{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:18px;align-items:start}
.kc-stage{position:relative;overflow:hidden;overflow:clip;min-height:420px;border-radius:24px;user-select:none;-webkit-user-select:none;
 background:radial-gradient(90% 70% at 50% 35%,var(--surface) 0%,transparent 78%),linear-gradient(180deg,color-mix(in srgb,var(--acc-bg) 55%,var(--surface)) 0%,color-mix(in srgb,var(--hz-bg) 60%,var(--bg-2)) 100%)}
.kc-gl{position:absolute;inset:0}
.kc-cv{display:block;width:100%;height:100%;touch-action:none;cursor:grab;outline:none}
.kc-drawing .kc-cv{cursor:crosshair}
.kc-ov{position:absolute;inset:0;pointer-events:none;overflow:hidden;overflow:clip}
.kc-lab,.kc-bl{position:absolute;left:0;top:0;will-change:transform;white-space:nowrap;transition:opacity var(--t-2)}
.kc-lab{font:700 13px/1 var(--f-text);color:var(--ink);background:color-mix(in srgb,var(--surface) 88%,transparent);padding:6px 9px;border-radius:9px;box-shadow:var(--shadow-1);margin-top:-6px}
.kc-lab.sel{background:var(--acc);color:var(--on-acc)}
.kc-bl{display:flex;flex-direction:column;align-items:center;gap:1px;font:600 13px/1.1 var(--f-text);color:var(--ink);background:color-mix(in srgb,var(--surface) 82%,transparent);padding:3px 6px;border-radius:7px}
.kc-bl b{font:800 13px/1 var(--f-display);letter-spacing:-.01em}.kc-bl span{font-size:13px;font-weight:600;color:var(--hz-ink)}
.kc-bl.free{opacity:.75}.kc-bl.free b{color:var(--mut)}
.kc-lab.off,.kc-bl.off,.kc-lab.hid{opacity:0}
.kc-top{position:absolute;left:12px;right:12px;top:12px;display:flex;align-items:flex-start;gap:8px;z-index:4;pointer-events:none;flex-wrap:wrap}
.kc-top>*{pointer-events:auto}
.kc-g .seg button{display:inline-flex;align-items:center;gap:6px}
.kc-sep{width:1px;height:22px;background:var(--line);margin:0 3px}
.kc-st{margin-left:auto;display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:600;color:var(--ok-ink,var(--ink));background:color-mix(in srgb,var(--surface) 88%,transparent);padding:7px 11px;border-radius:999px;box-shadow:var(--shadow-1);opacity:0;transform:translateY(-4px);transition:opacity var(--t-2),transform var(--t-2) var(--e-out)}
.kc-st svg.i{color:var(--ok)}
.kc-st.on{opacity:1;transform:none}
.kc-sel{position:absolute;left:0;top:0;z-index:5;display:none;align-items:center;gap:2px;padding:4px 4px 4px 12px;border-radius:16px;background:color-mix(in srgb,var(--surface) 94%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:inset 0 0 0 1px var(--line),var(--shadow-2);max-width:calc(100% - 16px)}
.kc-sel.on{display:flex}
.kc-sel>b{font-size:14px;max-width:180px;margin-right:6px}
.kc-sel .btn{box-shadow:none;background:transparent}.kc-sel .btn:hover{background:var(--bg-2)}
.kc-sel .danger,.kc-acts .danger{color:var(--bad)}
.kc-acts .danger.cf,.kc-sel .danger.cf,.kc-foot .cf{background:var(--bad);color:#fff;box-shadow:none}
.kc-rot{position:absolute;left:0;top:0;z-index:5;width:40px;height:40px;border-radius:50%;display:none;place-items:center;background:var(--acc);color:var(--on-acc);box-shadow:0 0 0 4px color-mix(in srgb,var(--acc) 22%,transparent),var(--shadow-2);cursor:grab;touch-action:none}
.kc-rot.on{display:grid}.kc-rot.off{opacity:0;pointer-events:none}
.kc-step{display:inline-flex;align-items:center;border-radius:12px;background:var(--bg-2);padding:2px}
.kc-step button{width:34px;height:34px;border-radius:10px;display:grid;place-items:center;color:var(--ink)}
.kc-step button:hover{background:var(--surface)}
.kc-step output{min-width:30px;text-align:center;font-weight:800}
.kc-step.sm button{width:30px;height:30px}
.kc-ban{position:absolute;left:50%;top:64px;transform:translateX(-50%);z-index:6;display:none;align-items:center;gap:10px;padding:8px 8px 8px 16px;border-radius:999px;background:var(--navy);color:var(--on-navy);font-size:14px;font-weight:600;box-shadow:var(--shadow-3);white-space:nowrap;max-width:calc(100% - 24px)}
.kc-ban.on{display:flex}.kc-ban span{overflow:hidden;text-overflow:ellipsis}
.kc-ban .btn{background:color-mix(in srgb,var(--on-navy) 14%,transparent);color:var(--on-navy);box-shadow:none}
.kc-welcome{position:absolute;inset:0;z-index:7;display:none;place-items:center;padding:16px;background:color-mix(in srgb,var(--surface) 40%,transparent);backdrop-filter:blur(3px)}
.kc-welcome.on{display:grid}
.kc-wcard{width:min(440px,100%);background:var(--surface);border-radius:24px;box-shadow:var(--shadow-3);padding:26px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px}
.kc-wcard h2{font:800 26px/1.1 var(--f-display);letter-spacing:-.03em}
.kc-wt{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;width:100%}
.kc-wtp{display:flex;flex-direction:column;gap:2px;padding:12px 8px;border-radius:14px;border:1px solid var(--line);text-align:center}
.kc-wtp:hover{border-color:var(--acc);background:var(--acc-bg)}
.kc-wtp b{font-size:14px;line-height:1.2}.kc-wtp span{font-size:13px;color:var(--mut)}
.kc-pic{width:32px;height:32px;border-radius:10px;display:grid;place-items:center;background:var(--hz-bg);color:var(--hz-ink);flex:none}
.kc-pic.lg{width:44px;height:44px;border-radius:14px}.kc-pic.xl{width:60px;height:60px;border-radius:18px}.kc-pic.xl svg.i{width:30px;height:30px}
.kc-side{display:flex;flex-direction:column;min-height:0;overflow:hidden;border-radius:24px}
.kc-tabs{padding:8px 12px 0}
.kc-sb{flex:1;min-height:0;overflow-y:auto;padding:14px 16px 16px;scrollbar-width:thin}
.kc-tip{margin-bottom:12px}
.kc-pal{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.kc-pi{display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:14px;border:1px solid var(--line);background:var(--surface);font-size:14px;font-weight:600;text-align:left;touch-action:none;cursor:grab;transition:border-color var(--t-1),background var(--t-1),transform var(--t-1)}
.kc-pi:hover{border-color:var(--acc);background:var(--acc-bg)}
.kc-pi:active{transform:scale(.97)}
.kc-draw{margin-top:12px}.kc-foot{margin-top:18px;padding-top:12px;border-top:1px solid var(--line)}
.kc-ghost{position:fixed;left:0;top:0;z-index:9999;pointer-events:none;display:flex;align-items:center;gap:8px;padding:8px 12px;border-radius:14px;background:var(--surface);box-shadow:var(--shadow-3);font-weight:700;font-size:14px;color:var(--ink)}
.kc-sec{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:700;color:var(--mut);text-transform:uppercase;letter-spacing:.06em;margin:14px 0 6px}
.kc-h{display:flex;align-items:center;gap:10px;width:100%;padding:8px 10px;border-radius:14px;text-align:left;cursor:grab}
.kc-h:hover{background:var(--bg-2)}
.kc-h .grow{display:flex;flex-direction:column;min-width:0}.kc-h small{font-size:13px;color:var(--mut)}
.kc-h>svg.i{color:var(--mut-2)}
.kc-hl{display:flex;flex-direction:column;max-height:52vh;overflow-y:auto}
.kc-cur{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:14px;background:var(--hz-bg)}
.kc-empty{display:flex;flex-direction:column;align-items:center;text-align:center;gap:8px;padding:18px 8px}
.kc-back{display:inline-flex;align-items:center;gap:6px;font-weight:600;color:var(--mut);margin-bottom:12px}
.kc-eh{display:flex;gap:12px;align-items:center;margin-bottom:14px}
.kc-name{height:42px;font-weight:700;font-size:16px;margin-top:4px}
.kc-row{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:10px 0;border-top:1px solid var(--line)}
.kc-row.col{flex-direction:column;align-items:flex-start}.kc-row.col .seg{max-width:100%;overflow-x:auto}
.kc-bxs{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px;margin:4px 0 12px}
.kc-bx{display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:7px 9px;border-radius:11px;border:1px dashed var(--line-2);min-width:0;text-align:left}
.kc-bx b{font:800 13px/1 var(--f-display)}.kc-bx span{font-size:13px;color:var(--mut);max-width:100%}
.kc-bx.on{border-style:solid;border-color:transparent;background:var(--hz-bg)}.kc-bx.on span{color:var(--hz-ink);font-weight:600}
.kc-bx:hover{border-color:var(--acc)}
.kc-acts{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}.kc-acts .btn{flex:1 1 auto}
.kc-mb{position:absolute;left:12px;right:12px;bottom:14px;z-index:4;display:none;gap:8px}
.kc-mb .btn{flex:1;background:color-mix(in srgb,var(--surface) 92%,transparent);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);box-shadow:inset 0 0 0 1px var(--line),var(--shadow-2)}
.kc-mb .btn.icon{flex:0 0 52px}
.kc-nogl{position:absolute;inset:0;display:grid;place-items:center;padding:20px}
.kc-wz h3{font:800 24px/1.15 var(--f-display);letter-spacing:-.03em;margin:14px 0 6px}
.kc-wst{display:flex;align-items:center;gap:6px}.kc-wst i{width:28px;height:6px;border-radius:3px;background:var(--line)}.kc-wst i.on{background:var(--acc)}.kc-wst i.done{background:color-mix(in srgb,var(--acc) 45%,var(--surface))}.kc-wst span{margin-left:6px}
.kc-wnum{display:flex;align-items:center;justify-content:center;gap:18px;margin:22px 0 16px}
.kc-wnum button{width:56px;height:56px;border-radius:18px;background:var(--bg-2);display:grid;place-items:center}
.kc-wnum button:hover{background:var(--acc-bg);color:var(--acc-deep)}
.kc-wnum output{font:800 64px/1 var(--f-display);letter-spacing:-.04em;min-width:110px;text-align:center}
.kc-wq{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.kc-wc{display:grid;gap:10px;margin-top:18px}
.kc-wch{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:16px 18px;border-radius:18px;border:1.5px solid var(--line);text-align:left;transition:border-color var(--t-1),background var(--t-1)}
.kc-wch b{font-size:17px}.kc-wch span{font-size:14px;color:var(--mut)}
.kc-wch[aria-pressed="true"]{border-color:var(--acc);background:var(--acc-bg)}.kc-wch[aria-pressed="true"] b{color:var(--acc-deep)}
.kc-tpls{display:flex;flex-direction:column;gap:10px}
.kc-tpl{display:flex;align-items:center;gap:14px;padding:14px;border-radius:18px;border:1px solid var(--line);text-align:left}
.kc-tpl:hover{border-color:var(--acc);background:var(--acc-bg)}
.kc-tpl .grow{display:flex;flex-direction:column;gap:2px}.kc-tpl small{font-size:13.5px;color:var(--mut)}
@container main (max-width:1080px){.kc-wrap{grid-template-columns:minmax(0,1fr) 280px}}
@container main (max-width:860px){.kc-wrap{grid-template-columns:minmax(0,1fr)}.kc-side{display:none}.kc-mb{display:flex}}
@container main (max-width:560px){.kc-g .seg button span{display:none}.kc-st{display:none}.kc-sel>b{max-width:96px}.kc-wt{grid-template-columns:minmax(0,1fr)}.kc-wcard{padding:20px}.kc-wcard h2{font-size:22px}}
@media (prefers-reduced-motion:reduce){.kc-st,.kc-lab,.kc-bl{transition:none}}
`);

})();
