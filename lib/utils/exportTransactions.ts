import { Transaction } from "@/lib/services/transactions";
import { Directory, File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import { format } from "date-fns";

function toCsvCell(value: string | number | null) {
  if (value === null) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function buildCsv(transactions: Transaction[]) {
  const header = [
    "Date",
    "Type",
    "Category",
    "Description",
    "Amount",
    "Input Method",
  ];
  const rows = transactions.map((tx) => [
    format(new Date(tx.date), "yyyy-MM-dd"),
    tx.type,
    tx.category,
    tx.description ?? "",
    tx.amount,
    tx.input_method,
  ]);

  return [header, ...rows]
    .map((row) => row.map(toCsvCell).join(","))
    .join("\n");
}

export async function exportTransactionsToCsv(transactions: Transaction[]) {
  const csv = buildCsv(transactions);
  const fileName = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
  const file = new File(new Directory(Paths.cache), fileName);
  if (file.exists) file.delete();
  file.create();
  file.write(csv);

  const sharingAvailable = await Sharing.isAvailableAsync();
  if (sharingAvailable) {
    await Sharing.shareAsync(file.uri, {
      mimeType: "text/csv",
      dialogTitle: "Export transactions",
      UTI: "public.comma-separated-values-text",
    });
  }

  return { count: transactions.length, uri: file.uri, shared: sharingAvailable };
}
