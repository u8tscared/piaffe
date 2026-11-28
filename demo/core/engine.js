/* =====================================================================
   STABL · Moteur de la démo
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
  weatherIcon:function(i){return ICON(i)},
  /* squelette de chargement : P.ui.skel(['90%','70%','40%']) ou P.ui.skel(3) */
  skel:function(l){l=typeof l==='number'?['92%','76%','58%','84%','40%'].slice(0,l):l||['90%','70%','45%'];return '<div class="skl" aria-busy="true" aria-label="Chargement">'+l.map(function(w){return '<i class="skel" style="width:'+w+'"></i>'}).join('')+'</div>'}
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
    if(!o.max){var q=mx/4,pw=Math.pow(10,Math.floor(Math.log10(q))),fs=[1,1.5,2,2.5,3,4,5,6,8,10];for(var z=0;z<fs.length;z++){if(q<=fs[z]*pw+1e-9){mx=fs[z]*pw*4;break}}}
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
  gerant:{label:'Gérant',icon:'stable',who:'s01',home:'cockpit',tabs:['cockpit','planning','chevaux','adherents']},
  employe:{label:'Employé',icon:'upkeep',who:'s05',home:'emp-jour',tabs:['emp-jour','emp-tournee','emp-chevaux','emp-planning']},
  adherent:{label:'Adhérent',icon:'helmet',who:'m001',home:'adh-accueil',tabs:['adh-accueil','adh-reserver','adh-cheval','adh-paiements']},
  coach:{label:'Coach',icon:'whistle',who:'c01',home:'coach-agenda',tabs:['coach-agenda','coach-eleves','coach-dispo','coach-revenus']}
};
P.groups={gerant:['Pilotage','Écurie','Club','Finances','Équipe','Plateforme'],employe:['Ma journée','Écurie','Moi'],adherent:['Moi','Équitation','Cheval','Compte'],coach:['Coaching','Compte']};

/* ---------- Domaines : couleur de chaque écran (rail, onglets, palette, en-tête) ---------- */
/* clés : acc (pilotage), hz (chevaux), rd (cavaliers), mo (argent), tm (équipe), cr (soins), pf (plateforme) */
P.domGroups={'Pilotage':'acc','Écurie':'hz','Club':'rd','Finances':'mo','Équipe':'tm','Plateforme':'pf','Ma journée':'acc','Moi':'tm','Équitation':'rd','Cheval':'hz','Compte':'mo','Coaching':'rd'};
P.domMods={'soins':'cr','emp-soins':'cr','emp-signaler':'cr','adh-accueil':'acc','adh-bienvenue':'acc','adh-progression':'rd','adh-profil':'pf','coach-profil':'pf','adh-messages':'tm','emp-messages':'tm','communication':'tm','coach-revenus':'mo','coach-concours':'rd'};
P.domOf=function(m){if(typeof m==='string')m=P.mods[m];if(!m)return 'acc';return m.dom||P.domMods[m.id]||P.domGroups[m.group]||'acc'};
var GICON={'Ma tournée':'route','Pilotage':'today','Écurie':'horse','Club':'members','Finances':'euro','Équipe':'team','Plateforme':'plug','Ma journée':'today','Moi':'user','Équitation':'jump','Cheval':'horse','Compte':'wallet','Coaching':'whistle'};

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
  document.body.innerHTML='<div id="demo"><header class="dbar"><div class="brand">'+LOGO(28,'var(--ink)','var(--strass)',true)+'<span>'+F.esc((window.BRAND||{}).wordmark||(window.BRAND||{}).name||'stabl')+'</span><small>Démo</small></div>'+
   '<div class="roles">'+P.ui.seg(Object.keys(P.roles).map(function(k){return [k,ICON(P.roles[k].icon)+'<span class="lbl">'+P.roles[k].label+'</span>']}),S.role,'data-role')+'</div>'+
   '<div class="right"><div class="dev">'+P.ui.seg([['desktop',DEVI.desktop],['tablet',DEVI.tablet],['phone',DEVI.phone]],S.dev,'data-dev')+'</div>'+
   '<button class="btn ghost icon sm dzb" data-dens title="Taille de l’affichage">'+DENS_I+'</button>'+'<button class="btn ghost icon sm" data-theme-t title="Thème clair ou sombre">'+ICON('moon')+'</button>'+'<button class="btn ghost icon sm" data-dbar-hide title="Masquer la barre de démo pour voir la page en entier">'+ICON('up')+'</button>'+
   '<button class="btn sm dark tourb" data-tour>'+ICON('play','sm')+'<span>Visite guidée</span></button></div></header>'+
   '<div class="stage"><div class="frame">'+HW+'<div class="app"></div></div></div></div>';
  demo=$('#demo');stage=$('.stage');frame=$('.frame');app=$('.app');demo.classList.toggle('nobar',!!P.store.get('nobar',false));
  $$('[data-dev]',demo).forEach(function(b){b.title={desktop:'Ordinateur',tablet:'Tablette',phone:'Téléphone'}[b.getAttribute('data-dev')]});
}
/* échelle d'affichage : sur ordinateur et tablette, toute l'appli est réduite pour que l'essentiel d'un écran tienne sans défiler.
   Trois tailles au choix (Compacte, Normale, Grande), mémorisées. Le téléphone garde l'échelle 1. */
var DENS_I='<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M3.5 18.5 8 6.5l4.5 12M5.2 14.2h5.6M14.5 18.5l3-8 3 8M15.6 15.8h3.8"/></svg>';
P.densities=[['compact','Compacte',.92],['normal','Normale',1],['grand','Grande',1.1]];
P.density=function(){var d=P.store.get('density','normal');return P.densities.filter(function(x){return x[0]===d})[0]||P.densities[1]};
P.applyZoom=function(){var d=effDev(),W=window.innerWidth,H=window.innerHeight,k=P.density()[2],z=1,zb=1;
  if(d==='desktop'||d==='tablet')z=Math.max(.86,Math.min(1,W/1560,H/880))*k;
  else if(d==='tablet-full')z=Math.max(.88,Math.min(1,W/1240,H/880))*k;
  else if(!realPhone())z=1;
  z=Math.max(.66,Math.min(1.05,z));zb=realPhone()?1:Math.max(.9,Math.min(1,z));
  document.documentElement.style.setProperty('--z',z.toFixed(3));document.documentElement.style.setProperty('--zb',zb.toFixed(3))};
