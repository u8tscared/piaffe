/* Lot F · Coachs et compétitions (vue gérant) + toute la vue Coach
   Écrans : coachs, competitions, coach-agenda, coach-eleves, coach-dispo, coach-revenus, coach-concours, coach-profil */
(function(){
var D=P.D,F=P.fmt,U=P.ui,C=P.chart,E=F.esc,I=function(n,k){return ICON(n,k)};

/* =====================================================================
   Données propres au lot
   ===================================================================== */
var iso=D.iso,day=D.day;
D.coachDeals=D.coachDeals||{
 c01:{mode:'commission',pct:15,card:'07826ED0142',cardTo:'2029-06-30',ins:'Generali Équi-Pro',insTo:'2027-03-14',dip:'DEJEPS CSO',arenas:['a1','a2'],since:2024,n:38,ca:2090},
 c02:{mode:'passage',fee:12,card:'07819ED0077',cardTo:'2028-01-31',ins:'Cavalassur',insTo:iso(day(12)),dip:'DESJEPS dressage',arenas:['a1','a2','a3'],since:2023,n:22,ca:1430},
 c03:{mode:'piste',fee:90,card:'09122ED0311',cardTo:'2030-09-30',ins:'Equitanet',insTo:'2027-08-01',dip:'BPJEPS, BFEE 2',arenas:['a3','a4'],since:2025,n:14,ca:630},
 c04:{mode:'commission',pct:15,card:'04519ED0029',cardTo:'2027-05-31',ins:'Generali Équi-Pro',insTo:'2027-01-20',dip:'DEJEPS CCE',arenas:['a2'],since:2026,n:9,ca:540},
 c05:{mode:'interne',pct:20,n:31,ca:1178},
 c06:{mode:'interne',pct:20,n:26,ca:1170}};
D.coachBookings=D.coachBookings||[
 {id:'b01',coach:'c01',riders:['m001'],horse:'h01',d:0,t:'11:15',dur:60,arena:'a2',type:'Cours particulier CSO',price:55,pay:'Payé en ligne',status:'confirmée'},
 {id:'b02',coach:'c01',riders:['m047','m078','m066'],horse:null,d:0,t:'12:15',dur:60,arena:'a2',type:'Collectif propriétaires',price:75,pay:'Payé en ligne',status:'confirmée'},
 {id:'b03',coach:'c02',riders:['m078'],horse:'h32',d:0,t:'14:00',dur:60,arena:'a1',type:'Dressage, travail sur le plat',price:65,pay:'Acompte 30 %',status:'confirmée'},
 {id:'b04',coach:'c02',riders:['m023'],horse:'h27',d:0,t:'15:00',dur:60,arena:'a1',type:'Dressage, reprise Amateur 3',price:65,pay:'Payé en ligne',status:'confirmée'},
 {id:'b05',coach:'c03',riders:['m031'],horse:'h28',d:0,t:'15:00',dur:45,arena:'a4',type:'Travail à pied',price:45,pay:'Payé en ligne',status:'confirmée'},
 {id:'b06',coach:'c05',riders:['m044'],horse:'h02',d:0,t:'17:00',dur:45,arena:'a3',type:'Cours particulier Galop 5',price:38,pay:'Carte 10 séances',status:'confirmée'},
 {id:'b07',coach:'c04',riders:['m052'],horse:'h30',d:0,t:'18:00',dur:60,arena:'a2',type:'Gymnastique à l’obstacle',price:60,pay:'Acompte 30 %',status:'à confirmer'},
 {id:'b08',coach:'c01',riders:['m014'],horse:'h26',d:1,t:'10:00',dur:60,arena:'a2',type:'Cours particulier CSO',price:55,pay:'Acompte 30 %',status:'à confirmer'},
 {id:'b09',coach:'c02',riders:['m001'],horse:'h01',d:1,t:'15:00',dur:60,arena:'a2',type:'Dressage, assouplissements',price:65,pay:'Payé en ligne',status:'confirmée'},
 {id:'b10',coach:'c06',riders:['m019'],horse:'h01',d:1,t:'18:00',dur:60,arena:'a3',type:'Cours particulier CSO',price:45,pay:'Payé en ligne',status:'confirmée'},
 {id:'b11',coach:'c03',riders:['m091'],horse:'h22',d:2,t:'14:30',dur:45,arena:'a4',type:'Jeune cheval, désensibilisation',price:45,pay:'Payé en ligne',status:'confirmée'},
 {id:'b12',coach:'c01',riders:['m066'],horse:'h31',d:3,t:'16:30',dur:60,arena:'a2',type:'Cours particulier CSO',price:55,pay:'Payé en ligne',status:'confirmée'},
 {id:'b13',coach:'c04',riders:['m102'],horse:'h23',d:4,t:'10:30',dur:60,arena:'a2',type:'Préparation au cross',price:60,pay:'Acompte 30 %',status:'à confirmer'},
 {id:'b14',coach:'c02',riders:['m117'],horse:'h24',d:4,t:'14:00',dur:60,arena:'a3',type:'Dressage',price:65,pay:'Payé en ligne',status:'confirmée'},
 {id:'b15',coach:'c01',riders:['m001'],horse:'h01',d:-3,t:'16:30',dur:60,arena:'a2',type:'Cours particulier CSO',price:55,pay:'Payé en ligne',status:'terminée'},
 {id:'b16',coach:'c02',riders:['m078'],horse:'h32',d:-2,t:'11:00',dur:60,arena:'a1',type:'Dressage',price:65,pay:'Payé en ligne',status:'terminée'},
 {id:'b17',coach:'c03',riders:['m031'],horse:'h28',d:-1,t:'10:00',dur:45,arena:'a4',type:'Travail à pied',price:45,pay:'Acompte conservé',status:'annulée'}];
D.coachReviews=D.coachReviews||[
 {id:'r1',coach:'c01',by:'m001',stars:5,when:'il y a 3 j',text:'Pauline a trouvé en deux séances pourquoi Ulysse se précipitait sur les oxers. Explications claires, exercices à refaire seule.',pub:true},
 {id:'r2',coach:'c02',by:'m078',stars:5,when:'il y a 5 j',text:'Un œil de juge. On a gagné quatre points sur la reprise Amateur 3 en un mois.',pub:true},
 {id:'r3',coach:'c03',by:'m031',stars:5,when:'la semaine dernière',text:'Caramel monte enfin dans le van sans stress. Merci Sophie.',pub:true},
 {id:'r4',coach:'c04',by:'m052',stars:4,when:'la semaine dernière',text:'Très bonne séance de gymnastique. Le créneau a commencé dix minutes en retard.',pub:false,reply:''},
 {id:'r5',coach:'c06',by:'m019',stars:5,when:'il y a 2 sem.',text:'Thomas met en confiance, j’ai sauté mon premier parcours à 95 cm.',pub:true},
 {id:'r6',coach:'c01',by:'m066',stars:5,when:'il y a 2 sem.',text:'Préparation de concours au cordeau : reconnaissance, détente, tout est prévu.',pub:true}];
D.coachRules=D.coachRules||{cancel:'24',deposit:30,manual:true,commission:15,passage:12,piste:90,docs:true,extArenas:['a2','a3','a4'],from:'9 h',to:'17 h'};
var DEAL=D.coachDeals,BOOK=D.coachBookings,RULES=D.coachRules;

/* =====================================================================
   Outils communs
   ===================================================================== */
function hm(t){var a=String(t).split(':');return +a[0]*60+ +a[1]}
function tc(m){m=((m%1440)+1440)%1440;var h=Math.floor(m/60),x=m%60;return (h<10?'0':'')+h+':'+(x<10?'0':'')+x}
function th(m){var h=Math.floor(m/60),x=m%60;return h+' h'+(x?' '+(x<10?'0':'')+x:'')}
function dur(m){return m<60?m+' min':th(m)}
function nm(i){return D.name(i)}
function fst(i){var p=D.person(i);return p?p.first:''}
function arena(i){return (D.club.arenas.find(function(a){return a.id===i})||{}).name||''}
var DWS=['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
function dlab(off){var d=day(off);return DWS[d.getDay()]+' '+d.getDate()}
function act(root,map){root.addEventListener('click',function(e){var b=e.target.closest('[data-a]');if(!b||!root.contains(b))return;var f=map[b.getAttribute('data-a')];if(f)f(b,e)})}
function stars(v){var h='<span class="fx-stars" title="'+String(v).replace('.',',')+' sur 5">';for(var i=1;i<=5;i++)h+='<svg class="i sm'+(i<=Math.round(v)?'':' off')+'" viewBox="0 0 24 24"><path d="M12 3.6l2.6 5.3 5.8.8-4.2 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.6 9.700l5.800-.8z"/></svg>';return h+'</span>'}
function rate(v){return String(v.toFixed(1)).replace('.',',')}
function stat(l,v,s,cnt,fmt){return '<div class="fx-st"><span class="xs mut">'+l+'</span><b class="num">'+(cnt!=null?'<span data-count="'+cnt+'" data-fmt="'+(fmt||'')+'">'+v+'</span>':v)+'</b>'+(s?'<span class="xs mut">'+s+'</span>':'')+'</div>'}
function stats(a){return '<div class="card fx-stats">'+a.join('')+'</div>'}
function goOr(route,msg,params){if(P.mods[route])P.go(route,params);else P.toast(msg,{icon:'info'})}
function sq(icon,c){return '<span class="av sq" style="--c:var(--'+(c||'acc')+'-pale);color:var(--'+(c||'acc')+')">'+I(icon)+'</span>'}
function sec(t,r){return '<div class="hrow sp fx-sec"><h4>'+t+'</h4>'+(r||'')+'</div>'}
function row(l,v){return '<div class="hrow sp fx-row"><span class="mut s">'+l+'</span><span class="s b" style="text-align:right">'+v+'</span></div>'}
function stepper(id,v,unit){return '<span class="fx-step" data-step="'+id+'"><button class="btn icon sm" data-d="-1" title="Diminuer">'+I('minus','sm')+'</button><b class="num"><span data-v>'+v+'</span>'+(unit?' '+unit:'')+'</b><button class="btn icon sm" data-d="1" title="Augmenter">'+I('plus','sm')+'</button></span>'}
function bindSteps(root,step,cb){root.addEventListener('click',function(e){var b=e.target.closest('.fx-step button');if(!b)return;var w=b.parentNode,sp=w.querySelector('[data-v]'),v=Math.max(0,parseFloat(sp.textContent)+(+b.getAttribute('data-d'))*(+(w.getAttribute('data-inc'))||step||1));sp.textContent=v;if(cb)cb(w.getAttribute('data-step'),v)})}
function ph(t,s,a){return U.ph(t,s,a).replace('class="ph"','class="ph fx-ph"')}
function pulse(n){if(!n)return;n.classList.remove('pop');void n.offsetWidth;n.classList.add('pop')}
function tg(on,a,id){return U.tog(on).replace('class="tog"','class="tog" data-a="'+a+'"'+(id?' data-id="'+id+'"':''))}

P.css(`
/* téléphone : cibles tactiles de 44 px dans les écrans de ce lot */
.app.mobile .cg-pg .btn{position:relative}.app.mobile .cg-pg .btn::before{content:"";position:absolute;left:0;right:0;top:50%;height:44px;transform:translateY(-50%)}
.app.mobile .cg-pg .btn.sm{height:36px;padding:0 12px;font-size:13px}.app.mobile .cg-pg .btn.sm.icon{width:36px;padding:0}
.app.mobile .cg-pg .seg button{height:38px;padding:0 13px}.app.mobile .cg-pg .tabs button{padding-top:12px;padding-bottom:12px}
.app.mobile .cg-pg .tog::before{content:"";position:absolute;inset:-11px -4px}.app.mobile .cg-pg .chk{position:relative}.app.mobile .cg-pg .chk::before{content:"";position:absolute;inset:-12px}

/* téléphone : cibles tactiles de 44 px dans les écrans de ce lot */
.app.mobile[data-role="coach"] .view .btn{position:relative}.app.mobile[data-role="coach"] .view .btn::before{content:"";position:absolute;left:0;right:0;top:50%;height:44px;transform:translateY(-50%)}
.app.mobile[data-role="coach"] .view .btn.sm{height:36px;padding:0 12px;font-size:13px}.app.mobile[data-role="coach"] .view .btn.sm.icon{width:36px;padding:0}
.app.mobile[data-role="coach"] .view .seg button{height:38px;padding:0 13px}.app.mobile[data-role="coach"] .view .tabs button{padding-top:12px;padding-bottom:12px}
.app.mobile[data-role="coach"] .view .tog::before{content:"";position:absolute;inset:-11px -4px}.app.mobile[data-role="coach"] .view .chk{position:relative}.app.mobile[data-role="coach"] .view .chk::before{content:"";position:absolute;inset:-12px}
.app.mobile[data-role="coach"] .view .fx-step button{width:36px;height:36px}
.app.mobile[data-role="coach"] .view .qq-leave button,.app.mobile .cg-pg .qq-leave button{width:36px;height:36px}
.app.mobile[data-role="coach"] .view .cd-c{height:40px}

.fx-stars{display:inline-flex;gap:1px;color:var(--c4);vertical-align:-2px}
.fx-stars svg.i{fill:currentColor;stroke:none;width:13px;height:13px}
.fx-stars svg.i.off{color:var(--line-2)}
.fx-stats{display:grid;grid-template-columns:repeat(4,minmax(0,1fr))}
.fx-st{padding:14px 16px;display:flex;flex-direction:column;gap:3px;min-width:0;position:relative}
.fx-st+.fx-st::before{content:"";position:absolute;left:0;top:14px;bottom:14px;width:1px;background:var(--line)}
.fx-st b{font:700 23px/1.1 var(--f-display);letter-spacing:-.03em}
.fx-st .xs{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.fx-sec{margin:20px 0 8px}.fx-sec:first-child{margin-top:0}
.fx-sec h4{font-size:14px;letter-spacing:-.01em}
.fx-row{padding:8px 0;--g:16px;min-height:44px}.fx-row+.fx-row{border-top:1px solid var(--line)}
.fx-step{display:inline-flex;align-items:center;gap:8px}.fx-step b{min-width:52px;text-align:center;font-size:13.500px}
.fx-tabs{margin:18px 0 16px}
.fx-date{width:46px;height:50px;border-radius:var(--r-md);background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);display:flex;flex-direction:column;align-items:center;justify-content:center;flex:none;line-height:1}
.fx-date b{font:700 19px var(--f-display);letter-spacing:-.03em}
.fx-date span{font-size:10px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--acc);margin-bottom:3px}
.fx-click{cursor:pointer}
@container main (max-width:760px){
 .fx-stats{grid-template-columns:repeat(2,minmax(0,1fr))}
 .fx-st:nth-child(3)::before{display:none}
 .fx-st:nth-child(n+3){border-top:1px solid var(--line)}
 .fx-st b{font-size:21px}
}
@container main (max-width:620px){.fx-ph>.grow{flex-basis:100%}.fx-ph .acts{width:100%;flex-wrap:nowrap}.fx-ph .acts .btn{flex:1;height:42px;padding:0 8px;font-size:13px;min-width:0}}
`);

/* =====================================================================
   GÉRANT · Coachs
   ===================================================================== */
P.css(`
.co-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px}
.co-card{padding:16px;display:flex;flex-direction:column;gap:12px;text-align:left}
.co-card .who{display:flex;gap:12px;align-items:center;min-width:0}
.co-card .meta{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:12.500px;color:var(--mut)}
.co-card .meta b{color:var(--ink)}
.co-card .deal{display:flex;justify-content:space-between;gap:10px;padding-top:12px;border-top:1px solid var(--line);font-size:12.500px;color:var(--mut)}
.co-card .deal b{color:var(--ink)}
.co-req{display:flex;gap:14px;align-items:center;padding:14px 16px;margin-bottom:14px}
.co-pl{padding:4px 0 10px}
.co-plh,.co-plr{display:grid;grid-template-columns:148px minmax(0,1fr);align-items:center}
.co-plh{padding:10px 28px 6px 16px}
.co-hours{position:relative;height:16px}
.co-hours span{position:absolute;top:0;transform:translateX(-50%);font-size:10.500px;font-weight:500;color:var(--mut);font-variant-numeric:tabular-nums;white-space:nowrap}
.co-plr{padding:0 28px 0 16px}
.co-plr+.co-plr .co-lane{border-top:1px solid var(--line)}
.co-plr .nm{font-weight:600;font-size:13px;padding-right:12px}
.co-plr .nm small{display:block;font-weight:500;font-size:11.500px;color:var(--mut)}
.co-lane{position:relative;height:62px;background-image:linear-gradient(to right,var(--line) 1px,transparent 1px);background-size:calc(100% / 13) 100%;box-shadow:1px 0 0 var(--line)}
.co-bl{position:absolute;top:8px;bottom:8px;border-radius:8px;padding:6px 8px;font-size:11.500px;line-height:1.3;overflow:hidden;text-align:left;background:color-mix(in srgb,var(--c) 14%,var(--surface));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 38%,transparent);transition:transform var(--t-2) var(--e-out),box-shadow var(--t-2)}
.co-bl:hover{transform:translateY(-1px);box-shadow:inset 0 0 0 1px var(--c),var(--shadow-2);z-index:2}
.co-bl b{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ink)}
.co-bl span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--mut)}
.co-bl.club{background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line-2)}
.co-bl.pend{background:repeating-linear-gradient(135deg,transparent 0 6px,color-mix(in srgb,var(--c) 12%,transparent) 6px 12px),var(--surface);box-shadow:inset 0 0 0 1.500px var(--c)}
.co-bl.clash{--c:var(--bad)}
.co-bl.clash span{color:var(--bad);font-weight:600}
.co-now{position:absolute;top:0;bottom:0;width:2px;background:var(--bad);z-index:1;border-radius:2px}
.co-now::before{content:"";position:absolute;top:-3px;left:-3px;width:8px;height:8px;border-radius:50%;background:var(--bad)}
.co-days{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none}
.co-days button{flex:none;min-width:54px;height:52px;border-radius:var(--r-md);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;font-size:11px;font-weight:600;color:var(--mut);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);transition:background var(--t-2),color var(--t-2)}
.co-days button b{font:700 16px var(--f-display);color:var(--ink)}
.co-days button[aria-selected="true"]{background:var(--navy);color:color-mix(in srgb,var(--navy-ink) 70%,transparent);box-shadow:none}
.co-days button[aria-selected="true"] b{color:var(--navy-ink)}
.co-bk{display:grid;grid-template-columns:54px minmax(0,1.5fr) minmax(0,1fr) auto;gap:14px;align-items:center;padding:12px 16px;position:relative}
.co-bk+.co-bk{border-top:1px solid var(--line)}
.co-bk .tm{font-weight:600;font-size:13px;font-variant-numeric:tabular-nums}
.co-bk .tm small{display:block;color:var(--mut);font-weight:500;font-size:11.500px}
.co-dist{display:grid;grid-template-columns:14px minmax(0,1fr) 28px;gap:8px;align-items:center;font-size:12px;color:var(--mut)}
.co-rev{padding:14px 16px;display:flex;gap:12px}
.co-rev+.co-rev{border-top:1px solid var(--line)}
@container main (max-width:1080px){.co-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}
@container main (max-width:760px){
 .co-grid{grid-template-columns:minmax(0,1fr)}
 .co-req{flex-wrap:wrap}.co-req .acts{width:100%}.co-req .acts .btn{flex:1;height:40px}
 .co-bk{grid-template-columns:48px minmax(0,1fr);row-gap:8px}
 .co-bk .c3{grid-column:2}.co-bk .c4{grid-column:1 / -1;display:flex;gap:8px}.co-bk .c4 .btn{flex:1;height:40px}
}
`);
var coTab='annuaire',coDay=0,coFil='todo',coPaid=false,coReq={status:'new'};
function dealTxt(c){var d=DEAL[c.id];return d.mode==='commission'?'Commission de '+d.pct+' %':d.mode==='passage'?'Forfait de passage '+F.eur(d.fee):d.mode==='piste'?'Droit de piste '+F.eur(d.fee)+' / mois':'Salarié, prime de '+d.pct+' %'}
function clubCut(c){var d=DEAL[c.id];return d.mode==='commission'?d.ca*d.pct/100:d.mode==='passage'?d.fee*d.n:d.mode==='piste'?d.fee:d.ca*(1-d.pct/100)}
function insDays(c){var d=DEAL[c.id];return d.insTo?F.days(d.insTo):999}
function pendB(){return BOOK.filter(function(b){return b.status==='à confirmer'})}
function dayBlocks(off){var dow=day(off).getDay(),bl=[];
 D.lessons.filter(function(l){return l.dow===dow}).forEach(function(l){bl.push({k:'club',arena:l.arena,s:hm(l.start),d:l.dur,t:l.title,who:D.staffer(l.coach).first,c:'var(--mut-2)'})});
 BOOK.filter(function(b){return b.d===off&&b.status!=='annulée'}).forEach(function(b){var c=D.coach(b.coach),s=hm(b.t);
  var clash=b.status==='à confirmer'&&bl.some(function(x){return x.k==='club'&&x.arena===b.arena&&x.s<s+b.dur&&s<x.s+x.d});
  bl.push({k:b.status==='à confirmer'?'pend':'coach',id:b.id,arena:b.arena,s:s,d:b.dur,t:c.first,full:c.first+' · '+b.riders.map(fst).join(', '),who:b.riders.length>1?b.riders.length+' cavaliers':fst(b.riders[0]),type:b.type,c:c.color,clash:clash})});
 return bl.sort(function(a,b){return a.s-b.s})}
function bookWho(b){return b.riders.length>1?b.riders.length+' cavaliers':nm(b.riders[0])}

function coachSheet(id){var c=D.coach(id),d=DEAL[id],ext=c.ext,idays=insDays(c);
 P.sheet({title:c.first+' '+c.last,icon:'coach',body:function(b,sh){
  b.innerHTML='<div class="hrow" style="--g:14px">'+U.av(c,'xl')+'<div class="grow"><div class="hrow wrap" style="--g:6px">'+U.chip(ext?'Coach extérieur':'Moniteur du club',ext?'acc':'')+U.chip(c.spec,'line')+'</div><div class="s mut" style="margin-top:6px">'+c.level+'</div><div class="s" style="margin-top:4px">'+stars(c.rating)+' <b>'+rate(c.rating)+'</b> <span class="mut">· '+c.reviews+' avis</span></div></div></div>'+
   '<div class="card soft g3" style="--g:0;margin-top:16px;grid-template-columns:repeat(3,minmax(0,1fr))">'+stat('Cours en novembre',d.n,null)+stat('Encaissé',F.eur(d.ca),null)+stat('Tarif horaire',F.eur(c.rate),null)+'</div>'+
   (ext?sec('Pièces vérifiées',idays<30?U.chip('1 pièce à renouveler','warn',true):U.chip('Dossier complet','ok',true))+
    '<div class="card flat list">'+
     '<div class="li">'+sq('shield','ok')+'<div class="grow"><div class="t">Carte professionnelle d’éducateur sportif</div><div class="s">N° '+d.card+' · valable jusqu’au '+F.dateY(d.cardTo)+'</div></div>'+U.chip('Contrôlée','ok')+'</div>'+
     '<div class="li">'+sq('doc',idays<30?'warn':'ok')+'<div class="grow"><div class="t">Assurance responsabilité civile professionnelle</div><div class="s">'+d.ins+' · '+(idays<30?'expire dans '+idays+' jours':'valable jusqu’au '+F.dateY(d.insTo))+'</div></div>'+(idays<30?'<button class="btn sm" data-a="renew">Demander l’attestation</button>':U.chip('Valide','ok'))+'</div>'+
     '<div class="li">'+sq('medal','ok')+'<div class="grow"><div class="t">Diplôme</div><div class="s">'+d.dip+'</div></div>'+U.chip('Vérifié','ok')+'</div></div>'+
    sec('Accord avec le club','<span class="xs mut">Depuis '+d.since+'</span>')+
    '<div class="stack" style="--g:10px">'+U.seg([['commission','Commission'],['passage','Forfait de passage'],['piste','Droit de piste']],d.mode,'data-mode')+
    '<div class="card flat" style="padding:4px 14px"><div data-deal></div>'+row('Pistes autorisées','<span class="hrow wrap" style="--g:6px;justify-content:flex-end">'+D.club.arenas.map(function(a){return '<button class="tag" aria-pressed="'+(d.arenas.indexOf(a.id)>=0)+'">'+a.name+'</button>'}).join('')+'</span>')+'</div></div>'
   :sec('Statut')+'<div class="note">'+I('info','sm')+'<span>'+c.first+' est salarié du club. Ses cours particuliers réservés en ligne sont encaissés par le club, avec une prime de '+d.pct+' % versée sur sa paie.</span></div>')+
   sec('Prochains créneaux réservables')+'<div class="hrow wrap" style="--g:6px">'+c.slots.map(function(s){return '<span class="chip lg line">'+s.replace(':',' h ').replace(' h 00',' h')+'</span>'}).join('')+'</div>';
  function deal(){var m=d.mode;b.querySelector('[data-deal]').innerHTML=m==='commission'?row('Part du club sur chaque cours',stepper('pct',d.pct||RULES.commission,'%')):m==='passage'?row('Montant par cours donné',stepper('fee',d.fee||RULES.passage,'€')):row('Forfait mensuel, cours illimités',stepper('fee',d.fee||RULES.piste,'€'))}
  if(ext){deal();b.querySelectorAll('[data-mode]').forEach(function(x){x.addEventListener('click',function(){d.mode=x.getAttribute('data-mode');if(d.mode==='commission'&&!d.pct)d.pct=RULES.commission;if(d.mode!=='commission')d.fee=d.mode==='passage'?RULES.passage:RULES.piste;deal();P.toast('Accord mis à jour : '+dealTxt(c).toLowerCase())})});
   bindSteps(b,1,function(k,v){d[k]=v})}
  act(sh,{renew:function(x){x.outerHTML=U.chip('Demande envoyée','acc',true);P.toast('Demande d’attestation envoyée à '+c.first+' par e-mail et SMS')},
   msg:function(){sh.close();goOr('communication','Conversation ouverte avec '+c.first)},
   agenda:function(){sh.close();coTab='pistes';P.rerender()}});
 },foot:'<button class="btn" data-a="msg">'+I('chat','sm')+'Écrire à '+c.first+'</button><button class="btn dark" data-a="agenda">'+I('planning','sm')+'Voir son agenda</button>'})}

function bookingSheet(id){var b=BOOK.find(function(x){return x.id===id}),c=D.coach(b.coach),pend=b.status==='à confirmer',bl=dayBlocks(b.d).find(function(x){return x.id===id})||{},cut=DEAL[c.id];
 var part=cut.mode==='commission'?b.price*cut.pct/100:cut.mode==='passage'?cut.fee:cut.mode==='piste'?0:b.price*(1-cut.pct/100);
 P.sheet({title:b.type,icon:'calendar_add',body:function(el,sh){
  el.innerHTML=(bl.clash?'<div class="note bad" style="margin-bottom:14px">'+I('alert','sm')+'<span>La '+arena(b.arena).toLowerCase()+' est déjà prise par une reprise du club à cette heure. La petite carrière est libre : Piaffe peut y déplacer le cours et prévenir tout le monde.</span></div>':'')+
   '<div class="card flat" style="padding:4px 14px">'+row('Coach','<span class="hrow" style="--g:8px;justify-content:flex-end">'+U.av(c,'sm')+c.first+' '+c.last+'</span>')+row(b.riders.length>1?'Cavaliers':'Cavalier',b.riders.map(nm).join(', '))+(b.horse?row('Cheval',D.horse(b.horse).name):'')+row('Date',F.dateL(day(b.d))+' à '+th(hm(b.t)))+row('Durée',b.dur+' min')+row('Piste',arena(b.arena))+'</div>'+
   sec('Paiement')+'<div class="card flat" style="padding:4px 14px">'+row('Prix payé par le cavalier','<span class="num">'+F.eur(b.price)+'</span>')+row('Règlement',b.pay)+row(cut.mode==='piste'?'Part du club (droit de piste mensuel)':'Part du club','<span class="num">'+F.eur(part,part%1?1:0)+'</span>')+row('Reversé à '+c.first,'<span class="num">'+F.eur(b.price-part,(b.price-part)%1?1:0)+'</span>')+'</div>'+
   '<p class="xs mut" style="margin-top:12px">Annulation gratuite jusqu’à '+RULES.cancel+' h avant le cours. Passé ce délai, l’acompte de '+RULES.deposit+' % reste acquis au coach.</p>';
  act(sh,{ok:function(){b.status='confirmée';sh.close();P.rerender();P.toast('Réservation confirmée, '+c.first+' et '+bookWho(b)+' sont prévenus')},
   move:function(){b.arena='a3';b.status='confirmée';sh.close();P.rerender();P.toast('Cours déplacé en petite carrière et confirmé')},
   no:function(){var old=b.status;b.status='annulée';sh.close();P.rerender();P.toast('Demande refusée, acompte remboursé',{icon:'xc',undo:function(){b.status=old;P.rerender()}})},
   cancel:function(){var old=b.status;b.status='annulée';sh.close();P.rerender();P.toast('Cours annulé, coach et cavalier prévenus',{icon:'xc',undo:function(){b.status=old;P.rerender()}})}});
 },foot:pend?'<button class="btn danger" data-a="no">Refuser</button>'+(bl.clash?'<button class="btn pri" data-a="move">Déplacer en petite carrière</button>':'<button class="btn pri" data-a="ok">Confirmer la réservation</button>'):(b.status==='confirmée'?'<button class="btn danger" data-a="cancel">Annuler ce cours</button>':'')})}

function rulesSheet(){P.sheet({title:'Règles de réservation des coachs',icon:'sliders',body:function(b,sh){
  b.innerHTML='<p class="s mut" style="margin-bottom:14px">Ces règles s’appliquent à tous les cours réservés en ligne auprès d’un coach, intérieur ou extérieur.</p>'+
   sec('Annulation et acompte')+'<div class="card flat" style="padding:4px 14px">'+row('Annulation gratuite jusqu’à',U.seg([['12','12 h'],['24','24 h'],['48','48 h']],RULES.cancel,'data-cancel'))+row('Acompte à la réservation',stepper('deposit',RULES.deposit,'%'))+row('Le club valide chaque demande d’un coach extérieur',U.tog(RULES.manual,'ru-manual'))+'</div>'+
   sec('Conditions proposées par défaut')+'<div class="card flat" style="padding:4px 14px">'+row('Commission du club',stepper('commission',RULES.commission,'%'))+row('Forfait de passage, par cours',stepper('passage',RULES.passage,'€'))+row('Droit de piste mensuel',stepper('piste',RULES.piste,'€'))+'</div>'+
   sec('Accès aux installations')+'<div class="card flat" style="padding:4px 14px">'+row('Pistes ouvertes aux coachs extérieurs','<span class="hrow wrap" style="--g:6px;justify-content:flex-end">'+D.club.arenas.map(function(a){return '<button class="tag" data-ar="'+a.id+'" aria-pressed="'+(RULES.extArenas.indexOf(a.id)>=0)+'">'+a.name+'</button>'}).join('')+'</span>')+row('Plage horaire en semaine','de '+RULES.from+' à '+RULES.to+', hors reprises du club')+row('Carte professionnelle et assurance exigées',U.tog(RULES.docs,'ru-docs'))+'</div>'+
   '<div class="note" style="margin-top:14px">'+I('shield','sm')+'<span>Piaffe bloque automatiquement les réservations d’un coach dont l’assurance ou la carte professionnelle a expiré, et le prévient 30 jours avant.</span></div>';
  b.querySelectorAll('[data-step]').forEach(function(s){if(s.getAttribute('data-step')==='deposit'||s.getAttribute('data-step')==='piste')s.setAttribute('data-inc',5)});
  bindSteps(b,1);
  act(sh,{save:function(){RULES.cancel=b.querySelector('[data-cancel][aria-selected="true"]').getAttribute('data-cancel');b.querySelectorAll('[data-step]').forEach(function(s){RULES[s.getAttribute('data-step')]=+s.querySelector('[data-v]').textContent});
   RULES.manual=b.querySelector('#ru-manual').getAttribute('aria-checked')==='true';RULES.docs=b.querySelector('#ru-docs').getAttribute('aria-checked')==='true';RULES.extArenas=[].map.call(b.querySelectorAll('[data-ar][aria-pressed="true"]'),function(x){return x.getAttribute('data-ar')});
   sh.close();P.rerender();P.toast('Règles enregistrées et affichées sur les pages de réservation')}});
 },foot:'<button class="btn pri" data-a="save">Enregistrer les règles</button>'})}

function inviteSheet(req){var title=req?'Demande d’accueil':'Inviter un coach';
 P.sheet({title:title,icon:'coach',body:function(b,sh){
  b.innerHTML=(req?'<div class="hrow" style="--g:14px"><span class="av xl" style="--c:var(--c5)">ÉV</span><div class="grow"><b class="l">Élodie Vasseur</b><div class="s mut">Dressage · DEJEPS, cavalière Amateur Élite</div><div class="s" style="margin-top:4px">Demandée par '+D.name('m023')+' et '+D.name('m031')+', propriétaires</div></div></div>'+
    sec('Pièces transmises')+'<div class="card flat list"><div class="li">'+sq('shield','ok')+'<div class="grow"><div class="t">Carte professionnelle n° 07823ED0208</div><div class="s">Valable jusqu’au 30 avr. 2030</div></div>'+U.chip('Contrôlée','ok')+'</div><div class="li">'+sq('doc','ok')+'<div class="grow"><div class="t">Attestation d’assurance RC professionnelle</div><div class="s">Equitanet · valable jusqu’au 31 déc. 2026</div></div>'+U.chip('Valide','ok')+'</div></div>'
   :'<div class="stack" style="--g:12px"><label class="field"><span>Nom du coach</span><input class="in" id="iv-n" value="Élodie Vasseur"></label><label class="field"><span>E-mail ou téléphone</span><input class="in" value="elodie.vasseur@exemple.fr"></label><p class="xs mut">Le coach reçoit un lien pour créer son profil, déposer sa carte professionnelle et son attestation d’assurance. Vous validez ensuite son accès.</p></div>')+
   sec('Conditions d’accueil')+'<div class="stack" style="--g:10px">'+U.seg([['commission','Commission '+RULES.commission+' %'],['passage','Passage '+RULES.passage+' €'],['piste','Piste '+RULES.piste+' € / mois']],'passage','data-m')+
   '<div class="card flat" style="padding:4px 14px">'+row('Pistes autorisées','<span class="hrow wrap" style="--g:6px;justify-content:flex-end">'+D.club.arenas.map(function(a){return '<button class="tag" aria-pressed="'+(RULES.extArenas.indexOf(a.id)>=0)+'">'+a.name+'</button>'}).join('')+'</span>')+row('Réservable en ligne par les adhérents',U.tog(true))+row('Convention d’accueil à signer',U.tog(true))+'</div></div>';
  act(sh,{send:function(){sh.close();coReq.status='ok';P.rerender();P.toast(req?'Élodie Vasseur est acceptée, convention envoyée pour signature':'Invitation envoyée à Élodie Vasseur')},
   refuse:function(){sh.close();coReq.status='no';P.rerender();P.toast('Demande refusée, les propriétaires sont prévenus',{icon:'xc',undo:function(){coReq.status='new';P.rerender()}})}});
 },foot:req?'<button class="btn danger" data-a="refuse">Refuser</button><button class="btn pri" data-a="send">Accepter et envoyer la convention</button>':'<button class="btn pri" data-a="send">Envoyer l’invitation</button>'})}

function payoutSheet(id){var c=D.coach(id),d=DEAL[id],cut=clubCut(c);
 P.sheet({title:'Relevé de novembre',icon:'bank',body:
  '<div class="hrow" style="--g:12px;margin-bottom:14px">'+U.av(c,'lg')+'<div><b>'+c.first+' '+c.last+'</b><div class="s mut">'+dealTxt(c)+'</div></div></div>'+
  '<div class="card flat" style="padding:4px 14px">'+row(d.n+' cours encaissés en ligne','<span class="num">'+F.eur(d.ca)+'</span>')+row(d.mode==='interne'?'Part conservée par le club':'Part du club','<span class="num">−'+F.eur(cut,cut%1?1:0)+'</span>')+row(d.mode==='interne'?'Prime versée sur la paie':'Reversement par virement SEPA','<b class="num">'+F.eur(d.ca-cut,(d.ca-cut)%1?1:0)+'</b>')+'</div>'+
  sec('Derniers cours')+'<div class="card flat list">'+BOOK.filter(function(b){return b.coach===id&&b.status!=='annulée'}).slice(0,5).map(function(b){return '<div class="li"><div class="grow"><div class="t">'+b.type+'</div><div class="s">'+dlab(b.d)+' nov. · '+bookWho(b)+'</div></div><b class="s num">'+F.eur(b.price)+'</b></div>'}).join('')+'</div>',
  foot:'<button class="btn" data-pdf>'+I('download','sm')+'Télécharger le relevé</button>'}).querySelector('[data-pdf]').onclick=function(){P.toast('Relevé de '+c.first+' téléchargé en PDF')}}

function coTabs(){return [['annuaire','Annuaire'],['pistes','Agenda des pistes'],['resa','Réservations'+(pendB().length?' <span class="chip acc" style="margin-left:4px">'+pendB().length+'</span>':'')],['paie','Reversements'],['avis','Avis']]}

P.mod({id:'coachs',role:'gerant',group:'Club',title:'Coachs',icon:'coach',n:40,
 badge:function(){var n=pendB().length+(coReq.status==='new'?1:0);return n?{v:n}:null},
 render:function(el,ctx){el.classList.add('cg-pg');
  if(ctx.params&&ctx.params.tab){coTab=ctx.params.tab;ctx.params.tab=null}
  var ext=D.coaches.filter(function(c){return c.ext}),tot=D.coaches.reduce(function(a,c){return a+DEAL[c.id].ca},0),cut=D.coaches.reduce(function(a,c){return a+clubCut(c)},0),nres=BOOK.filter(function(b){return b.d>=0&&b.d<7&&b.status!=='annulée'}).length,pend=pendB();
  var h=ph('Coachs',D.coaches.length+' coachs réservables en ligne, dont '+ext.length+' extérieurs · '+pend.length+' réservation'+(pend.length>1?'s':'')+' à confirmer',
   '<button class="btn" data-a="rules">'+I('sliders','sm')+'Règles</button><button class="btn pri" data-a="invite">'+I('plus','sm')+'Inviter un coach</button>');
  h+=stats([stat('Réservations sur 7 jours',nres,'dont '+pend.length+' à confirmer',nres),stat('Coaching encaissé en novembre',F.eur(tot),'140 cours donnés',tot,'eur'),stat('Part du club',F.eur(cut),Math.round(cut/tot*100)+' % du coaching',Math.round(cut),'eur'),stat('Note moyenne','4,85','600 avis vérifiés')]);
  h+='<div class="fx-tabs">'+U.tabs(coTabs(),coTab,'data-t')+'</div><div data-body></div>';
  el.innerHTML=h;var body=el.querySelector('[data-body]');
  function draw(){var s='';
   if(coTab==='annuaire'){
    if(coReq.status==='new')s+='<div class="card co-req"><span class="av lg" style="--c:var(--c5)">ÉV</span><div class="grow"><b>Élodie Vasseur demande à coacher chez vous</b><div class="s mut">Coach de dressage, appelée par deux de vos propriétaires. Carte professionnelle et assurance déjà contrôlées.</div></div><div class="acts hrow"><button class="btn" data-a="req">Étudier la demande</button></div></div>';
    s+='<div class="co-grid rise">'+D.coaches.concat(coReq.status==='ok'?[{id:'cx',first:'Élodie',last:'Vasseur',spec:'Dressage',level:'DEJEPS, Amateur Élite',rate:60,rating:0,reviews:0,ext:true,slots:[],color:'var(--c5)',fresh:true}]:[]).map(function(c){var d=DEAL[c.id],idays=c.fresh?999:insDays(c);
     return '<div class="card hover co-card" role="button" tabindex="0" data-a="'+(c.fresh?'fresh':'coach')+'" data-id="'+c.id+'"><div class="who">'+U.av(c,'lg')+'<div class="grow"><div class="b ellip" style="font-size:15px">'+c.first+' '+c.last+'</div><div class="s mut ellip">'+c.spec+' · '+c.level+'</div></div>'+U.chip(c.ext?'Extérieur':'Club',c.ext?'acc':'')+'</div>'+
      '<div class="meta">'+(c.fresh?'<span>Nouveau profil, convention en cours de signature</span>':stars(c.rating)+'<b>'+rate(c.rating)+'</b><span>'+c.reviews+' avis</span><span>·</span><b class="num">'+F.eur(c.rate)+'</b><span>l’heure</span>')+'</div>'+
      '<div class="hrow wrap" style="--g:6px">'+(c.ext?U.chip('Carte professionnelle','ok',true)+(idays<30?U.chip('Assurance : expire dans '+idays+' j','warn',true):U.chip('Assurance RC pro','ok',true)):U.chip('Salarié du club','',true)+U.chip('Diplôme vérifié','ok',true))+'</div>'+
      '<div class="deal"><span>'+(c.fresh?'Forfait de passage '+F.eur(RULES.passage):dealTxt(c))+'</span><span><b class="num">'+(c.fresh?0:d.n)+'</b> cours en novembre</span></div></div>'}).join('')+'</div>';
   }
   if(coTab==='pistes'){var bl=dayBlocks(coDay),H0=8*60,HT=13*60;
    s+='<div class="hrow sp wrap" style="margin-bottom:12px"><div class="co-days">'+[0,1,2,3,4,5,6].map(function(o){return '<button data-a="day" data-d="'+o+'" aria-selected="'+(o===coDay)+'">'+(o===0?'Auj.':DWS[day(o).getDay()])+'<b>'+day(o).getDate()+'</b></button>'}).join('')+'</div>'+C.legend([['Reprise du club','var(--mut-2)'],['Cours d’un coach','var(--acc)'],['À confirmer','var(--c4)']])+'</div>';
    s+='<div class="card hide-s co-pl"><div class="co-plh"><span></span><div class="co-hours">'+[8,9,10,11,12,13,14,15,16,17,18,19,20,21].map(function(x,i){return '<span style="left:'+(i/13*100)+'%">'+x+' h</span>'}).join('')+'</div></div>'+
     D.club.arenas.map(function(a){return '<div class="co-plr"><div class="nm ellip">'+a.name+'<small>'+a.kind+' · '+a.size+'</small></div><div class="co-lane">'+(coDay===0?'<i class="co-now" style="left:'+((9*60+41-H0)/HT*100)+'%"></i>':'')+
      bl.filter(function(x){return x.arena===a.id}).map(function(x){return '<button class="co-bl '+x.k+(x.clash?' clash':'')+'" style="--c:'+(x.k==='pend'&&!x.clash?'var(--c4)':x.c)+';left:calc('+((x.s-H0)/HT*100)+'% + 2px);width:calc('+(x.d/HT*100)+'% - 4px)" data-a="'+(x.id?'book':'club')+'" data-id="'+(x.id||'')+'" title="'+E((x.full||x.t)+' · '+(x.type||'Reprise du club'))+'"><b>'+x.t+'</b><span>'+(x.clash?'Conflit':x.who)+'</span></button>'}).join('')+'</div></div>'}).join('')+'</div>';
    s+='<div class="only-s stack">'+D.club.arenas.map(function(a){var l=bl.filter(function(x){return x.arena===a.id});return '<div class="card"><div class="ch" style="padding-bottom:10px"><h3>'+a.name+'</h3><span class="xs mut">'+(l.length?l.length+' créneau'+(l.length>1?'x':''):'Libre toute la journée')+'</span></div>'+(l.length?'<div class="list">'+l.map(function(x){return '<div class="li'+(x.id?' click':'')+'" data-a="'+(x.id?'book':'club')+'" data-id="'+(x.id||'')+'"><span class="b s num" style="width:42px">'+tc(x.s)+'</span><span style="width:4px;height:30px;border-radius:2px;flex:none;background:'+(x.clash?'var(--bad)':x.c)+'"></span><div class="grow"><div class="t ellip">'+(x.full||x.t)+'</div><div class="s ellip">'+(x.type||'Reprise · '+x.who)+'</div></div>'+(x.clash?U.chip('Conflit','bad'):x.k==='pend'?U.chip('À confirmer','warn'):'')+'</div>'}).join('')+'</div>':'')+'</div>'}).join('')+'</div>';
    var cl=bl.filter(function(x){return x.clash});
    s+=cl.length?'<div class="note warn" style="margin-top:14px;align-items:center;flex-wrap:wrap">'+I('alert','sm')+'<span class="grow" style="flex-basis:200px">'+cl[0].t+' demande la carrière d’honneur à '+th(cl[0].s)+', déjà occupée par une reprise. La petite carrière est libre.</span><button class="btn sm" data-a="book" data-id="'+cl[0].id+'">Régler le conflit</button></div>':'<div class="note ok" style="margin-top:14px">'+I('checkc','sm')+'<span>Aucun conflit de piste ce jour-là. Les coachs extérieurs ne peuvent réserver que les créneaux laissés libres par les reprises.</span></div>';
   }
   if(coTab==='resa'){var L=BOOK.filter(function(b){return coFil==='todo'?b.status==='à confirmer':coFil==='next'?(b.status==='confirmée'&&b.d>=0):(b.d<0)}).sort(function(a,b){return (coFil==='past'?b.d-a.d:a.d-b.d)||hm(a.t)-hm(b.t)});
    s+='<div class="hrow sp wrap" style="margin-bottom:12px">'+U.seg([['todo','À confirmer · '+pendB().length],['next','À venir'],['past','Passées']],coFil,'data-f')+'<span class="s mut hide-s">Les adhérents réservent depuis leur application, le paiement est pris en ligne.</span></div>';
    s+=L.length?'<div class="card rise">'+L.map(function(b){var c=D.coach(b.coach),bl=b.status==='à confirmer'?(dayBlocks(b.d).find(function(x){return x.id===b.id})||{}):{};
     return '<div class="co-bk fx-click" data-a="book" data-id="'+b.id+'"><div class="tm">'+tc(hm(b.t))+'<small>'+(b.d===0?'Auj.':dlab(b.d))+'</small></div><div class="hrow" style="--g:10px">'+U.av(c)+'<div class="grow"><div class="b s ellip">'+bookWho(b)+(b.horse?' <span class="mut" style="font-weight:500">· '+D.horse(b.horse).name+'</span>':'')+'</div><div class="xs mut ellip">'+c.first+' '+c.last+' · '+b.type+'</div></div></div>'+
      '<div class="c3 hrow wrap" style="--g:6px">'+U.chip(bl.clash?arena(b.arena)+' : conflit':arena(b.arena),bl.clash?'bad':'line')+'<span class="xs mut">'+b.pay+'</span></div>'+
      '<div class="c4 hrow" style="--g:8px">'+(b.status==='à confirmer'?'<button class="btn sm" data-a="bno" data-id="'+b.id+'">Refuser</button><button class="btn sm dark" data-a="'+(bl.clash?'book':'bok')+'" data-id="'+b.id+'">'+(bl.clash?'Régler le conflit':'Confirmer')+'</button>':'<b class="s num">'+F.eur(b.price)+'</b>'+U.chip(b.status,b.status==='confirmée'?'acc':b.status==='terminée'?'ok':'bad',true))+'</div></div>'}).join('')+'</div>'
     :'<div class="card">'+U.empty('checkc','Toutes les demandes sont traitées','Les prochaines réservations de coachs extérieurs arriveront ici.')+'</div>';
   }
   if(coTab==='paie'){var extL=D.coaches.filter(function(c){return c.ext}),sum=extL.reduce(function(a,c){return a+DEAL[c.id].ca-clubCut(c)},0);
    s+='<div class="card pad hrow wrap sp" style="--g:16px;margin-bottom:14px"><div class="hrow" style="--g:14px">'+sq('bank',coPaid?'ok':'acc')+'<div><div class="s mut">'+(coPaid?'Virements programmés pour le 30 novembre':'À reverser aux coachs extérieurs le 30 novembre')+'</div><div class="disp num" style="font-size:26px;font-weight:700">'+F.eur(sum,1)+'</div></div></div><div class="hrow wrap" style="--g:8px"><button class="btn" data-a="exp">'+I('download','sm')+'Exporter</button>'+(coPaid?'<span class="chip ok lg dot">4 virements SEPA programmés</span>':'<button class="btn dark" data-a="pay">'+I('send','sm')+'Programmer les 4 virements</button>')+'</div></div>';
    s+=U.table([{l:'Coach',f:function(c){return '<span class="hrow" style="--g:10px">'+U.av(c,'sm')+'<b>'+c.first+' '+c.last+'</b></span>'}},{l:'Formule',hide:true,f:function(c){return '<span class="mut">'+dealTxt(c)+'</span>'}},{l:'Cours',n:true,hide:true,f:function(c){return DEAL[c.id].n}},{l:'Encaissé',n:true,hide:true,f:function(c){return F.eur(DEAL[c.id].ca)}},{l:'Part du club',n:true,hide:true,f:function(c){var v=clubCut(c);return F.eur(v,v%1?1:0)}},{l:'À reverser',n:true,f:function(c){var v=DEAL[c.id].ca-clubCut(c);return '<b>'+F.eur(v,v%1?1:0)+'</b>'}},{l:'Statut',hide:true,f:function(c){return c.ext?(coPaid?U.chip('Programmé','ok',true):U.chip('À verser','warn',true)):U.chip('Sur la paie','',true)}}],D.coaches,{click:true});
    s+='<p class="xs mut" style="margin-top:12px">Le club encaisse les réservations en ligne pour le compte des coachs, puis reverse leur part chaque fin de mois. Chaque coach reçoit son relevé détaillé.</p>';
   }
   if(coTab==='avis'){var dist=[[5,512],[4,71],[3,12],[2,4],[1,1]];
    s+='<div class="g3"><div class="card pad stack" style="--g:14px"><div class="hrow" style="--g:14px"><span class="disp num" style="font-size:44px;font-weight:700;line-height:1">4,85</span><div>'+stars(5)+'<div class="xs mut" style="margin-top:4px">600 avis de cavaliers ayant suivi un cours</div></div></div><div class="stack" style="--g:6px">'+dist.map(function(x){return '<div class="co-dist"><span class="num">'+x[0]+'</span>'+U.bar(x[1]/512*100,'var(--c4)')+'<span class="num" style="text-align:right">'+x[1]+'</span></div>'}).join('')+'</div><div class="note">'+I('shield','sm')+'<span>Seuls les cavaliers dont le cours a eu lieu peuvent laisser un avis. Vous choisissez ceux qui s’affichent sur la page du club.</span></div></div>'+
     '<div class="card span2"><div class="ch" style="padding-bottom:6px"><h3>Derniers avis</h3><span class="xs mut">1 avis en attente de publication</span></div>'+D.coachReviews.map(function(r){var c=D.coach(r.coach);return '<div class="co-rev">'+U.av(r.by)+'<div class="grow"><div class="hrow wrap sp" style="--g:8px"><span class="s"><b>'+nm(r.by)+'</b> <span class="mut">pour '+c.first+' '+c.last+' · '+r.when+'</span></span>'+stars(r.stars)+'</div><p class="s" style="margin:6px 0 10px;color:var(--ink-2)">'+r.text+'</p><div class="hrow wrap" style="--g:10px"><label class="hrow xs mut" style="--g:8px;cursor:pointer">'+tg(r.pub,'pub',r.id)+'Publié sur la page du club</label>'+(r.replied?U.chip('Réponse envoyée','ok',true):'<button class="btn ghost sm" data-a="reply" data-id="'+r.id+'">'+I('chat','sm')+'Répondre</button>')+'</div></div></div>'}).join('')+'</div></div>';
   }
   body.innerHTML=s;P.animate(body)}
  draw();
  function bindTabs(){el.querySelectorAll('[data-t]').forEach(function(t){t.addEventListener('click',function(){coTab=t.getAttribute('data-t');draw()})})}
  bindTabs();
  body.addEventListener('click',function(e){var f=e.target.closest('[data-f]');if(f){coFil=f.getAttribute('data-f');draw()}var r=e.target.closest('[data-row]');if(r)payoutSheet(r.getAttribute('data-row'))});
  function retab(){el.querySelector('.fx-tabs').innerHTML=U.tabs(coTabs(),coTab,'data-t');bindTabs()}
  act(el,{rules:rulesSheet,invite:function(){inviteSheet(false)},req:function(){inviteSheet(true)},
   coach:function(b){coachSheet(b.getAttribute('data-id'))},fresh:function(){P.toast('Élodie Vasseur n’a pas encore signé sa convention',{icon:'hourglass'})},
   day:function(b){coDay=+b.getAttribute('data-d');draw()},
   book:function(b,e){e.stopPropagation();bookingSheet(b.getAttribute('data-id'))},club:function(){goOr('planning','Cette reprise se gère dans le planning du club')},
   bok:function(b,e){e.stopPropagation();var x=BOOK.find(function(k){return k.id===b.getAttribute('data-id')});x.status='confirmée';draw();retab();P.toast('Réservation confirmée, '+fst(x.coach)+' et '+bookWho(x)+' sont prévenus',{undo:function(){x.status='à confirmer';draw();retab()}})},
   bno:function(b,e){e.stopPropagation();var x=BOOK.find(function(k){return k.id===b.getAttribute('data-id')});x.status='annulée';draw();retab();P.toast('Demande refusée, acompte remboursé',{icon:'xc',undo:function(){x.status='à confirmer';draw();retab()}})},
   pay:function(){coPaid=true;draw();P.toast('4 virements SEPA programmés pour le 30 novembre',{undo:function(){coPaid=false;draw()}})},
   exp:function(){P.toast('Reversements de novembre exportés pour la comptabilité',{icon:'download'})},
   pub:function(b){var r=D.coachReviews.find(function(x){return x.id===b.getAttribute('data-id')});r.pub=!r.pub;P.toast(r.pub?'Avis publié sur la page du club':'Avis retiré de la page du club')},
   reply:function(b){var r=D.coachReviews.find(function(x){return x.id===b.getAttribute('data-id')});var sh=P.sheet({title:'Répondre à '+fst(r.by),icon:'chat',body:'<div class="card soft pad s" style="margin-bottom:12px">'+r.text+'</div><label class="field"><span>Votre réponse, visible sous l’avis</span><textarea class="in" rows="4">Merci pour votre retour. Nous avons rappelé aux coachs de prévoir dix minutes entre deux cours pour démarrer à l’heure.</textarea></label>',foot:'<button class="btn pri" data-send>Publier la réponse</button>'});sh.querySelector('[data-send]').onclick=function(){r.replied=true;sh.close();draw();P.toast('Réponse publiée sous l’avis')}}});
 }});

/* =====================================================================
   GÉRANT · Compétitions
   ===================================================================== */
D.entriesMore=D.entriesMore||[
 {comp:'k2',rider:'m078',horse:'h32',class:'Amateur 3 Préliminaire',fee:32,coach:'c02'},{comp:'k2',rider:'m023',horse:'h27',class:'Amateur 3 Imposée A',fee:32,coach:'c02'},{comp:'k2',rider:'m066',horse:'h31',class:'Amateur 2 Préliminaire',fee:36,coach:'c02'},
 {comp:'k4',rider:'m008',horse:'h09',class:'Poney 1',fee:42,coach:'c04'},{comp:'k4',rider:'m016',horse:'h07',class:'Poney 2',fee:38,coach:'c04'},{comp:'k4',rider:'m029',horse:'h16',class:'Poney 2',fee:38,coach:'c04'},{comp:'k4',rider:'m011',horse:'h03',class:'Poney 2',fee:38,coach:'c04'},{comp:'k4',rider:'m040',horse:'h10',class:'Poney Élite',fee:46,coach:'c04'},
 {comp:'k5',rider:'m001',horse:'h01',class:'Amateur 2 Grand Prix · 115 cm',fee:38,coach:'c01',res:{rank:3,of:52,pts:0,time:'61,84 s',clear:true,classed:true}},
 {comp:'k5',rider:'m066',horse:'h31',class:'Amateur 2 · 110 cm',fee:34,coach:'c01',res:{rank:14,of:52,pts:0,time:'68,20 s',clear:true}},
 {comp:'k5',rider:'m078',horse:'h32',class:'Amateur 2 · 110 cm',fee:34,coach:'c01',res:{rank:21,of:52,pts:4,time:'64,02 s'}},
 {comp:'k5',rider:'m052',horse:'h30',class:'Amateur 2 · 110 cm',fee:34,coach:'c01',res:{rank:24,of:52,pts:4,time:'66,71 s'}},
 {comp:'k5',rider:'m047',horse:'h29',class:'Amateur 3 · 100 cm',fee:30,coach:'c06',res:{rank:19,of:41,pts:8,time:'70,15 s'}},
 {comp:'k5',rider:'m031',horse:'h28',class:'Amateur 3 · 100 cm',fee:30,coach:'c06',res:{rank:null,of:41,elim:'Éliminée, deux refus sur le triple'}}];
D.homeShow=D.homeShow||{duc:'202678041',
 classes:[{id:'e1',t:'09:00',name:'Club 4 · 65 cm',n:6,max:30,judge:'Martine Hébert'},{id:'e2',t:'10:30',name:'Club 3 · 75 cm',n:7,max:30,judge:'Martine Hébert'},{id:'e3',t:'13:30',name:'Club 2 · 85 cm',n:5,max:30,judge:'Alain Roche'},{id:'e4',t:'15:00',name:'Club 1 · 95 cm',n:4,max:30,judge:'Alain Roche'}],
 posts:[{id:'p1',name:'Entrée de piste',when:'9 h à 17 h',need:2,who:['m047','m078']},{id:'p2',name:'Paddock de détente',when:'8 h 30 à 16 h 30',need:2,who:['m014']},{id:'p3',name:'Barres et parcours',when:'Toute la journée',need:4,who:['m019','m044','s07']},{id:'p4',name:'Secrétariat et dossards',when:'8 h à 12 h',need:2,who:['s09','m023']},{id:'p5',name:'Buvette',when:'11 h à 15 h',need:3,who:['m031','m066']},{id:'p6',name:'Parking des camions',when:'7 h 30 à 10 h',need:2,who:['s05']},{id:'p7',name:'Remise des prix',when:'12 h et 16 h 30',need:1,who:['s01']}],
 bar:[{name:'Café et thé',price:1.5,qty:120},{name:'Crêpes',price:2.5,qty:90},{name:'Sandwichs',price:4.5,qty:60},{name:'Frites',price:3,qty:70},{name:'Boissons fraîches',price:2,qty:96},{name:'Gâteaux des familles',price:1.5,qty:40}],
 todo:[['Concours déclaré sur le site de la FFE',true],['Secouristes réservés (Protection civile)',true],['Vétérinaire d’astreinte prévenu',true],['Chef de piste et juges confirmés',true],['Sono et micro testés',false],['Flots et plaques commandés',false]]};
var HS=D.homeShow;
function ents(k){return D.entries.concat(D.entriesMore).filter(function(e){return e.comp===k.id})}
function cClass(k){return k.status==='Terminé'?'':k.status==='Organisation'?'acc':F.days(k.closes)<=2?'warn':'ok'}
function kKind(k){return k.status==='Terminé'?'done':k.km===0?'home':'away'}
function drive(km){return Math.round(km*1.05+13)}
var COACHFEE={c01:30,c02:28,c04:25,c06:20};

P.css(`
.cp-strip{display:grid;grid-auto-flow:column;grid-auto-columns:minmax(212px,1fr);gap:10px;overflow-x:auto;scrollbar-width:none;padding:2px;margin:-2px;scroll-snap-type:x proximity}
.cp-k{display:flex;gap:12px;align-items:flex-start;padding:12px;text-align:left;border-radius:var(--r-lg);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);transition:box-shadow var(--t-2),background var(--t-2),transform var(--t-2) var(--e-out);scroll-snap-align:start;min-width:0}
.cp-k:hover{transform:translateY(-1px);box-shadow:inset 0 0 0 1px var(--line-2),var(--shadow-2)}
.cp-k[aria-selected="true"]{box-shadow:inset 0 0 0 1.500px var(--acc),var(--shadow-2)}
.cp-k[aria-selected="true"] .fx-date{background:var(--acc);box-shadow:none}
.cp-k[aria-selected="true"] .fx-date b,.cp-k[aria-selected="true"] .fx-date span{color:var(--acc-ink)}
.cp-k .nm{font-weight:650;font-size:13.500px;line-height:1.25}
.cp-head{padding:18px;display:flex;gap:16px;align-items:center;flex-wrap:wrap;margin-top:14px}
.cp-head h2{font-size:22px}
.cp-e{display:grid;grid-template-columns:minmax(0,1.1fr) minmax(0,1.3fr) 110px 70px 210px;gap:14px;align-items:center;padding:10px 16px}
.cp-e+.cp-e{border-top:1px solid var(--line)}
.cp-eh{font-size:11.500px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--mut);padding-top:12px;padding-bottom:8px}
.cp-e .n{text-align:right;font-variant-numeric:tabular-nums}
.cp-fee{grid-template-columns:minmax(0,1.4fr) repeat(4,minmax(64px,.5fr)) 96px}
.cp-as{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 14px}
.cp-as+.cp-as{border-top:1px solid var(--line)}
.cp-copy{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 8px;border-radius:7px;background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);font:500 12px var(--f-mono);transition:background var(--t-2)}
.cp-copy:hover{background:var(--acc-pale)}.cp-copy svg.i{width:13px;height:13px;color:var(--mut)}
.cp-csv{font:400 11.500px/1.7 var(--f-mono);padding:12px 14px;background:var(--surface-2);border-radius:var(--r-md);overflow-x:auto;white-space:pre;color:var(--ink-2)}
.cp-chk{display:flex;align-items:center;gap:12px;padding:9px 14px;min-height:44px}
.cp-chk+.cp-chk{border-top:1px solid var(--line)}
.cp-chk[data-on="true"] .t{color:var(--mut);text-decoration:line-through}
.cp-post{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:14px;align-items:center;padding:12px 16px}
.cp-post+.cp-post{border-top:1px solid var(--line)}
.cp-live{padding:22px;display:flex;flex-direction:column;gap:16px;overflow:hidden}
.cp-clock{font:700 68px/1 var(--f-display);letter-spacing:-.04em;font-variant-numeric:tabular-nums;color:var(--navy-ink)}
.cp-clock small{font-size:30px;opacity:.6}
.cp-lbtn{height:44px;padding:0 16px;border-radius:var(--r-md);font-weight:600;font-size:13.500px;background:color-mix(in srgb,var(--navy-ink) 12%,transparent);color:var(--navy-ink);display:inline-flex;align-items:center;gap:8px;transition:background var(--t-2),transform var(--t-1)}
.cp-lbtn:hover{background:color-mix(in srgb,var(--navy-ink) 20%,transparent)}.cp-lbtn:active{transform:scale(.97)}
.cp-lbtn.go{background:var(--acc);color:var(--acc-ink)}
.cp-rk{display:grid;grid-template-columns:30px minmax(0,1fr) auto auto;gap:12px;align-items:center;padding:10px 16px}
.cp-rk+.cp-rk{border-top:1px solid var(--line)}
.cp-rk .pos{font:700 16px var(--f-display);color:var(--mut);text-align:center}
.cp-rk.top .pos{color:var(--acc)}
/* Qui emmène qui */
.qq{display:grid;grid-template-columns:216px minmax(0,1fr) 296px;gap:14px;align-items:start}
.qq-pool{padding:14px;display:flex;flex-direction:column;gap:10px;position:sticky;top:0}
.qq-zone{border-radius:var(--r-md);transition:background var(--t-2),box-shadow var(--t-2)}
.qq-pool .qq-zone{display:flex;flex-direction:column;gap:6px;min-height:46px;padding:4px;margin:-4px}
.qq-tok{display:flex;align-items:center;gap:8px;padding:6px 10px 6px 6px;border-radius:var(--r-md);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2),var(--shadow-1);text-align:left;min-width:0;color:var(--ink);cursor:grab;user-select:none;-webkit-user-select:none;transition:transform var(--t-2) var(--e-out),box-shadow var(--t-2)}
.qq-tok:hover{box-shadow:inset 0 0 0 1px var(--acc-line),var(--shadow-2)}
.qq-tok b{display:block;font-size:12.500px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qq-tok small{display:block;font-size:11px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qq-tok>span:last-child{min-width:0}
.qq-tok.sel{box-shadow:inset 0 0 0 2px var(--acc),var(--shadow-2);transform:translateY(-2px)}
.qq-tok.drag{opacity:.35}
.qq-ghost{position:fixed;z-index:200;pointer-events:none;margin:0;transform:translate(-50%,-50%) rotate(-3deg) scale(1.05);box-shadow:inset 0 0 0 1.500px var(--acc),var(--shadow-3);cursor:grabbing;max-width:180px}
.qq-veh{padding:14px;display:flex;flex-direction:column;gap:12px}
.qq-vh{display:flex;align-items:center;gap:10px;min-width:0}
.qq-leave{display:inline-flex;align-items:center;gap:4px;padding:3px;border-radius:var(--r-sm);background:var(--bg-2);flex:none}
.qq-leave b{font:700 15px var(--f-display);min-width:50px;text-align:center;font-variant-numeric:tabular-nums}
.qq-leave button{width:28px;height:28px;border-radius:7px;display:grid;place-items:center;background:var(--surface);box-shadow:var(--shadow-1),inset 0 0 0 1px var(--line);color:var(--ink-2)}
.qq-body{display:flex;gap:8px;padding:10px;background:var(--bg-2);border-radius:30px 14px 14px 30px;position:relative;margin:5px 0}
.qq-body::before,.qq-body::after{content:"";position:absolute;left:54px;right:40px;height:5px;background:linear-gradient(to right,var(--ink-2) 0 38px,transparent 38px calc(100% - 38px),var(--ink-2) calc(100% - 38px));border-radius:3px}
.qq-body::before{top:-5px}.qq-body::after{bottom:-5px}
.qq-cab{flex:none;width:112px;border-radius:22px 8px 8px 22px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);padding:10px 8px 10px 14px;display:grid;grid-template-columns:1fr 1fr;gap:8px 4px;align-content:center;justify-items:center;position:relative}
.qq-cab::before{content:"";position:absolute;left:5px;top:22%;bottom:22%;width:3px;border-radius:2px;background:var(--acc-line)}
.qq-box{flex:1;min-width:0;display:grid;grid-template-columns:repeat(var(--n,4),minmax(0,1fr));gap:6px}
.qq-stall{border-radius:10px;min-height:112px;display:grid;place-items:center;box-shadow:inset 0 0 0 1.500px var(--line-2);background:repeating-linear-gradient(115deg,transparent 0 9px,color-mix(in srgb,var(--line) 70%,transparent) 9px 10px);min-width:0;font-size:11px;color:var(--mut-2);text-align:center}
.qq-stall .qq-tok{flex-direction:column;gap:6px;width:100%;height:100%;justify-content:center;padding:8px 6px;text-align:center;box-shadow:inset 0 0 0 1px var(--line),var(--shadow-1)}
.qq-stall .qq-tok>span:last-child{width:100%}
.qq-seat{display:flex;flex-direction:column;align-items:center;gap:3px;width:44px;font-size:10.500px;font-weight:600;color:var(--mut);min-width:0;line-height:1.2}
.qq-seat em{font-style:normal;max-width:44px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qq-seat .hole{width:32px;height:32px;border-radius:50%;box-shadow:inset 0 0 0 1.500px var(--line-2);display:grid;place-items:center;color:var(--mut-2)}
.qq-seat .hole svg.i{width:14px;height:14px}
.qq-seat.drv .av{box-shadow:0 0 0 2px var(--surface),0 0 0 3.500px var(--ink-2)}
.qq-seat.qq-tok{padding:0;background:none;box-shadow:none;cursor:grab;border-radius:8px}
.qq-seat.qq-tok.sel .av{box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--acc)}
.qq-veh.car .qq-body{border-radius:26px}
.qq-veh.car .qq-body::before,.qq-veh.car .qq-body::after{left:30px;right:30px;background:linear-gradient(to right,var(--ink-2) 0 30px,transparent 30px calc(100% - 30px),var(--ink-2) calc(100% - 30px))}
.qq-veh.car .qq-cab{width:auto;flex:1;display:flex;justify-content:center;gap:10px;border-radius:20px}
.qq-cars{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}
.qq.picking .qq-zone.can{background:var(--acc-pale);box-shadow:0 0 0 2px var(--acc-line);cursor:pointer}
.qq.picking .qq-zone.can.over{box-shadow:0 0 0 2px var(--acc)}
.qq-zone.full-shake{animation:qqshake .4s var(--e-out)}
@keyframes qqshake{20%{transform:translateX(-5px)}50%{transform:translateX(4px)}80%{transform:translateX(-2px)}}
.qq-map{border-radius:var(--r-md);background:var(--surface-2);display:block;width:100%}
.qq-map text{font:600 10px var(--f-text);fill:var(--ink-2)}
.qq-map .rd{stroke:var(--line-2);fill:none;stroke-width:2;stroke-linecap:round}
.qq-map .wood{fill:color-mix(in srgb,var(--ok) 13%,transparent)}
.qq-map .rt{stroke:var(--acc);fill:none;stroke-width:3.500;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:420;stroke-dashoffset:420;animation:qqdraw 1.400s var(--e-out) .2s forwards}
@keyframes qqdraw{to{stroke-dashoffset:0}}
.qq-sum{display:flex;gap:10px 16px;align-items:center;flex-wrap:wrap;padding:12px 16px;margin-bottom:14px}
.qq-done{display:inline-flex;align-items:center;gap:8px;font-weight:600;color:var(--acc)}
@container main (max-width:1080px){
 .qq{grid-template-columns:minmax(0,1fr) 280px}
 .qq-pool{grid-column:1 / -1;position:static}
 .qq-pool .qq-zone{flex-direction:row;flex-wrap:wrap}
 .cp-e{grid-template-columns:minmax(0,1.1fr) minmax(0,1.3fr) 70px 210px}.cp-e .co{display:none}
 .cp-fee{grid-template-columns:minmax(0,1.4fr) repeat(4,minmax(56px,.5fr)) 96px}
}
@container main (max-width:760px){
 .qq{grid-template-columns:minmax(0,1fr)}
 .qq-cars{grid-template-columns:minmax(0,1fr)}
 .qq-body{flex-direction:column;border-radius:30px 30px 14px 14px;margin:0 5px}
 .qq-body::before,.qq-body::after{left:auto;right:auto;top:44px;bottom:30px;width:5px;height:auto;background:linear-gradient(to bottom,var(--ink-2) 0 38px,transparent 38px calc(100% - 38px),var(--ink-2) calc(100% - 38px))}
 .qq-body::before{left:-5px}.qq-body::after{right:-5px}
 .qq-cab{width:auto;border-radius:22px 22px 8px 8px;display:flex;flex-wrap:wrap;justify-content:center;gap:8px 6px;padding:14px 8px 10px}
 .qq-cab::before{left:28%;right:28%;top:5px;bottom:auto;width:auto;height:3px}
 .qq-box{grid-template-columns:repeat(2,minmax(0,1fr))}
 .qq-stall{min-height:96px}
 .qq-veh.car .qq-body{margin:5px 0;flex-direction:row}
 .qq-veh.car .qq-body::before,.qq-veh.car .qq-body::after{left:30px;right:30px;top:auto;bottom:auto;width:auto;height:5px;background:linear-gradient(to right,var(--ink-2) 0 30px,transparent 30px calc(100% - 30px),var(--ink-2) calc(100% - 30px))}
 .qq-veh.car .qq-body::before{top:-5px}.qq-veh.car .qq-body::after{bottom:-5px}
 .cp-e{grid-template-columns:minmax(0,1fr) auto;row-gap:2px}
 .cp-e .ho{grid-column:1;grid-row:2;padding-left:42px;font-size:12.500px;color:var(--mut)}
 .cp-e .n{display:none}.cp-e .stt{grid-row:1 / span 2;grid-column:2}
 .cp-eh{display:none}
 .cp-fee{grid-template-columns:minmax(0,1fr) auto}.cp-fee .n{display:none}.cp-fee .n.tot{display:block;grid-row:1;grid-column:2}
 .cp-fee .stt{display:none}
 .cp-clock{font-size:54px}
 .cp-head{padding:16px}.cp-head .acts{width:100%;flex-wrap:nowrap}.cp-head .acts .btn{flex:1;height:42px}.cp-head .acts .cp-ic{flex:none;width:46px;padding:0}.cp-ic span{display:none}
 .cp-post{grid-template-columns:minmax(0,1fr) auto}.cp-post .avs{display:none}
}
`);

var cpSel='k1',cpTab={},TP={},ENT={},CHK={},BILL={k5:true},cpRate=1.2,cpPub={k5:true};
/* les véhicules ne reçoivent jamais plus de chevaux ni de passagers que de places : le surplus attend dans « À placer » */
function fit(list,cap,over){list.slice(cap).forEach(function(x){if(over.indexOf(x)<0)over.push(x)});return list.slice(0,cap)}
function plan(k){if(TP[k.id])return TP[k.id];var es=ents(k),t1=D.vans[0],t2=D.vans[1],lv=9*60-90-drive(k.km),V=[],pl;
 if(k.id==='k1'){var oH=[],oP=[],byV=function(v){return es.filter(function(e){return e.transport===v}).map(function(e){return e.horse})};
  V=[
  {id:'v1',kind:'truck',name:t1.name,plate:t1.plate,drv:t1.driver,cap:t1.horses,seats:t1.seats-1,leave:hm(t1.leave),from:t1.from,club:true,h:fit(byV('v1'),t1.horses,oH),p:fit(['m003','m008','m022'],t1.seats-1,oP)},
  {id:'v2',kind:'van',name:t2.name+' de Léa',plate:t2.plate,drv:t2.driver,cap:t2.horses,seats:t2.seats-1,leave:hm(t2.leave),from:t2.from,h:fit(byV('v2'),t2.horses,oH),p:[]},
  {id:'v3',kind:'truck',name:'Camion 3 places, famille Muller',plate:'EV-731-QA',drvName:'Stéphane Muller',cap:3,seats:3,leave:7*60,from:'Parking du haut',h:['h16'],p:['m040']}]
  .concat(D.carpool.map(function(c,i){return {id:'c'+i,kind:'car',name:'Voiture de '+fst(c.driver),drv:c.driver,cap:0,seats:c.seats,leave:7*60+15+i*10,from:c.from,h:[],p:c.taken.slice()}}));
  pl={veh:V,poolH:oH.concat(['h07'].filter(function(h){return oH.indexOf(h)<0})),poolP:oP.concat(['m034'])}}
 else{V=[{id:'v1',kind:'truck',name:t1.name,plate:t1.plate,drv:t1.driver,cap:t1.horses,seats:t1.seats-1,leave:lv,from:t1.from,club:true,h:[],p:[]}];
  if(k.vans>1)V.push({id:'v2',kind:'van',name:'Van 2 places du club',plate:'GK-044-ZD',drv:'s02',cap:2,seats:3,leave:lv+15,from:t1.from,club:true,h:[],p:[]});
  pl={veh:V,poolH:[],poolP:[]};es.forEach(function(e,i){if(i<es.length-1){var v=V.find(function(x){return x.h.length<x.cap});v.h.push(e.horse);var s=V.find(function(x){return x.p.length<x.seats});s.p.push(e.rider)}else{pl.poolH.push(e.horse);pl.poolP.push(e.rider)}})}
 return TP[k.id]=pl}
function vehOf(pl,kind,id){return pl.veh.find(function(v){return v[kind].indexOf(id)>=0})}
function drvName(v){return v.drvName||nm(v.drv)}
function fees(k){var pl=kKind(k)==='away'?plan(k):null;return ents(k).map(function(e){var tr=0,how='';if(pl){var v=vehOf(pl,'h',e.horse);if(v&&v.club){tr=Math.round(k.km*2*cpRate/v.h.length*10)/10;how=v.name}else how=v?'Véhicule personnel':'À placer'}else if(k.km){tr=Math.round(k.km*2*cpRate/4*10)/10}
  var co=COACHFEE[e.coach]||20;return {e:e,fee:e.fee,tr:tr,how:how,co:co,tot:e.fee+tr+co}})}
function eur1(v){return F.eur(v,v%1?1:0)}
function matList(k){if(CHK[k.id])return CHK[k.id];return CHK[k.id]=[
 ['Papiers',[['Livrets des '+ents(k).length+' chevaux, vaccins à jour',true,'Nadia'],['Licences compétition vérifiées',true,'Nadia'],['Listes de départ imprimées',false,'Thomas']]],
 ['Camion',[['Plein de gazole et pression des pneus',true,'Thomas'],['Filets à foin et 80 L d’eau',false,'Mamadou'],['Protections de transport et licols de rechange',false,'Lucie'],['Trousse de premiers soins',true,'Lucie']]],
 ['Sellerie',[['Selles, filets et tapis du club',false,'Cavaliers'],['Guêtres, protège-boulets, crampons',false,'Cavaliers'],['Vestes de concours et dossards',false,'Cavaliers']]],
 ['Sur place',[['Seaux, éponges, couvre-reins',false,'Mamadou'],['Barnum et table de camp',true,'Kévin']]]]}

/* ---------- Envoi des engagements : saisie assistée ou fichier ---------- */
function ffeSheet(k){var es=ents(k),st=ENT[k.id]=ENT[k.id]||{done:{}},mode='saisie',tot=es.reduce(function(a,e){return a+e.fee},0);
 P.sheet({title:'Envoyer les engagements',icon:'send',wide:true,body:function(b,sh){
  function draw(){var n=es.filter(function(e){return st.done[e.rider]}).length;
   var s='<div class="note" style="margin-bottom:14px">'+I('info','sm')+'<span>FFE Compet n’ouvre pas d’accès direct aux logiciels de gestion. Piaffe prépare donc tout : vous engagez sur le site de la FFE sans rien rechercher ni retaper, et le club garde un bordereau complet.</span></div>'+
    '<div class="hrow sp wrap" style="margin-bottom:14px">'+U.seg([['saisie','Saisie assistée'],['fichier','Fichier d’export']],mode,'data-m')+'<span class="s mut">'+es.length+' engagements · <b class="num" style="color:var(--ink)">'+F.eur(tot)+'</b> débités du compte engageur</span></div>';
   if(mode==='saisie'){s+='<div class="hrow" style="--g:12px;margin-bottom:10px"><div class="grow">'+U.bar(n/es.length*100)+'</div><span class="s b num">'+n+' / '+es.length+' saisis</span></div><div class="card flat">'+
     es.map(function(e){var m=D.member(e.rider),h=D.horse(e.horse),ok=!!st.done[e.rider];return '<div class="cp-as">'+U.chk(ok,e.rider).replace('class="chk"','class="chk" data-a="tick"')+'<div style="min-width:0"><div class="b s ellip">'+m.first+' '+m.last+' <span class="mut" style="font-weight:500">· '+h.name+'</span></div><div class="xs mut ellip">'+e.class+'</div></div><div class="hrow wrap" style="--g:6px;justify-content:flex-end"><button class="cp-copy" data-a="copy" data-v="'+m.lic+'" title="Copier le numéro de licence">'+m.lic+I('copy')+'</button><button class="cp-copy hide-s" data-a="copy" data-v="'+h.sire+'" title="Copier le numéro SIRE">'+h.sire+I('copy')+'</button></div></div>'}).join('')+'</div>'+
     '<p class="xs mut" style="margin-top:12px">Copiez le numéro de licence et le numéro SIRE dans FFE Compet, puis cochez la ligne. Piaffe a déjà vérifié que chaque licence autorise la compétition.</p>'}
   else{s+='<div class="cp-csv">epreuve;licence;sire;cavalier;cheval;montant\n'+es.map(function(e){var m=D.member(e.rider),h=D.horse(e.horse);return e.class.split(' · ')[0]+';'+m.lic+';'+h.sire+';'+m.last.toUpperCase()+' '+m.first+';'+h.name.toUpperCase()+';'+e.fee}).join('\n')+'</div><p class="xs mut" style="margin-top:12px">Un fichier tableur, une ligne par engagement. Il sert de bordereau pour le club et se réimporte dans tout outil qui accepte un fichier, sans prétendre remplacer la validation sur FFE Compet.</p>'}
   b.innerHTML=s;b.querySelectorAll('[data-m]').forEach(function(x){x.addEventListener('click',function(){mode=x.getAttribute('data-m');draw()})});
   var f=sh.querySelector('.sf');f.innerHTML=mode==='saisie'?'<button class="btn" data-a="open">'+I('ext','sm')+'Ouvrir FFE Compet</button><button class="btn pri" data-a="all"'+(n===es.length?' disabled':'')+'>'+(n===es.length?'Engagements saisis':'Marquer les '+(es.length-n)+' restants comme saisis')+'</button>':'<button class="btn pri" data-a="dl">'+I('download','sm')+'Télécharger le fichier</button>'}
  draw();
  act(sh,{tick:function(x){var id=x.getAttribute('data-id');st.done[id]=!st.done[id];setTimeout(draw,180);fin()},
   copy:function(x){x.style.background='var(--ok-pale)';P.toast('Numéro '+x.getAttribute('data-v')+' copié',{icon:'copy',ms:1600})},
   open:function(){P.toast('FFE Compet s’ouvre dans un nouvel onglet',{icon:'ext'})},
   all:function(){es.forEach(function(e){st.done[e.rider]=true});draw();fin()},
   dl:function(){P.toast('engagements-'+k.place.split(',')[0].toLowerCase()+'.csv téléchargé',{icon:'download'})}});
  function fin(){if(es.every(function(e){return st.done[e.rider]})){st.sent=true;P.rerender();P.toast('Les '+es.length+' engagements sont saisis par le club, cavaliers prévenus')}else if(st.sent){st.sent=false;P.rerender()}}
 },foot:' '})}

/* ---------- Import des résultats FFE : fichier, rapprochement, rangement dans les fiches ---------- */
P.css(`
.cp-stp{display:flex;align-items:center;gap:8px;margin-bottom:16px;font-size:12.500px;font-weight:600;color:var(--mut);min-width:0}
.cp-stp span{display:inline-flex;align-items:center;gap:7px;white-space:nowrap;min-width:0}
.cp-stp b{width:24px;height:24px;flex:none;border-radius:50%;display:grid;place-items:center;font-size:12px;box-shadow:inset 0 0 0 1.500px var(--line-2)}
.cp-stp b svg.i{width:13px;height:13px}
.cp-stp span.on{color:var(--ink)}.cp-stp span.on b{background:var(--acc);color:var(--acc-ink);box-shadow:none}
.cp-stp span.ok b{background:var(--ok-pale);color:var(--ok);box-shadow:none}
.cp-stp i{flex:1;height:2px;background:var(--line);min-width:10px;border-radius:1px}
.cp-drop{width:100%;display:flex;flex-direction:column;align-items:center;gap:6px;padding:30px 16px;border-radius:var(--r-lg);border:1.500px dashed var(--line-2);background:var(--surface-2);text-align:center;transition:background var(--t-2),border-color var(--t-2)}
.cp-drop svg.i{width:28px;height:28px;color:var(--acc)}
.cp-drop:hover{border-color:var(--acc);background:var(--acc-pale)}
.cp-drop[disabled] svg.i{animation:cpspin 1s linear infinite}
@keyframes cpspin{to{transform:rotate(360deg)}}
.cp-mt{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 12px;align-items:center;padding:10px 14px}
.cp-mt+.cp-mt{border-top:1px solid var(--line)}
.cp-mt.skip>div:first-child{opacity:.6}
.cp-mt .b svg.i{width:13px;height:13px;color:var(--mut);vertical-align:-2px}
.cp-mtq{grid-column:1 / -1;display:flex;flex-direction:column;gap:8px;padding:10px 12px;border-radius:var(--r-md);background:var(--warn-pale)}
`);
var RESIMP={};
function ffeResSheet(k){var es=ents(k).filter(function(e){return e.res}),step=0,file='resultats-ffe-'+k.place.split(',')[0].toLowerCase().replace(/\s+/g,'-')+'-'+F.date(k.date).replace(/\D+/g,'-').replace(/-$/,'')+'.csv';
 var rows=es.map(function(e,i){var m=D.member(e.rider),h=D.horse(e.horse),how='Licence '+m.lic,st='ok',fileR=(m.last.toUpperCase()+' '+m.first).normalize('NFD').replace(/[̀-ͯ]/g,''),fileH=h.name.toUpperCase();
   if(i===2){fileH=h.name.toUpperCase().split(' ')[0]+'*HDV';how='SIRE '+h.sire+', nom du cheval différent'}
   if(i===3){fileR=m.last.toUpperCase()+' '+m.first.charAt(0)+'.';how='Licence absente du fichier';st='check'}
   return {e:e,m:m,h:h,fileR:fileR,fileH:fileH,how:how,st:st}});
 rows.push({ext:true,fileR:'DURAND PAUL',fileH:'IRIS DU CLOS',how:'Cavalier d’un autre club',st:'skip',cls:'Amateur 2 · 110 cm'});
 var alt=D.members.filter(function(m){return rows[3]&&rows[3].m&&m.last===rows[3].m.last&&m.id!==rows[3].m.id})[0]||D.member('m019');
 var sh=P.sheet({title:'Importer les résultats FFE',icon:'import',wide:true,body:function(b,sheet){
  function steps(){return '<div class="cp-stp">'+['Fichier','Rapprochement','Fiches'].map(function(t,i){return '<span class="'+(i<step?'ok':i===step?'on':'')+'"><b>'+(i<step?I('check','sm'):i+1)+'</b>'+t+'</span>'}).join('<i></i>')+'</div>'}
  function draw(){var s=steps(),f=sheet.querySelector('.sf');
   if(step===0){s+='<p class="s mut" style="margin-bottom:12px">Exportez les résultats depuis votre espace FFE Compet (menu Résultats, format tableur) puis déposez le fichier ici. Piaffe retrouve chaque cavalier par sa licence et chaque cheval par son numéro SIRE.</p>'+
     '<button class="cp-drop" data-a="pick">'+I('upload')+'<b>Déposer le fichier des résultats</b><span class="xs mut">ou toucher pour choisir · tableur ou XML</span></button>'+
     '<div class="note" style="margin-top:14px">'+I('info','sm')+'<span>FFE Compet ne transmet pas les résultats directement aux logiciels. Le fichier suffit : aucune saisie à refaire.</span></div>';
    f.innerHTML='<button class="btn" data-a="cancel">Annuler</button>'}
   else if(step===1){var chk=rows.filter(function(r){return r.st==='check'}).length,ok=rows.filter(function(r){return r.st==='ok'}).length;
    s+='<div class="hrow sp wrap" style="--g:8px;margin-bottom:12px"><span class="hrow s" style="--g:8px">'+I('doc','sm')+'<b class="ellip">'+file+'</b></span><span class="s mut">'+rows.length+' lignes lues · <b class="num" style="color:var(--ink)">'+ok+'</b> rapprochées'+(chk?' · <b class="warnc">'+chk+' à vérifier</b>':'')+'</span></div><div class="card flat">'+
     rows.map(function(r,i){var chip=r.st==='ok'?U.chip(r.how.indexOf('SIRE')===0?'Rapproché par le SIRE':'Rapproché','ok',true):r.st==='skip'?U.chip('Ignoré','',true):U.chip('À vérifier','warn',true);
      return '<div class="cp-mt'+(r.st==='skip'?' skip':'')+'"><div style="min-width:0"><div class="xs mut mono ellip">'+r.fileR+' · '+r.fileH+'</div><div class="b s ellip" style="margin-top:3px">'+(r.ext?'Hors club':I('arrow','sm')+' '+r.m.first+' '+r.m.last+' <span class="mut" style="font-weight:500">· '+r.h.name+'</span>')+'</div><div class="xs mut ellip">'+(r.ext?r.cls:r.e.class+' · '+(r.e.res.rank?r.e.res.rank+'e sur '+r.e.res.of:'non classée'))+' · '+r.how+'</div></div>'+
       '<div class="hrow" style="--g:6px;justify-content:flex-end">'+chip+'</div>'+
       (r.st==='check'?'<div class="cp-mtq"><span class="xs mut">'+(alt.last===r.m.last?'Deux membres du club portent ce nom.':'Ce nom correspond à plusieurs membres du club.')+' Choisissez la bonne personne.</span><div class="hrow wrap" style="--g:6px"><button class="btn sm dark" data-a="mok" data-i="'+i+'">'+r.m.first+' '+r.m.last+', Galop '+r.m.galop+'</button><button class="btn sm" data-a="malt" data-i="'+i+'">'+alt.first+' '+alt.last+', '+(alt.galop?'Galop '+alt.galop:'sans galop')+'</button></div></div>':'')+'</div>'}).join('')+'</div>';
    f.innerHTML='<button class="btn" data-a="back">Retour</button><button class="btn pri" data-a="store"'+(chk?' disabled':'')+'>'+(chk?'Vérifiez la ligne restante':'Ranger les '+ok+' résultats dans les fiches')+'</button>'}
   else{var n=rows.filter(function(r){return r.st==='ok'}).length,cl=rows.filter(function(r){return r.st==='ok'&&r.e.res.clear}).length;
    s+='<div class="stack" style="--g:14px;align-items:center;text-align:center;padding:8px 0 4px"><span class="strass" style="width:22px;height:22px"></span><h3 style="font-size:21px">'+n+' résultats rangés</h3><p class="s mut" style="max-width:440px">Le palmarès de chaque cavalier et la fiche de chaque cheval sont à jour. Les cavaliers voient leur résultat dans leur application.</p></div>'+
     '<div class="card flat" style="padding:4px 14px">'+row('Palmarès des cavaliers mis à jour','<span class="num">'+n+'</span>')+row('Fiches des chevaux mises à jour','<span class="num">'+n+'</span>')+row('Sans-faute','<span class="num">'+cl+'</span>')+row('Ligne d’un autre club','Ignorée')+'</div>';
    f.innerHTML='<button class="btn" data-a="cancel">Fermer</button><button class="btn pri" data-a="pub">'+I('send','sm')+'Publier sur le portail</button>'}
   b.innerHTML=s;P.animate(b)}
  draw();
  act(sheet,{pick:function(x){x.innerHTML=I('refresh')+'<b>Lecture du fichier</b><span class="xs mut">'+file+'</span>';x.disabled=true;setTimeout(function(){step=1;draw();P.toast(rows.length+' lignes lues, '+rows.filter(function(r){return r.st==='ok'}).length+' rapprochées automatiquement',{icon:'import'})},P.RM?50:700)},
   mok:function(x){var r=rows[+x.getAttribute('data-i')];r.st='ok';r.how='Confirmé par vous';draw();P.toast('Résultat rattaché à '+r.m.first+' '+r.m.last,{icon:'link'})},
   malt:function(x){var r=rows[+x.getAttribute('data-i')];r.st='skip';r.how='Écarté : '+alt.first+' n’était pas engagée';draw();P.toast(alt.first+' n’était pas engagée à ce concours, la ligne est écartée',{icon:'info'})},
   back:function(){step=0;draw()},cancel:function(){sheet.close()},
   store:function(){step=2;RESIMP[k.id]={at:'aujourd’hui à '+th(9*60+41),n:rows.filter(function(r){return r.st==='ok'}).length};draw();P.toast(RESIMP[k.id].n+' résultats rangés dans les fiches des cavaliers',{icon:'checkc'})},
   pub:function(){cpPub[k.id]=true;sheet.close();P.rerender();P.toast('Résultats publiés sur le portail des adhérents',{icon:'send'})}});
 },foot:' ',onClose:function(){if(RESIMP[k.id])P.rerender()}})}

/* ---------- Qui emmène qui ---------- */
function board(root,k){var pl=plan(k),es=ents(k),rOf={},hOf={},sel=null;es.forEach(function(e){rOf[e.horse]=e.rider;hOf[e.rider]=e.horse});
 function tokH(id,inStall){var h=D.horse(id);return '<button class="qq-tok" data-k="h" data-id="'+id+'" title="'+E(h.name)+'">'+U.hav(h,inStall?'':'sm')+'<span><b>'+h.name+'</b><small>'+fst(rOf[id])+(inStall?'':' · '+(es.find(function(e){return e.horse===id})||{}).class)+'</small></span></button>'}
 function tokP(id,seat){var m=D.member(id);return seat?'<button class="qq-seat qq-tok" data-k="p" data-id="'+id+'" title="'+E(m.first+' '+m.last)+'">'+U.av(m)+'<em>'+m.first+'</em></button>':'<button class="qq-tok" data-k="p" data-id="'+id+'">'+U.av(m,'sm')+'<span><b>'+m.first+' '+m.last+'</b><small>Cavalier de '+D.horse(hOf[id]).name+'</small></span></button>'}
 function veh(v){var free=v.seats-v.p.length,seats='<span class="qq-seat drv" title="Conducteur">'+(v.drv?U.av(v.drv):'<span class="av" style="--c:var(--c3)">'+drvName(v).split(' ').map(function(x){return x[0]}).join('')+'</span>')+'<em>'+drvName(v).split(' ')[0]+'</em></span>'+v.p.map(function(p){return tokP(p,true)}).join('');
  for(var i=0;i<free;i++)seats+='<span class="qq-seat"><span class="hole">'+I('plus')+'</span><em>Libre</em></span>';
  var stalls='';for(var j=0;j<v.cap;j++)stalls+='<div class="qq-stall">'+(v.h[j]?tokH(v.h[j],true):'Place libre')+'</div>';
  var lvc='<div class="qq-leave" title="Heure de départ"><button data-a="lv" data-v="'+v.id+'" data-d="-15" title="Partir 15 minutes plus tôt">'+I('minus','sm')+'</button><b>'+tc(v.leave)+'</b><button data-a="lv" data-v="'+v.id+'" data-d="15" title="Partir 15 minutes plus tard">'+I('plus','sm')+'</button></div>';
  return '<div class="card qq-veh '+v.kind+'"><div class="qq-vh">'+sq(v.kind==='car'?'car':v.kind==='van'?'van':'truck',v.club?'acc':'ok')+'<div class="grow"><div class="b ellip">'+v.name+'</div><div class="xs mut ellip">'+(v.plate?v.plate+' · ':'')+(v.kind==='car'?'Covoiturage depuis '+v.from:drvName(v)+' conduit · '+v.from)+'</div></div>'+(v.kind==='car'?'':lvc)+'</div>'+
   '<div class="qq-body"><div class="qq-cab qq-zone" data-zone="'+v.id+':p">'+seats+'</div>'+(v.cap?'<div class="qq-box qq-zone" style="--n:'+v.cap+'" data-zone="'+v.id+':h">'+stalls+'</div>':'')+'</div>'+
   '<div class="hrow wrap xs mut" style="--g:6px 14px">'+(v.kind==='car'?'<span class="grow" style="order:2"></span><span style="order:3">'+lvc+'</span>':'')+(v.cap?'<span><b class="num" style="color:var(--ink)">'+v.h.length+' / '+v.cap+'</b> chevaux</span>':'')+'<span><b class="num" style="color:var(--ink)">'+v.p.length+' / '+v.seats+'</b> passagers</span>'+(v.kind!=='car'&&k.km>65?(v.club?'<span class="chip ok dot">Certificat de transport valide</span>':''):'')+(v.cap&&v.h.length===v.cap?'<span class="chip">Complet</span>':'')+'</div></div>'}
 function route(){var t=pl.veh[0],dr=drive(k.km),arr=t.leave+dr,rec=8*60+15,late=arr>rec-30;
  return '<div class="card"><div class="ch"><h3>Itinéraire</h3><span class="xs mut num">'+k.km+' km · '+th(dr).replace(' h',' h').replace(/^0 h /,'')+(dr<60?' min':'')+'</span></div><div class="cb stack" style="--g:14px">'+
   '<svg class="qq-map" viewBox="0 0 300 150" role="img" aria-label="Itinéraire de l’écurie au concours"><path class="wood" d="M150 0h150v62c-30 14-62 8-84-10S168 26 150 0zM0 96c26-12 58-6 76 12s22 30 30 42H0z"/><path class="rd" d="M0 40C60 52 110 30 170 44s90 30 130 22M80 0c8 40-6 80 14 150M210 150c-10-40 14-70 6-110"/>'+
   '<path id="qq-rt" class="rt" d="M38 112C70 108 84 84 118 82s50 14 78 4 34-36 62-44"/><circle cx="38" cy="112" r="6" fill="var(--navy)"/><circle cx="38" cy="112" r="2.200" fill="var(--navy-ink)"/><circle cx="258" cy="42" r="9" fill="var(--acc)" opacity=".2"/><circle cx="258" cy="42" r="5" fill="var(--acc)"/>'+
   (P.RM?'':'<circle r="4.500" fill="var(--surface)" stroke="var(--acc)" stroke-width="2.500"><animateMotion dur="7s" begin="1.4s" repeatCount="indefinite" path="M38 112C70 108 84 84 118 82s50 14 78 4 34-36 62-44"/></circle>')+
   '<text x="50" y="132">Les Tilleuls</text><text x="250" y="24" text-anchor="end">'+k.place.split(',')[0]+'</text></svg>'+
   '<div class="tl" style="margin-top:2px"><div class="ev" style="--c:var(--mut-2)"><div class="hrow sp"><span class="s b">Embarquement des chevaux</span><span class="s num mut">'+tc(t.leave-30)+'</span></div><div class="xs mut">'+t.from+', protections posées</div></div>'+
   '<div class="ev"><div class="hrow sp"><span class="s b">Départ du camion</span><span class="s num b">'+tc(t.leave)+'</span></div><div class="xs mut">'+drvName(t)+' au volant</div></div>'+
   '<div class="ev" style="--c:'+(late?'var(--warn)':'var(--acc)')+'"><div class="hrow sp"><span class="s b">Arrivée à '+k.place.split(',')[0]+'</span><span class="s num b'+(late?' warnc':'')+'">'+tc(arr)+'</span></div><div class="xs mut">'+(late?'Moins de 30 minutes avant la reconnaissance':'Débarquement et marche en main')+'</div></div>'+
   '<div class="ev" style="--c:var(--mut-2)"><div class="hrow sp"><span class="s b">Reconnaissance du parcours</span><span class="s num mut">08:15</span></div></div>'+
   '<div class="ev" style="--c:var(--mut-2);padding-bottom:0"><div class="hrow sp"><span class="s b">Première épreuve</span><span class="s num mut">09:00</span></div><div class="xs mut">'+es[es.length>3?3:0].class+'</div></div></div>'+
   (k.km>65?'<div class="note">'+I('shield','sm')+'<span>Trajet de plus de 65 km : Piaffe a vérifié le certificat de compétence au transport d’animaux vivants de '+drvName(t).split(' ')[0]+', valable jusqu’en 2029.</span></div>':'')+
   '<button class="btn block" data-a="gps">'+I('route','sm')+'Envoyer l’itinéraire à '+drvName(t).split(' ')[0]+'</button></div></div>'}
 function draw(moved){var nH=es.length-pl.poolH.length,nP=es.length-pl.poolP.length,all=!pl.poolH.length&&!pl.poolP.length,cars=pl.veh.filter(function(v){return v.kind==='car'}),big=pl.veh.filter(function(v){return v.kind!=='car'});
  root.innerHTML='<div class="card qq-sum">'+(all?'<span class="qq-done"><span class="strass"></span>Tout le monde a une place</span>':'<span class="hrow s b" style="--g:8px">'+I('alert','sm')+(pl.poolH.length?pl.poolH.length+' cheva'+(pl.poolH.length>1?'ux':'l')+(pl.poolP.length?' et '+pl.poolP.length+' cavalier'+(pl.poolP.length>1?'s':''):'')+' à placer':pl.poolP.length+' cavalier'+(pl.poolP.length>1?'s':'')+' à placer')+'</span>')+
   '<span class="grow"></span><span class="s mut"><b class="num" style="color:var(--ink)">'+nH+' / '+es.length+'</b> chevaux · <b class="num" style="color:var(--ink)">'+nP+' / '+es.length+'</b> cavaliers</span>'+
   (all?'':'<button class="btn sm" data-a="auto">'+I('assistant','sm')+'Placer automatiquement</button>')+'<button class="btn sm dark" data-a="share">'+I('send','sm')+'Envoyer le plan aux familles</button></div>'+
   '<div class="qq'+(sel?' picking':'')+'"><div class="card qq-pool"><div><div class="eyebrow">À placer</div><div class="xs mut" style="margin-top:4px">Glissez un cheval ou un cavalier vers sa place, ou touchez-le puis touchez la place.</div></div>'+
    '<div class="qq-zone" data-zone="pool:h">'+(pl.poolH.length?pl.poolH.map(function(h){return tokH(h)}).join(''):'<span class="xs mut" style="padding:6px">Tous les chevaux ont une place.</span>')+'</div>'+
    '<div class="qq-zone" data-zone="pool:p">'+(pl.poolP.length?pl.poolP.map(function(p){return tokP(p)}).join(''):'<span class="xs mut" style="padding:6px">Tous les cavaliers ont un siège.</span>')+'</div></div>'+
   '<div class="stack" style="--g:14px">'+big.map(veh).join('')+(cars.length?'<div class="qq-cars">'+cars.map(veh).join('')+'</div>':'')+'</div>'+
   '<div class="stack" style="--g:14px" data-route>'+route()+'</div></div>';
  if(sel){var t=root.querySelector('.qq-tok[data-id="'+sel.id+'"]');if(t)t.classList.add('sel');mark(sel.k,sel.id)}
  if(moved){pulse(root.querySelector('.qq-tok[data-id="'+moved+'"]'))}}
 function cap(z,kind,id){var a=z.split(':');if(a[1]!==kind)return false;if(a[0]==='pool')return true;var v=pl.veh.find(function(x){return x.id===a[0]});if(v[kind].indexOf(id)>=0)return false;return kind==='h'?v.h.length<v.cap:v.p.length<v.seats}
 function mark(kind,id){root.querySelectorAll('.qq-zone').forEach(function(z){z.classList.toggle('can',cap(z.getAttribute('data-zone'),kind,id))})}
 function move(kind,id,zone){var a=zone.split(':');if(a[1]!==kind)return false;
  if(a[0]!=='pool'){var v=pl.veh.find(function(x){return x.id===a[0]});if(v[kind].indexOf(id)>=0)return false;if((kind==='h'?v.h.length>=v.cap:v.p.length>=v.seats)){var z=root.querySelector('[data-zone="'+zone+'"]');if(z){z.classList.remove('full-shake');void z.offsetWidth;z.classList.add('full-shake')}P.toast(v.name+' est complet',{icon:'alert',ms:1800});return false}}
  pl.veh.forEach(function(x){x[kind]=x[kind].filter(function(i){return i!==id})});var pk=kind==='h'?'poolH':'poolP';pl[pk]=pl[pk].filter(function(i){return i!==id});
  if(a[0]==='pool')pl[pk].push(id);else pl.veh.find(function(x){return x.id===a[0]})[kind].push(id);
  sel=null;var was=root.querySelector('.qq-done');draw(id);
  var nmv=kind==='h'?D.horse(id).name:fst(id);if(a[0]!=='pool'){var vv=pl.veh.find(function(x){return x.id===a[0]});if(!was&&root.querySelector('.qq-done'))P.toast('Plan de transport complet : tout le monde a une place',{icon:'checkc'});else P.toast(nmv+(kind==='h'?' voyage dans : ':' monte dans : ')+vv.name,{ms:1800})}
  return true}
 draw();
 /* glisser à la souris ou au doigt, sinon toucher puis toucher */
 var dg=null;
 root.addEventListener('pointerdown',function(e){var t=e.target.closest('.qq-tok');if(!t||e.button>0)return;dg={t:t,x:e.clientX,y:e.clientY,k:t.getAttribute('data-k'),id:t.getAttribute('data-id'),on:false,touch:e.pointerType==='touch'}});
 function mv(e){if(!dg)return;if(!dg.on){if(dg.touch||Math.abs(e.clientX-dg.x)+Math.abs(e.clientY-dg.y)<7)return;dg.on=true;dg.g=dg.t.cloneNode(true);dg.g.classList.add('qq-ghost');dg.g.classList.remove('sel');if(!dg.g.classList.contains('qq-seat'))dg.g.style.width=Math.min(180,dg.t.offsetWidth)+'px';document.body.appendChild(dg.g);dg.t.classList.add('drag');root.querySelector('.qq').classList.add('picking');mark(dg.k,dg.id)}
  dg.g.style.left=e.clientX+'px';dg.g.style.top=e.clientY+'px';var z=document.elementFromPoint(e.clientX,e.clientY);z=z&&z.closest('.qq-zone');root.querySelectorAll('.qq-zone.over').forEach(function(x){x.classList.remove('over')});if(z&&z.classList.contains('can'))z.classList.add('over');dg.z=z}
 function up(){if(!dg)return;var d=dg;dg=null;if(!d.on)return;d.g.remove();d.t.classList.remove('drag');d.dragged=true;root.__drag=Date.now();if(!(d.z&&move(d.k,d.id,d.z.getAttribute('data-zone')))){sel=null;draw()}}
 document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up);document.addEventListener('pointercancel',function(){if(dg&&dg.on){dg.g.remove();dg.t.classList.remove('drag')}dg=null});
 var ob=new MutationObserver(function(){if(!root.isConnected){document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);ob.disconnect()}});ob.observe(P.app(),{childList:true,subtree:true});
 root.addEventListener('click',function(e){if(root.__drag&&Date.now()-root.__drag<250)return;var a=e.target.closest('[data-a]');if(a)return;
  var t=e.target.closest('.qq-tok'),z=e.target.closest('.qq-zone');
  if(sel&&z&&cap(z.getAttribute('data-zone'),sel.k,sel.id)&&!(t&&t.getAttribute('data-id')===sel.id)){move(sel.k,sel.id,z.getAttribute('data-zone'));return}
  if(t){var id=t.getAttribute('data-id');sel=sel&&sel.id===id?null:{k:t.getAttribute('data-k'),id:id};draw();return}
  if(sel){sel=null;draw()}});
 act(root,{lv:function(b){var v=pl.veh.find(function(x){return x.id===b.getAttribute('data-v')});v.leave+=+b.getAttribute('data-d');draw();pulse(root.querySelector('[data-v="'+v.id+'"]').parentNode)},
  auto:function(){pl.poolH.slice().forEach(function(h){var v=pl.veh.find(function(x){return x.h.length<x.cap});if(v){v.h.push(h);pl.poolH=pl.poolH.filter(function(i){return i!==h})}});
   pl.poolP.slice().forEach(function(p){var hv=vehOf(pl,'h',hOf[p]),v=hv&&hv.p.length<hv.seats?hv:pl.veh.find(function(x){return x.p.length<x.seats});if(v){v.p.push(p);pl.poolP=pl.poolP.filter(function(i){return i!==p})}});
   sel=null;draw();P.toast('Plan complété : chaque cavalier voyage avec son cheval quand c’est possible')},
  share:function(){P.toast(pl.poolH.length?'Plan envoyé, '+pl.poolH.length+' cheval'+(pl.poolH.length>1?'aux':'')+' encore à placer':'Plan de transport envoyé aux '+es.length+' familles avec les heures de départ',{icon:'send'})},
  gps:function(b){b.innerHTML=I('check','sm')+'Itinéraire envoyé';P.toast('Itinéraire envoyé sur le téléphone de '+drvName(pl.veh[0]).split(' ')[0])}});
}

/* ---------- Chronométrage du concours à domicile ---------- */
var LIVE={rank:[{r:'m019',h:'h02',pts:0,t:58.42},{r:'m044',h:'h12',pts:4,t:55.10},{r:'m003',h:'h05',pts:0,t:62.87}],queue:[{r:'m008',h:'h14'},{r:'m022',h:'h20'}],run:false,t:0,pts:0,pub:true};
function liveTab(root){var tm=null;
 function sortR(){LIVE.rank.sort(function(a,b){return a.pts-b.pts||a.t-b.t})}
 function clock(){var s=LIVE.t.toFixed(2).split('.');return s[0]+'<small>,'+s[1]+' s</small>'}
 function draw(){sortR();var cur=LIVE.queue[0];
  root.innerHTML='<div class="g3"><div class="card navy cp-live span2">'+(cur?'<div class="hrow sp wrap"><span class="hrow" style="--g:8px">'+(LIVE.run?'<span class="live">EN PISTE</span>':'<span class="chip" style="background:color-mix(in srgb,var(--navy-ink) 14%,transparent);color:var(--navy-ink)">Prêt au départ</span>')+'<span class="s mut">Club 2 · 85 cm · barème A au chrono</span></span><span class="s mut">Dossard '+(LIVE.rank.length+1)+' sur '+(LIVE.rank.length+LIVE.queue.length)+'</span></div>'+
    '<div class="hrow" style="--g:14px">'+U.av(cur.r,'lg')+'<div><div class="disp" style="font-size:22px;font-weight:700;color:var(--navy-ink)">'+nm(cur.r)+'</div><div class="s mut">'+D.horse(cur.h).name+'</div></div></div>'+
    '<div class="hrow sp wrap" style="--g:16px;align-items:flex-end"><div class="cp-clock" data-clock>'+clock()+'</div><div style="text-align:right"><div class="disp num" style="font-size:34px;font-weight:700;color:var(--navy-ink)" data-pts>'+LIVE.pts+'</div><div class="xs mut">points de pénalité</div></div></div>'+
    '<div class="hrow wrap" style="--g:8px"><button class="cp-lbtn go" data-a="go">'+I(LIVE.run?'pause':'play','sm')+(LIVE.run?'Arrêter le chrono':'Lancer le chrono')+'</button><button class="cp-lbtn" data-a="bar">'+I('plus','sm')+'Barre, 4 points</button><button class="cp-lbtn" data-a="ref">'+I('plus','sm')+'Refus, 4 points</button></div>'
    :'<div class="hrow" style="--g:10px"><span class="strass" style="background:var(--strass)"></span><span class="eyebrow" style="color:var(--strass)">Épreuve terminée</span></div><div class="disp" style="font-size:24px;font-weight:700;color:var(--navy-ink)">'+nm(LIVE.rank[0].r)+' remporte le Club 2 avec '+D.horse(LIVE.rank[0].h).name+'.</div><p class="s mut">Le classement est publié sur le portail. Les résultats officiels se saisissent ensuite sur le site de la FFE, Piaffe prépare le fichier.</p><div class="hrow"><button class="cp-lbtn go" data-a="exportres">'+I('download','sm')+'Préparer le fichier des résultats</button></div>')+'</div>'+
   '<div class="card"><div class="ch" style="padding-bottom:8px"><h3>Classement provisoire</h3><span class="xs mut">'+LIVE.rank.length+' passés</span></div>'+LIVE.rank.map(function(x,i){return '<div class="cp-rk'+(i===0?' top':'')+'"><span class="pos">'+(i+1)+'</span><div style="min-width:0"><div class="b s ellip">'+nm(x.r)+'</div><div class="xs mut ellip">'+D.horse(x.h).name+'</div></div>'+(x.pts===0?'<span class="chip acc"><span class="strass" style="width:8px;height:8px"></span>Sans-faute</span>':'<span class="chip">'+x.pts+' pts</span>')+'<b class="s num">'+x.t.toFixed(2).replace('.',',')+'</b></div>'}).join('')+
    (LIVE.queue.length>1?'<div class="cf" style="justify-content:space-between"><span class="xs mut">Ensuite : '+LIVE.queue.slice(1).map(function(q){return nm(q.r)}).join(', ')+'</span></div>':'')+'</div></div>'+
   '<div class="card pad hrow wrap sp" style="margin-top:14px;--g:14px"><label class="hrow s" style="--g:10px;cursor:pointer">'+U.tog(LIVE.pub).replace('class="tog"','class="tog" data-a="pub"')+'<span><b>Résultats en direct sur le portail</b><span class="mut hide-s"> · les familles suivent l’épreuve depuis leur téléphone</span></span></label><button class="btn" data-a="screen">'+I('expand','sm')+'Afficher sur l’écran du club-house</button></div>'}
 function tick(){if(!root.isConnected){clearInterval(tm);LIVE.run=false;return}LIVE.t+=.07;var c=root.querySelector('[data-clock]');if(c)c.innerHTML=clock()}
 draw();
 act(root,{go:function(){if(!LIVE.run){LIVE.run=true;tm=setInterval(tick,70);draw()}else{clearInterval(tm);LIVE.run=false;var c=LIVE.queue.shift();LIVE.rank.push({r:c.r,h:c.h,pts:LIVE.pts,t:Math.max(LIVE.t,41.3)});var cl=LIVE.pts===0;LIVE.t=0;LIVE.pts=0;draw();P.toast(cl?fst(c.r)+' signe un sans-faute, classement mis à jour':'Parcours enregistré, classement mis à jour')}},
  bar:function(){LIVE.pts+=4;var p=root.querySelector('[data-pts]');p.textContent=LIVE.pts;pulse(p)},ref:function(){LIVE.pts+=4;var p=root.querySelector('[data-pts]');p.textContent=LIVE.pts;pulse(p)},
  pub:function(){LIVE.pub=!LIVE.pub;P.toast(LIVE.pub?'Résultats visibles en direct sur le portail':'Diffusion en direct coupée')},
  screen:function(){P.toast('Classement affiché sur l’écran du club-house',{icon:'expand'})},
  exportres:function(){P.toast('Fichier des résultats prêt pour la saisie FFE',{icon:'download'})}});
}

function startList(c){var rs=D.members.filter(function(m){return m.galop>=2&&m.forfait!=='f5'}).slice(c.n*3,c.n*4);
 P.sheet({title:'Liste de départ · '+c.name,icon:'list',body:'<p class="s mut" style="margin-bottom:12px">Début à '+th(hm(c.t))+' sur la carrière d’honneur. Un passage toutes les 3 minutes, détente en petite carrière.</p><div class="card flat list">'+rs.map(function(m,i){return '<div class="li"><span class="b num mut" style="width:22px">'+(i+1)+'</span>'+U.av(m,'sm')+'<div class="grow"><div class="t">'+m.first+' '+m.last+'</div><div class="s">'+D.horses[(i*3+c.n)%20].name+'</div></div><span class="s num mut">'+tc(hm(c.t)+i*3)+'</span></div>'}).join('')+'</div>',
  foot:'<button class="btn" data-pr>'+I('download','sm')+'Imprimer</button><button class="btn pri" data-sd>Envoyer aux engagés</button>'}).addEventListener('click',function(e){if(e.target.closest('[data-pr]'))P.toast('Liste de départ envoyée à l’impression');if(e.target.closest('[data-sd]'))P.toast('Horaires de passage envoyés aux '+c.n+' engagés')})}

function importSheet(){var L=[['CSO Club et Poney','Le Perray-en-Yvelines','sam. 28 nov.',11],['Hunter Club','Jouy-en-Josas','dim. 6 déc.',31],['Dressage Club','Rambouillet','dim. 13 déc.',24],['CSO Amateur et Pro','Fontainebleau, Grand Parquet','sam. 19 déc.',71]];
 P.sheet({title:'Importer le calendrier',icon:'import',body:'<p class="s mut" style="margin-bottom:12px">Déposez le fichier exporté depuis votre espace FFE (format tableur ou XML). Piaffe y a trouvé 4 concours à moins de 80 km qui correspondent au niveau de vos cavaliers.</p><div class="card flat list">'+L.map(function(x,i){return '<div class="li">'+U.chk(i<2)+'<div class="grow"><div class="t">'+x[0]+'</div><div class="s">'+x[1]+' · '+x[2]+' · '+x[3]+' km</div></div></div>'}).join('')+'</div>',foot:'<button class="btn pri" data-ok>Ajouter au calendrier du club</button>'}).querySelector('[data-ok]').onclick=function(e){var n=e.target.closest('.sheet').querySelectorAll('.chk[aria-checked="true"]').length;e.target.closest('.sheet').close();P.toast(n+' concours ajoutés au calendrier et proposés aux cavaliers')}}
function newComp(){P.sheet({title:'Ajouter un concours',icon:'compet',body:'<div class="stack" style="--g:12px"><label class="field"><span>Nom du concours</span><input class="in" value="CSO Club et Poney"></label><label class="field"><span>Lieu</span><input class="in" value="Le Perray-en-Yvelines"></label><div class="g2" style="--g:12px"><label class="field"><span>Date</span><input class="in" value="samedi 28 novembre"></label><label class="field"><span>Clôture des engagements</span><input class="in" value="lundi 23 novembre"></label></div><label class="field"><span>Discipline</span><select class="in"><option>CSO</option><option>Dressage</option><option>CCE</option><option>Hunter</option></select></label><div class="card flat" style="padding:4px 14px">'+row('Ouvrir les inscriptions aux adhérents',U.tog(true))+row('Organisé à domicile',U.tog(false))+'</div></div>',foot:'<button class="btn pri" data-ok>Ajouter le concours</button>'}).querySelector('[data-ok]').onclick=function(e){e.target.closest('.sheet').close();P.toast('Concours ajouté, les cavaliers peuvent demander à s’engager')}}

P.mod({id:'competitions',role:'gerant',group:'Club',title:'Compétitions',icon:'compet',n:50,phoneTitle:'Concours',
 badge:function(){return {v:1}},
 render:function(el,ctx){el.classList.add('cg-pg');
  if(ctx.params&&ctx.params.id&&D.competitions.some(function(k){return k.id===ctx.params.id})){cpSel=ctx.params.id;if(ctx.params.tab)cpTab[cpSel]=ctx.params.tab;ctx.params.id=null}
  var next=D.competitions[0];
  el.innerHTML=ph('Compétitions','Prochain départ '+F.dateL(next.date)+' pour '+next.place.split(',')[0]+' · clôture des engagements '+F.rel(next.closes),
   '<button class="btn" data-a="imp">'+I('import','sm')+'Importer le calendrier</button><button class="btn pri" data-a="new">'+I('plus','sm')+'Ajouter un concours</button>')+
   '<div class="cp-strip scroll-x" data-strip></div><div data-detail></div>';
  var strip=el.querySelector('[data-strip]'),det=el.querySelector('[data-detail]');
  function drawStrip(){strip.innerHTML=D.competitions.slice().sort(function(a,b){return a.date<b.date?-1:1}).map(function(k){var d=new Date(k.date+'T12:00:00');return '<button class="cp-k" data-a="sel" data-id="'+k.id+'" aria-selected="'+(k.id===cpSel)+'"><span class="fx-date"><span>'+['janv','févr','mars','avr','mai','juin','juil','août','sept','oct','nov','déc'][d.getMonth()]+'</span><b>'+d.getDate()+'</b></span><span style="min-width:0;display:flex;flex-direction:column;gap:5px"><span class="nm">'+k.name+'</span><span class="xs mut ellip">'+(k.km?k.place.split(',')[0]+' · '+k.km+' km':'À domicile')+'</span><span>'+U.chip(k.status==='Terminé'?'Terminé':k.status==='Organisation'?'On organise':ents(k).length+' engagés',cClass(k),k.status!=='Terminé')+'</span></span></button>'}).join('')}
  function drawDetail(){var k=D.competitions.find(function(x){return x.id===cpSel}),kind=kKind(k),es=ents(k),st=ENT[k.id]||{},dc=F.days(k.closes);
   var tabs=kind==='away'?[['eng','Engagements'],['qui','Qui emmène qui'],['mat','Matériel'],['frais','Frais']]:kind==='home'?[['epr','Épreuves'],['ben','Bénévoles'],['buv','Buvette'],['chrono','Chronométrage']]:[['res','Résultats'],['eng','Engagements'],['frais','Frais']];
   var tab=cpTab[k.id]&&tabs.some(function(t){return t[0]===cpTab[k.id]})?cpTab[k.id]:tabs[0][0];
   var h='<div class="card cp-head"><div class="grow" style="min-width:220px"><div class="hrow wrap" style="--g:6px;margin-bottom:8px">'+U.chip(k.disc,'navy')+U.chip(k.level,'line')+(kind==='away'?(st.sent?'<span class="chip acc"><span class="strass" style="width:8px;height:8px"></span>Engagements saisis par le club</span>':U.chip('Clôture '+F.rel(k.closes),dc<=2?'warn':'',true)):kind==='home'?U.chip('Déclaré à la FFE · n° '+HS.duc,'ok',true):U.chip(k.results,'ok',true))+'</div><h2>'+k.name+'</h2><div class="s mut" style="margin-top:4px">'+F.dateL(k.date).replace(/^./,function(c){return c.toUpperCase()})+' · '+k.place+(k.km?' · '+k.km+' km':'')+'</div></div>'+
    '<div class="acts hrow wrap" style="--g:8px">'+(kind==='away'?'<button class="btn cp-ic" data-a="grp" title="Écrire au groupe">'+I('chat','sm')+'<span>Écrire au groupe</span></button><button class="btn dark" data-a="ffe">'+I('send','sm')+'Envoyer les engagements</button>':kind==='home'?'<button class="btn cp-ic" data-a="aff" title="Créer l’affiche">'+I('image','sm')+'<span>Créer l’affiche</span></button><button class="btn dark" data-a="prog">'+I('send','sm')+'Publier le programme</button>':'<button class="btn cp-ic" data-a="resimp" title="Importer les résultats FFE">'+I('upload','sm')+'<span>Importer les résultats FFE</span></button><button class="btn dark" data-a="recap">'+I('send','sm')+'Partager le résumé</button>')+'</div></div>'+
    '<div class="fx-tabs">'+U.tabs(tabs,tab,'data-t')+'</div><div data-tb></div>';
   det.innerHTML=h;var tb=det.querySelector('[data-tb]');
   det.querySelectorAll('[data-t]').forEach(function(t){t.addEventListener('click',function(){cpTab[k.id]=t.getAttribute('data-t');drawTab(k,t.getAttribute('data-t'),tb)})});
   drawTab(k,tab,tb)}
  function drawTab(k,tab,tb){var es=ents(k),kind=kKind(k),st=ENT[k.id]||{done:{}},s='';
   if(tab==='qui'){tb.innerHTML='';var r=document.createElement('div');tb.appendChild(r);board(r,k);return}
   if(tab==='chrono'){tb.innerHTML='';var r2=document.createElement('div');tb.appendChild(r2);liveTab(r2);P.animate(r2);return}
   if(tab==='eng'){var tot=es.reduce(function(a,e){return a+e.fee},0),bad=kind==='away'&&k.id==='k1'?'m034':null;
    s+=(bad&&!st.done[bad]?'<div class="note warn cp-nw" style="margin-bottom:14px">'+I('alert','sm')+'<span class="grow">La licence de '+nm(bad)+' n’autorise pas encore la compétition : il manque le certificat médical. Sa famille peut le déposer depuis l’application.</span><button class="btn sm" data-a="lic">Demander le certificat</button></div>':'')+
    '<div class="card"><div class="cp-e cp-eh"><span>Cavalier</span><span>Cheval et épreuve</span><span class="co">Coach</span><span class="n">Tarif</span><span>Statut</span></div>'+
    es.map(function(e){var m=D.member(e.rider),c=D.coach(e.coach);return '<div class="cp-e"><span class="hrow" style="--g:10px">'+U.av(m)+'<span class="b s ellip">'+m.first+' '+m.last+'</span></span><span class="ho ellip"><span class="s b">'+D.horse(e.horse).name+'</span><span class="s mut"> · '+e.class+'</span></span><span class="co hrow s mut" style="--g:6px">'+U.av(c,'sm')+c.first+'</span><span class="n s">'+F.eur(e.fee)+'</span><span class="stt">'+(kind==='done'?U.chip('Parti','',true):st.done[e.rider]?U.chip('Engagement saisi par le club','ok',true):e.rider===bad?U.chip('Certificat manquant','warn',true):U.chip('Prêt à saisir','acc',true))+'</span></div>'}).join('')+
    '<div class="cf hrow sp wrap"><span class="s mut">'+es.length+' engagements · <b class="num" style="color:var(--ink)">'+F.eur(tot)+'</b> à avancer par le club, refacturés aux cavaliers</span>'+(kind==='away'?'<button class="btn sm" data-a="add">'+I('plus','sm')+'Engager un cavalier</button>':'')+'</div></div>'}
   if(tab==='mat'){var M=matList(k),all=[].concat.apply([],M.map(function(g){return g[1]})),dn=all.filter(function(x){return x[1]}).length;
    s+='<div class="card pad hrow wrap sp" style="--g:14px;margin-bottom:14px"><div class="hrow" style="--g:14px">'+U.ring(dn/all.length*100,dn+'/'+all.length,dn===all.length?'var(--ok)':'var(--acc)',56)+'<div><b>'+(dn===all.length?'Tout est chargé':'Il reste '+(all.length-dn)+' choses à préparer')+'</b><div class="s mut">Chacun coche sa part depuis son téléphone, la liste se met à jour pour tous.</div></div></div><button class="btn" data-a="matsend">'+I('send','sm')+'Envoyer la liste aux cavaliers</button></div><div class="g2">'+
     M.map(function(g,gi){return '<div class="card"><div class="ch" style="padding-bottom:8px"><h3>'+g[0]+'</h3><span class="xs mut num">'+g[1].filter(function(x){return x[1]}).length+' / '+g[1].length+'</span></div>'+g[1].map(function(x,i){return '<label class="cp-chk fx-click" data-on="'+x[1]+'">'+U.chk(x[1],gi+'-'+i).replace('class="chk"','class="chk" data-manual data-a="chk"')+'<span class="grow s t">'+x[0]+'</span><span class="xs mut">'+x[2]+'</span></label>'}).join('')+'</div>'}).join('')+'</div>'}
   if(tab==='frais'){var R=fees(k),T=R.reduce(function(a,r){return a+r.tot},0),billed=BILL[k.id];
    s+='<div class="card pad hrow wrap sp" style="--g:14px;margin-bottom:14px"><div class="hrow" style="--g:14px">'+sq('invoice',billed?'ok':'acc')+'<div><div class="s mut">'+(billed?'Facturé aux cavaliers':'À répartir entre les '+R.length+' cavaliers')+'</div><div class="disp num" style="font-size:26px;font-weight:700">'+eur1(Math.round(T*10)/10)+'</div></div></div>'+
     (billed?'<span class="chip ok lg dot">'+R.length+' factures créées</span>':'<div class="hrow wrap" style="--g:10px"><span class="hrow s mut" style="--g:8px">Transport au km'+stepper('rate',String(cpRate).replace('.',','),'€')+'</span><button class="btn dark" data-a="bill">'+I('invoice','sm')+'Facturer les '+R.length+' cavaliers</button></div>')+'</div>'+
     '<div class="card"><div class="cp-e cp-fee cp-eh"><span>Cavalier</span><span class="n">Engagement</span><span class="n">Transport</span><span class="n">Coaching</span><span class="n tot">Total</span><span class="stt">Facture</span></div>'+
     R.map(function(r){var m=D.member(r.e.rider);return '<div class="cp-e cp-fee"><span class="hrow" style="--g:10px">'+U.av(m)+'<span style="min-width:0"><span class="b s ellip" style="display:block">'+m.first+' '+m.last+'</span><span class="xs mut ellip" style="display:block">'+D.horse(r.e.horse).name+(r.how&&!r.tr?' · '+r.how.toLowerCase():'')+'</span></span></span><span class="n s">'+F.eur(r.fee)+'</span><span class="n s">'+(r.tr?eur1(r.tr):'<span class="mut">0 €</span>')+'</span><span class="n s">'+F.eur(r.co)+'</span><span class="n tot s b">'+eur1(Math.round(r.tot*10)/10)+'</span><span class="stt">'+(billed?U.chip('Envoyée','ok',true):U.chip('À créer','',true))+'</span></div>'}).join('')+'</div>'+
     '<p class="xs mut" style="margin-top:12px">Le transport en véhicule du club est partagé entre les chevaux transportés, aller et retour. Les véhicules des familles ne sont pas refacturés. Le coaching est reversé au coach avec sa part habituelle.</p>'}
   if(tab==='res'){var cl=es.filter(function(e){return e.res&&e.res.clear}).length;
    s+=stats([stat('Partants',es.length,'sur '+es.length+' engagés'),stat('Sans-faute',cl,'un tiers des parcours'),stat('Classements',1,'Léa et Ulysse, 3e'),stat('Publié sur le portail',cpPub[k.id]?'Oui':'Non','vu par 64 adhérents')])+
     '<div class="card" style="margin-top:14px"><div class="ch" style="padding-bottom:8px"><h3>Résultats des cavaliers du club</h3><label class="hrow xs mut" style="--g:8px;cursor:pointer">'+U.tog(cpPub[k.id]).replace('class="tog"','class="tog" data-a="respub"')+'Publier sur le portail</label></div>'+
     es.slice().sort(function(a,b){return (a.res.rank||99)-(b.res.rank||99)}).map(function(e){var r=e.res,m=D.member(e.rider);return '<div class="cp-rk'+(r.classed?' top':'')+'"><span class="pos">'+(r.rank||'·')+'</span><div class="hrow" style="--g:10px;min-width:0">'+U.av(m)+'<div style="min-width:0"><div class="b s ellip">'+m.first+' '+m.last+' <span class="mut" style="font-weight:500">· '+D.horse(e.horse).name+'</span></div><div class="xs mut ellip">'+e.class+(r.rank?' · '+r.rank+'e sur '+r.of:'')+'</div></div></div>'+(r.elim?U.chip('Éliminée',''):r.clear?'<span class="chip acc"><span class="strass" style="width:8px;height:8px"></span>Sans-faute'+(r.classed?', classée':'')+'</span>':'<span class="chip">'+r.pts+' points</span>')+'<b class="s num hide-s" style="min-width:58px;text-align:right">'+(r.time||'')+'</b></div>'}).join('')+
     '<div class="cf hrow sp wrap"><span class="xs mut">'+(RESIMP[k.id]?'Résultats officiels importés de FFE Compet '+RESIMP[k.id].at+' et rangés dans '+RESIMP[k.id].n+' fiches.':'Résultats repris du classement provisoire. Importez le fichier officiel de FFE Compet pour les ranger dans les fiches.')+'</span><button class="btn sm'+(RESIMP[k.id]?'':' dark')+'" data-a="resimp">'+I('upload','sm')+(RESIMP[k.id]?'Réimporter le fichier':'Importer les résultats FFE')+'</button></div></div>'}
   if(tab==='epr'){var dn2=HS.todo.filter(function(x){return x[1]}).length;
    s+='<div class="g3"><div class="card span2"><div class="ch" style="padding-bottom:8px"><h3>Programme du dimanche</h3><span class="xs mut">22 engagés · carrière d’honneur</span></div>'+HS.classes.map(function(c){return '<div class="cp-post"><div class="hrow" style="--g:14px;min-width:0"><span class="b num" style="width:44px">'+c.t+'</span><div style="min-width:0"><div class="b s">'+c.name+'</div><div class="xs mut ellip">Juge : '+c.judge+' · '+c.n+' engagés</div></div></div><span class="avs hide-s" style="width:120px;display:block">'+U.bar(c.n/12*100)+'</span><button class="btn sm" data-a="start" data-id="'+c.id+'">Liste de départ</button></div>'}).join('')+
     '<div class="cf hrow sp wrap"><span class="xs mut">Engagements ouverts jusqu’au '+F.date(D.competitions[2].closes)+' sur FFE Compet. Piaffe importe la liste des engagés par fichier.</span><button class="btn sm" data-a="engimp">'+I('upload','sm')+'Importer les engagés</button></div></div>'+
     '<div class="card"><div class="ch" style="padding-bottom:8px"><h3>Avant le jour J</h3>'+U.ring(dn2/HS.todo.length*100,dn2+'/'+HS.todo.length,'var(--acc)',40)+'</div>'+HS.todo.map(function(x,i){return '<label class="cp-chk fx-click" data-on="'+x[1]+'">'+U.chk(x[1],'t-'+i).replace('class="chk"','class="chk" data-manual data-a="todo"')+'<span class="grow s t">'+x[0]+'</span></label>'}).join('')+'</div></div>'}
   if(tab==='ben'){var need=HS.posts.reduce(function(a,p){return a+p.need},0),have=HS.posts.reduce(function(a,p){return a+p.who.length},0);
    s+='<div class="card pad hrow wrap sp" style="--g:14px;margin-bottom:14px"><div class="hrow" style="--g:14px">'+U.ring(have/need*100,have+'/'+need,have>=need?'var(--ok)':'var(--acc)',56)+'<div><b>'+(have>=need?'Tous les postes sont pourvus':'Il manque '+(need-have)+' bénévoles')+'</b><div class="s mut">Les familles s’inscrivent depuis leur application, poste par poste.</div></div></div>'+(have>=need?'':'<button class="btn dark" data-a="benrel">'+I('send','sm')+'Relancer les familles</button>')+'</div>'+
     '<div class="card">'+HS.posts.map(function(p){var full=p.who.length>=p.need;return '<div class="cp-post"><div style="min-width:0"><div class="b s">'+p.name+'</div><div class="xs mut ellip">'+p.when+' · '+p.who.map(fst).join(', ')+'</div></div><span class="avs">'+U.avs(p.who,4)+'</span><span class="hrow" style="--g:8px">'+U.chip(p.who.length+' / '+p.need,full?'ok':'warn')+(full?'':'<button class="btn sm icon" data-a="benadd" data-id="'+p.id+'" title="Affecter un bénévole">'+I('plus','sm')+'</button>')+'</span></div>'}).join('')+'</div>'}
   if(tab==='buv'){var rev=HS.bar.reduce(function(a,b){return a+b.price*b.qty},0);
    s+=stats([stat('Recette prévue',F.eur(rev),'si tout est vendu',Math.round(rev),'eur'),stat('Visiteurs attendus','180','22 engagés et leurs familles'),stat('Marge estimée',F.eur(rev*.62),'62 % après achats'),stat('Bénévoles à la buvette','2 / 3','de 11 h à 15 h')])+
     '<div class="card" style="margin-top:14px"><div class="ch" style="padding-bottom:8px"><h3>Carte et quantités</h3><span class="xs mut">Calculées d’après le Hunter de l’an dernier</span></div>'+HS.bar.map(function(b,i){return '<div class="cp-post"><div style="min-width:0"><div class="b s">'+b.name+'</div><div class="xs mut num">'+F.eur(b.price,1)+' l’unité</div></div><span class="avs s mut num" data-sub="'+i+'">'+F.eur(b.price*b.qty)+'</span>'+stepper('bar'+i,b.qty,'')+'</div>'}).join('')+
     '<div class="cf hrow sp wrap"><span class="xs mut">Le jour J, la buvette encaisse en carte ou en espèces depuis la caisse Piaffe, sur téléphone.</span><div class="hrow" style="--g:8px"><button class="btn sm" data-a="buvlist">'+I('list','sm')+'Créer la liste de courses</button><button class="btn sm dark" data-a="buvcaisse">'+I('card','sm')+'Ouvrir la caisse</button></div></div></div>'}
   tb.innerHTML=s;P.animate(tb);
   tb.querySelectorAll('[data-step^="bar"]').forEach(function(x){x.setAttribute('data-inc',10)});
   var rt=tb.querySelector('[data-step="rate"]');if(rt)rt.setAttribute('data-inc',.1)}
  drawStrip();drawDetail();
  el.addEventListener('click',function(e){var b=e.target.closest('.fx-step button');if(!b||!det.contains(b))return;var w=b.parentNode,id=w.getAttribute('data-step'),sp=w.querySelector('[data-v]'),inc=+(w.getAttribute('data-inc'))||1,v=Math.max(0,Math.round((parseFloat(sp.textContent.replace(',','.'))+(+b.getAttribute('data-d'))*inc)*10)/10);
   if(id==='rate'){cpRate=Math.max(.5,v);drawTab(cur(),'frais',det.querySelector('[data-tb]'))}else{var i=+id.slice(3);HS.bar[i].qty=v;drawTab(cur(),'buv',det.querySelector('[data-tb]'))}});
  function cur(){return D.competitions.find(function(x){return x.id===cpSel})}
  function retab(t){drawTab(cur(),t,det.querySelector('[data-tb]'))}
  act(el,{imp:importSheet,'new':newComp,
   sel:function(b){cpSel=b.getAttribute('data-id');drawStrip();drawDetail();P.animate(det)},
   ffe:function(){ffeSheet(cur())},grp:function(){goOr('communication','Message envoyé au groupe « '+cur().name+' »')},
   aff:function(){P.toast('Affiche du Hunter Club créée avec le logo du club',{icon:'image'})},prog:function(){P.toast('Programme publié sur le portail et envoyé aux 148 adhérents',{icon:'send'})},recap:function(){P.toast('Résumé du concours partagé sur le portail et le groupe',{icon:'send'})},
   lic:function(b){b.outerHTML=U.chip('Demande envoyée','acc',true);P.toast('Demande de certificat envoyée à la famille Martinez')},
   add:function(){var sh=P.sheet({title:'Engager un cavalier',icon:'plus',body:'<div class="stack" style="--g:12px"><label class="field"><span>Cavalier</span><select class="in"><option>'+D.name('m019')+' · Galop '+D.member('m019').galop+'</option><option>'+D.name('m044')+' · Galop '+D.member('m044').galop+'</option></select></label><label class="field"><span>Cheval</span><select class="in"><option>Quiétude</option><option>Opale</option></select></label><label class="field"><span>Épreuve</span><select class="in"><option>Club 2 · 95 cm</option><option>Club 1 · 105 cm</option></select></label><div class="note">'+I('checkc','sm')+'<span>Licence compétition valide, cheval disponible ce jour-là, une place libre dans le camion.</span></div></div>',foot:'<button class="btn pri" data-ok>Ajouter l’engagement</button>'});sh.querySelector('[data-ok]').onclick=function(){sh.close();P.toast('Demande envoyée à Emma Moreau, à valider par ses parents')}},
   chk:function(b){var a=b.getAttribute('data-id').split('-'),it=matList(cur())[+a[0]][1][+a[1]];it[1]=!it[1];b.setAttribute('aria-checked',it[1]);setTimeout(function(){retab('mat')},220)},
   matsend:function(){P.toast('Liste du matériel envoyée aux '+ents(cur()).length+' cavaliers')},
   bill:function(){var k=cur(),n=ents(k).length;BILL[k.id]=true;retab('frais');P.toast(n+' factures créées et envoyées',{undo:function(){BILL[k.id]=false;retab('frais')}})},
   respub:function(){var k=cur();cpPub[k.id]=!cpPub[k.id];P.toast(cpPub[k.id]?'Résultats publiés sur le portail des adhérents':'Résultats retirés du portail');setTimeout(function(){retab('res')},250)},
   resimp:function(){ffeResSheet(cur())},
   start:function(b){startList(HS.classes.find(function(c){return c.id===b.getAttribute('data-id')}))},
   engimp:function(){P.toast('22 engagés importés du fichier FFE Compet',{icon:'upload'})},
   todo:function(b){var it=HS.todo[+b.getAttribute('data-id').split('-')[1]];it[1]=!it[1];b.setAttribute('aria-checked',it[1]);setTimeout(function(){retab('epr')},220)},
   benrel:function(b){b.outerHTML=U.chip('Relance envoyée','acc',true);P.toast('Relance envoyée aux 31 familles sans poste')},
   benadd:function(b){var p=HS.posts.find(function(x){return x.id===b.getAttribute('data-id')}),pool=['m052','m083','m091','m102','m117','m001'],m=pool.find(function(i){return !HS.posts.some(function(q){return q.who.indexOf(i)>=0})});if(m){p.who.push(m);retab('ben');P.toast(nm(m)+' est inscrit au poste « '+p.name+' »')}},
   buvlist:function(){P.toast('Liste de courses créée : 9 lignes, environ 310 €',{icon:'list'})},buvcaisse:function(){goOr('boutique','Caisse de la buvette ouverte sur ce téléphone')}});
 }});

/* =====================================================================
   VUE COACH · données de Pauline Arnaud (c01)
   ===================================================================== */
D.coachStables=D.coachStables||[
 {id:'e1',name:'Écurie des Tilleuls',short:'Les Tilleuls',city:'Saint-Arnoult-en-Yvelines',km:6,min:9,deal:'Commission de 15 %',c:'var(--c1)',on:true},
 {id:'e2',name:'Haras de la Vallée',short:'La Vallée',city:'Bullion',km:12,min:16,deal:'Droit de piste 8 € par cours',c:'var(--c3)',on:true},
 {id:'e3',name:'Écurie du Bois Clair',short:'Bois Clair',city:'Rochefort-en-Yvelines',km:9,min:14,deal:'Forfait 120 € par mois',c:'var(--c5)',on:true},
 {id:'e4',name:'Poney-club de Sonchamp',short:'Sonchamp',city:'Sonchamp',km:15,min:19,deal:'Demande envoyée le 12 novembre',c:'var(--c4)',on:false}];
D.coachStudents=D.coachStudents||[
 {id:'s1',m:'m001',horse:'Ulysse de la Roche',stable:'e1',level:'Club Élite',goal:'Passer en Amateur 3 au printemps',pct:72,h:[100,105,105,110,110,110,115,115],n:14,next:'Aujourd’hui à 11 h 15',seen:'vendredi'},
 {id:'s2',m:'m066',horse:'Filou',stable:'e1',level:'Amateur 3',goal:'Régularité sur 105 cm',pct:58,h:[90,90,95,95,100,100,100,105],n:9,next:'Aujourd’hui à 12 h 15',seen:'vendredi'},
 {id:'s3',m:'m078',horse:'Gribouille',stable:'e1',level:'Amateur 3',goal:'Reprendre confiance sur les oxers',pct:41,h:[95,90,90,90,95,95,100,100],n:11,next:'Aujourd’hui à 12 h 15',seen:'vendredi'},
 {id:'s4',m:'m047',horse:'Domino',stable:'e1',level:'Club 1',goal:'Premier Amateur 3 en février',pct:66,h:[85,90,90,95,95,100,100,100],n:7,next:'Aujourd’hui à 12 h 15',seen:'il y a 8 jours'},
 {id:'s5',first:'Camille',last:'Roche',color:'var(--c3)',horse:'Kenzo du Vallon',stable:'e2',level:'Amateur 1',goal:'Grand Prix 125 à Fontainebleau',pct:83,h:[115,115,120,120,120,125,125,125],n:22,next:'Demain à 14 h',seen:'ce matin',todo:true},
 {id:'s6',first:'Victor',last:'Hamel',color:'var(--c5)',horse:'Baltic',stable:'e3',level:'Club Élite',goal:'Sans-faute en Club Élite',pct:49,h:[100,100,105,105,105,110,110,110],n:6,next:'Aujourd’hui à 15 h 30',seen:'jeudi'},
 {id:'s7',first:'Margaux',last:'Petitjean',color:'var(--c6)',horse:'Opium des Prés',stable:'e3',level:'Poney 1',goal:'Championnat départemental',pct:77,h:[80,85,85,90,90,90,95,95],n:16,next:'Aujourd’hui à 17 h',seen:'jeudi'},
 {id:'s8',first:'Clémence',last:'Aubry',color:'var(--c7)',horse:'Havane',stable:'e2',level:'Amateur 2',goal:'Jeune cheval de 6 ans, cycle classique',pct:35,h:[95,100,100,100,105,105,105,110],n:4,next:'Vendredi à 10 h',seen:'il y a 6 jours'}];
D.coachLessons=D.coachLessons||[
 {id:'a01',d:-1,t:'09:00',dur:60,stable:'e3',who:['s6'],type:'Particulier',price:55,done:true},{id:'a02',d:-1,t:'10:15',dur:60,stable:'e3',who:['s7'],type:'Particulier',price:55,done:true},{id:'a03',d:-1,t:'17:30',dur:60,stable:'e2',who:['s8'],type:'Particulier',price:55,done:true},
 {id:'a04',d:0,t:'08:30',dur:60,stable:'e2',who:['s5'],type:'Particulier',place:'Carrière du haut',price:55,done:true,todo:true},
 {id:'a05',d:0,t:'11:15',dur:60,stable:'e1',who:['s1'],type:'Particulier',place:'Carrière d’honneur',price:55},
 {id:'a06',d:0,t:'12:15',dur:60,stable:'e1',who:['s2','s3','s4'],type:'Collectif',title:'Propriétaires, enchaînements',place:'Carrière d’honneur',price:75},
 {id:'a07',d:0,t:'14:00',dur:60,stable:'e1',who:[],type:'Libre',place:'Carrière d’honneur',price:0},
 {id:'a08',d:0,t:'15:30',dur:60,stable:'e3',who:['s6'],type:'Particulier',place:'Manège',price:55},
 {id:'a09',d:0,t:'17:00',dur:75,stable:'e3',who:['s7','s6'],extra:2,type:'Collectif',title:'Équipe concours jeunes',place:'Grande carrière',price:100},
 {id:'a10',d:1,t:'10:00',dur:60,stable:'e1',who:['s1'],type:'Particulier',price:55,pend:true,alt:'Inès Blanc · Zéphyr'},{id:'a11',d:1,t:'14:00',dur:60,stable:'e2',who:['s5'],type:'Particulier',price:55},{id:'a12',d:1,t:'15:15',dur:60,stable:'e2',who:['s8'],type:'Particulier',price:55},
 {id:'a13',d:2,t:'09:30',dur:60,stable:'e3',who:['s6'],type:'Particulier',price:55},{id:'a14',d:2,t:'10:45',dur:60,stable:'e3',who:['s7'],type:'Particulier',price:55},{id:'a15',d:2,t:'17:00',dur:75,stable:'e3',who:['s7','s6'],extra:2,type:'Collectif',title:'Équipe concours jeunes',price:100},
 {id:'a16',d:3,t:'10:00',dur:60,stable:'e2',who:['s8'],type:'Particulier',price:55},{id:'a17',d:3,t:'16:30',dur:60,stable:'e1',who:['s2'],type:'Particulier',price:55},
 {id:'a18',d:4,t:'09:00',dur:90,stable:'e1',who:['s1','s2','s4'],type:'Collectif',title:'Répétition avant Rambouillet',price:120},{id:'a19',d:4,t:'11:00',dur:60,stable:'e1',who:['s3'],type:'Particulier',price:55},
 {id:'a20',d:5,t:'08:15',dur:480,stable:'e1',who:['s1'],type:'Concours',title:'CSO de Rambouillet',price:150}];
D.coachLapsed=D.coachLapsed||[{first:'Chloé',last:'Vasseur',horse:'Tango',stable:'e2',seen:'il y a 5 semaines',why:'carte de 10 cours terminée'},{first:'Mathis',last:'Leroy',horse:'Quinoa',stable:'e1',seen:'il y a 4 semaines',why:'aucune réservation depuis la Toussaint'},{first:'Camille',last:'Roche',horse:'Kenzo du Vallon',stable:'e2',seen:'ce matin',why:'une seule séance restante sur sa carte'}];
var ST=D.coachStables,STU=D.coachStudents,LES=D.coachLessons;
/* journée de Pauline aux Tilleuls : une seule version, celle de D.facts.paulineToday (11 h 15, 12 h 15, 14 h libre) */
(function(){var f=D.facts&&D.facts.paulineToday;if(!f)return;['a05','a06','a07'].forEach(function(id,i){var l=LES.find(function(x){return x.id===id}),x=f[i];if(l&&x){l.t=x.at;if(x.arena)l.place=arena(x.arena)}});
 ['b01','b02'].forEach(function(id,i){var b=BOOK.find(function(x){return x.id===id}),x=f[i];if(b&&x){b.t=x.at;if(x.arena)b.arena=x.arena}})})();
function stb(i){return ST.find(function(s){return s.id===i})}
function stu(i){var s=STU.find(function(x){return x.id===i});if(s&&s.m&&!s.first){var m=D.member(s.m);s.first=m.first;s.last=m.last;s.color=m.color}return s}
STU.forEach(function(s){stu(s.id)});
function lTitle(l){return l.alt||l.title||(l.who.length?l.who.map(function(w){var s=stu(w);return s.first+' '+s.last+' · '+s.horse}).join(', '):'Créneau libre')}
function lSub(l){var s=stb(l.stable);return (l.type==='Libre'?'Réservable en ligne':l.type==='Collectif'?'Collectif, '+(l.who.length+(l.extra||0))+' cavaliers':l.type==='Concours'?'Coaching de concours':'Cours particulier')+' · '+s.short+(l.place?', '+l.place.toLowerCase():'')}
function lAvs(l){return '<span class="avs">'+l.who.slice(0,3).map(function(w){return U.av(stu(w),'sm')}).join('')+(l.extra?'<span class="av sm" style="--c:var(--bg-2);color:var(--ink-2)">+'+l.extra+'</span>':'')+'</span>'}
function dayL(off){return LES.filter(function(l){return l.d===off}).sort(function(a,b){return hm(a.t)-hm(b.t)})}

P.css(`
.ca{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:14px;align-items:start}
.ca-side{display:flex;flex-direction:column;gap:14px}
@container main (min-width:521px) and (max-width:1080px){svg.ce-ch text{font-size:16px}}
@container main (max-width:520px){svg.cr-ch text{font-size:19px}.cp-nw{flex-wrap:wrap}.cp-nw>.grow{flex:1 1 calc(100% - 40px)}.cp-nw>.btn{margin-left:26px}}
.ca-next{padding:20px;display:flex;flex-direction:column;gap:14px;overflow:hidden}
.ca-next h2{font-size:22px;line-height:1.15;color:var(--navy-ink)}
.ca-next .glow{position:absolute;right:-70px;top:-70px;width:220px;height:220px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--acc) 55%,transparent),transparent 65%);pointer-events:none}
.ca-go{height:56px;border-radius:var(--r-md);background:var(--acc);color:var(--acc-ink);font-weight:700;font-size:16px;display:flex;align-items:center;justify-content:center;gap:10px;box-shadow:0 8px 20px -8px color-mix(in srgb,var(--acc) 80%,transparent);transition:transform var(--t-1) var(--e-out),background var(--t-2)}
.ca-go:hover{background:var(--acc-2)}.ca-go:active{transform:scale(.98)}
.ca-go svg.i{width:20px;height:20px}
.ca-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px}
.ca-days button{height:64px;border-radius:var(--r-md);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:1px;font-size:11px;font-weight:600;color:var(--mut);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);transition:background var(--t-2),color var(--t-2);min-width:0}
.ca-days button b{font:700 17px var(--f-display);color:var(--ink)}
.ca-days button i{display:flex;gap:2px;height:5px;margin-top:2px}
.ca-days button i u{width:5px;height:5px;border-radius:50%;background:var(--c)}
.ca-days button[aria-selected="true"]{background:var(--navy);color:color-mix(in srgb,var(--navy-ink) 70%,transparent);box-shadow:none}
.ca-days button[aria-selected="true"] b{color:var(--navy-ink)}
.ca-it{display:grid;grid-template-columns:50px 4px minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 16px;min-height:66px;cursor:pointer;transition:background var(--t-1);text-align:left;width:100%}
.ca-it:hover{background:var(--surface-2)}
.ca-it .tm{font:600 13.500px var(--f-text);font-variant-numeric:tabular-nums}
.ca-it .tm small{display:block;color:var(--mut);font-weight:500;font-size:11.500px}
.ca-it .st{width:4px;align-self:stretch;border-radius:2px;background:var(--c)}
.ca-it.done .tm,.ca-it.done .tt{color:var(--mut)}
.ca-it.next{background:var(--acc-pale)}
.ca-it.free .st{background:repeating-linear-gradient(to bottom,var(--c) 0 4px,transparent 4px 8px)}
.ca-tr{display:flex;align-items:center;gap:10px;padding:7px 16px 7px 78px;font-size:12px;color:var(--mut);background:var(--surface-2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.ca-tr svg.i{width:15px;height:15px}
.ca-wk{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
.ca-wc{display:flex;flex-direction:column;gap:6px;min-width:0}
.ca-wh{padding:8px 10px;border-radius:var(--r-md);font-size:12px;font-weight:600;color:var(--mut);display:flex;justify-content:space-between;gap:6px}
.ca-wh.today{background:var(--navy);color:var(--navy-ink)}
.ca-wb{padding:8px 10px;border-radius:var(--r-md);background:color-mix(in srgb,var(--c) 12%,var(--surface));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 32%,transparent);text-align:left;font-size:12px;line-height:1.35;min-width:0;transition:transform var(--t-2) var(--e-out)}
.ca-wb:hover{transform:translateY(-1px)}
.ca-wb b{display:block;font-variant-numeric:tabular-nums}
.ca-wb span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--ink-2)}
.ca-wb small{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:var(--mut);font-size:11px}
.ca-wb.done{opacity:.6}
.ca-rq{padding:12px 16px;display:flex;flex-direction:column;gap:10px}
.ca-rq+.ca-rq{border-top:1px solid var(--line)}
/* cours en cours */
.ca-live{display:flex;flex-direction:column;gap:16px}
.ca-clock{font:700 72px/1 var(--f-display);letter-spacing:-.04em;font-variant-numeric:tabular-nums;text-align:center}
.ca-clock small{font-size:15px;font-weight:600;letter-spacing:0;color:var(--mut);display:block;margin-top:8px;font-family:var(--f-text)}
.ca-mic{width:64px;height:64px;border-radius:50%;background:var(--navy);color:var(--navy-ink);display:grid;place-items:center;flex:none;transition:transform var(--t-2) var(--e-spring),background var(--t-2)}
.ca-mic svg.i{width:26px;height:26px}
.ca-mic.rec{background:var(--bad);color:#fff;transform:scale(1.06)}
.ca-wave{display:flex;align-items:center;gap:3px;height:40px;flex:1;min-width:0;overflow:hidden}
.ca-wave i{flex:1;max-width:5px;border-radius:3px;background:var(--line-2);height:20%}
.ca-wave.rec i{background:var(--bad);animation:cawave .9s var(--e-in-out) infinite;animation-delay:calc(var(--k)*-67ms)}
@keyframes cawave{0%,100%{height:18%}50%{height:calc(30% + var(--h)*1%)}}
.ca-tags{display:flex;flex-wrap:wrap;gap:6px}
.ca-tags .tag{height:36px;padding:0 12px}
@container main (max-width:1080px){.ca{grid-template-columns:minmax(0,1fr) 300px}}
@container main (max-width:860px){
 .ca{grid-template-columns:minmax(0,1fr)}
 .ca-side{display:contents}.ca-next{order:-1}
 .ca-wk{grid-template-columns:minmax(0,1fr)}
 .ca-wh{background:none!important;color:var(--mut)!important;padding:8px 2px 0}
}
@container main (max-width:520px){.ca-days button{height:60px}.ca-tr{padding-left:16px}}
`);

var caView='jour',caDay=0,caReq=[{id:'q1',who:'Inès Blanc · Zéphyr',avo:{first:'Inès',last:'Blanc',color:'var(--c3)'},what:'Cours particulier CSO',when:'Demain à 10 h',where:'Écurie des Tilleuls',note:'Le club doit aussi valider la piste.',price:55},{id:'q2',who:'Hugo Marchand · Nabab',avo:{first:'Hugo',last:'Marchand',color:'var(--c4)'},what:'Premier cours, Club 2',when:'Jeudi à 17 h 30',where:'Haras de la Vallée',note:'Nouveau cavalier, trouvé sur votre page publique.',price:55}];

/* ---------- Hors ligne, raccourcis et personnalisation de l'agenda ---------- */
P.css(`
.ca-off{display:flex;align-items:center;gap:10px;width:100%;text-align:left;padding:10px 12px;border-radius:var(--r-md);background:var(--warn-pale);color:var(--ink);font-size:13px;margin-bottom:14px;box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--warn) 30%,transparent)}
.ca-off svg.i{color:var(--warn);flex:none}
.ca-off-b{font-weight:700;color:var(--warn);white-space:nowrap}
.ca-offok{display:flex;align-items:center;justify-content:center;gap:6px;margin-top:-4px;color:color-mix(in srgb,var(--navy-ink) 66%,transparent)}
.ca-offok svg.i{width:14px;height:14px}
.ca-net{display:flex;align-items:center;gap:8px;align-self:center;height:32px;padding:0 12px;border-radius:16px;font-size:12px;font-weight:600;background:var(--ok-pale);color:var(--ok);transition:background var(--t-2),color var(--t-2)}
.ca-net small{font-weight:500;color:var(--mut)}
.ca-net.off{background:var(--warn-pale);color:var(--warn)}
.ca-net svg.i{width:15px;height:15px}
.ca-qk{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:0 12px 12px}
.ca-q{display:flex;align-items:center;gap:10px;padding:10px;border-radius:var(--r-md);background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);text-align:left;min-width:0;min-height:58px;transition:background var(--t-2),transform var(--t-1)}
.ca-q:hover{background:var(--acc-pale)}.ca-q:active{transform:scale(.98)}
.ca-q b{display:block;font-size:13px;font-weight:650;line-height:1.25}
.ca-q small{display:block;font-size:11.500px;color:var(--mut)}
.ca-q .av.sq{flex:none}
.ca-hz{display:flex;align-items:center;gap:10px;padding:8px 16px 8px 78px;font-size:12px;color:var(--ink-2);background:var(--warn-pale);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.ca-hz svg.i{width:15px;height:15px;color:var(--warn);flex:none}
.ca-ps{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}
.ca-ps button{display:flex;align-items:center;gap:10px;padding:10px;border-radius:var(--r-md);text-align:left;min-width:0;font-size:13px;font-weight:600;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2);transition:background var(--t-2),box-shadow var(--t-2)}
.ca-ps button span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.ca-ps button svg.i{flex:none;color:var(--mut)}
.ca-ps button[aria-pressed="true"]{background:var(--acc-pale);box-shadow:inset 0 0 0 1.500px var(--acc)}
.ca-ps button[aria-pressed="true"] svg.i{color:var(--acc)}
.ca-bl{display:grid;grid-template-columns:auto minmax(0,1fr) auto auto;gap:10px;align-items:center;padding:10px 12px;border-radius:var(--r-md);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line)}
.ca-bl.off{opacity:.55}
.ca-bl .mv{display:flex;gap:2px}
.ca-big .s{font-size:15px}.ca-big .xs{font-size:13px}.ca-big .ca-it .tm{font-size:15.500px}.ca-big .ca-it .b{font-size:16px}.ca-big .ca-q b{font-size:14.500px}.ca-big .ca-q small{font-size:12.500px}.ca-big h3{font-size:18px}
@container main (max-width:860px){.ca-top{order:-1}}
@container main (max-width:520px){.ca-hz{padding-left:16px}}
`);
var CO={offline:false,queue:[]};
function offBar(){var n=CO.queue.length;return CO.offline?'<button class="ca-off" data-a="online">'+I('wifi')+'<span class="grow">Hors ligne. '+(n?'<b class="num">'+n+'</b> envoi'+(n>1?'s':'')+' gardé'+(n>1?'s':'')+' sur le téléphone, partira dès le retour du réseau.':'Votre agenda, le chrono et les notes restent disponibles. Tout part dès le retour du réseau.')+'</span><span class="ca-off-b">Reconnecter</span></button>':''}
function reconnect(){var q=CO.queue.slice();CO.offline=false;CO.queue=[];P.rerender();P.toast(q.length?'Réseau retrouvé : '+q.join(', '):'Réseau retrouvé, tout est à jour',{icon:'wifi'})}
var CA_BL=[['next','Prochain cours','Le grand bouton Démarrer le cours','play'],['quick','Raccourcis','Quatre actions à portée de pouce','grid'],['req','Demandes de réservation','Accepter ou proposer un autre horaire','calendar_add'],['today','Résumé du jour','Heures de cours, revenus et route','today']];
function nextL(){return dayL(0).find(function(x){return !x.done&&x.who.length})}
var CA_Q=[
 ['start','play','Démarrer le cours',function(){var l=nextL();return l?'Prochain à '+th(hm(l.t)):'Journée terminée'},function(){var l=nextL();if(l)liveSheet(l);else P.toast('Tous vos cours du jour sont faits',{icon:'checkc'})}],
 ['add','plus','Ajouter un cours',function(){return 'L’élève est prévenu'},function(){var b=document.querySelector('.view .ph [data-a="add"]');if(b)b.click()}],
 ['block','holiday','Bloquer une période',function(){return 'Congés, maréchal'},function(){cdTab='sem';P.go('coach-dispo')}],
 ['inv','invoice','Créer une facture',function(){return 'Numérotation continue'},function(){P.go('coach-revenus');setTimeout(function(){invoiceSheet(null)},350)}],
 ['stu','members','Mes élèves',function(){return STU.length+' cavaliers suivis'},function(){P.go('coach-eleves')}],
 ['ex','jump','Dessiner un parcours',function(){return 'Glisser les obstacles'},function(){ceTab='ex';P.go('coach-eleves')}],
 ['comp','compet','Journée de concours',function(){return 'Rambouillet dimanche'},function(){ccSel='x1';P.go('coach-concours')}],
 ['page','globe','Ma page publique',function(){return 'Voir et partager'},function(){cdTab='page';P.go('coach-dispo')}],
 ['sync','refresh','Synchroniser',function(){return 'Google Agenda, Apple'},function(){P.toast(CO.offline?'Synchronisation en attente du réseau':'Vos cours sont à jour dans Google Agenda et Apple Calendrier',{icon:CO.offline?'wifi':'checkc'})}],
 ['rev','wallet','Mes revenus',function(){return F.eur(3480)+' en novembre'},function(){P.go('coach-revenus')}],
 ['off','wifi','Tester sans réseau',function(){return CO.offline?'Hors ligne en ce moment':'Comme au fond du manège'},function(){if(CO.offline)reconnect();else{CO.offline=true;P.rerender();P.toast('Hors ligne : vos actions sont gardées sur le téléphone',{icon:'wifi'})}}]];
function caCfg(){var c=P.prefs.get('coach:home',null)||{},bl=(c.blocks||[]).filter(function(b){return CA_BL.some(function(x){return x[0]===b.id})});
 CA_BL.forEach(function(x){if(!bl.some(function(b){return b.id===x[0]}))bl.push({id:x[0],on:true})});
 var q=(c.quick||['start','add','block','inv']).filter(function(id){return CA_Q.some(function(x){return x[0]===id})}).slice(0,4);return {blocks:bl,quick:q,big:!!c.big}}
function persoSheet(){var c=caCfg();
 function theme(){return document.documentElement.getAttribute('data-theme')||'auto'}
 var sh=P.sheet({title:'Personnaliser mon agenda',icon:'sliders',body:function(b,sheet){
  function draw(){
   b.innerHTML='<p class="s mut" style="margin-bottom:14px">Réglez votre page d’accueil comme vous l’aimez. Les changements s’appliquent tout de suite, sur votre téléphone et votre ordinateur.</p>'+
    sec('Mes 4 raccourcis','<span class="xs mut num">'+c.quick.length+' sur 4</span>')+'<div class="ca-ps">'+CA_Q.map(function(q){return '<button data-a="pq" data-id="'+q[0]+'" aria-pressed="'+(c.quick.indexOf(q[0])>=0)+'">'+I(q[1],'sm')+'<span>'+q[2]+'</span></button>'}).join('')+'</div>'+
    sec('Blocs affichés et leur ordre')+'<div class="stack" style="--g:8px">'+c.blocks.map(function(x,i){var d=CA_BL.find(function(y){return y[0]===x.id});return '<div class="ca-bl'+(x.on?'':' off')+'">'+sq(d[3])+'<div style="min-width:0"><div class="b s ellip">'+d[1]+'</div><div class="xs mut ellip">'+d[2]+'</div></div><span class="mv"><button class="btn ghost icon sm" data-a="up" data-i="'+i+'" title="Monter"'+(i===0?' disabled':'')+'>'+I('up','sm')+'</button><button class="btn ghost icon sm" data-a="dn" data-i="'+i+'" title="Descendre"'+(i===c.blocks.length-1?' disabled':'')+'>'+I('down','sm')+'</button></span>'+tg(x.on,'bon',String(i))+'</div>'}).join('')+'</div>'+
    sec('Apparence')+U.seg([['auto','Automatique'],['light','Clair'],['dark','Sombre']],theme(),'data-th')+
    '<div class="card flat" style="padding:4px 14px;margin-top:14px">'+row('Texte plus grand',tg(c.big,'big'))+'</div>';
   b.querySelectorAll('[data-th]').forEach(function(x){x.addEventListener('click',function(){var v=x.getAttribute('data-th'),r=document.documentElement;if(v==='auto')r.removeAttribute('data-theme');else r.setAttribute('data-theme',v);P.store.set('theme',v==='auto'?null:v);draw();P.toast(v==='auto'?'Thème automatique, comme votre téléphone':v==='dark'?'Thème sombre appliqué':'Thème clair appliqué',{icon:v==='dark'?'moon':'sun',ms:1600})})})}
  function save(){P.prefs.set('coach:home',c);P.rerender()}
  draw();
  act(sheet,{pq:function(x){var id=x.getAttribute('data-id'),i=c.quick.indexOf(id);if(i>=0){c.quick.splice(i,1)}else{if(c.quick.length>=4){P.toast('Quatre raccourcis au plus : retirez-en un d’abord',{icon:'info',ms:2000});return}c.quick.push(id)}draw();save()},
   up:function(x){var i=+x.getAttribute('data-i');c.blocks.splice(i-1,0,c.blocks.splice(i,1)[0]);draw();save()},
   dn:function(x){var i=+x.getAttribute('data-i');c.blocks.splice(i+1,0,c.blocks.splice(i,1)[0]);draw();save()},
   bon:function(x){var i=+x.getAttribute('data-id');c.blocks[i].on=!c.blocks[i].on;setTimeout(function(){draw();save()},160)},
   big:function(){c.big=!c.big;setTimeout(function(){draw();save()},160)},
   reset:function(){c={blocks:CA_BL.map(function(x){return {id:x[0],on:true}}),quick:['start','add','block','inv'],big:false};draw();save();P.toast('Disposition par défaut rétablie',{icon:'refresh'})},
   done:function(){sheet.close();P.toast('Agenda personnalisé')}});
 },foot:'<button class="btn ghost" data-a="reset">'+I('refresh','sm')+'Rétablir</button><button class="btn pri" data-a="done">Terminé</button>'})}

function netTxt(){return CO.offline?I('wifi','sm')+'Hors ligne <small>· tout est gardé sur le téléphone</small>':I('wifi','sm')+'En ligne <small>· tester sans réseau</small>'}
function liveSheet(l){var s0=l.who.length?stu(l.who[0]):null,t0=Date.now(),tm,rec=false,noteDone=false;
 var last={s1:'Vendredi : sans-faute à Chantilly. À revoir : le dernier abord, Léa laisse filer.',s2:'Vendredi : bonne cadence, mains encore hautes à la réception.',s6:'Jeudi : Baltic regarde les barres au sol, prévoir du spa.'}[s0?s0.id:'']||'Dernière séance : travail des transitions et lignes courbes.';
 var sh=P.sheet({title:l.type==='Collectif'?l.title:s0.first+' et '+s0.horse,icon:'stopwatch',body:function(b,sheet){
  b.innerHTML='<div class="ca-live"><button class="ca-net'+(CO.offline?' off':'')+'" data-a="net">'+netTxt()+'</button><div class="ca-clock num"><span data-ck>00:00</span><small>'+lSub(l)+' · prévu '+l.dur+' min</small></div>'+
   '<div class="note">'+I('bulb','sm')+'<span>'+last+'</span></div>'+
   '<div><div class="eyebrow" style="margin-bottom:8px">Travaillé aujourd’hui</div><div class="ca-tags">'+['Détente sur le plat','Cavalettis','Ligne en cinq foulées','Oxer 110','Tracé du barrage','Transitions'].map(function(x,i){return '<button class="tag" aria-pressed="'+(i<2)+'">'+x+'</button>'}).join('')+'</div></div>'+
   '<div class="card flat pad stack" style="--g:12px"><div class="hrow" style="--g:14px"><button class="ca-mic" data-a="mic" title="Dicter une note">'+I('mic')+'</button><div class="grow"><div class="b s" data-mt>Dicter une note vocale</div><div class="ca-wave" data-wave>'+Array.apply(null,Array(28)).map(function(_,i){return '<i style="--k:'+i+';--h:'+(20+(i*37)%60)+'"></i>'}).join('')+'</div></div></div>'+
   '<textarea class="in" rows="3" data-note placeholder="La note de séance s’écrit ici. Vous pourrez la partager avec votre élève."></textarea></div></div>';
  function ckText(){var s=Math.floor((Date.now()-t0)/1000);return (s<600?'0':'')+Math.floor(s/60)+':'+(s%60<10?'0':'')+s%60}
  tm=setInterval(function(){var c=b.querySelector('[data-ck]');if(!b.isConnected||!c){clearInterval(tm);return}c.textContent=ckText()},500);
  var TXT='Très bonne séance. Ligne en cinq foulées régulière aux deux mains. Sur l’oxer à 110, garder les épaules derrière jusqu’au pied de l’obstacle. À refaire seule : transitions galop, trot, galop sur le cercle.';
  act(sheet,{mic:function(x){var w=b.querySelector('[data-wave]'),mt=b.querySelector('[data-mt]'),ta=b.querySelector('[data-note]');
    if(!rec){rec=true;x.classList.add('rec');x.innerHTML=I('pause');w.classList.add('rec');mt.textContent=CO.offline?'Dictée sur le téléphone, sans réseau':'Écoute en cours, parlez normalement';
     var i=0;(function type(){if(!rec||!b.isConnected)return;i+=3;ta.value=TXT.slice(0,i);if(i<TXT.length)setTimeout(type,P.RM?1:28);else stop()})();}
    else stop();
    function stop(){rec=false;noteDone=true;x.classList.remove('rec');x.innerHTML=I('mic');w.classList.remove('rec');mt.textContent='Note transcrite, relisez avant de partager'}},
   end:function(){clearInterval(tm);var d=ckText(),ta=b.querySelector('[data-note]').value;l.done=true;l.todo=false;
    b.innerHTML='<div class="stack" style="--g:16px;align-items:center;text-align:center;padding:10px 0"><span class="strass" style="width:22px;height:22px"></span><h3 style="font-size:22px">Cours terminé</h3><p class="s mut">'+(l.type==='Collectif'?l.title:s0.first+' et '+s0.horse)+' · chrono '+d+' · '+F.eur(l.price)+' ajoutés à vos revenus</p></div>'+
     '<div class="card flat pad s" style="color:var(--ink-2)">'+(ta?E(ta):'Aucune note pour cette séance. Vous pouvez en ajouter une depuis la fiche de l’élève.')+'</div>';
    sheet.querySelector('.sf').innerHTML='<button class="btn" data-a="close">Garder pour moi</button><button class="btn pri" data-a="share">'+I('send','sm')+'Partager la note avec '+(l.type==='Collectif'?'le groupe':s0.first)+'</button>';P.animate(b)},
   net:function(x){if(CO.offline&&CO.queue.length){reconnect()}else{CO.offline=!CO.offline;P.rerender()}x.classList.toggle('off',CO.offline);x.innerHTML=netTxt();if(CO.offline)P.toast('Hors ligne : le chrono continue, la note est gardée sur le téléphone',{icon:'wifi'});else if(!CO.queue.length)P.toast('Réseau retrouvé',{icon:'wifi',ms:1500})},
   close:function(){sheet.close();if(CO.offline)CO.queue.push('cours de '+(l.type==='Collectif'?l.title.toLowerCase():s0.first)+' synchronisé');P.rerender();P.toast(CO.offline?'Cours enregistré sur le téléphone, synchronisé au retour du réseau':'Cours enregistré dans votre agenda',{icon:CO.offline?'wifi':'checkc'})},
   share:function(){var who=l.type==='Collectif'?'vos '+(l.who.length+(l.extra||0))+' cavaliers':s0.first;sheet.close();if(CO.offline){CO.queue.push('note de séance envoyée à '+who);P.rerender();P.toast('Note gardée sur le téléphone, envoyée à '+who+' dès le retour du réseau',{icon:'wifi'});return}P.rerender();P.toast('Note de séance envoyée à '+who,{icon:'send'})}});
 },foot:'<button class="btn pri lg block" data-a="end">'+I('check')+'Terminer le cours</button>',onClose:function(){clearInterval(tm)}});
 return sh}

function lessonSheet(l){var s=stb(l.stable),free=l.type==='Libre';
 P.sheet({title:free?'Créneau libre':l.type==='Collectif'?l.title:l.type==='Concours'?l.title:(l.alt||stu(l.who[0]).first+' et '+stu(l.who[0]).horse),icon:'planning',body:function(b,sh){
  b.innerHTML='<div class="card flat" style="padding:4px 14px">'+row('Quand',F.dateL(day(l.d))+' à '+th(hm(l.t)))+row('Durée',dur(l.dur))+row('Où',s.name+(l.place?', '+l.place.toLowerCase():''))+row('Type',free?'Ouvert à la réservation en ligne':l.type)+(free?'':row('Tarif','<span class="num">'+F.eur(l.price)+'</span>'))+(free?'':row('Conditions de l’écurie',s.deal))+'</div>'+
   (l.who.length&&!l.alt?sec(l.who.length>1?'Cavaliers':'Élève')+'<div class="card flat list">'+l.who.map(function(w){var x=stu(w);return '<div class="li click" data-a="stu" data-id="'+x.id+'">'+U.av(x)+'<div class="grow"><div class="t">'+x.first+' '+x.last+'</div><div class="s">'+x.horse+' · '+x.level+'</div></div>'+I('right','sm')+'</div>'}).join('')+'</div>':'')+
   (free?'<div class="note" style="margin-top:14px">'+I('globe','sm')+'<span>Ce créneau apparaît sur votre page publique et dans l’application des adhérents des Tilleuls. Il se ferme tout seul 2 heures avant.</span></div>':'')+
   (l.todo?'<div class="note warn" style="margin-top:14px">'+I('edit','sm')+'<span>La note de séance n’est pas encore écrite. Camille l’attend dans son application.</span></div>':'');
  act(sh,{stu:function(x){sh.close();P.go('coach-eleves',{id:x.getAttribute('data-id')})},
   start:function(){sh.close();setTimeout(function(){liveSheet(l)},300)},
   move:function(){sh.close();P.toast('Trois autres créneaux proposés à '+(l.who.length?stu(l.who[0]).first:'votre élève')+', réponse attendue',{icon:'swap'})},
   block:function(){l.type='Bloqué';sh.close();LES.splice(LES.indexOf(l),1);P.rerender();P.toast('Créneau retiré de la réservation',{undo:function(){l.type='Libre';LES.push(l);P.rerender()}})},
   note:function(){sh.close();P.go('coach-eleves',{id:l.who[0]})},
   gps:function(){P.toast('Itinéraire vers '+s.name+' ouvert : '+s.km+' km, '+s.min+' min',{icon:'route'})}});
 },foot:free?'<button class="btn danger" data-a="block">Fermer ce créneau</button>':l.done?(l.todo?'<button class="btn pri" data-a="note">'+I('edit','sm')+'Écrire la note de séance</button>':'<button class="btn" data-a="note">Voir la fiche de l’élève</button>'):'<button class="btn" data-a="gps">'+I('route','sm')+'Itinéraire</button><button class="btn" data-a="move">Décaler</button>'+(l.d===0?'<button class="btn pri" data-a="start">'+I('play','sm')+'Démarrer</button>':'')})}

P.mod({id:'coach-agenda',role:'coach',group:'Coaching',title:'Agenda',icon:'planning',n:10,short:'Agenda',phoneTitle:'Bonjour Pauline',
 badge:function(){return caReq.length?{v:caReq.length}:null},
 render:function(el){
  var today=dayL(0),nx=today.find(function(l){return !l.done&&l.who.length}),wk=LES.filter(function(l){return l.type!=='Libre'}),wsum=wk.reduce(function(a,l){return a+l.price},0),tsum=today.reduce(function(a,l){return a+l.price},0);
  var s0=nx&&stu(nx.who[0]),mins=nx?hm(nx.t)-(9*60+41):0;
  var B={},cfg=caCfg(),tmin=today.filter(function(l){return l.who.length}).reduce(function(a,l){return a+l.dur},0);el.classList.toggle('ca-big',!!cfg.big);
  el.innerHTML=ph('Bonjour Pauline','Mardi 17 novembre · '+today.filter(function(l){return l.who.length}).length+' cours dans 3 écuries, '+F.eur(tsum)+' et 46 km de route',
   '<button class="btn" data-a="perso">'+I('sliders','sm')+'Personnaliser</button><button class="btn" data-a="add">'+I('plus','sm')+'Ajouter un cours</button>')+
  offBar()+
  '<div class="ca"><div class="stack" style="--g:14px"><div class="hrow sp wrap">'+U.seg([['jour','Jour'],['sem','Semaine']],caView,'data-v')+'<span class="s mut">Semaine du 16 au 22 novembre · <b class="num" style="color:var(--ink)">'+wk.length+' cours</b> · <b class="num" style="color:var(--ink)">'+F.eur(wsum)+'</b></span></div><div data-main></div></div>'+
  '<div class="ca-side" data-side></div></div>';
  B.next=(nx?'<div class="card navy ca-next ca-top"><div class="glow"></div><div class="hrow sp"><span class="eyebrow" style="color:color-mix(in srgb,var(--navy-ink) 70%,var(--acc))">Prochain cours dans '+th(mins)+'</span><span class="chip" style="background:color-mix(in srgb,var(--navy-ink) 14%,transparent);color:var(--navy-ink)">'+nx.t+'</span></div>'+
    '<div class="hrow" style="--g:12px">'+(nx.who.length>1?lAvs(nx):U.av(s0,'lg'))+'<div style="min-width:0"><h2>'+(nx.who.length>1&&nx.title?nx.title:s0.first+' et '+s0.horse.split(' ')[0])+'</h2><div class="s mut">'+lSub(nx)+'</div></div></div>'+
    '<div class="s mut">'+(nx.who.length>1?'Avec '+nx.who.map(function(w){return stu(w).first}).join(', ')+'.':'Objectif du moment : '+s0.goal.charAt(0).toLowerCase()+s0.goal.slice(1)+'.')+' Départ conseillé à '+tc(hm(nx.t)-stb(nx.stable).min-10).replace(':',' h ')+', '+stb(nx.stable).min+' minutes de route depuis la Vallée.</div>'+
    '<button class="ca-go" data-a="start">'+I('play')+'Démarrer le cours</button><span class="xs ca-offok">'+I('wifi','sm')+'Fonctionne aussi sans réseau, au fond du manège</span></div>':'<div class="card pad ca-top">'+U.empty('checkc','Journée terminée','Tous vos cours du jour sont faits.')+'</div>');
  B.quick='<div class="card ca-top"><div class="ch" style="padding-bottom:8px"><h3>Raccourcis</h3><button class="btn ghost sm" data-a="perso">'+I('edit','sm')+'Changer</button></div><div class="ca-qk">'+cfg.quick.map(function(id){var q=CA_Q.find(function(x){return x[0]===id});return q?'<button class="ca-q" data-a="q" data-id="'+q[0]+'">'+sq(q[1])+'<span style="min-width:0"><b>'+q[2]+'</b><small class="ellip">'+q[3]()+'</small></span></button>':''}).join('')+'</div></div>';
  B.req='<div class="card" data-req></div>';
  B.today='<div class="card"><div class="ch"><h3>Aujourd’hui</h3><span class="xs mut">3 écuries</span></div><div class="cb stack" style="--g:10px">'+row('Heures de cours',th(tmin))+row('Revenus du jour','<span class="num">'+F.eur(tsum)+'</span>')+row('Route','46 km · 58 min')+(D.facts&&D.facts.hersage?row('Carrière d’honneur','Hersage à '+th(hm(D.facts.hersage.at))):'')+'<div class="hrow wrap" style="--g:6px;padding-top:4px">'+ST.filter(function(s){return s.on}).map(function(s){return '<span class="chip line"><i style="width:7px;height:7px;border-radius:50%;background:'+s.c+'"></i>'+s.short+'</span>'}).join('')+'</div></div></div>';
  el.querySelector('[data-side]').innerHTML=cfg.blocks.filter(function(b){return b.on&&B[b.id]}).map(function(b){return B[b.id]}).join('');
  var main=el.querySelector('[data-main]'),rq=el.querySelector('[data-req]')||document.createElement('div');
  function drawReq(){rq.innerHTML='<div class="ch" style="padding-bottom:8px"><h3>Demandes de réservation</h3>'+(caReq.length?U.chip(caReq.length,'acc'):'')+'</div>'+(caReq.length?caReq.map(function(q){return '<div class="ca-rq"><div class="hrow" style="--g:10px">'+(q.av?U.av(q.av):U.av(q.avo))+'<div class="grow"><div class="b s ellip">'+q.who+'</div><div class="xs mut ellip">'+q.what+' · '+q.when+'</div></div><b class="s num">'+F.eur(q.price)+'</b></div><div class="xs mut">'+q.where+'. '+q.note+'</div><div class="g2" style="--g:8px;grid-template-columns:1fr 1fr"><button class="btn sm" style="height:40px" data-a="rno" data-id="'+q.id+'">Proposer un autre horaire</button><button class="btn sm dark" style="height:40px" data-a="rok" data-id="'+q.id+'">Accepter</button></div></div>'}).join(''):'<div class="cb s mut" style="padding-top:4px">Aucune demande en attente. Vos créneaux libres restent visibles sur votre page publique.</div>')}
  function item(l,i,L){var s=stb(l.stable),free=l.type==='Libre',prev=L[i-1],tr='';
   if(prev&&prev.stable!==l.stable){var gap=hm(l.t)-(hm(prev.t)+prev.dur);tr='<div class="ca-tr">'+I('car')+'<span class="grow">Trajet vers '+s.short+' · '+s.km+' km, '+s.min+' min</span><span class="num">'+(gap-s.min>=10?'Départ à '+tc(hm(l.t)-s.min-10):'Marge de '+(gap-s.min)+' min')+'</span></div>'}
   return tr+'<button class="ca-it'+(l.done?' done':'')+(nx&&l.id===nx.id?' next':'')+(free?' free':'')+'" data-a="les" data-id="'+l.id+'"><span class="tm">'+l.t+'<small>'+dur(l.dur)+'</small></span><span class="st" style="--c:'+s.c+'"></span><span style="min-width:0"><span class="b tt ellip" style="display:block">'+lTitle(l)+'</span><span class="s mut ellip" style="display:block">'+lSub(l)+'</span></span><span class="hrow" style="--g:8px">'+(l.todo?U.chip('Note à écrire','warn',true):l.done?U.chip('Fait','ok',true):l.pend?U.chip('À confirmer','warn',true):free?U.chip('Libre','line'):l.who.length>1?lAvs(l):'<b class="s num">'+F.eur(l.price)+'</b>')+'</span></button>'}
  /* le hersage de la carrière d'honneur (fait de référence) s'intercale dans la journée des Tilleuls */
  function withHerse(H,L){var hz=D.facts&&D.facts.hersage;if(!hz||caDay!==0)return H.join('');var at=hm(hz.at),i=L.findIndex(function(l){return hm(l.t)>=at});if(i<0)i=L.length;
   H.splice(i,0,'<div class="ca-hz">'+I('tractor','sm')+'<span class="grow"><b>'+th(at)+'</b> · Hersage de la '+arena(hz.arena).toLowerCase()+' aux Tilleuls, piste fermée 30 minutes</span></div>');return H.join('')}
  function draw(){var h='';
   if(caView==='jour'){var L=dayL(caDay);
    h+='<div class="ca-days">'+[-1,0,1,2,3,4,5].map(function(o){var dl=dayL(o).filter(function(l){return l.who.length});return '<button data-a="day" data-d="'+o+'" aria-selected="'+(o===caDay)+'">'+DWS[day(o).getDay()]+'<b>'+day(o).getDate()+'</b><i>'+dl.slice(0,4).map(function(l){return '<u style="--c:'+stb(l.stable).c+'"></u>'}).join('')+'</i></button>'}).join('')+'</div>'+
     '<div class="card" style="margin-top:14px;overflow:hidden"><div class="ch" style="padding-bottom:10px"><h3>'+F.dateL(day(caDay)).replace(/^./,function(c){return c.toUpperCase()})+'</h3><span class="xs mut">'+L.filter(function(l){return l.who.length}).length+' cours · '+F.eur(L.reduce(function(a,l){return a+l.price},0))+'</span></div>'+(L.length?withHerse(L.map(item),L):U.empty('sun','Journée libre','Aucun cours ce jour-là.'))+'</div>'}
   else{h+='<div class="ca-wk">'+[-1,0,1,2,3,4,5].map(function(o){var L=dayL(o);return '<div class="ca-wc"><div class="ca-wh'+(o===0?' today':'')+'"><span>'+DWS[day(o).getDay()]+' '+day(o).getDate()+'</span><span class="num">'+F.eur(L.reduce(function(a,l){return a+l.price},0))+'</span></div>'+L.map(function(l){var s=stb(l.stable);return '<button class="ca-wb'+(l.done?' done':'')+'" style="--c:'+s.c+'" data-a="les" data-id="'+l.id+'"><b>'+l.t+'</b><span>'+(l.type==='Libre'?'Créneau libre':l.alt?l.alt.split(' · ')[0]:l.title||stu(l.who[0]).first+' '+stu(l.who[0]).last)+'</span><small>'+s.short+'</small></button>'}).join('')+'</div>'}).join('')+'</div>'+
     '<div class="hrow wrap" style="margin-top:14px;--g:14px">'+C.legend(ST.filter(function(s){return s.on}).map(function(s){return [s.name,s.c]}))+'</div>'}
   main.innerHTML=h}
  draw();drawReq();
  el.querySelectorAll('[data-v]').forEach(function(x){x.addEventListener('click',function(){caView=x.getAttribute('data-v');draw()})});
  act(el,{day:function(b){caDay=+b.getAttribute('data-d');draw()},
   les:function(b){lessonSheet(LES.find(function(l){return l.id===b.getAttribute('data-id')}))},
   start:function(){liveSheet(nx)},
   sync:function(b){b.innerHTML=I('check','sm');P.toast(CO.offline?'Synchronisation en attente du réseau':'Vos cours sont à jour dans Google Agenda et Apple Calendrier',{icon:CO.offline?'wifi':'checkc'})},
   perso:function(){persoSheet()},
   online:function(){reconnect()},
   q:function(b){var q=CA_Q.find(function(x){return x[0]===b.getAttribute('data-id')});if(q)q[4](nx)},
   add:function(){var sh=P.sheet({title:'Ajouter un cours',icon:'plus',body:'<div class="stack" style="--g:12px"><label class="field"><span>Élève</span><select class="in">'+STU.map(function(s){return '<option>'+s.first+' '+s.last+' · '+s.horse+'</option>'}).join('')+'</select></label><div class="g2" style="--g:12px"><label class="field"><span>Jour</span><select class="in"><option>Mercredi 18 novembre</option><option>Jeudi 19 novembre</option><option>Vendredi 20 novembre</option></select></label><label class="field"><span>Heure</span><select class="in"><option>16 h 30</option><option>17 h 30</option></select></label></div><label class="field"><span>Écurie</span><select class="in">'+ST.filter(function(s){return s.on}).map(function(s){return '<option>'+s.name+'</option>'}).join('')+'</select></label><div class="card flat" style="padding:4px 14px">'+row('Demander le paiement en ligne',U.tog(true))+row('Répéter chaque semaine',U.tog(false))+'</div></div>',foot:'<button class="btn pri" data-ok>Ajouter et prévenir l’élève</button>'});sh.querySelector('[data-ok]').onclick=function(){sh.close();P.toast('Cours ajouté, votre élève reçoit le lien de paiement')}},
   rok:function(b){var q=caReq.find(function(x){return x.id===b.getAttribute('data-id')});caReq=caReq.filter(function(x){return x!==q});drawReq();P.toast('Réservation acceptée : '+q.who.split(' · ')[0]+', '+q.when.toLowerCase(),{undo:function(){caReq.push(q);drawReq()}})},
   rno:function(b){var q=caReq.find(function(x){return x.id===b.getAttribute('data-id')});caReq=caReq.filter(function(x){return x!==q});drawReq();P.toast('Trois autres horaires proposés à '+q.who.split(' ')[0],{icon:'swap',undo:function(){caReq.push(q);drawReq()}})}});
 }});

/* =====================================================================
   VUE COACH · Élèves
   ===================================================================== */
P.css(`
.ce{display:grid;grid-template-columns:340px minmax(0,1fr);gap:14px;align-items:start}
.ce-li{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:11px 14px;min-height:64px;text-align:left;width:100%;transition:background var(--t-1);position:relative}
.ce-li+.ce-li{border-top:1px solid var(--line)}
.ce-li:hover{background:var(--surface-2)}
.ce-li[aria-selected="true"]{background:var(--acc-pale)}
.ce-hd{padding:18px;display:flex;gap:16px;align-items:center;flex-wrap:wrap}
.ce-sk{display:grid;grid-template-columns:76px minmax(0,1fr) 30px;gap:10px;align-items:center;font-size:12.500px}
.ce-goal{display:flex;gap:12px;align-items:center;padding:9px 0;min-height:44px}
.ce-goal+.ce-goal{border-top:1px solid var(--line)}
.ce-goal[data-on="true"] .t{color:var(--mut)}
.ce-note{padding:12px 16px}
.ce-note+.ce-note{border-top:1px solid var(--line)}
.ce-vids{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.ce-vid{aspect-ratio:16/10;border-radius:var(--r-md);position:relative;overflow:hidden;background:linear-gradient(160deg,#1c2a55,#0a1230 60%,#17223f);display:block;width:100%;text-align:left}
.ce-vid::before{content:"";position:absolute;left:0;right:0;bottom:0;height:38%;background:linear-gradient(to top,#b89a6a,#8a744f);opacity:.55}
.ce-vid .pl{position:absolute;left:50%;top:50%;width:40px;height:40px;margin:-20px;border-radius:50%;background:rgba(255,255,255,.92);color:#0a1636;display:grid;place-items:center;transition:transform var(--t-2) var(--e-spring)}
.ce-vid:hover .pl{transform:scale(1.1)}
.ce-vid .cap{position:absolute;left:8px;right:8px;bottom:6px;display:flex;justify-content:space-between;gap:6px;font-size:11px;font-weight:600;color:#fff;text-shadow:0 1px 3px rgba(0,0,0,.6)}
.ce-vid .cap span:first-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
@container main (max-width:1080px){.ce{grid-template-columns:280px minmax(0,1fr)}}
@container main (max-width:860px){.ce{grid-template-columns:minmax(0,1fr)}.ce-detail{display:none}}
`);
var ceSel='s1',ceFil='all',ceQ='',ceTab='stu';
var CE={goals:{s1:[['Garder la même cadence sur un parcours entier',true],['Enchaîner 115 cm sans faute à la maison',true],['Prendre les options courtes au barrage',false],['Premier Amateur 3 en mars',false]]},
 notes:{s1:[{d:'Ven. 13 nov.',tag:'Concours',t:'Chantilly : sans-faute et 3e du Grand Prix à 115 cm. Ulysse est resté à l’écoute jusqu’au dernier oxer.',sh:true},{d:'Mar. 10 nov.',tag:'Cours',t:'Ligne en cinq foulées, raccourcie puis allongée. Léa laisse encore filer le dernier abord, on y revient mardi.',sh:true},{d:'Mar. 3 nov.',tag:'Pour moi',t:'Étriers un trou trop longs. Lui proposer une séance sans étriers avant l’hiver.',sh:false}]}};
function goalsOf(s){return CE.goals[s.id]=CE.goals[s.id]||[[s.goal,false],['Régularité des abords à '+s.h[7]+' cm',true],['Autonomie à la détente en concours',s.pct>60],['Travail sur le plat deux fois par semaine',false]]}
function notesOf(s){return CE.notes[s.id]=CE.notes[s.id]||[{d:'Jeu. 12 nov.',tag:'Cours',t:'Bonne séance avec '+s.horse+'. Gymnastique sur quatre éléments, le couple gagne en équilibre à la réception.',sh:true},{d:'Jeu. 5 nov.',tag:'Cours',t:'Détente trop courte, cheval tendu sur les premiers sauts. Prévoir quinze minutes de plat avant de sauter.',sh:true},{d:'Lun. 26 oct.',tag:'Pour moi',t:'Voir avec l’écurie pour un créneau plus tôt, la carrière est trop fréquentée à 18 h.',sh:false}]}
function skillsOf(s){var b=s.pct;return [['Cadence',Math.min(95,b+8)],['Abord',Math.max(30,b-4)],['Tracé',Math.min(95,b+12)],['Équilibre',b],['Mental',Math.min(98,b+18)]]}
function stuDetail(s,m){var G2=m?'stack':'g2',G3=m?'stack':'g3',g=goalsOf(s),n=notesOf(s),st=stb(s.stable),gd=g.filter(function(x){return x[1]}).length;
 return '<div class="card ce-hd">'+U.av(s,'xl')+'<div class="grow" style="min-width:180px"><h2 style="font-size:22px">'+s.first+' '+s.last+'</h2><div class="s mut" style="margin-top:4px">'+s.horse+' · '+s.level+' · '+st.name+'</div><div class="hrow wrap" style="--g:6px;margin-top:10px">'+U.chip(s.n+' séances','')+U.chip('Prochain cours : '+s.next.toLowerCase(),'acc',true)+'</div></div>'+
   '<div class="hrow" style="--g:8px"><button class="btn icon" data-a="smsg" title="Écrire à '+s.first+'">'+I('chat')+'</button><button class="btn" data-a="sbook">'+I('calendar_add','sm')+'Proposer un cours</button></div></div>'+
  '<div class="'+G3+'" style="margin-top:14px;--g:14px"><div class="card span2"><div class="ch"><div><h3>Hauteur maîtrisée</h3><div class="xs mut">8 dernières semaines, en cm</div></div><span class="delta up">+'+(s.h[7]-s.h[0])+' cm</span></div><div class="cb">'+C.line([{v:s.h,c:'var(--acc)',area:true}],['S39','S40','S41','S42','S43','S44','S45','S46'],{h:m?260:190,min:s.h[0]-15,max:s.h[7]+10,fmt:function(v){return Math.round(v)}}).replace('class="chart"','class="chart cr-ch ce-ch"')+'</div></div>'+
   '<div class="card"><div class="ch"><div><h3>Compétences</h3><div class="xs mut">Votre évaluation, mise à jour après chaque séance</div></div></div><div class="cb stack" style="--g:11px">'+skillsOf(s).map(function(k){return '<div class="ce-sk"><span class="mut">'+k[0]+'</span>'+U.bar(k[1])+'<b class="num" style="text-align:right">'+k[1]+'</b></div>'}).join('')+'</div></div></div>'+
  '<div class="'+G2+'" style="margin-top:14px;--g:14px"><div class="card"><div class="ch" style="padding-bottom:6px"><h3>Objectifs</h3>'+U.ring(gd/g.length*100,gd+'/'+g.length,'var(--acc)',40)+'</div><div class="cb" style="padding-top:4px">'+g.map(function(x,i){return '<label class="ce-goal fx-click" data-on="'+x[1]+'">'+U.chk(x[1],String(i)).replace('class="chk"','class="chk" data-manual data-a="goal"')+'<span class="s t grow">'+x[0]+'</span></label>'}).join('')+'<button class="btn ghost sm" style="margin-top:6px" data-a="gadd">'+I('plus','sm')+'Ajouter un objectif</button></div></div>'+
   '<div class="card"><div class="ch" style="padding-bottom:10px"><h3>Vidéos de séance</h3><button class="btn ghost sm" data-a="vadd">'+I('video','sm')+'Filmer</button></div><div class="cb" style="padding-top:0"><div class="ce-vids">'+[['Oxer à '+s.h[7]+' cm','0:24'],['Ligne en cinq foulées','0:41'],['Parcours complet','1:12']].map(function(v){return '<div style="min-width:0"><button class="ce-vid" data-a="vid" data-n="'+v[0]+'" title="Lire la vidéo"><span class="pl">'+I('play','sm')+'</span><span class="cap"><span></span><span>'+v[1]+'</span></span></button><div class="xs b ellip" style="margin-top:6px">'+v[0]+'</div></div>'}).join('')+'</div><p class="xs mut" style="margin-top:10px">Les vidéos sont partagées avec '+s.first+', qui peut les revoir au ralenti avec vos annotations.</p></div></div></div>'+
  '<div class="card" style="margin-top:14px"><div class="ch" style="padding-bottom:6px"><h3>Notes de séance</h3><button class="btn sm" data-a="nadd">'+I('edit','sm')+'Écrire une note</button></div>'+n.map(function(x,i){return '<div class="ce-note"><div class="hrow sp wrap" style="--g:8px"><span class="hrow" style="--g:8px"><b class="s">'+x.d+'</b>'+U.chip(x.tag,x.tag==='Concours'?'acc':'')+'</span><label class="hrow xs mut" style="--g:8px;cursor:pointer">'+I(x.sh?'eye':'eye_off','sm')+(x.sh?'Partagée avec '+s.first:'Visible par vous seule')+tg(x.sh,'nshare',String(i))+'</label></div><p class="s" style="margin-top:6px;color:var(--ink-2)">'+x.t+'</p></div>'}).join('')+'</div>'}
function stuActions(root,gs,redraw){var H={
  goal:function(s,b){var g=goalsOf(s)[+b.getAttribute('data-id')];g[1]=!g[1];b.setAttribute('aria-checked',g[1]);if(g[1])P.toast('Objectif atteint, '+s.first+' est prévenue',{icon:'checkc'});setTimeout(redraw,240)},
  gadd:function(s){goalsOf(s).push(['Détente autonome en dix minutes',false]);redraw();P.toast('Objectif ajouté et partagé avec '+s.first)},
  nshare:function(s,b){var n=notesOf(s)[+b.getAttribute('data-id')];n.sh=!n.sh;P.toast(n.sh?'Note partagée avec '+s.first:'Note repassée en privé');setTimeout(redraw,240)},
  nadd:function(s){var sh=P.sheet({title:'Note pour '+s.first,icon:'edit',body:'<div class="stack" style="--g:12px"><textarea class="in" rows="5" data-t>Séance sur le plat, épaule en dedans aux deux mains. '+s.horse.split(' ')[0]+' se tient mieux à main droite.</textarea><div class="card flat" style="padding:4px 14px">'+row('Partager avec '+s.first,U.tog(true,'nt-sh'))+'</div></div>',foot:'<button class="btn pri" data-ok>Enregistrer la note</button>'});
   sh.querySelector('[data-ok]').onclick=function(){var on=sh.querySelector('#nt-sh').getAttribute('aria-checked')==='true';notesOf(s).unshift({d:'Mar. 17 nov.',tag:on?'Cours':'Pour moi',t:E(sh.querySelector('[data-t]').value),sh:on});sh.close();redraw();P.toast(on?'Note enregistrée et envoyée à '+s.first:'Note enregistrée, visible par vous seule')}},
  vid:function(s,b){P.toast('Lecture de « '+b.getAttribute('data-n')+' »',{icon:'play'})},
  vadd:function(s){P.toast('Caméra ouverte : la vidéo sera rangée dans la fiche de '+s.first,{icon:'video'})},
  smsg:function(s){P.toast('Conversation ouverte avec '+s.first,{icon:'chat'})},
  sbook:function(s){P.toast('Vos trois prochains créneaux libres sont envoyés à '+s.first,{icon:'send'})}},M={};
 Object.keys(H).forEach(function(k){M[k]=function(b){H[k](gs(),b)}});act(root,M)}

/* ---------- Exercices : bibliothèque par thème et créateur de parcours par glisser-déposer ---------- */
P.css(`
.cx{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:14px;align-items:start}
.cx-pal{display:flex;gap:8px;flex-wrap:wrap}
.cx-pal button{display:flex;align-items:center;gap:8px;height:40px;padding:0 12px 0 8px;border-radius:var(--r-md);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2);font-size:12.500px;font-weight:600;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;transition:box-shadow var(--t-2),background var(--t-2)}
.cx-pal button:hover{box-shadow:inset 0 0 0 1.500px var(--acc);background:var(--acc-pale)}
.cx-pal svg{width:30px;height:18px;flex:none}
.cx-ar{display:block;width:100%;height:auto;border-radius:var(--r-md);touch-action:none;user-select:none;-webkit-user-select:none}
.cx-ar .sand{fill:color-mix(in srgb,var(--warn) 16%,var(--surface))}
.cx-ar .fence{fill:none;stroke:color-mix(in srgb,var(--warn) 45%,var(--line-2));stroke-width:6}
.cx-ar .grid{stroke:color-mix(in srgb,var(--warn) 22%,transparent);stroke-width:1}
.cx-ar .bar{fill:var(--ink)}
.cx-ar .std{fill:var(--acc)}
.cx-ar .wall{fill:var(--bad)}
.cx-ar .hit{fill:transparent;cursor:grab}
.cx-ar .ob.sel .hit{fill:color-mix(in srgb,var(--acc) 16%,transparent);stroke:var(--acc);stroke-width:2;stroke-dasharray:5 4}
.cx-ar .ob.drag .hit{cursor:grabbing}
.cx-ar .num circle{fill:var(--navy)}
.cx-ar .num text{fill:var(--navy-ink);font:700 15px var(--f-text);text-anchor:middle;dominant-baseline:central}
.cx-ar .path{fill:none;stroke:var(--acc);stroke-width:2.500;stroke-dasharray:8 7;stroke-linecap:round;opacity:.85}
.cx-ar .dist rect{fill:var(--surface);stroke:var(--acc-line)}
.cx-ar .dist text{fill:var(--ink-2);font:600 13px var(--f-text);text-anchor:middle;dominant-baseline:central}
.cx-ar .start text{fill:var(--mut);font:600 13px var(--f-text)}
.cx-tb{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.cx-lib{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.cx-f{display:flex;flex-direction:column;gap:8px;padding:12px;border-radius:var(--r-md);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);text-align:left;min-width:0;transition:box-shadow var(--t-2),transform var(--t-2) var(--e-out)}
.cx-f:hover{box-shadow:inset 0 0 0 1px var(--acc-line),var(--shadow-2);transform:translateY(-1px)}
.cx-f svg.mini{width:100%;height:56px;border-radius:8px;background:color-mix(in srgb,var(--warn) 12%,var(--surface))}
.cx-f svg.mini .bar{fill:var(--ink)}
.cx-f svg.mini .path{fill:none;stroke:var(--acc);stroke-width:2;stroke-dasharray:5 4}
.cx-sv{display:flex;align-items:center;gap:10px;padding:10px 14px;width:100%;text-align:left}
.cx-sv+.cx-sv{border-top:1px solid var(--line)}
.cx-sv:hover{background:var(--surface-2)}
@container main (max-width:1080px){.cx{grid-template-columns:minmax(0,1fr)}.cx-lib{grid-template-columns:repeat(2,minmax(0,1fr))}}
@container main (max-width:520px){.cx-lib{grid-template-columns:minmax(0,1fr)}.cx-pal button{padding:0 10px 0 6px}}
`);
var CXK={v:['Vertical',4],o:['Oxer',4],t:['Triple barre',4],c:['Cavaletti',3],m:['Mur',4]};
function cxGlyph(k){var w=CXK[k][1]*10,h=w/2,s='';
 if(k==='v')s='<rect class="bar" x="'+(-h)+'" y="-2.5" width="'+w+'" height="5" rx="2"/>';
 else if(k==='o')s='<rect class="bar" x="'+(-h)+'" y="-8" width="'+w+'" height="4.500" rx="2"/><rect class="bar" x="'+(-h)+'" y="3.500" width="'+w+'" height="4.500" rx="2"/>';
 else if(k==='t')s='<rect class="bar" x="'+(-h)+'" y="-11" width="'+w+'" height="4" rx="2"/><rect class="bar" x="'+(-h)+'" y="-2" width="'+w+'" height="4" rx="2"/><rect class="bar" x="'+(-h)+'" y="7" width="'+w+'" height="4" rx="2"/>';
 else if(k==='c')s='<rect class="bar" x="'+(-h)+'" y="-2" width="'+w+'" height="4" rx="2"/><path d="M'+(-h+3)+' -6l6 12M'+(-h+9)+' -6l-6 12M'+(h-9)+' -6l6 12M'+(h-3)+' -6l-6 12" stroke="var(--ink)" stroke-width="2.200" stroke-linecap="round"/>';
 else s='<rect class="wall" x="'+(-h)+'" y="-6" width="'+w+'" height="12" rx="2"/>';
 var std=k==='c'?'':'<rect class="std" x="'+(-h-6)+'" y="-'+(k==='t'?13:k==='o'?10:7)+'" width="6" height="'+(k==='t'?26:k==='o'?20:14)+'" rx="2"/><rect class="std" x="'+h+'" y="-'+(k==='t'?13:k==='o'?10:7)+'" width="6" height="'+(k==='t'?26:k==='o'?20:14)+'" rx="2"/>';
 return std+s}
function cxPalIcon(k){return '<svg viewBox="-30 -18 60 36" aria-hidden="true"><g style="--ink:var(--ink)">'+cxGlyph(k).replace(/class="bar"/g,'fill="var(--ink)"').replace(/class="std"/g,'fill="var(--acc)"').replace(/class="wall"/g,'fill="var(--bad)"')+'</g></svg>'}
var CX={sel:null,theme:'all',name:'Enchaînements avant Rambouillet',n:0,obs:[],
 saved:[{name:'Enchaînements avant Rambouillet',obs:[['v',140,300,0],['o',300,300,0],['v',520,250,-45],['t',590,120,90],['o',430,90,0],['c',250,90,0],['m',110,160,90],['o',300,200,0]]},
  {name:'Gymnastique sur quatre éléments',obs:[['c',160,200,0],['v',230,200,0],['v',300,200,0],['o',380,200,0]]},
  {name:'Barrage court, options',obs:[['o',150,120,0],['v',360,300,-45],['t',560,140,90],['v',420,120,45],['o',230,300,0]]}],
 lib:[{id:'x1',t:'Ligne en cinq foulées',th:'Lignes',lv:'Club 1 à Amateur',d:20,obs:[['v',120,30],['o',230,30]],txt:'Un vertical puis un oxer à 21 m. On saute la ligne en cinq foulées régulières, puis en six en raccourcissant, puis de nouveau en cinq.',steps:['Trois passages au trot sur une barre au sol à la place du vertical','Ligne à 90 cm en cinq foulées','Même ligne en six foulées','Montée à la hauteur du jour']},
  {id:'x2',t:'Gymnastique sur quatre éléments',th:'Gymnastique',lv:'Club 2 à Amateur',d:25,obs:[['c',60,30],['v',110,30],['v',160,30],['o',220,30]],txt:'Cavaletti, deux foulées, vertical, une foulée, vertical, une foulée, oxer. Le cheval apprend à se replacer seul ; le cavalier garde les mains basses.',steps:['Abord au trot sur le cavaletti','Monter le premier vertical à 80 cm','Ajouter l’oxer à la fin','Une fois par main, sans étriers pour les plus avancés']},
  {id:'x3',t:'Cercle aux quatre barres',th:'Plat',lv:'Tous niveaux',d:15,obs:[['c',140,10],['c',230,30],['c',140,50],['c',50,30]],txt:'Quatre barres au sol posées sur un cercle de 20 m. Même nombre de foulées entre chaque barre, aux deux mains.',steps:['Au trot, régularité entre les barres','Au galop, quatre foulées entre chaque barre','Agrandir puis réduire le cercle d’une foulée']},
  {id:'x4',t:'Tracé court au barrage',th:'Barrage',lv:'Club Élite et plus',d:20,obs:[['o',60,40],['v',150,15],['v',240,40]],txt:'Deux options pour enchaîner un oxer et un vertical en diagonale : tourner court derrière le vertical ou prendre la ligne longue.',steps:['Repérer le point de tourne à pied','Tracé long au galop de travail','Tracé court, regard vers l’obstacle suivant']},
  {id:'x5',t:'Huit de chiffre sur un vertical',th:'Tracé',lv:'Club 3 à Club 1',d:15,obs:[['v',140,30]],txt:'Un vertical au centre, sauté en huit de chiffre pour changer de pied à la réception et travailler les courbes.',steps:['Barre au sol au trot','Vertical à 70 cm, réception sur le bon pied','Huit de chiffre complet sans rupture']},
  {id:'x6',t:'Transitions sur la diagonale',th:'Plat',lv:'Tous niveaux',d:10,obs:[],txt:'Galop, trot, galop sur la diagonale avec changement de pied au centre. Prépare l’équilibre avant de sauter.',steps:['Trois transitions par diagonale','Arrêt à la lettre X puis départ au galop','Aux deux mains']}]};
function cxLoad(list){CX.obs=list.map(function(o,i){return {id:'o'+(++CX.n),k:o[0],x:o[1],y:o[2],a:o[3]||0}});CX.sel=null}
cxLoad(CX.saved[0].obs);
function cxDist(a,b){return Math.round(Math.hypot(a.x-b.x,a.y-b.y))/10}
function cxStr(m){return Math.max(1,Math.round((m-7)/3.5))}
function cxArena(){var L=CX.obs,bg=CX.big,fs=bg?26:13,s='<rect class="sand" x="0" y="0" width="700" height="400" rx="14"/>';
 for(var gx=100;gx<700;gx+=100)s+='<line class="grid" x1="'+gx+'" y1="10" x2="'+gx+'" y2="390"/>';for(var gy=100;gy<400;gy+=100)s+='<line class="grid" x1="10" y1="'+gy+'" x2="690" y2="'+gy+'"/>';
 s+='<rect class="fence" x="3" y="3" width="694" height="394" rx="12"/><g class="start"><text x="22" y="378" style="font-size:'+(bg?24:13)+'px">Départ</text></g>';
 if(L.length>1)s+='<path class="path" d="M'+L.map(function(o){return o.x+' '+o.y}).join(' L')+'"/>';
 for(var i=1;i<L.length;i++){var a=L[i-1],b=L[i],m=cxDist(a,b),mx=(a.x+b.x)/2,my=(a.y+b.y)/2,t=bg?cxStr(m)+' f.':m.toString().replace('.',',')+' m · '+cxStr(m)+' foulée'+(cxStr(m)>1?'s':''),w=t.length*fs*.56+fs*1.3,hh=fs*1.9;s+='<g class="dist"><rect x="'+(mx-w/2)+'" y="'+(my-hh/2)+'" width="'+w+'" height="'+hh+'" rx="'+hh/2+'"/><text x="'+mx+'" y="'+my+'" style="font-size:'+fs+'px">'+t+'</text></g>'}
 L.forEach(function(o,i){s+='<g class="ob'+(CX.sel===o.id?' sel':'')+'" data-o="'+o.id+'" transform="translate('+o.x+' '+o.y+')"><g transform="rotate('+o.a+')'+(bg?' scale(1.5)':'')+'"><rect class="hit" x="-34" y="-22" width="68" height="44" rx="10"/>'+cxGlyph(o.k)+'</g><g class="num" transform="translate(0 '+(bg?-44:-32)+')"><circle r="'+(bg?21:12)+'"/><text style="font-size:'+(bg?26:15)+'px">'+(i+1)+'</text></g></g>'});
 return s}
function cxLen(){var t=0;for(var i=1;i<CX.obs.length;i++)t+=cxDist(CX.obs[i-1],CX.obs[i]);return Math.round(t)}
function cxMini(f){return '<svg class="mini" viewBox="0 0 280 60" preserveAspectRatio="xMidYMid meet" aria-hidden="true">'+(f.obs.length>1?'<path class="path" d="M'+f.obs.map(function(o){return o[1]+' '+o[2]}).join(' L')+'"/>':'')+(f.obs.length?f.obs.map(function(o){return '<g transform="translate('+o[1]+' '+o[2]+') scale(.7)">'+cxGlyph(o[0]).replace(/class="std"/g,'fill="var(--acc)"').replace(/class="wall"/g,'fill="var(--bad)"')+'</g>'}).join(''):'<path class="path" d="M30 50L250 10M30 10L250 50"/>')+'</svg>'}
function cxView(){var th=['all','Plat','Gymnastique','Lignes','Tracé','Barrage'],L=CX.lib.filter(function(f){return CX.theme==='all'||f.th===CX.theme});
 return '<div class="cx"><div class="stack" style="--g:14px"><div class="card"><div class="ch" style="padding-bottom:10px"><div style="min-width:0"><h3>Créateur de parcours</h3><div class="xs mut">Carrière d’honneur, 70 × 40 m · glissez un obstacle sur la piste, touchez-le pour le tourner</div></div></div>'+
  '<div class="cb stack" style="--g:12px;padding-top:0"><div class="cx-pal">'+Object.keys(CXK).map(function(k){return '<button data-pal="'+k+'" title="Glisser ou toucher pour ajouter">'+cxPalIcon(k)+CXK[k][0]+'</button>'}).join('')+'</div>'+
  '<svg class="cx-ar" viewBox="0 0 700 400" role="img" aria-label="Plan du parcours" data-ar>'+cxArena()+'</svg>'+
  '<div class="cx-tb" data-tb></div></div></div>'+
  '<div class="card"><div class="ch" style="padding-bottom:10px"><h3>Bibliothèque d’exercices</h3><span class="xs mut">'+CX.lib.length+' fiches</span></div><div class="cb stack" style="--g:12px;padding-top:0"><div class="scroll-x">'+U.seg(th.map(function(t){return [t,t==='all'?'Tous':t]}),CX.theme,'data-cxt')+'</div><div class="cx-lib">'+L.map(function(f){return '<button class="cx-f" data-a="fiche" data-id="'+f.id+'">'+cxMini(f)+'<span class="hrow sp" style="--g:6px">'+U.chip(f.th,'acc')+'<span class="xs mut num">'+f.d+' min</span></span><b class="s">'+f.t+'</b><span class="xs mut">'+f.lv+'</span></button>'}).join('')+'</div></div></div></div>'+
  '<div class="card"><div class="ch" style="padding-bottom:6px"><h3>Mes parcours</h3><span class="xs mut">'+CX.saved.length+' enregistrés</span></div><div data-saved>'+cxSaved()+'</div><div class="cf"><span class="xs mut">Chaque parcours partagé apparaît dans l’application de l’élève, avec les distances et le nombre de foulées.</span></div></div></div>'}
function cxSaved(){return CX.saved.map(function(p,i){return '<button class="cx-sv" data-a="ld" data-i="'+i+'">'+sq('jump',p.name===CX.name?'acc':'ok')+'<span class="grow" style="min-width:0"><b class="s ellip" style="display:block">'+p.name+'</b><span class="xs mut">'+p.obs.length+' obstacles</span></span>'+(p.name===CX.name?U.chip('Ouvert','acc',true):I('right','sm'))+'</button>'}).join('')}
function cxBind(root){var ar=root.querySelector('[data-ar]'),tb=root.querySelector('[data-tb]'),dg=null;
 function pt(e){var m=ar.getScreenCTM();if(!m)return {x:350,y:200};var p=ar.createSVGPoint();p.x=e.clientX;p.y=e.clientY;p=p.matrixTransform(m.inverse());return {x:Math.max(30,Math.min(670,p.x)),y:Math.max(40,Math.min(375,p.y))}}
 function bar(){var o=CX.obs.find(function(x){return x.id===CX.sel}),n=CX.obs.length;
  tb.innerHTML=(o?'<span class="s b">'+(CX.obs.indexOf(o)+1)+'. '+CXK[o.k][0]+'</span><button class="btn sm" data-a="rot">'+I('rotate','sm')+'Tourner</button><button class="btn sm" data-a="fw" title="Sauter plus tôt">'+I('up','sm')+'Avancer</button><button class="btn sm danger" data-a="del">'+I('trash','sm')+'Retirer</button>':'<span class="s mut"><b class="num" style="color:var(--ink)">'+n+'</b> obstacle'+(n>1?'s':'')+' · <b class="num" style="color:var(--ink)">'+cxLen()+' m</b> de parcours</span>')+
   '<span class="grow"></span><button class="btn sm ghost" data-a="clr">Tout effacer</button><button class="btn sm" data-a="save">'+I('download','sm')+'Enregistrer</button><button class="btn sm dark" data-a="share">'+I('send','sm')+'Partager</button>'}
 function draw(){ar.innerHTML=cxArena();bar()}
 var big=ar.getBoundingClientRect().width<520;if(big!==!!CX.big){CX.big=big;ar.innerHTML=cxArena()}
 bar();
 ar.addEventListener('pointerdown',function(e){var g=e.target.closest('.ob');if(!g)return;e.preventDefault();var o=CX.obs.find(function(x){return x.id===g.getAttribute('data-o')}),p=pt(e);dg={o:o,dx:o.x-p.x,dy:o.y-p.y,sx:e.clientX,sy:e.clientY,on:false};try{ar.setPointerCapture(e.pointerId)}catch(_){}});
 ar.addEventListener('pointermove',function(e){if(!dg)return;if(!dg.on&&Math.abs(e.clientX-dg.sx)+Math.abs(e.clientY-dg.sy)<5)return;dg.on=true;var p=pt(e);dg.o.x=Math.round(Math.max(30,Math.min(670,p.x+dg.dx)));dg.o.y=Math.round(Math.max(40,Math.min(375,p.y+dg.dy)));CX.sel=dg.o.id;ar.innerHTML=cxArena();var gg=ar.querySelector('[data-o="'+dg.o.id+'"]');if(gg)gg.classList.add('drag')});
 function end(){if(!dg)return;var d=dg;dg=null;if(!d.on){CX.sel=CX.sel===d.o.id?null:d.o.id}draw()}
 ar.addEventListener('pointerup',end);ar.addEventListener('pointercancel',end);
 ar.addEventListener('click',function(e){if(!e.target.closest('.ob')&&CX.sel){CX.sel=null;draw()}});
 /* palette : toucher pour ajouter, ou glisser jusqu'à la piste */
 var pd=null;
 root.querySelectorAll('[data-pal]').forEach(function(b){b.addEventListener('pointerdown',function(e){pd={k:b.getAttribute('data-pal'),sx:e.clientX,sy:e.clientY,o:null};e.preventDefault()})});
 function pmove(e){if(!pd)return;try{getSelection().removeAllRanges()}catch(_){}if(!pd.o){if(Math.abs(e.clientX-pd.sx)+Math.abs(e.clientY-pd.sy)<8)return;pd.o={id:'o'+(++CX.n),k:pd.k,x:350,y:200,a:0};CX.obs.push(pd.o);CX.sel=pd.o.id}var p=pt(e);pd.o.x=Math.round(p.x);pd.o.y=Math.round(p.y);ar.innerHTML=cxArena()}
 function pup(){if(!pd)return;var d=pd;pd=null;if(!d.o){var c=CX.obs.length,o={id:'o'+(++CX.n),k:d.k,x:200+(c*67)%320,y:110+(c*53)%190,a:0};CX.obs.push(o);CX.sel=o.id;d.o=o}draw();P.toast(CXK[d.k][0]+' posé, obstacle n° '+CX.obs.length,{ms:1500})}
 document.addEventListener('pointermove',pmove);document.addEventListener('pointerup',pup);
 var ob=new MutationObserver(function(){if(!root.isConnected){document.removeEventListener('pointermove',pmove);document.removeEventListener('pointerup',pup);ob.disconnect()}});ob.observe(P.app(),{childList:true,subtree:true});
 act(root,{rot:function(){var o=CX.obs.find(function(x){return x.id===CX.sel});o.a=(o.a+45)%180;draw()},
  fw:function(){var o=CX.obs.find(function(x){return x.id===CX.sel}),i=CX.obs.indexOf(o);if(i>0){CX.obs.splice(i,1);CX.obs.splice(i-1,0,o);draw();P.toast(CXK[o.k][0]+' devient l’obstacle n° '+i,{ms:1500})}else P.toast('C’est déjà le premier obstacle',{icon:'info',ms:1500})},
  del:function(){var o=CX.obs.find(function(x){return x.id===CX.sel}),i=CX.obs.indexOf(o);CX.obs.splice(i,1);CX.sel=null;draw();P.toast(CXK[o.k][0]+' retiré',{undo:function(){CX.obs.splice(i,0,o);draw()}})},
  clr:function(){var old=CX.obs.slice();CX.obs=[];CX.sel=null;draw();P.toast('Piste vidée',{undo:function(){CX.obs=old;draw()}})},
  save:function(){var sh=P.sheet({title:'Enregistrer le parcours',icon:'jump',body:'<label class="field"><span>Nom du parcours</span><input class="in" data-n value="'+E(CX.name)+'"></label><p class="xs mut" style="margin-top:8px">'+CX.obs.length+' obstacles, '+cxLen()+' m. Le parcours est rangé dans « Mes parcours ».</p>',foot:'<button class="btn pri" data-ok>Enregistrer</button>'});
   sh.querySelector('[data-ok]').onclick=function(){var n=sh.querySelector('[data-n]').value.trim()||'Parcours sans nom',list=CX.obs.map(function(o){return [o.k,o.x,o.y,o.a]}),ex=CX.saved.find(function(p){return p.name===n});if(ex)ex.obs=list;else CX.saved.unshift({name:n,obs:list});CX.name=n;sh.close();root.querySelector('[data-saved]').innerHTML=cxSaved();P.toast('Parcours « '+n+' » enregistré',{icon:'checkc'})}},
  share:function(){cxShare('le parcours « '+CX.name+' »')},
  ld:function(b){var p=CX.saved[+b.getAttribute('data-i')];CX.name=p.name;cxLoad(p.obs);draw();root.querySelector('[data-saved]').innerHTML=cxSaved();P.toast('Parcours « '+p.name+' » ouvert sur la piste',{ms:1600})},
  fiche:function(b){cxFiche(CX.lib.find(function(f){return f.id===b.getAttribute('data-id')}),draw)}});
 root.querySelectorAll('[data-cxt]').forEach(function(x){x.addEventListener('click',function(){CX.theme=x.getAttribute('data-cxt');P.rerender()})})}
function cxShare(what){var pick={s1:true};var sh=P.sheet({title:'Partager avec mes élèves',icon:'send',body:function(b,sheet){
  function draw(){b.innerHTML='<p class="s mut" style="margin-bottom:12px">Choisissez qui reçoit '+what+'. Il apparaît dans la fiche de chaque élève et dans son application.</p><div class="card flat list">'+STU.map(function(s){return '<div class="li click" data-a="pk" data-id="'+s.id+'">'+U.av(s)+'<div class="grow"><div class="t">'+s.first+' '+s.last+'</div><div class="s">'+s.horse+' · '+s.level+'</div></div>'+U.chk(!!pick[s.id])+'</div>'}).join('')+'</div>';
   var n=Object.keys(pick).filter(function(k){return pick[k]}).length,ok=sheet.querySelector('[data-a="go"]');if(ok){ok.disabled=!n;ok.innerHTML=I('send','sm')+(n?'Envoyer à '+n+' élève'+(n>1?'s':''):'Choisissez un élève')}}
  act(sheet,{pk:function(x){var id=x.getAttribute('data-id');pick[id]=!pick[id];draw()},go:function(){var ids=Object.keys(pick).filter(function(k){return pick[k]});sheet.close();ids.forEach(function(id){var s=stu(id);notesOf(s).unshift({d:'Mar. 17 nov.',tag:'Exercice',t:'Partagé : '+what.replace(/^(le|la|l’) ?/,'')+'.',sh:true})});P.toast(ids.length===1?'Envoyé à '+stu(ids[0]).first:'Envoyé à '+ids.length+' élèves',{icon:'send'})}});
  setTimeout(draw,0)},foot:'<button class="btn pri" data-a="go">'+I('send','sm')+'Envoyer</button>'})}
function cxFiche(f,redraw){var sh=P.sheet({title:f.t,icon:'jump',body:cxMini(f).replace('class="mini"','class="mini" style="height:110px;width:100%;border-radius:12px;background:color-mix(in srgb,var(--warn) 12%,var(--surface))"')+
  '<div class="hrow wrap" style="--g:6px;margin:12px 0">'+U.chip(f.th,'acc')+U.chip(f.lv,'line')+U.chip(f.d+' min','line')+'</div><p class="s" style="color:var(--ink-2)">'+f.txt+'</p>'+sec('Progression')+'<div class="tl">'+f.steps.map(function(s){return '<div class="ev"><div class="s">'+s+'</div></div>'}).join('')+'</div>',
  foot:(f.obs.length?'<button class="btn" data-ld>'+I('jump','sm')+'Poser sur la piste</button>':'')+'<button class="btn pri" data-sh>'+I('send','sm')+'Envoyer à un élève</button>'});
 var l=sh.querySelector('[data-ld]');if(l)l.onclick=function(){CX.name=f.t;cxLoad(f.obs.map(function(o,i){return [o[0],150+o[1]*1.6,120+o[2]*3.5,0]}));sh.close();redraw();P.toast('Exercice posé sur la piste, ajustez les distances',{icon:'jump'})};
 sh.querySelector('[data-sh]').onclick=function(){sh.close();setTimeout(function(){cxShare('l’exercice « '+f.t+' »')},300)}}

P.mod({id:'coach-eleves',role:'coach',group:'Coaching',title:'Élèves',icon:'members',n:20,short:'Élèves',
 render:function(el,ctx){
  var openId=ctx.params&&ctx.params.id&&stu(ctx.params.id)?ctx.params.id:null;if(openId){ceSel=openId;ctx.params.id=null;ceTab='stu'}
  if(ctx.params&&ctx.params.tab){ceTab=ctx.params.tab;ctx.params.tab=null}
  var tabs='<div class="fx-tabs" style="margin-bottom:14px">'+U.tabs([['stu','Mes élèves'],['ex','Exercices et parcours']],ceTab,'data-cet')+'</div>';
  function bindTabs(){el.querySelectorAll('[data-cet]').forEach(function(t){t.addEventListener('click',function(){ceTab=t.getAttribute('data-cet');P.rerender()})})}
  if(ceTab==='ex'){el.innerHTML=ph('Élèves','Exercices par thème et parcours à dessiner, à partager avec vos élèves','<button class="btn" data-a="exn">'+I('plus','sm')+'Nouveau parcours</button>')+tabs+cxView();bindTabs();cxBind(el);
   act(el,{exn:function(){var old=CX.obs.slice(),on=CX.name;CX.obs=[];CX.sel=null;CX.name='Nouveau parcours';P.rerender();P.toast('Piste vide : glissez les obstacles depuis la palette',{undo:function(){CX.obs=old;CX.name=on;P.rerender()}})}});return}
  el.innerHTML=ph('Élèves',STU.length+' cavaliers suivis dans 3 écuries · 1 note de séance à écrire','<button class="btn" data-a="inv">'+I('plus','sm')+'Inviter un élève</button>')+tabs+
   '<div class="ce"><div class="stack" style="--g:10px"><div class="search">'+I('search','sm')+'<input class="in" placeholder="Chercher un élève ou un cheval" data-q></div><div class="scroll-x">'+U.seg([['all','Tous']].concat(ST.filter(function(s){return s.on}).map(function(s){return [s.id,s.short]})),ceFil,'data-f')+'</div><div class="card" data-list style="overflow:hidden"></div></div><div class="ce-detail" data-detail></div></div>';
  var list=el.querySelector('[data-list]'),det=el.querySelector('[data-detail]');
  function narrow(){return getComputedStyle(det).display==='none'}
  function drawList(){var q=ceQ.toLowerCase(),L=STU.filter(function(s){return (ceFil==='all'||s.stable===ceFil)&&(!q||(s.first+' '+s.last+' '+s.horse).toLowerCase().indexOf(q)>=0)});
   list.innerHTML=L.length?L.map(function(s){return '<button class="ce-li" data-a="pick" data-id="'+s.id+'" aria-selected="'+(s.id===ceSel)+'">'+U.av(s)+'<span style="min-width:0"><span class="b s ellip" style="display:block">'+s.first+' '+s.last+'</span><span class="xs mut ellip" style="display:block">'+s.horse+' · '+s.level+'</span></span>'+(s.todo?U.chip('Note à écrire','warn',true):'<span title="Avancement vers l’objectif">'+U.ring(s.pct,s.pct,'var(--acc)',34)+'</span>')+'</button>'}).join(''):U.empty('search','Aucun élève trouvé','Essayez un autre nom ou une autre écurie.')}
  function drawDet(){var s=stu(ceSel);det.innerHTML=stuDetail(s);P.animate(det)}
  function openSheet(){var s=stu(ceSel);var sh=P.sheet({title:s.first+' '+s.last,icon:'members',wide:true,body:function(b,sheet){function rd(){b.innerHTML=stuDetail(s,true)}rd();stuActions(sheet,function(){return s},rd)}})}
  bindTabs();drawList();drawDet();
  stuActions(det,function(){return stu(ceSel)},drawDet);
  el.querySelector('[data-q]').addEventListener('input',function(e){ceQ=e.target.value;drawList()});
  el.querySelectorAll('[data-f]').forEach(function(x){x.addEventListener('click',function(){ceFil=x.getAttribute('data-f');drawList()})});
  act(el,{pick:function(b){ceSel=b.getAttribute('data-id');drawList();if(narrow())openSheet();else drawDet()},
   inv:function(){var sh=P.sheet({title:'Inviter un élève',icon:'plus',body:'<div class="stack" style="--g:12px"><label class="field"><span>Prénom et nom</span><input class="in" value="Hugo Marchand"></label><label class="field"><span>Téléphone ou e-mail</span><input class="in" value="06 12 44 87 20"></label><p class="xs mut">Votre élève reçoit un lien vers votre page de réservation. Sa fiche, ses notes et ses vidéos se créent à son premier cours.</p></div>',foot:'<button class="btn pri" data-ok>Envoyer l’invitation</button>'});sh.querySelector('[data-ok]').onclick=function(){sh.close();P.toast('Invitation envoyée à Hugo Marchand par SMS')}}});
  if(openId&&narrow())setTimeout(openSheet,350);
 }});

/* =====================================================================
   VUE COACH · Disponibilités, tarifs, zones, règles, page publique
   ===================================================================== */
P.css(`
.cd{display:grid;grid-template-columns:minmax(0,1fr) 340px;gap:14px;align-items:start}
.cd-grid{display:grid;grid-template-columns:40px repeat(7,minmax(0,1fr));gap:4px;align-items:center}
.cd-grid .dh{font-size:11.500px;font-weight:600;color:var(--mut);text-align:center;padding-bottom:4px}
.cd-grid .dh b{display:block;font:700 15px var(--f-display);color:var(--ink)}
.cd-grid .hh{font-size:11px;color:var(--mut);font-variant-numeric:tabular-nums;text-align:right;padding-right:6px}
.cd-c{height:30px;border-radius:7px;background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);transition:background var(--t-2),box-shadow var(--t-2),transform var(--t-1);display:grid;place-items:center;color:var(--navy-ink)}
.cd-c:active{transform:scale(.94)}
.cd-c[data-s="open"]{background:var(--acc-pale);box-shadow:inset 0 0 0 1px var(--acc-line)}
.cd-c[data-s="busy"]{background:var(--navy);box-shadow:none}
.cd-c[data-s="busy"] svg.i{width:12px;height:12px}
.cd-c[data-s="off"]{background:repeating-linear-gradient(135deg,var(--surface-2) 0 5px,var(--line) 5px 6px);box-shadow:none;opacity:.8}
.cd-leg{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--mut)}
.cd-leg i{display:inline-block;width:12px;height:12px;border-radius:4px;margin-right:6px;vertical-align:-2px}
.cd-pr{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 16px;min-height:56px}
.cd-pr+.cd-pr{border-top:1px solid var(--line)}
.cd-pub{overflow:hidden}
.cd-pub .cov{height:64px;background:linear-gradient(120deg,color-mix(in srgb,var(--acc) 22%,black),color-mix(in srgb,var(--acc) 78%,black))}
.cd-pub .bd{padding:0 16px 16px;display:flex;flex-direction:column;gap:12px}
.cd-pub .av{margin-top:-28px;box-shadow:0 0 0 3px var(--surface)}
.cd-slots{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:6px}
.cd-slots button{height:44px;border-radius:var(--r-sm);font-size:12px;font-weight:600;line-height:1.2;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2);transition:background var(--t-2),box-shadow var(--t-2)}
.cd-slots button small{display:block;font-weight:500;color:var(--mut);font-size:11px}
.cd-slots button[aria-pressed="true"]{background:var(--acc-pale);box-shadow:inset 0 0 0 1.500px var(--acc)}
.cd-url{display:flex;align-items:center;gap:8px;padding:6px 6px 6px 12px;border-radius:var(--r-sm);background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);font:500 12px var(--f-mono);min-width:0}
.cd-url span{flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.cd-map text{font:600 9.500px var(--f-text);fill:var(--mut)}
@container main (min-width:861px){.cd-tabs [data-t="page"]{display:none}}
@container main (max-width:860px){.cd{grid-template-columns:minmax(0,1fr)}.cd-aside{display:none}}
@container main (max-width:520px){.cd-grid{grid-template-columns:30px repeat(7,minmax(0,1fr));gap:3px}.cd-c{height:32px}}
`);
var cdTab='sem',CD={grid:null,exc:[{d:'Ven. 20 nov.',t:'Matinée fermée, maréchal pour mes chevaux'},{d:'Dim. 22 nov.',t:'Concours de Rambouillet, journée bloquée'},{d:'Du 24 au 27 déc.',t:'Congés de fin d’année'}],
 prices:[['Cours particulier','60 min, un cavalier',55,'€'],['Cours en duo','60 min, par cavalier',35,'€'],['Cours collectif','3 à 5 cavaliers, par cavalier',25,'€'],['Coaching de concours','Reconnaissance, détente et débrief, par tour',30,'€'],['Travail du cheval','Je monte votre cheval, 45 min',40,'€'],['Stage d’une journée','Deux séances et analyse vidéo',90,'€']],
 radius:25,kmfee:0.5,cancel:'24',deposit:30,auto:true,delay:2,online:true,wait:true,visible:true};
function cdGrid(){if(CD.grid)return CD.grid;var g={};for(var d=0;d<7;d++)for(var h=8;h<20;h++){var o=d-1,st='closed';
  if(d<6&&h>=9&&h<19&&h!==13)st='open';if(d===5&&h>=13)st='closed';if(d===4&&h<13)st='off';if(d===6)st='off';
  LES.forEach(function(l){if(l.d===o&&l.type!=='Libre'){var s=hm(l.t),e=s+l.dur;if(h*60<e&&h*60+60>s)st='busy'}});
  g[d+'-'+h]=st}return CD.grid=g}
function publicCard(){var c=D.coach('c01'),g=cdGrid(),sl=[];for(var d=1;d<7&&sl.length<6;d++)for(var h=8;h<20&&sl.length<6;h++)if(g[d+'-'+h]==='open'&&(d>1||h>=14)&&(h===10||h===14||h===16))sl.push([d,h]);
 return '<div class="card cd-pub"><div class="cov"></div><div class="bd">'+U.av(c,'xl')+'<div><div class="hrow" style="--g:8px"><b class="l disp" style="font-size:19px">Pauline Arnaud</b>'+U.chip('Vérifiée','ok',true)+'</div><div class="s mut">Coach CSO · Pro 2 · se déplace dans un rayon de <span data-rad>'+CD.radius+'</span> km</div><div class="s" style="margin-top:6px">'+stars(4.9)+' <b>4,9</b> <span class="mut">· 128 avis</span></div></div>'+
  '<p class="s" style="color:var(--ink-2)">'+c.bio+' Analyse vidéo et note de séance après chaque cours.</p>'+
  '<div><div class="hrow sp" style="margin-bottom:8px"><b class="s">Prochains créneaux</b><span class="s mut">dès <b class="num" style="color:var(--ink)" data-p0>'+CD.prices[0][2]+' €</b></span></div><div class="cd-slots">'+sl.map(function(x,i){return '<button data-a="slot" aria-pressed="'+(i===0)+'">'+DWS[day(x[0]-1).getDay()]+' '+day(x[0]-1).getDate()+'<small>'+x[1]+' h</small></button>'}).join('')+'</div></div>'+
  '<button class="btn pri block" style="height:44px" data-a="try">Réserver ce créneau</button>'+
  '<p class="xs mut" style="text-align:center">Annulation gratuite jusqu’à <span data-cn>'+CD.cancel+'</span> h avant · acompte de <span data-dp>'+CD.deposit+'</span> %</p></div></div>'+
  '<div class="cd-url" style="margin-top:10px"><span>piaffe.app/coach/pauline-arnaud</span><button class="btn sm" data-a="copy">'+I('copy','sm')+'Copier</button></div>'}

P.mod({id:'coach-dispo',role:'coach',group:'Coaching',title:'Disponibilités',icon:'calendar_add',n:30,short:'Dispos',phoneTitle:'Disponibilités',
 render:function(el){var g=cdGrid();
  var nOpen=Object.keys(g).filter(function(k){return g[k]==='open'}).length;
  el.innerHTML=ph('Disponibilités et tarifs','<span data-sub>'+nOpen+'</span> créneaux ouverts à la réservation cette semaine · 3 écuries partenaires','<button class="btn" data-a="exc">'+I('holiday','sm')+'Bloquer une période</button>')+
   '<div class="cd"><div style="min-width:0"><div class="cd-tabs" style="margin-bottom:16px">'+U.tabs([['sem','Semaine type'],['tar','Tarifs'],['zon','Écuries et zones'],['reg','Règles'],['page','Page publique']],cdTab,'data-t')+'</div><div data-body></div></div>'+
   '<div class="cd-aside"><div class="hrow sp" style="margin-bottom:10px"><span class="eyebrow">Votre page publique</span><label class="hrow xs mut" style="--g:8px;cursor:pointer">Visible'+tg(CD.visible,'vis')+'</label></div><div data-pub>'+publicCard()+'</div></div></div>';
  var body=el.querySelector('[data-body]');
  function refreshPub(){el.querySelectorAll('[data-pub]').forEach(function(p){p.innerHTML=publicCard()})}
  function draw(){var s='';
   if(cdTab==='sem'){
    s+='<div class="card"><div class="ch"><div><h3>Semaine type</h3><div class="xs mut">Touchez une case pour ouvrir ou fermer une heure. Elle se répète chaque semaine.</div></div></div><div class="cb"><div class="cd-grid"><span></span>'+[1,2,3,4,5,6,0].map(function(w,i){return '<span class="dh">'+DWS[w]+'<b>'+day(i-1).getDate()+'</b></span>'}).join('')+
     [8,9,10,11,12,13,14,15,16,17,18,19].map(function(h){return '<span class="hh">'+h+' h</span>'+[0,1,2,3,4,5,6].map(function(d){var st=g[d+'-'+h];return '<button class="cd-c" data-a="cell" data-k="'+d+'-'+h+'" data-s="'+st+'" title="'+DWS[(d+1)%7]+' '+h+' h : '+({open:'ouvert à la réservation',busy:'cours réservé',off:'bloqué par une exception',closed:'fermé'})[st]+'">'+(st==='busy'?I('check'):'')+'</button>'}).join('')}).join('')+'</div>'+
     '<div class="cd-leg" style="margin-top:14px"><span><i style="background:var(--acc-pale);box-shadow:inset 0 0 0 1px var(--acc-line)"></i>Ouvert à la réservation</span><span><i style="background:var(--navy)"></i>Cours réservé</span><span><i style="background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line)"></i>Fermé</span><span><i style="background:repeating-linear-gradient(135deg,var(--surface-2) 0 3px,var(--line-2) 3px 4px)"></i>Exception</span></div></div></div>'+
     '<div class="card" style="margin-top:14px"><div class="ch" style="padding-bottom:8px"><h3>Exceptions</h3><button class="btn ghost sm" data-a="exc">'+I('plus','sm')+'Ajouter</button></div><div class="list">'+CD.exc.map(function(x,i){return '<div class="li">'+sq('holiday','warn')+'<div class="grow"><div class="t">'+x.d+'</div><div class="s">'+x.t+'</div></div><button class="btn ghost icon sm" data-a="excx" data-id="'+i+'" title="Supprimer cette exception">'+I('x','sm')+'</button></div>'}).join('')+'</div></div>'}
   if(cdTab==='tar'){
    s+='<div class="card"><div class="ch" style="padding-bottom:8px"><h3>Tarifs par type de cours</h3><span class="xs mut">Prix payé par le cavalier</span></div>'+CD.prices.map(function(p,i){return '<div class="cd-pr"><div style="min-width:0"><div class="b s">'+p[0]+'</div><div class="xs mut ellip">'+p[1]+'</div></div>'+stepper('p'+i,p[2],'€')+'</div>'}).join('')+'</div>'+
     '<div class="card" style="margin-top:14px"><div class="ch" style="padding-bottom:8px"><h3>Options</h3></div><div class="cb" style="padding-top:0">'+row('Carte de 10 cours, remise de 10 %',U.tog(true))+row('Frais de déplacement au-delà de 15 km',stepper('kmfee','0,5','€ / km'))+row('Majoration le dimanche',U.tog(false))+'</div></div>'+
     '<div class="note" style="margin-top:14px">'+I('info','sm')+'<span>Chaque écurie applique ses propres conditions (commission, forfait de passage ou droit de piste). Piaffe calcule votre net pour chaque cours dans Revenus.</span></div>'}
   if(cdTab==='zon'){
    s+='<div class="g3"><div class="card span2"><div class="ch" style="padding-bottom:8px"><h3>Écuries partenaires</h3><button class="btn ghost sm" data-a="askst">'+I('plus','sm')+'Demander un accès</button></div><div class="list">'+ST.map(function(x){return '<div class="li"><span class="av sq" style="--c:color-mix(in srgb,'+x.c+' 16%,var(--surface));color:'+x.c+'">'+I('stable')+'</span><div class="grow"><div class="t ellip">'+x.name+'</div><div class="s ellip">'+x.city+' · '+x.km+' km · '+x.deal+'</div></div>'+(x.on?U.chip('Accès validé','ok',true):U.chip('En attente','warn',true))+'</div>'}).join('')+'</div></div>'+
     '<div class="card"><div class="ch"><h3>Zone de déplacement</h3></div><div class="cb stack" style="--g:12px;align-items:center"><svg class="cd-map" viewBox="0 0 200 200" width="200" height="200" role="img" aria-label="Carte des écuries autour de chez vous"><circle cx="100" cy="100" r="92" fill="var(--acc-pale)" opacity=".5"/><circle cx="100" cy="100" r="92" fill="none" stroke="var(--acc-line)" stroke-dasharray="3 4"/><circle cx="100" cy="100" r="55" fill="none" stroke="var(--line-2)"/><circle cx="100" cy="100" r="18" fill="none" stroke="var(--line-2)"/><circle cx="100" cy="100" r="4" fill="var(--navy)"/><text x="100" y="118" text-anchor="middle">Chez vous</text>'+
      [[128,78,ST[0]],[52,70,ST[1]],[122,138,ST[2]],[60,150,ST[3]]].map(function(p){return '<circle cx="'+p[0]+'" cy="'+p[1]+'" r="6" fill="'+p[2].c+'"'+(p[2].on?'':' opacity=".45"')+'/><text x="'+p[0]+'" y="'+(p[1]-10)+'" text-anchor="middle">'+p[2].short+'</text>'}).join('')+'</svg>'+
      '<div class="hrow sp" style="width:100%"><span class="s mut">Rayon maximal</span>'+stepper('radius',CD.radius,'km')+'</div><p class="xs mut">Les cavaliers au-delà de ce rayon ne voient pas vos créneaux.</p></div></div></div>'}
   if(cdTab==='reg'){
    s+='<div class="card"><div class="ch" style="padding-bottom:8px"><h3>Annulation et paiement</h3></div><div class="cb" style="padding-top:0">'+row('Annulation gratuite jusqu’à',U.seg([['12','12 h'],['24','24 h'],['48','48 h']],CD.cancel,'data-cn2'))+row('Acompte à la réservation',stepper('deposit',CD.deposit,'%'))+row('Paiement en ligne obligatoire',tg(CD.online,'rtog','online'))+'</div></div>'+
     '<div class="card" style="margin-top:14px"><div class="ch" style="padding-bottom:8px"><h3>Réservation</h3></div><div class="cb" style="padding-top:0">'+row('Accepter automatiquement mes élèves connus',tg(CD.auto,'rtog','auto'))+row('Délai minimal avant un cours',stepper('delay',CD.delay,'h'))+row('Liste d’attente sur les créneaux pris',tg(CD.wait,'rtog','wait'))+'</div></div>'+
     '<div class="note" style="margin-top:14px">'+I('shield','sm')+'<span>En cas d’annulation tardive, l’acompte vous est versé automatiquement. Les règles d’une écurie plus strictes que les vôtres s’appliquent chez elle.</span></div>'}
   if(cdTab==='page'){s+='<div class="hrow sp" style="margin-bottom:10px"><span class="s mut">Ce que voient les cavaliers</span><label class="hrow xs mut" style="--g:8px;cursor:pointer">Visible dans l’annuaire'+tg(CD.visible,'vis')+'</label></div><div data-pub>'+publicCard()+'</div>'}
   body.innerHTML=s;P.animate(body);
   body.querySelectorAll('[data-step="deposit"]').forEach(function(x){x.setAttribute('data-inc',5)});body.querySelectorAll('[data-step="radius"]').forEach(function(x){x.setAttribute('data-inc',5)});
   body.querySelectorAll('[data-step^="p"]').forEach(function(x){x.setAttribute('data-inc',5)});
   body.querySelectorAll('[data-cn2]').forEach(function(x){x.addEventListener('click',function(){CD.cancel=x.getAttribute('data-cn2');refreshPub();P.toast('Annulation gratuite jusqu’à '+CD.cancel+' h avant le cours')})})}
  draw();
  el.querySelectorAll('[data-t]').forEach(function(t){t.addEventListener('click',function(){cdTab=t.getAttribute('data-t');draw()})});
  body.addEventListener('click',function(e){var b=e.target.closest('.fx-step button');if(!b)return;var w=b.parentNode,id=w.getAttribute('data-step'),sp=w.querySelector('[data-v]'),inc=id==='kmfee'?.1:(+(w.getAttribute('data-inc'))||1),v=Math.max(0,Math.round((parseFloat(sp.textContent.replace(',','.'))+(+b.getAttribute('data-d'))*inc)*10)/10);sp.textContent=String(v).replace('.',',');pulse(sp);
   if(/^p\d/.test(id))CD.prices[+id.slice(1)][2]=v;else CD[id]=v;refreshPub()});
  act(el,{cell:function(b){var k=b.getAttribute('data-k'),st=g[k];if(st==='busy'){P.toast('Un cours est déjà réservé sur cette heure',{icon:'lock',ms:1800});return}if(st==='off'){P.toast('Cette heure est bloquée par une exception',{icon:'holiday',ms:1800});return}
    g[k]=st==='open'?'closed':'open';b.setAttribute('data-s',g[k]);el.querySelector('[data-sub]').textContent=Object.keys(g).filter(function(x){return g[x]==='open'}).length;refreshPub()},
   exc:function(){var sh=P.sheet({title:'Bloquer une période',icon:'holiday',body:'<div class="stack" style="--g:12px"><div class="g2" style="--g:12px;grid-template-columns:1fr 1fr"><label class="field"><span>Du</span><input class="in" value="jeudi 3 décembre"></label><label class="field"><span>Au</span><input class="in" value="vendredi 4 décembre"></label></div><label class="field"><span>Motif, visible par vous seule</span><input class="in" data-m value="Formation continue à Lamotte-Beuvron"></label><div class="note warn">'+I('alert','sm')+'<span>2 cours sont déjà réservés sur cette période. Piaffe proposera un report à vos élèves.</span></div></div>',foot:'<button class="btn pri" data-ok>Bloquer ces deux jours</button>'});
    sh.querySelector('[data-ok]').onclick=function(){CD.exc.push({d:'Du 3 au 4 déc.',t:E(sh.querySelector('[data-m]').value)});sh.close();cdTab='sem';P.rerender();P.toast('Période bloquée, 2 élèves reçoivent une proposition de report')}},
   excx:function(b){var i=+b.getAttribute('data-id'),x=CD.exc.splice(i,1)[0];draw();P.toast('Exception supprimée, les créneaux sont rouverts',{undo:function(){CD.exc.splice(i,0,x);draw()}})},
   askst:function(){P.toast('Choisissez une écurie sur Piaffe : elle reçoit votre carte professionnelle et votre assurance',{icon:'stable'})},
   rtog:function(b){var k=b.getAttribute('data-id');CD[k]=!CD[k];P.toast('Réglage enregistré')},
   vis:function(){CD.visible=!CD.visible;P.toast(CD.visible?'Votre page est visible dans l’annuaire Piaffe':'Votre page n’est plus visible, le lien direct reste actif')},
   slot:function(b){b.parentNode.querySelectorAll('button').forEach(function(x){x.setAttribute('aria-pressed',x===b)})},
   'try':function(){P.toast('Aperçu : vos cavaliers réservent et paient en trois gestes',{icon:'eye'})},
   copy:function(b){b.innerHTML=I('check','sm')+'Copié';P.toast('Lien de votre page copié',{icon:'link'})}});
 }});

/* =====================================================================
   VUE COACH · Revenus
   ===================================================================== */
P.css(`
.cr-p{display:grid;grid-template-columns:64px minmax(0,1.4fr) minmax(0,1fr) 80px 80px 90px 120px;gap:12px;align-items:center;padding:11px 16px;min-height:52px}
.cr-p+.cr-p{border-top:1px solid var(--line)}
.cr-p .n{text-align:right;font-variant-numeric:tabular-nums}
.cr-ph{font-size:11.500px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--mut);min-height:0;padding-top:12px;padding-bottom:8px}
svg.chart rect.cr-bar{transform-box:fill-box;transform-origin:bottom;animation:grow .7s var(--e-out) both;animation-delay:calc(var(--i,0)*30ms)}
.cr-inv{font-size:12.500px;line-height:1.6;color:var(--ink-2)}
.cr-inv table{width:100%;border-collapse:collapse;margin:12px 0}
.cr-inv td{padding:7px 0;border-bottom:1px solid var(--line)}
.cr-inv td:last-child{text-align:right;font-variant-numeric:tabular-nums}
@container main (max-width:1080px){.cr-p{grid-template-columns:64px minmax(0,1.4fr) minmax(0,1fr) 90px 120px}.cr-p .x1{display:none}}
@container main (max-width:760px){.cr-p{grid-template-columns:minmax(0,1fr) auto;row-gap:2px}.cr-p .dt{display:none}.cr-p .x1,.cr-p .x2{display:none}.cr-ph{display:none}.cr-p .stt{grid-column:2;grid-row:2;justify-self:end}.cr-p .net{grid-column:2;grid-row:1}}
`);
var crTab='pay',CR={rate:25.6,
 pay:[{d:'17 nov.',who:'Camille Roche',st:'e2',how:'Carte en ligne',g:55,c:8,ok:true},{d:'16 nov.',who:'Victor Hamel',st:'e3',how:'Carte en ligne',g:55,c:0,ok:true},{d:'16 nov.',who:'Margaux Petitjean',st:'e3',how:'Carte en ligne',g:55,c:0,ok:true},{d:'16 nov.',who:'Clémence Aubry',st:'e2',how:'Virement',g:55,c:8,ok:true},{d:'13 nov.',who:'Léa Martin',st:'e1',how:'Reversé par l’écurie le 30',g:150,c:22.5,ok:false},{d:'13 nov.',who:D.name('m066'),st:'e1',how:'Reversé par l’écurie le 30',g:55,c:8.25,ok:false},{d:'12 nov.',who:'Équipe concours jeunes',st:'e3',how:'Carte en ligne',g:100,c:0,ok:true},{d:'10 nov.',who:'Léa Martin',st:'e1',how:'Reversé par l’écurie le 30',g:55,c:8.25,ok:false}],
 inv:[{id:'2026-047',who:'Écurie des Tilleuls',what:'Cours de novembre, 38 séances',amt:1776.5,st:'à émettre le 30'},{id:'2026-046',who:'Camille Roche',what:'Carte de 10 cours',amt:495,st:'payée'},{id:'2026-045',who:'Famille Petitjean',what:'Cours d’octobre et coaching de concours',amt:310,st:'payée'},{id:'2026-044',who:'Écurie des Tilleuls',what:'Cours d’octobre, 33 séances',amt:1512.25,st:'payée'},{id:'2026-043',who:'Victor Hamel',what:'Stage de la Toussaint',amt:180,st:'envoyée'}]};
function invoiceSheet(v){var sh=P.sheet({title:v?'Facture '+v.id:'Créer une facture',icon:'invoice',body:'<div class="card flat pad cr-inv"><div class="hrow sp" style="align-items:flex-start"><div><b style="color:var(--ink)">Pauline Arnaud</b><br>Entrepreneur individuel · coach d’équitation<br>SIRET 853 214 907 00018</div><div style="text-align:right"><b style="color:var(--ink)">Facture n° '+(v?v.id:'2026-048')+'</b><br>'+(v&&v.st==='payée'?'Acquittée':'Du 17 novembre 2026')+'</div></div>'+
   '<div style="margin-top:12px">Client : <b style="color:var(--ink)">'+(v?v.who:'Victor Hamel')+'</b></div><table><tr><td>'+(v?v.what:'4 cours particuliers de CSO, novembre')+'</td><td>'+F.eur(v?v.amt:220,v&&v.amt%1?1:0)+'</td></tr><tr><td><b style="color:var(--ink)">Total à payer</b></td><td><b style="color:var(--ink)">'+F.eur(v?v.amt:220,v&&v.amt%1?1:0)+'</b></td></tr></table>'+
   '<div class="xs mut">TVA non applicable, article 293 B du Code général des impôts. Paiement à 30 jours par virement ou carte. Numérotation continue et mentions obligatoires gérées par Piaffe.</div></div>',
   foot:v?'<button class="btn" data-dl>'+I('download','sm')+'Télécharger en PDF</button>'+(v.st==='payée'?'':'<button class="btn pri" data-ok>Envoyer au client</button>'):'<button class="btn pri" data-ok>Envoyer la facture</button>'});
 var d=sh.querySelector('[data-dl]');if(d)d.onclick=function(){P.toast('Facture '+v.id+' téléchargée en PDF',{icon:'download'})};
 var o=sh.querySelector('[data-ok]');if(o)o.onclick=function(){sh.close();if(v)v.st='envoyée';else CR.inv.unshift({id:'2026-048',who:'Victor Hamel',what:'4 cours particuliers de CSO, novembre',amt:220,st:'envoyée'});P.rerender();P.toast('Facture envoyée avec le lien de paiement en ligne')}}

P.mod({id:'coach-revenus',role:'coach',group:'Compte',title:'Revenus',icon:'wallet',n:10,short:'Revenus',
 render:function(el){
  var by=[['e1',2090,313.5],['e2',660,96],['e3',730,120]],ca=3480,fees=529.5,hist=[1820,2140,2310,2680,2950,3120,3390,3640,1480,3310,3105,3480];
  el.innerHTML=ph('Revenus','Novembre : '+F.eur(ca)+' de cours donnés, '+F.eur(1390)+' déjà sur votre compte','<button class="btn" data-a="exp">'+I('download','sm')+'Exporter</button><button class="btn pri" data-a="newinv">'+I('plus','sm')+'Créer une facture</button>')+
   stats([stat('Chiffre d’affaires de novembre',F.eur(ca),'+12 % par rapport à octobre',ca,'eur'),stat('Déjà reçu',F.eur(1390),'25 paiements en ligne',1390,'eur'),stat('À recevoir le 30 novembre',F.eur(1776.5,1),'reversement des Tilleuls'),stat('Net après frais d’écurie',F.eur(ca-fees,1),F.eur(fees,1)+' de commissions et pistes')])+
   '<div class="g3" style="margin-top:14px"><div class="card span2"><div class="ch"><div><h3>Chiffre d’affaires</h3><div class="xs mut">12 derniers mois</div></div><span class="s"><b class="num">'+F.eur(hist.reduce(function(a,b){return a+b}))+'</b> <span class="mut">sur un an</span></span></div><div class="cb">'+C.bars(hist,D.months,{h:P.isMobile()?300:262,hi:11,fmt:function(v){return (Math.round(v/100)/10+' k').replace('.',',')}}).replace('class="chart"','class="chart cr-ch"')+'</div></div>'+
   '<div class="card"><div class="ch"><h3>Par écurie</h3><span class="xs mut">Novembre</span></div><div class="cb hrow" style="--g:16px">'+C.donut(by.map(function(b){return {v:b[1],c:stb(b[0]).c}}),{size:118,w:14,center:'3,5 k'})+'<div class="stack grow" style="--g:10px">'+by.map(function(b){var s=stb(b[0]);return '<div><div class="hrow sp s"><span class="hrow" style="--g:6px"><i style="width:8px;height:8px;border-radius:2px;background:'+s.c+';flex:none"></i><span class="ellip">'+s.short+'</span></span><b class="num">'+F.eur(b[1])+'</b></div></div>'}).join('')+'</div></div><div class="cb stack" style="--g:10px;padding-top:0"><div class="hr"></div><div class="eyebrow">Par type de cours</div>'+[['Cours particuliers',2145],['Cours collectifs',885],['Coaching de concours',450]].map(function(t){return '<div><div class="hrow sp s" style="margin-bottom:5px"><span class="mut">'+t[0]+'</span><b class="num">'+F.eur(t[1])+'</b></div>'+U.bar(t[1]/2145*100)+'</div>'}).join('')+'</div></div></div>'+
   '<div class="fx-tabs">'+U.tabs([['pay','Paiements'],['inv','Factures'],['com','Frais d’écurie'],['dec','Déclaration']],crTab,'data-t')+'</div><div data-body></div>';
  var body=el.querySelector('[data-body]');
  function draw(){var s='';
   if(crTab==='pay')s+='<div class="card"><div class="cr-p cr-ph"><span>Date</span><span>Élève</span><span>Règlement</span><span class="n x1">Brut</span><span class="n x1">Frais</span><span class="n">Net</span><span>Statut</span></div>'+CR.pay.map(function(p){var st=stb(p.st);return '<div class="cr-p"><span class="s mut dt num">'+p.d+'</span><span style="min-width:0"><span class="b s ellip" style="display:block">'+p.who+'</span><span class="xs mut ellip" style="display:block"><span class="only-s">'+p.d+' · </span>'+st.short+'</span></span><span class="s mut ellip x2">'+p.how+'</span><span class="n s x1">'+F.eur(p.g)+'</span><span class="n s mut x1">'+(p.c?'−'+F.eur(p.c,p.c%1?1:0):'0 €')+'</span><span class="n s b net">'+F.eur(p.g-p.c,(p.g-p.c)%1?1:0)+'</span><span class="stt">'+U.chip(p.ok?'Reçu':'Attendu le 30',p.ok?'ok':'warn',true)+'</span></div>'}).join('')+'<div class="cf"><span class="xs mut">Les paiements en ligne arrivent sur votre compte sous 2 jours ouvrés. Les Tilleuls encaissent pour vous et reversent en fin de mois.</span></div></div>';
   if(crTab==='inv')s+='<div class="card list">'+CR.inv.map(function(v){return '<div class="li click" data-a="inv" data-id="'+v.id+'">'+sq('invoice',v.st==='payée'?'ok':'acc')+'<div class="grow"><div class="t ellip">'+v.who+'</div><div class="s ellip">N° '+v.id+' · '+v.what+'</div></div><div class="r"><b class="s num">'+F.eur(v.amt,v.amt%1?1:0)+'</b><span class="hide-s">'+U.chip(v.st,v.st==='payée'?'ok':v.st==='envoyée'?'acc':'',true)+'</span></div></div>'}).join('')+'</div><p class="xs mut" style="margin-top:12px">Piaffe numérote vos factures sans trou, ajoute votre SIRET et la mention de franchise de TVA, puis les envoie avec un lien de paiement.</p>';
   if(crTab==='com')s+='<div class="card list">'+by.map(function(b){var x=stb(b[0]);return '<div class="li"><span class="av sq" style="--c:color-mix(in srgb,'+x.c+' 16%,var(--surface));color:'+x.c+'">'+I('stable')+'</span><div class="grow"><div class="t">'+x.name+'</div><div class="s">'+x.deal+' · '+F.eur(b[1])+' de cours</div></div><div class="r"><b class="s num">−'+F.eur(b[2],b[2]%1?1:0)+'</b><span class="chip hide-s">'+Math.round(b[2]/b[1]*100)+' %</span></div></div>'}).join('')+'</div><div class="note" style="margin-top:14px">'+I('bulb','sm')+'<span>Au Bois Clair, le forfait de 120 € est amorti dès le neuvième cours du mois. Vous en donnez 13 : il vous revient à 9,20 € par cours.</span></div>';
   if(crTab==='dec'){var base=1390,cot=Math.round(base*CR.rate)/100,year=33725;
    s+='<div class="g2"><div class="card"><div class="ch"><h3>Déclaration de novembre</h3><span class="xs mut">Micro-entrepreneur</span></div><div class="cb" style="padding-top:8px">'+row('Recettes encaissées à ce jour','<span class="num">'+F.eur(base)+'</span>')+row('Attendu d’ici le 30 novembre','<span class="num">'+F.eur(1776.5,1)+'</span>')+row('Taux de cotisations que vous avez réglé',stepper('rate',String(CR.rate).replace('.',','),'%'))+row('Cotisations estimées à ce jour','<b class="num" data-cot>'+F.eur(cot,1)+'</b>')+'<div class="hrow wrap" style="--g:8px;margin-top:12px"><button class="btn" data-a="cp">'+I('copy','sm')+'Copier le montant à déclarer</button></div><p class="xs mut" style="margin-top:10px">Piaffe prépare le montant, la déclaration se fait sur le site de l’Urssaf. Vérifiez votre taux avec votre situation.</p></div></div>'+
     '<div class="card"><div class="ch"><h3>Plafond de la micro-entreprise</h3><span class="xs mut">Année 2026</span></div><div class="cb stack" style="--g:12px;padding-top:8px"><div class="hrow sp"><span class="disp num" style="font-size:26px;font-weight:700">'+F.eur(year)+'</span><span class="s mut">sur 77 700 €</span></div>'+U.bar(year/77700*100)+'<p class="s mut">Vous êtes à '+Math.round(year/777)+' % du plafond. Au rythme actuel, vous terminerez l’année autour de 37 500 €.</p><div class="hr"></div>'+row('Livre des recettes','<button class="btn sm" data-a="livre">'+I('download','sm')+'Télécharger</button>')+row('Export pour votre comptable','<button class="btn sm" data-a="exp">'+I('download','sm')+'Tableur</button>')+'</div></div></div>'}
   body.innerHTML=s;P.animate(body)}
  draw();
  el.querySelectorAll('[data-t]').forEach(function(t){t.addEventListener('click',function(){crTab=t.getAttribute('data-t');draw()})});
  body.addEventListener('click',function(e){var b=e.target.closest('.fx-step button');if(!b)return;var sp=b.parentNode.querySelector('[data-v]');CR.rate=Math.max(0,Math.round((parseFloat(sp.textContent.replace(',','.'))+(+b.getAttribute('data-d'))*.1)*10)/10);sp.textContent=String(CR.rate).replace('.',',');var c=body.querySelector('[data-cot]');c.textContent=F.eur(Math.round(1390*CR.rate)/100,1);pulse(c)});
  act(el,{exp:function(){P.toast('Recettes de novembre exportées au format tableur',{icon:'download'})},newinv:function(){invoiceSheet(null)},
   inv:function(b){invoiceSheet(CR.inv.find(function(v){return v.id===b.getAttribute('data-id')}))},
   cp:function(b){b.innerHTML=I('check','sm')+'Montant copié';P.toast('1 390 € copiés, à reporter sur le site de l’Urssaf',{icon:'copy'})},
   livre:function(){P.toast('Livre des recettes 2026 téléchargé',{icon:'download'})}});
 }});

/* =====================================================================
   VUE COACH · Concours
   ===================================================================== */
P.css(`
.cc{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:14px;align-items:start}
.cc-r{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 16px}
.cc-r+.cc-r{border-top:1px solid var(--line)}
.cc-t{display:grid;grid-template-columns:50px 12px minmax(0,1fr);gap:10px;align-items:start;padding:0 16px;position:relative}
.cc-t .tm{font:600 13px var(--f-text);font-variant-numeric:tabular-nums;padding-top:9px}
.cc-t .dotc{position:relative;align-self:stretch}
.cc-t .dotc::before{content:"";position:absolute;left:5px;top:0;bottom:0;width:2px;background:var(--line)}
.cc-t .dotc::after{content:"";position:absolute;left:1px;top:13px;width:10px;height:10px;border-radius:50%;background:var(--surface);box-shadow:inset 0 0 0 2.500px var(--c,var(--mut-2))}
.cc-t:first-child .dotc::before{top:14px}.cc-t:last-child .dotc::before{bottom:calc(100% - 14px)}
.cc-t .bx{padding:8px 0 10px}
.cc-t.pass .bx{padding:8px 12px 10px;margin:2px 0 6px;border-radius:var(--r-md);background:var(--acc-pale)}
.cc-t.clash .bx{padding:8px 12px 10px;margin:2px 0 6px;border-radius:var(--r-md);background:var(--warn-pale)}
@container main (max-width:1080px){.cc{grid-template-columns:minmax(0,1fr)}}
`);
var ccSel='x1',CC={x1:{id:'x1',name:'CSO Club et Poney',place:'Rambouillet, Bergerie nationale',date:iso(day(5)),sent:false,
  riders:(function(){var f=(D.facts&&D.facts.leaRambouillet)||{passage:'11:42',order:'14e sur 32',bib:214,recon:'11:10',warmup:'11:20',paddock:'B',classe:'Club Élite · 115 cm'},o=String(f.order).match(/(\d+)\D+(\d+)/)||[0,14,32];
   return [{s:'s7',cls:'Poney 1 · 95 cm',ring:'Piste 2',pad:'A',no:12,of:31,bib:131,pass:10*60+24,warm:10*60,recon:9*60+35},
    {s:'s1',cls:f.classe,ring:'Grande piste',pad:f.paddock,no:+o[1],of:+o[2],bib:f.bib,pass:hm(f.passage),warm:hm(f.warmup),recon:hm(f.recon),fact:true},
    {s:'s6',cls:f.classe,ring:'Grande piste',pad:f.paddock,no:26,of:+o[2],bib:226,pass:hm(f.passage)+20,warm:hm(f.warmup)+20,recon:hm(f.recon)}]})()},
 x2:{id:'x2',name:'CSO Amateur et Pro',place:'Fontainebleau, Grand Parquet',date:'2026-12-19',sent:false,riders:[{s:'s5',cls:'Amateur 1 Grand Prix · 125 cm',ring:'Piste d’honneur',no:0,of:0,pass:14*60+30,warm:14*60},{s:'s1',cls:'Amateur 2 · 115 cm',ring:'Piste 2',no:0,of:0,pass:11*60,warm:10*60+35}],draft:true},
 x0:{id:'x0',name:'CSO Amateur',place:'Chantilly, Grand Parquet',date:iso(day(-4)),done:true,
  res:[{s:'s1',cls:'Amateur 2 Grand Prix · 115 cm',rank:3,of:52,clear:true,note:'Barrage rapide, option courte réussie sur le 4.'},{s:'s2',cls:'Amateur 2 · 110 cm',rank:14,of:52,clear:true,note:'Sans-faute mais trois secondes perdues dans les tournants.'},{s:'s3',cls:'Amateur 2 · 110 cm',rank:21,of:52,pts:4,note:'Une barre sur l’oxer d’entrée de ligne, abord trop long.'}]}};
P.mod({id:'coach-concours',role:'coach',group:'Coaching',title:'Concours',icon:'compet',n:40,
 badge:function(){return {v:'J-5'}},
 render:function(el){
  var rx=CC.x1.riders,lea=rx.find(function(r){return r.s==='s1'});
  el.innerHTML=ph('Concours','Dimanche à Rambouillet : '+rx.length+' cavaliers, premier passage à '+th(Math.min.apply(null,rx.map(function(r){return r.pass})))+', Léa et Ulysse à '+th(lea.pass),'<button class="btn" data-a="imp">'+I('upload','sm')+'Importer une liste de départ</button>')+
   '<div class="cp-strip scroll-x" data-strip></div><div data-body style="margin-top:14px"></div>';
  var strip=el.querySelector('[data-strip]'),body=el.querySelector('[data-body]'),MO=['janv','févr','mars','avr','mai','juin','juil','août','sept','oct','nov','déc'];
  function drawStrip(){strip.innerHTML=['x0','x1','x2'].map(function(k){var x=CC[k],d=new Date(x.date+'T12:00:00');return '<button class="cp-k" data-a="sel" data-id="'+k+'" aria-selected="'+(k===ccSel)+'"><span class="fx-date"><span>'+MO[d.getMonth()]+'</span><b>'+d.getDate()+'</b></span><span style="min-width:0;display:flex;flex-direction:column;gap:5px"><span class="nm">'+x.name+'</span><span class="xs mut ellip">'+x.place.split(',')[0]+'</span><span>'+(x.done?U.chip('Terminé · 2 sans-faute',''):U.chip((x.riders.length)+' cavaliers'+(x.draft?' · horaires à venir':''),x.draft?'':'acc',true))+'</span></span></button>'}).join('')}
  function draw(){var x=CC[ccSel],s='';
   if(x.done){s+='<div class="cc"><div class="card"><div class="ch" style="padding-bottom:8px"><h3>Résultats de vos cavaliers</h3><span class="xs mut">'+F.dateL(x.date)+'</span></div>'+x.res.map(function(r){var st=stu(r.s);return '<div class="cc-r" style="align-items:flex-start">'+U.av(st)+'<div style="min-width:0"><div class="b s">'+st.first+' '+st.last+' <span class="mut" style="font-weight:500">· '+st.horse+'</span></div><div class="xs mut">'+r.cls+' · '+r.rank+'e sur '+r.of+'</div><p class="s" style="margin-top:6px;color:var(--ink-2)">'+r.note+'</p></div>'+(r.clear?'<span class="chip acc"><span class="strass" style="width:8px;height:8px"></span>Sans-faute</span>':'<span class="chip">'+r.pts+' points</span>')+'</div>'}).join('')+'<div class="cf hrow sp wrap"><span class="xs mut">Vos commentaires sont ajoutés à la fiche de chaque élève.</span><button class="btn sm" data-a="bilan">'+I('send','sm')+'Envoyer le bilan aux cavaliers</button></div></div>'+
     '<div class="card pad stack" style="--g:12px"><div class="hrow" style="--g:10px"><span class="strass"></span><b>Un week-end réussi</b></div><p class="s mut">Deux sans-faute sur trois parcours et un podium pour Léa et Ulysse. Depuis septembre, vos cavaliers bouclent 58 % de leurs tours sans pénalité, contre 41 % la saison dernière.</p>'+row('Coaching facturé','<span class="num">'+F.eur(150)+'</span>')+row('Tours coachés','5')+'</div></div>'}
   else{var ev=[],rc={};x.riders.forEach(function(r){var k=r.cls.split(' · ')[0];(rc[k]=rc[k]||{t:r.recon!=null?r.recon:r.warm-30,ring:r.ring,who:[]}).who.push(stu(r.s).first)});
    var t0=Math.min.apply(null,Object.keys(rc).map(function(k){return rc[k].t}));ev.push({t:t0-45,k:'Arrivée et repérage des pistes',d:x.place.split(',')[0]+', parking des coachs'});
    Object.keys(rc).forEach(function(k){var w=rc[k].who;ev.push({t:rc[k].t,k:'Reconnaissance '+k,d:rc[k].ring+', avec '+(w.length>1?w.slice(0,-1).join(', ')+' et '+w[w.length-1]:w[0])})});
    x.riders.forEach(function(r){var st=stu(r.s);ev.push({t:r.warm,k:'Détente de '+st.first,d:'Paddock '+(r.pad||r.ring.slice(-1))+' · '+(r.pass-r.warm)+' min avant le passage',r:r,warm:true});ev.push({t:r.pass,k:st.first+' entre en piste',d:r.cls+' · '+r.ring+(r.bib?' · dossard '+r.bib:'')+(r.no?' · '+r.no+'e sur '+r.of:''),pass:true,c:'var(--acc)'})});
    ev.sort(function(a,b){return a.t-b.t});
    var clash=null;x.riders.forEach(function(a){x.riders.forEach(function(b){if(a!==b&&a.warm>b.warm&&a.warm<b.pass+2&&a.ring!==b.ring&&!clash)clash=[b,a]})});
    s+='<div class="cc"><div class="stack" style="--g:14px">'+(x.draft?'<div class="note">'+I('info','sm')+'<span>Les listes de départ de Fontainebleau paraissent la veille. Importez le fichier de FFE Compet et votre journée se construit toute seule.</span></div>':clash?'<div class="note warn" style="align-items:center;flex-wrap:wrap">'+I('alert','sm')+'<span class="grow" style="flex-basis:220px">'+stu(clash[1].s).first+' commence sa détente sur une autre piste pendant que '+stu(clash[0].s).first+' passe. Avancez-la de 10 minutes pour voir les deux.</span><button class="btn sm" data-a="fix">Avancer la détente</button></div>':'<div class="note ok">'+I('checkc','sm')+'<span>Aucun chevauchement : vous serez au paddock pour chaque détente et au bord de la piste pour chaque passage.</span></div>')+
     '<div class="card"><div class="ch" style="padding-bottom:8px"><h3>Vos cavaliers engagés</h3><span class="xs mut">'+(x.draft?'Horaires estimés':'Ordres de passage du '+F.date(x.date))+'</span></div>'+x.riders.map(function(r,i){var st=stu(r.s);return '<div class="cc-r">'+U.av(st)+'<div style="min-width:0"><div class="b s ellip">'+st.first+' '+st.last+' <span class="mut" style="font-weight:500">· '+st.horse+'</span></div><div class="xs mut ellip">'+r.cls+' · '+r.ring+(r.bib?' · dossard '+r.bib:'')+(r.no?' · '+r.no+'e sur '+r.of:'')+' · passage à '+th(r.pass)+'</div></div><div class="qq-leave" title="Heure de détente"><button data-a="wm" data-i="'+i+'" data-d="-5" title="Avancer la détente de 5 minutes">'+I('minus','sm')+'</button><b>'+tc(r.warm)+'</b><button data-a="wm" data-i="'+i+'" data-d="5" title="Reculer la détente de 5 minutes">'+I('plus','sm')+'</button></div></div>'}).join('')+
      '<div class="cf hrow sp wrap"><span class="xs mut">L’heure à droite est celle de la détente. Chaque cavalier reçoit la sienne.</span><button class="btn sm dark" data-a="send">'+(x.sent?I('check','sm')+'Horaires envoyés':I('send','sm')+'Envoyer les horaires')+'</button></div></div>'+
     '<div class="card"><div class="ch" style="padding-bottom:8px"><h3>Avant le départ</h3></div><div class="cb" style="padding-top:0">'+[['Tours du parcours regardés en vidéo avec Léa',true],['Crampons et guêtres vérifiés pour Victor',false],['Autorisation parentale de Margaux reçue',true]].map(function(c){return '<label class="ce-goal fx-click">'+U.chk(c[1])+'<span class="s grow">'+c[0]+'</span></label>'}).join('')+'</div></div></div>'+
     '<div class="card"><div class="ch" style="padding-bottom:10px"><h3>Ma journée de concours</h3><span class="xs mut">'+F.dateL(x.date)+'</span></div><div style="padding-bottom:12px">'+ev.map(function(e){var cl=clash&&e.r===clash[1];return '<div class="cc-t'+(e.pass?' pass':'')+(cl?' clash':'')+'" style="--c:'+(cl?'var(--warn)':e.c||'var(--mut-2)')+'"><span class="tm">'+tc(e.t)+'</span><span class="dotc"></span><div class="bx"><div class="b s">'+e.k+'</div><div class="xs mut">'+e.d+'</div></div></div>'}).join('')+'</div><div class="cf"><button class="btn block" data-a="cal">'+I('calendar_add','sm')+'Ajouter à mon agenda</button></div></div></div>'}
   body.innerHTML=s;P.animate(body)}
  drawStrip();draw();
  act(el,{sel:function(b){ccSel=b.getAttribute('data-id');drawStrip();draw()},
   wm:function(b){var r=CC[ccSel].riders[+b.getAttribute('data-i')];r.warm=Math.min(r.pass-10,r.warm+(+b.getAttribute('data-d')));draw()},
   fix:function(){var x=CC[ccSel];x.riders.forEach(function(a){x.riders.forEach(function(b){if(a!==b&&a.warm>b.warm&&a.warm<b.pass+2&&a.ring!==b.ring)a.warm=b.warm-5<a.warm?a.warm+ (b.pass+5-a.warm):a.warm})});draw();P.toast('Détente décalée, le planning ne se chevauche plus')},
   send:function(){var x=CC[ccSel];x.sent=true;draw();P.toast('Horaires de détente et de passage envoyés aux '+x.riders.length+' cavaliers',{icon:'send'})},
   cal:function(b){b.innerHTML=I('check','sm')+'Journée ajoutée à l’agenda';P.toast('Journée de concours ajoutée, vos créneaux du dimanche sont fermés')},
   bilan:function(b){b.innerHTML=I('check','sm')+'Bilan envoyé';P.toast('Bilan du concours envoyé à Léa, Louise et Emma')},
   imp:function(){P.toast('Déposez le fichier exporté de FFE Compet : Piaffe y retrouve vos cavaliers',{icon:'upload'})}});
 }});

/* =====================================================================
   VUE COACH · Profil
   ===================================================================== */
P.css(`
.pf{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:start}
.pf-hero{overflow:hidden}
.pf-hero .cov{height:84px;background:linear-gradient(120deg,color-mix(in srgb,var(--acc) 22%,black),color-mix(in srgb,var(--acc) 78%,black))}
.pf-hero .bd{padding:0 18px 18px}
.pf-hero .av{margin-top:-32px;box-shadow:0 0 0 4px var(--surface)}
@container main (max-width:860px){.pf{grid-template-columns:minmax(0,1fr)}}
`);
var PF={bio:D.coach('c01').bio+' Diplômée DEJEPS, j’accompagne les couples de la première épreuve Club jusqu’à l’Amateur Élite, à domicile et en concours.',spec:{CSO:true,'Coaching de concours':true,'Jeunes chevaux':true,Hunter:false,'Travail sur le plat':true,Enfants:false},
 docs:[['medal','DEJEPS mention CSO','Obtenu en 2017 · vérifié par Piaffe','ok','Vérifié'],['shield','Carte professionnelle n° 07826ED0142','Valable jusqu’au 30 juin 2029','ok','Contrôlée'],['doc','Assurance RC professionnelle','Generali Équi-Pro · valable jusqu’au 14 mars 2027','ok','Valide'],['heart','Premiers secours (PSC1)','Recyclage conseillé avant mars 2027','warn','À renouveler']],
 set:{resa:true,veille:true,sms:false,avis:true}};
/* ---------- Mes chevaux (déclaration) et parcours d'arrivée du coach ---------- */
P.css(`
.pf-ok{display:flex;align-items:center;gap:14px;padding:14px 16px;flex-wrap:wrap}
.pf-ok .grow{min-width:180px}
.pf-hr{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 16px}
.pf-hr+.pf-hr{border-top:1px solid var(--line)}
.pf-ifce{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 16px;padding:14px;border-radius:var(--r-md);background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line)}
.pf-ifce span{display:block;font-size:11.500px;color:var(--mut)}
.pf-ifce b{display:block;font-size:13.500px}
.pf-opt{display:flex;align-items:center;gap:12px;width:100%;padding:11px 12px;border-radius:var(--r-md);text-align:left;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2);transition:background var(--t-2),box-shadow var(--t-2)}
.pf-opt+.pf-opt{margin-top:8px}
.pf-opt[aria-pressed="true"]{background:var(--acc-pale);box-shadow:inset 0 0 0 1.500px var(--acc)}
.pf-opt .rd{width:18px;height:18px;border-radius:50%;flex:none;box-shadow:inset 0 0 0 1.500px var(--line-2)}
.pf-opt[aria-pressed="true"] .rd{box-shadow:inset 0 0 0 5px var(--acc)}
.pf-st{position:relative;display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;margin:-2px;padding:2px 2px 14px}
.pf-st button{flex:none;display:flex;align-items:center;gap:6px;height:32px;padding:0 10px 0 4px;border-radius:16px;font-size:12px;font-weight:600;color:var(--mut);background:var(--surface-2)}
.pf-st button b{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;font-size:11.500px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2)}
.pf-st button b svg.i{width:12px;height:12px}
.pf-st button.ok b{background:var(--ok-pale);color:var(--ok);box-shadow:none}
.pf-st button[aria-selected="true"]{background:var(--acc-pale);color:var(--ink)}
.pf-st button[aria-selected="true"] b{background:var(--acc);color:var(--acc-ink);box-shadow:none}
.pf-wk{display:grid;grid-template-columns:70px repeat(3,minmax(0,1fr));gap:6px;align-items:center}
.pf-wk .tag{height:36px;justify-content:center;width:100%}
.pf-done{display:flex;flex-direction:column;align-items:center;gap:12px;text-align:center;padding:12px 0}
`);
PF.horses=[];PF.onb={step:0,done:{},wk:null,iban:'FR76 3000 4000 0312 3456 7894 521',code:false,ask:false,live:true};
function myHorses(){return D.declarations.filter(function(x){return x.by==='c01'}).map(function(x){return {d:x,st:'e1'}}).concat(PF.horses)}
function stayTxt(h){var s=stb(h.st);return h.d.stay==='pension'?'Demande de box en pension · '+s.short:'De passage pour mes cours · '+s.short}
function horsesCard(){var L=myHorses();
 return '<div class="card"><div class="ch" style="padding-bottom:8px"><h3>Mes chevaux</h3><button class="btn sm" data-a="hdecl">'+I('plus','sm')+'Déclarer un cheval</button></div>'+
  (L.length?L.map(function(h){var x=h.d,wait=x.status==='en attente';return '<div class="pf-hr">'+sq('horse',wait?'warn':'ok')+'<div style="min-width:0"><div class="b s ellip">'+x.name+'</div><div class="xs mut ellip">'+x.breed+' · '+x.coat.toLowerCase()+' · '+x.born+' · SIRE '+x.sire+'</div><div class="xs mut ellip">'+stayTxt(h)+'</div></div>'+U.chip(wait?'En attente de validation':'Validé',wait?'warn':'ok',true)+'</div>'}).join(''):'<div class="cb">'+U.empty('horse','Aucun cheval déclaré','Déclarez vos chevaux pour les monter dans les écuries partenaires.')+'</div>')+
  '<div class="cf"><span class="xs mut">L’écurie d’accueil valide la déclaration : le cheval apparaît alors dans son registre et sur son planning.</span></div></div>'}
function declSheet(){var q='',found=null,st='e1',stay='passage';
 var sh=P.sheet({title:'Déclarer un cheval',icon:'horse',body:function(b,sheet){
  function draw(){var f=sheet.querySelector('.sf');
   b.innerHTML='<p class="s mut" style="margin-bottom:12px">Saisissez le numéro SIRE ou le nom du cheval. Piaffe remplit la fiche depuis le fichier de l’IFCE.</p><div class="hrow" style="--g:8px"><input class="in grow" data-q placeholder="Numéro SIRE ou nom du cheval" value="'+E(q)+'"><button class="btn" data-a="find">'+I('search','sm')+'Rechercher</button></div>'+
    (found?'<div style="margin-top:14px"><div class="hrow" style="--g:8px;margin-bottom:8px">'+U.chip('Trouvé dans le fichier SIRE','ok',true)+'</div><div class="pf-ifce">'+[['Nom',found.name],['Race',found.breed],['Robe',found.coat],['Année de naissance',found.born],['SIRE',found.sire],['Puce',found.chip]].map(function(r){return '<div style="min-width:0"><span>'+r[0]+'</span><b class="ellip">'+r[1]+'</b></div>'}).join('')+'</div>'+
     sec('Écurie d’accueil')+ST.map(function(s){return '<button class="pf-opt" data-a="stb" data-id="'+s.id+'" aria-pressed="'+(st===s.id)+'"><span class="rd"></span><span class="grow" style="min-width:0"><b class="s" style="display:block">'+s.name+'</b><span class="xs mut">'+(s.on?s.city+' · écurie partenaire':'Demande d’accueil en cours')+'</span></span></button>'}).join('')+
     sec('Hébergement')+[['passage','De passage pour mes cours','Le cheval vient en van, sans box'],['pension','En pension','Demande de box transmise à l’écurie']].map(function(o){return '<button class="pf-opt" data-a="sty" data-id="'+o[0]+'" aria-pressed="'+(stay===o[0])+'"><span class="rd"></span><span class="grow"><b class="s" style="display:block">'+o[1]+'</b><span class="xs mut">'+o[2]+'</span></span></button>'}).join('')+'</div>':'');
   var inp=b.querySelector('[data-q]');inp.addEventListener('input',function(){q=inp.value});inp.addEventListener('keydown',function(e){if(e.key==='Enter')find()});
   f.innerHTML=found?'<button class="btn" data-a="cancel">Annuler</button><button class="btn pri" data-a="send">'+I('send','sm')+'Envoyer la déclaration</button>':'<button class="btn" data-a="cancel">Annuler</button>'}
  function find(){var v=q.trim(),sire=/\d{5,}/.test(v);
   found={name:v&&!sire?v.charAt(0).toUpperCase()+v.slice(1):'Nuage de Bullion',breed:'Selle Français',coat:'Gris',born:2016,sire:sire?v.toUpperCase():'25012477M',chip:'250259600512477'};
   if(myHorses().some(function(h){return h.d.sire===found.sire||h.d.name===found.name})){P.toast(found.name+' est déjà déclaré',{icon:'info'});found=null;return}
   draw();P.toast('Fiche préremplie depuis l’IFCE',{icon:'checkc',ms:1600})}
  draw();
  act(sheet,{find:find,cancel:function(){sheet.close()},
   stb:function(x){st=x.getAttribute('data-id');draw()},sty:function(x){stay=x.getAttribute('data-id');draw()},
   send:function(){var s=stb(st),dc={id:'dc'+(D.declarations.length+1)+'c',by:'c01',link:'Propriétaire (coach)',name:found.name,sire:found.sire,breed:found.breed,coat:found.coat,born:found.born,chip:found.chip,stay:stay,box:null,when:'À l’instant',status:'en attente'};
    if(st==='e1')D.declarations.push(dc);else PF.horses.push({d:dc,st:st});
    sheet.close();P.rerender();P.toast(st==='e1'?'Déclaration envoyée à '+D.staffer('s01').first:'Déclaration envoyée à '+s.name,{icon:'send'})}});
 },foot:' '})}
var ONB=[['shield','Diplômes et assurance'],['planning','Semaine type'],['euro','Tarifs'],['bank','Compte de versement'],['stable','Accueil en écurie'],['globe','Page publique']];
function onbSheet(){var o=PF.onb;o.step=0;o.final=false;
 if(!o.wk){o.wk={};['Lun','Mar','Mer','Jeu','Ven','Sam'].forEach(function(d,i){o.wk[d]=[i<5,i<5,i===1||i===3]})}
 var sh=P.sheet({title:'Mon arrivée sur Piaffe',icon:'onboarding',wide:true,body:function(b,sheet){
  function draw(){var f=sheet.querySelector('.sf'),k=o.step,n=Object.keys(o.done).length,s='';
   s+='<div class="hrow" style="--g:12px;margin-bottom:12px"><div class="grow">'+U.bar(n/ONB.length*100,n===ONB.length?'var(--ok)':null)+'</div><span class="s b num">'+n+' / '+ONB.length+'</span></div>';
   s+='<div class="pf-st">'+ONB.map(function(x,i){return '<button class="'+(o.done[i]?'ok':'')+'" data-a="go" data-i="'+i+'" aria-selected="'+(i===k&&!o.final)+'"><b>'+(o.done[i]?I('check','sm'):i+1)+'</b>'+x[1]+'</button>'}).join('')+'</div>';
   if(o.final){s+='<div class="pf-done"><span class="strass" style="width:24px;height:24px"></span><h3 style="font-size:22px">Votre profil est complet</h3><p class="s mut" style="max-width:420px">Les adhérents de vos écuries partenaires vous trouvent et réservent en ligne. Les paiements arrivent sur votre compte sous 2 jours ouvrés.</p><div class="cd-url" style="width:100%;max-width:360px"><span>piaffe.app/coach/pauline-arnaud</span></div></div>';f.innerHTML='<button class="btn pri" data-a="close">Terminé</button>';b.innerHTML=s;P.animate(b);return}
   s+='<h3 style="font-size:18px;margin-bottom:4px">'+(k+1)+'. '+ONB[k][1]+'</h3>';
   if(k===0)s+='<p class="s mut" style="margin-bottom:12px">Piaffe contrôle vos pièces auprès des organismes, une seule fois. Les écuries qui vous accueillent les voient sans vous les redemander.</p><div class="card flat list">'+PF.docs.slice(0,3).map(function(d){return '<div class="li">'+sq(d[0],o.done[0]?'ok':'acc')+'<div class="grow"><div class="t ellip">'+d[1]+'</div><div class="s ellip">'+d[2]+'</div></div>'+(o.done[0]?U.chip(d[4],'ok',true):U.chip('Reçu','',true))+'</div>'}).join('')+'</div>';
   if(k===1)s+='<p class="s mut" style="margin-bottom:12px">Touchez les demi-journées où vous enseignez. Piaffe en tire vos créneaux réservables, sans chevaucher vos cours.</p><div class="pf-wk"><span></span><b class="xs mut" style="text-align:center">Matin</b><b class="xs mut" style="text-align:center">Après-midi</b><b class="xs mut" style="text-align:center">Soir</b>'+Object.keys(o.wk).map(function(d){return '<b class="s">'+d+'</b>'+o.wk[d].map(function(on,j){return '<button class="tag" data-a="wk" data-d="'+d+'" data-j="'+j+'" aria-pressed="'+on+'">'+(on?'Ouvert':'Fermé')+'</button>'}).join('')}).join('')+'</div>';
   if(k===2)s+='<p class="s mut" style="margin-bottom:12px">Vos tarifs s’affichent sur votre page publique et dans l’application des adhérents.</p><div class="card flat">'+CD.prices.slice(0,4).map(function(p,i){return '<div class="cd-pr"><div style="min-width:0"><div class="b s ellip">'+p[0]+'</div><div class="xs mut ellip">'+p[1]+'</div></div>'+stepper('op'+i,p[2],'€')+'</div>'}).join('')+'</div>';
   if(k===3)s+='<p class="s mut" style="margin-bottom:12px">Les paiements en ligne de vos élèves et les reversements des écuries arrivent sur ce compte.</p><label class="field"><span>Titulaire</span><input class="in" value="Pauline Arnaud EI"></label><label class="field" style="margin-top:10px"><span>IBAN</span><input class="in mono" value="'+o.iban+'"></label>'+(o.code?'<div class="note ok" style="margin-top:12px">'+I('checkc','sm')+'<span>Code 4 8 1 2 reçu au 06 •• •• •• 42 et vérifié.</span></div>':'<button class="btn" style="margin-top:12px" data-a="code">'+I('lock','sm')+'Recevoir le code de confirmation</button>');
   if(k===4)s+='<p class="s mut" style="margin-bottom:12px">Vous enseignez dans une écurie quand elle vous accueille. Chacune fixe ses conditions : commission, droit de piste ou forfait.</p><div class="card flat list">'+ST.map(function(x){return '<div class="li"><span class="av sq" style="--c:color-mix(in srgb,'+x.c+' 16%,var(--surface));color:'+x.c+'">'+I('stable')+'</span><div class="grow"><div class="t ellip">'+x.name+'</div><div class="s ellip">'+x.deal+'</div></div>'+(x.on?U.chip('Partenaire','ok',true):o.ask?U.chip('Relancée','acc',true):'<button class="btn sm" data-a="ask">Relancer</button>')+'</div>'}).join('')+'</div>';
   if(k===5)s+='<p class="s mut" style="margin-bottom:12px">Voici votre page telle que la voient les cavaliers. Mettez-la en ligne quand elle vous plaît.</p><div style="max-width:380px;pointer-events:none">'+publicCard()+'</div>';
   b.innerHTML=s;P.animate(b);var sc=b.querySelector('.pf-st'),sa=sc&&sc.querySelector('[aria-selected="true"]');if(sa)sc.scrollLeft=sa.offsetLeft-sc.clientWidth/2+sa.offsetWidth/2;
   f.innerHTML=(k>0?'<button class="btn" data-a="prev">Retour</button>':'')+'<button class="btn pri" data-a="ok">'+(k===0?(o.done[0]?'Continuer':'Lancer la vérification'):k===5?'Mettre ma page en ligne':'Valider cette étape')+'</button>'}
  var MSG=['Diplômes, carte professionnelle et assurance vérifiés','Semaine type enregistrée','Tarifs publiés','Compte de versement vérifié','Demandes d’accueil à jour','Votre page publique est en ligne'];
  function next(){o.done[o.step]=true;P.toast(MSG[o.step],{icon:'checkc',ms:1800});if(Object.keys(o.done).length===ONB.length&&o.step===ONB.length-1){o.final=true}else{for(var i=1;i<=ONB.length;i++){var j=(o.step+i)%ONB.length;if(!o.done[j]){o.step=j;break}}if(Object.keys(o.done).length===ONB.length)o.final=true}draw()}
  draw();
  act(sheet,{go:function(x){o.final=false;o.step=+x.getAttribute('data-i');draw()},prev:function(){o.step=Math.max(0,o.step-1);draw()},
   ok:function(x){if(o.step===0&&!o.done[0]){x.disabled=true;x.innerHTML=I('refresh','sm')+'Vérification en cours';setTimeout(function(){next()},P.RM?50:900);return}
    if(o.step===3&&!o.code){o.code=true;P.toast('Code reçu par SMS et vérifié',{icon:'lock',ms:1500})}next()},
   wk:function(x){var d=x.getAttribute('data-d'),j=+x.getAttribute('data-j');o.wk[d][j]=!o.wk[d][j];draw()},
   code:function(){o.code=true;draw();P.toast('Code reçu par SMS et vérifié',{icon:'lock'})},
   ask:function(){o.ask=true;draw();P.toast('Relance envoyée au Poney-club de Sonchamp',{icon:'send'})},
   close:function(){sheet.close();P.rerender();P.toast('Profil complet à 100 %',{icon:'checkc'})}});
  b.addEventListener('click',function(e){var bt=e.target.closest('.fx-step button');if(!bt)return;var w=bt.parentNode,i=+w.getAttribute('data-step').slice(2),p=CD.prices[i];p[2]=Math.max(10,p[2]+(+bt.getAttribute('data-d'))*5);w.querySelector('[data-v]').textContent=p[2];pulse(w)});
 },foot:' '})}
P.mod({id:'coach-profil',role:'coach',group:'Compte',title:'Profil',icon:'user',n:20,
 render:function(el){var c=D.coach('c01'),rv=D.coachReviews.filter(function(r){return r.coach==='c01'}).concat([{id:'r9',by:'m047',stars:5,when:'il y a 3 sem.',text:'Domino n’a jamais aussi bien sauté. Pauline explique sans jamais s’énerver.'}]);
  el.innerHTML=ph('Profil','Votre page est visible dans l’annuaire Piaffe et réservable par les adhérents de 3 écuries','<button class="btn" data-a="see">'+I('eye','sm')+'Voir ma page publique</button>')+
  '<div class="card pf-ok" style="margin-bottom:14px">'+U.ring(100,'100 %','var(--ok)',52)+'<div class="grow"><div class="hrow" style="--g:8px"><span class="strass"></span><b>Profil complet à 100 %</b></div><div class="s mut" style="margin-top:2px">Diplômes vérifiés, semaine type, tarifs, compte de versement, 3 écuries partenaires et page publique en ligne.</div></div><button class="btn" data-a="onb">'+I('onboarding','sm')+'Revoir mon arrivée</button></div>'+
  '<div class="pf"><div class="stack" style="--g:14px"><div class="card pf-hero"><div class="cov"></div><div class="bd"><div class="hrow sp" style="align-items:flex-end">'+U.av(c,'xl')+'<button class="btn sm" data-a="bio">'+I('edit','sm')+'Modifier</button></div><h2 style="font-size:22px;margin-top:10px">Pauline Arnaud</h2><div class="s mut">Coach CSO · '+c.level+'</div><div class="s" style="margin-top:6px">'+stars(c.rating)+' <b>4,9</b> <span class="mut">· '+c.reviews+' avis · 312 cours donnés en 2026</span></div><p class="s" style="margin-top:12px;color:var(--ink-2)" data-bio>'+PF.bio+'</p>'+
    '<div class="eyebrow" style="margin:16px 0 8px">Spécialités</div><div class="hrow wrap" style="--g:6px">'+Object.keys(PF.spec).map(function(k){return '<button class="tag" style="height:34px" data-a="spec" data-k="'+k+'" aria-pressed="'+PF.spec[k]+'">'+k+'</button>'}).join('')+'</div></div></div>'+
   '<div class="card"><div class="ch" style="padding-bottom:8px"><h3>Diplômes et pièces</h3><button class="btn ghost sm" data-a="doc">'+I('upload','sm')+'Ajouter</button></div><div class="list">'+PF.docs.map(function(d){return '<div class="li">'+sq(d[0],d[3])+'<div class="grow"><div class="t ellip">'+d[1]+'</div><div class="s ellip">'+d[2]+'</div></div>'+U.chip(d[4],d[3],true)+'</div>'}).join('')+'</div><div class="cf"><span class="xs mut">Les écuries qui vous accueillent voient ces pièces et sont prévenues 30 jours avant une échéance.</span></div></div></div>'+
  '<div class="stack" style="--g:14px">'+horsesCard()+'<div class="card"><div class="ch" style="padding-bottom:6px"><h3>Avis de vos élèves</h3><span class="xs mut">98 % de 5 étoiles</span></div>'+rv.map(function(r){return '<div class="co-rev">'+U.av(r.by)+'<div class="grow"><div class="hrow wrap sp" style="--g:8px"><span class="s"><b>'+nm(r.by)+'</b> <span class="mut">· '+r.when+'</span></span>'+stars(r.stars)+'</div><p class="s" style="margin:6px 0 8px;color:var(--ink-2)">'+r.text+'</p>'+(r.thanks?U.chip('Vous avez remercié '+fst(r.by),'ok',true):'<button class="btn ghost sm" data-a="thx" data-id="'+r.id+'">'+I('heart','sm')+'Remercier</button>')+'</div></div>'}).join('')+'</div>'+
   '<div class="card"><div class="ch" style="padding-bottom:8px"><h3>Réglages</h3></div><div class="cb" style="padding-top:0">'+row('Me prévenir à chaque réservation',tg(PF.set.resa,'set','resa'))+row('Rappel aux élèves la veille du cours',tg(PF.set.veille,'set','veille'))+row('Recevoir aussi les alertes par SMS',tg(PF.set.sms,'set','sms'))+row('Demander un avis après chaque cours',tg(PF.set.avis,'set','avis'))+row('Agenda Google','<span class="hrow" style="--g:8px;justify-content:flex-end">'+U.chip('Connecté','ok',true)+'<button class="btn sm" data-a="ics">'+I('link','sm')+'Copier le lien</button></span>')+row('Compte de versement','<span class="hrow" style="--g:8px;justify-content:flex-end"><span class="mono" style="white-space:nowrap">FR76 •••• 4521</span><button class="btn sm" data-a="iban">Changer</button></span>')+'</div><div class="cf hrow sp"><span class="xs mut">Piaffe Coach est gratuit pour les coachs. Les écuries règlent l’abonnement.</span><button class="btn ghost sm danger" data-a="out">'+I('logout','sm')+'Se déconnecter</button></div></div></div></div>';
  act(el,{see:function(){cdTab='page';P.go('coach-dispo')},hdecl:declSheet,onb:onbSheet,
   bio:function(){var sh=P.sheet({title:'Modifier ma présentation',icon:'edit',body:'<label class="field"><span>Présentation, visible sur votre page publique</span><textarea class="in" rows="6" data-t>'+PF.bio+'</textarea></label><p class="xs mut" style="margin-top:8px">Parlez de votre façon d’enseigner et de vos résultats. Deux ou trois phrases suffisent.</p>',foot:'<button class="btn pri" data-ok>Enregistrer</button>'});sh.querySelector('[data-ok]').onclick=function(){PF.bio=E(sh.querySelector('[data-t]').value);sh.close();el.querySelector('[data-bio]').textContent=sh.querySelector('[data-t]').value;P.toast('Présentation mise à jour sur votre page publique')}},
   spec:function(b){var k=b.getAttribute('data-k');PF.spec[k]=!PF.spec[k]},
   doc:function(){P.toast('Prenez la pièce en photo : Piaffe lit la date de validité',{icon:'scan'})},
   thx:function(b){var r=rv.find(function(x){return x.id===b.getAttribute('data-id')});r.thanks=true;b.outerHTML=U.chip('Vous avez remercié '+fst(r.by),'ok',true);P.toast('Remerciement envoyé à '+fst(r.by))},
   set:function(b){var k=b.getAttribute('data-id');PF.set[k]=!PF.set[k];P.toast('Réglage enregistré',{ms:1500})},
   ics:function(b){b.innerHTML=I('check','sm')+'Lien copié';P.toast('Lien d’abonnement copié : collez-le dans votre agenda',{icon:'link'})},
   iban:function(){P.toast('Un code de confirmation est envoyé au 06 •• •• •• 42',{icon:'lock'})},
   out:function(){P.toast('Dans la démo, vous restez connectée en tant que Pauline',{icon:'info'})}});
 }});

/* =====================================================================
   Palette, assistant, visite guidée
   ===================================================================== */
P.actions.push(
 {role:'gerant',label:'Ouvrir le plan de transport du prochain concours',icon:'truck',run:function(){P.go('competitions',{id:'k1',tab:'qui'})}},
 {role:'gerant',label:'Envoyer les engagements du concours de Rambouillet',icon:'send',run:function(){P.go('competitions',{id:'k1',tab:'eng'});setTimeout(function(){ffeSheet(D.competitions[0])},350)}},
 {role:'gerant',label:'Facturer les frais de concours',icon:'invoice',run:function(){P.go('competitions',{id:'k1',tab:'frais'})}},
 {role:'gerant',label:'Chronométrer le Hunter Club',icon:'stopwatch',run:function(){P.go('competitions',{id:'k3',tab:'chrono'})}},
 {role:'gerant',label:'Confirmer les réservations de coachs',icon:'coach',run:function(){P.go('coachs',{tab:'resa'})}},
 {role:'gerant',label:'Inviter un coach extérieur',icon:'plus',run:function(){P.go('coachs');setTimeout(function(){inviteSheet(false)},350)}},
 {role:'gerant',label:'Régler les règles de réservation des coachs',icon:'sliders',run:function(){P.go('coachs');setTimeout(rulesSheet,350)}},
 {role:'coach',label:'Démarrer mon prochain cours',icon:'play',run:function(){P.go('coach-agenda');setTimeout(function(){var l=dayL(0).find(function(x){return !x.done&&x.who.length});if(l)liveSheet(l)},350)}},
 {role:'coach',label:'Bloquer une période',icon:'holiday',run:function(){cdTab='sem';P.go('coach-dispo')}},
 {role:'coach',label:'Créer une facture',icon:'invoice',run:function(){P.go('coach-revenus');setTimeout(function(){invoiceSheet(null)},350)}},
 {role:'coach',label:'Voir ma journée de concours',icon:'compet',run:function(){ccSel='x1';P.go('coach-concours')}},
 {role:'gerant',label:'Importer les résultats FFE',icon:'upload',run:function(){var k=D.competitions.find(function(x){return x.status==='Terminé'});P.go('competitions',{id:k.id,tab:'res'});setTimeout(function(){ffeResSheet(k)},350)}},
 {role:'coach',label:'Déclarer un cheval',icon:'horse',run:function(){P.go('coach-profil');setTimeout(declSheet,350)}},
 {role:'coach',label:'Revoir mon arrivée sur Piaffe',icon:'onboarding',run:function(){P.go('coach-profil');setTimeout(onbSheet,350)}},
 {role:'coach',label:'Dessiner un parcours',icon:'jump',run:function(){ceTab='ex';P.go('coach-eleves')}},
 {role:'coach',label:'Personnaliser mon agenda',icon:'sliders',run:function(){P.go('coach-agenda');setTimeout(persoSheet,350)}},
 {role:'coach',label:'Copier le lien de ma page de réservation',icon:'link',run:function(){P.toast('Lien de votre page copié',{icon:'link'})}});

P.brain.push(
 {role:'gerant',re:/transport|camion|\bvan\b|emm[eè]ne|covoit|qui (va|part)/i,reply:function(){var k=D.competitions[0],pl=plan(k),free=pl.veh.reduce(function(a,v){return a+(v.cap-v.h.length)},0);
   return {text:'Pour '+k.place.split(',')[0]+' dimanche, '+(ents(k).length-pl.poolH.length)+' chevaux sur '+ents(k).length+' ont une place. '+(pl.poolH.length?'Il reste '+pl.poolH.map(function(h){return D.horse(h).name}).join(' et ')+' à placer, et '+free+' places libres dans le camion de la famille Muller.':'Tout le monde est placé.')+' Le camion part à '+th(pl.veh[0].leave)+'.',
    card:pl.veh.filter(function(v){return v.cap}).map(function(v){return '<div class="hrow sp"><span class="s">'+v.name+'</span><b class="s num">'+v.h.length+' / '+v.cap+'</b></div>'}).join(''),
    actions:[{label:'Placer automatiquement',run:function(){pl.poolH.slice().forEach(function(h){var v=pl.veh.find(function(x){return x.h.length<x.cap});if(v){v.h.push(h);pl.poolH=pl.poolH.filter(function(i){return i!==h})}});pl.poolP.slice().forEach(function(p){var v=pl.veh.find(function(x){return x.p.length<x.seats});if(v){v.p.push(p);pl.poolP=pl.poolP.filter(function(i){return i!==p})}});P.go('competitions',{id:'k1',tab:'qui'});return 'Plan complété'}},{label:'Ouvrir le plan',run:function(){P.go('competitions',{id:'k1',tab:'qui'});return 'Ouvert'}}]}}},
 {role:'gerant',re:/concours|engag|rambouillet|comp[ée]t|hunter|r[ée]sultat/i,reply:function(){var k=D.competitions[0],es=ents(k),tot=es.reduce(function(a,e){return a+e.fee},0);
   return {text:'Prochain concours : '+k.name+' à '+k.place.split(',')[0]+', '+F.dateL(k.date)+'. '+es.length+' cavaliers sont engagés pour '+F.eur(tot)+', la clôture est '+F.rel(k.closes)+'. Il manque le certificat médical d’Inès Martinez. Ensuite, le Hunter Club à domicile du 6 décembre compte déjà 22 engagés et il manque 4 bénévoles.',
    card:es.slice(0,4).map(function(e){return '<div class="hrow sp"><span class="s">'+nm(e.rider)+' · '+D.horse(e.horse).name+'</span><span class="s mut">'+e.class.split(' · ')[0]+'</span></div>'}).join('')+'<div class="xs mut">et '+(es.length-4)+' autres</div>',
    actions:[{label:'Préparer les engagements',run:function(){P.go('competitions',{id:'k1',tab:'eng'});setTimeout(function(){ffeSheet(k)},350);return 'Saisie assistée ouverte'}},{label:'Voir qui emmène qui',run:function(){P.go('competitions',{id:'k1',tab:'qui'});return 'Ouvert'}}]}}},
 {role:'gerant',re:/coach|reverse|pauline|cours particulier|droit de piste/i,reply:function(){var p=pendB(),ext=D.coaches.filter(function(c){return c.ext}),sum=ext.reduce(function(a,c){return a+DEAL[c.id].ca-clubCut(c)},0),ok=p.filter(function(b){return !(dayBlocks(b.d).find(function(x){return x.id===b.id})||{}).clash});
   return {text:p.length+' réservations de coachs attendent votre accord, dont une en conflit avec la reprise de 18 h. En novembre, les coachs ont donné 140 cours pour '+F.eur(7038)+' ; vous reversez '+F.eur(sum,1)+' aux 4 coachs extérieurs le 30. L’assurance de Julien Mercier expire dans 12 jours.',
    card:p.map(function(b){return '<div class="hrow sp"><span class="s">'+fst(b.coach)+' · '+bookWho(b)+'</span><span class="s mut">'+(b.d===0?'auj.':dlab(b.d))+' '+b.t+'</span></div>'}).join(''),
    actions:[{label:'Confirmer les '+ok.length+' sans conflit',run:function(){ok.forEach(function(b){b.status='confirmée'});P.toast(ok.length+' réservations confirmées, coachs et cavaliers prévenus');return ok.length+' réservations confirmées'}},{label:'Voir les réservations',run:function(){P.go('coachs',{tab:'resa'});return 'Ouvert'}}]}}},
 {role:'coach',re:/trajet|route|\bkm\b|itin[ée]raire|conduire|d[ée]placement/i,reply:function(){var L=dayL(0),legs=[];for(var i=1;i<L.length;i++)if(L[i].stable!==L[i-1].stable){var st=stb(L[i].stable),gap=hm(L[i].t)-(hm(L[i-1].t)+L[i-1].dur);legs.push({st:st,at:L[i].t,leave:hm(L[i].t)-st.min-10,gap:gap})}
   var km=legs.reduce(function(a,l){return a+l.st.km},0),nx=legs.find(function(l){return l.leave>=9*60+41});
   return {text:'Aujourd’hui, '+legs.length+' trajets entre vos écuries, soit '+km+' km en voiture, plus l’aller et le retour depuis chez vous (46 km au total). '+(nx?'Prochain départ à '+th(nx.leave)+', direction '+nx.st.name+', '+nx.st.min+' minutes de route.':'Plus de trajet entre écuries aujourd’hui.')+' Vos frais kilométriques sont comptés à 0,50 € le kilomètre au-delà de 25 km.',
    card:legs.map(function(l){return '<div class="hrow sp"><span class="s">Vers '+l.st.short+' · '+l.st.km+' km</span><span class="s mut num">départ '+tc(l.leave)+'</span></div>'}).join(''),
    actions:[{label:'Ouvrir l’itinéraire',run:function(){var t=nx||legs[0];P.toast('Itinéraire vers '+t.st.name+' ouvert : '+t.st.km+' km, '+t.st.min+' min',{icon:'route'});return 'Itinéraire ouvert'}},{label:'Voir mon agenda',run:function(){P.go('coach-agenda');return 'Ouvert'}}]}}},
 {role:'coach',re:/avis|[ée]toile|commentaire|note moyenne|r[ée]putation/i,reply:function(){var c=D.coach('c01'),rv=D.coachReviews.filter(function(r){return r.coach==='c01'}),todo=rv.filter(function(r){return !r.thanks});
   return {text:'Vous avez '+String(c.rating).replace('.',',')+' sur 5 sur '+c.reviews+' avis, dont 98 % de 5 étoiles. Les deux derniers viennent de '+rv.slice(0,2).map(function(r){return nm(r.by)}).join(' et ')+'. '+(todo.length?todo.length+' avis attendent encore votre remerciement.':'Vous avez remercié tout le monde.'),
    card:rv.slice(0,3).map(function(r){return '<div class="hrow sp"><span class="s ellip">'+nm(r.by)+' · '+r.when+'</span><b class="s num">'+r.stars+' sur 5</b></div>'}).join(''),
    actions:[{label:'Remercier '+(todo.length>1?'les '+todo.length+' élèves':'l’élève'),run:function(){todo.forEach(function(r){r.thanks=true});P.toast('Remerciements envoyés',{icon:'heart'});return todo.length+' remerciement'+(todo.length>1?'s':'')+' envoyé'+(todo.length>1?'s':'')}},{label:'Voir mes avis',run:function(){P.go('coach-profil');return 'Ouvert'}}]}}},
 {role:'coach',re:/relanc|inactif|pas vu|pas revu|sans cours|perdu de vue|reviennent/i,reply:function(){var L=D.coachLapsed;
   return {text:'Vos élèves suivis ont tous un cours cette semaine. '+L.length+' cavaliers sont à relancer : '+L.map(function(x){return x.first+' ('+x.why+')'}).join(', ')+'. Je peux leur proposer vos créneaux libres, dont mardi 14 h aux Tilleuls.',
    card:L.map(function(x){return '<div class="hrow sp"><span class="s ellip">'+x.first+' '+x.last+' · '+x.horse+'</span><span class="s mut">'+x.seen+'</span></div>'}).join(''),
    actions:[{label:'Proposer un créneau aux '+L.length,run:function(){L.forEach(function(x){x.done=true});P.toast('Vos créneaux libres sont proposés à '+L.map(function(x){return x.first}).join(', '),{icon:'send'});return L.length+' propositions envoyées'}},{label:'Voir mes élèves',run:function(){P.go('coach-eleves');return 'Ouvert'}}]}}},
 {role:'coach',re:/factur/i,reply:function(){var wait=CR.inv.filter(function(v){return v.st==='envoyée'}),next=CR.inv.find(function(v){return /émettre/.test(v.st)});
   return {text:(next?'La facture '+next.id+' de '+F.eur(next.amt,1)+' aux '+next.who.replace('Écurie des ','')+' part le 30 novembre. ':'')+(wait.length?wait.map(function(v){return v.who+' n’a pas encore réglé la facture '+v.id+' ('+F.eur(v.amt)+')'}).join(', ')+'. ':'')+'Je peux aussi préparer la facture de novembre de Victor Hamel : 4 cours particuliers, '+F.eur(220)+'.',
    card:CR.inv.slice(0,3).map(function(v){return '<div class="hrow sp"><span class="s ellip">'+v.id+' · '+v.who+'</span><span class="s mut">'+v.st+'</span></div>'}).join(''),
    actions:[{label:'Créer la facture de Victor',run:function(){P.go('coach-revenus');setTimeout(function(){invoiceSheet(null)},350);return 'Facture préparée'}}].concat(wait.length?[{label:'Relancer '+wait[0].who.split(' ')[0],run:function(){P.toast('Relance envoyée à '+wait[0].who+' avec le lien de paiement',{icon:'send'});return 'Relance envoyée'}}]:[])}}},
 {role:'coach',re:/bloque|vendredi|cong[ée]|indispo/i,reply:function(){return {text:'Vendredi 20 novembre, vous avez 2 cours : Clémence à 10 h à la Vallée et Louise à 16 h 30 aux Tilleuls. Je peux fermer la journée et leur proposer vos créneaux libres de jeudi et samedi.',actions:[{label:'Bloquer et proposer un report',run:function(){var g=cdGrid();for(var h=8;h<20;h++)g['4-'+h]='off';CD.exc.unshift({d:'Ven. 20 nov.',t:'Journée bloquée depuis l’assistant'});P.toast('Vendredi bloqué, 2 propositions de report envoyées');return 'Vendredi bloqué'}},{label:'Voir mes disponibilités',run:function(){P.go('coach-dispo');return 'Ouvert'}}]}}},
 {role:'coach',re:/progress|[ée]l[èe]ve|qui a/i,reply:function(){var L=STU.slice().sort(function(a,b){return (b.h[7]-b.h[4])-(a.h[7]-a.h[4])}).slice(0,3);return {text:'Ce mois-ci, trois élèves ont nettement avancé. Léa a signé un sans-faute et une 3e place à Chantilly.',card:L.map(function(s){return '<div class="hrow sp"><span class="s">'+s.first+' '+s.last+' · '+s.horse+'</span><b class="s num okc">+'+(s.h[7]-s.h[4])+' cm</b></div>'}).join(''),actions:[{label:'Ouvrir la fiche de '+L[0].first,run:function(){P.go('coach-eleves',{id:L[0].id});return 'Ouvert'}}]}}},
 {role:'coach',re:/revenu|gagn|factur|urssaf|argent|chiffre/i,reply:function(){return {text:'En novembre, vous avez donné pour '+F.eur(3480)+' de cours. '+F.eur(1390)+' sont déjà sur votre compte et les Tilleuls vous reversent '+F.eur(1776.5,1)+' le 30. Après frais d’écurie, il vous reste '+F.eur(2950.5,1)+'.',actions:[{label:'Voir mes revenus',run:function(){P.go('coach-revenus');return 'Ouvert'}}]}}},
 {role:'coach',re:/cours|semaine|agenda|aujourd|planning|concours/i,reply:function(){var wk=LES.filter(function(l){return l.type!=='Libre'});return {text:'Cette semaine : '+wk.length+' cours dans 3 écuries pour '+F.eur(wk.reduce(function(a,l){return a+l.price},0))+'. Aujourd’hui, il vous reste '+dayL(0).filter(function(l){return !l.done&&l.who.length}).length+' cours'+(nextL()?' ; le prochain est à '+th(hm(nextL().t))+' avec '+lTitle(nextL()).split(' · ')[0]+' aux '+stb(nextL().stable).short.replace(/^Les /,''):'')+'. Dimanche, vous coachez 3 cavaliers à Rambouillet.',card:dayL(0).filter(function(l){return !l.done&&l.who.length}).map(function(l){return '<div class="hrow sp"><span class="s ellip">'+lTitle(l).split(' · ')[0]+'</span><span class="s mut num">'+l.t+'</span></div>'}).join(''),actions:[{label:'Démarrer le cours de 11 h 15',run:function(){P.go('coach-agenda');setTimeout(function(){liveSheet(LES.find(function(l){return l.id==='a05'}))},350);return 'Chrono lancé'}},{label:'Voir ma journée de concours',run:function(){ccSel='x1';P.go('coach-concours');return 'Ouvert'}}]}}});

P.tourSteps.push(
 {route:'competitions',params:{id:'k1',tab:'qui'},title:'Qui emmène qui, en un coup d’œil',text:'Avant un concours, le gérant glisse chevaux et cavaliers dans le camion, les vans et les voitures des familles. Piaffe compte les places, calcule l’heure de départ et envoie le plan à tout le monde. Les engagements, le matériel et les frais suivent dans les onglets voisins.'},
 {route:'coach-agenda',title:'Le coach indépendant a enfin son outil',text:'Pauline enseigne dans trois écuries. Son agenda réunit ses cours, ses trajets et ses demandes de réservation. Elle démarre un cours d’un geste, dicte sa note de séance et la partage avec son élève ; ses revenus et ses factures se mettent à jour tout seuls.'});

})();
