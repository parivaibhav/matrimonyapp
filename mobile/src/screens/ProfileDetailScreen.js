import React, { useEffect, useMemo, useState } from "react";
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
  const { profileId } = route.params || {};

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);

  const insets = useSafeAreaInsets();

  const { isTablet, isSmallPhone, maxContentWidth } = useResponsiveLayout();

  // ==========================================================
  // LOAD PROFILE
  // ==========================================================

  useEffect(() => {
    if (!profileId) {
      Alert.alert("Profile Error", "Profile ID is missing.", [
        {
          text: "Go Back",
          onPress: () => navigation.goBack(),
        },
      ]);

      return;
    }

    loadProfileDetails();
  }, [profileId]);

  async function loadProfileDetails() {
    try {
      setLoading(true);

      console.log("LOADING PROFILE:", profileId);

      const response = await api.get(`/profiles/${profileId}`);

      console.log("PROFILE DETAIL RESPONSE:", response.data);

      setProfile(response.data);
    } catch (error) {
      console.log(
        "PROFILE DETAIL ERROR:",
        error?.response?.data || error?.message || error,
      );

      Alert.alert(
        "Unable to Load",
        error?.response?.data?.message ||
          "Could not load this profile. Please try again.",
        [
          {
            text: "Go Back",
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } finally {
      setLoading(false);
    }
  }

  // ==========================================================
  // SEND INTEREST
  // ==========================================================

  async function sendInterest() {
    if (!profile?._id || sent || sending) {
      return;
    }

    try {
      setSending(true);

      console.log("SENDING INTEREST TO:", profile._id);

      await api.post(`/interests/${profile._id}`);

      setSent(true);

      Alert.alert(
        "Interest Sent 🎉",
        `Your interest has been sent to ${profile.fullName || "this profile"}.`,
      );
    } catch (error) {
      console.log(
        "SEND INTEREST ERROR:",
        error?.response?.data || error?.message || error,
      );

      if (error?.response?.status === 409) {
        setSent(true);

        Alert.alert(
          "Already Sent",
          "You have already sent an interest to this profile.",
        );
      } else {
        Alert.alert(
          "Something went wrong",
          error?.response?.data?.message ||
            "Could not send interest. Please try again.",
        );
      }
    } finally {
      setSending(false);
    }
  }

  // ==========================================================
  // IMAGE
  // ==========================================================

  const profileImage = useMemo(() => {
    if (!profile?.profilePhoto) {
      return null;
    }

    try {
      return imageUrl(profile.profilePhoto);
    } catch (error) {
      console.log("IMAGE URL ERROR:", error);
      return null;
    }
  }, [profile?.profilePhoto]);

  // ==========================================================
  // RESPONSIVE
  // ==========================================================

  const heroHeight = isTablet ? 560 : isSmallPhone ? 370 : 450;

  const horizontalPadding = isTablet ? 28 : isSmallPhone ? 14 : 16;

  const bottomBarPadding = Math.max(insets.bottom, 12);

  // ==========================================================
  // LOADING
  // ==========================================================

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <ProfileSkeleton isSmallPhone={isSmallPhone} isTablet={isTablet} />
      </SafeAreaView>
    );
  }

  // ==========================================================
  // NO PROFILE
  // ==========================================================

  if (!profile) {
    return (
      <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
        <View style={styles.errorScreen}>
          <View style={styles.errorIcon}>
            <Ionicons name="person-outline" size={34} color={colors.primary} />
          </View>

          <Text style={styles.errorTitle}>Profile not found</Text>

          <Text style={styles.errorText}>
            This profile may have been removed or is no longer available.
          </Text>

          <Pressable
            onPress={() => navigation.goBack()}
            style={styles.errorButton}
          >
            <Ionicons name="arrow-back" size={18} color="#FFFFFF" />

            <Text style={styles.errorButtonText}>Go Back</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  // ==========================================================
  // MAIN UI
  // ==========================================================

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <View style={styles.root}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.scrollContent,
            {
              paddingBottom: 100 + bottomBarPadding,
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
                HERO IMAGE
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
              {profileImage ? (
                <Image
                  source={{
                    uri: profileImage,
                  }}
                  style={styles.heroImage}
                  resizeMode="cover"
                  onError={(error) => {
                    console.log(
                      "PROFILE IMAGE ERROR:",
                      error?.nativeEvent?.error,
                    );
                  }}
                />
              ) : (
                <View style={styles.imagePlaceholder}>
                  <View style={styles.imagePlaceholderIcon}>
                    <Ionicons name="person" size={70} color="#94A3B8" />
                  </View>

                  <Text style={styles.imagePlaceholderText}>
                    No profile photo
                  </Text>
                </View>
              )}

              {/* IMAGE OVERLAY */}

              <View style={styles.heroOverlay} />

              {/* BACK */}

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

              <View style={styles.nameRow}>
                <Text
                  style={[styles.name, isSmallPhone && styles.nameSmall]}
                  numberOfLines={2}
                >
                  {profile.fullName || "Profile"}

                  {profile.age ? `, ${profile.age}` : ""}
                </Text>
              </View>

              {/* LOCATION */}

              {profile.city ? (
                <View style={styles.locationRow}>
                  <View style={styles.locationIcon}>
                    <Ionicons
                      name="location-outline"
                      size={15}
                      color={colors.primary}
                    />
                  </View>

                  <Text style={styles.locationText} numberOfLines={1}>
                    {profile.city}
                  </Text>
                </View>
              ) : null}

              {/* QUICK INFO */}

              <View style={styles.quickInfoRow}>
                {profile.gender ? (
                  <QuickInfo
                    icon={
                      profile.gender === "Male"
                        ? "male-outline"
                        : "female-outline"
                    }
                    text={profile.gender}
                  />
                ) : null}

                {profile.education ? (
                  <QuickInfo icon="school-outline" text={profile.education} />
                ) : null}
              </View>
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
                    icon="calendar-outline"
                    label="Age"
                    value={profile.age ? `${profile.age} years` : ""}
                  />

                  <DetailItem
                    icon="resize-outline"
                    label="Height"
                    value={profile.height}
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

                  <DetailItem
                    icon="people-outline"
                    label="Dasha Nam"
                    value={profile.dashaNam}
                  />
                </View>
              </ModernSection>

              {/* ==================================================
                  FAMILY
              ================================================== */}

              {(profile.fatherName ||
                profile.motherName ||
                profile.familyDetails) && (
                <ModernSection icon="people-outline" title="Family Details">
                  <View style={styles.familyList}>
                    {profile.fatherName ? (
                      <FamilyItem
                        icon="man-outline"
                        label="Father"
                        value={profile.fatherName}
                      />
                    ) : null}

                    {profile.motherName ? (
                      <FamilyItem
                        icon="woman-outline"
                        label="Mother"
                        value={profile.motherName}
                      />
                    ) : null}

                    {profile.fatherMobile ? (
                      <FamilyItem
                        icon="call-outline"
                        label="Father Mobile"
                        value={profile.fatherMobile}
                      />
                    ) : null}
                  </View>

                  {profile.familyDetails ? (
                    <View style={styles.familyDescription}>
                      <Text style={styles.familyDescriptionLabel}>Family</Text>

                      <Text style={styles.familyDescriptionText}>
                        {profile.familyDetails}
                      </Text>
                    </View>
                  ) : null}
                </ModernSection>
              )}

              {/* ==================================================
                  INTERESTS
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
                  BIODATA
              ================================================== */}

              {profile.biodataUrl ? (
                <ModernSection icon="document-text-outline" title="Biodata">
                  <View style={styles.biodataCard}>
                    <View style={styles.biodataIcon}>
                      <Ionicons
                        name="document-text-outline"
                        size={22}
                        color={colors.primary}
                      />
                    </View>

                    <View style={styles.biodataContent}>
                      <Text style={styles.biodataTitle}>Biodata available</Text>

                      <Text style={styles.biodataText}>
                        This profile has uploaded a biodata document.
                      </Text>
                    </View>
                  </View>
                </ModernSection>
              ) : null}

              {/* ==================================================
                  CONNECT
              ================================================== */}

              <View style={styles.connectionCard}>
                <View style={styles.connectionIcon}>
                  <Ionicons
                    name="heart-outline"
                    size={22}
                    color={colors.primary}
                  />
                </View>

                <View style={styles.connectionContent}>
                  <Text style={styles.connectionTitle}>
                    Interested in this profile?
                  </Text>

                  <Text style={styles.connectionText}>
                    Send an interest to start a meaningful connection.
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
                    name={sent ? "checkmark-circle" : "heart-outline"}
                    size={21}
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
// QUICK INFO
// ============================================================

function QuickInfo({ icon, text }) {
  return (
    <View style={styles.quickInfo}>
      <Ionicons name={icon} size={15} color={colors.primary} />

      <Text style={styles.quickInfoText} numberOfLines={1}>
        {text}
      </Text>
    </View>
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
  if (!value) {
    return null;
  }

  return (
    <View style={styles.detailItem}>
      <View style={styles.detailIcon}>
        <Ionicons name={icon} size={17} color={colors.primary} />
      </View>

      <View style={styles.detailContent}>
        <Text style={styles.detailLabel}>{label}</Text>

        <Text style={styles.detailValue} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

// ============================================================
// FAMILY ITEM
// ============================================================

function FamilyItem({ icon, label, value }) {
  return (
    <View style={styles.familyItem}>
      <View style={styles.familyIcon}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>

      <View style={styles.familyContent}>
        <Text style={styles.familyLabel}>{label}</Text>

        <Text style={styles.familyValue}>{value}</Text>
      </View>
    </View>
  );
}

// ============================================================
// SKELETON
// ============================================================

function ProfileSkeleton({ isSmallPhone, isTablet }) {
  const heroHeight = isTablet ? 560 : isSmallPhone ? 370 : 450;

  return (
    <ScrollView
      style={styles.skeletonScreen}
      showsVerticalScrollIndicator={false}
    >
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

      <View style={styles.skeletonProfileCard}>
        <View style={styles.skeletonName} />
        <View style={styles.skeletonLocation} />
        <View style={styles.skeletonQuickInfo} />
      </View>

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

  heroOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 130,
    backgroundColor: "rgba(0,0,0,0.16)",
  },

  imagePlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E2E8F0",
  },

  imagePlaceholderIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#CBD5E1",
  },

  imagePlaceholderText: {
    marginTop: 12,
    color: "#64748B",
    fontSize: 13,
    fontWeight: "700",
  },

  // ==========================================================
  // BACK
  // ==========================================================

  backButton: {
    position: "absolute",
    top: 16,
    left: 16,

    width: 44,
    height: 44,

    borderRadius: 15,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(15,23,42,0.65)",

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
    marginTop: -20,

    backgroundColor: "#FFFFFF",

    borderRadius: 25,

    padding: 20,

    borderWidth: 1,
    borderColor: "#E2E8F0",

    zIndex: 5,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.06,
    shadowRadius: 12,

    elevation: 3,
  },

  nameRow: {
    flexDirection: "row",
    alignItems: "center",
  },

  name: {
    flex: 1,

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

  locationRow: {
    flexDirection: "row",
    alignItems: "center",

    marginTop: 8,
  },

  locationIcon: {
    width: 27,
    height: 27,

    borderRadius: 9,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.primaryLight,

    marginRight: 7,
  },

  locationText: {
    color: colors.muted,

    fontSize: 13,
    fontWeight: "600",

    flexShrink: 1,
  },

  quickInfoRow: {
    flexDirection: "row",
    flexWrap: "wrap",

    gap: 7,

    marginTop: 14,
  },

  quickInfo: {
    flexDirection: "row",
    alignItems: "center",

    paddingHorizontal: 10,
    paddingVertical: 7,

    borderRadius: 11,

    backgroundColor: "#F8FAFC",

    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  quickInfoText: {
    marginLeft: 5,

    color: colors.text,

    fontSize: 11.5,
    fontWeight: "700",
  },

  // ==========================================================
  // CONTENT
  // ==========================================================

  content: {
    marginTop: 14,
  },

  // ==========================================================
  // SECTION
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

    marginRight: 9,
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
  // FAMILY
  // ==========================================================

  familyList: {
    gap: 10,
  },

  familyItem: {
    flexDirection: "row",
    alignItems: "center",

    padding: 11,

    borderRadius: 14,

    backgroundColor: "#F8FAFC",

    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  familyIcon: {
    width: 38,
    height: 38,

    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.primaryLight,

    marginRight: 10,
  },

  familyContent: {
    flex: 1,
  },

  familyLabel: {
    color: colors.muted,

    fontSize: 10.5,
    fontWeight: "600",
  },

  familyValue: {
    color: colors.text,

    fontSize: 13,
    fontWeight: "700",

    marginTop: 2,
  },

  familyDescription: {
    marginTop: 12,

    paddingTop: 12,

    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },

  familyDescriptionLabel: {
    color: colors.muted,

    fontSize: 10.5,
    fontWeight: "600",
  },

  familyDescriptionText: {
    color: colors.text,

    fontSize: 13.5,
    lineHeight: 21,

    marginTop: 4,
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
  // BIODATA
  // ==========================================================

  biodataCard: {
    flexDirection: "row",
    alignItems: "center",

    padding: 12,

    borderRadius: 15,

    backgroundColor: "#F8FAFC",

    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  biodataIcon: {
    width: 45,
    height: 45,

    borderRadius: 14,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.primaryLight,

    marginRight: 11,
  },

  biodataContent: {
    flex: 1,
  },

  biodataTitle: {
    color: colors.text,

    fontSize: 13.5,
    fontWeight: "800",
  },

  biodataText: {
    color: colors.muted,

    fontSize: 11.5,
    lineHeight: 17,

    marginTop: 3,
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
    width: 46,
    height: 46,

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
  // ERROR
  // ==========================================================

  errorScreen: {
    flex: 1,

    alignItems: "center",
    justifyContent: "center",

    paddingHorizontal: 30,
  },

  errorIcon: {
    width: 76,
    height: 76,

    borderRadius: 25,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: colors.primaryLight,
  },

  errorTitle: {
    marginTop: 17,

    color: colors.text,

    fontSize: 19,
    fontWeight: "900",
  },

  errorText: {
    marginTop: 7,

    color: colors.muted,

    fontSize: 13.5,
    lineHeight: 20,

    textAlign: "center",
  },

  errorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    gap: 7,

    marginTop: 20,

    paddingHorizontal: 20,
    paddingVertical: 12,

    borderRadius: 14,

    backgroundColor: colors.primary,
  },

  errorButtonText: {
    color: "#FFFFFF",

    fontSize: 13.5,
    fontWeight: "800",
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

  skeletonQuickInfo: {
    width: "55%",
    height: 32,

    borderRadius: 10,

    backgroundColor: "#E2E8F0",

    marginTop: 14,
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
