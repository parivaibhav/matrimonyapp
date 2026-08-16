import React, { useCallback, useState } from "react";

import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";

import { useFocusEffect } from "@react-navigation/native";

import { Ionicons } from "@expo/vector-icons";

import { api } from "../api";
import ProfileCard from "../components/ProfileCard";
import { colors } from "../theme";
import { useResponsiveLayout } from "../utils/responsive";

export default function HomeScreen({ navigation }) {
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const { numColumns, maxContentWidth, isSmallPhone, isTablet } =
    useResponsiveLayout();

  /* =====================================================
     NORMALIZE RESPONSE
  ===================================================== */

  const normalizeProfiles = (data) => {
    if (Array.isArray(data)) {
      return data;
    }

    if (Array.isArray(data?.profiles)) {
      return data.profiles;
    }

    if (Array.isArray(data?.users)) {
      return data.users;
    }

    if (Array.isArray(data?.data)) {
      return data.data;
    }

    return [];
  };

  /* =====================================================
     LOAD PROFILES
  ===================================================== */

  const load = async () => {
    try {
      setLoading(true);
      setError("");

      console.log("================================");

      console.log("GETTING PROFILES...");

      const response = await api.get("/profiles");

      console.log("PROFILE STATUS:", response.status);

      console.log("PROFILE RESPONSE:", response.data);

      const list = normalizeProfiles(response.data);

      console.log("PROFILE COUNT:", list.length);

      setProfiles(list);
    } catch (error) {
      console.log("PROFILE LOAD ERROR:", error?.response?.status);

      console.log("PROFILE LOAD ERROR DATA:", error?.response?.data);

      console.log("PROFILE LOAD ERROR MESSAGE:", error?.message);

      setProfiles([]);

      setError(error?.response?.data?.message || "Unable to load profiles.");
    } finally {
      setLoading(false);
    }
  };

  /* =====================================================
     REFRESH
  ===================================================== */

  const onRefresh = async () => {
    try {
      setRefreshing(true);
      setError("");

      const response = await api.get("/profiles");

      console.log("REFRESH STATUS:", response.status);

      console.log("REFRESH PROFILE RESPONSE:", response.data);

      const list = normalizeProfiles(response.data);

      console.log("REFRESH PROFILE COUNT:", list.length);

      setProfiles(list);
    } catch (error) {
      console.log("REFRESH ERROR:", error?.response?.data || error?.message);

      setError(error?.response?.data?.message || "Unable to refresh profiles.");
    } finally {
      setRefreshing(false);
    }
  };

  /* =====================================================
     SCREEN FOCUS
  ===================================================== */

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  /* =====================================================
     NAVIGATION
  ===================================================== */

  const openSearch = () => {
    navigation.getParent()?.navigate("Search");
  };

  const openNotifications = () => {
    navigation.getParent()?.navigate("Notifications");
  };

  const openProfile = (profileId) => {
    if (!profileId) {
      console.log("PROFILE ID MISSING");
      return;
    }

    navigation.getParent()?.navigate("ProfileDetail", {
      profileId,
    });
  };

  /* =====================================================
     ACTION BUTTON
  ===================================================== */

  const ActionButton = ({ icon, onPress, primary = false, badge = false }) => {
    return (
      <Pressable
        onPress={onPress}
        hitSlop={8}
        style={({ pressed }) => [
          styles.actionButton,

          primary && styles.primaryActionButton,

          pressed && styles.actionPressed,
        ]}
      >
        <Ionicons
          name={icon}
          size={isSmallPhone ? 19 : 21}
          color={primary ? "#FFFFFF" : colors.text}
        />

        {badge && <View style={styles.notificationBadge} />}
      </Pressable>
    );
  };

  /* =====================================================
     HEADER
  ===================================================== */

  const Header = () => {
    return (
      <View style={[styles.header, isTablet && styles.headerTablet]}>
        <View style={styles.headerRow}>
          <View style={styles.titleContainer}>
            <View style={styles.titleLine}>
              <Text style={[styles.title, isSmallPhone && styles.smallTitle]}>
                Discover
              </Text>

              <View style={styles.onlineDot} />
            </View>

            <Text
              style={[styles.subtitle, isSmallPhone && styles.smallSubtitle]}
              numberOfLines={1}
            >
              Find meaningful connections
            </Text>
          </View>

          <View style={styles.actionGroup}>
            <ActionButton icon="search-outline" primary onPress={openSearch} />

            <ActionButton
              icon="notifications-outline"
              badge
              onPress={openNotifications}
            />

            {!isSmallPhone && (
              <ActionButton icon="refresh-outline" onPress={onRefresh} />
            )}
          </View>
        </View>

        <Pressable
          onPress={openSearch}
          style={({ pressed }) => [
            styles.searchBar,
            pressed && styles.searchBarPressed,
          ]}
        >
          <Ionicons name="search-outline" size={19} color={colors.muted} />

          <Text style={styles.searchPlaceholder}>
            Search profiles, city, profession...
          </Text>

          <View style={styles.searchFilter}>
            <Ionicons name="options-outline" size={17} color={colors.primary} />
          </View>
        </Pressable>
      </View>
    );
  };

  /* =====================================================
     SKELETON
  ===================================================== */

  const ProfileSkeleton = () => (
    <View
      style={[
        styles.profileSkeleton,
        numColumns > 1 && styles.profileSkeletonGrid,
      ]}
    >
      <View style={styles.skeletonImage} />

      <View style={styles.skeletonLineLarge} />

      <View style={styles.skeletonLineMedium} />

      <View style={styles.skeletonLineSmall} />

      <View style={styles.skeletonBottomRow}>
        <View style={styles.skeletonButton} />

        <View style={styles.skeletonButton} />
      </View>
    </View>
  );

  /* =====================================================
     INITIAL LOADING
  ===================================================== */

  if (loading && profiles.length === 0) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <View
          style={[
            styles.container,
            {
              maxWidth: maxContentWidth,
            },
          ]}
        >
          <Header />

          <FlatList
            key={`loading-${numColumns}`}
            data={Array.from({
              length: numColumns > 1 ? 6 : 4,
            })}
            numColumns={numColumns}
            keyExtractor={(_, index) => `loading-${index}`}
            contentContainerStyle={styles.list}
            columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
            showsVerticalScrollIndicator={false}
            renderItem={() => (
              <View
                style={numColumns > 1 ? styles.gridItem : styles.singleItem}
              >
                <ProfileSkeleton />
              </View>
            )}
          />
        </View>
      </SafeAreaView>
    );
  }

  /* =====================================================
     MAIN UI
  ===================================================== */

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View
        style={[
          styles.container,
          {
            maxWidth: maxContentWidth,
          },
        ]}
      >
        <Header />

        <FlatList
          key={`profiles-${numColumns}`}
          data={profiles}
          numColumns={numColumns}
          keyExtractor={(item, index) => String(item?._id || item?.id || index)}
          contentContainerStyle={[
            styles.list,

            profiles.length === 0 && styles.emptyList,
          ]}
          columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          renderItem={({ item }) => (
            <View style={numColumns > 1 ? styles.gridItem : styles.singleItem}>
              <ProfileCard
                profile={item}
                numColumns={numColumns}
                onPress={() => openProfile(item?._id || item?.id)}
                loading={false}
              />
            </View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIcon}>
                <Ionicons
                  name={error ? "cloud-offline-outline" : "people-outline"}
                  size={34}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.emptyTitle}>
                {error ? "Unable to load profiles" : "No profiles found"}
              </Text>

              <Text style={styles.emptySubtitle}>
                {error || "There are no profiles available right now."}
              </Text>

              <Pressable
                onPress={onRefresh}
                disabled={refreshing}
                style={({ pressed }) => [
                  styles.reloadBtn,
                  pressed && styles.actionPressed,
                ]}
              >
                {refreshing ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="refresh-outline" size={17} color="#FFFFFF" />
                )}

                <Text style={styles.reloadBtnText}>
                  {refreshing ? "Refreshing..." : "Try Again"}
                </Text>
              </Pressable>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

