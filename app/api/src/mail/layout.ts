/*
 * Mise en page des e-mails : un petit langage de blocs rendu deux fois, en HTML (tables, styles en ligne,
 * VML pour Outlook, mode sombre) et en texte brut. Ainsi les deux versions disent toujours la même chose.
 *
 * Structure d'un e-mail (DA Stabl) :
 *   bandeau marine  : logo Stabl blanc, ou pastille / logo du club + « via Stabl »
 *   carte héros     : pastille (icône ou initiale), étiquette, grand titre display, sous-titre (bloc `hero`,
 *                     ou à défaut le premier bloc `h`, promu automatiquement)
 *   ruban           : filet saphir, strass et bleu pâle
 *   corps blanc     : les autres blocs
 *   pied de page    : coordonnées du club, signature Stabl, mentions légales, désinscription
 * Clients visés : Apple Mail / iOS (polices web, mode sombre), Gmail web et applis (styles en ligne, pas de <link>),
 * Outlook Windows (tables, bgcolor, boutons VML, coins carrés), Outlook.com (data-ogsc).
 */
import { BRAND } from "./brand";

export type Tone = "info" | "ok" | "warn" | "bad";
/** Pictogrammes blancs (PNG @2x) servis depuis BRAND.assetsUrl : icone-<nom>@2x.png. */
export type IconName = "mail" | "key" | "lock" | "calendar" | "invoice" | "check" | "sparkles" | "horse" | "bell" | "gift" | "users" | "heart";
export const ICONS: IconName[] = ["mail", "key", "lock", "calendar", "invoice", "check", "sparkles", "horse", "bell", "gift", "users", "heart"];

export interface DateTile { weekday: string; day: string; month: string }
export type Block =
  | { t: "h"; text: string }
  | { t: "p"; text: string; muted?: boolean }
  | { t: "button"; label: string; url: string; variant?: "primary" | "secondary" }
  | { t: "rows"; rows: [string, string][] }
  | { t: "list"; items: string[] }
  | { t: "note"; text: string; tone?: Tone }
  | { t: "code"; text: string }
  | { t: "fallback"; url: string }
  | { t: "divider" }
  /** Carte héros : sur le bandeau marine quand c'est le premier bloc, sinon titre + texte. */
  | { t: "hero"; title: string; text?: string; badge?: string; icon?: IconName; initial?: string }
  /** Étapes numérotées (mise en route, marche à suivre). */
  | { t: "steps"; items: { title: string; text?: string }[] }
  /** Liste à coches (ce que permet un accès). */
  | { t: "checks"; items: string[] }
  /** Carte d'un objet : reprise, cheval, facture. Pavé date, montant en grand, lignes libellé / valeur, statut. */
  | { t: "card"; kicker?: string; title: string; text?: string; date?: DateTile | null; amount?: string; rows?: [string, string][]; status?: { text: string; tone?: Tone } }
  /** Pastille de statut seule. */
  | { t: "badge"; text: string; tone?: Tone }
  /** Citation (message d'un cavalier, mot du club). Le texte est échappé, sans mise en forme. */
  | { t: "quote"; text: string; by?: string };

export interface Frame {
  subject: string;
  preheader: string;
  blocks: Block[];
  /** Nom affiché en tête et en signature (club ou marque). */
  headerName: string;
  logoUrl?: string | null;
  /** E-mail d'un club : en-tête « <club> via Stabl » (logo du club ou pastille avec son initiale). */
  isClub?: boolean;
  /** Lignes du pied de page propres au club (nom, adresse, contact). La signature Stabl est ajoutée par la mise en page. */
  footer: string[];
  /** Lien de désinscription (e-mails non essentiels). */
  unsubscribeUrl?: string | null;
  unsubscribeLabel?: string | null;
  preferencesUrl?: string | null;
  /** Pixel de suivi d'ouverture (campagnes d'accueil uniquement). */
  pixelUrl?: string | null;
}

const C = BRAND.colors;

