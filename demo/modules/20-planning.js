/* Lot A · Vue gérant : Planning, Rapports, Communication */
(function(){
var D=P.D,F=P.fmt,U=P.ui,C=P.chart,$=P.$,$$=P.$$;
var AR=D.club.arenas,DN=['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'],DNL=['lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'];
var H0=9,H1=20,HP=46,NOW=9*60+41,TDI=1;

/* ---------- Petits outils partagés par les trois écrans ---------- */
function mn(s){var p=String(s).split(':');return +p[0]*60+ +p[1]}
function hm(m){var h=Math.floor(m/60),x=m%60;return h+' h'+(x?' '+(x<10?'0':'')+x:'')}
function hc(m){return Math.floor(m/60)+':'+String(m%60).padStart(2,'0')}
function dh(h){var m=Math.round(h*60),H=Math.floor(m/60),r=m%60;return H?H+' h'+(r?' '+(r<10?'0':'')+r:''):r+' min'}
function cap1(s){return s.charAt(0).toUpperCase()+s.slice(1)}
function arena(id){return AR.find(function(a){return a.id===id})||AR[0]}
function fld(label,html,cls){return '<label class="field'+(cls?' '+cls:'')+'"><span>'+label+'</span>'+html+'</label>'}
function sel(k,opts,val){return '<select class="in" data-k="'+k+'">'+opts.map(function(o){var v=Array.isArray(o)?o[0]:o,t=Array.isArray(o)?o[1]:o;return '<option value="'+v+'"'+(String(v)===String(val)?' selected':'')+'>'+t+'</option>'}).join('')+'</select>'}
function opt(title,sub,on,id){return '<div class="lx-opt"><div class="grow"><div class="b s">'+title+'</div>'+(sub?'<div class="xs mut">'+sub+'</div>':'')+'</div>'+U.tog(on,id)+'</div>'}
function isOn(root,id){var t=root.querySelector('#'+id);return !!t&&t.getAttribute('aria-checked')==='true'}
function val(root,k){var i=root.querySelector('[data-k="'+k+'"]');return i?i.value:''}
function on(root,sel_,fn,evt){$$(sel_,root).forEach(function(b){b.addEventListener(evt||'click',function(e){fn(b,e)})})}
var NB='\u00a0';
function pxTabs(items,sel,attr){return '<div class="px-tabs scroll-x" role="tablist">'+items.map(function(t){return '<button class="t d-'+t[3]+'" role="tab" '+attr+'="'+t[0]+'" aria-selected="'+(t[0]===sel)+'">'+ICON(t[2])+t[1]+(t[4]?'<em>'+t[4]+'</em>':'')+'</button>'}).join('')+'</div>'}
function pxHd(dom,icon,title,sub){return '<div class="px-hd"><span class="ico d-'+dom+'">'+ICON(icon)+'</span><div><h3>'+title+'</h3>'+(sub?'<div class="mut">'+sub+'</div>':'')+'</div></div>'}
function plural(n,s,p){return n+' '+(n>1?(p||s+'s'):s)}
function ageTxt(l){return l.amin&&l.amax?'De '+l.amin+' à '+l.amax+' ans':l.amin?'À partir de '+l.amin+' ans':'Jusqu’à '+l.amax+' ans'}

P.css(`
.lx-opt{display:flex;align-items:center;gap:12px;padding:11px 0;border-top:1px solid var(--line)}
.lx-opt:first-child{border-top:0}
.lx-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}
.lx-form .full{grid-column:1/-1}
.app.mobile .lx-ph .ph .acts{width:100%}.app.mobile .lx-ph .ph .acts .btn{flex:1;height:44px}
.lx-h{font:700 14.5px var(--f-text);color:var(--ink);margin:20px 0 10px;display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.lx-h:first-child{margin-top:0}
.lx-h .mut{font-weight:500}
.lx-ai{display:flex;gap:12px;align-items:flex-start;flex-wrap:wrap;padding:14px 16px;border-radius:18px;background:color-mix(in srgb,var(--acc-bg) 70%,var(--surface));box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--acc) 16%,var(--line));font-size:14.5px;line-height:1.5;color:var(--ink-2)}
.lx-ai>span:not(.strass),.lx-ai>.grow{flex:1;min-width:200px}
.lx-ai b{color:var(--ink)}
/* en-tête Paddock partagé par Rapports et Communication */
.px-ph{display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:14px 24px;margin:4px 0 20px}
.px-ph .eb{font:700 13px var(--f-text);letter-spacing:.06em;text-transform:uppercase;color:var(--mut);display:flex;gap:8px;align-items:center;flex-wrap:wrap}
.px-ph .eb .dot{width:8px;height:8px;border-radius:50%;background:var(--ok);box-shadow:0 0 0 4px color-mix(in srgb,var(--ok) 22%,transparent)}
.px-ph h1{font:800 46px/1 var(--f-display);letter-spacing:-.035em;margin-top:8px}
.px-ph .sub{font-size:15px;color:var(--mut);margin-top:10px;max-width:80ch}
.px-ph .sub b{color:var(--ink)}
.px-ph .acts{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}
.px-ph .acts .btn{height:44px;padding:0 16px}
.px-fi{animation:pxfi .24s var(--e-out) both}
@keyframes pxfi{from{opacity:0;transform:translateY(10px)}}
.px-tabs{display:flex;gap:8px;margin:0 0 20px;align-items:center}
.px-tabs .t{flex:none;height:44px;padding:0 16px 0 12px;border-radius:99px;display:inline-flex;align-items:center;gap:8px;font:650 14.5px var(--f-text);color:var(--ink-2);background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);transition:background var(--t-2),color var(--t-2),box-shadow var(--t-2),transform .3s var(--e-spring)}
.px-tabs .t svg.i{width:20px;height:20px;color:var(--d-ink,var(--acc-deep))}
.px-tabs .t:hover{box-shadow:inset 0 0 0 1px var(--line-2),var(--shadow-1)}
.px-tabs .t:active{transform:scale(.96)}
.px-tabs .t[aria-selected="true"]{background:var(--d-bg,var(--acc-bg));color:var(--d-ink,var(--acc-deep));box-shadow:inset 0 0 0 1.5px color-mix(in srgb,var(--d,var(--acc)) 40%,transparent)}
.px-tabs .t em{font-style:normal;min-width:22px;height:22px;border-radius:11px;padding:0 6px;display:inline-grid;place-items:center;background:var(--d,var(--acc));color:var(--surface);font:700 13px/1 var(--f-text)}
.px-hd{display:flex;align-items:center;gap:12px;min-width:0;flex:1 1 240px}
.px-hd>div{min-width:0}
.px-hd h3{font:700 19px/1.2 var(--f-display);letter-spacing:-.015em}
.px-hd .mut{font-size:14px;margin-top:2px}
.px-k{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
.px-k .kpi{border-radius:24px}
.px-k .kpi .lab svg.i{width:20px;height:20px}
.px-k .kpi svg.spark{height:38px}
.px-k .kpi.tint .del.up{color:var(--d-ink)}
.px-k .kpi.tint svg.spark path{stroke:var(--d-ink)}
@container main (max-width:1080px){.px-k{grid-template-columns:repeat(2,minmax(0,1fr))}}
@container main (max-width:760px){.px-ph{grid-template-columns:minmax(0,1fr)}.px-ph .acts{justify-content:flex-start}}
@container main (max-width:520px){.px-k{gap:10px}.px-k .kpi{padding:16px;border-radius:20px}.px-k .kpi .val{font-size:30px}.px-k .kpi .lab{font-size:14px}}
.app.mobile .px-ph{margin:0 0 14px}.app.mobile .px-ph h1{display:none}.app.mobile .px-ph .eb{display:none}
.app.mobile .px-ph .acts{width:100%;display:grid;grid-template-columns:1fr 1fr}.app.mobile .px-ph .acts .btn{width:100%;justify-content:center}
.app.mobile .px-tabs{margin:0 -16px 16px;padding:2px 16px;width:calc(100% + 32px);overflow-x:auto;scrollbar-width:none}
.app.mobile .px-tabs::-webkit-scrollbar{display:none}
.lx-ai>svg.i{flex:none;color:var(--acc);margin-top:2px}
.app.mobile .lx-form{grid-template-columns:minmax(0,1fr)}
.app.mobile .sheet .sf .btn{height:44px}
.app.mobile .sheet .sf .btn:not(.icon){flex:1;padding:0 10px}
.app.mobile .sheet .sf .btn.icon{width:44px}

/* ===== Planning (direction Paddock) ===== */
.pl-ph{display:flex;align-items:center;justify-content:space-between;gap:14px 20px;flex-wrap:wrap;margin:4px 0 18px}
.pl-ttl{display:flex;align-items:center;gap:10px 14px;flex-wrap:wrap;min-width:0}
.pl-ttl h1{font:800 48px/1 var(--f-display);letter-spacing:-.035em;margin-right:6px}
.pl-nav{display:flex;gap:2px}
.pl-lab{font:700 22px/1.1 var(--f-display);letter-spacing:-.02em;white-space:nowrap}
.pl-act{display:flex;align-items:center;gap:10px}
.pl-sub{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}
.pl-stats{display:flex;flex-wrap:wrap;gap:8px;flex:1;min-width:0}
.pl-stt{animation:plsin .5s var(--e-out) both;animation-delay:calc(var(--j,0)*50ms)}
@keyframes plsin{from{opacity:0;transform:translateY(8px)}}
.pl-stt{display:inline-flex;align-items:center;gap:8px;height:42px;padding:0 13px 0 5px;border-radius:14px;background:var(--d-bg);color:var(--d-ink);font:500 14.5px var(--f-text);white-space:nowrap;flex:none}
.pl-stt b{font:800 20px/1 var(--f-display);letter-spacing:-.02em}
.pl-stt .si{width:32px;height:32px;border-radius:11px;display:grid;place-items:center;background:color-mix(in srgb,var(--surface) 70%,transparent)}
.pl-stt .si svg.i{width:19px;height:19px}
button.pl-stt{transition:transform .35s var(--e-spring),box-shadow var(--t-2)}
button.pl-stt:hover{box-shadow:0 10px 22px -12px var(--d)}
button.pl-stt:active{transform:scale(.95)}
.pl-stt.hot .si{background:var(--cr);color:#fff}
.pl-tbx{display:flex;gap:4px;flex:none}
.pl-fbar{display:flex;flex-wrap:nowrap;gap:6px;align-items:center;margin-bottom:16px;padding:2px 40px 2px 2px;-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 40px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 40px),transparent)}
.pl-chip{flex:none;gap:7px;padding:0 13px 0 11px;min-height:40px;font-size:15px}
.pl-sepv.brk{flex:none}
.pl-chip i{width:10px;height:10px;border-radius:50%;background:var(--d,var(--mut-2))}
.pl-chip[aria-pressed="true"] i{background:currentColor}
.pl-chip .av{width:26px;height:26px;font-size:13px;margin-left:-6px}
.pl-chip small{font:600 13px var(--f-text);opacity:.7;font-variant-numeric:tabular-nums}
.pl-chip.pop{animation:plpop .45s var(--e-spring)}
@keyframes plpop{40%{transform:scale(.9)}}
.pl-sepv{width:1px;height:28px;background:var(--line-2);flex:none;margin:0 4px}

.pl-cal{border-radius:28px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);position:relative;overflow:clip;user-select:none;-webkit-user-select:none}
.pl-calh{display:grid;grid-template-columns:64px repeat(var(--n),minmax(0,1fr));position:sticky;top:-6px;z-index:6;background:color-mix(in srgb,var(--surface) 90%,transparent);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border-bottom:1px solid var(--line);border-radius:28px 28px 0 0}
.pl-dh{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:12px 14px;text-align:left;border-left:1px solid var(--line);transition:background var(--t-2);min-width:0}
.pl-dh:hover{background:var(--surface-2)}
.pl-dh .dn{font:600 14px var(--f-text);color:var(--mut)}
.pl-dh .dd{display:flex;align-items:center;height:34px;font:800 26px/1 var(--f-display);letter-spacing:-.03em}
.pl-dh.today .dd b{background:var(--cr);color:#fff;border-radius:11px;padding:0 8px;height:34px;line-height:34px;margin-left:-2px}
.pl-dh.today .dn{color:var(--cr)}
.pl-dh .dm{font:500 13px var(--f-text);color:var(--mut);white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%}
.pl-dh .fl,.pl-arh .fl{display:block;width:100%;height:5px;border-radius:3px;background:var(--surface-3);overflow:hidden;margin-top:6px}
.pl-dh .fl i,.pl-arh .fl i{display:block;height:100%;border-radius:3px;background:var(--acc);width:var(--f);transform-origin:left;animation:plgx .8s var(--e-out) both}
@keyframes plgx{from{transform:scaleX(0)}}
.pl-arh{display:flex;align-items:center;gap:10px;padding:12px 14px;border-left:1px solid var(--line);min-width:0}
.pl-arh b{display:block;font:700 16px/1.2 var(--f-text)}
.pl-arh span.ellip{display:block;font:500 13px var(--f-text);color:var(--mut)}
.pl-calb{display:grid;grid-template-columns:64px repeat(var(--n),minmax(0,1fr));position:relative}
.pl-hrs{position:relative}
.pl-hrs span{position:absolute;right:10px;transform:translateY(-50%);font:600 13px var(--f-text);color:var(--mut);font-variant-numeric:tabular-nums;white-space:nowrap}
.pl-hrs .nowt{right:6px;z-index:5;padding:3px 7px;border-radius:8px;background:var(--cr);color:#fff;font:700 13px/1.2 var(--f-text)}
.pl-col{position:relative;border-left:1px solid var(--line);background-image:linear-gradient(var(--line) 1px,transparent 1px);background-size:100% var(--hp);cursor:cell;transition:background-color var(--t-2)}
.pl-col.today{background-color:color-mix(in srgb,var(--cr) 3.5%,transparent)}
.pl-col.tgt{background-color:color-mix(in srgb,var(--acc) 7%,transparent)}
.pl-col.off{background-image:repeating-linear-gradient(135deg,transparent 0 8px,color-mix(in srgb,var(--line) 80%,transparent) 8px 9px);cursor:default}
.pl-off{position:absolute;left:8px;right:8px;top:12px;padding:12px;border-radius:16px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);font-size:13px;color:var(--mut);display:flex;flex-direction:column;gap:4px}
.pl-off b{color:var(--ink);font-size:14.5px}
.pl-off svg.i{color:var(--mut)}
.pl-now{position:absolute;left:-1px;right:0;height:2px;background:var(--cr);z-index:4;pointer-events:none}
.pl-now::before{content:"";position:absolute;left:-6px;top:-5px;width:12px;height:12px;border-radius:50%;background:var(--cr);animation:plnow 2.2s infinite}
@keyframes plnow{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--cr) 55%,transparent)}100%{box-shadow:0 0 0 9px transparent}}
.pl-ev{position:absolute;left:calc(var(--l)*100%);width:calc(var(--w)*100%);padding:3px 3px 0;text-align:left;cursor:grab;z-index:2;touch-action:none}
.pl-ev .in{display:flex;flex-direction:column;gap:2px;height:100%;border-radius:14px;background:var(--d-bg);color:var(--d-ink);padding:7px 10px 7px 14px;overflow:hidden;position:relative;transition:box-shadow var(--t-2),transform .35s var(--e-spring);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--d) 22%,transparent)}
.pl-ev .in::before{content:"";position:absolute;left:0;top:0;bottom:0;width:5px;background:linear-gradient(to top,var(--d) var(--f,100%),color-mix(in srgb,var(--d) 30%,transparent) var(--f,100%))}
.pl-ev:hover{z-index:3}
.pl-ev:hover .in{box-shadow:inset 0 0 0 1.5px var(--d),var(--shadow-2);transform:translateY(-1px)}
.pl-ev .t{display:flex;align-items:baseline;gap:6px;font:700 14.5px/1.2 var(--f-text);min-width:0}
.pl-ev .t b{font-weight:700;flex:1;min-width:0;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pl-ev .t em{font-style:normal;font:700 13px var(--f-text);font-variant-numeric:tabular-nums;opacity:.85;flex:none}
.pl-ev .t svg.i{width:16px;height:16px;flex:none;align-self:center}
.pl-ev.conf .t svg.i{color:var(--cr)}
.pl-ev .m{display:flex;align-items:center;gap:6px;font:500 13px/1.3 var(--f-text);opacity:.88;min-width:0;white-space:nowrap}
.pl-ev .mav{flex:none;width:26px;height:26px;border-radius:50%;display:grid;place-items:center;background:var(--surface);color:var(--d-ink);font:700 13px/1 var(--f-text)}
.pl-ev .h1{display:flex;align-items:center;gap:5px;font:600 13px/1.2 var(--f-text);white-space:nowrap;overflow:hidden;margin-top:3px;opacity:.95}
.pl-ev .h1 svg{width:14px;height:14px;flex:none}
.pl-ev .h1 span{overflow:hidden;text-overflow:ellipsis;min-width:0}
.pl-ev .h1 b{flex:none}
.pl-ev .hz{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px;overflow:hidden;max-height:26px}
.pl-ev .hz span{display:inline-flex;align-items:center;gap:4px;height:24px;padding:0 9px 0 5px;border-radius:999px;background:color-mix(in srgb,var(--surface) 72%,transparent);font:600 13px var(--f-text);white-space:nowrap}
.pl-ev .hz svg{width:15px;height:15px}
.pl-ev.wk .t b{white-space:normal;display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;hyphens:manual;overflow-wrap:normal;word-break:normal;line-height:1.18}
.pl-ev.wk .m em{font-style:normal;font:700 13px var(--f-text);font-variant-numeric:tabular-nums;margin-left:auto;flex:none;opacity:.85}
.pl-ev.wk .m .ellip{flex:1;min-width:0}
.pl-ev.wk.short .t b{-webkit-line-clamp:1}
.pl-ev.nar .in{padding:6px 4px 6px 10px}
.pl-ev.nar .t{font-size:13px;letter-spacing:-.015em}
.pl-ev.nar .t b{-webkit-line-clamp:3}
.pl-ev.nar .t svg.i{display:none}
.pl-ev.nar .mav{width:24px;height:24px}
.pl-ev.nar .m em{margin-left:0}
.pl-ev.short .in{flex-direction:row;align-items:center;gap:8px;padding-top:0;padding-bottom:0}
.pl-ev.short .t{font-size:13.5px;flex:none;max-width:60%}
.pl-ev.short .m{flex:1}
.pl-ev.past .in{opacity:.55;filter:saturate(.6)}
.pl-ev.svc .in{background:repeating-linear-gradient(135deg,var(--wk-bg) 0 9px,color-mix(in srgb,var(--wk) 16%,var(--wk-bg)) 9px 18px)}
.pl-ev.cx .in{background:var(--surface-2);color:var(--mut)}.pl-ev.cx .t b{text-decoration:line-through}
.pl-ev.conf .in{box-shadow:inset 0 0 0 2px var(--cr),0 0 0 3px color-mix(in srgb,var(--cr) 20%,transparent)}
.pl-ev{transition:opacity .25s var(--e-out),filter .25s var(--e-out)}
.pl-ev.dim{opacity:.13;filter:grayscale(1);pointer-events:none}
.pl-ev.drag{z-index:30;cursor:grabbing;transition:none}
.pl-ev.drag .in{box-shadow:inset 0 0 0 2px var(--d),0 24px 50px -12px rgba(10,22,54,.4);transform:rotate(-1.2deg) scale(1.03)}
.pl-ev.bad .in{box-shadow:inset 0 0 0 2px var(--cr),0 0 0 4px color-mix(in srgb,var(--cr) 25%,transparent)}
.pl-ev.landed .in{animation:plland .7s var(--e-spring) both}
@keyframes plland{0%{transform:scale(.7);opacity:0}100%{transform:none;opacity:1}}
.pl-tag{position:absolute;right:8px;top:-12px;padding:4px 10px;border-radius:9px;background:var(--navy);color:var(--on-navy);font:700 13px/1.3 var(--f-text);white-space:nowrap;z-index:3;box-shadow:var(--shadow-2)}
.pl-drop{position:absolute;left:4px;right:4px;border-radius:14px;border:2px dashed var(--acc);background:color-mix(in srgb,var(--acc) 8%,transparent);z-index:1;font:700 13px/1.3 var(--f-text);color:var(--cr);padding:6px 10px;pointer-events:none;overflow:hidden}
.pl-drop.bad{border-color:var(--cr);background:color-mix(in srgb,var(--cr) 8%,transparent)}
.pl-sel{position:absolute;left:4px;right:4px;border-radius:14px;background:color-mix(in srgb,var(--acc) 14%,transparent);border:2px dashed var(--acc);z-index:3;pointer-events:none;display:flex;flex-direction:column;padding:6px 10px;font:500 13.5px/1.3 var(--f-text);color:var(--acc-deep);overflow:hidden;animation:fade .2s both}
.pl-sel b{font-weight:700}
.pl-calf{display:flex;align-items:center;gap:10px;padding:14px 18px;border-top:1px solid var(--line);font:500 14.5px/1.4 var(--f-text);color:var(--mut)}
.pl-calf svg.i{flex:none}
.pl-out{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-top:12px;font:500 14.5px var(--f-text);color:var(--mut)}
/* survol détaillé */
.pl-pop{position:absolute;z-index:80;width:330px;padding:16px;border-radius:20px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line),var(--shadow-3);pointer-events:none;opacity:0;transform:translateY(6px) scale(.98);transition:opacity .18s,transform .3s var(--e-spring)}
.pl-pop.on{opacity:1;transform:none}
.pl-pop .pk{font:700 13.5px var(--f-text);color:var(--d-ink);display:flex;align-items:center;gap:7px}
.pl-pop .pk::before{content:"";width:10px;height:10px;border-radius:50%;background:var(--d)}
.pl-pop h4{font:700 19px/1.2 var(--f-display);margin:6px 0 4px;letter-spacing:-.01em}
.pl-pop .pm{font:500 14px/1.4 var(--f-text);color:var(--mut)}
.pl-pop .pc{display:flex;align-items:center;gap:8px;margin-top:10px;font:600 14.5px var(--f-text)}
.pl-pop .pf{margin-top:12px;font:500 14px var(--f-text)}
.pl-pop .pr{display:flex;justify-content:space-between;gap:10px}
.pl-pop .pbar{height:8px;border-radius:4px;background:var(--surface-3);overflow:hidden;margin-top:6px}
.pl-pop .pbar i{display:block;height:100%;border-radius:4px;background:var(--d);width:var(--f)}
.pl-pop .hl{display:flex;flex-wrap:wrap;gap:5px;margin-top:10px}
.pl-pop .hc{display:inline-flex;align-items:center;gap:5px;height:28px;padding:0 10px 0 6px;border-radius:999px;background:var(--hz-bg);color:var(--hz-ink);font:600 13.5px var(--f-text);white-space:nowrap}
.pl-pop .hc svg{width:17px;height:17px}
.pl-pop .hc.warn{background:var(--mo-bg);color:var(--mo-ink)}.pl-pop .hc.bad{background:var(--cr-bg);color:var(--cr-ink)}.pl-pop .hc.none{background:var(--surface-2);color:var(--mut);padding:0 10px}
.pl-pop .pw{display:flex;align-items:center;gap:6px;margin-top:10px;font:600 14px var(--f-text);color:var(--cr)}
.pl-pop .ph2{margin-top:12px;font:500 13px var(--f-text);color:var(--mut-2)}
/* bandeau des jours (vue jour) */
.pl-strip{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:6px;margin:0 0 14px}
.pl-strip button{display:flex;flex-direction:column;align-items:center;gap:3px;padding:9px 0 8px;border-radius:16px;background:var(--surface-2);font:600 13px var(--f-text);color:var(--mut);transition:background var(--t-2),color var(--t-2),transform .4s var(--e-spring)}
.pl-strip button b{font:800 20px/1 var(--f-display);color:var(--ink)}
.pl-strip .dots{display:flex;gap:3px;height:6px}
.pl-strip i{width:6px;height:6px;border-radius:50%;background:var(--acc);opacity:.7}
.pl-strip button[aria-pressed="true"]{background:var(--navy);color:color-mix(in srgb,var(--on-navy) 75%,transparent)}
.pl-strip button[aria-pressed="true"] b{color:var(--on-navy)}
.pl-strip button[aria-pressed="true"] i{background:var(--on-navy)}
.pl-strip button.today:not([aria-pressed="true"]) b{color:var(--cr)}
.pl-strip button:active{transform:scale(.92)}
/* liste */
.pl-list{padding:6px 0}
.pl-day{padding:16px 22px 8px;display:flex;align-items:baseline;gap:12px;flex-wrap:wrap}
.pl-day b{font:700 19px var(--f-display);letter-spacing:-.01em}
.pl-day .mut{font-size:14px}
.pl-row{display:grid;grid-template-columns:62px 6px minmax(0,1.5fr) auto auto auto 18px;gap:14px;align-items:center;padding:10px 22px;cursor:pointer;transition:background var(--t-1);min-height:64px;position:relative}
.pl-row:hover{background:var(--surface-2)}
.pl-row .tm{font:700 16px/1.1 var(--f-display);font-variant-numeric:tabular-nums;white-space:nowrap}
.pl-row .tm small{display:block;font:500 13px var(--f-text);color:var(--mut);margin-top:3px}
.pl-row .st{width:6px;height:40px;border-radius:3px;background:var(--d)}
.pl-row .bd{min-width:0;display:flex;flex-direction:column;gap:2px}
.pl-row .bd b{font:650 16px/1.25 var(--f-text)}
.pl-row .bd .mut{font-size:14px}
.pl-row .wt{min-width:64px;text-align:right}
.pl-row.cx .bd b{text-decoration:line-through;color:var(--mut)}
.pl-row.past{opacity:.6}
.pl-fill{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 11px;border-radius:999px;background:var(--d-bg);color:var(--d-ink);font:700 14px var(--f-text);font-variant-numeric:tabular-nums;white-space:nowrap}
.pl-fill.full::after{content:"";width:7px;height:7px;border-radius:50%;background:currentColor}
/* cartes sous le calendrier */
.pl-below{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:16px}
.pl-card{padding:20px 22px;display:flex;flex-direction:column}
.pl-ch{display:flex;align-items:center;gap:10px;margin-bottom:10px;min-height:38px}
.pl-ch h3{font:700 19px/1.2 var(--f-display);letter-spacing:-.015em;flex:1;min-width:0}
.pl-ch .ico{width:36px;height:36px;border-radius:12px}
.pl-p{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--line);min-width:0}
.pl-ch+.pl-p{border-top:0}
.pl-tl{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 12px;align-items:end;padding:8px 0}
.pl-tl .tr{grid-column:1/-1;grid-row:2}
.pl-tl .tr{position:relative;height:22px;border-radius:7px;background:var(--surface-2);overflow:hidden}
.pl-tl .tr i{position:absolute;top:2px;bottom:2px;background:var(--d);border-radius:5px;transform-origin:left;animation:pltl var(--t-4) var(--e-out) both}
.pl-tl .tr u{position:absolute;top:0;bottom:0;width:2px;background:var(--cr);z-index:1}
@keyframes pltl{from{transform:scaleX(0)}}
.pl-ax{display:block;font-size:13px;color:var(--mut)}
.pl-ax div{position:relative;height:18px;white-space:nowrap}
.pl-ax span{position:absolute;top:0}
/* agenda et carte suivante (téléphone) */
.pl-ag{display:flex;flex-direction:column;gap:18px}
.pl-agd h3{font:700 20px var(--f-display);display:flex;align-items:baseline;gap:8px;margin:0 0 8px;flex-wrap:wrap}
.pl-agd h3 small{font:500 14px var(--f-text);color:var(--mut)}
.pl-agd h3 small.tod{color:var(--cr);font-weight:700}
.pl-agc{display:grid;grid-template-columns:58px minmax(0,1fr) auto;gap:12px;align-items:center;padding:12px 14px 12px 12px;border-radius:20px;background:var(--d-bg);color:var(--d-ink);text-align:left;width:100%;margin-bottom:8px;transition:transform .35s var(--e-spring)}
.pl-agc:active{transform:scale(.97)}
.pl-agc .tm{font:800 17px/1.05 var(--f-display);white-space:nowrap}
.pl-agc .tm small{display:block;font:500 13px var(--f-text);opacity:.8;margin-top:3px}
.pl-agc .tt{display:flex;align-items:center;gap:6px;font:700 16px/1.2 var(--f-text)}
.pl-agc .mm{display:block;font:500 14px/1.3 var(--f-text);opacity:.85;margin-top:2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pl-agc .pl-fill{background:color-mix(in srgb,var(--surface) 70%,transparent)}
.pl-agc.past{opacity:.55}.pl-agc.cx .tt{text-decoration:line-through}
.pl-next{padding:18px;display:flex;flex-direction:column;gap:8px;margin-bottom:14px;border-radius:24px}
.pl-next .pl-nk{font:700 13.5px var(--f-text);opacity:.85}
.pl-next h3{font:800 24px/1.1 var(--f-display);letter-spacing:-.02em}
.pl-next .btn{flex:1}
.pl-next .btn svg{width:20px;height:20px}
.pl-fab{position:sticky;bottom:10px;float:right;height:54px;padding:0 22px 0 18px;border-radius:27px;z-index:7;margin-top:12px;box-shadow:0 12px 26px -10px var(--acc)}
@container main (max-width:1120px){.pl-below{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}.pl-below>:first-child{grid-column:1/-1}.pl-dh .dm{display:none}.pl-ttl h1{font-size:40px}.pl-tbx .btn{padding:0 9px}}
@container main (max-width:1000px){.pl-stats{flex-wrap:nowrap;overflow-x:auto;scrollbar-width:none}.pl-ev.wk .m .ellip{display:none}.pl-ev.wk .m em{margin-left:auto}.pl-ev.wk .t{font-size:13.5px;letter-spacing:-.01em}.pl-ev.wk .in{padding:6px 6px 6px 11px}.pl-ev.wk .h1 b{display:none}}
@container main (max-width:760px){
 .pl-ph{margin:0 0 12px;gap:10px}
 .pl-ttl{width:100%;flex-wrap:nowrap}.pl-lab{font-size:19px;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}
 .pl-act{width:100%}.pl-act .seg{flex:1}.pl-act .seg button{flex:1}
 .pl-sub{margin:0 -16px 12px;padding:0 16px}
 .pl-stats{flex-wrap:nowrap}
 .pl-sepv.brk{flex-basis:auto;width:1px;height:28px;margin:0 4px;background:var(--line-2)}
 .pl-fbar{margin:0 -16px 14px;padding:2px 32px 2px 16px;flex-wrap:nowrap;-webkit-mask-image:linear-gradient(90deg,#000 calc(100% - 32px),transparent);mask-image:linear-gradient(90deg,#000 calc(100% - 32px),transparent)}
 .pl-cal{border-radius:24px}
 .pl-calb{grid-template-columns:58px minmax(0,1fr)}
 .pl-hrs span{font-size:13px;right:8px}
 .pl-hrs .nowt{right:3px;padding:2px 5px;letter-spacing:-.02em}
 .pl-below{grid-template-columns:minmax(0,1fr)}
 .pl-row{grid-template-columns:52px 5px minmax(0,1fr) auto 16px;padding:10px 14px}
 .pl-card{padding:18px;margin-top:14px}
}

/* feuille de reprise */
.pl-sum{display:flex;flex-direction:column;gap:10px;margin-bottom:14px}
.pl-sum .w{font:700 19px/1.2 var(--f-display);letter-spacing:-.02em}
.pl-sum .w span{color:var(--mut);font-weight:600}
.pl-tools{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:14px 0 4px}
.pl-cnt{font-size:13px;color:var(--mut);margin-left:auto}
.pl-r{display:grid;grid-template-columns:32px minmax(0,1fr) minmax(0,1.3fr) auto;gap:10px;align-items:center;padding:8px 0;border-top:1px solid var(--line)}
.pl-r:first-child{border-top:0}
.pl-hb{display:flex;align-items:center;gap:8px;height:42px;padding:0 10px 0 6px;border-radius:var(--r-sm);box-shadow:inset 0 0 0 1px var(--line);text-align:left;min-width:0;width:100%;position:relative;overflow:hidden;transition:background var(--t-2)}
.pl-hb:hover{background:var(--surface-2)}
.pl-hb .tx{min-width:0;flex:1;display:flex;flex-direction:column;line-height:1.25}
.pl-hb .tx b{font-size:13px;font-weight:650}
.pl-hb .tx span{font-size:13px;color:var(--mut)}
.pl-hb.warn{background:var(--warn-pale);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--warn) 40%,transparent)}.pl-hb.warn .tx span{color:var(--warn);font-weight:600}
.pl-hb.bad{background:var(--bad-pale);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--bad) 40%,transparent)}.pl-hb.bad .tx span{color:var(--bad);font-weight:600}
.pl-hb.none{box-shadow:inset 0 0 0 1.5px var(--line-2);border-style:dashed;color:var(--mut);justify-content:center;font-size:13px;font-weight:600;padding:0 10px;background:var(--surface-2)}
.pl-hb.think::after{content:"";position:absolute;inset:0;background:linear-gradient(90deg,transparent,color-mix(in srgb,var(--acc) 26%,transparent),transparent);background-size:200% 100%;animation:skel .7s linear infinite}
.pl-hb.think>*{opacity:.35}
.pl-hb .strass{width:9px;height:9px}
.pl-att{display:flex;gap:4px}
.pl-att button{width:34px;height:34px;border-radius:9px;font-size:13px;font-weight:700;color:var(--mut);box-shadow:inset 0 0 0 1px var(--line);display:grid;place-items:center;transition:background var(--t-1),color var(--t-1),transform var(--t-1) var(--e-out)}
.pl-att button:active{transform:scale(.94)}
.pl-att button[aria-pressed="true"][data-att="p"]{background:var(--ok-pale);color:var(--ok);box-shadow:inset 0 0 0 1.5px var(--ok)}
.pl-att button[aria-pressed="true"][data-att="a"]{background:var(--bad-pale);color:var(--bad);box-shadow:inset 0 0 0 1.5px var(--bad)}
.pl-att button[aria-pressed="true"][data-att="e"]{background:var(--warn-pale);color:var(--warn);box-shadow:inset 0 0 0 1.5px var(--warn)}
.pl-pick{grid-column:1/-1;display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;padding:2px 2px 6px;animation:fade var(--t-3) var(--e-out) both}
.pl-hc{flex:none;display:flex;align-items:center;gap:8px;padding:6px 12px 6px 6px;border-radius:var(--r-sm);box-shadow:inset 0 0 0 1px var(--line);text-align:left;line-height:1.25;background:var(--surface)}
.pl-hc:hover{box-shadow:inset 0 0 0 1.5px var(--acc)}
.pl-hc b{display:block;font-size:13px}.pl-hc span.x{font-size:13px;color:var(--mut)}
.pl-hc[disabled]{opacity:.5}
.pl-p{display:flex;align-items:center;gap:10px;padding:9px 0;border-top:1px solid var(--line)}
.pl-p:first-child{border-top:0}
.app.mobile .pl-r{grid-template-columns:32px minmax(0,1fr) auto;row-gap:8px;padding:10px 0}
.app.mobile .pl-r .pl-hb{grid-column:1/-1;grid-row:2;height:44px}
.app.mobile .pl-att button{width:40px;height:40px}

`);

/* ---------- Données propres au planning ---------- */
var COL={s02:'var(--c1)',s03:'var(--c6)',s04:'var(--c3)',s08:'var(--c5)',c01:'var(--c4)',c02:'var(--c2)',c03:'var(--c7)'};
function col(id){return COL[id]||(/^m/.test(id)?'var(--c7)':'var(--mut-2)')}
var FX=(function(f){f=f||{};var pt=f.paulineToday||[{at:'11:15',arena:'a2'},{at:'12:15',arena:'a2'}];return {pauline:pt,hersage:f.hersage||{at:'13:30',arena:'a2'}}})(D.facts);
D.planExtras=D.planExtras||[
 /* journée de Pauline et hersage : faits de référence partagés (D.facts) */
 {id:'x01',dow:2,start:FX.pauline[0].at,dur:60,title:'Cours particulier CSO',coach:'c01',arena:FX.pauline[0].arena,cap:1,riders:['m001'],horses:{m001:'h01'},wait:0,kind:'particulier'},
 {id:'x08',dow:2,start:FX.pauline[1].at,dur:60,title:'Cours collectif CSO',coach:'c01',arena:FX.pauline[1].arena,cap:6,riders:['m066','m078','m083','m091'],horses:{},wait:0,kind:'particulier'},
 {id:'x02',dow:2,start:FX.hersage.at,dur:45,title:'Hersage de la carrière',coach:'s07',arena:FX.hersage.arena,cap:0,riders:[],horses:{},wait:0,kind:'entretien'},
 {id:'x03',dow:4,start:'18:00',dur:60,title:'Cours particulier dressage',coach:'c02',arena:'a2',cap:1,riders:['m014'],horses:{},wait:0,kind:'particulier'},
 {id:'x04',dow:3,start:'09:00',dur:45,title:'Longe, Opale reprend le travail',coach:'s06',arena:'a4',cap:0,riders:[],horses:{},wait:0,kind:'travail'},
 {id:'x05',dow:2,start:'15:30',dur:30,title:'Longe, Hermès',coach:'s06',arena:'a4',cap:0,riders:[],horses:{},wait:0,kind:'travail'},
 {id:'x06',dow:5,start:'10:00',dur:60,title:'Travail à pied, éthologie',coach:'c03',arena:'a4',cap:4,riders:['m023','m031','m047'],horses:{},wait:0,kind:'particulier'},
 {id:'x07',dow:6,start:'11:30',dur:60,title:'Cours particulier CSO',coach:'c01',arena:'a2',cap:2,riders:['m052','m066'],horses:{},wait:0,kind:'particulier'}];
D.planStages=D.planStages||[
 {id:'v01',start:'10:00',dur:120,title:'Stage de Noël, Galops 1 à 4',coach:'s03',arena:'a1',cap:12,riders:D.members.slice(12,21).map(function(m){return m.id}),horses:{},wait:0,kind:'stage'},
 {id:'v02',start:'14:00',dur:120,title:'Stage de Noël, perfectionnement CSO',coach:'s04',arena:'a1',cap:8,riders:D.members.slice(60,67).map(function(m){return m.id}),horses:{},wait:0,kind:'stage'}];
D.planHolidays=D.planHolidays||[{d:'2026-11-11',n:'Armistice 1918',keep:false},{d:'2026-12-25',n:'Noël',keep:false},{d:'2027-01-01',n:'Jour de l’an',keep:false},{d:'2027-03-29',n:'Lundi de Pâques',keep:true},{d:'2027-05-01',n:'Fête du travail',keep:false},{d:'2027-05-06',n:'Ascension',keep:true}];
D.planVacations=D.planVacations||[{from:'2026-12-19',to:'2027-01-03',n:'Vacances de Noël',stages:2,off:5},{from:'2027-02-20',to:'2027-03-07',n:'Vacances d’hiver',stages:0,off:14},{from:'2027-04-17',to:'2027-05-02',n:'Vacances de printemps',stages:0,off:22}];
var club=D.horses.filter(function(h){return h.kind==='club'});
function unav(h){if(h.kind!=='club')return 'Cheval de propriétaire';if(h.status==='bad')return /colique/i.test(h.alerts[0])?'Colique, surveillé':'Boiterie, arrêté';if((h.alerts||[]).some(function(a){return /repos/i.test(a)}))return 'Au repos';return ''}
function di(l){return (l.dow+6)%7}
function kindOf(l){return l.kind||(/Stage/.test(l.title)?'stage':/Balade/.test(l.title)?'balade':'reprise')}
function lv(l){var t=l.title,m;if(/Baby|Poney/i.test(t))return 'poney';if(/Adultes/.test(t))return 'adultes';m=t.match(/Galops? (\d)/);if(m&&!/Stage/.test(t))return +m[1]<=2?'g12':+m[1]<=4?'g34':'g57';return 'perf'}
var LV=[['','Tous niveaux'],['poney','Baby et poney'],['g12','Galops 1 et 2'],['g34','Galops 3 et 4'],['g57','Galops 5 à 7'],['adultes','Adultes'],['perf','Perfectionnement et stages']];
function lvName(l){var k=lv(l);return (LV.find(function(x){return x[0]===k})||LV[6])[1]}

var ST={view:'week',off:0,day:TDI,coach:'',arena:'',lvl:'',moves:{},cx:{},att:{},closed:{},created:[],auto:{},notes:{},tab:'montoir',landed:null,prop:{},alert:{}};
function ALL(off){return (ST.gen&&off!=null&&ST.gen.off===off?ST.gen.list:D.lessons).concat(D.planExtras,ST.created)}
/* réservations de pistes des propriétaires (D.trackBookings), affichées comme des créneaux du planning */
function tbLesson(b){var h=D.horse(b.horse),s=mn(b.from),e=mn(b.to);return {id:b.id,dow:0,start:b.from,dur:Math.max(30,e-s),title:'Piste réservée'+(h?', '+h.name.split(' ')[0]:''),coach:b.who,arena:b.arena,cap:0,riders:[],horses:{},wait:0,kind:'resa',tb:b}}
function holiday(iso){return D.planHolidays.find(function(h){return h.d===iso&&!h.keep})}
function vacation(iso){return D.planVacations.find(function(v){return iso>=v.from&&iso<=v.to})}
function dateOf(d,off){return D.day(-1+d+7*off)}
function weekEvents(off){var out=[];
 for(var d=0;d<7;d++){(function(d){var date=dateOf(d,off),iso=D.iso(date),hol=holiday(iso),vac=vacation(iso);if(hol)return;
  ALL(off).forEach(function(l){var mv=ST.moves[l.id]||{},ld=mv.d!=null?mv.d:di(l),k=kindOf(l);if(ld!==d)return;if(vac&&k==='reprise')return;if(l.once!=null&&l.once!==off)return;
   out.push({l:l,d:d,date:date,s:mv.s!=null?mv.s:mn(l.start),dur:l.dur,arena:mv.a||l.arena,coach:l.coach,k:k,cx:!!ST.cx[l.id+'@'+off]})});
  (D.trackBookings||[]).forEach(function(b){if(b.date!==iso)return;var l=tbLesson(b);out.push({l:l,d:d,date:date,s:mn(b.from),dur:l.dur,arena:b.arena,coach:b.who,k:'resa',cx:false})});
  if(vac&&d<4)D.planStages.forEach(function(l){out.push({l:l,d:d,date:date,s:mn(l.start),dur:l.dur,arena:l.arena,coach:l.coach,k:'stage',cx:!!ST.cx[l.id+'@'+off]})})})(d)}
 return out.sort(function(a,b){return a.d-b.d||a.s-b.s})}
function conflicts(list){var r=[];list.forEach(function(a,i){for(var j=i+1;j<list.length;j++){var b=list[j];if(a.d!==b.d||a.cx||b.cx||!(a.s<b.s+b.dur&&b.s<a.s+a.dur))continue;if(a.k==='resa'&&b.k==='resa')continue;
  if(a.arena===b.arena&&a.k!=='balade'&&b.k!=='balade')r.push({a:a,b:b,t:'piste'});else if(a.coach===b.coach)r.push({a:a,b:b,t:'moniteur'})}});return r}
function busy(d,s,dur,coach,ar,skip){var r=[];weekEvents(ST.off).forEach(function(e){if(e.d!==d||e.cx||e.l.id===skip||!(e.s<s+dur&&s<e.s+e.dur))return;
  if(ar&&e.arena===ar&&e.k!=='balade')r.push(arena(ar).name+' déjà prise par « '+e.l.title+' »');else if(coach&&e.coach===coach)r.push(D.person(coach).first+' encadre déjà « '+e.l.title+' »')});return r}
/* règle de comptage commune (comme l'accueil) : les reprises du club d'un côté, les cours de coach, stages et balades de l'autre */
function dayCnt(list){var r={rep:0,riders:0,other:0,resa:0};list.forEach(function(e){if(e.cx)return;if(e.k==='reprise'){r.rep++;r.riders+=e.l.riders.length}else if(e.k==='resa')r.resa++;else if(e.l.cap>0)r.other++});return r}
function cntTxt(c,short){if(short)return c.rep?plural(c.rep,'reprise'):c.other?plural(c.other,'séance'):'Libre';
 var t=c.rep?plural(c.rep,'reprise')+', '+plural(c.riders,'cavalier'):'';if(c.other)t+=(t?' · ':'')+plural(c.other,'autre séance','autres séances');if(c.resa)t+=(t?' · ':'')+plural(c.resa,'piste réservée','pistes réservées');return t||'Aucun créneau'}
function place(e){return e.k==='balade'?'Extérieur, forêt de Rambouillet':arena(e.arena).name}
function loads(d){var m={};weekEvents(0).forEach(function(e){if(e.d!==d||e.cx)return;Object.keys(e.l.horses||{}).forEach(function(r){var h=e.l.horses[r];if(h)m[h]=(m[h]||0)+1})});return m}
function pickHorse(r,ld,used){var m=D.member(r),small=!!m&&m.age<13,best=null,bs=1e9;
 club.forEach(function(h){if(unav(h)||used[h.id])return;var s=(ld[h.id]||0)*10+h.work/h.workMax*6+(h.work>=h.workMax?15:0)+((small!==h.pony)?(small?9:4):0);if(s<bs){bs=s;best=h}});return best}
function autoAssign(l){var ld=loads(di(l)),used={},res={};l.riders.forEach(function(r){var h=l.horses[r];if(h&&ld[h])ld[h]--});
 l.riders.forEach(function(r){var own=D.horses.find(function(h){return h.owner===r});if(own&&kindOf(l)!=='reprise'||own&&/Propriétaires/.test(l.title)){res[r]=own.id;return}
  var h=pickHorse(r,ld,used);if(h){used[h.id]=1;ld[h.id]=(ld[h.id]||0)+1;res[r]=h.id}});return res}
/* cavalerie équilibrée au départ, avec quelques anomalies réalistes sur les reprises du jour */
if(!D.planInit){D.planInit=true;
 var own=D.lessons.find(function(l){return l.id==='l04'});if(own){own.riders=D.horses.filter(function(h){return h.owner&&h.kind==='proprietaire'&&h.status!=='bad'&&!/repos/i.test(h.alerts.join(' '))}).map(function(h){return h.owner}).filter(function(v,i,a){return a.indexOf(v)===i}).slice(0,own.cap-1);own.wait=0;own.horses={};own.riders.forEach(function(r){own.horses[r]=D.horses.find(function(h){return h.owner===r}).id})}
 var pool=D.members.filter(function(m){return m.forfait!=='f5'}),WEAK={l18:5,l16:5,l08:5,l03:6};
 D.lessons.forEach(function(l,i){if(l.id==='l04')return;var tgt=WEAK[l.id]||l.cap-(i%5===0?2:i%2===0?1:0),k=(i*11)%pool.length;if(l.riders.length>tgt)l.riders=l.riders.slice(0,tgt);
  while(l.riders.length<tgt){var m=pool[k%pool.length];k+=7;if(l.riders.indexOf(m.id)<0)l.riders.push(m.id)}l.wait=l.riders.length>=l.cap?(l.wait||1+i%3):0;l.horses={}});
 D.lessons.slice().sort(function(a,b){return di(a)-di(b)||mn(a.start)-mn(b.start)}).forEach(function(l){if(l.id!=='l04')l.horses=autoAssign(l)});
 var L=function(i){return D.lessons.find(function(l){return l.id===i})},a=L('l05'),b=L('l06'),c=L('l07');
 if(a&&a.riders.length>6){a.horses[a.riders[2]]='h04';a.horses[a.riders[6]]='h06'}
 if(a&&b&&c&&b.riders.length>1&&c.riders.length>5){var x=a.horses[a.riders[0]];b.horses[b.riders[1]]=x;c.horses[c.riders[0]]=x;delete c.horses[c.riders[3]];delete c.horses[c.riders[4]];delete c.horses[c.riders[5]]}
 D.planCatch=D.members.filter(function(m){return m.forfait!=='f5'&&m.galop>0}).filter(function(m,i){return i%19===4}).slice(0,6).map(function(m,i){return {m:m.id,from:['Absence excusée du samedi 14 novembre','Reprise annulée le 11 novembre (férié)','Absence excusée du mercredi 4 novembre'][i%3],exp:[12,26,41,19,33,54][i]}});
}
function waitOf(l){if(!l.wait)return [];if(!l._w){var i0=(parseInt(l.id.slice(1),10)*7)%90;l._w=D.members.filter(function(m){return m.forfait!=='f5'&&l.riders.indexOf(m.id)<0}).slice(i0,i0+l.wait).map(function(m){return m.id})}return l._w}
function hstate(l,r,ld){var hid=l.horses[r];if(!hid)return {none:true,lvl:'none'};var h=D.horse(hid),n=ld[hid]||1,u=unav(h);
 if(h.owner===r)return h.status==='bad'?{h:h,lvl:'bad',txt:'Son cheval, à laisser au box'}:{h:h,lvl:'',txt:'Son cheval'};
 if(u)return {h:h,lvl:'bad',txt:u};
 if(n>=4)return {h:h,lvl:'bad',txt:n+' reprises ce jour, surchargé'};
 if(n===3)return {h:h,lvl:'warn',txt:'3 reprises ce jour, limite atteinte'};
 if(h.work>=h.workMax)return {h:h,lvl:'warn',txt:h.work+' h cette semaine, maximum '+h.workMax+' h'};
 return {h:h,lvl:'',txt:plural(n,'reprise')+' ce jour · '+h.work+' h sur '+h.workMax+' h'}}
function issues(l){var ld=loads(di(l));return l.riders.filter(function(r){var s=hstate(l,r,ld);return s.none||s.lvl}).length}

/* ---------- Libellés de période ---------- */
var MOL=['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'],MOS=['janv.','févr.','mars','avr.','mai','juin','juil.','août','sept.','oct.','nov.','déc.'];
function perLabel(off,short){var a=dateOf(0,off),b=dateOf(6,off),M=short?MOS:MOL;return a.getMonth()===b.getMonth()?a.getDate()+' au '+b.getDate()+' '+M[b.getMonth()]+(short?'':' '+b.getFullYear()):a.getDate()+' '+MOS[a.getMonth()]+' au '+b.getDate()+' '+MOS[b.getMonth()]+(short?'':' '+b.getFullYear())}
function weekNo(off){var n=47+off;while(n>53)n-=53;while(n<1)n+=53;return n}

/* ---------- Rendu de la grille (direction Paddock) ---------- */
/* discipline d'un créneau : couleur du bloc et filtre en puces */
var DK={init:['Initiation','hz'],perf:['Perfectionnement','tm'],cso:['CSO','mo'],dress:['Dressage','rd'],poney:['Poney','po'],ext:['Extérieur','ex'],hb:['Horse-ball','hb'],coach:['Coaching','acc'],svc:['Pistes et entretien','wk']};
function dk(e){var k=e.k,t=e.l.title;if(k==='particulier')return 'coach';if(k==='entretien'||k==='travail'||k==='resa')return 'svc';
 if(/Baby|Poney/i.test(t))return 'poney';if(/CSO|concours|Équipe/i.test(t))return 'cso';if(/Dressage|plat/i.test(t))return 'dress';if(k==='balade'||/cross|Balade/i.test(t))return 'ext';if(/Horse-ball/i.test(t))return 'hb';
 if(/débutants|Galop 1|Galop 2(?!-3)/i.test(t)&&!/Galop [3-7]/.test(t))return 'init';return 'perf'}
var ASH={a1:'Manège',a2:'Honneur',a3:'Petite carrière',a4:'Rond'};
function shortPlace(e){return e.k==='balade'?'Extérieur':ASH[e.arena]||arena(e.arena).name}
function ini(p){return p?(p.first||'')[0]+((p.last||'')[0]||''):''}
function lanes(list){var cur=null;list.sort(function(a,b){return a.s-b.s||b.dur-a.dur});
 list.forEach(function(e){if(!cur||e.s>=cur.end){cur={end:0,cols:[]}}cur.end=Math.max(cur.end,e.s+e.dur);var c=0;while(cur.cols[c]>e.s)c++;cur.cols[c]=e.s+e.dur;e.lane=c;e.grp=cur});
 list.forEach(function(e){e.lanes=e.grp.cols.length})}
function fm(e){var f=ST.fd&&Object.keys(ST.fd).length;return (!ST.coach||e.coach===ST.coach||(ST.coach==='ext'&&/^c/.test(e.coach)))&&(!ST.arena||e.arena===ST.arena)&&(!ST.lvl||lv(e.l)===ST.lvl)&&(!f||ST.fd[dk(e)])}
function isPast(e){return ST.off<0||(ST.off===0&&(e.d<TDI||(e.d===TDI&&e.s+e.dur<=NOW)))}
function horsesOf(l){return (l.riders||[]).map(function(r){var h=l.horses&&l.horses[r]&&D.horse(l.horses[r]);return h?h.name.split(' ')[0]:null}).filter(Boolean)}
/* titre court pour la grille de la semaine : le titre complet reste dans l'aperçu et la fiche */
function stitle(l,nar){var t=l.title.split(',')[0].replace(/^Cours particulier/,'Particulier').replace(/^Cours collectif/,'Collectif');return nar?(l.kind==='resa'?'Piste':t.replace(/^(Particulier|Collectif)\s+/,'Cours ')):t}
function evHTML(e,mode){var l=e.l,c=D.person(l.coach)||{first:'',last:''},n=(l.riders||[]).length,full=l.cap>0&&n>=l.cap,k=dk(e),ht=e.dur/60*HP,svc=k==='svc';
 var short=ht<HP*.62,wide=mode==='day'||mode==='mday',hs=horsesOf(l),f=l.cap>0?Math.round(n/l.cap*100):100,wk=mode==='week',nar=wk&&e.lanes>1&&!short,lng=wk&&l.title.length>14;
 var cls='pl-ev d-'+DK[k][1]+(short?' short':'')+(isPast(e)?' past':'')+(e.cx?' cx':'')+(e.conf?' conf':'')+(fm(e)?'':' dim')+(svc?' svc':'')+(ST.landed===l.id?' landed':'')+(wk?' wk':'')+(nar?' nar':'');
 var sub=e.cx?'Annulée, cavaliers prévenus':(e.k==='resa'?c.first+' '+c.last:c.first)+(mode==='mday'?' · '+shortPlace(e):'');
 var inner='<span class="t"><b>'+(wk?stitle(l,nar):l.title)+'</b>'+(e.conf?ICON('alert'):'')+(ST.closed[l.id+'@'+ST.off]?ICON('checkc'):'')+(l.cap>1&&!short&&e.lanes<2&&!wk?'<em>'+n+'/'+l.cap+'</em>':'')+'</span>';
 if(nar)inner+='<span class="m">'+(c.first&&e.k!=='resa'?'<span class="mav">'+ini(c)+'</span>':'')+(l.cap>1?'<em>'+n+'/'+l.cap+'</em>':'')+'</span>';
 else if(!short||wide)inner+='<span class="m">'+(c.first&&e.k!=='resa'?'<span class="mav">'+ini(c)+'</span>':'')+'<span class="ellip">'+sub+'</span>'+(wk&&l.cap>1&&!short?'<em>'+n+'/'+l.cap+'</em>':'')+'</span>';
 if(!short&&ht>=HP*.9&&e.lanes<2&&hs.length&&!svc&&!(lng&&ht<HP*1.4)){var hzOk=wide&&ht>=HP*1.2,mx=hzOk?6:wide?4:2;inner+=hzOk?'<span class="hz">'+hs.slice(0,mx).map(function(x){return '<span>'+HORSE_GLYPH()+x+'</span>'}).join('')+(hs.length>mx?'<span>+'+(hs.length-mx)+'</span>':'')+'</span>':'<span class="h1">'+HORSE_GLYPH()+'<span>'+(wk?hs[0]:hs.slice(0,mx).join(', '))+'</span>'+(wk?(hs.length>1?'<b>+'+(hs.length-1)+'</b>':''):(hs.length>mx?'<b>+'+(hs.length-mx)+'</b>':''))+'</span>'}
 return '<button class="'+cls+'" data-ev="'+l.id+'" data-d="'+e.d+'" data-flip="'+l.id+'@'+e.d+'" style="--f:'+f+'%;--l:'+(e.lane/e.lanes)+';--w:'+(1/e.lanes)+';top:'+((e.s-H0*60)/60*HP)+'px;height:'+ht+'px" aria-label="'+F.esc(l.title+', '+DNL[e.d]+' '+hm(e.s)+', '+place(e))+'"><span class="in">'+inner+'</span></button>'}
function gridHTML(cols,mode){/* cols:[{head, cls, evs, off, now, key}] */
 var g='<div class="pl-cal" data-mode="'+mode+'">'+(mode!=='mday'?'<div class="pl-calh" style="--n:'+cols.length+'"><span></span>'+cols.map(function(c){return c.head}).join('')+'</div>':'')+
  '<div class="pl-calb" style="--n:'+cols.length+';--hp:'+HP+'px"><div class="pl-hrs" style="height:'+(H1-H0)*HP+'px">';
 for(var hh=H0;hh<H1;hh++)g+='<span style="top:'+((hh-H0)*HP+(hh===H0?12:0))+'px">'+hh+' h</span>';
 if(cols.some(function(c){return c.now}))g+='<span class="nowt" style="top:'+((NOW-H0*60)/60*HP)+'px">9 h 41</span>';
 g+='</div>'+cols.map(function(c,i){lanes(c.evs);return '<div class="pl-col '+(c.cls||'')+'" data-col="'+i+'" style="height:'+(H1-H0)*HP+'px">'+(c.off?'<div class="pl-off">'+ICON('holiday','sm')+'<b>'+c.off[0]+'</b>'+c.off[1]+'</div>':'')+c.evs.map(function(e){return evHTML(e,mode)}).join('')+(c.now?'<div class="pl-now" style="top:'+((NOW-H0*60)/60*HP)+'px"></div>':'')+'</div>'}).join('')+'</div>';
 if(mode!=='mday')g+='<div class="pl-calf">'+ICON('swap','sm')+'<span>'+(mode==='day'?'Glissez une reprise vers une autre piste ou un autre horaire. Sélectionnez un créneau vide pour créer une reprise sur cette piste.':'Glissez une reprise pour la déplacer : Stabl vérifie le moniteur et la piste avant le lâcher. Sélectionnez un créneau vide pour en créer une.')+'</span></div>';
 return g+'</div>'}
function rowHTML(e){var l=e.l,c=D.person(l.coach)||{first:'',last:''},n=(l.riders||[]).length,full=l.cap>0&&n>=l.cap,k=dk(e);
 return '<div class="pl-row d-'+DK[k][1]+(e.cx?' cx':'')+(isPast(e)?' past':'')+'" role="button" tabindex="0" data-ev="'+l.id+'" data-d="'+e.d+'" data-flip="'+l.id+'@'+e.d+'"><span class="tm">'+hm(e.s)+'<small>'+e.dur+' min</small></span><span class="st"></span>'+
  '<span class="bd"><b class="ellip">'+l.title+'</b><span class="mut ellip">'+(e.cx?'Annulée · ':'')+c.first+' '+c.last+' · '+place(e)+'</span></span>'+
  '<span class="hide-s">'+(l.cap>0?'<span class="chip d">'+DK[k][0]+'</span>':'<span class="chip line">'+(e.k==='entretien'?'Entretien':e.k==='resa'?'Réservation de piste':'Travail du cheval')+'</span>')+'</span><span class="hide-s">'+(n?U.avs(l.riders,4):'')+'</span>'+
  '<span class="wt">'+(e.conf?U.chip('Conflit','bad',true):l.cap>0?'<span class="pl-fill'+(full?' full':'')+'">'+n+'/'+l.cap+(l.wait?' +'+l.wait:'')+'</span>':'')+'</span>'+ICON('right','sm')+'</div>'}
function tlHTML(evs,d,weekH){/* frise d'occupation des pistes pour un jour */
 var span=(H1-H0)*60,h='';AR.forEach(function(a){var list=evs.filter(function(e){return e.d===d&&e.arena===a.id&&!e.cx&&e.k!=='balade'}),mins=list.reduce(function(s,e){return s+e.dur},0);
  h+='<div class="pl-tl"><div style="min-width:0"><div class="b ellip">'+a.name+'</div><div class="xs mut ellip">'+a.kind+' · '+a.size+'</div></div><div class="tr">'+list.map(function(e,i){return '<i class="d-'+DK[dk(e)][1]+'" style="left:'+((e.s-H0*60)/span*100)+'%;width:calc('+(e.dur/span*100)+'% - 2px);animation-delay:'+(i*60)+'ms" title="'+F.esc(e.l.title+' · '+hm(e.s))+'"></i>'}).join('')+(ST.off===0&&d===TDI?'<u style="left:'+((NOW-H0*60)/span*100)+'%"></u>':'')+'</div>'+
   '<div class="num" style="text-align:right;min-width:64px"><b>'+(mins?dh(mins/60):'0 h')+'</b>'+(weekH?'<div class="xs mut">'+dh(weekH[a.id])+' / sem.</div>':'')+'</div></div>'});
 return h+'<div class="pl-ax"><div>'+[9,12,15,18,20].map(function(x,i,a){return '<span style="left:'+((x-H0)/(H1-H0)*100)+'%'+(i===0?'':i===a.length-1?';translate:-100% 0':';translate:-50% 0')+'">'+x+NB+'h</span>'}).join('')+'</div></div>'}
/* FLIP partagé entre semaine, jour et liste */
function flipFirst(root){var m={};$$('[data-flip]',root).forEach(function(e){m[e.getAttribute('data-flip')]=e.getBoundingClientRect()});return m}
function flipPlay(root,m,scale){if(P.RM||!m)return;$$('[data-flip]',root).forEach(function(e){var a=m[e.getAttribute('data-flip')],b=e.getBoundingClientRect();if(!b.width)return;
  if(!a){e.animate([{opacity:0,transform:'scale(.9)'},{opacity:1,transform:'none'}],{duration:420,easing:'cubic-bezier(.16,1,.3,1)',delay:120,fill:'backwards'});return}
  var dx=a.left-b.left,dy=a.top-b.top,sx=a.width/(b.width||1),sy=a.height/(b.height||1);if(Math.abs(dx)<1&&Math.abs(dy)<1&&Math.abs(sx-1)<.01&&Math.abs(sy-1)<.01)return;
  e.animate([{transformOrigin:'0 0',transform:'translate('+dx+'px,'+dy+'px)'+(scale?' scale('+sx+','+sy+')':'')},{transformOrigin:'0 0',transform:'none'}],{duration:560,easing:'cubic-bezier(.2,.9,.25,1.05)'})})}

var redraw=function(){};
P.mod({id:'planning',role:'gerant',group:'Club',title:'Planning',icon:'planning',n:10,phoneTitle:'Planning',short:'Planning',
 badge:function(){var n=conflicts(weekEvents(0)).length;return n?{v:n,hot:true}:null},
 render:function(el,ctx){var first=true,pop=null,popT=null,selBox=null;
  function draw(o){o=o||{};var mob=P.isMobile();HP=mob?76:92;closePop();
   var evs=weekEvents(ST.off),cf=conflicts(evs);cf.forEach(function(c){c.a.conf=c.b.conf=true});
   var teach=evs.filter(function(e){return e.l.cap>0&&!e.cx}),places=0,ins=0,wait=0;teach.forEach(function(e){places+=e.l.cap;ins+=e.l.riders.length;wait+=e.l.wait||0});
   var pct=places?Math.round(ins/places*100):0,dDate=dateOf(ST.day,ST.off),vacW=vacation(D.iso(dateOf(2,ST.off))),dc=dayCnt(evs),nf=(ST.coach?1:0)+(ST.arena?1:0)+(ST.lvl?1:0);
   var view=mob?(ST.mview||'day'):ST.view;
   var m=o.flip?flipFirst(el):null,keepY=el.parentNode?el.parentNode.scrollTop:0;
   /* en-tête */
   var lab=view==='day'?cap1(F.dateL(dDate)):cap1(perLabel(ST.off,mob));
   var h='<div class="pl-ph"><div class="pl-ttl">'+(mob?'':'<h1>Planning</h1>')+'<div class="pl-nav"><button class="btn ghost icon" data-nav="-1" title="'+(view==='day'?'Jour précédent':'Semaine précédente')+'">'+ICON('left')+'</button><button class="btn ghost icon" data-nav="1" title="'+(view==='day'?'Jour suivant':'Semaine suivante')+'">'+ICON('right')+'</button></div>'+
    '<span class="pl-lab">'+lab+'</span>'+(mob?'':'<span class="chip line">Semaine '+weekNo(ST.off)+'</span>')+(ST.off!==0||(view==='day'&&ST.day!==TDI)?'<button class="btn sm" data-nav="0">Aujourd’hui</button>':'')+'</div>'+
    '<div class="pl-act">'+(mob?'<div class="seg pl-seg">'+[['day','Jour'],['week','Semaine']].map(function(v){return '<button data-mview="'+v[0]+'" aria-selected="'+(view===v[0])+'">'+v[1]+'</button>'}).join('')+'</div><button class="btn icon" data-kiosk title="Écran de la sellerie">'+ICON('expand')+'</button><button class="btn icon" data-hol title="Vacances et jours fériés">'+ICON('holiday')+'</button>':
     '<div class="seg pl-seg">'+[['week','Semaine'],['day','Jour par piste'],['list','Liste']].map(function(v){return '<button data-view="'+v[0]+'" aria-selected="'+(view===v[0])+'">'+v[1]+'</button>'}).join('')+'</div>'+(mob?'':'<div class="pl-tbx"><button class="btn icon" data-kiosk title="Écran de la sellerie : le planning du jour en plein écran">'+ICON('expand')+'</button><button class="btn icon" data-hol title="Vacances et jours fériés">'+ICON('holiday')+'</button><button class="btn icon" data-gen title="Générer la semaine type">'+ICON('repeat')+'</button></div>')+'<button class="btn pri" data-new>'+ICON('plus','sm')+'Nouvelle reprise</button>')+'</div></div>';
   /* chiffres de la semaine */
   h+='<div class="pl-sub"><div class="pl-stats scroll-x">'+[['rd','planning',dc.rep,dc.rep>1?'reprises':'reprise'],['rd','members',ins,'cavaliers'],['hz','checkc',pct+' %','remplies'],['mo','hourglass',wait,'en attente'],['tm','user',places-ins,'places libres']].map(function(x,j){return '<span class="pl-stt d-'+x[0]+'" style="--j:'+j+'"><span class="si">'+ICON(x[1],'sm')+'</span><b class="num">'+x[2]+'</b>'+x[3]+'</span>'}).join('')+
    (cf.length?'<button class="pl-stt d-cr hot" data-conf><span class="si">'+ICON('alert','sm')+'</span><b class="num">'+cf.length+'</b>'+(cf.length>1?'conflits':'conflit')+'</button>':'<span class="pl-stt d-hz"><span class="si">'+ICON('check','sm')+'</span>Aucun conflit</span>')+'</div></div>';
   if(vacW||ST.gen&&ST.gen.off===ST.off)h+='<div class="note" style="margin-bottom:14px">'+ICON(vacW?'holiday':'repeat','sm')+'<span>'+(vacW?'<b>'+vacW.n+'</b> : les reprises hebdomadaires sont suspendues, les stages prennent le relais.':'Semaine type générée : vérifiez puis publiez.')+'</span></div>';
   /* filtres en puces : disciplines, moniteurs, pistes et niveaux */
   var hrs={};evs.forEach(function(e){if(e.l.cap>0&&!e.cx){var kk=/^c/.test(e.coach)?'ext':e.coach;hrs[kk]=(hrs[kk]||0)+e.dur/60}});
   var present={};evs.forEach(function(e){present[dk(e)]=1});
   h+='<div class="pl-fbar scroll-x" role="group" aria-label="Filtres">'+Object.keys(DK).filter(function(k){return present[k]}).map(function(k){return '<button class="tag pl-chip d-'+DK[k][1]+'" data-fd="'+k+'" aria-pressed="'+!!(ST.fd&&ST.fd[k])+'"><i></i>'+DK[k][0]+'</button>'}).join('')+'<span class="pl-sepv brk"></span>'+
    [['s02'],['s03'],['s04'],['s08'],['ext']].filter(function(x){return hrs[x[0]]}).map(function(x){var p=x[0]==='ext'?null:D.person(x[0]);return '<button class="tag pl-chip d-acc" data-coach="'+x[0]+'" aria-pressed="'+(ST.coach===x[0])+'" title="Afficher seulement '+(p?p.first+' '+p.last:'les coachs extérieurs')+'">'+(p?U.av(p,'sm'):'<span class="av sm" style="--c:var(--mo)">'+ICON('coach','sm')+'</span>')+(p?p.first:'Coachs extérieurs')+'<small>'+dh(hrs[x[0]])+'</small></button>'}).join('')+
    '<span class="pl-sepv"></span><button class="tag pl-chip" data-filt aria-pressed="'+(!!ST.arena||!!ST.lvl)+'">'+ICON('filter','sm')+'Pistes et niveaux'+(ST.arena||ST.lvl?'<small>'+((ST.arena?1:0)+(ST.lvl?1:0))+'</small>':'')+'</button>'+
    (nf||(ST.fd&&Object.keys(ST.fd).length)?'<button class="btn ghost sm" data-clear>'+ICON('x','sm')+'Tout afficher</button>':'')+'</div>';
   var strip='<div class="pl-strip">'+DN.map(function(n,i){var dt=dateOf(i,ST.off),k=evs.filter(function(e){return e.d===i&&e.l.cap>0}).length;return '<button data-pday="'+i+'" aria-pressed="'+(i===ST.day)+'" class="'+(ST.off===0&&i===TDI?'today':'')+'"><span>'+n+'</span><b>'+dt.getDate()+'</b><span class="dots">'+(k?Array(Math.min(k,4)+1).join('<i></i>'):'<i style="opacity:0"></i>')+'</span></button>'}).join('')+'</div>';
   if(mob){
    if(view==='day'){var dayE=evs.filter(function(e){return e.d===ST.day}),hol=holiday(D.iso(dDate)),nxt=ST.off===0&&ST.day===TDI?dayE.find(function(e){return e.s+e.dur>NOW&&e.l.riders.length&&!e.cx}):null;
     h+=strip;
     if(nxt){var nk=DK[dk(nxt)][1];h+='<div class="card tint pl-next d-'+nk+'"><div class="pl-nk">Prochaine reprise · dans '+(nxt.s-NOW)+' min</div><h3>'+nxt.l.title+'</h3><div class="s">'+hm(nxt.s)+' · '+D.name(nxt.l.coach)+' · '+place(nxt)+' · '+plural(nxt.l.riders.length,'cavalier')+'</div><div class="hrow"><button class="btn pri" data-ev="'+nxt.l.id+'" data-d="'+nxt.d+'">'+ICON('check','sm')+'Faire l’appel</button><button class="btn" data-ev="'+nxt.l.id+'" data-d="'+nxt.d+'">'+HORSE_GLYPH()+'Chevaux</button></div></div>'}
     h+=hol?'<div class="card">'+U.empty('holiday',hol.n,'Reprises suspendues, un rattrapage est crédité à chaque cavalier.')+'</div>':gridHTML([{evs:dayE,now:ST.off===0&&ST.day===TDI,cls:ST.off===0&&ST.day===TDI?'today':''}],'mday');
     h+='<div class="card pl-card"><div class="pl-ch"><span class="ico d-tm">'+ICON('arena')+'</span><h3>Occupation des pistes</h3><span class="mut s">'+cap1(DNL[ST.day])+'</span></div>'+tlHTML(evs,ST.day)+'</div>'}
    else{var any=false;h+='<div class="pl-ag">';DN.forEach(function(n,i){var list=evs.filter(function(e){return e.d===i&&fm(e)}),dt=dateOf(i,ST.off),hol=holiday(D.iso(dt));if(!list.length&&!hol)return;any=true;
      h+='<div class="pl-agd"><h3>'+cap1(F.dateL(dt))+(ST.off===0&&i===TDI?' <small class="tod">aujourd’hui</small>':'')+'<small>'+(hol?hol.n:cntTxt(dayCnt(list),true))+'</small></h3>'+list.map(function(e){var l=e.l,k=dk(e),n=l.riders.length;return '<button class="pl-agc d-'+DK[k][1]+(isPast(e)?' past':'')+(e.cx?' cx':'')+'" data-ev="'+l.id+'" data-d="'+e.d+'" data-flip="'+l.id+'@'+e.d+'"><span class="tm">'+hm(e.s)+'<small>'+e.dur+' min</small></span><span style="min-width:0"><span class="tt">'+l.title+(e.conf?' '+ICON('alert','sm'):'')+'</span><span class="mm">'+(D.person(l.coach)||{first:''}).first+' · '+shortPlace(e)+(horsesOf(l).length?' · '+horsesOf(l).slice(0,2).join(', ')+'…':'')+'</span></span>'+(l.cap>1?'<span class="pl-fill">'+n+'/'+l.cap+'</span>':'')+'</button>'}).join('')+'</div>'});
     h+=(any?'':U.empty('filter','Aucune reprise ne correspond aux filtres','Élargissez la recherche pour retrouver vos créneaux.','<button class="btn sm" data-clear>Tout afficher</button>'))+'</div>'}
    h+='<button class="btn pri pl-fab" data-new>'+ICON('plus')+'Créer</button>';
   }else{
    if(view==='week'){h+=gridHTML(DN.map(function(n,i){var dt=dateOf(i,ST.off),iso=D.iso(dt),hol=holiday(iso),vac=vacation(iso),list=evs.filter(function(e){return e.d===i}),today=ST.off===0&&i===TDI,cc=dayCnt(list),lp=0,lc=0;
       list.forEach(function(e){if(e.k==='reprise'&&!e.cx){lp+=e.l.riders.length;lc+=e.l.cap}});var p=lc?Math.round(lp/lc*100):0;
       return {head:'<button class="pl-dh'+(today?' today':'')+'" data-day="'+i+'" title="Ouvrir le '+F.dateL(dt)+' par piste · '+cntTxt(cc)+'"><span class="dn">'+DNL[i]+'</span><span class="dd"><b>'+dt.getDate()+'</b></span><span class="dm">'+(hol?'Férié':vac&&!list.length?'Vacances':cntTxt(cc,true)+(lc?' · '+p+' %':''))+'</span><span class="fl"><i style="--f:'+p+'%"></i></span></button>',cls:(today?'today':'')+(hol||(vac&&!list.length)?' off':''),evs:list,now:today,off:hol?[hol.n,'Reprises suspendues, rattrapages crédités']:(vac&&!list.length?[vac.n,'Pas de reprise']:null)}}),'week')}
    else if(ST.view==='day'){var out=evs.filter(function(e){return e.d===ST.day&&e.k==='balade'}),holD=holiday(D.iso(dDate));
      h+=strip+gridHTML(AR.map(function(a){var list=evs.filter(function(e){return e.d===ST.day&&e.arena===a.id&&e.k!=='balade'}),mins=list.reduce(function(s,e){return s+(e.cx?0:e.dur)},0);
       return {head:'<div class="pl-arh"><span class="ico sm d-tm">'+ICON('arena','sm')+'</span><span style="min-width:0;flex:1"><b class="ellip">'+a.name+'</b><span class="ellip">'+a.kind+' · '+(mins?dh(mins/60)+' réservées':'libre')+'</span><span class="fl"><i style="--f:'+Math.min(100,mins/300*100)+'%"></i></span></span></div>',cls:(holD?'off':'')+(ST.off===0&&ST.day===TDI?' today':''),evs:list,now:ST.off===0&&ST.day===TDI,off:holD?[holD.n,'Reprises suspendues']:null}}),'day');
      if(out.length)h+='<div class="pl-out">'+ICON('route','sm')+'<span>Hors des pistes ce jour-là :</span>'+out.map(function(e){return '<button class="tag d-ex" aria-pressed="true" data-ev="'+e.l.id+'" data-d="'+e.d+'">'+e.l.title+' · '+hm(e.s)+'</button>'}).join('')+'</div>'}
    else{var any2=false;h+='<div class="card pl-list">';DN.forEach(function(n,i){var list=evs.filter(function(e){return e.d===i&&fm(e)}),dt=dateOf(i,ST.off),hol=holiday(D.iso(dt));if(!list.length&&!hol)return;any2=true;
       h+='<div class="pl-day"><b>'+cap1(F.dateL(dt))+'</b><span class="mut">'+(hol?hol.n+', reprises suspendues':cntTxt(dayCnt(list)))+'</span>'+(ST.off===0&&i===TDI?U.chip('Aujourd’hui','acc',true):'')+'</div>'+list.map(rowHTML).join('')});
      if(!any2)h+=U.empty('filter','Aucune reprise ne correspond aux filtres','Élargissez la recherche pour retrouver vos créneaux.','<button class="btn sm" data-clear>Tout afficher</button>');h+='</div>'}
    /* sous le calendrier */
    var weekH={};AR.forEach(function(a){weekH[a.id]=evs.filter(function(e){return e.arena===a.id&&!e.cx&&e.k!=='balade'}).reduce(function(s,e){return s+e.dur},0)/60});
    /* club réel : les moniteurs et coachs qui ont des reprises cette semaine (la démo garde ses quatre moniteurs) */
    var tmIds=['s02','s03','s04','s08'].filter(function(id){return D.staffer(id)});if(!tmIds.length)evs.forEach(function(e){if(e.coach&&tmIds.indexOf(e.coach)<0&&(D.staffer(e.coach)||D.coach(e.coach)))tmIds.push(e.coach)});
    var tm=tmIds.map(function(id){var p=D.staffer(id)||D.coach(id),hh=evs.filter(function(e){return e.coach===id&&!e.cx}).reduce(function(s,e){return s+e.dur},0)/60;return {p:p,h:hh}});
    h+='<div class="pl-below'+(first?' rise':'')+'"><div class="card pl-card"><div class="pl-ch"><span class="ico d-tm">'+ICON('arena')+'</span><h3>Occupation des pistes</h3><span class="mut s">'+cap1(DNL[ST.day])+' '+dDate.getDate()+'</span></div>'+tlHTML(evs,ST.day,weekH)+'</div>'+
     '<div class="card pl-card"><div class="pl-ch"><span class="ico d-rd">'+ICON('ticket')+'</span><h3>Rattrapages</h3><button class="btn ghost sm" data-propall>Tout proposer</button></div>'+D.planCatch.slice(0,4).map(function(c){var m=D.member(c.m),sg=suggest(m);return '<div class="pl-p">'+U.av(m)+'<div class="grow" style="min-width:0"><div class="b ellip">'+m.first+' '+m.last+' <span class="mut" style="font-weight:500">· Galop '+m.galop+'</span></div><div class="s mut ellip">'+(sg?sg.txt:'Aucun créneau libre à son niveau')+' · expire dans '+c.exp+' j</div></div>'+(ST.prop[c.m]?U.chip('Proposé','ok',true):'<button class="btn sm tint d-rd" data-prop="'+c.m+'">Proposer</button>')+'</div>'}).join('')+'</div>'+
     '<div class="card pl-card"><div class="pl-ch"><span class="ico d-tm">'+ICON('team')+'</span><h3>Heures des moniteurs</h3><button class="btn ghost sm" data-go="equipe">Équipe'+ICON('arrow','sm')+'</button></div>'+tm.map(function(t){var mx=t.p.hours?Math.round(t.p.hours*.6):0;return '<div class="pl-p">'+U.av(t.p)+'<div class="grow stack" style="--g:6px;min-width:0"><div class="hrow sp"><span class="b">'+t.p.first+' '+t.p.last+'</span><span class="s num"><b>'+hm(Math.round(t.h*60))+'</b>'+(mx?' <span class="mut">sur '+mx+' h</span>':'')+'</span></div>'+(mx?U.bar(t.h/mx*100,t.h>mx?'var(--cr)':'var(--tm)'):'')+'</div></div>'}).join('')+(tm.length?'':'<p class="s mut" style="padding:4px 2px">Aucune reprise attribuée cette semaine.</p>')+'</div></div>'}
   el.innerHTML=h;bind(evs,cf);
   if(o.flip)flipPlay(el,m,o.scale);
   if(o.slide&&!P.RM){var cal=$('.pl-cal,.pl-ag,.pl-list',el);if(cal)cal.animate([{opacity:0,transform:'translateX('+(o.slide*40)+'px)'},{opacity:1,transform:'none'}],{duration:420,easing:'cubic-bezier(.16,1,.3,1)'})}
   if(o.keep&&el.parentNode)el.parentNode.scrollTop=keepY;
   first=false;ST.landed=null}
  function suggest(m){var k=m.galop<=2?'g12':m.galop<=4?'g34':'g57',e=weekEvents(0).find(function(e){return (e.d>TDI)&&e.k==='reprise'&&lv(e.l)===k&&e.l.riders.length<e.l.cap&&e.l.riders.indexOf(m.id)<0});return e?{e:e,txt:DNL[e.d]+' '+hm(e.s)+', '+e.l.title}:null}
  /* survol détaillé d'un bloc */
  function closePop(){clearTimeout(popT);if(pop)pop.classList.remove('on')}
  function showPop(b,evs){var e=evs.find(function(x){return x.l.id===b.getAttribute('data-ev')&&x.d===+b.getAttribute('data-d')});if(!e)return;var l=e.l,k=dk(e),c=D.person(l.coach),n=l.riders.length,ld=loads(e.d);
   var root=P.app();if(!pop||!root.contains(pop)){pop=document.createElement('div');pop.className='pl-pop';root.appendChild(pop)}pop.setAttribute('data-transient','');
   pop.className='pl-pop d-'+DK[k][1];
   pop.innerHTML='<div class="pk">'+DK[k][0]+(isPast(e)?' · terminée':'')+(e.cx?' · annulée':'')+'</div><h4>'+l.title+'</h4><div class="pm">'+cap1(DNL[e.d])+' · '+hm(e.s)+' à '+hm(e.s+e.dur)+' · '+place(e)+'</div>'+
    (c?'<div class="pc">'+U.av(c,'sm')+c.first+' '+c.last+'</div>':'')+
    (l.cap>1?'<div class="pf"><div class="pr"><span><b>'+n+'</b> cavaliers sur '+l.cap+'</span><span class="mut">'+(l.wait?l.wait+' en attente':plural(l.cap-n,'place libre','places libres'))+'</span></div><div class="pbar"><i style="--f:'+Math.round(n/l.cap*100)+'%"></i></div></div>':'')+
    (n&&l.horses?'<div class="hl">'+l.riders.slice(0,8).map(function(r){var s=hstate(l,r,ld);return s.none?'<span class="hc none">À attribuer</span>':'<span class="hc '+(s.lvl||'')+'" title="'+F.esc(s.txt)+'">'+HORSE_GLYPH()+s.h.name.split(' ')[0]+'</span>'}).join('')+(n>8?'<span class="hc">+'+(n-8)+'</span>':'')+'</div>':'')+
    (e.conf?'<div class="pw">'+ICON('alert','sm')+'Conflit de piste ou de moniteur</div>':'')+
    '<div class="ph2">'+(e.k==='resa'||e.k==='stage'&&/^v/.test(l.id)?'Cliquez pour ouvrir':'Cliquez pour ouvrir · glissez pour déplacer')+'</div>';
   var ar=root.getBoundingClientRect(),r=b.getBoundingClientRect(),x=r.right-ar.left+10,y=r.top-ar.top;
   if(x+340>ar.width)x=r.left-ar.left-340;pop.style.left=Math.max(8,x)+'px';pop.style.top='0px';pop.classList.add('on');
   pop.style.top=Math.max(8,Math.min(y,ar.height-pop.offsetHeight-12))+'px'}
  function bind(evs,cf){
   on(el,'[data-view]',function(b){var v=b.getAttribute('data-view');if(v===ST.view)return;ST.view=v;draw({flip:true,scale:true})});
   on(el,'[data-mview]',function(b){ST.mview=b.getAttribute('data-mview');draw({flip:true})});
   on(el,'[data-nav]',function(b){var v=+b.getAttribute('data-nav'),mob=P.isMobile(),dayV=mob?(ST.mview||'day')==='day':ST.view==='day';if(!v){ST.off=0;ST.day=TDI}else if(dayV){ST.day+=v;if(ST.day>6){ST.day=0;ST.off++}if(ST.day<0){ST.day=6;ST.off--}}else ST.off+=v;draw({slide:v,keep:true})});
   on(el,'[data-coach]',function(b){var v=b.getAttribute('data-coach');ST.coach=ST.coach===v?'':v;soft(b)});
   on(el,'[data-fd]',function(b){var k=b.getAttribute('data-fd');ST.fd=ST.fd||{};if(ST.fd[k])delete ST.fd[k];else ST.fd[k]=1;soft(b)});
   on(el,'[data-clear]',function(){ST.coach=ST.arena=ST.lvl='';ST.fd={};draw({keep:true})});
   on(el,'[data-day]',function(b){ST.day=+b.getAttribute('data-day');ST.view='day';draw({flip:true,scale:true})});
   on(el,'[data-pday]',function(b){var d=+b.getAttribute('data-pday'),dir=d>ST.day?1:-1;if(d===ST.day)return;ST.day=d;draw({slide:dir,keep:true})});
   on(el,'[data-hol]',openHolidays);on(el,'[data-new]',function(){openCreateMenu({})});on(el,'[data-kiosk]',function(){P.sellerie({focus:'reprises'})});on(el,'[data-conf]',function(){openConflicts(cf)});
   on(el,'[data-filt]',openFilters);on(el,'[data-gen]',openGenerate);
   on(el,'[data-prop]',function(b){var id=b.getAttribute('data-prop'),m=D.member(id);ST.prop[id]=1;b.outerHTML=U.chip('Proposé','ok',true);P.toast('Créneau proposé à '+m.first+' '+m.last+' par notification'+(m.minor?', ses parents sont en copie':''))});
   on(el,'[data-propall]',function(){D.planCatch.forEach(function(c){ST.prop[c.m]=1});draw({keep:true});P.toast(D.planCatch.length+' propositions de rattrapage envoyées')});
   var drag=false;
   on(el,'[data-ev]',function(b,e){if(drag)return;e.stopPropagation();closePop();openLesson(b.getAttribute('data-ev'),+b.getAttribute('data-d'))});
   on(el,'.pl-row',function(b,e){if(e.key==='Enter')openLesson(b.getAttribute('data-ev'),+b.getAttribute('data-d'))},'keydown');
   on(el,'.pl-ev',function(b){if(P.isMobile()||drag||Date.now()<ST.noPop)return;clearTimeout(popT);popT=setTimeout(function(){if(!drag)showPop(b,evs)},280)},'mouseenter');
   on(el,'.pl-ev',function(){closePop()},'mouseleave');
   var vw=el.parentNode;if(vw&&!vw._plsc){vw._plsc=1;vw.addEventListener('scroll',function(){if(pop)pop.classList.remove('on')},{passive:true})}
   /* sélection d'un créneau vide : création préremplie (heure, durée, piste) */
   function colInfo(c){var i=+c.getAttribute('data-col'),mode=$('.pl-cal',el).getAttribute('data-mode');return mode==='day'?{d:ST.day,arena:AR[i].id}:mode==='mday'?{d:ST.day}:{d:i}}
   on(el,'.pl-col',function(c,e){if(e.button||e.target!==c||c.classList.contains('off'))return;var r=c.getBoundingClientRect(),info=colInfo(c),m0=H0*60+Math.floor((e.clientY-r.top)/HP*2)*30;m0=Math.max(H0*60,Math.min(H1*60-30,m0));
    if(P.isMobile()||e.pointerType==='touch'){openCreate(Object.assign({s:m0},info));return}
    e.preventDefault();if(selBox)selBox.remove();var sb=selBox=document.createElement('div');sb.className='pl-sel';c.appendChild(sb);var m1=m0+60,moved=false;
    function paintSel(){sb.style.top=((m0-H0*60)/60*HP+2)+'px';sb.style.height=((m1-m0)/60*HP-4)+'px';sb.innerHTML='<b>Nouvelle reprise</b>'+hm(m0)+' à '+hm(m1)+(info.arena?' · '+arena(info.arena).name:'')}
    paintSel();
    function mv(f){var m=H0*60+Math.ceil((f.clientY-r.top)/HP*2)*30;m=Math.max(m0+30,Math.min(H1*60,m));if(Math.abs(f.clientY-e.clientY)>6)moved=true;if(moved){m1=m;paintSel()}}
    function up(){document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);openCreate(Object.assign({s:m0,dur:m1-m0},info));
     var iv=setInterval(function(){if(!$('.sheet',P.app())){clearInterval(iv);if(sb.parentNode)sb.remove()}},300)}
    document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up)},'pointerdown');
   /* glisser-déposer avec détection des conflits */
   on(el,'.pl-ev',function(b,e0){if(e0.button||e0.pointerType==='touch'||P.isMobile())return;var id=b.getAttribute('data-ev'),inst=evs.find(function(x){return x.l.id===id&&x.d===+b.getAttribute('data-d')});if(!inst||inst.k==='stage'&&/^v/.test(id)||inst.k==='resa')return;
     var mode=$('.pl-cal',el).getAttribute('data-mode'),cols=$$('.pl-col',el),r0=b.getBoundingClientRect(),gy=e0.clientY-r0.top,sx=e0.clientX,sy=e0.clientY,ghost=null,tgt=null,moved=false,tag=null;
     function mv(e){var dx=e.clientX-sx,dy=e.clientY-sy;if(!moved){if(Math.abs(dx)+Math.abs(dy)<6)return;moved=drag=true;closePop();b.classList.add('drag');ghost=document.createElement('div');ghost.className='pl-drop';tag=document.createElement('span');tag.className='pl-tag';b.appendChild(tag)}
      b.style.transform='translate('+dx+'px,'+dy+'px)';
      var ci=cols.findIndex(function(c){var cr=c.getBoundingClientRect();return e.clientX>=cr.left&&e.clientX<cr.right});if(ci<0||cols[ci].classList.contains('off'))ci=+b.parentNode.getAttribute('data-col');
      cols.forEach(function(c,i){c.classList.toggle('tgt',i===ci)});
      var cr=cols[ci].getBoundingClientRect(),s=H0*60+Math.round((e.clientY-gy-cr.top)/HP*4)*15;s=Math.max(H0*60,Math.min(H1*60-inst.dur,s));
      var d=mode==='day'?ST.day:ci,ar=mode==='day'?AR[ci].id:inst.arena,bz=busy(d,s,inst.dur,inst.coach,inst.k==='balade'?'':ar,id);
      tgt={d:d,s:s,a:ar,bz:bz};if(ghost.parentNode!==cols[ci])cols[ci].appendChild(ghost);ghost.style.top=((s-H0*60)/60*HP+2)+'px';ghost.style.height=(inst.dur/60*HP-4)+'px';ghost.classList.toggle('bad',!!bz.length);b.classList.toggle('bad',!!bz.length);
      ghost.textContent=bz.length?'Conflit : '+bz[0]:'';tag.textContent=(mode==='day'?ASH[ar]:cap1(DNL[d]))+' · '+hm(s)+(bz.length?' · conflit':'')}
     function up(){document.removeEventListener('pointermove',mv);document.removeEventListener('pointerup',up);if(!moved)return;setTimeout(function(){drag=false},0);if(ghost)ghost.remove();if(tag)tag.remove();cols.forEach(function(c){c.classList.remove('tgt')});
      if(!tgt||tgt.bz.length||(tgt.d===inst.d&&tgt.s===inst.s&&tgt.a===inst.arena)){var cur=b.style.transform;b.classList.remove('drag','bad');b.style.transform='';if(!P.RM&&cur)b.animate([{transform:cur},{transform:'none'}],{duration:520,easing:'cubic-bezier(.34,1.56,.64,1)'});if(tgt&&tgt.bz.length)P.toast('Déplacement impossible : '+tgt.bz[0],{icon:'alert'});return}
      ST.noPop=Date.now()+1200;var prev=ST.moves[id];ST.moves[id]={d:tgt.d,s:tgt.s,a:tgt.a};ST.landed=id;draw({keep:true});var n=inst.l.riders.length;
      P.toast('« '+inst.l.title+' » déplacée au '+DNL[tgt.d]+' à '+hm(tgt.s)+(tgt.a!==inst.arena?', '+arena(tgt.a).name:'')+(n?'. '+plural(n,'cavalier')+' prévenus':''),{icon:'swap',ms:5200,undo:function(){if(prev)ST.moves[id]=prev;else delete ST.moves[id];draw({keep:true})}})}
     document.addEventListener('pointermove',mv);document.addEventListener('pointerup',up)},'pointerdown')}
  /* filtre doux : les blocs s'estompent sans tout redessiner */
  function soft(b){$$('[data-coach]',el).forEach(function(x){x.setAttribute('aria-pressed',ST.coach===x.getAttribute('data-coach'))});$$('[data-fd]',el).forEach(function(x){x.setAttribute('aria-pressed',!!(ST.fd&&ST.fd[x.getAttribute('data-fd')]))});
   if(!P.RM){b.classList.remove('pop');void b.offsetWidth;b.classList.add('pop')}
   var list=$('.pl-list,.pl-ag',el);if(list){draw({keep:true,flip:true});return}
   var evs=weekEvents(ST.off);$$('.pl-ev',el).forEach(function(x){var e=evs.find(function(v){return v.l.id===x.getAttribute('data-ev')&&v.d===+x.getAttribute('data-d')});if(e)x.classList.toggle('dim',!fm(e))});
   var any=(ST.fd&&Object.keys(ST.fd).length)||ST.coach,cl=$('.pl-fbar [data-clear]',el);if(any&&!cl)$('.pl-fbar',el).insertAdjacentHTML('beforeend','<button class="btn ghost sm" data-clear>'+ICON('x','sm')+'Tout afficher</button>'),on(el,'.pl-fbar [data-clear]',function(){ST.coach=ST.arena=ST.lvl='';ST.fd={};draw({keep:true})});else if(!any&&cl&&!ST.arena&&!ST.lvl)cl.remove()}
  redraw=function(){if(el.isConnected)draw({keep:true})};
  draw();
  if(ctx.params.id){var pid=ctx.params.id;ctx.params.id=null;var l0=ALL().find(function(l){return l.id===pid});if(l0){ST.off=0;setTimeout(function(){openLesson(pid,di(l0))},350)}}
 }});

