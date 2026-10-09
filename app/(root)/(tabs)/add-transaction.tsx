import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useFinanceData } from "@/hooks/useFinanceData";
import { queryKeys } from "@/lib/query/keys";
import { createTransaction } from "@/lib/services/transactions";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, type CategoryKey } from "@/constants/categories";
import { transactionSchema } from "@/lib/schemas/transaction";
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

const TYPE_OPTIONS = [
  { key: "EXPENSE", label: "Expense" },
  { key: "INCOME", label: "Income" },
];

export default function AddTransactionScreen() {
  const { user, supabase, accounts: accountsQuery } = useFinanceData();
  const queryClient = useQueryClient();
  const accounts = accountsQuery.data ?? [];
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState<CategoryKey>("food");
  const [accountId, setAccountId] = useState("");

  useEffect(() => {
    if (!accountId && accounts.length) {
      setAccountId(accounts.find((item) => item.is_default)?.id ?? accounts[0].id);
    }
  }, [accountId, accounts]);
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeChange = (newType: "EXPENSE" | "INCOME") => {
    setType(newType);

    if (newType === "INCOME") {
      setCategory(INCOME_CATEGORIES[0].key);
    } else {
      setCategory(EXPENSE_CATEGORIES[0].key);
    }
  };

  const handleSave = async () => {
    const parsedAmount = Number(amount.replace(/,/g, ""));
    const parsed = transactionSchema.safeParse({
      amount: parsedAmount,
      type,
      category,
      account_id: accountId,
      description: description.trim() || undefined,
      date: date.toISOString(),
    });

    if (!parsed.success) {
      Alert.alert("Check transaction details", parsed.error.issues[0]?.message ?? "Enter valid details.");
      return;
    }
    if (!user) {
      Alert.alert("Account unavailable", "Please try again once your account is ready.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await createTransaction(supabase, {
        user_id: user.id,
        account_id: accountId,
        type,
        amount: parsedAmount,
        category,
        description: description.trim() || null,
        date: date.toISOString(),
        input_method: "MANUAL",
      });
      if (error) throw error;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.transactions(user.id) }),
        queryClient.invalidateQueries({ queryKey: queryKeys.accounts(user.id) }),
      ]);
      Alert.alert("Success", "Transaction saved successfully.");
      setAmount("");
      setDescription("");
    } catch (error) {
      console.error("Unable to save transaction:", error);
      Alert.alert("Save failed", error instanceof Error ? error.message : "Something went wrong.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1"
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View className="flex-1 bg-gray-100">
        {/* Header */}
        <View className="px-5 pt-14 pb-4 bg-white">
          <Text className="text-2xl font-bold text-gray-900">
            Add Transaction
          </Text>

          <Text className="text-sm text-gray-500 mt-1">
            Add a new income or expense
          </Text>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            padding: 20,
            paddingBottom: 50,
          }}
        >
          {/* Type */}
          <Text className="text-gray-900 font-medium mb-2">
            Transaction Type
          </Text>

          <View className="flex-row bg-white rounded-xl p-1 mb-5">
            {TYPE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.key}
                onPress={() =>
                  handleTypeChange(
                    option.key as "EXPENSE" | "INCOME"
                  )
                }
                className={`flex-1 py-3 rounded-lg items-center ${
                  type === option.key ? "bg-black" : ""
                }`}
              >
                <Text
                  className={`font-medium ${
                    type === option.key
                      ? "text-white"
                      : "text-gray-500"
                  }`}
                >
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Amount */}
          <Text className="text-gray-900 font-medium mb-2">
            Amount
          </Text>

          <TextInput
            value={amount}
            onChangeText={setAmount}
            placeholder="0"
            placeholderTextColor="#999"
            keyboardType="numeric"
            className="bg-white border border-gray-200 rounded-xl px-4 py-4 mb-5 text-gray-900"
          />

          {/* Category */}
          <Text className="text-gray-900 font-medium mb-2">
            Category
          </Text>

          <View className="flex-row flex-wrap mb-5">
            {categories.map((item) => (
              <TouchableOpacity
                key={item.key}
                onPress={() => setCategory(item.key)}
                className={`px-4 py-2.5 rounded-full mr-2 mb-2 border ${
                  category === item.key
                    ? "bg-black border-black"
                    : "bg-white border-gray-200"
                }`}
              >
                <Text
                  className={
                    category === item.key
                      ? "text-white"
                      : "text-gray-600"
                  }
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Account */}
          <Text className="text-gray-900 font-medium mb-2">
            Account
          </Text>

          <View className="flex-row mb-5">
            {accounts.map((item) => (
              <TouchableOpacity
                key={item.id}
                onPress={() => setAccountId(item.id)}
                className={`px-4 py-3 rounded-xl mr-2 border ${
                  accountId === item.id
                    ? "bg-black border-black"
                    : "bg-white border-gray-200"
                }`}
              >
                <Text
                  className={
                    accountId === item.id
                      ? "text-white"
                      : "text-gray-600"
                  }
                >
                  {item.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Date */}
          <Text className="text-gray-900 font-medium mb-2">
            Date
          </Text>

          <View className="bg-white border border-gray-200 rounded-xl px-4 py-4 mb-5">
            <Text className="text-gray-900">
              {date.toLocaleDateString()}
            </Text>
          </View>

          {/* Description */}
          <Text className="text-gray-900 font-medium mb-2">
            Description
          </Text>

          <TextInput
            value={description}
            onChangeText={setDescription}
            placeholder="e.g. Grocery shopping"
            placeholderTextColor="#999"
            multiline
            className="bg-white border border-gray-200 rounded-xl px-4 py-4 mb-5 text-gray-900"
          />

          {/* Save */}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="bg-black rounded-xl py-4 items-center"
            style={{
              opacity: saving ? 0.6 : 1,
            }}
          >
            <Text className="text-white font-semibold">
              {saving ? "Saving..." : "Save Transaction"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}