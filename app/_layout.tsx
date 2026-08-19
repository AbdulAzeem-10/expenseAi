import { View, Text } from "react-native";

export default function RootLayout() {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-3xl font-bold text-blue-600">
        Expense Manager
      </Text>
    </View>
  );
}