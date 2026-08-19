import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

export default function SignUpScreen() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");

  const handleSignUp = async () => {
    if (!firstName || !lastName || !email || !password) {
      console.log("Please fill in all fields");
      return;
    }

    setLoading(true);

    try {
      // TODO:
      // Send signup request to your backend here.
      //
      // Example:
      // const response = await fetch("YOUR_API_URL/signup", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     firstName,
      //     lastName,
      //     email,
      //     password,
      //   }),
      // });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Account created");

      // If your backend requires email verification:
      setShowVerification(true);
    } catch (error) {
      console.error("Signup error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!verificationCode) {
      console.log("Enter verification code");
      return;
    }

    setLoading(true);

    try {
      // TODO:
      // Send verification code to your backend.
      //
      // Example:
      // await fetch("YOUR_API_URL/verify-email", {
      //   method: "POST",
      //   headers: {
      //     "Content-Type": "application/json",
      //   },
      //   body: JSON.stringify({
      //     email,
      //     code: verificationCode,
      //   }),
      // });

      await new Promise((resolve) => setTimeout(resolve, 1000));

      console.log("Email verified");
    } catch (error) {
      console.error("Verification error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (showVerification) {
    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1 bg-white"
      >
        <View className="flex-1 justify-center px-6">
          <Text className="text-3xl font-bold text-black mb-2">
            Verify your account
          </Text>

          <Text className="text-gray-500 mb-8">
            We sent a verification code to {email}
          </Text>

          <TextInput
            className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-black"
            placeholder="Verification code"
            placeholderTextColor="#999"
            value={verificationCode}
            onChangeText={setVerificationCode}
            keyboardType="number-pad"
          />

          <TouchableOpacity
            onPress={handleVerify}
            disabled={loading}
            className="bg-blue-500 rounded-xl py-4 items-center"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-white font-semibold text-base">
                Verify
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowVerification(false)}
            className="mt-4 items-center"
          >
            <Text className="text-blue-500">
              Back to sign up
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-white"
    >
      <View className="flex-1 justify-center px-6">

        <Text className="text-3xl font-bold text-black mb-2">
          Create account
        </Text>

        <Text className="text-gray-500 text-base mb-8">
          Create your account to get started
        </Text>

        {/* First and Last Name */}
        <View className="flex-row gap-3 mb-4">
          <TextInput
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-black"
            placeholder="First name"
            placeholderTextColor="#999"
            value={firstName}
            onChangeText={setFirstName}
            autoCapitalize="words"
          />

          <TextInput
            className="flex-1 border border-gray-300 rounded-xl px-4 py-3 text-black"
            placeholder="Last name"
            placeholderTextColor="#999"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
        </View>

        {/* Email */}
        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3 mb-4 text-black"
          placeholder="Email Address"
          placeholderTextColor="#999"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {/* Password */}
        <TextInput
          className="border border-gray-300 rounded-xl px-4 py-3 mb-6 text-black"
          placeholder="Password"
          placeholderTextColor="#999"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {/* Sign Up */}
        <TouchableOpacity
          onPress={handleSignUp}
          disabled={loading}
          className="bg-blue-500 rounded-xl py-4 items-center"
        >
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text className="text-white font-semibold text-base">
              Sign Up
            </Text>
          )}
        </TouchableOpacity>

        {/* Sign In */}
        <View className="flex-row justify-center mt-6">
          <Text className="text-gray-500">
            Already have an account?{" "}
          </Text>

          <TouchableOpacity>
            <Text className="text-blue-500 font-semibold">
              Sign In
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </KeyboardAvoidingView>
  );
}