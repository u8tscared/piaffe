/* Image de partage (Open Graph) 1200 × 630 : node site/tools/og.js → site/shots/og-stabl.jpg */
const {chromium}=require('playwright'),path=require('path'),fs=require('fs'),{execFileSync}=require('child_process');
const ROOT=path.join(__dirname,'..'),BRAND=path.join(ROOT,'../brand/stabl');
const logo=fs.readFileSync(path.join(BRAND,'logo/stabl-logo-blanc.svg'),'utf8').replace(/<\?xml[^>]*>/,'');
const shot='file://'+path.join(ROOT,'shots/g-cockpit.webp');
const html=`<!doctype html><html lang="fr"><head><meta charset="utf-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,800&family=Inter:wght@500;600&display=swap">
<style>
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;overflow:hidden;font-family:Inter,sans-serif;color:#fff;
 background:radial-gradient(60% 80% at 100% 0%,#2448d8 0%,transparent 70%),radial-gradient(50% 70% at 0% 100%,#182a6e,transparent 70%),#0a1636}
.t{position:absolute;left:72px;top:64px;width:560px}
.l svg{height:56px;width:auto;display:block}
h1{margin-top:44px;font:800 64px/1 'Bricolage Grotesque',sans-serif;letter-spacing:-.04em}
p{margin-top:24px;font-size:24px;line-height:1.4;color:#c4cdea}
.px{position:absolute;left:72px;bottom:64px;display:flex;gap:12px}
.px span{padding:12px 18px;border-radius:14px;background:rgba(255,255,255,.1);font-weight:600;font-size:20px}
.px span:first-child{background:#fff;color:#0a1636}
.f{position:absolute;left:670px;top:96px;width:760px;border-radius:18px;overflow:hidden;box-shadow:0 0 0 6px rgba(255,255,255,.08),0 40px 80px rgba(0,0,0,.5)}
.f img{display:block;width:100%}
</style></head><body>
<div class="t"><div class="l">${logo}</div><h1>Tout votre centre équestre dans une seule app.</h1><p>Planning, chevaux, adhérents, facturation, équipe et Stabl AI.</p></div>
<div class="px"><span>Dès 59 €&nbsp;HT par mois</span><span>30 jours d’essai gratuit</span></div>
<div class="f"><img src="${shot}"></div>
</body></html>`;
(async()=>{const tmp=path.join(ROOT,'dist/og.html');fs.mkdirSync(path.dirname(tmp),{recursive:true});fs.writeFileSync(tmp,html);
 const b=await chromium.launch();const p=await b.newPage({viewport:{width:1200,height:630}});
 await p.goto('file://'+tmp,{waitUntil:'networkidle'});await p.waitForTimeout(400);
 const png=path.join(ROOT,'dist/og.png'),jpg=path.join(ROOT,'shots/og-stabl.jpg');await p.screenshot({path:png});await b.close();fs.unlinkSync(tmp);
 execFileSync('python3',['-I','-c',`from PIL import Image;Image.open(${JSON.stringify(png)}).convert('RGB').save(${JSON.stringify(jpg)},'JPEG',quality=86,optimize=True,progressive=True)`]);fs.unlinkSync(png);console.log('shots/og-stabl.jpg')})();
