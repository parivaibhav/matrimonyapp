import React, { useMemo, useState } from "react";
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

const TABS = [
  {
    key: "basic",
    label: "Basic",
    icon: "person-outline",
  },
  {
    key: "education",
    label: "Career",
    icon: "school-outline",
  },
  {
    key: "family",
    label: "Family",
    icon: "people-outline",
  },
  {
    key: "about",
    label: "About",
    icon: "heart-outline",
  },
];

const EDUCATION_OPTIONS = [
  "10th",
  "12th",
  "Diploma",
  "ITI",
  "B.A.",
  "B.Com.",
  "B.Sc.",
  "BBA",
  "BCA",
  "B.Tech",
  "B.E.",
  "MBBS",
  "BDS",
  "LLB",
  "B.Pharm",
  "M.A.",
  "M.Com.",
  "M.Sc.",
  "MBA",
  "MCA",
  "M.Tech",
  "M.E.",
  "MD",
  "MS",
  "LLM",
  "PhD",
  "Other",
];

const INTEREST_GROUPS = [
  {
    title: "Lifestyle",
    icon: "sparkles-outline",
    items: [
      "Travel",
      "Fitness",
      "Cooking",
      "Photography",
      "Fashion",
      "Shopping",
      "Nature",
      "Yoga",
    ],
  },
  {
    title: "Creative",
    icon: "color-palette-outline",
    items: [
      "Music",
      "Singing",
      "Dancing",
      "Reading",
      "Writing",
      "Painting",
      "Movies",
      "Art",
    ],
  },
  {
    title: "Sports",
    icon: "football-outline",
    items: [
      "Cricket",
      "Football",
      "Badminton",
      "Tennis",
      "Running",
      "Cycling",
      "Swimming",
      "Gym",
    ],
  },
  {
    title: "Personality",
    icon: "people-outline",
    items: [
      "Family",
      "Spirituality",
      "Social Work",
      "Learning",
      "Technology",
      "Business",
      "Volunteering",
      "Meditation",
    ],
  },
];

