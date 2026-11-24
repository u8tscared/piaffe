import { dec } from "./money";
import type { Snapshot } from "./snapshot";
import type { Address } from "./settings";

/**
 * XML UN/CEFACT CII D16B au profil Factur-X EN 16931 (« COMFORT »).
 * Pourquoi EN 16931 plutôt que BASIC : c'est la norme sémantique complète exigée par la réforme ; BASIC en est un
 * sous-ensemble qui suffirait pour nos factures simples, mais EN 16931 accepte en plus les notes normées, les adresses
 * de livraison et les références de facture d'origine sans changer de profil. Nous n'utilisons que des champs
 * présents dans les deux, donc le fichier reste valide en BASIC si une plateforme le demandait (GUIDELINE_ID).
 * L'ordre des éléments suit strictement le schéma XSD Factur-X 1.07 (EN16931).
 */
export const GUIDELINE_ID = "urn:cen.eu:en16931:2017";

export function esc(s: unknown): string {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]!))
    // caractères de contrôle interdits en XML 1.0
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "");
}
const d102 = (iso: string) => iso.slice(0, 10).replace(/-/g, "");
const qty = (q: number) => (Math.round(q * 1000) / 1000).toString();
const rate = (bp: number) => (bp / 100).toFixed(2);
/** Prix unitaire net avec 4 décimales au plus (BT-146). */
function price4(cents: number, q: number): string {
  const v = cents / 100 / q;
  return (Math.round(v * 10000) / 10000).toFixed(4).replace(/(\.\d\d\d*?)0+$/, "$1");
}

function addr(a: Address | null | undefined): string {
  const a2 = a || {};
  return `<ram:PostalTradeAddress>${a2.zip ? `<ram:PostcodeCode>${esc(a2.zip)}</ram:PostcodeCode>` : ""}${a2.line1 ? `<ram:LineOne>${esc(a2.line1)}</ram:LineOne>` : ""}${a2.line2 ? `<ram:LineTwo>${esc(a2.line2)}</ram:LineTwo>` : ""}${a2.city ? `<ram:CityName>${esc(a2.city)}</ram:CityName>` : ""}<ram:CountryID>${esc((a2.country || "FR").toUpperCase().slice(0, 2))}</ram:CountryID></ram:PostalTradeAddress>`;
}

