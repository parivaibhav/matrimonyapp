import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, View } from "react-native";

import { useResponsiveLayout } from "../utils/responsive";

export default function ProfileCardSkeleton({ numColumns = 1 }) {
  const { isSmallPhone } = useResponsiveLayout();

  const isMultiColumn = numColumns > 1;

  const cardHeight = isMultiColumn
    ? isSmallPhone
      ? 285
      : 320
    : isSmallPhone
      ? 380
      : 415;

  const shimmer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(shimmer, {
          toValue: 0,
          duration: 900,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [shimmer]);

  const opacity = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [0.45, 0.8],
  });

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
      {/* Fake profile image */}
      <Animated.View
        style={[
          styles.imageSkeleton,
          {
            opacity,
          },
        ]}
      />

      {/* Bottom information skeleton */}
      <View style={styles.detailsContainer}>
        <Animated.View
          style={[
            styles.glassSkeleton,
            {
              opacity,
            },
          ]}
        />

        <View style={styles.details}>
          {/* Name */}
          <Animated.View
            style={[
              styles.nameSkeleton,
              {
                opacity,
              },
            ]}
          />

          {/* Age + Location */}
          <View style={styles.metaRow}>
            <Animated.View
              style={[
                styles.metaSkeleton,
                styles.ageSkeleton,
                {
                  opacity,
                },
              ]}
            />

            <Animated.View
              style={[
                styles.metaSkeleton,
                styles.locationSkeleton,
                {
                  opacity,
                },
              ]}
            />
          </View>

          {/* Occupation + Education */}
          <View style={styles.infoRow}>
            <Animated.View
              style={[
                styles.infoSkeleton,
                {
                  opacity,
                },
              ]}
            />

            <Animated.View
              style={[
                styles.infoSkeleton,
                {
                  opacity,
                },
              ]}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Animated.View
              style={[
                styles.viewProfileSkeleton,
                {
                  opacity,
                },
              ]}
            />

            <Animated.View
              style={[
                styles.arrowSkeleton,
                {
                  opacity,
                },
              ]}
            />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    borderRadius: 34,
    overflow: "hidden",
    backgroundColor: "#E5E7EB",

    borderWidth: 1,
    borderColor: "#D1D5DB",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 4,
  },

  gridCard: {
    flex: 1,
    marginHorizontal: 5,
    marginBottom: 12,
    borderRadius: 30,
  },

  imageSkeleton: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#D1D5DB",
  },

  detailsContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,

    minHeight: 160,

    overflow: "hidden",

    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,

    backgroundColor: "rgba(255,255,255,0.75)",

    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.8)",
  },

  glassSkeleton: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(156,163,175,0.45)",
  },

  details: {
    paddingHorizontal: 17,
    paddingTop: 15,
    paddingBottom: 13,
  },

  nameSkeleton: {
    width: "58%",
    height: 20,
    borderRadius: 8,
    backgroundColor: "#9CA3AF",
    marginBottom: 9,
  },

  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 9,
  },

  metaSkeleton: {
    height: 25,
    borderRadius: 14,
    backgroundColor: "#9CA3AF",
  },

  ageSkeleton: {
    width: 65,
  },

  locationSkeleton: {
    width: 90,
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 10,
  },

  infoSkeleton: {
    height: 14,
    width: "38%",
    borderRadius: 7,
    backgroundColor: "#9CA3AF",
  },

  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    paddingTop: 9,

    borderTopWidth: 1,
    borderTopColor: "rgba(107,114,128,0.20)",
  },

  viewProfileSkeleton: {
    width: 85,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#9CA3AF",
  },

  arrowSkeleton: {
    width: 31,
    height: 31,
    borderRadius: 16,
    backgroundColor: "#9CA3AF",
  },
});
