import { useMemo, useState } from "react";
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
  const [transactions, setTransactions] = useState<Transaction[]>(
    SAMPLE_TRANSACTIONS
  );

  const [activeFilter, setActiveFilter] = useState<Filter>("All");
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const accounts = SAMPLE_ACCOUNTS;

  const filteredTransactions = useMemo(() => {
    let result = transactions;

    if (activeFilter === "Income") {
      result = result.filter((tx) => tx.type === "INCOME");
    }

    if (activeFilter === "Expense") {
      result = result.filter((tx) => tx.type === "EXPENSE");
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
  }, [transactions, activeFilter, search]);

  const refreshData = () => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
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
            setTransactions((current) =>
              current.filter((tx) => tx.id !== transaction.id)
            );
          },
        },
      ]
    );
  };

  const handleExport = () => {
    Alert.alert(
      "Export",
      `${filteredTransactions.length} transaction(s) ready to export.`
    );
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
            <Text style={{ fontSize: 18 }}>↓</Text>
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
            paddingBottom: 100,
          }}
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
                borderRadius: 14,
                padding: 16,
                marginBottom: 10,
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
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
                    color: "#8A8D96",
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
                      item.type === "INCOME" ? "#3DDC84" : "#FF6B4A",
                  }}
                >
                  {item.type === "INCOME" ? "+" : "-"}{" "}
                  {item.amount.toLocaleString()}
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