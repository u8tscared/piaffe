/* Captures des vrais écrans de la démo pour la landing.
   node site/tools/capture.js  (après node demo/tools/build.js --out=landing)
   Écrit site/shots/<nom>.webp (et un index shots.json avec tailles). */
const {chromium}=require('playwright'),path=require('path'),fs=require('fs'),{execFileSync}=require('child_process');
const OUT=path.join(__dirname,'../shots'),TMP=path.join(OUT,'_png');fs.mkdirSync(TMP,{recursive:true});
const PREV='file://'+path.join(__dirname,'../../demo/dist/preview-landing.html');
/* [nom, route, appareil, sombre, action js] */
const L=[
 ['g-cockpit','cockpit','desktop'],['g-cockpit-dark','cockpit','desktop',1],
 ['g-planning','planning','desktop'],['g-planning-dark','planning','desktop',1],['g-planning-piste','planning','desktop',0,"document.querySelectorAll('[role=tab],button').forEach(b=>{if(b.textContent.trim()==='Jour par piste')b.click()})"],
 ['g-chevaux','chevaux','desktop'],['g-soins','soins','desktop'],['g-alimentation','alimentation','desktop'],['g-3d','ecurie3d','desktop'],['g-cameras','cameras','desktop'],
 ['g-adherents','adherents','desktop'],['g-pensions','pensions','desktop'],['g-competitions','competitions','desktop'],['g-communication','communication','desktop'],
 ['g-facturation','facturation','desktop'],['g-compta','compta','desktop'],['g-contrats','contrats','desktop'],['g-equipe','equipe','desktop'],['g-rapports','rapports','desktop'],
 ['g-assistant','assistant','desktop'],['g-connecteurs','connecteurs','desktop'],['g-import','import','desktop'],
 ['g-ai-relances','cockpit','desktop',0,"P.assistant('Qui n’a pas payé ?')"],
 ['g-ai-planning','planning','desktop',0,"P.assistant('Comment se présente le planning de samedi ?')"],
 ['g-ai-dark','cockpit','desktop',1,"P.assistant('Qui n’a pas payé ?')"],
 ['c-agenda','coach-agenda','desktop'],['c-eleves','coach-eleves','desktop'],
 ['e-jour-tab','emp-jour','tablet'],['e-tournee-tab','emp-tournee','tablet'],
 ['p-adh-accueil','adh-accueil','phone'],['p-adh-reserver','adh-reserver','phone'],['p-adh-cheval','adh-cheval','phone'],['p-adh-paiements','adh-paiements','phone'],['p-adh-progression','adh-progression','phone'],['p-adh-concours','adh-concours','phone'],
 ['p-emp-jour','emp-jour','phone'],['p-emp-tournee','emp-tournee','phone'],['p-emp-soins','emp-soins','phone'],['p-emp-pointage','emp-pointage','phone'],
 ['p-coach-agenda','coach-agenda','phone'],['p-coach-revenus','coach-revenus','phone'],
 ['p-g-cockpit','cockpit','phone'],['p-pro-jour','pro-jour','phone'],['g-pro-jour','pro-jour','desktop'],['p-pro-factures','pro-factures','phone'],['p-adh-accueil-dark','adh-accueil','phone',1]
];
const only=process.argv.slice(2);
(async()=>{const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-webgl','--ignore-gpu-blocklist']});const idx={};
 for(const [name,route,dev,dark,js] of L){if(only.length&&!only.includes(name))continue;
  const vp=dev==='phone'?{width:393,height:852}:dev==='tablet'?{width:1180,height:820}:{width:1440,height:900};
  const p=await b.newPage({viewport:vp,deviceScaleFactor:dev==='phone'?3:2,colorScheme:dark?'dark':'light'});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(([d,dk])=>{try{localStorage.setItem('piaffe:dev',JSON.stringify(d==='tablet'?'desktop':d));localStorage.setItem('piaffe:theme',JSON.stringify(dk?'dark':'light'))}catch(e){}},[dev,dark]);
  await p.goto(PREV+'#'+route);await p.waitForTimeout(900);
  await p.addStyleTag({content:'.dbar{display:none!important}#demo{grid-template-rows:minmax(0,1fr)!important}.toasts{display:none!important}'+(dev==='phone'?'.stage.full .app.mobile .top{padding-top:62px!important}.app.mobile .tabbar{bottom:28px!important}.app.mobile .main{padding-bottom:110px!important}':'')});
  await p.evaluate(()=>window.dispatchEvent(new Event('resize')));
  if(js){await p.evaluate(js);await p.waitForTimeout(1900)}
  await p.waitForTimeout(1500);
  const png=path.join(TMP,name+'.png');await p.screenshot({path:png});
  const w=dev==='phone'?786:dev==='tablet'?1770:2160;const out=path.join(OUT,name+'.webp');
  execFileSync('python3',['-I','-c',`from PIL import Image;im=Image.open(${JSON.stringify(png)}).convert('RGB');r=${w}/im.width;im=im.resize((${w},round(im.height*r)),Image.LANCZOS);im.save(${JSON.stringify(out)},'WEBP',quality=80,method=6);print(im.size)`]);
  const sz=fs.statSync(out).size;idx[name]={route,dev,dark:!!dark,w:vp.width,h:vp.height,kb:Math.round(sz/1024)};
  console.log(name,Math.round(sz/1024)+' Ko',errs.length?'ERREURS '+errs.join(' | '):'');await p.close()}
 const f=path.join(OUT,'shots.json');const prev=fs.existsSync(f)?JSON.parse(fs.readFileSync(f,'utf8')):{};fs.writeFileSync(f,JSON.stringify(Object.assign(prev,idx),null,1));await b.close()})();
