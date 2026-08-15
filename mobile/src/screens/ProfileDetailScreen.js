import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { api, imageUrl } from "../api";
import { colors } from "../theme";
import { useResponsiveLayout } from "../utils/responsive";

export default function ProfileDetailScreen({ route, navigation }) {
  const { profileId } = route.params;
  const [profile, setProfile] = useState(null);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const insets = useSafeAreaInsets();
  const { isTablet, isSmallPhone, maxContentWidth } = useResponsiveLayout();

  useEffect(() => {
    loadProfileDetails();
  }, [profileId]);

  async function loadProfileDetails() {
    try {
      const { data } = await api.get(`/profiles/${profileId}`);
      setProfile(data);
    } catch (e) {
      console.log("Error loading profile:", e);
    }
  }

  async function sendInterest() {
    if (sent || sending) return;

    try {
      setSending(true);
      await api.post(`/interests/${profileId}`);
      setSent(true);
      Alert.alert("Success 🎉", "Interest sent successfully to " + (profile?.fullName || "this profile") + ".");
    } catch (e) {
      if (e.response?.status === 409) {
        setSent(true);
        Alert.alert("Already Sent", "You have already sent an interest to this profile.");
      } else {
        Alert.alert("Error", e.response?.data?.message || "Could not send interest. Please try again.");
      }
    } finally {
      setSending(false);
    }
  }

  if (!profile) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile details...</Text>
      </SafeAreaView>
    );
  }

  const heroHeight = isTablet ? 440 : isSmallPhone ? 320 : 380;
  const bottomBarPadding = Math.max(insets.bottom, 12);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={{ flex: 1 }}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: 90 + bottomBarPadding },
          ]}
        >
          <View style={[styles.container, { maxWidth: maxContentWidth }]}>
            {/* Hero Image Container with Floating Header */}
            <View style={styles.heroWrapper}>
              <Image
                source={{ uri: imageUrl(profile.profilePhoto) }}
                style={[styles.heroImage, { height: heroHeight }]}
                resizeMode="cover"
              />

              {/* Floating Back Button */}
              <Pressable
                style={({ pressed }) => [
                  styles.floatingBackBtn,
                  pressed && { opacity: 0.8 },
                ]}
                onPress={() => navigation.goBack()}
                hitSlop={8}
              >
                <Ionicons name="chevron-back" size={24} color={colors.text} />
              </Pressable>
            </View>

            {/* Profile Overview Card */}
            <View style={styles.overviewCard}>
              <View style={styles.nameRow}>
                <Text style={[styles.name, isSmallPhone && { fontSize: 24 }]}>
                  {profile.fullName}, {profile.age}
                </Text>
              </View>

              <Text style={styles.headline}>
                {profile.occupation || "Member"} • {profile.city || "Location specified"}
              </Text>

              {/* Quick Info Chips */}
              <View style={styles.chipRow}>
                {profile.gender ? (
                  <View style={styles.chip}>
                    <Ionicons name="person-outline" size={13} color={colors.primary} />
                    <Text style={styles.chipText}>{profile.gender}</Text>
                  </View>
                ) : null}

                {profile.city ? (
                  <View style={styles.chip}>
                    <Ionicons name="location-outline" size={13} color={colors.primary} />
                    <Text style={styles.chipText}>{profile.city}</Text>
                  </View>
                ) : null}

                {profile.education ? (
                  <View style={styles.chip}>
                    <Ionicons name="school-outline" size={13} color={colors.primary} />
                    <Text style={styles.chipText}>{profile.education}</Text>
                  </View>
                ) : null}

                {profile.occupation ? (
                  <View style={styles.chip}>
                    <Ionicons name="briefcase-outline" size={13} color={colors.primary} />
                    <Text style={styles.chipText}>{profile.occupation}</Text>
                  </View>
                ) : null}
              </View>
            </View>

            {/* Profile Details Sections */}
            <View style={styles.sectionsContainer}>
              {/* About Me */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="document-text-outline" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>About Me</Text>
                </View>
                <Text style={styles.aboutText}>
                  {profile.bio || "No bio added yet. Feel free to connect to know more."}
                </Text>
              </View>

              {/* Personal & Professional Details */}
              <View style={styles.sectionCard}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="information-circle-outline" size={20} color={colors.primary} />
                  <Text style={styles.sectionTitle}>Personal & Professional Details</Text>
                </View>

                <View style={styles.grid}>
                  <DetailItem
                    icon="resize-outline"
                    label="Height"
                    value={profile.height}
                  />
                  <DetailItem
                    icon="book-outline"
                    label="Religion"
                    value={profile.religion}
                  />
                  <DetailItem
                    icon="people-outline"
                    label="Community"
                    value={profile.community}
                  />
                  <DetailItem
                    icon="school-outline"
                    label="Education"
                    value={profile.education}
                  />
                  <DetailItem
                    icon="briefcase-outline"
                    label="Occupation"
                    value={profile.occupation}
                  />
                  <DetailItem
                    icon="location-outline"
                    label="Location"
                    value={profile.city}
                  />
                </View>
              </View>


              {/* Hobbies & Interests */}
              {profile.interests && profile.interests.length > 0 && (
                <View style={styles.sectionCard}>
                  <View style={styles.sectionHeader}>
                    <Ionicons name="heart-outline" size={20} color={colors.primary} />
                    <Text style={styles.sectionTitle}>Interests & Hobbies</Text>
                  </View>
                  <View style={styles.interestsWrapper}>
                    {profile.interests.map((interest, idx) => (
                      <View key={idx} style={styles.interestTag}>
                        <Ionicons name="sparkles" size={12} color={colors.primary} />
                        <Text style={styles.interestTagText}>{interest}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </View>
        </ScrollView>

        {/* Floating Action Bar */}
        <View style={[styles.bottomBar, { paddingBottom: bottomBarPadding }]}>
          <View style={[styles.bottomBarInner, { maxWidth: maxContentWidth }]}>
            <Pressable
              style={({ pressed }) => [
                styles.actionBtn,
                sent && styles.actionBtnSent,
                pressed && !sent && { opacity: 0.9, transform: [{ scale: 0.99 }] },
              ]}
              onPress={sendInterest}
              disabled={sent || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name={sent ? "checkmark-circle" : "heart"}
                    size={20}
                    color="#FFFFFF"
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.actionBtnText}>
                    {sent ? "Interest Sent" : "Send Interest"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

function DetailItem({ icon, label, value }) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIconBox}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value || "Not specified"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },
  loadingText: {
    color: colors.muted,
    fontSize: 15,
    marginTop: 12,
    fontWeight: "500",
  },
  scrollContent: {
    paddingBottom: 20,
  },
  container: {
    width: "100%",
    alignSelf: "center",
  },
  heroWrapper: {
    position: "relative",
    width: "100%",
    backgroundColor: colors.border,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    overflow: "hidden",
  },
  heroImage: {
    width: "100%",
  },
  floatingBackBtn: {
    position: "absolute",
    top: 14,
    left: 16,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "rgba(0,0,0,0.1)",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: 34,
    left: 16,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.success,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
    gap: 4,
  },
  verifiedText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700",
  },
  overviewCard: {
    backgroundColor: "#FFFFFF",
    marginTop: -22,
    marginHorizontal: 16,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 26,
    fontWeight: "900",
    color: colors.text,
  },
  headline: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
    fontWeight: "500",
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "600",
    color: colors.primary,
  },
  sectionsContainer: {
    paddingHorizontal: 16,
    marginTop: 14,
  },
  sectionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
  },
  aboutText: {
    color: colors.text,
    fontSize: 15,
    lineHeight: 24,
    fontWeight: "400",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  detailItem: {
    width: "50%",
    paddingHorizontal: 6,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  detailIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  detailContent: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: colors.muted,
    fontWeight: "500",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
    marginTop: 1,
  },
  interestsWrapper: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  interestTag: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  interestTagText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "700",
  },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F0E6E9",
    paddingTop: 12,
    paddingHorizontal: 16,
  },
  bottomBarInner: {
    width: "100%",
    alignSelf: "center",
  },
  actionBtn: {
    flexDirection: "row",
    backgroundColor: colors.primary,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnSent: {
    backgroundColor: colors.success,
  },
  actionBtnText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "800",
  },
});