export function esc(s: unknown): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** Typographie française : espace insécable avant : ; ? ! % € » et après «. */
export function typo(s: string): string {
  return s
    .replace(/[ \t]+([:;?!%€»])/g, " $1")
    .replace(/«[ \t]+/g, "« ")
    .replace(/(\d) (\d{3})\b/g, "$1 $2");
}

/** N'accepte que des liens http(s), mailto et webcal. */
export function safeUrl(u: unknown): string {
  const s = String(u ?? "").trim();
  return /^(https?:|mailto:|webcal:)/i.test(s) ? s : "#";
}

/** Initiale d'un nom (pastille du club) : première lettre, sans « Écurie », « Centre équestre »… */
export function initialOf(name: string): string {
  const words = String(name || "").replace(/[^\p{L}\p{N}' -]/gu, " ").split(/[\s'-]+/).filter(Boolean);
  const skip = /^(écurie|ecurie|écuries|ecuries|centre|équestre|equestre|club|haras|poney|poney-club|ranch|domaine|de|du|des|la|le|les|l|d|et|à|a)$/i;
  const w = words.find((x) => !skip.test(x)) || words[0] || "S";
  return w.charAt(0).toLocaleUpperCase("fr");
}

export const iconUrl = (n: IconName) => `${BRAND.assetsUrl}/icone-${n}@2x.png`;

const plain = (s: string) => typo(s).replace(/\*\*(.+?)\*\*/g, "$1");

const F = BRAND.fontText;
const FD = BRAND.fontDisplay;
const N = BRAND.night;
const P = `margin:0 0 18px 0;font-family:${F};font-size:16px;line-height:26px;color:${N.lead};`;
const TB = `role="presentation" border="0" cellpadding="0" cellspacing="0"`;
const LABEL = `font-family:${F};font-size:12px;line-height:16px;font-weight:600;letter-spacing:2px;text-transform:uppercase;color:${N.strass}`;

/** Pastilles de statut lisibles sur fond marine. */
const TONE: Record<Tone, { fg: string; bg: string }> = {
  info: { fg: "#a9bbff", bg: N.watermark },
  ok: { fg: "#6fdca6", bg: "#0f3a34" },
  warn: { fg: "#ffc46b", bg: "#3a2c14" },
  bad: { fg: "#ff9b8a", bg: "#401d22" },
};

/** Texte enrichi minimal : **gras** (en blanc). Le reste est échappé. */
function richN(s: string): string {
  return esc(typo(s)).replace(/\*\*(.+?)\*\*/g, '<strong style="color:#ffffff;font-weight:600">$1</strong>');
}

function pill(text: string, tone: Tone = "info"): string {
  const t = TONE[tone];
  return `<table ${TB} style="display:inline-table"><tr><td style="padding:5px 11px;border-radius:999px;background:${t.bg};font-family:${F};font-size:12px;line-height:16px;font-weight:700;color:${t.fg};letter-spacing:0.3px;white-space:nowrap">${esc(typo(text))}</td></tr></table>`;
}

function button(b: { label: string; url: string; variant?: "primary" | "secondary" }): string {
  const url = esc(safeUrl(b.url));
  const label = esc(typo(b.label));
  const sec = b.variant === "secondary";
  const w = Math.min(520, Math.max(200, Math.round(b.label.length * 9.4 + 68)));
  const bg = sec ? N.body : N.strass;
  const fg = sec ? "#ffffff" : C.navy;
  return `<table ${TB} class="btn-full" style="margin:8px 0 ${sec ? 24 : 16}px 0"><tr><td align="center" bgcolor="${bg}" style="border-radius:6px;background:${bg};${sec ? `border:1.5px solid ${N.edge};` : ""}">` +
    `<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:56px;v-text-anchor:middle;width:${w}px" arcsize="11%" ${sec ? `strokecolor="${N.edge}" strokeweight="1.5px"` : 'stroke="f"'} fillcolor="${bg}"><w:anchorlock/><center style="color:${fg};font-family:Segoe UI,Arial,sans-serif;font-size:16px;font-weight:bold">${label}</center></v:roundrect><![endif]-->` +
    `<!--[if !mso]><!--><a href="${url}" target="_blank" style="display:block;padding:18px 32px;font-family:${F};font-size:16px;line-height:20px;font-weight:700;color:${fg};text-decoration:none;border-radius:6px;text-align:center;mso-hide:all">${label}</a><!--<![endif]-->` +
    `</td></tr></table>`;
}

