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
import AsyncStorage from "@react-native-async-storage/async-storage";

import { api } from "../api";
import { colors, shadow } from "../theme";
import { useResponsiveLayout } from "../utils/responsive";

export default function LoginScreen({ navigation, setLoggedIn }) {
  const { isSmallPhone, isTablet } = useResponsiveLayout();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  /* =========================================================
     LOGIN
  ========================================================= */

  async function login() {
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanEmail) {
      Alert.alert("Email required", "Please enter your email address.");
      return;
    }

    if (!password) {
      Alert.alert("Password required", "Please enter your password.");
      return;
    }

    if (!cleanEmail.includes("@")) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return;
    }

    try {
      setLoading(true);

      const { data } = await api.post("/auth/login", {
        email: cleanEmail,
        password,
      });

      if (!data?.token) {
        throw new Error(
          "Login succeeded but no authentication token was returned.",
        );
      }

      await AsyncStorage.setItem("token", data.token);

      if (data.user) {
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
      }

      setLoggedIn(true);
    } catch (error) {
      console.log("LOGIN ERROR:", error);

      console.log("LOGIN RESPONSE:", error.response?.data);

      let message = "Unable to login. Please try again.";

      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message === "Network Error") {
        message = "Cannot connect to the backend server.";
      } else if (error.message) {
        message = error.message;
      }

      Alert.alert("Login failed", message);
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     FORGOT PASSWORD
  ========================================================= */

  function forgotPassword() {
    Alert.alert(
      "Forgot password",
      "Password reset is not available yet. You can add email OTP password recovery later.",
    );
  }

  /* =========================================================
     INPUT ICON
  ========================================================= */

  function renderInputIcon(icon, color = colors.muted) {
    return (
      <Ionicons name={icon} size={20} color={color} style={styles.inputIcon} />
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            isSmallPhone && styles.smallScrollContent,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, isTablet && styles.tabletCard]}>
            {/* =================================================
                BRAND
            ================================================= */}

            <View style={styles.brandContainer}>
              <View style={styles.logoCircle}>
                <Ionicons name="heart" size={26} color="#fff" />
              </View>

              <Text style={styles.logo}>Matrimony</Text>
            </View>

            {/* =================================================
                HEADER
            ================================================= */}

            <View style={styles.header}>
              <Text style={[styles.title, isSmallPhone && styles.smallTitle]}>
                Welcome back
              </Text>

              <Text style={styles.subtitle}>
                Login to discover meaningful connections and compatible
                profiles.
              </Text>
            </View>

            {/* =================================================
                EMAIL
            ================================================= */}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Email address</Text>

              <View style={styles.inputWrapper}>
                {renderInputIcon("mail-outline")}

                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.muted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="email-address"
                  textContentType="emailAddress"
                  editable={!loading}
                  returnKeyType="next"
                />
              </View>
            </View>

            {/* =================================================
                PASSWORD
            ================================================= */}

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Password</Text>

              <View style={styles.inputWrapper}>
                {renderInputIcon("lock-closed-outline")}

                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Enter your password"
                  placeholderTextColor={colors.muted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                  textContentType="password"
                  editable={!loading}
                  returnKeyType="done"
                  onSubmitEditing={login}
                />

                <Pressable
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((previous) => !previous)}
                  disabled={loading}
                  hitSlop={8}
                >
                  <Ionicons
                    name={showPassword ? "eye-outline" : "eye-off-outline"}
                    size={20}
                    color={colors.muted}
                  />
                </Pressable>
              </View>
            </View>

            {/* =================================================
                FORGOT PASSWORD
            ================================================= */}

            <Pressable
              onPress={forgotPassword}
              disabled={loading}
              style={styles.forgotButton}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </Pressable>

            {/* =================================================
                LOGIN BUTTON
            ================================================= */}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                loading && styles.buttonDisabled,
                pressed && !loading && styles.buttonPressed,
              ]}
              onPress={login}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color="#fff" />

                  <Text style={styles.buttonText}>Logging in...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Login</Text>

                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </View>
              )}
            </Pressable>

            {/* =================================================
                SIGN UP
            ================================================= */}

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account?</Text>

              <Pressable
                onPress={() => navigation.navigate("Signup")}
                disabled={loading}
              >
                <Text style={styles.link}>Sign Up</Text>
              </Pressable>
            </View>

            {/* =================================================
                FOOTER
            ================================================= */}

            <View style={styles.footer}>
              <Ionicons
                name="shield-checkmark-outline"
                size={14}
                color={colors.muted}
              />

              <Text style={styles.footerText}>
                Your account information is securely protected.
              </Text>
            </View>
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

  flex: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
    paddingVertical: 35,
  },

  smallScrollContent: {
    paddingHorizontal: 16,
    paddingVertical: 24,
  },

  card: {
    width: "100%",
    maxWidth: 470,
    alignSelf: "center",
  },

  tabletCard: {
    backgroundColor: "#fff",
    padding: 34,
    borderRadius: 28,
    ...shadow,
  },

  /* =======================================================
     BRAND
  ======================================================= */

  brandContainer: {
    alignItems: "center",
    marginBottom: 25,
  },

  logoCircle: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 11,
    ...shadow,
  },

  logo: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: -0.4,
  },

  /* =======================================================
     HEADER
  ======================================================= */

  header: {
    alignItems: "center",
    marginBottom: 28,
  },

  title: {
    color: colors.text,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: "900",
    textAlign: "center",
    letterSpacing: -0.7,
  },

  smallTitle: {
    fontSize: 26,
    lineHeight: 32,
  },

  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 390,
    marginTop: 8,
  },

  /* =======================================================
     INPUT
  ======================================================= */

  inputGroup: {
    marginBottom: 17,
  },

  label: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    marginBottom: 8,
  },

  inputWrapper: {
    height: 54,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 15,
  },

  inputIcon: {
    marginRight: 10,
  },

  input: {
    flex: 1,
    height: "100%",
    color: colors.text,
    fontSize: 15,
    paddingVertical: 0,
    paddingRight: 14,
  },

  passwordInput: {
    paddingRight: 4,
  },

  eyeButton: {
    width: 48,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
  },

  /* =======================================================
     FORGOT
  ======================================================= */

  forgotButton: {
    alignSelf: "flex-end",
    marginTop: -2,
    marginBottom: 16,
    paddingVertical: 4,
  },

  forgotText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },

  /* =======================================================
     BUTTON
  ======================================================= */

  button: {
    height: 57,
    backgroundColor: colors.primary,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },

  buttonDisabled: {
    opacity: 0.65,
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

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },

  /* =======================================================
     SIGNUP
  ======================================================= */

  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 24,
    gap: 5,
  },

  signupText: {
    color: colors.muted,
    fontSize: 14,
  },

  link: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: "900",
  },

  /* =======================================================
     FOOTER
  ======================================================= */

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 26,
    paddingHorizontal: 15,
    gap: 5,
  },

  footerText: {
    color: colors.muted,
    fontSize: 10,
    textAlign: "center",
  },
});
