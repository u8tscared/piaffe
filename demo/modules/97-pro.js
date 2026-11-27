/* Lot 97 · Espace praticien : vétérinaire, maréchal-ferrant, dentiste, ostéopathe.
   Le praticien est invité par le club (rôle « provider » côté serveur). Il voit les chevaux, leur santé et le contact
   du propriétaire, jamais l'argent du club. Il voit sa tournée sur tous les clubs qui l'ont invité (/api/pro/tournee),
   accepte les demandes de visite, saisit ses actes (le propriétaire le voit dans le journal du cheval), fait ses
   factures à son nom et, s'il est vétérinaire, prépare le certificat d'engagement et de connaissance.
   Côté gérant : écran « Véto et maréchal » (praticiens) pour inviter un praticien et lui demander une visite.
   Données : practitioners, care, journal, horses, proActs (actes et factures du praticien), proRequests (demandes). */
(function(){
var D=P.D,F=P.fmt,U=P.ui,E=F.esc,$=P.$,NB=' ';
var DEMO=!D.me||D.me.gerant==='s01'||!!(window.PL&&PL.sandbox);
['proActs','proRequests','practitioners','care','journal'].forEach(function(k){if(!Array.isArray(D[k]))D[k]=[]});
function uid(p){return window.PL&&PL.uid?PL.uid(p):p+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function now(){return DEMO?new Date(D.today):new Date()}
function dayIso(o){var d=now();d.setHours(12,0,0,0);d.setDate(d.getDate()+(o||0));return D.iso(d)}
function today(){return dayIso(0)}
var COLORS=['var(--c1)','var(--c4)','var(--c3)','var(--c6)','var(--c2)','var(--c5)'];
var KI={'Vétérinaire':'care','Vaccin':'syringe','Maréchal':'hoof','Dentiste':'tooth','Ostéopathe':'bone','Vermifuge':'pill','Certificat':'doc'};
var FIELD={'Vaccin':'vacc','Maréchal':'farrier','Dentiste':'dentist','Ostéopathe':'osteo','Vermifuge':'worm'};

/* ---------- Identité : un praticien est aussi une « personne » (avatar, nom) ---------- */
/* vue « personne » d'une fiche praticien, sans modifier la fiche (elle est synchronisée telle quelle) */
function asPerson(p,i){if(!p||p.first)return p;var n=String(p.name||'').replace(/^Dr\.?\s+/,'').trim().split(/\s+/);
  return Object.assign({},p,{first:(/^Dr/.test(p.name||'')?'Dr ':'')+(n[0]||''),last:n.slice(1).join(' '),color:p.color||COLORS[(i||0)%COLORS.length],role:p.role||p.job})}
D.practitioner=function(i){return D.practitioners.find(function(p){return p.id===i})||null};
function pv(p){return asPerson(p,Math.max(0,D.practitioners.indexOf(p)))}
var p0=D.person;D.person=function(i){var r=p0(i);if(r)return r;var x=D.practitioner(i);return x?pv(x):undefined};
D.me.pro=D.me.pro||'p1';
P.roles.pro={label:'Véto · maréchal',icon:'care',who:DEMO?'p1':'me',home:'pro-jour',tabs:['pro-jour','pro-chevaux','pro-factures','pro-certif']};
P.groups.pro=['Ma tournée','Compte'];
P.domGroups['Ma tournée']='cr';

/* le praticien connecté : p1 en démo, la fiche liée à l'invitation dans le vrai logiciel */
function me(){var id=DEMO?'p1':(window.PL&&PL.personRef)||'';var p=D.practitioner(id);
  if(!p){var u=(window.PL&&PL.user)||{};p={id:id||'me',name:((u.first||'')+' '+(u.last||'')).trim()||u.email||'Praticien',short:u.first||'Moi',job:'Praticien',kinds:[],phone:''}}return p}
function isVet(p){return /v[ée]t[ée]rinaire/i.test(p.job||'')||(p.kinds||[]).indexOf('Vétérinaire')>=0}
function mine(c,p){p=p||me();if(c.pro)return c.pro===p.id;var w=String(c.who||'').toLowerCase();return !!w&&(w===String(p.short||'').toLowerCase()||w===String(p.name||'').toLowerCase())}
function profile(){var p=me();var d=P.prefs.get('pro:'+p.id,null);if(d)return d;
  return DEMO?{name:p.name,job:p.job,ordre:'21547',siret:'523 418 907 00034',address:'4 rue des Vignes, 78120 Rambouillet',phone:p.phone,email:'cabinet.leclerc@exemple.fr',tva:'20',iban:'FR76 3000 4000 0312 3456 7890 143'}:
    {name:p.name,job:p.job,ordre:'',siret:'',address:'',phone:p.phone||'',email:((window.PL&&PL.user)||{}).email||'',tva:'20',iban:''}}
function hName(id){var h=D.horse(id);return h?h.name:'Cheval'}
function owner(h){if(!h||!h.owner)return null;var m=D.member(h.owner)||D.person(h.owner);return m||null}

/* ---------- Données de démonstration ---------- */
var seeded=false;
function seed(){if(seeded||!DEMO)return;seeded=true;if(D.proActs.length||D.proRequests.length)return;
  D.proActs.push(
    {id:'pa1',pro:'p1',horse:'h12',kind:'Vétérinaire',date:dayIso(-6),note:'Abcès de pied antérieur droit, paré et pansé. Pansement à refaire dans 3 jours.',price:68},
    {id:'pa2',pro:'p1',horse:'h08',kind:'Vaccin',date:dayIso(-6),note:'Grippe et tétanos.',price:58},
    {id:'pa3',pro:'p1',horse:'h03',kind:'Vétérinaire',date:dayIso(-21),note:'Visite d’achat, examen clinique et flexions.',price:180,inv:'PRO-2026-041',invAt:dayIso(-20),paid:dayIso(-12)},
    {id:'pa4',pro:'p1',horse:'h05',kind:'Vaccin',date:dayIso(-21),note:'Rappel grippe.',price:58,inv:'PRO-2026-041',invAt:dayIso(-20),paid:dayIso(-12)});
  D.proRequests.push(
    {id:'pq1',pro:'p1',horse:'h16',motive:'Toux sèche depuis deux jours, pas de fièvre.',urgent:false,date:dayIso(2),status:'nouvelle',created:dayIso(0),by:'s01'},
    {id:'pq2',pro:'p1',horse:'h21',motive:'Coup de pied au pré, plaie au jarret gauche.',urgent:true,date:dayIso(0),status:'nouvelle',created:dayIso(0),by:'s05'})}

/* tournée : ce club depuis les soins, les autres clubs depuis /api/pro/tournee (démo : deux clubs fictifs) */
var OTHER=[
  {id:'x1',name:'Écurie des Grands Prés',address:'Route de Sonchamp, 78120 Rambouillet',visits:[[0,'16:30','Vaccin','Tango','Rappel grippe et tétanos'],[1,'08:30','Vétérinaire','Bambou','Contrôle de boiterie'],[3,'10:00','Vaccin','Nuage','Primo-vaccination, 2e injection']]},
  {id:'x2',name:'Poney-club de la Forêt',address:'Allée des Chênes, 78610 Le Perray-en-Yvelines',visits:[[1,'14:00','Vétérinaire','Caramel','Visite annuelle de 6 poneys'],[6,'09:00','Vétérinaire','Pistache','Échographie de gestation']]}];
var remote=null,remoteAt=0,remoteBusy=false;
function fetchTour(){if(DEMO||remoteBusy||!(window.PL&&PL.get))return;if(remote&&Date.now()-remoteAt<5*60e3)return;remoteBusy=true;
  PL.get('/api/pro/tournee?days=14').then(function(r){remote=r||{};remoteAt=Date.now();remoteBusy=false;if(P.state.route==='pro-jour')P.rerender()},function(){remoteBusy=false})}
function tour(){var p=me(),from=dayIso(-30),until=dayIso(14),L=[];
  D.care.forEach(function(c){if(!mine(c,p)||c.status==='fait'||c.status==='annulé')return;if(c.date>until)return;if(c.date<today()&&c.status!=='en retard')return;if(c.date<from)return;
    var h=D.horse(c.horse);L.push({here:true,care:c,id:c.id,date:c.date,time:c.time||'',kind:c.kind,note:c.note||'',status:c.status,club:D.club.name,address:D.club.address||D.club.city||'',horse:h?{id:h.id,name:h.name,box:h.box}:{name:'Cheval'}})});
  if(DEMO)OTHER.forEach(function(o){o.visits.forEach(function(v,i){L.push({here:false,id:o.id+'-'+i,date:dayIso(v[0]),time:v[1],kind:v[2],note:v[4],status:'planifié',club:o.name,address:o.address,horse:{name:v[3]}})})});
  else if(remote&&remote.visits){var cid=window.PL&&PL.clubId,cl={};(remote.clubs||[]).forEach(function(c){cl[c.id]=c});
    remote.visits.forEach(function(v){if(v.club===cid)return;L.push({here:false,id:v.club+'-'+v.id,date:v.date,time:v.time||'',kind:v.kind,note:v.note||'',status:v.status,club:v.club_name||(cl[v.club]||{}).name||'Autre club',clubId:v.club,address:(cl[v.club]||{}).address||'',horse:v.horse||{name:'Cheval'}})})}
  return L.sort(function(a,b){return (a.date+a.time).localeCompare(b.date+b.time)})}
function requests(){var p=me(),L=D.proRequests.filter(function(r){return r.pro===p.id&&r.status==='nouvelle'}).map(function(r){return {r:r,here:true,club:D.club.name}});
  if(!DEMO&&remote&&remote.requests){var cid=window.PL&&PL.clubId;remote.requests.forEach(function(r){if(r.club!==cid&&r.status==='nouvelle')L.push({r:r,here:false,club:r.club_name||'Autre club'})})}
  return L.sort(function(a,b){return (b.r.urgent?1:0)-(a.r.urgent?1:0)||String(a.r.date||'').localeCompare(b.r.date||'')})}
function mapsUrl(stops){var a=stops.filter(Boolean);if(!a.length)return '';var dest=a[a.length-1],wp=a.slice(0,-1);
  return 'https://www.google.com/maps/dir/?api=1&travelmode=driving&destination='+encodeURIComponent(dest)+(wp.length?'&waypoints='+encodeURIComponent(wp.join('|')):'')}

/* ---------- Saisir un acte ---------- */
function actSheet(h,c){var p=me(),kinds=(p.kinds&&p.kinds.length?p.kinds:['Vétérinaire']).slice();if(c&&kinds.indexOf(c.kind)<0)kinds.unshift(c.kind);
  var prices={'Vétérinaire':68,'Vaccin':58,'Maréchal':h&&h.pony?45:95,'Dentiste':70,'Ostéopathe':80,'Vermifuge':22};
  var k0=c?c.kind:kinds[0],o=owner(h);
  var sh=P.sheet({title:'Acte pour '+E(h?h.name:'le cheval'),icon:KI[k0]||'care',body:'<div class="stack" style="--g:12px">'+
    '<div class="g2" style="--g:12px"><label class="field"><span>Type</span><select class="in" data-f="kind">'+kinds.map(function(k){return '<option'+(k===k0?' selected':'')+'>'+E(k)+'</option>'}).join('')+'</select></label>'+
    '<label class="field"><span>Date</span><input class="in" type="date" data-f="date" value="'+(c&&c.date<=today()?c.date:today())+'"></label></div>'+
    '<label class="field"><span>Ce que vous avez fait</span><textarea class="in" data-f="note" rows="3" placeholder="Examen, traitement, ferrure…">'+E(c&&c.note||'')+'</textarea></label>'+
    '<label class="field"><span>Message pour '+(o?E(o.first)+' (propriétaire)':'le club')+' <span class="mut">visible dans le journal du cheval</span></span><textarea class="in" data-f="msg" rows="2" placeholder="Repos 3 jours au box, puis pas en main."></textarea></label>'+
    '<div class="g2" style="--g:12px"><label class="field"><span>Prix HT</span><input class="in" data-f="price" inputmode="decimal" value="'+(prices[k0]||'')+'"></label>'+
    '<label class="field"><span>Prochaine visite <span class="mut">facultatif</span></span><input class="in" type="date" data-f="next"></label></div></div>',
    foot:'<button class="btn ghost" data-x>Annuler</button><button class="btn pri" data-ok>'+ICON('check','sm')+'Enregistrer l’acte</button>'});
  $('[data-f="kind"]',sh).onchange=function(e){var v=prices[e.target.value];if(v!=null)$('[data-f="price"]',sh).value=v};
  $('[data-x]',sh).onclick=function(){sh.close()};
  $('[data-ok]',sh).onclick=function(){var v=function(k){return ($('[data-f="'+k+'"]',sh).value||'').trim()};
    var kind=v('kind'),date=v('date')||today(),note=v('note'),msg=v('msg'),price=parseFloat(v('price').replace(',','.'))||0,next=v('next');
    if(!note&&!msg){P.toast('Décrivez l’acte en quelques mots',{icon:'alert'});return}
    var undo=[],prevCare=c?JSON.parse(JSON.stringify(c)):null;
    if(c){c.status='fait';c.kind=kind;c.date=date;c.note=note||c.note;c.pro=p.id;c.who=c.who||p.short;undo.push(function(){Object.keys(c).forEach(function(x){delete c[x]});Object.assign(c,prevCare)})}
    else{var nc={id:uid('cr'),horse:h.id,kind:kind,who:p.short,pro:p.id,date:date,time:'',note:note,status:'fait'};D.care.unshift(nc);undo.push(function(){D.care.splice(D.care.indexOf(nc),1)})}
    var fk=FIELD[kind];if(fk&&h&&(!h[fk]||h[fk]<date)){var was=h[fk];h[fk]=date;undo.push(function(){h[fk]=was})}
    var j={id:uid('jr'),horse:h.id,who:p.id,role:p.job,when:date===today()?'Aujourd’hui':F.date(date),date:date,text:kind+' : '+(note||'')+(msg?(note?' ':'')+msg:''),kind:'soin'};D.journal.unshift(j);undo.push(function(){D.journal.splice(D.journal.indexOf(j),1)});
    var a={id:uid('pa'),pro:p.id,horse:h.id,kind:kind,date:date,note:note||msg,price:price,care:c?c.id:null};D.proActs.unshift(a);undo.push(function(){D.proActs.splice(D.proActs.indexOf(a),1)});
    if(next){var nx={id:uid('cr'),horse:h.id,kind:kind,who:p.short,pro:p.id,date:next,time:'',note:'Contrôle après '+kind.toLowerCase(),status:'planifié'};D.care.push(nx);undo.push(function(){D.care.splice(D.care.indexOf(nx),1)})}
    sh.close();P.rerender();P.toast('Acte enregistré pour '+E(h.name)+(o?', '+E(o.first)+' le voit dans le journal':''),{icon:'checkc',undo:function(){undo.reverse().forEach(function(f){f()});P.rerender()}})}}

/* ---------- Accepter une demande ---------- */
function acceptSheet(r){var h=D.horse(r.horse);
  var sh=P.sheet({title:'Accepter la demande',icon:'checkc',body:'<p class="s mut" style="margin-bottom:12px">'+E(hName(r.horse))+' · '+E(r.motive||'')+'</p><div class="g2" style="--g:12px">'+
    '<label class="field"><span>Date de passage</span><input class="in" type="date" data-f="date" value="'+E(r.date&&r.date>=today()?r.date:today())+'"></label>'+
    '<label class="field"><span>Heure</span><input class="in" type="time" data-f="time" value="'+(r.urgent?'17:00':'10:00')+'"></label></div>',
    foot:'<button class="btn ghost" data-x>Annuler</button><button class="btn pri" data-ok>'+ICON('check','sm')+'Confirmer le passage</button>'});
  $('[data-x]',sh).onclick=function(){sh.close()};
  $('[data-ok]',sh).onclick=function(){var p=me(),d=$('[data-f="date"]',sh).value||today(),t=$('[data-f="time"]',sh).value||'';
    var c={id:uid('cr'),horse:r.horse,kind:(p.kinds&&p.kinds[0]==='Maréchal')?'Maréchal':'Vétérinaire',who:p.short,pro:p.id,date:d,time:t,note:r.motive||'',status:'planifié'};
    if(isVet(p))c.kind='Vétérinaire';D.care.push(c);var prev=r.status;r.status='acceptée';r.care=c.id;r.answered=today();
    sh.close();P.rerender();P.toast('Passage confirmé le '+F.date(d)+(t?' à '+t.replace(':',' h '):'')+', le club est prévenu',{icon:'checkc',undo:function(){D.care.splice(D.care.indexOf(c),1);r.status=prev;delete r.care;P.rerender()}})}}

/* ---------- Écrans du praticien ---------- */
P.css(`
.pr-day{margin:18px 0 8px;display:flex;align-items:baseline;gap:10px}
.pr-day b{font:700 15px var(--f-display)}
.pr-row{display:flex;gap:14px;align-items:center;padding:13px 18px;border-top:1px solid var(--line)}
.pr-row:first-child{border-top:0}
.pr-row .grow{min-width:0}
.pr-tm{font:600 14px var(--f-mono,monospace);min-width:48px;color:var(--ink)}
.pr-acts{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.pr-other{opacity:.86}
.pr-kv{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
.pr-kv div{background:var(--bg-2);border-radius:12px;padding:10px 12px}
.pr-kv small{display:block;color:var(--ink-3);font-size:12px}
.pr-kv b{font-size:14px}
.pr-ck{width:18px;height:18px;accent-color:var(--acc)}
@container main (max-width:760px){.pr-row{flex-wrap:wrap}.pr-acts{width:100%;justify-content:flex-start}}
`);

function visitRow(v){var tag=v.status==='en retard'?U.chip('En retard','warn',true):'';
  return '<div class="pr-row'+(v.here?'':' pr-other')+'"><span class="pr-tm">'+E(v.time?v.time.replace(':',' h '):'·')+'</span><span class="ico">'+ICON(KI[v.kind]||'care')+'</span><div class="grow"><b>'+E(v.horse.name)+'</b>'+(v.horse.box?' <span class="mut s">box '+E(v.horse.box)+'</span>':'')+
    '<div class="s mut ellip">'+E(v.kind)+(v.note?' · '+E(v.note):'')+'</div><div class="xs mut" style="margin-top:3px">'+ICON('pin','sm')+' '+E(v.club)+'</div>'+(tag?'<div style="margin-top:6px">'+tag+'</div>':'')+'</div>'+
    '<div class="pr-acts">'+(v.here?'<button class="btn sm" data-horse="'+E(v.horse.id)+'">Fiche</button><button class="btn sm pri" data-act="'+E(v.id)+'">'+ICON('check','sm')+'Saisir l’acte</button>':'<span class="xs mut">Ouvrez ce club pour saisir l’acte</span>')+'</div></div>'}
function renderJour(el){seed();fetchTour();var L=tour(),R=requests(),clubs={};L.forEach(function(v){clubs[v.club]=1});
  var td=today(),todayL=L.filter(function(v){return v.date<=td}),stops=[];todayL.forEach(function(v){if(stops.indexOf(v.address)<0)stops.push(v.address)});
  var url=mapsUrl(stops);
  var h=U.ph('Ma tournée',L.length?L.length+' visite'+(L.length>1?'s':'')+' sur 14 jours · '+Object.keys(clubs).length+' club'+(Object.keys(clubs).length>1?'s':''):'Aucune visite prévue',
    url?'<a class="btn pri" target="_blank" rel="noopener" href="'+E(url)+'">'+ICON('route','sm')+'Itinéraire du jour</a>':'');
  if(R.length)h+='<div class="card" style="margin-bottom:16px"><div class="ch"><h3>Demandes de visite</h3>'+U.chip(R.length+' nouvelle'+(R.length>1?'s':''),'acc',true)+'</div>'+R.map(function(x){var r=x.r;
    return '<div class="pr-row"><span class="ico">'+ICON(r.urgent?'alert':'mail')+'</span><div class="grow"><b>'+E(x.here?hName(r.horse):(r.horse&&r.horse.name)||'Cheval')+'</b> <span class="mut s">'+E(x.club)+'</span><div class="s mut">'+E(r.motive||'')+'</div><div style="margin-top:6px">'+(r.urgent?U.chip('Urgent','warn',true)+' ':'')+(r.date?U.chip('Souhaité le '+F.date(r.date),'',true):'')+'</div></div>'+
      '<div class="pr-acts">'+(x.here?'<button class="btn ghost sm" data-no="'+E(r.id)+'">Refuser</button><button class="btn sm pri" data-ok="'+E(r.id)+'">'+ICON('check','sm')+'Accepter</button>':'<span class="xs mut">Ouvrez ce club pour répondre</span>')+'</div></div>'}).join('')+'</div>';
  if(!L.length)h+='<div class="card">'+U.empty('route','Aucune visite prévue','Quand un club vous programme un soin, il apparaît ici, avec l’adresse et le cheval.')+'</div>';
  var by={};L.forEach(function(v){(by[v.date]=by[v.date]||[]).push(v)});
  Object.keys(by).sort().forEach(function(d){var lbl=d<td?'En retard':d===td?'Aujourd’hui':d===dayIso(1)?'Demain':F.date(d);
    h+='<div class="pr-day"><b>'+lbl+'</b><span class="s mut">'+by[d].length+' visite'+(by[d].length>1?'s':'')+'</span></div><div class="card">'+by[d].map(visitRow).join('')+'</div>'});
  el.innerHTML=h;
  el.onclick=function(e){var b=e.target.closest('button');if(!b)return;
    var hid=b.getAttribute('data-horse');if(hid)return horseSheet(D.horse(hid));
    var aid=b.getAttribute('data-act');if(aid){var c=D.care.find(function(x){return x.id===aid});if(c)return actSheet(D.horse(c.horse),c)}
    var ok=b.getAttribute('data-ok'),no=b.getAttribute('data-no'),r=D.proRequests.find(function(x){return x.id===(ok||no)});
    if(r&&ok)return acceptSheet(r);
    if(r&&no){r.status='refusée';r.answered=today();P.rerender();P.toast('Demande refusée, le club est prévenu',{undo:function(){r.status='nouvelle';P.rerender()}})}}}

function horseSheet(h){if(!h)return;var o=owner(h),care=D.care.filter(function(c){return c.horse===h.id}).sort(function(a,b){return a.date<b.date?1:-1}).slice(0,8);
  var kv=[['Box',h.box||'·'],['Âge',h.age?h.age+' ans':'·'],['Race',h.breed||'·'],['Poids',h.weight?h.weight+NB+'kg':'·'],['État corporel',h.bcs?h.bcs+' sur 5':'·'],['Puce',h.chip||'·'],
    ['Vaccin',h.vacc?F.dateY(h.vacc):'·'],['Vermifuge',h.worm?F.dateY(h.worm):'·'],['Maréchal',h.farrier?F.dateY(h.farrier):'·'],['Dentiste',h.dentist?F.dateY(h.dentist):'·'],['Ostéopathe',h.osteo?F.dateY(h.osteo):'·']];
  var al=(h.alerts||[]).map(function(a){return typeof a==='string'?a:(a.text||a.label||'')}).filter(Boolean);
  var sh=P.sheet({title:E(h.name),icon:'horse',wide:true,body:'<div class="stack" style="--g:16px">'+
    (al.length?'<div>'+al.map(function(a){return U.chip(a,'warn',true)}).join(' ')+'</div>':'')+
    '<div class="pr-kv">'+kv.map(function(x){return '<div><small>'+x[0]+'</small><b>'+E(String(x[1]))+'</b></div>'}).join('')+'</div>'+
    (o?'<div class="card pad soft"><b>Propriétaire</b><div class="s" style="margin-top:4px">'+E(o.first+' '+o.last)+(o.phone?' · <a href="tel:'+E(String(o.phone).replace(/\s/g,''))+'">'+E(o.phone)+'</a>':'')+(o.email?' · <a href="mailto:'+E(o.email)+'">'+E(o.email)+'</a>':'')+'</div></div>':'<p class="s mut">Cheval du club : votre contact est le club.</p>')+
    '<div><b>Derniers soins</b>'+(care.length?care.map(function(c){return '<div class="pr-row" style="padding:10px 0"><span class="ico sm">'+ICON(KI[c.kind]||'care','sm')+'</span><div class="grow"><div class="s"><b>'+E(c.kind)+'</b> · '+E(c.note||'')+'</div><div class="xs mut">'+F.dateY(c.date)+(c.who?' · '+E(c.who):'')+' · '+E(c.status||'')+'</div></div></div>'}).join(''):'<p class="s mut">Aucun soin enregistré.</p>')+'</div></div>',
    foot:'<button class="btn ghost" data-x>Fermer</button><button class="btn pri" data-a>'+ICON('plus','sm')+'Ajouter un acte</button>'});
  $('[data-x]',sh).onclick=function(){sh.close()};
  $('[data-a]',sh).onclick=function(){sh.close();actSheet(h,null)}}

var Q='';
function renderChevaux(el){seed();var p=me(),soon={};D.care.forEach(function(c){if(mine(c,p)&&c.status!=='fait'&&c.status!=='annulé')soon[c.horse]=soon[c.horse]&&soon[c.horse]<c.date?soon[c.horse]:c.date});
  var L=(D.horses||[]).filter(function(h){return !Q||String(h.name).toLowerCase().indexOf(Q)>=0}).sort(function(a,b){var x=soon[a.id]||'9',y=soon[b.id]||'9';return x.localeCompare(y)||String(a.name).localeCompare(b.name)});
  var h=U.ph('Chevaux suivis',(D.horses||[]).length+' chevaux à '+E(D.club.name)+' · santé et contact du propriétaire, sans les données financières du club','');
  h+='<div style="margin-bottom:14px;max-width:420px"><input class="in" data-q placeholder="Chercher un cheval" value="'+E(Q)+'"></div><div class="card">'+(L.length?L.slice(0,80).map(function(x){var o=owner(x);
    return '<div class="pr-row" data-h="'+E(x.id)+'" style="cursor:pointer">'+U.hav(x)+'<div class="grow"><b>'+E(x.name)+'</b> <span class="mut s">'+(x.box?'box '+E(x.box):'')+'</span><div class="s mut ellip">'+E(x.breed||'')+(o?' · '+E(o.first+' '+o.last):'')+'</div></div>'+(soon[x.id]?U.chip('Visite '+F.date(soon[x.id]),'acc',true):'')+ICON('right','sm')+'</div>'}).join(''):U.empty('horse','Aucun cheval','Le club n’a pas encore saisi ses chevaux.'))+'</div>';
  el.innerHTML=h;var q=$('[data-q]',el);q.oninput=function(){Q=q.value.trim().toLowerCase();var pos=q.selectionStart;renderChevaux(el);var n=$('[data-q]',el);n.focus();try{n.setSelectionRange(pos,pos)}catch(e){}};
  el.onclick=function(e){var r=e.target.closest('[data-h]');if(r)horseSheet(D.horse(r.getAttribute('data-h')))}}

/* ---------- Factures du praticien ---------- */
function nextNo(){var y=now().getFullYear(),mx=0;D.proActs.forEach(function(a){var m=String(a.inv||'').match(/^PRO-(\d{4})-(\d+)$/);if(m&&+m[1]===y)mx=Math.max(mx,+m[2])});return 'PRO-'+y+'-'+String(mx+1).padStart(3,'0')}
function invPdf(no){var pf=profile(),A=D.proActs.filter(function(a){return a.inv===no});if(!A.length)return;var rate=pf.tva==='0'?0:20,ht=0;A.forEach(function(a){ht+=+a.price||0});var tva=ht*rate/100,e2=function(x){return F.eur(x,true)};
  var client=A[0].client||D.club.name;
  var bl=[{kv:[['Numéro',no],['Date',F.dateY(A[0].invAt||today())],['Client',client]]},
    {table:{cols:['Date','Cheval','Acte','HT'],w:[1.2,1.6,4,1.3],num:[3],rows:A.map(function(a){return [F.date(a.date),hName(a.horse)||a.person||'',a.kind+(a.note?' · '+a.note:''),e2(+a.price||0)]})}},
    {kv:[['Total HT',e2(ht)],[rate?'TVA à 20 %':'TVA',rate?e2(tva):'non applicable, art. 293 B du CGI'],['Total TTC',e2(ht+tva)]]},
    {p:pf.name+' · '+pf.job+(pf.ordre?' · Ordre des vétérinaires n° '+pf.ordre:'')+' · '+(pf.address||'')+(pf.siret?' · SIRET '+pf.siret:'')+'.'},
    {p:'Paiement à réception'+(pf.iban?' par virement, IBAN '+pf.iban:'')+'. Pas d’escompte pour paiement anticipé. Pénalités de retard : trois fois le taux d’intérêt légal, indemnité forfaitaire de recouvrement de 40 €.'}];
  return P.download(no+'.pdf',{title:'Facture '+no,sub:pf.name,org:pf.name,blocks:bl,foot:'Facture émise avec Stabl'},null,{msg:'Facture '+no+' téléchargée en PDF'})}
var SEL={};
function renderFactures(el){seed();var p=me(),A=D.proActs.filter(function(a){return a.pro===p.id});
  var todo=A.filter(function(a){return !a.inv&&(+a.price||0)>0}),inv={};A.forEach(function(a){if(a.inv){(inv[a.inv]=inv[a.inv]||{no:a.inv,at:a.invAt,paid:a.paid,acts:[],ht:0}).acts.push(a);inv[a.inv].ht+=+a.price||0}});
  var IL=Object.keys(inv).map(function(k){return inv[k]}).sort(function(a,b){return String(b.no).localeCompare(a.no)});
  var due=IL.filter(function(i){return !i.paid}).reduce(function(s,i){return s+i.ht},0),tt=todo.reduce(function(s,a){return s+(+a.price||0)},0);
  var nsel=todo.filter(function(a){return SEL[a.id]}).length;
  var h=U.ph('Mes factures',(todo.length?todo.length+' acte'+(todo.length>1?'s':'')+' à facturer ('+F.eur(tt)+' HT)':'Tout est facturé')+(due?' · '+F.eur(due)+' HT en attente de paiement':''),
    todo.length?'<button class="btn pri" data-mk'+(nsel?'':' disabled')+'>'+ICON('invoice','sm')+'Faire la facture'+(nsel?' ('+nsel+')':'')+'</button>':'');
  h+='<div class="card" style="margin-bottom:16px"><div class="ch"><h3>À facturer</h3>'+(todo.length?'<button class="btn ghost sm" data-all>Tout cocher</button>':'')+'</div>'+(todo.length?todo.map(function(a){
    return '<label class="pr-row" style="cursor:pointer"><input type="checkbox" class="pr-ck" data-s="'+E(a.id)+'"'+(SEL[a.id]?' checked':'')+'><div class="grow"><b>'+E(hName(a.horse)||a.person||'')+'</b> <span class="mut s">'+E(a.kind)+'</span><div class="s mut ellip">'+F.date(a.date)+(a.note?' · '+E(a.note):'')+'</div></div><b class="num">'+F.eur(+a.price||0)+'</b></label>'}).join(''):'<div class="cb"><p class="s mut">Les actes que vous saisissez arrivent ici, prêts à facturer.</p></div>')+'</div>';
  h+='<div class="card"><div class="ch"><h3>Factures</h3></div>'+(IL.length?IL.map(function(i){
    return '<div class="pr-row"><span class="ico">'+ICON('invoice')+'</span><div class="grow"><b>'+E(i.no)+'</b> <span class="mut s">'+i.acts.length+' acte'+(i.acts.length>1?'s':'')+'</span><div class="s mut">'+(i.at?'Émise le '+F.date(i.at):'')+' · '+E(i.acts[0].client||D.club.name)+'</div><div style="margin-top:6px">'+(i.paid?U.chip('Payée le '+F.date(i.paid),'ok',true):U.chip('En attente','warn',true))+'</div></div><b class="num">'+F.eur(i.ht)+' HT</b>'+
      '<div class="pr-acts"><button class="btn ghost sm" data-pdf="'+E(i.no)+'">'+ICON('download','sm')+'PDF</button>'+(i.paid?'':'<button class="btn sm" data-paid="'+E(i.no)+'">'+ICON('check','sm')+'Payée</button>')+'</div></div>'}).join(''):'<div class="cb"><p class="s mut">Aucune facture pour l’instant.</p></div>')+'</div>'+
    '<p class="xs mut" style="margin-top:12px">Vos factures sont à votre nom, avec votre numérotation, votre SIRET et votre numéro d’Ordre (réglages dans « Mon profil »).</p>';
  el.innerHTML=h;
  el.onchange=function(e){var s=e.target.getAttribute&&e.target.getAttribute('data-s');if(s){SEL[s]=e.target.checked;renderFactures(el)}};
  el.onclick=function(e){var b=e.target.closest('button');if(!b)return;
    if(b.hasAttribute('data-all')){todo.forEach(function(a){SEL[a.id]=true});return renderFactures(el)}
    if(b.hasAttribute('data-mk')){var pick=todo.filter(function(a){return SEL[a.id]});if(!pick.length)return;var no=nextNo(),d=today();
      pick.forEach(function(a){a.inv=no;a.invAt=d;a.client=D.club.name;delete SEL[a.id]});P.rerender();invPdf(no);
      P.toast('Facture '+no+' créée',{icon:'invoice',undo:function(){pick.forEach(function(a){delete a.inv;delete a.invAt;delete a.client});P.rerender()}});return}
    var pd=b.getAttribute('data-pdf');if(pd)return invPdf(pd);
    var pa=b.getAttribute('data-paid');if(pa){var L=A.filter(function(a){return a.inv===pa});L.forEach(function(a){a.paid=today()});P.rerender();P.toast('Facture '+pa+' marquée payée',{undo:function(){L.forEach(function(a){delete a.paid});P.rerender()}})}}}

/* ---------- Certificat d'engagement et de connaissance (vétérinaire) ---------- */
var MENTION='Ayant pris connaissance de l’ensemble de ces informations et m’étant renseigné(e) sur les besoins d’un équidé, je m’engage expressément à les respecter.';
function cecPdf(f){var pf=profile();
  var bl=[{p:'Article L. 211-10-1 du code rural et de la pêche maritime. Ce certificat est remis à toute personne qui va détenir un équidé sans être professionnelle de la filière. Il n’a pas de date de fin de validité.'},
    {kv:[['Personne qui s’engage',f.person],['Adresse',f.address||'·'],['Lieu de détention de l’équidé',f.place||'·'],['Espèce',f.species]]},
    {h:'1. Les besoins de l’équidé'},
    {p:'Besoins physiologiques : accès permanent à l’eau, alimentation riche en fourrage répartie sur la journée, abri contre les intempéries, sortie quotidienne et mouvement, soins des pieds environ toutes les 6 à 8 semaines, soins dentaires réguliers.'},
    {p:'Besoins comportementaux : l’équidé vit en groupe et a besoin de contacts avec ses congénères ; il a besoin de liberté de mouvement, d’une éducation et d’une manipulation bienveillantes, sans violence.'},
    {p:'Besoins médicaux : vaccination (grippe, tétanos), vermifugation raisonnée, surveillance de l’état corporel et des signes de douleur (coliques, boiterie), appel au vétérinaire en cas de doute. Pendant le transport : véhicule adapté, eau, pauses, protection contre le froid et la chaleur.'},
    {h:'2. Les obligations du détenteur'},
    {p:'Identification par puce électronique et document d’identification, enregistrement du détenteur et du lieu de détention auprès de l’IFCE (SIRE), déclaration du changement de propriétaire, tenue du registre d’élevage le cas échéant, règles de transport des animaux vivants, statut de l’équidé vis-à-vis de l’abattage pour la consommation.'},
    {h:'3. Ce que cela implique'},
    {p:'Coût d’un équidé : pension ou entretien du pré et de l’abri, foin et aliments, maréchal-ferrant, vétérinaire, dentiste, assurance, matériel. Comptez plusieurs milliers d’euros par an, pendant toute la vie de l’animal (25 à 30 ans en moyenne). Temps : soins quotidiens, y compris pendant les vacances.'},
    {h:'Délivré par'},
    {kv:[['Vétérinaire',pf.name],['N° d’inscription à l’Ordre',pf.ordre||'·'],['Adresse',pf.address||'·'],['Date',F.dateY(f.date)]]},
    {h:'Mention à recopier à la main par la personne qui s’engage'},
    {p:'« '+MENTION+' »'},
    {p:'..............................................................................................................................................'},
    {p:'..............................................................................................................................................'},
    {p:'Fait à .............................................., le ..................................          Signature :'},
    {p:'La personne qui cède ou confie l’équidé garde une copie de ce certificat signé.'}];
  return P.download('certificat-engagement-'+String(f.person||'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'')+'.pdf',{title:'Certificat d’engagement et de connaissance',sub:'Détention d’un '+f.species.toLowerCase(),org:pf.name,blocks:bl,foot:'Certificat préparé avec Stabl'},null,{msg:'Certificat téléchargé en PDF, à imprimer et faire signer'})}
function renderCertif(el){seed();var p=me(),pf=profile();
  if(!isVet(p)){el.innerHTML=U.ph('Certificat d’engagement','Réservé aux vétérinaires','')+'<div class="card">'+U.empty('doc','Réservé aux vétérinaires','La loi réserve la délivrance du certificat d’engagement et de connaissance aux vétérinaires et aux organismes agréés.')+'</div>';return}
  var open=(D.cecs||[]).filter(function(c){return c.status==='à demander'||c.status==='demandé'});
  var done=D.proActs.filter(function(a){return a.pro===p.id&&a.kind==='Certificat'}).slice(0,10);
  var h=U.ph('Certificat d’engagement','Préparez le certificat d’une personne qui va détenir un équidé, puis faites-le signer','');
  h+='<div class="g2" style="gap:16px;align-items:start"><div class="card pad"><div class="stack" style="--g:12px">'+
    (open.length?'<label class="field"><span>Dossier du club <span class="mut">facultatif</span></span><select class="in" data-f="cec"><option value="">Aucun</option>'+open.map(function(c){return '<option value="'+E(c.id)+'">'+E(c.person)+' · '+E(hName(c.horse))+'</option>'}).join('')+'</select></label>':'')+
    '<label class="field"><span>Personne qui va détenir l’équidé</span><input class="in" data-f="person" placeholder="Prénom et nom"></label>'+
    '<label class="field"><span>Son adresse</span><input class="in" data-f="address"></label>'+
    '<label class="field"><span>Lieu où l’équidé sera détenu</span><input class="in" data-f="place" placeholder="Pré, pension, écurie…"></label>'+
    '<div class="g2" style="--g:12px"><label class="field"><span>Espèce</span><select class="in" data-f="species"><option>Cheval</option><option>Poney</option><option>Âne</option></select></label>'+
    '<label class="field"><span>Date</span><input class="in" type="date" data-f="date" value="'+today()+'"></label></div>'+
    (pf.ordre?'':'<p class="s" style="color:var(--warn)">Ajoutez votre numéro d’Ordre dans « Mon profil » : il doit figurer sur le certificat.</p>')+
    '<div><button class="btn pri" data-gen>'+ICON('download','sm')+'Préparer le certificat (PDF)</button></div></div></div>'+
    '<div class="stack" style="--g:16px"><div class="card pad soft"><b>Ce que contient le certificat</b><ul class="ce-rules s"><li>Les besoins physiologiques, comportementaux et médicaux, y compris pendant le transport.</li><li>Les obligations d’identification, de traçabilité et de transport.</li><li>Ce que l’équidé coûte et le temps qu’il demande.</li><li>La phrase à recopier à la main et la signature.</li></ul><p class="xs mut" style="margin-top:10px">Code rural, L. 211-10-1 et D. 214-37-1 ; instruction DGAL/SDSBEA/2023-284. Pas de date de fin de validité.</p></div>'+
    (done.length?'<div class="card"><div class="ch"><h3>Derniers certificats</h3></div>'+done.map(function(a){return '<div class="pr-row"><span class="ico">'+ICON('doc')+'</span><div class="grow"><b>'+E(a.person||'')+'</b><div class="s mut">'+F.date(a.date)+(a.horse?' · '+E(hName(a.horse)):'')+'</div></div></div>'}).join('')+'</div>':'')+'</div></div>';
  el.innerHTML=h;
  var cs=$('[data-f="cec"]',el);if(cs)cs.onchange=function(){var c=D.cecs.find(function(x){return x.id===cs.value});if(c){$('[data-f="person"]',el).value=c.person||''}};
  $('[data-gen]',el).onclick=function(){var v=function(k){var x=$('[data-f="'+k+'"]',el);return x?(x.value||'').trim():''};
    if(!v('person')){P.toast('Indiquez le nom de la personne',{icon:'alert'});return}
    var f={person:v('person'),address:v('address'),place:v('place'),species:v('species')||'Cheval',date:v('date')||today()};cecPdf(f);
    var c=cs&&cs.value?D.cecs.find(function(x){return x.id===cs.value}):null;
    D.proActs.unshift({id:uid('pa'),pro:p.id,kind:'Certificat',person:f.person,horse:c?c.horse:null,date:f.date,note:'Certificat d’engagement et de connaissance',price:0});
    if(c){var prev=JSON.parse(JSON.stringify(c));c.status='reçu';c.issuer='Vétérinaire';c.issuerName=pf.name;c.ordre=pf.ordre;c.issued=f.date;c.received=today();
      P.toast('Dossier de '+E(c.person)+' complété au club',{icon:'checkc',undo:function(){Object.keys(c).forEach(function(k){delete c[k]});Object.assign(c,prev);P.rerender()}})}
    P.rerender()}}

function renderProfil(el){var pf=profile(),p=me();
  var F2=[['name','Nom affiché sur vos factures'],['job','Métier'],['ordre','N° d’inscription à l’Ordre (vétérinaires)'],['siret','SIRET'],['address','Adresse professionnelle'],['phone','Téléphone'],['email','E-mail'],['iban','IBAN pour les virements']];
  el.innerHTML=U.ph('Mon profil','Ces informations figurent sur vos factures et vos certificats','')+'<div class="card pad" style="max-width:640px"><div class="stack" style="--g:12px">'+
    F2.map(function(x){return '<label class="field"><span>'+x[1]+'</span><input class="in" data-f="'+x[0]+'" value="'+E(pf[x[0]]||'')+'"></label>'}).join('')+
    '<label class="field"><span>TVA</span><select class="in" data-f="tva"><option value="20"'+(pf.tva!=='0'?' selected':'')+'>TVA à 20 %</option><option value="0"'+(pf.tva==='0'?' selected':'')+'>Franchise en base (pas de TVA)</option></select></label>'+
    '<div><button class="btn pri" data-sv>'+ICON('check','sm')+'Enregistrer</button></div></div></div>';
  $('[data-sv]',el).onclick=function(){var o={};el.querySelectorAll('[data-f]').forEach(function(i){o[i.getAttribute('data-f')]=(i.value||'').trim()});P.prefs.set('pro:'+p.id,o);P.toast('Profil enregistré',{icon:'checkc'})}}

P.mod({id:'pro-jour',role:'pro',group:'Ma tournée',title:'Ma tournée',short:'Tournée',icon:'route',n:10,render:renderJour,
  badge:function(){seed();var n=requests().length;return n?{v:n,hot:true}:null}});
P.mod({id:'pro-chevaux',role:'pro',group:'Ma tournée',title:'Chevaux suivis',short:'Chevaux',icon:'horse',n:20,render:renderChevaux});
P.mod({id:'pro-factures',role:'pro',group:'Compte',title:'Mes factures',short:'Factures',icon:'invoice',n:10,render:renderFactures});
P.mod({id:'pro-certif',role:'pro',group:'Ma tournée',title:'Certificat d’engagement',short:'Certificat',phoneTitle:'Certificat',icon:'doc',n:30,render:renderCertif});
P.mod({id:'pro-profil',role:'pro',group:'Compte',title:'Mon profil',short:'Profil',icon:'user',n:20,render:renderProfil});

/* ---------- Côté gérant : inviter un praticien, lui demander une visite ---------- */
function inviteSheet(p){var sh=P.sheet({title:'Inviter '+E(p.name),icon:'mail',body:'<p class="s mut" style="margin-bottom:12px">'+E(pv(p).first)+' aura son espace : la tournée sur tous ses clubs, la santé de vos chevaux et le contact des propriétaires. Il ne voit ni vos factures, ni vos tarifs, ni vos adhérents sans cheval.</p>'+
    '<label class="field"><span>Son e-mail</span><input class="in" type="email" data-f="email" value="'+E(p.email||'')+'" placeholder="cabinet@exemple.fr" inputmode="email"></label>',
    foot:'<button class="btn ghost" data-x>Annuler</button><button class="btn pri" data-ok>'+ICON('mail','sm')+'Envoyer l’invitation</button>'});
  $('[data-x]',sh).onclick=function(){sh.close()};
  $('[data-ok]',sh).onclick=function(){var em=($('[data-f="email"]',sh).value||'').trim();if(!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(em)){P.toast('Adresse e-mail invalide',{icon:'alert'});return}
    var done=function(){p.email=em;p.invited=today();sh.close();P.rerender();P.toast('Invitation envoyée à '+E(em),{icon:'mail'})};
    if(DEMO||!(window.PL&&PL.post))return done();
    var b=$('[data-ok]',sh);b.disabled=true;PL.post('/api/invitations',{email:em,role:'provider',person_ref:p.id}).then(done,function(e){b.disabled=false;P.toast((e&&e.message)||'L’invitation n’est pas partie',{icon:'alert'})})}}
function askVisit(p){var hs=(D.horses||[]).slice().sort(function(a,b){return String(a.name).localeCompare(b.name)});
  var sh=P.sheet({title:'Demander une visite',icon:KI[(p.kinds||[])[0]]||'care',body:'<div class="stack" style="--g:12px"><p class="s mut">'+E(p.name)+' reçoit la demande dans son espace et confirme le jour de passage.</p>'+
    '<label class="field"><span>Cheval</span><select class="in" data-f="horse">'+hs.map(function(h){return '<option value="'+E(h.id)+'">'+E(h.name)+'</option>'}).join('')+'</select></label>'+
    '<label class="field"><span>Motif</span><textarea class="in" data-f="motive" rows="2" placeholder="Boiterie, toux, ferrure à refaire…"></textarea></label>'+
    '<div class="g2" style="--g:12px"><label class="field"><span>Souhaité le</span><input class="in" type="date" data-f="date" value="'+dayIso(1)+'"></label>'+
    '<label class="field" style="align-self:end"><span><input type="checkbox" data-f="urgent" class="pr-ck"> Urgent</span></label></div></div>',
    foot:'<button class="btn ghost" data-x>Annuler</button><button class="btn pri" data-ok>'+ICON('send','sm')+'Envoyer la demande</button>'});
  $('[data-x]',sh).onclick=function(){sh.close()};
  $('[data-ok]',sh).onclick=function(){var mo=($('[data-f="motive"]',sh).value||'').trim();if(!mo){P.toast('Indiquez le motif',{icon:'alert'});return}
    var r={id:uid('pq'),pro:p.id,horse:$('[data-f="horse"]',sh).value,motive:mo,urgent:$('[data-f="urgent"]',sh).checked,date:$('[data-f="date"]',sh).value||'',status:'nouvelle',created:today(),by:(D.me&&D.me.gerant)||''};
    D.proRequests.unshift(r);sh.close();P.rerender();P.toast('Demande envoyée à '+E(p.name),{icon:'send',undo:function(){D.proRequests.splice(D.proRequests.indexOf(r),1);P.rerender()}})}}
var RST={'nouvelle':['Envoyée','acc'],'acceptée':['Acceptée','ok'],'refusée':['Refusée','warn']};
function renderPraticiens(el){seed();var Pr=D.practitioners;
  var acts=D.proActs.filter(function(a){return a.horse&&a.kind!=='Certificat'}).sort(function(a,b){return a.date<b.date?1:-1}).slice(0,8);
  var reqs=D.proRequests.slice().sort(function(a,b){return String(b.created).localeCompare(a.created)}).slice(0,8);
  var h=U.ph('Véto et maréchal','Invitez vos praticiens : ils voient leur tournée, saisissent leurs actes et répondent à vos demandes','<button class="btn" data-go="soins">'+ICON('care','sm')+'Soins</button>');
  h+='<div class="card" style="margin-bottom:16px">'+(Pr.length?Pr.map(function(p){var on=DEMO?p.id==='p1':!!p.invited;
    return '<div class="pr-row">'+U.av(pv(p))+'<div class="grow"><b>'+E(p.name)+'</b><div class="s mut ellip">'+E(p.job||'')+(p.days?' · '+E(String(p.days).toLowerCase()):'')+'</div><div style="margin-top:6px">'+(on?U.chip(DEMO?'A son espace Stabl':'Invité le '+F.date(p.invited),'ok',true):U.chip('Pas encore invité','',true))+'</div></div>'+
      '<div class="pr-acts">'+(p.phone?'<a class="btn ghost icon sm" href="tel:'+E(String(p.phone).replace(/\s/g,''))+'" title="Appeler">'+ICON('phone','sm')+'</a>':'')+(on?'':'<button class="btn sm" data-inv="'+E(p.id)+'">'+ICON('mail','sm')+'Inviter</button>')+'<button class="btn sm pri" data-ask="'+E(p.id)+'">'+ICON('plus','sm')+'Demander une visite</button></div></div>'}).join(''):U.empty('care','Aucun praticien','Ajoutez votre vétérinaire et votre maréchal depuis l’écran Soins.'))+'</div>';
  h+='<div class="g2" style="gap:16px;align-items:start"><div class="card"><div class="ch"><h3>Demandes de visite</h3></div>'+(reqs.length?reqs.map(function(r){var p=D.practitioner(r.pro)||{name:''},st=RST[r.status]||[r.status,''];
      return '<div class="pr-row"><span class="ico">'+ICON(r.urgent?'alert':'mail')+'</span><div class="grow"><b>'+E(hName(r.horse))+'</b> <span class="mut s">'+E(p.name)+'</span><div class="s mut ellip">'+E(r.motive||'')+'</div></div>'+U.chip(st[0],st[1],true)+'</div>'}).join(''):'<div class="cb"><p class="s mut">Aucune demande en cours.</p></div>')+'</div>'+
    '<div class="card"><div class="ch"><h3>Derniers actes saisis</h3></div>'+(acts.length?acts.map(function(a){var p=D.practitioner(a.pro)||{name:''};
      return '<div class="pr-row"><span class="ico">'+ICON(KI[a.kind]||'care')+'</span><div class="grow"><b>'+E(hName(a.horse))+'</b> <span class="mut s">'+E(a.kind)+'</span><div class="s mut ellip">'+F.date(a.date)+' · '+E(p.name)+(a.note?' · '+E(a.note):'')+'</div></div></div>'}).join(''):'<div class="cb"><p class="s mut">Les actes saisis par vos praticiens apparaîtront ici.</p></div>')+'</div></div>';
  el.innerHTML=h;
  el.onclick=function(e){var b=e.target.closest('button');if(!b)return;var i=b.getAttribute('data-inv')||b.getAttribute('data-ask'),p=i&&D.practitioner(i);if(!p)return;
    if(b.hasAttribute('data-inv'))return inviteSheet(p);return askVisit(p)}}
P.mod({id:'praticiens',role:'gerant',group:'Écurie',title:'Véto et maréchal',short:'Praticiens',icon:'care',n:84,render:renderPraticiens,
  badge:function(){seed();var n=D.proRequests.filter(function(r){return r.status==='acceptée'&&r.answered===today()}).length;return n?{v:n}:null}});
})();
