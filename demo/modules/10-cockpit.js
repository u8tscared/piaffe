/* Vue gérant · Aujourd'hui (module de référence pour les autres écrans) */
(function(){
var D=P.D,F=P.fmt,U=P.ui,C=P.chart;
P.css(`
.ck-hero{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);gap:14px}
.ck-brief{padding:22px;display:flex;flex-direction:column;gap:16px;overflow:hidden}
.ck-brief h2{font-size:24px;line-height:1.15;letter-spacing:-.03em;color:var(--navy-ink)}
.ck-brief .pts{display:grid;gap:8px}
.ck-brief .pt{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;color:color-mix(in srgb,var(--navy-ink) 82%,transparent)}
.ck-brief .pt b{color:var(--navy-ink)}
.ck-brief .pt svg.i{color:var(--strass);margin-top:1px}
.ck-brief .glow{position:absolute;right:-60px;top:-60px;width:240px;height:240px;border-radius:50%;background:radial-gradient(circle,rgba(111,140,255,.45),transparent 65%);pointer-events:none}
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
.ck-alert{display:flex;gap:12px;align-items:center;padding:11px 16px;cursor:pointer}
.ck-alert+.ck-alert{border-top:1px solid var(--line)}
.ck-alert:hover{background:var(--surface-2)}
.ck-edit{outline:2px dashed var(--acc-line);outline-offset:4px;border-radius:var(--r-lg)}
@container main (max-width:900px){.ck-hero{grid-template-columns:minmax(0,1fr)}}
`);

var WIDGETS=[['brief','Résumé du matin'],['kpis','Indicateurs'],['lessons','Reprises du jour'],['alerts','À traiter'],['finance','Trésorerie'],['stable','Écurie en direct'],['weather','Météo et carrières']];

P.mod({id:'cockpit',role:'gerant',group:'Pilotage',n:1,title:'Aujourd’hui',icon:'today',phoneTitle:'Bonjour Claire',
 badge:function(){return {v:5,hot:true}},
 render:function(el,ctx){
  var on=P.prefs.get('cockpit:widgets',WIDGETS.map(function(w){return w[0]}));
  var today=D.lessons.filter(function(l){return l.dow===2}),late=D.invoices.filter(function(i){return i.status==='en retard'}),lateSum=late.reduce(function(a,i){return a+i.amount},0);
  var fill=Math.round(D.lessons.reduce(function(a,l){return a+l.riders.length},0)/D.lessons.reduce(function(a,l){return a+l.cap},0)*100);
  var riders=today.reduce(function(a,l){return a+l.riders.length},0),alerts=D.horses.filter(function(h){return h.status!=='ok'});
  var h=U.ph('Bonjour Claire','Mardi 17 novembre · '+today.length+' reprises, '+riders+' cavaliers et 2 rendez-vous de soins aujourd’hui',
    '<button class="btn" data-edit>'+ICON('sliders','sm')+'Personnaliser</button><button class="btn pri" data-new>'+ICON('plus','sm')+'Créer</button>');
  h+='<div class="stack rise" style="--g:14px">';

  if(on.indexOf('brief')>=0)h+='<div class="ck-hero" data-w="brief"><div class="card navy ck-brief"><div class="glow"></div><div class="hrow"><span class="strass" style="background:var(--strass)"></span><span class="eyebrow" style="color:var(--strass)">Résumé du matin, préparé par l’assistant</span></div>'+
    '<h2>Journée chargée mais sous contrôle. Deux chevaux demandent votre attention avant 14 h.</h2><div class="pts">'+
    '<div class="pt">'+ICON('horse')+'<span><b>Xanthos (B23)</b> boit 40 % de moins depuis hier soir. Mamadou le surveille toutes les deux heures.</span></div>'+
    '<div class="pt">'+ICON('care')+'<span><b>Tornado</b> voit le Dr Leclerc à 14 h pour sa boiterie. Lucie le prépare à 13 h 45.</span></div>'+
    '<div class="pt">'+ICON('invoice')+'<span><b>'+late.length+' factures en retard</b> pour '+F.eur(lateSum)+'. Je peux envoyer les relances maintenant.</span></div>'+
    '<div class="pt">'+ICON('stock')+'<span><b>Copeaux</b> : 4 jours de stock. Une commande de 60 sacs est prête à valider.</span></div></div>'+
    '<div class="hrow wrap"><button class="btn sm" style="background:var(--acc);color:#fff;box-shadow:none" data-relance>'+ICON('send','sm')+'Envoyer les relances</button><button class="btn sm" style="background:rgba(255,255,255,.1);color:var(--navy-ink);box-shadow:none" data-cmd>Valider la commande de copeaux</button></div></div>'+
    '<div class="card"><div class="ch"><h3>Écurie en direct</h3><button class="btn ghost sm" data-go="ecurie3d">Ouvrir le plan 3D'+ICON('arrow','sm')+'</button></div><div class="cb stack" style="--g:14px">'+
      '<div class="hrow" style="--g:16px">'+U.ring(Math.round(44/46*100),'44/46','var(--acc)',64)+'<div class="stack" style="--g:4px"><b>44 boxes occupés</b><span class="s mut">2 libres : B45, B46 · 3 demandes de pension en attente</span></div></div>'+
      '<div class="g3" style="--g:8px">'+[['Au box',27,'stable'],['Au paddock',13,'paddock'],['Au travail',4,'arena']].map(function(x){return '<div class="card soft" style="padding:10px 12px"><div class="xs mut hrow" style="--g:6px">'+ICON(x[2],'sm')+x[0]+'</div><div class="disp" style="font-size:22px;font-weight:700"><span data-count="'+x[1]+'">'+x[1]+'</span></div></div>'}).join('')+'</div>'+
      '<div class="hrow wrap" style="--g:6px">'+D.sensors.slice(0,4).map(function(s){return U.chip(s.name+' · '+s.val,s.state==='ok'?'':'warn',true)}).join('')+'</div></div></div></div>';

  if(on.indexOf('kpis')>=0)h+='<div class="g4" data-w="kpis">'+
    U.kpi({label:'Chiffre d’affaires de novembre',count:49600,fmt:'eur',value:F.eur(49600),delta:'+8,4 %',dsub:' vs nov. 2025',spark:D.revenue,icon:'euro'})+
    U.kpi({label:'Encaissé aujourd’hui',count:5396,fmt:'eur',value:F.eur(5396),delta:'20 paiements',spark:[2,4,3,6,5,8,7,9],icon:'card'})+
    U.kpi({label:'Remplissage des reprises, cette semaine',count:fill,unit:'%',delta:'+3 pts',spark:D.occupancy.slice(0,11).concat([fill]),icon:'planning'})+
    U.kpi({label:'Adhérents actifs',count:148,delta:'+3 cette semaine',spark:[131,133,136,138,139,141,144,145,148],icon:'members'})+'</div>';

  h+='<div class="g3">';
  if(on.indexOf('lessons')>=0)h+='<div class="card span2" data-w="lessons"><div class="ch"><h3>Reprises d’aujourd’hui</h3><div class="hrow" style="--g:6px"><span class="chip acc dot">En cours : 10 h</span><button class="btn ghost sm" data-go="planning">Planning'+ICON('arrow','sm')+'</button></div></div><div class="ck-les" style="padding:8px 0">'+
    today.map(function(l,i){var c=D.staffer(l.coach),ar=D.club.arenas.find(function(a){return a.id===l.arena}),full=l.riders.length>=l.cap;
      return '<div class="ck-l'+(i===0?' now':'')+'" data-go="planning" data-id="'+l.id+'"><div class="tm">'+l.start+'<small>'+l.dur+' min</small></div><span class="st" style="--c:'+c.color+'"></span><div style="min-width:0"><div class="b ellip">'+l.title+'</div><div class="s mut ellip">'+c.first+' · '+ar.name+'</div></div><div class="hrow" style="--g:10px">'+U.avs(l.riders,3)+'<span class="chip '+(full?'warn':'')+'">'+l.riders.length+'/'+l.cap+'</span></div></div>'}).join('')+'</div></div>';
  if(on.indexOf('alerts')>=0)h+='<div class="card" data-w="alerts"><div class="ch"><h3>À traiter</h3><span class="chip bad">'+(alerts.length+3)+'</span></div><div style="padding:6px 0">'+
    alerts.slice(0,5).map(function(x){return '<div class="ck-alert" data-go="cheval" data-id="'+x.id+'">'+U.hav(x)+'<div class="grow"><div class="b s">'+x.name+' <span class="mut" style="font-weight:500">· '+x.box+'</span></div><div class="xs mut ellip">'+x.alerts[0]+'</div></div>'+U.chip(x.status==='bad'?'Urgent':'À voir',x.status==='bad'?'bad':'warn')+'</div>'}).join('')+
    '<div class="ck-alert" data-go="contrats">'+'<span class="av sq" style="--c:var(--acc-pale);color:var(--acc)">'+ICON('contract','sm')+'</span><div class="grow"><div class="b s">3 contrats à signer</div><div class="xs mut">Demi-pension d’Ulysse, inscription Laurent…</div></div>'+ICON('right','sm')+'</div></div></div>';
  h+='</div>';

  h+='<div class="g3">';
  if(on.indexOf('finance')>=0)h+='<div class="card span2" data-w="finance"><div class="ch"><div><h3>Recettes et dépenses</h3><div class="xs mut">12 derniers mois</div></div>'+U.seg([['12m','12 mois'],['t','Trimestre'],['m','Mois']],'12m')+'</div><div class="cb">'+
    C.line([{v:D.revenue,c:'var(--acc)',area:true,name:'Recettes'},{v:D.costs,c:'var(--c2)',name:'Dépenses'}],D.months,{fmt:function(v){return Math.round(v/1000)+' k'},h:210})+
    '<div class="hrow sp wrap" style="margin-top:10px">'+C.legend([['Recettes','var(--acc)'],['Dépenses','var(--c2)']])+'<span class="s"><b class="okc">+'+F.eur(D.revenue.reduce(function(a,b){return a+b})-D.costs.reduce(function(a,b){return a+b}))+'</b> <span class="mut">de résultat sur 12 mois</span></span></div></div></div>';
  if(on.indexOf('weather')>=0)h+='<div class="card" data-w="weather"><div class="ch"><h3>Météo et carrières</h3><span class="xs mut">'+D.club.city.split('-')[0]+'</span></div><div class="cb stack" style="--g:14px"><div class="ck-wx">'+
    D.weather.map(function(w){return '<div><span class="xs mut">'+w.d+'</span>'+ICON(w.i)+'<b>'+w.t+'°</b><span class="xs '+(w.r>50?'acc':'mut')+'">'+w.r+' %</span></div>'}).join('')+'</div>'+
    '<div class="note warn">'+ICON('rain','sm')+'<span>Pluie jeudi et vendredi : la carrière d’honneur sera fermée. Je propose de basculer les 4 reprises en manège.</span></div><button class="btn sm" data-wx>Basculer les reprises</button></div></div>';
  h+='</div></div>';
  el.innerHTML=h;

  el.querySelector('[data-relance]')&&(el.querySelector('[data-relance]').onclick=function(e){e.target.closest('button').innerHTML=ICON('check','sm')+'Relances envoyées';P.toast(late.length+' relances envoyées par e-mail et SMS',{undo:function(){P.toast('Relances annulées',{icon:'refresh'})}})});
  el.querySelector('[data-cmd]')&&(el.querySelector('[data-cmd]').onclick=function(e){e.target.closest('button').textContent='Commande envoyée';P.toast('Commande de 60 sacs envoyée à Litière Pro, livraison jeudi')});
  el.querySelector('[data-wx]')&&(el.querySelector('[data-wx]').onclick=function(e){e.target.textContent='4 reprises basculées';e.target.disabled=true;P.toast('4 reprises déplacées au Grand manège, cavaliers prévenus')});
  el.querySelector('[data-new]').onclick=function(){P.sheet({title:'Créer',icon:'plus',body:'<div class="g2 rise" style="--g:10px">'+[['planning','Une reprise ou un stage','planning'],['members','Un adhérent','adherents'],['horse','Un cheval','chevaux'],['invoice','Une facture','facturation'],['contract','Un contrat à signer','contrats'],['care','Un soin','soins'],['upkeep','Une tâche','entretien'],['compet','Un concours','competitions']].map(function(x){return '<button class="card pad hover hrow" style="padding:14px" data-go="'+x[2]+'"><span class="av sq" style="--c:var(--acc-pale);color:var(--acc)">'+ICON(x[0])+'</span><b class="s">'+x[1]+'</b></button>'}).join('')+'</div>'})};
  el.querySelector('[data-edit]').onclick=function(){P.sheet({title:'Personnaliser l’accueil',icon:'sliders',body:'<p class="s mut" style="margin-bottom:14px">Choisissez les blocs de votre page d’accueil. Chaque membre de l’équipe a la sienne.</p><div class="card list">'+WIDGETS.map(function(w){return '<div class="li"><div class="grow b s">'+w[1]+'</div>'+U.tog(on.indexOf(w[0])>=0,'w-'+w[0])+'</div>'}).join('')+'</div>',
    foot:'<button class="btn pri" data-save>Enregistrer</button>'});var sh=P.$('.sheet',P.app());sh.querySelector('[data-save]').onclick=function(){var l=WIDGETS.filter(function(w){return sh.querySelector('#w-'+w[0]).getAttribute('aria-checked')==='true'}).map(function(w){return w[0]});P.prefs.set('cockpit:widgets',l);sh.close();P.rerender();P.toast('Accueil mis à jour')}};
 }});

P.actions.push({role:'gerant',label:'Envoyer les relances d’impayés',icon:'send',run:function(){P.toast('Relances envoyées')}},{role:'gerant',label:'Personnaliser mon accueil',icon:'sliders',run:function(){P.go('cockpit')}});
P.brain.push({role:'gerant',re:/pay|impay|relan|retard/i,reply:function(){var l=D.invoices.filter(function(i){return i.status==='en retard'});return {text:l.length+' factures sont en retard pour '+F.eur(l.reduce(function(a,i){return a+i.amount},0))+'. Les trois plus anciennes :',card:l.slice(0,3).map(function(i){return '<div class="hrow sp"><span class="s">'+D.name(i.member)+'</span><b class="s num">'+F.eur(i.amount)+'</b></div>'}).join(''),actions:[{label:'Relancer les '+l.length,run:function(){P.toast(l.length+' relances envoyées');return l.length+' relances envoyées'}},{label:'Voir les factures',run:function(){P.go('facturation');return 'Ouvert'}}]}}});
P.tourSteps.push({route:'cockpit',title:'Le matin, tout tient sur un écran',text:'Le gérant ouvre Piaffe et voit ce qui compte : chevaux à surveiller, reprises, argent à encaisser. L’assistant a déjà préparé les actions, il suffit de valider.'});
})();
