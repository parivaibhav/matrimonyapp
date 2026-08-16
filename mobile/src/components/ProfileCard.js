import React, { useEffect, useRef } from "react";
import {
  Animated,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";

import { colors } from "../theme";
import { imageUrl } from "../api";
import { useResponsiveLayout } from "../utils/responsive";

export default function ProfileCard({
  profile,
  onPress,
  numColumns = 1,
  loading = false,
}) {
  const { isSmallPhone } = useResponsiveLayout();

  const isMultiColumn = numColumns > 1;

  const cardHeight = isMultiColumn
    ? isSmallPhone
      ? 285
      : 320
    : isSmallPhone
      ? 380
      : 415;

  /*
   * ============================================================
   * SKELETON ANIMATION
   * ============================================================
   */

  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!loading) {
      shimmer.setValue(0);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 850,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 850,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [loading, shimmer]);

  const skeletonOpacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.8],
  });

  /*
   * ============================================================
   * SKELETON UI
   * ============================================================
   */

  if (loading) {
    return (
      <View
        style={[
          styles.card,
          {
            height: cardHeight,
          },
          isMultiColumn && styles.gridCard,
        ]}
      >
        {/* =====================================================
            SKELETON IMAGE
        ====================================================== */}

        <Animated.View
          style={[
            styles.skeletonImage,
            {
              opacity: skeletonOpacity,
            },
          ]}
        />

        {/* =====================================================
            SKELETON BOTTOM GLASS
        ====================================================== */}

        <View style={styles.detailsContainer}>
          <Animated.View
            style={[
              styles.skeletonGlass,
              {
                opacity: skeletonOpacity,
              },
            ]}
          />

          <View style={styles.details}>
            {/* NAME */}

            <Animated.View
              style={[
                styles.skeletonName,
                {
                  opacity: skeletonOpacity,
                },
              ]}
            />

            {/* AGE + LOCATION */}

            <View style={styles.metaRow}>
              <Animated.View
                style={[
                  styles.skeletonMeta,
                  styles.skeletonAge,
                  {
                    opacity: skeletonOpacity,
                  },
                ]}
              />

              <Animated.View
                style={[
                  styles.skeletonMeta,
                  styles.skeletonLocation,
                  {
                    opacity: skeletonOpacity,
                  },
                ]}
              />
            </View>

            {/* OCCUPATION + EDUCATION */}

            <View style={styles.infoRow}>
              <Animated.View
                style={[
                  styles.skeletonInfo,
                  {
                    opacity: skeletonOpacity,
                  },
                ]}
              />

              <Animated.View
                style={[
                  styles.skeletonInfo,
                  {
                    opacity: skeletonOpacity,
                  },
                ]}
              />
            </View>

            {/* FOOTER */}

            <View style={styles.footer}>
              <Animated.View
                style={[
                  styles.skeletonFooterText,
                  {
                    opacity: skeletonOpacity,
                  },
                ]}
              />

              <Animated.View
                style={[
                  styles.skeletonArrow,
                  {
                    opacity: skeletonOpacity,
                  },
                ]}
              />
            </View>
          </View>
        </View>
      </View>
    );
  }

  /*
   * ============================================================
   * NORMAL PROFILE CARD
   * ============================================================
   */

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        {
          height: cardHeight,
        },
        isMultiColumn && styles.gridCard,
        pressed && styles.pressed,
      ]}
    >
      {/* =====================================================
          PROFILE IMAGE
      ====================================================== */}

      <Image
        source={{
          uri: imageUrl(profile?.profilePhoto),
        }}
        style={styles.profileImage}
        resizeMode="cover"
      />

      {/* =====================================================
          VERY SUBTLE IMAGE OVERLAY
      ====================================================== */}

      <View pointerEvents="none" style={styles.imageOverlay} />

      {/* =====================================================
          BOTTOM GLASS DETAILS
      ====================================================== */}

      <View style={styles.detailsContainer}>
        {/* REAL IMAGE BLUR */}

        <BlurView
          intensity={45}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />

        {/* SUBTLE TRANSPARENT TINT */}

        <View pointerEvents="none" style={styles.glassTint} />

        {/* GLASS REFLECTION */}

        <View pointerEvents="none" style={styles.glassHighlight} />

        {/* =================================================
            CONTENT
        ================================================== */}

        <View style={styles.details}>
          {/* NAME */}

          <Text
            style={[styles.name, isSmallPhone && styles.smallName]}
            numberOfLines={1}
          >
            {profile?.fullName || "User Profile"}
          </Text>

          {/* AGE + LOCATION */}

          <View style={styles.metaRow}>
            {profile?.age ? (
              <View style={styles.metaGlass}>
                <Ionicons name="calendar-outline" size={12} color="#FFFFFF" />

                <Text style={styles.metaText}>{profile.age} yrs</Text>
              </View>
            ) : null}

            {profile?.city ? (
              <View style={styles.metaGlass}>
                <Ionicons name="location-outline" size={12} color="#FFFFFF" />

                <Text style={styles.metaText} numberOfLines={1}>
                  {profile.city}
                </Text>
              </View>
            ) : null}
          </View>

          {/* OCCUPATION + EDUCATION */}

          <View style={styles.infoRow}>
            {profile?.occupation ? (
              <View style={styles.infoItem}>
                <Ionicons
                  name="briefcase-outline"
                  size={13}
                  color="rgba(255,255,255,0.92)"
                />

                <Text style={styles.infoText} numberOfLines={1}>
                  {profile.occupation}
                </Text>
              </View>
            ) : null}

            {profile?.education ? (
              <View style={styles.infoItem}>
                <Ionicons
                  name="school-outline"
                  size={13}
                  color="rgba(255,255,255,0.92)"
                />

                <Text style={styles.infoText} numberOfLines={1}>
                  {profile.education}
                </Text>
              </View>
            ) : null}
          </View>

          {/* FOOTER */}

          <View style={styles.footer}>
            <Text style={styles.viewProfile}>View Profile</Text>

            <View style={styles.arrowButton}>
              <Ionicons name="arrow-forward" size={15} color={colors.primary} />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  /*
   * ============================================================
   * MAIN CARD
   * ============================================================
   */

  card: {
    width: "100%",
    borderRadius: 34,
    overflow: "hidden",
    backgroundColor: "transparent",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.30)",

    shadowColor: "#000",

    shadowOffset: {
      width: 0,
      height: 10,
    },

    shadowOpacity: 0.16,
    shadowRadius: 20,

    elevation: 6,
  },

  gridCard: {
    flex: 1,
    marginHorizontal: 5,
    marginBottom: 12,
    borderRadius: 30,
  },

  pressed: {
    opacity: 0.96,

    transform: [
      {
        scale: 0.985,
      },
    ],
  },

  /*
   * ============================================================
   * PROFILE IMAGE
   * ============================================================
   */

  profileImage: {
    position: "absolute",

    top: 0,
    left: 0,
    right: 0,
    bottom: 0,

    width: "100%",
    height: "100%",
  },

  imageOverlay: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: "rgba(0,0,0,0.025)",
  },

  /*
   * ============================================================
   * GLASS CONTAINER
   * ============================================================
   */

  detailsContainer: {
    position: "absolute",

    left: 0,
    right: 0,
    bottom: 0,

    minHeight: 160,

    overflow: "hidden",

    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,

    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,

    backgroundColor: "transparent",

    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.45)",
  },

  glassTint: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: "rgba(20,25,35,0.12)",
  },

  glassHighlight: {
    position: "absolute",

    top: 0,
    left: 18,
    right: 18,

    height: 1,

    backgroundColor: "rgba(255,255,255,0.30)",
  },

  /*
   * ============================================================
   * DETAILS
   * ============================================================
   */

  details: {
    paddingHorizontal: 17,
    paddingTop: 15,
    paddingBottom: 13,
  },

  /*
   * ============================================================
   * NAME
   * ============================================================
   */

  name: {
    fontSize: 20,
    fontWeight: "900",
    color: "#FFFFFF",

    letterSpacing: -0.35,

    marginBottom: 9,

    textShadowColor: "rgba(0,0,0,0.55)",

    textShadowOffset: {
      width: 0,
      height: 1,
    },

    textShadowRadius: 4,
  },

  smallName: {
    fontSize: 17,
  },

  /*
   * ============================================================
   * AGE + LOCATION
   * ============================================================
   */

  metaRow: {
    flexDirection: "row",
    alignItems: "center",

    gap: 7,

    marginBottom: 9,
  },

  metaGlass: {
    flexDirection: "row",
    alignItems: "center",

    gap: 5,

    paddingHorizontal: 9,
    paddingVertical: 5,

    borderRadius: 14,

    backgroundColor: "rgba(255,255,255,0.16)",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.32)",

    maxWidth: "58%",
  },

  metaText: {
    color: "#FFFFFF",

    fontSize: 11.5,
    fontWeight: "800",

    flexShrink: 1,

    textShadowColor: "rgba(0,0,0,0.45)",

    textShadowOffset: {
      width: 0,
      height: 1,
    },

    textShadowRadius: 2,
  },

  /*
   * ============================================================
   * OCCUPATION + EDUCATION
   * ============================================================
   */

  infoRow: {
    flexDirection: "row",
    alignItems: "center",

    gap: 14,

    marginBottom: 10,
  },

  infoItem: {
    flexDirection: "row",
    alignItems: "center",

    gap: 5,

    flexShrink: 1,

    maxWidth: "50%",
  },

  infoText: {
    color: "#FFFFFF",

    fontSize: 10.5,
    fontWeight: "700",

    flexShrink: 1,

    textShadowColor: "rgba(0,0,0,0.50)",

    textShadowOffset: {
      width: 0,
      height: 1,
    },

    textShadowRadius: 3,
  },

  /*
   * ============================================================
   * FOOTER
   * ============================================================
   */

  footer: {
    flexDirection: "row",
    alignItems: "center",

    justifyContent: "space-between",

    paddingTop: 9,

    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.22)",
  },

  viewProfile: {
    color: "#FFFFFF",

    fontSize: 12.5,
    fontWeight: "800",

    textShadowColor: "rgba(0,0,0,0.50)",

    textShadowOffset: {
      width: 0,
      height: 1,
    },

    textShadowRadius: 3,
  },

  arrowButton: {
    width: 31,
    height: 31,

    borderRadius: 16,

    alignItems: "center",
    justifyContent: "center",

    backgroundColor: "rgba(255,255,255,0.18)",

    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.38)",
  },

  /*
   * ============================================================
   * SKELETON IMAGE
   * ============================================================
   */

  skeletonImage: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: "#D1D5DB",
  },

  /*
   * ============================================================
   * SKELETON GLASS
   * ============================================================
   */

  skeletonGlass: {
    ...StyleSheet.absoluteFillObject,

    backgroundColor: "rgba(156,163,175,0.42)",
  },

  /*
   * ============================================================
   * SKELETON NAME
   * ============================================================
   */

  skeletonName: {
    width: "58%",
    height: 20,

    borderRadius: 8,

    backgroundColor: "#9CA3AF",

    marginBottom: 9,
  },

  /*
   * ============================================================
   * SKELETON META
   * ============================================================
   */

  skeletonMeta: {
    height: 25,

    borderRadius: 14,

    backgroundColor: "#9CA3AF",
  },

  skeletonAge: {
    width: 65,
  },

  skeletonLocation: {
    width: 90,
  },

  /*
   * ============================================================
   * SKELETON INFO
   * ============================================================
   */

  skeletonInfo: {
    height: 14,

    width: "38%",

    borderRadius: 7,

    backgroundColor: "#9CA3AF",
  },

  /*
   * ============================================================
   * SKELETON FOOTER
   * ============================================================
   */

  skeletonFooterText: {
    width: 85,
    height: 14,

    borderRadius: 7,

    backgroundColor: "#9CA3AF",
  },

  skeletonArrow: {
    width: 31,
    height: 31,

    borderRadius: 16,

    backgroundColor: "#9CA3AF",
  },
});
