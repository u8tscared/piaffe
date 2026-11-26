// Connexion assistée : le navigateur Stabl (côté serveur) ouvre l'ancien logiciel, le gérant voit son écran
// dans la page et s'y connecte lui-même (double authentification comprise). Rien à installer.
// Contrat HTTP : robot/serveur-local.mjs (mêmes routes en production sous /api/v1/migration/robot).
// Les touches tapées partent directement au navigateur distant : elles ne sont ni stockées ni journalisées.

const BASE = () => (globalThis.PIAFFE_ROBOT || '').replace(/\/$/, '');

const STYLE = `
.rd{border:1px solid var(--ligne,#e3e6ee);border-radius:18px;overflow:hidden;background:#0f1626;color:#fff;margin:14px 0}
.rd-barre{display:flex;align-items:center;gap:10px;padding:10px 14px;background:#151e33;font:500 14px/1.3 Inter,system-ui,sans-serif}
.rd-point{width:9px;height:9px;border-radius:50%;background:#f5b638;box-shadow:0 0 0 4px #f5b63833;flex:none}
.rd[data-phase=copie] .rd-point{background:#3ccf8e;box-shadow:0 0 0 4px #3ccf8e33;animation:rdp 1.2s infinite}
.rd[data-phase=termine] .rd-point{background:#3ccf8e}
.rd[data-phase=erreur] .rd-point{background:#ff5d5d}
@keyframes rdp{50%{box-shadow:0 0 0 8px #3ccf8e00}}
.rd-titre{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rd-btn{border:0;border-radius:999px;padding:7px 14px;font:600 13px Inter,system-ui,sans-serif;cursor:pointer;background:#ffffff1a;color:#fff}
.rd-btn.principal{background:#fff;color:#0f1626}
.rd-ecran{position:relative;aspect-ratio:1280/800;background:#0b101c;outline:none;cursor:pointer}
.rd-ecran img{display:block;width:100%;height:100%;object-fit:contain;user-select:none;-webkit-user-drag:none}
.rd-attente{position:absolute;inset:0;display:grid;place-items:center;font:500 15px Inter,system-ui,sans-serif;color:#c8d0e4}
.rd-voile{position:absolute;inset:0;display:none;place-items:center;background:#0f1626d9;text-align:center;padding:24px;font:500 15px/1.5 Inter,system-ui,sans-serif}
.rd[data-phase=copie] .rd-voile,.rd[data-phase=termine] .rd-voile,.rd[data-phase=erreur] .rd-voile{display:grid}
.rd-voile b{display:block;font:800 22px/1.2 'Bricolage Grotesque',Inter,sans-serif;margin-bottom:6px}
.rd-jauge{height:6px;border-radius:9px;background:#ffffff22;overflow:hidden;width:min(360px,80%);margin:14px auto 0}
.rd-jauge i{display:block;height:100%;width:8%;background:#3ccf8e;transition:width .4s}
.rd-aide{padding:10px 14px;font:400 13px/1.45 Inter,system-ui,sans-serif;color:#aab4cc;background:#151e33}
.rd-saisie{position:absolute;opacity:0;pointer-events:none;width:1px;height:1px}
`;

function el(tag, attrs = {}, ...enfants) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) k === 'class' ? n.className = v : n.setAttribute(k, v);
  for (const e of enfants) n.append(e);
  return n;
}

async function appel(chemin, options = {}) {
  const r = await fetch(BASE() + '/api/v1/migration/robot' + chemin, {
    credentials: 'include', headers: { 'content-type': 'application/json', 'x-requested-with': 'piaffe' }, ...options,
  });
  const corps = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(corps?.error?.message || `Le robot ne répond pas (${r.status}).`);
  return corps;
}

const TOUCHES = new Set(['Enter', 'Tab', 'Backspace', 'Delete', 'Escape', 'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End']);

