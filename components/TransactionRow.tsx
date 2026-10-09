import { getCategoryConfig } from "@/constants/categories";
import type { Transaction } from "@/lib/services/transactions";
import { formatPrice } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { Feather } from "@expo/vector-icons";
import { Text, View } from "react-native";

export function TransactionRow({ tx }: { tx: Transaction }) {
  const currency = useUserStore((state) => state.currency);
  const category = getCategoryConfig(tx.category);
  const isIncome = tx.type === "INCOME";
  const date = new Date(tx.date);
  const formattedDate = Number.isNaN(date.getTime())
    ? ""
    : new Intl.DateTimeFormat("en", { day: "numeric", month: "short" }).format(date);

  return (
    <View className="mb-2 flex-row items-center rounded-2xl border border-[#E8E6DF] bg-white p-3.5">
      <View
        className="mr-3 h-10 w-10 items-center justify-center rounded-full"
        style={{ backgroundColor: `${category.color}22` }}
      >
        <Text className="text-lg">{category.icon}</Text>
      </View>
      <View className="flex-1">
        <Text className="text-[13px] font-semibold text-[#1A1D26]" numberOfLines={1}>
          {tx.description?.trim() || category.label}
        </Text>
        <Text className="mt-1 text-[11px] text-brand-text-secondary">
          {category.label}{formattedDate ? ` · ${formattedDate}` : ""}
        </Text>
      </View>
      <View className="items-end">
        <Text className={`text-[13px] font-semibold ${isIncome ? "text-brand-success" : "text-brand-bg"}`}>
          {isIncome ? "+" : "−"}{formatPrice(Number(tx.amount), currency)}
        </Text>
        <Feather
          name={isIncome ? "trending-up" : "trending-down"}
          size={12}
          color={isIncome ? "#3DDC84" : "#FF6B4A"}
        />
      </View>
    </View>
  );
}
