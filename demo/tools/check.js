/* Contrôle de tous les écrans : node demo/tools/check.js [desktop|phone|tablet] [--dark]
   Ouvre chaque route, relève les erreurs console, les débordements et les écrans en erreur. */
const {chromium}=require('playwright'),path=require('path');
(async()=>{const dev=process.argv[2]||'desktop',dark=process.argv.includes('--dark');
 const vp=dev==='phone'?{width:390,height:844}:dev==='tablet'?{width:1180,height:820}:{width:1440,height:900};
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});
 const p=await b.newPage({viewport:vp,colorScheme:dark?'dark':'light'});let errs=[];
 p.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,160))});p.on('pageerror',e=>errs.push('PAGEERROR '+e.message.slice(0,160)));
 await p.addInitScript(d=>{try{localStorage.setItem('piaffe:dev',JSON.stringify(d))}catch(e){}},dev);
 await p.goto('file://'+path.join(__dirname,'../dist/'+(process.env.PREVIEW||'preview')+'.html'));await p.waitForTimeout(1200);
 const routes=await p.evaluate(()=>Object.keys(P.mods));let bad=0;
 for(const r of routes){errs=[];await p.evaluate(r=>P.go(r),r);await p.waitForTimeout(700);
  const st=await p.evaluate(()=>{const v=document.querySelector('.view'),vr=v.getBoundingClientRect(),o=[];
    v.querySelectorAll('*').forEach(e=>{const rr=e.getBoundingClientRect();if(rr.width>0&&rr.right>vr.right+2&&!e.closest('.tw,.scroll-x,.seg,.tabs,canvas')&&getComputedStyle(e).position!=='absolute'&&getComputedStyle(e).position!=='fixed'){let anc=e.parentElement,clip=false;while(anc&&anc!==v){const ov=getComputedStyle(anc).overflowX;if(ov==='auto'||ov==='hidden'||ov==='scroll'){clip=true;break}anc=anc.parentElement}if(!clip)o.push((e.className&&e.className.baseVal===undefined?e.className:e.tagName).toString().slice(0,40))}});
    return {err:!!v.querySelector('.empty')&&/erreur/.test(v.textContent.slice(0,400)),over:[...new Set(o)].slice(0,5),doc:document.documentElement.scrollWidth>innerWidth}});
  if(errs.length||st.err||st.over.length||st.doc){bad++;console.log(r,JSON.stringify(st),errs.slice(0,3).join(' | '))}}
 console.log(dev+(dark?' sombre':'')+' : '+routes.length+' écrans, '+bad+' avec problème');await b.close()})();