/* ---------- Feuille d'une reprise ---------- */
function openLesson(id,d){var e=weekEvents(ST.off).find(function(x){return x.l.id===id&&(isNaN(d)||d==null||x.d===d)});if(!e)return;if(e.k==='resa'){openResa(e);return}
 var l=e.l,c=D.person(l.coach),key=l.id+'@'+ST.off,svc=e.k==='entretien'||e.k==='travail',picking=null;
 if(!ST.att[key])ST.att[key]={};var att=ST.att[key];
 var tab=svc?'slot':(ST.tab==='slot'?'montoir':ST.tab);
 var sh=P.sheet({title:l.title,icon:svc?(e.k==='entretien'?'tractor':'horse'):e.k==='stage'?'flag':'planning',wide:!svc,body:function(b){paint(b)},
  foot:svc?'<button class="btn danger" data-del>'+ICON('trash','sm')+'Supprimer le créneau</button><button class="btn pri" data-apply>Enregistrer</button>':
   '<button class="btn icon danger" data-cancel title="Annuler la reprise">'+ICON('trash')+'</button><button class="btn" data-msg>'+ICON('send','sm')+'Écrire au groupe</button><button class="btn pri" data-close>'+ICON('check','sm')+'Clôturer l’appel</button>'});
 var body=$('.sb',sh);
 function cnt(){var p=0,a=0,x=0;l.riders.forEach(function(r){var v=att[r];if(v==='p')p++;else if(v==='a')a++;else if(v==='e')x++});return {p:p,a:a,e:x,n:l.riders.length-p-a-x}}
 function hbHTML(r,ld,fresh){var s=hstate(l,r,ld);if(s.none)return '<button class="pl-hb none" data-hb="'+r+'">'+ICON('plus','sm')+'Choisir un cheval</button>';
  return '<button class="pl-hb '+s.lvl+(fresh?' pop':'')+'" data-hb="'+r+'" title="Changer de cheval">'+U.hav(s.h)+'<span class="tx"><b class="ellip">'+s.h.name+'</b><span class="ellip">'+s.txt+'</span></span>'+(fresh?'<span class="strass"></span>':s.lvl?ICON('alert','sm'):ICON('down','sm'))+'</button>'}
 function slotForm(){var mv=ST.moves[l.id]||{};return '<div class="lx-form">'+fld('Jour',sel('d',DNL.map(function(n,i){return [i,cap1(n)]}),e.d))+fld('Heure de début',sel('s',times(),e.s))+fld('Piste',sel('a',AR.map(function(a){return [a.id,a.name]}),e.arena))+fld('Encadrant',sel('c',D.staff.concat(D.coaches.filter(function(x){return x.ext})).map(function(p){return [p.id,p.first+' '+p.last]}),l.coach))+(l.cap>0?fld('Capacité',sel('cap',[4,6,8,10,12],l.cap))+fld('Récurrence',sel('rec',['Chaque semaine, hors vacances scolaires','Toutes les deux semaines','Cette semaine seulement'],'')):'')+'</div><div data-chk style="margin-top:12px"></div>'+
   (l.cap>0?'<div style="margin-top:6px">'+opt('Réservable en ligne','Les adhérents s’inscrivent depuis leur application.',true,'ls-on')+opt('Ouverte aux rattrapages','Les crédits de rattrapage donnent accès aux places libres.',true,'ls-ra')+opt('Liste d’attente automatique','La première personne en attente est inscrite dès qu’une place se libère.',true,'ls-wa')+
   opt('Prix réduit si moins de 50\u00a0% de remplissage à J-2','Les places restantes passent au prix plancher deux jours avant. Aujourd’hui '+l.riders.length+'/'+l.cap+' ('+Math.round(l.riders.length/l.cap*100)+'\u00a0%)'+(l.riders.length/l.cap<.5?' : la réduction s’appliquerait.':' : la réduction ne s’appliquerait pas.'),!!(ST.promo&&ST.promo[l.id]),'ls-pr')+
   '<div class="lx-form" style="margin-top:8px">'+fld('Prix plancher',sel('floor',['12 € la séance','15 € la séance','18 € la séance'],ST.promo&&ST.promo[l.id]?ST.promo[l.id]:'15 € la séance'))+fld('Prix habituel','<input class="in" value="22 € la séance à l’unité" disabled>')+'</div></div><div class="hrow" style="margin-top:12px"><button class="btn pri" data-apply>Appliquer les changements</button><button class="btn" data-dup>'+ICON('copy','sm')+'Dupliquer</button></div>':'')}
 function paint(b){b=b||body;var ld=loads(e.d),n=l.riders.length,k=cnt(),w=waitOf(l),iss=issues(l),au=ST.auto[key],free=l.cap-n+k.a+k.e;
  var h='<div class="pl-sum"><div class="w">'+cap1(F.dateL(e.date))+' <span>· '+hm(e.s)+' à '+hm(e.s+e.dur)+'</span></div><div class="hrow wrap" style="--g:6px"><span class="chip lg">'+U.av(c,'sm')+'&nbsp;'+c.first+' '+c.last+'</span><span class="chip lg">'+ICON('arena','sm')+place(e)+'</span>'+(l.cap>0?'<span class="chip lg">'+lvName(l)+'</span><span class="chip lg '+(n>=l.cap?'ok':'acc')+'">'+n+'/'+l.cap+' inscrits</span>':'')+(l.wait?'<span class="chip lg warn">'+l.wait+' en attente</span>':'')+(ST.promo&&ST.promo[l.id]?'<span class="chip lg acc">'+ICON('percent','sm')+'Prix réduit à J-2</span>':'')+(l.amin||l.amax?'<span class="chip lg">'+ageTxt(l)+'</span>':'')+(l.members?'<span class="chip lg">Adhérents seulement</span>':'')+(e.cx?'<span class="chip lg bad">Annulée</span>':'')+(e.conf?'<span class="chip lg bad dot">Conflit de piste</span>':'')+'</div></div>';
  if(svc){b.innerHTML=h+'<p class="s mut" style="margin-bottom:14px">'+(e.k==='entretien'?'La piste est bloquée pendant l’entretien : aucune reprise ne peut y être placée.':'Séance de travail suivie dans le carnet du cheval. Le rond de longe est réservé.')+'</p>'+slotForm();wire(b);return}
  h+=U.tabs([['montoir','Montoir et appel'],['attente','Attente et rattrapages'+(w.length?' · '+w.length:'')],['seance','Séance'],['slot','Créneau']],tab,'data-lt');
  if(tab==='montoir'){
   h+='<div class="pl-tools"><button class="btn dark" data-auto>'+ICON('horse','sm')+'Attribuer les chevaux automatiquement</button><button class="btn" data-print>'+ICON('doc','sm')+'Feuille de monte</button><button class="btn" data-kl title="Afficher cette reprise sur l’écran de la sellerie">'+ICON('expand','sm')+'Sellerie</button><span class="pl-cnt">'+(iss?'<b class="warnc">'+plural(iss,'point')+' à régler</b>':'<b class="okc">Montoir complet</b>')+'</span></div>';
   if(au)h+='<div class="lx-ai fade" style="margin:10px 0 4px">'+ICON('bulb','sm')+'<div class="grow"><b style="color:var(--ink)">'+plural(au.n,'cheval attribué','chevaux attribués')+' en '+au.ms+' s.</b> Niveau, gabarit et charge respectés : aucun cheval ne dépasse '+plural(au.max,'reprise')+' ce '+DNL[e.d]+'.'+(au.left.length?' '+au.left.join(' et ')+' '+(au.left.length>1?'restent':'reste')+' au box.':'')+'</div><button class="btn ghost sm" data-undo>Annuler</button></div>';
   h+='<div style="margin-top:8px">'+(n?l.riders.map(function(r){var m=D.member(r),v=att[r];return '<div class="pl-r" data-r="'+r+'">'+U.av(m)+'<div style="min-width:0"><div class="b s ellip">'+m.first+' '+m.last+'</div><div class="xs mut ellip">'+(m.minor?m.age+' ans · ':'')+'Galop '+m.galop+(m.balance<0?' · <span class="badc">solde '+F.eur(m.balance)+'</span>':'')+'</div></div>'+hbHTML(r,ld)+
     '<div class="pl-att" role="group" aria-label="Appel">'+[['p','Présent',ICON('check','sm')],['a','Absent',ICON('x','sm')],['e','Excusé','Exc.']].map(function(x){return '<button data-att="'+x[0]+'" aria-pressed="'+(v===x[0])+'" title="'+x[1]+'">'+x[2]+'</button>'}).join('')+'</div>'+(picking===r?pickHTML(r,ld):'')+'</div>'}).join(''):U.empty('members','Aucun inscrit pour l’instant','Ouvrez la réservation en ligne ou inscrivez un cavalier depuis la liste d’attente.'))+'</div>';
   if(n)h+='<div class="hrow sp wrap" style="margin-top:10px;padding-top:12px;border-top:1px solid var(--line)"><span class="s"><b class="okc">'+plural(k.p,'présent')+'</b> · <b class="badc">'+plural(k.a,'absent')+'</b> · <b class="warnc">'+plural(k.e,'excusé')+'</b>'+(k.n?' <span class="mut">· '+k.n+' à pointer</span>':'')+'</span><button class="btn sm" data-allp>'+ICON('check','sm')+'Tous présents</button></div>';
  }else if(tab==='attente'){var cat=D.planCatch.filter(function(x){return l.riders.indexOf(x.m)<0}).slice(0,3);
   h+='<div class="lx-h" style="margin-top:16px">Liste d’attente <span class="mut">'+(free>0?plural(free,'place disponible','places disponibles'):'reprise complète')+'</span></div>'+(w.length?w.map(function(r,i){var m=D.member(r);return '<div class="pl-p"><span class="chip">'+(i+1)+(i?'e':'re')+'</span>'+U.av(m)+'<div class="grow"><div class="b s ellip">'+m.first+' '+m.last+'</div><div class="xs mut">Galop '+m.galop+' · en attente depuis le '+F.date(D.day(-3-i*4))+'</div></div>'+(free>0?'<button class="btn sm pri" data-enrol="'+r+'">Inscrire</button>':ST.alert[key+r]?U.chip('Alerte activée','ok',true):'<button class="btn sm" data-alert="'+r+'">Prévenir si une place se libère</button>')+'</div>'}).join(''):'<p class="s mut">Personne n’attend une place sur cette reprise.</p>')+
    '<div class="lx-h">Rattrapages proposés <span class="mut">niveau compatible, crédit valide</span></div>'+cat.map(function(x){var m=D.member(x.m);return '<div class="pl-p">'+U.av(m)+'<div class="grow"><div class="b s ellip">'+m.first+' '+m.last+' <span class="mut" style="font-weight:500">· Galop '+m.galop+'</span></div><div class="xs mut ellip">'+x.from+' · crédit valable encore '+x.exp+' jours</div></div>'+(ST.prop[x.m]?U.chip('Proposé','ok',true):'<button class="btn sm" data-prop="'+x.m+'">Proposer ce créneau</button>')+'</div>'}).join('')+
    '<div style="margin-top:12px">'+opt('Ouvrir cette reprise aux rattrapages en ligne','Les cavaliers avec un crédit voient les places libres dans leur application.',true,'lr-on')+'</div>';
  }else if(tab==='seance'){var nt=ST.notes[l.id]||{th:/CSO|cross|concours/i.test(l.title)?'Enchaînement de quatre obstacles, contrat de foulées':'Transitions trot et galop, équilibre sur le cercle',tx:'Groupe homogène. Reprendre la mise en selle sans étriers dix minutes. Surveiller la position des mains au galop.'};
   var pg=progOf(l);h+='<div class="pz-prog"><span class="av sq" style="--c:var(--surface);color:var(--acc)">'+ICON('list','sm')+'</span><div class="grow" style="min-width:0"><b class="s">Programmation du trimestre</b><div class="xs mut ellip">'+(pg.saved?'Séance 1 sur 12 cette semaine · '+F.esc(pg.th[0]):'12 séances, un thème par semaine, envoyées aux cavaliers')+'</div></div><button class="btn sm '+(pg.saved?'':'pri')+'" data-prog>'+(pg.saved?ICON('edit','sm')+'Modifier':'Préparer')+'</button></div>';
   h+='<div class="stack" style="--g:12px;margin-top:16px">'+fld('Thème de la séance','<input class="in" data-k="th" value="'+F.esc(nt.th)+'">')+fld('Notes du moniteur','<textarea class="in" data-k="tx" rows="4">'+F.esc(nt.tx)+'</textarea>')+'<div class="hrow"><button class="btn pri" data-save>Enregistrer les notes</button><button class="btn" data-share>'+ICON('send','sm')+'Partager le compte rendu aux cavaliers</button></div></div>'+
    '<div class="lx-h">Séances précédentes</div><div class="tl"><div class="ev"><div class="b s">'+F.date(D.day(e.d-TDI-7))+' · Travail sur des barres au sol</div><div class="s mut">'+c.first+' : bon rythme, deux cavaliers à revoir sur le regard dans les courbes.</div></div><div class="ev"><div class="b s">'+F.date(D.day(e.d-TDI-14))+' · Mise en selle et voltes</div><div class="s mut">'+c.first+' : séance calme, validation du trot enlevé sur le bon diagonal pour tout le groupe.</div></div></div>';
  }else h+='<div style="margin-top:16px">'+slotForm()+'</div>';
  b.innerHTML=h;wire(b)}
 function times(){var o=[];for(var t=H0*60;t<=H1*60-30;t+=15)o.push([t,hm(t)]);return o}
 function pickHTML(r,ld){var m=D.member(r),small=m.age<13,used={};l.riders.forEach(function(x){if(x!==r&&l.horses[x])used[l.horses[x]]=1});
  var list=club.slice().sort(function(a,b){function sc(h){return (unav(h)?100:0)+(used[h.id]?50:0)+(ld[h.id]||0)*10+h.work/h.workMax*6+((small!==h.pony)?5:0)}return sc(a)-sc(b)}).slice(0,9);
  return '<div class="pl-pick">'+list.map(function(h,i){var u=unav(h),n=ld[h.id]||0;return '<button class="pl-hc" data-pick="'+h.id+'"'+(u||used[h.id]?' disabled':'')+'>'+U.hav(h)+'<span><b>'+h.name+(i===0&&!u?' <span class="chip acc" style="height:24px;line-height:24px;font-size:13px">Conseillé</span>':'')+'</b><span class="x">'+(u||(used[h.id]?'Déjà dans cette reprise':plural(n,'reprise')+' ce jour · '+h.work+' h sur '+h.workMax+' h'))+'</span></span></button>'}).join('')+'</div>'}
 function check(b){var box=$('[data-chk]',b);if(!box)return [];var d=+val(b,'d'),s=+val(b,'s'),bz=busy(d,s,e.dur,val(b,'c'),e.k==='balade'?'':val(b,'a'),l.id);
  box.innerHTML=bz.length?'<div class="note bad">'+ICON('alert','sm')+'<span><b>Conflit détecté.</b> '+bz.join('. ')+'.</span></div>':'<div class="note ok">'+ICON('checkc','sm')+'<span>Aucun conflit : la piste et l’encadrant sont libres le '+DNL[d]+' à '+hm(s)+'.</span></div>';return bz}
 function apply(b){var bz=check(b);if(bz.length){P.toast('Ce créneau est en conflit, choisissez une autre heure ou une autre piste',{icon:'alert'});return}
  var d=+val(b,'d'),s=+val(b,'s'),a=val(b,'a'),ch=d!==e.d||s!==e.s||a!==e.arena;ST.moves[l.id]={d:d,s:s,a:a};l.coach=val(b,'c');if(val(b,'cap'))l.cap=+val(b,'cap');ST.landed=l.id;
  if(!ST.promo)ST.promo={};var hadP=!!ST.promo[l.id],pr=l.cap>0&&isOn(b,'ls-pr');if(pr)ST.promo[l.id]=val(b,'floor')||'15 € la séance';else delete ST.promo[l.id];sh.close();redraw();
  if(pr!==hadP||pr){P.toast(pr?'Prix réduit activé : '+ST.promo[l.id].replace(' la séance','')+' la séance si « '+l.title+' » est remplie à moins de 50\u00a0% à J-2':'Prix réduit désactivé pour « '+l.title+' »',{icon:'percent'});return}
  P.toast(ch?'« '+l.title+' » déplacée au '+DNL[d]+' à '+hm(s)+(l.riders.length?'. '+plural(l.riders.length,'cavalier')+' prévenus':''):'Créneau mis à jour')}
 function wire(b){
  on(b,'[data-lt]',function(x){tab=x.getAttribute('data-lt');ST.tab=tab;picking=null;paint()});
  on(b,'[data-att]',function(x){var r=x.closest('[data-r]').getAttribute('data-r'),v=x.getAttribute('data-att'),m=D.member(r);att[r]=att[r]===v?null:v;paint();
   if(att[r]==='e')P.toast('Absence excusée : un rattrapage est crédité à '+m.first+', valable 60 jours',{icon:'ticket'});else if(att[r]==='a')P.toast('Absence notée, la séance de '+m.first+' est décomptée'+(m.minor?' et ses parents sont prévenus':''),{icon:'info'})});
  on(b,'[data-allp]',function(){l.riders.forEach(function(r){if(!att[r])att[r]='p'});paint()});
  on(b,'[data-hb]',function(x){var r=x.getAttribute('data-hb');picking=picking===r?null:r;paint();var pk=$('.pl-pick',body);if(pk)pk.scrollIntoView({block:'nearest',behavior:'smooth'})});
  on(b,'[data-pick]',function(x){var h=D.horse(x.getAttribute('data-pick'));l.horses[picking]=h.id;var m=D.member(picking);picking=null;paint();redraw();P.toast(h.name+' attribué à '+m.first+' '+m.last)});
  on(b,'[data-print]',function(){var c0=D.person(l.coach)||{first:'',last:''};P.download('feuille-de-monte-'+String(l.title).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[^a-z0-9]+/g,'-')+'.pdf',{title:'Feuille de monte',sub:l.title+' · '+cap1(DNL[e.d])+' '+hm(e.s)+' · '+place(e)+' · '+c0.first+' '+c0.last,org:D.club.name,blocks:[{table:{cols:['Cavalier','Galop','Cheval','Présent'],w:[3,1.2,3,1.2],rows:(l.riders||[]).map(function(r){var m=D.member(r)||D.person(r)||{first:'',last:''},h=l.horses&&l.horses[r]&&D.horse(l.horses[r]);return [m.first+' '+m.last,m.galop?'G'+m.galop:'',h?h.name:'à attribuer','']})}}]},null,{msg:'Feuille de monte téléchargée, prête à imprimer'})});
  on(b,'[data-kl]',function(){sh.close();P.sellerie({focus:'reprises',lesson:ST.off===0&&e.d===TDI?l.id:null})});
  on(b,'[data-prog]',function(){openProg(l,function(){ST.tab='seance';setTimeout(function(){openLesson(l.id,e.d)},P.RM?0:240)})});
  on(b,'[data-undo]',function(){l.horses=ST.auto[key].before;delete ST.auto[key];paint();redraw();P.toast('Attribution précédente rétablie',{icon:'refresh'})});
  on(b,'[data-auto]',function(btn){var before=JSON.parse(JSON.stringify(l.horses)),res=autoAssign(l),rows=$$('.pl-r',b),t0=performance.now(),step=P.RM?0:95;btn.disabled=true;picking=null;
   var left=[];l.riders.forEach(function(r){var h=before[r]&&D.horse(before[r]);if(h&&unav(h)&&h.owner!==r&&res[r]!==h.id)left.push(h.name+' ('+unav(h).split(',')[0].toLowerCase()+')')});
   rows.forEach(function(row,i){var r=row.getAttribute('data-r'),hb=$('.pl-hb',row);setTimeout(function(){hb.classList.add('think')},i*step);
    setTimeout(function(){l.horses[r]=res[r];var ld=loads(e.d),tmp=document.createElement('div');tmp.innerHTML=hbHTML(r,ld,before[r]!==res[r]);var cur=$('.pl-hb',row);if(cur)cur.replaceWith(tmp.firstChild)},i*step+(P.RM?0:420))});
   setTimeout(function(){l.horses=res;var ld=loads(e.d),mx=1;l.riders.forEach(function(r){mx=Math.max(mx,ld[res[r]]||1)});
    ST.auto[key]={before:before,n:Object.keys(res).length,max:mx,left:left,ms:((performance.now()-t0)/1000).toFixed(1).replace('.',',')};paint();redraw();P.toast('Chevaux attribués pour « '+l.title+' »',{icon:'horse'})},rows.length*step+(P.RM?30:900))});
  on(b,'[data-enrol]',function(x){var r=x.getAttribute('data-enrol'),m=D.member(r);l.riders.push(r);l._w=waitOf(l).filter(function(v){return v!==r});l.wait=l._w.length;paint();redraw();P.toast(m.first+' '+m.last+' est inscrit'+(m.minor?', ses parents sont prévenus':' et prévenu par notification'))});
  on(b,'[data-alert]',function(x){var r=x.getAttribute('data-alert');ST.alert[key+r]=1;paint();P.toast('Alerte activée : '+D.member(r).first+' recevra la place dès qu’elle se libère',{icon:'bell'})});
  on(b,'[data-prop]',function(x){var id=x.getAttribute('data-prop'),m=D.member(id);ST.prop[id]=1;paint();P.toast('Créneau proposé à '+m.first+' '+m.last+' en rattrapage')});
  on(b,'[data-save]',function(){ST.notes[l.id]={th:val(b,'th'),tx:val(b,'tx')};P.toast('Notes enregistrées, visibles par toute l’équipe')});
  on(b,'[data-share]',function(){P.toast('Compte rendu envoyé à '+plural(l.riders.length,'cavalier')+' dans leur carnet de progression',{icon:'send'})});
  on(b,'[data-k]',function(){check(b)},'change');check(b);
  on(b,'[data-apply]',function(){apply(b)});
  on(b,'[data-dup]',function(){sh.close();openCreate({d:e.d,s:e.s+e.dur,arena:e.arena,title:l.title,coach:l.coach,cap:l.cap})})}
 on(sh,'.sf [data-apply]',function(){apply(body)});
 on(sh,'.sf [data-del]',function(){ST.cx[key]=true;sh.close();redraw();P.toast('Créneau supprimé pour cette semaine',{undo:function(){delete ST.cx[key];redraw()}})});
 on(sh,'.sf [data-close]',function(){var k=cnt();if(k.n){tab=ST.tab='montoir';paint();P.toast('Il reste '+plural(k.n,'cavalier')+' à pointer avant de clôturer',{icon:'info'});return}ST.closed[key]=true;sh.close();redraw();
  P.toast('Appel clôturé : '+plural(k.p,'présent')+', '+plural(k.a,'absent')+', '+plural(k.e,'excusé')+'. Les cartes sont décomptées')});
 on(sh,'.sf [data-msg]',function(){openGroupMsg(e)});
 on(sh,'.sf [data-cancel]',function(){openCancel(e)});
}

