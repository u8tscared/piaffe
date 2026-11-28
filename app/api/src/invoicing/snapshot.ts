import type { ComputedLine, VatGroup } from "./money";
import type { Address, Seller } from "./settings";
import type { VatRegime } from "./catalog";

/** Contenu figé d'une facture à son émission : tout ce qu'il faut pour régénérer le PDF et le XML à l'identique. */
export interface Snapshot {
  v: 1;
  issuer: "club" | "platform" | "pro";
  kind: "invoice" | "deposit" | "credit_note";
  type_code: "380" | "381" | "386";
  number: string;
  issue_date: string;
  due_date: string | null;
  label: string | null;
  seller: Seller;
  buyer: {
    type: "individual" | "business" | "association" | "public"; name: string; siren: string | null; vat: string | null;
    address: Address; email: string | null; ref: string | null;
  };
  delivery_address: Address | null;
  buyer_reference: string | null;
  service_date: string | null;
  period: { start: string; end: string } | null;
  lines: ComputedLine[];
  groups: VatGroup[];
  totals: { ht: number; vat: number; ttc: number; prepaid: number; due: number };
  regime: VatRegime;
  operation_category: "goods" | "services" | "mixed";
  vat_on_debits: boolean;
  business_process: string;           // cadre de facturation (BT-23) : B1, S1, M1, S2…
  payment: { method: string | null; method_label: string | null; means_code: string; iban: string | null; bic: string | null; terms: string };
  notes: { code: string; text: string }[];   // notes normées (PMT, PMD, AAB, TXD…)
  mentions: string[];                         // mentions imprimées en pied de facture
  original: { number: string; date: string } | null;
  deposits: { number: string; date: string; amount: number }[];
  footer: string | null;
}
