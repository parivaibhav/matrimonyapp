import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";
import { api, imageUrl } from "../api";
import { colors, shadow } from "../theme";
import { useResponsiveLayout } from "../utils/responsive";

const RECENT_SEARCHES_KEY = "@matrimony_recent_searches";

export default function SearchScreen({ navigation }) {
  const [search, setSearch] = useState("");
  const [profiles, setProfiles] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isFocused, setIsFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  const { maxContentWidth } = useResponsiveLayout();

  useEffect(() => {
    loadRecentSearches();
    loadProfiles("");
  }, []);

  async function loadRecentSearches() {
    try {
      const stored = await AsyncStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (e) {
      console.log("Error loading recent searches:", e);
    }
  }

  async function saveSearchTerm(term) {
    const trimmed = term.trim();
    if (!trimmed) return;

    try {
      const updated = [
        trimmed,
        ...recentSearches.filter((item) => item.toLowerCase() !== trimmed.toLowerCase()),
      ].slice(0, 8);

      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      console.log("Error saving recent search:", e);
    }
  }

  async function removeRecentSearch(term, e) {
    if (e && e.stopPropagation) {
      e.stopPropagation();
    }
    try {
      const updated = recentSearches.filter((item) => item !== term);
      setRecentSearches(updated);
      await AsyncStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (err) {
      console.log("Error removing recent search:", err);
    }
  }

  async function clearAllRecentSearches() {
    try {
      setRecentSearches([]);
      await AsyncStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {
      console.log("Error clearing recent searches:", e);
    }
  }

  async function loadProfiles(query) {
    try {
      setLoading(true);
      const { data } = await api.get("/profiles", { params: { search: query } });
      setProfiles(data);
    } catch (e) {
      console.log("SEARCH ERROR:", e);
    } finally {
      setLoading(false);
    }
  }

  function handleSearchSubmit() {
    if (search.trim()) {
      saveSearchTerm(search);
    }
    loadProfiles(search);
  }

  function handleSelectRecent(term) {
    setSearch(term);
    saveSearchTerm(term);
    loadProfiles(term);
  }

  function handleClearInput() {
    setSearch("");
    loadProfiles("");
  }

  function handleSelectProfile(profile) {
    if (profile?.fullName) {
      saveSearchTerm(profile.fullName);
    } else if (search.trim()) {
      saveSearchTerm(search);
    }
    navigation.getParent()?.navigate("ProfileDetail", { profileId: profile._id });
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={[styles.container, { maxWidth: maxContentWidth }]}>
        {/* Play Store Style Header Search Bar */}
        <View style={styles.searchBarWrapper}>
          <View style={[styles.searchBar, isFocused && styles.searchBarFocused]}>
            <Ionicons name="search" size={22} color={colors.primary} style={styles.searchIcon} />

            <TextInput
              style={styles.input}
              placeholder="Search profile by name..."
              placeholderTextColor={colors.muted}
              value={search}
              onChangeText={(text) => {
                setSearch(text);
                loadProfiles(text);
              }}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />

            {search.length > 0 && (
              <Pressable style={styles.clearBtn} onPress={handleClearInput}>
                <Ionicons name="close-circle" size={20} color={colors.muted} />
              </Pressable>
            )}
          </View>
        </View>

        {/* LinkedIn Style Flat Recent Searches Section */}
        {recentSearches.length > 0 && search.trim() === "" && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Recent searches</Text>
              <Pressable onPress={clearAllRecentSearches} hitSlop={8}>
                <Text style={styles.clearAllText}>Clear all</Text>
              </Pressable>
            </View>

            <View style={styles.recentList}>
              {recentSearches.map((term, index) => (
                <View key={index} style={styles.recentItemRow}>
                  <Pressable
                    style={({ pressed }) => [
                      styles.recentItemTouchable,
                      pressed && { opacity: 0.7 },
                    ]}
                    onPress={() => handleSelectRecent(term)}
                  >
                    <Ionicons name="time-outline" size={20} color={colors.muted} style={styles.timeIcon} />
                    <Text style={styles.recentText} numberOfLines={1}>
                      {term}
                    </Text>
                  </Pressable>

                  <Pressable
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    onPress={(e) => removeRecentSearch(term, e)}
                    style={styles.removeRecentBtn}
                  >
                    <Ionicons name="close" size={18} color={colors.muted} />
                  </Pressable>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Profile Results Count Header */}
        {search.trim() !== "" && (
          <View style={styles.resultsHeader}>
            <Text style={styles.resultsText}>
              Matching Profiles ({profiles.length})
            </Text>
          </View>
        )}

        {/* Search Results List */}
        <FlatList
          data={profiles}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.resultRow,
                pressed && { backgroundColor: "#EFF6FF" },
              ]}
              onPress={() => handleSelectProfile(item)}
            >
              <Image
                source={{ uri: imageUrl(item.profilePhoto) }}
                style={styles.resultAvatar}
              />
              <View style={styles.resultInfo}>
                <Text style={styles.resultName} numberOfLines={1}>
                  {item.fullName}, {item.age}
                </Text>
                <Text style={styles.resultSub} numberOfLines={1}>
                  {item.occupation} • {item.city}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={colors.muted} />
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="search-outline" size={36} color={colors.primary} />
              </View>
              <Text style={styles.empty}>
                {search.trim()
                  ? `No profiles found matching "${search}".`
                  : "No profiles available yet."}
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
  searchBarWrapper: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 10,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 50,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  searchBarFocused: {
    borderColor: colors.primary,
    backgroundColor: "#FFFFFF",
  },
  searchIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
    color: colors.text,
    height: "100%",
  },
  clearBtn: {
    padding: 4,
  },
  recentSection: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 4,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  clearAllText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.primary,
  },
  recentList: {
    marginTop: 2,
  },
  recentItemRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F3EEF0",
  },
  recentItemTouchable: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: 12,
  },
  timeIcon: {
    marginRight: 12,
  },
  recentText: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "500",
  },
  removeRecentBtn: {
    padding: 4,
  },
  resultsHeader: {
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  resultsText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  list: {
    paddingHorizontal: 16,
    paddingBottom: 30,
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  resultAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    marginRight: 14,
    backgroundColor: colors.border,
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: "700",
    color: colors.text,
  },
  resultSub: {
    fontSize: 13,
    color: colors.muted,
    marginTop: 3,
    fontWeight: "500",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: 60,
    paddingHorizontal: 20,
  },
  emptyIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  empty: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 15,
    fontWeight: "500",
    lineHeight: 22,
  },
});
