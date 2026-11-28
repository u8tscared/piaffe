/* Stabl · page d’accueil. node site/build.js
   Assemble src/landing.html + landing.css + landing.js, injecte les icônes, le logo officiel (brand/stabl) et les liens.
   Sorties :
   - dist/index.html   : document complet pour stablapp.fr (balises SEO, Open Graph, données structurées, favicon) ;
   - dist/landing.html : le même contenu sans en-tête de document (artifact) ;
   - dist/preview.html : aperçu local, images en ../shots/…
   PIAFFE_DEMO=pages : liens relatifs vers demo/ et passerelle/ (GitHub Pages). */
const fs=require('fs'),path=require('path');
const S=path.join(__dirname,'src'),CORE=path.join(__dirname,'../demo/core'),BRAND=path.join(__dirname,'../brand/stabl');
const rd=f=>fs.readFileSync(f,'utf8');
const SITE='https://stablapp.fr/';
const PAGES=process.env.PIAFFE_DEMO==='pages';
const DESC='Stabl, le logiciel de gestion des centres équestres, poney-clubs et écuries : planning, chevaux et soins, adhérents, facturation, équipe et Stabl AI. Dès 59 € HT par mois, 30 jours d’essai gratuit.';
let html=rd(path.join(S,'landing.html'));
const parts={'/*__CSS__*/':rd(path.join(S,'landing.css')),'/*__ICONS__*/':rd(path.join(CORE,'brand.js'))+'\n;\n'+rd(path.join(CORE,'icons.js')),'/*__JS__*/':rd(path.join(S,'landing.js'))};
/* liens : {{demo:ecran}}, {{demobase}}, {{passerelle}} */
const DEMO=PAGES?'demo/':'https://claude.ai/artifact/Vdt6ti3FA1Nii45Y42nRKN';
const PASS=PAGES?'passerelle/':SITE+'passerelle/';
html=html.replace(/\{\{demo:([a-z0-9-]+)\}\}/g,(m,r)=>'href="'+DEMO+'#'+r+'" target="_blank" rel="noopener"');
html=html.replace(/\{\{demobase\}\}/g,DEMO).replace(/\{\{passerelle\}\}/g,PASS).replace(/\{\{description\}\}/g,DESC);
/* logo officiel : symbole + « stabl » vectorisés, couleur du texte */
const lockup=rd(path.join(BRAND,'logo/stabl-logo-marine.svg')).replace(/<\?xml[^>]*>/,'').replace(/fill="#0a1636"/gi,'').replace('<svg ','<svg class="lockup" aria-hidden="true" focusable="false" ').replace(/\s*xmlns="[^"]*"/,'').trim();
if(!/viewBox/.test(lockup))throw new Error('Logo officiel illisible');
html=html.replace(/\{\{marque\}\}/g,()=>lockup);
/* icônes : {{i:nom}}, symbole seul : {{logo:N}} */
const vm=require('vm');const ctx={window:{}};vm.runInNewContext(rd(path.join(CORE,'brand.js'))+'\n;\n'+rd(path.join(CORE,'icons.js')),ctx);
html=html.replace(/\{\{i:([a-z_]+)\}\}/g,(m,n)=>{if(!ctx.window.ICONS[n])throw new Error('Icône inconnue : '+n);return ctx.window.ICON(n)});
html=html.replace(/\{\{logo:(\d+)\}\}/g,(m,n)=>ctx.window.LOGO(+n,'currentColor','currentColor'));
/* espaces insécables dans le texte HTML (hors style et script) */
html=html.replace(/(<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>|<pre[\s\S]*?<\/pre>)|>([^<]+)</g,(m,blk,txt)=>blk?blk:'>'+txt.replace(/(\d) (\d{3})(?!\d)/g,'$1\u202f$2').replace(/ ([:;?!%€»])/g,'\u00a0$1').replace(/« /g,'«\u00a0')+'<');
for(const k in parts){if(!html.includes(k))throw new Error('Marqueur absent : '+k);html=html.replace(k,()=>parts[k])}
if(/<\/script>/i.test(parts['/*__JS__*/']))throw new Error('landing.js ne doit pas contenir de balise de fermeture de script');
if(/\{\{[a-z]/.test(html))throw new Error('Jeton non remplacé : '+html.match(/\{\{[^}]*\}\}/)[0]);
/* toute capture citée doit exister */
(html.match(/shots\/[a-z0-9-]+\.(webp|png)/g)||[]).forEach(f=>{if(!fs.existsSync(path.join(__dirname,f)))throw new Error('Capture absente : '+f)});
const D=path.join(__dirname,'dist');fs.mkdirSync(D,{recursive:true});

/* document complet : l’en-tête SEO remplace <title> et la description du fragment */
const TITLE='Stabl · Logiciel de gestion pour centres équestres et écuries';
const esc=s=>s.replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;');
const ld={'@context':'https://schema.org','@type':'SoftwareApplication',name:'Stabl',url:SITE,image:SITE+'shots/og-stabl.jpg',
  applicationCategory:'BusinessApplication',applicationSubCategory:'Logiciel de gestion de centre équestre',operatingSystem:'Web, iOS, Android',inLanguage:'fr-FR',description:DESC,
  offers:{'@type':'AggregateOffer',priceCurrency:'EUR',lowPrice:'59',highPrice:'289',offerCount:3,
    offers:[['Essentiel',59],['Club',149],['Domaine',289]].map(([n,p])=>({'@type':'Offer',name:n,price:String(p),priceCurrency:'EUR',
      priceSpecification:{'@type':'UnitPriceSpecification',price:String(p),priceCurrency:'EUR',unitText:'MONTH',valueAddedTaxIncluded:false}}))},
  publisher:{'@type':'Organization',name:'Stabl',url:SITE,email:'contact@stablapp.fr',logo:SITE+'icons/pwa-512.png',
    address:{'@type':'PostalAddress',streetAddress:'36 rue Jacques-Louis Hénon',postalCode:'69004',addressLocality:'Lyon',addressCountry:'FR'}}};
const seo=['<title>'+TITLE+'</title>','<meta name="description" content="'+esc(DESC)+'">','<link rel="canonical" href="'+SITE+'">',
 '<meta name="robots" content="index,follow">','<meta name="theme-color" content="#0a1636">',
 '<meta name="application-name" content="Stabl"><meta name="apple-mobile-web-app-title" content="Stabl">',
 '<link rel="icon" href="icons/favicon.svg" type="image/svg+xml"><link rel="icon" href="icons/favicon.ico" sizes="any"><link rel="apple-touch-icon" href="icons/apple-touch-icon-180.png"><link rel="manifest" href="manifest.webmanifest">',
 '<meta property="og:type" content="website"><meta property="og:locale" content="fr_FR"><meta property="og:site_name" content="Stabl">',
 '<meta property="og:title" content="'+esc(TITLE)+'"><meta property="og:description" content="'+esc(DESC)+'"><meta property="og:url" content="'+SITE+'">',
 '<meta property="og:image" content="'+SITE+'shots/og-stabl.jpg"><meta property="og:image:width" content="1200"><meta property="og:image:height" content="630"><meta property="og:image:alt" content="Stabl, tout votre centre équestre dans une seule app">',
 '<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="'+esc(TITLE)+'"><meta name="twitter:description" content="'+esc(DESC)+'"><meta name="twitter:image" content="'+SITE+'shots/og-stabl.jpg">',
 '<link rel="preload" as="image" href="shots/g-cockpit.webp" fetchpriority="high">',
 '<script type="application/ld+json">'+JSON.stringify(ld).replace(/</g,'\\u003c')+'</script>'];
const head=['<!doctype html>','<html lang="fr">','<head>','<meta charset="utf-8">','<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'].concat(seo).join('\n');
const body=html.replace(/^<title>[^<]*<\/title>\s*/,'').replace(/<meta name="description"[^>]*>\s*/,'').replace(/<meta name="claude:[^>]*>\s*/,'');
/* polices, style : restent dans l’en-tête */
/* Pages : si tools-pages.sh enveloppe encore landing.html, les balises SEO y sont aussi (sinon le fragment reste celui de l’artifact) */
fs.writeFileSync(path.join(D,'landing.html'),PAGES?seo.filter(l=>!/rel="(icon|apple-touch-icon|manifest)"|application-name|theme-color/.test(l)).join('\n')+'\n'+body:html);
const m=body.match(/^([\s\S]*?<\/style>)\s*/);
fs.writeFileSync(path.join(D,'index.html'),head+'\n'+m[1]+'\n</head>\n<body>\n'+body.slice(m[0].length)+'\n</body>\n</html>\n');
fs.writeFileSync(path.join(D,'robots.txt'),'User-agent: *\nAllow: /\nSitemap: '+SITE+'sitemap.xml\n');
fs.writeFileSync(path.join(D,'sitemap.xml'),'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n<url><loc>'+SITE+'</loc><changefreq>weekly</changefreq><priority>1.0</priority></url>\n<url><loc>'+SITE+'demo/</loc><priority>0.8</priority></url>\n<url><loc>'+SITE+'passerelle/</loc><priority>0.6</priority></url>\n'+['cgu','cgv','confidentialite','sous-traitance','mentions-legales'].map(function(k){return '<url><loc>'+SITE+k+'/</loc><priority>0.3</priority></url>\n'}).join('')+'</urlset>\n');
const prev='<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"></head><body>'+html.replace(/(["'(])shots\//g,'$1../shots/')+'</body></html>';
fs.writeFileSync(path.join(D,'preview.html'),prev);
console.log('dist/index.html',(html.length/1024|0)+' Ko');
