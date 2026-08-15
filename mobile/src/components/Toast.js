import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";

export default function Toast({ visible, message, title, type = "success", onDismiss }) {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-100)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: Math.max(insets.top, 10),
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      const timer = setTimeout(() => {
        dismissToast();
      }, 3500);

      return () => clearTimeout(timer);
    } else {
      dismissToast();
    }
  }, [visible]);

  const dismissToast = () => {
    Animated.parallel([
      Animated.timing(translateY, {
        toValue: -100,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onDismiss) onDismiss();
    });
  };

  if (!visible && opacity._value === 0) return null;

  const isSuccess = type === "success";
  const isError = type === "error";

  const iconName = isSuccess
    ? "checkmark-circle"
    : isError
    ? "alert-circle"
    : "information-circle";

  const iconColor = isSuccess ? "#2E7D32" : isError ? "#D32F2F" : colors.primary;
  const badgeBg = isSuccess ? "#E8F5E9" : isError ? "#FFEBEE" : "#FDF0F4";
  const borderColor = isSuccess ? "#C8E6C9" : isError ? "#FFCDD2" : "#F7D8E2";

  return (
    <Animated.View
      style={[
        styles.toastWrapper,
        {
          transform: [{ translateY }],
          opacity,
        },
      ]}
    >
      <Pressable style={[styles.toastContainer, { borderColor }]} onPress={dismissToast}>
        <View style={[styles.iconBox, { backgroundColor: badgeBg }]}>
          <Ionicons name={iconName} size={22} color={iconColor} />
        </View>

        <View style={styles.contentBox}>
          {title ? <Text style={styles.titleText}>{title}</Text> : null}
          <Text style={styles.messageText}>{message}</Text>
        </View>

        <Ionicons name="close" size={18} color={colors.muted} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: "absolute",
    top: 0,
    left: 16,
    right: 16,
    zIndex: 9999,
    alignItems: "center",
  },
  toastContainer: {
    width: "100%",
    maxWidth: 500,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 12,
    borderRadius: 16,
    borderWidth: 1.5,
    shadowColor: "rgba(0,0,0,0.12)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  iconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contentBox: {
    flex: 1,
    marginRight: 8,
  },
  titleText: {
    fontSize: 14,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "500",
  },
});
