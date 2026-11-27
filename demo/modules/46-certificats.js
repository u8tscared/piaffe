/* Lot 46 · Certificat d'engagement et de connaissance (équidés).
   Règle (code rural L. 211-10-1 et D. 214-37-1 ; instruction DGAL/SDSBEA/2023-284 du 26 avril 2023) :
   toute personne qui va détenir un cheval, un poney ou un âne sans être professionnelle de la filière doit avoir signé
   ce certificat, délivré par un vétérinaire ou un organisme listé par l'arrêté du 29 décembre 2022. Celui qui cède
   ou confie l'équidé garde une copie du certificat de la personne qui le reçoit. Pas de date de fin de validité.
   Écran : certificats (gérant). Données : cecs (un dossier par personne qui reçoit un équidé du club).
   Le vétérinaire peut délivrer le certificat depuis son espace (module 97-pro). */
(function(){
var D=P.D,F=P.fmt,U=P.ui,E=F.esc,NB=' ',$=P.$;
var DEMO=!D.me||D.me.gerant==='s01'||!!(window.PL&&PL.sandbox);
if(!Array.isArray(D.cecs))D.cecs=[];
function uid(p){return window.PL&&PL.uid?PL.uid(p):p+Date.now().toString(36)+Math.random().toString(36).slice(2,6)}
function today(){return D.iso(DEMO?new Date(D.today):new Date())}
function dayIso(o){var d=DEMO?new Date(D.today):new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+o);return D.iso(d)}
var REASONS={achat:'Achat',don:'Don',pret:'Prêt ou commodat',location:'Location au mois',pension:'Pension chez un particulier'};
var ST={'à demander':['À demander','warn'],'demandé':['Demandé','acc'],'reçu':['Reçu','ok'],'dispensé':['Dispensé','']};

/* données de démonstration */
var seeded=false;
function seed(){if(seeded||!DEMO)return;seeded=true;if(D.cecs.length)return;
  var ad=(D.horseAds||[]).find(function(a){return a.status==='sous option'});
  D.cecs.push(
    {id:'cec1',horse:ad?ad.horse:'h25',ad:ad?ad.id:null,person:'Sophie Marchand',email:'sophie.marchand@exemple.fr',phone:'06 41 22 58 10',reason:'achat',status:'demandé',asked:dayIso(-3),created:dayIso(-3)},
    {id:'cec2',horse:'h33',person:'Julien Perrin',email:'julien.perrin@exemple.fr',reason:'pret',status:'reçu',issuer:'Vétérinaire',issuerName:'Dr Leclerc',ordre:'21547',issued:dayIso(-40),received:dayIso(-38),created:dayIso(-45)},
    {id:'cec3',horse:'h18',person:'Haras du Val, Thomas Girard',reason:'achat',status:'dispensé',siret:'812 345 678 00021',received:dayIso(-90),created:dayIso(-92)})}

/* pour la vente (45-terrain) : dossier lié à une annonce, créé au besoin pour l'acheteur */
P.cec={forAd:function(a,l){seed();var c=D.cecs.find(function(x){return x.ad===a.id});
  if(!c&&l){c={id:uid('cec'),horse:a.horse,ad:a.id,person:l.name||'Acheteur',email:l.email||'',phone:l.phone||'',reason:'achat',status:'à demander',created:today()};D.cecs.push(c)}return c},
  list:function(){seed();return D.cecs}};

function hName(id){var h=D.horse(id);return h?h.name:'Cheval'}
function chip(s){var x=ST[s]||[s,''];return U.chip(x[0],x[1],true)}
function msgFor(c){return 'Bonjour '+String(c.person||'').split(' ')[0]+',\n\nAvant de '+(c.reason==='achat'?'repartir avec ':'prendre en charge ')+hName(c.horse)+', la loi demande que vous ayez signé un certificat d’engagement et de connaissance pour la détention d’un équidé (sauf si vous êtes un professionnel de la filière équine).\n\n'+
  'Il est délivré par un vétérinaire ou par un organisme agréé : il présente les besoins du cheval, ses obligations d’identification et de transport, et ce qu’il coûte. Vous le signez avec une phrase écrite à la main. Il est valable sans limite de durée : si vous en avez déjà un, envoyez-nous simplement une photo.\n\n'+
  'Nous devons en garder une copie. Merci de nous l’envoyer en réponse à ce message.\n\nÀ bientôt,\n'+(D.club.name||'')}

/* ---------- Feuilles ---------- */
function newSheet(){var hs=(D.horses||[]).slice().sort(function(a,b){return String(a.name).localeCompare(b.name)});
  var sh=P.sheet({title:'Nouveau dossier',icon:'doc',body:'<div class="stack" style="--g:12px">'+
    '<label><span class="xs mut">Personne qui reçoit le cheval</span><input class="in" data-f="person" placeholder="Prénom et nom"></label>'+
    '<label><span class="xs mut">E-mail</span><input class="in" data-f="email" type="email" placeholder="adresse@exemple.fr"></label>'+
    '<label><span class="xs mut">Cheval</span><select class="in" data-f="horse">'+hs.map(function(h){return '<option value="'+E(h.id)+'">'+E(h.name)+'</option>'}).join('')+'</select></label>'+
    '<label><span class="xs mut">Situation</span><select class="in" data-f="reason">'+Object.keys(REASONS).map(function(k){return '<option value="'+k+'">'+REASONS[k]+'</option>'}).join('')+'</select></label></div>',
    foot:'<button class="btn ghost" data-x>Annuler</button><button class="btn pri" data-ok>'+ICON('plus','sm')+'Créer le dossier</button>'});
  $('[data-x]',sh).onclick=function(){sh.close()};
  $('[data-ok]',sh).onclick=function(){var v=function(k){return ($('[data-f="'+k+'"]',sh).value||'').trim()};if(!v('person')){P.toast('Indiquez le nom de la personne',{icon:'alert'});return}
    var c={id:uid('cec'),person:v('person'),email:v('email'),horse:v('horse'),reason:v('reason'),status:'à demander',created:today()};D.cecs.unshift(c);sh.close();P.rerender();P.toast('Dossier créé pour '+c.person,{undo:function(){D.cecs.splice(D.cecs.indexOf(c),1);P.rerender()}})}}
function askSheet(c){var m=msgFor(c);
  var sh=P.sheet({title:'Demander le certificat',icon:'mail',body:'<p class="s mut" style="margin-bottom:10px">Message prêt pour '+E(c.person)+'. Il part de votre messagerie : rien n’est envoyé sans vous.</p><textarea class="in" data-m rows="12" style="width:100%;min-height:260px">'+E(m)+'</textarea>',
    foot:'<button class="btn ghost" data-cp>'+ICON('copy','sm')+'Copier</button>'+(c.email?'<a class="btn pri" data-mail href="mailto:'+encodeURIComponent(c.email)+'?subject='+encodeURIComponent('Certificat d’engagement pour '+hName(c.horse))+'&body='+encodeURIComponent(m)+'">'+ICON('mail','sm')+'Ouvrir ma messagerie</a>':'')});
  function mark(){if(c.status==='à demander'){c.status='demandé';c.asked=today();P.rerender()}}
  $('[data-cp]',sh).onclick=function(){var t=$('[data-m]',sh).value;try{var p=navigator.clipboard&&navigator.clipboard.writeText(t);if(p&&p.catch)p.catch(function(){})}catch(e){}mark();P.toast('Message copié, dossier marqué « demandé »',{icon:'copy'})};
  var ml=$('[data-mail]',sh);if(ml)ml.onclick=function(){mark();setTimeout(function(){sh.close()},50)}}
function receiveSheet(c){var photo=null;
  var sh=P.sheet({title:'Certificat reçu',icon:'checkc',body:'<div class="stack" style="--g:12px">'+
    '<div class="seg" role="tablist">'+[['Vétérinaire','Vétérinaire'],['Organisme','Organisme agréé'],['pro','Professionnel dispensé']].map(function(x,i){return '<button role="tab" data-k="'+x[0]+'" aria-selected="'+(i===0)+'">'+x[1]+'</button>'}).join('')+'</div>'+
    '<div data-cert><label><span class="xs mut">Délivré par</span><input class="in" data-f="issuerName" placeholder="Dr Leclerc, ou nom de l’organisme"></label>'+
    '<label data-ord style="display:block;margin-top:12px"><span class="xs mut">N° d’inscription à l’Ordre des vétérinaires</span><input class="in" data-f="ordre" inputmode="numeric"></label>'+
    '<label style="display:block;margin-top:12px"><span class="xs mut">Date de délivrance</span><input class="in" type="date" data-f="issued" value="'+today()+'"></label>'+
    '<label style="display:block;margin-top:12px"><span class="xs mut">Photo du certificat signé (copie à garder)</span><input class="in" type="file" accept="image/*,application/pdf" data-file></label></div>'+
    '<div data-pro hidden><p class="s mut">Les professionnels de la filière équine sont dispensés (activité au contact des équidés avec un SIRET, 18 mois d’expérience ou diplôme reconnu).</p><label style="display:block;margin-top:12px"><span class="xs mut">SIRET de l’acheteur</span><input class="in" data-f="siret" inputmode="numeric" placeholder="123 456 789 00012"></label></div>'+
    '<p class="xs mut">La mention écrite à la main et la signature figurent sur l’original, que la personne garde. Vous gardez une copie.</p></div>',
    foot:'<button class="btn ghost" data-x>Annuler</button><button class="btn pri" data-ok>'+ICON('check','sm')+'Enregistrer</button>'});
  var kind='Vétérinaire';
  sh.querySelectorAll('[data-k]').forEach(function(b){b.onclick=function(){kind=b.getAttribute('data-k');sh.querySelectorAll('[data-k]').forEach(function(x){x.setAttribute('aria-selected',x===b)});
    $('[data-cert]',sh).hidden=kind==='pro';$('[data-pro]',sh).hidden=kind!=='pro';$('[data-ord]',sh).style.display=kind==='Vétérinaire'?'block':'none'}});
  $('[data-file]',sh).onchange=function(e){photo=e.target.files&&e.target.files[0]||null};
  $('[data-x]',sh).onclick=function(){sh.close()};
  $('[data-ok]',sh).onclick=function(){var v=function(k){var x=$('[data-f="'+k+'"]',sh);return x?(x.value||'').trim():''};var prev=JSON.parse(JSON.stringify(c));
    if(kind==='pro'){if(v('siret').replace(/\s/g,'').length!==14){P.toast('Le SIRET compte 14 chiffres',{icon:'alert'});return}c.status='dispensé';c.siret=v('siret')}
    else{if(!v('issuerName')){P.toast('Indiquez qui a délivré le certificat',{icon:'alert'});return}c.status='reçu';c.issuer=kind;c.issuerName=v('issuerName');c.ordre=v('ordre');c.issued=v('issued')}
    c.received=today();
    if(photo){c.file=photo.name;if(window.STABL_MEDIA&&/^image\//.test(photo.type)&&c.horse){try{window.STABL_MEDIA.add(c.horse,{blob:photo,kind:'document',note:'Certificat d’engagement de '+c.person}).then(function(m){if(m&&m.id){c.media=m.id;P.rerender()}},function(){})}catch(e){}}}
    sh.close();P.rerender();P.toast(c.status==='dispensé'?c.person+' : professionnel dispensé, noté au dossier':'Certificat de '+c.person+' enregistré',{undo:function(){Object.keys(c).forEach(function(k){delete c[k]});Object.assign(c,prev);P.rerender()}})}}

/* ---------- Écran ---------- */
P.css(`
.ce-row{display:flex;gap:14px;align-items:center;padding:14px 18px;border-top:1px solid var(--line)}
.ce-row:first-child{border-top:0}
.ce-row .grow{min-width:0}
.ce-acts{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.ce-rules li{margin:6px 0 0 18px;list-style:disc}
@container main (max-width:760px){.ce-row{flex-wrap:wrap}.ce-acts{width:100%;justify-content:flex-start}}
`);
function render(el){seed();var L=D.cecs.slice().sort(function(a,b){var o={'à demander':0,'demandé':1,'reçu':2,'dispensé':3};return (o[a.status]-o[b.status])||String(b.created).localeCompare(a.created)});
  var open=L.filter(function(c){return c.status==='à demander'||c.status==='demandé'}).length;
  var h=U.ph('Certificats d’engagement',open?open+' dossier'+(open>1?'s':'')+' en attente · obligatoire avant de confier ou de vendre un équidé à un particulier':'Tous les dossiers sont complets',
    '<button class="btn pri" data-new>'+ICON('plus','sm')+'Nouveau dossier</button>');
  h+='<div class="g2" style="gap:16px;margin-bottom:16px;align-items:start"><div class="card">'+(L.length?L.map(function(c){var hz=D.horse(c.horse);
      return '<div class="ce-row"><span class="ico">'+ICON(c.status==='reçu'?'checkc':c.status==='dispensé'?'shield':'doc')+'</span><div class="grow"><b>'+E(c.person)+'</b><div class="s mut">'+E(REASONS[c.reason]||c.reason)+(hz?' · '+E(hz.name):'')+
        (c.status==='reçu'?' · délivré par '+E(c.issuerName||'')+(c.issued?' le '+F.date(c.issued):''):c.status==='dispensé'?' · SIRET '+E(c.siret||''):c.asked?' · demandé le '+F.date(c.asked):'')+(c.file?' · copie gardée':'')+'</div><div style="margin-top:6px">'+chip(c.status)+'</div></div>'+
        '<div class="ce-acts">'+(c.status==='à demander'||c.status==='demandé'?'<button class="btn sm" data-ask="'+E(c.id)+'">'+ICON('mail','sm')+(c.status==='demandé'?'Relancer':'Demander')+'</button><button class="btn sm pri" data-rec="'+E(c.id)+'">'+ICON('check','sm')+'Certificat reçu</button>':'<button class="btn ghost sm" data-rec="'+E(c.id)+'">'+ICON('edit','sm')+'Modifier</button>')+'</div></div>'}).join(''):U.empty('doc','Aucun dossier','Créez un dossier quand vous vendez, prêtez ou louez un cheval à un particulier.'))+'</div>'+
    '<div class="card pad soft"><b>Ce que dit la loi</b><ul class="ce-rules s">'+
      '<li>Toute personne qui va détenir un équidé sans être professionnelle de la filière signe ce certificat, avec une phrase écrite à la main.</li>'+
      '<li>Il est délivré par un vétérinaire ou par un organisme agréé (arrêté du 29 décembre 2022). Votre vétérinaire peut le préparer depuis son espace Stabl.</li>'+
      '<li>Il n’expire pas : un certificat déjà signé reste valable.</li>'+
      '<li>Quand vous cédez ou confiez un équidé, vous gardez une copie du certificat de la personne qui le reçoit.</li>'+
      '<li>Dispensés : les professionnels au contact des équidés (SIRET et activité équine, 18 mois d’expérience ou diplôme reconnu).</li></ul>'+
      '<p class="xs mut" style="margin-top:10px">Sources : code rural, articles L. 211-10-1 et D. 214-37-1 ; instruction DGAL/SDSBEA/2023-284 du 26 avril 2023.</p></div></div>';
  el.innerHTML=h;
  el.onclick=function(e){var b=e.target.closest('button');if(!b)return;var id=b.getAttribute('data-ask')||b.getAttribute('data-rec'),c=id&&D.cecs.find(function(x){return x.id===id});
    if(b.hasAttribute('data-new'))return newSheet();if(c&&b.hasAttribute('data-ask'))return askSheet(c);if(c&&b.hasAttribute('data-rec'))return receiveSheet(c)}}

P.mod({id:'certificats',role:'gerant',group:'Écurie',title:'Certificats d’engagement',icon:'doc',n:86,phoneTitle:'Certificats',short:'Certificats',
  badge:function(){seed();var n=D.cecs.filter(function(c){return c.status==='à demander'}).length;return n?{v:n}:null},render:render});
})();
