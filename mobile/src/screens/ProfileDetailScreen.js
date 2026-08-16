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
import {
  SafeAreaView,
  useSafeAreaInsets,
} from "react-native-safe-area-context";
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

  // ==========================================================
  // LOAD PROFILE
  // ==========================================================

  useEffect(() => {
    loadProfileDetails();
  }, [profileId]);

  async function loadProfileDetails() {
    try {
      const { data } = await api.get(`/profiles/${profileId}`);

      setProfile(data);
    } catch (error) {
      console.log("Error loading profile:", error);

      Alert.alert(
        "Unable to Load",
        "Could not load this profile. Please try again.",
      );
    }
  }

  // ==========================================================
  // SEND INTEREST
  // ==========================================================

  async function sendInterest() {
    if (sent || sending) return;

    try {
      setSending(true);

      await api.post(`/interests/${profileId}`);

      setSent(true);

      Alert.alert(
        "Interest Sent 🎉",
        `Your interest has been sent to ${
          profile?.fullName || "this profile"
        }.`,
      );
    } catch (error) {
      if (error.response?.status === 409) {
        setSent(true);

        Alert.alert(
          "Already Sent",
          "You have already sent an interest to this profile.",
        );
      } else {
        Alert.alert(
          "Something went wrong",
          error.response?.data?.message ||
            "Could not send interest. Please try again.",
        );
      }
    } finally {
      setSending(false);
    }
  }

  // ==========================================================
  // LOADING
  // ==========================================================

  if (!profile) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <ProfileSkeleton isSmallPhone={isSmallPhone} isTablet={isTablet} />
      </SafeAreaView>
    );
  }

  // ==========================================================
  // RESPONSIVE VALUES
  // ==========================================================

  const heroHeight = isTablet ? 560 : isSmallPhone ? 370 : 450;

  const horizontalPadding = isTablet ? 28 : isSmallPhone ? 14 : 16;

  const bottomBarPadding = Math.max(insets.bottom, 12);

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: 90 + bottomBarPadding,
            },
          ]}
        >
          <View
            style={[
              styles.container,
              {
                maxWidth: maxContentWidth,
              },
            ]}
          >
            {/* ==================================================
                PROFILE IMAGE
            ================================================== */}

            <View
              style={[
                styles.heroWrapper,
                {
                  height: heroHeight,
                  marginHorizontal: isTablet ? 24 : 0,
                  borderRadius: isTablet ? 28 : 0,
                },
              ]}
            >
              <Image
                source={{
                  uri: imageUrl(profile.profilePhoto),
                }}
                style={styles.heroImage}
                resizeMode="cover"
              />

              {/* BACK BUTTON */}

              <Pressable
                onPress={() => navigation.goBack()}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.backButton,
                  pressed && styles.backButtonPressed,
                ]}
              >
                <Ionicons name="arrow-back" size={21} color="#FFFFFF" />
              </Pressable>
            </View>

            {/* ==================================================
                PROFILE HEADER
                Only basic information here.
                No duplicated details.
            ================================================== */}

            <View
              style={[
                styles.profileCard,
                {
                  marginHorizontal: horizontalPadding,
                },
              ]}
            >
              {/* NAME */}

              <Text
                style={[styles.name, isSmallPhone && styles.nameSmall]}
                numberOfLines={2}
              >
                {profile.fullName || "Profile"}
                {profile.age ? `, ${profile.age}` : ""}
              </Text>

              {/* LOCATION */}

              {profile.city && (
                <View style={styles.locationRow}>
                  <Ionicons
                    name="location-outline"
                    size={16}
                    color={colors.muted}
                  />

                  <Text style={styles.locationText} numberOfLines={1}>
                    {profile.city}
                  </Text>
                </View>
              )}

              {/* OCCUPATION */}

              {profile.occupation && (
                <View style={styles.occupationRow}>
                  <View style={styles.occupationIcon}>
                    <Ionicons
                      name="briefcase-outline"
                      size={17}
                      color={colors.primary}
                    />
                  </View>

                  <View style={styles.occupationContent}>
                    <Text style={styles.occupationLabel}>Profession</Text>

                    <Text style={styles.occupationText} numberOfLines={2}>
                      {profile.occupation}
                    </Text>
                  </View>
                </View>
              )}
            </View>

            {/* ==================================================
                CONTENT
            ================================================== */}

            <View
              style={[
                styles.content,
                {
                  paddingHorizontal: horizontalPadding,
                },
              ]}
            >
              {/* ==================================================
                  ABOUT
              ================================================== */}

              <ModernSection icon="person-outline" title="About">
                <Text style={styles.aboutText}>
                  {profile.bio ||
                    "No bio added yet. Feel free to connect to know more."}
                </Text>
              </ModernSection>

              {/* ==================================================
                  PROFILE DETAILS
                  
                  All personal/professional details are shown
                  ONLY HERE so they don't repeat.
              ================================================== */}

              <ModernSection
                icon="information-circle-outline"
                title="Profile Details"
              >
                <View style={styles.detailsGrid}>
                  <DetailItem
                    icon="person-outline"
                    label="Gender"
                    value={profile.gender}
                  />

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
              </ModernSection>

              {/* ==================================================
                  INTERESTS & HOBBIES
              ================================================== */}

              {Array.isArray(profile.interests) &&
                profile.interests.length > 0 && (
                  <ModernSection
                    icon="sparkles-outline"
                    title="Interests & Hobbies"
                  >
                    <View style={styles.interestsWrapper}>
                      {profile.interests.map((interest, index) => (
                        <View
                          key={`${interest}-${index}`}
                          style={styles.interestTag}
                        >
                          <Ionicons
                            name="sparkles-outline"
                            size={13}
                            color={colors.primary}
                          />

                          <Text style={styles.interestText}>{interest}</Text>
                        </View>
                      ))}
                    </View>
                  </ModernSection>
                )}

              {/* ==================================================
                  CONNECT CARD
              ================================================== */}

              <View style={styles.connectionCard}>
                <View style={styles.connectionIcon}>
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={20}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.connectionContent}>
                  <Text style={styles.connectionTitle}>Want to connect?</Text>

                  <Text style={styles.connectionText}>
                    Send an interest to start a connection.
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>

        {/* ======================================================
            BOTTOM ACTION
        ======================================================= */}

        <View
          style={[
            styles.bottomBar,
            {
              paddingBottom: bottomBarPadding,
            },
          ]}
        >
          <View
            style={[
              styles.bottomBarInner,
              {
                maxWidth: maxContentWidth,
                paddingHorizontal: horizontalPadding,
              },
            ]}
          >
            <Pressable
              onPress={sendInterest}
              disabled={sent || sending}
              style={({ pressed }) => [
                styles.actionButton,
                sent && styles.actionButtonSent,
                pressed && !sent && styles.actionButtonPressed,
              ]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons
                    name={sent ? "checkmark-circle" : "paper-plane-outline"}
                    size={20}
                    color="#FFFFFF"
                  />

                  <Text style={styles.actionButtonText}>
                    {sent ? "Interest Sent" : "Send Interest"}
                  </Text>

                  {!sent && (
                    <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                  )}
                </>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

// ============================================================
// MODERN SECTION
// ============================================================

function ModernSection({ icon, title, children }) {
  return (
    <View style={styles.sectionCard}>
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>

        <Text style={styles.sectionTitle}>{title}</Text>
      </View>

      {children}
    </View>
  );
}

// ============================================================
// DETAIL ITEM
// ============================================================

function DetailItem({ icon, label, value }) {
  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>

      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>

        <Text style={styles.detailValue} numberOfLines={2}>
          {value || "Not specified"}
        </Text>
      </View>
    </View>
  );
}

