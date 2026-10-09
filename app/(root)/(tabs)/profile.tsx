import { useState } from "react";
import { useClerk } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import { useFinanceData } from "@/hooks/useFinanceData";
import { useUserStore } from "@/store/userStore";
import { queryKeys } from "@/lib/query/keys";
import { createAccount, setDefaultAccount } from "@/lib/services/accounts";
import { ALL_CURRENCIES, CurrencyPicker } from "@/components/CurrencyPicker";
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type Account = {
  id: string;
  name: string;
  type: "CASH" | "BANK" | "CREDIT_CARD" | "SAVINGS";
  balance: number;
  isDefault: boolean;
};

const INITIAL_ACCOUNTS: Account[] = [
  {
    id: "1",
    name: "Cash",
    type: "CASH",
    balance: 25000,
    isDefault: true,
  },
  {
    id: "2",
    name: "Bank Account",
    type: "BANK",
    balance: 75000,
    isDefault: false,
  },
];

function SectionLabel({ children }: { children: string }) {
  return (
    <Text
      style={{
        fontSize: 11,
        textTransform: "uppercase",
        letterSpacing: 1,
        color: "#8A8D96",
        marginTop: 24,
        marginBottom: 8,
        marginHorizontal: 20,
      }}
    >
      {children}
    </Text>
  );
}

function Row({
  icon,
  label,
  value,
  onPress,
  showChevron = true,
  danger = false,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  showChevron?: boolean;
  danger?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={!onPress}
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: "#FFFFFF",
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: "#F0EEE7",
      }}
    >
      <View
        style={{
          width: 32,
          height: 32,
          borderRadius: 16,
          backgroundColor: "#F5F4F0",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 15 }}>{icon}</Text>
      </View>

      <Text
        style={{
          flex: 1,
          fontSize: 14,
          color: danger ? "#FF6B4A" : "#1A1D26",
        }}
      >
        {label}
      </Text>

      {value && (
        <Text
          style={{
            fontSize: 12,
            color: "#5C5F68",
            marginRight: 8,
          }}
        >
          {value}
        </Text>
      )}

      {showChevron && onPress && (
        <Text style={{ color: "#BDC3C7", fontSize: 18 }}>›</Text>
      )}
    </TouchableOpacity>
  );
}

