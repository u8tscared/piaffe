/* Stabl · landing. node site/build.js
   Assemble src/landing.html + landing.css + landing.js, injecte les icônes, le logo, les illustrations (demo/core/icons.js)
   et le cheval 3D (demo/core/horse.inc.js).
   Sorties : dist/landing.html (publication, images en shots/…) et dist/preview.html (document complet, images en ../shots/…). */
const fs=require('fs'),path=require('path');
const S=path.join(__dirname,'src'),CORE=path.join(__dirname,'../demo/core');
const rd=f=>fs.readFileSync(f,'utf8');
let html=rd(path.join(S,'landing.html'));
/* three.js r128 vient de cdnjs ; l'aperçu local le charge depuis demo/tools pour fonctionner hors ligne */
const CDN='https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
const parts={'/*__CSS__*/':rd(path.join(S,'landing.css')),'/*__ICONS__*/':rd(path.join(CORE,'brand.js'))+'\n;\n'+rd(path.join(CORE,'icons.js')),'/*__HORSE__*/':rd(path.join(CORE,'horse.inc.js')),'/*__JS__*/':rd(path.join(S,'landing.js'))};
/* liens de démo : {{demo:ecran}} dans le HTML, {{demobase}} pour le JS */
/* PIAFFE_DEMO=pages : liens relatifs vers demo/ (GitHub Pages) ; sinon l'artifact claude.ai */
const DEMO=process.env.PIAFFE_DEMO==='pages'?'demo/':'https://claude.ai/artifact/Vdt6ti3FA1Nii45Y42nRKN';
html=html.replace(/\{\{demo:([a-z0-9-]+)\}\}/g,(m,r)=>'href="'+DEMO+'#'+r+'" target="_blank" rel="noopener"');
html=html.replace(/\{\{demobase\}\}/g,DEMO);
/* icônes : {{i:nom}} */
const vm=require('vm');const ctx={window:{}};vm.runInNewContext((fs.existsSync(path.join(CORE,'brand.js'))?rd(path.join(CORE,'brand.js'))+'\n;\n':'')+rd(path.join(CORE,'icons.js')),ctx);
html=html.replace(/\{\{i:([a-z_]+)\}\}/g,(m,n)=>{if(!ctx.window.ICONS[n])throw new Error('Icône inconnue : '+n);return ctx.window.ICON(n)});
html=html.replace(/\{\{logo:(\d+)\}\}/g,(m,n)=>ctx.window.LOGO(+n,'currentColor','var(--acc)',true));
/* espaces insécables dans le texte HTML (hors style et script) */
html=html.replace(/(<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<pre[\s\S]*?<\/pre>)|>([^<]+)</g,(m,blk,txt)=>blk?blk:'>'+txt.replace(/ ([:;?!%€»])/g,' $1').replace(/« /g,'« ')+'<');
for(const k in parts){if(!html.includes(k))throw new Error('Marqueur absent : '+k);html=html.replace(k,()=>parts[k])}
if(/<\/script>/i.test(parts['/*__JS__*/']))throw new Error('landing.js ne doit pas contenir de balise de fermeture de script');
/* toute capture citée doit exister */
const SH=path.join(__dirname,'shots');
(html.match(/shots\/[a-z0-9-]+\.webp/g)||[]).forEach(f=>{if(!fs.existsSync(path.join(__dirname,f)))throw new Error('Capture absente : '+f)});
const D=path.join(__dirname,'dist');fs.mkdirSync(D,{recursive:true});
fs.writeFileSync(path.join(D,'landing.html'),html);
const prev='<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+html.replace(/(["'(])shots\//g,'$1../shots/').replace(CDN,'../../demo/tools/three.min.js')+'</body></html>';
fs.writeFileSync(path.join(D,'preview.html'),prev);
console.log('dist/landing.html',(html.length/1024|0)+' Ko');