/* facteur réel entre les coordonnées à l'écran (getBoundingClientRect, clientX) et les px CSS de l'appli */
P.zk=function(){if(!app||!app.offsetWidth)return 1;var k=app.getBoundingClientRect().width/app.offsetWidth;return k>0?k:1};
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
/* menu réduit : icônes seules + pastilles ; choix mémorisé, réduit d'office sur tablette tant que rien n'est choisi */
P.navMini=function(){if(!app||app.classList.contains('mobile'))return false;var v=P.store.get('navmini',null);return v===null?effDev()!=='desktop':!!v};
function navTogHTML(){var m=P.navMini(),t=m?'Agrandir le menu':'Réduire le menu';return '<button class="navtog" data-navtog title="'+t+' ( [ )" aria-label="'+t+'" aria-expanded="'+!m+'">'+ICON('left')+'</button>'}
P.toggleNav=function(){var m=!P.navMini();P.store.set('navmini',m);P.navFlyClose();app.classList.toggle('mini',m);var tg=$('.navtog',app);if(tg)tg.outerHTML=navTogHTML();P.renderBadges()};
function secRow(g,l,on,attr,extra){var b=sumB(l);return '<button class="sec d-'+gdom(g,l)+(on?' on':'')+'" '+attr+'><span class="pl">'+ICON(GICON[g]||l[0].icon)+'</span><span class="lb">'+g+'</span>'+bdgHTML(b)+(extra||'')+'</button>'}
function navHTML(){var role=S.role,cur=P.mods[curTab()]||{},h='',G=navGroupsOf(),groups=G.groups,by=G.by,mode=P.navMode();
  if(P.navMini()){groups.forEach(function(g){var l=by[g];h+=secRow(g,l,cur.group===g,'data-navfly="'+F.esc(g)+'" aria-label="'+F.esc(g)+'"','')});return h}
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
  var zk=P.zk(),top=Math.max(12,Math.min((rr.top-ar.top)/zk-14,ar.height/zk-f.offsetHeight-12));f.style.top=top+'px';f.style.left=((rr.right-ar.left)/zk+10)+'px';
  $$('.side .sec',app).forEach(function(x){x.classList.toggle('hov',x===row)})};
P.navFlyClose=function(){if(!app)return;var f=$('.navfly',app);if(f){f.classList.toggle('show',false);f.removeAttribute('data-g')}$$('.side .sec.hov',app).forEach(function(x){x.classList.toggle('hov',false)})};
function navSwitchHTML(){var cur=P.navModes.filter(function(x){return x[0]===P.navMode()})[0];return '<div class="navsw"><div class="nsh"><b>Choisissez un menu</b><span>'+cur[2]+'</span></div><div class="nsb">'+P.navModes.map(function(x,i){return '<button data-navmode="'+x[0]+'" aria-pressed="'+(x[0]===cur[0])+'"><i>'+(i+1)+'</i>'+x[1]+'</button>'}).join('')+'</div></div>'}
P.tabShort={cockpit:'Accueil'};
function tabsHTML(){var role=S.role,R=P.roles[role],cur=curTab();var tabs=R.tabs.filter(function(t){return P.mods[t]&&P.prefs.off(role).indexOf(t)<0}).slice(0,4);
  return tabs.map(function(t){var m=P.mods[t],b=badgeOf(m);return '<button class="d-'+P.domOf(m)+'" data-go="'+t+'" aria-current="'+(cur===t?'page':'false')+'">'+ICON(m.icon)+'<span>'+(m.short||P.tabShort[t]||m.title)+'</span>'+(b&&b.hot?bdgHTML(b):'')+'</button>'}).join('')+'<button class="more" data-more title="Tous les écrans" aria-label="Tous les écrans">'+ICON('grid')+'</button>'}
function crumbHTML(m){return '<span class="dt"></span>'+(m.group&&m.group!==m.title?'<span>'+m.group+'</span>'+ICON('right'):'')+'<b>'+(m.title||'')+'</b>'}
function setDom(m){app.className=app.className.replace(/\s?d-[a-z]+/g,'')+' d-'+P.domOf(m)}
P.renderShell=function(){
  S.shellRole=S.role;var dev=effDev(),role=S.role,R=P.roles[role],me=D.person(R.who);
  stage.setAttribute('data-dev',dev==='tablet-full'?'desktop':dev);stage.classList.toggle('full',realPhone()||dev==='tablet-full'||dev==='desktop');
  var mobile=dev==='phone',rail=(dev==='tablet'||dev==='tablet-full');P.applyZoom();
  app.className='app nav-'+P.navMode()+(mobile?' mobile':'')+(rail?' rail':'');app.classList.toggle('mini',P.navMini());app.setAttribute('data-role',role);
  var cur=P.mods[S.route]||{};
  var SPACE={gerant:'Espace gérant',employe:'Espace équipe',adherent:'Espace cavalier',coach:'Espace coach',pro:'Espace praticien'};
  app.innerHTML='<aside class="side"><button class="club" data-go="'+R.home+'"><span class="lg">'+LOGO(24,'var(--navy-ink)','var(--strass)')+'</span><span class="cn"><b>'+F.esc(role==='coach'?'Stabl Coach':role==='pro'?'Stabl Pro':D.club.name)+'</b><small>'+(SPACE[role]||R.label)+'</small></span></button>'+
    '<nav aria-label="Menu">'+navHTML()+'</nav><div class="me">'+P.ui.av(me)+'<span class="cn"><b>'+F.esc(me.first+' '+me.last)+'</b><small>'+F.esc(me.role||(me.galop?'Galop '+me.galop:me.spec?'Coach '+me.spec:R.label))+'</small></span></div></aside>'+
    '<div class="main"><header class="top"><div class="lft"><button class="btn ghost icon mback" data-back title="Retour">'+ICON('back')+'</button><button class="mlogo" data-go="'+R.home+'" title="Accueil">'+LOGO(24,'var(--navy-ink)','var(--strass)')+'</button><div class="crumb">'+crumbHTML(cur)+'</div></div>'+
    '<button class="cmdk" data-pal title="Rechercher (⌘K)">'+ICON('search')+'<span class="q">Rechercher un cheval, un cavalier, un écran…</span><kbd>⌘ K</kbd></button>'+
    '<div class="tools"><button class="btn ghost sm dbshow" data-dbar-show title="Afficher la barre de démo">'+ICON('down','sm')+'<span>Démo</span></button><button class="btn ghost icon msearch" data-pal title="Rechercher">'+ICON('search')+'</button><button class="btn ghost icon bellb" data-notifs title="Notifications">'+ICON('bell')+'<i></i></button>'+
    '<button class="ai" data-ai title="Stabl AI"><span class="aim">'+LOGO(18,'var(--navy-ink)','var(--strass)')+'</span><span class="lbl">Stabl AI</span></button></div><div class="mt">'+(cur.phoneTitle||cur.title||'')+'</div></header><div class="stw">'+secTabsHTML()+'</div><div class="view"></div></div>'+
    (mobile?'':navTogHTML())+'<nav class="tabbar">'+tabsHTML()+'</nav><div class="toasts"></div>';
  view=$('.view',app);setDom(cur);
  if(mobile)mbk(S.stack.length&&!R0(cur))
  renderView(false);
};

