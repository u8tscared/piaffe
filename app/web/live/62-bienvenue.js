/* =====================================================================
   STABL LIVE · Accueil de l'adhérent (28/11/2026)
   À la première ouverture d'un compte adhérent (invité par son écurie), un accueil en 4 à 5 écrans :
   bienvenue chez le club, coordonnées et contact d'urgence, santé et autorisations, son cheval s'il en a un,
   notifications et appli sur le téléphone, puis trois raccourcis. Une minute, tout est facultatif.
   Enregistrement : la fiche de l'adhérent (champs que la politique serveur lui laisse modifier :
   phone, emergency, emergencyPhone, allergies, consents, onboarded, prefs) via la synchro habituelle,
   et ses préférences d'e-mails par /api/mail/preferences. Ne revient plus une fois terminé ou passé.
   ===================================================================== */
(function(){
var P=window.P,PL=window.PL,esc=P.fmt.esc,D=window.DATA;
var KEY=function(){return 'stabl:bienvenue:'+((PL.user||{}).id||'')+':'+(PL.clubId||'')};
var A={},idx=0,dir='fwd',el=null,ctx=null;
function me(){var id=PL.personRef;return id?(D.members||[]).filter(function(m){return m.id===id})[0]:null}
function family(){var m=me();if(!m)return [];return (D.members||[]).filter(function(x){return x.id===m.id||(m.fam&&x.fam===m.fam)})}
function kids(){var m=me();return family().filter(function(x){return x.id!==(m&&m.id)&&x.minor})}
function horses(){var ids={};family().forEach(function(x){ids[x.id]=1});return (D.horses||[]).filter(function(h){return h.owner&&ids[h.owner]})}
function clubName(){return ((D.club&&D.club.name)||(PL.clubs||[]).filter(function(c){return c.id===PL.clubId}).map(function(c){return c.name})[0]||'votre club')}
function initial(s){s=String(s||'').replace(/^(écurie|ecurie|centre équestre|poney[- ]club|club|haras|domaine)\s+(du|de la|des|de|d’|d')?\s*/i,'')||s;return (s||'?').charAt(0).toUpperCase()}
function done(){try{return localStorage.getItem(KEY())==='1'}catch(e){return false}}
function setDone(){try{localStorage.setItem(KEY(),'1')}catch(e){}}
function sw(id,on,title,sub,i){return '<div class="ad-tog" role="switch" tabindex="0" data-sw="'+id+'" aria-checked="'+(!!on)+'" style="--i:'+(i||0)+'"><div class="grow"><b>'+title+'</b><small>'+sub+'</small></div><span class="ad-sw"></span></div>'}
function bindSw(q,cb){q.querySelectorAll('[data-sw]').forEach(function(t){var go=function(){var on=t.getAttribute('aria-checked')!=='true';t.setAttribute('aria-checked',on);cb(t.getAttribute('data-sw'),on)};t.onclick=go;t.onkeydown=function(e){if(e.key===' '||e.key==='Enter'){e.preventDefault();go()}}})}
function field(lab,inp,hint){return '<label class="lv-fl"><span>'+lab+(hint?' <span class="lv-hint">'+hint+'</span>':'')+'</span>'+inp+'</label>'}

var STEPS=[
 {id:'hello',render:function(){var c=clubName(),f=(PL.user&&PL.user.first)||'',k=kids();
   return '<div class="ad-hero"><span class="ad-horse">'+PL.brandLogo(150,'#fff')+'</span><div class="club"><span class="av">'+esc(initial(c))+'</span><span><b>'+esc(c)+'</b><small>vous ouvre votre espace '+esc(PL.brandName())+'</small></span></div>'+
     '<h1>Bienvenue'+(f?' '+esc(f):'')+' !</h1><p>'+(k.length?'Tout ce qui concerne '+esc(k.map(function(x){return x.first}).join(' et '))+' au même endroit : reprises, factures, autorisations.':'Vos reprises, vos factures'+(horses().length?' et votre cheval':'')+', au même endroit, sur votre téléphone.')+'</p></div>'+
     '<div class="ad-list">'+[['planning','Réservez et prévenez d’une absence en deux touches'],['card','Réglez vos factures en ligne, en quelques secondes'],horses().length?['horse','Suivez les soins et le journal de '+esc(horses()[0].name)]:['trophy','Suivez votre progression, du galop aux concours']].map(function(x,i){return '<div style="--i:'+i+'"><span class="ico">'+ICON(x[0])+'</span><span>'+x[1]+'</span></div>'}).join('')+'</div>'+
     '<p class="lv-note" style="margin-top:14px">Une minute pour compléter votre fiche, et c’est prêt. Tout est facultatif.</p>'},ok:function(){return true},cta:'C’est parti'},
 {id:'contact',render:function(){var m=me()||{};A.phone=A.phone!=null?A.phone:(m.phone||(PL.user&&PL.user.phone)||'');A.emergency=A.emergency!=null?A.emergency:(m.emergency||'');A.emergencyPhone=A.emergencyPhone!=null?A.emergencyPhone:(m.emergencyPhone||'');
   return '<div class="eyebrow">Vos coordonnées</div><h1>Comment le club vous joint-il ?</h1><p class="lv-sub">Pour prévenir d’une reprise annulée ou en cas d’imprévu à l’écurie. Seule l’équipe du club voit ces numéros.</p>'+
   '<div class="lv-f">'+field('Votre téléphone','<input class="in" id="ad-phone" type="tel" inputmode="tel" autocomplete="tel" value="'+esc(A.phone)+'" placeholder="06 12 34 56 78" maxlength="30">')+
   '<div class="lv-row2">'+field('Contact d’urgence','<input class="in" id="ad-em" autocomplete="off" value="'+esc(A.emergency)+'" placeholder="Prénom et lien, ex. Paul (père)" maxlength="80">')+field('Son téléphone','<input class="in" id="ad-emp" type="tel" inputmode="tel" value="'+esc(A.emergencyPhone)+'" placeholder="06…" maxlength="30">')+'</div></div>'},
   bind:function(q){[['ad-phone','phone'],['ad-em','emergency'],['ad-emp','emergencyPhone']].forEach(function(x){var i=q.querySelector('#'+x[0]);i.oninput=function(){A[x[1]]=i.value.trim()}})},ok:function(){return true}},
 {id:'consents',render:function(){var m=me()||{},c=A.consents||m.consents||{},k=kids(),who=k.length?k.map(function(x){return x.first}).join(' et '):'';A.consents=c;
   if(A.allergies==null)A.allergies=m.allergies||'';
   return '<div class="eyebrow">Santé et autorisations</div><h1>Deux accords, et une info utile.</h1><p class="lv-sub">Le club vous les demanderait sur papier en début de saison. Ici, c’est fait une fois pour toutes, et vous pouvez changer d’avis à tout moment.</p>'+
   sw('urgence',!!c.urgence,'Soins en cas d’urgence','J’autorise le club à appeler les secours et à faire soigner '+(who?esc(who):'moi')+' si on ne peut pas me joindre.',0)+
   sw('image',!!c.image,'Photos et vidéos','Le club peut publier des photos où '+(who?esc(who)+' apparaî'+(k.length>1?'ssent':'t'):'j’apparais')+' (site, réseaux, affichage).',1)+
   '<div class="lv-f" style="margin-top:16px">'+field('Allergies, asthme, traitement','<textarea class="in" id="ad-all" rows="2" maxlength="500" placeholder="Rien à signaler">'+esc(A.allergies)+'</textarea>','facultatif, visible par l’équipe seulement')+'</div>'},
   bind:function(q){bindSw(q,function(k,on){A.consents=Object.assign({},A.consents,{});A.consents[k]=on;A.consents.at=new Date().toISOString()});var t=q.querySelector('#ad-all');t.oninput=function(){A.allergies=t.value}},ok:function(){return true}},
 {id:'horse',skip:function(){return !horses().length},render:function(){var H=horses();
   return '<div class="eyebrow">'+(H.length>1?'Vos chevaux':'Votre cheval')+'</div><h1>'+(H.length>1?'Vos chevaux sont':esc(H[0].name)+' est')+' déjà là.</h1><p class="lv-sub">Le club tient son carnet : soins, maréchal, vaccins, journal. Vous voyez tout, et vous êtes prévenu avant chaque rendez-vous.</p>'+
   '<div class="ad-horses">'+H.map(function(h,i){return '<div class="ad-hc" style="animation-delay:'+(i*80)+'ms"><span class="ph">'+(h.photo?'<img alt="" src="'+esc(h.photo)+'">':PL.brandLogo(40,'#2448d8'))+'</span><div class="grow"><b>'+esc(h.name)+'</b><small>'+esc([h.breed,h.box?'Box '+h.box:null,h.born?('né en '+h.born):null].filter(Boolean).join(' · '))+'</small></div></div>'}).join('')+'</div>'+
   '<div class="lv-panel" style="margin-top:16px"><p>'+ICON('bell','sm')+' Vous recevrez un rappel avant le vermifuge, le vaccin ou le passage du maréchal. Réglable à l’écran suivant.</p></div>'},ok:function(){return true}},
 {id:'notifs',render:function(){var ios=PL.pwa&&PL.pwa.ios&&PL.pwa.ios(),inst=PL.pwa&&(PL.pwa.deferred||ios)&&!(PL.pwa.standalone&&PL.pwa.standalone());
   return '<div class="eyebrow">Restez prévenu</div><h1>Que voulez-vous recevoir ?</h1><p class="lv-sub">Juste l’utile. Les factures, reçus et changements de reprise arrivent toujours.</p><div class="ad-prefs"><div class="lv-dots" style="padding:12px"><i></i><i></i><i></i></div></div>'+
   (inst?'<div class="lv-panel" style="margin-top:14px"><p><b>'+ICON('download','sm')+' Mettez '+esc(PL.brandName())+' sur votre écran d’accueil</b></p><p style="margin:0">Elle s’ouvre comme une appli, en plein écran, même au fond de l’écurie sans réseau.</p>'+(PL.pwa.deferred?'<button class="btn pri" data-inst style="margin-top:12px">'+ICON('download','sm')+'Installer l’appli</button>':'<ol style="margin-top:8px"><li>Touchez <b>Partager</b>.</li><li>Choisissez <b>Sur l’écran d’accueil</b>.</li></ol>')+'</div>':'')},
   bind:function(q){var box=q.querySelector('.ad-prefs');var LAB={bookings:['Confirmations de réservation','Un e-mail à chaque réservation ou annulation.'],reminders:['Rappels de cours et de soins','La veille de votre reprise, avant le maréchal ou le vaccin.'],waitlist:['Places libérées','Dès qu’une place se libère dans une reprise complète.']};
     PL.get('/api/mail/preferences').then(function(j){var cats=(j.categories||[]);if(!cats.length){box.innerHTML='';return}A.mail=A.mail||{};
       box.innerHTML=cats.map(function(c,i){var on=A.mail[c.key]!=null?A.mail[c.key]:!!c.enabled;var l=LAB[c.key]||[c.label||c.key,'Par e-mail, désactivable à tout moment.'];return sw(c.key,on,esc(l[0]),esc(l[1]),i)}).join('');
       bindSw(box,function(k,on){A.mail[k]=on})},function(){box.innerHTML='<p class="lv-note">Vous pourrez choisir vos e-mails dans votre compte.</p>'});
     var ins=q.querySelector('[data-inst]');if(ins)ins.onclick=function(){var d=PL.pwa.deferred;if(d){d.prompt();PL.pwa.deferred=null;ins.disabled=true}}},ok:function(){return true},cta:'Terminer'},
 {id:'end',render:function(){var H=horses();
   return '<div class="ad-done"><svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div><h1>Tout est prêt.</h1><p class="lv-sub">Merci ! '+esc(clubName())+' a bien vos informations. Par quoi commencez-vous ?</p>'+
   '<div class="ad-go">'+[['adh-reserver','planning','Réserver une reprise','Vos créneaux et rattrapages'],['adh-paiements','card','Mes factures','Payer en ligne'],H.length?['adh-cheval','horse',esc(H[0].name),'Soins et journal']:['adh-progression','trophy','Ma progression','Galops et concours']].map(function(g,i){return '<button data-go="'+g[0]+'" style="--i:'+i+'"><span class="ico">'+ICON(g[1])+'</span><span>'+g[2]+'<br><small>'+g[3]+'</small></span></button>'}).join('')+'</div>'},
   bind:function(q){q.querySelectorAll('[data-go]').forEach(function(b){b.onclick=function(){close(b.getAttribute('data-go'))}})},noFoot:true}
];
function visible(){return STEPS.filter(function(s){return !(s.skip&&s.skip())})}
function cur(){var v=visible();if(idx>=v.length)idx=v.length-1;return v[idx]}
function draw(){var s=cur(),v=visible(),n=v.length-1,r=el.querySelector('.ob-rail'),h='';for(var i=1;i<=n;i++)h+='<i class="'+(i<=idx?'done':'')+'"></i>';r.innerHTML=h;
  var b=el.querySelector('.lv-ob-body');b.innerHTML='<div class="lv-q '+dir+'" data-ad="'+s.id+'">'+s.render()+'</div>';b.scrollTop=0;var q=b.firstChild;if(s.bind)s.bind(q);
  var f=el.querySelector('.lv-ob-foot');f.style.display=s.noFoot?'none':'';f.querySelector('.lv-bt').textContent=s.cta||'Continuer';f.querySelector('[data-back]').style.visibility=idx>0?'visible':'hidden';
  el.querySelector('[data-later]').style.visibility=s.id==='end'?'hidden':'visible';
  if(s.id==='end'){save();sparkleDone(q)}}
function sparkleDone(q){var d=q.querySelector('.ad-done');if(d&&PL.obSparkle){d.style.position='relative';setTimeout(function(){PL.obSparkle(d)},300)}}
function next(){var v=visible();if(idx<v.length-1){idx++;dir='fwd';draw()}}
function back(){if(idx>0){idx--;dir='back';draw()}}
/* enregistrement : fiche de l'adhérent (synchro), préférences d'e-mail, téléphone du compte */
var saved=false;
function save(){if(saved)return Promise.resolve();saved=true;setDone();var m=me(),jobs=[];
  if(m){if(A.phone!=null)m.phone=A.phone;if(A.emergency!=null)m.emergency=A.emergency;if(A.emergencyPhone!=null)m.emergencyPhone=A.emergencyPhone;if(A.allergies!=null)m.allergies=A.allergies;
    if(A.consents)m.consents=A.consents;m.onboarded=new Date().toISOString();
    if(PL.sync&&PL.sync.flush)jobs.push(PL.sync.flush().catch(function(){}))}
  if(A.mail&&Object.keys(A.mail).length)jobs.push(PL.put('/api/mail/preferences',{categories:A.mail}).catch(function(){}));
  if(A.phone&&PL.user&&A.phone!==PL.user.phone)jobs.push(PL.patch('/api/me',{phone:A.phone}).then(function(r){if(r&&r.user)PL.user=r.user}).catch(function(){}));
  return Promise.all(jobs)}
var onClose=null;
function close(go){var o=el;if(!o)return;save();if(onClose){var f=onClose;onClose=null;setTimeout(function(){f(go)},360)}o.style.transition='opacity .35s,transform .35s';o.style.opacity='0';o.style.transform='scale(.98)';setTimeout(function(){o.remove();el=null;if(go&&P.mods[go])P.go(go)},360)}

PL.bienvenue={
  /* à appeler une fois l'appli lancée (vue adhérent) */
  maybe:function(){if(PL.view!=='adherent'||PL.sandbox||done())return;var m=me();if(m&&m.onboarded){setDone();return}setTimeout(function(){PL.bienvenue.open()},500)},
  open:function(o){o=o||{};A={};idx=0;dir='fwd';saved=!!o.dry;onClose=o.onClose||null;
    var w=document.createElement('div');w.className='ad-ob';w.setAttribute('role','dialog');w.setAttribute('aria-label','Bienvenue');
    w.innerHTML='<header class="lv-ob-top">'+PL.brandHTML(26)+'<div class="ob-rail" aria-hidden="true"></div><button class="btn ghost sm" data-later>Plus tard</button></header><main class="lv-ob-body"></main>'+
      '<footer class="lv-ob-foot"><button class="btn ghost" data-back>'+ICON('back','sm')+'Retour</button><span class="grow"></span><button class="btn pri" data-next><span class="lv-bt">Continuer</span></button></footer>';
    document.body.appendChild(w);el=w;
    w.querySelector('[data-next]').onclick=next;w.querySelector('[data-back]').onclick=back;
    w.querySelector('[data-later]').onclick=function(){setDone();close()};
    w.addEventListener('keydown',function(e){if(e.key==='Enter'&&e.target.tagName!=='TEXTAREA'&&!e.target.closest('button,[data-sw]')){e.preventDefault();next()}});
    draw()}
};
})();
