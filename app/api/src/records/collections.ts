/**
 * Liste blanche des collections du magasin générique (records), reprise du modèle de la démo (demo/core/data.js
 * et demo/modules/*.js, objet window.DATA). Une collection « tableau » contient des objets portant un id ;
 * une collection « singleton » est un objet unique, stocké sous l'id « _ ».
 *
 * Exclues volontairement : me (déduit de la session), months, revenue, costs, occupancy, rapCohorts, rapSched,
 * rapLeave, rapFill (statistiques calculées), weather (source externe), templates et nights (listes de textes),
 * apiKeys (les vraies clés sont dans la table api_keys, routes /api/api-keys).
 */
export const ARRAY_COLLS = [
  // data.js
  "staff", "coaches", "horses", "forfaits", "members", "halfboard", "halfboardOffers", "lessons", "invoices", "bank",
  "competitions", "entries", "vans", "carpool", "care", "journal", "tasks", "stock", "equipment", "cameras", "sensors",
  "contracts", "threads", "notifs", "declarations", "trackBookings",
  // modules de la démo
  "adhFamily", "adhInvoices", "adhNews", "adhOffers", "adhResults", "adhReviews", "adhStages", "aiAutomations", "aiLog",
  "alertRules", "boxGuests", "boxRequests", "boxWait", "camEvents", "camps", "cards", "cheques", "clubEvents",
  "coachBookings", "coachLapsed", "coachNotes", "coachLessons", "coachReviews", "coachStables", "coachStudents",
  "comCamps", "comPins", "comPolls", "comThreads", "comTpl", "connectors", "creditNotes",
  "empCare", "empConsignes", "empDocs", "empHugo", "empIncidents", "empLeaves", "empNights", "empPresence", "empRegister",
  "empShifts", "empTasks", "empThreads", "entriesMore", "giftcards", "importLots", "journalMore", "leaves",
  "mcpCalls", "mcpClients", "mcpTools", "pensionExtras", "pensionPlans", "pfRights", "pfTarifs", "pfTut", "pharmacy",
  "planExtras", "planHolidays", "planStages", "planVacations", "practitioners", "quotes", "receipts", "recurring",
  "register", "reviews", "sales", "schedules", "shopItems", "signups", "tours", "walkins", "webhookLog", "webhooks",
  // module Terrain (45-terrain.js) : prés, vente de chevaux, cours en direct
  "pastures", "pastureMoves", "pastureRules", "horseCues", "horseAds", "horseLeads", "horseTrials", "lessonCalls", "lessonCredits",
  // module Croissance (55-croissance.js) : aides, avis, parrainage, sondages, réglages par écran (un objet par écran)
  "aids", "gReviews", "referrals", "surveys", "growthCfg",
] as const;

export const SINGLETON_COLLS = [
  "club", "facts", "coachDeals", "coachRules", "shifts", "empNotes", "hr", "bankSuggest", "breeding", "homeShow", "pfAge",
] as const;

export const SINGLETON_ID = "_";
const ARR = new Set<string>(ARRAY_COLLS);
const SGL = new Set<string>(SINGLETON_COLLS);
export const isColl = (c: unknown): c is string => typeof c === "string" && (ARR.has(c) || SGL.has(c));
export const isSingleton = (c: string) => SGL.has(c);

/** Identifiants sûrs : lettres, chiffres, _ . : - ; 64 caractères au plus. */
export const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_.:-]{0,63}$/;
export const MAX_OBJECT_BYTES = 64 * 1024;
export const MAX_OPS = 200;
