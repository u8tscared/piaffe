/* Vue gérant · Aujourd'hui, direction Paddock : grille bento de tuiles teintées par domaine.
   Tous les chiffres viennent de D : chevaux, adhérents, factures, reprises, tâches, stocks, météo, réservations de pistes, faits partagés.
   Les puces de domaine réordonnent les tuiles (propriété CSS order + animation FLIP, sans rejouer les illustrations). */
(function(){
var D=P.D,F=P.fmt,U=P.ui,E=F.esc;
/* prénom de la personne connectée (Claire dans la démo, la vraie gérante dans un club réel) */
function gFirst(){var id=D.me&&D.me.gerant,p=id&&(D.staffer(id)||D.person(id));return (p&&p.first)||(window.PL&&PL.user&&PL.user.first)||''}

/* ---------- Cohérence : le hersage du jour suit D.facts (13 h 30), pas l'ancienne tâche de 11 h 30 ---------- */
(function(){var hz=D.facts&&D.facts.hersage;if(!hz)return;var ar=(D.club.arenas.find(function(a){return a.id===hz.arena})||{}).name;
  (D.tasks||[]).forEach(function(t){if(/^Herser/.test(t.title)&&(!ar||t.zone===ar))t.time=hz.at})})();

/* ---------- Outils ---------- */
var NB='\u00a0';
function hm(s){if(!/^\d\d:\d\d$/.test(s||''))return s||'';var h=+s.slice(0,2),m=s.slice(3);return h+NB+'h'+(m==='00'?'':NB+m)}
function hmm(m){var h=Math.floor(m/60),x=m%60;return h+NB+'h'+(x?NB+(x<10?'0':'')+x:'')}
function mins(s){return /^\d\d:\d\d$/.test(s||'')?(+s.slice(0,2))*60+(+s.slice(3)):null}
var WORDS=['Aucun','Un','Deux','Trois','Quatre','Cinq','Six','Sept','Huit','Neuf','Dix'];
function word(n){return WORDS[n]||String(n)}
function cap(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function low(s){return s.charAt(0).toLowerCase()+s.slice(1)}
function de(name){return /^[AEIOUYÉÈHaeiouyéèh]/.test(name)?'d’'+name:'de '+name}
function pl(n,s,p){return n+NB+(n>1?(p||s+'s'):s)}
function arena(id){return D.club.arenas.find(function(a){return a.id===id})||{name:''}}
function pending(){return (D.declarations||[]).filter(function(x){return x.status==='en attente'})}
function nowMin(){return D.today.getHours()*60+D.today.getMinutes()}
function todayIso(){return D.iso(D.today)}
function where(h){return typeof D.horseWhere==='function'?D.horseWhere(h.id):'box'}
function lateInv(){return D.invoices.filter(function(i){return i.status==='en retard'})}
/* discipline d'une reprise : même règle que le planning */
function disc(t){if(/Baby|Poney/i.test(t))return 'po';if(/CSO|concours|Équipe/i.test(t))return 'mo';if(/Dressage|plat/i.test(t))return 'rd';if(/cross|Balade/i.test(t))return 'ex';if(/Horse-ball/i.test(t))return 'hb';
  if(/débutants|Galop 1|Galop 2(?!-3)/i.test(t)&&!/Galop [3-7]/.test(t))return 'hz';return 'tm'}
var DISCN={hz:'Initiation',tm:'Perfectionnement',mo:'CSO',rd:'Dressage',po:'Poney',ex:'Extérieur',hb:'Horse-ball',acc:'Coaching',wk:'Entretien'};

P.css(`
.ck-ph{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:14px 24px;margin:4px 0 24px}
.ck-eb{font:600 15px/1.3 var(--f-text);color:var(--mut)}
.ck-ph h1{font:800 52px/1 var(--f-display);letter-spacing:-.035em;margin-top:8px}
.ck-rt{display:flex;flex-direction:column;align-items:flex-end;gap:12px;min-width:0}
.ck-acts{display:flex;gap:10px}
.ck-chips{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.ck-chip{height:42px;padding:0 16px 0 13px;border-radius:999px;display:inline-flex;align-items:center;gap:8px;font:600 15px var(--f-text);color:var(--ink-2);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);white-space:nowrap;transition:background var(--t-2),color var(--t-2),box-shadow var(--t-2),transform .4s var(--e-spring)}
.ck-chip:hover{box-shadow:inset 0 0 0 1px var(--line-2)}
.ck-chip:active{transform:scale(.94)}
.ck-chip i{width:10px;height:10px;border-radius:50%;background:var(--d,var(--mut-2))}
.ck-chip svg.i{width:19px;height:19px}
.ck-chip[aria-pressed="true"]{background:var(--d-bg,var(--navy));color:var(--d-ink,var(--on-navy));box-shadow:none}
.ck-chip[aria-pressed="true"] i{background:currentColor}
.ck-chip.pop{animation:ck-pop .45s var(--e-spring)}
@keyframes ck-pop{40%{transform:scale(.9)}}

.ck-bento{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));grid-auto-rows:minmax(152px,auto);gap:16px;grid-auto-flow:dense;position:relative}
.ck-t{grid-column:span var(--c);grid-row:span var(--r);border-radius:28px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);position:relative;overflow:hidden;padding:22px 24px;display:flex;flex-direction:column;min-width:0;transition:opacity .45s,filter .45s,box-shadow var(--t-2),transform .4s var(--e-spring)}
.ck-t.pa{background:var(--d-bg);color:var(--d-ink);box-shadow:none}
.ck-t.go{cursor:pointer}
.ck-t.go:hover{transform:translateY(-3px);box-shadow:var(--shadow-2)}
.ck-t.go:active{transform:scale(.985)}
.ck-t.pa.go:hover{box-shadow:0 18px 40px -16px color-mix(in srgb,var(--d) 55%,transparent)}
.ck-t.dim{opacity:.42;filter:saturate(.4)}
.ck-t.dim:hover{opacity:.85;filter:none}
.ck-bento.on>.ck-t{animation:ck-rise .7s var(--e-out) both;animation-delay:calc(var(--i,0)*55ms)}
@keyframes ck-rise{from{opacity:0;transform:translateY(18px) scale(.985)}}
.ck-th{display:flex;align-items:center;gap:10px;min-height:36px;margin-bottom:12px}
.ck-th h3{font:700 19px/1.2 var(--f-display);letter-spacing:-.015em;flex:1;min-width:0}
.ck-th .ico{width:36px;height:36px;border-radius:12px}
.ck-cnt{min-width:30px;height:30px;padding:0 10px;border-radius:15px;display:grid;place-items:center;font:700 14.5px var(--f-text);background:var(--d-bg);color:var(--d-ink);font-variant-numeric:tabular-nums}
.ck-cnt.hot{background:var(--cr);color:#fff}
.ck-lbl{font:600 15px/1.3 var(--f-text);opacity:.88;position:relative;z-index:1}
.ck-big{font:800 60px/1 var(--f-display);letter-spacing:-.045em;margin-top:auto;font-variant-numeric:tabular-nums;display:flex;align-items:baseline;gap:6px;position:relative;z-index:1;white-space:nowrap}
.ck-big small{font:700 24px var(--f-display);letter-spacing:-.02em;opacity:.7}
.ck-sub{font:500 14.5px/1.35 var(--f-text);opacity:.82;margin-top:6px;position:relative;z-index:1}
.ck-kpi .ck-lbl{max-width:62%}
.ck-kpi .illu{position:absolute;right:-8px;top:-6px;width:118px;height:118px;pointer-events:none}
.ck-kpi.mo .ck-big{font-size:50px}
.ck-kpi.mo .illu{width:88px;height:88px;right:2px;top:8px}
.ck-ring{position:absolute;right:20px;top:20px;width:96px;height:96px}
.ck-ring .rg{animation:ck-ring 1.3s var(--e-out) .3s both}
@keyframes ck-ring{from{stroke-dashoffset:var(--C)}}

/* héros : résumé du matin */
.ck-hero{background:linear-gradient(150deg,var(--acc-bg) 0%,color-mix(in srgb,var(--acc-bg) 35%,var(--surface)) 55%,var(--surface) 100%);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--acc) 18%,var(--line))}
.ck-ast{display:inline-flex;align-items:center;gap:8px;height:36px;padding:0 14px 0 11px;border-radius:999px;background:var(--surface);color:var(--acc-deep);font:600 14.5px var(--f-text);box-shadow:var(--shadow-1);align-self:flex-start;position:relative;z-index:1}
.ck-ast svg.i{width:18px;height:18px}
.ck-hero h2{font:800 31px/1.1 var(--f-display);letter-spacing:-.03em;margin:16px 0 0;max-width:60%;color:var(--ink);position:relative;z-index:1}
.ck-hero>.illu{position:absolute;right:-6px;top:-8px;width:216px;height:216px;-webkit-mask-image:linear-gradient(to bottom,#000 62%,transparent 96%);mask-image:linear-gradient(to bottom,#000 62%,transparent 96%);pointer-events:none}
.ck-pts{display:grid;gap:4px;margin-top:22px;position:relative;z-index:1}
.ck-pts>*{animation:ck-pin .5s var(--e-out) both;animation-delay:calc(var(--j,0)*70ms + 260ms)}
@keyframes ck-pin{from{opacity:0;transform:translateX(-10px)}}
.ck-pt{display:grid;grid-template-columns:34px minmax(0,1fr);gap:12px;align-items:start;padding:10px 10px 10px 6px;border-radius:16px;font:400 15.5px/1.45 var(--f-text);color:var(--ink-2);text-align:left;width:100%;transition:background var(--t-2)}
button.ck-pt:hover{background:color-mix(in srgb,var(--surface) 70%,transparent)}
.ck-pt b{color:var(--ink);font-weight:650}
.ck-pt .ico{width:34px;height:34px;border-radius:11px}
.ck-pt .ico svg.i{width:19px;height:19px}
.ck-pt.ok{color:var(--mut)}
.ck-pt.ok .ico{--d-bg:var(--hz-bg);--d-ink:var(--hz-ink)}
.ck-hacts{display:flex;gap:10px;margin-top:auto;padding-top:18px;flex-wrap:wrap;position:relative;z-index:1}
.ck-hacts .btn.done{background:var(--hz-bg);color:var(--hz-ink);box-shadow:none}

/* reprises du jour */
.ck-tl{display:flex;flex-direction:column;margin:0 -12px}
.ck-tr{display:grid;grid-template-columns:62px 6px minmax(0,1fr) auto;gap:12px;align-items:center;padding:9px 12px;border-radius:16px;text-align:left;width:100%;transition:background var(--t-2),transform .35s var(--e-spring)}
.ck-tr:hover{background:var(--surface-2)}
.ck-tr:active{transform:scale(.985)}
.ck-tr.past{opacity:.55}
.ck-tr .tm{font:700 16px/1.1 var(--f-display);font-variant-numeric:tabular-nums;white-space:nowrap}
.ck-tr .tm small{display:block;font:500 13px var(--f-text);color:var(--mut);margin-top:3px}
.ck-tr .bar{display:block;width:6px;align-self:stretch;border-radius:3px;background:var(--d)}
.ck-tr .tt{display:block;font:650 16px/1.25 var(--f-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ck-tr .tm2{display:block;font:400 14px/1.3 var(--f-text);color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.ck-fill{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 11px;border-radius:999px;background:var(--d-bg);color:var(--d-ink);font:700 14px var(--f-text);font-variant-numeric:tabular-nums;white-space:nowrap}
.ck-fill.full::after{content:'';width:7px;height:7px;border-radius:50%;background:currentColor}
.ck-nowl{display:flex;align-items:center;gap:10px;margin:2px 12px;font:700 13px var(--f-text);color:var(--cr);font-variant-numeric:tabular-nums}
.ck-nowl::before{content:'';width:10px;height:10px;border-radius:50%;background:var(--cr);animation:ck-pc 2.2s infinite}
.ck-nowl::after{content:'';flex:1;height:2px;background:var(--cr);border-radius:1px;opacity:.6}
@keyframes ck-pc{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--cr) 55%,transparent)}100%{box-shadow:0 0 0 9px transparent}}
.ck-occ{margin-top:auto;padding-top:14px;border-top:1px solid var(--line)}
.ck-occ h4{font:600 14px var(--f-text);color:var(--mut);margin:0 0 8px;display:flex;justify-content:space-between;gap:10px}
.ck-day{display:grid;grid-template-columns:auto minmax(0,1fr);column-gap:12px}
.ck-dl{display:grid;grid-auto-rows:18px;row-gap:7px;padding-top:20px;font-size:13px;color:var(--mut);white-space:nowrap}
.ck-dl span{line-height:18px}
.ck-dt{position:relative;display:grid;grid-auto-rows:18px;row-gap:7px;padding-top:20px}
.ck-ax{position:absolute;left:0;right:0;top:0;height:16px;font-size:13px;color:var(--mut-2);font-variant-numeric:tabular-nums}
.ck-ax span{position:absolute;translate:-50% 0;line-height:16px}
.ck-ax span:first-child{translate:0 0}.ck-ax span:last-child{translate:-100% 0}
.ck-trk{position:relative;border-radius:6px;background:var(--surface-2);overflow:hidden}
.ck-trk i{position:absolute;top:2px;bottom:2px;border-radius:4px;background:var(--c);transform-origin:left center;animation:ck-grow .7s var(--e-out) both;animation-delay:calc(var(--k)*45ms + 250ms)}
.ck-trk i.past{opacity:.38}
@keyframes ck-grow{from{transform:scaleX(0)}}
.ck-now{position:absolute;top:14px;bottom:-4px;width:2px;margin-left:-1px;background:var(--cr);border-radius:1px;pointer-events:none}
.ck-now::before{content:'';position:absolute;left:50%;top:0;width:8px;height:8px;margin:-4px 0 0 -4px;border-radius:50%;background:var(--cr)}
.ck-also{display:flex;gap:10px;align-items:flex-start;font-size:14px;line-height:1.45;color:var(--mut);margin-top:12px}
.ck-also svg.i{flex:none;width:19px;height:19px;margin-top:1px}
.ck-also b{color:var(--ink-2);font-weight:600}
.ck-leg{display:flex;gap:14px;flex-wrap:wrap;margin-top:10px;font:500 13.5px var(--f-text);color:var(--mut)}
.ck-leg span{display:inline-flex;align-items:center;gap:6px}
.ck-leg i{width:10px;height:10px;border-radius:3px;background:var(--c)}

/* écurie en direct */
.ck-live{display:inline-flex;align-items:center;gap:7px;height:30px;padding:0 12px;border-radius:999px;background:var(--hz-bg);color:var(--hz-ink);font:600 13.5px var(--f-text);white-space:nowrap}
.ck-live i{width:8px;height:8px;border-radius:50%;background:var(--hz);animation:ck-ph 2s infinite}
@keyframes ck-ph{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--hz) 55%,transparent)}100%{box-shadow:0 0 0 9px transparent}}
.ck-est{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px 8px;margin-bottom:14px}
.ck-est div{display:flex;flex-direction:column;gap:3px}
.ck-est b{font:800 30px/1 var(--f-display);letter-spacing:-.03em;font-variant-numeric:tabular-nums}
.ck-est span{font:500 13px/1.2 var(--f-text);color:var(--mut);display:flex;align-items:center;gap:6px;white-space:nowrap}
.ck-est span i{width:9px;height:9px;border-radius:3px;background:var(--k);flex:none}
.ck-boxes{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:6px}
.ck-bx{aspect-ratio:1;border-radius:8px;background:var(--k);position:relative;transition:transform .35s var(--e-spring);animation:ck-bxin .5s var(--e-spring) both;animation-delay:calc(var(--i)*12ms + 200ms);cursor:pointer}
.ck-bx:hover{transform:scale(1.25);z-index:2}
.ck-bx.free{background:transparent;box-shadow:inset 0 0 0 2px var(--line-2)}
.ck-bx.soin::after{content:'';position:absolute;inset:30%;border-radius:50%;background:#fff;opacity:.92}
@keyframes ck-bxin{from{transform:scale(0)}}
.ck-sk{display:flex;flex-direction:column;gap:2px;margin:14px -8px 12px}
.ck-sk>span{padding:0 8px 4px}
.ck-sk button{display:flex;align-items:center;gap:10px;padding:6px 8px;border-radius:12px;font:500 14.5px var(--f-text);text-align:left;transition:background var(--t-2)}
.ck-sk button:hover{background:var(--surface-2)}
.ck-sk .av.horse{width:28px;height:28px}
.ck-sf{display:flex;align-items:center;gap:8px;margin-top:auto;padding-top:12px;border-top:1px solid var(--line);font:500 14px var(--f-text);color:var(--mut)}
.ck-sf b{color:var(--ink-2);font-weight:600}
.ck-tip{position:absolute;z-index:20;padding:8px 12px;border-radius:12px;background:var(--navy);color:var(--on-navy);font:600 14px/1.35 var(--f-text);pointer-events:none;white-space:nowrap;box-shadow:var(--shadow-2);opacity:0;transform:translate(-50%,-100%) translateY(-6px);transition:opacity .15s}
.ck-tip.on{opacity:1}
.ck-tip small{display:block;font:500 13px var(--f-text);opacity:.78}

/* à traiter */
.ck-todo{display:flex;flex-direction:column;gap:2px;margin:0 -10px}
.ck-td{display:grid;grid-template-columns:30px minmax(0,1fr) auto;gap:10px;align-items:start;padding:9px 10px;border-radius:16px;text-align:left;width:100%;transition:background var(--t-2),opacity .4s}
.ck-td:hover{background:color-mix(in srgb,var(--cr) 9%,transparent)}
.ck-ck{width:28px;height:28px;border-radius:50%;box-shadow:inset 0 0 0 2px color-mix(in srgb,var(--cr-ink) 38%,transparent);display:grid;place-items:center;color:transparent;transition:background var(--t-2),box-shadow var(--t-2),transform .45s var(--e-spring)}
.ck-ck svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.6;stroke-linecap:round;stroke-linejoin:round;stroke-dasharray:24;stroke-dashoffset:24;transition:stroke-dashoffset .35s .05s var(--e-out)}
.ck-td.on .ck-ck{background:var(--hz);box-shadow:none;color:#fff;transform:scale(1.08)}
.ck-td.on .ck-ck svg{stroke-dashoffset:0}
.ck-td .tx{display:block;font:600 15.5px/1.3 var(--f-text)}
.ck-td .mt{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;font:400 14px/1.3 var(--f-text);color:var(--mut);margin-top:2px;overflow:hidden}
.ck-td .mt .u{color:var(--cr);font-weight:700}
.ck-td.on .tx{text-decoration:line-through;text-decoration-thickness:2px;opacity:.55}
.ck-td.on .mt{opacity:.5}
.ck-td .av.horse{width:30px;height:30px}
.ck-td .chip{margin-top:1px}
.ck-sep{height:1px;background:var(--line);margin:6px 10px}

/* équipe */
.ck-team{display:flex;align-items:center;margin-top:auto;padding-top:10px}
.ck-tmr{display:grid;gap:6px;margin-top:14px}
.ck-tmr div{display:grid;grid-template-columns:28px minmax(0,1fr);column-gap:8px;align-items:baseline}
.ck-tmr b{font:800 22px/1 var(--f-display);grid-row:span 2}
.ck-tmr span{font:600 14px/1.3 var(--f-text)}
.ck-tmr em{font:400 13.5px/1.3 var(--f-text);font-style:normal;opacity:.78;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ck-team .av{box-shadow:0 0 0 3px var(--d-bg);margin-left:-8px;width:38px;height:38px;font-size:13px;transition:transform .35s var(--e-spring)}
.ck-team .av:first-child{margin-left:0}
.ck-team .av:hover{transform:translateY(-4px);z-index:1}

/* foin et météo */
.ck-hay .illu{position:absolute;right:-4px;top:4px;width:104px;height:86px;pointer-events:none}
.ck-hay .ck-lbl{max-width:56%}
.ck-hay .ck-big{font-size:52px}
.ck-hay .btn{margin-top:12px;align-self:flex-start;max-width:100%}
.ck-hay .ck-done{display:inline-flex;align-items:center;gap:6px;margin-top:12px;font:700 14px var(--f-text)}
.ck-wxh{display:flex;align-items:center;gap:12px}
.ck-wxh .ck-big{font-size:40px;margin:0}
.ck-wxh svg.i{width:26px;height:26px}
.ck-wxn{display:flex;align-items:flex-start;gap:8px;margin-top:auto;padding:8px 10px;border-radius:12px;background:color-mix(in srgb,var(--surface) 55%,transparent);font:500 14px/1.35 var(--f-text)}
.ck-wxn svg.i{flex:none;width:18px;height:18px;margin-top:1px}
.ck-wx{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:4px;padding-top:10px}
.ck-wx div{display:flex;flex-direction:column;align-items:center;gap:2px;padding:5px 0 4px;border-radius:12px;font:600 13px var(--f-text)}
.ck-wx div.hl{background:color-mix(in srgb,var(--tm) 22%,transparent)}
.ck-wx svg.i{width:19px;height:19px}
.ck-wx b{font:700 15px var(--f-text)}
.ck-wx small{font:600 13px var(--f-text);opacity:.85}

/* à valider */
.ck-vl{display:flex;flex-direction:column;margin:0 -10px}
.ck-vf{display:flex;gap:8px;flex-wrap:wrap;margin-top:auto;padding-top:12px;border-top:1px solid var(--line)}
.ck-vr{display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:12px;align-items:center;padding:8px 10px;border-radius:16px;transition:background var(--t-2),opacity .35s,transform .35s var(--e-out)}
.ck-vr:hover{background:var(--surface-2)}
.ck-vr .lk{min-width:0;text-align:left;cursor:pointer}
.ck-vr .tx{display:block;font:600 15.5px/1.25 var(--f-text);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ck-vr .mt{display:block;font:400 14px/1.3 var(--f-text);color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
.ck-vr.out{opacity:0;transform:translateX(20px)}
.ck-ok{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;flex:1;text-align:center;color:var(--mut);font:500 15px var(--f-text)}
.ck-ok svg.i{width:46px;height:46px;color:var(--hz)}

/* recettes */
.ck-rev{display:flex;align-items:flex-end;gap:14px 24px;flex-wrap:wrap}
.ck-rev .ck-big{font-size:52px;margin:0}
.ck-dl2{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 12px;border-radius:999px;background:var(--hz-bg);color:var(--hz-ink);font:700 14px var(--f-text);margin-bottom:6px;white-space:nowrap}
.ck-dl2.neg{background:var(--cr-bg);color:var(--cr-ink)}
.ck-dl2.mo{background:var(--mo-bg);color:var(--mo-ink)}
.ck-bars{display:grid;grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:8px;align-items:end;height:190px;margin-top:16px}
.ck-bars>div{display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end;position:relative}
.ck-bars i{display:block;width:100%;max-width:44px;border-radius:10px 10px 6px 6px;background:color-mix(in srgb,var(--mo) 38%,transparent);height:var(--h);transform-origin:bottom;animation:ck-gy .9s var(--e-out) both;animation-delay:calc(var(--i)*40ms + 200ms);position:relative;transition:background var(--t-2)}
.ck-bars>div:hover i{background:color-mix(in srgb,var(--mo) 65%,transparent)}
.ck-bars>div.cur i{background:var(--mo)}
.ck-bars i::after{content:'';position:absolute;left:-3px;right:-3px;bottom:var(--c);height:3px;border-radius:2px;background:var(--ink);opacity:.55}
.ck-bars span{font:600 13px var(--f-text);color:var(--mut);white-space:nowrap}
.ck-bars>div.cur span{color:var(--ink)}
.ck-bars em{font-style:normal;position:absolute;bottom:calc(var(--h) + 34px);left:50%;transform:translate(-50%,6px);padding:6px 10px;border-radius:10px;background:var(--navy);color:var(--on-navy);font:700 13px var(--f-text);white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .2s,transform .3s var(--e-spring);z-index:3}
.ck-bars>div:hover em{opacity:1;transform:translate(-50%,0)}
.ck-bars>div:first-child em{left:0;transform:translate(0,6px)}.ck-bars>div:first-child:hover em{transform:none}
.ck-bars>div:last-child em{left:auto;right:0;transform:translate(0,6px)}.ck-bars>div:last-child:hover em{transform:none}
@keyframes ck-gy{from{transform:scaleY(0)}}
.ck-lg{display:flex;gap:16px;font:500 13.5px var(--f-text);color:var(--mut);align-items:center;white-space:nowrap}
.ck-lg i{display:inline-block;width:12px;height:12px;border-radius:4px;background:var(--mo);margin-right:6px;vertical-align:-1px}
.ck-lg i.c{height:3px;border-radius:2px;background:var(--ink);opacity:.55;vertical-align:3px}
.ck-rh{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}
.ck-rh h3{font:700 19px/1.2 var(--f-display);letter-spacing:-.015em;flex:1;min-width:0;white-space:nowrap}

/* tablette : grille de 6 colonnes */
@container main (max-width:1120px){
 .ck-bento{grid-template-columns:repeat(6,minmax(0,1fr))}
 .ck-t{grid-column:span var(--tc,3)}
 .ck-ph{grid-template-columns:minmax(0,1fr)}
 .ck-rt{align-items:flex-start}
 .ck-chips{justify-content:flex-start}
}
/* téléphone : deux colonnes, hauteurs libres */
.app.mobile .ck-ph h1{display:none}
@container main (max-width:760px){
 .ck-ph{margin:0 0 16px;gap:12px}
 .ck-ph h1{font-size:38px}
 .ck-rt{width:100%;gap:12px}
 .ck-acts{order:2;width:100%}.ck-acts .btn{flex:1}
 .ck-chips{flex-wrap:nowrap;overflow-x:auto;margin:0 -16px;padding:2px 16px;width:calc(100% + 32px);scrollbar-width:none;justify-content:flex-start}
 .ck-chips::-webkit-scrollbar{display:none}
 .ck-bento{grid-template-columns:repeat(2,minmax(0,1fr));grid-auto-rows:auto;gap:12px}
 .ck-t{grid-column:span var(--mc,2);grid-row:auto;padding:18px;border-radius:24px}
 .ck-hero h2{font-size:25px;max-width:none;margin-right:104px}
 .ck-hero>.illu{width:150px;height:150px;right:-16px;top:-10px}
 .ck-pt{font-size:15px}
 .ck-kpi{min-height:168px}
 .ck-kpi .illu{width:64px;height:64px;right:-4px;top:-4px}
 .ck-kpi .ck-lbl{max-width:none;font-size:14px;padding-right:50px}
 .ck-kpi.mo .illu{width:60px;height:60px}
 .ck-big{font-size:44px;margin-top:14px}
 .ck-kpi.mo .ck-big{font-size:32px;margin-top:22px}
 .ck-big small{font-size:19px}
 .ck-sub{font-size:13.5px}
 .ck-ring{width:60px;height:60px;right:12px;top:12px}
 .ck-tr{grid-template-columns:56px 5px minmax(0,1fr) auto;gap:10px}
 .ck-hay .illu{width:92px;height:76px}
 .ck-hay .ck-big{font-size:40px}
 .ck-bars{height:150px;gap:5px}
 .ck-bars.many>div:nth-child(even):not(.cur) span{visibility:hidden}
 .ck-lg{flex-wrap:wrap;gap:6px 14px;white-space:normal}
 .ck-vr{align-items:start}.ck-vr .btn{margin-top:2px}
 .ck-vr .tx,.ck-vr .mt{white-space:normal;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2}
 .ck-rev .ck-big{font-size:40px}
 .ck-rh{gap:10px}.ck-rh .seg{width:100%}.ck-rh .seg button{flex:1}
 .ck-est b{font-size:26px}
}
`);

/* ---------- Tuiles : clé, libellé, domaine, tailles [colonnes sur 12, rangées, colonnes sur 6, colonnes sur 2] ---------- */
var TILES=[
 ['hero','Résumé du matin','acc',[6,3,6,2]],
 ['kRiders','Cavaliers en selle','rd',[3,1,3,1]],
 ['kFill','Remplissage de la semaine','acc',[3,1,3,1]],
 ['kHorses','Chevaux de club disponibles','hz',[3,1,3,1]],
 ['kMoney','À encaisser','mo',[3,1,3,1]],
 ['hay','Foin et litière','hz',[3,1,3,2]],
 ['wx','Météo et carrières','tm',[3,1,3,2]],
 ['today','Reprises du jour et pistes','rd',[6,3,6,2]],
 ['todo','À traiter','cr',[3,3,3,2]],
 ['stable','Écurie en direct','hz',[3,2,3,2]],
 ['team','Équipe du jour','tm',[3,1,6,2]],
 ['valid','À valider','rd',[6,2,6,2]],
 ['rev','Recettes et dépenses','mo',[6,2,6,2]]];
var TK=TILES.map(function(t){return t[0]});
var TD={};TILES.forEach(function(t){TD[t[0]]=t[2]});
var MOB=['hero','kRiders','kFill','kHorses','kMoney','todo','today','stable','valid','hay','wx','team','rev'];
var FOC=[['all','Tout'],['hz','Chevaux'],['rd','Cavaliers'],['mo','Argent'],['tm','Équipe'],['cr','Soins']];
var DAYN={Lun:['lundi',1],Mar:['mardi',2],Mer:['mercredi',3],Jeu:['jeudi',4],Ven:['vendredi',5],Sam:['samedi',6],Dim:['dimanche',0]};
var CHK='<svg viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
/* état de la session (survit aux allers-retours entre écrans) */
var S={focus:'all',hero:{},seen:false,fin:12};

/* ---------- Événements de la journée sur les pistes ---------- */
function dayEvents(){var ev=[],t=todayIso(),dow=D.today.getDay();
  D.lessons.filter(function(l){return l.dow===dow}).forEach(function(l){var s=mins(l.start);ev.push({k:'les',a:l.arena,s:s,e:s+l.dur,t:l.title,at:l.start})});
  var pc=D.coaches.find(function(c){return c.id==='c01'});
  ((D.facts&&D.facts.paulineToday)||[]).forEach(function(x){if(!x.arena)return;var s=mins(x.at);ev.push({k:'coach',a:x.arena,s:s,e:s+60,t:x.what+(pc?' ('+pc.first+' '+pc.last+')':''),at:x.at})});
  (D.trackBookings||[]).filter(function(b){return b.date===t}).forEach(function(b){var h=D.horse(b.horse);ev.push({k:'own',a:b.arena,s:mins(b.from),e:mins(b.to),t:'Piste réservée par '+D.name(b.who)+(h?' pour '+h.name:''),at:b.from,b:b})});
  var hz=D.facts&&D.facts.hersage;if(hz){var s=mins(hz.at);ev.push({k:'work',a:hz.arena,s:s,e:s+30,t:'Hersage de la '+low(arena(hz.arena).name),at:hz.at})}
  return ev.sort(function(a,b){return a.s-b.s})}
var EVC={les:['Reprises','var(--rd)'],coach:['Coach','var(--acc)'],own:['Propriétaires','var(--hb)'],work:['Entretien','var(--wk)']};
function dayStrip(mobile){var ev=dayEvents(),H0=8*60,H1=20*60,span=H1-H0,n=nowMin(),k=0;
  function pc(m){return Math.max(0,Math.min(100,(m-H0)/span*100))}
  var SHORT={a1:'Manège',a2:'Honneur',a3:'Petite',a4:'Rond'};
  var lab='<div class="ck-dl">'+D.club.arenas.map(function(a){return '<span title="'+E(a.name)+'">'+(mobile?SHORT[a.id]||a.name:E(a.name))+'</span>'}).join('')+'</div>';
  var ax='<div class="ck-ax">'+(mobile?[8,12,16,20]:[8,10,12,14,16,18,20]).map(function(h){return '<span style="left:'+pc(h*60)+'%">'+h+NB+'h</span>'}).join('')+'</div>';
  var tr=D.club.arenas.map(function(a){return '<div class="ck-trk">'+ev.filter(function(e){return e.a===a.id}).map(function(e){return '<i class="'+(e.e<=n?'past':'')+'" style="left:'+pc(e.s)+'%;width:calc('+(pc(e.e)-pc(e.s))+'% - 2px);--c:'+EVC[e.k][1]+';--k:'+(k++)+'" title="'+E(hm(e.at)+' · '+e.t)+'"></i>'}).join('')+'</div>'}).join('');
  return '<div class="ck-day" aria-label="Occupation des pistes aujourd’hui">'+lab+'<div class="ck-dt">'+ax+tr+'<span class="ck-now" style="left:'+pc(n)+'%" title="Maintenant, '+hmm(n)+'"></span></div></div>'+
    '<div class="ck-leg">'+Object.keys(EVC).filter(function(x){return ev.some(function(e){return e.k===x})}).map(function(x){return '<span><i style="--c:'+EVC[x][1]+'"></i>'+EVC[x][0]+'</span>'}).join('')+'</div>'}
/* phrase « Aussi aujourd'hui » : tout ce qui occupe les pistes en dehors des reprises */
function alsoTxt(){var ev=dayEvents().filter(function(e){return e.k!=='les'}),parts=[];
  ev.filter(function(e){return e.k==='work'}).forEach(function(e){parts.push('<b>'+E(e.t.toLowerCase())+'</b> à '+hm(e.at))});
  var ow=ev.filter(function(e){return e.k==='own'});
  if(ow.length)parts.push('<b>'+ow.length+' piste'+(ow.length>1?'s réservées':' réservée')+'</b> par des propriétaires ('+ow.map(function(e){return low(arena(e.a).name)+' à '+hm(e.at)}).join(', ')+')');
  if(!parts.length)return '';
  return 'Aussi aujourd’hui : '+(parts.length>1?parts.slice(0,-1).join(' ; ')+' ; '+parts[parts.length-1]:parts[0])+'.'}

/* ---------- Anneau de remplissage ---------- */
function ring(p,dom){var r=40,C=2*Math.PI*r;return '<svg class="ck-ring" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="'+r+'" fill="none" stroke="currentColor" stroke-width="11" opacity=".14"/><circle class="rg" cx="50" cy="50" r="'+r+'" fill="none" stroke="var(--'+dom+')" stroke-width="11" stroke-linecap="round" stroke-dasharray="'+C.toFixed(1)+'" style="--C:'+C.toFixed(1)+';stroke-dashoffset:'+(C*(1-p)).toFixed(1)+'" transform="rotate(-90 50 50)"/>'+'</svg>'}

/* ---------- FLIP ---------- */
function flipFirst(root){var m={};P.$$('[data-flip]',root).forEach(function(e){m[e.getAttribute('data-flip')]=e.getBoundingClientRect()});return m}
function flipPlay(root,m){if(P.RM)return;P.$$('[data-flip]',root).forEach(function(e){var a=m[e.getAttribute('data-flip')];if(!a)return;var b=e.getBoundingClientRect(),dx=a.left-b.left,dy=a.top-b.top;
  if(Math.abs(dx)<1&&Math.abs(dy)<1)return;e.animate([{transform:'translate('+dx+'px,'+dy+'px)'},{transform:'none'}],{duration:620,easing:'cubic-bezier(.2,.9,.25,1.05)'})})}

P.mod({id:'cockpit',role:'gerant',group:'Pilotage',n:1,title:'Aujourd’hui',icon:'today',phoneTitle:'Bonjour'+(gFirst()?' '+gFirst():''),
 badge:function(){var n=D.horses.filter(function(h){return h.status==='bad'}).length+pending().length;return n?{v:n,hot:true}:null},
 render:function(el,ctx){
  var on=P.prefs.get('cockpit:tiles',TK);on=on.filter(function(k){return TK.indexOf(k)>=0});
  var mob=ctx.mobile,dow=D.today.getDay(),tIso=todayIso(),nm=nowMin();
  var today=D.lessons.filter(function(l){return l.dow===dow}).sort(function(a,b){return mins(a.start)-mins(b.start)}),late=lateInv(),lateSum=late.reduce(function(a,i){return a+i.amount},0);
  var capW=D.lessons.reduce(function(a,l){return a+l.cap},0),ridW=D.lessons.reduce(function(a,l){return a+l.riders.length},0),waitW=D.lessons.reduce(function(a,l){return a+(l.wait||0)},0),fill=Math.round(ridW/capW*100);
  var riders=today.reduce(function(a,l){return a+l.riders.length},0),alerts=D.horses.filter(function(h){return h.status!=='ok'}),bad=D.horses.filter(function(h){return h.status==='bad'});
  var paul=((D.facts&&D.facts.paulineToday)||[]).filter(function(x){return x.arena});
  var careToday=D.care.filter(function(c){return c.date===tIso&&c.status!=='en cours'&&c.status!=='fait'});
  var decl=pending(),toSign=D.contracts.filter(function(c){return c.status==='à signer'});
  /* écurie */
  var nBox=D.club.boxes,used={};D.horses.forEach(function(h){if(h.box)used[h.box]=h});
  var free=[];for(var i=1;i<=nBox;i++){var bid='B'+(i<10?'0':'')+i;if(!used[bid])free.push(bid)}
  var occN=nBox-free.length,wh={box:0,pad:0,work:0,soin:0};D.horses.forEach(function(h){if(h.status==='bad')wh.soin++;else{var w=where(h);wh[w]=(wh[w]||0)+1}});
  var req=(D.boxRequests||[]).filter(function(r){return !r.done}).length;
  /* argent du jour */
  var inToday=D.bank.filter(function(b){return b.d===tIso&&b.amount>0}),inSum=inToday.reduce(function(a,b){return a+b.amount},0),
      inN=inToday.reduce(function(a,b){var m=/(\d+)\s+(mandats|opérations|paiements)/.exec(b.label);return a+(m?+m[1]:1)},0);
  var oldest=late.reduce(function(a,i){return Math.max(a,-F.days(i.due))},0);
  /* stocks */
  var shav=D.stock.filter(function(s){return s.daily>0&&s.qty<s.min}).sort(function(a,b){return a.qty/a.daily-b.qty/b.daily})[0];
  var hay=D.stock.find(function(s){return /^Foin/.test(s.name)})||D.stock[0];
  /* météo : jours de pluie et reprises en extérieur concernées */
  var rainy=D.weather.filter(function(w){return w.r>50&&DAYN[w.d]}),rainDow=rainy.map(function(w){return DAYN[w.d][1]});
  var outdoor=D.club.arenas.filter(function(a){return !/Couvert/.test(a.kind)}).map(function(a){return a.id});
  var moved=D.lessons.filter(function(l){return rainDow.indexOf(l.dow)>=0&&outdoor.indexOf(l.arena)>=0});
  var indoor=D.club.arenas.find(function(a){return /Couvert/.test(a.kind)})||{name:'manège'};
  var rd=rainy.map(function(w){return DAYN[w.d][0]}),rdTxt=rd.length>1?rd.slice(0,-1).join(', ')+' et '+rd[rd.length-1]:rd[0]||'';
  /* club : chevaux disponibles */
  var clubH=D.horses.filter(function(h){return h.kind==='club'}),offH=clubH.filter(function(h){return h.status==='bad'||(h.alerts||[]).some(function(a){return /repos/i.test(a)})});
  /* tâches à cocher : soins et entretien du jour encore ouverts */
  var tasks=(D.tasks||[]).filter(function(t){return t.kind!=='routine'});

  /* ---------- Contenu des tuiles ---------- */
  var T={};
  T.hero=function(){var pts=[];
    var vet=careToday.filter(function(c){return c.kind==='Vétérinaire'}).sort(function(a,b){return (mins(a.time)||0)-(mins(b.time)||0)})[0];
    if(vet){var vh=D.horse(vet.horse),prep=D.tasks.find(function(t){return t.title.indexOf(vh.name)>=0&&/^Préparer/.test(t.title)});
      pts.push(['cr','care','<b>'+E(vh.name)+'</b> '+(/Boiterie/i.test(vet.note)?'boite. ':'')+'Le '+E(vet.who)+' passe à '+hm(vet.time)+(prep?', '+E(D.staffer(prep.who).first)+' le prépare à '+hm(prep.time):'')+'.',null,'cheval',vh.id])}
    D.sensors.filter(function(s){return s.state!=='ok'&&/Abreuvoir B\d+/.test(s.name)}).forEach(function(s){var bx=/B\d+/.exec(s.name)[0],hx=D.horses.find(function(x){return x.box===bx});if(!hx)return;
      var pct=/(\d+)\s*%/.exec(s.note),watch=D.care.find(function(c){return c.horse===hx.id&&c.kind==='Surveillance'});
      pts.push(['cr','alert','<b>'+E(hx.name)+'</b> boit '+(pct?pct[1]+NB+'%':'nettement')+' de moins depuis hier soir.'+(watch?' '+E(watch.who)+' le surveille '+(/2 h/.test(watch.time)?'toutes les deux heures':E(watch.time.toLowerCase()))+'.':''),null,'cheval',hx.id])});
    if(moved.length)pts.push(['tm','rain','<b>'+cap(rdTxt)+', pluie.</b> '+(moved.length>1?moved.length+' reprises en carrière peuvent':'Une reprise en carrière peut')+' passer au '+low(indoor.name)+'.','wx']);
    if(late.length)pts.push(['mo','invoice','<b>'+pl(late.length,'facture')+' en retard</b> pour '+F.eur(lateSum)+'. Les relances sont prêtes.','rel']);
    if(shav)pts.push(['hz','stock','<b>'+E(shav.name.split(' ')[0])+'</b> : '+Math.floor(shav.qty/shav.daily)+' jours de stock. La commande de '+shav.min+' '+E(shav.unit)+' est prête.','cmd']);
    var DONE={wx:(moved.length>1?'<b>'+moved.length+' reprises basculées</b>':'<b>Reprise basculée</b>')+' au '+low(indoor.name)+'. Cavaliers prévenus.',rel:'<b>'+pl(late.length,'relance')+' envoyée'+(late.length>1?'s':'')+'</b> par e-mail et SMS, pour '+F.eur(lateSum)+'.',cmd:shav?'<b>Commande de '+shav.min+' '+E(shav.unit)+'</b> envoyée à '+E(shav.supplier)+', livraison jeudi.':''};
    var n=pts.filter(function(p){return !(p[3]&&S.hero[p[3]])}).length;
    var head=n?(bad.length>3?'Journée tendue. ':'Belle journée en vue. ')+(n>1?word(n)+' points méritent':'Un point mérite')+' votre œil.':'Tout est réglé. Belle journée au club.';
    var BT={wx:['swap','Basculer au '+low(indoor.name),'pri'],rel:['send','Envoyer les relances',''],cmd:['bag','Commander les '+(shav?low(shav.name.split(' ')[0]):''),'']};
    return ILLU.cheval({size:null})+'<span class="ck-ast">'+ICON('today','sm')+'Résumé du matin</span><h2>'+head+'</h2>'+
     '<div class="ck-pts">'+pts.slice(0,5).map(function(p,j){var ok=p[3]&&S.hero[p[3]];var tag=p[4]?'button':'div';
       return '<'+tag+' style="--j:'+j+'" class="ck-pt d-'+p[0]+(ok?' ok':'')+'"'+(p[4]?' data-go="'+p[4]+'" data-id="'+p[5]+'"':'')+'><span class="ico">'+ICON(ok?'check':p[1],'sm')+'</span><span>'+(ok?DONE[p[3]]:p[2])+'</span></'+tag+'>'}).join('')+'</div>'+
     '<div class="ck-hacts">'+['wx','rel','cmd'].filter(function(k){return pts.some(function(p){return p[3]===k})}).slice(0,2).map(function(k,i){var b=BT[k];return S.hero[k]?'<button class="btn sm done" disabled>'+ICON('check','sm')+(k==='wx'?'Reprises basculées':k==='rel'?'Relances envoyées':'Commande envoyée')+'</button>':'<button class="btn '+(i===0?'pri':'')+'" data-hero="'+k+'">'+ICON(b[0],'sm')+b[1]+'</button>'}).join('')+'</div>'};
  T.kRiders=function(){return ILLU.selle({size:null})+'<div class="ck-lbl">Cavaliers en selle aujourd’hui</div><div class="ck-big"><span data-count="'+riders+'">'+riders+'</span></div><div class="ck-sub">'+pl(today.length,'reprise')+(paul.length?' et '+pl(paul.length,'cours','cours')+' de Pauline':'')+' · '+D.members.length+' adhérents</div>'};
  T.kFill=function(){return ring(fill/100,'acc')+'<div class="ck-lbl">Remplissage de la semaine</div><div class="ck-big"><span data-count="'+fill+'">'+fill+'</span><small>%</small></div><div class="ck-sub">'+ridW+' cavaliers, '+waitW+' en liste d’attente</div>'};
  T.kHorses=function(){var av=clubH.length-offH.length;return ILLU.fer({size:null})+'<div class="ck-lbl">Chevaux de club disponibles</div><div class="ck-big"><span data-count="'+av+'">'+av+'</span><small>sur '+clubH.length+'</small></div><div class="ck-sub">'+(offH.length?offH.slice(0,2).map(function(h){return E(h.name)}).join(' et ')+(offH.length>2?' et '+(offH.length-2)+' autres':'')+' au repos':'Toute la cavalerie est au travail')+'</div>'};
  T.kMoney=function(){return ILLU.pieces({size:null})+'<div class="ck-lbl">À encaisser</div><div class="ck-big"><span data-count="'+lateSum+'" data-fmt="eur">'+F.eur(lateSum)+'</span></div><div class="ck-sub">'+pl(late.length,'facture')+' en retard'+(oldest>0?', la plus ancienne de '+oldest+' jours':'')+'</div>'};
  T.hay=function(){if(!hay)return ILLU.foin({size:null})+'<div class="ck-lbl">Foin</div><div class="ck-sub">Ajoutez votre stock de foin pour suivre ses jours d’autonomie.</div>';var d=Math.floor(hay.qty/hay.daily),sd=shav?Math.floor(shav.qty/shav.daily):0;return ILLU.foin({size:null})+'<div class="ck-lbl">'+E(hay.name)+'</div><div class="ck-big"><span data-count="'+d+'">'+d+'</span><small>jours</small></div><div class="ck-sub">'+hay.qty+' '+E(hay.unit)+', '+String(hay.daily).replace('.',',')+' par jour</div>'+
    (shav?(S.hero.cmd?'<span class="ck-done">'+ICON('check','sm')+'Copeaux commandés</span>':'<button class="btn sm tint" data-hero="cmd" title="'+E(shav.name)+' : '+sd+' jours de stock, commande de '+shav.min+' '+E(shav.unit)+'">'+ICON('bag','sm')+E(shav.name.split(' ')[0])+' : '+sd+NB+'j, commander</button>'):'')};
  T.wx=function(){var w0=D.weather[0];return '<div class="ck-wxh">'+ICON(w0.i)+'<div class="ck-big"><span data-count="'+w0.t+'">'+w0.t+'</span><small>°C</small></div><div class="ck-sub" style="margin:0;line-height:1.3">'+(w0.i==='sun'?'Ensoleillé':w0.i==='rain'?'Pluie':'Nuageux')+'<br>Pluie '+w0.r+NB+'%</div></div>'+
    '<div class="ck-wxn">'+(moved.length&&S.hero.wx?ICON('checkc','sm')+'<span><b>'+cap(rdTxt)+'</b> : reprises au '+low(indoor.name)+'</span>':moved.length?ICON('rain','sm')+'<span><b>'+cap(rdTxt)+'</b> : '+pl(moved.length,'reprise')+' en carrière</span>':ICON('checkc','sm')+'<span>Carrières praticables toute la semaine</span>')+'</div>'+
    '<div class="ck-wx">'+D.weather.slice(1,7).map(function(w){var hl=w.r>=60;return '<div class="'+(hl?'hl':'')+'" title="'+(DAYN[w.d]?cap(DAYN[w.d][0]):w.d)+' : '+w.t+'°, pluie '+w.r+NB+'%"><span>'+w.d+'</span>'+ICON(w.i)+'<b>'+w.t+'°</b>'+'</div>'}).join('')+'</div>'};
  T.today=function(){var also=alsoTxt(),nowDone=false,next=null;
    var rows=today.map(function(l){return {s:mins(l.start),dur:l.dur,t:l.title,who:D.staffer(l.coach),a:l.arena,n:l.riders.length,cap:l.cap,w:l.wait||0,id:l.id,d:disc(l.title)}});
    paul.forEach(function(x){var pc=D.coaches.find(function(c){return c.id==='c01'});rows.push({s:mins(x.at),dur:60,t:x.what.replace(/ et .*$/,''),who:pc,a:x.arena,n:/particulier/i.test(x.what)?1:4,cap:/particulier/i.test(x.what)?1:6,w:0,id:null,d:'acc',coach:true})});
    rows.sort(function(a,b){return a.s-b.s});
    var h='<div class="ck-th"><h3>Reprises du jour</h3><button class="btn ghost sm" data-go="planning">Planning'+ICON('arrow','sm')+'</button></div><div class="ck-tl">';
    rows.forEach(function(r){if(!nowDone&&r.s>=nm){nowDone=true;h+='<div class="ck-nowl">'+hmm(nm)+'</div>'}var full=r.cap&&r.n>=r.cap;if(!next&&r.s>=nm)next=r;
      h+='<button class="ck-tr d-'+r.d+(r.s+r.dur<=nm?' past':'')+'" data-go="planning"'+(r.id?' data-id="'+r.id+'"':'')+'><span class="tm">'+hmm(r.s)+'<small>'+r.dur+' min</small></span><span class="bar"></span><span style="min-width:0"><span class="tt">'+E(r.t)+'</span><span class="tm2">'+(r.who?E(r.who.first+' '+r.who.last):'')+' · '+E(arena(r.a).name)+'</span></span><span class="ck-fill'+(full?' full':'')+'">'+r.n+'/'+r.cap+(r.w?' +'+r.w:'')+'</span></button>'});
    h+='</div><div class="ck-occ"><h4><span>Occupation des pistes</span>'+(next?'<span>Prochaine à '+hmm(next.s)+'</span>':'')+'</h4>'+dayStrip(mob)+(also?'<div class="ck-also">'+ICON('clock','sm')+'<span>'+also+'</span></div>':'')+'</div>';
    return h};
  T.stable=function(){var K={pad:'var(--hz)',work:'var(--tm)',box:'color-mix(in srgb,var(--ink) 16%,transparent)',soin:'var(--cr)'};
    var bx='';for(var i=1;i<=nBox;i++){var id='B'+(i<10?'0':'')+i,h=used[id],w=h?(h.status==='bad'?'soin':where(h)):'';
      bx+='<span class="ck-bx'+(h?(w==='soin'?' soin':''):' free')+'" style="--k:'+(h?K[w]:'transparent')+';--i:'+i+'" data-box="'+id+'"'+(h?' data-h="'+h.id+'"':'')+'></span>'}
    return '<div class="ck-th"><h3 style="white-space:nowrap">Écurie en direct</h3><span class="ck-live"><i></i>'+hmm(nm)+'</span></div>'+
     '<div class="ck-est">'+[['pad','Paddock'],['work','Travail'],['box','Box'],['soin','Soins']].map(function(x){return '<div><b data-count="'+wh[x[0]]+'">'+wh[x[0]]+'</b><span><i style="--k:'+K[x[0]]+'"></i>'+x[1]+'</span></div>'}).join('')+'</div>'+
     '<div class="ck-boxes">'+bx+'</div>'+
     (function(){var sick=D.horses.filter(function(h){return h.status==='bad'&&h.box});return sick.length?'<div class="ck-sk"><span class="xs mut">En soins</span>'+sick.slice(0,3).map(function(h){return '<button data-go="cheval" data-id="'+h.id+'">'+U.hav(h)+'<b>'+E(h.name)+'</b><span class="mut">'+h.box+'</span></button>'}).join('')+'</div>':''})()+
     '<button class="ck-sf" data-go="ecurie3d"><span class="grow" style="text-align:left"><b>'+occN+'/'+nBox+' boxes</b> · '+(free.length?pl(free.length,'libre'):'complet')+(req?' · '+pl(req,'demande')+' de pension':'')+'</span>'+ICON('arrow','sm')+'</button>'};
  T.todo=function(){var nT=tasks.filter(function(t){return !t.done}).length,more=alerts.length-3;
    var h='<div class="ck-th"><span class="ico">'+ICON('care')+'</span><h3>À traiter</h3><span class="ck-cnt hot" data-todocnt>'+(nT+Math.min(alerts.length,3))+'</span></div><div class="ck-todo">';
    tasks.slice().sort(function(a,b){return (a.done?1:0)-(b.done?1:0)||(b.urgent?1:0)-(a.urgent?1:0)}).slice(0,4).forEach(function(t){var w=D.staffer(t.who);
      h+='<button class="ck-td'+(t.done?' on':'')+'" data-task="'+t.id+'" aria-pressed="'+!!t.done+'" data-flip="td-'+t.id+'"><span class="ck-ck">'+CHK+'</span><span style="min-width:0"><span class="tx">'+E(t.title.replace(/ \(colique\)/,''))+'</span><span class="mt">'+(t.urgent&&!t.done?'<span class="u">Urgent · </span>':'')+(mins(t.time)!=null?hm(t.time):E(t.time))+' · '+(w?E(w.first):'')+' · '+E(t.zone)+'</span></span><span></span></button>'});
    h+='<div class="ck-sep"></div>';
    alerts.slice(0,3).forEach(function(x){h+='<button class="ck-td" data-go="cheval" data-id="'+x.id+'">'+U.hav(x)+'<span style="min-width:0"><span class="tx">'+E(x.name)+' <span class="mut" style="font-weight:500">· '+x.box+'</span></span><span class="mt">'+E(x.alerts[0])+'</span></span>'+U.chip(x.status==='bad'?'Urgent':'À voir',x.status==='bad'?'bad':'warn')+'</button>'});
    if(more>0)h+='<button class="ck-td" data-go="chevaux"><span class="ico sm d-hz">'+ICON('horse','sm')+'</span><span style="min-width:0"><span class="tx">'+more+' autres chevaux à surveiller</span><span class="mt">Voir la liste des chevaux</span></span>'+ICON('right','sm')+'</button>';
    return h+'</div>'};
  T.team=function(){var kev=D.tasks.filter(function(t){return t.who==='s07'&&mins(t.time)!=null}).sort(function(a,b){return mins(a.time)-mins(b.time)})[0];
    return '<div class="ck-lbl">Équipe du jour</div><div class="ck-sub" style="margin-top:4px">'+D.staff.length+' personnes au club.'+(kev?' Kévin arrive à '+hm(kev.time)+'.':'')+'</div><div class="ck-tmr">'+[['Enseignement',/Monit|BPJEPS/],['Écurie',/Palefreni|entretien/],['Accueil et gestion',/Gérant|accueil/]].map(function(g){var L=D.staff.filter(function(s){return g[1].test(s.role)});return '<div><b class="num">'+L.length+'</b><span>'+g[0]+'</span><em>'+L.map(function(s){return E(s.first)}).join(', ')+'</em></div>'}).join('')+'</div><div class="ck-team">'+D.staff.slice(0,6).map(function(s){return U.av(s)}).join('')+(D.staff.length>6?'<span class="av" style="--c:var(--surface);color:var(--d-ink)">+'+(D.staff.length-6)+'</span>':'')+'</div>'};
  T.valid=function(){var L=[];
    decl.forEach(function(d){L.push({k:'decl',id:d.id,i:'horse',d:'hz',tx:d.stay==='passage'?E(d.name)+', cheval de passage':E(d.name)+' arrive en pension',mt:'Déclaré par '+E(D.name(d.by))+(D.coach(d.by)?', coach':'')+' · '+E(d.breed)+(d.box?', box '+d.box:''),b:'Valider',go:'chevaux'})});
    toSign.slice(0,3).forEach(function(c){var t=c.title.replace(/^Contrat de /,'').replace(/ et règlement intérieur$/,'').replace(/ et droit à l’image$/,'');if(/demi-pension/i.test(t)&&D.facts&&D.facts.emmaContract)t='Avenant de demi-pension';
      L.push({k:'ct',id:c.id,i:'sign',d:'rd',tx:cap(t)+(c.horse?' '+de(D.horse(c.horse).name):''),mt:'À signer par '+E(D.name(c.party))+(c.amount?' · '+F.eur(c.amount):''),b:'Relancer',go:'contrats'})});
    if(toSign.length>3)L.push({k:'more',id:'more',i:'contract',d:'rd',tx:pl(toSign.length-3,'autre contrat','autres contrats')+' à signer',mt:'Voir tous les contrats',b:'Ouvrir',go:'contrats'});
    return '<div class="ck-th"><span class="ico">'+ICON('sign')+'</span><h3>À valider</h3><span class="ck-cnt" data-vcnt>'+L.length+'</span></div>'+(L.length?'<div class="ck-vl">'+L.map(function(v){return '<div class="ck-vr d-'+v.d+'" data-vr="'+v.id+'"><span class="ico">'+ICON(v.i)+'</span><span class="lk" data-go="'+v.go+'"'+(v.k==='decl'?' data-p-validate="1"':'')+'><span class="tx">'+v.tx+'</span><span class="mt">'+v.mt+'</span></span><button class="btn sm tint" data-val="'+v.k+'" data-vid="'+v.id+'">'+v.b+'</button></div>'}).join('')+'</div><div class="ck-vf"><button class="btn ghost sm" data-go="contrats">'+ICON('contract','sm')+'Tous les contrats</button><button class="btn ghost sm" data-go="chevaux">'+ICON('horse','sm')+'Chevaux déclarés</button></div>':'<div class="ck-ok">'+ICON('checkc')+'Tout est validé. Rien n’attend votre signature.</div>')};
  T.rev=function(){return '<div class="ck-rh"><span class="ico">'+ICON('euro')+'</span><h3>Recettes et dépenses</h3>'+U.seg([['12','12 mois'],['3','Trimestre'],['1','Mois']],String(S.fin),'data-fin')+'</div><div data-finbody>'+fin(S.fin)+'</div>'};
  function fin(n){var rv,co,lb,per,cur=D.revenue[11],prev=D.revenue[10];
    if(n===1){var w=[.27,.24,.31,.18];rv=w.map(function(x){return Math.round(cur*x)});co=[.26,.25,.24,.25].map(function(x){return Math.round(D.costs[11]*x)});lb=['2 au 8','9 au 15','16 au 22','23 au 30'];per='Novembre, semaine par semaine'}
    else{rv=D.revenue.slice(-n);co=D.costs.slice(-n);lb=D.months.slice(-n);per=n===12?['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre'][D.today.getMonth()]+', au '+D.today.getDate():'Septembre à novembre'}
    var tot=rv.reduce(function(a,b){return a+b},0),res=tot-co.reduce(function(a,b){return a+b},0),mx=Math.max.apply(null,rv.concat(co));
    return '<div class="ck-rev"><div><div class="ck-lbl" style="color:var(--mut)">'+per+'</div><div class="ck-big"><span data-count="'+(n===12?cur:tot)+'" data-fmt="eur">'+F.eur(n===12?cur:tot)+'</span></div></div>'+
      '<span class="ck-dl2'+(res<0?' neg':'')+'">'+(n===12&&(D.me&&D.me.gerant==='s01'||!!(window.PL&&PL.sandbox))?'+8,4'+NB+'% sur un an':'Marge '+(res<0?'−':'')+F.eur(Math.abs(res)))+'</span><span class="ck-dl2 mo" title="Encaissé aujourd’hui">'+ICON('card','sm')+F.eur(inSum)+' encaissés aujourd’hui</span></div>'+
      '<div class="ck-bars'+(rv.length>8?' many':'')+'" style="--n:'+rv.length+'">'+rv.map(function(v,i){return '<div class="'+(i===rv.length-1?'cur':'')+'"><em>'+F.eur(v)+' · dépenses '+F.eur(co[i])+'</em><i style="--h:'+(v/mx*100).toFixed(1)+'%;--c:'+(co[i]/v*100).toFixed(1)+'%;--i:'+i+'"></i><span>'+lb[i]+'</span></div>'}).join('')+'</div>'+
      '<div class="ck-lg" style="margin-top:12px"><span><i></i>Recettes</span><span><i class="c"></i>Dépenses</span><span class="grow"></span><span>'+(res<0?'−':'+')+F.eur(Math.abs(res))+' de résultat '+(n===12?'sur 12 mois':n===3?'sur le trimestre':'en novembre')+'</span></div>'}

  var GO={kRiders:'planning',kFill:'rapports',kHorses:'chevaux',kMoney:'facturation',hay:'alimentation',team:'equipe'};
  var CLS={hero:'ck-hero',kRiders:'pa ck-kpi',kFill:'pa ck-kpi',kHorses:'pa ck-kpi',kMoney:'pa ck-kpi mo',hay:'pa ck-hay',wx:'pa',team:'pa'};
  function tile(k,i){var t=TILES[TK.indexOf(k)],s=t[3],dom=t[2],dim=S.focus!=='all'&&dom!==S.focus;
    return '<section class="ck-t d-'+dom+' '+(CLS[k]||'')+(GO[k]?' go':'')+(dim?' dim':'')+'" data-flip="'+k+'" data-w="'+k+'"'+(GO[k]?' data-go="'+GO[k]+'"'+(k==='kFill'?' data-p-tab="creneaux"':''):'')+' style="--c:'+s[0]+';--r:'+s[1]+';--tc:'+s[2]+';--mc:'+s[3]+';--i:'+i+'">'+T[k]()+'</section>'}
  function order(){var o=(mob?MOB:TK).filter(function(k){return on.indexOf(k)>=0});if(S.focus!=='all'){var a=o.filter(function(k){return TD[k]===S.focus}),b=o.filter(function(k){return TD[k]!==S.focus});o=a.concat(b)}return o}

  var dateTxt=cap(F.dateL(D.today));
  var h='<div class="ck-ph"><div><div class="ck-eb">'+dateTxt+' · '+E(D.club.name)+'</div><h1>Bonjour'+(gFirst()?' '+E(gFirst()):'')+'</h1></div><div class="ck-rt">'+
    '<div class="ck-acts"><button class="btn" data-edit>'+ICON('sliders','sm')+'Personnaliser</button><button class="btn pri" data-new>'+ICON('plus','sm')+'Créer</button></div>'+
    '<div class="ck-chips scroll-x" role="group" aria-label="Mettre un domaine en avant">'+FOC.map(function(f){return '<button class="ck-chip'+(f[0]==='all'?'':' d-'+f[0])+'" data-focus="'+f[0]+'" aria-pressed="'+(S.focus===f[0])+'">'+(f[0]==='all'?ICON('grid','sm'):'<i></i>')+f[1]+'</button>'}).join('')+'</div></div></div>';
  var ord=order();
  h+='<div class="ck-bento'+(S.seen?'':' on')+'">'+TK.filter(function(k){return on.indexOf(k)>=0}).map(function(k){return tile(k,ord.indexOf(k))}).join('')+'<div class="ck-tip"></div></div>';
  el.innerHTML=h;S.seen=true;
  var bento=P.$('.ck-bento',el);
  function applyOrder(){var o=order();P.$$('.ck-t',bento).forEach(function(t){var k=t.getAttribute('data-w');t.style.order=o.indexOf(k);t.classList.toggle('dim',S.focus!=='all'&&TD[k]!==S.focus)})}
  applyOrder();
  function retile(k){var t=P.$('[data-w="'+k+'"]',bento);if(t)t.innerHTML=T[k]()}

  /* ---------- Interactions ---------- */
  el.addEventListener('click',function(e){
    var f=e.target.closest('[data-focus]');if(f){var v=f.getAttribute('data-focus');if(v===S.focus&&v!=='all')v='all';var m=flipFirst(bento);S.focus=v;
      P.$$('[data-focus]',el).forEach(function(b){b.setAttribute('aria-pressed',b.getAttribute('data-focus')===v)});applyOrder();flipPlay(bento,m);
      var nb=P.$('[data-focus="'+v+'"]',el);if(nb&&!P.RM){nb.classList.remove('pop');void nb.offsetWidth;nb.classList.add('pop')}return}
    var hb=e.target.closest('[data-hero]');if(hb){e.stopPropagation();heroAct(hb.getAttribute('data-hero'));return}
    var tk=e.target.closest('[data-task]');if(tk){var t=D.tasks.find(function(x){return x.id===tk.getAttribute('data-task')});t.done=!t.done;tk.classList.toggle('on',t.done);tk.setAttribute('aria-pressed',t.done);
      var c=P.$('[data-todocnt]',el);if(c)c.textContent=tasks.filter(function(x){return !x.done}).length+Math.min(alerts.length,3);
      setTimeout(function(){var m=flipFirst(bento),list=P.$$('.ck-td[data-task]',bento),ord2=tasks.slice().sort(function(a,b){return (a.done?1:0)-(b.done?1:0)||(b.urgent?1:0)-(a.urgent?1:0)}).map(function(x){return x.id});
        list.forEach(function(n){n.style.order=ord2.indexOf(n.getAttribute('data-task'))});P.$$('.ck-sep,.ck-td:not([data-task])',bento).forEach(function(n){n.style.order=99});flipPlay(bento,m)},P.RM?0:420);
      if(t.done)P.toast('Fait : '+low(t.title)+'.',{undo:function(){t.done=false;tk.classList.remove('on');tk.setAttribute('aria-pressed','false');if(c)c.textContent=tasks.filter(function(x){return !x.done}).length+Math.min(alerts.length,3)}});
      if(tasks.every(function(x){return x.done}))setTimeout(function(){P.toast('Tout est traité pour aujourd’hui. Bravo.',{icon:'star'})},700);return}
    var vb=e.target.closest('[data-val]');if(vb){e.stopPropagation();validate(vb);return}
    var fb=e.target.closest('[data-fin]');if(fb){S.fin=+fb.getAttribute('data-fin');P.$$('[data-fin]',el).forEach(function(b){b.setAttribute('aria-selected',b===fb)});var bd=P.$('[data-finbody]',el);bd.innerHTML=fin(S.fin);P.animate(bd);return}
  });
  function heroAct(k){var lbl={wx:moved.length>1?moved.length+' reprises déplacées au '+low(indoor.name)+', cavaliers prévenus':'Reprise déplacée au '+low(indoor.name)+', cavaliers prévenus',
      rel:pl(late.length,'relance')+' envoyée'+(late.length>1?'s':'')+' par e-mail et SMS',cmd:shav?'Commande de '+shav.min+' '+shav.unit+' envoyée à '+shav.supplier+', livraison jeudi':''};
    var m=flipFirst(bento);S.hero[k]=1;retile('hero');retile('hay');retile('wx');flipPlay(bento,m);
    P.toast(lbl[k],{undo:function(){delete S.hero[k];retile('hero');retile('hay');retile('wx');P.toast(k==='rel'?'Relances annulées':k==='cmd'?'Commande annulée':'Reprises remises en carrière',{icon:'refresh'})}})}
  function validate(b){var k=b.getAttribute('data-val'),id=b.getAttribute('data-vid'),row=b.closest('.ck-vr');
    if(k==='more'){P.go('contrats');return}
    if(k==='decl'){var d=D.declarations.find(function(x){return x.id===id});d.status='validée';P.renderBadges();
      gone(row,function(){P.toast(d.name+' validé. Sa fiche'+(d.box?' et son box '+d.box+' sont prêts':' est prête')+'.',{undo:function(){d.status='en attente';P.renderBadges();retile('valid')}})})}
    else{var c=D.contracts.find(function(x){return x.id===id});b.outerHTML='<span class="chip ok dot">Relancé</span>';P.toast('Relance envoyée à '+D.name(c.party)+' pour « '+c.title+' »')}}
  function gone(row,cb){row.classList.add('out');setTimeout(function(){var m=flipFirst(bento);row.remove();var n=P.$$('.ck-vr',bento).length,c=P.$('[data-vcnt]',bento);if(c)c.textContent=n;if(!n)retile('valid');flipPlay(bento,m);cb()},P.RM?0:320)}

  /* info-bulle des boxes */
  var tip=P.$('.ck-tip',el),W={pad:'Au paddock',work:'Au travail',box:'Au box',soin:'Au box, en soins'};
  bento.addEventListener('mouseover',function(e){var b=e.target.closest('.ck-bx');if(!b){tip.classList.remove('on');return}var hid=b.getAttribute('data-h'),h=hid&&D.horse(hid);
    tip.innerHTML=h?E(h.name)+'<small>Box '+h.box+' · '+W[h.status==='bad'?'soin':where(h)]+(h.alerts&&h.alerts[0]?' · '+E(h.alerts[0]):'')+'</small>':'Box '+b.getAttribute('data-box')+'<small>Libre, réservable pour une pension</small>';
    var br=bento.getBoundingClientRect(),r=b.getBoundingClientRect();tip.style.left=(r.left+r.width/2-br.left)+'px';tip.style.top=(r.top-br.top)+'px';tip.classList.add('on');
    var tr=tip.getBoundingClientRect();if(tr.right>br.right)tip.style.left=(parseFloat(tip.style.left)-(tr.right-br.right))+'px';if(tr.left<br.left)tip.style.left=(parseFloat(tip.style.left)+(br.left-tr.left))+'px'});
  bento.addEventListener('mouseleave',function(){tip.classList.remove('on')});
  bento.addEventListener('click',function(e){var b=e.target.closest('.ck-bx');if(!b)return;e.stopPropagation();var hid=b.getAttribute('data-h');if(hid)P.go('cheval',{id:hid});else P.go('pensions')},true);

  el.querySelector('[data-new]').onclick=function(){P.sheet({title:'Créer',icon:'plus',body:'<div class="g2 rise" style="--g:10px">'+[['planning','Une reprise ou un stage','planning','rd'],['members','Un adhérent','adherents','rd'],['horse','Un cheval','chevaux','hz'],['invoice','Une facture','facturation','mo'],['contract','Un contrat à signer','contrats','mo'],['care','Un soin','soins','cr'],['upkeep','Une tâche','entretien','tm'],['compet','Un concours','competitions','rd']].map(function(x){return '<button class="card pad hover hrow" style="padding:14px;--g:12px" data-go="'+x[2]+'"><span class="ico d-'+x[3]+'">'+ICON(x[0])+'</span><b class="s">'+x[1]+'</b></button>'}).join('')+'</div>'})};
  el.querySelector('[data-edit]').onclick=function(){var sh=P.sheet({title:'Personnaliser l’accueil',icon:'sliders',body:'<p class="s mut" style="margin-bottom:14px">Choisissez les tuiles de votre page d’accueil. Chaque membre de l’équipe a la sienne.</p><div class="card list">'+TILES.map(function(w){return '<div class="li"><span class="ico sm d-'+w[2]+'">'+ICON({acc:'assistant',rd:'members',hz:'horse',mo:'euro',tm:'team',cr:'care'}[w[2]],'sm')+'</span><div class="grow b s">'+w[1]+'</div>'+U.tog(on.indexOf(w[0])>=0,'w-'+w[0])+'</div>'}).join('')+'</div>',
    foot:'<button class="btn" data-reset>Tout afficher</button><button class="btn pri" data-save>Enregistrer</button>'});
    P.$$('.tog',sh).forEach(function(t){t.onclick=function(){t.setAttribute('aria-checked',t.getAttribute('aria-checked')==='true'?'false':'true')}});
    sh.querySelector('[data-reset]').onclick=function(){P.$$('.tog',sh).forEach(function(t){t.setAttribute('aria-checked','true')})};
    sh.querySelector('[data-save]').onclick=function(){var l=TILES.filter(function(w){return sh.querySelector('#w-'+w[0]).getAttribute('aria-checked')==='true'}).map(function(w){return w[0]});P.prefs.set('cockpit:tiles',l);sh.close();P.rerender();P.toast('Accueil mis à jour')}};
 }});

P.actions.push({role:'gerant',label:'Envoyer les relances d’impayés',icon:'send',run:function(){var n=lateInv().length;S.hero.rel=1;P.toast(n+' relances envoyées par e-mail et SMS');if(P.state&&P.state.route==='cockpit')P.rerender()}},{role:'gerant',label:'Personnaliser mon accueil',icon:'sliders',run:function(){P.go('cockpit');setTimeout(function(){var b=P.$('[data-edit]',P.app());if(b)b.click()},380)}});
P.brain.push({role:'gerant',re:/pay|impay|relan|retard/i,reply:function(){var l=lateInv();return {text:l.length+' factures sont en retard pour '+F.eur(l.reduce(function(a,i){return a+i.amount},0))+'. Les trois plus anciennes :',card:l.slice().sort(function(a,b){return a.due<b.due?-1:1}).slice(0,3).map(function(i){return '<div class="hrow sp"><span class="s">'+D.name(i.member)+'</span><b class="s num">'+F.eur(i.amount)+'</b></div>'}).join(''),actions:[{label:'Relancer les '+l.length,run:function(){S.hero.rel=1;P.toast(l.length+' relances envoyées');return l.length+' relances envoyées'}},{label:'Voir les factures',run:function(){P.go('facturation');return 'Ouvert'}}]}}});
P.tourSteps.push({route:'cockpit',title:'Le matin, tout tient sur un écran',text:'Le gérant ouvre Piaffe et voit ce qui compte : chevaux à surveiller, chevaux déclarés à valider, reprises et pistes de la journée, argent à encaisser. Les puces de domaine remontent les tuiles utiles, et les actions les plus probables sont déjà prêtes : il suffit de valider.'});
})();
