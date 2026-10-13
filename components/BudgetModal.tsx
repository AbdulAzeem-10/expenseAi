import { queryKeys } from "@/lib/query/keys";
import { upsertBudget } from "@/lib/services/budgets";
import type { Budget } from "@/lib/services/budgets";
import { useSupabase } from "@/hooks/useSupabase";
import { useUser } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type BudgetModalProps = {
  visible: boolean;
  budget: Budget | null;
  onClose: () => void;
  onSaved: () => void;
};

export function BudgetModal({ visible, budget, onClose, onSaved }: BudgetModalProps) {
  const { user } = useUser();
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (visible) {
      setAmount(budget ? String(budget.amount) : "");
      setError("");
    }
  }, [visible, budget]);

  const handleSave = async () => {
    const parsedAmount = Number(amount.replace(/,/g, "").trim());
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a budget greater than zero.");
      return;
    }
    if (!user) {
      setError("Your account is still loading. Try again shortly.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await upsertBudget(supabase, user.id, parsedAmount);
      await queryClient.invalidateQueries({ queryKey: queryKeys.budget(user.id) });
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save your budget.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        className="flex-1 justify-end bg-black/40"
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View className="rounded-t-[28px] bg-brand-body px-5 pb-8 pt-6">
          <View className="mb-5 flex-row items-center justify-between">
            <Text className="text-xl font-bold text-brand-bg">Monthly budget</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button">
              <Text className="text-sm font-medium text-brand-text-secondary">Cancel</Text>
            </TouchableOpacity>
          </View>
          <Text className="mb-2 text-sm text-brand-text-secondary">
            Set your monthly spending limit.
          </Text>
          <TextInput
            value={amount}
            onChangeText={(value) => { setAmount(value); setError(""); }}
            keyboardType="decimal-pad"
            placeholder="Monthly amount"
            placeholderTextColor="#8A8D96"
            className="rounded-xl border border-[#E8E6DF] bg-white px-4 py-4 text-base text-brand-bg"
          />
          {error ? <Text className="mt-2 text-sm text-brand-coral">{error}</Text> : null}
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            className="mt-5 min-h-12 items-center justify-center rounded-xl bg-brand-bg px-4"
            accessibilityRole="button"
          >
            {saving ? <ActivityIndicator color="#FFFFFF" /> : <Text className="font-semibold text-white">Save budget</Text>}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
