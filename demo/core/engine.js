/* =====================================================================
   PIAFFE · Moteur de la démo
   Rôles, navigation, appareils, palette ⌘K, feuilles, notifications,
   assistant, personnalisation, graphiques et cheval 3D.
   API publique : window.P (voir demo/MODULES.md)
   ===================================================================== */
(function(){
var D=window.DATA,$=function(s,r){return (r||document).querySelector(s)},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s))};
var RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
var P=window.P={D:D,mods:{},order:[],icon:ICON,logo:LOGO,$:$,$$:$$,RM:RM};

/* ---------- Styles propres à un module ---------- */
P.css=function(css){var st=document.createElement('style');st.textContent=css;document.head.appendChild(st)};

/* ---------- Stockage local (confort seulement) ---------- */
P.store={get:function(k,d){try{var v=localStorage.getItem('piaffe:'+k);return v==null?d:JSON.parse(v)}catch(e){return d}},
         set:function(k,v){try{localStorage.setItem('piaffe:'+k,JSON.stringify(v))}catch(e){}}};

/* ---------- Format ---------- */
var MO=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'],MOL=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'],DW=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
function toD(x){return x instanceof Date?x:new Date(String(x).length<=10?x+'T12:00:00':x)}
P.fmt={
  eur:function(v,dec){var n=Number(v)||0,neg=n<0;n=Math.abs(n);var s=n.toLocaleString('fr-FR',{minimumFractionDigits:dec?2:0,maximumFractionDigits:dec?2:0});return (neg?'−':'')+s.replace(/[\u202f\u2009]/g,'\u00a0')+'\u00a0€'},
  num:function(v,d){return (Number(v)||0).toLocaleString('fr-FR',{maximumFractionDigits:d||0})},
  pct:function(v){return Math.round(v)+' %'},
  date:function(x){var d=toD(x);return (d.getDate()===1?'1er':d.getDate())+' '+MO[d.getMonth()]},
  dateL:function(x){var d=toD(x);return DW[d.getDay()]+' '+(d.getDate()===1?'1er':d.getDate())+' '+MOL[d.getMonth()]},
  dateY:function(x){var d=toD(x);return (d.getDate()===1?'1er':d.getDate())+' '+MO[d.getMonth()]+' '+d.getFullYear()},
  rel:function(x){var d=toD(x),t=new Date(D.today);t.setHours(12,0,0,0);d.setHours(12,0,0,0);var n=Math.round((d-t)/864e5);
    if(n===0)return 'aujourd’hui';if(n===1)return 'demain';if(n===-1)return 'hier';if(n>1&&n<7)return 'dans '+n+' j';if(n<0&&n>-7)return 'il y a '+(-n)+' j';return P.fmt.date(d)},
  days:function(x){var d=toD(x),t=new Date(D.today);t.setHours(12,0,0,0);d.setHours(12,0,0,0);return Math.round((d-t)/864e5)},
  initials:function(p){return p?((p.first||'')[0]||'')+((p.last||'')[0]||''):'?'},
  esc:function(s){return String(s==null?'':s).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
};
var F=P.fmt;

/* ---------- Petits composants (renvoient du HTML) ---------- */
P.ui={
  av:function(idOrP,cls){var p=typeof idOrP==='string'?D.person(idOrP):idOrP;if(!p)return '';return '<span class="av '+(cls||'')+'" style="--c:'+(p.color||'var(--acc)')+'" title="'+F.esc(p.first+' '+p.last)+'">'+F.initials(p)+'</span>'},
  hav:function(idOrH,cls){var h=typeof idOrH==='string'?D.horse(idOrH):idOrH;if(!h)return '';return '<span class="av horse '+(cls||'')+'" style="--c:'+h.color+'" title="'+F.esc(h.name)+'">'+HORSE_GLYPH()+'</span>'},
  avs:function(ids,max){max=max||4;var s='<span class="avs">';ids.slice(0,max).forEach(function(i){s+=P.ui.av(i,'sm')});if(ids.length>max)s+='<span class="av sm" style="--c:var(--bg-2);color:var(--ink-2)">+'+(ids.length-max)+'</span>';return s+'</span>'},
  chip:function(txt,k,dot){return '<span class="chip '+(k||'')+(dot?' dot':'')+'">'+txt+'</span>'},
  status:function(s){var m={'payée':'ok','signé':'ok','fait':'ok','ok':'ok','Actif':'ok','actif':'ok','en retard':'bad','bad':'bad','à signer':'acc','envoyée':'acc','planifié':'acc','à faire':'warn','warn':'warn','en cours':'warn','brouillon':'','à venir':'','Essai':'warn'};return P.ui.chip(s,m[s]||'',true)},
  kpi:function(o){/* {label, value, unit, delta, up, spark:[...], icon, count} */
    var dl=o.delta!=null?'<div class="del '+(o.up===false?'down':'up')+'">'+(o.up===null?'':ICON(o.up===false?'down':'up','sm'))+o.delta+(o.dsub?'<span class="mut" style="font-weight:500">'+o.dsub+'</span>':'')+'</div>':'';
    var val=o.count!=null?'<span data-count="'+o.count+'" data-fmt="'+(o.fmt||'')+'">'+(o.value!=null?o.value:o.count)+'</span>':o.value;
    var dc=o.dom?' d-'+o.dom:'',il=o.illu&&window.ILLU&&ILLU[o.illu]?ILLU[o.illu]():'';
    return '<div class="card kpi'+dc+(o.tint?' tint':'')+(il?' has-illu':'')+'">'+il+'<div class="lab">'+(o.icon?ICON(o.icon,'sm'):'')+o.label+'</div><div class="val num">'+val+(o.unit?'<small>'+o.unit+'</small>':'')+'</div>'+dl+(o.spark?P.chart.spark(o.spark,o.color):'')+'</div>'},
  bar:function(v,c){return '<div class="bar"><i style="--v:'+Math.max(0,Math.min(100,v))+'%;'+(c?'--c:'+c:'')+'"></i></div>'},
  ring:function(v,l,c,s){return '<span class="ring" style="--v:'+v+';'+(c?'--c:'+c+';':'')+(s?'--s:'+s+'px':'')+'" data-l="'+(l==null?Math.round(v)+'\u00a0%':l)+'"></span>'},
  empty:function(icon,title,sub,btn){return '<div class="empty">'+ICON(icon||'info')+'<b style="color:var(--ink)">'+title+'</b>'+(sub?'<span class="s">'+sub+'</span>':'')+(btn||'')+'</div>'},
  tog:function(on,id){return '<button class="tog" role="switch" aria-checked="'+(on?'true':'false')+'"'+(id?' id="'+id+'"':'')+'></button>'},
  chk:function(on,id){return '<button class="chk" role="checkbox" aria-checked="'+(on?'true':'false')+'"'+(id?' data-id="'+id+'"':'')+'><svg viewBox="0 0 24 24"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg></button>'},
  seg:function(items,sel,attr){attr=attr||'data-seg';return '<div class="seg" role="tablist">'+items.map(function(it){var v=typeof it==='string'?it:it[0],l=typeof it==='string'?it:it[1];return '<button role="tab" '+attr+'="'+v+'" aria-selected="'+(v===sel)+'">'+l+'</button>'}).join('')+'</div>'},
  tabs:function(items,sel,attr){attr=attr||'data-tab';return '<div class="tabs" role="tablist">'+items.map(function(it){var v=typeof it==='string'?it:it[0],l=typeof it==='string'?it:it[1];return '<button role="tab" '+attr+'="'+v+'" aria-selected="'+(v===sel)+'">'+l+'</button>'}).join('')+'</div>'},
  ph:function(title,sub,acts){return '<div class="ph"><div class="grow"><h1>'+title+'</h1>'+(sub?'<div class="sub">'+sub+'</div>':'')+'</div>'+(acts?'<div class="acts">'+acts+'</div>':'')+'</div>'},
  table:function(cols,rows,o){/* cols:[{k,l,n(right),w,f(row)}] */o=o||{};
    var h='<div class="tw'+(o.card===false?'':' card')+'"><table class="tbl"><thead><tr>'+cols.map(function(c){return '<th class="'+(c.n?'n ':'')+(c.hide?'hide-s':'')+'"'+(c.w?' style="width:'+c.w+'"':'')+'>'+c.l+'</th>'}).join('')+'</tr></thead><tbody>';
    rows.forEach(function(r){h+='<tr'+(o.click?' class="click" data-row="'+F.esc(r[o.key||'id'])+'"':'')+'>'+cols.map(function(c){var v=c.f?c.f(r):F.esc(r[c.k]);return '<td class="'+(c.n?'n ':'')+(c.hide?'hide-s':'')+'">'+v+'</td>'}).join('')+'</tr>'});
    return h+'</tbody></table></div>'},
  weatherIcon:function(i){return ICON(i)}
};

/* ---------- Graphiques SVG ----------
   Le texte vise 13 px à l'écran : sur téléphone la largeur logique passe de 640 à 360,
   la marge gauche suit la longueur des libellés et les étiquettes trop serrées s'espacent.
   Après insertion, P.fitCharts pose --cs pour compenser une carte plus étroite que prévu. */
var CH={fs:13,head:1.3};
function chW(){return app&&app.classList.contains('mobile')?360:640}
function txtW(t){return String(t).replace(/<[^>]*>/g,'').length*CH.fs*CH.head*.6}
function every(labels,room){var mx=0;labels.forEach(function(l){mx=Math.max(mx,txtW(l))});var fit=Math.max(1,Math.floor(room/(mx+10)));return Math.max(1,Math.ceil(labels.length/fit))}
P.chart={
  spark:function(v,col){var w=120,h=40,mx=Math.max.apply(null,v),mn=Math.min.apply(null,v),rg=mx-mn||1,pts=v.map(function(y,i){return [i/(v.length-1)*w,h-4-(y-mn)/rg*(h-10)]});
    var d='M'+pts.map(function(p){return p[0].toFixed(1)+' '+p[1].toFixed(1)}).join('L'),c=col||'var(--acc)',last=pts[pts.length-1];
    return '<svg class="spark chart" viewBox="0 0 '+w+' '+h+'" preserveAspectRatio="none"><path d="'+d+'L'+w+' '+h+'L0 '+h+'Z" class="area" fill="'+c+'"/><path d="'+d+'" class="ln draw" stroke="'+c+'" style="--len:400;stroke-width:2.5" vector-effect="non-scaling-stroke"/><path d="M'+last[0].toFixed(1)+' '+last[1].toFixed(1)+'h0" stroke="'+c+'" stroke-width="8" stroke-linecap="round" vector-effect="non-scaling-stroke"/></svg>'},
  line:function(series,labels,o){/* series:[{v:[],c,name,area,dash}] */o=o||{};var w=chW(),h=o.h||220,pt=14,pb=CH.fs*CH.head+14,all=[].concat.apply([],series.map(function(s){return s.v})),mx=o.max||Math.max.apply(null,all)*1.08,mn=o.min!=null?o.min:0;
    var yl=[];for(var k=0;k<=4;k++)yl.push(o.fmt?o.fmt(mn+(mx-mn)*k/4):F.num(mn+(mx-mn)*k/4));
    var pl=Math.ceil(Math.max.apply(null,yl.map(txtW)))+12,pr=10;
    var X=function(i){return pl+(labels.length>1?i/(labels.length-1):.5)*(w-pl-pr)},Y=function(v){return pt+(1-(v-mn)/(mx-mn||1))*(h-pt-pb)};
    var g='';yl.forEach(function(t,k){var y=Y(mn+(mx-mn)*k/4);g+='<line class="grid'+(k?'':' base')+'" x1="'+pl+'" x2="'+(w-pr)+'" y1="'+y+'" y2="'+y+'"/><text x="'+(pl-10)+'" y="'+(y+4.5)+'" text-anchor="end">'+t+'</text>'});
    var st=every(labels,w-pl-pr);labels.forEach(function(l,i){if(i%st)return;var x=X(i),an=i===0&&labels.length>1?'start':(i===labels.length-1&&labels.length>1?'end':'middle');g+='<text x="'+x+'" y="'+(h-6)+'" text-anchor="'+an+'">'+l+'</text>'});
    series.forEach(function(s){var d='M'+s.v.map(function(v,i){return X(i).toFixed(1)+' '+Y(v).toFixed(1)}).join('L');
      if(s.area)g+='<path class="area" fill="'+s.c+'" d="'+d+'L'+X(s.v.length-1)+' '+Y(mn)+'L'+X(0)+' '+Y(mn)+'Z"/>';
      g+='<path class="ln draw" stroke="'+s.c+'" d="'+d+'" style="--len:1800'+(s.dash?';stroke-dasharray:5 6;animation:none;stroke-width:2.2':'')+'"/>';
      var li=s.v.length-1;g+='<circle class="dot" cx="'+X(li)+'" cy="'+Y(s.v[li])+'" r="5.5" fill="var(--surface)" stroke="'+s.c+'" stroke-width="3"/>'});
    return '<svg class="chart" data-vw="'+w+'" viewBox="0 0 '+w+' '+h+'" role="img">'+g+'</svg>'},
  bars:function(vals,labels,o){o=o||{};var w=chW(),h=o.h||200,pt=14,pb=CH.fs*CH.head+14,mx=o.max||Math.max.apply(null,vals.map(function(v){return Array.isArray(v)?v.reduce(function(a,b){return a+b},0):v}))*1.1||1;
    var yl=[];for(var k=0;k<=4;k++)yl.push(o.fmt?o.fmt(mx*k/4):F.num(mx*k/4));
    var pl=Math.ceil(Math.max.apply(null,yl.map(txtW)))+12,pr=8,n=vals.length,bw=(w-pl-pr)/n,g='',st=every(labels,w-pl-pr);
    yl.forEach(function(t,k){var y=pt+(1-k/4)*(h-pt-pb);g+='<line class="grid'+(k?'':' base')+'" x1="'+pl+'" x2="'+(w-pr)+'" y1="'+y+'" y2="'+y+'"/><text x="'+(pl-10)+'" y="'+(y+4.5)+'" text-anchor="end">'+t+'</text>'});
    vals.forEach(function(v,i){var parts=Array.isArray(v)?v:[v],base=h-pb,bwi=Math.min(bw*.66,46),x=pl+i*bw+(bw-bwi)/2;parts.forEach(function(pv,j){var bh=pv/mx*(h-pt-pb);base-=bh;g+='<rect class="cbar" style="--i:'+i+'" x="'+x+'" y="'+base+'" width="'+bwi+'" height="'+Math.max(0,bh)+'" rx="'+(j===parts.length-1?Math.min(7,bwi/3):0)+'" fill="'+((o.colors||['var(--acc)','var(--c2)','var(--c3)','var(--c4)'])[j])+'"'+(o.hi!=null&&o.hi!==i?' opacity=".32"':'')+'/>'});
      if((i%st===0&&(o.hi==null||Math.abs(i-o.hi)>=st))||o.hi===i)g+='<text x="'+(x+bwi/2)+'" y="'+(h-6)+'" text-anchor="middle"'+(o.hi===i?' class="cv"':'')+'>'+labels[i]+'</text>'});
    return '<svg class="chart" data-vw="'+w+'" viewBox="0 0 '+w+' '+h+'" role="img">'+g+'</svg>'},
  donut:function(parts,o){o=o||{};var s=o.size||150,sw=o.w||18,r=s/2-sw/2-2,C=2*Math.PI*r,tot=parts.reduce(function(a,p){return a+p.v},0)||1,off=0,g='';
    parts.forEach(function(p,i){var L=p.v/tot*C;g+='<circle cx="'+s/2+'" cy="'+s/2+'" r="'+r+'" fill="none" stroke="'+p.c+'" stroke-width="'+sw+'" stroke-dasharray="'+Math.max(0,L-2.5)+' '+C+'" stroke-dashoffset="'+(-off)+'" transform="rotate(-90 '+s/2+' '+s/2+')" style="transition:stroke-dasharray .8s var(--e-out)"/>';off+=L});
    return '<svg class="chart" width="'+s+'" height="'+s+'" viewBox="0 0 '+s+' '+s+'" style="width:'+s+'px;flex:none">'+'<circle cx="'+s/2+'" cy="'+s/2+'" r="'+r+'" fill="none" stroke="var(--bg-2)" stroke-width="'+sw+'"/>'+g+(o.center?'<text x="50%" y="'+(o.sub?s/2-7:s/2)+'" text-anchor="middle" dominant-baseline="central" style="font:800 '+Math.round(Math.max(20,s/6.2))+'px var(--f-display);fill:var(--ink);letter-spacing:-.03em">'+o.center+'</text>':'')+(o.sub?'<text x="50%" y="'+(s/2+Math.max(15,s/8.5))+'" text-anchor="middle" style="font-size:13px">'+o.sub+'</text>':'')+'</svg>'},
  legend:function(items){return '<div class="legend">'+items.map(function(i){return '<span><i style="--c:'+i[1]+'"></i>'+i[0]+'</span>'}).join('')+'</div>'}
};
/* garde le texte des graphiques lisible quand la carte est plus étroite que la largeur logique */
P.fitCharts=function(root){$$('svg.chart[data-vw]',root||app).forEach(function(sv){var rw=sv.getBoundingClientRect().width;if(!rw)return;var k=(+sv.getAttribute('data-vw'))/rw,cs=Math.max(.9,Math.min(CH.head,k*.96));sv.style.setProperty('--cs',cs.toFixed(3))})};

/* ---------- Rôles ---------- */
P.roles={
  gerant:{label:'Gérant',icon:'today',who:'s01',home:'cockpit',tabs:['cockpit','planning','chevaux','adherents']},
  employe:{label:'Employé',icon:'upkeep',who:'s05',home:'emp-jour',tabs:['emp-jour','emp-tournee','emp-chevaux','emp-planning']},
  adherent:{label:'Adhérent',icon:'members',who:'m001',home:'adh-accueil',tabs:['adh-accueil','adh-reserver','adh-cheval','adh-paiements']},
  coach:{label:'Coach',icon:'coach',who:'c01',home:'coach-agenda',tabs:['coach-agenda','coach-eleves','coach-dispo','coach-revenus']}
};
P.groups={gerant:['Pilotage','Écurie','Club','Argent','Équipe','Plateforme'],employe:['Ma journée','Écurie','Moi'],adherent:['Moi','Équitation','Cheval','Compte'],coach:['Coaching','Compte']};

/* ---------- Domaines : couleur de chaque écran (rail, onglets, palette, en-tête) ---------- */
/* clés : acc (pilotage), hz (chevaux), rd (cavaliers), mo (argent), tm (équipe), cr (soins), pf (plateforme) */
P.domGroups={'Pilotage':'acc','Écurie':'hz','Club':'rd','Argent':'mo','Équipe':'tm','Plateforme':'pf','Ma journée':'acc','Moi':'tm','Équitation':'rd','Cheval':'hz','Compte':'mo','Coaching':'rd'};
P.domMods={'soins':'cr','emp-soins':'cr','emp-signaler':'cr','adh-accueil':'acc','adh-bienvenue':'acc','adh-progression':'rd','adh-profil':'pf','coach-profil':'pf','adh-messages':'tm','emp-messages':'tm','communication':'tm','coach-revenus':'mo','coach-concours':'rd'};
P.domOf=function(m){if(typeof m==='string')m=P.mods[m];if(!m)return 'acc';return m.dom||P.domMods[m.id]||P.domGroups[m.group]||'acc'};
var GICON={'Pilotage':'today','Écurie':'horse','Club':'members','Argent':'euro','Équipe':'team','Plateforme':'plug','Ma journée':'today','Moi':'user','Équitation':'jump','Cheval':'horse','Compte':'wallet','Coaching':'whistle'};

/* ---------- Registre des modules ---------- */
/* P.mod({id, role, group, title, icon, sub, badge, tab, phoneTitle, render(el,ctx), wide}) */
P.mod=function(m){m.badge=m.badge||null;P.mods[m.id]=m;P.order.push(m.id);return m};
P.modsFor=function(role,all){var off=P.prefs.off(role),G=P.groups[role]||[];return P.order.map(function(i,k){return P.mods[i]}).filter(function(m){return m.role===role&&(all||off.indexOf(m.id)<0)&&!m.hidden}).sort(function(a,b){var ga=G.indexOf(a.group),gb=G.indexOf(b.group);if(ga<0)ga=99;if(gb<0)gb=99;return ga-gb||(a.n||50)-(b.n||50)||P.order.indexOf(a.id)-P.order.indexOf(b.id)})};

/* ---------- Préférences et personnalisation ---------- */
P.prefs={
  off:function(role){return P.store.get('off:'+role,[])},
  setOff:function(role,list){P.store.set('off:'+role,list);P.renderShell()},
  get:function(k,d){return P.store.get('pref:'+k,d)},
  set:function(k,v){P.store.set('pref:'+k,v)}
};

/* ---------- État ---------- */
var S=P.state={role:'gerant',route:null,params:{},dev:P.store.get('dev','desktop'),stack:[]};
function realPhone(){return window.innerWidth<700}
function effDev(){if(realPhone())return 'phone';if(S.dev==='desktop'&&window.innerWidth<1100)return 'tablet-full';return S.dev}

/* ---------- Coque ---------- */
var demo,stage,frame,app,view;
var DEVI={desktop:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="4.5" width="17" height="11.5" rx="2.6"/><path d="M8.5 20h7M12 16v4"/></svg>',tablet:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="4.5" y="3" width="15" height="18" rx="3"/><path d="M11 17.6h2"/></svg>',phone:'<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="2.5" width="10" height="19" rx="3.2"/><path d="M11 18.5h2"/></svg>'};
var HW='<span class="hw cam"></span><span class="hw island"></span><span class="hw homebar"></span>'+
  '<span class="hw dbtn" style="left:-16px;top:150px;height:32px"></span><span class="hw dbtn" style="left:-16px;top:206px;height:62px"></span><span class="hw dbtn" style="left:-16px;top:280px;height:62px"></span><span class="hw dbtn" style="right:-16px;top:236px;height:96px"></span>'+
  '<div class="hw sbar"><span>9:41</span><span class="r"><svg width="19" height="12" viewBox="0 0 19 12" aria-hidden="true"><rect x="0" y="8" width="3.2" height="4" rx="1" fill="currentColor"/><rect x="5" y="5.5" width="3.2" height="6.5" rx="1" fill="currentColor"/><rect x="10" y="3" width="3.2" height="9" rx="1" fill="currentColor"/><rect x="15" y="0" width="3.2" height="12" rx="1" fill="currentColor"/></svg><svg width="17" height="12" viewBox="0 0 17 12" aria-hidden="true"><path d="M8.5 2.2c2.4 0 4.6.9 6.3 2.5l1.2-1.2A10.6 10.6 0 0 0 8.5.5 10.6 10.6 0 0 0 1 3.5l1.2 1.2a9 9 0 0 1 6.3-2.5zm0 3.4c1.5 0 2.9.6 3.9 1.5l1.2-1.2a7.3 7.3 0 0 0-10.2 0l1.2 1.2c1-.9 2.4-1.5 3.9-1.5zm0 3.4c.6 0 1.2.2 1.6.6L8.5 11.2 6.9 9.6c.4-.4 1-.6 1.6-.6z" fill="currentColor"/></svg><svg width="27" height="13" viewBox="0 0 27 13" aria-hidden="true"><rect x=".5" y=".5" width="23" height="12" rx="3.8" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="20" height="9" rx="2.5" fill="currentColor"/><path d="M25 4.5v4c.8-.3 1.3-1.1 1.3-2s-.5-1.7-1.3-2z" fill="currentColor" opacity=".45"/></svg></span></div>';
function buildDemo(){
  /* la page publiée place styles et polices dans <body> : on les met à l'abri dans <head> avant de redessiner */
  Array.prototype.slice.call(document.body.querySelectorAll('style,link,meta,title')).forEach(function(n){document.head.appendChild(n)});
  document.body.innerHTML='<div id="demo"><header class="dbar"><div class="brand">'+LOGO(28,'var(--ink)','var(--strass)',true)+'<span>Piaffe</span><small>Démo</small></div>'+
   '<div class="roles">'+P.ui.seg(Object.keys(P.roles).map(function(k){return [k,ICON(P.roles[k].icon)+'<span class="lbl">'+P.roles[k].label+'</span>']}),S.role,'data-role')+'</div>'+
   '<div class="right"><div class="dev">'+P.ui.seg([['desktop',DEVI.desktop],['tablet',DEVI.tablet],['phone',DEVI.phone]],S.dev,'data-dev')+'</div>'+
   '<button class="btn ghost icon sm" data-theme-t title="Thème clair ou sombre">'+ICON('moon')+'</button>'+
   '<button class="btn sm dark tourb" data-tour>'+ICON('play','sm')+'<span>Visite guidée</span></button></div></header>'+
   '<div class="stage"><div class="frame">'+HW+'<div class="app"></div></div></div></div>';
  demo=$('#demo');stage=$('.stage');frame=$('.frame');app=$('.app');
  $$('[data-dev]',demo).forEach(function(b){b.title={desktop:'Ordinateur',tablet:'Tablette',phone:'Téléphone'}[b.getAttribute('data-dev')]});
}
P.app=function(){return app};
P.isMobile=function(){return app.classList.contains('mobile')};

/* menu latéral : sections nommées, chaque écran sur une ligne (icône, libellé, compteur) ; une section se replie d'un clic sur son titre */
function curTab(){var m=P.mods[S.route];return m&&m.hidden&&m.tab&&P.mods[m.tab]?m.tab:S.route}
function badgeOf(m){var b=typeof m.badge==='function'?m.badge():m.badge;if(!b||(b.v!=null&&!b.v))return null;return b}
function bdgHTML(b){return b?'<span class="bdg'+(b.hot?' hot':'')+'">'+(b.v!=null?b.v:b)+'</span>':''}
function nvHTML(m){var cur=curTab();return '<a href="#'+m.id+'" class="nv d-'+P.domOf(m)+'" data-go="'+m.id+'"'+(cur===m.id?' aria-current="page"':'')+'><span class="pl">'+ICON(m.icon)+'</span><span class="lb">'+m.title+'</span>'+bdgHTML(badgeOf(m))+'</a>'}
function navGroupsOf(){var mods=P.modsFor(S.role),groups=[],by={};mods.forEach(function(m){if(!by[m.group]){by[m.group]=[];groups.push(m.group)}by[m.group].push(m)});return {groups:groups,by:by}}
function sumB(l){var n=0,hot=false;l.forEach(function(m){var b=badgeOf(m);if(b){if(b.hot)hot=true;if(typeof b.v==='number')n+=b.v}});return n?{v:n,hot:hot}:null}
function gdom(g,l){return P.domGroups[g]||P.domOf(l[0])}
/* cinq dispositions du menu, à comparer : sections, accordeon, colonnes, survol, onglets */
P.navModes=[['sections','Sections ouvertes','Tout est visible, rangé par section. Un clic sur un titre replie la section.'],['accordeon','Accordéon','Une seule section ouverte à la fois : un clic sur Écurie déplie ses écrans et referme les autres.'],['colonnes','Deux colonnes','À gauche les sections en grandes pastilles, à côté les écrans de la section choisie, comme Slack ou Notion.'],['survol','Menu flottant','Un menu court, une ligne par section. Au survol ou au clic, une carte s’ouvre à côté avec ses écrans.'],['onglets','Sections et onglets','Le menu ne montre que les sections. Les écrans de la section s’affichent en onglets en haut de la page.']];
P.navMode=function(){var m=P.store.get('navmode','accordeon');return P.navModes.some(function(x){return x[0]===m})?m:'accordeon'};
function secRow(g,l,on,attr,extra){var b=sumB(l);return '<button class="sec d-'+gdom(g,l)+(on?' on':'')+'" '+attr+'><span class="pl">'+ICON(GICON[g]||l[0].icon)+'</span><span class="lb">'+g+'</span>'+bdgHTML(b)+(extra||'')+'</button>'}
function navHTML(){var role=S.role,cur=P.mods[curTab()]||{},h='',G=navGroupsOf(),groups=G.groups,by=G.by,mode=P.navMode();
  if(mode==='accordeon'){var open=S.navOpen?S.navOpen:cur.group;
    groups.forEach(function(g){var l=by[g],on=g===open&&l.length>1;h+='<div class="acc-g d-'+gdom(g,l)+(on?' open':'')+'">'+secRow(g,l,cur.group===g,'data-navopen="'+F.esc(g)+'" aria-expanded="'+on+'"',l.length>1?ICON('down'):'')+(on?'<div class="gl">'+l.map(nvHTML).join('')+'</div>':'')+'</div>'});return h}
  if(mode==='colonnes'){var sel=S.navSec&&by[S.navSec]?S.navSec:(by[cur.group]?cur.group:groups[0]),sl=by[sel]||[];
    h+='<div class="c1">'+groups.map(function(g){var l=by[g],b=sumB(l);return '<button class="c1b d-'+gdom(g,l)+(g===sel?' on':'')+'" data-navsec="'+F.esc(g)+'"><span class="pl">'+ICON(GICON[g]||l[0].icon)+(b?'<i class="dot'+(b.hot?' hot':'')+'"></i>':'')+'</span><span class="lb">'+g+'</span></button>'}).join('')+'</div>';
    h+='<div class="c2 d-'+gdom(sel,sl)+'"><div class="c2h">'+sel+'</div><div class="c2s">'+sl.length+' écran'+(sl.length>1?'s':'')+'</div><div class="gl">'+sl.map(nvHTML).join('')+'</div></div>';return h}
  if(mode==='survol'||mode==='onglets'){groups.forEach(function(g){var l=by[g];h+=secRow(g,l,cur.group===g,mode==='survol'?'data-navfly="'+F.esc(g)+'"':'data-go="'+(S.lastIn&&S.lastIn[g]||l[0].id)+'"',mode==='survol'&&l.length>1?ICON('right'):'')});return h}
  var shut=P.prefs.get('navshut:'+role,[]);
  groups.forEach(function(g){var l=by[g],closed=shut.indexOf(g)>=0&&cur.group!==g;
    h+='<div class="grp d-'+gdom(g,l)+(closed?' shut':'')+'"><button class="gh" data-navgrp="'+F.esc(g)+'" aria-expanded="'+!closed+'"><span>'+g+'</span>'+(closed?bdgHTML(sumB(l)):'')+ICON('down')+'</button><div class="gl">'+l.map(nvHTML).join('')+'</div></div>'});
  return h}
function secTabsHTML(){var cur=P.mods[curTab()]||{},G=navGroupsOf(),l=G.by[cur.group]||[];if(P.navMode()!=='onglets'||l.length<2)return '';
  return '<div class="sectabs d-'+gdom(cur.group,l)+'">'+l.map(function(m){return '<a href="#'+m.id+'" class="st" data-go="'+m.id+'"'+(curTab()===m.id?' aria-current="page"':'')+'>'+ICON(m.icon)+'<span>'+m.title+'</span>'+bdgHTML(badgeOf(m))+'</a>'}).join('')+'</div>'}
P.toggleGroup=function(g){var k='navshut:'+S.role,l=P.prefs.get(k,[]),i=l.indexOf(g);if(i<0)l.push(g);else l.splice(i,1);P.prefs.set(k,l);P.renderBadges()};
/* carte flottante du mode « survol » */
var flyT=0;
P.navFly=function(g,row){var G=navGroupsOf(),l=G.by[g];if(!l)return;clearTimeout(flyT);var f=$('.navfly',app);if(!f){f=document.createElement('div');f.className='navfly';app.appendChild(f);
    f.addEventListener('mouseenter',function(){clearTimeout(flyT)});f.addEventListener('mouseleave',function(){flyT=setTimeout(P.navFlyClose,220)})}
  if(f.getAttribute('data-g')===g&&f.classList.contains('show'))return;
  var ar=app.getBoundingClientRect(),rr=row.getBoundingClientRect();
  f.className='navfly show d-'+gdom(g,l);f.setAttribute('data-g',g);
  f.innerHTML='<div class="fh"><span class="ico">'+ICON(GICON[g]||l[0].icon)+'</span><div><b>'+g+'</b><small>'+l.length+' écran'+(l.length>1?'s':'')+'</small></div></div><div class="gl">'+l.map(nvHTML).join('')+'</div>';
  var top=Math.max(12,Math.min(rr.top-ar.top-14,ar.height-f.offsetHeight-12));f.style.top=top+'px';f.style.left=(rr.right-ar.left+10)+'px';
  $$('.side .sec',app).forEach(function(x){x.classList.toggle('hov',x===row)})};
P.navFlyClose=function(){if(!app)return;var f=$('.navfly',app);if(f){f.classList.toggle('show',false);f.removeAttribute('data-g')}$$('.side .sec.hov',app).forEach(function(x){x.classList.toggle('hov',false)})};
function navSwitchHTML(){var cur=P.navModes.filter(function(x){return x[0]===P.navMode()})[0];return '<div class="navsw"><div class="nsh"><b>Choisissez un menu</b><span>'+cur[2]+'</span></div><div class="nsb">'+P.navModes.map(function(x,i){return '<button data-navmode="'+x[0]+'" aria-pressed="'+(x[0]===cur[0])+'"><i>'+(i+1)+'</i>'+x[1]+'</button>'}).join('')+'</div></div>'}
P.tabShort={cockpit:'Accueil'};
function tabsHTML(){var role=S.role,R=P.roles[role],cur=curTab();var tabs=R.tabs.filter(function(t){return P.mods[t]&&P.prefs.off(role).indexOf(t)<0}).slice(0,4);
  return tabs.map(function(t){var m=P.mods[t],b=badgeOf(m);return '<button class="d-'+P.domOf(m)+'" data-go="'+t+'" aria-current="'+(cur===t?'page':'false')+'">'+ICON(m.icon)+'<span>'+(m.short||P.tabShort[t]||m.title)+'</span>'+(b&&b.hot?bdgHTML(b):'')+'</button>'}).join('')+'<button class="more" data-more title="Tous les écrans" aria-label="Tous les écrans">'+ICON('grid')+'</button>'}
function crumbHTML(m){return '<span class="dt"></span><span>'+(m.group||'')+'</span>'+ICON('right')+'<b>'+(m.title||'')+'</b>'}
function setDom(m){app.className=app.className.replace(/\s?d-[a-z]+/g,'')+' d-'+P.domOf(m)}
P.renderShell=function(){
  S.shellRole=S.role;var dev=effDev(),role=S.role,R=P.roles[role],me=D.person(R.who);
  stage.setAttribute('data-dev',dev==='tablet-full'?'desktop':dev);stage.classList.toggle('full',realPhone()||dev==='tablet-full'||dev==='desktop');
  var mobile=dev==='phone',rail=(dev==='tablet'||dev==='tablet-full');
  app.className='app nav-'+P.navMode()+(mobile?' mobile':'')+(rail?' rail':'');app.setAttribute('data-role',role);
  var cur=P.mods[S.route]||{};
  var SPACE={gerant:'Espace gérant',employe:'Espace équipe',adherent:'Espace cavalier',coach:'Espace coach'};
  app.innerHTML='<aside class="side"><button class="club" data-go="'+R.home+'"><span class="lg">'+LOGO(24,'var(--navy-ink)','var(--strass)')+'</span><span class="cn"><b>'+F.esc(role==='coach'?'Piaffe Coach':D.club.name)+'</b><small>'+SPACE[role]+'</small></span></button>'+
    '<nav aria-label="Menu">'+navHTML()+'</nav><div class="me">'+P.ui.av(me)+'<span class="cn"><b>'+F.esc(me.first+' '+me.last)+'</b><small>'+F.esc(me.role||(me.galop?'Galop '+me.galop:me.spec?'Coach '+me.spec:R.label))+'</small></span></div></aside>'+
    '<div class="main"><header class="top"><div class="lft"><button class="btn ghost icon mback" data-back title="Retour">'+ICON('back')+'</button><button class="mlogo" data-go="'+R.home+'" title="Accueil">'+LOGO(24,'var(--navy-ink)','var(--strass)')+'</button><div class="crumb">'+crumbHTML(cur)+'</div></div>'+
    '<button class="cmdk" data-pal title="Rechercher (⌘K)">'+ICON('search')+'<span class="q">Rechercher un cheval, un cavalier, un écran…</span><kbd>⌘ K</kbd></button>'+
    '<div class="tools"><button class="btn ghost icon msearch" data-pal title="Rechercher">'+ICON('search')+'</button><button class="btn ghost icon bellb" data-notifs title="Notifications">'+ICON('bell')+'<i></i></button>'+
    '<button class="ai" data-ai title="Piaffe AI">'+ICON('assistant')+'<span class="lbl">Piaffe AI</span></button></div><div class="mt">'+(cur.phoneTitle||cur.title||'')+'</div></header><div class="stw">'+secTabsHTML()+'</div><div class="view"></div></div>'+
    '<nav class="tabbar">'+tabsHTML()+'</nav><div class="toasts"></div>';
  view=$('.view',app);setDom(cur);
  if(mobile)mbk(S.stack.length&&!R0(cur))
  renderView(false);
};

function renderView(anim){
  var m=P.mods[S.route];if(!m||m.role!==S.role){S.route=P.roles[S.role].home;m=P.mods[S.route]}
  if(!m){view.innerHTML='<div class="page">'+P.ui.empty('info','Module en construction')+'</div>';return}
  var page=document.createElement('div');page.className='page';view.innerHTML='';view.appendChild(page);view.scrollTop=0;
  if(anim!==false){view.classList.remove('enter');void view.offsetWidth;view.classList.add('enter')}
  try{m.render(page,P.ctx())}catch(e){console.error(e);page.innerHTML=P.ui.empty('alert','Cet écran a rencontré une erreur',F.esc(e.message))}
  P.animate(page);
  if(window.requestAnimationFrame)requestAnimationFrame(function(){P.fitCharts(page)});
}
P.ctx=function(){return {role:S.role,params:S.params,mobile:P.isMobile(),me:D.person(P.roles[S.role].who),D:D,ui:P.ui,fmt:F,chart:P.chart,go:P.go,sheet:P.sheet,toast:P.toast,rerender:P.rerender}};
P.rerender=function(keepTop){var y=view.scrollTop;renderView(false);if(!keepTop)view.scrollTop=y};
/* rafraîchit les pastilles du menu après une action (paiement, signature…) */
P.renderBadges=function(){var nv=$('.side nav',app);if(nv){var y=nv.scrollTop;nv.innerHTML=navHTML();nv.scrollTop=y}var sw=$('.stw',app);if(sw)sw.innerHTML=secTabsHTML();var tb=$('.tabbar',app);if(tb)tb.innerHTML=tabsHTML()};
/* titre d'un écran de détail (ex. nom du cheval) */
P.setTitle=function(t){var b=$('.crumb b',app);if(b)b.textContent=t;var mt=$('.mt',app);if(mt)mt.textContent=t};

P.go=function(route,params,opts){opts=opts||{};var m=P.mods[route];if(!m)return;
  if(m.role!==S.role){S.role=m.role;$$('.dbar [data-role]',demo).forEach(function(b){b.setAttribute('aria-selected',b.getAttribute('data-role')===S.role)})}
  if(!opts.back&&S.route&&S.route!==route)S.stack.push({route:S.route,params:S.params});if(S.stack.length>20)S.stack.shift();
  var roleChanged=S.shellRole&&S.shellRole!==S.role;
  S.route=route;S.params=params||{};P.closeAll();P.navFlyClose();S.lastIn=S.lastIn||{};var mt0=P.mods[m.hidden&&m.tab?m.tab:route];if(mt0)S.lastIn[mt0.group]=mt0.id;S.navOpen=null;S.navSec=null;
  if(location.hash!=='#'+route){try{history.replaceState(null,'','#'+route)}catch(e){location.hash=route}}
  if(roleChanged||!view){P.renderShell();return}
  /* mise à jour légère : navigation + titre, puis vue */
  P.renderBadges();setDom(m);
  var cr=$('.crumb',app);if(cr)cr.innerHTML=crumbHTML(m);
  var mt=$('.mt',app);if(mt)mt.textContent=m.phoneTitle||m.title;
  if(P.isMobile())mbk(!R0(m)&&S.stack.length);
  renderView(true);
};
function mbk(on){var mb=$('.mback',app),ml=$('.mlogo',app);if(mb)mb.style.display=on?'':'none';if(ml)ml.style.display=on?'none':''}
function R0(m){return P.roles[m.role].tabs.indexOf(m.id)>=0}
P.back=function(){var s=S.stack.pop();if(s)P.go(s.route,s.params,{back:true})};

/* ---------- Animations d'entrée et compteurs ---------- */
P.animate=function(root){
  if(root!==view&&window.requestAnimationFrame)requestAnimationFrame(function(){P.fitCharts(root)});
  $$('.rise',root).forEach(function(g){Array.prototype.forEach.call(g.children,function(c,i){c.style.setProperty('--i',Math.min(i,10))})});
  $$('[data-count]',root).forEach(function(el){var to=parseFloat(el.getAttribute('data-count')),f=el.getAttribute('data-fmt'),fmt=function(v){return f==='eur'?F.eur(v):f==='pct'?Math.round(v)+'':F.num(v,f==='1'?1:0)};
    if(RM){el.textContent=fmt(to);return}var t0=performance.now(),d=900;(function st(t){var k=Math.min(1,(t-t0)/d),e=1-Math.pow(1-k,4);el.textContent=fmt(to*e);if(k<1)requestAnimationFrame(st)})(t0)});
};

/* ---------- Feuilles (panneau latéral sur ordinateur, feuille du bas sur téléphone) ---------- */
P.sheet=function(o){/* {title, body (html|fn(el)), foot (html), wide, onClose} */
  P.closeSheets();var mob=P.isMobile(),sc=document.createElement('div');sc.className='scrim';
  var sh=document.createElement('div');sh.className='sheet '+(mob?'bottom':'side-r')+(o.wide?' wide':'');sh.setAttribute('role','dialog');sh.setAttribute('aria-label',o.title||'');
  sh.innerHTML='<div class="sh">'+(o.icon?'<span class="ico">'+ICON(o.icon)+'</span>':'')+'<h2>'+(o.title||'')+'</h2><button class="btn ghost icon sm" data-x title="Fermer">'+ICON('x')+'</button></div><div class="sb"></div>'+(o.foot?'<div class="sf">'+o.foot+'</div>':'');
  app.appendChild(sc);app.appendChild(sh);var b=$('.sb',sh);if(typeof o.body==='function')o.body(b,sh);else b.innerHTML=o.body||'';P.animate(b);
  function close(){sh.classList.add('closing');sc.style.transition='opacity .3s';sc.style.opacity=0;setTimeout(function(){sh.remove();sc.remove()},280);if(o.onClose)o.onClose()}
  sc.onclick=close;$('[data-x]',sh).onclick=close;sh.close=close;return sh};
P.closeSheets=function(){$$('.sheet,.scrim,.pop-o',app).forEach(function(e){e.remove()})};
P.closeAll=function(){P.closeSheets();var a=$('.aip',app);if(a)a.remove();var pl=$('.pal',app);if(pl)pl.remove()};

/* ---------- Notifications éphémères ---------- */
P.toast=function(msg,o){o=o||{};var t=document.createElement('div');t.className='toast';t.innerHTML=ICON(o.icon||'checkc')+'<span>'+msg+'</span>'+(o.undo?'<button>Annuler</button>':'');
  var box=$('.toasts',app);if(!box)return;box.appendChild(t);if(o.undo)$('button',t).onclick=function(){o.undo();t.remove()};
  setTimeout(function(){t.classList.add('out');setTimeout(function(){t.remove()},320)},o.ms||3200)};

/* ---------- Popover de notifications ---------- */
var NDOM={ok:'d-hz',warn:'d-mo',bad:'d-cr',acc:'d-acc',info:'d-tm'};
function notifs(btn){P.closeSheets();var r=btn.getBoundingClientRect(),ar=app.getBoundingClientRect(),p=document.createElement('div');p.className='pop-o';
  var pw=Math.min(400,ar.width-20),rt=Math.max(10,Math.min(ar.right-r.right-8,ar.width-pw-10));p.style.cssText='top:'+(r.bottom-ar.top+8)+'px;right:'+rt+'px;width:'+pw+'px';
  p.innerHTML='<div class="ch" style="padding-bottom:12px"><h3>Notifications</h3><button class="btn ghost sm" data-readall>Tout marquer lu</button></div><div class="list">'+D.notifs.map(function(n){return '<div class="li click">'+'<span class="ico sm '+(NDOM[n.c]||'d-acc')+'">'+ICON(n.i,'sm')+'</span><div class="grow"><div class="s" style="color:var(--ink);font-weight:500;line-height:1.4">'+n.t+'</div><div class="xs mut" style="margin-top:2px">'+n.w+'</div></div></div>'}).join('')+'</div>';
  var ra=$('[data-readall]',p);if(ra)ra.onclick=function(e){e.stopPropagation();var dot=$('.bellb i',app);if(dot)dot.remove();p.remove();P.toast('Notifications marquées comme lues')};
  app.appendChild(p);setTimeout(function(){document.addEventListener('click',function h(e){if(!p.contains(e.target)){p.remove();document.removeEventListener('click',h)}})},0)}

/* ---------- Palette de commandes ⌘K ---------- */
P.actions=[];/* P.actions.push({role,label,icon,run:function(){}}) */
P.palette=function(){if($('.pal',app))return;var sc=document.createElement('div');sc.className='scrim';sc.style.background='rgba(10,22,54,.20)';
  var pl=document.createElement('div');pl.className='pal';pl.innerHTML='<div class="pin">'+ICON('search')+'<input id="pal-q" placeholder="Chercher un cheval, un adhérent, un écran, une action…" autocomplete="off"><span class="kbd">Échap</span></div><div class="pres"></div><div class="pfoot"><span><span class="kbd">↑↓</span> naviguer</span><span><span class="kbd">↵</span> ouvrir</span><span style="margin-left:auto;display:flex;align-items:center;gap:8px">'+LOGO(18,'var(--mut)','var(--strass)')+'Piaffe</span></div>';
  app.appendChild(sc);app.appendChild(pl);var inp=$('input',pl),res=$('.pres',pl),items=[],sel=0;
  function close(){pl.remove();sc.remove()}sc.onclick=close;
  function run(q){q=(q||'').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'');var n=function(s){return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')};items=[];
    var G=[['Écrans',P.modsFor(S.role).filter(function(m){return !q||n(m.title).indexOf(q)>=0}).slice(0,q?6:5).map(function(m){return {i:m.icon,l:m.title,s:m.group,d:P.domOf(m),run:function(){P.go(m.id)}}})],
      ['Actions',P.actions.filter(function(a){return (!a.role||a.role===S.role)&&(!q||n(a.label).indexOf(q)>=0)}).slice(0,5).map(function(a){return {i:a.icon||'bolt',l:a.label,s:'Action',d:'acc',run:a.run}})]];
    if(S.role!=='adherent'){G.push(['Chevaux',D.horses.filter(function(h){return q&&n(h.name).indexOf(q)>=0}).slice(0,5).map(function(h){return {i:'horse',l:h.name,s:h.box+' · '+h.breed,d:'hz',run:function(){P.go(P.mods['cheval']?'cheval':P.roles[S.role].home,{id:h.id})}}})]);
      G.push(['Adhérents',D.members.filter(function(m){return q&&n(m.first+' '+m.last).indexOf(q)>=0}).slice(0,5).map(function(m){return {i:'user',l:m.first+' '+m.last,s:(m.minor?m.age+' ans · ':'')+'Galop '+m.galop,d:'rd',run:function(){P.go(P.mods['adherent']?'adherent':P.roles[S.role].home,{id:m.id})}}})])}
    var h='';G.forEach(function(g){if(!g[1].length)return;h+='<div class="pg">'+g[0]+'</div>';g[1].forEach(function(it){items.push(it);h+='<div class="po" data-k="'+(items.length-1)+'"><span class="ico '+(it.d?'d-'+it.d:'d-pf')+'">'+ICON(it.i)+'</span><span>'+it.l+'</span><span class="s">'+it.s+'</span></div>'})});
    if(q&&!items.length)h='<div class="empty">'+ICON('assistant')+'<b style="color:var(--ink)">Rien trouvé pour « '+F.esc(inp.value)+' »</b><button class="btn sm pri" data-askai>Demander à l’assistant</button></div>';
    res.innerHTML=h;sel=0;mark();var ab=$('[data-askai]',res);if(ab)ab.onclick=function(){var v=inp.value;close();P.assistant(v)}}
  function mark(){$$('.po',res).forEach(function(e,i){e.setAttribute('aria-selected',i===sel)});var c=$('.po[aria-selected="true"]',res);if(c)c.scrollIntoView({block:'nearest'})}
  res.onclick=function(e){var o=e.target.closest('.po');if(o){close();items[+o.getAttribute('data-k')].run()}};
  res.onmousemove=function(e){var o=e.target.closest('.po');if(o){sel=+o.getAttribute('data-k');mark()}};
  inp.oninput=function(){run(inp.value)};
  inp.onkeydown=function(e){if(e.key==='ArrowDown'){sel=Math.min(items.length-1,sel+1);mark();e.preventDefault()}else if(e.key==='ArrowUp'){sel=Math.max(0,sel-1);mark();e.preventDefault()}else if(e.key==='Enter'&&items[sel]){close();items[sel].run()}else if(e.key==='Escape')close()};
  run('');setTimeout(function(){inp.focus()},30)};

/* ---------- Assistant (panneau flottant) ---------- */
/* Les modules enrichissent le cerveau : P.brain.push({re:/.../i, role, reply:function(text,ctx){return {text, card(html), actions:[{label,run}]}}}) */
P.brain=[];
P.suggestions={gerant:['Qui n’a pas payé ce mois-ci ?','Prépare le planning de samedi','Combien me coûte Ulysse ?','Relance les impayés'],employe:['Qu’est-ce que je fais maintenant ?','Signale un problème au box 12','Qui sort au paddock ?'],adherent:['Réserve-moi un rattrapage samedi','Comment va Ulysse ?','Trouve un coach CSO jeudi'],coach:['Mes cours de la semaine','Qui a progressé ce mois-ci ?','Bloque mon vendredi']};
P.assistant=function(first){var ex=$('.aip',app);if(ex){ex.remove();if(!first)return}
  var w=document.createElement('div');w.className='aip';w.innerHTML='<div class="aih"><span class="orb">'+LOGO(24,'var(--navy-ink)','var(--strass)',true)+'</span><div class="grow"><b>Piaffe AI</b><div class="xs mut">Il agit dans '+D.club.short+' avec vos droits '+(function(l){l=l.toLowerCase();return (/^[aeéèiouh]/.test(l)?'d’':'de ')+l})(P.roles[S.role].label)+'</div></div><button class="btn ghost icon sm" data-x>'+ICON('x')+'</button></div>'+
   '<div class="aib"><div class="msg a">Bonjour '+P.ctx().me.first+'. Posez une question ou demandez une action : je cherche dans tout Piaffe et je vous montre ce que je vais faire avant de le faire.</div></div>'+
   '<div class="aif"><div class="sugg">'+(P.suggestions[S.role]||[]).map(function(s){return '<button>'+s+'</button>'}).join('')+'</div><form class="comp"><input id="ai-q" placeholder="Demandez n’importe quoi…" autocomplete="off"><button class="btn icon sm pri" title="Envoyer">'+ICON('send','sm')+'</button></form></div>';
  app.appendChild(w);var body=$('.aib',w),inp=$('input',w);
  $('[data-x]',w).onclick=function(){w.remove()};
  $$('.sugg button',w).forEach(function(b){b.onclick=function(){ask(b.textContent)}});
  $('form',w).onsubmit=function(e){e.preventDefault();if(inp.value.trim()){ask(inp.value.trim());inp.value=''}};
  function ask(t){var u=document.createElement('div');u.className='msg u';u.textContent=t;body.appendChild(u);var ty=document.createElement('div');ty.className='msg a typing';ty.innerHTML='<i></i><i></i><i></i>';body.appendChild(ty);body.scrollTop=1e6;
    setTimeout(function(){ty.remove();var r=P.think(t);var a=document.createElement('div');a.className='msg a';a.innerHTML=r.text+(r.card?'<div class="act">'+r.card+'</div>':'')+(r.actions?'<div class="hrow wrap" style="margin-top:10px">'+r.actions.map(function(x,i){return '<button class="btn sm '+(i===0?'pri':'')+'" data-a="'+i+'">'+x.label+'</button>'}).join('')+'</div>':'');
      body.appendChild(a);$$('[data-a]',a).forEach(function(b){b.onclick=function(){var x=r.actions[+b.getAttribute('data-a')];var res=x.run&&x.run();b.parentNode.innerHTML='<span class="chip ok dot">'+(res||'Fait')+'</span>'}});body.scrollTop=1e6},RM?50:700+Math.random()*500)}
  if(first)ask(first);else setTimeout(function(){inp.focus()},50)};
P.think=function(t){var c=P.ctx();for(var i=0;i<P.brain.length;i++){var b=P.brain[i];if((!b.role||b.role===S.role)&&b.re.test(t)){var r=b.reply(t,c);if(r)return r}}
  return {text:'Je peux chercher dans les chevaux, les adhérents, le planning, les factures, les soins et les stocks, et préparer des actions que vous validez. Essayez par exemple « '+(P.suggestions[S.role]||[''])[0]+' ».'}};

/* ---------- Visite guidée ---------- */
P.tourSteps=[];/* {route, title, text} */
P.tour=function(){var i=0,box=document.createElement('div');box.className='tour';document.body.appendChild(box);
  function show(){var s=P.tourSteps[i];if(!s){box.remove();return}if(s.route&&P.mods[s.route])P.go(s.route,s.params);
    box.innerHTML='<div class="eyebrow" style="color:var(--strass)">Visite guidée · '+(i+1)+' / '+P.tourSteps.length+'</div><div class="tt">'+s.title+'</div><p>'+s.text+'</p><div class="tn"><div class="dots">'+P.tourSteps.map(function(_,k){return '<i class="'+(k===i?'on':'')+'"></i>'}).join('')+'</div><button class="btn sm ghost" data-q>Quitter</button>'+(i?'<button class="btn sm ghost" data-p>Précédent</button>':'')+'<button class="btn sm pri" data-n>'+(i===P.tourSteps.length-1?'Terminer':'Suivant')+'</button></div>';
    $('[data-q]',box).onclick=function(){box.remove()};$('[data-n]',box).onclick=function(){i++;show()};var pb=$('[data-p]',box);if(pb)pb.onclick=function(){i--;show()}}
  show()};

/* ---------- Gestion globale des clics ---------- */
function onClick(e){var t=e.target;
  var nm=t.closest('[data-navmode]');if(nm){P.store.set('navmode',nm.getAttribute('data-navmode'));S.navOpen=S.navSec=null;var w=$('.navsw',demo);if(w)w.outerHTML=navSwitchHTML();P.renderShell();return}
  var no=t.closest('[data-navopen]');if(no&&app.contains(no)){var g0=no.getAttribute('data-navopen'),G0=navGroupsOf(),op=S.navOpen||(P.mods[curTab()]||{}).group;if(G0.by[g0].length===1){P.go(G0.by[g0][0].id);return}S.navOpen=op===g0?'-':g0;P.renderBadges();return}
  var ns=t.closest('[data-navsec]');if(ns&&app.contains(ns)){var g1=ns.getAttribute('data-navsec'),G1=navGroupsOf();if(G1.by[g1].length===1){P.go(G1.by[g1][0].id);return}S.navSec=g1;P.renderBadges();return}
  var nf=t.closest('[data-navfly]');if(nf&&app.contains(nf)){var g2=nf.getAttribute('data-navfly'),G2=navGroupsOf();if(G2.by[g2].length===1){P.go(G2.by[g2][0].id);return}var f0=$('.navfly.show',app);if(f0&&f0.getAttribute('data-g')===g2)P.navFlyClose();else P.navFly(g2,nf);return}
  if(!t.closest('.navfly'))P.navFlyClose();
  var gh=t.closest('[data-navgrp]');if(gh&&app.contains(gh)){P.toggleGroup(gh.getAttribute('data-navgrp'));return}
  var g=t.closest('[data-go]');if(g&&app.contains(g)){e.preventDefault();var pr={};Array.prototype.forEach.call(g.attributes,function(a){if(a.name.indexOf('data-p-')===0)pr[a.name.slice(7)]=a.value});if(g.getAttribute('data-id'))pr.id=g.getAttribute('data-id');P.go(g.getAttribute('data-go'),pr);return}
  if(t.closest('[data-back]')){P.back();return}
  if(t.closest('[data-pal]')){P.palette();return}
  if(t.closest('[data-ai]')){P.assistant();return}
  var nb=t.closest('[data-notifs]');if(nb){notifs(nb);return}
  if(t.closest('[data-more]')){var mods=P.modsFor(S.role);var grp=[],by={};mods.forEach(function(m){if(!by[m.group]){by[m.group]=[];grp.push(m.group)}by[m.group].push(m)});
    P.sheet({title:'Tous les écrans',icon:'grid',body:grp.map(function(g){return '<div class="eyebrow" style="margin:4px 2px 10px">'+g+'</div><div class="rise" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(106px,1fr));gap:10px;margin-bottom:20px">'+by[g].map(function(m){return '<button class="card hover d-'+P.domOf(m)+'" style="display:flex;flex-direction:column;align-items:flex-start;gap:10px;text-align:left;padding:14px 12px;min-height:100px" data-go="'+m.id+'">'+'<span class="ico">'+ICON(m.icon)+'</span><b style="font-size:14px;line-height:1.25">'+m.title+'</b></button>'}).join('')+'</div>'}).join('')});return}
  var rb=t.closest('[data-role]');if(rb&&demo.querySelector('.dbar').contains(rb)){S.role=rb.getAttribute('data-role');S.route=P.roles[S.role].home;S.params={};S.stack=[];$$('.dbar [data-role]',demo).forEach(function(b){b.setAttribute('aria-selected',b===rb)});P.renderShell();try{history.replaceState(null,'','#'+S.route)}catch(e){}return}
  var db=t.closest('[data-dev]');if(db&&demo.querySelector('.dbar').contains(db)){S.dev=db.getAttribute('data-dev');P.store.set('dev',S.dev);$$('[data-dev]',demo).forEach(function(b){b.setAttribute('aria-selected',b===db)});P.renderShell();return}
  if(t.closest('[data-theme-t]')){var r=document.documentElement,dk=r.getAttribute('data-theme')==='dark'||(!r.getAttribute('data-theme')&&matchMedia('(prefers-color-scheme:dark)').matches);r.setAttribute('data-theme',dk?'light':'dark');P.store.set('theme',dk?'light':'dark');return}
  if(t.closest('[data-tour]')){P.tour();return}
  /* interrupteurs et cases génériques */
  var tg=t.closest('.tog');if(tg&&!tg.hasAttribute('data-manual')){tg.setAttribute('aria-checked',tg.getAttribute('aria-checked')!=='true')}
  var ck=t.closest('.chk');if(ck&&!ck.hasAttribute('data-manual')){ck.setAttribute('aria-checked',ck.getAttribute('aria-checked')!=='true')}
  var sg=t.closest('.seg button[role="tab"],.tabs button[role="tab"]');if(sg&&!sg.closest('.dbar')){$$('button',sg.parentNode).forEach(function(b){b.setAttribute('aria-selected',b===sg)})}
  var tag=t.closest('.tag');if(tag&&!tag.hasAttribute('data-manual')){tag.setAttribute('aria-pressed',tag.getAttribute('aria-pressed')!=='true')}
}
function onKey(e){if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();P.palette()}else if(e.key==='Escape'){var s=$('.sheet',app);if(s&&s.close)s.close();else P.closeAll()}}

