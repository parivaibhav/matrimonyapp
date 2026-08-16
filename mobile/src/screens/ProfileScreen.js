import React, { useCallback, useState } from "react";
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
import { useFocusEffect } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";

import { API_URL, api, imageUrl } from "../api";
import { colors } from "../theme";
import { useResponsiveLayout } from "../utils/responsive";
import Toast from "../components/Toast";

// =====================================================
// OPTIONS
// =====================================================

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

const GENDER_OPTIONS = ["Male", "Female"];

// =====================================================
// MAIN
// =====================================================

export default function ProfileScreen({ setLoggedIn }) {
  const [user, setUser] = useState(null);

  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingBiodata, setUploadingBiodata] = useState(false);

  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  const [editForm, setEditForm] = useState({});

  const [openDropdown, setOpenDropdown] = useState(null);

  const [toastConfig, setToastConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

  const { isSmallPhone, maxContentWidth } = useResponsiveLayout();

  // =====================================================
  // TOAST
  // =====================================================

  const showToast = (title, message, type = "success") => {
    setToastConfig({
      visible: true,
      title,
      message,
      type,
    });
  };

  const hideToast = () => {
    setToastConfig((prev) => ({
      ...prev,
      visible: false,
    }));
  };

  // =====================================================
  // LOAD PROFILE
  // =====================================================

  const loadCurrentUser = async () => {
    try {
      setLoading(true);

      const { data } = await api.get("/profiles/me/current");

      setUser(data);
      setEditForm(data || {});
    } catch (error) {
      console.log("Error fetching profile:", error);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCurrentUser();
    }, []),
  );

  // =====================================================
  // UPDATE FIELD
  // =====================================================

  const updateField = (key, value) => {
    setEditForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // =====================================================
  // PHOTO
  // =====================================================

  const handleUploadPhoto = async () => {
    try {
      const permissionResult =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permissionResult.granted) {
        showToast(
          "Permission Required",
          "Please allow photo library access.",
          "error",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];

      setUploadingPhoto(true);

      const token = await AsyncStorage.getItem("token");

      let fileUri = asset.uri;

      if (
        Platform.OS === "android" &&
        !fileUri.startsWith("file://") &&
        !fileUri.startsWith("content://")
      ) {
        fileUri = `file://${fileUri}`;
      }

      const filename =
        asset.fileName ||
        asset.uri.split("/").pop() ||
        `photo_${Date.now()}.jpg`;

      const fileType = asset.mimeType || "image/jpeg";

      const formData = new FormData();

      formData.append("photo", {
        uri: fileUri,
        name: filename,
        type: fileType,
      });

      const response = await fetch(`${API_URL}/profiles/me/photo`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const updatedUser = data.user || {
          ...user,
          profilePhoto: data.profilePhoto,
        };

        setUser(updatedUser);
        setEditForm(updatedUser);

        showToast(
          "Success 🎉",
          "Profile photo updated successfully!",
          "success",
        );
      } else {
        showToast(
          "Upload Failed",
          data.message || "Could not upload profile photo.",
          "error",
        );
      }
    } catch (error) {
      console.log("Photo upload error:", error);

      showToast(
        "Upload Failed",
        "Photo upload failed. Please try again.",
        "error",
      );
    } finally {
      setUploadingPhoto(false);
    }
  };

  // =====================================================
  // BIODATA
  // =====================================================

  const handleUploadBiodata = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: [
          "application/pdf",
          "image/*",
          "application/msword",
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        ],
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) {
        return;
      }

      const asset = result.assets[0];

      setUploadingBiodata(true);

      const token = await AsyncStorage.getItem("token");

      let fileUri = asset.uri;

      if (
        Platform.OS === "android" &&
        !fileUri.startsWith("file://") &&
        !fileUri.startsWith("content://")
      ) {
        fileUri = `file://${fileUri}`;
      }

      const filename = asset.name || `biodata_${Date.now()}.pdf`;

      const fileType = asset.mimeType || "application/pdf";

      const formData = new FormData();

      formData.append("biodata", {
        uri: fileUri,
        name: filename,
        type: fileType,
      });

      const response = await fetch(`${API_URL}/profiles/me/biodata`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const updatedUser = data.user || {
          ...user,
          biodataUrl: data.biodataUrl,
        };

        setUser(updatedUser);
        setEditForm(updatedUser);

        showToast("Success 🎉", "Biodata uploaded successfully!", "success");
      } else {
        showToast(
          "Upload Failed",
          data.message || "Could not upload biodata.",
          "error",
        );
      }
    } catch (error) {
      console.log("Biodata upload error:", error);

      showToast("Upload Error", "Failed to upload biodata file.", "error");
    } finally {
      setUploadingBiodata(false);
    }
  };

  // =====================================================
  // SAVE PROFILE
  // =====================================================

  const handleSaveProfile = async () => {
    try {
      if (!editForm.fullName?.trim()) {
        showToast("Required", "Please enter your full name.", "error");
        return;
      }

      if (
        editForm.age === undefined ||
        editForm.age === null ||
        editForm.age === ""
      ) {
        showToast("Required", "Please enter your age.", "error");
        return;
      }

      const age = Number(editForm.age);

      if (Number.isNaN(age) || age < 18) {
        showToast("Invalid Age", "You must be at least 18 years old.", "error");
        return;
      }

      if (!editForm.phone?.trim()) {
        showToast("Required", "Please enter your phone number.", "error");
        return;
      }

      if (!editForm.gender || !GENDER_OPTIONS.includes(editForm.gender)) {
        showToast("Required", "Please select your gender.", "error");
        return;
      }

      setSaving(true);

      const payload = {
        fullName: editForm.fullName.trim(),

        age,

        gender: editForm.gender,

        phone: editForm.phone.trim(),

        education: editForm.education?.trim() || "",

        occupation: editForm.occupation?.trim() || "",

        city: editForm.city?.trim() || "",

        height: editForm.height?.trim() || "",

        dashaNam: editForm.dashaNam || "",

        fatherName: editForm.fatherName?.trim() || "",

        motherName: editForm.motherName?.trim() || "",

        fatherMobile: editForm.fatherMobile?.trim() || "",

        bio: editForm.bio?.trim() || "",

        familyDetails: editForm.familyDetails?.trim() || "",

        interests: Array.isArray(editForm.interests)
          ? editForm.interests
          : typeof editForm.interests === "string"
            ? editForm.interests
                .split(",")
                .map((x) => x.trim())
                .filter(Boolean)
            : [],
      };

      const { data } = await api.put("/profiles/me", payload);

      // IMPORTANT:
      // Backend returns:
      // { message, user }

      const updatedUser = data.user;

      setUser(updatedUser);
      setEditForm(updatedUser);

      setIsEditing(false);
      setOpenDropdown(null);

      showToast(
        "Profile Updated ✨",
        "Your profile details have been saved.",
        "success",
      );
    } catch (error) {
      console.log("Profile update error:", error);

      showToast(
        "Error",
        error.response?.data?.message || "Failed to update profile.",
        "error",
      );
    } finally {
      setSaving(false);
    }
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    Alert.alert("Logout Confirmation", "Are you sure you want to log out?", [
      {
        text: "Cancel",
        style: "cancel",
      },
      {
        text: "Logout",
        style: "destructive",
        onPress: async () => {
          await AsyncStorage.multiRemove(["token", "user"]);

          setLoggedIn(false);
        },
      },
    ]);
  };

  // =====================================================
  // DROPDOWN
  // =====================================================

  const renderDropdown = (field, label, options, placeholder) => {
    const isOpen = openDropdown === field;

    return (
      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>{label}</Text>

        <Pressable
          style={[styles.dropdownButton, isOpen && styles.dropdownButtonActive]}
          onPress={() => setOpenDropdown(isOpen ? null : field)}
        >
          <Text
            style={[
              styles.dropdownText,
              !editForm[field] && styles.placeholderText,
            ]}
          >
            {editForm[field] || placeholder}
          </Text>

          <Ionicons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={19}
            color={colors.muted}
          />
        </Pressable>

        {isOpen && (
          <View style={styles.dropdownList}>
            <ScrollView
              nestedScrollEnabled
              style={{
                maxHeight: 230,
              }}
              keyboardShouldPersistTaps="handled"
            >
              {options.map((item) => (
                <Pressable
                  key={item}
                  style={[
                    styles.dropdownItem,
                    editForm[field] === item && styles.dropdownItemSelected,
                  ]}
                  onPress={() => {
                    updateField(field, item);
                    setOpenDropdown(null);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownItemText,
                      editForm[field] === item &&
                        styles.dropdownItemTextSelected,
                    ]}
                  >
                    {item}
                  </Text>

                  {editForm[field] === item && (
                    <Ionicons
                      name="checkmark"
                      size={19}
                      color={colors.primary}
                    />
                  )}
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}
      </View>
    );
  };

  // =====================================================
  // INPUT
  // =====================================================

  const renderInput = (label, field, placeholder, keyboardType = "default") => (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>

      <TextInput
        style={styles.input}
        value={editForm[field] != null ? String(editForm[field]) : ""}
        onChangeText={(text) => updateField(field, text)}
        placeholder={placeholder}
        placeholderTextColor="#94A3B8"
        keyboardType={keyboardType}
      />
    </View>
  );

  // =====================================================
  // LOADING
  // =====================================================

  if (loading && !user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />

        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <Toast
        visible={toastConfig.visible}
        title={toastConfig.title}
        message={toastConfig.message}
        type={toastConfig.type}
        onDismiss={hideToast}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View
          style={[
            styles.container,
            {
              maxWidth: maxContentWidth,
            },
          ]}
        >
          {/* HEADER */}

          <View style={styles.header}>
            <View>
              <Text
                style={[
                  styles.title,
                  isSmallPhone && {
                    fontSize: 25,
                  },
                ]}
              >
                My Profile
              </Text>

              <Text style={styles.headerSub}>
                Manage your matrimonial profile
              </Text>
            </View>

            <Pressable
              style={styles.editBtn}
              onPress={() => {
                setEditForm(user || {});
                setOpenDropdown(null);
                setIsEditing(true);
              }}
            >
              <Ionicons
                name="create-outline"
                size={18}
                color={colors.primary}
              />

              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          </View>

          {/* HERO */}

          <View style={styles.profileHeroCard}>
            <View style={styles.avatarWrapper}>
              {user?.profilePhoto ? (
                <Image
                  source={{
                    uri: imageUrl(user.profilePhoto),
                  }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>
                    {user?.fullName
                      ? user.fullName.charAt(0).toUpperCase()
                      : "U"}
                  </Text>
                </View>
              )}

              <Pressable
                style={styles.cameraBadge}
                onPress={handleUploadPhoto}
                disabled={uploadingPhoto}
              >
                {uploadingPhoto ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Ionicons name="camera" size={16} color="#FFFFFF" />
                )}
              </Pressable>
            </View>

            <Text style={styles.userName}>
              {user?.fullName || "User Profile"}
            </Text>

            <Text style={styles.userHeadline}>
              {user?.age ? `${user.age} yrs` : ""}
              {user?.occupation ? ` • ${user.occupation}` : ""}
              {user?.city ? ` • ${user.city}` : ""}
            </Text>

            {user?.dashaNam && (
              <View style={styles.dashaBadge}>
                <Ionicons
                  name="leaf-outline"
                  size={14}
                  color={colors.primary}
                />

                <Text style={styles.dashaBadgeText}>{user.dashaNam}</Text>
              </View>
            )}

            <Pressable
              style={styles.uploadPhotoTextBtn}
              onPress={handleUploadPhoto}
              disabled={uploadingPhoto}
            >
              <Ionicons
                name="camera-outline"
                size={14}
                color={colors.primary}
              />

              <Text style={styles.uploadPhotoText}>
                {uploadingPhoto ? "Uploading..." : "Change Profile Photo"}
              </Text>
            </Pressable>
          </View>

          {/* BIODATA */}

          <View style={styles.biodataCard}>
            <View style={styles.biodataHeaderRow}>
              <View style={styles.biodataIconBox}>
                <Ionicons
                  name="document-text-outline"
                  size={22}
                  color={colors.primary}
                />
              </View>

              <View
                style={{
                  flex: 1,
                }}
              >
                <Text style={styles.biodataCardTitle}>Matrimonial Biodata</Text>

                <Text style={styles.biodataCardSub}>
                  {user?.biodataUrl
                    ? "Your biodata document is attached"
                    : "Upload your PDF or biodata image"}
                </Text>
              </View>
            </View>

            {user?.biodataUrl && (
              <View style={styles.biodataAttachedBox}>
                <Ionicons name="checkmark-circle" size={18} color="#16A34A" />

                <Text style={styles.biodataAttachedText} numberOfLines={1}>
                  {user.biodataUrl.split("/").pop()}
                </Text>
              </View>
            )}

            <Pressable
              style={styles.biodataUploadBtn}
              onPress={handleUploadBiodata}
              disabled={uploadingBiodata}
            >
              {uploadingBiodata ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons
                    name="cloud-upload-outline"
                    size={18}
                    color={colors.primary}
                  />

                  <Text style={styles.biodataUploadBtnText}>
                    {user?.biodataUrl ? "Replace Biodata" : "Upload Biodata"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* PERSONAL */}

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Personal Details</Text>

            <InfoRow label="Email" value={user?.email} icon="mail-outline" />

            <InfoRow label="Phone" value={user?.phone} icon="call-outline" />

            <InfoRow
              label="Gender"
              value={user?.gender}
              icon="person-outline"
            />

            <InfoRow
              label="Age"
              value={user?.age ? `${user.age} yrs` : null}
              icon="calendar-outline"
            />

            <InfoRow
              label="Education"
              value={user?.education}
              icon="school-outline"
            />

            <InfoRow
              label="Occupation"
              value={user?.occupation}
              icon="briefcase-outline"
            />

            <InfoRow label="City" value={user?.city} icon="location-outline" />

            <InfoRow
              label="Height"
              value={user?.height}
              icon="resize-outline"
            />

            <InfoRow
              label="Dasha Nam"
              value={user?.dashaNam}
              icon="leaf-outline"
            />
          </View>

          {/* FAMILY */}

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Family Details</Text>

            <InfoRow
              label="Father"
              value={user?.fatherName}
              icon="man-outline"
            />

            <InfoRow
              label="Father Mobile"
              value={user?.fatherMobile}
              icon="call-outline"
            />

            <InfoRow
              label="Mother"
              value={user?.motherName}
              icon="woman-outline"
            />

            <View style={styles.familyTextBox}>
              <Text style={styles.familyTextLabel}>Family Background</Text>

              <Text style={styles.textBody}>
                {user?.familyDetails || "No family details added yet."}
              </Text>
            </View>
          </View>

          {/* ABOUT */}

          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>About Me</Text>

            <Text style={styles.textBody}>
              {user?.bio || "No bio added yet."}
            </Text>
          </View>

          {/* LOGOUT */}

          <Pressable style={styles.logoutBtn} onPress={handleLogout}>
            <Ionicons name="log-out-outline" size={20} color="#DC2626" />

            <Text style={styles.logoutBtnText}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* =====================================================
          EDIT MODAL
      ===================================================== */}

      <Modal
        visible={isEditing}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <SafeAreaView style={styles.screen}>
          <KeyboardAvoidingView
            style={{
              flex: 1,
            }}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <View style={styles.modalHeader}>
              <Pressable
                onPress={() => {
                  setIsEditing(false);
                  setOpenDropdown(null);
                }}
              >
                <Text style={styles.modalCancelText}>Cancel</Text>
              </Pressable>

              <Text style={styles.modalTitle}>Edit Profile</Text>

              <Pressable onPress={handleSaveProfile} disabled={saving}>
                {saving ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={styles.modalSaveText}>Save</Text>
                )}
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalContent}
              contentContainerStyle={{
                paddingBottom: 50,
              }}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Basic Information</Text>

                <Text style={styles.sectionSub}>
                  Keep your profile details accurate
                </Text>
              </View>

              {renderInput("Full Name", "fullName", "Enter full name")}

              {renderInput("Age", "age", "Enter age", "numeric")}

              {renderDropdown(
                "gender",
                "Gender",
                GENDER_OPTIONS,
                "Select gender",
              )}

              {renderInput(
                "Phone Number",
                "phone",
                "Enter phone number",
                "phone-pad",
              )}

              <View style={styles.readOnlyBox}>
                <View style={styles.readOnlyIcon}>
                  <Ionicons
                    name="mail-outline"
                    size={18}
                    color={colors.primary}
                  />
                </View>

                <View
                  style={{
                    flex: 1,
                  }}
                >
                  <Text style={styles.readOnlyLabel}>Email</Text>

                  <Text style={styles.readOnlyValue}>
                    {editForm.email || "Not available"}
                  </Text>
                </View>

                <Text style={styles.readOnlyBadge}>Account</Text>
              </View>

              {renderInput("City / Location", "city", "Enter city")}

              {renderInput("Height", "height", "e.g. 5 ft 8 in")}

              {/* EDUCATION */}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Education & Career</Text>
              </View>

              {renderDropdown(
                "education",
                "Education",
                EDUCATION_OPTIONS,
                "Select education",
              )}

              {renderInput(
                "Occupation",
                "occupation",
                "Current job / profession",
              )}

              {/* DASHANAM */}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Dasha Nam</Text>

                <Text style={styles.sectionSub}>
                  Select your Dashanami tradition
                </Text>
              </View>

              {renderDropdown(
                "dashaNam",
                "Dasha Nam",
                DASHANAM_OPTIONS,
                "Select Dasha Nam",
              )}

              {/* FAMILY */}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Family Information</Text>

                <Text style={styles.sectionSub}>
                  These details help families connect
                </Text>
              </View>

              {renderInput("Father Name", "fatherName", "Enter father's name")}

              {renderInput("Mother Name", "motherName", "Enter mother's name")}

              {renderInput(
                "Father Mobile Number",
                "fatherMobile",
                "Enter father's mobile number",
                "phone-pad",
              )}

              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Family Details</Text>

                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editForm.familyDetails || ""}
                  onChangeText={(text) => updateField("familyDetails", text)}
                  multiline
                  numberOfLines={4}
                  placeholder="Family background, members, values..."
                  placeholderTextColor="#94A3B8"
                />
              </View>

              {/* ABOUT */}

              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>About You</Text>
              </View>

              <View
                style={[
                  styles.fieldGroup,
                  {
                    marginBottom: 30,
                  },
                ]}
              >
                <Text style={styles.fieldLabel}>Short Bio</Text>

                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={editForm.bio || ""}
                  onChangeText={(text) => updateField("bio", text)}
                  multiline
                  numberOfLines={5}
                  placeholder="Write a brief introduction about yourself..."
                  placeholderTextColor="#94A3B8"
                />
              </View>

              <Pressable
                style={[
                  styles.bottomSaveButton,
                  saving && styles.disabledButton,
                ]}
                onPress={handleSaveProfile}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons
                      name="checkmark-circle-outline"
                      size={20}
                      color="#FFFFFF"
                    />

                    <Text style={styles.bottomSaveText}>Save Profile</Text>
                  </>
                )}
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

