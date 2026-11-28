/* =====================================================================
   STABL · Démo des parcours d'inscription (stablapp.fr/onboarding/)
   Le VRAI code de l'onboarding (live/50-auth.js, 60-onboarding.js, 62-bienvenue.js), branché sur un
   faux serveur en mémoire : rien n'est enregistré, aucun e-mail n'est envoyé.
   Parcours : #ecurie (création du compte d'un club), #adherent (invitation reçue par e-mail),
   #cavalier (cavalier dont l'écurie n'est pas encore sur Stabl). Sans ancre : le choix du parcours.
   ===================================================================== */
(function(){
var P=window.P,PL=window.PL,D=window.DATA,esc=P.fmt.esc;
var S={user:null,club:null,member:false,done:null};
var CLUB='Écurie du Moulin';
PL.demoOnboarding=true;

/* l'adresse reste /onboarding/#… : les écrans d'authentification ne changent pas le chemin */
var keepPath=function(f){return function(st,t,u){try{var x=new URL(String(u||''),location.href);return f.call(history,st,t,location.pathname+(x.hash||location.hash))}catch(e){return f.call(history,st,t,u)}}};
history.pushState=keepPath(history.pushState);history.replaceState=keepPath(history.replaceState);

/* ---------- Faux serveur ---------- */
function json(b,st){return Promise.resolve(new Response(JSON.stringify(b),{status:st||200,headers:{'content-type':'application/json'}}))}
function wait(ms,v){return new Promise(function(r){setTimeout(function(){r(v)},ms)})}
function body(i){try{return i&&i.body?JSON.parse(i.body):{}}catch(e){return {}}}
var realFetch=window.fetch.bind(window);
window.fetch=function(u,init){var url=new URL(String(u),location.href),p=url.pathname,m=((init&&init.method)||'GET').toUpperCase(),b=body(init);
  if(!/^\/(api|auth)\//.test(p)||url.origin!==location.origin)return realFetch(u,init);
  var r=route(m,p,url,b);return wait(r.ms==null?380:r.ms).then(function(){return json(r.b,r.st)})};
function route(m,p,url,b){
  if(p==='/api/me')return S.user?{b:{user:S.user,clubs:S.club?[{id:'c1',name:S.club,role:S.member?'member':'owner'}]:[],current_club_id:S.club?'c1':null,role:S.member?'member':'owner',features:{google:false,mail:true,payments:true}},ms:120}:{b:{user:null},ms:120};
  if(p==='/auth/signup'){S.user={id:'u1',first:b.first,last:b.last,email:b.email,email_verified:false};return {b:{user:S.user},ms:650}}
  if(p==='/auth/login'){S.user=S.user||{id:'u1',first:'Claire',last:'Martin',email:b.email,email_verified:true};return {b:{user:S.user}}}
  if(/^\/auth\/(magic|password\/forgot|verify\/resend|logout)$/.test(p))return {b:{ok:true}};
  if(p==='/api/onboarding/siret'){var q=(url.searchParams.get('q')||'').trim(),nm=/\d{9}/.test(q.replace(/\s/g,''))?CLUB:q.replace(/(^|\s)\S/g,function(x){return x.toUpperCase()});
    return {b:{results:[{name:nm,siret:'12345678900012',siren:'123456789',legal_form:'sas',naf:'93.12Z',active:true,address:{line1:'12 chemin des Prés',zip:'69380',city:'Lozanne',country:'FR'}},
      {name:nm+' (ancien établissement)',siret:'12345678900020',siren:'123456789',legal_form:'sas',naf:'93.12Z',active:false,address:{line1:'4 route de Lyon',zip:'69380',city:'Lozanne',country:'FR'}}]},ms:700}}
  if(p==='/api/clubs'&&m==='POST'){S.club=b.name||CLUB;return {b:{club:{id:'c1',name:S.club}}}}
  if(p==='/api/onboarding/complete'){S.done='ecurie';return {b:{ok:true},ms:2600}}
  if(p==='/auth/invitations/demo'&&m==='GET')return {b:{invitation:{status:'pending',club:{name:CLUB},role:'member',email:'lea.durand@exemple.fr',first:'Léa',last:'Durand',inviter_name:'Claire Martin',account_exists:false}},ms:500};
  if(p==='/auth/invitations/demo/accept'){S.user={id:'u2',first:b.first||'Léa',last:b.last||'Durand',email:'lea.durand@exemple.fr',email_verified:true};S.club=CLUB;S.member=true;return {b:{club_id:'c1'},ms:700}}
  if(p==='/api/public/recommander')return {b:{ok:true},ms:800};
  if(p==='/api/mail/preferences')return {b:{email:(S.user||{}).email,categories:[{key:'bookings',label:'Confirmations de réservation',enabled:true},{key:'reminders',label:'Rappels de cours et de soins',enabled:true},{key:'waitlist',label:'Places libérées',enabled:false}]}};
  if(p==='/api/me'&&m==='PATCH')return {b:{user:S.user}};
  return {b:{ok:true},ms:200};
}

/* ---------- Récupération des données : simulation visible ---------- */
var BILAN=[['members','Adhérents',182],['family','Familles',64],['horse','Chevaux',31],['tag','Forfaits et cartes',12],['invoice','Factures',1240],['planning','Reprises au planning',46]];
PL.mig.open=function(o){return new Promise(function(res){var ov=document.createElement('div');ov.className='ob-build';
  ov.innerHTML='<div><div class="dm-mig-src">'+(o.outils||[]).slice(0,3).map(function(id){return '<span>'+PL.mig.icon(id)+esc(PL.mig.nameOf(id))+'</span>'}).join('')+'</div><h1>Récupération en cours</h1><p>Connexion, lecture, puis essai à blanc. Rien n’est modifié chez l’ancien logiciel.</p>'+
    '<div class="dm-mig">'+BILAN.map(function(x,i){return '<div class="li" data-i="'+i+'"><span class="ic">'+ICON(x[0],'sm')+'</span><span class="grow">'+x[1]+'</span><b data-n="'+x[2]+'">0</b></div>'}).join('')+'</div><p class="dm-note">Démo : chiffres d’exemple</p></div>';
  document.body.appendChild(ov);var rows=ov.querySelectorAll('.dm-mig .li'),k=0;
  (function step(){if(k>=rows.length){ov.querySelector('h1').textContent='Données récupérées.';ov.querySelector('p').textContent='Tout a été vérifié à blanc : rien ne manque.';if(PL.obSparkle)PL.obSparkle(ov.querySelector('.dm-mig'));setTimeout(function(){ov.style.transition='opacity .4s';ov.style.opacity='0';setTimeout(function(){ov.remove();res({etat:'termine',job_id:'demo'})},420)},1500);return}
    var r=rows[k],b=r.querySelector('b'),n=+b.getAttribute('data-n'),t0=performance.now();r.classList.add('on');
    (function count(t){var x=Math.min(1,(t-t0)/650);b.textContent=Math.round(n*(1-Math.pow(1-x,3))).toLocaleString('fr-FR');if(x<1)requestAnimationFrame(count);else{r.classList.add('done');k++;setTimeout(step,120)}})(t0)})()})};
PL.mig.job=function(){return Promise.resolve({demo:true})};
PL.mig.bilanHTML=function(){return '<div class="dm-bilan">'+BILAN.map(function(x){return '<div><b>'+x[2].toLocaleString('fr-FR')+'</b><span>'+x[1]+'</span></div>'}).join('')+'</div><p class="lv-note">Démo : chiffres d’exemple. Dans le vrai logiciel, le bilan détaille chaque fiche reprise.</p>'};
PL.createSandbox=function(){location.href='../demo/';return new Promise(function(){})};

/* ---------- Données de l'adhérente de démo (pour l'accueil adhérent) ---------- */
function memberData(){D.members=[{id:'m1',first:'Léa',last:'Durand',fam:'fam1',minor:false,galop:4,email:'lea.durand@exemple.fr'}];
  D.horses=[{id:'h1',name:'Tornade',owner:'m1',breed:'Selle Français',box:'B03',born:2014}];D.club={name:CLUB};PL.personRef='m1';PL.personIds=['m1'];PL.clubId=null;PL.view='adherent'}

/* ---------- Écrans propres à la démo ---------- */
function root(){var r=document.getElementById('lv-root');r.innerHTML='';document.body.classList.add('lv-booting');return r}
function ribbon(){if(document.querySelector('.dm-ribbon'))return;var d=document.createElement('a');d.className='dm-ribbon';d.href='#';d.innerHTML=ICON('eye','sm')+'<span>Démo des parcours · rien n’est enregistré</span><b>Changer de parcours</b>';document.body.appendChild(d)}
function hub(){S={user:null,club:null,member:false,done:null};var r=root();document.title='Créer son compte · Stabl';
  var C=[['ecurie','stable','d-acc','Je crée le compte de mon écurie','Inscription, questions, récupération des données Kavalog, puis l’espace prêt. Deux minutes.','Parcours écurie'],
    ['adherent','mail','d-mo','Mon écurie m’invite','L’e-mail reçu, la création de l’accès, puis l’accueil : coordonnées, autorisations, cheval. Une minute.','Parcours adhérent'],
    ['cavalier','horse','d-tm','Mon écurie n’est pas sur Stabl','Le cavalier recommande Stabl à son écurie en un e-mail.','Parcours cavalier']];
  r.innerHTML='<div class="dm-hub"><div class="dm-in"><div class="dm-top">'+PL.brandHTML(30,'#fff')+'<a class="dm-mails" href="mails/">'+ICON('mail','sm')+'Voir les e-mails</a></div>'+
    '<div class="eyebrow" style="color:#a9bcff">Démo interactive</div><h1>Créer son compte sur Stabl</h1><p>Le vrai écran d’inscription et d’accueil du logiciel, branché sur un faux serveur : cliquez, remplissez, rien n’est enregistré et aucun e-mail ne part.</p>'+
    '<div class="dm-cards">'+C.map(function(c,i){return '<a class="dm-card" href="#'+c[0]+'" style="--i:'+i+'"><span class="tag">'+c[5]+'</span><span class="ico '+c[2]+'">'+ICON(c[1])+'</span><b>'+c[3]+'</b><small>'+c[4]+'</small><span class="go">Commencer '+ICON('right','sm')+'</span></a>'}).join('')+'</div>'+
    '<p class="dm-foot"><a href="mails/">Les e-mails envoyés à chaque étape</a> · <a href="../demo/">La démo complète du logiciel</a> · <a href="../">stablapp.fr</a></p></div></div>'}
function inbox(){var r=root();document.title='Votre boîte e-mail · démo Stabl';ribbon();
  r.innerHTML='<div class="dm-inbox"><div class="dm-mail"><div class="dm-mh"><span class="av">'+PL.brandLogo(22,'#fff')+'</span><div class="grow"><b>'+esc(CLUB)+' via Stabl</b><small>à lea.durand@exemple.fr · à l’instant</small></div><span class="chip">Boîte de réception</span></div>'+
    '<div class="dm-subj">Bienvenue chez '+esc(CLUB)+' : activez votre espace</div><iframe class="dm-frame" title="E-mail reçu" src="mails/m/welcome_member.html"></iframe>'+
    '<div class="dm-cta"><span>'+ICON('info','sm')+'Dans la vraie vie, Léa clique sur le bouton du mail.</span><button class="btn pri" data-open>'+ICON('right','sm')+'Cliquer sur « Activer mon espace »</button></div></div></div>';
  var f=r.querySelector('iframe');f.onload=function(){try{var d=f.contentDocument;d.querySelectorAll('a').forEach(function(a){a.addEventListener('click',function(e){e.preventDefault();openInvite()})});f.style.height=Math.min(1400,d.documentElement.scrollHeight+4)+'px'}catch(e){}};
  r.querySelector('[data-open]').onclick=openInvite}
function openInvite(){history.replaceState(null,'','#adherent-invitation');PL.auth('invite',{token:'demo'});ribbon()}
function endScreen(kind){var r=root();ribbon();var E={
  ecurie:['L’espace de '+esc(S.club||CLUB)+' est prêt.','Dans le vrai logiciel, Claire arrive sur son tableau de bord avec sa liste de démarrage : inviter ses cavaliers, activer le paiement en ligne, vérifier les données reprises.',[['mails/m/welcome_owner.html','E-mail de bienvenue reçu par le gérant'],['mails/m/verify_email.html','E-mail de confirmation d’adresse'],['mails/m/welcome_member.html','E-mail que recevront ses cavaliers']]],
  adherent:['Léa est prête.','Dans le vrai logiciel, elle arrive sur son espace : réserver une reprise, payer ses factures, suivre Tornade. Le club voit son contact d’urgence et ses autorisations sur sa fiche.',[['mails/m/booking_confirmed.html','E-mail à chaque réservation'],['mails/m/invoice_issued.html','E-mail de facture'],['mails/m/payment_receipt.html','Reçu de paiement']]]}[kind];
  r.innerHTML='<div class="ob-build dm-end"><div><div class="ad-done" style="background:rgba(79,211,148,.16);color:#4fd394;margin:0 auto 22px"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h1>'+E[0]+'</h1><p>'+E[1]+'</p>'+
    '<div class="dm-links">'+E[2].map(function(l){return '<a href="'+l[0]+'" target="_blank" rel="noopener">'+ICON('mail','sm')+l[1]+'</a>'}).join('')+'</div>'+
    '<div class="dm-btns"><a class="btn pri lg" href="../demo/">'+ICON('eye','sm')+'Ouvrir la démo complète</a><a class="btn lg dm-ghost" href="#">'+ICON('refresh','sm')+'Essayer un autre parcours</a></div></div></div>';
  if(PL.obSparkle)setTimeout(function(){PL.obSparkle(r.querySelector('.ad-done'))},300)}

/* ---------- Démarrage (remplace celui du logiciel) ---------- */
var started=false;
PL.afterAuth=function(){PL.start()};
PL.start=function(){var h=location.hash.replace('#','');PL.user=S.user;
  if(!started){started=true;if(h==='ecurie'){PL.auth('signup',{});ribbon();return}if(h==='cavalier'){PL.auth('signup',{as:'rider'});ribbon();return}if(h==='adherent'){inbox();return}if(h==='adherent-invitation'){openInvite();return}hub();return}
  if(S.member){memberData();document.getElementById('lv-root').innerHTML='';document.body.classList.remove('lv-booting');var bg=document.createElement('div');bg.className='dm-appbg';document.getElementById('lv-root').appendChild(bg);
    PL.bienvenue.open({dry:true,onClose:function(){endScreen('adherent')}});return}
  if(S.user&&S.done==='ecurie'){endScreen('ecurie');return}
  if(S.user&&!S.member&&S.user.email_verified===false&&!S.verifySeen){S.verifySeen=true;PL.auth('verify',{});ribbon();return}
  if(S.user&&!S.club){PL.onboarding({});ribbon();return}
  hub()};
window.addEventListener('hashchange',function(){started=false;var o=document.querySelector('.ad-ob');if(o)o.remove();var b=document.querySelectorAll('.ob-build');b.forEach(function(x){x.remove()});try{localStorage.removeItem('piaffe:live:onb')}catch(e){}PL.start()});
try{localStorage.removeItem('piaffe:live:onb')}catch(e){}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',function(){PL.start()});else PL.start();
})();
