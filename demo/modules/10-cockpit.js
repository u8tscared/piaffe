/* Vue gérant · Aujourd'hui (module de référence pour les autres écrans)
   Tous les chiffres viennent de D : chevaux, adhérents, factures, reprises, tâches, réservations de pistes, faits partagés. */
(function(){
var D=P.D,F=P.fmt,U=P.ui,C=P.chart,E=F.esc;

/* ---------- Cohérence : le hersage du jour suit D.facts (13 h 30), pas l'ancienne tâche de 11 h 30 ---------- */
(function(){var hz=D.facts&&D.facts.hersage;if(!hz)return;var ar=(D.club.arenas.find(function(a){return a.id===hz.arena})||{}).name;
  (D.tasks||[]).forEach(function(t){if(/^Herser/.test(t.title)&&(!ar||t.zone===ar))t.time=hz.at})})();

/* ---------- Outils ---------- */
var NB='\u00a0';
function hm(s){if(!/^\d\d:\d\d$/.test(s||''))return s||'';var h=+s.slice(0,2),m=s.slice(3);return h+NB+'h'+(m==='00'?'':NB+m)}
function mins(s){return /^\d\d:\d\d$/.test(s||'')?(+s.slice(0,2))*60+(+s.slice(3)):null}
var WORDS=['Aucun','Un','Deux','Trois','Quatre','Cinq','Six','Sept','Huit','Neuf','Dix'];
function word(n,fem){var w=WORDS[n]||String(n);return fem&&n===1?'Une':w}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function low(s){return s.charAt(0).toLowerCase()+s.slice(1)}
function de(name){return /^[AEIOUYÉÈHaeiouyéèh]/.test(name)?'d’'+name:'de '+name}
function arena(id){return D.club.arenas.find(function(a){return a.id===id})||{name:''}}
function pending(){return (D.declarations||[]).filter(function(x){return x.status==='en attente'})}
function nowMin(){return D.today.getHours()*60+D.today.getMinutes()}
function todayIso(){return D.iso(D.today)}
/* emplacement de chaque cheval à 9 h 41 : défini par le plan 3D (lot écurie), sinon au box */
function where(h){return typeof D.horseWhere==='function'?D.horseWhere(h.id):'box'}
function lateInv(){return D.invoices.filter(function(i){return i.status==='en retard'})}

P.css(`
.ck-hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:14px}
.ck-brief{padding:22px;display:flex;flex-direction:column;gap:16px;overflow:hidden}
.ck-brief h2{font-size:24px;line-height:1.15;letter-spacing:-.03em;color:var(--navy-ink)}
.ck-brief .pts{display:grid;gap:8px}
.ck-brief .pt{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;color:color-mix(in srgb,var(--navy-ink) 82%,transparent)}
.ck-brief .pt b{color:var(--navy-ink)}
.ck-brief .pt svg.i{color:var(--strass);margin-top:1px}
.ck-brief .pt{opacity:0;animation:ck-in .5s var(--e-out) forwards;animation-delay:calc(var(--k)*70ms + 160ms)}
.ck-brief .glow{position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(111,140,255,.45),transparent 65%);pointer-events:none;animation:ck-glow 9s ease-in-out infinite alternate}
@keyframes ck-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
@keyframes ck-glow{from{transform:translate(0,0) scale(1)}to{transform:translate(-26px,18px) scale(1.12)}}
.ck-wx{display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center}
.ck-wx div{display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 0;border-radius:10px;font-size:12px}
.ck-wx div:first-child{background:var(--acc-pale)}
.ck-wx b{font-size:14px}
.ck-les{display:flex;flex-direction:column}
.ck-l{display:grid;grid-template-columns:54px 4px minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 16px;cursor:pointer;transition:background var(--t-1)}
.ck-l:hover{background:var(--surface-2)}
.ck-l .tm{font:600 13px var(--f-text);font-variant-numeric:tabular-nums}
.ck-l .tm small{display:block;color:var(--mut);font-weight:500;font-size:11.5px}
.ck-l .st{width:4px;height:34px;border-radius:2px;background:var(--c)}
.ck-l.now{background:var(--acc-pale)}
.ck-alert{display:flex;gap:12px;align-items:center;padding:11px 16px;cursor:pointer;width:100%;text-align:left}
.ck-alert+.ck-alert{border-top:1px solid var(--line)}
.ck-alert:hover{background:var(--surface-2)}
.ck-alert.val{background:var(--acc-pale)}
.ck-alert.val:hover{background:color-mix(in srgb,var(--acc-pale) 70%,var(--acc-line))}
.ck-edit{outline:2px dashed var(--acc-line);outline-offset:4px;border-radius:var(--r-lg)}
.ck-hero.one{grid-template-columns:minmax(0,1fr)}
.ck-st{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.ck-lc{display:flex;flex-direction:column}
.ck-also{margin-top:auto;padding:12px 16px;border-top:1px solid var(--line);display:flex;gap:10px;align-items:flex-start;font-size:12.5px;color:var(--mut)}
.ck-also svg.i{margin-top:1px;flex:none}
.ck-also b{color:var(--ink-2);font-weight:600}
.ck-fin{flex-wrap:wrap}
/* fil de la journée : occupation des pistes de 8 h à 20 h */
.ck-day{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:12px;padding:4px 16px 12px;border-bottom:1px solid var(--line)}
.ck-dl{display:grid;grid-auto-rows:18px;row-gap:7px;padding-top:20px;font-size:11.5px;color:var(--mut);white-space:nowrap}
.ck-dl span{line-height:18px}
.ck-dt{position:relative;display:grid;grid-auto-rows:18px;row-gap:7px;padding-top:20px}
.ck-ax{position:absolute;left:0;right:0;top:0;height:16px;font-size:10.5px;color:var(--mut-2);font-variant-numeric:tabular-nums}
.ck-ax span{position:absolute;translate:-50% 0}
.ck-ax span:first-child{translate:0 0}.ck-ax span:last-child{translate:-100% 0}
.ck-tr{position:relative;border-radius:5px;background:var(--bg-2);overflow:hidden}
.ck-tr i{position:absolute;top:2px;bottom:2px;border-radius:4px;background:var(--c);transform-origin:left center;animation:ck-grow .7s var(--e-out) both;animation-delay:calc(var(--k)*45ms + 250ms)}
.ck-tr i.past{opacity:.38}
@keyframes ck-grow{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.ck-now{position:absolute;top:14px;bottom:-4px;width:2px;margin-left:-1px;background:var(--bad);border-radius:1px;pointer-events:none}
.ck-now::before{content:'';position:absolute;left:50%;top:0;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:var(--bad);box-shadow:0 0 0 0 color-mix(in srgb,var(--bad) 50%,transparent);animation:ck-pulse 2.2s ease-out infinite}
@keyframes ck-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--bad) 45%,transparent)}100%{box-shadow:0 0 0 9px transparent}}
.ck-dleg{grid-column:1/-1;margin-top:10px}
@container main (max-width:900px){.ck-hero{grid-template-columns:minmax(0,1fr)}}
@container main (max-width:760px){.ck-todo{order:-1}}
@container main (max-width:520px){.ck-kpis{grid-template-columns:repeat(2,minmax(0,1fr));--g:10px}.ck-kpis .kpi{padding:14px 12px 12px}.ck-kpis .kpi .val{font-size:23px}.ck-brief{padding:18px}.ck-brief h2{font-size:21px}.ck-brief .btn{height:40px}.ck-l{grid-template-columns:48px 4px minmax(0,1fr) auto;gap:10px;padding:12px 14px}.ck-alert{padding:12px 14px}.ck-st .xs svg.i{display:none}.ck-fin+.cb svg.chart text{font-size:19px}.ck-day{padding:4px 14px 12px;column-gap:10px}}
`);

var WIDGETS=[['brief','Résumé du matin'],['kpis','Indicateurs'],['lessons','Reprises du jour'],['alerts','À traiter'],['finance','Recettes et dépenses'],['stable','Écurie en direct'],['weather','Météo et carrières']];
var DAYN={Lun:['lundi',1],Mar:['mardi',2],Mer:['mercredi',3],Jeu:['jeudi',4],Ven:['vendredi',5],Sam:['samedi',6],Dim:['dimanche',0]};

/* ---------- Événements de la journée sur les pistes ---------- */
function dayEvents(){var ev=[],t=todayIso(),dow=D.today.getDay();
  D.lessons.filter(function(l){return l.dow===dow}).forEach(function(l){var s=mins(l.start);ev.push({k:'les',a:l.arena,s:s,e:s+l.dur,t:l.title,at:l.start})});
  var pc=D.coaches.find(function(c){return c.id==='c01'});
  ((D.facts&&D.facts.paulineToday)||[]).forEach(function(x){if(!x.arena)return;var s=mins(x.at);ev.push({k:'coach',a:x.arena,s:s,e:s+60,t:x.what+(pc?' ('+pc.first+' '+pc.last+')':''),at:x.at})});
  (D.trackBookings||[]).filter(function(b){return b.date===t}).forEach(function(b){var h=D.horse(b.horse);ev.push({k:'own',a:b.arena,s:mins(b.from),e:mins(b.to),t:'Piste réservée par '+D.name(b.who)+(h?' pour '+h.name:''),at:b.from,b:b})});
  var hz=D.facts&&D.facts.hersage;if(hz){var s=mins(hz.at);ev.push({k:'work',a:hz.arena,s:s,e:s+30,t:'Hersage de la '+low(arena(hz.arena).name),at:hz.at})}
  return ev.sort(function(a,b){return a.s-b.s})}
var EVC={les:['Reprises','var(--acc)'],coach:['Coach','var(--c5)'],own:['Propriétaires','var(--c3)'],work:['Entretien','var(--c4)']};
function dayStrip(mobile){var ev=dayEvents(),H0=8*60,H1=20*60,span=H1-H0,n=nowMin(),k=0;
  function pc(m){return Math.max(0,Math.min(100,(m-H0)/span*100))}
  var SHORT={a1:'Manège',a2:'Honneur',a3:'Petite',a4:'Rond'};
  var lab='<div class="ck-dl">'+D.club.arenas.map(function(a){return '<span title="'+E(a.name)+'">'+(mobile?SHORT[a.id]||a.name:E(a.name))+'</span>'}).join('')+'</div>';
  var ax='<div class="ck-ax">'+[8,10,12,14,16,18,20].map(function(h){return '<span style="left:'+pc(h*60)+'%">'+h+NB+'h</span>'}).join('')+'</div>';
  var tr=D.club.arenas.map(function(a){return '<div class="ck-tr">'+ev.filter(function(e){return e.a===a.id}).map(function(e){return '<i class="'+(e.e<=n?'past':'')+'" style="left:'+pc(e.s)+'%;width:calc('+(pc(e.e)-pc(e.s))+'% - 2px);--c:'+EVC[e.k][1]+';--k:'+(k++)+'" title="'+E(hm(e.at)+' · '+e.t)+'"></i>'}).join('')+'</div>'}).join('');
  return '<div class="ck-day" aria-label="Occupation des pistes aujourd’hui">'+lab+'<div class="ck-dt">'+ax+tr+'<span class="ck-now" style="left:'+pc(n)+'%" title="Maintenant, '+hm(('0'+D.today.getHours()).slice(-2)+':'+('0'+D.today.getMinutes()).slice(-2))+'"></span></div>'+
    '<div class="ck-dleg">'+C.legend(Object.keys(EVC).filter(function(x){return ev.some(function(e){return e.k===x})}).map(function(x){return EVC[x]}))+'</div></div>'}
/* phrase « Aussi aujourd'hui » : tout ce qui occupe les pistes en dehors des reprises */
function alsoTxt(){var ev=dayEvents().filter(function(e){return e.k!=='les'}),parts=[];
  var pc=D.coaches.find(function(c){return c.id==='c01'}),co=ev.filter(function(e){return e.k==='coach'});
  if(co.length)parts.push('<b>'+(pc?E(pc.first+' '+pc.last):'Coach')+'</b> en '+low(arena(co[0].a).name)+' : '+co.map(function(e){var w=((D.facts.paulineToday||[]).find(function(x){return x.at===e.at})||{}).what||'';return E(low(w))+' à '+hm(e.at)}).join(', '));
  ev.filter(function(e){return e.k==='work'}).forEach(function(e){parts.push('<b>'+E(e.t.toLowerCase())+'</b> à '+hm(e.at))});
  var ow=ev.filter(function(e){return e.k==='own'});
  if(ow.length)parts.push('<b>'+ow.length+' piste'+(ow.length>1?'s réservées':' réservée')+'</b> par des propriétaires ('+ow.map(function(e){return low(arena(e.a).name)+' à '+hm(e.at)}).join(', ')+')');
  if(!parts.length)return '';
  return 'Aussi aujourd’hui : '+(parts.length>1?parts.slice(0,-1).join(' ; ')+' ; '+parts[parts.length-1]:parts[0])+'.'}

P.mod({id:'cockpit',role:'gerant',group:'Pilotage',n:1,title:'Aujourd’hui',icon:'today',phoneTitle:'Bonjour Claire',
 badge:function(){var n=D.horses.filter(function(h){return h.status==='bad'}).length+pending().length;return n?{v:n,hot:true}:null},
 render:function(el,ctx){
  var on=P.prefs.get('cockpit:widgets',WIDGETS.map(function(w){return w[0]}));
  var dow=D.today.getDay(),tIso=todayIso(),nm=nowMin();
  var today=D.lessons.filter(function(l){return l.dow===dow}).sort(function(a,b){return mins(a.start)-mins(b.start)}),late=lateInv(),lateSum=late.reduce(function(a,i){return a+i.amount},0);
  var fill=Math.round(D.lessons.reduce(function(a,l){return a+l.riders.length},0)/D.lessons.reduce(function(a,l){return a+l.cap},0)*100);
  var riders=today.reduce(function(a,l){return a+l.riders.length},0),alerts=D.horses.filter(function(h){return h.status!=='ok'}),bad=D.horses.filter(function(h){return h.status==='bad'});
  var next=today.find(function(l){return mins(l.start)>=nm})||null;
  var careToday=D.care.filter(function(c){return c.date===tIso&&c.status!=='en cours'&&c.status!=='fait'});
  var decl=pending();
  var toSign=D.contracts.filter(function(c){return c.status==='à signer'});
  /* écurie */
  var nBox=D.club.boxes,used={};D.horses.forEach(function(h){if(h.box)used[h.box]=1});
  var free=[];for(var i=1;i<=nBox;i++){var bid='B'+(i<10?'0':'')+i;if(!used[bid])free.push(bid)}
  var occN=nBox-free.length,wh={box:0,pad:0,work:0};D.horses.forEach(function(h){var w=where(h);wh[w]=(wh[w]||0)+1});
  var req=(D.boxRequests||[]).filter(function(r){return !r.done}).length;
  /* argent du jour */
  var inToday=D.bank.filter(function(b){return b.d===tIso&&b.amount>0}),inSum=inToday.reduce(function(a,b){return a+b.amount},0),
      inN=inToday.reduce(function(a,b){var m=/(\d+)\s+(mandats|opérations|paiements)/.exec(b.label);return a+(m?+m[1]:1)},0);
  /* stock le plus urgent */
  var shav=D.stock.filter(function(s){return s.daily>0&&s.qty<s.min}).sort(function(a,b){return a.qty/a.daily-b.qty/b.daily})[0];
  /* météo : jours de pluie et reprises en extérieur concernées */
  var rainy=D.weather.filter(function(w){return w.r>50&&DAYN[w.d]}),rainDow=rainy.map(function(w){return DAYN[w.d][1]});
  var outdoor=D.club.arenas.filter(function(a){return !/Couvert/.test(a.kind)}).map(function(a){return a.id});
  var moved=D.lessons.filter(function(l){return rainDow.indexOf(l.dow)>=0&&outdoor.indexOf(l.arena)>=0});
  var indoor=D.club.arenas.find(function(a){return /Couvert/.test(a.kind)})||{name:'manège'};

  /* Recettes et dépenses : 12 mois, dernier trimestre ou mois en cours (par semaine) */
  function fin(n){var rv,co,lb,per;
    if(n===1){var r=D.revenue[11],c=D.costs[11],w=[.27,.24,.31,.18];rv=w.map(function(x){return Math.round(r*x)});co=[.26,.25,.24,.25].map(function(x){return Math.round(c*x)});lb=['2 au 8','9 au 15','16 au 22','23 au 30'];per='en novembre'}
    else{rv=D.revenue.slice(-n);co=D.costs.slice(-n);lb=D.months.slice(-n);per=n===12?'sur 12 mois':'sur le trimestre'}
    var res=rv.reduce(function(a,b){return a+b},0)-co.reduce(function(a,b){return a+b},0);
    return C.line([{v:rv,c:'var(--acc)',area:true,name:'Recettes'},{v:co,c:'var(--c2)',name:'Dépenses'}],lb,{fmt:function(v){return Math.round(v/1000)+' k'},h:ctx.mobile?330:210})+
      '<div class="hrow sp wrap" style="margin-top:10px">'+C.legend([['Recettes','var(--acc)'],['Dépenses','var(--c2)']])+'<span class="s"><b class="'+(res<0?'badc':'okc')+'">'+(res<0?'−':'+')+F.eur(Math.abs(res))+'</b> <span class="mut">de résultat '+per+'</span></span></div>'}

  var dateTxt=cap(F.dateL(D.today));
  var h=U.ph('Bonjour Claire',dateTxt+' · '+today.length+' reprises, '+riders+' cavaliers et '+careToday.length+' rendez-vous de soins aujourd’hui',
    '<button class="btn" data-edit>'+ICON('sliders','sm')+'Personnaliser</button><button class="btn pri" data-new>'+ICON('plus','sm')+'Créer</button>');
  h+='<div class="stack rise" style="--g:14px">';

  var wB=on.indexOf('brief')>=0,wS=on.indexOf('stable')>=0;
  if(wB||wS)h+='<div class="ck-hero'+(wB&&wS?'':' one')+'">';
  if(wB){
    var pts=[],vet=careToday.filter(function(c){return c.kind==='Vétérinaire'}).sort(function(a,b){return (mins(a.time)||0)-(mins(b.time)||0)})[0];
    /* surveillance : capteur d'abreuvoir en alerte, rattaché au cheval de son box */
    D.sensors.filter(function(s){return s.state!=='ok'&&/Abreuvoir B\d+/.test(s.name)}).forEach(function(s){var bx=/B\d+/.exec(s.name)[0],hx=D.horses.find(function(x){return x.box===bx});if(!hx)return;
      var pct=/(\d+)\s*%/.exec(s.note),watch=D.care.find(function(c){return c.horse===hx.id&&c.kind==='Surveillance'});
      pts.push(['horse','<b>'+E(hx.name)+' ('+bx+')</b> boit '+(pct?pct[1]+NB+'%':'nettement')+' de moins depuis hier soir.'+(watch?' '+E(watch.who)+' le surveille '+(/2 h/.test(watch.time)?'toutes les deux heures':E(watch.time.toLowerCase()))+'.':'')])});
    if(vet){var vh=D.horse(vet.horse),prep=D.tasks.find(function(t){return t.title.indexOf(vh.name)>=0&&/^Préparer/.test(t.title)});
      pts.push(['care','<b>'+E(vh.name)+'</b> voit le '+E(vet.who)+' à '+hm(vet.time)+(/Boiterie/i.test(vet.note)?' pour sa boiterie':'')+'.'+(prep?' '+E(D.staffer(prep.who).first)+' le prépare à '+hm(prep.time)+'.':'')])}
    if(decl.length)pts.push(['horse','<b>'+decl.length+' cheva'+(decl.length>1?'ux déclarés':'l déclaré')+'</b> '+(decl.length>1?'attendent':'attend')+' votre validation : '+decl.map(function(d){return E(d.name)}).join(' et ')+'.']);
    if(late.length)pts.push(['invoice','<b>'+late.length+' facture'+(late.length>1?'s':'')+' en retard</b> pour '+F.eur(lateSum)+'. Je peux envoyer les relances maintenant.']);
    if(shav)pts.push(['stock','<b>'+E(shav.name.split(' ')[0])+'</b> : '+Math.floor(shav.qty/shav.daily)+' jours de stock. Une commande de '+shav.min+' '+E(shav.unit)+' est prête à valider.']);
    var bt=vet?' avant '+hm(vet.time):'';
    var head=bad.length?(bad.length>3?'Journée tendue.':'Journée chargée mais sous contrôle.')+' '+word(bad.length)+' cheva'+(bad.length>1?'ux demandent':'l demande')+' votre attention'+bt+'.':'Journée calme. Aucun cheval ne demande une attention urgente.';
    h+='<div class="card navy ck-brief" data-w="brief"><div class="glow"></div><div class="hrow"><span class="strass" style="background:var(--strass)"></span><span class="eyebrow" style="color:var(--strass)">Résumé du matin, préparé par l’assistant</span></div>'+
    '<h2>'+head+'</h2><div class="pts">'+pts.map(function(p,k){return '<div class="pt" style="--k:'+k+'">'+ICON(p[0])+'<span>'+p[1]+'</span></div>'}).join('')+'</div>'+
    '<div class="hrow wrap">'+(late.length?'<button class="btn sm" style="background:var(--acc);color:#fff;box-shadow:none" data-relance>'+ICON('send','sm')+'Envoyer les relances</button>':'')+(shav?'<button class="btn sm" style="background:rgba(255,255,255,.1);color:var(--navy-ink);box-shadow:none" data-cmd>Valider la commande de '+E(shav.name.split(' ')[0].toLowerCase())+'</button>':'')+'</div></div>'}
  if(wS)h+='<div class="card" data-w="stable"><div class="ch"><h3>Écurie en direct</h3><button class="btn ghost sm" data-go="ecurie3d">Ouvrir le plan 3D'+ICON('arrow','sm')+'</button></div><div class="cb stack" style="--g:14px">'+
      '<div class="hrow" style="--g:16px">'+U.ring(Math.round(occN/nBox*100),occN+'/'+nBox,'var(--acc)',64)+'<div class="stack" style="--g:4px"><b>'+occN+' boxes occupés</b><span class="s mut">'+(free.length?free.length+' libre'+(free.length>1?'s':'')+' : '+free.slice(0,4).join(', ')+(free.length>4?'…':''):'Aucun box libre')+(req?' · '+req+' demande'+(req>1?'s':'')+' de pension en attente':'')+'</span></div></div>'+
      '<div class="ck-st">'+[['Au box',wh.box,'stable'],['Au paddock',wh.pad,'paddock'],['Au travail',wh.work,'arena']].map(function(x){return '<div class="card soft" style="padding:10px 12px"><div class="xs mut hrow" style="--g:6px">'+ICON(x[2],'sm')+x[0]+'</div><div class="disp" style="font-size:22px;font-weight:700"><span data-count="'+x[1]+'">'+x[1]+'</span></div></div>'}).join('')+'</div>'+
      '<div class="hrow wrap" style="--g:6px">'+D.sensors.slice(0,4).map(function(s){return U.chip(s.name+' · '+s.val,s.state==='ok'?'':'warn',true)}).join('')+'</div></div></div>';
  if(wB||wS)h+='</div>';

  if(on.indexOf('kpis')>=0){var nm2=D.members.length,rv=D.revenue,cur=rv[rv.length-1];
    h+='<div class="g4 ck-kpis" data-w="kpis">'+
    U.kpi({label:ctx.mobile?'CA de novembre':'Chiffre d’affaires de novembre',count:cur,fmt:'eur',value:F.eur(cur),delta:'+8,4 %',dsub:' vs nov. 2025',spark:rv,icon:'euro'})+
    U.kpi({label:'Encaissé aujourd’hui',count:inSum,fmt:'eur',value:F.eur(inSum),delta:inN+' paiement'+(inN>1?'s':''),spark:[2,4,3,6,5,8,7,9],icon:'card'})+
    U.kpi({label:ctx.mobile?'Remplissage, semaine':'Remplissage des reprises, cette semaine',count:fill,unit:'%',delta:'+3 pts',spark:D.occupancy.slice(0,11).concat([fill]),icon:'planning'})+
    U.kpi({label:'Adhérents actifs',count:nm2,delta:'+3 cette semaine',spark:[17,15,12,10,9,7,4,3,0].map(function(d){return nm2-d}),icon:'members'})+'</div>'}

  h+='<div class="g3">';
  if(on.indexOf('lessons')>=0){var also=alsoTxt();
    h+='<div class="card span2 ck-lc" data-w="lessons"><div class="ch"><h3 style="white-space:nowrap">'+(ctx.mobile?'Reprises du jour':'Reprises d’aujourd’hui')+'</h3><div class="hrow" style="--g:6px">'+(next?'<span class="chip acc dot">Prochaine : '+hm(next.start)+'</span>':'')+'<button class="btn ghost sm" data-go="planning">Planning'+ICON('arrow','sm')+'</button></div></div>'+
    dayStrip(ctx.mobile)+
    '<div class="ck-les" style="padding:8px 0">'+
    today.map(function(l){var c=D.staffer(l.coach),ar=arena(l.arena),full=l.riders.length>=l.cap;
      return '<div class="ck-l'+(l===next?' now':'')+'" data-go="planning" data-id="'+l.id+'"><div class="tm">'+l.start+'<small>'+l.dur+' min</small></div><span class="st" style="--c:'+c.color+'"></span><div style="min-width:0"><div class="b ellip">'+E(l.title)+'</div><div class="s mut ellip">'+c.first+' · '+ar.name+'</div></div><div class="hrow" style="--g:10px">'+U.avs(l.riders,3)+'<span class="chip '+(full?'warn':'')+'">'+l.riders.length+'/'+l.cap+'</span></div></div>'}).join('')+'</div>'+
    (also?'<div class="ck-also">'+ICON('clock','sm')+'<span>'+also+'</span></div>':'')+'</div>'}
  if(on.indexOf('alerts')>=0){
    var csub=toSign.slice(0,2).map(function(c){var t=c.title.replace(/^Contrat de /,'').replace(/ et règlement intérieur$/,'').replace(/ et droit à l’image$/,'');
      if(/demi-pension/i.test(t)&&D.facts&&D.facts.emmaContract)t='Avenant de demi-pension';
      return cap(t)+(c.horse?' '+de(D.horse(c.horse).name.split(' ')[0]):', '+D.name(c.party))}).join(' ; ')+(toSign.length>2?'…':'');
    var nTodo=decl.length+alerts.length+toSign.length;
    h+='<div class="card ck-todo" data-w="alerts"><div class="ch"><h3>À traiter</h3><span class="chip bad"><span data-count="'+nTodo+'">'+nTodo+'</span></span></div><div style="padding:6px 0">'+
    (decl.length?'<button class="ck-alert val" data-go="chevaux" data-p-validate="1"><span class="av sq" style="--c:var(--acc);color:var(--acc-ink)">'+ICON('horse','sm')+'</span><div class="grow" style="min-width:0"><div class="b s">À valider : '+decl.length+' cheva'+(decl.length>1?'ux déclarés':'l déclaré')+'</div><div class="xs mut ellip">'+decl.map(function(d){return E(d.name)+' ('+E(d.by&&D.coach(d.by)?'coach':'adhérent')+')'}).join(', ')+'</div></div>'+U.chip(String(decl.length),'acc')+'</button>':'')+
    alerts.slice(0,decl.length?4:5).map(function(x){return '<div class="ck-alert" data-go="cheval" data-id="'+x.id+'">'+U.hav(x)+'<div class="grow" style="min-width:0"><div class="b s">'+E(x.name)+' <span class="mut" style="font-weight:500">· '+x.box+'</span></div><div class="xs mut ellip">'+E(x.alerts[0])+'</div></div>'+U.chip(x.status==='bad'?'Urgent':'À voir',x.status==='bad'?'bad':'warn')+'</div>'}).join('')+
    (alerts.length>(decl.length?4:5)?'<div class="ck-alert" data-go="chevaux"><span class="av sq" style="--c:var(--bg-2);color:var(--mut)">'+ICON('horse','sm')+'</span><div class="grow"><div class="b s">'+(alerts.length-(decl.length?4:5))+' autres chevaux à surveiller</div><div class="xs mut">Voir la liste des chevaux</div></div>'+ICON('right','sm')+'</div>':'')+
    (toSign.length?'<div class="ck-alert" data-go="contrats"><span class="av sq" style="--c:var(--acc-pale);color:var(--acc)">'+ICON('contract','sm')+'</span><div class="grow" style="min-width:0"><div class="b s">'+toSign.length+' contrat'+(toSign.length>1?'s':'')+' à signer</div><div class="xs mut ellip">'+E(csub)+'</div></div>'+ICON('right','sm')+'</div>':'')+'</div></div>'}
  h+='</div>';

  h+='<div class="g3">';
  if(on.indexOf('finance')>=0)h+='<div class="card span2" data-w="finance"><div class="ch ck-fin"><div><h3>Recettes et dépenses</h3><div class="xs mut" data-finsub>12 derniers mois</div></div>'+U.seg([['12','12 mois'],['3','Trimestre'],['1','Mois']],'12','data-fin')+'</div><div class="cb" data-finbody>'+fin(12)+'</div></div>';
  if(on.indexOf('weather')>=0){var rd=rainy.map(function(w){return DAYN[w.d][0]}),rdTxt=rd.length>1?rd.slice(0,-1).join(', ')+' et '+rd[rd.length-1]:rd[0]||'';
    var closed=D.club.arenas.filter(function(a){return outdoor.indexOf(a.id)>=0&&moved.some(function(l){return l.arena===a.id})}).map(function(a){return low(a.name)});
    h+='<div class="card" data-w="weather"><div class="ch"><h3>Météo et carrières</h3><span class="xs mut">'+D.club.city+'</span></div><div class="cb stack" style="--g:14px"><div class="ck-wx">'+
    D.weather.map(function(w){return '<div><span class="xs mut">'+w.d+'</span>'+ICON(w.i)+'<b>'+w.t+'°</b><span class="xs '+(w.r>50?'acc':'mut')+'">'+w.r+NB+'%</span></div>'}).join('')+'</div>'+
    (moved.length?'<div class="note warn">'+ICON('rain','sm')+'<span>Pluie '+rdTxt+' : '+(closed.length>1?'les carrières seront fermées':'la '+closed[0]+' sera fermée')+'. Je propose de basculer '+(moved.length>1?'les '+moved.length+' reprises':'la reprise')+' au '+low(indoor.name)+'.</span></div><button class="btn sm" data-wx>Basculer '+(moved.length>1?'les reprises':'la reprise')+'</button>':
      '<div class="note">'+ICON('sun','sm')+'<span>Aucune reprise en extérieur menacée par la pluie cette semaine.</span></div>')+'</div></div>'}
  h+='</div></div>';
  el.innerHTML=h;

  el.addEventListener('click',function(e){var b=e.target.closest('[data-fin]');if(!b)return;var n=+b.getAttribute('data-fin'),bd=el.querySelector('[data-finbody]');if(!bd)return;bd.innerHTML=fin(n);el.querySelector('[data-finsub]').textContent=n===12?'12 derniers mois':n===3?'Septembre à novembre 2026':'Novembre 2026, semaine par semaine'});
  el.querySelector('[data-relance]')&&(el.querySelector('[data-relance]').onclick=function(e){var bt=e.target.closest('button');bt.innerHTML=ICON('check','sm')+'Relances envoyées';bt.disabled=true;P.toast(late.length+' relances envoyées par e-mail et SMS',{undo:function(){bt.innerHTML=ICON('send','sm')+'Envoyer les relances';bt.disabled=false;P.toast('Relances annulées',{icon:'refresh'})}})});
  el.querySelector('[data-cmd]')&&(el.querySelector('[data-cmd]').onclick=function(e){var bt=e.target.closest('button');bt.textContent='Commande envoyée';bt.disabled=true;P.toast('Commande de '+shav.min+' '+shav.unit+' envoyée à '+shav.supplier+', livraison jeudi')});
  el.querySelector('[data-wx]')&&(el.querySelector('[data-wx]').onclick=function(e){var bt=e.target;bt.textContent=moved.length>1?moved.length+' reprises basculées':'Reprise basculée';bt.disabled=true;P.toast((moved.length>1?moved.length+' reprises déplacées':'Reprise déplacée')+' au '+low(indoor.name)+', cavaliers prévenus')});
  el.querySelector('[data-new]').onclick=function(){P.sheet({title:'Créer',icon:'plus',body:'<div class="g2 rise" style="--g:10px">'+[['planning','Une reprise ou un stage','planning'],['members','Un adhérent','adherents'],['horse','Un cheval','chevaux'],['invoice','Une facture','facturation'],['contract','Un contrat à signer','contrats'],['care','Un soin','soins'],['upkeep','Une tâche','entretien'],['compet','Un concours','competitions']].map(function(x){return '<button class="card pad hover hrow" style="padding:14px" data-go="'+x[2]+'"><span class="av sq" style="--c:var(--acc-pale);color:var(--acc)">'+ICON(x[0])+'</span><b class="s">'+x[1]+'</b></button>'}).join('')+'</div>'})};
  el.querySelector('[data-edit]').onclick=function(){P.sheet({title:'Personnaliser l’accueil',icon:'sliders',body:'<p class="s mut" style="margin-bottom:14px">Choisissez les blocs de votre page d’accueil. Chaque membre de l’équipe a la sienne.</p><div class="card list">'+WIDGETS.map(function(w){return '<div class="li"><div class="grow b s">'+w[1]+'</div>'+U.tog(on.indexOf(w[0])>=0,'w-'+w[0])+'</div>'}).join('')+'</div>',
    foot:'<button class="btn pri" data-save>Enregistrer</button>'});var sh=P.$('.sheet',P.app());sh.querySelector('[data-save]').onclick=function(){var l=WIDGETS.filter(function(w){return sh.querySelector('#w-'+w[0]).getAttribute('aria-checked')==='true'}).map(function(w){return w[0]});P.prefs.set('cockpit:widgets',l);sh.close();P.rerender();P.toast('Accueil mis à jour')}};
 }});

P.actions.push({role:'gerant',label:'Envoyer les relances d’impayés',icon:'send',run:function(){var n=lateInv().length;P.toast(n+' relances envoyées par e-mail et SMS')}},{role:'gerant',label:'Personnaliser mon accueil',icon:'sliders',run:function(){P.go('cockpit')}});
P.brain.push({role:'gerant',re:/pay|impay|relan|retard/i,reply:function(){var l=lateInv();return {text:l.length+' factures sont en retard pour '+F.eur(l.reduce(function(a,i){return a+i.amount},0))+'. Les trois plus anciennes :',card:l.slice().sort(function(a,b){return a.due<b.due?-1:1}).slice(0,3).map(function(i){return '<div class="hrow sp"><span class="s">'+D.name(i.member)+'</span><b class="s num">'+F.eur(i.amount)+'</b></div>'}).join(''),actions:[{label:'Relancer les '+l.length,run:function(){P.toast(l.length+' relances envoyées');return l.length+' relances envoyées'}},{label:'Voir les factures',run:function(){P.go('facturation');return 'Ouvert'}}]}}});
P.tourSteps.push({route:'cockpit',title:'Le matin, tout tient sur un écran',text:'Le gérant ouvre Piaffe et voit ce qui compte : chevaux à surveiller, chevaux déclarés à valider, reprises et pistes de la journée, argent à encaisser. L’assistant a déjà préparé les actions, il suffit de valider.'});
})();