// =====================================================
// INFO ROW
// =====================================================

function InfoRow({ label, value, icon }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        <View style={styles.infoIcon}>
          <Ionicons name={icon} size={16} color={colors.primary} />
        </View>

        <Text style={styles.infoLabel}>{label}</Text>
      </View>

      <Text style={styles.infoValue} numberOfLines={2}>
        {value || "Not set"}
      </Text>
    </View>
  );
}

// =====================================================
// STYLES
// =====================================================

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
    marginTop: 12,
    fontSize: 15,
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 50,
  },

  container: {
    width: "100%",
    alignSelf: "center",
  },

  // =====================================================
  // HEADER
  // =====================================================

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
    paddingTop: 6,
  },

  title: {
    fontSize: 30,
    fontWeight: "900",
    color: colors.text,
  },

  headerSub: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 13,
  },

  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryLight,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 20,
    gap: 5,
  },

  editBtnText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 14,
  },

  // =====================================================
  // HERO
  // =====================================================

  profileHeroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  avatarWrapper: {
    position: "relative",
    marginBottom: 14,
  },

  avatarImage: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: "#E2E8F0",
  },

  avatarFallback: {
    width: 112,
    height: 112,
    borderRadius: 56,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },

  avatarText: {
    fontSize: 42,
    fontWeight: "900",
    color: colors.primary,
  },

  cameraBadge: {
    position: "absolute",
    right: 2,
    bottom: 3,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },

  userName: {
    fontSize: 23,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
  },

  userHeadline: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 5,
    textAlign: "center",
  },

  dashaBadge: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.primaryLight,
  },

  dashaBadgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: "800",
  },

  uploadPhotoTextBtn: {
    marginTop: 13,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },

  uploadPhotoText: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.primary,
  },

  // =====================================================
  // BIODATA
  // =====================================================

  biodataCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 17,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  biodataHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  biodataIconBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },

  biodataCardTitle: {
    fontSize: 16,
    fontWeight: "900",
    color: colors.text,
  },

  biodataCardSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 3,
  },

  biodataAttachedBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginTop: 13,
    gap: 7,
  },

  biodataAttachedText: {
    color: "#15803D",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },

  biodataUploadBtn: {
    height: 44,
    borderRadius: 14,
    backgroundColor: colors.primaryLight,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 7,
    marginTop: 12,
  },

  biodataUploadBtnText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 13,
  },

  // =====================================================
  // INFO
  // =====================================================

  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },

  infoCardTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
    marginBottom: 9,
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },

  infoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: colors.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },

  infoLabel: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: "600",
  },

  infoValue: {
    fontSize: 13,
    color: colors.text,
    fontWeight: "800",
    textAlign: "right",
    maxWidth: "55%",
  },

  familyTextBox: {
    marginTop: 14,
  },

  familyTextLabel: {
    fontSize: 12,
    fontWeight: "800",
    color: colors.muted,
    marginBottom: 7,
  },

  textBody: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 21,
    backgroundColor: "#F8FAFC",
    padding: 13,
    borderRadius: 13,
  },

  // =====================================================
  // LOGOUT
  // =====================================================

  logoutBtn: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
  },

  logoutBtnText: {
    color: "#DC2626",
    fontWeight: "900",
    fontSize: 15,
  },

  // =====================================================
  // MODAL
  // =====================================================

  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E2E8F0",
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
  },

  modalCancelText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "700",
  },

  modalSaveText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "900",
  },

  modalContent: {
    padding: 20,
  },

  sectionHeader: {
    marginTop: 8,
    marginBottom: 14,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: colors.text,
  },

  sectionSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 3,
  },

  fieldGroup: {
    marginBottom: 16,
  },

  fieldLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 7,
  },

  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: colors.text,
    minHeight: 48,
  },

  textArea: {
    minHeight: 105,
    textAlignVertical: "top",
    paddingTop: 13,
  },

  // =====================================================
  // DROPDOWN
  // =====================================================

  dropdownButton: {
    minHeight: 50,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  dropdownButtonActive: {
    borderColor: colors.primary,
    backgroundColor: "#F8FBFF",
  },

  dropdownText: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    fontWeight: "600",
  },

  placeholderText: {
    color: "#94A3B8",
    fontWeight: "500",
  },

  dropdownList: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#CBD5E1",
    borderRadius: 14,
    marginTop: 6,
    overflow: "hidden",
  },

  dropdownItem: {
    minHeight: 46,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },

  dropdownItemSelected: {
    backgroundColor: colors.primaryLight,
  },

  dropdownItemText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "600",
  },

  dropdownItemTextSelected: {
    color: colors.primary,
    fontWeight: "800",
  },

  // =====================================================
  // READ ONLY EMAIL
  // =====================================================

  readOnlyBox: {
    minHeight: 62,
    borderRadius: 14,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },

  readOnlyIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: colors.primaryLight,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },

  readOnlyLabel: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: "700",
  },

  readOnlyValue: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "800",
    marginTop: 2,
  },

  readOnlyBadge: {
    fontSize: 10,
    color: colors.muted,
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    fontWeight: "700",
  },

  // =====================================================
  // SAVE
  // =====================================================

  bottomSaveButton: {
    height: 52,
    borderRadius: 16,
    backgroundColor: colors.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginBottom: 20,
  },

  bottomSaveText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "900",
  },

  disabledButton: {
    opacity: 0.6,
  },
});
