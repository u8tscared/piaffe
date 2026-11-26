/* Assemble la démo en un seul fichier HTML : node demo/tools/build.js [--preview]
   Sortie : demo/dist/piaffe.html (publication) et demo/dist/preview.html (three.js local, pour les tests) */
const fs=require('fs'),path=require('path');
const R=path.join(__dirname,'..'),rd=f=>fs.readFileSync(path.join(R,f),'utf8');
const mods=fs.readdirSync(path.join(R,'modules')).filter(f=>f.endsWith('.js')).sort();
const css=rd('core/tokens.css')+'\n'+rd('core/shell.css');
const only=(process.argv.find(a=>a.startsWith('--only='))||'').slice(7);
const use=only?mods.filter(f=>only.split(',').some(o=>f.includes(o))||f.startsWith('10-')):mods;
/* un <script> par module : une erreur de syntaxe dans un module n'arrête pas les autres */
const js=['core/horse.inc.js','core/brand.js','core/icons.js','core/data.js','core/engine.js'].map(rd).join('\n;\n')+'\n</script>\n'+
  use.map(f=>'<script>/* ===== modules/'+f+' ===== */\ntry{\n'+rd('modules/'+f)+'\n}catch(e){console.error("Module '+f+'",e)}\n</script>').join('\n')+'\n<script>P.start();';
const head=`<title>Stabl</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,500;12..96,600;12..96,700;12..96,800&family=Instrument+Sans:wght@400;500;600;700&family=Geist+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>${css}</style>
`;
const THREE_CDN='<script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>';
fs.mkdirSync(path.join(R,'dist'),{recursive:true});
const OUT=(process.argv.find(a=>a.startsWith('--out='))||'').slice(6);
const out=head+THREE_CDN+'\n<script>\n'+js+'\n</script>\n';
if(!OUT)fs.writeFileSync(path.join(R,'dist/piaffe.html'),out);
const local=fs.readFileSync(path.join(R,'tools/three.min.js'),'utf8');
fs.writeFileSync(path.join(R,'dist/preview'+(OUT?'-'+OUT:'')+'.html'),'<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'+head+'<script>'+local+'</script></head><body><script>\n'+js+'\n</script></body></html>');
console.log('OK',use.length,'modules',(out.length/1024).toFixed(0)+' Ko');
