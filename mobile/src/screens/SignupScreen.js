import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { api } from "../api";
import { colors, shadow } from "../theme";
import { useResponsiveLayout } from "../utils/responsive";

export default function SignupScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const { isSmallPhone, isTablet } = useResponsiveLayout();

  /* =========================================================
     EMAIL
  ========================================================= */

  function normalizeEmail(value) {
    return String(value || "")
      .trim()
      .toLowerCase();
  }

  function isValidEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  /* =========================================================
     PASSWORD
  ========================================================= */

  function isValidPassword(value) {
    return String(value || "").length >= 6;
  }

  /* =========================================================
     ERROR HANDLER
  ========================================================= */

  function getErrorMessage(error, fallback) {
    const status = error?.response?.status;
    const serverMessage = error?.response?.data?.message;

    if (serverMessage) {
      return serverMessage;
    }

    if (
      error?.code === "ERR_NETWORK" ||
      error?.message === "Network Error" ||
      !error?.response
    ) {
      return (
        "Cannot connect to the backend server.\n\n" +
        "Please make sure:\n" +
        "• Your backend server is running\n" +
        "• Your API URL is correct\n" +
        "• Your Render backend is awake\n" +
        "• Your device has internet access"
      );
    }

    if (status === 400) {
      return "Please check the information you entered.";
    }

    if (status === 409) {
      return "An account with this email already exists.";
    }

    if (status === 404) {
      return "Signup API endpoint was not found. Please check your backend routes.";
    }

    if (status === 500) {
      return "Server error. Please check your backend logs.";
    }

    if (status === 502 || status === 503 || status === 504) {
      return "Backend server is currently unavailable. Please try again.";
    }

    return error?.message || fallback;
  }

  /* =========================================================
     SIGNUP
  ========================================================= */

  async function handleSignup() {
    const normalizedEmail = normalizeEmail(email);

    const cleanPassword = String(password || "");

    const cleanConfirmPassword = String(confirmPassword || "");

    if (!normalizedEmail) {
      Alert.alert("Email required", "Please enter your email address.");
      return;
    }

    if (!isValidEmail(normalizedEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    if (!cleanPassword) {
      Alert.alert("Password required", "Please create a password.");
      return;
    }

    if (!isValidPassword(cleanPassword)) {
      Alert.alert(
        "Password too short",
        "Password must be at least 6 characters.",
      );
      return;
    }

    if (!cleanConfirmPassword) {
      Alert.alert("Confirm password", "Please confirm your password.");
      return;
    }

    if (cleanPassword !== cleanConfirmPassword) {
      Alert.alert(
        "Passwords do not match",
        "Please make sure both passwords are the same.",
      );
      return;
    }

    if (loading) {
      return;
    }

    try {
      setLoading(true);

      console.log("================================");
      console.log("SIGNUP REQUEST");
      console.log("EMAIL:", normalizedEmail);
      console.log("================================");

      const response = await api.post("/auth/signup", {
        email: normalizedEmail,
        password: cleanPassword,
      });

      console.log("SIGNUP RESPONSE:", response.data);

      /*
       * Some backends return the token immediately.
       * If yours does, save it here.
       */

      const token = response.data?.token;

      if (token) {
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default;

        await AsyncStorage.setItem("token", token);
      }

      /*
       * Go directly to profile completion.
       */

      Alert.alert(
        "Account created",
        response.data?.message || "Your account has been created successfully.",
        [
          {
            text: "Continue",
            onPress: () => {
              navigation.replace("CompleteProfile");
            },
          },
        ],
      );
    } catch (error) {
      console.log("SIGNUP ERROR:", error);

      console.log("SIGNUP RESPONSE:", error?.response?.data);

      const message = getErrorMessage(error, "Unable to create your account.");

      Alert.alert("Signup failed", message);
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     PASSWORD STRENGTH
  ========================================================= */

  const passwordLength = password.length;

  const passwordValid = passwordLength >= 6;

  const passwordsMatch = password.length > 0 && password === confirmPassword;

  /* =========================================================
     UI
  ========================================================= */

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.screen}
          contentContainerStyle={[
            styles.container,
            isSmallPhone && styles.smallPhoneContainer,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, isTablet && styles.tabletCard]}>
            {/* HEADER */}

            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="person-add-outline"
                  size={30}
                  color={colors.primary}
                />
              </View>

              <Text style={[styles.title, isSmallPhone && styles.smallTitle]}>
                Create your account
              </Text>

              <Text style={styles.subtitle}>
                Create your account with your email and password, then complete
                your profile.
              </Text>
            </View>

            {/* EMAIL */}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email address</Text>

              <View
                style={[
                  styles.inputContainer,
                  email.length > 0 && styles.inputContainerActive,
                ]}
              >
                <Ionicons
                  name="mail-outline"
                  size={20}
                  color={email.length > 0 ? colors.primary : colors.muted}
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="email"
                  textContentType="emailAddress"
                  editable={!loading}
                  returnKeyType="next"
                />
              </View>

              <Text style={styles.helperText}>
                Use an email address you can access.
              </Text>
            </View>

            {/* PASSWORD */}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>

              <View
                style={[
                  styles.inputContainer,
                  password.length > 0 && styles.inputContainerActive,
                  password.length > 0 &&
                    !passwordValid &&
                    styles.inputContainerError,
                ]}
              >
                <Ionicons
                  name="lock-closed-outline"
                  size={20}
                  color={password.length > 0 ? colors.primary : colors.muted}
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Create a password"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password-new"
                  textContentType="newPassword"
                  editable={!loading}
                  returnKeyType="next"
                />

                <Pressable
                  onPress={() => setShowPassword((value) => !value)}
                  hitSlop={10}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={showPassword ? "eye-off-outline" : "eye-outline"}
                    size={21}
                    color={colors.muted}
                  />
                </Pressable>
              </View>

              <View style={styles.passwordInfo}>
                <View
                  style={[
                    styles.passwordDot,
                    passwordValid && styles.passwordDotValid,
                  ]}
                />

                <Text
                  style={[styles.helperText, passwordValid && styles.validText]}
                >
                  Minimum 6 characters
                </Text>
              </View>
            </View>

            {/* CONFIRM PASSWORD */}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirm password</Text>

              <View
                style={[
                  styles.inputContainer,
                  confirmPassword.length > 0 && styles.inputContainerActive,
                  passwordsMatch && styles.inputContainerSuccess,
                  confirmPassword.length > 0 &&
                    !passwordsMatch &&
                    styles.inputContainerError,
                ]}
              >
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={
                    passwordsMatch
                      ? "#22C55E"
                      : confirmPassword.length > 0
                        ? colors.primary
                        : colors.muted
                  }
                  style={styles.inputIcon}
                />

                <TextInput
                  style={styles.input}
                  placeholder="Confirm your password"
                  placeholderTextColor={colors.muted}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete="password"
                  textContentType="password"
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />

                <Pressable
                  onPress={() => setShowConfirmPassword((value) => !value)}
                  hitSlop={10}
                  style={styles.eyeButton}
                >
                  <Ionicons
                    name={
                      showConfirmPassword ? "eye-off-outline" : "eye-outline"
                    }
                    size={21}
                    color={colors.muted}
                  />
                </Pressable>
              </View>

              {confirmPassword.length > 0 && (
                <View style={styles.passwordInfo}>
                  <Ionicons
                    name={passwordsMatch ? "checkmark-circle" : "close-circle"}
                    size={15}
                    color={passwordsMatch ? "#22C55E" : "#EF4444"}
                  />

                  <Text
                    style={[
                      styles.helperText,
                      {
                        color: passwordsMatch ? "#16A34A" : "#EF4444",
                      },
                    ]}
                  >
                    {passwordsMatch
                      ? "Passwords match"
                      : "Passwords do not match"}
                  </Text>
                </View>
              )}
            </View>

            {/* CREATE ACCOUNT */}

            <Pressable
              style={({ pressed }) => [
                styles.signupButton,

                (loading ||
                  !passwordValid ||
                  !passwordsMatch ||
                  !isValidEmail(normalizeEmail(email))) &&
                  styles.signupButtonDisabled,

                pressed && !loading && styles.buttonPressed,
              ]}
              onPress={handleSignup}
              disabled={
                loading ||
                !passwordValid ||
                !passwordsMatch ||
                !isValidEmail(normalizeEmail(email))
              }
            >
              {loading ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator size="small" color="#fff" />

                  <Text style={styles.buttonText}>Creating account...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Create Account</Text>

                  <Ionicons name="arrow-forward" size={21} color="#fff" />
                </View>
              )}
            </Pressable>

            {/* PROFILE INFO */}

            <View style={styles.infoBox}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="person-circle-outline"
                  size={21}
                  color={colors.primary}
                />
              </View>

              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Complete your profile</Text>

                <Text style={styles.infoText}>
                  After creating your account, you'll add your name, date of
                  birth, location, education, occupation, interests, family
                  details and profile photo.
                </Text>
              </View>
            </View>

            {/* LOGIN */}

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account?</Text>

              <Pressable
                onPress={() => navigation.goBack()}
                disabled={loading}
                hitSlop={8}
              >
                <Text style={styles.loginLink}>Login</Text>
              </Pressable>
            </View>

            {/* TERMS */}

            <Text style={styles.termsText}>
              By continuing, you agree to our Terms of Service and Privacy
              Policy.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  keyboardContainer: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 40,
    justifyContent: "center",
  },

  smallPhoneContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
  },

  card: {
    width: "100%",
    maxWidth: 520,
    alignSelf: "center",
  },

  tabletCard: {
    backgroundColor: "#fff",
    padding: 36,
    borderRadius: 26,
    ...shadow,
  },

  header: {
    alignItems: "center",
    marginBottom: 30,
  },

  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },

  title: {
    fontSize: 29,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
    letterSpacing: -0.6,
  },

  smallTitle: {
    fontSize: 25,
  },

  subtitle: {
    color: colors.muted,
    marginTop: 9,
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    maxWidth: 410,
  },

  inputGroup: {
    marginBottom: 19,
  },

  label: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 9,
  },

  inputContainer: {
    height: 56,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
  },

  inputContainerActive: {
    borderColor: colors.primary,
  },

  inputContainerError: {
    borderColor: "#EF4444",
  },

  inputContainerSuccess: {
    borderColor: "#22C55E",
  },

  inputIcon: {
    marginLeft: 16,
    marginRight: 4,
  },

  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 12,
    fontSize: 16,
    color: colors.text,
  },

  eyeButton: {
    paddingHorizontal: 15,
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },

  helperText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 7,
  },

  passwordInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 1,
  },

  passwordDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.muted,
  },

  passwordDotValid: {
    backgroundColor: "#22C55E",
  },

  validText: {
    color: "#16A34A",
  },

  signupButton: {
    height: 57,
    backgroundColor: colors.primary,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  signupButtonDisabled: {
    opacity: 0.45,
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  loadingContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },

  infoBox: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 15,
    marginTop: 20,
  },

  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  infoContent: {
    flex: 1,
  },

  infoTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 4,
  },

  infoText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },

  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 23,
  },

  loginText: {
    color: colors.muted,
    fontSize: 14,
  },

  loginLink: {
    color: colors.primary,
    fontWeight: "900",
    fontSize: 14,
    marginLeft: 5,
  },

  termsText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 22,
    paddingHorizontal: 15,
  },
});
