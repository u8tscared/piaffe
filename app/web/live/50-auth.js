/* =====================================================================
   PIAFFE LIVE · Authentification plein écran
   Connexion, Google, création de compte, mot de passe oublié, lien magique,
   vérification d'e-mail, invitation (/invitation/:token), réinitialisation (/reset/:token).
   ===================================================================== */
(function(){
var P=window.P,PL=window.PL,esc=P.fmt.esc;
var root=function(){var r=document.getElementById('lv-root');if(!r){r=document.createElement('div');r.id='lv-root';r.setAttribute('aria-live','polite');document.body.appendChild(r)}return r};

/* ---------- Marque (remplaçable : window.BRAND = {name, logo}) ---------- */
PL.brandName=function(){var B=window.BRAND||{};return B.name||'Piaffe'};
PL.brandLogo=function(size,col){var B=window.BRAND||{},l=B.logo||B.logoSvg||B.svg||B.src;size=size||28;
  if(typeof l==='function'){try{return l(size,col)}catch(e){}}
  if(typeof l==='string'&&/^\s*</.test(l))return l;
  if(typeof l==='string'&&l)return '<img src="'+esc(l)+'" alt="" style="height:'+size+'px;width:auto">';
  return LOGO(size,col||'currentColor','var(--strass)',true)};
PL.brandHTML=function(size,col){return '<span class="lv-brand">'+PL.brandLogo(size,col)+'<span>'+esc(PL.brandName())+'</span></span>'};

var GOOGLE='<svg viewBox="0 0 24 24" aria-hidden="true"><path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.5-5.2 3.5-8.8z"/><path fill="#34A853" d="M12 24c3.2 0 6-1.1 8-2.9l-3.9-3c-1.1.7-2.5 1.2-4.1 1.2-3.1 0-5.8-2.1-6.7-5H1.3v3.1A12 12 0 0 0 12 24z"/><path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8z"/><path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1c.9-2.9 3.6-4.9 6.7-4.9z"/></svg>';
var EYE='<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M2.5 12s3.5-6.5 9.5-6.5 9.5 6.5 9.5 6.5-3.5 6.5-9.5 6.5S2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/></svg>';

function hero(){
  return '<aside class="lv-hero"><div>'+PL.brandHTML(34,'var(--on-navy)')+'</div>'+
    '<div><h1>Votre écurie, enfin simple.</h1><p>Planning, chevaux, adhérents, factures et paiements en ligne : tout le club au même endroit, sur ordinateur comme sur téléphone.</p></div>'+
    '<div class="lv-illu">'+(window.ILLU&&ILLU.cheval?ILLU.cheval({size:null}):'')+'</div>'+
    '<div class="lv-proof"><span>'+ICON('shield','sm')+'Données hébergées en Europe</span><span>'+ICON('card','sm')+'Paiements par Stripe</span><span>'+ICON('invoice','sm')+'Facture électronique prête</span></div></aside>';
}
function shell(inner){var r=root();r.innerHTML='<div class="lv-auth">'+hero()+'<main class="lv-side"><div class="lv-card lv-view">'+inner+'</div></main></div>';return r.querySelector('.lv-card')}
function pw(id,ph,auto){return '<div class="lv-pw"><input class="in" type="password" id="'+id+'" placeholder="'+(ph||'')+'" autocomplete="'+(auto||'current-password')+'" required minlength="8"><button type="button" data-eye title="Afficher le mot de passe" aria-label="Afficher le mot de passe">'+EYE+'</button></div>'}
function field(label,input,hint){return '<label class="lv-fl"><span>'+label+(hint?' <span class="lv-hint">'+hint+'</span>':'')+'</span>'+input+'</label>'}
function msg(el,text,kind){var m=el.querySelector('.lv-msgs');if(!m)return;m.innerHTML=text?'<div class="lv-msg '+(kind||'')+'">'+ICON(kind==='ok'?'checkc':kind==='info'?'info':'alert','sm')+'<span>'+text+'</span></div>':''}
function busy(btn,on){if(!btn)return;btn.classList.toggle('busy',on);btn.disabled=on}
function mainBtn(label){return '<button class="btn pri lv-btn-main" type="submit"><span class="lv-spin"></span><span class="lv-bt">'+label+'</span></button>'}
function bindCommon(el){
  el.querySelectorAll('[data-eye]').forEach(function(b){b.onclick=function(){var i=b.parentNode.querySelector('input');i.type=i.type==='password'?'text':'password';b.title=i.type==='password'?'Afficher le mot de passe':'Masquer le mot de passe'}});
  el.querySelectorAll('[data-view]').forEach(function(b){b.onclick=function(e){e.preventDefault();PL.auth(b.getAttribute('data-view'),{email:(el.querySelector('#lv-email')||{}).value})}});
  var g=el.querySelector('[data-google]');if(g)g.onclick=function(){var next=PL.authNext||'/';location.href='/auth/google/start?next='+encodeURIComponent(next)};
  var f=el.querySelector('input:not([type=hidden])');if(f&&!PL.isTouch())setTimeout(function(){var a=document.activeElement;if(!a||a===document.body||!el.contains(a))f.focus()},60);
}
PL.isTouch=function(){return matchMedia('(pointer:coarse)').matches};
function strength(v){var s=0;if(v.length>=8)s++;if(v.length>=12)s++;if(/[A-Z]/.test(v)&&/[a-z]/.test(v))s++;if(/\d/.test(v))s++;if(/[^A-Za-z0-9]/.test(v))s++;return Math.min(4,s)}
function bindMeter(el,id){var i=el.querySelector('#'+id),m=el.querySelector('.lv-meter i'),t=el.querySelector('.lv-mt');if(!i||!m)return;
  i.addEventListener('input',function(){var s=strength(i.value),C=['var(--bad)','var(--bad)','var(--warn)','var(--ok)','var(--ok)'],L=['Trop court','Faible','Correct','Solide','Excellent'];
    m.style.setProperty('--v',(i.value?Math.max(10,s*25):0)+'%');m.style.setProperty('--c',C[s]);if(t)t.textContent=i.value?L[s]:'Au moins 8 caractères'})}

/* ---------- Vues ---------- */
var V={};
/* messages des redirections du serveur : /connexion?erreur=… et ?activation=… */
PL.AUTH_ERR={google:'La connexion avec Google n’a pas abouti. Réessayez.',google_session:'La connexion avec Google a expiré. Recommencez.',google_email:'Votre compte Google n’a pas d’adresse e-mail vérifiée.',
  google_annule:'Connexion avec Google annulée.',google_autre_compte:'Ce compte Google est déjà relié à un autre compte.',google_indisponible:'La connexion avec Google n’est pas encore disponible : utilisez votre e-mail.',
  trop_de_tentatives:'Trop de tentatives. Patientez quelques minutes avant de réessayer.',lien_invalide:'Ce lien de connexion n’est plus valable. Demandez-en un nouveau.',
  'activation:invalide':'Ce lien d’activation n’est pas valable.','activation:deja':'Votre accès est déjà activé : connectez-vous.','activation:expiree':'Ce lien d’activation a expiré. Demandez à votre club de vous en renvoyer un.'};
V.login=function(o){var el=shell('<h2>Bon retour</h2><p class="lv-sub">Connectez-vous pour retrouver votre club.</p>'+
  '<button class="lv-google" data-google type="button">'+GOOGLE+'Continuer avec Google</button><div class="lv-or">ou avec votre e-mail</div>'+
  '<form class="lv-f" novalidate><div class="lv-msgs"></div>'+field('Adresse e-mail','<input class="in" type="email" id="lv-email" autocomplete="email" inputmode="email" required value="'+esc(o.email||'')+'">')+
  field('Mot de passe',pw('lv-pass','','current-password'))+
  '<div class="lv-links"><a href="/mot-de-passe-oublie" class="lv-a" data-view="forgot">Mot de passe oublié ?</a><a href="/lien-magique" class="lv-a" data-view="magic">Recevoir un lien de connexion</a></div>'+mainBtn('Se connecter')+'</form>'+
  '<p class="lv-foot">Nouveau sur '+esc(PL.brandName())+' ? <a href="/inscription" class="lv-a" data-view="signup">Créer un compte gratuitement</a></p>');
  bindCommon(el);if(o.error)msg(el,esc(o.error));if(o.info)msg(el,o.info,'info');
  el.querySelector('form').onsubmit=function(e){e.preventDefault();var em=el.querySelector('#lv-email').value.trim(),pa=el.querySelector('#lv-pass').value,b=el.querySelector('[type=submit]');
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em))return msg(el,'Saisissez une adresse e-mail valide.');if(!pa)return msg(el,'Saisissez votre mot de passe.');
    busy(b,true);msg(el,'');PL.post('/auth/login',{email:em,password:pa}).then(function(){if(PL.authNext&&/^\/invitation\//.test(PL.authNext)){location.href=PL.authNext;return}PL.afterAuth()},function(x){busy(b,false);msg(el,x.status===401||x.status===400?(x.message||'E-mail ou mot de passe incorrect.'):PL.msg(x))})}};
V.signup=function(o){var el=shell('<h2>Créez votre compte</h2><p class="lv-sub">Trente jours d’essai complet, sans carte bancaire.</p>'+
  '<button class="lv-google" data-google type="button">'+GOOGLE+'Continuer avec Google</button><div class="lv-or">ou avec votre e-mail</div>'+
  '<form class="lv-f" novalidate><div class="lv-msgs"></div><div class="lv-row2">'+field('Prénom','<input class="in" id="lv-first" autocomplete="given-name" required>')+field('Nom','<input class="in" id="lv-last" autocomplete="family-name" required>')+'</div>'+
  field('Adresse e-mail','<input class="in" type="email" id="lv-email" autocomplete="email" inputmode="email" required value="'+esc(o.email||'')+'">')+
  field('Mot de passe',pw('lv-pass','','new-password')+'<div class="lv-meter"><i></i></div><span class="lv-hint lv-mt">Au moins 8 caractères</span>')+
  mainBtn('Créer mon compte')+'<p class="lv-note">En créant un compte, vous acceptez les conditions d’utilisation et la politique de confidentialité de '+esc(PL.brandName())+'.</p></form>'+
  '<p class="lv-foot">Déjà un compte ? <a href="/connexion" class="lv-a" data-view="login">Se connecter</a></p>');
  bindCommon(el);bindMeter(el,'lv-pass');
  el.querySelector('form').onsubmit=function(e){e.preventDefault();var f=el.querySelector('#lv-first').value.trim(),l=el.querySelector('#lv-last').value.trim(),em=el.querySelector('#lv-email').value.trim(),pa=el.querySelector('#lv-pass').value,b=el.querySelector('[type=submit]');
    if(!f||!l)return msg(el,'Indiquez votre prénom et votre nom.');if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em))return msg(el,'Saisissez une adresse e-mail valide.');if(pa.length<8)return msg(el,'Choisissez un mot de passe d’au moins 8 caractères.');
    busy(b,true);msg(el,'');PL.post('/auth/signup',{email:em,password:pa,first:f,last:l}).then(function(){PL.justSignedUp=true;PL.afterAuth()},function(x){busy(b,false);msg(el,x.status===409?'Un compte existe déjà avec cette adresse. Connectez-vous ou réinitialisez votre mot de passe.':PL.msg(x))})}};
V.forgot=function(o){var el=shell('<div class="lv-big-ico">'+ICON('key')+'</div><h2>Mot de passe oublié</h2><p class="lv-sub">Indiquez votre adresse : nous vous envoyons un lien pour en choisir un nouveau.</p>'+
  '<form class="lv-f" novalidate><div class="lv-msgs"></div>'+field('Adresse e-mail','<input class="in" type="email" id="lv-email" autocomplete="email" inputmode="email" required value="'+esc(o.email||'')+'">')+mainBtn('Envoyer le lien')+'</form>'+
  '<p class="lv-foot"><a href="/connexion" class="lv-a" data-view="login">Revenir à la connexion</a></p>');bindCommon(el);
  el.querySelector('form').onsubmit=function(e){e.preventDefault();var em=el.querySelector('#lv-email').value.trim(),b=el.querySelector('[type=submit]');if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em))return msg(el,'Saisissez une adresse e-mail valide.');
    busy(b,true);PL.post('/auth/password/forgot',{email:em}).then(function(){PL.auth('sent',{email:em,what:'reset'})},function(x){busy(b,false);msg(el,PL.msg(x))})}};
V.magic=function(o){var el=shell('<div class="lv-big-ico">'+ICON('mail')+'</div><h2>Connexion sans mot de passe</h2><p class="lv-sub">Recevez un lien de connexion valable quelques minutes. Pratique sur téléphone.</p>'+
  '<form class="lv-f" novalidate><div class="lv-msgs"></div>'+field('Adresse e-mail','<input class="in" type="email" id="lv-email" autocomplete="email" inputmode="email" required value="'+esc(o.email||'')+'">')+mainBtn('Recevoir mon lien')+'</form>'+
  '<p class="lv-foot"><a href="/connexion" class="lv-a" data-view="login">Se connecter avec un mot de passe</a></p>');bindCommon(el);
  el.querySelector('form').onsubmit=function(e){e.preventDefault();var em=el.querySelector('#lv-email').value.trim(),b=el.querySelector('[type=submit]');if(!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em))return msg(el,'Saisissez une adresse e-mail valide.');
    busy(b,true);PL.post('/auth/magic',{email:em}).then(function(){PL.auth('sent',{email:em,what:'magic'})},function(x){busy(b,false);msg(el,PL.msg(x))})}};