// ============================================================
// SKELETON LOADING
// ============================================================

function ProfileSkeleton({ isSmallPhone, isTablet }) {
  const heroHeight = isTablet ? 560 : isSmallPhone ? 370 : 450;

  return (
    <ScrollView
      style={styles.skeletonScreen}
      showsVerticalScrollIndicator={false}
    >
      {/* IMAGE */}

      <View
        style={[
          styles.skeletonHero,
          {
            height: heroHeight,
            marginHorizontal: isTablet ? 24 : 0,
            borderRadius: isTablet ? 28 : 0,
          },
        ]}
      >
        <View style={styles.skeletonBackButton} />
      </View>

      {/* PROFILE HEADER */}

      <View style={styles.skeletonProfileCard}>
        <View style={styles.skeletonName} />

        <View style={styles.skeletonLocation} />

        <View style={styles.skeletonOccupation} />
      </View>

      {/* SECTIONS */}

      <SkeletonSection />

      <SkeletonSection />

      <SkeletonSection />
    </ScrollView>
  );
}

function SkeletonSection() {
  return (
    <View style={styles.skeletonSection}>
      <View style={styles.skeletonSectionTitle} />

      <View style={styles.skeletonLine} />

      <View style={styles.skeletonLine} />

      <View style={styles.skeletonLineShort} />
    </View>
  );
}

