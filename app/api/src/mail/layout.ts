/*
 * Mise en page des e-mails : un petit langage de blocs rendu deux fois, en HTML (tables, styles en ligne,
 * compatible Outlook, Gmail et Apple Mail, mode sombre) et en texte brut. Ainsi les deux versions
 * disent toujours la même chose.
 */
import { BRAND } from "./brand";

export type Tone = "info" | "ok" | "warn" | "bad";
export type Block =
  | { t: "h"; text: string }
  | { t: "p"; text: string; muted?: boolean }
  | { t: "button"; label: string; url: string }
  | { t: "rows"; rows: [string, string][] }
  | { t: "list"; items: string[] }
  | { t: "note"; text: string; tone?: Tone }
  | { t: "code"; text: string }
  | { t: "fallback"; url: string }
  | { t: "divider" };

export interface Frame {
  subject: string;
  preheader: string;
  blocks: Block[];
  /** Nom affiché en tête et en signature (club ou marque). */
  headerName: string;
  logoUrl?: string | null;
  /** Lignes du pied de page (adresse du club, contact). */
  footer: string[];
  /** Lien de désinscription (e-mails non essentiels). */
  unsubscribeUrl?: string | null;
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

/** Texte enrichi minimal : **gras**. Le reste est échappé. */
function rich(s: string): string {
  return esc(typo(s)).replace(/\*\*(.+?)\*\*/g, '<strong style="color:' + C.ink + ';font-weight:600" class="dm-strong">$1</strong>');
}
const plain = (s: string) => typo(s).replace(/\*\*(.+?)\*\*/g, "$1");

const F = BRAND.font;
const P = `margin:0 0 16px 0;font-family:${F};font-size:16px;line-height:24px;color:${C.text};`;

function blockHtml(b: Block): string {
  switch (b.t) {
    case "h":
      return `<h1 class="dm-h" style="margin:0 0 16px 0;font-family:${F};font-size:24px;line-height:32px;font-weight:700;color:${C.ink};letter-spacing:-0.2px">${rich(b.text)}</h1>`;
    case "p":
      return `<p class="${b.muted ? "dm-muted" : "dm-text"}" style="${P}${b.muted ? `color:${C.muted};font-size:14px;line-height:21px;` : ""}">${rich(b.text)}</p>`;
    case "button": {
      const url = esc(safeUrl(b.url));
      return `<table role="presentation" border="0" cellpadding="0" cellspacing="0" style="margin:8px 0 24px 0"><tr><td align="center" bgcolor="${C.ink}" class="dm-btn" style="border-radius:10px;background:${C.ink}">` +
        `<!--[if mso]><v:roundrect xmlns:v="urn:schemas-microsoft-com:vml" href="${url}" style="height:48px;v-text-anchor:middle;width:280px" arcsize="20%" stroke="f" fillcolor="${C.ink}"><center style="color:#ffffff;font-family:Segoe UI,Arial,sans-serif;font-size:16px;font-weight:bold">${esc(typo(b.label))}</center></v:roundrect><![endif]-->` +
        `<!--[if !mso]><!--><a href="${url}" target="_blank" style="display:inline-block;padding:14px 28px;font-family:${F};font-size:16px;line-height:20px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;background:${C.ink}">${esc(typo(b.label))}</a><!--<![endif]-->` +
        `</td></tr></table>`;
    }
    case "rows":
      return `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="dm-panel" style="margin:0 0 20px 0;background:${C.bg};border-radius:12px">` +
        b.rows.map(([k, v], i) =>
          `<tr><td class="dm-muted" style="padding:${i ? 8 : 14}px 16px ${i === b.rows.length - 1 ? 14 : 0}px 16px;font-family:${F};font-size:14px;line-height:20px;color:${C.muted};width:42%;vertical-align:top">${esc(typo(k))}</td>` +
          `<td class="dm-strong" style="padding:${i ? 8 : 14}px 16px ${i === b.rows.length - 1 ? 14 : 0}px 0;font-family:${F};font-size:14px;line-height:20px;color:${C.ink};font-weight:600;vertical-align:top">${rich(v)}</td></tr>`).join("") +
        `</table>`;
    case "list":
      return `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 16px 0">` +
        b.items.map((it) => `<tr><td width="22" style="vertical-align:top;padding:2px 0 8px 0;font-family:${F};font-size:16px;line-height:24px;color:${C.sapphire}" class="dm-link">&#8226;</td><td class="dm-text" style="padding:2px 0 8px 0;font-family:${F};font-size:16px;line-height:24px;color:${C.text}">${rich(it)}</td></tr>`).join("") +
        `</table>`;
    case "note": {
      const tone = b.tone || "info";
      const col = tone === "ok" ? C.ok : tone === "warn" ? C.warn : tone === "bad" ? C.bad : C.sapphire;
      return `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:0 0 20px 0"><tr><td class="dm-panel" style="padding:14px 16px;border-left:4px solid ${col};background:${C.bg};border-radius:0 10px 10px 0;font-family:${F};font-size:15px;line-height:22px;color:${C.text}">${rich(b.text)}</td></tr></table>`;
    }
    case "code":
      return `<p class="dm-panel dm-strong" style="margin:0 0 20px 0;padding:14px 16px;background:${C.bg};border-radius:10px;font-family:Menlo,Consolas,monospace;font-size:22px;letter-spacing:4px;color:${C.ink};text-align:center">${esc(b.text)}</p>`;
    case "fallback":
      return `<p class="dm-muted" style="margin:0 0 16px 0;font-family:${F};font-size:13px;line-height:19px;color:${C.muted}">${esc(typo("Si le bouton ne fonctionne pas, copiez ce lien dans votre navigateur :"))}<br><a href="${esc(safeUrl(b.url))}" class="dm-link" style="color:${C.sapphire};word-break:break-all">${esc(b.url)}</a></p>`;
    case "divider":
      return `<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" style="margin:8px 0 24px 0"><tr><td class="dm-line" style="border-top:1px solid ${C.line};font-size:0;line-height:0">&nbsp;</td></tr></table>`;
  }
}

function blockText(b: Block): string {
  switch (b.t) {
    case "h": return plain(b.text) + "\n";
    case "p": return plain(b.text) + "\n";
    case "button": return plain(b.label) + " :\n" + b.url + "\n";
    case "rows": return b.rows.map(([k, v]) => `${plain(k)} : ${plain(v)}`).join("\n") + "\n";
    case "list": return b.items.map((i) => "- " + plain(i)).join("\n") + "\n";
    case "note": return plain(b.text) + "\n";
    case "code": return b.text + "\n";
    case "fallback": return "";
    case "divider": return "----\n";
  }
}

export function renderHtml(f: Frame): string {
  const logo = f.logoUrl
    ? `<img src="${esc(safeUrl(f.logoUrl))}" alt="${esc(f.headerName)}" height="${BRAND.logoHeight}" style="display:block;height:${BRAND.logoHeight}px;width:auto;max-width:220px;border:0;outline:none;text-decoration:none">`
    : `<span class="dm-strong" style="font-family:${F};font-size:20px;line-height:28px;font-weight:700;color:${C.ink};letter-spacing:-0.3px">${esc(f.headerName)}</span>`;
  const foot = f.footer.filter(Boolean).map((l) => esc(typo(l))).join("<br>");
  const unsub = f.unsubscribeUrl
    ? `<br><br><a href="${esc(safeUrl(f.unsubscribeUrl))}" class="dm-link" style="color:${C.muted};text-decoration:underline">${esc("Ne plus recevoir ce type d'e-mail")}</a>` +
      (f.preferencesUrl ? ` &nbsp;·&nbsp; <a href="${esc(safeUrl(f.preferencesUrl))}" class="dm-link" style="color:${C.muted};text-decoration:underline">${esc("Gérer mes notifications")}</a>` : "")
    : "";
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
<!--[if mso]><noscript><xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml></noscript><![endif]-->
<style>
:root{color-scheme:light dark;supported-color-schemes:light dark}
body{margin:0;padding:0;width:100%!important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
table{border-collapse:collapse;mso-table-lspace:0;mso-table-rspace:0}
img{-ms-interpolation-mode:bicubic}
a{color:${C.sapphire}}
@media screen and (max-width:620px){.container{width:100%!important}.px{padding-left:20px!important;padding-right:20px!important}}
@media (prefers-color-scheme:dark){
.dm-bg{background:${C.darkBg}!important}.dm-card{background:${C.darkCard}!important;border-color:${C.darkLine}!important}
.dm-panel{background:#1b2340!important}.dm-h,.dm-strong{color:#ffffff!important}.dm-text{color:${C.darkText}!important}
.dm-muted{color:${C.darkMuted}!important}.dm-link{color:${C.darkLink}!important}.dm-line{border-color:${C.darkLine}!important}
.dm-btn,.dm-btn a{background:#ffffff!important;color:${C.ink}!important}
}
[data-ogsc] .dm-h,[data-ogsc] .dm-strong{color:#ffffff!important}[data-ogsc] .dm-text{color:${C.darkText}!important}[data-ogsc] .dm-muted{color:${C.darkMuted}!important}
</style>
</head>
<body class="dm-bg" style="margin:0;padding:0;background:${C.bg}">
<div style="display:none;max-height:0;overflow:hidden;mso-hide:all;font-size:1px;line-height:1px;color:${C.bg};opacity:0">${esc(typo(f.preheader))}${"&#8204;&nbsp;".repeat(40)}</div>
<table role="presentation" width="100%" border="0" cellpadding="0" cellspacing="0" class="dm-bg" style="background:${C.bg}">
<tr><td align="center" style="padding:24px 12px">
<!--[if mso]><table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0"><tr><td><![endif]-->
<table role="presentation" width="600" border="0" cellpadding="0" cellspacing="0" class="container" style="width:600px;max-width:600px">
<tr><td class="px" style="padding:8px 32px 20px 32px">${logo}</td></tr>
<tr><td class="dm-card px" style="background:${C.card};border:1px solid ${C.line};border-radius:16px;padding:36px 32px 20px 32px">
${f.blocks.map(blockHtml).join("\n")}
</td></tr>
<tr><td class="px dm-muted" style="padding:20px 32px 8px 32px;font-family:${F};font-size:12px;line-height:18px;color:${C.muted}">${foot}${unsub}</td></tr>
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
  const unsub = f.unsubscribeUrl ? `\nNe plus recevoir ce type d'e-mail :\n${f.unsubscribeUrl}\n` : "";
  return `${body}\n--\n${foot}\n${unsub}`.replace(/\n{3,}/g, "\n\n");
}