V.sent=function(o){var what=o.what==='reset'?'un lien pour choisir un nouveau mot de passe':'votre lien de connexion';
  var el=shell('<div class="lv-big-ico">'+ICON('send')+'</div><h2>Regardez vos e-mails</h2><p class="lv-sub">Si un compte existe pour <b>'+esc(o.email||'cette adresse')+'</b>, nous venons d’envoyer '+what+'. Pensez à vérifier les indésirables.</p>'+
  '<p class="lv-foot"><a href="/connexion" class="lv-a" data-view="login">Revenir à la connexion</a></p>');bindCommon(el)};
V.verify=function(o){var em=(PL.user&&PL.user.email)||o.email||'';
  var el=shell('<div class="lv-big-ico">'+ICON('mail')+'</div><h2>Confirmez votre adresse</h2><p class="lv-sub">Nous avons envoyé un lien à <b>'+esc(em)+'</b>. Cliquez dessus pour activer toutes les fonctions (paiements, invitations).</p>'+
  '<div class="lv-f"><div class="lv-msgs"></div><button class="btn pri lv-btn-main" data-cont><span class="lv-bt">Continuer sans attendre</span></button><button class="btn ghost" data-resend>'+ICON('refresh','sm')+'Renvoyer l’e-mail</button></div>');bindCommon(el);
  el.querySelector('[data-cont]').onclick=function(){PL.start()};
  el.querySelector('[data-resend]').onclick=function(){var b=this;b.disabled=true;PL.post('/auth/verify/resend',{}).then(function(){msg(el,'E-mail renvoyé. Il arrive en général en moins d’une minute.','ok')},function(x){msg(el,PL.msg(x))}).then(function(){setTimeout(function(){b.disabled=false},20000)})}};