/**
 * ouvrir(adresse, { cible, nom, surCapture }) : affiche l'écran distant dans `cible` (par défaut #robot-distant).
 * surCapture(file) reçoit la capture (fichier piaffe-capture JSON) ; par défaut, on émet l'événement
 * « piaffe:capture » sur window avec { detail: { fichier } }.
 */
export async function ouvrir(adresse, { cible, nom = 'votre logiciel', surCapture } = {}) {
  const zone = cible || document.getElementById('robot-distant');
  if (!zone) throw new Error('Zone #robot-distant absente.');
  if (!document.getElementById('rd-style')) document.head.append(el('style', { id: 'rd-style' }, STYLE));
  zone.hidden = false; zone.replaceChildren();
  if (!BASE()) {
    zone.append(el('div', { class: 'rd' }, el('div', { class: 'rd-aide' },
      'La connexion assistée arrive bientôt. En attendant, déposez un export de ' + nom + ' ci-dessous.')));
    return null;
  }

  const titre = el('span', { class: 'rd-titre' }, 'Ouverture de ' + nom + '…');
  const btnFini = el('button', { class: 'rd-btn principal', type: 'button' }, 'Je suis connecté');
  const btnStop = el('button', { class: 'rd-btn', type: 'button' }, 'Annuler');
  const img = el('img', { alt: 'Écran de ' + nom + ' ouvert par Stabl' });
  const attente = el('div', { class: 'rd-attente' }, 'Le navigateur Stabl ouvre ' + adresse + '…');
  const voileTitre = el('b', {}, 'Copie en cours');
  const voileTexte = el('span', {}, 'Le robot parcourt ' + nom + ' en lecture seule. Vous pouvez fermer cet onglet, il continue.');
  const jauge = el('i');
  const voile = el('div', { class: 'rd-voile' }, el('div', {}, voileTitre, voileTexte, el('div', { class: 'rd-jauge' }, jauge)));
  const saisie = el('input', { class: 'rd-saisie', type: 'text', autocomplete: 'off', 'aria-label': 'Saisie vers ' + nom });
  const ecran = el('div', { class: 'rd-ecran', tabindex: '0', role: 'application', 'aria-label': 'Écran distant : cliquez puis tapez' }, attente, img, voile, saisie);
  const boite = el('div', { class: 'rd', 'data-phase': 'connexion' },
    el('div', { class: 'rd-barre' }, el('span', { class: 'rd-point' }), titre, btnFini, btnStop),
    ecran,
    el('div', { class: 'rd-aide' }, 'Connectez-vous comme d’habitude, directement dans cet écran. Stabl ne garde ni votre identifiant ni votre mot de passe : dès que vous êtes connecté, la copie démarre toute seule et la session est fermée à la fin.'));
  zone.append(boite);

  let session;
  try { session = await appel('', { method: 'POST', body: JSON.stringify({ adresse }) }); }
  catch (err) { attente.textContent = err.message; boite.dataset.phase = 'erreur'; return null; }
  const { id, largeur = 1280, hauteur = 800 } = session;
  titre.textContent = nom + ' : connectez-vous';

  const envoyer = e => appel('/' + id + '/entree', { method: 'POST', body: JSON.stringify(e) }).catch(() => {});
  const coord = ev => {
    const r = img.getBoundingClientRect();
    // l'image garde le ratio (object-fit: contain) : on retire les bandes éventuelles
    const k = Math.min(r.width / largeur, r.height / hauteur), ox = (r.width - largeur * k) / 2, oy = (r.height - hauteur * k) / 2;
    return { x: Math.round((ev.clientX - r.left - ox) / k), y: Math.round((ev.clientY - r.top - oy) / k) };
  };
  const enConnexion = () => boite.dataset.phase === 'connexion';
  ecran.addEventListener('click', ev => { if (!enConnexion()) return; saisie.focus({ preventScroll: true }); envoyer({ type: 'clic', ...coord(ev) }); });
  ecran.addEventListener('wheel', ev => { if (!enConnexion()) return; ev.preventDefault(); envoyer({ type: 'defiler', dy: Math.round(ev.deltaY) }); }, { passive: false });
  // Le texte passe par un champ caché (claviers mobiles, accents, collage) et part par petits morceaux.
  let tampon = '', minuterie;
  const vider = () => { if (tampon) { envoyer({ type: 'texte', texte: tampon }); tampon = ''; } };
  saisie.addEventListener('input', () => { tampon += saisie.value; saisie.value = ''; clearTimeout(minuterie); minuterie = setTimeout(vider, 60); });
  saisie.addEventListener('keydown', ev => {
    if (!TOUCHES.has(ev.key)) return;
    ev.preventDefault(); clearTimeout(minuterie); vider(); envoyer({ type: 'touche', touche: ev.key });
  });

  let resoudre; const fin = new Promise(r => { resoudre = r; });
  const flux = new EventSource(BASE() + '/api/v1/migration/robot/' + id + '/flux', { withCredentials: true });
  flux.addEventListener('image', ev => { img.src = 'data:image/jpeg;base64,' + JSON.parse(ev.data); attente.remove(); });
  flux.addEventListener('etat', async ev => {
    const e = JSON.parse(ev.data);
    boite.dataset.phase = e.phase;
    if (e.phase === 'copie') {
      titre.textContent = 'Connecté : copie de ' + nom; btnFini.hidden = true; saisie.blur();
      const vus = (e.lignes ? e.lignes + ' lignes copiées' : '') + (e.fiches ? (e.lignes ? ', ' : '') + e.fiches + ' fiches' : '');
      voileTexte.textContent = (e.progression || 'Le robot parcourt ' + nom + ' en lecture seule.') + (vus ? ' · ' + vus + '.' : '');
      if (e.pages) jauge.style.width = Math.min(95, 8 + e.pages * 3) + '%';
    }
    if (e.phase === 'termine') {
      flux.close(); jauge.style.width = '100%'; titre.textContent = 'Copie terminée'; btnStop.hidden = true;
      voileTitre.textContent = 'Tout est copié'; voileTexte.textContent = 'Le navigateur Stabl est fermé. Vérifiez le résultat juste en dessous.';
      try {
        const capture = await appel('/' + id + '/capture');
        const fichier = new File([JSON.stringify(capture)], 'capture-' + (capture.logiciel || 'logiciel') + '.json', { type: 'application/json' });
        // En production, le robot a déjà ouvert l'import en simulation (job_id) : la page le confirme au lieu d'en refaire un.
        const job = e.job_id ? { job_id: e.job_id, confirmer: e.confirmer || null, controle: e.controle || null } : null;
        if (surCapture) surCapture(fichier, job); else window.dispatchEvent(new CustomEvent('piaffe:capture', { detail: { fichier, job } }));
        resoudre(capture);
      } catch (err) { voileTexte.textContent = err.message; resoudre(null); }
    }
    if (e.phase === 'erreur') {
      flux.close(); titre.textContent = 'Le robot s’est arrêté';
      voileTitre.textContent = 'Copie interrompue';
      voileTexte.textContent = (e.message || 'Erreur inconnue') + ' L’équipe Stabl est prévenue. Vous pouvez réessayer ou déposer un export.';
      resoudre(null);
    }
  });
  flux.onerror = () => { if (boite.dataset.phase === 'connexion') titre.textContent = nom + ' : reconnexion…'; };

  btnFini.onclick = () => appel('/' + id + '/demarrer', { method: 'POST' }).catch(() => {});
  btnStop.onclick = () => { flux.close(); appel('/' + id, { method: 'DELETE' }).catch(() => {}); zone.replaceChildren(); zone.hidden = true; resoudre(null); };
  setTimeout(() => saisie.focus({ preventScroll: true }), 300);
  return fin;
}

globalThis.PiaffeRobot = { ouvrir, disponible: () => !!BASE() };
