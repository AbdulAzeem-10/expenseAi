import { useState } from "react";
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

const EXPENSE_CATEGORIES = [
  "Food",
  "Transport",
  "Shopping",
  "Bills",
  "Entertainment",
  "Health",
  "Other",
];

const INCOME_CATEGORIES = [
  "Salary",
  "Business",
  "Investment",
  "Gift",
  "Other",
];

export default function AddTransactionScreen() {
  const [type, setType] = useState<"EXPENSE" | "INCOME">("EXPENSE");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Food");
  const [account, setAccount] = useState("Cash");
  const [date, setDate] = useState(new Date());
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);

  const categories =
    type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  const handleTypeChange = (newType: "EXPENSE" | "INCOME") => {
    setType(newType);

    if (newType === "INCOME") {
      setCategory(INCOME_CATEGORIES[0]);
    } else {
      setCategory(EXPENSE_CATEGORIES[0]);
    }
  };

  const handleSave = async () => {
    if (!amount.trim()) {
      Alert.alert("Error", "Please enter an amount.");
      return;
    }

    const parsedAmount = parseFloat(amount.replace(/,/g, ""));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Error", "Please enter a valid amount.");
      return;
    }

    setSaving(true);

    try {
      // Replace this with your backend/database request later.
      const transaction = {
        type,
        amount: parsedAmount,
        category,
        account,
        description: description.trim(),
        date: date.toISOString(),
      };

      console.log("Transaction:", transaction);

      await new Promise((resolve) => setTimeout(resolve, 500));

      Alert.alert("Success", "Transaction saved successfully.");

      setAmount("");
      setDescription("");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Something went wrong.");
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
                key={item}
                onPress={() => setCategory(item)}
                className={`px-4 py-2.5 rounded-full mr-2 mb-2 border ${
                  category === item
                    ? "bg-black border-black"
                    : "bg-white border-gray-200"
                }`}
              >
                <Text
                  className={
                    category === item
                      ? "text-white"
                      : "text-gray-600"
                  }
                >
                  {item}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Account */}
          <Text className="text-gray-900 font-medium mb-2">
            Account
          </Text>

          <View className="flex-row mb-5">
            {["Cash", "Bank", "Credit Card"].map((item) => (
              <TouchableOpacity
                key={item}
                onPress={() => setAccount(item)}
                className={`px-4 py-3 rounded-xl mr-2 border ${
                  account === item
                    ? "bg-black border-black"
                    : "bg-white border-gray-200"
                }`}
              >
                <Text
                  className={
                    account === item
                      ? "text-white"
                      : "text-gray-600"
                  }
                >
                  {item}
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