V.verifyToken=function(o){var el=shell('<div class="lv-big-ico">'+ICON('hourglass')+'</div><h2>Vérification en cours</h2><p class="lv-sub">Un instant, nous confirmons votre adresse e-mail.</p><div class="lv-msgs"></div>');
  PL.post('/auth/verify',{token:o.token}).then(function(){history.replaceState(null,'','/');el.innerHTML='<div class="lv-big-ico">'+ICON('checkc')+'</div><h2>Adresse confirmée</h2><p class="lv-sub">Merci, votre compte est activé.</p><button class="btn pri lv-btn-main" data-go-on><span class="lv-bt">Continuer</span></button>';el.querySelector('[data-go-on]').onclick=function(){PL.start()}},
    function(x){el.querySelector('h2').textContent='Lien expiré ou déjà utilisé';el.querySelector('.lv-sub').textContent=x.status===400||x.status===404?'Ce lien de vérification n’est plus valable. Connectez-vous pour en recevoir un nouveau.':PL.msg(x);
      el.insertAdjacentHTML('beforeend','<button class="btn pri lv-btn-main" data-go-on><span class="lv-bt">Continuer</span></button>');el.querySelector('[data-go-on]').onclick=function(){history.replaceState(null,'','/');PL.start()}})};
V.reset=function(o){var el=shell('<div class="lv-big-ico">'+ICON('lock')+'</div><h2>Nouveau mot de passe</h2><p class="lv-sub">Choisissez un mot de passe que vous n’utilisez pas ailleurs.</p>'+
  '<form class="lv-f" novalidate><div class="lv-msgs"></div>'+field('Nouveau mot de passe',pw('lv-pass','','new-password')+'<div class="lv-meter"><i></i></div><span class="lv-hint lv-mt">Au moins 8 caractères</span>')+
  field('Confirmation',pw('lv-pass2','','new-password'))+mainBtn('Enregistrer et me connecter')+'</form>');bindCommon(el);bindMeter(el,'lv-pass');
  el.querySelector('form').onsubmit=function(e){e.preventDefault();var a=el.querySelector('#lv-pass').value,c=el.querySelector('#lv-pass2').value,b=el.querySelector('[type=submit]');
    if(a.length<8)return msg(el,'Choisissez un mot de passe d’au moins 8 caractères.');if(a!==c)return msg(el,'Les deux mots de passe ne sont pas identiques.');
    busy(b,true);PL.post('/auth/password/reset',{token:o.token,password:a}).then(function(){history.replaceState(null,'','/');PL.afterAuth({info:'Mot de passe enregistré.'})},function(x){busy(b,false);msg(el,x.status===400||x.status===404?'Ce lien n’est plus valable. Demandez-en un nouveau depuis « Mot de passe oublié ».':PL.msg(x))})}};
