import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { format as formatDate } from "date-fns";
import { fr } from "date-fns/locale";

import { formatMoney } from "@/lib/currency";
import { MBOKA_Z_BRAND, type CashClosingPdfData, type CashClosingPdfFormat } from "@/lib/cash-closing/pdf/types";

const THERMAL_WIDTH = 227;

const styles = StyleSheet.create({
  pageThermal: {
    width: THERMAL_WIDTH,
    padding: 14,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  pageA4: {
    padding: 36,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#0f172a",
  },
  center: {
    textAlign: "center",
  },
  brand: {
    fontSize: 12,
    fontWeight: 700,
    textAlign: "center",
  },
  subtitle: {
    marginTop: 2,
    fontSize: 8,
    textAlign: "center",
    color: "#64748b",
  },
  title: {
    marginTop: 10,
    marginBottom: 10,
    fontSize: 11,
    fontWeight: 700,
    textAlign: "center",
    textTransform: "uppercase",
  },
  meta: {
    marginBottom: 8,
    fontSize: 8,
    lineHeight: 1.4,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    borderStyle: "dashed",
    marginVertical: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  rowLabel: {
    flex: 1,
    paddingRight: 8,
  },
  rowValue: {
    fontWeight: 700,
  },
  sectionTitle: {
    marginBottom: 4,
    fontSize: 8,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#10579F",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#cbd5e1",
    fontWeight: 700,
  },
  note: {
    marginTop: 6,
    fontSize: 8,
    lineHeight: 1.35,
  },
  signatureBlock: {
    marginTop: 14,
  },
  signatureLine: {
    marginTop: 18,
    borderBottomWidth: 1,
    borderBottomColor: "#94a3b8",
    marginBottom: 4,
  },
  signatureLabel: {
    fontSize: 7,
    color: "#64748b",
  },
});

function PdfMoney({ value }: { value: number }) {
  return <Text>{formatMoney(value)}</Text>;
}

function SummaryRow({ label, value, bold = false }: { label: string; value: number; bold?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={bold ? styles.rowValue : undefined}>
        <PdfMoney value={value} />
      </Text>
    </View>
  );
}

function formatIssuedAt(isoDate: string): string {
  return formatDate(new Date(isoDate), "d MMM yyyy HH:mm", { locale: fr });
}

function gapLabel(value: number): string {
  if (value === 0) {
    return "Conforme";
  }

  return value > 0 ? "De trop" : "Manquant";
}

export function CashClosingPdfDocument({
  data,
  pageFormat = "thermal",
}: {
  data: CashClosingPdfData;
  pageFormat?: CashClosingPdfFormat;
}) {
  const pageStyle = pageFormat === "a4" ? styles.pageA4 : styles.pageThermal;
  const pageSize = pageFormat === "a4" ? "A4" : [THERMAL_WIDTH, 920];

  return (
    <Document title={`${MBOKA_Z_BRAND.title} — ${data.closingDate}`} author={MBOKA_Z_BRAND.name}>
      <Page size={pageSize} style={pageStyle}>
        <Text style={styles.brand}>{MBOKA_Z_BRAND.name}</Text>
        <Text style={styles.subtitle}>{MBOKA_Z_BRAND.product}</Text>
        <Text style={styles.title}>{MBOKA_Z_BRAND.title}</Text>

        <Text style={styles.meta}>Date : {data.closingDateLabel}</Text>
        <Text style={styles.meta}>Opérateur : {data.operatorName}</Text>
        <Text style={styles.meta}>Émis le : {formatIssuedAt(data.issuedAt)}</Text>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Fond du matin</Text>
        <SummaryRow label="Espèces" value={data.openingCash} />
        <SummaryRow label="Mobile money" value={data.openingMobileMoney} />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Encaissements du jour</Text>
        <SummaryRow label="Espèces" value={data.cashRevenues} />
        <SummaryRow label="Mobile money" value={data.mobileRevenues} />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Dépenses du jour</Text>
        <SummaryRow label="Espèces" value={data.cashExpenses} />
        <SummaryRow label="Mobile money" value={data.mobileExpenses} />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Attendu ce soir</Text>
        <SummaryRow label="Espèces" value={data.expectedCash} bold />
        <SummaryRow label="Mobile money" value={data.expectedMobileMoney} bold />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Comptage physique</Text>
        <SummaryRow label="Espèces comptées" value={data.realCash} bold />
        <SummaryRow label="Mobile money compté" value={data.realMobileMoney} bold />

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Résultat</Text>
        <SummaryRow label={`Espèces (${gapLabel(data.gapCash)})`} value={data.gapCash} bold />
        <SummaryRow label={`Mobile (${gapLabel(data.gapMobileMoney)})`} value={data.gapMobileMoney} bold />
        <View style={styles.totalRow}>
          <Text>{data.hasDiscrepancy ? "Différence totale" : "Caisse conforme"}</Text>
          <Text>{data.hasDiscrepancy ? formatMoney(data.gapAmount) : "OK"}</Text>
        </View>

        {data.notes ? (
          <>
            <View style={styles.divider} />
            <Text style={styles.sectionTitle}>Explication opérateur</Text>
            <Text style={styles.note}>{data.notes}</Text>
          </>
        ) : null}

        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Signature opérateur</Text>
        </View>

        <View style={styles.signatureBlock}>
          <View style={styles.signatureLine} />
          <Text style={styles.signatureLabel}>Visa supervision</Text>
        </View>
      </Page>
    </Document>
  );
}
