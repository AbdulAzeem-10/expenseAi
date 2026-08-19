import { Link, useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SignIn() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    setError("");

    if (!email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!password.trim()) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      // Temporary boilerplate login.
      // Replace this with your backend authentication later.
      await new Promise((resolve) => setTimeout(resolve, 500));

      console.log("Sign in:", {
        email,
        password,
      });

      router.replace("/");
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-gray-100"
    >
      <View className="flex-1 justify-center px-6">
        {/* Logo / App name */}
        <View className="mb-10">
          <Text className="text-3xl font-bold text-gray-900">
            Welth
          </Text>

          <Text className="text-gray-500 text-base mt-2">
            Welcome back
          </Text>
        </View>

        {/* Email */}
        <Text className="text-gray-900 text-sm font-medium mb-2">
          Email
        </Text>

        <TextInput
          value={email}
          onChangeText={(value) => {
            setEmail(value);
            setError("");
          }}
          placeholder="Email Address"
          placeholderTextColor="#999"
          autoCapitalize="none"
          keyboardType="email-address"
          autoCorrect={false}
          className="bg-white border border-gray-200 rounded-xl px-4 py-4 mb-4 text-gray-900"
        />

        {/* Password */}
        <Text className="text-gray-900 text-sm font-medium mb-2">
          Password
        </Text>

        <TextInput
          value={password}
          onChangeText={(value) => {
            setPassword(value);
            setError("");
          }}
          placeholder="Password"
          placeholderTextColor="#999"
          secureTextEntry
          className="bg-white border border-gray-200 rounded-xl px-4 py-4 mb-3 text-gray-900"
        />

        {/* Error */}
        {error ? (
          <Text className="text-red-500 text-sm mb-4">
            {error}
          </Text>
        ) : null}

        {/* Sign In */}
        <TouchableOpacity
          onPress={handleSignIn}
          disabled={loading}
          className="bg-black rounded-xl py-4 items-center mb-5"
          style={{
            opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Sign In
            </Text>
          )}
        </TouchableOpacity>

        {/* Sign Up */}
        <View className="flex-row justify-center">
          <Text className="text-gray-500">
            Don't have an account?{" "}
          </Text>

          <Link href="/sign-up">
            <Text className="text-blue-500 font-semibold">
              Sign Up
            </Text>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}