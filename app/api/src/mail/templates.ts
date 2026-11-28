/*
 * Modèles d'e-mails transactionnels. Chaque modèle documente ses données (fields), fournit un exemple
 * (sample, utilisé par la page d'aperçu et les tests) et construit sujet, pré-en-tête et blocs.
 * Les montants s'acceptent en centimes (amount_cents) ou en euros (amount). Les dates en ISO ou JJ/MM/AAAA.
 */
import type { Block, IconName } from "./layout";
import { BRAND } from "./brand";
import { dateLong, dateShort, dayParts, duration, hour, money } from "./fmt";

export type Category = "essential" | "bookings" | "reminders" | "waitlist" | "referrals";
export interface MailCtx {
  club: { id: string; name: string; email?: string | null; phone?: string | null } | null;
  appUrl: string;
}
export interface Built { subject: string; preheader: string; blocks: Block[] }
export interface TemplateDef {
  name: string;
  description: string;
  category: Category;
  /** Le corps contient un lien d'accès : effacé de la file dès l'envoi. */
  sensitive?: boolean;
  fields: Record<string, string>;
  sample: Record<string, unknown>;
  build(d: Record<string, any>, ctx: MailCtx): Built;
}

const hello = (d: Record<string, any>) => (d.first ? `Bonjour ${String(d.first).trim()},` : "Bonjour,");
const clubName = (ctx: MailCtx) => ctx.club?.name || BRAND.name;
const team = (ctx: MailCtx) => (ctx.club ? `l'équipe de ${ctx.club.name}` : `l'équipe ${BRAND.name}`);
const sign = (ctx: MailCtx): Block => ({ t: "p", text: `À bientôt, ${team(ctx)}.` });
const when = (d: Record<string, any>) => [d.date ? dateLong(d.date) : d.day ? String(d.day) : "", d.time ? "à " + hour(d.time) : ""].filter(Boolean).join(" ");
const dayShort = (d: Record<string, any>) => (d.date ? dateLong(d.date, false) : d.day ? String(d.day) : "");
const opt = (rows: [string, unknown][]): [string, string][] => rows.filter(([, v]) => v != null && v !== "").map(([k, v]) => [k, String(v)]);

const ROLE_INVITE: Record<string, { label: string; intro: string; can: string[] }> = {
  member: { label: "adhérent", intro: "vous invite à rejoindre son espace adhérent sur Stabl.", can: ["réserver vos reprises et vos rattrapages", "régler vos factures en ligne en quelques secondes", "suivre vos progrès, vos galops et vos concours"] },
  parent: { label: "parent", intro: "vous invite à suivre l'activité équestre de votre famille sur Stabl.", can: ["réserver les reprises et prévenir d'une absence", "régler les factures de toute la famille au même endroit", "recevoir les informations du club et signer les autorisations en ligne"] },
  owner_horse: { label: "propriétaire", intro: "vous invite à suivre votre cheval sur Stabl.", can: ["voir les soins, le maréchal, les vaccins et le journal de votre cheval", "réserver les installations et les cours particuliers", "régler la pension et les prestations en ligne"] },
  staff: { label: "membre de l'équipe", intro: "vous invite à rejoindre l'équipe sur Stabl.", can: ["consulter le planning et vos tâches du jour", "noter les soins et le journal des chevaux", "échanger avec l'équipe et les cavaliers"] },
  coach: { label: "coach", intro: "vous invite à gérer vos cours sur Stabl.", can: ["voir votre agenda et vos élèves", "faire l'appel et noter la progression de vos cavaliers", "proposer vos créneaux de cours particuliers"] },
  accountant: { label: "comptable", intro: "vous ouvre un accès comptable sur Stabl.", can: ["consulter les factures et les encaissements", "télécharger le FEC et les exports des ventes", "récupérer les factures électroniques en PDF"] },
  provider: { label: "praticien", intro: "vous ouvre l'accès aux chevaux que vous suivez, sur Stabl.", can: ["voir votre tournée et les demandes de visite du club", "consulter le carnet de santé et noter vos actes au carnet du cheval", "préparer vos factures et, pour un vétérinaire, les certificats d'engagement"] },
  manager: { label: "co-gérant", intro: "vous invite à gérer le club avec elle ou lui sur Stabl.", can: ["gérer les adhérents, les chevaux et le planning", "émettre les factures et suivre les encaissements", "configurer le club et inviter l'équipe"] },
};

const ROLE_ICON: Record<string, IconName> = { member: "horse", parent: "users", owner_horse: "horse", staff: "users", coach: "calendar", accountant: "invoice", provider: "horse", manager: "key" };