/** Lignes étiquette strass / valeur blanche, séparées par des filets (comme la fiche de réservation). */
function rowsHtml(rows: [string, string][]): string {
  return rows.map(([k, v]) =>
    `<tr><td class="k" style="padding:16px 14px 16px 0;border-top:1px solid ${N.line};${LABEL};vertical-align:top;width:38%">${esc(typo(k))}</td>` +
    `<td style="padding:14px 0;border-top:1px solid ${N.line};font-family:${F};font-size:16px;line-height:22px;color:#ffffff;font-weight:600;vertical-align:top">${richN(v)}</td></tr>`).join("");
}

function headHtml(f: Frame, hero: Extract<Block, { t: "hero" }> | null): string {
  const stabl = `<img src="${esc(BRAND.img.logoWhite)}" width="${BRAND.logoWidth - 14}" height="${BRAND.logoHeight - 6}" alt="${esc(BRAND.name)}" style="display:block;width:${BRAND.logoWidth - 14}px;height:${BRAND.logoHeight - 6}px;border:0;outline:none;color:#ffffff;font-family:${FD};font-size:18px;font-weight:800">`;
  let top: string;
  if (f.isClub) {
    const mark = f.logoUrl
      ? `<td width="44" style="vertical-align:middle;padding-right:12px"><table ${TB}><tr><td width="34" height="34" align="center" valign="middle" bgcolor="#ffffff" style="width:34px;height:34px;border-radius:9px;background:#ffffff;text-align:center"><img src="${esc(safeUrl(f.logoUrl))}" width="26" height="26" alt="" style="display:block;margin:0 auto;width:26px;height:26px;border:0;object-fit:contain"></td></tr></table></td>`
      : `<td width="44" style="vertical-align:middle;padding-right:12px"><table ${TB}><tr><td width="34" height="34" align="center" valign="middle" bgcolor="${N.watermark}" style="width:34px;height:34px;border-radius:9px;background:${N.watermark};font-family:${FD};font-size:17px;line-height:34px;font-weight:800;color:#ffffff;text-align:center">${esc(initialOf(f.headerName))}</td></tr></table></td>`;
    top = `<table ${TB} width="100%"><tr>${mark}<td style="vertical-align:middle;font-family:${F};font-size:15px;line-height:19px;font-weight:700;color:#ffffff">${esc(typo(f.headerName))}</td>` +
      `<td align="right" style="vertical-align:middle;font-family:${F};font-size:13px;line-height:18px;color:${N.soft};white-space:nowrap">via ${esc(BRAND.name)}</td></tr></table>`;
  } else {
    const logo = f.logoUrl ? stabl : `<span style="font-family:${FD};font-size:22px;line-height:26px;font-weight:800;color:#ffffff;letter-spacing:-0.8px">${esc(BRAND.name.toLowerCase())}</span>`;
    top = `<table ${TB} width="100%"><tr><td style="vertical-align:middle">${logo}</td></tr></table>`;
  }
  if (!hero) return top;
  const mark = hero.icon
    ? `<table ${TB} style="margin:0 0 18px 0"><tr><td width="40" height="40" align="center" valign="middle" bgcolor="${N.watermark}" style="width:40px;height:40px;border-radius:11px;background:${N.watermark};text-align:center;vertical-align:middle"><img src="${esc(iconUrl(hero.icon))}" width="22" height="22" alt="" style="display:block;margin:0 auto;width:22px;height:22px;border:0"></td></tr></table>`
    : "";
  return top + `<div class="hd-gap" style="height:96px;line-height:96px;font-size:0">&nbsp;</div>` + mark +
    (hero.badge ? `<p style="margin:0 0 14px 0;${LABEL}">${esc(typo(hero.badge))}</p>` : "") +
    `<h1 class="hero-title" style="margin:0;font-family:${FD};font-size:50px;line-height:50px;font-weight:800;color:#ffffff;letter-spacing:-2px">${richN(hero.title)}</h1>`;
}

