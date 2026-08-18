import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { api } from "../api";
import { colors, shadow } from "../theme";
import { useResponsiveLayout } from "../utils/responsive";

export default function CompleteProfileScreen({ navigation }) {
  const { isSmallPhone, isTablet } = useResponsiveLayout();

  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null);

  const [form, setForm] = useState({
    fullName: "",
    dob: "",
    gender: "Male",
    location: "",
    education: "",
    occupation: "",
    height: "",
    weight: "",
    interests: "",
    fatherName: "",
    fatherMobile: "",
    motherName: "",
  });

  /* =========================================================
     SET FIELD
  ========================================================= */

  function setField(key, value) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  /* =========================================================
     PICK PHOTO
  ========================================================= */

  async function choosePhoto() {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert(
          "Permission required",
          "Please allow photo access to select your profile photo.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.length > 0) {
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      console.log("IMAGE PICKER ERROR:", error);

      Alert.alert("Photo error", "Unable to select your profile photo.");
    }
  }

  /* =========================================================
     DOB VALIDATION
  ========================================================= */

  function isValidDob(value) {
    const parts = value.split("-");

    if (parts.length !== 3) {
      return false;
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const day = Number(parts[2]);

    if (
      !Number.isInteger(year) ||
      !Number.isInteger(month) ||
      !Number.isInteger(day)
    ) {
      return false;
    }

    if (year < 1900 || month < 1 || month > 12 || day < 1 || day > 31) {
      return false;
    }

    const date = new Date(year, month - 1, day);

    return (
      date.getFullYear() === year &&
      date.getMonth() === month - 1 &&
      date.getDate() === day
    );
  }

  /* =========================================================
     CALCULATE AGE
  ========================================================= */

  function calculateAge(dob) {
    if (!isValidDob(dob)) {
      return null;
    }

    const [year, month, day] = dob.split("-").map(Number);

    const birthDate = new Date(year, month - 1, day);
    const today = new Date();

    let age = today.getFullYear() - birthDate.getFullYear();

    const monthDifference = today.getMonth() - birthDate.getMonth();

    if (
      monthDifference < 0 ||
      (monthDifference === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }

  /* =========================================================
     VALIDATION
  ========================================================= */

  function validateForm() {
    const fullName = form.fullName.trim();
    const dob = form.dob.trim();
    const location = form.location.trim();

    if (!fullName) {
      Alert.alert("Name required", "Please enter your full name.");
      return false;
    }

    if (!form.gender) {
      Alert.alert("Gender required", "Please select your gender.");
      return false;
    }

    if (!dob) {
      Alert.alert("Date of birth required", "Please enter your date of birth.");
      return false;
    }

    if (!isValidDob(dob)) {
      Alert.alert(
        "Invalid date",
        "Please enter your date of birth in YYYY-MM-DD format.",
      );
      return false;
    }

    const age = calculateAge(dob);

    if (age === null || age < 18) {
      Alert.alert("Invalid age", "You must be at least 18 years old.");
      return false;
    }

    if (!location) {
      Alert.alert("Location required", "Please enter your city or location.");
      return false;
    }

    return true;
  }

  /* =========================================================
     COMPLETE PROFILE
  ========================================================= */

  async function completeProfile() {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      const token = await AsyncStorage.getItem("token");

      if (!token) {
        Alert.alert("Session expired", "Please login again.", [
          {
            text: "OK",
            onPress: () => navigation.replace("Login"),
          },
        ]);

        return;
      }

      const interests = form.interests
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);

      const body = new FormData();

      /* =====================================================
         USER SCHEMA FIELDS
      ===================================================== */

      body.append("fullName", form.fullName.trim());

      body.append("dob", form.dob.trim());

      body.append("gender", form.gender);

      body.append("location", form.location.trim());

      body.append("education", form.education.trim());

      body.append("occupation", form.occupation.trim());

      body.append("height", form.height.trim());

      body.append("weight", form.weight.trim());

      body.append("interests", JSON.stringify(interests));

      body.append("fatherName", form.fatherName.trim());

      body.append("fatherMobile", form.fatherMobile.trim());

      body.append("motherName", form.motherName.trim());

      /* =====================================================
         PROFILE PHOTO
      ===================================================== */

      if (photo?.uri) {
        const filename =
          photo.fileName || photo.uri.split("/").pop() || "profile.jpg";

        const type = photo.mimeType || "image/jpeg";

        body.append("profilePhoto", {
          uri: photo.uri,
          name: filename,
          type,
        });
      }

      console.log("COMPLETE PROFILE REQUEST", {
        fullName: form.fullName,
        dob: form.dob,
        gender: form.gender,
        location: form.location,
        education: form.education,
        occupation: form.occupation,
        height: form.height,
        weight: form.weight,
        interests,
        fatherName: form.fatherName,
        fatherMobile: form.fatherMobile,
        motherName: form.motherName,
        hasPhoto: Boolean(photo?.uri),
      });

      const response = await api.put("/profile/complete", body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("COMPLETE PROFILE RESPONSE:", response.data);

      const updatedUser = response.data?.user;

      if (updatedUser) {
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      }

      Alert.alert(
        "Profile completed",
        "Your profile has been successfully completed.",
        [
          {
            text: "Continue",
            onPress: () => {
              navigation.replace("Home");
            },
          },
        ],
      );
    } catch (error) {
      console.log("COMPLETE PROFILE ERROR:", error);

      console.log("COMPLETE PROFILE RESPONSE:", error.response?.data);

      let message = "Unable to complete your profile.";

      if (error.response?.data?.message) {
        message = error.response.data.message;
      } else if (error.message === "Network Error") {
        message = "Cannot connect to the backend server.";
      } else if (error.message) {
        message = error.message;
      }

      Alert.alert("Profile update failed", message);
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     INPUT
  ========================================================= */

  function renderInput({
    label,
    field,
    placeholder,
    keyboardType = "default",
    multiline = false,
    autoCapitalize = "sentences",
  }) {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>

        <TextInput
          style={[styles.input, multiline && styles.multilineInput]}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={form[field]}
          onChangeText={(value) => setField(field, value)}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={!loading}
          multiline={multiline}
          textAlignVertical={multiline ? "top" : "center"}
        />
      </View>
    );
  }

  /* =========================================================
     GENDER
  ========================================================= */

  function renderGender() {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Gender</Text>

        <View style={styles.genderRow}>
          {["Male", "Female"].map((gender) => {
            const selected = form.gender === gender;

            return (
              <Pressable
                key={gender}
                onPress={() => setField("gender", gender)}
                disabled={loading}
                style={[
                  styles.genderButton,
                  selected && styles.genderButtonSelected,
                ]}
              >
                <Ionicons
                  name={gender === "Male" ? "male-outline" : "female-outline"}
                  size={19}
                  color={selected ? colors.primary : colors.muted}
                />

                <Text
                  style={[
                    styles.genderText,
                    selected && styles.genderTextSelected,
                  ]}
                >
                  {gender}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  /* =========================================================
     PHOTO
  ========================================================= */

  function renderPhoto() {
    return (
      <View style={styles.photoSection}>
        <Pressable
          style={styles.photoButton}
          onPress={choosePhoto}
          disabled={loading}
        >
          {photo?.uri ? (
            <Image
              source={{
                uri: photo.uri,
              }}
              style={styles.profileImage}
            />
          ) : (
            <View style={styles.photoPlaceholder}>
              <View style={styles.photoIconCircle}>
                <Ionicons
                  name="camera-outline"
                  size={30}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.photoTitle}>Add profile photo</Text>

              <Text style={styles.photoSubtitle}>
                Choose a clear photo of yourself
              </Text>
            </View>
          )}

          {photo?.uri && (
            <View style={styles.cameraBadge}>
              <Ionicons name="camera" size={17} color="#fff" />
            </View>
          )}
        </Pressable>

        {photo?.uri && (
          <Text style={styles.photoChangeText}>Tap photo to change</Text>
        )}
      </View>
    );
  }

  /* =========================================================
     SECTION HEADER
  ========================================================= */

  function renderSectionHeader(icon, title, subtitle) {
    return (
      <View style={styles.sectionHeader}>
        <View style={styles.sectionIcon}>
          <Ionicons name={icon} size={18} color={colors.primary} />
        </View>

        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>{title}</Text>

          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
      </View>
    );
  }

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          style={styles.screen}
          contentContainerStyle={[
            styles.container,
            isSmallPhone && styles.smallContainer,
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.card, isTablet && styles.tabletCard]}>
            {/* HEADER */}

            <View style={styles.header}>
              <View style={styles.headerIcon}>
                <Ionicons
                  name="person-outline"
                  size={27}
                  color={colors.primary}
                />
              </View>

              <Text style={[styles.title, isSmallPhone && styles.smallTitle]}>
                Complete your profile
              </Text>

              <Text style={styles.subtitle}>
                Add a few details to help people discover your profile.
              </Text>
            </View>

            {/* PHOTO */}

            {renderPhoto()}

            {/* BASIC INFORMATION */}

            {renderSectionHeader(
              "person-outline",
              "Basic information",
              "Your personal details",
            )}

            {renderInput({
              label: "Full name",
              field: "fullName",
              placeholder: "Enter your full name",
            })}

            {renderGender()}

            {renderInput({
              label: "Date of birth",
              field: "dob",
              placeholder: "YYYY-MM-DD",
              keyboardType:
                Platform.OS === "ios" ? "numbers-and-punctuation" : "numeric",
            })}

            <View style={styles.dobHintRow}>
              <Ionicons
                name="information-circle-outline"
                size={14}
                color={colors.muted}
              />

              <Text style={styles.dobHint}>You must be 18 or older.</Text>

              {form.dob && isValidDob(form.dob) && (
                <Text style={styles.agePreview}>
                  Age: {calculateAge(form.dob)}
                </Text>
              )}
            </View>

            {/* EDUCATION / CAREER */}

            {renderSectionHeader(
              "school-outline",
              "Education & career",
              "Your professional background",
            )}

            {renderInput({
              label: "Education",
              field: "education",
              placeholder: "e.g. B.Tech, MBA, Graduate",
            })}

            {renderInput({
              label: "Occupation",
              field: "occupation",
              placeholder: "e.g. Software Engineer",
            })}

            {/* LOCATION / APPEARANCE */}

            {renderSectionHeader(
              "location-outline",
              "Location & appearance",
              "Basic profile information",
            )}

            {renderInput({
              label: "Location",
              field: "location",
              placeholder: "Enter your city or location",
            })}

            {renderInput({
              label: "Height",
              field: "height",
              placeholder: `e.g. 5'8" or 173 cm`,
            })}

            {renderInput({
              label: "Weight",
              field: "weight",
              placeholder: "e.g. 65 kg",
              keyboardType: "decimal-pad",
            })}

            {/* INTERESTS */}

            {renderSectionHeader(
              "heart-outline",
              "Interests",
              "Tell people what you enjoy",
            )}

            {renderInput({
              label: "Interests",
              field: "interests",
              placeholder: "e.g. Travel, Music, Reading",
            })}

            <Text style={styles.fieldHint}>
              Separate multiple interests with commas.
            </Text>

            {/* FAMILY */}

            {renderSectionHeader(
              "people-outline",
              "Family information",
              "Basic family details",
            )}

            {renderInput({
              label: "Father's name",
              field: "fatherName",
              placeholder: "Enter father's name",
            })}

            {renderInput({
              label: "Father's mobile",
              field: "fatherMobile",
              placeholder: "Enter father's mobile number",
              keyboardType: "phone-pad",
              autoCapitalize: "none",
            })}

            {renderInput({
              label: "Mother's name",
              field: "motherName",
              placeholder: "Enter mother's name",
            })}

            {/* COMPLETE BUTTON */}

            <Pressable
              style={({ pressed }) => [
                styles.button,
                loading && styles.buttonDisabled,
                pressed && !loading && styles.buttonPressed,
              ]}
              onPress={completeProfile}
              disabled={loading}
            >
              {loading ? (
                <View style={styles.buttonContent}>
                  <ActivityIndicator size="small" color="#fff" />

                  <Text style={styles.buttonText}>Saving profile...</Text>
                </View>
              ) : (
                <View style={styles.buttonContent}>
                  <Text style={styles.buttonText}>Complete Profile</Text>

                  <Ionicons name="arrow-forward" size={21} color="#fff" />
                </View>
              )}
            </Pressable>

            <Text style={styles.bottomText}>
              You can update your profile details later from your profile
              settings.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* =========================================================
   STYLES
========================================================= */

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  flex: {
    flex: 1,
  },

  container: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 50,
  },

  smallContainer: {
    paddingHorizontal: 16,
  },

  card: {
    width: "100%",
    maxWidth: 650,
    alignSelf: "center",
  },

  tabletCard: {
    backgroundColor: "#fff",
    padding: 34,
    borderRadius: 28,
    ...shadow,
  },

  /* =======================================================
     HEADER
  ======================================================= */

  header: {
    alignItems: "center",
    marginBottom: 28,
  },

  headerIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  title: {
    fontSize: 29,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
    letterSpacing: -0.6,
  },

  smallTitle: {
    fontSize: 25,
  },

  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    maxWidth: 430,
    marginTop: 8,
  },

  /* =======================================================
     PHOTO
  ======================================================= */

  photoSection: {
    alignItems: "center",
    marginBottom: 30,
  },

  photoButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
    position: "relative",
  },

  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 75,
  },

  photoPlaceholder: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },

  photoIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 7,
  },

  photoTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "800",
    textAlign: "center",
  },

  photoSubtitle: {
    color: colors.muted,
    fontSize: 10,
    textAlign: "center",
    marginTop: 3,
  },

  cameraBadge: {
    position: "absolute",
    right: -3,
    bottom: 5,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },

  photoChangeText: {
    marginTop: 8,
    color: colors.primary,
    fontSize: 12,
    fontWeight: "700",
  },

  /* =======================================================
     SECTIONS
  ======================================================= */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 18,
    paddingTop: 8,
  },

  sectionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.text,
  },

  sectionSubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },

  /* =======================================================
     INPUT
  ======================================================= */

  inputGroup: {
    marginBottom: 17,
  },

  label: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },

  input: {
    height: 53,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 15,
    fontSize: 15,
    color: colors.text,
  },

  multilineInput: {
    height: 105,
    paddingTop: 14,
    paddingBottom: 14,
  },

  fieldHint: {
    color: colors.muted,
    fontSize: 11,
    marginTop: -8,
    marginBottom: 15,
  },

  dobHintRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: -9,
    marginBottom: 17,
  },

  dobHint: {
    color: colors.muted,
    fontSize: 11,
    marginLeft: 5,
  },

  agePreview: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
    marginLeft: "auto",
  },

  /* =======================================================
     GENDER
  ======================================================= */

  genderRow: {
    flexDirection: "row",
    gap: 12,
  },

  genderButton: {
    flex: 1,
    minHeight: 53,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  genderButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: "#EFF6FF",
  },

  genderText: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.muted,
  },

  genderTextSelected: {
    color: colors.primary,
    fontWeight: "900",
  },

  /* =======================================================
     BUTTON
  ======================================================= */

  button: {
    height: 57,
    backgroundColor: colors.primary,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 15,
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },

  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "900",
  },

  /* =======================================================
     FOOTER
  ======================================================= */

  bottomText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 17,
    paddingHorizontal: 20,
  },
});
