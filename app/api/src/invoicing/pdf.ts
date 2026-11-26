import { PDFDocument, PDFName, PDFHexString, PDFString, PDFArray, PDFDict, rgb, type PDFFont, type PDFPage, type PDFImage } from "pdf-lib";
import fontkit from "@pdf-lib/fontkit";
import { interFonts } from "./fonts";
import { srgbIcc } from "./icc";
import { fmtEur, fmtRate, fmtDateFr, CATEGORIES } from "./catalog";
import type { Snapshot } from "./snapshot";
import type { Address } from "./settings";
import { esc } from "./cii";

/**
 * PDF Factur-X : PDF/A-3b lisible (Inter embarquée, couleurs sRGB, OutputIntent avec profil ICC) qui porte le XML CII
 * en pièce jointe associée « factur-x.xml » (AFRelationship /Alternative, profil EN 16931) et les métadonnées XMP
 * Factur-X. Rendu déterministe à partir du snapshot figé : régénérer une facture donne le même contenu.
 */

const C = {
  ink: rgb(0.039, 0.086, 0.212), sapphire: rgb(0.122, 0.31, 0.82), soft: rgb(0.91, 0.933, 0.988),
  text: rgb(0.169, 0.208, 0.314), muted: rgb(0.42, 0.451, 0.565), line: rgb(0.89, 0.902, 0.933), white: rgb(1, 1, 1),
};
const A4 = { w: 595.28, h: 841.89 };
const M = 44;

export interface PdfOptions { logo?: { bytes: Uint8Array; type: "png" | "jpg" } | null; createdAt?: Date }

const TITLES: Record<Snapshot["kind"], string> = { invoice: "Facture", deposit: "Facture d'acompte", credit_note: "Avoir" };

function addrLines(a: Address | null | undefined): string[] {
  if (!a) return [];
  const l = [a.line1, a.line2, [a.zip, a.city].filter(Boolean).join(" ")].filter((x) => x && String(x).trim()) as string[];
  if (a.country && !/^(fr|france)$/i.test(a.country)) l.push(a.country);
  return l;
}

