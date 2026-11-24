/* =====================================================================
   PIAFFE · Marque
   Un seul endroit pour changer le nom et le logo de toute l'app
   (coque, écran de lancement, menu, assistant, palette, icône de l'onglet).

   Pour poser le nouveau logo :
   - logo dessiné : remplacer `path` (silhouette, viewBox 0 0 100 100) et `eye`
     (détail en strass, peut rester vide) ;
   - ou logo image : mettre dans `src` une URL ou un data:image/svg+xml;base64,…
     (carré, fond transparent) ; `path` est alors ignoré.
   ===================================================================== */
window.BRAND={
  name:'Piaffe',
  tagline:'La gestion de votre écurie, au même endroit',
  src:null,
  path:'M28 86C28 62 37 45 50 35L47 16L62 28C76 33 85 46 88 62L77 68C71 59 63 56 57 58C58 69 63 77 70 86Z',
  eye:'M65 35.500Q65 44 73.500 44Q65 44 65 52.500Q65 44 56.500 44Q65 44 65 35.500Z'
};