/* ---------- Annulation avec prévenance et crédit ---------- */
function openCancel(e){var l=e.l,n=l.riders.length,par=l.riders.filter(function(r){return D.member(r).minor}).length,key=l.id+'@'+ST.off,why='Météo';
 function txt(){return 'Bonjour, la reprise « '+l.title+' » du '+F.dateL(e.date)+' à '+hm(e.s)+' est annulée ('+why.toLowerCase()+'). Un rattrapage vous est crédité, valable 60 jours. Réservez-le depuis l’application Stabl. L’équipe des Tilleuls'}
 var sh=P.sheet({title:'Annuler la reprise',icon:'xc',body:'<div class="pl-sum"><div class="w">'+l.title+' <span>· '+F.dateL(e.date)+', '+hm(e.s)+'</span></div></div>'+
   '<div class="lx-h">Motif</div><div class="hrow wrap" style="--g:6px">'+['Météo','Moniteur absent','Piste impraticable','Trop peu d’inscrits'].map(function(m,i){return '<button class="tag" data-manual data-why="'+m+'" aria-pressed="'+(i===0)+'">'+m+'</button>'}).join('')+'</div>'+
   '<div class="lx-h">Prévenir '+plural(n,'cavalier')+(par?' et '+plural(par,'parent')+' de mineurs':'')+'</div><div class="hrow wrap" style="--g:6px">'+[['bell','Notification'],['sms','SMS'],['mail','E-mail']].map(function(c,i){return '<button class="tag" aria-pressed="'+(i<2)+'">'+ICON(c[0],'sm')+c[1]+'</button>'}).join('')+'</div>'+
   '<textarea class="in" data-k="msg" rows="5" style="margin-top:10px">'+txt()+'</textarea>'+
   '<div style="margin-top:10px">'+opt('Créditer un rattrapage à chaque cavalier',plural(n,'crédit')+' créés automatiquement, valables 60 jours.',true,'cx-cr')+opt('Proposer un créneau de remplacement','Samedi 21 novembre à 15 h avec Inès Garnier, 4 places libres.',true,'cx-rp')+opt('Ne pas décompter la séance des cartes et forfaits','La séance n’est facturée à personne.',true,'cx-nf')+'</div>',
  foot:'<button class="btn" data-keep>Garder la reprise</button><button class="btn pri" data-ok>Annuler et prévenir '+plural(n,'cavalier')+'</button>'});
 on(sh,'[data-why]',function(b){why=b.getAttribute('data-why');$$('[data-why]',sh).forEach(function(x){x.setAttribute('aria-pressed',x===b)});$('[data-k="msg"]',sh).value=txt()});
 on(sh,'[data-keep]',function(){sh.close()});
 on(sh,'[data-ok]',function(){var cr=isOn(sh,'cx-cr');ST.cx[key]=true;sh.close();redraw();P.toast('Reprise annulée. '+plural(n,'cavalier')+' prévenus'+(cr?', '+plural(n,'rattrapage')+' crédités':''),{ms:5200,undo:function(){delete ST.cx[key];redraw();P.toast('Reprise rétablie, cavaliers informés',{icon:'refresh'})}})})}

