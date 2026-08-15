import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import { api, imageUrl } from "../api";
import { colors } from "../theme";
import { useResponsiveLayout } from "../utils/responsive";

export default function InterestsScreen({ navigation }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const { numColumns, maxContentWidth, isSmallPhone, isTablet } = useResponsiveLayout();

  const loadInterests = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/interests/sent/list");
      setItems(data);
    } catch (e) {
      console.log("Error loading interests:", e);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      const { data } = await api.get("/interests/sent/list");
      setItems(data);
    } catch (e) {
      console.log("Error refreshing interests:", e);
    } finally {
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInterests();
    }, [])
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={[styles.container, { maxWidth: maxContentWidth }]}>
        <View style={[styles.header, isTablet && styles.headerTablet]}>
          <View style={styles.headerTitleRow}>
            <View>
              <Text style={[styles.title, isSmallPhone && { fontSize: 24 }]}>Interests</Text>
              <Text style={styles.subtitle}>
                {items.length > 0
                  ? `You have sent interest to ${items.length} profile${items.length === 1 ? "" : "s"}`
                  : "Profiles you have shown interest in"}
              </Text>
            </View>
            <Pressable
              style={({ pressed }) => [styles.refreshBtn, pressed && { opacity: 0.6 }]}
              onPress={onRefresh}
              hitSlop={8}
            >
              <Ionicons name="refresh" size={22} color={colors.primary} />
            </Pressable>
          </View>
        </View>

        {loading && items.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            key={numColumns}
            data={items}
            numColumns={numColumns}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.list}
            columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[colors.primary]}
                tintColor={colors.primary}
              />
            }
            renderItem={({ item }) => {
              const p = item.to;
              return (
                <Pressable
                  style={({ pressed }) => [
                    styles.card,
                    numColumns > 1 && styles.gridCard,
                    pressed && { backgroundColor: "#FFF8FA", transform: [{ scale: 0.99 }] },
                  ]}
                  onPress={() => {
                    if (p?._id) {
                      navigation
                        .getParent()
                        ?.navigate("ProfileDetail", { profileId: p._id });
                    }
                  }}
                >
                  <Image
                    source={{ uri: imageUrl(p?.profilePhoto) }}
                    style={[styles.image, isSmallPhone && { width: 68, height: 68 }]}
                  />
                  <View style={styles.cardContent}>
                    <Text style={styles.name} numberOfLines={1}>
                      {p?.fullName ? `${p.fullName}, ${p.age || ""}` : "Profile"}
                    </Text>
                    <Text style={styles.meta} numberOfLines={1}>
                      {p?.occupation || "Not specified"} • {p?.city || "Location n/a"}
                    </Text>
                    
                    <View style={styles.badgeRow}>
                      <View style={styles.sentBadge}>
                        <Ionicons name="checkmark-circle" size={14} color="#2E7D32" style={{ marginRight: 4 }} />
                        <Text style={styles.sentText}>Interest Sent</Text>
                      </View>
                    </View>
                  </View>

                  <Ionicons name="chevron-forward" size={18} color={colors.muted} />
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIconCircle}>
                  <Ionicons name="heart-outline" size={38} color={colors.primary} />
                </View>
                <Text style={styles.emptyTitle}>No Interests Sent Yet</Text>
                <Text style={styles.emptySubtitle}>
                  Explore profiles on the Discover page and express interest to start connecting.
                </Text>
                <Pressable
                  style={styles.exploreBtn}
                  onPress={() => navigation.navigate("Home")}
                >
                  <Text style={styles.exploreBtnText}>Discover Profiles</Text>
                </Pressable>
              </View>
            }
          />
        )}
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
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 10,
  },
  headerTablet: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  headerTitleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  title: {
    fontSize: 30,
    fontWeight: "900",
    color: colors.text,
  },
  subtitle: {
    color: colors.muted,
    marginTop: 4,
    fontSize: 14,
    fontWeight: "500",
  },
  refreshBtn: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#EFF6FF",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  list: {
    padding: 16,
    paddingBottom: 30,
  },
  row: {
    justifyContent: "flex-start",
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    width: "100%",
  },
  gridCard: {
    flex: 1,
    marginHorizontal: 6,
  },
  image: {
    width: 76,
    height: 76,
    borderRadius: 38,
    marginRight: 14,
    backgroundColor: colors.border,
  },
  cardContent: {
    flex: 1,
    marginRight: 8,
  },
  name: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  meta: {
    color: colors.muted,
    marginTop: 3,
    fontSize: 13,
    fontWeight: "500",
  },
  badgeRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  sentBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sentText: {
    color: "#2E7D32",
    fontWeight: "700",
    fontSize: 12,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
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
  emptySubtitle: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  exploreBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 24,
  },
  exploreBtnText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 14,
  },
});