/* ---------- Cheval 3D (three.js) ---------- */
P.gl={};
P.gl.horse=function(box,o){/* o:{points:[{id,label,pos:[x,y,z],c}], onPick(id), color, rotate} retourne {dispose} */
  o=o||{};if(!window.THREE||!window.HORSE){box.innerHTML='<div class="empty">'+ICON('cube')+'<span class="s">Vue 3D indisponible</span></div>';return {dispose:function(){}}}
  var T=THREE,W=box.clientWidth||400,H=box.clientHeight||320,ren=new T.WebGLRenderer({antialias:true,alpha:true});ren.setPixelRatio(Math.min(devicePixelRatio||1,2));ren.setSize(W,H);ren.domElement.style.cssText='display:block;width:100%;height:100%;cursor:grab;touch-action:none';
  box.style.position='relative';box.appendChild(ren.domElement);
  var sc=new T.Scene(),cam=new T.PerspectiveCamera(32,W/H,.01,50);cam.position.set(0,.55,3.1);cam.lookAt(0,.48,0);
  var dark=getComputedStyle(document.documentElement).getPropertyValue('--surface').trim().indexOf('#0')===0;
  var geo=new T.BufferGeometry(),V=new Float32Array(HORSE.n*3);HORSE.lerp(.15,V);geo.setAttribute('position',new T.BufferAttribute(V,3));geo.setIndex(Array.prototype.slice.call(HORSE.idx));geo.computeVertexNormals();
  var mat=new T.MeshPhysicalMaterial?new T.MeshStandardMaterial({color:o.color||(dark?0x2a3a78:0x0a1636),metalness:.35,roughness:.32,flatShading:true,side:T.DoubleSide}):null;
  var mesh=new T.Mesh(geo,mat);var grp=new T.Group();grp.add(mesh);
  /* arêtes en strass */
  var pts=new T.Points(geo,new T.PointsMaterial({color:0xa9bcff,size:.012,transparent:true,opacity:.8}));grp.add(pts);
  sc.add(grp);sc.add(new T.HemisphereLight(0xdfe6ff,0x0a1636,dark?.9:1.1));var dl=new T.DirectionalLight(0xffffff,1.4);dl.position.set(2,3,2);sc.add(dl);var dl2=new T.DirectionalLight(0x6f8cff,.9);dl2.position.set(-3,1,-2);sc.add(dl2);
  /* sol */
  var ring=new T.Mesh(new T.RingGeometry(.55,.56,96),new T.MeshBasicMaterial({color:0x3d63f2,transparent:true,opacity:.5,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;sc.add(ring);
  var disk=new T.Mesh(new T.CircleGeometry(.55,64),new T.MeshBasicMaterial({color:0x3d63f2,transparent:true,opacity:.06}));disk.rotation.x=-Math.PI/2;disk.position.y=.001;sc.add(disk);
  /* points de soin */
  var hot=[];(o.points||[]).forEach(function(p){var el=document.createElement('button');el.className='h3d';el.setAttribute('data-hot',p.id);el.innerHTML='<i style="--c:'+(p.c||'var(--acc)')+'"></i><span>'+p.label+'</span>';box.appendChild(el);el.onclick=function(){if(o.onPick)o.onPick(p.id)};hot.push({el:el,v:new T.Vector3(p.pos[0],p.pos[1],p.pos[2])})});
  var rotY=o.rot!=null?o.rot:-.6,drag=false,lx=0,vel=0,alive=true,t0=performance.now(),walk=o.walk;
  ren.domElement.addEventListener('pointerdown',function(e){drag=true;lx=e.clientX;ren.domElement.style.cursor='grabbing';ren.domElement.setPointerCapture(e.pointerId)});
  ren.domElement.addEventListener('pointermove',function(e){if(!drag)return;var dx=e.clientX-lx;lx=e.clientX;rotY+=dx*.01;vel=dx*.01});
  ren.domElement.addEventListener('pointerup',function(){drag=false;ren.domElement.style.cursor='grab'});
  var ro=new ResizeObserver(function(){W=box.clientWidth;H=box.clientHeight;if(!W||!H)return;ren.setSize(W,H);cam.aspect=W/H;cam.updateProjectionMatrix()});ro.observe(box);
  var tmp=new T.Vector3();
  function frame(now){if(!alive)return;if(!box.isConnected){api.dispose();return}var t=(now-t0)/1000;
    if(!drag){vel*=.94;rotY+=vel+(RM||o.still?0:.0025)}grp.rotation.y=rotY;
    if(walk&&!RM){HORSE.lerp(t*.6,V);geo.attributes.position.needsUpdate=true;geo.computeVertexNormals()}
    ren.render(sc,cam);
    hot.forEach(function(h){tmp.copy(h.v).applyMatrix4(grp.matrixWorld);var front=tmp.clone().sub(cam.position).normalize().dot(new T.Vector3(Math.sin(rotY)*0,0,-1));tmp.project(cam);
      h.el.style.transform='translate('+((tmp.x*.5+.5)*W)+'px,'+((-tmp.y*.5+.5)*H)+'px)';var wp=h.v.clone().applyMatrix4(grp.matrixWorld);h.el.style.opacity=wp.z>-.12?1:.35});
    requestAnimationFrame(frame)}
  requestAnimationFrame(frame);
  var api={dispose:function(){alive=false;ro.disconnect();ren.dispose();geo.dispose()},setWalk:function(v){walk=v}};return api};

/* ---------- Démarrage ---------- */
P.start=function(){
  var th=P.store.get('theme',null);if(th)document.documentElement.setAttribute('data-theme',th);
  var h=(location.hash||'').slice(1);if(h&&P.mods[h]){S.role=P.mods[h].role;S.route=h}else{S.route=P.roles[S.role].home}
  buildDemo();P.renderShell();
  document.addEventListener('click',onClick);
  if(window.PIAFFE_MENUS){demo.insertAdjacentHTML('beforeend',navSwitchHTML());demo.classList.add('has-navsw')}
  document.addEventListener('mouseover',function(e){if(P.navMode()!=='survol'||!app||P.isMobile())return;var r=e.target.closest&&e.target.closest('[data-navfly]');if(r&&app.contains(r)){var g=r.getAttribute('data-navfly');if(navGroupsOf().by[g].length>1)P.navFly(g,r);else P.navFlyClose()}});
  document.addEventListener('mouseout',function(e){if(P.navMode()!=='survol'||!app)return;var r=e.target.closest&&e.target.closest('.side');var to=e.relatedTarget;if(r&&!(to&&(r.contains(to)||(to.closest&&to.closest('.navfly'))))){clearTimeout(flyT);flyT=setTimeout(P.navFlyClose,220)}});document.addEventListener('keydown',onKey);
  var lastW=effDev();var rz=0;window.addEventListener('resize',function(){var d=effDev();if(d!==lastW){lastW=d;P.renderShell()}else{clearTimeout(rz);rz=setTimeout(function(){P.fitCharts()},150)}});
  window.addEventListener('hashchange',function(){var h=(location.hash||'').slice(1);if(h&&P.mods[h]&&h!==S.route)P.go(h)});
};
})();