/* ---------- Message au groupe ---------- */
function openGroupMsg(e){var l=e.l,n=l.riders.length,par=l.riders.filter(function(r){return D.member(r).minor}).length;
 var T={'Rappel de la reprise':'Bonjour, petit rappel : reprise « '+l.title+' » '+F.dateL(e.date)+' à '+hm(e.s)+', '+place(e)+'. Arrivez vingt minutes avant pour préparer votre cheval.','Changement de piste':'Bonjour, la reprise « '+l.title+' » de '+hm(e.s)+' aura lieu au Grand manège à cause de la pluie. À tout à l’heure.','Matériel à prévoir':'Bonjour, pour la reprise de '+F.dateL(e.date)+', pensez à votre gilet de protection et à une cravache. Merci.'};
 var sh=P.sheet({title:'Écrire au groupe',icon:'send',body:'<div class="hrow" style="margin-bottom:12px">'+U.avs(l.riders,6)+'<span class="s mut">'+plural(n,'cavalier')+(par?', '+plural(par,'parent')+' en copie':'')+'</span></div>'+
   '<div class="lx-h">Canaux</div><div class="hrow wrap" style="--g:6px">'+[['bell','Notification'],['sms','SMS'],['mail','E-mail'],['chat','WhatsApp']].map(function(c,i){return '<button class="tag" aria-pressed="'+(i<1)+'">'+ICON(c[0],'sm')+c[1]+'</button>'}).join('')+'</div>'+
   '<div class="lx-h">Message</div>'+sel('tpl',Object.keys(T),'')+'<textarea class="in" data-k="msg" rows="5" style="margin-top:8px">'+T['Rappel de la reprise']+'</textarea><p class="xs mut" style="margin-top:8px">Le message arrive aussi dans le fil « '+l.title+' » de la messagerie.</p>',
  foot:'<button class="btn" data-later>'+ICON('clock','sm')+'Programmer</button><button class="btn pri" data-send>'+ICON('send','sm')+'Envoyer à '+(n+par)+' personnes</button>'});
 on(sh,'[data-k="tpl"]',function(s){$('[data-k="msg"]',sh).value=T[s.value]},'change');
 on(sh,'[data-send]',function(){sh.close();P.toast('Message envoyé à '+plural(n,'cavalier')+(par?' et '+plural(par,'parent'):''),{icon:'send'})});
 on(sh,'[data-later]',function(){sh.close();P.toast('Message programmé pour la veille à 18 h',{icon:'clock'})})}

/* ---------- Création d'une reprise ou d'un stage ---------- */
function openCreate(pre){var type=pre.type||'reprise',TY=[['reprise','Reprise'],['stage','Stage'],['particulier','Cours particulier'],['balade','Balade']];
 var sh=P.sheet({title:'Créer une activité',icon:'calendar_add',body:'',foot:'<button class="btn" data-x2>Fermer</button><button class="btn pri" data-ok>Créer la reprise</button>'});
 var body=$('.sb',sh),okb=$('[data-ok]',sh),keep={};setTimeout(function(){paint(body)},0);
 function times(){var o=[];for(var t=H0*60;t<=H1*60-30;t+=30)o.push([t,hm(t)]);return o}
 function paint(b){var st=type==='stage',pa=type==='particulier';
  b.innerHTML=U.seg(TY,type,'data-ty')+'<div class="lx-form" style="margin-top:16px">'+
   fld('Intitulé','<input class="in" data-k="title" value="'+F.esc(keep.title||pre.title||(st?'Stage de perfectionnement':pa?'Cours particulier':type==='balade'?'Balade en forêt':'Galop 3-4'))+'">','full')+
   fld('Niveau',sel('lvl',['Débutants','Galops 1 et 2','Galops 3 et 4','Galops 5 à 7','Adultes','Tous niveaux'],keep.lvl||'Galops 3 et 4'))+
   fld('Encadrant',sel('c',D.staff.filter(function(p){return /Monit|Apprentie|Gérante/.test(p.role)}).concat(pa?D.coaches.filter(function(x){return x.ext}):[]).map(function(p){return [p.id,p.first+' '+p.last]}),keep.c||pre.coach||'s02'))+
   fld(st?'Premier jour':'Jour',sel('d',DNL.map(function(n,i){return [i,cap1(n)+' '+dateOf(i,ST.off).getDate()]}),keep.d!=null?keep.d:pre.d!=null?pre.d:3))+
   fld('Heure de début',sel('s',times(),keep.s||pre.s||14*60))+
   fld('Durée',sel('dur',st?[[120,'2 h'],[180,'Demi-journée, 3 h'],[360,'Journée, 6 h']]:[[30,'30 min'],[45,'45 min'],[60,'1 h'],[90,'1 h 30'],[120,'2 h']],keep.dur||(pre.dur?(st?Math.max(120,pre.dur):[30,45,60,90,120].reduce(function(x,y){return Math.abs(y-pre.dur)<Math.abs(x-pre.dur)?y:x})):(st?120:60))))+
   fld('Piste',sel('a',AR.map(function(a){return [a.id,a.name]}),keep.a||pre.arena||'a3'))+
   fld('Récurrence',sel('rec',st?[['once','Du lundi au vendredi, 5 jours'],['once','Un seul jour']]:[['week','Chaque semaine, hors vacances scolaires'],['two','Toutes les deux semaines'],['once','Une seule fois']],keep.rec||(pa?'once':'week')))+
   fld('Capacité',sel('cap',pa?[1,2,3]:[4,6,8,10,12],keep.cap||pre.cap||(pa?1:8)))+
   fld('Tarif',sel('price',st?['45 € la journée','160 € les 5 jours','Inclus dans le forfait']:pa?['38 € la séance','55 € la séance','1 séance de carte']:['Inclus dans le forfait, 1 séance de carte','22 € la séance à l’unité','Gratuit'],''),'full')+
   fld('Âge minimum',sel('amin',[['','Aucun']].concat([4,6,8,10,12,14,16,18].map(function(a){return [a,a+' ans']})),keep.amin||''))+fld('Âge maximum',sel('amax',[['','Aucun']].concat([8,10,12,14,16,18].map(function(a){return [a,a+' ans']})),keep.amax||''))+'</div>'+
   '<div data-age class="xs mut" style="margin-top:6px"></div>'+
   '<div data-chk style="margin-top:12px"></div><div style="margin-top:6px">'+opt('Réservable en ligne','Visible dans l’application des adhérents et sur le site du club.',true,'nc-on')+opt('Ouverte aux rattrapages','Les crédits de rattrapage donnent accès aux places libres.',!st&&!pa,'nc-ra')+opt('Liste d’attente automatique','Inscription automatique dès qu’une place se libère.',true,'nc-wa')+(st?opt('Acompte de 30 % à la réservation','Paiement en ligne par carte, solde le premier jour.',true,'nc-ac'):'')+opt('Réservé aux adhérents','Les cavaliers sans licence au club ne voient pas ce créneau dans la réservation en ligne.',!!keep.mem,'nc-ad')+'</div>';
  okb.innerHTML=ICON('plus','sm')+(st?'Créer le stage':pa?'Créer le cours':type==='balade'?'Créer la balade':'Créer la reprise');
  on(b,'[data-ty]',function(x){['title','lvl','c','d','s','a','amin','amax'].forEach(function(k){keep[k]=val(b,k)});keep.mem=isOn(b,'nc-ad');keep.title=null;type=x.getAttribute('data-ty');paint(b)});
  on(b,'[data-k]',function(){check()},'change');check()}
 function check(){var d=+val(body,'d'),s=+val(body,'s'),bz=busy(d,s,+val(body,'dur'),val(body,'c'),type==='balade'?'':val(body,'a'));
  $('[data-chk]',body).innerHTML=bz.length?'<div class="note bad">'+ICON('alert','sm')+'<span><b>Conflit détecté.</b> '+bz.join('. ')+'.</span></div>':'<div class="note ok">'+ICON('checkc','sm')+'<span>Aucun conflit : '+D.person(val(body,'c')).first+' et la piste sont libres le '+DNL[d]+' à '+hm(s)+'.</span></div>';okb.disabled=!!bz.length;
  var a0=+val(body,'amin')||0,a1=+val(body,'amax')||0,ag=$('[data-age]',body);if(ag){if(a0&&a1&&a1<a0){ag.innerHTML='<b class="badc">L’âge maximum est inférieur à l’âge minimum.</b>';okb.disabled=true}else{var nm=D.members.filter(function(m){return (!a0||m.age>=a0)&&(!a1||m.age<=a1)&&m.forfait!=='f5'}).length;ag.textContent=a0||a1?ageTxt({amin:a0,amax:a1})+'\u00a0: '+plural(nm,'adhérent concerné','adhérents concernés')+' au club.':'Ouverte à tous les âges.'}}
  return bz}
 on(sh,'[data-x2]',function(){sh.close()});
 okb.onclick=function(){if(check().length)return;var d=+val(body,'d'),s=+val(body,'s'),nid='n'+(ST.created.length+1),t=val(body,'title')||'Nouvelle reprise';
  var nl={id:nid,dow:(d+1)%7,start:hc(s),dur:+val(body,'dur'),title:t,coach:val(body,'c'),arena:val(body,'a'),cap:+val(body,'cap'),riders:[],horses:{},wait:0,kind:type,once:val(body,'rec')==='once'?ST.off:null,amin:+val(body,'amin')||0,amax:+val(body,'amax')||0,members:isOn(sh,'nc-ad')};
  ST.created.push(nl);ST.landed=nid;if(P.isMobile())ST.day=d;sh.close();redraw();P.toast('« '+t+' » créée le '+DNL[d]+' à '+hm(s)+(nl.amin||nl.amax?', '+ageTxt(nl).toLowerCase():'')+(nl.members?', réservée aux adhérents':'')+(isOn(sh,'nc-on')?', réservation en ligne ouverte':''),{undo:function(){ST.created=ST.created.filter(function(x){return x.id!==nid});redraw()}})}}

/* ---------- Conflits ---------- */
function openConflicts(cf){var sh=P.sheet({title:plural(cf.length,'conflit')+' à résoudre',icon:'alert',body:cf.map(function(c,i){var mv=/^x|^n/.test(c.b.l.id)?c.b:c.a,st=mv===c.a?c.b:c.a,freeA=AR.find(function(a){return a.id!==mv.arena&&a.id!=='a4'&&!busy(mv.d,mv.s,mv.dur,'',a.id,mv.l.id).length});
   return '<div class="card flat pad" style="margin-bottom:12px"><div class="hrow" style="--g:8px;margin-bottom:8px">'+U.chip(c.t==='piste'?'Piste réservée deux fois':'Moniteur pris deux fois','bad',true)+'<span class="s mut">'+cap1(F.dateL(c.a.date))+', '+hm(Math.max(c.a.s,c.b.s))+'</span></div>'+
    '<div class="s"><b>'+st.l.title+'</b> ('+D.name(st.coach)+', '+plural(st.l.riders.length,'cavalier')+') et <b>'+mv.l.title+'</b> ('+D.name(mv.coach)+') sont prévus en même temps '+(c.t==='piste'?'sur la '+arena(c.a.arena).name.toLowerCase():'')+'.</div>'+
    '<div class="lx-ai" style="margin-top:12px">'+ICON('bulb','sm')+'<span>'+(freeA?'La '+freeA.name.toLowerCase()+' est libre à cette heure. Le plus simple est d’y déplacer « '+mv.l.title+' ».':'Décaler « '+mv.l.title+' » d’une heure règle le conflit.')+'</span></div>'+
    '<div class="hrow wrap" style="margin-top:12px">'+(freeA?'<button class="btn pri sm" data-fix="'+i+'" data-a="'+freeA.id+'">Déplacer en '+freeA.name.toLowerCase()+'</button>':'')+'<button class="btn sm" data-fix="'+i+'" data-s="60">Décaler à '+hm(mv.s+60)+'</button></div></div>'}).join('')});
 on(sh,'[data-fix]',function(b){var c=cf[+b.getAttribute('data-fix')],mv=/^x|^n/.test(c.b.l.id)?c.b:c.a,id=mv.l.id,prev=ST.moves[id],a=b.getAttribute('data-a'),s=+b.getAttribute('data-s')||0;
  ST.moves[id]={d:mv.d,s:mv.s+s,a:a||mv.arena};ST.landed=id;sh.close();redraw();P.toast('Conflit résolu : « '+mv.l.title+' » '+(a?'passe en '+arena(a).name.toLowerCase():'commence à '+hm(mv.s+s))+', '+D.person(mv.coach).first+' est prévenu',{undo:function(){if(prev)ST.moves[id]=prev;else delete ST.moves[id];redraw()}})})}

/* ---------- Vacances scolaires et jours fériés ---------- */
function openHolidays(){var sh=P.sheet({title:'Vacances et jours fériés',icon:'holiday',body:
  '<div class="lx-form">'+fld('Zone académique',sel('zone',['Zone C · Versailles, Paris, Créteil','Zone A','Zone B'],''))+fld('Pendant les vacances',sel('mode',['Suspendre les reprises, ouvrir les stages','Maintenir les reprises','Maintenir seulement les adultes'],''))+'</div>'+
  '<div class="lx-h">Vacances scolaires 2026-2027</div>'+D.planVacations.map(function(v,i){return '<div class="pl-p"><span class="av sq" style="--c:var(--acc-pale);color:var(--acc)">'+ICON('holiday','sm')+'</span><div class="grow"><div class="b s">'+v.n+'</div><div class="xs mut">Du '+F.dateY(v.from)+' au '+F.dateY(v.to)+' · '+(v.stages?plural(v.stages,'stage programmé','stages programmés'):'aucun stage programmé')+'</div></div><button class="btn sm" data-goto="'+v.off+'">Voir la semaine</button></div>'}).join('')+
  '<div class="lx-ai" style="margin-top:10px">'+ICON('bulb','sm')+'<div class="grow">L’an dernier, les stages de Noël ont affiché complet en 9 jours. Je peux reprendre le même programme : deux stages par jour du lundi au jeudi.</div><button class="btn sm" data-stg>Créer les stages</button></div>'+
  '<div class="lx-h">Jours fériés <span class="mut">activez ceux où le club reste ouvert</span></div>'+D.planHolidays.map(function(h,i){return '<div class="lx-opt"><div class="grow"><div class="b s">'+h.n+'</div><div class="xs mut">'+cap1(F.dateL(h.d))+' '+h.d.slice(0,4)+' · '+(F.days(h.d)<0?'passé, rattrapages crédités':'reprises '+(h.keep?'maintenues':'suspendues, rattrapages crédités'))+'</div></div><span class="xs mut">Club ouvert</span><button class="tog" role="switch" data-hk="'+i+'" aria-checked="'+h.keep+'"></button></div>'}).join('')+
  '<div class="lx-h">Fermeture exceptionnelle</div><div class="hrow"><input class="in" type="date" value="2026-12-24"><button class="btn" data-closeday>Ajouter une fermeture</button></div>',
  foot:'<button class="btn pri" data-ok>Enregistrer</button>'});
 on(sh,'[data-goto]',function(b){ST.off=+b.getAttribute('data-goto');ST.view=ST.view==='day'?'week':ST.view;ST.day=0;sh.close();redraw()});
 on(sh,'[data-hk]',function(b){var h=D.planHolidays[+b.getAttribute('data-hk')];setTimeout(function(){h.keep=b.getAttribute('aria-checked')==='true';redraw();P.toast(h.n+' : '+(h.keep?'le club reste ouvert, reprises maintenues':'reprises suspendues, rattrapages crédités'))},0)});
 on(sh,'[data-stg]',function(b){b.outerHTML=U.chip('2 stages créés','ok',true);P.toast('Stages de Noël créés du 21 au 24 décembre, réservation en ligne ouverte')});
 on(sh,'[data-closeday]',function(){P.toast('Fermeture du 24 décembre ajoutée, 0 reprise concernée')});
 on(sh,'[data-ok]',function(){sh.close();P.toast('Calendrier du club mis à jour')})}

function openFilters(){var sh=P.sheet({title:'Filtrer le planning',icon:'filter',body:'<div class="stack" style="--g:14px">'+fld('Moniteur',sel('coach',[['','Tous les moniteurs'],['s02','Hugo Lefèvre'],['s03','Inès Garnier'],['s04','Thomas Roux'],['s08','Jade Fontaine'],['ext','Coachs extérieurs']],ST.coach))+fld('Piste',sel('arena',[['','Toutes les pistes']].concat(AR.map(function(a){return [a.id,a.name]})),ST.arena))+fld('Niveau',sel('lvl',LV,ST.lvl))+'</div>',
  foot:'<button class="btn" data-rz>Tout afficher</button><button class="btn pri" data-ok>Appliquer</button>'});
 on(sh,'[data-rz]',function(){ST.coach=ST.arena=ST.lvl='';sh.close();redraw()});
 on(sh,'[data-ok]',function(){ST.coach=val(sh,'coach');ST.arena=val(sh,'arena');ST.lvl=val(sh,'lvl');sh.close();redraw()})}

/* =====================================================================
   Manche 2 : réservations de pistes, menu Créer, semaine type,
   programmation du trimestre et écran de la sellerie
   ===================================================================== */
P.css(`
.pl-ev.pz-resa{background:repeating-linear-gradient(135deg,color-mix(in srgb,var(--c) 10%,var(--surface)) 0 6px,var(--surface) 6px 12px)}
.pz-menu{display:flex;flex-direction:column;gap:8px}
.pz-mi{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:var(--r-md);box-shadow:inset 0 0 0 1px var(--line);background:var(--surface);text-align:left;transition:background var(--t-1),box-shadow var(--t-1)}
.pz-mi:hover{background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line-2)}
.pz-mi .av{flex:none}
.pz-mi.gen{box-shadow:inset 0 0 0 1px var(--acc-line);background:var(--acc-pale)}
.pz-steps{display:flex;gap:6px;margin-bottom:16px}
.pz-steps span{flex:1;min-width:0;display:flex;flex-direction:column;gap:6px;font-size:13px;color:var(--mut);font-weight:600}
.pz-steps span i{height:4px;border-radius:2px;background:var(--bg-2);transition:background var(--t-2)}
.pz-steps span.on{color:var(--ink)}.pz-steps span.on i,.pz-steps span.done i{background:var(--acc)}
.pz-steps span b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:600}
.pz-av{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 12px;align-items:center;padding:11px 0;border-top:1px solid var(--line)}
.pz-av:first-of-type{border-top:0}
.pz-days{display:flex;gap:4px}
.pz-days .tag{min-width:38px;justify-content:center;padding:0 6px}
.pz-days .tag[aria-pressed="true"]{background:var(--acc-pale);color:var(--acc);box-shadow:inset 0 0 0 1px var(--acc-line)}
.pz-days .tag[aria-pressed="false"]{background:var(--surface);color:var(--mut-2);text-decoration:line-through;box-shadow:inset 0 0 0 1px var(--line)}
.pz-stp{display:inline-flex;align-items:center;border-radius:var(--r-sm);box-shadow:inset 0 0 0 1px var(--line-2);background:var(--surface)}
.pz-stp button{width:34px;height:34px;display:grid;place-items:center;color:var(--ink-2)}
.pz-stp b{min-width:28px;text-align:center;font-variant-numeric:tabular-nums}
.pz-gr{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:4px 12px;align-items:center;padding:8px 0;border-top:1px solid var(--line);font-size:13px}
.pz-gr .tm{font-weight:650;font-variant-numeric:tabular-nums}
.pz-gr.chg{background:linear-gradient(90deg,var(--acc-pale),transparent 70%);margin:0 -8px;padding:8px}
.pz-gr.bad{background:linear-gradient(90deg,var(--bad-pale),transparent 70%);margin:0 -8px;padding:8px}
.pz-gr.off{opacity:.55}.pz-gr.off b{text-decoration:line-through}
.pz-dh{font:650 13px var(--f-text);color:var(--mut);text-transform:uppercase;letter-spacing:.06em;margin:16px 0 4px}
.pz-sumg{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
.pz-sumg div{padding:10px 12px;border-radius:var(--r-md);background:var(--surface-2);box-shadow:inset 0 0 0 1px var(--line)}
.pz-sumg b{display:block;font:700 20px/1.1 var(--f-display);font-variant-numeric:tabular-nums}
.pz-sumg span{font-size:13px;color:var(--mut)}
.pz-pg{display:grid;grid-template-columns:86px minmax(0,1fr);gap:10px;align-items:center;padding:7px 0;border-top:1px solid var(--line)}
.pz-pg:first-child{border-top:0}
.pz-pg .wk{font-size:13px;color:var(--mut);line-height:1.3}.pz-pg .wk b{display:block;color:var(--ink);font-size:13px}
.pz-pg.cur .wk b{color:var(--acc)}
.pz-prog{display:flex;align-items:center;gap:12px;padding:12px 14px;border-radius:var(--r-md);background:var(--acc-pale);box-shadow:inset 0 0 0 1px var(--acc-line);margin-top:16px}
@container main (max-width:520px){.pz-sumg{grid-template-columns:repeat(2,minmax(0,1fr))}.pz-av{grid-template-columns:minmax(0,1fr)}.pz-days{flex-wrap:wrap}.pz-days .tag{min-width:0;flex:1 0 calc(25% - 4px)}.pz-pg{grid-template-columns:64px minmax(0,1fr)}}

/* écran de la sellerie (plein écran, sombre dans les deux thèmes) */
.sl-k{position:absolute;inset:0;z-index:70;background:var(--hero);color:var(--hero-ink);container:main/inline-size;overflow-y:auto;overflow-x:hidden;padding:22px 26px 30px;animation:fade var(--t-3) var(--e-out) both}
.sl-k.out{opacity:0;transition:opacity var(--t-2)}
.sl-k .sl-m{color:color-mix(in srgb,var(--hero-ink) 64%,transparent)}
.sl-hd{display:flex;align-items:center;gap:14px 20px;flex-wrap:wrap}
.sl-hd .grow{min-width:0}
.sl-hd h2{font:700 22px/1.15 var(--f-display);letter-spacing:-.02em;color:var(--hero-ink)}
.sl-clock{font:700 54px/1 var(--f-display);letter-spacing:-.045em;font-variant-numeric:tabular-nums}
.sl-live{display:inline-flex;align-items:center;gap:6px;font-size:13px;font-weight:700;letter-spacing:.08em;padding:4px 9px;border-radius:99px;background:color-mix(in srgb,var(--hero-ink) 12%,transparent)}
.sl-live i{width:7px;height:7px;border-radius:50%;background:var(--ok);animation:slpulse 2s ease-in-out infinite}
@keyframes slpulse{0%,100%{opacity:1}50%{opacity:.35}}
.sl-q{background:var(--hero-ink);color:var(--hero);box-shadow:none}
.sl-q:hover{background:color-mix(in srgb,var(--hero-ink) 88%,var(--hero))}
.sl-upd{display:flex;align-items:center;gap:12px;margin-top:14px;font-size:13px}
.sl-upd .bar{flex:1;max-width:220px;height:4px;background:color-mix(in srgb,var(--hero-ink) 14%,transparent);border-radius:2px;overflow:hidden}
.sl-upd .bar i{display:block;height:100%;width:100%;background:var(--strass);transform-origin:left;animation:slbar 20s linear both}
@keyframes slbar{from{transform:scaleX(0)}to{transform:scaleX(1)}}
.sl-news{display:flex;align-items:center;gap:8px;min-width:0;animation:rise var(--t-4) var(--e-out) both}
.sl-news span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.sl-grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr) minmax(0,1fr);gap:16px;margin-top:18px;align-items:start}
.sl-col{background:color-mix(in srgb,var(--hero-ink) 6%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--hero-ink) 12%,transparent);border-radius:var(--r-lg);padding:16px;min-width:0}
.sl-col.hi{box-shadow:inset 0 0 0 1.5px var(--strass)}
.sl-col>h3{display:flex;align-items:center;gap:8px;font:650 15px var(--f-display);color:var(--hero-ink);margin-bottom:10px}
.sl-col>h3 small{margin-left:auto;font:500 13px var(--f-text);color:color-mix(in srgb,var(--hero-ink) 64%,transparent)}
.sl-ls{display:grid;grid-template-columns:52px minmax(0,1fr) auto;gap:2px 12px;align-items:center;padding:9px 0;border-top:1px solid color-mix(in srgb,var(--hero-ink) 10%,transparent);font-size:13.5px}
.sl-ls:first-of-type{border-top:0}
.sl-ls .tm{font-weight:700;font-variant-numeric:tabular-nums}
.sl-ls.past{opacity:.45}
.sl-next{border-radius:var(--r-md);background:color-mix(in srgb,var(--hero-ink) 9%,transparent);padding:12px;margin:4px 0 8px}
.sl-next .ey{font-size:13px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;color:var(--strass)}
.sl-next h4{font:700 19px/1.2 var(--f-display);margin:4px 0 2px;color:var(--hero-ink)}
.sl-pairs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;margin-top:10px}
.sl-pair{display:flex;justify-content:space-between;gap:8px;padding:7px 10px;border-radius:9px;background:color-mix(in srgb,var(--hero-ink) 8%,transparent);font-size:13px;min-width:0}
.sl-pair span{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0}
.sl-pair b{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;min-width:0;text-align:right}
.sl-pair.none b{color:var(--warn)}
.sl-c{display:flex;gap:10px;align-items:flex-start;padding:9px 0;border-top:1px solid color-mix(in srgb,var(--hero-ink) 10%,transparent);font-size:13.5px;line-height:1.4}
.sl-c:first-of-type{border-top:0}
.sl-c svg.i{flex:none;margin-top:1px;color:var(--strass)}
.sl-c.bad svg.i{color:var(--bad)}.sl-c.warn svg.i{color:var(--warn)}
.sl-c b{color:var(--hero-ink)}
@container main (max-width:1000px){.sl-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.sl-grid>.sl-col:first-child{grid-column:1/-1}}
.sl-upd{flex-wrap:wrap}.sl-upd>span:first-child{white-space:nowrap}
@container main (max-width:620px){.sl-k{padding:16px 16px 28px}.sl-grid{grid-template-columns:minmax(0,1fr)}.sl-clock{font-size:36px}.sl-hd{gap:10px 12px}.sl-hd>svg{display:none}.sl-hd .grow{flex:1 1 100%}.sl-hd h2{font-size:18px}.sl-q{margin-left:auto}.sl-pairs{grid-template-columns:minmax(0,1fr)}.sl-upd .bar{flex:1 1 80px}.sl-upd>span:last-child{flex:1 1 100%}}
`);

/* ---------- Réservation de piste d'un propriétaire ---------- */
function openResa(e){var b=e.l.tb,m=D.person(b.who),h=D.horse(b.horse),a=arena(b.arena),s0=mn(b.from),s1=mn(b.to);
 var same=(D.trackBookings||[]).filter(function(x){return x.date===b.date&&x.arena===b.arena&&mn(x.from)<s1&&s0<mn(x.to)}).length;
 var mine=(D.trackBookings||[]).filter(function(x){return x.date===b.date&&x.who===b.who}).reduce(function(t,x){return t+mn(x.to)-mn(x.from)},0);
 var sh=P.sheet({title:'Réservation de piste',icon:'arena',body:'<div class="pl-sum"><div class="w">'+cap1(F.dateL(e.date))+' <span>· '+hm(s0)+' à '+hm(s1)+'</span></div><div class="hrow wrap" style="--g:6px"><span class="chip lg">'+U.av(m,'sm')+'&nbsp;'+m.first+' '+m.last+'</span><span class="chip lg">'+ICON('arena','sm')+a.name+'</span>'+(h?'<span class="chip lg">'+ICON('horse','sm')+h.name+'</span>':'')+'</div></div>'+
   '<div class="lx-h">Règles des installations</div>'+
   '<div class="pl-p"><span class="av sq" style="--c:var(--acc-pale);color:var(--acc)">'+ICON('members','sm')+'</span><div class="grow"><div class="b s">Piste partagée</div><div class="xs mut">'+same+' cavalier'+(same>1?'s':'')+' sur 4 places à cette heure</div></div>'+U.chip(same<4?'Places libres':'Complet',same<4?'ok':'warn',true)+'</div>'+
   '<div class="pl-p"><span class="av sq" style="--c:var(--acc-pale);color:var(--acc)">'+ICON('clock','sm')+'</span><div class="grow"><div class="b s">Une heure par jour et par cheval</div><div class="xs mut">'+dh(mine/60)+' réservées par '+m.first+' ce jour-là</div></div>'+U.chip(mine<=60?'Règle respectée':'Au-delà de la règle',mine<=60?'ok':'warn',true)+'</div>'+
   '<div class="pl-p"><span class="av sq" style="--c:var(--acc-pale);color:var(--acc)">'+ICON('phone','sm')+'</span><div class="grow"><div class="b s">Réservée depuis l’application</div><div class="xs mut">Espace adhérent, onglet Installations. Les créneaux des reprises y sont grisés.</div></div></div>',
  foot:'<button class="btn danger" data-del>'+ICON('trash','sm')+'Annuler la réservation</button><button class="btn pri" data-msg>'+ICON('send','sm')+'Écrire à '+m.first+'</button>'});
 on(sh,'[data-del]',function(){var i=D.trackBookings.indexOf(b);if(i<0)return;D.trackBookings.splice(i,1);sh.close();redraw();
  P.toast('Réservation annulée, notification envoyée à '+m.first+' '+m.last,{icon:'xc',undo:function(){D.trackBookings.splice(i,0,b);redraw()}})});
 on(sh,'[data-msg]',function(){sh.close();P.toast('Message envoyé à '+m.first+' '+m.last,{icon:'send'})})}

