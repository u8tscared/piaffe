/* =====================================================================
   PIAFFE LIVE · Garde-fous posés après le moteur et AVANT les modules
   - espace de noms window.PL
   - file des modules (exécutés après le chargement des vraies données)
   - P.mod enveloppé : une erreur de rendu affiche un état vide utile
   - coque sans cadre de démo (pas de barre de rôles, pas d'appareil simulé)
   ===================================================================== */
(function(){
var P=window.P,D=window.DATA;
var PL=window.PL={modq:[],modErrors:{},renderErrors:{},live:true,version:(window.PIAFFE_LIVE||{}).version};
PL.esc=P.fmt.esc;

/* garde une copie du jeu de démonstration (pour « Explorer avec des données d'exemple ») avant tout remplacement */
PL.demoKeys=Object.keys(D);
try{PL.demoData=JSON.parse(JSON.stringify(D,function(k,v){return typeof v==='function'?undefined:v}))}catch(e){PL.demoData=null}
PL.demoToday=D.today;

/* l'application vendue tourne en plein écran : jamais de cadre de téléphone ou de tablette simulé */
try{P.state.dev='desktop';P.store.set('dev','desktop')}catch(e){}

/* ---------- États vides, par écran ---------- */
/* quand un écran de la démo ne sait pas s'afficher (club neuf, données incomplètes), on montre à la place
   un état vide propre, avec l'action qui débloque la situation */
var EMPTY={
  cockpit:['today','Votre tableau de bord se remplit au fil de l’eau','Ajoutez vos chevaux, vos adhérents et vos reprises : les chiffres du jour apparaîtront ici.','horse','Ajouter un cheval'],
  rapports:['report','Pas encore assez de données pour un rapport','Les rapports se calculent à partir de vos factures, reprises et présences.','member','Ajouter un adhérent'],
  planning:['planning','Aucune reprise au planning','Créez votre première reprise hebdomadaire : jour, heure, moniteur et piste.','lesson','Créer une reprise'],
  communication:['chat','Aucune conversation pour l’instant','Les messages avec vos adhérents et votre équipe s’afficheront ici.','member','Ajouter un adhérent'],
  chevaux:['horse','Ajoutez votre premier cheval','Nom, box et propriétaire suffisent pour commencer. Vous compléterez la fiche plus tard.','horse','Ajouter un cheval'],
  cheval:['horse','Ce cheval est introuvable','Il a peut-être été supprimé depuis un autre appareil.','go:chevaux','Voir les chevaux'],
  soins:['care','Aucun soin enregistré','Planifiez un vermifuge, un maréchal ou une visite vétérinaire.','care','Planifier un soin'],
  alimentation:['feed','Les rations s’afficheront ici','Ajoutez vos chevaux : chacun reçoit une ration de base que vous ajusterez.','horse','Ajouter un cheval'],
  ecurie3d:['cube','Le plan de l’écurie apparaît avec vos boxes','Ajoutez des chevaux et attribuez-leur un box.','horse','Ajouter un cheval'],
  cameras:['camera','Aucune caméra reliée','Les caméras et capteurs se branchent depuis les connecteurs.','go:connecteurs','Voir les connecteurs'],
  entretien:['upkeep','Aucun stock ni tâche d’entretien','Ajoutez vos stocks de foin, de copeaux et de granulés pour suivre les seuils.','stock','Ajouter un stock'],
  adherents:['members','Ajoutez votre premier adhérent','Les cavaliers, parents et propriétaires reçoivent leur accès par e-mail.','member','Ajouter un adhérent'],
  adherent:['user','Cet adhérent est introuvable','Il a peut-être été supprimé depuis un autre appareil.','go:adherents','Voir les adhérents'],
  pensions:['owner','Aucune pension pour l’instant','Ajoutez un cheval de propriétaire pour suivre sa pension.','horse','Ajouter un cheval'],
  contrats:['contract','Aucun contrat','Créez un contrat de pension, de demi-pension ou d’inscription à faire signer en ligne.','go:contrats','Voir les modèles'],
  boutique:['shop','Votre boutique est vide','Ajoutez vos stages et vos produits pour les vendre en ligne.','go:reglages','Ouvrir les réglages'],
  facturation:['invoice','Aucune facture','Créez une facture ou laissez Piaffe facturer les forfaits automatiquement.','invoice','Créer une facture'],
  compta:['accounting','La comptabilité se remplit avec vos factures','Invitez votre comptable : il accède aux exports FEC et aux PDF.','go:lv-comptable','Inviter mon comptable'],
  equipe:['team','Ajoutez votre équipe','Moniteurs, palefreniers, accueil : chacun reçoit son espace sur téléphone.','staff','Ajouter un salarié'],
  coachs:['coach','Aucun coach','Ajoutez un moniteur ou un coach extérieur réservable.','coach','Ajouter un coach'],
  competitions:['compet','Aucun concours prévu','Ajoutez un concours pour gérer les engagements et le transport.','compet','Ajouter un concours'],
  assistant:['assistant','L’assistant a besoin de données','Ajoutez des chevaux et des adhérents pour lui poser des questions.','horse','Ajouter un cheval'],
  connecteurs:['plug','Connecteurs','Les intégrations se configurent ici.','go:lv-cles','Créer une clé d’API'],
  'import':['import','Importez vos données','Fichier Excel ou CSV, ou outil de migration depuis votre ancien logiciel.','go:lv-import','Importer mes données'],
  reglages:['settings','Réglages','Les réglages du club s’afficheront ici.','go:cockpit','Revenir à l’accueil']
};
var ROLE_EMPTY={employe:['today','Votre journée est vide','Votre gérant n’a pas encore planifié de tâches ni de soins.'],adherent:['today','Votre espace se prépare','Votre club n’a pas encore relié votre fiche. Revenez dans un instant ou contactez l’accueil.'],coach:['coach','Votre agenda est vide','Ajoutez vos disponibilités pour recevoir des réservations.']};
PL.emptyFor=function(m){var e=EMPTY[m.id];if(e)return e;var r=ROLE_EMPTY[m.role];if(r)return [r[0],r[1],r[2]];return [m.icon||'info',m.title,'Cet écran s’affichera dès que les données nécessaires seront saisies.']};
PL.renderEmpty=function(el,m,err){var e=PL.emptyFor(m),btn='';
  if(e[3])btn='<button class="btn pri lg lv-empty-go" data-lv-empty="'+e[3]+'">'+ICON(/^go:/.test(e[3])?'right':'plus','sm')+'<span>'+e[4]+'</span></button>';
  el.innerHTML='<div class="lv-empty rise">'+(window.ILLU&&ILLU.cheval?'<div class="lv-empty-illu">'+(m.id==='facturation'||m.id==='compta'?ILLU.pieces({size:120}):m.id==='soins'?ILLU.seau({size:120}):m.id==='competitions'?ILLU.trophee({size:120}):m.id==='contrats'?ILLU.contrat({size:120}):ILLU.cheval({size:120}))+'</div>':'<span class="ico lg">'+ICON(e[0])+'</span>')+
    '<h2>'+e[1]+'</h2><p>'+e[2]+'</p>'+btn+(err&&PL.debug?'<pre class="lv-err">'+PL.esc(String(err&&err.stack||err)).slice(0,600)+'</pre>':'')+'</div>';
  var b=el.querySelector('[data-lv-empty]');if(b)b.onclick=function(){var a=b.getAttribute('data-lv-empty');if(/^go:/.test(a)){var r=a.slice(3);if(P.mods[r])P.go(r);return}if(PL.forms&&PL.forms[a])PL.forms[a]();}};

/* un écran « vide » au sens des données : la démo ne prévoit pas toujours ce cas, on le traite avant le rendu */
var NEEDS={chevaux:'horses',alimentation:'horses',ecurie3d:'horses',pensions:'horses',adherents:'members',planning:'lessons',soins:'care',equipe:'staff',coachs:'coaches',competitions:'competitions'};
PL.isEmptyFor=function(m){var c=NEEDS[m.id];if(!c||!PL.ready)return false;var v=D[c];return !v||!v.length};

/* ---------- P.mod enveloppé ---------- */
var mod0=P.mod;
P.mod=function(m){
  if(m&&typeof m.render==='function'&&!m.__lv){var r0=m.render;m.__lv=true;
    m.render=function(el,ctx){
      if(PL.isEmptyFor(m)&&!(ctx&&ctx.params&&ctx.params.force)){PL.renderEmpty(el,m);return}
      try{r0.call(this,el,ctx);
        /* un écran de la démo qui attrape lui-même son erreur affiche « … erreur » : même traitement */
      }catch(e){PL.renderErrors[m.id]=String(e&&e.message||e);console.warn('[live] écran '+m.id+' :',e);PL.renderEmpty(el,m,e)}
    }}
  if(m&&typeof m.badge==='function'){var b0=m.badge;m.badge=function(){try{return b0.apply(this,arguments)}catch(e){return null}}}
  return mod0.call(P,m)};

/* graphiques : une série vide ne doit pas casser la page */
['line','bars','spark','donut'].forEach(function(k){var f=P.chart[k];if(!f)return;P.chart[k]=function(){try{return f.apply(P.chart,arguments)}catch(e){return '<div class="lv-nochart">'+ICON('report','sm')+'<span>Pas encore de données</span></div>'}}});
/* composants qui supposent une personne ou un cheval existant */
var av0=P.ui.av;P.ui.av=function(x,c){try{return av0(x,c)}catch(e){return ''}};
var hav0=P.ui.hav;P.ui.hav=function(x,c){try{return hav0(x,c)}catch(e){return ''}};
})();
