import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";

const styles = StyleSheet.create({
  page: {
    padding: 32,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    marginBottom: 20,
    borderBottom: "2 solid #1a1a1a",
    paddingBottom: 10,
  },
  brand: { fontSize: 16, fontWeight: 700, marginBottom: 2 },
  title: { fontSize: 11, color: "#555" },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 9,
    fontWeight: 700,
    color: "#555",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  row: { flexDirection: "row", marginBottom: 4 },
  label: { width: 110, color: "#555" },
  value: { flex: 1 },
  checklistRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
    gap: 6,
  },
  checkbox: {
    width: 10,
    height: 10,
    border: "1 solid #333",
    marginRight: 6,
  },
  checkboxChecked: {
    backgroundColor: "#333",
  },
  notes: { marginTop: 4, lineHeight: 1.4 },
  footer: {
    position: "absolute",
    bottom: 24,
    left: 32,
    right: 32,
    fontSize: 8,
    color: "#999",
    borderTop: "1 solid #ccc",
    paddingTop: 6,
  },
});

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value.length === 10 ? value + "T00:00:00Z" : value).toLocaleDateString(
    "pt-BR",
    { timeZone: "UTC" }
  );
}

export function ServiceOrderDocument({
  assetName,
  assetCategory,
  manufacturer,
  model,
  serialNumber,
  customerName,
  customerAddress,
  ruleName,
  scheduledDate,
  completedAt,
  technicianName,
  completionNotes,
  checklist,
}: {
  assetName: string;
  assetCategory: string | null;
  manufacturer: string | null;
  model: string | null;
  serialNumber: string | null;
  customerName: string | null;
  customerAddress: string | null;
  ruleName: string | null;
  scheduledDate: string;
  completedAt: string | null;
  technicianName: string | null;
  completionNotes: string | null;
  checklist: { description: string; checked: boolean }[];
}) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>ServiceCycle</Text>
          <Text style={styles.title}>Ordem de Serviço — {ruleName ?? "Manutenção"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nome</Text>
            <Text style={styles.value}>{customerName ?? "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Endereço</Text>
            <Text style={styles.value}>{customerAddress ?? "—"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ativo</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nome / identificação</Text>
            <Text style={styles.value}>{assetName}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Categoria</Text>
            <Text style={styles.value}>{assetCategory ?? "—"}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Fabricante / modelo</Text>
            <Text style={styles.value}>
              {[manufacturer, model].filter(Boolean).join(" / ") || "—"}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Número de série</Text>
            <Text style={styles.value}>{serialNumber ?? "—"}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Execução</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Data agendada</Text>
            <Text style={styles.value}>{formatDate(scheduledDate)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Concluída em</Text>
            <Text style={styles.value}>{formatDate(completedAt)}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Técnico responsável</Text>
            <Text style={styles.value}>{technicianName ?? "Não atribuído"}</Text>
          </View>
        </View>

        {checklist.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Checklist</Text>
            {checklist.map((item, i) => (
              <View key={i} style={styles.checklistRow}>
                <View
                  style={
                    item.checked
                      ? [styles.checkbox, styles.checkboxChecked]
                      : styles.checkbox
                  }
                />
                <Text>{item.description}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Observações</Text>
          <Text style={styles.notes}>{completionNotes ?? "Nenhuma observação registrada."}</Text>
        </View>

        <Text style={styles.footer}>
          Gerado automaticamente pelo ServiceCycle — camada de recorrência e
          pós-venda para gestão do ciclo de vida de ativos.
        </Text>
      </Page>
    </Document>
  );
}
