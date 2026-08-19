import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

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
  balance: number;
};

type Budget = {
  amount: number;
};

const SAMPLE_ACCOUNTS: Account[] = [
  {
    id: "1",
    name: "Cash",
    balance: 25000,
  },
  {
    id: "2",
    name: "Bank",
    balance: 75000,
  },
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
    date: "2026-08-08",
  },
  {
    id: "4",
    description: "Restaurant",
    category: "Food",
    type: "EXPENSE",
    amount: 1800,
    date: "2026-08-12",
  },
  {
    id: "5",
    description: "Freelance",
    category: "Income",
    type: "INCOME",
    amount: 15000,
    date: "2026-08-14",
  },
];

const SAMPLE_BUDGET: Budget = {
  amount: 30000,
};

const CATEGORY_COLORS: Record<string, string> = {
  Food: "#FF6B4A",
  Bills: "#4A9EFF",
  Transport: "#F7DC6F",
  Shopping: "#9B59B6",
  Entertainment: "#3DDC84",
  Other: "#8A8D96",
};

const QUICK_ACTIONS = [
  {
    symbol: "📷",
    label: "AI Receipt Scan",
    color: "#1A85FF",
  },
  {
    symbol: "🎤",
    label: "Voice Entry",
    color: "#FF6B4A",
  },
  {
    symbol: "+",
    label: "Add Manually",
    color: "#3DDC84",
  },
];

function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) {
    return "Good morning";
  }

  if (hour < 18) {
    return "Good afternoon";
  }

  return "Good evening";
}

function formatPrice(amount: number, currency: string) {
  return `${currency} ${amount.toLocaleString()}`;
}

