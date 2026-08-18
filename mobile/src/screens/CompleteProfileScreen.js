import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
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
import { useNavigation } from "@react-navigation/native";

/* =========================================================
   EDUCATION OPTIONS
   Must match backend exactly
========================================================= */

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

/* =========================================================
   INTERESTS
========================================================= */

const INTEREST_CATEGORIES = {
  Lifestyle: [
    "Travel",
    "Music",
    "Reading",
    "Cooking",
    "Photography",
    "Movies",
    "Shopping",
    "Food",
  ],

  Fitness: [
    "Gym",
    "Yoga",
    "Running",
    "Cricket",
    "Football",
    "Badminton",
    "Swimming",
    "Cycling",
  ],

  Creative: [
    "Art",
    "Writing",
    "Dancing",
    "Singing",
    "Drawing",
    "Design",
    "Crafts",
    "Fashion",
  ],

  Spiritual: [
    "Meditation",
    "Spirituality",
    "Temple Visits",
    "Yoga",
    "Volunteering",
    "Charity",
    "Reading",
    "Nature",
  ],

  Social: [
    "Friends",
    "Events",
    "Networking",
    "Community",
    "Parties",
    "Food",
    "Movies",
    "Travel",
  ],
};

const INTEREST_TABS = Object.keys(INTEREST_CATEGORIES);

/* =========================================================
   PROFILE TABS
========================================================= */

const PROFILE_TABS = [
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
    key: "interests",
    label: "Interests",
    icon: "heart-outline",
  },
];

/* =========================================================
   DATE HELPERS
========================================================= */

function parseDob(dateString) {
  if (!dateString) {
    return null;
  }

  const parts = dateString.split("/");

  if (parts.length !== 3) {
    return null;
  }

  const day = Number(parts[0]);
  const month = Number(parts[1]);
  const year = Number(parts[2]);

  if (
    !Number.isInteger(day) ||
    !Number.isInteger(month) ||
    !Number.isInteger(year)
  ) {
    return null;
  }

  if (day < 1 || day > 31 || month < 1 || month > 12 || year < 1900) {
    return null;
  }

  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    return null;
  }

  return {
    day,
    month,
    year,
    date,
  };
}

function calculateAge(dateString) {
  const parsed = parseDob(dateString);

  if (!parsed) {
    return null;
  }

  const today = new Date();

  let age = today.getFullYear() - parsed.year;

  const birthdayThisYear = new Date(
    today.getFullYear(),
    parsed.month - 1,
    parsed.day,
  );

  if (today < birthdayThisYear) {
    age--;
  }

  return age;
}

function dobToISO(dateString) {
  const parsed = parseDob(dateString);

  if (!parsed) {
    return null;
  }

  /*
   * Use UTC so the DOB does not shift because of
   * the device timezone.
   */

  return parsed.date.toISOString();
}

async function handleLogout() {
  try {
    await AsyncStorage.removeItem("token");
    await AsyncStorage.removeItem("user");

    navigation.replace("Login");
  } catch (error) {
    console.log("LOGOUT ERROR:", error);

    Alert.alert("Logout failed", "Unable to logout. Please try again.");
  }
}
/* =========================================================
   COMPONENT
========================================================= */