function renderView(anim,dir){
  var m=P.mods[S.route];if(!m||m.role!==S.role){S.route=P.roles[S.role].home;m=P.mods[S.route]}
  if(!m){view.innerHTML='<div class="page">'+P.ui.empty('info','Module en construction')+'</div>';return}
  var page=document.createElement('div');page.className='page';page.setAttribute('data-screen',m.id);view.innerHTML='';view.appendChild(page);view.scrollTop=0;
  if(anim!==false){view.setAttribute('data-dir',dir||'tab');view.classList.remove('enter');void view.offsetWidth;view.classList.add('enter')}
  try{m.render(page,P.ctx())}catch(e){console.error(e);page.innerHTML=P.ui.empty('alert','Cet écran a rencontré une erreur',F.esc(e.message))}
  P.animate(page);if(anim!==false)P.enter(page);
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
  var tb=$('.tabbar',app),os=tb&&tb.querySelector('[aria-current="page"]'),oR=os&&box(os);
  P.renderBadges();setDom(m);
  if(tb&&oR){var ns=tb.querySelector('[aria-current="page"]');if(ns&&ns.getAttribute('data-go')!==os.getAttribute('data-go'))glide(tb,oR,ns,'tbar')}
  var cr=$('.crumb',app);if(cr)cr.innerHTML=crumbHTML(m);
  var mt=$('.mt',app);if(mt)mt.textContent=m.phoneTitle||m.title;
  if(P.isMobile())mbk(!R0(m)&&S.stack.length);
  renderView(true,opts.back?'back':(R0(m)?'tab':'fwd'));
};
function mbk(on){var mb=$('.mback',app),ml=$('.mlogo',app);if(mb)mb.style.display=on?'':'none';if(ml)ml.style.display=on?'none':''}
function R0(m){return P.roles[m.role].tabs.indexOf(m.id)>=0}
P.back=function(){var s=S.stack.pop();if(s)P.go(s.route,s.params,{back:true})};

/* ---------- Animations d'entrée et compteurs ---------- */
/* entrée d'écran : les cartes visibles apparaissent en cascade, les grands chiffres montent jusqu'à leur valeur */
var NUMRE=/^([−-]?)(\d{1,3}(?:[\s\u00a0\u202f]\d{3})+|\d+)(,\d+)?/;
P.enter=function(root){if(RM||!root||!root.animate)return;var vh=(view&&view.clientHeight)||innerHeight,top0=root.getBoundingClientRect().top,k=0;
  $$('.card',root).forEach(function(c){if(c.closest('.rise')||c.parentElement.closest('.card'))return;var r=c.getBoundingClientRect();if(r.top-top0>vh||!r.height)return;
    c.animate([{opacity:0,transform:'translateY(12px)'},{opacity:1,transform:'none'}],{duration:440,delay:Math.min(k++,9)*45,easing:'cubic-bezier(.16,1,.3,1)',fill:'backwards'})});
  $$('.kpi .val,.big,[data-countup]',root).forEach(function(el){if(el.querySelector('[data-count]')||el.hasAttribute('data-count'))return;var r=el.getBoundingClientRect();if(r.top-top0>vh)return;
    var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT),n;while((n=w.nextNode())&&!n.textContent.trim());if(!n)return;var t=n.textContent,lead=t.match(/^\s*/)[0],m=t.slice(lead.length).match(NUMRE);if(!m)return;
    var to=parseFloat((m[1]?'-':'')+m[2].replace(/[\s\u00a0\u202f]/g,'')+(m[3]?'.'+m[3].slice(1):'')),dec=m[3]?m[3].length-1:0,rest=t.slice(lead.length+m[0].length);if(!isFinite(to)||Math.abs(to)<2)return;
    var fmt=function(v){var s=Math.abs(v).toLocaleString('fr-FR',{minimumFractionDigits:dec,maximumFractionDigits:dec}).replace(/[\u202f\u2009]/g,'\u00a0');if(!/[\s\u00a0\u202f]/.test(m[2]))s=s.replace(/\u00a0/g,'');return lead+(v<0?m[1]:'')+s+rest};
    var t0=performance.now(),d=850;n.textContent=fmt(0);(function st(now){if(!n.isConnected)return;var q=Math.min(1,(now-t0)/d),e=1-Math.pow(1-q,4);n.textContent=q<1?fmt(to*e):t;if(q<1)requestAnimationFrame(st)})(t0)})};
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
/* fenêtres passagères (aperçus au survol) : un module les marque data-transient, elles disparaissent au changement d'écran */
P.closeAll=function(){P.closeSheets();$$('[data-transient]',app).forEach(function(e){e.parentNode.removeChild(e)});var a=$('.aip',app);if(a)a.remove();var pl=$('.pal',app);if(pl)pl.remove()};

/* ---------- Notifications éphémères ---------- */
P.toast=function(msg,o){o=o||{};var t=document.createElement('div');t.className='toast';t.innerHTML=ICON(o.icon||'checkc')+'<span>'+msg+'</span>'+(o.undo?'<button>Annuler</button>':'');
  var box=$('.toasts',app);if(!box)return;box.appendChild(t);if(o.undo)$('button',t).onclick=function(){o.undo();t.remove()};
  setTimeout(function(){t.classList.add('out');setTimeout(function(){t.remove()},320)},o.ms||3200)};

