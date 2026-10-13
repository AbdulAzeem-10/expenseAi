import { FormSheetModal } from "@/components/FormSheetModal";
import { COLORS } from "@/constants/theme";
import {
  useCreateAccount,
  useDeleteAccount,
  useUpdateAccount,
} from "@/hooks/mutations/useAccountMutations";
import type { Account, AccountType } from "@/lib/services/accounts";
import { useEffect, useState } from "react";
import { Alert, Text, TextInput, TouchableOpacity, View } from "react-native";

const ACCOUNT_TYPES: AccountType[] = ["CASH", "BANK", "CREDIT_CARD", "SAVINGS"];
const ACCOUNT_TYPE_LABEL: Record<AccountType, string> = {
  CASH: "Cash",
  BANK: "Bank",
  CREDIT_CARD: "Credit card",
  SAVINGS: "Savings",
};

type AccountModalProps = {
  visible: boolean;
  account: Account | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
  onMadeDefault: () => void | Promise<void>;
};

export function AccountModal({
  visible,
  account,
  onClose,
  onSaved,
  onDeleted,
  onMadeDefault,
}: AccountModalProps) {
  const isEditing = account !== null;
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("CASH");
  const [error, setError] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [makingDefault, setMakingDefault] = useState(false);

  const createMutation = useCreateAccount();
  const updateMutation = useUpdateAccount();
  const deleteMutation = useDeleteAccount();
  const saving = createMutation.isPending || updateMutation.isPending;
  const busy = saving || deleting || makingDefault;

  useEffect(() => {
    if (!visible) return;
    setName(account?.name ?? "");
    setType(account?.type ?? "CASH");
    setError("");
    setDeleting(false);
    setMakingDefault(false);
  }, [visible, account]);

  const handleSave = async () => {
    if (busy) return;
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("Please enter an account name.");
      return;
    }

    setError("");
    try {
      if (account) {
        await updateMutation.mutateAsync({
          accountId: account.id,
          payload: { name: trimmedName, type },
        });
      } else {
        await createMutation.mutateAsync({ name: trimmedName, type });
      }
      onSaved();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Could not save the account. Please try again.");
    }
  };

  const handleDelete = async () => {
    if (!account || busy) return;
    setError("");
    setDeleting(true);
    try {
      const result = await deleteMutation.mutateAsync({ accountId: account.id });
      if (result.deleted) {
        onDeleted();
        return;
      }

      Alert.alert(
        "Delete account",
        `This will also delete ${result.transactionCount} transaction${result.transactionCount === 1 ? "" : "s"}. This can't be undone.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Delete",
            style: "destructive",
            onPress: () => {
              setDeleting(true);
              void deleteMutation.mutateAsync({ accountId: account.id, force: true })
                .then(() => onDeleted())
                .catch((deleteError) => {
                  Alert.alert("Delete failed", deleteError instanceof Error ? deleteError.message : "Could not delete the account.");
                })
                .finally(() => setDeleting(false));
            },
          },
        ]
      );
    } catch (deleteError) {
      Alert.alert("Delete failed", deleteError instanceof Error ? deleteError.message : "Could not check the account's transactions.");
    } finally {
      setDeleting(false);
    }
  };

  const handleMakeDefault = async () => {
    if (busy) return;
    setError("");
    setMakingDefault(true);
    try {
      await onMadeDefault();
    } catch (defaultError) {
      setError(defaultError instanceof Error ? defaultError.message : "Could not make this the default account.");
    } finally {
      setMakingDefault(false);
    }
  };

  return (
    <FormSheetModal
      visible={visible}
      title={isEditing ? "Edit account" : "Add account"}
      onClose={busy ? () => undefined : onClose}
    >
      <Text className="mb-1.5 text-xs font-medium text-brand-bg">Name</Text>
      <TextInput
        value={name}
        onChangeText={(value) => {
          setName(value);
          if (error) setError("");
        }}
        placeholder="e.g. HDFC Savings"
        placeholderTextColor={COLORS.placeholder}
        editable={!busy}
        returnKeyType="done"
        className="mb-5 rounded-xl border border-[#E8E6DF] bg-white px-4 py-3.5 text-sm text-brand-bg"
      />

      <Text className="mb-1.5 text-xs font-medium text-brand-bg">Type</Text>
      <View className="mb-5 flex-row flex-wrap gap-2">
        {ACCOUNT_TYPES.map((option) => {
          const selected = type === option;
          return (
            <TouchableOpacity
              key={option}
              onPress={() => setType(option)}
              disabled={busy}
              accessibilityRole="button"
              accessibilityState={{ selected, disabled: busy }}
              className={`rounded-full border px-3.5 py-2 ${selected ? "border-brand-bg bg-brand-bg" : "border-[#E8E6DF] bg-white"}`}
            >
              <Text className={`text-xs font-medium ${selected ? "text-white" : "text-brand-bg"}`}>
                {ACCOUNT_TYPE_LABEL[option]}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {error ? <Text accessibilityRole="alert" className="mb-3 text-xs text-brand-coral">{error}</Text> : null}

      <TouchableOpacity
        onPress={() => { void handleSave(); }}
        disabled={busy}
        className="mb-3 items-center rounded-xl bg-brand-bg py-4"
        activeOpacity={0.85}
      >
        <Text className="text-sm font-semibold text-white">
          {saving ? "Saving..." : isEditing ? "Save changes" : "Add account"}
        </Text>
      </TouchableOpacity>

      {account && !account.is_default ? (
        <TouchableOpacity onPress={() => { void handleMakeDefault(); }} disabled={busy} className="items-center py-3">
          <Text className="text-sm font-medium text-brand-blue">{makingDefault ? "Updating..." : "Make default"}</Text>
        </TouchableOpacity>
      ) : null}

      {account ? (
        <TouchableOpacity onPress={() => { void handleDelete(); }} disabled={busy} className="items-center py-3">
          <Text className="text-sm font-medium text-brand-coral">{deleting ? "Deleting..." : "Delete account"}</Text>
        </TouchableOpacity>
      ) : null}
    </FormSheetModal>
  );
}