function blockHtml(b: Block): string {
  switch (b.t) {
    case "h":
      return `<h2 style="margin:10px 0 14px 0;font-family:${FD};font-size:26px;line-height:30px;font-weight:800;color:#ffffff;letter-spacing:-0.9px">${richN(b.text)}</h2>`;
    case "p":
      return `<p style="${P}${b.muted ? `color:${N.soft};font-size:14px;line-height:22px;` : ""}">${richN(b.text)}</p>`;
    case "button":
      return button(b);
    case "rows":
      return `<table ${TB} width="100%" style="margin:4px 0 24px 0;border-bottom:1px solid ${N.line}">${rowsHtml(b.rows)}</table>`;
    case "list":
      return `<table ${TB} width="100%" style="margin:0 0 18px 0">` +
        b.items.map((it) => `<tr><td width="22" style="vertical-align:top;padding:2px 0 8px 0;font-family:${F};font-size:16px;line-height:24px;color:${N.strass};font-weight:700">&#8226;</td><td style="padding:2px 0 8px 0;font-family:${F};font-size:16px;line-height:24px;color:${N.lead}">${richN(it)}</td></tr>`).join("") +
        `</table>`;
    case "checks":
      return `<table ${TB} width="100%" style="margin:4px 0 22px 0;border-bottom:1px solid ${N.line}">` +
        b.items.map((it) => `<tr><td width="40" style="vertical-align:top;padding:14px 0;border-top:1px solid ${N.line}"><table ${TB}><tr><td width="24" height="24" align="center" valign="middle" style="width:24px;height:24px;border-radius:7px;background:${N.watermark};font-family:Arial,sans-serif;font-size:13px;line-height:24px;font-weight:700;color:${N.strass};text-align:center">&#10003;</td></tr></table></td>` +
          `<td style="padding:15px 0 14px 0;border-top:1px solid ${N.line};font-family:${F};font-size:16px;line-height:23px;color:#ffffff;font-weight:500;vertical-align:top">${richN(it)}</td></tr>`).join("") +
        `</table>`;
    case "steps":
      return `<table ${TB} width="100%" style="margin:6px 0 24px 0;border-bottom:1px solid ${N.line}">` +
        b.items.map((s, i) => `<tr><td width="48" style="vertical-align:top;padding:22px 0 20px 0;border-top:1px solid ${N.line};font-family:${FD};font-size:15px;line-height:26px;font-weight:800;color:${N.strass};letter-spacing:-0.3px">${String(i + 1).padStart(2, "0")}</td>` +
          `<td style="vertical-align:top;padding:20px 0;border-top:1px solid ${N.line}"><p style="margin:0;font-family:${FD};font-size:22px;line-height:27px;font-weight:800;color:#ffffff;letter-spacing:-0.7px">${richN(s.title)}</p>` +
          (s.text ? `<p style="margin:6px 0 0 0;font-family:${F};font-size:15px;line-height:23px;color:${N.soft}">${richN(s.text)}</p>` : "") + `</td></tr>`).join("") +
        `</table>`;
    case "card": {
      const big = b.date
        ? `<table ${TB} width="100%" style="margin:0 0 6px 0"><tr><td class="big" style="vertical-align:bottom;width:1%;white-space:nowrap;padding-right:18px;font-family:${FD};font-size:96px;line-height:80px;font-weight:800;color:#ffffff;letter-spacing:-4px">${esc(b.date.day)}</td>` +
          `<td style="vertical-align:bottom;padding-bottom:2px"><p style="margin:0;${LABEL}">${esc(b.date.weekday)}</p><p style="margin:4px 0 0 0;font-family:${FD};font-size:24px;line-height:28px;font-weight:800;color:#ffffff;letter-spacing:-0.8px">${esc(b.date.month)}</p></td></tr></table>`
        : "";
      const head = `<table ${TB} width="100%" style="margin-top:${big ? 22 : 0}px"><tr><td style="vertical-align:top">` +
        (b.kicker ? `<p style="margin:0 0 8px 0;${LABEL}">${esc(typo(b.kicker))}</p>` : "") +
        `<p style="margin:0;font-family:${FD};font-size:24px;line-height:28px;font-weight:800;color:#ffffff;letter-spacing:-0.8px">${richN(b.title)}</p>` +
        (b.text ? `<p style="margin:6px 0 0 0;font-family:${F};font-size:15px;line-height:22px;color:${N.soft}">${richN(b.text)}</p>` : "") +
        `</td>${b.status ? `<td align="right" style="vertical-align:top;padding-left:10px">${pill(b.status.text, b.status.tone)}</td>` : ""}</tr></table>`;
      const amount = b.amount ? `<p class="amount" style="margin:20px 0 4px 0;font-family:${FD};font-size:56px;line-height:58px;font-weight:800;color:#ffffff;letter-spacing:-2.4px">${esc(typo(b.amount))}</p>` : "";
      const rows = b.rows && b.rows.length ? `<table ${TB} width="100%" style="margin-top:18px">${rowsHtml(b.rows)}</table>` : "";
      return `<table ${TB} width="100%" style="margin:6px 0 26px 0;border-radius:16px;background:${N.box};border:1px solid ${N.line}"><tr><td class="card-in" style="padding:26px 26px ${rows ? 10 : 26}px 26px">${big}${head}${amount}${rows}</td></tr></table>`;
    }
    case "badge":
      return `<table ${TB} style="margin:0 0 18px 0"><tr><td>${pill(b.text, b.tone)}</td></tr></table>`;
    case "quote":
      return `<table ${TB} width="100%" style="margin:4px 0 24px 0"><tr><td style="padding:2px 0 2px 22px;border-left:3px solid ${N.strass}">` +
        `<p style="margin:0;font-family:${FD};font-size:22px;line-height:30px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;white-space:pre-line">${esc(typo(b.text))}</p>` +
        (b.by ? `<p style="margin:12px 0 0 0;${LABEL}">${esc(typo(b.by))}</p>` : "") +
        `</td></tr></table>`;
    case "note": {
      const t = TONE[b.tone || "info"];
      return `<table ${TB} width="100%" style="margin:0 0 22px 0"><tr><td style="padding:16px 18px;border-left:3px solid ${t.fg};background:${N.box};border-radius:3px 12px 12px 3px;font-family:${F};font-size:15px;line-height:23px;color:${N.lead}">${richN(b.text)}</td></tr></table>`;
    }
    case "code":
      return `<table ${TB} width="100%" style="margin:0 0 22px 0"><tr><td align="center" style="padding:20px 16px;background:${N.box};border:1.5px dashed ${N.strass};border-radius:12px;font-family:Menlo,Consolas,'Courier New',monospace;font-size:32px;line-height:38px;font-weight:700;letter-spacing:9px;color:#ffffff;text-align:center">${esc(b.text)}</td></tr></table>`;
    case "fallback":
      return `<p style="margin:4px 0 18px 0;font-family:${F};font-size:13px;line-height:19px;color:${N.faint}">${esc(typo("Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :"))}<br><a href="${esc(safeUrl(b.url))}" style="color:${N.soft};word-break:break-all">${esc(b.url)}</a></p>`;
    case "divider":
      return `<table ${TB} width="100%" style="margin:8px 0 24px 0"><tr><td style="border-top:1px solid ${N.line};font-size:0;line-height:0">&nbsp;</td></tr></table>`;
    case "hero":
      return blockHtml({ t: "h", text: b.title }) + (b.text ? blockHtml({ t: "p", text: b.text }) : "");
  }
}