/* ---------- Téléchargements : de vrais fichiers (CSV pour Excel, ICS, PDF, JSON, texte) ----------
   P.download('factures.csv', [['N°','Client'],['F-1','Léa']])   tableau de lignes → CSV (BOM UTF-8, « ; »)
   P.download('soins.ics', [{title, start:'2026-11-18T09:00', end, place, note}])   événements → ICS
   P.download('releve.pdf', {title, sub, blocks:[{h:'Titre'},{p:'Texte'},{kv:[['Total','120 €']]},{table:{cols:[…],rows:[[…]]}}]})   → PDF A4
   P.download('notes.txt', 'texte', 'text/plain')   contenu brut, type facultatif (déduit de l'extension)
   Renvoie true si le fichier est parti. Le toast est affiché par P.download sauf {quiet:true} en 4e argument. */
P.download=function(name,content,type,o){o=o||{};var ext=(String(name).split('.').pop()||'').toLowerCase(),data=content,mime=type;
  try{
    if(ext==='csv'&&typeof content!=='string')data=P.download.csvText(content);
    else if(ext==='ics'&&typeof content!=='string')data=P.download.icsText(content);
    else if(ext==='pdf'&&typeof content!=='string'&&!(content instanceof Uint8Array))data=P.download.pdfBytes(content);
    else if(ext==='json'&&typeof content!=='string')data=JSON.stringify(content,null,2);
    mime=mime||{csv:'text/csv;charset=utf-8',ics:'text/calendar;charset=utf-8',pdf:'application/pdf',json:'application/json',txt:'text/plain;charset=utf-8',html:'text/html;charset=utf-8'}[ext]||'application/octet-stream';
    var a=document.createElement('a');a.href=URL.createObjectURL(new Blob([data],{type:mime}));a.download=name;a.style.display='none';document.body.appendChild(a);a.click();
    setTimeout(function(){URL.revokeObjectURL(a.href);a.remove()},1500);
    if(!o.quiet)P.toast(o.msg||F.esc(name)+' téléchargé',{icon:'download'});return true
  }catch(e){P.toast('Le téléchargement n’a pas pu démarrer',{icon:'alert'});return false}};
