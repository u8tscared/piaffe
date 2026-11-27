/* Lot 47 · Météo qui conseille : prévisions gratuites Open-Meteo (sans clé, sans compte) et suggestions
   que le gérant confirme ou ignore. Rien ne change sans son accord.
   Écran : meteo (gérant). Données synchronisées : wxMoves (reprise déplacée pour une date, remise en place
   toute seule ensuite), wxSkips (suggestions ignorées). Les tâches créées vont dans D.tasks.
   Démo : prévisions d'exemple autour du 17 novembre, et bouton « Voir la vraie météo » qui interroge Open-Meteo.
   Appli : vraie météo du club (coordonnées du club, sinon géocodage de l'adresse par api-adresse.data.gouv.fr). */
(function(){
var D=P.D,F=P.fmt,U=P.ui,E=F.esc,NB='\u00a0';
var DEMO=!D.me||D.me.gerant==='s01'||!!(window.PL&&PL.sandbox);
['wxMoves','wxSkips'].forEach(function(k){if(!Array.isArray(D[k]))D[k]=[]});
var DAYS=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
function p2(n){return (n<10?'0':'')+n}
function mm(s){return /^\d\d:\d\d$/.test(s||'')?(+s.slice(0,2))*60+(+s.slice(3)):null}
function hm(m){var h=Math.floor(m/60),x=m%60;return h+NB+'h'+(x?NB+p2(x):'')}
function now(){return DEMO?new Date(D.today):new Date()}
function isoOf(d){return D.iso(d)}
function dayIso(o){var d=now();d.setHours(12,0,0,0);d.setDate(d.getDate()+o);return isoOf(d)}
function uid(p){return window.PL&&PL.uid?PL.uid(p):p+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function tf(x){return String(Math.round(x)).replace('-','\u2212')}
function cap1(s){s=String(s||'');return s.charAt(0).toUpperCase()+s.slice(1)}
function covered(a){return a&&/couvert/i.test(a.kind||'')&&!/rond|longe|marcheur/i.test(a.name||'')}
function arena(id){return (D.club.arenas||[]).find(function(a){return a.id===id})}
function dayLabel(iso){var t=dayIso(0),t1=dayIso(1);if(iso===t)return 'aujourd’hui';if(iso===t1)return 'demain';var d=new Date(iso+'T12:00:00');return DAYS[d.getDay()]+' '+d.getDate()}

/* ---------- Codes météo WMO (Open-Meteo) ---------- */
function wIcon(c){if(c==null)return 'cloud';if(c<=1)return 'sun';if(c<=3||c===45||c===48)return 'cloud';if(c>=95)return 'bolt';if(c>=71&&c<=77||c===85||c===86)return 'cloud';if(c>=51)return 'rain';return 'cloud'}
function wText(c){if(c==null)return 'Inconnu';if(c===0)return 'Ciel clair';if(c<=2)return 'Éclaircies';if(c===3)return 'Couvert';if(c===45||c===48)return 'Brouillard';if(c<=57)return 'Bruine';if(c<=67)return 'Pluie';if(c<=77)return 'Neige';if(c<=82)return 'Averses';if(c<=86)return 'Averses de neige';return 'Orage'}

/* ---------- Prévisions ---------- */
var WX={data:null,src:DEMO?'exemple':'',err:'',loading:false,at:null};
P.wx=WX;
/* Démo : une journée humide (pluie de 16 h à 20 h), une nuit de gel, du vent demain après-midi */
function sample(){var base=now();base.setHours(0,0,0,0);var hours=[];
  for(var d=0;d<2;d++)for(var h=0;h<24;h++){var t=new Date(base);t.setDate(base.getDate()+d);t.setHours(h);
    var rain=0,prob=10,code=2,gust=18,temp=d===0?(h<8?1+h*.3:h<15?4+(h-8)*1.1:12-(h-15)*.9):(h<8?-3+h*.5:h<14?2+(h-8)*1.3:10-(h-14)*.7);
    if(d===0&&h>=16&&h<=20){rain=h===18?3.4:h===17||h===19?2.1:.9;prob=85;code=63}
    if(d===0&&h>=13&&h<16){prob=40;code=3}
    if(d===1&&h>=14&&h<=18){gust=h===16?68:58;code=3}
    hours.push({t:isoOf(t)+'T'+p2(h)+':00',temp:Math.round(temp*10)/10,rain:rain,prob:prob,code:code,gust:gust})}
  var days=[[9,1,8,63,30],[10,-3,0,3,68],[8,2,6,61,40],[7,1,12,63,35],[10,0,0,1,20],[12,3,1,2,25],[9,2,3,3,30]].map(function(x,i){var t=new Date(base);t.setDate(base.getDate()+i);
    return {d:isoOf(t),max:x[0],min:i===0?-3:x[1],rain:x[2],code:x[3],gust:x[4]}});
  /* nuit de ce soir à demain : minimum −3 °C */
  return {hours:hours,days:days}}
function coords(){var c=D.club;if(+c.lat&&+c.lon)return Promise.resolve([+c.lat,+c.lon]);
  if(DEMO)return Promise.resolve([48.5686,1.9408]);
  var q=c.address||c.city;if(!q)return Promise.reject(new Error('adresse'));
  return fetch('https://api-adresse.data.gouv.fr/search/?limit=1&q='+encodeURIComponent(q)).then(function(r){return r.json()}).then(function(j){var f=j.features&&j.features[0];if(!f)throw new Error('adresse');
    c.lat=f.geometry.coordinates[1];c.lon=f.geometry.coordinates[0];return [c.lat,c.lon]})}
function fetchReal(){WX.loading=true;WX.err='';
  var key='stabl:wx2:'+(D.club.id||'demo');
  try{var c=JSON.parse(localStorage.getItem(key)||'null');if(c&&Date.now()-c.at<3600e3){WX.data=c.data;WX.src='vraie';WX.at=new Date(c.at);WX.loading=false;return Promise.resolve(true)}}catch(e){}
  return coords().then(function(ll){return fetch('https://api.open-meteo.com/v1/forecast?latitude='+ll[0]+'&longitude='+ll[1]+
      '&hourly=temperature_2m,precipitation,precipitation_probability,weather_code,wind_gusts_10m'+
      '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max&timezone=Europe%2FParis&forecast_days=7')})
    .then(function(r){if(!r.ok)throw new Error('http');return r.json()}).then(function(j){var h=j.hourly,d=j.daily;
      var data={hours:h.time.slice(0,48).map(function(t,i){return {t:t,temp:h.temperature_2m[i],rain:h.precipitation[i]||0,prob:h.precipitation_probability?h.precipitation_probability[i]||0:0,code:h.weather_code[i],gust:h.wind_gusts_10m?h.wind_gusts_10m[i]||0:0}}),
        days:d.time.map(function(t,i){return {d:t,max:Math.round(d.temperature_2m_max[i]),min:Math.round(d.temperature_2m_min[i]),rain:Math.round((d.precipitation_sum[i]||0)*10)/10,code:d.weather_code[i],gust:Math.round(d.wind_gusts_10m_max?d.wind_gusts_10m_max[i]||0:0)}})};
      WX.data=data;WX.src='vraie';WX.at=new Date();WX.loading=false;try{localStorage.setItem(key,JSON.stringify({at:Date.now(),data:data}))}catch(e){}return true})
    .catch(function(e){WX.loading=false;WX.err=e&&e.message==='adresse'?'Ajoutez l’adresse du club dans Réglages pour recevoir la météo.':'Prévisions indisponibles pour le moment (pas de réseau ?). Réessayez plus tard.';return false})}
function ensure(){if(WX.data||WX.loading)return Promise.resolve();if(DEMO&&WX.src==='exemple'){WX.data=sample();WX.at=now();return Promise.resolve()}return fetchReal()}

/* ---------- Remise en place des reprises déplacées pour une date passée ---------- */
function restore(){var t=dayIso(0),n=0;D.wxMoves.forEach(function(m){if(!m.restored&&m.date<t){var l=D.lessons.find(function(x){return x.id===m.lesson});if(l&&l.arena===m.to)l.arena=m.from;m.restored=true;n++}});return n}

/* ---------- Suggestions ---------- */
function hoursOf(iso,a,b){return (WX.data&&WX.data.hours||[]).filter(function(h){if(h.t.slice(0,10)!==iso)return false;var x=+h.t.slice(11,13)*60;return x+60>a&&x<b})}
function lessonsOn(iso){var dw=new Date(iso+'T12:00:00').getDay();return (D.lessons||[]).filter(function(l){return +l.dow===dw&&l.status!=='annulée'})}
function busy(iso,arenaId,a,b,except){return lessonsOn(iso).some(function(l){if(l.id===except)return false;var s=mm(l.start),e=s+(+l.dur||60);return l.arena===arenaId&&s<b&&e>a})}
function skipped(k){return D.wxSkips.some(function(s){return s.id===k})}
function moved(lid,iso){return D.wxMoves.some(function(m){return m.lesson===lid&&m.date===iso&&!m.restored})}
function suggestions(){var out=[];if(!WX.data)return out;
  [0,1].forEach(function(o){var iso=dayIso(o),nowM=o===0?now().getHours()*60+now().getMinutes():-1;
    lessonsOn(iso).forEach(function(l){var a=arena(l.arena);if(!a||covered(a)||moved(l.id,iso))return;var s=mm(l.start);if(s==null||s+(+l.dur||60)<=nowM)return;var e=s+(+l.dur||60);
      var hs=hoursOf(iso,s,e);if(!hs.length)return;
      var rain=Math.max.apply(null,hs.map(function(h){return h.prob>=50?h.rain:0})),gust=Math.max.apply(null,hs.map(function(h){return h.gust})),storm=hs.some(function(h){return h.code>=95}),cold=Math.min.apply(null,hs.map(function(h){return h.temp}));
      var why=storm?'orage annoncé':rain>=.4?'pluie '+String(Math.round(rain*10)/10).replace('.',',')+NB+'mm par heure':gust>=55?'rafales à '+Math.round(gust)+NB+'km/h':cold<=-2?'sol gelé ('+tf(cold)+NB+'°C)':'';if(!why)return;
      var key='move|'+l.id+'|'+iso;if(skipped(key))return;
      var to=(D.club.arenas||[]).filter(covered).find(function(c){return !busy(iso,c.id,s,e,l.id)});
      out.push({key:key,kind:'move',dom:'rd',icon:to?'swap':'alert',day:iso,
        title:to?'Passer la reprise de '+hm(s)+' au '+to.name.toLowerCase():'Reprise de '+hm(s)+' : aucun abri libre',
        text:cap1(dayLabel(iso))+', '+E(l.title)+' en '+E(a.name.toLowerCase())+' : '+why+'.'+(to?' Le '+E(to.name.toLowerCase())+' est libre de '+hm(s)+' à '+hm(e)+'.':' Le '+((D.club.arenas||[]).filter(covered)[0]||{name:'manège'}).name.toLowerCase()+' est déjà pris : vous pouvez maintenir, raccourcir ou annuler.'),
        ok:to?'Déplacer au '+to.name.toLowerCase():null,lesson:l.id,from:l.arena,to:to&&to.id})})});
  var night=(WX.data.hours||[]).filter(function(h){var x=+h.t.slice(11,13);return (h.t.slice(0,10)===dayIso(0)&&x>=18)||(h.t.slice(0,10)===dayIso(1)&&x<=8)});
  if(night.length){var mn=Math.min.apply(null,night.map(function(h){return h.temp}));
    if(mn<=0&&!skipped('cold|'+dayIso(0)))out.push({key:'cold|'+dayIso(0),kind:'task',dom:'hz',icon:'thermo',day:dayIso(0),title:'Gel cette nuit : '+tf(mn)+NB+'°C',
      text:'Couvrir les chevaux tondus restés dehors, vérifier les abreuvoirs et les robinets ce soir.',ok:'Ajouter la tâche de 18 h',task:{title:'Gel cette nuit ('+tf(mn)+NB+'°C) : couvertures et abreuvoirs',time:'18:00',zone:'Prés et écuries'}})}
  [0,1].forEach(function(o){var iso=dayIso(o),hs=(WX.data.hours||[]).filter(function(h){var x=+h.t.slice(11,13);return h.t.slice(0,10)===iso&&x>=8&&x<=19});if(!hs.length)return;
    var gs=hs.filter(function(h){return h.gust>=60||h.code>=95});var k='wind|'+iso;
    if(gs.length&&!skipped(k)){var first=+gs[0].t.slice(11,13),stormy=gs.some(function(h){return h.code>=95});
      out.push({key:k,kind:'task',dom:'hz',icon:stormy?'bolt':'wind',day:iso,title:(stormy?'Orage':'Rafales à '+Math.round(Math.max.apply(null,gs.map(function(h){return h.gust})))+NB+'km/h')+' '+dayLabel(iso)+' vers '+hm(first*60),
        text:'Rentrer les chevaux des prés avant '+hm(Math.max(8,first-1)*60)+' et attacher ce qui peut s’envoler (bâches, barres, obstacles légers).',ok:'Ajouter la tâche',task:{title:'Rentrer les chevaux avant '+hm(Math.max(8,first-1)*60)+(stormy?' (orage)':' (vent fort)'),time:p2(Math.max(8,first-1))+':00',zone:'Prés',date:iso}})}
    var hot=Math.max.apply(null,hs.map(function(h){return h.temp}));k='heat|'+iso;
    if(hot>=30&&!skipped(k))out.push({key:k,kind:'task',dom:'hz',icon:'sun',day:iso,title:'Chaleur '+dayLabel(iso)+' : '+Math.round(hot)+NB+'°C',text:'Arroser les carrières le matin, avancer les reprises de l’après-midi et prévoir de l’eau en plus aux prés.',ok:'Ajouter la tâche',task:{title:'Chaleur : arroser les carrières, eau en plus aux prés',time:'08:00',zone:'Carrières et prés',date:iso}})});
  var wet=(WX.data.days||[]).slice(0,3).reduce(function(s,d){return s+(+d.rain||0)},0),k2='mud|'+dayIso(0);
  if(wet>=20&&!skipped(k2))out.push({key:k2,kind:'task',dom:'hz',icon:'paddock',day:dayIso(0),title:String(Math.round(wet)).replace('.',',')+NB+'mm de pluie sur 3 jours',text:'Prés détrempés : pensez à mettre au repos les parcelles basses et à sortir les chevaux en paddock stabilisé.',ok:'Ajouter la tâche',task:{title:'Prés détrempés : choisir les parcelles à mettre au repos',time:'09:00',zone:'Prés'}});
  return out}
P.wxSuggestions=function(){return WX.data?suggestions():[]};

/* ---------- Actions (toujours confirmées par le gérant) ---------- */
function confirm(s){
  if(s.kind==='move'&&s.to){var l=D.lessons.find(function(x){return x.id===s.lesson});if(!l)return;var mv={id:uid('wxm'),lesson:l.id,date:s.day,from:s.from,to:s.to,reason:s.text.replace(/<[^>]+>/g,''),by:(D.me&&D.me.gerant)||'',at:new Date().toISOString()};
    l.arena=s.to;D.wxMoves.push(mv);P.rerender();
    P.toast('Reprise déplacée au '+arena(s.to).name.toLowerCase()+' pour '+dayLabel(s.day)+'. Le planning, le moniteur et les cavaliers voient le nouveau lieu ; elle revient en '+arena(s.from).name.toLowerCase()+' la semaine suivante.',{undo:function(){l.arena=s.from;D.wxMoves.splice(D.wxMoves.indexOf(mv),1);P.rerender()}});return}
  if(s.kind==='task'){var t={id:uid('t'),title:s.task.title,zone:s.task.zone||'',who:'',time:s.task.time||'',done:false,kind:'meteo',date:s.task.date||dayIso(0)};D.tasks=D.tasks||[];D.tasks.push(t);
    var sk={id:s.key,date:s.day,done:true};D.wxSkips.push(sk);P.rerender();
    P.toast('Tâche ajoutée à la journée de l’équipe',{undo:function(){D.tasks.splice(D.tasks.indexOf(t),1);D.wxSkips.splice(D.wxSkips.indexOf(sk),1);P.rerender()}})}}
function skip(s){var sk={id:s.key,date:s.day};D.wxSkips.push(sk);P.rerender();P.toast('Suggestion ignorée',{icon:'info',undo:function(){D.wxSkips.splice(D.wxSkips.indexOf(sk),1);P.rerender()}})}

/* ---------- Écran ---------- */
P.css(`
.wx-hero{display:flex;gap:18px;align-items:center;flex-wrap:wrap}
.wx-hero .wx-big{font-family:var(--f-display);font-weight:800;font-size:46px;line-height:1}
.wx-hero .i{width:44px;height:44px}
.wx-days{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:8px}
.wx-day{padding:12px 6px;border-radius:var(--r-md);background:var(--surface-2);text-align:center;display:flex;flex-direction:column;gap:4px;align-items:center}
.wx-day.hl{background:var(--rd-bg);color:var(--rd-ink)}
.wx-day b{font-size:16px}
.wx-hours{display:flex;gap:6px;overflow-x:auto;padding-bottom:6px}
.wx-h{flex:none;width:58px;padding:10px 4px;border-radius:var(--r-md);background:var(--surface-2);text-align:center;display:flex;flex-direction:column;gap:4px;align-items:center}
.wx-h.les{box-shadow:inset 0 0 0 2px var(--acc)}
.wx-h .wx-bar{width:8px;border-radius:4px;background:var(--acc);opacity:.8}
.wx-sg{display:flex;gap:14px;align-items:flex-start}
.wx-sg .grow p{margin-top:4px}
.wx-acts{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px}
@container main (max-width:760px){.wx-days{grid-template-columns:repeat(4,minmax(0,1fr))}.wx-hero .wx-big{font-size:38px}}
`);
function render(el){restore();
  if(!WX.data&&!WX.err){el.innerHTML='<div class="card pad"><p class="mut">Chargement des prévisions…</p></div>';ensure().then(function(){if(el.isConnected)render(el)});return}
  var d=WX.data,sg=suggestions(),t0=dayIso(0);
  var srcTxt=WX.src==='exemple'?'Prévisions d’exemple pour la démonstration.':'Prévisions Open-Meteo, mises à jour toutes les heures'+(WX.at?' (relevé à '+hm(WX.at.getHours()*60+WX.at.getMinutes())+')':'')+'.';
  var h=U.ph('Météo','Stabl lit les prévisions et vous propose quoi faire. Rien ne change sans votre accord.',
    DEMO?(WX.src==='exemple'?'<button class="btn" data-real>'+ICON('globe','sm')+'Voir la vraie météo</button>':'<button class="btn ghost" data-ex>'+ICON('refresh','sm')+'Revenir à l’exemple</button>'):'<button class="btn ghost" data-ref>'+ICON('refresh','sm')+'Actualiser</button>');
  if(WX.err&&!d){el.innerHTML=h+'<div class="card pad"><p>'+E(WX.err)+'</p></div>';bind(el,[]);return}
  var cur=(d.hours||[]).find(function(x){return x.t.slice(0,13)===t0+'T'+p2(now().getHours())})||d.hours[0]||{};
  h+='<div class="g2" style="gap:16px;margin-bottom:16px"><div class="card pad"><div class="wx-hero">'+ICON(wIcon(cur.code))+'<div><div class="wx-big num">'+Math.round(cur.temp)+'<small style="font-size:22px">'+NB+'°C</small></div><div class="mut">'+wText(cur.code)+(cur.gust?' · rafales '+Math.round(cur.gust)+NB+'km/h':'')+'</div></div></div>'+
    '<p class="xs mut" style="margin-top:12px">'+E(D.club.city||D.club.name||'')+' · '+srcTxt+'</p></div>'+
    '<div class="card pad tint d-rd"><div class="eyebrow">Suggestions</div><div class="big num" style="margin:6px 0">'+sg.length+'</div><p class="s">'+(sg.length?'À confirmer par vous : Stabl ne déplace aucune reprise tout seul.':'Rien à changer pour aujourd’hui et demain.')+'</p>'+
    (D.wxMoves.filter(function(m){return !m.restored}).length?'<p class="xs mut" style="margin-top:8px">'+D.wxMoves.filter(function(m){return !m.restored}).length+' reprise(s) déjà déplacée(s), remise(s) en place automatiquement la semaine suivante.</p>':'')+'</div></div>';
  h+='<div class="stack" style="--g:12px;margin-bottom:16px">'+sg.map(function(s,i){return '<div class="card pad wx-sg d-'+s.dom+'"><span class="ico">'+ICON(s.icon)+'</span><div class="grow"><b>'+s.title+'</b><p class="s mut">'+s.text+'</p><div class="wx-acts">'+
    (s.ok?'<button class="btn pri sm" data-ok="'+i+'">'+ICON('check','sm')+E(s.ok)+'</button>':'')+(s.kind==='move'?'<button class="btn sm" data-go="planning">'+ICON('planning','sm')+'Voir le planning</button>':'')+'<button class="btn ghost sm" data-skip="'+i+'">Ignorer</button></div></div></div>'}).join('')+'</div>';
  var les=lessonsOn(t0).map(function(l){return mm(l.start)});
  h+='<div class="card pad" style="margin-bottom:16px"><div class="hrow sp" style="margin-bottom:10px"><b>Heure par heure, aujourd’hui</b><span class="xs mut">Encadré : une reprise commence</span></div><div class="wx-hours">'+
    (d.hours||[]).filter(function(x){var hh=+x.t.slice(11,13);return x.t.slice(0,10)===t0&&hh>=7&&hh<=21}).map(function(x){var hh=+x.t.slice(11,13),isL=les.some(function(m){return m!=null&&Math.floor(m/60)===hh});
      return '<div class="wx-h'+(isL?' les':'')+'" title="'+wText(x.code)+'"><span class="xs mut">'+hh+NB+'h</span>'+ICON(wIcon(x.code),'sm')+'<b class="s num">'+Math.round(x.temp)+'°</b><span style="height:28px;display:flex;align-items:flex-end"><span class="wx-bar" style="height:'+Math.min(28,Math.round(x.rain*8))+'px"></span></span><span class="xs mut num">'+(x.prob||0)+NB+'%</span></div>'}).join('')+'</div></div>';
  h+='<div class="card pad"><b>Sept jours</b><div class="wx-days" style="margin-top:12px">'+(d.days||[]).map(function(x,i){var hl=(+x.rain>=5)||x.gust>=60||x.min<=0;var dd=new Date(x.d+'T12:00:00');
    return '<div class="wx-day'+(hl?' hl':'')+'"><span class="xs">'+(i?cap1(DAYS[dd.getDay()].slice(0,3)):'Auj.')+'</span>'+ICON(wIcon(x.code))+'<b class="num">'+tf(x.max)+'°</b><span class="xs mut num">'+tf(x.min)+'° · '+String(x.rain).replace('.',',')+NB+'mm</span></div>'}).join('')+'</div>'+
    '<p class="xs mut" style="margin-top:12px">Données météo : Open-Meteo, gratuites et sans compte. Les règles : pluie d’au moins 0,4'+NB+'mm par heure probable à 50'+NB+'% ou plus, rafales de 55'+NB+'km/h, orage ou sol gelé pendant une reprise en extérieur.</p></div>';
  el.innerHTML=h;bind(el,sg)}
function bind(el,sg){el.onclick=function(e){var b=e.target.closest('button');if(!b)return;
  if(b.hasAttribute('data-ok'))return confirm(sg[+b.getAttribute('data-ok')]);
  if(b.hasAttribute('data-skip'))return skip(sg[+b.getAttribute('data-skip')]);
  if(b.hasAttribute('data-real')){WX.data=null;WX.src='';b.disabled=true;fetchReal().then(function(ok){if(!ok){WX.src='exemple';WX.data=sample();P.toast(WX.err||'Prévisions indisponibles',{icon:'alert'})}P.rerender()});return}
  if(b.hasAttribute('data-ex')){WX.src='exemple';WX.data=sample();WX.err='';P.rerender();return}
  if(b.hasAttribute('data-ref')){try{localStorage.removeItem('stabl:wx2:'+(D.club.id||'demo'))}catch(x){}WX.data=null;fetchReal().then(function(){P.rerender()})}}}

P.mod({id:'meteo',role:'gerant',group:'Pilotage',title:'Météo',icon:'sun',n:30,phoneTitle:'Météo',short:'Météo',
  badge:function(){var n=WX.data?suggestions().length:0;return n?{v:n,hot:true}:null},render:render});
/* précharge les prévisions pour la pastille du menu et le tableau de bord */
setTimeout(function(){ensure().then(function(){restore();try{if(P.refreshNav)P.refreshNav()}catch(e){}})},DEMO?0:1500);
})();
