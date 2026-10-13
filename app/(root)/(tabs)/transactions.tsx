import { useMemo, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { useFinanceData } from "@/hooks/useFinanceData";
import { queryKeys } from "@/lib/query/keys";
import { deleteTransaction } from "@/lib/services/transactions";
import { getCategoryConfig } from "@/constants/categories";
import { exportTransactionsToCsv } from "@/lib/utils/exportTransactions";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

const FILTERS = ["All", "Income", "Expense"] as const;

type Filter = (typeof FILTERS)[number];

type Transaction = {
  id: string;
  description: string;
  category: string;
  type: "INCOME" | "EXPENSE";
  amount: number;
  date: string;
};

type Account = {
  id: string;
  name: string;
};

const SAMPLE_ACCOUNTS: Account[] = [
  { id: "1", name: "Cash" },
  { id: "2", name: "Bank" },
];

const SAMPLE_TRANSACTIONS: Transaction[] = [
  {
    id: "1",
    description: "Salary",
    category: "Income",
    type: "INCOME",
    amount: 50000,
    date: "2026-08-01",
  },
  {
    id: "2",
    description: "Groceries",
    category: "Food",
    type: "EXPENSE",
    amount: 4500,
    date: "2026-08-05",
  },
  {
    id: "3",
    description: "Electricity Bill",
    category: "Bills",
    type: "EXPENSE",
    amount: 3200,
    date: "2026-08-10",
  },
];

export default function TransactionsScreen() {
  const { user, supabase, accounts: accountsQuery, transactions: transactionsQuery } = useFinanceData();
  const queryClient = useQueryClient();
  const transactions: Transaction[] = (transactionsQuery.data ?? []).map((tx) => ({
    id: tx.id,
    description: tx.description ?? getCategoryConfig(tx.category).label,
    category: getCategoryConfig(tx.category).label,
    type: tx.type,
    amount: Number(tx.amount),
    date: tx.date,
  }));
  const activeFilterInit: Filter = "All";
  const [activeFilter, setActiveFilter] = useState<Filter>(activeFilterInit);
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const loading = accountsQuery.isLoading || transactionsQuery.isLoading;
  const [refreshing, setRefreshing] = useState(false);
  const accounts = accountsQuery.data ?? [];
  const chartTransactions = transactions.filter((tx) => {
    if (activeFilter === "Income" && tx.type !== "INCOME") return false;
    if (activeFilter === "Expense" && tx.type !== "EXPENSE") return false;
    if (activeAccountId && (transactionsQuery.data ?? []).find((row) => row.id === tx.id)?.account_id !== activeAccountId) return false;
    return true;
  });

  const chartData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (13 - index));
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
      const dayTransactions = chartTransactions.filter((tx) => tx.date.slice(0, 10) === key);
      return {
        label: `${date.getDate()}`,
        income: dayTransactions.filter((tx) => tx.type === "INCOME").reduce((sum, tx) => sum + tx.amount, 0),
        expense: dayTransactions.filter((tx) => tx.type === "EXPENSE").reduce((sum, tx) => sum + tx.amount, 0),
      };
    });
    const peak = Math.max(1, ...days.flatMap((day) => [day.income, day.expense]));
    return days.map((day) => ({ ...day, incomeHeight: day.income ? Math.max(5, (day.income / peak) * 150) : 0, expenseHeight: day.expense ? Math.max(5, (day.expense / peak) * 150) : 0 }));
  }, [chartTransactions]);

  const chartCard = (
    <View style={{ backgroundColor: "#FFFFFF", borderWidth: 1, borderColor: "#E8E6DF", borderRadius: 22, padding: 18, marginBottom: 16 }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 18 }}>
        <Text style={{ fontSize: 15, fontWeight: "600", color: "#1A1D26" }}>Daily income vs expense</Text>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#63D695" }} /><Text style={{ fontSize: 11, color: "#777B82" }}>Income</Text></View>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}><View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: "#C66F53" }} /><Text style={{ fontSize: 11, color: "#777B82" }}>Expense</Text></View>
        </View>
      </View>
      <View style={{ height: 180, justifyContent: "flex-end" }}>
        {[0, 1, 2].map((line) => <View key={line} style={{ position: "absolute", top: 8 + line * 50, left: 0, right: 0, borderTopWidth: 1, borderColor: "#F1F0ED", borderStyle: "dashed" }} />)}
        <View style={{ height: 1, backgroundColor: "#E8E6DF" }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 1 }}>
          {chartData.map((day, index) => (
            <View key={`${day.label}-${index}`} style={{ width: "6.8%", alignItems: "center" }}>
              <View style={{ height: 154, flexDirection: "row", alignItems: "flex-end", gap: 2 }}>
                <View style={{ width: 6, height: day.incomeHeight, backgroundColor: "#63D695", borderTopLeftRadius: 5, borderTopRightRadius: 5 }} />
                <View style={{ width: 6, height: day.expenseHeight, backgroundColor: "#C66F53", borderTopLeftRadius: 5, borderTopRightRadius: 5 }} />
              </View>
              <Text style={{ color: "#9A9CA2", fontSize: 9, marginTop: 7 }}>{day.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );

  const filteredTransactions = useMemo(() => {
    let result = transactions;

    if (activeFilter === "Income") {
      result = result.filter((tx) => tx.type === "INCOME");
    }

    if (activeFilter === "Expense") {
      result = result.filter((tx) => tx.type === "EXPENSE");
    }

    if (activeAccountId) {
      result = result.filter((tx) => (transactionsQuery.data ?? []).find((row) => row.id === tx.id)?.account_id === activeAccountId);
    }

    const query = search.trim().toLowerCase();

    if (query) {
      result = result.filter(
        (tx) =>
          tx.description.toLowerCase().includes(query) ||
          tx.category.toLowerCase().includes(query)
      );
    }

    return result;
  }, [transactions, transactionsQuery.data, activeFilter, activeAccountId, search]);

  const refreshData = async () => {
    setRefreshing(true);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: queryKeys.transactions(user?.id) }),
      queryClient.invalidateQueries({ queryKey: queryKeys.accounts(user?.id) }),
    ]);
    setRefreshing(false);
  };

  const handleDelete = (transaction: Transaction) => {
    Alert.alert(
      "Delete transaction",
      `Delete "${transaction.description}"?`,
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            const row = (transactionsQuery.data ?? []).find((item) => item.id === transaction.id);
            if (!row) return;
            void deleteTransaction(supabase, row.id, row.account_id, Number(row.amount), row.type)
              .then(({ error }) => {
                if (error) throw error;
                return Promise.all([
                  queryClient.invalidateQueries({ queryKey: queryKeys.transactions(user?.id) }),
                  queryClient.invalidateQueries({ queryKey: queryKeys.accounts(user?.id) }),
                ]);
              })
              .catch((error) => Alert.alert("Delete failed", error instanceof Error ? error.message : "Please try again."));
          },
        },
      ]
    );
  };

  const handleExport = async () => {
    if (filteredTransactions.length === 0) {
      Alert.alert("Export transactions", "There are no transactions to export.");
      return;
    }

    const visibleIds = new Set(filteredTransactions.map((transaction) => transaction.id));
    const exportData = (transactionsQuery.data ?? []).filter((transaction) => visibleIds.has(transaction.id));

    try {
      const result = await exportTransactionsToCsv(exportData);
      if (!result.shared) {
        Alert.alert("CSV created", `${result.count} transaction(s) exported. Sharing is unavailable on this device.`);
      }
    } catch (error) {
      Alert.alert("Export failed", error instanceof Error ? error.message : "Please try again.");
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: "#F7F6F0" }}>
      <View style={{ paddingHorizontal: 20, paddingTop: 20 }}>
        {/* Header */}
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 14,
          }}
        >
          <Text
            style={{
              fontSize: 22,
              fontWeight: "600",
              color: "#1A1D26",
            }}
          >
            Transactions
          </Text>

          <TouchableOpacity
            onPress={handleExport}
            style={{
              width: 40,
              height: 40,
              borderRadius: 20,
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E8E6DF",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="download" size={18} color="#1A1D26" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View
          style={{
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#E8E6DF",
            borderRadius: 12,
            paddingHorizontal: 14,
            paddingVertical: 4,
            marginBottom: 12,
          }}
        >
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search transactions"
            placeholderTextColor="#8A8D96"
            style={{
              fontSize: 13,
              color: "#1A1D26",
            }}
          />
        </View>

        {/* Filters */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 10 }}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            {FILTERS.map((filter) => {
              const active = activeFilter === filter;

              return (
                <TouchableOpacity
                  key={filter}
                  onPress={() => setActiveFilter(filter)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    borderWidth: 1,
                    borderColor: active ? "#1A1D26" : "#E8E6DF",
                    backgroundColor: active ? "#1A1D26" : "#FFFFFF",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: active ? "#FFFFFF" : "#5C5F68",
                    }}
                  >
                    {filter}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Accounts */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 12 }}
        >
          <View style={{ flexDirection: "row", gap: 8 }}>
            <TouchableOpacity
              onPress={() => setActiveAccountId(null)}
              style={{
                paddingHorizontal: 14,
                paddingVertical: 8,
                borderRadius: 20,
                backgroundColor:
                  activeAccountId === null ? "#1A1D26" : "#FFFFFF",
                borderWidth: 1,
                borderColor:
                  activeAccountId === null ? "#1A1D26" : "#E8E6DF",
              }}
            >
              <Text
                style={{
                  fontSize: 12,
                  color:
                    activeAccountId === null ? "#FFFFFF" : "#5C5F68",
                }}
              >
                All Accounts
              </Text>
            </TouchableOpacity>

            {accounts.map((account) => {
              const active = activeAccountId === account.id;

              return (
                <TouchableOpacity
                  key={account.id}
                  onPress={() => setActiveAccountId(account.id)}
                  style={{
                    paddingHorizontal: 14,
                    paddingVertical: 8,
                    borderRadius: 20,
                    backgroundColor: active ? "#1A1D26" : "#FFFFFF",
                    borderWidth: 1,
                    borderColor: active ? "#1A1D26" : "#E8E6DF",
                  }}
                >
                  <Text
                    style={{
                      fontSize: 12,
                      color: active ? "#FFFFFF" : "#5C5F68",
                    }}
                  >
                    {account.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      </View>

      {/* Loading */}
      {loading ? (
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <ActivityIndicator size="large" color="#1A1D26" />
        </View>
      ) : (
        <FlatList
          data={filteredTransactions}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 110,
          }}
          ListHeaderComponent={chartCard}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshData}
            />
          }
          renderItem={({ item }) => (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#E8E6DF",
                borderRadius: 20,
                padding: 16,
                marginBottom: 12,
                minHeight: 90,
                borderLeftWidth: 3,
                borderLeftColor: item.type === "INCOME" ? "#8B5BB2" : "#72B9B1",
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: item.type === "INCOME" ? "#F3ECF8" : "#EDF5F3", alignItems: "center", justifyContent: "center", marginRight: 12 }}>
                <Feather name={item.type === "INCOME" ? "dollar-sign" : "shopping-bag"} size={20} color={item.type === "INCOME" ? "#8B5BB2" : "#68A9A2"} />
              </View>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: "600",
                    color: "#1A1D26",
                  }}
                >
                  {item.description}
                </Text>

                <Text
                  style={{
                    fontSize: 12,
                    color: item.type === "INCOME" ? "#8B5BB2" : "#68A9A2",
                    marginTop: 4,
                  }}
                >
                  {item.category}
                </Text>

                <Text
                  style={{
                    fontSize: 11,
                    color: "#8A8D96",
                    marginTop: 3,
                  }}
                >
                  {item.date}
                </Text>
              </View>

              <View style={{ alignItems: "flex-end" }}>
                <Text
                  style={{
                    fontSize: 15,
                    fontWeight: "600",
                    color:
                      item.type === "INCOME" ? "#63C98A" : "#B97460",
                  }}
                >
                  {item.type === "INCOME" ? "+" : "-"}{" "}
                  ₹{item.amount.toLocaleString("en-IN")}
                </Text>

                <TouchableOpacity
                  onPress={() => handleDelete(item)}
                  style={{ marginTop: 6 }}
                >
                  <Text
                    style={{
                      color: "#FF6B4A",
                      fontSize: 11,
                    }}
                  >
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                paddingVertical: 80,
              }}
            >
              <Text
                style={{
                  fontSize: 14,
                  color: "#8A8D96",
                }}
              >
                {search
                  ? "No matching transactions"
                  : "No transactions yet"}
              </Text>
            </View>
          }
        />
      )}

      {/* Add Transaction Button */}
      <TouchableOpacity
        onPress={() =>
          Alert.alert("Add Transaction", "Add transaction screen")
        }
        style={{
          position: "absolute",
          right: 20,
          bottom: 30,
          width: 56,
          height: 56,
          borderRadius: 28,
          backgroundColor: "#1A1D26",
          alignItems: "center",
          justifyContent: "center",
          elevation: 5,
        }}
      >
        <Text
          style={{
            color: "#FFFFFF",
            fontSize: 28,
            fontWeight: "300",
          }}
        >
          +
        </Text>
      </TouchableOpacity>
    </View>
  );
}
