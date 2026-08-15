import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { colors } from "../theme";
import { imageUrl } from "../api";
import { useResponsiveLayout } from "../utils/responsive";

export default function ProfileCard({ profile, onPress, numColumns = 1 }) {
  const { isSmallPhone } = useResponsiveLayout();
  const isMultiColumn = numColumns > 1;

  const imageWidth = isMultiColumn ? 105 : isSmallPhone ? 110 : 125;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        isMultiColumn && styles.gridCard,
        isSmallPhone && styles.smallCard,
        pressed && { opacity: 0.94, transform: [{ scale: 0.985 }] },
      ]}
      onPress={onPress}
    >
      {/* Left Side: Landscape Image Container */}
      <View style={[styles.imageWrapper, { width: imageWidth }]}>
        <Image
          source={{ uri: imageUrl(profile?.profilePhoto) }}
          style={styles.image}
          resizeMode="cover"
        />
      </View>

      {/* Right Side: Profile Details Body */}
      <View style={[styles.body, isSmallPhone && { padding: 10 }]}>
        {/* Name Header (Standalone Line) */}
        <View style={styles.topRow}>
          <Text style={[styles.name, isSmallPhone && { fontSize: 15 }]} numberOfLines={1}>
            {profile?.fullName || "User Profile"}
          </Text>
        </View>

        {/* Meta Details Pills (Age, Location, Occupation, Education) */}
        <View style={[styles.chipRow, isSmallPhone && { gap: 4 }]}>
          {profile?.age ? (
            <View style={[styles.chip, isSmallPhone && styles.smallChip]}>
              <Ionicons name="calendar-outline" size={isSmallPhone ? 10 : 11} color={colors.primary} />
              <Text style={[styles.chipText, isSmallPhone && { fontSize: 10.5 }]}>
                {profile.age} yrs
              </Text>
            </View>
          ) : null}

          {profile?.city ? (
            <View style={[styles.chip, isSmallPhone && styles.smallChip]}>
              <Ionicons name="location-outline" size={isSmallPhone ? 10 : 11} color={colors.primary} />
              <Text style={[styles.chipText, isSmallPhone && { fontSize: 10.5 }]} numberOfLines={1}>
                {profile.city}
              </Text>
            </View>
          ) : null}

          {profile?.occupation ? (
            <View style={[styles.chip, isSmallPhone && styles.smallChip]}>
              <Ionicons name="briefcase-outline" size={isSmallPhone ? 10 : 11} color={colors.primary} />
              <Text style={[styles.chipText, isSmallPhone && { fontSize: 10.5 }]} numberOfLines={1}>
                {profile.occupation}
              </Text>
            </View>
          ) : null}

          {profile?.education ? (
            <View style={[styles.chip, isSmallPhone && styles.smallChip]}>
              <Ionicons name="school-outline" size={isSmallPhone ? 10 : 11} color={colors.primary} />
              <Text style={[styles.chipText, isSmallPhone && { fontSize: 10.5 }]} numberOfLines={1}>
                {profile.education}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Footer Action */}
        <View style={styles.cardFooter}>
          <Text style={[styles.viewProfileText, isSmallPhone && { fontSize: 11.5 }]}>
            View Profile
          </Text>
          <View style={styles.arrowIconBox}>
            <Ionicons name="arrow-forward" size={12} color={colors.primary} />
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
    overflow: "hidden",
    width: "100%",
    minHeight: 130,
    shadowColor: "rgba(15, 23, 42, 0.04)",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  smallCard: {
    borderRadius: 16,
    minHeight: 118,
    marginBottom: 12,
  },
  gridCard: {
    flex: 1,
    marginHorizontal: 6,
    marginBottom: 14,
  },
  imageWrapper: {
    position: "relative",
    backgroundColor: colors.border,
  },
  image: {
    width: "100%",
    height: "100%",
  },
  body: {
    flex: 1,
    padding: 12,
    justifyContent: "space-between",
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  name: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.text,
    flex: 1,
  },
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 5,
    marginVertical: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
    gap: 3,
    maxWidth: "100%",
  },
  smallChip: {
    paddingHorizontal: 6,
    paddingVertical: 2.5,
    borderRadius: 8,
  },
  chipText: {
    fontSize: 11.5,
    fontWeight: "600",
    color: colors.primary,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  viewProfileText: {
    fontSize: 12.5,
    fontWeight: "800",
    color: colors.primary,
  },
  arrowIconBox: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
});
