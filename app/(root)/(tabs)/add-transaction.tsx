import { useEffect, useMemo, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import {
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type CategoryKey } from "@/constants/categories";
import { AI_GRADIENT, AI_GRADIENT_REVERSE } from "@/constants/theme";
import { AIActionCard } from "@/components/AiActionCard";
import { CalendarPicker } from "@/components/CalenderPicker";
import { PillGroup } from "@/components/PillGroup";
import { ReceiptScannerModal } from "@/components/ReceiptScannerModal";
import { VoiceRecorderModal } from "@/components/VoiceRecorderModal";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useCreateTransaction } from "@/hooks/mutations/useTransactionMutations";
import { transactionSchema } from "@/lib/schemas/transaction";
import type { TransactionType } from "@/types/transaction";
import { extractTransactionFromReceipt, extractTransactionFromVoice } from "@/lib/services/extractTransaction";

const INK = "#0B0E14";
const MUTED = "#777A80";
const BORDER = "#E5E4DF";

export default function AddTransactionScreen() {
  const router = useRouter();
  const { action } = useLocalSearchParams<{ action?: string }>();
  const { user, accounts: accountsQuery } = useFinanceData();
  const createMutation = useCreateTransaction();
  const accounts = useMemo(() => accountsQuery.data ?? [], [accountsQuery.data]);
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryKey>("food");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState("");
  const [processing, setProcessing] = useState(false);
  const [receiptScannerOpen, setReceiptScannerOpen] = useState(false);
  const [voiceRecorderOpen, setVoiceRecorderOpen] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [inputMethod, setInputMethod] = useState<"MANUAL" | "RECEIPT_SCAN" | "VOICE">("MANUAL");

  useEffect(() => {
    if (!accountId && accounts.length) {
      setAccountId(accounts.find((item) => item.is_default)?.id ?? accounts[0].id);
    }
  }, [accountId, accounts]);

  useEffect(() => {
    if (action === "scan") setReceiptScannerOpen(true);
    if (action === "voice") setVoiceRecorderOpen(true);
    if (action) router.setParams({ action: undefined });
  }, [action, router]);

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    setCategory(nextType === "INCOME" ? INCOME_CATEGORIES[0].key : EXPENSE_CATEGORIES[0].key);
  };

  const applyExtracted = (result: Awaited<ReturnType<typeof extractTransactionFromReceipt>>, method: "RECEIPT_SCAN" | "VOICE") => {
    if (result.type) handleTypeChange(result.type);
    if (result.amount != null) setAmount(String(result.amount));
    if (result.category) setCategory(result.category);
    if (result.description) setDescription(result.description);
    if (result.date && /^\d{4}-\d{2}-\d{2}$/.test(result.date)) {
      const [year, month, day] = result.date.split("-").map(Number);
      setDate(new Date(year, month - 1, day));
    }
    setInputMethod(method);
    Alert.alert("Details added", "Review the extracted details, then save your transaction.");
  };

  const handleReceiptCaptured = async (base64: string, mimeType: string) => {
    setReceiptScannerOpen(false);
    try {
      setProcessing(true);
      const extracted = await extractTransactionFromReceipt(base64, mimeType);
      applyExtracted(extracted, "RECEIPT_SCAN");
    } catch (error) {
      Alert.alert("Receipt scan failed", error instanceof Error ? error.message : "Try another photo.");
    } finally {
      setProcessing(false);
    }
  };

  const handleVoiceExtracted = (result: Awaited<ReturnType<typeof extractTransactionFromVoice>>) => applyExtracted(result, "VOICE");

  const handleSave = async () => {
    const parsed = transactionSchema.safeParse({ type, amount, category, accountId, description: description.trim() || undefined, date });
    if (!parsed.success) {
      Alert.alert("Check transaction details", parsed.error.issues[0]?.message ?? "Enter valid details.");
      return;
    }
    if (!user) {
      Alert.alert("Account unavailable", "Please try again once your account is ready.");
      return;
    }

    try {
      const result = await createMutation.mutateAsync({
        user_id: user.id,
        account_id: parsed.data.accountId,
        type: parsed.data.type,
        amount: Number(parsed.data.amount.replace(/,/g, "")),
        category: parsed.data.category,
        description: parsed.data.description?.trim() || null,
        date: parsed.data.date.toISOString(),
        input_method: inputMethod,
      });
      if (result.error) throw result.error;
      Alert.alert("Success", "Transaction saved successfully.");
      setAmount("");
      setDescription("");
      setInputMethod("MANUAL");
    } catch (error) {
      console.error("Unable to save transaction:", error);
      Alert.alert("Save failed", error instanceof Error ? error.message : "Something went wrong.");
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#F7F6F2" }} edges={["top"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 12, paddingBottom: 28 }} keyboardShouldPersistTaps="handled">
          <Text style={{ color: INK, fontSize: 28, fontWeight: "700", marginBottom: 18 }}>Add transaction</Text>

          <View style={{ flexDirection: "row", gap: 12, marginBottom: 22 }}>
            <AIActionCard icon="camera" title="Scan receipt" subtitle="Snap a photo" colors={AI_GRADIENT} onPress={() => setReceiptScannerOpen(true)} />
            <AIActionCard icon="mic" title="Voice log" subtitle="Just say it" colors={AI_GRADIENT_REVERSE} onPress={() => setVoiceRecorderOpen(true)} />
          </View>
          {processing ? <BlurView intensity={35} tint="light" style={{ flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 18, padding: 12, borderRadius: 14, overflow: "hidden" }}><ActivityIndicator color="#268FB4" /><Text style={{ color: MUTED }}>Reading transaction details…</Text></BlurView> : null}

          <View style={{ flexDirection: "row", backgroundColor: "white", borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 4, marginBottom: 22 }}>
            {(["EXPENSE", "INCOME"] as const).map((option) => (
              <TouchableOpacity key={option} onPress={() => handleTypeChange(option)} style={{ flex: 1, alignItems: "center", paddingVertical: 13, borderRadius: 12, backgroundColor: type === option ? INK : "transparent" }}><Text style={{ color: type === option ? "white" : MUTED, fontWeight: "600" }}>{option === "EXPENSE" ? "Expense" : "Income"}</Text></TouchableOpacity>
            ))}
          </View>

          <FieldLabel>Amount</FieldLabel>
          <TextInput value={amount} onChangeText={setAmount} placeholder="0" placeholderTextColor="#9A9A9A" keyboardType="decimal-pad" style={inputStyle} />

          <FieldLabel>Category</FieldLabel>
          <View style={{ marginBottom: 20 }}><PillGroup options={categories.map((item) => ({ key: item.key, label: item.label, icon: item.icon }))} value={category} onChange={setCategory} /></View>

          <FieldLabel>Account</FieldLabel>
          {accounts.length ? <View style={{ marginBottom: 20 }}><PillGroup options={accounts.map((item) => ({ key: item.id, label: item.name }))} value={accountId} onChange={setAccountId} /></View> : <Text style={{ color: MUTED, marginBottom: 20 }}>Create an account before adding a transaction.</Text>}

          <FieldLabel>Date</FieldLabel>
          <TouchableOpacity onPress={() => setCalendarOpen(true)} style={[inputStyle, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}><Text style={{ color: INK, fontSize: 16 }}>{date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</Text><Feather name="calendar" size={20} color="#52545A" /></TouchableOpacity>

          <FieldLabel>Description (optional)</FieldLabel>
          <TextInput value={description} onChangeText={setDescription} placeholder="e.g. Grocery shopping" placeholderTextColor="#999" style={inputStyle} />

          <TouchableOpacity onPress={handleSave} disabled={createMutation.isPending || processing || !accounts.length} style={{ backgroundColor: INK, borderRadius: 17, paddingVertical: 18, alignItems: "center", marginTop: 4, opacity: createMutation.isPending || processing || !accounts.length ? 0.6 : 1 }}>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>{createMutation.isPending ? "Saving..." : "Save transaction"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <ReceiptScannerModal visible={receiptScannerOpen} onClose={() => setReceiptScannerOpen(false)} onCaptured={(base64, mimeType) => { void handleReceiptCaptured(base64, mimeType); }} />
      <VoiceRecorderModal visible={voiceRecorderOpen} onClose={() => setVoiceRecorderOpen(false)} onExtracted={handleVoiceExtracted} />
      <CalendarPicker visible={calendarOpen} value={date} maximumDate={new Date()} onChange={setDate} onClose={() => setCalendarOpen(false)} />
    </SafeAreaView>
  );
}

function FieldLabel({ children }: { children: string }) {
  return <Text style={{ color: INK, fontSize: 16, fontWeight: "500", marginBottom: 9 }}>{children}</Text>;
}

const inputStyle = {
  backgroundColor: "white",
  borderWidth: 1,
  borderColor: BORDER,
  borderRadius: 16,
  paddingHorizontal: 16,
  paddingVertical: 16,
  color: INK,
  fontSize: 16,
  marginBottom: 20,
} as const;