// ============================================================
// STYLES
// ============================================================

const styles = StyleSheet.create({
  // ==========================================================
  // SCREEN
  // ==========================================================

  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  root: {
    flex: 1,
  },

  scrollContent: {
    paddingBottom: 20,
  },

  container: {
    width: "100%",
    alignSelf: "center",
  },

  // ==========================================================
  // HERO
  // ==========================================================

  heroWrapper: {
    width: "100%",

    overflow: "hidden",

    backgroundColor: "#E2E8F0",

    position: "relative",
  },

  heroImage: {
    width: "100%",
    height: "100%",

    backgroundColor: "#E2E8F0",
  },

  // ==========================================================
  // BACK BUTTON
  // ==========================================================

  backButton: {
    position: "absolute",

    top: 16,
    left: 16,

    width: 44,
    height: 44,

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(15, 23, 42, 0.58)",

    borderWidth: 1,

    borderColor: "rgba(255,255,255,0.25)",
  },

  backButtonPressed: {
    opacity: 0.7,

    transform: [
      {
        scale: 0.94,
      },
    ],
  },

  // ==========================================================
  // PROFILE HEADER
  // ==========================================================

  profileCard: {
    marginTop: -18,

    backgroundColor: "#FFFFFF",

    borderRadius: 24,

    padding: 20,

    borderWidth: 1,

    borderColor: "#E2E8F0",

    zIndex: 5,
  },

  name: {
    color: colors.text,

    fontSize: 28,

    lineHeight: 34,

    fontWeight: "900",

    letterSpacing: -0.6,
  },

  nameSmall: {
    fontSize: 24,

    lineHeight: 30,
  },

  // ==========================================================
  // LOCATION
  // ==========================================================

  locationRow: {
    flexDirection: "row",

    alignItems: "center",

    gap: 4,

    marginTop: 6,
  },

  locationText: {
    color: colors.muted,

    fontSize: 13,

    fontWeight: "600",

    flexShrink: 1,
  },

  // ==========================================================
  // OCCUPATION
  // ==========================================================

  occupationRow: {
    flexDirection: "row",

    alignItems: "center",

    marginTop: 18,

    paddingTop: 16,

    borderTopWidth: 1,

    borderTopColor: "#F1F5F9",
  },

  occupationIcon: {
    width: 42,
    height: 42,

    borderRadius: 13,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.primaryLight,

    borderWidth: 1,

    borderColor: "#DBEAFE",

    marginRight: 11,
  },

  occupationContent: {
    flex: 1,

    minWidth: 0,
  },

  occupationLabel: {
    color: colors.muted,

    fontSize: 10.5,

    fontWeight: "600",
  },

  occupationText: {
    color: colors.text,

    fontSize: 14,

    fontWeight: "800",

    marginTop: 2,
  },

  // ==========================================================
  // CONTENT
  // ==========================================================

  content: {
    marginTop: 14,
  },

  // ==========================================================
  // SECTION CARD
  // ==========================================================

  sectionCard: {
    backgroundColor: "#FFFFFF",

    borderRadius: 21,

    padding: 18,

    marginBottom: 13,

    borderWidth: 1,

    borderColor: "#E2E8F0",
  },

  sectionHeader: {
    flexDirection: "row",

    alignItems: "center",

    gap: 9,

    marginBottom: 14,
  },

  sectionIcon: {
    width: 35,
    height: 35,

    borderRadius: 11,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.primaryLight,

    borderWidth: 1,

    borderColor: "#DBEAFE",
  },

  sectionTitle: {
    color: colors.text,

    fontSize: 16,

    fontWeight: "800",
  },

  // ==========================================================
  // ABOUT
  // ==========================================================

  aboutText: {
    color: colors.text,

    fontSize: 14.5,

    lineHeight: 23,

    fontWeight: "400",
  },

  // ==========================================================
  // DETAILS
  // ==========================================================

  detailsGrid: {
    flexDirection: "row",

    flexWrap: "wrap",

    marginHorizontal: -5,
  },

  detailItem: {
    width: "50%",

    paddingHorizontal: 5,

    paddingVertical: 8,

    flexDirection: "row",

    alignItems: "center",
  },

  detailIcon: {
    width: 38,
    height: 38,

    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#F8FAFC",

    borderWidth: 1,

    borderColor: "#E2E8F0",

    marginRight: 9,
  },

  detailContent: {
    flex: 1,

    minWidth: 0,
  },

  detailLabel: {
    color: colors.muted,

    fontSize: 10.5,

    fontWeight: "600",
  },

  detailValue: {
    color: colors.text,

    fontSize: 13,

    fontWeight: "700",

    marginTop: 2,

    lineHeight: 18,
  },

  // ==========================================================
  // INTERESTS
  // ==========================================================

  interestsWrapper: {
    flexDirection: "row",

    flexWrap: "wrap",

    gap: 8,
  },

  interestTag: {
    flexDirection: "row",

    alignItems: "center",

    paddingHorizontal: 11,

    paddingVertical: 8,

    borderRadius: 13,

    backgroundColor: "#F8FAFC",

    borderWidth: 1,

    borderColor: "#E2E8F0",

    gap: 6,
  },

  interestText: {
    color: colors.primary,

    fontSize: 12,

    fontWeight: "700",
  },

  // ==========================================================
  // CONNECTION
  // ==========================================================

  connectionCard: {
    flexDirection: "row",

    alignItems: "center",

    backgroundColor: colors.primaryLight,

    borderRadius: 19,

    padding: 15,

    marginBottom: 10,

    borderWidth: 1,

    borderColor: "#DBEAFE",
  },

  connectionIcon: {
    width: 44,
    height: 44,

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: "#DBEAFE",

    marginRight: 11,
  },

  connectionContent: {
    flex: 1,

    minWidth: 0,
  },

  connectionTitle: {
    color: colors.text,

    fontSize: 13.5,

    fontWeight: "800",
  },

  connectionText: {
    color: colors.muted,

    fontSize: 11.5,

    lineHeight: 17,

    marginTop: 3,
  },

  // ==========================================================
  // BOTTOM BAR
  // ==========================================================

  bottomBar: {
    position: "absolute",

    left: 0,
    right: 0,
    bottom: 0,

    paddingTop: 9,

    backgroundColor: "#FFFFFF",

    borderTopWidth: 1,

    borderTopColor: "#E2E8F0",
  },

  bottomBarInner: {
    width: "100%",

    alignSelf: "center",
  },

  actionButton: {
    height: 54,

    borderRadius: 17,

    backgroundColor: colors.primary,

    borderWidth: 1,

    borderColor: colors.primary,

    flexDirection: "row",

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 18,

    gap: 9,
  },

  actionButtonSent: {
    backgroundColor: colors.success,

    borderColor: colors.success,
  },

  actionButtonPressed: {
    opacity: 0.8,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  actionButtonText: {
    color: "#FFFFFF",

    fontSize: 15,

    fontWeight: "800",

    flex: 1,

    textAlign: "center",
  },

  // ==========================================================
  // SKELETON
  // ==========================================================

  skeletonScreen: {
    flex: 1,

    backgroundColor: colors.bg,
  },

  skeletonHero: {
    width: "100%",

    backgroundColor: "#E2E8F0",

    overflow: "hidden",

    position: "relative",
  },

  skeletonBackButton: {
    position: "absolute",

    top: 16,
    left: 16,

    width: 44,
    height: 44,

    borderRadius: 14,

    backgroundColor: "#CBD5E1",
  },

  skeletonProfileCard: {
    marginHorizontal: 16,

    marginTop: -18,

    padding: 20,

    borderRadius: 24,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: "#E2E8F0",
  },

  skeletonName: {
    width: "62%",

    height: 28,

    borderRadius: 8,

    backgroundColor: "#E2E8F0",
  },

  skeletonLocation: {
    width: "38%",

    height: 13,

    borderRadius: 7,

    backgroundColor: "#E2E8F0",

    marginTop: 9,
  },

  skeletonOccupation: {
    width: "70%",

    height: 42,

    borderRadius: 12,

    backgroundColor: "#E2E8F0",

    marginTop: 18,
  },

  skeletonSection: {
    marginHorizontal: 16,

    marginTop: 14,

    padding: 18,

    borderRadius: 21,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,

    borderColor: "#E2E8F0",
  },

  skeletonSectionTitle: {
    width: 140,

    height: 20,

    borderRadius: 7,

    backgroundColor: "#E2E8F0",

    marginBottom: 15,
  },

  skeletonLine: {
    width: "90%",

    height: 13,

    borderRadius: 7,

    backgroundColor: "#E2E8F0",

    marginTop: 9,
  },

  skeletonLineShort: {
    width: "55%",

    height: 13,

    borderRadius: 7,

    backgroundColor: "#E2E8F0",

    marginTop: 9,
  },
});