var ROLE_FR={owner:'gérant',manager:'gérant',staff:'membre de l’équipe',coach:'coach',member:'adhérent',accountant:'comptable'};
V.invite=function(o){var el=shell('<div class="lv-big-ico">'+ICON('mail')+'</div><h2>Invitation</h2><p class="lv-sub">Un instant, nous ouvrons votre invitation.</p><div class="lv-msgs"></div>');
  PL.get('/auth/invitations/'+encodeURIComponent(o.token)).then(function(inv){inv=inv.invitation||inv;var club=(inv.club&&inv.club.name)||inv.club_name||'votre club',role=inv.role_label?String(inv.role_label).toLowerCase():(ROLE_FR[inv.role]||'membre');
    if(inv.status&&inv.status!=='pending'){el.querySelector('h2').textContent=inv.status==='accepted'?'Invitation déjà acceptée':'Invitation expirée';el.querySelector('.lv-sub').textContent=inv.status==='accepted'?'Cette invitation a déjà servi. Connectez-vous pour retrouver '+club+'.':'Ce lien n’est plus valable. Demandez à '+club+' de vous renvoyer une invitation.';
      el.insertAdjacentHTML('beforeend','<button class="btn pri lv-btn-main" data-view="login"><span class="lv-bt">Aller à la connexion</span></button>');bindCommon(el);return}
    if(!PL.user&&inv.account_exists){PL.authNext=location.pathname;V.login({email:inv.email,info:'Vous avez déjà un compte '+esc(PL.brandName())+' : connectez-vous pour rejoindre '+esc(club)+'.'});return}
    var head='<div class="lv-invite"><span class="ico">'+ICON('stable')+'</span><div><b>'+esc(club)+'</b><small>vous invite en tant que '+role+(inv.inviter_name?', de la part de '+esc(inv.inviter_name):'')+'</small></div></div>';
    if(PL.user){el.innerHTML='<h2>Rejoindre '+esc(club)+'</h2><p class="lv-sub">Vous êtes connecté en tant que <b>'+esc(PL.user.email)+'</b>.</p>'+head+'<div class="lv-f"><div class="lv-msgs"></div>'+mainBtn('Accepter l’invitation').replace('type="submit"','type="button" data-acc')+'<button class="btn ghost" data-out>Utiliser un autre compte</button></div>';
      el.querySelector('[data-acc]').onclick=function(){var b=this;busy(b,true);PL.post('/auth/invitations/'+encodeURIComponent(o.token)+'/accept',{}).then(function(r){history.replaceState(null,'','/');if(r&&r.club_id)PL.wantClub=r.club_id;PL.start()},function(x){busy(b,false);msg(el,PL.msg(x))})};
      el.querySelector('[data-out]').onclick=function(){PL.post('/auth/logout',{}).catch(function(){}).then(function(){PL.user=null;V.invite(o)})};return}
    el.innerHTML='<h2>Rejoindre '+esc(club)+'</h2><p class="lv-sub">Créez votre accès en quelques secondes.</p>'+head+
      '<button class="lv-google" data-google type="button">'+GOOGLE+'Continuer avec Google</button><div class="lv-or">ou choisissez un mot de passe</div>'+
      '<form class="lv-f" novalidate><div class="lv-msgs"></div><div class="lv-row2">'+field('Prénom','<input class="in" id="lv-first" autocomplete="given-name" value="'+esc(inv.first||'')+'">')+field('Nom','<input class="in" id="lv-last" autocomplete="family-name" value="'+esc(inv.last||'')+'">')+'</div>'+
      field('Adresse e-mail','<input class="in" type="email" id="lv-email" value="'+esc(inv.email||'')+'" readonly>')+field('Mot de passe',pw('lv-pass','','new-password')+'<div class="lv-meter"><i></i></div><span class="lv-hint lv-mt">Au moins 8 caractères</span>')+mainBtn('Créer mon accès')+'</form>'+
      '<p class="lv-foot">Vous avez déjà un compte ? <a href="/connexion" class="lv-a" data-view="login">Se connecter</a> puis rouvrez le lien.</p>';
    PL.authNext=location.pathname;bindCommon(el);bindMeter(el,'lv-pass');
    el.querySelector('form').onsubmit=function(e){e.preventDefault();var b=el.querySelector('[type=submit]'),pa=el.querySelector('#lv-pass').value;if(pa.length<8)return msg(el,'Choisissez un mot de passe d’au moins 8 caractères.');
      busy(b,true);PL.post('/auth/invitations/'+encodeURIComponent(o.token)+'/accept',{password:pa,first:el.querySelector('#lv-first').value.trim(),last:el.querySelector('#lv-last').value.trim()}).then(function(r){history.replaceState(null,'','/');if(r&&r.club_id)PL.wantClub=r.club_id;PL.start()},function(x){busy(b,false);if(x.status===409&&x.code==='account_exists'){PL.authNext=location.pathname;V.login({email:inv.email,info:'Un compte existe déjà pour cette adresse : connectez-vous pour accepter l’invitation.'});return}msg(el,PL.msg(x))})}},
  function(x){el.querySelector('h2').textContent='Invitation introuvable';el.querySelector('.lv-sub').textContent=x.unavailable?'Les invitations ne sont pas encore disponibles sur ce serveur.':'Ce lien a expiré ou a déjà été utilisé. Demandez à votre club de vous renvoyer une invitation.';
    el.insertAdjacentHTML('beforeend','<button class="btn pri lv-btn-main" data-view="login"><span class="lv-bt">Aller à la connexion</span></button>');bindCommon(el)})};

var PATHS={login:'/connexion',signup:'/inscription',forgot:'/mot-de-passe-oublie',magic:'/lien-magique'};
PL.auth=function(view,o){o=o||{};document.body.classList.add('lv-booting');var f=V[view]||V.login;
  if(PATHS[view]&&location.pathname!==PATHS[view]&&!/^\/(invitation|reset|verify)/.test(location.pathname))try{history.pushState({lv:view},'',PATHS[view]+location.search)}catch(e){}
  document.title=({login:'Connexion',signup:'Créer un compte',forgot:'Mot de passe oublié',magic:'Lien de connexion',reset:'Nouveau mot de passe',invite:'Invitation',verify:'Confirmez votre adresse'}[view]||'Connexion')+' · '+PL.brandName();
  f(o)};
window.addEventListener('popstate',function(e){if(e.state&&e.state.lv&&V[e.state.lv])V[e.state.lv]({})});
PL.afterAuth=function(o){PL.start(o)};
})();