export default function ProfileScreen() {
  const { user, supabase, accounts: accountsQuery } = useFinanceData();
  const queryClient = useQueryClient();
  const { signOut } = useClerk();
  const currency = useUserStore((state) => state.currency);
  const setCurrency = useUserStore((state) => state.setCurrency);
  const [biometricLock, setBiometricLock] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const accounts: Account[] = (accountsQuery.data ?? []).map((account) => ({
    id: account.id,
    name: account.name,
    type: account.type,
    balance: Number(account.balance),
    isDefault: account.is_default,
  }));

  const formatPrice = (amount: number) => {
    return `${currency} ${amount.toLocaleString()}`;
  };

  const handleAvatar = () => {
    setUploadingAvatar(true);

    setTimeout(() => {
      setUploadingAvatar(false);

      Alert.alert(
        "Profile picture",
        "Avatar picker would open here."
      );
    }, 800);
  };

  const handleSignOut = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", style: "destructive", onPress: () => { void signOut(); } },
    ]);
  };

  const handleAccount = (account: Account) => {
    Alert.alert(account.name, "Balance: " + formatPrice(account.balance), [
      { text: "Cancel", style: "cancel" },
      {
        text: "Make Default",
        onPress: () => {
          if (!user) return;
          void setDefaultAccount(supabase, user.id, account.id)
            .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.accounts(user.id) }))
            .catch((error) => Alert.alert("Update failed", error instanceof Error ? error.message : "Please try again."));
        },
      },
    ]);
  };

  const handleAddAccount = () => {
    if (!user) return;
    void createAccount(supabase, user.id, {
      name: "Account " + (accounts.length + 1),
      type: "CASH",
    })
      .then(() => queryClient.invalidateQueries({ queryKey: queryKeys.accounts(user.id) }))
      .catch((error) => Alert.alert("Create account failed", error instanceof Error ? error.message : "Please try again."));
  };

  const handleCurrency = () => setPickerOpen(true);

  const getAccountIcon = (type: Account["type"]) => {
    switch (type) {
      case "CASH":
        return "💵";
      case "BANK":
        return "🏦";
      case "CREDIT_CARD":
        return "💳";
      case "SAVINGS":
        return "🛡️";
      default:
        return "💰";
    }
  };

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: "#F7F6F0",
      }}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: 100,
        }}
      >
        {/* Header */}

        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 10,
          }}
        >
          <Text
            style={{
              color: "#1A1D26",
              fontSize: 22,
              fontWeight: "600",
            }}
          >
            Profile
          </Text>
        </View>

        {/* User Card */}

        <View
          style={{
            marginHorizontal: 20,
            marginTop: 8,
            backgroundColor: "#1A1D26",
            borderRadius: 18,
            paddingHorizontal: 20,
            paddingVertical: 24,
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            onPress={handleAvatar}
            disabled={uploadingAvatar}
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: "#2A2E3A",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {uploadingAvatar ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ fontSize: 32 }}>👤</Text>
            )}
          </TouchableOpacity>

          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 24,
              fontWeight: "700",
              marginTop: 14,
            }}
          >
            {user?.firstName ?? ""} {user?.lastName ?? ""}
          </Text>

          <Text
            style={{
              color: "#8A8D96",
              fontSize: 12,
              marginTop: 5,
            }}
          >
            ✉ {user?.primaryEmailAddress?.emailAddress ?? ""}
          </Text>
        </View>

        {/* Accounts */}

        <SectionLabel>Accounts</SectionLabel>

        <View
          style={{
            marginHorizontal: 20,
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#E8E6DF",
          }}
        >
          {accounts.map((account) => (
            <Row
              key={account.id}
              icon={getAccountIcon(account.type)}
              label={
                account.name +
                (account.isDefault ? " (default)" : "")
              }
              value={formatPrice(account.balance)}
              onPress={() => handleAccount(account)}
            />
          ))}

          <Row
            icon="+"
            label="Add account"
            onPress={handleAddAccount}
          />
        </View>

        {/* Preferences */}

        <SectionLabel>Preferences</SectionLabel>

        <View
          style={{
            marginHorizontal: 20,
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#E8E6DF",
          }}
        >
          <Row
            icon="💲"
            label="Currency"
            value={currency}
            onPress={handleCurrency}
          />

          <View
            style={{
              flexDirection: "row",
              alignItems: "center",
              backgroundColor: "#FFFFFF",
              paddingHorizontal: 16,
              paddingVertical: 14,
            }}
          >
            <View
              style={{
                width: 32,
                height: 32,
                borderRadius: 16,
                backgroundColor: "#F5F4F0",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 12,
              }}
            >
              <Text>🔒</Text>
            </View>

            <Text
              style={{
                flex: 1,
                fontSize: 14,
                color: "#1A1D26",
              }}
            >
              Biometric lock
            </Text>

            <Switch
              value={biometricLock}
              onValueChange={setBiometricLock}
            />
          </View>
        </View>

        {/* Account */}

        <SectionLabel>Account</SectionLabel>

        <View
          style={{
            marginHorizontal: 20,
            borderRadius: 16,
            overflow: "hidden",
            borderWidth: 1,
            borderColor: "#E8E6DF",
          }}
        >
          <Row
            icon="↪"
            label="Sign out"
            onPress={handleSignOut}
            showChevron={false}
            danger
          />
        </View>
      </ScrollView>
      <CurrencyPicker
        visible={pickerOpen}
        selectedCode={currency}
        onSelect={(selected) => {
          setPickerOpen(false);
          if (!user) return;
          void (async () => {
            try {
              const { error } = await supabase.from("users").update({ currency: selected.code }).eq("clerk_id", user.id);
              if (error) throw error;
              setCurrency(selected.code);
            } catch (error) {
              Alert.alert("Currency update failed", error instanceof Error ? error.message : "Please try again.");
            }
          })();
        }}
        onClose={() => setPickerOpen(false)}
      />
    </View>
  );
}