function TransactionRow({
  transaction,
}: {
  transaction: Transaction;
}) {
  const isIncome = transaction.type === "INCOME";

  return (
    <View
      style={{
        backgroundColor: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#E8E6DF",
        borderRadius: 14,
        padding: 14,
        marginBottom: 8,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <View
        style={{
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: isIncome ? "#E9F9F0" : "#FFF0EC",
          alignItems: "center",
          justifyContent: "center",
          marginRight: 12,
        }}
      >
        <Text style={{ fontSize: 18 }}>
          {isIncome ? "↑" : "↓"}
        </Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text
          style={{
            fontSize: 13,
            fontWeight: "600",
            color: "#1A1D26",
          }}
        >
          {transaction.description}
        </Text>

        <Text
          style={{
            fontSize: 11,
            color: "#8A8D96",
            marginTop: 3,
          }}
        >
          {transaction.category}
        </Text>
      </View>

      <Text
        style={{
          fontSize: 13,
          fontWeight: "600",
          color: isIncome ? "#3DDC84" : "#FF6B4A",
        }}
      >
        {isIncome ? "+" : "-"}
        {transaction.amount.toLocaleString()}
      </Text>
    </View>
  );
}

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);

  const accounts = SAMPLE_ACCOUNTS;
  const transactions = SAMPLE_TRANSACTIONS;
  const budget = SAMPLE_BUDGET;

  const currency = "USD";

  const user = {
    firstName: "Abdul",
  };

  const loading = false;

  const totalBalance = useMemo(() => {
    return accounts.reduce(
      (sum, account) => sum + account.balance,
      0
    );
  }, [accounts]);

  const monthIncome = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === "INCOME")
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const monthExpense = useMemo(() => {
    return transactions
      .filter((tx) => tx.type === "EXPENSE")
      .reduce((sum, tx) => sum + tx.amount, 0);
  }, [transactions]);

  const recentTransactions = useMemo(() => {
    return transactions.slice(0, 5);
  }, [transactions]);

  const expenseBreakdown = useMemo(() => {
    const breakdown: Record<string, number> = {};

    transactions
      .filter((tx) => tx.type === "EXPENSE")
      .forEach((tx) => {
        breakdown[tx.category] =
          (breakdown[tx.category] || 0) + tx.amount;
      });

    return Object.entries(breakdown)
      .sort((a, b) => b[1] - a[1])
      .map(([category, amount]) => ({
        category,
        amount,
        color: CATEGORY_COLORS[category] || "#8A8D96",
      }));
  }, [transactions]);

  const budgetPercentage =
    budget.amount > 0
      ? Math.min(
          Math.round((monthExpense / budget.amount) * 100),
          100
        )
      : 0;

  const onRefresh = () => {
    setRefreshing(true);

    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const handleQuickAction = (label: string) => {
    console.log(`${label} pressed`);
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
          />
        }
      >
        {/* Hero Header */}

        <View
          style={{
            backgroundColor: "#1A1D26",
            borderBottomLeftRadius: 28,
            borderBottomRightRadius: 28,
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 22,
          }}
        >
          {/* Header */}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 24,
            }}
          >
            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 20,
                fontWeight: "700",
              }}
            >
              WELTH
            </Text>

            <View
              style={{
                flexDirection: "row",
                alignItems: "center",
              }}
            >
              <View
                style={{
                  alignItems: "flex-end",
                  marginRight: 10,
                }}
              >
                <Text
                  style={{
                    color: "#8A8D96",
                    fontSize: 11,
                  }}
                >
                  {getGreeting()}
                </Text>

                <Text
                  style={{
                    color: "#FFFFFF",
                    fontSize: 15,
                    fontWeight: "500",
                  }}
                >
                  {user.firstName}
                </Text>
              </View>

              <View
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  backgroundColor: "#2A2E3A",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Text style={{ fontSize: 18 }}>👤</Text>
              </View>
            </View>
          </View>

          {/* Balance */}

          <View style={{ marginBottom: 22 }}>
            <Text
              style={{
                color: "#8A8D96",
                fontSize: 12,
                marginBottom: 6,
              }}
            >
              Total balance
            </Text>

            <Text
              style={{
                color: "#FFFFFF",
                fontSize: 38,
                fontWeight: "500",
              }}
            >
              {formatPrice(totalBalance, currency)}
            </Text>

            <View
              style={{
                flexDirection: "row",
                marginTop: 10,
                gap: 18,
              }}
            >
              <Text
                style={{
                  color: "#3DDC84",
                  fontSize: 13,
                }}
              >
                ↑ {formatPrice(monthIncome, currency)}
              </Text>

              <Text
                style={{
                  color: "#FF6B4A",
                  fontSize: 13,
                }}
              >
                ↓ {formatPrice(monthExpense, currency)}
              </Text>
            </View>
          </View>

          {/* Quick Actions */}

          <View
            style={{
              flexDirection: "row",
              gap: 10,
            }}
          >
            {QUICK_ACTIONS.map((action) => (
              <TouchableOpacity
                key={action.label}
                onPress={() => handleQuickAction(action.label)}
                activeOpacity={0.75}
                style={{
                  flex: 1,
                  backgroundColor: "#242832",
                  borderWidth: 1,
                  borderColor: "#353945",
                  borderRadius: 16,
                  paddingVertical: 15,
                  alignItems: "center",
                }}
              >
                <View
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 18,
                    backgroundColor: `${action.color}26`,
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 8,
                  }}
                >
                  <Text
                    style={{
                      fontSize: 17,
                      color: action.color,
                    }}
                  >
                    {action.symbol}
                  </Text>
                </View>

                <Text
                  style={{
                    color: "#B8BAC2",
                    fontSize: 10,
                    fontWeight: "500",
                    textAlign: "center",
                  }}
                >
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Body */}

        <View
          style={{
            paddingHorizontal: 20,
            paddingTop: 18,
            paddingBottom: 30,
          }}
        >
          {/* AI Assistant */}

          <TouchableOpacity
            onPress={() =>
              console.log("AI Assistant pressed")
            }
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E8E6DF",
              borderRadius: 18,
              padding: 14,
              flexDirection: "row",
              alignItems: "center",
              marginBottom: 18,
            }}
          >
            <View
              style={{
                width: 26,
                height: 26,
                borderRadius: 13,
                backgroundColor: "#EAF4FF",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 10,
              }}
            >
              <View
                style={{
                  width: 7,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: "#4A9EFF",
                }}
              />
            </View>

            <Text
              style={{
                color: "#8A8D96",
                fontSize: 13,
                flex: 1,
              }}
            >
              Ask AI anything about your money
            </Text>

            <Text
              style={{
                color: "#4A9EFF",
                fontSize: 20,
              }}
            >
              →
            </Text>
          </TouchableOpacity>

          {/* Budget */}

          <TouchableOpacity
            onPress={() =>
              console.log("Budget modal would open")
            }
            activeOpacity={0.85}
            style={{
              backgroundColor: "#FFFFFF",
              borderWidth: 1,
              borderColor: "#E8E6DF",
              borderRadius: 18,
              padding: 16,
              marginBottom: 18,
            }}
          >
            <View
              style={{
                flexDirection: "row",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 10,
              }}
            >
              <Text
                style={{
                  color: "#1A1D26",
                  fontSize: 14,
                  fontWeight: "500",
                }}
              >
                Monthly budget
              </Text>

              <Text style={{ color: "#8A8D96" }}>✎</Text>
            </View>

            <Text
              style={{
                color: "#5C5F68",
                fontSize: 12,
                marginBottom: 8,
              }}
            >
              {formatPrice(monthExpense, currency)} of{" "}
              {formatPrice(budget.amount, currency)} spent
            </Text>

            <View
              style={{
                height: 8,
                borderRadius: 4,
                backgroundColor: "#F0EEE7",
                overflow: "hidden",
              }}
            >
              <View
                style={{
                  height: 8,
                  borderRadius: 4,
                  width: `${budgetPercentage}%`,
                  backgroundColor:
                    monthExpense >= budget.amount
                      ? "#FF6B4A"
                      : monthExpense >= budget.amount * 0.8
                      ? "#F7DC6F"
                      : "#3DDC84",
                }}
              />
            </View>

            <Text
              style={{
                color: "#8A8D96",
                fontSize: 11,
                marginTop: 7,
              }}
            >
              {budgetPercentage}% used
            </Text>
          </TouchableOpacity>

          {/* Expense Breakdown */}

          {expenseBreakdown.length > 0 && (
            <View
              style={{
                backgroundColor: "#FFFFFF",
                borderWidth: 1,
                borderColor: "#E8E6DF",
                borderRadius: 18,
                padding: 16,
                marginBottom: 18,
              }}
            >
              <Text
                style={{
                  color: "#1A1D26",
                  fontSize: 14,
                  fontWeight: "500",
                  marginBottom: 14,
                }}
              >
                Expense breakdown
              </Text>

              {expenseBreakdown.map((item) => (
                <View
                  key={item.category}
                  style={{
                    marginBottom: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <View
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                      }}
                    >
                      <View
                        style={{
                          width: 8,
                          height: 8,
                          borderRadius: 4,
                          backgroundColor: item.color,
                          marginRight: 7,
                        }}
                      />

                      <Text
                        style={{
                          color: "#5C5F68",
                          fontSize: 11,
                        }}
                      >
                        {item.category}
                      </Text>
                    </View>

                    <Text
                      style={{
                        color: "#1A1D26",
                        fontSize: 11,
                        fontWeight: "500",
                      }}
                    >
                      {formatPrice(item.amount, currency)}
                    </Text>
                  </View>

                  <View
                    style={{
                      height: 5,
                      borderRadius: 3,
                      backgroundColor: "#F0EEE7",
                      overflow: "hidden",
                    }}
                  >
                    <View
                      style={{
                        height: 5,
                        borderRadius: 3,
                        width: `${Math.min(
                          (item.amount / monthExpense) * 100,
                          100
                        )}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* Recent Transactions */}

          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: 12,
            }}
          >
            <Text
              style={{
                color: "#1A1D26",
                fontSize: 14,
                fontWeight: "500",
              }}
            >
              Recent transactions
            </Text>

            <TouchableOpacity
              onPress={() =>
                console.log("See all transactions")
              }
            >
              <Text
                style={{
                  color: "#5C5F68",
                  fontSize: 12,
                }}
              >
                See all
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View
              style={{
                alignItems: "center",
                paddingVertical: 24,
              }}
            >
              <ActivityIndicator
                size="small"
                color="#4A9EFF"
              />
            </View>
          ) : recentTransactions.length === 0 ? (
            <View
              style={{
                alignItems: "center",
                paddingVertical: 24,
              }}
            >
              <Text style={{ fontSize: 28 }}>📭</Text>

              <Text
                style={{
                  color: "#8A8D96",
                  fontSize: 14,
                  marginTop: 10,
                }}
              >
                No transactions yet
              </Text>
            </View>
          ) : (
            recentTransactions.map((transaction) => (
              <TransactionRow
                key={transaction.id}
                transaction={transaction}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}