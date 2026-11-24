// « Donnez-nous vos codes » : les identifiants de l'ancien logiciel sont chiffrés DANS le navigateur
// avant tout envoi. Seul le robot de migration côté serveur détient la clé privée ; il efface
// les identifiants dès la migration finie (ou au bout de 7 jours au plus).
//
// Contrat serveur (à construire côté app/, voir docs/CODES.md) :
//   GET  /api/v1/migration/cle-publique  -> { kid, alg: "RSA-OAEP-256", spki: "<base64 DER>" }
//   POST /api/v1/migration/acces          <- { kid, logiciel, adresse, cle_chiffree, iv, donnees }  -> { id, statut }
// Chiffrement hybride : AES-GCM 256 pour les données, clé AES enveloppée par RSA-OAEP (SHA-256, 2048 bits).

const b64 = buf => btoa(String.fromCharCode(...new Uint8Array(buf)));
const deB64 = s => Uint8Array.from(atob(s), c => c.charCodeAt(0));

export async function importerClePublique(spkiB64) {
  return crypto.subtle.importKey('spki', deB64(spkiB64), { name: 'RSA-OAEP', hash: 'SHA-256' }, false, ['wrapKey']);
}

export async function chiffrerAcces(acces, clePublique, kid) {
  const cleAES = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt']);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const clair = new TextEncoder().encode(JSON.stringify({ ...acces, chiffre_le: new Date().toISOString() }));
  const donnees = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, cleAES, clair);
  const enveloppe = await crypto.subtle.wrapKey('raw', cleAES, clePublique, { name: 'RSA-OAEP' });
  return { kid, alg: 'RSA-OAEP-256+A256GCM', cle_chiffree: b64(enveloppe), iv: b64(iv), donnees: b64(donnees) };
}

// Envoi complet. `serveur` vide = fonction pas encore ouverte : on ne fait rien.
export async function envoyerAcces(serveur, { logiciel, adresse, identifiant, motDePasse, doubleAuth, remarque }, { jeton } = {}) {
  if (!serveur) throw Object.assign(new Error('Bientôt disponible'), { code: 'indisponible' });
  const base = serveur.replace(/\/$/, '');
  const h = jeton ? { authorization: 'Bearer ' + jeton } : {};
  const r = await fetch(base + '/api/v1/migration/cle-publique', { headers: h });
  if (!r.ok) throw new Error('Clé publique indisponible (' + r.status + ')');
  const { kid, spki } = await r.json();
  const cle = await importerClePublique(spki);
  const paquet = await chiffrerAcces({ identifiant, mot_de_passe: motDePasse, double_auth: doubleAuth, remarque }, cle, kid);
  const e = await fetch(base + '/api/v1/migration/acces', { method: 'POST', headers: { 'content-type': 'application/json', ...h }, body: JSON.stringify({ logiciel, adresse, ...paquet }) });
  if (!e.ok) throw new Error('Envoi refusé (' + e.status + ')');
  return e.json();
}
