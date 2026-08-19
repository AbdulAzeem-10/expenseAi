import { View, Text } from "react-native";
// import "@/global.css";

export default function Index() {
  return (
    <View className="flex-1 justify-center items-center bg-white">
      <Text className="text-3xl font-bold text-blue-600 text-center">
        Welcome to the Expense Manager
      </Text>
    </View>
  );
}