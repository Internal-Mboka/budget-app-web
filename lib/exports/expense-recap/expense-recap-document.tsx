import { Document, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";

import { formatMoney } from "@/lib/currency";
import { MBOKA_EXPENSE_RECAP_BRAND, type ExpenseRecapPdfData } from "@/lib/exports/expense-recap/types";

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 9,
    fontFamily: "Helvetica",
    color: "#1e293b",
  },
  header: {
    backgroundColor: "#10579F",
    borderRadius: 8,
    padding: 20,
    marginBottom: 20,
  },
  brand: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: 700,
  },
  product: {
    color: "#dbeafe",
    fontSize: 10,
    marginTop: 4,
  },
  docTitle: {
    marginTop: 14,
    fontSize: 13,
    fontWeight: 700,
    color: "#ffffff",
  },
  code: {
    marginTop: 4,
    fontSize: 10,
    color: "#bfdbfe",
  },
  meta: {
    marginBottom: 16,
    fontSize: 9,
    color: "#64748b",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    borderBottomWidth: 1,
    borderBottomColor: "#10579F",
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontWeight: 700,
    fontSize: 8,
    textTransform: "uppercase",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 6,
    paddingHorizontal: 4,
    fontSize: 8,
  },
  colCode: { width: "14%" },
  colDate: { width: "12%" },
  colCategory: { width: "24%" },
  colAmount: { width: "14%", textAlign: "right" },
  colPaid: { width: "14%", textAlign: "right" },
  colMethod: { width: "12%" },
  colAttach: { width: "10%", textAlign: "center" },
  totals: {
    marginTop: 14,
    paddingTop: 10,
    borderTopWidth: 2,
    borderTopColor: "#10579F",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 4,
    fontSize: 10,
  },
  totalLabel: {
    fontWeight: 700,
  },
  footer: {
    marginTop: 20,
    fontSize: 8,
    color: "#64748b",
  },
});

type ExpenseRecapPdfDocumentProps = {
  data: ExpenseRecapPdfData;
};

export function ExpenseRecapPdfDocument({ data }: ExpenseRecapPdfDocumentProps) {
  const issuedLabel = format(parseISO(data.issuedAt), "d MMMM yyyy HH:mm", { locale: fr });

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>{MBOKA_EXPENSE_RECAP_BRAND.name}</Text>
          <Text style={styles.product}>{MBOKA_EXPENSE_RECAP_BRAND.product}</Text>
          <Text style={styles.docTitle}>{MBOKA_EXPENSE_RECAP_BRAND.title}</Text>
          <Text style={styles.code}>{data.documentCode}</Text>
        </View>

        <Text style={styles.meta}>
          Période {data.periodLabel} · {data.expenseCount} dépense{data.expenseCount > 1 ? "s" : ""} ·{" "}
          {data.attachmentCount} justificatif{data.attachmentCount > 1 ? "s" : ""}
        </Text>

        <View style={styles.tableHeader}>
          <Text style={styles.colCode}>Code</Text>
          <Text style={styles.colDate}>Date</Text>
          <Text style={styles.colCategory}>Catégorie</Text>
          <Text style={styles.colAmount}>Montant</Text>
          <Text style={styles.colPaid}>Payé</Text>
          <Text style={styles.colMethod}>Mode</Text>
          <Text style={styles.colAttach}>PJ</Text>
        </View>

        {data.rows.map((row) => (
          <View key={row.code} style={styles.tableRow}>
            <Text style={styles.colCode}>{row.code}</Text>
            <Text style={styles.colDate}>{row.dateLabel}</Text>
            <Text style={styles.colCategory}>{row.categoryLabel}</Text>
            <Text style={styles.colAmount}>{formatMoney(row.totalAmount)}</Text>
            <Text style={styles.colPaid}>{formatMoney(row.paidAmount)}</Text>
            <Text style={styles.colMethod}>{row.paymentMethodLabel}</Text>
            <Text style={styles.colAttach}>{row.attachmentCount}</Text>
          </View>
        ))}

        <View style={styles.totals}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total dépenses</Text>
            <Text>{formatMoney(data.totalAmount)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total payé</Text>
            <Text>{formatMoney(data.paidTotal)}</Text>
          </View>
        </View>

        <Text style={styles.footer}>Document généré le {issuedLabel} — récapitulatif comptable, sans valeur de justificatif fiscal.</Text>
      </Page>
    </Document>
  );
}