/* ---------- Menu Créer ---------- */
function openCreateMenu(pre){pre=pre||{};var IT=[['reprise','calendar_add','Une reprise','Cours collectif chaque semaine, réservable en ligne'],['stage','flag','Un stage','Une ou plusieurs journées, acompte en ligne'],['particulier','coach','Un cours particulier','Avec un moniteur du club ou un coach extérieur'],['balade','route','Une balade','Sortie encadrée en extérieur'],['gen','repeat','Générer la semaine type','Disponibilités, pistes et niveaux demandés, puis une grille proposée']];
 var sh=P.sheet({title:'Créer',icon:'plus',body:'<div class="pz-menu">'+IT.map(function(x){return '<button class="pz-mi'+(x[0]==='gen'?' gen':'')+'" data-mk="'+x[0]+'"><span class="av sq" style="--c:'+(x[0]==='gen'?'var(--surface)':'var(--acc-pale)')+';color:var(--acc)">'+ICON(x[1])+'</span><span class="grow"><b class="s" style="display:block">'+x[2]+'</b><span class="xs mut">'+x[3]+'</span></span>'+ICON('right','sm')+'</button>'}).join('')+'</div>'});
 on(sh,'[data-mk]',function(b){var k=b.getAttribute('data-mk');if(k==='gen')openGenerate();else openCreate(Object.assign({},pre,{type:k}))})}

/* ---------- Générer la semaine type ---------- */
var GCO=['s02','s03','s04','s08'],GPREF={poney:['s03','s08','s02'],g12:['s03','s02','s04'],g34:['s02','s03','s04'],g57:['s04','s03','s02'],adultes:['s02','s03','s04'],perf:['s04','s02','s03']};
var GTITLE={poney:'Poney Galop 1',g12:'Galop 1-2',g34:'Galop 3-4',g57:'Galop 5-6',adultes:'Adultes Galop 3',perf:'Perfectionnement CSO'};
function genWeek(cfg){var out=[],res=[],base=D.lessons.slice().sort(function(a,b){return di(a)-di(b)||mn(a.start)-mn(b.start)}),have={},drop={};
 var ext=D.planExtras.map(function(l){return {d:di(l),s:mn(l.start),dur:l.dur,arena:l.arena,coach:l.coach,k:kindOf(l),l:l}});
 function opn(a,d){return cfg.ar[a][d]}
 function free(d,s,dur,coach,ar){return !res.concat(ext).some(function(x){return x.d===d&&x.s<s+dur&&s<x.s+x.dur&&((ar&&x.arena===ar&&x.k!=='balade')||(coach&&x.coach===coach))})}
 base.forEach(function(l){var k=lv(l);have[k]=(have[k]||0)+1});
 Object.keys(have).forEach(function(k){var ex=have[k]-(cfg.lvl[k]!=null?cfg.lvl[k]:have[k]);if(ex>0)base.filter(function(l){return lv(l)===k}).sort(function(a,b){return a.riders.length/a.cap-b.riders.length/b.cap}).slice(0,ex).forEach(function(l){drop[l.id]=1})});
 base.forEach(function(l){var d=di(l),s=mn(l.start),k=kindOf(l),c=l.coach,a=l.arena,st='same',nt=[];
  if(drop[l.id]){out.push({l:l,d:d,s:s,st:'removed',note:'Retirée de la grille : '+plural(l.riders.length,'cavalier')+' à replacer'});return}
  if(k!=='balade'&&!opn(a,d)){var alt=AR.find(function(x){return x.id!==a&&x.id!=='a4'&&opn(x.id,d)&&free(d,s,l.dur,'',x.id)});if(alt){a=alt.id;st='chg';nt.push('Passe en '+alt.name.toLowerCase()+', '+arena(l.arena).name.toLowerCase()+' fermée')}else{st='bad';nt.push('Aucune piste ouverte et libre à cette heure')}}
  if(cfg.av[c]&&!cfg.av[c][d]){var pr=(GPREF[lv(l)]||GCO).concat(GCO),alt2=pr.find(function(x){return x!==c&&cfg.av[x][d]&&free(d,s,l.dur,x,'')});if(alt2){nt.push(D.person(alt2).first+' remplace '+D.person(c).first);c=alt2;if(st==='same')st='chg'}else{st='bad';nt.push('Aucun moniteur disponible le '+DNL[d])}}
  if(st!=='bad'&&!free(d,s,l.dur,c,k==='balade'?'':a)){st='bad';nt.push('Piste ou moniteur déjà pris à cette heure')}
  var nl=Object.assign({},l,{id:'g'+l.id.slice(1),coach:c,arena:a,riders:l.riders.slice(),horses:Object.assign({},l.horses)});delete nl._w;
  res.push({d:d,s:s,dur:l.dur,arena:a,coach:c,k:k});out.push({l:nl,d:d,s:s,st:st,note:nt.join('. ')})});
 /* reprises en plus : premier créneau libre, piste ouverte, moniteur disponible ; on y inscrit la liste d'attente du niveau */
 var gi=0;Object.keys(cfg.lvl).forEach(function(k){var ex=cfg.lvl[k]-(have[k]||0);while(ex-->0){var done=false;
   var slots=[];[0,1,3,4].forEach(function(d){[17,18,19].forEach(function(h){slots.push([d,h*60])})});[2].forEach(function(d){[14,15,16,17].forEach(function(h){slots.push([d,h*60])})});[5].forEach(function(d){[9,10,11,14,15,16].forEach(function(h){slots.push([d,h*60])})});
   var ars=k==='poney'?['a3','a1']:['a1','a3','a2'];
   for(var i=0;i<slots.length&&!done;i++){var d=slots[i][0],s=slots[i][1];for(var j=0;j<ars.length&&!done;j++){var a=ars[j];if(!opn(a,d)||!free(d,s,60,'',a))continue;var c=(GPREF[k]||GCO).find(function(x){return cfg.av[x][d]&&free(d,s,60,x,'')});if(!c)continue;
     var wl=[];D.lessons.filter(function(l){return lv(l)===k}).forEach(function(l){waitOf(l).forEach(function(r){if(wl.indexOf(r)<0)wl.push(r)})});wl=wl.slice(0,6);
     var nl={id:'gn'+(++gi),dow:(d+1)%7,start:hc(s),dur:60,title:GTITLE[k]||'Nouvelle reprise',coach:c,arena:a,cap:k==='poney'?8:10,riders:wl,horses:{},wait:0,status:'prévue'};
     res.push({d:d,s:s,dur:60,arena:a,coach:c,k:'reprise'});out.push({l:nl,d:d,s:s,st:'new',note:'Nouvelle reprise'+(wl.length?', '+plural(wl.length,'cavalier')+' de la liste d’attente inscrits':'')});done=true}}
   if(!done)out.push({l:{id:'gx'+(++gi),title:GTITLE[k],coach:'',arena:'',riders:[],cap:0,dur:60},d:5,s:20*60,st:'bad',note:'Aucun créneau libre pour une reprise « '+GTITLE[k]+' » de plus'})}});
 /* cours et entretiens fixes posés sur une piste fermée */
 ext.forEach(function(x){if(x.k==='balade'||opn(x.arena,x.d))return;var alt=AR.find(function(a){return a.id!==x.arena&&a.id!=='a4'&&opn(a.id,x.d)&&free(x.d,x.s,x.dur,'',a.id)});
  out.push({l:x.l,d:x.d,s:x.s,st:'bad',fixed:true,alt:alt?alt.id:null,note:arena(x.arena).name+' fermée ce jour-là'+(alt?' : la '+alt.name.toLowerCase()+' est libre':'')})});
 return out.sort(function(a,b){return a.d-b.d||a.s-b.s})}
function openGenerate(){var step=0,STEPS=['Moniteurs','Pistes','Niveaux','Proposition'],res=null,fixes={};
 var cfg={av:{},ar:{},lvl:{}},wait={};GCO.forEach(function(c){cfg.av[c]=[1,1,1,1,1,1,1].map(Boolean)});cfg.av.s08[2]=false;
 AR.forEach(function(a){cfg.ar[a.id]=[1,1,1,1,1,1,1].map(Boolean)});cfg.ar.a2[3]=cfg.ar.a2[4]=false;
 D.lessons.forEach(function(l){var k=lv(l);cfg.lvl[k]=(cfg.lvl[k]||0)+1;wait[k]=(wait[k]||0)+(l.wait||0)});var cur=Object.assign({},cfg.lvl);
 var top=Object.keys(wait).sort(function(a,b){return wait[b]-wait[a]})[0];if(top&&wait[top])cfg.lvl[top]++;else cfg.lvl.g12=(cfg.lvl.g12||0)+1;
 var NOTE={s08:'Au CFA le mercredi (apprentissage BPJEPS)',a2:'Pluie annoncée jeudi et vendredi : carrière fermée'};
 var sh=P.sheet({title:'Générer la semaine type',icon:'repeat',wide:true,body:'',foot:'<button class="btn" data-bk>Retour</button><button class="btn pri" data-nx>Continuer</button>'});
 var body=$('.sb',sh),bk=$('[data-bk]',sh),nx=$('[data-nx]',sh);setTimeout(function(){paint(body)},0);
 function days(arr,key){return '<div class="pz-days">'+DN.map(function(n,d){return '<button class="tag" data-manual data-dk="'+key+'" data-dd="'+d+'" aria-pressed="'+!!arr[d]+'" title="'+cap1(DNL[d])+'">'+n+'</button>'}).join('')+'</div>'}
 function paint(b){b=b||body;var h='<div class="pz-steps">'+STEPS.map(function(t,i){return '<span class="'+(i===step?'on':i<step?'done':'')+'"><i></i><b>'+(i+1)+'. '+t+'</b></span>'}).join('')+'</div>';
  if(step===0){h+='<p class="s mut" style="margin-bottom:8px">Touchez un jour pour indiquer qu’un moniteur n’est pas disponible. Stabl garde les cavaliers et les chevaux de chaque reprise.</p>'+GCO.map(function(c){var p=D.staffer(c),n=cfg.av[c].filter(Boolean).length;return '<div class="pz-av"><div class="hrow" style="--g:10px;min-width:0">'+U.av(p)+'<div style="min-width:0"><div class="b s ellip">'+p.first+' '+p.last+'</div><div class="xs mut ellip">'+(NOTE[c]&&!cfg.av[c][2]?NOTE[c]:p.role+' · '+p.contract)+' · '+plural(n,'jour')+'</div></div></div>'+days(cfg.av[c],c)+'</div>'}).join('')}
  else if(step===1){h+='<p class="s mut" style="margin-bottom:8px">Jours d’ouverture de chaque piste pour la semaine type.</p>'+AR.map(function(a){var n=cfg.ar[a.id].filter(Boolean).length;return '<div class="pz-av"><div style="min-width:0"><div class="b s ellip">'+a.name+'</div><div class="xs mut ellip">'+(NOTE[a.id]&&!cfg.ar[a.id][3]?NOTE[a.id]:a.kind+' · '+a.size)+' · '+(n===7?'ouverte tous les jours':plural(n,'jour'))+'</div></div>'+days(cfg.ar[a.id],a.id)+'</div>'}).join('')}
  else if(step===2){h+='<p class="s mut" style="margin-bottom:8px">Nombre de reprises par semaine et par niveau. La liste d’attente indique où ajouter une reprise.</p>'+LV.slice(1).map(function(x){var k=x[0],n=cfg.lvl[k]||0;return '<div class="pz-av"><div style="min-width:0"><div class="b s">'+x[1]+'</div><div class="xs mut">Aujourd’hui '+plural(cur[k]||0,'reprise')+(wait[k]?' · <b class="warnc">'+wait[k]+' en attente</b>':'')+(n!==(cur[k]||0)?' · <b class="acc">'+(n>(cur[k]||0)?'+':'')+(n-(cur[k]||0))+'</b>':'')+'</div></div><span class="pz-stp"><button data-lv="'+k+'" data-v="-1" title="Une reprise de moins">'+ICON('minus','sm')+'</button><b>'+n+'</b><button data-lv="'+k+'" data-v="1" title="Une reprise de plus">'+ICON('plus','sm')+'</button></span></div>'}).join('')}
  else{res=res||genWeek(cfg);var reps=res.filter(function(o){return o.st!=='removed'&&!o.fixed&&o.l.cap>0}),chg=res.filter(function(o){return o.st==='chg'}).length,nw=res.filter(function(o){return o.st==='new'}).length,bad=res.filter(function(o){return o.st==='bad'&&!fixes[o.l.id]}).length,rm=res.filter(function(o){return o.st==='removed'}).length;
   h+='<div class="pz-sumg"><div><b>'+reps.length+'</b><span>reprises proposées</span></div><div><b>'+chg+'</b><span>ajustements</span></div><div><b>'+(nw+rm)+'</b><span>'+(rm?'ajouts et retraits':'reprises ajoutées')+'</span></div><div><b class="'+(bad?'badc':'okc')+'">'+bad+'</b><span>conflit'+(bad>1?'s':'')+' à régler</span></div></div>';
   h+=bad?'<div class="note bad" style="margin-top:12px">'+ICON('alert','sm')+'<span><b>'+plural(bad,'conflit')+' signalé'+(bad>1?'s':'')+'.</b> Réglez-'+(bad>1?'les':'le')+' ici ou appliquez la grille : '+(bad>1?'ils resteront':'il restera')+' visible'+(bad>1?'s':'')+' dans le planning.</span></div>':'<div class="lx-ai" style="margin-top:12px">'+ICON('bulb','sm')+'<span>Grille sans conflit : chaque moniteur reste dans ses jours, chaque piste ouverte, aucun cheval n’est déplacé.</span></div>';
   DN.forEach(function(n,d){var l=res.filter(function(o){return o.d===d});if(!l.length)return;h+='<div class="pz-dh">'+cap1(DNL[d])+' '+dateOf(d,1).getDate()+'</div>'+l.map(function(o){var x=o.l,fx=fixes[x.id],p=x.coach?D.person(x.coach):null;
     var chip=o.st==='new'?U.chip('Nouvelle','acc',true):o.st==='removed'?U.chip('Retirée','line'):o.st==='chg'?U.chip('Ajustée','acc'):o.st==='bad'?(fx?U.chip('Réglé','ok',true):(o.alt?'<button class="btn sm" data-fix="'+x.id+'">Déplacer en '+arena(o.alt).name.toLowerCase()+'</button>':U.chip('Conflit','bad',true))):'';
     return '<div class="pz-gr'+(o.st==='bad'&&!fx?' bad':o.st==='chg'||o.st==='new'?' chg':o.st==='removed'?' off':'')+'"><span class="tm">'+(o.s<20*60?hc(o.s):'')+'</span><div style="min-width:0"><b class="ellip" style="display:block">'+x.title+'</b><span class="xs mut ellip" style="display:block">'+(p?p.first+' '+p.last+' · ':'')+(x.arena?arena(fx?o.alt:x.arena).name:'')+(o.note?' · '+(fx?'déplacé en '+arena(o.alt).name.toLowerCase():o.note):'')+'</span></div>'+chip+'</div>'}).join('')});
   h+='<div class="note" style="margin-top:14px">'+ICON('info','sm')+'<span>La grille s’applique à la semaine du '+perLabel(1)+'. Les cavaliers dont le moniteur change sont prévenus au moment de l’application.</span></div>'}
  b.innerHTML=h;bk.textContent=step?'Retour':'Annuler';nx.innerHTML=step<3?'Continuer'+ICON('arrow','sm'):ICON('check','sm')+'Appliquer la grille';
  on(b,'[data-dk]',function(x){var k=x.getAttribute('data-dk'),d=+x.getAttribute('data-dd'),arr=cfg.av[k]||cfg.ar[k];arr[d]=!arr[d];res=null;paint()});
  on(b,'[data-lv]',function(x){var k=x.getAttribute('data-lv');cfg.lvl[k]=Math.max(0,Math.min(12,(cfg.lvl[k]||0)+ +x.getAttribute('data-v')));res=null;paint()});
  on(b,'[data-fix]',function(x){var id=x.getAttribute('data-fix');fixes[id]=1;paint();P.toast('Déplacement noté : il sera appliqué avec la grille',{icon:'swap'})})}
 bk.onclick=function(){if(!step){sh.close();return}step--;paint()};
 nx.onclick=function(){if(step<3){step++;if(step===3)res=null;paint();body.scrollTop=0;return}
  var list=res.filter(function(o){return o.st!=='removed'&&!o.fixed&&o.l.dow!=null}).map(function(o){return o.l}),prevGen=ST.gen,prevMv={},moved=[];
  res.filter(function(o){return o.fixed&&fixes[o.l.id]&&o.alt}).forEach(function(o){prevMv[o.l.id]=ST.moves[o.l.id];ST.moves[o.l.id]={d:o.d,s:o.s,a:o.alt};moved.push(o.l.id)});
  var chg=res.filter(function(o){return o.st==='chg'||o.st==='new'}).length;
  ST.gen={off:1,list:list};ST.off=1;ST.view='week';sh.close();redraw();
  P.toast('Semaine type appliquée au '+perLabel(1,true)+' : '+plural(list.filter(function(l){return l.cap>0}).length,'reprise')+', '+plural(chg,'changement')+(moved.length?', '+plural(moved.length,'cours déplacé','cours déplacés'):''),{icon:'checkc',ms:6000,undo:function(){ST.gen=prevGen;moved.forEach(function(id){if(prevMv[id])ST.moves[id]=prevMv[id];else delete ST.moves[id]});redraw();P.toast('Grille précédente rétablie',{icon:'refresh'})}})}}

/* ---------- Programmation du trimestre (12 séances, un thème par semaine) ---------- */
var PROG={cso:['Galop de travail et équilibre','Barres au sol et cadence','Cavalettis et rythme','Gymnastique : croix puis vertical','Contrat de foulées en ligne droite','Tournants et courbes','Enchaînement de quatre obstacles','Oxers et largeur','Parcours de huit obstacles','Combinaisons double et triple','Parcours chronométré','Séance bilan : parcours type'],
 plat:['Mise en selle et assiette','Transitions au pas et au trot','Cercles et voltes','Trot enlevé et diagonal','Départs au galop','Cession à la jambe','Épaule en dedans','Travail sans étriers','Figures de manège','Allongements','Reprise de dressage imposée','Séance bilan : reprise notée'],
 poney:['Pansage et sécurité','Équilibre au pas','Trot assis et enlevé','Jeux d’adresse','Slalom entre les plots','Premiers galops','Barres au sol','Petit parcours de jeux','Voltige au pas','Maniabilité en carrière','Parcours de maniabilité','Fête des poneys, bilan du trimestre']};
function progOf(l){if(!ST.prog)ST.prog={};if(!ST.prog[l.id]){var k=lv(l)==='poney'?'poney':/CSO|cross|concours|Horse|Équipe/i.test(l.title)?'cso':'plat';ST.prog[l.id]={k:k,th:PROG[k].slice(),saved:false}}return ST.prog[l.id]}
function openProg(l,after){var pg=progOf(l),th=pg.th.slice(),d0=dateOf(di(l),0);
 var sh=P.sheet({title:'Programmation du trimestre',icon:'list',wide:true,body:function(b){b.innerHTML='<div class="pl-sum"><div class="w">'+l.title+' <span>· '+DNL[di(l)]+' '+hm(mn(l.start))+', '+D.name(l.coach)+'</span></div></div>'+
   '<div class="hrow wrap sp" style="margin:4px 0 10px"><span class="s mut">12 séances du '+F.date(d0)+' au '+F.date(D.day(F.days(D.iso(d0))+77))+', un thème par semaine.</span><span class="hrow" style="--g:6px">'+U.seg([['cso','Obstacle'],['plat','Plat'],['poney','Poney']],pg.k,'data-pk')+'</span></div>'+
   '<div data-rows>'+rows()+'</div>'},
  foot:'<button class="btn" data-share>'+ICON('send','sm')+'Envoyer aux cavaliers</button><button class="btn pri" data-ok>'+ICON('check','sm')+'Enregistrer la programmation</button>'});
 function rows(){return th.map(function(t,i){var d=D.day(F.days(D.iso(d0))+7*i),hol=holiday(D.iso(d)),vac=vacation(D.iso(d));return '<div class="pz-pg'+(i===0?' cur':'')+'"><div class="wk"><b>Séance '+(i+1)+'</b>'+F.date(d)+(i===0?' · cette semaine':hol?' · férié':vac?' · vacances':'')+'</div><input class="in" data-pi="'+i+'" value="'+F.esc(t)+'"'+(hol||vac?' title="Pas de reprise ce jour-là : le thème glisse à la séance suivante"':'')+'></div>'}).join('')}
 function read(){$$('[data-pi]',sh).forEach(function(x){th[+x.getAttribute('data-pi')]=x.value})}
 on(sh,'[data-pk]',function(b){pg.k=b.getAttribute('data-pk');th=PROG[pg.k].slice();$('[data-rows]',sh).innerHTML=rows()});
 on(sh,'[data-share]',function(){read();P.toast('Programmation envoyée à '+plural(l.riders.length,'cavalier')+' dans leur carnet de progression',{icon:'send'})});
 on(sh,'[data-ok]',function(){read();pg.th=th;pg.saved=true;ST.notes[l.id]={th:th[0],tx:(ST.notes[l.id]&&ST.notes[l.id].tx)||'Séance 1 sur 12 de la programmation du trimestre. Reprendre la mise en selle dix minutes avant d’aborder le thème.'};sh.close();if(after)after();P.toast('Programmation du trimestre enregistrée : 12 séances, thème de la semaine « '+th[0]+' »',{icon:'checkc'})})}

/* ---------- Écran de la sellerie : plein écran, mise à jour toutes les 20 secondes ---------- */
P.sellerieParts=P.sellerieParts||{};
P.sellerie=function(o){o=o||{};var root=P.app();if(!root)return;var old=$('.sl-k',root);if(old)old.remove();
 var t=NOW,tick=0,el=document.createElement('div');el.className='sl-k';el.setAttribute('data-transient','');el.setAttribute('role','dialog');el.setAttribute('aria-label','Écran de la sellerie');root.appendChild(el);
 var NEWS=['Feuille de monte à jour, chevaux attribués automatiquement','Hersage de la carrière d’honneur confirmé à '+hm(mn(FX.hersage.at)),'Ferrure d’Ulysse confirmée jeudi à 9 h avec Benoît Gautier','Tornado reste au box : vétérinaire à 14 h','Distribution de midi : Lucie prend le relais','Pensez à curer les pieds au retour du paddock'];
 function lessons(){return weekEvents(0).filter(function(e){return e.d===TDI&&!e.cx&&e.l.cap>0}).sort(function(a,b){return a.s-b.s})}
 function paint(){var L=lessons(),nx=o.lesson?L.find(function(e){return e.l.id===o.lesson&&e.s+e.dur>t}):null;nx=nx||L.find(function(e){return e.s+e.dur>t});
  var ld=loads(TDI),h='<div class="sl-hd">'+LOGO(30,'var(--hero-ink)','var(--strass)')+'<div class="grow"><h2>'+D.club.name+' · sellerie</h2><div class="sl-m s">'+cap1(F.dateL(D.today))+'</div></div><span class="sl-live"><i></i>DIRECT</span><span class="sl-clock">'+hc(t)+'</span><button class="btn sl-q" data-q>'+ICON('x','sm')+'Quitter</button></div>'+
   '<div class="sl-upd"><span class="sl-m">Mis à jour à '+hm(t)+'</span><span class="bar"><i></i></span>'+(tick?'<span class="sl-news">'+ICON('refresh','sm')+'<span>'+NEWS[(tick-1)%NEWS.length]+'</span></span>':'<span class="sl-m">Prochaine mise à jour dans 20 secondes</span>')+'</div><div class="sl-grid">';
  /* reprises du jour et attributions */
  h+='<div class="sl-col'+(o.focus==='reprises'?' hi':'')+'"><h3>'+ICON('planning','sm')+'Reprises du jour<small>'+cntTxt(dayCnt(weekEvents(0).filter(function(e){return e.d===TDI})))+'</small></h3>';
  if(nx){var mins=nx.s-t;h+='<div class="sl-next"><div class="ey">'+(mins>0?'Prochaine séance · dans '+(mins>=60?hm(mins):mins+' min'):'En cours · jusqu’à '+hm(nx.s+nx.dur))+'</div><h4>'+hm(nx.s)+' · '+nx.l.title+'</h4><div class="sl-m s">'+D.name(nx.l.coach)+' · '+place(nx)+' · '+nx.l.riders.length+'/'+nx.l.cap+'</div>'+
    '<div class="sl-pairs">'+nx.l.riders.map(function(r){var m=D.member(r),hid=nx.l.horses[r],hh=hid&&D.horse(hid);return '<div class="sl-pair'+(hh?'':' none')+'"><span>'+m.first+' '+m.last.charAt(0)+'.</span><b>'+(hh?hh.name.split(' ')[0]:'À attribuer')+'</b></div>'}).join('')+'</div></div>'}
  h+=L.filter(function(e){return e!==nx}).map(function(e){return '<div class="sl-ls'+(e.s+e.dur<=t?' past':'')+'"><span class="tm">'+hc(e.s)+'</span><div style="min-width:0"><div class="b ellip">'+e.l.title+'</div><div class="xs sl-m ellip">'+D.person(e.l.coach).first+' · '+place(e)+'</div></div><span class="xs num">'+(e.s+e.dur<=t?'Terminée':e.l.riders.length+'/'+e.l.cap)+'</span></div>'}).join('')+'</div>';
  /* consignes */
  var cs=[];if(P.sellerieParts.consignes)cs=P.sellerieParts.consignes(t)||[];else D.horses.filter(function(x){return x.alerts.length}).slice(0,5).forEach(function(x){cs.push({i:'horse',c:x.status,t:'<b>'+x.name+'</b> : '+x.alerts[0].charAt(0).toLowerCase()+x.alerts[0].slice(1)})});
  var hs=mn(FX.hersage.at);cs.unshift({i:'tractor',c:t<hs+45?'warn':'',t:'<b>'+arena(FX.hersage.arena).name+'</b> fermée de '+hm(hs)+' à '+hm(hs+45)+' pour le hersage'});
  var tb=(D.trackBookings||[]).filter(function(b){return b.date===D.iso(D.today)});if(tb.length)cs.push({i:'arena',c:'',t:'Pistes réservées par les propriétaires : '+tb.map(function(b){var x=D.horse(b.horse);return hm(mn(b.from))+', '+arena(b.arena).name.toLowerCase()+(x?' ('+x.name.split(' ')[0]+')':'')}).join(' ; ')});
  h+='<div class="sl-col'+(o.focus==='consignes'?' hi':'')+'"><h3>'+ICON('info','sm')+'Consignes<small>'+cs.length+'</small></h3>'+cs.map(function(c){return '<div class="sl-c '+(c.c||'')+'">'+ICON(c.i||'info','sm')+'<span>'+c.t+'</span></div>'}).join('')+'</div>';
  /* distribution */
  var ds=P.sellerieParts.distribution?P.sellerieParts.distribution(t):null;
  h+='<div class="sl-col'+(o.focus==='distribution'?' hi':'')+'"><h3>'+ICON('feed','sm')+(ds?ds.title:'Distribution')+'<small>'+(ds?ds.sub:'')+'</small></h3>'+(ds?ds.html:'<div class="sl-c">'+ICON('feed','sm')+'<span>Le tableau de distribution s’affiche ici depuis l’écran Alimentation.</span></div>')+'</div>';
  el.innerHTML=h+'</div>';$('[data-q]',el).onclick=close}
 function close(){clearInterval(iv);document.removeEventListener('keydown',esc);el.classList.add('out');setTimeout(function(){el.remove()},P.RM?0:200);P.toast('Écran de la sellerie fermé',{icon:'expand'})}
 function esc(e){if(e.key==='Escape')close()}
 document.addEventListener('keydown',esc);paint();
 var iv=setInterval(function(){if(!el.isConnected){clearInterval(iv);document.removeEventListener('keydown',esc);return}t+=1;tick++;paint()},20000);
 return {close:close}};

/* ---------- Palette, assistant, visite ---------- */
function goPlan(fn){P.go('planning');setTimeout(fn,380)}
P.actions.push(
 {role:'gerant',label:'Créer une reprise',icon:'calendar_add',run:function(){goPlan(function(){openCreate({})})}},
 {role:'gerant',label:'Créer un stage',icon:'flag',run:function(){goPlan(function(){openCreate({type:'stage'})})}},
 {role:'gerant',label:'Générer la semaine type',icon:'repeat',run:function(){goPlan(openGenerate)}},
 {role:'gerant',label:'Afficher l’écran de la sellerie',icon:'expand',run:function(){goPlan(function(){P.sellerie({focus:'reprises'})})}},
 {role:'gerant',label:'Attribuer les chevaux de la prochaine reprise',icon:'horse',run:function(){ST.off=0;ST.tab='montoir';goPlan(function(){openLesson('l05',1)})}},
 {role:'gerant',label:'Gérer les vacances et jours fériés',icon:'holiday',run:function(){goPlan(openHolidays)}},
 {role:'gerant',label:'Voir le planning de la semaine prochaine',icon:'planning',run:function(){ST.off=1;ST.view='week';P.go('planning')}});
P.brain.push({role:'gerant',re:/planning|samedi|reprise|montoir|conflit/i,reply:function(){var all5=weekEvents(0).filter(function(e){return e.d===5&&e.l.cap>0&&!e.cx}),ev=all5.filter(function(e){return e.k!=='particulier'}),pa=all5.filter(function(e){return e.k==='particulier'}),ins=0,pl=0,hs={},none=0;ev.forEach(function(e){ins+=e.l.riders.length;pl+=e.l.cap;var ld=loads(e.d);e.l.riders.forEach(function(r){var st=hstate(e.l,r,ld);if(st.none)none++;else if(st.lvl==='bad')hs[st.h.id]=1})});var nh=Object.keys(hs).length,cf=conflicts(weekEvents(0));
 return {text:'Samedi 21 novembre compte '+ev.length+' reprises et stages pour '+ins+' cavaliers ('+(pl-ins)+' places libres). '+(pa.length?'S’y ajoute'+(pa.length>1?'nt ':' ')+plural(pa.length,'cours particulier','cours particuliers')+' ('+pa.map(function(e){return hm(e.s)}).join(', ')+'). ':'')+(nh||none?'Dans le montoir, '+(nh?plural(nh,'cheval','chevaux')+' à remplacer':'')+(none?(nh?' et ':'')+plural(none,'cavalier')+' encore sans cheval':'')+'.':'Le montoir est complet et aucun cheval ne dépasse trois reprises.')+(cf.length?' Attention, '+plural(cf.length,'conflit')+' de piste cette semaine.':''),
  card:ev.map(function(e){return '<div class="hrow sp"><span class="s">'+hm(e.s)+' · '+e.l.title+'</span><b class="s num">'+e.l.riders.length+'/'+e.l.cap+'</b></div>'}).join(''),
  actions:[{label:'Ouvrir samedi par piste',run:function(){ST.off=0;ST.day=5;ST.view='day';P.go('planning');return 'Planning ouvert'}},{label:'Proposer les places libres en rattrapage',run:function(){D.planCatch.forEach(function(c){ST.prop[c.m]=1});P.toast(D.planCatch.length+' propositions de rattrapage envoyées');return D.planCatch.length+' propositions envoyées'}}]}}});
P.tourSteps.push({route:'planning',title:'Le planning se règle en glissant',text:'Chaque reprise se déplace à la souris : Stabl vérifie le moniteur et la piste avant le lâcher. Ouvrez une reprise et Stabl attribue les chevaux selon le niveau, le gabarit et la charge de travail du jour.'});

D.planExtras.forEach(function(l){l.riders.forEach(function(r){var o=D.horses.find(function(h){return h.owner===r});if(o&&!l.horses[r])l.horses[r]=o.id})});

/* =====================================================================
   RAPPORTS
   ===================================================================== */
