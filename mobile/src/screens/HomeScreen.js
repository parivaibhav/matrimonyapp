import React, { useCallback, useState } from "react";
import {
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

  const { numColumns, maxContentWidth, isSmallPhone, isTablet } =
    useResponsiveLayout();

  // =====================================================
  // LOAD PROFILES
  // =====================================================

  const load = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/profiles");

      setProfiles(data);
    } catch (e) {
      console.log("Error fetching home profiles:", e);
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // REFRESH PROFILES
  // =====================================================

  const onRefresh = async () => {
    try {
      setRefreshing(true);

      const { data } = await api.get("/profiles");

      setProfiles(data);
    } catch (e) {
      console.log("Error refreshing profiles:", e);
    } finally {
      setRefreshing(false);
    }
  };

  // =====================================================
  // RELOAD WHEN SCREEN GETS FOCUS
  // =====================================================

  useFocusEffect(
    useCallback(() => {
      load();
    }, []),
  );

  // =====================================================
  // SEARCH
  // =====================================================

  const openSearch = () => {
    navigation.getParent()?.navigate("Search");
  };

  // =====================================================
  // NOTIFICATIONS
  // =====================================================

  const openNotifications = () => {
    navigation.getParent()?.navigate("Notifications");
  };

  // =====================================================
  // PROFILE DETAIL
  // =====================================================

  const openProfile = (profileId) => {
    navigation.getParent()?.navigate("ProfileDetail", {
      profileId,
    });
  };

  // =====================================================
  // HEADER ACTION
  // =====================================================

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

  // =====================================================
  // SKELETON HEADER
  // =====================================================

  const HeaderSkeleton = () => {
    return (
      <View style={[styles.header, isTablet && styles.headerTablet]}>
        <View style={styles.headerRow}>
          <View style={styles.titleSkeletonContainer}>
            <View style={styles.titleSkeleton} />
            <View style={styles.subtitleSkeleton} />
          </View>

          <View style={styles.actionsSkeleton}>
            <View style={styles.actionSkeleton} />
            <View style={styles.actionSkeleton} />
          </View>
        </View>
      </View>
    );
  };

  // =====================================================
  // UI
  // =====================================================

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
        {/* =================================================
            MODERN HEADER
        ================================================= */}

        {loading && profiles.length === 0 ? (
          <HeaderSkeleton />
        ) : (
          <View style={[styles.header, isTablet && styles.headerTablet]}>
            <View style={styles.headerRow}>
              {/* =================================================
                  TITLE
              ================================================= */}

              <View style={styles.titleContainer}>
                <View style={styles.titleLine}>
                  <Text
                    style={[styles.title, isSmallPhone && styles.smallTitle]}
                  >
                    Discover
                  </Text>

                  <View style={styles.onlineDot} />
                </View>

                <Text
                  style={[
                    styles.subtitle,
                    isSmallPhone && styles.smallSubtitle,
                  ]}
                  numberOfLines={1}
                >
                  Find meaningful connections
                </Text>
              </View>

              {/* =================================================
                  ACTIONS
              ================================================= */}

              <View style={styles.actionGroup}>
                <ActionButton
                  icon="search-outline"
                  primary
                  onPress={openSearch}
                />

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

            {/* =================================================
                SEARCH BAR
            ================================================= */}

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
                <Ionicons
                  name="options-outline"
                  size={17}
                  color={colors.primary}
                />
              </View>
            </Pressable>
          </View>
        )}

        {/* =================================================
            PROFILE LIST
        ================================================= */}

        <FlatList
          key={numColumns}
          data={profiles}
          numColumns={numColumns}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
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
            <ProfileCard
              profile={item}
              numColumns={numColumns}
              onPress={() => openProfile(item._id)}
              loading={false}
            />
          )}
          ListHeaderComponent={
            loading && profiles.length === 0
              ? () => (
                  <View style={styles.skeletonList}>
                    {Array.from({
                      length: numColumns > 1 ? 6 : 4,
                    }).map((_, index) => (
                      <View
                        key={`skeleton-${index}`}
                        style={
                          numColumns > 1
                            ? styles.skeletonGridItem
                            : styles.skeletonSingleItem
                        }
                      >
                        <ProfileCard loading numColumns={numColumns} />
                      </View>
                    ))}
                  </View>
                )
              : null
          }
          ListEmptyComponent={
            !loading ? (
              <View style={styles.emptyContainer}>
                <View style={styles.emptyIcon}>
                  <Ionicons
                    name="people-outline"
                    size={34}
                    color={colors.primary}
                  />
                </View>

                <Text style={styles.emptyTitle}>No profiles found</Text>

                <Text style={styles.emptySubtitle}>
                  Try refreshing or check back later.
                </Text>

                <Pressable
                  style={({ pressed }) => [
                    styles.reloadBtn,
                    pressed && styles.actionPressed,
                  ]}
                  onPress={onRefresh}
                >
                  <Ionicons name="refresh-outline" size={17} color="#FFFFFF" />

                  <Text style={styles.reloadBtnText}>Refresh</Text>
                </Pressable>
              </View>
            ) : null
          }
        />
      </View>
    </SafeAreaView>
  );
}

// =====================================================
// STYLES
// =====================================================

const styles = StyleSheet.create({
  // =====================================================
  // SCREEN
  // =====================================================

  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  container: {
    flex: 1,
    width: "100%",
    alignSelf: "center",
  },

  // =====================================================
  // HEADER
  // =====================================================

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
    borderWidth: 1.5,
    borderColor: colors.bg,
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

  // =====================================================
  // ACTION GROUP
  // =====================================================

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

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.06,
    shadowRadius: 8,

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

  // =====================================================
  // SEARCH BAR
  // =====================================================

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

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.05,
    shadowRadius: 10,

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

  // =====================================================
  // HEADER SKELETON
  // =====================================================

  titleSkeletonContainer: {
    flex: 1,
  },

  titleSkeleton: {
    width: 125,
    height: 28,

    borderRadius: 9,

    backgroundColor: "#E2E8F0",
  },

  subtitleSkeleton: {
    width: 190,
    height: 12,

    borderRadius: 6,

    backgroundColor: "#E2E8F0",

    marginTop: 8,
  },

  actionsSkeleton: {
    flexDirection: "row",
    gap: 7,
  },

  actionSkeleton: {
    width: 42,
    height: 42,

    borderRadius: 15,

    backgroundColor: "#E2E8F0",
  },

  // =====================================================
  // LIST
  // =====================================================

  list: {
    paddingHorizontal: 11,
    paddingTop: 4,
    paddingBottom: 30,
  },

  row: {
    justifyContent: "flex-start",
  },

  // =====================================================
  // SKELETON LIST
  // =====================================================

  skeletonList: {
    width: "100%",
  },

  skeletonGridItem: {
    width: "50%",
    paddingHorizontal: 5,
    marginBottom: 2,
  },

  skeletonSingleItem: {
    width: "100%",
    marginBottom: 12,
  },

  // =====================================================
  // EMPTY STATE
  // =====================================================

  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",

    marginTop: 70,

    paddingHorizontal: 30,
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
  },

  emptySubtitle: {
    color: colors.muted,

    fontSize: 13.5,
    fontWeight: "500",

    textAlign: "center",

    marginTop: 6,
  },

  reloadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 7,

    marginTop: 18,

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
