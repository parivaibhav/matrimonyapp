import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
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

export default function ProfileScreen({ setLoggedIn }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingBiodata, setUploadingBiodata] = useState(false);

  // Modern Toast state
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    title: "",
    message: "",
    type: "success",
  });

  const showToast = (title, message, type = "success") => {
    setToastConfig({
      visible: true,
      title,
      message,
      type,
    });
  };

  const hideToast = () => {
    setToastConfig((prev) => ({ ...prev, visible: false }));
  };

  // Edit profile state
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({});

  const { isSmallPhone, isTablet, maxContentWidth } = useResponsiveLayout();

  const loadCurrentUser = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/profiles/me/current");
      setUser(data);
      setEditForm(data || {});
    } catch (e) {
      console.log("Error fetching profile:", e);
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadCurrentUser();
    }, [])
  );

  // Pick & Upload Profile Photo using rock-solid native fetch FormData
  const handleUploadPhoto = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        showToast("Permission Required", "Please allow photo library access to change profile photo.", "error");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setUploadingPhoto(true);

      const token = await AsyncStorage.getItem("token");
      let fileUri = asset.uri;
      if (Platform.OS === "android" && !fileUri.startsWith("file://") && !fileUri.startsWith("content://")) {
        fileUri = `file://${fileUri}`;
      }

      const filename = asset.fileName || asset.uri.split("/").pop() || `photo_${Date.now()}.jpg`;
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
        if (data.user) {
          setUser(data.user);
        } else if (data.profilePhoto) {
          setUser((prev) => ({ ...prev, profilePhoto: data.profilePhoto }));
        }
        showToast("Success 🎉", "Profile photo updated successfully!", "success");
      } else {
        showToast("Upload Failed", data.message || "Could not upload profile photo.", "error");
      }
    } catch (e) {
      console.log("Photo upload error:", e);
      showToast("Upload Failed", "Photo upload failed. Please try again.", "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  // Pick & Upload Biodata File (PDF/Doc/Image) using rock-solid native fetch FormData
  const handleUploadBiodata = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "*/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets?.[0]) return;

      const asset = result.assets[0];
      setUploadingBiodata(true);

      const token = await AsyncStorage.getItem("token");
      let fileUri = asset.uri;
      if (Platform.OS === "android" && !fileUri.startsWith("file://") && !fileUri.startsWith("content://")) {
        fileUri = `file://${fileUri}`;
      }

      const filename = asset.name || `biodata_${Date.now()}.${asset.mimeType?.split('/')[1] || 'pdf'}`;
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
        if (data.user) {
          setUser(data.user);
        } else if (data.biodataUrl) {
          setUser((prev) => ({ ...prev, biodataUrl: data.biodataUrl }));
        }
        showToast("Success 🎉", "Biodata document uploaded successfully!", "success");
      } else {
        showToast("Upload Failed", data.message || "Could not upload biodata document.", "error");
      }
    } catch (e) {
      console.log("Biodata upload error:", e);
      showToast("Upload Error", "Failed to upload biodata file. Please try again.", "error");
    } finally {
      setUploadingBiodata(false);
    }
  };

  // Save updated profile info
  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      const { data } = await api.put("/profiles/me", editForm);
      setUser(data);
      setIsEditing(false);
      showToast("Profile Updated ✨", "Your profile details have been saved.", "success");
    } catch (e) {
      showToast("Error", e.response?.data?.message || "Failed to update profile.", "error");
    } finally {
      setSaving(false);
    }
  };

  // Logout handler with confirmation
  const handleLogout = () => {
    Alert.alert("Logout Confirmation", "Are you sure you want to log out of your account?", [
      { text: "Cancel", style: "cancel" },
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

  if (loading && !user) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      {/* Modern Animated Toast Overlay */}
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
        <View style={[styles.container, { maxWidth: maxContentWidth }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, isSmallPhone && { fontSize: 24 }]}>My Profile</Text>
            <Pressable
              style={({ pressed }) => [styles.editBtn, pressed && { opacity: 0.7 }]}
              onPress={() => {
                setEditForm(user || {});
                setIsEditing(true);
              }}
            >
              <Ionicons name="create-outline" size={18} color={colors.primary} />
              <Text style={styles.editBtnText}>Edit</Text>
            </Pressable>
          </View>

          {/* Profile Card Header */}
          <View style={styles.profileHeroCard}>
            <View style={styles.avatarWrapper}>
              {user?.profilePhoto ? (
                <Image
                  source={{ uri: imageUrl(user.profilePhoto) }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarFallback}>
                  <Text style={styles.avatarText}>
                    {user?.fullName ? user.fullName.charAt(0).toUpperCase() : "U"}
                  </Text>
                </View>
              )}

              {/* Camera Upload Badge */}
              <Pressable
                style={({ pressed }) => [styles.cameraBadge, pressed && { opacity: 0.8 }]}
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

            <Text style={styles.userName}>{user?.fullName || "User Profile"}</Text>
            <Text style={styles.userHeadline}>
              {user?.age ? `${user.age} yrs` : ""} {user?.occupation ? `• ${user.occupation}` : ""} {user?.city ? `• ${user.city}` : ""}
            </Text>

            <Pressable style={styles.uploadPhotoTextBtn} onPress={handleUploadPhoto} disabled={uploadingPhoto}>
              <Text style={styles.uploadPhotoText}>
                {uploadingPhoto ? "Uploading Photo..." : "Tap to Change Profile Photo"}
              </Text>
            </Pressable>
          </View>

          {/* Biodata Upload Card */}
          <View style={styles.biodataCard}>
            <View style={styles.biodataHeaderRow}>
              <View style={styles.biodataIconBox}>
                <Ionicons name="document-attach" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.biodataCardTitle}>Matrimonial Biodata</Text>
                <Text style={styles.biodataCardSub}>
                  {user?.biodataUrl ? "Biodata document attached ✓" : "Upload PDF or image of your full biodata"}
                </Text>
              </View>
            </View>

            {user?.biodataUrl ? (
              <View style={styles.biodataAttachedBox}>
                <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
                <Text style={styles.biodataAttachedText} numberOfLines={1}>
                  {user.biodataUrl.split("/").pop()}
                </Text>
              </View>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.biodataUploadBtn,
                pressed && { opacity: 0.85 },
              ]}
              onPress={handleUploadBiodata}
              disabled={uploadingBiodata}
            >
              {uploadingBiodata ? (
                <ActivityIndicator size="small" color={colors.primary} />
              ) : (
                <>
                  <Ionicons name="cloud-upload-outline" size={18} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={styles.biodataUploadBtnText}>
                    {user?.biodataUrl ? "Replace Biodata Document" : "Upload Biodata File"}
                  </Text>
                </>
              )}
            </Pressable>
          </View>

          {/* User Personal Info Details */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>Personal Details</Text>

            <InfoRow label="Email" value={user?.email} icon="mail-outline" />
            <InfoRow label="Phone" value={user?.phone} icon="call-outline" />
            <InfoRow label="Gender" value={user?.gender} icon="person-outline" />
            <InfoRow label="Age" value={user?.age ? `${user.age} yrs` : null} icon="calendar-outline" />
            <InfoRow label="Education" value={user?.education} icon="school-outline" />
            <InfoRow label="Occupation" value={user?.occupation} icon="briefcase-outline" />
            <InfoRow label="City" value={user?.city} icon="location-outline" />
            <InfoRow label="Height" value={user?.height} icon="resize-outline" />
            <InfoRow label="Religion" value={user?.religion} icon="book-outline" />
            <InfoRow label="Community" value={user?.community} icon="people-outline" />
          </View>

          {/* Bio Card */}
          <View style={styles.infoCard}>
            <Text style={styles.infoCardTitle}>About Me</Text>
            <View style={styles.textSection}>
              <Text style={styles.textBody}>{user?.bio || "No bio added yet."}</Text>
            </View>
          </View>

          {/* Logout Action */}
          <Pressable
            style={({ pressed }) => [styles.logoutBtn, pressed && { opacity: 0.85 }]}
            onPress={handleLogout}
          >
            <Ionicons name="log-out-outline" size={20} color="#D32F2F" style={{ marginRight: 8 }} />
            <Text style={styles.logoutBtnText}>Log Out</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={isEditing} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.screen}>
          <View style={styles.modalHeader}>
            <Pressable onPress={() => setIsEditing(false)}>
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

          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Name</Text>
              <TextInput
                style={styles.input}
                value={editForm.fullName || ""}
                onChangeText={(text) => setEditForm((p) => ({ ...p, fullName: text }))}
                placeholder="Enter full name"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Age</Text>
              <TextInput
                style={styles.input}
                value={editForm.age ? String(editForm.age) : ""}
                onChangeText={(text) => setEditForm((p) => ({ ...p, age: Number(text) || "" }))}
                keyboardType="numeric"
                placeholder="Enter age"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>City / Location</Text>
              <TextInput
                style={styles.input}
                value={editForm.city || ""}
                onChangeText={(text) => setEditForm((p) => ({ ...p, city: text }))}
                placeholder="Enter city"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Education</Text>
              <TextInput
                style={styles.input}
                value={editForm.education || ""}
                onChangeText={(text) => setEditForm((p) => ({ ...p, education: text }))}
                placeholder="Degree / Qualification"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Occupation</Text>
              <TextInput
                style={styles.input}
                value={editForm.occupation || ""}
                onChangeText={(text) => setEditForm((p) => ({ ...p, occupation: text }))}
                placeholder="Current job / profession"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Height</Text>
              <TextInput
                style={styles.input}
                value={editForm.height || ""}
                onChangeText={(text) => setEditForm((p) => ({ ...p, height: text }))}
                placeholder="e.g. 5 ft 8 in"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Religion</Text>
              <TextInput
                style={styles.input}
                value={editForm.religion || ""}
                onChangeText={(text) => setEditForm((p) => ({ ...p, religion: text }))}
                placeholder="e.g. Hindu, Sikh, Muslim"
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Community / Caste</Text>
              <TextInput
                style={styles.input}
                value={editForm.community || ""}
                onChangeText={(text) => setEditForm((p) => ({ ...p, community: text }))}
                placeholder="e.g. Brahmin, Jat, etc."
              />
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Bio</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.bio || ""}
                onChangeText={(text) => setEditForm((p) => ({ ...p, bio: text }))}
                multiline
                numberOfLines={3}
                placeholder="Write a brief introduction about yourself..."
              />
            </View>

            <View style={[styles.fieldGroup, { marginBottom: 40 }]}>
              <Text style={styles.fieldLabel}>Family Details</Text>
              <TextInput
                style={[styles.input, styles.textArea]}
                value={editForm.familyDetails || ""}
                onChangeText={(text) => setEditForm((p) => ({ ...p, familyDetails: text }))}
                multiline
                numberOfLines={3}
                placeholder="Family background, members, values..."
              />
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function InfoRow({ label, value, icon }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoRowLeft}>
        <Ionicons name={icon} size={16} color={colors.primary} style={{ marginRight: 8 }} />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value || "Not set"}</Text>
    </View>
  );
}

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
    paddingBottom: 40,
  },
  container: {
    width: "100%",
    alignSelf: "center",
  },
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
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EFF6FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  editBtnText: {
    color: colors.primary,
    fontWeight: "700",
    fontSize: 14,
  },
  profileHeroCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    padding: 20,
    alignItems: "center",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: 12,
  },
  avatarImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.border,
  },
  avatarFallback: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#EFF6FF",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontSize: 36,
    fontWeight: "900",
    color: colors.primary,
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  userName: {
    fontSize: 22,
    fontWeight: "900",
    color: colors.text,
    textAlign: "center",
  },
  userHeadline: {
    fontSize: 14,
    color: colors.muted,
    marginTop: 4,
    textAlign: "center",
    fontWeight: "500",
  },
  uploadPhotoTextBtn: {
    marginTop: 10,
  },
  uploadPhotoText: {
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },
  biodataCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 16,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#EFF6FF",
    alignItems: "center",
    justifyContent: "center",
  },
  biodataCardTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
  },
  biodataCardSub: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },
  biodataAttachedBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 12,
    gap: 6,
  },
  biodataAttachedText: {
    color: "#2E7D32",
    fontSize: 13,
    fontWeight: "700",
    flex: 1,
  },
  biodataUploadBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#EFF6FF",
    height: 42,
    borderRadius: 21,
    marginTop: 12,
  },
  biodataUploadBtnText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 13,
  },
  infoCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  infoCardTitle: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  infoRowLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 14,
    color: colors.muted,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "700",
    color: colors.text,
  },
  textSection: {
    marginTop: 4,
  },
  textLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.muted,
    marginBottom: 4,
  },
  textBody: {
    fontSize: 14,
    color: colors.text,
    lineHeight: 20,
    backgroundColor: "#FAF6F8",
    padding: 12,
    borderRadius: 12,
  },
  logoutBtn: {
    flexDirection: "row",
    backgroundColor: "#FFEBEE",
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 20,
  },
  logoutBtnText: {
    color: "#D32F2F",
    fontWeight: "800",
    fontSize: 15,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F0E6E9",
    backgroundColor: "#FFFFFF",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: colors.text,
  },
  modalCancelText: {
    color: colors.muted,
    fontSize: 15,
    fontWeight: "600",
  },
  modalSaveText: {
    color: colors.primary,
    fontSize: 15,
    fontWeight: "800",
  },
  modalContent: {
    padding: 20,
  },
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 6,
  },
  input: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E0D0D5",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text,
  },
  textArea: {
    height: 80,
    textAlignVertical: "top",
  },
});