P.css(`
.lx-k{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}
@container main (max-width:1080px){.lx-k{grid-template-columns:repeat(2,minmax(0,1fr))}}
@container main (max-width:520px){.lx-k{gap:10px}}
.lx-bg{transform-box:fill-box;transform-origin:bottom;animation:grow .7s var(--e-out) both;animation-delay:calc(var(--i)*30ms)}
.rp-bar{display:flex;align-items:center;gap:10px 16px;flex-wrap:wrap;margin-bottom:20px}
.rp-bar .px-tabs{flex:1;min-width:0;margin:0;overflow-x:auto;scrollbar-width:none}
.rp-bar .px-tabs::-webkit-scrollbar{display:none}
.rp-ctl{display:flex;align-items:center;gap:8px}
.app.mobile .rp-bar{gap:12px;margin-bottom:16px}.app.mobile .rp-bar .px-tabs{margin:0 -16px;padding:2px 16px;flex:0 0 calc(100% + 32px);max-width:none}
.rp-ctl .in{height:44px;width:auto;font-size:14.5px;font-weight:650;border-radius:99px;padding-left:16px}
.rp-ask{position:relative;overflow:hidden;border-radius:28px;padding:24px 26px;display:flex;flex-direction:column;gap:14px;background:linear-gradient(150deg,var(--acc-bg) 0%,color-mix(in srgb,var(--acc-bg) 35%,var(--surface)) 58%,var(--surface) 100%);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--acc) 18%,var(--line))}
.rp-ask>.illu{position:absolute;right:10px;top:4px;width:150px;height:150px;pointer-events:none;opacity:.95}
.rp-ask .ast{display:inline-flex;align-items:center;gap:8px;font:700 13px var(--f-text);letter-spacing:.06em;text-transform:uppercase;color:var(--acc-deep)}
.rp-ask h2{font:800 28px/1.12 var(--f-display);letter-spacing:-.03em;max-width:24ch;color:var(--ink)}
.rp-ask form{display:flex;gap:8px;align-items:center;padding:5px 5px 5px 16px;border-radius:99px;box-shadow:inset 0 0 0 1px var(--line-2),var(--shadow-1);background:var(--surface);transition:box-shadow var(--t-2);max-width:720px;position:relative;z-index:1}
.rp-ask form:focus-within{box-shadow:inset 0 0 0 1.5px var(--acc),var(--ring)}
.rp-ask input{flex:1;border:0;outline:0;background:none;min-width:0;height:44px;font-size:15.5px;color:var(--ink)}
.rp-ask form>svg.i{color:var(--acc);width:22px;height:22px;flex:none}
.rp-ask form .btn{height:44px;border-radius:99px;padding:0 18px}
.rp-sg{display:flex;gap:8px;overflow-x:auto;scrollbar-width:none;position:relative;z-index:1}
.rp-sg::-webkit-scrollbar{display:none}
.rp-sg button{flex:none;font-size:14px;font-weight:600;height:40px;padding:0 16px;border-radius:99px;background:color-mix(in srgb,var(--surface) 80%,transparent);box-shadow:inset 0 0 0 1px var(--line);white-space:nowrap;color:var(--ink-2);transition:background var(--t-2),transform .3s var(--e-spring)}
.rp-sg button:hover{background:var(--surface);color:var(--ink);box-shadow:inset 0 0 0 1px var(--line-2),var(--shadow-1)}
.rp-sg button:active{transform:scale(.96)}
.rp-ans{border-top:1px solid color-mix(in srgb,var(--acc) 18%,var(--line));padding-top:16px;display:flex;flex-direction:column;gap:12px;animation:rise var(--t-4) var(--e-out) both;position:relative;z-index:1}
.rp-ans .q{font-size:14px;color:var(--mut);font-weight:600}
.rp-ans .a{font-size:16px;line-height:1.5;color:var(--ink);max-width:78ch}
.rp-ans .rows{max-width:620px;background:var(--surface);border-radius:18px;padding:4px 16px;box-shadow:inset 0 0 0 1px var(--line)}
.rp-ans .rows .rp-ar:first-child{border-top:0}
.rp-ar{display:grid;grid-template-columns:minmax(0,1fr) auto auto;gap:12px;white-space:nowrap;padding:10px 0;border-top:1px solid var(--line);font-size:14px;align-items:center}
.rp-heat{display:grid;grid-template-columns:40px repeat(11,minmax(0,1fr));gap:4px}
.rp-heat .hh{color:var(--mut);text-align:center;font-size:13px;font-variant-numeric:tabular-nums;padding-bottom:4px;white-space:nowrap}
.rp-heat .dl{color:var(--mut);font-weight:700;font-size:13px;display:flex;align-items:center}
.rp-hc{height:40px;border-radius:10px;display:grid;place-items:center;font-size:13px;font-weight:700;font-variant-numeric:tabular-nums;color:var(--ink);animation:fade var(--t-4) var(--e-out) both;animation-delay:calc(var(--i)*14ms);transition:transform .3s var(--e-spring),box-shadow var(--t-2);min-width:0}
button.rp-hc:hover{transform:scale(1.1);box-shadow:var(--shadow-2);z-index:1;position:relative}
.rp-hc.hi{color:var(--surface)}
.rp-hc.low{box-shadow:inset 0 0 0 1.5px var(--warn);background:var(--warn-pale);color:var(--warn)}
.rp-hc.none{background:none}
.rp-hc.none::after{content:"";width:4px;height:4px;border-radius:50%;background:var(--line-2)}
.rp-sc{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--mut)}
.rp-sc i{width:120px;height:10px;border-radius:5px;background:linear-gradient(90deg,color-mix(in srgb,var(--acc) 14%,var(--surface-2)),var(--acc))}
.rp-div{position:relative;height:10px;border-radius:5px;background:var(--bg-2);min-width:120px}
.rp-div u{position:absolute;top:-3px;bottom:-3px;width:1.5px;background:var(--line-2)}
.rp-div i{position:absolute;top:0;bottom:0;border-radius:5px;background:var(--c);transform-origin:var(--o);animation:pltl var(--t-4) var(--e-out) both}
.rp-h{display:grid;grid-template-columns:40px minmax(0,1fr) auto;gap:12px;align-items:center;padding:8px 10px;margin:0 -10px;border-radius:14px;cursor:pointer;min-height:56px;transition:background var(--t-1)}
.rp-h:hover{background:var(--surface-2)}
.rp-h .av{width:40px;height:40px}
.rp-grp{font:700 13px var(--f-text);letter-spacing:.05em;text-transform:uppercase;display:flex;align-items:center;gap:8px;margin:4px 0 6px}
.rp-grp i{width:8px;height:8px;border-radius:50%;background:var(--c)}
.rp-co{width:100%;border-collapse:separate;border-spacing:4px;font-size:14px}
.rp-co th{font-size:13px;font-weight:600;color:var(--mut);text-align:center;padding:4px 6px;white-space:nowrap}
.rp-co th:first-child,.rp-co td:first-child{text-align:left;padding-left:0}
.rp-co td{padding:0;text-align:center}
.rp-co td span{display:grid;place-items:center;height:40px;border-radius:10px;font-weight:700;font-variant-numeric:tabular-nums}
.rp-co td:first-child{font-weight:650;white-space:nowrap;padding-right:10px}
.rp-rs{display:grid;grid-template-columns:minmax(0,170px) minmax(0,1fr) 30px;gap:12px;align-items:center;padding:7px 0;font-size:14px}
.rp-w{display:grid;grid-template-columns:minmax(0,130px) minmax(0,1fr) 86px;gap:12px;align-items:center;padding:7px 0;font-size:14px}
.rp-mini{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px}
.rp-mini>div{border-radius:18px;padding:14px 16px;background:var(--d-bg,var(--surface-2));color:var(--d-ink,var(--ink))}
.rp-mini .l{font-size:13px;font-weight:600;opacity:.85}
.rp-mini .v{font:800 26px/1.1 var(--f-display);letter-spacing:-.03em;font-variant-numeric:tabular-nums;margin-top:4px}
.rp-cost{display:flex;align-items:center;gap:12px;padding:10px 0;border-top:1px solid var(--line);font-size:14.5px}
.rp-cost .ico{width:36px;height:36px;border-radius:11px}
.rp-cost .ico svg.i{width:20px;height:20px}
.rp-mix{display:grid;grid-template-columns:auto minmax(0,1fr);gap:16px;align-items:center}
@container main (max-width:620px){.rp-mix{grid-template-columns:minmax(0,1fr)}.rp-mix>:first-child{justify-self:center}}
@container main (max-width:520px){.rp-heat{gap:3px;grid-template-columns:30px repeat(11,minmax(0,1fr))}.rp-heat .hh:nth-child(odd){visibility:hidden}.rp-hc{font-size:13px;height:32px;border-radius:7px;letter-spacing:-.04em}.rp-ctl{width:100%}.rp-ctl .in{flex:1}.rp-ask{padding:20px 18px;border-radius:24px}.rp-ask h2{font-size:22px;margin-right:84px}.rp-ask>.illu{width:96px;height:96px;right:-6px;top:-2px}.rp-mini .v{font-size:21px}.rp-mini>div{padding:12px}}
`);
function sum(a){return a.reduce(function(x,y){return x+y},0)}
/* barres empilées maison : la classe .bar du moteur entre en collision avec rect.bar de P.chart.bars */
function bars(vals,labels,o){o=o||{};var mob=P.isMobile(),w=mob?340:640,h=o.h||220,pl=40,pb=24,pt=10,cols=o.colors||['var(--acc)'],mx=o.max||Math.max.apply(null,vals.map(function(v){return sum([].concat(v))}))*1.08,n=vals.length,bw=(w-pl-8)/n,g='';
 for(var k=0;k<=4;k++){var y=pt+(1-k/4)*(h-pt-pb);g+='<line class="grid" x1="'+pl+'" x2="'+(w-8)+'" y1="'+y+'" y2="'+y+'"/><text x="'+(pl-8)+'" y="'+(y+3.5)+'" text-anchor="end">'+(o.fmt?o.fmt(mx*k/4):Math.round(mx*k/4))+'</text>'}
 vals.forEach(function(v,i){var parts=[].concat(v),base=h-pb,x=pl+i*bw+bw*.2;g+='<g class="lx-bg" style="--i:'+i+'">';parts.forEach(function(pv,j){var bh=pv/mx*(h-pt-pb);base-=bh;g+='<rect x="'+x.toFixed(1)+'" y="'+(base+(j?1.5:0)).toFixed(1)+'" width="'+(bw*.6).toFixed(1)+'" height="'+Math.max(0,bh-(j?1.5:0)).toFixed(1)+'" rx="2.5" fill="'+cols[j%cols.length]+'"'+(o.hi!=null&&o.hi!==i?' opacity=".4"':'')+'/>'});
  g+='</g>'+(mob&&n>8&&i%2?'':'<text x="'+(x+bw*.3).toFixed(1)+'" y="'+(h-6)+'" text-anchor="middle">'+labels[i]+'</text>')});
 return '<svg class="chart" data-vw="'+w+'" viewBox="0 0 '+w+' '+h+'" role="img">'+g+'</svg>'}
var ACT=[['ens','Enseignement','var(--c1)',.061,24],['pen','Pensions','var(--c2)',.042,12],['stg','Stages','var(--c3)',.184,41],['con','Concours, coaching','var(--c4)',.11,9],['bou','Boutique et sellerie','var(--c5)',-.035,28]];
if(!D.rapAct){var SF={ens:[1,1,1,1,1,1,.9,.35,.15,1.1,1.05,1],stg:[1.6,.3,1.5,.4,1.6,.5,.8,3.2,2.4,.3,1.5,.4],con:[.3,.4,.6,1,1.4,1.6,1.6,1,.5,1.2,1.3,.9],bou:[1.8,.8,.8,.9,1,1,1,.8,.6,1.6,1,1]};
 D.rapAct=D.revenue.map(function(tot,m){var pen=15400+m*70,rest=tot-pen,w={ens:.62*SF.ens[m],stg:.12*SF.stg[m],con:.1*SF.con[m],bou:.1*SF.bou[m]},s=w.ens+w.stg+w.con+w.bou,o={pen:pen,ens:Math.round(rest*w.ens/s),stg:Math.round(rest*w.stg/s),con:Math.round(rest*w.con/s)};o.bou=tot-o.pen-o.ens-o.stg-o.con;return o});
 D.rapN1=D.rapAct.map(function(o){return Math.round(sum(ACT.map(function(a){return o[a[0]]/(1+a[3])})))});
 D.rapFill={l18:.52,l16:.58,l08:.63,l03:.71};
 D.rapSched=[{name:'Bilan de la semaine',freq:'Chaque lundi à 7 h',to:'Claire Dumont',fmt:'PDF',on:true},{name:'Bilan mensuel pour le cabinet comptable',freq:'Le 1er de chaque mois',to:'Claire Dumont, cabinet Fidexpert',fmt:'Excel et PDF',on:true},{name:'Remplissage des reprises',freq:'Chaque vendredi à 18 h',to:'Hugo, Inès et Thomas',fmt:'PDF',on:true},{name:'Charge de travail de la cavalerie',freq:'Chaque dimanche à 19 h',to:'Claire Dumont, Antoine Leroy',fmt:'PDF',on:false}];
 D.rapCohorts=[['2021-2022',31,[81,68,58,52]],['2022-2023',36,[83,71,63]],['2023-2024',42,[86,74]],['2024-2025',47,[88]],['2025-2026',44,[]]];
 D.rapLeave=[['Déménagement ou études',6],['Budget',4],['Horaires incompatibles',4],['Arrêt de l’équitation',3],['Autre club',2]];
}
function fillOf(l){var i=D.lessons.indexOf(l);return D.rapFill[l.id]||Math.min(1,l.riders.length/l.cap-((i*13)%7)/100)}
function slotEco(l){var f=fillOf(l),n=f*l.cap,h=l.dur/60,own=/Propriétaires/.test(l.title),rev=n*21.7*h,cost=(31+(own?0:n*11)+28)*h;return {l:l,f:f,n:n,rev:rev,cost:cost,m:rev-cost}}
function horseEco(h){var u=unav(h),hrs=Math.round(h.work*4.3*(h.status==='bad'?.3:u?.75:1)),rev=hrs*15,cost=h.costMonth+(h.status==='bad'?268:0);return {h:h,hrs:hrs,rev:rev,cost:cost,m:rev-cost}}
var RS={tab:'synthese',n:12,cmp:false,ans:null};
function rapAnswer(q){var sl=D.lessons.map(slotEco).sort(function(a,b){return a.m-b.m}),he=club.map(horseEco).sort(function(a,b){return b.m-a.m});
 if(/cheval|chevaux|rapporte|cavalerie/i.test(q)){var b=he[0],w=he[he.length-1];return {text:'<b>'+b.h.name+'</b> est le cheval de club le plus rentable : '+F.eur(b.m)+' de marge par mois pour '+b.hrs+' heures de reprise. À l’inverse, <b>'+w.h.name+'</b> coûte '+F.eur(-w.m)+' de plus qu’il ne rapporte'+(unav(w.h)?' ('+unav(w.h).toLowerCase()+')':'')+'.',rows:he.slice(0,3).concat(he.slice(-2)).map(function(x){return [x.h.name,x.hrs+' h',F.eur(x.m)]}),actions:[['Voir la marge par cheval',function(){RS.tab='chevaux';return 1}]]}}
 if(/août|aout|été|baisse|creux/i.test(q)){var a=D.rapAct[8];return {text:'En août, l’enseignement tombe à <b>'+F.eur(a.ens)+'</b> car les forfaits s’arrêtent, mais les stages rapportent <b>'+F.eur(a.stg)+'</b> et les pensions restent stables à '+F.eur(a.pen)+'. Deux semaines de stage supplémentaires fin août couvriraient le creux.',rows:ACT.map(function(x){return [x[1],'août',F.eur(a[x[0]])]}),actions:[['Voir le détail par activité',function(){RS.tab='activites';return 1}]]}}
 if(/moniteur|heure|équipe|equipe/i.test(q)){return {text:'Vos quatre moniteurs assurent <b>'+sum(D.lessons.map(function(l){return l.dur}))/60+' heures</b> de reprise par semaine. Thomas a la plus forte recette par heure grâce aux reprises de CSO, complètes à 97 %.',rows:['s02','s03','s04','s08'].map(function(id){var hh=sum(D.lessons.filter(function(l){return l.coach===id}).map(function(l){return l.dur}))/60;return [D.name(id),hm(Math.round(hh*60))+' / sem.',D.staffer(id).contract]}),actions:[['Voir les heures de l’équipe',function(){RS.tab='equipe';return 1}]]}}
 if(/départ|fidél|quitt|rétention|adhérent/i.test(q)){return {text:'<b>87 %</b> des adhérents de la saison dernière se sont réinscrits, deux points de mieux qu’en 2025. Sur 19 départs, 6 viennent d’un déménagement et 4 d’un problème d’horaires : un créneau adultes le samedi matin en retiendrait une partie.',rows:D.rapLeave.slice(0,4).map(function(x){return [x[0],'départs',String(x[1])]}),actions:[['Voir la fidélité',function(){RS.tab='adherents';return 1}]]}}
 var lose=sl.filter(function(x){return x.m<0});
 return {text:(lose.length?'<b>'+plural(lose.length,'créneau perd','créneaux perdent')+' de l’argent</b> une fois comptés le moniteur, les chevaux et la piste. ':'Aucun créneau n’est déficitaire. ')+'Le plus fragile est <b>'+sl[0].l.title+'</b>, le '+DNL[di(sl[0].l)]+' à '+hm(mn(sl[0].l.start))+' : '+Math.round(sl[0].f*100)+' % de remplissage et '+F.eur(Math.round(sl[0].m))+' par séance. Il devient rentable à partir de 6 cavaliers.',
  rows:sl.slice(0,4).map(function(x){return [x.l.title+' · '+x.l.day+' '+hm(mn(x.l.start)),Math.round(x.f*100)+' %',(x.m<0?'':'+')+F.eur(Math.round(x.m))]}),
  actions:[['Voir le remplissage par créneau',function(){RS.tab='creneaux';return 1}],['Proposer une séance découverte aux listes d’attente',function(){P.toast('Offre découverte envoyée à 9 personnes en liste d’attente');return 0}]]}}

P.mod({id:'rapports',role:'gerant',group:'Pilotage',title:'Rapports',icon:'report',n:20,phoneTitle:'Rapports',
 render:function(el,ctx){var first=true,boot=true;
  if(ctx&&ctx.params&&ctx.params.tab){RS.tab=ctx.params.tab;ctx.params.tab=null}
  function draw(){var n=RS.n,rev=D.revenue.slice(-n),cst=D.costs.slice(-n),n1=D.rapN1.slice(-n),mo=D.months.slice(-n),act=D.rapAct.slice(-n),occ=D.occupancy.slice(-n),CA=sum(rev),CA1=sum(n1),res=CA-sum(cst);
   var per=n===12?'12 derniers mois':n===6?'6 derniers mois':'saison en cours';
   var tot={};ACT.forEach(function(a){tot[a[0]]=sum(act.map(function(o){return o[a[0]]}))});
   var sl=D.lessons.map(slotEco),he=club.map(horseEco).sort(function(a,b){return b.m-a.m}),mxm=Math.max.apply(null,he.map(function(x){return Math.abs(x.m)}));
   function divBar(m){var w=Math.abs(m)/mxm*50;return '<div class="rp-div"><u style="left:50%"></u><i style="--c:var(--'+(m<0?'bad':'ok')+');--o:'+(m<0?'right':'left')+';'+(m<0?'right:50%':'left:50%')+';width:'+w+'%"></i></div>'}
   /* ----- blocs ----- */
   function bAct(){return '<div class="card span2"><div class="ch">'+pxHd('mo','euro','Chiffre d’affaires par activité',cap1(per)+', hors taxes')+U.seg([['a','Par activité'],['c','Face à l’an dernier']],RS.cmp?'c':'a','data-cmp')+'</div><div class="cb">'+
     (RS.cmp?C.line([{v:rev,c:'var(--acc)',area:true},{v:n1,c:'var(--mut-2)',dash:true}],mo,{fmt:function(v){return Math.round(v/1000)+' k'},h:300})+'<div class="hrow sp wrap" style="margin-top:10px">'+C.legend([['Cette année','var(--acc)'],['An dernier','var(--mut-2)']])+'<span class="s"><b class="okc">+'+((CA/CA1-1)*100).toFixed(1).replace('.',',')+' %</b> <span class="mut">soit '+F.eur(CA-CA1)+' de plus</span></span></div>':
      bars(act.map(function(o){return ACT.map(function(a){return o[a[0]]})}),mo,{colors:ACT.map(function(a){return a[2]}),fmt:function(v){return Math.round(v/1000)+' k'},h:300})+'<div class="hrow sp wrap" style="margin-top:10px">'+C.legend(ACT.map(function(a){return [a[1],a[2]]}))+'</div>')+'</div></div>'}
   function bMix(){return '<div class="card"><div class="ch">'+pxHd('mo','layers','Répartition',cap1(per))+'</div><div class="cb stack" style="--g:12px"><div style="display:grid;place-items:center">'+C.donut(ACT.map(function(a){return {v:tot[a[0]],c:a[2]}}),{size:150,center:Math.round(CA/1000)+' k€'})+'</div><div>'+ACT.map(function(a){return '<div class="rp-ar" style="grid-template-columns:minmax(0,1fr) auto 76px"><span class="hrow" style="--g:8px"><i style="width:12px;height:12px;border-radius:4px;background:'+a[2]+';flex:none"></i><span class="ellip">'+a[1]+'</span></span><b class="num">'+F.eur(tot[a[0]])+'</b><span class="delta '+(a[3]<0?'down':'up')+' num" style="text-align:right">'+(a[3]<0?'−':'+')+Math.abs(a[3]*100).toFixed(1).replace('.',',')+' %</span></div>'}).join('')+'</div></div></div>'}
   function bActTable(){return U.table([{l:'Activité',f:function(a){return '<span class="hrow" style="--g:8px"><i style="width:12px;height:12px;border-radius:4px;background:'+a[2]+'"></i><b>'+a[1]+'</b></span>'}},{l:'Chiffre d’affaires',n:true,f:function(a){return '<b>'+F.eur(tot[a[0]])+'</b>'}},{l:'An dernier',n:true,hide:true,f:function(a){return F.eur(Math.round(tot[a[0]]/(1+a[3])))}},{l:'Évolution',n:true,f:function(a){return '<span class="delta '+(a[3]<0?'down':'up')+'">'+(a[3]<0?'−':'+')+Math.abs(a[3]*100).toFixed(1).replace('.',',')+' %</span>'}},{l:'Marge',n:true,f:function(a){return a[4]+' %'}},{l:'Part',hide:true,f:function(a){return '<div class="hrow" style="--g:8px;min-width:120px"><div class="grow">'+U.bar(tot[a[0]]/CA*100,a[2])+'</div><span class="num xs mut">'+Math.round(tot[a[0]]/CA*100)+' %</span></div>'}}],ACT)}
   function bHeat(full){var g='<div class="rp-heat"><span></span>',k=0;for(var hh=9;hh<20;hh++)g+='<span class="hh">'+hh+' h</span>';
     DN.forEach(function(dn,d){g+='<span class="dl">'+dn+'</span>';for(var hh=9;hh<20;hh++){var l=D.lessons.find(function(x){return di(x)===d&&Math.floor(mn(x.start)/60)===hh});k++;if(!l){g+='<span class="rp-hc none" style="--i:'+k+'"></span>';continue}var f=Math.round(fillOf(l)*100);
      g+='<button class="rp-hc'+(f<65?' low':f>=84?' hi':'')+'" data-slot="'+l.id+'" style="--i:'+k+(f<65?'':';background:color-mix(in srgb,var(--acc) '+Math.round(18+(f-65)/35*82)+'%,var(--surface-2))')+'" title="'+F.esc(l.title+' · '+DNL[d]+' '+hm(mn(l.start))+' · '+f+' % de remplissage')+'">'+f+'</button>'}});
     var weak=sl.slice().sort(function(a,b){return a.f-b.f}).slice(0,2);
     return '<div class="card'+(full?' span2':'')+'"><div class="ch">'+pxHd('rd','planning','Remplissage par créneau','Taux moyen depuis septembre, en'+NB+'% des places')+'<div class="rp-sc hide-s"><span>65 %</span><i></i><span>100 %</span></div></div><div class="cb stack" style="--g:12px">'+g+'</div>'+
      (weak.length?'<div class="lx-ai">'+ICON('bulb','sm')+'<span>Deux créneaux tirent la moyenne vers le bas : <b>'+weak[0].l.title+'</b> ('+weak[0].l.day+' '+hm(mn(weak[0].l.start))+', '+Math.round(weak[0].f*100)+' %) et <b>'+weak[1].l.title+'</b> ('+weak[1].l.day+' '+hm(mn(weak[1].l.start))+', '+Math.round(weak[1].f*100)+' %).</span></div>':'')+'</div></div>'}
   function bSlots(){var rows=sl.slice().sort(function(a,b){return a.m-b.m});return U.table([{l:'Créneau',f:function(x){return '<b>'+x.l.title+'</b><div class="xs mut">'+cap1(DNL[di(x.l)])+' '+hm(mn(x.l.start))+' · '+D.staffer(x.l.coach).first+'</div>'}},{l:'Remplissage',f:function(x){return '<div class="hrow" style="--g:8px;min-width:120px"><div class="grow">'+U.bar(x.f*100,x.f<.65?'var(--warn)':'var(--acc)')+'</div><span class="num s b">'+Math.round(x.f*100)+' %</span></div>'}},{l:'Recette par séance',n:true,hide:true,f:function(x){return F.eur(Math.round(x.rev))}},{l:'Coût',n:true,hide:true,f:function(x){return F.eur(Math.round(x.cost))}},{l:'Marge par séance',n:true,f:function(x){return '<b class="'+(x.m<0?'badc':'okc')+'">'+(x.m<0?'':'+')+F.eur(Math.round(x.m))+'</b>'}}],rows.map(function(x){x.id=x.l.id;return x}),{click:true})}
   function hRow(x){return '<div class="rp-h" data-go="cheval" data-id="'+x.h.id+'">'+U.hav(x.h)+'<div style="min-width:0"><div class="b s ellip">'+x.h.name+'</div><div class="xs mut ellip">'+x.hrs+' h de reprise · coût '+F.eur(x.cost)+(unav(x.h)?' · '+unav(x.h).toLowerCase():'')+'</div></div><b class="num s '+(x.m<0?'badc':'okc')+'">'+(x.m<0?'':'+')+F.eur(x.m)+'</b></div>'}
   function bHorseTop(){return '<div class="card"><div class="ch">'+pxHd('hz','horse','Marge par cheval','Cavalerie de club, par mois')+'<button class="btn ghost sm" data-tabgo="chevaux">Les 20'+ICON('arrow','sm')+'</button></div><div class="cb"><div class="rp-grp okc" style="--c:var(--ok)"><i></i>Les plus rentables</div>'+he.slice(0,3).map(hRow).join('')+'<div class="rp-grp badc" style="--c:var(--bad);margin-top:14px"><i></i>À surveiller</div>'+he.slice(-3).reverse().map(hRow).join('')+'</div></div>'}
   function bHorses(){return U.table([{l:'Cheval',f:function(x){return '<span class="hrow" style="--g:10px">'+U.hav(x.h,'sm')+'<span><b>'+x.h.name+'</b>'+(unav(x.h)?' '+U.chip(unav(x.h).split(',')[0],x.h.status==='bad'?'bad':'warn'):'')+'</span></span>'}},{l:'Heures de reprise',n:true,hide:true,f:function(x){return x.hrs+' h'}},{l:'Revenus générés',n:true,f:function(x){return F.eur(x.rev)}},{l:'Coût mensuel',n:true,f:function(x){return F.eur(x.cost)}},{l:'Marge',f:function(x){return divBar(x.m)},hide:true},{l:'',n:true,f:function(x){return '<b class="'+(x.m<0?'badc':'okc')+'">'+(x.m<0?'':'+')+F.eur(x.m)+'</b>'}}],he.map(function(x){x.id=x.h.id;return x}),{click:true})}
   function bWork(){var ws=club.slice().sort(function(a,b){return b.work/b.workMax-a.work/a.workMax}).slice(0,10);return '<div class="card"><div class="ch">'+pxHd('hz','gauge','Charge de travail','Heures par semaine, face au plafond de chaque cheval')+U.chip(plural(club.filter(function(h){return h.work>=h.workMax}).length,'cheval au plafond','chevaux au plafond'),'warn',true)+'</div><div class="cb">'+ws.map(function(h){var p=h.work/h.workMax*100;return '<div class="rp-w"><span class="b ellip">'+h.name+'</span>'+U.bar(p,p>=100?'var(--bad)':p>=85?'var(--warn)':'var(--acc)')+'<span class="num" style="text-align:right"><b>'+h.work+' h</b> <span class="mut">/ '+h.workMax+' h</span></span></div>'}).join('')+'</div><div class="cf"><span class="s mut grow">L’attribution automatique des chevaux tient compte de ces plafonds.</span><button class="btn sm" data-go="planning">Ouvrir le planning</button></div></div>'}
   function bCohort(){return '<div class="card"><div class="ch">'+pxHd('rd','heart','Fidélité par saison d’arrivée','Part des nouveaux adhérents encore inscrits')+'</div><div class="cb"><div class="scroll-x"><table class="rp-co"><thead><tr><th>Arrivés en</th><th>Nouveaux</th><th>Après 1 an</th><th>2 ans</th><th>3 ans</th><th>4 ans</th></tr></thead><tbody>'+D.rapCohorts.map(function(c){var t='<tr><td>'+c[0]+'</td><td><span class="mut" style="font-weight:500">'+c[1]+'</span></td>';for(var i=0;i<4;i++){var v=c[2][i];t+='<td>'+(v==null?(i===0&&!c[2].length?'<span class="mut" style="font-weight:500;font-size:13px">en cours</span>':''):'<span style="background:color-mix(in srgb,var(--acc) '+Math.round((v-40)*1.35)+'%,var(--surface-2));color:'+(v>=78?'var(--surface)':'var(--ink)')+'">'+v+' %</span>')+'</td>'}return t+'</tr>'}).join('')+'</tbody></table></div><div class="lx-ai" style="margin-top:12px">'+ICON('bulb','sm')+'<span>La première réinscription progresse chaque année : 88 % pour les arrivants de 2024, contre 81 % trois ans plus tôt. Le cap difficile reste la deuxième année.</span></div></div></div>'}
   function bLeave(){var mx=D.rapLeave[0][1],avg=(sum(D.members.map(function(m){return 2026-m.since}))/D.members.length).toFixed(1).replace('.',',');return '<div class="card"><div class="ch">'+pxHd('rd','members','Arrivées et départs','12 derniers mois')+'</div><div class="cb stack" style="--g:16px"><div class="rp-mini">'+[['Arrivées','22','hz'],['Départs','19','cr'],['Ancienneté',avg+NB+'ans','rd']].map(function(x){return '<div class="d-'+x[2]+'"><div class="l">'+x[0]+'</div><div class="v">'+x[1]+'</div></div>'}).join('')+'</div><div><div class="eyebrow" style="margin-bottom:8px">Motifs de départ</div>'+D.rapLeave.map(function(r){return '<div class="rp-rs"><span class="ellip">'+r[0]+'</span>'+U.bar(r[1]/mx*100,'var(--rd)')+'<b class="num" style="text-align:right">'+r[1]+'</b></div>'}).join('')+'</div></div></div>'}
   function bRisk(){var rk=D.members.filter(function(m){return m.licence!=='2027'&&m.forfait!=='f5'}).slice(0,4);return '<div class="card"><div class="ch">'+pxHd('cr','alert','Adhérents à risque','Licence non renouvelée et absences répétées')+'<button class="btn sm" data-go="communication">'+ICON('send','sm')+'Leur écrire</button></div><div style="padding:6px 16px 12px">'+rk.map(function(m,i){return '<div class="pl-p" data-go="adherent" data-id="'+m.id+'" style="cursor:pointer">'+U.av(m)+'<div class="grow"><div class="b s ellip">'+m.first+' '+m.last+'</div><div class="xs mut ellip">Galop '+m.galop+' · adhérent depuis '+m.since+' · '+(3+i%2)+' absences en 6 semaines</div></div>'+U.chip(i<2?'Risque élevé':'À suivre',i<2?'bad':'warn')+'</div>'}).join('')+'</div></div>'}
   function teamRows(){return ['s02','s03','s04','s08'].filter(function(id){return D.staffer(id)}).map(function(id){var p=D.staffer(id),ls=D.lessons.filter(function(l){return l.coach===id}),h=sum(ls.map(function(l){return l.dur}))/60,r=sum(ls.map(function(l){return slotEco(l).rev}));return {id:id,p:p,h:h,k:sum(ls.map(function(l){return l.riders.length})),rph:r/h,ot:[2.5,0,4,0][['s02','s03','s04','s08'].indexOf(id)]}})}
   function bTeam(full){var rows=teamRows();if(!full)return '<div class="card"><div class="ch">'+pxHd('tm','coach','Heures des moniteurs','Cette semaine, face au contrat')+(RS.tab==='equipe'?'':'<button class="btn ghost sm" data-tabgo="equipe">Détail'+ICON('arrow','sm')+'</button>')+'</div><div style="padding:6px 16px 12px">'+rows.map(function(t){var mx=Math.round(t.p.hours*.6);return '<div class="pl-p">'+U.av(t.p)+'<div class="grow stack" style="--g:5px"><div class="hrow sp"><span class="b s">'+t.p.first+' '+t.p.last+'</span><span class="xs num"><b>'+hm(Math.round(t.h*60))+'</b> <span class="mut">/ '+mx+' h</span></span></div>'+U.bar(t.h/mx*100,col(t.p.id))+'</div></div>'}).join('')+'</div></div>';
     return U.table([{l:'Moniteur',f:function(t){return '<span class="hrow" style="--g:10px">'+U.av(t.p,'sm')+'<span><b>'+t.p.first+' '+t.p.last+'</b><div class="xs mut">'+t.p.contract+'</div></span></span>'}},{l:'Heures de cours',f:function(t){var mx=Math.round(t.p.hours*.6);return '<div class="hrow" style="--g:8px;min-width:130px"><div class="grow">'+U.bar(t.h/mx*100,col(t.p.id))+'</div><span class="num s"><b>'+hm(Math.round(t.h*60))+'</b> / '+mx+' h</span></div>'}},{l:'Cavaliers par semaine',n:true,hide:true,f:function(t){return t.k}},{l:'Recette par heure',n:true,f:function(t){return '<b>'+F.eur(Math.round(t.rph))+'</b>'}},{l:'Heures supplémentaires',n:true,hide:true,f:function(t){return t.ot?'<span class="warnc b">'+String(t.ot).replace('.',',')+' h</span>':'<span class="mut">0 h</span>'}}],rows)}
   /* ----- page ----- */
   var mob=P.isMobile(),lose=sl.filter(function(x){return x.m<0}).length,dCA=((CA/CA1-1)*100).toFixed(1).replace('.',',');
   var h='<div class="px-ph"><div><div class="eb"><span class="dot"></span>Pilotage · données à jour ce matin à 6'+NB+'h</div><h1>Rapports</h1><div class="sub">'+cap1(per)+' : <b>'+F.eur(CA)+'</b> de chiffre d’affaires, <b class="okc">+'+dCA+NB+'%</b> sur un an'+(lose?', et '+plural(lose,'créneau déficitaire','créneaux déficitaires'):'')+'.</div></div><div class="acts"><button class="btn" data-sched>'+ICON('clock')+(mob?'Programmés':'Rapports programmés')+'</button><button class="btn pri" data-exp>'+ICON('download')+'Exporter</button></div></div>';
   h+='<div class="rp-bar">'+pxTabs([['synthese','Synthèse','report','acc'],['activites','Activités','euro','mo'],['chevaux','Chevaux','horse','hz'],['creneaux','Remplissage','planning','rd'],['adherents','Fidélité','heart','rd'],['equipe','Équipe','coach','tm']],RS.tab,'data-rt')+'<div class="rp-ctl"><select class="in" data-per title="Période" aria-label="Période"><option value="12"'+(n===12?' selected':'')+'>12 derniers mois</option><option value="6"'+(n===6?' selected':'')+'>6 derniers mois</option><option value="3"'+(n===3?' selected':'')+'>Saison en cours</option></select></div></div><div class="stack'+(first?' rise':'')+'" style="--g:16px">';
   if(RS.tab==='synthese'){
    h+='<div class="rp-ask">'+(window.ILLU&&ILLU.trophee?ILLU.trophee({size:null}):'')+'<span class="ast">'+ICON('report','sm')+'Vos chiffres</span><h2>Posez une question à vos chiffres.</h2><form data-ask>'+ICON('search')+'<input placeholder="Par exemple : quel créneau perd de l’argent ?" autocomplete="off" aria-label="Question sur vos chiffres"><button class="btn pri" title="Poser la question">'+ICON('send')+'<span class="hide-s">Demander</span></button></form><div class="rp-sg scroll-x">'+['Quel créneau perd de l’argent'+NB+'?','Quel cheval rapporte le plus'+NB+'?','Pourquoi août est-il si bas'+NB+'?','Pourquoi des adhérents partent-ils'+NB+'?'].map(function(s){return '<button data-sg>'+s+'</button>'}).join('')+'</div><div data-ans></div></div>';
    var fillAvg=Math.round(sum(occ)/n);
    h+='<div class="px-k">'+U.kpi({label:'Chiffre d’affaires',count:CA,fmt:'eur',value:F.eur(CA),delta:'+'+dCA+NB+'%',dsub:' sur un an',spark:rev,icon:'euro',dom:'mo',tint:true,color:'var(--mo-ink)'})+U.kpi({label:'Résultat',count:res,fmt:'eur',value:F.eur(res),delta:Math.round(res/CA*100)+NB+'% de marge',spark:rev.map(function(v,i){return v-cst[i]}),icon:'trend',dom:'hz',tint:true,color:'var(--hz-ink)'})+U.kpi({label:'Remplissage',count:fillAvg,unit:'%',delta:'+3 pts',dsub:' sur un an',spark:occ,icon:'planning',dom:'rd',tint:true,color:'var(--rd-ink)'})+U.kpi({label:'Réinscriptions',count:87,unit:'%',delta:'+2 pts',dsub:' vs 2025',spark:[79,81,83,84,85,87],icon:'members',dom:'tm',tint:true,color:'var(--tm-ink)'})+'</div>';
    h+='<div class="g3">'+bAct()+bMix()+'</div><div class="g3">'+bHeat(true)+bHorseTop()+'</div><div class="g2">'+bTeam(false)+bRisk()+'</div>'}
   else if(RS.tab==='activites')h+='<div class="g3">'+bAct()+bMix()+'</div>'+bActTable();
   else if(RS.tab==='chevaux')h+='<div class="g2">'+bHorseTop()+bWork()+'</div>'+bHorses();
   else if(RS.tab==='creneaux')h+='<div class="g3">'+bHeat(true)+'<div class="card"><div class="ch">'+pxHd('mo','euro','Ce que coûte une séance')+'</div><div class="cb stack" style="--g:10px"><p class="s mut">Stabl compare la recette de chaque créneau au coût réel de la séance.</p><div>'+[['tm','coach','Moniteur, charges comprises','31'+NB+'€ / h'],['hz','horse','Cheval, par cavalier','11'+NB+'€ / h'],['ex','arena','Piste, éclairage et structure','28'+NB+'€ / h'],['mo','euro','Recette moyenne par cavalier','21,70'+NB+'€']].map(function(x){return '<div class="rp-cost"><span class="ico d-'+x[0]+'">'+ICON(x[1])+'</span><span class="grow">'+x[2]+'</span><b class="num">'+x[3]+'</b></div>'}).join('')+'</div>'+'<div class="lx-ai">'+ICON('bulb','sm')+'<span>Une reprise d’une heure devient rentable à partir de 6 cavaliers.</span></div></div></div></div>'+bSlots();
   else if(RS.tab==='adherents')h+='<div class="g2">'+bCohort()+bLeave()+'</div>'+bRisk();
   else h+=bTeam(true)+'<div class="g2">'+bTeam(false)+'<div class="card"><div class="ch">'+pxHd('acc','bulb','Ce que disent les chiffres')+'</div><div class="cb stack" style="--g:10px"><div class="lx-ai">'+ICON('bulb','sm')+'<span>Thomas dépasse son contrat de 4 heures ce mois-ci à cause de l’équipe concours. Confier la reprise Galop 5-6 du lundi à Hugo ramène tout le monde sous son plafond.</span></div><button class="btn sm" style="align-self:flex-start" data-go="planning">Ajuster dans le planning</button></div></div></div>';
   h+='</div>';el.innerHTML='<div class="lx-ph">'+h+'</div>';bind();if(first&&!boot)P.animate(el);boot=first=false;if(RS.ans)showAns(RS.ans,true)}
  function showAns(q,now){var box=$('[data-ans]',el);if(!box)return;RS.ans=q;box.innerHTML='<div class="rp-ans"><div class="q">'+F.esc(q)+'</div>'+U.skel(['72%','90%','54%'])+'</div>';
   setTimeout(function(){if(!box.isConnected)return;var r=rapAnswer(q);box.innerHTML='<div class="rp-ans"><div class="q hrow" style="--g:8px">'+ICON('search','sm')+''+F.esc(q)+'</div><div class="a">'+r.text+'</div><div class="rows">'+r.rows.map(function(x){return '<div class="rp-ar"><span class="ellip">'+x[0]+'</span><span class="mut num">'+x[1]+'</span><b class="num" style="min-width:70px;text-align:right">'+x[2]+'</b></div>'}).join('')+'</div><div class="hrow wrap">'+r.actions.map(function(a,i){return '<button class="btn'+(i?'':' pri')+'" data-aa="'+i+'">'+a[0]+'</button>'}).join('')+'<button class="btn ghost" data-aclr>Effacer</button></div></div>';
    on(box,'[data-aa]',function(b){var go=r.actions[+b.getAttribute('data-aa')][1]();if(go){RS.ans=null;draw();P.app().querySelector('.view').scrollTop=0}else b.outerHTML=U.chip('Envoyé','ok',true)});on(box,'[data-aclr]',function(){RS.ans=null;box.innerHTML=''})},now||P.RM?0:650)}
  function bind(){
   on(el,'[data-rt]',function(b){RS.tab=b.getAttribute('data-rt');first=true;draw()});
   on(el,'[data-tabgo]',function(b){RS.tab=b.getAttribute('data-tabgo');first=true;draw();P.app().querySelector('.view').scrollTop=0});
   on(el,'[data-per]',function(s){RS.n=+s.value;draw();P.toast('Période affichée : '+s.options[s.selectedIndex].text.toLowerCase(),{icon:'calendar_add'})},'change');
   on(el,'[data-cmp]',function(b){RS.cmp=b.getAttribute('data-cmp')==='c';draw()});
   on(el,'[data-sg]',function(b){showAns(b.textContent)});
   on(el,'[data-ask]',function(f,e){e.preventDefault();var i=$('input',f);if(i.value.trim()){showAns(i.value.trim());i.value=''}else{i.focus();P.toast('Écrivez votre question ou choisissez un exemple ci-dessous',{icon:'info'})}},'submit');
   on(el,'[data-slot]',function(b){openSlot(D.lessons.find(function(l){return l.id===b.getAttribute('data-slot')}))});
   on(el,'[data-row]',function(r){var id=r.getAttribute('data-row');if(/^l/.test(id))openSlot(D.lessons.find(function(l){return l.id===id}));else if(P.mods.cheval)P.go('cheval',{id:id});else openHorseEco(id)});
   on(el,'[data-exp]',openExport);on(el,'[data-sched]',openSched)}
  draw()}});

