import "@/global.css";
import { ClerkProvider, useAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { Stack } from "expo-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query/client";
import { ActivityIndicator, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;

if (!publishableKey) {
  throw new Error("Add your Clerk Publishable Key to the .env file");
}

function RootNavigator() {
  const { isLoaded, isSignedIn: clerkIsSignedIn } = useAuth();
  const isSignedIn = clerkIsSignedIn === true;

  if (!isLoaded) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#F5F4F0" }}>
        <ActivityIndicator size="large" color="#FF6B4A" />
      </View>
    );
  }

  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        {/* Keep the index route mounted so it can route users after auth changes. */}
        <Stack.Screen name="index" />
        <Stack.Protected guard={!isSignedIn}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>
        <Stack.Protected guard={isSignedIn}>
          <Stack.Screen name="(root)" />
        </Stack.Protected>
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <QueryClientProvider client={queryClient}>
        <ClerkProvider publishableKey={publishableKey} tokenCache={tokenCache}>
          <RootNavigator />
        </ClerkProvider>
      </QueryClientProvider>
    </GestureHandlerRootView>
  );
}
