/* Vue gérant · Croissance et argent récupéré (préfixe CSS .gr-)
   Écrans : aides et réductions (Pass’Sport, ANCV, CAF, CSE, mairie, remise famille), TVA claire (assistant BOFiP),
   avis Google, cartes cadeaux et parrainage, satisfaction (sondages de fin de stage, note par moniteur),
   « Ce que Stabl vous a rapporté », site internet du club. Face adhérent : « Avantages ».
   Données : D.aids, D.gReviews, D.referrals, D.surveys, D.growthCfg (réglages, un objet par écran), D.giftcards (partagé
   avec la boutique). Dans la démo, des jeux d'exemple déterministes ; dans l'appli, ces collections viennent du serveur
   (enregistrements synchronisés) et commencent vides : chaque écran a son état vide utile. */
(function(){
var D=P.D,F=P.fmt,U=P.ui,E=F.esc,NB=' ',$=P.$,$$=P.$$;
var LIVE=!!(window.PL&&window.PL.live);

/* ---------- Menu : une section « Croissance » (avant Plateforme) ---------- */
(function(){var g=P.groups.gerant;if(g.indexOf('Croissance')<0){var i=g.indexOf('Plateforme');g.splice(i<0?g.length:i,0,'Croissance')}
  if(!P.domGroups['Croissance'])P.domGroups['Croissance']='ex'})();

/* ---------- Outils ---------- */
function brand(){try{if(window.PL&&PL.brandName)return PL.brandName()}catch(e){}return (window.BRAND&&(BRAND.name||BRAND.wordmark))||'Stabl'}
function tIso(){return D.iso(D.today)}
function pl(n,s,p){return n+NB+(n>1?(p||s+'s'):s)}
function eur(v){return F.eur(v,Math.round(v)!==v)}
function pct(v){return (Math.round(v*10)/10).toString().replace('.',',')+NB+'%'}
function rate(v){return v===0?'0'+NB+'%':String(v).replace('.',',')+NB+'%'}
function dec1(v){return (Math.round(v*10)/10).toLocaleString('fr-FR')}
function note(v){return (Math.round((+v||0)*10)/10).toFixed(1).replace(".",",")}
function cap(s){return s?s.charAt(0).toUpperCase()+s.slice(1):''}
function slug(s){return String(s||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'').replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'')}
function clone(o){return JSON.parse(JSON.stringify(o))}
function on(root,sel,fn){$$(sel,root).forEach(function(b){b.addEventListener('click',function(e){fn(b,e)})})}
function mem(id){return D.member(id)||D.person(id)}
function nameOf(id){var p=mem(id);return p?(p.first+' '+p.last).trim():''}
function fam(m){return m?D.members.filter(function(x){return x.fam===m.fam}):[]}
function forf(id){return (D.forfaits||[]).find(function(f){return f.id===id})}
function seance(){var c=(D.forfaits||[]).find(function(f){return f.kind==='carte'&&f.price});return c?Math.round(c.price/10*100)/100:30}
function monthKey(d){return String(d||'').slice(0,7)}
var MOL=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
function monthName(mk){var m=+mk.slice(5,7)-1;return MOL[m]+' '+mk.slice(0,4)}
function addDays(iso,n){var d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+n);return D.iso(d)}
function daysBetween(a,b){return Math.round((new Date(b+'T12:00:00')-new Date(a+'T12:00:00'))/864e5)}
/* vrai fichier téléchargé (fonction commune du socle si elle existe) */
function dl(name,content,type){type=type||'text/plain;charset=utf-8';
  if(typeof P.download==='function'){try{return P.download(name,content,type)}catch(e){}}
  try{var b=new Blob([content],{type:type}),a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=name;a.rel='noopener';a.style.display='none';document.body.appendChild(a);a.click();setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},800)}catch(e){}}
