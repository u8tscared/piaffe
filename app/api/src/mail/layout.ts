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

/** Texte enrichi minimal : **gras**. Le reste est échappé. */
function rich(s: string): string {
  return esc(typo(s)).replace(/\*\*(.+?)\*\*/g, '<strong style="color:' + C.ink + ';font-weight:600" class="dm-strong">$1</strong>');
}
const plain = (s: string) => typo(s).replace(/\*\*(.+?)\*\*/g, "$1");

const F = BRAND.fontText;
const FD = BRAND.fontDisplay;
const P = `margin:0 0 18px 0;font-family:${F};font-size:16px;line-height:26px;color:${C.text};`;
const TB = `role="presentation" border="0" cellpadding="0" cellspacing="0"`;

const TONE: Record<Tone, { fg: string; bg: string }> = {
  info: { fg: C.sapphire, bg: C.sapphireSoft },
  ok: { fg: C.ok, bg: C.okSoft },
  warn: { fg: C.warn, bg: C.warnSoft },
  bad: { fg: C.bad, bg: C.badSoft },
};

function pill(text: string, tone: Tone = "info"): string {
  const t = TONE[tone];
  return `<table ${TB} style="display:inline-table"><tr><td class="dm-pill-${tone}" style="padding:5px 11px;border-radius:999px;background:${t.bg};font-family:${F};font-size:12px;line-height:16px;font-weight:700;color:${t.fg};letter-spacing:0.2px;white-space:nowrap">${esc(typo(text))}</td></tr></table>`;
}

function button(b: { label: string; url: string; variant?: "primary" | "secondary" }): string {
  const url = esc(safeUrl(b.url));
  const label = esc(typo(b.label));
  const sec = b.variant === "secondary";
  const w = Math.min(520, Math.max(220, Math.round(b.label.length * 9.2 + 72)));
  const bg = sec ? "#ffffff" : C.sapphire;
  const fg = sec ? C.ink : "#ffffff";
  return `<table ${TB} class="btn-full" style="margin:6px 0 ${sec ? 22 : 14}px 0"><tr><td align="center" bgcolor="${bg}" class="${sec ? "dm-btn2" : "dm-btn"}" style="border-radius:12px;background:${bg};${sec ? `border:1.5px solid ${C.line};` : ""}">` +
    `<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" xmlns:w="urn:schemas-microsoft-com:office:word" href="${url}" style="height:52px;v-text-anchor:middle;width:${w}px" arcsize="23%" ${sec ? `strokecolor="${C.line}" strokeweight="1.5px"` : 'stroke="f"'} fillcolor="${bg}"><w:anchorlock/><center style="color:${fg};font-family:Segoe UI,Arial,sans-serif;font-size:16px;font-weight:bold">${label}</center></v:roundrect><![endif]-->` +
    `<!--[if !mso]><!--><a href="${url}" target="_blank" class="${sec ? "dm-btn2-a" : "dm-btn-a"}" style="display:block;padding:16px 30px;font-family:${F};font-size:16px;line-height:20px;font-weight:600;color:${fg};text-decoration:none;border-radius:12px;text-align:center;mso-hide:all">${label}${sec ? "" : "&nbsp;&nbsp;&#8594;"}</a><!--<![endif]-->` +
    `</td></tr></table>`;
}

function rowsHtml(rows: [string, string][]): string {
  return rows.map(([k, v], i) =>
    `<tr><td class="dm-muted${i ? " dm-line" : ""}" style="padding:12px 0;${i ? `border-top:1px solid ${C.line};` : ""}font-family:${F};font-size:14px;line-height:20px;color:${C.muted};vertical-align:top;width:40%">${esc(typo(k))}</td>` +
    `<td align="right" class="dm-strong${i ? " dm-line" : ""}" style="padding:12px 0 12px 12px;${i ? `border-top:1px solid ${C.line};` : ""}font-family:${F};font-size:15px;line-height:20px;color:${C.ink};font-weight:600;vertical-align:top;text-align:right">${rich(v)}</td></tr>`).join("");
}

