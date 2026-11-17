/* Captures de contrôle : PREVIEW=preview-moi node demo/tools/shot.js <route> [desktop|tablet|phone] [nom] [--full] [--dark] [--click=sel1|sel2]
   Écrit demo/shots/<nom>.png et affiche les erreurs console et le débordement horizontal. */
const {chromium}=require('playwright'),path=require('path'),fs=require('fs');
(async()=>{const a=process.argv.slice(2),route=a[0]||'cockpit',dev=a[1]||'desktop',name=a[2]||route+'-'+dev,full=a.includes('--full'),dark=a.includes('--dark');
 const clk=(a.find(x=>x.startsWith('--click='))||'').slice(8).split('|').filter(Boolean);
 const vp=dev==='phone'?{width:390,height:844}:dev==='tablet'?{width:1180,height:820}:{width:1440,height:900};
 const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const p=await b.newPage({viewport:vp,colorScheme:dark?'dark':'light'});const errs=[];
 p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});p.on('pageerror',e=>errs.push('PAGEERROR '+e.message));
 await p.addInitScript(d=>{try{localStorage.setItem('piaffe:dev',JSON.stringify(d))}catch(e){}},dev==='tablet'?'tablet':dev);
 await p.goto('file://'+path.join(__dirname,'../dist/'+(process.env.PREVIEW||'preview')+'.html')+'#'+route);await p.waitForTimeout(1600);
 for(const c of clk){try{await p.click(c,{timeout:3000});await p.waitForTimeout(900)}catch(e){errs.push('CLICK FAIL '+c)}}
 const ov=await p.evaluate(()=>{const v=document.querySelector('.view');const o=[];document.querySelectorAll('.view *').forEach(e=>{const r=e.getBoundingClientRect(),vr=v.getBoundingClientRect();if(r.right>vr.right+2&&r.width>0&&getComputedStyle(e).position!=='absolute'&&!e.closest('.tw,.scroll-x,.seg,.tabs'))o.push(e.className||e.tagName)});return {doc:document.documentElement.scrollWidth,vw:innerWidth,over:[...new Set(o)].slice(0,8)}});
 if(full){await p.evaluate(()=>{const v=document.querySelector('.view');document.querySelector('.stage').style.height=(v.scrollHeight+200)+'px';document.body.style.overflow='visible';document.getElementById('demo').style.height='auto'});await p.waitForTimeout(400)}
 fs.mkdirSync(path.join(__dirname,'../shots'),{recursive:true});
 await p.screenshot({path:path.join(__dirname,'../shots/'+name+'.png'),fullPage:full});
 console.log(name,JSON.stringify(ov),errs.length?'\nERREURS:\n'+errs.slice(0,10).join('\n'):'sans erreur');await b.close()})();
