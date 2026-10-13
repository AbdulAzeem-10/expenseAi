import { useEffect, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {
  Alert,
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
import { useFinanceData } from "@/hooks/useFinanceData";
import { useCreateTransaction } from "@/hooks/mutations/useTransactionMutations";
import { transactionSchema } from "@/lib/schemas/transaction";
import type { TransactionType } from "@/types/transaction";

const INK = "#0B0E14";
const MUTED = "#777A80";
const BORDER = "#E5E4DF";

export default function AddTransactionScreen() {
  const { user, accounts: accountsQuery } = useFinanceData();
  const createMutation = useCreateTransaction();
  const accounts = accountsQuery.data ?? [];
  const [type, setType] = useState<TransactionType>("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryKey>("food");
  const [accountId, setAccountId] = useState("");
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!accountId && accounts.length) {
      setAccountId(accounts.find((item) => item.is_default)?.id ?? accounts[0].id);
    }
  }, [accountId, accounts]);

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const handleTypeChange = (nextType: TransactionType) => {
    setType(nextType);
    setCategory(nextType === "INCOME" ? INCOME_CATEGORIES[0].key : EXPENSE_CATEGORIES[0].key);
  };

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
        input_method: "MANUAL",
      });
      if (result.error) throw result.error;
      Alert.alert("Success", "Transaction saved successfully.");
      setAmount("");
      setDescription("");
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
            <LinearGradient colors={["#26A78A", "#278CB1"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, minHeight: 132, borderRadius: 24, padding: 18, justifyContent: "space-between" }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFFFFF35", alignItems: "center", justifyContent: "center" }}><Feather name="camera" size={21} color="white" /></View>
              <View><Text style={{ color: "white", fontSize: 17, fontWeight: "600" }}>Scan receipt</Text><Text style={{ color: "#FFFFFFCC", marginTop: 2 }}>Snap a photo</Text></View>
            </LinearGradient>
            <LinearGradient colors={["#268FB4", "#24A68E"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ flex: 1, minHeight: 132, borderRadius: 24, padding: 18, justifyContent: "space-between" }}>
              <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: "#FFFFFF35", alignItems: "center", justifyContent: "center" }}><Feather name="mic" size={21} color="white" /></View>
              <View><Text style={{ color: "white", fontSize: 17, fontWeight: "600" }}>Voice log</Text><Text style={{ color: "#FFFFFFCC", marginTop: 2 }}>Just say it</Text></View>
            </LinearGradient>
          </View>

          <View style={{ flexDirection: "row", backgroundColor: "white", borderWidth: 1, borderColor: BORDER, borderRadius: 16, padding: 4, marginBottom: 22 }}>
            {(["EXPENSE", "INCOME"] as const).map((option) => (
              <TouchableOpacity key={option} onPress={() => handleTypeChange(option)} style={{ flex: 1, alignItems: "center", paddingVertical: 13, borderRadius: 12, backgroundColor: type === option ? INK : "transparent" }}>
                <Text style={{ color: type === option ? "white" : MUTED, fontWeight: "600" }}>{option === "EXPENSE" ? "Expense" : "Income"}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <FieldLabel>Amount</FieldLabel>
          <TextInput value={amount} onChangeText={setAmount} placeholder="0" placeholderTextColor="#9A9A9A" keyboardType="decimal-pad" style={inputStyle} />

          <FieldLabel>Category</FieldLabel>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
            {categories.map((item) => {
              const selected = category === item.key;
              return <TouchableOpacity key={item.key} onPress={() => setCategory(item.key)} style={{ flexDirection: "row", alignItems: "center", gap: 7, paddingHorizontal: 14, paddingVertical: 11, borderRadius: 24, borderWidth: 1, borderColor: selected ? INK : BORDER, backgroundColor: selected ? INK : "white" }}><Text style={{ fontSize: 15 }}>{item.icon}</Text><Text numberOfLines={1} style={{ color: selected ? "white" : MUTED, fontSize: 14 }}>{item.label}</Text></TouchableOpacity>;
            })}
          </ScrollView>

          <FieldLabel>Account</FieldLabel>
          {accounts.length ? <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 20 }} contentContainerStyle={{ gap: 8, paddingRight: 4 }}>
            {accounts.map((item) => {
              const selected = accountId === item.id;
              return <TouchableOpacity key={item.id} onPress={() => setAccountId(item.id)} style={{ paddingHorizontal: 16, paddingVertical: 11, borderRadius: 24, borderWidth: 1, borderColor: selected ? INK : BORDER, backgroundColor: selected ? INK : "white" }}><Text style={{ color: selected ? "white" : MUTED, fontSize: 14 }}>{item.name}</Text></TouchableOpacity>;
            })}
          </ScrollView> : <Text style={{ color: MUTED, marginBottom: 20 }}>Create an account before adding a transaction.</Text>}

          <FieldLabel>Date</FieldLabel>
          <View style={[inputStyle, { flexDirection: "row", justifyContent: "space-between", alignItems: "center" }]}><Text style={{ color: INK, fontSize: 16 }}>{date.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" })}</Text><Feather name="calendar" size={20} color="#52545A" /></View>

          <FieldLabel>Description (optional)</FieldLabel>
          <TextInput value={description} onChangeText={setDescription} placeholder="e.g. Grocery shopping" placeholderTextColor="#999" style={inputStyle} />

          <TouchableOpacity onPress={handleSave} disabled={createMutation.isPending || !accounts.length} style={{ backgroundColor: INK, borderRadius: 17, paddingVertical: 18, alignItems: "center", marginTop: 4, opacity: createMutation.isPending || !accounts.length ? 0.6 : 1 }}>
            <Text style={{ color: "white", fontSize: 16, fontWeight: "600" }}>{createMutation.isPending ? "Saving..." : "Save transaction"}</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
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