function blockText(b: Block): string {
  switch (b.t) {
    case "h": return plain(b.text) + "\n";
    case "p": return plain(b.text) + "\n";
    case "button": return plain(b.label) + " :\n" + b.url + "\n";
    case "rows": return b.rows.map(([k, v]) => `${plain(k)} : ${plain(v)}`).join("\n") + "\n";
    case "list": return b.items.map((i) => "- " + plain(i)).join("\n") + "\n";
    case "checks": return b.items.map((i) => "- " + plain(i)).join("\n") + "\n";
    case "steps": return b.items.map((s, i) => `${i + 1}. ${plain(s.title)}${s.text ? "\n   " + plain(s.text) : ""}`).join("\n") + "\n";
    case "card": return [b.kicker ? plain(b.kicker).toUpperCase() : "", plain(b.title) + (b.status ? ` (${plain(b.status.text)})` : ""), b.text ? plain(b.text) : "",
      b.date ? `${b.date.weekday} ${b.date.day} ${b.date.month}` : "", b.amount ? plain(b.amount) : "",
      ...(b.rows || []).map(([k, v]) => `${plain(k)} : ${plain(v)}`)].filter(Boolean).join("\n") + "\n";
    case "badge": return plain(b.text) + "\n";
    case "quote": return `« ${typo(b.text)} »${b.by ? "\n" + typo(b.by) : ""}\n`;
    case "hero": return plain(b.title).toUpperCase() + "\n" + (b.text ? "\n" + plain(b.text) + "\n" : "");
    case "note": return plain(b.text) + "\n";
    case "code": return b.text + "\n";
    case "fallback": return "";
    case "divider": return "----\n";
  }
}

