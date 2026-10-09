import { useAuth, useSignUp } from "@clerk/expo";
import { signUpSchema } from "@/lib/schemas/auth";
import { Link, Redirect } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

function getErrorMessage(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "object" && error !== null) {
    const clerkError = error as { message?: string; errors?: { longMessage?: string; message?: string }[] };
    return clerkError.errors?.[0]?.longMessage ?? clerkError.errors?.[0]?.message ?? clerkError.message ?? "Something went wrong. Please try again.";
  }
  return "Something went wrong. Please try again.";
}

export default function MainScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { signUp } = useSignUp();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSignUp = async (): Promise<void> => {
    if (isSubmitting) return;
    setError("");

    if (!isLoaded) {
      setError("Authentication is still loading. Please try again.");
      return;
    }

    const parsed = signUpSchema.safeParse({ firstName, lastName, email: emailAddress, password });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check your sign-up details.");
      return;
    }
    setIsSubmitting(true);
    try {
      const result = await signUp.password({
        emailAddress: parsed.data.email,
        password: parsed.data.password,
        firstName: parsed.data.firstName,
        lastName: parsed.data.lastName,
      });

      if (result.error) {
        setError(getErrorMessage(result.error));
        return;
      }

      const verification = await signUp.verifications.sendEmailCode();
      if (verification.error) {
        setError(getErrorMessage(verification.error));
        return;
      }

      setIsVerifying(true);
    } catch (signupError) {
      setError(getErrorMessage(signupError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerify = async () => {
    setError("");
    if (!code.trim()) { setError("Enter the verification code from your email."); return; }
    setIsSubmitting(true);
    try {
      const { error: verifyError } = await signUp.verifications.verifyEmailCode({ code: code.trim() });
      if (verifyError) { setError(getErrorMessage(verifyError)); return; }
      const { error: finalizeError } = await signUp.finalize();
      if (finalizeError) setError(getErrorMessage(finalizeError));
    } catch (verificationError) {
      setError(getErrorMessage(verificationError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    setError("");
    setIsSubmitting(true);
    try {
      const { error: resendError } = await signUp.verifications.sendEmailCode();
      if (resendError) setError(getErrorMessage(resendError));
    } catch (resendError) {
      setError(getErrorMessage(resendError));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isLoaded) {
    return <View style={styles.loadingScreen}><ActivityIndicator size="large" color={colors.accent} /><Text style={styles.loadingText}>Getting your account ready…</Text></View>;
  }
  if (isSignedIn) return <Redirect href="/(root)/(tabs)" />;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.brandMark}><Text style={styles.brandMarkText}>W</Text></View>
          <Text style={styles.eyebrow}>WELTH · EXPENSE MANAGER</Text>
          <Text style={styles.title}>{isVerifying ? "Check your email" : "Make room for better money habits."}</Text>
          <Text style={styles.subtitle}>
            {isVerifying
              ? "We sent a verification code to " + emailAddress.trim() + ". Enter it below to finish creating your account."
              : "Create an account to see where your money goes and plan what comes next."}
          </Text>

          {isVerifying ? (
            <>
              <Text style={styles.label}>Verification code</Text>
              <TextInput style={styles.input} value={code} placeholder="Enter the code from your email" placeholderTextColor={colors.placeholder} onChangeText={(value) => { setCode(value); setError(""); }} keyboardType="number-pad" autoComplete="one-time-code" textContentType="oneTimeCode" returnKeyType="done" onSubmitEditing={handleVerify} />
              <View nativeID="clerk-captcha" />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <TouchableOpacity style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]} onPress={handleVerify} disabled={isSubmitting} accessibilityRole="button">
                {isSubmitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>Verify email</Text>}
              </TouchableOpacity>
              <TouchableOpacity onPress={handleResendCode} disabled={isSubmitting} style={styles.secondaryAction}><Text style={styles.secondaryActionText}>Send a new code</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => { setIsVerifying(false); setCode(""); setError(""); }} style={styles.secondaryAction}><Text style={styles.mutedActionText}>Use a different email</Text></TouchableOpacity>
            </>
          ) : (
            <>
              <Text style={styles.label}>First name</Text>
              <TextInput style={styles.input} value={firstName} placeholder="First name" placeholderTextColor={colors.placeholder} onChangeText={(value) => { setFirstName(value); setError(""); }} autoCapitalize="words" textContentType="givenName" returnKeyType="next" />
              <Text style={styles.label}>Last name</Text>
              <TextInput style={styles.input} value={lastName} placeholder="Last name" placeholderTextColor={colors.placeholder} onChangeText={(value) => { setLastName(value); setError(""); }} autoCapitalize="words" textContentType="familyName" returnKeyType="next" />
              <Text style={styles.label}>Email address</Text>
              <TextInput style={styles.input} value={emailAddress} placeholder="you@example.com" placeholderTextColor={colors.placeholder} onChangeText={(value) => { setEmailAddress(value); setError(""); }} autoCapitalize="none" autoCorrect={false} keyboardType="email-address" textContentType="emailAddress" autoComplete="email" returnKeyType="next" />
              <Text style={styles.label}>Password</Text>
              <TextInput style={styles.input} value={password} placeholder="Create a password" placeholderTextColor={colors.placeholder} onChangeText={(value) => { setPassword(value); setError(""); }} secureTextEntry textContentType="newPassword" autoComplete="new-password" returnKeyType="go" onSubmitEditing={handleSignUp} />
              <View nativeID="clerk-captcha" />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <TouchableOpacity style={[styles.primaryButton, isSubmitting && styles.buttonDisabled]} onPress={handleSignUp} disabled={isSubmitting} accessibilityRole="button">
                {isSubmitting ? <ActivityIndicator color={colors.white} /> : <Text style={styles.primaryButtonText}>Create account</Text>}
              </TouchableOpacity>
              <View style={styles.signInRow}>
                <Text style={styles.signInPrompt}>Already have an account? </Text>
                <Link href="/(auth)/sign-in" asChild><TouchableOpacity accessibilityRole="link"><Text style={styles.signInLink}>Sign in</Text></TouchableOpacity></Link>
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const colors = { background: "#F5F4F0", ink: "#0B0E14", muted: "#747984", placeholder: "#9398A1", accent: "#FF6B4A", border: "#E2E0D9", white: "#FFFFFF", error: "#B42318" };
const styles = StyleSheet.create({
  flex: { flex: 1 }, safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, justifyContent: "center", paddingHorizontal: 24, paddingVertical: 32 },
  loadingScreen: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, backgroundColor: colors.background }, loadingText: { color: colors.muted, fontSize: 14 },
  brandMark: { width: 48, height: 48, alignItems: "center", justifyContent: "center", borderRadius: 16, backgroundColor: colors.ink, marginBottom: 18 }, brandMarkText: { color: colors.white, fontSize: 24, fontWeight: "800" },
  eyebrow: { color: colors.accent, fontSize: 11, fontWeight: "800", letterSpacing: 1.6, marginBottom: 14 },
  title: { color: colors.ink, fontSize: 34, lineHeight: 40, fontWeight: "800", letterSpacing: -0.7, marginBottom: 10 }, subtitle: { color: colors.muted, fontSize: 15, lineHeight: 23, marginBottom: 28 },
  label: { color: colors.ink, fontSize: 13, fontWeight: "700", marginBottom: 8, marginTop: 12 },
  input: { minHeight: 54, borderWidth: 1, borderColor: colors.border, borderRadius: 14, backgroundColor: colors.white, paddingHorizontal: 16, color: colors.ink, fontSize: 15 },
  error: { color: colors.error, fontSize: 13, lineHeight: 19, marginTop: 12 },
  primaryButton: { minHeight: 54, alignItems: "center", justifyContent: "center", borderRadius: 14, backgroundColor: colors.ink, marginTop: 22 }, buttonDisabled: { opacity: 0.65 }, primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: "700" },
  signInRow: { flexDirection: "row", justifyContent: "center", alignItems: "center", marginTop: 24 }, signInPrompt: { color: colors.muted, fontSize: 14 }, signInLink: { color: colors.ink, fontSize: 14, fontWeight: "700" },
  secondaryAction: { alignSelf: "center", paddingVertical: 11 }, secondaryActionText: { color: colors.ink, fontSize: 14, fontWeight: "700" }, mutedActionText: { color: colors.muted, fontSize: 13, fontWeight: "600" },
});