function csv(rows){return '﻿'+rows.map(function(r){return r.map(function(c){c=String(c==null?'':c);return /[;"\n]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c}).join(';')}).join('\r\n')}
function copy(t,msg){try{if(navigator.clipboard)navigator.clipboard.writeText(t).catch(function(){})}catch(e){}P.toast(msg||'Copié dans le presse-papiers',{icon:'copy'})}
function star(cls){return '<svg class="gr-star '+(cls||'')+'" viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3.2 2.6 5.5 6 .8-4.4 4.2 1.1 6-5.3-2.9-5.3 2.9 1.1-6L3.4 9.5l6-.8z"/></svg>'}
function stars(v,sz){var h='<span class="gr-stars'+(sz?' '+sz:'')+'" aria-label="'+note(v)+' sur 5">';for(var i=1;i<=5;i++)h+=star(v>=i-.25?'on':v>=i-.75?'half':'');return h+'</span>'}
function idx(arr,pre){var n=0;(arr||[]).forEach(function(x){var k=parseInt(String(x.id||'').replace(/\D/g,''),10);if(k>n)n=k});return pre+String(n+1).padStart(2,'0')}
/* réglages de chaque écran : un objet par écran dans D.growthCfg (collection synchronisée dans l'appli) */
function cfg(id,def){if(!Array.isArray(D.growthCfg))D.growthCfg=[];var c=D.growthCfg.find(function(x){return x.id===id});
  if(!c){c=Object.assign({id:id},clone(def));D.growthCfg.push(c)}else Object.keys(def).forEach(function(k){if(c[k]===undefined)c[k]=clone(def[k])});return c}
function arr(k){if(!Array.isArray(D[k]))D[k]=[];return D[k]}
/* entrée douce d'un bloc qui change (onglet, filtre) */
function swap(box,html){box.innerHTML=html;P.animate(box);if(!P.RM&&box.animate)box.animate([{opacity:0,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:220,easing:'cubic-bezier(.2,.8,.2,1)'})}

/* =====================================================================
   Données d'exemple (démo). Dans l'appli, le serveur les remplace.
   ===================================================================== */
var R=(function(s){return function(){s=(s*1664525+1013904223)>>>0;return s/4294967296}})(55261126);
function ri(a,b){return a+Math.floor(R()*(b-a+1))}
var AL='ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
function rcode(n){var s='';for(var i=0;i<n;i++)s+=AL[Math.floor(R()*AL.length)];return s}
function dt(y,m,d){return D.iso(new Date(y,m-1,d))}
var KIDS=D.members.filter(function(m){return m.age>=6&&m.age<=17&&m.forfait!=='f5'});
var ADULTS=D.members.filter(function(m){return !m.minor&&m.forfait!=='f5'});

/* dans l'appli (ou sans assez de cavaliers), pas d'exemple : écrans vides */
if(LIVE||KIDS.length<18||ADULTS.length<16){['aids','giftcards','referrals','surveys','gReviews'].forEach(function(k){if(!Array.isArray(D[k]))D[k]=[]});if(!D.growthLog)D.growthLog={}}
if(!D.aids){
  var ps=KIDS.filter(function(m,i){return i%2===0}).slice(0,14);
  D.aids=ps.map(function(m,i){var st=i<5?'rembourse':i<11?'declare':'deduit';
    return {id:'ai'+String(i+1).padStart(2,'0'),kind:'passsport',member:m.id,amount:50,code:'PS26-'+rcode(4)+'-'+rcode(4),date:dt(2026,9,2+i*5),status:st,
      declaredAt:st!=='deduit'?(i<5?dt(2026,10,5):dt(2026,11,3)):null,paidAt:st==='rembourse'?dt(2026,11,6):null}});
  var ancv=[200,150,120,100,70];ADULTS.slice(4,9).forEach(function(m,i){D.aids.push({id:'ai'+(15+i),kind:'ancv',member:m.id,amount:ancv[i],ref:'Bordereau 2026-11',date:dt(2026,11,2+i*2),status:'declare',declaredAt:dt(2026,11,13),paidAt:null})});
  [30,40,20].forEach(function(a,i){D.aids.push({id:'ai'+(20+i),kind:'coupon',member:KIDS[2*i+1].id,amount:a,ref:'Coupon n° '+(420180+ri(100,999)),date:dt(2026,10,8+i*9),status:'deduit',declaredAt:null,paidAt:null})});
  D.aids.push({id:'ai23',kind:'caf',member:KIDS[9].id,amount:60,ref:'Aide aux loisirs CAF des Yvelines',date:dt(2026,9,14),status:'rembourse',declaredAt:dt(2026,9,20),paidAt:dt(2026,10,22)});
  D.aids.push({id:'ai24',kind:'caf',member:KIDS[13].id,amount:45,ref:'Aide aux loisirs CAF des Yvelines',date:dt(2026,10,1),status:'declare',declaredAt:dt(2026,10,6),paidAt:null});
  D.aids.push({id:'ai25',kind:'cse',member:ADULTS[11].id,amount:100,ref:'CSE de l’employeur',date:dt(2026,9,9),status:'rembourse',declaredAt:dt(2026,9,12),paidAt:dt(2026,10,2)});
  D.aids.push({id:'ai26',kind:'cse',member:ADULTS[15].id,amount:80,ref:'CSE de l’employeur',date:dt(2026,11,4),status:'deduit',declaredAt:null,paidAt:null});
  D.aids.push({id:'ai27',kind:'mairie',member:KIDS[17].id,amount:40,ref:'Aide sport de la commune',date:dt(2026,10,12),status:'declare',declaredAt:dt(2026,10,20),paidAt:null});
}
if(!D.giftcards)D.giftcards=[
 {code:'TIL-8K2F-41',amount:100,rest:100,buyer:'Hélène Barbier',to:'Noé Barbier',date:'2026-11-15',msg:'Joyeux anniversaire'},
 {code:'TIL-3M9C-07',amount:60,rest:22,buyer:'Sophie Lambert',to:'Mila Lambert',date:'2026-10-28',msg:'Pour ta première carte de séances'},
 {code:'TIL-6T1A-93',amount:290,rest:290,buyer:'Comité d’entreprise Safran',to:'À attribuer',date:'2026-11-09',msg:'Carte 10 séances'},
 {code:'TIL-2B7X-58',amount:40,rest:0,buyer:'Pierre Roussel',to:'Clara Roussel',date:'2026-09-12',msg:'Baptême et balade'},
 {code:'TIL-9Q4D-12',amount:150,rest:150,buyer:'Valérie Durand',to:'Lou Durand',date:'2026-11-16',msg:'Stage de Noël'}];
var NEW=D.members.filter(function(m){return m.since===2026&&m.id!=='m001'});
if(!D.referrals){var RP=[['m001','Camille Perrin',dt(2026,10,4),'recompense'],['m001','Julie Faure',dt(2026,11,12),'essai'],['m014','Nathan Blanc',dt(2026,9,18),'recompense'],['m052','Rose Guérin',dt(2026,11,2),'inscrit'],['m078','Marion Henry',dt(2026,11,9),'inscrit'],['m031','Paul Roussel',dt(2026,11,14),'invite'],['m078','Anna Colin',dt(2026,10,21),'recompense'],['m052','Lina Bonnet',dt(2026,11,16),'invite']];
  D.referrals=RP.map(function(r,i){return {id:'pr'+String(i+1).padStart(2,'0'),by:r[0],friend:r[1],date:r[2],status:r[3],forfait:i%3===0?'f2':'f1'}})}
if(!D.surveys){var CMT=['Super stage, ma fille ne parle que de ça.','Moniteur très pédagogue et patient.','Bonne organisation, horaires respectés.','Un peu court, on aurait aimé une balade.','Les poneys étaient bien préparés.','Très bonne ambiance dans le groupe.','Merci pour les photos envoyées le soir.','Le goûter était une très bonne idée.'];
  var SV=[['sv1','Stage de la Toussaint, Galops 2 à 4','stage','s03',dt(2026,10,30),18,14],['sv2','Stage poney des vacances','stage','s08',dt(2026,10,23),12,9],['sv3','Stage CSO de perfectionnement','stage','s04',dt(2026,10,28),8,7],['sv4','Fin de trimestre, reprises adultes','reprise','s02',dt(2026,11,10),22,13]];
  D.surveys=SV.map(function(s,si){var who=(s[2]==='reprise'?ADULTS:KIDS).slice(si*6,si*6+s[6]),ans=who.map(function(m,k){var g=k===4&&si===1?2:[5,5,4,5,5,4,5,3,5,4][(k+si)%10];
      return {member:m.id,global:g,coach:Math.min(5,Math.max(2,g+(k%5===2?-1:0)+(si===2?0:(k%7===3?1:0)))),again:g>=4||k%3===0,text:g<=2?'Ma fille n’a monté que deux jours sur trois à cause de la pluie et personne ne nous a prévenus.':(k%2===0?CMT[(k+si*3)%CMT.length]:''),done:false}});
    if(si===2)ans.push({member:'m001',pending:true});
    return {id:s[0],title:s[1],kind:s[2],coach:s[3],date:s[4],sent:s[5],answers:ans}})}
if(!D.gReviews){var GT=[[5,'Première séance','Accueil chaleureux, mon fils est reparti avec le sourire. On revient samedi.',true],[5,'Baptême poney','Poneys très doux et monitrice adorable avec les petits.',true],[4,'Cours d’essai','Très bon cours, juste un peu d’attente à l’accueil.',true],[2,'Première séance','Le cours a commencé avec 20 minutes de retard et personne ne nous a expliqué pourquoi.',false],[5,'Stage','Stage parfait, bien encadré, on a reçu les photos le soir même.',true],[3,'Cours d’essai','Moniteur sympa mais le groupe était trop nombreux pour une débutante.',false],[5,'Première séance','Club propre, chevaux bien tenus, on sent qu’ils sont heureux.',true],[5,'Baptême poney','Ma fille a adoré, merci à Jade !',false],[4,'Première séance','Très bien. Le parking est un peu loin des écuries.',true]];
  D.gReviews=GT.map(function(g,i){var m=NEW[i%NEW.length]||D.members[40+i];return {id:'gv'+String(i+1).padStart(2,'0'),member:m.id,moment:g[1],date:D.iso(D.day(-i*2-1)),rating:g[0],text:g[2],google:g[3],status:g[0]<=3?'a_traiter':'ok',reply:''}})}
if(!D.gStats)D.gStats={rating:4.6,count:112,asked:31,hist:[['Juin',4.3,74],['Juil',4.3,78],['Août',4.3,80],['Sept',4.4,88],['Oct',4.5,101],['Nov',4.6,112]]};
if(!D.growthLog)D.growthLog={'2026-09':{waitlist:14,bookings:212},'2026-10':{waitlist:17,bookings:241},'2026-11':{waitlist:11,bookings:186}};
/* factures réglées après la relance automatique (démo) */
(function(){if(LIVE||D._grRem)return;D._grRem=true;var n=0;(D.invoices||[]).forEach(function(x){if(x.status==='payée'&&x.due<=tIso()&&(n++)%3===0)x.reminded=true})})();

/* =====================================================================
   Styles
   ===================================================================== */
P.css(`
.gr-star{width:18px;height:18px;fill:var(--line-2);stroke:none}
.gr-star.on{fill:var(--mo)}
.gr-star.half{fill:var(--mo);opacity:.55}
.gr-stars{display:inline-flex;gap:1px;vertical-align:-3px}
.gr-stars.lg .gr-star{width:26px;height:26px}
.gr-top{display:grid;grid-template-columns:minmax(0,1.55fr) minmax(0,1fr);gap:16px;margin-bottom:16px}
.gr-top3{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-bottom:16px}
.gr-top3.gr-vat3{grid-template-columns:minmax(0,1.2fr) minmax(0,1.2fr) minmax(0,.9fr)}
@container main (max-width:1000px){.gr-top3.gr-vat3{grid-template-columns:repeat(2,minmax(0,1fr))}.gr-vat3>.hors{grid-column:1/-1}}
@container main (max-width:560px){.gr-top3.gr-vat3{grid-template-columns:minmax(0,1fr)}}
.gr-k2{grid-template-columns:repeat(2,minmax(0,1fr))!important;margin:0!important}
.gr-two{display:grid;grid-template-columns:minmax(0,1.45fr) minmax(0,1fr);gap:16px;align-items:start}
.gr-h{font:700 19px/1.2 var(--f-display);letter-spacing:-.015em}
.gr-k{font:800 40px/1 var(--f-display);letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.gr-k small{font:700 19px var(--f-display);opacity:.7;margin-left:4px;letter-spacing:-.01em}
.gr-lab{font:600 14.5px/1.3 var(--f-text);opacity:.85}
.gr-sub{font:500 14px/1.4 var(--f-text);opacity:.8;margin-top:6px}
.gr-row{display:flex;align-items:center;gap:12px;min-width:0}
.gr-row.sp{justify-content:space-between}
.gr-row.wrap{flex-wrap:wrap}
.gr-mono{font:500 14px var(--f-mono);letter-spacing:.02em}
.gr-scroll{max-height:440px;overflow:auto}
.gr-pill{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:999px;background:var(--d-bg);color:var(--d-ink);font:650 13.5px var(--f-text);white-space:nowrap}
.gr-pill i{width:8px;height:8px;border-radius:50%;background:var(--d)}
.gr-actions{display:flex;gap:10px;flex-wrap:wrap}
.gr-fade{animation:gr-in .3s var(--e-out) both}
@keyframes gr-in{from{opacity:0;transform:translateY(8px)}}
.gr-done-row{animation:gr-ok .6s var(--e-out)}
@keyframes gr-ok{0%{background:var(--ok-pale)}100%{background:transparent}}

/* ----- aides : campagne Pass'Sport ----- */
.gr-camp{padding:22px 24px;display:flex;flex-direction:column;gap:16px;justify-content:space-between}
.gr-camp h2{font:800 26px/1.1 var(--f-display);letter-spacing:-.03em;color:var(--ink)}
.gr-tline{position:relative;height:10px;border-radius:5px;background:color-mix(in srgb,var(--d) 16%,var(--surface));margin:22px 0 6px}
.gr-tline>i{position:absolute;left:0;top:0;bottom:0;border-radius:5px;background:var(--d);width:var(--v);transform-origin:left;animation:growx .9s var(--e-out) both}
.gr-tline>b{position:absolute;top:-28px;left:var(--v);translate:-50% 0;font:700 13px var(--f-text);color:var(--d-ink);white-space:nowrap;background:var(--surface);padding:3px 9px;border-radius:8px;box-shadow:var(--shadow-1)}
.gr-tline>b::after{content:'';position:absolute;left:50%;bottom:-4px;width:8px;height:8px;margin-left:-4px;background:var(--surface);transform:rotate(45deg)}
.gr-tl-l{display:flex;justify-content:space-between;font:500 13px var(--f-text);color:var(--mut)}
.gr-pipe{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.gr-step{border-radius:18px;padding:14px 16px;background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);position:relative;min-width:0}
.gr-step .n{font:800 32px/1 var(--f-display);letter-spacing:-.03em;font-variant-numeric:tabular-nums;color:var(--ink)}
.gr-step .l{font:650 14.5px var(--f-text);color:var(--ink-2);display:flex;align-items:center;gap:8px;margin-bottom:8px}
.gr-step .l i{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font:700 13px var(--f-text);font-style:normal;background:var(--d-bg);color:var(--d-ink);flex:none}
.gr-step .s{font:500 13.5px var(--f-text);color:var(--mut);margin-top:6px}
.gr-step.on{background:var(--d-bg);box-shadow:none}
.gr-step.on .n,.gr-step.on .l{color:var(--d-ink)}
.gr-step.on .s{color:color-mix(in srgb,var(--d-ink) 75%,transparent)}
.gr-step.on .l i{background:var(--surface);color:var(--d-ink)}
.gr-step+.gr-step::before{content:'';position:absolute;left:-10px;top:50%;width:10px;height:2px;background:var(--line-2)}
.gr-dots{display:inline-flex;align-items:center;gap:0}
.gr-dots i{width:12px;height:12px;border-radius:50%;background:var(--surface);box-shadow:inset 0 0 0 2px var(--line-2);flex:none}
.gr-dots i.on{background:var(--d);box-shadow:none}
.gr-dots b{width:16px;height:2px;background:var(--line-2)}
.gr-dots b.on{background:var(--d)}
.gr-dots span{margin-left:9px;font:600 14px var(--f-text);color:var(--ink-2);white-space:nowrap}
/* facture d'exemple */
.gr-inv{padding:20px 22px;display:flex;flex-direction:column;gap:2px}
.gr-inv .hd{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;margin-bottom:10px}
.gr-il{display:flex;justify-content:space-between;gap:14px;padding:8px 0;font:500 15px/1.35 var(--f-text);border-bottom:1px dashed var(--line);min-width:0}
.gr-il span:first-child{min-width:0}
.gr-il b{font-weight:650;font-variant-numeric:tabular-nums;white-space:nowrap}
.gr-il.minus b{color:var(--ok)}
.gr-il.aid{color:var(--d-ink);border-bottom:0;background:var(--d-bg);border-radius:12px;padding:9px 12px;margin:6px 0 2px}
.gr-il.tot{border-bottom:0;font:800 19px var(--f-display);letter-spacing:-.02em;padding-top:12px}
.gr-il small{display:block;font:500 13px var(--f-text);color:var(--mut);margin-top:2px}
.gr-il.aid small{color:inherit;opacity:.8}
/* autres aides */
.gr-kinds{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.gr-kind{padding:18px 20px;display:flex;flex-direction:column;gap:10px;min-width:0}
.gr-kind .hd{display:flex;gap:12px;align-items:center}
.gr-kind .hd b{font:700 16.5px/1.25 var(--f-text);display:block}
.gr-kind .hd small{font:500 13.5px var(--f-text);color:var(--mut)}
.gr-kind .v{font:800 28px/1 var(--f-display);letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.gr-kind p{font-size:14px;line-height:1.45;color:var(--mut)}
.gr-fams .li .r b{font-variant-numeric:tabular-nums}
.gr-rule{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:center;gap:14px;padding:14px 0;border-bottom:1px solid var(--line)}
.gr-rule:last-child{border-bottom:0}
.gr-rule b{display:block;font-weight:650}
.gr-rule small{display:block;color:var(--mut);font-size:14px;margin-top:2px;line-height:1.4}
.gr-num{width:92px;text-align:right}

/* ----- TVA ----- */
.gr-vat{padding:20px 22px;display:flex;flex-direction:column;gap:12px;min-width:0}
.gr-vat .rt{font:800 52px/1 var(--f-display);letter-spacing:-.045em;font-variant-numeric:tabular-nums}
.gr-vat ul{list-style:none;display:flex;flex-direction:column;gap:7px;margin:0;padding:0}
.gr-vat li{display:flex;gap:9px;align-items:flex-start;font:500 14.5px/1.4 var(--f-text)}
.gr-vat li svg.i{width:18px;height:18px;flex:none;margin-top:1px}
.gr-vat.hors .rt{font:700 19px/1.2 var(--f-display);letter-spacing:-.015em}
.gr-src{display:inline-flex;align-items:center;gap:6px;font:600 13.5px var(--f-text);color:inherit;opacity:.85;text-decoration:none;margin-top:auto}
.gr-src:hover{text-decoration:underline}
.gr-src svg.i{width:16px;height:16px}
.gr-rate{display:inline-grid;place-items:center;min-width:58px;height:30px;padding:0 10px;border-radius:10px;font:700 14px var(--f-text);font-variant-numeric:tabular-nums}
.gr-rate.r5{background:var(--hz-bg);color:var(--hz-ink)}
.gr-rate.r20{background:var(--mo-bg);color:var(--mo-ink)}
.gr-rate.r10{background:var(--tm-bg);color:var(--tm-ink)}
.gr-rate.r0{background:var(--surface-3);color:var(--ink-2)}
.gr-rate.none{background:transparent;border:1.5px dashed var(--line-2);color:var(--mut);font-weight:600}
.gr-ast{padding:20px 22px;display:flex;flex-direction:column;gap:14px}
.gr-sugs{display:flex;gap:8px;flex-wrap:wrap}
.gr-sugs .tag{min-height:36px;font-size:14px;padding:0 13px}
.gr-res{border-radius:18px;padding:16px 18px;background:var(--d-bg);color:var(--d-ink);display:grid;grid-template-columns:auto minmax(0,1fr);gap:4px 16px;align-items:center}
.gr-res .rt{font:800 44px/1 var(--f-display);letter-spacing:-.04em;grid-row:span 2}
.gr-res b{font:700 16px/1.3 var(--f-text)}
.gr-res p{font:500 14px/1.45 var(--f-text);opacity:.9;margin:0}
.gr-res .q{grid-column:1/-1;margin-top:10px;display:flex;flex-direction:column;gap:8px}
.gr-res .q .gr-actions .btn{background:var(--surface);color:var(--ink)}
.gr-res .q .gr-actions .btn[aria-pressed="true"]{background:var(--d-ink);color:var(--d-bg)}
.gr-res.empty0{background:var(--surface-2);color:var(--mut)}
.gr-why{white-space:normal;max-width:340px;font-size:14px;line-height:1.4;color:var(--mut)}

/* ----- avis ----- */
.gr-note{display:flex;align-items:center;gap:14px}
.gr-note .gr-k{font-size:56px}
.gr-rv{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px 14px;align-items:start;padding:14px 22px}
.gr-rv+.gr-rv{border-top:1px solid var(--line)}
.gr-rv .tx{font:500 15px/1.45 var(--f-text);color:var(--ink-2);margin-top:4px}
.gr-rv .mt{font:500 13.5px var(--f-text);color:var(--mut);margin-top:4px}
.gr-rv.hot{background:color-mix(in srgb,var(--cr-bg) 55%,transparent)}
.gr-phone{width:300px;max-width:100%;margin:0 auto;border-radius:38px;padding:12px;background:var(--navy);box-shadow:var(--shadow-2)}
.gr-scr{border-radius:28px;background:var(--surface);color:var(--ink);overflow:hidden;min-height:430px;display:flex;flex-direction:column}
.gr-scr .bar0{height:30px;display:flex;align-items:center;justify-content:center}
.gr-scr .bar0 i{width:84px;height:22px;border-radius:12px;background:var(--navy)}
.gr-sms{margin:10px 14px;padding:12px 14px;border-radius:18px 18px 18px 6px;background:var(--surface-3);font:500 14px/1.45 var(--f-text)}
.gr-sms small{display:block;color:var(--mut);font-size:13px;margin-bottom:4px}
.gr-pick{padding:6px 18px 18px;display:flex;flex-direction:column;gap:12px;align-items:center;text-align:center;flex:1}
.gr-pick h4{font:800 20px/1.15 var(--f-display);letter-spacing:-.02em}
.gr-pick .row{display:flex;gap:4px}
.gr-pick .row button{width:42px;height:42px;display:grid;place-items:center;border-radius:12px;transition:transform .35s var(--e-spring)}
.gr-pick .row button:hover{transform:scale(1.15)}
.gr-pick .row .gr-star{width:32px;height:32px}
.gr-pick p{font-size:14px;line-height:1.45;color:var(--mut)}
.gr-flow{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:14px}
.gr-flow>div{border-radius:16px;padding:12px 14px;font:500 14px/1.4 var(--f-text)}
.gr-flow b{display:block;font-weight:700;margin-bottom:2px}

/* ----- cartes cadeaux ----- */
.gr-hero{padding:24px 26px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px;align-items:center;overflow:hidden}
.gr-hero h2{font:800 30px/1.08 var(--f-display);letter-spacing:-.03em}
.gr-hero p{font:500 15px/1.45 var(--f-text);opacity:.85;margin-top:8px;max-width:520px}
.gr-hero .illu{width:150px;height:150px}
.gr-url{display:inline-flex;align-items:center;gap:8px;height:38px;padding:0 14px;border-radius:12px;background:color-mix(in srgb,var(--navy-ink) 12%,transparent);font:500 14px var(--f-mono);margin-top:14px;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.gr-gc{display:inline-flex;flex-direction:column;justify-content:space-between;width:100%;aspect-ratio:1.6;max-width:340px;border-radius:20px;padding:18px 20px;background:linear-gradient(135deg,var(--d),color-mix(in srgb,var(--d) 55%,var(--navy)));color:var(--on-acc);box-shadow:var(--shadow-2);position:relative;overflow:hidden}
.gr-gc::after{content:'';position:absolute;right:-40px;top:-40px;width:160px;height:160px;border-radius:50%;background:color-mix(in srgb,var(--on-acc) 14%,transparent)}
.gr-gc b{font:800 30px/1 var(--f-display);letter-spacing:-.03em}
.gr-gc span{font:600 14px var(--f-text);opacity:.92}
.gr-gc .c{font:500 14px var(--f-mono);letter-spacing:.06em}
.gr-check{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:10px}
.gr-ref{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:6px}
.gr-ref>div{border-radius:14px;padding:10px 12px;background:var(--surface-2);font:500 13.5px/1.35 var(--f-text);color:var(--mut)}
.gr-ref>div b{display:block;font:800 22px/1.1 var(--f-display);color:var(--ink);letter-spacing:-.02em}

/* ----- satisfaction ----- */
.gr-coach{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px 14px;align-items:center;padding:10px 0}
.gr-coach .bar{height:10px}
.gr-coach b{font-variant-numeric:tabular-nums;font:800 20px var(--f-display);letter-spacing:-.02em}
.gr-sv{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:14px;align-items:center;padding:14px 22px;text-align:left;width:100%;transition:background var(--t-2)}
.gr-sv:hover{background:var(--surface-2)}
.gr-sv+.gr-sv{border-top:1px solid var(--line)}
.gr-sv .t{font:650 15.5px/1.3 var(--f-text)}
.gr-sv .s{font:500 14px var(--f-text);color:var(--mut);margin-top:3px}
.gr-q{border-radius:16px;padding:14px 16px;background:var(--surface-2);display:flex;flex-direction:column;gap:8px}
.gr-q b{font-weight:650}
.gr-hist{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:6px 10px;align-items:center;font:500 14px var(--f-text)}

/* ----- rapporté ----- */
.gr-sum{padding:26px 28px;display:flex;flex-direction:column;gap:6px;overflow:hidden}
.gr-sum .gr-k{font-size:64px}
.gr-sum .illu{position:absolute;right:-10px;top:-10px;width:170px;height:170px;opacity:.95;pointer-events:none}
.gr-sum .lab{font:600 15px var(--f-text);opacity:.85;display:flex;align-items:center;gap:8px}
.gr-sum .tm{display:flex;gap:26px;flex-wrap:wrap;margin-top:16px}
.gr-sum .tm div{font:500 14px var(--f-text);opacity:.85}
.gr-sum .tm b{display:block;font:800 28px/1.1 var(--f-display);letter-spacing:-.03em;opacity:1}
.gr-line{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:4px 14px;align-items:center;padding:14px 22px}
.gr-line+.gr-line{border-top:1px solid var(--line)}
.gr-line .t{font:650 15.5px/1.3 var(--f-text)}
.gr-line .v{font:800 22px var(--f-display);letter-spacing:-.02em;font-variant-numeric:tabular-nums;white-space:nowrap;text-align:right}
.gr-line .c{grid-column:2/-1;font:500 14px/1.45 var(--f-text);color:var(--mut)}
.gr-line .c code{font:500 13.5px var(--f-mono);color:var(--ink-2);background:var(--surface-2);padding:1px 6px;border-radius:6px}
.gr-line.hr0 .v{color:var(--tm-ink)}

/* ----- site ----- */
.gr-ed{display:grid;grid-template-columns:360px minmax(0,1fr);gap:16px;align-items:start}
.gr-pane{padding:18px 18px 20px;display:flex;flex-direction:column;gap:16px}
.gr-pane h4{font:700 15px var(--f-text);color:var(--ink-2);margin-bottom:-6px}
.gr-addr{display:flex;align-items:center;border-radius:14px;box-shadow:inset 0 0 0 1px var(--line-2);overflow:hidden;height:46px}
.gr-addr input{border:0;outline:0;background:transparent;height:100%;padding:0 4px 0 14px;font:600 15px var(--f-text);color:var(--ink);min-width:0;flex:1;text-align:right}
.gr-addr span{padding-right:14px;color:var(--mut);font:500 15px var(--f-text);white-space:nowrap}
.gr-sw{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
.gr-sw button{width:30px;height:30px;border-radius:50%;background:var(--c);box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--ink) 10%,transparent);transition:transform .35s var(--e-spring)}
.gr-sw button[aria-pressed="true"]{box-shadow:0 0 0 3px var(--surface),0 0 0 5px var(--c)}
.gr-sw button:hover{transform:scale(1.1)}
.gr-sw label{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;box-shadow:inset 0 0 0 1.5px var(--line-2);cursor:pointer;position:relative;color:var(--mut)}
.gr-sw label input{position:absolute;inset:0;opacity:0;cursor:pointer}
.gr-secs{display:flex;flex-direction:column;gap:4px}
.gr-sec{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;gap:8px;align-items:center;padding:6px 4px 6px 8px;border-radius:12px;transition:background var(--t-2)}
.gr-sec:hover{background:var(--surface-2)}
.gr-sec span{font:600 14.5px var(--f-text)}
.gr-sec .btn.icon.sm{width:32px;height:32px}
.gr-sec .tog{transform:scale(.85);transform-origin:right center}
.gr-sec.off span{color:var(--mut)}
.gr-hours{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:8px}
.gr-hours .in{height:40px;font-size:14.5px}
.gr-prev{display:flex;flex-direction:column;gap:12px;min-width:0}
.gr-browser{border-radius:18px;box-shadow:inset 0 0 0 1px var(--line),var(--shadow-2);overflow:hidden;background:var(--surface)}
.gr-bbar{display:flex;align-items:center;gap:10px;height:42px;padding:0 14px;background:var(--surface-2);border-bottom:1px solid var(--line)}
.gr-bbar i{width:11px;height:11px;border-radius:50%;background:var(--line-2)}
.gr-bbar span{flex:1;height:28px;border-radius:9px;background:var(--surface);display:flex;align-items:center;gap:6px;padding:0 12px;font:500 13.5px var(--f-text);color:var(--mut);min-width:0;overflow:hidden;white-space:nowrap}
.gr-bbar span svg.i{width:15px;height:15px;flex:none}
.gr-frame{height:560px;overflow:auto;scroll-behavior:smooth}
.gr-pwrap{display:flex;justify-content:center}
.gr-pwrap .gr-phone{width:340px}
.gr-pwrap .gr-scr{height:600px;min-height:0;overflow:auto}
.gr-site{container:gsite/inline-size;--sc:var(--acc);color:var(--ink);background:var(--surface);font:500 15px/1.5 var(--f-text)}
.gs-nav{display:flex;align-items:center;gap:12px;padding:14px 26px;position:sticky;top:0;background:color-mix(in srgb,var(--surface) 92%,transparent);backdrop-filter:blur(8px);z-index:2;border-bottom:1px solid var(--line)}
.gs-logo{width:36px;height:36px;border-radius:11px;background:var(--sc);color:var(--on-acc);display:grid;place-items:center;font:800 15px var(--f-display);flex:none}
.gs-nav b{font:800 17px var(--f-display);letter-spacing:-.02em;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.gs-links{display:flex;gap:18px;font:600 14px var(--f-text);color:var(--mut)}
.gs-cta{display:inline-flex;align-items:center;gap:8px;height:42px;padding:0 18px;border-radius:12px;background:var(--sc);color:var(--on-acc);font:700 14.5px var(--f-text);white-space:nowrap;flex:none}
.gs-cta.alt{background:transparent;color:var(--ink);box-shadow:inset 0 0 0 1.5px var(--line-2)}
.gs-hero{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1fr);gap:26px;align-items:center;padding:40px 26px 34px;background:linear-gradient(160deg,color-mix(in srgb,var(--sc) 14%,var(--surface)),var(--surface) 70%)}
.gs-hero h1{font:800 40px/1.04 var(--f-display);letter-spacing:-.035em}
.gs-hero p{font:500 16px/1.5 var(--f-text);color:var(--mut);margin:12px 0 20px}
.gs-hero .ph0{aspect-ratio:4/3;border-radius:22px;background:color-mix(in srgb,var(--sc) 18%,var(--surface-2));display:grid;place-items:center;overflow:hidden}
.gs-hero .ph0 img{width:100%;height:100%;object-fit:cover}
.gs-hero .ph0 .illu{width:72%;height:72%}
.gs-badges{display:flex;gap:16px;flex-wrap:wrap;margin-top:20px;font:600 14px var(--f-text);color:var(--ink-2)}
.gs-badges span{display:inline-flex;align-items:center;gap:6px}
.gs-badges .gr-star{width:16px;height:16px}
.gs-s{padding:30px 26px;border-top:1px solid var(--line)}
.gs-s h2{font:800 26px/1.1 var(--f-display);letter-spacing:-.03em;margin-bottom:16px}
.gs-g{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px}
.gs-c{border-radius:18px;padding:16px;background:var(--surface-2);display:flex;flex-direction:column;gap:6px;min-width:0}
.gs-c b{font:700 15.5px/1.3 var(--f-text)}
.gs-c small{color:var(--mut);font-size:13.5px;line-height:1.4}
.gs-c .p{font:800 22px var(--f-display);color:var(--sc);letter-spacing:-.02em;margin-top:auto}
.gs-pl{display:flex;flex-direction:column}
.gs-pl>div{display:grid;grid-template-columns:110px minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}
.gs-pl>div:last-child{border-bottom:0}
.gs-pl small{font-size:13px}
.gs-pl .gs-cta{height:36px;padding:0 14px;font-size:13.5px}
.gs-gal{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:10px}
.gs-gal>div{aspect-ratio:1;border-radius:16px;overflow:hidden;background:color-mix(in srgb,var(--sc) 12%,var(--surface-2));display:grid;place-items:center}
.gs-gal img{width:100%;height:100%;object-fit:cover}
.gs-gal .illu{width:70%;height:70%}
.gs-q{border-radius:18px;padding:16px;background:var(--surface-2);font:500 15px/1.5 var(--f-text)}
.gs-q small{display:block;margin-top:8px;color:var(--mut);font-size:13.5px}
.gs-ha{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:18px}
.gs-hr{display:flex;justify-content:space-between;gap:10px;padding:8px 0;border-bottom:1px solid var(--line);font-size:15px}
.gs-map{border-radius:18px;min-height:180px;background:repeating-linear-gradient(45deg,var(--surface-2) 0 14px,var(--surface-3) 14px 28px);display:grid;place-items:center;color:var(--sc)}
.gs-map svg.i{width:40px;height:40px}
.gs-foot{padding:20px 26px;font-size:13.5px;color:var(--mut);display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;border-top:1px solid var(--line);background:var(--surface-2)}
@container gsite (max-width:620px){.gs-links{display:none}.gs-nav{padding:12px 16px}.gs-hero{grid-template-columns:minmax(0,1fr);padding:26px 16px 24px}.gs-hero h1{font-size:30px}.gs-s{padding:24px 16px}.gs-g{grid-template-columns:minmax(0,1fr)}.gs-gal{grid-template-columns:repeat(2,minmax(0,1fr))}.gs-ha{grid-template-columns:minmax(0,1fr)}.gs-pl>div{grid-template-columns:76px minmax(0,1fr) auto}.gs-nav .gs-cta{height:38px;padding:0 12px;font-size:13.5px}.gs-foot{padding:16px}}
.gr-code{font:500 13.5px/1.55 var(--f-mono);background:var(--surface-2);border-radius:14px;padding:14px 16px;white-space:pre-wrap;word-break:break-all;color:var(--ink-2);box-shadow:inset 0 0 0 1px var(--line)}

/* ----- adhérent ----- */
.gr-adh{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.gr-adh .card{display:flex;flex-direction:column;gap:12px}
.gr-big-code{font:800 30px/1 var(--f-display);letter-spacing:.02em}
.gr-q2{display:flex;flex-direction:column;gap:6px}
.gr-q2 .row{display:flex;gap:2px}
.gr-q2 .row button{width:44px;height:44px;display:grid;place-items:center;border-radius:12px}
.gr-q2 .row .gr-star{width:30px;height:30px}

@container main (max-width:1180px){.gr-top3{grid-template-columns:repeat(2,minmax(0,1fr))}.gr-kinds{grid-template-columns:repeat(2,minmax(0,1fr))}.gr-ed{grid-template-columns:320px minmax(0,1fr)}}
@container main (max-width:1000px){.gr-top,.gr-two{grid-template-columns:minmax(0,1fr)}.gr-ed{grid-template-columns:minmax(0,1fr)}.gr-frame{height:520px}}
@container main (max-width:760px){.gr-hero{grid-template-columns:minmax(0,1fr)}.gr-hero .illu{display:none}.gr-ref{grid-template-columns:repeat(2,minmax(0,1fr))}.gr-adh{grid-template-columns:minmax(0,1fr)}.gr-sum .gr-k{font-size:50px}.gr-sum .illu{width:120px;height:120px}}
@container main (max-width:560px){.gr-top3{grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}.gr-top3:not(.gr-k2)>:first-child{grid-column:1/-1}.gr-prev{order:-1}.gr-kinds{grid-template-columns:minmax(0,1fr)}.gr-pipe{grid-template-columns:minmax(0,1fr)}.gr-step+.gr-step::before{display:none}.gr-camp{padding:18px}.gr-camp h2{font-size:22px}.gr-k{font-size:32px}.gr-vat .rt{font-size:42px}.gr-rv{padding:14px 18px;grid-template-columns:auto minmax(0,1fr)}.gr-rv>.r0{grid-column:2}.gr-line{padding:14px 18px}.gr-line .v{font-size:19px}.gr-sv{padding:14px 18px}.gr-flow{grid-template-columns:minmax(0,1fr)}.gr-hero{padding:20px}.gr-hero h2{font-size:24px}.gr-note .gr-k{font-size:46px}.gr-res .rt{font-size:36px}.gr-sum{padding:22px}.gr-pwrap .gr-phone{width:100%}.gr-frame{height:460px}}
`);

/* =====================================================================
   1. Aides et réductions
   ===================================================================== */
var KINDS={
  passsport:{t:'Pass’Sport',s:'50 € par enfant de 6 à 17 ans',payer:'Le Compte Asso',icon:'ticket',dom:'rd',steps:['Déduit','Déclaré','Remboursé'],how:'Le code est déduit à l’inscription, déclaré sur Le Compte Asso, puis remboursé au club par virement.'},
  coupon:{t:'Coupon sport ANCV',s:'Coupons papier, souvent offerts par le CSE',payer:'ANCV',icon:'ticket',dom:'mo',steps:['Encaissé','Envoyé à l’ANCV','Payé'],how:'Gardez les coupons, envoyez-les à l’ANCV avec le bordereau : l’ANCV paie le club.'},
  ancv:{t:'Chèques-vacances ANCV',s:'Papier ou Chèque-Vacances Connect',payer:'ANCV',icon:'wallet',dom:'mo',steps:['Encaissé','Remis à l’ANCV','Payé'],how:'Les chèques sont regroupés sur un bordereau de remise, l’ANCV paie le club.'},
  caf:{t:'Aide CAF aux loisirs',s:'Selon le quotient familial',payer:'CAF',icon:'family',dom:'tm',steps:['Déduite','Attestation envoyée','Payée'],how:'Remplissez l’attestation de la famille : la CAF paie directement le club.'},
  cse:{t:'Participation du CSE',s:'Comité social de l’employeur',payer:'CSE',icon:'bank',dom:'pf',steps:['Déduite','Facture envoyée','Payée'],how:'Envoyez au CSE la facture au nom du salarié : il règle sa part au club.'},
  mairie:{t:'Aide de la mairie',s:'Aide sport communale',payer:'Mairie',icon:'pin',dom:'hz',steps:['Déduite','Dossier envoyé','Payée'],how:'Transmettez la liste des enfants inscrits à la mairie, qui verse l’aide au club.'}
};
var STI={deduit:0,declare:1,rembourse:2};
var AIDCFG={ps:{from:'2026-09-01',to:'2026-12-31',amount:50},fam2:10,fam3:15,accept:{passsport:true,coupon:true,ancv:true,caf:true,cse:true,mairie:true},onInvoice:true};
function aids(k){return arr('aids').filter(function(a){return !k||a.kind===k})}
function sum(l){return l.reduce(function(s,a){return s+(+a.amount||0)},0)}
function dots(st,lbl){var n=STI[st]||0,h='<span class="gr-dots">';for(var i=0;i<3;i++){if(i)h+='<b class="'+(i<=n?'on':'')+'"></b>';h+='<i class="'+(i<=n?'on':'')+'"></i>'}return h+(lbl?'<span>'+lbl+'</span>':'')+'</span>'}
/* remises famille : sur les forfaits à l'année, le 2e cavalier paie moins, le 3e encore moins */
function famDiscounts(c){var by={},out=[];D.members.forEach(function(m){var f=forf(m.forfait);if(!f||!f.price||f.kind==='carte'||f.kind==='demi'||f.kind==='proprio')return;(by[m.fam]=by[m.fam]||[]).push({m:m,f:f})});
  Object.keys(by).forEach(function(k){var l=by[k];if(l.length<2)return;l.sort(function(a,b){return b.f.price-a.f.price});var lines=l.map(function(x,i){var r=i===0?0:i===1?c.fam2:c.fam3;return {m:x.m,f:x.f,r:r,v:Math.round(x.f.price*r)/100}});
    out.push({fam:k,name:l[0].m.last,lines:lines,total:lines.reduce(function(s,x){return s+x.v},0)})});
  return out.sort(function(a,b){return b.total-a.total})}
function invSample(c){var fd=famDiscounts(c),ps=aids('passsport'),best=null;
  ps.forEach(function(a){fd.forEach(function(f){var i=-1;f.lines.forEach(function(l,k){if(l.m.id===a.member)i=k});if(i<0)return;var sc=f.lines[i].r>0?2:1;if(!best||sc>best.sc)best={sc:sc,f:f,i:i,a:a}})});
  if(best){var l=best.f.lines[best.i];return {who:l.m,lines:[[l.f.name+', '+l.m.first,l.f.price]],rem:l.r?[['Remise famille, '+(best.i+1)+'e cavalier ('+l.r+NB+'%)',l.v]]:[],aid:[['Pass’Sport, payé par l’État',best.a.amount]]}}
  var a=ps[0],m=a&&mem(a.member),ff=m&&forf(m.forfait);if(m&&ff)return {who:m,lines:[[ff.name+', '+m.first,ff.price]],rem:[],aid:[['Pass’Sport, payé par l’État',a.amount]]};
  var f=fd[0];if(!f)return null;var l2=f.lines[1];return {who:l2.m,lines:[[l2.f.name+', '+l2.m.first,l2.f.price]],rem:[['Remise famille, 2e cavalier ('+l2.r+NB+'%)',l2.v]],aid:[]}}
function invHTML(s,title){if(!s)return '<div class="gr-inv">'+U.empty('invoice','La facture d’exemple apparaîtra ici','Dès qu’une aide ou une remise est appliquée à une inscription.')+'</div>';
  var tot=s.lines.reduce(function(a,l){return a+l[1]},0)-s.rem.reduce(function(a,l){return a+l[1]},0),ad=s.aid.reduce(function(a,l){return a+l[1]},0);
  return '<div class="gr-inv"><div class="hd"><div><div class="eyebrow">'+(title||'Ce que voit la famille')+'</div><div class="gr-h" style="margin-top:6px">Facture de la famille '+E(s.who.last)+'</div></div><span class="ico sm">'+ICON('invoice','sm')+'</span></div>'+
    s.lines.map(function(l){return '<div class="gr-il"><span>'+E(l[0])+'</span><b>'+eur(l[1])+'</b></div>'}).join('')+
    s.rem.map(function(l){return '<div class="gr-il minus"><span>'+E(l[0])+'</span><b>−'+NB+eur(l[1])+'</b></div>'}).join('')+
    '<div class="gr-il"><span>Total TTC <small>dont TVA à 5,5'+NB+'% : '+eur(Math.round(tot/1.055*0.055*100)/100)+'</small></span><b>'+eur(tot)+'</b></div>'+
    s.aid.map(function(l){return '<div class="gr-il aid"><span>Déjà réglé : '+E(l[0])+'<small>Le club se fait rembourser, la famille n’avance rien.</small></span><b>−'+NB+eur(l[1])+'</b></div>'}).join('')+
    '<div class="gr-il tot"><span>Reste à payer</span><b>'+eur(tot-ad)+'</b></div></div>'}

var AS={tab:'ps'};
P.mod({id:'aides',role:'gerant',group:'Finances',n:15,title:'Aides',icon:'percent',phoneTitle:'Aides',dom:'mo',
 badge:function(){var n=aids('passsport').filter(function(a){return a.status==='deduit'}).length;return n?{v:n}:null},
 render:function(el,ctx){var c=cfg('aides',AIDCFG),ps=aids('passsport');
  var by={deduit:[],declare:[],rembourse:[]};ps.forEach(function(a){(by[a.status]||by.deduit).push(a)});
  var t=tIso(),span=daysBetween(c.ps.from,c.ps.to),done=Math.max(0,Math.min(span,daysBetween(c.ps.from,t))),left=Math.max(0,daysBetween(t,c.ps.to)),open=t>=c.ps.from&&t<=c.ps.to;
  var others=aids().filter(function(a){return a.kind!=='passsport'}),waiting=aids().filter(function(a){return a.status!=='rembourse'}),fd=famDiscounts(c);
  var acts='<button class="btn" data-new>'+ICON('plus','sm')+'Inscrire avec des aides</button><button class="btn pri" data-decl'+(by.deduit.length?'':' disabled')+'>'+ICON('send','sm')+(by.deduit.length?'Déclarer '+pl(by.deduit.length,'code'):'Tous les codes sont déclarés')+'</button>';
  el.innerHTML=U.ph('Aides et réductions','Pass’Sport, ANCV, CAF, CSE, mairie et remise famille : déduits à l’inscription, suivis jusqu’au remboursement.',acts)+
   '<div class="gr-top rise">'+
    '<div class="card tint d-rd gr-camp"><div class="gr-row sp wrap"><div><div class="eyebrow" style="color:inherit;opacity:.8">Campagne '+c.ps.from.slice(0,4)+'</div><h2 style="margin-top:6px">Pass’Sport : '+pl(ps.length,'enfant')+', '+eur(sum(ps))+' déduits</h2></div>'+
      '<a class="btn sm" href="https://lecompteasso.associations.gouv.fr" target="_blank" rel="noopener" title="Le site où le club déclare les codes">'+ICON('ext','sm')+'Le Compte Asso</a></div>'+
     '<div><div class="gr-tline" style="--v:'+(done/span*100).toFixed(1)+'%"><i></i><b>'+(open?'Aujourd’hui · encore '+pl(left,'jour'):t<c.ps.from?'Ouverture le '+F.date(c.ps.from):'Campagne terminée')+'</b></div><div class="gr-tl-l"><span>'+F.dateY(c.ps.from)+'</span><span>Codes à déclarer avant le '+F.dateY(c.ps.to)+'</span></div></div>'+
     '<div class="gr-pipe">'+[['deduit','1','Déduits','à déclarer'],['declare','2','Déclarés','en attente du virement'],['rembourse','3','Remboursés','sur le compte du club']].map(function(s){var l=by[s[0]];
        return '<div class="gr-step'+(s[0]==='deduit'&&l.length?' on':'')+'"><div class="l"><i>'+s[1]+'</i>'+s[2]+'</div><div class="n num"><span data-count="'+sum(l)+'" data-fmt="eur">'+eur(sum(l))+'</span></div><div class="s">'+pl(l.length,'code')+' '+s[3]+'</div></div>'}).join('')+'</div></div>'+
    '<div class="card">'+invHTML(invSample(c))+'</div></div>'+
   '<div class="gr-row sp wrap" style="margin:6px 0 14px">'+U.seg([['ps','Pass’Sport'],['other','Autres aides · '+others.length],['fam','Remise famille · '+fd.length],['rules','Règles']],AS.tab,'data-atab')+
    '<span class="mut s">'+(waiting.length?pl(waiting.length,'aide')+' en attente de paiement, '+eur(sum(waiting))+' au total':'Toutes les aides sont payées')+'</span></div><div data-abody></div>';
  var body=$('[data-abody]',el);
  function draw(anim){var h='';
   if(AS.tab==='ps'){
    if(!ps.length)h=U.empty('ticket','Aucun code Pass’Sport pour l’instant','Saisissez le code d’un enfant de 6 à 17 ans à son inscription : les 50 € sont déduits et suivis jusqu’au remboursement.','<button class="btn pri" data-new>'+ICON('plus','sm')+'Inscrire avec des aides</button>');
    else h=U.table([{l:'Enfant',f:function(a){var m=mem(a.member);return '<div class="gr-row">'+U.av(a.member,'sm')+'<div><b>'+E(nameOf(a.member))+'</b><div class="xs mut">'+(m&&m.age?m.age+' ans':'')+'</div></div></div>'}},
      {l:'Code',hide:true,f:function(a){return '<span class="gr-mono">'+E(a.code||'')+'</span>'}},
      {l:'Déduit le',hide:true,f:function(a){return F.dateY(a.date)}},{l:'Montant',n:true,f:function(a){return '<b class="num">'+eur(a.amount)+'</b>'}},
      {l:'Suivi',f:function(a){var k=KINDS.passsport;return '<span class="d-rd">'+dots(a.status,k.steps[STI[a.status]]+(a.status==='declare'&&a.declaredAt?' le '+F.date(a.declaredAt):a.status==='rembourse'&&a.paidAt?' le '+F.date(a.paidAt):''))+'</span>'}},
      {l:'',n:true,f:function(a){return a.status==='rembourse'?'<span class="chip ok">'+ICON('check','sm')+'Payé</span>':'<button class="btn sm tint d-rd" data-adv="'+a.id+'">'+(a.status==='deduit'?'Marquer déclaré':'Marquer remboursé')+'</button>'}}],
      ps.slice().sort(function(a,b){return STI[a.status]-STI[b.status]||(a.date<b.date?1:-1)}),{key:'id'})+
     '<div class="gr-row wrap" style="margin-top:12px"><button class="btn sm" data-csv>'+ICON('download','sm')+'Exporter la liste (Excel)</button>'+(by.declare.length?'<button class="btn sm" data-wire>'+ICON('bank','sm')+'Pointer un virement du Compte Asso</button>':'')+'<span class="xs mut">Le fichier reprend les colonnes demandées par Le Compte Asso : nom, prénom, code, montant.</span></div>';
   }else if(AS.tab==='other'){
    h='<div class="gr-kinds rise">'+Object.keys(KINDS).filter(function(k){return k!=='passsport'}).map(function(k){var K=KINDS[k],l=aids(k),w=l.filter(function(a){return a.status!=='rembourse'});
      return '<div class="card gr-kind d-'+K.dom+'"><div class="hd"><span class="ico">'+ICON(K.icon)+'</span><div class="grow"><b>'+K.t+'</b><small>'+K.s+'</small></div>'+(c.accept[k]?'':'<span class="chip line">Non accepté</span>')+'</div>'+
       '<div class="gr-row sp"><div class="v num">'+eur(sum(l))+'</div><span class="chip '+(w.length?'warn':'ok')+'">'+(l.length?(w.length?pl(w.length,'en attente','en attente'):'Tout est payé'):'Aucune')+'</span></div>'+
       '<p>'+K.how+'</p>'+(l.length?'<div class="stack" style="--g:6px">'+l.slice(0,3).map(function(a){return '<div class="gr-row sp"><span class="s ellip">'+E(nameOf(a.member))+(a.ref?' · '+E(a.ref):'')+'</span><span class="d-'+K.dom+'">'+dots(a.status)+'</span></div>'}).join('')+'</div>':'')+
       '<div class="gr-actions" style="margin-top:auto"><button class="btn sm" data-add="'+k+'">'+ICON('plus','sm')+'Ajouter</button>'+(w.length?'<button class="btn sm tint" data-next="'+k+'">'+ICON('check','sm')+K.steps[Math.min(2,STI[w[0].status]+1)]+' ('+w.length+')</button>':'')+'</div></div>'}).join('')+'</div>';
   }else if(AS.tab==='fam'){
    var tot=fd.reduce(function(s,f){return s+f.total},0);
    h='<div class="gr-two"><div class="card"><div class="ch"><h3>Familles concernées</h3><span class="mut">'+pl(fd.length,'famille')+' · '+eur(tot)+' de remise sur l’année</span></div>'+
     (fd.length?'<div class="list gr-fams gr-scroll" style="max-height:380px">'+fd.map(function(f){return '<div class="li"><span class="ico sm d-rd">'+ICON('family','sm')+'</span><div class="grow"><div class="t">Famille '+E(f.name)+'</div><div class="s">'+f.lines.map(function(l){return E(l.m.first)+(l.r?' −'+l.r+NB+'%':'')}).join(' · ')+'</div></div><div class="r"><b>−'+NB+eur(f.total)+'</b></div></div>'}).join('')+'</div>':'<div class="cb">'+U.empty('family','Aucune famille avec plusieurs cavaliers','La remise s’appliquera seule dès qu’un deuxième membre de la famille prendra un forfait.')+'</div>')+'</div>'+
     '<div class="card pad"><div class="gr-h">Comment c’est calculé</div><p class="mut" style="margin:8px 0 14px;line-height:1.5">Stabl regroupe les cavaliers par famille (même compte de facturation). Le forfait le plus cher est payé plein tarif, la remise s’applique aux suivants, sur les forfaits à l’année et au trimestre. Les cartes de séances n’ont pas de remise.</p>'+
     '<div class="gr-rule"><div><b>Deuxième cavalier</b><small>Sur son forfait</small></div><span class="chip acc lg">−'+c.fam2+NB+'%</span></div><div class="gr-rule"><div><b>Troisième cavalier et suivants</b><small>Sur chaque forfait</small></div><span class="chip acc lg">−'+c.fam3+NB+'%</span></div>'+
     '<button class="btn sm" data-atab2="rules" style="margin-top:10px">'+ICON('sliders','sm')+'Changer les taux</button></div></div>';
   }else{
    h='<div class="gr-two"><div class="card pad"><div class="gr-h">Aides acceptées par le club</div><p class="mut s" style="margin-top:6px">Une aide refusée n’est plus proposée à l’inscription ni dans l’espace des familles.</p>'+
     Object.keys(KINDS).map(function(k){var K=KINDS[k];return '<div class="gr-rule"><div class="gr-row"><span class="ico sm d-'+K.dom+'">'+ICON(K.icon,'sm')+'</span><div><b>'+K.t+'</b><small>'+K.s+' · payé par '+K.payer+'</small></div></div>'+U.tog(!!c.accept[k],'gr-acc-'+k)+'</div>'}).join('')+'</div>'+
     '<div class="card pad"><div class="gr-h">Remise famille et facture</div>'+
     '<div class="gr-rule"><div><b>Deuxième cavalier</b><small>Pourcentage de remise sur son forfait</small></div><input class="in num gr-num" type="number" min="0" max="50" value="'+c.fam2+'" data-f2 aria-label="Remise du deuxième cavalier en pourcentage"></div>'+
     '<div class="gr-rule"><div><b>Troisième cavalier et suivants</b><small>Pourcentage de remise sur chaque forfait</small></div><input class="in num gr-num" type="number" min="0" max="50" value="'+c.fam3+'" data-f3 aria-label="Remise du troisième cavalier en pourcentage"></div>'+
     '<div class="gr-rule"><div><b>Afficher les aides sur la facture</b><small>Ligne « Déjà réglé : Pass’Sport, payé par l’État » et reste à payer</small></div>'+U.tog(!!c.onInvoice,'gr-oninv')+'</div>'+
     '<button class="btn pri" data-saverules style="margin-top:14px">'+ICON('check','sm')+'Enregistrer les règles</button></div></div>';
   }
   if(anim)swap(body,h);else body.innerHTML=h;wire()}
  function wire(){
   on(body,'[data-new]',function(){newSheet()});
   on(body,'[data-adv]',function(b){var a=aids().find(function(x){return x.id===b.getAttribute('data-adv')});if(!a)return;var prev=clone(a);advance(a);P.toast(a.status==='declare'?'Code de '+E(nameOf(a.member))+' déclaré':'Remboursement de '+eur(a.amount)+' pointé',{undo:function(){Object.assign(a,prev);P.rerender(true)}});P.rerender(true)});
   on(body,'[data-csv]',function(){exportPS(ps);P.toast('Liste Pass’Sport téléchargée',{icon:'download'})});
   on(body,'[data-wire]',function(){wireSheet()});
   on(body,'[data-add]',function(b){newSheet(b.getAttribute('data-add'))});
   on(body,'[data-next]',function(b){var k=b.getAttribute('data-next'),w=aids(k).filter(function(a){return a.status!=='rembourse'}),st=w[0].status,l=w.filter(function(a){return a.status===st}),prev=l.map(clone);
     l.forEach(advance);P.toast(pl(l.length,'aide')+' '+KINDS[k].t+' : '+KINDS[k].steps[STI[l[0].status]].toLowerCase(),{undo:function(){l.forEach(function(a,i){Object.assign(a,prev[i])});P.rerender(true)}});P.rerender(true)});
   on(body,'[data-atab2]',function(b){AS.tab=b.getAttribute('data-atab2');$$('[data-atab]',el).forEach(function(x){x.setAttribute('aria-selected',x.getAttribute('data-atab')===AS.tab)});draw(true)});
   on(body,'.tog',function(b){b.setAttribute('aria-checked',b.getAttribute('aria-checked')!=='true')});
   on(body,'[data-saverules]',function(){Object.keys(KINDS).forEach(function(k){var t=$('#gr-acc-'+k,body);if(t)c.accept[k]=t.getAttribute('aria-checked')==='true'});
     var f2=+$('[data-f2]',body).value,f3=+$('[data-f3]',body).value;c.fam2=Math.max(0,Math.min(50,f2||0));c.fam3=Math.max(0,Math.min(50,f3||0));c.onInvoice=$('#gr-oninv',body).getAttribute('aria-checked')==='true';
     P.toast('Règles enregistrées : elles s’appliquent aux prochaines inscriptions');P.rerender(true)});
  }
  on(el,'[data-atab]',function(b){AS.tab=b.getAttribute('data-atab');$$('[data-atab]',el).forEach(function(x){x.setAttribute('aria-selected',x===b)});draw(true)});
  on(el,'.ph [data-new]',function(){newSheet()});
  on(el,'[data-decl]',function(){declare()});
  draw(false);
 }});
function advance(a){if(a.status==='deduit'){a.status='declare';a.declaredAt=tIso()}else if(a.status==='declare'){a.status='rembourse';a.paidAt=tIso()}}
function exportPS(l){dl('pass-sport-'+tIso()+'.csv',csv([['Nom','Prénom','Âge','Code Pass’Sport','Montant','Date de déduction','Statut']].concat(l.map(function(a){var m=mem(a.member)||{};return [m.last,m.first,m.age,a.code,String(a.amount).replace('.',','),a.date,KINDS.passsport.steps[STI[a.status]]]}))),'text/csv;charset=utf-8')}
function declare(){var l=aids('passsport').filter(function(a){return a.status==='deduit'});if(!l.length)return;
  P.sheet({title:'Déclarer sur Le Compte Asso',icon:'send',body:'<div class="stack">'+
   '<p style="line-height:1.5">Stabl prépare la liste des '+pl(l.length,'code')+' à saisir. Le Compte Asso ne propose pas d’envoi automatique : ouvrez-le, collez les codes, puis revenez ici pour les marquer déclarés.</p>'+
   '<div class="card soft" style="padding:6px 0">'+l.map(function(a){return '<div class="li" style="min-height:52px"><div class="grow"><div class="t">'+E(nameOf(a.member))+'</div><div class="s gr-mono">'+E(a.code)+'</div></div><div class="r"><b class="num">'+eur(a.amount)+'</b></div></div>'}).join('')+'</div>'+
   '<div class="note">'+ICON('info','sm')+'<span>Montant attendu : <b>'+eur(sum(l))+'</b>. Le remboursement arrive par virement ; pointez-le ici pour clore le suivi.</span></div></div>',
   foot:'<button class="btn" data-cp>'+ICON('copy','sm')+'Copier les codes</button><button class="btn" data-dl>'+ICON('download','sm')+'Télécharger</button><a class="btn" href="https://lecompteasso.associations.gouv.fr" target="_blank" rel="noopener">'+ICON('ext','sm')+'Ouvrir</a><button class="btn pri" data-ok>'+ICON('check','sm')+'Marquer déclarés</button>'});
  var sh=$('.sheet');on(sh,'[data-cp]',function(){copy(l.map(function(a){return a.code}).join('\n'),pl(l.length,'code')+' copiés')});on(sh,'[data-dl]',function(){exportPS(l);P.toast('Fichier téléchargé',{icon:'download'})});
  on(sh,'[data-ok]',function(){var prev=l.map(clone);l.forEach(advance);sh.close();P.toast(pl(l.length,'code')+' déclarés, '+eur(sum(l))+' attendus',{undo:function(){l.forEach(function(a,i){Object.assign(a,prev[i])});P.rerender(true)}});P.rerender(true)})}
function wireSheet(){var l=aids('passsport').filter(function(a){return a.status==='declare'}).sort(function(a,b){return a.declaredAt<b.declaredAt?-1:1});
  P.sheet({title:'Pointer un virement',icon:'bank',body:'<div class="stack"><p style="line-height:1.5">Saisissez le montant reçu du Compte Asso. Stabl solde les codes déclarés les plus anciens jusqu’à ce montant.</p>'+
   '<label class="field"><span>Montant du virement</span><input class="in num" type="number" min="0" step="50" value="'+sum(l)+'" data-amt></label><div data-out class="note ok"></div></div>',foot:'<button class="btn pri block" data-ok>'+ICON('check','sm')+'Pointer le virement</button>'});
  var sh=$('.sheet'),inp=$('[data-amt]',sh),out=$('[data-out]',sh);function pick(){var v=+inp.value||0,acc=0,sel=[];l.forEach(function(a){if(acc+a.amount<=v+0.001){acc+=a.amount;sel.push(a)}});return sel}
  function upd(){var s=pick();out.innerHTML=ICON('checkc','sm')+'<span>'+(s.length?pl(s.length,'code')+' soldés : '+s.map(function(a){return E(nameOf(a.member))}).join(', ')+'.':'Aucun code ne correspond à ce montant.')+'</span>'}inp.oninput=upd;upd();
  on(sh,'[data-ok]',function(){var s=pick();if(!s.length){P.toast('Aucun code ne correspond à ce montant',{icon:'info'});return}s.forEach(function(a){a.status='rembourse';a.paidAt=tIso()});sh.close();P.toast('Virement pointé : '+pl(s.length,'code')+' remboursés');P.rerender(true)})}
/* inscription avec aides : calcule le reste à payer et crée la facture (démo) ou l'aide (appli) */
function newSheet(kind0){var c=cfg('aides',AIDCFG),members=D.members.filter(function(m){return m.forfait!=='f5'}).slice().sort(function(a,b){return (a.last+a.first).localeCompare(b.last+b.first)});
  var fl=(D.forfaits||[]).filter(function(f){return f.price&&f.kind!=='proprio'});
  if(!members.length||!fl.length){P.toast('Ajoutez d’abord un adhérent et un forfait',{icon:'info'});return}
  var m0=(KIDS.find(function(m){return !aids('passsport').some(function(a){return a.member===m.id})&&fam(m).length>1})||KIDS[0]||members[0]);
  P.sheet({title:kind0?'Ajouter : '+KINDS[kind0].t:'Inscrire avec des aides',icon:'percent',wide:true,body:'<div class="gr-two" style="grid-template-columns:'+(P.isMobile()?'minmax(0,1fr)':'minmax(0,1fr) minmax(0,1fr)')+'"><div class="stack">'+
   '<label class="field"><span>Cavalier</span><select class="in" data-m>'+members.map(function(m){return '<option value="'+m.id+'"'+(m===m0?' selected':'')+'>'+E(m.last+' '+m.first)+(m.age?' · '+m.age+' ans':'')+'</option>'}).join('')+'</select></label>'+
   '<label class="field"><span>Forfait</span><select class="in" data-f>'+fl.map(function(f){return '<option value="'+f.id+'">'+E(f.name)+' · '+eur(f.price)+'</option>'}).join('')+'</select></label>'+
   '<label class="field"><span>Code Pass’Sport</span><input class="in gr-mono" data-ps placeholder="Exemple : PS26-AB12-CD34" autocomplete="off"></label><div data-psn class="xs mut"></div>'+
   '<div class="g2" style="--g:12px">'+Object.keys(KINDS).filter(function(k){return k!=='passsport'&&c.accept[k]}).map(function(k){return '<label class="field"><span>'+KINDS[k].t+'</span><input class="in num" type="number" min="0" step="1" data-k="'+k+'" value="'+(kind0===k?'50':'')+'" placeholder="0 €"></label>'}).join('')+'</div>'+
   '</div><div data-prev class="card"></div></div>',foot:'<button class="btn pri block" data-ok>'+ICON('check','sm')+(LIVE?'Enregistrer les aides':'Créer la facture avec les aides')+'</button>'});
  var sh=$('.sheet');
  function st(){var m=mem($('[data-m]',sh).value),f=forf($('[data-f]',sh).value)||fl[0],code=$('[data-ps]',sh).value.trim(),ok6=m&&m.age>=6&&m.age<=17;
    var sib=fam(m).filter(function(x){var ff=forf(x.forfait);return x.id!==m.id&&ff&&ff.price&&ff.kind!=='carte'&&ff.kind!=='demi'}).length,r=f.kind==='carte'||f.kind==='demi'?0:(sib>=2?c.fam3:sib===1?c.fam2:0);
    var ex=[];if(code&&ok6&&c.accept.passsport)ex.push(['passsport',c.ps.amount,code]);$$('[data-k]',sh).forEach(function(i){var v=+i.value;if(v>0)ex.push([i.getAttribute('data-k'),v,''])});
    return {m:m,f:f,code:code,ok6:ok6,r:r,rem:Math.round(f.price*r)/100,ex:ex}}
  function upd(){var s=st();$('[data-psn]',sh).innerHTML=!s.code?(s.ok6?'Âge éligible : 50 € déduits dès que le code est saisi.':'Le Pass’Sport concerne les enfants de 6 à 17 ans.'):(s.ok6?'<span class="okc">Code accepté : 50 € déduits.</span>':'<span class="badc">'+E(s.m.first)+' a '+s.m.age+' ans : le Pass’Sport ne s’applique pas.</span>');
    $('[data-prev]',sh).innerHTML=invHTML({who:s.m,lines:[[s.f.name+', '+s.m.first,s.f.price]],rem:s.r?[['Remise famille ('+s.r+NB+'%)',s.rem]]:[],aid:s.ex.map(function(x){return [KINDS[x[0]].t+(x[0]==='passsport'?', payé par l’État':''),x[1]]})},'Aperçu de la facture')}
  $$('select,input',sh).forEach(function(i){i.addEventListener('input',upd)});upd();
  on(sh,'[data-ok]',function(){var s=st(),tot=s.f.price-s.rem,list=arr('aids');
    s.ex.forEach(function(x){list.push({id:idx(list,'ai'),kind:x[0],member:s.m.id,amount:x[1],code:x[2]||undefined,ref:x[0]==='passsport'?undefined:KINDS[x[0]].payer,date:tIso(),status:'deduit',declaredAt:null,paidAt:null})});
    if(!LIVE){var n=0;(D.invoices||[]).forEach(function(i){var k=parseInt(String(i.id).split('-').pop(),10);if(k>n)n=k});
      D.invoices.unshift({id:'F-2026-'+(n+1),member:s.m.id,label:s.f.name+(s.rem?', remise famille':'')+(s.ex.length?', aides déduites':''),amount:tot,vat:5.5,date:tIso(),due:addDays(tIso(),14),status:'envoyée',method:'Prélèvement SEPA',aids:s.ex.map(function(x){return {kind:x[0],amount:x[1]}})})}
    sh.close();P.toast(LIVE?pl(s.ex.length||1,'aide')+' enregistrée'+(s.ex.length>1?'s':'')+' pour '+E(s.m.first):'Facture créée : reste à payer '+eur(tot-sum(s.ex.map(function(x){return {amount:x[1]}}))));P.rerender(true)})}

/* =====================================================================
   2. TVA claire
   ===================================================================== */
var BOFIP='https://bofip.impots.gouv.fr/bofip/9265-PGP.html';
var VR={
  cours:{t:'Cours, reprises et stages',r:5.5,why:'Enseignement de l’équitation : le cavalier utilise le cheval pour une activité sportive.'},
  balade:{t:'Balades, baptêmes et randonnées',r:5.5,why:'Utilisation d’un cheval pour une activité physique et sportive.'},
  location:{t:'Demi-pension et location d’un cheval pour le monter',r:5.5,why:'Le cavalier paie le droit de monter un cheval.'},
  acces:{t:'Accès aux installations',r:5.5,why:'Carrières, manège et rond de longe mis à disposition pour monter.'},
  pension:{t:'Pension d’un cheval monté par son propriétaire',r:5.5,why:'Le cheval sert à une activité sportive, par son propriétaire ou un cavalier de son choix.'},
  retraite:{t:'Pension de retraite, de repos ou de valorisation',r:20,why:'Le cheval n’est pas monté : la pension n’est plus liée à une activité sportive.'},
  box:{t:'Location de box sans entretien',r:20,why:'Simple location d’un local, sans soins du cheval ni accès sportif.'},
  travail:{t:'Entraînement, débourrage et dressage du cheval',r:20,why:'Le service porte sur le cheval, pas sur l’enseignement d’un cavalier.'},
  vente:{t:'Sellerie, boutique et vente de chevaux',r:20,why:'Vente de biens au taux normal.'},
  transport:{t:'Transport en concours',r:20,why:'Prestation de transport, au taux normal.'},
  buvette:{t:'Buvette et petite restauration sur place',r:10,why:'Vente à consommer sur place, au taux de la restauration.'},
  licence:{t:'Licence FFE',r:0,why:'Reversée à la fédération : elle n’entre pas dans le chiffre d’affaires soumis à la TVA.'},
  carte:{t:'Carte cadeau à montant libre',r:0,why:'La TVA est due quand la carte est utilisée, au taux de la prestation achetée.'}
};
var VRX=[[/licence/i,'licence'],[/carte cadeau|bon cadeau/i,'carte'],[/caf[ée]|th[ée]\b|chocolat|go[uû]ter|buvette|boisson|repas|sandwich/i,'buvette'],[/transport|camion|\bvan\b/i,'transport'],
  [/sellerie|polo|sweat|tapis|casque|gant|cure-pied|friandise|licol|longe|vente d|vendre/i,'vente'],[/pension travail|d[ée]bourr|dressage du cheval|travail du cheval|entra[iî]nement du cheval|valorisation|commerc/i,'travail'],
  [/retraite|repos|convalescen|pas mont/i,'retraite'],[/box seul|location de box|box nu|box sans/i,'box'],[/demi-pension|location d.un cheval|mise [àa] disposition|louer un cheval/i,'location'],
  [/pension|pr[ée]\b|au pr[ée]/i,'pension'],[/acc[eè]s|installation|carri[eè]re|man[eè]ge/i,'acces'],[/balade|bapt[eê]me|promenade|randonn/i,'balade'],
  [/cours|reprise|stage|forfait|s[ée]ance|carte \d+|le[çc]on|coaching|galop|baby|poney/i,'cours']];
function classify(txt){txt=String(txt||'');for(var i=0;i<VRX.length;i++)if(VRX[i][0].test(txt))return VRX[i][1];return null}
function rateChip(v){if(v==null||v==='')return '<span class="gr-rate none">Non renseigné</span>';var c=v===5.5?'r5':v===20?'r20':v===10?'r10':'r0';return '<span class="gr-rate '+c+'">'+rate(v)+'</span>'}
/* le catalogue du club : tarifs des réglages, formules de pension, boutique */
function catalogue(){var out=[],seen={};function add(o){var k=slug(o.n);if(seen[k])return;seen[k]=1;out.push(o)}
  (D.pfTarifs||[]).forEach(function(t){add({n:t.n,p:t.p,u:t.u,v:t.tva,src:t,key:'tva',from:'Tarifs'})});
  (D.pensionPlans||[]).forEach(function(t){add({n:t.name,p:t.price,u:'par mois',v:t.vat,src:t,key:'vat',from:'Pensions'})});
  (D.shopItems||[]).filter(function(s){return s.cat!=='Sellerie'||/casque|tapis/i.test(s.name)}).forEach(function(t){add({n:t.name,p:t.price,u:'',v:t.vat,src:t,key:'vat',from:'Boutique'})});
  if(!out.length)(D.forfaits||[]).filter(function(f){return f.price}).forEach(function(f){add({n:f.name,p:f.price,u:'',v:f.vat,src:f,key:'vat',from:'Forfaits'})});
  out.forEach(function(o){o.k=classify(o.n);if(o.k==='pension'&&o.src.use==='retraite')o.k='retraite';o.ask=o.k==='pension'&&!o.src.use;o.s=o.k&&!o.ask?VR[o.k].r:null;o.ok=!!o.k&&!o.ask&&o.v!=null&&+o.v===o.s});
  return out.sort(function(a,b){return (a.ok?1:0)-(b.ok?1:0)})}
var TS={q:'',k:null,ridden:null};
function useSheetVat(o){P.sheet({title:o.n,icon:'accounting',body:'<div class="stack"><p style="line-height:1.5">Le taux d’une pension dépend de l’usage du cheval. Choisissez le cas de ce tarif.</p>'+
  '<button class="card pad hover d-hz" data-u="sport" style="text-align:left"><div class="gr-row sp"><b>Le cheval est monté par son propriétaire</b>'+rateChip(5.5)+'</div><div class="s mut" style="margin-top:6px">Ou par un cavalier de son choix, pour une activité sportive.</div></button>'+
  '<button class="card pad hover d-mo" data-u="retraite" style="text-align:left"><div class="gr-row sp"><b>Le cheval est à la retraite ou au repos</b>'+rateChip(20)+'</div><div class="s mut" style="margin-top:6px">Ou en pension de valorisation, sans être monté.</div></button>'+
  (o.key==='tva'&&Array.isArray(D.pfTarifs)?'<div class="note">'+ICON('info','sm')+'<span>Vous avez les deux cas au club ? Créez deux tarifs : la famille choisit le bon à l’inscription.</span></div>':'')+'</div>',
  foot:o.key==='tva'&&Array.isArray(D.pfTarifs)?'<button class="btn block" data-two>'+ICON('plus','sm')+'Créer deux tarifs, 5,5 % et 20 %</button>':''});
  var sh=$('.sheet');on(sh,'[data-u]',function(b){var u=b.getAttribute('data-u');o.src.use=u;o.src[o.key]=u==='sport'?5.5:20;sh.close();P.toast(E(o.n)+' : TVA à '+rate(o.src[o.key]));P.rerender(true)});
  on(sh,'[data-two]',function(){var t=o.src;t.use='sport';t.tva=5.5;var c2=Object.assign({},t,{n:t.n.replace(/^Pension/,'Pension retraite'),use:'retraite',tva:20});if(c2.n===t.n)c2.n=t.n+', cheval à la retraite';D.pfTarifs.splice(D.pfTarifs.indexOf(t)+1,0,c2);sh.close();P.toast('Deux tarifs créés : « '+E(t.n)+' » à 5,5 % et « '+E(c2.n)+' » à 20 %');P.rerender(true)})}
P.mod({id:'tva',role:'gerant',group:'Finances',n:40,title:'TVA claire',icon:'accounting',phoneTitle:'TVA',dom:'mo',
 badge:function(){var n=catalogue().filter(function(o){return o.k&&!o.ok}).length;return n?{v:n}:null},
 render:function(el){var cat=catalogue(),bad=cat.filter(function(o){return o.k&&!o.ok}),fixable=bad.filter(function(o){return !o.ask});
  function lst(keys,ic){return '<ul>'+keys.map(function(k){return '<li>'+ICON(ic,'sm')+'<span>'+VR[k].t+'</span></li>'}).join('')+'</ul>'}
  el.innerHTML=U.ph('TVA claire','Deux taux pour un centre équestre. Stabl classe chaque prestation et vous dit pourquoi, source officielle à l’appui.',
    '<button class="btn" data-grid>'+ICON('download','sm')+'Télécharger la grille</button>'+(fixable.length?'<button class="btn pri" data-fixall>'+ICON('check','sm')+'Corriger '+pl(fixable.length,'tarif')+'</button>':''))+
   '<div class="gr-top3 gr-vat3 rise">'+
    '<div class="card tint d-hz gr-vat"><div class="gr-row sp"><div class="rt num">5,5'+NB+'%</div><span class="chip" style="background:var(--surface);color:inherit">Taux réduit</span></div><b style="font-size:16px">Ce que fait un cavalier</b>'+lst(['cours','balade','location','acces','pension'],'check')+'<a class="gr-src" href="'+BOFIP+'" target="_blank" rel="noopener">'+ICON('ext','sm')+'BOFiP, BOI-TVA-SECT-80-10-30-50</a></div>'+
    '<div class="card tint d-mo gr-vat"><div class="gr-row sp"><div class="rt num">20'+NB+'%</div><span class="chip" style="background:var(--surface);color:inherit">Taux normal</span></div><b style="font-size:16px">Ce qui ne sert pas à monter</b>'+lst(['retraite','box','travail','vente','transport'],'check')+'<a class="gr-src" href="'+BOFIP+'" target="_blank" rel="noopener">'+ICON('ext','sm')+'BOFiP, BOI-TVA-SECT-80-10-30-50</a></div>'+
    '<div class="card gr-vat hors"><div class="rt">Autres cas</div><ul><li>'+rateChip(10)+'<span>Buvette et goûters sur place</span></li><li>'+rateChip(0)+'<span>Licence FFE, reversée à la fédération</span></li><li>'+rateChip(0)+'<span>Carte cadeau à montant libre : TVA à l’utilisation</span></li></ul>'+
     '<p class="xs mut" style="line-height:1.45">Une association à gestion désintéressée peut être exonérée : demandez à votre comptable.</p></div></div>'+
   '<div class="gr-two"><div class="card"><div class="ch"><h3>Vos tarifs, vérifiés</h3>'+(bad.length?U.chip(pl(bad.length,'tarif')+' à vérifier','warn',true):U.chip('Tous les taux sont bons','ok',true))+'</div><div class="cb" style="padding:10px 0 0">'+
    (cat.length?'<div class="gr-scroll">'+U.table([{l:'Prestation',f:function(o){return '<b>'+E(o.n)+'</b><div class="xs mut">'+E(o.from)+(o.p?' · '+eur(o.p)+(o.u?' '+E(o.u):''):'')+'</div>'+(o.ok||!o.k?'':'<div class="xs warnc" style="margin-top:2px;white-space:normal">'+(o.ask?'Le cheval est-il monté ou à la retraite ?':E(VR[o.k].t))+'</div>')}},{l:'Actuel',f:function(o){return rateChip(o.v)}},
      {l:'Conseillé',f:function(o){return o.ask?'<span class="gr-rate none">5,5 ou 20'+NB+'%</span>':o.k?rateChip(o.s):'<span class="xs mut">À classer</span>'}},
      {l:'',n:true,f:function(o){return o.ok?'<span class="chip ok">'+ICON('check','sm')+'Bon</span>':o.ask?'<button class="btn sm" data-use="'+E(o.n)+'">Préciser</button>':o.k?'<button class="btn sm tint" data-fix="'+E(o.n)+'" title="Passer à '+rate(o.s)+'">Corriger</button>':'<button class="btn sm" data-ask="'+E(o.n)+'">Classer</button>'}}],cat,{card:false})+'</div>':U.empty('accounting','Aucun tarif pour l’instant','Ajoutez vos tarifs dans les réglages : Stabl vérifie chaque taux.'))+'</div></div>'+
    '<div class="card gr-ast"><div class="gr-row"><span class="ico">'+ICON('assistant')+'</span><div><div class="gr-h">Quel taux pour cette prestation ?</div><div class="s mut" style="margin-top:2px">Décrivez-la en quelques mots.</div></div></div>'+
     '<div class="search">'+ICON('search','sm')+'<input class="in" data-q placeholder="Exemple : pension d’un cheval à la retraite" value="'+E(TS.q)+'" aria-label="Décrire la prestation"></div>'+
     '<div class="gr-sugs">'+['Pension d’un cheval à la retraite','Demi-pension','Débourrage d’un poulain','Location de box nue'].map(function(s){return '<button class="tag" data-sug>'+s+'</button>'}).join('')+'</div><div data-res></div></div></div>';
  function res(){var box=$('[data-res]',el),k=TS.q?classify(TS.q):null;
    if(!TS.q){box.innerHTML='<div class="gr-res empty0"><div class="rt">?</div><b>Le taux s’affiche ici</b><p>Avec la règle appliquée et la source officielle.</p></div>';return}
    if(!k){box.innerHTML='<div class="gr-res empty0"><div class="rt">?</div><b>Je ne reconnais pas cette prestation</b><p>Précisez : cours, pension, location de box, travail du cheval, vente, licence…</p></div>';return}
    var pen=(k==='pension'||k==='retraite')&&/pension|pr[ée]\b/i.test(TS.q);if(pen&&TS.ridden!=null)k=TS.ridden?'pension':'retraite';var v=VR[k];
    box.innerHTML='<div class="gr-res gr-fade '+(v.r===5.5?'d-hz':v.r===20?'d-mo':'d-tm')+'"><div class="rt num">'+rate(v.r)+'</div><b>'+v.t+'</b><p>'+v.why+'</p>'+
     (pen?'<div class="q"><b style="font-size:14.5px">Le cheval est-il monté par son propriétaire ou un cavalier de son choix ?</b><div class="gr-actions"><button class="btn sm" data-rid="1" aria-pressed="'+(k==='pension')+'">Oui, il est monté</button><button class="btn sm" data-rid="0" aria-pressed="'+(k==='retraite')+'">Non, retraite ou repos</button></div></div>':'')+
     (/pension travail/i.test(TS.q)?'<p class="q" style="margin:0">Si le propriétaire monte aussi son cheval, facturez la pension à 5,5'+NB+'% et le travail à 20'+NB+'% sur deux lignes.</p>':'')+
     '<div class="q"><a class="gr-src" href="'+BOFIP+'" target="_blank" rel="noopener">'+ICON('ext','sm')+'Source : BOFiP, BOI-TVA-SECT-80-10-30-50</a></div></div>';
    on(box,'[data-rid]',function(b){TS.ridden=b.getAttribute('data-rid')==='1';res()})}
  res();var inp=$('[data-q]',el),tm=0;inp.addEventListener('input',function(){clearTimeout(tm);tm=setTimeout(function(){TS.q=inp.value.trim();TS.ridden=null;res()},160)});
  on(el,'[data-sug]',function(b){TS.q=b.textContent;TS.ridden=null;inp.value=TS.q;res()});
  on(el,'[data-ask]',function(b){TS.q=b.getAttribute('data-ask');TS.ridden=null;inp.value=TS.q;res();inp.focus()});
  function fix(o){o.src[o.key]=o.s;o.v=o.s}
  on(el,'[data-fix]',function(b){var o=cat.find(function(x){return x.n===b.getAttribute('data-fix')});if(!o)return;var prev=o.src[o.key];fix(o);
    P.toast(E(o.n)+' : TVA à '+rate(o.s),{undo:function(){o.src[o.key]=prev;P.rerender(true)}});P.rerender(true)});
  on(el,'[data-use]',function(b){var o=cat.find(function(x){return x.n===b.getAttribute('data-use')});if(o)useSheetVat(o)});
  on(el,'[data-fixall]',function(){var l=fixable,prev=l.map(function(o){return o.src[o.key]});l.forEach(fix);
    P.toast(pl(l.length,'tarif')+' corrigé'+(l.length>1?'s':'')+'. Les factures déjà émises ne changent pas.',{undo:function(){l.forEach(function(o,i){o.src[o.key]=prev[i]});P.rerender(true)}});P.rerender(true)});
  on(el,'[data-grid]',function(){dl('grille-tva-'+slug(D.club.short||D.club.name)+'.csv',csv([['Prestation','Origine','Prix','Taux actuel','Taux conseillé','Règle','Source']].concat(cat.map(function(o){return [o.n,o.from,o.p,o.v==null?'':String(o.v).replace('.',','),o.ask?'5,5 ou 20':o.s==null?'':String(o.s).replace('.',','),o.ask?'Pension : selon que le cheval est monté ou non':o.k?VR[o.k].t:'À classer','BOFiP BOI-TVA-SECT-80-10-30-50']}))),'text/csv;charset=utf-8');P.toast('Grille de TVA téléchargée',{icon:'download'})});
 }});

/* =====================================================================
   3. Avis Google
   ===================================================================== */
var AVCFG={url:'',delay:'2 h après la séance',chan:'SMS',auto:true,rating:null,count:null};
var VS={pick:0,filt:'all'};
P.mod({id:'avis',role:'gerant',group:'Croissance',n:20,title:'Avis Google',icon:'star',phoneTitle:'Avis',
 badge:function(){var n=arr('gReviews').filter(function(r){return r.status==='a_traiter'}).length;return n?{v:n,hot:true}:null},
 render:function(el){var c=cfg('avis',AVCFG),rv=arr('gReviews'),gs=D.gStats||{},rating=c.rating!=null?c.rating:gs.rating,count=c.count!=null?c.count:gs.count,hist=gs.hist||[];
  if(!c.url)c.url='https://g.page/r/'+slug(D.club.name).slice(0,12)+'/review';
  var todo=rv.filter(function(r){return r.status==='a_traiter'}),mk=monthKey(tIso()),mon=rv.filter(function(r){return monthKey(r.date)===mk}),pub=rv.filter(function(r){return r.google}),asked=(gs.asked||0)||rv.length;
  var avg=rv.length?rv.reduce(function(s,r){return s+r.rating},0)/rv.length:0;
  el.innerHTML=U.ph('Avis Google','Après la première séance, chaque famille note sa visite en un geste. Les contents publient sur Google, les déçus vous écrivent d’abord.',
    '<button class="btn" data-set>'+ICON('settings','sm')+'Réglages</button><button class="btn pri" data-qr>'+ICON('qr','sm')+'Affiche « Votre avis »</button>')+
   '<div class="gr-top3 rise">'+
    '<div class="card pad tint d-mo"><div class="gr-lab">Note Google</div>'+(rating?'<div class="gr-note" style="margin-top:8px"><div class="gr-k num">'+note(rating)+'</div><div>'+stars(rating)+'<div class="gr-sub">'+pl(count||0,'avis','avis')+(hist.length>1?' · +'+((count||0)-hist[0][2])+' depuis '+hist[0][0].toLowerCase():'')+'</div></div></div>':'<div class="gr-sub" style="margin-top:10px">Saisissez votre note Google dans les réglages pour suivre son évolution.</div>')+'</div>'+
    U.kpi({label:'Demandes envoyées ce mois',count:asked,icon:'send',delta:rv.length?Math.round(rv.length/Math.max(1,asked)*100)+NB+'% de réponses':null,up:null})+
    U.kpi({label:'Publiés sur Google',count:pub.length,icon:'globe',delta:rv.length?'Note moyenne reçue '+note(avg):null,up:null})+
    U.kpi({label:'À lire en premier',count:todo.length,icon:'alert',dom:todo.length?'cr':'hz',tint:!!todo.length,delta:todo.length?'Messages privés':'Rien à traiter',up:null})+'</div>'+
   '<div class="gr-two"><div class="card"><div class="ch"><h3>Ce que disent les familles</h3>'+U.seg([['all','Tous'],['todo','À traiter · '+todo.length],['google','Sur Google']],VS.filt,'data-vf')+'</div><div class="cb" style="padding:8px 0 4px" data-list></div></div>'+
    '<div class="stack"><div class="card pad"><div class="gr-row sp"><div class="gr-h">Le parcours de la famille</div><span class="chip acc">'+E(c.chan)+' · '+E(c.delay)+'</span></div>'+
     '<div class="gr-phone" style="margin-top:16px"><div class="gr-scr"><div class="bar0"><i></i></div><div class="gr-sms"><small>'+E(D.club.short||D.club.name)+'</small>Bonjour, merci d’être venus aujourd’hui ! La première séance s’est bien passée ? Un geste suffit pour nous le dire.</div><div class="gr-pick" data-pick></div></div></div>'+
     '<div class="gr-flow"><div class="d-hz" style="background:var(--d-bg);color:var(--d-ink)"><b>4 ou 5 étoiles</b>Le message est copié et la page d’avis Google s’ouvre : la famille colle et publie.</div><div class="d-cr" style="background:var(--d-bg);color:var(--d-ink)"><b>1 à 3 étoiles</b>Le message vous arrive en privé, vous répondez dans la journée. Le lien Google reste proposé, comme Google l’exige.</div></div></div>'+
     (hist.length>1?'<div class="card pad"><div class="gr-row sp"><div class="gr-h">Évolution de la note</div><span class="mut s">'+note(hist[0][1])+' → '+note(hist[hist.length-1][1])+'</span></div><div style="margin-top:10px">'+P.chart.line([{v:hist.map(function(h){return h[1]}),c:'var(--mo)',area:true}],hist.map(function(h){return h[0]}),{h:150,min:Math.floor(Math.min.apply(null,hist.map(function(h){return h[1]}))*10-2)/10,max:5,fmt:function(v){return note(v)}})+'</div></div>':'')+'</div></div>';
  function list(anim){var l=rv.filter(function(r){return VS.filt==='all'||(VS.filt==='todo'?r.status==='a_traiter':r.google)}).sort(function(a,b){return (b.status==='a_traiter')-(a.status==='a_traiter')||(a.date<b.date?1:-1)});
    var h=l.length?l.map(function(r){var hot=r.status==='a_traiter';return '<div class="gr-rv'+(hot?' hot':'')+'">'+U.av(r.member)+'<div style="min-width:0"><div class="gr-row wrap" style="gap:8px"><b>'+E(nameOf(r.member)||'Famille')+'</b>'+stars(r.rating)+'</div><div class="tx">'+E(r.text)+'</div>'+
      (r.reply?'<div class="note ok" style="margin-top:8px;padding:10px 12px">'+ICON('send','sm')+'<span>Votre réponse : '+E(r.reply)+'</span></div>':'')+'<div class="mt">'+E(r.moment)+' · '+F.rel(r.date)+(r.google?' · publié sur Google':hot?' · message privé':'')+'</div></div>'+
      '<div class="r0">'+(hot?'<button class="btn sm pri" data-rep="'+r.id+'">'+ICON('send','sm')+'Répondre</button>':r.google?'<span class="chip ok">'+ICON('globe','sm')+'Google</span>':'<button class="btn sm ghost" data-ask="'+r.id+'" title="Renvoyer le lien Google">'+ICON('link','sm')+'Lien Google</button>')+'</div></div>'}).join(''):U.empty('star',VS.filt==='todo'?'Aucun message à traiter':'Pas encore d’avis','Les demandes partent toutes seules '+E(c.delay)+', par '+E(c.chan)+'.');
    var box=$('[data-list]',el);if(anim)swap(box,h);else box.innerHTML=h;
    on(box,'[data-rep]',function(b){replySheet(rv.find(function(x){return x.id===b.getAttribute('data-rep')}))});
    on(box,'[data-ask]',function(b){var r=rv.find(function(x){return x.id===b.getAttribute('data-ask')});P.toast('Lien Google renvoyé à '+E(nameOf(r.member)),{icon:'send'})})}
  function pick(){var box=$('[data-pick]',el),v=VS.pick;
    box.innerHTML='<h4>Comment s’est passée la séance ?</h4><div class="row">'+[1,2,3,4,5].map(function(i){return '<button data-st="'+i+'" title="'+i+' étoile'+(i>1?'s':'')+'">'+star(i<=v?'on':'')+'</button>'}).join('')+'</div>'+
     (v>=4?'<p class="gr-fade">Merci ! Votre message est copié : collez-le sur Google pour aider d’autres familles.</p><span class="gs-cta" style="--sc:var(--acc)">'+ICON('globe','sm')+'Publier sur Google</span>':v?'<p class="gr-fade">Merci de nous le dire. Qu’est-ce qui n’a pas été ? La gérante vous répond aujourd’hui.</p><span class="gs-cta" style="--sc:var(--cr)">'+ICON('send','sm')+'Écrire au club</span><p class="xs">Vous pouvez aussi laisser un avis sur Google.</p>':'<p>Touchez une étoile pour essayer.</p>');
    on(box,'[data-st]',function(b){VS.pick=+b.getAttribute('data-st');pick()})}
  list(false);pick();
  on(el,'[data-vf]',function(b){VS.filt=b.getAttribute('data-vf');$$('[data-vf]',el).forEach(function(x){x.setAttribute('aria-selected',x===b)});list(true)});
  on(el,'[data-set]',function(){avisSet(c)});
  on(el,'[data-qr]',function(){dl('affiche-votre-avis.svg',qrPoster(c),'image/svg+xml');P.toast('Affiche « Votre avis » téléchargée, prête à imprimer',{icon:'download'})});
 }});
function replySheet(r){if(!r)return;var p=mem(r.member)||{},first=p.first||'';
  var txt='Bonjour '+first+', merci pour votre message et désolée pour '+(/retard/i.test(r.text)?'ce retard. Le cours précédent a débordé et nous aurions dû vous prévenir. ':'cette première séance. ')+'Je vous propose une séance offerte pour vous faire une meilleure idée du club. Bien à vous, '+((D.staffer(D.me&&D.me.gerant)||{}).first||'la gérante')+'.';
  P.sheet({title:'Répondre à '+E(nameOf(r.member)||'la famille'),icon:'send',body:'<div class="stack"><div class="gr-q"><div class="gr-row" style="gap:8px">'+stars(r.rating)+'<span class="s mut">'+E(r.moment)+' · '+F.rel(r.date)+'</span></div><span>'+E(r.text)+'</span></div>'+
   '<label class="field"><span>Votre réponse</span><textarea class="in" rows="6" data-t>'+E(txt)+'</textarea></label><label class="gr-row" style="font-size:14.5px">'+U.chk(true)+'<span>Offrir une séance (ajoutée au compte de la famille)</span></label></div>',
   foot:'<button class="btn" data-call>'+ICON('phone','sm')+'Appeler</button><button class="btn pri" data-ok>'+ICON('send','sm')+'Envoyer par SMS</button>'});
  var sh=$('.sheet');on(sh,'.chk',function(b){b.setAttribute('aria-checked',b.getAttribute('aria-checked')!=='true')});
  on(sh,'[data-call]',function(){P.toast('Appel vers '+E(p.phone||'la famille'),{icon:'phone'})});
  on(sh,'[data-ok]',function(){r.reply=$('[data-t]',sh).value.trim();r.status='repondu';sh.close();P.toast('Réponse envoyée à '+E(first||'la famille'));P.rerender(true)})}
function avisSet(c){P.sheet({title:'Réglages des avis',icon:'settings',body:'<div class="stack">'+
  '<label class="field"><span>Lien vers votre page d’avis Google</span><input class="in" data-u value="'+E(c.url)+'"></label>'+
  '<div class="g2" style="--g:10px"><label class="field"><span>Note Google actuelle</span><input class="in num" type="number" step="0.1" min="1" max="5" data-r value="'+(c.rating!=null?c.rating:(D.gStats||{}).rating||'')+'"></label><label class="field"><span>Nombre d’avis</span><input class="in num" type="number" min="0" data-n value="'+(c.count!=null?c.count:(D.gStats||{}).count||'')+'"></label></div>'+
  '<label class="field"><span>Envoyer la demande</span><select class="in" data-d>'+['1 h après la séance','2 h après la séance','Le soir même à 19 h','Le lendemain à 10 h'].map(function(x){return '<option'+(x===c.delay?' selected':'')+'>'+x+'</option>'}).join('')+'</select></label>'+
  '<label class="field"><span>Par</span><select class="in" data-c>'+['SMS','E-mail','SMS et e-mail'].map(function(x){return '<option'+(x===c.chan?' selected':'')+'>'+x+'</option>'}).join('')+'</select></label>'+
  '<div class="gr-rule"><div><b>Demander après la première séance</b><small>Cours d’essai, baptême, premier stage</small></div>'+U.tog(c.auto,'gr-auto')+'</div></div>',foot:'<button class="btn pri block" data-ok>'+ICON('check','sm')+'Enregistrer</button>'});
  var sh=$('.sheet');on(sh,'.tog',function(b){b.setAttribute('aria-checked',b.getAttribute('aria-checked')!=='true')});
  on(sh,'[data-ok]',function(){c.url=$('[data-u]',sh).value.trim();var r=parseFloat(String($('[data-r]',sh).value).replace(',','.'));c.rating=isNaN(r)?null:Math.max(1,Math.min(5,r));var n=parseInt($('[data-n]',sh).value,10);c.count=isNaN(n)?null:n;
    c.delay=$('[data-d]',sh).value;c.chan=$('[data-c]',sh).value;c.auto=$('#gr-auto',sh).getAttribute('aria-checked')==='true';sh.close();P.toast('Réglages des avis enregistrés');P.rerender(true)})}
/* affiche à imprimer (le code QR est dessiné par le serveur dans l'appli ; ici un motif de démonstration et le lien en clair) */
function qrPoster(c){var cells='',k=0;for(var y=0;y<21;y++)for(var x=0;x<21;x++){var f=(x<7&&y<7)||(x>13&&y<7)||(x<7&&y>13);var on=f?((x%6===0||y%6===0||(x>1&&x<5&&y>1&&y<5)||(x>15&&x<19&&y>1&&y<5)||(x>1&&x<5&&y>15&&y<19))&&!(x>13&&x<14)):(((x*7+y*13+k++)%5)<2);if(f&&x>13){var xx=x-14;on=xx===0||xx===6||y===0||y===6||(xx>1&&xx<5&&y>1&&y<5)}if(f&&y>13){var yy=y-14;on=x===0||x===6||yy===0||yy===6||(x>1&&x<5&&yy>1&&yy<5)}if(on)cells+='<rect x="'+(130+x*12)+'" y="'+(300+y*12)+'" width="12" height="12"/>'}
  return '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="720" viewBox="0 0 512 720"><rect width="512" height="720" fill="#ffffff"/><text x="256" y="120" font-family="Arial" font-size="40" font-weight="700" text-anchor="middle" fill="#0a1636">Votre avis compte</text><text x="256" y="175" font-family="Arial" font-size="22" text-anchor="middle" fill="#59627c">Une minute pour aider d’autres familles</text><text x="256" y="230" font-family="Arial" font-size="22" text-anchor="middle" fill="#59627c">à découvrir '+E(D.club.name)+'</text><g fill="#0a1636">'+cells+'</g><text x="256" y="610" font-family="Arial" font-size="18" text-anchor="middle" fill="#0a1636">'+E(c.url)+'</text><text x="256" y="670" font-family="Arial" font-size="16" text-anchor="middle" fill="#868da4">Scannez avec l’appareil photo de votre téléphone</text></svg>'}

/* =====================================================================
   4. Cartes cadeaux et parrainage
   ===================================================================== */
function site0(){var s=cfg('site',SITECFG);if(!s.slug)s.slug=slug(String(D.club.short||D.club.name).replace(/^(les|le|la|l’|l')\s+/i,''))||'monclub';return s}
function host(){return site0().slug+'.stablapp.fr'}
var GCCFG={products:[['Baptême à poney',12],['Balade d’une heure',35],['Carte 10 séances',290],['Stage de Noël',240]],validity:12};
function gcProducts(){var c=cfg('cadeaux',GCCFG),out=c.products.slice();(D.shopItems||[]).forEach(function(s){if(/Baptême/i.test(s.name))out[0]=['Baptême à poney',s.price];if(/Balade/i.test(s.name))out[1]=[s.name,s.price];if(/Carte 10/i.test(s.name))out[2]=[s.name,s.price]});
  var st=(D.camps||[]).find(function(x){return /Noël/i.test(x.title)});if(st)out[3]=['Stage de Noël',st.price];return out}
function refCode(m){var p=mem(m)||{};return (slug(p.first||'ami').toUpperCase().replace(/-/g,'').slice(0,6)||'AMI')+'-'+(slug(D.club.short||D.club.name).replace(/^(les|le|la)-/,'').slice(0,3).toUpperCase()||'CLB')+(parseInt(String(m).replace(/\D/g,''),10)%90+10)}
var RST={invite:['Invité','line',0],essai:['Séance d’essai faite','acc',1],inscrit:['Inscrit','warn',2],recompense:['Récompense donnée','ok',3]};
var GS={tab:'gc',q:''};
function gcCode(){return (slug(D.club.short||D.club.name).replace(/^(les|le|la)-/,'').slice(0,3).toUpperCase()||'CLB')+'-'+rcode(4)+'-'+String(10+Math.floor(R()*89))}
function voucher(g){var sc=resolveColor(site0().color);return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Carte cadeau '+E(g.code)+'</title><style>body{font-family:Arial,sans-serif;background:#f2f4f8;margin:0;padding:40px;color:#0a1636}.c{max-width:560px;margin:auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 10px 40px rgba(10,22,54,.12)}.t{background:'+sc+';color:#fff;padding:32px}.t h1{margin:0;font-size:34px}.t p{margin:8px 0 0;font-size:18px;opacity:.9}.b{padding:28px 32px;font-size:16px;line-height:1.5}.k{font-family:monospace;font-size:26px;letter-spacing:3px;background:#f2f4f8;border-radius:12px;padding:14px;text-align:center;margin:18px 0}small{color:#59627c}@media print{body{background:#fff;padding:0}.c{box-shadow:none}}</style></head><body><div class="c"><div class="t"><h1>'+E(g.label||'Carte cadeau')+'</h1><p>'+E(D.club.name)+' · '+eur(g.amount)+'</p></div><div class="b"><p>Pour <b>'+E(g.to)+'</b>, de la part de '+E(g.buyer)+'.</p>'+(g.msg?'<p>« '+E(g.msg)+' »</p>':'')+'<div class="k">'+E(g.code)+'</div><p>À présenter à l’accueil ou à saisir en ligne sur '+E(host())+'. Valable '+cfg('cadeaux',GCCFG).validity+' mois à partir du '+F.dateY(g.date)+'.</p><small>'+E(D.club.name)+(D.club.address?' · '+E(D.club.address):'')+(D.club.phone?' · '+E(D.club.phone):'')+'</small></div></div></body></html>'}
P.mod({id:'cadeaux',role:'gerant',group:'Croissance',n:30,title:'Cadeaux',icon:'gift',phoneTitle:'Cadeaux',
 badge:function(){var n=arr('referrals').filter(function(r){return r.status==='inscrit'}).length;return n?{v:n}:null},
 render:function(el){var G=arr('giftcards'),RF=arr('referrals'),mk=monthKey(tIso()),gm=G.filter(function(g){return monthKey(g.date)===mk}),rest=G.reduce(function(s,g){return s+(+g.rest||0)},0),used=G.reduce(function(s,g){return s+((+g.amount||0)-(+g.rest||0))},0);
  var url=host()+'/offrir';
  el.innerHTML=U.ph('Cadeaux et parrainage','Vendez des cartes cadeaux en ligne et laissez vos cavaliers faire venir leurs amis.',
    '<button class="btn" data-sell>'+ICON('plus','sm')+'Vendre une carte</button><button class="btn pri" data-share>'+ICON('link','sm')+'Copier le lien « Offrir »</button>')+
   '<div class="gr-top rise"><div class="card navy gr-hero"><div><span class="chip" style="background:color-mix(in srgb,var(--navy-ink) 14%,transparent);color:inherit">'+ICON('spark','sm')+'Page publique prête pour Noël</span><h2 style="margin-top:14px">Offrez un baptême à poney</h2><p>Les familles choisissent un baptême, une balade, une carte de séances ou un montant libre, paient en ligne et reçoivent le bon par e-mail, avec son code.</p>'+
     '<div class="gr-row wrap" style="margin-top:4px"><span class="gr-url">'+ICON('globe','sm')+E(url)+'</span><button class="btn sm" data-see style="margin-top:14px">'+ICON('eye','sm')+'Voir la page</button></div></div>'+ILLU.cheval({size:150})+'</div>'+
    '<div class="gr-top3 gr-k2">'+U.kpi({label:'Vendues ce mois',count:gm.reduce(function(s,g){return s+(+g.amount||0)},0),fmt:'eur',icon:'gift',delta:pl(gm.length,'carte'),up:null})+U.kpi({label:'Solde à utiliser',count:rest,fmt:'eur',icon:'wallet',delta:pl(G.filter(function(g){return g.rest>0}).length,'carte active','cartes actives'),up:null})+
     U.kpi({label:'Parrainages',count:RF.length,icon:'members',delta:pl(RF.filter(function(r){return RST[r.status][2]>=2}).length,'inscrit'),up:null})+U.kpi({label:'Déjà utilisé',count:used,fmt:'eur',icon:'check',delta:'en séances et stages',up:null})+'</div></div>'+
   '<div class="gr-row sp wrap" style="margin:6px 0 14px">'+U.seg([['gc','Cartes cadeaux · '+G.length],['ref','Parrainage · '+RF.length]],GS.tab,'data-gtab')+'</div><div data-gbody></div>';
  var body=$('[data-gbody]',el);
  function draw(anim){var h='';
   if(GS.tab==='gc'){
    h='<div class="gr-two"><div class="card"><div class="ch"><h3>Cartes vendues</h3><span class="mut">'+eur(G.reduce(function(s,g){return s+(+g.amount||0)},0))+' au total</span></div><div class="cb" style="padding:10px 0 0">'+
     (G.length?'<div class="gr-scroll">'+U.table([{l:'Code',f:function(g){return '<span class="gr-mono">'+E(g.code)+'</span><div class="xs mut">'+F.dateY(g.date)+'</div>'}},{l:'Pour',f:function(g){return '<b>'+E(g.to)+'</b><div class="xs mut">de '+E(g.buyer)+'</div>'}},
       {l:'Solde',f:function(g){var p=g.amount?g.rest/g.amount*100:0;return '<div style="min-width:110px"><b class="num">'+eur(g.rest)+'</b><span class="xs mut"> sur '+eur(g.amount)+'</span>'+U.bar(p,g.rest?'var(--ex)':'var(--line-2)')+'</div>'}},
       {l:'',n:true,f:function(g){return '<div class="gr-row" style="justify-content:flex-end;gap:6px">'+(g.rest>0?'<button class="btn sm tint" data-use="'+E(g.code)+'">Utiliser</button>':'<span class="chip line">Utilisée</span>')+'<button class="btn sm ghost icon" data-vch="'+E(g.code)+'" title="Télécharger le bon">'+ICON('download','sm')+'</button></div>'}}],
       G.slice().sort(function(a,b){return a.date<b.date?1:-1}),{card:false})+'</div>':U.empty('gift','Aucune carte cadeau vendue','Partagez le lien « Offrir » sur votre site et vos réseaux avant les fêtes.'))+'</div></div>'+
     '<div class="stack"><div class="card pad"><div class="gr-h">Vérifier une carte</div><p class="s mut" style="margin:4px 0 12px">Le code est sur le bon, ou dans l’e-mail reçu.</p><div class="gr-check"><input class="in gr-mono" data-cq placeholder="TIL-XXXX-00" value="'+E(GS.q)+'" aria-label="Code de la carte"><button class="btn" data-ck>'+ICON('search','sm')+'Vérifier</button></div><div data-cres style="margin-top:12px"></div></div>'+
     '<div class="card pad d-ex"><div class="gr-gc"><span>'+E(D.club.short||D.club.name)+'</span><div><b>'+eur((gcProducts()[0]||['',12])[1])+'</b><div><span>'+E((gcProducts()[0]||['Baptême à poney'])[0])+'</span></div></div><span class="c">'+E(host())+'</span></div><p class="s mut" style="margin-top:12px">Valable '+cfg('cadeaux',GCCFG).validity+' mois. La TVA s’applique quand la carte est utilisée.</p></div></div></div>';
   }else{
    var steps=[0,1,2,3].map(function(i){return RF.filter(function(r){return RST[r.status][2]>=i}).length});
    h='<div class="gr-two"><div class="card"><div class="ch"><h3>Parrainages en cours</h3><span class="mut">Une séance offerte au parrain et au filleul à l’inscription</span></div>'+
     (RF.length?'<div class="list gr-scroll" style="max-height:420px">'+RF.slice().sort(function(a,b){return RST[b.status][2]===2?1:RST[a.status][2]===2?-1:(a.date<b.date?1:-1)}).map(function(r){var s=RST[r.status];return '<div class="li">'+U.av(r.by,'sm')+'<div class="grow" style="min-width:0"><div class="t ellip">'+E(r.friend)+'</div><div class="s ellip">parrainé'+(/a$|e$/.test(r.friend.split(' ')[0])?'e':'')+' par '+E(nameOf(r.by))+' · '+F.rel(r.date)+'</div></div><div class="r">'+(r.status==='inscrit'?'<button class="btn sm pri" data-rew="'+r.id+'">'+ICON('gift','sm')+'Offrir les séances</button>':'<span class="chip '+s[1]+'">'+s[0]+'</span>')+'</div></div>'}).join('')+'</div>':'<div class="cb">'+U.empty('members','Aucun parrainage pour l’instant','Chaque cavalier a son code dans son espace : il le partage en un geste.')+'</div>')+'</div>'+
     '<div class="card pad"><div class="gr-h">Du lien à l’inscription</div><div class="gr-ref">'+[['Invités',steps[0]],['Essai fait',steps[1]],['Inscrits',steps[2]],['Récompensés',steps[3]]].map(function(x){return '<div><b class="num">'+x[1]+'</b>'+x[0]+'</div>'}).join('')+'</div>'+
     '<div class="note" style="margin-top:14px">'+ICON('gift','sm')+'<span>La récompense est donnée quand le filleul prend un forfait à l’année : une séance au parrain, une au filleul, ajoutées à leur carte.</span></div>'+
     '<div class="gr-rule" style="margin-top:4px"><div><b>Parrainage actif</b><small>Code visible dans l’espace de chaque cavalier</small></div>'+U.tog(cfg('cadeaux',GCCFG).ref!==false,'gr-refon')+'</div></div></div>';
   }
   if(anim)swap(body,h);else body.innerHTML=h;wire()}
  function check(){var b=$('[data-cres]',body);if(!b)return;var q=GS.q.trim().toUpperCase();if(!q){b.innerHTML='';return}var g=G.find(function(x){return x.code.toUpperCase()===q});
    b.innerHTML=g?'<div class="note ok gr-fade">'+ICON('checkc','sm')+'<span>Carte valable : <b>'+eur(g.rest)+'</b> restants sur '+eur(g.amount)+', pour '+E(g.to)+'.</span></div>':'<div class="note bad gr-fade">'+ICON('xc','sm')+'<span>Aucune carte avec ce code. Vérifiez les tirets et les chiffres.</span></div>'}
  function wire(){
   on(body,'[data-use]',function(b){useSheet(G.find(function(g){return g.code===b.getAttribute('data-use')}))});
   on(body,'[data-vch]',function(b){var g=G.find(function(x){return x.code===b.getAttribute('data-vch')});dl('carte-cadeau-'+g.code+'.html',voucher(g),'text/html;charset=utf-8');P.toast('Bon '+E(g.code)+' téléchargé',{icon:'download'})});
   var cq=$('[data-cq]',body);if(cq){cq.addEventListener('keydown',function(e){if(e.key==='Enter'){GS.q=cq.value;check()}});on(body,'[data-ck]',function(){GS.q=cq.value;check()});check()}
   on(body,'[data-rew]',function(b){var r=RF.find(function(x){return x.id===b.getAttribute('data-rew')});r.status='recompense';P.toast('Une séance offerte à '+E(nameOf(r.by))+' et à '+E(r.friend.split(' ')[0]));P.rerender(true)});
   on(body,'.tog',function(b){var v=b.getAttribute('aria-checked')!=='true';b.setAttribute('aria-checked',v);cfg('cadeaux',GCCFG).ref=v;P.toast(v?'Parrainage activé':'Parrainage mis en pause')});
  }
  on(el,'[data-gtab]',function(b){GS.tab=b.getAttribute('data-gtab');$$('[data-gtab]',el).forEach(function(x){x.setAttribute('aria-selected',x===b)});draw(true)});
  on(el,'[data-share]',function(){copy('https://'+url,'Lien copié : '+url)});
  on(el,'[data-see]',function(){buySheet(false)});
  on(el,'[data-sell]',function(){buySheet(true)});
  draw(false);
 }});
function useSheet(g){if(!g)return;P.sheet({title:'Utiliser la carte '+E(g.code),icon:'gift',body:'<div class="stack"><div class="gr-q"><b>'+E(g.to)+'</b><span class="s mut">Solde : '+eur(g.rest)+' sur '+eur(g.amount)+'</span></div><label class="field"><span>Montant utilisé</span><input class="in num" type="number" min="0" step="1" max="'+g.rest+'" value="'+Math.min(g.rest,seance())+'" data-a></label><label class="field"><span>Pour</span><input class="in" data-w value="Séance du '+F.dateL(tIso())+'"></label></div>',
  foot:'<button class="btn pri block" data-ok>'+ICON('check','sm')+'Déduire de la carte</button>'});
  var sh=$('.sheet');on(sh,'[data-ok]',function(){var a=Math.max(0,Math.min(g.rest,+$('[data-a]',sh).value||0));if(!a){P.toast('Saisissez un montant',{icon:'info'});return}var prev=g.rest;g.rest=Math.round((g.rest-a)*100)/100;sh.close();
    P.toast(eur(a)+' déduits. Il reste '+eur(g.rest),{undo:function(){g.rest=prev;P.rerender(true)}});P.rerender(true)})}
/* page publique d'achat (aperçu) ou vente au comptoir */
function buySheet(counter){var pr=gcProducts(),sel=0,amt=pr[0][1];
  P.sheet({title:counter?'Vendre une carte cadeau':'Page « Offrir », vue par une famille',icon:'gift',wide:!counter,body:function(b){
    b.innerHTML='<div class="stack">'+(counter?'':'<div class="note">'+ICON('globe','sm')+'<span>Adresse publique : <b>'+E(host())+'/offrir</b>. Le paiement en ligne passe par votre compte Stripe.</span></div>')+
     '<div class="g2" style="--g:10px">'+pr.map(function(p,i){return '<button class="tag" data-p="'+i+'" aria-pressed="'+(i===0)+'" style="justify-content:space-between;min-height:54px"><span>'+E(p[0])+'</span><b class="num">'+eur(p[1])+'</b></button>'}).join('')+'<button class="tag" data-p="free" style="min-height:54px">Montant libre</button></div>'+
     '<label class="field"><span>Montant</span><input class="in num" type="number" min="10" step="5" data-am value="'+amt+'"></label>'+
     '<div class="g2" style="--g:10px"><label class="field"><span>Pour</span><input class="in" data-to placeholder="Prénom et nom" value="Noé"></label><label class="field"><span>De la part de</span><input class="in" data-by placeholder="Votre nom" value="'+(counter?'Client de passage':'Mamie Jeanne')+'"></label></div>'+
     '<label class="field"><span>Message sur le bon</span><input class="in" data-msg value="Joyeux Noël, à toi les poneys !"></label></div>'},
   foot:'<button class="btn pri block" data-ok>'+ICON(counter?'check':'card','sm')+'<span data-lbl>'+(counter?'Encaisser ':'Payer ')+eur(amt)+'</span></button>'});
  var sh=$('.sheet'),am=$('[data-am]',sh);function lbl(){$('[data-lbl]',sh).textContent=(counter?'Encaisser ':'Payer ')+eur(+am.value||0)}
  on(sh,'[data-p]',function(b){$$('[data-p]',sh).forEach(function(x){x.setAttribute('aria-pressed',x===b)});var v=b.getAttribute('data-p');if(v!=='free'){sel=+v;am.value=pr[sel][1]}else{sel=-1;am.focus()}lbl()});am.oninput=lbl;
  on(sh,'[data-ok]',function(){var a=Math.max(0,+am.value||0);if(a<1){P.toast('Choisissez un montant',{icon:'info'});return}
    var g={code:gcCode(),amount:a,rest:a,buyer:$('[data-by]',sh).value.trim()||'Client',to:$('[data-to]',sh).value.trim()||'À attribuer',date:tIso(),msg:$('[data-msg]',sh).value.trim(),label:sel>=0?pr[sel][0]:'Carte cadeau',online:!counter};
    arr('giftcards').unshift(g);sh.close();dl('carte-cadeau-'+g.code+'.html',voucher(g),'text/html;charset=utf-8');P.toast('Carte '+g.code+' créée, bon téléchargé',{icon:'gift'});if(P.state.route==='cadeaux')P.rerender(true)})}

/* =====================================================================
   5. Satisfaction : sondages de fin de stage, note par moniteur
   ===================================================================== */
var SS={open:null};
function ans(s){return (s&&s.answers||[]).filter(function(a){return !a.pending})}
function svAvg(l,k){return l.length?l.reduce(function(s,a){return s+(+a[k]||0)},0)/l.length:0}
P.mod({id:'sondages',role:'gerant',group:'Croissance',n:40,title:'Satisfaction',icon:'checkc',phoneTitle:'Satisfaction',
 badge:function(){var n=0;arr('surveys').forEach(function(s){ans(s).forEach(function(a){if(a.global<=2&&!a.done)n++})});return n?{v:n,hot:true}:null},
 render:function(el){var S=arr('surveys'),all=[];S.forEach(function(s){ans(s).forEach(function(a){all.push({s:s,a:a})})});
  var sent=S.reduce(function(t,s){return t+(+s.sent||0)},0),alerts=all.filter(function(x){return x.a.global<=2&&!x.a.done}),again=all.filter(function(x){return x.a.again}).length;
  var by={};S.forEach(function(s){if(!s.coach)return;(by[s.coach]=by[s.coach]||[]);ans(s).forEach(function(a){by[s.coach].push(a)})});
  var coaches=Object.keys(by).map(function(k){return {id:k,n:by[k].length,v:svAvg(by[k],'coach')}}).filter(function(x){return x.n}).sort(function(a,b){return b.v-a.v});
  el.innerHTML=U.ph('Satisfaction','Trois questions, une minute, envoyées à la fin de chaque stage. Vous savez qui va se réinscrire avant qu’il ne soit trop tard.',
    '<button class="btn" data-exp>'+ICON('download','sm')+'Exporter les réponses</button><button class="btn pri" data-send>'+ICON('send','sm')+'Envoyer un sondage</button>')+
   '<div class="gr-top3 rise">'+
    '<div class="card pad tint d-ex"><div class="gr-lab">Satisfaction moyenne</div><div class="gr-note" style="margin-top:8px"><div class="gr-k num">'+(all.length?note(svAvg(all.map(function(x){return x.a}),'global')):'–')+'</div><div>'+stars(svAvg(all.map(function(x){return x.a}),'global'))+'<div class="gr-sub">sur 5, '+pl(all.length,'réponse')+'</div></div></div></div>'+
    U.kpi({label:'Taux de réponse',count:sent?Math.round(all.length/sent*100):0,fmt:'pct',unit:'%',icon:'chat',delta:all.length+' sur '+sent+' envoyés',up:null})+
    U.kpi({label:'Reviendraient',count:all.length?Math.round(again/all.length*100):0,fmt:'pct',unit:'%',icon:'repeat',delta:pl(again,'famille')+' sur '+all.length,up:null})+
    U.kpi({label:'Familles déçues',count:alerts.length,icon:'alert',dom:alerts.length?'cr':'hz',tint:!!alerts.length,delta:alerts.length?'À rappeler aujourd’hui':'Aucune',up:null})+'</div>'+
   (alerts.length?'<div class="card pad tint d-cr" style="margin-bottom:16px"><div class="gr-row sp wrap">'+alerts.slice(0,1).map(function(x){return '<div class="gr-row" style="align-items:flex-start;min-width:0;flex:1">'+U.av(x.a.member)+'<div style="min-width:0"><b>'+E(nameOf(x.a.member))+'</b> · '+E(x.s.title)+' '+stars(x.a.global)+'<div style="margin-top:4px;line-height:1.45">« '+E(x.a.text||'Pas de commentaire.')+' »</div></div></div>'}).join('')+
     '<div class="gr-actions"><button class="btn sm" data-call>'+ICON('phone','sm')+'Appeler</button><button class="btn sm dark" data-done>'+ICON('check','sm')+'Marquer comme traité</button></div></div></div>':'')+
   '<div class="gr-two"><div class="card"><div class="ch"><h3>Derniers sondages</h3><span class="mut">Touchez un sondage pour lire les réponses</span></div><div style="padding:6px 0">'+
     (S.length?S.slice().sort(function(a,b){return a.date<b.date?1:-1}).map(function(s){var A0=ans(s),n=A0.length,r=s.sent?Math.round(n/s.sent*100):0;return '<button class="gr-sv" data-sv="'+s.id+'"><div style="min-width:0"><div class="t ellip">'+E(s.title)+'</div><div class="s">'+(s.date?F.dateY(s.date):'Date inconnue')+(s.coach?' · '+E(D.name(s.coach)):'')+' · '+n+' sur '+(s.sent||n)+' ont répondu</div></div><div class="gr-row" style="gap:14px">'+(n?'<b class="num" style="font:800 20px var(--f-display)">'+note(svAvg(A0,'global'))+'</b>':'<span class="chip line">En attente</span>')+U.ring(r,r+NB+'%','var(--ex)',48)+'</div></button>'}).join(''):U.empty('checkc','Aucun sondage envoyé','Envoyez le premier à la fin de votre prochain stage.'))+'</div></div>'+
    '<div class="card pad"><div class="gr-row sp"><div class="gr-h">Note par moniteur</div><span class="mut s">Question « Le moniteur »</span></div>'+
     (coaches.length?'<div style="margin-top:8px">'+coaches.map(function(c){var p=D.person(c.id);return '<div class="gr-coach">'+U.av(c.id,'sm')+'<div style="min-width:0"><div class="gr-row sp"><span class="b ellip">'+E(D.name(c.id))+'</span><span class="xs mut">'+pl(c.n,'avis','avis')+'</span></div>'+U.bar(c.v/5*100,'var(--ex)')+'</div><b>'+note(c.v)+'</b></div>'}).join('')+'</div>':U.empty('team','Pas encore de note','Les notes apparaissent dès les premières réponses.'))+
     '<p class="xs mut" style="margin-top:12px;line-height:1.45">Une note se lit avec ses commentaires : un groupe difficile ou la météo comptent aussi.</p></div></div>';
  on(el,'[data-sv]',function(b){svSheet(S.find(function(s){return s.id===b.getAttribute('data-sv')}))});
  on(el,'[data-send]',function(){sendSheet()});
  on(el,'[data-call]',function(){var p=mem(alerts[0].a.member)||{};P.toast('Appel vers '+E(nameOf(alerts[0].a.member))+(p.phone?', '+E(p.phone):''),{icon:'phone'})});
  on(el,'[data-done]',function(){var a=alerts[0].a;a.done=true;P.toast('Marqué comme traité',{undo:function(){a.done=false;P.rerender(true)}});P.rerender(true)});
  on(el,'[data-exp]',function(){dl('sondages-'+tIso()+'.csv',csv([['Sondage','Date','Moniteur','Cavalier','Note globale','Note du moniteur','Reviendrait','Commentaire']].concat(all.map(function(x){return [x.s.title,x.s.date,D.name(x.s.coach),nameOf(x.a.member),x.a.global,x.a.coach,x.a.again?'Oui':'Non',x.a.text||'']}))),'text/csv;charset=utf-8');P.toast('Réponses téléchargées',{icon:'download'})});
 }});
function svSheet(s){if(!s)return;var A=ans(s),dist=[5,4,3,2,1].map(function(v){return [v,A.filter(function(a){return a.global===v}).length]}),mx=Math.max.apply(null,dist.map(function(d){return d[1]}).concat([1]));
  P.sheet({title:s.title,icon:'checkc',wide:true,body:'<div class="stack"><div class="gr-top3" style="grid-template-columns:repeat('+(P.isMobile()?1:3)+',minmax(0,1fr));margin:0">'+
   U.kpi({label:'Note globale',value:A.length?note(svAvg(A,'global')):'–',unit:'/ 5'})+U.kpi({label:'Le moniteur',value:A.length?note(svAvg(A,'coach')):'–',unit:'/ 5'})+U.kpi({label:'Reviendraient',value:A.length?Math.round(A.filter(function(a){return a.again}).length/A.length*100):0,unit:'%'})+'</div>'+
   '<div class="gr-q"><b>1. Dans l’ensemble, comment s’est passé le stage ?</b><div class="gr-hist">'+dist.map(function(d){return '<span>'+d[0]+' '+star('on')+'</span>'+U.bar(d[1]/mx*100,'var(--mo)')+'<span class="num">'+d[1]+'</span>'}).join('')+'</div></div>'+
   '<div class="gr-q"><b>2. Comment avez-vous trouvé '+E(D.name(s.coach)||'le moniteur')+' ?</b><span class="mut">Moyenne '+note(svAvg(A,'coach'))+' sur 5</span></div><div class="gr-q"><b>3. Reviendriez-vous à un prochain stage ?</b><span class="mut">'+A.filter(function(a){return a.again}).length+' oui, '+A.filter(function(a){return !a.again}).length+' non</span></div>'+
   '<div class="gr-h" style="font-size:17px;margin-top:6px">Commentaires</div><div class="card soft" style="padding:4px 0">'+(A.filter(function(a){return a.text}).map(function(a){return '<div class="li" style="align-items:flex-start">'+U.av(a.member,'sm')+'<div class="grow"><div class="t">'+E(nameOf(a.member))+' '+stars(a.global)+'</div><div class="s" style="color:var(--ink-2);line-height:1.45;margin-top:2px">'+E(a.text)+'</div></div></div>'}).join('')||'<div class="li"><span class="mut">Aucun commentaire écrit.</span></div>')+'</div></div>',
   foot:'<button class="btn" data-rl>'+ICON('send','sm')+'Relancer '+pl(Math.max(0,s.sent-A.length),'famille')+'</button><button class="btn pri" data-th>'+ICON('chat','sm')+'Remercier les participants</button>'});
  var sh=$('.sheet');on(sh,'[data-rl]',function(){P.toast('Relance envoyée à '+pl(Math.max(0,s.sent-A.length),'famille'),{icon:'send'})});on(sh,'[data-th]',function(){sh.close();P.toast('Message de remerciement envoyé à '+pl(s.sent,'famille'),{icon:'send'})})}
function sendSheet(){var camps=(D.camps||[]).slice(0,4).map(function(c){return [c.title,c.coach,c.taken||c.cap||10]}),
  opts=[['Stage de la Toussaint, Galops 2 à 4','s03',18],['Reprise du mercredi, Galop 4-5','s03',10],['Baptêmes du dimanche','s08',6]].concat(camps);
  P.sheet({title:'Envoyer un sondage',icon:'send',body:'<div class="stack"><label class="field"><span>Activité</span><select class="in" data-a>'+opts.map(function(o,i){return '<option value="'+i+'">'+E(o[0])+' · '+pl(o[2],'participant')+'</option>'}).join('')+'</select></label>'+
   '<div class="gr-q"><b>Ce que reçoivent les familles</b><span class="s">1. Dans l’ensemble, comment s’est passé le stage ? (1 à 5 étoiles)</span><span class="s">2. Comment avez-vous trouvé le moniteur ? (1 à 5 étoiles)</span><span class="s">3. Reviendriez-vous à un prochain stage ? (oui ou non, et un mot si vous voulez)</span></div>'+
   '<label class="field"><span>Envoyer</span><select class="in" data-w><option>Maintenant</option><option>Ce soir à 19 h</option><option>Demain à 10 h</option></select></label>'+
   '<div class="note">'+ICON('info','sm')+'<span>Une famille qui met 1 ou 2 étoiles vous est signalée tout de suite, pour l’appeler dans la journée.</span></div></div>',foot:'<button class="btn pri block" data-ok>'+ICON('send','sm')+'Envoyer le sondage</button>'});
  var sh=$('.sheet');on(sh,'[data-ok]',function(){var o=opts[+$('[data-a]',sh).value]||opts[0],S=arr('surveys');S.push({id:idx(S,'sv'),title:o[0],kind:'stage',coach:o[1],date:tIso(),sent:o[2],answers:[]});sh.close();P.toast('Sondage envoyé à '+pl(o[2],'famille'),{icon:'send'});P.rerender(true)})}

/* =====================================================================
   6. Ce que Stabl vous a rapporté
   ===================================================================== */
var RPCFG={rate:25,unit:{fact:3,rel:5,sign:15,book:2,decl:4,sv:10},mail:true};
var PLAN=LIVE?null:{name:'Écurie',price:149};
function gains(mk){var c=cfg('rapporte',RPCFG),t=tIso(),inM=function(d){return d&&monthKey(d)===mk&&d<=t},L=[],H=[],lg=(D.growthLog||{})[mk];
  var ar=aids().filter(function(a){return a.status==='rembourse'&&inM(a.paidAt)});
  if(ar.length){var byk={};ar.forEach(function(a){(byk[a.kind]=byk[a.kind]||[]).push(a)});
    L.push({ic:'ticket',d:'rd',t:'Aides récupérées auprès des organismes',v:sum(ar),c:Object.keys(byk).map(function(k){var l=byk[k];return pl(l.length,'aide')+' '+KINDS[k].t+(l.every(function(a){return a.amount===l[0].amount})?' × '+eur(l[0].amount):'')+' = '+eur(sum(l))}).join(' ; ')+'. Remboursements pointés ce mois-ci.',go:'aides'})}
  var rel=(D.invoices||[]).filter(function(i){return i.reminded&&i.status==='payée'&&inM(i.due)});
  if(rel.length)L.push({ic:'send',d:'mo',t:'Factures payées après la relance automatique',v:sum(rel),c:pl(rel.length,'facture')+' réglée'+(rel.length>1?'s':'')+' après le rappel envoyé par '+brand()+' : '+rel.slice(0,4).map(function(i){return eur(i.amount)}).join(' + ')+(rel.length>4?' + …':'')+' = '+eur(sum(rel))+'.',go:'facturation'});
  if(lg&&lg.waitlist){var pr=seance();L.push({ic:'waitlist',d:'rd',t:'Places revendues grâce à la liste d’attente',v:Math.round(lg.waitlist*pr*100)/100,c:pl(lg.waitlist,'place')+' libérée'+(lg.waitlist>1?'s':'')+' puis reprise'+(lg.waitlist>1?'s':'')+' par un cavalier en attente × '+eur(pr)+' (prix d’une séance à la carte) = '+eur(Math.round(lg.waitlist*pr*100)/100)+'.',go:'planning'})}
  var gm=arr('giftcards').filter(function(g){return inM(g.date)});
  if(gm.length)L.push({ic:'gift',d:'ex',t:'Cartes cadeaux vendues',v:gm.reduce(function(s,g){return s+(+g.amount||0)},0),c:pl(gm.length,'carte')+' : '+gm.map(function(g){return eur(g.amount)}).join(' + ')+' = '+eur(gm.reduce(function(s,g){return s+(+g.amount||0)},0))+'. Encaissé avant la séance.',go:'cadeaux'});
  var rf=arr('referrals').filter(function(r){return RST[r.status]&&RST[r.status][2]>=2&&inM(r.date)});
  if(rf.length){var v=rf.reduce(function(s,r){var f=forf(r.forfait);return s+(f?f.price:0)},0);L.push({ic:'members',d:'tm',t:'Nouveaux cavaliers venus par parrainage',v:v,c:pl(rf.length,'filleul')+' inscrit'+(rf.length>1?'s':'')+' : '+rf.map(function(r){var f=forf(r.forfait);return E(r.friend.split(' ')[0])+' ('+(f?eur(f.price):'forfait')+')'}).join(', ')+' = '+eur(v)+' de forfaits sur l’année.',go:'cadeaux'})}
  var fi=(D.invoices||[]).filter(function(i){return inM(i.date)}).length;if(fi)H.push([fi,c.unit.fact,'factures préparées et envoyées toutes seules']);
  var rc=(D.invoices||[]).filter(function(i){return (i.reminded||i.status==='en retard')&&inM(i.due)}).length;if(rc)H.push([rc,c.unit.rel,'relances envoyées sans un appel']);
  var sg=(D.contracts||[]).filter(function(x){return x.status==='signé'&&inM(x.date)}).length;if(sg)H.push([sg,c.unit.sign,'contrats signés en ligne']);
  if(lg&&lg.bookings)H.push([lg.bookings,c.unit.book,'réservations faites par les cavaliers eux-mêmes']);
  var dc=aids().filter(function(a){return inM(a.declaredAt)}).length;if(dc)H.push([dc,c.unit.decl,'aides déclarées depuis une liste prête']);
  var sv=arr('surveys').filter(function(s){return inM(s.date)}).length;if(sv)H.push([sv,c.unit.sv,'sondages envoyés et dépouillés']);
  var mins=H.reduce(function(s,h){return s+h[0]*h[1]},0),hours=Math.round(mins/6)/10;
  return {lines:L,hrs:H,hours:hours,timeV:Math.round(hours*c.rate),total:L.reduce(function(s,l){return s+l.v},0),rate:c.rate,partial:mk===monthKey(t)}}
var RS={mk:null};
P.mod({id:'rapporte',role:'gerant',group:'Pilotage',n:25,title:'Gains du mois',icon:'gains',phoneTitle:'Rapporté',short:'Rapporté',
 render:function(el){var t=tIso(),cur=monthKey(t),months=[];for(var i=2;i>=0;i--){var d=new Date(D.today.getFullYear(),D.today.getMonth()-i,1);months.push(D.iso(d).slice(0,7))}
  if(!RS.mk||months.indexOf(RS.mk)<0)RS.mk=cur;var g=gains(RS.mk),c=cfg('rapporte',RPCFG),times=PLAN?Math.floor((g.total+g.timeV)/PLAN.price):0;
  el.innerHTML=U.ph('Ce que '+E(brand())+' vous a rapporté','Chaque chiffre vient des données du mois, avec son calcul écrit dessous. Rien n’est estimé sans être dit.',
    U.seg(months.map(function(m){return [m,cap(MOL[+m.slice(5,7)-1])+(m===cur?' (en cours)':'')]}),RS.mk,'data-mk'))+
   '<div class="gr-top rise"><div class="card navy gr-sum">'+ILLU.pieces({size:null})+'<div class="lab"><span class="strass"></span>'+cap(monthName(RS.mk))+(g.partial?', du 1er au '+F.date(t):'')+'</div><div class="gr-k num"><span data-count="'+g.total+'" data-fmt="eur">'+eur(g.total)+'</span></div><div style="font:500 16px var(--f-text);opacity:.88">rapportés grâce à '+E(brand())+', et '+dec1(g.hours)+NB+'h de travail en moins</div>'+
     '<div class="tm"><div><b class="num">'+dec1(g.hours)+NB+'h</b>gagnées, soit '+eur(g.timeV)+' à '+eur(g.rate)+' de l’heure</div>'+(PLAN?'<div><b class="num">'+(times>=1?times+' fois':'–')+'</b>le prix de la formule '+PLAN.name+' ('+PLAN.price+NB+'€ HT)</div>':'')+'</div></div>'+
    '<div class="card pad stack" style="--g:12px"><div class="gr-h">Le relevé du mois</div><p class="s mut" style="line-height:1.5">Le 1er de chaque mois, ce relevé part par e-mail à la gérante. Vous pouvez le partager à votre associé ou à votre comptable.</p>'+
     '<div class="gr-rule"><div><b>Recevoir le relevé chaque mois</b><small>Le 1er, à 8 h</small></div>'+U.tog(!!c.mail,'gr-mail')+'</div>'+
     '<div class="gr-actions" style="margin-top:auto"><button class="btn" data-csv>'+ICON('download','sm')+'Télécharger</button><button class="btn" data-est>'+ICON('sliders','sm')+'Régler les estimations</button></div></div></div>'+
   '<div class="gr-two"><div class="card"><div class="ch"><h3>Revenus générés</h3><span class="mut">'+eur(g.total)+'</span></div><div style="padding:6px 0">'+(g.lines.length?g.lines.map(function(l){return '<div class="gr-line"><span class="ico sm d-'+l.d+'">'+ICON(l.ic,'sm')+'</span><button class="t" data-go="'+l.go+'" style="text-align:left">'+l.t+'</button><span class="v">'+eur(l.v)+'</span><div class="c">'+l.c+'</div></div>'}).join(''):U.empty('trend','Rien à montrer pour ce mois','Les lignes apparaissent dès qu’une relance est payée, qu’une aide est remboursée ou qu’une carte cadeau est vendue.'))+'</div></div>'+
    '<div class="card"><div class="ch"><h3>Temps gagné</h3><span class="mut">'+dec1(g.hours)+NB+'h</span></div><div style="padding:6px 0">'+(g.hrs.length?g.hrs.map(function(h){return '<div class="gr-line hr0"><span class="ico sm d-tm">'+ICON('clock','sm')+'</span><span class="t">'+cap(h[2])+'</span><span class="v">'+dec1(h[0]*h[1]/60)+NB+'h</span><div class="c"><code>'+h[0]+' × '+h[1]+' min par action</code></div></div>'}).join(''):U.empty('clock','Pas encore de temps gagné ce mois',''))+'</div></div></div>';
  on(el,'[data-mk]',function(b){RS.mk=b.getAttribute('data-mk');P.rerender(true)});
  on(el,'.tog',function(b){var v=b.getAttribute('aria-checked')!=='true';b.setAttribute('aria-checked',v);c.mail=v;P.toast(v?'Relevé envoyé chaque 1er du mois':'Envoi mensuel arrêté')});
  on(el,'[data-csv]',function(){var rows=[['Ligne','Montant','Calcul']];g.lines.forEach(function(l){rows.push([l.t,String(l.v).replace('.',','),l.c.replace(/<[^>]+>/g,'')])});g.hrs.forEach(function(h){rows.push([cap(h[2]),dec1(h[0]*h[1]/60)+' h',h[0]+' × '+h[1]+' min'])});rows.push(['Total encaissé',String(g.total).replace('.',','),'']);rows.push(['Temps gagné',dec1(g.hours)+' h',eur(g.timeV)+' à '+g.rate+' € de l’heure']);
    dl('rapporte-'+RS.mk+'.csv',csv(rows),'text/csv;charset=utf-8');P.toast('Relevé de '+monthName(RS.mk)+' téléchargé',{icon:'download'})});
  on(el,'[data-est]',function(){var U0=[['fact','Une facture préparée et envoyée'],['rel','Une relance'],['sign','Un contrat signé en ligne'],['book','Une réservation en ligne'],['decl','Une aide déclarée'],['sv','Un sondage']];
    P.sheet({title:'Régler les estimations',icon:'sliders',body:'<div class="stack"><p style="line-height:1.5">Le temps gagné se calcule avec ces durées. Mettez les vôtres : le relevé se recalcule.</p>'+U0.map(function(u){return '<div class="gr-rule"><div><b>'+u[1]+'</b><small>minutes gagnées</small></div><input class="in num gr-num" type="number" min="0" max="120" data-u="'+u[0]+'" value="'+c.unit[u[0]]+'" aria-label="'+u[1]+'"></div>'}).join('')+
      '<div class="gr-rule"><div><b>Valeur d’une heure de travail</b><small>en euros</small></div><input class="in num gr-num" type="number" min="0" max="200" data-r value="'+c.rate+'" aria-label="Valeur d’une heure"></div></div>',foot:'<button class="btn pri block" data-ok>'+ICON('check','sm')+'Recalculer</button>'});
    var sh=$('.sheet');on(sh,'[data-ok]',function(){$$('[data-u]',sh).forEach(function(i){c.unit[i.getAttribute('data-u')]=Math.max(0,+i.value||0)});c.rate=Math.max(0,+$('[data-r]',sh).value||0);sh.close();P.toast('Relevé recalculé');P.rerender(true)})});
 }});

/* =====================================================================
   7. Site internet du club
   ===================================================================== */
var SECS=[['hero','Accueil'],['activites','Activités et tarifs'],['planning','Planning et réservation'],['stages','Stages'],['pensions','Pensions'],['equipe','Équipe'],['galerie','Photos'],['avis','Avis'],['horaires','Horaires et accès'],['contact','Contact']];
var SITECFG={slug:'',color:'var(--acc)',title:'',tagline:'Cours, stages et pensions, du baby poney au concours.',cta:'reserver',sections:SECS.map(function(s){return {k:s[0],on:true}}),
  hours:[['Lundi au vendredi','9 h à 20 h'],['Samedi','9 h à 19 h'],['Dimanche','10 h à 17 h']],published:false,publishedAt:null};
var SWATCH=['var(--acc)','var(--hz)','var(--rd)','var(--mo)','var(--ex)','var(--cr)','var(--po)','var(--tm)'];
var CTA={reserver:['Réserver un cours','planning'],payer:['Payer en ligne','card'],offrir:['Offrir un baptême','gift']};
var PHOTOS=[];/* photos ajoutées pendant la session (dans l'appli, elles partent sur le stockage de fichiers du club) */
var WS={dev:'desk'};
function resolveColor(v){if(!/^var\(/.test(v||''))return v||'#2f5bff';try{var s=document.createElement('span');s.style.color=v;(P.app()||document.body).appendChild(s);var c=getComputedStyle(s).color;s.remove();return c}catch(e){return '#2f5bff'}}
function siteHTML(c){var on={};c.sections.forEach(function(s){on[s.k]=s.on});var cta=CTA[c.cta]||CTA.reserver,name=c.title||D.club.name,ini=(name.replace(/^(Écurie|Centre équestre|Poney-club|Club)\s+(des|du|de la|de l’|de)?\s*/i,'')||name).slice(0,1).toUpperCase();
  var gs=D.gStats||{},rating=(cfg('avis',AVCFG).rating)||gs.rating,ph=function(i,il){return PHOTOS[i]?'<img src="'+PHOTOS[i]+'" alt="">':(ILLU[il]?ILLU[il]({size:null,still:true}):'')};
  var tarifs=(D.pfTarifs||[]).filter(function(t){return t.web&&t.p}).slice(0,6);if(!tarifs.length)tarifs=(D.forfaits||[]).filter(function(f){return f.price}).slice(0,6).map(function(f){return {n:f.name,p:f.price,u:''}});
  var dow=D.today.getDay(),next=(D.lessons||[]).slice().sort(function(a,b){var x=(a.dow-dow+7)%7,y=(b.dow-dow+7)%7;return x-y||(a.start<b.start?-1:1)}).filter(function(l){return !(l.dow===dow&&l.start<'09:41')}).slice(0,4);
  var DN=['Dimanche','Lundi','Mardi','Mercredi','Jeudi','Vendredi','Samedi'];
  var h='<div class="gs-nav"><span class="gs-logo">'+E(ini)+'</span><b>'+E(name)+'</b><span class="gs-links"><span>Activités</span><span>Stages</span><span>Pensions</span><span>Contact</span></span><span class="gs-cta">'+ICON(cta[1],'sm')+cta[0]+'</span></div>';
  if(on.hero)h+='<div class="gs-hero"><div><h1>'+E(name)+'</h1><p>'+E(c.tagline)+(D.club.city?' À '+E(D.club.city)+'.':'')+'</p><div class="gr-row wrap"><span class="gs-cta">'+ICON(cta[1],'sm')+cta[0]+'</span><span class="gs-cta alt">'+ICON('gift','sm')+'Offrir</span></div>'+
    '<div class="gs-badges">'+(rating?'<span>'+star('on')+note(rating)+' sur Google</span>':'')+(D.club.ffe?'<span>'+ICON('shield','sm')+E(D.club.ffe)+'</span>':'')+((D.horses||[]).length?'<span>'+ICON('horse','sm')+pl(D.horses.length,'cheval','chevaux')+'</span>':'')+'</div></div><div class="ph0">'+ph(0,'cheval')+'</div></div>';
  if(on.activites&&tarifs.length)h+='<div class="gs-s"><h2>Activités et tarifs</h2><div class="gs-g">'+tarifs.map(function(t){return '<div class="gs-c"><b>'+E(t.n)+'</b><small>'+E(t.u||'')+'</small><span class="p">'+eur(t.p)+'</span></div>'}).join('')+'</div></div>';
  if(on.planning&&next.length)h+='<div class="gs-s"><h2>Les prochains cours</h2><div class="gs-pl">'+next.map(function(l){var left=Math.max(0,l.cap-(l.riders||[]).length);return '<div><b>'+DN[l.dow]+' '+E(l.start.replace(':',' h '))+'</b><span>'+E(l.title)+'<br><small class="mut">'+(left?pl(left,'place libre','places libres'):'Complet, liste d’attente')+'</small></span><span class="gs-cta">'+(left?'Réserver':'M’inscrire')+'</span></div>'}).join('')+'</div></div>';
  if(on.stages&&(D.camps||[]).length)h+='<div class="gs-s"><h2>Stages des vacances</h2><div class="gs-g">'+D.camps.slice(0,3).map(function(s){return '<div class="gs-c"><b>'+E(s.title)+'</b><small>'+F.date(s.from)+' au '+F.date(s.to)+' · '+E(s.level||'')+'</small><span class="p">'+eur(s.price)+'</span></div>'}).join('')+'</div></div>';
  if(on.pensions&&(D.pensionPlans||[]).length)h+='<div class="gs-s"><h2>Pensions</h2><div class="gs-g">'+D.pensionPlans.slice(0,3).map(function(p){return '<div class="gs-c"><b>'+E(p.name)+'</b><small>'+E((p.inc||[]).slice(0,2).join(', '))+'</small><span class="p">'+eur(p.price)+'<small class="mut" style="font:500 13px var(--f-text)"> par mois</small></span></div>'}).join('')+'</div></div>';
  if(on.equipe){var st=(D.staff||[]).filter(function(s){return /Monit|Gérant|Apprenti/i.test(s.role)}).slice(0,4);if(st.length)h+='<div class="gs-s"><h2>L’équipe</h2><div class="gs-g">'+st.map(function(s){return '<div class="gs-c"><div class="gr-row">'+U.av(s.id)+'<div><b>'+E(s.first+' '+s.last)+'</b><br><small>'+E(s.role)+(s.dip?', '+E(s.dip):'')+'</small></div></div></div>'}).join('')+'</div></div>'}
  if(on.galerie)h+='<div class="gs-s"><h2>Le club en photos</h2><div class="gs-gal">'+['cheval','selle','foin','fer'].map(function(il,i){return '<div>'+ph(i+1,il)+'</div>'}).join('')+'</div></div>';
  if(on.avis){var q=arr('gReviews').filter(function(r){return r.rating>=4&&r.google}).slice(0,2);if(q.length)h+='<div class="gs-s"><h2>Ils en parlent</h2><div class="gs-g">'+q.map(function(r){return '<div class="gs-q">'+stars(r.rating)+'<div style="margin-top:6px">« '+E(r.text)+' »</div><small>'+E((mem(r.member)||{}).first||'')+', avis Google</small></div>'}).join('')+'</div></div>'}
  if(on.horaires)h+='<div class="gs-s"><h2>Horaires et accès</h2><div class="gs-ha"><div>'+c.hours.map(function(x){return '<div class="gs-hr"><span>'+E(x[0])+'</span><b>'+E(x[1])+'</b></div>'}).join('')+(D.club.address?'<p style="margin-top:12px">'+E(D.club.address)+'</p>':'')+'</div><div class="gs-map">'+ICON('pin')+'</div></div></div>';
  if(on.contact)h+='<div class="gs-s"><h2>Nous contacter</h2><div class="gr-row wrap">'+(D.club.phone?'<span class="gs-cta alt">'+ICON('phone','sm')+E(D.club.phone)+'</span>':'')+(D.club.email?'<span class="gs-cta alt">'+ICON('mail','sm')+E(D.club.email)+'</span>':'')+'<span class="gs-cta">'+ICON(cta[1],'sm')+cta[0]+'</span></div></div>';
  return h+'<div class="gs-foot"><span>'+E(D.club.name)+(D.club.siret?' · SIRET '+E(D.club.siret):'')+' · Mentions légales</span><span>Site créé avec '+E(brand())+'</span></div>'}
/* fichier HTML autonome : couleurs résolues, sans les jetons de l'application */
function siteFile(c){var sc=resolveColor(c.color),body=siteHTML(c).replace(/<svg class="illu[\s\S]*?<\/svg>/g,'<span></span>');
  var css='*{box-sizing:border-box;margin:0}body{font:16px/1.5 Inter,Arial,sans-serif;color:#0a1636;background:#fff}.gr-site{--sc:'+sc+'}svg.i{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round;vertical-align:-3px}.gr-star{fill:#f2a93b;stroke:none;width:16px;height:16px}.gr-row{display:flex;gap:10px;align-items:center;flex-wrap:wrap}.mut{color:#59627c}'+
   '.gs-nav{display:flex;align-items:center;gap:12px;padding:14px 26px;border-bottom:1px solid #e6e9f0;position:sticky;top:0;background:#fff}.gs-logo{width:36px;height:36px;border-radius:11px;background:var(--sc);color:#fff;display:grid;place-items:center;font-weight:800}.gs-nav b{flex:1;font-size:18px}.gs-links{display:flex;gap:18px;color:#59627c;font-weight:600}.gs-cta{display:inline-flex;align-items:center;gap:8px;padding:11px 18px;border-radius:12px;background:var(--sc);color:#fff;font-weight:700;text-decoration:none}.gs-cta.alt{background:transparent;color:#0a1636;box-shadow:inset 0 0 0 1.5px #d6dbe6}'+
   '.gs-hero{display:grid;grid-template-columns:1.1fr 1fr;gap:26px;align-items:center;padding:48px 26px}.gs-hero h1{font-size:44px;line-height:1.05}.gs-hero p{color:#59627c;margin:12px 0 20px}.ph0{aspect-ratio:4/3;border-radius:22px;background:#f2f4f8;overflow:hidden}.ph0 img,.gs-gal img{width:100%;height:100%;object-fit:cover}.gs-badges{display:flex;gap:16px;margin-top:20px;font-weight:600}'+
   '.gs-s{padding:34px 26px;border-top:1px solid #e6e9f0;max-width:1100px;margin:auto}.gs-s h2{font-size:28px;margin-bottom:16px}.gs-g{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}.gs-c,.gs-q{border-radius:18px;padding:16px;background:#f5f6fa;display:flex;flex-direction:column;gap:6px}.gs-c small,.gs-q small{color:#59627c}.p{font-size:22px;font-weight:800;color:var(--sc)}.gs-pl>div{display:grid;grid-template-columns:130px 1fr auto;gap:12px;align-items:center;padding:10px 0;border-bottom:1px solid #e6e9f0}.gs-gal{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}.gs-gal>div{aspect-ratio:1;border-radius:16px;background:#f2f4f8;overflow:hidden}.gs-ha{display:grid;grid-template-columns:1fr 1fr;gap:18px}.gs-hr{display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e6e9f0}.gs-map{border-radius:18px;min-height:180px;background:#f2f4f8;display:grid;place-items:center;color:var(--sc)}.gs-foot{padding:20px 26px;color:#59627c;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;background:#f5f6fa}.av{width:38px;height:38px;border-radius:50%;display:inline-grid;place-items:center;background:var(--sc);color:#fff;font-weight:700;font-size:13px}'+
   '@media(max-width:700px){.gs-links{display:none}.gs-hero,.gs-ha{grid-template-columns:1fr}.gs-g{grid-template-columns:1fr}.gs-gal{grid-template-columns:repeat(2,1fr)}.gs-hero h1{font-size:32px}}';
  return '<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+E(c.title||D.club.name)+'</title><meta name="description" content="'+E(c.tagline)+'"><style>'+css+'</style></head><body><div class="gr-site">'+body.replace(/style="--c:[^"]*"/g,'')+'</div></body></html>'}
P.mod({id:'site',role:'gerant',group:'Croissance',n:10,title:'Site du club',icon:'globe',phoneTitle:'Site du club',
 render:function(el,ctx){var c=site0();if(!c.title)c.title=D.club.name;if(ctx.mobile&&WS.dev==='desk'&&!WS.touched)WS.dev='phone';
  var url=host();
  el.innerHTML=U.ph('Site du club','Un vrai site en quelques minutes : vos activités, vos tarifs, le planning et la réservation en ligne. Vous changez un texte, il est à jour partout.',
    '<button class="btn" data-emb>'+ICON('code','sm')+'Bloc pour WordPress ou Wix</button><button class="btn pri" data-pub>'+ICON(c.published?'refresh':'send','sm')+(c.published?'Mettre à jour le site':'Publier le site')+'</button>')+
   '<div class="gr-ed"><div class="card gr-pane">'+
    '<h4>Adresse du site</h4><div class="gr-addr"><input data-slug value="'+E(c.slug)+'" aria-label="Nom du site" spellcheck="false"><span>.stablapp.fr</span></div>'+
    '<div class="gr-row sp" style="margin-top:-6px"><span class="xs mut">'+(c.published?'En ligne depuis le '+F.dateY(c.publishedAt):'Pas encore publié')+'</span>'+(c.published?U.chip('En ligne','ok',true):U.chip('Brouillon','',true))+'</div>'+
    '<h4>Nom et accroche</h4><input class="in" data-title value="'+E(c.title)+'" aria-label="Nom affiché"><textarea class="in" data-tag rows="2" style="min-height:70px" aria-label="Accroche">'+E(c.tagline)+'</textarea>'+
    '<h4>Couleur du club</h4><div class="gr-sw">'+SWATCH.map(function(s){return '<button style="--c:'+s+'" data-col="'+s+'" aria-pressed="'+(c.color===s)+'" title="Choisir cette couleur"></button>'}).join('')+'<label title="Couleur personnalisée" style="'+(SWATCH.indexOf(c.color)<0?'box-shadow:0 0 0 3px var(--surface),0 0 0 5px '+E(c.color)+';background:'+E(c.color):'')+'">'+ICON('palette','sm')+'<input type="color" data-colx value="'+(/^#/.test(c.color)?E(c.color):'#2f5bff')+'" aria-label="Couleur personnalisée"></label></div>'+
    '<h4>Bouton principal</h4>'+U.seg(Object.keys(CTA).map(function(k){return [k,CTA[k][0].split(' ')[0]]}),c.cta,'data-cta')+
    '<h4>Sections</h4><div class="gr-secs">'+c.sections.map(function(s,i){var lb=(SECS.find(function(x){return x[0]===s.k})||[0,s.k])[1];return '<div class="gr-sec'+(s.on?'':' off')+'"><span class="ico sm">'+ICON({hero:'today',activites:'tag',planning:'planning',stages:'calendar_add',pensions:'stable',equipe:'team',galerie:'image',avis:'star',horaires:'clock',contact:'phone'}[s.k]||'doc','sm')+'</span><span>'+lb+'</span>'+
      '<span class="gr-row" style="gap:2px"><button class="btn ghost icon sm" data-up="'+i+'" title="Monter"'+(i?'':' disabled')+'>'+ICON('up','sm')+'</button><button class="btn ghost icon sm" data-dn="'+i+'" title="Descendre"'+(i<c.sections.length-1?'':' disabled')+'>'+ICON('down','sm')+'</button></span>'+U.tog(s.on,'gr-s-'+s.k)+'</div>'}).join('')+'</div>'+
    '<h4>Photos</h4><div class="gr-row wrap"><label class="btn sm" style="cursor:pointer">'+ICON('upload','sm')+'Ajouter des photos<input type="file" accept="image/*" multiple data-ph hidden></label><span class="xs mut">'+(PHOTOS.length?pl(PHOTOS.length,'photo')+' ajoutée'+(PHOTOS.length>1?'s':''):'La première devient la photo d’accueil')+'</span></div>'+
    '<h4>Horaires</h4><div class="gr-hours">'+c.hours.map(function(x,i){return '<input class="in" data-hk="'+i+'" value="'+E(x[0])+'" aria-label="Jours"><input class="in" data-hv="'+i+'" value="'+E(x[1])+'" aria-label="Heures">'}).join('')+'</div>'+
   '</div><div class="gr-prev"><div class="gr-row sp wrap">'+U.seg([['desk',ICON('grid','sm')+'Ordinateur'],['phone',ICON('phone','sm')+'Téléphone']],WS.dev,'data-dev2')+'<div class="gr-actions"><button class="btn sm ghost" data-dlsite>'+ICON('download','sm')+'Télécharger le site</button><button class="btn sm ghost" data-open>'+ICON('ext','sm')+'Ouvrir</button></div></div><div data-pv></div></div></div>';
  var pv=$('[data-pv]',el);
  function prev(anim){var inner='<div class="gr-site" style="--sc:'+E(c.color)+'">'+siteHTML(c)+'</div>',h=WS.dev==='desk'?'<div class="gr-browser"><div class="gr-bbar"><i></i><i></i><i></i><span>'+ICON('lock','sm')+E(url)+'</span></div><div class="gr-frame">'+inner+'</div></div>':'<div class="gr-pwrap"><div class="gr-phone"><div class="gr-scr">'+inner+'</div></div></div>';
    if(anim)swap(pv,h);else pv.innerHTML=h}
  prev(false);
  var tm=0;function soon(){clearTimeout(tm);tm=setTimeout(function(){prev(false)},140)}
  $('[data-slug]',el).addEventListener('input',function(e){var v=slug(e.target.value).slice(0,40);c.slug=v||c.slug;url=host();var bb=$('.gr-bbar span',pv);if(bb)bb.innerHTML=ICON('lock','sm')+E(url)});
  $('[data-slug]',el).addEventListener('change',function(e){e.target.value=c.slug;P.toast('Adresse disponible : '+host(),{icon:'globe'})});
  $('[data-title]',el).addEventListener('input',function(e){c.title=e.target.value;soon()});
  $('[data-tag]',el).addEventListener('input',function(e){c.tagline=e.target.value;soon()});
  $$('[data-hk],[data-hv]',el).forEach(function(i){i.addEventListener('input',function(){var k=i.getAttribute('data-hk'),v=i.getAttribute('data-hv');if(k!=null)c.hours[+k][0]=i.value;else c.hours[+v][1]=i.value;soon()})});
  on(el,'[data-col]',function(b){c.color=b.getAttribute('data-col');P.rerender(true)});
  $('[data-colx]',el).addEventListener('change',function(e){c.color=e.target.value;P.rerender(true)});
  on(el,'[data-cta]',function(b){c.cta=b.getAttribute('data-cta');$$('[data-cta]',el).forEach(function(x){x.setAttribute('aria-selected',x===b)});prev(false)});
  on(el,'.gr-sec .tog',function(b){var k=b.id.replace('gr-s-',''),s=c.sections.find(function(x){return x.k===k});s.on=b.getAttribute('aria-checked')!=='true';b.setAttribute('aria-checked',s.on);b.closest('.gr-sec').classList.toggle('off',!s.on);prev(false)});
  function mv(i,d){var a=c.sections,j=i+d;if(j<0||j>=a.length)return;var t=a[i];a[i]=a[j];a[j]=t;P.rerender(true)}
  on(el,'[data-up]',function(b){mv(+b.getAttribute('data-up'),-1)});on(el,'[data-dn]',function(b){mv(+b.getAttribute('data-dn'),1)});
  $('[data-ph]',el).addEventListener('change',function(e){var fs=[].slice.call(e.target.files||[]).filter(function(f){return /^image\//.test(f.type)}).slice(0,5);fs.forEach(function(f){try{PHOTOS.push(URL.createObjectURL(f))}catch(x){}});if(fs.length){P.toast(pl(fs.length,'photo')+' ajoutée'+(fs.length>1?'s':''),{icon:'image'});P.rerender(true)}});
  on(el,'[data-dev2]',function(b){WS.dev=b.getAttribute('data-dev2');WS.touched=true;$$('[data-dev2]',el).forEach(function(x){x.setAttribute('aria-selected',x===b)});prev(true)});
  on(el,'[data-pub]',function(){var first=!c.published;c.published=true;c.publishedAt=c.publishedAt||tIso();P.toast(first?'Site publié sur '+host():'Site mis à jour',{icon:'globe'});P.rerender(true)});
  on(el,'[data-emb]',function(){embedSheet()});
  on(el,'[data-dlsite]',function(){dl(c.slug+'.html',siteFile(c),'text/html;charset=utf-8');P.toast('Site téléchargé : '+c.slug+'.html',{icon:'download'})});
  on(el,'[data-open]',function(){try{var w=window.open('','_blank');if(w){w.document.write(siteFile(c));w.document.close()}else P.toast('Autorisez les fenêtres pour ouvrir l’aperçu',{icon:'info'})}catch(e){P.toast('Aperçu impossible dans ce navigateur',{icon:'info'})}});
 }});
function embedSheet(){var h=host(),js='<script src="https://'+h+'/bloc.js" async></'+'script>\n<div data-stabl="reserver"></div>',ifr='<iframe src="https://'+h+'/reserver?integre=1" title="Réserver au club" loading="lazy" style="width:100%;min-height:720px;border:0"></iframe>';
  P.sheet({title:'Installer la réservation sur votre site',icon:'code',wide:true,body:'<div class="stack"><p style="line-height:1.5">Vous gardez votre site actuel ? Collez ce bloc là où vous voulez le bouton de réservation. Les cavaliers réservent et paient sans quitter votre site.</p>'+
   '<div class="gr-row sp"><b>Bloc de réservation (conseillé)</b><button class="btn sm" data-c1>'+ICON('copy','sm')+'Copier</button></div><div class="gr-code">'+E(js)+'</div>'+
   '<div class="gr-row sp"><b>Ou en cadre simple</b><button class="btn sm" data-c2>'+ICON('copy','sm')+'Copier</button></div><div class="gr-code">'+E(ifr)+'</div>'+
   '<div class="g3" style="--g:10px">'+[['WordPress','Ajoutez un bloc « HTML personnalisé » et collez le code.'],['Wix','« Ajouter », puis « Intégrer du code », puis « Code HTML personnalisé ».'],['Squarespace ou autre','Un bloc « Code » ou « HTML » suffit.']].map(function(x){return '<div class="gr-q"><b>'+x[0]+'</b><span class="s mut">'+x[1]+'</span></div>'}).join('')+'</div>'+
   '<div class="note">'+ICON('info','sm')+'<span>Le bloc prend les couleurs de votre club et s’adapte au téléphone. Il fonctionne dès que votre site Stabl est publié.</span></div></div>',
   foot:'<button class="btn pri block" data-c1b>'+ICON('copy','sm')+'Copier le bloc de réservation</button>'});
  var sh=$('.sheet');on(sh,'[data-c1],[data-c1b]',function(){copy(js,'Bloc copié : collez-le sur votre site')});on(sh,'[data-c2]',function(){copy(ifr,'Cadre copié')})}

/* =====================================================================
   Face adhérent : Avantages (parrainage, carte cadeau, aides, sondage)
   ===================================================================== */
P.mod({id:'adh-avantages',role:'adherent',group:'Compte',n:60,title:'Avantages',icon:'gift',phoneTitle:'Avantages',
 render:function(el,ctx){var me=(ctx.me&&ctx.me.id)||(D.me&&D.me.adherent),m=mem(me)||{},F0=fam(D.member(me)),kids=F0.filter(function(x){return x.age>=6&&x.age<=17}),code=refCode(me);
  var mine=arr('referrals').filter(function(r){return r.by===me}),won=mine.filter(function(r){return r.status==='recompense'}).length,myAids=arr('aids').filter(function(a){return F0.some(function(x){return x.id===a.member})||a.member===me});
  var sv=arr('surveys').find(function(s){return (s.answers||[]).some(function(a){return a.member===me&&a.pending})})||arr('surveys').find(function(s){return (s.answers||[]).some(function(a){return a.member===me})});
  var myAns=sv&&((sv.answers||[]).find(function(a){return a.member===me&&a.pending})||(sv.answers||[]).find(function(a){return a.member===me}));
  var off=cfg('cadeaux',GCCFG).ref===false;
  el.innerHTML=U.ph('Avantages','Parrainez un ami, offrez une carte cadeau, faites déduire vos aides.')+
   '<div class="gr-adh rise">'+
    (off?'':'<div class="card pad tint d-ex"><div class="gr-row"><span class="ico">'+ICON('members')+'</span><div><div class="gr-h">Parrainez un ami</div><div class="s" style="opacity:.85">Une séance offerte pour vous et pour lui, à son inscription.</div></div></div>'+
     '<div class="gr-big-code gr-mono num">'+E(code)+'</div><div class="gr-actions"><button class="btn" data-cp>'+ICON('copy','sm')+'Copier le lien</button><button class="btn" data-sh>'+ICON('send','sm')+'Envoyer à un ami</button></div>'+
     '<div class="s" style="opacity:.85">'+(mine.length?pl(mine.length,'ami parrainé','amis parrainés')+(won?' · '+pl(won,'séance offerte gagnée','séances offertes gagnées'):''):'Aucun ami parrainé pour l’instant.')+'</div></div>')+
    '<div class="card pad"><div class="gr-row"><span class="ico d-mo">'+ICON('gift')+'</span><div><div class="gr-h">Offrir une carte cadeau</div><div class="s mut">Baptême, balade, carte de séances ou montant libre.</div></div></div>'+
     '<div class="d-ex" style="display:flex;justify-content:center"><div class="gr-gc" style="max-width:280px"><span>'+E(D.club.short||D.club.name)+'</span><div><b>'+eur((gcProducts()[0]||['',12])[1])+'</b><div><span>'+E((gcProducts()[0]||['Baptême à poney'])[0])+'</span></div></div><span class="c">Bon envoyé par e-mail</span></div></div>'+
     '<button class="btn pri block" data-gift>'+ICON('card','sm')+'Choisir et payer</button></div>'+
    '<div class="card pad"><div class="gr-row"><span class="ico d-rd">'+ICON('ticket')+'</span><div><div class="gr-h">Mes aides</div><div class="s mut">Pass’Sport, chèques-vacances, CAF, CSE : déduits de vos factures.</div></div></div>'+
     (myAids.length?'<div class="stack" style="--g:8px">'+myAids.map(function(a){var K=KINDS[a.kind]||{t:a.kind,steps:['Déduite','Envoyée','Payée']};return '<div class="gr-row sp"><span class="s"><b>'+K.t+'</b> · '+E((mem(a.member)||{}).first||'')+'</span><span class="gr-row" style="gap:10px"><b class="num">−'+NB+eur(a.amount)+'</b>'+U.chip('Déduite','ok')+'</span></div>'}).join('')+'</div>':'')+
     '<label class="field"><span>Code Pass’Sport'+(kids.length?' pour':'')+'</span>'+(kids.length?'<select class="in" data-kid>'+kids.map(function(k){return '<option value="'+k.id+'">'+E(k.first)+' ('+k.age+' ans)</option>'}).join('')+'</select>':'')+'<input class="in gr-mono" data-psc placeholder="PS26-XXXX-XXXX" autocomplete="off"></label>'+
     (kids.length?'':'<p class="xs mut" style="line-height:1.45">Le Pass’Sport concerne les enfants de 6 à 17 ans. Ajoutez-les à votre famille depuis votre profil pour utiliser leur code.</p>')+
     '<div class="gr-actions"><button class="btn" data-psok'+(kids.length?'':' disabled')+'>'+ICON('check','sm')+'Envoyer le code au club</button><label class="btn ghost" style="cursor:pointer">'+ICON('upload','sm')+'Attestation CAF ou CSE<input type="file" data-att hidden accept="image/*,application/pdf"></label></div></div>'+
    (sv&&myAns?'<div class="card pad" data-svc><div class="gr-row"><span class="ico d-ex">'+ICON('checkc')+'</span><div><div class="gr-h">Votre avis sur le stage</div><div class="s mut">'+E(sv.title)+' · une minute</div></div></div>'+
     (myAns.pending?'<div class="gr-q2"><b>Dans l’ensemble, comment s’est passé le stage ?</b><div class="row" data-r="global">'+[1,2,3,4,5].map(function(i){return '<button data-v="'+i+'" title="'+i+' étoile'+(i>1?'s':'')+'">'+star('')+'</button>'}).join('')+'</div></div>'+
      '<div class="gr-q2"><b>Comment avez-vous trouvé '+E(D.name(sv.coach)||'le moniteur')+' ?</b><div class="row" data-r="coach">'+[1,2,3,4,5].map(function(i){return '<button data-v="'+i+'" title="'+i+' étoile'+(i>1?'s':'')+'">'+star('')+'</button>'}).join('')+'</div></div>'+
      '<div class="gr-q2"><b>Reviendriez-vous à un prochain stage ?</b>'+U.seg([['1','Oui'],['0','Non']],'1','data-ag')+'</div><textarea class="in" rows="2" style="min-height:70px" data-tx placeholder="Un mot pour l’équipe (facultatif)"></textarea><button class="btn pri block" data-svok>'+ICON('send','sm')+'Envoyer mon avis</button>':
      '<div class="note ok">'+ICON('checkc','sm')+'<span>Merci, votre avis a bien été transmis à l’équipe.</span></div>')+'</div>':'')+
   '</div>';
  on(el,'[data-cp]',function(){copy('https://'+host()+'/parrain/'+code,'Lien de parrainage copié')});
  on(el,'[data-sh]',function(){var t='Viens monter avec moi à '+(D.club.short||D.club.name)+' ! Avec mon code '+code+', ta première séance est offerte : https://'+host()+'/parrain/'+code;
    if(navigator.share){navigator.share({title:'Parrainage',text:t}).catch(function(){})}else copy(t,'Message copié : collez-le dans un SMS')});
  on(el,'[data-gift]',function(){buySheet(false)});
  on(el,'[data-psok]',function(){var inp=$('[data-psc]',el),v=inp.value.trim().toUpperCase(),kid=$('[data-kid]',el);
    if(!/^PS\d{2}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(v)){P.toast('Le code ressemble à PS26-AB12-CD34 : vérifiez-le',{icon:'info'});inp.focus();return}
    arr('aids').push({id:idx(arr('aids'),'ai'),kind:'passsport',member:kid.value,amount:cfg('aides',AIDCFG).ps.amount,code:v,date:tIso(),status:'deduit',declaredAt:null,paidAt:null});
    P.toast('Code envoyé : 50 € déduits de la prochaine facture');P.rerender(true)});
  var att=$('[data-att]',el);if(att)att.addEventListener('change',function(){if(att.files&&att.files.length)P.toast('Attestation envoyée à l’accueil',{icon:'upload'})});
  var svc=$('[data-svc]',el);if(svc&&myAns&&myAns.pending){var pick={global:0,coach:0},ag=true;
    $$('[data-r]',svc).forEach(function(row){var k=row.getAttribute('data-r');on(row,'[data-v]',function(b){pick[k]=+b.getAttribute('data-v');$$('[data-v]',row).forEach(function(x){x.innerHTML=star(+x.getAttribute('data-v')<=pick[k]?'on':'')})})});
    on(svc,'[data-ag]',function(b){ag=b.getAttribute('data-ag')==='1';$$('[data-ag]',svc).forEach(function(x){x.setAttribute('aria-selected',x===b)})});
    on(svc,'[data-svok]',function(){if(!pick.global){P.toast('Touchez une étoile pour noter le stage',{icon:'info'});return}myAns.global=pick.global;myAns.coach=pick.coach||pick.global;myAns.again=ag;myAns.text=$('[data-tx]',svc).value.trim();myAns.pending=false;P.toast('Merci pour votre avis');P.rerender(true)})}
 }});

/* =====================================================================
   Palette ⌘K, assistant, visite
   ===================================================================== */
P.actions.push({role:'gerant',label:'Déclarer les codes Pass’Sport',icon:'percent',run:function(){P.go('aides');setTimeout(declare,350)}});
P.actions.push({role:'gerant',label:'Inscrire avec des aides',icon:'percent',run:function(){P.go('aides');setTimeout(function(){newSheet()},350)}});
P.actions.push({role:'gerant',label:'Classer une prestation (TVA)',icon:'accounting',run:function(){P.go('tva');setTimeout(function(){var i=$('[data-q]');if(i)i.focus()},400)}});
P.actions.push({role:'gerant',label:'Vendre une carte cadeau',icon:'gift',run:function(){P.go('cadeaux');setTimeout(function(){buySheet(true)},350)}});
P.actions.push({role:'gerant',label:'Envoyer un sondage de fin de stage',icon:'checkc',run:function(){P.go('sondages');setTimeout(sendSheet,350)}});
P.actions.push({role:'gerant',label:'Publier le site du club',icon:'globe',run:function(){P.go('site')}});
P.brain.push({role:'gerant',re:/pass.?sport|aide|ancv|ch[eè]ques?.vacances|caf\b|cse/i,reply:function(){var ps=aids('passsport'),d=ps.filter(function(a){return a.status==='deduit'}),w=aids().filter(function(a){return a.status!=='rembourse'});
  return {text:ps.length?pl(ps.length,'code')+' Pass’Sport déduits cette saison ('+eur(sum(ps))+'). '+(d.length?pl(d.length,'code')+' reste'+(d.length>1?'nt':'')+' à déclarer sur Le Compte Asso avant le 31 décembre. ':'Tous sont déclarés. ')+'Au total, '+eur(sum(w))+' d’aides attendent leur paiement.':'Aucun code Pass’Sport saisi pour l’instant.',actions:d.length?[{label:'Déclarer les codes',run:function(){P.go('aides');setTimeout(declare,350);return 'Liste ouverte'}}]:[{label:'Ouvrir les aides',run:function(){P.go('aides');return 'Ouvert'}}]}}});
P.brain.push({role:'gerant',re:/tva|taux/i,reply:function(){var b=catalogue().filter(function(o){return o.k&&!o.ok});return {text:'Cours, balades, demi-pension, accès aux installations et pension d’un cheval monté par son propriétaire : 5,5 %. Pension de retraite, location de box sans entretien, débourrage, vente : 20 % (BOFiP, BOI-TVA-SECT-80-10-30-50). '+(b.length?pl(b.length,'tarif')+' du club '+(b.length>1?'sont':'est')+' à vérifier.':'Tous vos tarifs ont le bon taux.'),actions:[{label:'Voir la TVA',run:function(){P.go('tva');return 'Ouvert'}}]}}});
P.brain.push({role:'gerant',re:/avis|google|note/i,reply:function(){var t=arr('gReviews').filter(function(r){return r.status==='a_traiter'}),g=D.gStats||{};return {text:(g.rating?'Note Google : '+note(g.rating)+' sur '+pl(g.count,'avis')+'. ':'')+(t.length?pl(t.length,'message privé')+' à lire en premier.':'Aucun message mécontent à traiter.'),actions:[{label:'Ouvrir les avis',run:function(){P.go('avis');return 'Ouvert'}}]}}});
P.brain.push({role:'gerant',re:/rapport[ée]|gagn[ée]|rentab/i,reply:function(){var g=gains(monthKey(tIso()));return {text:'Ce mois-ci, '+brand()+' vous a rapporté '+eur(g.total)+' et gagner '+dec1(g.hours)+' h de travail. Chaque ligne a son calcul.',actions:[{label:'Voir le relevé',run:function(){P.go('rapporte');return 'Ouvert'}}]}}});
P.brain.push({role:'gerant',re:/cadeau|parrain/i,reply:function(){var G=arr('giftcards'),r=arr('referrals').filter(function(x){return x.status==='inscrit'});return {text:pl(G.length,'carte cadeau','cartes cadeaux')+', '+eur(G.reduce(function(s,g){return s+(+g.rest||0)},0))+' de solde à utiliser. '+(r.length?pl(r.length,'filleul inscrit')+' attend'+(r.length>1?'ent':'')+' sa séance offerte.':''),actions:[{label:'Ouvrir',run:function(){P.go('cadeaux');return 'Ouvert'}}]}}});
P.brain.push({role:'gerant',re:/site|wordpress|wix/i,reply:function(){var c=site0();return {text:c.published?'Votre site est en ligne sur '+host()+'.':'Votre site est prêt à publier sur '+host()+' : activités, tarifs, planning et réservation en ligne.',actions:[{label:'Ouvrir le site',run:function(){P.go('site');return 'Ouvert'}}]}}});
P.tourSteps.push({route:'rapporte',title:'Ce que '+brand()+' vous rapporte',text:'Chaque mois, l’argent récupéré et les heures gagnées, avec le calcul de chaque chiffre.'});
})();