export default function CompleteProfileScreen({ navigation }) {
  const { isSmallPhone, isTablet } = useResponsiveLayout();

  const [loading, setLoading] = useState(false);

  const [photo, setPhoto] = useState(null);

  const [activeTab, setActiveTab] = useState("basic");

  const [activeInterestTab, setActiveInterestTab] = useState("Lifestyle");

  const [educationModalVisible, setEducationModalVisible] = useState(false);

  const [educationSearch, setEducationSearch] = useState("");

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

  /* =========================================================
     FORM HELPERS
  ========================================================= */

  function setField(key, value) {
    setForm((previous) => ({
      ...previous,
      [key]: value,
    }));
  }

  const calculatedAge = useMemo(() => {
    return calculateAge(form.dob);
  }, [form.dob]);

  /* =========================================================
     DOB INPUT
  ========================================================= */

  function handleDobChange(value) {
    let cleaned = value.replace(/\D/g, "");

    if (cleaned.length > 8) {
      cleaned = cleaned.substring(0, 8);
    }

    let formatted = cleaned;

    if (cleaned.length > 4) {
      formatted =
        cleaned.substring(0, 2) +
        "/" +
        cleaned.substring(2, 4) +
        "/" +
        cleaned.substring(4);
    } else if (cleaned.length > 2) {
      formatted = cleaned.substring(0, 2) + "/" + cleaned.substring(2);
    }

    setField("dob", formatted);
  }

  /* =========================================================
     PHOTO PICKER
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

  function removeSelectedPhoto() {
    Alert.alert("Remove photo?", "The selected photo will be removed.", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => setPhoto(null),
      },
    ]);
  }

  /* =========================================================
     EDUCATION
  ========================================================= */

  const filteredEducationOptions = useMemo(() => {
    const search = educationSearch.trim().toLowerCase();

    if (!search) {
      return EDUCATION_OPTIONS;
    }

    return EDUCATION_OPTIONS.filter((item) =>
      item.toLowerCase().includes(search),
    );
  }, [educationSearch]);

  function openEducationPicker() {
    setEducationSearch("");
    setEducationModalVisible(true);
  }

  function selectEducation(value) {
    setField("education", value);
    setEducationModalVisible(false);
    setEducationSearch("");
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
    const fullName = form.fullName.trim();

    if (!fullName) {
      Alert.alert("Name required", "Please enter your full name.");

      setActiveTab("basic");

      return false;
    }

    if (!form.gender) {
      Alert.alert("Gender required", "Please select your gender.");

      setActiveTab("basic");

      return false;
    }

    if (!form.dob.trim()) {
      Alert.alert("Date of birth required", "Please enter your date of birth.");

      setActiveTab("basic");

      return false;
    }

    const parsedDob = parseDob(form.dob);

    if (!parsedDob) {
      Alert.alert(
        "Invalid date of birth",
        "Please enter your DOB in DD/MM/YYYY format.",
      );

      setActiveTab("basic");

      return false;
    }

    const age = calculateAge(form.dob);

    if (age === null) {
      Alert.alert("Invalid date of birth", "Please enter a valid date.");

      setActiveTab("basic");

      return false;
    }

    if (age < 18) {
      Alert.alert("Age requirement", "You must be at least 18 years old.");

      setActiveTab("basic");

      return false;
    }

    if (age > 100) {
      Alert.alert("Invalid age", "Please enter a valid date of birth.");

      setActiveTab("basic");

      return false;
    }

    if (!form.location.trim()) {
      Alert.alert("Location required", "Please enter your location.");

      setActiveTab("basic");

      return false;
    }

    if (!form.education.trim()) {
      Alert.alert(
        "Education required",
        "Please select your highest education.",
      );

      setActiveTab("education");

      return false;
    }

    if (!EDUCATION_OPTIONS.includes(form.education.trim())) {
      Alert.alert(
        "Invalid education",
        "Please select an education option from the list.",
      );

      setActiveTab("education");

      return false;
    }

    if (!form.occupation.trim()) {
      Alert.alert("Occupation required", "Please enter your occupation.");

      setActiveTab("education");

      return false;
    }

    if (!form.interests.length) {
      Alert.alert("Interests required", "Please select at least one interest.");

      setActiveTab("interests");

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

      const dobISO = dobToISO(form.dob);

      if (!dobISO) {
        Alert.alert("Invalid DOB", "Please enter a valid date of birth.");

        return;
      }

      /* =====================================================
         1. UPDATE PROFILE
      ===================================================== */

      const profilePayload = {
        fullName: form.fullName.trim(),

        dob: dobISO,

        gender: form.gender,

        location: form.location.trim(),

        education: form.education.trim(),

        occupation: form.occupation.trim(),

        height: form.height.trim(),

        weight: form.weight.trim(),

        fatherName: form.fatherName.trim(),

        fatherMobile: form.fatherMobile.trim(),

        motherName: form.motherName.trim(),

        interests: form.interests,
      };

      console.log("PROFILE UPDATE PAYLOAD:", profilePayload);

      const profileResponse = await api.put("/profiles/me", profilePayload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      let updatedUser = profileResponse.data?.user;

      console.log("PROFILE UPDATE RESPONSE:", profileResponse.data);

      /* =====================================================
         2. UPLOAD PHOTO
      ===================================================== */

      if (photo?.uri) {
        try {
          const photoBody = new FormData();

          const filename =
            photo.fileName ||
            photo.uri.split("/").pop() ||
            `profile-${Date.now()}.jpg`;

          const type = photo.mimeType || "image/jpeg";

          photoBody.append("photo", {
            uri: photo.uri,
            name: filename,
            type,
          });

          console.log("UPLOADING PROFILE PHOTO:", {
            uri: photo.uri,
            name: filename,
            type,
          });

          const photoResponse = await api.post(
            "/profiles/me/photo",
            photoBody,
            {
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "multipart/form-data",
              },
            },
          );

          console.log("PHOTO UPLOAD RESPONSE:", photoResponse.data);

          if (photoResponse.data?.user) {
            updatedUser = photoResponse.data.user;
          }
        } catch (photoError) {
          console.log("PROFILE PHOTO UPLOAD ERROR:", photoError);

          console.log("PROFILE PHOTO RESPONSE:", photoError.response?.data);

          if (updatedUser) {
            await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
          }

          Alert.alert(
            "Profile saved",
            "Your profile details were saved, but the profile photo could not be uploaded. You can add it later from profile settings.",
            [
              {
                text: "Continue",
                onPress: () => {
                  navigation.replace("Home");
                },
              },
            ],
          );

          return;
        }
      }

      /* =====================================================
         3. SAVE UPDATED USER LOCALLY
      ===================================================== */

      if (updatedUser) {
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
      }

      /* =====================================================
         4. SUCCESS
      ===================================================== */

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
        message =
          "Cannot connect to the backend server. Please check that your backend is running and your API URL is correct.";
      } else if (error.message) {
        message = error.message;
      }

      Alert.alert("Profile update failed", message);
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
     GENERIC INPUT
  ========================================================= */

  function renderInput({
    label,
    field,
    placeholder,
    keyboardType = "default",
  }) {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>{label}</Text>

        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={colors.muted}
          value={form[field]}
          onChangeText={(value) => setField(field, value)}
          keyboardType={keyboardType}
          autoCapitalize={keyboardType === "phone-pad" ? "none" : "sentences"}
          editable={!loading}
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
                disabled={loading}
              >
                <View
                  style={[
                    styles.genderIcon,
                    selected && styles.genderIconSelected,
                  ]}
                >
                  <Ionicons
                    name={gender === "Male" ? "male-outline" : "female-outline"}
                    size={18}
                    color={selected ? colors.primary : colors.muted}
                  />
                </View>

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
                    size={19}
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
     DOB
  ========================================================= */

  function renderDob() {
    const valid = calculatedAge !== null;

    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Date of birth</Text>

        <View
          style={[styles.dobInputWrapper, valid && styles.dobInputWrapperValid]}
        >
          <View style={styles.dobIcon}>
            <Ionicons
              name="calendar-outline"
              size={19}
              color={colors.primary}
            />
          </View>

          <TextInput
            style={styles.dobInput}
            placeholder="DD/MM/YYYY"
            placeholderTextColor={colors.muted}
            value={form.dob}
            onChangeText={handleDobChange}
            keyboardType="numeric"
            maxLength={10}
            editable={!loading}
          />

          {valid && (
            <View style={styles.ageBadge}>
              <Text style={styles.ageBadgeText}>{calculatedAge} years</Text>
            </View>
          )}
        </View>

        <Text style={styles.helperText}>
          Enter your date of birth in DD/MM/YYYY format.
        </Text>
      </View>
    );
  }

  /* =========================================================
     EDUCATION PICKER
  ========================================================= */

  function renderEducationPicker() {
    return (
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Highest education</Text>

        <Pressable
          style={[
            styles.selectButton,
            form.education && styles.selectButtonSelected,
          ]}
          onPress={openEducationPicker}
          disabled={loading}
        >
          <View style={styles.selectLeft}>
            <View
              style={[
                styles.selectIcon,
                form.education && styles.selectIconSelected,
              ]}
            >
              <Ionicons
                name="school-outline"
                size={19}
                color={form.education ? colors.primary : colors.muted}
              />
            </View>

            <View style={styles.selectTextWrap}>
              <Text
                style={[
                  styles.selectValue,
                  !form.education && styles.selectPlaceholder,
                ]}
              >
                {form.education || "Select your education"}
              </Text>

              {form.education && (
                <Text style={styles.selectHint}>Tap to change</Text>
              )}
            </View>
          </View>

          <Ionicons name="chevron-down" size={20} color={colors.muted} />
        </Pressable>
      </View>
    );
  }

  /* =========================================================
     PHOTO
  ========================================================= */

  function renderPhoto() {
    return (
      <View style={styles.photoSection}>
        <View style={styles.photoWrapper}>
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

                <Text style={styles.photoTitle}>Add photo</Text>

                <Text style={styles.photoSubtitle}>Clear face photo</Text>
              </View>
            )}
          </Pressable>

          <Pressable
            style={styles.cameraBadge}
            onPress={choosePhoto}
            disabled={loading}
          >
            <Ionicons
              name={photo?.uri ? "camera" : "add"}
              size={19}
              color="#fff"
            />
          </Pressable>

          {photo?.uri && (
            <Pressable
              style={styles.removePhotoButton}
              onPress={removeSelectedPhoto}
              disabled={loading}
            >
              <Ionicons name="close" size={16} color="#fff" />
            </Pressable>
          )}
        </View>

        <Text style={styles.photoTitleBelow}>
          {photo?.uri ? "Profile photo selected" : "Add a profile photo"}
        </Text>

        <Text style={styles.changePhotoText}>
          {photo?.uri
            ? "Tap the camera to change"
            : "You can add or change it later"}
        </Text>
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
     BASIC TAB
  ========================================================= */

  function renderBasicTab() {
    return (
      <View>
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

        {renderDob()}

        {renderInput({
          label: "Location",
          field: "location",
          placeholder: "Enter your city or location",
        })}

        <Pressable onPress={handleLogout}>
          <Text>Logout</Text>
        </Pressable>

        <View style={styles.ageInfoCard}>
          <View style={styles.ageInfoIcon}>
            <Ionicons name="time-outline" size={20} color={colors.primary} />
          </View>

          <View style={styles.ageInfoContent}>
            <Text style={styles.ageInfoTitle}>Your age</Text>

            <Text style={styles.ageInfoValue}>
              {calculatedAge !== null
                ? `${calculatedAge} years old`
                : "Enter your DOB"}
            </Text>
          </View>

          {calculatedAge !== null && (
            <Ionicons
              name="checkmark-circle"
              size={22}
              color={colors.primary}
            />
          )}
        </View>
      </View>
    );
  }

  /* =========================================================
     EDUCATION TAB
  ========================================================= */

  function renderEducationTab() {
    return (
      <View>
        {renderSectionHeader(
          "school-outline",
          "Education & career",
          "Tell others about your professional background",
        )}

        {renderEducationPicker()}

        {renderInput({
          label: "Occupation",
          field: "occupation",
          placeholder: "e.g. Software Engineer",
        })}

        {renderSectionHeader(
          "body-outline",
          "Physical information",
          "Basic appearance details",
        )}

        <View style={styles.twoColumnRow}>
          <View style={styles.twoColumnItem}>
            {renderInput({
              label: "Height",
              field: "height",
              placeholder: `e.g. 5'8"`,
            })}
          </View>

          <View style={styles.twoColumnItem}>
            {renderInput({
              label: "Weight",
              field: "weight",
              placeholder: "e.g. 65 kg",
            })}
          </View>
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
          "A few details about your family",
        )}

        {renderInput({
          label: "Father's name",
          field: "fatherName",
          placeholder: "Enter father's name",
        })}

        {renderInput({
          label: "Father's mobile",
          field: "fatherMobile",
          placeholder: "Enter father's mobile",
          keyboardType: "phone-pad",
        })}

        {renderInput({
          label: "Mother's name",
          field: "motherName",
          placeholder: "Enter mother's name",
        })}

        <View style={styles.familyNote}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.primary}
          />

          <Text style={styles.familyNoteText}>
            Family information helps potential matches understand your family
            background.
          </Text>
        </View>
      </View>
    );
  }

  /* =========================================================
     INTEREST TAB
  ========================================================= */

  function renderInterestTab() {
    const interests = INTEREST_CATEGORIES[activeInterestTab];

    return (
      <View>
        {renderSectionHeader(
          "heart-outline",
          "Your interests",
          "Select multiple things you enjoy",
        )}

        <View style={styles.selectedInterestCard}>
          <View style={styles.selectedInterestTop}>
            <Text style={styles.selectedInterestTitle}>Selected interests</Text>

            <View style={styles.selectedCount}>
              <Text style={styles.selectedCountText}>
                {form.interests.length}
              </Text>
            </View>
          </View>

          {form.interests.length > 0 ? (
            <View style={styles.selectedInterestWrap}>
              {form.interests.map((interest) => (
                <Pressable
                  key={interest}
                  style={styles.selectedChip}
                  onPress={() => toggleInterest(interest)}
                  disabled={loading}
                >
                  <Text style={styles.selectedChipText}>{interest}</Text>

                  <Ionicons
                    name="close-circle"
                    size={17}
                    color={colors.primary}
                  />
                </Pressable>
              ))}
            </View>
          ) : (
            <Text style={styles.noInterestText}>Select interests below</Text>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.interestTabsContent}
          style={styles.interestTabs}
        >
          {INTEREST_TABS.map((tab) => {
            const selected = activeInterestTab === tab;

            return (
              <Pressable
                key={tab}
                onPress={() => setActiveInterestTab(tab)}
                style={[
                  styles.interestTab,
                  selected && styles.interestTabSelected,
                ]}
                disabled={loading}
              >
                <Text
                  style={[
                    styles.interestTabText,
                    selected && styles.interestTabTextSelected,
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.interestGrid}>
          {interests.map((interest) => {
            const selected = form.interests.includes(interest);

            return (
              <Pressable
                key={interest}
                onPress={() => toggleInterest(interest)}
                style={[
                  styles.interestCard,
                  selected && styles.interestCardSelected,
                ]}
                disabled={loading}
              >
                <View
                  style={[
                    styles.interestIcon,
                    selected && styles.interestIconSelected,
                  ]}
                >
                  <Ionicons
                    name={selected ? "checkmark" : "add"}
                    size={17}
                    color={selected ? "#fff" : colors.primary}
                  />
                </View>

                <Text
                  style={[
                    styles.interestText,
                    selected && styles.interestTextSelected,
                  ]}
                >
                  {interest}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.interestHint}>
          You can select as many interests as you want.
        </Text>
      </View>
    );
  }

  /* =========================================================
     ACTIVE TAB
  ========================================================= */

  function renderActiveTab() {
    switch (activeTab) {
      case "education":
        return renderEducationTab();

      case "family":
        return renderFamilyTab();

      case "interests":
        return renderInterestTab();

      case "basic":
      default:
        return renderBasicTab();
    }
  }

  /* =========================================================
     PROFILE TABS
  ========================================================= */

  function renderProfileTabs() {
    return (
      <View style={styles.profileTabs}>
        {PROFILE_TABS.map((tab) => {
          const selected = activeTab === tab.key;

          return (
            <Pressable
              key={tab.key}
              onPress={() => setActiveTab(tab.key)}
              style={[styles.profileTab, selected && styles.profileTabSelected]}
              disabled={loading}
            >
              <Ionicons
                name={tab.icon}
                size={19}
                color={selected ? colors.primary : colors.muted}
              />

              <Text
                style={[
                  styles.profileTabText,
                  selected && styles.profileTabTextSelected,
                ]}
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
     NAVIGATION
  ========================================================= */

  function goNext() {
    const currentIndex = PROFILE_TABS.findIndex(
      (item) => item.key === activeTab,
    );

    if (currentIndex < PROFILE_TABS.length - 1) {
      setActiveTab(PROFILE_TABS[currentIndex + 1].key);
    }
  }

  function goPrevious() {
    const currentIndex = PROFILE_TABS.findIndex(
      (item) => item.key === activeTab,
    );

    if (currentIndex > 0) {
      setActiveTab(PROFILE_TABS[currentIndex - 1].key);
    }
  }

  const currentTabIndex = PROFILE_TABS.findIndex(
    (item) => item.key === activeTab,
  );

  const isLastTab = currentTabIndex === PROFILE_TABS.length - 1;

  const isFirstTab = currentTabIndex === 0;

  /* =========================================================
     EDUCATION MODAL
  ========================================================= */

  function renderEducationModal() {
    return (
      <Modal
        visible={educationModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setEducationModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.educationModal,
              isTablet && styles.educationModalTablet,
            ]}
          >
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Select education</Text>

                <Text style={styles.modalSubtitle}>
                  Choose your highest qualification
                </Text>
              </View>

              <Pressable
                style={styles.modalCloseButton}
                onPress={() => setEducationModalVisible(false)}
              >
                <Ionicons name="close" size={21} color={colors.text} />
              </Pressable>
            </View>

            <View style={styles.educationSearchWrapper}>
              <Ionicons name="search-outline" size={19} color={colors.muted} />

              <TextInput
                style={styles.educationSearchInput}
                placeholder="Search education..."
                placeholderTextColor={colors.muted}
                value={educationSearch}
                onChangeText={setEducationSearch}
                autoCapitalize="none"
                editable={!loading}
              />

              {educationSearch.length > 0 && (
                <Pressable onPress={() => setEducationSearch("")}>
                  <Ionicons
                    name="close-circle"
                    size={18}
                    color={colors.muted}
                  />
                </Pressable>
              )}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.educationList}
            >
              {filteredEducationOptions.map((option) => {
                const selected = form.education === option;

                return (
                  <Pressable
                    key={option}
                    style={[
                      styles.educationOption,
                      selected && styles.educationOptionSelected,
                    ]}
                    onPress={() => selectEducation(option)}
                    disabled={loading}
                  >
                    <View
                      style={[
                        styles.educationOptionIcon,
                        selected && styles.educationOptionIconSelected,
                      ]}
                    >
                      <Ionicons
                        name="school-outline"
                        size={18}
                        color={selected ? colors.primary : colors.muted}
                      />
                    </View>

                    <Text
                      style={[
                        styles.educationOptionText,
                        selected && styles.educationOptionTextSelected,
                      ]}
                    >
                      {option}
                    </Text>

                    {selected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={21}
                        color={colors.primary}
                      />
                    )}
                  </Pressable>
                );
              })}

              {!filteredEducationOptions.length && (
                <View style={styles.noEducation}>
                  <Ionicons
                    name="search-outline"
                    size={30}
                    color={colors.muted}
                  />

                  <Text style={styles.noEducationTitle}>
                    No education found
                  </Text>

                  <Text style={styles.noEducationText}>
                    Try another search.
                  </Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
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
                Create a profile that helps you find meaningful connections.
              </Text>
            </View>

            {/* PHOTO */}

            {renderPhoto()}

            {/* TABS */}

            {renderProfileTabs()}

            {/* CONTENT */}

            <View style={styles.tabContent}>{renderActiveTab()}</View>

            {/* NAVIGATION */}

            <View style={styles.navigationRow}>
              {!isFirstTab ? (
                <Pressable
                  style={[styles.backButton, loading && styles.disabledButton]}
                  onPress={goPrevious}
                  disabled={loading}
                >
                  <Ionicons name="arrow-back" size={19} color={colors.text} />

                  <Text style={styles.backButtonText}>Back</Text>
                </Pressable>
              ) : (
                <View style={styles.navigationSpacer} />
              )}

              {!isLastTab ? (
                <Pressable
                  style={[styles.nextButton, loading && styles.disabledButton]}
                  onPress={goNext}
                  disabled={loading}
                >
                  <Text style={styles.nextButtonText}>Continue</Text>

                  <Ionicons name="arrow-forward" size={19} color="#fff" />
                </Pressable>
              ) : (
                <Pressable
                  style={({ pressed }) => [
                    styles.nextButton,
                    loading && styles.disabledButton,
                    pressed && !loading && styles.buttonPressed,
                  ]}
                  onPress={completeProfile}
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <ActivityIndicator size="small" color="#fff" />

                      <Text style={styles.nextButtonText}>Saving...</Text>
                    </>
                  ) : (
                    <>
                      <Text style={styles.nextButtonText}>
                        Complete Profile
                      </Text>

                      <Ionicons name="checkmark" size={20} color="#fff" />
                    </>
                  )}
                </Pressable>
              )}
            </View>

            {/* PROGRESS */}

            <View style={styles.progressArea}>
              <View style={styles.progressTrack}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      width: `${
                        ((currentTabIndex + 1) / PROFILE_TABS.length) * 100
                      }%`,
                    },
                  ]}
                />
              </View>

              <Text style={styles.progressText}>
                Step {currentTabIndex + 1} of {PROFILE_TABS.length}
              </Text>
            </View>

            <Text style={styles.bottomText}>
              You can update your profile details later from your profile
              settings.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {renderEducationModal()}
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
    paddingHorizontal: 15,
  },

  card: {
    width: "100%",
    maxWidth: 700,
    alignSelf: "center",
  },

  tabletCard: {
    backgroundColor: "#fff",
    padding: 34,
    borderRadius: 28,
    ...shadow,
  },

  /* HEADER */

  header: {
    alignItems: "center",
    marginBottom: 25,
  },

  headerIcon: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
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
    marginTop: 8,
  },

  /* PHOTO */

  photoSection: {
    alignItems: "center",
    marginBottom: 25,
  },

  photoWrapper: {
    width: 150,
    height: 150,
    position: "relative",
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
    overflow: "hidden",
  },

  profileImage: {
    width: "100%",
    height: "100%",
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

  photoTitleBelow: {
    color: colors.text,
    fontSize: 12,
    fontWeight: "800",
    marginTop: 9,
  },

  cameraBadge: {
    position: "absolute",
    right: 2,
    bottom: 8,
    width: 39,
    height: 39,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#fff",
    ...shadow,
  },

  removePhotoButton: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#fff",
    ...shadow,
  },

  changePhotoText: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 4,
  },

  /* PROFILE TABS */

  profileTabs: {
    flexDirection: "row",
    backgroundColor: "#F1F5F9",
    borderRadius: 16,
    padding: 4,
    marginBottom: 24,
  },

  profileTab: {
    flex: 1,
    minHeight: 50,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 6,
  },

  profileTabSelected: {
    backgroundColor: "#fff",
    ...shadow,
  },

  profileTabText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "700",
  },

  profileTabTextSelected: {
    color: colors.primary,
    fontWeight: "900",
  },

  tabContent: {
    minHeight: 390,
  },

  /* SECTION */

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    marginBottom: 18,
  },

  sectionIcon: {
    width: 39,
    height: 39,
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

  /* INPUT */

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

  /* GENDER */

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
    gap: 7,
  },

  genderButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: "#EFF6FF",
  },

  genderIcon: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
  },

  genderIconSelected: {
    backgroundColor: "#DBEAFE",
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

  /* DOB */

  dobInputWrapper: {
    height: 53,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 10,
    flexDirection: "row",
    alignItems: "center",
  },

  dobInputWrapperValid: {
    borderColor: colors.primary,
  },

  dobIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  dobInput: {
    flex: 1,
    height: 53,
    paddingHorizontal: 10,
    fontSize: 15,
    color: colors.text,
  },

  ageBadge: {
    backgroundColor: "#EFF6FF",
    borderRadius: 10,
    paddingHorizontal: 9,
    paddingVertical: 6,
  },

  ageBadgeText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "900",
  },

  helperText: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 7,
    lineHeight: 16,
  },

  /* AGE CARD */

  ageInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    padding: 14,
    marginTop: 2,
    marginBottom: 20,
  },

  ageInfoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  ageInfoContent: {
    flex: 1,
  },

  ageInfoTitle: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "700",
  },

  ageInfoValue: {
    fontSize: 15,
    color: colors.text,
    fontWeight: "900",
    marginTop: 2,
  },

  /* EDUCATION SELECT */

  selectButton: {
    minHeight: 65,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  selectButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: "#FCFEFF",
  },

  selectLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  selectIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  selectIconSelected: {
    backgroundColor: "#EFF6FF",
  },

  selectTextWrap: {
    flex: 1,
  },

  selectValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },

  selectPlaceholder: {
    color: colors.muted,
    fontWeight: "600",
  },

  selectHint: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 2,
  },

  /* PHYSICAL */

  twoColumnRow: {
    flexDirection: "row",
    gap: 12,
  },

  twoColumnItem: {
    flex: 1,
  },

  /* FAMILY */

  familyNote: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#EFF6FF",
    borderRadius: 14,
    padding: 14,
    marginTop: 2,
  },

  familyNoteText: {
    flex: 1,
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginLeft: 9,
  },

  /* INTERESTS */

  selectedInterestCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 14,
    marginBottom: 15,
  },

  selectedInterestTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  selectedInterestTitle: {
    color: colors.text,
    fontSize: 13,
    fontWeight: "900",
  },

  selectedCount: {
    minWidth: 25,
    height: 25,
    borderRadius: 13,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 7,
  },

  selectedCountText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "900",
  },

  selectedInterestWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 7,
  },

  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#EFF6FF",
    borderWidth: 1,
    borderColor: "#BFDBFE",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },

  selectedChipText: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: "800",
  },

  noInterestText: {
    color: colors.muted,
    fontSize: 12,
  },

  interestTabs: {
    marginBottom: 14,
  },

  interestTabsContent: {
    gap: 8,
    paddingRight: 5,
  },

  interestTab: {
    paddingHorizontal: 16,
    height: 38,
    borderRadius: 20,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  interestTabSelected: {
    backgroundColor: colors.primary,
  },

  interestTabText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: "800",
  },

  interestTabTextSelected: {
    color: "#fff",
  },

  interestGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  interestCard: {
    width: "48%",
    minHeight: 52,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
  },

  interestCardSelected: {
    borderColor: colors.primary,
    backgroundColor: "#EFF6FF",
  },

  interestIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  interestIconSelected: {
    backgroundColor: colors.primary,
  },

  interestText: {
    flex: 1,
    color: colors.text,
    fontSize: 12,
    fontWeight: "700",
  },

  interestTextSelected: {
    color: colors.primary,
    fontWeight: "900",
  },

  interestHint: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 12,
    textAlign: "center",
  },

  /* NAVIGATION */

  navigationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 15,
  },

  navigationSpacer: {
    flex: 0.45,
  },

  backButton: {
    flex: 0.45,
    height: 55,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  backButtonText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "800",
  },

  nextButton: {
    flex: 1,
    height: 55,
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

  disabledButton: {
    opacity: 0.55,
  },

  buttonPressed: {
    opacity: 0.85,
    transform: [
      {
        scale: 0.99,
      },
    ],
  },

  /* PROGRESS */

  progressArea: {
    marginTop: 18,
  },

  progressTrack: {
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E2E8F0",
    overflow: "hidden",
  },

  progressFill: {
    height: "100%",
    borderRadius: 3,
    backgroundColor: colors.primary,
  },

  progressText: {
    textAlign: "center",
    color: colors.muted,
    fontSize: 10,
    fontWeight: "700",
    marginTop: 7,
  },

  bottomText: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    textAlign: "center",
    marginTop: 14,
    paddingHorizontal: 20,
  },

  /* EDUCATION MODAL */

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.48)",
    justifyContent: "flex-end",
  },

  educationModal: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    maxHeight: "88%",
    paddingTop: 10,
    paddingHorizontal: 18,
    paddingBottom: 25,
  },

  educationModalTablet: {
    width: 560,
    maxHeight: "82%",
    alignSelf: "center",
    marginBottom: 20,
    borderRadius: 28,
  },

  modalHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 16,
  },

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },

  modalTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: "900",
  },

  modalSubtitle: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 3,
  },

  modalCloseButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },

  educationSearchWrapper: {
    height: 50,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    marginBottom: 12,
  },

  educationSearchInput: {
    flex: 1,
    height: 50,
    marginLeft: 9,
    color: colors.text,
    fontSize: 14,
  },

  educationList: {
    paddingBottom: 15,
    gap: 8,
  },

  educationOption: {
    minHeight: 57,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 15,
    backgroundColor: "#fff",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 11,
  },

  educationOptionSelected: {
    borderColor: colors.primary,
    backgroundColor: "#EFF6FF",
  },

  educationOptionIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: "#F8FAFC",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },

  educationOptionIconSelected: {
    backgroundColor: "#DBEAFE",
  },

  educationOptionText: {
    flex: 1,
    color: colors.text,
    fontSize: 14,
    fontWeight: "700",
  },

  educationOptionTextSelected: {
    color: colors.primary,
    fontWeight: "900",
  },

  noEducation: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 45,
  },

  noEducationTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "900",
    marginTop: 10,
  },

  noEducationText: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 4,
  },
});