function heroHtml(b: Extract<Block, { t: "hero" }>): string {
  const mark = b.icon
    ? `<img src="${esc(iconUrl(b.icon))}" width="28" height="28" alt="" style="display:block;margin:0 auto;width:28px;height:28px;border:0">`
    : b.initial ? `<span style="font-family:${FD};font-size:24px;line-height:28px;font-weight:800;color:#ffffff">${esc(b.initial.slice(0, 2))}</span>` : "";
  return (mark ? `<table ${TB} style="margin:0 0 22px 0"><tr><td width="56" height="56" align="center" valign="middle" bgcolor="${C.sapphire}" style="width:56px;height:56px;border-radius:18px;background:${C.sapphire};text-align:center;vertical-align:middle">${mark}</td></tr></table>` : "") +
    (b.badge ? `<p style="margin:0 0 12px 0;font-family:${F};font-size:12px;line-height:16px;font-weight:700;letter-spacing:1.4px;text-transform:uppercase;color:${C.strass}">${esc(typo(b.badge))}</p>` : "") +
    `<h1 class="hero-title" style="margin:0;font-family:${FD};font-size:34px;line-height:38px;font-weight:800;color:#ffffff;letter-spacing:-1px">${rich(b.title).replace(/color:#0a1636/g, "color:#ffffff")}</h1>` +
    (b.text ? `<p class="hero-text" style="margin:14px 0 0 0;font-family:${F};font-size:17px;line-height:26px;color:${C.heroText}">${esc(typo(b.text)).replace(/\*\*(.+?)\*\*/g, '<strong style="color:#ffffff;font-weight:600">$1</strong>')}</p>` : "");
}