function party(tag: string, p: { name: string; siren: string | null; vat: string | null; address: Address; email?: string | null }, fiscal = false): string {
  return `<ram:${tag}><ram:Name>${esc(p.name)}</ram:Name>` +
    (p.siren ? `<ram:SpecifiedLegalOrganization><ram:ID schemeID="0002">${esc(p.siren)}</ram:ID></ram:SpecifiedLegalOrganization>` : "") +
    addr(p.address) +
    // Adresse électronique (BT-34 / BT-49) : SIREN dans l'annuaire de la réforme (schéma 0225), sinon e-mail.
    (p.siren ? `<ram:URIUniversalCommunication><ram:URIID schemeID="0225">${esc(p.siren)}</ram:URIID></ram:URIUniversalCommunication>`
      : p.email ? `<ram:URIUniversalCommunication><ram:URIID schemeID="EM">${esc(p.email)}</ram:URIID></ram:URIUniversalCommunication>` : "") +
    (p.vat ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="VA">${esc(p.vat)}</ram:ID></ram:SpecifiedTaxRegistration>`
      // Vendeur sans numéro de TVA (franchise, association) : identifiant fiscal (BT-32, schéma FC), exigé par BR-E-02.
      : fiscal && p.siren ? `<ram:SpecifiedTaxRegistration><ram:ID schemeID="FC">${esc(p.siren)}</ram:ID></ram:SpecifiedTaxRegistration>` : "") +
    `</ram:${tag}>`;
}

export function buildCii(s: Snapshot): string {
  const due = s.totals.due;
  // Exigibilité de la TVA (BT-8) : prestations de services sans option sur les débits → à l'encaissement (code 72).
  const dueType = s.regime === "normal" && s.operation_category !== "goods" ? (s.vat_on_debits ? "5" : "72") : null;
  const lines = s.lines.map((l) =>
    `<ram:IncludedSupplyChainTradeLineItem>` +
    `<ram:AssociatedDocumentLineDocument><ram:LineID>${l.position}</ram:LineID></ram:AssociatedDocumentLineDocument>` +
    `<ram:SpecifiedTradeProduct><ram:Name>${esc(l.label)}</ram:Name>${l.description ? `<ram:Description>${esc(l.description)}</ram:Description>` : ""}</ram:SpecifiedTradeProduct>` +
    `<ram:SpecifiedLineTradeAgreement><ram:NetPriceProductTradePrice><ram:ChargeAmount>${price4(l.line_ht, l.quantity)}</ram:ChargeAmount></ram:NetPriceProductTradePrice></ram:SpecifiedLineTradeAgreement>` +
    `<ram:SpecifiedLineTradeDelivery><ram:BilledQuantity unitCode="${esc(l.unit)}">${qty(l.quantity)}</ram:BilledQuantity></ram:SpecifiedLineTradeDelivery>` +
    `<ram:SpecifiedLineTradeSettlement><ram:ApplicableTradeTax><ram:TypeCode>VAT</ram:TypeCode><ram:CategoryCode>${l.vat_category}</ram:CategoryCode><ram:RateApplicablePercent>${rate(l.vat_rate_bp)}</ram:RateApplicablePercent></ram:ApplicableTradeTax>` +
    `<ram:SpecifiedTradeSettlementLineMonetarySummation><ram:LineTotalAmount>${dec(l.line_ht)}</ram:LineTotalAmount></ram:SpecifiedTradeSettlementLineMonetarySummation></ram:SpecifiedLineTradeSettlement>` +
    `</ram:IncludedSupplyChainTradeLineItem>`).join("");

  const taxes = s.groups.map((g) =>
    `<ram:ApplicableTradeTax><ram:CalculatedAmount>${dec(g.vat)}</ram:CalculatedAmount><ram:TypeCode>VAT</ram:TypeCode>` +
    (g.category === "E" ? `<ram:ExemptionReason>${esc(g.reason || "Exonération")}</ram:ExemptionReason>` : "") +
    `<ram:BasisAmount>${dec(g.base)}</ram:BasisAmount><ram:CategoryCode>${g.category}</ram:CategoryCode>` +
    (g.category === "E" && g.code ? `<ram:ExemptionReasonCode>${esc(g.code)}</ram:ExemptionReasonCode>` : "") +
    (dueType && g.category === "S" ? `<ram:DueDateTypeCode>${dueType}</ram:DueDateTypeCode>` : "") +
    `<ram:RateApplicablePercent>${rate(g.rate_bp)}</ram:RateApplicablePercent></ram:ApplicableTradeTax>`).join("");

  const delivery = (s.delivery_address ? `<ram:ShipToTradeParty><ram:Name>${esc(s.buyer.name)}</ram:Name>${addr(s.delivery_address)}</ram:ShipToTradeParty>` : "") +
    (s.service_date ? `<ram:ActualDeliverySupplyChainEvent><ram:OccurrenceDateTime><udt:DateTimeString format="102">${d102(s.service_date)}</udt:DateTimeString></ram:OccurrenceDateTime></ram:ActualDeliverySupplyChainEvent>` : "");

  const means = `<ram:SpecifiedTradeSettlementPaymentMeans><ram:TypeCode>${s.payment.means_code}</ram:TypeCode>` +
    ((s.payment.means_code === "30" || s.payment.means_code === "58") && s.payment.iban ? `<ram:PayeePartyCreditorFinancialAccount><ram:IBANID>${esc(s.payment.iban)}</ram:IBANID></ram:PayeePartyCreditorFinancialAccount>` : "") +
    `</ram:SpecifiedTradeSettlementPaymentMeans>`;

  return `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rsm:CrossIndustryInvoice xmlns:rsm="urn:un:unece:uncefact:data:standard:CrossIndustryInvoice:100" xmlns:qdt="urn:un:unece:uncefact:data:standard:QualifiedDataType:100" xmlns:ram="urn:un:unece:uncefact:data:standard:ReusableAggregateBusinessInformationEntity:100" xmlns:udt="urn:un:unece:uncefact:data:standard:UnqualifiedDataType:100">` +
    `<rsm:ExchangedDocumentContext>` +
    `<ram:BusinessProcessSpecifiedDocumentContextParameter><ram:ID>${esc(s.business_process)}</ram:ID></ram:BusinessProcessSpecifiedDocumentContextParameter>` +
    `<ram:GuidelineSpecifiedDocumentContextParameter><ram:ID>${GUIDELINE_ID}</ram:ID></ram:GuidelineSpecifiedDocumentContextParameter>` +
    `</rsm:ExchangedDocumentContext>` +
    `<rsm:ExchangedDocument><ram:ID>${esc(s.number)}</ram:ID><ram:TypeCode>${s.type_code}</ram:TypeCode>` +
    `<ram:IssueDateTime><udt:DateTimeString format="102">${d102(s.issue_date)}</udt:DateTimeString></ram:IssueDateTime>` +
    s.notes.map((n) => `<ram:IncludedNote><ram:Content>${esc(n.text)}</ram:Content><ram:SubjectCode>${esc(n.code)}</ram:SubjectCode></ram:IncludedNote>`).join("") +
    `</rsm:ExchangedDocument>` +
    `<rsm:SupplyChainTradeTransaction>` + lines +
    `<ram:ApplicableHeaderTradeAgreement>` +
    (s.buyer_reference ? `<ram:BuyerReference>${esc(s.buyer_reference)}</ram:BuyerReference>` : "") +
    party("SellerTradeParty", s.seller, true) + party("BuyerTradeParty", s.buyer) +
    `</ram:ApplicableHeaderTradeAgreement>` +
    `<ram:ApplicableHeaderTradeDelivery>${delivery}</ram:ApplicableHeaderTradeDelivery>` +
    `<ram:ApplicableHeaderTradeSettlement>` +
    (s.kind !== "credit_note" ? `<ram:PaymentReference>${esc(s.number)}</ram:PaymentReference>` : "") +
    `<ram:InvoiceCurrencyCode>EUR</ram:InvoiceCurrencyCode>` + means + taxes +
    (s.period ? `<ram:BillingSpecifiedPeriod><ram:StartDateTime><udt:DateTimeString format="102">${d102(s.period.start)}</udt:DateTimeString></ram:StartDateTime><ram:EndDateTime><udt:DateTimeString format="102">${d102(s.period.end)}</udt:DateTimeString></ram:EndDateTime></ram:BillingSpecifiedPeriod>` : "") +
    `<ram:SpecifiedTradePaymentTerms><ram:Description>${esc(s.payment.terms)}</ram:Description>` +
    (s.due_date && due > 0 ? `<ram:DueDateDateTime><udt:DateTimeString format="102">${d102(s.due_date)}</udt:DateTimeString></ram:DueDateDateTime>` : "") +
    `</ram:SpecifiedTradePaymentTerms>` +
    `<ram:SpecifiedTradeSettlementHeaderMonetarySummation>` +
    `<ram:LineTotalAmount>${dec(s.totals.ht)}</ram:LineTotalAmount>` +
    `<ram:TaxBasisTotalAmount>${dec(s.totals.ht)}</ram:TaxBasisTotalAmount>` +
    `<ram:TaxTotalAmount currencyID="EUR">${dec(s.totals.vat)}</ram:TaxTotalAmount>` +
    `<ram:GrandTotalAmount>${dec(s.totals.ttc)}</ram:GrandTotalAmount>` +
    (s.totals.prepaid ? `<ram:TotalPrepaidAmount>${dec(s.totals.prepaid)}</ram:TotalPrepaidAmount>` : "") +
    `<ram:DuePayableAmount>${dec(due)}</ram:DuePayableAmount>` +
    `</ram:SpecifiedTradeSettlementHeaderMonetarySummation>` +
    (s.original ? `<ram:InvoiceReferencedDocument><ram:IssuerAssignedID>${esc(s.original.number)}</ram:IssuerAssignedID><ram:FormattedIssueDateTime><qdt:DateTimeString format="102">${d102(s.original.date)}</qdt:DateTimeString></ram:FormattedIssueDateTime></ram:InvoiceReferencedDocument>` : "") +
    // Le profil EN 16931 n'autorise qu'une référence : la facture d'origine (avoir) ou le premier acompte déduit ;
    // la liste complète des acomptes figure dans une note.
    (!s.original && s.deposits[0] ? `<ram:InvoiceReferencedDocument><ram:IssuerAssignedID>${esc(s.deposits[0].number)}</ram:IssuerAssignedID><ram:FormattedIssueDateTime><qdt:DateTimeString format="102">${d102(s.deposits[0].date)}</qdt:DateTimeString></ram:FormattedIssueDateTime></ram:InvoiceReferencedDocument>` : "") +
    `</ram:ApplicableHeaderTradeSettlement>` +
    `</rsm:SupplyChainTradeTransaction></rsm:CrossIndustryInvoice>`;
}

/** Lecture minimale d'une facture CII ou UBL reçue (fournisseur, numéro, dates, totaux, TVA). */
export function parseIncomingXml(xml: string): {
  number: string | null; type_code: string; issue_date: string | null; due_date: string | null;
  supplier_name: string | null; supplier_siren: string | null; supplier_vat: string | null;
  total_ht: number; total_vat: number; total_ttc: number; currency: string; vat_breakdown: { rate_bp: number; base: number; vat: number }[];
} {
  const pick = (re: RegExp, src = xml) => { const m = re.exec(src); return m ? unesc(m[1].trim()) : null; };
  const cents = (v: string | null) => (v == null || v === "" ? 0 : Math.round(Number(v) * 100));
  const date = (v: string | null) => (v && /^\d{8}$/.test(v) ? `${v.slice(0, 4)}-${v.slice(4, 6)}-${v.slice(6, 8)}` : v && /^\d{4}-\d{2}-\d{2}/.test(v) ? v.slice(0, 10) : null);
  const isUbl = /<(?:\w+:)?(Invoice|CreditNote)\b[^>]*urn:oasis:names:specification:ubl/.test(xml);
  if (!isUbl) {
    const seller = pick(/<ram:SellerTradeParty>([\s\S]*?)<\/ram:SellerTradeParty>/) || "";
    const breakdown: { rate_bp: number; base: number; vat: number }[] = [];
    const settle = pick(/<ram:ApplicableHeaderTradeSettlement>([\s\S]*?)<\/ram:ApplicableHeaderTradeSettlement>/) || "";
    for (const m of settle.matchAll(/<ram:ApplicableTradeTax>([\s\S]*?)<\/ram:ApplicableTradeTax>/g)) {
      breakdown.push({ rate_bp: Math.round(Number(pick(/<ram:RateApplicablePercent>([^<]*)</, m[1]) || 0) * 100), base: cents(pick(/<ram:BasisAmount>([^<]*)</, m[1])), vat: cents(pick(/<ram:CalculatedAmount>([^<]*)</, m[1])) });
    }
    return {
      number: pick(/<rsm:ExchangedDocument>[\s\S]*?<ram:ID>([^<]*)</), type_code: pick(/<rsm:ExchangedDocument>[\s\S]*?<ram:TypeCode>([^<]*)</) || "380",
      issue_date: date(pick(/<ram:IssueDateTime>\s*<udt:DateTimeString[^>]*>([^<]*)</)),
      due_date: date(pick(/<ram:DueDateDateTime>\s*<udt:DateTimeString[^>]*>([^<]*)</)),
      supplier_name: pick(/<ram:Name>([^<]*)</, seller), supplier_siren: pick(/<ram:SpecifiedLegalOrganization>\s*<ram:ID[^>]*>([^<]*)</, seller),
      supplier_vat: pick(/<ram:SpecifiedTaxRegistration>\s*<ram:ID schemeID="VA">([^<]*)</, seller),
      total_ht: cents(pick(/<ram:TaxBasisTotalAmount>([^<]*)</)), total_vat: cents(pick(/<ram:TaxTotalAmount[^>]*>([^<]*)</)),
      total_ttc: cents(pick(/<ram:GrandTotalAmount>([^<]*)</)), currency: pick(/<ram:InvoiceCurrencyCode>([^<]*)</) || "EUR", vat_breakdown: breakdown,
    };
  }
  const sup = pick(/<cac:AccountingSupplierParty>([\s\S]*?)<\/cac:AccountingSupplierParty>/) || "";
  const breakdown: { rate_bp: number; base: number; vat: number }[] = [];
  for (const m of xml.matchAll(/<cac:TaxSubtotal>([\s\S]*?)<\/cac:TaxSubtotal>/g)) {
    breakdown.push({ rate_bp: Math.round(Number(pick(/<cbc:Percent>([^<]*)</, m[1]) || 0) * 100), base: cents(pick(/<cbc:TaxableAmount[^>]*>([^<]*)</, m[1])), vat: cents(pick(/<cbc:TaxAmount[^>]*>([^<]*)</, m[1])) });
  }
  return {
    number: pick(/<cbc:ID>([^<]*)</), type_code: pick(/<cbc:(?:InvoiceTypeCode|CreditNoteTypeCode)>([^<]*)</) || (/<(?:\w+:)?CreditNote\b/.test(xml) ? "381" : "380"),
    issue_date: date(pick(/<cbc:IssueDate>([^<]*)</)), due_date: date(pick(/<cbc:DueDate>([^<]*)</)),
    supplier_name: pick(/<cac:PartyLegalEntity>[\s\S]*?<cbc:RegistrationName>([^<]*)</, sup) || pick(/<cbc:Name>([^<]*)</, sup),
    supplier_siren: pick(/<cbc:CompanyID[^>]*schemeID="0002"[^>]*>([^<]*)</, sup) || pick(/<cac:PartyLegalEntity>[\s\S]*?<cbc:CompanyID[^>]*>([^<]*)</, sup),
    supplier_vat: pick(/<cac:PartyTaxScheme>[\s\S]*?<cbc:CompanyID[^>]*>([^<]*)</, sup),
    total_ht: cents(pick(/<cbc:TaxExclusiveAmount[^>]*>([^<]*)</)), total_vat: cents(pick(/<cac:TaxTotal>\s*<cbc:TaxAmount[^>]*>([^<]*)</)),
    total_ttc: cents(pick(/<cbc:TaxInclusiveAmount[^>]*>([^<]*)</)), currency: pick(/<cbc:DocumentCurrencyCode>([^<]*)</) || "EUR", vat_breakdown: breakdown,
  };
}
function unesc(s: string) { return s.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&"); }
