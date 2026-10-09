import { BudgetModal } from "@/components/BudgetModal";
import { TransactionRow } from "@/components/TransactionRow";
import { getCategoryConfig } from "@/constants/categories";
import { useFinanceData } from "@/hooks/useFinanceData";
import type { Transaction } from "@/lib/services/transactions";
import { formatPrice } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { Feather } from "@expo/vector-icons";
import { isSameMonth } from "date-fns";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}

const QUICK_ACTIONS = [
  { icon: "camera", label: "AI Receipt Scan", action: "scan", color: "#1A85FF" },
  { icon: "mic", label: "Voice Entry", action: "voice", color: "#FF6B4A" },
  { icon: "plus", label: "Add Manually", action: "manual", color: "#3DDC84" },
] as const;

export default function HomeScreen() {
  const router = useRouter();
  const { user, accounts: accountsQuery, transactions: transactionsQuery, budget: budgetQuery } = useFinanceData();
  const currency = useUserStore((state) => state.currency);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);

  const accounts = accountsQuery.data ?? [];
  const transactions = transactionsQuery.data ?? [];
  const budget = budgetQuery.data ?? null;
  const loading = accountsQuery.isLoading || transactionsQuery.isLoading;
  const refreshing = accountsQuery.isRefetching || transactionsQuery.isRefetching || budgetQuery.isRefetching;

  const onRefresh = () => {
    void Promise.all([
      accountsQuery.refetch(),
      transactionsQuery.refetch(),
      budgetQuery.refetch(),
    ]);
  };

  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + Number(account.balance), 0),
    [accounts]
  );

  const monthTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((tx) => isSameMonth(new Date(tx.date), now));
  }, [transactions]);

  const monthIncome = useMemo(
    () => monthTransactions
      .filter((tx) => tx.type === "INCOME")
      .reduce((sum, tx) => sum + Number(tx.amount), 0),
    [monthTransactions]
  );

  const monthExpense = useMemo(
    () => monthTransactions
      .filter((tx) => tx.type === "EXPENSE")
      .reduce((sum, tx) => sum + Number(tx.amount), 0),
    [monthTransactions]
  );

  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  const expenseBreakdown = useMemo(() => {
    const totals: Partial<Record<Transaction["category"], number>> = {};
    monthTransactions
      .filter((tx) => tx.type === "EXPENSE")
      .forEach((tx) => {
        totals[tx.category] = (totals[tx.category] ?? 0) + Number(tx.amount);
      });

    return Object.entries(totals)
      .filter((entry): entry is [Transaction["category"], number] => entry[1] !== undefined)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category,
        amount,
        color: getCategoryConfig(category).color,
      }));
  }, [monthTransactions]);

  const budgetPercentage = budget && budget.amount > 0
    ? Math.min(Math.round((monthExpense / budget.amount) * 100), 100)
    : 0;

  const handleQuickAction = (action: (typeof QUICK_ACTIONS)[number]["action"]) => {
    if (action === "voice") {
      router.push("/(root)/(tabs)/assistant");
      return;
    }
    // Receipt scanning is not implemented yet, so both remaining actions open
    // the existing transaction form.
    router.push("/(root)/(tabs)/add-transaction");
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={["top"]}>
      <ScrollView
        className="flex-1 bg-brand-body"
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View className="rounded-b-[28px] bg-brand-bg px-5 pb-[22px] pt-5">
          <View className="mb-[22px] flex-row items-center justify-between">
            <View className="flex-row items-center gap-2">
              <View className="h-9 w-9 items-center justify-center rounded-xl bg-white">
                <Text className="text-lg font-extrabold text-brand-bg">W</Text>
              </View>
              <Text className="text-base font-bold tracking-widest text-brand-text-primary">WELTH</Text>
            </View>

            <View className="flex-row items-center gap-2.5">
              <View className="items-end">
                <Text className="text-xs text-brand-text-secondary">{getGreeting()}</Text>
                <Text className="text-base font-medium text-brand-text-primary">
                  {user?.firstName ?? "there"}
                </Text>
              </View>
              <TouchableOpacity
                onPress={() => router.push("/(root)/(tabs)/profile")}
                className="h-[38px] w-[38px] items-center justify-center overflow-hidden rounded-full bg-[#1A1D26]"
                accessibilityRole="button"
                accessibilityLabel="Open profile"
              >
                {user?.imageUrl && user.hasImage ? (
                  <Image source={{ uri: user.imageUrl }} style={{ width: 38, height: 38 }} contentFit="cover" />
                ) : (
                  <Feather name="user" size={18} color="#8A8D96" />
                )}
              </TouchableOpacity>
            </View>
          </View>

          <View className="mb-[22px]">
            <Text className="mb-1.5 text-xs text-brand-text-secondary">Total balance</Text>
            <Text className="text-[38px] font-medium tracking-tight text-brand-text-primary">
              {formatPrice(totalBalance, currency)}
            </Text>
            <View className="mt-2.5 flex-row gap-3.5">
              <View className="flex-row items-center gap-1.5">
                <Feather name="arrow-up-right" size={14} color="#3DDC84" />
                <Text className="text-[13px] text-brand-success">{formatPrice(monthIncome, currency)}</Text>
              </View>
              <View className="flex-row items-center gap-1.5">
                <Feather name="arrow-down-right" size={14} color="#FF6B4A" />
                <Text className="text-[13px] text-brand-coral">{formatPrice(monthExpense, currency)}</Text>
              </View>
            </View>
          </View>

          <View className="flex-row gap-2.5">
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.action}
                onPress={() => handleQuickAction(action.action)}
                activeOpacity={0.75}
                className="flex-1 items-center gap-2 rounded-2xl border border-brand-surface-border bg-brand-surface py-4"
              >
                <View
                  className="h-9 w-9 items-center justify-center rounded-full"
                  style={{ backgroundColor: action.color + "26" }}
                >
                  <Feather name={action.icon} size={17} color={action.color} />
                </View>
                <Text className="text-center text-[11px] font-medium text-[#B8BAC2]">{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View className="px-5 pb-8 pt-[18px]">
          <TouchableOpacity
            onPress={() => router.push("/(root)/(tabs)/assistant")}
            className="mb-[18px] flex-row items-center gap-2.5 rounded-[18px] border border-[#E8E6DF] bg-white p-3.5"
            accessibilityRole="button"
          >
            <View className="h-[26px] w-[26px] items-center justify-center rounded-full bg-[#4A9EFF1A]">
              <View className="h-[7px] w-[7px] rounded-full bg-brand-blue" />
            </View>
            <Text className="flex-1 text-[13px] text-brand-text-muted">Ask AI anything about your money</Text>
            <Feather name="arrow-right" size={16} color="#4A9EFF" />
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setBudgetModalOpen(true)}
            activeOpacity={0.85}
            className="mb-[18px] rounded-[18px] border border-[#E8E6DF] bg-white p-4"
          >
            <View className="mb-2.5 flex-row items-center justify-between">
              <Text className="text-sm font-medium text-[#1A1D26]">Monthly budget</Text>
              <Feather name="edit-2" size={13} color="#8A8D96" />
            </View>
            {budget ? (
              <>
                <Text className="mb-2 text-xs text-brand-text-secondary">
                  {formatPrice(monthExpense, currency)} of {formatPrice(Number(budget.amount), currency)} spent
                </Text>
                <View className="h-2 overflow-hidden rounded-full bg-[#F0EEE7]">
                  <View
                    className="h-2 rounded-full"
                    style={{
                      width: `${budgetPercentage}%` as `${number}%`,
                      backgroundColor: monthExpense >= budget.amount
                        ? "#FF6B4A"
                        : monthExpense >= budget.amount * 0.8
                          ? "#F7DC6F"
                          : "#3DDC84",
                    }}
                  />
                </View>
              </>
            ) : (
              <Text className="text-xs text-brand-text-secondary">Tap to set a monthly spending budget</Text>
            )}
          </TouchableOpacity>

          <View className="mb-[18px] rounded-[18px] border border-[#E8E6DF] bg-white p-4">
            <Text className="mb-3 text-sm font-medium text-[#1A1D26]">Expense breakdown (this month)</Text>
            {transactionsQuery.isLoading ? (
              <View className="min-h-[120px] items-center justify-center">
                <ActivityIndicator color="#4A9EFF" />
              </View>
            ) : expenseBreakdown.length > 0 ? (
              <View className="flex-row items-center">
                <PieChart
                  data={expenseBreakdown.map((category) => ({
                    value: category.amount,
                    color: category.color,
                  }))}
                  radius={60}
                />
                <View className="ml-4 flex-1 gap-1.5">
                  {expenseBreakdown.slice(0, 6).map((category) => (
                    <View key={category.category} className="flex-row items-center justify-between">
                      <View className="flex-row items-center gap-1.5">
                        <View className="h-2 w-2 rounded-full" style={{ backgroundColor: category.color }} />
                        <Text className="text-[11px] text-brand-text-secondary" numberOfLines={1}>
                          {getCategoryConfig(category.category).label}
                        </Text>
                      </View>
                      <Text className="ml-1 text-[11px] font-medium text-brand-bg">
                        {formatPrice(category.amount, currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : (
              <Text className="py-6 text-center text-xs text-brand-text-secondary">
                No expenses recorded this month yet.
              </Text>
            )}
          </View>

          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-sm font-medium text-[#1A1D26]">Recent transactions</Text>
            <TouchableOpacity onPress={() => router.push("/(root)/(tabs)/transactions")}>
              <Text className="text-xs text-brand-text-secondary">See all</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View className="items-center py-6">
              <ActivityIndicator color="#4A9EFF" />
            </View>
          ) : recentTransactions.length === 0 ? (
            <View className="items-center py-6">
              <Feather name="inbox" size={28} color="#BDC3C7" />
              <Text className="mt-3 text-sm text-brand-text-muted">No transactions yet</Text>
            </View>
          ) : (
            recentTransactions.map((tx) => <TransactionRow key={tx.id} tx={tx} />)
          )}
        </View>
      </ScrollView>

      {user ? (
        <BudgetModal
          visible={budgetModalOpen}
          budget={budget}
          onClose={() => setBudgetModalOpen(false)}
          onSaved={() => setBudgetModalOpen(false)}
        />
      ) : null}
    </SafeAreaView>
  );
}
