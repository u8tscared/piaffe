/* Génère le bloc d'icônes Phosphor (duotone, licence MIT) dans demo/core/icons.js
   node demo/tools/icones/gen.js <dossier assets de @phosphor-icons/core> */
const fs=require('fs'),path=require('path');const src=process.argv[2];const m=require('./map.json');
const out={};for(const[k,v]of Object.entries(m)){const s=fs.readFileSync(path.join(src,'duotone',v+'-duotone.svg'),'utf8');out[k]=s.replace(/^<svg[^>]*>/,'').replace(/<\/svg>\s*$/,'').replace(/ opacity="0.2"/g,' class="d"')}
const blk='/* PHOSPHOR:DEBUT (généré par demo/tools/icones/gen.js : icônes Phosphor duotone, MIT, phosphoricons.com) */\nvar PH=window.PH_ICONS='+JSON.stringify(out)+';\n/* PHOSPHOR:FIN */';
const f=path.join(__dirname,'../../core/icons.js');let t=fs.readFileSync(f,'utf8');
t=/\/\* PHOSPHOR:DEBUT[\s\S]*PHOSPHOR:FIN \*\//.test(t)?t.replace(/\/\* PHOSPHOR:DEBUT[\s\S]*PHOSPHOR:FIN \*\//,blk):t.replace('window.ICONS=I;',blk+'\nwindow.ICONS=I;');
fs.writeFileSync(f,t);console.log(Object.keys(out).length,'icônes',(blk.length/1024).toFixed(0)+' Ko')