export async function renderInvoicePdf(s: Snapshot, xml: string, opts: PdfOptions = {}): Promise<Uint8Array> {
  const created = opts.createdAt || new Date(s.issue_date + "T12:00:00Z");
  const doc = await PDFDocument.create({ updateMetadata: false });
  doc.registerFontkit(fontkit);
  const f = interFonts();
  const reg = await doc.embedFont(f.regular, { subset: false });
  const bold = await doc.embedFont(f.semibold, { subset: false });
  const charset = new Set(reg.getCharacterSet());
  const clean = (t: unknown) => [...String(t ?? "").replace(/[\r\n\t]+/g, " ")].map((ch) => (charset.has(ch.codePointAt(0)!) ? ch : ch === "’" ? "'" : "?")).join("");
  let logo: PDFImage | null = null;
  if (opts.logo) { try { logo = opts.logo.type === "png" ? await doc.embedPng(opts.logo.bytes) : await doc.embedJpg(opts.logo.bytes); } catch { logo = null; } }

  const title = `${TITLES[s.kind]} ${s.number}`;
  const pages: PDFPage[] = [];
  let page!: PDFPage; let y = 0;

  const text = (p: PDFPage, t: string, x: number, yy: number, o: { size?: number; font?: PDFFont; color?: any; align?: "left" | "right" } = {}) => {
    const size = o.size ?? 9; const font = o.font ?? reg; const str = clean(t);
    const w = font.widthOfTextAtSize(str, size);
    p.drawText(str, { x: o.align === "right" ? x - w : x, y: yy, size, font, color: o.color ?? C.text });
  };
  const wrap = (t: string, width: number, size: number, font: PDFFont = reg): string[] => {
    const words = clean(t).split(/ +/); const out: string[] = []; let cur = "";
    for (const w of words) {
      const cand = cur ? cur + " " + w : w;
      if (font.widthOfTextAtSize(cand, size) <= width) cur = cand;
      else { if (cur) out.push(cur); cur = w; while (font.widthOfTextAtSize(cur, size) > width && cur.length > 1) { let k = cur.length - 1; while (k > 1 && font.widthOfTextAtSize(cur.slice(0, k), size) > width) k--; out.push(cur.slice(0, k)); cur = cur.slice(k); } }
    }
    if (cur) out.push(cur);
    return out.length ? out : [""];
  };

  const newPage = (first: boolean) => {
    page = doc.addPage([A4.w, A4.h]); pages.push(page);
    y = A4.h - M;
    if (!first) {
      text(page, clean(s.seller.trade_name || s.seller.name), M, y - 10, { size: 10, font: bold, color: C.ink });
      text(page, title + " (suite)", A4.w - M, y - 10, { size: 10, font: bold, color: C.ink, align: "right" });
      y -= 34;
    }
  };

  // ---------- En-tête ----------
  newPage(true);
  let lx = M;
  if (logo) {
    const h = 40; const w = Math.min(140, (logo.width / logo.height) * h);
    page.drawImage(logo, { x: M, y: y - h, width: w, height: (w / logo.width) * logo.height });
    lx = M; y -= h + 10;
  }
  const sellerTitle = s.seller.trade_name ? `${s.seller.trade_name}` : s.seller.name;
  text(page, sellerTitle, lx, y - 14, { size: 15, font: bold, color: C.ink });
  let sy = y - 30;
  const sellerLines = [s.seller.trade_name ? s.seller.name : null, ...addrLines(s.seller.address), s.seller.email, s.seller.phone].filter(Boolean) as string[];
  for (const l of sellerLines) { text(page, l, lx, sy, { size: 8.5, color: C.muted }); sy -= 11.5; }

  // Bloc titre à droite
  const rx = A4.w - M;
  text(page, TITLES[s.kind].toUpperCase(), rx, (logo ? y + 50 : y) - 16, { size: 18, font: bold, color: C.sapphire, align: "right" });
  let ty = (logo ? y + 50 : y) - 36;
  const meta: [string, string][] = [["Numéro", s.number], ["Date d'émission", fmtDateFr(s.issue_date)]];
  if (s.kind !== "credit_note" && s.due_date && s.totals.due > 0) meta.push(["Échéance", fmtDateFr(s.due_date)]);
  if (s.original) meta.push(["Facture d'origine", `${s.original.number} du ${fmtDateFr(s.original.date)}`]);
  for (const [k, v] of meta) {
    text(page, k, rx - 120, ty, { size: 8.5, color: C.muted, align: "right" });
    text(page, v, rx, ty, { size: 8.5, font: bold, color: C.ink, align: "right" });
    ty -= 12.5;
  }
  y = Math.min(sy, ty) - 14;

  // ---------- Client ----------
  const bw = 250; const bx = A4.w - M - bw;
  const buyerLines = [s.buyer.name, ...addrLines(s.buyer.address), s.buyer.siren ? "SIREN " + s.buyer.siren : null, s.buyer.vat ? "TVA " + s.buyer.vat : null, s.buyer.email].filter(Boolean) as string[];
  const bh = 26 + buyerLines.length * 12;
  page.drawRectangle({ x: bx, y: y - bh, width: bw, height: bh, color: C.soft, borderWidth: 0 });
  text(page, s.kind === "credit_note" ? "Avoir établi pour" : "Facturé à", bx + 12, y - 15, { size: 8, color: C.sapphire, font: bold });
  let cy = y - 29;
  buyerLines.forEach((l, i) => { text(page, l, bx + 12, cy, { size: i === 0 ? 10 : 8.5, font: i === 0 ? bold : reg, color: i === 0 ? C.ink : C.text }); cy -= 12; });

  // Détails à gauche : période, prestation, catégorie, références
  let dy = y - 15;
  const details: [string, string][] = [];
  if (s.label) details.push(["Objet", s.label]);
  if (s.period) details.push(["Période", `du ${fmtDateFr(s.period.start)} au ${fmtDateFr(s.period.end)}`]);
  if (s.service_date) details.push([s.operation_category === "goods" ? "Date de livraison" : "Date de la prestation", fmtDateFr(s.service_date)]);
  details.push(["Opération", s.operation_category === "goods" ? "Livraison de biens" : s.operation_category === "mixed" ? "Livraison de biens et prestations de services" : "Prestations de services"]);
  if (s.buyer_reference) details.push(["Votre référence", s.buyer_reference]);
  if (s.delivery_address) details.push(["Adresse de livraison", addrLines(s.delivery_address).join(", ")]);
  for (const [k, v] of details) {
    text(page, k, M, dy, { size: 7.5, color: C.muted });
    const ls = wrap(v, bx - M - 20, 8.5);
    ls.slice(0, 3).forEach((l, i) => text(page, l, M, dy - 10.5 - i * 10.5, { size: 8.5, color: C.ink }));
    dy -= 13 + Math.min(3, ls.length) * 10.5;
  }
  y = Math.min(y - bh, dy) - 18;

  // ---------- Tableau des lignes ----------
  const ttcMode = s.lines.some((l) => l.line_ttc !== l.line_ht) || s.regime !== "normal";
  const col = { label: M, qty: 340, pu: 410, vat: 455, amount: A4.w - M };
  const head = () => {
    page.drawRectangle({ x: M, y: y - 20, width: A4.w - 2 * M, height: 20, color: C.ink });
    text(page, "Désignation", col.label + 8, y - 13.5, { size: 8, font: bold, color: C.white });
    text(page, "Qté", col.qty, y - 13.5, { size: 8, font: bold, color: C.white, align: "right" });
    text(page, "Prix unit. HT", col.pu, y - 13.5, { size: 8, font: bold, color: C.white, align: "right" });
    text(page, "TVA", col.vat, y - 13.5, { size: 8, font: bold, color: C.white, align: "right" });
    text(page, "Montant HT", col.amount - 8, y - 13.5, { size: 8, font: bold, color: C.white, align: "right" });
    y -= 26;
  };
  head();
  const FOOTER_SPACE = 70;
  for (const l of s.lines) {
    const labelLines = wrap(l.label, col.qty - col.label - 50, 9, bold);
    const sub = l.description || (CATEGORIES[l.category]?.label ?? "");
    const subLines = sub ? wrap(sub, col.qty - col.label - 50, 7.5) : [];
    const h = labelLines.length * 11 + subLines.length * 9.5 + 8;
    if (y - h < M + FOOTER_SPACE) { newPage(false); head(); }
    let ly = y - 4;
    labelLines.forEach((t) => { text(page, t, col.label + 8, ly, { size: 9, font: bold, color: C.ink }); ly -= 11; });
    subLines.forEach((t) => { text(page, t, col.label + 8, ly, { size: 7.5, color: C.muted }); ly -= 9.5; });
    const q = Number.isInteger(l.quantity) ? String(l.quantity) : String(l.quantity).replace(".", ",");
    text(page, q, col.qty, y - 4, { size: 9 });
    text(page, fmtEur(Math.round(l.line_ht / l.quantity)), col.pu, y - 4, { size: 9, align: "right" });
    text(page, l.vat_category === "E" ? "Exonérée" : fmtRate(l.vat_rate_bp), col.vat, y - 4, { size: 8, color: C.muted, align: "right" });
    text(page, fmtEur(l.line_ht), col.amount - 8, y - 4, { size: 9, font: bold, color: C.ink, align: "right" });
    y -= h + 2;
    page.drawLine({ start: { x: M, y: y + 4 }, end: { x: A4.w - M, y: y + 4 }, thickness: 0.5, color: C.line });
  }
  void ttcMode;

  // ---------- Totaux et ventilation de la TVA ----------
  const totalsRows: [string, string, boolean?][] = [["Total HT", fmtEur(s.totals.ht)]];
  for (const g of s.groups) if (g.category === "S") totalsRows.push([`TVA ${fmtRate(g.rate_bp)} sur ${fmtEur(g.base)}`, fmtEur(g.vat)]);
  totalsRows.push(["Total TVA", fmtEur(s.totals.vat)]);
  totalsRows.push(["Total TTC", fmtEur(s.totals.ttc), true]);
  for (const d of s.deposits) totalsRows.push([`Acompte ${d.number}`, fmtEur(-d.amount)]);
  const blockH = totalsRows.length * 15 + 40 + s.groups.length * 12;
  if (y - blockH < M + FOOTER_SPACE) { newPage(false); }
  y -= 6;
  const tx = A4.w - M - 230;
  let yy = y;
  for (const [k, v, strong] of totalsRows) {
    text(page, k, tx, yy - 10, { size: strong ? 9.5 : 8.5, font: strong ? bold : reg, color: strong ? C.ink : C.text });
    text(page, v, A4.w - M - 8, yy - 10, { size: strong ? 9.5 : 8.5, font: strong ? bold : reg, color: C.ink, align: "right" });
    yy -= 15;
  }
  page.drawRectangle({ x: tx - 8, y: yy - 24, width: 230 + 8, height: 26, color: C.sapphire });
  const dueLabel = s.kind === "credit_note" ? "Montant de l'avoir" : s.totals.due <= 0 ? "Net à payer (réglée)" : "Net à payer";
  text(page, dueLabel, tx, yy - 15, { size: 10, font: bold, color: C.white });
  text(page, fmtEur(s.totals.due), A4.w - M - 8, yy - 15, { size: 11, font: bold, color: C.white, align: "right" });
  const totalsBottom = yy - 30;

  // Ventilation à gauche
  let vy = y;
  text(page, "Ventilation de la TVA", M, vy - 10, { size: 8, font: bold, color: C.sapphire }); vy -= 22;
  text(page, "Taux", M, vy, { size: 7.5, color: C.muted }); text(page, "Base HT", M + 120, vy, { size: 7.5, color: C.muted, align: "right" }); text(page, "TVA", M + 190, vy, { size: 7.5, color: C.muted, align: "right" });
  vy -= 12;
  for (const g of s.groups) {
    text(page, g.category === "E" ? "Exonérée" : fmtRate(g.rate_bp), M, vy, { size: 8.5 });
    text(page, fmtEur(g.base), M + 120, vy, { size: 8.5, align: "right" });
    text(page, fmtEur(g.vat), M + 190, vy, { size: 8.5, align: "right" });
    vy -= 12;
  }
  y = Math.min(totalsBottom, vy) - 16;

  // ---------- Paiement et mentions ----------
  const pay: string[] = [];
  if (s.kind !== "credit_note") {
    if (s.payment.method_label) pay.push("Moyen de paiement : " + s.payment.method_label + ".");
    if (s.payment.iban) pay.push("IBAN : " + s.payment.iban.replace(/(.{4})/g, "$1 ").trim() + (s.payment.bic ? "  BIC : " + s.payment.bic : ""));
    pay.push(s.payment.terms);
  }
  const mentionLines = [...pay, ...s.mentions].flatMap((m) => wrap(m, A4.w - 2 * M, 7.5));
  if (y - mentionLines.length * 10 - 20 < M + 40) { newPage(false); }
  text(page, s.kind === "credit_note" ? "Informations" : "Règlement et mentions légales", M, y, { size: 8, font: bold, color: C.sapphire });
  y -= 13;
  for (const l of mentionLines) { text(page, l, M, y, { size: 7.5, color: C.text }); y -= 10; }
  if (s.footer) { y -= 4; for (const l of wrap(s.footer, A4.w - 2 * M, 7.5)) { text(page, l, M, y, { size: 7.5, color: C.muted }); y -= 10; } }

  // ---------- Pied de page ----------
  const legal = [s.seller.name, ...s.seller.legal_lines].join(" · ");
  pages.forEach((p, i) => {
    p.drawLine({ start: { x: M, y: 40 }, end: { x: A4.w - M, y: 40 }, thickness: 0.5, color: C.line });
    wrap(legal, A4.w - 2 * M - 70, 6.8).slice(0, 2).forEach((l, k) => text(p, l, M, 29 - k * 9, { size: 6.8, color: C.muted }));
    text(p, `Page ${i + 1} sur ${pages.length}`, A4.w - M, 29, { size: 6.8, color: C.muted, align: "right" });
    text(p, "Factur-X EN 16931", A4.w - M, 20, { size: 6.8, color: C.muted, align: "right" });
  });

  return finalizeFacturX(doc, s, xml, created, title);
}