export const TEMPLATES: Record<string, TemplateDef> = {
  verify_email: {
    name: "Confirmation de l'adresse e-mail",
    description: "Envoyé à l'inscription pour vérifier l'adresse.",
    category: "essential", sensitive: true,
    fields: { first: "Prénom (facultatif)", verify_url: "Lien de confirmation", code: "Code à 6 chiffres (facultatif)", expires_hours: "Validité du lien en heures (24 par défaut)", change: "true s'il s'agit d'un changement d'adresse" },
    sample: { first: "Léa", verify_url: "https://app.stablapp.fr/auth/verify?token=exemple", code: "482913" },
    build: (d) => ({
      subject: d.change ? "Confirmez votre nouvelle adresse e-mail" : "Confirmez votre adresse e-mail",
      preheader: d.code ? `Votre code : ${d.code}. Ou un clic pour activer votre compte ${BRAND.name}.` : `Un clic pour activer votre compte ${BRAND.name}.`,
      blocks: [
        { t: "hero", icon: "mail", badge: d.change ? "Changement d'adresse" : "Dernière étape", title: d.change ? "Confirmez votre nouvelle adresse" : "Confirmez votre adresse e-mail", text: d.change ? "Un clic pour terminer le changement." : "Un clic, et votre compte est prêt." },
        { t: "p", text: d.change
          ? `${hello(d)} vous avez demandé à utiliser cette adresse pour votre compte ${BRAND.name}. Confirmez-la pour terminer le changement.`
          : `${hello(d)} merci d'avoir créé votre compte ${BRAND.name}. Pour le sécuriser, confirmez que cette adresse est bien la vôtre.` },
        { t: "button", label: "Confirmer mon adresse", url: d.verify_url },
        ...(d.code ? [{ t: "p", muted: true, text: "Vous préférez saisir un code ? Le voici :" } as Block, { t: "code", text: String(d.code) } as Block] : []),
        { t: "fallback", url: d.verify_url },
        { t: "p", muted: true, text: `Ce lien est valable ${d.expires_hours || 24} heures. Si vous n'êtes pas à l'origine de cette inscription, ignorez simplement cet e-mail.` },
      ],
    }),
  },

  reset_password: {
    name: "Réinitialisation du mot de passe",
    description: "Lien pour choisir un nouveau mot de passe.",
    category: "essential", sensitive: true,
    fields: { first: "Prénom (facultatif)", reset_url: "Lien de réinitialisation", expires_minutes: "Validité en minutes (60 par défaut)" },
    sample: { first: "Léa", reset_url: "https://app.stablapp.fr/auth/reset?token=exemple", expires_minutes: 60 },
    build: (d) => ({
      subject: "Choisissez un nouveau mot de passe",
      preheader: "Vous avez demandé à réinitialiser votre mot de passe.",
      blocks: [
        { t: "hero", icon: "lock", badge: "Sécurité du compte", title: "Nouveau mot de passe", text: "Choisissez-le en quelques secondes." },
        { t: "p", text: `${hello(d)} vous avez demandé à réinitialiser le mot de passe de votre compte ${BRAND.name}. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.` },
        { t: "button", label: "Choisir un nouveau mot de passe", url: d.reset_url },
        { t: "fallback", url: d.reset_url },
        { t: "note", tone: "warn", text: `Ce lien est valable ${d.expires_minutes || 60} minutes et ne fonctionne qu'une fois. Si vous n'avez rien demandé, ignorez cet e-mail : votre mot de passe actuel reste valable.` },
      ],
    }),
  },

  magic_link: {
    name: "Lien de connexion",
    description: "Connexion sans mot de passe (pratique pour les parents).",
    category: "essential", sensitive: true,
    fields: { first: "Prénom (facultatif)", login_url: "Lien de connexion", expires_minutes: "Validité en minutes (15 par défaut)" },
    sample: { first: "Léa", login_url: "https://app.stablapp.fr/auth/magic/callback?token=exemple", expires_minutes: 15 },
    build: (d, ctx) => ({
      subject: `Votre lien de connexion à ${clubName(ctx)}`,
      preheader: "Connectez-vous en un clic, sans mot de passe.",
      blocks: [
        { t: "hero", icon: "key", badge: "Connexion", title: "Votre lien de connexion", text: "Pas de mot de passe à retenir : un clic suffit." },
        { t: "p", text: `${hello(d)} voici votre lien pour vous connecter${ctx.club ? " à votre espace " + ctx.club.name : ""}.` },
        { t: "button", label: "Me connecter", url: d.login_url },
        { t: "fallback", url: d.login_url },
        { t: "p", muted: true, text: `Ce lien est valable ${d.expires_minutes || 15} minutes et ne fonctionne qu'une fois. Ne le transférez à personne. Si vous n'avez pas demandé à vous connecter, ignorez cet e-mail.` },
      ],
    }),
  },

  invitation: {
    name: "Invitation",
    description: "Invitation à rejoindre le club, avec un texte adapté au rôle.",
    category: "essential", sensitive: true,
    fields: {
      role: "member | parent | owner_horse | staff | coach | accountant | provider | manager (co-gérant)",
      first: "Prénom de l'invité (facultatif)", inviter_name: "Nom de la personne qui invite (facultatif)",
      invitation_url: "Lien d'acceptation", child_first: "Prénom de l'enfant (rôle parent, facultatif)", horse_name: "Cheval suivi (rôle propriétaire, facultatif)", expires_days: "Validité en jours (14 par défaut)",
    },
    sample: { role: "member", first: "Léa", inviter_name: "Claire", invitation_url: "https://app.stablapp.fr/invitation/exemple" },
    build: (d, ctx) => {
      const role = d.role === "owner" ? "manager" : d.role;
      const r = ROLE_INVITE[role] || ROLE_INVITE.member;
      const who = d.inviter_name ? `${d.inviter_name} (${clubName(ctx)})` : clubName(ctx);
      const rider = ["member", "parent", "owner_horse"].includes(role) || !ROLE_INVITE[role];
      const subtitle = role === "parent" && d.child_first ? `Suivez ${d.child_first} et toute la famille depuis un seul compte.`
        : role === "owner_horse" && d.horse_name ? `${d.horse_name} a désormais son carnet en ligne.`
        : `Votre accès ${r.label} vous attend.`;
      return {
        subject: `${clubName(ctx)} vous invite sur ${BRAND.name}`,
        preheader: `Votre accès ${r.label} vous attend. Deux minutes suffisent pour l'activer.`,
        blocks: [
          { t: "hero", icon: ROLE_ICON[role] || "horse", badge: `Invitation · ${r.label}`, title: `Bienvenue chez ${clubName(ctx)}`, text: subtitle },
          { t: "p", text: `${hello(d)} ${who} ${r.intro}` },
          ...(role === "parent" && d.child_first ? [{ t: "p", text: `Vous pourrez suivre ${d.child_first} et toute la famille depuis un seul compte.` } as Block] : []),
          { t: "p", text: "Avec votre accès, vous pourrez :" },
          { t: "checks", items: r.can },
          { t: "button", label: "Accepter l'invitation", url: d.invitation_url },
          { t: "fallback", url: d.invitation_url },
          ...(rider ? [{ t: "h", text: "En deux minutes" } as Block, { t: "steps", items: [
            { title: "Acceptez l'invitation", text: "Le bouton ci-dessus ouvre votre espace." },
            { title: "Choisissez comment vous connecter", text: "Avec votre compte Google, ou un mot de passe." },
            { title: role === "parent" ? "Vérifiez la fiche de la famille" : "Vérifiez votre fiche", text: "Coordonnées, contact d'urgence et autorisations : le club a peut-être déjà tout rempli." },
          ] } as Block] : []),
          { t: "p", muted: true, text: `Cette invitation est valable ${d.expires_days || 14} jours. ${rider ? "Vous pouvez aussi installer l'application sur votre téléphone depuis votre espace." : "Vous pourrez vous connecter avec votre compte Google ou créer un mot de passe."}` },
        ],
      };
    },
  },

  welcome_member: {
    name: "Bienvenue au nouvel adhérent",
    description: "Accueil d'un nouvel adhérent ajouté par le club, avec le lien d'activation de son espace.",
    category: "essential", sensitive: true,
    fields: { first: "Prénom", activation_url: "Lien d'activation de l'espace adhérent (ou action_url)", minor: "true si l'adhérent est mineur (e-mail au parent)", member_first: "Prénom de l'adhérent (si mineur)", forfait: "Nom du forfait (facultatif)", horse_name: "Cheval suivi (propriétaire, facultatif)", first_lesson: "Première reprise, texte libre (facultatif)" },
    sample: { first: "Léa", activation_url: "https://app.stablapp.fr/invitation/exemple", forfait: "Forfait annuel 1 h / semaine", first_lesson: "mercredi 18 novembre à 17 h, Galop 3-4" },
    build: (d, ctx) => ({
      subject: d.first ? `Bienvenue chez ${clubName(ctx)}, ${d.first}` : `Bienvenue chez ${clubName(ctx)}`,
      preheader: "Votre espace adhérent est prêt : réservez, payez et suivez tout depuis votre téléphone.",
      blocks: [
        { t: "hero", icon: "horse", badge: d.child_first ? "Nouvelle famille" : "Nouvel adhérent", title: `Bienvenue chez ${clubName(ctx)}`,
          text: d.child_first ? `L'espace famille de ${d.child_first} est prêt.` : d.first ? `${String(d.first).trim()}, votre espace adhérent est prêt.` : "Votre espace adhérent est prêt." },
        { t: "p", text: d.child_first
          ? `${hello(d)} nous sommes ravis d'accueillir ${d.child_first} parmi nos cavaliers. Votre espace famille est prêt : il vous suffit de l'activer pour suivre ses cours et ses factures.`
          : `${hello(d)} nous sommes ravis de vous compter parmi nos cavaliers. Votre espace adhérent est prêt : il vous suffit de l'activer pour en profiter.` },
        ...(d.forfait || d.first_lesson || d.horse_name ? [{ t: "card", kicker: "Votre inscription", title: String(d.forfait || "Inscription enregistrée"), status: { text: "Prêt", tone: "ok" },
          rows: opt([["Première reprise", d.first_lesson], ["Cheval", d.horse_name]]) } as Block] : []),
        { t: "button", label: "Activer mon espace", url: d.activation_url },
        { t: "p", text: "Dans l'application, vous pouvez :" },
        { t: "checks", items: [
          "**réserver** vos reprises, vos rattrapages et les cours particuliers",
          "**payer** vos factures en ligne, par carte ou par prélèvement",
          d.horse_name ? `**suivre ${d.horse_name}** : soins, maréchal, vaccins et journal de travail` : "**suivre votre cheval** et votre progression, du galop aux concours",
          "**signer** vos documents et recevoir les informations du club",
        ] },
        { t: "fallback", url: d.activation_url },
        { t: "p", text: `Une question ? Répondez simplement à cet e-mail, l'équipe vous répondra.` },
        sign(ctx),
      ],
    }),
  },

  welcome_owner: {
    name: "Bienvenue au gérant",
    description: "Après la création du club : prochaines étapes de la mise en route.",
    category: "essential",
    fields: { first: "Prénom du gérant", club_name: "Nom du club", dashboard_url: "Lien vers le tableau de bord", trial_ends_at: "Fin de l'essai (facultatif)", import_url: "Lien vers l'import de données (facultatif)", invite_url: "Lien vers l'invitation des adhérents (facultatif)", payments_url: "Lien vers l'activation du paiement en ligne (facultatif)" },
    sample: { first: "Claire", club_name: "Écurie des Tilleuls", dashboard_url: "https://app.stablapp.fr/", trial_ends_at: "2026-12-24", import_url: "https://app.stablapp.fr/reglages/import" },
    build: (d) => ({
      subject: `${d.club_name || "Votre club"} est prêt sur ${BRAND.name}`,
      preheader: "Trois étapes pour démarrer sereinement : vos données, vos adhérents, le paiement en ligne.",
      blocks: [
        { t: "hero", icon: "sparkles", badge: "Votre club est créé", title: `Bienvenue sur ${BRAND.name}`, text: `L'espace de **${d.club_name || "votre club"}** est prêt. Trois étapes, et vous êtes en selle.` },
        { t: "p", text: `${hello(d)} merci de nous faire confiance. Voici, dans l'ordre, les étapes qui vous feront gagner le plus de temps :` },
        { t: "steps", items: [
          { title: "Importez vos données", text: "Depuis votre ancien logiciel ou un fichier Excel : adhérents, chevaux, forfaits et historique. Vous vérifiez avant de valider." },
          { title: "Invitez vos adhérents", text: "Chacun reçoit son lien personnel et réserve, paie et suit son cheval depuis son téléphone." },
          { title: "Activez le paiement en ligne", text: "Carte bancaire et prélèvement SEPA : les factures se règlent sans relance, l'argent arrive sur votre compte." },
        ] },
        ...(d.import_url
          ? [{ t: "button", label: "Importer mes données", url: d.import_url } as Block, { t: "button", variant: "secondary", label: "Ouvrir mon tableau de bord", url: d.dashboard_url } as Block]
          : [{ t: "button", label: "Ouvrir mon tableau de bord", url: d.dashboard_url } as Block]),
        ...(d.trial_ends_at ? [{ t: "note", text: `Votre essai gratuit court jusqu'au **${dateLong(d.trial_ends_at)}**. Aucun moyen de paiement n'est demandé d'ici là.` } as Block] : []),
        { t: "p", text: "Ensuite, invitez votre équipe et votre comptable, chacun avec le bon niveau d'accès. Besoin d'un coup de main pour démarrer ? Répondez à cet e-mail : nous vous aidons personnellement." },
        { t: "p", text: `À très vite, l'équipe ${BRAND.name}.` },
      ],
    }),
  },

  invoice_issued: {
    name: "Nouvelle facture",
    description: "Facture émise, avec lien de paiement en ligne et PDF en pièce jointe.",
    category: "essential",
    fields: { first: "Prénom", number: "Numéro de facture", amount_cents: "Montant TTC en centimes (ou amount en euros)", due_date: "Date d'échéance", label: "Objet (facultatif)", pay_url: "Lien de paiement en ligne (facultatif)", invoice_url: "Lien vers la facture (facultatif)", sepa: "true si l'échéance sera prélevée automatiquement" },
    sample: { first: "Léa", number: "F-2026-1173", amount_cents: 52000, due_date: "2026-12-05", label: "Pension complète décembre, Ulysse de la Roche", pay_url: "https://app.stablapp.fr/payer/exemple" },
    build: (d, ctx) => ({
      subject: `Facture ${d.number} de ${clubName(ctx)} : ${money(d)}`,
      preheader: d.sepa ? `${money(d)}, prélevés automatiquement à l'échéance.` : `${money(d)} à régler avant le ${dateShort(d.due_date)}.`,
      blocks: [
        { t: "hero", icon: "invoice", badge: `Facture ${d.number}`, title: "Votre facture est disponible",
          text: d.sepa ? `${money(d)}, prélevés automatiquement à l'échéance.` : d.due_date ? `${money(d)} à régler avant le ${dateLong(d.due_date, false)}.` : `${money(d)} à régler.` },
        { t: "p", text: `${hello(d)} voici votre facture${d.label ? " pour « " + d.label + " »" : ""}. Vous la trouverez en pièce jointe au format PDF.` },
        { t: "card", kicker: `Facture ${d.number}`, title: String(d.label || clubName(ctx)), amount: money(d),
          status: d.sepa ? { text: "Prélèvement prévu", tone: "info" } : { text: "À régler", tone: "warn" },
          rows: opt([["À régler avant le", d.due_date ? dateLong(d.due_date) : ""], ["Émise par", clubName(ctx)]]) },
        ...(d.sepa
          ? [{ t: "note", tone: "ok", text: "Rien à faire : ce montant sera prélevé automatiquement sur votre compte à l'échéance." } as Block]
          : d.pay_url ? [{ t: "button", label: `Payer ${money(d)} en ligne`, url: d.pay_url } as Block, { t: "p", muted: true, text: "Paiement sécurisé par carte bancaire ou prélèvement SEPA." } as Block] : []),
        ...(d.invoice_url ? [{ t: "button", variant: "secondary", label: "Voir mes factures", url: d.invoice_url } as Block] : []),
        { t: "p", text: "Merci pour votre confiance." },
        sign(ctx),
      ],
    }),
  },

  payment_receipt: {
    name: "Reçu de paiement",
    description: "Confirmation d'un paiement reçu.",
    category: "essential",
    fields: { first: "Prénom", amount_cents: "Montant payé en centimes", paid_at: "Date du paiement", method: "Moyen de paiement", number: "Facture concernée (facultatif)", balance_cents: "Reste à payer en centimes (facultatif)", invoice_url: "Lien vers la facture (facultatif)" },
    sample: { first: "Léa", amount_cents: 52000, paid_at: "2026-11-24", method: "Carte bancaire", number: "F-2026-1173", balance_cents: 0 },
    build: (d, ctx) => ({
      subject: `Paiement reçu : ${money(d)}, merci`,
      preheader: `Nous avons bien reçu votre paiement de ${money(d)}.`,
      blocks: [
        { t: "hero", icon: "check", badge: "Reçu de paiement", title: "Merci, paiement reçu", text: `Nous avons bien reçu ${money(d)}${d.paid_at ? " le " + dateLong(d.paid_at, false) : ""}.` },
        { t: "p", text: `${hello(d)} votre paiement est bien arrivé. Ce message vous sert de reçu.` },
        { t: "card", kicker: d.number ? `Facture ${d.number}` : "Paiement", title: String(d.method || "Paiement reçu"), amount: money(d), status: { text: "Payé", tone: "ok" },
          rows: opt([["Date", d.paid_at ? dateLong(d.paid_at) : ""], ["Facture", d.number], ["Reste à payer", d.balance_cents != null ? money(d, "balance") : ""]]) },
        ...(d.balance_cents === 0 ? [{ t: "note", tone: "ok", text: "Votre compte est à jour." } as Block] : []),
        ...(d.invoice_url ? [{ t: "button", variant: "secondary", label: "Voir la facture", url: d.invoice_url } as Block] : []),
        sign(ctx),
      ],
    }),
  },

  payment_reminder: {
    name: "Relance de paiement",
    description: "Relance d'une facture impayée, en trois niveaux de ton (1 : courtois, 2 : ferme, 3 : dernière relance).",
    category: "essential",
    fields: { level: "1, 2 ou 3", first: "Prénom", number: "Numéro de facture", amount_cents: "Reste à payer en centimes", due_date: "Échéance dépassée", days_late: "Jours de retard", pay_url: "Lien de paiement" },
    sample: { level: 1, first: "Léa", number: "F-2026-1173", amount_cents: 41000, due_date: "2026-11-15", days_late: 9, pay_url: "https://app.stablapp.fr/payer/exemple" },
    build: (d, ctx) => {
      const lvl = Math.min(3, Math.max(1, Number(d.level) || 1));
      const subject = lvl === 1 ? `Petit rappel : facture ${d.number}` : lvl === 2 ? `Facture ${d.number} en attente de règlement` : `Dernière relance : facture ${d.number}`;
      const intro = lvl === 1
        ? `${hello(d)} sauf erreur de notre part, la facture ci-dessous n'est pas encore réglée. C'est peut-être un simple oubli : vous pouvez la payer en ligne en quelques secondes.`
        : lvl === 2
        ? `${hello(d)} malgré notre premier rappel, la facture ci-dessous reste impayée${d.days_late ? " depuis " + d.days_late + " jours" : ""}. Merci de procéder à son règlement dès que possible.`
        : `${hello(d)} la facture ci-dessous est toujours impayée malgré nos relances. Sans règlement de votre part sous 8 jours, nous serons contraints de suspendre les réservations liées à votre compte.`;
      return {
        subject,
        preheader: `${money(d)} restent à régler.`,
        blocks: [
          { t: "hero", icon: "bell", badge: "Rappel de paiement", title: lvl === 3 ? "Dernière relance avant suspension" : lvl === 2 ? "Votre facture reste à régler" : "Un petit rappel" },
          { t: "p", text: intro },
          { t: "rows", rows: opt([["Facture", d.number], ["Reste à payer", money(d)], ["Échéance", d.due_date ? dateLong(d.due_date) : ""]]) },
          { t: "button", label: `Régler ${money(d)}`, url: d.pay_url },
          { t: "p", muted: true, text: lvl === 1 ? "Si vous avez déjà payé, merci de ne pas tenir compte de ce message." : "Si vous rencontrez une difficulté, répondez à cet e-mail : nous trouverons ensemble une solution." },
          sign(ctx),
        ],
      };
    },
  },

  payment_failed: {
    name: "Échec de paiement",
    description: "Un prélèvement ou un paiement par carte a échoué.",
    category: "essential",
    fields: { first: "Prénom", amount_cents: "Montant en centimes", reason: "Motif lisible (facultatif)", number: "Facture (facultatif)", method: "Moyen de paiement (facultatif)", retry_url: "Lien pour régler ou mettre à jour le moyen de paiement" },
    sample: { first: "Léa", amount_cents: 52000, reason: "provision insuffisante", number: "F-2026-1173", method: "Prélèvement SEPA", retry_url: "https://app.stablapp.fr/payer/exemple" },
    build: (d, ctx) => ({
      subject: `Votre paiement de ${money(d)} n'a pas abouti`,
      preheader: "Quelques secondes suffisent pour régulariser.",
      blocks: [
        { t: "hero", icon: "bell", badge: "Paiement", title: "Votre paiement n'a pas abouti" },
        { t: "p", text: `${hello(d)} votre paiement${d.method ? " par " + String(d.method).toLowerCase() : ""} de **${money(d)}**${d.number ? " pour la facture " + d.number : ""} a été refusé${d.reason ? " (" + d.reason + ")" : ""}. Aucun montant n'a été débité.` },
        { t: "p", text: "Vous pouvez régler maintenant ou mettre à jour votre moyen de paiement :" },
        { t: "button", label: "Régulariser mon paiement", url: d.retry_url },
        { t: "p", muted: true, text: "Si vous pensez qu'il s'agit d'une erreur, votre banque pourra vous en dire plus. Vous pouvez aussi répondre à cet e-mail." },
        sign(ctx),
      ],
    }),
  },

  booking_confirmed: {
    name: "Réservation confirmée",
    description: "Confirmation d'une réservation de reprise, de cours particulier ou de piste.",
    category: "bookings",
    fields: { first: "Prénom", title: "Intitulé", date: "Date", time: "Heure HH:MM", dur: "Durée en minutes", coach: "Moniteur ou coach", arena: "Lieu", horse: "Cheval (facultatif)", manage_url: "Lien pour gérer la réservation", ics_url: "Lien .ics pour l'ajouter à l'agenda (facultatif)", cancel_hours: "Délai d'annulation en heures (facultatif)" },
    sample: { first: "Léa", title: "Galop 3-4", date: "2026-11-25", time: "17:00", dur: 60, coach: "Hugo Lefèvre", arena: "Grand manège", horse: "Quiétude", manage_url: "https://app.stablapp.fr/reservations", cancel_hours: 24 },
    build: (d, ctx) => {
      const tile = dayParts(d.date);
      const info = [tile ? "" : dayShort(d), d.time ? hour(d.time) : "", d.dur ? duration(d.dur) : "", d.arena ? String(d.arena) : ""].filter(Boolean).join(" · ");
      return {
        subject: `C'est réservé : ${d.title}, ${dayShort(d)}${d.time ? " à " + hour(d.time) : ""}`,
        preheader: `Votre place est confirmée${d.horse ? ", avec " + d.horse : ""}.`,
        blocks: [
          { t: "hero", icon: "calendar", badge: "Réservation confirmée", title: "Votre place est réservée", text: `${when(d) ? "Rendez-vous " + when(d) + "." : "C'est confirmé, nous vous attendons."}` },
          { t: "p", text: `${hello(d)} c'est confirmé, nous vous attendons. Voici le récapitulatif :` },
          { t: "card", date: tile, kicker: "Réservation", title: String(d.title || "Réservation"), text: info || undefined, status: { text: "Confirmé", tone: "ok" },
            rows: opt([["Avec", d.coach], ["Cheval", d.horse]]) },
          ...(d.ics_url ? [{ t: "button", label: "Ajouter à mon agenda", url: d.ics_url } as Block] : []),
          ...(d.manage_url ? [{ t: "button", variant: d.ics_url ? "secondary" : "primary", label: "Gérer ma réservation", url: d.manage_url } as Block,
            { t: "p", muted: true, text: `Un empêchement ? ${d.cancel_hours ? "Annulez au moins " + d.cancel_hours + " heures avant depuis votre espace pour libérer la place." : "Prévenez-nous depuis votre espace pour libérer la place."}` } as Block] : []),
          sign(ctx),
        ],
      };
    },
  },

  booking_cancelled: {
    name: "Reprise ou réservation annulée",
    description: "Annulation par le club (météo, absence du moniteur…) ou par le cavalier, avec rattrapage éventuel.",
    category: "essential",
    fields: { first: "Prénom", title: "Intitulé", date: "Date", time: "Heure", reason: "Motif (facultatif)", credit: "true si un rattrapage est crédité", credit_days: "Validité du rattrapage en jours", book_url: "Lien pour réserver un rattrapage", by_member: "true si c'est le cavalier qui a annulé" },
    sample: { first: "Léa", title: "Galop 3-4", date: "2026-11-25", time: "17:00", reason: "Tempête annoncée", credit: true, credit_days: 60, book_url: "https://app.stablapp.fr/reservations" },
    build: (d, ctx) => ({
      subject: d.by_member ? `Annulation enregistrée : ${d.title}, ${dayShort(d)}` : `Annulé : ${d.title}, ${dayShort(d)}${d.time ? " à " + hour(d.time) : ""}`,
      preheader: d.credit ? "Un rattrapage vous est crédité." : "Nous vous prévenons dès que possible.",
      blocks: [
        { t: "hero", icon: "calendar", badge: "Planning", title: d.by_member ? "Votre annulation est enregistrée" : "Ce cours est annulé" },
        { t: "p", text: d.by_member
          ? `${hello(d)} nous avons bien pris en compte l'annulation de votre réservation. Merci d'avoir prévenu, votre place pourra profiter à un autre cavalier.`
          : `${hello(d)} nous sommes désolés : le cours ci-dessous ne pourra pas avoir lieu${d.reason ? " (" + String(d.reason).toLowerCase() + ")" : ""}.` },
        { t: "rows", rows: opt([["Cours", d.title], ["Prévu", when(d)]]) },
        ...(d.credit ? [{ t: "note", tone: "ok", text: `Un rattrapage vous est crédité${d.credit_days ? ", valable " + d.credit_days + " jours" : ""}.` } as Block] : []),
        ...(d.book_url ? [{ t: "button", label: d.credit ? "Réserver mon rattrapage" : "Voir les autres créneaux", url: d.book_url } as Block] : []),
        sign(ctx),
      ],
    }),
  },

  waitlist_spot: {
    name: "Place libérée (liste d'attente)",
    description: "Une place s'est libérée dans un cours où le cavalier était en liste d'attente.",
    category: "waitlist",
    fields: { first: "Prénom", title: "Intitulé", date: "Date", time: "Heure", claim_url: "Lien pour prendre la place", expires_hours: "Délai pour confirmer en heures (12 par défaut)" },
    sample: { first: "Léa", title: "Galop 5-6", date: "2026-11-26", time: "18:00", claim_url: "https://app.stablapp.fr/reservations/exemple", expires_hours: 12 },
    build: (d, ctx) => ({
      subject: `Une place s'est libérée : ${d.title}, ${dayShort(d)}`,
      preheader: "Premier arrivé, premier servi.",
      blocks: [
        { t: "hero", icon: "sparkles", badge: "Liste d'attente", title: "Une place vient de se libérer" },
        { t: "p", text: `${hello(d)} bonne nouvelle : une place est disponible dans le cours pour lequel vous étiez en liste d'attente.` },
        { t: "rows", rows: opt([["Cours", d.title], ["Quand", when(d)]]) },
        { t: "button", label: "Je prends la place", url: d.claim_url },
        { t: "p", muted: true, text: `La place est proposée aux cavaliers de la liste d'attente pendant ${d.expires_hours || 12} heures : le premier qui confirme l'obtient.` },
        sign(ctx),
      ],
    }),
  },

  lesson_reminder: {
    name: "Rappel de reprise (la veille)",
    description: "Rappel envoyé la veille d'une reprise ou d'un cours particulier.",
    category: "reminders",
    fields: { first: "Prénom", title: "Intitulé", date: "Date", time: "Heure", dur: "Durée en minutes", coach: "Moniteur", arena: "Lieu", horse: "Cheval attribué (facultatif)", cancel_url: "Lien pour prévenir d'une absence", cancel_hours: "Délai d'annulation en heures" },
    sample: { first: "Léa", title: "Galop 3-4", date: "2026-11-25", time: "17:00", dur: 60, coach: "Hugo Lefèvre", arena: "Grand manège", horse: "Quiétude", cancel_url: "https://app.stablapp.fr/reservations" },
    build: (d, ctx) => ({
      subject: `Demain ${hour(d.time)} : ${d.title}`,
      preheader: d.horse ? `Vous montez ${d.horse}.` : "On vous attend demain.",
      blocks: [
        { t: "hero", icon: "bell", badge: "Rappel", title: "À demain en selle" },
        { t: "p", text: `${hello(d)} petit rappel pour votre cours de demain.` },
        { t: "rows", rows: opt([["Cours", d.title], ["Quand", when(d)], ["Durée", duration(d.dur)], ["Avec", d.coach], ["Où", d.arena], ["Votre cheval", d.horse]]) },
        { t: "p", text: "Pensez à arriver 15 minutes avant pour préparer votre cheval." },
        ...(d.cancel_url ? [{ t: "p", muted: true, text: `Un empêchement ? Prévenez-nous au plus tôt pour garder votre rattrapage : ${d.cancel_url}` } as Block] : []),
        sign(ctx),
      ],
    }),
  },

  trial_ending: {
    name: "Fin de l'essai",
    description: "Avertit le gérant quelques jours avant la fin de l'essai gratuit.",
    category: "essential",
    fields: { first: "Prénom", club_name: "Nom du club", days_left: "Jours restants", trial_ends_at: "Date de fin", plan_url: "Lien vers le choix de la formule" },
    sample: { first: "Claire", club_name: "Écurie des Tilleuls", days_left: 3, trial_ends_at: "2026-11-27", plan_url: "https://app.stablapp.fr/reglages/abonnement" },
    build: (d) => ({
      subject: Number(d.days_left) <= 0 ? "Votre essai est terminé" : `Votre essai se termine dans ${d.days_left} jour${Number(d.days_left) > 1 ? "s" : ""}`,
      preheader: "Choisissez votre formule pour continuer sans interruption.",
      blocks: [
        { t: "hero", icon: "bell", badge: "Votre abonnement", title: Number(d.days_left) <= 0 ? "Votre essai est terminé" : "Votre essai touche à sa fin" },
        { t: "p", text: `${hello(d)} l'essai gratuit de **${d.club_name || "votre club"}** se termine le ${dateLong(d.trial_ends_at)}. Pour continuer sans interruption, choisissez la formule qui vous convient : vos données, vos adhérents et vos réglages sont conservés.` },
        { t: "button", label: "Choisir ma formule", url: d.plan_url },
        { t: "p", text: "Sans engagement : vous pouvez changer de formule ou arrêter à tout moment. Une question sur les tarifs ? Répondez à cet e-mail." },
        { t: "p", text: `À bientôt, l'équipe ${BRAND.name}.` },
      ],
    }),
  },

  subscription_receipt: {
    name: "Reçu d'abonnement Stabl",
    description: "Paiement de l'abonnement du club à Stabl.",
    category: "essential",
    fields: { first: "Prénom", club_name: "Nom du club", plan: "Formule", amount_cents: "Montant TTC en centimes", period_start: "Début de période", period_end: "Fin de période", invoice_number: "Numéro de facture (facultatif)", invoice_url: "Lien vers la facture (facultatif)" },
    sample: { first: "Claire", club_name: "Écurie des Tilleuls", plan: "Club, mensuel", amount_cents: 5900, period_start: "2026-11-24", period_end: "2026-12-23", invoice_number: "PF-2026-0042" },
    build: (d) => ({
      subject: `Reçu de votre abonnement ${BRAND.name} : ${money(d)}`,
      preheader: "Merci, votre abonnement est à jour.",
      blocks: [
        { t: "hero", icon: "check", badge: "Abonnement Stabl", title: "Merci, votre abonnement est à jour" },
        { t: "p", text: `${hello(d)} nous avons bien reçu le paiement de l'abonnement de **${d.club_name || "votre club"}**.` },
        { t: "rows", rows: opt([["Formule", d.plan], ["Montant", money(d)], ["Période", d.period_start && d.period_end ? `du ${dateShort(d.period_start)} au ${dateShort(d.period_end)}` : ""], ["Facture", d.invoice_number]]) },
        ...(d.invoice_url ? [{ t: "button", label: "Télécharger la facture", url: d.invoice_url } as Block] : []),
        { t: "p", muted: true, text: `Facture émise par ${BRAND.legal}.` },
      ],
    }),
  },

  accountant_invite: {
    name: "Invitation du comptable",
    description: "Le gérant donne accès aux factures et exports à son cabinet comptable.",
    category: "essential", sensitive: true,
    fields: { first: "Prénom du comptable", inviter_name: "Nom du gérant", firm: "Cabinet (facultatif)", invitation_url: "Lien d'acceptation", expires_days: "Validité en jours" },
    sample: { first: "Nathalie", inviter_name: "Claire", firm: "Cabinet Expertise Yvelines", invitation_url: "https://app.stablapp.fr/invitation/exemple" },
    build: (d, ctx) => ({
      subject: `${clubName(ctx)} vous donne accès à sa comptabilité`,
      preheader: "Factures, encaissements, FEC et factures électroniques, en lecture seule.",
      blocks: [
        { t: "hero", icon: "invoice", badge: "Accès comptable", title: "Votre accès comptable" },
        { t: "p", text: `${hello(d)} ${d.inviter_name ? d.inviter_name + ", de " + clubName(ctx) + "," : clubName(ctx)} vous invite${d.firm ? " (" + d.firm + ")" : ""} à consulter sa comptabilité sur ${BRAND.name}.` },
        { t: "list", items: [
          "factures émises, avoirs et encaissements, avec leur statut de facture électronique",
          "export **FEC** conforme, journal des ventes et des encaissements",
          "téléchargement des factures en PDF Factur-X, mois par mois",
        ] },
        { t: "p", text: "Votre accès est en lecture seule : vous ne pouvez rien modifier par erreur." },
        { t: "button", label: "Accepter l'invitation", url: d.invitation_url },
        { t: "fallback", url: d.invitation_url },
        { t: "p", muted: true, text: `Cette invitation est valable ${d.expires_days || 14} jours. Un seul compte suffit pour tous les clubs que vous suivez sur ${BRAND.name}.` },
      ],
    }),
  },

  export_ready: {
    name: "Export prêt",
    description: "Un export demandé (FEC, ventes, factures PDF) est prêt à être téléchargé.",
    category: "essential", sensitive: true,
    fields: { first: "Prénom", export_name: "Nom de l'export", period: "Période (facultatif)", download_url: "Lien de téléchargement", expires_days: "Validité du lien en jours (7 par défaut)" },
    sample: { first: "Nathalie", export_name: "FEC 2026", period: "du 1er janvier au 31 décembre 2026", download_url: "https://app.stablapp.fr/exports/exemple" },
    build: (d, ctx) => ({
      subject: `Votre export est prêt : ${d.export_name}`,
      preheader: "Téléchargez-le dès maintenant.",
      blocks: [
        { t: "hero", icon: "invoice", badge: "Export", title: "Votre export est prêt" },
        { t: "p", text: `${hello(d)} l'export que vous avez demandé pour ${clubName(ctx)} est disponible.` },
        { t: "rows", rows: opt([["Export", d.export_name], ["Période", d.period]]) },
        { t: "button", label: "Télécharger", url: d.download_url },
        { t: "p", muted: true, text: `Ce lien est valable ${d.expires_days || 7} jours. Vous devez être connecté pour télécharger le fichier.` },
      ],
    }),
  },

  document_to_sign: {
    name: "Document à signer",
    description: "Contrat de pension, demi-pension, inscription, autorisation parentale… à signer en ligne.",
    category: "essential", sensitive: true,
    fields: { first: "Prénom", title: "Titre du document", horse: "Cheval concerné (facultatif)", sender_name: "Qui l'envoie (facultatif)", sign_url: "Lien de signature", due_date: "À signer avant le (facultatif)" },
    sample: { first: "Emma", title: "Contrat de demi-pension", horse: "Ulysse de la Roche", sender_name: "Claire", sign_url: "https://app.stablapp.fr/signer/exemple", due_date: "2026-11-30" },
    build: (d, ctx) => ({
      subject: `Document à signer : ${d.title}`,
      preheader: "Signature en ligne en deux minutes, depuis votre téléphone.",
      blocks: [
        { t: "hero", icon: "invoice", badge: "Signature en ligne", title: "Un document attend votre signature" },
        { t: "p", text: `${hello(d)} ${d.sender_name ? d.sender_name + ", de " + clubName(ctx) + "," : clubName(ctx)} vous envoie un document à signer.` },
        { t: "rows", rows: opt([["Document", d.title], ["Cheval", d.horse], ["À signer avant le", d.due_date ? dateLong(d.due_date) : ""]]) },
        { t: "button", label: "Lire et signer", url: d.sign_url },
        { t: "p", muted: true, text: "Vous pourrez lire le document en entier avant de signer. Une copie signée vous sera envoyée et restera disponible dans votre espace." },
        sign(ctx),
      ],
    }),
  },

  horse_care_reminder: {
    name: "Rappel de soin du cheval",
    description: "Pour un propriétaire : vaccin, maréchal, vermifuge, dentiste ou ostéopathe à venir.",
    category: "reminders",
    fields: { first: "Prénom", horse_name: "Nom du cheval", kind: "Vaccin | Maréchal | Vermifuge | Dentiste | Ostéopathe | Vétérinaire", date: "Date", time: "Heure (facultatif)", who: "Praticien (facultatif)", note: "Détail (facultatif)", horse_url: "Lien vers la fiche du cheval (facultatif)", overdue: "true si le soin est en retard" },
    sample: { first: "Léa", horse_name: "Ulysse de la Roche", kind: "Maréchal", date: "2026-11-26", time: "09:00", who: "Benoît Gautier", note: "Ferrure complète, plaques antérieurs" },
    build: (d, ctx) => {
      const k = String(d.kind || "Soin");
      const what: Record<string, string> = { Vaccin: "le rappel de vaccin", "Maréchal": "le passage du maréchal", Vermifuge: "le vermifuge", Dentiste: "le passage du dentiste", "Ostéopathe": "la séance d'ostéopathie", "Vétérinaire": "la visite du vétérinaire" };
      const label = what[k] || "le prochain soin";
      return {
        subject: d.overdue ? `${d.horse_name} : ${label.replace(/^l[ea]s? |^l'/, "")} est en retard` : `${d.horse_name} : ${k.toLowerCase()} le ${dateShort(d.date)}`,
        preheader: `${d.horse_name}, ${dateLong(d.date)}.`,
        blocks: [
          { t: "hero", icon: "horse", badge: "Carnet du cheval", title: d.overdue ? `${d.horse_name} a besoin de vous` : `Rappel pour ${d.horse_name}` },
          { t: "p", text: d.overdue
            ? `${hello(d)} ${label} de ${d.horse_name} était prévu le ${dateLong(d.date)} et n'a pas encore été noté comme fait. Pouvez-vous nous confirmer ce qu'il en est ?`
            : `${hello(d)} ${label} de ${d.horse_name} est prévu ${when(d)}.` },
          { t: "rows", rows: opt([["Soin", k], ["Quand", when(d)], ["Praticien", d.who], ["Détail", d.note]]) },
          ...(d.horse_url ? [{ t: "button", label: `Voir la fiche de ${d.horse_name}`, url: d.horse_url } as Block] : []),
          sign(ctx),
        ],
      };
    },
  },
  migration_announce: {
    name: "Migration : annonce aux adhérents",
    description: "Le club passe à Stabl : ce qui est transféré pour l'adhérent (forfait, solde, reprises, cheval).",
    category: "essential", sensitive: true,
    fields: { first: "Prénom", previous_software: "Ancien logiciel (facultatif)", switch_date: "Date du changement (facultatif)", forfait: "Forfait repris", balance: "Solde repris en euros (négatif = à régler)", lessons: "Prochaines reprises (tableau de textes)", horses: "Chevaux suivis (tableau de noms)", activate_url: "Lien d'activation (si l'activation n'est pas envoyée à part)" },
    sample: { first: "Léa", previous_software: "Kavalog", switch_date: "2026-12-01", forfait: "Forfait annuel 1 h / semaine", balance: -195, lessons: ["mercredi 17 h, Galop 3-4"], horses: ["Ulysse de la Roche"], activate_url: "https://app.stablapp.fr/api/migration/activer/exemple" },
    build: (d, ctx) => {
      const bal = Number(d.balance);
      const balTxt = !isFinite(bal) || d.balance == null ? "" : bal < 0 ? money({ amount: -bal }) + " à régler" : bal > 0 ? "avoir de " + money({ amount: bal }) : "à jour";
      const lessons: string[] = Array.isArray(d.lessons) ? d.lessons : [];
      const horses: string[] = Array.isArray(d.horses) ? d.horses : [];
      return {
        subject: `${clubName(ctx)} change d'application : tout est déjà prêt pour vous`,
        preheader: "Votre forfait, votre solde et vos reprises vous suivent, sans rien ressaisir.",
        blocks: [
          { t: "hero", icon: "sparkles", badge: "Nouvelle application", title: "Votre club passe à Stabl", text: "Vous n'avez rien à ressaisir : votre forfait, vos reprises et votre cheval vous suivent." },
          { t: "p", text: `${hello(d)} ${clubName(ctx)} ${d.switch_date ? "utilisera à partir du " + dateLong(d.switch_date) : "utilise désormais"} une nouvelle application pour les réservations, les paiements et le suivi des chevaux${d.previous_software ? ", à la place de " + d.previous_software : ""}.` },
          { t: "p", text: "Bonne nouvelle : **vous n'avez rien à ressaisir**. Voici ce que nous avons déjà transféré pour vous :" },
          { t: "card", kicker: "Déjà transféré", title: d.first ? `La fiche de ${String(d.first).trim()}` : "Votre fiche", status: { text: "Prêt", tone: "ok" },
            rows: opt([["Forfait", d.forfait], ["Solde", balTxt], ["Vos reprises", lessons.slice(0, 3).join(" ; ")], [horses.length > 1 ? "Vos chevaux" : "Votre cheval", horses.join(", ")]]) },
          ...(d.activate_url
            ? [{ t: "p", text: "Il ne vous reste qu'à activer votre espace : un clic suffit, sans mot de passe à créer." } as Block, { t: "button", label: "Activer mon espace", url: d.activate_url } as Block]
            : [{ t: "note", text: "Vous recevrez très bientôt votre lien d'activation personnel : un clic suffira, sans mot de passe à créer." } as Block]),
          { t: "p", muted: true, text: "Une information vous semble inexacte ? Répondez à cet e-mail, nous la corrigerons." },
          sign(ctx),
        ],
      };
    },
  },

  migration_activate: {
    name: "Migration : activation en un clic",
    description: "Lien d'activation personnel (connexion directe) vers une fiche pré-remplie à vérifier.",
    category: "essential", sensitive: true,
    fields: { first: "Prénom", activate_url: "Lien d'activation", forfait: "Forfait repris (facultatif)", lessons: "Prochaines reprises (tableau, facultatif)", horses: "Chevaux (tableau, facultatif)", expires_days: "Validité du lien en jours (30 par défaut)" },
    sample: { first: "Léa", activate_url: "https://app.stablapp.fr/api/migration/activer/exemple", forfait: "Forfait annuel 1 h / semaine", lessons: ["mercredi 17 h, Galop 3-4"], horses: [] },
    build: (d, ctx) => {
      const lessons: string[] = Array.isArray(d.lessons) ? d.lessons : [];
      const horses: string[] = Array.isArray(d.horses) ? d.horses : [];
      return {
        subject: `${d.first ? d.first + ", votre" : "Votre"} espace ${clubName(ctx)} est prêt`,
        preheader: "Un clic pour l'activer, votre fiche est déjà remplie.",
        blocks: [
          { t: "hero", icon: "key", badge: "Activation en un clic", title: "Votre espace est prêt", text: "Votre fiche est déjà remplie : il ne manque que vous." },
          { t: "p", text: `${hello(d)} votre fiche a été préparée à partir des informations du club. Activez votre espace en un clic : vous serez connecté directement, sans mot de passe à créer.` },
          ...(d.forfait || lessons.length || horses.length ? [{ t: "card", kicker: "Votre fiche", title: String(d.forfait || "Fiche pré-remplie"), status: { text: "Prêt", tone: "ok" },
            rows: opt([["Vos reprises", lessons.slice(0, 3).join(" ; ")], [horses.length > 1 ? "Vos chevaux" : "Votre cheval", horses.join(", ")]]) } as Block] : []),
          { t: "button", label: "Activer mon espace", url: d.activate_url },
          { t: "h", text: "Et ensuite" },
          { t: "steps", items: [
            { title: "Vérifiez votre fiche", text: "Coordonnées, contacts d'urgence, autorisations : deux minutes suffisent." },
            { title: "Réservez vos reprises et vos rattrapages", text: "Depuis votre téléphone, à toute heure." },
            { title: horses.length ? `Suivez ${horses.join(", ")}` : "Payez en ligne", text: horses.length ? "Soins, maréchal, vaccins et journal de travail." : "Et retrouvez toutes vos factures au même endroit." },
          ] },
          { t: "fallback", url: d.activate_url },
          { t: "p", muted: true, text: `Ce lien personnel est valable ${d.expires_days || 30} jours. Ne le transférez pas : il ouvre votre compte.` },
          sign(ctx),
        ],
      };
    },
  },

  gift_card: {
    name: "Carte cadeau",
    description: "Envoyée à l'acheteur d'une carte cadeau du club, avec son code (paiement en ligne ou encaissé par le club).",
    category: "essential",
    fields: { first: "Prénom de l'acheteur (facultatif)", code: "Code de la carte", amount: "Montant en euros (ou amount_cents)", label: "Prestation offerte (facultatif)", to: "Pour qui (facultatif)", message: "Message de l'acheteur (facultatif)", valid_until: "Valable jusqu'au (facultatif)" },
    sample: { first: "Sophie", code: "MOU-K7RD-42", amount: 35, label: "Balade d'une heure", to: "Jules", message: "Joyeux Noël !", valid_until: "2027-12-24" },
    build: (d, ctx) => ({
      subject: `Votre carte cadeau ${clubName(ctx)} : ${d.code}`,
      preheader: "Le code est à donner au club au moment de réserver.",
      blocks: [
        { t: "hero", icon: "gift", badge: "Carte cadeau", title: "Votre carte cadeau est prête" },
        { t: "p", text: `${hello(d)} merci pour votre achat. Voici la carte cadeau de ${clubName(ctx)}${d.to ? " pour " + String(d.to).trim() : ""}.` },
        { t: "code", text: String(d.code || "") },
        { t: "rows", rows: opt([["Montant", money(d)], ["Prestation", d.label], ["Pour", d.to], ["Message", d.message], ["Valable jusqu'au", d.valid_until ? dateLong(d.valid_until) : ""]]) },
        { t: "p", text: "Pour l'utiliser, il suffit de donner ce code au club au moment de réserver. Vous pouvez imprimer cet e-mail ou le transférer." },
        sign(ctx),
      ],
    }),
  },

  club_notice: {
    name: "Message au gérant",
    description: "Prévient le gérant d'une demande arrivée par une page publique du club (carte cadeau sans paiement en ligne, avis à lire…).",
    category: "essential",
    fields: { first: "Prénom du gérant (facultatif)", title: "Titre", intro: "Phrase d'explication", rows: "Lignes [libellé, valeur] (facultatif)", note: "Conseil ou étape suivante (facultatif)", action_label: "Texte du bouton (facultatif)", action_url: "Lien du bouton (facultatif)" },
    sample: { first: "Claire", title: "Nouvelle demande de carte cadeau", intro: "Sophie Martin souhaite offrir une balade d'une heure (35 €).", rows: [["E-mail", "sophie@exemple.fr"], ["Pour", "Jules"]], note: "Le paiement en ligne n'est pas encore activé : contactez Sophie pour l'encaissement.", action_label: "Ouvrir Cadeaux", action_url: "https://app.stablapp.fr/#cadeaux" },
    build: (d) => ({
      subject: String(d.title || "Nouveau message de votre page publique"),
      preheader: String(d.intro || "").slice(0, 120),
      blocks: [
        { t: "h", text: String(d.title || "Nouveau message") },
        { t: "p", text: `${hello(d)} ${String(d.intro || "")}` },
        ...(Array.isArray(d.rows) && d.rows.length ? [{ t: "rows" as const, rows: opt(d.rows.map((r: unknown[]) => [String(r[0]), r[1]] as [string, unknown])) }] : []),
        ...(d.note ? [{ t: "note" as const, text: String(d.note), tone: "info" as const }] : []),
        ...(d.action_url ? [{ t: "button" as const, label: String(d.action_label || "Ouvrir Stabl"), url: String(d.action_url) }] : []),
      ],
    }),
  },

  migration_reminder: {
    name: "Migration : relance d'activation",
    description: "Relance des adhérents qui n'ont pas encore activé leur espace (niveau 1 à J+3, niveau 2 à J+7).",
    category: "essential", sensitive: true,
    fields: { level: "1 (J+3) ou 2 (J+7)", first: "Prénom", activate_url: "Lien d'activation", expires_days: "Jours restants de validité (facultatif)" },
    sample: { level: 1, first: "Léa", activate_url: "https://app.stablapp.fr/api/migration/activer/exemple" },
    build: (d, ctx) => {
      const two = Number(d.level) >= 2;
      return {
        subject: two ? `Dernier rappel : activez votre espace ${clubName(ctx)}` : `Avez-vous vu votre nouvel espace ${clubName(ctx)} ?`,
        preheader: two ? "Les réservations passent désormais par l'application." : "Votre fiche vous attend, un clic suffit.",
        blocks: [
          { t: "hero", icon: "key", badge: "Activation", title: two ? "Ne manquez pas vos prochaines réservations" : "Votre espace vous attend" },
          { t: "p", text: two
            ? `${hello(d)} les réservations, les rattrapages et les paiements de ${clubName(ctx)} passent désormais par l'application. Activez votre espace pour garder la main sur vos cours.`
            : `${hello(d)} il y a quelques jours, nous vous avons préparé votre espace. Il n'est pas encore activé : cela prend dix secondes.` },
          { t: "button", label: "Activer mon espace", url: d.activate_url },
          { t: "p", muted: true, text: "Vous avez déjà activé votre espace avec une autre adresse ? Répondez simplement à cet e-mail." },
          sign(ctx),
        ],
      };
    },
  },
  pro_invoice: {
    name: "Facture d'un praticien",
    description: "Facture d'un vétérinaire, maréchal, dentiste ou ostéopathe, envoyée toute seule au club ou au propriétaire du cheval, PDF en pièce jointe.",
    category: "essential",
    fields: { first: "Prénom (propriétaire, facultatif)", pro_name: "Nom du praticien", pro_job: "Métier", number: "Numéro de facture", amount_cents: "Montant TTC en centimes", due_date: "Date d'échéance (facultatif)", horses: "Chevaux concernés", club_name: "Écurie", iban: "IBAN du praticien (facultatif)", to_club: "true si la facture est adressée au club" },
    sample: { first: "Léa", pro_name: "Dr Antoine Leclerc", pro_job: "Vétérinaire", number: "PRO-2026-00042", amount_cents: 8160, due_date: "2026-12-28", horses: "Ulysse", club_name: "Écurie des Tilleuls", iban: "FR76 3000 4000 0312 3456 7890 143" },
    build: (d) => ({
      subject: `Facture ${d.number} de ${d.pro_name} : ${money(d)}`,
      preheader: `${d.pro_job ? d.pro_job + ", " : ""}${d.horses ? d.horses + ", " : ""}${money(d)}.`,
      blocks: [
        { t: "h", text: "Votre facture est disponible" },
        { t: "p", text: `${hello(d)} voici la facture de ${d.pro_name}${d.pro_job ? " (" + String(d.pro_job).toLowerCase() + ")" : ""} pour ${d.horses ? "les soins de " + d.horses : "ses actes"}${d.club_name && !d.to_club ? " à " + d.club_name : ""}. Elle est en pièce jointe au format PDF.` },
        { t: "rows", rows: opt([["Facture", d.number], ["Montant", money(d)], ["À régler avant le", d.due_date ? dateLong(d.due_date) : "à réception"], ["Virement", d.iban]]) },
        ...(d.to_club ? [{ t: "note", tone: "ok", text: "Elle est aussi rangée dans vos factures fournisseurs sur Stabl, avec son fichier Factur-X pour votre comptable." } as Block] : []),
        { t: "p", muted: true, text: `Une question sur cette facture ? Répondez simplement à cet e-mail : il arrive chez ${d.pro_name}.` },
      ],
    }),
  },

  pro_invoice_copy: {
    name: "Copie de facture pour le praticien",
    description: "Copie envoyée au praticien de chaque facture partie à son nom (faite à la main ou toute seule).",
    category: "essential",
    fields: { first: "Prénom du praticien", number: "Numéro", amount_cents: "Montant TTC en centimes", customer_name: "Client", sent_to: "Adresse d'envoi (vide si le client n'a pas d'e-mail)", club_name: "Écurie", auto: "true si la facture a été faite toute seule", invoices_url: "Lien vers ses factures" },
    sample: { first: "Antoine", number: "PRO-2026-00042", amount_cents: 8160, customer_name: "Léa Martin", sent_to: "lea@exemple.fr", club_name: "Écurie des Tilleuls", auto: true, invoices_url: "https://app.stablapp.fr/" },
    build: (d) => ({
      subject: `${d.auto ? "Facture faite pour vous" : "Copie de votre facture"} ${d.number} : ${money(d)}, ${d.customer_name}`,
      preheader: d.sent_to ? `Envoyée à ${d.sent_to}.` : "Le client n'a pas d'e-mail : remettez-lui le PDF.",
      blocks: [
        { t: "h", text: d.auto ? "Votre facture est partie toute seule" : "Copie de votre facture" },
        { t: "p", text: `${hello(d)} ${d.auto ? "vos actes ont été facturés automatiquement" : "voici la copie de votre facture"} (${d.club_name}). Le PDF est en pièce jointe pour vos archives.` },
        { t: "rows", rows: opt([["Facture", d.number], ["Client", d.customer_name], ["Montant", money(d)], ["Envoyée à", d.sent_to || "personne : pas d'adresse e-mail connue"]]) },
        ...(d.sent_to ? [] : [{ t: "note", tone: "warn", text: "Le client n'a pas d'adresse e-mail dans Stabl : remettez-lui le PDF, ou demandez au club de compléter sa fiche." } as Block]),
        ...(d.invoices_url ? [{ t: "button", label: "Voir toutes mes factures", url: d.invoices_url } as Block] : []),
        { t: "p", text: `À bientôt, l'équipe ${BRAND.name}.` },
      ],
    }),
  },

  club_referral: {
    name: "Recommandation d'un cavalier à son écurie",
    description: "Un cavalier recommande Stabl à son écurie (POST /api/public/recommander). Expéditeur « Stabl », réponse directe au cavalier.",
    category: "referrals",
    fields: { club_name: "Nom de l'écurie (facultatif)", from_first: "Prénom du cavalier", from_last: "Nom du cavalier (facultatif)", message: "Mot du cavalier (facultatif, 500 caractères au plus, texte brut)", url: "Lien vers stablapp.fr" },
    sample: { club_name: "Écurie du Moulin", from_first: "Léa", from_last: "Martin", message: "Bonjour Claire, j'utilise Stabl dans une autre écurie pour suivre Ulysse et c'est vraiment pratique. Je me suis dit que ça pourrait vous plaire !", url: "https://stablapp.fr/?ref=cavalier" },
    build: (d) => {
      const from = [d.from_first, d.from_last].map((x) => String(x ?? "").trim()).filter(Boolean).join(" ") || "Un cavalier";
      const first = String(d.from_first ?? "").trim() || from;
      const club = String(d.club_name ?? "").trim();
      const msg = String(d.message ?? "").trim().slice(0, 500);
      return {
        subject: `${from} vous recommande ${BRAND.name}${club ? " pour " + club : ""}`,
        preheader: "Planning, facturation, paiement en ligne et suivi des chevaux, dans une seule application.",
        blocks: [
          { t: "hero", icon: "heart", badge: "Recommandation", title: `${first} vous recommande ${BRAND.name}`, text: club ? `Pour ${club} : le logiciel qui simplifie la vie des écuries et de leurs cavaliers.` : "Le logiciel qui simplifie la vie des écuries et de leurs cavaliers." },
          { t: "p", text: `Bonjour, ${from}, qui monte ${club ? "chez " + club : "dans votre écurie"}, aimerait pouvoir réserver ses reprises, payer et suivre son cheval sur ${BRAND.name}, et vous propose de le découvrir.` },
          ...(msg ? [{ t: "quote", text: msg, by: from } as Block] : []),
          { t: "h", text: `${BRAND.name}, en bref` },
          { t: "checks", items: [
            "**Planning** des reprises, rattrapages et listes d'attente",
            "**Facturation**, paiement en ligne et relances",
            "**Suivi des chevaux** : soins, maréchal, vaccins, pensions",
            "**Une application** pour vos cavaliers et leurs familles",
            "**Reprise de vos données** depuis votre logiciel actuel ou un fichier Excel",
          ] },
          { t: "button", label: `Découvrir ${BRAND.name}`, url: d.url || BRAND.site },
          { t: "p", text: `Pour répondre à ${first}, répondez simplement à cet e-mail : votre réponse lui arrive directement.` },
          { t: "p", muted: true, text: `Vous recevez cet e-mail parce que ${from} a indiqué votre adresse sur ${BRAND.site.replace(/^https:\/\//, "")}. Pour ne plus recevoir de recommandations, utilisez le lien en bas de cet e-mail.` },
        ],
      };
    },
  },
  club_message: {
    name: "Message du club",
    description: "Envoi groupé écrit par le gérant depuis Communication (fermeture, convocation, informations).",
    category: "essential",
    fields: { first: "Prénom du destinataire (facultatif)", subject: "Objet", text: "Texte du message (paragraphes séparés par une ligne vide)" },
    sample: { first: "Léa", subject: "Carrière fermée jeudi", text: "Bonjour Léa,\n\nLa carrière sera fermée jeudi pour l'entretien du sol. Les reprises ont lieu au manège." },
    build: (d, ctx) => {
      const paras = String(d.text || "").split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean).slice(0, 30);
      return {
        subject: String(d.subject || "Message de " + clubName(ctx)).slice(0, 160),
        preheader: (paras[0] || "").slice(0, 120),
        blocks: [
          { t: "h", text: String(d.subject || "Message de " + clubName(ctx)).slice(0, 160) },
          ...paras.map((x) => ({ t: "p" as const, text: x })),
          { t: "p", muted: true, text: `Envoyé par ${clubName(ctx)}. Répondez à cet e-mail pour écrire au club.` },
        ],
      };
    },
  },
};

export const TEMPLATE_KEYS = Object.keys(TEMPLATES);
