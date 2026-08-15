import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from "react-native";
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

  const { numColumns, maxContentWidth, isSmallPhone, isTablet } = useResponsiveLayout();

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

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={[styles.container, { maxWidth: maxContentWidth }]}>
        <View style={[styles.header, isTablet && styles.headerTablet]}>
          <View style={styles.headerTitleRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <Text style={[styles.title, isSmallPhone && { fontSize: 24 }]}>Discover</Text>
              <Text style={styles.subtitle}>Profiles that could be a meaningful match</Text>
            </View>

            <View style={styles.headerActions}>
              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]}
                onPress={() => navigation.getParent()?.navigate("Notifications")}
                hitSlop={8}
              >
                <Ionicons name="notifications-outline" size={22} color={colors.text} />
                <View style={styles.notifBadgeDot} />
              </Pressable>

              <Pressable
                style={({ pressed }) => [styles.actionBtn, pressed && { opacity: 0.6 }]}
                onPress={onRefresh}
                hitSlop={8}
              >
                <Ionicons name="refresh" size={22} color={colors.primary} />
              </Pressable>
            </View>
          </View>
        </View>

        {loading && profiles.length === 0 ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
          </View>
        ) : (
          <FlatList
            key={numColumns}
            data={profiles}
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
            renderItem={({ item }) => (
              <ProfileCard
                profile={item}
                numColumns={numColumns}
                onPress={() =>
                  navigation.getParent()?.navigate("ProfileDetail", { profileId: item._id })
                }
              />
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={44} color={colors.muted} />
                <Text style={styles.empty}>No profiles found yet.</Text>
                <Pressable style={styles.reloadBtn} onPress={onRefresh}>
                  <Text style={styles.reloadBtnText}>Tap to refresh</Text>
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
    fontSize: 15,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 2,
  },
  actionBtn: {
    position: "relative",
    padding: 10,
    borderRadius: 20,
    backgroundColor: "#FDF0F4",
  },
  notifBadgeDot: {
    position: "absolute",
    top: 8,
    right: 9,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    marginTop: 40,
  },
  list: {
    padding: 16,
    paddingTop: 8,
    paddingBottom: 30,
  },
  row: {
    justifyContent: "flex-start",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
  },
  empty: {
    textAlign: "center",
    color: colors.muted,
    marginTop: 12,
    fontSize: 16,
    fontWeight: "500",
  },
  reloadBtn: {
    marginTop: 16,
    paddingHorizontal: 18,
    paddingVertical: 10,
    backgroundColor: "#EFF6FF",
    borderRadius: 20,
  },
  reloadBtnText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
});
