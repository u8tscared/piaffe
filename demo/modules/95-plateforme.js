/* Vue gérant · Plateforme : assistant IA, connecteurs / API / MCP, import et onboarding, réglages (lot I) */
(function(){
var D=P.D,F=P.fmt,U=P.ui,C=P.chart,$=P.$,$$=P.$$,esc=F.esc;
function sum(a,f){return a.reduce(function(s,x){return s+(f?f(x):x)},0)}
function norm(s){return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g,'')}
function clip(t,msg){try{var p=navigator.clipboard&&navigator.clipboard.writeText(t);if(p&&p.catch)p.catch(function(){})}catch(e){}P.toast(msg||'Copié dans le presse-papiers',{icon:'copy'})}
function on(root,sel,fn,ev){$$(sel,root).forEach(function(b){b.addEventListener(ev||'click',function(e){fn(b,e)})})}
function lg(txt,c,cls){return '<span class="pf-lg '+(cls||'')+'" style="--c:'+(c||'var(--acc)')+'">'+txt+'</span>'}
function go(id,params,label){if(P.mods[id])P.go(id,params);else P.toast('L’écran « '+(label||id)+' » s’ouvre dans la démo complète',{icon:'info'})}
function sheet(){return $('.sheet',P.app())}
/* coloration légère du code (JSON, cURL, JS, Python) avec les jetons */
function code(src){var s=esc(src);
  s=s.replace(/(&quot;[^&\n]*?&quot;)(\s*:)?/g,function(m,a,b){return '<span class="'+(b?'k':'s')+'">'+a+'</span>'+(b||'')});
  s=s.replace(/(^|[\s\[,:(])(-?\d[\d_.]*)(?=[\s,\]})]|$)/gm,'$1<span class="n">$2</span>');
  s=s.replace(/\b(true|false|null|GET|POST|PATCH|DELETE|curl|import|const|await|print|def|return)\b/g,'<span class="b">$1</span>');
  s=s.replace(/(^|\n)(\s*(#|\/\/)[^\n]*)/g,'$1<span class="c">$2</span>');
  return s}
function pre(src,o){o=o||{};return '<div class="pf-code'+(o.cls?' '+o.cls:'')+'">'+(o.title?'<div class="pf-ct"><span>'+o.title+'</span>'+(o.copy===false?'':'<button class="btn ghost sm" data-copy title="Copier">'+ICON('copy','sm')+'Copier</button>')+'</div>':'')+'<pre>'+code(src)+'</pre></div>'}
function bindCopy(root){on(root,'[data-copy]',function(b){var p=b.closest('.pf-code').querySelector('pre');clip(p.textContent,'Code copié')})}
function quiet(){P.pf.q=true;try{P.rerender()}finally{P.pf.q=false}}
P.pf={quiet:quiet,sum:sum,norm:norm,clip:clip,on:on,lg:lg,go:go,sheet:sheet,code:code,pre:pre,bindCopy:bindCopy};

P.css(`
.pf-lg{width:40px;height:40px;border-radius:11px;display:inline-grid;place-items:center;flex:none;font:700 13px var(--f-display);letter-spacing:-.02em;color:var(--c);background:color-mix(in srgb,var(--c) 13%,var(--surface));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--c) 22%,transparent)}
.pf-lg.sm{width:30px;height:30px;border-radius:9px;font-size:11px}
.pf-lg.lg{width:52px;height:52px;border-radius:14px;font-size:16px}
.pf-lg svg.i{width:19px;height:19px}
.pf-code{border-radius:var(--r-md);background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);min-width:0;overflow:hidden}
.pf-code pre{margin:0;padding:12px 14px;font:400 12px/1.6 var(--f-mono);color:var(--ink-2);overflow-x:auto;white-space:pre;tab-size:2}
.pf-code .pf-ct{display:flex;align-items:center;justify-content:space-between;gap:8px;padding:6px 6px 6px 14px;border-bottom:1px solid var(--line);font:500 11.5px var(--f-mono);color:var(--mut)}
.pf-code .k{color:var(--acc)}.pf-code .s{color:var(--ok)}.pf-code .n{color:var(--warn)}.pf-code .b{color:var(--c5);font-weight:500}.pf-code .c{color:var(--mut-2)}
.pf-mono{font:500 12px var(--f-mono);letter-spacing:-.01em}
.pf-kv{display:grid;grid-template-columns:auto minmax(0,1fr);gap:7px 16px;font-size:13px;margin:0}
.pf-kv dt{color:var(--mut)}.pf-kv dd{margin:0;font-weight:500;min-width:0}
.pf-sec{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap;margin:6px 0 -2px}
.pf-sec h2{font-size:19px;letter-spacing:-.025em}
.pf-sec p{color:var(--mut);font-size:13px;margin-top:3px;max-width:68ch}
.pf-row{display:flex;align-items:center;gap:12px;padding:12px 16px;min-width:0;position:relative}
.pf-row+.pf-row{border-top:1px solid var(--line)}
.pf-row .t{font-weight:600;font-size:13.5px}.pf-row .d{font-size:12.5px;color:var(--mut)}
.pf-tap{min-height:44px}
.pf-step{width:26px;height:26px;border-radius:50%;display:inline-grid;place-items:center;font:700 12px var(--f-text);flex:none;background:var(--bg-2);color:var(--mut);transition:background var(--t-2),color var(--t-2)}
.pf-step.on{background:var(--acc);color:var(--acc-ink)}.pf-step.ok{background:var(--ok-pale);color:var(--ok)}
.pf-step svg.i{width:14px;height:14px;stroke-width:2.4}
@container main (max-width:520px){.pf-sec h2{font-size:17px}}

/* ---------- Assistant ---------- */
.view:has(>.page>.pfa-root){overflow:hidden;padding-bottom:0;display:flex;flex-direction:column}
.view:has(>.page>.pfa-root)>.page{flex:1;min-height:0;width:100%;display:flex;flex-direction:column}
.pfa-root{flex:1;min-height:0;display:flex;flex-direction:column}
.pfa-head{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;margin-bottom:16px}
.pfa-head h1{font-size:30px;letter-spacing:-.035em;line-height:1.05}
.pfa-head .sub{color:var(--mut);font-size:14px;margin-top:6px}
.pfa-main{flex:1;min-height:0;display:grid;grid-template-columns:272px minmax(0,1fr);gap:14px;padding-bottom:22px}
.pfa-hist{display:flex;flex-direction:column;min-height:0;overflow:hidden}
.pfa-hl{flex:1;overflow-y:auto;padding:0 8px 10px;scrollbar-width:thin}
.pfa-hg{font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--mut-2);padding:12px 8px 4px}
.pfa-hi{display:block;width:100%;text-align:left;padding:8px 10px;border-radius:var(--r-sm);transition:background var(--t-1)}
.pfa-hi:hover{background:var(--surface-2)}
.pfa-hi[aria-current="true"]{background:var(--acc-pale)}
.pfa-hi b{display:block;font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pfa-hi span{display:block;font-size:11.5px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pfa-chat{display:flex;flex-direction:column;min-height:0;overflow:hidden}
.pfa-bar{display:flex;align-items:center;gap:10px;padding:10px 12px 10px 18px;border-bottom:1px solid var(--line);min-width:0}
.pfa-bar b{font-size:14px;letter-spacing:-.01em}
.pfa-thread{flex:1;min-height:0;overflow-y:auto;padding:22px 24px 10px;position:relative}
.pfa-col{max-width:780px;margin:0 auto;display:flex;flex-direction:column;gap:20px}
.pfa-u{align-self:flex-end;max-width:82%;background:var(--acc);color:var(--acc-ink);padding:10px 14px;border-radius:16px 16px 5px 16px;font-size:14px;line-height:1.45;animation:rise var(--t-4) var(--e-out) both}
.pfa-a{display:grid;grid-template-columns:30px minmax(0,1fr);gap:12px;align-items:start;animation:rise var(--t-4) var(--e-out) both}
.pfa-orb{width:30px;height:30px;border-radius:10px;background:var(--navy);display:grid;place-items:center;flex:none}
.pfa-txt{font-size:14.5px;line-height:1.55;color:var(--ink);padding-top:4px}
.pfa-txt b{font-weight:650}
.pfa-card{margin-top:12px;padding:14px;display:flex;flex-direction:column;gap:12px;overflow:hidden}
.pfa-acts{margin-top:12px}
.pfa-src{display:flex;align-items:center;gap:7px;margin-top:10px;font-size:11.5px;color:var(--mut);flex-wrap:wrap}
.pfa-src code{font:500 11px var(--f-mono);padding:1px 6px;border-radius:5px;background:var(--bg-2);color:var(--ink-2)}
.pfa-tb{width:100%;border-collapse:collapse;font-size:13px}
.pfa-tb th{text-align:left;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--mut);padding:0 8px 7px 0;white-space:nowrap}
.pfa-tb td{padding:7px 8px 7px 0;border-top:1px solid var(--line);vertical-align:middle}
.pfa-tb td:last-child,.pfa-tb th:last-child{padding-right:0}
.pfa-tb .n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
.pfa-tb .who{display:flex;align-items:center;gap:8px;min-width:0;font-weight:600}
.pfa-tb .who small{display:block;font-weight:500;color:var(--mut);font-size:11.5px}
.pfa-stat{display:flex;gap:18px;flex-wrap:wrap}
.pfa-stat div{min-width:0}.pfa-stat b{display:block;font:700 22px/1.1 var(--f-display);letter-spacing:-.03em;font-variant-numeric:tabular-nums}.pfa-stat span{font-size:12px;color:var(--mut)}
.pfa-prev{border-radius:var(--r-md);box-shadow:inset 0 0 0 1.5px var(--acc-line);background:var(--surface);overflow:hidden}
.pfa-ph{display:flex;align-items:center;gap:8px;padding:9px 12px;background:var(--acc-pale);font-size:12.5px;font-weight:600;color:var(--ink)}
.pfa-ph svg.i{color:var(--acc)}
.pfa-ph .chip{margin-left:auto;background:var(--surface)}
.pfa-pb{padding:12px 14px;display:flex;flex-direction:column;gap:10px}
.pfa-pb h4{font-size:15px;letter-spacing:-.015em}
.pfa-quote{padding:10px 12px;border-radius:var(--r-sm);background:var(--surface-2);font-size:13px;line-height:1.5;color:var(--ink-2);box-shadow:inset 0 0 0 1px var(--line)}
.pfa-pf{display:flex;gap:8px;padding:10px 14px 12px;flex-wrap:wrap;align-items:center}
.pfa-think{display:flex;align-items:center;gap:10px;color:var(--mut);font-size:13px;padding-top:5px}
.pfa-think .typing{padding:0}
.pfa-wel{max-width:720px;margin:0 auto;padding:18px 0 8px;display:flex;flex-direction:column;gap:18px}
.pfa-wel h2{font-size:26px;letter-spacing:-.035em;line-height:1.12}
.pfa-sg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
.pfa-sg button{display:flex;gap:10px;align-items:flex-start;text-align:left;padding:12px 14px;border-radius:var(--r-md);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);font-size:13.5px;font-weight:500;line-height:1.4;min-height:56px;transition:box-shadow var(--t-2),transform var(--t-2) var(--e-out)}
.pfa-sg button:hover{box-shadow:inset 0 0 0 1px var(--acc-line),var(--shadow-2);transform:translateY(-1px)}
.pfa-sg button svg.i{color:var(--acc);margin-top:1px}
.pfa-foot{padding:8px 16px 12px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:8px}
.pfa-fu{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;max-width:780px;width:100%;margin:0 auto}
.pfa-fu button{flex:none;font-size:12.5px;font-weight:500;padding:6px 11px;border-radius:99px;background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line);white-space:nowrap;color:var(--ink-2)}
.pfa-fu button:hover{color:var(--ink);box-shadow:inset 0 0 0 1px var(--line-2)}
.pfa-comp{display:flex;align-items:center;gap:6px;padding:5px 5px 5px 6px;border-radius:16px;box-shadow:inset 0 0 0 1px var(--line-2),var(--shadow-1);background:var(--surface);max-width:780px;width:100%;margin:0 auto;transition:box-shadow var(--t-2)}
.pfa-comp:focus-within{box-shadow:inset 0 0 0 1.5px var(--acc),var(--ring)}
.pfa-comp input{flex:1;border:0;outline:0;background:none;min-width:0;height:44px;font-size:15px;padding:0 6px}
.pfa-comp .btn.icon{width:44px;height:44px;border-radius:12px}
.pfa-comp.rec input,.pfa-comp.rec [data-attach]{display:none}
.pfa-comp:not(.rec) .pfa-live{display:none}
.pfa-live{flex:1;min-width:0;display:flex;align-items:center;gap:12px;height:44px;padding-left:8px}
.pfa-wave{display:flex;align-items:center;gap:3px;height:28px;flex:none}
.pfa-wave i{width:3px;border-radius:2px;background:var(--acc);height:6px;animation:pfaW 900ms var(--e-in-out) infinite;animation-delay:calc(var(--i)*-87ms)}
@keyframes pfaW{0%,100%{height:5px}50%{height:calc(8px + var(--h)*1px)}}
.pfa-live span{font-size:14.5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;direction:rtl;text-align:left}
.pfa-live span bdi{direction:ltr}
.pfa-comp.rec [data-mic]{background:var(--bad);color:var(--acc-ink);box-shadow:none}
.pfa-legal{font-size:11.5px;color:var(--mut);text-align:center}
.pfa-hbtn{display:none}
.app.mobile .pfa-head h1{display:none}
.app.mobile .pfa-root .btn.icon.sm,.app.mobile .pfa-head .btn.icon.sm,.app.mobile .pfc-demo .btn.icon.sm,.app.mobile .btn.icon.sm[data-cap]{width:44px;height:44px}
.app.mobile .pfc-df .sc button{min-width:36px;min-height:36px}
.pfa-auto{display:flex;flex-direction:column;gap:12px;padding:16px}
.pfa-auto .hd{display:flex;gap:12px;align-items:flex-start}
.pfa-jr{display:grid;grid-template-columns:58px 30px minmax(0,1fr) auto;gap:12px;align-items:center;padding:11px 16px}
.pfa-jr+.pfa-jr{border-top:1px solid var(--line)}
.pfa-jr .tm{font-size:12.5px;color:var(--mut);font-variant-numeric:tabular-nums}
.pfa-jr .r{display:flex;align-items:center;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.pfa-jd{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);padding:14px 16px 6px}
@container main (max-width:900px){.pfa-main{grid-template-columns:minmax(0,1fr)}.pfa-hist{display:none}.pfa-hbtn{display:inline-flex}}
@container main (max-width:760px){
 .pfa-head{margin-bottom:10px}.pfa-head .seg{width:100%}.pfa-head .seg button{flex:1;justify-content:center;height:36px}
 .pfa-main{padding-bottom:10px}.pfa-thread{padding:14px 14px 8px}.pfa-foot{padding:8px 10px 10px}
 .pfa-sg{grid-template-columns:minmax(0,1fr)}.pfa-wel h2{font-size:22px}.pfa-legal{display:none}
 .pfa-a{grid-template-columns:minmax(0,1fr)}.pfa-a>.pfa-orb{display:none}
 .pfa-jr{grid-template-columns:30px minmax(0,1fr);row-gap:6px}.pfa-jr .tm{display:none}.pfa-jr .r{grid-column:2;justify-content:flex-start}
 .pfa-u{max-width:90%}
}
`);

/* =====================================================================
   Données propres au lot
   ===================================================================== */
D.aiAutomations=D.aiAutomations||[
 {id:'au1',name:'Point sur les impayés',when:'Chaque lundi à 8 h',what:'Je liste les factures en retard par ancienneté et je prépare les relances. Vous validez l’envoi.',to:'Claire Morel',ch:'E-mail',last:'lun. 16 nov. à 8 h 00',next:'lun. 23 nov.',on:true,ic:'invoice',q:'Qui n’a pas payé ce mois-ci ?'},
 {id:'au2',name:'Résumé du matin',when:'Tous les jours à 7 h',what:'Chevaux à surveiller, reprises du jour, soins prévus et argent à encaisser, en une notification.',to:'Claire Morel',ch:'Notification',last:'aujourd’hui à 7 h 00',next:'demain',on:true,ic:'today',q:'Fais-moi le point du matin'},
 {id:'au3',name:'Échéances de soins',when:'Chaque vendredi à 17 h',what:'Vaccins, vermifuges et ferrures des trois semaines à venir, envoyés à l’équipe des soigneurs.',to:'Mamadou Diallo, Lucie Petit',ch:'Notification',last:'ven. 13 nov. à 17 h 00',next:'ven. 20 nov.',on:true,ic:'care',q:'Quels chevaux doivent être vaccinés ou vermifugés dans les trois prochaines semaines ?'},
 {id:'au4',name:'Stocks sous le seuil',when:'Dès qu’un seuil est franchi',what:'Je prépare la commande chez le fournisseur habituel. Rien ne part sans votre accord.',to:'Claire Morel',ch:'Notification',last:'aujourd’hui à 6 h 12',next:'en continu',on:true,ic:'stock',q:'Où en sont les stocks ?'},
 {id:'au5',name:'Licences à renouveler',when:'Le 1er de chaque mois',what:'Adhérents sans licence FFE pour le millésime en cours, avec le message de rappel prêt à partir.',to:'Nadia Benali',ch:'E-mail',last:'dim. 1er nov. à 9 h 00',next:'mar. 1er déc.',on:true,ic:'members',q:'Quels adhérents n’ont pas encore leur licence 2027 ?'},
 {id:'au6',name:'Bilan du mois pour le cabinet comptable',when:'Le dernier jour du mois',what:'Export des écritures au format FEC et synthèse du chiffre d’affaires par activité.',to:'Cabinet Fidélis (comptable)',ch:'E-mail',last:'sam. 31 oct. à 18 h 00',next:'lun. 30 nov.',on:false,ic:'accounting',q:'Quel est mon chiffre d’affaires par activité ?'}];
D.aiLog=D.aiLog||[
 {d:'Aujourd’hui',t:'9 h 32',src:'Assistant',who:'s01',tool:'impayes_lister',what:'A lu les factures en retard pour répondre à une question',kind:'L',st:'read'},
 {d:'Aujourd’hui',t:'9 h 14',src:'Claude (MCP)',who:'s01',tool:'cours_annuler_ou_reporter',what:'A reporté la reprise Galop 1-2 de 17 h à samedi 10 h',kind:'E',st:'ok',undo:true},
 {d:'Aujourd’hui',t:'9 h 14',src:'Claude (MCP)',who:'s01',tool:'message_envoyer',what:'A envoyé le message « Reprise reportée » à 9 familles',kind:'E',st:'ok'},
 {d:'Aujourd’hui',t:'8 h 15',src:'Assistant',who:'s01',tool:'sante_echeances',what:'A lu les échéances de soins des trois semaines à venir',kind:'L',st:'read'},
 {d:'Aujourd’hui',t:'7 h 00',src:'Automatisation',who:'s01',tool:'ecurie_tableau_de_bord',what:'A préparé le résumé du matin',kind:'L',st:'read'},
 {d:'Aujourd’hui',t:'6 h 12',src:'Automatisation',who:'s01',tool:'taches_lister_ou_creer',what:'A préparé une commande de 60 sacs de copeaux chez Litière Pro',kind:'E',st:'wait'},
 {d:'Hier',t:'18 h 47',src:'Assistant',who:'s09',tool:'cours_inscrire',what:'A inscrit Zoé Laurent au rattrapage de samedi 15 h',kind:'E',st:'ok',undo:true},
 {d:'Hier',t:'16 h 20',src:'ChatGPT (MCP)',who:'s09',tool:'adherent_documents_manquants',what:'A lu la liste des pièces manquantes des adhérents',kind:'L',st:'read'},
 {d:'Hier',t:'11 h 05',src:'Assistant',who:'s01',tool:'facture_emettre',what:'Émission de 3 factures de coaching refusée par Claire à l’aperçu',kind:'E',st:'cancel'},
 {d:'Hier',t:'10 h 58',src:'Assistant',who:'s01',tool:'facture_creer_brouillon',what:'A préparé 3 factures de coaching en brouillon',kind:'E',st:'ok',undo:true},
 {d:'Lundi 16 novembre',t:'8 h 02',src:'Automatisation',who:'s01',tool:'relance_preparer',what:'A envoyé 6 relances d’impayés après validation',kind:'E',st:'ok'},
 {d:'Lundi 16 novembre',t:'8 h 00',src:'Automatisation',who:'s01',tool:'impayes_lister',what:'A préparé le point hebdomadaire sur les impayés',kind:'L',st:'read'},
 {d:'Lundi 16 novembre',t:'7 h 41',src:'Assistant',who:'s04',tool:'cheval_soin_enregistrer',what:'A ajouté un soin au registre de Tornado (boiterie, glace 20 min)',kind:'E',st:'ok'}];
function logAI(what,tool,kind,st,undo){D.aiLog.unshift({d:'Aujourd’hui',t:'9 h 41',src:'Assistant',who:'s01',tool:tool,what:what,kind:kind||'E',st:st||'ok',undo:undo,fresh:true})}
P.pf.logAI=logAI;

/* =====================================================================
   Cerveau de l’assistant (vue gérant) : chiffres calculés depuis DATA
   ===================================================================== */
function tb(head,rows){return '<table class="pfa-tb"><thead><tr>'+head.map(function(h){return '<th'+(h[1]?' class="n"':'')+'>'+h[0]+'</th>'}).join('')+'</tr></thead><tbody>'+rows.map(function(r){return '<tr>'+r.map(function(c,i){return '<td'+(head[i]&&head[i][1]?' class="n"':'')+'>'+c+'</td>'}).join('')+'</tr>'}).join('')+'</tbody></table>'}
function who(id,sub){var p=D.person(id);return '<span class="who">'+U.av(id,'sm')+'<span>'+(p?p.first+' '+p.last:'')+(sub?'<small>'+sub+'</small>':'')+'</span></span>'}
function hwho(h,sub){return '<span class="who">'+U.hav(h,'sm')+'<span>'+h.name+(sub?'<small>'+sub+'</small>':'')+'</span></span>'}
function stat(items){return '<div class="pfa-stat">'+items.map(function(x){return '<div><b>'+x[0]+'</b><span>'+x[1]+'</span></div>'}).join('')+'</div>'}
function late(){return D.invoices.filter(function(i){return i.status==='en retard'})}
function lateBy(){var m={};late().forEach(function(i){var o=m[i.member]=m[i.member]||{id:i.member,amt:0,n:0,old:0};o.amt+=i.amount;o.n++;o.old=Math.max(o.old,-F.days(i.due))});return Object.keys(m).map(function(k){return m[k]}).sort(function(a,b){return b.amt-a.amt})}
function healthDue(days){var o=[];D.horses.forEach(function(h){[['Vermifuge',h.worm,120],['Maréchal',h.farrier,49],['Vaccin',h.vacc,365]].forEach(function(k){var n=F.days(k[1])+k[2];if(n<=days)o.push({h:h,kind:k[0],n:n})})});
  D.care.forEach(function(c){var n=F.days(c.date);if(c.kind==='Vaccin'&&n>=0&&n<=days)o.push({h:D.horse(c.horse),kind:'Vaccin',n:n,note:c.note})});return o.sort(function(a,b){return a.n-b.n})}
function inDays(n){return n<0?'<span class="badc b">en retard de '+(-n)+' j</span>':n===0?'<span class="warnc b">aujourd’hui</span>':'dans '+n+' j'}
function findHorse(t){t=norm(t);return D.horses.find(function(h){var w=norm(h.name).split(' ')[0];return w.length>3&&t.indexOf(w)>=0})}
function fillOf(l){return l.riders.length/l.cap}
var DOW=['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'];
var INT=[];function I(id,dom,ic,re,q,fn){INT.push({id:id,dom:dom,ic:ic,re:re,q:q,fn:fn})}

I('auto','Plateforme','repeat',/chaque (lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche|jour|matin|semaine|mois)|tous les (lundis|jours|matins|mois|vendredis)|automatis/i,'Chaque lundi, envoie-moi le point sur les impayés',function(t){
  var day=(t.match(/lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche/i)||['lundi'])[0].toLowerCase(),when=/jour|matin/i.test(t)&&!/lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche/i.test(t)?'Tous les jours à 8 h':/mois/i.test(t)?'Le 1er de chaque mois':'Chaque '+day+' à 8 h';
  var k=/vaccin|soin|vermifug/i.test(t)?['les échéances de soins','Échéances de soins','care','Quels chevaux doivent être vaccinés ?']:/stock|copeaux|foin/i.test(t)?['l’état des stocks','État des stocks','stock','Où en sont les stocks ?']:/licen/i.test(t)?['les licences à renouveler','Licences à renouveler','members','Quels adhérents n’ont pas leur licence ?']:/remplissage|reprise/i.test(t)?['le taux de remplissage des reprises','Remplissage des reprises','planning','Quel est mon taux de remplissage ?']:['le point sur les impayés','Point sur les impayés','invoice','Qui n’a pas payé ce mois-ci ?'];
  return {text:'Je peux m’en charger sans que vous ayez à y penser. Voici l’automatisation que je vous propose de créer.',tool:'automatisation.creer',src:['Automatisations'],
   actions:[{label:'Créer l’automatisation',icon:'repeat',undo:true,preview:{title:k[1]+', '+when.toLowerCase(),rows:[['Quand',when],['Quoi','Je vous envoie '+k[0]],['À qui','Claire Morel, par e-mail et notification'],['Écritures','Aucune, cette automatisation ne fait que lire']],ok:'Créer l’automatisation'},
     run:function(){D.aiAutomations.unshift({id:'au'+Date.now(),name:k[1],when:when,what:'Je vous envoie '+k[0]+'. Créée depuis une conversation.',to:'Claire Morel',ch:'E-mail',last:'jamais',next:when.toLowerCase(),on:true,ic:k[2],q:k[3],fresh:true});logAI('A créé l’automatisation « '+k[1]+' »','automatisation.creer','E','ok',true);P.toast('Automatisation créée : '+when.toLowerCase());return 'Automatisation créée'}},
    {label:'Voir mes automatisations',run:function(){AS.tab='auto';P.go('assistant');return 'Ouvert'}}]}});

I('matin','Écurie','today',/point du matin|r[ée]sum[ée]|quoi de neuf|aujourd.hui|ma journ[ée]e/i,'Fais-moi le point du matin',function(){
  var td=D.lessons.filter(function(l){return l.dow===2}),al=D.horses.filter(function(h){return h.status!=='ok'}),l=late();
  return {text:'Voici ce qui demande votre attention ce mardi. <b>'+al.filter(function(h){return h.status==='bad'}).length+' chevaux sont à surveiller de près</b>, le reste de la journée est sous contrôle.',src:['Chevaux','Planning','Facturation','Stocks'],tool:'ecurie_tableau_de_bord',
   card:stat([[td.length,'reprises aujourd’hui'],[sum(td,function(x){return x.riders.length}),'cavaliers attendus'],[al.length,'chevaux avec une alerte'],[F.eur(sum(l,function(i){return i.amount})),'d’impayés']])+
     tb([['Cheval'],['Alerte']],al.slice(0,5).map(function(h){return [hwho(h,h.box),'<span class="'+(h.status==='bad'?'badc b':'')+'">'+h.alerts[0]+'</span>']})),
   actions:[{label:'Ouvrir les chevaux à surveiller',icon:'horse',run:function(){go('chevaux',{},'Chevaux');return 'Ouvert'}},{label:'Recevoir ce point chaque matin',icon:'repeat',run:function(){AS.tab='auto';P.go('assistant');return 'Ouvert'}}]}});

I('cheval','Écurie','horse',/./,null,function(t){var h=findHorse(t);if(!h)return null;
  var o=h.owner?D.member(h.owner):null,care=D.care.filter(function(c){return c.horse===h.id&&F.days(c.date)>=0})[0],pct=Math.round(h.work/h.workMax*100);
  if(/co[uû]t|rapporte|rentab/i.test(t)){var feed=Math.round(h.ration.hay*30*.19+h.ration.grain*30*.72),far=Math.round(85*30/49),vet=Math.round(h.costMonth-feed-far-70);
    return {text:'<b>'+h.name+'</b> vous coûte environ <b>'+F.eur(h.costMonth)+' par mois</b> sur les trois derniers mois'+(h.kind==='club'?', pour '+h.work+' h de reprises par semaine.':', refacturés au propriétaire dans la pension à 520 €.'),src:['Alimentation','Soins','Comptabilité'],tool:'cheval_fiche',
     card:C.donut([{v:feed,c:'var(--acc)'},{v:far,c:'var(--c3)'},{v:Math.max(20,vet),c:'var(--c4)'},{v:70,c:'var(--c5)'}],{size:132,center:F.eur(h.costMonth),sub:'par mois'}).replace('<svg','<svg style="align-self:center"')+tb([['Poste'],['Par mois',1]],[['Foin et granulés',F.eur(feed)],['Maréchal',F.eur(far)],['Vétérinaire et soins',F.eur(Math.max(20,vet))],['Litière',F.eur(70)]]),
     actions:[{label:'Ouvrir la fiche de '+h.name.split(' ')[0],icon:'horse',run:function(){go('cheval',{id:h.id},'Fiche cheval');return 'Ouvert'}}]}}
  return {text:'<b>'+h.name+'</b>, '+h.breed.toLowerCase()+' de '+h.age+' ans, box '+h.box+'. '+(h.alerts.length?'<b>À noter : '+h.alerts[0].toLowerCase()+'.</b>':'Aucune alerte en cours.')+' Il travaille '+h.work+' h par semaine pour un plafond de '+h.workMax+' h'+(pct>85?', c’est beaucoup : je conseille un jour de repos.':'.'),src:['Chevaux','Soins','Planning'],tool:'cheval_fiche',
   card:'<div class="hrow" style="--g:12px">'+U.hav(h,'lg')+'<div class="grow"><div class="b">'+h.name+'</div><div class="s mut">'+h.sex+' · '+h.coat+' · '+h.height+' cm'+(o?' · propriétaire : '+o.first+' '+o.last:' · cheval de club')+'</div></div>'+U.status(h.status==='ok'?'ok':h.status)+'</div>'+
     '<div><div class="hrow sp xs mut" style="margin-bottom:6px"><span>Charge de travail cette semaine</span><b class="num" style="color:var(--ink)">'+h.work+' h / '+h.workMax+' h</b></div>'+U.bar(pct,pct>85?'var(--warn)':'var(--acc)')+'</div>'+
     '<dl class="pf-kv"><dt>Ration</dt><dd>'+String(h.ration.hay).replace('.',',')+' kg de foin, '+String(h.ration.grain).replace('.',',')+' kg de granulés</dd><dt>Prochain soin</dt><dd>'+(care?care.kind+' '+F.rel(care.date)+', '+care.who:'Aucun soin planifié')+'</dd><dt>Dernier maréchal</dt><dd>'+F.date(h.farrier)+'</dd></dl>',
   actions:[{label:'Ouvrir la fiche',icon:'horse',run:function(){go('cheval',{id:h.id},'Fiche cheval');return 'Ouvert'}},{label:'Planifier un jour de repos',icon:'calendar_add',undo:true,preview:{title:'Repos de '+h.name+' demain mercredi',rows:[['Cheval',h.name+' ('+h.box+')'],['Planning','Retiré des reprises de mercredi, remplaçant proposé par le montoir'],['Prévenus','Les moniteurs du jour']]},run:function(){logAI('A planifié un jour de repos pour '+h.name,'cours_annuler_ou_reporter','E','ok',true);P.toast(h.name+' est au repos demain');return 'Repos planifié'}}]}});

I('impayes','Argent','invoice',/pay|impay|relan|retard de paiement|doit de l.argent|dette/i,'Qui n’a pas payé ce mois-ci, et depuis quand ?',function(){
  var by=lateBy(),tot=sum(by,function(x){return x.amt}),n=late().length,b=[0,0,0,0];late().forEach(function(i){var d=-F.days(i.due);b[d<=30?0:d<=45?1:d<=60?2:3]+=i.amount});
  return {text:'<b>'+by.length+' familles vous doivent '+F.eur(tot)+'</b>, sur '+n+' factures en retard. La plus ancienne a '+Math.max.apply(null,by.map(function(x){return x.old}))+' jours. Voici le détail, du plus gros montant au plus petit.',src:['Facturation','Adhérents'],tool:'impayes_lister',
   card:tb([['Payeur'],['Factures',1],['Retard',1],['Dû',1]],by.slice(0,6).map(function(x){return [who(x.id),x.n,x.old+' j','<b>'+F.eur(x.amt)+'</b>']}))+(by.length>6?'<div class="xs mut">et '+(by.length-6)+' autres familles pour '+F.eur(sum(by.slice(6),function(x){return x.amt}))+'</div>':'')+
     '<div><div class="xs mut" style="margin-bottom:4px">Montant dû selon l’ancienneté du retard</div>'+C.bars(b,['Moins de 30 j','31 à 45 j','46 à 60 j','Plus de 60 j'],{h:130,fmt:function(v){return Math.round(v)+' €'}})+'</div>',
   actions:[{label:'Préparer les '+by.length+' relances',icon:'send',undo:true,preview:{title:'Relancer '+by.length+' familles pour '+F.eur(tot),rows:[['Destinataires',by.length+' payeurs, '+n+' factures'],['Canal','E-mail, puis SMS si le retard dépasse 45 jours'],['Lien de paiement','Carte ou prélèvement SEPA, inclus dans le message']],
       body:'<div class="pfa-quote">Bonjour {prénom}, sauf erreur de notre part, la facture {numéro} de {montant} est arrivée à échéance le {date}. Vous pouvez la régler en ligne en deux minutes avec ce lien. Merci et à très vite aux Tilleuls. Claire</div>',ok:'Envoyer les '+by.length+' relances'},
     run:function(){logAI('A envoyé '+by.length+' relances d’impayés pour '+F.eur(tot),'relance_preparer','E','ok',true);P.toast(by.length+' relances envoyées par e-mail et SMS');return by.length+' relances envoyées'}},
    {label:'Ouvrir la facturation',icon:'invoice',run:function(){go('facturation',{},'Facturation');return 'Ouvert'}},
    {label:'Recevoir ce point chaque lundi',icon:'repeat',run:function(){AS.tab='auto';P.go('assistant');return 'Ouvert'}}]}});

I('sante','Écurie','syringe',/vaccin|vermifug|mar[ée]chal|ferrure|soins? (à|a) venir|[ée]ch[ée]ances? de soin/i,'Quels chevaux doivent être vaccinés ou vermifugés dans les trois prochaines semaines ?',function(){
  var l=healthDue(21),ov=l.filter(function(x){return x.n<0}).length,k={};l.forEach(function(x){k[x.kind]=(k[x.kind]||0)+1});
  return {text:'<b>'+l.length+' soins sont à prévoir d’ici trois semaines</b>'+(ov?', dont <b>'+ov+' déjà en retard</b>':'')+'. Je les ai classés par urgence.',src:['Soins','Registre d’élevage'],tool:'sante_echeances',
   card:stat(Object.keys(k).map(function(x){return [k[x],x.toLowerCase()+(k[x]>1&&x!=='Maréchal'?'s':'')]}))+tb([['Cheval'],['Soin'],['Échéance',1]],l.slice(0,7).map(function(x){return [hwho(x.h,x.h.box),x.kind,inDays(x.n)]}))+(l.length>7?'<div class="xs mut">et '+(l.length-7)+' autres dans la liste complète</div>':''),
   actions:[{label:'Planifier une tournée du maréchal',icon:'calendar_add',undo:true,preview:{title:'Tournée de Benoît Gautier, jeudi 19 novembre à 9 h',rows:[['Chevaux',(k['Maréchal']||0)+' chevaux à ferrer ou parer'],['Durée estimée',Math.round((k['Maréchal']||1)*.75)+' h'],['Prévenus','Benoît Gautier par SMS, les propriétaires concernés par notification'],['Registre','Chaque ferrure sera inscrite au registre d’élevage']]},
     run:function(){logAI('A planifié une tournée du maréchal pour '+(k['Maréchal']||0)+' chevaux','cheval_soin_enregistrer','E','ok',true);P.toast('Tournée du maréchal planifiée jeudi à 9 h');return 'Tournée planifiée jeudi'}},
    {label:'Ouvrir les soins',icon:'care',run:function(){go('soins',{},'Soins');return 'Ouvert'}}]}});

I('travail','Écurie','gauge',/travaill\w* trop|charge de travail|surmen|fatigu|heures? de travail|trop mont/i,'Quels chevaux travaillent trop cette semaine ?',function(){
  var l=D.horses.filter(function(h){return h.kind==='club'}).sort(function(a,b){return b.work/b.workMax-a.work/a.workMax}),hot=l.filter(function(h){return h.work/h.workMax>.85});
  return {text:'<b>'+hot.length+' chevaux de club dépassent 85 % de leur plafond hebdomadaire.</b> '+(hot[0]?hot[0].name+' est le plus sollicité avec '+hot[0].work+' h sur '+hot[0].workMax+' h.':'')+' À l’inverse, '+l[l.length-1].name+' et '+l[l.length-2].name+' ont de la marge.',src:['Planning','Chevaux'],tool:'cheval_charge_travail',
   card:'<div class="xs mut">Heures de travail cette semaine, les huit chevaux les plus sollicités</div>'+C.bars(l.slice(0,8).map(function(h){return h.work}),l.slice(0,8).map(function(h){return h.name.split(' ')[0].slice(0,8)}),{h:150,fmt:function(v){return Math.round(v)+' h'}})+
     tb([['Cheval'],['Semaine',1],['Plafond',1]],l.slice(0,4).map(function(h){return [hwho(h,h.level),'<b>'+h.work+' h</b>',h.workMax+' h']})),
   actions:[{label:'Rééquilibrer le montoir',icon:'swap',undo:true,preview:{title:'Rééquilibrer la cavalerie jusqu’à dimanche',rows:[['Allégés',hot.slice(0,3).map(function(h){return h.name.split(' ')[0]}).join(', ')||'Aucun'],['Sollicités à la place',l.slice(-3).map(function(h){return h.name.split(' ')[0]}).join(', ')],['Reprises modifiées','6 attributions sur 4 reprises, niveaux respectés'],['Prévenus','Les moniteurs concernés']]},
     run:function(){logAI('A rééquilibré le montoir sur 4 reprises','cours_presences_saisir','E','ok',true);P.toast('Montoir rééquilibré sur 4 reprises');return 'Montoir rééquilibré'}}]}});

I('places','Club','planning',/place|complet|liste d.attente|reste.*reprise|dispo/i,'Où reste-t-il des places dans les reprises de mercredi ?',function(t){
  if(/box|pension/i.test(t))return null;
  var d=DOW.findIndex(function(x){return norm(t).indexOf(x)>=0});if(d<0)d=3;var l=D.lessons.filter(function(x){return x.dow===d}),free=sum(l,function(x){return Math.max(0,x.cap-x.riders.length)}),w=sum(l,function(x){return x.wait});
  return {text:'Le '+DOW[d]+', il reste <b>'+free+' places sur '+sum(l,function(x){return x.cap})+'</b> réparties sur '+l.length+' reprises'+(w?', et '+w+' cavaliers attendent une place dans les reprises complètes.':'.'),src:['Planning'],tool:'cours_places_disponibles',
   card:tb([['Reprise'],['Moniteur'],['Inscrits',1],['Libres',1]],l.map(function(x){var f=x.cap-x.riders.length;return ['<b>'+x.start+'</b> · '+x.title,D.staffer(x.coach).first,x.riders.length+'/'+x.cap,f>0?'<b class="okc">'+f+'</b>':'<span class="chip warn">Complet</span>']})),
   actions:[{label:'Proposer les places aux listes d’attente',icon:'waitlist',undo:true,preview:{title:'Prévenir '+Math.max(w,3)+' cavaliers en liste d’attente',rows:[['Message','Une place s’est libérée, réservez-la en un geste'],['Règle','Premier arrivé, premier servi, la place est tenue 2 h'],['Canal','Notification, puis SMS']]},run:function(){logAI('A proposé '+free+' places aux listes d’attente','message_envoyer','E','ok');P.toast('Places proposées aux listes d’attente');return 'Places proposées'}},
    {label:'Ouvrir le planning',icon:'planning',run:function(){go('planning',{},'Planning');return 'Ouvert'}}]}});

I('message','Club','chat',/annul|gel|pr[ée]vien|message aux|[ée]cris aux|report/i,'Préviens les cavaliers de 17 h : reprise annulée pour gel, report samedi 10 h',function(t){
  var hh=(t.match(/(\d{1,2}) ?h/)||[])[1]||'17',l=D.lessons.find(function(x){return x.dow===2&&x.start.indexOf(hh)===0})||D.lessons.filter(function(x){return x.dow===2})[1],min=l.riders.filter(function(r){return (D.member(r)||{}).minor}).length;
  return {text:'J’ai trouvé la reprise <b>'+l.title+' de '+l.start.replace(':',' h ')+'</b> avec '+D.staffer(l.coach).first+' : '+l.riders.length+' cavaliers, dont '+min+' mineurs dont je préviens les parents. Voici le message que j’enverrais.',src:['Planning','Adhérents'],tool:'message_preparer',
   card:'<div class="hrow sp"><span class="s mut">Destinataires</span>'+U.avs(l.riders,6)+'</div><div class="pfa-quote">Bonjour, la reprise '+l.title+' de ce mardi '+l.start.replace(':',' h ')+' est annulée : la carrière est gelée. Nous vous proposons un report samedi à 10 h au Grand manège. Répondez OUI pour confirmer votre place. À samedi, '+D.staffer(l.coach).first+' et Claire.</div>',
   actions:[{label:'Annuler la reprise et prévenir',icon:'send',undo:true,preview:{title:'Annuler « '+l.title+' » et envoyer le message',rows:[['Reprise',l.title+', mardi '+l.start.replace(':',' h ')],['Destinataires',l.riders.length+' familles'],['Canal','Notification et SMS'],['Report proposé','Samedi 10 h, Grand manège, aucune séance décomptée']],ok:'Annuler la reprise et envoyer'},
     run:function(){logAI('A annulé la reprise '+l.title+' et prévenu '+l.riders.length+' familles','cours_annuler_ou_reporter','E','ok',true);P.toast('Reprise annulée, '+l.riders.length+' familles prévenues');return l.riders.length+' familles prévenues'}},
    {label:'Modifier le message',icon:'edit',run:function(){go('communication',{},'Communication');return 'Ouvert'}}]}});

I('ca','Argent','trend',/chiffre d.affaires|\bca\b|recette|combien (j.ai|on a) (gagn|fait)|r[ée]sultat|activit[ée]/i,'Quel est mon chiffre d’affaires par activité, comparé au mois dernier ?',function(){
  var n=D.revenue[11],o=D.revenue[10],sh=[['Enseignement et forfaits',.46,'var(--acc)'],['Pensions et demi-pensions',.37,'var(--c3)'],['Stages et concours',.10,'var(--c4)'],['Boutique et divers',.07,'var(--c5)']],res=sum(D.revenue)-sum(D.costs);
  return {text:'En novembre, vous êtes à <b>'+F.eur(n)+'</b> de chiffre d’affaires, soit '+Math.abs(Math.round((n-o)/o*100))+' % de '+(n<o?'moins':'plus')+' qu’en octobre ('+F.eur(o)+'), ce qui est habituel hors vacances scolaires. Sur douze mois, le résultat est de <b>'+F.eur(res)+'</b>.',src:['Comptabilité','Facturation'],tool:'ecurie_tableau_de_bord',
   card:C.line([{v:D.revenue,c:'var(--acc)',area:true},{v:D.costs,c:'var(--c2)'}],D.months,{h:170,fmt:function(v){return Math.round(v/1000)+' k'}})+C.legend([['Recettes','var(--acc)'],['Dépenses','var(--c2)']])+
     tb([['Activité en novembre'],['Part',1],['Montant',1]],sh.map(function(s){return ['<span class="hrow" style="--g:8px"><i style="width:8px;height:8px;border-radius:2px;background:'+s[2]+';flex:none"></i>'+s[0]+'</span>',Math.round(s[1]*100)+' %','<b>'+F.eur(Math.round(n*s[1]/10)*10)+'</b>']})),
   actions:[{label:'Ouvrir les rapports',icon:'report',run:function(){go('rapports',{},'Rapports');return 'Ouvert'}},{label:'Envoyer ce bilan au comptable',icon:'mail',undo:true,preview:{title:'Envoyer le bilan de novembre au cabinet Fidélis',rows:[['Pièce jointe','Synthèse PDF et export FEC de novembre'],['Destinataire','cabinet@fidelis-compta.example'],['Copie','Claire Morel']]},run:function(){logAI('A envoyé le bilan de novembre au cabinet comptable','compta_export_generer','E','ok');P.toast('Bilan envoyé au cabinet Fidélis');return 'Bilan envoyé'}}]}});

I('cartes','Club','ticket',/carte/i,'Quelles cartes de 10 séances expirent avant Noël ?',function(){
  var l=D.members.filter(function(m){return m.forfait==='f3'}).map(function(m){var k=parseInt(m.id.slice(1),10);return {m:m,left:(k*7)%10+1,exp:D.iso(D.day(6+(k*13)%70))}}).filter(function(x){return F.days(x.exp)<=38}).sort(function(a,b){return F.days(a.exp)-F.days(b.exp)}),lost=sum(l,function(x){return x.left});
  return {text:'<b>'+l.length+' cartes de 10 séances expirent avant le 25 décembre</b>, avec '+lost+' séances encore à consommer, soit '+F.eur(lost*29)+' de séances déjà payées.',src:['Adhérents','Forfaits'],tool:'cartes_solde',
   card:tb([['Cavalier'],['Reste',1],['Expire',1]],l.slice(0,7).map(function(x){return [who(x.m.id,'Galop '+x.m.galop),x.left+' séances',F.date(x.exp)]}))+(l.length>7?'<div class="xs mut">et '+(l.length-7)+' autres cartes</div>':''),
   actions:[{label:'Rappeler les '+l.length+' cavaliers',icon:'send',undo:true,preview:{title:'Rappel d’expiration à '+l.length+' cavaliers',rows:[['Message','Il vous reste {n} séances à utiliser avant le {date}'],['Bouton','Réserver une séance'],['Canal','Notification et e-mail']]},run:function(){logAI('A rappelé à '+l.length+' cavaliers l’expiration de leur carte','message_envoyer','E','ok');P.toast(l.length+' rappels envoyés');return l.length+' rappels envoyés'}}]}});

I('licences','Club','members',/licen|certificat|pi[èe]ces? manquante|document/i,'Quels adhérents n’ont pas encore leur licence 2027 ?',function(){
  var l=D.members.filter(function(m){return m.licence!=='2027'}),c=D.members.filter(function(m){return !m.cert}).length;
  return {text:'<b>'+l.length+' adhérents sur '+D.members.length+' n’ont pas leur licence FFE 2027.</b> Par ailleurs, '+c+' certificats médicaux ne sont pas à jour. Piaffe prépare le lot de licences, vous le validez ensuite dans votre espace FFE Club SIF.',src:['Adhérents','FFE (export assisté)'],tool:'adherent_documents_manquants',
   card:tb([['Adhérent'],['Reprise'],['Licence',1]],l.slice(0,7).map(function(m){return [who(m.id,m.minor?m.age+' ans':'Adulte'),'Galop '+m.galop,'<span class="chip warn dot">À renouveler</span>']}))+(l.length>7?'<div class="xs mut">et '+(l.length-7)+' autres adhérents</div>':''),
   actions:[{label:'Préparer le lot de '+l.length+' licences',icon:'doc',undo:true,preview:{title:'Lot de '+l.length+' licences 2027 pour FFE Club SIF',rows:[['Contenu','Nom, prénom, date de naissance, type de licence'],['Format','Fichier prêt à saisir dans votre espace club FFE'],['Montant à refacturer',F.eur(l.length*40)+' ajoutés aux prochaines factures']]},run:function(){logAI('A préparé un lot de '+l.length+' licences FFE','adherent_creer_ou_modifier','E','ok',true);P.toast('Lot de '+l.length+' licences prêt à télécharger');return 'Lot prêt'}},
    {label:'Relancer les familles',icon:'send',run:function(){P.toast(l.length+' rappels de licence envoyés');logAI('A relancé '+l.length+' familles pour la licence 2027','message_envoyer','E','ok');return l.length+' rappels envoyés'}}]}});

I('boxes','Écurie','stable',/box|pension(naire)? (libre|dispo)|place en pension|occupation/i,'J’ai un box libre à partir de quand, et qui attend une place ?',function(){
  var occ=D.club.boxes-2;return {text:'<b>'+occ+' boxes sur '+D.club.boxes+' sont occupés.</b> B45 et B46 sont libres dès aujourd’hui, et B17 se libère le 30 novembre. Trois demandes de pension attendent une réponse.',src:['Écurie','Pensions'],tool:'boxes_occupation',
   card:'<div class="hrow" style="--g:14px">'+U.ring(Math.round(occ/D.club.boxes*100),occ+'/'+D.club.boxes,'var(--acc)',58)+'<div class="grow s mut">Taux d’occupation de '+Math.round(occ/D.club.boxes*100)+' %. Un box libre représente 520 € de pension par mois.</div></div>'+
     tb([['Demande de pension'],['Cheval'],['Reçue',1]],[['Famille Roussel','Hongre SF, 9 ans','il y a 3 j'],['Aurélie Faure','Jument KWPN, 6 ans','il y a 8 j'],['Paul Girard','Poney Connemara','il y a 12 j']]),
   actions:[{label:'Proposer B45 à la famille Roussel',icon:'contract',undo:true,preview:{title:'Proposer le box B45 en pension complète',rows:[['Tarif','520 € par mois, TVA 20 %'],['Contrat','Pension complète, envoyé en signature électronique'],['Arrivée proposée','Samedi 21 novembre']]},run:function(){logAI('A préparé un contrat de pension pour le box B45','pension_contrat_creer','E','ok',true);P.toast('Contrat de pension envoyé en signature');return 'Contrat envoyé'}},
    {label:'Voir le plan de l’écurie',icon:'cube',run:function(){go('ecurie3d',{},'Écurie 3D');return 'Ouvert'}}]}});

I('paie','Équipe','team',/heures? de l.[ée]quipe|paie|pointage|heures sup|salari/i,'Sors-moi les heures de l’équipe pour la paie de novembre',function(){
  var l=D.staff.filter(function(s){return s.id!=='s01'}).map(function(s,i){var base=Math.round(s.hours*52/12),sup=[0,6,0,4,9,0,0,2][i]||0;return {s:s,base:base,sup:sup}}),tot=sum(l,function(x){return x.base+x.sup}),sp=sum(l,function(x){return x.sup});
  return {text:'Au 17 novembre, l’équipe a pointé l’équivalent de <b>'+F.num(tot)+' h sur le mois</b>, dont <b>'+sp+' h supplémentaires</b>. Deux pointages de samedi restent à valider.',src:['Équipe','Pointages'],tool:'equipe_heures_exporter',
   card:tb([['Salarié'],['Contrat'],['Heures',1],['Sup.',1]],l.map(function(x){return [who(x.s.id,x.s.role),x.s.contract,x.base+' h',x.sup?'<b class="warnc">+'+x.sup+' h</b>':'0']})),
   actions:[{label:'Exporter les variables de paie',icon:'download',preview:{title:'Export des variables de paie de novembre',rows:[['Contenu','Heures normales, supplémentaires, absences, primes'],['Format','Fichier pour PayFit ou Silae, convention IDCC 7026'],['Destinataire','Téléchargement, rien n’est envoyé']]},run:function(){logAI('A généré l’export des variables de paie de novembre','equipe_heures_exporter','L','read');P.toast('Export de paie téléchargé',{icon:'download'});return 'Export téléchargé'}},
    {label:'Valider les 2 pointages',icon:'clockin',run:function(){go('equipe',{},'Équipe');return 'Ouvert'}}]}});

I('contrats','Argent','contract',/contrat|sign/i,'Quels contrats attendent encore une signature ?',function(){
  var l=D.contracts.filter(function(c){return c.status==='à signer'});
  return {text:'<b>'+l.length+' contrats attendent une signature</b>, le plus ancien depuis '+Math.max.apply(null,l.map(function(c){return -F.days(c.date)}))+' jours. Un brouillon reste aussi à envoyer.',src:['Contrats'],tool:'pension_contrats_lister',
   card:tb([['Contrat'],['Signataire'],['Envoyé',1]],l.map(function(c){return ['<b>'+c.title+'</b>',D.name(c.party),F.rel(c.date)]})),
   actions:[{label:'Relancer les signataires',icon:'sign',undo:true,preview:{title:'Relancer '+l.length+' signataires',rows:[['Message','Un rappel avec le lien de signature électronique'],['Canal','E-mail et SMS']]},run:function(){logAI('A relancé '+l.length+' signataires de contrats','message_envoyer','E','ok');P.toast(l.length+' rappels de signature envoyés');return l.length+' rappels envoyés'}},{label:'Ouvrir les contrats',icon:'contract',run:function(){go('contrats',{},'Contrats');return 'Ouvert'}}]}});

I('pension','Argent','euro',/factures? de pension|pr[ée]pare les factures|brouillon/i,'Prépare les factures de pension de décembre en brouillon',function(){
  var l=D.horses.filter(function(h){return h.owner}),tot=l.length*520,ht=Math.round(tot/1.2);
  return {text:'J’ai préparé <b>'+l.length+' factures de pension pour décembre</b>, une par cheval de propriétaire, pour un total de <b>'+F.eur(tot)+' TTC</b>. Elles sont en brouillon : rien n’est émis ni envoyé.',src:['Pensions','Facturation'],tool:'facture_creer_brouillon',
   card:stat([[l.length,'brouillons'],[F.eur(ht),'hors taxes'],[F.eur(tot-ht),'de TVA à 20 %'],[F.eur(tot),'TTC']])+tb([['Cheval'],['Payeur'],['Montant',1]],l.slice(0,4).map(function(h){return [hwho(h,h.box),D.name(h.owner),F.eur(520)]}))+'<div class="xs mut">et '+(l.length-4)+' autres factures identiques</div>',
   actions:[{label:'Émettre les '+l.length+' factures',icon:'invoice',preview:{title:'Émettre '+l.length+' factures pour '+F.eur(tot),double:'Je confirme l’émission définitive de '+l.length+' factures',rows:[['Numérotation','F-2026-1174 à F-2026-'+(1173+l.length)+', définitive et irréversible'],['Échéance','5 décembre, prélèvement SEPA pour 14 mandats'],['Envoi','Par e-mail au payeur, avec le lien de paiement']],ok:'Émettre les factures'},
     run:function(){logAI('A émis '+l.length+' factures de pension pour '+F.eur(tot),'facture_emettre','E','ok');P.toast(l.length+' factures émises et envoyées');return l.length+' factures émises'}},
    {label:'Relire les brouillons',icon:'eye',run:function(){go('facturation',{},'Facturation');return 'Ouvert'}}]}});

I('concours','Concours','trophy',/concours|engag|rambouillet|refactur/i,'Qui est engagé au concours de dimanche, et que dois-je refacturer ?',function(){
  var k=D.competitions[0],e=D.entries.filter(function(x){return x.comp===k.id}),fees=sum(e,function(x){return x.fee}),tr=e.filter(function(x){return x.transport==='v1'||x.transport==='v2'}).length*35,co=e.length*25;
  return {text:'<b>'+e.length+' couples sont engagés au '+k.name+' de '+k.place.split(',')[0]+'</b>, '+F.rel(k.date)+'. Il y a <b>'+F.eur(fees+tr+co)+' à refacturer</b> : engagements, transport et coaching. La clôture des engagements est '+F.rel(k.closes)+'.',src:['Concours','Facturation'],tool:'concours_engagements',
   card:tb([['Cavalier'],['Cheval'],['Épreuve'],['Engagement',1]],e.slice(0,6).map(function(x){return [who(x.rider),D.horse(x.horse).name.split(' ')[0],x['class'],F.eur(x.fee)]}))+'<dl class="pf-kv"><dt>Engagements</dt><dd class="num">'+F.eur(fees)+'</dd><dt>Transport (35 € par cheval)</dt><dd class="num">'+F.eur(tr)+'</dd><dt>Coaching (25 € par cavalier)</dt><dd class="num">'+F.eur(co)+'</dd></dl>',
   actions:[{label:'Préparer les '+e.length+' factures',icon:'invoice',undo:true,preview:{title:'Refacturer le concours à '+e.length+' cavaliers',rows:[['Total',F.eur(fees+tr+co)],['État','Brouillons, à émettre après le concours'],['Détail','Engagement, transport et coaching sur une même facture']]},run:function(){logAI('A préparé '+e.length+' factures de concours en brouillon','facture_creer_brouillon','E','ok',true);P.toast(e.length+' brouillons de factures créés');return e.length+' brouillons créés'}},
    {label:'Ouvrir le concours',icon:'compet',run:function(){go('competitions',{},'Concours');return 'Ouvert'}}]}});

I('remplissage','Club','percent',/remplissage|taux|fr[ée]quentation/i,'Quel est mon taux de remplissage par jour depuis la rentrée ?',function(){
  var d=[1,2,3,4,5,6,0],v=d.map(function(k){var l=D.lessons.filter(function(x){return x.dow===k});return Math.round(sum(l,fillOf)/l.length*100)}),avg=Math.round(sum(D.lessons,fillOf)/D.lessons.length*100),lo=v.indexOf(Math.min.apply(null,v));
  return {text:'Vos reprises sont remplies à <b>'+avg+' % en moyenne</b>. Le '+DOW[d[lo]]+' est le jour le plus creux avec '+v[lo]+' %. C’est là qu’une offre de découverte aurait le plus d’effet.',src:['Planning'],tool:'ecurie_tableau_de_bord',
   card:C.bars(v,['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'],{h:150,max:110,hi:lo,fmt:function(x){return Math.round(x)+' %'}}),
   actions:[{label:'Proposer une séance découverte le '+DOW[d[lo]],icon:'gift',undo:true,preview:{title:'Séance découverte du '+DOW[d[lo]],rows:[['Offre','Une séance d’essai à 19 € au lieu de 29 €'],['Cible','Adhérents avec une carte, et anciens adhérents'],['Canal','E-mail et notification']]},run:function(){logAI('A préparé une offre de séance découverte','message_preparer','E','ok',true);P.toast('Offre découverte programmée');return 'Offre programmée'}}]}});

I('stock','Écurie','stock',/stock|copeaux|foin|paille|granul|commande/i,'Où en sont les stocks de foin et de copeaux ?',function(){
  var l=D.stock.map(function(s){return {s:s,days:s.daily?Math.floor(s.qty/s.daily):null}}),low=l.filter(function(x){return x.s.qty<x.s.min}),k=D.stock[1];
  return {text:'<b>'+low.length+' articles sont sous leur seuil</b> : '+low.map(function(x){return x.s.name.toLowerCase()}).join(' et ')+'. Il reste '+Math.floor(k.qty/k.daily)+' jours de copeaux au rythme actuel.',src:['Stocks'],tool:'ecurie_tableau_de_bord',
   card:tb([['Article'],['Stock',1],['Autonomie',1]],l.map(function(x){return ['<b>'+x.s.name+'</b>',String(x.s.qty)+' '+x.s.unit,x.s.qty<x.s.min?'<span class="chip warn dot">'+(x.days!=null?x.days+' j':'Sous le seuil')+'</span>':(x.days!=null?x.days+' j':'Suffisant')]})),
   actions:[{label:'Commander 60 sacs de copeaux',icon:'truck',undo:true,preview:{title:'Commande chez '+k.supplier,rows:[['Article','60 sacs de copeaux dépoussiérés'],['Montant',F.eur(60*k.price)+' HT'],['Livraison','Jeudi 19 novembre, cour principale']],ok:'Envoyer la commande'},run:function(){logAI('A commandé 60 sacs de copeaux chez '+k.supplier,'taches_lister_ou_creer','E','ok',true);P.toast('Commande envoyée à '+k.supplier+', livraison jeudi');return 'Commande envoyée'}},
    {label:'Ouvrir les stocks',icon:'stock',run:function(){go('alimentation',{},'Alimentation et stocks');return 'Ouvert'}}]}});

I('samedi','Club','calendar_add',/planning|samedi|montoir|pr[ée]pare/i,'Prépare le planning de samedi',function(){
  var l=D.lessons.filter(function(x){return x.dow===6}),r=sum(l,function(x){return x.riders.length});
  return {text:'Samedi 21 novembre, <b>'+l.length+' reprises et stages accueillent '+r+' cavaliers</b> de 9 h à 17 h 30, plus un cours particulier de CSO à 11 h 30. J’ai attribué les chevaux en respectant les niveaux et les charges de travail. La météo annonce 10 °C et du soleil : la carrière d’honneur est praticable.',src:['Planning','Chevaux','Météo'],tool:'planning_consulter',
   card:tb([['Reprise'],['Moniteur'],['Lieu'],['Inscrits',1]],l.map(function(x){return ['<b>'+x.start+'</b> · '+x.title,D.staffer(x.coach).first,D.club.arenas.find(function(a){return a.id===x.arena}).name,x.riders.length+'/'+x.cap]})),
   actions:[{label:'Publier le montoir de samedi',icon:'check',undo:true,preview:{title:'Publier le montoir de samedi',rows:[['Attributions',r+' couples cavalier et cheval'],['Visibles par','Les cavaliers et les moniteurs, dès maintenant'],['Feuilles de monte','Imprimables pour l’accueil']]},run:function(){logAI('A publié le montoir de samedi ('+r+' attributions)','cours_presences_saisir','E','ok',true);P.toast('Montoir de samedi publié');return 'Montoir publié'}},
    {label:'Ouvrir le planning',icon:'planning',run:function(){go('planning',{},'Planning');return 'Ouvert'}}]}});

I('export','Argent','accounting',/export|comptable|fec|pennylane/i,'Envoie les écritures de novembre à mon comptable',function(){
  return {text:'Les écritures de novembre sont prêtes : <b>'+D.invoices.length+' factures</b>, les encaissements et '+D.bank.filter(function(b){return b.matched}).length+' opérations bancaires rapprochées. '+D.bank.filter(function(b){return !b.matched}).length+' opérations restent à rapprocher avant un envoi propre.',src:['Comptabilité','Banque'],tool:'compta_export_generer',
   card:tb([['Opération à rapprocher'],['Montant',1]],D.bank.filter(function(b){return !b.matched}).map(function(b){return [b.label,'<b>'+F.eur(b.amount,true)+'</b>']})),
   actions:[{label:'Générer l’export FEC',icon:'download',preview:{title:'Export des écritures de novembre',rows:[['Format','FEC, lisible par Pennylane, Cegid, Sage et EBP'],['Période','Du 1er au 30 novembre 2026'],['Envoi','Téléchargement, rien n’est transmis au cabinet']]},run:function(){logAI('A généré l’export FEC de novembre','compta_export_generer','L','read');P.toast('Export FEC de novembre téléchargé',{icon:'download'});return 'Export téléchargé'}},
    {label:'Rapprocher les opérations',icon:'bank',run:function(){go('compta',{},'Comptabilité');return 'Ouvert'}}]}});

I('mcp','Plateforme','mcp',/mcp|claude|chatgpt|connect|api|webhook/i,'Comment connecter Claude ou ChatGPT à mon écurie ?',function(){
  return {text:'Piaffe expose un <b>serveur MCP</b> : vous collez une adresse dans Claude, ChatGPT ou un autre assistant, vous vous identifiez, et il peut interroger l’écurie avec vos droits. Il lit par défaut, et toute écriture vous est montrée avant d’être faite.',src:['Connecteurs'],tool:'ecurie_apercu',
   card:'<div class="pf-code"><pre>https://mcp.piaffe.fr/mcp</pre></div>',
   actions:[{label:'Ouvrir les connecteurs',icon:'plug',run:function(){P.go('connecteurs');return 'Ouvert'}},{label:'Copier l’adresse du serveur',icon:'copy',run:function(){clip('https://mcp.piaffe.fr/mcp','Adresse du serveur MCP copiée');return 'Adresse copiée'}}]}});

function answer(t){for(var i=0;i<INT.length;i++){if(INT[i].re.test(t)){var r=INT[i].fn(t);if(r)return r}}
  var r2=P.think(t);return r2}
INT.forEach(function(i){P.brain.push({role:'gerant',re:i.re,reply:function(t){return i.fn(t)}})});
P.pf.answer=answer;P.pf.INT=INT;

/* =====================================================================
   Écran · Assistant
   ===================================================================== */
var CONVS=[
 {id:'cv1',title:'Point sur les impayés de novembre',when:'9 h 32',grp:'Aujourd’hui',qs:['Qui n’a pas payé ce mois-ci, et depuis quand ?']},
 {id:'cv2',title:'Vaccins et vermifuges à venir',when:'8 h 15',grp:'Aujourd’hui',qs:['Quels chevaux doivent être vaccinés ou vermifugés dans les trois prochaines semaines ?']},
 {id:'cv3',title:'Reprise de 17 h annulée pour gel',when:'Hier',grp:'Cette semaine',qs:['Préviens les cavaliers de 17 h : reprise annulée pour gel, report samedi 10 h']},
 {id:'cv4',title:'Chiffre d’affaires par activité',when:'Hier',grp:'Cette semaine',qs:['Quel est mon chiffre d’affaires par activité, comparé au mois dernier ?']},
 {id:'cv5',title:'Charge de travail de la cavalerie',when:'Lundi',grp:'Cette semaine',qs:['Quels chevaux travaillent trop cette semaine ?','Est-ce que Quartz travaille trop ?']},
 {id:'cv6',title:'Factures de pension de décembre',when:'Lundi',grp:'Cette semaine',qs:['Prépare les factures de pension de décembre en brouillon']},
 {id:'cv7',title:'Engagés à Rambouillet',when:'12 nov.',grp:'Plus ancien',qs:['Qui est engagé au concours de dimanche, et que dois-je refacturer ?']},
 {id:'cv8',title:'Heures de l’équipe pour la paie',when:'9 nov.',grp:'Plus ancien',qs:['Sors-moi les heures de l’équipe pour la paie de novembre']},
 {id:'cv9',title:'Cartes qui expirent avant Noël',when:'5 nov.',grp:'Plus ancien',qs:['Quelles cartes de 10 séances expirent avant Noël ?']}];
var AS={tab:'chat',cur:'cv1',dom:'Argent',jf:'all'};
var DOMS=[['Argent','euro'],['Écurie','horse'],['Club','planning'],['Équipe','team'],['Concours','trophy'],['Plateforme','plug']];
function conv(){return CONVS.find(function(c){return c.id===AS.cur})||CONVS[0]}
function msgs(c){if(!c.msgs){c.msgs=[];(c.qs||[]).forEach(function(q){c.msgs.push({u:q});c.msgs.push({a:answer(q)})})}return c.msgs}
var ORB='<span class="pfa-orb">'+LOGO(16,'var(--navy-ink)','var(--strass)')+'</span>';

function actsHTML(r,last){var op=r.actions.filter(function(a){return a._st==='preview'})[0];
  if(op){var p=op.preview,i=r.actions.indexOf(op);return '<div class="pfa-prev pop"><div class="pfa-ph">'+ICON('shield','sm')+'<span>Aperçu avant exécution</span><span class="chip acc">Rien n’est encore fait</span></div><div class="pfa-pb"><h4>'+p.title+'</h4>'+
    '<dl class="pf-kv">'+(p.rows||[]).map(function(x){return '<dt>'+x[0]+'</dt><dd>'+x[1]+'</dd>'}).join('')+'</dl>'+(p.body||'')+
    (p.double?'<label class="hrow pf-tap" style="cursor:pointer">'+U.chk(false,'dbl')+'<span class="s b">'+p.double+'</span></label>':'')+'</div>'+
    '<div class="pfa-pf"><button class="btn sm pri" data-ok="'+i+'"'+(p.double?' disabled':'')+'>'+ICON('check','sm')+(p.ok||op.label)+'</button><button class="btn sm ghost" data-no="'+i+'">Ne rien faire</button>'+(p.double?'<span class="xs mut">Action irréversible, double confirmation demandée</span>':'')+'</div></div>'}
  var first=true;return '<div class="hrow wrap" style="--g:8px">'+r.actions.map(function(a,i){
    if(a._st==='done')return '<span class="chip ok dot lg">'+a._res+'</span>'+(a.undo?'<button class="btn ghost sm" data-undo="'+i+'">'+ICON('refresh','sm')+'Annuler</button>':'');
    if(a._st==='cancel')return '<span class="chip lg">Annulé, rien n’a été fait</span>';
    var pri=last&&first;first=false;return '<button class="btn sm'+(pri?' pri':'')+'" data-act="'+i+'">'+(a.icon?ICON(a.icon,'sm'):'')+a.label+'</button>'}).join('')+'</div>'}
function replyHTML(r,mi,last){var h='<div class="pfa-txt">'+r.text+'</div>';
  if(r.card)h+='<div class="card flat pfa-card">'+r.card+'</div>';
  if(r.actions&&r.actions.length)h+='<div class="pfa-acts" data-m="'+mi+'">'+actsHTML(r,last)+'</div>';
  if(r.src)h+='<div class="pfa-src">'+ICON('eye','sm')+'<span>A consulté : '+r.src.join(', ')+'</span>'+(r.tool?'<code>'+r.tool+'</code>':'')+'</div>';
  return h}
P.pf.replyHTML=replyHTML;

function renderAssistant(el,ctx){
  if(ctx.params.tab){AS.tab=ctx.params.tab;delete ctx.params.tab}
  var seg=U.seg([['chat',ICON('chat','sm')+'Discussion'],['auto',ICON('repeat','sm')+'Automatisations'],['journal',ICON('shield','sm')+'Journal']],AS.tab,'data-at');
  if(AS.tab==='chat')renderChat(el,ctx,seg);else if(AS.tab==='auto')renderAuto(el,ctx,seg);else renderJournal(el,ctx,seg);
  on(el,'[data-at]',function(b){AS.tab=b.getAttribute('data-at');P.rerender()});
  if(ctx.params.do){var d=ctx.params.do;delete ctx.params.do;setTimeout(function(){var b=el.querySelector('[data-do="'+d+'"]');if(b)b.click()},60)}
}

function histHTML(){var h='',g=null;CONVS.forEach(function(c){if(c.grp!==g){g=c.grp;h+='<div class="pfa-hg">'+g+'</div>'}h+='<button class="pfa-hi" data-cv="'+c.id+'" aria-current="'+(c.id===AS.cur)+'"><b>'+esc(c.title)+'</b><span>'+c.when+'</span></button>'});return h}

function renderChat(el,ctx,seg){
  var c=conv();
  el.innerHTML='<div class="pfa-root"><div class="pfa-head"><div><h1>Assistant</h1><div class="sub hide-s">Il cherche dans tout Piaffe et vous montre chaque action avant de la faire.</div></div>'+seg+'</div>'+
   '<div class="pfa-main"><aside class="card pfa-hist"><div style="padding:12px 12px 4px" class="stack"><button class="btn block" data-new>'+ICON('plus','sm')+'Nouvelle conversation</button><div class="search"><span>'+ICON('search','sm')+'</span><input class="in" data-hs placeholder="Chercher dans l’historique" style="height:34px;font-size:13px"></div></div><div class="pfa-hl">'+histHTML()+'</div></aside>'+
   '<section class="card pfa-chat"><div class="pfa-bar"><button class="btn ghost icon sm pfa-hbtn" data-hist title="Historique des conversations">'+ICON('list')+'</button><b class="ellip grow" data-title></b><span class="chip acc hide-s">'+ICON('shield','sm')+'Droits de gérante</span><button class="btn ghost icon sm pfa-hbtn" data-new title="Nouvelle conversation">'+ICON('plus')+'</button><button class="btn ghost icon sm" data-more-c title="Options de la conversation">'+ICON('more')+'</button></div>'+
   '<div class="pfa-thread"></div>'+
   '<div class="pfa-foot"><div class="pfa-fu scroll-x"></div><form class="pfa-comp"><button type="button" class="btn ghost icon" data-attach title="Joindre une photo ou un fichier">'+ICON('attach')+'</button><input data-q placeholder="'+(ctx.mobile?'Votre demande':'Posez une question ou demandez une action')+'" autocomplete="off" aria-label="Message à l’assistant">'+
     '<div class="pfa-live"><div class="pfa-wave">'+[9,16,6,20,12,18,8,14,20,7,15,10].map(function(h,i){return '<i style="--i:'+i+';--h:'+h+'"></i>'}).join('')+'</div><span><bdi data-tr>Je vous écoute</bdi></span></div>'+
     '<button type="button" class="btn ghost icon" data-mic data-do="voice" title="Dicter la demande">'+ICON('mic')+'</button><button class="btn dark icon" title="Envoyer">'+ICON('send')+'</button></form>'+
     '<div class="pfa-legal">L’assistant agit avec vos droits de gérante. Il ne modifie rien sans que vous ayez validé l’aperçu.</div></div></section></div></div>';
  var th=$('.pfa-thread',el),inp=$('[data-q]',el),comp=$('.pfa-comp',el),fu=$('.pfa-fu',el),busy=false,vt=null;
  function draw(scroll){var c=conv(),m=msgs(c);$('[data-title]',el).textContent=c.title||'Nouvelle conversation';
    if(!m.length){th.innerHTML='<div class="pfa-wel"><div><div class="hrow" style="--g:8px;margin-bottom:10px"><span class="strass"></span><span class="eyebrow">Assistant Piaffe</span></div><h2>Bonjour Claire. Que voulez-vous savoir ou faire aux Tilleuls ?</h2></div>'+
        '<div class="hrow wrap" style="--g:6px">'+DOMS.map(function(d){return '<button class="tag" data-manual data-dom="'+d[0]+'" aria-pressed="'+(d[0]===AS.dom)+'">'+ICON(d[1],'sm')+d[0]+'</button>'}).join('')+'</div>'+
        '<div class="pfa-sg rise">'+INT.filter(function(i){return i.dom===AS.dom&&i.q}).slice(0,6).map(function(i){return '<button data-sq="'+esc(i.q)+'">'+ICON(i.ic)+'<span>'+i.q+'</span></button>'}).join('')+'</div></div>';
      fu.innerHTML='';P.animate(th);return}
    var lastA=-1;m.forEach(function(x,i){if(x.a)lastA=i});
    th.innerHTML='<div class="pfa-col">'+m.map(function(x,i){return x.u!=null?'<div class="pfa-u">'+esc(x.u)+(x.file?'<div class="xs" style="opacity:.85;margin-top:4px">'+ICON('attach','sm')+' '+x.file+'</div>':'')+'</div>':x.think?'<div class="pfa-a">'+ORB+'<div class="pfa-think"><span class="typing"><i></i><i></i><i></i></span><span data-step>Je cherche dans Piaffe</span></div></div>':'<div class="pfa-a"'+(x.old?' style="animation:none"':'')+'>'+ORB+'<div>'+replyHTML(x.a,i,i===lastA)+'</div></div>'}).join('')+'</div>';
    m.forEach(function(x){x.old=true});
    var used=m.filter(function(x){return x.u}).map(function(x){return x.u});
    fu.innerHTML=INT.filter(function(i){return i.q&&used.indexOf(i.q)<0}).slice(1,6).map(function(i){return '<button data-sq="'+esc(i.q)+'">'+i.q+'</button>'}).join('');
    P.animate(th);if(scroll!==false)th.scrollTop=scroll==='top'?0:1e6}
  function send(t,file){if(busy)return;if(!t){var ti=$('.pfa-comp textarea,.pfa-comp input',el);if(ti)ti.focus();P.toast('Écrivez votre demande, ou choisissez une suggestion',{icon:'assistant'});return}var c=conv(),m=msgs(c);if(!c.title){c.title=t.length>42?t.slice(0,40)+'…':t;c.when='à l’instant';$('.pfa-hl',el).innerHTML=histHTML()}
    m.push({u:t,file:file});var ph={think:true};m.push(ph);busy=true;draw();
    var st=$('[data-step]',th),steps=['Je cherche dans Piaffe','Je lis les données de l’écurie','Je prépare la réponse'],k=0,iv=setInterval(function(){k++;if(st&&st.isConnected&&steps[k])st.textContent=steps[k]},420);
    setTimeout(function(){clearInterval(iv);var i=m.indexOf(ph);if(i>=0)m.splice(i,1,{a:answer(t)});busy=false;if(el.isConnected&&AS.tab==='chat'){draw(false);var a=th.querySelectorAll('.pfa-a');a=a[a.length-1];if(a){var u=a.previousElementSibling||a;th.scrollTo({top:u.offsetTop-14,behavior:P.RM?'auto':'smooth'})}}},P.RM?60:1150)}
  draw('top');
  th.addEventListener('click',function(e){var t=e.target,b;
    if((b=t.closest('[data-sq]'))){send(b.getAttribute('data-sq'));return}
    if((b=t.closest('[data-dom]'))){AS.dom=b.getAttribute('data-dom');draw('top');return}
    var box=t.closest('.pfa-acts');if(!box)return;var mi=+box.getAttribute('data-m'),r=msgs(conv())[mi].a,last=true;
    function re(){box.innerHTML=actsHTML(r,last)}
    function exec(a){var res=a.run&&a.run();a._st='done';a._res=res||'Fait';if(box.isConnected)re()}
    if((b=t.closest('[data-act]'))){var a=r.actions[+b.getAttribute('data-act')];if(a.preview){a._st='preview';re();setTimeout(function(){box.scrollIntoView({block:'nearest',behavior:P.RM?'auto':'smooth'})},40)}else exec(a);return}
    if((b=t.closest('[data-ok]'))){exec(r.actions[+b.getAttribute('data-ok')]);return}
    if((b=t.closest('[data-no]'))){var a2=r.actions[+b.getAttribute('data-no')];a2._st='cancel';logAI('Action « '+a2.label+' » refusée à l’aperçu','aperçu','E','cancel');re();return}
    if((b=t.closest('[data-undo]'))){var a3=r.actions[+b.getAttribute('data-undo')];a3._st=null;logAI('Action « '+a3.label+' » annulée par Claire','annulation','E','cancel');re();P.toast('Action annulée, tout est revenu comme avant',{icon:'refresh'});return}
    if(t.closest('.chk')&&box.querySelector('[data-ok]')){setTimeout(function(){var ck=box.querySelector('.chk');box.querySelector('[data-ok]').disabled=ck.getAttribute('aria-checked')!=='true'},0)}
  });
  fu.addEventListener('click',function(e){var b=e.target.closest('[data-sq]');if(b)send(b.getAttribute('data-sq'))});
  comp.addEventListener('submit',function(e){e.preventDefault();if(comp.classList.contains('rec'))return;var v=inp.value.trim();if(v){inp.value='';send(v,comp._file);comp._file=null;inp.placeholder=ctx.mobile?'Votre demande':'Posez une question ou demandez une action'}else{inp.focus();P.toast('Écrivez votre demande, ou choisissez une suggestion',{icon:'assistant'})}});
  /* mode vocal simulé */
  function stopVoice(sendIt){clearInterval(vt);vt=null;comp.classList.remove('rec');var tr=$('[data-tr]',comp).textContent;$('[data-mic]',comp).innerHTML=ICON('mic');$('[data-mic]',comp).title='Dicter la demande';if(sendIt&&tr&&tr!=='Je vous écoute')send(tr)}
  $('[data-mic]',el).onclick=function(){if(vt){stopVoice(true);return}if(busy)return;
    var said=['Quels chevaux doivent être vaccinés ou vermifugés dans les trois prochaines semaines ?','Où en sont les stocks de foin et de copeaux ?','Quels chevaux travaillent trop cette semaine ?'],used=msgs(conv()).map(function(x){return x.u}),ph=(said.filter(function(s){return used.indexOf(s)<0})[0]||said[0]).split(' '),k=0,tr=$('[data-tr]',comp);
    comp.classList.add('rec');tr.textContent='Je vous écoute';this.innerHTML=ICON('pause');this.title='Arrêter la dictée';
    if(P.RM){tr.textContent=ph.join(' ');vt=setTimeout(function(){vt=null;stopVoice(true)},400);return}
    vt=setInterval(function(){k++;tr.textContent=ph.slice(0,k).join(' ');if(k>=ph.length){clearInterval(vt);vt=setTimeout(function(){vt=null;if(el.isConnected)stopVoice(true)},650)}},150)};
  $('[data-attach]',el).onclick=function(){P.sheet({title:'Joindre à la demande',icon:'attach',body:'<p class="s mut" style="margin-bottom:14px">L’assistant lit les photos, les PDF et les tableurs : ordonnance, facture fournisseur, feuille de monte, livret d’un cheval.</p><div class="card list">'+[['image','Prendre ou choisir une photo','ordonnance_tornado.jpg','Que dit cette ordonnance, et que dois-je noter au registre ?'],['doc','Choisir un PDF','facture_fourrages_hurepoix.pdf','Enregistre cette facture fournisseur'],['grid','Choisir un tableur','engagements_ffe_compet.csv','Importe ces engagements']].map(function(x,i){return '<button class="li click pf-tap" data-f="'+i+'" style="width:100%;text-align:left"><span class="av sq" style="--c:var(--acc-pale);color:var(--acc)">'+ICON(x[0])+'</span><div class="grow"><div class="t">'+x[1]+'</div><div class="s">Exemple : '+x[2]+'</div></div>'+ICON('right','sm')+'</button>'}).join('')+'</div>'});
    var sh=sheet(),fs=[['ordonnance_tornado.jpg','Que dit cette ordonnance pour Tornado ?'],['facture_fourrages_hurepoix.pdf','Où en sont les stocks de foin ?'],['engagements_ffe_compet.csv','Qui est engagé au concours de dimanche ?']];on(sh,'[data-f]',function(b){var f=fs[+b.getAttribute('data-f')];comp._file=f[0];inp.value=f[1];inp.placeholder='';sh.close();P.toast('Fichier joint : '+f[0],{icon:'attach'});inp.focus()})};
  function pick(id){AS.cur=id;$$('.pfa-hi',el).forEach(function(b){b.setAttribute('aria-current',b.getAttribute('data-cv')===id)});draw('top')}
  function newC(){var c={id:'cv'+Date.now(),title:'',when:'à l’instant',grp:'Aujourd’hui',msgs:[]};CONVS.unshift(c);AS.cur=c.id;$('.pfa-hl',el).innerHTML=histHTML();draw('top');if(!ctx.mobile)inp.focus()}
  $('.pfa-hl',el).addEventListener('click',function(e){var b=e.target.closest('[data-cv]');if(b)pick(b.getAttribute('data-cv'))});
  on(el,'[data-new]',newC);
  $('[data-hs]',el).oninput=function(){var q=norm(this.value);$$('.pfa-hi',el).forEach(function(b){b.style.display=norm(b.textContent).indexOf(q)>=0?'':'none'})};
  $('[data-hist]',el).onclick=function(){P.sheet({title:'Conversations',icon:'chat',body:'<div class="pfa-hl" style="padding:0;margin:-6px -8px">'+histHTML()+'</div>',foot:'<button class="btn pri block" data-n2>'+ICON('plus','sm')+'Nouvelle conversation</button>'});var sh=sheet();on(sh,'[data-cv]',function(b){sh.close();pick(b.getAttribute('data-cv'))});sh.querySelector('[data-n2]').onclick=function(){sh.close();newC()}};
  $('[data-more-c]',el).onclick=function(){var c=conv();P.sheet({title:'Cette conversation',icon:'chat',body:'<div class="card list">'+[['edit','Renommer la conversation','ren'],['download','Exporter en PDF','pdf'],['link','Partager avec l’équipe','share'],['shield','Voir les actions faites dans le journal','jr'],['trash','Supprimer la conversation','del']].map(function(x){return '<button class="li click pf-tap" data-o="'+x[2]+'" style="width:100%;text-align:left">'+ICON(x[0])+'<div class="grow t">'+x[1]+'</div>'+ICON('right','sm')+'</button>'}).join('')+'</div>'});
    var sh=sheet();on(sh,'[data-o]',function(b){var o=b.getAttribute('data-o');sh.close();if(o==='jr'){AS.tab='journal';P.rerender()}else if(o==='del'){var i=CONVS.indexOf(c);if(CONVS.length>1){CONVS.splice(i,1);AS.cur=CONVS[0].id;P.rerender();P.toast('Conversation supprimée',{undo:function(){CONVS.splice(i,0,c);AS.cur=c.id;P.rerender()}})}}else if(o==='ren'){c.title=(c.title||'Conversation')+' (renommée)';P.rerender();P.toast('Conversation renommée')}else P.toast(o==='pdf'?'Conversation exportée en PDF':'Lien de partage copié pour l’équipe',{icon:o==='pdf'?'download':'link'})})};
}

function renderAuto(el,ctx,seg){
  var L=D.aiAutomations,act=L.filter(function(a){return a.on}).length;
  el.innerHTML='<div class="pfa-head"><div><h1>Assistant</h1><div class="sub hide-s">'+act+' automatisations actives travaillent pour vous en arrière-plan.</div></div>'+seg+'</div>'+
   '<div class="stack rise" style="--g:14px"><div class="card pad hrow wrap" style="--g:14px"><span class="av sq lg" style="--c:var(--acc-pale);color:var(--acc)">'+ICON('repeat','lg')+'</span><div class="grow" style="min-width:220px"><div class="b" style="font-size:15px">Dites-le une fois, l’assistant s’en souvient</div><div class="s mut">« Chaque lundi, envoie-moi le point sur les impayés ». Une automatisation lit et prépare. Elle n’écrit jamais sans votre accord.</div></div><button class="btn pri" data-do="newauto">'+ICON('plus','sm')+'Créer une automatisation</button></div>'+
   '<div class="g2">'+L.map(function(a,i){return '<div class="card pfa-auto'+(a.fresh?' pop':'')+'"><div class="hd"><span class="av sq" style="--c:var(--acc-pale);color:var(--acc)">'+ICON(a.ic)+'</span><div class="grow"><div class="b">'+a.name+'</div><div class="hrow wrap" style="--g:6px;margin-top:5px"><span class="chip acc">'+ICON('clock','sm')+a.when+'</span><span class="chip">'+ICON(a.ch==='E-mail'?'mail':'bell','sm')+a.ch+'</span></div></div><button class="tog" role="switch" aria-checked="'+a.on+'" data-manual data-tg="'+i+'" title="Activer ou mettre en pause"></button></div>'+
     '<div class="s mut">'+a.what+'</div><dl class="pf-kv" style="font-size:12.5px"><dt>Destinataire</dt><dd>'+a.to+'</dd><dt>Dernier envoi</dt><dd>'+a.last+'</dd><dt>Prochain</dt><dd>'+(a.on?a.next:'En pause')+'</dd></dl>'+
     '<div class="hrow wrap" style="--g:8px"><button class="btn sm" data-see="'+i+'">'+ICON('eye','sm')+'Voir le dernier envoi</button><button class="btn sm ghost" data-run="'+i+'">'+ICON('play','sm')+'Lancer maintenant</button><button class="btn sm ghost icon" data-del="'+i+'" title="Supprimer l’automatisation" style="margin-left:auto">'+ICON('trash','sm')+'</button></div></div>'}).join('')+'</div></div>';
  L.forEach(function(a){a.fresh=false});
  on(el,'[data-tg]',function(b){var a=L[+b.getAttribute('data-tg')];a.on=!a.on;P.rerender();P.toast(a.on?'« '+a.name+' » est active':'« '+a.name+' » est en pause')});
  on(el,'[data-run]',function(b){var a=L[+b.getAttribute('data-run')];a.last='aujourd’hui à 9 h 41';logAI('Automatisation « '+a.name+' » lancée à la main','automatisation','L','read');P.rerender();P.toast('« '+a.name+' » envoyé à '+a.to)});
  on(el,'[data-del]',function(b){var i=+b.getAttribute('data-del'),a=L[i];L.splice(i,1);P.rerender();P.toast('Automatisation supprimée',{undo:function(){L.splice(i,0,a);P.rerender()}})});
  on(el,'[data-see]',function(b){var a=L[+b.getAttribute('data-see')],r=answer(a.q);P.sheet({title:a.name,icon:a.ic,wide:true,body:'<div class="hrow wrap" style="--g:6px;margin-bottom:14px"><span class="chip acc">'+ICON('clock','sm')+a.when+'</span><span class="chip">Envoyé '+a.last+'</span><span class="chip">À '+a.to+'</span></div><div class="pfa-txt" style="padding:0">'+r.text+'</div>'+(r.card?'<div class="card flat pfa-card">'+r.card+'</div>':''),foot:'<button class="btn" data-x2>Fermer</button><button class="btn pri" data-open>'+ICON('chat','sm')+'Continuer dans une discussion</button>'});
    var sh=sheet();sh.querySelector('[data-x2]').onclick=function(){sh.close()};sh.querySelector('[data-open]').onclick=function(){sh.close();var c={id:'cv'+Date.now(),title:a.name,when:'à l’instant',grp:'Aujourd’hui',qs:[a.q]};CONVS.unshift(c);AS.cur=c.id;AS.tab='chat';P.rerender()}});
  $('[data-do="newauto"]',el).onclick=function(){
    var MOD=['Chaque lundi, envoie-moi le point sur les impayés','Chaque vendredi, envoie à l’équipe les soins à venir','Tous les matins, dis-moi quelles reprises ne sont pas pleines','Le 1er de chaque mois, liste les licences à renouveler','Chaque lundi, préviens-moi si un stock passe sous son seuil'];
    P.sheet({title:'Créer une automatisation',icon:'repeat',body:'<div class="stack" style="--g:14px"><label class="field"><span>Décrivez ce que vous voulez, avec vos mots</span><textarea class="in" data-txt rows="3" placeholder="Chaque lundi, envoie-moi le point sur les impayés">Chaque lundi, envoie-moi le point sur les impayés</textarea></label>'+
      '<div><div class="xs mut" style="margin-bottom:6px">Ou partez d’un modèle</div><div class="hrow wrap" style="--g:6px">'+MOD.map(function(m,i){return '<button class="tag" data-manual data-mod="'+i+'">'+m+'</button>'}).join('')+'</div></div><div data-parsed></div></div>',
      foot:'<button class="btn" data-und>'+ICON('assistant','sm')+'Comprendre ma demande</button><button class="btn pri" data-mk disabled>Créer l’automatisation</button>'});
    var sh=sheet(),txt=sh.querySelector('[data-txt]'),box=sh.querySelector('[data-parsed]'),r=null;
    function parse(){r=answer(/chaque|tous les|le 1er/i.test(txt.value)?txt.value:'chaque lundi '+txt.value);var p=r.actions&&r.actions[0]&&r.actions[0].preview;if(!p){r=answer('chaque lundi impayés');p=r.actions[0].preview}
      box.innerHTML='<div class="pfa-prev pop"><div class="pfa-ph">'+ICON('assistant','sm')+'<span>Ce que j’ai compris</span><span class="chip acc">À vérifier</span></div><div class="pfa-pb"><h4>'+p.title+'</h4><dl class="pf-kv">'+p.rows.map(function(x){return '<dt>'+x[0]+'</dt><dd>'+x[1]+'</dd>'}).join('')+'</dl></div></div>';sh.querySelector('[data-mk]').disabled=false}
    on(sh,'[data-mod]',function(b){txt.value=MOD[+b.getAttribute('data-mod')];parse()});
    sh.querySelector('[data-und]').onclick=parse;txt.oninput=function(){sh.querySelector('[data-mk]').disabled=true;box.innerHTML=''};
    sh.querySelector('[data-mk]').onclick=function(){r.actions[0].run();sh.close();P.rerender()};parse()};
}

function renderJournal(el,ctx,seg){
  var L=D.aiLog,w=L.filter(function(x){return x.kind==='E'}),f=AS.jf,list=L.filter(function(x){return f==='all'||(f==='E'?x.kind==='E':f==='L'?x.kind==='L':x.src.indexOf('MCP')>=0)});
  var ST={ok:['Confirmée par ','ok'],cancel:['Refusée ou annulée','bad'],read:['Lecture seule',''],wait:['En attente de votre accord','warn']},g=null,h='';
  list.forEach(function(x,i){if(x.d!==g){g=x.d;h+='<div class="pfa-jd">'+g+'</div>'}var s=ST[x.st],p=D.person(x.who);
    h+='<div class="pfa-jr'+(x.fresh?' pop':'')+'"><span class="tm">'+x.t+'</span><span class="av sq sm" style="--c:var(--'+(x.kind==='E'?'acc-pale':'bg-2')+');color:var(--'+(x.kind==='E'?'acc':'mut')+')">'+ICON(x.kind==='E'?'edit':'eye','sm')+'</span><div style="min-width:0"><div class="s b" style="font-size:13.5px">'+x.what+'</div><div class="xs mut hrow wrap" style="--g:6px;margin-top:2px"><span class="pf-mono" style="font-size:11px">'+x.tool+'</span><span>·</span><span>'+x.src+' pour '+p.first+' '+p.last+'</span></div></div>'+
     '<div class="r">'+U.chip(s[0]+(x.st==='ok'?p.first:''),s[1],true)+(x.st==='wait'?'<button class="btn sm pri" data-val="'+L.indexOf(x)+'">Voir et valider</button>':x.undo&&x.st==='ok'?'<button class="btn sm ghost" data-un="'+L.indexOf(x)+'">'+ICON('refresh','sm')+'Annuler</button>':'')+'</div></div>'});
  L.forEach(function(x){x.fresh=false});
  el.innerHTML='<div class="pfa-head"><div><h1>Assistant</h1><div class="sub hide-s">Tout ce que l’IA a lu ou fait dans l’écurie, que ce soit ici ou depuis Claude et ChatGPT.</div></div>'+seg+'</div>'+
   '<div class="stack rise" style="--g:14px"><div class="g4">'+[[L.length,'demandes tracées','chat'],[w.filter(function(x){return x.st==='ok'}).length,'écritures confirmées','checkc'],[w.filter(function(x){return x.st==='cancel'}).length,'refusées ou annulées','xc'],[0,'écriture sans confirmation','shield']].map(function(k){return '<div class="card pad hrow" style="--g:12px;padding:14px 16px"><span class="av sq" style="--c:var(--surface-2);color:var(--mut);box-shadow:inset 0 0 0 1px var(--line)">'+ICON(k[2])+'</span><div><div class="disp num" style="font-size:22px;font-weight:700;line-height:1.1"><span data-count="'+k[0]+'">'+k[0]+'</span></div><div class="xs mut">'+k[1]+'</div></div></div>'}).join('')+'</div>'+
   '<div class="card"><div class="ch" style="padding-bottom:12px;flex-wrap:wrap"><h3>Journal des actions de l’IA</h3><div class="hrow wrap" style="--g:8px">'+U.seg([['all','Tout'],['E','Écritures'],['L','Lectures'],['mcp','Via MCP']],f,'data-jf')+'<button class="btn sm" data-exp>'+ICON('download','sm')+'Exporter</button></div></div>'+(h||U.empty('shield','Aucune action dans ce filtre'))+'</div>'+
   '<div class="note">'+ICON('shield','sm')+'<span>Chaque écriture porte la mention « via assistant » sur la fiche concernée. Le journal est conservé 12 mois et ne peut pas être modifié.</span></div></div>';
  on(el,'[data-jf]',function(b){AS.jf=b.getAttribute('data-jf');P.rerender()});
  on(el,'[data-un]',function(b){var x=L[+b.getAttribute('data-un')];x.st='cancel';x.undo=false;P.rerender();P.toast('Action annulée : « '+x.what.replace(/^A /,'')+' »',{icon:'refresh'})});
  on(el,'[data-val]',function(b){var x=L[+b.getAttribute('data-val')];P.sheet({title:'Valider la commande',icon:'truck',body:'<div class="pfa-prev"><div class="pfa-ph">'+ICON('shield','sm')+'<span>Aperçu avant exécution</span><span class="chip acc">Rien n’est encore fait</span></div><div class="pfa-pb"><h4>Commande chez Litière Pro</h4><dl class="pf-kv"><dt>Article</dt><dd>60 sacs de copeaux dépoussiérés</dd><dt>Montant</dt><dd>'+F.eur(690)+' HT</dd><dt>Livraison</dt><dd>Jeudi 19 novembre, cour principale</dd><dt>Préparée par</dt><dd>L’automatisation « Stocks sous le seuil »</dd></dl></div></div>',foot:'<button class="btn" data-n>Refuser</button><button class="btn pri" data-y>Envoyer la commande</button>'});
    var sh=sheet();sh.querySelector('[data-y]').onclick=function(){x.st='ok';x.what='A commandé 60 sacs de copeaux chez Litière Pro';sh.close();P.rerender();P.toast('Commande envoyée à Litière Pro')};sh.querySelector('[data-n]').onclick=function(){x.st='cancel';sh.close();P.rerender();P.toast('Commande refusée, rien n’a été envoyé',{icon:'xc'})}});
  $('[data-exp]',el).onclick=function(){P.toast('Journal exporté au format CSV ('+list.length+' lignes)',{icon:'download'})};
}

P.mod({id:'assistant',role:'gerant',group:'Plateforme',title:'Assistant',icon:'assistant',n:10,phoneTitle:'Assistant',short:'Assistant',render:renderAssistant});
P.pf.AS=AS;
})();

/* =====================================================================
   Écran · Connecteurs : serveur MCP, catalogue, API publique et webhooks
   ===================================================================== */
(function(){
var D=P.D,F=P.fmt,U=P.ui,C=P.chart,$=P.$,$$=P.$$,esc=F.esc,X=P.pf,on=X.on,lg=X.lg,clip=X.clip,pre=X.pre,sheet=X.sheet,sum=X.sum,norm=X.norm;
var MCP_URL='https://mcp.piaffe.fr/mcp',API_URL='https://api.piaffe.fr/v1';

/* ---------- Catalogue (issu de l’audit des intégrations) ---------- */
var CATS=['Paiement','Banque','Comptabilité','Facture électronique','Signature','RH et paie','Communication','Calendrier','Caméras et capteurs','Fédéral et public','Reprise de données','IA et plateforme'];
var CC={'Paiement':'var(--c1)','Banque':'var(--c2)','Comptabilité':'var(--c7)','Facture électronique':'var(--c3)','Signature':'var(--c5)','RH et paie':'var(--c6)','Communication':'var(--c4)','Calendrier':'var(--c3)','Caméras et capteurs':'var(--c2)','Fédéral et public':'var(--c1)','Reprise de données':'var(--c5)','IA et plateforme':'var(--c1)'};
function K(n,cat,l,dir,st,d,sync,ic){return {id:norm(n).replace(/[^a-z0-9]+/g,'-'),n:n,cat:cat,l:l,dir:dir,st:st,d:d,sync:sync||[],ic:ic}}
D.connectors=D.connectors||[
 K('Stripe','Paiement','St','B','on','Carte bancaire et prélèvement SEPA en ligne, liens de paiement.',['Paiements et remboursements','Mandats SEPA','Litiges et rejets']),
 K('GoCardless','Paiement','Go','B','on','Mandats et prélèvements SEPA récurrents pour les forfaits et les pensions.',['Mandats signés','Échéancier des prélèvements','Rejets']),
 K('SumUp','Paiement','Su','B','on','Terminal de paiement de l’accueil et du club-house, relié à la caisse.',['Ventes au comptoir','Tickets de caisse']),
 K('Chèque-Vacances Connect','Paiement','CV','B','on','Chèques-vacances dématérialisés de l’ANCV, acceptés en ligne.',['Paiements ANCV','Bordereaux de remise']),
 K('Chèques et coupons sport','Paiement','Ch','S','on','Bordereaux de remise de chèques, chèques-vacances papier et coupons sport.',['Bordereaux PDF','Suivi des remises'],'doc'),
 K('Remise SEPA en fichier','Paiement','Sp','S','on','Fichier de prélèvements pain.008 à déposer chez votre banque.',['Fichier pain.008','Retour des rejets'],'bank'),
 K('Pass’Sport','Paiement','PS','B','assist','Codes Pass’Sport saisis à l’inscription, liste de déclaration prête pour le portail de l’État.',['Codes acceptés','Liste à déclarer']),
 K('Mollie','Paiement','Mo','B','off','Paiement en ligne européen, carte et virement instantané.',['Paiements','Remboursements']),
 K('Zettle','Paiement','Ze','B','off','Terminal de paiement mobile pour les concours et les stages.',['Ventes au comptoir']),
 K('Alma','Paiement','Al','B','off','Paiement en trois ou quatre fois pour les forfaits annuels.',['Échéanciers','Paiements reçus']),
 K('Qonto','Banque','Qo','E','on','Vos opérations bancaires arrivent seules et se rapprochent des factures.',['Opérations du compte','Rapprochement automatique','Pièces justificatives']),
 K('Bridge','Banque','Br','E','off','Agrégation bancaire : plus de 300 banques françaises en lecture seule.',['Opérations','Soldes']),
 K('Powens','Banque','Pw','E','off','Agrégation bancaire en lecture seule, agréée en France.',['Opérations','Soldes']),
 K('Relevés bancaires en fichier','Banque','Rb','E','on','Import de relevés CSV, OFX ou CAMT.053 quand votre banque n’est pas reliée.',['Opérations importées'],'upload'),
 K('Pennylane','Comptabilité','Pe','B','on','Factures, encaissements et pièces envoyés à votre comptable en continu.',['Factures et avoirs','Encaissements','Plan comptable et TVA']),
 K('Export FEC','Comptabilité','FEC','S','on','Fichier des écritures comptables, lisible par tous les logiciels de comptabilité.',['Écritures de la période'],'download'),
 K('Tiime','Comptabilité','Ti','S','off','Écritures de ventes et pièces envoyées à Tiime.',['Factures','Encaissements']),
 K('Cegid','Comptabilité','Ce','S','off','Export au format Cegid Loop et Quadra pour les cabinets comptables.',['Écritures','Journal de ventes']),
 K('Sage','Comptabilité','Sa','S','off','Export des écritures au format Sage.',['Écritures','Journal de ventes']),
 K('EBP','Comptabilité','EB','S','off','Export des écritures au format EBP.',['Écritures','Journal de ventes']),
 K('Isagri et Agiris','Comptabilité','Is','S','off','Comptabilité et paie agricoles, très présentes dans la filière équine.',['Écritures','Variables de paie']),
 K('QuickBooks','Comptabilité','QB','S','off','Export des factures et des encaissements vers QuickBooks.',['Factures','Encaissements']),
 K('Plateforme agréée de facturation','Facture électronique','Fx','B','on','Réception des factures électroniques de vos fournisseurs. Émission en Factur-X prête pour septembre 2027.',['Factures fournisseurs reçues','Émission Factur-X','E-reporting des ventes']),
 K('Chorus Pro','Facture électronique','CP','S','off','Factures aux collectivités (mairies, centres de loisirs) via la plateforme agréée.',['Factures déposées','Statuts de traitement']),
 K('Yousign','Signature','Yo','B','on','Signature électronique des contrats de pension, d’inscription et de travail.',['Contrats envoyés','Signatures et preuves','Relances']),
 K('Docusign','Signature','Do','B','off','Signature électronique pour les clubs déjà équipés.',['Contrats envoyés','Signatures']),
 K('Dropbox Sign','Signature','DS','B','off','Signature électronique simple, sans compte pour le signataire.',['Contrats envoyés','Signatures']),
 K('PayFit','RH et paie','Pf','B','on','Heures, absences et primes envoyées chaque mois. Convention IDCC 7026.',['Variables de paie','Absences et congés','Nouveaux salariés']),
 K('Silae','RH et paie','Si','S','off','Export des variables de paie pour les cabinets qui utilisent Silae.',['Variables de paie']),
 K('Export de paie','RH et paie','Xp','S','on','Heures normales, supplémentaires et absences en CSV ou Excel.',['Variables de paie'],'download'),
 K('Lucca','RH et paie','Lu','B','off','Congés et absences synchronisés avec le planning de l’équipe.',['Absences','Soldes de congés']),
 K('Combo','RH et paie','Co','B','off','Planning du personnel et pointages.',['Plannings','Pointages']),
 K('Skello','RH et paie','Sk','B','off','Planning du personnel et pointages.',['Plannings','Pointages']),
 K('Brevo','Communication','Bv','S','on','E-mails et SMS envoyés depuis Piaffe, avec le suivi des remises.',['E-mails transactionnels','Campagnes','SMS'],'mail'),
 K('WhatsApp Business','Communication','Wa','B','on','Rappels de reprise et réponses des familles dans la messagerie de Piaffe.',['Messages envoyés','Réponses reçues'],'chat'),
 K('Notifications push','Communication','Np','S','on','Notifications sur l’application des adhérents et de l’équipe.',['iPhone, Android et navigateur'],'bell'),
 K('Twilio','Communication','Tw','S','off','SMS de secours et numéros dédiés.',['SMS']),
 K('Google Agenda','Calendrier','GA','B','on','Les reprises et les soins apparaissent dans l’agenda de chacun.',['Reprises et stages','Rendez-vous de soins','Indisponibilités des coachs'],'planning'),
 K('Apple Calendrier','Calendrier','iC','S','on','Flux d’agenda personnel par abonnement, pour iPhone et Mac.',['Flux ICS par personne'],'planning'),
 K('Outlook et Microsoft 365','Calendrier','Ou','B','off','Agenda des reprises et des rendez-vous dans Outlook.',['Reprises','Rendez-vous'],'planning'),
 K('Caméras ONVIF et RTSP','Caméras et capteurs','Cam','E','on','Vos caméras IP existantes, toutes marques, en direct dans Piaffe.',['8 caméras reliées','Direct et relecture 30 jours','Journal des visionnages'],'camera'),
 K('Capteurs par MQTT','Caméras et capteurs','Mq','E','on','Abreuvoirs, sondes et balances envoient leurs mesures à Piaffe.',['6 capteurs reliés','Alertes paramétrables'],'sensor'),
 K('Abreuvoirs, balances et sondes','Caméras et capteurs','Ab','E','on','Consommation d’eau, poids, température et humidité par box.',['Mesures en continu','Seuils d’alerte'],'drop'),
 K('Seaver','Caméras et capteurs','Se','E','off','Sangle connectée : durée, allures et sauts de chaque séance.',['Séances de travail']),
 K('Equisense','Caméras et capteurs','Eq','E','off','Capteur de séance : symétrie, cadence, temps par allure.',['Séances de travail']),
 K('Arioneo','Caméras et capteurs','Ar','E','off','Equimetre : fréquence cardiaque et vitesse à l’entraînement.',['Séances de travail','Fréquence cardiaque']),
 K('Nightwatch','Caméras et capteurs','Ni','E','off','Licol connecté de surveillance des coliques.',['Alertes de détresse']),
 K('Contrôle d’accès','Caméras et capteurs','Ac','B','off','Portail et sellerie ouverts selon les droits de chacun.',['Ouvertures','Badges'],'lock'),
 K('Domotique','Caméras et capteurs','Dm','B','off','Éclairage de carrière et arrosage pilotés depuis le planning.',['Éclairage','Relais'],'bolt'),
 K('FFE Club SIF, licences','Fédéral et public','FFE','B','agr','Télétransmission des licences réservée aux solutions agréées par la FFE. L’agrément de Piaffe est à obtenir.',['Prise et renouvellement de licences']),
 K('FFE Club SIF, fichiers','Fédéral et public','FFE','E','assist','Import de vos exports de licenciés et de concours club. Piaffe prépare les lots, vous les saisissez dans votre espace FFE.',['Fichier des licenciés','Concours club (XML)','Lots de licences à saisir']),
 K('FFE Connect','Fédéral et public','FC','B','agr','Connexion des cavaliers avec leur compte FFE : licence, galops et assurance remontent dans leur fiche. Ouverture soumise à l’accord de la FFE, demande déposée.',['Connexion avec le compte FFE','Licence et galops du cavalier','Assurance fédérale']),
 K('FFE Compet','Fédéral et public','FFE','E','assist','Import des engagements et des résultats exportés depuis FFE Compet (CSV ou XLS).',['Engagements','Listes de départ','Résultats']),
 K('Déclaration de concours','Fédéral et public','DUC','S','assist','Piaffe prépare les données de votre concours, la déclaration se fait sur le site de la FFE.',['Récapitulatif prêt à saisir']),
 K('IFCE, données ouvertes','Fédéral et public','If','E','on','La fiche d’un cheval se remplit à partir de son numéro SIRE : nom, race, robe, origines.',['Identité des équidés','Généalogie']),
 K('SIRE, démarches','Fédéral et public','SI','S','on','Rappels des démarches à faire : lieu de détention, changement de propriétaire.',['Rappels et liens vers votre espace SIRE']),
 K('Registre d’élevage','Fédéral et public','Re','S','on','Registre tenu à jour par les soins saisis, archivé en PDF chaque trimestre.',['Export PDF trimestriel'],'doc'),
 K('Kavalog','Reprise de données','Ka','E','assist','Reprise de vos exports Kavalog : la correspondance des colonnes est déjà connue.',['Adhérents et familles','Chevaux','Forfaits et soldes','Factures ouvertes']),
 K('Equimondo','Reprise de données','Em','E','assist','Reprise de vos exports Equimondo, avec détection des doublons.',['Adhérents','Chevaux','Réservations']),
 K('Equionline','Reprise de données','Eo','E','assist','Reprise de vos exports Equionline : cavaliers, chevaux, forfaits en cours et soldes, avec la correspondance des colonnes déjà prête.',['Cavaliers et familles','Chevaux','Forfaits et soldes','Historique des réservations']),
 K('GCE, Horse-Manager et autres','Reprise de données','Au','E','assist','Tout logiciel qui exporte en Excel ou en CSV. Notre équipe vous aide gratuitement.',['Adhérents','Chevaux','Factures']),
 K('AssoConnect et HelloAsso','Reprise de données','As','E','assist','Reprise des adhésions et des paiements depuis un logiciel d’association.',['Adhérents','Adhésions']),
 K('Excel et CSV','Reprise de données','Xl','E','on','Glissez un fichier : l’IA reconnaît les colonnes et repère les doublons.',['Tous vos tableaux'],'grid'),
 K('Photos et PDF','Reprise de données','Ph','E','on','Photo d’un tableau, d’un cahier ou d’un livret : l’IA le transforme en données.',['Tableaux papier','Livrets et factures'],'image'),
 K('Serveur MCP Piaffe','IA et plateforme','MCP','B','on','Votre écurie devient interrogeable par Claude, ChatGPT ou tout autre assistant.',['36 outils','10 ressources','7 demandes prêtes'],'mcp'),
 K('Claude','IA et plateforme','Cl','B','on','Relié par le serveur MCP avec les droits de Claire Morel.',['Lecture de l’écurie','Écritures validées dans Piaffe']),
 K('ChatGPT','IA et plateforme','GP','B','on','Relié par le serveur MCP avec les droits de Nadia Benali.',['Lecture du club']),
 K('API REST publique','IA et plateforme','API','B','on','Toutes vos données accessibles par programme, avec des clés à portée limitée.',['32 ressources','Bac à sable'],'api'),
 K('Webhooks','IA et plateforme','Wh','S','on','Piaffe prévient vos outils dès qu’un événement se produit.',['18 événements','Signature et rejeu'],'webhook'),
 K('Zapier','IA et plateforme','Za','B','off','Reliez Piaffe à des milliers d’applications sans écrire de code.',['Déclencheurs','Actions']),
 K('Make','IA et plateforme','Mk','B','off','Scénarios d’automatisation visuels à partir des événements de Piaffe.',['Déclencheurs','Actions']),
 K('n8n','IA et plateforme','n8','B','off','Automatisation libre, que vous pouvez héberger vous-même.',['Déclencheurs','Actions'])];
var STL={on:['Connecté','ok'],off:['Disponible','line'],assist:['Export assisté','acc'],agr:['Agrément à obtenir','warn']};
var DIRL={E:['Vers Piaffe','download'],S:['Depuis Piaffe','upload'],B:['Dans les deux sens','swap']};
function klogo(k,cls){return lg(k.ic?ICON(k.ic):k.l,CC[k.cat],cls)}

/* ---------- Outils MCP (36, issus de l’audit) ---------- */
function T(n,dom,d,w,cf,roles,args){return {n:n,dom:dom,d:d,w:w,cf:cf,roles:roles,args:args||'{}',on:true}}
var TOOLS=D.mcpTools=D.mcpTools||[
 T('ecurie_apercu','Écurie','Carte d’identité de l’écurie : effectifs, occupation des boxes, modules actifs.',0,0,'Tous'),
 T('ecurie_tableau_de_bord','Écurie','Indicateurs sur une période : chiffre d’affaires, impayés, remplissage.',0,0,'Gérant, comptable','{"periode":"2026-11"}'),
 T('boxes_occupation','Écurie','Plan d’occupation des boxes et des paddocks, disponibilités à une date.',0,0,'Gérant, soigneur','{"date":"2026-11-30"}'),
 T('taches_lister_ou_creer','Écurie','Tâches d’entretien et de maintenance, création d’une tâche.',1,1,'Gérant, soigneur','{"titre":"Réparer la lisse","zone":"Paddock d’hiver"}'),
 T('adherents_rechercher','Adhérents','Recherche par nom, famille, niveau, licence ou forfait.',0,0,'Gérant, accueil, coach','{"licence":"a_renouveler"}'),
 T('adherent_fiche','Adhérents','Famille, forfaits, crédits, solde, galop, documents à jour ou manquants.',0,0,'Gérant, accueil, coach','{"id":"m001"}'),
 T('adherent_creer_ou_modifier','Adhérents','Crée ou modifie un adhérent ou un représentant légal.',1,1,'Gérant, accueil','{"prenom":"Zoé","nom":"Laurent","galop":3}'),
 T('adherent_documents_manquants','Adhérents','Pièces manquantes ou expirées : licence, autorisation parentale, contrat.',0,0,'Gérant, accueil'),
 T('cartes_solde','Adhérents','Soldes des cartes de séances et cartes bientôt expirées.',0,0,'Gérant, accueil, adhérent','{"expire_avant":"2026-12-25"}'),
 T('chevaux_rechercher','Chevaux et santé','Recherche par nom, SIRE, propriétaire, box ou statut.',0,0,'Gérant, soigneur, coach, propriétaire','{"statut":"pension"}'),
 T('cheval_fiche','Chevaux et santé','Identité, propriétaire, pension, ration, charge de travail, prochains soins.',0,0,'Gérant, soigneur, coach, propriétaire','{"id":"h01"}'),
 T('cheval_creer_ou_modifier','Chevaux et santé','Crée ou modifie un cheval, pré-rempli depuis le numéro SIRE.',1,1,'Gérant','{"sire":"25025960412345X"}'),
 T('cheval_sante_historique','Chevaux et santé','Registre d’élevage du cheval : vaccins, vermifuges, maréchal, vétérinaire.',0,0,'Gérant, soigneur, propriétaire','{"id":"h04"}'),
 T('cheval_soin_enregistrer','Chevaux et santé','Ajoute un soin au registre, daté et non supprimable.',1,1,'Gérant, soigneur','{"id":"h27","soin":"vermifuge","produit":"ivermectine"}'),
 T('sante_echeances','Chevaux et santé','Soins à venir ou en retard pour toute l’écurie.',0,0,'Gérant, soigneur','{"jours":21}'),
 T('cheval_charge_travail','Chevaux et santé','Heures de travail par cheval, alertes de surcharge ou de repos insuffisant.',0,0,'Gérant, coach','{"periode":"semaine"}'),
 T('pension_contrats_lister','Pensions','Contrats de pension et de demi-pension : tarif, échéance, signature.',0,0,'Gérant, comptable'),
 T('pension_contrat_creer','Pensions','Prépare un contrat et l’envoie en signature électronique.',1,1,'Gérant','{"cheval":"h41","box":"B45","formule":"pension_complete"}'),
 T('planning_consulter','Planning et reprises','Reprises, stages, réservations d’installations et soins sur une période.',0,0,'Tous, selon leurs droits','{"du":"2026-11-17","au":"2026-11-23"}'),
 T('cours_places_disponibles','Planning et reprises','Créneaux où il reste des places, par niveau et discipline.',0,0,'Tous','{"niveau":"galop_3","jour":"mercredi"}'),
 T('cours_inscrire','Planning et reprises','Inscrit un cavalier à une séance et débite sa carte si besoin.',1,1,'Gérant, accueil, adhérent','{"adherent":"m044","seance":"l23"}'),
 T('cours_annuler_ou_reporter','Planning et reprises','Annule ou reporte une séance et prépare le message aux inscrits.',1,1,'Gérant, coach','{"seance":"l05","motif":"gel","report":"2026-11-21T10:00"}'),
 T('cours_presences_saisir','Planning et reprises','Enregistre les présences et la monte : quel cavalier sur quel cheval.',1,1,'Coach, accueil','{"seance":"l05","presents":9}'),
 T('factures_rechercher','Facturation','Factures et avoirs par client, période ou statut.',0,0,'Gérant, comptable, adhérent','{"statut":"en_retard"}'),
 T('facture_creer_brouillon','Facturation','Prépare une facture en brouillon, jamais émise directement.',1,1,'Gérant, comptable','{"client":"m001","lignes":[{"prestation":"pension_complete","mois":"2026-12"}]}'),
 T('facture_emettre','Facturation','Émet un brouillon : numérotation définitive et irréversible.',1,2,'Gérant, comptable','{"brouillon":"B-2026-0412"}'),
 T('impayes_lister','Facturation','Impayés par ancienneté, avec l’historique des relances.',0,0,'Gérant, comptable','{"anciennete_min_jours":15}'),
 T('relance_preparer','Facturation','Rédige les relances d’impayés, envoi seulement après validation.',1,1,'Gérant, comptable','{"factures":"toutes_en_retard"}'),
 T('encaissement_enregistrer','Facturation','Enregistre un chèque, des espèces ou un virement reçu. Ne débite jamais une carte.',1,1,'Gérant, accueil, comptable','{"facture":"F-2026-1173","mode":"cheque","montant":520}'),
 T('prelevements_prochains','Facturation','Échéancier des prélèvements à venir et rejets récents.',0,0,'Gérant, comptable'),
 T('compta_export_generer','Facturation','Génère un export d’écritures (FEC ou format du logiciel) pour une période.',0,0,'Gérant, comptable','{"format":"fec","periode":"2026-11"}'),
 T('equipe_planning','Équipe et concours','Planning du personnel, absences et heures pointées.',0,0,'Gérant, salarié (le sien)','{"semaine":"2026-W47"}'),
 T('equipe_heures_exporter','Équipe et concours','Prépare l’export mensuel des variables de paie.',0,0,'Gérant','{"mois":"2026-11"}'),
 T('concours_engagements','Équipe et concours','Concours à venir, couples engagés, frais à refacturer.',0,0,'Gérant, coach','{"concours":"k1"}'),
 T('message_preparer','Messages','Rédige un e-mail, un SMS ou une notification pour un groupe et renvoie un aperçu.',1,1,'Gérant, accueil, coach','{"cible":"seance:l05","canal":"sms"}'),
 T('message_envoyer','Messages','Envoie un message préparé et validé. Double confirmation au-delà de 20 destinataires.',1,2,'Gérant, accueil','{"message":"msg_8Kq2"}')];
var TDOM=['Écurie','Adhérents','Chevaux et santé','Pensions','Planning et reprises','Facturation','Équipe et concours','Messages'];
var TIC={'Écurie':'stable','Adhérents':'members','Chevaux et santé':'horse','Pensions':'owner','Planning et reprises':'planning','Facturation':'invoice','Équipe et concours':'team','Messages':'chat'};
var SCOPES=[['lecture:club','Adhérents, chevaux, planning'],['lecture:finance','Factures, impayés, exports'],['lecture:sante','Registre et soins des chevaux'],['lecture:rh','Planning et heures de l’équipe'],['ecriture:planning','Inscriptions, reports, présences'],['ecriture:club','Fiches adhérents et chevaux, soins'],['ecriture:finance','Brouillons, émission, encaissements'],['ecriture:messages','Préparer et envoyer des messages']];
var MROLES=[['Gérant',[1,1,1,1,1,1,1,1]],['Accueil',[1,0,0,0,1,1,0,1]],['Coach',[1,0,0,0,1,0,0,1]],['Soigneur',[1,0,1,0,0,1,0,0]],['Comptable',[0,1,0,1,0,0,1,0]],['Propriétaire',[1,0,1,0,0,0,0,0]],['Adhérent ou parent',[1,0,0,0,1,0,0,0]]];
D.mcpClients=D.mcpClients||[
 {id:'mc1',n:'Claude',l:'Cl',c:'var(--c4)',user:'s01',sc:[0,1,2,3,4,7],last:'il y a 4 min',calls:214,since:'2 octobre'},
 {id:'mc2',n:'ChatGPT',l:'GP',c:'var(--c7)',user:'s09',sc:[0],last:'hier à 16 h 20',calls:61,since:'21 octobre'},
 {id:'mc3',n:'Gemini',l:'Ge',c:'var(--c5)',user:'s04',sc:[0,4],last:'vendredi à 18 h 02',calls:17,since:'9 novembre'}];
D.mcpCalls=D.mcpCalls||[
 {t:'9 h 37',cl:'Claude',who:'s01',tool:'impayes_lister',args:'{"anciennete_min_jours":15}',res:'9 factures renvoyées',ms:212,st:'ok'},
 {t:'9 h 37',cl:'Claude',who:'s01',tool:'ecurie_apercu',args:'{}',res:'Écurie des Tilleuls, 44 boxes sur 46',ms:88,st:'ok'},
 {t:'9 h 14',cl:'Claude',who:'s01',tool:'message_envoyer',args:'{"message":"msg_8Kq2"}',res:'9 destinataires, validé par Claire',ms:640,st:'conf'},
 {t:'9 h 14',cl:'Claude',who:'s01',tool:'cours_annuler_ou_reporter',args:'{"seance":"l05","motif":"gel"}',res:'Aperçu validé par Claire dans Piaffe',ms:1480,st:'conf'},
 {t:'9 h 13',cl:'Claude',who:'s01',tool:'planning_consulter',args:'{"du":"2026-11-17","au":"2026-11-17"}',res:'4 reprises',ms:131,st:'ok'},
 {t:'Hier, 16 h 21',cl:'ChatGPT',who:'s09',tool:'factures_rechercher',args:'{"statut":"en_retard"}',res:'Refusé : droit lecture:finance absent',ms:41,st:'no'},
 {t:'Hier, 16 h 20',cl:'ChatGPT',who:'s09',tool:'adherent_documents_manquants',args:'{}',res:'23 pièces manquantes',ms:187,st:'ok'},
 {t:'Ven., 18 h 02',cl:'Gemini',who:'s04',tool:'cours_presences_saisir',args:'{"seance":"l18","presents":9}',res:'Aperçu validé par Thomas dans Piaffe',ms:910,st:'conf'},
 {t:'Ven., 18 h 01',cl:'Gemini',who:'s04',tool:'cheval_charge_travail',args:'{"periode":"semaine"}',res:'20 chevaux, 3 alertes',ms:164,st:'ok'}];
D.apiKeys=D.apiKeys||[
 {id:'k1',n:'Site web du club, planning public',pre:'pk_live_7Fq2',sc:['lecture:club'],made:'12 sept.',last:'il y a 2 min',exp:'Sans expiration',st:'on',calls:1204},
 {id:'k2',n:'Cabinet Fidélis, export comptable',pre:'pk_live_Xa91',sc:['lecture:finance'],made:'3 oct.',last:'hier à 23 h 00',exp:'Expire le 3 janv.',st:'on',calls:46},
 {id:'k3',n:'Abreuvoirs connectés, envoi des mesures',pre:'pk_live_m8Kd',sc:['ecriture:mesures'],made:'18 oct.',last:'il y a 40 s',exp:'Sans expiration',st:'on',calls:592},
 {id:'k4',n:'Script de test de Thomas',pre:'pk_test_0bZt',sc:['lecture:club','ecriture:planning'],made:'28 oct.',last:'2 nov.',exp:'Révoquée le 2 nov.',st:'off',calls:0}];
var EVENTS=['adherent.cree','adherent.modifie','cheval.arrive','cheval.parti','inscription.creee','inscription.annulee','seance.annulee','presence.saisie','facture.emise','facture.payee','paiement.echoue','prelevement.rejete','contrat.signe','soin.enregistre','soin.en_retard','carte.epuisee','document.expire','mesure.alerte'];
D.webhooks=D.webhooks||[
 {id:'w1',n:'Comptabilité du cabinet',url:'https://hooks.fidelis-compta.example/piaffe',ev:['facture.emise','facture.payee','prelevement.rejete'],ok:99.6,last:'il y a 12 min',on:true},
 {id:'w2',n:'Alertes soins vers le groupe WhatsApp',url:'https://n8n.ecurie-tilleuls.example/webhook/soins',ev:['soin.en_retard','mesure.alerte'],ok:100,last:'il y a 31 min',on:true},
 {id:'w3',n:'Site web du club',url:'https://www.ecurie-tilleuls.example/api/piaffe',ev:['inscription.creee','seance.annulee','adherent.cree'],ok:92.1,last:'il y a 1 h',on:true}];
D.webhookLog=D.webhookLog||[
 {t:'9 h 29',ev:'facture.payee',w:'w1',code:200,ms:184,tr:1,id:'evt_3Nq81aXt'},
 {t:'9 h 10',ev:'mesure.alerte',w:'w2',code:200,ms:96,tr:1,id:'evt_3Nq7zP0c'},
 {t:'8 h 47',ev:'inscription.creee',w:'w3',code:500,ms:3004,tr:3,id:'evt_3Nq7mB2k',next:'nouvel essai dans 8 min'},
 {t:'8 h 02',ev:'facture.emise',w:'w1',code:200,ms:201,tr:1,id:'evt_3Nq6eR5d'},
 {t:'7 h 58',ev:'seance.annulee',w:'w3',code:200,ms:412,tr:2,id:'evt_3Nq6c11v'},
 {t:'Hier, 19 h 14',ev:'prelevement.rejete',w:'w1',code:200,ms:176,tr:1,id:'evt_3Nq1kLm9'},
 {t:'Hier, 17 h 30',ev:'soin.en_retard',w:'w2',code:200,ms:88,tr:1,id:'evt_3Nq0yT4a'}];

P.css(`
.pfc-hero{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1.04fr);gap:26px;padding:28px;overflow:hidden;align-items:center}
.pfc-hero .glow{position:absolute;left:-90px;bottom:-120px;width:340px;height:340px;border-radius:50%;background:radial-gradient(circle,color-mix(in srgb,var(--strass) 34%,transparent),transparent 66%);pointer-events:none}
.pfc-hl{display:flex;flex-direction:column;gap:16px;position:relative;min-width:0}
.pfc-hero h2{font-size:34px;line-height:1.04;letter-spacing:-.04em;color:var(--navy-ink)}
.pfc-hero p{font-size:15px;line-height:1.5;color:color-mix(in srgb,var(--navy-ink) 78%,transparent);max-width:46ch}
.pfc-url{display:flex;align-items:center;gap:8px;padding:5px 5px 5px 14px;border-radius:var(--r-md);background:color-mix(in srgb,var(--navy-ink) 9%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--navy-ink) 16%,transparent);min-width:0;max-width:460px}
.pfc-url code{flex:1;min-width:0;font:500 13.5px var(--f-mono);color:var(--navy-ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pfc-nb{background:color-mix(in srgb,var(--navy-ink) 11%,transparent)!important;color:var(--navy-ink)!important;box-shadow:none!important}
.pfc-nb:hover{background:color-mix(in srgb,var(--navy-ink) 18%,transparent)!important}
.pfc-pts{display:flex;gap:6px 16px;flex-wrap:wrap;font-size:12.5px;color:color-mix(in srgb,var(--navy-ink) 74%,transparent)}
.pfc-pts span{display:inline-flex;align-items:center;gap:6px}.pfc-pts svg.i{color:color-mix(in srgb,var(--navy-ink) 80%,transparent);width:15px;height:15px}
.pfc-demo{position:relative;background:var(--surface);color:var(--ink);border-radius:var(--r-lg);box-shadow:var(--shadow-3);display:flex;flex-direction:column;height:404px;min-width:0;overflow:hidden}
.pfc-dh{display:flex;align-items:center;gap:10px;padding:10px 10px 10px 14px;border-bottom:1px solid var(--line);font-size:12.5px;flex:none}
.pfc-dh .dots{display:flex;gap:5px}.pfc-dh .dots i{width:9px;height:9px;border-radius:50%;background:var(--line-2)}
.pfc-db{flex:1;min-height:0;overflow-y:auto;padding:14px 16px;display:flex;flex-direction:column;gap:10px;scrollbar-width:none;scroll-behavior:smooth}
.pfc-db>*{animation:rise var(--t-3) var(--e-out) both;flex:none}
.pfc-du{align-self:flex-end;max-width:86%;background:var(--bg-2);padding:8px 12px;border-radius:14px 14px 4px 14px;font-size:13.5px;min-height:36px}
.pfc-du.typing::after{content:"";display:inline-block;width:2px;height:14px;background:var(--acc);margin-left:2px;vertical-align:-2px;animation:pulse 1s infinite}
.pfc-dt{display:flex;align-items:center;gap:8px;font:500 11.5px var(--f-mono);color:var(--mut);padding:6px 10px;border-radius:var(--r-sm);box-shadow:inset 0 0 0 1px var(--line);background:var(--surface-2);min-width:0}
.pfc-dt b{color:var(--ink);font-weight:500}.pfc-dt .arg{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;flex:1}
.pfc-dt .spin{width:12px;height:12px;border-radius:50%;border:1.6px solid var(--line-2);border-top-color:var(--acc);animation:pfcS .7s linear infinite;flex:none}
.pfc-dt svg.i{width:14px;height:14px;color:var(--ok);stroke-width:2.2}
@keyframes pfcS{to{transform:rotate(360deg)}}
.pfc-da{font-size:13.5px;line-height:1.5}
.pfc-dc{border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line);padding:10px 12px;font-size:12.5px;display:flex;flex-direction:column;gap:6px}
.pfc-dc .r{display:flex;justify-content:space-between;gap:10px}.pfc-dc .r+.r{border-top:1px solid var(--line);padding-top:6px}
.pfc-dq{border-radius:var(--r-md);box-shadow:inset 0 0 0 1.5px var(--acc-line);overflow:hidden;font-size:12.5px}
.pfc-dq .h{display:flex;align-items:center;gap:7px;padding:7px 10px;background:var(--acc-pale);font-weight:600}
.pfc-dq .h svg.i{color:var(--acc);width:15px;height:15px}
.pfc-dq .b2{padding:9px 10px;display:flex;flex-direction:column;gap:8px}
.card.navy .pfc-demo .mut{color:var(--mut)}
.pfc-df{display:flex;align-items:center;gap:10px;padding:8px 12px 10px 14px;border-top:1px solid var(--line);font-size:12px;color:var(--mut);flex:none}
.pfc-df .sc{display:flex;gap:4px;margin-left:auto}
.pfc-df .sc button{width:22px;height:22px;display:grid;place-items:center}
.pfc-df .sc i{display:block;width:6px;height:6px;border-radius:3px;background:var(--line-2);transition:width var(--t-3) var(--e-out),background var(--t-2)}
.pfc-df .sc button[aria-current="true"] i{width:18px;background:var(--acc)}
.pfc-dom{display:flex;align-items:center;gap:8px;width:100%;padding:11px 16px;border-top:1px solid var(--line);text-align:left;min-height:44px;transition:background var(--t-1)}
.pfc-dom:hover{background:var(--surface-2)}
.pfc-dom>svg:last-child{margin-left:auto;color:var(--mut);transition:transform var(--t-2) var(--e-out)}
.pfc-dom[aria-expanded="true"]>svg:last-child{transform:rotate(180deg)}
.pfc-dom[aria-expanded="true"]{background:var(--surface-2)}
.pfc-tools[hidden]{display:none}
.pfc-tools{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 18px;padding:0 16px 8px}
.pfc-tool{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:4px 12px;align-items:center;padding:11px 0;border-top:1px solid var(--line);cursor:pointer;min-width:0}
.pfc-tool:hover .nm{color:var(--acc)}
.pfc-tool .nm{font:500 12.5px var(--f-mono);color:var(--ink);transition:color var(--t-1);display:flex;align-items:center;gap:8px;min-width:0}
.pfc-tool .ds{font-size:12.5px;color:var(--mut);grid-column:1;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pfc-tool .tg{grid-row:1/3;grid-column:2;display:flex;align-items:center;gap:8px}
.pfc-le{font:600 10px var(--f-text);letter-spacing:.05em;text-transform:uppercase;padding:2px 6px;border-radius:5px;background:var(--bg-2);color:var(--mut);flex:none}
.pfc-le.w{background:var(--acc-pale);color:var(--acc)}.pfc-le.d{background:var(--warn-pale);color:var(--warn)}
.pfc-mx th.sc{font:500 11px var(--f-mono);text-transform:none;letter-spacing:0;color:var(--ink-2);text-align:center}
.pfc-mx td.c{text-align:center}
.pfc-cl{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:13px 16px}
.pfc-cl+.pfc-cl{border-top:1px solid var(--line)}
.pfc-call{display:grid;grid-template-columns:96px 150px minmax(0,1.1fr) minmax(0,1fr) 64px;gap:12px;align-items:center;padding:10px 16px;font-size:12.5px}
.pfc-call+.pfc-call{border-top:1px solid var(--line)}
.pfc-call.h{font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--mut);padding-top:4px}
.pfc-call .a{font:400 11.5px var(--f-mono);color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pfc-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(258px,1fr));gap:12px}
.pfc-k{display:grid;grid-template-columns:auto minmax(0,1fr);gap:4px 12px;padding:14px;text-align:left;align-items:start;min-height:112px}
.pfc-k .pf-lg{grid-row:1/3}
.pfc-k .nm{font-weight:650;font-size:14px;letter-spacing:-.01em;display:flex;align-items:center;justify-content:space-between;gap:8px;min-width:0}
.pfc-k .ct{font-size:11.5px;color:var(--mut)}
.pfc-k .ds{grid-column:1/3;font-size:12.5px;color:var(--mut);line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;margin-top:6px}
.pfc-k .dot{width:8px;height:8px;border-radius:50%;flex:none;background:var(--line-2)}
.pfc-k .dot.on{background:var(--ok);box-shadow:0 0 0 3px var(--ok-pale)}.pfc-k .dot.assist{background:var(--acc);box-shadow:0 0 0 3px var(--acc-pale)}.pfc-k .dot.agr{background:var(--warn);box-shadow:0 0 0 3px var(--warn-pale)}
.pfc-cg{font:650 15px var(--f-display);letter-spacing:-.015em;display:flex;align-items:baseline;gap:8px;margin:10px 0 -2px}
.pfc-cg span{font:500 12.5px var(--f-text);color:var(--mut)}
.pfc-filter{display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.pfc-cats{display:flex;gap:6px;overflow-x:auto;scrollbar-width:none;padding:2px}
.pfc-cats .tag{flex:none}
.pfc-doc{display:grid;grid-template-columns:270px minmax(0,1fr);min-height:420px}
.pfc-doc nav{border-right:1px solid var(--line);padding:8px;display:flex;flex-direction:column;gap:2px}
.pfc-ep{display:flex;flex-direction:column;gap:3px;padding:9px 10px;border-radius:var(--r-sm);text-align:left;min-width:0}
.pfc-ep:hover{background:var(--surface-2)}.pfc-ep[aria-current="true"]{background:var(--acc-pale)}
.pfc-ep .p{font:500 12px var(--f-mono);display:flex;gap:8px;align-items:center;min-width:0}
.pfc-ep .p span:last-child{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pfc-ep small{font-size:12px;color:var(--mut)}
.pfc-m{font:600 10px var(--f-mono);padding:2px 5px;border-radius:4px;background:var(--ok-pale);color:var(--ok);flex:none}
.pfc-m.POST{background:var(--acc-pale);color:var(--acc)}.pfc-m.SIG{background:var(--warn-pale);color:var(--warn)}
.pfc-dbody{padding:16px 18px 18px;display:flex;flex-direction:column;gap:12px;min-width:0}
.pfc-res{transition:opacity var(--t-3)}
.pfc-wl{display:grid;grid-template-columns:96px minmax(0,1fr) minmax(0,1.2fr) auto;gap:12px;align-items:center;padding:10px 16px;font-size:12.5px;cursor:pointer}
.pfc-wl:hover{background:var(--surface-2)}
.pfc-wl+.pfc-wl{border-top:1px solid var(--line)}
.pfc-code{font:600 11.5px var(--f-mono);padding:2px 7px;border-radius:5px;background:var(--ok-pale);color:var(--ok)}
.pfc-code.e{background:var(--bad-pale);color:var(--bad)}
.pfc-ok{display:flex;flex-direction:column;align-items:center;text-align:center;gap:12px;padding:26px 10px}
.pfc-ok .big{width:72px;height:72px;border-radius:22px;background:var(--acc-pale);display:grid;place-items:center;position:relative}
.pfc-ok .big .strass{position:absolute;right:-5px;top:-5px;width:16px;height:16px}
.pfc-ok .big svg.i{width:30px;height:30px;color:var(--acc);stroke-width:2.2}
@container main (max-width:1000px){.pfc-hero{grid-template-columns:minmax(0,1fr);padding:22px}.pfc-hero h2{font-size:28px}.pfc-tools{grid-template-columns:minmax(0,1fr)}.pfc-call{grid-template-columns:90px 130px minmax(0,1fr) 60px}.pfc-call .a{display:none}}
@container main (max-width:760px){
 .pfc-hero{padding:18px;gap:18px}.pfc-hero h2{font-size:25px}.pfc-hero p{font-size:14px}.pfc-demo{height:380px}
 .pfc-doc{grid-template-columns:minmax(0,1fr)}.pfc-doc nav{border-right:0;border-bottom:1px solid var(--line);flex-direction:row;overflow-x:auto;scrollbar-width:none}.pfc-ep{flex:none;max-width:230px}
 .pfc-call{grid-template-columns:minmax(0,1fr) auto;gap:4px 10px}.pfc-call.h{display:none}.pfc-call .w1{grid-column:1;order:2;color:var(--mut)}.pfc-call .t1{order:1}.pfc-call .tm{order:3;grid-column:1/3;color:var(--mut)}.pfc-call .s1{grid-row:1;grid-column:2}.pfc-call .r1{order:4;grid-column:1/3}
 .pfc-wl{grid-template-columns:minmax(0,1fr) auto;gap:3px 10px}.pfc-wl .tm{order:3;color:var(--mut)}.pfc-wl .u{order:4;grid-column:1/3}
 .pfc-grid{grid-template-columns:minmax(0,1fr)}.pfc-k{min-height:0}
 .pfc-cl{grid-template-columns:auto minmax(0,1fr)}.pfc-cl .r{grid-column:1/3;display:flex;justify-content:flex-end}
}
`);

var CX={open:{'Écurie':1,'Facturation':1},tab:'mcp',cat:'Tous',st:'all',q:'',tf:'all',ep:0,lang:'curl',role:0};

/* ---------- Démonstration animée : une IA externe interroge l’écurie ---------- */
function scenarios(){
  var by={},late=D.invoices.filter(function(i){return i.status==='en retard'});late.forEach(function(i){by[i.member]=(by[i.member]||0)+i.amount});
  var top=Object.keys(by).sort(function(a,b){return by[b]-by[a]}).slice(0,3),tot=sum(late,function(i){return i.amount});
  var l5=D.lessons.filter(function(x){return x.dow===2})[1],vac=D.care.filter(function(c){return c.kind==='Vaccin'&&F.days(c.date)>=0})[0];
  return [
   {t:'Lire',steps:[{u:'Qui n’a pas payé sa pension ou son forfait de novembre ?'},{tool:'ecurie_apercu',args:'{}',ms:88},{tool:'impayes_lister',args:'{"anciennete_min_jours":1}',ms:212},
     {a:'<b>'+Object.keys(by).length+' familles doivent '+F.eur(tot)+'</b> aux Tilleuls. Les trois plus gros retards :'},
     {card:top.map(function(k){return '<div class="r"><span>'+D.name(k)+'</span><b class="num">'+F.eur(by[k])+'</b></div>'}).join('')},{a:'Voulez-vous que je prépare les relances ? Vous les validerez dans Piaffe.'}]},
   {t:'Croiser',steps:[{u:'Quels chevaux sont à vacciner ou à ferrer d’ici trois semaines ?'},{tool:'sante_echeances',args:'{"jours":21}',ms:164},{tool:'cheval_fiche',args:'{"id":"'+vac.horse+'"}',ms:97},
     {a:'<b>'+D.horse(vac.horse).name+'</b> a son rappel de vaccin '+F.rel(vac.date)+' avec le Dr Leclerc. Deux ferrures sont en retard :'},
     {card:[['Lune d’Or (B12)','Maréchal, 9 j de retard'],['Ulysse de la Roche (B01)','Ferrure jeudi 9 h'],[D.horse(vac.horse).name+' ('+D.horse(vac.horse).box+')','Vaccin grippe et tétanos']].map(function(x){return '<div class="r"><span>'+x[0]+'</span><span class="mut">'+x[1]+'</span></div>'}).join('')}]},
   {t:'Agir',steps:[{u:'La carrière est gelée. Reporte la reprise de 17 h à samedi 10 h et préviens les familles.'},{tool:'planning_consulter',args:'{"du":"2026-11-17"}',ms:131},{tool:'cours_annuler_ou_reporter',args:'{"seance":"'+l5.id+'","motif":"gel"}',ms:0,wait:true},
     {confirm:{title:'Reporter « '+l5.title+' » à samedi 10 h',rows:[['Destinataires',l5.riders.length+' familles, par SMS'],['Séances décomptées','Aucune']]}},
     {tool:'message_envoyer',args:'{"message":"msg_8Kq2"}',ms:640},{a:'C’est fait. La reprise est reportée à samedi 10 h au Grand manège et <b>'+l5.riders.length+' familles sont prévenues</b>. L’action est tracée dans le journal de Piaffe.'}]}];
}
function demo(box){
  var SC=scenarios(),body=$('.pfc-db',box),tok=0,paused=false,cur=0,RM=P.RM;
  function wait(ms,my){return new Promise(function(res,rej){(function tick(){if(my!==tok||!box.isConnected)return rej(0);if(paused)return setTimeout(tick,160);setTimeout(function(){if(my!==tok||!box.isConnected)rej(0);else if(paused)tick();else res()},RM?0:ms)})()})}
  function add(cls,html){var d=document.createElement('div');d.className=cls;d.innerHTML=html||'';body.appendChild(d);body.scrollTop=body.scrollHeight;return d}
  function mark(){$$('.pfc-df .sc button',box).forEach(function(b,i){b.setAttribute('aria-current',i===cur)});$('.pfc-df [data-lbl]',box).textContent='Démonstration '+(cur+1)+' sur '+SC.length+' · '+SC[cur].t}
  async function play(i,loop){var my=++tok;cur=i;body.innerHTML='';mark();
    try{var S=SC[i].steps;await wait(350,my);
      for(var k=0;k<S.length;k++){var s=S[k];
        if(s.u){var u=add('pfc-du typing');for(var c=1;c<=s.u.length;c+=RM?s.u.length:2){u.textContent=s.u.slice(0,c);await wait(22,my)}u.textContent=s.u;u.classList.remove('typing');await wait(450,my)}
        else if(s.tool){var t=add('pfc-dt','<span class="spin"></span><b>piaffe.'+s.tool+'</b><span class="arg">'+esc(s.args)+'</span><span class="ms"></span>');await wait(s.wait?500:520,my);
          if(s.wait){t.querySelector('.ms').textContent='accord demandé'}else{t.querySelector('.spin').outerHTML=ICON('check');t.querySelector('.ms').textContent=s.ms+' ms'}await wait(260,my)}
        else if(s.a){add('pfc-da',s.a);await wait(700,my)}
        else if(s.card){add('pfc-dc',s.card);await wait(900,my)}
        else if(s.confirm){var q=add('pfc-dq','<div class="h">'+ICON('shield')+'Piaffe demande votre accord</div><div class="b2"><b>'+s.confirm.title+'</b>'+s.confirm.rows.map(function(r){return '<div class="hrow sp"><span class="mut">'+r[0]+'</span><span>'+r[1]+'</span></div>'}).join('')+'<div class="hrow" data-cf><span class="btn sm pri" style="pointer-events:none">Valider dans Piaffe</span><span class="btn sm ghost" style="pointer-events:none">Refuser</span></div></div>');
          await wait(1500,my);q.querySelector('[data-cf]').innerHTML='<span class="chip ok dot lg">Validé par Claire dans Piaffe</span>';var pt=body.querySelectorAll('.pfc-dt');pt=pt[pt.length-1];if(pt){pt.querySelector('.spin').outerHTML=ICON('check');pt.querySelector('.ms').textContent='validé'}await wait(500,my)}
        body.scrollTop=body.scrollHeight}
      if(RM||loop===false)return;await wait(3600,my);play((i+1)%SC.length)}catch(e){}}
  on(box,'.pfc-df .sc button',function(b){paused=false;pp();play(+b.getAttribute('data-sc'))});
  function pp(){var b=$('[data-pp]',box);b.innerHTML=ICON(paused?'play':'pause','sm');b.title=paused?'Reprendre la démonstration':'Mettre en pause'}
  $('[data-pp]',box).onclick=function(){paused=!paused;pp()};
  play(0);return {play:play}}

/* ---------- Feuilles ---------- */
function connectSheet(who){
  var N={claude:['Claude','Cl','var(--c4)',['Ouvrez Claude, puis Réglages et Connecteurs.','Choisissez « Ajouter un connecteur personnalisé » et collez l’adresse.','Identifiez-vous avec votre compte Piaffe et choisissez les droits.']],
         chatgpt:['ChatGPT','GP','var(--c7)',['Ouvrez ChatGPT, puis Réglages et Connecteurs.','Créez un connecteur et collez l’adresse du serveur.','Identifiez-vous avec votre compte Piaffe et choisissez les droits.']],
         autre:['un autre assistant','IA','var(--c5)',['Ouvrez les réglages MCP de votre assistant ou de votre outil.','Ajoutez un serveur distant (Streamable HTTP) avec cette adresse.','L’identification se fait avec votre compte Piaffe (OAuth 2.1).']]}[who];
  P.sheet({title:'Connecter '+N[0],icon:'mcp',body:function(b){
    b.innerHTML='<div class="stack" style="--g:16px"><div class="hrow" style="--g:12px">'+lg(N[1],N[2],'lg')+'<div class="hrow" style="--g:6px;color:var(--mut-2)">'+ICON('swap')+'</div><span class="pf-lg lg" style="--c:var(--ink);background:var(--navy);box-shadow:none">'+LOGO(24,'var(--navy-ink)','var(--strass)')+'</span><div class="grow"><div class="b">'+(who==='autre'?'Votre assistant':N[0])+' et l’Écurie des Tilleuls</div><div class="s mut">Trois étapes, environ une minute</div></div></div>'+
      '<div class="stack" style="--g:10px">'+N[3].map(function(s,i){return '<div class="hrow" style="align-items:flex-start;--g:12px"><span class="pf-step'+(i===0?' on':'')+'" data-st="'+i+'">'+(i+1)+'</span><div class="grow s" style="font-size:13.5px;padding-top:3px">'+s+(i===1?'<div class="pf-code" style="margin-top:8px"><div class="pf-ct"><span>Adresse du serveur MCP</span><button class="btn ghost sm" data-cp>'+ICON('copy','sm')+'Copier</button></div><pre>'+MCP_URL+'</pre></div>':'')+'</div></div>'}).join('')+'</div>'+
      (who==='autre'?pre('{\n  "mcpServers": {\n    "piaffe": {\n      "type": "http",\n      "url": "'+MCP_URL+'"\n    }\n  }\n}',{title:'Configuration type'}):'')+
      '<div><div class="b s" style="margin-bottom:8px">Droits accordés à cet assistant</div><div class="card flat list">'+SCOPES.map(function(s,i){return '<label class="li pf-tap" style="cursor:pointer">'+U.chk(i<4,'sc'+i)+'<div class="grow"><div class="pf-mono">'+s[0]+'</div><div class="s">'+s[1]+'</div></div>'+(i>=4?'<span class="pfc-le w">Aperçu requis</span>':'')+'</label>'}).join('')+'</div><div class="xs mut" style="margin-top:8px">L’assistant agit avec vos droits de gérante, jamais plus. Les écritures restent soumises à votre validation dans Piaffe.</div></div></div>'},
   foot:'<button class="btn" data-c>Plus tard</button><button class="btn pri" data-go2>'+ICON('shield','sm')+'Autoriser '+(who==='autre'?'l’assistant':N[0])+'</button>'});
  var sh=sheet();sh.querySelector('[data-cp]').onclick=function(){clip(MCP_URL,'Adresse du serveur MCP copiée');sh.querySelector('[data-st="0"]').className='pf-step ok';sh.querySelector('[data-st="0"]').innerHTML=ICON('check');sh.querySelector('[data-st="1"]').classList.add('on')};
  sh.querySelector('[data-c]').onclick=function(){sh.close()};
  sh.querySelector('[data-go2]').onclick=function(){var btn=this;btn.disabled=true;btn.innerHTML='Autorisation en cours';var sc=$$('.chk',sh).map(function(c,i){return c.getAttribute('aria-checked')==='true'?i:-1}).filter(function(i){return i>=0});
    var i=0;(function step(){if(!sh.isConnected)return;if(i<3){var s=sh.querySelector('[data-st="'+i+'"]');s.className='pf-step ok';s.innerHTML=ICON('check');i++;setTimeout(step,P.RM?0:380);return}
      D.mcpClients=D.mcpClients.filter(function(c){return !(c.n===N[0]&&c.user==='s01')});D.mcpClients.unshift({id:'mc'+Date.now(),n:who==='autre'?'Assistant personnalisé':N[0],l:N[1],c:N[2],user:'s01',sc:sc,last:'à l’instant',calls:0,since:'aujourd’hui',fresh:true});
      sh.querySelector('.sb').innerHTML='<div class="pfc-ok pop"><div class="big">'+ICON('check')+'<span class="strass"></span></div><h3 style="font-size:20px">'+(who==='autre'?'Votre assistant':N[0])+' est relié aux Tilleuls</h3><p class="s mut" style="max-width:38ch">Il lit l’écurie avec vos droits. Essayez de lui demander :</p><div class="pfa-quote" style="text-align:left">« Qui n’a pas payé sa pension de novembre, et depuis quand ? »</div></div>';
      sh.querySelector('.sf').innerHTML='<button class="btn pri" data-end>Voir les assistants connectés</button>';sh.querySelector('[data-end]').onclick=function(){sh.close();P.rerender()}})()};
}
function toolSheet(t){
  var call='POST /mcp\nMcp-Method: tools/call\nMcp-Name: '+t.n+'\n\n{\n  "jsonrpc": "2.0",\n  "id": 7,\n  "method": "tools/call",\n  "params": {\n    "name": "'+t.n+'",\n    "arguments": '+t.args+'\n  }\n}';
  var res=t.w?'{\n  "resultType": "input_required",\n  "apercu": {\n    "titre": "'+t.d.split('.')[0].replace(/"/g,'')+'",\n    "a_valider_par": "Claire Morel",\n    "expire_dans_s": 300\n  }\n}':'{\n  "resultType": "complete",\n  "structuredContent": { "donnees_au": "2026-11-17T09:41:00+01:00", "resultats": "…" },\n  "ttlMs": 60000,\n  "cacheScope": "private"\n}';
  P.sheet({title:t.n,icon:TIC[t.dom],wide:true,body:'<div class="stack" style="--g:14px"><p style="font-size:14.5px">'+t.d+'</p><dl class="pf-kv"><dt>Domaine</dt><dd>'+t.dom+'</dd><dt>Périmètre</dt><dd>'+(t.w?'Écriture':'Lecture seule')+'</dd><dt>Confirmation</dt><dd>'+(t.cf===2?'Double : aperçu, puis ressaisie d’un élément':t.cf===1?'Aperçu puis validation dans Piaffe':'Aucune, l’outil ne modifie rien')+'</dd><dt>Rôles autorisés</dt><dd>'+t.roles+'</dd><dt>Droit requis</dt><dd class="pf-mono">'+(t.w?'ecriture:':'lecture:')+({'Facturation':'finance','Messages':'messages','Planning et reprises':'planning','Équipe et concours':'rh','Chevaux et santé':t.w?'club':'sante'}[t.dom]||'club')+'</dd></dl>'+pre(call,{title:'Appel'})+pre(res,{title:t.w?'Réponse : accord demandé':'Réponse'})+
    (t.w?'<div class="note">'+ICON('shield','sm')+'<span>Rien n’est écrit tant que l’aperçu n’est pas validé. Un rejeu avec la même clé d’idempotence ne crée pas de doublon.</span></div>':'')+'</div>',
   foot:'<div class="hrow grow" style="--g:10px"><span class="s b">Exposer cet outil</span>'+U.tog(t.on,'tool-on')+'</div><button class="btn" data-c>Fermer</button>'});
  var sh=sheet();X.bindCopy(sh);sh.querySelector('[data-c]').onclick=function(){var v=sh.querySelector('#tool-on').getAttribute('aria-checked')==='true';if(v!==t.on){t.on=v;P.toast(v?'Outil exposé aux assistants':'Outil retiré de la liste des assistants');P.rerender()}sh.close()};
}
function connSheet(k){
  var st=STL[k.st],dir=DIRL[k.dir],ffe=k.cat==='Fédéral et public'&&/FFE|Déclaration/.test(k.n),rep=k.cat==='Reprise de données';
  var body='<div class="stack" style="--g:16px"><div class="hrow" style="--g:14px">'+klogo(k,'lg')+'<div class="grow"><div class="b" style="font-size:16px">'+k.n+'</div><div class="s mut">'+k.cat+'</div></div>'+U.chip(st[0],st[1],true)+'</div><p style="font-size:14.5px;line-height:1.5">'+k.d+'</p>'+
   (k.st==='agr'?'<div class="note warn">'+ICON('info','sm')+'<span>La FFE ne propose pas d’accès public à ses services. La télétransmission des licences est réservée aux solutions agréées. Piaffe a déposé sa demande d’agrément : nous n’annonçons pas de date. En attendant, utilisez l’export assisté.</span></div>':'')+
   (k.st==='assist'&&ffe?'<div class="note">'+ICON('info','sm')+'<span>Il n’existe pas de connexion directe avec la FFE. Vous exportez le fichier depuis votre espace club, Piaffe le lit. Dans l’autre sens, Piaffe prépare le lot et vous le saisissez côté FFE.</span></div>':'')+
   '<div><div class="b s" style="margin-bottom:8px">Ce qui circule</div><div class="card flat list">'+k.sync.map(function(s){return '<div class="li">'+ICON(dir[1],'sm')+'<div class="grow t" style="font-weight:500">'+s+'</div><span class="xs mut">'+dir[0]+'</span></div>'}).join('')+'</div></div>'+
   (k.st==='on'?'<dl class="pf-kv"><dt>Dernière synchronisation</dt><dd>il y a '+(3+k.n.length%9)+' min, sans erreur</dd><dt>Connecté par</dt><dd>Claire Morel, le '+(2+k.n.length%26)+' septembre</dd><dt>Compte</dt><dd>'+D.club.name+'</dd></dl><div class="card flat list"><div class="li"><div class="grow"><div class="t">Synchronisation automatique</div><div class="s">Toutes les 15 minutes et à chaque changement</div></div>'+U.tog(true)+'</div><div class="li"><div class="grow"><div class="t">M’alerter en cas d’erreur</div><div class="s">Notification et e-mail à la gérante</div></div>'+U.tog(true)+'</div></div>':'')+'</div>';
  var foot=k.st==='on'?'<button class="btn danger" data-off>Déconnecter</button><button class="btn pri" data-sync>'+ICON('refresh','sm')+'Synchroniser maintenant</button>':k.st==='agr'?'<button class="btn" data-alt>Utiliser l’export assisté</button><button class="btn pri" data-warn>'+ICON('bell','sm')+'Me prévenir à l’agrément</button>':k.st==='assist'?'<button class="btn" data-c>Fermer</button><button class="btn pri" data-imp>'+ICON('upload','sm')+(rep?'Reprendre mes données':'Importer un fichier exporté')+'</button>':'<button class="btn" data-c>Fermer</button><button class="btn pri" data-on>'+ICON('plug','sm')+'Connecter '+k.n+'</button>';
  P.sheet({title:k.n,icon:'plug',body:body,foot:foot});var sh=sheet(),q=function(s){return sh.querySelector(s)};
  if(q('[data-c]'))q('[data-c]').onclick=function(){sh.close()};
  if(q('[data-off]'))q('[data-off]').onclick=function(){k.st='off';sh.close();P.rerender();P.toast(k.n+' est déconnecté',{undo:function(){k.st='on';P.rerender()}})};
  if(q('[data-sync]'))q('[data-sync]').onclick=function(){var b=this;b.disabled=true;b.innerHTML='Synchronisation en cours';setTimeout(function(){if(b.isConnected){b.disabled=false;b.innerHTML=ICON('check','sm')+'À jour'}P.toast(k.n+' est à jour')},P.RM?0:900)};
  if(q('[data-on]'))q('[data-on]').onclick=function(){var b=this;b.disabled=true;b.innerHTML='Connexion à '+k.n;setTimeout(function(){k.st='on';if(sh.isConnected)sh.close();P.rerender();P.toast(k.n+' est connecté aux Tilleuls')},P.RM?0:1000)};
  if(q('[data-imp]'))q('[data-imp]').onclick=function(){sh.close();P.go('import',{src:k.id})};
  if(q('[data-alt]'))q('[data-alt]').onclick=function(){sh.close();connSheet(D.connectors.find(function(x){return x.n==='FFE Club SIF, fichiers'}))};
  if(q('[data-warn]'))q('[data-warn]').onclick=function(){sh.close();P.toast('Vous serez prévenue dès que l’agrément FFE sera obtenu',{icon:'bell'})};
}
function keySheet(){
  P.sheet({title:'Créer une clé API',icon:'key',body:'<div class="stack" style="--g:14px"><label class="field"><span>Nom de la clé</span><input class="in" data-n value="Tableau de bord de la mairie"></label>'+
    '<div class="field"><span>Environnement</span>'+U.seg([['live','Production'],['test','Bac à sable (écurie fictive)']],'live','data-env')+'</div>'+
    '<div class="field"><span>Portée : ce que la clé a le droit de faire</span><div class="card flat list">'+SCOPES.concat([['ecriture:mesures','Envoyer des mesures de capteurs']]).map(function(s,i){return '<label class="li pf-tap" style="cursor:pointer">'+U.chk(i===0,'ks'+i)+'<div class="grow"><div class="pf-mono">'+s[0]+'</div><div class="s">'+s[1]+'</div></div></label>'}).join('')+'</div></div>'+
    '<label class="field"><span>Expiration</span><select class="in" data-exp><option>Dans 90 jours</option><option>Dans 1 an</option><option>Sans expiration</option></select></label><div data-out></div></div>',
   foot:'<button class="btn" data-c>Annuler</button><button class="btn pri" data-mk>'+ICON('key','sm')+'Créer la clé</button>'});
  var sh=sheet();sh.querySelector('[data-c]').onclick=function(){sh.close()};
  sh.querySelector('[data-mk]').onclick=function(){var env=sh.querySelector('[data-env][aria-selected="true"]').getAttribute('data-env'),sc=$$('.chk',sh).map(function(c,i){return c.getAttribute('aria-checked')==='true'?SCOPES.concat([['ecriture:mesures']])[i][0]:null}).filter(Boolean);
    if(!sc.length){P.toast('Choisissez au moins un droit pour cette clé',{icon:'alert'});return}
    var key='pk_'+env+'_Tq4n8ZrL2vXc7HyB9mKd3WfA',name=sh.querySelector('[data-n]').value||'Nouvelle clé';
    D.apiKeys.unshift({id:'k'+Date.now(),n:name,pre:key.slice(0,12),sc:sc,made:'aujourd’hui',last:'jamais utilisée',exp:sh.querySelector('[data-exp]').value==='Sans expiration'?'Sans expiration':'Expire '+sh.querySelector('[data-exp]').value.toLowerCase(),st:'on',calls:0,fresh:true});
    sh.querySelector('.sb').innerHTML='<div class="stack pop" style="--g:14px"><div class="note ok">'+ICON('checkc','sm')+'<span><b>Clé créée.</b> Copiez-la maintenant : pour votre sécurité, elle ne sera plus jamais affichée en entier.</span></div>'+pre(key,{title:name})+'<dl class="pf-kv"><dt>Portée</dt><dd class="pf-mono">'+sc.join(', ')+'</dd><dt>Limite</dt><dd>120 requêtes par minute</dd></dl>'+pre('curl '+API_URL+'/ecuries \\\n  -H "Authorization: Bearer '+key+'"',{title:'Premier appel'})+'</div>';X.bindCopy(sh);
    sh.querySelector('.sf').innerHTML='<button class="btn pri" data-end>J’ai copié la clé</button>';sh.querySelector('[data-end]').onclick=function(){sh.close();P.rerender()}};
}
function hookSheet(w){
  var nw=!w;w=w||{n:'',url:'https://',ev:['facture.payee'],on:true};
  P.sheet({title:nw?'Ajouter un webhook':w.n,icon:'webhook',body:'<div class="stack" style="--g:14px"><label class="field"><span>Nom</span><input class="in" data-n value="'+esc(w.n||'Mon outil')+'"></label><label class="field"><span>Adresse qui reçoit les événements</span><input class="in pf-mono" data-u value="'+esc(nw?'https://exemple.fr/webhooks/piaffe':w.url)+'"></label>'+
    '<div class="field"><span>Événements envoyés</span><div class="hrow wrap" style="--g:6px">'+EVENTS.map(function(e){return '<button class="tag pf-mono" aria-pressed="'+(w.ev.indexOf(e)>=0)+'" data-ev="'+e+'">'+e+'</button>'}).join('')+'</div></div>'+
    pre('whsec_9fK2mQ7xT4bV8nLc1Zr6',{title:'Secret de signature (HMAC SHA-256)'})+'<div class="xs mut">Chaque envoi est signé et horodaté. En cas d’échec, Piaffe réessaie pendant 72 heures avec des délais croissants.</div></div>',
   foot:(nw?'':'<button class="btn danger" data-del>Supprimer</button>')+'<button class="btn" data-test>'+ICON('send','sm')+'Envoyer un test</button><button class="btn pri" data-save>'+(nw?'Ajouter le webhook':'Enregistrer')+'</button>'});
  var sh=sheet();X.bindCopy(sh);
  sh.querySelector('[data-test]').onclick=function(){D.webhookLog.unshift({t:'9 h 41',ev:'test.ping',w:w.id||'w1',code:200,ms:120,tr:1,id:'evt_test_'+String(Date.now()).slice(-6),fresh:true});P.toast('Événement de test reçu : 200 en 120 ms')};
  sh.querySelector('[data-save]').onclick=function(){w.n=sh.querySelector('[data-n]').value;w.url=sh.querySelector('[data-u]').value;w.ev=$$('[data-ev][aria-pressed="true"]',sh).map(function(b){return b.getAttribute('data-ev')});if(nw){w.id='w'+Date.now();w.ok=100;w.last='jamais';D.webhooks.unshift(w)}sh.close();P.rerender();P.toast(nw?'Webhook ajouté':'Webhook enregistré')};
  if(!nw)sh.querySelector('[data-del]').onclick=function(){var i=D.webhooks.indexOf(w);D.webhooks.splice(i,1);sh.close();P.rerender();P.toast('Webhook supprimé',{undo:function(){D.webhooks.splice(i,0,w);P.rerender()}})};
}
function logSheet(l){var w=D.webhooks.find(function(x){return x.id===l.w})||D.webhooks[0],inv=D.invoices[3];
  P.sheet({title:l.ev,icon:'webhook',wide:true,body:'<div class="stack" style="--g:14px"><div class="hrow wrap" style="--g:8px"><span class="pfc-code'+(l.code>=400?' e':'')+'">'+l.code+'</span><span class="chip">'+l.ms+' ms</span><span class="chip">'+l.tr+(l.tr>1?' essais':' essai')+'</span>'+(l.next?'<span class="chip warn dot">'+l.next+'</span>':'')+'</div>'+
    pre('POST '+w.url+'\nContent-Type: application/json\nPiaffe-Signature: t=1795077540,v1=5f2a9c0e7b…d41\nPiaffe-Event-Id: '+l.id,{title:'Requête envoyée'})+
    pre(JSON.stringify({id:l.id,type:l.ev,cree_le:'2026-11-17T09:29:02+01:00',ecurie:'ecu_tilleuls',donnees:{facture:inv.id,client:inv.member,montant_centimes:inv.amount*100,montant:F.eur(inv.amount),mode:'prelevement_sepa'}},null,2),{title:'Contenu'})+
    (l.code>=400?'<div class="note bad">'+ICON('alert','sm')+'<span>Le serveur du site web a répondu « 500 Internal Server Error » après 3 secondes. Piaffe réessaiera automatiquement.</span></div>':'')+'</div>',
   foot:'<button class="btn" data-c>Fermer</button><button class="btn pri" data-re>'+ICON('refresh','sm')+'Rejouer cet envoi</button>'});
  var sh=sheet();X.bindCopy(sh);sh.querySelector('[data-c]').onclick=function(){sh.close()};sh.querySelector('[data-re]').onclick=function(){l.code=200;l.ms=212;l.tr++;l.next=null;sh.close();P.rerender();P.toast('Envoi rejoué : 200 en 212 ms')};
}

/* ---------- Documentation intégrée ---------- */
function endpoints(){
  var h=D.horse('h01'),late=D.invoices.filter(function(i){return i.status==='en retard'}).slice(0,2),ms=D.members.filter(function(m){return m.forfait==='f3'}).slice(0,2);
  return [
   {m:'GET',p:'/adherents',t:'Lister les adhérents',d:'Pagination par curseur. Filtrez par forfait, licence ou date de modification pour synchroniser un autre outil.',q:'?forfait=carte&limite=2',
    res:{donnees:ms.map(function(m){return {id:m.id,prenom:m.first,nom:m.last,galop:m.galop,licence_ffe:{numero:m.lic,millesime:m.licence==='2027'?2027:null},forfait:'carte_10_seances',solde_centimes:Math.round(m.balance*100),ref_externe:null}}),curseur_suivant:'c_8fK2mQ',donnees_au:'2026-11-17T09:41:00+01:00'}},
   {m:'GET',p:'/chevaux/{id}',t:'Lire la fiche d’un cheval',d:'Identité, box, propriétaire, ration et prochains soins. Les données de santé demandent le droit lecture:sante.',q:'',path:'/chevaux/h01',
    res:{id:h.id,nom:h.name,sire:h.sire,race:h.breed,robe:h.coat,ne_en:h.born,box:h.box,statut:'pension_complete',proprietaire:{id:h.owner,nom:D.name(h.owner)},ration:{foin_kg:h.ration.hay,granules_kg:h.ration.grain},prochain_soin:{type:'marechal',date:D.iso(D.day(2)),intervenant:'Benoît Gautier'}}},
   {m:'POST',p:'/inscriptions',t:'Inscrire un cavalier à une séance',d:'Écriture idempotente : rejouer la même clé ne crée pas de doublon. La carte de séances est débitée si besoin.',body:{adherent:'m044',seance:'l23',debiter_carte:true},idem:true,code:201,
    res:{id:'ins_5Tg81',adherent:'m044',seance:{id:'l23',titre:'Galop 2',debut:'2026-11-21T15:00:00+01:00',lieu:'Grand manège'},cheval_attribue:null,carte:{seances_restantes:6},cree_le:'2026-11-17T09:41:03+01:00'}},
   {m:'GET',p:'/factures',t:'Factures en retard',d:'Montants en centimes et en euros, dates au format ISO. Triez par ancienneté pour préparer des relances.',q:'?statut=en_retard&limite=2',
    res:{donnees:late.map(function(i){return {id:i.id,client:i.member,libelle:i.label,montant_centimes:i.amount*100,montant:F.eur(i.amount),tva:i.vat,echeance:i.due,jours_de_retard:-F.days(i.due)}}),total:D.invoices.filter(function(i){return i.status==='en retard'}).length,curseur_suivant:'c_2Lp0xA'}},
   {m:'POST',p:'/mesures',t:'Envoyer une mesure de capteur',d:'Vos abreuvoirs, balances et sondes écrivent ici. Les seuils d’alerte se règlent dans Piaffe.',body:{capteur:'abreuvoir-b23',type:'eau_litres_heure',valeur:3.1,mesure_le:'2026-11-17T09:40:00+01:00'},code:202,
    res:{id:'mes_9Qw2',accepte:true,alerte:{niveau:'attention',message:'Consommation en baisse de 40 % au box B23'}}},
   {m:'SIG',p:'Signature d’un webhook',t:'Vérifier qu’un envoi vient de Piaffe',d:'Recalculez la signature avec votre secret et comparez-la à l’en-tête Piaffe-Signature. Refusez tout envoi de plus de cinq minutes.',sig:true}];
}
function reqCode(e,lang){
  var url=API_URL+(e.path||e.p)+(e.q||''),key='pk_live_7Fq2…',b=e.body?JSON.stringify(e.body,null,2):null;
  if(e.sig)return lang==='py'?'import hmac, hashlib\n\ndef verifier(corps, entete, secret):\n    t, v1 = [p.split("=")[1] for p in entete.split(",")]\n    attendu = hmac.new(secret.encode(), f"{t}.{corps}".encode(), hashlib.sha256).hexdigest()\n    return hmac.compare_digest(attendu, v1)':lang==='js'?'import { createHmac, timingSafeEqual } from "node:crypto";\n\nfunction verifier(corps, entete, secret) {\n  const [t, v1] = entete.split(",").map((p) => p.split("=")[1]);\n  const attendu = createHmac("sha256", secret).update(`${t}.${corps}`).digest("hex");\n  return timingSafeEqual(Buffer.from(attendu), Buffer.from(v1));\n}':'# En-tête reçu avec chaque envoi\nPiaffe-Signature: t=1795077540,v1=5f2a9c0e7b…d41\n\n# Signature attendue\nHMAC_SHA256(secret, "1795077540." + corps_de_la_requete)';
  if(lang==='js')return 'const reponse = await fetch("'+url+'", {\n'+(e.m==='POST'?'  method: "POST",\n':'')+'  headers: {\n    Authorization: "Bearer '+key+'",'+(e.idem?'\n    "Idempotency-Key": "ins-m044-l23",':'')+(b?'\n    "Content-Type": "application/json",':'')+'\n  },'+(b?'\n  body: JSON.stringify('+b.replace(/\n/g,'\n  ')+'),':'')+'\n});\nconst donnees = await reponse.json();';
  if(lang==='py')return 'import requests\n\nreponse = requests.'+e.m.toLowerCase()+'(\n    "'+url+'",\n    headers={"Authorization": "Bearer '+key+'"'+(e.idem?', "Idempotency-Key": "ins-m044-l23"':'')+'},'+(b?'\n    json='+b.replace(/\n/g,'\n    ').replace(/true/g,'True')+',':'')+'\n)\ndonnees = reponse.json()';
  return 'curl '+(e.m==='POST'?'-X POST ':'')+'"'+url+'" \\\n  -H "Authorization: Bearer '+key+'"'+(e.idem?' \\\n  -H "Idempotency-Key: ins-m044-l23"':'')+(b?' \\\n  -H "Content-Type: application/json" \\\n  -d \''+b.replace(/\n\s*/g,' ')+'\'':'')}

/* ---------- Onglets ---------- */
function tabMCP(ctx){
  var TL=TOOLS.filter(function(t){return CX.tf==='all'||(CX.tf==='E'?t.w:!t.w)}),nOn=TOOLS.filter(function(t){return t.on}).length,nW=TOOLS.filter(function(t){return t.w&&t.on}).length;
  var h='<div class="stack'+(X.q?'':' rise')+'" style="--g:14px">'+
   '<div class="card navy pfc-hero"><div class="glow"></div><div class="pfc-hl"><div class="hrow" style="--g:8px"><span class="strass" style="background:var(--strass)"></span><span class="eyebrow" style="color:color-mix(in srgb,var(--navy-ink) 72%,transparent)">Serveur MCP Piaffe</span></div>'+
     '<h2>Connectez toute votre écurie à l’IA</h2><p>Collez une adresse dans Claude, ChatGPT ou l’assistant de votre choix. Il interroge alors vos chevaux, vos reprises et vos factures avec vos droits, et vous demande votre accord avant d’écrire quoi que ce soit.</p>'+
     '<div class="pfc-url"><code>'+MCP_URL+'</code><button class="btn sm pfc-nb" data-cpurl>'+ICON('copy','sm')+'Copier</button></div>'+
     '<div class="hrow wrap" style="--g:8px"><button class="btn pri" data-con="claude" data-do="connect">'+ICON('plug','sm')+'Connecter à Claude</button><button class="btn pfc-nb" data-con="chatgpt">ChatGPT</button><button class="btn pfc-nb" data-con="autre">Autre assistant</button></div>'+
     '<div class="pfc-pts"><span>'+ICON('shield')+'Lecture seule par défaut</span><span>'+ICON('check')+'Chaque écriture validée par vous</span><span>'+ICON('lock')+'Données hébergées en France</span></div></div>'+
    '<div class="pfc-demo" data-demo><div class="pfc-dh"><span class="dots"><i></i><i></i><i></i></span><b class="grow ellip">Votre assistant IA</b><span class="chip ok dot">Piaffe connecté</span><button class="btn ghost icon sm" data-pp title="Mettre en pause">'+ICON('pause','sm')+'</button></div><div class="pfc-db"></div><div class="pfc-df"><span data-lbl>Démonstration</span><span class="sc">'+[0,1,2].map(function(i){return '<button data-sc="'+i+'" title="Scénario '+(i+1)+'"><i></i></button>'}).join('')+'</span></div></div></div>';

  h+='<div class="g3"><div class="card span2"><div class="ch" style="padding-bottom:6px"><div><h3>Assistants connectés</h3><div class="xs mut" style="margin-top:2px">Chacun agit au nom d’une personne et hérite de son rôle, jamais plus</div></div><span class="chip">'+D.mcpClients.length+'</span></div>'+
    D.mcpClients.map(function(c,i){var p=D.person(c.user),w=c.sc.filter(function(s){return s>=4}).length;return '<div class="pfc-cl'+(c.fresh?' pop':'')+'">'+lg(c.l,c.c)+'<div style="min-width:0"><div class="b" style="font-size:13.5px">'+c.n+' <span class="mut" style="font-weight:500">pour '+p.first+' '+p.last+'</span></div><div class="xs mut">'+(c.sc.length-w)+' droit'+(c.sc.length-w>1?'s':'')+' de lecture'+(w?', '+w+' d’écriture avec aperçu':', aucune écriture')+' · '+c.calls+' appels depuis le '+c.since+'</div></div><div class="r hrow" style="--g:8px"><span class="xs mut hide-s">'+c.last+'</span><button class="btn sm" data-scopes="'+i+'">Droits</button><button class="btn sm danger" data-cut="'+i+'">Couper</button></div></div>'}).join('')+'</div>'+
   '<div class="card"><div class="ch" style="padding-bottom:4px"><h3>Garde-fous</h3>'+ICON('shield')+'</div><div class="list">'+
    '<div class="li"><div class="grow"><div class="t">Aperçu avant toute écriture</div><div class="s">Ce qui change, pour qui, pour combien</div></div><span class="chip ok">'+ICON('lock','sm')+'Toujours</span></div>'+
    '<div class="li"><div class="grow"><div class="t">Double confirmation</div><div class="s">Émission de facture, envoi à plus de 20 personnes</div></div>'+U.tog(true)+'</div>'+
    '<div class="li"><div class="grow"><div class="t">Plafond d’écritures</div><div class="s">Par heure et par utilisateur</div></div><div class="hrow" style="--g:4px"><button class="btn sm icon ghost" data-cap="-5" title="Baisser le plafond">'+ICON('minus','sm')+'</button><b class="num" data-capv style="min-width:22px;text-align:center">30</b><button class="btn sm icon ghost" data-cap="5" title="Monter le plafond">'+ICON('plus','sm')+'</button></div></div>'+
    '<div class="li"><div class="grow"><div class="t">Mineurs : prénom et initiale</div><div class="s">Hors rôle gérant</div></div>'+U.tog(true)+'</div></div>'+
    '<div class="cb" style="padding-top:8px"><div class="xs mut" style="margin-bottom:6px">Jamais confié à une IA</div><div class="hrow wrap" style="--g:5px">'+['Remboursements','Prélèvements','Suppressions','IBAN','Droits d’accès','Flux vidéo','Certificats médicaux'].map(function(x){return '<span class="chip line">'+x+'</span>'}).join('')+'</div></div></div></div>';

  h+='<div class="card"><div class="ch" style="padding-bottom:12px;flex-wrap:wrap"><div><h3>Outils exposés aux assistants</h3><div class="xs mut" style="margin-top:2px"><span data-ncount>'+nOn+' outils actifs sur '+TOOLS.length+', dont '+nW+' en écriture</span>. Les outils interdits à un rôle n’apparaissent pas dans sa liste.</div></div>'+U.seg([['all','Tous'],['L','Lecture'],['E','Écriture']],CX.tf,'data-tf')+'</div>'+
   TDOM.map(function(d){var l=TL.filter(function(t){return t.dom===d});if(!l.length)return '';var op=CX.open[d]||CX.tf!=='all';return '<button class="pfc-dom" data-dom="'+d+'" aria-expanded="'+!!op+'">'+ICON(TIC[d],'sm')+'<b class="s">'+d+'</b><span class="xs mut">'+l.length+' outil'+(l.length>1?'s':'')+' · '+l.filter(function(t){return t.w}).length+' en écriture</span>'+ICON('down','sm')+'</button><div class="pfc-tools"'+(op?'':' hidden')+'>'+l.map(function(t){return '<div class="pfc-tool" data-tool="'+t.n+'" style="'+(t.on?'':'opacity:.5')+'"><div class="nm"><span class="ellip">'+t.n+'</span><span class="pfc-le'+(t.w?' w':'')+'">'+(t.w?'Écriture':'Lecture')+'</span>'+(t.cf===2?'<span class="pfc-le d">Double</span>':'')+'</div><div class="tg"><button class="tog" role="switch" aria-checked="'+t.on+'" data-manual data-ton="'+t.n+'" title="Exposer cet outil"></button></div><div class="ds">'+t.d+'</div></div>'}).join('')+'</div>'}).join('')+'</div>';

  /* permissions par rôle */
  h+='<div class="g3"><div class="card span2"><div class="ch" style="padding-bottom:10px"><div><h3>Permissions par rôle</h3><div class="xs mut" style="margin-top:2px">Ce qu’un assistant peut demander selon la personne qui l’a connecté</div></div></div>';
  if(ctx.mobile){h+='<div style="padding:0 16px 10px">'+U.seg(MROLES.map(function(r,i){return [String(i),r[0]]}),String(CX.role),'data-mr')+'</div><div class="list">'+SCOPES.map(function(s,j){return '<label class="li pf-tap"><div class="grow"><div class="pf-mono">'+s[0]+'</div><div class="s">'+s[1]+'</div></div><button class="tog" role="switch" aria-checked="'+!!MROLES[CX.role][1][j]+'" data-manual data-px="'+CX.role+':'+j+'"></button></label>'}).join('')+'</div>'}
  else h+='<div class="tw"><table class="tbl pfc-mx"><thead><tr><th>Rôle</th>'+SCOPES.map(function(s){return '<th class="sc" title="'+s[1]+'">'+s[0].replace(':',':<wbr>')+'</th>'}).join('')+'</tr></thead><tbody>'+MROLES.map(function(r,i){return '<tr><td class="b">'+r[0]+'</td>'+r[1].map(function(v,j){return '<td class="c"><button class="chk" role="checkbox" aria-checked="'+!!v+'" data-manual data-px="'+i+':'+j+'" title="'+r[0]+' : '+SCOPES[j][0]+'"><svg viewBox="0 0 24 24"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg></button></td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>';
  h+='</div><div class="card"><div class="ch"><h3>Ressources et demandes prêtes</h3></div><div class="cb stack" style="--g:12px"><div class="stack" style="--g:6px">'+['piaffe://ecurie/profil','piaffe://ecurie/tarifs','piaffe://planning/semaine/{date}','piaffe://chevaux/{id}/fiche','piaffe://rapports/mensuel/{aaaa-mm}','piaffe://aide/glossaire'].map(function(u){return '<div class="pf-mono ellip" style="color:var(--ink-2)">'+u+'</div>'}).join('')+'<div class="xs mut">et 4 autres ressources en lecture</div></div><div class="hr"></div><div><div class="xs mut" style="margin-bottom:6px">Demandes proposées dans l’assistant</div><div class="hrow wrap" style="--g:5px">'+['point_du_matin','bilan_du_mois','relancer_les_impayes','bilan_sante_ecurie','equilibrer_la_cavalerie','preparer_un_concours','preparer_la_rentree'].map(function(p){return '<button class="chip pf-mono" data-prompt="'+p+'" style="font-size:11px">'+p+'</button>'}).join('')+'</div></div></div></div></div>';

  /* journal des appels */
  var ST={ok:['Lecture',''],conf:['Écriture validée','ok'],no:['Refusé','bad']};
  h+='<div class="card"><div class="ch" style="padding-bottom:10px"><div><h3>Journal des appels</h3><div class="xs mut" style="margin-top:2px">Qui, quel assistant, quel outil, quels arguments, quel résultat</div></div><button class="btn sm" data-go="assistant" data-p-tab="journal">Journal complet'+ICON('arrow','sm')+'</button></div><div class="pfc-call h"><span>Heure</span><span>Assistant</span><span>Outil et arguments</span><span>Résultat</span><span></span></div>'+
   D.mcpCalls.map(function(c){var p=D.person(c.who),s=ST[c.st];return '<div class="pfc-call"><span class="tm num">'+c.t+'</span><span class="w1 ellip"><b>'+c.cl+'</b> · '+p.first+'</span><span class="t1" style="min-width:0"><div class="pf-mono ellip">'+c.tool+'</div><div class="a">'+esc(c.args)+'</div></span><span class="r1 ellip'+(c.st==='no'?' badc':'')+'">'+c.res+'</span><span class="s1" style="text-align:right">'+U.chip(c.st==='ok'?c.ms+' ms':s[0],s[1])+'</span></div>'}).join('')+'</div></div>';
  return h}

function tabCat(){
  var L=D.connectors.filter(function(k){return (CX.cat==='Tous'||k.cat===CX.cat)&&(CX.st==='all'||(CX.st==='on'?k.st==='on':k.st!=='on'))&&(!CX.q||norm(k.n+' '+k.cat+' '+k.d).indexOf(norm(CX.q))>=0)});
  var h='<div class="stack" style="--g:14px"><div class="pfc-filter"><div class="search grow" style="min-width:220px;max-width:380px"><span>'+ICON('search','sm')+'</span><input class="in" data-kq placeholder="Chercher un connecteur : Qonto, Stripe, caméras…" value="'+esc(CX.q)+'"></div>'+U.seg([['all','Tous'],['on','Connectés'],['off','À connecter']],CX.st,'data-kst')+'</div>'+
   '<div class="pfc-cats scroll-x">'+['Tous'].concat(CATS).map(function(c){var n=c==='Tous'?D.connectors.length:D.connectors.filter(function(k){return k.cat===c}).length;return '<button class="tag" data-manual data-kc="'+c+'" aria-pressed="'+(c===CX.cat)+'">'+c+' <span style="opacity:.6">'+n+'</span></button>'}).join('')+'</div><div data-klist>';
  h+=catList(L)+'</div></div>';return h}
function catList(L){
  if(!L.length)return U.empty('plug','Aucun connecteur ne correspond','Dites-nous ce qu’il vous manque, nous l’ajoutons au catalogue.','<button class="btn sm pri" data-ask>Demander un connecteur</button>');
  var h='';(CX.cat==='Tous'&&!CX.q?CATS:[null]).forEach(function(c){var l=c?L.filter(function(k){return k.cat===c}):L;if(!l.length)return;
    if(c)h+='<div class="pfc-cg">'+c+'<span>'+l.filter(function(k){return k.st==='on'}).length+' connecté'+(l.filter(function(k){return k.st==='on'}).length>1?'s':'')+' sur '+l.length+'</span></div>';
    h+='<div class="pfc-grid" style="margin-top:12px">'+l.map(function(k){return '<button class="card hover pfc-k" data-k="'+k.id+'">'+klogo(k)+'<div class="nm"><span class="ellip">'+k.n+'</span><i class="dot '+k.st+'" title="'+STL[k.st][0]+'"></i></div><div class="ct">'+(c?STL[k.st][0]:k.cat+' · '+STL[k.st][0])+'</div><div class="ds">'+k.d+'</div></button>'}).join('')+'</div>'});
  return h}

function tabAPI(ctx){
  var EP=endpoints(),e=EP[CX.ep],hrs=[4,2,1,1,3,22,61,118,164,142,0,0,0,0,0,0,0,0,0,0,0,0,0,0],used=1842;
  var h='<div class="stack'+(X.q?'':' rise')+'" style="--g:14px"><div class="g3"><div class="card span2"><div class="ch" style="padding-bottom:6px"><div><h3>Clés API</h3><div class="xs mut" style="margin-top:2px">Une clé par usage, avec le moins de droits possible</div></div><button class="btn sm pri" data-do="key">'+ICON('plus','sm')+'Créer une clé</button></div>'+
    D.apiKeys.map(function(k,i){return '<div class="pf-row'+(k.fresh?' pop':'')+'" style="'+(k.st==='off'?'opacity:.55':'')+'"><span class="av sq" style="--c:var(--surface-2);color:var(--mut);box-shadow:inset 0 0 0 1px var(--line)">'+ICON('key')+'</span><div class="grow"><div class="t ellip">'+esc(k.n)+'</div><div class="hrow wrap" style="--g:6px;margin-top:3px"><span class="pf-mono" style="color:var(--mut)">'+k.pre+'…</span>'+k.sc.map(function(s){return '<span class="pfc-le'+(/ecriture/.test(s)?' w':'')+'" style="text-transform:none;letter-spacing:0;font-family:var(--f-mono);font-weight:500">'+s+'</span>'}).join('')+'</div></div><div class="hide-s" style="text-align:right;flex:none"><div class="s">'+k.last+'</div><div class="xs mut">'+k.exp+'</div></div>'+(k.st==='on'?'<button class="btn sm danger" data-rev="'+i+'">Révoquer</button>':'<span class="chip bad">Révoquée</span>')+'</div>'}).join('')+'</div>'+
   '<div class="card"><div class="ch"><h3>Limites de débit</h3><span class="chip ok dot">Dans les limites</span></div><div class="cb stack" style="--g:12px"><div><div class="hrow sp" style="margin-bottom:6px"><span class="s mut">Aujourd’hui</span><b class="num s">'+F.num(used)+' / 10 000 requêtes</b></div>'+U.bar(used/100)+'</div><div><div class="hrow sp" style="margin-bottom:6px"><span class="s mut">Pic sur une minute</span><b class="num s">38 / 120 par clé</b></div>'+U.bar(38/1.2,'var(--c3)')+'</div>'+
    C.bars(hrs.slice(0,10),['0 h','','2 h','','4 h','','6 h','','8 h',''],{h:230,fmt:function(v){return Math.round(v)}})+'<div class="xs mut">Au-delà, l’API répond 429 avec l’en-tête Retry-After. Les en-têtes RateLimit indiquent ce qu’il vous reste.</div></div></div></div>';

  h+='<div class="card"><div class="ch" style="padding-bottom:6px"><div><h3>Webhooks</h3><div class="xs mut" style="margin-top:2px">Piaffe prévient vos outils dès qu’un événement se produit. '+EVENTS.length+' événements disponibles.</div></div><button class="btn sm" data-do="hook">'+ICON('plus','sm')+'Ajouter un webhook</button></div>'+
    D.webhooks.map(function(w,i){return '<div class="pf-row" data-hook="'+i+'" style="cursor:pointer"><span class="av sq" style="--c:var(--acc-pale);color:var(--acc)">'+ICON('webhook')+'</span><div class="grow"><div class="t">'+esc(w.n)+'</div><div class="pf-mono ellip" style="color:var(--mut);font-size:11.5px">'+esc(w.url)+'</div><div class="hrow wrap" style="--g:5px;margin-top:5px">'+w.ev.map(function(e){return '<span class="chip pf-mono" style="font-size:10.5px;height:20px">'+e+'</span>'}).join('')+'</div></div><div class="hide-s" style="text-align:right;flex:none"><div class="s b '+(w.ok<95?'warnc':'okc')+' num">'+String(w.ok).replace('.',',')+' % de réussite</div><div class="xs mut">Dernier envoi '+w.last+'</div></div><button class="tog" role="switch" aria-checked="'+w.on+'" data-manual data-won="'+i+'" title="Activer ou suspendre"></button></div>'}).join('')+
    '<div class="hrow sp" style="padding:12px 16px 8px;border-top:1px solid var(--line);background:var(--surface-2)"><b class="s">Journal des envois</b><span class="xs mut">Conservé 30 jours, rejouable</span></div>'+
    D.webhookLog.map(function(l,i){var w=D.webhooks.find(function(x){return x.id===l.w})||{n:'Webhook supprimé'};return '<div class="pfc-wl'+(l.fresh?' pop':'')+'" data-wl="'+i+'"><span class="tm num">'+l.t+'</span><span class="pf-mono ellip">'+l.ev+'</span><span class="u ellip mut">'+esc(w.n)+(l.next?' · <span class="warnc">'+l.next+'</span>':'')+'</span><span class="hrow" style="--g:8px"><span class="xs mut num hide-s">'+l.ms+' ms'+(l.tr>1?' · '+l.tr+' essais':'')+'</span><span class="pfc-code'+(l.code>=400?' e':'')+'">'+l.code+'</span></span></div>'}).join('')+'</div>';
  D.apiKeys.forEach(function(k){k.fresh=false});D.webhookLog.forEach(function(l){l.fresh=false});

  h+='<div class="card" style="overflow:hidden"><div class="ch" style="padding-bottom:12px;border-bottom:1px solid var(--line);flex-wrap:wrap"><div><h3>Documentation</h3><div class="xs mut" style="margin-top:2px"><span class="pf-mono">'+API_URL+'</span> · JSON · OpenAPI 3.1 · 32 ressources</div></div><div class="hrow wrap" style="--g:8px">'+U.seg([['curl','cURL'],['js','JavaScript'],['py','Python']],CX.lang,'data-lang')+'<button class="btn sm" data-oas>'+ICON('download','sm')+'OpenAPI</button></div></div>'+
   '<div class="pfc-doc"><nav>'+EP.map(function(x,i){return '<button class="pfc-ep" data-ep="'+i+'" aria-current="'+(i===CX.ep)+'"><span class="p"><span class="pfc-m '+x.m+'">'+(x.sig?'HMAC':x.m)+'</span><span>'+(x.sig?'webhooks':x.p)+'</span></span><small>'+x.t+'</small></button>'}).join('')+'</nav>'+
   '<div class="pfc-dbody"><div><div class="hrow wrap" style="--g:8px"><h3 style="font-size:17px">'+e.t+'</h3>'+(e.idem?'<span class="chip acc">Idempotent</span>':'')+'</div><p class="s mut" style="margin-top:4px;font-size:13.5px;max-width:70ch">'+e.d+'</p></div>'+
    pre(reqCode(e,CX.lang),{title:e.sig?'Vérification':'Requête'})+(e.sig?'':'<div class="hrow wrap" style="--g:10px"><button class="btn sm dark" data-try>'+ICON('play','sm')+'Essayer dans le bac à sable</button><span class="s mut" data-status>Réponse attendue</span></div><div class="pfc-res" data-res>'+pre(JSON.stringify(e.res,null,2),{title:(e.code||200)+' '+({200:'OK',201:'Created',202:'Accepted'}[e.code||200])})+'</div>')+'</div></div></div></div>';
  return h}

function renderConn(el,ctx){
  if(ctx.params.tab){CX.tab=ctx.params.tab;delete ctx.params.tab}
  var nOn=D.connectors.filter(function(k){return k.st==='on'}).length;
  el.innerHTML=U.ph('Connecteurs','Reliez l’écurie à votre IA, à votre banque et à vos outils. '+nOn+' connecteurs actifs sur '+D.connectors.length+'.','<button class="btn hide-s" data-go="assistant" data-p-tab="journal">'+ICON('shield','sm')+'Journal de l’IA</button>')+
   '<div style="margin:-6px 0 18px">'+U.tabs([['mcp',ICON('mcp','sm')+' Serveur MCP'],['cat',ICON('plug','sm')+' Catalogue <span class="chip" style="margin-left:4px">'+D.connectors.length+'</span>'],['api',ICON('api','sm')+' API et webhooks']],CX.tab,'data-cx')+'</div><div data-body>'+(CX.tab==='mcp'?tabMCP(ctx):CX.tab==='cat'?tabCat():tabAPI(ctx))+'</div>';
  on(el,'[data-cx]',function(b){CX.tab=b.getAttribute('data-cx');P.rerender()});
  var q=function(s){return el.querySelector(s)};
  if(CX.tab==='mcp'){
    demo(q('[data-demo]'));
    q('[data-cpurl]').onclick=function(){clip(MCP_URL,'Adresse du serveur MCP copiée');this.innerHTML=ICON('check','sm')+'Copiée'};
    on(el,'[data-con]',function(b){connectSheet(b.getAttribute('data-con'))});
    on(el,'[data-cut]',function(b){var i=+b.getAttribute('data-cut'),c=D.mcpClients[i];D.mcpClients.splice(i,1);P.rerender();P.toast(c.n+' n’a plus accès à l’écurie',{undo:function(){D.mcpClients.splice(i,0,c);P.rerender()}})});
    on(el,'[data-scopes]',function(b){var c=D.mcpClients[+b.getAttribute('data-scopes')],p=D.person(c.user);P.sheet({title:'Droits de '+c.n,icon:'shield',body:'<div class="hrow" style="--g:12px;margin-bottom:14px">'+lg(c.l,c.c)+'<div><div class="b">'+c.n+' pour '+p.first+' '+p.last+'</div><div class="s mut">'+(p.role||'')+' · connecté depuis le '+c.since+'</div></div></div><div class="card flat list">'+SCOPES.map(function(s,i){return '<label class="li pf-tap" style="cursor:pointer">'+U.chk(c.sc.indexOf(i)>=0,'cs'+i)+'<div class="grow"><div class="pf-mono">'+s[0]+'</div><div class="s">'+s[1]+'</div></div></label>'}).join('')+'</div>',foot:'<button class="btn pri" data-sv>Enregistrer les droits</button>'});
      var sh=sheet();sh.querySelector('[data-sv]').onclick=function(){c.sc=$$('.chk',sh).map(function(x,i){return x.getAttribute('aria-checked')==='true'?i:-1}).filter(function(i){return i>=0});sh.close();P.rerender();P.toast('Droits de '+c.n+' mis à jour')}});
    on(el,'[data-tf]',function(b){CX.tf=b.getAttribute('data-tf');var vv=el.closest('.view'),y=vv.scrollTop;X.quiet();vv.style.scrollBehavior='auto';vv.scrollTop=y;vv.style.scrollBehavior=''});
    on(el,'[data-ton]',function(b,e){e.stopPropagation();var t=TOOLS.find(function(x){return x.n===b.getAttribute('data-ton')});t.on=!t.on;b.setAttribute('aria-checked',t.on);b.closest('.pfc-tool').style.opacity=t.on?'':'.5';q('[data-ncount]').textContent=TOOLS.filter(function(x){return x.on}).length+' outils actifs sur '+TOOLS.length+', dont '+TOOLS.filter(function(x){return x.w&&x.on}).length+' en écriture';P.toast(t.on?t.n+' est exposé':t.n+' est retiré des assistants')});
    on(el,'[data-dom]',function(b){var d=b.getAttribute('data-dom'),o=b.getAttribute('aria-expanded')!=='true';CX.open[d]=o?1:0;b.setAttribute('aria-expanded',o);b.nextElementSibling.hidden=!o});
    on(el,'[data-tool]',function(b){toolSheet(TOOLS.find(function(x){return x.n===b.getAttribute('data-tool')}))});
    on(el,'[data-px]',function(b){var k=b.getAttribute('data-px').split(':'),r=MROLES[+k[0]];if(+k[0]===0){P.toast('Le rôle Gérant garde tous les droits',{icon:'lock'});return}r[1][+k[1]]=r[1][+k[1]]?0:1;b.setAttribute('aria-checked',!!r[1][+k[1]]);P.toast(r[0]+' : '+SCOPES[+k[1]][0]+(r[1][+k[1]]?' accordé':' retiré'))});
    on(el,'[data-mr]',function(b){CX.role=+b.getAttribute('data-mr');var vv=el.closest('.view'),y=vv.scrollTop;X.quiet();vv.style.scrollBehavior='auto';vv.scrollTop=y;vv.style.scrollBehavior=''});
    on(el,'[data-cap]',function(b){var v=q('[data-capv]'),n=Math.max(5,Math.min(100,+v.textContent+ +b.getAttribute('data-cap')));v.textContent=n});
    on(el,'[data-prompt]',function(b){clip('/'+b.getAttribute('data-prompt'),'Demande « '+b.getAttribute('data-prompt')+' » copiée')});
    D.mcpClients.forEach(function(c){c.fresh=false});
  }else if(CX.tab==='cat'){
    var list=q('[data-klist]');
    function bindK(){on(list,'[data-k]',function(b){connSheet(D.connectors.find(function(k){return k.id===b.getAttribute('data-k')}))});var a=list.querySelector('[data-ask]');if(a)a.onclick=function(){P.toast('Demande envoyée à l’équipe Piaffe : « '+CX.q+' »',{icon:'send'})}}
    function refresh(){var L=D.connectors.filter(function(k){return (CX.cat==='Tous'||k.cat===CX.cat)&&(CX.st==='all'||(CX.st==='on'?k.st==='on':k.st!=='on'))&&(!CX.q||norm(k.n+' '+k.cat+' '+k.d).indexOf(norm(CX.q))>=0)});list.innerHTML=catList(L);bindK()}
    bindK();q('[data-kq]').oninput=function(){CX.q=this.value;refresh()};
    on(el,'[data-kc]',function(b){CX.cat=b.getAttribute('data-kc');$$('[data-kc]',el).forEach(function(x){x.setAttribute('aria-pressed',x===b)});refresh()});
    on(el,'[data-kst]',function(b){CX.st=b.getAttribute('data-kst');refresh()});
  }else{
    X.bindCopy(el);
    on(el,'[data-rev]',function(b){var k=D.apiKeys[+b.getAttribute('data-rev')],o=k.exp;k.st='off';k.exp='Révoquée aujourd’hui';P.rerender();P.toast('Clé « '+k.n+' » révoquée, elle ne fonctionne plus',{undo:function(){k.st='on';k.exp=o;P.rerender()}})});
    on(el,'[data-won]',function(b,e){e.stopPropagation();var w=D.webhooks[+b.getAttribute('data-won')];w.on=!w.on;b.setAttribute('aria-checked',w.on);P.toast(w.on?'Webhook actif':'Webhook suspendu, les événements sont mis en attente')});
    on(el,'[data-hook]',function(b){hookSheet(D.webhooks[+b.getAttribute('data-hook')])});
    on(el,'[data-wl]',function(b){logSheet(D.webhookLog[+b.getAttribute('data-wl')])});
    q('[data-do="key"]').onclick=keySheet;q('[data-do="hook"]').onclick=function(){hookSheet()};
    function keepY(){var v=el.closest('.view'),y=v.scrollTop;X.quiet();v.style.scrollBehavior='auto';v.scrollTop=y;v.style.scrollBehavior=''}
    on(el,'[data-ep]',function(b){CX.ep=+b.getAttribute('data-ep');keepY()});
    on(el,'[data-lang]',function(b){CX.lang=b.getAttribute('data-lang');keepY()});
    q('[data-oas]').onclick=function(){P.toast('Description OpenAPI 3.1 téléchargée',{icon:'download'})};
    var tr=q('[data-try]');if(tr)tr.onclick=function(){var r=q('[data-res]'),s=q('[data-status]');r.style.opacity=.25;s.textContent='Appel en cours';tr.disabled=true;setTimeout(function(){if(!r.isConnected)return;r.style.opacity=1;tr.disabled=false;s.innerHTML='<b class="okc">'+(endpoints()[CX.ep].code||200)+'</b> en '+(96+CX.ep*23)+' ms · <span class="pf-mono">RateLimit-Remaining: '+(81-CX.ep)+'</span>'},P.RM?0:650)};
  }
  if(ctx.params.do){var d=ctx.params.do;delete ctx.params.do;setTimeout(function(){var b=el.querySelector('[data-do="'+d+'"]');if(b)b.click()},80)}
}
P.mod({id:'connecteurs',role:'gerant',group:'Plateforme',title:'Connecteurs',icon:'plug',n:20,phoneTitle:'Connecteurs',short:'Connecteurs',render:renderConn});
P.pf.CX=CX;
})();

/* =====================================================================
   Écran · Arrivée et reprise des données
   ===================================================================== */
(function(){
var D=P.D,F=P.fmt,U=P.ui,$=P.$,$$=P.$$,esc=F.esc,X=P.pf,on=X.on,lg=X.lg,sheet=X.sheet,go=X.go;
P.css(`
.pfi-ob{display:grid;grid-template-columns:auto minmax(0,1fr);gap:22px;align-items:center;padding:18px 20px}
.pfi-steps{display:grid;grid-template-columns:repeat(8,minmax(0,1fr));position:relative}
.pfi-s{display:flex;flex-direction:column;align-items:center;gap:7px;padding:4px 2px;position:relative;font-size:12.5px;font-weight:600;color:var(--ink-2);min-width:0;border-radius:var(--r-sm)}
.pfi-s::before{content:"";position:absolute;top:17px;right:50%;width:100%;height:2px;background:var(--line);z-index:0}
.pfi-s:first-child::before{display:none}
.pfi-s.ok::before,.pfi-s.cur::before{background:var(--ok)}
.pfi-s .c{width:28px;height:28px;border-radius:50%;display:grid;place-items:center;background:var(--surface);box-shadow:inset 0 0 0 2px var(--line-2);color:var(--mut);position:relative;z-index:1;font-size:12px;transition:transform var(--t-2) var(--e-spring)}
.pfi-s:hover .c{transform:scale(1.08)}
.pfi-s.ok .c{background:var(--ok);box-shadow:none;color:var(--acc-ink)}
.pfi-s.ok .c svg.i{width:15px;height:15px;stroke-width:2.6}
.pfi-s.cur .c{box-shadow:inset 0 0 0 2px var(--acc),0 0 0 4px var(--acc-pale);color:var(--acc)}
.pfi-s small{font-size:11px;font-weight:500;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.pfi-lay{display:grid;grid-template-columns:minmax(0,1fr) 336px;gap:14px;align-items:start}
.pfi-wh{display:flex;align-items:center;gap:6px;padding:14px 18px;border-bottom:1px solid var(--line);overflow-x:auto;scrollbar-width:none}
.pfi-ws{display:flex;align-items:center;gap:8px;font-size:13px;font-weight:600;color:var(--mut);white-space:nowrap;flex:none;padding:4px 6px 4px 4px;border-radius:99px}
.pfi-ws.on{color:var(--ink)}.pfi-ws.ok{color:var(--ink-2)}
.pfi-wh>svg.i{color:var(--line-2);width:14px;height:14px}
.pfi-wb{padding:20px;display:flex;flex-direction:column;gap:16px}
.pfi-wf{display:flex;align-items:center;gap:10px;padding:12px 20px;border-top:1px solid var(--line);flex-wrap:wrap}
.pfi-src{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.pfi-t{display:flex;gap:12px;align-items:flex-start;text-align:left;padding:12px;border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line);background:var(--surface);transition:box-shadow var(--t-2),background var(--t-2);min-height:72px}
.pfi-t:hover{box-shadow:inset 0 0 0 1px var(--line-2)}
.pfi-t[aria-pressed="true"]{box-shadow:inset 0 0 0 1.5px var(--acc);background:var(--acc-pale)}
.pfi-t b{display:block;font-size:13.5px}.pfi-t span.d{display:block;font-size:12px;color:var(--mut);line-height:1.35;margin-top:2px}
.pfi-drop{border-radius:var(--r-lg);border:1.5px dashed var(--line-2);background:var(--surface-2);padding:26px 18px;display:flex;flex-direction:column;align-items:center;gap:10px;text-align:center;cursor:pointer;transition:border-color var(--t-2),background var(--t-2)}
.pfi-drop:hover,.pfi-drop.over{border-color:var(--acc);background:var(--acc-pale)}
.pfi-drop .ic{width:48px;height:48px;border-radius:14px;background:var(--surface);box-shadow:var(--shadow-1),inset 0 0 0 1px var(--line);display:grid;place-items:center;color:var(--acc)}
.pfi-file{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:12px;align-items:center;padding:10px 12px;border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line)}
.pfi-file .bar{margin-top:6px;height:4px}
.pfi-scan{position:relative;border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line);overflow:hidden}
.pfi-scan::after{content:"";position:absolute;top:0;bottom:0;width:90px;left:-90px;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--acc) 16%,transparent),transparent);animation:pfiScan 1.5s var(--e-in-out) infinite}
.pfi-scan.done::after{display:none}
@keyframes pfiScan{to{left:100%}}
.pfi-cols{display:grid;grid-template-columns:repeat(5,minmax(0,1fr))}
.pfi-col{padding:10px 10px 12px;border-right:1px solid var(--line);min-width:0;display:flex;flex-direction:column;gap:6px}
.pfi-col:last-child{border-right:0}
.pfi-col .h{font:500 11px var(--f-mono);color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pfi-col .v{font-size:12px;color:var(--ink-2);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pfi-col .m{height:22px;display:flex;align-items:center}
.pfi-col .m .chip{animation:pop var(--t-3) var(--e-spring) both;max-width:100%;overflow:hidden;text-overflow:ellipsis;display:inline-block;line-height:22px}
.pfi-map{display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1fr) 20px minmax(0,1.25fr) 92px;gap:10px;align-items:center;padding:8px 16px;min-height:52px}
.pfi-map+.pfi-map{border-top:1px solid var(--line)}
.pfi-map.h{min-height:0;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--mut);padding-top:12px;padding-bottom:8px}
.pfi-map .ex{font-size:12.5px;color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pfi-map .in{height:34px;font-size:13px}
.pfi-map.w{background:color-mix(in srgb,var(--warn-pale) 55%,transparent)}
.pfi-conf{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:600;font-variant-numeric:tabular-nums}
.pfi-conf .bar{flex:1;height:4px}
.pfi-dup{display:grid;grid-template-columns:minmax(0,1fr) auto minmax(0,1fr);gap:12px;align-items:center;padding:12px 14px}
.pfi-dup .p{padding:10px 12px;border-radius:var(--r-sm);background:var(--surface-2);min-width:0}
.pfi-dup .p small{display:block;font-size:11px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--mut);margin-bottom:4px}
.pfi-dupf{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:0 14px 12px}
.pfi-dupf>.hrow{flex:1}.pfi-dupf>.seg{flex:none}
.pfi-run{display:flex;flex-direction:column;gap:14px;padding:8px 0}
.pfi-log{font:400 12px/1.7 var(--f-mono);color:var(--mut);min-height:124px}
.pfi-log div{animation:rise var(--t-3) var(--e-out) both}
.pfi-log b{color:var(--ok);font-weight:500}
.pfi-big{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.pfi-big>div{padding:16px;border-radius:var(--r-md);background:var(--surface-2);min-width:0}
.pfi-big b{display:block;font:700 34px/1 var(--f-display);letter-spacing:-.04em;font-variant-numeric:tabular-nums}
.pfi-big>div>span{font-size:12.5px;color:var(--mut)}
.pfi-done{display:flex;align-items:center;gap:14px}
.pfi-done .ok{width:52px;height:52px;border-radius:16px;background:var(--ok-pale);color:var(--ok);display:grid;place-items:center;position:relative;flex:none}
.pfi-done .ok svg.i{width:26px;height:26px;stroke-width:2.4}
.pfi-done .ok .strass{position:absolute;right:-5px;top:-5px;width:15px;height:15px}
.pfi-board{position:relative;border-radius:var(--r-md);background:var(--surface-2);box-shadow:inset 0 0 0 6px var(--line-2),inset 0 0 0 7px var(--line);padding:20px 22px;overflow:hidden;font-family:var(--f-display);color:var(--ink-2)}
.pfi-board h5{margin:0 0 10px;font-size:17px;transform:rotate(-1.2deg);color:var(--acc)}
.pfi-board div{font-size:14px;line-height:1.9;transform:rotate(var(--r,-.6deg));white-space:nowrap}
.pfi-board .ln{position:absolute;left:0;right:0;height:46px;top:-46px;background:linear-gradient(180deg,transparent,color-mix(in srgb,var(--acc) 22%,transparent));border-bottom:2px solid var(--acc);animation:pfiLn 1.6s var(--e-in-out) 2 both;transform:none}
@keyframes pfiLn{to{top:100%}}
.pfi-mini{height:74px;border-radius:var(--r-sm);background:var(--surface-2);box-shadow:inset 0 0 0 4px var(--line-2);padding:10px 12px;display:flex;flex-direction:column;gap:6px;justify-content:center}
.pfi-mini i{display:block;height:5px;border-radius:3px;background:var(--line-2)}
@container main (max-width:1060px){.pfi-lay{grid-template-columns:minmax(0,1fr)}.pfi-ob{grid-template-columns:minmax(0,1fr);gap:14px}}
@container main (max-width:760px){
 .pfi-steps{grid-template-columns:repeat(8,84px);overflow-x:auto;scrollbar-width:none;margin:0 -20px;padding:0 12px}
 .pfi-src{grid-template-columns:repeat(2,minmax(0,1fr))}.pfi-t{flex-direction:column;gap:8px;min-height:0}
 .pfi-wb{padding:14px}.pfi-wf{padding:10px 14px}.pfi-wf .btn{flex:1}
 .pfi-cols{grid-template-columns:repeat(3,minmax(0,1fr))}.pfi-col:nth-child(n+4){display:none}
 .pfi-map{grid-template-columns:minmax(0,1fr) 84px;gap:6px 10px;padding:10px 14px}.pfi-map.h,.pfi-map>svg{display:none}.pfi-map .ex{grid-column:1/3;order:3}.pfi-map .sel{grid-column:1/3;order:4}
 .pfi-dup{grid-template-columns:minmax(0,1fr)}.pfi-dup>svg{display:none}.pfi-dupf{flex-direction:column;align-items:stretch}.pfi-dupf .seg button{flex:1;justify-content:center;height:36px}
 .pfi-big{grid-template-columns:repeat(2,minmax(0,1fr))}.pfi-big b{font-size:28px}
}
`);

var NH=D.horses.length,NS=D.staff.length-1,NL=148+NH+1240;
function kinds(k){return D.horses.filter(function(h){return h.kind===k}).length}
var OBD=['Identité vérifiée',D.club.arenas.length+' installations',D.club.boxes+' boxes, '+D.club.paddocks.length+' paddocks',NH+' chevaux','148 adhérents','6 forfaits',NS+' salariés et la gérante','Carte et SEPA actifs'];
var OB=[['Club','stable',OBD[0],1],['Pistes','arena',OBD[1],1],['Boxes','grid',OBD[2],1],['Chevaux','horse',OBD[3],1],['Adhérents','members',OBD[4],1],['Tarifs','tag',OBD[5],1],['Équipe','team',(NS-2)+' salariés sur '+NS+' ont rejoint',2],['Paiement','card','À activer',0]];
var SRC=[['kavalog','Kavalog','Ka','var(--c5)','Correspondance des colonnes déjà connue'],['equimondo','Equimondo','Em','var(--c3)','Adhérents, chevaux et réservations'],['excel','Excel ou CSV','Xl','var(--c7)','N’importe quel tableau, l’IA le comprend'],['ffe','FFE Club SIF','FFE','var(--c1)','Vos fichiers exportés : licenciés, concours'],['autre','Autre logiciel','Au','var(--c4)','GCE, Horse-Manager, AssoConnect…'],['photo','Photo ou PDF','Ph','var(--c6)','Tableau papier, cahier, livret']];
var FILES=[['adherents_kavalog.xlsx','Adhérents',148,'members'],['chevaux_kavalog.csv','Chevaux',NH,'horse'],['factures_2026.csv','Factures',1240,'invoice']];
var FIELDS=['Nom et prénom','Date de naissance','Téléphone mobile','E-mail','Numéro de licence FFE','Galop','Représentant légal','Forfait','Solde du compte','Note','Nom du cheval','Numéro SIRE','Propriétaire','Box','Race','Numéro de facture','Client','Montant TTC','Taux de TVA','Échéance','Statut','Ne pas importer'];
function maps(){var m=D.members,h=D.horses,iv=D.invoices,up=function(x){return x.last.toUpperCase()+' '+x.first},tel=function(x){return x.phone.replace(/ /g,'')};
  return [[['NOM_PRENOM',up(m[0]),0,99],['DATE_NAISS','14/03/1999',1,99],['TEL_PORT',tel(m[0]),2,98],['MAIL',m[0].email,3,99],['NUM_LIC',m[0].lic,4,97],['NIV','G'+m[0].galop,5,96],['RESP_LEGAL',up(m[3]),6,92],['FORMULE','FORF AN 1H',7,71,'Deux forfaits possibles : 1 h ou 2 h par semaine. Vérifiez.'],['SOLDE',String(m[0].balance)+',00',8,95],['OBS','allergie au foin',21,88,'Donnée de santé : non importée par défaut.']],
   [['NOM',h[0].name.toUpperCase(),10,99],['N_SIRE',h[0].sire,11,99],['PROPRIO',up(m[0]),12,94],['BOX',h[0].box,13,99],['RACE','SF',14,90],['OBS','plaques antérieurs',9,84]],
   [['NUM_FACT',iv[0].id,15,99],['CLIENT',up(m[0]),16,97],['TTC',String(iv[0].amount)+',00',17,99],['TVA','20',18,96],['ECHEANCE','15/11/2026',19,99],['ETAT','NP',20,74,'« NP » lu comme « non payée ». Vérifiez.']]]}
var MAPS=null;
function dups(){var m=D.members;return [
  {a:m[7],why:'Même numéro de licence FFE',sure:1,diff:'Téléphone différent : le fichier est plus récent'},
  {a:m[21],why:'Même e-mail',sure:1,diff:'Adresse complétée dans le fichier'},
  {a:m[40],why:'Nom proche et même date de naissance',sure:0,diff:'« '+m[40].last+' » dans Piaffe, « '+m[40].last.slice(0,-1)+' » dans le fichier'},
  {a:m[63],why:'Même nom, même famille',sure:0,diff:'Peut-être un frère ou une sœur : prénoms différents'}]}
var IM={step:0,src:'kavalog',file:0,dup:['f','f','f','c'],ran:false};
var LOTS=D.importLots=D.importLots||[
 {id:'IMP-1109-02',t:'Chevaux, complétés par les données de l’IFCE',n:NH+' lignes',d:'9 nov.',who:'Claire Morel',left:22},
 {id:'IMP-1109-01',t:'Adhérents et familles depuis Kavalog',n:'148 lignes',d:'9 nov.',who:'Claire Morel',left:22},
 {id:'IMP-1103-01',t:'Licenciés FFE Club SIF (fichier exporté)',n:'139 lignes',d:'3 nov.',who:'Nadia Benali',left:16}];

function stepHTML(ctx){
  var s=IM.step;
  if(s===0)return '<div><div class="b" style="font-size:15px;margin-bottom:10px">D’où viennent vos données ?</div><div class="pfi-src">'+SRC.map(function(x){return '<button class="pfi-t" data-src="'+x[0]+'" aria-pressed="'+(x[0]===IM.src)+'">'+lg(x[2],x[3],'sm')+'<span><b>'+x[1]+'</b><span class="d">'+x[4]+'</span></span></button>'}).join('')+'</div></div>'+
    '<div class="pfi-drop" data-drop>'+'<span class="ic">'+ICON('upload','lg')+'</span><div><b style="font-size:15px">Glissez vos fichiers ici</b><div class="s mut" style="margin-top:2px">Excel, CSV, XML de la FFE, PDF ou photo. Plusieurs fichiers à la fois, jusqu’à 50 Mo.</div></div><div class="hrow wrap" style="--g:8px;justify-content:center"><span class="btn sm">Choisir des fichiers</span><span class="btn sm pri" data-ex>'+ICON('play','sm')+'Essayer avec un export d’exemple</span></div></div>'+
    '<div class="note">'+ICON('shield','sm')+'<span>Rien n’est écrit pendant l’analyse. Vous voyez un essai à blanc avant d’importer, et chaque import peut être annulé en bloc pendant 30 jours.</span></div>';
  if(s===1)return '<div class="stack" style="--g:8px">'+FILES.map(function(f,i){return '<div class="pfi-file" data-f="'+i+'"><span class="av sq" style="--c:var(--acc-pale);color:var(--acc)">'+ICON(f[3])+'</span><div style="min-width:0"><div class="hrow sp"><b class="s ellip pf-mono">'+f[0]+'</b><span class="xs mut num" data-fs>0 %</span></div><div class="bar"><i style="--v:0%"></i></div></div><span data-fok style="width:20px"></span></div>'}).join('')+'</div>'+
    '<div><div class="hrow" style="--g:8px;margin-bottom:10px"><span class="strass"></span><b style="font-size:15px" data-at>L’IA lit vos colonnes</b><span class="s mut" data-as>adherents_kavalog.xlsx</span></div><div class="pfi-scan"><div class="pfi-cols">'+MAPS[0].slice(0,5).map(function(c,i){return '<div class="pfi-col"><div class="h">'+c[0]+'</div><div class="m" data-m="'+i+'"><span class="skel" style="width:70%;height:14px"></span></div><div class="v">'+esc(c[1])+'</div><div class="v mut">'+esc(['DUBOIS Emma','02/09/2012','0698112233','emma.dubois@exemple.fr','0398112A'][i])+'</div></div>'}).join('')+'</div></div><div class="xs mut" style="margin-top:8px" data-an>Encodage, séparateur, ligne d’en-tête, formats de date et de téléphone</div></div>';
  if(s===2){var M=MAPS[IM.file],warn=M.filter(function(c){return c[4]}).length;
    return '<div class="hrow sp wrap">'+U.seg(FILES.map(function(f,i){return [String(i),f[1]+' <span class="mut" style="font-weight:500">'+F.num(f[2])+'</span>']}),String(IM.file),'data-file')+'<span class="chip acc" style="white-space:normal;height:auto;min-height:24px;padding-top:3px;padding-bottom:3px">'+ICON('assistant','sm')+'Correspondance proposée par l’IA'+(IM.src==='kavalog'?', mémorisée pour Kavalog':'')+'</span></div>'+
    '<div class="card flat"><div class="pfi-map h"><span>Colonne du fichier</span><span>Exemple</span><span></span><span>Champ dans Piaffe</span><span>Confiance</span></div>'+M.map(function(c,i){return '<div class="pfi-map'+(c[4]?' w':'')+'"><span class="pf-mono ellip">'+c[0]+'</span><span class="ex">'+esc(c[1])+'</span>'+ICON('arrow','sm')+'<span class="sel"><select class="in" data-mp="'+i+'" aria-label="Champ pour '+c[0]+'">'+FIELDS.map(function(f,k){return '<option'+(k===c[2]?' selected':'')+'>'+f+'</option>'}).join('')+'</select>'+(c[4]?'<span class="xs warnc" style="display:block;margin-top:4px">'+c[4]+'</span>':'')+'</span><span class="pfi-conf"><span class="'+(c[3]<80?'warnc':'')+'">'+c[3]+' %</span>'+U.bar(c[3],c[3]<80?'var(--warn)':'var(--ok)')+'</span></div>'}).join('')+'</div>'+
    (IM.file===0?'<div><div class="b s" style="margin-bottom:8px">Après nettoyage, voici ce qui sera enregistré</div><div class="tw card flat"><table class="tbl"><thead><tr><th>Dans le fichier</th><th>Dans Piaffe</th><th>Règle appliquée</th></tr></thead><tbody>'+[[MAPS[0][0][1],D.members[0].first+' '+D.members[0].last,'Nom et prénom séparés, casse corrigée'],[MAPS[0][2][1],'+33 '+D.members[0].phone.slice(1),'Téléphone au format international'],['14/03/1999','14 mars 1999','Date reconnue (jour, mois, année)'],['G7','Galop 7','Niveau rapproché du référentiel FFE']].map(function(r){return '<tr><td class="pf-mono" style="color:var(--mut)">'+esc(r[0])+'</td><td class="b">'+r[1]+'</td><td class="mut">'+r[2]+'</td></tr>'}).join('')+'</tbody></table></div></div>':'')+
    (warn?'<div class="note warn">'+ICON('alert','sm')+'<span><b>'+warn+' colonne'+(warn>1?'s':'')+' à vérifier</b> dans ce fichier. L’IA propose, c’est vous qui décidez.</span></div>':'<div class="note ok">'+ICON('checkc','sm')+'<span>Toutes les colonnes de ce fichier sont reconnues avec une confiance élevée.</span></div>')}
  if(s===3){var DU=dups(),L={f:'Fusionner',c:'Créer une fiche',i:'Ignorer'};
    return '<div class="pfi-big"><div><b class="okc">'+F.num(NL-9)+'</b><span>lignes prêtes : '+F.num(NL-48)+' créations, 39 mises à jour</span></div><div><b class="warnc">'+DU.length+'</b><span>doublons possibles à décider</span></div><div><b class="badc">3</b><span>lignes à corriger, mises de côté</span></div></div>'+
    '<div><div class="hrow sp" style="margin-bottom:8px"><b style="font-size:15px">Doublons possibles</b><button class="btn sm" data-allf>Fusionner les 2 certains</button></div><div class="stack" style="--g:10px">'+DU.map(function(d,i){var a=d.a;return '<div class="card flat"><div class="pfi-dup"><div class="p"><small>Dans votre fichier</small><div class="b s" style="font-size:13.5px">'+a.first+' '+(i===2?a.last.slice(0,-1):a.last)+'</div><div class="xs mut">'+(i===3?'Prénom : '+D.members[64].first:a.email)+'</div></div>'+ICON('swap')+'<div class="p"><small>Déjà dans Piaffe</small><div class="hrow" style="--g:8px">'+U.av(a.id,'sm')+'<div style="min-width:0"><div class="b s ellip" style="font-size:13.5px">'+a.first+' '+a.last+'</div><div class="xs mut ellip">Galop '+a.galop+' · licence '+a.lic+'</div></div></div></div></div><div class="pfi-dupf"><div class="hrow wrap" style="--g:6px"><span class="chip '+(d.sure?'ok':'warn')+' dot">'+d.why+'</span><span class="xs mut">'+d.diff+'</span></div>'+U.seg([['f','Fusionner'],['c','Créer'],['i','Ignorer']],IM.dup[i],'data-dp="'+i+'" data-dv')+'</div></div>'}).join('')+'</div></div>'+
    '<div class="card flat"><div class="ch" style="padding-bottom:6px"><h3>3 lignes à corriger</h3><button class="btn sm ghost" data-rej>'+ICON('download','sm')+'Télécharger ces lignes</button></div><div class="list">'+[['Adhérents, ligne 47','Date de naissance impossible : 31/02/2011'],['Adhérents, ligne 92','E-mail sans arobase : « paul.girardexemple.fr »'],['Factures, ligne 131','Client introuvable : « ECURIE DU PARC »']].map(function(r){return '<div class="li"><span class="av sq sm" style="--c:var(--bad-pale);color:var(--bad)">'+ICON('alert','sm')+'</span><div class="grow"><div class="t">'+r[0]+'</div><div class="s">'+r[1]+'</div></div></div>'}).join('')+'</div></div>'+
    '<div class="note">'+ICON('family','sm')+'<span><b>61 familles regroupées</b> à partir de l’adresse, de l’e-mail et du payeur. Les soldes sont repris au 17 novembre avec une écriture d’ouverture.</span></div>';}
  if(IM.ran)return '<div class="pfi-done"><span class="ok">'+ICON('check')+'<span class="strass"></span></span><div><h3 style="font-size:21px">Import terminé en 38 secondes</h3><div class="s mut">Lot <span class="pf-mono">IMP-1117-01</span> · annulable en bloc jusqu’au 17 décembre</div></div></div>'+
    '<div class="pfi-big"><div><b><span data-count="148">148</span></b><span>adhérents importés</span></div><div><b><span data-count="'+NH+'">'+NH+'</span></b><span>chevaux importés</span></div><div><b><span data-count="1240">1 240</span></b><span>factures importées</span></div><div><b><span data-count="61">61</span></b><span>familles regroupées</span></div><div><b><span data-count="'+IM.dup.filter(function(x){return x==='f'}).length+'">3</span></b><span>doublons fusionnés</span></div><div><b><span data-count="6">6</span></b><span>forfaits reconnus</span></div></div>'+
    '<div class="card flat list"><div class="li">'+ICON('horse')+'<div class="grow"><div class="t">'+NH+' fiches de chevaux complétées</div><div class="s">Race, robe et origines ajoutées depuis le numéro SIRE (données ouvertes de l’IFCE)</div></div><span class="chip ok dot">Fait</span></div><div class="li">'+ICON('wallet')+'<div class="grow"><div class="t">Soldes repris au 17 novembre</div><div class="s">9 impayés pour '+F.eur(X.sum(D.invoices.filter(function(i){return i.status==='en retard'}),function(i){return i.amount}))+', 14 cartes de séances en cours</div></div><span class="chip ok dot">Fait</span></div><div class="li">'+ICON('alert')+'<div class="grow"><div class="t">3 lignes à corriger</div><div class="s">Mises de côté, à réimporter quand vous voulez</div></div><button class="btn sm" data-rej>Voir</button></div></div>';
  return '<div class="pfi-run"><div class="hrow sp"><b style="font-size:15px" data-rt>Import en cours</b><b class="num" data-rp>0 %</b></div><div class="bar" style="height:8px"><i data-rb style="--v:0%;transition:width 300ms linear"></i></div><div class="pfi-log" data-log></div></div>';
}
function footHTML(){var s=IM.step;
  if(s===0)return '<button class="btn" data-tpl>'+ICON('download','sm')+'Modèles de fichiers Piaffe</button><span class="grow"></span><button class="btn pri" data-ex>Analyser un export d’exemple'+ICON('arrow','sm')+'</button>';
  if(s===1)return '<button class="btn" data-prev>Retour</button><span class="grow"></span><button class="btn pri" data-next disabled>Voir la correspondance'+ICON('arrow','sm')+'</button>';
  if(s===2)return '<button class="btn" data-prev>Retour</button><span class="grow"></span><span class="s mut hide-s">3 fichiers, '+F.num(NL)+' lignes</span><button class="btn pri" data-next>Vérifier les doublons'+ICON('arrow','sm')+'</button>';
  if(s===3)return '<button class="btn" data-prev>Retour</button><span class="grow"></span><span class="s mut hide-s">Annulable pendant 30 jours</span><button class="btn pri" data-next>'+ICON('upload','sm')+'Lancer l’import</button>';
  return IM.ran?'<button class="btn danger" data-undo>Annuler cet import</button><span class="grow"></span><button class="btn" data-again>Importer autre chose</button><button class="btn pri" data-see>Voir les adhérents'+ICON('arrow','sm')+'</button>':'<span class="s mut">Vous pouvez quitter cette page, l’import continue.</span>';
}

function obSheet(i){var o=OB[i],A=D.club.arenas,body=[
  '<dl class="pf-kv"><dt>Nom</dt><dd>'+D.club.name+'</dd><dt>Adresse</dt><dd>'+D.club.address+'</dd><dt>SIRET</dt><dd class="num">'+D.club.siret+'</dd><dt>Affiliation</dt><dd>'+D.club.ffe+'</dd><dt>Type</dt><dd>Centre équestre et écurie de propriétaires</dd></dl><div class="note ok" style="margin-top:14px">'+ICON('checkc','sm')+'<span>SIRET vérifié auprès du répertoire des entreprises.</span></div>',
  '<div class="card flat list">'+A.map(function(a){return '<div class="li">'+ICON('arena')+'<div class="grow"><div class="t">'+a.name+'</div><div class="s">'+a.kind+' · '+a.size+'</div></div><span class="chip ok dot">Réservable</span></div>'}).join('')+'</div>',
  '<div class="pfi-big" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div><b>46</b><span>boxes, de B01 à B46</span></div><div><b>6</b><span>paddocks et prairies</span></div></div><div class="hrow wrap" style="--g:6px;margin-top:14px">'+D.club.paddocks.map(function(p){return '<span class="chip">'+p+'</span>'}).join('')+'</div>',
  '<div class="pfi-big"><div><b>'+kinds('club')+'</b><span>chevaux de club</span></div><div><b>'+kinds('proprietaire')+'</b><span>de propriétaires</span></div><div><b>'+kinds('demi')+'</b><span>en demi-pension</span></div></div><div class="note" style="margin-top:14px">'+ICON('info','sm')+'<span>Les fiches ont été complétées à partir du numéro SIRE grâce aux données ouvertes de l’IFCE.</span></div>',
  '<div class="pfi-big" style="grid-template-columns:repeat(2,minmax(0,1fr))"><div><b>148</b><span>adhérents repris de Kavalog</span></div><div><b>61</b><span>familles regroupées</span></div></div>',
  '<div class="card flat list">'+D.forfaits.map(function(f){return '<div class="li"><div class="grow t">'+f.name+'</div><b class="num s">'+(f.price?F.eur(f.price):'Inclus')+'</b></div>'}).join('')+'</div>',
  '<div class="card flat list">'+D.staff.map(function(s,k){return '<div class="li">'+U.av(s.id)+'<div class="grow"><div class="t">'+s.first+' '+s.last+'</div><div class="s">'+s.role+'</div></div>'+(k<7||OB[6][3]===1?'<span class="chip ok dot">'+(k?'A rejoint':'Gérante')+'</span>':'<button class="btn sm" data-inv="'+s.first+'">Relancer</button>')+'</div>'}).join('')+'</div>',
  '<div class="card flat list">'+[['card','Carte bancaire en ligne','Stripe, connecté',1],['bank','Prélèvement SEPA','GoCardless, 14 mandats signés',1],['ticket','Chèques-vacances','À activer : convention ANCV à joindre',0],['wallet','Terminal de l’accueil','SumUp, à appairer',0]].map(function(x){return '<div class="li">'+ICON(x[0])+'<div class="grow"><div class="t">'+x[1]+'</div><div class="s">'+x[2]+'</div></div>'+(x[3]?'<span class="chip ok dot">Actif</span>':'<button class="btn sm" data-pay>Activer</button>')+'</div>'}).join('')+'</div>'][i];
  P.sheet({title:'Étape '+(i+1)+' · '+o[0],icon:o[1],body:'<div class="hrow" style="--g:8px;margin-bottom:14px">'+U.chip(o[3]===1?'Terminée':o[3]===2?'En cours':'À faire',o[3]===1?'ok':o[3]===2?'acc':'warn',true)+'<span class="s mut">'+o[2]+'</span></div>'+body,
   foot:'<button class="btn" data-set>Modifier dans les réglages</button>'+(o[3]===1?'<button class="btn pri" data-c>Fermer</button>':'<button class="btn pri" data-fin>'+ICON('check','sm')+'Marquer l’étape comme terminée</button>')});
  var sh=sheet(),q=function(s){return sh.querySelector(s)};
  q('[data-set]').onclick=function(){sh.close();P.go('reglages',{sec:['club','inst','inst','club','club','tarifs','roles','abo'][i]})};
  if(q('[data-c]'))q('[data-c]').onclick=function(){sh.close()};
  if(q('[data-fin]'))q('[data-fin]').onclick=function(){o[3]=1;o[2]=OBD[i];var nx=OB.findIndex(function(x){return x[3]!==1});if(nx>=0&&OB[nx][3]===0)OB[nx][3]=2;sh.close();P.rerender();var all=nx<0;P.toast(all?'Mise en route terminée : bienvenue dans Piaffe':'Étape « '+o[0]+' » terminée'+(NC.replay&&nx>=0?', place à « '+OB[nx][0]+' »':''),{icon:all?'checkc':'check'});if(NC.replay&&nx>=0)setTimeout(function(){obSheet(nx)},P.RM?0:450)};
  on(sh,'[data-inv]',function(b){b.outerHTML='<span class="chip acc dot">Invitation renvoyée</span>';P.toast('Invitation renvoyée à '+b.getAttribute('data-inv'))});
  on(sh,'[data-pay]',function(b){b.outerHTML='<span class="chip acc dot">Demande envoyée</span>';P.toast('Activation demandée, nous revenons vers vous sous 24 h')});
}
function photoSheet(){
  var rows=[['17 h','Galop 1-2','Emma B.','Vanille',98],['17 h','Galop 1-2','Lucas M.','Câline',62],['17 h','Galop 1-2','Zoé L.','Pistache',95],['18 h','Galop 6-7 CSO','Hugo D.','Sirius',97],['18 h','Galop 6-7 CSO','Manon R.','Tango',71],['18 h','Galop 6-7 CSO','Lina P.','Opale',96]];
  P.sheet({title:'Lire une photo de tableau',icon:'image',wide:true,body:'<div class="stack" style="--g:14px"><div class="pfi-board"><span class="ln"></span><h5>MARDI 17, reprises du soir</h5>'+[['17h  Galop 1-2 (Inès, manège)','-.8deg'],['Emma B. : Vanille     Lucas M. : Caline ?','.4deg'],['Zoé L. : Pistache','-.3deg'],['18h  G 6-7 CSO (Thomas, carrière)','.6deg'],['Hugo D. : Sirius    Manon R. : Tang…    Lina P. : Opale','-.5deg']].map(function(r){return '<div style="--r:'+r[1]+'">'+r[0]+'</div>'}).join('')+'</div>'+
    '<div data-out><div class="hrow" style="--g:10px;color:var(--mut)"><span class="typing"><i></i><i></i><i></i></span><span class="s">L’IA lit le tableau : écriture manuscrite, noms de chevaux, horaires</span></div></div></div>',
   foot:'<button class="btn" data-c>Annuler</button><button class="btn pri" data-add disabled>'+ICON('planning','sm')+'Ajouter au planning</button>'});
  var sh=sheet();sh.querySelector('[data-c]').onclick=function(){sh.close()};
  setTimeout(function(){if(!sh.isConnected)return;sh.querySelector('[data-out]').innerHTML='<div class="pop"><div class="hrow sp wrap" style="margin-bottom:8px"><b style="font-size:15px">6 attributions lues</b><span class="chip warn dot">2 cases à vérifier</span></div><div class="tw card flat"><table class="tbl"><thead><tr><th>Heure</th><th>Reprise</th><th>Cavalier</th><th>Cheval</th><th class="n">Confiance</th></tr></thead><tbody>'+rows.map(function(r){var w=r[4]<80;return '<tr><td class="num">'+r[0]+'</td><td>'+r[1]+'</td><td>'+r[2]+'</td><td>'+(w?'<input class="in" value="'+r[3]+'" style="height:30px;width:110px;box-shadow:inset 0 0 0 1.5px var(--warn)" aria-label="Cheval à vérifier">':'<b>'+r[3]+'</b>')+'</td><td class="n"><span class="'+(w?'warnc b':'mut')+'">'+r[4]+' %</span></td></tr>'}).join('')+'</tbody></table></div><div class="xs mut" style="margin-top:8px">Les noms sont rapprochés de vos chevaux et de vos adhérents. Ce qui est incertain reste à valider par vous.</div></div>';sh.querySelector('[data-add]').disabled=false},P.RM?50:2600);
  sh.querySelector('[data-add]').onclick=function(){sh.close();LOTS.unshift({id:'IMP-1117-02',t:'Tableau papier du mardi soir (photo)',n:'6 lignes',d:'aujourd’hui',who:'Claire Morel',left:30});P.rerender();P.toast('6 attributions ajoutées au planning de ce soir')};
}
function helpSheet(){
  var sl=[['Aujourd’hui','14 h 30'],['Aujourd’hui','17 h 00'],['Demain','9 h 00'],['Demain','11 h 30'],['Jeudi','10 h 00'],['Jeudi','15 h 30']];
  P.sheet({title:'Se faire accompagner',icon:'phone',body:'<div class="stack" style="--g:16px"><div class="hrow" style="--g:12px"><span class="av lg" style="--c:var(--c6)">ML</span><div><div class="b" style="font-size:15px">Marion Lefort</div><div class="s mut">Votre accompagnatrice, ancienne gérante de centre équestre</div></div></div><p style="font-size:14px;line-height:1.5">Marion reprend vos données avec vous en partage d’écran, ou s’en charge à votre place à partir de vos exports. C’est compris dans votre abonnement, sans limite de temps.</p><div><div class="b s" style="margin-bottom:8px">Choisissez un créneau de 30 minutes</div><div class="g3" style="--g:8px">'+sl.map(function(s,i){return '<button class="pfi-t" data-sl="'+i+'" aria-pressed="'+(i===2)+'" style="min-height:0;flex-direction:column;gap:2px;padding:10px 12px"><span class="xs mut">'+s[0]+'</span><b>'+s[1]+'</b></button>'}).join('')+'</div></div><label class="field"><span>Un mot pour Marion (facultatif)</span><textarea class="in" rows="2" placeholder="Par exemple : je viens de Kavalog et j’ai aussi un cahier de soins papier"></textarea></label></div>',
   foot:'<button class="btn" data-give>Lui confier mes fichiers</button><button class="btn pri" data-book>Réserver l’appel</button>'});
  var sh=sheet(),cur=2;on(sh,'[data-sl]',function(b){cur=+b.getAttribute('data-sl');$$('[data-sl]',sh).forEach(function(x){x.setAttribute('aria-pressed',x===b)})});
  sh.querySelector('[data-book]').onclick=function(){sh.close();P.toast('Appel réservé avec Marion : '+sl[cur][0].toLowerCase()+' à '+sl[cur][1])};
  sh.querySelector('[data-give]').onclick=function(){sh.close();P.toast('Fichiers transmis à Marion, réponse sous 24 h ouvrées',{icon:'send'})};
}

/* ---------- Rejouer l'arrivée d'un nouveau club : trois questions, le menu obtenu, puis les 8 étapes ---------- */
P.css(`
.pfn-st{display:flex;align-items:center;gap:8px;font-size:12.5px;font-weight:600;color:var(--mut);flex-wrap:wrap}
.pfn-st span{display:inline-flex;align-items:center;gap:6px}
.pfn-st b{width:22px;height:22px;border-radius:50%;display:grid;place-items:center;font-size:11.5px;box-shadow:inset 0 0 0 1.5px var(--line-2);color:var(--ink-2)}
.pfn-st .on{color:var(--ink)}.pfn-st .on b{background:var(--acc);color:var(--acc-ink);box-shadow:none}
.pfn-st .ok b{background:var(--ok);color:var(--surface);box-shadow:none}
.pfn-st .ok b svg.i{width:12px;height:12px;stroke-width:2.6}
.pfn-q{font:650 15px var(--f-display);letter-spacing:-.01em;margin-bottom:10px}
.pfn-ty{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.pfn-ty button,.pfn-sz button{display:flex;flex-direction:column;align-items:flex-start;gap:6px;padding:12px;border-radius:var(--r-md);text-align:left;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2);min-width:0;transition:box-shadow var(--t-2),background var(--t-2)}
.pfn-ty button svg.i{color:var(--mut)}
.pfn-ty b,.pfn-sz b{font-size:13.5px}.pfn-ty small,.pfn-sz small{font-size:12px;color:var(--mut);line-height:1.35}
.pfn-ty button[aria-pressed="true"],.pfn-sz button[aria-pressed="true"]{box-shadow:inset 0 0 0 2px var(--acc);background:var(--acc-pale)}
.pfn-ty button[aria-pressed="true"] svg.i{color:var(--acc)}
.pfn-sz{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.pfn-md{display:flex;flex-wrap:wrap;gap:6px}
.pfn-md .tag[aria-pressed="true"]{background:var(--acc-pale);color:var(--acc);box-shadow:inset 0 0 0 1px var(--acc-line)}
.pfn-pv{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:start}
.pfn-mn{border-radius:var(--r-lg);box-shadow:inset 0 0 0 1px var(--line);padding:10px;background:var(--surface-2)}
.pfn-banner{display:flex;align-items:center;gap:12px;flex-wrap:wrap;padding:12px 14px;border-radius:var(--r-md);background:var(--acc-pale);box-shadow:inset 0 0 0 1px var(--acc-line);font-size:13px}
@container main (max-width:760px){.pfn-ty{grid-template-columns:repeat(2,minmax(0,1fr))}.pfn-sz{grid-template-columns:minmax(0,1fr)}.pfn-pv{grid-template-columns:minmax(0,1fr)}}
`);
var NTY=[['club','Centre équestre','Reprises, cavaliers, licences','planning'],['pension','Écurie de propriétaires','Pensions, soins, installations','owner'],['elevage','Élevage','Juments, poulains, soins','heart'],['mixte','Mixte','Un peu de tout cela','layers']];
var NSZ=[['Moins de 20 chevaux','Formule Essentiel, 59 € HT par mois'],['De 20 à 60 chevaux','Formule Écurie, 149 € HT par mois'],['Plus de 60 chevaux','Formule Réseau, 289 € HT par mois']];
var NOPT=['planning','adherents','pensions','coachs','competitions','boutique','communication','cameras','ecurie3d','alimentation','entretien','compta','contrats','equipe','rapports'];
var NDEF={club:['pensions','cameras','ecurie3d'],pension:['planning','adherents','competitions','boutique'],elevage:['planning','adherents','pensions','coachs','competitions','boutique','communication'],mixte:[]};
var NC={step:0,type:'club',size:1,off:NDEF.club.slice(),replay:false,prev:null};
function mtitle(id){var m=P.mods[id];return m?m.title:id}
function newClubSheet(st){NC.step=st||0;
  function body(){var st=['Trois questions','Votre menu','C’est prêt'];
   var h='<div class="stack" style="--g:18px"><div class="pfn-st">'+st.map(function(t,i){return (i?ICON('right','sm'):'')+'<span class="'+(i===NC.step?'on':i<NC.step?'ok':'')+'"><b>'+(i<NC.step?ICON('check'):i+1)+'</b>'+t+'</span>'}).join('')+'</div>';
   if(NC.step===0){h+='<div><div class="pfn-q">1. Quel est votre établissement ?</div><div class="pfn-ty">'+NTY.map(function(t){return '<button data-ty="'+t[0]+'" aria-pressed="'+(NC.type===t[0])+'">'+ICON(t[3])+'<b>'+t[1]+'</b><small>'+t[2]+'</small></button>'}).join('')+'</div></div>'+
     '<div><div class="pfn-q">2. Combien de chevaux accueillez-vous ?</div><div class="pfn-sz">'+NSZ.map(function(z,i){return '<button data-sz="'+i+'" aria-pressed="'+(NC.size===i)+'"><b>'+z[0]+'</b><small>'+z[1]+'</small></button>'}).join('')+'</div></div>'+
     '<div><div class="pfn-q">3. Quels modules voulez-vous ?</div><div class="s mut" style="margin-bottom:10px">Proposés selon votre type d’établissement. Touchez pour ajouter ou retirer. Vous pourrez tout changer dans les réglages.</div><div class="pfn-md">'+NOPT.filter(function(id){return P.mods[id]}).map(function(id){return '<button class="tag" data-md="'+id+'" aria-pressed="'+(NC.off.indexOf(id)<0)+'">'+ICON(P.mods[id].icon,'sm')+mtitle(id)+'</button>'}).join('')+'</div></div>'}
   else if(NC.step===1){var L=P.modsFor('gerant',true),act=L.filter(function(m){return NC.off.indexOf(m.id)<0}),hid=L.filter(function(m){return NC.off.indexOf(m.id)>=0}),g=null,mn='';
     act.forEach(function(m,i){if(m.group!==g){g=m.group;mn+='<div class="pfr-mg">'+g+'</div>'}mn+='<div class="pfr-mn'+(i===0?' on':'')+'">'+ICON(m.icon)+m.title+'</div>'});
     var ty=NTY.find(function(t){return t[0]===NC.type});
     h+='<div class="pfn-pv"><div class="pfn-mn"><div class="eyebrow" style="margin:2px 8px 4px">Menu du gérant</div><div class="xs mut" style="margin:0 8px 6px">'+act.length+' écrans sur '+L.length+'</div>'+mn+'</div>'+
      '<div class="stack" style="--g:12px"><div class="card flat" style="padding:14px"><div class="eyebrow">Votre établissement</div><div class="b" style="font-size:16px;margin-top:4px">'+ty[1]+'</div><div class="s mut">'+NSZ[NC.size][0]+' · '+NSZ[NC.size][1]+'</div></div>'+
      (hid.length?'<div><div class="b s" style="margin-bottom:8px">Masqués pour l’instant</div><div class="hrow wrap" style="--g:6px">'+hid.map(function(m){return '<span class="chip">'+ICON(m.icon,'sm')+m.title+'</span>'}).join('')+'</div></div>':'<div class="note ok">'+ICON('checkc','sm')+'<span>Tous les modules sont actifs.</span></div>')+
      '<div class="note">'+ICON('info','sm')+'<span>Un module masqué disparaît du menu et de la recherche, sans perte de données. Il revient d’un geste dans Réglages, Modules et vues.</span></div></div></div>'}
   else h+='<div class="pfi-done"><span class="ok">'+ICON('check')+'<span class="strass"></span></span><div><h3 style="font-size:20px">Votre menu est en place</h3><div class="s mut">'+(P.modsFor('gerant').length)+' écrans dans le menu. Il reste les 8 étapes de mise en route, environ 10 minutes.</div></div></div>'+
     '<div class="card flat list">'+OB.map(function(o,i){return '<div class="li">'+ICON(o[1])+'<div class="grow"><div class="t">Étape '+(i+1)+' · '+o[0]+'</div><div class="s">'+o[2]+'</div></div>'+(i===0?'<span class="chip acc dot">En premier</span>':'')+'</div>'}).join('')+'</div>';
   return h+'</div>'}
  function foot(){return NC.step===0?'<button class="btn" data-c>Annuler</button><span class="grow"></span><button class="btn pri" data-n>Voir le menu obtenu'+ICON('arrow','sm')+'</button>':NC.step===1?'<button class="btn" data-b>Retour</button><span class="grow"></span><button class="btn pri" data-ap>'+ICON('check','sm')+'Appliquer</button>':'<button class="btn" data-c>Plus tard</button><span class="grow"></span><button class="btn pri" data-go1>Lancer les 8 étapes'+ICON('arrow','sm')+'</button>'}
  var sh=P.sheet({title:'Arrivée d’un nouveau club',icon:'onboarding',wide:true,body:function(b){b.innerHTML=body()},foot:foot()});
  var bd=sh.querySelector('.sb'),ft=sh.querySelector('.sf');
  function re(){bd.innerHTML=body();ft.innerHTML=foot();bd.scrollTop=0}
  sh.addEventListener('click',function(e){var t=e.target.closest('button');if(!t||!sh.contains(t))return;
    if(t.hasAttribute('data-ty')){NC.type=t.getAttribute('data-ty');NC.off=NDEF[NC.type].slice();re()}
    else if(t.hasAttribute('data-sz')){NC.size=+t.getAttribute('data-sz');re()}
    else if(t.hasAttribute('data-md')){var id=t.getAttribute('data-md'),k=NC.off.indexOf(id);if(k>=0)NC.off.splice(k,1);else NC.off.push(id);t.setAttribute('aria-pressed',k>=0)}
    else if(t.hasAttribute('data-n')){NC.step=1;re()}
    else if(t.hasAttribute('data-b')){NC.step=0;re()}
    else if(t.hasAttribute('data-c'))sh.close();
    else if(t.hasAttribute('data-ap')){if(!NC.replay)NC.prev={off:P.prefs.off('gerant').slice(),ob:OB.map(function(o){return o.slice()})};NC.replay=true;
      OB.forEach(function(o,i){o[3]=i===0?2:0;o[2]=['Nom, SIRET, affiliation','Carrières et manèges','Boxes et paddocks','Fiches et numéros SIRE','Cavaliers et familles','Forfaits et cartes','Inviter vos salariés','Carte et prélèvement'][i]});
      NC.step=2;P.prefs.setOff('gerant',NC.off.slice());if(!sh.isConnected)newClubSheet(2);else re();P.toast('Menu appliqué : '+P.modsFor('gerant').length+' écrans actifs')}
    else if(t.hasAttribute('data-go1')){sh.close();P.rerender();setTimeout(function(){obSheet(0)},P.RM?0:300)}});
  return sh}
function endReplay(){var p=NC.prev;NC.replay=false;if(p){OB.forEach(function(o,i){o[2]=p.ob[i][2];o[3]=p.ob[i][3]});P.prefs.setOff('gerant',p.off)}NC.prev=null;P.toast('Retour à l’Écurie des Tilleuls, menu et étapes rétablis',{icon:'refresh'})}

function renderImport(el,ctx){
  MAPS=MAPS||maps();
  if(ctx.params.src){var m={'kavalog':'kavalog','equimondo':'equimondo','excel-et-csv':'excel','photos-et-pdf':'photo'}[ctx.params.src]||(/ffe/.test(ctx.params.src)?'ffe':'autre');IM.src=m;IM.step=0;delete ctx.params.src}
  var done=OB.filter(function(o){return o[3]===1}).length,WS=['Source','Fichiers','Colonnes','Doublons','Rapport'];
  el.innerHTML=U.ph('Arrivée et reprise des données','Reprenez vos adhérents, vos chevaux et vos factures sans rien ressaisir. L’IA lit vos fichiers, vous validez.','<button class="btn" data-do="new">'+ICON('onboarding','sm')+'Rejouer l’arrivée d’un nouveau club</button><button class="btn hide-s" data-do="help">'+ICON('phone','sm')+'Se faire accompagner</button>')+
   '<div class="stack'+(X.q?'':' rise')+'" style="--g:14px"><div class="card pfi-ob"><div class="hrow" style="--g:14px">'+U.ring(Math.round(done/8*100),done+'/8',done===8?'var(--ok)':'var(--acc)',58)+'<div><div class="b" style="font-size:15.5px">'+(NC.replay?'Mise en route d’un nouveau club':'Mise en route des Tilleuls')+'</div><div class="s mut">'+(done===8?'Tout est prêt. Bienvenue dans Piaffe.':'Il reste '+(8-done)+' étape'+(8-done>1?'s':'')+', environ 10 minutes')+'</div></div></div>'+
     '<div class="pfi-steps scroll-x">'+OB.map(function(o,i){return '<button class="pfi-s '+(o[3]===1?'ok':o[3]===2?'cur':'')+'" data-ob="'+i+'" title="'+o[0]+' : '+o[2]+'"><span class="c">'+(o[3]===1?ICON('check'):i+1)+'</span>'+o[0]+'<small>'+o[2]+'</small></button>'}).join('')+'</div></div>'+
   (NC.replay?'<div class="pfn-banner">'+ICON('onboarding','sm')+'<span class="grow">Vous rejouez l’arrivée d’un nouveau club : menu choisi, '+OB.filter(function(o){return o[3]===1}).length+' étape'+(OB.filter(function(o){return o[3]===1}).length>1?'s':'')+' sur 8 faite'+(OB.filter(function(o){return o[3]===1}).length>1?'s':'')+'.</span><button class="btn sm" data-do="again">Modifier le menu</button><button class="btn sm pri" data-do="end">Revenir aux Tilleuls</button></div>':'')+
   '<div class="pfi-lay"><div class="card" data-wiz><div class="pfi-wh scroll-x">'+WS.map(function(w,i){return (i?ICON('right'):'')+'<span class="pfi-ws '+(i===IM.step?'on':i<IM.step?'ok':'')+'"><span class="pf-step '+(i===IM.step?'on':i<IM.step?'ok':'')+'">'+(i<IM.step?ICON('check'):i+1)+'</span>'+w+'</span>'}).join('')+'</div><div class="pfi-wb" data-wb>'+stepHTML(ctx)+'</div><div class="pfi-wf">'+footHTML()+'</div></div>'+
   '<div class="stack" style="--g:14px"><div class="card pad stack" style="--g:12px"><div class="hrow" style="--g:12px;align-items:flex-start"><div class="pfi-mini" style="width:92px;flex:none"><i style="width:70%"></i><i style="width:90%"></i><i style="width:55%"></i><i style="width:80%"></i></div><div><div class="b">Un tableau papier ?</div><div class="s mut">Prenez-le en photo. L’IA lit l’écriture, vous corrigez ce qui est incertain.</div></div></div><button class="btn block" data-do="photo">'+ICON('camera','sm')+'Lire une photo ou un PDF</button></div>'+
    '<div class="card pad stack" style="--g:12px"><div class="hrow" style="--g:12px"><span class="av lg" style="--c:var(--c6)">ML</span><div><div class="b">Marion vous accompagne</div><div class="s mut">Reprise faite avec vous, incluse dans l’abonnement</div></div></div><div class="hrow" style="--g:8px"><button class="btn sm grow" data-do="help2">'+ICON('calendar_add','sm')+'Réserver un appel</button><button class="btn sm grow" data-chat>'+ICON('chat','sm')+'Lui écrire</button></div></div>'+
    '<div class="card"><div class="ch" style="padding-bottom:4px"><h3>Imports précédents</h3><span class="xs mut">Annulables 30 jours</span></div><div class="list">'+LOTS.map(function(l,i){return '<div class="li" style="align-items:flex-start"><div class="grow"><div class="t" style="font-size:13px">'+l.t+'</div><div class="xs mut" style="margin-top:2px"><span class="pf-mono" style="font-size:11px">'+l.id+'</span> · '+l.n+' · '+l.d+'</div></div><button class="btn sm ghost" data-lot="'+i+'" title="Annuler cet import en bloc">Annuler</button></div>'}).join('')+'</div></div></div></div></div>';
  var wb=$('[data-wb]',el),q=function(s){return el.querySelector(s)};
  function setStep(n){IM.step=n;var v=el.closest('.view'),y=v.scrollTop;X.quiet();v.style.scrollBehavior='auto';v.scrollTop=Math.min(y,260);v.style.scrollBehavior=''}
  on(el,'[data-ob]',function(b){obSheet(+b.getAttribute('data-ob'))});
  q('[data-do="help"]').onclick=helpSheet;q('[data-do="new"]').onclick=function(){newClubSheet()};if(q('[data-do="again"]'))q('[data-do="again"]').onclick=function(){newClubSheet(0)};if(q('[data-do="end"]'))q('[data-do="end"]').onclick=endReplay;q('[data-do="help2"]').onclick=helpSheet;q('[data-do="photo"]').onclick=photoSheet;
  q('[data-chat]').onclick=function(){P.toast('Message envoyé à Marion, elle répond en moyenne en 12 minutes',{icon:'chat'})};
  on(el,'[data-lot]',function(b){var i=+b.getAttribute('data-lot'),l=LOTS[i];LOTS.splice(i,1);P.rerender();P.toast('Import '+l.id+' annulé : '+l.n+' retirées',{undo:function(){LOTS.splice(i,0,l);P.rerender()}})});
  on(el,'[data-prev]',function(){setStep(IM.step-1)});
  on(el,'[data-rej]',function(){P.toast('Fichier des 3 lignes à corriger téléchargé',{icon:'download'})});
  if(IM.step===0){
    on(el,'[data-src]',function(b){IM.src=b.getAttribute('data-src');$$('[data-src]',el).forEach(function(x){x.setAttribute('aria-pressed',x===b)});if(IM.src==='photo')photoSheet()});
    var dr=q('[data-drop]');dr.onclick=function(){setStep(1)};on(el,'[data-ex]',function(b,e){e.stopPropagation();setStep(1)});
    dr.ondragover=function(e){e.preventDefault();dr.classList.add('over')};dr.ondragleave=function(){dr.classList.remove('over')};dr.ondrop=function(e){e.preventDefault();setStep(1)};
    q('[data-tpl]').onclick=function(){P.sheet({title:'Modèles de fichiers Piaffe',icon:'download',body:'<p class="s mut" style="margin-bottom:14px">Des tableaux prêts à remplir, avec un onglet d’exemples. Utiles si votre ancien logiciel n’exporte rien.</p><div class="card list">'+['Adhérents, familles et payeurs','Chevaux et propriétaires','Forfaits, cartes en cours et soldes','Reprises et inscriptions','Factures ouvertes','Salariés','Historique de santé des chevaux'].map(function(t){return '<button class="li click pf-tap" data-dl style="width:100%;text-align:left">'+ICON('grid')+'<div class="grow t">'+t+'</div><span class="xs mut">Excel</span>'+ICON('download','sm')+'</button>'}).join('')+'</div>'});on(sheet(),'[data-dl]',function(b){P.toast('Modèle « '+b.querySelector('.t').textContent+' » téléchargé',{icon:'download'})})};
  }
  if(IM.step===1){var nx=q('[data-next]'),alive=function(){return wb.isConnected},T=P.RM?0:1;
    FILES.forEach(function(f,i){var row=wb.querySelector('[data-f="'+i+'"]'),p=0;setTimeout(function tick(){if(!alive())return;p=Math.min(100,p+(P.RM?100:22+i*6));row.querySelector('.bar i').style.setProperty('--v',p+'%');row.querySelector('[data-fs]').textContent=p<100?p+' %':F.num(f[2])+' lignes';if(p<100)setTimeout(tick,150);else row.querySelector('[data-fok]').innerHTML='<span class="okc">'+ICON('checkc')+'</span>'},T*(200+i*260))});
    MAPS[0].slice(0,5).forEach(function(c,i){setTimeout(function(){if(!alive())return;wb.querySelector('[data-m="'+i+'"]').innerHTML='<span class="chip acc">'+FIELDS[c[2]]+'</span>'},T*(1300+i*330))});
    setTimeout(function(){if(!alive())return;wb.querySelector('.pfi-scan').classList.add('done');wb.querySelector('[data-at]').textContent='29 colonnes reconnues sur 31';wb.querySelector('[data-as]').textContent='dans 3 fichiers, '+F.num(NL)+' lignes';wb.querySelector('[data-an]').innerHTML='<span class="okc b">Analyse terminée.</span> Encodage Windows-1252, séparateur point-virgule, dates au format jour/mois/année.';nx.disabled=false},T*3100);
    nx.onclick=function(){setStep(2)};
  }
  if(IM.step===2){on(el,'[data-file]',function(b){IM.file=+b.getAttribute('data-file');setStep(2)});
    on(el,'[data-mp]',function(b){var c=MAPS[IM.file][+b.getAttribute('data-mp')];c[2]=b.selectedIndex;c[3]=100;c[4]=null;P.toast(c[0]+' sera rangé dans « '+b.value+' »');setStep(2)},'change');
    q('[data-next]').onclick=function(){setStep(3)}}
  if(IM.step===3){on(el,'[data-dv]',function(b){IM.dup[+b.getAttribute('data-dp')]=b.getAttribute('data-dv')});
    /* la valeur du segment est portée par data-dv, on la relit à chaque clic */
    $$('.pfi-dupf .seg',el).forEach(function(sg,i){$$('button',sg).forEach(function(b,k){b.setAttribute('data-dp',i);b.setAttribute('data-dv',['f','c','i'][k]);b.setAttribute('aria-selected',IM.dup[i]===['f','c','i'][k])})});
    q('[data-allf]').onclick=function(){IM.dup[0]='f';IM.dup[1]='f';setStep(3);P.toast('2 doublons certains seront fusionnés')};
    q('[data-next]').onclick=function(){IM.ran=false;setStep(4)}}
  if(IM.step===4&&!IM.ran){var log=q('[data-log]'),L=[['Adhérents et familles','148 / 148'],['Chevaux, complétés par l’IFCE',NH+' / '+NH],['Forfaits et soldes','6 forfaits, 14 cartes'],['Factures','1 240 / 1 240'],['Regroupement des familles','61 familles'],['Contrôle final','aucune erreur']],k=0;
    (function nxt(){if(!log.isConnected)return;if(k<L.length){var d=document.createElement('div');d.innerHTML=L[k][0]+' … <b>'+L[k][1]+'</b>';log.appendChild(d);k++;var p=Math.round(k/L.length*100);q('[data-rb]').style.setProperty('--v',p+'%');q('[data-rp]').textContent=p+' %';setTimeout(nxt,P.RM?0:430)}else setTimeout(function(){if(!log.isConnected)return;IM.ran=true;LOTS.unshift({id:'IMP-1117-01',t:'Adhérents, chevaux et factures depuis Kavalog',n:F.num(NL)+' lignes',d:'aujourd’hui',who:'Claire Morel',left:30});setStep(4)},P.RM?0:500)})()}
  if(IM.step===4&&IM.ran){q('[data-undo]').onclick=function(){IM.step=0;IM.ran=false;var i=LOTS.findIndex(function(l){return l.id==='IMP-1117-01'});if(i>=0)LOTS.splice(i,1);P.rerender();P.toast('Import annulé en bloc : '+F.num(NL)+' lignes retirées',{icon:'refresh'})};
    q('[data-again]').onclick=function(){IM.step=0;IM.ran=false;P.rerender()};q('[data-see]').onclick=function(){go('adherents',{},'Adhérents')}}
  if(ctx.params.do){var d=ctx.params.do;delete ctx.params.do;setTimeout(function(){var b=el.querySelector('[data-do="'+d+'"]');if(b)b.click()},80)}
}
P.mod({id:'import',role:'gerant',group:'Plateforme',title:'Import et arrivée',icon:'import',n:30,phoneTitle:'Import',short:'Import',badge:function(){var n=OB.filter(function(o){return o[3]!==1}).length;return n?{v:n}:null},render:renderImport});
P.pf.IM=IM;P.pf.helpSheet=helpSheet;
})();

/* =====================================================================
   Écran · Réglages et personnalisation
   ===================================================================== */
(function(){
var D=P.D,F=P.fmt,U=P.ui,$=P.$,$$=P.$$,esc=F.esc,X=P.pf,on=X.on,lg=X.lg,sheet=X.sheet;
P.css(`
.pfr-lay{display:grid;grid-template-columns:228px minmax(0,1fr);gap:22px;align-items:start}
.pfr-nav{display:flex;flex-direction:column;gap:2px;position:sticky;top:0}
.pfr-nb{display:flex;align-items:center;gap:10px;height:38px;padding:0 10px;border-radius:var(--r-sm);font-size:13.5px;font-weight:500;color:var(--ink-2);text-align:left;white-space:nowrap;transition:background var(--t-1)}
.pfr-nb:hover{background:var(--bg-2)}
.pfr-nb svg.i{color:var(--mut)}
.pfr-nb[aria-current="true"]{background:var(--surface);box-shadow:inset 0 0 0 1px var(--line),var(--shadow-1);color:var(--ink);font-weight:600}
.pfr-nb[aria-current="true"] svg.i{color:var(--acc)}
.pfr-ng{font-size:10.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--mut-2);padding:12px 10px 4px}
.pfr-ng:first-child{padding-top:0}
.pfr-h{display:flex;align-items:flex-end;justify-content:space-between;gap:12px;flex-wrap:wrap}
.pfr-h h2{font-size:22px;letter-spacing:-.03em}
.pfr-h p{color:var(--mut);font-size:13.5px;margin-top:4px;max-width:66ch}
.pfr-r{display:flex;align-items:center;gap:14px;padding:13px 16px;min-width:0;min-height:60px}
.pfr-r+.pfr-r{border-top:1px solid var(--line)}
.pfr-r .t{font-weight:600;font-size:13.5px}.pfr-r .d{font-size:12.5px;color:var(--mut);margin-top:1px}
.pfr-r .ctl{flex:none;display:flex;align-items:center;gap:8px}
.pfr-r select.in{width:auto;min-width:150px;height:34px;font-size:13px}
.pfr-gh{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);padding:12px 16px 8px;background:var(--surface-2);border-top:1px solid var(--line);display:flex;justify-content:space-between}
.card>.pfr-gh:first-child{border-top:0;border-radius:var(--r-lg) var(--r-lg) 0 0}
.pfr-2{display:grid;grid-template-columns:minmax(0,1fr) 280px;gap:14px;align-items:start}
.pfr-prev{position:sticky;top:0;padding:14px}
.pfr-mn{display:flex;align-items:center;gap:9px;height:30px;padding:0 8px;border-radius:8px;font-size:12.5px;font-weight:500;color:var(--ink-2);animation:fade var(--t-3) var(--e-out) both}
.pfr-mn svg.i{width:15px;height:15px;color:var(--mut)}
.pfr-mn.on{background:var(--acc-pale);font-weight:600;color:var(--ink)}.pfr-mn.on svg.i{color:var(--acc)}
.pfr-mg{font-size:9.5px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--mut-2);padding:10px 8px 3px}
.pfr-mx{width:100%;border-collapse:separate;border-spacing:0;font-size:13px}
.pfr-mx th{font-size:11.5px;font-weight:600;color:var(--ink-2);padding:10px 4px;text-align:center;white-space:nowrap;border-bottom:1px solid var(--line);position:sticky;top:0;background:var(--surface)}
.pfr-mx th small{display:block;font-weight:500;color:var(--mut);font-size:10.5px}
.pfr-mx th:first-child,.pfr-mx td:first-child{text-align:left;padding-left:16px}
.pfr-mx td{padding:5px 4px;border-bottom:1px solid var(--line);text-align:center}
.pfr-mx tr:last-child td{border-bottom:0}
.pfr-mx tr.g td{font-size:11px;font-weight:600;letter-spacing:.06em;text-transform:uppercase;color:var(--mut);background:var(--surface-2);padding:8px 16px}
.pfr-lv{display:inline-flex;align-items:center;justify-content:center;min-width:70px;height:26px;padding:0 8px;border-radius:7px;font-size:11.5px;font-weight:600;color:var(--mut-2);transition:background var(--t-2),color var(--t-2),transform var(--t-1) var(--e-out)}
.pfr-lv:active{transform:scale(.94)}
.pfr-lv:hover{background:var(--bg-2)}
.pfr-lv.l1{background:var(--bg-2);color:var(--ink-2)}.pfr-lv.l2{background:var(--acc-pale);color:var(--acc)}.pfr-lv.l3{box-shadow:inset 0 0 0 1px var(--line-2);color:var(--ink-2)}
.pfr-sw{width:34px;height:34px;border-radius:50%;background:var(--c);display:grid;place-items:center;color:var(--surface);transition:transform var(--t-2) var(--e-spring);box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--ink) 8%,transparent)}
.pfr-sw:hover{transform:scale(1.08)}
.pfr-sw svg.i{opacity:0;width:16px;height:16px;stroke-width:2.6}
.pfr-sw[aria-pressed="true"]{box-shadow:0 0 0 2px var(--surface),0 0 0 4px var(--c)}.pfr-sw[aria-pressed="true"] svg.i{opacity:1}
.pfr-ph{--pc:var(--c1);width:100%;border-radius:26px;background:var(--bg);box-shadow:0 0 0 6px var(--ink),var(--shadow-2);overflow:hidden;display:flex;flex-direction:column}
.pfr-ph .hd{padding:26px 16px 14px;background:var(--pc);color:var(--acc-ink);transition:background var(--t-3) var(--e-out)}
.pfr-ph .hd small{opacity:.85;font-size:11.5px}
.pfr-ph .bd{padding:12px;display:flex;flex-direction:column;gap:8px}
.pfr-ph .cta{height:34px;border-radius:9px;background:var(--pc);color:var(--acc-ink);font-size:12.5px;font-weight:600;display:grid;place-items:center;transition:background var(--t-3) var(--e-out)}
.pfr-ph .tb{display:grid;grid-template-columns:repeat(4,1fr);padding:8px 8px 12px;border-top:1px solid var(--line);background:var(--surface)}
.pfr-ph .tb span{display:grid;place-items:center;color:var(--mut-2)}.pfr-ph .tb span:first-child{color:var(--pc)}
.pfr-logo{width:64px;height:64px;border-radius:16px;background:var(--navy);display:grid;place-items:center;flex:none}
.pfr-ch{display:flex;gap:6px;flex:none}
.pfr-ch .tag{width:64px;height:34px;padding:0;justify-content:center}
.pfr-ch .tag[aria-pressed="true"]{background:var(--acc-pale);color:var(--acc);box-shadow:inset 0 0 0 1px var(--acc-line)}
.pfr-cl{display:none}
.pfr-chh{display:flex;gap:6px;flex:none;font-size:10.5px;font-weight:600;color:var(--mut);text-transform:uppercase;letter-spacing:.04em}
.pfr-chh span{width:64px;text-align:center}
.pfr-plan{padding:16px;border-radius:var(--r-lg);box-shadow:inset 0 0 0 1px var(--line);display:flex;flex-direction:column;gap:10px;text-align:left;transition:box-shadow var(--t-2)}
.pfr-plan[aria-pressed="true"]{box-shadow:inset 0 0 0 2px var(--acc);background:var(--acc-pale)}
.pfr-plan .pr{font:700 26px/1 var(--f-display);letter-spacing:-.03em}
.pfr-plan .pr small{font:500 12.5px var(--f-text);color:var(--mut);letter-spacing:0}
.pfr-stp{display:flex;align-items:center;gap:2px;border-radius:var(--r-sm);box-shadow:inset 0 0 0 1px var(--line-2);padding:2px}
.pfr-stp b{min-width:34px;text-align:center;font-variant-numeric:tabular-nums;font-size:13.5px}
@container main (max-width:1100px){.pfr-lay{grid-template-columns:minmax(0,1fr);gap:14px}.pfr-nav{flex-direction:row;overflow-x:auto;scrollbar-width:none;position:static;padding:2px;margin:-2px}.pfr-ng{display:none}.pfr-nb{flex:none;height:36px}}
@container main (max-width:860px){.pfr-2{grid-template-columns:minmax(0,1fr)}.pfr-prev{display:none}.pfr-prev.keep{display:block;position:static;max-width:300px;margin:0 auto}}
@container main (max-width:760px){
 .pfr-h h2{font-size:19px}.pfr-r{padding:12px 14px}.pfr-r.col{flex-direction:column;align-items:stretch;gap:8px}.pfr-r.col .ctl{justify-content:flex-start}
 .pfr-r.col select.in{width:100%}.pfr-chh{display:none}.pfr-ch{width:100%}.pfr-ch .tag{flex:1;width:auto;height:44px;flex-direction:column;gap:2px;font-size:10.5px}.pfr-ch .pfr-cl{display:block}.pfr-nb{height:40px}
}
`);

/* ---------- Catalogue des écrans par vue (titres de secours si un lot n’est pas chargé) ---------- */
var CAT={gerant:[['cockpit','Aujourd’hui','today','Pilotage','Le résumé du matin et les actions prêtes',1],['rapports','Rapports','report','Pilotage','Chiffre d’affaires, remplissage, tendances'],
  ['chevaux','Chevaux','horse','Écurie','Fiches, propriétaires, charge de travail'],['ecurie3d','Écurie 3D','cube','Écurie','Le plan des boxes en direct'],['cameras','Caméras','camera','Écurie','Direct des boxes et alertes'],['soins','Soins','care','Écurie','Vaccins, maréchal, registre d’élevage'],['elevage','Élevage','heart','Écurie','Suivi des juments, saillies, poulinage. Ajoute l’onglet Reproduction aux fiches des juments.',0,1],['alimentation','Alimentation','feed','Écurie','Rations et stocks'],['entretien','Entretien','upkeep','Écurie','Tâches, matériel, installations'],
  ['planning','Planning','planning','Club','Reprises, stages, montoir'],['adherents','Adhérents','members','Club','Familles, forfaits, licences'],['pensions','Pensions','owner','Club','Pensions et demi-pensions'],['coachs','Coachs','coach','Club','Coachs extérieurs réservables'],['competitions','Concours','compet','Club','Engagements, transport, résultats'],['boutique','Boutique','shop','Club','Vente en ligne et caisse'],['communication','Communication','chat','Club','Messages, e-mails, SMS'],
  ['facturation','Facturation','invoice','Argent','Factures, paiements, relances'],['compta','Comptabilité','accounting','Argent','Banque, rapprochement, exports'],['contrats','Contrats','contract','Argent','Signature électronique'],
  ['equipe','Équipe','team','Équipe','Plannings, pointages, congés'],
  ['assistant','Assistant','assistant','Plateforme','L’IA qui lit et prépare pour vous'],['connecteurs','Connecteurs','plug','Plateforme','MCP, API et outils reliés'],['import','Import et arrivée','import','Plateforme','Reprise des données'],['reglages','Réglages','settings','Plateforme','Cet écran',1]],
 employe:[['emp-jour','Ma journée','today','Ma journée','Ce que je dois faire maintenant',1],['emp-tournee','Tournée','route','Ma journée','La tournée des boxes, dans l’ordre'],['emp-planning','Planning','planning','Ma journée','Mes reprises et mes horaires'],['emp-chevaux','Chevaux','horse','Écurie','Les fiches, en lecture rapide'],['emp-soins','Soins','care','Écurie','Soins à faire et à noter'],['emp-signaler','Signaler','alert','Écurie','Un problème, avec photo'],['emp-pointage','Pointage','clockin','Moi','Arrivée, départ, pauses'],['emp-messages','Messages','chat','Moi','L’équipe et les familles'],['emp-conges','Congés','holiday','Moi','Demandes et soldes']],
 adherent:[['adh-accueil','Accueil','today','Moi','Mes prochaines reprises',1],['adh-reserver','Réserver','planning','Équitation','Reprises, stages, rattrapages'],['adh-coachs','Coachs','coach','Équitation','Réserver un coach'],['adh-concours','Concours','compet','Équitation','Engagements et covoiturage'],['adh-progression','Progression','trend','Équitation','Galops et objectifs'],['adh-cheval','Mon cheval','horse','Cheval','Soins, journal, caméra'],['adh-demipension','Demi-pension','owner','Cheval','Offres et planning partagé'],['adh-paiements','Paiements','card','Compte','Factures et moyens de paiement'],['adh-contrats','Contrats','contract','Compte','Documents à signer'],['adh-messages','Messages','chat','Compte','Le club et mon moniteur'],['adh-profil','Profil','user','Compte','Mes informations']],
 coach:[['coach-agenda','Agenda','planning','Coaching','Mes cours et réservations',1],['coach-eleves','Élèves','members','Coaching','Suivi et notes de séance'],['coach-dispo','Disponibilités','clock','Coaching','Mes créneaux réservables'],['coach-concours','Concours','compet','Coaching','Mes élèves engagés'],['coach-revenus','Revenus','euro','Compte','Encaissements et factures'],['coach-profil','Profil','user','Compte','Ma page publique']]};
var RL={gerant:'Gérant',employe:'Employé',adherent:'Adhérent',coach:'Coach'};
function cat(role){return CAT[role].map(function(c){var m=c[6]?null:P.mods[c[0]];return {id:c[0],title:m?m.title:c[1],icon:m?m.icon:c[2],group:c[3],d:c[4],lock:!!c[5],sub:!!c[6]}})}
function isOn(m,off){return off.indexOf(m.id)<0&&(m.id!=='elevage'||P.prefs.get('elevage',true)!==false)}
var PRESETS=[['Centre équestre complet',[]],['Écurie de propriétaires',['planning','coachs','competitions','boutique','adherents']],['Poney-club',['pensions','ecurie3d','coachs','compta']]];

/* ---------- Rôles et droits ---------- */
var ROLES=[['Gérant','1'],['Moniteur','3'],['Soigneur','2'],['Accueil','1'],['Comptable','1'],['Coach ext.','4'],['Propriétaire','12'],['Adhérent','136']];
var RIGHTS=D.pfRights=D.pfRights||[
 ['Chevaux','Fiches des chevaux',[2,1,2,1,0,3,3,0]],['Chevaux','Santé et registre d’élevage',[2,1,2,0,0,0,3,0]],['Chevaux','Rations et stocks',[2,0,2,0,0,0,1,0]],['Chevaux','Caméras des boxes',[2,0,1,0,0,0,3,0]],
 ['Club','Planning et reprises',[2,2,1,2,0,3,1,1]],['Club','Adhérents et familles',[2,1,0,2,0,3,0,3]],['Club','Concours et engagements',[2,2,0,1,0,3,3,3]],['Club','Messages aux familles',[2,2,0,2,0,3,0,0]],
 ['Argent','Factures et paiements',[2,0,0,2,1,3,3,3]],['Argent','Comptabilité et banque',[2,0,0,0,2,0,0,0]],['Argent','Contrats et signatures',[2,0,0,1,1,3,3,3]],
 ['Équipe','Plannings et pointages',[2,3,3,3,0,0,0,0]],['Équipe','Salaires et contrats de travail',[2,0,0,0,1,0,0,0]],
 ['Plateforme','Assistant IA et connecteurs',[2,1,1,1,0,0,0,0]],['Plateforme','Réglages du club',[2,0,0,0,0,0,0,0]]];
var LV=['Aucun','Voir','Modifier','Les siens'];
var TARIFS=D.pfTarifs=D.pfTarifs||D.forfaits.filter(function(f){return f.price}).map(function(f){return {n:f.name,k:{annuel:'Forfait',carte:'Carte',trimestre:'Forfait',demi:'Pension'}[f.kind],p:f.price,u:f.kind==='demi'?'par mois':f.kind==='trimestre'?'par trimestre':f.kind==='carte'?'la carte':'par an',tva:f.kind==='demi'?20:5.5,web:true}}).concat([
 {n:'Pension complète en box',k:'Pension',p:520,u:'par mois',tva:20,web:false},{n:'Pension au pré',k:'Pension',p:310,u:'par mois',tva:20,web:false},{n:'Cours particulier',k:'Séance',p:38,u:'l’heure',tva:5.5,web:true},{n:'Stage à la journée',k:'Stage',p:65,u:'par jour',tva:5.5,web:true},{n:'Coaching en concours',k:'Concours',p:25,u:'par épreuve',tva:20,web:false},{n:'Transport en concours',k:'Concours',p:35,u:'par cheval',tva:20,web:false},{n:'Licence FFE pratiquant',k:'Licence',p:40,u:'par an',tva:0,web:true}]);
var NOTIFS=[['Rappel de reprise','La veille à 18 h',[1,0,0,0]],['Reprise annulée ou déplacée','Tout de suite',[1,1,1,1]],['Place libérée en liste d’attente','Tout de suite, tenue 2 h',[1,0,1,0]],['Facture disponible','À l’émission',[1,1,0,0]],['Paiement échoué ou prélèvement rejeté','Tout de suite',[1,1,1,0]],['Relance d’impayé','À 7, 15 et 30 jours',[0,1,1,0]],['Contrat à signer','À l’envoi, puis rappel à 3 jours',[1,1,0,0]],['Soin prévu pour mon cheval','La veille, pour les propriétaires',[1,1,0,1]],['Alerte santé ou capteur','Tout de suite, pour l’équipe',[1,0,1,0]],['Stock sous le seuil','Le matin, pour la gérante',[1,1,0,0]],['Résultats de concours','Le soir même',[1,0,0,1]]];
var RG={sec:'modules',role:'gerant',pr:1,tint:P.prefs.get('club:tint','var(--c1)')};
var SECS=[['Pour moi',[['prefs','Mes préférences','sliders'],['etab','Établissement et rôle','swap']]],['Personnaliser',[['modules','Modules et vues','grid'],['roles','Rôles et permissions','shield'],['club','Identité du club','palette']]],['Fonctionnement',[['tarifs','Tarifs et forfaits','tag'],['inst','Pistes et installations','arena'],['resa','Réservation et annulation','calendar_add'],['notifs','Notifications','bell']]],['Compte',[['secu','Sécurité et RGPD','lock'],['abo','Abonnement Piaffe','card'],['aide','Aide et tutoriels','info']]]];
function head(t,p,act,perso){return '<div class="pfr-h"><div><div class="hrow" style="--g:8px;margin-bottom:6px"><span class="chip '+(perso?'':'acc')+'">'+ICON(perso?'user':'stable','sm')+(perso?'Préférence personnelle':'Réglage de l’établissement')+'</span></div><h2>'+t+'</h2><p>'+p+'</p></div>'+(act?'<div class="hrow wrap" style="--g:8px">'+act+'</div>':'')+'</div>'}
function row(t,d,ctl,cls){return '<div class="pfr-r'+(cls?' '+cls:'')+'"><div class="grow"><div class="t">'+t+'</div>'+(d?'<div class="d">'+d+'</div>':'')+'</div><div class="ctl">'+ctl+'</div></div>'}
function sel(opts,cur,attr){return '<select class="in" '+(attr||'')+'>'+opts.map(function(o){return '<option'+(o===cur?' selected':'')+'>'+o+'</option>'}).join('')+'</select>'}
function stp(v,attr){return '<div class="pfr-stp" '+(attr||'')+'><button class="btn sm icon ghost" data-s="-1" title="Moins">'+ICON('minus','sm')+'</button><b>'+v+'</b><button class="btn sm icon ghost" data-s="1" title="Plus">'+ICON('plus','sm')+'</button></div>'}

function secModules(){
  var role=RG.role,off=P.prefs.off(role),L=cat(role),act=L.filter(function(m){return isOn(m,off)&&!m.sub}),g=null,h='',pv='',pg=null;
  L.forEach(function(m){if(m.group!==g){g=m.group;h+='<div class="pfr-gh"><span>'+g+'</span></div>'}var o=isOn(m,off);
    h+='<div class="pfr-r" style="min-height:56px"><span class="av sq" style="--c:'+(o?'var(--acc-pale)':'var(--bg-2)')+';color:var(--'+(o?'acc':'mut-2')+')">'+ICON(m.icon)+'</span><div class="grow"'+(o?'':' style="opacity:.6"')+'><div class="t">'+m.title+'</div><div class="d">'+m.d+'</div></div><div class="ctl">'+(m.lock?'<span class="chip">'+ICON('lock','sm')+'Toujours actif</span>':'<button class="tog" role="switch" aria-checked="'+o+'" data-manual data-mod="'+m.id+'" title="Activer ou masquer '+m.title+'"></button>')+'</div></div>'});
  act.forEach(function(m,i){if(m.group!==pg){pg=m.group;pv+='<div class="pfr-mg">'+pg+'</div>'}pv+='<div class="pfr-mn'+(i===0?' on':'')+'">'+ICON(m.icon)+m.title+'</div>'});
  return head('Modules et vues','Choisissez ce que chacun voit. Un module masqué disparaît du menu, de la recherche et de l’application : aucune entrée grisée.','<button class="btn sm" data-reset>'+ICON('refresh','sm')+'Rétablir les modules par défaut</button>')+
   '<div class="hrow sp wrap">'+U.seg(Object.keys(RL).map(function(r){var n=CAT[r].filter(function(c){return !c[6]}).length-P.prefs.off(r).filter(function(i){return CAT[r].some(function(c){return c[0]===i&&!c[6]})}).length;return [r,RL[r]+' <span class="mut" style="font-weight:500">'+n+'</span>']}),role,'data-vr')+(role==='gerant'?'<div class="hrow wrap" style="--g:6px"><span class="xs mut">Partir d’un modèle</span>'+PRESETS.map(function(p,i){return '<button class="tag" data-manual data-preset="'+i+'">'+p[0]+'</button>'}).join('')+'</div>':'')+'</div>'+
   '<div class="pfr-2"><div class="card" style="overflow:hidden">'+h+'</div><div class="card pfr-prev"><div class="eyebrow" style="margin-bottom:4px">Menu de la vue '+RL[role].toLowerCase()+'</div><div class="xs mut" style="margin-bottom:6px">'+act.length+' écrans actifs sur '+L.filter(function(m){return !m.sub}).length+'</div>'+pv+'</div></div>'}

function secRoles(ctx){
  var h=head('Rôles et permissions','Chaque rôle voit et modifie seulement ce qui le concerne. « Les siens » limite l’accès à ses chevaux, ses élèves ou ses factures.','<button class="btn sm" data-newrole>'+ICON('plus','sm')+'Créer un rôle</button><button class="btn sm pri" data-invite>'+ICON('mail','sm')+'Inviter une personne</button>');
  if(ctx.mobile){h+='<div class="scroll-x">'+U.seg(ROLES.map(function(r,i){return [String(i),r[0]]}),String(RG.pr),'data-pr')+'</div><div class="card" style="overflow:hidden">';var g=null;
    RIGHTS.forEach(function(r,i){if(r[0]!==g){g=r[0];h+='<div class="pfr-gh"><span>'+g+'</span></div>'}h+='<div class="pfr-r col"><div class="t">'+r[1]+'</div><div class="ctl"><div class="seg" style="width:100%">'+LV.map(function(l,k){return '<button role="tab" style="flex:1;justify-content:center;padding:0 6px;font-size:12px;height:34px" aria-selected="'+(r[2][RG.pr]===k)+'" data-rv="'+i+':'+RG.pr+':'+k+'">'+l+'</button>'}).join('')+'</div></div></div>'});
    h+='</div>'}
  else{h+='<div class="card" style="overflow:hidden"><div class="tw" style="border-radius:0"><table class="pfr-mx"><thead><tr><th>Droit</th>'+ROLES.map(function(r){return '<th>'+r[0]+'<small>'+r[1]+(r[1]==='1'?' personne':' personnes')+'</small></th>'}).join('')+'</tr></thead><tbody>';var g2=null;
    RIGHTS.forEach(function(r,i){if(r[0]!==g2){g2=r[0];h+='<tr class="g"><td colspan="'+(ROLES.length+1)+'">'+g2+'</td></tr>'}h+='<tr><td class="b" style="font-size:13px">'+r[1]+'</td>'+r[2].map(function(v,j){return '<td><button class="pfr-lv l'+v+'" data-lv="'+i+':'+j+'" title="'+ROLES[j][0]+' · '+r[1]+' : cliquez pour changer">'+(v?LV[v]:'·')+'</button></td>'}).join('')+'</tr>'});
    h+='</tbody></table></div><div class="cf xs mut">'+ICON('info','sm')+'Cliquez sur une case pour faire défiler : aucun accès, voir, modifier, les siens. Le rôle Gérant garde tous les droits.</div></div>'}
  h+='<div class="card"><div class="ch" style="padding-bottom:6px"><h3>Équipe et accès</h3><span class="xs mut">'+(D.staff.length-1)+' salariés et la gérante · 2 invitations en attente</span></div>'+D.staff.map(function(s,i){return '<div class="pfr-r" style="min-height:52px">'+U.av(s.id)+'<div class="grow"><div class="t">'+s.first+' '+s.last+'</div><div class="d">'+s.role+'</div></div><div class="ctl">'+(i>6?'<span class="chip warn dot hide-s">Invitation envoyée</span>':'')+sel(['Gérant','Moniteur','Soigneur','Accueil'],i===0?'Gérant':/Monit|Apprenti/.test(s.role)?'Moniteur':/Secr/.test(s.role)?'Accueil':'Soigneur','data-srole="'+i+'"'+(i===0?' disabled':''))+'</div></div>'}).join('')+'</div>';
  return h}

function secClub(){
  var T=[['var(--c1)','Saphir'],['var(--c3)','Lagon'],['var(--c7)','Prairie'],['var(--c4)','Paille'],['var(--c6)','Bruyère'],['var(--c5)','Iris']];
  return head('Identité du club','Ces informations figurent sur vos factures, vos contrats et l’application de vos adhérents.','<button class="btn sm pri" data-save>Enregistrer</button>')+
   '<div class="pfr-2"><div class="stack" style="--g:14px"><div class="card pad stack" style="--g:14px"><div class="hrow" style="--g:14px"><span class="pfr-logo">'+LOGO(34,'var(--navy-ink)','var(--strass)')+'</span><div class="grow"><div class="b">Logo du club</div><div class="s mut">Carré, 512 px au moins. Il apparaît sur le portail et les documents.</div></div><button class="btn sm" data-logo>'+ICON('upload','sm')+'Changer</button></div>'+
     '<div class="g2" style="--g:12px"><label class="field"><span>Nom du club</span><input class="in" value="'+esc(D.club.name)+'"></label><label class="field"><span>Nom court</span><input class="in" value="'+esc(D.club.short)+'"></label><label class="field span2"><span>Adresse</span><input class="in" value="'+esc(D.club.address)+'"></label><label class="field"><span>SIRET</span><input class="in num" value="'+D.club.siret+'"></label><label class="field"><span>Affiliation FFE</span><input class="in" value="'+esc(D.club.ffe)+'"></label><label class="field"><span>Téléphone</span><input class="in num" value="'+D.club.phone+'"></label><label class="field"><span>E-mail de contact</span><input class="in" value="'+D.club.email+'"></label></div></div>'+
    '<div class="card pad stack" style="--g:14px"><div><div class="b">Couleur du portail adhérent</div><div class="s mut">Six teintes vérifiées pour rester lisibles, en clair comme en sombre.</div></div><div class="hrow wrap" style="--g:12px">'+T.map(function(t){return '<button class="pfr-sw" style="--c:'+t[0]+'" data-tint="'+t[0]+'" aria-pressed="'+(RG.tint===t[0])+'" title="'+t[1]+'">'+ICON('check')+'</button>'}).join('')+'</div>'+
     '<label class="field"><span>Message d’accueil du portail</span><input class="in" data-wel value="Bienvenue aux Tilleuls"></label>'+
     '<div class="card flat">'+row('Inscription en ligne ouverte','Les nouvelles familles s’inscrivent et paient depuis votre site',U.tog(true))+row('Adresse de votre portail','<span class="pf-mono">tilleuls.piaffe.fr</span>','<button class="btn sm" data-cpp>'+ICON('copy','sm')+'Copier</button>')+'</div></div></div>'+
    '<div class="card pfr-prev keep"><div class="eyebrow" style="margin-bottom:10px">Aperçu chez l’adhérent</div><div class="pfr-ph" data-ph style="--pc:'+RG.tint+'"><div class="hd"><div class="hrow" style="--g:8px">'+LOGO(18,'currentColor','currentColor')+'<small>'+D.club.name+'</small></div><div class="disp" style="font-size:19px;font-weight:700;margin-top:10px" data-welp>Bienvenue aux Tilleuls</div><small>Bonjour Léa, reprise ce soir à 18 h</small></div><div class="bd"><div class="card" style="padding:10px 12px"><div class="xs mut">Prochaine reprise</div><div class="b s">Galop 6-7 CSO · Thomas</div></div><div class="cta">Réserver une séance</div></div><div class="tb"><span>'+ICON('today')+'</span><span>'+ICON('planning')+'</span><span>'+ICON('horse')+'</span><span>'+ICON('card')+'</span></div></div></div></div>'}

function secTarifs(){
  return head('Tarifs et forfaits','Votre grille sert à la vente en ligne, aux factures et aux contrats. Une même facture peut porter plusieurs taux de TVA.','<button class="btn sm pri" data-newt>'+ICON('plus','sm')+'Ajouter un tarif</button>')+
   '<div class="card" style="overflow:hidden">'+['Forfait','Carte','Séance','Stage','Pension','Concours','Licence'].map(function(k){var l=TARIFS.filter(function(t){return t.k===k});if(!l.length)return '';return '<div class="pfr-gh"><span>'+k+(k==='Licence'||k==='Concours'?'':'s')+'</span><span class="hide-s" style="text-transform:none;letter-spacing:0;font-weight:500">Vendu en ligne</span></div>'+l.map(function(t){var i=TARIFS.indexOf(t);return '<div class="pfr-r" data-tar="'+i+'" style="cursor:pointer"><div class="grow"><div class="t">'+t.n+'</div><div class="d">TVA '+(t.tva?String(t.tva).replace('.',',')+' %':'non applicable')+' · '+t.u+'</div></div><div class="ctl"><b class="num" style="font-size:15px">'+F.eur(t.p)+'</b><button class="tog" role="switch" aria-checked="'+t.web+'" data-manual data-web="'+i+'" title="Vendre en ligne"></button></div></div>'}).join('')}).join('')+'</div>'+
   ageGrid()+'<div class="note">'+ICON('percent','sm')+'<span>TVA à 5,5 % sur l’enseignement, la pratique et l’accès aux installations. La pension reste à 20 %. Piaffe ventile chaque ligne au bon taux.</span></div>'}

function secInst(){
  return head('Pistes et installations','Ce qui peut être réservé, par qui, et ce qui se ferme tout seul quand la météo l’impose.','<button class="btn sm pri" data-newi>'+ICON('plus','sm')+'Ajouter une installation</button>')+
   '<div class="g2">'+D.club.arenas.map(function(a,i){var out=/Sable/.test(a.kind);return '<div class="card"><div class="ch" style="padding-bottom:10px"><div class="hrow" style="--g:10px"><span class="av sq" style="--c:var(--acc-pale);color:var(--acc)">'+ICON('arena')+'</span><div><h3>'+a.name+'</h3><div class="xs mut">'+a.kind+' · '+a.size+'</div></div></div><button class="btn sm ghost icon" data-edi="'+i+'" title="Modifier '+a.name+'">'+ICON('edit','sm')+'</button></div><div style="border-top:1px solid var(--line)">'+
     row('Chevaux en même temps','Au-delà, la réservation est refusée',stp([8,10,6,1][i]))+row('Réservable par les propriétaires','Créneaux d’une heure, hors reprises',U.tog(i!==0))+row(out?'Fermeture automatique':'Éclairage piloté',out?'Gel ou plus de 8 mm de pluie':'Allumé 10 min avant chaque reprise',U.tog(true))+'</div></div>'}).join('')+'</div>'+
   '<div class="g2"><div class="card"><div class="ch"><h3>Boxes</h3><span class="chip">B01 à B46</span></div><div style="border-top:1px solid var(--line);margin-top:12px">'+row('Nombre de boxes','Votre formule en inclut 60',stp(D.club.boxes))+row('Boxes d’isolement','Pour les arrivées et les soins',stp(2))+'</div></div>'+
   '<div class="card"><div class="ch"><h3>Paddocks et prairies</h3><button class="btn sm" data-newp>'+ICON('plus','sm')+'Ajouter</button></div><div class="cb hrow wrap" style="--g:6px" data-pads>'+D.club.paddocks.map(function(p){return '<span class="chip lg">'+ICON('paddock','sm')+p+'</span>'}).join('')+'</div></div></div>'}

function secResa(){
  return head('Réservation et annulation','Des règles claires, appliquées toutes seules. L’adhérent les voit avant de réserver.','<button class="btn sm pri" data-save>Enregistrer</button>')+
   '<div class="pfr-2"><div class="stack" style="--g:14px"><div class="card" style="overflow:hidden"><div class="pfr-gh"><span>Réserver</span></div>'+row('Ouverture des réservations','Avant la date de la reprise',sel(['7 jours avant','14 jours avant','30 jours avant'],'14 jours avant','data-rule="open"'),'col')+row('Clôture des réservations','Pour préparer le montoir',sel(['1 h avant','2 h avant','La veille à 20 h'],'2 h avant'),'col')+row('Liste d’attente automatique','La place libérée est proposée au suivant et tenue 2 h',U.tog(true))+
     '<div class="pfr-gh"><span>Annuler</span></div>'+row('Annulation sans frais','La séance est recréditée',sel(['Jusqu’à 12 h avant','Jusqu’à 24 h avant','Jusqu’à 48 h avant'],'Jusqu’à 24 h avant','data-rule="free"'),'col')+row('Annulation tardive ou absence','Ce qui se passe passé le délai',sel(['La séance est décomptée','La séance est décomptée, sauf certificat médical','Un rattrapage est proposé'],'La séance est décomptée, sauf certificat médical','data-rule="late"'),'col')+
     '<div class="pfr-gh"><span>Rattraper</span></div>'+row('Validité d’un rattrapage','À compter de l’absence',sel(['15 jours','30 jours','Jusqu’à la fin du trimestre'],'30 jours','data-rule="catch"'),'col')+row('Rattrapages par trimestre','Par cavalier',stp(3))+row('Niveau exigé','Un cavalier ne peut rattraper que dans une reprise de son galop',U.tog(true))+
     '<div class="pfr-gh"><span>Installations et coachs</span></div>'+row('Créneaux propriétaires','Carrières et manège hors reprises',sel(['30 min','1 h','1 h 30'],'1 h'),'col')+row('Annulation d’un cours de coach','Remboursement automatique',sel(['Jusqu’à 12 h avant','Jusqu’à 24 h avant'],'Jusqu’à 24 h avant'),'col')+'</div></div>'+
    '<div class="card pfr-prev keep"><div class="eyebrow" style="margin-bottom:10px">Ce que lit l’adhérent</div><div class="pfa-quote" data-rtxt></div><div class="xs mut" style="margin-top:10px">Ce texte s’affiche avant chaque réservation et dans le règlement intérieur à signer.</div></div></div>'}

function secNotifs(){
  var CH=[['bell','Notification'],['mail','E-mail'],['sms','SMS'],['chat','WhatsApp']];
  return head('Notifications','Qui est prévenu, de quoi, et par quel canal. Chacun peut ensuite affiner pour lui-même.','<button class="btn sm" data-testn>'+ICON('send','sm')+'M’envoyer un test</button>')+
   '<div class="card" style="overflow:hidden"><div class="pfr-r" style="min-height:0;padding-top:10px;padding-bottom:10px;background:var(--surface-2)"><div class="grow eyebrow">Événement</div><div class="pfr-chh">'+CH.map(function(c){return '<span title="'+c[1]+'">'+(c[1]==='Notification'?'Appli':c[1])+'</span>'}).join('')+'</div></div>'+
   NOTIFS.map(function(n,i){return '<div class="pfr-r col"><div class="grow"><div class="t">'+n[0]+'</div><div class="d">'+n[1]+'</div></div><div class="pfr-ch">'+CH.map(function(c,k){return '<button class="tag" aria-pressed="'+!!n[2][k]+'" data-nt="'+i+':'+k+'" title="'+c[1]+'">'+ICON(c[0],'sm')+'<span class="pfr-cl">'+(c[1]==='Notification'?'Appli':c[1])+'</span></button>'}).join('')+'</div></div>'}).join('')+'</div>'+
   '<div class="g2"><div class="card">'+row('Heures calmes','Rien n’est envoyé entre 21 h et 7 h, sauf urgence santé',U.tog(true))+row('Nom d’expéditeur des SMS','11 caractères au plus','<input class="in pf-mono" value="TILLEULS" style="width:120px;height:34px" aria-label="Expéditeur des SMS">')+'</div>'+
   '<div class="card pad stack" style="--g:10px"><div class="hrow sp"><b class="s">SMS de novembre</b><b class="num s">412 / 1 000</b></div>'+U.bar(41.2)+'<div class="xs mut">Inclus dans votre formule. Les notifications et les e-mails sont illimités.</div></div></div>'}

function secSecu(){
  var LOGS=[['s01','MacBook, Safari','Saint-Arnoult-en-Yvelines','Maintenant','ok'],['s09','PC de l’accueil, Edge','Saint-Arnoult-en-Yvelines','Aujourd’hui, 8 h 02','ok'],['s05','iPhone, application Piaffe','Saint-Arnoult-en-Yvelines','Aujourd’hui, 6 h 48','ok'],['s04','Android, application Piaffe','Rambouillet','Hier, 21 h 15','ok'],['s01','Navigateur inconnu','Lyon','Hier, 3 h 12','bad']];
  var REG=[['Gestion des adhérents et des familles','Contrat','3 ans après le départ'],['Facturation et paiements','Obligation légale','10 ans'],['Registre d’élevage et soins','Obligation légale','5 ans'],['Images des caméras','Intérêt légitime','30 jours'],['Planning et pointages de l’équipe','Contrat de travail','5 ans après le départ'],['Messages et notifications','Contrat, consentement pour la prospection','3 ans']];
  return head('Sécurité et RGPD','Vous êtes responsable des données de vos adhérents, Piaffe est votre sous-traitant. Tout est hébergé en France.')+
   '<div class="g2"><div class="card"><div class="ch" style="padding-bottom:10px"><h3>Double authentification</h3><span class="chip ok dot">7 comptes sur 9</span></div><div style="border-top:1px solid var(--line)">'+row('Obligatoire pour la gérance et l’accueil','Un code à chaque nouvel appareil',U.tog(true))+row('Méthode','Application d’authentification ou SMS',sel(['Application ou SMS','Application seulement'],'Application ou SMS'),'col')+row('2 comptes ne l’ont pas activée','Kévin Bernard, Jade Fontaine','<button class="btn sm" data-remind>Relancer</button>')+'</div></div>'+
   '<div class="card"><div class="ch" style="padding-bottom:10px"><h3>Protection des comptes</h3>'+ICON('shield')+'</div><div style="border-top:1px solid var(--line)">'+row('Déconnexion automatique','Sur un ordinateur partagé',sel(['Après 15 min','Après 1 h','Jamais'],'Après 1 h'),'col')+row('Alerte de connexion inhabituelle','Nouvel appareil ou nouvelle ville',U.tog(true))+row('Caméras : journal de chaque visionnage','Exigé pour filmer là où travaille un salarié','<span class="chip ok">'+ICON('lock','sm')+'Toujours</span>')+'</div></div></div>'+
   '<div class="card"><div class="ch" style="padding-bottom:6px"><h3>Journal de connexion</h3><button class="btn sm ghost" data-explog>'+ICON('download','sm')+'Exporter</button></div>'+LOGS.map(function(l,i){var p=D.person(l[0]);return '<div class="pfr-r" style="min-height:54px">'+U.av(l[0])+'<div class="grow"><div class="t">'+p.first+' '+p.last+' <span class="mut" style="font-weight:500">· '+l[1]+'</span></div><div class="d">'+l[2]+' · '+l[3]+'</div></div><div class="ctl">'+(l[4]==='bad'?'<span class="chip bad dot">Refusée</span><button class="btn sm" data-block>Changer le mot de passe</button>':i===0?'<span class="chip ok dot">Cet appareil</span>':'<button class="btn sm ghost" data-out="'+p.first+'">Déconnecter</button>')+'</div></div>'}).join('')+'</div>'+
   '<div class="g3"><div class="card span2"><div class="ch" style="padding-bottom:6px"><div><h3>Registre des traitements</h3><div class="xs mut" style="margin-top:2px">Pré-rempli par Piaffe, à votre nom</div></div><button class="btn sm" data-reg>'+ICON('download','sm')+'Télécharger le registre</button></div>'+REG.map(function(r){return '<div class="pfr-r" style="min-height:48px;padding-top:9px;padding-bottom:9px"><div class="grow"><div class="t">'+r[0]+'</div><div class="d">Base légale : '+r[1].toLowerCase()+'</div></div><div class="ctl"><span class="chip">'+ICON('hourglass','sm')+r[2]+'</span></div></div>'}).join('')+'</div>'+
   '<div class="stack" style="--g:14px"><div class="card pad stack" style="--g:10px"><div class="b">Exporter les données d’une personne</div><div class="s mut">Droit d’accès et de portabilité : fiche, factures, réservations, messages.</div><div class="search"><span>'+ICON('search','sm')+'</span><input class="in" data-pq value="Léa Martin" aria-label="Personne concernée"></div><button class="btn block" data-pexp>'+ICON('download','sm')+'Préparer l’export</button></div>'+
    '<div class="card pad stack" style="--g:10px"><div class="hrow sp"><span class="b">Demandes de suppression</span><span class="chip warn">1</span></div><div class="s mut">Famille Perrin, partie en juin. Les factures sont conservées 10 ans : la fiche est rendue anonyme.</div><button class="btn block danger" data-anon>Rendre la fiche anonyme</button></div></div></div>'+
   '<div class="note">'+ICON('heart','sm')+'<span><b>Certificats médicaux :</b> Piaffe ne les stocke pas. Seules la date de présentation et la date de validité sont gardées. Aucune donnée de santé humaine ne part vers l’IA ni vers le serveur MCP.</span></div>'}

function secAbo(){
  var US=[['Boxes',D.club.boxes,60,''],['Comptes de l’équipe',D.staff.length,0,''],['SMS ce mois-ci',412,1000,''],['Caméras reliées',8,8,'warn']],INV=[['1er nov.','PIA-2026-11-0412'],['1er oct.','PIA-2026-10-0398'],['1er sept.','PIA-2026-09-0371']];
  return head('Abonnement Piaffe','Votre formule, ce que vous consommez et vos factures.','<button class="btn sm" data-expall>'+ICON('download','sm')+'Exporter toutes mes données</button><button class="btn sm" data-plan>Changer de formule</button>')+
   '<div class="g3"><div class="card navy span2" style="padding:22px;overflow:hidden"><div class="hrow sp wrap"><div><div class="hrow" style="--g:8px"><span class="strass" style="background:var(--strass)"></span><span class="eyebrow" style="color:color-mix(in srgb,var(--navy-ink) 72%,transparent)">Votre formule</span></div><div class="disp" style="font-size:26px;font-weight:700;margin-top:8px">Piaffe Écurie</div><div class="mut s" style="margin-top:4px">Tous les modules, les quatre vues, l’assistant et le serveur MCP. Sans engagement.</div></div><div><div class="disp num" style="font-size:34px;font-weight:700;letter-spacing:-.04em">149 €</div><div class="mut xs">hors taxes par mois</div></div></div>'+
     '<div class="hrow wrap" style="--g:18px;margin-top:18px;font-size:13px"><span>Prochaine facture le 1er décembre : <b>178,80 € TTC</b></span><span class="mut">Prélèvement SEPA sur le compte Qonto ···· 4821</span></div></div>'+
    '<div class="card pad stack" style="--g:10px"><div class="b">Moyen de paiement</div><div class="hrow" style="--g:10px">'+lg(ICON('bank'),'var(--c2)')+'<div><div class="s b">Prélèvement SEPA</div><div class="xs mut">FR76 ···· ···· 4821 · mandat signé le 2 sept.</div></div></div><button class="btn block sm" data-pm>Modifier</button><div class="xs mut">Commission Piaffe sur vos encaissements : 0 %.</div></div></div>'+
   '<div class="card"><div class="ch"><h3>Nos engagements</h3><span class="chip ok dot">Écrits dans le contrat</span></div><div class="cb pfp-tr">'+[['Sans engagement','Résiliable en un clic, à tout moment, sans frais.'],['Essai de 30 jours sans carte bancaire','Toutes les fonctions, avec vos vraies données.'],['Chevaux et utilisateurs illimités','Dans toutes les formules. Seul le nombre de boxes change le prix.'],['Offre solidaire','Gratuite pour les associations d’équithérapie et de sport adapté.'],['Sauvegarde chaque nuit, en France','Gardée 30 jours. Dernière sauvegarde cette nuit à 3 h 02.'],['Vos données vous appartiennent','Export complet à tout moment, lisible sans Piaffe.']].map(function(x){return '<div>'+ICON('checkc','sm')+'<p><b>'+x[0]+'</b><span>'+x[1]+'</span></p></div>'}).join('')+'</div><div class="cf"><button class="btn pri" data-expall2>'+ICON('download','sm')+'Exporter toutes mes données</button><span class="xs mut">Excel ou CSV, export comptable et documents</span></div></div>'+
   '<div class="g2"><div class="card"><div class="ch"><h3>Ce que vous utilisez</h3></div><div class="cb stack" style="--g:14px">'+US.map(function(u){return u[2]?'<div><div class="hrow sp" style="margin-bottom:6px"><span class="s">'+u[0]+'</span><b class="num s">'+F.num(u[1])+' / '+F.num(u[2])+'</b></div>'+U.bar(u[1]/u[2]*100,u[3]?'var(--warn)':'')+'</div>':'<div class="hrow sp"><span class="s">'+u[0]+'</span><b class="num s">'+F.num(u[1])+' · <span class="okc">illimités</span></b></div>'}).join('')+'<div class="hrow sp"><span class="s">Chevaux</span><b class="num s">'+D.horses.length+' · <span class="okc">illimités</span></b></div>'+'<div class="note warn">'+ICON('camera','sm')+'<span>Vos 8 caméras incluses sont utilisées. Chaque caméra en plus coûte 4 € par mois.</span></div></div></div>'+
    '<div class="card"><div class="ch" style="padding-bottom:6px"><h3>Factures Piaffe</h3><span class="xs mut">Reçues en Factur-X</span></div>'+INV.map(function(f){return '<div class="pfr-r" style="min-height:52px"><span class="av sq" style="--c:var(--surface-2);color:var(--mut);box-shadow:inset 0 0 0 1px var(--line)">'+ICON('invoice')+'</span><div class="grow"><div class="t">'+f[0]+' 2026</div><div class="d pf-mono" style="font-size:11.5px">'+f[1]+'</div></div><div class="ctl"><b class="num s">178,80 €</b><button class="btn sm ghost icon" data-dlf="'+f[1]+'" title="Télécharger la facture">'+ICON('download','sm')+'</button></div></div>'}).join('')+'<div class="cf"><button class="btn sm ghost" data-allf>Toutes les factures</button><span class="grow"></span><button class="btn sm ghost danger" data-stop>Résilier</button></div></div></div>'}

P.css(`
.pfp-k{display:inline-grid;place-items:center;min-width:26px;height:26px;padding:0 7px;border-radius:7px;font:600 12px var(--f-mono);color:var(--ink);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line-2),0 1px 0 var(--line-2)}
.pfp-faq{border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line);background:var(--surface)}
.pfp-faq summary{list-style:none;display:flex;align-items:center;justify-content:space-between;gap:10px;padding:12px 14px;font-weight:600;font-size:13.5px;cursor:pointer}
.pfp-faq summary::-webkit-details-marker{display:none}
.pfp-faq summary svg.i{flex:none;color:var(--mut);transition:transform var(--t-2) var(--e-out)}
.pfp-faq[open] summary svg.i{transform:rotate(180deg)}
.pfp-faq p{padding:0 14px 14px;font-size:13.5px;line-height:1.5;color:var(--ink-2)}
.pfp-vid{position:relative;aspect-ratio:16/9;border-radius:var(--r-lg);background:var(--hero);display:grid;place-items:center;overflow:hidden}
.pfp-play{width:64px;height:64px;border-radius:50%;background:var(--acc);color:var(--acc-ink);display:grid;place-items:center;box-shadow:var(--shadow-3);transition:transform var(--t-2) var(--e-spring)}
.pfp-play:hover{transform:scale(1.06)}.pfp-play svg.i{width:26px;height:26px}
.pfp-vb{position:absolute;left:16px;right:16px;bottom:14px;height:4px;border-radius:2px;background:color-mix(in srgb,var(--hero-ink) 22%,transparent)}
.pfp-vb i{position:absolute;left:0;top:0;bottom:0;width:0;border-radius:2px;background:var(--hero-ink);transition:width .12s linear}
.pfp-vt{position:absolute;right:16px;bottom:24px;font-size:11.5px;color:color-mix(in srgb,var(--hero-ink) 80%,transparent)}
.pfp-pr{display:inline-flex;flex-direction:column;align-items:flex-end;gap:1px;padding:4px 8px;margin:-4px -8px;border-radius:8px;transition:background var(--t-1)}
.pfp-pr:hover{background:var(--acc-pale)}
.pfp-pr small{font-size:11px;color:var(--mut);font-weight:500}
.pfp-tr{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 18px}
.pfp-tr div{display:flex;gap:10px;align-items:flex-start;font-size:13.5px;line-height:1.4}
.pfp-tr div svg.i{flex:none;color:var(--ok);margin-top:1px}
.pfp-tr b{display:block}.pfp-tr span{color:var(--mut);font-size:12.5px}
@container main (max-width:760px){.pfp-tr{grid-template-columns:minmax(0,1fr)}}
`);
/* ---------- Mes préférences : thème, teinte, densité, raccourcis (propres à la personne) ---------- */
var HUES=[['saphir','Saphir','var(--c1)'],['lagon','Lagon','var(--c3)'],['prairie','Prairie','var(--c7)'],['iris','Iris','var(--c5)'],['bruyere','Bruyère','var(--c6)'],['ambre','Ambre','var(--c4)']];
var KEYS=[['⌘ K','Ouvrir la recherche et les actions','Partout'],['/','Ouvrir la recherche','Partout'],['?','Afficher cette liste','Partout'],['N','Poser une question à l’assistant','Partout'],['G puis C','Aller à l’écran Aujourd’hui','Gérant'],['G puis P','Aller au planning','Gérant'],['G puis H','Aller aux chevaux','Gérant'],['G puis A','Aller aux adhérents','Gérant'],['G puis F','Aller à la facturation','Gérant'],['G puis R','Aller aux réglages','Gérant'],['Échap','Fermer une fenêtre ou un panneau','Partout']];
function themeNow(){var t=document.documentElement.getAttribute('data-theme');return t==='dark'||t==='light'?t:'auto'}
function kbd(k){return k.split(' ').map(function(x){return x==='puis'?'<span class="xs mut">puis</span>':'<kbd class="pfp-k">'+x+'</kbd>'}).join(' ')}
function keysSheet(){P.sheet({title:'Raccourcis clavier',icon:'cmd',body:'<p class="s mut" style="margin-bottom:12px">Les raccourcis à une touche fonctionnent quand aucun champ n’est en cours de saisie.'+(P.prefs.get('me:keys',true)?'':' Ils sont désactivés dans vos préférences.')+'</p><div class="card flat">'+KEYS.map(function(k){return '<div class="pfr-r" style="min-height:46px"><div class="grow"><div class="t">'+k[1]+'</div><div class="d">'+k[2]+'</div></div><div class="ctl">'+kbd(k[0])+'</div></div>'}).join('')+'</div>'})}
function secPrefs(){var hue=P.prefs.get('me:hue','saphir'),den=P.prefs.get('me:density','comfort'),th=themeNow(),kon=P.prefs.get('me:keys',true);
  return head('Mes préférences','Ces choix ne concernent que vous, sur tous vos appareils. Les réglages de l’écurie restent ceux de Claire et s’appliquent à toute l’équipe.',null,true)+
   '<div class="pfr-2"><div class="stack" style="--g:14px"><div class="card" style="overflow:hidden"><div class="pfr-gh"><span>Apparence</span></div>'+
     row('Thème','Automatique suit le réglage de votre appareil',U.seg([['auto','Automatique'],['light',ICON('sun','sm')+'Clair'],['dark',ICON('moon','sm')+'Sombre']],th,'data-thm'),'col')+
     row('Teinte personnelle','La couleur des boutons, des liens et des sélections, pour vous seule','<div class="hrow wrap" style="--g:10px">'+HUES.map(function(h){return '<button class="pfr-sw" style="--c:'+h[2]+'" data-hue="'+h[0]+'" aria-pressed="'+(hue===h[0])+'" title="'+h[1]+'">'+ICON('check')+'</button>'}).join('')+'</div>','col')+
     row('Densité','Compacte montre plus de lignes à l’écran, sur ordinateur surtout',U.seg([['comfort','Confortable'],['compact','Compacte']],den,'data-den'),'col')+'</div>'+
    '<div class="card" style="overflow:hidden"><div class="pfr-gh"><span>Raccourcis clavier</span><span style="text-transform:none;letter-spacing:0;font-weight:500">Touche ? pour les revoir</span></div>'+row('Raccourcis à une touche','G puis une lettre pour changer d’écran, N pour l’assistant',U.tog(kon,'pfp-keys'))+
     KEYS.map(function(k){return '<div class="pfr-r" style="min-height:44px;padding-top:8px;padding-bottom:8px'+(kon||/⌘|Échap/.test(k[0])?'':';opacity:.5')+'"><div class="grow"><div class="t" style="font-weight:500">'+k[1]+'</div></div><div class="ctl">'+kbd(k[0])+'</div></div>'}).join('')+'</div></div>'+
   '<div class="card pfr-prev keep"><div class="eyebrow" style="margin-bottom:10px">Aperçu</div><div class="stack" style="--g:10px" data-pv><div class="hrow wrap" style="--g:6px"><span class="chip acc dot">Sélection</span><span class="chip">Neutre</span></div><button class="btn pri block" data-pvb>Bouton principal</button><div class="card flat">'+row('Option activée','Avec votre teinte',U.tog(true))+'</div><div class="hrow" style="--g:8px">'+U.bar(64)+'</div><a class="s" style="color:var(--acc);font-weight:600">Un lien dans un texte</a></div></div></div>'}

/* ---------- Établissement et rôle ---------- */
var EST=[['til','Écurie des Tilleuls','Saint-Arnoult-en-Yvelines · '+D.club.boxes+' boxes · '+D.horses.length+' chevaux','Gérante','stable'],['hv','Haras de la Vallée','Senlis · élevage · 18 boxes, 12 juments','Associée, en lecture','heart']];
var MYR=[['gerant','Gérante','Écurie des Tilleuls','Tout Piaffe, la paie et les réglages','stable',['Aujourd’hui','Planning','Chevaux','Adhérents']],['proprio','Propriétaire','Haras de la Vallée','Sa jument Prélude, ses factures et son carnet de santé','owner',['Accueil','Mon cheval','Paiements','Messages']],['benevole','Bénévole','Hunter Club des Tilleuls, dimanche','Le chronométrage et le planning des bénévoles','flag',['Mon créneau','Chronométrage','Messages']]];
function secEtab(){var est=RG.est||'til',me=RG.me||'gerant',r=MYR.find(function(x){return x[0]===me});
  return head('Établissement et rôle','Un seul compte pour tous vos établissements et toutes vos casquettes. Chacun garde ses réglages, ses données et ses droits.',null,true)+
   (est!=='til'?'<div class="pfn-banner">'+ICON('swap','sm')+'<span class="grow">Vous consultez le <b>Haras de la Vallée</b>. Les écrans de la démo restent ceux des Tilleuls.</span><button class="btn sm pri" data-est="til">Revenir aux Tilleuls</button></div>':'')+
   '<div class="card" style="overflow:hidden"><div class="pfr-gh"><span>Mes établissements</span></div>'+EST.map(function(e){var cur=e[0]===est;return '<div class="pfr-r"><span class="av sq" style="--c:'+(cur?'var(--acc-pale)':'var(--bg-2)')+';color:var(--'+(cur?'acc':'mut')+')">'+ICON(e[4])+'</span><div class="grow"><div class="t">'+e[1]+'</div><div class="d">'+e[2]+' · '+e[3]+'</div></div><div class="ctl">'+(cur?'<span class="chip acc dot">Ouvert</span>':'<button class="btn sm" data-est="'+e[0]+'">'+ICON('swap','sm')+'Ouvrir</button>')+'</div></div>'}).join('')+'<div class="cf"><button class="btn sm ghost" data-addest>'+ICON('plus','sm')+'Rejoindre un autre établissement</button></div></div>'+
   '<div class="pfr-2"><div class="card" style="overflow:hidden"><div class="pfr-gh"><span>Mes rôles, Claire Morel</span></div>'+MYR.map(function(x){var cur=x[0]===me;return '<div class="pfr-r"><span class="av sq" style="--c:'+(cur?'var(--acc-pale)':'var(--bg-2)')+';color:var(--'+(cur?'acc':'mut')+')">'+ICON(x[4])+'</span><div class="grow"><div class="t">'+x[1]+' · '+x[2]+'</div><div class="d">'+x[3]+'</div></div><div class="ctl">'+(cur?'<span class="chip acc dot">Actif</span>':'<button class="btn sm" data-me="'+x[0]+'">Passer à ce rôle</button>')+'</div></div>'}).join('')+'</div>'+
   '<div class="card pfr-prev keep"><div class="eyebrow" style="margin-bottom:6px">Votre menu en '+r[1].toLowerCase()+'</div><div class="xs mut" style="margin-bottom:10px">'+r[2]+'</div>'+r[5].map(function(t,i){return '<div class="pfr-mn'+(i===0?' on':'')+'">'+ICON(['today','planning','horse','members'][i]||'chat')+t+'</div>'}).join('')+
    (me==='gerant'?'':'<button class="btn sm block" style="margin-top:12px" data-demo="'+me+'">'+ICON('ext','sm')+(me==='proprio'?'Voir l’espace propriétaire de la démo':'Voir le concours dans la démo')+'</button>')+'</div></div>'}

/* ---------- Aide ---------- */
var TUT=D.pfTut=D.pfTut||[['Prendre Piaffe en main',4,'Accueil, menu, assistant'],['Créer une reprise et remplir le montoir',3,'Planning'],['Facturer les pensions du mois',5,'Facturation'],['Relancer les impayés sans y passer la soirée',2,'Facturation'],['Reprendre ses données depuis Kavalog ou Excel',4,'Import'],['Brancher Claude ou ChatGPT sur l’écurie',6,'Connecteurs']];
var FAQ=[['Comment ajouter un cheval avec son numéro SIRE ?','Dans Chevaux, touchez « Ajouter un cheval », tapez le numéro SIRE : la race, la robe et les origines arrivent depuis les données ouvertes de l’IFCE.'],['Un adhérent n’a pas reçu sa facture','Ouvrez sa fiche, onglet Factures, puis « Renvoyer ». Vérifiez aussi son adresse e-mail dans le profil.'],['Comment transmettre les licences à la FFE ?','Piaffe prépare les lots de licences. La télétransmission directe attend l’agrément de la FFE : en attendant, vous les saisissez dans votre espace FFE en un copier-coller.'],['Puis-je partir avec mes données ?','Oui, à tout moment : Réglages, Abonnement, « Exporter toutes mes données ». Vous recevez des fichiers Excel, un export comptable et vos documents.'],['Mes salariés voient-ils les factures ?','Non. Chaque rôle a ses droits, réglables dans Réglages, Rôles et permissions.'],['Que se passe-t-il sans réseau à l’écurie ?','L’application de l’équipe continue de marcher : tournée, soins, appel. Tout part dès le retour du réseau.']];
function secAide(){var seen=RG.seen||{};
  return head('Aide et tutoriels','Des vidéos courtes, des réponses écrites et de vraies personnes, anciennes gérantes d’écurie, pour vous répondre.')+
   '<div class="g3">'+[['phone','Téléphone','01 23 45 67 89','Du lundi au samedi, de 8 h à 20 h','call'],['video','Visio avec Marion','30 minutes, avec partage d’écran','Créneaux dès aujourd’hui','visio'],['chat','Messagerie','Réponse en 12 minutes en moyenne','7 jours sur 7','msg']].map(function(c){return '<button class="card pad stack hover" style="--g:8px;text-align:left" data-help="'+c[4]+'"><span class="av sq" style="--c:var(--acc-pale);color:var(--acc)">'+ICON(c[0])+'</span><b>'+c[1]+'</b><div class="s">'+c[2]+'</div><div class="xs mut">'+c[3]+'</div></button>'}).join('')+'</div>'+
   '<div class="card"><div class="ch" style="padding-bottom:6px"><h3>Tutoriels en vidéo</h3><span class="xs mut">'+Object.keys(seen).length+' vus sur '+TUT.length+'</span></div>'+TUT.map(function(t,i){return '<button class="pfr-r pf-tap" style="width:100%;text-align:left" data-tut="'+i+'"><span class="av sq" style="--c:var(--navy);color:var(--navy-ink)">'+ICON('play','sm')+'</span><div class="grow"><div class="t">'+t[0]+'</div><div class="d">'+t[2]+' · '+t[1]+' min</div></div><div class="ctl">'+(seen[i]?'<span class="chip ok dot">Vu</span>':ICON('right','sm'))+'</div></button>'}).join('')+'</div>'+
   '<div class="card"><div class="ch"><h3>Questions fréquentes</h3></div><div class="cb stack" style="--g:10px"><div class="search"><span>'+ICON('search','sm')+'</span><input class="in" data-fq placeholder="Chercher dans l’aide, par exemple « licence »" aria-label="Chercher dans l’aide"></div><div class="stack" style="--g:6px" data-faq>'+FAQ.map(function(f){return '<details class="pfp-faq"><summary>'+f[0]+ICON('down','sm')+'</summary><p>'+f[1]+'</p></details>'}).join('')+'</div><div class="s mut" data-fqn style="display:none">Aucune réponse écrite. Posez la question à Marion par la messagerie.</div></div></div>'}
function tutSheet(i){var t=TUT[i],ch=['Le principe','Pas à pas','Les pièges à éviter','Pour aller plus loin'];
  var sh=P.sheet({title:t[0],icon:'video',wide:true,body:'<div class="stack" style="--g:14px"><div class="pfp-vid"><button class="pfp-play" data-play title="Lire la vidéo">'+ICON('play')+'</button><div class="pfp-vb"><i data-vp></i></div><span class="pfp-vt num" data-vt>0:00 / '+t[1]+':00</span></div><div><div class="b s" style="margin-bottom:8px">Chapitres</div><div class="card flat">'+ch.map(function(c,k){return '<div class="li"><span class="num xs mut" style="width:34px">'+Math.floor(k*t[1]/4)+':'+(k%2?'30':'00')+'</span><div class="grow t">'+c+'</div></div>'}).join('')+'</div></div></div>',foot:'<button class="btn" data-x2>Fermer</button><button class="btn pri" data-seen>'+ICON('check','sm')+'Marquer comme vu</button>'});
  var tm=null,p=0;sh.querySelector('[data-play]').onclick=function(){var b=this;if(tm){clearInterval(tm);tm=null;b.innerHTML=ICON('play');return}b.innerHTML=ICON('pause');tm=setInterval(function(){if(!sh.isConnected){clearInterval(tm);return}p=Math.min(100,p+2);sh.querySelector('[data-vp]').style.width=p+'%';var s=Math.round(p/100*t[1]*60);sh.querySelector('[data-vt]').textContent=Math.floor(s/60)+':'+String(s%60).padStart(2,'0')+' / '+t[1]+':00';if(p>=100){clearInterval(tm);tm=null;b.innerHTML=ICON('refresh')}},120)};
  sh.querySelector('[data-x2]').onclick=function(){sh.close()};
  sh.querySelector('[data-seen]').onclick=function(){RG.seen=RG.seen||{};RG.seen[i]=1;sh.close();P.rerender();P.toast('Tutoriel marqué comme vu')}}

/* ---------- Exporter toutes mes données ---------- */
function exportSheet(){var IT=[['members','Adhérents, familles et payeurs','148 fiches'],['horse','Chevaux, santé et registre d’élevage',D.horses.length+' fiches'],['invoice','Factures, avoirs et paiements','1 240 factures'],['accounting','Comptabilité au format FEC','Exercice 2026'],['planning','Planning, reprises et présences','Depuis septembre 2025'],['doc','Contrats signés et documents','312 PDF'],['team','Équipe, plannings et pointages',(D.staff.length-1)+' salariés et la gérante']];
  var sh=P.sheet({title:'Exporter toutes mes données',icon:'download',body:'<div class="stack" style="--g:14px"><p class="s" style="line-height:1.5">Vos données vous appartiennent. Piaffe prépare une archive complète, lisible sans Piaffe : tableaux Excel ou CSV, export comptable et documents.</p><div class="field"><span>Format des tableaux</span>'+U.seg([['xlsx','Excel'],['csv','CSV']],'xlsx','data-fmt')+'</div><div class="card flat">'+IT.map(function(x,i){return '<div class="li" data-it="'+i+'">'+ICON(x[0])+'<div class="grow"><div class="t">'+x[1]+'</div><div class="s">'+x[2]+'</div></div><span data-st>'+U.chk(true)+'</span></div>'}).join('')+'</div><div class="note">'+ICON('shield','sm')+'<span>Le lien de téléchargement est envoyé à claire.morel@ecurie-tilleuls.example et expire dans 7 jours.</span></div></div>',
   foot:'<button class="btn" data-x2>Annuler</button><button class="btn pri" data-go2>'+ICON('download','sm')+'Préparer l’archive</button>'});
  sh.querySelector('[data-x2]').onclick=function(){sh.close()};
  sh.querySelector('[data-go2]').onclick=function(){var b=this,k=0;b.disabled=true;b.textContent='Préparation en cours';
    (function nx(){if(!sh.isConnected)return;var row=sh.querySelector('[data-it="'+k+'"]');if(row){row.querySelector('[data-st]').innerHTML='<span class="chip ok dot">Prêt</span>';k++;setTimeout(nx,P.RM?0:260)}else{b.disabled=false;b.innerHTML=ICON('check','sm')+'Archive prête';b.onclick=function(){sh.close();P.toast('Archive complète téléchargée : 7 dossiers, 1,2 Go',{icon:'download'})};P.toast('Archive prête, le lien est aussi parti par e-mail',{icon:'mail'})}})()}}

/* ---------- Grille de prix par âge ---------- */
var AGE=D.pfAge=D.pfAge||{cols:['Forfait annuel, 1 h par semaine','Carte de 10 séances','Stage à la journée'],rows:[['Baby-poney','3 à 5 ans',[290,95,40]],['Enfants','6 à 11 ans',[540,165,55]],['Adolescents','12 à 17 ans',[590,175,60]],['Étudiants','18 à 25 ans',[620,185,65]],['Adultes','26 ans et plus',[680,195,65]]],ext:15,auto:true};
function extP(v){return Math.round(v*(1+AGE.ext/100))}
function ageGrid(){return '<div class="card"><div class="ch"><div><h3>Grille par âge et prix non-adhérent</h3><div class="xs mut" style="margin-top:2px">Touchez un prix pour le modifier</div></div>'+U.tog(AGE.auto,'pfr-auto')+'</div><div class="cb stack" style="--g:12px"><div class="s mut">Appliquer la tranche selon la date de naissance du cavalier, au 1er septembre</div>'+
   '<div class="tw card flat"><table class="tbl"><thead><tr><th>Tranche</th>'+AGE.cols.map(function(c){return '<th class="n">'+c+'</th>'}).join('')+'</tr></thead><tbody>'+AGE.rows.map(function(r,i){return '<tr><td><b>'+r[0]+'</b><div class="xs mut">'+r[1]+'</div></td>'+r[2].map(function(v,j){return '<td class="n"><button class="pfp-pr" data-age="'+i+':'+j+'" title="Modifier le prix"><b class="num">'+F.eur(v)+'</b><small>non-adhérent '+F.eur(extP(v))+'</small></button></td>'}).join('')+'</tr>'}).join('')+'</tbody></table></div>'+
   '<div class="pfr-r" style="padding:0;min-height:0"><div class="grow"><div class="t">Majoration pour les non-adhérents</div><div class="d">Cavaliers de passage et extérieurs, sur toute la grille</div></div><div class="ctl">'+'<div class="pfr-stp"><button class="btn sm icon ghost" data-ex="-5" title="Moins">'+ICON('minus','sm')+'</button><b style="min-width:46px">'+AGE.ext+' %</b><button class="btn sm icon ghost" data-ex="5" title="Plus">'+ICON('plus','sm')+'</button></div>'+'</div></div>'+
   '<div class="note">'+ICON('child','sm')+'<span>Exemple : Jules Martin, 9 ans, paie le forfait annuel <b>'+F.eur(AGE.rows[1][2][0])+'</b>. Sans adhésion, ce serait <b>'+F.eur(extP(AGE.rows[1][2][0]))+'</b>.</span></div></div></div>'}

function renderSet(el,ctx){
  if(ctx.params.sec){RG.sec=ctx.params.sec;delete ctx.params.sec}
  var body={prefs:secPrefs,etab:secEtab,aide:secAide,modules:secModules,roles:secRoles,club:secClub,tarifs:secTarifs,inst:secInst,resa:secResa,notifs:secNotifs,secu:secSecu,abo:secAbo}[RG.sec](ctx);
  el.innerHTML=U.ph('Réglages','Adaptez Piaffe à votre club. Les bons choix sont déjà faits : ne changez que ce qui vous gêne.')+
   '<div class="pfr-lay"><nav class="pfr-nav scroll-x">'+SECS.map(function(g){return '<div class="pfr-ng">'+g[0]+'</div>'+g[1].map(function(s){return '<button class="pfr-nb" data-sec="'+s[0]+'" aria-current="'+(s[0]===RG.sec)+'">'+ICON(s[2])+s[1]+'</button>'}).join('')}).join('')+'</nav><div class="stack'+(X.q?'':' rise')+'" style="--g:14px" data-body>'+body+'</div></div>';
  var q=function(s){return el.querySelector(s)},view=el.closest('.view');
  function keep(fn){var y=view.scrollTop;X.q=true;try{fn()}finally{X.q=false}var v=P.$('.view',P.app());if(v){v.style.scrollBehavior='auto';v.scrollTop=y;v.style.scrollBehavior=''}}
  on(el,'[data-sec]',function(b){RG.sec=b.getAttribute('data-sec');P.rerender()});
  var cn=q('.pfr-nb[aria-current="true"]');if(cn&&cn.scrollIntoView&&ctx.mobile)cn.scrollIntoView({block:'nearest',inline:'center'});
  /* interactions génériques */
  on(el,'.pfr-stp [data-s]',function(b){var v=b.parentNode.querySelector('b');v.textContent=Math.max(0,+v.textContent+ +b.getAttribute('data-s'))});
  on(el,'[data-save]',function(){P.toast('Réglages enregistrés')});
  var S=RG.sec;
  if(S==='modules'){
    function setOff(list){keep(function(){P.prefs.setOff(RG.role,list)})}
    function elevTog(v){var off=P.prefs.off('gerant').filter(function(x){return x!=='elevage'}),was=P.prefs.get('elevage',true)!==false&&P.prefs.off('gerant').indexOf('elevage')<0,on=v===undefined?!was:v;P.prefs.set('elevage',on);if(!on)off.push('elevage');setOff(off);if(v===undefined)P.toast(on?'Élevage activé : l’onglet Reproduction apparaît sur les fiches des juments':'Élevage masqué : l’onglet Reproduction disparaît des fiches',{icon:'heart',undo:function(){elevTog(was)}})}
    on(el,'[data-vr]',function(b){RG.role=b.getAttribute('data-vr');keep(P.rerender)});
    on(el,'[data-mod]',function(b){if(b.getAttribute('data-mod')==='elevage'){elevTog();return}var id=b.getAttribute('data-mod'),off=P.prefs.off(RG.role).slice(),i=off.indexOf(id),t=b.closest('.pfr-r').querySelector('.t').textContent;if(i>=0)off.splice(i,1);else off.push(id);setOff(off);P.toast(i>=0?'« '+t+' » est de retour dans la vue '+RL[RG.role].toLowerCase():'« '+t+' » est masqué pour la vue '+RL[RG.role].toLowerCase(),{undo:function(){var o=P.prefs.off(RG.role).slice(),k=o.indexOf(id);if(k>=0)o.splice(k,1);else o.push(id);setOff(o)}})});
    on(el,'[data-preset]',function(b){var p=PRESETS[+b.getAttribute('data-preset')];setOff(p[1]);P.toast('Modèle « '+p[0]+' » appliqué : '+(p[1].length?p[1].length+' modules masqués':'tous les modules sont actifs'))});
    q('[data-reset]').onclick=function(){setOff([]);P.toast('Tous les modules de la vue '+RL[RG.role].toLowerCase()+' sont actifs')};
  }
  if(S==='roles'){
    on(el,'[data-lv]',function(b){var k=b.getAttribute('data-lv').split(':'),r=RIGHTS[+k[0]],j=+k[1];if(j===0){P.toast('Le rôle Gérant garde tous les droits',{icon:'lock'});return}var v=(r[2][j]+1)%4;r[2][j]=v;b.className='pfr-lv l'+v;b.textContent=v?LV[v]:'·'});
    on(el,'[data-rv]',function(b){var k=b.getAttribute('data-rv').split(':');if(+k[1]===0){P.toast('Le rôle Gérant garde tous les droits',{icon:'lock'});setTimeout(function(){keep(P.rerender)},0);return}RIGHTS[+k[0]][2][+k[1]]=+k[2]});
    on(el,'[data-pr]',function(b){RG.pr=+b.getAttribute('data-pr');keep(P.rerender)});
    on(el,'[data-srole]',function(b){var s=D.staff[+b.getAttribute('data-srole')];P.toast(s.first+' '+s.last+' a maintenant le rôle '+b.value)},'change');
    q('[data-newrole]').onclick=function(){P.sheet({title:'Créer un rôle',icon:'shield',body:'<div class="stack" style="--g:14px"><label class="field"><span>Nom du rôle</span><input class="in" data-rn value="Maréchal et vétérinaire"></label><div class="field"><span>Partir des droits de</span>'+U.seg(['Soigneur','Coach ext.','Aucun droit'],'Soigneur','data-base')+'</div><div class="note">'+ICON('info','sm')+'<span>Idéal pour un intervenant extérieur : il voit les chevaux qu’il suit et note ses soins, sans compte complet.</span></div></div>',foot:'<button class="btn pri" data-mk>Créer le rôle</button>'});var sh=sheet();sh.querySelector('[data-mk]').onclick=function(){var n=sh.querySelector('[data-rn]').value||'Nouveau rôle';if(ROLES.length<9){ROLES.push([n.length>12?n.slice(0,11)+'…':n,'0']);RIGHTS.forEach(function(r){r[2].push(r[0]==='Chevaux'?3:0)})}sh.close();P.rerender();P.toast('Rôle « '+n+' » créé')}};
    q('[data-invite]').onclick=function(){P.sheet({title:'Inviter une personne',icon:'mail',body:'<div class="stack" style="--g:14px"><label class="field"><span>E-mail ou téléphone</span><input class="in" data-em value="camille.herve@exemple.fr"></label><label class="field"><span>Rôle</span>'+sel(ROLES.map(function(r){return r[0]}),'Soigneur')+'</label><div class="card flat">'+row('Exiger la double authentification','Recommandé pour tout accès aux factures',U.tog(true))+'</div></div>',foot:'<button class="btn pri" data-snd>'+ICON('send','sm')+'Envoyer l’invitation</button>'});var sh=sheet();sh.querySelector('[data-snd]').onclick=function(){var e=sh.querySelector('[data-em]').value;sh.close();P.toast('Invitation envoyée à '+e)}};
  }
  if(S==='club'){
    on(el,'[data-tint]',function(b){RG.tint=b.getAttribute('data-tint');P.prefs.set('club:tint',RG.tint);$$('[data-tint]',el).forEach(function(x){x.setAttribute('aria-pressed',x===b)});q('[data-ph]').style.setProperty('--pc',RG.tint);P.toast('Teinte « '+b.title+' » appliquée au portail adhérent')});
    q('[data-wel]').oninput=function(){q('[data-welp]').textContent=this.value||'Bienvenue'};
    q('[data-logo]').onclick=function(){P.toast('Logo mis à jour sur le portail et les documents',{icon:'image'})};
    q('[data-cpp]').onclick=function(){X.clip('https://tilleuls.piaffe.fr','Adresse du portail copiée')};
  }
  if(S==='tarifs'){
    function tsheet(t){var nw=!t;t=t||{n:'',k:'Séance',p:30,u:'la séance',tva:5.5,web:true};P.sheet({title:nw?'Ajouter un tarif':t.n,icon:'tag',body:'<div class="stack" style="--g:14px"><label class="field"><span>Nom de la prestation</span><input class="in" data-n value="'+esc(nw?'Séance découverte':t.n)+'"></label><div class="g2" style="--g:12px"><label class="field"><span>Prix TTC en euros</span><input class="in num" data-p inputmode="decimal" value="'+t.p+'"></label><label class="field"><span>Taux de TVA</span>'+sel(['5,5 %','20 %','Non applicable'],t.tva===20?'20 %':t.tva?'5,5 %':'Non applicable','data-v')+'</label></div><label class="field"><span>Famille</span>'+sel(['Forfait','Carte','Séance','Stage','Pension','Concours','Licence'],t.k,'data-k')+'</label><div class="card flat">'+row('Vendu en ligne','Visible sur le portail adhérent',U.tog(t.web,'t-web'))+row('Paiement en plusieurs fois','Prélèvement mensuel sans frais',U.tog(t.p>300))+'</div><dl class="pf-kv"><dt>Hors taxes</dt><dd class="num" data-ht></dd><dt>Compte comptable</dt><dd class="pf-mono">706100</dd></dl></div>',foot:(nw?'':'<button class="btn danger" data-del>Supprimer</button>')+'<button class="btn pri" data-ok>'+(nw?'Ajouter le tarif':'Enregistrer')+'</button>'});
      var sh=sheet(),g=function(s){return sh.querySelector(s)};function ht(){var r=g('[data-v]').value==='20 %'?20:g('[data-v]').value==='5,5 %'?5.5:0;g('[data-ht]').textContent=F.eur((parseFloat(String(g('[data-p]').value).replace(',','.'))||0)/(1+r/100),true);return r}ht();g('[data-p]').oninput=ht;g('[data-v]').onchange=ht;
      g('[data-ok]').onclick=function(){t.n=g('[data-n]').value;t.p=parseFloat(String(g('[data-p]').value).replace(',','.'))||0;t.tva=ht();t.k=g('[data-k]').value;t.web=g('#t-web').getAttribute('aria-checked')==='true';if(nw)TARIFS.push(t);sh.close();keep(P.rerender);P.toast(nw?'Tarif « '+t.n+' » ajouté':'Tarif « '+t.n+' » enregistré')};
      if(!nw)g('[data-del]').onclick=function(){var i=TARIFS.indexOf(t);TARIFS.splice(i,1);sh.close();keep(P.rerender);P.toast('Tarif supprimé',{undo:function(){TARIFS.splice(i,0,t);keep(P.rerender)}})}}
    on(el,'[data-web]',function(b,e){e.stopPropagation();var t=TARIFS[+b.getAttribute('data-web')];t.web=!t.web;b.setAttribute('aria-checked',t.web);P.toast(t.web?'« '+t.n+' » est en vente en ligne':'« '+t.n+' » n’est plus vendu en ligne')});
    on(el,'[data-tar]',function(b){tsheet(TARIFS[+b.getAttribute('data-tar')])});q('[data-newt]').onclick=function(){tsheet()};
  }
  if(S==='inst'){
    on(el,'[data-edi]',function(b){var a=D.club.arenas[+b.getAttribute('data-edi')];P.sheet({title:a.name,icon:'arena',body:'<div class="stack" style="--g:14px"><label class="field"><span>Nom</span><input class="in" data-n value="'+esc(a.name)+'"></label><div class="g2" style="--g:12px"><label class="field"><span>Type de sol</span><input class="in" data-k value="'+esc(a.kind)+'"></label><label class="field"><span>Dimensions</span><input class="in" data-z value="'+esc(a.size)+'"></label></div><div class="card flat">'+row('Hersage à suivre','Une tâche est créée après 20 h d’utilisation',U.tog(true))+row('Visible sur le portail adhérent','Avec son état du jour',U.tog(true))+'</div></div>',foot:'<button class="btn pri" data-ok>Enregistrer</button>'});var sh=sheet();sh.querySelector('[data-ok]').onclick=function(){a.name=sh.querySelector('[data-n]').value;a.kind=sh.querySelector('[data-k]').value;a.size=sh.querySelector('[data-z]').value;sh.close();keep(P.rerender);P.toast('« '+a.name+' » enregistré')}});
    q('[data-newi]').onclick=function(){P.toast('Nouvelle installation ajoutée : complétez sa fiche',{icon:'arena'})};
    q('[data-newp]').onclick=function(){var d=document.createElement('span');d.className='chip lg pop';d.innerHTML=ICON('paddock','sm')+'Nouveau paddock';q('[data-pads]').appendChild(d);P.toast('Paddock ajouté')};
  }
  if(S==='resa'){function txt(){var v=function(k){return q('[data-rule="'+k+'"]').value.toLowerCase()};q('[data-rtxt]').innerHTML='Vous pouvez réserver une reprise <b>'+v('open')+'</b>. L’annulation est sans frais <b>'+v('free')+'</b> la séance. Passé ce délai, '+v('late').replace('la séance','<b>la séance')+'</b>. Un rattrapage reste valable <b>'+v('catch')+'</b>.'}txt();on(el,'[data-rule]',txt,'change')}
  if(S==='notifs'){on(el,'[data-nt]',function(b){var k=b.getAttribute('data-nt').split(':');setTimeout(function(){NOTIFS[+k[0]][2][+k[1]]=b.getAttribute('aria-pressed')==='true'?1:0},0)});q('[data-testn]').onclick=function(){P.toast('Notification de test envoyée sur votre téléphone',{icon:'bell'})}}
  if(S==='secu'){
    q('[data-remind]').onclick=function(){this.outerHTML='<span class="chip acc dot">Relancés</span>';P.toast('Rappel envoyé à Kévin et à Jade')};
    q('[data-explog]').onclick=function(){P.toast('Journal de connexion exporté (90 jours)',{icon:'download'})};
    on(el,'[data-out]',function(b){var n=b.getAttribute('data-out');b.outerHTML='<span class="chip">Déconnecté</span>';P.toast(n+' devra se reconnecter')});
    q('[data-block]').onclick=function(){this.outerHTML='<span class="chip acc dot">Lien envoyé</span>';P.toast('Lien de changement de mot de passe envoyé à Claire')};
    q('[data-reg]').onclick=function(){P.toast('Registre des traitements téléchargé en PDF',{icon:'download'})};
    q('[data-pexp]').onclick=function(){var n=q('[data-pq]').value||'cette personne',b=this;b.disabled=true;b.innerHTML='Préparation de l’export';setTimeout(function(){if(b.isConnected){b.disabled=false;b.innerHTML=ICON('check','sm')+'Export prêt, envoyé par e-mail'}P.toast('Export des données de '+n+' prêt : 1 fiche, 14 factures, 62 réservations')},P.RM?0:900)};
    q('[data-anon]').onclick=function(){P.sheet({title:'Rendre la fiche anonyme',icon:'shield',body:'<div class="pfa-prev"><div class="pfa-ph">'+ICON('shield','sm')+'<span>Aperçu avant exécution</span><span class="chip acc">Irréversible</span></div><div class="pfa-pb"><h4>Famille Perrin, 3 personnes</h4><dl class="pf-kv"><dt>Effacé</dt><dd>Noms, adresses, téléphones, e-mails, photos, messages</dd><dt>Conservé</dt><dd>7 factures, sans nom, pendant 10 ans</dd><dt>Journal</dt><dd>La demande et sa date sont tracées</dd></dl><label class="hrow pf-tap" style="cursor:pointer">'+U.chk(false,'an')+'<span class="s b">Je confirme, cette action ne peut pas être annulée</span></label></div></div>',foot:'<button class="btn danger" data-ok disabled>Rendre anonyme</button>'});var sh=sheet(),ok=sh.querySelector('[data-ok]');sh.querySelector('.chk').addEventListener('click',function(){var c=this;setTimeout(function(){ok.disabled=c.getAttribute('aria-checked')!=='true'},0)});ok.onclick=function(){sh.close();var b=q('[data-anon]');if(b){b.outerHTML='<span class="chip ok dot">Fiche rendue anonyme le 17 nov.</span>'}P.toast('Famille Perrin rendue anonyme, factures conservées')}};
  }
  if(S==='abo'){
    on(el,'[data-dlf]',function(b){P.toast('Facture '+b.getAttribute('data-dlf')+' téléchargée',{icon:'download'})});
    q('[data-allf]').onclick=function(){P.toast('14 factures Piaffe depuis septembre 2025',{icon:'invoice'})};q('[data-pm]').onclick=function(){P.toast('Un lien sécurisé vous a été envoyé pour changer de compte',{icon:'bank'})};
    q('[data-stop]').onclick=function(){P.sheet({title:'Résilier l’abonnement',icon:'card',body:'<p style="font-size:14.5px;line-height:1.5">Vous pouvez partir quand vous voulez. Avant de résilier, Piaffe vous remet <b>toutes vos données</b> dans des fichiers Excel et un export comptable, et les garde 90 jours au cas où.</p><div class="note" style="margin-top:14px">'+ICON('phone','sm')+'<span>Un souci avec Piaffe ? Marion vous rappelle aujourd’hui.</span></div>',foot:'<button class="btn" data-call>Être rappelée</button><button class="btn danger" data-exp>Exporter mes données d’abord</button>'});var sh=sheet();sh.querySelector('[data-call]').onclick=function(){sh.close();P.toast('Marion vous rappelle avant 12 h')};sh.querySelector('[data-exp]').onclick=function(){sh.close();exportSheet()}};
    on(el,'[data-expall],[data-expall2]',function(){exportSheet()});
    q('[data-plan]').onclick=function(){var PL=[['Essentiel','59','Jusqu’à 20 boxes','Planning, adhérents, facturation, application adhérent'],['Écurie','149','Jusqu’à 60 boxes','Tous les modules, l’assistant, le serveur MCP, 8 caméras'],['Réseau','289','Plusieurs sites','Tout Écurie, multi-sites, API sans limite, accompagnement dédié']],cur=1;
      P.sheet({title:'Changer de formule',icon:'card',wide:true,body:'<div class="g3" style="--g:10px">'+PL.map(function(p,i){return '<button class="pfr-plan" data-pl="'+i+'" aria-pressed="'+(i===cur)+'"><div class="hrow sp"><b>'+p[0]+'</b>'+(i===1?'<span class="chip acc">Actuelle</span>':'')+'</div><div class="pr num">'+p[1]+' € <small>HT par mois</small></div><div class="s b">'+p[2]+'</div><div class="s mut">'+p[3]+'</div></button>'}).join('')+'</div><div class="card flat" style="margin-top:14px">'+row('Analyse vidéo des boxes par l’IA','Cheval couché, agitation, colique : 29 € par mois',U.tog(false))+row('Pack de 2 000 SMS','19 € par mois',U.tog(false))+'</div><div class="xs mut" style="margin-top:10px">Changement immédiat, au prorata. Sans engagement, sans commission sur vos encaissements.</div>',foot:'<button class="btn pri" data-ok disabled>Vous êtes déjà sur cette formule</button>'});
      var sh=sheet(),ok=sh.querySelector('[data-ok]');on(sh,'[data-pl]',function(b){cur=+b.getAttribute('data-pl');$$('[data-pl]',sh).forEach(function(x){x.setAttribute('aria-pressed',x===b)});ok.disabled=cur===1;ok.textContent=cur===1?'Vous êtes déjà sur cette formule':'Passer à la formule '+PL[cur][0]});ok.onclick=function(){sh.close();P.toast('Demande de passage à la formule '+PL[cur][0]+' enregistrée')}};
  }
  if(S==='prefs'){
    on(el,'[data-thm]',function(b){var v=b.getAttribute('data-thm'),r=document.documentElement;if(v==='auto'){r.removeAttribute('data-theme');P.store.set('theme',null)}else{r.setAttribute('data-theme',v);P.store.set('theme',v)}P.toast(v==='auto'?'Le thème suit maintenant votre appareil':v==='dark'?'Thème sombre activé':'Thème clair activé',{icon:v==='dark'?'moon':'sun'})});
    on(el,'[data-hue]',function(b){var h=b.getAttribute('data-hue');P.prefs.set('me:hue',h);applyMe();$$('[data-hue]',el).forEach(function(x){x.setAttribute('aria-pressed',x===b)});P.toast('Teinte « '+b.title+' » appliquée, pour vous seule',{icon:'palette'})});
    on(el,'[data-den]',function(b){var v=b.getAttribute('data-den');P.prefs.set('me:density',v);applyMe();P.toast(v==='compact'?'Densité compacte : plus de lignes à l’écran':'Densité confortable rétablie',{icon:'sliders'})});
    q('#pfp-keys').addEventListener('click',function(){var t=this;setTimeout(function(){var v=t.getAttribute('aria-checked')==='true';P.prefs.set('me:keys',v);keep(P.rerender);P.toast(v?'Raccourcis à une touche activés. Touche ? pour la liste':'Raccourcis à une touche désactivés',{icon:'cmd'})},0)});
    q('[data-pvb]').onclick=function(){P.toast('Voilà votre teinte en action')};
  }
  if(S==='etab'){
    on(el,'[data-est]',function(b){var k=b.getAttribute('data-est'),e=EST.find(function(x){return x[0]===k});RG.est=k;keep(P.rerender);P.toast(k==='til'?'Retour à l’Écurie des Tilleuls':'Vous êtes dans le '+e[1]+', en '+e[3].toLowerCase(),{icon:'swap'})});
    on(el,'[data-me]',function(b){var k=b.getAttribute('data-me'),r=MYR.find(function(x){return x[0]===k});RG.me=k;keep(P.rerender);P.toast('Vous êtes maintenant '+r[1].toLowerCase()+' · '+r[2],{icon:r[4]})});
    on(el,'[data-demo]',function(b){P.go(b.getAttribute('data-demo')==='proprio'?'adh-cheval':'competitions')});
    q('[data-addest]').onclick=function(){P.sheet({title:'Rejoindre un établissement',icon:'plus',body:'<div class="stack" style="--g:14px"><p class="s mut">Entrez le code reçu de l’établissement. Vos accès restent séparés : chaque écurie ne voit que ce qui la concerne.</p><label class="field"><span>Code d’invitation</span><input class="in pf-mono" data-cd value="VALLEE-4821"></label></div>',foot:'<button class="btn pri" data-j>Rejoindre</button>'});var sh=sheet();sh.querySelector('[data-j]').onclick=function(){sh.close();P.toast('Demande envoyée au Haras de la Vallée, vous serez prévenue')}};
  }
  if(S==='aide'){
    on(el,'[data-help]',function(b){var k=b.getAttribute('data-help');if(k==='call')P.toast('Appel du support Piaffe en cours, Marion décroche',{icon:'phone'});else if(k==='visio'){if(X.helpSheet)X.helpSheet();else P.go('import',{do:'help'})}else{P.sheet({title:'Écrire au support',icon:'chat',body:'<div class="stack" style="--g:14px"><label class="field"><span>Votre question</span><textarea class="in" rows="4" data-qm>Comment facturer une demi-pension partagée entre deux familles ?</textarea></label><div class="note">'+ICON('clock','sm')+'<span>Réponse en 12 minutes en moyenne, par une ancienne gérante d’écurie.</span></div></div>',foot:'<button class="btn pri" data-sd>'+ICON('send','sm')+'Envoyer</button>'});var sh=sheet();sh.querySelector('[data-sd]').onclick=function(){sh.close();P.toast('Message envoyé au support, réponse sous 12 minutes en moyenne',{icon:'send'})}}});
    on(el,'[data-tut]',function(b){tutSheet(+b.getAttribute('data-tut'))});
    q('[data-fq]').oninput=function(){var v=X.norm(this.value.trim()),n=0;$$('.pfp-faq',el).forEach(function(d){var ok=!v||X.norm(d.textContent).indexOf(v)>=0;d.style.display=ok?'':'none';if(ok)n++;if(v&&ok)d.open=true});q('[data-fqn]').style.display=n?'none':''};
  }
  if(S==='tarifs'){
    q('#pfr-auto').addEventListener('click',function(){var t=this;setTimeout(function(){AGE.auto=t.getAttribute('aria-checked')==='true';P.toast(AGE.auto?'La tranche d’âge s’applique toute seule':'Tranche d’âge à choisir à la main')},0)});
    on(el,'[data-ex]',function(b){AGE.ext=Math.max(0,Math.min(50,AGE.ext+ +b.getAttribute('data-ex')));keep(P.rerender);P.toast('Non-adhérents : +'+AGE.ext+' % sur toute la grille')});
    on(el,'[data-age]',function(b){var k=b.getAttribute('data-age').split(':'),r=AGE.rows[+k[0]],j=+k[1];P.sheet({title:r[0]+' · '+AGE.cols[j],icon:'tag',body:'<div class="stack" style="--g:14px"><div class="s mut">'+r[1]+'</div><label class="field"><span>Prix adhérent TTC, en euros</span><input class="in num" data-pa inputmode="decimal" value="'+r[2][j]+'"></label><div class="note" data-pn></div></div>',foot:'<button class="btn pri" data-ok>Enregistrer</button>'});var sh=sheet(),inp=sh.querySelector('[data-pa]');function upd(){var v=parseFloat(String(inp.value).replace(',','.'))||0;sh.querySelector('[data-pn]').innerHTML=ICON('info','sm')+'<span>Non-adhérent : <b>'+F.eur(extP(v))+'</b> (+'+AGE.ext+' %)</span>';return v}upd();inp.oninput=upd;sh.querySelector('[data-ok]').onclick=function(){r[2][j]=upd();sh.close();keep(P.rerender);P.toast(r[0]+' : '+AGE.cols[j].toLowerCase()+' à '+F.eur(r[2][j]))}});
  }
  if(ctx.params.do){var d=ctx.params.do;delete ctx.params.do;setTimeout(function(){var b=el.querySelector('[data-'+d+']');if(b)b.click()},80)}
}
P.mod({id:'reglages',role:'gerant',group:'Plateforme',title:'Réglages',icon:'settings',n:40,phoneTitle:'Réglages',short:'Réglages',render:renderSet});

/* =====================================================================
   Palette de commandes et visite guidée
   ===================================================================== */
[['Poser une question à l’assistant','assistant',function(){P.go('assistant',{tab:'chat'})}],
 ['Dicter une demande à l’assistant','mic',function(){P.go('assistant',{tab:'chat',do:'voice'})}],
 ['Créer une automatisation','repeat',function(){P.go('assistant',{tab:'auto',do:'newauto'})}],
 ['Voir le journal des actions de l’IA','shield',function(){P.go('assistant',{tab:'journal'})}],
 ['Connecter Claude ou ChatGPT à l’écurie','mcp',function(){P.go('connecteurs',{tab:'mcp',do:'connect'})}],
 ['Copier l’adresse du serveur MCP','copy',function(){X.clip('https://mcp.piaffe.fr/mcp','Adresse du serveur MCP copiée')}],
 ['Chercher un connecteur','plug',function(){P.go('connecteurs',{tab:'cat'})}],
 ['Créer une clé API','key',function(){P.go('connecteurs',{tab:'api',do:'key'})}],
 ['Ajouter un webhook','webhook',function(){P.go('connecteurs',{tab:'api',do:'hook'})}],
 ['Importer un fichier Excel ou CSV','import',function(){P.go('import')}],
 ['Lire une photo de tableau papier','image',function(){P.go('import',{do:'photo'})}],
 ['Réserver un appel d’accompagnement','phone',function(){P.go('import',{do:'help'})}],
 ['Activer ou masquer des modules','grid',function(){P.go('reglages',{sec:'modules'})}],
 ['Gérer les rôles et les permissions','shield',function(){P.go('reglages',{sec:'roles'})}],
 ['Inviter une personne dans l’équipe','mail',function(){P.go('reglages',{sec:'roles',do:'invite'})}],
 ['Modifier les tarifs et les forfaits','tag',function(){P.go('reglages',{sec:'tarifs'})}],
 ['Régler les règles d’annulation','calendar_add',function(){P.go('reglages',{sec:'resa'})}],
 ['Exporter les données d’un adhérent (RGPD)','download',function(){P.go('reglages',{sec:'secu'})}],
 ['Voir mon abonnement Piaffe','card',function(){P.go('reglages',{sec:'abo'})}]
].forEach(function(a){P.actions.push({role:'gerant',label:a[0],icon:a[1],run:a[2]})});
P.suggestions.gerant=['Qui n’a pas payé ce mois-ci ?','Quels chevaux travaillent trop ?','Prépare le planning de samedi','Où en sont les stocks ?','Chaque lundi, envoie-moi le point sur les impayés'];
P.tourSteps.push({route:'connecteurs',params:{tab:'mcp'},title:'Toute l’écurie branchée sur votre IA',text:'Une adresse à coller dans Claude ou ChatGPT, et l’assistant interroge les chevaux, les reprises et les factures avec vos droits. Il lit par défaut, et chaque écriture attend votre accord dans Piaffe.'});
P.tourSteps.push({route:'import',title:'Arriver sans rien ressaisir',text:'Glissez vos exports Kavalog, Equimondo ou Excel. L’IA reconnaît les colonnes, repère les doublons et montre un essai à blanc. 148 adhérents, '+D.horses.length+' chevaux et 1 240 factures sont repris en moins d’une minute.'});
/* L'assistant flottant répond comme la page Assistant : les intentions précises passent avant les réponses des autres modules. */
P.brain.unshift({role:'gerant',re:/./,reply:function(t){var INT=P.pf.INT;for(var i=0;i<INT.length;i++){if(INT[i].id!=='cheval'&&INT[i].re.test(t)){var r=INT[i].fn(t);if(r)return {text:r.text,card:r.card,actions:(r.actions||[]).map(function(a){return {label:a.label,run:a.run}})}}}return null}});


/* ---------- Préférences personnelles appliquées partout : teinte et densité ---------- */
P.css(`
:root[data-hue]{--acc:var(--hue);--acc-2:color-mix(in srgb,var(--hue) 84%,var(--ink));--acc-pale:color-mix(in srgb,var(--hue) 13%,var(--surface));--acc-line:color-mix(in srgb,var(--hue) 38%,var(--surface));--info:var(--hue);--info-pale:color-mix(in srgb,var(--hue) 13%,var(--surface));--ring:0 0 0 3px color-mix(in srgb,var(--hue) 30%,transparent)}
:root[data-hue="lagon"]{--hue:color-mix(in srgb,var(--c3) 74%,var(--ink))}
:root[data-hue="prairie"]{--hue:color-mix(in srgb,var(--c7) 86%,var(--ink))}
:root[data-hue="iris"]{--hue:color-mix(in srgb,var(--c5) 88%,var(--ink))}
:root[data-hue="bruyere"]{--hue:color-mix(in srgb,var(--c6) 84%,var(--ink))}
:root[data-hue="ambre"]{--hue:color-mix(in srgb,var(--c4) 66%,var(--ink))}
:root[data-density="compact"] .app .ch{padding:10px 14px 0}
:root[data-density="compact"] .app .cb{padding:10px 14px 12px}
:root[data-density="compact"] .app .li{padding-top:7px;padding-bottom:7px}
:root[data-density="compact"] .app .tbl td{padding:6px 12px}
:root[data-density="compact"] .app .tbl th{padding:7px 12px}
:root[data-density="compact"] .app .card.pad{padding:14px}
:root[data-density="compact"] .app .pfr-r{min-height:46px;padding-top:8px;padding-bottom:8px}
:root[data-density="compact"] .app .ph{margin-bottom:14px}
`);
function applyMe(){var r=document.documentElement,h=P.prefs.get('me:hue','saphir'),d=P.prefs.get('me:density','comfort');if(h&&h!=='saphir')r.setAttribute('data-hue',h);else r.removeAttribute('data-hue');if(d==='compact')r.setAttribute('data-density','compact');else r.removeAttribute('data-density')}
applyMe();

/* ---------- Raccourcis à une touche (G puis une lettre, /, ?, N) ---------- */
(function(){var pend=0,GO={c:'cockpit',p:'planning',h:'chevaux',a:'adherents',f:'facturation',r:'reglages'};
  document.addEventListener('keydown',function(e){if(e.metaKey||e.ctrlKey||e.altKey||e.defaultPrevented)return;var t=e.target;if(t&&(t.isContentEditable||/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)))return;if(!P.prefs.get('me:keys',true))return;if(!document.querySelector('.app'))return;
    var k=(e.key||'').toLowerCase();
    if(pend&&Date.now()-pend<1300){pend=0;var r=GO[k];if(r&&P.state.role==='gerant'&&P.mods[r]){e.preventDefault();P.go(r)}return}
    if(k==='g'){pend=Date.now();return}
    if(e.key==='?'){e.preventDefault();keysSheet();return}
    if(k==='/'){e.preventDefault();P.palette();return}
    if(k==='n'&&!document.querySelector('.sheet')){e.preventDefault();if(!document.querySelector('.aip'))P.assistant();return}})})();

/* ---------- Palette : les nouvelles entrées ---------- */
[['Rejouer l’arrivée d’un nouveau club','onboarding',function(){P.go('import',{do:'new'})}],
 ['Mes préférences : thème, teinte, densité','sliders',function(){P.go('reglages',{sec:'prefs'})}],
 ['Voir les raccourcis clavier','cmd',function(){keysSheet()}],
 ['Changer d’établissement ou de rôle','swap',function(){P.go('reglages',{sec:'etab'})}],
 ['Exporter toutes mes données','download',function(){P.go('reglages',{sec:'abo',do:'expall'})}],
 ['Ouvrir l’aide et les tutoriels','info',function(){P.go('reglages',{sec:'aide'})}],
 ['Régler les prix par tranche d’âge','tag',function(){P.go('reglages',{sec:'tarifs'})}]
].forEach(function(a){P.actions.push({role:'gerant',label:a[0],icon:a[1],run:a[2]})});
/* Visite guidée : une histoire dans l'ordre. Le matin du gérant, les moments phares, puis le terrain, l'adhérent et le coach.
   Les étapes des vues employé et adhérent s'affichent dans le cadre du téléphone, comme dans la vraie vie, puis l'appareil d'origine revient. */
(function(){var ORDER=['cockpit','cheval','ecurie3d','planning','facturation','contrats','competitions','connecteurs','import','emp-tournee','adh-cheval','coach-agenda'];
  function rank(s){var k=ORDER.indexOf(s.route);return k<0?ORDER.length:k}
  function sort(){var a=P.tourSteps.map(function(s,i){return {s:s,i:i}}).sort(function(x,y){return rank(x.s)-rank(y.s)||x.i-y.i});for(var i=0;i<a.length;i++)P.tourSteps[i]=a[i].s}
  function setDev(d){if(P.state.dev===d)return;var b=document.querySelector('.dbar [data-dev="'+d+'"]');if(b)b.click()}
  sort();var t0=P.tour;P.tour=function(){sort();if(document.querySelector('body>.tour'))return;var dev0=P.state.dev,g0=P.go,on=true;
    P.go=function(route){if(on&&document.querySelector('body>.tour')){var m=P.mods[route];setDev(m&&(m.role==='employe'||m.role==='adherent')?'phone':dev0)}return g0.apply(this,arguments)};
    var r=t0.apply(this,arguments),box=document.querySelector('body>.tour');
    function end(){if(!on)return;on=false;if(P.go!==g0)P.go=g0;setDev(dev0)}
    if(!box){end();return r}
    var mo=new MutationObserver(function(){if(!box.isConnected){mo.disconnect();end()}});mo.observe(document.body,{childList:true});return r}})();
P.css('.tour .eyebrow{color:color-mix(in srgb,var(--navy-ink) 58%,var(--acc))!important}');
})();
