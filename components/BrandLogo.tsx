import { Image } from "expo-image";

export function BrandLogo({ width = 220, height = 80 }: { width?: number; height?: number }) {
  return (
    <Image
      source={require("../assets/images/expenseai-logo.png")}
      style={{ width, height }}
      contentFit="contain"
      accessibilityLabel="ExpenseAi"
    />
  );
}