function openSlot(l){var x=slotEco(l),c=D.staffer(l.coach),hist=[0,1,2,3,4,5,6,7].map(function(i){return Math.max(2,Math.round(x.n+Math.sin(i*1.7+l.cap)*1.2))});
 var sh=P.sheet({title:l.title,icon:'report',body:'<div class="pl-sum"><div class="w">'+cap1(DNL[di(l)])+' <span>· '+hm(mn(l.start))+' · '+c.first+' '+c.last+' · '+arena(l.arena).name+'</span></div></div>'+
  '<div class="g3" style="--g:8px;grid-template-columns:repeat(3,minmax(0,1fr))">'+[['Remplissage',Math.round(x.f*100)+' %',x.f<.65?'warnc':''],['Recette',F.eur(Math.round(x.rev)),''],['Marge',(x.m<0?'':'+')+F.eur(Math.round(x.m)),x.m<0?'badc':'okc']].map(function(k){return '<div class="card soft" style="padding:10px 12px"><div class="xs mut">'+k[0]+'</div><div class="disp num '+k[2]+'" style="font-size:21px;font-weight:700">'+k[1]+'</div></div>'}).join('')+'</div>'+
  '<div class="lx-h">Cavaliers présents, 8 dernières semaines <span class="mut">capacité '+l.cap+'</span></div>'+bars(hist,['S40','S41','S42','S43','S44','S45','S46','S47'],{h:150,max:l.cap,hi:7})+
  '<div class="lx-h">Détail d’une séance</div>'+[['Recette, '+x.n.toFixed(1).replace('.',',')+' cavaliers en moyenne',F.eur(Math.round(x.rev))],['Moniteur','−'+F.eur(Math.round(31*l.dur/60))],['Chevaux','−'+F.eur(Math.round(x.cost-(31+28)*l.dur/60))],['Piste et structure','−'+F.eur(Math.round(28*l.dur/60))]].map(function(r){return '<div class="hrow sp s" style="padding:7px 0;border-top:1px solid var(--line)"><span>'+r[0]+'</span><b class="num">'+r[1]+'</b></div>'}).join('')+
  (x.m<0?'<div class="lx-ai" style="margin-top:12px">'+ICON('bulb','sm')+'<span>Il manque '+Math.max(1,Math.ceil(6-x.n))+' cavaliers pour équilibrer ce créneau. '+(l.wait?'':'9 personnes attendent une place sur d’autres reprises de même niveau.')+'</span></div>':''),
  foot:'<button class="btn" data-pl>Ouvrir dans le planning</button>'+(x.m<0?'<button class="btn pri" data-offer>'+ICON('send','sm')+'Proposer ce créneau aux listes d’attente</button>':'')});
 on(sh,'[data-pl]',function(){ST.off=0;ST.view='week';P.go('planning',{id:l.id})});
 on(sh,'[data-offer]',function(){sh.close();P.toast('Créneau « '+l.title+' » proposé à 9 personnes en liste d’attente',{icon:'send'})})}
function openHorseEco(id){var x=horseEco(D.horse(id));P.sheet({title:x.h.name,icon:'horse',body:'<div class="g3" style="--g:8px;grid-template-columns:repeat(3,minmax(0,1fr))">'+[['Revenus',F.eur(x.rev),''],['Coût',F.eur(x.cost),''],['Marge',(x.m<0?'':'+')+F.eur(x.m),x.m<0?'badc':'okc']].map(function(k){return '<div class="card soft" style="padding:10px 12px"><div class="xs mut">'+k[0]+'</div><div class="disp num '+k[2]+'" style="font-size:21px;font-weight:700">'+k[1]+'</div></div>'}).join('')+'</div><div class="lx-h">Ce mois-ci</div>'+[['Heures de reprise',x.hrs+' h'],['Charge hebdomadaire',x.h.work+' h sur '+x.h.workMax+' h'],['Pension, foin, grain et litière',F.eur(x.h.costMonth)],['Soins vétérinaires',F.eur(x.cost-x.h.costMonth)]].map(function(r){return '<div class="hrow sp s" style="padding:7px 0;border-top:1px solid var(--line)"><span>'+r[0]+'</span><b class="num">'+r[1]+'</b></div>'}).join('')})}
function openExport(){var sh=P.sheet({title:'Exporter les rapports',icon:'download',body:'<div class="lx-h">Contenu</div><div>'+[['Synthèse et indicateurs',1],['Chiffre d’affaires par activité',1],['Marge par cheval',1],['Remplissage par créneau',1],['Fidélité et départs',0],['Heures des moniteurs',0]].map(function(x,i){return '<div class="lx-opt"><div class="grow b s">'+x[0]+'</div>'+U.chk(x[1],'ex'+i)+'</div>'}).join('')+'</div><div class="lx-h">Format</div><div class="g3" style="--g:8px;grid-template-columns:repeat(3,minmax(0,1fr))">'+[['PDF','doc','Mis en page, prêt à imprimer'],['Excel','grid','Un onglet par rapport'],['CSV','code','Données brutes']].map(function(f){return '<button class="card pad hover stack" style="--g:6px;text-align:left;padding:14px" data-fmt="'+f[0]+'"><span class="av sq" style="--c:var(--acc-pale);color:var(--acc)">'+ICON(f[1])+'</span><b>'+f[0]+'</b><span class="xs mut">'+f[2]+'</span></button>'}).join('')+'</div>'});
 on(sh,'[data-fmt]',function(b){var f=b.getAttribute('data-fmt'),k=$$('.chk[aria-checked="true"]',sh).length;sh.close();P.toast(plural(k,'rapport exporté','rapports exportés')+' en '+f+' : tilleuls-rapports-novembre-2026.'+({PDF:'pdf',Excel:'xlsx',CSV:'zip'})[f],{icon:'download'})})}
function openSched(){var sh=P.sheet({title:'Rapports programmés',icon:'clock',body:function(b){paint(b)},foot:'<button class="btn pri" data-add>'+ICON('plus','sm')+'Programmer ce rapport</button>'});var body=$('.sb',sh);
 function paint(b){b.innerHTML='<p class="s mut" style="margin-bottom:10px">Stabl envoie ces rapports par e-mail, sans que vous ayez à y penser.</p><div>'+D.rapSched.map(function(r,i){return '<div class="lx-opt"><span class="av sq" style="--c:var(--acc-pale);color:var(--acc)">'+ICON('mail','sm')+'</span><div class="grow"><div class="b s">'+r.name+'</div><div class="xs mut">'+r.freq+' · '+r.fmt+' · à '+r.to+'</div></div><button class="tog" role="switch" data-sc="'+i+'" aria-checked="'+r.on+'"></button></div>'}).join('')+'</div><div class="lx-h">Nouveau rapport programmé</div><div class="lx-form">'+fld('Rapport',sel('r',['Synthèse et indicateurs','Chiffre d’affaires par activité','Marge par cheval','Remplissage par créneau','Fidélité et départs','Heures des moniteurs'],''),'full')+fld('Fréquence',sel('f',['Chaque lundi à 7 h','Chaque jour à 20 h','Le 1er de chaque mois','À la fin de chaque trimestre'],''))+fld('Format',sel('m',['PDF','Excel','Excel et PDF'],''))+fld('Destinataires','<input class="in" data-k="to" value="claire.dumont@ecurie-tilleuls.example">','full')+'</div>';
  on(b,'[data-sc]',function(t){var r=D.rapSched[+t.getAttribute('data-sc')];setTimeout(function(){r.on=t.getAttribute('aria-checked')==='true';P.toast('« '+r.name+' » '+(r.on?'activé':'mis en pause'))},0)})}
 on(sh,'[data-add]',function(){D.rapSched.unshift({name:val(body,'r'),freq:val(body,'f'),to:val(body,'to'),fmt:val(body,'m'),on:true});paint(body);body.scrollTop=0;P.toast('Rapport programmé : '+val(body,'f').toLowerCase())})}

P.actions.push(
 {role:'gerant',label:'Exporter les rapports du mois en PDF',icon:'download',run:function(){P.go('rapports');setTimeout(openExport,380)}},
 {role:'gerant',label:'Programmer un rapport par e-mail',icon:'clock',run:function(){P.go('rapports');setTimeout(openSched,380)}},
 {role:'gerant',label:'Voir le remplissage par créneau',icon:'report',run:function(){RS.tab='creneaux';P.go('rapports')}});
function brainRap(q){var r=rapAnswer(q);return {text:r.text,card:r.rows.map(function(x){return '<div class="hrow sp"><span class="s ellip">'+x[0]+'</span><b class="s num">'+x[2]+'</b></div>'}).join(''),actions:r.actions.map(function(a){return {label:a[0],run:function(){var go=a[1]();if(go)P.go('rapports');return go?'Rapport ouvert':'Envoyé'}}})}}
P.brain.push({role:'gerant',re:/rempl|créneau|creneau|perd de l|déficit/i,reply:function(t){return brainRap('créneau')}},
 {role:'gerant',re:/rentab|marge|rapporte|chiffre d.affaires|août|bilan/i,reply:function(t){return brainRap(/août/i.test(t)?t:/cheval|chevaux|rapporte/i.test(t)?'cheval':'cheval')}});

/* =====================================================================
   COMMUNICATION
   ===================================================================== */
P.css(`
.cm-box{display:grid;grid-template-columns:340px minmax(0,1fr);height:clamp(460px,calc(100vh - 384px),720px);overflow:hidden;border-radius:28px}
.cm-l{display:flex;flex-direction:column;min-height:0;min-width:0;border-right:1px solid var(--line)}
.cm-lh{padding:16px;display:flex;flex-direction:column;gap:12px;border-bottom:1px solid var(--line)}
.cm-lh .search .in{height:44px;border-radius:99px}
.cm-lh .seg{width:100%;display:flex}.cm-lh .seg button{flex:1 1 auto;min-height:36px;padding:0 6px;font-size:14px}
.cm-ts{overflow-y:auto;flex:1;scrollbar-width:thin;padding:8px}
.cm-t{display:grid;grid-template-columns:44px minmax(0,1fr) auto;gap:12px;padding:12px;align-items:center;cursor:pointer;width:100%;text-align:left;transition:background var(--t-1),transform .3s var(--e-spring);min-height:72px;border-radius:18px}
.cm-t+.cm-t{margin-top:2px}
.cm-t:hover{background:var(--surface-2)}
.cm-t:active{transform:scale(.985)}
.cm-t[aria-current="true"]{background:var(--acc-bg);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--acc) 22%,transparent)}
.cm-t .av,.cm-t .ico{width:44px;height:44px}
.cm-t .ico{border-radius:14px}
.cm-t .l1{display:flex;gap:6px;align-items:center;min-width:0}
.cm-t .l1 b{font-size:15px;font-weight:650;min-width:0}
.cm-t .l1 svg.i{width:18px;height:18px;color:var(--mut-2);flex:none}
.cm-t .l2{font-size:14px;color:var(--mut);margin-top:2px}
.cm-t.un .l1 b{font-weight:800}
.cm-t.un .l2{color:var(--ink);font-weight:600}
.cm-t .rt{display:flex;flex-direction:column;align-items:flex-end;gap:6px;font-size:13px;color:var(--mut)}
.cm-ub{min-width:24px;height:24px;border-radius:12px;background:var(--acc);color:var(--acc-ink);font-size:13px;font-weight:700;display:grid;place-items:center;padding:0 7px;animation:cm-pop .5s var(--e-spring) both}
@keyframes cm-pop{from{transform:scale(.3);opacity:0}}
.cm-c{display:flex;flex-direction:column;min-height:0;min-width:0}
.cm-ch{display:flex;align-items:center;gap:12px;padding:14px 18px;border-bottom:1px solid var(--line)}
.cm-ch .av,.cm-ch .ico{width:44px;height:44px}
.cm-ch .b{font-size:16px}
.cm-ch .xs{font-size:13.5px}
.cm-cb{flex:1;overflow-y:auto;padding:20px;display:flex;flex-direction:column;gap:8px;background:var(--surface-2);min-height:0}
.cm-b{max-width:74%;padding:11px 15px;border-radius:20px 20px 20px 6px;font-size:15px;line-height:1.45;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line),var(--shadow-1);align-self:flex-start;text-wrap:pretty;animation:rise var(--t-3) var(--e-out) both}
.cm-b.me{align-self:flex-end;background:var(--acc);color:var(--acc-ink);box-shadow:none;border-radius:20px 20px 6px 20px}
.cm-b.new{animation:rise var(--t-3) var(--e-out) both}
.cm-b .who{font-size:13px;font-weight:700;color:var(--ink-2);margin-bottom:3px;display:flex;align-items:center;gap:6px}
.cm-b .who i{width:8px;height:8px;border-radius:50%;background:var(--c)}
.cm-meta{font-size:13px;color:var(--mut);align-self:flex-start;margin:-2px 6px 4px}
.cm-meta.me{align-self:flex-end}
.cm-dsep{align-self:center;font-size:13px;font-weight:600;color:var(--mut);padding:4px 12px;border-radius:99px;background:var(--surface);box-shadow:inset 0 0 0 1px var(--line);margin-bottom:6px}
.cm-cf{padding:12px 16px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:10px;flex:1;min-width:0}
.cm-box .cm-cf{flex:none}
.cm-cf .tag{font-size:13px;height:32px;padding:0 12px;white-space:nowrap}
.cm-cf .xs{font-size:13px}
.cm-in{display:flex;gap:4px;align-items:center;padding:4px 4px 4px 6px;border-radius:99px;box-shadow:inset 0 0 0 1px var(--line-2);background:var(--surface);transition:box-shadow var(--t-2)}
.cm-in:focus-within{box-shadow:inset 0 0 0 1.5px var(--acc),var(--ring)}
.cm-in input{flex:1;border:0;outline:0;background:none;min-width:0;height:40px;padding:0 6px;font-size:15px}
.cm-in .btn.icon{width:40px;height:40px;border-radius:50%}
.cm-rh,.cm-r{display:grid;grid-template-columns:minmax(0,1.9fr) 104px 120px minmax(0,150px) 56px 120px 20px;gap:14px;align-items:center;padding:12px 22px}
.cm-rh{font-size:13px;font-weight:600;letter-spacing:.04em;text-transform:uppercase;color:var(--mut);padding-top:12px;padding-bottom:12px}
.cm-r{border-top:1px solid var(--line);cursor:pointer;transition:background var(--t-1);min-height:72px}
.cm-r:hover{background:var(--surface-2)}
.cm-rt{display:flex;align-items:center;gap:12px;min-width:0}
.cm-rt .b{font-size:15px}
.cm-dr{background:var(--bg-2);color:var(--mut)}
.cm-chs{display:flex;gap:4px;color:var(--mut)}
.cm-chs span{width:32px;height:32px;border-radius:10px;background:var(--d-bg,var(--bg-2));color:var(--d-ink,var(--mut));display:grid;place-items:center}
.cm-chs svg.i{width:18px;height:18px}
.cm-comp{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,.8fr);gap:20px;align-items:start}
.cm-pv{background:var(--bg-2);border-radius:20px;padding:16px;display:flex;flex-direction:column;gap:10px;position:sticky;top:0}
.cm-pn{background:var(--surface);border-radius:16px;padding:12px 14px;box-shadow:var(--shadow-1);display:flex;flex-direction:column;gap:4px;font-size:14px;min-width:0;overflow-wrap:anywhere}
.cm-pn .hd{display:flex;align-items:center;gap:7px;font-size:13px;color:var(--mut);font-weight:600}
.cm-pn .lg{width:20px;height:20px;border-radius:6px;background:var(--navy);display:grid;place-items:center;color:var(--navy-ink)}
.cm-seg{display:flex;flex-wrap:wrap;gap:8px}
.cm-seg .tag{min-height:40px}
.cm-pin{display:flex;gap:14px;padding:16px 22px;border-top:1px solid var(--line);align-items:flex-start;transition:opacity var(--t-3)}
.cm-pin.off{opacity:.55}
.cm-pin .tog{flex:none}
.cm-poll{padding:18px 22px;border-top:1px solid var(--line);display:flex;flex-direction:column;gap:10px}
.cm-poll>.hrow .b{font-size:15.5px}
.cm-po{position:relative;padding:8px 14px;border-radius:14px;overflow:hidden;background:var(--surface-2);display:flex;gap:10px;align-items:center;font-size:14px;min-height:44px}
.cm-po i{position:absolute;left:0;top:0;bottom:0;background:color-mix(in srgb,var(--rd) 22%,transparent);width:var(--v);transition:width var(--t-4) var(--e-out);border-radius:14px;animation:pltl var(--t-4) var(--e-out) both;transform-origin:left}
.cm-po>*:not(i){position:relative}
.cm-po.lead i{background:color-mix(in srgb,var(--rd) 40%,transparent)}
.cm-fu{display:grid;grid-template-columns:110px minmax(0,1fr) 100px;gap:12px;align-items:center;padding:7px 0;font-size:14px}
.cm-tp{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:6px 12px;padding:14px 0;border-top:1px solid var(--line);align-items:center}
.cm-tp:first-child{border-top:0}
.cm-gav{border-radius:14px}
.app.mobile .cm-cf .hide-s{display:none}
.app.mobile .cm-comp{grid-template-columns:minmax(0,1fr)}
.app.mobile .cm-pv{position:static}
@container main (max-width:1080px){.cm-box{height:clamp(460px,calc(100vh - 384px),640px)}}
@container main (max-width:900px){.cm-box{grid-template-columns:290px minmax(0,1fr)}.cm-rh,.cm-r{grid-template-columns:minmax(0,1.7fr) 104px 76px minmax(0,120px) 120px 20px}.cm-rh>:nth-child(5),.cm-r>:nth-child(5){display:none}}
@container main (max-width:760px){.cm-box{grid-template-columns:minmax(0,1fr);height:auto;border-radius:24px}.cm-l{border-right:0}.cm-c{display:none}.cm-ts{overflow:visible}.cm-t{min-height:76px}
 .cm-rh{display:none}.cm-r{grid-template-columns:minmax(0,1fr) auto;padding:14px 16px}.cm-r>.hide-s{display:none}.cm-r>svg.i{display:none}.cm-r:first-of-type{border-top:0}.cm-pin{padding:14px 18px}.cm-poll{padding:16px 18px}}
`);
var CH={push:['bell','Notification'],app:['bell','Application'],sms:['sms','SMS'],mail:['mail','E-mail'],wa:['chat','WhatsApp']};
if(!D.comThreads){(function(){
 var li=D.invoices.find(function(i){return i.status==='en retard'&&i.member!=='m001'})||D.invoices[1],l1=D.lessons[0],kr=D.entries.filter(function(e){return e.comp==='k1'}).map(function(e){return e.rider});
 D.comThreads=[
  {id:'th1',title:'Léa Martin',kind:'adh',ch:'app',who:'m001',sub:'Propriétaire d’Ulysse de la Roche',when:'09:12',unread:1,msgs:[{f:'m001',t:'Bonjour Claire, j’ai bien reçu le contrat de demi-pension d’Ulysse. Où est-ce que je le signe ?',h:'08:58'},{f:'me',t:'Bonjour Léa, directement dans l’application, onglet Contrats. La pension de novembre est aussi en attente, je vous remets le lien de paiement.',h:'09:05',st:'Lu'},{f:'m001',t:'Merci ! Je passe signer ce soir.',h:'09:12'}],sugg:'Parfait, merci Léa. Le contrat reste disponible à la signature jusqu’à vendredi. Bonne journée.'},
  {id:'th2',title:'Groupe Concours Rambouillet',kind:'grp',ch:'wa',ids:kr,sub:kr.length+' cavaliers, Thomas Roux et Pauline Arnaud',when:'08:55',unread:4,msgs:[{f:'s04',t:'Bonjour à tous, les horaires de dimanche sont tombés. Reconnaissance du Club 2 à 8 h 30.',h:'08:31'},{f:kr[0],t:'Super, on part à quelle heure ?',h:'08:36'},{f:'s04',t:'Départ 6 h 45, soyez là à 6 h 30.',h:'08:47'},{f:kr[3],t:'Il reste une place en covoiturage depuis Rambouillet ?',h:'08:49'},{f:'c01',t:'Je serai au paddock dès 8 h pour la détente des Club Élite.',h:'08:52'},{f:kr[5],t:'Parfait, merci Thomas.',h:'08:55'}],sugg:'Bonjour à tous. Oui, il reste une place dans la voiture de la famille au départ de Rambouillet centre. Pensez à vos licences et au livret de votre cheval.'},
  {id:'th3',title:'Famille Laurent',kind:'adh',ch:'app',who:'m142',sub:'Parents de Chloé, Galop 1',when:'Hier',unread:0,todo:true,msgs:[{f:'m142',t:'Bonsoir, Chloé a été malade samedi dernier. Est-ce que Chloé peut rattraper samedi ?',h:'Hier, 19:42'}],sugg:'Bonjour, bien sûr. Il reste une place samedi à 9 h en Galop 1-2 avec Inès. Je l’ai réservée pour Chloé avec son crédit de rattrapage, la confirmation arrive dans l’application.'},
  {id:'th5',title:l1.title+' · lundi 17 h',kind:'grp',ch:'app',ids:l1.riders,sub:'Groupe de reprise, '+l1.riders.length+' cavaliers et leurs parents',when:'Hier',unread:0,msgs:[{f:'s02',t:'Bonsoir, pensez aux gilets lundi : on sort en extérieur si le temps le permet.',h:'Hier, 18:10'},{f:l1.riders[1],t:'Noté, merci Hugo.',h:'Hier, 18:24'},{f:l1.riders[3],t:'Élise sera absente lundi, elle a un contrôle. On peut rattraper ?',h:'Hier, 20:02'}],sugg:'Bonsoir, c’est noté. L’absence est excusée et un rattrapage est crédité, à réserver dans l’application.'},
  {id:'th6',title:D.name(li.member),kind:'adh',ch:'sms',who:li.member,sub:'Relance de la facture '+li.id,when:'Lun.',unread:1,msgs:[{f:'me',t:'Bonjour, la facture '+li.id+' de '+F.eur(li.amount)+' est en attente depuis le '+F.date(li.due)+'. Vous pouvez la régler ici : stablapp.fr/p/'+li.id.slice(-4),h:'Lun., 10:00',st:'Délivré'},{f:li.member,t:'Bonjour, je fais le virement demain. Désolé pour le retard.',h:'Lun., 12:17'}],sugg:'Merci beaucoup, c’est noté. Bonne journée.'},
  {id:'th7',title:'Propriétaires',kind:'grp',ch:'wa',ids:D.members.filter(function(m){return m.forfait==='f5'}).map(function(m){return m.id}),sub:'12 propriétaires',when:'Lun.',unread:0,msgs:[{f:'me',t:'Bonjour, le maréchal passe jeudi à 9 h. Merci de laisser les licols aux boxes.',h:'Lun., 09:30',st:'Lu par 11'},{f:'m014',t:'Merci Claire. Il peut regarder le postérieur droit de ma jument ?',h:'Lun., 09:52'},{f:'me',t:'Oui, c’est ajouté à sa tournée.',h:'Lun., 10:04',st:'Lu par 12'}],sugg:'Rappel : le maréchal est là demain à 9 h.'},
  {id:'th4',title:'Antoine Leroy',kind:'team',ch:'app',who:'s05',sub:'Palefrenier soigneur',when:'08:05',unread:0,msgs:[{f:'s05',t:'Bonjour Claire, Xanthos a passé une nuit calme. Je le surveille toutes les deux heures.',h:'07:12'},{f:'me',t:'Merci Antoine. Préviens-moi s’il ne boit toujours pas à 10 h.',h:'07:20',st:'Lu'},{f:'s05',t:'Xanthos a recrotté, il mange un peu.',h:'08:05'}],sugg:'Bonne nouvelle, merci. On garde la surveillance jusqu’à ce soir et je préviens le Dr Leclerc.'},
  {id:'th8',title:'Manon Lemoine',kind:'team',ch:'app',who:'s09',sub:'Secrétariat et accueil',when:'08:40',unread:1,msgs:[{f:'s09',t:'Trois demandes d’essai sont arrivées par le site. Je les place mercredi à 14 h ?',h:'08:40'}],sugg:'Oui, mercredi 14 h avec Hugo, il reste trois places. Merci Manon.'}];
 var due=D.members.filter(function(m){return m.balance<0}).length,lic=D.members.filter(function(m){return m.licence!=='2027'}).length;
 D.comCamps=[
  {id:'cp1',title:'Carrière d’honneur fermée jeudi et vendredi',seg:'Reprises de jeudi et vendredi en carrière',n:34,ch:['sms','push'],status:'programmé',when:'Demain, 18:00'},
  {id:'cp2',title:'Convocations du concours de Rambouillet',seg:'Inscrits au concours',n:kr.length,ch:['wa','push'],status:'envoyé',when:'15 nov.',open:100,click:89,res:'9 présences confirmées'},
  {id:'cp3',title:'Inscriptions aux stages de Noël',seg:'Tous les adhérents',n:D.members.length,ch:['mail','push'],status:'envoyé',when:'12 nov.',open:74,click:38,res:'23 inscriptions, 2 760 €'},
  {id:'cp4',title:'Relance des factures en retard',seg:'Impayés',n:due,ch:['mail','sms'],status:'envoyé',when:'10 nov.',open:91,click:57,res:'11 factures réglées'},
  {id:'cp5',title:'Lettre de novembre',seg:'Tous les adhérents',n:D.members.length,ch:['mail'],status:'envoyé',when:'2 nov.',open:68,click:21,res:'104 lectures'},
  {id:'cp6',title:'Renouvellement des licences FFE 2027',seg:'Licence à renouveler',n:lic,ch:['mail','push'],status:'programmé',when:'1 déc., 09:00'},
  {id:'cp7',title:'Offre parrainage de printemps',seg:'Adultes, Galops 3 à 7',n:41,ch:['mail'],status:'brouillon',when:'Modifié hier'}];
 D.comPins=[
  {id:'pn1',title:'Carrière d’honneur fermée jeudi et vendredi',body:'Pluie annoncée : les reprises ont lieu au Grand manège. Les horaires ne changent pas.',aud:'Tous les adhérents',until:'vendredi 20 novembre',views:96,on:true},
  {id:'pn2',title:'Stages de Noël : les inscriptions sont ouvertes',body:'Du 21 au 24 décembre, deux stages par jour. Réservation et acompte dans l’application.',aud:'Tous les adhérents',until:'20 décembre',views:131,on:true},
  {id:'pn3',title:'Certificat médical à déposer avant le 1er décembre',body:'Il est indispensable pour valider la licence 2027. Déposez-le depuis votre profil.',aud:'Licence à renouveler',until:'1er décembre',views:9,on:true},
  {id:'pn4',title:'Bourse aux équipements du club',body:'Dimanche 6 décembre de 10 h à 16 h au club-house.',aud:'Tous les adhérents',until:'6 décembre',views:58,on:false}];
 D.comPolls=[
  {id:'po1',q:'Qui vient au concours de Rambouillet dimanche ?',aud:'Groupe Concours et leurs familles',total:22,closes:'vendredi à 20 h',open:true,opts:[{l:'Je monte',n:9,ids:kr},{l:'Je viens encourager',n:6,ids:D.members.slice(20,26).map(function(m){return m.id})},{l:'Je ne peux pas venir',n:3,ids:D.members.slice(30,33).map(function(m){return m.id})}]},
  {id:'po2',q:'Quel jour préférez-vous pour le stage de cross ?',aud:'Galops 5 à 7',total:38,closes:'dimanche',open:true,opts:[{l:'Samedi 28 novembre',n:14,ids:D.members.slice(40,46).map(function(m){return m.id})},{l:'Dimanche 29 novembre',n:9,ids:D.members.slice(50,55).map(function(m){return m.id})},{l:'Mercredi 2 décembre',n:4,ids:D.members.slice(60,64).map(function(m){return m.id})}]},
  {id:'po3',q:'Repas de Noël du club : qui s’inscrit ?',aud:'Tous les adhérents',total:148,closes:'clos le 10 novembre',open:false,opts:[{l:'Je viens',n:86,ids:[]},{l:'Je ne viens pas',n:31,ids:[]}]}];
 D.comTpl=[
  {n:'Rappel de reprise',ch:['push','sms'],auto:'La veille à 18 h',on:true,s:'Votre reprise de demain',t:'Bonjour {prénom}, votre reprise {reprise} a lieu demain à {heure}. Arrivez vingt minutes avant pour préparer {cheval}.'},
  {n:'Confirmation de réservation',ch:['push','mail'],auto:'À chaque réservation',on:true,s:'Réservation confirmée',t:'Bonjour {prénom}, votre place est réservée : {reprise}, {date} à {heure}.'},
  {n:'Annulation de reprise',ch:['push','sms','mail'],auto:'À chaque annulation',on:true,s:'Reprise annulée',t:'Bonjour {prénom}, la reprise {reprise} du {date} est annulée. Un rattrapage vous est crédité.'},
  {n:'Relance de facture',ch:['mail','sms'],auto:'7 jours après l’échéance',on:true,s:'Votre facture est en attente',t:'Bonjour {prénom}, la facture {facture} de {solde} est en attente. Vous pouvez la régler en ligne en un geste.'},
  {n:'Certificat médical manquant',ch:['mail','push'],auto:'30 jours avant la licence',on:false,s:'Votre certificat médical',t:'Bonjour {prénom}, il nous manque votre certificat médical pour valider la licence 2027.'},
  {n:'Bienvenue au club',ch:['mail'],auto:'À l’inscription',on:true,s:'Bienvenue aux Tilleuls',t:'Bonjour {prénom}, bienvenue à l’Écurie des Tilleuls. Voici tout ce qu’il faut savoir avant votre première reprise.'},
  {n:'Convocation de concours',ch:['wa','push'],s:'Votre convocation',t:'Bonjour {prénom}, rendez-vous dimanche à 6 h 30 dans la cour. Reconnaissance à 8 h 30.'},
  {n:'Fermeture pour intempéries',ch:['sms','push'],s:'Changement de piste',t:'Bonjour {prénom}, à cause de la pluie, votre reprise a lieu au Grand manège. Les horaires ne changent pas.'}];
})()}
var CS={tab:'msg',th:'th1',flt:'all',q:''};
function thAv(t){return t.kind==='grp'?'<span class="ico d-rd cm-gav">'+ICON('members')+'</span>':U.av(t.who)}
function chIcons(list){return '<span class="cm-chs">'+list.map(function(c){return '<span class="d-'+({mail:'rd',sms:'mo',push:'tm',app:'tm',wa:'hz'})[c]+'" title="'+CH[c][1]+'">'+ICON(CH[c][0])+'</span>'}).join('')+'</span>'}
var SEG=[['all','Tous les adhérents',function(){return true}],['g12','Galops 0 à 2',function(m){return m.galop<=2}],['g34','Galops 3 et 4',function(m){return m.galop===3||m.galop===4}],['g57','Galops 5 à 7',function(m){return m.galop>=5}],['min','Parents de mineurs',function(m){return m.minor}],['own','Propriétaires',function(m){return m.forfait==='f5'}],['due','Impayés',function(m){return m.balance<0}],['lic','Licence à renouveler',function(m){return m.licence!=='2027'}],['cso','Inscrits au concours',function(m){return D.entries.some(function(e){return e.rider===m.id})}],['rep','Une reprise',null],['for','Un forfait',null]];
var comRedraw=function(){};

function convParts(t){var grp=t.kind==='grp',b='<div class="cm-dsep">'+(/^\d/.test(t.msgs[0].h)?'Aujourd’hui':t.msgs[0].h.split(',')[0])+'</div>';
 t.msgs.forEach(function(m,i){var me=m.f==='me',p=me?null:D.person(m.f);b+='<div class="cm-b'+(me?' me':'')+(m.fresh?' new':'')+'">'+(grp&&p?'<div class="who" style="--c:'+(col(m.f)!=='var(--mut-2)'?col(m.f):p.color)+'"><i></i>'+p.first+' '+p.last+'</div>':'')+F.esc(m.t)+'</div><div class="cm-meta'+(me?' me':'')+'">'+m.h.replace(/^.*, /,'')+(m.st?' · '+m.st:'')+'</div>';m.fresh=false});
 return {head:thAv(t)+'<div class="grow"><div class="b ellip">'+t.title+'</div><div class="xs mut ellip">'+t.sub+'</div></div><span class="chip line hide-s">'+ICON(CH[t.ch][0],'sm')+CH[t.ch][1]+'</span>'+(t.kind==='adh'?'<button class="btn ghost icon sm" data-go="adherent" data-id="'+t.who+'" title="Ouvrir la fiche">'+ICON('user')+'</button>':'')+'<button class="btn ghost icon sm" data-call title="Appeler">'+ICON('phone')+'</button>',
  body:b,
  comp:'<div class="cm-cf"><div class="hrow" style="--g:6px"><span class="xs mut hide-s">Répondre par</span>'+['app','sms','mail','wa'].map(function(c){return '<button class="tag" data-manual data-rch="'+c+'" aria-pressed="'+(t.ch===c)+'">'+CH[c][1]+'</button>'}).join('')+'</div><form class="cm-in" data-send><button type="button" class="btn ghost icon sm" data-att title="Joindre un fichier">'+ICON('attach')+'</button><input placeholder="Écrire à '+F.esc(t.title)+'…" autocomplete="off" aria-label="Message"><button type="button" class="btn ghost sm" data-sugg title="Proposer une réponse">'+ICON('edit','sm')+'<span class="hide-s">Suggérer</span></button><button class="btn pri icon sm" title="Envoyer">'+ICON('send','sm')+'</button></form></div>'}}
function wireConv(root,t,refresh){var inp=$('.cm-in input',root),box=$('.cm-cb',root);if(box)box.scrollTop=1e6;
 on(root,'[data-rch]',function(b){t.ch=b.getAttribute('data-rch');$$('[data-rch]',root).forEach(function(x){x.setAttribute('aria-pressed',x===b)});P.toast('Réponse par '+CH[t.ch][1].toLowerCase()+' pour cette conversation',{icon:CH[t.ch][0]})});
 on(root,'[data-call]',function(){P.toast('Appel lancé depuis votre téléphone vers '+t.title,{icon:'phone'})});
 on(root,'[data-att]',function(){P.toast('Choisissez une photo, un document ou une facture à joindre',{icon:'attach'})});
 on(root,'[data-sugg]',function(){var s=t.sugg||'Bonjour, merci pour votre message. Je reviens vers vous dans la journée.';if(P.RM){inp.value=s;inp.focus();return}inp.value='';var i=0;(function ty(){if(!inp.isConnected)return;i+=3;inp.value=s.slice(0,i);inp.scrollLeft=1e5;if(i<s.length)setTimeout(ty,14);else inp.focus()})()});
 on(root,'[data-send]',function(f,e){e.preventDefault();var v=inp.value.trim();if(!v)return;var m={f:'me',t:v,h:'09:41',st:'Envoyé',fresh:true};t.msgs.push(m);t.when='09:41';t.unread=0;t.todo=false;refresh();
  setTimeout(function(){m.st=t.ch==='sms'?'Délivré':t.kind==='grp'?'Lu par 3':'Lu';var mt=$$('.cm-meta.me',P.app());if(mt.length)mt[mt.length-1].textContent='09:41 · '+m.st},1500)},'submit')}