/** Pièce jointe factur-x.xml, XMP, OutputIntent, identifiants : ce qui fait du PDF un PDF/A-3b Factur-X. */
async function finalizeFacturX(doc: PDFDocument, s: Snapshot, xml: string, created: Date, title: string): Promise<Uint8Array> {
  const ctx = doc.context;
  const author = s.seller.name;
  const subject = `${title}, ${s.buyer.name}`;
  const keywords = "Factur-X, facture électronique, " + s.number;
  const producer = "Stabl";
  doc.setTitle(title, { showInWindowTitleBar: true });
  doc.setAuthor(author); doc.setSubject(subject); doc.setKeywords([keywords]);
  doc.setProducer(producer); doc.setCreator(producer);
  doc.setCreationDate(created); doc.setModificationDate(created);
  doc.setLanguage("fr-FR");

  // Pièce jointe associée (PDF/A-3 : /AF sur le catalogue et sur la spécification de fichier)
  const xmlBytes = new TextEncoder().encode(xml);
  const pdfDate = PDFString.fromDate(created);
  const ef = ctx.flateStream(xmlBytes, {
    Type: "EmbeddedFile", Subtype: "text/xml",
    Params: { Size: xmlBytes.length, ModDate: pdfDate, CreationDate: pdfDate },
  });
  const efRef = ctx.register(ef);
  const fs = ctx.obj({
    Type: "Filespec", F: PDFString.of("factur-x.xml"), UF: PDFHexString.fromText("factur-x.xml"),
    EF: { F: efRef, UF: efRef }, Desc: PDFString.of("Factur-X EN 16931"), AFRelationship: "Alternative",
  });
  const fsRef = ctx.register(fs);
  const names = ctx.obj({ EmbeddedFiles: { Names: [PDFString.of("factur-x.xml"), fsRef] } });
  doc.catalog.set(PDFName.of("Names"), names);
  doc.catalog.set(PDFName.of("AF"), ctx.obj([fsRef]));

  // Profil de sortie sRGB
  const icc = ctx.flateStream(srgbIcc(), { N: 3 });
  const iccRef = ctx.register(icc);
  const oi = ctx.obj({
    Type: "OutputIntent", S: "GTS_PDFA1", OutputConditionIdentifier: PDFString.of("sRGB IEC61966-2.1"),
    Info: PDFString.of("sRGB IEC61966-2.1"), RegistryName: PDFString.of("http://www.color.org"), DestOutputProfile: iccRef,
  });
  doc.catalog.set(PDFName.of("OutputIntents"), ctx.obj([ctx.register(oi)]));
  doc.catalog.set(PDFName.of("MarkInfo"), ctx.obj({ Marked: false }));
  const vp = doc.catalog.lookup(PDFName.of("ViewerPreferences"));
  if (!(vp instanceof PDFDict)) doc.catalog.set(PDFName.of("ViewerPreferences"), ctx.obj({ DisplayDocTitle: true }));

  // Identifiants de document (déterministes : SHA-256 du numéro et du XML)
  const idHash = new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s.seller.siren + "|" + s.number + "|" + xml))).slice(0, 16);
  const idHex = [...idHash].map((b) => b.toString(16).padStart(2, "0")).join("");
  ctx.trailerInfo.ID = ctx.obj([PDFHexString.of(idHex), PDFHexString.of(idHex)]) as PDFArray;
  const uuid = `${idHex.slice(0, 8)}-${idHex.slice(8, 12)}-${idHex.slice(12, 16)}-${idHex.slice(16, 20)}-${idHex.slice(20, 32)}`;

  const iso = created.toISOString().replace(/\.\d{3}Z$/, "Z");
  const xmp = `<?xpacket begin="﻿" id="W5M0MpCehiHzreSzNTczkc9d"?>
<x:xmpmeta xmlns:x="adobe:ns:meta/">
<rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#">
<rdf:Description rdf:about="" xmlns:pdfaid="http://www.aiim.org/pdfa/ns/id/"><pdfaid:part>3</pdfaid:part><pdfaid:conformance>B</pdfaid:conformance></rdf:Description>
<rdf:Description rdf:about="" xmlns:dc="http://purl.org/dc/elements/1.1/"><dc:format>application/pdf</dc:format><dc:title><rdf:Alt><rdf:li xml:lang="x-default">${esc(title)}</rdf:li></rdf:Alt></dc:title><dc:creator><rdf:Seq><rdf:li>${esc(author)}</rdf:li></rdf:Seq></dc:creator><dc:description><rdf:Alt><rdf:li xml:lang="x-default">${esc(subject)}</rdf:li></rdf:Alt></dc:description></rdf:Description>
<rdf:Description rdf:about="" xmlns:pdf="http://ns.adobe.com/pdf/1.3/"><pdf:Producer>${producer}</pdf:Producer><pdf:Keywords>${esc(keywords)}</pdf:Keywords></rdf:Description>
<rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/"><xmp:CreatorTool>${producer}</xmp:CreatorTool><xmp:CreateDate>${iso}</xmp:CreateDate><xmp:ModifyDate>${iso}</xmp:ModifyDate><xmp:MetadataDate>${iso}</xmp:MetadataDate></rdf:Description>
<rdf:Description rdf:about="" xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/"><xmpMM:DocumentID>uuid:${uuid}</xmpMM:DocumentID><xmpMM:InstanceID>uuid:${uuid}</xmpMM:InstanceID></rdf:Description>
<rdf:Description rdf:about="" xmlns:fx="urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#"><fx:DocumentType>INVOICE</fx:DocumentType><fx:DocumentFileName>factur-x.xml</fx:DocumentFileName><fx:Version>1.0</fx:Version><fx:ConformanceLevel>EN 16931</fx:ConformanceLevel></rdf:Description>
<rdf:Description rdf:about="" xmlns:pdfaExtension="http://www.aiim.org/pdfa/ns/extension/" xmlns:pdfaSchema="http://www.aiim.org/pdfa/ns/schema#" xmlns:pdfaProperty="http://www.aiim.org/pdfa/ns/property#">
<pdfaExtension:schemas><rdf:Bag><rdf:li rdf:parseType="Resource">
<pdfaSchema:schema>Factur-X PDFA Extension Schema</pdfaSchema:schema>
<pdfaSchema:namespaceURI>urn:factur-x:pdfa:CrossIndustryDocument:invoice:1p0#</pdfaSchema:namespaceURI>
<pdfaSchema:prefix>fx</pdfaSchema:prefix>
<pdfaSchema:property><rdf:Seq>
<rdf:li rdf:parseType="Resource"><pdfaProperty:name>DocumentFileName</pdfaProperty:name><pdfaProperty:valueType>Text</pdfaProperty:valueType><pdfaProperty:category>external</pdfaProperty:category><pdfaProperty:description>The name of the embedded XML document</pdfaProperty:description></rdf:li>
<rdf:li rdf:parseType="Resource"><pdfaProperty:name>DocumentType</pdfaProperty:name><pdfaProperty:valueType>Text</pdfaProperty:valueType><pdfaProperty:category>external</pdfaProperty:category><pdfaProperty:description>The type of the hybrid document in capital letters, e.g. INVOICE or ORDER</pdfaProperty:description></rdf:li>
<rdf:li rdf:parseType="Resource"><pdfaProperty:name>Version</pdfaProperty:name><pdfaProperty:valueType>Text</pdfaProperty:valueType><pdfaProperty:category>external</pdfaProperty:category><pdfaProperty:description>The actual version of the standard applying to the embedded XML document</pdfaProperty:description></rdf:li>
<rdf:li rdf:parseType="Resource"><pdfaProperty:name>ConformanceLevel</pdfaProperty:name><pdfaProperty:valueType>Text</pdfaProperty:valueType><pdfaProperty:category>external</pdfaProperty:category><pdfaProperty:description>The conformance level of the embedded XML document</pdfaProperty:description></rdf:li>
</rdf:Seq></pdfaSchema:property>
</rdf:li></rdf:Bag></pdfaExtension:schemas>
</rdf:Description>
</rdf:RDF>
</x:xmpmeta>
<?xpacket end="w"?>`;
  const meta = ctx.stream(new TextEncoder().encode(xmp), { Type: "Metadata", Subtype: "XML" });
  doc.catalog.set(PDFName.of("Metadata"), ctx.register(meta));

  return doc.save({ useObjectStreams: false, addDefaultPage: false, updateFieldAppearances: false });
}

