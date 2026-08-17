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
  const [otp, setOtp] = useState("");

  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifying, setVerifying] = useState(false);

  const [otpSent, setOtpSent] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const { isSmallPhone, isTablet } = useResponsiveLayout();

  /* =========================================================
     EMAIL VALIDATION
  ========================================================= */

  function getEmail() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      Alert.alert("Email required", "Please enter your email address.");
      return null;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(normalizedEmail)) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return null;
    }

    return normalizedEmail;
  }

  /* =========================================================
     SEND OTP
  ========================================================= */

  async function sendOtp() {
    const normalizedEmail = getEmail();

    if (!normalizedEmail) return;

    if (remainingSeconds > 0) {
      return;
    }

    try {
      setSendingOtp(true);

      console.log("SEND OTP REQUEST:", {
        email: normalizedEmail,
      });

      const response = await api.post("/auth/signup", {
        email: normalizedEmail,
      });

      console.log("SEND OTP RESPONSE:", response.data);

      setEmail(normalizedEmail);
      setOtp("");
      setOtpSent(true);

      const expiresIn = Number(response.data?.expiresIn) || 600;

      setRemainingSeconds(expiresIn);

      Alert.alert(
        "OTP sent",
        `A verification code has been sent to ${normalizedEmail}.`,
      );
    } catch (error) {
      console.log("SEND OTP ERROR:", error);

      console.log("SEND OTP ERROR RESPONSE:", error.response?.data);

      let message = "Unable to send verification code.";

      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message === "Network Error") {
        message = "Cannot connect to backend server.";
      } else if (error.message) {
        message = error.message;
      }

      Alert.alert("Send OTP failed", message);
    } finally {
      setSendingOtp(false);
    }
  }

  /* =========================================================
     VERIFY OTP
  ========================================================= */

  async function verifyOtp() {
    const normalizedEmail = getEmail();

    if (!normalizedEmail) return;

    const cleanOtp = otp.replace(/\D/g, "");

    if (!cleanOtp) {
      Alert.alert("OTP required", "Please enter the verification code.");
      return;
    }

    if (cleanOtp.length !== 6) {
      Alert.alert("Invalid OTP", "Please enter the 6-digit verification code.");
      return;
    }

    try {
      setVerifying(true);

      console.log("VERIFY OTP REQUEST:", {
        email: normalizedEmail,
        otp: cleanOtp,
      });

      const response = await api.post("/auth/verify-otp", {
        email: normalizedEmail,
        otp: cleanOtp,
        purpose: "signup",
      });

      console.log("VERIFY OTP RESPONSE:", response.data);

      const { token, user } = response.data || {};

      /*
       * Store token/user if backend returns them.
       *
       * If your backend only verifies the email and
       * creates the user later, remove this section.
       */

      if (token) {
        const AsyncStorage =
          require("@react-native-async-storage/async-storage").default;

        await AsyncStorage.setItem("token", token);

        if (user) {
          await AsyncStorage.setItem("user", JSON.stringify(user));
        }
      }

      Alert.alert(
        "Email verified",
        response.data?.message || "Your email has been verified successfully.",
        [
          {
            text: "Continue",
            onPress: () => {
              if (navigation.canGoBack()) {
                navigation.goBack();
              }
            },
          },
        ],
      );
    } catch (error) {
      console.log("VERIFY OTP ERROR:", error);

      console.log("VERIFY OTP ERROR RESPONSE:", error.response?.data);

      let message = "Unable to verify the code.";

      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message === "Network Error") {
        message = "Cannot connect to backend server.";
      } else if (error.message) {
        message = error.message;
      }

      Alert.alert("Verification failed", message);
    } finally {
      setVerifying(false);
    }
  }

  /* =========================================================
     OTP INPUT
  ========================================================= */

  function handleOtpChange(value) {
    const cleanValue = value.replace(/\D/g, "").slice(0, 6);

    setOtp(cleanValue);
  }

  /* =========================================================
     TIMER
  ========================================================= */

  React.useEffect(() => {
    if (remainingSeconds <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }

        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [remainingSeconds]);

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${minutes}:${String(secs).padStart(2, "0")}`;
  }

  /* =========================================================
     UI
  ========================================================= */

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
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
            {/* =================================================
                HEADER
            ================================================= */}

            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons
                  name="mail-open-outline"
                  size={30}
                  color={colors.primary}
                />
              </View>

              <Text style={[styles.title, isSmallPhone && styles.smallTitle]}>
                Create your account
              </Text>

              <Text style={styles.subtitle}>
                Enter your email and verify it with a one-time code.
              </Text>
            </View>

            {/* =================================================
                EMAIL INPUT
            ================================================= */}

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
                  editable={!sendingOtp && !verifying}
                  returnKeyType="next"
                />
              </View>

              <Text style={styles.helperText}>
                Enter the email address you want to verify.
              </Text>
            </View>

            {/* =================================================
                OTP INPUT
            ================================================= */}

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Verification code</Text>

                {otpSent && (
                  <View style={styles.sentBadge}>
                    <View style={styles.sentDot} />

                    <Text style={styles.sentText}>Code sent</Text>
                  </View>
                )}
              </View>

              <View
                style={[
                  styles.otpRow,
                  otp.length > 0 && styles.otpRowActive,
                  otp.length === 6 && styles.otpRowComplete,
                ]}
              >
                <View style={styles.otpInputWrapper}>
                  <Ionicons
                    name="keypad-outline"
                    size={20}
                    color={otp.length > 0 ? colors.primary : colors.muted}
                    style={styles.otpIcon}
                  />

                  <TextInput
                    style={styles.otpInput}
                    placeholder="Enter 6-digit OTP"
                    placeholderTextColor={colors.muted}
                    value={otp}
                    onChangeText={handleOtpChange}
                    keyboardType="number-pad"
                    maxLength={6}
                    editable={!verifying}
                    returnKeyType="done"
                    onSubmitEditing={verifyOtp}
                  />
                </View>

                {/* SEND OTP INSIDE OTP ROW */}

                <Pressable
                  style={[
                    styles.sendOtpButton,
                    (sendingOtp || remainingSeconds > 0) &&
                      styles.sendOtpButtonDisabled,
                  ]}
                  onPress={sendOtp}
                  disabled={sendingOtp || remainingSeconds > 0 || verifying}
                >
                  {sendingOtp ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.sendOtpText}>
                      {remainingSeconds > 0
                        ? formatTime(remainingSeconds)
                        : "Send OTP"}
                    </Text>
                  )}
                </Pressable>
              </View>

              <Text style={styles.helperText}>
                A 6-digit verification code will be sent to your email.
              </Text>
            </View>

            {/* =================================================
                VERIFY BUTTON
            ================================================= */}

            <Pressable
              style={({ pressed }) => [
                styles.verifyButton,
                (verifying || otp.length !== 6) && styles.verifyButtonDisabled,
                pressed &&
                  !verifying &&
                  otp.length === 6 &&
                  styles.buttonPressed,
              ]}
              onPress={verifyOtp}
              disabled={verifying || otp.length !== 6}
            >
              {verifying ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator size="small" color="#fff" />

                  <Text style={styles.buttonText}>Verifying...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Verify Email</Text>

                  <Ionicons
                    name="checkmark-circle-outline"
                    size={21}
                    color="#fff"
                  />
                </View>
              )}
            </Pressable>

            {/* =================================================
                RESEND
            ================================================= */}

            <View style={styles.resendRow}>
              <Text style={styles.resendText}>Didn't receive the code?</Text>

              {remainingSeconds > 0 ? (
                <Text style={styles.timerText}>
                  Resend in {formatTime(remainingSeconds)}
                </Text>
              ) : (
                <Pressable onPress={sendOtp} disabled={sendingOtp || verifying}>
                  <Text style={styles.resendLink}>Resend OTP</Text>
                </Pressable>
              )}
            </View>

            {/* =================================================
                INFO BOX
            ================================================= */}

            <View style={styles.infoBox}>
              <View style={styles.infoIcon}>
                <Ionicons
                  name="shield-checkmark-outline"
                  size={20}
                  color={colors.primary}
                />
              </View>

              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>Secure verification</Text>

                <Text style={styles.infoText}>
                  We use email OTP verification instead of passwords. Never
                  share your verification code with anyone.
                </Text>
              </View>
            </View>

            {/* =================================================
                LOGIN
            ================================================= */}

            <View style={styles.loginRow}>
              <Text style={styles.loginText}>Already have an account?</Text>

              <Pressable
                onPress={() => navigation.goBack()}
                disabled={sendingOtp || verifying}
                hitSlop={8}
              >
                <Text style={styles.loginLink}>Login</Text>
              </Pressable>
            </View>

            {/* =================================================
                TERMS
            ================================================= */}

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

  /* =======================================================
     HEADER
  ======================================================= */

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
    maxWidth: 400,
  },

  /* =======================================================
     INPUT
  ======================================================= */

  inputGroup: {
    marginBottom: 20,
  },

  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  label: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
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

  inputIcon: {
    marginLeft: 16,
    marginRight: 4,
  },

  input: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 12,
    paddingRight: 16,
    fontSize: 16,
    color: colors.text,
  },

  helperText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: 8,
  },

  /* =======================================================
     OTP
  ======================================================= */

  otpRow: {
    height: 58,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },

  otpRowActive: {
    borderColor: colors.primary,
  },

  otpRowComplete: {
    borderColor: "#22C55E",
  },

  otpInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },

  otpIcon: {
    marginLeft: 15,
    marginRight: 4,
  },

  otpInput: {
    flex: 1,
    height: "100%",
    paddingHorizontal: 10,
    fontSize: 16,
    color: colors.text,
  },

  sendOtpButton: {
    height: "100%",
    minWidth: 92,
    paddingHorizontal: 14,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  sendOtpButtonDisabled: {
    opacity: 0.55,
  },

  sendOtpText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "900",
  },

  sentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 20,
  },

  sentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#22C55E",
    marginRight: 5,
  },

  sentText: {
    color: "#16A34A",
    fontSize: 11,
    fontWeight: "800",
  },

  /* =======================================================
     VERIFY BUTTON
  ======================================================= */

  verifyButton: {
    height: 56,
    backgroundColor: colors.primary,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  verifyButtonDisabled: {
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

  /* =======================================================
     RESEND
  ======================================================= */

  resendRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 17,
    minHeight: 24,
  },

  resendText: {
    color: colors.muted,
    fontSize: 13,
  },

  resendLink: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "900",
    marginLeft: 5,
  },

  timerText: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: "700",
    marginLeft: 5,
  },

  /* =======================================================
     INFO
  ======================================================= */

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

  /* =======================================================
     LOGIN
  ======================================================= */

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

  /* =======================================================
     TERMS
  ======================================================= */

  termsText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 22,
    paddingHorizontal: 15,
  },
});
