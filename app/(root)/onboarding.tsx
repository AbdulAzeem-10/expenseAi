import { ALL_CURRENCIES, CurrencyPicker, type CurrencyOption } from "@/components/CurrencyPicker";
import { BrandLogo } from "@/components/BrandLogo";
import { useSupabase } from "@/hooks/useSupabase";
import { onboardingSchema } from "@/lib/schemas/onboarding";
import { useUserStore } from "@/store/userStore";
import { useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const { user } = useUser();
  const authSupabase = useSupabase();
  const setCurrency = useUserStore((state) => state.setCurrency);
  const setNeedsOnboarding = useUserStore((state) => state.setNeedsOnboarding);
  const [startingBalance, setStartingBalance] = useState("");
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyOption>(
    ALL_CURRENCIES.find((currency) => currency.code === "INR") ?? ALL_CURRENCIES[0]
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [balanceError, setBalanceError] = useState("");

  const handleSave = async () => {
    const parsedForm = onboardingSchema.safeParse({ startingBalance });
    if (!parsedForm.success) {
      setBalanceError(parsedForm.error.issues[0]?.message ?? "Enter a valid amount.");
      return;
    }

    if (!user) {
      setError("Your account is still loading. Please try again.");
      return;
    }

    const parsedBalance = Number(parsedForm.data.startingBalance.replace(/,/g, ""));
    setSaving(true);
    setError("");
    setBalanceError("");

    try {
      const { error: updateError } = await authSupabase
        .from("users")
        .update({ currency: selectedCurrency.code })
        .eq("clerk_id", user.id);

      if (updateError) throw updateError;

      const { data: defaultAccount, error: accountFetchError } = await authSupabase
        .from("accounts")
        .select("id, balance")
        .eq("user_id", user.id)
        .eq("is_default", true)
        .single();

      if (accountFetchError || !defaultAccount) throw accountFetchError;

      const { error: transactionError } = await authSupabase
        .from("transactions")
        .insert({
          user_id: user.id,
          account_id: defaultAccount.id,
          type: "INCOME",
          amount: parsedBalance,
          category: "other_income",
          description: "Starting balance",
          date: new Date().toISOString(),
          input_method: "MANUAL",
        });

      if (transactionError) throw transactionError;

      const { error: balanceError } = await authSupabase
        .from("accounts")
        .update({ balance: defaultAccount.balance + parsedBalance })
        .eq("id", defaultAccount.id);

      if (balanceError) throw balanceError;

      setCurrency(selectedCurrency.code);
      setNeedsOnboarding(false);
      router.replace("/(root)/(tabs)");
    } catch (saveError) {
      console.error("Onboarding save failed:", saveError);
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-body" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-1 justify-center px-6">
          <View className="mb-10">
            <BrandLogo width={230} height={84} />
          </View>

          <Text className="mb-2 text-3xl font-bold text-[#1A1D26]">
            Let&apos;s get you set up
          </Text>
          <Text className="mb-10 text-sm text-brand-text-muted">
            A couple of quick details to personalise your experience.
          </Text>

          <Text className="mb-1.5 text-xs font-medium text-brand-bg">Starting balance</Text>
          <View className="mb-1 flex-row items-center rounded-xl border border-[#E8E6DF] bg-white px-4">
            <Text className="mr-2 text-sm text-brand-text-secondary">{selectedCurrency.symbol}</Text>
            <TextInput
              value={startingBalance}
              onChangeText={(value) => {
                setStartingBalance(value);
                setBalanceError("");
                setError("");
              }}
              placeholder="e.g. 50000"
              placeholderTextColor="#8A8D96"
              keyboardType="decimal-pad"
              returnKeyType="done"
              className="flex-1 py-3.5 text-sm text-brand-bg"
              accessibilityLabel="Starting balance"
            />
          </View>
          {balanceError ? <Text className="mb-3 text-xs text-brand-coral">{balanceError}</Text> : <View className="mb-4" />}

          <Text className="mb-1.5 text-xs font-medium text-brand-bg">Currency</Text>
          <TouchableOpacity
            onPress={() => setPickerOpen(true)}
            className="mb-6 flex-row items-center justify-between rounded-xl border border-[#E8E6DF] bg-white px-4 py-3.5"
            accessibilityRole="button"
          >
            <Text className="text-sm text-brand-bg">
              {selectedCurrency.symbol} {selectedCurrency.code} — {selectedCurrency.name}
            </Text>
            <Feather name="chevron-down" size={16} color="#8A8D96" />
          </TouchableOpacity>

          {error ? <Text className="mb-4 text-xs text-brand-coral">{error}</Text> : null}

          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="items-center rounded-xl bg-brand-bg py-4"
            activeOpacity={0.85}
            accessibilityRole="button"
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text className="text-sm font-semibold text-white">Get started</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      <CurrencyPicker
        visible={pickerOpen}
        selectedCode={selectedCurrency.code}
        onSelect={(currency) => {
          setSelectedCurrency(currency);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
}