/** Lecture des pièces jointes d'un PDF (tests et contrôle) : renvoie le XML factur-x.xml s'il existe. */
export async function extractFacturX(pdf: Uint8Array): Promise<{ xml: string | null; relationship: string | null; pdfa: boolean; pages: number }> {
  const doc = await PDFDocument.load(pdf, { updateMetadata: false });
  const af = doc.catalog.lookup(PDFName.of("AF"));
  let xml: string | null = null; let rel: string | null = null;
  if (af instanceof PDFArray) {
    for (let i = 0; i < af.size(); i++) {
      const fs = af.lookup(i) as PDFDict;
      const name = (fs.lookup(PDFName.of("F")) as PDFString).decodeText();
      if (name !== "factur-x.xml") continue;
      rel = String(fs.lookup(PDFName.of("AFRelationship")) ?? "").replace(/^\//, "");
      const efd = fs.lookup(PDFName.of("EF")) as PDFDict;
      const stream: any = efd.lookup(PDFName.of("F"));
      const raw: Uint8Array = stream.getContents();
      const ds = new DecompressionStream("deflate");
      const out = await new Response(new Blob([raw]).stream().pipeThrough(ds)).arrayBuffer();
      xml = new TextDecoder().decode(out);
    }
  }
  const metaStream: any = doc.catalog.lookup(PDFName.of("Metadata"));
  const xmp = metaStream ? new TextDecoder().decode(metaStream.getContents()) : "";
  return { xml, relationship: rel, pdfa: /<pdfaid:part>3<\/pdfaid:part>/.test(xmp) && /fx:ConformanceLevel/.test(xmp), pages: doc.getPageCount() };
}