/* =====================================================
   STYLES
===================================================== */

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
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
  },

  headerTablet: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 14,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  titleContainer: {
    flex: 1,
    minWidth: 0,
    marginRight: 12,
  },

  titleLine: {
    flexDirection: "row",
    alignItems: "center",
  },

  title: {
    fontSize: 29,
    fontWeight: "900",
    color: colors.text,
    letterSpacing: -0.8,
  },

  smallTitle: {
    fontSize: 24,
  },

  onlineDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 7,
    marginTop: 4,
    backgroundColor: "#22C55E",
  },

  subtitle: {
    color: colors.muted,
    marginTop: 3,
    fontSize: 13.5,
    fontWeight: "500",
  },

  smallSubtitle: {
    fontSize: 12,
  },

  actionGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  actionButton: {
    width: 42,
    height: 42,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.06)",
    elevation: 2,
  },

  primaryActionButton: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },

  actionPressed: {
    opacity: 0.7,
    transform: [
      {
        scale: 0.94,
      },
    ],
  },

  notificationBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: "#EF4444",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },

  searchBar: {
    height: 50,
    marginTop: 14,
    paddingLeft: 15,
    paddingRight: 6,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "rgba(15,23,42,0.07)",
    elevation: 2,
  },

  searchBarPressed: {
    opacity: 0.8,
  },

  searchPlaceholder: {
    flex: 1,
    marginLeft: 10,
    color: colors.muted,
    fontSize: 13.5,
    fontWeight: "500",
  },

  searchFilter: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },

  list: {
    paddingHorizontal: 11,
    paddingTop: 4,
    paddingBottom: 30,
  },

  emptyList: {
    flexGrow: 1,
  },

  row: {
    justifyContent: "flex-start",
  },

  gridItem: {
    width: "50%",
    paddingHorizontal: 5,
    marginBottom: 10,
  },

  singleItem: {
    width: "100%",
    paddingHorizontal: 5,
    marginBottom: 12,
  },

  profileSkeleton: {
    width: "100%",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  profileSkeletonGrid: {
    width: "100%",
  },

  skeletonImage: {
    width: "100%",
    height: 190,
    borderRadius: 16,
    backgroundColor: "#E2E8F0",
  },

  skeletonLineLarge: {
    width: "72%",
    height: 17,
    borderRadius: 8,
    backgroundColor: "#E2E8F0",
    marginTop: 13,
  },

  skeletonLineMedium: {
    width: "52%",
    height: 12,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
    marginTop: 9,
  },

  skeletonLineSmall: {
    width: "42%",
    height: 11,
    borderRadius: 6,
    backgroundColor: "#E2E8F0",
    marginTop: 8,
  },

  skeletonBottomRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 14,
  },

  skeletonButton: {
    flex: 1,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#E2E8F0",
  },

  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 30,
    paddingTop: 70,
    paddingBottom: 80,
  },

  emptyIcon: {
    width: 72,
    height: 72,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.primaryLight,
  },

  emptyTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: "800",
    marginTop: 16,
    textAlign: "center",
  },

  emptySubtitle: {
    color: colors.muted,
    fontSize: 13.5,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 7,
    lineHeight: 20,
  },

  reloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    marginTop: 18,
    minWidth: 125,
    paddingHorizontal: 20,
    paddingVertical: 11,
    backgroundColor: colors.primary,
    borderRadius: 15,
  },

  reloadBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 13.5,
  },
});
