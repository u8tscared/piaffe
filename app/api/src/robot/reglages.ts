/*
 * Réglages du robot de migration hébergé (lot F). Tout ce qui dépend d'un choix de Marceau est ici.
 */
export const LARGEUR = 1280;
export const HAUTEUR = 800;

/** Délais en millisecondes. Les tests les raccourcissent avec setRobotTiming(). */
export interface Delais {
  /** Inactivité avant fermeture de la session (aucun appel du gérant et aucun progrès du robot). */
  inactivite: number;
  /** Période de l'alarme du Durable Object (garde la session en vie, vérifie l'inactivité). */
  alarme: number;
  /** Intervalle entre deux contrôles « le gérant est-il connecté ? ». */
  controle: number;
  /** Captures périodiques (quand le screencast n'est pas disponible) pendant la connexion, puis pendant la copie. */
  imageConnexion: number;
  imageCopie: number;
  /** Commentaire SSE pour garder la connexion ouverte. */
  battement: number;
  /** Délai maximal du premier chargement de la page de l'ancien logiciel. */
  chargement: number;
  /** Attente du code de vérification demandé au gérant (connexion automatique). */
  attenteCode: number;
  /** Durée maximale de la copie (le robot rend ce qu'il a lu à ce moment-là). */
  copie: number;
}
const DEFAUT: Delais = {
  inactivite: 20 * 60_000,
  alarme: 30_000,
  controle: 1_000,
  imageConnexion: 350,
  imageCopie: 900,
  battement: 15_000,
  chargement: 30_000,
  attenteCode: 5 * 60_000,
  copie: 12 * 60_000,
};
export const T: Delais = { ...DEFAUT };
export function setRobotTiming(d: Partial<Delais> | null) { Object.assign(T, DEFAUT, d || {}); }

/** Contrôles positifs consécutifs avant de lancer la copie. */
export const CONTROLES_AVANT_COPIE = 2;
/** Sessions créées au plus par club et par heure (coût de Browser Rendering, abus). */
export const SESSIONS_PAR_HEURE = 6;
/** Durée de vie du navigateur sans commande (Browser Rendering autorise 20 min au plus). */
export const KEEP_ALIVE_MS = 10 * 60_000;
/** Taille maximale d'un texte tapé en une fois. */
export const TEXTE_MAX = 200;
export const TOUCHES = new Set(["Enter", "Tab", "Backspace", "Delete", "Escape", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Home", "End"]);
export const QUALITE_JPEG = 62;
/** Jusqu'où le robot remonte dans le passé pour les listes datées (planning, factures, règlements), en jours. */
export const HISTORIQUE_JOURS = 730;
