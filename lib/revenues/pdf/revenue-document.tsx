import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { formatMoney } from "@/lib/currency";
import { MBOKA_PDF_BRAND, getRevenuePdfTitle, type RevenuePdfData } from "@/lib/revenues/pdf/types";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  header: {
    backgroundColor: MBOKA_PDF_BRAND.color,
    borderRadius: 8,
    padding: 20,
    marginBottom: 24,
  },
  brand: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: 700,
  },
  product: {
    color: "#dbeafe",
    fontSize: 10,
    marginTop: 4,
  },
  docTitle: {
    marginTop: 16,
    fontSize: 14,
    fontWeight: 700,
    color: "#ffffff",
  },
  code: {
    marginTop: 4,
    fontSize: 11,
    color: "#bfdbfe",
  },
  section: {
    marginBottom: 18,
  },
  label: {
    fontSize: 8,
    textTransform: "uppercase",
    letterSpacing: 1,
    color: MBOKA_PDF_BRAND.color,
    marginBottom: 4,
  },
  value: {
    fontSize: 11,
    lineHeight: 1.4,
  },
  grid: {
    flexDirection: "row",
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: MBOKA_PDF_BRAND.accent,
    borderRadius: 8,
    padding: 12,
  },
  cardLabel: {
    fontSize: 8,
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 14,
    fontWeight: 700,
    color: MBOKA_PDF_BRAND.color,
  },
  footer: {
    marginTop: 32,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    fontSize: 9,
    color: "#64748b",
    lineHeight: 1.5,
  },
});

function formatPdfMoney(value: number, currency: RevenuePdfData["currency"]): string {
  return formatMoney(value, { symbol: currency === "CDF" ? "FC " : "$" });
}

function formatPdfDate(isoDate: string): string {
  return format(new Date(isoDate), "d MMMM yyyy", { locale: fr });
}

export function RevenuePdfDocument({ data }: { data: RevenuePdfData }) {
  const title = getRevenuePdfTitle(data.documentType);

  return (
    <Document title={`${data.code} — ${title}`} author={MBOKA_PDF_BRAND.name}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{MBOKA_PDF_BRAND.name}</Text>
          <Text style={styles.product}>{MBOKA_PDF_BRAND.product}</Text>
          <Text style={styles.docTitle}>{title}</Text>
          <Text style={styles.code}>{data.code}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Client</Text>
          <Text style={styles.value}>{data.clientName}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Prestation</Text>
          <Text style={styles.value}>
            {data.revenueCategoryLabel} · {data.serviceSummary}
          </Text>
        </View>

        <View style={styles.grid}>
          {data.pricing ? (
            <>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Prix d&apos;origine</Text>
                <Text style={styles.cardValue}>{formatPdfMoney(data.pricing.baseAmount, data.currency)}</Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Remise</Text>
                <Text style={styles.cardValue}>
                  -{formatPdfMoney(data.pricing.discountAmount, data.currency)}
                  {data.pricing.discountType === "PERCENT"
                    ? ` (${data.pricing.discountValue} %)`
                    : ""}
                </Text>
              </View>
              <View style={styles.card}>
                <Text style={styles.cardLabel}>Total après remise</Text>
                <Text style={styles.cardValue}>{formatPdfMoney(data.pricing.finalAmount, data.currency)}</Text>
              </View>
            </>
          ) : (
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Montant total</Text>
              <Text style={styles.cardValue}>{formatPdfMoney(data.totalAmount, data.currency)}</Text>
            </View>
          )}
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Montant versé</Text>
            <Text style={styles.cardValue}>{formatPdfMoney(data.paidAmount, data.currency)}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardLabel}>Solde restant dû</Text>
            <Text style={styles.cardValue}>{formatPdfMoney(data.remainingAmount, data.currency)}</Text>
          </View>
        </View>

        <View style={[styles.section, { marginTop: 20 }]}>
          <Text style={styles.label}>Mode de règlement</Text>
          <Text style={styles.value}>{data.paymentMethodLabel}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.label}>Statut</Text>
          <Text style={styles.value}>{data.statusLabel}</Text>
        </View>

        <View style={styles.footer}>
          <Text>Document émis le {formatPdfDate(data.issuedAt)}.</Text>
          {data.documentType === "proforma" ? (
            <Text>Ce document est un devis / pro-forma et ne vaut pas facture définitive.</Text>
          ) : (
            <Text>Ce reçu atteste du montant encaissé à la date d&apos;émission.</Text>
          )}
          {data.isCancelled ? (
            <Text>Cette prestation a été annulée — montants affichés après régularisation.</Text>
          ) : null}
        </View>
      </Page>
    </Document>
  );
}
