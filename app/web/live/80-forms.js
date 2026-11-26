/* =====================================================================
   PIAFFE LIVE · Formulaires rapides (états vides et liste de démarrage)
   Ils créent des objets complets au format de la démo dans window.DATA ;
   la synchronisation les enregistre aussitôt.
   ===================================================================== */
(function(){
var P=window.P,D=window.DATA,PL=window.PL,esc=P.fmt.esc;
var DOW=[[1,'Lundi'],[2,'Mardi'],[3,'Mercredi'],[4,'Jeudi'],[5,'Vendredi'],[6,'Samedi'],[0,'Dimanche']];
function f(label,input,hint){return '<label class="lv-fl"><span>'+label+(hint?' <span class="lv-hint">'+hint+'</span>':'')+'</span>'+input+'</label>'}
function inp(id,o){o=o||{};return '<input class="in" id="'+id+'"'+(o.type?' type="'+o.type+'"':'')+(o.ph?' placeholder="'+esc(o.ph)+'"':'')+(o.v!=null?' value="'+esc(o.v)+'"':'')+(o.im?' inputmode="'+o.im+'"':'')+(o.ac?' autocomplete="'+o.ac+'"':'')+'>'}
function sel(id,opts,v){return '<select class="in" id="'+id+'">'+opts.map(function(o){var k=Array.isArray(o)?o[0]:o,l=Array.isArray(o)?o[1]:o;return '<option value="'+esc(k)+'"'+(String(k)===String(v)?' selected':'')+'>'+esc(l)+'</option>'}).join('')+'</select>'}
function val(sh,id){var e=sh.querySelector('#'+id);return e?e.value.trim():''}
/* feuille de formulaire générique : renvoie l'objet saisi à save(), qui renvoie un message ou lève une erreur lisible */
function form(o){var sh=P.sheet({title:o.title,icon:o.icon,body:'<form class="lv-f" novalidate>'+o.body+'<div class="lv-fmsg"></div></form>',foot:'<button class="btn ghost" data-cancel>Annuler</button><button class="btn pri" data-save>'+ICON('check','sm')+o.cta+'</button>'});
  var ok=function(){var m=sh.querySelector('.lv-fmsg');try{var r=o.save(sh);if(r===false)return;sh.close();P.rerender();P.renderBadges();P.toast(r||'Enregistré');PL.sync&&PL.sync.flush()}catch(e){m.innerHTML='<div class="lv-msg">'+ICON('alert','sm')+'<span>'+esc(e.message)+'</span></div>'}};
  sh.querySelector('[data-cancel]').onclick=function(){sh.close()};sh.querySelector('[data-save]').onclick=ok;sh.querySelector('form').onsubmit=function(e){e.preventDefault();ok()};
  if(o.bind)o.bind(sh);var first=sh.querySelector('input');if(first&&!PL.isTouch())setTimeout(function(){var a=document.activeElement;if(!a||a===document.body||!sh.contains(a))first.focus()},80);return sh}
function need(v,msg){if(!v)throw new Error(msg);return v}
function people(){return (D.members||[]).map(function(m){return [m.id,(m.first+' '+m.last).trim()]})}
function staffOpts(){return [['','À choisir']].concat((D.staff||[]).map(function(s){return [s.id,(s.first+' '+s.last).trim()+(s.role?' · '+s.role:'')]})).concat((D.coaches||[]).filter(function(c){return !c.staff}).map(function(c){return [c.id,(c.first+' '+c.last).trim()+' · coach']}))}
function rules(){return (PL.settings&&PL.settings.careRules)||[]}
function addDays(iso,n){var d=new Date(iso+'T12:00:00');d.setDate(d.getDate()+n);return PL.isoDay(d)}

PL.forms={
  horse:function(){form({title:'Ajouter un cheval',icon:'horse',cta:'Ajouter le cheval',body:
    f('Nom du cheval',inp('fh-name',{ph:'Ulysse de la Roche'}))+
    '<div class="lv-row2">'+f('Box',inp('fh-box',{ph:'B01'}))+f('Type',sel('fh-kind',[['club','Cheval du club'],['proprietaire','Cheval de propriétaire'],['demi','En demi-pension']],'club'))+'</div>'+
    '<div class="lv-row2">'+f('Race',inp('fh-breed',{ph:'Selle Français'}))+f('Année de naissance',inp('fh-born',{im:'numeric',ph:'2015'}))+'</div>'+
    '<div class="lv-fh-own" style="display:none">'+f('Propriétaire',sel('fh-owner',[['','Choisir un adhérent']].concat(people())))+'</div>'+
    '<div class="eyebrow" style="margin-top:6px">Derniers soins <span class="mut" style="text-transform:none;letter-spacing:0">facultatif, pour programmer les rappels</span></div>'+
    '<div class="lv-row2">'+f('Vermifuge',inp('fh-worm',{type:'date'}))+f('Vaccin',inp('fh-vacc',{type:'date'}))+'</div>'+f('Maréchal',inp('fh-farrier',{type:'date'})),
    bind:function(sh){var k=sh.querySelector('#fh-kind');k.onchange=function(){sh.querySelector('.lv-fh-own').style.display=k.value==='club'?'none':''}},
    save:function(sh){var name=need(val(sh,'fh-name'),'Indiquez le nom du cheval.'),born=parseInt(val(sh,'fh-born'),10);
      var h=PL.make.horse({name:name,box:val(sh,'fh-box').toUpperCase(),kind:val(sh,'fh-kind'),breed:val(sh,'fh-breed'),born:born||null,age:born?new Date().getFullYear()-born:null,
        owner:val(sh,'fh-owner')||undefined,worm:val(sh,'fh-worm')||null,vacc:val(sh,'fh-vacc')||null,farrier:val(sh,'fh-farrier')||null});
      D.horses.push(h);
      /* rappels de soins calculés à partir des dernières dates connues et des règles du club */
      var n=0,R=rules();[['worm','Vermifuge'],['vacc','Vaccin'],['farrier','Maréchal']].forEach(function(x){var last=h[x[0]],r=R.filter(function(y){return y.kind===x[1]})[0];if(!last||!r)return;
        D.care.push(PL.make.care({horse:h.id,kind:x[1],who:x[1]==='Vermifuge'?'Équipe':'',date:addDays(last,r.every_days),time:'09:00',note:r.note||'',status:'planifié'}));n++});
      return name+' ajouté'+(n?', '+n+' rappel'+(n>1?'s':'')+' de soins programmé'+(n>1?'s':''):'')}})},
  member:function(){form({title:'Ajouter un adhérent',icon:'members',cta:'Ajouter l’adhérent',body:
    '<div class="lv-row2">'+f('Prénom',inp('fm-first',{ac:'off'}))+f('Nom',inp('fm-last',{ac:'off'}))+'</div>'+
    f('Adresse e-mail',inp('fm-email',{type:'email',im:'email',ph:'prenom.nom@exemple.fr'}),'pour son accès et ses factures')+
    '<div class="lv-row2">'+f('Téléphone',inp('fm-phone',{im:'tel'}))+f('Âge',inp('fm-age',{im:'numeric'}))+'</div>'+
    '<div class="lv-row2">'+f('Galop',sel('fm-galop',[[0,'Débutant']].concat([1,2,3,4,5,6,7].map(function(g){return [g,'Galop '+g]})),0))+f('Forfait',sel('fm-forfait',[['','Aucun pour l’instant']].concat((D.forfaits||[]).map(function(x){return [x.id,x.name]}))))+'</div>'+
    '<p class="lv-note">Avec une adresse e-mail, l’adhérent reçoit un message de bienvenue et son invitation à l’espace cavalier.</p>',
    save:function(sh){var first=need(val(sh,'fm-first'),'Indiquez le prénom.'),last=need(val(sh,'fm-last'),'Indiquez le nom.'),email=val(sh,'fm-email').toLowerCase();
      if(email&&!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email))throw new Error('L’adresse e-mail n’est pas valide.');
      if(email&&D.members.some(function(m){return (m.email||'').toLowerCase()===email}))throw new Error('Un adhérent utilise déjà cette adresse e-mail.');
      var age=val(sh,'fm-age');D.members.push(PL.make.member({first:first,last:last,email:email,phone:val(sh,'fm-phone'),age:age?+age:null,galop:+val(sh,'fm-galop')||0,forfait:val(sh,'fm-forfait'),licence:''}));
      return first+' '+last+' ajouté'+(email?'. Une invitation part à '+email:'')}})},
  lesson:function(){form({title:'Créer une reprise',icon:'planning',cta:'Créer la reprise',body:
    f('Intitulé',inp('fl-title',{ph:'Galop 3-4'}))+'<div class="lv-row2">'+f('Jour',sel('fl-dow',DOW,new Date().getDay()))+f('Heure',inp('fl-start',{type:'time',v:'18:00'}))+'</div>'+
    '<div class="lv-row2">'+f('Durée',sel('fl-dur',[[45,'45 min'],[60,'1 h'],[90,'1 h 30'],[120,'2 h']],60))+f('Places',inp('fl-cap',{im:'numeric',v:8}))+'</div>'+
    '<div class="lv-row2">'+f('Moniteur',sel('fl-coach',staffOpts()))+f('Piste',sel('fl-arena',D.club.arenas.map(function(a){return [a.id,a.name]})))+'</div>',
    save:function(sh){var t=need(val(sh,'fl-title'),'Indiquez l’intitulé de la reprise.');var cap=parseInt(val(sh,'fl-cap'),10);if(!(cap>0))throw new Error('Indiquez le nombre de places.');
      D.lessons.push(PL.make.lesson({title:t,dow:+val(sh,'fl-dow'),start:val(sh,'fl-start')||'18:00',dur:+val(sh,'fl-dur'),cap:cap,coach:val(sh,'fl-coach'),arena:val(sh,'fl-arena')}));return 'Reprise « '+t+' » créée'}})},
  care:function(){if(!D.horses.length){PL.forms.horse();return}form({title:'Planifier un soin',icon:'care',cta:'Planifier',body:
    f('Cheval',sel('fc-horse',D.horses.map(function(h){return [h.id,h.name+(h.box?' · '+h.box:'')]})))+'<div class="lv-row2">'+f('Soin',sel('fc-kind',['Vermifuge','Vaccin','Maréchal','Vétérinaire','Dentiste','Ostéopathe','Surveillance']))+f('Intervenant',inp('fc-who'))+'</div>'+
    '<div class="lv-row2">'+f('Date',inp('fc-date',{type:'date',v:PL.isoDay()}))+f('Heure',inp('fc-time',{type:'time',v:'09:00'}))+'</div>'+f('Note',inp('fc-note')),
    save:function(sh){var d=need(val(sh,'fc-date'),'Indiquez la date.');D.care.push(PL.make.care({horse:val(sh,'fc-horse'),kind:val(sh,'fc-kind'),who:val(sh,'fc-who'),date:d,time:val(sh,'fc-time'),note:val(sh,'fc-note'),status:d<PL.isoDay()?'en retard':'planifié'}));return 'Soin planifié'}})},
  staff:function(){form({title:'Ajouter un salarié',icon:'team',cta:'Ajouter',body:'<div class="lv-row2">'+f('Prénom',inp('fs-first'))+f('Nom',inp('fs-last'))+'</div>'+'<div class="lv-row2">'+f('Poste',inp('fs-role',{ph:'Moniteur, palefrenier…'}))+f('Heures par semaine',inp('fs-hours',{im:'numeric',v:35}))+'</div>'+f('Contrat',inp('fs-contract',{ph:'CDI 35 h'}))+
    '<p class="lv-note">Pour lui donner son espace sur téléphone, invitez-le ensuite depuis « Accès et invitations ».</p>',
    save:function(sh){var a=need(val(sh,'fs-first'),'Indiquez le prénom.');D.staff.push(PL.make.staff({first:a,last:val(sh,'fs-last'),role:val(sh,'fs-role'),hours:+val(sh,'fs-hours')||0,contract:val(sh,'fs-contract')}));return a+' ajouté à l’équipe'}})},
  coach:function(){form({title:'Ajouter un coach',icon:'coach',cta:'Ajouter',body:'<div class="lv-row2">'+f('Prénom',inp('fo-first'))+f('Nom',inp('fo-last'))+'</div>'+'<div class="lv-row2">'+f('Spécialité',inp('fo-spec',{ph:'CSO'}))+f('Tarif horaire (€)',inp('fo-rate',{im:'numeric'}))+'</div>'+f('Présentation',inp('fo-bio')),
    save:function(sh){var a=need(val(sh,'fo-first'),'Indiquez le prénom.');D.coaches.push(PL.make.coach({first:a,last:val(sh,'fo-last'),spec:val(sh,'fo-spec'),rate:+val(sh,'fo-rate')||0,bio:val(sh,'fo-bio')}));return a+' ajouté aux coachs'}})},
  compet:function(){form({title:'Ajouter un concours',icon:'compet',cta:'Ajouter',body:f('Nom',inp('fk-name',{ph:'CSO Club et Poney'}))+f('Lieu',inp('fk-place'))+'<div class="lv-row2">'+f('Date',inp('fk-date',{type:'date'}))+f('Clôture des engagements',inp('fk-closes',{type:'date'}))+'</div>'+'<div class="lv-row2">'+f('Discipline',sel('fk-disc',['CSO','Dressage','CCE','Hunter','Endurance','Horse-ball','Pony-games']))+f('Niveau',inp('fk-level',{ph:'Club 2 à Club Élite'}))+'</div>',
    save:function(sh){var n=need(val(sh,'fk-name'),'Indiquez le nom du concours.'),d=need(val(sh,'fk-date'),'Indiquez la date.');D.competitions.push(PL.make.competition({name:n,place:val(sh,'fk-place'),date:d,closes:val(sh,'fk-closes')||d,disc:val(sh,'fk-disc'),level:val(sh,'fk-level')}));return 'Concours ajouté'}})},
  stock:function(){form({title:'Ajouter un stock',icon:'stock',cta:'Ajouter',body:f('Produit',inp('fk-n',{ph:'Foin de prairie'}))+'<div class="lv-row2">'+f('Quantité',inp('fk-q',{im:'decimal'}))+f('Unité',inp('fk-u',{ph:'balles rondes'}))+'</div>'+'<div class="lv-row2">'+f('Seuil d’alerte',inp('fk-min',{im:'decimal'}))+f('Consommation par jour',inp('fk-d',{im:'decimal'}))+'</div>'+f('Fournisseur',inp('fk-s')),
    save:function(sh){var n=need(val(sh,'fk-n'),'Indiquez le produit.');var num=function(id){return parseFloat(val(sh,id).replace(',','.'))||0};D.stock.push(PL.make.stock({name:n,qty:num('fk-q'),unit:val(sh,'fk-u'),min:num('fk-min'),daily:num('fk-d'),supplier:val(sh,'fk-s')}));return n+' ajouté aux stocks'}})},
  invoice:function(){PL.invoiceForm?PL.invoiceForm():P.toast('La facturation se prépare.',{icon:'info'})}
};
/* les actions de la palette ⌘K pour aller vite */
[['Ajouter un cheval','horse','horse'],['Ajouter un adhérent','members','member'],['Créer une reprise','planning','lesson'],['Planifier un soin','care','care']].forEach(function(a){if(P.actions.some(function(x){return x.role==='gerant'&&x.label===a[0]}))return;P.actions.push({role:'gerant',label:a[0],icon:a[1],lv:true,run:function(){PL.forms[a[2]]()}})});
})();
