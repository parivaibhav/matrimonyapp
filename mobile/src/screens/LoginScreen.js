import React, { useState } from "react";
import {
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../api";
import { colors, shadow } from "../theme";
import { useResponsiveLayout } from "../utils/responsive";

export default function LoginScreen({ navigation, setLoggedIn }) {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const { isSmallPhone, isTablet } = useResponsiveLayout();

  async function login() {
    if (!identifier || !password)
      return Alert.alert("Required", "Enter email/phone and password.");
    try {
      setLoading(true);
      const { data } = await api.post("/auth/login", { identifier, password });
      await AsyncStorage.setItem("token", data.token);
      await AsyncStorage.setItem("user", JSON.stringify(data.user));
      setLoggedIn(true);
    } catch (e) {
      Alert.alert("Login failed", e.response?.data?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, isTablet && styles.tabletCard]}>
            <Text style={[styles.logo, isSmallPhone && { fontSize: 26 }]}>Matrimony</Text>
            <Text style={[styles.title, isSmallPhone && { fontSize: 24, lineHeight: 30 }]}>
              Find your meaningful connection
            </Text>
            <Text style={styles.subtitle}>Login to discover compatible profiles.</Text>

            <TextInput
              style={styles.input}
              placeholder="Email or phone number"
              placeholderTextColor={colors.muted}
              value={identifier}
              onChangeText={setIdentifier}
              autoCapitalize="none"
              keyboardType="email-address"
            />
            <TextInput
              style={styles.input}
              placeholder="Password"
              placeholderTextColor={colors.muted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <Pressable
              onPress={() =>
                Alert.alert(
                  "Forgot Password",
                  "Password reset can be connected to email/SMS in the next phase."
                )
              }
            >
              <Text style={styles.forgot}>Forgot Password?</Text>
            </Pressable>

            <Pressable style={styles.button} onPress={login} disabled={loading}>
              <Text style={styles.buttonText}>{loading ? "Logging in..." : "Login"}</Text>
            </Pressable>

            <View style={styles.signupRow}>
              <Text style={styles.signupText}>Don't have an account? </Text>
              <Pressable onPress={() => navigation.navigate("Signup")}>
                <Text style={styles.link}>Sign Up</Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    padding: 20,
  },
  card: {
    width: "100%",
    maxWidth: 440,
    alignSelf: "center",
  },
  tabletCard: {
    backgroundColor: "#fff",
    padding: 32,
    borderRadius: 24,
    ...shadow,
  },
  logo: {
    color: colors.primary,
    fontSize: 30,
    fontWeight: "900",
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: "900",
    color: colors.text,
    lineHeight: 35,
  },
  subtitle: {
    color: colors.muted,
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 20,
    fontSize: 15,
  },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    padding: 15,
    borderRadius: 14,
    marginBottom: 14,
    fontSize: 16,
    color: colors.text,
  },
  forgot: {
    textAlign: "right",
    color: colors.primary,
    fontWeight: "700",
    marginVertical: 6,
    marginBottom: 16,
    fontSize: 14,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 16,
    borderRadius: 14,
    alignItems: "center",
    marginTop: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
  },
  signupRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
    alignItems: "center",
  },
  signupText: {
    color: colors.muted,
    fontSize: 15,
  },
  link: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 15,
  },
});
