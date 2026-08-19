import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function OnboardingScreen() {
  const [startingBalance, setStartingBalance] = useState("");
  const [currency, setCurrency] = useState("USD");

  const handleSave = () => {
    console.log("Starting balance:", startingBalance);
    console.log("Currency:", currency);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={{ flex: 1 }}
    >
      <View
        style={{
          flex: 1,
          justifyContent: "center",
          paddingHorizontal: 24,
        }}
      >
        <Text
          style={{
            fontSize: 30,
            fontWeight: "700",
            marginBottom: 8,
          }}
        >
          Let's get you set up
        </Text>

        <Text
          style={{
            fontSize: 14,
            color: "#8A8D96",
            marginBottom: 40,
          }}
        >
          A couple of quick details to personalise your experience.
        </Text>

        <Text
          style={{
            fontSize: 12,
            fontWeight: "500",
            marginBottom: 6,
          }}
        >
          Starting balance
        </Text>

        <TextInput
          value={startingBalance}
          onChangeText={setStartingBalance}
          placeholder="e.g. 50000"
          placeholderTextColor="#8A8D96"
          keyboardType="numeric"
          style={{
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#E8E6DF",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            marginBottom: 24,
          }}
        />

        <Text
          style={{
            fontSize: 12,
            fontWeight: "500",
            marginBottom: 6,
          }}
        >
          Currency
        </Text>

        <TextInput
          value={currency}
          onChangeText={setCurrency}
          placeholder="USD"
          placeholderTextColor="#8A8D96"
          autoCapitalize="characters"
          style={{
            backgroundColor: "#FFFFFF",
            borderWidth: 1,
            borderColor: "#E8E6DF",
            borderRadius: 12,
            paddingHorizontal: 16,
            paddingVertical: 14,
            marginBottom: 24,
          }}
        />

        <TouchableOpacity
          onPress={handleSave}
          style={{
            backgroundColor: "#1A1D26",
            borderRadius: 12,
            paddingVertical: 16,
            alignItems: "center",
          }}
        >
          <Text
            style={{
              color: "#FFFFFF",
              fontSize: 14,
              fontWeight: "600",
            }}
          >
            Get started
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}