import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

import { formatMoney } from "@/lib/currency";
import { MBOKA_BALANCE_BRAND, type PeriodBalancePdfData } from "@/lib/period-closure/pdf/types";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  header: {
    backgroundColor: "#10579F",
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
  previewBadge: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: "#f59e0b",
    color: "#ffffff",
    fontSize: 9,
    fontWeight: 700,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    textTransform: "uppercase",
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    textTransform: "uppercase",
    color: "#10579F",
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 6,
    paddingBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  rowLabel: {
    flex: 1,
    paddingRight: 12,
  },
  rowMeta: {
    fontSize: 8,
    color: "#64748b",
    marginTop: 2,
  },
  rowValue: {
    fontWeight: 700,
    textAlign: "right",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#10579F",
    fontWeight: 700,
    fontSize: 12,
  },
  hashBox: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  hashLabel: {
    fontSize: 8,
    textTransform: "uppercase",
    color: "#64748b",
    marginBottom: 4,
  },
  hashValue: {
    fontSize: 8,
    fontFamily: "Courier",
    lineHeight: 1.4,
  },
  footer: {
    marginTop: 24,
    fontSize: 8,
    color: "#64748b",
    lineHeight: 1.4,
  },
});

function PdfMoney({ value }: { value: number }) {
  return <Text>{formatMoney(value)}</Text>;
}

function SummaryRow({
  label,
  meta,
  value,
  bold = false,
}: {
  label: string;
  meta?: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLabel}>
        <Text style={bold ? { fontWeight: 700 } : undefined}>{label}</Text>
        {meta ? <Text style={styles.rowMeta}>{meta}</Text> : null}
      </View>
      <Text style={styles.rowValue}>
        <PdfMoney value={value} />
      </Text>
    </View>
  );
}

function formatIssuedAt(isoDate: string): string {
  return format(new Date(isoDate), "d MMM yyyy HH:mm", { locale: fr });
}

export function PeriodBalancePdfDocument({ data }: { data: PeriodBalancePdfData }) {
  return (
    <Document title={`${MBOKA_BALANCE_BRAND.title} — ${data.documentCode}`} author={MBOKA_BALANCE_BRAND.name}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{MBOKA_BALANCE_BRAND.name}</Text>
          <Text style={styles.product}>{MBOKA_BALANCE_BRAND.product}</Text>
          <Text style={styles.docTitle}>{MBOKA_BALANCE_BRAND.title}</Text>
          <Text style={styles.code}>{data.documentCode}</Text>
          {data.isPreview ? <Text style={styles.previewBadge}>Brouillon — non clôturé</Text> : null}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Période</Text>
          <Text>{data.periodLabel}</Text>
          <Text style={styles.rowMeta}>Référence {data.documentCode}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Synthèse du mois</Text>
          <SummaryRow
            label="Revenus"
            meta={`${data.revenueCount} opération(s)`}
            value={data.revenueTotal}
          />
          <SummaryRow
            label="Dépenses"
            meta={`${data.expenseCount} opération(s)`}
            value={data.expenseTotal}
          />
          <SummaryRow label="Avoirs" meta={`${data.creditCount} opération(s)`} value={data.creditTotal} />
          <View style={styles.totalRow}>
            <Text>Solde net période</Text>
            <Text>
              <PdfMoney value={data.netBalance} />
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Trésorerie</Text>
          <SummaryRow label="Encaissements revenus" value={data.paidRevenueTotal} />
          <SummaryRow label="Décaissements dépenses" value={data.paidExpenseTotal} />
          <View style={styles.totalRow}>
            <Text>Flux net de trésorerie</Text>
            <Text>
              <PdfMoney value={data.netCashFlow} />
            </Text>
          </View>
        </View>

        <View style={styles.hashBox}>
          <Text style={styles.hashLabel}>Empreinte de vérification</Text>
          <Text style={styles.hashValue}>{data.integrityHashDisplay}</Text>
        </View>

        <View style={styles.footer}>
          <Text>Émis le : {formatIssuedAt(data.issuedAt)}</Text>
          {data.closedAt ? <Text>Clôturé le : {formatIssuedAt(data.closedAt)}</Text> : null}
          {data.closedByName ? <Text>Clôturé par : {data.closedByName}</Text> : null}
          {!data.isPreview ? (
            <Text>
              Document infalsifiable — toute modification des données sources invaliderait l'empreinte ci-dessus.
            </Text>
          ) : (
            <Text>Ce brouillon n'a pas valeur de clôture officielle.</Text>
          )}
        </View>
      </Page>
    </Document>
  );
}
