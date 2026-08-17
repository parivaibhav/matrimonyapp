import React, { useState } from "react";
import {
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

const DASHANAM_OPTIONS = [
  "Giri",
  "Puri",
  "Bharati",
  "Ashram",
  "Saraswati",
  "Aranya",
  "Van",
  "Parvat",
  "Sagar",
  "Tirtha",
  "Gosai",
];

export default function CompleteProfileScreen({ navigation }) {
  const { isSmallPhone, isTablet } = useResponsiveLayout();

  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [showDashaOptions, setShowDashaOptions] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    gender: "Male",
    age: "",
    phone: "",
    education: "",
    occupation: "",
    city: "",
    height: "",
    dashaNam: "",
    fatherName: "",
    motherName: "",
    fatherMobile: "",
    familyDetails: "",
    bio: "",
    interests: "",
    biodataUrl: "",
  });

  /* =========================================================
     SET FIELD
  ========================================================= */

  function setField(key, value) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  /* =========================================================
     PICK PROFILE PHOTO
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

      if (!result.canceled && result.assets?.length) {
        setPhoto(result.assets[0]);
      }
    } catch (error) {
      console.log("IMAGE PICKER ERROR:", error);

      Alert.alert("Photo error", "Unable to select the profile photo.");
    }
  }

  /* =========================================================
     VALIDATION
  ========================================================= */

  function validateForm() {
    const fullName = form.fullName.trim();
    const age = Number(form.age);
    const phone = form.phone.trim();

    if (!fullName) {
      Alert.alert("Name required", "Please enter your full name.");
      return false;
    }

    if (!form.gender) {
      Alert.alert("Gender required", "Please select your gender.");
      return false;
    }

    if (!form.age) {
      Alert.alert("Age required", "Please enter your age.");
      return false;
    }

    if (Number.isNaN(age) || age < 18) {
      Alert.alert("Invalid age", "You must be at least 18 years old.");
      return false;
    }

    if (!phone) {
      Alert.alert("Phone required", "Please enter your phone number.");
      return false;
    }

    const cleanPhone = phone.replace(/\D/g, "");

    if (cleanPhone.length < 10) {
      Alert.alert("Invalid phone", "Please enter a valid phone number.");
      return false;
    }

    if (!form.city.trim()) {
      Alert.alert("City required", "Please enter your city.");
      return false;
    }

    if (!form.dashaNam) {
      Alert.alert("DashaNam required", "Please select your DashaNam.");
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

      body.append("fullName", form.fullName.trim());
      body.append("gender", form.gender);
      body.append("age", String(Number(form.age)));
      body.append("phone", form.phone.trim());
      body.append("education", form.education.trim());
      body.append("occupation", form.occupation.trim());
      body.append("city", form.city.trim());
      body.append("height", form.height.trim());
      body.append("dashaNam", form.dashaNam);

      body.append("fatherName", form.fatherName.trim());
      body.append("motherName", form.motherName.trim());
      body.append("fatherMobile", form.fatherMobile.trim());
      body.append("familyDetails", form.familyDetails.trim());

      body.append("bio", form.bio.trim());

      body.append("interests", JSON.stringify(interests));

      body.append("biodataUrl", form.biodataUrl.trim());

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

      console.log("COMPLETE PROFILE REQUEST");

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
          autoCapitalize={
            field === "phone" || field === "fatherMobile" ? "none" : "sentences"
          }
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
     DASHANAM
  ========================================================= */

  function renderDashaNam() {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>DashaNam</Text>

        <Pressable
          style={[styles.dropdown, showDashaOptions && styles.dropdownActive]}
          onPress={() => setShowDashaOptions((previous) => !previous)}
          disabled={loading}
        >
          <View style={styles.dropdownLeft}>
            <Ionicons name="leaf-outline" size={20} color={colors.primary} />

            <Text
              style={[
                styles.dropdownText,
                !form.dashaNam && styles.placeholderText,
              ]}
            >
              {form.dashaNam || "Select DashaNam"}
            </Text>
          </View>

          <Ionicons
            name={showDashaOptions ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.muted}
          />
        </Pressable>

        {showDashaOptions && (
          <View style={styles.optionsContainer}>
            <ScrollView
              nestedScrollEnabled
              style={styles.optionsScroll}
              showsVerticalScrollIndicator={false}
            >
              {DASHANAM_OPTIONS.map((option) => {
                const selected = form.dashaNam === option;

                return (
                  <Pressable
                    key={option}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => {
                      setField("dashaNam", option);
                      setShowDashaOptions(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        selected && styles.optionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark"
                        size={19}
                        color={colors.primary}
                      />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}
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
            <Image source={{ uri: photo.uri }} style={styles.profileImage} />
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
                Tell us a little about yourself so people can discover your
                profile.
              </Text>
            </View>

            {/* PHOTO */}

            {renderPhoto()}

            {/* BASIC INFORMATION */}

            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>

              <View>
                <Text style={styles.sectionTitle}>Basic information</Text>

                <Text style={styles.sectionSubtitle}>
                  Your personal details
                </Text>
              </View>
            </View>

            {renderInput({
              label: "Full name",
              field: "fullName",
              placeholder: "Enter your full name",
            })}

            {renderGender()}

            {renderInput({
              label: "Age",
              field: "age",
              placeholder: "Enter your age",
              keyboardType: "numeric",
            })}

            {renderInput({
              label: "Phone number",
              field: "phone",
              placeholder: "Enter your phone number",
              keyboardType: "phone-pad",
            })}

            {/* EDUCATION / CAREER */}

            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="school-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>

              <View>
                <Text style={styles.sectionTitle}>Education & career</Text>

                <Text style={styles.sectionSubtitle}>
                  Help others know your background
                </Text>
              </View>
            </View>

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

            {/* LOCATION */}

            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="location-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>

              <View>
                <Text style={styles.sectionTitle}>Location & appearance</Text>

                <Text style={styles.sectionSubtitle}>
                  Basic location information
                </Text>
              </View>
            </View>

            {renderInput({
              label: "City",
              field: "city",
              placeholder: "Enter your city",
            })}

            {renderInput({
              label: "Height",
              field: "height",
              placeholder: "e.g. 5'8\" or 173 cm",
            })}

            {renderDashaNam()}

            {/* FAMILY */}

            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="people-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>

              <View>
                <Text style={styles.sectionTitle}>Family information</Text>

                <Text style={styles.sectionSubtitle}>
                  Tell us about your family
                </Text>
              </View>
            </View>

            {renderInput({
              label: "Father's name",
              field: "fatherName",
              placeholder: "Enter father's name",
            })}

            {renderInput({
              label: "Mother's name",
              field: "motherName",
              placeholder: "Enter mother's name",
            })}

            {renderInput({
              label: "Father's mobile",
              field: "fatherMobile",
              placeholder: "Enter father's mobile number",
              keyboardType: "phone-pad",
            })}

            {renderInput({
              label: "Family details",
              field: "familyDetails",
              placeholder: "Tell us about your family...",
              multiline: true,
            })}

            {/* ABOUT */}

            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="heart-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>

              <View>
                <Text style={styles.sectionTitle}>About you</Text>

                <Text style={styles.sectionSubtitle}>
                  Share something about yourself
                </Text>
              </View>
            </View>

            {renderInput({
              label: "Short bio",
              field: "bio",
              placeholder: "Write a short introduction about yourself...",
              multiline: true,
            })}

            {renderInput({
              label: "Interests",
              field: "interests",
              placeholder: "e.g. Travel, Music, Reading",
            })}

            <Text style={styles.fieldHint}>
              Separate multiple interests with commas.
            </Text>

            {/* BIODATA */}

            <View style={styles.sectionHeader}>
              <View style={styles.sectionIcon}>
                <Ionicons
                  name="document-text-outline"
                  size={18}
                  color={colors.primary}
                />
              </View>

              <View>
                <Text style={styles.sectionTitle}>Biodata</Text>

                <Text style={styles.sectionSubtitle}>
                  Optional biodata document
                </Text>
              </View>
            </View>

            {renderInput({
              label: "Biodata URL",
              field: "biodataUrl",
              placeholder: "https://example.com/biodata.pdf",
              keyboardType: "url",
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
                  <Ionicons name="sync-outline" size={21} color="#fff" />

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
     DROPDOWN
  ======================================================= */

  dropdown: {
    height: 53,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownActive: {
    borderColor: colors.primary,
  },

  dropdownLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  dropdownText: {
    color: colors.text,
    fontSize: 15,
    marginLeft: 10,
    fontWeight: "600",
  },

  placeholderText: {
    color: colors.muted,
    fontWeight: "400",
  },

  optionsContainer: {
    marginTop: 7,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    overflow: "hidden",
  },

  optionsScroll: {
    maxHeight: 230,
  },

  option: {
    minHeight: 46,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },

  optionSelected: {
    backgroundColor: "#EFF6FF",
  },

  optionText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },

  optionTextSelected: {
    color: colors.primary,
    fontWeight: "800",
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