P.mod({id:'communication',role:'gerant',group:'Club',title:'Communication',icon:'chat',n:80,phoneTitle:'Messages',
 badge:function(){var n=sum(D.comThreads.map(function(t){return t.unread}));return n?{v:n,hot:true}:null},
 render:function(el,ctx){var first=true,boot=true;
  function threads(){var q=CS.q.toLowerCase();return D.comThreads.filter(function(t){return (CS.flt==='all'||t.kind===CS.flt)&&(!q||t.title.toLowerCase().indexOf(q)>=0)})}
  function tsHTML(){var l=threads();return l.length?l.map(function(t){var last=t.msgs[t.msgs.length-1],p=last.f==='me'?'Vous : ':(t.kind==='grp'&&D.person(last.f)?D.person(last.f).first+' : ':'');
    return '<button class="cm-t'+(t.unread?' un':'')+'" data-th="'+t.id+'" aria-current="'+(!P.isMobile()&&t.id===CS.th)+'">'+thAv(t)+'<span style="min-width:0"><span class="l1"><b class="ellip">'+t.title+'</b>'+ICON(CH[t.ch][0])+'</span><span class="l2 ellip" style="display:block">'+p+F.esc(last.t)+'</span></span><span class="rt"><span>'+t.when+'</span>'+(t.unread?'<span class="cm-ub">'+t.unread+'</span>':t.todo?U.chip('À répondre','warn'):'')+'</span></button>'}).join(''):U.empty('search','Aucune conversation trouvée','Essayez un autre nom ou changez de filtre.')}
  function paneHTML(){var t=D.comThreads.find(function(x){return x.id===CS.th});if(!t)return '';var c=convParts(t);return '<div class="cm-ch">'+c.head+'</div><div class="cm-cb">'+c.body+'</div>'+c.comp}
  function campRow(c){var st=c.status==='envoyé'?U.chip('Envoyé','ok',true):c.status==='programmé'?U.chip('Programmé','acc',true):c.status==='en cours'?U.chip('Envoi en cours','warn',true):U.chip('Brouillon','',true);
   var dk={'envoyé':'hz','programmé':'tm','en cours':'mo'}[c.status]||'';return '<div class="cm-r" data-c="'+c.id+'" role="button" tabindex="0"><div class="cm-rt"><span class="ico sm'+(dk?' d-'+dk:' cm-dr')+'">'+ICON(c.status==='programmé'?'clock':c.status==='brouillon'?'edit':'send')+'</span><div style="min-width:0"><div class="b ellip">'+c.title+'</div><div class="xs mut ellip">'+c.seg+' · '+c.when+'<span class="only-s"> · '+c.n+' destinataires'+(c.open?' · '+c.open+' % d’ouverture':'')+'</span></div></div></div><span class="hide-s">'+chIcons(c.ch)+'</span><span class="num hide-s"><b data-cn>'+c.n+'</b> <span class="mut xs">pers.</span></span>'+
    '<span class="hide-s" data-cbar>'+(c.open!=null?'<span class="hrow" style="--g:8px"><span class="grow">'+U.bar(c.open,'var(--acc)')+'</span><b class="num s">'+c.open+' %</b></span>':c.status==='en cours'?'<span class="hrow" style="--g:8px"><span class="grow">'+U.bar(0,'var(--warn)')+'</span><b class="num s">0</b></span>':'<span class="mut s">'+(c.status==='programmé'?'En attente d’envoi':c.status==='envoyé'?'Mesure en cours':'Pas encore envoyé')+'</span>')+'</span>'+
    '<span class="num s hide-s">'+(c.click!=null?c.click+' %':'')+'</span><span data-cst>'+st+'</span>'+ICON('right','sm')+'</div>'}
  function pollHTML(p){var tot=sum(p.opts.map(function(o){return o.n})),mx=Math.max.apply(null,p.opts.map(function(o){return o.n}));
   return '<div class="cm-poll" data-poll="'+p.id+'"><div class="hrow sp" style="align-items:flex-start"><div style="min-width:0"><div class="b">'+p.q+'</div><div class="xs mut">'+p.aud+' · '+(p.open?'clôture '+p.closes:p.closes)+'</div></div>'+(p.open?U.chip(p.live?'Réponses en direct':'En cours',p.live?'warn':'acc',true):U.chip('Terminé','',true))+'</div>'+
    p.opts.map(function(o){return '<div class="cm-po'+(o.n===mx&&mx?' lead':'')+'"><i style="--v:'+(tot?o.n/p.total*100:0)+'%"></i><span class="grow b s">'+o.l+'</span>'+(o.ids&&o.ids.length&&o.n?U.avs(o.ids.slice(0,o.n),3):'')+'<b class="num">'+o.n+'</b></div>'}).join('')+
    '<div class="hrow sp wrap"><span class="xs mut"><b class="num" style="color:var(--ink)">'+tot+'</b> réponses sur '+p.total+(p.total-tot?' · '+(p.total-tot)+' sans réponse':'')+'</span>'+(p.open?'<span class="hrow" style="--g:6px">'+(p.total-tot?'<button class="btn sm" data-nudge="'+p.id+'">Relancer les '+(p.total-tot)+'</button>':'')+'<button class="btn ghost sm" data-endp="'+p.id+'">Clôturer</button></span>':'<button class="btn ghost sm" data-expp="'+p.id+'">'+ICON('download','sm')+'Exporter la liste</button>')+'</div></div>'}
  function draw(){var mob=P.isMobile(),un=D.comThreads.filter(function(t){return t.unread}).length,sch=D.comCamps.filter(function(c){return c.status==='programmé'}).length;
   var todo=D.comThreads.filter(function(t){return t.todo}).length,pins=D.comPins.filter(function(p){return p.on}).length,polls=D.comPolls.filter(function(p){return p.open}).length;
   var h='<div class="px-ph"><div><div class="eb"><span class="dot"></span>Club · messagerie, envois et annonces</div><h1>Communication</h1><div class="sub"><b>'+plural(un,'conversation non lue','conversations non lues')+'</b>'+(todo?', '+plural(todo,'demande','demandes')+' à traiter':'')+', '+plural(sch,'envoi programmé','envois programmés')+' et 71'+NB+'% d’ouverture en moyenne.</div></div><div class="acts"><button class="btn" data-tpl>'+ICON('doc')+(mob?'Modèles':'Modèles et automatismes')+'</button><button class="btn pri" data-newc>'+ICON('send')+(mob?'Envoi groupé':'Nouvel envoi groupé')+'</button></div></div>';
   h+=pxTabs([['msg','Messagerie','chat','acc',un||''],['env','Envois groupés','send','rd',sch||''],['pin','Annonces et sondages','pin','tm',(pins+polls)||'']],CS.tab,'data-ct');
   if(CS.tab==='msg'){
    h+='<div class="card cm-box'+(first?' rise':'')+'"><div class="cm-l"><div class="cm-lh"><div class="search">'+ICON('search','sm')+'<input class="in" data-q placeholder="Chercher une conversation" value="'+F.esc(CS.q)+'"></div>'+U.seg([['all','Tous'],['adh','Adhérents'],['grp','Groupes'],['team','Équipe']],CS.flt,'data-flt')+'</div><div class="cm-ts">'+tsHTML()+'</div></div><div class="cm-c">'+paneHTML()+'</div></div>';
   }else if(CS.tab==='env'){
    h+='<div class="stack'+(first?' rise':'')+'" style="--g:14px"><div class="px-k">'+U.kpi({label:'E-mails ouverts',count:71,unit:'%',delta:'+6 pts',dsub:' sur 30 jours',spark:[58,61,60,66,68,71],icon:'mail',dom:'rd',tint:true,color:'var(--rd-ink)'})+U.kpi({label:'Notifications lues',count:89,unit:'%',delta:'+2 pts',spark:[84,85,88,86,88,89],icon:'bell',dom:'tm',tint:true,color:'var(--tm-ink)'})+U.kpi({label:'SMS délivrés',count:98,unit:'%',delta:'412 ce mois',up:null,spark:[97,98,97,99,98,98],icon:'sms',dom:'mo',tint:true,color:'var(--mo-ink)'})+U.kpi({label:'WhatsApp lus',count:94,unit:'%',delta:'+4 pts',spark:[86,88,90,91,93,94],icon:'chat',dom:'hz',tint:true,color:'var(--hz-ink)'})+'</div>'+
     '<div class="card"><div class="ch" style="padding-bottom:16px">'+pxHd('rd','send','Envois groupés','Ciblés par niveau, reprise, forfait ou paiement')+U.seg([['all','Tous'],['programmé','Programmés'],['envoyé','Envoyés'],['brouillon','Brouillons']],CS.cf||'all','data-cf')+'</div><div class="cm-rh" style="border-top:1px solid var(--line)"><span>Envoi</span><span>Canaux</span><span>Destinataires</span><span>Ouverture</span><span>Clics</span><span>Statut</span><span></span></div>'+
     (function(){var l=D.comCamps.filter(function(c){return !CS.cf||CS.cf==='all'||c.status===CS.cf||(CS.cf==='envoyé'&&c.status==='en cours')});return l.length?l.map(campRow).join(''):'<div class="empty" style="border-top:1px solid var(--line)">'+(window.ILLU&&ILLU.contrat?ILLU.contrat({size:null}):ICON('send'))+'<b style="color:var(--ink)">Aucun envoi dans cette liste</b><span class="s">Préparez un message ciblé, il apparaîtra ici avec ses statistiques.</span><button class="btn pri" data-newc>'+ICON('send')+'Nouvel envoi groupé</button></div>'})()+'</div>'+
     '<div class="lx-ai">'+ICON('bulb','sm')+'<div class="grow">Vos adhérents ouvrent surtout leurs messages le mardi et le jeudi entre 18 h et 19 h 30. En programmant vos envois sur ce créneau, l’ouverture gagne environ 12 points.</div><button class="btn sm" data-best>Programmer au meilleur moment</button></div></div>';
   }else{
    h+='<div class="g2'+(first?' rise':'')+'"><div class="card"><div class="ch" style="padding-bottom:14px">'+pxHd('tm','pin','Annonces épinglées','En haut du portail et de l’application')+'<button class="btn sm" data-newpin>'+ICON('plus','sm')+'Nouvelle annonce</button></div>'+
     D.comPins.map(function(p,i){return '<div class="cm-pin'+(p.on?'':' off')+'"><span class="ico'+(p.on?' d-tm':' cm-dr')+'">'+ICON('pin')+'</span><div class="grow"><div class="b">'+p.title+'</div><div class="s mut" style="margin:2px 0 6px">'+p.body+'</div><div class="hrow wrap xs mut" style="--g:6px">'+U.chip(p.aud,'line')+'<span>jusqu’au '+p.until+'</span><span class="hrow" style="--g:4px">'+ICON('eye','sm')+'<span class="num">'+p.views+' vues</span></span></div></div><button class="tog" role="switch" data-pin="'+i+'" aria-checked="'+p.on+'" title="Épingler ou retirer"></button></div>'}).join('')+'</div>'+
     '<div class="card"><div class="ch" style="padding-bottom:14px">'+pxHd('rd','checkc','Sondages rapides','Une question, une réponse en un geste')+'<button class="btn sm" data-newpoll>'+ICON('plus','sm')+'Nouveau sondage</button></div>'+D.comPolls.map(pollHTML).join('')+'</div></div>'}
   el.innerHTML='<div class="lx-ph">'+h+'</div>';bind();if(first&&!boot)P.animate(el);boot=first=false}
  function refreshConv(){if(P.isMobile())return;var pane=$('.cm-c',el),ts=$('.cm-ts',el);if(!pane){draw();return}pane.innerHTML=paneHTML();ts.innerHTML=tsHTML();bindThreads();var t=D.comThreads.find(function(x){return x.id===CS.th});if(t)wireConv(pane,t,refreshConv)}
  function openThread(id){var t=D.comThreads.find(function(x){return x.id===id});if(!t)return;CS.th=id;t.unread=0;
   if(P.isMobile()){var c=convParts(t),sh=P.sheet({title:t.title,icon:CH[t.ch][0],body:'<div class="cm-cb" style="margin:-18px;padding:16px;min-height:300px">'+c.body+'</div>',foot:c.comp});
    var re=function(){var cc=convParts(t);$('.cm-cb',sh).innerHTML=cc.body;$('.sb',sh).scrollTop=1e6;$('.cm-in input',sh).value='';var ts=$('.cm-ts',el);if(ts){ts.innerHTML=tsHTML();bindThreads()}};wireConv(sh,t,re);$('.sb',sh).scrollTop=1e6;var ts=$('.cm-ts',el);if(ts){ts.innerHTML=tsHTML();bindThreads()}}
   else refreshConv()}
  function bindThreads(){on(el,'[data-th]',function(b){openThread(b.getAttribute('data-th'))})}
  function bind(){
   on(el,'[data-ct]',function(b){CS.tab=b.getAttribute('data-ct');first=true;draw()});
   on(el,'[data-tpl]',function(){openTemplates()});on(el,'[data-newc]',function(){openComposer({})});
   if(CS.tab==='msg'){bindThreads();on(el,'[data-flt]',function(b){CS.flt=b.getAttribute('data-flt');var ts=$('.cm-ts',el);ts.innerHTML=tsHTML();ts.classList.remove('px-fi');void ts.offsetWidth;ts.classList.add('px-fi');bindThreads()});
    on(el,'[data-q]',function(i){CS.q=i.value;$('.cm-ts',el).innerHTML=tsHTML();bindThreads()},'input');
    var t=D.comThreads.find(function(x){return x.id===CS.th});if(t&&!P.isMobile()){t.unread=0;wireConv($('.cm-c',el),t,refreshConv)}}
   on(el,'[data-cf]',function(b){CS.cf=b.getAttribute('data-cf');draw()});
   on(el,'[data-c]',function(r){openCamp(D.comCamps.find(function(c){return c.id===r.getAttribute('data-c')}))});
   on(el,'[data-best]',function(b){D.comCamps.forEach(function(c){if(c.status==='programmé')c.when=c.id==='cp1'?'Aujourd’hui, 18:30':'Mar. 1 déc., 18:30'});draw();P.toast('2 envois reprogrammés un mardi à 18 h 30',{icon:'clock'})});
   on(el,'[data-pin]',function(t){var p=D.comPins[+t.getAttribute('data-pin')];setTimeout(function(){p.on=t.getAttribute('aria-checked')==='true';t.closest('.cm-pin').classList.toggle('off',!p.on);P.toast(p.on?'Annonce épinglée sur le portail adhérent':'Annonce retirée du portail',{icon:'pin'})},0)});
   on(el,'[data-newpin]',openPin);on(el,'[data-newpoll]',openPoll);
   on(el,'[data-nudge]',function(b){var p=D.comPolls.find(function(x){return x.id===b.getAttribute('data-nudge')}),k=p.total-sum(p.opts.map(function(o){return o.n}));b.outerHTML=U.chip('Relance envoyée','ok',true);P.toast('Relance envoyée à '+plural(k,'personne')+' sans réponse',{icon:'bell'})});
   on(el,'[data-endp]',function(b){var p=D.comPolls.find(function(x){return x.id===b.getAttribute('data-endp')});p.open=false;p.live=false;p.closes='clos aujourd’hui';draw();P.toast('Sondage clôturé, résultat partagé au groupe')});
   on(el,'[data-expp]',function(b){var p=D.comPolls.find(function(x){return x.id===b.getAttribute('data-expp')})||D.comPolls[0],rows=[['Question','Réponse','Nombre','Personnes']];p.opts.forEach(function(o){rows.push([p.q,o.l,o.n,(o.ids||[]).map(function(i){return D.name(i)}).join(', ')])});P.download('sondage-'+p.id+'-reponses.csv',rows,null,{msg:'Réponses du sondage téléchargées pour Excel'})})}
  comRedraw=function(fresh){if(el.isConnected){first=!!fresh;draw()}};
  draw()}});

/* ---------- Envoi groupé ---------- */
function openComposer(pre){var seg=pre.seg||'all',chs=pre.ch||['mail','push'],when='now',subj=pre.s||'',txt=pre.t||'';
 var sh=P.sheet({title:'Nouvel envoi groupé',icon:'send',wide:true,body:'',foot:'<button class="btn" data-draft>Enregistrer le brouillon</button><button class="btn pri" data-ok></button>'});
 var body=$('.sb',sh),okb=$('[data-ok]',sh),sub='';setTimeout(function(){paint(body)},0);
 function people(){var s=SEG.find(function(x){return x[0]===seg});if(seg==='rep'){var l=D.lessons.find(function(x){return x.id===(sub||'l01')});return l.riders.map(D.member)}if(seg==='for')return D.members.filter(function(m){return m.forfait===(sub||'f1')});return D.members.filter(s[2])}
 function segLabel(){if(seg==='rep'){var l=D.lessons.find(function(x){return x.id===(sub||'l01')});return 'Reprise '+l.title+', '+l.day+' '+l.start}if(seg==='for')return D.forfaits.find(function(f){return f.id===(sub||'f1')}).name;return SEG.find(function(x){return x[0]===seg})[1]}
 function preview(){var p=people(),m=p[0]||D.members[0],t=(txt||'Votre message apparaît ici.').replace(/\{prénom\}/g,m.first).replace(/\{solde\}/g,F.eur(Math.abs(m.balance)||290)).replace(/\{cheval\}/g,'Quiétude').replace(/\{reprise\}/g,'Galop 3-4').replace(/\{date\}/g,'mercredi 18 novembre').replace(/\{heure\}/g,'17 h').replace(/\{facture\}/g,'F-2026-1142'),s=subj||'Écurie des Tilleuls',h='<div class="eyebrow">Aperçu pour '+m.first+' '+m.last+'</div>';
  if(chs.indexOf('push')>=0)h+='<div class="cm-pn"><div class="hd"><span class="lg">'+LOGO(11,'var(--navy-ink)','var(--strass)')+'</span>PIAFFE · maintenant</div><b>'+F.esc(s)+'</b><span>'+F.esc(t.slice(0,110))+(t.length>110?'…':'')+'</span></div>';
  if(chs.indexOf('sms')>=0)h+='<div class="cm-pn"><div class="hd">'+ICON('sms','sm')+'SMS · Les Tilleuls</div><span>'+F.esc(t)+'</span><span class="xs mut num">'+t.length+' caractères · '+Math.ceil(t.length/160)+' SMS par personne · environ '+(p.length*Math.ceil(t.length/160)*.045).toFixed(2).replace('.',',')+' €</span></div>';
  if(chs.indexOf('wa')>=0)h+='<div class="cm-pn"><div class="hd">'+ICON('chat','sm')+'WhatsApp · Écurie des Tilleuls</div><span>'+F.esc(t)+'</span></div>';
  if(chs.indexOf('mail')>=0)h+='<div class="cm-pn"><div class="hd">'+ICON('mail','sm')+'E-mail · contact@ecurie-tilleuls.example</div><b>'+F.esc(s)+'</b><span>'+F.esc(t)+'</span><span class="xs mut">Pied de page : coordonnées du club et lien de désinscription</span></div>';
  if(!chs.length)h+='<p class="s mut">Choisissez au moins un canal.</p>';
  $('.cm-pv',body).innerHTML=h;var par=p.filter(function(x){return x.minor}).length;
  $('[data-cnt]',body).innerHTML=(p.length?U.avs(p.map(function(x){return x.id}),5):'')+'<span class="s"><b class="num">'+plural(p.length,'destinataire')+'</b>'+(par?' <span class="mut">· '+plural(par,'mineur')+', message envoyé aux parents</span>':'')+'</span>';
  okb.innerHTML=ICON(when==='now'?'send':'clock','sm')+(when==='now'?'Envoyer à ':'Programmer pour ')+plural(p.length,'personne');okb.disabled=!p.length||!chs.length}
 function paint(b){b.innerHTML='<div class="cm-comp"><div><div class="lx-h">1. Destinataires</div><div class="cm-seg">'+SEG.map(function(s){return '<button class="tag" data-manual data-seg="'+s[0]+'" aria-pressed="'+(s[0]===seg)+'">'+s[1]+'</button>'}).join('')+'</div>'+
   (seg==='rep'?'<div style="margin-top:8px">'+sel('sub',D.lessons.map(function(l){return [l.id,l.title+' · '+l.day+' '+l.start]}),sub||'l01')+'</div>':seg==='for'?'<div style="margin-top:8px">'+sel('sub',D.forfaits.map(function(f){return [f.id,f.name]}),sub||'f1')+'</div>':'')+'<div class="hrow" data-cnt style="margin-top:10px;min-height:24px"></div>'+
   '<div class="lx-h">2. Canaux</div><div class="cm-seg">'+['mail','sms','push','wa'].map(function(c){return '<button class="tag" data-manual data-chn="'+c+'" aria-pressed="'+(chs.indexOf(c)>=0)+'">'+ICON(CH[c][0],'sm')+CH[c][1]+'</button>'}).join('')+'</div>'+
   '<div class="lx-h">3. Message</div><div class="stack" style="--g:8px">'+sel('tpl',[['','Partir d’un modèle…']].concat(D.comTpl.map(function(t,i){return [i,t.n]})),'')+'<input class="in" data-k="subj" placeholder="Objet de l’e-mail et titre de la notification" value="'+F.esc(subj)+'"><textarea class="in" data-k="txt" rows="5" placeholder="Bonjour {prénom}, …">'+F.esc(txt)+'</textarea><div class="hrow wrap" style="--g:6px"><span class="xs mut">Insérer</span>'+['{prénom}','{cheval}','{reprise}','{solde}'].map(function(v){return '<button class="chip line" data-var="'+v+'" style="cursor:pointer">'+v+'</button>'}).join('')+'<button class="btn ghost sm" data-write style="margin-left:auto">'+ICON('edit','sm')+'Proposer un texte</button></div></div>'+
   '<div class="lx-h">4. Envoi</div>'+U.seg([['now','Maintenant'],['later','Programmer'],['best','Au meilleur moment']],when,'data-when')+(when==='later'?'<div class="lx-form" style="margin-top:10px">'+fld('Date','<input class="in" type="date" value="2026-11-18">')+fld('Heure','<input class="in" type="time" value="18:00">')+'</div>':when==='best'?'<div class="lx-ai" style="margin-top:10px">'+ICON('bulb','sm')+'<span>Envoi ce soir à 18 h 30 : c’est l’heure où ce groupe ouvre le plus ses messages.</span></div>':'')+
   '</div><div class="cm-pv"></div></div>';
  on(b,'[data-seg]',function(x){seg=x.getAttribute('data-seg');sub='';keep();paint(b)});
  on(b,'[data-k="sub"]',function(x){sub=x.value;preview()},'change');
  on(b,'[data-chn]',function(x){var c=x.getAttribute('data-chn'),i=chs.indexOf(c);if(i>=0)chs.splice(i,1);else chs.push(c);x.setAttribute('aria-pressed',i<0);preview()});
  on(b,'[data-k="tpl"]',function(x){if(x.value==='')return;var t=D.comTpl[+x.value];subj=t.s;txt=t.t;chs=t.ch.slice();paint(b)},'change');
  on(b,'[data-k="subj"]',function(x){subj=x.value;preview()},'input');on(b,'[data-k="txt"]',function(x){txt=x.value;preview()},'input');
  on(b,'[data-var]',function(x){var ta=$('[data-k="txt"]',b);ta.value+=(ta.value&&!/\s$/.test(ta.value)?' ':'')+x.getAttribute('data-var');txt=ta.value;preview();ta.focus()});
  on(b,'[data-write]',function(){var ta=$('[data-k="txt"]',b),s='Bonjour {prénom}, '+({due:'votre compte présente un solde de {solde}. Vous pouvez le régler en ligne en un geste depuis l’application, ou nous appeler pour étaler le paiement.',lic:'la licence FFE 2027 est à renouveler avant le 31 décembre. Un clic dans l’application suffit, nous nous occupons du reste.',cso:'voici les dernières informations pour dimanche : départ à 6 h 45 de la cour principale, reconnaissance à 8 h 30.'}[seg]||'les stages de Noël sont ouverts du 21 au 24 décembre. Les places partent vite : réservez la vôtre depuis l’application.')+' L’équipe des Tilleuls';
   if(!subj){subj={due:'Votre solde aux Tilleuls',lic:'Votre licence FFE 2027',cso:'Concours de Rambouillet : dernières informations'}[seg]||'Stages de Noël : les inscriptions sont ouvertes';$('[data-k="subj"]',b).value=subj}
   if(P.RM){ta.value=txt=s;preview();return}var i=0;(function ty(){if(!ta.isConnected)return;i+=4;ta.value=txt=s.slice(0,i);if(i<s.length)setTimeout(ty,12);else preview()})()});
  on(b,'[data-when]',function(x){when=x.getAttribute('data-when');keep();paint(b)});
  preview()}
 function keep(){var a=$('[data-k="subj"]',body),t=$('[data-k="txt"]',body);if(a)subj=a.value;if(t)txt=t.value}
 on(sh,'[data-draft]',function(){keep();D.comCamps.unshift({id:'cp'+(D.comCamps.length+1),title:subj||'Envoi sans titre',seg:segLabel(),n:people().length,ch:chs.slice(),status:'brouillon',when:'Modifié à l’instant'});sh.close();CS.tab='env';CS.cf='all';comRedraw();P.toast('Brouillon enregistré')});
 okb.onclick=function(){keep();var n=people().length,c={id:'cp'+(D.comCamps.length+1),title:subj||'Message aux adhérents',seg:segLabel(),n:n,ch:chs.slice(),status:when==='now'?'en cours':'programmé',when:when==='now'?'À l’instant':when==='best'?'Aujourd’hui, 18:30':'Demain, 18:00'};
  D.comCamps.unshift(c);sh.close();CS.tab='env';CS.cf='all';if(P.state.route!=='communication')P.go('communication');else comRedraw();
  if(when!=='now'){P.toast('Envoi programmé pour '+plural(n,'personne')+' : '+c.when.toLowerCase(),{icon:'clock'});return}
  /* progression de l'envoi, en direct dans la liste */
  var t0=performance.now(),dur=P.RM?1:2400;(function tick(now){var k=Math.min(1,(now-t0)/dur),row=P.app().querySelector('[data-c="'+c.id+'"]');
   if(row){var bar=row.querySelector('[data-cbar] .bar i'),lab=row.querySelector('[data-cbar] b');if(bar)bar.style.setProperty('--v',(k*100)+'%');if(lab)lab.textContent=Math.round(k*n)+' / '+n}
   if(k<1){requestAnimationFrame(tick);return}c.status='envoyé';c.res='Envoi terminé à 09:41';comRedraw();P.toast(plural(n,'message délivré','messages délivrés')+' par '+chs.map(function(x){return CH[x][1].toLowerCase()}).join(' et '),{icon:'send'})})(t0)}}

function openCamp(c){var sent=c.status==='envoyé'&&c.open!=null,o=Math.round(c.n*(c.open||0)/100),k=Math.round(c.n*(c.click||0)/100);
 var sh=P.sheet({title:c.title,icon:'send',body:'<div class="hrow wrap" style="--g:6px;margin-bottom:14px">'+U.chip(c.seg,'line')+chIcons(c.ch)+(sent?U.chip('Envoyé le '+c.when,'ok',true):c.status==='programmé'?U.chip('Programmé : '+c.when,'acc',true):c.status==='envoyé'?U.chip('Envoyé '+c.when.toLowerCase(),'ok',true):U.chip('Brouillon','',true))+'</div>'+
  (sent?'<div class="lx-h">Parcours du message</div>'+[['Envoyés',c.n,100],['Délivrés',Math.round(c.n*.99),99],['Ouverts',o,c.open],['Cliqués',k,c.click]].map(function(r){return '<div class="cm-fu"><span>'+r[0]+'</span>'+U.bar(r[2],'var(--acc)')+'<span class="num" style="text-align:right"><b>'+r[1]+'</b> <span class="mut xs">· '+r[2]+' %</span></span></div>'}).join('')+
   '<div class="lx-ai" style="margin-top:12px">'+ICON('bulb','sm')+'<span><b style="color:var(--ink)">Résultat : '+c.res+'.</b> '+(c.n-o>0?(c.n-o)+' personnes n’ont pas ouvert le message. Une relance par notification en touche en général la moitié.':'Tout le monde a lu le message.')+'</span></div>'+
   '<div class="lx-h">Par canal</div>'+c.ch.map(function(x,i){return '<div class="hrow sp s" style="padding:7px 0;border-top:1px solid var(--line)"><span class="hrow" style="--g:8px">'+ICON(CH[x][0],'sm')+CH[x][1]+'</span><span class="num"><b>'+Math.max(0,Math.min(100,(c.open||0)+(i?8:-4)))+' %</b> <span class="mut">ouverts</span></span></div>'}).join(''):
   '<p class="s mut">'+(c.status==='envoyé'?'Le message vient de partir. Les ouvertures et les clics s’affichent ici au fil de la journée.':c.status==='programmé'?'Cet envoi partira automatiquement. Vous pouvez encore le modifier ou l’envoyer tout de suite.':'Ce brouillon n’a pas encore de date d’envoi.')+'</p><div class="hrow sp s" style="padding:9px 0;border-top:1px solid var(--line);margin-top:10px"><span>Destinataires</span><b class="num">'+c.n+'</b></div><div class="hrow sp s" style="padding:9px 0;border-top:1px solid var(--line)"><span>Canaux</span><b>'+c.ch.map(function(x){return CH[x][1]}).join(', ')+'</b></div>'),
  foot:c.status==='envoyé'&&!sent?'<button class="btn" data-dup>'+ICON('copy','sm')+'Dupliquer</button>':sent?'<button class="btn" data-dup>'+ICON('copy','sm')+'Dupliquer</button>'+(c.n-o>0?'<button class="btn pri" data-re>Relancer les '+(c.n-o)+' non-lecteurs</button>':''):'<button class="btn danger" data-rm>Supprimer</button><button class="btn" data-ed>Modifier</button><button class="btn pri" data-now>Envoyer maintenant</button>'});
 on(sh,'[data-dup]',function(){sh.close();openComposer({s:c.title,ch:c.ch.slice()})});on(sh,'[data-ed]',function(){sh.close();openComposer({s:c.title,ch:c.ch.slice()})});
 on(sh,'[data-re]',function(){sh.close();P.toast('Relance envoyée à '+(c.n-o)+' personnes par notification',{icon:'bell'})});
 on(sh,'[data-rm]',function(){var i=D.comCamps.indexOf(c);D.comCamps.splice(i,1);sh.close();comRedraw();P.toast('Envoi supprimé',{undo:function(){D.comCamps.splice(i,0,c);comRedraw()}})});
 on(sh,'[data-now]',function(){c.status='envoyé';c.when='à l’instant';c.res='Envoi terminé à 09:41';sh.close();comRedraw();P.toast(plural(c.n,'message envoyé','messages envoyés'),{icon:'send'})})}

function openTemplates(){var sh=P.sheet({title:'Modèles et envois automatiques',icon:'doc',body:'<p class="s mut" style="margin-bottom:6px">Chaque modèle se personnalise avec le prénom, le cheval ou la reprise. Les envois automatiques partent sans vous.</p><div>'+D.comTpl.map(function(t,i){return '<div class="cm-tp"><div style="min-width:0"><div class="hrow" style="--g:8px"><b class="s">'+t.n+'</b>'+chIcons(t.ch)+'</div><div class="xs mut ellip" style="margin-top:3px">'+F.esc(t.t)+'</div></div><button class="btn sm" data-use="'+i+'">Utiliser</button>'+(t.auto?'<div class="hrow xs" style="--g:6px;color:var(--mut)">'+ICON('bolt','sm')+'<span>Automatique : '+t.auto.toLowerCase()+'</span></div><button class="tog" role="switch" data-auto="'+i+'" aria-checked="'+t.on+'" style="justify-self:end" title="Activer l’envoi automatique"></button>':'')+'</div>'}).join('')+'</div>',foot:'<button class="btn pri" data-newt>'+ICON('plus','sm')+'Créer un modèle</button>'});
 on(sh,'[data-use]',function(b){var t=D.comTpl[+b.getAttribute('data-use')];sh.close();openComposer({s:t.s,t:t.t,ch:t.ch.slice()})});
 on(sh,'[data-auto]',function(b){var t=D.comTpl[+b.getAttribute('data-auto')];setTimeout(function(){t.on=b.getAttribute('aria-checked')==='true';P.toast('« '+t.n+' » : envoi automatique '+(t.on?'activé':'désactivé'),{icon:'bolt'})},0)});
 on(sh,'[data-newt]',function(){sh.close();openComposer({});P.toast('Rédigez votre message, puis enregistrez-le comme brouillon pour le réutiliser',{icon:'info'})})}

function openPin(){var sh=P.sheet({title:'Nouvelle annonce',icon:'pin',body:'<div class="stack" style="--g:12px">'+fld('Titre','<input class="in" data-k="t" value="Manège fermé samedi matin pour le concours interne">')+fld('Message','<textarea class="in" data-k="b" rows="3">Les reprises de 9 h et 10 h ont lieu en carrière d’honneur. Pensez à couvrir vos chevaux.</textarea>')+'<div class="lx-form">'+fld('Visible par',sel('a',SEG.slice(0,9).map(function(s){return s[1]}),''))+fld('Jusqu’au','<input class="in" type="date" value="2026-11-21">')+'</div><div>'+opt('Épingler en haut du portail','L’annonce reste visible tant qu’elle n’est pas expirée.',true,'pn-on')+opt('Envoyer aussi une notification','Les adhérents concernés sont prévenus tout de suite.',true,'pn-pu')+opt('Afficher sur l’écran de la sellerie','Visible par les cavaliers sur place.',false,'pn-tv')+'</div></div>',foot:'<button class="btn pri" data-ok>'+ICON('pin','sm')+'Publier l’annonce</button>'});
 on(sh,'[data-ok]',function(){var push=isOn(sh,'pn-pu');D.comPins.unshift({id:'pn'+(D.comPins.length+1),title:val(sh,'t')||'Annonce',body:val(sh,'b'),aud:val(sh,'a'),until:'samedi 21 novembre',views:0,on:true});sh.close();CS.tab='pin';comRedraw(true);P.toast('Annonce publiée sur le portail'+(push?' et notifiée aux adhérents':''),{icon:'pin'})})}
function openPoll(){var opts=['Oui','Non','Peut-être'];
 var sh=P.sheet({title:'Nouveau sondage',icon:'checkc',body:'',foot:'<button class="btn pri" data-ok>'+ICON('send','sm')+'Envoyer le sondage</button>'});var body=$('.sb',sh),q='Qui vient à la soirée de fin d’année du club ?';paint(body);
 function paint(b){b.innerHTML='<div class="stack" style="--g:12px">'+fld('Question','<input class="in" data-k="q" value="'+F.esc(q)+'">')+'<div class="field"><span>Réponses possibles</span>'+opts.map(function(o,i){return '<div class="hrow" style="--g:6px"><input class="in" data-o="'+i+'" value="'+F.esc(o)+'">'+(opts.length>2?'<button class="btn ghost icon" data-del="'+i+'" title="Retirer cette réponse">'+ICON('x','sm')+'</button>':'')+'</div>'}).join('')+(opts.length<5?'<button class="btn sm" data-addo style="align-self:flex-start">'+ICON('plus','sm')+'Ajouter une réponse</button>':'')+'</div><div class="lx-form">'+fld('Envoyer à',sel('a',SEG.slice(0,9).map(function(s){return s[1]}),''))+fld('Clôture',sel('c',['Dans 24 heures','Dans 3 jours','Dans une semaine'],'Dans 3 jours'))+'</div><div>'+opt('Relance automatique après 24 heures','Seules les personnes sans réponse sont relancées.',true,'po-re')+opt('Réponses visibles par le groupe','Chacun voit qui vient, comme dans un groupe de discussion.',true,'po-vi')+opt('Autoriser plusieurs réponses','',false,'po-mu')+'</div></div>';
  on(b,'[data-o]',function(i){opts[+i.getAttribute('data-o')]=i.value},'input');on(b,'[data-k="q"]',function(i){q=i.value},'input');
  on(b,'[data-addo]',function(){opts.push('Autre réponse');paint(b)});on(b,'[data-del]',function(x){opts.splice(+x.getAttribute('data-del'),1);paint(b)})}
 on(sh,'[data-ok]',function(){var audL=val(sh,'a'),s=SEG.find(function(x){return x[1]===audL}),ppl=D.members.filter(s[2]),p={id:'po'+(D.comPolls.length+1),q:q||'Sondage',aud:audL,total:ppl.length,closes:val(sh,'c').toLowerCase(),open:true,live:true,opts:opts.filter(function(o){return o.trim()}).map(function(o){return {l:o,n:0,ids:[]}})};
  D.comPolls.unshift(p);sh.close();CS.tab='pin';comRedraw(true);P.toast('Sondage envoyé à '+plural(p.total,'personne')+' par notification',{icon:'send'});
  /* les premières réponses arrivent en direct */
  var i=0,max=P.RM?0:9;(function tick(){if(i>=max||!p.open){p.live=false;if(max)comRedraw();return}var o=p.opts[[0,0,1,0,2,0,1,0,0][i]%p.opts.length],m=ppl[(i*7+3)%ppl.length];o.n++;o.ids.unshift(m.id);i++;comRedraw();setTimeout(tick,650)})()})}

P.actions.push(
 {role:'gerant',label:'Nouvel envoi groupé',icon:'send',run:function(){P.go('communication');setTimeout(function(){openComposer({})},380)}},
 {role:'gerant',label:'Créer un sondage rapide',icon:'checkc',run:function(){CS.tab='pin';P.go('communication');setTimeout(openPoll,380)}},
 {role:'gerant',label:'Publier une annonce sur le portail',icon:'pin',run:function(){CS.tab='pin';P.go('communication');setTimeout(openPin,380)}},
 {role:'gerant',label:'Écrire aux adhérents en retard de paiement',icon:'mail',run:function(){P.go('communication');setTimeout(function(){openComposer({seg:'due',ch:['mail','sms']})},380)}});
P.brain.push({role:'gerant',re:/message|sms|sondage|annonce|écri|ecri|prévien|previen|whatsapp/i,reply:function(){var un=D.comThreads.filter(function(t){return t.unread||t.todo});return {text:plural(un.length,'conversation attend','conversations attendent')+' une réponse. Je peux aussi préparer un envoi groupé ciblé ou un sondage.',card:un.slice(0,4).map(function(t){return '<div class="hrow sp"><span class="s ellip">'+t.title+'</span><span class="xs mut">'+t.when+'</span></div>'}).join(''),actions:[{label:'Ouvrir la messagerie',run:function(){CS.tab='msg';P.go('communication');return 'Messagerie ouverte'}},{label:'Préparer un envoi groupé',run:function(){P.go('communication');setTimeout(function(){openComposer({})},380);return 'Envoi préparé'}}]}}});
})();
