import React, { useState } from "react";
import {
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { useResponsiveLayout } from "../utils/responsive";

// Initial mock notification items for production-ready UI demo
const INITIAL_NOTIFICATIONS = [
  {
    id: "1",
    type: "interest",
    title: "New Interest Received! ❤️",
    message: "Priya Sharma expressed interest in your profile.",
    time: "10 mins ago",
    unread: true,
    icon: "heart",
    iconColor: "#2563EB",
    bgColor: "#EFF6FF",
  },
  {
    id: "2",
    type: "view",
    title: "Profile View 👀",
    message: "Ananya Verma viewed your profile details.",
    time: "1 hour ago",
    unread: true,
    icon: "eye",
    iconColor: "#0A66C2",
    bgColor: "#EBF3FA",
  },
  {
    id: "3",
    type: "match",
    title: "It's a Match! 💍",
    message: "You and Sneha Patel have mutual interest.",
    time: "5 hours ago",
    unread: false,
    icon: "sparkles",
    iconColor: "#10B981",
    bgColor: "#ECFDF5",
  },
  {
    id: "4",
    type: "system",
    title: "Profile Recommendation ✨",
    message: "We found 3 new profiles matching your preferences.",
    time: "1 day ago",
    unread: false,
    icon: "notifications",
    iconColor: "#E65100",
    bgColor: "#FFF3E0",
  },
];

export default function NotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS);
  const [refreshing, setRefreshing] = useState(false);
  const { maxContentWidth } = useResponsiveLayout();

  const unreadCount = notifications.filter((n) => n.unread).length;

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 800);
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const toggleItemRead = (id) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, unread: false } : n))
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={[styles.container, { maxWidth: maxContentWidth }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Pressable
              style={({ pressed }) => [styles.backBtn, pressed && { opacity: 0.7 }]}
              onPress={() => navigation.goBack()}
              hitSlop={8}
            >
              <Ionicons name="arrow-back" size={24} color={colors.text} />
            </Pressable>
            <View style={styles.headerTitleGroup}>
              <Text style={styles.title}>Notifications</Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>{unreadCount} new</Text>
                </View>
              )}
            </View>
          </View>

          {unreadCount > 0 && (
            <Pressable onPress={markAllAsRead} hitSlop={8}>
              <Text style={styles.markReadText}>Mark all read</Text>
            </Pressable>
          )}
        </View>

        {/* Notifications List */}
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.itemCard,
                item.unread && styles.itemCardUnread,
                pressed && { opacity: 0.85 },
              ]}
              onPress={() => toggleItemRead(item.id)}
            >
              <View style={[styles.iconBox, { backgroundColor: item.bgColor }]}>
                <Ionicons name={item.icon} size={22} color={item.iconColor} />
              </View>

              <View style={styles.contentBox}>
                <View style={styles.titleRow}>
                  <Text style={styles.itemTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  {item.unread && <View style={styles.redDot} />}
                </View>
                <Text style={styles.itemMessage}>{item.message}</Text>
                <Text style={styles.itemTime}>{item.time}</Text>
              </View>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="notifications-off-outline" size={40} color={colors.muted} />
              </View>
              <Text style={styles.emptyTitle}>No Notifications Yet</Text>
              <Text style={styles.emptyText}>
                When you receive interests, profile views, or match alerts, they will appear here.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  container: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0E7EA",
    backgroundColor: "#FFFFFF",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  headerTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
  },
  unreadBadge: {
    backgroundColor: colors.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "800",
  },
  markReadText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  list: {
    padding: 16,
    paddingBottom: 30,
  },
  itemCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  itemCardUnread: {
    backgroundColor: "#F8FAFC",
    borderColor: "#BFDBFE",
    borderWidth: 1.5,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  contentBox: {
    flex: 1,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: colors.text,
    flex: 1,
  },
  redDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 6,
  },
  itemMessage: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 3,
    lineHeight: 19,
  },
  itemTime: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 6,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 80,
    paddingHorizontal: 24,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 6,
  },
  emptyText: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
});