/** Le premier bloc devient la carte héros du bandeau : un `hero`, ou à défaut un `h` promu. */
function splitHero(blocks: Block[]): { hero: Extract<Block, { t: "hero" }> | null; rest: Block[] } {
  const [first, ...rest] = blocks;
  if (first?.t === "hero") return { hero: first, rest };
  if (first?.t === "h") return { hero: { t: "hero", title: first.text }, rest };
  return { hero: null, rest: blocks };
}

function footerHtml(f: Frame): string {
  const muted = `font-family:${F};font-size:12px;line-height:19px;color:${N.faint}`;
  const lines = f.footer.filter(Boolean);
  const link = (href: string, label: string) => `<a href="${esc(href)}" style="color:${N.soft};text-decoration:underline">${esc(label)}</a>`;
  const club = lines.length
    ? `<p style="margin:0 0 2px 0;font-family:${F};font-size:13px;line-height:19px;font-weight:700;color:${N.lead}">${esc(typo(lines[0]))}</p>` +
      (lines.length > 1 ? `<p style="margin:0 0 20px 0;${muted}">${lines.slice(1).map((l) => esc(typo(l))).join("<br>")}</p>` : `<div style="height:20px;line-height:20px;font-size:0">&nbsp;</div>`)
    : "";
  const unsub = f.unsubscribeUrl
    ? `<p style="margin:14px 0 0 0;${muted}">${link(safeUrl(f.unsubscribeUrl), f.unsubscribeLabel || "Ne plus recevoir ce type d'e-mail")}` +
      (f.preferencesUrl ? ` &nbsp;·&nbsp; ${link(safeUrl(f.preferencesUrl), "Gérer mes notifications")}` : "") + `</p>`
    : "";
  return `<tr><td class="px" bgcolor="${N.page}" style="background:${N.page};padding:30px 48px 34px 48px">` + club +
    `<table ${TB}><tr><td style="vertical-align:middle;padding-right:8px;${muted}">Envoyé avec</td>` +
    `<td style="vertical-align:middle"><a href="${esc(BRAND.site)}" style="text-decoration:none"><img src="${esc(BRAND.img.logoWhite)}" width="42" height="18" alt="${esc(BRAND.name)}" style="display:block;width:42px;height:18px;border:0;color:#ffffff;font-family:${FD};font-size:14px;font-weight:800"></a></td></tr></table>` +
    `<p style="margin:6px 0 0 0;${muted}">${esc(BRAND.tagline)}</p>` +
    `<p style="margin:10px 0 0 0;${muted}">${link(BRAND.site, "stablapp.fr")} &nbsp;·&nbsp; ${link("mailto:" + BRAND.supportEmail, "Aide")} &nbsp;·&nbsp; ${link(BRAND.site + "/#mentions", "Mentions légales")}</p>` +
    `<p style="margin:10px 0 0 0;font-family:${F};font-size:11px;line-height:17px;color:${N.faint}">${esc(BRAND.name)} · ${esc(BRAND.legal)}</p>` +
    unsub + `</td></tr>`;
}