function calculateAge(dob) {
  if (!dob) return "";

  const birthDate = new Date(dob);

  if (Number.isNaN(birthDate.getTime())) {
    return "";
  }

  const today = new Date();

  let age = today.getFullYear() - birthDate.getFullYear();

  const monthDifference = today.getMonth() - birthDate.getMonth();

  if (
    monthDifference < 0 ||
    (monthDifference === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--;
  }

  return age >= 0 ? age : "";
}

function formatDateForInput(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export default function CompleteProfileScreen({ navigation }) {
  const { isSmallPhone, isTablet } = useResponsiveLayout();

  const [loading, setLoading] = useState(false);
  const [photo, setPhoto] = useState(null);

  const [activeTab, setActiveTab] = useState("basic");

  const [showEducationOptions, setShowEducationOptions] = useState(false);

  const [form, setForm] = useState({
    fullName: "",
    dob: "",
    gender: "Male",
    location: "",
    education: "",
    occupation: "",
    height: "",
    weight: "",
    fatherName: "",
    fatherMobile: "",
    motherName: "",
    interests: [],
  });

  const calculatedAge = useMemo(() => calculateAge(form.dob), [form.dob]);

  function setField(key, value) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  /* =========================================================
     PHOTO
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
     DOB
  ========================================================= */

  function changeDob(value) {
    const cleanValue = value.replace(/[^\d-]/g, "");

    setField("dob", cleanValue);
  }

  function setTodayBasedDob(age) {
    const today = new Date();

    const date = new Date(
      today.getFullYear() - age,
      today.getMonth(),
      today.getDate(),
    );

    setField("dob", formatDateForInput(date));
  }

  /* =========================================================
     INTERESTS
  ========================================================= */

  function toggleInterest(interest) {
    setForm((previous) => {
      const exists = previous.interests.includes(interest);

      if (exists) {
        return {
          ...previous,
          interests: previous.interests.filter((item) => item !== interest),
        };
      }

      return {
        ...previous,
        interests: [...previous.interests, interest],
      };
    });
  }

  /* =========================================================
     VALIDATION
  ========================================================= */

  function validateForm() {
    if (!form.fullName.trim()) {
      setActiveTab("basic");

      Alert.alert("Name required", "Please enter your full name.");

      return false;
    }

    if (!form.dob.trim()) {
      setActiveTab("basic");

      Alert.alert("Date of birth required", "Please enter your date of birth.");

      return false;
    }

    const parsedDob = new Date(form.dob);

    if (Number.isNaN(parsedDob.getTime())) {
      setActiveTab("basic");

      Alert.alert(
        "Invalid date",
        "Please enter your date of birth in YYYY-MM-DD format.",
      );

      return false;
    }

    if (parsedDob > new Date()) {
      setActiveTab("basic");

      Alert.alert("Invalid date", "Date of birth cannot be in the future.");

      return false;
    }

    if (!calculatedAge || calculatedAge < 18) {
      setActiveTab("basic");

      Alert.alert("Age requirement", "You must be at least 18 years old.");

      return false;
    }

    if (!form.gender) {
      setActiveTab("basic");

      Alert.alert("Gender required", "Please select your gender.");

      return false;
    }

    if (!form.location.trim()) {
      setActiveTab("basic");

      Alert.alert("Location required", "Please enter your city or location.");

      return false;
    }

    if (!form.education.trim()) {
      setActiveTab("education");

      Alert.alert("Education required", "Please select your education.");

      return false;
    }

    return true;
  }

  /* =========================================================
     SAVE PROFILE
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

      const cleanInterests = [
        ...new Set(
          form.interests.map((item) => String(item).trim()).filter(Boolean),
        ),
      ];

      const body = {
        fullName: form.fullName.trim(),

        dob: form.dob.trim(),

        gender: form.gender,

        location: form.location.trim(),

        education: form.education.trim(),

        occupation: form.occupation.trim(),

        height: form.height.trim(),

        weight: form.weight.trim(),

        fatherName: form.fatherName.trim(),

        fatherMobile: form.fatherMobile.trim(),

        motherName: form.motherName.trim(),

        interests: cleanInterests,
      };

      console.log("PROFILE UPDATE BODY:", body);

      const response = await api.put("/profile/me", body, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      console.log("PROFILE UPDATE RESPONSE:", response.data);

      let updatedUser = response.data?.user;

      /* =====================================================
         UPLOAD PHOTO SEPARATELY
      ===================================================== */

      if (photo?.uri) {
        try {
          const filename =
            photo.fileName || photo.uri.split("/").pop() || "profile.jpg";

          const type = photo.mimeType || "image/jpeg";

          const photoBody = new FormData();

          photoBody.append("photo", {
            uri: photo.uri,
            name: filename,
            type,
          });

          const photoResponse = await api.post("/profile/me/photo", photoBody, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "multipart/form-data",
            },
          });

          console.log("PHOTO UPLOAD RESPONSE:", photoResponse.data);

          if (photoResponse.data?.user) {
            updatedUser = photoResponse.data.user;
          }
        } catch (photoError) {
          console.log(
            "PHOTO UPLOAD ERROR:",
            photoError?.response?.data || photoError?.message,
          );

          Alert.alert(
            "Profile saved",
            "Your profile was saved, but the profile photo could not be uploaded.",
          );
        }
      }

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

      console.log("COMPLETE PROFILE RESPONSE:", error?.response?.data);

      let message = "Unable to complete your profile.";

      if (error?.response?.data?.message) {
        message = error.response.data.message;
      } else if (error?.message === "Network Error") {
        message = "Cannot connect to the backend server.";
      } else if (error?.message) {
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
    maxLength,
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
          editable={!loading}
          multiline={multiline}
          maxLength={maxLength}
          textAlignVertical={multiline ? "top" : "center"}
        />
      </View>
    );
  }

  /* =========================================================
     HEADER
  ========================================================= */

  function renderHeader() {
    return (
      <>
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Ionicons name="person-outline" size={27} color={colors.primary} />
          </View>

          <Text style={[styles.title, isSmallPhone && styles.smallTitle]}>
            Complete your profile
          </Text>

          <Text style={styles.subtitle}>
            Add a few details to help others know you better.
          </Text>
        </View>

        {renderPhoto()}

        {renderTabs()}
      </>
    );
  }

  /* =========================================================
     PHOTO
  ========================================================= */

  function renderPhoto() {
    return (
      <View style={styles.photoSection}>
        <Pressable
          style={[styles.photoButton, photo?.uri && styles.photoButtonFilled]}
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
                  size={29}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.photoTitle}>Add photo</Text>

              <Text style={styles.photoSubtitle}>Clear profile photo</Text>
            </View>
          )}

          <View style={styles.cameraBadge}>
            <Ionicons name="camera" size={17} color="#fff" />
          </View>
        </Pressable>

        <Text style={styles.photoHint}>
          Your profile photo helps people recognize you
        </Text>
      </View>
    );
  }

  /* =========================================================
     TABS
  ========================================================= */

  function renderTabs() {
    return (
      <View style={styles.tabContainer}>
        {TABS.map((tab) => {
          const selected = activeTab === tab.key;

          return (
            <Pressable
              key={tab.key}
              style={[styles.tab, selected && styles.tabSelected]}
              onPress={() => {
                setActiveTab(tab.key);
                setShowEducationOptions(false);
              }}
              disabled={loading}
            >
              <Ionicons
                name={tab.icon}
                size={18}
                color={selected ? colors.primary : colors.muted}
              />

              <Text
                style={[styles.tabText, selected && styles.tabTextSelected]}
              >
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
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
          <Ionicons name={icon} size={19} color={colors.primary} />
        </View>

        <View style={styles.sectionHeaderText}>
          <Text style={styles.sectionTitle}>{title}</Text>

          <Text style={styles.sectionSubtitle}>{subtitle}</Text>
        </View>
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
                disabled={loading}
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

                {selected && (
                  <Ionicons
                    name="checkmark-circle"
                    size={18}
                    color={colors.primary}
                  />
                )}
              </Pressable>
            );
          })}
        </View>
      </View>
    );
  }

  /* =========================================================
     BASIC TAB
  ========================================================= */

  function renderBasicTab() {
    return (
      <View>
        {renderSectionHeader(
          "person-outline",
          "Personal information",
          "Your basic profile details",
        )}

        {renderInput({
          label: "Full name",
          field: "fullName",
          placeholder: "Enter your full name",
        })}

        {renderGender()}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of birth</Text>

          <TextInput
            style={styles.input}
            placeholder="YYYY-MM-DD"
            placeholderTextColor={colors.muted}
            value={form.dob}
            onChangeText={changeDob}
            keyboardType="numbers-and-punctuation"
            editable={!loading}
            maxLength={10}
          />

          <Text style={styles.inputHint}>Example: 1998-05-24</Text>

          {calculatedAge ? (
            <View style={styles.agePreview}>
              <View style={styles.ageIcon}>
                <Ionicons
                  name="calendar-outline"
                  size={17}
                  color={colors.primary}
                />
              </View>

              <Text style={styles.ageText}>
                You are {calculatedAge} years old
              </Text>
            </View>
          ) : null}

          <View style={styles.ageQuickRow}>
            {[18, 21, 25, 30].map((age) => (
              <Pressable
                key={age}
                style={styles.ageQuickButton}
                onPress={() => setTodayBasedDob(age)}
              >
                <Text style={styles.ageQuickText}>{age} yrs</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {renderInput({
          label: "Location",
          field: "location",
          placeholder: "e.g. Ahmedabad, Gujarat",
        })}

        <View style={styles.infoCard}>
          <Ionicons
            name="information-circle-outline"
            size={19}
            color={colors.primary}
          />

          <Text style={styles.infoText}>
            Age is calculated automatically from your date of birth. You don't
            need to enter your age separately.
          </Text>
        </View>
      </View>
    );
  }

  /* =========================================================
     EDUCATION
  ========================================================= */

  function renderEducationDropdown() {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Education</Text>

        <Pressable
          style={[
            styles.dropdown,
            showEducationOptions && styles.dropdownActive,
          ]}
          onPress={() => setShowEducationOptions((previous) => !previous)}
          disabled={loading}
        >
          <View style={styles.dropdownLeft}>
            <Ionicons name="school-outline" size={19} color={colors.primary} />

            <Text
              style={[
                styles.dropdownText,
                !form.education && styles.placeholderText,
              ]}
            >
              {form.education || "Select education"}
            </Text>
          </View>

          <Ionicons
            name={showEducationOptions ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.muted}
          />
        </Pressable>

        {showEducationOptions && (
          <View style={styles.optionsContainer}>
            <ScrollView
              nestedScrollEnabled
              style={styles.optionsScroll}
              showsVerticalScrollIndicator={false}
            >
              {EDUCATION_OPTIONS.map((option) => {
                const selected = form.education === option;

                return (
                  <Pressable
                    key={option}
                    style={[styles.option, selected && styles.optionSelected]}
                    onPress={() => {
                      setField("education", option);
                      setShowEducationOptions(false);
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
     CAREER TAB
  ========================================================= */

  function renderEducationTab() {
    return (
      <View>
        {renderSectionHeader(
          "school-outline",
          "Education & career",
          "Tell people about your professional background",
        )}

        {renderEducationDropdown()}

        {renderInput({
          label: "Occupation",
          field: "occupation",
          placeholder: "e.g. Software Engineer, Doctor, Business",
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

        <View style={styles.infoCard}>
          <Ionicons name="briefcase-outline" size={19} color={colors.primary} />

          <Text style={styles.infoText}>
            Keep your education and occupation accurate so your profile gives a
            clear picture of your background.
          </Text>
        </View>
      </View>
    );
  }

  /* =========================================================
     FAMILY TAB
  ========================================================= */

  function renderFamilyTab() {
    return (
      <View>
        {renderSectionHeader(
          "people-outline",
          "Family information",
          "A little information about your family",
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
        })}

        {renderInput({
          label: "Mother's name",
          field: "motherName",
          placeholder: "Enter mother's name",
        })}

        <View style={styles.familyInfoCard}>
          <View style={styles.familyInfoIcon}>
            <Ionicons name="home-outline" size={20} color={colors.primary} />
          </View>

          <View style={styles.familyInfoContent}>
            <Text style={styles.familyInfoTitle}>Family details</Text>

            <Text style={styles.familyInfoText}>
              Family information helps create a more complete matrimonial
              profile.
            </Text>
          </View>
        </View>
      </View>
    );
  }

  /* =========================================================
     INTEREST CHIP
  ========================================================= */

  function renderInterestChip(interest) {
    const selected = form.interests.includes(interest);

    return (
      <Pressable
        key={interest}
        style={[styles.interestChip, selected && styles.interestChipSelected]}
        onPress={() => toggleInterest(interest)}
        disabled={loading}
      >
        <Text
          style={[
            styles.interestChipText,
            selected && styles.interestChipTextSelected,
          ]}
        >
          {interest}
        </Text>

        {selected && (
          <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
        )}
      </Pressable>
    );
  }

  /* =========================================================
     ABOUT TAB
  ========================================================= */

  function renderAboutTab() {
    return (
      <View>
        {renderSectionHeader(
          "heart-outline",
          "About you",
          "Show your personality and interests",
        )}

        <View style={styles.bioCard}>
          <View style={styles.bioIcon}>
            <Ionicons
              name="chatbubble-ellipses-outline"
              size={21}
              color={colors.primary}
            />
          </View>

          <View style={styles.bioCardContent}>
            <Text style={styles.bioCardTitle}>Your personality matters</Text>

            <Text style={styles.bioCardText}>
              Select the things you genuinely enjoy. This makes it easier for
              people with similar interests to connect with you.
            </Text>
          </View>
        </View>

        {INTEREST_GROUPS.map((group) => (
          <View key={group.title} style={styles.interestGroup}>
            <View style={styles.interestGroupHeader}>
              <View style={styles.interestGroupIcon}>
                <Ionicons name={group.icon} size={17} color={colors.primary} />
              </View>

              <Text style={styles.interestGroupTitle}>{group.title}</Text>
            </View>

            <View style={styles.chipsWrap}>
              {group.items.map(renderInterestChip)}
            </View>
          </View>
        ))}

        <View style={styles.selectedInterestCard}>
          <View style={styles.selectedInterestHeader}>
            <Text style={styles.selectedInterestTitle}>Selected interests</Text>

            <Text style={styles.selectedInterestCount}>
              {form.interests.length}
            </Text>
          </View>

          {form.interests.length > 0 ? (
            <View style={styles.selectedList}>
              {form.interests.map((interest) => (
                <View key={interest} style={styles.selectedItem}>
                  <Text style={styles.selectedItemText}>{interest}</Text>

                  <Pressable onPress={() => toggleInterest(interest)}>
                    <Ionicons
                      name="close-circle"
                      size={18}
                      color={colors.muted}
                    />
                  </Pressable>
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.noInterestText}>
              No interests selected yet.
            </Text>
          )}
        </View>
      </View>
    );
  }

  /* =========================================================
     TAB CONTENT
  ========================================================= */

  function renderTabContent() {
    if (activeTab === "basic") {
      return renderBasicTab();
    }

    if (activeTab === "education") {
      return renderEducationTab();
    }

    if (activeTab === "family") {
      return renderFamilyTab();
    }

    return renderAboutTab();
  }

  /* =========================================================
     NAVIGATION BUTTONS
  ========================================================= */

  function getCurrentTabIndex() {
    return TABS.findIndex((tab) => tab.key === activeTab);
  }

  function goPrevious() {
    const index = getCurrentTabIndex();

    if (index <= 0) {
      return;
    }

    setShowEducationOptions(false);

    setActiveTab(TABS[index - 1].key);
  }

  function goNext() {
    const index = getCurrentTabIndex();

    if (index < 0 || index >= TABS.length - 1) {
      return;
    }

    if (activeTab === "basic") {
      if (!form.fullName.trim()) {
        Alert.alert("Name required", "Please enter your full name.");
        return;
      }

      if (!form.dob.trim()) {
        Alert.alert(
          "Date of birth required",
          "Please enter your date of birth.",
        );
        return;
      }

      if (!calculatedAge || calculatedAge < 18) {
        Alert.alert("Age requirement", "You must be at least 18 years old.");
        return;
      }

      if (!form.location.trim()) {
        Alert.alert("Location required", "Please enter your city or location.");
        return;
      }
    }

    if (activeTab === "education" && !form.education.trim()) {
      Alert.alert("Education required", "Please select your education.");
      return;
    }

    setShowEducationOptions(false);

    setActiveTab(TABS[index + 1].key);
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
            {renderHeader()}

            <View style={styles.contentCard}>{renderTabContent()}</View>

            {/* =================================================
                TAB NAVIGATION
            ================================================= */}

            <View style={styles.navigationRow}>
              {getCurrentTabIndex() > 0 ? (
                <Pressable
                  style={styles.previousButton}
                  onPress={goPrevious}
                  disabled={loading}
                >
                  <Ionicons name="arrow-back" size={19} color={colors.text} />

                  <Text style={styles.previousButtonText}>Back</Text>
                </Pressable>
              ) : (
                <View style={styles.navigationPlaceholder} />
              )}

              {getCurrentTabIndex() < TABS.length - 1 ? (
                <Pressable
                  style={[styles.nextButton, loading && styles.buttonDisabled]}
                  onPress={goNext}
                  disabled={loading}
                >
                  <Text style={styles.nextButtonText}>Continue</Text>

                  <Ionicons name="arrow-forward" size={19} color="#fff" />
                </Pressable>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.completeButton,
                    loading && styles.buttonDisabled,
                    pressed && !loading && styles.buttonPressed,
                  ]}
                  onPress={completeProfile}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <Ionicons name="sync-outline" size={20} color="#fff" />

                      <Text style={styles.completeButtonText}>Saving...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.completeButtonText}>
                        Complete Profile
                      </Text>

                      <Ionicons
                        name="checkmark-circle-outline"
                        size={20}
                        color="#fff"
                      />
                    </>
                  )}
                </Pressable>
              )}
            </View>

            <View style={styles.progressContainer}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        ((getCurrentTabIndex() + 1) / TABS.length) * 100
                      }%`,
                    },
                  ]}
                />
              </View>

              <Text style={styles.progressText}>
                Step {getCurrentTabIndex() + 1} of {TABS.length}
              </Text>
            </View>

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
    paddingHorizontal: 14,
  },

  card: {
    width: "100%",
    maxWidth: 680,
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
    marginBottom: 22,
  },

  headerIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
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
    maxWidth: 450,
    marginTop: 7,
  },

  /* =======================================================
     PHOTO
  ======================================================= */

  photoSection: {
    alignItems: "center",
    marginBottom: 24,
  },

  photoButton: {
    width: 145,
    height: 145,
    borderRadius: 73,
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  photoButtonFilled: {
    borderStyle: "solid",
    borderColor: "#E2E8F0",
  },

  profileImage: {
    width: "100%",
    height: "100%",
    borderRadius: 73,
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
  },

  photoSubtitle: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 3,
  },

  cameraBadge: {
    position: "absolute",
    right: -2,
    bottom: 3,
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
  },

  photoHint: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 9,
  },

  /* =======================================================
     TABS
  ======================================================= */

  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 17,
    padding: 4,
    marginBottom: 24,
  },

  tab: {
    flex: 1,
    minHeight: 48,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  tabSelected: {
    backgroundColor: "#fff",
    ...shadow,
  },

  tabText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.muted,
  },

  tabTextSelected: {
    color: colors.primary,
    fontWeight: "900",
  },

  /* =======================================================
     CONTENT
  ======================================================= */

  contentCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },

  /* =======================================================
     SECTION
  ======================================================= */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 22,
  },

  sectionIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },

  sectionHeaderText: {
    flex: 1,
  },

  sectionTitle: {
    fontSize: 17,
    fontWeight: "900",
    color: colors.text,
  },

  sectionSubtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 3,
  },

  /* =======================================================
     INPUT
  ======================================================= */

  inputGroup: {
    marginBottom: 18,
  },

  label: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 8,
  },

  input: {
    height: 53,
    backgroundColor: "#F8FAFC",
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

  inputHint: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 6,
  },

  /* =======================================================
     GENDER
  ======================================================= */

  genderRow: {
    flexDirection: "row",
    gap: 10,
  },

  genderButton: {
    flex: 1,
    minHeight: 53,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  genderButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: "#EFF6FF",
  },

  genderText: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
  },

  genderTextSelected: {
    color: colors.primary,
    fontWeight: "900",
  },

  /* =======================================================
     AGE
  ======================================================= */

  agePreview: {
    marginTop: 10,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 12,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
  },

  ageIcon: {
    width: 29,
    height: 29,
    borderRadius: 10,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 9,
  },

  ageText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: "800",
  },

  ageQuickRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 9,
  },

  ageQuickButton: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 10,
  },

  ageQuickText: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.muted,
  },

  /* =======================================================
     INFO
  ======================================================= */

  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#F8FAFC",
    borderRadius: 14,
    padding: 13,
    marginTop: 3,
    borderWidth: 1,
    borderColor: "#EEF2F7",
  },

  infoText: {
    flex: 1,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginLeft: 9,
  },

  /* =======================================================
     DROPDOWN
  ======================================================= */

  dropdown: {
    minHeight: 53,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownActive: {
    borderColor: colors.primary,
    backgroundColor: "#fff",
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
    maxHeight: 240,
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
     FAMILY
  ======================================================= */

  familyInfoCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 15,
    flexDirection: "row",
    borderWidth: 1,
    borderColor: "#EEF2F7",
    marginTop: 4,
  },

  familyInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  familyInfoContent: {
    flex: 1,
  },

  familyInfoTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.text,
  },

  familyInfoText: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 17,
    marginTop: 3,
  },

  /* =======================================================
     BIO
  ======================================================= */

  bioCard: {
    flexDirection: "row",
    backgroundColor: "#EFF6FF",
    borderRadius: 16,
    padding: 14,
    marginBottom: 20,
  },

  bioIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  bioCardContent: {
    flex: 1,
  },

  bioCardTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.text,
  },

  bioCardText: {
    fontSize: 11,
    color: colors.muted,
    lineHeight: 17,
    marginTop: 3,
  },

  /* =======================================================
     INTEREST GROUP
  ======================================================= */

  interestGroup: {
    marginBottom: 20,
  },

  interestGroupHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },

  interestGroupIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  interestGroupTitle: {
    fontSize: 14,
    fontWeight: "900",
    color: colors.text,
  },

  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  interestChip: {
    minHeight: 38,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  interestChipSelected: {
    backgroundColor: "#EFF6FF",
    borderColor: colors.primary,
  },

  interestChipText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },

  interestChipTextSelected: {
    color: colors.primary,
    fontWeight: "900",
  },

  /* =======================================================
     SELECTED INTERESTS
  ======================================================= */

  selectedInterestCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: "#EEF2F7",
    marginTop: 3,
  },

  selectedInterestHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  selectedInterestTitle: {
    fontSize: 13,
    fontWeight: "900",
    color: colors.text,
  },

  selectedInterestCount: {
    minWidth: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: colors.primary,
    color: "#fff",
    textAlign: "center",
    lineHeight: 25,
    fontSize: 11,
    fontWeight: "900",
  },

  selectedList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  selectedItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingLeft: 10,
    paddingRight: 7,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: colors.border,
  },

  selectedItemText: {
    color: colors.text,
    fontSize: 11,
    fontWeight: "700",
    marginRight: 5,
  },

  noInterestText: {
    color: colors.muted,
    fontSize: 11,
  },

  /* =======================================================
     NAVIGATION
  ======================================================= */

  navigationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 20,
  },

  navigationPlaceholder: {
    flex: 1,
  },

  previousButton: {
    flex: 0.35,
    minHeight: 55,
    borderRadius: 15,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
  },

  previousButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },

  nextButton: {
    flex: 1,
    minHeight: 55,
    borderRadius: 15,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  nextButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },

  completeButton: {
    flex: 1,
    minHeight: 55,
    borderRadius: 15,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },

  completeButtonText: {
    color: "#fff",
    fontSize: 15,
    fontWeight: "900",
  },

  buttonDisabled: {
    opacity: 0.6,
  },

  buttonPressed: {
    opacity: 0.86,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  /* =======================================================
     PROGRESS
  ======================================================= */

  progressContainer: {
    marginTop: 18,
    alignItems: "center",
  },

  progressTrack: {
    width: "100%",
    height: 5,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    backgroundColor: colors.primary,
    borderRadius: 3,
  },

  progressText: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 7,
  },

  /* =======================================================
     FOOTER
  ======================================================= */

  bottomText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 15,
    paddingHorizontal: 20,
  },
});