P.download.csvText=function(rows){return '\ufeff'+rows.map(function(r){return r.map(function(c){c=String(c==null?'':c).replace(/[\u202f\u00a0]/g,' ');return /[;"\n\r]/.test(c)?'"'+c.replace(/"/g,'""')+'"':c}).join(';')}).join('\r\n')+'\r\n'};
P.download.icsText=function(evs){var p2=function(n){return (n<10?'0':'')+n},st=function(x){var d=toD(x);return d.getFullYear()+p2(d.getMonth()+1)+p2(d.getDate())+'T'+p2(d.getHours())+p2(d.getMinutes())+'00'},esc=function(s){return String(s||'').replace(/\\/g,'\\\\').replace(/;/g,'\\;').replace(/,/g,'\\,').replace(/\n/g,'\\n')},now=new Date(),L=['BEGIN:VCALENDAR','VERSION:2.0','PRODID:-//Stabl//FR','CALSCALE:GREGORIAN','METHOD:PUBLISH'];
  evs.forEach(function(e,i){var s=toD(e.start),en=e.end?toD(e.end):new Date(s.getTime()+(e.min||60)*6e4);L.push('BEGIN:VEVENT','UID:'+(e.uid||('stabl-'+s.getTime()+'-'+i))+'@stablapp.fr','DTSTAMP:'+st(now),'DTSTART;TZID=Europe/Paris:'+st(s),'DTEND;TZID=Europe/Paris:'+st(en),'SUMMARY:'+esc(e.title));if(e.place)L.push('LOCATION:'+esc(e.place));if(e.note)L.push('DESCRIPTION:'+esc(e.note));L.push('END:VEVENT')});
  L.push('END:VCALENDAR');return L.join('\r\n')+'\r\n'};
/* transforme un morceau d'écran (facture, devis, bordereau, attestation) en document PDF :
   P.download('F-2026-1173.pdf', P.download.docOf(el.querySelector('.fa-paper'), {title:'Facture F-2026-1173'})) */
P.download.docOf=function(root,o){o=o||{};var blocks=[],BL=/^(block|flex|grid|table|list-item|inline-flex|inline-grid|inline-block)$/;
  var SKIP='svg,button,.btn,.av,.tabs,.seg,[role="tablist"],[aria-hidden="true"],input,select,textarea';
  function tx(e){var w=document.createTreeWalker(e,NodeFilter.SHOW_TEXT),n,out=[];while((n=w.nextNode())){var p=n.parentElement;if(p&&p!==e&&p.closest(SKIP)&&e.contains(p.closest(SKIP)))continue;if(p&&getComputedStyle(p).display==='none')continue;out.push(n.textContent)}
    return out.join(' ').replace(/[  ]/g,' ').replace(/\s+/g,' ').replace(/\s+([,.])/g,'$1').trim()}
  function vis(e){var s=getComputedStyle(e);return s.display!=='none'&&s.visibility!=='hidden'&&!e.closest(SKIP)}
  function blockKids(e){return Array.prototype.filter.call(e.children,function(c){return vis(c)&&BL.test(getComputedStyle(c).display)})}
  function walk(e){if(!vis(e))return;var tag=e.tagName;
    if(tag==='TABLE'){var hd=Array.prototype.map.call(e.querySelectorAll('thead th'),tx),rows=Array.prototype.map.call(e.querySelectorAll('tbody tr'),function(r){return Array.prototype.map.call(r.children,tx)}).filter(function(r){return r.join('')});
      var n=Math.max(hd.length,rows.reduce(function(a,r){return Math.max(a,r.length)},0));if(!hd.length)hd=new Array(n).join('.').split('.').map(function(){return ''});blocks.push({table:{cols:hd,rows:rows,num:hd.map(function(h,i){return i}).filter(function(i){return i>0&&rows.length&&rows.every(function(r){return /^[−\-+]?[\d\s.,]+\s?(€|%|h)?$/.test(r[i]||'0')})})}});return}
    if(tag==='DL'){var kv=[],dts=e.querySelectorAll('dt');Array.prototype.forEach.call(dts,function(d){var dd=d.nextElementSibling;kv.push([tx(d),dd?tx(dd):''])});blocks.push({kv:kv});return}
    var kids=blockKids(e);
    if(kids.length&&kids.every(function(k){return !blockKids(k).length})&&/flex|grid/.test(getComputedStyle(e).display)&&kids.length<=3&&getComputedStyle(e).flexDirection!=='column'){var t=kids.map(tx).filter(Boolean);if(t.length===2){var last=blocks[blocks.length-1];if(last&&last.kv)last.kv.push(t);else blocks.push({kv:[t]})}else if(t.length)blocks.push({p:t.join(' · ')});return}
    if(kids.length){kids.forEach(walk);return}
    var t=tx(e);if(!t)return;var s=getComputedStyle(e),fw=+s.fontWeight,fs=parseFloat(s.fontSize);blocks.push(/^H[1-4]$/.test(tag)||(fw>=700&&fs>=17)?{h:t}:{p:t})}
  if(root)walk(root);if(o.title&&blocks[0]&&blocks[0].h===o.title)blocks.shift();
  return {title:o.title||'Document',sub:o.sub||(D.club&&D.club.name),org:D.club&&D.club.name,blocks:blocks}};
/* PDF A4 minimal (Helvetica, WinAnsi) : en-tête avec le logo, titre, blocs, pied de page numéroté */
P.download.pdfBytes=function(doc){var W=595,H=842,M=48,pages=[],cur=null,y=0,B=window.BRAND||{};
  var WA={'€':128,'‚':130,'„':132,'…':133,'‘':145,'’':146,'“':147,'”':148,'•':149,'–':150,'—':151,'œ':156,'Œ':140,'Ÿ':159,'\u202f':32,'\u2009':32,'−':45,'→':45,'·':183};
  function enc(s){s=String(s==null?'':s);var o='';for(var i=0;i<s.length;i++){var c=s[i],k=s.charCodeAt(i);var v=WA[c]!=null?WA[c]:(k<256?k:63);var ch=String.fromCharCode(v);o+=(ch==='('||ch===')'||ch==='\\')?'\\'+ch:ch}return o}
  function tw(s,sz,b){return String(s).length*sz*(b?.56:.51)}
  function wrap(s,sz,max,b){var out=[],line='';String(s).split(/\s+/).forEach(function(wd){var t=line?line+' '+wd:wd;if(tw(t,sz,b)>max&&line){out.push(line);line=wd}else line=t});if(line)out.push(line);return out.length?out:['']}
  function page(){cur=[];pages.push(cur);y=H-M;
    /* logo : silhouette marine + « stabl » */
    var pth=(B.path||'').match(/[MCLZ]|-?[\d.]+/g)||[],cmd='',num=[],ops='',sc=.24,ox=M,oy=H-M+6;
    function fl(){if(!cmd)return;var k=cmd==='C'?6:2;for(var i=0;i+k<=num.length;i+=k){var q=num.slice(i,i+k).map(function(v,j){return (j%2?(oy-v*sc):(ox+v*sc)).toFixed(2)}).join(' ');ops+=q+(cmd==='M'?' m ':cmd==='L'?' l ':' c ')}num=[]}
    pth.forEach(function(t){if(/[MCLZ]/.test(t)){fl();if(t==='Z'){ops+='h ';cmd=''}else cmd=t}else num.push(+t)});fl();
    if(ops)cur.push('0.039 0.086 0.212 rg '+ops+'f');
    cur.push('BT /F2 15 Tf 0.039 0.086 0.212 rg '+(M+29)+' '+(H-M-13)+' Td ('+enc(B.wordmark||'stabl')+') Tj ET');
    if(doc.org)cur.push('BT /F1 9 Tf 0.35 0.38 0.49 rg '+(W-M-tw(doc.org,9))+' '+(H-M-11)+' Td ('+enc(doc.org)+') Tj ET');
    cur.push('0.86 0.88 0.93 RG 0.6 w '+M+' '+(H-M-26)+' m '+(W-M)+' '+(H-M-26)+' l S');y=H-M-54}
  function need(h){if(y-h<M+24)page()}
  function text(s,x,sz,b,col){cur.push('BT /'+(b?'F2':'F1')+' '+sz+' Tf '+(col||'0.039 0.086 0.212')+' rg '+x.toFixed(1)+' '+y.toFixed(1)+' Td ('+enc(s)+') Tj ET')}
  page();
  wrap(doc.title||'',20,W-2*M,true).forEach(function(l){need(26);text(l,M,20,true);y-=26});
  if(doc.sub){wrap(doc.sub,10.5,W-2*M).forEach(function(l){need(15);text(l,M,10.5,false,'0.35 0.38 0.49');y-=15})}y-=10;
  (doc.blocks||[]).forEach(function(bk){
    if(bk.h){y-=6;need(30);text(bk.h,M,12.5,true);y-=20}
    else if(bk.p!=null){wrap(bk.p,10.5,W-2*M).forEach(function(l){need(15);text(l,M,10.5);y-=15});y-=6}
    else if(bk.kv){bk.kv.forEach(function(r){need(17);text(r[0],M,10.5,false,'0.35 0.38 0.49');var v=String(r[1]);text(v,W-M-tw(v,10.5,true),10.5,true);y-=6;cur.push('0.92 0.93 0.96 RG 0.5 w '+M+' '+y+' m '+(W-M)+' '+y+' l S');y-=11});y-=6}
    else if(bk.table){var T=bk.table,n=T.cols.length,ws=T.w||T.cols.map(function(){return 1}),sw=ws.reduce(function(a,b){return a+b},0),cx=[],x=M;ws.forEach(function(w){cx.push(x);x+=w/sw*(W-2*M)});
      var num=T.num||[],row=function(r,b){var lines=r.map(function(c,i){var cw=(i<n-1?cx[i+1]:W-M)-cx[i]-8;return wrap(c==null?'':c,9.5,cw,b)}),hh=Math.max.apply(null,lines.map(function(l){return l.length}))*13+5;need(hh+4);
        if(b){cur.push('0.95 0.96 0.98 rg '+M+' '+(y-hh+10)+' '+(W-2*M)+' '+(hh)+' re f')}
        var y0=y;lines.forEach(function(ls,i){y=y0;ls.forEach(function(l){var right=num.indexOf(i)>=0,cw=(i<n-1?cx[i+1]:W-M)-cx[i]-8;text(l,right?cx[i]+cw-tw(l,9.5,b):cx[i]+4,9.5,b,b?'0.35 0.38 0.49':null);y-=13})});y=y0-hh;cur.push('0.92 0.93 0.96 RG 0.5 w '+M+' '+(y+8)+' m '+(W-M)+' '+(y+8)+' l S')};
      row(T.cols,true);T.rows.forEach(function(r){row(r,false)});y-=10}
  });
  var tot=pages.length,objs=[],o=function(s){objs.push(s);return objs.length};
  o('<< /Type /Catalog /Pages 2 0 R >>');o('');o('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');o('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>');
  var kids=[];pages.forEach(function(pg,i){var ft=(doc.foot||'Document généré par Stabl')+' · '+new Date(D.today||Date.now()).toLocaleDateString('fr-FR')+' · page '+(i+1)+'/'+tot;
    pg.push('BT /F1 8.5 Tf 0.53 0.55 0.64 rg '+M+' 28 Td ('+enc(ft)+') Tj ET');var s=pg.join('\n');var c=o('<< /Length '+s.length+' >>\nstream\n'+s+'\nendstream');kids.push(o('<< /Type /Page /Parent 2 0 R /MediaBox [0 0 '+W+' '+H+'] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents '+c+' 0 R >>'))});
  objs[1]='<< /Type /Pages /Kids ['+kids.map(function(k){return k+' 0 R'}).join(' ')+'] /Count '+kids.length+' >>';
  var out='%PDF-1.4\n%\u00e2\u00e3\u00cf\u00d3\n',off=[];objs.forEach(function(s,i){off.push(out.length);out+=(i+1)+' 0 obj\n'+s+'\nendobj\n'});
  var xr=out.length;out+='xref\n0 '+(objs.length+1)+'\n0000000000 65535 f \n'+off.map(function(x){return ('000000000'+x).slice(-10)+' 00000 n \n'}).join('')+'trailer\n<< /Size '+(objs.length+1)+' /Root 1 0 R >>\nstartxref\n'+xr+'\n%%EOF';
  var u=new Uint8Array(out.length);for(var i=0;i<out.length;i++)u[i]=out.charCodeAt(i)&255;return u};

/* ---------- Popover de notifications ---------- */
var NDOM={ok:'d-hz',warn:'d-mo',bad:'d-cr',acc:'d-acc',info:'d-tm'};
function notifs(btn){P.closeSheets();var r=btn.getBoundingClientRect(),ar=app.getBoundingClientRect(),zk=P.zk(),p=document.createElement('div');p.className='pop-o';
  var pw=Math.min(400,ar.width/zk-20),rt=Math.max(10,Math.min((ar.right-r.right)/zk-8,ar.width/zk-pw-10));p.style.cssText='top:'+((r.bottom-ar.top)/zk+8)+'px;right:'+rt+'px;width:'+pw+'px';
  p.innerHTML='<div class="ch" style="padding-bottom:12px"><h3>Notifications</h3><button class="btn ghost sm" data-readall>Tout marquer lu</button></div><div class="list">'+D.notifs.map(function(n){return '<div class="li click">'+'<span class="ico sm '+(NDOM[n.c]||'d-acc')+'">'+ICON(n.i,'sm')+'</span><div class="grow"><div class="s" style="color:var(--ink);font-weight:500;line-height:1.4">'+n.t+'</div><div class="xs mut" style="margin-top:2px">'+n.w+'</div></div></div>'}).join('')+'</div>';
  var ra=$('[data-readall]',p);if(ra)ra.onclick=function(e){e.stopPropagation();var dot=$('.bellb i',app);if(dot)dot.remove();p.remove();P.toast('Notifications marquées comme lues')};
  app.appendChild(p);setTimeout(function(){document.addEventListener('click',function h(e){if(!p.contains(e.target)){p.remove();document.removeEventListener('click',h)}})},0)}

/* ---------- Palette de commandes ⌘K ---------- */
P.actions=[];/* P.actions.push({role,label,icon,run:function(){}}) */
P.palette=function(){if($('.pal',app))return;var sc=document.createElement('div');sc.className='scrim';sc.style.background='rgba(10,22,54,.20)';
  var pl=document.createElement('div');pl.className='pal';pl.innerHTML='<div class="pin">'+ICON('search')+'<input id="pal-q" placeholder="Chercher un cheval, un adhérent, un écran, une action…" autocomplete="off"><span class="kbd">Échap</span></div><div class="pres"></div><div class="pfoot"><span><span class="kbd">↑↓</span> naviguer</span><span><span class="kbd">↵</span> ouvrir</span><span style="margin-left:auto;display:flex;align-items:center;gap:8px">'+LOGO(18,'var(--mut)','var(--strass)')+'Stabl</span></div>';
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
  var w=document.createElement('div');w.className='aip';w.innerHTML='<div class="aih"><span class="orb">'+LOGO(24,'var(--navy-ink)','var(--strass)',true)+'</span><div class="grow"><b>Stabl AI</b><div class="xs mut">Il agit dans '+D.club.short+' avec vos droits '+(function(l){l=l.toLowerCase();return (/^[aeéèiouh]/.test(l)?'d’':'de ')+l})(P.roles[S.role].label)+'</div></div><button class="btn ghost icon sm" data-x>'+ICON('x')+'</button></div>'+
   '<div class="aib"><div class="msg a">Bonjour '+P.ctx().me.first+'. Posez une question ou demandez une action : je cherche dans tout Stabl et je vous montre ce que je vais faire avant de le faire.</div></div>'+
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
  if(t.closest('[data-navtog]')){P.toggleNav();return}
  if(!t.closest('.navfly'))P.navFlyClose();
  var gh=t.closest('[data-navgrp]');if(gh&&app.contains(gh)){P.toggleGroup(gh.getAttribute('data-navgrp'));return}
  var g=t.closest('[data-go]');if(g&&app.contains(g)){e.preventDefault();var pr={};Array.prototype.forEach.call(g.attributes,function(a){if(a.name.indexOf('data-p-')===0)pr[a.name.slice(7)]=a.value});if(g.getAttribute('data-id'))pr.id=g.getAttribute('data-id');P.go(g.getAttribute('data-go'),pr);return}
  if(t.closest('[data-back]')){P.back();return}
  if(t.closest('[data-pal]')){P.palette();return}
  if(t.closest('[data-ai]')){P.assistant();return}
  var nb=t.closest('[data-notifs]');if(nb){notifs(nb);return}
  if(t.closest('[data-more]')){var mods=P.modsFor(S.role);var grp=[],by={};mods.forEach(function(m){if(!by[m.group]){by[m.group]=[];grp.push(m.group)}by[m.group].push(m)});
    P.sheet({title:'Tous les écrans',icon:'grid',body:'<div class="lnch">'+grp.map(function(g){return '<section><div class="eyebrow">'+g+'</div><div class="lgrid">'+by[g].map(function(m){var bd=badgeOf(m);return '<button class="lapp d-'+P.domOf(m)+'" data-go="'+m.id+'"><span class="aic">'+ICON(m.icon)+(bd&&bd.hot?'<em>'+(bd.v!=null?bd.v:'')+'</em>':'')+'</span><b>'+(m.short||P.tabShort[m.id]||m.title)+'</b></button>'}).join('')+'</div></section>'}).join('')+'</div>'});lnchIdx();return}
  var rb=t.closest('[data-role]');if(rb&&demo.querySelector('.dbar').contains(rb)){S.role=rb.getAttribute('data-role');S.route=P.roles[S.role].home;S.params={};S.stack=[];$$('.dbar [data-role]',demo).forEach(function(b){b.setAttribute('aria-selected',b===rb)});P.renderShell();if(!RM&&app.animate)app.animate([{opacity:0,transform:'scale(.985) translateY(6px)'},{opacity:1,transform:'none'}],{duration:380,easing:'cubic-bezier(.2,.8,.2,1)'});try{history.replaceState(null,'','#'+S.route)}catch(e){}return}
  var db=t.closest('[data-dev]');if(db&&demo.querySelector('.dbar').contains(db)){S.dev=db.getAttribute('data-dev');P.store.set('dev',S.dev);$$('[data-dev]',demo).forEach(function(b){b.setAttribute('aria-selected',b===db)});P.renderShell();return}
  if(t.closest('[data-theme-t]')){var r=document.documentElement,dk=r.getAttribute('data-theme')==='dark'||(!r.getAttribute('data-theme')&&matchMedia('(prefers-color-scheme:dark)').matches);r.setAttribute('data-theme',dk?'light':'dark');P.store.set('theme',dk?'light':'dark');return}
  if(t.closest('[data-tour]')){P.tour();return}
  if(t.closest('[data-dbar-hide]')||t.closest('[data-dbar-show]')){var off=!!t.closest('[data-dbar-hide]');P.store.set('nobar',off);demo.classList.toggle('nobar',off);setTimeout(function(){P.fitCharts()},60);P.toast(off?'Barre de démo masquée : la page s’affiche en entier':'Barre de démo affichée',{icon:off?'expand':'checkc'});return}
  if(t.closest('[data-dens]')){var L=P.densities,i=L.indexOf(P.density()),n=L[(i+1)%L.length];P.store.set('density',n[0]);P.applyZoom();setTimeout(function(){P.fitCharts()},60);P.toast('Taille de l’affichage : '+n[1],{icon:'checkc'});return}
  /* interrupteurs et cases génériques */
  var tg=t.closest('.tog');if(tg&&!tg.hasAttribute('data-manual')){tg.setAttribute('aria-checked',tg.getAttribute('aria-checked')!=='true')}
  var ck=t.closest('.chk');if(ck&&!ck.hasAttribute('data-manual')){ck.setAttribute('aria-checked',ck.getAttribute('aria-checked')!=='true')}
  var sg=t.closest('.seg button[role="tab"],.tabs button[role="tab"]');if(sg&&!sg.closest('.dbar')){$$('button',sg.parentNode).forEach(function(b){b.setAttribute('aria-selected',b===sg)})}
  var tag=t.closest('.tag');if(tag&&!tag.hasAttribute('data-manual')){tag.setAttribute('aria-pressed',tag.getAttribute('aria-pressed')!=='true')}
}
function onKey(e){if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==='k'){e.preventDefault();P.palette()}else if(e.key==='Escape'){var s=$('.sheet',app);if(s&&s.close)s.close();else P.closeAll()}else if(e.key==='['&&!e.metaKey&&!e.ctrlKey&&!e.altKey&&app&&!P.isMobile()&&!/^(INPUT|TEXTAREA|SELECT)$/.test((e.target.tagName||''))&&!e.target.isContentEditable){P.toggleNav()}}

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

/* ---------- Motion : la pastille glisse d'un choix à l'autre (segments, onglets, barre d'onglets) ---------- */
function box(e){return {x:e.offsetLeft,y:e.offsetTop,w:e.offsetWidth,h:e.offsetHeight}}
function glide(cont,o,btn,kind){if(RM||!cont||!btn||!o||!btn.animate)return;var n=box(btn);if(!n.w||(o.x===n.x&&o.y===n.y&&o.w===n.w))return;
  var g=document.createElement('span');g.className='glide gl-'+kind;g.setAttribute('aria-hidden','true');
  if(kind==='tbar'){var bg=getComputedStyle(btn).getPropertyValue('--d-bg');if(bg)g.style.background=bg.trim()}
  cont.appendChild(g);btn.classList.add('gl-hide');
  var fr=function(r){return kind==='tab'?{transform:'translate('+(r.x+12)+'px,'+(r.y+r.h-3)+'px)',width:Math.max(0,r.w-24)+'px'}:{transform:'translate('+r.x+'px,'+r.y+'px)',width:r.w+'px',height:r.h+'px'}};
  var a=g.animate([fr(o),fr(n)],{duration:kind==='tbar'?420:340,easing:'cubic-bezier(.3,1.25,.45,1)',fill:'both'});
  var end=function(){btn.classList.remove('gl-hide');if(g.parentNode)g.parentNode.removeChild(g)};a.onfinish=end;a.oncancel=end;
  var ic=btn.querySelector('svg.i');if(ic&&kind!=='tab')ic.animate([{transform:'scale(1)'},{transform:'scale(.82)'},{transform:'scale(1.12)'},{transform:'scale(1)'}],{duration:460,easing:'ease-out'});
}
P.glide=glide;
function glideWatch(e){var b=e.target.closest&&e.target.closest('.seg>button,.tabs>button,.tabs>a');if(!b||b.getAttribute('aria-selected')==='true')return;
  var c=b.parentElement,sel=c.querySelector(':scope>[aria-selected="true"]');if(!sel)return;
  var all=Array.prototype.slice.call(document.querySelectorAll('.seg,.tabs')),idx=all.indexOf(c),kind=c.classList.contains('seg')?'seg':'tab',o=box(sel),bi=Array.prototype.indexOf.call(c.children,b);
  setTimeout(function(){var nc=document.querySelectorAll('.seg,.tabs')[idx];if(!nc)return;var ns=nc.querySelector(':scope>[aria-selected="true"]');if(ns&&Array.prototype.indexOf.call(nc.children,ns)===bi)glide(nc,o,ns,kind)},0)}
/* lanceur : chaque icône apparaît à son tour */
function lnchIdx(){$$('.lnch .lapp',app).forEach(function(b,i){b.style.setProperty('--i',Math.min(i,16))})}
/* écran de lancement : le logo, le nom, le club ; il s'efface seul et ne bloque jamais les clics */
function splash(){if(!frame)return;var B=window.BRAND||{};var sp=document.createElement('div');sp.className='splash';sp.setAttribute('aria-hidden','true');
  sp.innerHTML='<div class="spc"><span class="spl">'+LOGO(92,'var(--hero-ink)','var(--strass)',true)+'</span><b>'+F.esc(B.wordmark||B.name||'stabl')+'</b><small>'+F.esc(D.club.name)+'</small><i class="spbar"><i></i></i></div>';
  frame.appendChild(sp);setTimeout(function(){sp.classList.add('out')},RM?300:1050);setTimeout(function(){if(sp.parentNode)sp.parentNode.removeChild(sp)},RM?600:1500)}
P.splash=splash;

/* ---------- Mises à jour : « Mise à jour faite » au premier lancement d'une nouvelle version,
   et « Nouvelle version disponible » si une version plus récente est publiée pendant qu'on s'en sert ---------- */
function updBar(html,stay){var o=$('.updb',demo);if(o)o.remove();var b=document.createElement('div');b.className='updb';b.setAttribute('role','status');b.innerHTML=html;demo.appendChild(b);
  var x=$('[data-updx]',b);if(x)x.onclick=function(){b.classList.add('out');setTimeout(function(){b.remove()},300)};
  var r=$('[data-updr]',b);if(r)r.onclick=function(){P.store.set('verreload',1);location.reload()};
  if(!stay)setTimeout(function(){if(b.isConnected){b.classList.add('out');setTimeout(function(){b.remove()},300)}},7000);return b}
P.checkUpdate=function(){var V=window.DEMO_V;if(!V||!/^https?:/.test(location.protocol))return;
  fetch('version.json?t='+Date.now(),{cache:'no-store'}).then(function(r){return r.ok?r.json():null}).then(function(j){if(!j||!j.v||j.v===V.v||$('.updb.avail',demo))return;
    updBar('<span class="ui">'+ICON('download','sm')+'</span><div class="ut"><b>Nouvelle version disponible</b><small>'+F.esc(j.note||'Des améliorations vous attendent.')+'</small></div><button class="btn sm pri" data-updr>Mettre à jour</button><button class="btn ghost icon sm" data-updx title="Plus tard">'+ICON('x','sm')+'</button>',true).classList.add('avail')}).catch(function(){})};
function updStart(){var V=window.DEMO_V;if(!V)return;var last=P.store.get('ver',null);P.store.set('ver',V.v);
  if(last&&last!==V.v)setTimeout(function(){updBar('<span class="ui ok">'+ICON('checkc','sm')+'</span><div class="ut"><b>Mise à jour faite</b><small>'+F.esc(V.note||'Vous avez la dernière version de Stabl.')+'</small></div><button class="btn ghost icon sm" data-updx title="Fermer">'+ICON('x','sm')+'</button>')},RM?400:1500);
  setInterval(P.checkUpdate,4*60*1000);document.addEventListener('visibilitychange',function(){if(document.visibilityState==='visible')P.checkUpdate()});setTimeout(P.checkUpdate,8000)}

/* ---------- Démarrage ---------- */
P.start=function(){
  var th=P.store.get('theme',null);if(th)document.documentElement.setAttribute('data-theme',th);
  var h=(location.hash||'').slice(1);if(h&&P.mods[h]){S.role=P.mods[h].role;S.route=h}else{S.route=P.roles[S.role].home}
  document.documentElement.lang='fr';buildDemo();P.renderShell();splash();updStart();
  document.addEventListener('click',glideWatch,true);document.addEventListener('click',onClick);
  if(window.PIAFFE_MENUS){demo.insertAdjacentHTML('beforeend',navSwitchHTML());demo.classList.add('has-navsw')}
  document.addEventListener('mouseover',function(e){if(!app||P.isMobile()||(P.navMode()!=='survol'&&!P.navMini()))return;var r=e.target.closest&&e.target.closest('[data-navfly]');if(r&&app.contains(r)){var g=r.getAttribute('data-navfly');if(navGroupsOf().by[g].length>1||P.navMini())P.navFly(g,r);else P.navFlyClose()}});
  document.addEventListener('mouseout',function(e){if(!app||(P.navMode()!=='survol'&&!P.navMini()))return;var r=e.target.closest&&e.target.closest('.side');var to=e.relatedTarget;if(r&&!(to&&(r.contains(to)||(to.closest&&to.closest('.navfly'))))){clearTimeout(flyT);flyT=setTimeout(P.navFlyClose,220)}});document.addEventListener('keydown',onKey);
  var lastW=effDev();var rz=0;window.addEventListener('resize',function(){var d=effDev();if(d!==lastW){lastW=d;P.renderShell()}else{P.applyZoom();clearTimeout(rz);rz=setTimeout(function(){P.fitCharts()},150)}});
  window.addEventListener('hashchange',function(){var h=(location.hash||'').slice(1);if(h&&P.mods[h]&&h!==S.route)P.go(h)});
};
})();