export function renderHtml(f: Frame): string {
  const { hero, rest } = splitHero(f.blocks);
  const wm = esc(BRAND.img.watermark);
  const lead = hero?.text ? `<p class="lead" style="margin:0 0 26px 0;font-family:${F};font-size:18px;line-height:29px;color:${N.lead}">${richN(hero.text)}</p>` : "";
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="dark only">
<meta name="supported-color-schemes" content="dark only">
<title>${esc(typo(f.subject))}</title>
<!--[if !mso]><!--><link href="${esc(BRAND.fontsHref)}" rel="stylesheet"><!--<![endif]-->
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><style>body,table,td,p,a,h1,h2,span{font-family:'Segoe UI',Arial,sans-serif!important}</style><![endif]-->
<style>
:root{color-scheme:dark only;supported-color-schemes:dark only}
body{margin:0;padding:0;width:100%!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;background:${N.page}}
table{border-collapse:separate;mso-table-lspace:0;mso-table-rspace:0}
img{-ms-interpolation-mode:bicubic}
a{color:${N.strass}}
@media screen and (max-width:620px){
.container{width:100%!important}.px{padding-left:24px!important;padding-right:24px!important}.outer{padding:0!important}
.hd{padding-top:28px!important;padding-bottom:38px!important;background-size:430px auto!important}.hd-gap{height:64px!important;line-height:64px!important}
.hero-title{font-size:38px!important;line-height:40px!important;letter-spacing:-1.4px!important}.lead{font-size:17px!important;line-height:27px!important}
.btn-full{width:100%!important}.amount{font-size:44px!important;line-height:48px!important}.big{font-size:72px!important;line-height:62px!important}
.card-in{padding-left:20px!important;padding-right:20px!important}.k{width:34%!important}
}
@media (prefers-color-scheme:dark){body{background:${N.page}!important}}
</style>
</head>
<body style="margin:0;padding:0;background:${N.page}">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${N.page};opacity:0">${esc(typo(f.preheader))}${"&#8204;&nbsp;".repeat(40)}</div>
<table ${TB} width="100%" bgcolor="${N.page}" style="background:${N.page}">
<tr><td align="center" class="outer" style="padding:28px 12px">
<!--[if mso]><table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0" align="center"><tr><td><![endif]-->
<table ${TB} width="600" class="container" bgcolor="${N.body}" style="width:600px;max-width:600px;background:${N.body}">
<tr><td class="px hd" bgcolor="${N.box}" background="${wm}" style="background-color:${N.box};background-image:url('${wm}');background-repeat:no-repeat;background-position:right top;background-size:600px auto;border-bottom:1px solid ${N.edge};padding:34px 48px ${hero ? 50 : 30}px 48px">${headHtml(f, hero)}</td></tr>
<tr><td class="px" bgcolor="${N.body}" style="background:${N.body};padding:40px 48px 30px 48px">
${lead}${rest.map(blockHtml).join("\n")}
</td></tr>
${footerHtml(f)}
</table>
<!--[if mso]></td></tr></table><![endif]-->
${f.pixelUrl ? `<img src="${esc(safeUrl(f.pixelUrl))}" width="1" height="1" alt="" style="display:block;width:1px;height:1px;border:0">` : ""}
</td></tr>
</table>
</body>
</html>`;
}

export function renderText(f: Frame): string {
  const body = f.blocks.map(blockText).filter(Boolean).join("\n");
  const foot = f.footer.filter(Boolean).map(plain).join("\n");
  const unsub = f.unsubscribeUrl ? `\n${f.unsubscribeLabel || "Ne plus recevoir ce type d'e-mail"} :\n${f.unsubscribeUrl}\n` : "";
  const sig = `Envoyé avec ${BRAND.name}, ${BRAND.tagline.toLowerCase()}.\n${BRAND.site}\n${BRAND.name} · ${BRAND.legal}`;
  return `${body}\n--\n${foot ? foot + "\n\n" : ""}${sig}\n${unsub}`.replace(/\n{3,}/g, "\n\n");
}