function blockHtml(b: Block): string {
  switch (b.t) {
    case "h":
      return `<h2 class="dm-h" style="margin:8px 0 14px 0;font-family:${FD};font-size:22px;line-height:28px;font-weight:800;color:${C.ink};letter-spacing:-0.5px">${rich(b.text)}</h2>`;
    case "p":
      return `<p class="${b.muted ? "dm-muted" : "dm-text"}" style="${P}${b.muted ? `color:${C.muted};font-size:14px;line-height:22px;` : ""}">${rich(b.text)}</p>`;
    case "button":
      return button(b);
    case "rows":
      return `<table ${TB} width="100%" class="dm-panel" style="margin:0 0 22px 0;background:${C.panel};border-radius:14px"><tr><td style="padding:4px 18px">` +
        `<table ${TB} width="100%">${rowsHtml(b.rows)}</table></td></tr></table>`;
    case "list":
      return `<table ${TB} width="100%" style="margin:0 0 18px 0">` +
        b.items.map((it) => `<tr><td width="20" class="dm-link" style="vertical-align:top;padding:2px 0 8px 0;font-family:${F};font-size:16px;line-height:24px;color:${C.sapphire};font-weight:700">&#8226;</td><td class="dm-text" style="padding:2px 0 8px 0;font-family:${F};font-size:16px;line-height:24px;color:${C.text}">${rich(it)}</td></tr>`).join("") +
        `</table>`;
    case "checks":
      return `<table ${TB} width="100%" style="margin:0 0 20px 0">` +
        b.items.map((it) => `<tr><td width="34" style="vertical-align:top;padding:0 0 12px 0"><table ${TB}><tr><td width="22" height="22" align="center" valign="middle" class="dm-pill-info" style="width:22px;height:22px;border-radius:11px;background:${C.sapphireSoft};font-family:Arial,sans-serif;font-size:13px;line-height:22px;font-weight:700;color:${C.sapphire};text-align:center">&#10003;</td></tr></table></td>` +
          `<td class="dm-text" style="padding:0 0 12px 0;font-family:${F};font-size:16px;line-height:23px;color:${C.text};vertical-align:top">${rich(it)}</td></tr>`).join("") +
        `</table>`;
    case "steps":
      return `<table ${TB} width="100%" style="margin:4px 0 20px 0">` +
        b.items.map((s, i) => `<tr><td width="48" style="vertical-align:top;padding:0 0 ${i === b.items.length - 1 ? 0 : 18}px 0"><table ${TB}><tr><td width="34" height="34" align="center" valign="middle" bgcolor="${C.navy}" class="dm-step" style="width:34px;height:34px;border-radius:12px;background:${C.navy};font-family:${FD};font-size:16px;line-height:34px;font-weight:800;color:#ffffff;text-align:center">${i + 1}</td></tr></table></td>` +
          `<td style="vertical-align:top;padding:5px 0 ${i === b.items.length - 1 ? 0 : 18}px 0"><p class="dm-h" style="margin:0;font-family:${F};font-size:16px;line-height:23px;font-weight:700;color:${C.ink}">${rich(s.title)}</p>` +
          (s.text ? `<p class="dm-muted" style="margin:3px 0 0 0;font-family:${F};font-size:14px;line-height:21px;color:${C.muted}">${rich(s.text)}</p>` : "") + `</td></tr>`).join("") +
        `</table>`;
    case "card": {
      const tile = b.date
        ? `<td width="76" style="vertical-align:top;padding:0 16px 0 0"><table ${TB}><tr><td width="64" align="center" bgcolor="${C.navy}" style="width:64px;border-radius:14px;background:${C.navy};padding:9px 0 10px 0;text-align:center">` +
          `<p style="margin:0;font-family:${F};font-size:11px;line-height:14px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${C.strass}">${esc(b.date.weekday)}</p>` +
          `<p style="margin:1px 0;font-family:${FD};font-size:26px;line-height:30px;font-weight:800;color:#ffffff">${esc(b.date.day)}</p>` +
          `<p style="margin:0;font-family:${F};font-size:12px;line-height:14px;color:${C.heroText}">${esc(b.date.month)}</p></td></tr></table></td>`
        : "";
      const head = `<table ${TB} width="100%"><tr>${tile}<td style="vertical-align:middle">` +
        (b.kicker ? `<p class="dm-muted" style="margin:0 0 4px 0;font-family:${F};font-size:12px;line-height:16px;font-weight:700;letter-spacing:1.2px;text-transform:uppercase;color:${C.muted}">${esc(typo(b.kicker))}</p>` : "") +
        `<p class="dm-h" style="margin:0;font-family:${FD};font-size:21px;line-height:26px;font-weight:800;color:${C.ink};letter-spacing:-0.4px">${rich(b.title)}</p>` +
        (b.text ? `<p class="dm-muted" style="margin:4px 0 0 0;font-family:${F};font-size:14px;line-height:20px;color:${C.muted}">${rich(b.text)}</p>` : "") +
        `</td>${b.status ? `<td align="right" style="vertical-align:top;padding-left:8px">${pill(b.status.text, b.status.tone)}</td>` : ""}</tr></table>`;
      const amount = b.amount ? `<p class="dm-h amount" style="margin:18px 0 2px 0;font-family:${FD};font-size:40px;line-height:44px;font-weight:800;color:${C.ink};letter-spacing:-1.2px">${esc(typo(b.amount))}</p>` : "";
      const rows = b.rows && b.rows.length ? `<table ${TB} width="100%" style="margin-top:14px">${rowsHtml(b.rows)}</table>` : "";
      return `<table ${TB} width="100%" class="dm-card2" style="margin:0 0 24px 0;border:1px solid ${C.line};border-radius:18px;background:#ffffff"><tr><td style="padding:20px 20px ${rows ? 8 : 20}px 20px">${head}${amount}${rows}</td></tr></table>`;
    }
    case "badge":
      return `<table ${TB} style="margin:0 0 16px 0"><tr><td>${pill(b.text, b.tone)}</td></tr></table>`;
    case "quote":
      return `<table ${TB} width="100%" class="dm-panel" style="margin:0 0 22px 0;background:${C.panel};border-radius:16px"><tr><td style="padding:20px 22px 18px 22px">` +
        `<p style="margin:0 0 4px 0;font-family:Georgia,serif;font-size:40px;line-height:28px;color:${C.sapphire}" class="dm-link">&#8220;</p>` +
        `<p class="dm-text" style="margin:0;font-family:${F};font-size:17px;line-height:27px;color:${C.ink};white-space:pre-line">${esc(typo(b.text))}</p>` +
        (b.by ? `<p class="dm-muted" style="margin:12px 0 0 0;font-family:${F};font-size:14px;line-height:20px;color:${C.muted};font-weight:600">${esc(typo(b.by))}</p>` : "") +
        `</td></tr></table>`;
    case "note": {
      const t = TONE[b.tone || "info"];
      return `<table ${TB} width="100%" style="margin:0 0 22px 0"><tr><td class="dm-panel" style="padding:15px 18px;border-left:4px solid ${t.fg};background:${C.panel};border-radius:4px 14px 14px 4px;font-family:${F};font-size:15px;line-height:23px;color:${C.text}"><span class="dm-text">${rich(b.text)}</span></td></tr></table>`;
    }
    case "code":
      return `<table ${TB} width="100%" style="margin:0 0 22px 0"><tr><td align="center" class="dm-panel dm-strong" style="padding:18px 16px;background:${C.sapphireSoft};border:1.5px dashed ${C.sapphire};border-radius:14px;font-family:Menlo,Consolas,'Courier New',monospace;font-size:30px;line-height:36px;font-weight:700;letter-spacing:8px;color:${C.ink};text-align:center">${esc(b.text)}</td></tr></table>`;
    case "fallback":
      return `<p class="dm-muted" style="margin:4px 0 18px 0;font-family:${F};font-size:13px;line-height:19px;color:${C.muted}">${esc(typo("Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :"))}<br><a href="${esc(safeUrl(b.url))}" class="dm-link" style="color:${C.sapphire};word-break:break-all">${esc(b.url)}</a></p>`;
    case "divider":
      return `<table ${TB} width="100%" style="margin:8px 0 24px 0"><tr><td class="dm-line" style="border-top:1px solid ${C.line};font-size:0;line-height:0">&nbsp;</td></tr></table>`;
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

function headerHtml(f: Frame): string {
  if (!f.isClub) {
    const logo = f.logoUrl
      ? `<img src="${esc(safeUrl(f.logoUrl))}" width="${BRAND.logoWidth}" height="${BRAND.logoHeight}" alt="${esc(BRAND.name)}" style="display:block;width:${BRAND.logoWidth}px;height:${BRAND.logoHeight}px;border:0;outline:none;text-decoration:none;color:#ffffff;font-family:${FD};font-size:22px;font-weight:800">`
      : `<span style="font-family:${FD};font-size:24px;line-height:28px;font-weight:800;color:#ffffff;letter-spacing:-0.8px">${esc(BRAND.name.toLowerCase())}</span>`;
    return `<table ${TB} width="100%"><tr><td style="vertical-align:middle">${logo}</td></tr></table>`;
  }
  const mark = f.logoUrl
    ? `<td width="52" style="vertical-align:middle;padding-right:12px"><table ${TB}><tr><td width="44" height="44" align="center" valign="middle" bgcolor="#ffffff" style="width:44px;height:44px;border-radius:12px;background:#ffffff;text-align:center"><img src="${esc(safeUrl(f.logoUrl))}" width="34" height="34" alt="" style="display:block;margin:0 auto;width:34px;height:34px;border:0;object-fit:contain"></td></tr></table></td>`
    : `<td width="52" style="vertical-align:middle;padding-right:12px"><table ${TB}><tr><td width="44" height="44" align="center" valign="middle" bgcolor="${C.sapphire}" style="width:44px;height:44px;border-radius:12px;background:${C.sapphire};font-family:${FD};font-size:21px;line-height:44px;font-weight:800;color:#ffffff;text-align:center">${esc(initialOf(f.headerName))}</td></tr></table></td>`;
  return `<table ${TB} width="100%"><tr>${mark}<td style="vertical-align:middle">` +
    `<p style="margin:0;font-family:${F};font-size:16px;line-height:20px;font-weight:700;color:#ffffff">${esc(typo(f.headerName))}</p>` +
    `<p style="margin:2px 0 0 0;font-family:${F};font-size:12px;line-height:16px;color:${C.strass};font-weight:500">via ${esc(BRAND.name)}</p></td></tr></table>`;
}

function footerHtml(f: Frame): string {
  const muted = `font-family:${F};font-size:12px;line-height:19px;color:${C.muted}`;
  const lines = f.footer.filter(Boolean);
  const club = lines.length
    ? `<p class="dm-strong" style="margin:0 0 2px 0;font-family:${F};font-size:13px;line-height:19px;font-weight:700;color:${C.ink}">${esc(typo(lines[0]))}</p>` +
      (lines.length > 1 ? `<p class="dm-muted" style="margin:0 0 22px 0;${muted}">${lines.slice(1).map((l) => esc(typo(l))).join("<br>")}</p>` : `<div style="height:22px;line-height:22px;font-size:0">&nbsp;</div>`)
    : "";
  const link = (href: string, label: string) => `<a href="${esc(href)}" class="dm-link" style="color:${C.muted};text-decoration:underline">${esc(label)}</a>`;
  const unsub = f.unsubscribeUrl
    ? `<p class="dm-muted" style="margin:14px 0 0 0;${muted}">${link(safeUrl(f.unsubscribeUrl), f.unsubscribeLabel || "Ne plus recevoir ce type d'e-mail")}` +
      (f.preferencesUrl ? ` &nbsp;·&nbsp; ${link(safeUrl(f.preferencesUrl), "Gérer mes notifications")}` : "") + `</p>`
    : "";
  return `<tr><td align="center" class="px" style="padding:30px 40px 8px 40px;text-align:center">` + club +
    `<table ${TB} align="center" style="margin:0 auto"><tr>` +
    `<td class="dm-muted" style="vertical-align:middle;padding-right:7px;${muted}">Envoyé avec</td>` +
    `<td style="vertical-align:middle"><a href="${esc(BRAND.site)}" style="text-decoration:none"><img src="${esc(BRAND.img.logoSapphire)}" width="47" height="20" alt="${esc(BRAND.name)}" style="display:block;width:47px;height:20px;border:0;color:${C.sapphire};font-family:${FD};font-size:15px;font-weight:800"></a></td>` +
    `</tr></table>` +
    `<p class="dm-muted" style="margin:6px 0 0 0;${muted}">${esc(BRAND.tagline)}</p>` +
    `<p class="dm-muted" style="margin:10px 0 0 0;${muted}">${link(BRAND.site, "stablapp.fr")} &nbsp;·&nbsp; ${link("mailto:" + BRAND.supportEmail, "Aide")} &nbsp;·&nbsp; ${link(BRAND.site + "/#mentions", "Mentions légales")}</p>` +
    `<p class="dm-muted" style="margin:10px 0 0 0;font-family:${F};font-size:11px;line-height:17px;color:${C.muted}">${esc(BRAND.name)} · ${esc(BRAND.legal)}</p>` +
    unsub + `</td></tr>`;
}

export function renderHtml(f: Frame): string {
  const { hero, rest } = splitHero(f.blocks);
  return `<!DOCTYPE html>
<html lang="fr" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no, date=no, address=no, email=no">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(typo(f.subject))}</title>
<!--[if !mso]><!--><link href="${esc(BRAND.fontsHref)}" rel="stylesheet"><!--<![endif]-->
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><style>body,table,td,p,a,h1,h2,span{font-family:'Segoe UI',Arial,sans-serif!important}</style><![endif]-->
<style>
:root{color-scheme:light dark;supported-color-schemes:light dark}
body{margin:0;padding:0;width:100%!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table{border-collapse:separate;mso-table-lspace:0;mso-table-rspace:0}
img{-ms-interpolation-mode:bicubic}
a{color:${C.sapphire}}
@media screen and (max-width:620px){
.container{width:100%!important}.px{padding-left:24px!important;padding-right:24px!important}
.hero-title{font-size:29px!important;line-height:33px!important}.hero-text{font-size:16px!important;line-height:24px!important}
.btn-full{width:100%!important}.amount{font-size:34px!important;line-height:38px!important}.outer{padding:12px 8px!important}
}
@media (prefers-color-scheme:dark){
.dm-bg{background:${C.darkBg}!important}.dm-card{background:${C.darkCard}!important}.dm-card2{background:${C.darkCard}!important;border-color:${C.darkLine}!important}
.dm-panel{background:${C.darkPanel}!important;border-color:${C.darkLine}!important}.dm-h,.dm-strong{color:#ffffff!important}.dm-text{color:${C.darkText}!important}
.dm-muted{color:${C.darkMuted}!important}.dm-link{color:${C.darkLink}!important}.dm-line{border-color:${C.darkLine}!important}
.dm-step{background:${C.sapphire}!important}.dm-pill-info{background:#1d2a5c!important;color:${C.darkLink}!important}
.dm-btn2{background:${C.darkCard}!important;border-color:${C.darkLine}!important}.dm-btn2-a{color:#ffffff!important}
}
[data-ogsc] .dm-h,[data-ogsc] .dm-strong{color:#ffffff!important}[data-ogsc] .dm-text{color:${C.darkText}!important}[data-ogsc] .dm-muted{color:${C.darkMuted}!important}[data-ogsc] .dm-link{color:${C.darkLink}!important}
</style>
</head>
<body class="dm-bg" style="margin:0;padding:0;background:${C.bg}">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.bg};opacity:0">${esc(typo(f.preheader))}${"&#8204;&nbsp;".repeat(40)}</div>
<table ${TB} width="100%" class="dm-bg" style="background:${C.bg}">
<tr><td align="center" class="outer" style="padding:28px 12px">
<!--[if mso]><table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0" align="center"><tr><td><![endif]-->
<table ${TB} width="600" class="container" style="width:600px;max-width:600px">
<tr><td>
<table ${TB} width="100%" style="border-radius:22px">
<tr><td class="px" bgcolor="${C.navy}" style="background:${C.navy};border-radius:22px 22px 0 0;padding:28px 40px ${hero ? 30 : 26}px 40px">${headerHtml(f)}</td></tr>
${hero ? `<tr><td class="px" bgcolor="${C.navy}" style="background:${C.navy};padding:6px 40px 40px 40px">${heroHtml(hero)}</td></tr>` : ""}
<tr><td style="font-size:0;line-height:0"><table ${TB} width="100%"><tr><td width="62%" height="4" bgcolor="${C.sapphire}" style="height:4px;background:${C.sapphire};font-size:0;line-height:0">&nbsp;</td><td width="24%" height="4" bgcolor="${C.strass}" style="height:4px;background:${C.strass};font-size:0;line-height:0">&nbsp;</td><td width="14%" height="4" bgcolor="${C.heroText}" style="height:4px;background:${C.heroText};font-size:0;line-height:0">&nbsp;</td></tr></table></td></tr>
<tr><td class="dm-card px" bgcolor="${C.card}" style="background:${C.card};border-radius:0 0 22px 22px;padding:36px 40px 20px 40px">
${rest.map(blockHtml).join("\n")}
</td></tr>
</table>
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
