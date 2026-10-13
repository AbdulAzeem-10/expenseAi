import { signInSchema, type SignInFormValues } from "@/lib/schemas/auth";
import { BrandLogo } from "@/components/BrandLogo";
import { Link } from "expo-router";
import { useAuth, useSignIn } from "@clerk/expo";
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

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const clerkError = error as { message?: string; errors?: { longMessage?: string; message?: string }[] };
    return clerkError.errors?.[0]?.longMessage ?? clerkError.errors?.[0]?.message ?? clerkError.message ?? "Sign in failed. Please try again.";
  }
  return "Sign in failed. Please try again.";
}

export default function SignInScreen() {
  const { isLoaded } = useAuth();
  const { signIn } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSignIn = async () => {
    const parsed = signInSchema.safeParse({ email: emailAddress, password } satisfies SignInFormValues);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your sign-in details.");
      return;
    }
    if (!isLoaded) return;

    setLoading(true);
    setError("");
    try {
      const result = await signIn.password({ emailAddress: parsed.data.email, password: parsed.data.password });
      if (result.error) {
        setError(getErrorMessage(result.error));
        return;
      }
      const finalized = await signIn.finalize();
      if (finalized.error) setError(getErrorMessage(finalized.error));
    } catch (signInError) {
      setError(getErrorMessage(signInError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} className="flex-1 bg-brand-body">
      <View className="flex-1 justify-center px-6">
        <View className="mb-5">
          <BrandLogo width={230} height={84} />
        </View>
        <Text className="mb-2 text-3xl font-bold text-brand-bg">Welcome back</Text>
        <Text className="mb-8 text-sm text-brand-text-muted">Sign in to continue to ExpenseAi.</Text>
        <Text className="mb-2 text-sm font-medium text-brand-bg">Email</Text>
        <TextInput value={emailAddress} onChangeText={(value) => { setEmailAddress(value); setError(""); }} placeholder="Email address" placeholderTextColor="#8A8D96" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" className="mb-4 rounded-xl border border-[#E8E6DF] bg-white px-4 py-4 text-brand-bg" />
        <Text className="mb-2 text-sm font-medium text-brand-bg">Password</Text>
        <TextInput value={password} onChangeText={(value) => { setPassword(value); setError(""); }} placeholder="Password" placeholderTextColor="#8A8D96" secureTextEntry textContentType="password" className="mb-4 rounded-xl border border-[#E8E6DF] bg-white px-4 py-4 text-brand-bg" onSubmitEditing={handleSignIn} />
        {error ? <Text className="mb-4 text-sm text-brand-coral">{error}</Text> : null}
        <TouchableOpacity onPress={handleSignIn} disabled={!isLoaded || loading} className="items-center rounded-xl bg-brand-bg py-4" accessibilityRole="button">
          {loading ? <ActivityIndicator color="#FFFFFF" /> : <Text className="font-semibold text-white">Sign in</Text>}
        </TouchableOpacity>
        <View className="mt-6 flex-row justify-center">
          <Text className="text-sm text-brand-text-muted">New to ExpenseAi? </Text>
          <Link href="/" className="text-sm font-semibold text-brand-blue">Create an account</Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
