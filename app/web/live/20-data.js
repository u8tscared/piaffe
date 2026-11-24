/* =====================================================================
   PIAFFE LIVE · Données réelles du club dans window.DATA
   - fabriques d'objets complets (un cheval, un adhérent… avec des valeurs sûres)
   - application du bootstrap (remplacement EN PLACE : les modules gardent leurs références)
   - collections dérivées honnêtes (mois, chiffre d'affaires, notifications, météo réelle)
   - nettoyage des jeux fictifs ajoutés par les modules
   ===================================================================== */
(function(){
var P=window.P,D=window.DATA,PL=window.PL;
var COLORS=['var(--c1)','var(--c2)','var(--c3)','var(--c4)','var(--c5)','var(--c6)','var(--c7)'];
function hash(s){var h=7;s=String(s||'');for(var i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))%99991;return h}
PL.colorOf=function(id){return COLORS[hash(id)%COLORS.length]};
var DAYS=['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
function fill(o,def){for(var k in def)if(o[k]===undefined||o[k]===null&&def[k]!==null)o[k]=def[k];return o}

/* ---------- Date du jour réelle (la démo est figée au 17 novembre 2026) ---------- */
PL.setToday=function(){var now=new Date();D.today=now;
  D.day=function(o){var d=new Date(D.today);d.setHours(0,0,0,0);d.setDate(d.getDate()+(o||0));return d}};

/* ---------- Fabriques : objets au format exact de la démo ---------- */
PL.make={
  horse:function(o){o=o||{};var id=o.id||PL.uid('h');var pony=o.pony!=null?o.pony:/Poney|Connemara|Welsh|Shetland|Haflinger/i.test(o.breed||'');
    return fill(o,{id:id,name:'Sans nom',breed:'',pony:pony,sex:'Hongre',age:null,born:null,coat:'',height:pony?140:165,kind:'club',box:'',sire:'',chip:'',level:'',
      work:0,workMax:pony?12:16,weight:pony?380:550,bcs:3,mood:'',ration:{hay:pony?6:10,grain:pony?.5:1.5,supp:'Aucun'},paddock:'',costMonth:0,
      vacc:null,worm:null,farrier:null,dentist:null,osteo:null,status:'ok',alerts:[],color:PL.colorOf(id)})},
  member:function(o){o=o||{};var id=o.id||PL.uid('m');var age=o.age!=null&&o.age!==''?+o.age:null;
    return fill(o,{id:id,first:'',last:'',age:age,minor:age!=null&&age<18,galop:0,fam:'F'+id,forfait:'',licence:'',lic:'',balance:0,since:new Date().getFullYear(),
      phone:'',cert:false,photo:false,color:PL.colorOf(id),email:''})},
  staff:function(o){o=o||{};var id=o.id||PL.uid('s');return fill(o,{id:id,first:'',last:'',role:'',dip:'',contract:'',hours:35,color:PL.colorOf(id)})},
  coach:function(o){o=o||{};var id=o.id||PL.uid('c');return fill(o,{id:id,first:'',last:'',spec:'',level:'',rate:0,rating:0,reviews:0,ext:true,bio:'',slots:[],color:PL.colorOf(id)})},
  lesson:function(o){o=o||{};var id=o.id||PL.uid('l');var dow=o.dow!=null?+o.dow:new Date().getDay();
    return fill(o,{id:id,dow:dow,day:DAYS[dow],start:'18:00',dur:60,title:'Reprise',coach:'',arena:(D.club.arenas[0]||{}).id||'',cap:8,riders:[],horses:{},wait:0,status:'prévue'})},
  care:function(o){o=o||{};return fill(o,{id:o.id||PL.uid('soin'),horse:'',kind:'Vétérinaire',who:'',date:PL.isoDay(),time:'09:00',note:'',status:'planifié'})},
  task:function(o){o=o||{};return fill(o,{id:o.id||PL.uid('t'),title:'',zone:'',who:'',time:'',done:false,kind:'routine'})},
  stock:function(o){o=o||{};return fill(o,{id:o.id||PL.uid('k'),name:'',unit:'',qty:0,min:0,daily:0,supplier:'',price:0})},
  competition:function(o){o=o||{};return fill(o,{id:o.id||PL.uid('k'),name:'',place:'',km:0,date:PL.isoDay(),disc:'CSO',level:'',entries:0,closes:PL.isoDay(),vans:0,status:'Engagements ouverts'})},
  contract:function(o){o=o||{};return fill(o,{id:o.id||PL.uid('ct'),title:'',party:'',status:'brouillon',date:PL.isoDay()})},
  forfait:function(o){o=o||{};return fill(o,{id:o.id||PL.uid('f'),name:'',price:0,kind:'annuel'})}
};
var NORM={horses:'horse',members:'member',staff:'staff',coaches:'coach',lessons:'lesson',care:'care',tasks:'task',stock:'stock',competitions:'competition',contracts:'contract',forfaits:'forfait'};
PL.normalize=function(coll,o){var f=NORM[coll];if(f&&o&&typeof o==='object')PL.make[f](o);
  if(coll==='horses'&&o){if(!o.ration||typeof o.ration!=='object')o.ration={hay:10,grain:1,supp:'Aucun'};if(!Array.isArray(o.alerts))o.alerts=[]}
  if(coll==='lessons'&&o){if(!Array.isArray(o.riders))o.riders=[];if(!o.horses||typeof o.horses!=='object')o.horses={};o.day=DAYS[o.dow]||o.day}
  return o};

/* ---------- Le club ---------- */
PL.defaultClub=function(){return {name:'Mon club',short:'Mon club',city:'',address:'',siret:'',ffe:'',boxes:0,phone:'',email:'',arenas:[],paddocks:[]}};
PL.applyClub=function(server,ui){var c=D.club;Object.keys(c).forEach(function(k){delete c[k]});Object.assign(c,PL.defaultClub());
  if(server){c.name=server.name||c.name;c.id=server.id;if(server.siret)c.siret=server.siret;if(server.email)c.email=server.email;if(server.phone)c.phone=server.phone;if(server.ffe_number)c.ffe=server.ffe_number;
    var a=server.address;if(typeof a==='string'){try{a=JSON.parse(a)}catch(e){a={line1:a}}}if(a&&typeof a==='object'){c.address=[a.line1,a.line2,[a.zip,a.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');c.city=a.city||c.city}
    if(server.plan)c.plan=server.plan;if(server.plan_status)c.plan_status=server.plan_status;if(server.trial_ends_at)c.trial_ends_at=server.trial_ends_at;if(server.kind)c.kind=server.kind}
  if(ui&&typeof ui==='object')Object.keys(ui).forEach(function(k){if(k!=='id'&&ui[k]!=null&&ui[k]!=='')c[k]=ui[k]});
  if(server&&server.name)c.name=server.name;
  if(!c.short)c.short=c.name;if(c.short==='Mon club'&&c.name!=='Mon club')c.short=c.name;
  if(!Array.isArray(c.arenas))c.arenas=[];if(!Array.isArray(c.paddocks))c.paddocks=[];
  c.arenas.forEach(function(a,i){if(!a.id)a.id='a'+(i+1)});
  /* les écrans de la démo supposent au moins une piste : on en garde une générique, honnête, tant que rien n'est saisi */
  if(!c.arenas.length)c.arenas.push({id:'a1',name:'Carrière',kind:'Extérieure',size:'',auto:true});
  if(!c.paddocks.length)c.paddocks.push('Paddock');
  c.boxes=+c.boxes||0;return c};

/* ---------- Collections : ce qui est synchronisé, dérivé, ou de référence ---------- */
/* dérivées ou issues d'une autre API : jamais envoyées dans records */
PL.NOSYNC=['today','me','club','invoices','bank','months','revenue','costs','occupancy','weather','notifs','facts','cameras','sensors','camEvents',
  'mcpTools','pfTut','pfRights','planHolidays','planVacations','connectors','mcpCalls','mcpClients','aiLog','webhookLog','apiKeys','adhInvoices','creditNotes','rapN1','rapAct','rapFill','rapCohorts','rapLeave'];
/* jeux de référence ajoutés par les modules et conservés (catalogues, jours fériés, modèles) */
PL.KEEP=['planHolidays','planVacations','mcpTools','pfRights','pfTut','comTpl','templates','alertRules','coachRules','pensionExtras','planInit','_lotB','horseWhere','connectors','pfAge'];
PL.isColl=function(k){var v=D[k];return k&&typeof v!=='function'&&v!==null&&typeof v==='object'&&!(v instanceof Date)};

/* vide une valeur EN PLACE (les modules ont pu en garder la référence) */
function wipe(v){if(Array.isArray(v))v.length=0;else if(v&&typeof v==='object')Object.keys(v).forEach(function(k){delete v[k]})}
PL.wipe=wipe;
/* remplace le contenu d'une collection EN PLACE */
PL.setColl=function(k,val){var cur=D[k];
  if(Array.isArray(val)){if(!Array.isArray(cur)){D[k]=cur=[]}else cur.length=0;val.forEach(function(o){cur.push(PL.normalize(k,o))});return cur}
  if(val&&typeof val==='object'){if(!cur||typeof cur!=='object'||Array.isArray(cur)){D[k]=cur={}}else wipe(cur);Object.assign(cur,val);return cur}
  D[k]=val;return val};

/* ---------- Valeurs sûres avant les modules ---------- */
/* collections que les modules créent avec des données fictives (« D.x = D.x || [...] » ou « if(!D.x) »),
   relevées par la sonde ?probe=demo. Posées vides AVANT les modules : leurs jeux d'exemple ne s'exécutent pas. */
PL.MODKEYS={A:'planExtras planStages planCatch rapAct rapN1 rapSched rapCohorts rapLeave comThreads comCamps comPins comPolls practitioners tours pharmacy register journalMore boxGuests boxRequests camEvents recurring creditNotes schedules cards cheques receipts nights leaves reviews quotes coachBookings coachReviews entriesMore coachStables coachStudents coachLessons coachLapsed adhFamily adhNews adhStages adhInvoices adhReviews adhOffers adhResults empTasks empHugo empPresence empConsignes empCare empRegister empShifts empNights empThreads empLeaves empDocs empIncidents aiAutomations aiLog mcpClients mcpCalls apiKeys webhooks webhookLog importLots pfTarifs'.split(' '),
  O:'rapFill breeding bankSuggest hr shifts coachDeals homeShow empNotes'.split(' ')};
PL.preseed=function(data){data=data||{};
  PL.MODKEYS.A.forEach(function(k){D[k]=Array.isArray(data[k])?data[k].slice():[]});
  PL.MODKEYS.O.forEach(function(k){D[k]=data[k]&&typeof data[k]==='object'&&!Array.isArray(data[k])?data[k]:{}});
  D._lotB=true;
  /* fiches RH et plannings par salarié : un salarié sans fiche reçoit une fiche vide au lieu de casser l'écran Équipe */
  var dflt={hr:function(){return {since:'',cls:'',gross:0,cp:[25,0],rec:0,ot:0,dip:[]}},shifts:function(){return []}};
  if(typeof Proxy==='function')Object.keys(dflt).forEach(function(k){var t=D[k];D[k]=new Proxy(t,{get:function(o,p){if(typeof p==='string'&&!(p in o)&&(D.staff||[]).some(function(x){return x.id===p}))o[p]=dflt[k]();return o[p]}})})};
PL.safeDefaults=function(){
  ['staff','coaches','horses','forfaits','members','halfboard','halfboardOffers','lessons','invoices','bank','competitions','entries','vans','carpool','care','journal','tasks','stock','equipment','cameras','sensors','contracts','threads','notifs','declarations','trackBookings']
    .forEach(function(k){if(!Array.isArray(D[k]))D[k]=[]});
  if(!Array.isArray(D.templates)||!D.templates.length)D.templates=['Pension complète','Pension pré','Demi-pension','Inscription et règlement intérieur','Autorisation parentale et droit à l’image','Mise à disposition d’un cheval','Vente de cheval','Location de box','Contrat de travail','Décharge de responsabilité'];
  D.facts=D.facts&&typeof D.facts==='object'?D.facts:{};
};

/* ---------- Collections dérivées (jamais inventées) ---------- */
var MO=['Janv','Févr','Mars','Avr','Mai','Juin','Juil','Août','Sept','Oct','Nov','Déc'];
PL.derive=function(){var now=D.today||new Date(),months=[],rev=[],cost=[],occ=[];
  for(var i=11;i>=0;i--){var d=new Date(now.getFullYear(),now.getMonth()-i,1);months.push(MO[d.getMonth()]);
    var key=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
    rev.push(Math.round((D.invoices||[]).filter(function(x){return x.status!=='brouillon'&&x.status!=='avoir'&&String(x.date||'').slice(0,7)===key}).reduce(function(s,x){return s+(+x.amount||0)},0)));
    cost.push(Math.round((D.receipts||[]).filter(function(x){return String(x.date||'').slice(0,7)===key}).reduce(function(s,x){return s+(+x.amount||0)},0)));
    occ.push(0)}
  var boxes=+D.club.boxes||0,used=(D.horses||[]).filter(function(h){return h.box}).length;occ[11]=boxes?Math.min(100,Math.round(used/boxes*100)):0;
  PL.setColl('months',months);PL.setColl('revenue',rev);PL.setColl('costs',cost);PL.setColl('occupancy',occ);
  /* notifications calculées à partir des vraies données */
  var n=[],t=PL.isoDay(now);
  var late=(D.invoices||[]).filter(function(x){return x.status==='en retard'});
  if(late.length)n.push({i:'invoice',c:'warn',t:late.length+' facture'+(late.length>1?'s':'')+' en retard pour '+P.fmt.eur(late.reduce(function(s,x){return s+(+x.left||+x.amount||0)},0)),w:'à relancer'});
  var careLate=(D.care||[]).filter(function(c){return c.status!=='fait'&&c.date&&c.date<t});
  if(careLate.length)n.push({i:'care',c:'bad',t:careLate.length+' soin'+(careLate.length>1?'s':'')+' en retard',w:'à reprogrammer'});
  var low=(D.stock||[]).filter(function(s){return +s.min&&+s.qty<+s.min});
  low.slice(0,3).forEach(function(s){n.push({i:'stock',c:'warn',t:s.name+' sous le seuil : '+s.qty+' '+(s.unit||''),w:'à commander'})});
  var dec=(D.declarations||[]).filter(function(x){return x.status==='en attente'});
  if(dec.length)n.push({i:'horse',c:'acc',t:dec.length+' cheval'+(dec.length>1?'aux déclarés':' déclaré')+' à valider',w:'en attente'});
  var sign=(D.contracts||[]).filter(function(x){return x.status==='à signer'});
  if(sign.length)n.push({i:'contract',c:'acc',t:sign.length+' contrat'+(sign.length>1?'s':'')+' en attente de signature',w:'en cours'});
  PL.setColl('notifs',n);
};

/* ---------- Météo réelle (Open-Meteo, gratuit, sans clé) ---------- */
var WI=function(code){if(code==null)return 'cloud';if(code<=1)return 'sun';if(code<=3||code===45||code===48)return 'cloud';if(code>=51)return 'rain';return 'cloud'};
var DW=['Dim','Lun','Mar','Mer','Jeu','Ven','Sam'];
PL.neutralWeather=function(){var out=[],d=new Date();for(var i=0;i<7;i++){var x=new Date(d);x.setDate(d.getDate()+i);out.push({d:i?DW[x.getDay()]:'Auj.',t:'–',i:'cloud',r:0,none:true})}return out};
PL.loadWeather=function(){var c=D.club,lat=+c.lat,lon=+c.lon;
  function geo(){if(lat&&lon)return Promise.resolve();var q=c.address||c.city;if(!q)return Promise.reject(0);
    return fetch('https://api-adresse.data.gouv.fr/search/?limit=1&q='+encodeURIComponent(q)).then(function(r){return r.json()}).then(function(j){var f=j.features&&j.features[0];if(!f)throw 0;lon=f.geometry.coordinates[0];lat=f.geometry.coordinates[1];c.lat=lat;c.lon=lon})}
  var key='piaffe:wx:'+(c.id||'');try{var cached=JSON.parse(localStorage.getItem(key)||'null');if(cached&&Date.now()-cached.at<3*3600e3){PL.setColl('weather',cached.w);return Promise.resolve(true)}}catch(e){}
  return geo().then(function(){return fetch('https://api.open-meteo.com/v1/forecast?latitude='+lat+'&longitude='+lon+'&daily=weather_code,temperature_2m_max,precipitation_probability_max&timezone=Europe%2FParis&forecast_days=7')})
    .then(function(r){return r.json()}).then(function(j){var dd=j.daily;if(!dd||!dd.time)throw 0;
      var w=dd.time.map(function(t,i){var x=new Date(t+'T12:00:00');return {d:i?DW[x.getDay()]:'Auj.',t:Math.round(dd.temperature_2m_max[i]),i:WI(dd.weather_code[i]),r:dd.precipitation_probability_max?Math.round(dd.precipitation_probability_max[i]||0):0}});
      PL.setColl('weather',w);try{localStorage.setItem(key,JSON.stringify({at:Date.now(),w:w}))}catch(e){}return true})
    .catch(function(){return false})};

/* ---------- Factures (API typée du lot C) → format de la démo ---------- */
var IST={draft:'brouillon',issued:'envoyée',sent:'envoyée',paid:'payée',partially_paid:'envoyée',overdue:'en retard',canceled:'annulée',cancelled:'annulée',credited:'avoir',void:'annulée'};
PL.invoiceToDemo=function(x){var total=x.total_cents!=null?x.total_cents:(x.amount_cents!=null?x.amount_cents:x.total_ttc_cents);
  var paid=x.paid_cents||0,st=IST[x.status]||x.status||'brouillon',due=x.due_date||x.due||'',today=PL.isoDay();
  if((st==='envoyée')&&due&&due<today&&paid<total)st='en retard';
  var lab=x.label||x.title||(x.lines&&x.lines[0]&&(x.lines[0].label||x.lines[0].description))||'Facture';
  return {id:x.number||x.id,_id:x.id,member:x.member_ref||x.customer_ref||x.member||'',label:lab,amount:(total||0)/100,left:Math.max(0,(total-paid)||0)/100,vat:x.vat_rate!=null?x.vat_rate:(x.lines&&x.lines[0]&&x.lines[0].vat_rate)||0,
    date:(x.issue_date||x.issued_at||x.created_at||'').slice(0,10),due:due.slice?due.slice(0,10):'',status:st,method:x.payment_method||x.method||'',live:x}};

/* ---------- Application du bootstrap ---------- */
/* étape 1, avant les modules : valeurs sûres, données du serveur */
PL.applyBoot=function(b){
  PL.setToday();PL.safeDefaults();
  PL.boot=b;PL.server=b.data||{};PL.versions=b.versions||{};PL.serverTime=b.server_time||new Date().toISOString();
  var data=PL.server,ui=data.club&&typeof data.club==='object'&&!Array.isArray(data.club)?data.club:null;
  PL.applyClub(b.club||null,ui);
  var st=(b.club&&b.club.settings)||{};PL.settings=st;
  /* collections de la démo : celles du serveur, sinon vides */
  PL.demoKeys.forEach(function(k){if(k==='today'||k==='club'||k==='me'||!PL.isColl(k))return;if(k==='templates'||k==='facts')return;PL.setColl(k,[])});
  Object.keys(data).forEach(function(k){if(k==='club')return;PL.setColl(k,data[k])});
  if(Array.isArray(st.templates)&&st.templates.length)D.templates=st.templates.slice();
  D.facts={};D.weather=PL.neutralWeather();D.bank=[];
  if(!(st&&st.sandbox))PL.preseed(data);
  PL.setPeople(b.me||{});
};
function unblob(arr){return arr}
PL.unblob=unblob;
/* étape 2, après les modules : un module a pu (ré)initialiser une collection avec des données fictives */
PL.afterModules=function(){var data=PL.server||{};
  Object.keys(D).forEach(function(k){if(!PL.isColl(k)||k==='club'||k==='today'||k==='me')return;
    if(data[k]!==undefined&&k!=='club'){PL.setColl(k,data[k]);return}
    if(PL.demoKeys.indexOf(k)<0&&PL.KEEP.indexOf(k)<0)wipe(D[k]);
  });
  /* catalogue des connecteurs : aucun n'est branché tant que le club ne l'a pas fait */
  (D.connectors||[]).forEach(function(c){if(c&&c.st)c.st='off'});
  ['weather','facts','bank'].forEach(function(k){if(k==='weather'&&(!D.weather||!D.weather.length))D.weather=PL.neutralWeather()});
  PL.derive();
};

/* ---------- Qui suis-je dans les données ---------- */
PL.personLabel={owner:'Gérant',manager:'Gérant',staff:'Équipe',coach:'Coach',member:'Adhérent',accountant:'Comptable'};
PL.setPeople=function(me){var u=PL.user||{},role=me.role||'owner',ids=me.person_ids||String(me.person_ref||'').split(',').filter(Boolean),ref=ids[0]||null;PL.personIds=ids;
  PL.role=role;PL.personRef=ref;
  var self={id:'me',first:u.first||(u.email||'').split('@')[0]||'Vous',last:u.last||'',role:PL.personLabel[role]||'',email:u.email||'',color:'var(--acc)',galop:0,age:null};
  PL.mePerson=self;
  var p0=D.person;if(!p0.__lv){D.person=function(i){return p0(i)||(i==='me'||i===PL.personRef?PL.mePerson:undefined)};D.person.__lv=true;
    var n0=D.name;D.name=function(i){var p=D.person(i);return p?((p.first||'')+' '+(p.last||'')).trim():''}}
  var who=ref&&p0(ref)?ref:'me';
  D.me={gerant:who,employe:who,adherent:who,coach:who,comptable:who};
  Object.keys(P.roles).forEach(function(r){P.roles[r].who=who});
};
})();
